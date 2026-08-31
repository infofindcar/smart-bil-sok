# Sök på en specifik bilfirmas sortiment

Ja, det är fullt möjligt — och nästan all data finns redan. Av 55 943 aktiva annonser har 55 840 ett `dealer_name` (2 597 olika firmor). Idag finns däremot **inget bilfirma-filter kvar i sökfunktionen** (`guided-search`): Clutch kan inte begränsa träffarna till t.ex. Riddermark eller Toveks, även om användaren ber om det.

## Vad som byggs

1. **Clutch förstår firmanamn**
   Skriver användaren "visa bara Riddermarks bilar", "bilar från Toveks Bil" eller "inget från Carla" tolkas det som ett firmafilter — inkludera eller exkludera.

2. **Matchning på kedjor, inte bara exakta butiker**
   Firmanamnen i databasen är butiksnivå ("Riddermark Bil Uppsala", "Riddermark bil Örebro", "Riddermark Transportbilar"). Sökningen matchar på delnamn så att "Riddermark" ger alla butiker i kedjan.

3. **Firmafiltret är hårt**
   Ber du om en specifik firma får du aldrig bilar från andra firmor — varken i huvudresultaten eller i "Visa fler". Andra filter (år, pris, karosstyp) får mjukas upp som idag, men aldrig firman.

4. **Clutch frågar när det är relevant**
   Om användaren nämner en firma men inget annat, ställer Clutch bara de frågor som fortfarande behövs (t.ex. budget/karosstyp) — samma adaptiva logik som idag, ingen extra fast fråga för alla.

5. **Synligt i gränssnittet**
   Firmafiltret visas som en chip bland de övriga filtren i sökrutan och kan tas bort innan sökning, precis som befintliga chips.

## Teknisk detalj

- `supabase/functions/guided-search/index.ts`
  - Nya filterfält `dealerInclude: string[]` och `dealerExclude: string[]` i AI-schemat + systemprompten (exempel och regler för hur firmanamn tolkas).
  - Sanering: max 3 namn per lista, trimmade, `%`/`,`/`(`/`)` strippade, max 60 tecken.
  - Query: `or(dealer_name.ilike.%namn%,...)` för include, `.not("dealer_name","ilike","%namn%")` per namn för exclude — appliceras i `buildQuery` så att både första sökningen och `load_more` får dem.
  - Relaxeringstrappan behåller dealer-filtret på alla nivåer (samma behandling som hård modell/karosstyp).
- `src/components/GuidedSearch.tsx`
  - Visa firma-chip(ar) i den befintliga filterlistan och tillåt borttagning; ta med fälten i `findcar-last-filters` så "Visa fler" behåller dem.
- Ingen databasmigration, inga ändringar i prisbedömning, rating eller annonsanalys.

## Avgränsning

Inget nytt "bläddra bland firmor"-gränssnitt (ingen firmasida eller lista över alla 2 597 firmor) — bara sökning i chatten. Säg till om du också vill ha en publik sida per bilfirma.
