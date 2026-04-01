

## Plan: Realtids-rösttranskription och visuell mikrofon-indikator

### Vad som ändras

1. **Realtids-text medan man pratar**: Ändra `interimResults` till `true` i SpeechRecognition-konfigurationen. Uppdatera `onresult`-hanteraren så att interim-resultat visas löpande i textfältet och ersätts med slutgiltiga resultat när de kommer.

2. **Visuell lyssnings-indikator**: Ersätt den enkla `animate-pulse` med en mer tydlig "lyssnar"-animation — pulsande ringar runt mikrofon-knappen som indikerar att ljud fångas.

### Tekniska detaljer

**Fil: `src/components/GuidedSearch.tsx`**

- Sätt `recognition.interimResults = true`
- Lägg till en `interimTranscriptRef` som håller koll på den senaste interim-texten
- I `onresult`: samla ihop alla `isFinal`-resultat plus senaste interim, sätt `inputValue` till `confirmedText + interimText`
- Uppdatera mikrofon-knappens styling: lägg till animerade ringar (pseudo-element via extra `<span>`-lager) som pulserar ut när `isListening` är true

**Fil: `src/index.css`**
- Lägg till en `@keyframes mic-ripple` animation för de pulsande ringarna

