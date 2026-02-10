
-- Drop existing overly broad policies on analytics_events
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can read analytics" ON public.analytics_events;

-- Create deny-all policy (service role bypasses RLS, so edge function still works)
CREATE POLICY "Deny all access to analytics_events"
  ON public.analytics_events
  FOR ALL
  USING (false)
  WITH CHECK (false);
