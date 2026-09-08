# Bort med andras annonser i bildgallerierna + fler bilder

Två saker ska lösas: reklam-/logobilder (ofta bild 2 och 3) ska aldrig visas, och de cirka 32 000 aktiva annonser som fortfarande bara har en bild ska fyllas på.

## 1. Reklambilder bort — "säkrast först"

Reklambilderna är oftast exakt samma bild återanvänd i alla annonser från samma bilfirma. Vi utnyttjar det, plus två extra spärrar:

- **Samma bild igen hos samma firma → bort.** Vi läser in bilderna, räknar ut ett fingeravtryck per bild och tar bort varje bild vars fingeravtryck återkommer i mer än en annons från samma firma. Det träffar logotyper, "vi köper din bil"-banners, garanti- och finansieringsskyltar.
- **Fel bildformat → bort.** Banners är nästan alltid mycket bredare eller kvadratiska jämfört med bilfoton. Bilder med avvikande format sorteras bort.
- **Sista bilden bort** (redan regel i dag) behålls.
- **Osäkra fall tas bort, inte behålls.** Kan en bild inte läsas in eller bedömas visar vi den inte.

Resultatet sparas som en rensad bildlista per annons, så webben bara får godkända bilder. Ett fåtal riktiga bilfoton kan försvinna — det är avsiktligt enligt ditt val.

Vi gör också en snabb säkerhetsspärr direkt i galleriet: bilder som ligger utanför normalt bildformat visas inte, även om de finns i listan.

## 2. Fylla på saknade bilder

Vi kör en ny genomgång mot Blocket för alla aktiva annonser som bara har en bild, hämtar bildlistorna och sparar dem — samma väg som förra påfyllningen, i satser så att inget överbelastas. Om det visar sig att Blocket helt saknar fler bilder för en del annonser rapporterar vi hur många det gäller; då är en bild allt som finns.

Den nattliga uppdateringen får samma rensning som ovan, så nya annonser aldrig kommer in med reklambilder.

## Kontroll innan vi säger klart

- Stickprov på annonser från de firmor där du sett reklam i bild 2/3 — inga banners kvar.
- Räknar antal aktiva annonser med flera bilder före/efter.
- Kollar en bilsida i webbläsaren och att inga bilder är trasiga.

## Tekniska detaljer

- Ny kolumn `image_urls_clean` (text[]) på `Lovable` + `banner_hashes`-tabell (hash, dealer_name, count) för blockerade fingeravtryck. GRANT + RLS enligt projektstandard (publik läsning endast av bilkolumner via `cars-public`).
- Ny edge function `clean-gallery-images`: batchvis (500 annonser) hämtning av bilder med timeout, `crypto.subtle.digest('SHA-256')` på bytes, dimensioner via JPEG/WebP-header-parsing, aspect ratio utanför 1.15–2.10 = reklam.
- Fas 1: bygg hash→(dealer, listing-count)-index. Fas 2: markera hashar med >1 annons per firma som banner och skriv `image_urls_clean`.
- `pickGalleryImages` i `scripts/import-cars.js` och `sync-cars` skriver även `image_urls_clean` för nya annonser; okontrollerade bilder utöver första exkluderas till dess de granskats.
- `cars-public` och `guided-search` (`SEARCH_COLUMNS`) returnerar `image_urls_clean`; `CarDetail.tsx` skickar den till `CarGallery`, med `image_urls` som fallback endast för första bilden.
- `CarGallery.tsx`: `onLoad`-kontroll av `naturalWidth/naturalHeight` döljer bilder utanför tillåtet format.
- Backfill av saknade bilder: samma Blocket-API-väg som tidigare, satser om 500, via tillfällig service-role-funktion som tas bort efteråt.
