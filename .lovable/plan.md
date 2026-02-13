

## Byt hero-bild till CSS background-image

### Vad som andras

Den nuvarande hero-sektionen anvander ett `<picture>`/`<img>`-element. Vi byter till CSS `background-image` med den nya bilden (2560x1440) for att behalla full skarpa utan optimering.

### Tekniska detaljer

**Fil: `src/pages/Index.tsx`**

1. **Kopiera bilden** till `public/images/findcar_hero_desktop_2560x1440.jpg` (public-mappen kravs for CSS background-image -- filer i `src/assets` kan inte anvandas direkt i inline styles)

2. **Ta bort** `<picture>`-elementet och dess `<source>`/`<img>`-taggar

3. **Ta bort** importerna for `heroDesktop` och `heroTablet` (de gamla bilderna)

4. **Lagg till `background-image` direkt pa hero-sektionens `<section>`-element** via inline style:

```tsx
<section
  className="relative min-h-[85vh] sm:min-h-screen flex flex-col items-center justify-start overflow-hidden -mb-px"
  style={{
    backgroundImage: 'url(/images/findcar_hero_desktop_2560x1440.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>
```

5. **Behall** den morka overlayen (`bg-black/25`), scroll-fade-gradienten, knapparna och all ovrig logik -- de ligger ovanpa bakgrunden som vanligt.

6. **Scroll-opacity-effekten** behalls genom att lagga opacity pa overlay-diven istallet for pa bilden (CSS background-image stodjer inte direkt opacity-animation pa samma satt).

### Resultat
- Bilden renderas i full 2560x1440 pa desktop utan nagon uppskalning eller komprimering
- `background-size: cover` ser till att bilden tacker hela sektionen pa alla skarmstorlekar
- `background-position: center` centrerar bilden
- Text och knappar ligger kvar ovanpa, skarpt och tydligt

