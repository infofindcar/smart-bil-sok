# Motorruta på bilsidan: "2.0 l I4", "3.9 l V8"

Visa motorstorlek och cylinderuppsättning på bilsidan (och som liten etikett på bilkortet), t.ex. "2.0 l I4", "3.9 l V8", "1.5 l I3 hybrid" eller "El" för elbilar.

## Vad vi har idag

Kontrollerat mot databasen (74 484 aktiva annonser):

- Motorvolym som riktigt värde: 26 077 bilar (35 %).
- Volym utläsbar ur annonstiteln ("2.0", "1,6"): 24 355 bilar.
- Tillsammans: 42 580 bilar (57 %).
- Cylinderuppsättning (V6, V8, I4 …) lagras inte någonstans och syns i titeln på bara 2 750 bilar (4 %).

## Lösning i två steg

### Steg 1 — visa det vi redan vet (direkt effekt, 57 %)

- Ny hjälpfunktion `src/lib/engineLabel.ts` med `engineLabel({ engine_volume_cc, model_raw, fuel_type })`:
  - Volym: `engine_volume_cc > 0` avrundas till en decimal (1998 → "2.0"); annars matchas `\b\d[.,]\d\b` i `model_raw` med rimlighetsspann 0.6–8.0.
  - Cylindrar: matchar `\b(V6|V8|V10|V12|W12|I3|I4|I5|I6|R4|B4|B6)\b` i `model_raw` (R4 normaliseras till I4).
  - Ren elbil utan volym → "El". Hybrid med volym → suffix "hybrid".
  - Returnerar `null` när inget säkert kan sägas.
- `src/pages/CarDetail.tsx`: ny post i `specs`-listan, rubrik "Motor". Följer befintlig `.filter(s => s.value)` så inget kort visas när data saknas.
- `src/components/CarCard.tsx`: samma korta text som liten etikett bland nyckelfakta när den finns.

### Steg 2 — fyll luckorna via modell-cachen (mot ~95 % täckning)

Samma mönster som övriga specifikationer: AI:n svarar en gång per modell och värdet cachas i `car_models`, så kostnaden blir låg.

- SQL-migration: lägg till `typical_engine_volume_l numeric` och `engine_layout text` i `car_models`.
- `supabase/functions/enrich-batch/index.ts` → `enrichModel()`: två nya `askAI`-frågor i den befintliga `Promise.all`-listan:
  - "Reply ONLY a decimal (typical engine displacement in liters for the base variant). EVs: 0."
  - "Reply ONLY one of: I3, I4, I5, I6, V6, V8, V10, V12, W12, B4, B6, EV, UNKNOWN."
  - Värden valideras mot en whitelist; ogiltiga svar sparas som sentinel (`0` respektive `'Okänd'`) så bilar inte loopar i berikningskön.
- Visningslagret använder ordningen: annonsens egen volym → titeln → modell-cachen. Cylinderuppsättningen kommer från titeln när den finns, annars modell-cachen, och märks då som typvärde för modellen (visas t.ex. som "2.0 l I4" utan att påstå exakt variant).

Ingen påverkan på sök, priser eller leasingfilter.

## Vad du ser

Direkt efter steg 1: en "Motor"-rad på drygt hälften av bilarna. När berikningsjobbet har betat av modellerna (några dygn med nuvarande takt) syns motorn på nästan alla bilar.
