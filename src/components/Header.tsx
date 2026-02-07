import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/findcar-logo.png';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSearch = () => {
    setMobileOpen(false);
    const el = document.querySelector('[data-search-section]');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // When not scrolled (transparent header over hero), use white text
  const navLinkBase = 'transition-colors font-medium';
  const navLinkClass = scrolled
    ? `${navLinkBase} text-sm text-foreground/70 hover:text-foreground`
    : `${navLinkBase} text-[15px] text-white/90 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]`;

  const hamburgerClass = scrolled
    ? 'text-foreground'
    : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="FindCar"
            className={`h-16 sm:h-18 md:h-20 lg:h-22 w-auto transition-all duration-300 group-hover:brightness-110 ${
              scrolled ? 'h-12 sm:h-14 md:h-16 drop-shadow-lg' : 'drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)] brightness-110'
            }`}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={navLinkClass}
          >
            Så fungerar det
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={navLinkClass}
          >
            Vanliga frågor
          </a>
          <a
            href="mailto:kontakt@findcar.se"
            className={navLinkClass}
          >
            Kontakta oss
          </a>
          <Button size="sm" variant="gradient" onClick={scrollToSearch} className="rounded-xl">
            Hitta din bil
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ${hamburgerClass}`}
          aria-label="Meny"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/50 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-2"
            >
              Så fungerar det
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-2"
            >
              Vanliga frågor
            </a>
            <a
              href="mailto:kontakt@findcar.se"
              className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-2"
            >
              Kontakta oss
            </a>
            <Button size="sm" variant="gradient" onClick={scrollToSearch} className="w-full rounded-xl">
              Hitta din bil
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
