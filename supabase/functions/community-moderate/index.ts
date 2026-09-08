import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/(www\.)?findcar\.se$/,
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin))
      ? origin
      : "https://smart-bil-sok.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const payload = await req.json().catch(() => ({}));
    const password = payload?.password;
    const action = payload?.action ?? "list";

    if (typeof password !== "string" || password.length === 0 || password.length > 200) {
      return json({ error: "Invalid input" }, 400);
    }
    if (password !== Deno.env.get("ADMIN_PASSWORD")) {
      return json({ error: "Fel lösenord" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (action === "list") {
      const { data: reviews, error } = await admin
        .from("car_reviews")
        .select("*")
        .in("status", ["pending", "approved", "rejected"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
      const emails: Record<string, string> = {};
      for (const id of userIds) {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) emails[id] = data.user.email;
      }

      return json({
        reviews: (reviews ?? []).map((r) => ({ ...r, email: emails[r.user_id] ?? null })),
      });
    }

    if (action === "set_status") {
      const id = payload?.id;
      const status = payload?.status;
      const note = payload?.note;
      if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
        return json({ error: "Ogiltigt id" }, 400);
      }
      if (!["pending", "approved", "rejected"].includes(status)) {
        return json({ error: "Ogiltig status" }, 400);
      }
      if (note != null && (typeof note !== "string" || note.length > 500)) {
        return json({ error: "Ogiltig anteckning" }, 400);
      }

      const { error } = await admin
        .from("car_reviews")
        .update({ status, moderation_note: note ?? null })
        .eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Okänd åtgärd" }, 400);
  } catch (e) {
    console.error("community-moderate error", e instanceof Error ? e.message : e);
    return json({ error: "Server error" }, 500);
  }
});
