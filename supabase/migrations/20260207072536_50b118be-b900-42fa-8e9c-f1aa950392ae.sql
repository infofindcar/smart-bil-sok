
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only service role can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can read analytics" ON public.analytics_events;

-- Create proper policies that allow service_role access
CREATE POLICY "Service role can insert analytics"
ON public.analytics_events
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read analytics"
ON public.analytics_events
FOR SELECT
TO service_role
USING (true);
