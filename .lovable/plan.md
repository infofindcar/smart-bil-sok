

## Redesign av "Sa fungerar det"-sektionen

Sektionen ska byggas om for att matcha referensbilden med kort som har bilder, numrerade badges, ikoner och utforligare texter.

### Vad som andras

**Nuvarande design:** Enkel layout med bara ikoner, korta titlar och beskrivningar centrerade utan kort.

**Ny design (fran referensbilden):**
- Tre kort med vit bakgrund, rundade horn och subtil skugga
- Varje kort har en stor bild langst upp med rundade horn
- En numrerad badge (1, 2, 3) i primarkfarg overlappar bildens ovre vanstra horn
- En ikon under bilden i en rundad ruta
- Langre, mer beskrivande titlar
- Utforligare beskrivningstexter
- Uppdaterad underrubrik: "Att hitta din perfekta bil har aldrig varit enklare. Lat Clutch gora det tunga arbetet."

### Bilder

Eftersom referensbilden visar tre specifika stockfoton (par pa bil vid solnedgang, sportbil pa bergsvag, SUV i skog) kommer jag anvanda Unsplash-bilder med liknande motiv som laddas direkt via URL. Detta ger snygga, royaltyfria bilder utan att behova ladda upp filer.

### Uppdaterad text (fran referensbilden)

1. **Beratta for Clutch vad du vill ha** - "Beskriv din drombil. Budget, livsstil, preferenser -- allt som ar viktigt for dig."
2. **Clutch analyserar tusentals alternativ** - "Var AI skannar marknaden och jamfor funktioner, priser, recensioner och tillforlitlighet for att hitta de basta matcherna."
3. **Fa dina personliga rekommendationer** - "Ta emot skraddarsydda rekommendationer med tydliga forklaringar till varfor varje bil passar dina behov."

---

### Tekniska detaljer

**Fil som andras:** `src/components/HowItWorks.tsx`

**Ny komponentstruktur:**
- Kort wrappade i `bg-card rounded-2xl border shadow-sm overflow-hidden`
- Bildsektion: `aspect-[16/10]` med `object-cover` och `rounded-t-2xl`
- Numrerad badge: Absolut positionerad cirkel med `bg-primary text-white` overst till vanster pa bilden
- Ikon-ruta: `w-12 h-12 rounded-xl bg-accent` under bilden
- Textsektion: `p-6` med titel och beskrivning vansterjusterad
- Ikoner: `MessageSquare` (steg 1), `Brain` (steg 2), `ListChecks` (steg 3)

**Inga andra filer paverkas** -- enbart `HowItWorks.tsx` behover skrivas om.

