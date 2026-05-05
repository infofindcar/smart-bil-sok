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
    a: 'FindCar är en gratis bilrådgivare på nätet. Hjärtat är vår AI Clutch som hjälper dig hitta rätt bil utifrån din livssituation och hur du faktiskt använder bilen — inte vilken modell som råkar synas mest just nu. Vi säljer inga bilar själva och tar ingen provision.',
  },
  {
    q: 'Hur hittar FindCar rätt bil för mig?',
    a: 'Du chattar med Clutch på vanlig svenska — om din vardag, din budget och vad du vill ha bilen till. Clutch jämför sen tusentals annonser och plockar ut de som faktiskt passar dig, så du slipper scrolla i timmar.',
  },
  {
    q: 'Är FindCar verkligen objektivt?',
    a: 'Ja. Vi tar inga provisioner, säljer ingen reklam och har inga samarbeten med vissa bilfirmor. Det betyder att Clutch inte har någon anledning att rekommendera en bil framför en annan — bara den som passar dig bäst.',
  },
  {
    q: 'Kostar det något att använda FindCar?',
    a: 'Nej, allt är gratis. FindCar drivs som ett ideellt projekt — vi tar inga betalningar från användare eller bilfirmor.',
  },
  {
    q: 'Är detta bara för erfarna bilköpare?',
    a: 'Tvärtom — det är ofta de som tycker bilköp är krångligt som har mest nytta av Clutch. Du behöver inte kunna fackuttryck eller ha koll på modellnamn; berätta bara hur du tänker använda bilen, så löser Clutch resten.',
  },
];

export const FAQ = () => {
  return (
    <section className="py-20 md:py-32 px-4 bg-section-alt">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <span className="eyebrow mb-5 mx-auto justify-center">FAQ</span>
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl mt-4">
              Vanliga frågor.
            </h2>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="premium-card rounded-2xl px-5 md:px-6 border-border/60"
              >
                <AccordionTrigger className="text-base font-medium text-left hover:no-underline min-h-[56px] py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed font-light pb-5">
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
