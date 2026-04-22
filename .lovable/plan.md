

## Plan: Snyggare och smidigare Clutch-chat (desktop, tablet, mobil)

Nuvarande chat fungerar men känns "spretig" — bubblorna är platta, headern är liten, animationerna kan kännas hackiga vid typewriter, och layouten skalar inte optimalt mellan device-storlekar. Jag gör en designöverhaul + prestandafix utan att röra själva chat-logiken.

---

### Del 1: Visuella förbättringar (snyggare känsla)

**A) Premium chat-container**
- Mjukare, större border-radius (rounded-2xl → rounded-3xl på desktop)
- Subtil gradient-bakgrund i kortet (från `bg-card` till en lätt tonad nyans)
- Tydligare skugga med två lager (`shadow-2xl` + inre highlight) för djup
- Subtil glow-effekt runt kortet när användaren skriver (fokus-state)

**B) Snyggare header**
- Större avatar (8x8 → 10x10) med gradient-bakgrund (primary → secondary) istället för platt
- Ny "online"-indikator: pulserande grön prick med ring
- Lägg till undertext "Din bilrådgivare" / "Online — svarar direkt" under "Clutch"
- Språkväljare och reset blir snyggare ikon-knappar med tooltip istället för text-pills

**C) Bubblor med karaktär**
- Assistent-bubblor: mjuk gradient (muted → muted/40), tydligare avatar med sparkles-ikon i gradient-cirkel
- Användar-bubblor: gradient (secondary → secondary/85), subtil shine-effekt
- Större padding (py-3 px-4) och bättre line-height
- Mjuk fade-in + slide-up animation (translateY 8px → 0) istället för bara fade
- Tail/stub på bubblan (rounded-bl-md / rounded-br-md) för chat-känsla

**D) Snyggare typing-indikator**
- Ersätter de tre prickarna med en mjukare våg-animation
- Avatar bredvid med en subtil pulse-ring för att signalera "tänker"

**E) Quick-reply chips**
- Pill-form med subtil gradient-border vid hover
- Ikoner till vänster i varje förslag (typ 💼 för pendel, 👨‍👩‍👧 för familj)
- Stagger-animation när de dyker upp (50ms delay mellan varje)

**F) Inputfält**
- Större, mjukare (rounded-2xl), inre skugga
- Animerad placeholder som fade:ar in/ut vid språkbyte
- Send-knappen får gradient + scale-animation vid hover
- Mic-knappen får tydligare aktivt läge med animerad ring

---

### Del 2: Responsiv finess (desktop / tablet / mobil)

**Desktop (≥1024px)**
- Bredare kort (max-w-3xl → max-w-4xl)
- Större typsnitt i bubblor (text-[15px])
- Mer luft (px-8 py-5 i header)
- Side-by-side suggestions (3 kolumner)

**Tablet (768–1023px)**
- max-w-2xl, kompakt header
- Suggestions i 2 kolumner
- Touch-targets minst 44px

**Mobil (<768px)**
- Behåll expand-in-place-logiken (calc(100dvh - 120px))
- **Förbättring:** Fixera input-fältet i botten med safe-area-inset-bottom (för iPhone notch)
- Header krymper till sticky 56px med backdrop-blur OCH visar bara avatar + "Clutch"
- Suggestions blir fullbredd-pills med större touch-yta (py-3)
- Subtil "swipe down to close" gesture på expanded chat (visuell hint)

---

### Del 3: Prestanda (mindre lagg)

Nuvarande lagg-källor jag identifierat:

**1. Typewriter scroll-loop kör för aggressivt**
- Just nu: setVisibleText vid varje karaktär + scroll-rAF varje 200ms
- Fix: Batcha typewriter-uppdateringar med `requestAnimationFrame` istället för `setTimeout` per char → mycket smoothare på mobil

**2. Textarea auto-resize triggar layout-thrashing**
- Just nu: två separata `requestAnimationFrame` + `style.height = 'auto'` per keystroke
- Fix: använd `field-sizing: content` (modern CSS) som fallback till nuvarande logik, OCH cachea senaste höjd för att skippa onödiga writes

**3. Animate-fade-in körs på ALLA meddelanden vid varje render**
- Fix: lägg `key`-baserad animation bara på nya meddelanden (track via ref), så gamla meddelanden inte re-animeras vid scroll

**4. Suggestions re-renderar vid varje typewriter-tick**
- Fix: Memoize suggestions-blocket med `React.memo` så det inte rerenderas medan visibleText uppdateras

**5. Scroll-loop kan fortsätta köra onödigt**
- Fix: Stoppa rAF-loopen helt när användaren scrollat upp manuellt (inte bara pausa auto-follow)

**6. Bubble-höjd transition (`transition-[height]`) triggar reflow**
- Fix: Ta bort transition-[height] (browser kan inte animera height: auto effektivt) → använd CSS `interpolate-size: allow-keywords` eller bara skippa height-transition

---

### Del 4: Mikrointeraktioner som höjer känslan

- Subtil "whoosh"-ljud-känsla via animation när meddelande skickas (scale + fade)
- Avatar pulserar mjukt när Clutch "tänker"
- Send-knapp blir disabled med subtil färgändring istället för bara opacity
- Reset-knapp får confirmation-tooltip vid hover (förhindra oavsiktlig reset)
- Smooth scroll-to-bottom-knapp får gradient-bg + bounce-animation

---

### Filer som ändras

- `src/components/GuidedSearch.tsx` — All chat-UI: header, bubblor, suggestions, input, prestandafix
- `src/index.css` — Nya keyframes: `bubble-in`, `wave-typing`, `avatar-pulse`, `chip-stagger`. Plus `interpolate-size` regel för smooth height
- `src/components/SearchAnimation.tsx` — Lätt polering så den matchar nya designspråket

Inga ändringar i logik, edge functions, sessionStorage, eller chat-flow. Allt nuvarande beteende (voice, språkval, persist, reset, strict filter) bevaras exakt.

