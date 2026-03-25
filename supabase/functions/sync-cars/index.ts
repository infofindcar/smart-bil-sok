import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    // Auth via header
    const secret = req.headers.get("x-sync-secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");
    if (!expectedSecret || secret !== expectedSecret) {
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

    console.log(`sync-cars: received ${cars.length} cars, syncStartedAt=${syncStartedAt}`);

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
    for (let i = 0; i < cars.length; i += BATCH_SIZE) {
      const batch = cars.slice(i, i + BATCH_SIZE).map((car) => {
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
    const updated = cars.length - added;
    const durationMs = Date.now() - new Date(syncStartedAt).getTime();

    console.log(
      `sync-cars done: added=${added}, updated=${updated}, deleted=${deleted ?? 0}, errors=${upsertErrors}`
    );

    // Trigga enrichment automatiskt för nya bilar
    let enrichTriggered = false;
    if (added > 0) {
      try {
        // Hämta ID:n för bilar som saknar body_type eller färg (de nya)
        const { data: newCars } = await supabase
          .from("Lovable")
          .select("id")
          .or("color.eq.Unknown,color.is.null,body_type.is.null,body_type.eq.Unknown")
          .limit(500);

        if (newCars && newCars.length > 0) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const enrichUrl = `${supabaseUrl}/functions/v1/enrich-car-data`;
          const enrichSecret = Deno.env.get("SYNC_SECRET")!;

          // Fire-and-forget – vi väntar inte på att enrichment ska bli klar
          fetch(enrichUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sync-secret": enrichSecret,
            },
            body: JSON.stringify({ ids: newCars.map((c) => c.id) }),
          }).catch((e) => console.error("enrich trigger failed:", e));

          enrichTriggered = true;
          console.log(`Triggade enrichment för ${newCars.length} bilar`);
        }
      } catch (e) {
        console.error("Kunde inte trigga enrichment:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        added,
        updated,
        deleted: deleted ?? 0,
        total: cars.length,
        upsertErrors,
        durationMs,
        enrichTriggered,
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
