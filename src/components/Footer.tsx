import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail } from 'lucide-react';
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
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="mailto:info@findcar.se" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
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
