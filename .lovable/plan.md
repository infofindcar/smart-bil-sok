

## Snygg overgang mellan hero-sektionen och resten av sidan

### Problem
Just nu gar det fran den morka, filmiska videobakgrunden direkt till den ljusa sok-sektionen. Overgangen kanner sig abrupt och saknar den polerade kanslan som en premiumsida bor ha.

### Losning
Vi skapar en mjuk, flerskiktad overgang med gradient-bakgrunder och scroll-baserade animationer som gor att sidan kanns som ett sammanhangande flode.

### Andringar

**1. Forbattrad gradient-overgang fran hero till sok-sektionen** (`src/pages/Index.tsx`)
- Oka hoiden pa gradient-faden langst ner i hero-sektionen fran `h-40` till `h-64` for en langre, mjukare overgang
- Lagg till en extra overgangssektion mellan hero och sok-sektionen -- en div med en gradient som gar fran bakgrundsfargen till en subtil teal/primary-nyans och tillbaka, vilket skapar en mjuk "bro" mellan de tva sektionerna
- Ge sok-sektionen en subtil gradient-bakgrund istallet for flat farg (fran en latt primary-tint till ren bakgrund)

**2. Dekorativa element i overgangszonen** (`src/pages/Index.tsx`)
- Lagg till en subtil dekorativ gradient-cirkel (radial gradient med primary-farg) som sitter bakom sok-sektionens rubrik for att ge djup och visuell sammanhallning
- Eventuellt en tunn horisontell gradient-linje som dekorativ separator

**3. Forbattrade scroll-animationer** (`src/components/ScrollReveal.tsx`)
- Lagg till stod for valfri `delay`-prop sa att element kan animeras in i sekvens (t.ex. rubrik forst, sedan undertext, sedan sokrutan)
- Langa till en subtil scale-animation utover nuvarande translate for en mer dynamisk kansl

**4. Sektionsovergangarna langre ner pa sidan** (`src/pages/Index.tsx`)
- Lagg till gradient-dividers mellan varje sektion for att undvika harda kant-byten mellan `bg-background` och `bg-section-alt`
- Varje divider ar en smal div (h-16 till h-24) med en CSS-gradient fran den ena sektionens farg till den andras

### Tekniska detaljer

**`src/pages/Index.tsx`:**
- Oka hero-gradienten fran `h-40` till `h-64`
- Lagg till en overgangssektion efter hero: en `div` med `bg-gradient-to-b from-background via-primary/5 to-background` och padding
- Uppdatera sok-sektionens bakgrund till `bg-gradient-to-b from-accent/30 to-background`
- Lagg till en dekorativ radial gradient (`absolute` positionerad `div` med `bg-[radial-gradient(...)]`) bakom sok-rubriken
- Lagg till gradient-dividers (smala `div`-element) mellan HowItWorks, WhyFindCar, Testimonials och FAQ
- Ge ScrollReveal-wrappade element staggerade delays for rubriken och undertexten i sok-sektionen

**`src/components/ScrollReveal.tsx`:**
- Lagg till `delay`-prop (number i ms) for att kunna skapa staggerade animationer
- Lagg till `scale`-variant: element gar fran `scale-95 opacity-0` till `scale-100 opacity-1`
- Uppdatera transition-klassen for att inkludera `transition-[opacity,transform]` med bade translate och scale

**`src/index.css`:**
- Lagg till en ny klass `.section-divider` med en standardiserad gradient-overgang som kan ateranvandas
- Eventuellt en `.bg-glow` klass for dekorativa ljuseffekter

Resultatet blir en sida dar ogat naturligt foljer innehallet nedat utan nagra harda fargbyten, med mjuka gradient-overganger och snygga scroll-animationer som ger en premiumkansl.

