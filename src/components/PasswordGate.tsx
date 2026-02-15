import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, CheckCircle } from 'lucide-react';
import logo from '@/assets/findcar-logo.png';

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
        setError(data?.error || 'Fel lösenord');
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
        <div className="animate-pulse-subtle">
          <img src={logo} alt="FindCar" className="h-12" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="space-y-2">
          <img src={logo} alt="FindCar" className="h-14 mx-auto animate-float" />
          <p className="text-muted-foreground text-sm">Din AI-bilrådgivare</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Ange lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-card"
              autoFocus
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={isLoading || !password}>
            {isLoading ? 'Verifierar...' : 'Logga in'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Denna tjänst är lösenordsskyddad under beta.
        </p>

        <Separator className="my-2" />

        <WaitlistForm />
      </div>
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
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error && !error.message.includes('duplicate')) throw error;
      setIsSubmitted(true);
    } catch {
      setWaitlistError('Något gick fel. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-2 text-center">
        <CheckCircle className="h-6 w-6 text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Tack! Vi hör av oss.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Vill du få tillgång först och följa resan?
      </p>
      <form onSubmit={handleWaitlist} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-10 bg-card"
            required
          />
        </div>
        <Button type="submit" size="sm" className="h-10" disabled={isSubmitting || !email}>
          {isSubmitting ? '...' : 'Skicka'}
        </Button>
      </form>
      {waitlistError && <p className="text-destructive text-xs">{waitlistError}</p>}
    </div>
  );
};
