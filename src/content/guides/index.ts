import type { Guide, GuideCategory } from './types';
import { guide as prisvard } from './prisvard-begagnad-bil';
import { guide as checklista } from './checklista-innan-bilkop';
import { guide as fallgropar } from './vanliga-fallgropar-privatkop-bil';
import { guide as besiktning } from './besiktningsprotokoll-vad-betyder-det';
import { guide as leasing } from './leasing-vs-kopa-begagnad-bil';
import { guide as vardeminskning } from './bilens-vardeminskning-vad-paverkar';
import { guide as elbil } from './elbil-eller-bensinbil-begagnad';
import { guide as finansiering } from './finansiera-bilkop-kontant-lan-leasing';
import { guide as bastaElbilen } from './basta-begagnade-elbilen';
import { guide as bastaSuv } from './basta-begagnade-suv';
import { guide as bastaLaddhybrid } from './basta-laddhybriden-begagnad';
import { guide as bastaSmabilen } from './basta-smabilen-begagnad';
import { guide as vilkenBil } from './vilken-bil-ska-jag-kopa';
import { guide as billigasteAtAga } from './billigaste-bilen-att-aga';
import { guide as xc60 } from './volvo-xc60-begagnad-kop-guide';
import { guide as model3 } from './tesla-model-3-begagnad';
import { guide as golf } from './volkswagen-golf-begagnad-kop-guide';
import { guide as v60 } from './volvo-v60-begagnad-kop-guide';
import { guide as bmw3 } from './bmw-3-serie-begagnad-kop-guide';

export type { Guide, GuideBlock, GuideCategory, GuideFaqItem } from './types';

/** Alla guider i visningsordning. */
export const guides: Guide[] = [
  prisvard,
  checklista,
  elbil,
  vilkenBil,
  bastaElbilen,
  bastaSuv,
  bastaLaddhybrid,
  bastaSmabilen,
  xc60,
  model3,
  golf,
  v60,
  bmw3,
  leasing,
  vardeminskning,
  finansiering,
  billigasteAtAga,
  fallgropar,
  besiktning,
];

/** Kategoriernas ordning på översiktssidan. */
export const guideCategories: GuideCategory[] = [
  'Vilken bil ska du välja?',
  'Innan köpet',
  'Modellguider',
  'Ekonomi & ägande',
  'Praktiska tips',
];

export const getGuideBySlug = (slug: string | undefined): Guide | undefined =>
  slug ? guides.find((g) => g.slug === slug) : undefined;

export const getGuidesByCategory = (category: GuideCategory): Guide[] =>
  guides.filter((g) => g.category === category);


export const getRelatedGuides = (guide: Guide): Guide[] =>
  guide.related
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is Guide => Boolean(g));
