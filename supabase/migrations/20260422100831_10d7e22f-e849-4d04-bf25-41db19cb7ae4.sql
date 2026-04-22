
UPDATE "Lovable"
SET is_active = false
WHERE is_active = true
  AND (
    model_raw ILIKE '%leasbar%'
    OR model_raw ILIKE '%leasebar%'
    OR model_raw ILIKE '%privatleas%'
    OR model_raw ILIKE '%business lease%'
    OR model_raw ILIKE '%businesslease%'
    OR model_raw ILIKE '%lease från%'
    OR model_raw ILIKE '%leasing från%'
    OR model_raw ILIKE '%leasing fr.%'
    OR model_raw ILIKE '%lease fr.%'
    OR model_raw ILIKE '%leas.bar%'
    OR model_clean ILIKE '%leasbar%'
    OR model_clean ILIKE '%leasebar%'
    OR model_clean ILIKE '%privatleas%'
    OR (price IS NOT NULL AND price < 20000)
  );
