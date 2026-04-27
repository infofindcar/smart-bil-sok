-- 1. Säkerställ att pg_net-tillägget är aktiverat (krävs av notify_lead_email)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Gör triggerfunktionen fail-safe: om e-postnotisen misslyckas
--    ska INSERT av leadet fortfarande lyckas (kunden ska aldrig se ett fel
--    bara för att e-postutskicket strular).
CREATE OR REPLACE FUNCTION public.notify_lead_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  BEGIN
    PERFORM extensions.http_post(
      url := 'https://bvqveqoschdpenvbxygj.supabase.co/functions/v1/send-lead-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::text
    );
  EXCEPTION WHEN OTHERS THEN
    -- Logga felet men låt INSERT fortsätta
    RAISE WARNING 'notify_lead_email failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 3. Säkerställ att triggern faktiskt finns på leads-tabellen
DROP TRIGGER IF EXISTS notify_lead_email_trigger ON public.leads;
CREATE TRIGGER notify_lead_email_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_email();