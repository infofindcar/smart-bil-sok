

## Plan: Lägg till röstinmatning i Clutch-chatten

### Vad som ändras

En mikrofonknapp läggs till bredvid textfältet i chatten. Användaren kan trycka på den för att tala — talet omvandlas till text via webbläsarens inbyggda `Web Speech API` (SpeechRecognition) och fylls i automatiskt i textfältet.

### Tekniska detaljer

**Fil: `src/components/GuidedSearch.tsx`**

1. **Importera `Mic` och `MicOff`** ikoner från lucide-react
2. **Lägg till state**: `isListening` (boolean) för att spåra om mikrofonen är aktiv
3. **Skapa en `SpeechRecognition`-instans** (med `webkitSpeechRecognition` fallback) som:
   - Sätter `lang` baserat på nuvarande språk (sv-SE / en-US)
   - Fyller `inputValue` med transkriberad text via `onresult`
   - Hanterar `onerror` och `onend` för att återställa state
4. **Rendera en mikrofonknapp** mellan textfältet och skicka-knappen:
   - Inaktiv: visar `Mic`-ikon, klick startar lyssning
   - Aktiv: visar `MicOff` med pulsanimation, klick stoppar
   - Om webbläsaren inte stöder Speech API → knappen visas inte
5. **Continuous mode**: Lyssnar kontinuerligt tills användaren stoppar, text appendas till befintlig input

### Ingen backend-ändring behövs

Web Speech API körs helt i webbläsaren — ingen server eller API-nyckel krävs.

