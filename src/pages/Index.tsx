import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SEO } from '@/components/SEO';
import heroImage from '@/assets/hero-squarespace.jpg';

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

  const scrollToSearch = () => {
    document
      .querySelector('[data-search-section]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden premium-page-bg">
      <SEO
        title="Vi säljer inte bilar. Vi hittar din. | FindCar"
        description="FindCar ger dig objektiv bilrådgivning med hjälp av AI. Jämför tusentals begagnade bilar utifrån dina villkor. Helt gratis."
        path="/"
      />
      <Header />

      {/* Cinematic Squarespace-style hero — full-bleed image, centered headline */}
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/50" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <h1 className="font-serif text-[2.75rem] sm:text-6xl lg:text-[5.25rem] leading-[1.03] tracking-tight max-w-5xl">
            Hitta rätt bil <em className="italic font-normal">för dig</em>.
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg text-white/85 leading-relaxed">
            Oberoende bilrådgivning. Vi jämför tusentals annonser utifrån din vardag — utan provision, helt gratis.
          </p>
          <button
            onClick={scrollToSearch}
            className="mt-10 inline-flex items-center justify-center bg-white text-foreground hover:bg-white/90 transition-colors px-8 py-3.5 text-sm font-medium tracking-wide"
          >
            Kom igång
          </button>
          <p className="mt-5 text-xs text-white/75">
            {carCount !== null ? (
              <><span className="tabular-nums">{formatCount(displayCount)}</span> bilar, uppdaterade dagligen</>
            ) : (
              <>Tusentals bilar uppdaterade dagligen</>
            )}
          </p>
        </div>
      </section>

      {/* Search module — calm section below hero */}
      <section
        data-search-section
        className="relative px-5 md:px-8 py-20 md:py-28 bg-background"
      >
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Berätta vad du letar efter
            </p>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight text-foreground">
              Beskriv din drömbil <em className="italic font-normal">med egna ord</em>.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120}>
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
