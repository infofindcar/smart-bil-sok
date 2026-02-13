

## Uppdatera hero-bilden till den nya filen

### Vad som andras

Hero-sektionens `background-image` pekar for narvarande pa `/images/findcar_hero_desktop_2560x1440.jpg`. Den nya bilden som laddades upp via GitHub heter `/images/hero_findcar.jpg`. Vi byter sokvagen.

### Tekniska detaljer

**Fil: `src/pages/Index.tsx`**

En enda rad andras -- bakgrundsbildens URL:

```tsx
// Fran:
backgroundImage: 'url(/images/findcar_hero_desktop_2560x1440.jpg)',

// Till:
backgroundImage: 'url(/images/hero_findcar.jpg)',
```

Ingen annan logik, overlay, gradient eller scroll-effekt andras. Ingen bildoptimering eller blur tillampad -- filen i `public/` serveras exakt som den ar.

