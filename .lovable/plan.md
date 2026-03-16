

## Plan: Lägg till uppdateringsknapp på Admin Dashboard

Lägg till en "Uppdatera"-knapp bredvid statistiken på Admin-sidan som kör `fetchStats()` utan att ladda om hela sidan.

### Ändringar i `src/pages/Admin.tsx`:
- Lägg till en `isRefreshing`-state
- Lägg till en knapp med en `RefreshCw`-ikon (från lucide-react) bredvid rubriken eller ovanför stat-korten
- Knappen kör `fetchStats()` och visar en spinner medan den laddar
- Importera `RefreshCw` från lucide-react

En enkel ändring, ca 10 rader kod.

