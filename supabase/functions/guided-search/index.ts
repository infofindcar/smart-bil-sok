import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS: restrict to known origins ---
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com") ||
    origin === "https://findcar.se" ||
    origin === "https://www.findcar.se" ||
    origin.startsWith("http://localhost")
  ) {
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

// --- Rate limiter per IP (burst protection) ---
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

// --- Daily search limit per IP (DB-backed, new searches only) ---
const DAILY_SEARCH_LIMIT = 30;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkAndRecordDailyLimit(
  supabase: ReturnType<typeof createClient>,
  ip: string
): Promise<{ limited: boolean }> {
  const ipHash = await sha256(ip);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { count } = await supabase
    .from("guided_search_usage")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_SEARCH_LIMIT) {
    return { limited: true };
  }

  await supabase.from("guided_search_usage").insert({ ip_hash: ipHash });
  return { limited: false };
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

// Model names contain digits and dots (V70, 9-5, ID.4, A4 Avant, Model 3).
function sanitizeModelFilter(value: unknown, maxLen = 40): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  if (trimmed.length < 2) return null;
  if (!/^[a-zA-Z0-9åäöÅÄÖéÉüÜ .\-/]+$/.test(trimmed)) return null;
  return trimmed;
}

// Bilfirmor: namnen i databasen är på butiksnivå ("Riddermark Bil Uppsala"),
// så vi matchar på delnamn. Sanera bort ILIKE-/PostgREST-tecken.
function sanitizeDealerList(value: unknown, max = 3): string[] {
  const arr = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const out: string[] = [];
  for (const raw of arr) {
    if (typeof raw !== "string") continue;
    const clean = raw.replace(/[%,()"'*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    if (clean.length < 2) continue;
    if (!out.includes(clean)) out.push(clean);
    if (out.length >= max) break;
  }
  return out;
}



// Buyers write model names loosely: "9-5"/"95", "ID.4"/"ID4", "XC 60"/"XC60".
// Produce a small set of ILIKE-safe variants so the filter still hits.
function modelVariants(model: string): string[] {
  const base = model.trim();
  const variants = new Set<string>([base]);
  const compact = base.replace(/[\s.\-]/g, "");
  if (compact.length >= 2) variants.add(compact);
  // Split letter/digit boundaries: "XC60" -> "XC 60" and "XC-60"
  const spaced = compact.replace(/([a-zA-ZåäöÅÄÖ])(\d)/g, "$1 $2");
  if (spaced !== compact) {
    variants.add(spaced);
    variants.add(spaced.replace(" ", "-"));
  }
  // Pure digit groups: "95" -> "9-5", "9-5" -> "95" (already covered)
  const digits = compact.match(/^(\d{2,3})$/);
  if (digits) variants.add(digits[1].split("").join("-"));
  return [...variants].filter((v) => v.length >= 2 && !v.includes(",")).slice(0, 6);
}


function sanitizeBudget(value: unknown): { min: number; max: number } | null {
  if (typeof value !== "string") return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 2 || parts.some(isNaN) || parts[0] < 0 || parts[1] < 0 || parts[1] > 100000000) {
    return null;
  }
  return { min: parts[0], max: parts[1] };
}

const fuelPatterns: Record<string, string> = {
  el: "%El%",
  laddhybrid: "%Laddhybrid%",
  hybrid: "%Hybrid%",
  bensin: "%Bensin%",
  diesel: "%Diesel%",
};

const bodyPatterns: Record<string, string> = {
  suv: "%SUV%",
  kombi: "%Kombi%",
  sedan: "%Sedan%",
  halvkombi: "%Halvkombi%",
  coupe: "%Coup%",
  cab: "%Cab%",
};

// Växellåda: DB-värden är "Automatisk", "Automat" och "Manuell".
const transmissionPatterns: Record<string, string> = {
  automat: "%Automat%",
  manuell: "%Manuell%",
};

const drivetrainPatterns: Record<string, string[]> = {
  awd: ["AWD", '"AWD"'],
  fwd: ["FWD", '"FWD"'],
  rwd: ["RWD", '"RWD"'],
};

// Feature patterns: match tillval/utrustning i Blockets annonstitel (model_raw)
// Täckning ~30-50% av bilar som faktiskt har tillvalet. Droppas vid relaxation nivå 2+.
const featurePatterns: Record<string, string[]> = {
  dragkrok:       ["%dragkrok%", "%drag%"],
  panorama:       ["%panorama%", "%panoramatak%", "%glastak%"],
  bose:           ["%bose%"],
  harman:         ["%harman%", "%kardon%"],
  skinn:          ["%skinn%", "%läder%", "%leather%"],
  elstol:         ["%elstol%", "%elektrisk stol%", "%elavstånd%"],
  adaptiv:        ["%adaptiv farthållare%", "%acc%", "%distronic%", "%pilot assist%"],
  backkamera:     ["%backkamera%", "%backup camera%", "%rear cam%"],
  360:            ["%360%", "%360-kamera%", "%surround%"],
  luftfjädring:   ["%luftfjädring%", "%air suspension%", "%airmatic%"],
  massage:        ["%massage%"],
  ventilerad:     ["%ventilerad%", "%kylda säten%"],
  headup:         ["%head-up%", "%hud%", "%head up%"],
  matrix:         ["%matrix%", "%laserljus%", "%pixel%"],
  nightvision:    ["%night vision%", "%mörkerseende%"],
  taklucka:       ["%taklucka%"],
  elbaklucka:     ["%elbaklucka%", "%elektrisk baklucka%", "%hands free%"],
  v8:             ["%v8%"],
  v6:             ["%v6%"],
  amg:            ["%amg%"],
  rs:             ["%rs %", "% rs%"],
  m_sport:        ["%m sport%", "%m-sport%", "% mpak%"],
  r_line:         ["%r-line%", "%r line%"],
  s_line:         ["%s line%", "%s-line%"],
};

// Only fields rendered by the results UI. In particular, omit the large
// description column from every candidate response.
const SEARCH_COLUMNS =
  "id,make,model,model_raw,year,price,mileage,fuel_type,body_type,drivetrain,city,color,image_thumb_url,regnr,horsepower,transmission,dealer_name,seats,listing_url,dealer_url";

// Model names that imply a body type (used when body_type is Unknown/null)
const modelBodyTypeMap: Record<string, string[]> = {
  suv: ["XC90", "XC60", "XC40", "EX90", "EX60", "EX40", "EX30", "RAV4", "CR-V", "Tiguan", "Tucson", "Kona", "Sportage", "Niro", "Q3", "Q5", "Q7", "Q8", "X1", "X3", "X5", "X7", "GLC", "GLE", "GLB", "EQA", "EQB", "EQC", "Model Y", "Model X", "ID.4", "ID.5", "Enyaq", "Karoq", "Kodiaq", "Forester", "Outback"],
  kombi: ["V60", "V90", "V70", "V50", "V40", "A4 Avant", "A6 Avant", "3 Touring", "5 Touring", "Octavia Combi", "Superb Combi", "Passat Sportscombi", "Golf Sportscombi"],
  sedan: ["S60", "S90", "S80", "S40", "A4 Sedan", "A6 Sedan", "3 Series", "5 Series", "C-Class", "E-Class", "Model 3", "Model S"],
  cab: ["SL", "Z4", "Z3", "Boxster", "718 Boxster", "Cayman", "F-Type", "MX-5", "TT Roadster", "Mustang Convertible", "4 Cabrio", "3 Cabriolet", "C70", "124 Spider"],
};

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en intelligent och objektiv svensk bilrådgivare. Du har ett naturligt samtal med kunden för att förstå exakt vilken bil som passar dem bäst. Du ska kännas som en riktig människa som bryr sig.

TILLTAL (VIKTIGT): Du pratar DIREKT med personen. Säg alltid "du" och "dig". Skriv ALDRIG "kunden", "kunden ville", "kundens behov" eller något annat i tredje person i dina svar — orden "kund"/"kunden" används bara internt i denna instruktion, aldrig i texten du skickar. Upprepa inte tillbaka hela sökningen i detalj; håll det kort och mjukt.

DITT MÅL: Förstå kundens situation med SÅ FÅ frågor som möjligt. Du följer INGET fast schema — varje samtal ska börja där kunden är. Läs vad kunden redan skrivit och fråga bara om det som faktiskt saknas för att hitta rätt bil.

ANPASSNING — ALLTID PRIORITET:
- Utgå från vad kunden REDAN sagt. Fråga aldrig om något de redan besvarat.
- Om kunden nämnt en specifik modell: fråga bara om budget (och ev. plats) — hoppa över livsstilsfrågor.
- "Billigast möjligt" / "under X kr" / "max X" räknas som budget — sätt intervall och gå vidare.
- Ställ MAX EN fråga per meddelande. Blanda aldrig ihop flera frågor i ett svar.
- Bekräfta kort det kunden sagt innan du ställer nästa fråga: "Okej, pendling alltså!" / "Schysst!" / "Låter vettigt."
- Var kort, varm och naturlig — som en kompis som kan bilar. Använd INTE emojis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEG 1 — OBLIGATORISKA FRÅGOR (ställ i denna ordning om inte redan besvarade)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dessa två frågor MÅSTE alltid besvaras innan du söker. Hoppa bara över en fråga om kunden redan gett svaret.

OBLIGATORISK FRÅGA A — KATEGORI/ANVÄNDNING (ställ om inte känt):
Vad ska bilen användas till?
Chips: ["Pendla till jobbet", "Familjebil", "Entusiastbil/sportbil", "Stadskörning", "Allt möjligt"]

OBLIGATORISK FRÅGA B — BUDGET (ställ alltid om inget prisintervall framgår):
Vad har du att röra dig med?
Chips: ["Under 100 000 kr", "100 000–200 000 kr", "200 000–350 000 kr", "Mer än 350 000 kr"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEG 2 — KATEGORISPECIFIK OBLIGATORISK FÖLJDFRÅGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Beroende på vad kunden svarat i Steg 1 finns EN obligatorisk följdfråga PER kategori. Ställ den MELLAN fråga A och B (dvs. innan budget om kategori är känd men budget saknas):

"Pendlar till jobbet" / "pendlar":
→ OBLIGATORISK: Hur lång är pendlingen?
   Chips: ["Under 5 mil", "5–15 mil", "Mer än 15 mil per dag"]
   (Härled sedan drivlina från avstånd: lång pendling → el/hybrid/diesel. Fråga inte om drivlina separat om det kan härledas.)

"Entusiastbil" / "sportbil" / "rolig bil" / "kul bil" / "häftig bil" / "peppad bil":
→ OBLIGATORISK: Vad menar du med rolig — sportig kärra, cabriolet, riktigt hög effekt, eller vill du bli överraskad?
   Chips: ["Sportig/coupé", "Cabriolet", "Hög effekt/V8", "Överraska mig!"]
   (Sätt vibe:hiddenGem om de väljer "Överraska mig" eller säger "ovanlig", "dold pärla", "något häftigt".)

"Familjebil":
→ OBLIGATORISK: Hur stor är familjen — räcker 5 platser, eller behöver du 7-sits?
   Chips: ["Inga barn ännu", "1–2 barn, 5-sits räcker", "3+ barn, vill ha 7-sits"]

"Stadskörning":
→ OBLIGATORISK: Kör du mest i stan, eller även längre sträckor ibland?
   Chips: ["Nästan bara i stan", "Blandat, även längre resor", "Pendlar också"]

"Vet inte riktigt" / "osäker":
→ (Fråga A räcker — välj kategori, ställ sedan rätt följdfråga ovan)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEG 3 — VALFRIA KONTEXTUELLA FRÅGOR (välj 0–1 om de tillför värde)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Efter steg 1+2 KAN du ställa EN valfri fråga om den faktiskt förbättrar sökningen. Hoppa över om svaret kan härledas.

- Var bor du? → Relevant vid pendling eller regionalt begränsat utbud. Chips: [stad/region-förslag + "Spelar ingen roll"]
- Drivlina (el/hybrid/bensin/diesel)? → Relevant om det inte framgår av pendlingsavstånd eller budget. multiSelect: true med chips: ["El", "Laddhybrid", "Bensin", "Diesel", "Spelar ingen roll"]
- Karosstyp? → Relevant om familjestorleken inte redan styr. multiSelect: true med chips: ["SUV", "Kombi", "Sedan", "Halvkombi", "Cabriolet"]
- Äger du bil idag, och vad tycker du om den? → Utmärkt när kunden är osäker.
- Märkesönskemål? → Om kunden verkar ha tankar om märke men inte nämnt det.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEG 4 — KRAV OCH UTRUSTNING (multiSelect — ställ alltid om inte redan känt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Innan du söker, ställ alltid denna fråga om kunden INTE redan nämnt specifika krav. Det är en multiSelect-fråga — kunden kan välja flera alternativ samtidigt.

Fråga: "Har du några specifika krav på utrustning eller växellåda?" (eller varianter: "Är det något bilen måste ha?")
multiSelect: true
Chips: ["Automatlåda", "Dragkrok", "Panoramatak", "Backkamera", "Skinnklädsel", "Inga specifika krav"]

Hoppa över steg 4 om:
- Kunden redan nämnt specifik utrustning (t.ex. "vill ha dragkrok")
- Kunden valt "Inga specifika krav" eller sagt "spelar ingen roll"
- Det är uppenbart att kunden inte är kräsen (t.ex. "billigast möjligt")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NÄR DU SKA SÖKA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sök när steg 1+2+4 är klara (steg 3 är valfritt).
Undantag: specifik modell + budget → sök direkt, hoppa över alla steg.
Max 5 frågor totalt. Sök aldrig utan budget.

INTELLIGENTA SLUTLEDNINGAR — härled dessa utan att fråga:
- Lång pendling (15+ mil) → el eller hybrid/diesel; sätt useCase:pendling
- Familj med 3+ barn → kombi eller SUV med 7-sits
- Stadskörning enbart → liten bil, el/hybrid; sätt useCase:stad
- "Låg driftskostnad" → el/hybrid viktigt
- Nämner färg → filtrera utan att fråga
- Nämner automat/manuell → notera och filtrera direkt

VARIATION I FRÅGOR — formulera aldrig två samtal likadant:
- Budget: "Vad har du att röra dig med?" / "Hur ser budgeten ut?" / "Vad är du beredd att lägga?"
- Plats: "Var bor du?" / "Vilken del av landet håller du till i?" / "Var söker vi bilar?"
- Drivlina: "Har du kört el förut?" / "Är du öppen för elbil?" / "Bensin, diesel eller något modernare?"
- Utrustning: "Är det något bilen måste ha?" / "Har du några specifika krav på utrustning?" / "Finns det tillval som är viktiga för dig?"

NÄR DU STÄLLER EN FRÅGA, inkludera "suggestions" — 2–6 korta svarsförslag som kunden kan klicka på.
När FLERA svar kan gälla samtidigt (utrustning, drivlina, karosstyp), sätt "multiSelect": true — då kan kunden välja flera chips och skicka dem tillsammans.

VIKTIGT — PLATSFRÅGAN: En av suggestions MÅSTE alltid vara "Spelar ingen roll". Om kunden väljer det, lämna bort "city" i filters och sök i hela landet.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Enkelt val (ett svar i taget):
{"action":"ask","message":"Din fråga här","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Flerval (kunden kan välja flera alternativ):
{"action":"ask","message":"Din fråga här","suggestions":["Alt 1","Alt 2","Alt 3","Alt 4"],"multiSelect":true}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"transmission":"automat","drivetrain":"awd","city":"Stad","make":"Märke","model":"Modell","color":"Färg","yearMin":2018,"yearMax":2024,"useCase":"pendling","age":28,"features":["dragkrok","panorama"],"dealerInclude":["Bilfirma"],"dealerExclude":["Annan firma"]},"reasoning":"Kort förklaring av varför dessa filter valdes","customerProfile":"Sammanfattning av kundens behov och preferenser i 2 meningar"}

Alla filter-fält är valfria — inkludera bara det du har information om.
"age" ska vara ett heltal (antal år). Inkludera det om kunden uppgett sin ålder.

SPECIFIK BILMODELL — VIKTIGT:
Om kunden nämner en specifik modell (t.ex. "Volvo V70", "BMW 320d", "Golf GTI", "Tesla Model 3", "Saab 9-5", "XC60") ska du:
- ALLTID sätta både "make" (märket) och "model" (modellbeteckningen, utan märkesnamn: "V70", "320", "Golf", "Model 3", "9-5", "XC60")
- Söka snabbt: kunden vet redan vad de vill ha. Fråga då bara om budget (och ev. plats) och sök sedan — ställ inte fem frågor.
- Inte byta modell åt kunden. Modellfiltret är hårt: kunden får bara den modellen. Nämn i "reasoning" om utbudet är litet.
- Sätt bara "model" när kunden faktiskt bett om en specifik modell — annars utelämna fältet helt.

BILFIRMA / HANDLARE — VIKTIGT:
Vi kan filtrera på vilken bilfirma som säljer bilen. Använd fälten "dealerInclude" (bara dessa firmor) och "dealerExclude" (aldrig dessa firmor) — båda är listor med strängar, max 3 namn.
- "visa bara Riddermarks bilar", "vad har Toveks Bil?", "jag vill se Carlas sortiment" → {"dealerInclude":["Riddermark"]} / ["Toveks"] / ["Carla"]
- "inget från Riddermark", "helst inte Carla" → {"dealerExclude":["Riddermark"]}
- Skriv firmanamnet KORT och utan ort/butik: "Riddermark", inte "Riddermark Bil Uppsala" — vi matchar på delnamn så alla butiker i kedjan träffas. Vill kunden ha en specifik butik, ta med orten.
- Firmafiltret är hårt: nämner kunden en firma får de aldrig bilar från andra firmor.
- Fråga aldrig rutinmässigt om bilfirma. Ta bara med fälten när kunden själv nämnt en firma. Har kunden nämnt en firma men inget mer, ställ bara de frågor som fortfarande saknas (t.ex. budget eller karosstyp) och sök sedan.



Giltiga fuel-värden: el, laddhybrid, hybrid, bensin, diesel
Giltiga bodyType-värden: suv, kombi, sedan, halvkombi, coupe, cab
Giltiga transmission-värden: automat, manuell. Sätt ALLTID fältet om kunden nämnt växellåda — det filtreras hårt.
OBS: "cabriolet", "cab", "roadster", "öppen bil", "convertible", "spyder", "spider" → bodyType: "cab"
OBS: "budget" ska ALLTID vara ett intervall "MIN-MAX". Om kunden säger "runt 500k" eller "ungefär X" → skapa ett intervall ±20%: t.ex. "400000-600000". Om kunden nämner ett enda belopp → skapa ett rimligt intervall runt det.
Giltiga drivetrain-värden: awd, fwd, rwd
Giltiga useCase-värden: pendling, familj, langresa, stad, blandat
Giltiga features-värden: dragkrok, panorama, bose, harman, skinn, elstol, adaptiv, backkamera, 360, luftfjädring, massage, ventilerad, headup, matrix, nightvision, taklucka, elbaklucka, v8, v6, amg, rs, m_sport, r_line, s_line
OBS: "features" filtrerar mot annonstexten — täckning ca 30-50%. Inkludera bara om kunden verkligen nämnt det som viktigt.

VIBE-FÄLT (valfritt): lägg till "vibe":"hiddenGem" i filters om kunden ber om något roligt, ovanligt, unikt, "hidden gem", "dold pärla", "något häftigt", "överraska mig", "sportigt kul" eller liknande. Då letar vi upp ovanliga och roliga bilar istället för de vanligaste. Om kunden vill ha tråkigt/säkert/vanligt, utelämna fältet.`;

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
    const isLoadMore = reqAction === "load_more";
    // Kunden har godkänt sammanfattningskortet — kör sökningen direkt på de
    // bekräftade filtren utan ett nytt AI-anrop.
    const isConfirmedSearch = reqAction === "confirmed_search" && !!reqFilters;
    const safeExcludeIds: number[] = Array.isArray(excludeIds)
      ? excludeIds.filter((x: unknown) => typeof x === "number")
      : [];


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
      const model = sanitizeModelFilter(f.model);
      const modelOr = model
        ? modelVariants(model)
            .flatMap((v) => [`model.ilike.%${v}%`, `model_raw.ilike.%${v}%`])
            .join(",")
        : null;

      const dt = typeof f.drivetrain === "string" && f.drivetrain in drivetrainPatterns ? f.drivetrain : null;
      const fuels = Array.isArray(f.fuel) ? f.fuel.filter((x: string) => x in fuelPatterns) : [];
      const bodies = Array.isArray(f.bodyType) ? f.bodyType.filter((x: string) => x in bodyPatterns) : [];
      const yMin = typeof f.yearMin === "number" ? f.yearMin : null;
      const yMax = typeof f.yearMax === "number" ? f.yearMax : null;
      const trans = typeof f.transmission === "string" && f.transmission.toLowerCase() in transmissionPatterns
        ? f.transmission.toLowerCase() : null;
      const dealerInclude = sanitizeDealerList(f.dealerInclude);
      const dealerExclude = sanitizeDealerList(f.dealerExclude);



      // Progressive relaxation: try with filters, then relax.
      // Explicit body type and year are hard constraints in "Visa fler".
      // Level 0: samma modell, samma årsintervall och karosstyp (strikt)
      // Level 1: samma modell och karosstyp, lite bredare pris
      // Level 2: släpp modell/märke — visa LIKNANDE bilar med samma
      //          karosstyp och årsintervall istället för irrelevanta fordon.
      const buildLoadMoreQuery = (level: number) => {
        const priceMult = [1.0, 1.3, 1.6][level] ?? 1.6;
        const priceMinMult = [1.0, 0.7, 0.5][level] ?? 0.5;
        let q = sb.from("Lovable").select(SEARCH_COLUMNS)
          .eq("is_active", true)
          .not("image_thumb_url", "is", null)
          .neq("image_thumb_url", "")
          .gte("price", Math.floor(minPrice * priceMinMult))
          .lte("price", Math.ceil(maxPrice * priceMult));

        if (make && level < 2) q = q.ilike("make", `%${make}%`);
        // Modellen behålls så länge vi letar fler av samma bil. På nivå 2
        // letar vi istället liknande alternativ från andra märken/modeller.
        if (modelOr && level < 2) q = q.or(modelOr);

        if (fuels.length > 0 && level < 3) {
          const ff = fuels.map((x: string) => fuelPatterns[x]).filter(Boolean).map((p: string) => `fuel_type.ilike.${p}`).join(",");
          if (ff) q = q.or(ff);
          if (fuels.includes("hybrid") && !fuels.includes("laddhybrid")) {
            q = q.not("fuel_type", "ilike", "%Laddhybrid%");
          }
        }
        if (bodies.length > 0) {
          const bf = bodies.map((x: string) => bodyPatterns[x]).filter(Boolean).map((p: string) => `body_type.ilike.${p}`);
          const mf: string[] = [];
          for (const bt of bodies) { const ms = modelBodyTypeMap[bt]; if (ms) for (const m of ms) mf.push(`model.ilike.%${m}%`); }
          // Do not admit Unknown/null here: that previously allowed vans and
          // other unrelated vehicles into an explicit sedan/wagon/SUV search.
          const all = [...bf, ...mf].join(",");
          if (all) q = q.or(all);
        }
        if (dt && level < 2) {
          const vals = drivetrainPatterns[dt];
          if (vals) q = q.or(vals.map(v => `drivetrain.eq.${v}`).join(",") + ",drivetrain.eq.Unknown,drivetrain.is.null");
        }
        // Årsmodell är ett hårt krav i "Visa fler" — kunden vill inte få
        // 10 år äldre bilar bara för att modellen matchar.
        if (yMin) q = q.gte("year", yMin);
        if (yMax) q = q.lte("year", yMax);
        if (trans) {
          const tp = transmissionPatterns[trans];
          if (level === 0) {
            q = q.ilike("transmission", tp);
          } else {
            q = q.or(`transmission.ilike.${tp},transmission.is.null`);
          }
        }

        // Bilfirma är hårt på alla nivåer — bad kunden om en firma ska "Visa
        // fler" aldrig blanda in andra firmors bilar.
        if (dealerInclude.length > 0) {
          q = q.or(dealerInclude.map((d) => `dealer_name.ilike.%${d}%`).join(","));
        }
        for (const d of dealerExclude) {
          q = q.not("dealer_name", "ilike", `%${d}%`);
        }

        // Exclude already-shown cars in one PostgREST filter instead of
        // generating a long chain of individual predicates.
        if (safeExcludeIds.length > 0) {
          q = q.not("id", "in", `(${safeExcludeIds.join(",")})`);
        }

        return q.order("price", { ascending: true }).limit(18);
      };


      // Sort by proximity to budget midpoint
      const budgetMid = (minPrice + maxPrice) / 2;

      // Hämta både "mer av samma modell" och liknande alternativ, och blanda
      // dem så att listan inte blir 9 exemplar av samma bil.
      const cars: any[] = [];
      const seenIds = new Set<number>();
      const perModel: Record<string, number> = {};
      const MAX_PER_MODEL = 2;

      for (let level = 0; level <= 2 && cars.length < 9; level++) {
        const { data: moreCars, error: moreCarsError } = await buildLoadMoreQuery(level);
        if (moreCarsError) {
          console.error("Load more database query failed", moreCarsError.message);
          continue;
        }
        if (!moreCars || moreCars.length === 0) continue;

        const ranked = [...moreCars].sort(
          (a: any, b: any) => Math.abs((a.price || 0) - budgetMid) - Math.abs((b.price || 0) - budgetMid)
        );
        for (const c of ranked) {
          if (cars.length >= 9) break;
          if (seenIds.has(c.id)) continue;
          const key = `${(c.make || "").toLowerCase()}|${(c.model || "").toLowerCase()}`;
          if ((perModel[key] || 0) >= MAX_PER_MODEL) continue;
          perModel[key] = (perModel[key] || 0) + 1;
          seenIds.add(c.id);
          cars.push(c);
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
            signal: AbortSignal.timeout(5000),
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
        } catch (e) { console.error("Load more AI reason failed or timed out"); }
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

    if (!isLoadMore && !isConfirmedSearch) {
      const validation = validateMessages(body.messages);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ action: "error", error: validation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Received", Array.isArray(messages) ? messages.length : 0, "messages");


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Required configuration missing");
    }

    let decision: any = null;

    if (isLoadMore || isConfirmedSearch) {
      decision = {
        action: "search",
        filters: body.filters || {},
        reasoning: "",
        customerProfile: typeof body.customerProfile === "string" ? body.customerProfile : "",
      };
    } else {


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
        signal: AbortSignal.timeout(20000),
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

    // Ingen bekräftelse-mellanstopp: när Clutch bestämt sig söker vi direkt.


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

      // Daily search limit: max 30 new searches per IP per 24h
      const { limited } = await checkAndRecordDailyLimit(supabase, clientIp);
      if (limited) {
        return new Response(
          JSON.stringify({
            action: "ask",
            message: "Du har gjort dina 30 kostnadsfria sökningar för idag. Kom tillbaka imorgon så hjälper vi dig hitta rätt bil!",
            suggestions: [],
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
      const sanitizedModel = sanitizeModelFilter(filters.model);
      const modelOrClause = sanitizedModel
        ? modelVariants(sanitizedModel)
            .flatMap((v) => [`model.ilike.%${v}%`, `model_raw.ilike.%${v}%`])
            .join(",")
        : null;

      const sanitizedColor = sanitizeStringFilter(filters.color);
      const sanitizedDrivetrain = typeof filters.drivetrain === "string" && filters.drivetrain in drivetrainPatterns
        ? filters.drivetrain : null;

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

      const hiddenGem = filters.vibe === "hiddenGem";

      const sanitizedTransmission = typeof filters.transmission === "string" &&
        filters.transmission.toLowerCase() in transmissionPatterns
        ? filters.transmission.toLowerCase() : null;

      // Validate feature requests against known featurePatterns
      const validFeatures: string[] = Array.isArray(filters.features)
        ? filters.features.filter((f: unknown) => typeof f === "string" && f in featurePatterns)
        : [];

      // Bilfirma-filter: hårda krav som aldrig relaxas.
      const dealerInclude = sanitizeDealerList(filters.dealerInclude);
      const dealerExclude = sanitizeDealerList(filters.dealerExclude);



      // Progressive relaxation search — run levels 0 and 1 in parallel for speed
      let cars: any[] = [];
      let relaxLevel = 0;

      const buildQuery = (level: number) => {
        let query = supabase.from("Lovable").select(SEARCH_COLUMNS as string)
          .eq("is_active", true)
          .not("image_thumb_url", "is", null)
          .neq("image_thumb_url", "");


        const priceMult = [1, 1.3, 1.6, 10][level];
        const priceMinMult = [1, 0.7, 0.5, 0][level];
        query = query
          .gte("price", Math.floor(minPrice * priceMinMult))
          .lte("price", Math.ceil(maxPrice * priceMult));

        if (sanitizedCity && level < 1) {
          query = query.ilike("city", `%${sanitizedCity}%`);
        }
        // Märke behålls hela vägen när kunden bett om en specifik modell.
        if (sanitizedMake && (level < 2 || modelOrClause)) {
          query = query.ilike("make", `%${sanitizedMake}%`);
        }
        // Specifik modell är ett hårt krav — relaxas aldrig.
        if (modelOrClause) {
          query = query.or(modelOrClause);
        }

        if (validFuels.length > 0 && level < 2) {
          const fuelFilters = validFuels
            .map((f: string) => fuelPatterns[f])
            .filter(Boolean)
            .map((p: string) => `fuel_type.ilike.${p}`)
            .join(",");
          if (fuelFilters) query = query.or(fuelFilters);
          // Prevent %Hybrid% from matching Laddhybrid when user only asked for hybrid
          if (validFuels.includes("hybrid") && !validFuels.includes("laddhybrid")) {
            query = query.not("fuel_type", "ilike", "%Laddhybrid%");
          }
        }
        if (validBodyTypes.length > 0 && level < 1) {
          // Match by body_type field, Unknown body_type, OR by model name
          const bodyFilters = validBodyTypes
            .map((b: string) => bodyPatterns[b])
            .filter(Boolean)
            .map((p: string) => `body_type.ilike.${p}`);
          
          // Also match model names that imply the body type
          const modelFilters: string[] = [];
          for (const bt of validBodyTypes) {
            const models = modelBodyTypeMap[bt];
            if (models) {
              for (const m of models) {
                modelFilters.push(`model.ilike.%${m}%`);
              }
            }
          }
          
          // Include cars marked Unknown (enriched but unrecognized body type), exclude null (not yet enriched)
          const allFilters = [...bodyFilters, ...modelFilters, "body_type.eq.Unknown"].join(",");
          if (allFilters) query = query.or(allFilters);
        }
        if (sanitizedColor && level < 1) {
          // Match exact color, quoted (AI-inferred) color, and Unknown/null
          query = query.or(`color.ilike.%${sanitizedColor}%,color.ilike.%"${sanitizedColor}"%,color.eq.Unknown,color.is.null`);
        }
        if (sanitizedDrivetrain && level < 2) {
          const dtValues = drivetrainPatterns[sanitizedDrivetrain];
          if (dtValues) {
            const dtFilters = dtValues.map(v => `drivetrain.eq.${v}`).join(",");
            query = query.or(`${dtFilters},drivetrain.eq.Unknown,drivetrain.is.null`);
          }
        }
        if (yearMin && level < 2) query = query.gte("year", yearMin);
        if (yearMax && level < 2) query = query.lte("year", yearMax);

        // Växellåda: hårt krav till och med nivå 2 — kunden som ber om automat
        // ska aldrig få manuella bilar. Null-värden (ej berikade) tillåts
        // bara från nivå 1+ för att undvika falska träffar på strikt nivå 0.
        if (sanitizedTransmission && level < 3) {
          const p = transmissionPatterns[sanitizedTransmission];
          if (level === 0) {
            query = query.ilike("transmission", p);
          } else {
            query = query.or(`transmission.ilike.${p},transmission.is.null`);
          }
        }

        // Bilfirma: hårt krav på alla relaxeringsnivåer. Ber kunden om en
        // specifik firma får de bara bilar från den firman.
        if (dealerInclude.length > 0) {
          query = query.or(dealerInclude.map((d) => `dealer_name.ilike.%${d}%`).join(","));
        }
        for (const d of dealerExclude) {
          query = query.not("dealer_name", "ilike", `%${d}%`);
        }



        // Feature/tillval filtering via model_raw ILIKE (Blockets annonstitel)
        // Droppas vid level >= 2 (relaxation) för att undvika för få träffar
        if (validFeatures.length > 0 && level < 2) {
          for (const feat of validFeatures) {
            const patterns = featurePatterns[feat];
            if (patterns) {
              const orClause = patterns.map(p => `model_raw.ilike.${p}`).join(",");
              query = query.or(orClause);
            }
          }
        }

        if (safeExcludeIds.length > 0) {
          query = query.not("id", "in", `(${safeExcludeIds.join(",")})`);
        }

        // Candidate pool big enough to diversify, small enough to stay fast.
        const orderKeys = hiddenGem
          ? ["horsepower", "year", "mileage"]
          : ["price", "year", "mileage"];
        const orderBy = orderKeys[Math.floor(Math.random() * orderKeys.length)];
        return query
          .order(orderBy, { ascending: orderBy === "mileage" || (!hiddenGem && orderBy === "price"), nullsFirst: false })
          .limit(80);
      };

      // Run relaxation levels sequentially — stop as soon as one gives enough
      // candidates. Running them in parallel doubled DB load for nothing.
      for (const level of [0, 1, 2, 3]) {
        const res = await buildQuery(level);
        if (res.error) console.error("Search query error at level", level, res.error.message);
        if (res.data && res.data.length > 0) {
          cars = res.data as any[];
          relaxLevel = level;
          break;
        }
      }


      // Vilka krav vi faktiskt tummade på — förklaras för kunden i resultatet.
      const relaxations: string[] = [];
      if (relaxLevel >= 1) {
        relaxations.push("Jag vidgade prisintervallet lite för att hitta bilar.");
        if (sanitizedCity) relaxations.push(`Jag sökte i hela landet istället för bara ${sanitizedCity}.`);
        if (validBodyTypes.length > 0) relaxations.push("Jag släppte kravet på karosstyp.");
        if (sanitizedColor) relaxations.push("Jag släppte färgönskemålet.");
      }
      if (relaxLevel >= 2) {
        if (sanitizedMake && !modelOrClause) relaxations.push("Jag tittade även på andra märken.");
        if (validFuels.length > 0) relaxations.push("Jag släppte kravet på drivmedel.");
        if (sanitizedDrivetrain) relaxations.push("Jag släppte kravet på drivning (fyrhjulsdrift/framhjulsdrift).");
        if (yearMin || yearMax) relaxations.push("Jag tillät fler årsmodeller.");
        if (validFeatures.length > 0) relaxations.push("Jag släppte kravet på specifika tillval.");
      }
      if (relaxLevel >= 3) {
        relaxations.push("Jag tog bort pristaket för att hitta något alls.");
        if (sanitizedTransmission) relaxations.push(`Jag släppte kravet på ${sanitizedTransmission}.`);
      }


      // Score, diversify and randomize the pool so the same cars don't dominate
      if (cars.length > 0) {
        const midPrice = (minPrice + maxPrice) / 2;
        const spread = Math.max(1, maxPrice - minPrice);

        // Common/high-volume makes get penalized in hidden-gem mode
        const commonMakes = new Set([
          "volvo", "volkswagen", "toyota", "kia", "hyundai", "ford",
          "peugeot", "renault", "opel", "skoda", "nissan", "citroen", "seat",
        ]);
        const funMakes = new Set([
          "porsche", "jaguar", "alfa romeo", "lotus", "maserati", "mini",
          "abarth", "subaru", "mazda", "saab", "lancia", "smart", "fiat",
          "chevrolet", "dodge", "cadillac", "lexus", "honda", "mitsubishi", "suzuki",
        ]);
        const funBodies = new Set(["cab", "coupe", "cabriolet", "coupé", "halvkombi"]);

        const useCase = typeof filters.useCase === "string" ? filters.useCase.toLowerCase() : null;
        const currentYear = new Date().getFullYear();
        // Svenskt snitt: ~1 500 mil per år.
        const NORMAL_MIL_PER_YEAR = 1500;

        const score = (c: any) => {
          let s = 0;
          // Budget fit (always matters, but softer in hidden-gem mode)
          const budgetFit = 1 - Math.min(1, Math.abs((c.price ?? 0) - midPrice) / spread);
          s += budgetFit * (hiddenGem ? 20 : 60);

          if (hiddenGem) {
            const make = (c.make || "").toLowerCase();
            const body = (c.body_type || "").toLowerCase();
            if (funMakes.has(make)) s += 30;
            if (commonMakes.has(make)) s -= 20;
            if (funBodies.has(body)) s += 20;
            if ((c.horsepower ?? 0) >= 200) s += 15;
            if ((c.horsepower ?? 0) >= 300) s += 15;
            if ((c.drivetrain || "").toLowerCase() === "rwd") s += 10;
            if ((c.transmission || "").toLowerCase().includes("manuell")) s += 8;
            if ((c.mileage ?? 0) > 0 && (c.mileage ?? 0) < 12000) s += 8;
          } else {
            // Miltal per år jämfört med normalt — låg förslitning belönas,
            // extremt hög körsträcka straffas.
            const age = Math.max(1, currentYear - (c.year ?? currentYear) + 1);
            const milPerYear = (c.mileage ?? 0) > 0 ? (c.mileage as number) / age : null;
            if (milPerYear !== null) {
              const ratio = milPerYear / NORMAL_MIL_PER_YEAR;
              if (ratio <= 0.7) s += 18;
              else if (ratio <= 1.1) s += 12;
              else if (ratio <= 1.5) s += 4;
              else s -= 10;
            }

            // Nyare bil ger något högre poäng
            if ((c.year ?? 0) > 0) s += Math.min(18, Math.max(0, (c.year - 2010) * 1.2));

            // Komplett data — annonser med hästkrafter och drivlina känns mer
            // pålitliga än tomma annonser.
            if ((c.horsepower ?? 0) > 0) s += 6;
            const dtv = (c.drivetrain || "").toLowerCase();
            if (dtv && dtv !== "unknown") s += 5;
            const bodyVal = (c.body_type || "").toLowerCase();
            if (bodyVal && !["unknown", "okänd", "personbil", "transportbil"].includes(bodyVal)) s += 4;

            // Passar bilen kundens användningsområde?
            const fuel = (c.fuel_type || "").toLowerCase();
            const isElectric = fuel.includes("el") && !fuel.includes("diesel");
            const isHybrid = fuel.includes("hybrid");
            const body = (c.body_type || "").toLowerCase();
            if (useCase === "pendling") {
              if (isElectric || isHybrid) s += 14;
              if (fuel.includes("diesel")) s += 6;
              if ((c.mileage ?? 0) > 0 && (c.mileage as number) < 12000) s += 4;
            } else if (useCase === "familj") {
              if (body.includes("kombi") || body.includes("suv")) s += 14;
              if ((c.seats ?? 0) >= 7) s += 8;
              if (body.includes("coupe") || body.includes("cab")) s -= 12;
            } else if (useCase === "stad") {
              if (body.includes("halvkombi") || body.includes("småbil")) s += 12;
              if (isElectric) s += 8;
              if (body.includes("suv")) s -= 4;
            } else if (useCase === "langresa") {
              if (body.includes("kombi") || body.includes("sedan") || body.includes("suv")) s += 10;
              if (fuel.includes("diesel") || isHybrid) s += 8;
              if ((c.horsepower ?? 0) >= 150) s += 4;
            }
          }


          // Random jitter so repeated searches surface different cars
          s += Math.random() * (hiddenGem ? 35 : 22);
          return s;
        };

        const ranked = cars
          .map((c: any) => ({ c, s: score(c) }))
          .sort((a, b) => b.s - a.s);

        // Diversify: max 1 car per make+model, max 2 per make (relax if too few)
        const pick = (maxPerModel: number, maxPerMake: number) => {
          const modelCount = new Map<string, number>();
          const makeCount = new Map<string, number>();
          const out: any[] = [];
          for (const { c } of ranked) {
            if (out.length >= 9) break;
            const mk = (c.make || "?").toLowerCase();
            const md = `${mk}|${(c.model || "?").toLowerCase()}`;
            if ((modelCount.get(md) ?? 0) >= maxPerModel) continue;
            if ((makeCount.get(mk) ?? 0) >= maxPerMake) continue;
            modelCount.set(md, (modelCount.get(md) ?? 0) + 1);
            makeCount.set(mk, (makeCount.get(mk) ?? 0) + 1);
            out.push(c);
          }
          return out;
        };

        // Har kunden bett om en specifik modell vill de se flera exemplar av
        // just den — då stänger vi av modell-/märkesspridningen.
        let selected = modelOrClause ? pick(9, 9) : pick(1, 2);
        if (!modelOrClause && selected.length < 6) selected = pick(2, 3);
        if (selected.length < 3) selected = ranked.slice(0, 9).map((r) => r.c);
        cars = selected.slice(0, 9);

      }

      // Build context from conversation
      const userMessages = (Array.isArray(messages) ? messages : [])
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .join(". ") || customerProfile;


      // Generate personalized result message + per-car reasons
      let message = "";
      let carReasons: { carId: number; reason: string }[] = [];
      let suggestions: string[] = [];

      if (cars.length > 0) {
        try {
          const carSummaries = cars
            .map(
              (c: any) =>
                `ID:${c.id} — ${c.make} ${c.model} ${c.year}, ${c.price?.toLocaleString("sv-SE")} kr, ${c.fuel_type}, ${c.body_type}, ${c.mileage?.toLocaleString("sv-SE")} mil, ${c.city}, färg: ${c.color || "okänd"}`
            )
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
                    content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare. Du pratar DIREKT med personen som söker — säg "du" och "dig". Skriv ALDRIG "kunden", "kunden ville", "kundens behov" eller något annat i tredje person.\n\nDu ska göra två saker:\n\n1. Ge en kort personlig sammanfattning (max 2 meningar) om varför dessa bilar passar dig.\n2. För VARJE bil, ge en kort motivering (1 mening) om varför just den bilen passar.\n\nHåll det lätt och avslappnat — rada inte upp alla filter eller förklara sökningen i detalj. Nämn bara det som faktiskt betyder något. Använd INTE emojis.${langInstruction}\n\n${reasoning ? `Din resonering (internt, upprepa den inte ordagrant): ${reasoning}` : ""}\n${customerProfile ? `Det du vet om personen (internt): ${customerProfile}` : ""}\n\nVar varm, professionell och objektiv.\n\nSvara ENBART med JSON (ingen markdown, inga code fences):\n{"message":"Din sammanfattning här","carReasons":[{"carId":123,"reason":"Motivering för denna bil"}]}`,
                  },
                  {
                    role: "user",
                    content: `Önskemål: "${userMessages}"\n\nBilar:\n${carSummaries}\n\n${relaxations.length > 0 ? `Sökningen breddades lite. Nämn det MYCKET kort och mjukt i en bisats (t.ex. "jag tittade lite bredare för att hitta fler alternativ") — lista inte varje släppt krav: ${relaxations.slice(0, 2).join(" ")}` : ""}`,
                  },
                ],
              }),
              signal: AbortSignal.timeout(20000),
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
                    content: `Du är Clutch, en svensk bilrådgivare. Du pratar DIREKT med personen — säg "du" och "dig", aldrig "kunden" eller något i tredje person. Sökningen gav inga träffar. Du ska:\n1. Kort och mjukt förklara att inget matchade (max 2 meningar, inga långa utläggningar)\n2. Ge 2-3 konkreta förslag på hur du kan ändra sökningen\n\nSvara ENBART med JSON (ingen markdown, inga code fences):\n{"message":"Tyvärr hittade jag inga bilar som matchar...","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}\n\nFörslagen ska vara specifika och klickbara, t.ex. "Öka budgeten till 200 000 kr", "Prova hybrid istället för el", "Sök i hela Sverige".\nAnvänd INTE emojis.${langInstruction}`,
                  },
                  {
                    role: "user",
                    content: `Önskemål: "${userMessages}". Inga träffar hittades trots breddad sökning.`,
                  },
                ],
              }),
              signal: AbortSignal.timeout(20000),
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
          matchCount: cars.length,
          relaxed: relaxLevel > 0,
          relaxLevel,
          relaxations,

          userAge,
          userCity: sanitizedCity,
          filters,
          customerProfile,
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
    console.error("guided-search error", (e as Error)?.name, (e as Error)?.message, (e as Error)?.stack);
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
