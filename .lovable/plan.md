

## Premium Hero-effekt for logga och tagline

### Vad vi gor
Ger loggan och taglinjen en lyxig, levande kansla som smolter in battre mot bakgrunden genom subtila animationer och visuella effekter.

### Effekter som laggs till

1. **Subtil flytande animation pa loggan** -- en mjuk upp-och-ner-rorelse (ca 6px) som ger en levande, premium kansla utan att vara distraherande.

2. **Mjuk glow-effekt pa loggan** -- en pulserande drop-shadow som gor att loggan "lyser" subtilt, som om den ar belyst bakifran.

3. **Fade-in med slide-up vid sidladdning** -- loggan och texten glider in snoyggt uppifran nar sidan laddas istallet for att bara dyka upp.

4. **Tagline med shimmer-effekt** -- texten "Din objektiva bilradgivare" far en subtil shimmer/glans som sveper over texten, som ljus pa en premiumyta.

5. **Parallax-effekt vid scroll** -- loggan ror sig langsammare an bakgrunden nar man scrollar, vilket ger djupkansla.

---

### Tekniska detaljer

**Fil: `src/index.css`**
- Lagg till en ny `@keyframes premium-float` animation (subtilare an den befintliga `gentle-float`)
- Lagg till en `@keyframes logo-shimmer` for tagline-texten
- Lagg till en `@keyframes premium-entrance` for fade-in + slide-up vid laddning

**Fil: `src/pages/Index.tsx`**
- Applicera `animate-float-subtle` + pulserande glow pa logga-containern
- Lagg till entrance-animation pa hela logo+tagline-wrappern
- Anvand `scrollProgress` for att skapa en parallax-effekt (loggan ror sig uppat langsammare vid scroll)
- Lagg till shimmer-klass pa tagline-texten
- Eventuellt en tunn ljus "halo" bakom loggan med en radial-gradient div

Alla animationer hålls subtila och performanta med `will-change: transform` och GPU-accelererade properties.

