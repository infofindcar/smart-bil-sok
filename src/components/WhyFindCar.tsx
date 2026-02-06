import { ScrollReveal } from './ScrollReveal';
import { Clock, Zap, Target } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Spara tid',
    description: 'Slipp timmar på Blocket och Bytbil. Clutch gör jobbet åt dig på sekunder.',
  },
  {
    icon: Zap,
    title: 'Enkelt',
    description: 'Beskriv vad du vill ha i naturligt språk. Inga komplicerade filter.',
  },
  {
    icon: Target,
    title: 'Anpassat',
    description: 'AI-matchning baserat på dina behov, inte bara sökord.',
  },
];

export const WhyFindCar = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-section-alt">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Varför <span className="text-gradient">Find Car</span>?
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <ScrollReveal key={b.title}>
              <div className="bg-card rounded-2xl p-6 border border-border hover-lift text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
