import { ScrollReveal } from './ScrollReveal';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CtaBanner = () => {
  const scrollToSearch = () => {
    const el = document.querySelector('[data-search-section]');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Redo att hitta din <span className="text-gradient">drömbi</span>l?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Clutch hjälper dig helt gratis. Berätta vad du söker så gör vi resten.
            </p>
            <Button variant="gradient" size="lg" onClick={scrollToSearch} className="rounded-xl px-8">
              Starta sökning
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
