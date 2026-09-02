import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, Fuel, Calendar, Gauge, MapPin, Car, Palette,
  Settings2, Sparkles, Zap, Shield, Weight, Package,
  Timer, Droplets, Leaf, ShieldCheck, BatteryCharging, Send, CheckCircle,
} from 'lucide-react';
import type { Car as CarType } from '@/components/GuidedSearch';
import {
  calcAnnualTax, getWarranty, getActiveWarranty, formatActiveWarranty, formatNcapStars,
  formatZeroHundred, formatBootSpace, classifyFuel, estimateOwnershipCosts,
} from '@/lib/carData';

import { calcCarRating, benchmarkLabel, type PriceBenchmark, type CarRating } from '@/lib/carRating';
import { parseEquipment } from '@/lib/equipment';
import { SEO } from '@/components/SEO';
import { ShareCar } from '@/components/ShareCar';


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

const drivetrainLabel = (dt: string | null | undefined): string | null => {
  if (!dt || dt === 'Unknown' || dt === 'Okänd') return null;
  const map: Record<string, string> = {
    AWD: 'Fyrhjulsdrift', awd: 'Fyrhjulsdrift',
    FWD: 'Framhjulsdrift', fwd: 'Framhjulsdrift',
    RWD: 'Bakhjulsdrift', rwd: 'Bakhjulsdrift',
    '"AWD"': 'Fyrhjulsdrift', '"FWD"': 'Framhjulsdrift', '"RWD"': 'Bakhjulsdrift',
  };
  return map[dt] || dt;
};

