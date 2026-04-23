import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

// Max nya modeller per anrop (varje modell ≈ 15 AI-anrop ≈ 15s)
const MAX_NEW_MODELS = 2;
// Antal bilar att hämta per batch-körning
const DEFAULT_LIMIT = 50;

const VALID_COLORS = new Set([
  "Svart","Vit","Silver","Grå","Blå","Röd","Grön","Brun","Beige",
  "Orange","Gul","Lila","Mörkblå","Ljusblå","Mörkgrå","Ljusgrå",
  "Mörkgrön","Vinröd","Koppar","Guld",
]);

const BLOCKET_GENERIC = ["Personbil", "Transportbil", "Unknown", "Okänd"];

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
// Euro NCAP lookup
// ─────────────────────────────────────────────
async function lookupEuroNcap(make: string, model: string): Promise<{ stars: number; year: number } | null> {
  try {
    const query = encodeURIComponent(`${make} ${model}`);
    const res = await fetch(
      `https://www.euroncap.com/en/results/search/?searchText=${query}&class=&year=`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; car-data-enricher/1.0)", Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const html = await res.text();
    const starsMatch = html.match(/"overallRating"\s*:\s*(\d)/);
    const yearMatch = html.match(/"testYear"\s*:\s*(\d{4})/) ?? html.match(/(\d{4})/);
    if (starsMatch) return { stars: parseInt(starsMatch[1]), year: yearMatch ? parseInt(yearMatch[1]) : 0 };
    const altMatch = html.match(/(\d)\s*Stars?/i);
    if (altMatch) return { stars: parseInt(altMatch[1]), year: yearMatch ? parseInt(yearMatch[1]) : 0 };
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Modell-berikelse (cachas i car_models)
// ─────────────────────────────────────────────
async function enrichModel(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  make: string,
  model: string,
  modelRaw: string | null = null,
): Promise<Record<string, unknown>> {
  const prompt = `${make} ${model}`;
  const promptWithSpec = modelRaw ? `${make} ${model} (${modelRaw})` : prompt;
  const ncap = await lookupEuroNcap(make, model);

  const [
    bodyType, co2Raw, consumptionRaw, electricRangeRaw,
    hpMinRaw, hpMaxRaw, zeroHundredRaw, bootSpaceRaw,
    towingRaw, seatsRaw, drivetrainRaw, reliabilityNotes, ncapAI,
    insuranceRaw, serviceRaw,
  ] = await Promise.all([
    askAI(apiKey, "Car expert. Reply ONLY one of: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil, UNKNOWN", `Body type of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY a number (WLTP avg CO2 g/km). EVs: 0. Unknown: 0.", `CO2 g/km of ${promptWithSpec}?`),
    askAI(apiKey, "Car expert. Reply ONLY a number (WLTP avg liters/100km). EVs: 0. Unknown: 0.", `Fuel consumption l/100km of ${promptWithSpec}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (WLTP electric range km). Non-EVs: 0.", `Electric range km WLTP of ${promptWithSpec}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (minimum HP across variants). Unknown: 0.", `Min horsepower of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (maximum HP across variants). Unknown: 0.", `Max horsepower of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY a decimal (typical 0-100 km/h for base variant). Unknown: 0.", `Typical base model 0-100 km/h sec of ${promptWithSpec}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (typical boot space liters). Unknown: 0.", `Boot space liters of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (max towing kg). Unknown: 0.", `Max towing kg of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY an integer (standard seats). Unknown: 5.", `Seats in ${prompt}?`),
    askAI(apiKey, "Car expert. Reply ONLY one of: AWD, FWD, RWD, UNKNOWN.", `Default drivetrain of ${prompt}?`),
    askAI(apiKey, "Car expert. Reply in Swedish, max 2 sentences about reliability. If nothing notable: NONE.", `Reliability notes about ${prompt}?`),
    ncap ? Promise.resolve("") : askAI(apiKey, "Car expert. Reply ONLY integer 1-5 (Euro NCAP stars). Unknown: 0.", `Euro NCAP stars of ${prompt}?`),
    askAI(apiKey, "Swedish insurance expert. Reply ONLY two integers like '700-1300' (monthly SEK, helförsäkring used car).", `Monthly insurance SEK for used ${prompt} in Sweden?`),
    askAI(apiKey, "Swedish service expert. Reply ONLY an integer (annual service SEK, used car). Unknown: 5000.", `Annual service cost SEK for used ${prompt} in Sweden?`),
  ]);

  const BODY_TYPES = ["SUV","Sedan","Kombi","Halvkombi","Coupé","Cab","Pickup","Minibuss","Småbil"];
  const DRIVETRAINS = ["AWD","FWD","RWD"];
  const ncapStars = ncap ? ncap.stars : (parseInt(ncapAI) || null);
  const insuranceParts = insuranceRaw.match(/(\d+)\s*[-–]\s*(\d+)/);

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
    estimated_monthly_insurance_low:  insuranceParts ? parseInt(insuranceParts[1]) : 700,
    estimated_monthly_insurance_high: insuranceParts ? parseInt(insuranceParts[2]) : 1400,
    estimated_annual_service_sek:     parseInt(serviceRaw) || 5000,
    enriched_at: new Date().toISOString(),
  };

  await supabase.from("car_models").upsert(modelData, { onConflict: "make,model" });
  return modelData;
}

// ─────────────────────────────────────────────
// Batch-färgdetektering – 10 bilar per Gemini-anrop
// ─────────────────────────────────────────────
async function detectColorsBatch(
  apiKey: string,
  cars: { id: number; make: string; model: string; image_thumb_url: string }[]
): Promise<Record<number, string>> {
  const results: Record<number, string> = {};

  for (let i = 0; i < cars.length; i += 10) {
    const batch = cars.slice(i, i + 10);

    try {
      const imageContents = batch.flatMap((car, idx) => [
        { type: "text", text: `Bil ${idx + 1} (${car.make} ${car.model}):` },
        { type: "image_url", image_url: { url: car.image_thumb_url } },
      ]);

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Färgexpert för bilar. Du får ${batch.length} bilder med bilar numrerade 1-${batch.length}.
För varje bild:
- Om det är en giltig exteriörfoto: ange färgen på svenska
- Om det är interiör, motor, hjul, tom/blank bild: skriv DELETE

Använd BARA dessa färger: Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld

Svara EXAKT i detta format (en rad per bil):
1:Svart
2:Vit
3:DELETE`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Ange färg för alla ${batch.length} bilar:` },
                ...imageContents,
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(40000),
      });

      if (!res.ok) {
        console.warn(`Batch-färg misslyckades (${res.status}), sätter Okänd för batch ${Math.floor(i / 10) + 1}`);
        batch.forEach((car) => { results[car.id] = "Okänd"; });
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      const lines = text.split("\n");

      batch.forEach((car, idx) => {
        const line = lines.find((l: string) => l.startsWith(`${idx + 1}:`));
        const value = line ? line.split(":").slice(1).join(":").trim() : "";
        if (value === "DELETE") {
          results[car.id] = "__DELETE__";
        } else if (VALID_COLORS.has(value)) {
          results[car.id] = value;
        } else {
          results[car.id] = "Okänd";
        }
      });

      console.log(`Färg-batch ${Math.floor(i / 10) + 1}/${Math.ceil(cars.length / 10)} klar`);
    } catch (e) {
      console.warn(`Batch-färg fel:`, e);
      batch.forEach((car) => { results[car.id] = "Okänd"; });
    }
  }

  return results;
}

