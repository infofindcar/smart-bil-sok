

## Plan: AI-driven drivetrain och färg-detektering

### Problem
- 43 bilar saknar drivetrain (Unknown/null)
- 18 bilar saknar färg (Unknown/null)
- Olika märken använder olika terminologi (Audi "quattro", BMW "xDrive", Volvo "Twin Motor", Kia "2WD" etc.) — en statisk mappning täcker inte allt

### Lösning: Edge function med AI (Gemini)

Skapa en ny edge function `enrich-car-data` som:

1. **Drivetrain**: Skickar `model_raw` till Gemini och ber den identifiera drivlina. AI:n förstår att "quattro" = AWD, "2WD" = FWD, "Twin Motor" = AWD osv. Värdet sparas med citattecken (t.ex. `"AWD"`) för att markera att det är AI-härlett.

2. **Färg**: Skickar `image_thumb_url` till Gemini vision och ber den identifiera bilens färg på svenska. Sparas som t.ex. `"Svart"` med citattecken.

3. **Batch-körning**: Hämtar alla bilar med Unknown/null drivetrain eller color, processar dem en i taget, uppdaterar databasen.

### Implementation

**Ny fil: `supabase/functions/enrich-car-data/index.ts`**
- Skyddad med admin-lösenord (samma som verify-admin-password)
- Hämtar bilar med Unknown/null drivetrain eller color
- För drivetrain: skickar `model_raw` + `make` + `model` till Gemini med prompt som ber om drivlina-klassificering
- För färg: skickar `image_thumb_url` till Gemini vision-modell med prompt som ber om färg på svenska
- Uppdaterar `Lovable`-tabellen med resultaten (citattecken runt värdet)
- Returnerar en sammanfattning av vad som uppdaterades

**Uppdatera: `supabase/config.toml`**
- Lägg till `[functions.enrich-car-data]` med `verify_jwt = false`

**Uppdatera: `supabase/functions/guided-search/index.ts`**
- Uppdatera color/drivetrain-filter att matcha både med och utan citattecken (t.ex. `AWD` och `"AWD"`)
- Lägg till drivetrain som sökfilter med Unknown-inkludering
- Uppdatera AI-prompten med drivetrain som giltig filterparameter

**Uppdatera: Admin-sidan**
- Lägg till en knapp "Berika bildata" som anropar edge functionen

### Varför AI istället för mappning
- Audi: "quattro" = AWD
- BMW: "xDrive" = AWD
- Volvo: "Twin Motor" = AWD, "T6" = AWD
- Kia: "2WD" = FWD
- Nya märken och modeller hanteras automatiskt utan kodändring
- Färg kan inte härledas från text — kräver bildanalys

