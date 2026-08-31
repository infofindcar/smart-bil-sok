# Om oss-sida (/om-oss)

En förtroendesida som förklarar vilka som står bakom FindCar, varför vi startade och varför vi är oberoende. Inga siffror, inga påhittade påståenden.

## Innehåll (svenska, i den här ordningen)

1. **Hero** — H1 "Vilka står bakom FindCar?" plus en kort ingress: två grundare, KTH, byggd för bilköparen.
2. **Vår historia** — kort startup-story: vi startade FindCar för att bilköp i Sverige är förvirrande och alla parter tjänar pengar på att du väljer "rätt" bil för dem. Nämner KTH Innovation och att vi är antagna till KTH Innovation Launch Program, Batch 23.
3. **Varför du kan lita på oss** — tre-fyra kort:
   - Ingen provision — vi tjänar inget på vilken bil du väljer
   - Vi säljer inga bilar och äger inget lager
   - Tjänsten är gratis att använda
   - Vi visar bilar från många handlare, inte en enda
4. **Så fungerar det i praktiken** — kort text om att Clutch (vår AI) läser vad du behöver, filtrerar mot tusentals annonser och förklarar varför varje bil passar. Länk till startsidan.
5. **Teamet** — två anonyma-men-konkreta kort ("Grundare, KTH") eftersom inga namn angivits. Kan bytas till riktiga namn/bilder när du ger dem.
6. **Kontakt-CTA** — info@findcar.se plus LinkedIn/Instagram, samma länkar som headerns kontaktmodal, och en knapp till "Hitta din bil".

Om affärsmodellen skriver vi enbart det som är sant idag: FindCar är gratis och tar ingen provision. Inga löften om framtida prissättning, inga "alltid gratis för evigt"-formuleringar som kan bli fel senare.

## Teknik

- Ny sida `src/pages/Om.tsx`, ny route `/om-oss` i `src/App.tsx`.
- Använder befintlig `SEO`-komponent: titel ~"Om FindCar – oberoende bilrådgivning från KTH-grundare", meta description under 160 tecken, canonical `/om-oss`, samt JSON-LD `AboutPage` + `Organization` (namn, url, e-post, sociala länkar).
- Återanvänder befintliga byggstenar: `Header`, `Footer`, `ScrollReveal`, `premium-card`-klassen och `font-serif`-rubrikstilen från `WhyFindCar.tsx`, så sidan matchar startsidans tema (mörkt/ljust via tokens, inga hårdkodade färger).
- Enkel H1, semantiska `section`-element, responsiv 1-kolumn på mobil / 2-3 på desktop.
- Footer: lägg till "Om oss" i länklistan där `/guider` finns (både mobil- och desktopblocket).
- `public/sitemap.xml`: ny `<url>` för `https://findcar.se/om-oss`, priority 0.6.
- Inga ändringar i sökflödet, `guided-search`, databasen eller startsidans logik.

## Öppet

Skicka namn, roller och ev. porträttbilder när du vill — då byter jag ut de anonyma teamkorten.
