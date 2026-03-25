import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Fuel, Calendar, Gauge, MapPin, Car, Palette, Settings2, Sparkles } from 'lucide-react';
import type { Car as CarType } from '@/components/GuidedSearch';
import { calcAnnualTax, calcMonthlyFuelCost, type CarModel } from '@/lib/carData';

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
  const [carModel, setCarModel] = useState<CarModel | null>(null);
  const [isLoading, setIsLoading] = useState(!car);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!car && id) {
      const fetchCar = async () => {
        const { data } = await supabase.from('Lovable').select('*').eq('id', Number(id)).single();
        if (data) setCar(data as CarType);
        setIsLoading(false);
      };
      fetchCar();
    }
  }, [id, car]);

  useEffect(() => {
    if (car?.make && car?.model) {
      supabase
        .from('car_models')
        .select('*')
        .eq('make', car.make)
        .eq('model', car.model)
        .maybeSingle()
        .then(({ data }) => { if (data) setCarModel(data as CarModel); });
    }
  }, [car?.make, car?.model]);

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

  const fuelCost = calcMonthlyFuelCost(carModel?.fuel_consumption_l100km ?? null, car.fuel_type ?? null);
  const annualTax = calcAnnualTax(carModel?.co2_g_per_km ?? null, car.fuel_type ?? null);
  const monthlyTax = Math.round(annualTax / 12);
  const insuranceLow  = carModel?.estimated_monthly_insurance_low  ?? null;
  const insuranceHigh = carModel?.estimated_monthly_insurance_high ?? null;
  const annualService = carModel?.estimated_annual_service_sek     ?? null;

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
            <h2 className="text-xl font-bold mb-1">Driftskostnader</h2>
            <p className="text-xs text-muted-foreground mb-4">Baserat på ca 1 500 km/mån</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">{fuelCost.label}</p>
                <p className="font-semibold">
                  {new Intl.NumberFormat('sv-SE').format(fuelCost.cost)} kr/mån
                </p>
                {!fuelCost.isExact && <p className="text-[10px] text-muted-foreground/60">uppskattad</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Försäkring</p>
                <p className="font-semibold">
                  {insuranceLow && insuranceHigh
                    ? `${new Intl.NumberFormat('sv-SE').format(insuranceLow)}–${new Intl.NumberFormat('sv-SE').format(insuranceHigh)} kr/mån`
                    : '700–1 400 kr/mån'}
                </p>
                <p className="text-[10px] text-muted-foreground/60">uppskattad</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fordonsskatt</p>
                <p className="font-semibold">{new Intl.NumberFormat('sv-SE').format(monthlyTax)} kr/mån</p>
                {carModel?.co2_g_per_km
                  ? <p className="text-[10px] text-muted-foreground/60">{carModel.co2_g_per_km} g CO₂/km</p>
                  : <p className="text-[10px] text-muted-foreground/60">uppskattad</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service/år</p>
                <p className="font-semibold">
                  {annualService
                    ? `${new Intl.NumberFormat('sv-SE').format(annualService)} kr/år`
                    : '4 000–6 000 kr/år'}
                </p>
                <p className="text-[10px] text-muted-foreground/60">uppskattad</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60 italic">
              * Försäkring och service är uppskattningar för denna bilmodell. Bränsle beräknat på {fuelCost.isExact ? 'verklig WLTP-förbrukning' : 'typisk förbrukning'} och {fuelCost.label === 'Laddning' ? '2,50 kr/kWh' : '22 kr/l'}. Fordonsskatt {carModel?.co2_g_per_km ? 'beräknad på faktiskt CO₂-värde' : 'uppskattad'}.
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
