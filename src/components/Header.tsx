import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Mail, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logo from '@/assets/findcar-logo.png';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [mobileOpen]);

  const scrollToSearch = () => {
    setMobileOpen(false);
    const el = document.querySelector('[data-search-section]');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Header sits over aurora landing — use foreground text always so it adapts
  // to light/dark mode automatically. When scrolled the header gets its own
  // backdrop-blur background so contrast is even better.
  const navLinkBase = 'transition-colors font-medium';
  const navLinkClass = scrolled
    ? `${navLinkBase} text-sm text-primary hover:text-primary/80`
    : `${navLinkBase} text-[15px] text-foreground/85 hover:text-foreground`;

  const hamburgerClass = 'text-foreground';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        mobileOpen
          ? 'bg-background border-b border-border/50'
          : scrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border/50'
            : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="FindCar logotyp"
            className={`h-10 sm:h-14 md:h-20 lg:h-22 w-auto transition-all duration-300 group-hover:brightness-110 ${
              scrolled ? 'h-9 sm:h-12 md:h-16 drop-shadow-lg' : 'drop-shadow-md'
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
          <button
            onClick={() => setContactOpen(true)}
            className={navLinkClass}
          >
            Kontakta oss
          </button>
          <ThemeToggle />
          <Button size="sm" variant="gradient" onClick={scrollToSearch} className="rounded-xl">
            Hitta din bil
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-foreground/5 active:bg-foreground/10 transition-colors touch-target ${hamburgerClass}`}
          aria-label="Meny"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu — elegant slide-down */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'
        } bg-background border-b border-border/30`}
      >
        <nav className="flex flex-col px-6 py-6 gap-1">
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[15px] font-medium text-foreground/80 hover:text-foreground py-3 px-2 rounded-lg hover:bg-accent/40 transition-colors"
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
            className="text-[15px] font-medium text-foreground/80 hover:text-foreground py-3 px-2 rounded-lg hover:bg-accent/40 transition-colors"
          >
            Vanliga frågor
          </a>
          <button
            onClick={() => {
              setMobileOpen(false);
              setContactOpen(true);
            }}
            className="text-[15px] font-medium text-foreground/80 hover:text-foreground py-3 px-2 rounded-lg hover:bg-accent/40 transition-colors text-left"
          >
            Kontakta oss
          </button>
          <div className="flex items-center gap-3 pt-3 border-t border-border/20">
            <ThemeToggle className="text-foreground" />
            <Button size="sm" variant="gradient" onClick={scrollToSearch} className="flex-1 rounded-xl text-sm h-11">
              Hitta din bil
            </Button>
          </div>
        </nav>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Kontakta oss</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Har du frågor eller funderingar? Hör gärna av dig!
            </p>
            <a
              href="mailto:info@findcar.se"
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">E-post</p>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">info@findcar.se</p>
              </div>
            </a>
            <a
              href="https://www.linkedin.com/company/findcar-se"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">LinkedIn</p>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">FindCar på LinkedIn</p>
              </div>
            </a>
            <a
              href="https://instagram.com/findcar.se"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Instagram</p>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">@findcar.se</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
