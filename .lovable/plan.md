

## Visuella uppgraderingar av FindCar

Fem konkreta forbattringar baserade pa dina onskemal.

---

### 1. Header-navigering -- tydligare text
Navlankarna ("Sa fungerar det", "Vanliga fragor") syns daligt mot den morka hero-bakgrunden langst upp. Fixar detta genom att:
- Gora texten vit nar headern ar transparent (over hero-sektionen)
- Oka textstorleken nagot och lagga till en subtil text-shadow sa den alltid syns tydligt
- Nar man scrollat ner och headern far bakgrund anvands den vanliga morkare fargen

### 2. Hero-logga -- storre och tydligare
Loggan pa forstsidan gors annu storre och mer premium:
- Oka fran `h-48 md:h-72` till `h-56 md:h-80` for mer narvaro
- Lagga till en tagline under loggan, t.ex. "Din objektiva bilradgivare" i vit text med elegant typografi
- Forstarkt glow-effekt runt loggan for mer premium-kansla

### 3. Footer -- storre logga och uppdaterad text
- Gora FindCar-loggan i footern storre (fran `h-8` till `h-14`)
- Byta beskrivningstexten till nagot mer premium, t.ex. "Sveriges objektiva bilradgivare -- driven av AI"
- Gora layouten snyggare med mer luft

### 4. Sociala medier-ikoner i footern
- Lagga till Instagram-ikon som lankar till `https://instagram.com/findcar.se`
- Lagga till LinkedIn-ikon som lankar till `https://linkedin.com/company/findcar.se`
- Visa ikonerna bredvid mail-lanken under "Kontakt"-sektionen
- Anvanda Lucide-ikoner (`Instagram` och `Linkedin`)

### 5. Angaende OG-bild
En OG-bild (Open Graph-bild) ar den bild som visas nar nagon delar din lank pa sociala medier (Facebook, LinkedIn, iMessage etc.). Just nu finns ingen sadan bild satt, sa delningar visar bara text. Det ar inte nagot jag kan skapa direkt -- det kraver att ni tar fram en snygg bild (t.ex. 1200x630px med FindCar-loggan och en tagline) och laddar upp den i projektet. Da kan jag koppla in den i koden.

---

### Tekniska detaljer

**Filer som andras:**

| Fil | Andring |
|---|---|
| `src/components/Header.tsx` | Villkorlig textfarg baserat pa scroll-state, storre/tydligare text, text-shadow |
| `src/pages/Index.tsx` | Storre hero-logga (h-56/h-80), tagline "Din objektiva bilradgivare" under loggan |
| `src/components/Footer.tsx` | Storre logga (h-14), ny beskrivningstext, Instagram + LinkedIn-ikoner med lankar |

