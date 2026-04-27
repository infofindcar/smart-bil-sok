-- Bredda auto-fyll: använd typical_hp_max om typical_hp_min saknas
-- (och tvärtom). AI:n returnerar ofta bara ena fältet för nyare
-- EV-modeller där det inte finns spridning på engine variants.
--
-- Före denna fix: ~500 bilar (Kia EV4, EV5, BMW 550e, Citroen C3
-- Aircross m.fl.) saknade HP trots att typical_hp_max var satt.
-- Efter fix: dessa fylls direkt vid nästa cron-körning.

CREATE OR REPLACE FUNCTION public.apply_car_model_data_from_cache()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hp_count        int := 0;
  v_drivetrain_count int := 0;
  v_body_count      int := 0;
  v_total_remaining int := 0;
BEGIN
  -- HP — använd vad som finns (min, max, eller medel av båda)
  WITH up AS (
    UPDATE "Lovable" L
    SET horsepower = ROUND(
      (COALESCE(cm.typical_hp_min, cm.typical_hp_max) +
       COALESCE(cm.typical_hp_max, cm.typical_hp_min)) / 2.0
    )::int
    FROM public.car_models cm
    WHERE L.make = cm.make AND L.model = cm.model
      AND (L.horsepower IS NULL OR L.horsepower = 0)
      AND (
        (cm.typical_hp_min IS NOT NULL AND cm.typical_hp_min > 0)
        OR (cm.typical_hp_max IS NOT NULL AND cm.typical_hp_max > 0)
      )
    RETURNING L.id
  )
  SELECT COUNT(*) INTO v_hp_count FROM up;

  -- Drivlina
  WITH up AS (
    UPDATE "Lovable" L
    SET drivetrain = cm.drivetrain_default
    FROM public.car_models cm
    WHERE L.make = cm.make AND L.model = cm.model
      AND (L.drivetrain IS NULL OR L.drivetrain = 'Unknown')
      AND cm.drivetrain_default IS NOT NULL
    RETURNING L.id
  )
  SELECT COUNT(*) INTO v_drivetrain_count FROM up;

  -- Karosseri
  WITH up AS (
    UPDATE "Lovable" L
    SET body_type = cm.body_type
    FROM public.car_models cm
    WHERE L.make = cm.make AND L.model = cm.model
      AND (L.body_type IS NULL OR L.body_type IN ('Personbil','Transportbil','Unknown','Okänd'))
      AND cm.body_type IS NOT NULL
    RETURNING L.id
  )
  SELECT COUNT(*) INTO v_body_count FROM up;

  -- Räkna återstående
  SELECT COUNT(*) INTO v_total_remaining
  FROM "Lovable"
  WHERE (horsepower IS NULL OR horsepower = 0)
     OR (drivetrain IS NULL OR drivetrain = 'Unknown')
     OR (body_type IS NULL OR body_type IN ('Personbil','Transportbil','Unknown','Okänd'));

  -- Heartbeat
  INSERT INTO public.enrichment_health (job_name, last_success_at, last_processed, last_remaining, updated_at)
  VALUES ('apply-cache-to-cars', now(), v_hp_count + v_drivetrain_count + v_body_count, v_total_remaining, now())
  ON CONFLICT (job_name) DO UPDATE
  SET last_success_at = EXCLUDED.last_success_at,
      last_processed  = EXCLUDED.last_processed,
      last_remaining  = EXCLUDED.last_remaining,
      updated_at      = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'hp', v_hp_count,
    'drivetrain', v_drivetrain_count,
    'body_type', v_body_count,
    'remaining', v_total_remaining
  );
END;
$$;
