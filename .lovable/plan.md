

# Mobil Makeover — Komplett Plan

Baserat på din referensbild bygger vi om mobilupplevelsen (< 768px) till en app-känsla med fokus på konvertering, tydlighet och snabb interaktion. Desktop förblir orörd — alla ändringar via Tailwind `md:`-prefix.

---

## Designriktning (från referensbilden)

- Ren, modern SaaS-känsla (Stripe/Linear-stil)
- Mycket luft och spacing
- Mörk blå + cyan-accenter
- Rundade hörn, mjuka skuggor
- Vertikal, centrerad layout
- Fokus på CTA och snabb action

---

## Steg 1: Hero-sektionen (Index.tsx + index.css)

**Nu:** Fullskärms bakgrundsbild med logo vid horisontlinjen, CTA längst ner.

**Nytt (mobil):**
- Sänk hero-höjd till `min-h-[75vh]` på mobil
- Flytta logo till toppen (liten, vänsterjusterad — som i referensen)
- Stor centrerad rubrik: **"Hitta rätt bil – utan stress"**
- Undertext: "Vi matchar dig med bilar baserat på din livsstil, budget och behov"
- Full-width CTA-knapp med gradient: **"Matcha mig med en bil"** (h-14, rounded-2xl)
- Trust-text under CTA: "✔ Tar 30 sek · Gratis · Inga bindningar"
- Bakgrundsbilden syns under texten men med starkare overlay för läsbarhet
- Ta bort bounce-pilen på mobil

## Steg 2: Header (Header.tsx)

- Minska höjd till `h-14` på mobil
- Logo `h-10` på mobil
- Mobilmenyn: fullskärms-overlay med stora touch-targets (56px höjd per länk), slide-in animation
- Transparent över hero, solid vid scroll (behåll nuvarande logik)

## Steg 3: Sök-chatten (GuidedSearch.tsx)

**Nytt (mobil):**
- Visa en förhandsvisning av chatten direkt under hero — rundad card med skugga
- Chatbubblar: större text (`text-base`), mer padding
- Snabbval-knappar: full bredd, tydliga kort med border
- Inputfält: sticky i botten, stort (h-14), med send-ikon
- Max-höjd på chattfönstret `max-h-[55vh]` så input alltid syns

## Steg 4: "Så funkar det" (HowItWorks.tsx)

**Nytt (mobil):**
- Vertikal lista (en kolumn) med ikon + titel + beskrivning per steg
- Card-baserad layout som i referensbilden: ikon till vänster, text till höger
- Bilder döljs på mobil för snabbare laddning och renare look
- Rubrik: "Så funkar det" + undertext "Enkelt att komma igång i 3 steg"

## Steg 5: Resultat & Bilkort (ResultsReveal.tsx + CarCard.tsx)

- En kolumn, full bredd
- Större bilbilder med aspect-ratio 16/10
- Horisontell snap-scroll för "Liknande bilar"
- Större hjärt-/spara-knapp med tydligare touch-area

## Steg 6: WhyFindCar, Testimonials, FAQ, Footer

- **WhyFindCar:** Staplade kort, en per rad, ikon + text
- **Testimonials:** Horisontell swipe/scroll med snap, ett testimonial per vy
- **FAQ:** Större accordion-headers (minst 48px touch-target)
- **Footer:** En kolumn, centrerad logo, staplade länkar, större touch-targets
- **CtaBanner:** Full-width knapp, kompaktare padding

---

## Teknisk approach

- Alla ändringar med Tailwind responsive-prefix — mobil-first, `md:` för desktop
- Inga nya komponenter — responsiva justeringar i befintliga filer
- **Filer som ändras:** `Index.tsx`, `Header.tsx`, `GuidedSearch.tsx`, `HowItWorks.tsx`, `ResultsReveal.tsx`, `CarCard.tsx`, `WhyFindCar.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `Footer.tsx`, `CtaBanner.tsx`, `index.css`

