import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 25;
const BATCH_SIZE = 8;

// ─────────────────────────────────────────────
// Svensk fordonsskatt – deterministisk formel
// Källa: Transportstyrelsen / Lag (2006:228) §4-7
// Gäller bilar registrerade fr.o.m. 2018-07-01
// ─────────────────────────────────────────────
function calcAnnualTax(co2: number, fuelType: string): number {
  const fuel = (fuelType ?? "").toLowerCase();
  if (fuel.includes("el") || fuel.includes("vätgas") || fuel.includes("hydrogen")) {
    return 360; // elbil/vätgas – minimibelopp
  }
  if (co2 <= 0) return 360; // okänd – visa minimum
  const base = 360 + Math.max(0, co2 - 111) * 22;
  if (fuel.includes("diesel")) return Math.round(base * 2.37);
  return Math.round(base);
}

// ─────────────────────────────────────────────
// Euro NCAP lookup
// Söker deras publika webbplats och extraherar stjärnor + år
// ─────────────────────────────────────────────
async function lookupEuroNcap(make: string, model: string): Promise<{ stars: number; year: number; source: string } | null> {
  try {
    const query = encodeURIComponent(`${make} ${model}`);
    const res = await fetch(
      `https://www.euroncap.com/en/results/search/?searchText=${query}&class=&year=`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; car-data-enricher/1.0)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;
    const html = await res.text();

    // Euro NCAP embeds result data as JSON in <script type="application/json"> or data attributes
    // Pattern: "overallRating":5 or data-stars="5" with year nearby
    const starsMatch = html.match(/"overallRating"\s*:\s*(\d)/);
    const yearMatch = html.match(/"testYear"\s*:\s*(\d{4})/) ??
                      html.match(/class="[-\w]*year[-\w]*"[^>]*>(\d{4})</) ??
                      html.match(/(\d{4})/);

    if (starsMatch) {
      return {
        stars: parseInt(starsMatch[1]),
        year: yearMatch ? parseInt(yearMatch[1]) : 0,
        source: "euroncap",
      };
    }

    // Fallback: look for star rating in visible text pattern
    const altMatch = html.match(/(\d)\s*Stars?/i);
    if (altMatch) {
      return {
        stars: parseInt(altMatch[1]),
        year: yearMatch ? parseInt(yearMatch[1]) : 0,
        source: "euroncap",
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// AI helper – Gemini Flash Lite för faktafrågor
// ─────────────────────────────────────────────
async function askAI(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ─────────────────────────────────────────────
// Berika ett make+model i car_models – körs EN gång, cachas för alltid
// Ordning: Euro NCAP (gratis, faktabaserad) → AI (för resten)
// ─────────────────────────────────────────────
async function enrichModel(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  make: string,
  model: string,
  fuelType: string | null
): Promise<Record<string, unknown>> {
  const prompt = `${make} ${model}`;

  // 1. Hämta Euro NCAP-data (ingen AI)
  const ncap = await lookupEuroNcap(make, model);

  // 2. Kör AI-frågor parallellt för allt annat
  const [
    bodyType,
    co2Raw,
    consumptionRaw,
    electricRangeRaw,
    hpMinRaw,
    hpMaxRaw,
    zeroHundredRaw,
    bootSpaceRaw,
    towingRaw,
    seatsRaw,
    drivetrainRaw,
    reliabilityNotes,
    ncapAI,
  ] = await Promise.all([
    askAI(apiKey,
      "Car expert. Reply ONLY one of: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil, UNKNOWN",
      `Body type of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (WLTP combined CO2 g/km). EVs: 0. Unknown: 0.",
      `CO2 g/km of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY a number (WLTP avg liters/100km). EVs: 0. Unknown: 0.",
      `Fuel consumption l/100km of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (WLTP electric range km). Non-EVs: 0.",
      `Electric range km WLTP of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (minimum HP across engine variants). Unknown: 0.",
      `Min horsepower of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (maximum HP across engine variants). Unknown: 0.",
      `Max horsepower of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY a decimal (fastest 0-100 km/h in seconds). Unknown: 0.",
      `Fastest 0-100 km/h sec of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (typical boot space liters, standard position). Unknown: 0.",
      `Boot space liters of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (max towing capacity kg). Unknown: 0.",
      `Max towing kg of ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY an integer (number of seats standard). Unknown: 5.",
      `Seats in ${prompt}?`
    ),
    askAI(apiKey,
      "Car expert. Reply ONLY one of: AWD, FWD, RWD, UNKNOWN (most common base model drivetrain).",
      `Default drivetrain of ${prompt}?`
    ),
    // Reliability notes på svenska – kort och kärnfull
    askAI(apiKey,
      "Car expert. Reply in Swedish, max 2 sentences. Mention key strengths and any widely-known reliability issues. If nothing notable, reply NONE.",
      `Key reliability notes about ${prompt}?`
    ),
    // NCAP via AI som fallback om webbsökning misslyckades
    ncap ? Promise.resolve("") : askAI(apiKey,
      "Car expert. Reply ONLY an integer 1-5 (Euro NCAP stars). Unknown: 0.",
      `Euro NCAP stars of ${prompt}?`
    ),
  ]);

  // CO2 beräknas här – tax räknas ut on-the-fly vid visning
  const co2 = parseInt(co2Raw) || 0;
  const effectiveFuel = fuelType ?? "bensin";

  const BODY_TYPES = ["SUV","Sedan","Kombi","Halvkombi","Coupé","Cab","Pickup","Minibuss","Småbil"];
  const DRIVETRAINS = ["AWD","FWD","RWD"];

  const ncapStars = ncap ? ncap.stars : (parseInt(ncapAI) || null);
  const ncapYear = ncap?.year || null;
  const ncapSource = ncap ? "euroncap" : (ncapStars ? "ai_estimate" : null);

  const modelData: Record<string, unknown> = {
    make,
    model,
    body_type:               BODY_TYPES.includes(bodyType) ? bodyType : null,
    fuel_consumption_l100km: parseFloat(consumptionRaw) || null,
    electric_range_km:       parseInt(electricRangeRaw) || null,
    co2_g_per_km:            co2 || null,
    euro_ncap_stars:         ncapStars,
    euro_ncap_year:          ncapYear,
    ncap_source:             ncapSource,
    drivetrain_default:      DRIVETRAINS.includes(drivetrainRaw) ? drivetrainRaw : null,
    typical_hp_min:          parseInt(hpMinRaw) || null,
    typical_hp_max:          parseInt(hpMaxRaw) || null,
    zero_to_hundred_sec:     parseFloat(zeroHundredRaw) || null,
    boot_space_liters:       parseInt(bootSpaceRaw) || null,
    max_towing_kg:           parseInt(towingRaw) || null,
    seats:                   parseInt(seatsRaw) || 5,
    reliability_notes:       (reliabilityNotes && reliabilityNotes !== "NONE") ? reliabilityNotes : null,
    enriched_at:             new Date().toISOString(),
  };

  await supabase.from("car_models").upsert(modelData as any, { onConflict: "make,model" });
  return modelData;
}

// ─────────────────────────────────────────────
// Bildanalys för färg – unik per bil, kan inte cachas
// ─────────────────────────────────────────────
async function detectColor(apiKey: string, imageUrl: string, make: string, model: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "system",
        content: "Car color expert. Identify the primary car color in Swedish. Use ONLY these values: Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld. Reply ONLY the color name in Swedish. If unsure reply UNKNOWN.",
      }, {
        role: "user",
        content: [
          { type: "text", text: `What color is this ${make} ${model}?` },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return "Okänd";
  const data = await res.json();
  const color = data.choices?.[0]?.message?.content?.trim() ?? "";
  return (color && color !== "UNKNOWN" && color.length < 30) ? color : "Okänd";
}

// ─────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { password } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Räkna hur många bilar som behöver berikas ──
    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .or("color.eq.Unknown,color.is.null,body_type.is.null,body_type.eq.Unknown");

    // ── Hämta chunk ──
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, color, body_type, image_thumb_url, drivetrain, horsepower, year, fuel_type, transmission")
      .or("color.eq.Unknown,color.is.null,body_type.is.null,body_type.eq.Unknown")
      .limit(CHUNK_SIZE);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: "Alla bilar är redan berikade!", processed: 0, remaining: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Ladda car_models cache för denna chunk ──
    const uniqueMakes  = [...new Set(cars.map((c) => c.make).filter(Boolean))];
    const uniqueModels = [...new Set(cars.map((c) => c.model).filter(Boolean))];
    const { data: cachedModels } = await supabase
      .from("car_models").select("*")
      .in("make", uniqueMakes).in("model", uniqueModels);

    const modelCache: Record<string, Record<string, unknown>> = {};
    for (const cm of cachedModels ?? []) modelCache[`${cm.make}|||${cm.model}`] = cm;

    // ── Ladda car_makes (garanti) per märke ──
    const { data: makesData } = await supabase
      .from("car_makes").select("*").in("make", uniqueMakes);
    const makesCache: Record<string, Record<string, unknown>> = {};
    for (const mk of makesData ?? []) makesCache[mk.make] = mk;

    console.log(`Bilar: ${cars.length}, modell-cache: ${Object.keys(modelCache).length}/${uniqueModels.length}`);

    const results = {
      colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0,
      horsepowerUpdated: 0, modelsCached: 0, errors: 0,
    };

    for (let i = 0; i < cars.length; i += BATCH_SIZE) {
      const batch = cars.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (car) => {
        try {
          const cacheKey = `${car.make}|||${car.model}`;
          let carModel = modelCache[cacheKey];

          // Berika modellen om den inte finns i cache (AI + NCAP)
          if (!carModel && car.make && car.model) {
            carModel = await enrichModel(supabase as any, LOVABLE_API_KEY, car.make, car.model, car.fuel_type);
            modelCache[cacheKey] = carModel;
            results.modelsCached++;
          }

          const updates: Record<string, unknown> = {};

          if (carModel) {
            // body_type
            if (!car.body_type || car.body_type === "Unknown") {
              updates.body_type = carModel.body_type ?? "Okänd";
              results.bodyTypeUpdated++;
            }
            // drivetrain
            if ((!car.drivetrain || car.drivetrain === "Unknown") && carModel.drivetrain_default) {
              updates.drivetrain = carModel.drivetrain_default;
              results.drivetrainUpdated++;
            }
            // horsepower – sätt mittenvärde av min/max om saknas
            if ((!car.horsepower || car.horsepower === 0) && carModel.typical_hp_min) {
              const hp_min = carModel.typical_hp_min as number;
              const hp_max = (carModel.typical_hp_max as number) || hp_min;
              updates.horsepower = Math.round((hp_min + hp_max) / 2);
              results.horsepowerUpdated++;
            }
          }

          // Färg – AI bildanalys (unik per bil)
          if (!car.color || car.color === "Unknown") {
            updates.color = car.image_thumb_url
              ? await detectColor(LOVABLE_API_KEY, car.image_thumb_url, car.make ?? "", car.model ?? "")
              : "Okänd";
            results.colorUpdated++;
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from("Lovable").update(updates).eq("id", car.id);
          }
        } catch (e) {
          console.error(`Fel för bil ${car.id}:`, e);
          results.errors++;
        }
      }));
    }

    const remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);

    // Bygg ett informativt svarsmeddelande med skatteexempel
    const exampleCar = cars.find((c) => c.fuel_type);
    const taxExample = exampleCar
      ? ` (ex. skatt: ${calcAnnualTax(
          (modelCache[`${exampleCar.make}|||${exampleCar.model}`]?.co2_g_per_km as number) ?? 0,
          exampleCar.fuel_type ?? ""
        )} kr/år)`
      : "";

    return new Response(JSON.stringify({
      success: true,
      processed: cars.length,
      remaining,
      ...results,
      message: remaining > 0
        ? `Berikade ${cars.length} bilar (${results.modelsCached} nya modeller cachade)${taxExample}. ${remaining} kvar.`
        : `Klart! Berikade ${cars.length} bilar. Alla berikade.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("enrich-car-data error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Exportera calcAnnualTax så frontend kan använda den direkt (noll API-anrop)
export { calcAnnualTax };
