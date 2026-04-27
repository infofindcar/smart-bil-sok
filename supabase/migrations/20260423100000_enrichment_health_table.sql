-- Heartbeat-tabell för enrichment-jobb.
-- Uppdateras av enrich-batch edge function efter varje lyckad körning,
-- så admin-sidan kan visa "senast lyckad för X min sedan" och larma
-- om jobbet tystnar (t.ex. auth-drift, som hände 2026-04-23).
--
-- Skapades live via MCP apply_migration 2026-04-23; denna fil är
-- till för versionering i git och för att kunna återskapa projektet.

CREATE TABLE IF NOT EXISTS public.enrichment_health (
  job_name         text        PRIMARY KEY,
  last_success_at  timestamptz NOT NULL DEFAULT now(),
  last_processed   integer,
  last_remaining   integer,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enrichment_health IS
  'Heartbeat: senast lyckad körning per enrichment-jobb. Admin-sidan larmar om last_success_at blir gammal.';

ALTER TABLE public.enrichment_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON public.enrichment_health;
CREATE POLICY "service_role_full_access" ON public.enrichment_health
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read" ON public.enrichment_health;
CREATE POLICY "authenticated_read" ON public.enrichment_health
  FOR SELECT TO authenticated USING (true);
