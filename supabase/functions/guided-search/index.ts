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

const CONVERSATION_SYSTEM_PROMPT = `Du är Clutch, en intelligent och objektiv svensk bilrådgivare. Du har ett naturligt samtal med kunden för att förstå exakt vilken bil som passar dem bäst. Du ska kännas som en riktig människa som bryr sig.

DITT MÅL: Ställ tillräckligt med frågor för att verkligen förstå kundens situation och kunna hitta EXAKT rätt bil. Ju mer du vet, desto bättre resultat. Du ska ställa minst 5 frågor innan du söker.

INFORMATION DU BEHÖVER SAMLA (alla är viktiga):
1. Vad bilen ska användas till (pendling, familj, stad, långresor, blandat)
2. Budget (ungefärligt prisintervall)
3. Var personen bor (stad/region — för att hitta bilar i närheten)
4. Hur långt de kör dagligen/veckovis (påverkar drivlina-val)
5. Drivlina-preferens (el, hybrid, bensin, diesel) — eller om de inte vet, hjälp dem
6. Karosstyp (SUV, kombi, sedan, etc.) — eller härledd från behov
7. Färgpreferens — har kunden önskemål om färg? (vi har data på detta)
8. Växellåda — automat eller manuell? (viktigt för komfort)
9. Driftskostnad vs prestanda — vill kunden ha låga kostnader eller mer kraft?
10. Årsmodell — vill kunden ha nyare eller äldre bil? (påverkar pris och utrustning)
11. Eventuella specifika önskemål (märke, utrustning, etc.)

INTELLIGENTA REGLER:
- Om kunden nämner lång pendling → du förstår att bränsleeffektivitet och komfort är viktigt, men fråga ändå om budget och plats
- Om kunden nämner familj → du förstår att utrymme och säkerhet är viktigt, men fråga hur stor familjen är
- Om kunden nämner stad → liten bil och el/hybrid, men fråga om de kör långa sträckor ibland
- Om kunden säger "låg driftskostnad" → förstå att el/hybrid och lågt miltal är viktigt
- Om kunden nämner en färg → notera och filtrera på den
- Om kunden nämner automat/manuell → notera det (vi kan inte filtrera direkt men nämn det i motiveringar)
- Ställ MAX EN fråga per meddelande
- Var kort, varm och naturlig — som en kompis som kan bilar
- Använd INTE emojis
- Bekräfta kort vad kunden sa innan du ställer nästa fråga (t.ex. "Okej, pendling alltså!")
- Om kunden ger väldigt mycket info på en gång, hoppa över frågor du redan har svar på
- Blanda inte ihop frågor — ställ en i taget för att det ska kännas personligt

NÄR DU SKA SÖKA: Du ska ha samlat minst 5 av de 11 punkterna ovan ELLER ha ställt minst 5 frågor. Sök INTE förrän du har tillräckligt för att verkligen kunna filtrera bort fel bilar och ge personliga motiveringar.

VIKTIG REGEL — ALLTID BEKRÄFTA INNAN SÖKNING:
Innan du bestämmer dig för att söka (action: "search") MÅSTE du alltid ställa en sista bekräftelsefråga till kunden: "Är det något mer du vill lägga till innan jag söker?" eller liknande. Ge förslag som "Nej, sök nu!", "Jag vill lägga till något" osv. Först EFTER att kunden bekräftar att de är klara ska du returnera action: "search". Om kunden svarar att de vill lägga till något, fortsätt ställa frågor.

NÄR DU STÄLLER EN FRÅGA, inkludera även "suggestions" — 2-4 korta svarsförslag som kunden kan klicka på. Dessa ska vara relevanta för frågan.

SVAR-FORMAT (svara ENBART med JSON, ingen markdown, inga code fences):

Om du behöver mer info:
{"action":"ask","message":"Din fråga här","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Om du har tillräckligt med info för att söka:
{"action":"search","filters":{"budget":"MIN-MAX","fuel":["diesel","el"],"bodyType":["kombi","suv"],"city":"Stad","make":"Märke","color":"Färg","yearMin":2018,"yearMax":2024,"useCase":"pendling"},"reasoning":"Kort förklaring av varför dessa filter valdes","customerProfile":"Sammanfattning av kundens behov och preferenser i 2 meningar"}

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
      console.log("AI asking:", decision.message, "suggestions:", decision.suggestions);
      return new Response(
        JSON.stringify({
          action: "ask",
          message: decision.message,
          suggestions: decision.suggestions || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI decided to search — run database query
    if (decision.action === "search") {
      const filters = decision.filters || {};
      const reasoning = decision.reasoning || "";
      const customerProfile = decision.customerProfile || "";
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

        // Color filter (dropped at level 1+)
        if (filters.color && relaxLevel < 1) {
          query = query.ilike("color", `%${filters.color}%`);
        }

        // Year filter (dropped at level 2+)
        if (filters.yearMin && relaxLevel < 2) {
          query = query.gte("year", filters.yearMin);
        }
        if (filters.yearMax && relaxLevel < 2) {
          query = query.lte("year", filters.yearMax);
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

      // Build context from conversation
      const userMessages = messages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .join(". ");

      // Generate personalized result message + per-car reasons
      let message = "";
      let carReasons: { carId: number; reason: string }[] = [];
      let suggestions: string[] = [];

      if (cars.length > 0) {
        try {
          const carSummaries = cars
            .map(
              (c: any) =>
                `ID:${c.id} — ${c.make} ${c.model} ${c.year}, ${c.price?.toLocaleString("sv-SE")} kr, ${c.fuel_type}, ${c.body_type}, ${c.mileage?.toLocaleString("sv-SE")} mil, ${c.city}, färg: ${c.color || "okänd"}`
            )
            .join("\n");

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
                    content: `Du är Clutch, en objektiv och kunnig svensk bilrådgivare. Du ska göra två saker:

