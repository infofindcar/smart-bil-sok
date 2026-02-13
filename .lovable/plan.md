
## Lägg in ny logga i projektet

### Vad som ska göras

Du vill ha den nya FindCar-loggan i projektet så att du sedan kan bestämma var den ska användas (i Header, Footer, eller någon annanstans).

### Implementering

**Steg 1: Kopiera loggan från user-uploads till projektet**

Den nya loggan kommer läggas i `src/assets/` tillsammans med övriga bildeluppsatser. Filnamn: `findcar-logo-new.png`

Anledning: `src/assets/` är rätt plats för loggor och bilder som används i React-komponenter, och de importeras sedan som ES6-moduler.

**Steg 2: Efter kopiering**

Du kan sedan själv bestämma:
- Om denna ska ersätta den befintliga `findcar-logo.png` i Header och Footer
- Eller om den ska användas på specifika ställen
- Vi kan uppdatera komponenterna (`Header.tsx`, `Footer.tsx`) när du säger till

### Teknisk notering

- Befintlig logga: `src/assets/findcar-logo.png` (används i `Header.tsx` och `Footer.tsx`)
- Ny logga kommer: `src/assets/findcar-logo-new.png` (redo för användning)
- Du har full kontroll över nästa steg 👍

