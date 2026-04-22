import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/(www\.)?findcar\.se$/,
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin))) {
    return origin;
  }
  return "https://smart-bil-sok.lovable.app";
}

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// --- Rate limiter per IP ---
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 20;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_REQUESTS;
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests) {
    if (now > record.resetAt) ipRequests.delete(ip);
  }
}, 60 * 1000);

// --- Input validation ---
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "messages must be an array" };
  }
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { valid: false, error: `messages must contain 1-${MAX_MESSAGES} items` };
  }
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: "Each message must be an object" };
    }
    if (typeof msg.content !== "string" || msg.content.length === 0) {
      return { valid: false, error: "Each message must have a non-empty content string" };
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message content must be under ${MAX_MESSAGE_LENGTH} characters` };
    }
    if (!["user", "assistant"].includes(msg.role)) {
      return { valid: false, error: "Each message must have role 'user' or 'assistant'" };
    }
  }
  return { valid: true };
}

// --- Filter validation ---
function sanitizeStringFilter(value: unknown, maxLen = 50): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  // Allow letters (including Swedish), spaces, hyphens
  if (!/^[a-zA-ZåäöÅÄÖéÉüÜ\s-]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitizeBudget(value: unknown): { min: number; max: number } | null {
  if (typeof value !== "string") return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 2 || parts.some(isNaN) || parts[0] < 0 || parts[1] < 0 || parts[1] > 100000000) {
    return null;
  }
  return { min: parts[0], max: parts[1] };
}

// Maps AI fuel keys to SQL ILIKE patterns matching actual DB values
// DB values: El, Bensin, Diesel, Hybrid bensin, Hybrid diesel, Hybrid gas,
//            Plug-in Bensin, Plug-in Diesel, Etanol (FFV, E85), Fordonsgas (CNG)
const fuelPatterns: Record<string, string[]> = {
  el: ["El"],                                    // exact match to avoid matching "Etanol"
  laddhybrid: ["Plug-in Bensin", "Plug-in Diesel"], // DB uses "Plug-in" not "Laddhybrid"
  hybrid: ["Hybrid bensin", "Hybrid diesel", "Hybrid gas"], // non-plug-in hybrids
  bensin: ["Bensin"],
  diesel: ["Diesel"],
};

const bodyPatterns: Record<string, string> = {
  suv: "%SUV%",
  kombi: "%Kombi%",
  sedan: "%Sedan%",
  halvkombi: "%Halvkombi%",
  coupe: "%Coup%",
  cab: "%Cab%",
  pickup: "%Pickup%",
  minibuss: "%Minibuss%",
  smabil: "%Småbil%",
};

const drivetrainPatterns: Record<string, string[]> = {
  awd: ["AWD", '"AWD"'],
  fwd: ["FWD", '"FWD"'],
  rwd: ["RWD", '"RWD"'],
};

// Equipment / tillval — mappar AI:s nyckel → SQL ILIKE-mönster mot model_raw
// Värdena är ALLA möjliga sätt tillvalet kan stavas i annonser (svenska + engelska + förkortningar).
const equipmentPatterns: Record<string, string[]> = {
  drag: ["drag", "dragkrok", "tow bar", "towbar", "tow-hitch"],
  varmare: ["värm", "motorvärm", "kupévärm", "webasto", "standheizung"],
  taklucka: ["pano", "panorama", "panoramic", "sunroof", "glasstak", "öppningsbart tak", "taklucka", "takluck"],
  skinn: ["skinn", "läder", "leather", "nappa", "alcantara"],
  rattvarme: ["rattvärm", "heated steering"],
  stolvarme: ["stolvärm", "sätesvärm", "heated seat"],
  kamera: ["kamera", "camera", "backkamera", "360", "surround view", "reverse cam"],
  navi: ["navi", "navigation", "gps", "carplay", "android auto"],
  hud: ["hud", "head-up", "head up"],
  parksensor: ["park assist", "p-sensor", "parkeringssens", "pdc", "park pilot"],
  blis: ["blis", "blind spot", "dödvink"],
  adaptiv_farthallare: ["acc", "adaptiv fart", "adaptive cruise", "distronic"],
  keyless: ["keyless", "nyckellös", "comfort access"],
  premium_audio: ["b&w", "bowers", "harman", "h/k", "burmester", "bose", "meridian", "bang & olufsen"],
  matrix_ljus: ["matrix", "led-strålk", "laserljus", "adaptive led"],
  voc: ["voc", "connected services", "remote app"],
  sport: ["m sport", "m-sport", "amg line", "amg", "r-design", "rdesign", "s-line", "sline", "polestar engineered", "st-line"],
  fyrhjulsstyrning: ["4ws", "fyrhjulsst", "rear-wheel steer", "all-wheel steer"],
  luftfjadring: ["luftfjädr", "air suspension", "airmatic"],
  sju_sits: ["7-sits", "7 sits", "seven seat", "7-seater", "7 seater", "tredje sätesrad"],
  momsbil: ["moms", "vat-qualifying"],
};

// Visningsetiketter på svenska för AI-promtpen och felmeddelanden
const equipmentLabels: Record<string, string> = {
  drag: "dragkrok",
  varmare: "motorvärmare",
  taklucka: "panoramatak",
  skinn: "skinnklädsel",
  rattvarme: "rattvärme",
  stolvarme: "stolvärme",
  kamera: "backkamera",
  navi: "navigation",
  hud: "head-up display",
  parksensor: "parkeringssensorer",
  blis: "döda vinkeln-varnare",
  adaptiv_farthallare: "adaptiv farthållare",
  keyless: "keyless",
  premium_audio: "premiumljud",
  matrix_ljus: "matrix-/LED-strålkastare",
  voc: "fjärrstyrning via app",
  sport: "sportpaket",
  fyrhjulsstyrning: "4-hjulsstyrning",
  luftfjadring: "luftfjädring",
  sju_sits: "7-sits",
  momsbil: "momsbil",
};

// Bygg ett OR-filter mot model_raw för flera tillval (alla mönster för alla nycklar OR:as ihop)
function buildEquipmentOrFilter(keys: string[]): string {
  const parts: string[] = [];
  for (const key of keys) {
    const patterns = equipmentPatterns[key];
    if (!patterns) continue;
    for (const p of patterns) {
      // Escapa specialtecken som %, _, , och ()
      const safe = p.replace(/[%_,()]/g, " ").trim();
      if (!safe) continue;
      parts.push(`model_raw.ilike.%${safe}%`);
    }
  }
  return parts.join(",");
}

// Postfilter i JS — säkrare matchning mot regex. Returnerar true om bilen matchar ALLA must-have-tillval.
function carHasAllEquipment(car: { model_raw: string | null }, mustHaveKeys: string[]): boolean {
  if (mustHaveKeys.length === 0) return true;
  const raw = (car.model_raw || "").toLowerCase();
  if (!raw) return false;
  for (const key of mustHaveKeys) {
    const patterns = equipmentPatterns[key];
    if (!patterns) continue;
    const found = patterns.some(p => raw.includes(p.toLowerCase()));
    if (!found) return false;
  }
  return true;
}

// Model names that imply a body type (used when body_type is Unknown/null)
const modelBodyTypeMap: Record<string, string[]> = {
  suv: [
    "XC90", "XC60", "XC40", "EX90", "EX60", "EX40", "EX30",
    "RAV4", "CR-V", "Tiguan", "Tucson", "Kona", "Sportage", "Niro",
    "Q3", "Q5", "Q7", "Q8", "X1", "X3", "X5", "X7",
    "GLC", "GLE", "GLB", "EQA", "EQB", "EQC",
    "Model Y", "Model X",
    "ID.4", "ID.5",
    "Enyaq", "Karoq", "Kodiaq",
    "Forester", "Outback",
    "Formentor", "Ateca", "Tarraco",
    "Polestar 3",
    "MG ZS", "MG HS", "MG4",
    "EV6", "EV9", "Sorento", "Stonic",
    "Arona", "Taigo",
    "Captur", "Kadjar", "Koleos", "Austral",
    "C5 Aircross", "3008", "5008",
    "Grandland", "Mokka", "Crossland",
    "Ioniq 5", "Ioniq 7",
    "bZ4X", "Yaris Cross", "C-HR",
    "Scala", "Kamiq",
    "Ceed SW", "Stinger",
    "Macan", "Cayenne",
    "Levante", "Grecale",
    "F-Pace", "E-Pace",
    "Urus", "DBX",
  ],
  kombi: [
    "V60", "V90", "V70", "V50", "V40",
    "A4 Avant", "A6 Avant",
    "3 Touring", "5 Touring",
    "Octavia Combi", "Superb Combi",
    "Passat Sportscombi", "Golf Sportscombi",
    "Polestar 2",
  ],
  sedan: [
    "S60", "S90", "S80", "S40",
    "A4 Sedan", "A6 Sedan",
    "3 Series", "5 Series",
    "C-Class", "E-Class", "S-Class",
    "Model 3", "Model S",
    "Polestar 2",
    "Ioniq 6",
  ],
  coupe: [
    "911", "Cayman", "Boxster", "718",
    "M2", "M4", "M8", "M850i", "4 Series", "8 Series", "2 Series",
    "RS5", "TT", "R8", "A5",
    "AMG GT", "CLE", "C Coupe", "E Coupe",
    "Mustang", "Camaro", "Corvette",
    "Supra", "GR86", "BRZ",
    "RC", "LC",
    "Vantage", "DB11", "DB12",
    "F-Type",
    "Huracan", "Gallardo",
    "Roma", "Portofino", "296", "F8",
    "MC20",
    "Emira", "Evora",
  ],
  cab: [
    "C70", "911 Cabriolet", "Boxster", "718 Cabriolet",
    "Z4", "SLC", "SL",
    "Mustang Convertible", "F-Type Convertible",
    "A5 Cabriolet", "TT Roadster",
  ],
};

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en kunnig och lite humoristisk svensk bilrådgivare. Du pratar med vanliga människor — aldrig biltermer. Förklara allt enkelt så att vem som helst förstår. Du ska kännas som en smart kompis som gillar bilar och gärna slänger in en lättsam kommentar ibland.

DITT MÅL: Ställ genomtänkta frågor för att verkligen förstå kundens livssituation och hitta EXAKT rätt bil. Ju mer du vet, desto bättre matchning. Ställ minst 5 frågor innan du söker.

EXTREMT VIKTIGT — KORT MEN INFORMATIVT:
- MAX 2-3 korta meningar per meddelande.
- Mönstret: kort bekräftelse + relevant info (om det behövs) + EN fråga.
- Om en fråga kräver kontext, förklara det på MAX en mening.
- Upprepa ALDRIG vad kunden redan sagt.
- Skriv som ett kort sms — inte ett mejl.
- Inga onödiga inledningar som "Vad kul!" eller "Perfekt!" — gå rakt på sak men var gärna lite personlig.

TONALITET OCH HUMOR:
- Du FÅR slänga in lättsamma kommentarer som "Klassiker!" eller "Smart val!" men överdrivs aldrig.
- Var varm och personlig, inte robotaktig.
- Aldrig emojis.

ENKELT SPRÅK — VIKTIGT:
- Säg "hur långt bilen har gått" istället för "miltal"
- Säg "fyrhjulsdrift" istället för "AWD" eller "drivlina"
- Säg "vad det kostar per månad" istället för "förmånsvärde" eller "driftskostnad"
- Säg "bensinförbrukning" istället för "l/100km"
- Förklara alltid så att någon som aldrig köpt bil förstår.

OSÄKERHET — NÄR KUNDEN INTE VET:
- Om kunden svarar "vet inte", "ingen aning" eller verkar osäker: ge 2-3 konkreta förslag OCH erbjud att hoppa över.
- Exempel: "Ingen aning om drivmedel? De flesta som pendlar kort gillar elbil, annars funkar hybrid bra. Eller så skippar vi den frågan!"
- Tvinga aldrig kunden att svara på något de inte vet.

EXEMPEL PÅ BRA SVAR:
"Aha, elbil! Hur långt kör du till jobbet ungefär? Det påverkar vilken räckvidd du behöver."
"Under 25 — det gör försäkringen en hel del dyrare tyvärr. Har du en budget i åtanke?"
"Kombi, klassiker! Automat eller vill du växla själv?"
"Ingen aning om drivmedel? De flesta som pendlar kort gillar elbil, annars funkar hybrid bra. Eller så skippar vi den frågan!"

EXEMPEL PÅ FÖR LÅNGT SVAR (UNDVIK):
"Vad kul att du funderar på elbil! Det är verkligen ett bra val för pendling eftersom driftskostnaden är mycket lägre jämfört med bensin och diesel. Dessutom slipper du trängselskatt i många städer. Nu undrar jag, hur långt kör du till jobbet varje dag?"

INFORMATION DU BEHÖVER SAMLA (alla påverkar vilken bil som passar):
1. Vad bilen ska användas till (pendling, familj, stad, långresor, blandat)
2. Budget (ungefärligt prisintervall)
3. Var personen bor (stad/region)
4. Hur långt de kör per dag/vecka
5. Drivmedel (el, hybrid, bensin, diesel)
6. Karosstyp — fråga begripligt: "Hög bil som SUV, praktisk kombi, sportig coupé eller vanlig sedan?"
7. Färgpreferens
8. Växellåda (automat eller växla själv)
9. Vad som är viktigast — låg kostnad per månad eller prestanda
10. Årsmodell
11. Ålder på föraren (påverkar försäkring MYCKET, speciellt under 25)
12. Antal passagerare/barn (barnstolar, barnvagn i bagaget)
13. Parkeringssituation (garage med laddning, gatuparkering, uppfart) — avgör om elbil funkar och om stor bil passar
14. Körvanor vintertid — snö/halka → fyrhjulsdrift kan vara bra
15. Dragkroksbehov — släp, båt, husvagn?
16. Vad man vill betala totalt per månad (lån + försäkring + bränsle)
17. Laddmöjlighet hemma (om elbil diskuteras) — avgörande för om elbil funkar
18. Eventuella specifika önskemål

INTELLIGENTA FÖLJDFRÅGOR (ställ dessa baserat på kontext):
- Om budget < 150 000 → fråga om de kan tänka sig äldre bil med få mil
- Om förare < 25 år → nämn att försäkringen blir en hel del dyrare och fråga om det påverkar bilval
- Om förare < 25 år → undvik att föreslå dyra sportbilar om de inte specifikt vill ha det
- Om familj med barn → fråga hur många barn och åldrar (barnvagn i bagaget?)
- Om elbil nämns → fråga om de kan ladda hemma (garage? laddstolpe?)
- Om lång pendling → fråga om motorväg eller landsväg (påverkar hur mycket bilen drar)
- Om dragkrok nämns → fråga vad de ska dra och hur tungt det är
- Om norrland/vinter → rekommendera fyrhjulsdrift och nämn varför
- Om stad → nämn att mindre bil är smidigare att parkera
- Om låg kostnad prioriteras → lyft elbil/hybrid och förklara besparingen kort

PROAKTIV RÅDGIVNING — DU ÄR EN SMART RÅDGIVARE, INTE EN ORDERFRÅGARE:
Du ska AKTIVT föreslå utrustning och tillval som kunden kanske inte tänkt på, baserat på deras livssituation.
Du ska ge OBJEKTIVA råd — säg "jag skulle faktiskt rekommendera X över Y eftersom..." när det är relevant.

TILLVAL ATT FÖRESLÅ BASERAT PÅ BEHOV (fråga om det när det är relevant):
- Husvagn / släp / båt → "dragkrok" (drag)
- Pendlar / kallt klimat / norrland → "motorvärmare" (varmare) + "rattvärme" / "stolvärme"
- Småbarn / barnvagn → "backkamera" (kamera) + "parkeringssensorer" (parksensor) — lättare att backa
- Stor familj eller många kompisar → "7-sits" (sju_sits)
- Mycket motorvägskörning → "adaptiv farthållare" (adaptiv_farthallare) — gör långresor mycket bekvämare
- Vill ha "wow"-känsla / lyx → "panoramatak" (taklucka), "premiumljud" (premium_audio), "skinn" (skinn)
- Ofta i mörker / lantliga vägar → "matrix-strålkastare" (matrix_ljus)
- Företag / kan dra moms → "momsbil" (momsbil)
- Sportig körning önskas → "sportpaket" (sport)

RÅDGIVAR-EXEMPEL (gör så här när relevant):
- "Du nämnde husvagn — då är dragkrok ett MÅSTE. Ska jag bara visa bilar med drag?"
- "Småbarn? Då skulle jag rekommendera backkamera och parkeringssensorer — sparar mycket nerver vid förskolan."
- "Pendlar du i Norrland? Motorvärmare gör bilen direkt 10 grader varmare på morgonen — värt att ha."
- "Med din budget skulle jag faktiskt välja en hybrid över bensin — du sparar typ 1500 kr/mån i bränsle."

TOLKA STYRKAN AV ÖNSKEMÅL ("must" vs "nice-to-have"):
- "måste ha", "krav", "absolut", "nödvändigt", "behöver" → MUST-HAVE → lägg i mustHaveEquipment
- "gärna", "helst", "skulle vara kul med", "om det går", "nice att ha" → NICE-TO-HAVE → lägg i niceToHaveEquipment
- Om kunden ber om något (t.ex. "jag vill ha drag") utan att specificera styrka → fråga: "Är drag ett måste eller bara önskvärt?"

GENERELLA REGLER:
- Ställ MAX EN fråga per meddelande
- Var kort, varm och naturlig
- Använd INTE emojis
- Bekräfta KORT vad kunden sa innan nästa fråga
- Hoppa över frågor du redan har svar på

NÄR DU SKA SÖKA: Du ska ha samlat minst 6 av de 18 punkterna ovan OCH ha ställt minst 6 frågor. Sök INTE förrän du har tillräckligt. Om kunden pressar på, förklara kort att fler frågor ger bättre matchning.

STRIKT FILTERLÄGE: Om kunden säger att de bara vill ha bilar som matchar deras exakta filter (t.ex. "bara mina filter", "only my filters", "inga extra förslag"), ska du STRIKT följa deras angivna filter utan att lägga till egna rekommendationer, bredda sökningen eller föreslå alternativ utanför deras kriterier. Returnera action "search" direkt med exakt de filter kunden har angett.

VIKTIG REGEL — ALLTID BEKRÄFTA INNAN SÖKNING:
Innan du söker (action: "search") MÅSTE du ställa en sista bekräftelsefråga. Ge förslag som "Nej, sök nu!", "Jag vill lägga till något". Först EFTER bekräftelse ska du returnera action: "search".

NÄR DU STÄLLER EN FRÅGA, inkludera "suggestions" — 2-4 korta svarsförslag.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Om du behöver mer info:
{"action":"ask","message":"Din fråga här","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"drivetrain":"awd","city":"Stad","make":"Märke","color":"Färg","yearMin":2018,"yearMax":2024,"useCase":"pendling","driverAge":30,"mustHaveEquipment":["drag","varmare"],"niceToHaveEquipment":["taklucka","kamera"]},"reasoning":"Kort förklaring av varför dessa filter valdes","customerProfile":"Sammanfattning av kundens behov och preferenser i 2 meningar"}

Alla filter-fält är valfria — inkludera bara det du har information om.

BUDGET-FORMAT — EXTREMT VIKTIGT:
- "budget" ska vara "MIN-MAX" i kronor.
- Om kunden säger "cirka 500 000" eller "runt 500 000" → sätt budget till "350000-650000" (±30%).
- Om kunden säger "max 300 000" eller "under 300 000" → sätt budget till "0-300000".
- Om kunden säger "minst 200 000" → sätt budget till "200000-99999999".
- Om kunden säger "2 miljoner" utan "max"/"under" → tolka som "cirka" och sätt ±30%, t.ex. "1400000-2600000".
- ALDRIG sätt MIN till 0 om kunden angett ett ungefärligt belopp — det ger helt fel resultat.
"age" ska vara ett heltal (antal år). Inkludera det om kunden uppgett sin ålder.
Giltiga fuel-värden: el, laddhybrid, hybrid, bensin, diesel
Giltiga bodyType-värden: suv, kombi, sedan, halvkombi, coupe, cab, pickup, minibuss, smabil
Giltiga drivetrain-värden: awd, fwd, rwd
Giltiga transmission-värden: manuell, automat
Giltiga useCase-värden: pendling, familj, langresa, stad, blandat
Giltiga equipment-värden (mustHaveEquipment / niceToHaveEquipment är arrayer av dessa nycklar):
  drag (dragkrok), varmare (motorvärmare), taklucka (panoramatak), skinn (skinnklädsel),
  rattvarme (rattvärme), stolvarme (stolvärme), kamera (backkamera), navi (navigation),
  hud (head-up display), parksensor (parkeringssensorer), blis (döda vinkeln),
  adaptiv_farthallare (adaptiv farthållare), keyless, premium_audio (Bose/B&W/Burmester m.fl.),
  matrix_ljus (matrix-/LED-ljus), voc (app-fjärrstyrning), sport (sportpaket: M Sport/AMG Line/R-Design osv.),
  fyrhjulsstyrning, luftfjadring (luftfjädring), sju_sits (7-sits), momsbil`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ action: "error", error: "Too many requests. Please wait a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { messages, language, action: reqAction, filters: reqFilters, excludeIds, customerProfile: reqProfile } = body;

    // ── LOAD MORE: skip AI, reuse filters ──
    if (reqAction === "load_more" && reqFilters) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      const f = reqFilters;
      const budgetResult = sanitizeBudget(f.budget);
      let minPrice = 0, maxPrice = 99999999;
      if (budgetResult) { minPrice = budgetResult.min; maxPrice = budgetResult.max; }

      const city = sanitizeStringFilter(f.city);
      const make = sanitizeStringFilter(f.make);
      const color = sanitizeStringFilter(f.color);
      const dt = typeof f.drivetrain === "string" && f.drivetrain in drivetrainPatterns ? f.drivetrain : null;
      const fuels = Array.isArray(f.fuel) ? f.fuel.filter((x: string) => x in fuelPatterns) : [];
      const bodies = Array.isArray(f.bodyType) ? f.bodyType.filter((x: string) => x in bodyPatterns) : [];
      const yMin = typeof f.yearMin === "number" ? f.yearMin : null;
      const yMax = typeof f.yearMax === "number" ? f.yearMax : null;
      const exclude: number[] = Array.isArray(excludeIds) ? excludeIds.filter((x: unknown) => typeof x === "number") : [];

      // Progressive relaxation: try with filters, then relax
      const buildLoadMoreQuery = (level: number) => {
        const priceMult = [1.3, 1.6, 2.5][level] || 2.5;
        const priceMinMult = [0.7, 0.5, 0.3][level] || 0.3;
        let q = sb.from("Lovable").select("*")
          .gte("price", Math.floor(minPrice * priceMinMult))
          .lte("price", Math.ceil(maxPrice * priceMult));

        // Level 0: all filters except city
        // Level 1: drop body type too
        // Level 2: only price + fuel
        if (make && level < 2) q = q.ilike("make", `%${make}%`);
        if (fuels.length > 0 && level < 3) {
          const ff = fuels.flatMap((x: string) => fuelPatterns[x] || []).map((v: string) => `fuel_type.eq.${v}`).join(",");
          if (ff) q = q.or(ff);
        }
        if (bodies.length > 0 && level < 1) {
          const bf = bodies.map((x: string) => bodyPatterns[x]).filter(Boolean).map((p: string) => `body_type.ilike.${p}`);
          const mf: string[] = [];
          for (const bt of bodies) { const ms = modelBodyTypeMap[bt]; if (ms) for (const m of ms) mf.push(`model.ilike.%${m}%`); }
          const all = [...bf, ...mf, "body_type.eq.Unknown", "body_type.is.null"].join(",");
          if (all) q = q.or(all);
        }
        if (dt && level < 2) {
          const vals = drivetrainPatterns[dt];
          if (vals) q = q.or(vals.map(v => `drivetrain.eq.${v}`).join(",") + ",drivetrain.eq.Unknown,drivetrain.is.null");
        }
        if (yMin && level < 2) q = q.gte("year", yMin);
        if (yMax && level < 2) q = q.lte("year", yMax);

        // Exclude already-shown cars
        for (const eid of exclude) {
          q = q.neq("id", eid);
        }

        return q.order("price", { ascending: true }).limit(18);
      };

      // Sort by proximity to budget midpoint
      const budgetMid = (minPrice + maxPrice) / 2;

      // Try progressively relaxed queries
      let cars: any[] = [];
      for (let level = 0; level <= 2; level++) {
        const { data: moreCars } = await buildLoadMoreQuery(level);
        if (moreCars && moreCars.length > 0) {
          cars = moreCars
            .sort((a: any, b: any) => Math.abs((a.price || 0) - budgetMid) - Math.abs((b.price || 0) - budgetMid))
            .slice(0, 9);
          break;
        }
      }

      // Generate reasons for new cars
      let carReasons: { carId: number; reason: string }[] = [];
      let message = "";

      if (cars.length > 0 && LOVABLE_API_KEY) {
        const uniqueMakes = [...new Set(cars.map((c: any) => c.make).filter(Boolean))];
        const uniqueModels = [...new Set(cars.map((c: any) => c.model).filter(Boolean))];
        const [modelsRes, makesRes] = await Promise.all([
          sb.from("car_models").select("*").in("make", uniqueMakes).in("model", uniqueModels),
          sb.from("car_makes").select("*").in("make", uniqueMakes),
        ]);
        const modelLookup: Record<string, any> = {};
        for (const m of modelsRes.data ?? []) modelLookup[`${m.make}|||${m.model}`] = m;
        const makeLookup: Record<string, any> = {};
        for (const m of makesRes.data ?? []) makeLookup[m.make] = m;

        const carSummaries = cars.map((c: any) => {
          const cm = modelLookup[`${c.make}|||${c.model}`];
          const mk = makeLookup[c.make || ""];
          const parts = [`ID:${c.id}`, `${c.make} ${c.model_raw || c.model} ${c.year}`, `${c.price?.toLocaleString("sv-SE")} kr`, `${c.mileage?.toLocaleString("sv-SE")} mil`, c.fuel_type, c.body_type, c.city];
          if (cm?.euro_ncap_stars) parts.push(`NCAP: ${cm.euro_ncap_stars}★`);
          if (cm?.boot_space_liters) parts.push(`bagageutrymme: ${cm.boot_space_liters}L`);
          if (mk) parts.push(`garanti: ${mk.warranty_years}år`);
          return parts.filter(Boolean).join(", ");
        }).join("\n");

        const langInst = { sv: "\n\nSvara på svenska.", en: "\n\nRespond in English.", no: "\n\nSvar på norsk.", da: "\n\nSvar på dansk.", fi: "\n\nVastaa suomeksi." }[language as string] || "\n\nSvara på svenska.";

        try {
          const msgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{
                role: "system",
                content: `Du är Clutch. Ge korta motiveringar (1 mening per bil) för ytterligare bilförslag baserat på kundprofilen. Använd INTE emojis.${langInst}\n\nSvara ENBART med JSON:\n{"message":"Kort intro","carReasons":[{"carId":123,"reason":"Motivering"}]}`
              }, {
                role: "user",
                content: `Kundprofil: "${reqProfile || ""}"\n\nFler bilar:\n${carSummaries}`
              }],
            }),
          });
          if (msgResp.ok) {
            const d = await msgResp.json();
            const c = d.choices?.[0]?.message?.content?.trim();
            if (c) {
              try {
                const p = JSON.parse(c.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim());
                message = p.message || "";
                carReasons = p.carReasons || [];
              } catch { message = c; }
            }
          }
        } catch (e) { console.error("Load more AI reason failed"); }
      }

      if (!message) message = `Här är ${cars.length} fler bilar som kan passa dig!`;

      return new Response(JSON.stringify({
        action: "search",
        message,
        cars,
        carReasons,
        matchCount: cars.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Continue with normal conversation flow

    // Language instruction map
    const langInstructions: Record<string, string> = {
      sv: "\n\nSvara på svenska.",
      en: "\n\nYou MUST respond in English.",
      no: "\n\nDu MÅ svare på norsk.",
      da: "\n\nDu SKAL svare på dansk.",
      fi: "\n\nVastaa suomeksi.",
    };
    const langInstruction = langInstructions[language as string] || langInstructions.sv;

    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ action: "error", error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received", messages.length, "messages");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Required configuration missing");
    }

    // Send conversation to AI to decide: ask or search
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: CONVERSATION_SYSTEM_PROMPT + langInstruction },
            ...messages,
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", status);
      throw new Error("AI service unavailable");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error("Empty AI response");
    }

    // Parse AI decision
    const cleaned = rawContent
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    
    let decision: any;
    try {
      decision = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("Failed to parse AI decision, returning as message");
      return new Response(
        JSON.stringify({
          action: "ask",
          message: rawContent,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If AI wants to ask a question, return it
    if (decision.action === "ask") {
      return new Response(
        JSON.stringify({
          action: "ask",
          message: decision.message,
          suggestions: decision.suggestions || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI decided to search — run database query
    if (decision.action === "search") {
      const filters = decision.filters || {};
      const reasoning = decision.reasoning || "";
      const customerProfile = decision.customerProfile || "";

      // Extract user age if provided
      const userAge = typeof filters.age === "number" && filters.age > 0 && filters.age < 120
        ? Math.round(filters.age) : null;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Parse and validate budget
      let minPrice = 0;
      let maxPrice = 99999999;
      const budgetResult = sanitizeBudget(filters.budget);
      if (budgetResult) {
        minPrice = budgetResult.min;
        maxPrice = budgetResult.max;
      }

      // Sanitize string filters
      const sanitizedCity = sanitizeStringFilter(filters.city);
      const sanitizedMake = sanitizeStringFilter(filters.make);
      const sanitizedColor = sanitizeStringFilter(filters.color);
      const sanitizedDrivetrain = typeof filters.drivetrain === "string" && filters.drivetrain in drivetrainPatterns
        ? filters.drivetrain : null;
      const sanitizedTransmission = sanitizeStringFilter(filters.transmission);

      // Validate fuel and body type arrays against known values
      const validFuels = Array.isArray(filters.fuel)
        ? filters.fuel.filter((f: string) => typeof f === "string" && f in fuelPatterns)
        : [];
      const validBodyTypes = Array.isArray(filters.bodyType)
        ? filters.bodyType.filter((b: string) => typeof b === "string" && b in bodyPatterns)
        : [];

      // Validate year range
      const yearMin = typeof filters.yearMin === "number" && filters.yearMin >= 1900 && filters.yearMin <= 2100
        ? filters.yearMin : null;
      const yearMax = typeof filters.yearMax === "number" && filters.yearMax >= 1900 && filters.yearMax <= 2100
        ? filters.yearMax : null;

      // Track which filters were dropped at each level for transparent messaging
      const droppedAtLevel: string[][] = [[], [], [], [], []];

      // Progressive relaxation (5 levels):
      // Level 0: everything strict
      // Level 1: drop city, pris ±30%
      // Level 2: drop color, pris ±50%, KEEP body_type
      // Level 3: drop make, year, pris ±80%, KEEP body_type
      // Level 4: drop body_type, transmission, drivetrain, fuel, pris ×10
      const PRICE_MULT     = [1,    1.3,  1.5,  1.8,  10];
      const PRICE_MIN_MULT = [1,    0.7,  0.5,  0.2,  0];
      const MIN_RESULTS    = 3;

      let cars: any[] = [];
      let relaxLevel = 0;

      // Remember original body type for sorting priority
      const hasBodyTypeFilter = validBodyTypes.length > 0;

      const buildQuery = (level: number) => {
        let query = supabase.from("Lovable").select("*");

        query = query
          .gte("price", Math.floor(minPrice * PRICE_MIN_MULT[level]))
          .lte("price", Math.ceil(maxPrice * PRICE_MULT[level]));

        // Level 0: city
        if (sanitizedCity && level < 1) {
          query = query.ilike("city", `%${sanitizedCity}%`);
        }

        // Level 0-2: make
        if (sanitizedMake && level < 3) {
          query = query.ilike("make", `%${sanitizedMake}%`);
        }

        // Level 0-3: fuel
        if (validFuels.length > 0 && level < 4) {
          const fuelFilters = validFuels
            .flatMap((f: string) => fuelPatterns[f] || [])
            .map((v: string) => `fuel_type.eq.${v}`)
            .join(",");
          if (fuelFilters) query = query.or(fuelFilters);
        }

        // Level 0-3: body_type (kept until level 4!)
        if (validBodyTypes.length > 0 && level < 4) {
          const bodyFilters = validBodyTypes
            .map((b: string) => bodyPatterns[b])
            .filter(Boolean)
            .map((p: string) => `body_type.ilike.${p}`);

          const modelFilters: string[] = [];
          for (const bt of validBodyTypes) {
            const models = modelBodyTypeMap[bt];
            if (models) {
              for (const m of models) {
                modelFilters.push(`model.ilike.%${m}%`);
              }
            }
          }

          // Level 2+: include Unknown/null body_type to fill results
          const unknownFilters = level >= 2 ? ["body_type.eq.Unknown", "body_type.is.null"] : [];
          const allFilters = [...bodyFilters, ...modelFilters, ...unknownFilters].join(",");
          if (allFilters) query = query.or(allFilters);
        }

        // Level 0-1: color strict, Level 2+: with Unknown/null fallback
        if (sanitizedColor && level < 2) {
          query = query.or(`color.ilike.%${sanitizedColor}%,color.ilike.%"${sanitizedColor}"%`);
        } else if (sanitizedColor && level >= 2 && level < 4) {
          query = query.or(`color.ilike.%${sanitizedColor}%,color.ilike.%"${sanitizedColor}"%,color.eq.Unknown,color.eq.Okänd,color.is.null`);
        }

        // Level 0-3: drivetrain
        if (sanitizedDrivetrain && level < 4) {
          const dtValues = drivetrainPatterns[sanitizedDrivetrain];
          if (dtValues) {
            const dtFilters = dtValues.map((v: string) => `drivetrain.eq.${v}`).join(",");
            query = query.or(`${dtFilters},drivetrain.eq.Unknown,drivetrain.is.null`);
          }
        }

        // Level 0-3: transmission
        if (sanitizedTransmission && level < 4) {
          if (sanitizedTransmission.toLowerCase().includes("anuell")) {
            query = query.or("transmission.ilike.%anuell%,transmission.ilike.%anual%,transmission.is.null");
          } else if (sanitizedTransmission.toLowerCase().includes("utomat")) {
            query = query.or("transmission.ilike.%utomat%,transmission.is.null");
          }
        }

        // Level 0-2: year range
        if (yearMin && level < 3) query = query.gte("year", yearMin);
        if (yearMax && level < 3) query = query.lte("year", yearMax);

        return query.order("price", { ascending: true }).limit(18);
      };

      // Fire levels 0 and 1 in parallel
      const [res0, res1] = await Promise.all([
        buildQuery(0),
        buildQuery(1),
      ]);

      // Sort results: prioritize body_type match, then proximity to budget midpoint
      const budgetMid = (minPrice + maxPrice) / 2;
      const bodyTypePatternValues = validBodyTypes.map((b: string) => bodyPatterns[b]?.replace(/%/g, "").toLowerCase()).filter(Boolean);
      const bodyModelNames = validBodyTypes.flatMap((bt: string) => modelBodyTypeMap[bt] || []).map(m => m.toLowerCase());

      const sortByRelevance = (arr: any[]) => {
        // First sort by body type match + price proximity
        const sorted = arr.sort((a, b) => {
          if (hasBodyTypeFilter) {
            const aBodyMatch = bodyTypePatternValues.some(p => (a.body_type || "").toLowerCase().includes(p))
              || bodyModelNames.some(m => (a.model || "").toLowerCase().includes(m));
            const bBodyMatch = bodyTypePatternValues.some(p => (b.body_type || "").toLowerCase().includes(p))
              || bodyModelNames.some(m => (b.model || "").toLowerCase().includes(m));
            if (aBodyMatch && !bBodyMatch) return -1;
            if (!aBodyMatch && bBodyMatch) return 1;
          }
          return Math.abs((a.price || 0) - budgetMid) - Math.abs((b.price || 0) - budgetMid);
        });

        // Only diversify when user didn't request a specific make
        if (sanitizedMake) {
          // User asked for a specific brand — just return best matches, diversify by model only
          const picked: any[] = [];
          const modelCount: Record<string, number> = {};
          for (const car of sorted) {
            if (picked.length >= 9) break;
            const model = (car.model || "unknown").toLowerCase();
            if ((modelCount[model] || 0) >= 2) continue;
            picked.push(car);
            modelCount[model] = (modelCount[model] || 0) + 1;
          }
          if (picked.length < MIN_RESULTS) {
            for (const car of sorted) {
              if (picked.length >= MIN_RESULTS) break;
              if (!picked.some(p => p.id === car.id)) picked.push(car);
            }
          }
          return picked;
        }

        // No specific make — diversify across brands
        const picked: any[] = [];
        const makeCount: Record<string, number> = {};
        const makeModelCount: Record<string, number> = {};

        for (const car of sorted) {
          if (picked.length >= 9) break;
          const make = (car.make || "unknown").toLowerCase();
          const model = (car.model || "unknown").toLowerCase();
          const makeModelKey = `${make}|||${model}`;

          if (picked.length < 3) {
            if ((makeCount[make] || 0) >= 1) continue;
          } else {
            if ((makeCount[make] || 0) >= 2) continue;
            if ((makeModelCount[makeModelKey] || 0) >= 1) continue;
          }

          picked.push(car);
          makeCount[make] = (makeCount[make] || 0) + 1;
          makeModelCount[makeModelKey] = (makeModelCount[makeModelKey] || 0) + 1;
        }

        if (picked.length < MIN_RESULTS) {
          for (const car of sorted) {
            if (picked.length >= MIN_RESULTS) break;
            if (!picked.some(p => p.id === car.id)) picked.push(car);
          }
        }

        return picked;
      };

      if (res0.data && res0.data.length > 0) {
        cars = sortByRelevance(res0.data);
        relaxLevel = 0;
      } else if (res1.data && res1.data.length > 0) {
        cars = sortByRelevance(res1.data);
        relaxLevel = 1;
      } else {
        // Try levels 2 and 3 in parallel
        const [res2, res3] = await Promise.all([
          buildQuery(2),
          buildQuery(3),
        ]);
        if (res2.data && res2.data.length > 0) {
          cars = sortByRelevance(res2.data);
          relaxLevel = 2;
        } else if (res3.data && res3.data.length > 0) {
          cars = sortByRelevance(res3.data);
          relaxLevel = 3;
        }
      }
      
      console.log(`Search: budget=${minPrice}-${maxPrice}, relaxLevel=${relaxLevel}, found=${cars.length}, prices=${cars.map((c:any)=>c.price).join(",")}`);

      // ── Hämta berikad data från car_models och car_makes ──
      const uniqueMakes = [...new Set(cars.map((c: any) => c.make).filter(Boolean))];
      const uniqueModels = [...new Set(cars.map((c: any) => c.model).filter(Boolean))];

      const [modelsRes, makesRes] = await Promise.all([
        supabase.from("car_models").select("*").in("make", uniqueMakes).in("model", uniqueModels),
        supabase.from("car_makes").select("*").in("make", uniqueMakes),
      ]);

      const modelLookup: Record<string, any> = {};
      for (const m of modelsRes.data ?? []) modelLookup[`${m.make}|||${m.model}`] = m;
      const makeLookup: Record<string, any> = {};
      for (const m of makesRes.data ?? []) makeLookup[m.make] = m;

      // Build context from conversation
      const userMessages = messages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .join(". ");

      // Generate personalized result message + per-car reasons
      let message = "";
      let carReasons: { carId: number; reason: string }[] = [];
      let suggestions: string[] = [];

      if (cars.length > 0) {
        try {
          const carSummaries = cars
            .map((c: any) => {
              const cm = modelLookup[`${c.make}|||${c.model}`];
              const mk = makeLookup[c.make || ""];
              const parts = [
                `ID:${c.id}`,
                `${c.make} ${c.model_raw || c.model} ${c.year}`,
                `${c.price?.toLocaleString("sv-SE")} kr`,
                `${c.mileage?.toLocaleString("sv-SE")} mil`,
                c.fuel_type, c.body_type, c.city,
                `färg: ${c.color || "okänd"}`,
                c.drivetrain ? `drivlina: ${c.drivetrain}` : null,
                c.horsepower && c.horsepower > 0 ? `${c.horsepower} hk` : null,
                c.transmission ? `växellåda: ${c.transmission}` : null,
              ];
              // Berikad modelldata
              if (cm) {
                if (cm.euro_ncap_stars) parts.push(`NCAP: ${cm.euro_ncap_stars}★`);
                if (cm.boot_space_liters) parts.push(`bagageutrymme: ${cm.boot_space_liters}L`);
                if (cm.max_towing_kg) parts.push(`dragvikt: ${cm.max_towing_kg}kg`);
                if (cm.zero_to_hundred_sec) parts.push(`0-100: ${cm.zero_to_hundred_sec}s`);
                if (cm.seats) parts.push(`${cm.seats} säten`);
                if (cm.electric_range_km) parts.push(`elräckvidd: ${cm.electric_range_km}km`);
                if (cm.fuel_consumption_l100km) parts.push(`förbrukning: ${cm.fuel_consumption_l100km}l/100km`);
                if (cm.co2_g_per_km) parts.push(`CO2: ${cm.co2_g_per_km}g/km`);
                if (cm.reliability_notes) parts.push(`tillförlitlighet: ${cm.reliability_notes}`);
              }
              // Garanti från märkesdata
              if (mk) {
                parts.push(`garanti: ${mk.warranty_years}år/${(mk.warranty_km/1000).toFixed(0)}tkm`);
              }
              return parts.filter(Boolean).join(", ");
            })
            .join("\n");

          const msgResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  {
                    role: "system",
                    content: `Du är Clutch, en kunnig och lite humoristisk svensk bilrådgivare som pratar med vanliga människor.

VIKTIGT — RESULTATMEDDELANDET ("message"):
- Skriv EN kort, personlig mening som intro. T.ex. "Kolla in dessa — jag tror de passar dig!" eller "Här kommer dina matchningar!"
- Beskriv INTE bilarna i meddelandet. Bilförklaringarna visas under varje bilkort separat.
- Var gärna lite lättsam och varm.

FÖR VARJE BIL ("carReasons"):
- Ge en kort personlig motivering (1-2 meningar) om varför just den bilen passar kunden baserat på deras specifika behov.
- Använd den berikade datan aktivt men förklara enkelt — inga biltermer.
- Säkerhet: nämn säkerhetsbetyg om relevant
- Praktiskt: bagageutrymme, hur tungt den kan dra, antal säten
- Ekonomi: hur mycket den drar, elräckvidd, garanti
- Säg "fyrhjulsdrift" istället för AWD
- Om kundens ålder är känd: nämn att försäkringen påverkas av ålder
- Var specifik — nämn siffror när de är relevanta. Använd INTE emojis.${langInstruction}

${reasoning ? `Din resonering: ${reasoning}` : ""}
${customerProfile ? `Kundprofil: ${customerProfile}` : ""}

Svara ENBART med JSON (ingen markdown, inga code fences):
{"message":"Kort intro (1 mening, beskriv INTE bilarna)","carReasons":[{"carId":123,"reason":"Motivering för denna bil"}]}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}"\n\nBilar:\n${carSummaries}\n\n${relaxLevel > 0 ? `Sökningen breddades (nivå ${relaxLevel}) för att hitta resultat. Informera kort om vad som justerades: ${[
                      relaxLevel >= 1 ? "plats ignorerades" : "",
                      relaxLevel >= 2 ? "färgkravet lättades" : "",
                      relaxLevel >= 3 ? "karosstyp/märke/årsmodell lättades" : "",
                      relaxLevel >= 4 ? "växellåda/drivlina/drivmedel lättades" : "",
                    ].filter(Boolean).join(", ")}.` : ""}`,
                  },
                ],
              }),
            }
          );

          if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            const content = msgData.choices?.[0]?.message?.content?.trim();
            if (content) {
              try {
                const cleanedContent = content
                  .replace(/^```json?\s*/i, "")
                  .replace(/```\s*$/, "")
                  .trim();
                const parsed = JSON.parse(cleanedContent);
                message = parsed.message || "";
                carReasons = parsed.carReasons || [];
              } catch {
                message = content;
              }
            }
          }
        } catch (e) {
          console.error("AI message generation failed");
        }
      } else {
        // No cars found — generate helpful suggestions
        try {
          const noResultResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  {
                    role: "system",
                    content: `Du är Clutch, en svensk bilrådgivare. Kunden sökte bilar men inga hittades. Du ska:
1. Kort förklara varför det inte finns matchande bilar (max 2 meningar)
2. Ge 2-3 konkreta förslag på hur kunden kan ändra sin sökning för att hitta bilar

Svara ENBART med JSON (ingen markdown, inga code fences):
{"message":"Tyvärr hittade jag inga bilar som matchar...","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Förslagen ska vara specifika och klickbara, t.ex. "Öka budgeten till 200 000 kr", "Prova hybrid istället för el", "Sök i hela Sverige".
Använd INTE emojis.${langInstruction}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}". Alla relax-nivåer testades utan resultat.`,
                  },
                ],
              }),
            }
          );

          if (noResultResponse.ok) {
            const noResultData = await noResultResponse.json();
            const content = noResultData.choices?.[0]?.message?.content?.trim();
            if (content) {
              try {
                const cleanedContent = content
                  .replace(/^```json?\s*/i, "")
                  .replace(/```\s*$/, "")
                  .trim();
                const parsed = JSON.parse(cleanedContent);
                message = parsed.message || "";
                suggestions = parsed.suggestions || [];
              } catch {
                message = content;
              }
            }
          }
        } catch (e) {
          console.error("No-result AI generation failed");
        }
      }

      if (!message) {
        message =
          cars.length > 0
            ? `Jag hittade ${cars.length} bilar som matchar dina önskemål!`
            : "Tyvärr hittade jag inga bilar som matchar just nu. Försök ändra dina kriterier.";
      }

      return new Response(
        JSON.stringify({
          action: "search",
          message,
          cars,
          carReasons,
          suggestions,
          filters: { ...filters, driverAge: typeof filters.driverAge === "number" ? filters.driverAge : null },
          customerProfile,
          matchCount: cars.length,
          relaxed: relaxLevel > 0,
          relaxLevel,
          userAge,
          userCity: sanitizedCity,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({
        action: "ask",
        message: "Berätta lite mer om vad du letar efter så hjälper jag dig!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const corsHeaders = getCorsHeaders(req);
    console.error("guided-search error");
    return new Response(
      JSON.stringify({
        action: "error",
        error: "An unexpected error occurred",
        cars: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
