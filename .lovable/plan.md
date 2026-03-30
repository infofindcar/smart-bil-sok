
Samlad plan för att fixa hur AI-skrivandet känns i chatten

Mål:
När Clutch skriver ska det kännas följsamt, premium och läsbart på mobil — inte hackigt, inte segt, och inte som att scrollen “slåss” med texten.

Vad som är fel nu:
- I `GuidedSearch.tsx` triggas autoscroll på varje förändring i `visibleText`.
- Samma svar skrivs ut tecken för tecken med mycket täta uppdateringar.
- Det gör att chatten flyttas i små steg hela tiden, vilket ger ett ryckigt intryck.
- Session replay visar just sådana små upprepade scroll-förflyttningar medan texten skrivs.

Implementationsplan

1. Byt ut nuvarande autoscroll mot en dedikerad “follow typing”-scroll
- Ta bort den rena `scrollTop = scrollHeight`-logiken som körs på varje render.
- Inför en liten scroll-controller i `GuidedSearch.tsx` som:
  - håller koll på önskat bottenläge
  - uppdaterar scrollen via `requestAnimationFrame`
  - rör sig snabbt men mjukt mot botten istället för att hoppa varje tecken
- Lösningen ska vara hybrid:
  - stora avstånd fångas upp snabbt
  - sista biten ease:as in så det fortfarande känns smooth

2. Gör autoscrollen smartare under skrivandet
- Bara auto-följ när användaren faktiskt är nära botten i chatten.
- Om användaren scrollar upp manuellt, pausa autoscroll så UI inte känns aggressivt.
- När nytt AI-svar börjar kan follow-läget återaktiveras.
- Lägg in en liten bottom-anchor/sentinel längst ner i chatten så scrollmålet blir stabilt.

3. Justera typewriter-effekten så den känns mindre hackig
- Behåll känslan av att AI skriver, men minska antalet visuella småsteg.
- Gå från strikt 1 tecken per tick till dynamisk chunking, t.ex. 2–4 tecken åt gången eller snabbare chunking i längre svar.
- Lägg gärna mikropauser efter punkt/komma/frågetecken så skrivandet fortfarande känns mänskligt.
- Resultat-callbacken (`onResults`) och förslag ska fortfarande triggas först när skrivningen är klar.

4. Stabilisera bubble-upplevelsen visuellt
- Behåll caret/blinkmarkören, men se till att själva bubblan inte känns som att den “drar” scrollen i mikrosteg.
- Lägg lite extra luft i botten av chattytan så det sista svaret inte ligger klistrat mot inputen.
- Säkerställ att loading-bubblan och typewriter-bubblan inte skapar dubbla rörelser ovanpå varandra.

5. QA på mobilflödet
- Testa på 390px-bredd med:
  - kort AI-svar
  - långt AI-svar som kräver flera scrollsteg
  - manuell scroll upp mitt under skrivning
  - återgång till botten
  - övergång till sökresultat
- Kontrollera att känslan nu är:
  - smooth
  - snabb nog att hänga med
  - utan hackiga pixelsteg

Filer som bör ändras
- `src/components/GuidedSearch.tsx` — huvudfix för typing + autoscroll
- `src/index.css` — ev. liten finjustering av chattyta/spacing om det behövs för mjukare visuellt intryck

Tekniska detaljer
- Nuvarande problem sitter främst i kombinationen:
  - `visibleText` uppdateras mycket ofta
  - `useEffect([...visibleText])` kör scroll varje gång
- Jag skulle därför flytta scrollstyrningen bort från render-baserad effekt till en kontrollerad scroll-loop med refs, exempelvis:
  - `isAutoFollowRef`
  - `targetScrollTopRef`
  - `scrollRafRef`
  - `typingTimeoutRef`
- Det ger mycket bättre kontroll än CSS `scroll-behavior: smooth`, som tidigare blev för långsam.

Förväntat resultat
- AI-texten känns fortfarande levande
- Scrollen följer med utan att hamna efter
- Det visuella intrycket blir lugnare och mer professionellt på mobil
