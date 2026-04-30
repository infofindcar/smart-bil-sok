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
    <section className="py-8 md:py-16 px-4 bg-section-alt">
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
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline min-h-[48px] py-4">
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
