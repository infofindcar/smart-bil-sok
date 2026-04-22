import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Antal bilar per chunk – hålls lågt för att undvika Worker Limit
const CHUNK_SIZE = 8;
const BATCH_SIZE = 8;
// Max nya modeller att berika per anrop (varje modell = ~15s AI-tid)
const MAX_NEW_MODELS = 3;
// Max antal iterationer per anrop
const MAX_ITERATIONS = 2;

// ─────────────────────────────────────────────
// Svensk fordonsskatt – deterministisk formel
// Källa: Transportstyrelsen / Lag (2006:228) §4-7
// Gäller bilar registrerade fr.o.m. 2018-07-01
// ─────────────────────────────────────────────
function calcAnnualTax(co2: number, fuelType: string): number {
  const fuel = (fuelType ?? "").toLowerCase();
  if (fuel.includes("el") || fuel.includes("vätgas") || fuel.includes("hydrogen")) {
    return 360;
  }
  if (co2 <= 0) return 360;
  const base = 360 + Math.max(0, co2 - 111) * 22;
  if (fuel.includes("diesel")) return Math.round(base * 2.37);
  return Math.round(base);
}

// ─────────────────────────────────────────────
// Euro NCAP lookup
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
    const starsMatch = html.match(/"overallRating"\s*:\s*(\d)/);
    const yearMatch = html.match(/"testYear"\s*:\s*(\d{4})/) ??
                      html.match(/class="[-\w]*year[-\w]*"[^>]*>(\d{4})</) ??
                      html.match(/(\d{4})/);
    if (starsMatch) {
      return { stars: parseInt(starsMatch[1]), year: yearMatch ? parseInt(yearMatch[1]) : 0, source: "euroncap" };
    }
    const altMatch = html.match(/(\d)\s*Stars?/i);
    if (altMatch) {
      return { stars: parseInt(altMatch[1]), year: yearMatch ? parseInt(yearMatch[1]) : 0, source: "euroncap" };
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// AI helper – Gemini Flash Lite
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
// Berika ett make+model – körs EN gång, cachas för alltid
// ─────────────────────────────────────────────
async function enrichModel(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  make: string,
  model: string,
  fuelType: string | null,
  modelRaw: string | null = null,
): Promise<Record<string, unknown>> {
  const prompt = `${make} ${model}`;
  // Extra context from model_raw (e.g. "2.0 TDI 150hk") helps AI pick the right variant
  const promptWithSpec = modelRaw ? `${make} ${model} (${modelRaw})` : prompt;
  const ncap = await lookupEuroNcap(make, model);

  const [
    bodyType, co2Raw, consumptionRaw, electricRangeRaw,
    hpMinRaw, hpMaxRaw, zeroHundredRaw, bootSpaceRaw,
    towingRaw, seatsRaw, drivetrainRaw, reliabilityNotes, ncapAI,
    insuranceRaw, serviceRaw,
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
    askAI(apiKey,
      "Swedish insurance expert. Reply ONLY two integers like '700-1300' (monthly SEK, helförsäkring used car).",
      `Monthly insurance SEK for used ${prompt} in Sweden?`
    ),
    askAI(apiKey,
      "Swedish service expert. Reply ONLY an integer (annual service SEK, used car). Unknown: 5000.",
      `Annual service cost SEK for used ${prompt} in Sweden?`
    ),
  ]);

  const BODY_TYPES = ["SUV","Sedan","Kombi","Halvkombi","Coupé","Cab","Pickup","Minibuss","Småbil"];
  const DRIVETRAINS = ["AWD","FWD","RWD"];
  const ncapStars = ncap ? ncap.stars : (parseInt(ncapAI) || null);

  // Parsa försäkringsintervall t.ex. "700-1300"
  const insuranceParts = insuranceRaw.match(/(\d+)\s*[-–]\s*(\d+)/);
  const insuranceLow  = insuranceParts ? parseInt(insuranceParts[1]) : 700;
  const insuranceHigh = insuranceParts ? parseInt(insuranceParts[2]) : 1400;

  const modelData: Record<string, unknown> = {
    make, model,
    body_type:               BODY_TYPES.includes(bodyType) ? bodyType : null,
    fuel_consumption_l100km: parseFloat(consumptionRaw) || null,
    electric_range_km:       parseInt(electricRangeRaw) || null,
    co2_g_per_km:            parseInt(co2Raw) || null,
    euro_ncap_stars:         ncapStars,
    euro_ncap_year:          ncap?.year || null,
    ncap_source:             ncap ? "euroncap" : (ncapStars ? "ai_estimate" : null),
    drivetrain_default:      DRIVETRAINS.includes(drivetrainRaw) ? drivetrainRaw : null,
    typical_hp_min:          parseInt(hpMinRaw) || null,
    typical_hp_max:          parseInt(hpMaxRaw) || null,
    zero_to_hundred_sec:     parseFloat(zeroHundredRaw) || null,
    boot_space_liters:       parseInt(bootSpaceRaw) || null,
    max_towing_kg:           parseInt(towingRaw) || null,
    seats:                   parseInt(seatsRaw) || 5,
    reliability_notes:       (reliabilityNotes && reliabilityNotes !== "NONE") ? reliabilityNotes : null,
    estimated_monthly_insurance_low:  insuranceLow,
    estimated_monthly_insurance_high: insuranceHigh,
    estimated_annual_service_sek:     parseInt(serviceRaw) || 5000,
    enriched_at:             new Date().toISOString(),
  };

  await supabase.from("car_models").upsert(modelData as any, { onConflict: "make,model" });
  return modelData;
}

