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

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en intelligent och objektiv svensk bilrådgivare. Du har ett naturligt samtal med kunden för att förstå exakt vilken bil som passar dem bäst.

DITT MÅL: Samla tillräckligt med information för att hitta den perfekta bilen. Du ska TÄNKA på vad kunden säger och ställa RELEVANTA följdfrågor.

INFORMATION DU BEHÖVER (ungefärlig prioritet):
1. Vad bilen ska användas till (pendling, familj, stad, etc.)
2. Budget
3. Var personen bor (för att hitta bilar i närheten)
4. Drivlina-preferens (el, hybrid, bensin, diesel)
5. Karosstyp (SUV, kombi, sedan, etc.)

INTELLIGENTA REGLER:
- Om kunden nämner lång pendling → du förstår att bränsleeffektivitet och komfort är viktigt
- Om kunden nämner familj → du förstår att utrymme och säkerhet är viktigt
- Om kunden nämner stad → du förstår att liten bil och el/hybrid passar
- Om kunden ger mycket info i ett meddelande → hoppa över frågor du redan har svar på
- Om kunden ger väldigt lite info → ställ den viktigaste frågan först
- Ställ MAX EN fråga per meddelande
- Var kort, varm och professionell i dina frågor
- Använd INTE emojis i dina svar

NÄR DU HAR TILLRÄCKLIGT: Du behöver minst 2-3 av de 5 punkterna ovan (speciellt budget + användningsområde eller plats). När du har tillräckligt, sök direkt — fråga inte i onödan.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Om du behöver mer info:
{"action":"ask","message":"Din fråga här"}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"city":"Stad","make":"Märke","useCase":"pendling"},"reasoning":"Kort förklaring av varför dessa filter valdes"}

Alla filter-fält är valfria — inkludera bara det du har information om.
Giltiga fuel-värden: el, laddhybrid, hybrid, bensin, diesel
Giltiga bodyType-värden: suv, kombi, sedan, halvkombi, coupe
Giltiga useCase-värden: pendling, familj, langresa, stad, blandat`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("Conversation messages:", JSON.stringify(messages));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
            { role: "system", content: CONVERSATION_SYSTEM_PROMPT },
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
      console.error("AI error status:", status);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim();
    console.log("AI raw response:", rawContent);

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
      console.error("Failed to parse AI decision:", cleaned);
      // Fallback: treat as a question
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
      console.log("AI asking:", decision.message);
      return new Response(
        JSON.stringify({
          action: "ask",
          message: decision.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI decided to search — run database query
    if (decision.action === "search") {
      const filters = decision.filters || {};
      const reasoning = decision.reasoning || "";
      console.log("AI searching with filters:", JSON.stringify(filters));

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Parse budget
      let minPrice = 0;
      let maxPrice = 99999999;
      if (filters.budget) {
        const parts = filters.budget.split("-").map(Number);
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

        // City filter (dropped at level 1+)
        if (filters.city && relaxLevel < 1) {
          query = query.ilike("city", `%${filters.city}%`);
        }

        // Make filter (dropped at level 2+)
        if (filters.make && relaxLevel < 2) {
          query = query.ilike("make", `%${filters.make}%`);
        }

        // Fuel filter (dropped at level 2+)
        if (filters.fuel?.length > 0 && relaxLevel < 2) {
          const fuelFilters = filters.fuel
            .map((f: string) => fuelPatterns[f])
            .filter(Boolean)
            .map((p: string) => `fuel_type.ilike.${p}`)
            .join(",");
          if (fuelFilters) {
            query = query.or(fuelFilters);
          }
        }

        // Body type filter (dropped at level 1+)
        if (filters.bodyType?.length > 0 && relaxLevel < 1) {
          const bodyFilters = filters.bodyType
            .map((b: string) => bodyPatterns[b])
            .filter(Boolean)
            .map((p: string) => `body_type.ilike.${p}`)
            .join(",");
          if (bodyFilters) {
            query = query.or(bodyFilters);
          }
        }

        const { data, error } = await query
          .order("price", { ascending: true })
          .limit(3);

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

      // Generate personalized result message
      let message = "";

      if (cars.length > 0) {
        try {
          const makes = [...new Set(cars.map((c: any) => c.make).filter(Boolean))];
          const priceRange = `${cars[0].price?.toLocaleString("sv-SE")} – ${cars[cars.length - 1].price?.toLocaleString("sv-SE")} kr`;
          const cities = [...new Set(cars.map((c: any) => c.city).filter(Boolean))];
          const carSummaries = cars
            .map(
              (c: any) =>
                `${c.make} ${c.model} ${c.year}, ${c.price?.toLocaleString("sv-SE")} kr, ${c.fuel_type}, ${c.body_type}, ${c.mileage?.toLocaleString("sv-SE")} mil, ${c.city}`
            )
            .join("; ");

          // Build context from conversation
          const userMessages = messages
            .filter((m: any) => m.role === "user")
            .map((m: any) => m.content)
            .join(". ");

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
                    content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare. Ge en personlig, kort sammanfattning (max 3 meningar) av varför dessa bilar passar kundens situation.

Var specifik: nämn varför biltypen/drivlinan passar deras livsstil. Använd INTE emojis.

${reasoning ? `Din resonering: ${reasoning}` : ""}

Var varm, professionell och objektiv — rekommendera det som faktiskt är bäst för kunden.`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}". Sökresultat: ${cars.length} bilar. Prisintervall: ${priceRange}. Märken: ${makes.join(", ")}. Städer: ${cities.join(", ")}. Bilar: ${carSummaries}. ${relaxLevel > 0 ? "Sökningen breddades för att hitta resultat." : ""}`,
                  },
                ],
              }),
            }
          );

          if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            const content = msgData.choices?.[0]?.message?.content;
            if (content) message = content;
          }
        } catch (e) {
          console.error("AI message error:", e);
        }
      }

      if (!message) {
        message =
          cars.length > 0
            ? `Jag hittade ${cars.length} bilar som matchar dina önskemål!`
            : "Tyvärr hittade jag inga bilar som matchar just nu. Kan du beskriva vad du söker på ett annat sätt?";
      }

      return new Response(
        JSON.stringify({
          action: "search",
          message,
          cars,
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
    console.error("guided-search error:", e);
    return new Response(
      JSON.stringify({
        action: "error",
        error: e instanceof Error ? e.message : "Unknown error",
        cars: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
