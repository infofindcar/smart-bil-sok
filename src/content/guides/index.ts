import type { Guide, GuideCategory } from './types';
import { guide as prisvard } from './prisvard-begagnad-bil';
import { guide as checklista } from './checklista-innan-bilkop';
import { guide as fallgropar } from './vanliga-fallgropar-privatkop-bil';
import { guide as besiktning } from './besiktningsprotokoll-vad-betyder-det';
import { guide as leasing } from './leasing-vs-kopa-begagnad-bil';
import { guide as vardeminskning } from './bilens-vardeminskning-vad-paverkar';
import { guide as elbil } from './elbil-eller-bensinbil-begagnad';
import { guide as finansiering } from './finansiera-bilkop-kontant-lan-leasing';

export type { Guide, GuideBlock, GuideCategory, GuideFaqItem } from './types';

/** Alla guider i visningsordning. */
export const guides: Guide[] = [
  prisvard,
  checklista,
  elbil,
  leasing,
  vardeminskning,
  finansiering,
  fallgropar,
  besiktning,
];

/** Kategoriernas ordning på översiktssidan. */
export const guideCategories: GuideCategory[] = ['Innan köpet', 'Ekonomi & ägande', 'Praktiska tips'];

export const getGuideBySlug = (slug: string | undefined): Guide | undefined =>
  slug ? guides.find((g) => g.slug === slug) : undefined;

export const getGuidesByCategory = (category: GuideCategory): Guide[] =>
  guides.filter((g) => g.category === category);

export const getRelatedGuides = (guide: Guide): Guide[] =>
  guide.related
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is Guide => Boolean(g));
