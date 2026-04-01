import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

export const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const searchSection = document.querySelector('[data-search-section]');
      if (!searchSection) {
        setVisible(window.scrollY > window.innerHeight * 0.7);
        return;
      }
      const rect = searchSection.getBoundingClientRect();
      const pastHero = window.scrollY > window.innerHeight * 0.7;
      // Hide when search section is in view (user is chatting with Clutch)
      const searchInView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
      setVisible(pastHero && !searchInView);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSearch = () => {
    const el = document.querySelector('[data-search-section]');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 transition-all duration-500 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(to top, hsl(var(--background)) 60%, hsl(var(--background) / 0.8) 85%, transparent 100%)',
      }}
    >
      <Button
        onClick={scrollToSearch}
        variant="gradient"
        className="w-full h-13 rounded-2xl text-base font-semibold shadow-xl active:scale-[0.97] transition-transform"
      >
        <ChevronUp className="h-4 w-4 mr-2" />
        Hitta din bil
      </Button>
    </div>
  );
};
