import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle } from 'lucide-react';

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
        setError(data?.error || 'Fel kod');
      }
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="font-display text-2xl tracking-[-0.02em]">FindCar</span>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 md:px-8 h-14 flex items-center border-b border-border">
        <span className="font-display text-[17px] font-medium tracking-[-0.02em]">FindCar</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10 fade-in">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <span className="eyebrow justify-center mx-auto">Beta · Stängd</span>
            <h1 className="font-display text-3xl md:text-[2.5rem] tracking-[-0.03em] leading-[1.05] text-foreground">
              Vill du vara med och utveckla en ny era av bilköp?
            </h1>
            <p className="text-[15px] text-muted-foreground">
              Skriv in din mail så skickar vi koden till dig.
            </p>
          </div>

          <WaitlistForm />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="hairline flex-1" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Har du en kod
              </span>
              <div className="hairline flex-1" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Ange din kod"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-center text-base rounded-md border-border bg-card"
              />
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 rounded-md font-medium" disabled={isLoading || !password}>
                {isLoading ? 'Verifierar…' : 'Logga in'}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-5 md:px-8 py-4 text-[13px] text-muted-foreground text-center">
        © {new Date().getFullYear()} FindCar · Framtagen på KTH
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
      setWaitlistError('Något gick fel. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-2 py-4 border border-border rounded-md bg-card">
        <CheckCircle className="h-5 w-5 text-foreground mx-auto" />
        <p className="text-sm font-medium text-foreground">
          {alreadyRegistered ? 'Du finns redan på listan.' : 'Tack! Vi har tagit emot din mail.'}
        </p>
        <p className="text-xs text-muted-foreground">
          {alreadyRegistered
            ? 'Vi hör av oss med din kod så snart vi öppnar upp.'
            : 'Vi återkommer med din kod så fort som möjligt.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleWaitlist} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          placeholder="Förnamn"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="h-11 rounded-md border-border bg-card text-base"
          required
          maxLength={100}
        />
        <Input
          type="text"
          placeholder="Efternamn"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-11 rounded-md border-border bg-card text-base"
          required
          maxLength={100}
        />
      </div>
      <Input
        type="email"
        placeholder="din@mail.se"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 rounded-md border-border bg-card text-base"
        required
      />
      <Button
        type="submit"
        className="w-full h-11 rounded-md font-medium"
        disabled={isSubmitting || !email || !firstName.trim() || !lastName.trim()}
      >
        {isSubmitting ? 'Skickar…' : 'Ställ mig i kö'}
      </Button>
      {waitlistError && <p className="text-destructive text-sm text-center">{waitlistError}</p>}
    </form>
  );
};