import { ScrollReveal } from './ScrollReveal';
import { Star } from 'lucide-react';

const testimonials = [
  {
    text: '"Hittade min drömkombi på 2 minuter. Clutch förstod exakt vad jag behövde!"',
    rating: 5,
  },
  {
    text: '"Sparade mig veckor av letande. AI:n rekommenderade bilar jag aldrig hade hittat själv."',
    rating: 5,
  },
  {
    text: '"Fantastiskt enkelt! Berättade bara att jag ville ha en elbil under 300k och fick perfekta förslag."',
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Vad våra användare säger</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tidig feedback från våra beta-användare
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <ScrollReveal key={idx}>
              <div className="bg-testimonial-bg rounded-2xl p-6 border border-border">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">{t.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
