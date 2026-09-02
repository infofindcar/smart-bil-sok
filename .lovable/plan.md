# Skarpare bilbilder på hela sajten

Ja — det finns gott om marginal. Vi visar idag Blockets minsta variant (575×431 px, ~52 kB) rakt av, både i sökresultatens kort och på hela bilsidan. På en vanlig laptop- eller iPhone-skärm skalas den bilden upp, vilket är exakt den där lite suddiga, "billiga" känslan.

Jag har testat Blockets bild-CDN direkt och den kan leverera betydligt bättre:

| Variant | Upplösning | Filstorlek |
|---|---|---|
| Dagens URL (oförändrad) | 575 × 431 | 52 kB |
| `?width=800&height=600&format=webp` | 800 × 600 | 92 kB |
| `?width=1600&height=1200&format=webp&quality=80` | 1280 × 960 | 110 kB |

Alltså: **drygt 2,2× fler pixlar i bredd för bara ~2× filstorleken**, tack vare WebP. Ingen ny bilddata behöver importeras och inget i databasen behöver ändras — samma URL, bara med rätt parametrar när vi renderar.

## Vad vi gör

1. **En bildhjälpare** som tar en lagrad bild-URL och en önskad storlek och returnerar en optimerad URL. Den känner igen Blockets CDN och lämnar andra källor (t.ex. Bilförmedlingen) orörda.
2. **Rätt storlek per plats**, plus retina-varianter så att skärmar med hög pixeltäthet får den skarpa bilden:
   - Bilkort i resultatgriden: 480 px bred (960 px för retina)
   - Bilsidans huvudbild: 960 px bred (1280 px för retina)
   - "Fler dealers"-listan och jämförelsevyn: 320 px (640 px retina)
3. **WebP som format** överallt där CDN:en stödjer det, med kvalitet 80 — det är där vinsten i skärpa-per-byte ligger.
4. **Behåll dagens beteende i övrigt**: lazy loading, fade-in när bilden laddats, och att bilar med trasig bild fortsatt döljs helt ur griden.
5. **Delnings- och SEO-bilder** (Open Graph, JSON-LD på bilsidan) pekas om till den stora varianten, så länkförhandsvisningar i SMS/WhatsApp inte blir suddiga.

## Effekt på prestanda

Korten i griden går från ~52 kB till ~45–60 kB per bild i WebP vid 480 px — alltså i praktiken **ingen ökning** för resultatsidan, bara skarpare bild. Bara bilsidans huvudbild blir tyngre (~110 kB), och den laddas en åt gången.

## Tekniska detaljer

- Ny fil `src/lib/carImage.ts` med `carImageUrl(url, width)` och `carImageSrcSet(url, width)`. Matchar `images.blocketcdn.se` och sätter `width`/`height` (4:3), `format=webp`, `quality=80`. Notera att CDN:en kräver **både** `width` och `height` för att gå över 767 px — bara `width` cappas.
- `src/components/CarCard.tsx`: `ImageWithFade` får `srcSet` + `sizes`.
- `src/pages/CarDetail.tsx`: huvudbild + `SEO`-props och JSON-LD `image`.
- `src/components/SimilarListingsModal.tsx` och `src/pages/CarComparison.tsx`: samma hjälpare i mindre storlek.
- Inga ändringar i edge-funktioner, import-skript eller databas.
