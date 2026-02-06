import { ScrollReveal } from './ScrollReveal';
import { MessageSquare, Brain, ThumbsUp } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'Berätta',
    description: 'Beskriv vad du söker — budget, biltyp, drivlina. Vår AI Clutch förstår dig.',
  },
  {
    icon: Brain,
    title: 'Analysera',
    description: 'Vår AI analyserar hundratals annonser och hittar de bästa matcherna.',
  },
  {
    icon: ThumbsUp,
    title: 'Välj',
    description: 'Få personliga rekommendationer och kontakta säljaren direkt.',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Så fungerar det</h2>
            <p className="text-muted-foreground mt-3">Tre enkla steg till din nästa bil</p>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-step-icon" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-primary font-bold">0{i + 1}</span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
