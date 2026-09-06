/**
 * Motoretikett per annons — t.ex. "2.0 l I4", "3.9 l V8", "2.0 l", "El".
 *
 * Grundregel: vi visar BARA sådant som kommer från den enskilda annonsen
 * (annonsens engine_volume_cc och/eller volym i annonstiteln). Vi gissar
 * aldrig utifrån modellen, eftersom nästan identiska bilar ofta skiljer sig
 * just i motorstorlek. Är något osäkert returnerar vi null och inget visas.
 */

const CC_MIN = 600;
const CC_MAX = 8500;
const L_MIN = 0.6;
const L_MAX = 8.0;
/** Max tillåten skillnad mellan annonsens cc-värde och titelns volym. */
const L_TOLERANCE = 0.15;

const LAYOUTS = ['V6', 'V8', 'V10', 'V12', 'W12', 'I3', 'I4', 'I5', 'I6', 'R4', 'B4', 'B6'] as const;

export interface EngineLabelInput {
  engine_volume_cc?: number | null;
  model_raw?: string | null;
  fuel_type?: string | null;
}

const round1 = (liters: number) => Math.round(liters * 10) / 10;
const fmtLiters = (liters: number) => round1(liters).toFixed(1).replace('.', ',');

/** Volym från annonsens eget cc-fält. */
function volumeFromCc(cc: number | null | undefined): number | null {
  if (!cc || cc < CC_MIN || cc > CC_MAX) return null;
  return round1(cc / 1000);
}

/**
 * Volym ur annonstiteln. Godtar "2.0", "1,6" osv, men bara när talet
 * rimligen är en motorvolym — inte hästkrafter, batteristorlek eller
 * en accelerationssiffra.
 */
function volumeFromTitle(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const title = raw.replace(/\s+/g, ' ');
  const re = /(?<![\d.,])([0-9])[.,]([0-9])(?![\d.,])/g;
  const found = new Set<number>();

  let m: RegExpExecArray | null;
  while ((m = re.exec(title)) !== null) {
    const value = parseFloat(`${m[1]}.${m[2]}`);
    if (value < L_MIN || value > L_MAX) continue;

    const before = title.slice(Math.max(0, m.index - 14), m.index).toLowerCase();
    const after = title.slice(m.index + m[0].length, m.index + m[0].length + 8).toLowerCase();

    // Uteslut kända icke-motorvolymer i närheten av talet.
    if (/(0-100|0–100|kwh|kw\b|sek|kr|mil\b|km\b|l\/100|s\b)\s*$/.test(before)) continue;
    if (/^\s*(kwh|kw\b|s\b|sek|kr|mil\b|km|l\/100|%)/.test(after)) continue;

    found.add(round1(value));
  }

  // Flera olika tal som kan vara volym → osäkert, visa inget.
  if (found.size !== 1) return null;
  return [...found][0];
}

/** Cylinderuppsättning ur annonstiteln — ingen gissning. */
function layoutFromTitle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const hits = new Set<string>();
  for (const layout of LAYOUTS) {
    if (new RegExp(`(?<![A-Z0-9])${layout}(?![A-Z0-9])`).test(upper)) {
      hits.add(layout === 'R4' ? 'I4' : layout);
    }
  }
  if (hits.size !== 1) return null;
  return [...hits][0];
}

function fuelKind(fuel: string | null | undefined): 'el' | 'hybrid' | 'other' {
  const f = (fuel || '').toLowerCase();
  if (/(^|\W)(el|electric)(\W|$)/.test(f)) return 'el';
  if (f.includes('hybrid')) return 'hybrid';
  return 'other';
}

export function engineLabel(input: EngineLabelInput): string | null {
  const fromCc = volumeFromCc(input.engine_volume_cc);
  const fromTitle = volumeFromTitle(input.model_raw);
  const kind = fuelKind(input.fuel_type);

  let liters: number | null = null;
  if (fromCc !== null && fromTitle !== null) {
    // Krock mellan källorna → vi vet inte vilken som stämmer.
    if (Math.abs(fromCc - fromTitle) > L_TOLERANCE) return null;
    liters = fromCc;
  } else {
    liters = fromCc ?? fromTitle;
  }

  if (liters === null) {
    return kind === 'el' ? 'El' : null;
  }

  const layout = layoutFromTitle(input.model_raw);
  let label = `${fmtLiters(liters)} l`;
  if (layout) label += ` ${layout}`;
  if (kind === 'hybrid') label += ' hybrid';
  return label;
}
