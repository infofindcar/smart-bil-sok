ALTER TABLE public."Lovable" ADD COLUMN IF NOT EXISTS image_urls_clean text[];

CREATE TABLE IF NOT EXISTS public.banner_fingerprints (
  fingerprint text NOT NULL,
  dealer_name text NOT NULL,
  listing_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fingerprint, dealer_name)
);

GRANT ALL ON public.banner_fingerprints TO service_role;

ALTER TABLE public.banner_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages banner_fingerprints"
  ON public.banner_fingerprints FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_car_clean_images(payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated integer;
BEGIN
  WITH data AS (
    SELECT (e->>0)::bigint AS car_id,
           ARRAY(SELECT jsonb_array_elements_text(e->1)) AS urls
    FROM jsonb_array_elements(payload) AS e
  ), upd AS (
    UPDATE public."Lovable" l
    SET image_urls_clean = d.urls
    FROM data d
    WHERE l.id = d.car_id
    RETURNING 1
  )
  SELECT count(*) INTO updated FROM upd;
  RETURN updated;
END;
$$;

REVOKE ALL ON FUNCTION public.set_car_clean_images(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_car_clean_images(jsonb) TO service_role;