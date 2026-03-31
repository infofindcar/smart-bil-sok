

## Plan: Byt mobil hero-bild till ny högkvalitetsbild

### Vad
Ersätt den nuvarande mobila hero-bakgrundsbilden med den nya uppladdade bilden (sjö/berg/moln) i full kvalitet. Endast mobilvy påverkas.

### Ändringar

**1. Kopiera bilden**
- `user-uploads://thugbong-d11u-qXfsF8-unsplash-2.jpg` → `public/images/hero_mobile.jpg` (skriver över den gamla)

**2. Ändra `src/pages/Index.tsx` (rad 128-137)**
- Ta bort inline `style={{ backgroundImage }}` från hero-`<section>`
- Lägg till två `<img>`-element inuti hero, före overlay:

```tsx
<section className="relative min-h-[100svh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1a2332]">
  {/* Responsive hero backgrounds */}
  <img src="/images/hero_mobile.jpg" alt="" className="absolute inset-0 w-full h-full object-cover block md:hidden" loading="eager" decoding="async" fetchPriority="high" />
  <img src="/images/hero_findcar.jpg" alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" loading="eager" decoding="async" fetchPriority="high" />
  
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/50 md:bg-black/40 z-[1]" />
```

- `fetchPriority="high"` + `loading="eager"` = bilden laddas med högsta prioritet utan komprimering
- Desktop helt oförändrad

