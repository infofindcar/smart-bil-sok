// scripts/import-cars.js
//
// Hämtar billistings från blocket-api.se, berikar med AI (färg + modelldata)
// och skickar färdiga bilar till Supabase Edge Function (sync-cars).
//
// HUR DU ANVÄNDER DET:
//   Sätt miljövariabler och kör:
//     SUPABASE_SYNC_URL=... SYNC_SECRET=... LOVABLE_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-cars.js
//
//   KRAV: Node.js version 18 eller nyare (ingen npm install behövs)

const BLOCKET_API_BASE = "https://blocket-api.se/v1/search/car";
const TOTAL_PAGES = 20;

const SUPABASE_SYNC_URL        = process.env.SUPABASE_SYNC_URL;
const SYNC_SECRET              = process.env.SYNC_SECRET;
const LOVABLE_API_KEY          = process.env.LOVABLE_API_KEY;
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SYNC_URL || !SYNC_SECRET) {
  console.error("FEL: SUPABASE_SYNC_URL och SYNC_SECRET krävs.");
  process.exit(1);
}

const canEnrich = LOVABLE_API_KEY && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY;
if (!canEnrich) {
  console.warn("Varning: LOVABLE_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY saknas – hoppar över AI-berikelse.");
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

// ─────────────────────────────────────────────
// Supabase REST helper
// ─────────────────────────────────────────────
async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${res.status}: ${err}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// AI helper – Gemini Flash Lite
// ─────────────────────────────────────────────
async function askAI(system, user, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() ?? "";
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return "";
}

// ─────────────────────────────────────────────
// Batch-färgdetektering – 10 bilar per anrop
// ─────────────────────────────────────────────
async function detectColorsBatch(cars) {
  // cars = [{ id, make, model, image_thumb_url }]
  const results = {};

  // Dela upp i grupper om 10
  for (let i = 0; i < cars.length; i += 10) {
    const batch = cars.slice(i, i + 10);

    try {
      const imageContents = batch.flatMap((car, idx) => [
        { type: "text", text: `Bil ${idx + 1} (${car.make} ${car.model}):` },
        { type: "image_url", image_url: { url: car.image_thumb_url } },
      ]);

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Färgexpert för bilar. Du får ${batch.length} bilder med bilar numrerade 1-${batch.length}.
För varje bild:
- Om det är en giltig exteriörfoto: ange färgen på svenska
- Om det är interiör, motor, hjul, tom/blank bild: skriv DELETE

Använd BARA dessa färger: Svart, Vit, Silver, Grå, Blå, Röd, Grön, Brun, Beige, Orange, Gul, Lila, Mörkblå, Ljusblå, Mörkgrå, Ljusgrå, Mörkgrön, Vinröd, Koppar, Guld

Svara EXAKT i detta format (en rad per bil):
1:Svart
2:Vit
3:DELETE`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Ange färg för alla ${batch.length} bilar:` },
                ...imageContents,
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        console.warn(`Batch-färg misslyckades (${res.status}), sätter Okänd för batch ${i / 10 + 1}`);
        batch.forEach((car) => { results[car.source_listing_id] = "Okänd"; });
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";

      // Parsa svaret: "1:Svart\n2:DELETE\n3:Grå\n..."
      const lines = text.split("\n");
      const VALID_COLORS = new Set([
        "Svart","Vit","Silver","Grå","Blå","Röd","Grön","Brun","Beige",
        "Orange","Gul","Lila","Mörkblå","Ljusblå","Mörkgrå","Ljusgrå",
        "Mörkgrön","Vinröd","Koppar","Guld",
      ]);

      batch.forEach((car, idx) => {
        const line = lines.find((l) => l.startsWith(`${idx + 1}:`));
        const value = line ? line.split(":").slice(1).join(":").trim() : "";
        if (value === "DELETE") {
          results[car.source_listing_id] = "__DELETE__";
        } else if (VALID_COLORS.has(value)) {
          results[car.source_listing_id] = value;
        } else {
          results[car.source_listing_id] = "Okänd";
        }
      });

      console.log(`  Färg batch ${Math.floor(i / 10) + 1}/${Math.ceil(cars.length / 10)} klar`);
    } catch (e) {
      console.warn(`Batch-färg fel:`, e.message);
      batch.forEach((car) => { results[car.source_listing_id] = "Okänd"; });
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// Modell-berikelse (cachas i car_models)
// ─────────────────────────────────────────────
async function loadModelCache() {
  // Hämta alla cachade modeller – tabellen är liten (hundratals rader max)
  const data = await supabaseRequest("/car_models?select=*");
  const cache = {};
  for (const cm of data ?? []) cache[`${cm.make}|||${cm.model}`] = cm;
  return cache;
}

async function enrichModel(make, model, modelRaw, cache) {
  const key = `${make}|||${model}`;
  if (cache[key]) return cache[key];

  const prompt = `${make} ${model}`;
  const promptWithSpec = modelRaw ? `${make} ${model} (${modelRaw})` : prompt;

  console.log(`  Ny modell: ${make} ${model} – hämtar AI-data...`);

  const [
    bodyType, co2Raw, consumptionRaw, electricRangeRaw,
    hpMinRaw, hpMaxRaw, zeroHundredRaw, bootSpaceRaw,
    towingRaw, seatsRaw, drivetrainRaw, reliabilityNotes,
    ncapAI, insuranceRaw, serviceRaw,
  ] = await Promise.all([
    askAI("Car expert. Reply ONLY one of: SUV, Sedan, Kombi, Halvkombi, Coupé, Cab, Pickup, Minibuss, Småbil, UNKNOWN", `Body type of ${prompt}?`),
    askAI("Car expert. Reply ONLY a number (WLTP avg CO2 g/km). EVs: 0. Unknown: 0.", `CO2 g/km of ${promptWithSpec}?`),
    askAI("Car expert. Reply ONLY a number (WLTP avg liters/100km). EVs: 0. Unknown: 0.", `Fuel consumption l/100km of ${promptWithSpec}?`),
    askAI("Car expert. Reply ONLY an integer (WLTP electric range km). Non-EVs: 0.", `Electric range km WLTP of ${promptWithSpec}?`),
    askAI("Car expert. Reply ONLY an integer (minimum HP across variants). Unknown: 0.", `Min horsepower of ${prompt}?`),
    askAI("Car expert. Reply ONLY an integer (maximum HP across variants). Unknown: 0.", `Max horsepower of ${prompt}?`),
    askAI("Car expert. Reply ONLY a decimal (typical 0-100 km/h for base petrol/diesel, NOT performance variant). Unknown: 0.", `Typical base model 0-100 km/h sec of ${promptWithSpec}?`),
    askAI("Car expert. Reply ONLY an integer (typical boot space liters). Unknown: 0.", `Boot space liters of ${prompt}?`),
    askAI("Car expert. Reply ONLY an integer (max towing kg). Unknown: 0.", `Max towing kg of ${prompt}?`),
    askAI("Car expert. Reply ONLY an integer (standard seats). Unknown: 5.", `Seats in ${prompt}?`),
    askAI("Car expert. Reply ONLY one of: AWD, FWD, RWD, UNKNOWN.", `Default drivetrain of ${prompt}?`),
    askAI("Car expert. Reply in Swedish, max 2 sentences about reliability. If nothing notable: NONE.", `Reliability notes about ${prompt}?`),
    askAI("Car expert. Reply ONLY integer 1-5 (Euro NCAP stars). Unknown: 0.", `Euro NCAP stars of ${prompt}?`),
    askAI("Swedish insurance expert. Reply ONLY two integers like '700-1300' (monthly SEK, helförsäkring used car).", `Monthly insurance SEK for used ${prompt} in Sweden?`),
    askAI("Swedish service expert. Reply ONLY an integer (annual service SEK, used car). Unknown: 5000.", `Annual service cost SEK for used ${prompt} in Sweden?`),
  ]);

  const BODY_TYPES = ["SUV","Sedan","Kombi","Halvkombi","Coupé","Cab","Pickup","Minibuss","Småbil"];
  const DRIVETRAINS = ["AWD","FWD","RWD"];
  const insuranceParts = insuranceRaw.match(/(\d+)\s*[-–]\s*(\d+)/);

  const modelData = {
    make, model,
    body_type:               BODY_TYPES.includes(bodyType) ? bodyType : null,
    fuel_consumption_l100km: parseFloat(consumptionRaw) || null,
    electric_range_km:       parseInt(electricRangeRaw) || null,
    co2_g_per_km:            parseInt(co2Raw) || null,
    euro_ncap_stars:         parseInt(ncapAI) || null,
    drivetrain_default:      DRIVETRAINS.includes(drivetrainRaw) ? drivetrainRaw : null,
    typical_hp_min:          parseInt(hpMinRaw) || null,
    typical_hp_max:          parseInt(hpMaxRaw) || null,
    zero_to_hundred_sec:     parseFloat(zeroHundredRaw) || null,
    boot_space_liters:       parseInt(bootSpaceRaw) || null,
    max_towing_kg:           parseInt(towingRaw) || null,
    seats:                   parseInt(seatsRaw) || 5,
    reliability_notes:       (reliabilityNotes && reliabilityNotes !== "NONE") ? reliabilityNotes : null,
    estimated_monthly_insurance_low:  insuranceParts ? parseInt(insuranceParts[1]) : 700,
    estimated_monthly_insurance_high: insuranceParts ? parseInt(insuranceParts[2]) : 1400,
    estimated_annual_service_sek:     parseInt(serviceRaw) || 5000,
    enriched_at: new Date().toISOString(),
  };

  // Spara i car_models
  try {
    await supabaseRequest("/car_models?on_conflict=make,model", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(modelData),
    });
  } catch (e) {
    console.warn(`  Kunde inte spara modell ${make} ${model}:`, e.message);
  }

  cache[key] = modelData;
  return modelData;
}

// ─────────────────────────────────────────────
// Hämta alla bilar från Blocket
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const cars = await fetchAllCars();

  if (cars.length === 0) {
    console.error("Inga bilar hittades. Kontrollera API:et.");
    process.exit(1);
  }

  // Filtrera och mappa grunddata
  const mappedCars = cars
    .filter((car) => car.id && car.organisation_name)
    .filter((car) => car.image?.url)
    .map((car) => {
      const { horsepower, drivetrain } = parseModelRaw(car.model_specification, car.make);
      return {
        source_listing_id: String(car.id),
        make: car.make ?? null,
        model: car.model ?? null,
        model_raw: car.model_specification ?? null,
        model_clean: car.model ?? null,
        year: car.year ?? null,
        price: car.price?.amount ?? null,
        mileage: car.mileage ?? null,
        city: car.location ?? null,
        fuel_type: car.fuel ?? null,
        transmission: car.transmission ?? null,
        drivetrain: drivetrain,
        horsepower: horsepower,
        dealer_name: car.organisation_name ?? null,
        image_thumb_url: car.image?.url ?? null,
        listing_url: car.canonical_url ?? null,
        regnr: car.regno ?? null,
        source: "blocket",
      };
    });

  console.log(`\nTotalt ${mappedCars.length} bilar hämtade.`);

  if (!canEnrich) {
    console.log("Skickar bilar utan berikelse...");
  } else {
    console.log("\n=== BERIKELSE STARTAR ===");

    // ── Steg 1: Ladda modell-cache från Supabase ──
    console.log("\n1. Laddar modell-cache från Supabase...");
    const modelCache = await loadModelCache();
    console.log(`   ${Object.keys(modelCache).length} modeller redan cachade.`);

    // ── Steg 2: Berika nya modeller sekventiellt ──
    const newCombos = [...new Set(
      mappedCars
        .filter((c) => c.make && c.model && !modelCache[`${c.make}|||${c.model}`])
        .map((c) => `${c.make}|||${c.model}`)
    )];

    console.log(`\n2. Berikar ${newCombos.length} nya modeller med AI...`);
    let modelsDone = 0;
    for (const combo of newCombos) {
      const [make, model] = combo.split("|||");
      const modelRaw = mappedCars.find((c) => c.make === make && c.model === model)?.model_raw ?? null;
      try {
        await enrichModel(make, model, modelRaw, modelCache);
        modelsDone++;
        console.log(`   ${modelsDone}/${newCombos.length}: ${make} ${model} ✓`);
      } catch (e) {
        console.warn(`   Misslyckades: ${make} ${model} – ${e.message}`);
        modelCache[combo] = null;
      }
    }

    // ── Steg 3: Applicera modelldata på varje bil ──
    console.log("\n3. Applicerar modelldata på bilar...");
    const BLOCKET_GENERIC = ["Personbil", "Transportbil", "Unknown", "Okänd"];
    for (const car of mappedCars) {
      const cm = modelCache[`${car.make}|||${car.model}`];
      if (!cm) continue;

      if (!car.drivetrain && cm.drivetrain_default) car.drivetrain = cm.drivetrain_default;
      if (!car.horsepower && cm.typical_hp_min) {
        car.horsepower = Math.round((cm.typical_hp_min + (cm.typical_hp_max ?? cm.typical_hp_min)) / 2);
      }
    }

    // ── Steg 4: Batch-färgdetektering ──
    console.log(`\n4. Detekterar färg för ${mappedCars.length} bilar (batch om 10)...`);
    const colorResults = await detectColorsBatch(mappedCars);

    let deleted = 0;
    const finalCars = mappedCars.filter((car) => {
      const color = colorResults[car.source_listing_id];
      if (color === "__DELETE__") {
        deleted++;
        return false; // ta bort bilen
      }
      car.color = color ?? "Okänd";
      return true;
    });

    console.log(`   ${finalCars.length} bilar med färg, ${deleted} borttagna (ogiltig bild).`);
    console.log("\n=== BERIKELSE KLAR ===");

    // Ersätt mappedCars med finalCars
    mappedCars.length = 0;
    mappedCars.push(...finalCars);
  }

  // ── Skicka till Supabase ──
  console.log(`\nSkickar ${mappedCars.length} bilar till Supabase...`);

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
  console.log(`  Borttagna:      ${result.deleted}`);
  console.log(`  Totalt:         ${result.total}`);
  console.log(`  Tid:            ${result.durationMs}ms`);
}

main().catch((err) => {
  console.error("Fel:", err.message);
  process.exit(1);
});
