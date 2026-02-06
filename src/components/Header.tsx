import { Link } from 'react-router-dom';
import logo from '@/assets/findcar-logo.png';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FindCar" className="h-14 md:h-16" />
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Hem
          </Link>
        </nav>
      </div>
    </header>
  );
};
