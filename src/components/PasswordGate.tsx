import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, CheckCircle, Send, Instagram, Linkedin, User } from 'lucide-react';
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
          <img src={heroLogo} alt="FindCar logotyp" className="h-20" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle indigo glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, hsl(239 84% 50% / 0.10), transparent 65%), radial-gradient(ellipse 50% 40% at 50% 100%, hsl(245 70% 40% / 0.08), transparent 70%)',
        }}
      />
      {/* Logo top-left */}
      <header className="relative px-6 sm:px-10 pt-6 sm:pt-8 z-10">
        <img src={heroLogo} alt="FindCar logotyp" className="h-10 sm:h-12" />
      </header>

      <main className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-10 z-10">
        <div className="w-full max-w-xl space-y-10">
          {/* Headline + waitlist */}
          <div className="space-y-5 text-center">
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.28em] text-muted-foreground font-medium">
              <span className="block w-7 h-px bg-primary/60" />
              Early access
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl text-foreground leading-[1.03] tracking-[-0.02em]">
              En ny era av <em className="not-italic text-gradient">bilköp</em>.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              FindCar är i privat beta. Lämna din mail så hör vi av oss med en personlig kod.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 sm:p-8">
            <WaitlistForm />
          </div>

          {/* Code entry — compact */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 text-center font-medium">
              Har du redan en kod?
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Ange din kod"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 bg-card/40 text-center text-sm rounded-xl border-border focus:border-primary/60"
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full h-12 text-sm rounded-xl font-medium" disabled={isLoading || !password}>
                {isLoading ? 'Verifierar...' : 'Logga in'}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-background text-foreground border-t border-border/60 mt-10 z-10">
        <div className="w-full px-6 md:px-8 sm:px-12 lg:px-20 xl:px-32 2xl:px-40 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-6">
            {/* Logo + tagline */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5 md:max-w-sm">
              <img
                src={footerLogo}
                alt="FindCar logotyp"
                className="h-20 md:h-28 w-auto brightness-0 invert opacity-90 drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
              />
              <p className="text-secondary-foreground/60 leading-relaxed text-sm md:text-base">
                Sveriges objektiva bilrådgivare — vi säljer inte bilar, vi hittar din.
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
              <img src={kthLogo} alt="KTH Royal Institute of Technology" className="h-14 w-auto brightness-0 invert object-contain" loading="lazy" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWaitlistError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('add-to-waitlist', {
        body: { email, firstName, lastName },
      });
      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      setAlreadyRegistered(Boolean(data?.alreadyRegistered));
      setIsSubmitted(true);
    } catch {
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    if (alreadyRegistered) {
      return (
        <div className="space-y-2 text-center py-2">
          <CheckCircle className="h-6 w-6 text-secondary mx-auto" />
          <p className="text-sm font-medium text-foreground">Du finns redan på listan ✨</p>
          <p className="text-xs text-muted-foreground">
            Vi har din mail sparad sedan tidigare och hör av oss med din kod så snart vi öppnar upp.
          </p>
        </div>
      );
    }
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
      <form onSubmit={handleWaitlist} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Förnamn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="pl-11 h-12 bg-background/80 border-border/50 text-base rounded-xl"
              required
              maxLength={100}
            />
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Efternamn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="pl-11 h-12 bg-background/80 border-border/50 text-base rounded-xl"
              required
              maxLength={100}
            />
          </div>
        </div>
        <div className="group relative flex items-center gap-2 rounded-2xl border border-border/50 bg-background/80 p-1.5 shadow-inner focus-within:border-secondary/60 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-secondary transition-colors" />
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
            disabled={isSubmitting || !email || !firstName.trim() || !lastName.trim()}
          >
            <Send className="h-4 w-4 mr-1.5" />
            {isSubmitting ? '...' : 'Skicka'}
          </Button>
        </div>
      </form>
      {waitlistError && <p className="text-destructive text-sm text-center">{waitlistError}</p>}
    </div>
  );
};
