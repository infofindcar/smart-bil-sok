
-- Drop the overly broad restrictive policy
DROP POLICY "Deny all access to waitlist" ON public.waitlist;

-- Create restrictive policies only for SELECT, UPDATE, DELETE
CREATE POLICY "Deny select on waitlist"
  ON public.waitlist
  AS RESTRICTIVE
  FOR SELECT
  USING (false);

CREATE POLICY "Deny update on waitlist"
  ON public.waitlist
  AS RESTRICTIVE
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny delete on waitlist"
  ON public.waitlist
  AS RESTRICTIVE
  FOR DELETE
  USING (false);
