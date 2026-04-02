

## Plan: Förbättra Clutch-chattens UX

### Problem att lösa
1. **Auto-scroll fungerar inte korrekt på mobil** — chatten följer inte med nya meddelanden
2. **"Sök direkt"-knappen ska tas bort**
3. **Ny knapp: "Utgå endast från mina filter"** — strikt filterläge
4. **Mikrofonen fungerar inte på mobil** — troligen iOS-relaterat
5. **Fler UX-förbättringar för chattupplevelsen**

### Ändringar

#### 1. Fixa auto-scroll på mobil (GuidedSearch.tsx)
- Problemet: `scrollIntoView` och `scrollTop`-logiken funkar dåligt med mobilens virtuella tangentbord som ändrar viewport-höjden
- Lösning: Efter varje nytt meddelande och när tangentbordet öppnas, scrolla sista meddelandet till synligt med `scrollIntoView({ block: 'end' })` på sista meddelande-elementet istället för att räkna `scrollHeight`
- Lägg till `visualViewport`-lyssnare för att hantera tangentbordsändringar på iOS/Android
- Vid focus på textarea: scrolla input-arean synlig med kort delay

#### 2. Ta bort "Sök direkt"-knappen (GuidedSearch.tsx)
- Ta bort hela blocket på rad 610-618 som renderar `SEARCH_NOW`-knappen
- Ta bort `SEARCH_NOW`-konstanten (rad 106-112)

#### 3. Ny knapp: "Utgå från mina filter" (GuidedSearch.tsx + guided-search edge function)
- Lägg till en ny knapp bland suggestions-knappar: "Bara mina filter" / "Only my filters"
- När användaren klickar skickas ett meddelande som "Visa bara bilar som matchar mina exakta filter, inga extra förslag"
- Uppdatera `CONVERSATION_SYSTEM_PROMPT` i edge function: lägg till instruktion att om användaren säger att de bara vill ha sina filter ska AI:n inte lägga till egna förslag utan strikt följa filtren
- Lokalisera knappen för alla 5 språk

#### 4. Fixa röstinmatning på mobil (GuidedSearch.tsx)
- Problemet: `webkitSpeechRecognition` kräver HTTPS och funkar inte i alla mobila browsers
- Förbättra felhantering: visa toast om speech recognition inte stöds eller misslyckas
- Dölj mic-knappen helt om `speechSupported` är false (redan gjort) — men kontrollera att detekteringen fungerar korrekt på iOS Safari (som INTE stöder Web Speech API)
- Lägg till fallback: visa tydligt meddelande "Röstinmatning stöds inte i din webbläsare"

#### 5. Fler UX-förbättringar
- **Scroll-to-bottom-knapp**: Visa en liten pilknapp längst ner i chatten när användaren har scrollat upp, så de snabbt kan komma tillbaka
- **Typing indicator delay**: Lägg till kort delay innan typing-dots visas (300ms) för att undvika flicker vid snabba svar

### Filer som ändras
- `src/components/GuidedSearch.tsx` — auto-scroll fix, ta bort "Sök direkt", ny filter-knapp, mic-fix, scroll-to-bottom-knapp
- `supabase/functions/guided-search/index.ts` — uppdatera system prompt med strikt filter-instruktion

