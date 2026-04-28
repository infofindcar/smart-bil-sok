import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Returnerar alla listas av samma bil (samma make+model, ±1 år) från andra
// säljare än den specifika bilen. Används av "Se fler dealers"-modalen
// på CarCard. Ren databasfråga, ingen AI, snabb.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const make: string | null = typeof body.make === "string" ? body.make : null;
    const model: string | null = typeof body.model === "string" ? body.model : null;
    const year: number | null = typeof body.year === "number" ? body.year : null;
    const excludeId: number | null = typeof body.excludeId === "number" ? body.excludeId : null;

    if (!make || !model) {
      return new Response(
        JSON.stringify({ success: false, error: "make and model required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("Lovable")
      .select("id, make, model, model_raw, year, price, mileage, city, dealer_name, image_thumb_url, listing_url, fuel_type, body_type, transmission, drivetrain, horsepower, color")
      .eq("make", make)
      .eq("model", model);

    if (year) {
      query = query.gte("year", year - 1).lte("year", year + 1);
    }
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query
      .order("price", { ascending: true, nullsFirst: false })
      .limit(30);

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, listings: data ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
