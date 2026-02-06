
## Clutch blir en intelligent konversationsbaserad radgivare

### Oversikt
Clutch ska vara en riktig AI som forstar vad kunden sager, tanker sjalv pa vilka fragor som ar relevanta att stalla, och samlar tillrackligt med information innan den soker. Istallet for forinstaallda steg eller forslag ska Clutch ha ett naturligt samtal med kunden.

### Andringar

**1. Forenkla GuidedSearch-komponenten** (`src/components/GuidedSearch.tsx`)
- Ta bort allt relaterat till det gamla steg-systemet: `STEPS`, `SUGGESTIONS`, `_STEP_ORDER`, `getNextStep`, `SearchContext`, `ChatOption`
- Ta bort funktionerna: `handleStartGuided`, `handleSingleSelect`, `handleMultiToggle`, `handleMultiConfirm`, `showNextStep`, `handleSuggestion`
- Ta bort states: `context`, `multiSelections`, `currentStep` (ersatt med en enklare `phase`)
- Forenkla `Step`-typen till bara `'chatting' | 'searching' | 'results'`
- Ta bort hela sektionen for "Guided options" (knapparna for single/multi-select)
- Ta bort hela "Suggestions"-sektionen (forslagskorten och guidad sokning-knappen)
- Uppdatera halsningen till: "Hej! Jag ar Clutch -- din objektiva bilradgivare. Beskriv kort vad du behover sa hjalper jag dig hitta den perfekta bilen."
- `handleSendMessage` skickar hela `messages`-historiken till edge-funktionen istallet for en `context`-objekt
- Ny logik for svar: om edge-funktionen returnerar `action: "ask"` visas fragan som ett nytt assistant-meddelande. Om den returnerar `action: "search"` med bilar visas sokanimationen och sedan resultaten
- Behall input-omradet, reset-knappen och SearchAnimation

**2. Uppdatera edge-funktionen till en konversations-AI** (`supabase/functions/guided-search/index.ts`)
- Ta emot `messages`-array (konversationshistorik) istallet for bara `context`
- Ny huvudprompt som gor att Clutch:
  - Analyserar hela konversationen och forstar kontexten
  - Stallar EN relevant uppfoljningsfraga at gangen baserat pa vad som saknas
  - Tanker intelligent pa vad kunden behover (t.ex. lang pendling = bransleeffektivitet, familj = utrymme)
  - Bestammer sjalv nar tillrackligt med info finns for att soka
  - Max 3-5 fragor innan sokning
- Svar-format fran AI:n:
  - `{ "action": "ask", "message": "..." }` -- Clutch stallar en fraga
  - `{ "action": "search", "filters": { "budget": "0-300000", "fuel": [...], ... } }` -- gor sokningen
- Nar `action: "search"` returneras, kor databassokningen med `.limit(3)` istallet for `.limit(6)`
- Behall progressive relaxation och AI-genererade resultatmeddelanden

**3. Konversationsflode (exempel)**

```text
Kund: "Jag behover en bil"
Clutch: "Vad ska bilen framst anvandas till? Pendling, familj, eller kanske lite av varje?"

Kund: "Pendlar 8 mil om dagen"
Clutch: "Det ar en lang pendling! Da ar bransleeffektivitet och komfort viktigt. 
         Vilken budget har du i ataanke?"

Kund: "Max 250 000"
Clutch: "Bra! Och var bor du nagonting? Det hjalper mig hitta bilar i narheten."

Kund: "Smaland"
Clutch: [soker automatiskt -- forstar att diesel/laddhybrid, kombi/sedan, runt 
         Jonkoping ar ratt val]
```

### Tekniska detaljer

**`src/components/GuidedSearch.tsx` -- ny struktur:**
- `phase` state: `'chatting' | 'searching' | 'results'`
- `messages` state: array med `{ id, role, content }` (inga options/multiSelect langre)
- `handleSendMessage`: bygger `conversationHistory` fran messages-arrayen, skickar till edge-funktionen
- Hantering av svar: kollar `data.action` -- om `"ask"` laggs fragan till som assistant-meddelande, om `"search"` visas animation och sedan resultat via `onResults`
- Hela UI:t: header, chat-area, input-area, reset-knapp (inga guided options eller suggestions)

**`supabase/functions/guided-search/index.ts` -- ny struktur:**
- Tar emot `{ messages: [{ role, content }] }`
- Ny AI-systemprompt som instruerar Clutch att:
  - Analysera konversationen och identifiera vad som saknas (budget, plats, anvandning, drivlina, karosstyp, etc.)
  - Om viktig information saknas: returnera `{ "action": "ask", "message": "..." }`
  - Om tillrackligt med info samlats (minst budget + anvandning eller ~3-4 fragor stallda): returnera `{ "action": "search", "filters": { ... } }`
  - Vara smart om vilka fragor som ar relevanta -- om kunden redan namnt allt, sok direkt
- Nar `action: "search"`, kor befintlig soklogik med progressive relaxation men med `.limit(3)`
- Behall AI-genererat resultatmeddelande
