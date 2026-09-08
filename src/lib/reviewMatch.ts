/**
 * Nyckel som kopplar ihop ett community-omdöme med en bil.
 * Omdömen skrivs på märke + modell (t.ex. "Volvo XC60") medan annonser ofta
 * har längre modellnamn ("XC60 D4 AWD"). Vi normaliserar båda och matchar på
 * den längsta gemensamma prefix-nyckeln.
 */
export const normalizeModelKey = (make?: string | null, model?: string | null): string =>
  `${(make ?? '').trim()} ${(model ?? '').trim()}`.trim().toLowerCase().replace(/\s+/g, ' ');

/** Alla nycklar en bil kan matcha, längsta först. */
export const modelKeyCandidates = (make?: string | null, model?: string | null): string[] => {
  const brand = (make ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const words = (model ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!brand) return [];
  const keys: string[] = [];
  for (let i = words.length; i >= 1; i--) {
    keys.push(`${brand} ${words.slice(0, i).join(' ')}`);
  }
  keys.push(brand);
  return [...new Set(keys)];
};

export type ReviewSummary = { count: number; average: number };

/** Väljer bästa (mest specifika) sammanställningen för en bil. */
export const pickSummary = (
  summaries: Record<string, ReviewSummary>,
  make?: string | null,
  model?: string | null
): ReviewSummary | null => {
  for (const key of modelKeyCandidates(make, model)) {
    if (summaries[key]) return summaries[key];
  }
  return null;
};
