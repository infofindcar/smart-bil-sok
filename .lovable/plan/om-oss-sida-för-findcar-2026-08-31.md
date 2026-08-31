# Om oss-sida för FindCar

En egen sida på `/om-oss` som berättar vilka som står bakom FindCar och varför sidan finns. Story först, AI-lösningen sist. All text nedan är den färdiga tonen — inga siffror, inga påhittade citat, inga påhopp på andra aktörer.

## Sidans innehåll (i ordning)

**1. Hero med er bild**
Er gokart-bild (handskakningen i depån före racet) ligger till höger, texten till vänster. Bilden är stående, så på mobil hamnar den under rubriken i samma proportion utan beskärning av er två.

Rubrik: "Två bilnördar från KTH som tröttnade på att bilköp var ett lotteri"
Underrubrik: "Vi är Kim och Marko. Vi byggde FindCar för att vi själva ville ha en bilrådgivare som inte hade något att sälja."

**2. Varför FindCar finns**
Bilmarknaden har inte hängt med i den digitala utvecklingen. Folk lägger enorma mängder tid på att leta — och pengar på att köpa fel bil. Och den expertis man verkligen behöver när man handlar bil sitter oftast hos någon vars jobb är att sälja dig en bil, vilket gör att informationen nästan alltid är partisk. Det var precis det vi ville ändra på: samma kunskap, men utan säljmotiv.

**3. Bilintresset**
Bilar har funnits med hela livet: alla bilshower, varje YouTube-video, alla bilspel — vi kan varje kurva på Nürburgring utantill. När vi valde vad vi skulle satsa på blev det självklart branschen vi älskar. Här ligger också en rad om att ni kör gokart tillsammans, med bilden som stöd.

**4. Vi lever bilcontent**
Kort avsnitt om att ni är aktiva på sociala medier, kör runt i olika bilar och delar bilcontent — det är samma intresse som driver FindCar, inte en marknadsavdelning. Länkar till Instagram och TikTok (samma konton som i footern).

**5. KTH och KTH Launch**
FindCar byggs av två studenter på KTH och är en del av KTH Launch, ett selektivt entreprenörsprogram. Kombinationen: tekniskt kunnande att faktiskt bygga produkten och strukturen att bygga bolag av den.

**6. Vad FindCar gör**
Fyra korta punkter: du beskriver vad du behöver i vanlig svenska → Clutch (vår AI) tolkar det och söker igenom tusentals annonser → du får matchningar med förklaring till varför → betyg per annons och uppskattad månadskostnad så du ser vad bilen faktiskt kostar att äga. Avslutas med raden: FindCar är helt gratis att använda.

**7. Team**
Två kort: Kim Nygren och Marko Novacic, båda "Grundare — KTH". Initialer i en snygg platta tills ni skickar porträtt.

**8. Avslutande CTA**
"Hitta din bil" till startsidans sök, plus kontaktlänken info@findcar.se.

## Bilden

Gokart-bilden läggs in som Lovable-asset och används i hero (och som liten bild i bilintresse-avsnittet om det ser bra ut). Alt-text: "FindCars grundare skakar hand i depån före ett gokart-race".

## Teknisk del

- Ny `src/pages/About.tsx` och route `/om-oss` i `src/App.tsx`.
- `SEO`-komponenten: titel, beskrivning, canonical `https://findcar.se/om-oss`, `AboutPage`-schema med Organization-referens, och gokart-bilden som `og:image`.
- Länk till `/om-oss` i `src/components/Footer.tsx` — både mobil- och desktopkolumnen, där Guider ligger idag.
- Ny `<url>`-post för `/om-oss` i `public/sitemap.xml`.
- Bilden via `lovable-assets`-pointer i `src/assets/`, `loading="eager"` i hero.
- Endast semantiska design-tokens, samma sektionsrytm och `ScrollReveal`-animation som resten av sajten. En enda `h1`.
- Ingen ändring i sökflödet, Clutch, edge functions eller databasen.
