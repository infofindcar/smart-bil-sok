import { ScrollReveal } from './ScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Hur fungerar Find Car?',
    a: 'Find Car använder AI för att förstå dina bilbehov. Du beskriver vad du söker — budget, biltyp, drivlina — och vår AI hittar de bästa matcherna bland hundratals annonser.',
  },
  {
    q: 'Kostar det något?',
    a: 'Nej, Find Car är helt gratis att använda. Vi tar inte betalt för sökningar eller rekommendationer.',
  },
  {
    q: 'Var kommer bilarna ifrån?',
    a: 'Vi samlar annonser från flera svenska bilmarknader och återförsäljare för att ge dig det bredaste urvalet.',
  },
  {
    q: 'Kan jag spara bilar jag gillar?',
    a: 'Ja! Klicka på hjärtat på valfritt bilkort för att spara det. Du kan också jämföra sparade bilar sida vid sida.',
  },
  {
    q: 'Hur exakta är prisuppgifterna?',
    a: 'Priserna hämtas direkt från annonserna och uppdateras regelbundet. Vi rekommenderar att du alltid verifierar priset hos säljaren.',
  },
  {
    q: 'Vad gör jag när jag hittat en bil?',
    a: 'Klicka på "Kontakta återförsäljare" på bildetaljsidan. Du kommer direkt till den ursprungliga annonsen där du kan kontakta säljaren.',
  },
];

export const FAQ = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-section-alt">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Vanliga frågor</h2>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card rounded-xl border border-border px-4"
              >
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
};
