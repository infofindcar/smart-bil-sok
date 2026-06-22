# Visuell omdesign av FindCar – uppdaterad

Lyfter sajten från "AI-mall" till seriös premium-känsla i klass med Linear / Mercury / Wise / Framer. All funktionalitet (PasswordGate, Clutch-chat, sök, resultat, leads, enrichment) behålls — endast yta, typografi, färg, rytm och rörelse byts. Admin-sidan lämnas helt orörd.

## Designspråk (låst)

**Palett – Midnight Indigo** (semantiska HSL-tokens i `index.css`)
- Bakgrund: `#0A0A14` · Surface: `#10121F` · Surface elev: `#161A2E`
- Hairline border: indigo @ 18 %
- Primary: `#6366F1` med glow `#818CF8`
- Foreground: `#E8EAF2` · Muted: `#8A8FA8`
- Hairlines = 1 px indigo→transparent gradient (Linear-stil)

**Typografi**
- Display / H1-H2: **Instrument Serif**, tight tracking (-0.02em), kursiv för accentord
- UI / body: **Work Sans** 400/500/600, +0.01em på småtext, uppercase eyebrows
- Tabular nums för pris/specs
- Laddas via `@fontsource/instrument-serif` + `@fontsource/work-sans`, mappas i `tailwind.config.ts`

**Rytm**
- Edge-to-edge bibehållet, inre container `max-w-[1240px]`, 32 px gutter
- 8 px spacing-grid, sektioner 120 px desktop / 72 px mobil
- Radius: 14 px kort, 10 px inputs, 999 px pills
- Subtilt 3 % grain-overlay, lugn aurora-glow på bakgrunden (ingen färgglad gradient-spam)

**Rörelse (Framer/Linear-känsla)**
- Sidladdning: 400 ms fade + 8 px up, staggered
- Hover på kort: 2 px lift, border går från subtil → indigo glow
- Knappar: indigo med inre highlight + 1 px translucent border (Mercury-stil)
- Inga "wow"-animationer som skriker AI

## Sektion-för-sektion

### 1. PasswordGate (behålls)
- Centrerad single column, FindCar-wordmark i serif överst
- Eyebrow "EARLY ACCESS", H1 i Instrument Serif (kursiv på "ny era")
- Inputs mörka med indigo focus-ring, primary CTA indigo med glow
- "Har du redan en kod?" blir en liten länk under, inte ett andra kort

### 2. Index / Hero — **ingen hero-bild, direkt till sök**
- Top: tunn header (wordmark + 2 länkar + ghost-CTA)
- Direkt under: en stor centrerad **sökyta** som är hjälten:
  - Eyebrow: "CLUTCH AI"
  - H1 i Instrument Serif (mix regular + italic): t.ex. *"Beskriv bilen du vill ha."*
  - Underrubrik 1 rad i Work Sans muted
  - Composer (Clutch-prompt) i full premium-stil — large textarea, glödande focus-border, send-knapp som ikon-pill
  - Suggestion-chips under (3-5 st), pill-stil
- Inga split-screen-bilder, ingen mock-bil till höger, ingen extra hero-grafik
- Under hero: lugna sektioner med hairline-dividers — **HowItWorks**, **WhyFindCar**, **Testimonials**, **FAQ**, **CtaBanner** — alla typografiskt omarbetade men funktionellt orörda
- Bakgrund: mörk bas + en mycket subtil aurora-glow bakom hero (inte färgglad)

### 3. Clutch-chat / GuidedSearch
- All logik orörd (svar, chips, scroll-fix, sessionStorage)
- Assistant-meddelanden: **ingen bakgrund**, bara text på surface
- User-bubble: indigo @ 12 % med 1 px indigo border, hög kontrast text
- Composer: rounded-2xl, hairline border som glöder vid focus, send-ikon-pill indigo
- Chips: pill, 1 px border, hover indigo @ 10 %
- "Clutch AI"-badge blir liten serif-wordmark (behåller Sparkles-ikon enligt befintlig regel)

### 4. CarCard / resultat
- Mörk surface, hairline border, bild 16:10
- Titel Instrument Serif medium, pris Work Sans tabular bold
- Specs som tre kompakta pills (år · mil · drivlina)
- Hover: 2 px lift + indigo glow
- Grid 1/2/3 kolumner, 24 px gap

### 5. CarDetail
- Stor bild vänster, sticky spec + lead-CTA panel höger (Mercury-stil)
- Specs som definition list (label muted / value foreground), inte ikon-grid
- Lead-form integreras som sista lugn sektion med hairline-divider
- Behåller all befintlig logik och sentinel-tolkning

### 6. Footer
- Byter cyan-bakgrund mot `#0A0A14` med hairline-topp
- Tre kolumner: brand+tagline / länkar / kontakt+social
- "Framtagen på KTH" som muted med KTH-sigill (oförändrad)

### 7. Globala komponenter
- `Header`: minimal, wordmark + få länkar + ghost-CTA, transparent → solid `#10121F` on scroll
- `CookieBanner`: kompakt kort nederst i hörnet
- `StickyMobileCTA`: pill med blur-bakgrund
- `button.tsx`: två nya varianter — `premium` (indigo + inner highlight + shadow) och `ghost-line` (1 px border)

### 8. Copy-putsning (du sa: får se proffsigt ut)
Putsar rubriker och microcopy till samma premium-ton — kort, tydligt, svenskt, inga utropstecken eller "AI-fraser". Exempel:
- Hero H1: *"Hitta bilen du faktiskt vill ha."*
- Hero sub: "Beskriv vad du letar efter. Clutch hittar bilen — utan annonser, utan brus."
- CTA: "Börja sök" / "Visa bilar"
Exakta texter visas i preview innan jag rör annan copy som du redan godkänt.

## Tekniskt – var ändringarna sker

```text
src/
  index.css                 ← semantiska tokens, font-faces, gradients, shadows, grain
  main.tsx                  ← @fontsource imports
  tailwind.config.ts        ← fontFamily, colors, shadows, animations
  components/
    ui/button.tsx           ← premium + ghost-line varianter
    Header.tsx              ← redesign
    Footer.tsx              ← redesign (mörk, hairline)
    PasswordGate.tsx        ← visuell uppgradering
    GuidedSearch.tsx        ← bubblor, composer, chips (logik orörd)
    CarCard.tsx             ← layout + typografi
    CookieBanner.tsx        ← compact
    StickyMobileCTA.tsx     ← blur pill
    HowItWorks.tsx, WhyFindCar.tsx, Testimonials.tsx, FAQ.tsx, CtaBanner.tsx
                            ← typografi + spacing + hairline-divider
    AuroraBackground.tsx    ← dämpas till lugn indigo-glow
  pages/
    Index.tsx               ← direkt-till-sök hero, sektionsrytm
    CarDetail.tsx           ← sticky spec-panel, hairline-sektioner
```

**Rörs INTE:**
- `src/pages/Admin.tsx`
- Supabase edge-functions / featurePatterns / enrichment
- DB-schema, typer, datakontrakt
- Sökfilter och leasing-heuristik

## Leveransordning

1. Tokens + fonts + tailwind config (grunden)
2. Button-varianter + Header + Footer (globalt skal)
3. Index hero (direkt-till-sök) + GuidedSearch composer/chips/bubblor
4. CarCard + sektioner (HowItWorks, WhyFindCar, Testimonials, FAQ, CtaBanner)
5. CarDetail
6. PasswordGate visuell uppgradering
7. Slutkontroll mobil + desktop, screenshot, microcopy-pass

Klar att köra — godkänn så implementerar jag.