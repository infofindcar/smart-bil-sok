import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Publik, skrivskyddad läsning av aktiva bilar. Tabellen "Lovable" blockerar
// anon-select via RLS, så bilsidan (/car/:id) och annonsanalysens
// "hitta bättre alternativ" går via den här funktionen istället.
// Actions: "get" (en bil via id) och "alternatives" (begränsad sökning).

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

// Rate limiter: 60 anrop per minut per IP
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
}, WINDOW_MS);

const CAR_COLUMNS =
  "id, make, model, model_raw, year, price, mileage, fuel_type, body_type, drivetrain, city, color, image_thumb_url, regnr, horsepower, transmission, dealer_name";

function sanitizeText(v: unknown, max = 60): string | null {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[%,()]/g, " ").trim().slice(0, max);
  return clean.length > 0 ? clean : null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ success: false, error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "alternatives" ? "alternatives" : "get";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "get") {
      const id = Number(body?.id);
      if (!Number.isFinite(id) || id <= 0) {
        return new Response(JSON.stringify({ success: false, error: "id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("Lovable")
        .select(CAR_COLUMNS)
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("cars-public get error:", error);
        return new Response(JSON.stringify({ success: false, error: "Unable to fetch car" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, car: data ?? null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === "alternatives"
    const make = sanitizeText(body?.make);
    const model = sanitizeText(body?.model);
    const models: string[] = Array.isArray(body?.models)
      ? body.models.map((m: unknown) => sanitizeText(m)).filter(Boolean).slice(0, 8) as string[]
      : [];
    const year = typeof body?.year === "number" ? body.year : null;
    const mileage = typeof body?.mileage === "number" && body.mileage > 0 ? body.mileage : null;
    const price = typeof body?.price === "number" && body.price > 0 ? body.price : null;
    const mode = body?.mode === "class" ? "class" : "better";

    let query = supabase
      .from("Lovable")
      .select("id, make, model, model_raw, year, price, mileage, image_thumb_url, city, dealer_name")
      .eq("is_active", true)
      .not("price", "is", null)
      .not("image_thumb_url", "is", null)
      .gt("price", 1500);

    if (mode === "better") {
      if (!make || !model) {
        return new Response(JSON.stringify({ success: false, error: "make and model required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.ilike("make", make).ilike("model", `%${model}%`);
      if (year) query = query.gte("year", year - 1);
      if (mileage) query = query.lte("mileage", mileage);
      if (price) query = query.lte("price", Math.round(price * 1.05));
      query = query.order("price", { ascending: true });
    } else {
      if (models.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "models required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ors = models
        .map((m) => `model.ilike.%${m.split(/\s+/).slice(-1)[0]}%`)
        .join(",");
      query = query.or(ors);
      if (year) query = query.gte("year", year - 2);
      if (price) query = query.lte("price", Math.round(price * 1.1));
      query = query.order("price", { ascending: true });
    }

    const { data, error } = await query.limit(24);

    if (error) {
      console.error("cars-public alternatives error:", error);
      return new Response(JSON.stringify({ success: false, error: "Unable to fetch cars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, cars: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cars-public error:", e);
    return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
