/**
 * Hjälpfunktioner för bildata – deterministiska beräkningar som inte kräver API-anrop.
 */

// Typ för car_models-raden från Supabase
export interface CarModel {
  make: string;
  model: string;
  body_type: string | null;
  fuel_consumption_l100km: number | null;
  electric_range_km: number | null;
  co2_g_per_km: number | null;
  euro_ncap_stars: number | null;
  euro_ncap_year: number | null;
  ncap_source: string | null;
  drivetrain_default: string | null;
  typical_hp_min: number | null;
  typical_hp_max: number | null;
  zero_to_hundred_sec: number | null;
  boot_space_liters: number | null;
  max_towing_kg: number | null;
  seats: number | null;
  reliability_notes: string | null;
  estimated_monthly_insurance_low: number | null;
  estimated_monthly_insurance_high: number | null;
  estimated_annual_service_sek: number | null;
}

// Fallback-priser om live-data saknas
const PETROL_PRICE_FALLBACK = 22;   // kr/l
const DIESEL_PRICE_FALLBACK = 22;   // kr/l
const ELECTRIC_PRICE_PER_KWH = 2.5; // kr/kWh
const MONTHLY_KM = 1500;

/**
 * Klassificerar drivmedel robust.
 *
 * VIKTIGT: naiva tester som `fuel.includes('el')` är buggiga — strängen
 * "diesel" innehåller "el". Diesel testas därför FÖRST, och el-testet
 * använder ordgräns. Använd alltid denna funktion istället för includes().
 */
export type FuelKind = 'el' | 'plugin' | 'hybrid' | 'diesel' | 'e85' | 'bensin';

export function classifyFuel(fuelType: string | null | undefined): FuelKind {
  const f = (fuelType ?? '').toLowerCase();
  if (f.includes('diesel')) return 'diesel';
  if (f.includes('plug') || f.includes('laddhybrid')) return 'plugin';
  if (f.includes('hybrid')) return 'hybrid';
  if (/(^|[^a-zåäö])el([^a-zåäö]|$)/.test(f) || f.includes('elbil') || f.includes('eldrift') || f.includes('electric') || f.includes('vätgas') || f.includes('hydrogen')) return 'el';
  if (f.includes('e85') || f.includes('etanol')) return 'e85';
  return 'bensin';
}

/**
 * Beräknar månadskostnad för bränsle/laddning.
 * isExact=true = beräknat från verklig förbrukningsdata, false = uppskattning.
 */
export function calcMonthlyFuelCost(
  consumptionL100: number | null,
  fuelType: string | null,
  livePrices?: { petrol?: number; diesel?: number },
): { cost: number; label: string; isExact: boolean } {
  const PETROL_PRICE_PER_L = livePrices?.petrol ?? PETROL_PRICE_FALLBACK;
  const DIESEL_PRICE_PER_L = livePrices?.diesel ?? DIESEL_PRICE_FALLBACK;
  const kind = classifyFuel(fuelType);

  if (kind === 'el') {
    // Typisk elförbrukning ~20 kWh/100 km
    const cost = Math.round(20 * (MONTHLY_KM / 100) * ELECTRIC_PRICE_PER_KWH);
    return { cost, label: 'Laddning', isExact: false };
  }

  if (consumptionL100 && consumptionL100 > 0) {
    const pricePerL = kind === 'diesel' ? DIESEL_PRICE_PER_L : PETROL_PRICE_PER_L;
    const cost = Math.round(consumptionL100 * (MONTHLY_KM / 100) * pricePerL);
    return { cost, label: kind === 'diesel' ? 'Diesel' : 'Bensin', isExact: true };
  }

  // Fallback utan förbrukningsdata
  if (kind === 'diesel') return { cost: 2000, label: 'Diesel', isExact: false };
  if (kind === 'hybrid' || kind === 'plugin') return { cost: 1200, label: 'Hybrid', isExact: false };
  return { cost: 2200, label: 'Bensin', isExact: false };
}

