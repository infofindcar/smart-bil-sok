import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SEO } from '@/components/SEO';

// Lazy-load below-fold sections
const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
const HowItWorks = lazy(() => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const WhyFindCar = lazy(() => import('@/components/WhyFindCar').then((m) => ({ default: m.WhyFindCar })));
const FAQ = lazy(() => import('@/components/FAQ').then((m) => ({ default: m.FAQ })));
const CookieBanner = lazy(() => import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })));

const STORAGE_KEY = 'findcar-search-state';
const loadSearchState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const Index = () => {
  const saved = loadSearchState();
  const [cars, setCars] = useState<Car[]>(saved?.cars || []);
  const [carReasons, setCarReasons] = useState<CarReason[]>(saved?.carReasons || []);
  const [savedCars, setSavedCars] = useState<Car[]>(saved?.savedCars || []);
  const [resultMessage, setResultMessage] = useState(saved?.resultMessage || '');
  const [showResults, setShowResults] = useState(saved?.showResults || false);
  const [language, setLanguage] = useState('sv');
  const [carCount, setCarCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
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

  // Live car count for the trust line under the chat
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('Lovable')
        .select('id', { count: 'exact', head: true })
        .not('image_thumb_url', 'is', null);
      if (!cancelled && typeof count === 'number') setCarCount(count);
    })();
    return () => { cancelled = true; };
  }, []);

  // Animate displayCount from 0 → carCount once we have it
  useEffect(() => {
    if (carCount === null) return;
    const target = carCount;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayCount(Math.floor(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [carCount]);

  const handleResults = (newCars: Car[], message: string, reasons: CarReason[], append?: boolean) => {
    if (append) {
      setCars((prev) => [...prev, ...newCars]);
      setCarReasons((prev) => [...prev, ...reasons]);
    } else {
      setCars(newCars);
      setCarReasons(reasons);
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
  const handleLoadMore = useCallback(async () => {
    try {
      const stored = sessionStorage.getItem('findcar-last-filters');
      if (!stored) return;
      const { filters, customerProfile } = JSON.parse(stored);
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
        toast.info('Inga fler bilar hittades med dina filter. Prova att justera din sökning.');
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [cars, language]);

  const formatCount = (n: number) => new Intl.NumberFormat('sv-SE').format(n);

  return (
    <div className="min-h-screen overflow-x-hidden premium-page-bg">
      <SEO
        title="Vi säljer inte bilar. Vi hittar din. | FindCar"
        description="FindCar ger dig objektiv bilrådgivning med hjälp av AI. Jämför tusentals begagnade bilar utifrån dina villkor. Helt gratis."
        path="/"
      />
      <Header />

      {/* Advisor first — Anyfin / Wise style split layout, no hero image */}
      <section
        data-search-section
        className="relative pt-24 md:pt-28 pb-14 md:pb-20 px-5 md:px-8"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: pitch */}
          <ScrollReveal className="lg:col-span-5 lg:pt-6">
            <span className="eyebrow mb-5 text-[11px]">Bilrådgivning · gratis</span>
            <h1 className="display-headline text-[2.5rem] sm:text-5xl lg:text-[3.75rem] mt-3">
              Hitta rätt bil <span className="text-gradient">för dig</span>.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-md text-base md:text-lg leading-relaxed">
              Jämför bilar utifrån budget, behov, ägandekostnad och risk. Oberoende, datadrivet — helt utan provision.
            </p>
            <ul className="mt-7 space-y-3 text-[15px] text-foreground/80">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {carCount !== null ? (
                  <><span className="tabular-nums font-semibold text-foreground">{formatCount(displayCount)}</span>&nbsp;bilar uppdaterade dagligen</>
                ) : (
                  <>Tusentals bilar uppdaterade dagligen</>
                )}
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Oberoende — vi tjänar inget på ditt val
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                0 % provision, alltid gratis
              </li>
            </ul>
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
