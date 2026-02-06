
-- 1. Fix ERROR: "ny find car" table has no RLS policies
-- Add a public read-only policy (same pattern as "cars" table)
CREATE POLICY "ny_find_car_public_read"
ON public."ny find car"
FOR SELECT
USING (true);

-- 2. Fix WARN: analytics_events allows unrestricted INSERT from anyone
-- Since track-analytics edge function uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS),
-- we can safely restrict the INSERT policy to deny anonymous direct inserts.
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Only service role can insert analytics"
ON public.analytics_events
FOR INSERT
WITH CHECK (false);
