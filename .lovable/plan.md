# Optimering av sökfunktionen och Clutch

Förslag i prioriteringsordning, baserat på hur `guided-search` fungerar idag (en AI-anrop för samtalsbeslut, ett DB-uttag på 80 kandidater, ett AI-anrop för motiveringar).

## 1. Snabbare svar (upplevd hastighet)

- **Strukturerat JSON-svar istället för fri text.** Idag parsas AI-svaret med regex som rensar code fences och kan misslyckas. Med ett strikt JSON-schema blir svaren stabilare och parsningen kan aldrig krascha.
- **Streama Clutchs frågor.** Frågorna kommer idag först när hela AI-svaret är klart. Ord-för-ord-streaming gör att kunden ser svar direkt istället för en tom laddning.
- **Kör motiveringarna parallellt med att bilarna skickas.** Bilarna kan visas direkt och motiveringstexten fyllas i strax efter, istället för att kunden väntar på båda.
- **Lättare modell för samtalsfrågorna, starkare modell endast för matchning/motivering.** Frågesteget är enkelt och kan gå på en snabb, billig modell.

## 2. Bättre träffar (kvalitet)

- **Ranking som väger flera signaler**: pris mot budget, miltal per år, årsmodell, hur väl bilen matchar användningsområdet — istället för dagens enkla sortering.
- **Förklara alltid vad som tummades på.** När filter relaxas (t.ex. bränsle eller växellåda släpps) ska det stå tydligt i resultatet: "Jag släppte kravet på automat för att hitta fler bilar."
- **Fler kandidater innan ranking** (t.ex. 150 istället för 80) med lättare kolumnuttag, så rankingen har mer att välja bland utan att bli långsammare.
- **Bättre hantering av "inga träffar"**: föreslå konkreta, klickbara justeringar baserade på vilket filter som faktiskt blockerade (t.ex. "det finns inga elbilar under 100 000 kr — höj till 150 000 kr?").

## 3. Minskad kostnad och robusthet

- **Cache av identiska sökningar** (samma filter inom ~10 min ger samma resultat utan nya AI-anrop).
- **Cache av motiveringar per bil + kundprofiltyp**, så samma bil inte motiveras om och om igen.
- **Tydliga fel i UI:t** vid kreditslut/rate limit istället för generiskt "något gick fel".
- **Loggning av varje sökning** (filter, antal träffar, svarstid) i analytics, så vi ser vilka sökningar som misslyckas i verkligheten.

## 4. UX i chatten

- **Sammanfattningskort innan sökning**: "Budget 100–150k, kombi, automat, Stockholm" med möjlighet att ändra ett fält direkt.
- **Justera sökningen efteråt** utan att börja om ("visa billigare", "utan automat-kravet", "nyare bilar").
- **Kom ihåg svar mellan sökningar** i samma session, så kunden inte behöver upprepa sig.

## Teknisk sammanfattning

Alla ändringar sker i `supabase/functions/guided-search/index.ts` (schema-baserat AI-svar, ranking, relaxeringslogg, cache) och `src/components/GuidedSearch.tsx` + `src/pages/Index.tsx` (streaming, sammanfattningskort, justera-sökning). Cachen kan ligga i en ny tabell eller i minnet per funktion-instans. Ingen ändring av startsidans design.

## Vad jag föreslår att vi gör först

Punkt 1 (snabbare + stabilare svar) och punkt 2:s relaxeringsförklaring — de ger störst upplevd förbättring för minst risk.
