# Community — omdömen om bilar

En egen flik "Community" där inloggade användare skriver om sina erfarenheter av en bil (märke + modell), sätter stjärnor 1–5 och delar plus/minus, ägandetid och miltal. Inget syns publikt förrän ni godkänt det i admin. Stjärnorna dyker sedan upp automatiskt på bilsidor för samma märke + modell.

## Vad användaren möter

1. **/community** — ny sida, länkad i menyn (dator och mobil).
   - Lista med godkända omdömen: bil (märke + modell, ev. årsmodell), stjärnor, rubrik, text, plus/minus, ägandetid, miltal, datum, förnamn.
   - Sökfält + filter på märke, sortering: nyast / högst betyg.
   - Knapp "Skriv om din bil".
2. **Skriv omdöme** — formulär med märke (lista från `car_makes`), modell (fritext med förslag från `car_models`), årsmodell (valfritt), stjärnor, rubrik, text, plus/minus (upp till 3 var), ägandetid, miltal.
   - Kräver inloggning. Är man utloggad visas "Logga in för att skriva".
   - Efter skickat: "Tack! Ditt omdöme granskas innan det publiceras."
3. **Inloggning** — ny sida /logga-in med e-post + lösenord (skapa konto / logga in / glömt lösenord + /reset-password). Bara krav för att skriva och se sina egna omdömen — läsning är öppen för alla.
4. **På bilsidan (/car/:id)** — under bilens fakta: "Användare gav 4,3 ★ (7 omdömen)". Klick öppnar en panel/modal med omdömena för just den modellen, med länk till Community.
5. **I sökresultaten (bilkortet)** — liten stjärnrad när modellen har godkända omdömen; klick leder till bilsidan som idag.
6. **Admin (/admin)** — ny flik "Community" med kö av inskickade omdömen: hela innehållet, stjärnor, användarens e-post, datum. Knappar Godkänn / Neka (med valfri intern anteckning). Även möjlighet att avpublicera ett redan godkänt omdöme.

## Regler

- Ett omdöme per användare per märke + modell (kan redigeras — då går det tillbaka till granskning).
- Text 30–2000 tecken, rubrik max 100, plus/minus max 80 tecken styck.
- Stjärnor 1–5, heltal.
- Endast förnamn/visningsnamn visas publikt, aldrig e-post.
- Inga bilder i version 1.
- Snittbetyg visas först vid minst 1 godkänt omdöme; matchning mot bil sker på normaliserat märke + modell (samma prefixlogik som bilsidan redan använder för `car_models`).

## Teknisk del

**Databas (migration):**
- `profiles` (id → auth.users, display_name, created_at/updated_at) + trigger som skapar rad vid registrering. RLS: alla får läsa visningsnamn, bara ägaren uppdaterar.
- `car_reviews`: user_id, make, model, model_normalized (genererad/normaliserad lowercase), year, rating (1–5), title, body, pros text[], cons text[], ownership_months, mileage_km, status ('pending' | 'approved' | 'rejected'), moderation_note, created_at, updated_at + updated_at-trigger.
  - Unik: (user_id, model_normalized).
  - Index på model_normalized och status.
  - GRANT: `select` för anon + authenticated, `insert/update/delete` för authenticated, `all` för service_role.
  - RLS: alla läser rader med status = 'approved'; inloggad läser sina egna oavsett status; inloggad skapar egna (tvingas till status 'pending' via trigger); inloggad uppdaterar egna (status återställs till 'pending'); moderering sker enbart via service_role.
- Vy/RPC `car_review_summary(model_normalized)` som ger antal och snitt för godkända omdömen (används av bilsida och kort utan att läsa alla rader).
- Validering görs med trigger (längder, rating-intervall), inte CHECK-beroende av tid.

**Edge functions:**
- `community-moderate` (verify_jwt = false): tar admin-lösenord som befintliga `verify-admin-password`/`admin-stats`, listar pending/approved och sätter status med service_role. Validering med zod.
- Ingen ändring i `guided-search`; snittbetyg hämtas i frontend per synliga modeller i en batch-fråga.

**Frontend:**
- Ny route `/community` + `/logga-in` + `/reset-password` i `App.tsx`, lazy-laddade.
- `src/hooks/useAuth.ts` med `onAuthStateChange` + `getUser()`.
- `src/lib/reviewMatch.ts` för normalisering av märke/modell (delas av formulär, bilsida och kort).
- Nya komponenter: `CommunityFeed`, `ReviewForm`, `ReviewCard`, `ModelRatingBadge`, `ModelReviewsPanel`, admin-fliken `AdminCommunity`.
- Zod-validering i formuläret, ingen `dangerouslySetInnerHTML`.
- SEO: titel/beskrivning för /community och JSON-LD `AggregateRating` på bilsidor med godkända omdömen.

## Ordning

1. Migration (profiles, car_reviews, RLS, grants, triggers, summary).
2. Inloggning + profil.
3. Community-sida med lista och formulär.
4. Betyg på bilsida + bilkort.
5. Admin-flik och `community-moderate`.
6. Verifiering i webbläsaren: skicka omdöme, godkänn i admin, se det på Community och på en bilsida.
