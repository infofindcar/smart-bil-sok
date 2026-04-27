

## Plan: Mer realistisk hero-video + rensa proof-text

### Vad som ändras

**1. Ny realistisk hero-video (sömlös loop)**

Ersätter nuvarande genererade video med en **äkta cinematic bilbild** som loopar sömlöst. Två alternativ — jag bygger båda och du behåller den du gillar:

- **Alternativ A — Riktigt filmmaterial:** Hämtar en högkvalitativ, royalty-fri bilvideo (t.ex. från Pexels/Coverr — bil som kör genom landskap eller stadsmiljö i skymning). Trimma till ~8s, applicera *crossfade-loop* (sista 0.5s blendar in i första 0.5s) via ffmpeg så loopen blir helt osynlig.
- **Alternativ B — Generera ny cinematic clip:** Använda AI-video med tydlig prompt: "cinematic slow tracking shot of luxury car driving through Scandinavian forest road, golden hour, shallow depth of field, 8 seconds, seamless loop". Sedan samma ffmpeg crossfade-behandling.

Jag kör **Alternativ A först** (mer realistiskt = vad du efterfrågar), och om resultatet inte sitter byter vi till B.

**Loop-tekniken (viktigast):**
```
ffmpeg crossfade-loop:
- Tar sista 15 frames och blendar med första 15 frames
- Lägger till `loop` attribut + lite negative `marginTop` på video element
- Ingen synlig "snap" när videon startar om
```

**2. Rensa hero-content (mobil + desktop)**

Tar bort dessa två element från både mobil- och desktop-vyn:
- `1 200+ sökningar gjorda` pillen (med gröna pricken)
- `✔ Tar 30 sek · Gratis · Objektiv rådgivning` raden

Resultat: renare hero med bara **rubrik + undertext + CTA-knapp**. Mer premium, mindre "landningssida-feeling".

**3. Mindre layoutjustering**

Eftersom proof-blocken försvinner får CTA-knappen lite mer luft under sig. Justerar `mb-10`/`mb-12` så centreringen fortfarande känns balanserad.

---

### Filer som ändras

- `src/assets/hero-video.mp4` — ersätts med ny realistisk loop-video
- `src/pages/Index.tsx` — tar bort proof-pillen + tagline-raden i båda hero-vyerna

Inga andra ändringar. Allt nuvarande beteende (parallax, video-overlay, CTA-funktion, scroll-arrow) bevaras.

