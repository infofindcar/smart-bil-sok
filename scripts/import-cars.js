// scripts/import-cars.js
//
// Hämtar billistings från blocket-api.se och skickar dem till Supabase Edge Function (sync-cars).
// Berikelse (färg, modelldata) sker separat via enrich-batch.
//
// HUR DU ANVÄNDER DET:
//   SUPABASE_SYNC_URL=... SYNC_SECRET=... node scripts/import-cars.js
//
//   KRAV: Node.js version 18 eller nyare (ingen npm install behövs)

const BLOCKET_API_BASE = "https://blocket-api.se/v1/search/car";
const PAGES_PER_INTERVAL = 50;

/** Max antal bilder vi sparar per bil. */
const MAX_GALLERY_IMAGES = 15;

/**
 * Väljer vilka annonsbilder som ska sparas.
 * VIKTIGT: sista bilden tas ALLTID bort när det finns fler än en — bilfirmor
 * lägger ofta en avslutande bild med logga och kontaktuppgifter där.
 */
function pickGalleryImages(list, fallback) {
  const urls = (Array.isArray(list) ? list : [])
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);
  if (urls.length === 0) {
    const f = typeof fallback === "string" ? fallback.trim() : "";
    return f ? [f] : [];
  }
  if (urls.length > 1) urls.pop();
  return urls.slice(0, MAX_GALLERY_IMAGES);
}

// ─────────────────────────────────────────────
// Rensa bort reklam- och logobilder (image_urls_clean)
//
// Bilfirmor lägger ofta in banners ("vi köper din bil", garantiskyltar,
// logotyper) bland annonsbilderna — de får ALDRIG visas för kund.
// Blockets bild-CDN (Fastly) svarar på HEAD med originalstorlek och
// originalmått, vilket ger ett fingeravtryck per bild utan att ladda ner den.
// Samma fingeravtryck i mer än en annons = återanvänd banner.
// Bilder med onormalt bildformat (kvadratiska/stående/extremt breda) samt
// bilder vi inte kan bedöma tas också bort — hellre för få bilder än en
// enda främmande annons.
// ─────────────────────────────────────────────
const IMAGE_HEAD_CONCURRENCY = 100;

async function imageFingerprint(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const info = res.headers.get("fastly-io-info") ?? "";
    const size = /ifsz=(\d+)/.exec(info)?.[1];
    const dim = /idim=(\d+)x(\d+)/.exec(info);
    if (!size || !dim) return null;
    return { fp: `${size}:${dim[1]}x${dim[2]}`, w: Number(dim[1]), h: Number(dim[2]) };
  } catch {
    return null;
  }
}

function isCarPhotoShape(f) {
  const ratio = f.w / f.h;
  return ratio >= 1.15 && ratio <= 2.2 && f.w >= 400;
}

