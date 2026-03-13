

## Problem

The `enrich-car-data` edge function processes all cars in a single invocation with batches of 5 and 1-second delays. With 700 cars, this takes ~2.5 minutes — far exceeding the 60-second Supabase Edge Function timeout.

## Solution: Chunked Processing with LIMIT + Admin Progress UI

### Edge Function Changes (`supabase/functions/enrich-car-data/index.ts`)

1. **Add a `LIMIT 25` to the query** — process max 25 cars per invocation instead of all
2. **Increase batch size from 5 to 10** with shorter delays (500ms)
3. **Remove the 1-second delay** between batches (unnecessary with only 25 cars)
4. **Return `remaining` count** so the frontend knows how many are left

This keeps each invocation well under the 60-second timeout (~15-20 seconds per run).

### Admin Page Changes (`src/pages/Admin.tsx`)

1. **Auto-loop**: After each successful call, if `remaining > 0`, automatically call the function again
2. **Progress indicator**: Show a progress bar with "X of Y cars enriched" using the `remaining` count
3. **Stop button**: Let the admin stop the loop manually
4. **Summary**: Show final totals when done

### Flow

```text
Admin clicks "Kör berikning"
  → Call enrich-car-data (processes 25 cars)
  ← Returns { remaining: 675, drivetrainUpdated: 12, colorUpdated: 18 }
  → Auto-call again (processes next 25)
  ← Returns { remaining: 650, ... }
  → ... repeats until remaining = 0
  ← "Klar! Totalt: 700 bilar berikade"
```

### Technical Details

- Each chunk: ~10-15 seconds (25 cars × 2 AI calls, parallelized in batches of 10)
- Total time for 700 cars: ~5-7 minutes with automatic chaining
- Rate limit safe: ~50 AI calls per chunk, well within per-minute limits
- Costs remain low with Gemini Flash models

