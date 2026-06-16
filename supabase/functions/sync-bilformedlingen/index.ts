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

  const { error, count } = await supabase
    .from("Lovable")
    .upsert(cars, { onConflict: "reg_nr", ignoreDuplicates: false })
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Upsert error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    upserted: count ?? cars.length,
    skipped: 0,
  }), { headers: { "Content-Type": "application/json" } });
});
