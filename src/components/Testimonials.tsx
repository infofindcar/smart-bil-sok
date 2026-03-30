import { ScrollReveal } from './ScrollReveal';
import { Star } from 'lucide-react';

const testimonials = [
  {
    text: '"Jag visste inte alls vad jag ville ha, bara att det behövde funka för familjen. Fick tre förslag som alla var spot on – valde en Skoda Octavia till slut."',
    rating: 5,
  },
  {
    text: '"Har kollat Blocket i typ en månad utan att komma vidare. Här fick jag bra alternativ direkt, och slapp scrolla igenom hundratals annonser."',
    rating: 5,
  },
  {
    text: '"Tyckte det var skönt att den frågade om min pendling och parkering istället för motorstorlek och sånt. Kändes som att prata med en kompis som kan bilar."',
    rating: 4,
  },
  {
    text: '"Snabbt och smidigt. Berättade att jag ville ha elbil under 300k med bra räckvidd och fick relevanta förslag på en minut."',
    rating: 5,
  },
  {
    text: '"Skeptisk först, men förslagen var faktiskt riktigt bra. Hade inte tänkt på Hyundai Ioniq 5 själv men den passade perfekt."',
    rating: 4,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-12 md:py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">Vad våra användare säger</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tidig feedback från våra beta-användare
            </p>
          </div>
        </ScrollReveal>

        {/* MOBILE: horizontal snap-scroll */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 similar-cars-scroll">
            {testimonials.map((t, idx) => (
              <div key={idx} className="snap-start shrink-0 w-[85vw] max-w-[340px]">
                <div className="bg-testimonial-bg rounded-2xl p-6 border border-border h-full">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP: grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
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
