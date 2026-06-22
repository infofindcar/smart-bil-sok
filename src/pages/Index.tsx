import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuidedSearch, type Car, type CarReason } from '@/components/GuidedSearch';
import { SEO } from '@/components/SEO';

const ResultsReveal = lazy(() => import('@/components/ResultsReveal').then((m) => ({ default: m.ResultsReveal })));
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
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showResults) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cars, carReasons, savedCars, resultMessage, showResults }),
      );
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
        toast.info('Inga fler bilar hittades med dina filter.');
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [cars, language]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Din objektiva bilrådgivare | FindCar"
        description="FindCar ger dig objektiv bilrådgivning med hjälp av AI. Beskriv bilen du letar efter — vi hittar den åt dig."
        path="/"
      />
      <Header />

      <main className="flex-1 flex flex-col">
        <section
          data-search-section
          className="flex-1 flex flex-col items-center justify-center px-5 py-16 md:py-24 fade-in"
        >
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-10 md:mb-14">
              <span className="eyebrow mb-5 md:mb-6 justify-center mx-auto">Findcar</span>
              <h1 className="font-display text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] tracking-[-0.03em] text-foreground">
                Din objektiva
                <br />
                bilrådgivare.
              </h1>
              <p className="mt-5 text-muted-foreground text-[15px] md:text-base max-w-md mx-auto leading-relaxed">
                Beskriv bilen du letar efter så hittar vi den åt dig — bland tusentals annonser.
              </p>
            </div>

            <GuidedSearch
              onResults={handleResults}
              onScrollToResults={() =>
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              onLanguageChange={setLanguage}
            />
          </div>
        </section>

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
      </main>

      <Footer />

      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </div>
  );
};

export default Index;