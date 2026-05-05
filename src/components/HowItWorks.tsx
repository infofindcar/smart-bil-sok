import { ScrollReveal } from './ScrollReveal';

const steps = [
  {
    number: '01',
    title: 'Berätta för Clutch',
    description:
      'Beskriv din vardag — budget, körsträcka, familj, parkering. Helt på vanlig svenska.',
  },
  {
    number: '02',
    title: 'AI:n läser marknaden',
    description:
      'Clutch jämför tusentals annonser i realtid och rangordnar efter just dina behov.',
  },
  {
    number: '03',
    title: 'Få ditt urval',
    description:
      'Tre handplockade bilar med tydliga motiveringar. Du kontaktar säljaren direkt via FindCar.',
  },
];

export const HowItWorks = () => {
  return (
    <section className="relative py-20 md:py-32 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14 md:mb-20">
            <span className="eyebrow mb-5 mx-auto justify-center">Processen</span>
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl mt-4">
              Tre steg till din nästa bil.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 100}>
              <div className="relative h-full bg-background p-8 md:p-10 flex flex-col gap-6 transition-colors duration-300 hover:bg-card/40">
                <div className="step-numeral">{step.number}</div>
                <div className="hairline" />
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
