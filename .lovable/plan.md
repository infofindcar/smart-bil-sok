# Fyll på bildgallerier på alla bilar — och håll det påfyllt

Läget idag (verifierat): alla 76 234 aktiva bilar har en huvudbild och länkarna
fungerar. Men 33 282 bilar visar bara **en** bild, varav 30 894 aldrig fick sin
bildlista hämtad. Nästan alla dessa är annonser som senast uppdaterades före
5 september. Bland bilarna från senaste hämtningen (7 sep) har 93 % fullt
galleri — så det nattliga flödet fungerar redan, det är de äldre bilarna som
släpar.

## Vad vi gör

1. **Engångspåfyllning av alla bilar som saknar galleri** (~31 000). Vi hämtar
   bildlistan per annons från annonskällan, kör exakt samma reklamrensning som
   den nattliga importen använder:
   - sista bilden tas alltid bort (bilfirmans logga/kontaktbild),
   - bilder som återkommer i mer än en annons tas bort (återanvänd reklam),
   - bilder med onormalt format (kvadratiska, stående, extremt breda) tas bort,
   - bilder vi inte kan bedöma tas bort — hellre för få bilder än en främmande
     annons,
   - max 15 bilder per bil.
2. **Kontroll efteråt.** När körningen är klar räknar vi igenom hela lagret och
   redovisar: hur många bilar som har flera bilder, hur många som fortfarande
   har bara en och varför (annonsen har faktiskt bara en bild, eller resten
   rensades bort som reklam). Bilar som missats körs om tills listan är tom.
3. **Fortsätter av sig själv för nya bilar.** Den nattliga hämtningen fyller
   redan galleriet med samma regler. Vi lägger till en efterkontroll i samma
   körning som tar hand om de bilar som eventuellt blivit utan galleri, så det
   aldrig byggs upp en ny eftersläpning.
4. **Ingen ändring i hur bilarna visas.** Sökresultaten har fortfarande en bild
   per kort; galleriet syns på bilsidan.

## Att tänka på

- Bilder som rensas bort som "reklam" kan i enstaka fall vara en riktig bilbild
  som firman återanvänt mellan två annonser. Det är den avvägning vi valt:
  hellre en bild för lite än en främmande annons.
- Körningen tar en stund (ca 31 000 annonser plus bildkontroller) och görs i
  omgångar. Sajten påverkas inte medan den pågår.

## Tekniska detaljer

- Tillfällig, hemlighetsskyddad underhållsfunktion (samma mönster som förra
  gången: `IMAGE_JOB_SECRET`, RPC:erna `set_car_image_urls` /
  `set_car_clean_images`, uppslag av reklam-fingeravtryck i
  `banner_fingerprints`). Funktionen och secreten tas bort när körningen är
  verifierad.
- Backfill-script kör i batchar (id-cursor, ~500 bilar per varv), hämtar
  bildlistor per `source_listing_id` från Blockets API, återanvänder logiken i
  `pickGalleryImages` + `annotateCleanImages` från `scripts/import-cars.js` och
  skriver `image_urls` samt `image_urls_clean`.
- Bilförmedlingen-bilarna (29 rader utan galleri) fylls från feedets
  bildkolumn med samma regler.
- Ny efterkontroll i `scripts/import-cars.js`: efter synken loggas och
  återkörs bilar där `image_urls` är null trots att annonsen hade flera bilder.
- Verifiering: fördelning av `array_length(image_urls_clean,1)` före/efter,
  samt stickprov med öppnad bilsida (huvudbild + miniatyrer laddas, inga döda
  länkar).
- Inga schemaändringar, inga RLS-ändringar, ingen ändring i `guided-search`
  eller `cars-public`.
