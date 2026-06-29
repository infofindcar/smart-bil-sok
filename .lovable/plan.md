# Plan: små finlir — Clutch-chatten & resultatsidan

Fokus: bara små UX/copy/polish-fixar. Inga ombyggen, inga nya flöden.

## Clutch-chatten (`GuidedSearch.tsx`)

1. **Tydligare budgetbekräftelse i bubblan**
   - När Clutch fångat en budget, visa den som en liten chip ("Budget: 100–150k") överst i chatten så användaren ser att den uppfattats rätt. Just nu försvinner den i texten.

2. **Snabbsvar-chips håller bredd bättre på mobil**
   - Nuvarande suggestion-knappar wrap:ar lite hackigt på 390px. Liten justering: `flex-wrap` + jämnare padding + max 2 per rad, så det känns mer "produkt" och mindre "AI-demo".

3. **"Skriv om"-knapp får tooltip + ikon-only på mobil**
   - Spar plats i input-raden, gör mic + send-knappen mer prominenta.

4. **Auto-scroll till nyaste meddelande**
   - Säkerställ att chatten alltid scrollar ned när Clutch svarar (verkar ibland stanna vid förra bubblan på mobil).

5. **Mikro-copy**
   - Greetingen kortas: "Hej! Jag är Clutch. Berätta vad du letar efter — så fixar jag resten." (mindre AI-tonalitet, mer Anyfin-stil).
   - Loading-text under sökning: rotera mellan 2–3 fraser ("Tittar igenom 60 000 annonser…", "Filtrerar bort skräp…", "Sätter ihop dina topp 3…") istället för en statisk.

## Resultatsidan & bilkorten (`ResultsReveal.tsx`, `CarCard.tsx`)

6. **Snabbare reveal-sekvens**
   - Just nu: 1400ms innan första kortet + 500ms per kort = nästan 3s innan användaren ser något. Förslag: 600ms + 200ms per kort. Behåller pop-effekten men halverar känsla av väntan.

7. **"Clutch tycker"-rutan får liten polish**
   - Stramare padding, ikonen vänsterjusterad mot texten istället för ovanför. Idag känns den lite tung och tar nästan halva kortet.

8. **Pris-badge på bild blir tydligare hierarki**
   - Större font på priset (`text-base font-bold` istället för `text-sm`), så det är första man ser. Idag konkurrerar den med titeln nedanför.

9. **"Visa fler dealers"-knappen blir mindre framträdande**
   - Nuvarande border-top + full bredd gör den till en CTA. Det är en sekundär funktion. Förslag: liten textlänk längst ned, mindre visuell vikt.

10. **Sparat-hjärtat får micro-feedback**
    - Liten "pop" + toast ("Sparad — jämför från menyn") första gången användaren sparar en bil. Idag är handlingen helt tyst.

11. **Tomt-state om append ger 0 nya bilar**
    - Idag visas en toast. Lägg även en liten inline-rad under sista kortet: "Det här var alla bilar som matchar — justera filtren för fler."

## Vad jag INTE rör

- Sökmotorns logik (prisrespekt fixas separat när det blir aktuellt).
- Hero/landningssidan.
- Lead-flödet, bildetaljsidan, jämförelsesidan.
- Färger, typografi, layoutsystem.

## Teknisk omfattning

Filer som rörs:
- `src/components/GuidedSearch.tsx` (punkt 1–5)
- `src/components/ResultsReveal.tsx` (punkt 6, 11)
- `src/components/CarCard.tsx` (punkt 7, 8, 9, 10)

Ingen DB, inga edge functions, inga nya beroenden.
