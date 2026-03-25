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
  const fuel = (fuelType ?? '').toLowerCase();

  if (fuel.includes('el') || fuel.includes('electric')) {
    // Typisk elförbrukning ~20 kWh/100 km
    const cost = Math.round(20 * (MONTHLY_KM / 100) * ELECTRIC_PRICE_PER_KWH);
    return { cost, label: 'Laddning', isExact: false };
  }

  if (consumptionL100 && consumptionL100 > 0) {
    const pricePerL = fuel.includes('diesel') ? DIESEL_PRICE_PER_L : PETROL_PRICE_PER_L;
    const cost = Math.round(consumptionL100 * (MONTHLY_KM / 100) * pricePerL);
    return { cost, label: fuel.includes('diesel') ? 'Diesel' : 'Bensin', isExact: true };
  }

  // Fallback utan förbrukningsdata
  if (fuel.includes('diesel')) return { cost: 2000, label: 'Diesel', isExact: false };
  if (fuel.includes('hybrid') || fuel.includes('laddhybrid')) return { cost: 1200, label: 'Hybrid', isExact: false };
  return { cost: 2200, label: 'Bensin', isExact: false };
}

// ─────────────────────────────────────────────────────────────
// Fordonsskatt – svensk officiell formel
// Källa: Lag (2006:228) §4-7, gäller bilar reg. fr.o.m. 2018-07-01
// ─────────────────────────────────────────────────────────────
export function calcAnnualTax(co2GPerKm: number | null, fuelType: string | null): number {
  const fuel = (fuelType ?? "").toLowerCase();
  if (fuel.includes("el") || fuel.includes("vätgas") || fuel.includes("hydrogen") || fuel.includes("electric")) {
    return 360;
  }
  const co2 = co2GPerKm ?? 0;
  if (co2 <= 0) return 360;
  const base = 360 + Math.max(0, co2 - 111) * 22;
  if (fuel.includes("diesel")) return Math.round(base * 2.37);
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
