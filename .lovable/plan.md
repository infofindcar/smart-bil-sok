

## Osynlig video-loop med crossfade mellan två videoelement

Problemet just nu ar att videon har en synlig "hopp" nar den loopar tillbaka till borjan. En enkel overlay dojer det, men ser artificiellt ut. Den basta losningen ar att anvanda **tva videoeelement** som crossfadar mellan varandra -- sa nar den ena videon narmar sig slutet borjar den andra spela fran borjan och fadar in smidigt ovanpa.

### Hur det fungerar

1. Tva identiska `<video>`-element laddas med samma video
2. Nar den aktiva videon narmar sig slutet (ca 1 sekund kvar) borjar den andra videon spela fran borjan och fadar in
3. Nar crossfaden ar klar blir den nya videon den aktiva
4. Processen upprepas -- sa det ser ut som en oandlig, somllos loop

### Tekniska detaljer

**Fil: `src/components/VideoLoop.tsx`**

- Ersatt nuvarande enkel-video + overlay-losning med en dual-video crossfade
- Tva `<video>`-element renderas, varav bara en ar synlig at gangen
- `timeupdate`-lyssnare detekterar nar videon narmar sig slutet
- Den andra videon startar fran `currentTime = 0` och fadar in med CSS `transition-opacity`
- Nar crossfaden ar klar byts rollerna (aktiv/inaktiv)
- Scroll-progress-opacity behalls pa bada videoelement
- Overlayen med `bg-black` tas bort helt

Resultatet blir en loop som ser helt somllos ut utan nagot synligt hopp eller fading-effekt.

