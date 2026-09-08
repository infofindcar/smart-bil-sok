# FindCar Pro — betaltjänst för bilhandlare och inköpare

En egen del av sajten, bakom inloggning och månadsbetalning, med ett snabbt filterverktyg i stället för chatt. Tre saker säljer tjänsten: djupsökning på utrustning, obegränsat med sökningar och bevakningar som mailar när en ny bil matchar.

## Först: en sak måste lösas för att utrustningssökningen ska hålla

Utrustning söks idag bara i annonsens rubrik, som är 50–100 tecken. Vi har kontrollerat lagret: av 76 234 aktiva bilar har **noll** en sparad annonstext. En betalande inköpare som söker "dragkrok + värmare + drag över 2 000 kg" får därför träff på långt under hälften av bilarna som faktiskt har det.

Därför är steg ett att börja spara och tolka hela annonstexten. Utan det blir Pro bara ett snabbare filter, inte något att ta betalt för.

## Så här fungerar tjänsten för kunden

1. Inköparen skapar konto och betalar månadsvis med kort. Kontot låses upp direkt efter betalning.
2. Under "Pro" finns ett filterverktyg: pris, årsmodell, miltal, miltal per år, effekt, drivning, växellåda, bränsle, karosstyp, platser, ort/region, färg, bilfirma och utrustning. Flera utrustningskrav samtidigt, och krav som "minst" på till exempel effekt och dragvikt.
3. Resultatet visas som en tät lista/tabell som går att sortera på pris, miltal, miltal per år, årsmodell och effekt, med alla bilder och direktlänk till annonsen.
4. Träfflistan kan sparas som en bevakning. När en ny bil kommer in i lagret och matchar, går ett mail ut — högst ett mail per bevakning och dag.
5. Inköparen kan pausa eller avsluta sitt abonnemang själv.
6. Inga sökbegränsningar: Pro-konton kringgår spärren som gäller gratisläget.

Gratisläget med Clutch ändras inte alls.

## Vad vi bygger

**1. Annonstext och utrustning**
Ett bakgrundsjobb hämtar annonstexten för aktiva bilar och plockar ut utrustningen som en sökbar lista (dragkrok, dragvikt, värmare, skinn, panorama, backkamera, adaptiv farthållare, ljudsystem, luftfjädring, paket som M Sport/AMG/R-Line, och så vidare). Texten sparas per bil, utrustningen sparas som märkord vi kan filtrera hårt på. Jobbet går i omgångar så vi inte överbelastar källan, nya bilar tas efter varje nattlig uppdatering.

**2. Konto och betalning**
Månadsabonnemang med kortbetalning. Betalningsstatus sparas på kontot och kontrolleras på servern varje gång Pro används — aldrig i webbläsaren. Kunden når sin egen betalningssida för att byta kort eller avsluta.

**3. Pro-sökningen**
En serverfunktion som tar emot filtren, kontrollerar att kontot är betalande och kör sökningen direkt mot lagret. Ingen AI inblandad, så den är snabb och kostar inget per sökning — det är därför obegränsat är möjligt.

**4. Bevakningar och mail**
Sparade sökningar körs automatiskt några gånger per dygn. Nya matchningar sedan förra körningen mailas till inköparen. Vi håller reda på vilka bilar som redan mailats så samma bil inte skickas två gånger.

**5. Admin**
I admin ser ni antal Pro-konton, aktiva abonnemang, antal bevakningar och hur långt utrustningsjobbet kommit. Ni kan även ge ett konto Pro manuellt, till exempel för en provperiod eller en kund som faktureras.

## Vad som inte ingår i denna version

- Pris mot marknad / fyndlista (vilka bilar som ligger under snittpris). Bra nästa steg, men kräver egen prismodell — ligger utanför.
- Export till Excel/CSV och budgivning eller inköpsanteckningar.
- Bilar från andra källor än de vi redan har.

## Två saker jag behöver från dig innan bygget är klart

- **Pris per månad** och om det ska finnas årsrabatt.
- **Om annonstexten får hämtas** i den omfattning det handlar om (tiotusentals annonser, spritt över tid). Jag lägger in fördröjning och omgångar, men du bör känna till att vi läser mer från källan än idag.

## Tekniskt

**Databas (migration)**
- `pro_subscribers` — `user_id`, status, plan, period-slut, kund-/prenumerations-id, `granted_manually`. RLS: användaren läser bara sin egen rad; endast service role skriver.
- `saved_searches` — `user_id`, namn, `filters jsonb`, `notify boolean`, `last_run_at`. RLS scopad på `auth.uid()`.
- `saved_search_hits` — `saved_search_id`, `car_id`, `notified_at`, unik nyckel på paret (dubblettskydd).
- `"Lovable"`: fyll befintlig `description`, lägg till `equipment text[]` + `max_towing_kg` (finns), `enriched_text_at timestamptz`. GIN-index på `equipment`, samt index på `(is_active, price)`, `(is_active, year)`, `(is_active, mileage)`.
- GRANT i samma migration för varje ny tabell: `authenticated` läs/skriv där policy tillåter, `service_role` ALL, inget `anon`.

**Edge functions**
- `pro-search` — validerar JWT, slår upp aktiv prenumeration, bygger PostgREST-query av filtren (equipment via `contains`, fri text via `ilike` mot `description`), returnerar sida + totalantal. Aldrig rå SQL.
- `pro-checkout` + `pro-portal` + `pro-webhook` — Stripe-abonnemang; webhooken (`verify_jwt = false`, signaturkontroll) är enda skrivaren till `pro_subscribers`.
- `enrich-listing-text` — cron, batchvis: hämtar annonstext, extraherar utrustning med regelbaserad matchning (utökad `featurePatterns`) och AI endast för fritextrester, sätter `enriched_text_at` alltid så bilar inte loopar i kön (samma sentinel-princip som övrig enrichment).
- `saved-search-run` — cron, kör bevakningar, diffar mot `saved_search_hits`, mailar via Resend.
- `guided-search`: enda ändringen är att Pro-konton hoppar över `guided_search_usage`-spärren.

**Frontend**
- `/pro` (filterverktyg + resultattabell), `/pro/bevakningar`, `/pro/konto`, `/pro/pris` (låst tillstånd med köpknapp). Skyddas av en `useProAccess`-hook som frågar servern, inte localStorage.
- Återanvänder befintlig auth (`Login.tsx`, `profiles`) och `carImage.ts` för bilder; sista bilden i varje annons hoppas över som vanligt.
- Ny `ProFilters`-komponent (shadcn), resultattabell med virtuell lista, semantiska tokens — inga hårdkodade färger.
- Admin får en `ProPanel`-flik.

**Nycklar**
`STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET` behöver läggas till. `RESEND_API_KEY` och `FIRECRAWL_API_KEY` finns redan.
