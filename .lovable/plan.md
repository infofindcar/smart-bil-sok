
# Redesign: FindCar hemsida (Anyfin / Wise / Klarna-stil)

Helt ny visuell riktning. Backend, routing, PasswordGate, sök-logik (`guided-search`, `GuidedSearch.tsx`-logik), DB och edge-functions rörs **inte**. Endast frontend-presentation på `/` + globala designtokens.

## Designprinciper (Anyfin/Wise/Klarna)

- **Ljus default-bakgrund** (cream/off-white `#FAF8F3` à la Anyfin), inte mörk AI-look. Dark mode behålls men hemsidan optimeras för ljust läge.
- **Behåll blått** som primärfärg — uppdateras till en lugnare, mer "fintech"-blå (`#1E40FF`-aktig, justeras mot befintlig token).
- **Generös whitespace**, hairline-borders (1px `#E8E4DC`), 16–20px border-radius på kort, 999px på pills.
- **Typografi:** Instrument Serif endast till H1 (1 ord/fras kursiv accent), Work Sans 400/500/600 till allt övrigt. Inga gradienter i text.
- **Inga:** glassmorphism, aurora, mörk futuristisk bg, fake chat-bubblor, oversized hero, tomma marketing-sektioner.

## Färg-/tokens (`src/index.css`)

Uppdatera `:root` (light):
- `--background` cream `#FAF8F3`
- `--foreground` near-black `#0E1116`
- `--muted` `#F1EDE4`, `--muted-foreground` `#5B6470`
- `--border` `#E8E4DC`
- `--primary` blå `#1E40FF`, `--primary-foreground` vit
- `--card` `#FFFFFF`, hairline border istället för shadow
- Ta bort/neutralisera `--gradient-*`, `search-glow`, `premium-page-bg`, aurora-klasser används inte på `/`.

Dark mode behålls men justeras lätt så den matchar den nya paletten.

## Sidstruktur — ny `src/pages/Index.tsx`

Tar bort: AuroraBackground-wrap, ScrollReveal-hero, scroll-hint, `CtaBanner`, `WhyFindCar` (omdesignas till lugn trust-rad), `display-headline`-stil, `text-gradient`.

Ny ordning (allt edge-to-edge men med inner `max-w-6xl`):

1. **Header** (befintlig, lättad)
   - Transparent på cream → solid vid scroll
   - Logo orörd
   - Nav-links + "Hitta din bil"-knapp (primary blå, radius 12, ingen gradient/glow)

2. **Advisor-sektion (första vyn, direkt — ingen hero-bild)**
   - Vänster kolumn (5/12 desktop, stack på mobil):
     - Eyebrow: "Bilrådgivning · gratis"
     - H1 (Instrument Serif, ~48–56px desktop): "Hitta rätt bil *för dig*."
     - Sub (Work Sans 17px, muted): "Jämför bilar utifrån budget, behov, ägandekostnad och risk. Helt gratis, utan provision."
     - Trust-rad: ✓ {N} bilar · ✓ Oberoende · ✓ 0 % provision (befintlig `carCount`-animation behålls)
   - Höger kolumn (7/12): **Advisor-kort** — vitt kort, hairline border, p-8, rounded-2xl:
     - Behåller `GuidedSearch`-komponenten (samma props, samma logik) men renderas inuti ett lugnt vit-kort utan glow/aurora. `search-glow` tas bort runt den.
     - Title i kortet: "Berätta om din vardag" + liten Sparkles-ikon i blått.
     - CTA-knappen inuti `GuidedSearch` ärver ny primary-blå (via tokens — ingen ändring i komponentens logik).
   - Inga gradienter, ingen glow, ingen blur bakom.

3. **"Så fungerar det" – 3-stegs strip** (omdesignad `HowItWorks`)
   - 3 kort i grid, hairline border, små numrerade cirklar (01/02/03) i blått.
   - Kort copy. Inga ikon-illustrationer som ser AI-genererade ut.

4. **Trust-rad / "Varför FindCar"** (omdesignad `WhyFindCar` → enklare)
   - 4 kolumner, hairline-separerade: Oberoende · Gratis · Datadriven · Svensk
   - Liten check-ikon + en mening per kolumn.

5. **FAQ** — befintlig komponent, ny styling: accordion utan skuggor, hairline-divider mellan items, Work Sans.

6. **Footer** — befintlig, lättad: cream bg, hairline top, små länkar, "Framtagen på KTH" som muted micro-copy.

Tas bort från `/`: `ResultsReveal` flyttas inte — fortsätter rendreras under advisor när `showResults`. `CtaBanner` tas bort helt (tom marketing-section).

## Komponentändringar

- `src/index.css` — nya tokens, ta bort `display-headline`-gradient, `search-glow`, `premium-page-bg`-aurora. Lägg till `.hairline`, `.card-surface`, `.eyebrow` (uppercase 11px, tracking 0.18em, muted).
- `src/components/ui/button.tsx` — `default` blir solid blå, ingen translate-hover (bara opacity 0.92). `gradient`-variant pekas om till samma solid blå (alias) så befintliga calls funkar utan logikändring.
- `src/components/Header.tsx` — ta bort gradient-knapp, behåll struktur, logo orörd, knapp blir `variant="default"` med `rounded-xl`.
- `src/components/GuidedSearch.tsx` — **endast** visuell: ta bort ev. egna gradient-/glow-klasser, anpassa till vit-kort kontext. Ingen ändring i state/logik/AI/flow.
- `src/components/HowItWorks.tsx`, `WhyFindCar.tsx`, `FAQ.tsx`, `Footer.tsx` — ompresentation enligt ovan, samma innehåll.
- `src/pages/Index.tsx` — strukturen ovan, `AuroraBackground` importeras inte längre.
- `CookieBanner`, `StickyMobileCTA`, `PasswordGate` — **orörda** (PasswordGate behålls som den är, per tidigare instruktion).

## Mobil

- Advisor-kortet stack:as under text. Padding 20px. H1 36px. Sticky mobile-CTA behålls.
- Inga ändringar i `use-mobile`-flöden.

## Vad som INTE ändras

- Sök-logik, edge-functions, Supabase, routing, PasswordGate, Admin, CarDetail-funktionalitet, lead-flöden, ResultsReveal-logik, analytics.
- Logo (`findcar-logo.png`) — exakt samma fil och rendering i Header.

## Verifiering

1. Kör Playwright mot `localhost:8080`, screenshot mobil (390×844) + desktop (1280×900) av `/` efter PasswordGate.
2. Bekräfta: cream bg, advisor-kort syns first-fold, blå primary CTA, logo orörd, ingen aurora.
3. Verifiera att sökning fortfarande triggar `ResultsReveal`.

## Frågor (svara gärna, annars kör jag default)

1. **Cream-bakgrund** `#FAF8F3` (Anyfin) eller hellre **rent vit** `#FFFFFF` (Wise/Klarna)? Default: cream.
2. **Blå nyans** — behålla nuvarande `--primary` exakt, eller justera till djupare fintech-blå (`#1E40FF`)? Default: justera lätt.
3. **H1-text:** "Hitta rätt bil *för dig*." (din formulering) eller behålla "Hitta din rätta bil."? Default: din nya.
4. **Dark mode** på `/` — behålla som val (toggle kvar) eller tona ner ThemeToggle på hemsidan? Default: behåll toggle.
