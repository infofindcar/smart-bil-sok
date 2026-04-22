-- GIN trigram-index för snabb ILIKE-sökning på description.
-- Används när framtida SQL-baserad feature-sökning aktiveras
-- (guided-search gör idag matchningen i JS på redan hämtade rader,
-- men om vi byter till SQL ILIKE-filter för att minska antalet
-- rader som måste hämtas blir detta index kritiskt för prestanda).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS lovable_description_trgm_idx
  ON public."Lovable" USING gin (description gin_trgm_ops)
  WHERE description IS NOT NULL;
