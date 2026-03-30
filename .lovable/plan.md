

## Problem

Hero-sektionen på mobil har `min-h-[75vh]` vilket gör att den bara täcker ~75% av skärmen. Användaren ser innehållet under hero redan vid sidladdning — det ska vara en fullskärms hero som tar upp hela viewport.

## Plan

**Fil: `src/pages/Index.tsx`**

Ändra hero-sektionens höjd på mobil från `min-h-[75vh]` till `min-h-[100svh]` (small viewport height, hanterar mobila adressfält korrekt) så att hero täcker hela skärmen.

- Rad 129: Ändra `min-h-[75vh] md:min-h-screen` → `min-h-[100svh] md:min-h-screen`

Det är en enradsändring. `svh` (small viewport height) är den korrekta enheten för mobil — den tar hänsyn till att mobilens adressfält kan vara synligt, så hero fyller exakt den synliga ytan.

