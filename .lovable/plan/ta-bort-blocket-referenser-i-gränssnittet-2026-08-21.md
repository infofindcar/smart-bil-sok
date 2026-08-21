# Ta bort Blocket-referenser i gränssnittet

Vi vill inte associeras med Blocket. Två ställen i användargränssnittet nämner dem idag.

## Ändringar

1. **Annonsanalysen** ("Hittat en annons någon annanstans?")
   - Platshållaren i länkfältet ändras från `https://www.blocket.se/...` till en neutral text: `Klistra in länk till annonsen`.

2. **Omdöme i Testimonials**
   - Citatet som nämner Blocket skrivs om neutralt, t.ex.: "Har letat bil i typ en månad utan att komma vidare. Här fick jag bra alternativ direkt, och slapp scrolla igenom hundratals annonser."

## Teknisk detalj

- `src/components/ListingAnalyzer.tsx` rad 205: byt `placeholder`.
- `src/components/Testimonials.tsx` rad 10: byt citattext.
- Ingen backend-logik ändras; analysen fungerar likadant för alla länkar.
