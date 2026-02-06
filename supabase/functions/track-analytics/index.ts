import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/smart-bil-sok\.lovable\.app$/,
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventName, eventData, pagePath, userAgent } = await req.json();

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("analytics_events").insert({
      event_name: eventName.slice(0, 100),
      event_data: eventData || null,
      page_path: pagePath?.slice(0, 500) || null,
      user_agent: typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
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
