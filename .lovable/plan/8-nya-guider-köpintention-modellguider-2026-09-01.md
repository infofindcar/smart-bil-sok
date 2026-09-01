# 8 nya guider: köpintention + modellguider

Ja — det är värt det. Era nuvarande 8 guider är generella köpråd. Det som faktiskt söks i Sverige är "vilken bil ska jag köpa"-frågor och modellfrågor, och de sidorna kan länka rakt in i Clutch-sökningen.

## Vad Semrush-datan visar (svensk databas)

| Sökning | Volym/mån | Svårighet |
|---|---|---|
| bästa begagnade elbilen | 720 | 12 (mycket lätt) |
| billigaste bilen att äga | 720 | 13 |
| tesla model 3 begagnad | 480 | 18 |
| bästa laddhybriden begagnad | 480 | 13 |
| bästa begagnade suv | 390 | 14 |
| vilken bil ska jag köpa | 320 | 14 |
| bästa småbilen begagnad | 260 | 22 |
| volvo xc60 problem | 110 | 11 |

Alla har låg svårighet — realistiska att ranka på även för en ny domän. "X vanliga fel"-sökningar för enskilda modeller ligger på 20–30/mån var, så de fungerar bättre som en samlad modellguide än som egna sidor.

## De 8 nya guiderna

Kategori & topplistor (ny kategori "Vilken bil ska du välja?"):

| Slug | Målsökning |
|---|---|
| basta-begagnade-elbilen | bästa begagnade elbilen |
| basta-begagnade-suv | bästa begagnade suv |
| basta-laddhybriden-begagnad | bästa laddhybriden begagnad |
| basta-smabilen-begagnad | bästa småbilen begagnad |
| vilken-bil-ska-jag-kopa | vilken bil ska jag köpa |

Ekonomi & ägande:

| Slug | Målsökning |
|---|---|
| billigaste-bilen-att-aga | billigaste bilen att äga |

Modellguider (ny kategori "Modellguider"):

| Slug | Målsökning |
|---|---|
| volvo-xc60-begagnad-kop-guide | volvo xc60 problem / vanliga fel |
| tesla-model-3-begagnad | tesla model 3 begagnad |

## Så skrivs de

Samma format som befintliga guider (H1 som fråga, direktsvar först, lästid, CTA, H2-sektioner, FAQ, "Läs även") plus två tillägg för topplistorna:

- **Jämförelsetabell** i topplistorna: modell, typisk årsmodell, vad den passar för, vad man ska kolla. Tabeller citeras oftare av AI-sökmotorer än löptext.
- **Kontextuella Clutch-länkar** per modell/segment, t.ex. "se begagnade elbilar under 250 000 kr" → `/?q=...`, precis som befintliga guider gör.

Faktahantering: inga påhittade priser, testresultat eller tillförlitlighetsstatistik. Prisnivåer anges som breda riktvärden och kända problemområden beskrivs generiskt (t.ex. "kontrollera servicehistorik på kamkedja/DPF") utan att hitta på siffror. Där en siffra behövs för att sidan ska hålla länkar vi till källa (Transportstyrelsen, Trafikverket).

Ny GuideBlock-typ `table` läggs till i innehållstypen så tabellerna kan renderas typat — enda ändringen i befintlig kod utöver innehåll.

## Teknik

- 8 nya filer i `src/content/guides/`, registrerade i `src/content/guides/index.ts`.
- `src/content/guides/types.ts` + `src/components/guides/GuideBlocks.tsx`: ny `table`-block-typ (responsiv, scrollbar på mobil).
- `src/content/guides/index.ts`: två nya kategorier ("Vilken bil ska du välja?", "Modellguider") läggs till i `guideCategories`.
- `public/sitemap.xml` + `scripts/generate-sitemap.js`: 8 nya URL:er (båda uppdateras, annars försvinner de vid nästa cron-körning).
- Befintlig `SEO`-komponent per artikel: unik title/description, canonical, OG, `Article` + `FAQPage` + `BreadcrumbList` JSON-LD.
- Interna länkar: varje ny guide länkar till 2–3 befintliga guider och tvärtom via `related`, så de nya sidorna får intern länkkraft.

## Rörs inte

Startsidan, Clutch/`guided-search`, databas, edge-functions, `CarDetail`, huvudnavigering och tema.

## Notering om indexering

Sajten är en client-side SPA. Google kör JavaScript och indexerar guiderna, men AI-crawlers och länkförhandsvisningar som inte kör JS ser bara `index.html`. Vill du maximera SEO- och AI-synlighet är en migration till TanStack Start (server-renderat) nästa steg — säg till och jag beskriver det separat.
