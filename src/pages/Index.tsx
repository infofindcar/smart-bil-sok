import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';
import { AuroraBackground } from '@/components/AuroraBackground';
import { SEO } from '@/components/SEO';

// Lazy-load below-fold sections
const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
const HowItWorks = lazy(() => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const WhyFindCar = lazy(() => import('@/components/WhyFindCar').then((m) => ({ default: m.WhyFindCar })));
const Testimonials = lazy(() => import('@/components/Testimonials').then((m) => ({ default: m.Testimonials })));
const FAQ = lazy(() => import('@/components/FAQ').then((m) => ({ default: m.FAQ })));
const CtaBanner = lazy(() => import('@/components/CtaBanner').then((m) => ({ default: m.CtaBanner })));
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

      {/* Landing — search-first with aurora background */}
      <AuroraBackground>
        <section
          data-search-section
          className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 pt-20 md:pt-24 pb-10 md:pb-12"
        >
          <div className="relative z-10 max-w-3xl mx-auto w-full">
            <ScrollReveal>
              <div className="text-center mb-8 md:mb-10">
                <span className="hidden md:inline-flex eyebrow mb-5 md:mb-6 mx-auto justify-center">
                  Driven av Clutch AI
                </span>
                <h1 className="display-headline text-[2rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl md:mt-4">
                  Hitta din
                  <br className="md:hidden" />
                  <span className="text-gradient"> rätta bil.</span>
                  <span className="hidden md:inline"><br />just för dig.</span>
                </h1>
                <p className="text-muted-foreground mt-3 md:mt-6 max-w-md md:max-w-xl mx-auto text-[14px] md:text-lg leading-relaxed font-light">
                  <span className="md:hidden">Berätta om din vardag — vi gör jobbet.</span>
                  <span className="hidden md:inline">Berätta om din vardag — vi hittar rätt bil bland tusentals annonser. Helt gratis, utan provision.</span>
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative">
                <div className="search-glow" aria-hidden="true" />
                <GuidedSearch
                  onResults={handleResults}
                  onScrollToResults={() =>
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  onLanguageChange={setLanguage}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-8 text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                <span className="flex items-center gap-1.5">
                  {carCount !== null ? (
                    <><span className="text-foreground/90 tabular-nums font-semibold normal-case tracking-normal">{formatCount(displayCount)}</span>&nbsp;bilar</>
                  ) : (
                    <>tusentals bilar</>
                  )}
                </span>
                <span className="opacity-30">·</span>
                <span>Gratis</span>
                <span className="opacity-30">·</span>
                <span>0 % provision</span>
              </div>
            </ScrollReveal>
          </div>

          {/* Scroll hint — minimal vertical line */}
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 hover:text-foreground transition-colors flex-col items-center gap-3"
            aria-label="Skrolla för mer"
          >
            <span>Skrolla</span>
            <span className="block w-px h-10 bg-gradient-to-b from-muted-foreground/40 to-transparent" />
          </a>
        </section>
      </AuroraBackground>

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
        <Testimonials />
        <section id="faq">
          <FAQ />
        </section>
        <CtaBanner />
      </Suspense>
      <Footer />

      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </div>
  );
};

export default Index;
