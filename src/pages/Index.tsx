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
import { ArrowRight } from 'lucide-react';
import findcarLogoHero from '@/assets/findcar-logo-hero.png';
import heroBridgeReal from '@/assets/hero-bridge-real.mp4.asset.json';
import findcarLogoFull from '@/assets/findcar-logo-full.png';
const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const p = Math.min(scrollY / (vh * 0.8), 1);
      setProgress(p);
      // Parallax: image moves slower than scroll (0.35 factor)
      setParallaxY(scrollY * 0.35);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return { progress, parallaxY };
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
  const resultsRef = useRef<HTMLDivElement | null>(null);
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
  const { progress: scrollProgress, parallaxY } = useScrollProgress();
  // Hero loop: real AI-generated bridge video (~10.04s) plays on loop.
  // Car drives across frame ~0–6s and exits left. We sync a React overlay
  // (FindCar logo + tagline) to fade in once the car is gone, hold, then
  // fade out well before the loop restarts so there is no flicker on the
  // seam.
  //
  // Verified video metadata: duration = 10.041s, 24fps. Fade transition is
  // 220ms, so we stop fading out at t = 9.6s -> fully invisible by t = 9.82s,
  // giving ~220ms of safety margin before the loop wraps to t = 0.
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [showLogo, setShowLogo] = useState(false);
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const FADE_IN_AT = 6.4;   // wait until the car has fully exited the frame
    const FADE_OUT_AT = 9.6;  // 220ms transition + ~220ms safety < 10.04s loop
    // Poll at ~10fps instead of 60fps — fade timing only needs ~100ms accuracy,
    // and this frees the main thread during chat typing/scrolling.
    const interval = window.setInterval(() => {
      const dur = video.duration || 10.04;
      const t = video.currentTime % dur;
      const visible = t >= FADE_IN_AT && t < FADE_OUT_AT;
      setShowLogo((prev) => (prev !== visible ? visible : prev));
    }, 100);
    return () => window.clearInterval(interval);
  }, []);
  return <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero with canvas-animated night-highway background */}
      <section
      className="relative min-h-[100svh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Cinematic night-highway video — real cars driving in the dark */}
        <video
          ref={heroVideoRef}
          src={heroBridgeReal.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
          style={{ transform: `translateY(${parallaxY * 0.4}px) scale(1.06)` }}
        />
        {/* Cinematic overlays for readability + depth */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,15,25,0.55) 0%, rgba(10,15,25,0.35) 35%, rgba(10,15,25,0.55) 75%, rgba(10,15,25,0.85) 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        {/* FindCar logo + tagline overlay — fades in when the car has exited.
            Spotlight cone from above lights the bridge where the logo sits,
            making it feel like a stage light. Uses the full brand logo image
            (which already contains the wordmark) plus a shimmer on entry. */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none flex flex-col items-center justify-center px-6"
          style={{
            opacity: showLogo ? 1 : 0,
            transition: 'opacity 700ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Spotlight cone from above — wider at the bottom, soft warm-white */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-full"
            style={{
              background:
                'radial-gradient(ellipse 38% 70% at 50% 0%, rgba(220,235,255,0.22) 0%, rgba(180,210,240,0.12) 25%, rgba(120,160,210,0.06) 45%, rgba(0,0,0,0) 70%)',
              mixBlendMode: 'screen',
              opacity: showLogo ? 1 : 0,
              transition: 'opacity 1100ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
          {/* Ground pool — soft glow on the "bridge floor" beneath the logo */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{
              top: '50%',
              height: '40%',
              background:
                'radial-gradient(ellipse 32% 55% at 50% 25%, rgba(5,10,20,0.55) 0%, rgba(5,10,20,0.25) 50%, rgba(5,10,20,0) 80%)',
              opacity: showLogo ? 1 : 0,
              transition: 'opacity 900ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />

          {/* Logo + tagline stack */}
          <div
            className="relative flex flex-col items-center"
            style={{
              transform: showLogo
                ? 'translateY(0) scale(1)'
                : 'translateY(10px) scale(0.97)',
              transition: 'transform 900ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Logo with shimmer sweep masked to the image silhouette */}
            <div className="relative">
              <img
                src={findcarLogoFull}
                alt="FindCar"
                draggable={false}
                className="w-[240px] md:w-[400px] lg:w-[480px] h-auto select-none"
                style={{
                  filter:
                    'drop-shadow(0 6px 28px rgba(34,211,238,0.35)) drop-shadow(0 3px 12px rgba(0,0,0,0.65))',
                }}
              />
              {/* Shimmer light sweep — only plays on the entry */}
              {showLogo && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    WebkitMaskImage: `url(${findcarLogoFull})`,
                    maskImage: `url(${findcarLogoFull})`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                  }}
                >
                  <div className="findcar-shimmer-sweep" />
                </div>
              )}
            </div>

            {/* Italic serif tagline — small, tight to the logo */}
            <div
              className="-mt-3 md:-mt-4 text-white/85 italic text-xs md:text-base lg:text-lg text-center"
              style={{
                fontFamily: 'Lora, Georgia, "Times New Roman", serif',
                letterSpacing: '0.02em',
                textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              }}
            >
              Din objektiva bilrådgivare
            </div>
          </div>
        </div>

        {/* Hero content — unified for mobile & desktop */}
        {/* Mobile hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 w-full min-h-[100svh] md:hidden pt-[14svh]">
          <h1 className="sr-only">FindCar — Din objektiva bilrecensent i Sverige</h1>

          {/* Spacer between headline and CTA */}
          <div className="flex-1 min-h-[20svh]" />

          {/* Bottom CTA — sits low, glass + subtle gradient so it blends with the bridge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 w-full"
            style={{ marginBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
          >
            <Button
              onClick={scrollToSearch}
              className="findcar-cta-hero group w-full h-14 rounded-full text-base font-medium tracking-wide text-white border-0 inline-flex items-center justify-center gap-2"
            >
              <span>Hitta din bil</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        {/* Desktop hero content — spread vertically */}
        <div className="relative z-10 hidden md:flex flex-col items-center justify-between text-center px-6 w-full min-h-screen pt-20 pb-10">
          <h1 className="sr-only">FindCar — Din objektiva bilrecensent i Sverige</h1>
          {/* Spacer to push CTA to the bottom */}
          <div />

          {/* Bottom CTA — sits low, glass + subtle gradient so it blends with the bridge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 mb-2"
          >
            <Button
              onClick={scrollToSearch}
              className="findcar-cta-hero group h-13 rounded-full text-base font-medium tracking-wide px-12 py-3 text-white border-0 inline-flex items-center justify-center gap-2"
            >
              <span>Hitta din bil</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        {/* (Bounce arrow removed — CTA is the primary action) */}

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

      {/* Search — pulled up to overlap hero fade and eliminate any seam */}
      <section ref={searchRef} data-search-section className="relative z-10 bg-background pt-6 pb-8 md:py-16 px-3 md:px-4 overflow-hidden -mt-1">

        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-secondary/[0.06] blur-[80px]" />
          <div className="absolute bottom-0 -left-20 w-[250px] h-[250px] rounded-full bg-primary/[0.05] blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                AI-driven sökning
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
                Hitta bilen som passar <span className="text-gradient">just dig</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-[15px] md:text-base leading-relaxed">
                Berätta om dina behov — Clutch matchar dig med rätt bil bland tusentals annonser. Helt gratis.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <GuidedSearch
              onResults={handleResults}
              onScrollToResults={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              onLanguageChange={setLanguage}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Results — premium reveal */}
      {showResults && cars.length > 0 && (() => {
      const topCars = cars.slice(0, 3);
      const similarCars = cars.slice(3);
      return (
         <Suspense fallback={null}>
           <div ref={(el) => { resultsRef.current = el; }}>
             <ResultsReveal cars={topCars} similarCars={similarCars} totalMatches={cars.length} savedCars={savedCars} carReasons={carReasons} resultMessage={resultMessage} language={language} onToggleSave={toggleSave} onCompare={() => navigate('/compare', {
              state: {
                cars: savedCars
              }
            })} onShowMore={handleLoadMore} loadingMore={loadingMore} getReasonForCar={getReasonForCar} />
           </div>
         </Suspense>);

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