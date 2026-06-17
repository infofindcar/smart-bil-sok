import { useState } from 'react';
import { Heart, Fuel, MapPin, Store, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { Car } from './GuidedSearch';
import { topEquipment } from '@/lib/equipment';
import { SimilarListingsModal } from './SimilarListingsModal';

interface CarCardProps {
  car: Car;
  isSaved?: boolean;
  onToggleSave?: (car: Car) => void;
  matchReason?: string;
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

const ImageWithFade = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
    />
  );
};

export const CarCard = ({ car, isSaved = false, onToggleSave, matchReason }: CarCardProps) => {
  const navigate = useNavigate();
  const gradient = BRAND_GRADIENTS[car.make || ''] || 'from-secondary to-primary';
  const displayName = getDisplayName(car);
  const equipment = topEquipment(car.model_raw, 5);
  const [similarOpen, setSimilarOpen] = useState(false);

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
        {car.image_thumb_url ? (
          <ImageWithFade src={car.image_thumb_url!} alt={displayName} />
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
          <span className="inline-block bg-background/90 backdrop-blur-sm text-primary font-bold text-sm px-3 py-1 rounded-lg shadow-sm">
            {formatPrice(car.price)} kr
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(car);
          }}
          className="absolute top-2 right-2 w-12 h-12 md:w-10 md:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background active:scale-95 transition-all touch-target"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${isSaved ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive/70'}`}
          />
        </button>
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
          <div className="mt-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.04] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/90">
                Clutch tycker
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              {matchReason}
            </p>
          </div>
        )}

        {/* Visa fler dealers — öppnar modal med samma modell hos andra säljare */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSimilarOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
          }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary border-t border-border/30 pt-2 -mb-1 transition-colors"
        >
          <Store className="h-3.5 w-3.5" />
          Visa fler dealers med samma bil
        </button>
      </div>

      <SimilarListingsModal car={car} open={similarOpen} onOpenChange={setSimilarOpen} />
    </div>
  );
};
