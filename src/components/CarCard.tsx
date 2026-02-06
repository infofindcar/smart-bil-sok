import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { Car } from './GuidedSearch';

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

export const CarCard = ({ car, isSaved = false, onToggleSave, matchReason }: CarCardProps) => {
  const navigate = useNavigate();
  const gradient = BRAND_GRADIENTS[car.make || ''] || 'from-secondary to-primary';

  return (
    <div
      className="group relative flex flex-col bg-card rounded-xl overflow-hidden shadow-warm border border-border hover-lift cursor-pointer"
      onClick={() => navigate(`/car/${car.id}`, { state: { car } })}
    >
      {/* Image */}
      <div className="relative w-full h-48 flex-shrink-0 overflow-hidden">
        {car.image_thumb_url ? (
          <img
            src={car.image_thumb_url}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-3xl font-serif font-bold text-white/80">
              {car.make?.charAt(0) || '?'}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(car);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
        >
          <Heart
            className={`h-4 w-4 ${isSaved ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col p-4 flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate">
          {car.make} {car.model}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {car.year} • {car.mileage ? `${new Intl.NumberFormat('sv-SE').format(car.mileage)} mil` : '–'} • {car.city || '–'}
        </p>
        <p className="text-primary font-bold text-lg mt-2">{formatPrice(car.price)} kr</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {car.fuel_type && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              {car.fuel_type}
            </Badge>
          )}
          {car.body_type && (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              {car.body_type}
            </Badge>
          )}
        </div>

        {/* Personlig motivering från Clutch */}
        {matchReason && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-xs italic text-muted-foreground leading-relaxed">
              "{matchReason}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
