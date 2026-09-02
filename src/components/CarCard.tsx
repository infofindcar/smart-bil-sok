import { useEffect, useState } from 'react';
import { Heart, Fuel, MapPin, Store, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Car } from './GuidedSearch';
import { topEquipment } from '@/lib/equipment';
import { SimilarListingsModal } from './SimilarListingsModal';
import { ShareCar } from './ShareCar';


interface CarCardProps {
  car: Car;
  isSaved?: boolean;
  onToggleSave?: (car: Car) => void;
  matchReason?: string;
  /** Anropas om bilden inte kan laddas så föräldern kan ta bort kortet ur griden (inget tomrum). */
  onImageUnavailable?: (carId: number) => void;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Kontakta';
  return new Intl.NumberFormat('sv-SE').format(price);
};

const BRAND_GRADIENTS: Record<string, string> = {
  Volvo: 'from-blue-900 to-blue-700',
  BMW: 'from-blue-800 to-blue-500',
  'Mercedes-Benz': 'from-gray-800 to-gray-600',
  Audi: 'from-gray-900 to-red-900',
  Tesla: 'from-red-700 to-red-500',
  Toyota: 'from-red-800 to-red-600',
  Volkswagen: 'from-blue-800 to-blue-600',
};

/** Clean display title: use model (not model_raw which can contain junk like "Fordonskatt") */
const getDisplayName = (car: Car) => {
  const make = car.make || '';
  const model = car.model || '';
  return `${make} ${model}`.trim() || 'Okänd bil';
};

const ImageWithFade = ({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={carImageUrl(src, 480)}
      srcSet={carImageSrcSet(src, 480)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt={alt}
      className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={onError}
    />
  );
};

export const CarCard = ({ car, isSaved = false, onToggleSave, matchReason, onImageUnavailable }: CarCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const gradient = BRAND_GRADIENTS[car.make || ''] || 'from-secondary to-primary';
  const displayName = getDisplayName(car);
  const equipment = topEquipment(car.model_raw, 5);
  const [similarOpen, setSimilarOpen] = useState(false);

  const unusable = !car.image_thumb_url || imageError;

  // Meddela föräldern så att kortet tas bort ur griden helt (annars blir det tomrum).
  useEffect(() => {
    if (unusable) onImageUnavailable?.(car.id);
  }, [unusable, car.id, onImageUnavailable]);

  // Bilar utan användbar bild visas inte alls (ingen bokstavs-platshållare).
  if (unusable) return null;

  return (
    <div
      className="group relative flex flex-col bg-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      onClick={() => navigate(`/car/${car.id}`, { state: { car } })}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/car/${car.id}`, { state: { car } }); } }}
    >
      {/* Image */}
      <div className="relative w-full h-48 sm:h-48 flex-shrink-0 overflow-hidden bg-muted">
        {car.image_thumb_url && !imageError ? (
          <ImageWithFade src={car.image_thumb_url!} alt={displayName} onError={() => setImageError(true)} />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-3xl font-serif font-bold text-white/80">
              {car.make?.charAt(0) || '?'}
            </span>
          </div>
        )}

        {/* Gradient overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Price badge on image */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-block bg-background/95 backdrop-blur-sm text-primary font-bold text-base px-3 py-1 rounded-lg shadow-md">
            {formatPrice(car.price)} kr
          </span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <ShareCar car={car} variant="icon" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              const wasSaved = isSaved;
              onToggleSave?.(car);
              if (!wasSaved) {
                try {
                  const seen = sessionStorage.getItem('findcar-saved-toast-seen');
                  if (!seen) {
                    toast.success('Sparad — jämför från menyn längre ned');
                    sessionStorage.setItem('findcar-saved-toast-seen', '1');
                  } else {
                    toast('Sparad', { duration: 1500 });
                  }
                } catch {}
                navigator.vibrate?.(10);
              }
            }}
            className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background active:scale-95 transition-all touch-target"
            aria-label={isSaved ? 'Ta bort från sparade' : 'Spara bilen'}
          >
            <Heart
              className={`h-5 w-5 transition-all ${isSaved ? 'fill-destructive text-destructive scale-110' : 'text-muted-foreground hover:text-destructive/70'}`}
            />
          </button>
        </div>

      </div>

      {/* Info */}
      <div className="flex flex-col p-4 flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate text-foreground">
          {displayName}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{car.year || '–'}</span>
          <span className="text-border">•</span>
          <span>{car.mileage ? `${new Intl.NumberFormat('sv-SE').format(car.mileage)} mil` : '–'}</span>
          {car.city && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {car.city}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {car.fuel_type && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
              <Fuel className="h-3 w-3 mr-1" />
              {car.fuel_type}
            </Badge>
          )}
          {car.body_type && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {car.body_type}
            </Badge>
          )}
        </div>

        {/* Tillval / utrustning från model_raw */}
        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {equipment.map((tag) => (
              <Badge
                key={tag.key}
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-primary/5 border-primary/20 text-foreground/80 font-normal"
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Personlig motivering från Clutch */}
        {matchReason && (
          <div className="mt-3 flex gap-2 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.04] px-2.5 py-2">
            <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/85 leading-relaxed">
              <span className="font-semibold text-primary/90">Clutch tycker: </span>
              {matchReason}
            </p>
          </div>
        )}

        {/* Visa fler dealers — sekundär textlänk */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSimilarOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
          }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-primary transition-colors self-start"
        >
          <Store className="h-3 w-3" />
          Fler dealers med samma bil
        </button>
      </div>

      <SimilarListingsModal car={car} open={similarOpen} onOpenChange={setSimilarOpen} />
    </div>
  );
};
