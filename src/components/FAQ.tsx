import { ScrollReveal } from './ScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Vad är FindCar egentligen?',
    a: 'FindCar är en objektiv digital bilrådgivare. Vi säljer inga bilar och representerar ingen enskild bilhandlare. Istället hjälper vi dig att hitta rätt bil baserat på din livssituation, dina behov och hur du faktiskt använder bilen.',
  },
  {
    q: 'Hur hittar FindCar rätt bil för mig?',
    a: 'Du beskriver ditt liv och dina behov i vanligt språk – till exempel hur du kör, din budget och vad som är viktigt för dig. FindCar analyserar detta och matchar dig med bilar som passar just din situation, istället för att visa allt på en gång.',
  },
  {
    q: 'Är FindCar verkligen objektivt?',
    a: 'Ja. FindCar är oberoende och styrs inte av vilken bil som ger högst provision. Vårt fokus är att du som bilköpare ska känna dig trygg och nöjd med ditt val.',
  },
  {
    q: 'Kostar det något att använda FindCar?',
    a: 'Nej, FindCar är kostnadsfritt för dig som bilköpare. Du betalar inget för att få matchning eller rekommendationer.',
  },
  {
    q: 'Var kommer bilarna ifrån?',
    a: 'Bilarna kommer från professionella bilhandlare som FindCar samarbetar med. Vi visar endast bilar som uppfyller dina behov och krav – inte hela marknaden.',
  },
  {
    q: 'Vad händer när jag hittat en bil som passar?',
    a: 'När du hittar en bil som känns rätt kan du enkelt gå vidare och ta kontakt med bilhandlaren. Eftersom du redan matchats utifrån dina behov är du ofta mer köpklar, vilket gör köpprocessen smidigare.',
  },
  {
    q: 'Måste jag köpa bilen via FindCar?',
    a: 'Nej. FindCar hjälper dig att hitta rätt bil, men beslutet är alltid ditt. Du väljer själv om, när och hur du vill gå vidare.',
  },
  {
    q: 'Är detta bara för erfarna bilköpare?',
    a: 'Nej. FindCar är särskilt hjälpsamt om du tycker att bilköp känns krångligt eller tidskrävande. Vi är byggda för både förstagångsköpare och mer erfarna bilägare.',
  },
];

export const FAQ = () => {
  return (
    <section className="py-12 md:py-24 px-4 bg-section-alt">
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
