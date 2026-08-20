-- 1. Stäng av detect-colors (remaining = 0, AI-anropen returnerar 400)
SELECT cron.unschedule(5);

-- 2. Sänk berikningsjobben till en gång per timme
SELECT cron.alter_job(4, schedule := '7 * * * *');
SELECT cron.alter_job(6, schedule := '37 * * * *');

-- 3. Trigram-index för tillvals- och firmasökning (ILIKE '%...%')
CREATE INDEX IF NOT EXISTS lovable_model_raw_trgm_idx
  ON public."Lovable" USING gin (model_raw gin_trgm_ops)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS lovable_dealer_name_trgm_idx
  ON public."Lovable" USING gin (dealer_name gin_trgm_ops)
  WHERE is_active = true;