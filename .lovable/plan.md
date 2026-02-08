

## Fix: Lagg till findcar.se i CORS-whitelist for alla edge-funktioner

### Problemet

Nar en besokare oppnar sidan via `findcar.se` eller `www.findcar.se` skickar webblasaren `origin: https://findcar.se`. Edge-funktionerna har en strict CORS-whitelist som bara tillater `*.lovable.app`, `*.lovableproject.com` och `localhost`. Darfor blockerar webblasaren alla svar fran edge-funktionerna, vilket gor att losenordsverifiering, sokning och allt annat som anropar backend slutar fungera.

### Losning

Lagga till tva nya monster i `ALLOWED_ORIGIN_PATTERNS` i alla tre edge-funktioner:

```text
/^https:\/\/(www\.)?findcar\.se$/
```

Detta tillater bade `https://findcar.se` och `https://www.findcar.se`.

### Filer som andras

**1. `supabase/functions/verify-password/index.ts`**
- Lagga till `findcar.se`-monstret i `ALLOWED_ORIGIN_PATTERNS`-arrayen (rad 4-8)

**2. `supabase/functions/verify-admin-password/index.ts`**
- Samma andring i `ALLOWED_ORIGIN_PATTERNS`-arrayen (rad 4-8)

**3. `supabase/functions/guided-search/index.ts`**
- Samma andring i `ALLOWED_ORIGIN_PATTERNS`-arrayen (rad 5-9)

### Exempel pa andringen

Fran:
```typescript
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];
```

Till:
```typescript
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/(www\.)?findcar\.se$/,
];
```

### Efter implementering

Nar andringarna ar gjorda och edge-funktionerna ar deployade kommer `findcar.se` och `www.findcar.se` fungera fullt ut -- inklusive losenordsinloggning, bilsokning och admin-panelen.

