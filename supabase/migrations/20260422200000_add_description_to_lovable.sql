-- Lägg till description-kolumn för Blockets säljar-beskrivning.
-- Fylls av scripts/import-cars.js från car.body (Blocket API-fältet).
-- Tidigare lagrade vi bara model_raw (titeln, ~50-100 tecken). Nu får vi
-- säljarens fulla text ("nyservad, ny kamrem, rökfri ägare" osv.) vilket:
--   1. Ger bättre kontext i CarDetail-vyn
--   2. Gör feature-sökning mycket bredare (AI kan matcha tillval som
--      nämns i beskrivningen, inte bara i titeln)
ALTER TABLE public."Lovable" ADD COLUMN IF NOT EXISTS description TEXT;
