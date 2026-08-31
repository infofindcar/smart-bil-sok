# Prisbedömning + FindCar-betyg 1–10 på varje bil

Två delar som hänger ihop: först ett referenspris ur vår egen databas, sedan ett
samlat betyg där priset är den tyngsta faktorn.

## Del 1 — Prisbedömning

På bilsidan (`/car/:id`), direkt under priset:

```text
Bra pris  ·  22 000 kr under marknadssnittet
Jämfört med 34 liknande Volvo XC60 2019–2021, 8–14 000 mil
```

Nivåer: **Bra pris** (mer än 8 % under referensen), **Rimligt pris** (±8 %),
**Över marknadspris** (mer än 8 % över). Finns för få jämförbara bilar visas
ingen bedömning alls — hellre tyst än fel.

Så räknas referenspriset (verifierat mot databasen): samma `make` + `model`,
årsmodell ±2 år, mileage ±40 %, aktiva annonser med pris > 1 500 kr. Referensen
är **medianen** av gruppen (robust mot feltaggade annonser), med lätt
mileage-justering. Minst 5 jämförbara bilar krävs.

Datatäckningen är kontrollerad: av 47 975 aktiva annonser med miltal ligger
46 567 (97 %) i en make+model-grupp med minst 5 annonser.

## Del 2 — FindCar-betyg 1–10

En tydlig siffra högt upp på bilsidan, t.ex. **7,8 / 10 — Värd att kolla**, med
en utfällbar rad per delbetyg så användaren ser *varför*.

Till skillnad från annonsanalysen (där vi skrapar en okänd sida och måste låta
AI tolka den) har vi strukturerad data på våra egna bilar. Betyget räknas därför
**deterministiskt** — samma bil ger alltid samma betyg, det laddar direkt och
kostar inga AI-credits.

Delbetyg och vikt:

| Faktor | Vikt | Underlag |
|---|---|---|
| Pris mot marknaden | 40 % | Del 1 ovan |
| Miltal mot åldern | 20 % | mileage vs ~1 500 mil/år som normal |
| Ålder / återstående livslängd | 15 % | `year` |
| Ägandekostnad | 15 % | befintlig `estimateOwnershipCosts` i förhållande till prisklassen |
| Säkerhet & modelldata | 10 % | `euro_ncap_stars` från `car_models` |

Saknas underlag för en faktor räknas den bort och vikterna normaliseras — betyget
blir aldrig lågt bara för att data fattas. Etiketter: 8,0+ "Riktigt bra köp",
6,0–7,9 "Värd att kolla", under 6,0 "Tveksam".

Betyget presenteras som FindCars bedömning av annonsen, inte som ett omdöme om
bilmodellen i sig, med en kort not om att det bygger på annonsdata.

## Teknisk sammanfattning

| Fil | Ändring |
|---|---|
| `supabase/functions/cars-public/index.ts` | Ny action `price_benchmark`: make, model, year, mileage, price → median, antal, spann, nivå. Service-role-läsning, samma CORS + rate limit som idag. |
| `src/lib/carRating.ts` (ny) | Ren beräkningsmodul: delbetyg, vikter, normalisering, etikett. Inga nätverksanrop, lätt att testa. |
| `src/pages/CarDetail.tsx` | Hämtar benchmarken efter att bilen laddats, visar prisraden under priset och betygsblocket högt upp med delbetygen. |

Ingen databasmigrering, ingen ändring i sökningen eller Clutch. Misslyckas
anropet visas sidan precis som idag, utan pris- och betygsblock.

## Nästa steg (inte del av detta)

Betyget som liten badge på resultatkorten i sökningen — görs först när det
fungerar bra på bilsidan.
