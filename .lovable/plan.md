# Motorruta på bilsidan: "2.0 l I4", "3.9 l V8"

Visa en liten motorspecifikation på bilsidan (och som liten etikett på bilkortet) som talar om motorstorlek och cylinderuppsättning, t.ex. "2.0 l I4", "3.9 l V8", "1.5 l I3 hybrid" eller "El" för elbilar.

## Vad vi faktiskt har i datan idag

Kontrollerat mot databasen (74 484 aktiva annonser):

- Motorvolym finns som riktigt värde på 26 077 bilar (35 %).
- Annonstiteln innehåller en volym som "2.0" / "1,6" på 24 355 bilar.
- Slår man ihop de två källorna får vi motorvolym för 42 580 bilar (57 %).
- Cylinderuppsättning (V6, V8, I4 …) finns inte lagrad någonstans; den syns i titeln på bara 2 750 bilar (4 %).

Slutsats: volymen kan vi visa på drygt hälften av bilarna. "V8"/"I4"-delen kan vi bara visa när den står i annonstiteln — annars visar vi bara volymen. Ingen gissning, inget påhittat.

## Så här visas det

- Bilsidan: ett nytt kort i specifikationslistan med rubrik "Motor" och värde t.ex. "2.0 l I4", "3.9 l V8", "2.0 l" (när cylindrar saknas) eller "El" för rena elbilar.
- Bilkortet i sökresultatet: samma korta text som liten etikett vid hästkrafter, om den finns.
- Saknas underlag visas inget kort alls (samma regel som övriga specifikationer idag).

## Teknisk plan

1. Ny hjälpfunktion `src/lib/engineLabel.ts`:
   - `engineLabel({ engine_volume_cc, model_raw, fuel_type, horsepower })`.
   - Volym: `engine_volume_cc > 0` → avrunda till en decimal (1998 → "2.0"); annars matcha `\b\d[.,]\d\b` i `model_raw` (rimlighetsspann 0.6–8.0).
   - Cylindrar: matcha `\b(V6|V8|V10|V12|W12|I3|I4|I5|I6|R4|B4|B6)\b` i `model_raw`, normalisera R4→I4, B4→B4 (boxer behålls).
   - Elbil (`fuel_type` = El) utan volym → "El". Hybrid med volym → suffix "hybrid".
   - Returnerar `null` när inget säkert kan sägas.
2. `src/pages/CarDetail.tsx`: lägg till en post i `specs`-listan (ikon `Cog`/`Settings2`) som använder funktionen; följer befintlig `.filter(s => s.value)`-logik.
3. `src/components/CarCard.tsx`: visa etiketten i den befintliga rad med nyckelfakta när värdet finns.

Inga databasändringar, inga AI-anrop och ingen påverkan på sök eller enrichment.

## Möjlig senare utökning

Vill vi täcka de återstående 43 % kan motorvolym och cylinderantal läggas till som fält i modell-cachen (`car_models`) och berikas en gång per modell — större jobb, tas separat om du vill.
