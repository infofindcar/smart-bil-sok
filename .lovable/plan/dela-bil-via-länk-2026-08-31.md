# Dela bil via länk

Låt användaren skicka en bil vidare till någon annan — via SMS, WhatsApp, mejl eller genom att kopiera länken.

## Så fungerar det för användaren

**På bilsidan (`/car/:id`)** — en "Dela"-knapp bredvid "Tillbaka"-knappen högst upp.

- På mobil öppnas telefonens egna delningsmeny (samma som i Instagram/Safari), där SMS, WhatsApp, AirDrop och mejl redan finns. Det är den naturliga vägen på mobil.
- På dator (som inte har någon delningsmeny) öppnas en liten meny med:
  - Kopiera länk (bekräftas med en toast: "Länk kopierad")
  - Skicka via mejl
  - Skicka via WhatsApp
  - Skicka via SMS

Delad text blir t.ex.: `BMW 530d xDrive – 389 000 kr, 2021, 6 500 mil` följt av länken `https://findcar.se/car/<id>`.

**På bilkorten i sökresultatet** — en liten dela-ikon i kortets hörn, intill hjärtat. Ett klick där delar bilen direkt utan att man behöver öppna bilsidan först (och navigerar inte in på bilen).

## Vad mottagaren ser

Länken går till den vanliga bilsidan, som redan har korrekt titel, beskrivning och bild för förhandsvisning i SMS/WhatsApp/Facebook. Vi kompletterar med de sociala taggar som saknas i dagens SEO-komponent så att bilden och rubriken visas snyggt i chattbubblan istället för en naken länk.

Om bilen sålts och försvunnit ur databasen visar sidan redan sitt "bilen finns inte längre"-läge — vi ser till att det budskapet är tydligt och erbjuder en väg vidare till sökningen.

## Teknik

- Ny komponent `src/components/ShareCar.tsx` med en liten hook/hjälpare som bygger delningstexten och URL:en (`https://findcar.se/car/<id>`, baserat på samma bas-URL som `SEO`-komponenten använder).
- Använder `navigator.share` när den finns (mobil), annars en `DropdownMenu` från shadcn med `navigator.clipboard.writeText` samt `mailto:`, `sms:` och `https://wa.me/?text=`-länkar. Fallback till en dold textarea-kopiering om clipboard-API:t blockeras.
- `src/pages/CarDetail.tsx`: renderar `<ShareCar />` i rubrikraden, ikonen `Share2` från lucide.
- `src/components/CarCard.tsx`: kompakt ikonvariant av samma komponent, med `stopPropagation`/`preventDefault` så kortets länk inte triggas.
- `src/components/SEO.tsx`: lägg till `og:site_name`, `og:image:alt`, `twitter:card` = `summary_large_image` och `og:locale` = `sv_SE` så förhandsvisningen blir korrekt vid delning.
- Ingen backend, ingen databasändring, inga edge functions. Inga ändringar i sökflödet eller Clutch.
- Delningsklick loggas via befintlig `useAnalytics` om det redan finns ett generiskt event-anrop att hänga på, annars hoppar vi över spårning.
