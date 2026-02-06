import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';
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
      </div>
    </div>
  );
};
