import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SEO } from '@/components/SEO';
import { ListingAnalyzer } from '@/components/ListingAnalyzer';

// Lazy-load below-fold sections
const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
const HowItWorks = lazy(() => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const WhyFindCar = lazy(() => import('@/components/WhyFindCar').then((m) => ({ default: m.WhyFindCar })));
const FAQ = lazy(() => import('@/components/FAQ').then((m) => ({ default: m.FAQ })));
const CookieBanner = lazy(() => import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })));

const STORAGE_KEY = 'findcar-search-state';

type StoredSearchState = {
  cars?: Car[];
  carReasons?: CarReason[];
  savedCars?: Car[];
  resultMessage?: string;
  showResults?: boolean;
};

const getStoredSearchState = (): StoredSearchState | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const Index = () => {
  const storedSearchStateRef = useRef<StoredSearchState | null>(getStoredSearchState());
  const [cars, setCars] = useState<Car[]>(() => storedSearchStateRef.current?.cars ?? []);
  const [carReasons, setCarReasons] = useState<CarReason[]>(() => storedSearchStateRef.current?.carReasons ?? []);
  const [savedCars, setSavedCars] = useState<Car[]>(() => storedSearchStateRef.current?.savedCars ?? []);
  const [resultMessage, setResultMessage] = useState(() => storedSearchStateRef.current?.resultMessage ?? '');
  const [showResults, setShowResults] = useState(() => storedSearchStateRef.current?.showResults ?? false);
  const [language, setLanguage] = useState('sv');
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Persist search state to sessionStorage
  useEffect(() => {
    if (showResults) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cars, carReasons, savedCars, resultMessage, showResults }),
      );
    }
  }, [cars, carReasons, savedCars, resultMessage, showResults]);


  const [relaxations, setRelaxations] = useState<string[]>([]);

  const handleResults = (
    newCars: Car[],
    message: string,
    reasons: CarReason[],
    append?: boolean,
    newRelaxations?: string[],
  ) => {
    if (append) {
      setCars((prev) => [...prev, ...newCars]);
      setCarReasons((prev) => [...prev, ...reasons]);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('findcar-results-revealed');
      setCars(newCars);
      setCarReasons(reasons);
      setRelaxations(newRelaxations ?? []);
    }
    setResultMessage(message);
    setShowResults(true);
  };


  const toggleSave = (car: Car) => {
    setSavedCars((prev) =>
      prev.find((c) => c.id === car.id) ? prev.filter((c) => c.id !== car.id) : [...prev, car],
    );
  };

  const getReasonForCar = (carId: number) => carReasons.find((r) => r.carId === carId)?.reason;

  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const handleLoadMore = useCallback(async () => {
    try {
      const stored = sessionStorage.getItem('findcar-last-filters');
      let filters: Record<string, unknown> = {};
      let customerProfile = '';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          filters = parsed?.filters ?? {};
          customerProfile = parsed?.customerProfile ?? '';
        } catch {}
      }
      // Fallback: derive a budget window from the cars already shown so the
      // button still works in older sessions without stored filters.
      if (!filters || Object.keys(filters).length === 0) {
        const prices = cars.map((c) => c.price).filter((p): p is number => typeof p === 'number' && p > 0);
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices) * 0.85);
          const max = Math.ceil(Math.max(...prices) * 1.15);
          filters = { budget: `${min}-${max}` };
        }
      }
      setLoadingMore(true);
      const excludeIds = cars.map((c) => c.id);
      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: { action: 'load_more', filters, excludeIds, customerProfile, language },
      });
      if (error) throw error;
      if (data?.cars?.length > 0) {
        setCars((prev) => [...prev, ...data.cars]);
        setCarReasons((prev) => [...prev, ...(data.carReasons || [])]);
      } else {
        setAllLoaded(true);
        toast.info('Inga fler bilar hittades med dina filter.');
      }
    } catch (err) {
      console.error('Load more error:', err);
      toast.error('Kunde inte hämta fler bilar – försök igen.');
    } finally {
      setLoadingMore(false);
    }
  }, [cars, language]);

  

  return (
    <div className="min-h-screen overflow-x-hidden premium-page-bg">
      <SEO
        title="Vi säljer inte bilar. Vi hittar din. | FindCar"
        description="FindCar ger dig objektiv bilrådgivning med hjälp av AI. Jämför tusentals begagnade bilar utifrån dina villkor. Helt gratis."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'FindCar',
          url: 'https://findcar.se',
          email: 'kontakt@findcar.se',
          description:
            'Sveriges objektiva bilrådgivare — AI-driven matchning av begagnade bilar, helt utan provision.',
        }}
      />

      <Header />

      {/* Advisor first — Anyfin / Wise style split layout, no hero image */}
      <section
        data-search-section
        className="relative pt-24 md:pt-28 pb-14 md:pb-20 px-5 md:px-8"
      >
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: pitch */}
          <ScrollReveal className="lg:col-span-5 lg:pt-6">
            <h1 className="font-serif text-[2.5rem] sm:text-5xl lg:text-[3.75rem] leading-[1.05] tracking-tight text-foreground">
              Hitta rätt bil <em className="italic font-normal">för dig</em>.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-md text-base md:text-[17px] leading-relaxed">
              Sveriges objektiva bilrådgivare — vi säljer inte bilar, vi hittar din.
            </p>
          </ScrollReveal>

          {/* Right: advisor module */}
          <ScrollReveal delay={120} className="lg:col-span-7 w-full">
            <GuidedSearch
              onResults={handleResults}
              onScrollToResults={() =>
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              onLanguageChange={setLanguage}
            />
          </ScrollReveal>
        </div>
      </section>

      <ListingAnalyzer />

      {/* Results */}
      {showResults && cars.length > 0 && (() => {
        const topCars = cars.slice(0, 3);
        const similarCars = cars.slice(3);
        return (
          <Suspense fallback={null}>
            <div ref={(el) => { resultsRef.current = el; }}>
              <ResultsReveal
                cars={topCars}
                similarCars={similarCars}
                totalMatches={cars.length}
                savedCars={savedCars}
                carReasons={carReasons}
                resultMessage={resultMessage}
                language={language}
                onToggleSave={toggleSave}
                onCompare={() => navigate('/compare', { state: { cars: savedCars } })}
                onShowMore={handleLoadMore}
                loadingMore={loadingMore}
                allLoaded={allLoaded}
                getReasonForCar={getReasonForCar}
              />
            </div>
          </Suspense>
        );
      })()}

      <Suspense fallback={null}>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <WhyFindCar />
        <section id="faq">
          <FAQ />
        </section>
      </Suspense>
      <Footer />

      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </div>
  );
};

export default Index;