// ─────────────────────────────────────────────────────────────
// Fordonsskatt – svensk officiell formel
// Källa: Lag (2006:228) §4-7, gäller bilar reg. fr.o.m. 2018-07-01
// ─────────────────────────────────────────────────────────────
export function calcAnnualTax(co2GPerKm: number | null, fuelType: string | null): number {
  const kind = classifyFuel(fuelType);
  if (kind === 'el') return 360;
  const co2 = co2GPerKm ?? 0;
  if (co2 <= 0) return 360;
  const base = 360 + Math.max(0, co2 - 111) * 22;
  if (kind === 'diesel') return Math.round(base * 2.37);
  return Math.round(base);
}


// ─────────────────────────────────────────────────────────────
// Garantidata per märke – statisk tabell, noll API-anrop
// Uppdateras vid tillverkarförändringar
// ─────────────────────────────────────────────────────────────
export interface MakeWarranty {
  warrantyYears: number;
  warrantyKm: number;        // 0 = obegränsad km
  roadsideAssistanceYears: number;
  countryOfOrigin: string;
}

const WARRANTY_TABLE: Record<string, MakeWarranty> = {
  "Kia":            { warrantyYears: 7, warrantyKm: 150000, roadsideAssistanceYears: 7,  countryOfOrigin: "Sydkorea" },
  "MG":             { warrantyYears: 7, warrantyKm: 150000, roadsideAssistanceYears: 7,  countryOfOrigin: "Kina" },
  "BYD":            { warrantyYears: 6, warrantyKm: 150000, roadsideAssistanceYears: 6,  countryOfOrigin: "Kina" },
  "Mitsubishi":     { warrantyYears: 5, warrantyKm: 100000, roadsideAssistanceYears: 5,  countryOfOrigin: "Japan" },
  "Hyundai":        { warrantyYears: 5, warrantyKm: 100000, roadsideAssistanceYears: 5,  countryOfOrigin: "Sydkorea" },
  "Xpeng":          { warrantyYears: 5, warrantyKm: 150000, roadsideAssistanceYears: 5,  countryOfOrigin: "Kina" },
  "NIO":            { warrantyYears: 5, warrantyKm: 0,      roadsideAssistanceYears: 5,  countryOfOrigin: "Kina" },
  "Zeekr":          { warrantyYears: 5, warrantyKm: 150000, roadsideAssistanceYears: 5,  countryOfOrigin: "Kina" },
  "Tesla":          { warrantyYears: 4, warrantyKm: 80000,  roadsideAssistanceYears: 4,  countryOfOrigin: "USA" },
  "Volvo":          { warrantyYears: 3, warrantyKm: 150000, roadsideAssistanceYears: 3,  countryOfOrigin: "Sverige" },
  "Polestar":       { warrantyYears: 3, warrantyKm: 60000,  roadsideAssistanceYears: 3,  countryOfOrigin: "Sverige" },
  "Lynk & Co":      { warrantyYears: 3, warrantyKm: 60000,  roadsideAssistanceYears: 3,  countryOfOrigin: "Kina" },
  "BMW":            { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Mercedes-Benz":  { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Mercedes":       { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Audi":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Volkswagen":     { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Skoda":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tjeckien" },
  "SEAT":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Spanien" },
  "Cupra":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Spanien" },
  "Porsche":        { warrantyYears: 3, warrantyKm: 0,      roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Ford":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "USA" },
  "Peugeot":        { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Frankrike" },
  "Citroën":        { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Frankrike" },
  "Opel":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Tyskland" },
  "Renault":        { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Frankrike" },
  "Dacia":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Rumänien" },
  "Nissan":         { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Toyota":         { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Lexus":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Mazda":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Honda":          { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Subaru":         { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Suzuki":         { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Japan" },
  "Jeep":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "USA" },
  "Land Rover":     { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "UK" },
  "Jaguar":         { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "UK" },
  "Mini":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "UK" },
  "Fiat":           { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Italien" },
  "Alfa Romeo":     { warrantyYears: 3, warrantyKm: 100000, roadsideAssistanceYears: 3,  countryOfOrigin: "Italien" },
};

/** Hämtar garantiinfo för ett märke. Returnerar null om märket inte finns i tabellen. */
export function getWarranty(make: string | null): MakeWarranty | null {
  if (!make) return null;
  return WARRANTY_TABLE[make] ?? null;
}

/** Formatterar garantitext för visning, t.ex. "7 år / 150 000 km" */
export function formatWarranty(warranty: MakeWarranty): string {
  const km = warranty.warrantyKm > 0
    ? ` / ${warranty.warrantyKm.toLocaleString("sv-SE")} km`
    : "";
  return `${warranty.warrantyYears} år${km}`;
}

// ─────────────────────────────────────────────────────────────
// Aktiv garanti / vägassistans — räknar ut vad som faktiskt gäller
// baserat på bilens ålder OCH miltal (mil i Sverige = 10 km)
// ─────────────────────────────────────────────────────────────
export interface ActiveWarranty {
  warrantyActive: boolean;
  warrantyYearsLeft: number;
  warrantyKmLeft: number;       // 0 om obegränsad eller slut
  warrantyKmUnlimited: boolean;
  roadsideActive: boolean;
  roadsideYearsLeft: number;
}

/**
 * Räknar ut hur mycket av nybilsgaranti och vägassistans som finns kvar
 * för en specifik bil. mileage anges i SVENSKA MIL (= 10 km).
 */
export function getActiveWarranty(
  warranty: MakeWarranty | null,
  carYear: number | null,
  mileageMil: number | null,
): ActiveWarranty | null {
  if (!warranty || !carYear) return null;

  const currentYear = new Date().getFullYear();
  const ageYears = currentYear - carYear;

  // Garanti: gäller om både ålder OCH körda km är under taket
  const warrantyYearsLeft = Math.max(0, warranty.warrantyYears - ageYears);
  const kmUnlimited = warranty.warrantyKm === 0;
  const mileageKm = mileageMil != null ? mileageMil * 10 : 0;
  const warrantyKmLeft = kmUnlimited ? 0 : Math.max(0, warranty.warrantyKm - mileageKm);

  const warrantyActive =
    warrantyYearsLeft > 0 && (kmUnlimited || warrantyKmLeft > 0);

  // Vägassistans: bara år
  const roadsideYearsLeft = Math.max(0, warranty.roadsideAssistanceYears - ageYears);
  const roadsideActive = roadsideYearsLeft > 0;

  return {
    warrantyActive,
    warrantyYearsLeft,
    warrantyKmLeft,
    warrantyKmUnlimited: kmUnlimited,
    roadsideActive,
    roadsideYearsLeft,
  };
}

/**
 * Formaterar aktiv garanti som visningstext.
 * Returnerar null om INGET (varken garanti eller vägassistans) är aktivt
 * — då ska komponenten dölja hela sektionen.
 */
export function formatActiveWarranty(
  active: ActiveWarranty | null,
): { title: string; text: string } | null {
  if (!active) return null;
  if (!active.warrantyActive && !active.roadsideActive) return null;

  if (active.warrantyActive) {
    const yrs = active.warrantyYearsLeft;
    const km = active.warrantyKmUnlimited
      ? "obegränsat"
      : `${active.warrantyKmLeft.toLocaleString("sv-SE")} km`;
    let text = `${yrs} år / ${km} kvar`;
    if (active.roadsideActive) {
      text += ` · vägassistans ${active.roadsideYearsLeft} år kvar`;
    }
    return { title: "Nybilsgaranti", text };
  }

  // Bara vägassistans kvar
  return {
    title: "Vägassistans",
    text: `${active.roadsideYearsLeft} år kvar`,
  };
}

/** Formatterar fordonsskatt för visning, t.ex. "3 600 kr/år" */
export function formatTax(co2: number | null, fuelType: string | null): string {
  const tax = calcAnnualTax(co2, fuelType);
  return `${tax.toLocaleString("sv-SE")} kr/år`;
}

/** Returnerar NCAP-stjärnor som emoji-sträng, t.ex. "★★★★★" */
export function formatNcapStars(stars: number | null): string {
  if (!stars || stars < 1) return "Ej testad";
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
}

/** Formatterar 0-100-tid, t.ex. "6,4 s" */
export function formatZeroHundred(sec: number | null): string | null {
  if (!sec || sec <= 0) return null;
  return `${sec.toString().replace(".", ",")} s`;
}

/** Formatterar bagageutrymme, t.ex. "520 l" */
export function formatBootSpace(liters: number | null): string | null {
  if (!liters || liters <= 0) return null;
  return `${liters} l`;
}

// ─────────────────────────────────────────────────────────────
// Ägandekostnad – prisankrad modell
//
// Problem vi löser: car_models-datan (försäkring/service) är AI-uppskattad
// per modell och därför inkonsekvent. Samma bilklass kunde ge 1 000 kr eller
// 20 000 kr/mån i försäkring. Dessutom saknades värdeminskning och
// kapitalkostnad helt, vilket gjorde exotbilar absurt billiga.
//
// Lösning: bilens PRIS är den bästa proxyn för både premie och verkstads-
// kostnad. Vi räknar ett ankare ur priset (sub-linjärt – premien växer
// långsammare än priset) och klipper modelldatan mot ankaret (±50 %).
// Ligger AI-värdet rimligt används det, annars justeras det. Vanliga bilar
// påverkas därför marginellt.
// ─────────────────────────────────────────────────────────────

/** [försäkringsfaktor, servicefaktor] per märke. 1.0 = normal volymbil. */
const BRAND_COST_FACTOR: Record<string, [number, number]> = {
  'Ferrari': [1.45, 2.2],
  'Lamborghini': [1.5, 2.3],
  'McLaren': [1.5, 2.3],
  'Rolls-Royce': [1.5, 2.4],
  'Bentley': [1.4, 2.0],
  'Aston Martin': [1.4, 2.1],
  'Maserati': [1.25, 1.8],
  'Porsche': [1.2, 1.5],
  'Alpine': [1.2, 1.4],
  'Lotus': [1.25, 1.6],
  'Land Rover': [1.05, 1.35],
  'Jaguar': [1.05, 1.3],
  'Range Rover': [1.05, 1.35],
  'Tesla': [1.1, 0.8],
  'Dacia': [0.9, 0.8],
  'Toyota': [0.95, 0.85],
  'Kia': [0.95, 0.85],
  'Hyundai': [0.95, 0.85],
  'Suzuki': [0.9, 0.85],
};

const INSURANCE_ANCHOR_PRICE = 150000;
const INSURANCE_ANCHOR_MONTHLY = 1000;
const SERVICE_ANCHOR_PRICE = 130000;
const SERVICE_ANCHOR_ANNUAL = 5000;
const CAPITAL_RATE = 0.045;   // ränta / alternativkostnad på bundet kapital
const CLAMP = 0.5;            // modelldata får avvika max ±50 % från ankaret

function clampToAnchor(value: number | null, anchor: number): number {
  if (!value || value <= 0) return anchor;
  return Math.round(Math.min(Math.max(value, anchor * (1 - CLAMP)), anchor * (1 + CLAMP)));
}

/** Årlig värdeminskning i procent – ung bil tappar mest, exotbil minst. */
function depreciationRate(price: number, year: number | null, make: string | null): number {
  const age = year ? Math.max(0, new Date().getFullYear() - year) : 8;
  const exotic = !!(make && BRAND_COST_FACTOR[make]?.[1] >= 1.8);

  // Samlarbilar/exotbilar tappar lite eller ingenting
  if (exotic && price > 1000000) return age > 15 ? 0.01 : 0.035;
  if (price > 1500000) return 0.05;

  if (age <= 1) return 0.15;
  if (age <= 3) return 0.12;
  if (age <= 6) return 0.09;
  if (age <= 10) return 0.06;
  if (age <= 15) return 0.04;
  return 0.025;
}

export interface OwnershipCostInput {
  price: number | null;
  year: number | null;
  make: string | null;
  fuelType: string | null;
  horsepower?: number | null;
  /** Månatlig försäkring lågt/högt ur car_models (AI-uppskattat). */
  insuranceLow?: number | null;
  insuranceHigh?: number | null;
  /** Årlig servicekostnad ur car_models (AI-uppskattat). */
  annualService?: number | null;
  /** Förarens ålder om känd (påverkar premien). */
  driverAge?: number | null;
}

export interface OwnershipCosts {
  /** Försäkring per månad, intervall. */
  insuranceLow: number;
  insuranceHigh: number;
  insuranceAvg: number;
  /** Service/reparation per månad + underlag per år. */
  service: number;
  serviceAnnual: number;
  /** Däck, besiktning, tvätt, småsaker per månad. */
  misc: number;
  /** Värdeminskning per månad + använd procentsats. */
  depreciation: number;
  depreciationPct: number;
  /** Kapitalkostnad (ränta på bundet kapital) per månad. */
  capital: number;
  /** Om AI-värdet fick justeras för att vara orimligt. */
  insuranceAdjusted: boolean;
  serviceAdjusted: boolean;
}

/**
 * Räknar ut ägandekostnadens delposter. Bränsle och fordonsskatt räknas
 * separat (calcMonthlyFuelCost / calcAnnualTax) eftersom de har egna källor.
 */
export function estimateOwnershipCosts(input: OwnershipCostInput): OwnershipCosts {
  const price = input.price && input.price > 10000 ? input.price : 100000;
  const [insFactor, svcFactor] = BRAND_COST_FACTOR[input.make ?? ''] ?? [1, 1];

  // Sub-linjära ankare: premie/service växer långsammare än priset.
  const insAnchor = INSURANCE_ANCHOR_MONTHLY * Math.pow(price / INSURANCE_ANCHOR_PRICE, 0.55) * insFactor;
  const svcAnchor = SERVICE_ANCHOR_ANNUAL * Math.pow(price / SERVICE_ANCHOR_PRICE, 0.45) * svcFactor;

  const rawInsAvg = input.insuranceLow && input.insuranceHigh
    ? (input.insuranceLow + input.insuranceHigh) / 2
    : (input.insuranceLow || input.insuranceHigh || null);

  const insBase = clampToAnchor(rawInsAvg, Math.round(insAnchor));
  const insuranceAdjusted = !!rawInsAvg && Math.abs(rawInsAvg - insBase) > 1;

  // Åldersjustering av premien
  const ageMult = input.driverAge
    ? input.driverAge < 25 ? 1.4 : input.driverAge > 50 ? 0.85 : 1.0
    : 1.0;

  const insuranceAvg = Math.max(400, Math.round(insBase * ageMult));

  const serviceAnnual = clampToAnchor(input.annualService ?? null, Math.round(svcAnchor));
  const serviceAdjusted = !!input.annualService && Math.abs(input.annualService - serviceAnnual) > 1;

  // Däck/besiktning/övrigt – skalar med pris och effekt
  const hp = input.horsepower && input.horsepower > 0 ? input.horsepower : 140;
  const misc = Math.round(200 + (price / 1000) * 0.3 + Math.max(0, hp - 150) * 0.8);

  const depreciationPct = depreciationRate(price, input.year, input.make);

  return {
    insuranceLow: Math.round(insuranceAvg * 0.8),
    insuranceHigh: Math.round(insuranceAvg * 1.25),
    insuranceAvg,
    service: Math.round(serviceAnnual / 12),
    serviceAnnual,
    misc,
    depreciation: Math.round((price * depreciationPct) / 12),
    depreciationPct,
    capital: Math.round((price * CAPITAL_RATE) / 12),
    insuranceAdjusted,
    serviceAdjusted,
  };
}
