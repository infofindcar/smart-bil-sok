

## Fixa hero-bilden: mindre inzoomad, bättre upplösning

### Problem
Hero-bilden använder `object-cover` på en fullskärmscontainer (`min-h-screen`), vilket gör att bilden beskärs/zoomas in kraftigt. Eftersom den uppladdade bilden troligen har en upplösning som inte matchar viewporten blir det dålig kvalitet.

### Lösning

1. **Ändra bildens visning** -- byt från `object-cover` till `object-contain` så hela bilden syns utan beskärning, med mörk bakgrund bakom.

2. **Positionera bilden i övre delen** -- använd `object-position: top` och `object-contain` så loggan och bilen visas centrerat utan att zoomas in.

3. **Mörk bakgrundsfärg** på hero-sektionen (`bg-black` eller `bg-[#0a0a0a]`) så att eventuella tomma ytor smälter in.

4. **Justera overlay** -- minska eller ta bort `bg-black/40` overlay eftersom bilden redan har rätt tonalitet.

### Tekniska detaljer

Ändring i `src/pages/Index.tsx` (rad 99-106):

```tsx
<section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-black">
  <img
    src={heroImage}
    alt="En utvald bil bland många — hitta din perfekta bil"
    loading="eager"
    className="absolute inset-0 w-full h-full object-contain object-top"
    style={{ opacity: 1 - scrollProgress * 0.3 }}
  />
  <div className="absolute inset-0 bg-black/20" />
```

Detta visar hela bilden utan beskärning, centrerad uppåt, med en subtil mörk overlay.

