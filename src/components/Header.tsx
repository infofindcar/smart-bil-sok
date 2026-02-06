import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/findcar-logo.png';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FindCar" className="h-8" />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm transition-colors ${
              scrolled
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Hem
          </Link>
        </nav>
      </div>
    </header>
  );
};
