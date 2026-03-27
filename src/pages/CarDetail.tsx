import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ExternalLink, Fuel, Calendar, Gauge, MapPin, Car, Palette,
  Settings2, Sparkles, Zap, Shield, Weight, Package,
  Timer, Droplets, Leaf, ShieldCheck, BatteryCharging,
} from 'lucide-react';
import type { Car as CarType } from '@/components/GuidedSearch';
import {
  calcAnnualTax, getWarranty, formatWarranty, formatNcapStars,
  formatZeroHundred, formatBootSpace,
} from '@/lib/carData';

/* ── Types ── */
interface CarModelData {
  body_type: string | null;
  fuel_consumption_l100km: number | null;
  electric_range_km: number | null;
  co2_g_per_km: number | null;
  euro_ncap_stars: number | null;
  euro_ncap_year: number | null;
  ncap_source: string | null;
  drivetrain_default: string | null;
  typical_hp_min: number | null;
  typical_hp_max: number | null;
  zero_to_hundred_sec: number | null;
  boot_space_liters: number | null;
  max_towing_kg: number | null;
  seats: number | null;
  reliability_notes: string | null;
  estimated_monthly_insurance_low: number | null;
  estimated_monthly_insurance_high: number | null;
  estimated_annual_service_sek: number | null;
  annual_tax_sek: number | null;
}

interface CarMakeData {
  warranty_years: number;
  warranty_km: number;
  roadside_assistance_years: number;
  country_of_origin: string | null;
  notes: string | null;
}

/* ── Helpers ── */
const fmt = (n: number | null | undefined) =>
  n ? new Intl.NumberFormat('sv-SE').format(n) : null;

const formatPrice = (price: number | null) => {
  if (!price) return 'Kontakta säljare';
  return fmt(price) + ' kr';
};

const fuelPricePerLiter: Record<string, number> = {
  bensin: 17.5,
  diesel: 19.5,
  e85: 14,
};

function estimateMonthlyFuel(
  fuelType: string | null,
  consumptionL100km: number | null,
  electricRangeKm: number | null
): { amount: number; label: string; detail: string } {
  const fuel = (fuelType ?? '').toLowerCase();
  const kmPerMonth = 1250; // 15 000 km/år

  if (fuel.includes('el') || fuel.includes('electric')) {
    const kwh = 0.20; // kWh/km
    const priceKwh = 2; // kr/kWh
    const amount = Math.round(kmPerMonth * kwh * priceKwh);
    return { amount, label: 'Drivmedel', detail: `Laddning: ~${kwh * 100} kWh/100km × ${priceKwh} kr/kWh` };
  }

  if (fuel.includes('hybrid') && electricRangeKm && electricRangeKm > 30) {
    const elCost = (kmPerMonth * 0.5) * 0.20 * 2;
    const fuelCost = consumptionL100km
      ? (kmPerMonth * 0.5 / 100) * consumptionL100km * 17.5
      : 800;
    const amount = Math.round(elCost + fuelCost);
    return { amount, label: 'Drivmedel', detail: `Laddhybrid: ~50% el + 50% bensin` };
  }

  if (consumptionL100km && consumptionL100km > 0) {
    const pricePerL = fuel.includes('diesel')
      ? fuelPricePerLiter.diesel
      : fuel.includes('e85')
        ? fuelPricePerLiter.e85
        : fuelPricePerLiter.bensin;
    const fuelName = fuel.includes('diesel') ? 'Diesel' : fuel.includes('e85') ? 'E85' : 'Bensin';
    const amount = Math.round((kmPerMonth / 100) * consumptionL100km * pricePerL);
    return { amount, label: 'Drivmedel', detail: `${fuelName}: ${String(consumptionL100km).replace('.', ',')} l/100km × ${pricePerL} kr/l` };
  }

  // Fallback
  if (fuel.includes('diesel')) return { amount: 2000, label: 'Drivmedel', detail: 'Diesel, uppskattat genomsnitt' };
  if (fuel.includes('hybrid')) return { amount: 1500, label: 'Drivmedel', detail: 'Hybrid, uppskattat genomsnitt' };
  return { amount: 2500, label: 'Drivmedel', detail: 'Bensin, uppskattat genomsnitt' };
}

