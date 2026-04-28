// scripts/import-cars.js
//
// Blocket → sync-cars. Filtrerar bort leasing (3-stegs: Blocket-flaggor →
// pris-heuristik → text-pattern) och privatannonser. Leasingfiltret speglas
// även i guided-search. Se CLAUDE.md "Viktiga konventioner → Leasingfilter".
// Berikelse (färg, modelldata) sker separat via enrich-batch.
//
// HUR DU ANVÄNDER DET:
//   SUPABASE_SYNC_URL=... SYNC_SECRET=... node scripts/import-cars.js
//
//   KRAV: Node.js version 18 eller nyare (ingen npm install behövs)

const BLOCKET_API_BASE = "https://blocket-api.se/v1/search/car";
const PAGES_PER_INTERVAL = 50;

// 30 prisintervall som täcker hela prisskalan (SEK)
// Varje intervall kan ge upp till 2 500 unika bilar (50 sidor × 50 bilar)
const PRICE_INTERVALS = [
  [0,        25000],
  [25000,    50000],
  [50000,    75000],
  [75000,    100000],
  [100000,   125000],
  [125000,   150000],
  [150000,   175000],
  [175000,   200000],
  [200000,   225000],
  [225000,   250000],
  [250000,   275000],
  [275000,   300000],
  [300000,   325000],
  [325000,   350000],
  [350000,   375000],
  [375000,   400000],
  [400000,   425000],
  [425000,   450000],
  [450000,   475000],
  [475000,   500000],
  [500000,   550000],
  [550000,   600000],
  [600000,   700000],
  [700000,   800000],
  [800000,   900000],
  [900000,   1000000],
  [1000000,  1250000],
  [1250000,  1500000],
  [1500000,  2000000],
  [2000000,  999999999],
];

const SUPABASE_SYNC_URL = process.env.SUPABASE_SYNC_URL;
const SYNC_SECRET       = process.env.SYNC_SECRET;

