

## Lagg till "Liknande bilar" sektion under perfekta matchningar

### Oversikt

Nar Clutch hittar bilar at anvandaren visas forst 3 perfekta matchningar (som idag). Under dessa laggs en ny sektion med rubriken "Detta ar liknande bilar som du kanske ar intresserad av" som visar upp till 6 extra bilar i en horisontell scrollbar layout.

### Andringar

#### 1. Edge Function: Hamta 9 bilar istallet for 3 (`supabase/functions/guided-search/index.ts`)

- Andra `.limit(3)` till `.limit(9)` i databasfragan (rad 381)
- De forsta 3 bilarna blir "perfekta matchningar", de resterande 6 blir "liknande bilar"
- Inga andra filter-andringar behovs -- de extra bilarna kommer fran samma sok med samma kriterier

#### 2. Uppdatera dataflode i frontend

**`src/components/GuidedSearch.tsx`** (typer och onResults):
- Ingen andring i Car/CarReason-typer
- Data passas vidare som vanligt -- alla 9 bilar skickas till `onResults`

**`src/pages/Index.tsx`**:
- Dela upp `cars`-arrayen i tva delar: `topCars` (forsta 3) och `similarCars` (resterande, max 6)
- Skicka bada till `ResultsReveal` som separata props

#### 3. Ny "Liknande bilar" sektion i `src/components/ResultsReveal.tsx`

Under det befintliga 3-kolumns gridet laggs en ny sektion till:

- **Rubrik**: "Detta ar liknande bilar som du kanske ar intresserad av" med en subtil ikon
- **Layout**: Horisontellt scrollbart omrade med bilkort i fast bredd (ca 280px)
- Korten anvander samma `CarCard`-komponent
- Sektionen visas med en fade-in animation efter att de 3 perfekta matchningarna har avslojats
- Doljs helt om inga extra bilar finns

**Scrollbar-design**:
- Anvander CSS `overflow-x-auto` med `flex-nowrap`
- Snygg tunn scrollbar som matchar befintlig chat-scrollbar-stil
- Pa mobil: naturlig swipe-scroll

#### 4. CSS-andringar (`src/index.css`)

- Lagg till en tunn horisontell scrollbar-stil for liknande-bilar-sektionen (liknande `.chat-scrollbar` men horisontell)

### Visuell struktur

```text
+------------------------------------------+
|   3 perfekta matchningar (grid)          |
|   [Bil 1]  [Bil 2]  [Bil 3]             |
+------------------------------------------+
|                                          |
|   "Liknande bilar du kanske gillar"      |
|   [Bil 4] [Bil 5] [Bil 6] [Bil 7] -->   |
|          (horisontell scroll)            |
+------------------------------------------+
|   [Visa fler bilar]                      |
+------------------------------------------+
```

### Tekniska detaljer

- `ResultsReveal` far en ny prop `similarCars: Car[]`
- I `Index.tsx` delas arrayen: `const topCars = cars.slice(0, 3)` och `const similarCars = cars.slice(3, 9)`
- Liknande-bilar-korten far en nagot mindre storlek (`w-[270px]` eller liknande) for att antyda att man kan scrolla
- AI:ns motiveringar (carReasons) fungerar for alla 9 bilar automatiskt eftersom edge function redan genererar motiveringar for alla returnerade bilar

