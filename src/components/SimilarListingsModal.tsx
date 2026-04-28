import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, ExternalLink, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { Car } from './GuidedSearch';

interface Props {
  car: Car | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (p: number | null | undefined) =>
  p ? new Intl.NumberFormat('sv-SE').format(p) : '–';

const formatMileage = (m: number | null | undefined) =>
  typeof m === 'number' ? `${new Intl.NumberFormat('sv-SE').format(m)} mil` : '–';

export function SimilarListingsModal({ car, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !car) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setListings([]);

    supabase.functions
      .invoke('similar-listings', {
        body: { make: car.make, model: car.model, year: car.year, excludeId: car.id },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
        } else if (data?.success) {
          setListings(data.listings || []);
        } else {
          setError(data?.error || 'Okänt fel');
        }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Nätverksfel');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, car]);

  if (!car) return null;

  const cheapest = listings[0];
  const baseTitle = `${car.make ?? ''} ${car.model ?? ''} ${car.year ?? ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Andra dealers med {baseTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Samma modell ±1 år — sorterat efter pris (lägst först)
          </p>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Söker andra dealers...
          </div>
        )}

        {error && (
          <div className="py-6 text-center text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Inga andra dealers hittades med samma modell just nu.
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="space-y-3 mt-4">
            {/* Den valda bilen som referens */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              {car.image_thumb_url && (
                <img
                  src={car.image_thumb_url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Din matchning
                  </span>
                </div>
                <div className="font-semibold text-sm truncate">{baseTitle}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="font-bold text-foreground">{formatPrice(car.price)} kr</span>
                  <span>•</span>
                  <span>{formatMileage(car.mileage)}</span>
                  {car.dealer_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {car.dealer_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Andra listas */}
            {listings.map((l, idx) => {
              const isCheapest = l.id === cheapest?.id;
              const priceDiff =
                car.price && l.price ? l.price - car.price : null;

              return (
                <a
                  key={l.id}
                  href={l.listing_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-card transition-all"
                >
                  {l.image_thumb_url ? (
                    <img
                      src={l.image_thumb_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isCheapest && (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0 gap-1 bg-amber-500/90 hover:bg-amber-500 text-white">
                          <Crown className="h-2.5 w-2.5" />
                          BÄSTA PRISET
                        </Badge>
                      )}
                      {priceDiff !== null && priceDiff < 0 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-500/40 text-green-600 dark:text-green-400">
                          {Math.round((priceDiff / (car.price || 1)) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-sm truncate">
                      {l.make} {l.model} {l.year}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="font-bold text-foreground">{formatPrice(l.price)} kr</span>
                      <span>•</span>
                      <span>{formatMileage(l.mileage)}</span>
                      {l.dealer_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 truncate max-w-[180px]">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{l.dealer_name}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                </a>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
