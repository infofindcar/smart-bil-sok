# Prisbedömning per bil ("Är detta ett bra pris?")

## Vad användaren får

På bilsidan (`/car/:id`), direkt under priset, en tydlig bedömning:

```text
Bra pris  ·  22 000 kr under marknadssnittet
Jämfört med 34 liknande Volvo XC60 2019–2021, 8–14 000 mil
```

Nivåer: **Bra pris** (mer än 8 % under referensen), **Rimligt pris** (±8 %),
**Över marknadspris** (mer än 8 % över). Finns för få jämförbara bilar visas
ingen bedömning alls — hellre tyst än fel.

## Så räknas referenspriset (verifierat mot databasen)

Jämförelsegruppen hämtas ur `Lovable`: samma `make` + `model`, årsmodell ±2 år,
mileage ±40 %, aktiva annonser med pris > 1 500 kr. Referensen är **medianen**
av gruppen (robust mot enstaka feltaggade annonser), med en lätt
mileage-justering så att en bil med klart lägre mil inte döms som "dyr".

Datatäckning är kontrollerad: av 47 975 aktiva annonser med miltal ligger
46 567 (97 %) i en make+model-grupp med minst 5 annonser, så bedömningen
kommer att visas på de allra flesta bilar.

Minimikrav för att visa något: minst 5 jämförbara bilar.

## Teknisk sammanfattning

| Fil | Ändring |
|---|---|
| `supabase/functions/cars-public/index.ts` | Ny action `price_benchmark`: tar make, model, year, mileage, price → returnerar median, antal, spann och nivå. Service-role-läsning, ingen ny tabell, samma CORS + rate limit som idag. |
| `src/pages/CarDetail.tsx` | Hämtar bedömningen efter att bilen laddats och visar en badge/rad under priset, med jämförelsetexten under. Ingen bedömning renderas när underlaget är för tunt. |

Ingen databasmigrering, ingen ändring i sökningen eller Clutch. Om anropet
misslyckas visas sidan precis som idag.

## Nästa steg (inte del av detta)

Samma bedömning som liten badge på resultatkorten i sökningen — görs efter att
den fungerar bra på bilsidan.
