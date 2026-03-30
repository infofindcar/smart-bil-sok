import { ScrollReveal } from './ScrollReveal';
import { Shield, Target, MessageCircle, Handshake, Check } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Objektiv – alltid på din sida',
    description:
      'Till skillnad från traditionella bilhandlare representerar FindCar ingen enskild säljare. Vi hjälper dig att fatta ett genomtänkt bilbeslut – baserat på dina behov, inte provision.',
    checks: ['Tryggare beslut', 'Mindre köpångest', 'Högre chans till ett nöjt köp'],
  },
  {
    icon: Target,
    title: 'Mindre letande. Bättre träff.',
    description:
      'FindCar analyserar tusentals bilar och matchar dem mot just din situation. Du slipper scrolla – och får istället relevanta förslag direkt.',
    checks: ['Snabbare beslut', 'Färre kompromisser', 'Rätt bil från start'],
  },
  {
    icon: MessageCircle,
    title: 'Berätta om ditt liv – vi hittar bilen',
    description:
      'Pendlar du? Har barn? Kör mycket stad eller långresor? Beskriv hur du lever, så anpassar FindCar bilförslagen efter dina ändamål och din vardag.',
    quote: '"Två barn, pendlar 6 mil, vill ha låg månadskostnad och trygg bil."',
  },
  {
    icon: Handshake,
    title: 'Köpklar kund till rätt handlare',
    description:
      'Bilhandlare får inte fler klick – de får rätt kund. En kund som redan förstått sina behov, jämfört alternativ och är redo att genomföra köp.',
    checks: ['Kortare säljcykler', 'Färre "tittare"', 'Högre avslutsgrad'],
  },
];

export const WhyFindCar = () => {
  return (
    <section className="py-12 md:py-24 px-4 bg-section-alt">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Varför <span className="text-gradient">FindCar</span>?
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {benefits.map((b, i) => (
            <ScrollReveal key={b.title} delay={i * 100}>
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border hover-lift h-full flex flex-col">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg md:text-xl mb-3">{b.title}</h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {b.description}
                </p>

                {/* Checks or Quote */}
                <div className="mt-auto">
                  {b.checks && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {b.checks.map((check) => (
                        <div key={check} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground/80">{check}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {b.quote && (
                    <blockquote className="border-l-2 border-primary/30 pl-4 mt-1">
                      <p className="text-sm italic text-primary/70 leading-relaxed">
                        {b.quote}
                      </p>
                    </blockquote>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
