import { useState, useRef, useEffect, lazy, Suspense, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { ScrollReveal } from '@/components/ScrollReveal';

import { motion } from 'framer-motion';

// Lazy-load below-fold sections
const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
const HowItWorks = lazy(() => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const WhyFindCar = lazy(() => import('@/components/WhyFindCar').then((m) => ({ default: m.WhyFindCar })));
const Testimonials = lazy(() => import('@/components/Testimonials').then((m) => ({ default: m.Testimonials })));
const FAQ = lazy(() => import('@/components/FAQ').then((m) => ({ default: m.FAQ })));
const CtaBanner = lazy(() => import('@/components/CtaBanner').then((m) => ({ default: m.CtaBanner })));
const CookieBanner = lazy(() => import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })));
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import findcarLogoHero from '@/assets/findcar-logo-hero.png';

const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const p = Math.min(scrollY / (vh * 0.8), 1);
      setProgress(p);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return progress;
};
const SectionDivider = ({
  variant


}: {variant: 'bg-to-alt' | 'alt-to-bg';}) => <div className={`section-divider section-divider-${variant}`} aria-hidden="true" />;
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
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Persist search state to sessionStorage
  useEffect(() => {
    if (showResults) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        cars,
        carReasons,
        savedCars,
        resultMessage,
        showResults
      }));
    }
  }, [cars, carReasons, savedCars, resultMessage, showResults]);
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
    setSavedCars((prev) => prev.find((c) => c.id === car.id) ? prev.filter((c) => c.id !== car.id) : [...prev, car]);
  };
  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const getReasonForCar = (carId: number) => {
    return carReasons.find((r) => r.carId === carId)?.reason;
  };
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
  const scrollProgress = useScrollProgress();
  return <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero with video background */}
      <section
      className="relative min-h-[100svh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1a2332]"
      style={{
        backgroundImage: 'url(/images/hero_findcar.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/50 md:bg-black/30 z-[1]" />

        {/* MOBILE hero content — centered in viewport */}
        <div className="md:hidden relative z-10 flex flex-col items-center justify-center text-center px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-5 w-full max-w-sm"
          >
            <h1 className="text-3xl font-bold text-white leading-tight">
              Hitta rätt bil<br />– utan stress
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              Vi matchar dig med bilar baserat på din livsstil, budget och behov
            </p>
            <Button
              onClick={scrollToSearch}
              variant="gradient"
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg active:scale-95 transition-transform"
            >
              Hitta din bil
            </Button>
            <p className="text-white/50 text-xs">
              ✔ Tar 30 sek · Gratis · Objektiv rådgivning
            </p>
          </motion.div>
        </div>

        {/* DESKTOP hero content — original layout */}
        <div className="hidden md:block absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <div className="relative">
              <h1 className="sr-only">FindCar — Hitta din perfekta bil med AI i Sverige</h1>
              <img src={findcarLogoHero} alt="FindCar — AI-driven bilrådgivare" className="h-64 lg:h-80 w-auto" style={{ filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.3)) drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }} />
            </div>
          </motion.div>
        </div>

        {/* DESKTOP CTA Button */}
        <motion.div
          className="hidden md:flex absolute bottom-20 z-10 flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        >
          <Button onClick={scrollToSearch} size="default" variant="gradient" className="text-sm px-8 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform touch-target h-10">
            Hitta din bil
          </Button>
        </motion.div>

        {/* Bounce arrow — desktop only */}
        <button onClick={scrollToSearch} className="hidden md:block absolute bottom-8 z-10 animate-bounce text-secondary hover:text-secondary/80 transition-colors" style={{
        opacity: 1 - scrollProgress * 3
      }} aria-label="Scrolla ner">
          <ChevronDown className="h-8 w-8" />
        </button>

        {/* Bottom fade — inside hero, no seam possible */}
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 z-[2] pointer-events-none" style={{
          background: `linear-gradient(to bottom,
            transparent 0%,
            hsl(var(--background) / 0.08) 15%,
            hsl(var(--background) / 0.22) 30%,
            hsl(var(--background) / 0.42) 45%,
            hsl(var(--background) / 0.62) 58%,
            hsl(var(--background) / 0.80) 70%,
            hsl(var(--background) / 0.93) 85%,
            hsl(var(--background)) 100%)`
        }} />
      </section>

      {/* Search */}
      <section ref={searchRef} data-search-section className="relative z-10 bg-background pt-6 pb-8 md:py-24 px-3 md:px-4 overflow-hidden">

        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-secondary/[0.06] blur-[80px]" />
          <div className="absolute bottom-0 -left-20 w-[250px] h-[250px] rounded-full bg-primary/[0.05] blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/[0.08] border border-secondary/[0.12] mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <p className="text-xs font-medium uppercase tracking-widest text-secondary/80">Personlig bilrådgivning</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Hitta bilen som passar <span className="text-gradient">just dig</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
                Clutch lär känna dina behov och hittar de bästa matchningarna — helt gratis.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <GuidedSearch
            onResults={handleResults}
            onScrollToResults={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            onLanguageChange={setLanguage} />

          </ScrollReveal>
        </div>
      </section>

      {/* Results — premium reveal */}
      {showResults && cars.length > 0 && (() => {
      const topCars = cars.slice(0, 3);
      const similarCars = cars.slice(3);
      return (
         <ResultsReveal ref={resultsRef} cars={topCars} similarCars={similarCars} totalMatches={cars.length} savedCars={savedCars} carReasons={carReasons} resultMessage={resultMessage} language={language} onToggleSave={toggleSave} onCompare={() => navigate('/compare', {
          state: {
            cars: savedCars
          }
        })} onShowMore={handleLoadMore} loadingMore={loadingMore} getReasonForCar={getReasonForCar} />);

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
    </div>;
};
export default Index;