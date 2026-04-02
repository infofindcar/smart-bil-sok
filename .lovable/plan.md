

## Plan: Fixa bilsökning, bilder och smartare frågor

### Problem identifierade

**1. Bilder visas inte (måste klicka)**
- `CarCard.tsx` sätter `style={{ opacity: 0 }}` inline på bilden
- `onLoad` lägger till CSS-klassen `opacity-100`, men inline styles har högre prioritet än klasser
- Resultat: bilden laddas men förblir osynlig

**2. Helt fel bilar visas**
- Användaren sökte GT-coupé för 1-1.5M SEK men fick Mazda CX-60, VW Caddy, etc.
- Orsak: Det finns bara 28 coupéer i databasen, max pris ~700k. Inga matchar budgeten.
- Vid relax level 2 släpps `body_type` och `null`-värden inkluderas — men majoriteten av bilar i den prisklassen har `body_type = null`, så slumpmässiga bilar returneras
- `modelBodyTypeMap` saknar helt `coupe`-entry (inga modellnamn som "911", "Mustang", "M4" etc.)
- Sorteringen är efter "proximity to budget midpoint" utan hänsyn till om bilen alls matchar karosstyp

**3. Clutch ställer för få frågor** (godkänd plan från tidigare)

### Ändringar

#### 1. Fixa bilder — `src/components/CarCard.tsx`
- Byt från inline `style={{ opacity: 0 }}` + `classList.add('opacity-100')` till React state
- Använd `useState(false)` för `loaded`, sätt `onLoad` → `setLoaded(true)`
- Applicera `opacity: loaded ? 1 : 0` inline (eller className-baserat utan konflikt)

#### 2. Fixa söklogiken — `supabase/functions/guided-search/index.ts`

**a) Lägg till coupe-modeller i `modelBodyTypeMap`:**
```
coupe: ["911", "Cayman", "Boxster", "M2", "M4", "M8", "M850i", 
        "RS5", "TT", "R8", "AMG GT", "CLE", "Mustang", "Supra", 
        "RC", "LC", "Vantage", "DB11", "DB12", "F-Type", "Capri"]
```

**b) Förbättra relaxeringslogiken:**
- Vid relaxering: behåll alltid body_type/model-filter om det finns, men bredda prisintervallet mer aggressivt
- Ny relaxeringsstrategi:
  - Level 0: Alla filter strikta
  - Level 1: Drop city, pris ±30%
  - Level 2: Drop color, pris ±50%, behåll body_type
  - Level 3: Drop make och year, pris ±80%, **behåll body_type**
  - Level 4: Drop allt, pris ×10
- Nyckeln: body_type ska vara ett av de sista filtren som tas bort, inte bland de första

**c) Förbättra sortering vid relaxerad sökning:**
- Prioritera bilar som matchar body_type/karosstyp även efter relaxering
- Bilar med matchande body_type sorteras före bilar med `null` body_type

#### 3. Utöka system-prompten med fler frågor (godkänd plan)
- Lägg till ålder, parkering, barn, dragkrok, laddmöjlighet, månadsbudget
- Höj minimikrav till 6 frågor / 6 informationspunkter
- Lägg till intelligenta följdfrågor baserat på kontext

### Filer som ändras
- `src/components/CarCard.tsx` — fixa bildvisning
- `supabase/functions/guided-search/index.ts` — fixa söklogik, modellmappning, relaxering, utökad prompt

