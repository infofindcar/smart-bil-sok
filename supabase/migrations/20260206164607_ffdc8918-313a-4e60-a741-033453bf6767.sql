
-- Fix sync_logs: restrict to service role only (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role full access on sync_logs" ON public.sync_logs;

CREATE POLICY "Deny all access to sync_logs"
  ON public.sync_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- The analytics INSERT policy WITH CHECK (true) is intentional for public event tracking
-- The "ny find car" table RLS info is pre-existing and not from our migration
