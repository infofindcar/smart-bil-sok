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
};

const drivetrainPatterns: Record<string, string[]> = {
  awd: ["AWD", '"AWD"'],
  fwd: ["FWD", '"FWD"'],
  rwd: ["RWD", '"RWD"'],
};

// Model names that imply a body type (used when body_type is Unknown/null)
const modelBodyTypeMap: Record<string, string[]> = {
  suv: ["XC90", "XC60", "XC40", "EX90", "EX60", "EX40", "EX30", "RAV4", "CR-V", "Tiguan", "Tucson", "Kona", "Sportage", "Niro", "Q3", "Q5", "Q7", "Q8", "X1", "X3", "X5", "X7", "GLC", "GLE", "GLB", "EQA", "EQB", "EQC", "Model Y", "Model X", "ID.4", "ID.5", "Enyaq", "Karoq", "Kodiaq", "Forester", "Outback"],
  kombi: ["V60", "V90", "V70", "V50", "V40", "A4 Avant", "A6 Avant", "3 Touring", "5 Touring", "Octavia Combi", "Superb Combi", "Passat Sportscombi", "Golf Sportscombi"],
  sedan: ["S60", "S90", "S80", "S40", "A4 Sedan", "A6 Sedan", "3 Series", "5 Series", "C-Class", "E-Class", "Model 3", "Model S"],
};

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en intelligent och objektiv svensk bilrådgivare. Du pratar med vanliga människor — inte bilmekaniker. Förklara saker enkelt och tydligt så att vem som helst förstår. Du ska kännas som en riktigt kunnig kompis som hjälper till.

DITT MÅL: Ställ genomtänkta frågor för att verkligen förstå kundens livssituation och hitta EXAKT rätt bil. Ju mer du vet, desto bättre matchning. Ställ minst 5 frågor innan du söker.

VIKTIGT — HUR DU STÄLLER FRÅGOR:
- Förklara VARFÖR du ställer en fråga när det inte är uppenbart. Exempelvis: "Jag frågar om hur långt du kör till jobbet för att veta om elbil räcker eller om du behöver en hybrid."
- Ge korta, begripliga förklaringar av tekniska termer. T.ex. istället för "Vill du ha AWD, FWD eller RWD?" skriv "Behöver du fyrhjulsdrift? Det är bra i snö och på grusvägar, men kostar lite mer i bränsle."
- Använd kundens svar för att ge smarta råd. Exempelvis: "Eftersom du bor i Kiruna kan fyrhjulsdrift vara värt det för vintrarna."
- Var personlig och referera till det kunden redan sagt.

INFORMATION DU BEHÖVER SAMLA (alla påverkar vilken bil som passar):
1. Vad bilen ska användas till (pendling, familj, stad, långresor, blandat)
2. Budget (ungefärligt prisintervall) — förklara gärna att du kan söka bredare om de är osäkra
3. Var personen bor (stad/region) — viktigt för att hitta bilar nära och anpassa råd (t.ex. fyrhjulsdrift i norr)
4. Hur långt de kör per dag/vecka — detta avgör om elbil räcker eller om hybrid/bensin är bättre
5. Drivmedel (el, hybrid, bensin, diesel) — om de inte vet, hjälp dem välja genom att förklara skillnaderna enkelt
6. Karosstyp — fråga på ett begripligt sätt: "Vill du ha en hög bil som en SUV, en praktisk kombi, eller kanske en sportig sedan?" Förklara kort skillnaden.
7. Färgpreferens — nämn att du kan filtrera på färg
8. Växellåda — "Föredrar du automat eller manuell? De flesta nyare bilar har automat."
9. Driftskostnad vs prestanda — "Är det viktigt med låga kostnader per månad, eller vill du ha lite mer kraft under motorhuven?"
10. Årsmodell — "Vill du ha en nyare bil (2020+) eller är en äldre modell okej om den är i bra skick?"
11. Ålder på föraren — "Hur gammal är du ungefär? Det påverkar försäkringskostnaden ganska mycket." (fråga detta naturligt)
12. Eventuella specifika önskemål (märke, utrustning, etc.)

INTELLIGENTA REGLER:
- Om kunden nämner lång pendling → förklara att bränsleeffektivitet och komfort blir extra viktigt, och fråga om budget
- Om kunden nämner familj → fråga hur stor familjen är, om de behöver barnvagnsplats, och om säkerhet (NCAP) är viktigt
- Om kunden nämner stad → "I stan är en mindre bil ofta smidigare att parkera, och elbil kan spara mycket pengar"
- Om kunden säger "låg driftskostnad" → förklara att elbil har lägst driftskostnad, följt av hybrid
- Om kunden nämner en ort → ge råd baserat på det, t.ex. "Bor du i Umeå kan det vara smart med fyrhjulsdrift för vintrarna"
- Om kunden nämner en färg → notera och filtrera
- Om kunden nämner ålder → notera det (påverkar försäkringsberäkning)
- Ställ MAX EN fråga per meddelande
- Var kort, varm och naturlig
- Använd INTE emojis
- Bekräfta kort vad kunden sa innan du ställer nästa fråga
- Om kunden ger mycket info på en gång, hoppa över frågor du redan har svar på

NÄR DU SKA SÖKA: Du ska ha samlat minst 5 av de 12 punkterna ovan ELLER ha ställt minst 5 frågor. Sök INTE förrän du har tillräckligt.

