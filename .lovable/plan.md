## Vision

FindCar ska kännas som **Linear möter Mercury**: ett lugnt, ljust, tekniskt verktyg byggt av experter. Inga gimmicks, inga gradients, ingen AI-glöd. Hela startsidan är **en enda sak**: sökrutan, centrerad på en pappersvit yta. Allt annat är borta.

## Designspråk

**Palett (Paper & Ink, ljust)**
- `--background: 40 20% 97%` (#f7f5f1, varm off-white "paper")
- `--foreground: 0 0% 8%` (#141414, near-black)
- `--muted-foreground: 0 0% 42%` (sekundär text)
- `--border: 36 12% 88%` (#e4e1db, hairlines)
- `--card: 0 0% 100%` (rena vita kort)
- `--primary: 0 0% 10%` (svart knapp)
- `--accent: 0 0% 96%` (chip-hover)
- Inga blå, inga indigo, inga gradients. En enda accent: svart.

**Typografi** — `@fontsource/inter-tight` (rubriker, weight 500, tracking -0.03em) + `@fontsource/inter` (body, 400/500, tabular nums på siffror). Inga serifer.

**Form**
- Border radius: 6px på inputs/knappar, 8px på kort. Inget 14px+.
- Borders: alltid 1px hairline i `--border`. Inga skuggor någonstans.
- Spacing: generös. Luft är designen.

**Rörelse**
- Bara 200ms opacity-fade på mount. En 150ms border-color transition på focus. Inget annat.
- Bort: aurora, glow, shimmer, float, pulse, conic-borders, card-pop, scroll-bounce, mic-glow, hero-cta-glow, findcar-shimmer-sweep.

## Sidstruktur — `/` (efter PasswordGate)

```text
┌──────────────────────────────────────────────────┐
│ FindCar                          Om   Kontakt    │  56px, hairline botten
├──────────────────────────────────────────────────┤
│                                                  │
│                                                  │
│                                                  │
│         Din objektiva bilrådgivare.              │  Inter Tight 500, 56px,
│                                                  │  tracking -0.03em, centrerad
│         Beskriv bilen du letar efter             │  Inter 400, 17px, muted
│         så hittar vi den åt dig.                 │
│                                                  │
│   ┌────────────────────────────────────────┐    │
│   │ "Familjebil under 250 000, automat…"   │    │  stor textarea, vit, 1px border,
│   │                                        │    │  fokus = border blir svart
│   │                              Sök  →    │    │
│   └────────────────────────────────────────┘    │
│                                                  │
│   Familjebil ~250k   Sportig under 400k          │  chips, hairline border,
│   Eldrift med dragkrok   SUV automat             │  Inter 14px, hover = fyll svart
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│ © FindCar · Framtagen på KTH        Integritet   │  tunn footer
└──────────────────────────────────────────────────┘
```

Centrerad vertikalt i viewport (min-height calc). Inget under att scrolla till. Inga sektioner. Inga bilar. Inga ikoner. Bara den här ytan.

När man skickar första meddelandet → GuidedSearch expanderar **in place** till conversation-mode (befintlig logik), inga andra UI-ändringar.

## Filer som ändras

1. **`src/index.css`** — riv allt tema-relaterat. Skriv om från scratch: nya HSL-tokens (ljus paper), en `.hairline`, en `.eyebrow`. Behåll bara `chat-scrollbar`, `bubble-in`, reduced-motion. Bort: aurora-*, search-glow, clutch-shell + ::before, findcar-*, hero-*, card-pop-*, shimmer, float, glow, mic-*, scroll-bounce, online-pulse, wave-bounce, avatar-thinking, premium-page-bg, step-numeral, hero-gradient, text-gradient.
2. **`src/App.tsx`** — `ThemeProvider defaultTheme="light" forcedTheme="light"`.
3. **`src/main.tsx`** — installera + importera `@fontsource/inter-tight` (400,500,600) och `@fontsource/inter` (400,500). Ta bort Google Fonts-import från index.css.
4. **`tailwind.config.ts`** — `fontFamily: { sans: ['Inter', ...], display: ['Inter Tight', ...] }`. Behåll semantiska tokens, ta bort gamla custom-färger som inte används.
5. **`index.html`** — `<html style="background:#f7f5f1">` (iOS bounce).
6. **`src/pages/Index.tsx`** — total omskrivning. Bort: `AuroraBackground`, `SearchAnimation`, video-bg, KTH-text-overlay, scroll-arrow, "Senast tillagda", `HowItWorks`, `WhyFindCar`, `Testimonials`, `FAQ`, `CtaBanner`, `StickyMobileCTA`. Kvar: `Header`, centrerad rubrik + underrubrik + `GuidedSearch`, `Footer`. Centrera med flex min-h-[calc(100svh-header-footer)].
7. **`src/components/Header.tsx`** — tunn 56px header, vit/paper, hairline botten, logotext "FindCar" i Inter Tight 500 + 2 länkar i Inter 14px muted.
8. **`src/components/Footer.tsx`** — en rad, hairline topp, Inter 13px muted.
9. **`src/components/GuidedSearch.tsx`** — visuell omstart (logik orörd):
   - Bort `clutch-shell` (animerad gradient-border), `clutch-avatar` glow, `search-glow`, `online-dot`, `wave-dot`, `avatar-thinking`, `bubble-user/assistant` gradients.
   - Ny ruta: vit bakgrund, 1px hairline, 6px radius, ingen skugga. Focus = border `--foreground`.
   - Textarea: Inter 16px, min 64px höjd, auto-grow.
   - Submit-knapp: liten svart pill nere höger, "Sök →" i Inter 14px 500, vit text. Hover = 90% opacity.
   - Chips under: 4 förslag, Inter 14px, hairline border, padding 8x14, hover = svart fyll vit text. 150ms transition.
   - Conversation-mode (efter första msg): assistant-text utan bubbla (bara text på paper-bg), user-text i svart pill höger. Avatar = liten svart cirkel med "C" istället för Sparkles-glow.
10. **`src/components/PasswordGate.tsx`** — samma paper-tema: centrerad, "FindCar" i Inter Tight 32px, hairline input, svart knapp. **Logik orörd** (kod kvar).
11. **`src/components/CookieBanner.tsx`** — hairline, vit, ingen skugga.
12. **`src/components/CarCard.tsx`** — uppdatera till ljus stil (vit kort, hairline, tabular nums på pris) **endast så att den fungerar i sökresultaten** — vi visar den inte på `/` längre.
13. **`src/components/ui/button.tsx`** — uppdatera default-variant till svart fyll vit text utan skugga, ghost = transparent + hairline border. Bort: alla custom premium-varianter.

## Filer som tas bort från `/` (inte raderas, bara inte importeras)

`AuroraBackground`, `SearchAnimation`, `CtaBanner`, `StickyMobileCTA`, `HowItWorks`, `WhyFindCar`, `Testimonials`, `FAQ`, hero-video assets. Komponenterna ligger kvar för ev. framtida bruk men är inte i flödet.

## Vad som INTE rörs

- PasswordGate-**logik** (kod-verifiering kvar).
- All söklogik, edge-functions, Supabase, conversation-state, sessionStorage, analytics.
- CarDetail, CarComparison, Admin, Privacy, Terms (egna sidor, oförändrade).
- Mobile UX-fixes (100svh, iOS keyboard, haptics) — kvar i `GuidedSearch`.

## Acceptanskriterier

- `/` har **bara** header + rubrik + sökruta + chips + footer. Inget annat.
- Allt är på ljus paper-bakgrund. Inga mörka ytor, inga blåa accenter, inga glows.
- Sökrutan ligger above-the-fold, vertikalt centrerad, på både desktop (1130px) och mobil (390px).
- Ingen animation utöver 200ms fades och focus-transitions.
- Kod-gate fungerar fortfarande.
- Bygget passerar utan TS-fel.

## Frågor jag fortfarande har (svara om du vill, annars kör jag med defaults)

1. **Chips-texterna** — okej med "Familjebil ~250k", "Sportig under 400k", "Eldrift med dragkrok", "SUV automat"? Eller har du 4 egna?
2. **Logo** — texten "FindCar" i Inter Tight, eller behåller vi nuvarande logo-bild?
3. **Header-länkar** — "Om" och "Kontakt" räcker, eller vill du ha fler (Bilar, Sälj, Logga in)?
