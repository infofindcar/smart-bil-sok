-- Enable pg_cron extension (requires Supabase Pro plan)
-- Safe to run on any plan - will be a no-op if not supported
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Safety-net job: mark cars not seen in 48 hours as inactive
-- Runs daily at 3:00 AM UTC
-- This catches any cars missed if the sync-cars edge function failed
SELECT cron.schedule(
  'deactivate-stale-cars',
  '0 3 * * *',
  $$
    UPDATE "Lovable"
    SET is_active = false
    WHERE is_active = true
      AND last_seen_at < now() - INTERVAL '48 hours';
  $$
);
