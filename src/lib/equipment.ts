/**
 * Parsa "model_raw" till en lista normaliserade tillval/utrustning.
 * model_raw kan innehålla saker som: "T8 AWD R-Design Pano B&W HUD VOC Värm Kamera Drag"
 */

// Kanonisk lista över tillval vi känner igen + svensk display-text + regex för att matcha i model_raw
export interface EquipmentTag {
  key: string;          // intern nyckel (för filter)
  label: string;        // visningstext på chip
  pattern: RegExp;      // matchar mot model_raw
  category: 'safety' | 'comfort' | 'tech' | 'audio' | 'utility' | 'sport' | 'other';
}

export const EQUIPMENT_TAGS: EquipmentTag[] = [
  // Utility / praktiskt (högst prioritet — det folk faktiskt frågar efter)
  { key: 'drag', label: 'Dragkrok', pattern: /\b(drag|dragkrok|tow\s*bar|tow-?hitch)\b/i, category: 'utility' },
  { key: 'varmare', label: 'Motorvärmare', pattern: /\b(värm(are|ar|e)?|motorvärm|kupévärm|webasto|standheizung)\b/i, category: 'utility' },
  { key: 'taklucka', label: 'Panoramatak', pattern: /\b(pano(ram[a]?(tak)?)?|panoramic|sunroof|glasstak|öppningsbart\s*tak|takluck[aoe])\b/i, category: 'comfort' },
  { key: 'skinn', label: 'Skinnklädsel', pattern: /\b(skinn|läder|leather|nappa|alcantara)\b/i, category: 'comfort' },
  { key: 'rattvarme', label: 'Rattvärme', pattern: /\b(rattvärm[ae]?|heated\s*steering)\b/i, category: 'comfort' },
  { key: 'stolvarme', label: 'Stolvärme', pattern: /\b(stolvärm[ae]?|sätesvärm[ae]?|heated\s*seats?)\b/i, category: 'comfort' },
  { key: 'kamera', label: 'Backkamera', pattern: /\b(kamera|camera|backkamera|360°?|360\s*kamera|surround\s*view|reverse\s*cam)\b/i, category: 'tech' },
  { key: 'navi', label: 'Navigation', pattern: /\b(nav(i(gation)?)?|gps|carplay|android\s*auto)\b/i, category: 'tech' },
  { key: 'hud', label: 'Head-up display', pattern: /\b(hud|head[\s-]?up)\b/i, category: 'tech' },
  { key: 'parksensor', label: 'Parkeringssensorer', pattern: /\b(park\s*assist|p-?sensor|parkeringssens|pdc|park\s*pilot)\b/i, category: 'tech' },
  { key: 'blis', label: 'Döda vinkeln-varnare', pattern: /\b(blis|blind\s*spot|dödvink)\b/i, category: 'safety' },
  { key: 'adaptiv_farthallare', label: 'Adaptiv farthållare', pattern: /\b(acc|adaptiv\s*fart|adaptive\s*cruise|distronic)\b/i, category: 'safety' },
  { key: 'keyless', label: 'Keyless', pattern: /\b(keyless|nyckellös|comfort\s*access)\b/i, category: 'comfort' },
  { key: 'premium_audio', label: 'Premiumljud', pattern: /\b(b&w|bowers|harman|h\/k|burmester|bose|meridian|bang\s*&?\s*olufsen)\b/i, category: 'audio' },
  { key: 'matrix_ljus', label: 'Matrix-/LED-strålkastare', pattern: /\b(matrix|led-?strålk|laserljus|adaptive\s*led)\b/i, category: 'tech' },
  { key: 'voc', label: 'Fjärrstyrning (app)', pattern: /\b(voc|connected\s*services|remote\s*app)\b/i, category: 'tech' },
  { key: 'sport', label: 'Sportpaket', pattern: /\b(m[\s-]?sport|amg(\s*line)?|r[\s-]?design|s[\s-]?line|polestar\s*engineered|st[\s-]?line)\b/i, category: 'sport' },
  { key: 'fyrhjulsstyrning', label: '4-hjulsstyrning', pattern: /\b(4ws|fyrhjulsst|rear[\s-]?wheel\s*steer|all[\s-]?wheel\s*steer)\b/i, category: 'tech' },
  { key: 'luftfjadring', label: 'Luftfjädring', pattern: /\b(luftfjädr|air\s*suspension|airmatic)\b/i, category: 'comfort' },
  { key: 'sju_sits', label: '7-sits', pattern: /\b(7-?sits|7\s*sits|seven\s*seat|7\s*seater|tredje\s*sätesrad)\b/i, category: 'utility' },
  { key: 'momsbil', label: 'Momsbil', pattern: /\b(moms(bil)?|vat[\s-]?qualifying)\b/i, category: 'other' },
];

/** Returnera alla tillval som matchas i en model_raw-sträng. */
export function parseEquipment(modelRaw: string | null | undefined): EquipmentTag[] {
  if (!modelRaw) return [];
  const found: EquipmentTag[] = [];
  const seen = new Set<string>();
  for (const tag of EQUIPMENT_TAGS) {
    if (seen.has(tag.key)) continue;
    if (tag.pattern.test(modelRaw)) {
      found.push(tag);
      seen.add(tag.key);
    }
  }
  return found;
}

/** Topp-N viktigaste tillvalen för en bil (för att visa på kort). */
export function topEquipment(modelRaw: string | null | undefined, n: number = 5): EquipmentTag[] {
  const all = parseEquipment(modelRaw);
  // Prioritera utility > safety > tech > comfort > audio > sport > other
  const order: Record<EquipmentTag['category'], number> = {
    utility: 0, safety: 1, tech: 2, comfort: 3, audio: 4, sport: 5, other: 6,
  };
  return [...all].sort((a, b) => order[a.category] - order[b.category]).slice(0, n);
}

/** Slå upp en EquipmentTag på key (för filter). */
export function getEquipmentTag(key: string): EquipmentTag | undefined {
  return EQUIPMENT_TAGS.find(t => t.key === key);
}