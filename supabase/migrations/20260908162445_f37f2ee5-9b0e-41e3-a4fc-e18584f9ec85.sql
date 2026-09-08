-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are readable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Normalisering av modellnyckel
CREATE OR REPLACE FUNCTION public.normalize_model_key(_make text, _model text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT regexp_replace(lower(trim(coalesce(_make,'') || ' ' || coalesce(_model,''))), '\s+', ' ', 'g')
$$;

-- Reviews
CREATE TABLE public.car_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  make text NOT NULL,
  model text NOT NULL,
  model_normalized text NOT NULL DEFAULT '',
  year integer,
  rating integer NOT NULL,
  title text,
  body text NOT NULL,
  pros text[] NOT NULL DEFAULT '{}',
  cons text[] NOT NULL DEFAULT '{}',
  ownership_months integer,
  mileage_km integer,
  status text NOT NULL DEFAULT 'pending',
  moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.car_reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.car_reviews TO authenticated;
GRANT ALL ON public.car_reviews TO service_role;

ALTER TABLE public.car_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads approved reviews" ON public.car_reviews
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users read own reviews" ON public.car_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reviews" ON public.car_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.car_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Validering + tvinga pending-status och normaliserad nyckel
CREATE OR REPLACE FUNCTION public.car_reviews_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p text;
BEGIN
  NEW.make := trim(NEW.make);
  NEW.model := trim(NEW.model);
  NEW.model_normalized := public.normalize_model_key(NEW.make, NEW.model);
  NEW.updated_at := now();

  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Betyget måste vara 1-5';
  END IF;
  IF length(trim(NEW.body)) < 30 OR length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'Texten måste vara mellan 30 och 2000 tecken';
  END IF;
  IF NEW.title IS NOT NULL AND length(NEW.title) > 100 THEN
    RAISE EXCEPTION 'Rubriken är för lång';
  END IF;
  IF length(NEW.make) = 0 OR length(NEW.make) > 60 OR length(NEW.model) = 0 OR length(NEW.model) > 80 THEN
    RAISE EXCEPTION 'Märke eller modell är ogiltigt';
  END IF;
  IF NEW.year IS NOT NULL AND (NEW.year < 1900 OR NEW.year > 2100) THEN
    RAISE EXCEPTION 'Ogiltig årsmodell';
  END IF;
  IF NEW.ownership_months IS NOT NULL AND (NEW.ownership_months < 0 OR NEW.ownership_months > 720) THEN
    RAISE EXCEPTION 'Ogiltig ägandetid';
  END IF;
  IF NEW.mileage_km IS NOT NULL AND (NEW.mileage_km < 0 OR NEW.mileage_km > 2000000) THEN
    RAISE EXCEPTION 'Ogiltigt miltal';
  END IF;
  IF array_length(NEW.pros, 1) > 3 OR array_length(NEW.cons, 1) > 3 THEN
    RAISE EXCEPTION 'Max 3 plus och 3 minus';
  END IF;
  FOREACH p IN ARRAY (NEW.pros || NEW.cons) LOOP
    IF length(p) > 80 THEN RAISE EXCEPTION 'Plus/minus får vara max 80 tecken'; END IF;
  END LOOP;

  -- Endast service_role får sätta status; övriga hamnar alltid i granskning
  IF current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.status := 'pending';
    NEW.moderation_note := NULL;
  END IF;
  IF NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Ogiltig status';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER car_reviews_guard_trg BEFORE INSERT OR UPDATE ON public.car_reviews
  FOR EACH ROW EXECUTE FUNCTION public.car_reviews_guard();

CREATE UNIQUE INDEX car_reviews_user_model_key ON public.car_reviews (user_id, model_normalized);
CREATE INDEX car_reviews_model_idx ON public.car_reviews (model_normalized);
CREATE INDEX car_reviews_status_idx ON public.car_reviews (status, created_at DESC);

-- Sammanställning per modell
CREATE OR REPLACE FUNCTION public.car_review_summary(_keys text[])
RETURNS TABLE (model_normalized text, review_count bigint, avg_rating numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.model_normalized, count(*)::bigint, round(avg(r.rating)::numeric, 1)
  FROM public.car_reviews r
  WHERE r.status = 'approved' AND r.model_normalized = ANY(_keys)
  GROUP BY r.model_normalized
$$;

GRANT EXECUTE ON FUNCTION public.car_review_summary(text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.normalize_model_key(text, text) TO anon, authenticated, service_role;