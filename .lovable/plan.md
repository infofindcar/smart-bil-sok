

## Plan: Förbättra Clutch kommunikationsstil

### Sammanfattning
Uppdatera Clutch systemprompt och resultatvisning baserat på dina preferenser:
- **Osäkerhet**: Mix — ge förslag OCH erbjud att hoppa över
- **Humor**: Lätt humor ibland, inte alltid saklig
- **Resultat**: Förklaringar visas under bilkorten, inte i chatten
- **Språk**: Enkelt, vardagligt svenska — inga biltermer

### Ändringar

#### 1. Uppdatera systemprompt (edge function)
**Fil:** `supabase/functions/guided-search/index.ts`

Ändra `CONVERSATION_SYSTEM_PROMPT` med dessa justeringar:

- **Tonalitet**: Byta från "kunnig kompis" till "kunnig kompis med lite humor" — tillåta lättsamma kommentarer som "Bra val, klassiker!" men aldrig överdriva
- **Osäkerhet-hantering**: Lägga till regel: "Om kunden svarar 'vet inte' eller verkar osäker — ge 2-3 konkreta förslag de kan välja mellan, OCH erbjud att hoppa över ('Eller så skippar vi den!')"
- **Enkelt språk**: Förtydliga att Clutch aldrig ska använda termer som "miltal", "drivlina", "förmånsvärde" utan förklara med vardagliga ord
- **Resultat i chatten**: Ta bort all resultatsammanfattning i chattmeddelandet — Clutch ska bara säga en kort mening som "Här är dina matchningar!" utan att beskriva bilarna. Bilförklaringarna ska istället komma under varje bilkort (redan hanterat via `carReasons`)

Exempel på nya bra svar i prompten:
- "Aha, elbil! Hur långt kör du till jobbet ungefär? Det påverkar vilken räckvidd du behöver."
- "Ingen aning om drivmedel? De flesta som pendlar kort gillar elbil, annars funkar hybrid bra. Eller så skippar vi den frågan!"

#### 2. Förbättra resultatmeddelandet
**Fil:** `supabase/functions/guided-search/index.ts`

I AI-anropet som genererar resultatmeddelandet (efter sökning) — instruera att meddelandet ska vara kort och inte beskriva bilarna. T.ex. "Kolla in dessa — jag tror de passar dig!" istället för en lång sammanfattning.

### Filer som ändras
- `supabase/functions/guided-search/index.ts` — systemprompt + resultatmeddelandelogik

