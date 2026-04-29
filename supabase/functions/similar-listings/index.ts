import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Returnerar alla listas av samma bil (samma make+model, ±1 år) från andra
// säljare än den specifika bilen. Används av "Se fler dealers"-modalen
// på CarCard. Ren databasfråga, ingen AI, snabb.

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/(www\.)?findcar\.se$/,
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin))) return origin;
  return "https://smart-bil-sok.lovable.app";
}

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// Rate limiter: 60 requests per minute per IP
const reqs = new Map<string, { count: number; resetAt: number }>();
const MAX_REQS = 60;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = reqs.get(ip);
  if (!record || now > record.resetAt) {
    reqs.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_REQS;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of reqs) {
    if (now > record.resetAt) reqs.delete(ip);
  }
}, 60 * 1000);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Use anon key — Lovable table has public SELECT, so RLS is sufficient.
    // This ensures any future RLS tightening is respected.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
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
      console.error("similar-listings db error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Unable to fetch listings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, listings: data ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("similar-listings error:", e);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ success: false, error: "Unable to fetch listings" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
