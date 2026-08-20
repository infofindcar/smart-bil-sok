# Hälsokontroll: kostnader, fel och kapacitet

## Svar på kapacitetsfrågan

Databasen kör på en liten instans: **60 max-anslutningar**, ~224 MB buffertminne. Mätt just nu ligger en typisk sökning på 0,4–0,6 s och bara 1 aktiv databasfråga.

Realistisk uppskattning i dagens läge:
- **Vanlig trafik (personer som läser/klickar):** tusentals per dag utan problem — frontend är statisk och cachead.
- **Samtidiga Clutch-sökningar:** ca **15–25 samtidigt** går bra. Över det blir det köbildning i databasen, eftersom varje AI-svar håller en anslutning i 2–8 s.
- **Verklig flaskhals:** inte AI:n utan databasens CPU/minne plus de bakgrundsjobb som fortfarande belastar den (se nedan).

Krediter är inte problemet: en hel sökkonversation kostar ca **0,01–0,02 krediter**. 2000 krediter räcker till i storleksordningen **100 000+ sökningar**. Total förbrukning i perioden är 29 krediter.

## Problem jag hittade

1. **Ett cronjobb svarar 401 (Unauthorized) var 15:e minut** — anropet med fel/utgången `x-sync-secret` körs dygnet runt utan att göra något nytto.
2. **`detect-colors` kör var 15:e minut fast det inte finns något kvar att göra** (`remaining=0`) och gör AI-anrop som misslyckas med **HTTP 400 "Cannot fetch content from the provided URL"** — Vertex kan inte hämta Blockets bild-URL:er. Rena slösade anrop + felloggar.
3. **Berikningen är i praktiken klar** (0 rader saknar färg/motorvolym; 254 saknar hk, 491 saknar drivlina), men jobben pollar ändå. Historiskt har dessa jobb kostat databasen enormt: en enda berikningsfråga har körts 199 000 gånger med 361 ms snitt = **ca 20 timmars ren databastid**, och 865 000 färg-uppdateringar.
4. **Tillvals-/dragkrokssökningar går utan index.** `model_raw ILIKE '%...%'` ger seq scan, mätt **368 ms** per fråga (och mer när flera tillval OR:as). Samma sak för sökning på bilfirma.
5. **Två cronjobb loggar aldrig något svar** (nil status) — anropen hinner inte tillbaka, dvs. de kan hänga och hålla `pg_net`-resurser.
6. **`detect-colors` och `enrich-from-blocket` finns bara som deployade funktioner, inte i kodbasen** — de kan inte underhållas eller granskas härifrån.

## Åtgärdsplan

**Steg 1 — Stäng av spill (störst effekt, minst risk)**
- Avaktivera cronjobbet som ger 401.
- Avaktivera/nedgradera `detect-colors` till t.ex. en gång per dygn, eller stäng av helt eftersom `remaining=0`.
- Sänk `enrich-batch` och `enrich-from-blocket` till en gång per timme (eller nattetid), så de inte konkurrerar med besökarnas sökningar.

**Steg 2 — Snabbare tillvals- och firmasökning**
- Lägg till trigram-index (GIN) på `model_raw` och på `dealer_name` för aktiva annonser, så ILIKE-sökningar går från ~370 ms till millisekunder.
- Verifiera med `EXPLAIN ANALYZE` efteråt att indexen används.

**Steg 3 — Robusthet vid många samtidiga användare**
- Se till att `guided-search` alltid har en tidsgräns mot AI:n och returnerar bilar även om motiveringarna dröjer (delvis gjort — verifieras).
- Lägg till enkel skydds-/köhantering i frontend: knappen låses medan sökning pågår och ett tydligt meddelande visas om det tar mer än ~10 s.

**Steg 4 — Uppföljning**
- Kör om `slow_queries` efter steg 1–2 för att bekräfta att databasbelastningen gått ner.

## Tekniska detaljer

- Cron: `cron.job` id 4, 5, 6 kör `*/15 * * * *`; id 7 kör varannan timme. Ett av 4/5/6 ger konsekvent `{"success":false,"error":"Unauthorized"}` i `net._http_response`.
- Index att lägga till: `CREATE INDEX ... USING gin (model_raw gin_trgm_ops) WHERE is_active` och motsvarande för `dealer_name` (`pg_trgm` finns redan installerat).
- AI-modell i `guided-search`/`analyze-listing`: `google/gemini-3-flash-preview` (fungerar, ~0,003 krediter per anrop). Felen kommer från `google/gemini-2.5-flash` med bild-URL i `detect-colors`.
- Instans: `max_connections=60`, `shared_buffers=224 MB`, `statement_timeout=120 s`. Om trafiken växer kraftigt är uppgradering av Supabase-instansen nästa steg, inte kodändringar.
