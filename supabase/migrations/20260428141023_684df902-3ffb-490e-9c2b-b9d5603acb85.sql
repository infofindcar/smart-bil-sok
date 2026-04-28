CREATE TABLE public.forbattringar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  email text,
  page_path text,
  user_agent text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.forbattringar ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit feedback
CREATE POLICY "Anyone can submit forbattringar"
ON public.forbattringar
FOR INSERT
TO public
WITH CHECK (
  message IS NOT NULL
  AND length(trim(message)) BETWEEN 1 AND 2000
  AND (email IS NULL OR length(email) <= 255)
);

-- Only authenticated users can read submissions
CREATE POLICY "Authenticated can read forbattringar"
ON public.forbattringar
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update status
CREATE POLICY "Authenticated can update forbattringar"
ON public.forbattringar
FOR UPDATE
TO authenticated
USING (true);

CREATE INDEX idx_forbattringar_created_at ON public.forbattringar (created_at DESC);
CREATE INDEX idx_forbattringar_status ON public.forbattringar (status);