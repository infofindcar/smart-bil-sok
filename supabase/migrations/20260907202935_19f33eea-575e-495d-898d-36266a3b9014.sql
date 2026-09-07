ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS visitor_hash text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS device text;

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx
  ON public.analytics_events (visitor_hash, created_at DESC);