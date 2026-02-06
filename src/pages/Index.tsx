import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car } from '@/components/GuidedSearch';
import { CarCard } from '@/components/CarCard';
import { HowItWorks } from '@/components/HowItWorks';
import { WhyFindCar } from '@/components/WhyFindCar';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { ChevronDown, Scale } from 'lucide-react';
import heroVideo from '@/assets/hero-video.mp4';
import logo from '@/assets/findcar-logo.png';

const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      // Fade transition over the full hero height
      const p = Math.min(scrollY / (vh * 0.8), 1);
      setProgress(p);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

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
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
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
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 - scrollProgress * 0.3 }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
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

        {/* CTA button above scroll indicator */}
        <div
          className="absolute bottom-24 z-10 animate-[fade-in_1s_ease-out_0.5s_both]"
          style={{ opacity: 1 - scrollProgress * 3 }}
        >
          <Button variant="gradient" size="xl" onClick={scrollToSearch} className="text-lg px-12 h-16 rounded-xl animate-[pulse_3s_ease-in-out_infinite] hover:animate-none">
            Hitta din bil
          </Button>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToSearch}
          className="absolute bottom-10 z-10 animate-bounce text-white/50 hover:text-white/80 transition-colors"
          style={{ opacity: 1 - scrollProgress * 3 }}
          aria-label="Scrolla ner"
        >
          <ChevronDown className="h-8 w-8" />
        </button>

        {/* Bottom fade transition into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, hsl(var(--background)))`,
            opacity: Math.min(scrollProgress * 2, 1),
          }}
        />
      </section>

      {/* Search */}
      <section ref={searchRef} className="py-16 md:py-24 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
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
          <GuidedSearch onResults={handleResults} />
        </div>
      </section>

      {/* Results */}
      {showResults && cars.length > 0 && (
        <section ref={resultsRef} className="py-16 px-4 bg-section-alt">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">🎉 {resultMessage}</h2>
            </div>

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
      )}

      <HowItWorks />
      <WhyFindCar />
      <Testimonials />
      <FAQ />
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Index;
