# Guider-sektion för FindCar

Ny kunskapssektion med 8 färdigskrivna guider, byggd som ett separat lager ovanpå sajten. Startsidan, sökflödet och huvudmenyn lämnas orörda — enda ändringen i befintlig UI är två nya footer-länkar.

## Vad som byggs

**Översiktssida `/guider`**
- Kort intro: vad sektionen är och att den är gratis och objektiv.
- Guiderna som kort i responsivt rutnät, grupperade i tre kategorier: "Innan köpet", "Ekonomi & ägande", "Praktiska tips".
- Varje kort: titel, 1–2 meningars ingress, lästid, "Läs mer".

**8 artikelsidor på `/guider/[slug]`**

| Slug | Kategori |
|---|---|
| prisvard-begagnad-bil | Innan köpet |
| checklista-innan-bilkop | Innan köpet |
| vanliga-fallgropar-privatkop-bil | Praktiska tips |
| besiktningsprotokoll-vad-betyder-det | Praktiska tips |
| leasing-vs-kopa-begagnad-bil | Ekonomi & ägande |
| bilens-vardeminskning-vad-paverkar | Ekonomi & ägande |
| elbil-eller-bensinbil-begagnad | Innan köpet |
| finansiera-bilkop-kontant-lan-leasing | Ekonomi & ägande |

Varje artikel skrivs i sin helhet (600–900 ord, svenska, rådgivande och neutral ton — inga märkesrekommendationer, inga påhittade siffror; prisintervall hålls som rimliga riktvärden).

**Fast artikelstruktur**
1. H1 formulerad som sökbar fråga.
2. Direktsvar direkt under H1 (2–4 meningar, fristående — det AI-sökmotorer citerar), visuellt framhävt.
3. Lästid + "Senast uppdaterad"-datum högst upp.
4. CTA-box under ingressen: "Redo att hitta din bil? Sök här →" till startsidans sök.
5. Brödtext under H2-rubriker som är frågor/delämnen, korta stycken, punkt- och numrerade listor.
6. FAQ med 3–5 följdfrågor i slutet.
7. Samma CTA igen efter FAQ.
8. "Läs även": 2–3 relaterade guider.

**Navigering**
- Ingen ändring i huvudmenyn.
- "Guider" läggs till i footern (både mobil- och desktopkolumnen) under "Tjänster".

## SEO

- Unik `<title>` (~60 tecken) och meta description (~155 tecken) per artikel, plus canonical och Open Graph — via projektets befintliga `SEO`-komponent.
- JSON-LD per artikel: `FAQPage` för FAQ:n + `Article` med `dateModified`, samt `BreadcrumbList` (Start → Guider → artikel).
- Alla 9 nya URL:er läggs in i `public/sitemap.xml` och i sitemap-generatorns statiska lista så de inte försvinner vid nästa körning.
- `robots.txt` är redan öppen (`Allow: /`, bara `/admin` blockerad) — ingen ändring behövs.
- Inga bilder i artiklarna: sektionen använder ikoner och typografi istället. Det ger snabb laddtid och inga tunga assets. Om du vill ha illustrationer per guide senare kan de läggas till med alt-texter.

## Teknik

- Innehållet lagras som typad data i `src/content/guides/` (en fil per guide + ett index), renderat av två nya sidor: `src/pages/Guides.tsx` och `src/pages/GuideArticle.tsx`. Rutterna registreras i `src/App.tsx`; okänd slug ger 404-sidan.
- Design återanvänder befintliga tokens och shadcn-komponenter (Card, Accordion till FAQ, Button) så sektionen ser ut som resten av sajten. Ingen ändring i `index.css`.
- Sidorna är statiska React-komponenter utan datahämtning, så de renderar direkt utan nätverksanrop.

**Om indexering:** sajten är en client-side Vite-SPA, så guidernas text renderas i webbläsaren. Google kör JavaScript och indexerar detta, men crawlers som inte gör det (t.ex. LinkedIns och Facebooks länkförhandsvisning) ser bara den statiska `index.html`. Vill du ha äkta server-renderat innehåll för guiderna kan appen uppgraderas till Lovables senaste mall — skriv "/" i chatten och välj "Migrate to TanStack Start", eller be mig göra det ([vad uppgraderingen ger](https://lovable.dev/blog/building-apps-using-tanstack-start)).

## Rörs inte

Startsidan, `GuidedSearch`, sökbackend, `CarDetail`, `CarComparison`, huvudnavigering, tema och edge-functions.
