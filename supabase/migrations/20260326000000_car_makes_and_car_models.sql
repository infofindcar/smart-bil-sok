-- ============================================================
-- car_makes: statisk garantitabell per märke
-- Uppdateras manuellt, noll AI-anrop behövs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.car_makes (
  make                       TEXT PRIMARY KEY,
  warranty_years             INTEGER NOT NULL DEFAULT 3,
  warranty_km                INTEGER NOT NULL DEFAULT 100000,
  roadside_assistance_years  INTEGER NOT NULL DEFAULT 3,
  country_of_origin          TEXT NULL,
  notes                      TEXT NULL
);

ALTER TABLE public.car_makes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on car_makes"
  ON public.car_makes FOR SELECT USING (true);

-- Garantidata – verifierad mot tillverkarnas svenska webbplatser (mars 2026)
-- warranty_km = 0 innebär obegränsad km
INSERT INTO public.car_makes (make, warranty_years, warranty_km, roadside_assistance_years, country_of_origin) VALUES
  ('Kia',            7, 150000, 7,  'Sydkorea'),
  ('MG',             7, 150000, 7,  'Kina'),
  ('BYD',            6, 150000, 6,  'Kina'),
  ('Mitsubishi',     5, 100000, 5,  'Japan'),
  ('Hyundai',        5, 100000, 5,  'Sydkorea'),
  ('Tesla',          4,  80000, 4,  'USA'),
  ('Volvo',          3, 150000, 3,  'Sverige'),
  ('Polestar',       3,  60000, 3,  'Sverige'),
  ('BMW',            3, 100000, 3,  'Tyskland'),
  ('Mercedes-Benz',  3, 100000, 3,  'Tyskland'),
  ('Mercedes',       3, 100000, 3,  'Tyskland'),
  ('Audi',           3, 100000, 3,  'Tyskland'),
  ('Volkswagen',     3, 100000, 3,  'Tyskland'),
  ('Skoda',          3, 100000, 3,  'Tjeckien'),
  ('SEAT',           3, 100000, 3,  'Spanien'),
  ('Cupra',          3, 100000, 3,  'Spanien'),
  ('Porsche',        3,  0,     3,  'Tyskland'),
  ('Ford',           3, 100000, 3,  'USA'),
  ('Peugeot',        3, 100000, 3,  'Frankrike'),
  ('Citroën',        3, 100000, 3,  'Frankrike'),
  ('Opel',           3, 100000, 3,  'Tyskland'),
  ('Renault',        3, 100000, 3,  'Frankrike'),
  ('Dacia',          3, 100000, 3,  'Rumänien'),
  ('Nissan',         3, 100000, 3,  'Japan'),
  ('Toyota',         3, 100000, 3,  'Japan'),
  ('Lexus',          3, 100000, 3,  'Japan'),
  ('Mazda',          3, 100000, 3,  'Japan'),
  ('Honda',          3, 100000, 3,  'Japan'),
  ('Subaru',         3, 100000, 3,  'Japan'),
  ('Suzuki',         3, 100000, 3,  'Japan'),
  ('Jeep',           3, 100000, 3,  'USA'),
  ('Land Rover',     3, 100000, 3,  'UK'),
  ('Jaguar',         3, 100000, 3,  'UK'),
  ('Mini',           3, 100000, 3,  'UK'),
  ('Fiat',           3, 100000, 3,  'Italien'),
  ('Alfa Romeo',     3, 100000, 3,  'Italien'),
  ('Lynk & Co',      3,  60000, 3,  'Kina'),
  ('Xpeng',          5, 150000, 5,  'Kina'),
  ('NIO',            5,  0,     5,  'Kina'),
  ('Zeekr',          5, 150000, 5,  'Kina')
ON CONFLICT (make) DO UPDATE SET
  warranty_years            = EXCLUDED.warranty_years,
  warranty_km               = EXCLUDED.warranty_km,
  roadside_assistance_years = EXCLUDED.roadside_assistance_years,
  country_of_origin         = EXCLUDED.country_of_origin;


-- ============================================================
-- car_models: cache för modell-specifik fakta
-- AI körs EN gång per make+model, resultatet sparas för alltid
-- ============================================================
CREATE TABLE IF NOT EXISTS public.car_models (
  id                        BIGSERIAL PRIMARY KEY,
  make                      TEXT NOT NULL,
  model                     TEXT NOT NULL,

  -- Kaross & praktikalitet
  body_type                 TEXT NULL,          -- SUV, Sedan, Kombi, etc.
  boot_space_liters         INTEGER NULL,       -- bagageutrymme liter (normalt läge)
  max_towing_kg             INTEGER NULL,       -- max dragvikt kg
  seats                     INTEGER NULL,       -- antal sittplatser

  -- Motor & prestanda
  typical_hp_min            INTEGER NULL,       -- lägsta HK bland versioner
  typical_hp_max            INTEGER NULL,       -- högsta HK bland versioner
  zero_to_hundred_sec       NUMERIC(4,1) NULL,  -- 0-100 km/h snabbaste variant (sek)
  drivetrain_default        TEXT NULL,          -- AWD / FWD / RWD

  -- Miljö & förbrukning
  fuel_consumption_l100km   NUMERIC(4,1) NULL,  -- WLTP snitt, liter/100km (0 = elbil)
  electric_range_km         INTEGER NULL,       -- WLTP räckvidd el (0 = ej elbil)
  co2_g_per_km              INTEGER NULL,       -- WLTP CO2 g/km

  -- Säkerhet
  euro_ncap_stars           INTEGER NULL,       -- Euro NCAP stjärnor (1-5)
  euro_ncap_year            INTEGER NULL,       -- vilket år testet gjordes

  -- Övrigt
  reliability_notes         TEXT NULL,          -- kända styrkor/svagheter (AI)
  enriched_at               TIMESTAMPTZ NULL,
  ncap_source               TEXT NULL           -- 'euroncap' | 'ai_estimate'
);

CREATE UNIQUE INDEX IF NOT EXISTS car_models_make_model_idx ON public.car_models (make, model);
CREATE INDEX IF NOT EXISTS car_models_make_idx ON public.car_models (make);

ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on car_models"
  ON public.car_models FOR SELECT USING (true);
