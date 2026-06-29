## Vad vi bygger

En kompakt sektion på startsidan, placerad direkt under `GuidedSearch`-modulen (innan resultatlistan / "Så funkar det"). Diskret design — ett kort med rubrik, kort förklaring, ett URL-fält, en knapp. När man kör analysen expanderar samma kort med resultatet.

```text
┌─────────────────────────────────────────────┐
│ 🔍  Hittat en annons någon annanstans?      │
│ Klistra in länken så analyserar vår AI      │
│ priset, modellen och annonsen åt dig.       │
│                                             │
│ [ https://...                  ] [Analysera]│
└─────────────────────────────────────────────┘
```

Efter analys (samma kort växer):

```text
Pris vs marknad     🟢 Bra pris  (12% under snitt för årsmodell + mil)
Modellens rykte     🟡 Kolla kamkedjan runt 15 000 mil
Annonsens kvalitet  🟢 Tydlig, många bilder, registrerad handlare
Ägandekostnad       ~28 000 kr/år (skatt, försäkring, service)

Sammanfattning: Solid annons, prisvärd. Be om servicebok.
```

## Designprinciper

- Litet kort, samma visuella språk som övriga sektioner (rounded-2xl, border-border/40, subtil gradient som chat-rutan).
- Tar inte mer höjd än ~180 px i ovikt läge på mobil.
- Inga nya färger — använder befintliga design tokens.
- Diskret rubrik (samma stil som "Varför FindCar" men mindre).

## Funktionalitet

**Input**
- Vilken URL som helst (Blocket, Bytbil, Wayke, handlare osv).
- Validering: måste börja med `http(s)://`, max längd, trimmas.

**Backend (ny edge function: `analyze-listing`)**
1. Rate limit per IP: 3 analyser / dygn, lagrat i ny tabell `listing_analyses` (id, ip_hash, url, result, created_at). Returnerar 429 om över gränsen.
2. Hämtar annonssidan via Firecrawl (`scrape` + format `markdown` + `json` med schema för märke/modell/år/mil/pris/säljartyp/bildantal). Firecrawl klarar JS-renderade sidor och anti-bot bättre än rå fetch — krävs för Blocket m.fl.
3. Slår upp jämförelse mot vår `Lovable`-tabell: snittpris för samma make+model+årsmodell ±1 och mil ±20 000.
4. Hämtar eventuellt cachad rykte-data från `car_models` (vi har redan AI-berikade modeller).
5. Skickar allt till Gemini (`google/gemini-3-flash-preview`) med Output-schema som tvingar fram fyra fält: `pris`, `rykte`, `annonskvalitet`, `agandekostnad`, plus en kort `summering`. Varje fält har en `status` (bra/ok/varning) och en kort text.
6. Sparar resultatet i `listing_analyses` (cache 24 h på samma URL).

**Frontend**
- Ny komponent `ListingAnalyzer.tsx`, renderas i `Index.tsx` direkt efter `<section data-search-section>`.
- States: idle → loading (shimmer på de fyra raderna) → result / error.
- Vid fel: vänligt meddelande ("Vi kunde inte läsa annonsen — testa en annan länk").
- Vid rate limit: "Du har använt dagens gratisanalyser, kom tillbaka imorgon".

## Tekniska detaljer

**Ny tabell**
```sql
CREATE TABLE public.listing_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  url text NOT NULL,
  result jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.listing_analyses (ip_hash, created_at DESC);
CREATE INDEX ON public.listing_analyses (url, created_at DESC);
-- GRANTs + RLS: bara service_role skriver/läser, inga klientpolicies
```

**Beroenden**
- Firecrawl-connector behöver kopplas (jag ber dig bekräfta innan vi länkar). Alternativ: skip Firecrawl och kör rå `fetch` med User-Agent — funkar för enkla sidor men inte Blocket. Firecrawl är klart bättre.
- `LOVABLE_API_KEY` finns redan.

**Edge function-skelett**
- `supabase/functions/analyze-listing/index.ts`
- CORS, zod-validering av `{ url }`, IP-hash, rate-limit-check, Firecrawl-scrape, DB-lookup, Gemini-call med `Output.object`, sparar resultat, returnerar JSON.

**Texter (svenska, samma ton som resten av sajten)**
- Rubrik: "Hittat en annons någon annanstans?"
- Underrubrik: "Klistra in länken — vår AI går igenom priset, modellen och annonsen åt dig."
- Knapp: "Analysera"
- Disclaimer i liten text: "Tar några sekunder. Tre analyser per dag, helt gratis."

## Vad det INTE gör (avgränsning)

- Sparar inte annonsen för användaren / ingen "mina analyser"-vy.
- Skickar inte lead till handlaren.
- Klickar inte vidare till annonsen (länken förblir användarens egen URL, vi länkar inte ut själva — i linje med policyn).
- Genererar inte ett "köp/avstå"-betyg som en siffra; vi visar färgkodade statusar per dimension.

## Öppna punkter att bekräfta innan bygg

1. OK att aktivera Firecrawl-connectorn? (Krävs för pålitlig scraping av Blocket/Bytbil — annars blir vi blockerade.)
2. Rate-limit: 3/dygn per IP lagom, eller hellre 5?
3. Vill du att kortet ska ha en egen liten ikon (lucide `Link2` eller `ScanSearch`) bredvid rubriken?