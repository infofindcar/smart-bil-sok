-- Permanent nattlig rensning av obereikbara bilar.
--
-- Bakgrund: vissa bilar kan inte berikas (klassiska bilar där HP varierar
-- mellan varianter, "Övriga"-modeller där AI inte vet specifik modell,
-- etc.). Användarregel: hellre färre bilar med komplett data än bilar
-- utan HP/drivlina på sajten.
--
-- Funktion raderar bilar som varit i tabellen >24h och fortfarande
-- saknar HP eller drivlina (efter att enrichment haft chans att försöka).
--
-- Schemalagt kl 04:00, efter Blocket-synken kl 02:00.

CREATE OR REPLACE FUNCTION public.delete_unenrichable_cars()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count int;
BEGIN
  WITH del AS (
    DELETE FROM "Lovable"
    WHERE created_at < now() - interval '24 hours'
      AND ((horsepower IS NULL OR horsepower = 0)
        OR (drivetrain IS NULL OR drivetrain = 'Unknown'))
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM del;

  INSERT INTO public.enrichment_health (job_name, last_success_at, last_processed, last_remaining)
  VALUES ('delete-unenrichable', now(), v_count, 0)
  ON CONFLICT (job_name) DO UPDATE
  SET last_success_at = EXCLUDED.last_success_at,
      last_processed  = EXCLUDED.last_processed;

  RETURN v_count;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-unenrichable') THEN
    PERFORM cron.schedule(
      'delete-unenrichable',
      '0 4 * * *',
      $cron$SELECT public.delete_unenrichable_cars();$cron$
    );
  END IF;
END $$;
