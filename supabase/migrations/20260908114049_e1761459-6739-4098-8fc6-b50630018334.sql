CREATE OR REPLACE FUNCTION public.set_car_image_urls(payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated integer;
BEGIN
  WITH data AS (
    SELECT (e->>0) AS sid, ARRAY(SELECT jsonb_array_elements_text(e->1)) AS urls
    FROM jsonb_array_elements(payload) AS e
  ), upd AS (
    UPDATE public."Lovable" l
    SET image_urls = d.urls
    FROM data d
    WHERE l.source = 'blocket' AND l.source_listing_id = d.sid
    RETURNING 1
  )
  SELECT count(*) INTO updated FROM upd;
  RETURN updated;
END;
$$;

REVOKE ALL ON FUNCTION public.set_car_image_urls(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_car_image_urls(jsonb) TO service_role;