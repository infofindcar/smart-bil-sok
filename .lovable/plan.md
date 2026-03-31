

## Plan: Ersätt "Kontakta återförsäljare" med kontaktformulär

### Vad som ändras

Den nuvarande CTA-knappen "Kontakta återförsäljare" (som öppnar en extern länk) ersätts med ett inbyggt kontaktformulär som samlar in kundens uppgifter och sparar dem i Supabase `leads`-tabellen.

### Formuläret

Fält:
- **Namn** (obligatoriskt)
- **E-post** (obligatoriskt)
- **Telefonnummer** (obligatoriskt)
- **Övrig fråga** (valfritt, textarea)

Knappen "Skicka förfrågan" sparar till `leads`-tabellen med `car_id`, `customer_name`, `customer_email`, `customer_phone`, `message`, samt `dealer_name` från bilen.

### Tekniska detaljer

**Fil: `src/pages/CarDetail.tsx`**
- Ta bort den befintliga CTA-knappen (rad 386-392) som öppnar `listing_url`
- Lägg till state för formulärfält och submit-status
- Rendera ett formulär i ett snyggt kort med validering
- Vid submit: `supabase.from('leads').insert(...)` med bilens `id`, `dealer_name` och kundens uppgifter
- Visa bekräftelse efter lyckad inskickning

**Ingen databasändring behövs** — `leads`-tabellen har redan alla nödvändiga kolumner (`car_id`, `customer_name`, `customer_email`, `customer_phone`, `message`, `dealer_name`, `status`) och RLS tillåter publika inserts.

