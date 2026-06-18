// scripts/import-bilformedlingen.js
//
// Hämtar billistingar från Bilförmedlingen CSV-export och importerar till Supabase.
// Filtrerar Personbil och Lätt transportbil. Använder reg_nr för att undvika dubletter.
//
// Kör manuellt:
//   SYNC_SECRET=... node scripts/import-bilformedlingen.js
//
// Kör automatiskt via GitHub Actions: .github/workflows/sync-bilformedlingen.yml

const FEED_URL = 'https://www.bilformedlingen.com/export/wayke/wayke.txt';
const EDGE_URL = 'https://bvqveqoschdpenvbxygj.supabase.co/functions/v1/sync-bilformedlingen';
const SYNC_SECRET = process.env.SYNC_SECRET;

// Mappning bränsle
function mapFuel(f) {
  if (!f || f === 'Ingen information') return null;
  const lower = f.toLowerCase();
  if (lower.includes('hybrid')) return 'Hybrid'; // före 'el' – "Hybrid el/bensin" innehåller 'el'
  if (lower.includes('el')) return 'El';
  return f; // Bensin, Diesel
}

// Mappning färg – fuzzy match mot giltiga färger
const COLOR_MAP = {
  svart: 'Svart', black: 'Svart',
  vit: 'Vit', white: 'Vit',
  silver: 'Silver',
  grå: 'Grå', gray: 'Grå', grey: 'Grå', graphite: 'Grå',
  ljusgrå: 'Ljusgrå', lgrå: 'Ljusgrå',
  mörkgrå: 'Mörkgrå',
  blå: 'Blå', blue: 'Blå', mörkblå: 'Mörkblå',
  röd: 'Röd', red: 'Röd', vinröd: 'Vinröd',
  grön: 'Grön', green: 'Grön',
  brun: 'Brun', brown: 'Brun', beige: 'Beige',
  orange: 'Orange', gul: 'Gul', yellow: 'Gul',
  lila: 'Lila', koppar: 'Koppar', guld: 'Guld',
};

function mapColor(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

// Extrahera hästkrafter ur modellsträngen, t.ex. "170hk" → 170
function extractHp(modelStr) {
  const m = modelStr.match(/(\d+)\s*hk/i);
  return m ? parseInt(m[1]) : null;
}

// Extrahera stad ur "Bilförmedlingen Helsingborg" → "Helsingborg"
function extractCity(dealer) {
  return dealer.replace(/bilf[öo]rmedlingen\s*/i, '').trim() || null;
}

// Rensa modellnamn (ta bort hk-suffix och utrustning)
function cleanModel(modelStr) {
  return modelStr
    .replace(/\s+\d+\s*hk.*/i, '')
    .replace(/\s+(aut|man|automat|manuell)\s.*/i, '')
    .trim();
}

// Mappa karosstyp
function mapBodyType(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('suv') || lower.includes('crossover')) return 'SUV';
  if (lower.includes('kombi')) return 'Kombi';
  if (lower.includes('sedan')) return 'Sedan';
  if (lower.includes('halvkombi') || lower.includes('5-d')) return 'Halvkombi';
  if (lower.includes('cab') || lower.includes('cabriolet') || lower.includes('roadster')) return 'Cab';
  if (lower.includes('coup')) return 'Coupé';
  if (lower.includes('pickup')) return 'Pickup';
  return null;
}

async function main() {
  console.log('Hämtar feed från Bilförmedlingen...');
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Hämtning misslyckades: ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());

  // Hoppa över header-raden
  const rows = lines.slice(1);

  const cars = [];

  for (const line of rows) {
    // Dela på max 20 delar (sista fältet = bilder, kan innehålla kommatecken)
    const parts = line.split(';');
    if (parts.length < 19) continue;

    const [
      carRegNr, carType, carBrand, carModel, carBody,
      carYearModel, , carColour, carIndicatorMil, carPrice,
      carFuel, carGearBox, , , , , ,
      carInfo, dealer, carImages,
    ] = parts;

    // Filtrera: personbilar och lätta transportbilar
    const carTypeStr = carType?.trim();
    if (carTypeStr !== 'Personbil' && carTypeStr !== 'Lätt transportbil') continue;

    // Hoppa över utan regnr
    const regNr = carRegNr?.trim();
    if (!regNr) continue;

    // Första bildbild-URL
    const firstImage = carImages?.split(',')[0]?.trim() || null;

    const price = parseInt(carPrice) || null;
    const mileage = parseInt(carIndicatorMil) || null;
    const year = parseInt(carYearModel) || null;
    const hp = extractHp(carModel || '');

    cars.push({
      reg_nr: regNr,
      source: 'bilformedlingen',
      source_listing_id: regNr,
      make: carBrand?.trim() || null,
      model: cleanModel(carModel?.trim() || ''),
      model_raw: carModel?.trim() || null,
      year,
      price,
      mileage,
      fuel_type: mapFuel(carFuel?.trim()),
      transmission: carGearBox?.trim() || null,
      body_type: mapBodyType(carBody?.trim()),
      color: mapColor(carColour?.trim()),
      city: extractCity(dealer?.trim() || ''),
      image_thumb_url: firstImage,
      horsepower: hp,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    });
  }

  console.log(`Hittade ${cars.length} fordon att importera`);

  if (cars.length === 0) {
    console.log('Inga fordon att importera.');
    return;
  }

  // Skicka till edge function
  const r = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-secret': SYNC_SECRET || '',
    },
    body: JSON.stringify({ cars }),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Edge function fel ${r.status}: ${err}`);
  }

  const data = await r.json();
  console.log(`Klart: ${data.upserted} fordon upsertade`);
}

main().catch(e => { console.error(e); process.exit(1); });
