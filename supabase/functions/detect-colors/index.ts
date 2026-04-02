import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const DEFAULT_LIMIT = 100;

// Giltiga färgvärden (samma som i enrich-batch)
const VALID_COLORS = new Set([
  "Svart", "Vit", "Silver", "Grå", "Blå", "Röd", "Grön", "Brun", "Beige",
  "Orange", "Gul", "Lila", "Mörkblå", "Ljusblå", "Mörkgrå", "Ljusgrå",
  "Mörkgrön", "Vinröd", "Koppar", "Guld",
]);

type CarForColor = {
  id: number;
  make: string;
  model: string;
  image_thumb_url: string;
};

// ─────────────────────────────────────────────
// Gemini-anrop för en batch om max 10 bilar
// ─────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  batch: CarForColor[],
): Promise<Record<number, string>> {
  const results: Record<number, string> = {};

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
      console.warn(`Gemini-batch misslyckades (${res.status})`);
      batch.forEach((car) => { results[car.id] = "Okänd"; });
      return results;
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
  } catch (e) {
    console.warn(`Gemini-batch fel:`, e);
    batch.forEach((car) => { results[car.id] = "Okänd"; });
  }

  return results;
}

// ─────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const secret = req.headers.get("x-sync-secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");
    const INTERNAL_CRON_TOKEN = "cron_bvqveq_2026_internal";
    const isAuthorized = (expectedSecret && secret === expectedSecret) || secret === INTERNAL_CRON_TOKEN;
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const limit: number = typeof body.limit === "number" ? body.limit : DEFAULT_LIMIT;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Filter: bilar som markerats Okänd av enrich-from-blocket (ej color IS NULL som är obearbetade)
    const COLOR_FILTER = "color.eq.Okänd,color.eq.Unknown";

    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .or(COLOR_FILTER);

    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, make, model, image_thumb_url")
      .or(COLOR_FILTER)
      .not("image_thumb_url", "is", null)
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, deleted: 0, remaining: totalRemaining ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Dela i batchar om 10, kör ALLA parallellt med Promise.all
    const batches: CarForColor[][] = [];
    for (let i = 0; i < cars.length; i += 10) {
      batches.push(cars.slice(i, i + 10) as CarForColor[]);
    }

    const resultMaps = await Promise.all(
      batches.map((batch) => callGemini(LOVABLE_API_KEY, batch)),
    );
    const colorResults: Record<number, string> = Object.assign({}, ...resultMaps);

    // Spara färger och radera bilar med dåliga bilder – parallellt
    let processed = 0;
    let deleted = 0;

    await Promise.all(
      cars.map(async (car) => {
        const color = colorResults[car.id];
        if (!color) {
          await supabase.from("Lovable").update({ color: "Okänd" }).eq("id", car.id);
        } else if (color === "__DELETE__") {
          // Radera permanent – dålig bild (interiör/hjul/motor/tom)
          await supabase.from("Lovable").delete().eq("id", car.id);
          deleted++;
        } else {
          await supabase.from("Lovable").update({ color }).eq("id", car.id);
        }
        processed++;
      }),
    );

    const remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);
    console.log(
      `detect-colors: processed=${processed}, deleted=${deleted}, remaining=${remaining}`,
    );

    return new Response(
      JSON.stringify({ success: true, processed, deleted, remaining }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("detect-colors error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
