-- 1) dealers: remove broad authenticated read of dealer emails/phones
DROP POLICY IF EXISTS "Authenticated can read dealers" ON public.dealers;
REVOKE SELECT ON public.dealers FROM authenticated;
REVOKE SELECT ON public.dealers FROM anon;

-- 2) leads: hard-deny reads for anon/authenticated (defense in depth for customer PII)
REVOKE SELECT ON public.leads FROM anon;
REVOKE SELECT ON public.leads FROM authenticated;
DROP POLICY IF EXISTS "Deny select on leads for public roles" ON public.leads;
CREATE POLICY "Deny select on leads for public roles"
  ON public.leads AS RESTRICTIVE FOR SELECT
  TO anon, authenticated
  USING (false);

-- 3) storage: explicit public-read policies scoped to the two intended asset buckets
DROP POLICY IF EXISTS "Public read assets bucket" ON storage.objects;
CREATE POLICY "Public read assets bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public read asset white bucket" ON storage.objects;
CREATE POLICY "Public read asset white bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'asset white');