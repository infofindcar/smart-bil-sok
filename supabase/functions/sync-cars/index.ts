import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://findcar.se",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const BATCH_SIZE = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const syncStartedAt = new Date().toISOString();

  try {
    // Auth — kräver SYNC_SECRET-env. Ingen hardcoded fallback (säkerhet).
    const secret = req.headers.get("x-sync-secret");
    const envSecret = Deno.env.get("SYNC_SECRET");
    if (!envSecret) {
      console.error("SYNC_SECRET env var not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!secret || secret !== envSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const cars: Record<string, unknown>[] = body.cars;

    if (!Array.isArray(cars) || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Body must contain a non-empty 'cars' array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filtrera bort bilar utan bild direkt vid mottagning
    const carsWithImage = cars.filter((car) => car.image_thumb_url);
    const skippedNoImage = cars.length - carsWithImage.length;

    // Filtrera bort bilar utan regnr — krävs för transportstyrelsen-länken
    // och för att över huvud taget kunna identifiera bilen unikt utåt.
    const carsWithReg = carsWithImage.filter((car) => {
      const r = typeof car.regnr === "string" ? car.regnr.trim() : "";
      return r.length >= 4;
    });
    const skippedNoReg = carsWithImage.length - carsWithReg.length;

    // Säkerhetsnät: blockera leasingbilar och orimligt låga priser (felaktiga månadspriser)
    const LEASE_PATTERN = /(leasbar|leasebar|leas\.bar|privatleas|business\s*lease|lease\s+fr[åa]n|leasing\s+fr[åa]n|lease\s+fr\.|leasing\s+fr\.)/i;
    const isLeaseOrBadPrice = (car: Record<string, unknown>) => {
      const raw = String(car.model_raw ?? "");
      const clean = String(car.model_clean ?? "");
      const price = typeof car.price === "number" ? car.price : Number(car.price);
      if (LEASE_PATTERN.test(raw) || LEASE_PATTERN.test(clean)) return true;
      if (Number.isFinite(price) && price > 0 && price < 20000) return true;
      return false;
    };
    const carsClean = carsWithReg.filter((c) => !isLeaseOrBadPrice(c));
    const skippedLease = carsWithReg.length - carsClean.length;

    if (skippedNoImage > 0) console.log(`sync-cars: hoppade över ${skippedNoImage} bilar utan bild`);
    if (skippedNoReg > 0) console.log(`sync-cars: hoppade över ${skippedNoReg} bilar utan regnr`);
    if (skippedLease > 0) console.log(`sync-cars: blockerade ${skippedLease} leasing/lågprisbilar`);
    console.log(`sync-cars: received ${carsClean.length} giltiga bilar (${skippedNoImage} utan bild, ${skippedNoReg} utan regnr, ${skippedLease} leasing), syncStartedAt=${syncStartedAt}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Count before to calculate added vs updated
    const { count: countBefore } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true });

    // Upsert in batches of 200
    let upsertErrors = 0;
    for (let i = 0; i < carsClean.length; i += BATCH_SIZE) {
      const batch = carsClean.slice(i, i + BATCH_SIZE).map((car) => {
        // Remove 'id' to avoid overwriting Supabase's auto-increment primary key
        // with Blocket's own ID (which is stored in source_listing_id instead)
        const { id: _blocketId, ...carFields } = car as Record<string, unknown>;
        return {
          ...carFields,
          is_active: true,
          last_seen_at: syncStartedAt,
        };
      });

      const { error } = await supabase
        .from("Lovable")
        .upsert(batch, { onConflict: "source,source_listing_id", ignoreDuplicates: false });

      if (error) {
        console.error(`Batch upsert error at offset ${i}:`, error.message);
        upsertErrors++;
      }
    }

    // Ta bort bilar som inte sågs i denna sync
    const { count: deleted, error: deleteError } = await supabase
      .from("Lovable")
      .delete({ count: "exact" })
      .lt("last_seen_at", syncStartedAt);

    if (deleteError) {
      console.error("Delete error:", deleteError.message);
    }

    const { count: countAfter } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true });

    const added = Math.max(0, (countAfter ?? 0) - (countBefore ?? 0) + (deleted ?? 0));
    const updated = carsClean.length - added;
    const durationMs = Date.now() - new Date(syncStartedAt).getTime();

    console.log(
      `sync-cars done: added=${added}, updated=${updated}, deleted=${deleted ?? 0}, errors=${upsertErrors}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        added,
        updated,
        deleted: deleted ?? 0,
        total: carsClean.length,
        skippedNoImage,
        skippedNoReg,
        skippedLease,
        upsertErrors,
        durationMs,
        enrichTriggered: false,
        enrichCount: 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-cars fatal error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
