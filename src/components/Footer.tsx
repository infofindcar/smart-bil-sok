import { Link } from 'react-router-dom';
import { Mail, Instagram, Linkedin, ArrowUpRight } from 'lucide-react';
import logo from '@/assets/findcar-logo.png';
import kthLogo from '@/assets/kth-logo.png';
import { openFeedback } from '@/components/FeedbackWidget';

/**
 * Vit logga via CSS-mask istället för `brightness-0 invert` på en <img>.
 * Filter-kedjor (invert + drop-shadow) tvingar webbläsaren att rita om
 * bilden när footern kommer in i vyn, vilket gav en svart→vit blinkning.
 * En mask är en ren målad yta och blinkar inte.
 */
const MaskedLogo = ({
  src,
  label,
  className,
  opacity,
}: { src: string; label: string; className?: string; opacity?: string }) => (
  <div
    role="img"
    aria-label={label}
    className={`bg-secondary-foreground ${opacity ?? 'opacity-90'} aspect-square transform-gpu [backface-visibility:hidden] ${className ?? ''}`}
    style={{
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }}
  />
);

export const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.85-2.48V9.77a5.86 5.86 0 1 0 4.94 5.79V8.9a7.32 7.32 0 0 0 4.28 1.38V7.19a4.29 4.29 0 0 1-3.22-1.37z" />
    </svg>
  );


  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-secondary-foreground/10">
      <div className="w-full px-6 md:px-8 sm:px-12 lg:px-20 xl:px-32 2xl:px-40 pt-6 md:pt-8 pb-6 md:pb-8">
        {/* MOBILE: single column centered layout */}
        <div className="md:hidden flex flex-col items-center text-center space-y-8 mb-8">
          <img
            src={logo}
            alt="FindCar logotyp"
            className="h-20 w-auto brightness-0 invert opacity-90 drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
          />
          <p className="text-secondary-foreground/60 leading-relaxed text-sm max-w-xs">
            Sveriges objektiva bilrådgivare — vi säljer inte bilar, vi hittar din.
          </p>

          {/* Stacked links */}
          <div className="space-y-6 w-full">
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-4">Tjänster</h4>
              <div className="space-y-3">
                <Link to="/" onClick={scrollToTop} className="block text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Sök bil
                </Link>
                <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="block text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Så fungerar det
                </a>
                <Link to="/guider" className="block text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Guider
                </Link>
                <button type="button" onClick={openFeedback} className="block w-full text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Hjälp oss bli bättre
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-4">Juridiskt</h4>
              <div className="space-y-3">
                <Link to="/privacy" className="block text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Integritetspolicy
                </Link>
                <Link to="/terms" className="block text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors py-1">
                  Användarvillkor
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-4">Kontakt</h4>
              <a href="mailto:info@findcar.se" className="flex items-center justify-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                info@findcar.se
              </a>
              <div className="flex items-center justify-center gap-3 pt-4">
                <a href="https://instagram.com/findcar.se" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground transition-all" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com/company/findcar-se" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground transition-all" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://tiktok.com/@findcar.se" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground transition-all" aria-label="TikTok">
                  <TikTokIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP: original multi-column layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-6">
          <div className="lg:col-span-5 space-y-6">
            <img
              src={logo}
              alt="FindCar logotyp"
              className="h-28 sm:h-32 md:h-36 lg:h-40 w-auto brightness-0 invert opacity-90 drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            />
            <p className="text-secondary-foreground/60 leading-relaxed max-w-sm text-base">
              Sveriges objektiva bilrådgivare — vi säljer inte bilar, vi hittar din.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-8 lg:pt-4">
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-5">Tjänster</h4>
              <ul className="space-y-3.5">
                <li><Link to="/" onClick={scrollToTop} className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Sök bil<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></Link></li>
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Så fungerar det<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></a></li>
                <li><Link to="/guider" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Guider<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></Link></li>
                <li><button type="button" onClick={openFeedback} className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Hjälp oss bli bättre<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-5">Juridiskt</h4>
              <ul className="space-y-3.5">
                <li><Link to="/privacy" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Integritetspolicy<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></Link></li>
                <li><Link to="/terms" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors inline-flex items-center gap-1 group">Användarvillkor<ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40 mb-5">Kontakt</h4>
              <div className="space-y-3.5">
                <a href="mailto:info@findcar.se" className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors group"><Mail className="h-4 w-4 shrink-0" />info@findcar.se</a>
                <div className="flex items-center gap-3 pt-2">
                  <a href="https://instagram.com/findcar.se" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all" aria-label="Instagram"><Instagram className="h-4.5 w-4.5" /></a>
                  <a href="https://linkedin.com/company/findcar-se" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all" aria-label="LinkedIn"><Linkedin className="h-4.5 w-4.5" /></a>
                  <a href="https://tiktok.com/@findcar.se" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all" aria-label="TikTok"><TikTokIcon className="h-4 w-4" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-secondary-foreground/8 pt-6 md:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary-foreground/40">
            © {new Date().getFullYear()} FindCar. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-1 text-xs italic text-secondary-foreground/50 tracking-wide leading-none">
            <span>Framtagen på KTH</span>
            <img src={kthLogo} alt="KTH Royal Institute of Technology" className="h-16 w-auto brightness-0 invert object-contain" loading="lazy" />
          </div>
        </div>
      </div>
    </footer>
  );
};
