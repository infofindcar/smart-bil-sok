CREATE POLICY "Service role manages guided_search_usage"
ON public.guided_search_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.guided_search_usage TO service_role;