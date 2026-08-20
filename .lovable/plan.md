# Fixa "Visa fler bilar"

## Vad jag hittade (verifierat)

"Visa fler" använder en helt egen kodväg i `guided-search` som **inte** fick de snabbhetsfixar vi gjorde för huvudsökningen:

- Frågan saknar `is_active = true` → de partiella indexen används inte. `EXPLAIN ANALYZE` på exakt den frågan ger **Seq Scan, 4,1 sekunder** (48 000 rader genomsökta).
- Den hämtar `select("*")`, alltså även den tunga `description`-kolumnen.
- Den kör upp till **tre** sådana frågor i följd (relaxeringsnivå 0–2) och gör därefter ett AI-anrop för motiveringar → total tid över klientens tidsgräns, anropet dör.
- I frontend loggas felet bara till konsolen (`console.error`) — ingen toast, ingen felruta. Dessutom avbryts funktionen tyst om `findcar-last-filters` saknas i sessionStorage (t.ex. efter en siduppdatering). Båda fallen ser ut som att **ingenting händer**, vilket är precis det du upplever.

## Vad jag gör

1. **Gör load_more-frågan lika snabb som huvudsökningen**
   - Lägg till `is_active = true`.
   - Byt `select("*")` mot samma explicita kolumnlista som huvudsökningen (`SEARCH_COLUMNS`).
   - Byt uteslutning av redan visade bilar från en kedja av `neq` till ett enda `not in`-uttryck.
   - Stoppa direkt på första nivån som ger träffar (görs redan) men börja med snävast nivå och begränsa till max 2 nivåer.

2. **Låt aldrig anropet hänga**
   - Sätt en tidsgräns på AI-motiveringarna; hinner de inte klart returneras bilarna ändå utan motivering, i stället för att hela svaret dör.

3. **Synlig återkoppling i UI:t**
   - Visa en toast vid fel ("Kunde inte hämta fler bilar – försök igen") i stället för tyst `console.error`.
   - Om filtren saknas i sessionStorage: visa ett meddelande om att söka på nytt, i stället för att knappen inte gör något.

## Teknisk sammanfattning

| Fil | Ändring |
|---|---|
| `supabase/functions/guided-search/index.ts` | load_more-grenen: `is_active`-filter, `SEARCH_COLUMNS`, `not in`-exkludering, färre relaxeringsnivåer, timeout på AI-motivering |
| `src/pages/Index.tsx` | `handleLoadMore`: toast vid fel och vid saknade filter |

Förväntat resultat: "Visa fler" svarar på ungefär en sekund, och om något ändå går fel får användaren tydlig återkoppling i stället för en död knapp.
