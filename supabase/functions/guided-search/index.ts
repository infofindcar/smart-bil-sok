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
const DAILY_SEARCH_LIMIT = 3;

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

const drivetrainPatterns: Record<string, string[]> = {
  awd: ["AWD", '"AWD"'],
  fwd: ["FWD", '"FWD"'],
  rwd: ["RWD", '"RWD"'],
};

// Only fields rendered by the results UI. In particular, omit the large
// description column from every candidate response.
const SEARCH_COLUMNS =
  "id,make,model,model_raw,year,price,mileage,fuel_type,body_type,drivetrain,city,color,image_thumb_url,regnr,horsepower,transmission,dealer_name";

// Model names that imply a body type (used when body_type is Unknown/null)
const modelBodyTypeMap: Record<string, string[]> = {
  suv: ["XC90", "XC60", "XC40", "EX90", "EX60", "EX40", "EX30", "RAV4", "CR-V", "Tiguan", "Tucson", "Kona", "Sportage", "Niro", "Q3", "Q5", "Q7", "Q8", "X1", "X3", "X5", "X7", "GLC", "GLE", "GLB", "EQA", "EQB", "EQC", "Model Y", "Model X", "ID.4", "ID.5", "Enyaq", "Karoq", "Kodiaq", "Forester", "Outback"],
  kombi: ["V60", "V90", "V70", "V50", "V40", "A4 Avant", "A6 Avant", "3 Touring", "5 Touring", "Octavia Combi", "Superb Combi", "Passat Sportscombi", "Golf Sportscombi"],
  sedan: ["S60", "S90", "S80", "S40", "A4 Sedan", "A6 Sedan", "3 Series", "5 Series", "C-Class", "E-Class", "Model 3", "Model S"],
  cab: ["SL", "Z4", "Z3", "Boxster", "718 Boxster", "Cayman", "F-Type", "MX-5", "TT Roadster", "Mustang Convertible", "4 Cabrio", "3 Cabriolet", "C70", "124 Spider"],
};

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en intelligent och objektiv svensk bilrådgivare. Du har ett naturligt samtal med kunden för att förstå exakt vilken bil som passar dem bäst. Du ska kännas som en riktig människa som bryr sig.

DITT MÅL: Ställ tillräckligt med frågor för att verkligen förstå kundens situation och kunna hitta EXAKT rätt bil. Du ska ställa minst 5 frågor innan du söker.

INFORMATION DU BEHÖVER SAMLA — dessa är viktiga, men ställ dem i den ORDNING som känns mest naturlig utifrån vad kunden redan sagt. Variera alltid ordning och formulering så varje samtal känns unikt:

MÅSTE alltid fråga (om inte redan besvarat):
- Budget — vad är kundens ungefärliga prisbild?
- Användningsområde — pendling, familj, stad, långresor, blandat?

BRA ATT VETA (välj de mest relevanta för just den här kunden):
- Var bor kunden? (stad/region — för bilar i närheten)
- Hur långt kör de dagligen/veckovis? (påverkar drivlina)
- Drivlina — el, hybrid, bensin, diesel? (eller hjälp dem välja)
- Karosstyp — SUV, kombi, sedan? (eller härledd från behov)
- Ålder på kunden (påverkar försäkring markant för unga)
- Årsmodell — nyare eller äldre bil?
- Färg — har de önskemål?
- Växellåda — automat eller manuell?
- Specifika önskemål — märke, utrustning?

VARIATION I FRÅGOR — formulera aldrig två samtal likadant. Exempel på hur samma fråga kan ställas olika:
- Budget: "Vad har du att röra dig med?" / "Hur ser budgeten ut?" / "Vad är du beredd att lägga?"
- Användning: "Vad ska bilen användas till?" / "Hur ser din vardag ut?" / "Pendlar du, eller är det mer familjebil?"
- Plats: "Var bor du?" / "Vilken del av landet håller du till i?" / "Var söker vi bilar?"
- Drivlina: "Har du kört el förut?" / "Är du öppen för elbil?" / "Bensin, diesel eller något modernare?"

