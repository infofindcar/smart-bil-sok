DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;

CREATE POLICY "Authenticated read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.review_author_names(_ids uuid[])
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND EXISTS (
      SELECT 1 FROM public.car_reviews r
      WHERE r.user_id = p.id AND r.status = 'approved'
    )
$$;

GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon, authenticated;