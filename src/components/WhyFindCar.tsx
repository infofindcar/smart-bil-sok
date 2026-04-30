import { ScrollReveal } from './ScrollReveal';
import { Shield, Sparkles, Heart, Handshake } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Objektiv – alltid på din sida',
    description:
      'Till skillnad från traditionella bilhandlare representerar FindCar ingen enskild säljare. Vi hjälper dig att fatta ett genomtänkt bilbeslut.',
  },
  {
    icon: Sparkles,
    title: 'Mindre letande. Bättre träff.',
    description:
      'FindCar analyserar tusentals bilar och matchar dem mot just din situation. Du slipper scrolla – och får istället relevanta förslag direkt.',
  },
  {
    icon: Heart,
    title: 'Berätta om ditt liv – vi hittar bilen',
    description:
      'Pendlar du? Har barn? Kör mycket stad eller långresor? Beskriv hur du lever, så anpassar FindCar bilförslagen efter dina ändamål och din vardag.',
  },
  {
    icon: Handshake,
    title: 'Köpklar kund till rätt handlare',
    description:
      'Bilhandlare får inte fler klick – de får rätt kund. En kund som redan förstått sina behov, jämfört alternativ och är redo att genomföra köp.',
  },
];

export const WhyFindCar = () => {
  return (
    <section className="relative py-20 md:py-32 px-4 bg-section-alt overflow-hidden">
      {/* subtle radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.08), transparent 60%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14 md:mb-20">
            <span className="eyebrow mb-5 mx-auto justify-center">Varför FindCar</span>
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl mt-4">
              Bilköp, <span className="text-gradient">utan agenda</span>.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-base md:text-lg font-light leading-relaxed">
              Vi tjänar inga pengar på vilken bil du väljer. Det betyder att vårt enda mål är att hjälpa dig välja rätt.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {benefits.map((b, i) => (
            <ScrollReveal key={b.title} delay={i * 80}>
              <div className="premium-card rounded-2xl p-6 md:p-8 h-full flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold tracking-tight">{b.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                  {b.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
