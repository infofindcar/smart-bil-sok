import { ScrollReveal } from './ScrollReveal';
import { Star, Search, Car, Shield } from 'lucide-react';

const testimonials = [
  {
    name: 'Anna K.',
    text: '"Hittade min drömkombi på 2 minuter. Clutch förstod exakt vad jag behövde!"',
    rating: 5,
  },
  {
    name: 'Marcus L.',
    text: '"Sparade mig veckor av letande. AI:n rekommenderade bilar jag aldrig hade hittat själv."',
    rating: 5,
  },
  {
    name: 'Sofia B.',
    text: '"Fantastiskt enkelt! Berättade bara att jag ville ha en elbil under 300k och fick perfekta förslag."',
    rating: 5,
  },
];

const badges = [
  { icon: Search, label: '50K+ sökningar' },
  { icon: Car, label: '100K+ bilar' },
  { icon: Star, label: '4.8/5 betyg' },
  { icon: Shield, label: '100% Gratis' },
];

export const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Vad våra användare säger</h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t) => (
            <ScrollReveal key={t.name}>
              <div className="bg-testimonial-bg rounded-2xl p-6 border border-border">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">{t.text}</p>
                <p className="text-xs font-semibold text-muted-foreground">— {t.name}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {badges.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-muted-foreground">
                <b.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
