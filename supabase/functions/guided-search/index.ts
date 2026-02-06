import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    console.log("Search context:", JSON.stringify(context));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse budget range
    let minPrice = 0;
    let maxPrice = 99999999;
    if (context.budget) {
      const parts = context.budget.split("-").map(Number);
      if (parts.length === 2) {
        minPrice = parts[0];
        maxPrice = parts[1];
      }
    }

    // Progressive relaxation search
    let cars: any[] = [];
    let relaxLevel = 0;

    for (relaxLevel = 0; relaxLevel <= 3; relaxLevel++) {
      let query = supabase.from("cars").select("*");

      // Price filter (widened at higher relax levels)
      const priceMult = [1, 1.3, 1.6, 10][relaxLevel];
      const priceMinMult = [1, 0.7, 0.5, 0][relaxLevel];
      query = query
        .gte("price", Math.floor(minPrice * priceMinMult))
        .lte("price", Math.ceil(maxPrice * priceMult));

      // Fuel filter (dropped at level 2+)
      if (context.fuel?.length > 0 && relaxLevel < 2) {
        const fuelFilters = context.fuel
          .map((f: string) => fuelPatterns[f])
          .filter(Boolean)
          .map((p: string) => `fuel_type.ilike.${p}`)
          .join(",");
        if (fuelFilters) {
          query = query.or(fuelFilters);
        }
      }

      // Body type filter (dropped at level 1+)
      if (context.bodyType?.length > 0 && relaxLevel < 1) {
        const bodyFilters = context.bodyType
          .map((b: string) => bodyPatterns[b])
          .filter(Boolean)
          .map((p: string) => `body_type.ilike.${p}`)
          .join(",");
        if (bodyFilters) {
          query = query.or(bodyFilters);
        }
      }

      const { data, error } = await query.order("price", { ascending: true }).limit(6);

      if (error) {
        console.error(`Query error at relax level ${relaxLevel}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        cars = data;
        console.log(`Found ${data.length} cars at relax level ${relaxLevel}`);
        break;
      }

      console.log(`No results at relax level ${relaxLevel}, relaxing...`);
    }

    // Generate AI message
    let message = "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (cars.length > 0 && LOVABLE_API_KEY) {
      try {
        const makes = [...new Set(cars.map((c: any) => c.make).filter(Boolean))];
        const priceRange = `${cars[0].price?.toLocaleString("sv-SE")} – ${cars[cars.length - 1].price?.toLocaleString("sv-SE")} kr`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content:
                  "Du är Clutch, en vänlig svensk bilrådgivare. Ge en kort, positiv sammanfattning (max 2 meningar) av sökresultaten på svenska. Var personlig och entusiastisk.",
              },
              {
                role: "user",
                content: `Sökning: användning=${context.useCase || "ej angett"}, budget=${context.budget || "ej angett"}, drivlina=${context.fuel?.join(", ") || "ej angett"}, kaross=${context.bodyType?.join(", ") || "ej angett"}. Hittade ${cars.length} bilar. Prisintervall: ${priceRange}. Märken: ${makes.join(", ")}. ${relaxLevel > 0 ? "Sökningen breddades." : ""}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) message = content;
        } else {
          const status = aiResponse.status;
          console.error("AI response error:", status);
          if (status === 429) {
            console.error("AI rate limit exceeded");
          } else if (status === 402) {
            console.error("AI payment required");
          }
        }
      } catch (e) {
        console.error("AI message error:", e);
      }
    }

    if (!message) {
      message =
        cars.length > 0
          ? `Jag hittade ${cars.length} bilar som matchar dina önskemål!`
          : "Tyvärr hittade jag inga bilar som matchar just nu. Prova att bredda din sökning.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        cars,
        matchCount: cars.length,
        relaxed: relaxLevel > 0,
        relaxLevel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("guided-search error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        cars: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