/* ── Component ── */
const CarDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [car, setCar] = useState<CarType | null>((location.state as any)?.car || null);
  const [isLoading, setIsLoading] = useState(!car);
  const [modelData, setModelData] = useState<CarModelData | null>(null);
  const [makeData, setMakeData] = useState<CarMakeData | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Fetch car if not passed via state
  useEffect(() => {
    if (!car && id) {
      (async () => {
        const { data } = await supabase.from('Lovable').select('*').eq('id', Number(id)).single();
        if (data) setCar(data as CarType);
        setIsLoading(false);
      })();
    }
  }, [id, car]);

  // Fetch enriched model + make data
  useEffect(() => {
    if (!car?.make || !car?.model) return;
    const fetchEnriched = async () => {
      const [modelRes, makeRes] = await Promise.all([
        supabase.from('car_models').select('*').eq('make', car.make!).eq('model', car.model!).maybeSingle(),
        supabase.from('car_makes').select('*').eq('make', car.make!).maybeSingle(),
      ]);
      if (modelRes.data) setModelData(modelRes.data as unknown as CarModelData);
      if (makeRes.data) setMakeData(makeRes.data as unknown as CarMakeData);
    };
    fetchEnriched();
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

  const displayTitle = car.model_raw || car.model || '';
  const warranty = getWarranty(car.make);

  // Costs
  const co2 = modelData?.co2_g_per_km ?? null;
  const annualTax = modelData?.annual_tax_sek ?? calcAnnualTax(co2, car.fuel_type);
  const monthlyTax = Math.round(annualTax / 12);

  const fuelEst = estimateMonthlyFuel(
    car.fuel_type,
    modelData?.fuel_consumption_l100km ?? null,
    modelData?.electric_range_km ?? null
  );

  const insuranceLow = modelData?.estimated_monthly_insurance_low ?? null;
  const insuranceHigh = modelData?.estimated_monthly_insurance_high ?? null;
  const insuranceLabel = insuranceLow && insuranceHigh
    ? `${fmt(insuranceLow)}–${fmt(insuranceHigh)} kr/mån`
    : insuranceLow
      ? `~${fmt(insuranceLow)} kr/mån`
      : '~800 kr/mån';

  const annualService = modelData?.estimated_annual_service_sek ?? null;
  const monthlyService = annualService ? Math.round(annualService / 12) : null;

  const totalMonthly = fuelEst.amount + monthlyTax
    + (insuranceLow && insuranceHigh ? Math.round((insuranceLow + insuranceHigh) / 2) : 800)
    + (monthlyService ?? 400);

  /* ── Spec cards ── */
  const specs = [
    { icon: Calendar, label: 'Årsmodell', value: car.year ? String(car.year) : null },
    { icon: Gauge, label: 'Mätarställning', value: car.mileage ? `${fmt(car.mileage)} mil` : null },
    { icon: Fuel, label: 'Drivmedel', value: car.fuel_type },
    { icon: MapPin, label: 'Plats', value: car.city },
    { icon: Palette, label: 'Färg', value: car.color && car.color !== 'Okänd' ? car.color : null },
    { icon: Settings2, label: 'Drivlina', value: car.drivetrain || modelData?.drivetrain_default },
    { icon: Zap, label: 'Hästkrafter', value: car.horsepower ? `${car.horsepower} hk` : modelData?.typical_hp_min ? `${modelData.typical_hp_min}–${modelData.typical_hp_max ?? modelData.typical_hp_min} hk` : null },
    { icon: Settings2, label: 'Växellåda', value: car.transmission },
    { icon: Timer, label: '0–100 km/h', value: formatZeroHundred(modelData?.zero_to_hundred_sec ?? null) },
    { icon: Package, label: 'Bagageutrymme', value: formatBootSpace(modelData?.boot_space_liters ?? null) },
    { icon: Weight, label: 'Max dragvikt', value: modelData?.max_towing_kg ? `${fmt(modelData.max_towing_kg)} kg` : null },
    { icon: Car, label: 'Antal säten', value: modelData?.seats ? String(modelData.seats) : null },
    { icon: Droplets, label: 'Förbrukning', value: modelData?.fuel_consumption_l100km ? `${String(modelData.fuel_consumption_l100km).replace('.', ',')} l/100km` : null },
    { icon: BatteryCharging, label: 'Elräckvidd', value: modelData?.electric_range_km ? `${modelData.electric_range_km} km` : null },
    { icon: Leaf, label: 'CO₂-utsläpp', value: co2 ? `${co2} g/km` : null },
  ].filter(s => s.value);

  const ncapStars = modelData?.euro_ncap_stars ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>

          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden bg-card shadow-warm mb-6">
            {car.image_thumb_url ? (
              <img src={car.image_thumb_url} alt={`${car.make} ${displayTitle}`} className="w-full h-64 md:h-96 object-cover" />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <Car className="h-24 w-24 text-primary-foreground/40" />
              </div>
            )}
          </div>

          {/* Title + price */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{car.make} {displayTitle}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {car.fuel_type && <Badge variant="secondary">{car.fuel_type}</Badge>}
                {car.body_type && <Badge variant="outline">{car.body_type}</Badge>}
                {car.drivetrain && <Badge variant="outline">{car.drivetrain}</Badge>}
                {car.transmission && <Badge variant="outline">{car.transmission}</Badge>}
              </div>
              {car.regnr && (
                <div className="mt-2 inline-flex items-center bg-card border-2 border-foreground/20 rounded-md px-3 py-1">
                  <span className="text-sm font-bold font-mono tracking-[0.2em] uppercase text-foreground">{car.regnr}</span>
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
          </div>

          {/* NCAP + Warranty badges */}
          {(ncapStars || warranty) && (
            <div className="flex flex-wrap gap-3 mb-6">
              {ncapStars && (
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Euro NCAP</p>
                    <p className="font-semibold text-sm">
                      {formatNcapStars(ncapStars)}
                      {modelData?.euro_ncap_year ? ` (${modelData.euro_ncap_year})` : ''}
                    </p>
                  </div>
                </div>
              )}
              {warranty && (
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nybilsgaranti</p>
                    <p className="font-semibold text-sm">{formatWarranty(warranty)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reliability notes */}
          {modelData?.reliability_notes && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Tillförlitlighet</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">{modelData.reliability_notes}</p>
            </div>
          )}

          {/* All specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {specs.map((spec) => (
              <div key={spec.label} className="bg-card rounded-xl p-4 border border-border text-center">
                <spec.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="font-semibold text-sm">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Running costs */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold mb-1">Uppskattad månadskostnad</h2>
            <p className="text-xs text-muted-foreground mb-4">Baserat på 15 000 km/år</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {[
                { label: fuelEst.label, value: `${fmt(fuelEst.amount)} kr`, explain: fuelEst.detail },
                { label: 'Skatt', value: `${fmt(monthlyTax)} kr`, explain: co2 ? `Baserat på ${co2} g CO₂/km` : 'Baserat på schablonberäkning' },
                { label: 'Försäkring', value: insuranceLabel, explain: insuranceLow && insuranceHigh ? 'Baserat på modelldata för denna biltyp' : 'Genomsnittlig uppskattning — din ålder, ort och körsträcka påverkar priset' },
                { label: 'Service', value: monthlyService ? `~${fmt(monthlyService)} kr` : '~400 kr', explain: annualService ? `Baserat på uppskattat ${fmt(annualService)} kr/år för denna modell` : 'Genomsnittlig servicekostnad för bilar i denna klass' },
                { label: 'Totalt/mån', value: `~${fmt(totalMonthly)} kr`, bold: true, explain: 'Summan av bränsle, skatt, försäkring och service' },
              ].map((cost) => (
                <div key={cost.label} className="group relative">
                  <p className="text-xs text-muted-foreground">{cost.label}</p>
                  <p className={`font-semibold ${(cost as any).bold ? 'text-primary text-lg' : ''}`}>{cost.value}</p>
                  {(cost as any).explain && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">{(cost as any).explain}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60 italic">
              * Uppskattade siffror. Faktisk kostnad varierar beroende på din ålder, körvanor, försäkringsbolag och region.
            </p>
          </div>

          {/* Dealer info */}
          {car.dealer_name && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">Säljare</h2>
              <p className="text-sm text-muted-foreground">{car.dealer_name}</p>
              {car.city && <p className="text-sm text-muted-foreground">{car.city}</p>}
            </div>
          )}

          {/* CTA */}
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
