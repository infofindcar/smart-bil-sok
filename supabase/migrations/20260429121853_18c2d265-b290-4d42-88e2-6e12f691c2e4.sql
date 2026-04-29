-- ============================================================
-- 1. forbattringar: lock down read/update to service role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read forbattringar" ON public.forbattringar;
DROP POLICY IF EXISTS "Authenticated can update forbattringar" ON public.forbattringar;

CREATE POLICY "Service role can read forbattringar"
ON public.forbattringar
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update forbattringar"
ON public.forbattringar
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 2. leads: lock down read/update to service role only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can update leads" ON public.leads;

CREATE POLICY "Service role can read leads"
ON public.leads
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update leads"
ON public.leads
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 3. Restrict SECURITY DEFINER functions to service_role
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.apply_car_model_data_from_cache() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_car_model_data_from_cache() FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_car_model_data_from_cache() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_car_model_data_from_cache() TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_unenrichable_cars() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_unenrichable_cars() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_unenrichable_cars() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_unenrichable_cars() TO service_role;

REVOKE EXECUTE ON FUNCTION public.notify_lead_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_lead_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_lead_email() FROM authenticated;
-- notify_lead_email is a trigger function; only DB needs to execute it.

-- ============================================================
-- 4. Set immutable search_path on functions missing it
-- ============================================================
ALTER FUNCTION public.apply_car_model_data_from_cache() SET search_path = public;
ALTER FUNCTION public.delete_unenrichable_cars() SET search_path = public;
-- notify_lead_email already has search_path set

-- ============================================================
-- 5. Storage bucket 'assets': add restrictive write policies
-- (bucket stays public-read; only service role can write)
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert assets" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete assets" ON storage.objects;

CREATE POLICY "Service role can insert assets"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Service role can update assets"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Service role can delete assets"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'assets');