# Motorruta på bilsidan: "2.0 l I4", "3.9 l V8"

Visa motorstorlek (och cylinderuppsättning när den är känd) på bilsidan och som liten etikett på bilkortet. Grundregel: **bara data som kommer från den specifika annonsen** — aldrig ett typvärde för modellen.

## Varför ingen AI-gissning per modell

Nästan identiska bilar skiljer sig ofta just i motorn (t.ex. 1.5 mot 2.0, V6 mot V8 i samma modell). Ett värde som gäller "modellen i snitt" skulle därför bli fel på precis de bilar där uppgiften spelar mest roll. Vi låter alltså inte AI:n fylla i motorstorlek per modell, och vi visar hellre inget än något osäkert.

## Datakällor vi litar på (kontrollerat mot databasen, 74 484 aktiva annonser)

1. `engine_volume_cc` på annonsen — annonsens eget värde. Riktigt värde på 26 077 bilar (35 %).
2. Volymen i annonstiteln (`model_raw`), t.ex. "320d 2.0" — finns på 24 355 bilar.
3. Cylinderuppsättning i annonstiteln (V6, V8, I4 …) — bara 2 750 bilar (4 %).

Tillsammans ger källa 1 + 2 en motorvolym för 42 580 bilar (57 %). Övriga bilar får ingen motorrad alls.

Krock mellan källorna hanteras strikt: om annonsens `engine_volume_cc` och titelns volym skiljer sig mer än 0,15 liter visar vi ingenting, eftersom vi då inte kan avgöra vilken som stämmer.

## Så här visas det

- Bilsidan: nytt kort i specifikationslistan, rubrik "Motor", värde t.ex. "2.0 l I4", "3.9 l V8", "2.0 l" (när cylindrar inte är kända) eller "El" för rena elbilar.
- Bara på bilsidan — inget i sökresultatets bilkort.
- Saknas underlag visas inget — samma princip som övriga specifikationer idag.

## Teknisk plan

1. Ny fil `src/lib/engineLabel.ts` med `engineLabel({ engine_volume_cc, model_raw, fuel_type })`:
   - Volym från `engine_volume_cc > 0`, avrundad till en decimal (1998 → "2.0"). Godtas bara inom 600–8 500 cc.
   - Volym från titeln via `\b\d[.,]\d\b`, godtas bara inom 0,6–8,0 l och bara när talet inte är ett hästkrafts-/versionstal (kontroll att det inte följs av "T", "TDI"-siffror eller står direkt efter "0-100" o.dyl.).
   - Finns båda: används bara om de stämmer inom 0,15 l, annars `null`.
   - Cylindrar: matchar `\b(V6|V8|V10|V12|W12|I3|I4|I5|I6|R4|B4|B6)\b` i titeln (R4 → I4). Ingen gissning från volym eller modell.
   - Ren elbil utan volym → "El". Laddhybrid/hybrid med volym → suffix "hybrid".
   - Returnerar `null` när något är osäkert.
2. `src/pages/CarDetail.tsx`: en post i `specs`-listan med rubrik "Motor"; befintlig `.filter(s => s.value)` gör att kortet försvinner när värdet är `null`.
3. `src/components/CarCard.tsx`: samma text som etikett i nyckelfakta-raden när värdet finns.

Inga databasändringar, inga AI-anrop, ingen påverkan på sök, priser eller leasingfilter.

## Kontroll innan vi är klara

Jag stickprovar ett urval annonser (bl.a. modeller som finns i flera motoralternativ) och jämför det som visas mot annonstiteln, så att ingen bil får en motor den inte har.
