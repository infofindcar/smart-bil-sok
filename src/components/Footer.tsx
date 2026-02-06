import { Link } from 'react-router-dom';
import { Mail, Instagram, Linkedin } from 'lucide-react';
import logo from '@/assets/findcar-logo.png';

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div className="space-y-4">
            <img src={logo} alt="FindCar" className="h-14 brightness-0 invert" />
            <p className="text-sm text-secondary-foreground/70 leading-relaxed">
              Sveriges objektiva bilrådgivare — driven av AI.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Tjänster</h4>
            <ul className="space-y-2.5 text-sm text-secondary-foreground/70">
              <li><Link to="/" className="hover:text-secondary-foreground transition-colors">Sök bil</Link></li>
              <li><Link to="/privacy" className="hover:text-secondary-foreground transition-colors">Integritetspolicy</Link></li>
              <li><Link to="/terms" className="hover:text-secondary-foreground transition-colors">Användarvillkor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Kontakt</h4>
            <div className="space-y-3">
              <a
                href="mailto:info@findcar.se"
                className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                info@findcar.se
              </a>
              <div className="flex items-center gap-4 pt-1">
                <a
                  href="https://instagram.com/findcar.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com/company/findcar-se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
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
