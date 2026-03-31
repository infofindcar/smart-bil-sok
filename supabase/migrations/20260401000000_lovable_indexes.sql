-- Performance indexes for the Lovable table
-- Supports fast upsert, color lookup, sync cleanup and filtered searches

-- Unique index used by upsert (onConflict: source, source_listing_id)
CREATE UNIQUE INDEX IF NOT EXISTS lovable_source_listing_idx
  ON public."Lovable" (source, source_listing_id);

-- Partial index for finding unenriched cars (enrich-batch worker)
CREATE INDEX IF NOT EXISTS lovable_color_idx
  ON public."Lovable" (color)
  WHERE color IS NULL OR color = 'Okänd' OR color = 'Unknown';

-- Index used when deleting stale cars after sync (lt last_seen_at)
CREATE INDEX IF NOT EXISTS lovable_last_seen_at_idx
  ON public."Lovable" (last_seen_at);

-- Indexes used by guided-search queries on active cars
CREATE INDEX IF NOT EXISTS lovable_active_price_idx
  ON public."Lovable" (is_active, price) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS lovable_active_year_idx
  ON public."Lovable" (is_active, year) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS lovable_fuel_body_idx
  ON public."Lovable" (fuel_type, body_type) WHERE is_active = true;
