/**
 * Bild-optimering för annonsbilder.
 *
 * Blockets CDN (images.blocketcdn.se) levererar som standard en liten variant
 * (575×431). Med både `width` OCH `height` satt kan den leverera upp till
 * 1280×960 — bara `width` cappas vid 767 px. WebP + quality=80 ger klart
 * skarpare bild till nästan samma filstorlek.
 *
 * Andra källor (t.ex. Bilförmedlingen) lämnas orörda.
 */

const OPTIMIZABLE_HOSTS = ['images.blocketcdn.se'];

/** 4:3 är annonsbildernas naturliga format hos Blocket. */
const ASPECT = 3 / 4;

/** CDN:en levererar aldrig mer än 1280 px bred — begär inte mer. */
const MAX_WIDTH = 1280;

export function carImageUrl(url: string | null | undefined, width: number): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (!OPTIMIZABLE_HOSTS.includes(u.hostname)) return url;
    const w = Math.min(Math.round(width), MAX_WIDTH);
    u.searchParams.set('width', String(w));
    u.searchParams.set('height', String(Math.round(w * ASPECT)));
    u.searchParams.set('format', 'webp');
    u.searchParams.set('quality', '80');
    return u.toString();
  } catch {
    return url;
  }
}

/** 1x/2x srcSet så att retina-skärmar får den skarpa varianten. */
export function carImageSrcSet(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  const one = carImageUrl(url, width);
  const two = carImageUrl(url, width * 2);
  if (one === two) return undefined;
  return `${one} 1x, ${two} 2x`;
}

/**
 * Stor variant för delning/SEO (Open Graph, JSON-LD). JPEG istället för WebP
 * eftersom vissa länkförhandsvisningar inte hanterar WebP.
 */
export function carShareImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (!OPTIMIZABLE_HOSTS.includes(u.hostname)) return url;
    u.searchParams.set('width', '1200');
    u.searchParams.set('height', '900');
    return u.toString();
  } catch {
    return url;
  }
}
