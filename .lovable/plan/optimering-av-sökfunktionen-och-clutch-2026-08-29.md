# Optimering av sökfunktionen och Clutch

Tre valda förbättringar. Ingen övrig funktionalitet eller design ändras.

## 1. Bättre ranking av träffar

Idag sorteras kandidaterna i praktiken på ett fält (pris eller miltal) och de tre visade bilarna plockas därefter. Istället poängsätts varje kandidat på flera signaler:

- Pris i förhållande till kundens budget (mitten av intervallet belönas, ytterkanterna straffas)
- Miltal per år jämfört med normalt (~1 500 mil/år)
- Årsmodell (nyare ger något högre poäng)
- Hur väl bilen matchar användningsområdet (t.ex. pendling → låg förbrukning/el-hybrid, familj → utrymme/karosstyp)
- Fullständig data (bilar med bild, hästkrafter och drivlina rankas före tomma annonser)

De tre bilarna med högst poäng visas. Nuvarande regler behålls: hård modellmatchning, diversifiering vid breda sökningar och Hidden Gem-läget.

## 2. Clutch förklarar när ett krav släpptes

När sökningen inte ger träffar relaxas filter stegvis idag, men kunden får ingen förklaring. Nu loggas exakt vilket steg som användes och det förklaras i resultattexten, t.ex.:

- "Jag höjde budgeten lite för att hitta bilar som passar."
- "Jag släppte kravet på automat — annars fanns inga träffar."
- "Jag sökte i hela landet istället för bara Stockholm."

Modellfiltret relaxas aldrig, så det nämns inte där.

## 3. Sammanfattningskort innan sökning

Innan Clutch söker visas ett kort i chatten med de tolkade filtren, t.ex. "Budget 100–150 000 kr · Kombi · Automat · Stockholm". Kunden kan:

- Trycka "Sök nu" för att köra sökningen
- Trycka på ett fält för att ta bort/ändra det (går tillbaka till Clutch med en följdfråga)

Det ersätter den nuvarande fria bekräftelsefrågan, så antalet steg ökar inte.

## Teknisk sammanfattning

- `supabase/functions/guided-search/index.ts`: ny poängsättningsfunktion för ranking, `relaxations`-array i svaret, samt att sökbeslutet returnerar filtren för bekräftelse.
- `src/components/GuidedSearch.tsx`: nytt sammanfattningskort med "Sök nu" och klickbara filterchips.
- `src/pages/Index.tsx`: visar relaxeringsförklaringen ovanför resultaten.

Efter ändringarna testar jag flera riktiga sökningar (specifik modell, bred sökning, sökning utan träffar) mot den deployade funktionen.
