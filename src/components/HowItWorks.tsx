import { ScrollReveal } from './ScrollReveal';
import { MessageSquare, Brain, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import step2CarImage from '@/assets/step2-car.png';

interface Step {
  icon: LucideIcon;
  number: number;
  title: string;
  description: string;
  image: string;
}

const steps: Step[] = [
  {
    icon: MessageSquare,
    number: 1,
    title: 'Berätta för Clutch vad du vill ha',
    description:
      'Beskriv din drömbil. Budget, livsstil, preferenser — allt som är viktigt för dig.',
    image:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  },
  {
    icon: Brain,
    number: 2,
    title: 'Clutch analyserar tusentals alternativ',
    description:
      'Vår AI skannar marknaden och jämför funktioner, priser, recensioner och tillförlitlighet för att hitta de bästa matcherna.',
    image: step2CarImage,
  },
  {
    icon: ListChecks,
    number: 3,
    title: 'Få dina personliga rekommendationer',
    description:
      'Ta emot skräddarsydda rekommendationer med tydliga förklaringar till varför varje bil passar dina behov.',
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">Så fungerar det</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Att hitta din perfekta bil har aldrig varit enklare. Låt Clutch
              göra det tunga arbetet.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <ScrollReveal key={step.number}>
              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden h-full flex flex-col">
                {/* Image with number badge */}
                <div className="relative">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <step.icon className="h-6 w-6 text-step-icon" />
                  </div>
                  <h3 className="text-lg font-bold leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
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
