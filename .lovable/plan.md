## Plan

Jag ändrar så att matchningarna beter sig exakt så här:

- Backar man tillbaka från en bilsida ska samma matchningar fortfarande visas.
- Matchningarna ska inte rensas bara för att startsidan mountas igen.
- Matchningarna ska bara rensas/ersättas när användaren faktiskt startar en ny sökning.
- När nya resultat kommer in visas “Bästa matchningar” igen med de nya bilarna.

## Teknisk ändring

I `src/pages/Index.tsx`:

1. Ta bort den nuvarande `useEffect` som rensar `findcar-search-state` vid sidladdning/mount.
2. Återställ `cars`, `carReasons`, `savedCars`, `resultMessage` och `showResults` från `sessionStorage` när sidan öppnas igen.
3. I `handleResults`, när det är en ny sökning (`append` inte är true), ersätt gamla resultat med nya och uppdatera sparad state.
4. Rensa `findcar-results-revealed` vid ny sökning så animationen kan spelas om för de nya matchningarna.

## Resultat

- Back från bil: matchningarna finns kvar.
- Ny sökning: gamla matchningar försvinner och nya visas.
- “Visa fler bilar”: fortsätter lägga till fler bilar utan att rensa allt.