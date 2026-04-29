import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const benefits = [
  {
    title: 'Objektiv – alltid på din sida',
    description:
      'Till skillnad från traditionella bilhandlare representerar FindCar ingen enskild säljare. Vi hjälper dig att fatta ett genomtänkt bilbeslut.',
  },
  {
    title: 'Mindre letande. Bättre träff.',
    description:
      'FindCar analyserar tusentals bilar och matchar dem mot just din situation. Du slipper scrolla – och får istället relevanta förslag direkt.',
  },
  {
    title: 'Berätta om ditt liv – vi hittar bilen',
    description:
      'Pendlar du? Har barn? Kör mycket stad eller långresor? Beskriv hur du lever, så anpassar FindCar bilförslagen efter dina ändamål och din vardag.',
  },
  {
    title: 'Köpklar kund till rätt handlare',
    description:
      'Bilhandlare får inte fler klick – de får rätt kund. En kund som redan förstått sina behov, jämfört alternativ och är redo att genomföra köp.',
  },
];

export const WhyFindCar = () => {
  const [showBoxes, setShowBoxes] = useState(false);
  return (
    <section className="py-8 md:py-16 px-4 bg-section-alt">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Varför <span className="text-gradient">FindCar</span>?
            </h2>
            {!showBoxes && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setShowBoxes(true)}
                  variant="outline"
                  className="rounded-full px-6 h-11 group"
                >
                  Jag vill veta
                  <ChevronDown className="h-4 w-4 ml-2 transition-transform group-hover:translate-y-0.5" />
                </Button>
              </div>
            )}
          </div>
        </ScrollReveal>

        <AnimatePresence initial={false}>
          {showBoxes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-2">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="bg-card rounded-xl p-4 md:p-5 border border-border hover-lift h-full flex flex-col">
                      <h3 className="font-semibold text-base md:text-lg mb-2">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
