

## Responsiva hero-bilder for desktop, surfplatta och mobil

### Vad vi gor
Implementerar tre separata hero-bilder som automatiskt visas baserat pa skarmstorlek med HTML `<picture>`-elementet.

### Bilder
- **Desktop** (min-width: 1024px): `Adobe_Express_-_file.png`
- **Surfplatta** (min-width: 640px): `Din_objektiva_bilrådgivare_5.png`
- **Mobil** (default): `Din_objektiva_bilrådgivare_3.png`

### Tekniska detaljer

**Steg 1: Kopiera bilderna till projektet**
- `user-uploads://Adobe_Express_-_file.png` -> `src/assets/hero-desktop.png`
- `user-uploads://Din_objektiva_bilrådgivare_5.png` -> `src/assets/hero-tablet.png`
- `user-uploads://Din_objektiva_bilrådgivare_3.png` -> `src/assets/hero-mobile.png`

**Steg 2: Uppdatera `src/pages/Index.tsx`**

Ta bort gammal import:
```tsx
// Ta bort: import heroImage from '@/assets/hero-image.jpg';
```

Lagg till nya importer:
```tsx
import heroDesktop from '@/assets/hero-desktop.png';
import heroTablet from '@/assets/hero-tablet.png';
import heroMobile from '@/assets/hero-mobile.png';
```

Byt ut `<img>`-taggen mot `<picture>`:
```tsx
<picture>
  <source media="(min-width: 1024px)" srcSet={heroDesktop} />
  <source media="(min-width: 640px)" srcSet={heroTablet} />
  <img
    src={heroMobile}
    alt="En utvald bil bland manga -- hitta din perfekta bil"
    loading="eager"
    className="absolute inset-0 w-full h-full object-cover"
    style={{ opacity: 1 - scrollProgress * 0.3 }}
  />
</picture>
```

Varje bild ar anpassad for sitt format sa `object-cover` fungerar optimalt utan att bilden zoomas in for mycket.

