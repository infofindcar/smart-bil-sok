# Bättre matchning i Clutch — mindre generellt, mer personligt

Problemet du beskriver har två sidor: Clutch söker ibland med för tunn bild av personen, och när den söker väljs bilarna ur ett för snävt och delvis slumpmässigt urval av lagret. Båda åtgärdas.

## 1. Clutch söker inte förrän den vet nog

- Inför en tydlig checklista som måste vara ifylld innan sökning: användning, budget, kategorifrågan för användningen, drivlina, karosstyp eller familjestorlek, samt hur nytt/lite kört.
- Är något fortfarande luddigt ("vet inte", "spelar ingen roll" på flera frågor i rad) ställer Clutch en till riktad fråga i stället för att söka. Antalet frågor är alltså rörligt: kort samtal när personen är tydlig, längre när den är osäker.
- Säger man själv "sök nu" respekteras det direkt, men Clutch säger då kort att urvalet blir bredare.
- Clutch sammanfattar kort vad den förstått innan den söker, så man kan rätta henne.

## 2. Svaren används faktiskt i sökningen

Idag fastnar en del av det man berättat i samtalet och når aldrig fram till urvalet. Följande blir riktiga sökvillkor:

- Antal platser (5-sits/7-sits) från familjefrågan.
- Miltalstak och åldersprioritet från frågan om nytt/lite kört.
- Pendlingssträcka, som styr drivlina och tillåtet miltal.
- Vad som väger tyngst för personen: pris, skick/miltal, eller närhet.

## 3. Bilarna väljs ur hela lagret, inte en slumpad skiva

- Urvalet hämtas idag som 80 bilar sorterade på en slumpmässigt vald egenskap (pris, år eller miltal). Med tiotusentals annonser innebär det att Clutch ofta bara ser t.ex. de billigaste eller de mest körda bilarna som matchar.
- I stället hämtas flera urval parallellt över olika prisnivåer och sorteringar, slås samman och rensas från dubletter — så kandidaterna speglar bredden i lagret.
- Poängsättningen viktas om: det personen faktiskt sagt (användning, platser, miltal, drivlina, prioritet) väger tyngre, och slumpinslaget dras ned så det bara skiljer mellan likvärdiga bilar i stället för att avgöra vilka som visas.
- Sista steget behåller spridningen mellan märken och modeller så man inte får nio varianter av samma bil.

## 4. Motiveringarna blir konkreta

Texten under varje bil skrivs idag utifrån en mycket kort beskrivning av bilen. Den får mer att gå på — effekt, drivning, växellåda, miltal per år, utrustning ur annonstiteln, prisläge och ort — plus vad personen sagt, så motiveringen kan peka på något som faktiskt gäller just den bilen.

## Teknisk sammanfattning

Allt sker i `supabase/functions/guided-search/index.ts`:

- `CONVERSATION_SYSTEM_PROMPT`: checklista före sökning, adaptiv extrafråga, kort sammanfattning före sökning, samt nya filterfält i JSON-kontraktet (`seatsMin`, `mileageMax`, `commuteKmPerDay`, `priority`).
- Sanering/validering av de nya fälten och koppling in i `buildQuery` (`seats`, `mileage`) på relaxeringsnivå 0–1.
- `buildQuery`: ersätt enkel `limit(80)` med 3 parallella hämtningar (låg/mellan/hög del av prisintervallet, olika sorteringsnycklar), dedupe på id, tak ~180 kandidater. Relaxeringsstegen behålls som idag.
- `score()`: jitter ned från 22 till ~8, use-case-vikter upp, nya poäng för platser, miltal per år mot uppgivet tak och prioritetsval.
- `carSummaries` utökas med `horsepower`, `drivetrain`, `transmission`, `model_raw`-utrustning och miltal per år; systemprompten för motiveringar kräver minst ett konkret faktum per bil.
- Deploy av funktionen och ett verifierande testsamtal (pendlare respektive familj) för att se att urvalet skiljer sig och motiveringarna är specifika.

Ingen ändring i databasen och inget som rör Community eller övriga sidor.