1. Ge en kort personlig sammanfattning (max 2 meningar) om varför dessa bilar passar kundens situation.
2. För VARJE bil, ge en kort personlig motivering (1 mening) om varför just den bilen passar kunden baserat på deras specifika behov.

Var specifik: nämn varför biltypen/drivlinan/färgen/priset passar deras livsstil. Använd INTE emojis.

${reasoning ? `Din resonering: ${reasoning}` : ""}
${customerProfile ? `Kundprofil: ${customerProfile}` : ""}

Var varm, professionell och objektiv.

Svara ENBART med JSON (ingen markdown, inga code fences):
{"message":"Din sammanfattning här","carReasons":[{"carId":123,"reason":"Motivering för denna bil"}]}`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}"\n\nBilar:\n${carSummaries}\n\n${relaxLevel > 0 ? "Sökningen breddades för att hitta resultat." : ""}`,
                  },
                ],
              }),
            }
          );

          if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            const content = msgData.choices?.[0]?.message?.content?.trim();
            if (content) {
              try {
                const cleanedContent = content
                  .replace(/^```json?\s*/i, "")
                  .replace(/```\s*$/, "")
                  .trim();
                const parsed = JSON.parse(cleanedContent);
                message = parsed.message || "";
                carReasons = parsed.carReasons || [];
              } catch {
                // Fallback: use raw content as message
                message = content;
              }
            }
          }
        } catch (e) {
          console.error("AI message error:", e);
        }
      } else {
        // No cars found — generate helpful suggestions
        try {
          const noResultResponse = await fetch(
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
                    content: `Du är Clutch, en svensk bilrådgivare. Kunden sökte bilar men inga hittades. Du ska:
1. Kort förklara varför det inte finns matchande bilar (max 2 meningar)
2. Ge 2-3 konkreta förslag på hur kunden kan ändra sin sökning för att hitta bilar

Svara ENBART med JSON (ingen markdown, inga code fences):
{"message":"Tyvärr hittade jag inga bilar som matchar...","suggestions":["Förslag 1","Förslag 2","Förslag 3"]}

Förslagen ska vara specifika och klickbara, t.ex. "Öka budgeten till 200 000 kr", "Prova hybrid istället för el", "Sök i hela Sverige".
Använd INTE emojis.`,
                  },
                  {
                    role: "user",
                    content: `Kundens behov: "${userMessages}". Filter som användes: ${JSON.stringify(filters)}. Alla 4 relax-nivåer testades utan resultat.`,
                  },
                ],
              }),
            }
          );

          if (noResultResponse.ok) {
            const noResultData = await noResultResponse.json();
            const content = noResultData.choices?.[0]?.message?.content?.trim();
            if (content) {
              try {
                const cleanedContent = content
                  .replace(/^```json?\s*/i, "")
                  .replace(/```\s*$/, "")
                  .trim();
                const parsed = JSON.parse(cleanedContent);
                message = parsed.message || "";
                suggestions = parsed.suggestions || [];
              } catch {
                message = content;
              }
            }
          }
        } catch (e) {
          console.error("No-result AI error:", e);
        }
      }

      if (!message) {
        message =
          cars.length > 0
            ? `Jag hittade ${cars.length} bilar som matchar dina önskemål!`
            : "Tyvärr hittade jag inga bilar som matchar just nu. Försök ändra dina kriterier.";
      }

      return new Response(
        JSON.stringify({
          action: "search",
          message,
          cars,
          carReasons,
          suggestions,
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
