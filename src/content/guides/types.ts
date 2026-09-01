// Typer för guide-innehållet. Allt innehåll är statisk, typad data — inga
// nätverksanrop krävs för att rendera en guide-sida.

export type GuideCategory =
  | 'Innan köpet'
  | 'Vilken bil ska du välja?'
  | 'Modellguider'
  | 'Ekonomi & ägande'
  | 'Praktiska tips';

export type GuideBlock =
  /** Underrubrik (renderas som h2), formulerad som fråga eller tydligt delämne. */
  | { type: 'h2'; text: string }
  /** Brödtextstycke. Stödjer **fet text** inline. */
  | { type: 'p'; text: string }
  /** Punktlista. Varje rad stödjer **fet text** inline. */
  | { type: 'ul'; items: string[] }
  /** Numrerad lista. Varje rad stödjer **fet text** inline. */
  | { type: 'ol'; items: string[] }
  /** Jämförelsetabell. Renderas responsivt med horisontell scroll på mobil. */
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  /** Kontextuell sök-CTA mitt i brödtexten — länkar till startsidan med förifylld fråga. */
  | { type: 'search'; label: string; query: string };


export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface Guide {
  /** URL-segment under /guider/ */
  slug: string;
  /** H1 — formulerad som sökbar fråga eller konkret ämne. */
  title: string;
  /** Unik <title> för sidan, ~60 tecken. */
  metaTitle: string;
  /** Meta description, ~155 tecken. */
  metaDescription: string;
  /** 1–2 meningars ingress som visas på kortet i /guider. */
  excerpt: string;
  category: GuideCategory;
  /** Uppskattad lästid i minuter. */
  readingMinutes: number;
  /** ISO-datum (YYYY-MM-DD) för senaste uppdatering. */
  updated: string;
  /** Direktsvar: 2–4 meningar som fungerar fristående. */
  answer: string;
  blocks: GuideBlock[];
  faq: GuideFaqItem[];
  /** Slugs till 2–3 relaterade guider. */
  related: string[];
}
