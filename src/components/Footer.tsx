import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import logo from '@/assets/findcar-logo.png';

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <img src={logo} alt="FindCar" className="h-8 mb-3 brightness-0 invert" />
            <p className="text-sm text-secondary-foreground/70 leading-relaxed">
              Din AI-drivna bilrådgivare. Vi hjälper dig hitta rätt bil — utan krångel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Tjänster</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/" className="hover:text-secondary-foreground transition-colors">Sök bil</Link></li>
              <li><Link to="/privacy" className="hover:text-secondary-foreground transition-colors">Integritetspolicy</Link></li>
              <li><Link to="/terms" className="hover:text-secondary-foreground transition-colors">Användarvillkor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Kontakt</h4>
            <a
              href="mailto:info@findcar.se"
              className="inline-flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              info@findcar.se
            </a>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 pt-6 text-center">
          <p className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} FindCar. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
};
