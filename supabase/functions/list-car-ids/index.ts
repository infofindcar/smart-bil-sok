import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const secret = Deno.env.get("SYNC_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ids: number[] = [];
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("Lovable")
      .select("id")
      .eq("active", true)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    if (!data || data.length === 0) break;

    ids.push(...data.map((r: any) => r.id));
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return new Response(JSON.stringify({ ids }), {
    headers: { "Content-Type": "application/json" },
  });
});
