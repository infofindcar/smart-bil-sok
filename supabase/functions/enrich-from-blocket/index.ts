import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const DEFAULT_LIMIT = 200;
// Antal parallella Blocket-anrop per chunk (respekterar rate limiting)
const CONCURRENT = 5;
// Paus mellan chunks (ms)
const CHUNK_DELAY_MS = 300;

// ─────────────────────────────────────────────
// Färgmappning: Blocket → VALID_COLORS
// ─────────────────────────────────────────────
const BLOCKET_COLOR_MAP: Record<string, string> = {
  "Blå": "Blå", "Grå": "Grå", "Svart": "Svart", "Vit": "Vit", "Silver": "Silver",
  "Röd": "Röd", "Grön": "Grön", "Brun": "Brun", "Beige": "Beige", "Orange": "Orange",
  "Gul": "Gul", "Lila": "Lila", "Guld": "Guld", "Mörkblå": "Mörkblå", "Ljusblå": "Ljusblå",
  "Mörkgrå": "Mörkgrå", "Ljusgrå": "Ljusgrå", "Mörkgrön": "Mörkgrön", "Vinröd": "Vinröd",
  "Brons": "Guld", "Turkos": "Blå", "Rosa": "Röd",
};

// Biltyp-undantag (resten tas som första ordet i strängen)
const BODY_TYPE_OVERRIDE: Record<string, string> = {
  "Familjebuss": "Minibuss",
  "Crossover": "SUV",
  "Sportkupé": "Coupé",
};

// Drivlina-mappning
const DRIVETRAIN_MAP: Record<string, string> = {
  "Framhjulsdrift": "FWD",
  "Bakhjulsdrift": "RWD",
  "Fyrhjulsdrift": "AWD",
  "Allhjulsdrift": "AWD",
  "4WD": "AWD",
  // "Tvåhjulsdriven" lämnas obehandlad (FWD/RWD-gissning sker via modell-default)
};

// ─────────────────────────────────────────────
// Parse-hjälpare
// ─────────────────────────────────────────────
function parseBodyType(biltyp: string): string {
  const first = biltyp.split(/[\s\/]/)[0];
  return BODY_TYPE_OVERRIDE[first] ?? first;
}

function parseIntOrNull(s: string): number | null {
  const n = parseInt(s.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) || n <= 0 ? null : n;
}

function parseFloatOrNull(s: string): number | null {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) || n <= 0 ? null : n;
}

// Hitta specifikationsvärde vars nyckel börjar med prefix (hantera långa WLTP-nycklar)
function findSpecByPrefix(specs: Record<string, string>, prefix: string): string | null {
  const key = Object.keys(specs).find((k) => k.startsWith(prefix));
  return key ? specs[key] : null;
}

// ─────────────────────────────────────────────
// Hämta Blocket annons-detaljer
// ─────────────────────────────────────────────
async function fetchBlocketAd(
  sourceListingId: string,
): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(
      `https://blocket-api.se/v1/ad/car?id=${encodeURIComponent(sourceListingId)}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.detail) return null;
    return (data.specifications as Record<string, string>) ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Bygg DB-update-objekt från Blocket specifications
// ─────────────────────────────────────────────
function buildUpdate(specs: Record<string, string>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  // Färg
  const rawColor = specs["Färg"];
  updates.color = rawColor ? (BLOCKET_COLOR_MAP[rawColor] ?? "Okänd") : "Okänd";

  // Färgbeskrivning ("Silvermetallic", "Mörkblå metallic")
  if (specs["Färgbeskrivning"]) updates.color_description = specs["Färgbeskrivning"];

  // Karosstyp
  if (specs["Biltyp"]) updates.body_type = parseBodyType(specs["Biltyp"]);

  // Hästkrafter
  if (specs["Effekt"]) {
    const hp = parseIntOrNull(specs["Effekt"]);
    if (hp) updates.horsepower = hp;
  }

  // Drivlina
  const drivetrain = DRIVETRAIN_MAP[specs["Drivhjul"]];
  if (drivetrain) updates.drivetrain = drivetrain;

  // Sittplatser
  if (specs["Säten"]) {
    const s = parseIntOrNull(specs["Säten"]);
    if (s) updates.seats = s;
  }

  // Max dragvikt
  if (specs["Max trailervikt"]) {
    const kg = parseIntOrNull(specs["Max trailervikt"]);
    if (kg) updates.max_towing_kg = kg;
  }

  // Antal dörrar
  if (specs["Antal dörrar"]) {
    const d = parseIntOrNull(specs["Antal dörrar"]);
    if (d) updates.doors = d;
  }

  // Bagageutrymme
  if (specs["Bagageutrymme"]) {
    const b = parseIntOrNull(specs["Bagageutrymme"]);
    if (b) updates.boot_space_l = b;
  }

  // Räckvidd (WLTP) – nyckel kan vara lång med förklaringstext
  const rangeStr = findSpecByPrefix(specs, "Räckvidd");
  if (rangeStr) {
    const km = parseIntOrNull(rangeStr);
    if (km) updates.electric_range_km = km;
  }

  // Bränsleförbrukning (WLTP) – nyckel kan vara lång
  const fuelStr = findSpecByPrefix(specs, "Bränsleförbrukning");
  if (fuelStr) {
    const l = parseFloatOrNull(fuelStr);
    if (l) updates.fuel_consumption_l100km = l;
  }

  return updates;
}

// ─────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const secret = req.headers.get("x-sync-secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const limit: number = typeof body.limit === "number" ? body.limit : DEFAULT_LIMIT;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Räkna totalt återstående (color IS NULL = ej bearbetade)
    const { count: totalRemaining } = await supabase
      .from("Lovable")
      .select("id", { count: "exact", head: true })
      .is("color", null);

    // Hämta bilar att berika
    const { data: cars, error: fetchError } = await supabase
      .from("Lovable")
      .select("id, source_listing_id")
      .is("color", null)
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, updated: 0, okänd: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Hämta Blocket-data i parallella chunks
    const allUpdates: { id: number; updates: Record<string, unknown> }[] = [];

    for (let i = 0; i < cars.length; i += CONCURRENT) {
      const chunk = cars.slice(i, i + CONCURRENT);
      const results = await Promise.all(
        chunk.map(async (car) => {
          if (!car.source_listing_id) {
            return { id: car.id, updates: { color: "Okänd" } };
          }
          const specs = await fetchBlocketAd(car.source_listing_id);
          if (!specs) {
            return { id: car.id, updates: { color: "Okänd" } };
          }
          return { id: car.id, updates: buildUpdate(specs) };
        }),
      );
      allUpdates.push(...results);

      // Paus mellan chunks för att respektera Blockets rate limiting
      if (i + CONCURRENT < cars.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }

    // Skriv alla updates till DB parallellt
    let updated = 0;
    let okänd = 0;

    await Promise.all(
      allUpdates.map(async ({ id, updates }) => {
        await supabase.from("Lovable").update(updates).eq("id", id);
        if (updates.color === "Okänd") okänd++;
        else updated++;
      }),
    );

    const remaining = Math.max(0, (totalRemaining ?? 0) - cars.length);
    console.log(
      `enrich-from-blocket: processed=${cars.length}, updated=${updated}, okänd=${okänd}, remaining=${remaining}`,
    );

    return new Response(
      JSON.stringify({ success: true, processed: cars.length, updated, okänd, remaining }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("enrich-from-blocket error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
