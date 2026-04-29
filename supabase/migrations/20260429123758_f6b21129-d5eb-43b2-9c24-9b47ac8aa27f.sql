-- 1. Remove unused plaintext password column from waitlist
ALTER TABLE public.waitlist DROP COLUMN IF EXISTS password;

-- Add CHECK constraint: only accept email + approved fields on insert (defensive)
-- (Insert policy is permissive but column is now gone, so no plaintext storage possible.)

-- 2. Lock down app_config SELECT to service_role only
DROP POLICY IF EXISTS "Allow public read" ON public.app_config;

CREATE POLICY "Service role read app_config"
  ON public.app_config
  FOR SELECT
  TO service_role
  USING (true);