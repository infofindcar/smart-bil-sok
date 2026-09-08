// TILLFÄLLIG underhållsfunktion för bildgallerier.
// Skyddad av IMAGE_JOB_SECRET. Tas bort när genomgången är klar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-job-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret = Deno.env.get("IMAGE_JOB_SECRET");
  if (!secret || req.headers.get("x-job-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const action = String(body.action ?? "");

  try {
    if (action === "cars") {
      const afterId = Number(body.after_id ?? 0);
      const limit = Math.min(Number(body.limit ?? 1000), 2000);
      const mode = String(body.mode ?? "all"); // all | missing | gallery
      let q = supabase
        .from("Lovable")
        .select("id, source_listing_id, dealer_name, image_thumb_url, image_urls")
        .eq("is_active", true)
        .gt("id", afterId)
        .order("id", { ascending: true })
        .limit(limit);
      if (mode === "missing") q = q.is("image_urls", null);
      const { data, error } = await q;
      if (error) throw error;
      return json({ cars: data ?? [] });
    }

    if (action === "set_urls") {
      const { data, error } = await supabase.rpc("set_car_image_urls", {
        payload: body.payload,
      });
      if (error) throw error;
      return json({ updated: data });
    }

    if (action === "set_clean") {
      const { data, error } = await supabase.rpc("set_car_clean_images", {
        payload: body.payload,
      });
      if (error) throw error;
      return json({ updated: data });
    }

    if (action === "banners") {
      const rows = body.payload as Array<Record<string, unknown>>;
      const { error } = await supabase
        .from("banner_fingerprints")
        .upsert(rows, { onConflict: "fingerprint,dealer_name" });
      if (error) throw error;
      return json({ ok: true, count: rows.length });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
