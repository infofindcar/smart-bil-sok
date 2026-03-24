// scripts/import-cars.js
//
// Hämtar billistings från din datakälla och skickar dem till
// Supabase Edge Function (sync-cars) som hanterar import + rensning.
//
// HUR DU ANVÄNDER DET:
//   1. Fyll i YOUR_API_URL nedan med URL:en till din bildata
//   2. Sätt miljövariabler (eller skapa en .env-fil):
//        SUPABASE_SYNC_URL  = URL till sync-cars edge function
//        SYNC_SECRET        = ditt hemliga lösenord (samma som i Supabase secrets)
//   3. Kör:  node scripts/import-cars.js
//
//   KRAV: Node.js version 18 eller nyare
//
// ============================================================
// STEG 1: Fyll i din API-URL här
// ============================================================
const YOUR_API_URL = "https://DIN-API-URL-HÄR/bilar.json";
// ============================================================

const SUPABASE_SYNC_URL = process.env.SUPABASE_SYNC_URL;
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SUPABASE_SYNC_URL || !SYNC_SECRET) {
  console.error("FEL: Miljövariabler saknas.");
  console.error("  Sätt SUPABASE_SYNC_URL och SYNC_SECRET innan du kör scriptet.");
  console.error("");
  console.error("  Exempel:");
  console.error("  SUPABASE_SYNC_URL=https://bvqveqoschdpenvbxygj.supabase.co/functions/v1/sync-cars SYNC_SECRET=ditt-hemliga-lösenord node scripts/import-cars.js");
  process.exit(1);
}

if (YOUR_API_URL.includes("DIN-API-URL-HÄR")) {
  console.error("FEL: Du måste fylla i YOUR_API_URL i scriptet först.");
  console.error("  Öppna scripts/import-cars.js och ersätt 'DIN-API-URL-HÄR' med din riktiga URL.");
  process.exit(1);
}

async function main() {
  console.log(`Hämtar bildata från: ${YOUR_API_URL}`);

  // Steg 1: Hämta bildata från din källa
  const dataResponse = await fetch(YOUR_API_URL);
  if (!dataResponse.ok) {
    throw new Error(`Kunde inte hämta bildata: ${dataResponse.status} ${dataResponse.statusText}`);
  }

  const rawData = await dataResponse.json();

  // Steg 2: Normalisera till en array
  // Om din API returnerar en array direkt, eller inpackad i ett objekt – justera här.
  const cars = Array.isArray(rawData)
    ? rawData
    : rawData.cars ?? rawData.data ?? rawData.listings ?? rawData.results;

  if (!Array.isArray(cars)) {
    throw new Error(
      "Kunde inte hitta en bil-array i API-svaret. " +
      "Kontrollera och justera raden 'const cars = ...' i scriptet."
    );
  }

  console.log(`Hittade ${cars.length} bilar. Skickar till Supabase...`);

  // Steg 3: Skicka till sync-cars edge function
  const syncResponse = await fetch(SUPABASE_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify({ cars }),
  });

  const result = await syncResponse.json();

  if (!syncResponse.ok || !result.success) {
    console.error("Synkronisering misslyckades:", result.error ?? "Okänt fel");
    process.exit(1);
  }

  console.log("");
  console.log("✓ Synkronisering klar!");
  console.log(`  Nya bilar:      ${result.added}`);
  console.log(`  Uppdaterade:    ${result.updated}`);
  console.log(`  Inaktiverade:   ${result.deactivated} (sålda/borttagna)`);
  console.log(`  Totalt skickat: ${result.total}`);
  console.log(`  Tid:            ${result.durationMs}ms`);
}

main().catch((err) => {
  console.error("Fel:", err.message);
  process.exit(1);
});
