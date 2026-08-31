# Om oss-sida för FindCar

En egen sida på `/om-oss` som berättar vilka som står bakom FindCar, varför sidan finns och hur den fungerar — story först, AI-lösningen sist.

## Sidans innehåll (i ordning)

1. **Hero med er bild**
   Bilden på er två som skakar hand precis före ett gokart-race, med rubrik i stil med "Två bilnördar från KTH som tröttnade på att bilköp var ett lotteri" och en kort underrubrik.

2. **Varför FindCar finns**
   Bilmarknaden har inte hängt med i den digitala utvecklingen. Folk lägger enorma mängder tid på fel bilar, och den expertis man behöver finns oftast hos någon vars jobb är att sälja dig en bil — alltså partisk information. Det ville vi ändra.

3. **Bilintresset**
   Bilintresserade sedan barnsben: bilshower, YouTube, bilspel, varje kurva på Nürburgring utantill. Vi valde att jobba hårt i den bransch vi älskar.

4. **KTH och KTH Launch**
   Kort om att FindCar byggs av två KTH-studenter och att KTH Launch är ett selektivt entreprenörsprogram — teknisk kompetens plus driv att bygga bolag.

5. **Vad FindCar gör**
   Tre-fyra korta punkter: du beskriver vad du behöver i vanlig svenska, Clutch (vår AI) tolkar det och söker igenom tusentals annonser, du får matchningar med förklaring, betyg per annons och uppskattad månadskostnad. Plus raden: FindCar är helt gratis att använda.

6. **Team**
   Två kort: Kim Nygren och Marko Novacic, "Grundare — KTH". Porträtt om ni skickar sådana, annars initialer i en snygg platta.

7. **Avslutande CTA**
   "Hitta din bil" som länkar till startsidan, plus kontaktlänken som redan finns.

Inga siffror, inga påhittade citat och inga omdömen om andra aktörer nämns — bara det ni har bekräftat.

## Bilder

Sidan byggs så att er gokart-bild läggs in som en vanlig bildimport. Skicka bilden när planen är godkänd; till dess använder hero-sektionen en neutral platshållare med samma layout så inget ser trasigt ut.

## Teknisk del

- Ny fil `src/pages/About.tsx`, lazy-laddad route `/om-oss` i `src/App.tsx`.
- `SEO`-komponenten sätter titel, beskrivning, canonical `https://findcar.se/om-oss` och `AboutPage`-schema med Organization-referens.
- Länk till `/om-oss` i `src/components/Footer.tsx` (samma kolumn som Guider) samt i mobilmenyn där Guider redan finns.
- Ny `<url>`-post för `/om-oss` i `public/sitemap.xml`.
- Bildfil under `src/assets/` som ES6-import, responsiv med `loading="eager"` för hero.
- Endast semantiska design-tokens, samma sektionsrytm och typografi som `/guider` så sidan känns som resten av FindCar. En enda `h1`.
- Ingen ändring i sökflödet, Clutch, edge functions eller databasen.
