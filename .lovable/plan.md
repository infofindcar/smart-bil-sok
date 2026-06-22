## Hero-loop video — cinematisk bro-scen i Remotion

Vi bygger en kort cinematisk loop helt i kod (Remotion → MP4) som ersätter nuvarande `hero-cars-night-v2.mp4`. Allt renderas pixelperfekt med garanterat korrekt "FINDCAR"-text på reg-skylten.

### Koncept & timing

```text
0s ─────► 5s ─────────► 10s ──► loop
[bil åker förbi]   [tom bro + logga + tagline]
```

- **0–5s**: Premium-coupé i sidovy glider långsamt över en mörk bro från höger till vänster. Bron har subtila gatlampor, lätt dimma och reflektioner. Reg-skylten visar tydligt **FINDCAR** i klassisk EU-stil (vit/gul bakgrund, svart text). Inga märkeslogos på bilen — endast formgiven anonym premium-coupé-siluett (lång motorhuv, låg taklinje, runda strålkastare/bakljus).
- **5–10s**: Bilen har försvunnit ut ur frame. Bron och bakgrunden fortsätter röra sig (parallax på lampor, dimrörelse, lätt kamerasväng) — det ser inte ut som en frusen bild. **FindCar-loggan** tonar in stort i mitten (Find i mörkblå #1e3a8a, Car i cyan #22d3ee), och under den **"Din objektiva bilrecensent"** i tunn vit typografi.
- **10s**: Loop tillbaka till 0s — bilen kommer in från höger igen.

### Visuell direktion

- **Färgpalett**: bg #0a0f1a → #1a1a2e (gradient), bil mörk antracit #1c1c20 med kalla blå reflektioner, lampor varmvit #fff8e0, bakljus röd #ff2a2a, accent cyan #22d3ee.
- **Bil**: byggd med SVG/CSS-shapes — sidovy av en lång coupé (tänk Porsche 911-proportioner men generiska former), inga märkesdetaljer. Strålkastare och bakljus glöder med radial gradient + lätt motion-blur via stretch.
- **Bro**: lager med horisontella linjer (räcke + vägbana), gatlampor som rör sig från vänster→höger (parallax åt motsatt håll mot bilens rörelse), subtilt stjärnhimmel-/dimskikt i bakgrunden.
- **Typografi**: Inter (Google Fonts) — bold för loggan, light för tagline.
- **Motion**: bil rör sig med svag ease-out, lampor med konstant linjär hastighet (skapar djupkänsla), logga + tagline fade+scale-in med spring.

### Teknisk plan

**1. Remotion-projekt** (`remotion/`)
- `bun init`, installera `remotion`, `@remotion/cli`, `@remotion/renderer`, `@remotion/bundler`, `@remotion/google-fonts`, `@remotion/compositor-linux-x64-musl`, react/react-dom/typescript.
- Fixa compositor-binär (musl → gnu) + symlinka ffmpeg/ffprobe enligt skill-rules.
- `tsconfig.json` + `src/index.ts` enligt skill-mall.

**2. Composition**
- `id: "hero-loop"`, **1920×1080**, **30 fps**, **300 frames** (10s).

**3. Komponenter**
```text
remotion/src/
  index.ts
  Root.tsx
  HeroLoop.tsx              ← orkestrerar lager
  components/
    BridgeBackground.tsx    ← gradient sky + bro-räcke + parallax-lampor (synlig hela tiden)
    CoupeCar.tsx            ← SVG-bil med FINDCAR-skylt, animerad x-position 0-150f
    LogoReveal.tsx          ← FindCar-logo + tagline, fade-in 150-300f
```

**4. Animationer (alla via `useCurrentFrame()` + `interpolate`/`spring`)**
- Bil: `x` interpolerar från `width + 400` → `-800` över frame `0–150` med ease-out. Strålkastar-glow pulserar lätt med `Math.sin(frame/8)`.
- Lampor på bron: kontinuerlig translateX-loop (modulo) — alltid i rörelse, även under logo-fasen.
- Dimma: två semi-transparenta lager som driver i motsatta riktningar.
- Logga: `opacity 0→1` + `scale 0.92→1` mellan frame 165–185 (spring damping 18). Tagline fade in frame 185–205.
- Logga ut: `opacity 1→0` mellan frame 285–300 så loopen blir sömlös.

**5. Render**
- `scripts/render-remotion.mjs` (programmatisk, `chrome-for-testing`, `muted: true`).
- Output: `src/assets/hero-loop.mp4` (kopieras in i React-projektet).
- Spot-check med `bunx remotion still` på frame 60 (bil mitt i frame), 220 (logga synlig), 295 (logga toning ut) för att verifiera.

**6. Integration i React-appen**
- Ersätt `import heroCarsNight from '@/assets/hero-cars-night-v2.mp4.asset.json'` med den nya `hero-loop.mp4` i `src/pages/Index.tsx`.
- Ta bort den nuvarande JS-styrda logo-swap-logiken (`heroVideoRef`, `ended`-event, `setShowLogo`-timeout) — videon innehåller nu hela loopen själv. `loop` på `<video>` återställs.
- "Din objektiva bilrådgivare"-text + FindCar-text-overlay i hero tas bort eftersom de nu är inbakade i videon. **CTA-knappen "Hitta din bil" behålls alltid synlig** längst ner i hero (oförändrad).
- Sr-only `<h1>` behålls för SEO/tillgänglighet.

### Kvalitetskontroll
- Renderar 3 stillbilder före full render för att verifiera bil-utseende, FINDCAR-skyltens läsbarhet, och logo-reveal.
- Verifierar att MP4 är < 5 MB (loop-loadtime) och att frame 0 ≈ frame 300 så loopen är osynlig.

### Filer som ändras
- **Nya**: hela `remotion/`-mappen, `src/assets/hero-loop.mp4` + `.asset.json`.
- **Ändrade**: `src/pages/Index.tsx` (byter video-källa, tar bort logo-swap-state och text-overlays).
- **Borttagna**: `src/assets/hero-cars-night-v2.mp4.asset.json` (efter verifiering).
