import { forwardRef, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CarCard } from '@/components/CarCard';
import { Sparkles, Scale, ChevronRight, ArrowDown, Lightbulb } from 'lucide-react';
import type { Car, CarReason } from './GuidedSearch';

interface ResultsRevealProps {
  cars: Car[];
  similarCars: Car[];
  savedCars: Car[];
  carReasons: CarReason[];
  resultMessage: string;
  onToggleSave: (car: Car) => void;
  onCompare: () => void;
  onShowMore: () => void;
  getReasonForCar: (carId: number) => string | undefined;
}

export const ResultsReveal = forwardRef<HTMLDivElement, ResultsRevealProps>(
  ({ cars, similarCars, savedCars, resultMessage, onToggleSave, onCompare, onShowMore, getReasonForCar }, ref) => {
    const [revealedCount, setRevealedCount] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [showSimilar, setShowSimilar] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Check if we already showed these results (e.g. returning from car detail)
    useEffect(() => {
      const alreadyRevealed = sessionStorage.getItem('findcar-results-revealed');
      if (alreadyRevealed === 'true') {
        setHasAnimated(true);
        setHeaderVisible(true);
        setRevealedCount(cars.length);
        setShowSimilar(true);
      }
    }, []);

    // Auto-scroll to results and start reveal sequence
    useEffect(() => {
      if (hasAnimated || cars.length === 0) return;

      // Scroll to results section
      const scrollTimer = setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);

      // Show header after scroll settles
      const headerTimer = setTimeout(() => {
        setHeaderVisible(true);
      }, 900);

      // Reveal cards one by one with a pop effect
      const cardTimers: NodeJS.Timeout[] = [];
      cars.forEach((_, i) => {
        const timer = setTimeout(() => {
          setRevealedCount((prev) => prev + 1);
        }, 1400 + i * 500);
        cardTimers.push(timer);
      });

      // Show similar section after top cards are revealed
      const similarTimer = setTimeout(() => {
        setShowSimilar(true);
      }, 1400 + cars.length * 500 + 400);

      // Mark as animated
      const doneTimer = setTimeout(() => {
        setHasAnimated(true);
        sessionStorage.setItem('findcar-results-revealed', 'true');
      }, 1400 + cars.length * 500 + 800);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(headerTimer);
        clearTimeout(similarTimer);
        clearTimeout(doneTimer);
        cardTimers.forEach(clearTimeout);
      };
    }, [cars.length, hasAnimated]);

    const allRevealed = revealedCount >= cars.length;

    return (
      <section ref={ref} className="relative px-4 pb-20">
        {/* Decorative background for results */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-secondary/[0.05] blur-[100px]" />
        </div>

        {/* Scroll-down CTA banner */}
        <div
          ref={sectionRef}
          className="relative flex flex-col items-center justify-center py-12 md:py-16"
        >
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-700 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Glowing badge */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150 animate-pulse" />
              <div className="relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-card border border-primary/20 shadow-lg shadow-primary/[0.08]">
                <Sparkles className="h-4 w-4 text-primary card-pop-sparkle" />
                <span className="text-sm font-semibold text-foreground tracking-wide">
                  {cars.length} perfekta matchningar hittade
                </span>
                <Sparkles className="h-4 w-4 text-primary card-pop-sparkle" style={{ animationDelay: '200ms' }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto text-center leading-relaxed">
              {resultMessage}
            </p>

            {/* Animated scroll arrow */}
            {!allRevealed && (
              <div className="mt-4 scroll-arrow-bounce">
                <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-md shadow-secondary/[0.08]">
                  <ArrowDown className="h-5 w-5 text-secondary" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto">
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

          {/* Top matches grid — pop-in one by one */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {cars.map((car, index) => (
              <div
                key={car.id}
                className={`card-pop-wrapper ${
                  index < revealedCount ? 'card-pop-visible' : 'card-pop-hidden'
                } ${hasAnimated ? 'card-pop-instant' : ''}`}
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

          {/* Similar cars — horizontal scroll */}
          {similarCars.length > 0 && (
            <div
              className={`mt-12 transition-all duration-700 ${
                showSimilar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Liknande bilar du kanske gillar
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Baserat på dina preferenser — scrolla för att se fler
                  </p>
                </div>
              </div>

              {/* Horizontal scroll container */}
              <div className="similar-cars-scroll flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {similarCars.map((car) => (
                  <div key={car.id} className="flex-shrink-0 w-[270px]">
                    <CarCard
                      car={car}
                      isSaved={savedCars.some((c) => c.id === car.id)}
                      onToggleSave={onToggleSave}
                      matchReason={getReasonForCar(car.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show more button */}
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
