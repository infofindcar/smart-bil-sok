import { ScrollReveal } from './ScrollReveal';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CtaBanner = () => {
  const scrollToSearch = () => {
    const el = document.querySelector('[data-search-section]');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 md:py-32 px-4 bg-background overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, hsl(var(--primary) / 0.12), transparent 70%)',
        }}
      />
      <div className="relative max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center space-y-8">
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl">
              Redo att hitta din <span className="text-gradient">drömbil</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base md:text-lg font-light leading-relaxed">
              Clutch hjälper dig — helt gratis. Berätta vad du söker, så gör vi resten.
            </p>
            <div className="pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={scrollToSearch}
                className="w-full md:w-auto rounded-full px-10 h-14 text-base font-medium"
              >
                Starta sökningen
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
