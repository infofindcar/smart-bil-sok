import { forwardRef, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CarCard } from '@/components/CarCard';
import { Sparkles, Scale, ChevronRight, ChevronDown } from 'lucide-react';
import type { Car, CarReason } from './GuidedSearch';

interface ResultsRevealProps {
  cars: Car[];
  savedCars: Car[];
  carReasons: CarReason[];
  resultMessage: string;
  onToggleSave: (car: Car) => void;
  onCompare: () => void;
  onShowMore: () => void;
  getReasonForCar: (carId: number) => string | undefined;
}

export const ResultsReveal = forwardRef<HTMLDivElement, ResultsRevealProps>(
  ({ cars, savedCars, carReasons, resultMessage, onToggleSave, onCompare, onShowMore, getReasonForCar }, ref) => {
    const [revealedCount, setRevealedCount] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Check if we already showed these results (e.g. returning from car detail)
    useEffect(() => {
      const alreadyRevealed = sessionStorage.getItem('findcar-results-revealed');
      if (alreadyRevealed === 'true') {
        setHasAnimated(true);
        setHeaderVisible(true);
        setRevealedCount(cars.length);
      }
    }, []);

    // Auto-scroll to results and start reveal sequence
    useEffect(() => {
      if (hasAnimated || cars.length === 0) return;

      // Small delay, then scroll to results
      const scrollTimer = setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

      // Show header after scroll
      const headerTimer = setTimeout(() => {
        setHeaderVisible(true);
      }, 800);

      // Reveal cards one by one
      const cardTimers: NodeJS.Timeout[] = [];
      cars.forEach((_, i) => {
        const timer = setTimeout(() => {
          setRevealedCount((prev) => prev + 1);
        }, 1200 + i * 400);
        cardTimers.push(timer);
      });

      // Mark as animated after all cards revealed
      const doneTimer = setTimeout(() => {
        setHasAnimated(true);
        sessionStorage.setItem('findcar-results-revealed', 'true');
      }, 1200 + cars.length * 400 + 200);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(headerTimer);
        clearTimeout(doneTimer);
        cardTimers.forEach(clearTimeout);
      };
    }, [cars.length, hasAnimated]);

    // Reset revealed flag when cars change (new search)
    useEffect(() => {
      return () => {
        // Don't clear on unmount from navigation — only clear in handleReset
      };
    }, []);

    const allRevealed = revealedCount >= cars.length;

    return (
      <section ref={ref} className="relative px-4 pb-20 pt-8">
        {/* Scroll indicator arrow */}
        {!headerVisible && cars.length > 0 && (
          <div className="flex justify-center py-8 animate-bounce">
            <div className="flex flex-col items-center gap-2 text-secondary/60">
              <span className="text-xs font-medium tracking-wide uppercase">Dina matchningar väntar</span>
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        )}

        <div ref={sectionRef} className="max-w-6xl mx-auto">
          {/* Results header — fades in */}
          <div
            className={`text-center mb-10 transition-all duration-700 ease-out ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/8 border border-border/30 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
                Dina perfekta matchningar
              </span>
              <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {resultMessage}
            </p>
          </div>

          {savedCars.length >= 2 && (
            <div
              className={`flex justify-center mb-6 transition-all duration-500 ${
                allRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Button variant="outline" onClick={onCompare}>
                <Scale className="h-4 w-4 mr-2" />
                Jämför {savedCars.length} bilar
              </Button>
            </div>
          )}

          {/* Cards grid — one by one reveal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {cars.map((car, index) => (
              <div
                key={car.id}
                className={`transition-all ease-out ${
                  index < revealedCount
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95'
                }`}
                style={{
                  transitionDuration: '600ms',
                  transitionDelay: hasAnimated ? '0ms' : '50ms',
                }}
              >
                <CarCard
                  car={car}
                  isSaved={savedCars.some((c) => c.id === car.id)}
                  onToggleSave={onToggleSave}
                  matchReason={getReasonForCar(car.id)}
                />
              </div>
            ))}
          </div>

          {/* Show more button — appears after all revealed */}
          <div
            className={`flex justify-center mt-10 transition-all duration-500 delay-300 ${
              allRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Button
              variant="outline"
              className="rounded-xl px-6"
              onClick={onShowMore}
            >
              Visa fler bilar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>
    );
  }
);

ResultsReveal.displayName = 'ResultsReveal';
