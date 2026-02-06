
# Hero-sektion med animerad bakgrundsbild och stor logga

## Vad vi bygger
En fullskarms hero-sektion med den uppladdade bilden som bakgrund, animerad med en subtil "Ken Burns"-effekt (langsamm zoom och panorering) som loopar somlost utan synlig overgang. FindCar-loggan placeras stort och tydligt i mitten. Headerns logga gors betydligt storre.

## Hur den somlosa animationen fungerar
Eftersom vi arbetar med en statisk bild (inte video) anvander vi en CSS-baserad teknik:
- **Bilden skalas upp till ca 120%** sa att det finns utrymme att panorera utan att visa kanter
- En CSS `@keyframes`-animation panorerar langsamt over bilden med en subtil zoom-effekt
- Animationen ar designad sa att start- och slutposition ar identiska = somlost loopande
- Kombineras med en latt mork overlay for att loggan ska synas tydligt
- En subtil "gras-rorelse"-effekt skapas genom att bilden langsammmt rör sig horisontellt och vertikalt

## Andringar

### 1. Kopiera bakgrundsbilden till projektet
- Kopiera `user-uploads://videoframe_7526.png` till `src/assets/hero-bg.png`

### 2. Uppdatera `src/index.css` - Lagg till hero-animationer
- Ny `@keyframes hero-drift` animation: en 25-sekunders loop som panorerar bilden i en cirkulär rörelse (hoger, ner, vanster, upp) med subtil zoom -- start och slut ar identiska sa loopen ar somlös
- Ny `.hero-animated-bg` klass som applicerar animationen pa bakgrundsbilden

### 3. Uppdatera `src/pages/Index.tsx` - Hero-sektionen
- Ersatt `hero-gradient` med den uppladdade bilden som bakgrund
- Bilden renderas i en `div` med `background-image`, `background-size: cover`, och den nya CSS-animationen
- Mork overlay (gradient) laggs ovanpa for kontrast
- FindCar-loggan gors mycket storre: `h-32 md:h-44 lg:h-56` (istallet for nuvarande `h-20 md:h-28`)
- Loggan behaller `animate-float` och `animate-glow` effekterna
- Smooth scroll-knappen finns kvar langst ner

### 4. Uppdatera `src/components/Header.tsx` - Storre logga
- Loggan andras fran `h-8` till `h-14 md:h-16`
- Headerns hojd okas fran `h-16` till `h-20` for att rymma den storre loggan

## Teknisk detalj

CSS-animationen `hero-drift` fungerar sa har:

```text
Tid:     0%     25%     50%     75%     100%
         |-------|-------|-------|-------|
Scale:  1.15    1.2     1.18    1.2    1.15
X:       0%     -2%     -1%      1%     0%
Y:       0%      1%     -1%      0%     0%
```

Genom att starta och sluta pa exakt samma varden (scale 1.15, translate 0,0) blir overgangen helt somlös nar animationen loopar. Den subtila rorelsen ger intrycket av att gruset och tradet rör sig naturligt.