// ─────────────────────────────────────────────
// Bildanalys för färg – unik per bil
// ─────────────────────────────────────────────
async function detectColor(apiKey: string, imageUrl: string, make: string, model: string): Promise<string> {
  // Skicka URL:en direkt till Gemini – Gemini når Blockets CDN bättre än edge functions gör
  const imageContent = { type: "image_url", image_url: { url: imageUrl } };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "system",
        content: "Car color expert. First check if this is a valid car exterior photo. If the image shows an interior, engine bay, wheels only, a placeholder, is blank/empty, or does not clearly show a car exterior – reply exactly: DELETE. Otherwise identify the primary exterior color in Swedish. Use ONLY these values: Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld. Reply ONLY the color name or DELETE.",
      }, {
        role: "user",
        content: [
          { type: "text", text: `What color is this ${make} ${model}? Reply DELETE if not a valid exterior photo.` },
          imageContent,
        ],
      }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return "Okänd";
  const data = await res.json();
  const color = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (color === "DELETE") return "__DELETE__";
  return (color && color !== "UNKNOWN" && color.length < 30) ? color : "Okänd";
}

// ─────────────────────────────────────────────
// Bearbeta en chunk bilar
// ─────────────────────────────────────────────
async function processChunk(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  modelCache: Record<string, Record<string, unknown>>
): Promise<{ processed: number; modelsCached: number; colorUpdated: number; bodyTypeUpdated: number; drivetrainUpdated: number; horsepowerUpdated: number; errors: number; remaining: number }> {
  // Sentinel-konvention: drivetrain='Unknown' och horsepower=0 betyder
  // "har försökts berika men car_models saknade värdet" – fångas inte här.
  const FILTER = "color.eq.Unknown,color.is.null,color.eq.Okänd,body_type.is.null,body_type.eq.Unknown,body_type.eq.Personbil,body_type.eq.Transportbil,drivetrain.is.null,horsepower.is.null";
  const BLOCKET_GENERIC = ["Personbil", "Transportbil", "Unknown", "Okänd"];

  const { count: totalRemaining } = await supabase
    .from("Lovable")
    .select("id", { count: "exact", head: true })
    .or(FILTER);

  const { data: cars, error: fetchError } = await supabase
    .from("Lovable")
    .select("id, make, model, model_raw, color, body_type, image_thumb_url, drivetrain, horsepower, year, fuel_type")
    .or(FILTER)
    .limit(CHUNK_SIZE);

  if (fetchError) throw fetchError;
  if (!cars || cars.length === 0) return { processed: 0, modelsCached: 0, colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0, horsepowerUpdated: 0, errors: 0, remaining: 0 };

  // Ladda redan cachade modeller från DB
  const uniqueMakes  = [...new Set(cars.map((c) => c.make).filter(Boolean))];
  const uniqueModels = [...new Set(cars.map((c) => c.model).filter(Boolean))];
  const { data: cachedModels } = await supabase
    .from("car_models").select("*")
    .in("make", uniqueMakes).in("model", uniqueModels);
  for (const cm of cachedModels ?? []) modelCache[`${cm.make}|||${cm.model}`] = cm;

  const results = { processed: cars.length, modelsCached: 0, colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0, horsepowerUpdated: 0, errors: 0, remaining: 0 };

  // ── Steg 1: Berika unika modeller SEKVENTIELLT (undviker rate limit) ──
  // Varje enrichModel = ~13 parallella AI-anrop. Vi kör max MAX_NEW_MODELS nya modeller per anrop.
  // Bygg en map make|||model -> model_raw för att skicka med som kontext till AI
  const modelRawMap: Record<string, string | null> = {};
  for (const c of cars) {
    if (c.make && c.model) modelRawMap[`${c.make}|||${c.model}`] = c.model_raw ?? null;
  }

  const uniqueCombos: string[] = [...new Set<string>(
    cars
      .filter((c): c is typeof c & { make: string; model: string } => !!c.make && !!c.model && modelCache[`${c.make}|||${c.model}`] === undefined)
      .map((c) => `${c.make}|||${c.model}`)
  )];

  let newModelsThisRun = 0;
  for (const combo of uniqueCombos) {
    if (newModelsThisRun >= MAX_NEW_MODELS) break;
    const [make, model] = combo.split("|||");
    try {
      const carModel = await enrichModel(supabase, apiKey, make, model, null, modelRawMap[combo] ?? null);
      modelCache[combo] = carModel;
      results.modelsCached++;
      newModelsThisRun++;
      console.log(`Berikade modell: ${make} ${model} → ${carModel.body_type}`);
    } catch (e) {
      console.error(`enrichModel misslyckades för ${make} ${model}:`, e);
      modelCache[combo] = null; // markera som försökt
    }
  }

  // ── Steg 2: Uppdatera bilar (färg parallellt, övrigt från modell-cache) ──
  await Promise.all(cars.map(async (car) => {
    const cacheKey = `${car.make}|||${car.model}`;
    const carModel = modelCache[cacheKey]; // null = misslyckades, undefined = ej försökt än

    const updates: Record<string, unknown> = {};

    try {
      if (carModel) {
        if (!car.body_type || BLOCKET_GENERIC.includes(car.body_type)) {
          updates.body_type = carModel.body_type ?? "Okänd";
          results.bodyTypeUpdated++;
        }
        // Drivlina: skriv alltid (sentinel 'Unknown' om car_models saknar värde).
        if (car.drivetrain === null || car.drivetrain === undefined) {
          updates.drivetrain = (carModel.drivetrain_default as string | null) ?? "Unknown";
          results.drivetrainUpdated++;
        }
        // HP: skriv alltid (sentinel 0 om car_models saknar värde).
        if (car.horsepower === null || car.horsepower === undefined) {
          if (carModel.typical_hp_min) {
            const hp_min = carModel.typical_hp_min as number;
            const hp_max = (carModel.typical_hp_max as number) || hp_min;
            updates.horsepower = Math.round((hp_min + hp_max) / 2);
          } else {
            updates.horsepower = 0;
          }
          results.horsepowerUpdated++;
        }
      }

      if (!car.color || car.color === "Unknown") {
        const detectedColor = car.image_thumb_url
          ? await detectColor(apiKey, car.image_thumb_url, car.make ?? "", car.model ?? "")
          : "__DELETE__";

        if (detectedColor === "__DELETE__") {
          // Bilden är interiör, tom eller ogiltig – radera bilen
          await supabase.from("Lovable").delete().eq("id", car.id);
          console.log(`Raderade bil ${car.id} (${car.make} ${car.model}) – ogiltig bild`);
          results.errors++; // räknas som avvikelse, inte som lyckad berikelse
          return;
        }

        updates.color = detectedColor;
        results.colorUpdated++;
      }

      // Fallback: bilen MÅSTE lämna kön oavsett om AI lyckades eller inte.
      if (!updates.body_type && (!car.body_type || BLOCKET_GENERIC.includes(car.body_type))) {
        if (carModel !== undefined) {
          updates.body_type = "Okänd";
          results.bodyTypeUpdated++;
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("Lovable").update(updates).eq("id", car.id);
      }
    } catch (e) {
      console.error(`Fel för bil ${car.id}:`, e);
      results.errors++;
    }
  }));

  results.remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);
  return results;
}

