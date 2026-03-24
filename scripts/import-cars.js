// scripts/import-cars.js
//
// Hämtar billistings från blocket-api.se (alla sidor) och skickar dem
// till Supabase Edge Function (sync-cars) som hanterar import + rensning.
//
// HUR DU ANVÄNDER DET:
//   Sätt miljövariabler och kör:
//     SUPABASE_SYNC_URL=... SYNC_SECRET=... node scripts/import-cars.js
//
//   KRAV: Node.js version 18 eller nyare (ingen npm install behövs)

const BLOCKET_API_BASE = "https://blocket-api.se/v1/search/car";
const TOTAL_PAGES = 20;

const SUPABASE_SYNC_URL = process.env.SUPABASE_SYNC_URL;
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SUPABASE_SYNC_URL || !SYNC_SECRET) {
  console.error("FEL: Miljövariabler saknas.");
  console.error("  Sätt SUPABASE_SYNC_URL och SYNC_SECRET innan du kör scriptet.");
  process.exit(1);
}

async function fetchAllCars() {
  const allCars = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`Hämtar sida ${page}/${TOTAL_PAGES}...`);

    const res = await fetch(`${BLOCKET_API_BASE}?page=${page}`);
    if (!res.ok) {
      console.warn(`  Varning: sida ${page} misslyckades (${res.status}), hoppar över.`);
      continue;
    }

    const data = await res.json();

    // Blocket-API returnerar typiskt en array direkt eller inpackad i ett objekt
    const cars = Array.isArray(data)
      ? data
      : data.docs ?? data.cars ?? data.data ?? data.listings ?? data.results ?? data.ads ?? [];

    if (cars.length === 0) {
      console.log(`  Sida ${page} är tom, avslutar hämtning.`);
      break;
    }

    allCars.push(...cars);
    console.log(`  Fick ${cars.length} bilar (totalt: ${allCars.length})`);
  }

  return allCars;
}

async function main() {
  const cars = await fetchAllCars();

  if (cars.length === 0) {
    console.error("Inga bilar hittades. Kontrollera API:et.");
    process.exit(1);
  }

  // Mappa Blockets fältnamn till databasens kolumnnamn
  const mappedCars = cars.map((car) => ({
    source_listing_id: String(car.id),
    make: car.make ?? null,
    model: car.model ?? null,
    year: car.year ?? null,
    price: car.price?.amount ?? null,
    mileage: car.mileage ?? null,
    city: car.location ?? null,
    fuel_type: car.fuel ?? null,
    transmission: car.transmission ?? null,
    image_thumb_url: car.image?.url ?? null,
    listing_url: car.canonical_url ?? null,
    regnr: car.regno ?? null,
    source: "blocket",
  }));

  console.log(`\nTotalt ${mappedCars.length} bilar hämtade. Skickar till Supabase...`);

  const syncResponse = await fetch(SUPABASE_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify({ cars: mappedCars }),
  });

  const result = await syncResponse.json();

  if (!syncResponse.ok || !result.success) {
    console.error("Synkronisering misslyckades:", result.error ?? "Okänt fel");
    process.exit(1);
  }

  console.log("\n✓ Synkronisering klar!");
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
