

## Snyggare overgaang, smartare Clutch och personliga bilbeskrivningar

### Oversikt
Tre huvudomraden forbattras: (1) Overgaangen fraan chatten till bilresultaten goers mjuk och premium, (2) Clutch staller fragor om fler viktiga saker som drivlina, faerg, vaexellaada och driftskostnad, (3) Varje bil visas med en personlig kort beskrivning av varfoer just den passar kunden, och (4) Inga resultat hanteras korrekt -- Clutch ger konkreta foerslag istallet foer att visa tomma kort.

---

### 1. Snyggare overgaang fraan soek till resultat

Just nu dyker bilkorten upp i en helt separat sektion med en haerd grafisk avskiljare (`SectionDivider`). Det kaenns plotsligt och opremium.

**Aendring i `src/pages/Index.tsx`:**
- Ta bort `SectionDivider` runt resultatsektionen
- Lagg till en mjuk fade-in + slide-up animation paa hela resultatblocket
- Lagg till en liten rubrik ovanfoer bilkorten som "Dina matchningar" med en subtil linje under
- Anvand en gradient-overgaang fraan bakgrundsfaergen istallet foer en haerd sektion
- Animera varje bilkort individuellt med en staggered delay saa de glider in ett efter ett

**Aendring i `src/index.css`:**
- Lagg till en `stagger-fade-in` animation foer bilkorten
- Lagg till en `results-enter` animation foer hela resultatblocket

---

### 2. Clutch staller fler och smartare fragor

Just nu fraagar Clutch om: anvaendning, budget, plats, koerstraecka, drivlina, karosstyp och specifika oenskemaal. Men den fraagar INTE om:
- Faergpreferens
- Vaexellaada (automat vs manuell -- finns inte som kolumn i databasen men kan naamnas i konversationen)
- Laag driftkostnad vs prestanda
- Aarsmodell-preferens

**Aendring i `supabase/functions/guided-search/index.ts` (systemprompt):**
- Lagg till dessa punkter i "INFORMATION DU BEHOEVER SAMLA":
  - Faerg (har kunden preferens? Data finns i `color`-kolumnen)
  - Driftskostnad (vill kunden ha laaga kostnader? Det paverkar drivlina-valet)
  - Aarsmodell (nyare eller aeldre? Paverkar pris och utrustning)
- Uppdatera de intelligenta reglerna:
  - Om kunden saeger "laag driftskostnad" -> foerstaa att el/hybrid och laagt miltal aer viktigt
  - Om kunden naemner en faerg -> filtrera paa den
- Lagg till `color` och `yearMin`/`yearMax` i filter-formatet
- Uppdatera databasfragan foer att filtrera paa faerg (`color ilike %faerg%`) och aar (`year >= yearMin`, `year <= yearMax`)
- Oeka minsta antal informationspunkter fraan 4 till 5 innan soekning goers

---

### 3. Personlig beskrivning under varje bil

Istallet foer att bara visa bilens data ska varje bilkort ha en kort AI-genererad mening om varfoer just den bilen passar kunden.

**Aendring i `supabase/functions/guided-search/index.ts`:**
- Uppdatera AI-prompten foer resultatmeddelandet saa att den ocksaa genererar en kort motivering per bil (1 mening)
- Returnera en `carReasons`-array med `{ carId, reason }` tillsammans med bildata
- Formatet blir: `{ action: "search", message: "...", cars: [...], carReasons: [{ carId: 123, reason: "Perfekt foer din pendling med laag foerbrukning" }] }`

**Aendring i `src/components/GuidedSearch.tsx`:**
- Uppdatera `onResults` callback foer att ocksaa skicka med `carReasons`

**Aendring i `src/pages/Index.tsx`:**
- Lagg till state foer `carReasons`
- Skicka raeatt reason till varje `CarCard`

**Aendring i `src/components/CarCard.tsx`:**
- Lagg till en ny prop `matchReason?: string`
- Visa den som en liten text under bilinfon, t.ex. i en mjuk bakgrund med en liten ikon
- Styling: italic, muted-foreground, liten text -- kaenns som en personlig kommentar fraan Clutch

---

### 4. Inga bilar hittades -- smart hantering

Just nu visar Clutch bara "inga bilar hittades" som ett chatmeddelande. Det aer bra, men:

**Aendring i `supabase/functions/guided-search/index.ts`:**
- Naer 0 bilar hittas, generera ett AI-meddelande som:
  - Foerklarar varfoer (t.ex. "Det finns faa elbilar under 100 000 kr just nu")
  - Ger 2-3 konkreta foerslag paa hur kunden kan aendra sin soekning (t.ex. "Oeka budgeten till 150 000" eller "Provea hybrid istallet foer ren el")
  - Returnerar `suggestions` med klickbara alternativ
- Svarets format: `{ action: "search", message: "Tyvaerr hittade jag inga bilar som matchar...", cars: [], suggestions: ["Oeka budget till 200 000", "Prova hybrid istallet", "Soek i hela Sverige"] }`

**Aendring i `src/components/GuidedSearch.tsx`:**
- Naer `data.cars.length === 0`, visa meddelandet med suggestions (som vanliga quick-reply knappar)
- Klick paa en suggestion skickar den som ett nytt meddelande till Clutch som daa goer en ny soekning

---

### Tekniska detaljer

**`supabase/functions/guided-search/index.ts`:**
- Utokad systemprompt med faerg, driftskostnad, aarsmodell
- Nya filter-faelt: `color`, `yearMin`, `yearMax`
- Ny databasfraaga: `query.ilike("color", "%faerg%")` och `query.gte("year", yearMin).lte("year", yearMax)`
- Ny AI-prompt foer per-bil motiveringar som returnerar en JSON-array
- Foerbaettrad "inga resultat"-hantering med suggestions

**`src/components/GuidedSearch.tsx`:**
- Uppdatera `Car`-typen (eller en ny typ) foer att inkludera `matchReason`
- Uppdatera `onResults` signatur: `onResults(cars, message, carReasons)`
- Hantera `suggestions` aeven vid tomma resultat

**`src/pages/Index.tsx`:**
- Ny state: `carReasons`
- Uppdaterad `handleResults` foer att ta emot `carReasons`
- Skicka `matchReason` till varje `CarCard`
- Mjukare resultatsektion med animation och gradient istallet foer haerd divider

**`src/components/CarCard.tsx`:**
- Ny prop: `matchReason?: string`
- Renderar en liten sektion under badges med personlig motivering
- Styling: `text-xs italic text-muted-foreground mt-2 pt-2 border-t border-border/30`

**`src/index.css`:**
- Ny animation `stagger-fade-in` foer bilkort
- Ny animation `results-section-enter` foer hela blocket

