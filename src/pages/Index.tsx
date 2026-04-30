import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';
import { AuroraBackground } from '@/components/AuroraBackground';

// Lazy-load below-fold sections
const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
const HowItWorks = lazy(() => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const WhyFindCar = lazy(() => import('@/components/WhyFindCar').then((m) => ({ default: m.WhyFindCar })));
const Testimonials = lazy(() => import('@/components/Testimonials').then((m) => ({ default: m.Testimonials })));
const FAQ = lazy(() => import('@/components/FAQ').then((m) => ({ default: m.FAQ })));
const CtaBanner = lazy(() => import('@/components/CtaBanner').then((m) => ({ default: m.CtaBanner })));
const CookieBanner = lazy(() => import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })));

const SectionDivider = ({ variant }: { variant: 'bg-to-alt' | 'alt-to-bg' }) => (
  <div className={`section-divider section-divider-${variant}`} aria-hidden="true" />
);

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
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Landing — search-first with aurora background */}
      <AuroraBackground>
        <section
          data-search-section
          className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 pt-24 pb-12"
        >
          <div className="relative z-10 max-w-3xl mx-auto w-full">
            <ScrollReveal>
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                  Hitta bilen som passar <span className="text-gradient">just dig</span>
                </h1>
                <p className="text-muted-foreground mt-3 md:mt-4 max-w-xl mx-auto text-sm md:text-lg leading-relaxed">
                  Berätta om dina behov — Clutch matchar dig med rätt bil bland tusentals annonser.
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
              <p className="text-center text-[11px] md:text-sm text-muted-foreground/80 mt-5 md:mt-6 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                {carCount !== null ? (
                  <>Söker bland <strong className="text-foreground tabular-nums">{formatCount(displayCount)}</strong> bilar</>
                ) : (
                  <>Söker bland tusentals bilar</>
                )}
                <span className="mx-1.5 md:mx-2 opacity-40">•</span>
                Helt gratis
                <span className="mx-1.5 md:mx-2 opacity-40">•</span>
                Inga provisioner
              </p>
            </ScrollReveal>
          </div>

          {/* Scroll hint — desktop only, mobile users scroll naturally */}
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 hover:text-foreground transition-colors flex-col items-center gap-1"
            aria-label="Mer information"
          >
            <span>Mer info</span>
            <span className="animate-bounce">↓</span>
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
        <SectionDivider variant="bg-to-alt" />
        <WhyFindCar />
        <SectionDivider variant="alt-to-bg" />
        <Testimonials />
        <SectionDivider variant="bg-to-alt" />
        <section id="faq">
          <FAQ />
        </section>
        <div className="hidden md:block">
          <SectionDivider variant="alt-to-bg" />
        </div>
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
