

# Byt hero-video till AI-genererad hero-bild

## Koncept
En stilren, cinematic bild: en bil i en tydlig, iögonfallande färg (t.ex. djupblå eller röd) står i centrum, skarpt belyst. Runtomkring syns andra bilar som är urblekta, gråtonade eller suddiga — visuellt budskap: **"Den perfekta bilen, utvald bland alla andra."**

Mörk, premium-känsla som matchar FindCars befintliga tema.

## Steg

### 1. Generera hero-bilden med AI
- Använda Gemini bildgenerering via edge function
- Prompt: En elegant modern bil i stark färg (djupblå/röd) i centrum av bilden, skarpt belyst, omgiven av flera andra bilar som är gråtonade, suddiga och i bakgrunden. Cinematic, mörk bakgrund, premium bilförsäljningskänsla.
- Spara bilden i projektet (t.ex. `src/assets/hero-image.png` eller ladda upp till Supabase Storage)

### 2. Ersätt VideoLoop med en statisk hero-bild
- Ta bort `VideoLoop`-komponenten från hero-sektionen i `src/pages/Index.tsx`
- Ersätt med en `<img>`-tag som laddar den genererade bilden
- Behåll samma scroll-parallax-effekt (opacity minskar vid scroll)
- Lägg till `loading="eager"` för att prioritera hero-bilden

### 3. Rensa upp
- VideoLoop-komponenten kan tas bort eller behållas för framtida bruk
- Hero-videon (`public/hero-video.mp4`) kan tas bort för att minska bundle-storlek (stor fil)

## Tekniska detaljer

**Filer som ändras:**
- `src/pages/Index.tsx` — Byt ut `<VideoLoop>` mot `<img>` med den nya hero-bilden
- `supabase/functions/generate-hero/index.ts` — Ny edge function för att generera bilden (engångsanvändning)
- Alternativt: generera bilden direkt och spara som asset

**Filer som kan tas bort:**
- `src/components/VideoLoop.tsx` (valfritt)
- `public/hero-video.mp4` (rekommenderas — sparar bandbredd)

**Bildformat:** WebP eller PNG, optimerad storlek (max ~500 KB för snabb laddning)

**Parallax-effekt behålls:**
```text
<img>  med style={{ opacity: 1 - scrollProgress * 0.3 }}
```

## Fördelar
- Mycket snabbare laddningstid (bild vs video)
- Starkare visuellt budskap som matchar FindCars värdeförslag
- Fungerar bättre på mobil och svaga nätverk