INTELLIGENTA REGLER:
- Om kunden nämner lång pendling → förstå att bränsleeffektivitet och komfort är viktigt, fråga ändå om budget och plats
- Om kunden nämner familj → förstå att utrymme och säkerhet är viktigt, fråga hur stor familjen är
- Om kunden nämner stad → liten bil och el/hybrid, men fråga om de kör långa sträckor ibland
- Om kunden säger "låg driftskostnad" → el/hybrid och lågt miltal är viktigt
- Om kunden nämner en färg → notera och filtrera på den
- Om kunden nämner automat/manuell → notera det
- Ställ MAX EN fråga per meddelande
- Var kort, varm och naturlig — som en kompis som kan bilar
- Använd INTE emojis
- Bekräfta kort vad kunden sa innan du ställer nästa fråga (t.ex. "Okej, pendling alltså!" / "Schysst!" / "Låter vettigt.")
- Om kunden ger mycket info på en gång, hoppa över frågor du redan har svar på
- Blanda inte ihop frågor — ställ en i taget för att det ska kännas personligt

NÄR DU SKA SÖKA: Du ska ha samlat minst 5 av de 12 punkterna ovan ELLER ha ställt minst 5 frågor. Sök INTE förrän du har tillräckligt för att verkligen kunna filtrera bort fel bilar och ge personliga motiveringar.

VIKTIG REGEL — ALLTID BEKRÄFTA INNAN SÖKNING:
Innan du bestämmer dig för att söka (action: "search") MÅSTE du alltid ställa en sista bekräftelsefråga till kunden: "Är det något mer du vill lägga till innan jag söker?" eller liknande. Ge förslag som "Nej, sök nu!", "Jag vill lägga till något" osv. Först EFTER att kunden bekräftar att de är klara ska du returnera action: "search". Om kunden svarar att de vill lägga till något, fortsätt ställa frågor.

NÄR DU STÄLLER EN FRÅGA, inkludera även "suggestions" — 2-4 korta svarsförslag som kunden kan klicka på. Dessa ska vara relevanta för frågan.

