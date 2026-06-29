CREATE TABLE public.listing_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  url text NOT NULL,
  result jsonb,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listing_analyses_ip_created_idx ON public.listing_analyses (ip_hash, created_at DESC);
CREATE INDEX listing_analyses_url_created_idx ON public.listing_analyses (url, created_at DESC);

GRANT ALL ON public.listing_analyses TO service_role;

ALTER TABLE public.listing_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access" ON public.listing_analyses
  FOR ALL TO service_role USING (true) WITH CHECK (true);