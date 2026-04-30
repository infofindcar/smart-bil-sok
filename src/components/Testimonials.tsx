import { ScrollReveal } from './ScrollReveal';
import { Star, Quote } from 'lucide-react';

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
    <section className="py-20 md:py-32 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14 md:mb-20">
            <span className="eyebrow mb-5 mx-auto justify-center">Tidiga röster</span>
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl mt-4">
              Skrivet av riktiga användare.
            </h2>
          </div>
        </ScrollReveal>

        {/* MOBILE: horizontal snap-scroll */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 similar-cars-scroll">
            {testimonials.map((t, idx) => (
              <div key={idx} className="snap-start shrink-0 w-[85vw] max-w-[340px]">
                <div className="premium-card rounded-2xl p-6 h-full">
                  <Quote className="h-6 w-6 text-primary/40 mb-3" />
                  <p className="text-base text-foreground/90 leading-relaxed font-light">{t.text}</p>
                  <div className="flex gap-0.5 mt-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP: grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t, idx) => (
            <ScrollReveal key={idx} delay={idx * 80}>
              <div className="premium-card rounded-2xl p-8 h-full flex flex-col">
                <Quote className="h-7 w-7 text-primary/40 mb-4" />
                <p className="text-base text-foreground/90 leading-relaxed font-light flex-1">{t.text}</p>
                <div className="flex gap-0.5 mt-6 pt-6 border-t border-border/40">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
