-- Blockera direkt anon-åtkomst till Lovable-tabellen.
-- All data serveras via edge-funktioner (guided-search, similar-listings)
-- som kör med service_role och filtrerar bort känsliga kolumner.
--
-- Känsliga kolumner som INTE ska exponeras till webbläsaren:
--   source, source_listing_id, listing_url
-- (avslöjar att bilar hämtas från Blocket/Bilförmedlingen)

-- Ta bort befintliga anon SELECT-policies om de finns
DROP POLICY IF EXISTS "Allow public read on Lovable" ON "Lovable";
DROP POLICY IF EXISTS "anon_select" ON "Lovable";
DROP POLICY IF EXISTS "Public read access" ON "Lovable";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Lovable";

-- Lägg till en policy som blockerar all direkt anon-läsning
-- (service_role kringgår RLS per definition och påverkas inte)
CREATE POLICY "block_anon_direct_select"
  ON "Lovable"
  FOR SELECT
  TO anon
  USING (false);
