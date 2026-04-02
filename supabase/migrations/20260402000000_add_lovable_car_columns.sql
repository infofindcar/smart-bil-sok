-- Lägger till per-bil kolumner i Lovable-tabellen.
-- Dessa hämtas gratis från Blocket /v1/ad/car?id= via enrich-from-blocket.
ALTER TABLE public."Lovable"
  ADD COLUMN IF NOT EXISTS seats               integer,
  ADD COLUMN IF NOT EXISTS max_towing_kg       integer,
  ADD COLUMN IF NOT EXISTS electric_range_km   integer,
  ADD COLUMN IF NOT EXISTS fuel_consumption_l100km numeric(4,1),
  ADD COLUMN IF NOT EXISTS boot_space_l        integer,
  ADD COLUMN IF NOT EXISTS doors               integer,
  ADD COLUMN IF NOT EXISTS color_description   text;

-- Partial index för EV-filtrering (räckvidd)
CREATE INDEX IF NOT EXISTS lovable_ev_range_idx
  ON public."Lovable" (electric_range_km)
  WHERE electric_range_km IS NOT NULL AND electric_range_km > 0;
