import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const secret = Deno.env.get("SYNC_SECRET");
  if (secret && req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { cars } = await req.json();
  if (!Array.isArray(cars) || cars.length === 0) {
    return new Response(JSON.stringify({ error: "No cars provided" }), { status: 400 });
  }

  // 1. Skriv till avtal_bilar (källtabell för avtalsbilar)
  const avtalCars = cars.map((c: Record<string, unknown>) => ({
    reg_nr: c.reg_nr,
    partner: "bilformedlingen",
    make: c.make,
    model: c.model,
    model_raw: c.model_raw,
    year: c.year,
    price: c.price,
    mileage: c.mileage,
    fuel_type: c.fuel_type,
    transmission: c.transmission,
    body_type: c.body_type,
    color: c.color,
    city: c.city,
    image_thumb_url: c.image_thumb_url,
    horsepower: c.horsepower,
    is_active: c.is_active,
    last_seen_at: c.last_seen_at,
  }));

  const { error: avtalError } = await supabase
    .from("avtal_bilar")
    .upsert(avtalCars, { onConflict: "partner,reg_nr", ignoreDuplicates: false });

  if (avtalError) {
    console.error("avtal_bilar upsert error:", avtalError.message);
    return new Response(JSON.stringify({ error: avtalError.message }), { status: 500 });
  }

  // 2. Skriv till Lovable (sökindex – samma bilar syns i söket)
  const lovableCars = cars.map((c: Record<string, unknown>) => ({
    make: c.make,
    model: c.model,
    model_raw: c.model_raw,
    year: c.year,
    price: c.price,
    mileage: c.mileage,
    fuel_type: c.fuel_type,
    transmission: c.transmission,
    body_type: c.body_type,
    color: c.color,
    city: c.city,
    image_thumb_url: c.image_thumb_url,
    horsepower: c.horsepower,
    is_active: c.is_active,
    last_seen_at: c.last_seen_at,
    source: "bilformedlingen",
    source_listing_id: c.reg_nr,
    regnr: c.reg_nr,
  }));

  const { error: lovableError, count } = await supabase
    .from("Lovable")
    .upsert(lovableCars, { onConflict: "source,source_listing_id", ignoreDuplicates: false })
    .select("id", { count: "exact", head: true });

  if (lovableError) {
    console.error("Lovable upsert error:", lovableError.message);
    return new Response(JSON.stringify({ error: lovableError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    upserted: count ?? cars.length,
  }), { headers: { "Content-Type": "application/json" } });
});
