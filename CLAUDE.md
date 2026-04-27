# CLAUDE.md

Projektguide för AI-sessioner (Claude Code, Lovable m.fl.). Skumläs i 1 min,
sedan är du uppdaterad. Innehåller konventioner som inte är självklara från
koden.

## Vad det här är

FindCar — svensk köpfokuserad bilmarknadsplats som aggregerar Blocket-annonser.
Stack: **Vite + React** (frontend), **Supabase** (DB + edge-functions i Deno),
**Gemini** (AI-sök + enrichment).

## Dataflöde

```
Blocket API  →  scripts/import-cars.js  →  sync-cars  →  Lovable-tabell
                 (dagligen via GitHub Action)               ↓
                                                      enrich-batch
                                                      (cron, AI + car_models-cache)
                                                            ↓
                            frontend  ←  guided-search  ←  Lovable (berikad)
```

- **import-cars.js**: hämtar från Blocket, filtrerar bort leasing/privat/
  utan-bild, parse:ar HP och drivetrain ur titeln, skickar till sync-cars.
- **sync-cars**: upsert i `Lovable` + raderar annonser som inte setts i
  senaste synken.
- **enrich-batch**: AI-berikar `car_models` (1 gång per make+model), applicerar
  värdena på `Lovable`-rader (body_type, drivetrain, HP m.m.).
- **guided-search**: Gemini-chatt som översätter fri svensk text till
  databasfilter, gör matchning mot Lovable, genererar motiveringar.

## Viktiga konventioner

### Sentinel-mönster i enrichment

Vissa fält har sentinel-värden som betyder "berikat men car_models saknade
data". Dessa fält ska **alltid** skrivas — aldrig lämnas null efter första
försöket, annars loopar bilen för evigt i enrichment-kön.

| Fält | Sentinel | Betyder |
|---|---|---|
| `drivetrain` | `'Unknown'` | Berikat, okänt |
| `horsepower` | `0` | Berikat, okänt |
| `body_type` | `'Okänd'` | Berikat, okänt |
| `color` | `'Okänd'` | Berikat, okänt |

Display-lagret (t.ex. `drivetrainLabel()` i `src/pages/CarDetail.tsx`) tolkar
sentinels som "ingen data" och visar fallback eller `–`.

### Leasingfilter (3 koordinerade ställen)

Projektet är köpfokuserat — leasingannonser ska aldrig nå kund.

1. **`scripts/import-cars.js`** — skippar vid import om Blocket-flaggor
   (`sales_form=5`, `ad_type=200`), pris < 10 000 kr på 2025+ bil, eller
   pris < 12 000 kr + leasing/månads-text i titeln.
2. **`supabase/functions/guided-search/index.ts`** — defensivt
   `.not("model_raw", "ilike", "%privatleasing%")` + pris-golv 1500 kr i
   `buildQuery`.
3. **SQL-engångs** — `DELETE FROM "Lovable" WHERE price<12000 AND model_raw
   ~* '(leasing|kr/mån)'` körs vid behov som engångsrensning.

Ändra ETT ställe, uppdatera alla tre.

### Feature-sökning (`featurePatterns`)

Kunder kan söka efter tillval: "Porsche med Bose", "Mercedes med dragkrok".
Backend ILIKE:ar mot `model_raw` (Blockets annonstitel).

- **Enda stället för nya tillval:** `featurePatterns`-mappen i
  `supabase/functions/guided-search/index.ts`.
- **Whitelist + fri-text fallback:** kända nycklar får synonymer OR:ade
  (`skinn` träffar även "läder"); okända ord från AI saneras och körs som
  `%keyword%`-ILIKE. Ingen kodändring behövs för varje tänkbart tillval.
- **Begränsning:** `model_raw` är bara titeln (~50-100 tecken). Täckning
  30-50% av bilar som faktiskt har tillvalet.

### `car_models`-cache

AI-berikning är dyr — varje modell berikas **en gång** och cache:as för
alltid i tabellen `car_models` (~1 400 modeller idag). `enrich-batch` berikar
max 2 nya modeller per batch för att hålla AI-kostnaden låg.

## Var saker bor

| Fil | Ansvar |
|---|---|
| `scripts/import-cars.js` | Hämta från Blocket, filtrera (leasing/privat/utan bild), parse HP+drivetrain |
| `supabase/functions/sync-cars/index.ts` | Upsert i Lovable + delete stale |
| `supabase/functions/enrich-batch/index.ts` | AI-berika car_models + applicera på Lovable (cron) |
| `supabase/functions/enrich-car-data/index.ts` | Admin-variant, även färg via bildanalys |
| `supabase/functions/guided-search/index.ts` | Gemini-chat + filter-query + motiveringar. Håller `featurePatterns`. |
| `supabase/migrations/` | Databasschema (inkrementella SQL-filer) |
| `src/pages/CarDetail.tsx` | Bil-kortet, tolkar sentinels via `drivetrainLabel()` |
| `src/components/GuidedSearch.tsx` | Chat-UI |

## Hur man lägger till vanliga saker

- **Nytt tillval** → en entry i `featurePatterns` + uppdatera listan i
  AI-system-prompten (samma fil).
- **Ny enrichment-kolumn** → SQL-migration i `supabase/migrations/` + lägg
  till i `enrichModel()` i `enrich-batch` + läs i frontend där det ska visas.
- **Ny leasing-heuristik** → uppdatera alla 3 leasing-ställen samtidigt.

## Fallgropar

- Glöm inte **sentinel** när du utökar enrichment-filter → bilar loopar
  i kön för evigt.
- Blocket `sales_form`/`ad_type`-flaggor är opålitliga — text-heuristik i
  `model_raw` behövs för full leasing-detection.
- `model_raw` är Blockets **titel**, inte beskrivning. ~50-100 tecken.
- Edge-functions körs i **Deno**, inte Node. Använd URL-imports
  (`https://deno.land/...`, `https://esm.sh/...`), inte `npm install`.
- Frontend-typer i `src/integrations/supabase/types.ts` är **autogenererade**
  från faktisk DB-schema — ibland avviker de från lokala migrations om
  Lovable gjort ändringar direkt i webb-UI.

## Debug-hjälp

- **Supabase MCP project_id:** `bvqveqoschdpenvbxygj`
- **GitHub-repo:** `infofindcar/smart-bil-sok`
- **TS-parse en edge-function:** `npx tsc --noEmit --skipLibCheck --noResolve <fil>`
- **Admin-UI:** `/admin` (lösenord), för manuell enrichment-trigger.
