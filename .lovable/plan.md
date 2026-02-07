

## Lagg till "FINDCAR" som registreringsskylt i hero-sektionen

### Vad som ska goras

En stiliserad svensk registreringsskylt med texten "FINDCAR" laggs till i hero-sektionen, nedanfor loggan. Skylten blir ett visuellt brandingelement som forstärker identiteten.

### Design

Skylten utformas som en realistisk svensk registreringsskylt:
- Vit bakgrund med rundade horn
- Blå EU-remsa till vanster (med "S" for Sverige)
- Texten "FINDCAR" i svart, fet stil med typiskt skylt-typsnitt (monospace)
- Tunn svart ram runt skylten
- Subtil skugga for djup

Skylten placeras centrerat under loggan i hero-sektionen, med en liten animation (fade-in) for att matcha ovriga element.

### Tekniska detaljer

**Fil som andras: `src/pages/Index.tsx`**

Under loggan (efter `<img src={logo} .../>` diven) laggs en ny `div` till som representerar registreringsskylten:

```
[  S  |  F I N D C A R  ]
```

Skylten byggs helt med Tailwind CSS och HTML - inga extra bilder behovs. Den foljer samma parallax-effekt och opacity-animation som loggan.

Responsiv storlek: Mindre pa mobil, storre pa desktop. Skylten tonar bort vid scroll precis som ovriga hero-element.

