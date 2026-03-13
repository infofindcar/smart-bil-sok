

## Plan: Lägg till body_type-berikning + berikningsstatus på admin

### 1. Edge function: Lägg till body_type-berikning (`supabase/functions/enrich-car-data/index.ts`)

Auto-loopen fungerar redan -- när du trycker "Kör berikning" körs alla bilar automatiskt i omgångar om 25. Det som saknas är body_type.

- Utöka filtret att även inkludera `body_type.eq.Unknown,body_type.is.null`
- Inkludera `body_type` i select-queryn
- Lägg till ett tredje AI-anrop som härleder body_type från make/model/model_raw med svarsalternativ: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil
- Returnera `bodyTypeUpdated` i svaret

### 2. Admin-sidan: Visa berikningsstatus (`src/pages/Admin.tsx`)

- Utöka `fetchStats`-queryn med `drivetrain, color, body_type`
- Räkna bilar med giltig drivetrain/color/body_type (ej null, ej "Unknown")
- Lägg till 3 nya stat-kort under befintliga:
  - "Drivetrain berikad: X/Y"
  - "Färg berikad: X/Y"
  - "Body type berikad: X/Y"
  - "Behöver berikas: Z" (antal som saknar minst ett värde)
- Uppdatera loggen att visa body_type-resultat också

