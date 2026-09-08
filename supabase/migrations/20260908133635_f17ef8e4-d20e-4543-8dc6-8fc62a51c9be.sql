DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='banner_fingerprints') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='banner_fingerprints') THEN
      EXECUTE 'CREATE POLICY "Service role manages banner_fingerprints" ON public.banner_fingerprints FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;
    EXECUTE 'GRANT ALL ON public.banner_fingerprints TO service_role';
  END IF;
END $$;