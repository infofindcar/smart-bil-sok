import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 25;
const BATCH_SIZE = 10;

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

    // Count total needing enrichment (missing drivetrain, color, OR body_type)
    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .or("drivetrain.eq.Unknown,drivetrain.is.null,color.eq.Unknown,color.is.null,body_type.eq.Unknown,body_type.is.null");

    // Fetch chunk
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, model_raw, drivetrain, color, body_type, image_thumb_url")
      .or("drivetrain.eq.Unknown,drivetrain.is.null,color.eq.Unknown,color.is.null,body_type.eq.Unknown,body_type.is.null")
      .limit(CHUNK_SIZE);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Alla bilar är redan berikade!", updated: 0, remaining: 0, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${cars.length} cars (${totalRemaining} total remaining)`);

    const results = { drivetrainUpdated: 0, colorUpdated: 0, bodyTypeUpdated: 0, errors: 0 };

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < cars.length; i += BATCH_SIZE) {
      const batch = cars.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (car) => {
        const updates: Record<string, string> = {};

        // Drivetrain inference
        if (!car.drivetrain || car.drivetrain === "Unknown") {
          if (car.model_raw) {
            try {
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: `You are a car expert. Given a car's make, model, and raw model name, determine the drivetrain.\nReply with ONLY one of: AWD, FWD, RWD, or UNKNOWN.\n\nRules:\n- "Twin Motor", "quattro", "xDrive", "4MATIC", "T6 AWD", "T8", "e-tron quattro", "4WD", "4x4" → AWD\n- "Single Motor", "FWD", "2WD", "sDrive", "D2", "D3", "D4 FWD" → FWD\n- "RWD", "rear-wheel", "sDrive" (BMW 2/3/4 series) → RWD\n- If you truly cannot determine → UNKNOWN\n\nReply with just the three-letter code, nothing else.` },
                    { role: "user", content: `Make: ${car.make || "unknown"}\nModel: ${car.model || "unknown"}\nModel raw: ${car.model_raw}` },
                  ],
                }),
              });
              if (res.ok) {
                const data = await res.json();
                const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
                if (answer && ["AWD", "FWD", "RWD"].includes(answer)) {
                  updates.drivetrain = answer;
                  results.drivetrainUpdated++;
                } else {
                  updates.drivetrain = "Okänd";
                }
              }
            } catch (e) {
              console.error(`Drivetrain error for car ${car.id}:`, e);
              updates.drivetrain = "Okänd";
              results.errors++;
            }
          } else {
            updates.drivetrain = "Okänd";
          }
        }

        // Color detection
        if ((!car.color || car.color === "Unknown") && car.image_thumb_url) {
          try {
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: `You are a car color expert. Look at the car image and identify its color.\nReply with ONLY the color name in Swedish. Use standard color names:\nSvart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld\n\nReply with just the color name, nothing else. If you truly cannot determine the color, reply UNKNOWN.` },
                  { role: "user", content: [
                    { type: "text", text: `What color is this ${car.make || ""} ${car.model || ""} car?` },
                    { type: "image_url", image_url: { url: car.image_thumb_url } },
                  ]},
                ],
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const colorAnswer = data.choices?.[0]?.message?.content?.trim();
              if (colorAnswer && colorAnswer !== "UNKNOWN" && colorAnswer.length < 30) {
                updates.color = colorAnswer;
                results.colorUpdated++;
              } else {
                updates.color = "Okänd";
              }
            }
          } catch (e) {
            console.error(`Color error for car ${car.id}:`, e);
            updates.color = "Okänd";
            results.errors++;
          }
        } else {
          // No image available, mark as Okänd to prevent re-processing
          updates.color = "Okänd";
        }

        // Body type inference
        if (!car.body_type || car.body_type === "Unknown") {
          if (car.make || car.model_raw) {
            try {
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: `You are a car expert. Given a car's make, model, and raw model name, determine the body type.\nReply with ONLY one of: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil, or UNKNOWN.\n\nRules:\n- SUV: XC60, XC90, Q5, Q7, X3, X5, GLC, GLE, Tucson, Tiguan, RAV4, CR-V, Kona, etc.\n- Sedan: S60, A4 Sedan, 3-serie Sedan, C-Klass Sedan, Camry, Accord, etc.\n- Kombi: V60, V90, A4 Avant, 3-serie Touring, C-Klass Kombi, Passat Variant, etc.\n- Halvkombi: Golf, Focus, i30, Civic HB, V40, etc.\n- Coupé: TT, 4-serie Coupé, C-Klass Coupé, RC, 86, etc.\n- Cab/Cabriolet: convertible models\n- Pickup: Hilux, Ranger, Amarok, L200, etc.\n- Minibuss: Multivan, Sharan, Galaxy, etc.\n- Småbil: i10, i20, Yaris, Polo, Up, Aygo, etc.\n- If you truly cannot determine → UNKNOWN\n\nReply with just the body type, nothing else.` },
                    { role: "user", content: `Make: ${car.make || "unknown"}\nModel: ${car.model || "unknown"}\nModel raw: ${car.model_raw || "unknown"}` },
                  ],
                }),
              });
              if (res.ok) {
                const data = await res.json();
                const answer = data.choices?.[0]?.message?.content?.trim();
                if (answer && answer !== "UNKNOWN" && answer.length < 20) {
                  updates.body_type = `"${answer}"`;
                  results.bodyTypeUpdated++;
                }
              }
            } catch (e) {
              console.error(`Body type error for car ${car.id}:`, e);
              results.errors++;
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase.from("Lovable").update(updates).eq("id", car.id);
          if (updateError) {
            console.error(`Update error for car ${car.id}:`, updateError);
            results.errors++;
          }
        }
      }));
    }

    const remaining = Math.max(0, (totalRemaining || 0) - cars.length);

    return new Response(
      JSON.stringify({
        success: true,
        processed: cars.length,
        remaining,
        ...results,
        message: remaining > 0
          ? `Berikade ${cars.length} bilar. ${remaining} kvar.`
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
