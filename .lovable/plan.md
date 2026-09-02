# Betyget ska inte straffa gamla bilar

Idag har FindCar-betyget en egen faktor "Ålder" med 15 % vikt, där kurvan går från full poäng vid nybil till 0 poäng vid 18 år eller mer. En välskött veteranbil får därför automatiskt 0 av 10 på en av fem faktorer, oavsett hur bra köp den är. Det tas bort.

## Ny betygsmodell

Ålder försvinner som egen poängsatt faktor. Vikten flyttas till det som faktiskt säger något om ett äldre exemplar: hur mycket bilen gått i förhållande till sin ålder, och vad den kostar att äga.

| Faktor | Vikt idag | Ny vikt |
|---|---|---|
| Pris mot marknaden | 40 % | 40 % |
| Skick & slitage (miltal per år) | 20 % | 30 % |
| Ägandekostnad | 15 % | 20 % |
| Säkerhet (Euro NCAP) | 10 % | 10 % |
| Ålder | 15 % | tas bort |

Faktorn som idag heter "Miltal mot åldern" byter namn till "Skick & slitage" och behåller sin logik (mil per år jämfört med ~1 500 mil/år), men vägs tyngre. Saknas underlag för en faktor räknas den bort och vikterna normaliseras som idag — så en gammal bil utan NCAP-data får inte lägre betyg av det.

Ålder redovisas fortfarande i faktorlistan, men som **informationsrad utan poäng** — "Årsmodell 1988 · 38 år" med en kort kommentar om vad det innebär för underhåll. Den påverkar inte siffran.

## Klassiker-märkning

Bilar som är **20 år eller äldre** märks som klassiker i betygsrutan:

- En liten etikett vid betyget: "Klassiker — bedöms på skick och pris, inte ålder".
- I faktorlistan förklaras att slitage och pris väger tyngst och att åldern inte drar ner betyget.

För klassiker justeras även slitage-poängen så att den inte blir konstlat hög: en 40 år gammal bil har ett "förväntat" miltal på 60 000 mil, vilket annars ger max poäng åt nästan varje exemplar. Poängen tas därför mot ett tak på 25 års förväntat slitage, så att låg körsträcka fortfarande belönas men inte automatiskt ger 10 av 10.

## Text som uppdateras

Ansvarsfriskrivningen under betyget nämner idag "ålder" som en av faktorerna. Den skrivs om till pris, skick, ägandekostnad och säkerhet.

## Teknisk sammanfattning

- `src/lib/carRating.ts`: ta bort `age`-faktorn ur poängsättningen, höj vikterna för `mileage` (30) och `cost` (20), byt etikett till "Skick & slitage", inför `CLASSIC_AGE_YEARS = 20` och `isClassic` i `CarRating`, tak på förväntat miltal vid 25 år, samt en poänglös informationsrad för årsmodell (ny valfri `informational`-flagga på `RatingFactor`).
- `src/pages/CarDetail.tsx`: rendera klassiker-etiketten när `rating.isClassic`, hoppa över poängstapeln för informationsrader, och uppdatera friskrivningstexten.
- Tröskeln för att visa betyg alls (minst två faktorer, minst 40 i vikt) behålls, räknad på poängsatta faktorer.