const realDrivetrain = (dt: string | null | undefined): string | null =>
  !dt || dt === 'Unknown' || dt === 'Okänd' ? null : dt;

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
  const kind = classifyFuel(fuelType);
  const kmPerMonth = 1250; // 15 000 km/år

  if (kind === 'el') {
    const kwh = 0.20; // kWh/km
    const priceKwh = 2; // kr/kWh
    const amount = Math.round(kmPerMonth * kwh * priceKwh);
    return { amount, label: 'Drivmedel', detail: `Laddning: ~${kwh * 100} kWh/100km × ${priceKwh} kr/kWh` };
  }

  if ((kind === 'plugin' || kind === 'hybrid') && electricRangeKm && electricRangeKm > 30) {
    const elCost = (kmPerMonth * 0.5) * 0.20 * 2;
    const fuelCost = consumptionL100km
      ? (kmPerMonth * 0.5 / 100) * consumptionL100km * 17.5
      : 800;
    const amount = Math.round(elCost + fuelCost);
    return { amount, label: 'Drivmedel', detail: `Laddhybrid: ~50% el + 50% bensin` };
  }

  if (consumptionL100km && consumptionL100km > 0) {
    const pricePerL = kind === 'diesel'
      ? fuelPricePerLiter.diesel
      : kind === 'e85'
        ? fuelPricePerLiter.e85
        : fuelPricePerLiter.bensin;
    const fuelName = kind === 'diesel' ? 'Diesel' : kind === 'e85' ? 'E85' : 'Bensin';
    const amount = Math.round((kmPerMonth / 100) * consumptionL100km * pricePerL);
    return { amount, label: 'Drivmedel', detail: `${fuelName}: ${String(consumptionL100km).replace('.', ',')} l/100km × ${pricePerL} kr/l` };
  }

  // Fallback
  if (kind === 'diesel') return { amount: 2000, label: 'Drivmedel', detail: 'Diesel, uppskattat genomsnitt' };
  if (kind === 'hybrid' || kind === 'plugin') return { amount: 1500, label: 'Drivmedel', detail: 'Hybrid, uppskattat genomsnitt' };
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
  const [_makeData, setMakeData] = useState<CarMakeData | null>(null);
  const [benchmark, setBenchmark] = useState<PriceBenchmark | null>(null);
  const [showFactors, setShowFactors] = useState(false);

  // Contact form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Fetch car if not passed via state
  useEffect(() => {
    if (!car && id) {
      (async () => {
        // Tabellen blockerar anon-select via RLS — hämta via edge-funktion.
        const { data, error } = await supabase.functions.invoke('cars-public', {
          body: { action: 'get', id: Number(id) },
        });
        if (!error && data?.car) setCar(data.car as CarType);
        setIsLoading(false);
      })();
    }
  }, [id, car]);

  // Fetch enriched model + make data
  useEffect(() => {
    if (!car?.make || !car?.model) return;
    const fetchEnriched = async () => {
      const [modelRes, makeRes] = await Promise.all([
        // Fetch all models for this make and pick the longest prefix match.
        // Bilförmedlingen stores verbose models like "A3 1.4 TFSI FWD" while
        // car_models has short base names like "A3" — prefix matching bridges this.
        supabase.from('car_models').select('*').eq('make', car.make!),
        supabase.from('car_makes').select('*').eq('make', car.make!).maybeSingle(),
      ]);
      const modelMatch = (modelRes.data ?? [])
        .filter((m: { model: string }) => car.model!.toLowerCase().startsWith(m.model.toLowerCase()))
        .sort((a: { model: string }, b: { model: string }) => b.model.length - a.model.length)[0] ?? null;
      if (modelMatch) setModelData(modelMatch as unknown as CarModelData);
      if (makeRes.data) setMakeData(makeRes.data as unknown as CarMakeData);
    };
    fetchEnriched();
  }, [car?.make, car?.model]);

  // Prisjämförelse mot liknande bilar i vår egen databas (via edge-funktion,
  // eftersom anon-select på tabellen är blockerad av RLS).
  useEffect(() => {
    if (!car?.make || !car?.model || !car?.year || !car?.mileage || !car?.price) {
      setBenchmark(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke('cars-public', {
        body: {
          action: 'price_benchmark',
          make: car.make,
          model: car.model,
          bodyType: car.body_type ?? null,
          fuelType: car.fuel_type ?? null,
          year: car.year,
          mileage: car.mileage,
          price: car.price,
        },
      });
      if (!cancelled && !error && data?.benchmark) setBenchmark(data.benchmark as PriceBenchmark);
      if (!cancelled && (error || !data?.benchmark)) setBenchmark(null);
    })();
    return () => { cancelled = true; };
  }, [car?.make, car?.model, car?.body_type, car?.fuel_type, car?.year, car?.mileage, car?.price]);

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

  // Use model (cleaned) instead of model_raw which can contain junk data
  const displayTitle = car.model || '';
  const warranty = getWarranty(car.make);
  const activeWarranty = getActiveWarranty(warranty, car.year ?? null, car.mileage ?? null);
  const warrantyDisplay = formatActiveWarranty(activeWarranty);

  // Costs
  const co2 = modelData?.co2_g_per_km ?? null;
  const annualTax = modelData?.annual_tax_sek ?? calcAnnualTax(co2, car.fuel_type);
  const monthlyTax = Math.round(annualTax / 12);

  // Bara skicka el-räckvidd till bränslekostnadsberäkning om bilen faktiskt
  // är el/hybrid/plug-in. car_models-cachen är per make+model och inkluderar
  // ibland el-räckvidd för modeller som finns i flera versioner — vi vill
  // inte att en BMW 320i bensin får hybrid-versionens räckvidd.
  const fuelKind = classifyFuel(car.fuel_type);
  const isEvOrHybrid = fuelKind === 'el' || fuelKind === 'hybrid' || fuelKind === 'plugin';
  const fuelEst = estimateMonthlyFuel(
    car.fuel_type,
    modelData?.fuel_consumption_l100km ?? null,
    isEvOrHybrid ? (modelData?.electric_range_km ?? null) : null
  );

  // Age-based insurance adjustment
  const driverAge = (() => {
    try {
      const raw = sessionStorage.getItem('findcar-driver-age');
      if (raw) return JSON.parse(raw) as number | null;
    } catch {}
    return null;
  })();

  // Prisankrad ägandekostnad. Modelldatan (AI-uppskattad) används men klipps
  // mot ett ankare som utgår från bilens pris — annars får en Ferrari för
  // 2,5 Mkr samma försäkring som en Golf.
  const own = estimateOwnershipCosts({
    price: car.price ?? null,
    year: car.year ?? null,
    make: car.make ?? null,
    fuelType: car.fuel_type ?? null,
    horsepower: car.horsepower ?? null,
    insuranceLow: modelData?.estimated_monthly_insurance_low ?? null,
    insuranceHigh: modelData?.estimated_monthly_insurance_high ?? null,
    annualService: modelData?.estimated_annual_service_sek ?? null,
    driverAge,
  });

  const insuranceLabel = `${fmt(own.insuranceLow)}–${fmt(own.insuranceHigh)} kr/mån`;

  const insuranceExplain = (() => {
    const base = own.insuranceAdjusted
      ? 'Uppskattad utifrån bilens värde och klass'
      : 'Baserat på modelldata för denna biltyp';
    if (driverAge && driverAge < 25) return `${base}. Justerat uppåt för förare under 25 år`;
    if (driverAge && driverAge > 50) return `${base}. Justerat nedåt för erfaren förare (50+)`;
    if (driverAge) return `${base}. Baserat på din ålder (${driverAge} år)`;
    return `${base} — din ålder, ort och körsträcka påverkar priset`;
  })();

  const monthlyService = own.service;
  const annualService = own.serviceAnnual;

  // Två nivåer: löpande drift, och total ägandekostnad inkl. värdeminskning
  // och kapitalkostnad (den största posten för dyra bilar).
  const runningMonthly = fuelEst.amount + monthlyTax + own.insuranceAvg + own.service + own.misc;
  const totalMonthly = runningMonthly + own.depreciation + own.capital;

  const rating: CarRating | null = calcCarRating({
    price: car.price ?? null,
    year: car.year ?? null,
    mileage: car.mileage ?? null,
    ncapStars: modelData?.euro_ncap_stars ?? null,
    benchmark,
    runningMonthly,
  });


  /* ── Spec cards ── */
  const specs = [
    { icon: Calendar, label: 'Årsmodell', value: car.year ? String(car.year) : null },
    { icon: Gauge, label: 'Mätarställning', value: car.mileage ? `${fmt(car.mileage)} mil` : null },
    { icon: Fuel, label: 'Drivmedel', value: car.fuel_type },
    { icon: MapPin, label: 'Plats', value: car.city },
    { icon: Palette, label: 'Färg', value: car.color && car.color !== 'Okänd' ? car.color : null },
    { icon: Settings2, label: 'Drivlina', value: drivetrainLabel(realDrivetrain(car.drivetrain) || modelData?.drivetrain_default) },
    { icon: Zap, label: 'Hästkrafter', value: car.horsepower && car.horsepower > 0 ? `${car.horsepower} hk` : modelData?.typical_hp_min ? `${modelData.typical_hp_min}–${modelData.typical_hp_max ?? modelData.typical_hp_min} hk` : null },
    { icon: Settings2, label: 'Växellåda', value: car.transmission },
    { icon: Timer, label: '0–100 km/h', value: formatZeroHundred(modelData?.zero_to_hundred_sec ?? null) },
    { icon: Package, label: 'Bagageutrymme', value: formatBootSpace(modelData?.boot_space_liters ?? null) },
    { icon: Weight, label: 'Max dragvikt', value: modelData?.max_towing_kg ? `${fmt(modelData.max_towing_kg)} kg` : null },
    { icon: Car, label: 'Antal säten', value: modelData?.seats ? String(modelData.seats) : null },
    { icon: Droplets, label: 'Förbrukning', value: modelData?.fuel_consumption_l100km ? `${String(modelData.fuel_consumption_l100km).replace('.', ',')} l/100km` : null },
    { icon: BatteryCharging, label: 'Elräckvidd', value: isEvOrHybrid && modelData?.electric_range_km ? `${modelData.electric_range_km} km` : null },
    { icon: Leaf, label: 'CO₂-utsläpp', value: co2 ? `${co2} g/km` : null },
  ].filter(s => s.value);

  const ncapStars = modelData?.euro_ncap_stars ?? null;

  // SEO meta + Schema.org Car/Product
  const seoTitle = [car.make, displayTitle, car.year, car.price ? `${fmt(car.price)} kr` : null]
    .filter(Boolean).join(' ') + ' | FindCar';
  const seoDescParts = [
    car.year ? `Årsmodell ${car.year}` : null,
    car.mileage ? `${fmt(car.mileage)} mil` : null,
    car.fuel_type,
    car.transmission,
    car.city ? `i ${car.city}` : null,
  ].filter(Boolean);
  const seoDesc = `${car.make} ${displayTitle}${car.year ? ` ${car.year}` : ''}${car.price ? ` för ${fmt(car.price)} kr` : ''}. ${seoDescParts.join(', ')}. Hitta rätt bil med FindCar.`.slice(0, 158);
  const carJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${car.make} ${displayTitle}${car.year ? ` ${car.year}` : ''}`.trim(),
    brand: { '@type': 'Brand', name: car.make },
    model: displayTitle,
    vehicleModelDate: car.year ? String(car.year) : undefined,
    bodyType: car.body_type || undefined,
    fuelType: car.fuel_type || undefined,
    vehicleTransmission: car.transmission || undefined,
    mileageFromOdometer: car.mileage ? { '@type': 'QuantitativeValue', value: car.mileage * 10, unitCode: 'KMT' } : undefined,
    color: car.color && car.color !== 'Okänd' ? car.color : undefined,
    image: carShareImageUrl(car.image_thumb_url) || undefined,
    offers: car.price ? {
      '@type': 'Offer',
      price: car.price,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
      url: `https://findcar.se/car/${car.id}`,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={`/car/${car.id}`}
        type="product"
        image={car.image_thumb_url || undefined}
        jsonLd={carJsonLd}
      />
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <ShareCar car={car} />
          </div>


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
                {realDrivetrain(car.drivetrain) && <Badge variant="outline">{drivetrainLabel(car.drivetrain)}</Badge>}
                {car.transmission && <Badge variant="outline">{car.transmission}</Badge>}
              </div>
              {car.regnr && (
                <div className="mt-3 inline-flex items-center rounded overflow-hidden border border-border shadow-sm">
                  <div className="bg-[#003399] px-1.5 py-1.5 flex flex-col items-center justify-center self-stretch">
                    <span className="text-[8px] text-yellow-400 font-bold leading-none">★★★</span>
                    <span className="text-[7px] text-white font-bold leading-none mt-0.5">S</span>
                  </div>
                  <div className="bg-white px-3 py-1">
                    <span className="text-base font-bold font-mono tracking-[0.25em] uppercase text-gray-900">{car.regnr}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="md:text-right">
              <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
              {benchmark && (
                <div className="mt-2 md:flex md:justify-end">
                  <div
                    className={`inline-flex flex-col rounded-lg border px-3 py-2 text-left ${
                      benchmark.level === 'good'
                        ? 'border-primary/40 bg-primary/5'
                        : benchmark.level === 'high'
                          ? 'border-destructive/30 bg-destructive/5'
                          : 'border-border bg-muted/40'
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {benchmarkLabel(benchmark.level)}
                      {Math.abs(benchmark.diffPct) >= 0.03 && (
                        <span className="font-normal text-muted-foreground">
                          {' · '}
                          {fmt(Math.abs(benchmark.diff))} kr {benchmark.diff < 0 ? 'under' : 'över'} snittet
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 leading-tight">
                      Jämfört med {benchmark.count} liknande {car.make} {String(car.model || '').split(' ')[0]}
                      {benchmark.basis && benchmark.basis.length > 0 ? ` ${benchmark.basis.join(' ')}` : ''}
                      {benchmark.yearFrom ? `, ${benchmark.yearFrom}–${benchmark.yearTo}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FindCar-betyg */}
          {rating && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xl font-bold text-primary leading-none">
                    {rating.score.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/ 10</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">FindCar-betyg</p>
                  <p className="text-lg font-bold">{rating.label}</p>
                  {rating.isClassic && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">
                      Klassiker — bedöms på skick och pris, inte ålder
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFactors((v) => !v)}
                    className="text-xs text-primary hover:underline mt-0.5"
                  >
                    {showFactors ? 'Dölj detaljer' : 'Se hur betyget räknats'}
                  </button>
                </div>
              </div>

              {showFactors && (
                <div className="mt-4 space-y-3">
                  {rating.factors.map((f) => (
                    <div key={f.key}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">{f.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {f.informational
                            ? 'påverkar inte betyget'
                            : `${f.score.toFixed(1).replace('.', ',')} / 10 · vikt ${f.weight} %`}
                        </span>
                      </div>
                      {!f.informational && (
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.round(f.score * 10)}%` }}
                          />
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground/70 mt-1 leading-tight">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/60 italic mt-3 leading-tight">
                Betyget gäller den här annonsen — pris, skick, ägandekostnad och säkerhet — inte bilmodellen
                i sig. Åldern i sig sänker inte betyget. Det bygger på annonsens uppgifter och ersätter inte en
                besiktning eller provkörning.
              </p>
            </div>
          )}

          {/* NCAP + Warranty badges */}
          {(ncapStars || warrantyDisplay) && (
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
              {warrantyDisplay && (
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{warrantyDisplay.title}</p>
                    <p className="font-semibold text-sm">{warrantyDisplay.text}</p>
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

          {/* Utrustning & tillval (parsad från model_raw) */}
          {(() => {
            const equipment = parseEquipment(car.model_raw);
            if (equipment.length === 0) return null;
            return (
              <div className="bg-card rounded-2xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Utrustning & tillval</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {equipment.map((tag) => (
                    <Badge
                      key={tag.key}
                      variant="outline"
                      className="bg-primary/5 border-primary/20 text-foreground/90 font-normal"
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
                {car.model_raw && (
                  <p className="text-xs text-muted-foreground/70 italic leading-relaxed">
                    Säljarens beskrivning: "{car.model_raw}"
                  </p>
                )}
              </div>
            );
          })()}

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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
              {[
                { label: fuelEst.label, value: `${fmt(fuelEst.amount)} kr`, explain: fuelEst.detail },
                { label: 'Fordonsskatt', value: `${fmt(monthlyTax)} kr`, explain: co2 ? `Svensk fordonsskatt baserad på ${co2} g CO₂/km (${fmt(annualTax)} kr/år)` : `Uppskattad svensk fordonsskatt (${fmt(annualTax)} kr/år)` },
                { label: 'Försäkring', value: insuranceLabel, explain: insuranceExplain },
                { label: 'Service & reparation', value: `~${fmt(monthlyService)} kr`, explain: `Motsvarar ~${fmt(annualService)} kr/år för en bil i denna klass och prisnivå` },
                { label: 'Däck, besiktning m.m.', value: `~${fmt(own.misc)} kr`, explain: 'Däckbyte, besiktning, tvätt och småreparationer' },
              ].map((cost) => (
                <div key={cost.label} className="group relative">
                  <p className="text-xs text-muted-foreground">{cost.label}</p>
                  <p className="font-semibold">{cost.value}</p>
                  {cost.explain && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">{cost.explain}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-3">
              <p className="text-xs text-muted-foreground">Detta betalar du varje månad</p>
              <p className="text-2xl font-bold text-primary">~{fmt(runningMonthly)} kr/mån</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 leading-tight">
                Drivmedel, fordonsskatt, försäkring, service och slitage — pengar som faktiskt lämnar kontot.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 mb-4">
              <p className="text-xs text-muted-foreground">
                Bra att veta: bilen tappar också i värde
              </p>
              <p className="text-sm font-semibold mt-0.5">
                ~{fmt(own.depreciation + own.capital)} kr/mån i värdeminskning och bundet kapital
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 leading-tight">
                Ingen räkning du betalar — men bilen sjunker ~{Math.round(own.depreciationPct * 100)} % i värde per år
                (~{fmt(own.depreciation)} kr/mån) och pengarna du lagt i bilen kunde gjort nytta någon annanstans
                (~{fmt(own.capital)} kr/mån). Räknar man in det blir den verkliga kostnaden att äga bilen
                ~{fmt(totalMonthly)} kr/mån.
              </p>
            </div>


            <p className="text-[11px] text-muted-foreground/60 italic">
              * Uppskattade siffror baserade på bilens pris, ålder, drivmedel och modellklass. Faktisk kostnad varierar
              beroende på din ålder, körvanor, försäkringsbolag och region.
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

          {/* Transportstyrelsen-kontroll — extern länk till officiella myndighetsdata.
              Visas bara när vi har regnumret (~90% av bilarna). Hjälper kunden
              kolla servicehistorik, ev. lån, antal ägare, besiktningsstatus etc. */}
          {car.regnr && (
            <a
              href={`https://fordon-fu-regnr.transportstyrelsen.se/?Registreringsnummer=${encodeURIComponent(car.regnr.toUpperCase().replace(/\s+/g, ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-card rounded-2xl border border-border hover:border-primary/40 hover:bg-card/80 p-5 mb-6 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  Kolla bilen hos Transportstyrelsen
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Officiella myndighetsdata — ägarhistorik, besiktning, skatt och teknisk info. Gratis.
                </p>
              </div>
              <span className="flex-shrink-0 text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                {car.regnr.toUpperCase()} →
              </span>
            </a>
          )}

          {/* Contact form */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            {formSubmitted ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle className="h-14 w-14 text-primary" />
                <h2 className="text-xl font-bold">Tack för din förfrågan!</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Återförsäljaren har mottagit din förfrågan angående <span className="font-semibold text-foreground">{car.make} {displayTitle}</span> och kontaktar dig så snart som möjligt.
                </p>
                <p className="text-muted-foreground text-xs">
                  Håll utkik i din inkorg och telefon!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Kontakta säljare</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Fyll i dina uppgifter så hör vi av oss angående denna {car.make} {displayTitle}.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
                      toast.error('Vänligen fyll i alla obligatoriska fält.');
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formEmail.trim())) {
                      toast.error('Vänligen ange en giltig e-postadress.');
                      return;
                    }
                    setFormSubmitting(true);
                    const { error } = await supabase.from('leads').insert([{
                      car_id: car.id,
                      customer_name: formName.trim(),
                      customer_email: formEmail.trim(),
                      customer_phone: formPhone.trim(),
                      message: formMessage.trim() || null,
                      dealer_name: car.dealer_name || null,
                    }]);
                    setFormSubmitting(false);
                    if (error) {
                      toast.error('Något gick fel. Försök igen.');
                    } else {
                      setFormSubmitted(true);
                      toast.success('Din förfrågan har skickats!');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="lead-name">Namn *</Label>
                    <Input
                      id="lead-name"
                      placeholder="Ditt namn"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-email">E-post *</Label>
                    <Input
                      id="lead-email"
                      type="email"
                      placeholder="din@email.se"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-phone">Telefonnummer *</Label>
                    <Input
                      id="lead-phone"
                      type="tel"
                      placeholder="07X XXX XX XX"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-message">Övrig fråga (valfritt)</Label>
                    <Textarea
                      id="lead-message"
                      placeholder="Har du någon specifik fråga om bilen?"
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      maxLength={1000}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={formSubmitting}>
                    {formSubmitting ? 'Skickar...' : 'Skicka förfrågan'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