// ─────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { password, ids } = body as { password?: string; ids?: number[] };

    // Auth – admin-lösenord eller intern sync-secret
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const syncSecret = Deno.env.get("SYNC_SECRET");
    const authHeader = req.headers.get("x-sync-secret");

    const isAdmin = adminPassword && password === adminPassword;
    const isInternal = syncSecret && authHeader === syncSecret;

    if (!isAdmin && !isInternal) {
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

    // Path 1: specifika IDs skickade (från sync-cars) – berika bara dessa
    if (ids && ids.length > 0) {
      const modelCache: Record<string, Record<string, unknown>> = {};
      const totals = { processed: 0, modelsCached: 0, colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0, horsepowerUpdated: 0, errors: 0 };

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { data: cars } = await supabase
          .from("Lovable")
          .select("id, make, model, model_raw, color, body_type, image_thumb_url, drivetrain, horsepower, year, fuel_type")
          .in("id", chunk);

        if (!cars || cars.length === 0) continue;

        const uniqueMakes  = [...new Set(cars.map((c) => c.make).filter(Boolean))];
        const uniqueModels = [...new Set(cars.map((c) => c.model).filter(Boolean))];
        const { data: cachedModels } = await supabase
          .from("car_models").select("*")
          .in("make", uniqueMakes).in("model", uniqueModels);
        for (const cm of cachedModels ?? []) modelCache[`${cm.make}|||${cm.model}`] = cm;

        // ── Steg 1: Berika modeller som saknas i cache ──
        for (let j = 0; j < cars.length; j += BATCH_SIZE) {
          const batch = cars.slice(j, j + BATCH_SIZE);
          await Promise.all(batch.map(async (car) => {
            try {
              const cacheKey = `${car.make}|||${car.model}`;
              let carModel = modelCache[cacheKey];
              if (!carModel && car.make && car.model) {
                carModel = await enrichModel(supabase as any, LOVABLE_API_KEY, car.make, car.model, car.fuel_type);
                modelCache[cacheKey] = carModel;
                totals.modelsCached++;
              }
            } catch (e) { console.error(`Modell-berikningsfel:`, e); }
          }));
        }

        // ── Steg 2: Uppdatera bilar parallellt (färg + metadata från cache) ──
        for (let j = 0; j < cars.length; j += BATCH_SIZE) {
          await Promise.all(cars.slice(j, j + BATCH_SIZE).map(async (car) => {
            const cacheKey = `${car.make}|||${car.model}`;
            const carModel = modelCache[cacheKey];
            const updates: Record<string, unknown> = {};
            try {
              if (carModel) {
                const BLOCKET_GENERIC = ["Personbil", "Transportbil", "Unknown", "Okänd"];
                if (!car.body_type || BLOCKET_GENERIC.includes(car.body_type)) { updates.body_type = carModel.body_type ?? "Okänd"; totals.bodyTypeUpdated++; }
                if ((!car.drivetrain || car.drivetrain === "Unknown") && carModel.drivetrain_default) { updates.drivetrain = carModel.drivetrain_default; totals.drivetrainUpdated++; }
                if ((!car.horsepower || car.horsepower === 0) && carModel.typical_hp_min) {
                  const hp_min = carModel.typical_hp_min as number;
                  updates.horsepower = Math.round((hp_min + ((carModel.typical_hp_max as number) || hp_min)) / 2);
                  totals.horsepowerUpdated++;
                }
              }
              if (!car.color || car.color === "Unknown") {
                const detectedColor = car.image_thumb_url
                  ? await detectColor(LOVABLE_API_KEY, car.image_thumb_url, car.make ?? "", car.model ?? "")
                  : "__DELETE__";
                if (detectedColor === "__DELETE__") {
                  await supabase.from("Lovable").delete().eq("id", car.id);
                  console.log(`Raderade bil ${car.id} (${car.make} ${car.model}) – ogiltig bild`);
                  totals.errors++;
                  return;
                }
                updates.color = detectedColor;
                totals.colorUpdated++;
              }
              if (!updates.body_type) {
                const BLOCKET_GENERIC = ["Personbil", "Transportbil", "Unknown"];
                if (car.body_type && BLOCKET_GENERIC.includes(car.body_type)) { updates.body_type = "Okänd"; totals.bodyTypeUpdated++; }
              }
              if (Object.keys(updates).length > 0) await supabase.from("Lovable").update(updates).eq("id", car.id);
              totals.processed++;
            } catch (e) { console.error(`Fel för bil ${car.id}:`, e); totals.errors++; }
          }));
        }
      }

      return new Response(JSON.stringify({ success: true, ...totals, message: `Berikade ${totals.processed} nya bilar (${totals.modelsCached} nya modeller cachade).` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Path 2: manuellt anrop (admin) – loopa processChunk tills klart eller MAX_ITERATIONS
    const modelCache: Record<string, Record<string, unknown>> = {};
    const totals = { processed: 0, modelsCached: 0, colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0, horsepowerUpdated: 0, errors: 0 };
    let iterations = 0;
    let remaining = Infinity;

    while (remaining > 0 && iterations < MAX_ITERATIONS) {
      const result = await processChunk(supabase, LOVABLE_API_KEY, modelCache);
      if (result.processed === 0) break;

      totals.processed      += result.processed;
      totals.modelsCached   += result.modelsCached;
      totals.colorUpdated   += result.colorUpdated;
      totals.bodyTypeUpdated+= result.bodyTypeUpdated;
      totals.drivetrainUpdated += result.drivetrainUpdated;
      totals.horsepowerUpdated += result.horsepowerUpdated;
      totals.errors         += result.errors;
      remaining = result.remaining;
      iterations++;

      console.log(`Iteration ${iterations}: processed=${result.processed}, remaining=${remaining}`);
    }

    const done = remaining === 0;
    return new Response(JSON.stringify({
      success: true,
      ...totals,
      remaining: done ? 0 : remaining,
      message: done
        ? `Klart! Berikade totalt ${totals.processed} bilar (${totals.modelsCached} nya modeller cachade).`
        : `Berikade ${totals.processed} bilar (${totals.modelsCached} modeller). ${remaining} bilar kvar – kör igen för att fortsätta.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("enrich-car-data error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

export { calcAnnualTax };
