import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { carImageUrl, carImageSrcSet } from '@/lib/carImage';

interface CarGalleryProps {
  images: (string | null | undefined)[] | null | undefined;
  /** Huvudbilden — används om listan är tom. */
  fallback?: string | null;
  alt: string;
}

/**
 * Bildgalleri för bilsidan: stor huvudbild + miniatyrrad, svep på mobil och
 * helskärmsläge vid klick. Bilder som inte kan laddas döljs automatiskt
 * (annonsbilder dör när annonsen tas bort).
 */
export const CarGallery = ({ images, fallback, alt }: CarGalleryProps) => {
  const all = useMemo(() => {
    const list = (images ?? [])
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean);
    if (list.length === 0 && fallback) list.push(fallback);
    return Array.from(new Set(list));
  }, [images, fallback]);

  const [broken, setBroken] = useState<Set<string>>(new Set());
  const usable = all.filter((u) => !broken.has(u));

  /**
   * Extra spärr mot reklam-/logobilder: bilfoton är liggande med normalt
   * format. Kvadratiska, stående eller extremt breda bilder är i praktiken
   * alltid bilfirmans banner — dessa döljs direkt när de laddats.
   */
  const checkAspect = (url: string, img: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return;
    // Aldrig dölja sista kvarvarande bilden — då blir sidan bildlös.
    if (usable.length <= 1) return;
    const ratio = w / h;
    if (ratio < 1.05 || ratio > 2.6) markBroken(url);
  };


  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const current = usable[Math.min(index, usable.length - 1)];

  useEffect(() => {
    if (index > usable.length - 1) setIndex(Math.max(0, usable.length - 1));
  }, [index, usable.length]);

  const go = (delta: number) => {
    if (usable.length < 2) return;
    setIndex((i) => (i + delta + usable.length) % usable.length);
  };

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, usable.length]);

  const markBroken = (url: string) =>
    setBroken((prev) => new Set(prev).add(url));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  if (!current) {
    return (
      <div className="rounded-2xl overflow-hidden bg-card shadow-warm mb-6">
        <div className="w-full h-64 md:h-96 bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
          <Car className="h-24 w-24 text-primary-foreground/40" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div
          className="relative rounded-2xl overflow-hidden bg-muted shadow-warm cursor-zoom-in h-64 md:h-96"
          onClick={() => setFullscreen(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Alla bilder ligger kvar i DOM:en och tonas in/ut — inget vitt blink
              eftersom bilden redan är laddad när man byter. */}
          {usable.map((url, i) => {
            const active = i === Math.min(index, usable.length - 1);
            const near = Math.abs(i - index) <= 1 || i === 0;
            return (
              <img
                key={url}
                src={carImageUrl(url, 960)}
                srcSet={carImageSrcSet(url, 960)}
                sizes="(max-width: 896px) 100vw, 896px"
                alt={active ? alt : ''}
                aria-hidden={!active}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={near ? 'high' : 'low'}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}
                onError={() => markBroken(url)}
                onLoad={(e) => checkAspect(url, e.currentTarget)}
              />
            );
          })}

          {usable.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Föregående bild"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Nästa bild"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm">
                {Math.min(index, usable.length - 1) + 1} / {usable.length}
              </span>
            </>
          )}
        </div>

        {usable.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {usable.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Visa bild ${i + 1}`}
                className={`relative flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border transition-all ${
                  i === index ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={carImageUrl(url, 160)}
                  srcSet={carImageSrcSet(url, 160)}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={() => markBroken(url)}
            onLoad={(e) => checkAspect(url, e.currentTarget)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setFullscreen(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            aria-label="Stäng"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative flex items-center justify-center h-[85vh] w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {usable.map((url, i) => {
              const active = i === Math.min(index, usable.length - 1);
              return (
                <img
                  key={url}
                  src={carImageUrl(url, 1280)}
                  alt={active ? alt : ''}
                  aria-hidden={!active}
                  decoding="async"
                  className={`absolute max-h-[85vh] max-w-[95vw] object-contain transition-opacity duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}
                  onError={() => markBroken(url)}
                  onLoad={(e) => checkAspect(url, e.currentTarget)}
                />
              );
            })}
          </div>

          {usable.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Föregående bild"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Nästa bild"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm px-3 py-1 rounded-md bg-card">
                {Math.min(index, usable.length - 1) + 1} / {usable.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
};
