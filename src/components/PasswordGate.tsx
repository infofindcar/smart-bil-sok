import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, CheckCircle, Send, Instagram, Linkedin } from 'lucide-react';
import heroLogo from '@/assets/findcar-logo-hero.png';
import footerLogo from '@/assets/findcar-logo.png';
import kthLogo from '@/assets/kth-logo.png';

const SESSION_KEY = 'findcar_session';

interface PasswordGateProps {
  children: ReactNode;
}

export const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const { expiresAt } = JSON.parse(session);
        if (new Date(expiresAt) > new Date()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-password', {
        body: { password },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          token: data.sessionToken,
          expiresAt: data.expiresAt,
        }));
        setIsAuthenticated(true);
      } else {
        setError(data?.error || 'Wrong password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-subtle">
          <img src={heroLogo} alt="FindCar" className="h-20" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo top-left */}
      <header className="px-6 sm:px-10 pt-6 sm:pt-8">
        <img src={heroLogo} alt="FindCar" className="h-10 sm:h-12" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-xl space-y-8">
          {/* Headline + waitlist */}
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Vill du vara med och utveckla en ny era av bilköp?
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Skriv in din mail så skickar vi koden till dig.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/[0.08] via-card/40 to-primary/[0.06] p-6 sm:p-8 shadow-[0_8px_40px_-12px_hsl(var(--secondary)/0.25)] backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative">
              <WaitlistForm />
            </div>
          </div>

          {/* Code entry */}
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 sm:p-8 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium text-center">
              Har du redan en kod?
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Ange din kod"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-background text-center text-base rounded-xl border-border/50 focus:border-secondary/40"
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full h-14 text-base rounded-xl font-semibold" disabled={isLoading || !password}>
                {isLoading ? 'Verifierar...' : 'Logga in'}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground mt-10">
        <div className="w-full px-6 md:px-8 sm:px-12 lg:px-20 xl:px-32 2xl:px-40 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-6">
            {/* Logo + tagline */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5 md:max-w-sm">
              <img
                src={footerLogo}
                alt="FindCar"
                className="h-20 md:h-28 w-auto brightness-0 invert opacity-90 drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
              />
              <p className="text-secondary-foreground/60 leading-relaxed text-sm md:text-base">
                Sveriges objektiva bilrådgivare — driven av AI.
                <br className="hidden md:block" />
                {' '}Vi hjälper dig hitta rätt bil, helt utan provision.
              </p>
            </div>

            {/* Kontakt */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <h4 className="font-semibold text-xs uppercase tracking-[0.2em] text-secondary-foreground/40">Kontakt</h4>
              <a href="mailto:info@findcar.se" className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                info@findcar.se
              </a>
              <div className="flex items-center gap-3 pt-1">
                <a href="https://instagram.com/findcar.se" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com/company/findcar-se" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/50 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition-all" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-secondary-foreground/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-secondary-foreground/40">
              © {new Date().getFullYear()} FindCar. Alla rättigheter förbehållna.
            </p>
            <div className="flex items-center gap-1 text-xs italic text-secondary-foreground/50 tracking-wide leading-none">
              <span>Framtagen på KTH</span>
              <img src={kthLogo} alt="KTH" className="h-14 w-auto brightness-0 invert object-contain" loading="lazy" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWaitlistError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('add-to-waitlist', {
        body: { email },
      });
      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      setIsSubmitted(true);
    } catch {
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-2 text-center py-2">
        <CheckCircle className="h-6 w-6 text-primary mx-auto" />
        <p className="text-sm font-medium text-foreground">Tack! Vi har tagit emot din mail.</p>
        <p className="text-xs text-muted-foreground">Vi återkommer med din kod så fort som möjligt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleWaitlist} className="group relative flex items-center gap-2 rounded-2xl border border-border/50 bg-background/80 p-1.5 shadow-inner focus-within:border-secondary/60 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/70 group-focus-within:text-secondary transition-colors" />
          <Input
            type="email"
            placeholder="din@mail.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 h-12 bg-transparent border-0 text-base rounded-xl shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            required
          />
        </div>
        <Button
          type="submit"
          className="h-12 px-5 rounded-xl text-sm font-semibold bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100 transition-all"
          disabled={isSubmitting || !email}
        >
          <Send className="h-4 w-4 mr-1.5" />
          {isSubmitting ? '...' : 'Skicka'}
        </Button>
      </form>
      {waitlistError && <p className="text-destructive text-sm text-center">{waitlistError}</p>}
    </div>
  );
};
