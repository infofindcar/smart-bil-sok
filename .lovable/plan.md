# Alla bilder per bil — bildgalleri på bilsidan

Ja, det går. Jag kontrollerade datakällorna direkt:

- **Blocket**: varje annons levereras redan med ett fält som innehåller **alla** bilder (den bil jag testade hade 14 st, upp till 1280 px breda). Vi plockar idag bara den första.
- **Bilförmedlingen**: filen vi läser har alla bildlänkar i sista kolumnen, kommaseparerade. Vi tar idag bara `[0]`.

Så ingen ny datakälla, inga extra AI-kostnader — bilderna finns redan, vi kastar bort dem.

## Vad vi bygger

1. **Spara alla bilder** vid importen (både Blocket och Bilförmedlingen), max 15 per bil för att hålla datamängden nere. Den första bilden fortsätter vara huvudbilden, precis som idag.
2. **Galleri på bilsidan**: stor huvudbild som idag, med en rad små miniatyrer under. Klick/svep byter bild. Klick på stora bilden öppnar helskärmsläge med vänster/höger-pilar och svep på mobil.
3. **Bara första bilden laddas direkt** — övriga laddas när man börjar bläddra, så sidan blir inte tyngre att öppna.
4. **Sökresultatens bilkort ändras inte** — samma en bild som idag, ingen påverkan på laddtid i griden.
5. **Bilar som redan finns i databasen** får sina extra bilder vid nästa nattliga uppdatering (varannan natt). Bilar utan extra bilder visar bara huvudbilden, utan miniatyrrad.

## Att tänka på

- Bildlänkarna är Blockets/Bilförmedlingens — när en annons tas bort dör länkarna. Galleriet döljer automatiskt bilder som inte kan laddas, precis som bilkorten gör idag.
- Delnings- och sökmotorbilden fortsätter använda huvudbilden.

## Tekniska detaljer

- **Migration**: `ALTER TABLE public."Lovable" ADD COLUMN image_urls text[]` samt samma kolumn på `avtal_bilar`. Inga nya tabeller, inga RLS-ändringar (befintliga policyer täcker kolumnen).
- `scripts/import-cars.js`: mappa `car.image_urls` → `image_urls: car.image_urls.slice(0, 15)`, behåll `image_thumb_url = image_urls[0] ?? car.image.url`.
- `scripts/import-bilformedlingen.js`: `carImages.split(',').map(s => s.trim()).filter(Boolean).slice(0, 15)`.
- `supabase/functions/sync-cars/index.ts` och `sync-bilformedlingen/index.ts`: fältet följer med i upserten automatiskt; verifiera bara att inget whitelist-filter tar bort det.
- Selektlistorna i `supabase/functions/cars-public/index.ts` (rad 54) och `guided-search/index.ts` (rad 233) utökas med `image_urls` — enbart cars-public behövs för bilsidan; guided-search lämnas orörd för att inte öka svarsstorleken.
- Ny `src/components/CarGallery.tsx` (huvudbild + miniatyrer + helskärmsdialog via befintlig `Dialog`), används i `src/pages/CarDetail.tsx` där dagens `<img>` på rad 399–405 ligger. Använder `carImageUrl`/`carImageSrcSet` från `src/lib/carImage.ts` (960 px huvudbild, 160 px miniatyrer).
- Typerna: `image_urls?: string[] | null` i bil-typen i `CarDetail.tsx` och `GuidedSearch.tsx`.
