import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 25;
const BATCH_SIZE = 10;

async function askAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// Enrich a model in car_models with AI – runs ONCE per make+model, cached forever
async function enrichCarModel(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  make: string,
  model: string
): Promise<Record<string, unknown>> {
  const prompt = `Make: ${make}\nModel: ${model}`;

  const [bodyType, consumption, electricRange, co2, ncap, tax, drivetrainDefault, typicalHpMin, typicalHpMax] =
    await Promise.all([
      askAI(apiKey,
        `Car expert. Reply with ONLY one of: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil, UNKNOWN`,
        `Body type of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY a decimal number (liters per 100km WLTP average). For EVs reply 0. If unknown reply 0.`,
        `Fuel consumption l/100km of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer (km range WLTP for electric/PHEV). For non-EVs reply 0. If unknown reply 0.`,
        `Electric range km of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer (CO2 g/km WLTP). If unknown reply 0.`,
        `CO2 g/km of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer 1-5 (Euro NCAP stars). If unknown reply 0.`,
        `Euro NCAP stars of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer (Swedish fordonsskatt SEK per year, approximate). If unknown reply 0.`,
        `Swedish annual vehicle tax SEK of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY one of: AWD, FWD, RWD, UNKNOWN (most common drivetrain for base model).`,
        `Default drivetrain of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer (minimum HP across all engine variants). If unknown reply 0.`,
        `Minimum horsepower of ${prompt}?`
      ),
      askAI(apiKey,
        `Car expert. Reply with ONLY an integer (maximum HP across all engine variants). If unknown reply 0.`,
        `Maximum horsepower of ${prompt}?`
      ),
    ]);

  const modelData = {
    make,
    model,
    body_type: ["SUV","Sedan","Kombi","Halvkombi","Coupé","Cab","Pickup","Minibuss","Småbil"].includes(bodyType) ? bodyType : null,
    fuel_consumption_l100km: parseFloat(consumption) || null,
    electric_range_km: parseInt(electricRange) || null,
    co2_g_per_km: parseInt(co2) || null,
    euro_ncap_stars: parseInt(ncap) || null,
    annual_tax_sek: parseInt(tax) || null,
    drivetrain_default: ["AWD","FWD","RWD"].includes(drivetrainDefault) ? drivetrainDefault : null,
    typical_hp_min: parseInt(typicalHpMin) || null,
    typical_hp_max: parseInt(typicalHpMax) || null,
    enriched_at: new Date().toISOString(),
  };

  await supabase.from("car_models").upsert(modelData, { onConflict: "make,model" });
  return modelData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Count total needing enrichment
    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .or("color.eq.Unknown,color.is.null,body_type.is.null,body_type.eq.Unknown");

    // Fetch chunk needing enrichment
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, model_raw, color, body_type, image_thumb_url, drivetrain, horsepower, year, fuel_type")
      .or("color.eq.Unknown,color.is.null,body_type.is.null,body_type.eq.Unknown")
      .limit(CHUNK_SIZE);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Alla bilar är redan berikade!", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-load car_models cache for all makes+models in this chunk
    const uniqueMakes = [...new Set(cars.map((c) => c.make).filter(Boolean))];
    const uniqueModelNames = [...new Set(cars.map((c) => c.model).filter(Boolean))];

    const { data: cachedModels } = await supabase
      .from("car_models")
      .select("*")
      .in("make", uniqueMakes)
      .in("model", uniqueModelNames);

    const modelCache: Record<string, Record<string, unknown>> = {};
    for (const cm of cachedModels ?? []) {
      modelCache[`${cm.make}|||${cm.model}`] = cm;
    }

    const uncachedCount = cars.filter((c) => c.make && c.model && !modelCache[`${c.make}|||${c.model}`]).length;
    console.log(`Processing ${cars.length} cars, ${Object.keys(modelCache).length} models cached, ~${uncachedCount} need AI`);

    const results = { colorUpdated: 0, bodyTypeUpdated: 0, drivetrainUpdated: 0, horsepowerUpdated: 0, modelsCached: 0, errors: 0 };

    for (let i = 0; i < cars.length; i += BATCH_SIZE) {
      const batch = cars.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (car) => {
        try {
          const cacheKey = `${car.make}|||${car.model}`;
          let carModel = modelCache[cacheKey];

          // Run AI for this model if not in cache
          if (!carModel && car.make && car.model) {
            carModel = await enrichCarModel(supabase, LOVABLE_API_KEY, car.make, car.model);
            modelCache[cacheKey] = carModel;
            results.modelsCached++;
          }

          const updates: Record<string, unknown> = {};

          // Apply model-level data from cache
          if (carModel) {
            if (!car.body_type || car.body_type === "Unknown") {
              updates.body_type = carModel.body_type ?? "Okänd";
              results.bodyTypeUpdated++;
            }
            if (!car.drivetrain || car.drivetrain === "Unknown") {
              if (carModel.drivetrain_default) {
                updates.drivetrain = carModel.drivetrain_default;
                results.drivetrainUpdated++;
              }
            }
            if (!car.horsepower || car.horsepower === 0) {
              if (carModel.typical_hp_min) {
                updates.horsepower = carModel.typical_hp_min;
                results.horsepowerUpdated++;
              }
            }
          }

          // Color via AI vision – unique per car, cannot cache on model level
          if (!car.color || car.color === "Unknown") {
            if (car.image_thumb_url) {
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [{
                    role: "system",
                    content: `Car color expert. Identify the car color in Swedish. Use only: Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld. Reply ONLY the color name. If unsure reply UNKNOWN.`,
                  }, {
                    role: "user",
                    content: [
                      { type: "text", text: `Color of this ${car.make} ${car.model}?` },
                      { type: "image_url", image_url: { url: car.image_thumb_url } },
                    ],
                  }],
                }),
              });
              if (res.ok) {
                const data = await res.json();
                const color = data.choices?.[0]?.message?.content?.trim();
                updates.color = (color && color !== "UNKNOWN" && color.length < 30) ? color : "Okänd";
                results.colorUpdated++;
              }
            } else {
              updates.color = "Okänd";
            }
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from("Lovable").update(updates).eq("id", car.id);
          }
        } catch (e) {
          console.error(`Error enriching car ${car.id}:`, e);
          results.errors++;
        }
      }));
    }

    const remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);

    return new Response(
      JSON.stringify({
        success: true,
        processed: cars.length,
        remaining,
        ...results,
        message: remaining > 0
          ? `Berikade ${cars.length} bilar (${results.modelsCached} nya modeller cachade). ${remaining} kvar.`
          : `Klart! Berikade ${cars.length} bilar.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("enrich-car-data error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