VIKTIG REGEL — ALLTID BEKRÄFTA INNAN SÖKNING:
Innan du bestämmer dig för att söka (action: "search") MÅSTE du alltid ställa en sista bekräftelsefråga. Ge förslag som "Nej, sök nu!", "Jag vill lägga till något" osv. Först EFTER att kunden bekräftar att de är klara ska du returnera action: "search".

NÄR DU STÄLLER EN FRÅGA, inkludera "suggestions" — 2-4 korta svarsförslag. Dessa ska vara enkla och begripliga, inte tekniska.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Om du behöver mer info:
{"action":"ask","message":"Din fråga här","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"drivetrain":"awd","city":"Stad","make":"Märke","color":"Färg","yearMin":2018,"yearMax":2024,"useCase":"pendling","driverAge":30},"reasoning":"Kort förklaring av varför dessa filter valdes","customerProfile":"Sammanfattning av kundens behov och preferenser i 2 meningar"}

Alla filter-fält är valfria — inkludera bara det du har information om.
Giltiga fuel-värden: el, laddhybrid, hybrid, bensin, diesel
Giltiga bodyType-värden: suv, kombi, sedan, halvkombi, coupe
Giltiga drivetrain-värden: awd, fwd, rwd
Giltiga useCase-värden: pendling, familj, langresa, stad, blandat`;

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
    const { messages, language } = body;

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

      // Progressive relaxation search — run levels 0 and 1 in parallel for speed
      let cars: any[] = [];
      let relaxLevel = 0;

      const buildQuery = (level: number) => {
        let query = supabase.from("Lovable").select("*");

        const priceMult = [1, 1.3, 1.6, 10][level];
        const priceMinMult = [1, 0.7, 0.5, 0][level];
        query = query
          .gte("price", Math.floor(minPrice * priceMinMult))
          .lte("price", Math.ceil(maxPrice * priceMult));

        if (sanitizedCity && level < 1) {
          query = query.ilike("city", `%${sanitizedCity}%`);
        }
        if (sanitizedMake && level < 2) {
          query = query.ilike("make", `%${sanitizedMake}%`);
        }
        if (validFuels.length > 0 && level < 2) {
          const fuelFilters = validFuels
            .map((f: string) => fuelPatterns[f])
            .filter(Boolean)
            .map((p: string) => `fuel_type.ilike.${p}`)
            .join(",");
          if (fuelFilters) query = query.or(fuelFilters);
        }
        if (validBodyTypes.length > 0 && level < 1) {
          // Match by body_type field, Unknown/null body_type, OR by model name
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
          
          // Include cars with Unknown/null body_type
          const allFilters = [...bodyFilters, ...modelFilters, "body_type.eq.Unknown", "body_type.is.null"].join(",");
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

        return query.order("price", { ascending: true }).limit(9);
      };

      // Fire levels 0 and 1 in parallel
      const [res0, res1] = await Promise.all([
        buildQuery(0),
        buildQuery(1),
      ]);

      if (res0.data && res0.data.length > 0) {
        cars = res0.data;
        relaxLevel = 0;
      } else if (res1.data && res1.data.length > 0) {
        cars = res1.data;
        relaxLevel = 1;
      } else {
        // Try levels 2 and 3 in parallel
        const [res2, res3] = await Promise.all([
          buildQuery(2),
          buildQuery(3),
        ]);
        if (res2.data && res2.data.length > 0) {
          cars = res2.data;
          relaxLevel = 2;
        } else if (res3.data && res3.data.length > 0) {
          cars = res3.data;
          relaxLevel = 3;
        }
      }

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
                    content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare som pratar med vanliga människor. Du har tillgång till detaljerad data om varje bil. Du ska göra två saker:

1. Ge en kort personlig sammanfattning (max 2 meningar) om varför dessa bilar passar kundens situation.
2. För VARJE bil, ge en kort personlig motivering (1 mening) om varför just den bilen passar kunden baserat på deras specifika behov.

Använd den berikade datan aktivt i dina motiveringar men förklara enkelt:
- Säkerhet: Euro NCAP-stjärnor (förklara kort vad det innebär om relevant)
- Prestanda: hästkrafter, 0-100
- Praktiskt: bagageutrymme, dragvikt, antal säten
- Ekonomi: bränsleförbrukning, CO2, elräckvidd, garanti, uppskattade driftskostnader
- Tillförlitlighet: kända problem eller styrkor
- Komfort: drivlina (skriv "fyrhjulsdrift" istället för AWD), växellåda
- Om kundens ålder är känd: nämn att försäkringskostnaden påverkas av ålder

Var specifik — nämn siffror när de är relevanta (t.ex. "5 NCAP-stjärnor vilket är högsta betyget", "450L bagageutrymme, plats för barnvagn och väskor"). Använd INTE emojis.${langInstruction}

${reasoning ? `Din resonering: ${reasoning}` : ""}
${customerProfile ? `Kundprofil: ${customerProfile}` : ""}

Var varm, professionell och objektiv.

Svara ENBART med JSON (ingen markdown, inga code fences):
{"message":"Din sammanfattning här","carReasons":[{"carId":123,"reason":"Motivering för denna bil"}]}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}"\n\nBilar:\n${carSummaries}\n\n${relaxLevel > 0 ? "Sökningen breddades för att hitta resultat." : ""}`,
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
          matchCount: cars.length,
          relaxed: relaxLevel > 0,
          relaxLevel,
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
