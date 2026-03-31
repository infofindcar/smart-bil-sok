

## Plan: Förbättra bekräftelsemeddelandet efter inskickat formulär

### Vad som ändras

Uppdaterar texten som visas efter att formuläret skickats (rad 401-407 i `CarDetail.tsx`) till ett mer informativt och förtroendeingivande meddelande.

### Ny text

**Rubrik:** "Tack för din förfrågan!"

**Brödtext:** "Återförsäljaren har mottagit din förfrågan och kontaktar dig så snart som möjligt. Håll utkik i din inkorg och telefon!"

Eventuellt lägga till bilens namn i texten, t.ex. "...angående **{car.make} {model}**" för att bekräfta vilken bil det gäller.

### Teknisk ändring

**Fil: `src/pages/CarDetail.tsx`** (rad 401-407)
- Uppdatera rubrik och beskrivningstext i success-staten
- Lägg till bilnamnet i meddelandet för tydlighet

