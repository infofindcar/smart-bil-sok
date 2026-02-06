import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car } from '@/components/GuidedSearch';
import { VideoLoop } from '@/components/VideoLoop';
import { CarCard } from '@/components/CarCard';
import { HowItWorks } from '@/components/HowItWorks';
import { WhyFindCar } from '@/components/WhyFindCar';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { ChevronDown, Scale } from 'lucide-react';

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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

const SectionDivider = ({ variant }: { variant: 'bg-to-alt' | 'alt-to-bg' }) => (
  <div className={`section-divider section-divider-${variant}`} aria-hidden="true" />
);

const Index = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [savedCars, setSavedCars] = useState<Car[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleResults = (newCars: Car[], message: string) => {
    setCars(newCars);
    setResultMessage(message);
    setShowResults(true);
  };

  const toggleSave = (car: Car) => {
    setSavedCars((prev) =>
      prev.find((c) => c.id === car.id) ? prev.filter((c) => c.id !== car.id) : [...prev, car]
    );
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollProgress = useScrollProgress();

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero with video background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <VideoLoop scrollProgress={scrollProgress} />
        <div className="absolute inset-0 bg-black/40" />
        
        <div
          className="relative z-10 text-center px-4 space-y-6"
          style={{
            opacity: 1 - scrollProgress * 1.5,
            transform: `translateY(${scrollProgress * -60}px)`,
            transition: 'transform 0.1s linear',
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-black/40 blur-3xl rounded-full scale-110" />
            <img src={logo} alt="FindCar" className="relative h-48 md:h-72 mx-auto brightness-150 contrast-125 drop-shadow-[0_0_80px_rgba(255,255,255,0.6)] animate-float-subtle" />
          </div>
        </div>

        <div
          className="absolute bottom-24 z-10 animate-[fade-in_1s_ease-out_0.5s_both]"
          style={{ opacity: 1 - scrollProgress * 3 }}
        >
          <Button variant="gradient" size="default" onClick={scrollToSearch} className="rounded-xl">
            Hitta din bil
          </Button>
        </div>

        <button
          onClick={scrollToSearch}
          className="absolute bottom-10 z-10 animate-bounce text-white/50 hover:text-white/80 transition-colors"
          style={{ opacity: 1 - scrollProgress * 3 }}
          aria-label="Scrolla ner"
        >
          <ChevronDown className="h-8 w-8" />
        </button>

        {/* Extended bottom fade for smoother hero-to-content transition */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, hsl(var(--background)))`,
            opacity: Math.min(scrollProgress * 2, 1),
          }}
        />
      </section>

      {/* Bridge transition zone between hero and search */}
      <div
        className="relative -mt-8 py-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--background)), hsl(var(--primary) / 0.04), hsl(var(--background)))',
        }}
        aria-hidden="true"
      />

      {/* Search */}
      <section
        ref={searchRef}
        className="relative py-16 md:py-24 px-4 overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--accent) / 0.25), hsl(var(--background)))',
        }}
      >
        {/* Decorative glow behind heading */}
        <div
          className="bg-glow absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px]"
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold">
                Hitta din <span className="text-gradient">drömbil</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Berätta vad du söker så hittar vår AI de bästa bilarna åt dig.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <GuidedSearch onResults={handleResults} />
          </ScrollReveal>
        </div>
      </section>

      {/* Results */}
      {showResults && cars.length > 0 && (
        <>
          <SectionDivider variant="bg-to-alt" />
          <section ref={resultsRef} className="py-16 px-4 bg-section-alt">
            <div className="max-w-6xl mx-auto">

              {savedCars.length >= 2 && (
                <div className="flex justify-center mb-6">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/compare', { state: { cars: savedCars } })}
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    Jämför {savedCars.length} bilar
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isSaved={savedCars.some((c) => c.id === car.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </section>
          <SectionDivider variant="alt-to-bg" />
        </>
      )}

      <HowItWorks />
      <SectionDivider variant="bg-to-alt" />
      <WhyFindCar />
      <SectionDivider variant="alt-to-bg" />
      <Testimonials />
      <SectionDivider variant="bg-to-alt" />
      <FAQ />
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Index;
