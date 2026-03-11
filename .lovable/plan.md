

## Intresseanmälan på lösenordssidan

Lägger till ett e-postformulär under lösenordsskyddet. Inget befintligt i databasen (bilar, analytics, sökfunktioner) påverkas.

### Steg 1: Ny databastabell `waitlist`
- Skapas med en migration (bredvid dina befintliga tabeller)
- Kolumner: `id` (uuid), `email` (text, unik), `created_at` (timestamptz)
- RLS: tillåt INSERT för alla, blockera SELECT/UPDATE/DELETE
- Dina bilar och andra tabeller rörs inte

### Steg 2: Uppdatera PasswordGate.tsx
- Under texten "Denna tjänst är lösenordsskyddad under beta" läggs till:
  - En linje/separator
  - Texten "Vill du få tillgång först och följa resan?"
  - Ett e-postfält med en skicka-knapp
  - Bekräftelsetext: "Tack! Vi hör av oss."
- Sparar direkt till `waitlist`-tabellen via Supabase-klienten
- Ingen edge function behövs, ingen extern tjänst

### Vad som INTE ändras
- `cars`-tabellen (alla bilar kvar som vanligt)
- `ny find car`-tabellen
- `guided-search` edge function
- `verify-password` edge function
- Alla andra komponenter och sidor

### Tekniskt
- Migration: `CREATE TABLE waitlist (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, email text NOT NULL UNIQUE, created_at timestamptz DEFAULT now())`
- RLS: en RESTRICTIVE policy som nekar allt, plus en PERMISSIVE INSERT-policy for anon
- Frontend: `supabase.from('waitlist').insert({ email })` — ingen autentisering krävs
- Duplicate-hantering: vid samma e-post igen visas ändå "Tack"-meddelande
- Du ser alla anmälningar i Supabase Table Editor (supabase.com/dashboard)
