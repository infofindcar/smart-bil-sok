
## Språkstöd i Clutch AI

Ändringen är enkel och påverkar **inte** din databas, Supabase-koppling eller något annat. Det enda som ändras är att edge-funktionen läser det `language`-värde som redan skickas från frontend och lägger till en instruktion i AI-prompten att svara på rätt språk.

### Vad som ändras

**1. Läs språkparametern (rad 188 i `supabase/functions/guided-search/index.ts`)**
- Hämta `language` från request body (redan skickat från frontend)

**2. Lägg till språkinstruktion i system-prompten (rad ~207)**
- Före AI-anropet, lägg till en rad i slutet av system-prompten:
  - `sv` -> "Svara på svenska." (standard, ingen ändring)
  - `en` -> "You MUST respond in English."
  - `no` -> "Du MÅ svare på norsk."
  - `da` -> "Du SKAL svare på dansk."
  - `fi` -> "Vastaa suomeksi."

**3. Samma instruktion för resultat-AI:t (rad ~330 och ~380)**
- Samma språkinstruktion läggs till i de två andra AI-anropen (personliga bilmotiveringar och "inga resultat"-meddelandet)

### Tekniska detaljer

- En map med språkkoder och instruktioner skapas
- Instruktionen appendas till varje system-prompt med en enkel string-concatenation
- Validering: om okänt språk skickas, används svenska som standard
- Inga databasändringar, inga nya tabeller, inga nya secrets
- Bara edge-funktionen `guided-search/index.ts` ändras