if (!SUPABASE_SYNC_URL || !SYNC_SECRET) {
  console.error("FEL: SUPABASE_SYNC_URL och SYNC_SECRET krävs.");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Märkes-defaults för drivlina
// ─────────────────────────────────────────────
const DEFAULT_RWD_MAKES = new Set([
  "BMW", "Mercedes-Benz", "Jaguar", "Lexus", "Maserati",
  "Alfa Romeo", "Dodge", "Chevrolet", "Ford", "Cadillac",
  "Chrysler", "Jeep", "Porsche",
]);
const DEFAULT_AWD_MAKES = new Set(["Subaru"]);

function parseModelRaw(modelRaw, make) {
  const raw = modelRaw ?? "";
  const hpMatch = raw.match(/(\d{2,4})\s*h[pk]/i);
  const horsepower = hpMatch ? parseInt(hpMatch[1]) : null;

  let drivetrain = null;
  if (/quattro|xdrive|4matic|4motion|4x4|\bawd\b|\b4wd\b|allrad|syncro|e-awd|\b4M\b/i.test(raw)) {
    drivetrain = "AWD";
  } else if (/\bfwd\b|framhjulsdrift/i.test(raw)) {
    drivetrain = "FWD";
  } else if (/\brwd\b|bakhjulsdrift/i.test(raw)) {
    drivetrain = "RWD";
  }

  if (!drivetrain && make) {
    if (DEFAULT_AWD_MAKES.has(make)) drivetrain = "AWD";
    else if (DEFAULT_RWD_MAKES.has(make)) drivetrain = "RWD";
  }

  return { horsepower, drivetrain };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Hämta ett prisintervall (upp till PAGES_PER_INTERVAL sidor)
// ─────────────────────────────────────────────
async function fetchInterval(priceMin, priceMax) {
  const cars = [];

  for (let page = 1; page <= PAGES_PER_INTERVAL; page++) {
    // 200ms paus för att undvika Blocket rate limiting
    if (page > 1) await sleep(200);

    const url = priceMax >= 999999999
      ? `${BLOCKET_API_BASE}?page=${page}&price_from=${priceMin}`
      : `${BLOCKET_API_BASE}?page=${page}&price_from=${priceMin}&price_to=${priceMax}`;

    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      console.warn(`  Nätverksfel sida ${page} [${priceMin}-${priceMax}]:`, e.message);
      break;
    }

    if (!res.ok) {
      console.warn(`  Sida ${page} misslyckades (${res.status}), avslutar intervall.`);
      break;
    }

    const data = await res.json();
    const pageCars = Array.isArray(data)
      ? data
      : data.docs ?? data.cars ?? data.data ?? data.listings ?? data.results ?? data.ads ?? [];

    if (pageCars.length === 0) break;

    cars.push(...pageCars);
  }

  return cars;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const seen = new Set();
  const allMapped = [];
  let totalFetched = 0;
  let leasingCount = 0;
  let privateCount = 0;
  let noImageCount = 0;
  let noRegnoCount = 0;

  for (let i = 0; i < PRICE_INTERVALS.length; i++) {
    const [priceMin, priceMax] = PRICE_INTERVALS[i];
    const label = priceMax >= 999999999 ? `${priceMin}+` : `${priceMin}-${priceMax}`;
    console.log(`Intervall ${i + 1}/${PRICE_INTERVALS.length}: ${label} kr`);

    const raw = await fetchInterval(priceMin, priceMax);
    totalFetched += raw.length;

    let intervalKept = 0;

    for (const car of raw) {
      if (!car.id) continue;

      // Deduplicera på source_listing_id
      const sid = String(car.id);
      if (seen.has(sid)) continue;
      seen.add(sid);

      // Filtrera bort leasing – officiella Blocket-flaggor
      if (car.sales_form === 5 || car.ad_type === 200) {
        leasingCount++;
        continue;
      }

      // Heuristik-fallback 1: orimligt lågt pris = trolig leasing-månadskostnad
      const priceAmount = car.price?.amount ?? 0;
      if (priceAmount > 0 && priceAmount < 20000) {
        leasingCount++;
        continue;
      }

      // Heuristik-fallback 2: text-baserade leasingmarkörer i model_specification
      const spec = String(car.model_specification ?? "");
      if (/(leasbar|leasebar|leas\.bar|privatleas|business\s*lease|lease\s+fr[åa]n|leasing\s+fr[åa]n|lease\s+fr\.|leasing\s+fr\.)/i.test(spec)) {
        leasingCount++;
        continue;
      }

      // Heuristik 2: pris < 12 000 kr + leasing/månads-text i titeln betyder
      // att 'priset' faktiskt är månadsbeloppet, inte köp-pris. Återförsäljaren
      // har då glömt sätta sales_form=5/ad_type=200. Reella köpannonser med
      // hög prisetikett som råkar nämna "kr/mån"-finansiering filtreras inte.
      const rawSpec = (car.model_specification ?? "").toString();
      const priceForLeaseCheck = car.price?.amount ?? Number.MAX_SAFE_INTEGER;
      if (
        priceForLeaseCheck < 12000 &&
        /leasing|kr\s*\/\s*m[åa]n|:-?\s*\/\s*m[åa]n|\/\s*m[åa]n/i.test(rawSpec)
      ) {
        leasingCount++;
        continue;
      }

      // Filtrera bort privat (organisation_name saknas)
      if (!car.organisation_name) {
        privateCount++;
        continue;
      }

      // Filtrera bort bilar utan bild
      if (!car.image?.url) {
        noImageCount++;
        continue;
      }

      // Filtrera bort bilar utan regnr — krävs för Transportstyrelsen-länken
      // och unik identifiering. Privatannonser och vissa nybilar saknar det.
      const regno = typeof car.regno === "string" ? car.regno.trim() : "";
      if (regno.length < 4) {
        noRegnoCount++;
        continue;
      }

      const { horsepower, drivetrain } = parseModelRaw(car.model_specification, car.make);

      allMapped.push({
        source_listing_id: sid,
        make:          car.make ?? null,
        model:         car.model ?? null,
        model_raw:     car.model_specification ?? null,
        model_clean:   car.model ?? null,
        year:          car.year ?? null,
        price:         car.price?.amount ?? null,
        mileage:       car.mileage ?? null,
        city:          car.location ?? null,
        fuel_type:     car.fuel ?? null,
        transmission:  car.transmission ?? null,
        drivetrain,
        horsepower,
        dealer_name:   car.organisation_name ?? null,
        image_thumb_url: car.image?.url ?? null,
        listing_url:   car.canonical_url ?? null,
        regnr:         car.regno ?? null,
        source:        "blocket",
      });
      intervalKept++;
    }

    console.log(`  Råa: ${raw.length}, Unika kvar: ${intervalKept} (totalt buffrat: ${allMapped.length})`);

    // 500ms paus mellan intervall
    if (i < PRICE_INTERVALS.length - 1) await sleep(500);
  }

  console.log(`\n=== IMPORT KLAR ===`);
  console.log(`  Totalt hämtat:       ${totalFetched}`);
  console.log(`  Unika bilar:         ${seen.size}`);
  console.log(`  Leasing filtrerade:  ${leasingCount}`);
  console.log(`  Privat filtrerade:   ${privateCount}`);
  console.log(`  Utan bild:           ${noImageCount}`);
  console.log(`  Utan regnr:          ${noRegnoCount}`);
  console.log(`  Skickar till sync:   ${allMapped.length}`);

  if (allMapped.length === 0) {
    console.error("Inga bilar hittades. Kontrollera API:et.");
    process.exit(1);
  }

  const syncResponse = await fetch(SUPABASE_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify({ cars: allMapped }),
  });

  const result = await syncResponse.json();

  if (!syncResponse.ok || !result.success) {
    console.error("Synkronisering misslyckades:", result.error ?? "Okänt fel");
    process.exit(1);
  }

  console.log("\n✓ Synkronisering klar!");
  console.log(`  Nya bilar:      ${result.added}`);
  console.log(`  Uppdaterade:    ${result.updated}`);
  console.log(`  Borttagna:      ${result.deleted}`);
  console.log(`  Totalt:         ${result.total}`);
  console.log(`  Tid:            ${result.durationMs}ms`);
}

main().catch((err) => {
  console.error("Fel:", err.message);
  process.exit(1);
});