async function annotateCleanImages(cars) {
  const urls = [...new Set(cars.flatMap((c) => c.image_urls ?? []))];
  console.log(`Granskar ${urls.length} bilder för reklam/logo...`);

  const fps = new Map();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: IMAGE_HEAD_CONCURRENCY }, async () => {
      for (;;) {
        const idx = cursor++;
        if (idx >= urls.length) return;
        const f = await imageFingerprint(urls[idx]);
        if (f) fps.set(urls[idx], f);
      }
    }),
  );

  // Andra försöket för bilder som inte kunde bedömas (tillfälliga nätverksfel).
  // Utan detta tappar vi galleribilder i onödan.
  const unresolved = urls.filter((u) => !fps.has(u));
  if (unresolved.length > 0) {
    console.log(`  Gör om ${unresolved.length} obedömda bilder...`);
    let c2 = 0;
    await Promise.all(
      Array.from({ length: IMAGE_HEAD_CONCURRENCY }, async () => {
        for (;;) {
          const idx = c2++;
          if (idx >= unresolved.length) return;
          const f = await imageFingerprint(unresolved[idx]);
          if (f) fps.set(unresolved[idx], f);
        }
      }),
    );
  }

  // Räkna antal annonser per fingeravtryck (globalt räcker: en riktig bilbild
  // förekommer bara i en annons).
  const seenIn = new Map();
  for (const car of cars) {
    for (const url of new Set(car.image_urls ?? [])) {
      const f = fps.get(url);
      if (!f) continue;
      if (!seenIn.has(f.fp)) seenIn.set(f.fp, new Set());
      seenIn.get(f.fp).add(car.source_listing_id);
    }
  }

  let dropped = 0;
  for (const car of cars) {
    const main = car.image_thumb_url;
    const clean = [];
    for (const url of car.image_urls ?? []) {
      const isMain = url === main;
      const f = fps.get(url);
      if (!f) { if (isMain) clean.push(url); else dropped++; continue; }
      if (!isMain && (seenIn.get(f.fp)?.size ?? 0) > 1) { dropped++; continue; }
      if (!isMain && !isCarPhotoShape(f)) { dropped++; continue; }
      clean.push(url);
    }
    if (main && !clean.includes(main)) clean.unshift(main);
    car.image_urls_clean = clean.slice(0, MAX_GALLERY_IMAGES);
  }

  // Efterkontroll: hur många bilar hamnade utan galleri trots flera annonsbilder?
  const noGallery = cars.filter(
    (c) => (c.image_urls_clean?.length ?? 0) < 2 && (c.image_urls?.length ?? 0) > 1,
  ).length;
  const withGallery = cars.filter((c) => (c.image_urls_clean?.length ?? 0) > 1).length;

  console.log(`  Tog bort ${dropped} reklam-/osäkra bilder.`);
  console.log(`  Bilar med galleri: ${withGallery}/${cars.length}`);
  if (noGallery > 0) {
    console.log(`  OBS: ${noGallery} bilar fick bara en bild trots flera annonsbilder (allt rensat som reklam/osäkert).`);
  }
}

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

      // Filtrera bort leasing
      if (car.sales_form === 5 || car.ad_type === 200) {
        leasingCount++;
        continue;
      }

      // Heuristik-fallback: ny bil med månadsbelopp (trolig leasing)
      if ((car.year ?? 0) >= 2025 && (car.price?.amount ?? 0) < 10000) {
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

      // Skippa Bilförmedlingen – de hanteras via avtal_bilar/sync-bilformedlingen
      // Kontrollerar båda stavningarna (med och utan ö) eftersom Blocket kan variera
      const orgLower = car.organisation_name?.toLowerCase() ?? '';
      if (orgLower.includes('bilförmedlingen') || orgLower.includes('bilformedlingen')) continue;

      const { horsepower, drivetrain } = parseModelRaw(car.model_specification, car.make);

      const imageUrls = pickGalleryImages(car.image_urls, car.image?.url);

      allMapped.push({
        source_listing_id: sid,
        make:          car.make ?? null,
        model:         car.model ?? null,
        model_raw:     car.model_specification ?? null,
        model_clean:   car.model ?? null,
        year:          car.year ?? null,
        price:         car.price?.amount ?? null,
        mileage:       car.mileage ?? null, // Blocket skickar redan MIL (verifierat mot annonssida)
        city:          car.location ?? null,
        fuel_type:     car.fuel ?? null,
        transmission:  car.transmission ?? null,
        drivetrain,
        horsepower,
        dealer_name:   car.organisation_name ?? null,
        image_thumb_url: imageUrls[0] ?? car.image?.url ?? null,
        image_urls:    imageUrls.length > 0 ? imageUrls : null,
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
  console.log(`  Skickar till sync:   ${allMapped.length}`);

  if (allMapped.length === 0) {
    console.error("Inga bilar hittades. Kontrollera API:et.");
    process.exit(1);
  }

  // Granska bilderna innan de skickas — reklam/logo får aldrig nå kund.
  await annotateCleanImages(allMapped);

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