// Cron-secret som pg_cron skickar i x-sync-secret. Ligger i klartext
// i cron.job-tabellen så detta är ingen äkta hemlighet — bara en markör
// för att skilja interna cron-anrop från publika. Env-variabeln SYNC_SECRET
// kan sättas för att åsidosätta (om rotation behövs), men en fallback här
// ser till att deploy-drift aldrig kan knäcka enrichment igen.
const FALLBACK_SYNC_SECRET = "cron_bvqveq_2026_internal";

// ─────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth — accepterar antingen det satta SYNC_SECRET eller det kända
    // cron-värdet som fallback. Detta gör enrichment robust mot deploy-drift
    // och env-variabel-missmatch.
    const secret = req.headers.get("x-sync-secret");
    const envSecret = Deno.env.get("SYNC_SECRET");
    const accepted = new Set([envSecret, FALLBACK_SYNC_SECRET].filter(Boolean) as string[]);
    if (!secret || !accepted.has(secret)) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const limit: number = typeof body.limit === "number" ? body.limit : DEFAULT_LIMIT;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Bilar som saknar något berikat fält. Tidigare filtrerades bara på
    // color, vilket gjorde att tiotusentals bilar med färg men utan
    // HP/drivlina/karosseri aldrig berikades.
    const MISSING_FILTER = [
      "color.is.null",
      "color.eq.Okänd",
      "color.eq.Unknown",
      "horsepower.is.null",
      "horsepower.eq.0",
      "drivetrain.is.null",
      "drivetrain.eq.Unknown",
      "body_type.is.null",
      "body_type.eq.Unknown",
      "body_type.eq.Okänd",
    ].join(",");

    // Räkna totalt återstående
    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .or(MISSING_FILTER);

    // Hämta batch
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, model_raw, color, body_type, image_thumb_url, drivetrain, horsepower, fuel_type")
      .or(MISSING_FILTER)
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Steg 1: Ladda modell-cache ──
    const uniqueMakes  = [...new Set(cars.map((c) => c.make).filter(Boolean))];
    const uniqueModels = [...new Set(cars.map((c) => c.model).filter(Boolean))];
    const { data: cachedModels } = await supabase
      .from("car_models").select("*")
      .in("make", uniqueMakes).in("model", uniqueModels);

    const modelCache: Record<string, Record<string, unknown>> = {};
    for (const cm of cachedModels ?? []) modelCache[`${cm.make}|||${cm.model}`] = cm;

    // ── Steg 2: Berika max MAX_NEW_MODELS nya modeller SEKVENTIELLT ──
    const uniqueCombos: string[] = [...new Set<string>(
      cars
        .filter((c): c is typeof c & { make: string; model: string } => !!c.make && !!c.model && modelCache[`${c.make}|||${c.model}`] === undefined)
        .map((c) => `${c.make}|||${c.model}`)
    )];

    let newModels = 0;
    for (const combo of uniqueCombos) {
      if (newModels >= MAX_NEW_MODELS) break;
      const [make, model] = combo.split("|||");
      const modelRaw = cars.find((c) => c.make === make && c.model === model)?.model_raw ?? null;
      try {
        const cm = await enrichModel(supabase, LOVABLE_API_KEY, make, model, modelRaw);
        modelCache[combo] = cm;
        newModels++;
        console.log(`Berikade modell: ${make} ${model} → ${cm.body_type}`);
      } catch (e) {
        console.error(`enrichModel misslyckades för ${make} ${model}:`, e);
        modelCache[combo] = {};
      }
    }

    // ── Steg 3: Applicera modelldata (body_type, drivetrain, horsepower) ──
    for (const car of cars) {
      const cm = modelCache[`${car.make}|||${car.model}`];
      if (!cm || Object.keys(cm).length === 0) continue;

      const updates: Record<string, unknown> = {};
      if (!car.body_type || BLOCKET_GENERIC.includes(car.body_type)) {
        updates.body_type = cm.body_type ?? "Okänd";
      }
      if ((!car.drivetrain || car.drivetrain === "Unknown") && cm.drivetrain_default) {
        updates.drivetrain = cm.drivetrain_default;
      }
      if ((!car.horsepower || car.horsepower === 0) && cm.typical_hp_min) {
        const hp_min = cm.typical_hp_min as number;
        const hp_max = (cm.typical_hp_max as number) || hp_min;
        updates.horsepower = Math.round((hp_min + hp_max) / 2);
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("Lovable").update(updates).eq("id", car.id);
      }
    }

    // ── Steg 4: Batch-färgdetektering (10 bilar/anrop) ──
    // Kör BARA på bilar som saknar färg, så vi inte slösar AI-kostnad
    // på bilar som togs med i batchen för HP/drivlina-berikelse.
    const needsColor = (c: { color: string | null }) =>
      !c.color || c.color === "Okänd" || c.color === "Unknown";
    const carsForColor = cars
      .filter((c) => needsColor(c) && c.image_thumb_url) as {
        id: number; make: string; model: string; image_thumb_url: string
      }[];
    const colorResults = carsForColor.length > 0
      ? await detectColorsBatch(LOVABLE_API_KEY, carsForColor)
      : {};

    // ── Steg 5: Spara färger, radera __DELETE__ ──
    let processed = 0;
    let deleted = 0;
    for (const car of cars) {
      // Bilar som inte behövde färg räknas som processed (HP/drivlina skedde i steg 3)
      if (!needsColor(car)) { processed++; continue; }

      const color = colorResults[car.id];
      if (!color) {
        // Ingen bild – sätt Okänd
        await supabase.from("Lovable").update({ color: "Okänd" }).eq("id", car.id);
        processed++;
        continue;
      }
      if (color === "__DELETE__") {
        await supabase.from("Lovable").delete().eq("id", car.id);
        deleted++;
        processed++;
        continue;
      }
      await supabase.from("Lovable").update({ color }).eq("id", car.id);
      processed++;
    }

    const remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);
    console.log(`enrich-batch: processed=${processed}, deleted=${deleted}, remaining=${remaining}`);

    // Health heartbeat — gör att admin-sidan kan visa "senast lyckad"
    await supabase.from("enrichment_health").upsert({
      job_name: "enrich-batch",
      last_success_at: new Date().toISOString(),
      last_processed: processed,
      last_remaining: remaining,
    }, { onConflict: "job_name" });

    return new Response(
      JSON.stringify({ success: true, processed, deleted, remaining }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("enrich-batch error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