VIKTIGT — PLATSFRÅGAN: När du frågar var kunden bor (stad/region) MÅSTE en av suggestions alltid vara "Spelar ingen roll". Om kunden väljer det, hoppa över city-filtret helt (lämna bort "city" i filters) och sök i hela landet.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Om du behöver mer info:
{"action":"ask","message":"Din fråga här","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"drivetrain":"awd","city":"Stad","make":"Märke","color":"Färg","yearMin":2018,"yearMax":2024,"useCase":"pendling","age":28},"reasoning":"Kort förklaring av varför dessa filter valdes","customerProfile":"Sammanfattning av kundens behov och preferenser i 2 meningar"}

Alla filter-fält är valfria — inkludera bara det du har information om.
"age" ska vara ett heltal (antal år). Inkludera det om kunden uppgett sin ålder.
Giltiga fuel-värden: el, laddhybrid, hybrid, bensin, diesel
Giltiga bodyType-värden: suv, kombi, sedan, halvkombi, coupe, cab
OBS: "cabriolet", "cab", "roadster", "öppen bil", "convertible", "spyder", "spider" → bodyType: "cab"
OBS: "budget" ska ALLTID vara ett intervall "MIN-MAX". Om kunden säger "runt 500k" eller "ungefär X" → skapa ett intervall ±20%: t.ex. "400000-600000". Om kunden nämner ett enda belopp → skapa ett rimligt intervall runt det.
Giltiga drivetrain-värden: awd, fwd, rwd
Giltiga useCase-värden: pendling, familj, langresa, stad, blandat

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
      const dt = typeof f.drivetrain === "string" && f.drivetrain in drivetrainPatterns ? f.drivetrain : null;
      const fuels = Array.isArray(f.fuel) ? f.fuel.filter((x: string) => x in fuelPatterns) : [];
      const bodies = Array.isArray(f.bodyType) ? f.bodyType.filter((x: string) => x in bodyPatterns) : [];
      const yMin = typeof f.yearMin === "number" ? f.yearMin : null;
      const yMax = typeof f.yearMax === "number" ? f.yearMax : null;

      // Progressive relaxation: try with filters, then relax
      const buildLoadMoreQuery = (level: number) => {
        const priceMult = [1.3, 1.6][level] || 1.6;
        const priceMinMult = [0.7, 0.5][level] || 0.5;
        let q = sb.from("Lovable").select(SEARCH_COLUMNS)
          .eq("is_active", true)
          .not("image_thumb_url", "is", null)
          .neq("image_thumb_url", "")
          .gte("price", Math.floor(minPrice * priceMinMult))
          .lte("price", Math.ceil(maxPrice * priceMult));

        // Level 0: all filters except city
        // Level 1: drop body type too
        // Level 2: only price + fuel
        if (make && level < 2) q = q.ilike("make", `%${make}%`);
        if (fuels.length > 0 && level < 3) {
          const ff = fuels.map((x: string) => fuelPatterns[x]).filter(Boolean).map((p: string) => `fuel_type.ilike.${p}`).join(",");
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

        // Exclude already-shown cars in one PostgREST filter instead of
        // generating a long chain of individual predicates.
        if (safeExcludeIds.length > 0) {
          q = q.not("id", "in", `(${safeExcludeIds.join(",")})`);
        }

        return q.order("price", { ascending: true }).limit(18);
      };

      // Sort by proximity to budget midpoint
      const budgetMid = (minPrice + maxPrice) / 2;

      // Try progressively relaxed queries
      let cars: any[] = [];
      for (let level = 0; level <= 1; level++) {
        const { data: moreCars, error: moreCarsError } = await buildLoadMoreQuery(level);
        if (moreCarsError) {
          console.error("Load more database query failed", moreCarsError.message);
          continue;
        }
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

    if (!isLoadMore) {
      const validation = validateMessages(body.messages);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ action: "error", error: validation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Received", messages.length, "messages");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Required configuration missing");
    }

    let decision: any = null;

    if (isLoadMore) {
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

      // Daily search limit: max 3 new searches per IP per 24h
      const { limited } = await checkAndRecordDailyLimit(supabase, clientIp);
      if (limited) {
        return new Response(
          JSON.stringify({
            action: "ask",
            message: "Du har gjort dina 3 kostnadsfria sökningar för idag. Kom tillbaka imorgon så hjälper vi dig hitta rätt bil!",
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
            if ((c.mileage ?? 0) > 0) s += Math.max(0, 15 - (c.mileage ?? 0) / 2000);
            if ((c.year ?? 0) > 0) s += Math.min(15, Math.max(0, (c.year - 2010)));
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

        let selected = pick(1, 2);
        if (selected.length < 6) selected = pick(2, 3);
        if (selected.length < 3) selected = ranked.slice(0, 9).map((r) => r.c);
        cars = selected.slice(0, 9);
      }

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
                    content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare. Du ska göra två saker:\n\n1. Ge en kort personlig sammanfattning (max 2 meningar) om varför dessa bilar passar kundens situation.\n2. För VARJE bil, ge en kort personlig motivering (1 mening) om varför just den bilen passar kunden baserat på deras specifika behov.\n\nVar specifik: nämn varför biltypen/drivlinan/färgen/priset passar deras livsstil. Använd INTE emojis.${langInstruction}\n\n${reasoning ? `Din resonering: ${reasoning}` : ""}\n${customerProfile ? `Kundprofil: ${customerProfile}` : ""}\n\nVar varm, professionell och objektiv.\n\nSvara ENBART med JSON (ingen markdown, inga code fences):\n{"message":"Din sammanfattning här","carReasons":[{"carId":123,"reason":"Motivering för denna bil"}]}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}"\n\nBilar:\n${carSummaries}\n\n${relaxLevel > 0 ? "Sökningen breddades för att hitta resultat." : ""}`,
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
                    content: `Du är Clutch, en svensk bilrådgivare. Kunden sökte bilar men inga hittades. Du ska:\n1. Kort förklara varför det inte finns matchande bilar (max 2 meningar)\n2. Ge 2-3 konkreta förslag på hur kunden kan ändra sin sökning för att hitta bilar\n\nSvara ENBART med JSON (ingen markdown, inga code fences):\n{"message":"Tyvärr hittade jag inga bilar som matchar...","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}\n\nFörslagen ska vara specifika och klickbara, t.ex. "Öka budgeten till 200 000 kr", "Prova hybrid istället för el", "Sök i hela Sverige".\nAnvänd INTE emojis.${langInstruction}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}". Alla relax-nivåer testades utan resultat.`,
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
