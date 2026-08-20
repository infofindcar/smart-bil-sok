# Snabbare och stabilare sökning

## Vad jag hittade (verifierat)

- AI-anropen är **inte** problemet: Lovable AI Gateway-loggarna visar 1,4–2,2 sekunder per anrop (senaste dygnet, hundratals lyckade 200-svar).
- Flaskhalsen är databasen. `Lovable`-tabellen är ~48 000 rader / 104 MB, och `EXPLAIN` på en typisk sökfråga visar **Seq Scan** (full tabellgenomsökning) — inget index används.
- Orsaken: alla nyttiga index på tabellen är partiella med villkoret `is_active = true`, men söklogiken filtrerar **aldrig** på `is_active`. Därför faller varje sökning tillbaka på full scan.
- Varje sökning kör dessutom **fyra** sådana scans parallellt (nivå 0+1, sedan 2+3) och hämtar `select("*")` med 200 rader per fråga — inklusive den stora `description`-kolumnen som frontend inte ens använder. Det blir flera MB JSON per sökning, gånger fyra.
- Under skrivandet av planen timeoutade till och med ett enkelt `count(*)` mot databasen — ett tecken på att databasen redan är CPU-mättad av just dessa scans. Det förklarar både långsamheten och att sökningar ibland dör helt efter minuter (edge function / klient ger upp).

## Vad jag gör

### 1. Databasen: index + `is_active`-filter
- Lägg till index som matchar de faktiska sökfrågorna: pris + bild-finns, samt trigram-index (`pg_trgm`) på `make`, `model` och `city` så `ILIKE '%…%'` slutar vara full scan.
- Lägg till `is_active = true` i sökfrågan så de befintliga partiella indexen faktiskt används (och så inaktuella annonser slutar visas).

### 2. Söklogiken: hämta mindre data
- Byt `select("*")` mot en explicit kolumnlista med exakt de fält frontend använder (id, make, model, model_raw, year, price, mileage, fuel_type, body_type, drivetrain, city, color, image_thumb_url, listing_url, regnr, horsepower, transmission, dealer_name, dealer_url). Tar bort `description` m.fl. tunga kolumner ur svaret.
- Minska kandidatpoolen från 200 till ~80 rader per nivå — fortfarande gott om utrymme för diversifieringen (max 1 per modell, 2 per märke, 9 resultat).
- Kör **nivå 0 först**, och gå bara vidare till nivå 1/2/3 om den gav för få träffar. Idag körs alltid två frågor parallellt, vilket dubblar databaslasten även när nivå 0 räcker.

### 3. Robusthet så inget "hänger" i minuter
- Sätt ett tak på hur länge sökningen får ta i edge-funktionen och returnera de bilar som hittats (eller ett tydligt felmeddelande) i stället för att låta anropet dö tyst.
- I chatten: visa tydligt fel-/retry-läge om sökningen misslyckas, i stället för att spinnern fortsätter i evighet.

## Teknisk sammanfattning

| Fil | Ändring |
|---|---|
| ny migration | `pg_trgm`-index på `make`/`model`/`city`, index `(price)` filtrerat på aktiv + bild |
| `supabase/functions/guided-search/index.ts` | `is_active`-filter, explicit kolumnlista, pool 200→80, sekventiell relaxering, tidsgräns + garanterat svar |
| `src/components/GuidedSearch.tsx` | fel-/retry-läge när sökningen misslyckas |

Förväntat resultat: sökningen går från flera minuter (eller timeout) till några sekunder — dominerad av AI-anropens ~2 s — och tål många samtidiga användare.
