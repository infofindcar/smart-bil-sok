import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin))) {
    return origin;
  }
  return "https://smart-bil-sok.lovable.app";
}

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// In-memory rate limiter per IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > MAX_ATTEMPTS) {
    return true;
  }
  return false;
}

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attempts) {
    if (now > record.resetAt) {
      attempts.delete(ip);
    }
  }
}, 60 * 1000);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    if (isRateLimited(clientIp)) {
      console.log("Rate limited admin attempt");
      return new Response(
        JSON.stringify({ success: false, error: "För många försök. Vänta 15 minuter." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { password } = await req.json();

    // Input validation
    if (typeof password !== "string" || password.length === 0 || password.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const correctPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!correctPassword) {
      console.error("Required configuration missing");
      return new Response(
        JSON.stringify({ success: false, error: "Not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password === correctPassword) {
      // Reset attempts on success
      attempts.delete(clientIp);

      console.log("Admin password verified");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("Invalid admin password attempt");
      return new Response(
        JSON.stringify({ success: false, error: "Fel lösenord" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    const corsHeaders = getCorsHeaders(req);
    console.error("verify-admin-password error");
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
