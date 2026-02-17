import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, CheckCircle, Send } from 'lucide-react';
import heroLogo from '@/assets/findcar-logo-hero.png';

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-10">

        {/* Logo — big and proud */}
        <div className="space-y-3">
          <img
            src={heroLogo}
            alt="FindCar"
            className="h-28 sm:h-36 mx-auto animate-float"
            style={{ filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.25))' }}
          />
          <p className="text-muted-foreground text-sm tracking-wide">Your unbiased car advisor</p>
        </div>

        {/* Password entry */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 sm:p-8 space-y-5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Beta Access</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 bg-background text-center text-base rounded-xl border-border/50 focus:border-secondary/40"
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full h-14 text-base rounded-xl font-semibold" disabled={isLoading || !password}>
              {isLoading ? 'Verifying...' : 'Log in'}
            </Button>
          </form>
        </div>

        <Separator />

        {/* Waitlist signup */}
        <div className="rounded-2xl border border-secondary/20 bg-secondary/[0.03] p-6 sm:p-8">
          <WaitlistForm />
        </div>

        <Separator />

        {/* Dealer CTA */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 sm:p-8 space-y-3 text-center">
          <p className="text-base text-foreground font-semibold">Are you a car dealer?</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Want to be listed on FindCar when we launch? Get in touch and we'll tell you more.
          </p>
          <a
            href="mailto:info@findcar.se?subject=Car dealer inquiry"
            className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors bg-secondary/[0.06] hover:bg-secondary/[0.12] px-5 py-3 rounded-xl border border-secondary/20"
          >
            <Mail className="h-4 w-4" />
            info@findcar.se
          </a>
        </div>
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
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-2 text-center py-2">
        <CheckCircle className="h-6 w-6 text-primary mx-auto" />
        <p className="text-sm font-medium text-foreground">Thanks! You're on the list.</p>
        <p className="text-xs text-muted-foreground">We'll reach out when it's time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 text-center">
        <p className="text-base text-foreground font-semibold">Get early access</p>
        <p className="text-sm text-muted-foreground">
          Sign up and we'll notify you when FindCar launches.
        </p>
      </div>
      <form onSubmit={handleWaitlist} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-14 bg-background text-base rounded-xl border-border/50 focus:border-secondary/40"
            required
          />
        </div>
        <Button type="submit" className="h-14 px-6 rounded-xl text-base font-semibold" disabled={isSubmitting || !email}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? '...' : 'Send'}
        </Button>
      </form>
      {waitlistError && <p className="text-destructive text-sm">{waitlistError}</p>}
    </div>
  );
};
