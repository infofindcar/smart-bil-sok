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

const PARSE_SYSTEM_PROMPT = `Du är Clutch, en expert-bilrådgivare. Analysera användarens meddelande och dra slutsatser om vilken typ av bil som passar bäst.

RESONERA så här:
- Om personen pendlar långt → prioritera bränsleeffektivitet och komfort (diesel, hybrid, eller el med bra räckvidd)
- Om personen bor i en specifik stad/region → filtrera på bilar i närliggande städer (inte hela Sverige)
- Om personen har familj → prioritera utrymme och säkerhet (kombi, SUV)
- Om personen kör mest i stad → mindre bil, el eller hybrid är bra
- Om budget är tight → fokusera på driftsekonomi, inte bara inköpspris

Svara ENBART med ett JSON-objekt (ingen markdown, inga code fences).

Fält:
- useCase: en av "pendling", "familj", "langresa", "stad", "blandat" (eller utelämna)
- budget: format "MIN-MAX" t.ex. "0-300000" (eller utelämna)
- fuel: array av "el", "laddhybrid", "hybrid", "bensin", "diesel" — välj det som PASSAR BÄST för situationen (eller utelämna)
- bodyType: array av "suv", "kombi", "sedan", "halvkombi", "coupe" — välj det som PASSAR BÄST (eller utelämna)
- make: bilmärke om nämnt eller om du starkt rekommenderar ett (eller utelämna)
- city: stad eller region att filtrera på, t.ex. "Jönköping", "Växjö" — baserat på var personen bor (eller utelämna)
- reasoning: en kort mening (max 30 ord) som förklarar VARFÖR du valt dessa filter

Exempel:
Input: "Bor i Småland, pendlar 8 mil per dag, budget 250k"
Svar: {"useCase":"pendling","budget":"0-250000","fuel":["diesel","laddhybrid"],"bodyType":["kombi","sedan"],"city":"Jönköping","reasoning":"Lång pendling kräver bränsleeffektiv och bekväm bil. Söker i Småland-området."}

Input: "Familj med 3 barn, bor i Göteborg, max 400k"
Svar: {"useCase":"familj","budget":"0-400000","bodyType":["suv","kombi"],"city":"Göteborg","reasoning":"Stor familj behöver rymlig bil med bra säkerhet. Söker nära Göteborg."}`;

async function parseFreeText(
  freeText: string,
  apiKey: string
): Promise<{
  useCase?: string;
  budget?: string;
  fuel?: string[];
  bodyType?: string[];
  make?: string;
  city?: string;
  reasoning?: string;
}> {
  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: PARSE_SYSTEM_PROMPT },
            { role: "user", content: freeText },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("AI parse error status:", response.status);
      return {};
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return {};

    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Free text parse error:", e);
    return {};
  }
}

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // If there's free text, parse it with AI first
    let searchContext = { ...context };
    let aiReasoning = "";

    if (context.freeText && LOVABLE_API_KEY) {
      const parsed = await parseFreeText(context.freeText, LOVABLE_API_KEY);
      console.log("Parsed free text:", JSON.stringify(parsed));
      aiReasoning = parsed.reasoning || "";

      // Merge parsed fields (don't override existing ones from guided steps)
      const { reasoning: _r, ...parsedFilters } = parsed;
      searchContext = {
        ...parsedFilters,
        ...Object.fromEntries(
          Object.entries(context).filter(
            ([k, v]) => k !== "freeText" && v !== undefined
          )
        ),
      };
    }

    // Parse budget range
    let minPrice = 0;
    let maxPrice = 99999999;
    if (searchContext.budget) {
      const parts = searchContext.budget.split("-").map(Number);
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

      // City/region filter (dropped at level 1+)
      if (searchContext.city && relaxLevel < 1) {
        query = query.ilike("city", `%${searchContext.city}%`);
      }

      // Make filter (dropped at level 2+)
      if (searchContext.make && relaxLevel < 2) {
        query = query.ilike("make", `%${searchContext.make}%`);
      }

      // Fuel filter (dropped at level 2+)
      if (searchContext.fuel?.length > 0 && relaxLevel < 2) {
        const fuelFilters = searchContext.fuel
          .map((f: string) => fuelPatterns[f])
          .filter(Boolean)
          .map((p: string) => `fuel_type.ilike.${p}`)
          .join(",");
        if (fuelFilters) {
          query = query.or(fuelFilters);
        }
      }

      // Body type filter (dropped at level 1+)
      if (searchContext.bodyType?.length > 0 && relaxLevel < 1) {
        const bodyFilters = searchContext.bodyType
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
        .limit(6);

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

    // Generate AI message with context-aware reasoning
    let message = "";

    if (cars.length > 0 && LOVABLE_API_KEY) {
      try {
        const makes = [
          ...new Set(cars.map((c: any) => c.make).filter(Boolean)),
        ];
        const priceRange = `${cars[0].price?.toLocaleString("sv-SE")} – ${cars[cars.length - 1].price?.toLocaleString("sv-SE")} kr`;
        const cities = [
          ...new Set(cars.map((c: any) => c.city).filter(Boolean)),
        ];

        const carSummaries = cars
          .slice(0, 4)
          .map(
            (c: any) =>
              `${c.make} ${c.model} ${c.year}, ${c.price?.toLocaleString("sv-SE")} kr, ${c.fuel_type}, ${c.body_type}, ${c.mileage?.toLocaleString("sv-SE")} mil, ${c.city}`
          )
          .join("; ");

        const userQuery = context.freeText
          ? `Användarens fråga: "${context.freeText}". `
          : "";

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
                {
                  role: "system",
                  content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare. Ge en personlig, kort sammanfattning (max 3 meningar) av varför dessa bilar passar kundens situation. 

Var specifik: nämn varför biltypen/drivlinan passar deras livsstil. Om de nämnde pendling, kommentera bränsleeffektivitet. Om de nämnde familj, kommentera utrymme och säkerhet. Om de nämnde en region, bekräfta att du sökt lokalt.

${aiReasoning ? `Din resonering: ${aiReasoning}` : ""}

Var varm, professionell och objektiv — rekommendera det som faktiskt är bäst för kunden.`,
                },
                {
                  role: "user",
                  content: `${userQuery}Sökresultat: ${cars.length} bilar hittade. Prisintervall: ${priceRange}. Märken: ${makes.join(", ")}. Städer: ${cities.join(", ")}. Topbilar: ${carSummaries}. ${relaxLevel > 0 ? "Sökningen breddades för att hitta resultat." : ""}`,
                },
              ],
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) message = content;
        } else {
          console.error("AI response error:", aiResponse.status);
        }
      } catch (e) {
        console.error("AI message error:", e);
      }
    }

    if (!message) {
      message =
        cars.length > 0
          ? `Jag hittade ${cars.length} bilar som matchar dina önskemål!`
          : "Tyvärr hittade jag inga bilar som matchar just nu. Prova att beskriva din situation på ett annat sätt.";
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
