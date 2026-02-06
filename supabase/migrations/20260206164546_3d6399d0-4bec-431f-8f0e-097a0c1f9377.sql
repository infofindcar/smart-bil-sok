
-- Create sync_logs table for admin sync tracking
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  batches_total INTEGER DEFAULT 0,
  batches_completed INTEGER DEFAULT 0,
  cars_inserted INTEGER DEFAULT 0,
  cars_updated INTEGER DEFAULT 0,
  cars_skipped INTEGER DEFAULT 0,
  credits_estimated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  error_message TEXT NULL
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access sync_logs
CREATE POLICY "Service role full access on sync_logs"
  ON public.sync_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB NULL,
  page_path TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read analytics
CREATE POLICY "Service role can read analytics"
  ON public.analytics_events
  FOR SELECT
  USING (false);

-- Add useful columns to cars table if they don't exist
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'carinfo';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS dealer_name TEXT NULL;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS dealer_url TEXT NULL;
