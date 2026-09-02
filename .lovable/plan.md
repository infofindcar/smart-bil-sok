# Miltalen visas 10x för lågt — bekräftat

Du trippar inte. Alla bilar från Blocket har miltal som är en tiopotens för lågt.

## Vad datan visar

| Källa | Antal bilar | Medianmiltal | Motsvarar |
|---|---|---|---|
| blocket | 53 735 | 892 mil | ~8 900 km (orimligt) |
| bilformedlingen | 204 | 12 965 mil | ~130 000 km (rimligt) |

Exempel ur databasen: Mercedes E220 2020 med 1 075 mil, VW Tiguan 2017 med 1 740 mil, Hyundai i30 2014 med 1 681 mil. Realistiska värden är 10 gånger högre.

## Orsaken

I `scripts/import-cars.js` divideras Blockets miltal med 10 med kommentaren "Blocket skickar km". Fältet är redan angivet i mil, så divisionen gör varje Blocket-bil 10x för låg. Importen från bilförmedlingen gör ingen division — därför är den datan korrekt.

## Åtgärd

1. **Verifiera fältet mot Blocket-API:t** för ett par annonser innan något skrivs om, så vi är säkra på enheten (mil vs km).
2. **Ta bort divisionen** i importskriptet så nya bilar sparas i mil rakt av.
3. **Engångsuppdatering i databasen**: multiplicera `mileage` med 10 för alla rader med `source = 'blocket'`. Görs i en migration med tydlig avgränsning på källa så bilförmedlingens rader inte påverkas.
4. **Genomsök övriga ställen** som antar den gamla skalan: rankningen i `guided-search` (tröskel 12 000 mil, mil-per-år-beräkning), ägandekostnadsmodellen i `src/lib/carData.ts` och garantiberäkningen — de blir automatiskt rätt när datan är rätt, men jag kontrollerar att inga hårdkodade kompensationer finns.
5. **Kontrollera i webbläsaren** att kort, bilsida och sökresultat visar rimliga miltal efteråt.

## Teknisk detalj

Berörda filer: `scripts/import-cars.js` (importen), en ny SQL-migration (datarättning), samt kontrolläsning av `supabase/functions/guided-search/index.ts` och `src/lib/carData.ts`. Ingen ändring av visningsformatet behövs — `CarCard` och `CarDetail` formaterar redan korrekt.
