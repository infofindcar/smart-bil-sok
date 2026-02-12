

## Fix: ta bort den vita linjen langst ner pa hero-bilden

### Orsak
Den vita linjen beror pa en sub-pixel-lucka mellan hero-bildens nedre kant och nasta sektion. Bildens `object-cover` kan lamna en tunn rand av hero-sektionens bakgrund synlig, och den nedre fade-overlayen ar osynlig innan man scrollar (`opacity` borjar pa 0).

### Losning
Tva enkla CSS-fixar i `src/pages/Index.tsx`:

1. **Gora bilden 1px hogre an sin container** -- andra bildens klass fran `h-full` till `h-[calc(100%+2px)]` sa att den overlappar eventuella sub-pixel-luckor
2. **Lagga till `mb-[-1px]`** pa hero-sektionen for att eliminera mellanrummet mot nasta element

### Tekniska detaljer

**Fil: `src/pages/Index.tsx`**

- Pa `<img>`-taggen (rad 107): andra `h-full` till `h-[calc(100%+2px)]` for att oka bilden med 2px och tacka luckan
- Pa hero-`<section>` (rad 100): lagg till `-mb-px` (negativ marginal 1px) for att overlappa med nasta element

