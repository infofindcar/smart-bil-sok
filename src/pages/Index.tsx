import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { VideoLoop } from '@/components/VideoLoop';
import { ResultsReveal } from '@/components/ResultsReveal';
import { HowItWorks } from '@/components/HowItWorks';
import { WhyFindCar } from '@/components/WhyFindCar';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { CtaBanner } from '@/components/CtaBanner';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import logo from '@/assets/findcar-logo.png';
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
}: {
  variant: 'bg-to-alt' | 'alt-to-bg';
}) => <div className={`section-divider section-divider-${variant}`} aria-hidden="true" />;
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
      setCars(prev => [...prev, ...newCars]);
      setCarReasons(prev => [...prev, ...reasons]);
    } else {
      setCars(newCars);
      setCarReasons(reasons);
    }
    setResultMessage(message);
    setShowResults(true);
  };
  const toggleSave = (car: Car) => {
    setSavedCars(prev => prev.find(c => c.id === car.id) ? prev.filter(c => c.id !== car.id) : [...prev, car]);
  };
  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const getReasonForCar = (carId: number) => {
    return carReasons.find(r => r.carId === carId)?.reason;
  };
  const scrollProgress = useScrollProgress();
  return <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero with video background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <VideoLoop scrollProgress={scrollProgress} />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center px-4 space-y-6" style={{
        opacity: 1 - scrollProgress * 1.5,
        transform: `translateY(${scrollProgress * -60}px)`,
        transition: 'transform 0.1s linear'
      }}>
          <div className="relative">
            <div className="absolute inset-0 bg-black/50 blur-[100px] rounded-full scale-125" />
            <img src={logo} alt="FindCar" className="relative h-56 md:h-80 mx-auto brightness-[1.6] contrast-125 drop-shadow-[0_0_100px_rgba(255,255,255,0.7)] animate-float-subtle" />
          </div>
          
        </div>

        <div className="absolute bottom-24 z-10 animate-[fade-in_1s_ease-out_0.5s_both]" style={{
        opacity: 1 - scrollProgress * 3
      }}>
          <Button variant="gradient" size="default" onClick={scrollToSearch} className="rounded-xl">
            Hitta din bil
          </Button>
        </div>

        <button onClick={scrollToSearch} className="absolute bottom-10 z-10 animate-bounce text-white/50 hover:text-white/80 transition-colors" style={{
        opacity: 1 - scrollProgress * 3
      }} aria-label="Scrolla ner">
          <ChevronDown className="h-8 w-8" />
        </button>

        {/* Extended bottom fade for smoother hero-to-content transition */}
        <div className="absolute bottom-0 left-0 right-0 h-64 z-10 pointer-events-none" style={{
        background: `linear-gradient(to bottom, transparent, hsl(var(--background)))`,
        opacity: Math.min(scrollProgress * 2, 1)
      }} />
      </section>

      {/* Bridge transition zone between hero and search */}
      <div className="relative -mt-8 py-8 pointer-events-none" style={{
      background: 'linear-gradient(to bottom, hsl(var(--background)), hsl(var(--primary) / 0.04), hsl(var(--background)))'
    }} aria-hidden="true" />

      {/* Search */}
      <section ref={searchRef} data-search-section className="relative py-16 md:py-24 px-4 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-secondary/[0.06] blur-[80px]" />
          <div className="absolute bottom-0 -left-20 w-[250px] h-[250px] rounded-full bg-primary/[0.05] blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
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
            <GuidedSearch onResults={handleResults} />
          </ScrollReveal>
        </div>
      </section>

      {/* Results — premium reveal */}
      {showResults && cars.length > 0 && <ResultsReveal ref={resultsRef} cars={cars} savedCars={savedCars} carReasons={carReasons} resultMessage={resultMessage} onToggleSave={toggleSave} onCompare={() => navigate('/compare', {
      state: {
        cars: savedCars
      }
    })} onShowMore={() => searchRef.current?.scrollIntoView({
      behavior: 'smooth'
    })} getReasonForCar={getReasonForCar} />}

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
      <SectionDivider variant="alt-to-bg" />
      <CtaBanner />
      <Footer />
      <CookieBanner />
    </div>;
};
export default Index;