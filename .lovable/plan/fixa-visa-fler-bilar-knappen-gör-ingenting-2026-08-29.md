# Fixa "Visa fler bilar" — knappen gör ingenting

## Orsaken (verifierad i koden)

Knappen anropar `handleLoadMore` i `src/pages/Index.tsx`, som först läser `findcar-last-filters` från sessionStorage. Saknas den avbryts allt direkt.

Den nyckeln sätts i `src/components/GuidedSearch.tsx` endast om svaret innehåller `filters` eller `customerProfile` — men det slutliga sök-svaret från `guided-search` (raderna 926–936 i `supabase/functions/guided-search/index.ts`) skickar bara `message`, `cars`, `carReasons`, `suggestions`, `matchCount`, `relaxed`, `relaxLevel`, `userAge`, `userCity`. **Varken `filters` eller `customerProfile` finns med.**

Alltså: filtren sparas aldrig → "Visa fler" avbryts alltid vid första raden → inget händer (bara en diskret info-toast som lätt missas).

`load_more`-grenen i edge-funktionen är i övrigt korrekt och optimerad; problemet är enbart att den aldrig anropas.

## Vad jag gör

1. **Skicka med filtren i sök-svaret**
   Lägg till `filters` (de faktiskt använda filtren) och `customerProfile` i det slutliga sök-svaret i `guided-search`, så att frontend kan spara dem.

2. **Spara filtren robust i frontend**
   `GuidedSearch` sparar `findcar-last-filters` så snart ett sökresultat kommer in, och rensar nyckeln vid ny sökning.

3. **Fallback när filtren ändå saknas**
   Om nyckeln saknas (t.ex. gammal session) körs "Visa fler" istället som en enkel utökning baserad på redan visade bilar, i stället för att avbrytas tyst. Om även det misslyckas visas en tydlig felruta i stället för en diskret info-toast.

4. **Verifiering**
   Kör igenom en riktig sökning i förhandsvisningen och tryck "Visa fler" för att bekräfta att nya bilar läggs till.

## Tekniskt

| Fil | Ändring |
|---|---|
| `supabase/functions/guided-search/index.ts` | Inkludera `filters` + `customerProfile` i sök-svaret |
| `src/components/GuidedSearch.tsx` | Spara/rensa `findcar-last-filters` säkert vid varje sökresultat |
| `src/pages/Index.tsx` | `handleLoadMore`: fallback utan sparade filter + tydligare felmeddelande |

Ingen databasändring behövs.
