import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Rate limit: 20 anrop per minut per IP
const hits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  rec.count++;
  return rec.count > 20;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Bucket = Record<string, number>;

function topEntries(bucket: Bucket, limit = 6) {
  return Object.entries(bucket)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) return json({ error: "Rate limited" }, 429);

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    const expected = Deno.env.get("ADMIN_PASSWORD");
    if (!expected) return json({ error: "Not configured" }, 500);
    if (!password || !timingSafeEqual(password, expected)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [
      carsRes,
      trafficRes,
      waitlistCountRes,
      waitlistApprovedRes,
      waitlistRecentRes,
      leadsRes,
      feedbackRes,
      searchEventsRes,
      analysesRes,
    ] = await Promise.all([
      supabase.rpc("admin_car_stats"),
      supabase.rpc("admin_traffic_stats"),
      supabase.from("waitlist").select("*", { count: "exact", head: true }),
      supabase.from("waitlist").select("*", { count: "exact", head: true }).eq("approved", true),
      supabase
        .from("waitlist")
        .select("first_name,last_name,email,approved,created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("leads")
        .select("id,car_id,customer_name,customer_email,customer_phone,dealer_name,status,created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("forbattringar")
        .select("id,message,email,page_path,status,created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("analytics_events")
        .select("event_data,created_at")
        .eq("event_name", "search_started")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("listing_analyses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since30),
    ]);

    // Vanligaste önskemålen i sökningarna
    const budget: Bucket = {};
    const makes: Bucket = {};
    const bodies: Bucket = {};
    const fuels: Bucket = {};

    const budgetLabel = (v: number) => {
      if (v < 100_000) return "under 100 000 kr";
      if (v < 200_000) return "100–200 000 kr";
      if (v < 300_000) return "200–300 000 kr";
      if (v < 500_000) return "300–500 000 kr";
      return "över 500 000 kr";
    };

    for (const row of searchEventsRes.data ?? []) {
      const d = (row.event_data ?? {}) as Record<string, unknown>;
      const max = Number(d.maxPrice ?? d.priceMax ?? d.budget);
      if (Number.isFinite(max) && max > 0) budget[budgetLabel(max)] = (budget[budgetLabel(max)] || 0) + 1;
      for (const key of ["make", "makes", "brand"]) {
        const v = d[key];
        if (typeof v === "string") makes[v] = (makes[v] || 0) + 1;
        if (Array.isArray(v)) for (const m of v) if (typeof m === "string") makes[m] = (makes[m] || 0) + 1;
      }
      for (const key of ["bodyType", "bodyTypes", "body_type"]) {
        const v = d[key];
        if (typeof v === "string") bodies[v] = (bodies[v] || 0) + 1;
        if (Array.isArray(v)) for (const m of v) if (typeof m === "string") bodies[m] = (bodies[m] || 0) + 1;
      }
      for (const key of ["fuelType", "fuelTypes", "fuel_type"]) {
        const v = d[key];
        if (typeof v === "string") fuels[v] = (fuels[v] || 0) + 1;
        if (Array.isArray(v)) for (const m of v) if (typeof m === "string") fuels[m] = (fuels[m] || 0) + 1;
      }
    }

    const nowMs = Date.now();
    const countSince = (rows: { created_at: string | null }[] | null, hours: number) =>
      (rows ?? []).filter((r) => r.created_at && nowMs - new Date(r.created_at).getTime() < hours * 3600 * 1000).length;

    return json({
      cars: carsRes.data ?? null,
      traffic: trafficRes.data ?? null,
      searchPreferences: {
        budget: topEntries(budget),
        makes: topEntries(makes),
        bodies: topEntries(bodies),
        fuels: topEntries(fuels),
        sampled: (searchEventsRes.data ?? []).length,
      },
      waitlist: {
        total: waitlistCountRes.count ?? 0,
        approved: waitlistApprovedRes.count ?? 0,
        today: countSince(waitlistRecentRes.data as any, 24),
        last7: countSince(waitlistRecentRes.data as any, 24 * 7),
        recent: waitlistRecentRes.data ?? [],
      },
      leads: {
        recent: leadsRes.data ?? [],
        last7: countSince(leadsRes.data as any, 24 * 7),
      },
      feedback: feedbackRes.data ?? [],
      listingAnalyses30d: analysesRes.count ?? 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("admin-stats error", e instanceof Error ? e.message : "unknown");
    return json({ error: "Server error" }, 500);
  }
});
