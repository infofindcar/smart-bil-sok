# Skarpare bilder — sista steget

Jag har testat bildtjänsten igen med riktiga annonsbilder. Resultatet:

| Begäran | Levererad upplösning | Filstorlek |
|---|---|---|
| Idag (kvalitet 80) | 1280 × 960 | ~130 kB |
| Kvalitet 90 | 1280 × 960 | ~408 kB* |
| Kvalitet 95 | 1280 × 960 | ~511 kB* |
| Begäran 1600/1920/2048 px | fortfarande 1280 × 960 | — |

*Mätt på en bild vars original bara är 1070 × 913 px, alltså värsta fallet.

Slutsatsen: **upplösningen är maxad** — 1280 × 960 är taket bildtjänsten ger, oavsett vad vi ber om, och en del annonser har inte ens så stora original. Det som återstår att hämta är komprimeringen: idag ber vi om kvalitet 80, och en del av den kvarvarande mjukheten kommer därifrån.

## Vad vi gör

1. **Höj kvaliteten till 88** på bilsidans stora bild och på delningsbilden. Tydligt renare kanter och mindre "grus" i lackytor, till en måttlig storleksökning.
2. **Behåll kvalitet 80 i resultatgriden** där bilderna visas små — där syns skillnaden inte, och griden ska förbli snabb.
3. **Be om full bredd direkt på bilsidan** (1280 px istället för 960 px som bas), så att även skärmar utan hög pixeltäthet får den skarpa varianten.
4. **Höj resultatkortens basbredd** från 480 till 560 px, så 2x-varianten landar på taket istället för strax under.
5. Lazy loading, fade-in och att bilar med trasig bild döljs — allt oförändrat.

## Vad du inte kommer märka

Bilder från annonser vars original är mindre än 1280 px blir inte skarpare hur vi än ber — de är redan uppskalade av bildtjänsten. Det gäller en minoritet av annonserna.

## Tekniska detaljer

- `src/lib/carImage.ts`: `carImageUrl(url, width, quality = 80)` — nytt valfritt kvalitetsargument; `carImageSrcSet` skickar vidare det. `carShareImageUrl` sätter `quality=88`. `MAX_WIDTH` stannar på 1280 (verifierat tak).
- `src/pages/CarDetail.tsx`: huvudbild → bas 1280 px, kvalitet 88.
- `src/components/CarCard.tsx`: bas 560 px (2x → 1120/1280), kvalitet oförändrad.
- Inga ändringar i databas, import-skript eller edge-funktioner.
