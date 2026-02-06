import { useState, useRef } from 'react';
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
import logo from '@/assets/findcar-logo.png';

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

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Light overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        <div className="relative z-10 text-center px-4 space-y-6">
          <img src={logo} alt="FindCar" className="h-40 md:h-52 lg:h-64 mx-auto animate-float animate-glow" />
          <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto font-light">
            Din AI-drivna bilrådgivare. Hitta rätt bil — utan krångel.
          </p>
          <Button variant="gradient" size="xl" onClick={scrollToSearch}>
            Hitta din bil
          </Button>
        </div>
        <button
          onClick={scrollToSearch}
          className="absolute bottom-10 animate-bounce text-white/50 hover:text-white/80 transition-colors"
          aria-label="Scrolla ner"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
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
