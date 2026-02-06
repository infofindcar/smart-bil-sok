import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Fuel, Calendar, Gauge, MapPin, Car, Palette, Settings2, Sparkles } from 'lucide-react';
import type { Car as CarType } from '@/components/GuidedSearch';

const formatPrice = (price: number | null) => {
  if (!price) return 'Kontakta säljare';
  return new Intl.NumberFormat('sv-SE').format(price) + ' kr';
};

const generateDescription = (car: CarType): string => {
  const parts: string[] = [];

  const displayModel = car.model_raw || `${car.make} ${car.model}`;
  parts.push(`${car.make} ${displayModel}`);

  if (car.year) {
    parts[0] += ` från ${car.year}`;
  }

  const features: string[] = [];
  if (car.fuel_type) features.push(car.fuel_type.toLowerCase());
  if (car.drivetrain) features.push(car.drivetrain);
  if (car.body_type) features.push(car.body_type.toLowerCase());

  if (features.length > 0) {
    parts.push(`Det är en ${features.join(', ')}`);
  }

  if (car.mileage) {
    const miltal = new Intl.NumberFormat('sv-SE').format(car.mileage);
    if (car.mileage < 5000) {
      parts.push(`med mycket lågt miltal på bara ${miltal} mil`);
    } else if (car.mileage < 10000) {
      parts.push(`med lågt miltal på ${miltal} mil`);
    } else {
      parts.push(`med ${miltal} mil på mätaren`);
    }
  }

  if (car.color) {
    parts.push(`Färgen är ${car.color.toLowerCase()}`);
  }

  if (car.price) {
    const pris = new Intl.NumberFormat('sv-SE').format(car.price);
    parts.push(`Priset ligger på ${pris} kr`);
  }

  return parts.join('. ') + '.';
};

const CarDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [car, setCar] = useState<CarType | null>((location.state as any)?.car || null);
  const [isLoading, setIsLoading] = useState(!car);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!car && id) {
      const fetchCar = async () => {
        const { data } = await supabase.from('cars').select('*').eq('id', Number(id)).single();
        if (data) setCar(data as CarType);
        setIsLoading(false);
      };
      fetchCar();
    }
  }, [id, car]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse-subtle text-muted-foreground">Laddar...</div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-muted-foreground">Bilen hittades inte.</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      </div>
    );
  }

  const displayTitle = car.model_raw || `${car.model}`;

  const fuelKey = car.fuel_type?.toLowerCase().includes('el')
    ? 'el'
    : car.fuel_type?.toLowerCase().includes('diesel')
      ? 'diesel'
      : car.fuel_type?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'bensin';

  const fuelCosts: Record<string, { monthly: number; label: string }> = {
    el: { monthly: 500, label: 'Laddning' },
    diesel: { monthly: 2000, label: 'Diesel' },
    bensin: { monthly: 2500, label: 'Bensin' },
    hybrid: { monthly: 1500, label: 'Bränsle' },
  };
  const fuelCost = fuelCosts[fuelKey] || fuelCosts.bensin;

  const description = generateDescription(car);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>

          <div className="rounded-2xl overflow-hidden bg-card shadow-warm mb-6">
            {car.image_thumb_url ? (
              <img
                src={car.image_thumb_url}
                alt={`${car.make} ${displayTitle}`}
                className="w-full h-64 md:h-96 object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <Car className="h-24 w-24 text-primary-foreground/40" />
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {car.make} {displayTitle}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {car.fuel_type && <Badge variant="secondary">{car.fuel_type}</Badge>}
                {car.body_type && <Badge variant="outline">{car.body_type}</Badge>}
                {car.drivetrain && <Badge variant="outline">{car.drivetrain}</Badge>}
                {car.color && <Badge variant="outline">{car.color}</Badge>}
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">Om bilen</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Calendar, label: 'Årsmodell', value: car.year || '–' },
              {
                icon: Gauge,
                label: 'Mätarställning',
                value: car.mileage ? `${new Intl.NumberFormat('sv-SE').format(car.mileage)} mil` : '–',
              },
              { icon: Fuel, label: 'Drivmedel', value: car.fuel_type || '–' },
              { icon: MapPin, label: 'Plats', value: car.city || '–' },
              ...(car.color ? [{ icon: Palette, label: 'Färg', value: car.color }] : []),
              ...(car.drivetrain ? [{ icon: Settings2, label: 'Drivlina', value: car.drivetrain }] : []),
            ].map((spec) => (
              <div key={spec.label} className="bg-card rounded-xl p-4 border border-border text-center">
                <spec.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="font-semibold text-sm">{String(spec.value)}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Uppskattade driftskostnader</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: fuelCost.label, value: `${fuelCost.monthly} kr/mån` },
                { label: 'Försäkring', value: '~800 kr/mån' },
                { label: 'Skatt', value: '~300 kr/mån' },
                { label: 'Service', value: '~400 kr/mån' },
              ].map((cost) => (
                <div key={cost.label}>
                  <p className="text-xs text-muted-foreground">{cost.label}</p>
                  <p className="font-semibold">{cost.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60 italic">
              * Uppskattade siffror baserade på genomsnittliga kostnader. Faktisk kostnad varierar beroende på körvanor, försäkringsbolag och region.
            </p>
          </div>

          {car.listing_url && (
            <Button className="w-full h-14 text-lg" onClick={() => window.open(car.listing_url!, '_blank')}>
              <ExternalLink className="h-5 w-5 mr-2" />
              Kontakta återförsäljare
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
