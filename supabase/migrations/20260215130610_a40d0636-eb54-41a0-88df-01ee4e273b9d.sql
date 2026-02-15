
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Block all by default
CREATE POLICY "Deny all access to waitlist"
  ON public.waitlist
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Allow anonymous inserts
CREATE POLICY "Allow public insert to waitlist"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (true);
