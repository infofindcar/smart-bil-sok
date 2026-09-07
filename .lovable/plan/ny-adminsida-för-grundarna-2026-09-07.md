# Ny adminsida för grundarna

Bort med det gamla: berikningsknappen, loggfönstret och de fem berikningsrutorna som ändå står på 0. In med en översikt som svarar på "hur går det för FindCar just nu".

## Så här ser sidan ut

**1. Överst: dagens siffror**
- Besökare idag / 7 dagar / 30 dagar
- Sökningar med Clutch idag / 7 dagar
- Nya intresseanmälningar (väntelista) idag / 7 dagar
- Aktiva bilar just nu

**2. Besökare & trafik**
- Kurva över besökare per dag (senaste 30 dagarna)
- Mest besökta sidor
- Mobil vs dator
- Varifrån besökaren kom (Google, direkt, sociala medier)

**3. Sökningar med Clutch**
- Sökningar per dag
- Vanligaste önskemålen: budget, märke, biltyp
- Hur ofta en sökning inte hittar någon bil (viktigaste varningssignalen)
- Hur många som klickar vidare in på en bil efter sökning

**4. Kunder**
- Väntelistan: antal, hur många godkända, de senaste anmälningarna med namn och mail
- Leads: senaste kontaktförfrågningarna med bil, namn och status
- Förbättringsförslag från besökare, nyaste först

**5. Bilbeståndet**
- Aktiva bilar, antal märken, antal städer
- Nya och borttagna bilar i senaste nattkörningen, med tidpunkt
- En enkel hälsorad: andel bilar med flera bilder, och hur många som saknar viktiga uppgifter — grön/gul text istället för de gamla rutorna

Allt går att uppdatera med en knapp, och sidan ligger kvar bakom samma lösenord.

## Mätningen måste bli riktig först

Idag loggas nästan ingenting (bara delningar), och mätningen är dessutom avstängd för alla som inte klickar ja på cookies. Därför:

- Vi räknar varje sidvisning anonymt — ingen cookie, inget som kan kopplas till en person. Bara sida, tidpunkt, mobil/dator och varifrån besökaren kom. Detta är tillåtet enligt GDPR utan samtycke, och beskrivs kort i integritetstexten.
- Vi räknar "unik besökare" per dag med en engångskod som beräknas från IP + webbläsare + dagens datum och som inte kan räknas tillbaka.
- Sökningar, träfflösa sökningar, klick in på bil och skickade kontaktförfrågningar loggas som händelser.
- Siffrorna börjar från noll den dag detta släpps — historiken finns inte att hämta i efterhand.

## Tekniska detaljer

- Ny edge-function `admin-stats` (service role) som gör alla aggregeringar i ett svar och kräver admin-lösenordet, eftersom `analytics_events`, `leads`, `waitlist` och `forbattringar` är låsta för anon/authenticated. Inga nya RLS-luckor öppnas.
- Migration: index på `analytics_events(created_at)` och `(event_name, created_at)`; nya kolumner `visitor_hash text`, `referrer text`, `device text` samt en SQL-funktion för dagliga aggregat.
- `src/hooks/useAnalytics.ts`: ta bort samtyckesspärren för `page_view` (behåll den för allt som rör en identifierbar användare), lägg till `usePageViewTracking` som körs på varje ruttbyte i `App.tsx`.
- Nya spårningsanrop: `search_started` / `search_no_results` / `search_results` i `GuidedSearch.tsx`, `car_view` i `CarDetail.tsx`, `lead_submitted` vid kontaktformulär.
- `track-analytics/index.ts`: räkna fram `visitor_hash` (SHA-256 av IP + user-agent + datum + salt), plocka ut enhet och referrer, höj rate limit till 60/min för sidvisningar.
- `src/pages/Admin.tsx` skrivs om: hämtar allt från `admin-stats`, ny sektionslayout, `recharts` (redan i projektet) för kurvan. Berikningskoden och `enrich-car-data`-anropet tas bort från sidan (edge-functionen behålls för cron).
- Datalagring: befintlig 90-dagarsrensning gäller även de nya kolumnerna; inget nytt att städa.
