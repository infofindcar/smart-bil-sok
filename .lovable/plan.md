

# Samlad Mobil Makeover — Alla Kvarvarande Förbättringar

## 1. Logo i mobil hero (Index.tsx)
Lägg till `findcarLogoHero`-bilden centrerad ovanför `<h1>` i mobilens hero-block (rad ~144). Storlek ~h-16, med drop-shadow för läsbarhet mot bakgrundsbilden.

## 2. Header mobilmeny CTA-text (Header.tsx)
Rad 132: Ändra "Matcha mig med en bil" → "Hitta din bil" för konsekvent CTA-text.

## 3. GuidedSearch mobiloptimering (GuidedSearch.tsx)
- **Chat-yta**: Öka `max-h` på mobil från `55vh` till `60vh` och sätt `min-h-[220px]` för bättre utrymme (rad 376)
- **Input-area**: Gör inputfältet sticky-liknande med starkare border-top och lite mer padding på mobil
- **Suggestion-knappar**: Redan full-width på mobil — inga ändringar behövs

## 4. WhyFindCar kompaktare padding (WhyFindCar.tsx)
- Minska sektionens mobil-padding: `py-8` istället för `py-12` (rad 37)
- Minska mb på header: `mb-8 md:mb-16` istället för `mb-12 md:mb-16` (rad 40)
- Minska kort-padding: `p-5 md:p-8` istället för `p-6 md:p-8` (rad 50)

## 5. Spacing-fix: CtaBanner ↔ FAQ (CtaBanner.tsx + Index.tsx)
- CtaBanner: Minska mobil-padding `py-6 md:py-24` (från `py-8`)
- SectionDividers mellan FAQ och CtaBanner: Ta bort den sista `SectionDivider` före CtaBanner på mobil genom att lägga till `hidden md:block` på den divider-diven (rad 273)

## Filer som ändras
- `src/pages/Index.tsx` — hero-logo + divider-fix
- `src/components/Header.tsx` — CTA-text
- `src/components/GuidedSearch.tsx` — chat-yta storlek
- `src/components/WhyFindCar.tsx` — kompaktare padding
- `src/components/CtaBanner.tsx` — mindre padding

