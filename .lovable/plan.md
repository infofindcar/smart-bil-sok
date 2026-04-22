

## Plan: Topp 5-frågor + korrekt garanti-/assistansvisning baserad på faktisk ålder

### Sammanfattning
1. Lägg till **topp 5 nya frågor** till Clutch (utan leasing)
2. **Dölj utgångna garantier och vägassistans** baserat på bilens verkliga ålder + miltal — inte bara 2014, utan ALLA bilar där garantin gått ut (en 2017 BMW har också gått ur 3-årsgarantin)
3. Lägg till **4 extra smarta frågor** + bonus-trigger för äldre bilar

---

### Del 1: Topp 5-frågor till Clutch

**Fil:** `supabase/functions/guided-search/index.ts` (`CONVERSATION_SYSTEM_PROMPT`)

1. **Ägartid** — kort (1–3 år) → låg värdeminskning / lång (5+ år) → pålitlighet
2. **Finansiering** — kontant ELLER billån. **Aldrig leasing.**
3. **Husdjur** — triggar kombi/SUV, stor lucka, tåligt klädsel
4. **Märken att undvika** — strikt filter
5. **Verkstad nära** — glesbygd → bias mot vanliga märken (VW, Volvo, Toyota, Skoda)

Explicit regel:
> "FindCar säljer INGA leasingbilar. Nämn ALDRIG privatleasing eller leasing. Finansieringsfrågan = kontant vs billån."

Höj minimum från 6 → 7 datapunkter innan sökning.

---

### Del 2: Visa bara aktiv garanti & assistans (korrekt för ALLA åldrar)

**Problem:** En 2014 BMW (11 år gammal) OCH en 2017 BMW (8 år gammal) visas båda med "3 års nybilsgaranti" — båda har gått ut. Måste räknas mot **dagens datum**.

**Logik:**
- Bilens ålder = `nuvarande år - car.year`
- Garanti aktiv om: `ålder < warrantyYears` **OCH** `mileage < warrantyKm`
- Vägassistans aktiv om: `ålder < roadsideAssistanceYears`
- Räkna ut **återstående tid/km** för att visa "1 år / 30 000 km kvar"

**Filer som ändras:**

**A) `src/lib/carData.ts`**
- Ny funktion `getActiveWarranty(warranty, carYear, mileage)` som returnerar:
  ```
  {
    warrantyActive: boolean,
    warrantyYearsLeft: number,
    warrantyKmLeft: number,
    roadsideActive: boolean,
    roadsideYearsLeft: number
  }
  ```
- Ny funktion `formatActiveWarranty(active)` som:
  - Returnerar `null` om inget är aktivt → komponenten döljer hela sektionen
  - Returnerar t.ex. "Nybilsgaranti: 1 år / 30 000 km kvar"
  - Returnerar t.ex. "Vägassistans gäller 2 år till"
  - Kombinerar båda om båda aktiva

**B) `src/pages/CarDetail.tsx`**
- Ersätt `formatWarranty(getWarranty(car.make))` med ny logik som tar in `car.year` + `car.mileage`
- Om `null` → dölj hela garanti-sektionen/badgen
- Visa bara den aktiva delen med tydlig "kvar"-text

**C) `src/components/CarCard.tsx`**
- Samma logik om garanti-chip visas där (dölj om utgången)

---

### Del 3: 4 extra smarta frågor + bonus-trigger

Läggs in i samma systemprompt:

1. **Färgpreferenser & tabu** — "Finns färger du vill ha eller absolut inte vill ha?"
2. **Importerad bil OK?** — filtreras via `model_raw` (söker "import", "EU-bil")
3. **Antal tidigare ägare** — påverkar val mellan demobil vs äldre bil
4. **Laddmöjlighet hemma** (vid elbil) — explicit fråga: "Kan du ladda hemma eller publika stolpar?"

**Bonus-trigger:** Om bilen är **äldre än 8 år** ska Clutch proaktivt nämna högre servicekostnader och föreslå kontroll av servicehistorik.

---

### Filer som ändras
- `supabase/functions/guided-search/index.ts` — systemprompt
- `src/lib/carData.ts` — `getActiveWarranty()` + `formatActiveWarranty()`
- `src/pages/CarDetail.tsx` — använd ny logik, dölj utgångna delar
- `src/components/CarCard.tsx` — samma vid behov

Inga DB-ändringar.

