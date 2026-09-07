import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/(www\.)?findcar\.se$/,
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

// Rate limiter: 60 events per minute per IP (sidvisningar ingår)
const analyticsRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_EVENTS = 60;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = analyticsRequests.get(ip);
  if (!record || now > record.resetAt) {
    analyticsRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_EVENTS;
}

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of analyticsRequests) {
    if (now > record.resetAt) analyticsRequests.delete(ip);
  }
}, 60 * 1000);

const MAX_EVENT_DATA_SIZE = 2048; // 2 KB

/**
 * Anonym dagsunik besökarkod. IP + user-agent + dagens datum + hemlig salt
 * hashas — koden byts varje dygn och kan inte räknas tillbaka till en person.
 */
async function visitorHash(ip: string, userAgent: string): Promise<string> {
  const salt = Deno.env.get("SYNC_SECRET") || "findcar";
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${userAgent}|${day}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function deviceFromUA(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return "tablet";
  if (/mobi|iphone|android|phone/.test(s)) return "mobil";
  if (/bot|crawler|spider|preview/.test(s)) return "bot";
  return "dator";
}

/** Grupperar referrer till en läsbar källa. */
function referrerSource(raw: string, req: Request): string {
  if (!raw) return "direkt";
  let host = "";
  try {
    host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "direkt";
  }
  const own = (() => {
    try {
      return new URL(req.headers.get("origin") || "").hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();
  if (!host || host === own || host.endsWith("findcar.se") || host.endsWith("lovable.app")) return "direkt";
  if (host.includes("google")) return "Google";
  if (host.includes("bing")) return "Bing";
  if (host.includes("duckduckgo")) return "DuckDuckGo";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
  if (host.includes("linkedin")) return "LinkedIn";
  if (host.includes("youtube")) return "YouTube";
  if (host.includes("reddit")) return "Reddit";
  return host.slice(0, 80);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { eventName, eventData, pagePath, userAgent, referrer } = await req.json();

    // Input validation
    if (!eventName || typeof eventName !== "string" || eventName.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid eventName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pagePath && (typeof pagePath !== "string" || pagePath.length > 500)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid pagePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate eventData size
    if (eventData != null) {
      const serialized = JSON.stringify(eventData);
      if (serialized.length > MAX_EVENT_DATA_SIZE) {
        return new Response(
          JSON.stringify({ success: false, error: "eventData too large" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const ua = typeof userAgent === "string" ? userAgent : req.headers.get("user-agent") || "";
    const device = deviceFromUA(ua);

    // Botar räknas inte som besökare
    if (device === "bot") {
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("analytics_events").insert({
      event_name: eventName.slice(0, 100),
      event_data: eventData || null,
      page_path: pagePath?.slice(0, 500) || null,
      user_agent: ua.slice(0, 500) || null,
      visitor_hash: await visitorHash(clientIp, ua),
      device,
      referrer: referrerSource(typeof referrer === "string" ? referrer : "", req),
    });

    if (error) {
      console.error("Analytics insert error");
      return new Response(
        JSON.stringify({ success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const corsHeaders = getCorsHeaders(req);
    console.error("track-analytics error");
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
