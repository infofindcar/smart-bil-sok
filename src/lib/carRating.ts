/**
 * FindCar-betyg 1–10 för en enskild annons.
 *
 * Deterministiskt: samma bil ger alltid samma betyg. Ingen AI, inga
 * nätverksanrop — allt räknas ur strukturerad data vi redan har.
 *
 * Saknas underlag för en faktor räknas den bort och vikterna normaliseras,
 * så betyget blir aldrig lågt bara för att data fattas.
 */

export type BenchmarkLevel = 'good' | 'fair' | 'high';

export interface PriceBenchmark {
  median: number;
  count: number;
  diff: number;        // bilens pris minus referenspris (negativt = billigare)
  diffPct: number;     // -0.12 = 12 % under marknaden
  level: BenchmarkLevel;
  yearFrom: number | null;
  yearTo: number | null;
  mileageFrom: number | null;
  mileageTo: number | null;
}

export interface RatingInput {
  price: number | null;
  year: number | null;
  mileage: number | null;          // mil (svensk enhet)
  ncapStars: number | null;
  benchmark: PriceBenchmark | null;
  runningMonthly: number | null;   // löpande kostnad kr/mån
}

export interface RatingFactor {
  key: string;
  label: string;
  score: number;   // 0–10
  weight: number;  // relativ vikt
  detail: string;
}

export interface CarRating {
  score: number;          // 1–10, en decimal
  label: string;
  factors: RatingFactor[];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Linjär interpolation mellan två punkter, klippt till 0–10. */
function scale(value: number, worst: number, best: number): number {
  if (best === worst) return 5;
  return clamp(((value - worst) / (best - worst)) * 10, 0, 10);
}

const NORMAL_MIL_PER_YEAR = 1500; // ~15 000 km/år

export function ratingLabel(score: number): string {
  if (score >= 8) return 'Riktigt bra köp';
  if (score >= 6) return 'Värd att kolla';
  return 'Tveksam';
}

export function calcCarRating(input: RatingInput): CarRating | null {
  const factors: RatingFactor[] = [];
  const currentYear = new Date().getFullYear();

  /* 1. Pris mot marknaden (40 %) */
  if (input.benchmark) {
    const pct = input.benchmark.diffPct;
    // -25 % under marknaden = 10, +25 % över = 0
    const score = scale(-pct, -0.25, 0.25);
    const abs = Math.abs(Math.round(input.benchmark.diff));
    const detail = pct <= -0.03
      ? `~${abs.toLocaleString('sv-SE')} kr under snittet för liknande bilar`
      : pct >= 0.03
        ? `~${abs.toLocaleString('sv-SE')} kr över snittet för liknande bilar`
        : 'Ligger i linje med snittet för liknande bilar';
    factors.push({ key: 'price', label: 'Pris mot marknaden', score, weight: 40, detail });
  }

  /* 2. Miltal mot åldern (20 %) */
  if (input.mileage != null && input.mileage > 0 && input.year) {
    const age = Math.max(1, currentYear - input.year);
    const expected = age * NORMAL_MIL_PER_YEAR;
    const ratio = input.mileage / expected;
    // 0,5× förväntat = 10, 1,8× = 0
    const score = scale(-ratio, -1.8, -0.5);
    const perYear = Math.round(input.mileage / age);
    const detail = ratio <= 0.8
      ? `Lågt miltal — ~${perYear.toLocaleString('sv-SE')} mil/år`
      : ratio >= 1.25
        ? `Högt miltal — ~${perYear.toLocaleString('sv-SE')} mil/år`
        : `Normalt miltal — ~${perYear.toLocaleString('sv-SE')} mil/år`;
    factors.push({ key: 'mileage', label: 'Miltal mot åldern', score, weight: 20, detail });
  }

  /* 3. Ålder (15 %) */
  if (input.year) {
    const age = currentYear - input.year;
    const score = scale(-age, -18, 0);
    const detail = age <= 3
      ? `Ny bil (${input.year}) — mycket livslängd kvar`
      : age <= 8
        ? `${age} år gammal — normal ålder på marknaden`
        : `${age} år gammal — räkna med mer underhåll`;
    factors.push({ key: 'age', label: 'Ålder', score, weight: 15, detail });
  }

  /* 4. Ägandekostnad i förhållande till prisklassen (15 %) */
  if (input.runningMonthly && input.price && input.price > 0) {
    // Löpande kostnad som andel av bilens pris per år.
    const yearlyShare = (input.runningMonthly * 12) / input.price;
    // 8 % av priset per år = bra, 35 % = dyrt att äga
    const score = scale(-yearlyShare, -0.35, -0.08);
    const detail = `~${Math.round(input.runningMonthly).toLocaleString('sv-SE')} kr/mån i löpande kostnad`;
    factors.push({ key: 'cost', label: 'Ägandekostnad', score, weight: 15, detail });
  }

  /* 5. Säkerhet (10 %) */
  if (input.ncapStars && input.ncapStars > 0) {
    const score = scale(input.ncapStars, 1, 5);
    factors.push({
      key: 'safety',
      label: 'Säkerhet',
      score,
      weight: 10,
      detail: `${input.ncapStars} av 5 stjärnor i Euro NCAP`,
    });
  }

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  // Kräv åtminstone två faktorer och halva vikten, annars är betyget inte
  // meningsfullt och vi visar inget.
  if (factors.length < 2 || totalWeight < 40) return null;

  const weighted = factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight;
  const score = Math.round(clamp(weighted, 1, 10) * 10) / 10;

  return { score, label: ratingLabel(score), factors };
}

export function benchmarkLabel(level: BenchmarkLevel): string {
  if (level === 'good') return 'Bra pris';
  if (level === 'high') return 'Över marknadspris';
  return 'Rimligt pris';
}
