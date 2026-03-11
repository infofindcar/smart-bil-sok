import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin password
    const { password } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch cars needing enrichment
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, model_raw, drivetrain, color, image_thumb_url")
      .or("drivetrain.eq.Unknown,drivetrain.is.null,color.eq.Unknown,color.is.null");

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No cars need enrichment", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${cars.length} cars needing enrichment`);

    const results = { drivetrainUpdated: 0, colorUpdated: 0, errors: 0 };

    // Process cars in batches of 5 to avoid rate limits
    for (let i = 0; i < cars.length; i += 5) {
      const batch = cars.slice(i, i + 5);
      
      await Promise.all(batch.map(async (car) => {
        const updates: Record<string, string> = {};

        // --- Drivetrain inference from model_raw ---
        if (!car.drivetrain || car.drivetrain === "Unknown") {
          if (car.model_raw) {
            try {
              const dtResponse = await fetch(
                "https://ai.gateway.lovable.dev/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash-lite",
                    messages: [
                      {
                        role: "system",
                        content: `You are a car expert. Given a car's make, model, and raw model name, determine the drivetrain.
Reply with ONLY one of: AWD, FWD, RWD, or UNKNOWN.

Rules:
- "Twin Motor", "quattro", "xDrive", "4MATIC", "T6 AWD", "T8", "e-tron quattro", "4WD", "4x4" → AWD
- "Single Motor", "FWD", "2WD", "sDrive", "D2", "D3", "D4 FWD" → FWD
- "RWD", "rear-wheel", "sDrive" (BMW 2/3/4 series) → RWD
- If you truly cannot determine → UNKNOWN

Reply with just the three-letter code, nothing else.`,
                      },
                      {
                        role: "user",
                        content: `Make: ${car.make || "unknown"}\nModel: ${car.model || "unknown"}\nModel raw: ${car.model_raw}`,
                      },
                    ],
                  }),
                }
              );

              if (dtResponse.ok) {
                const dtData = await dtResponse.json();
                const answer = dtData.choices?.[0]?.message?.content?.trim().toUpperCase();
                if (answer && ["AWD", "FWD", "RWD"].includes(answer)) {
                  updates.drivetrain = `"${answer}"`;
                  results.drivetrainUpdated++;
                }
              }
            } catch (e) {
              console.error(`Drivetrain error for car ${car.id}:`, e);
              results.errors++;
            }
          }
        }

        // --- Color detection from image ---
        if ((!car.color || car.color === "Unknown") && car.image_thumb_url) {
          try {
            const colorResponse = await fetch(
              "https://ai.gateway.lovable.dev/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    {
                      role: "system",
                      content: `You are a car color expert. Look at the car image and identify its color.
Reply with ONLY the color name in Swedish. Use standard color names:
Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld

Reply with just the color name, nothing else. If you truly cannot determine the color, reply UNKNOWN.`,
                    },
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `What color is this ${car.make || ""} ${car.model || ""} car?`,
                        },
                        {
                          type: "image_url",
                          image_url: { url: car.image_thumb_url },
                        },
                      ],
                    },
                  ],
                }),
              }
            );

            if (colorResponse.ok) {
              const colorData = await colorResponse.json();
              const colorAnswer = colorData.choices?.[0]?.message?.content?.trim();
              if (colorAnswer && colorAnswer !== "UNKNOWN" && colorAnswer.length < 30) {
                updates.color = `"${colorAnswer}"`;
                results.colorUpdated++;
              }
            }
          } catch (e) {
            console.error(`Color error for car ${car.id}:`, e);
            results.errors++;
          }
        }

        // Update database if we have changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("Lovable")
            .update(updates)
            .eq("id", car.id);

          if (updateError) {
            console.error(`Update error for car ${car.id}:`, updateError);
            results.errors++;
          } else {
            console.log(`Updated car ${car.id}: ${JSON.stringify(updates)}`);
          }
        }
      }));

      // Small delay between batches to respect rate limits
      if (i + 5 < cars.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enrichment complete. Drivetrain: ${results.drivetrainUpdated}, Color: ${results.colorUpdated}, Errors: ${results.errors}`,
        totalProcessed: cars.length,
        ...results,
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
