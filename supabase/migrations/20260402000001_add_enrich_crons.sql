-- pg_cron-jobb för kontinuerlig berikelse av bildata.
--
-- Job 1: enrich-from-blocket
--   Hämtar gratis per-bil-data (färg, kaross, hp, drivlina, säten, dragvikt, räckvidd ...)
--   från Blocket /v1/ad/car?id= för bilar med color IS NULL.
--   200 bilar/min × 1440 min/dag ≈ 288 000 bilar/dag → 55k historiska bilar klara på ~11h.
--
-- Job 2: detect-colors
--   Vision-AI (Gemini 2.5 Flash) för bilar som enrich-from-blocket markerat som "Okänd"
--   (Blocket saknade färgdata eller listningen har utgått).
--   100 bilar/min med 10 parallella Gemini-anrop → ~80% billigare än vision-AI-only.
--   Raderar permanent bilar med dåliga bilder (interiörfoto, hjul, motor, tom bild).

SELECT cron.schedule(
  'enrich-from-blocket',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/enrich-from-blocket',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-sync-secret', current_setting('app.sync_secret')
    ),
    body    := '{"limit":200}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'detect-colors-fallback',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/detect-colors',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-sync-secret', current_setting('app.sync_secret')
    ),
    body    := '{"limit":100}'::jsonb
  );
  $$
);
