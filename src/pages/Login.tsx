import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().trim().email({ message: 'Ange en giltig e-postadress' }).max(255),
  password: z.string().min(8, { message: 'Lösenordet måste vara minst 8 tecken' }).max(72),
  displayName: z.string().trim().min(2, { message: 'Ange ditt namn' }).max(40).optional(),
});

type Mode = 'signin' | 'signup' | 'forgot';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (user) navigate('/community', { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo('');

    if (mode === 'forgot') {
      const parsed = z.string().trim().email().safeParse(email);
      if (!parsed.success) return toast.error('Ange en giltig e-postadress');
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error('Kunde inte skicka länken. Försök igen.');
      setInfo('Vi har skickat en länk till din e-post där du kan välja ett nytt lösenord.');
      return;
    }

    const parsed = schema.safeParse({
      email,
      password,
      displayName: mode === 'signup' ? displayName : undefined,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? 'Kontrollera uppgifterna');
    }

    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin + '/community',
          data: { display_name: parsed.data.displayName },
        },
      });
      setBusy(false);
      if (error) {
        return toast.error(
          error.message.includes('already registered')
            ? 'Det finns redan ett konto med den e-postadressen.'
            : 'Kunde inte skapa kontot. Försök igen.'
        );
      }
      if (!data.session) {
        setInfo('Kontot är skapat! Kolla din e-post och klicka på länken för att bekräfta.');
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) return toast.error('Fel e-post eller lösenord.');
    toast.success('Välkommen tillbaka!');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Logga in | FindCar Community"
        description="Logga in för att dela dina erfarenheter av din bil med andra bilköpare."
        path="/logga-in"
        noindex
      />
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-bold mb-1">
            {mode === 'signup' ? 'Skapa konto' : mode === 'forgot' ? 'Glömt lösenord' : 'Logga in'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === 'forgot'
              ? 'Vi skickar en länk där du kan välja ett nytt lösenord.'
              : 'Behövs bara för att skriva i Community — att läsa är alltid fritt.'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Namn (visas vid dina inlägg)</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={72}
                />
              </div>
            )}
            {info && <p className="text-sm text-primary">{info}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Ett ögonblick...' : mode === 'signup' ? 'Skapa konto' : mode === 'forgot' ? 'Skicka länk' : 'Logga in'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {mode === 'signin' && (
              <>
                <button className="hover:text-primary" onClick={() => setMode('signup')}>Har du inget konto? Skapa ett</button>
                <br />
                <button className="hover:text-primary" onClick={() => setMode('forgot')}>Glömt lösenordet?</button>
              </>
            )}
            {mode !== 'signin' && (
              <button className="hover:text-primary" onClick={() => setMode('signin')}>Tillbaka till inloggning</button>
            )}
            <div>
              <Link to="/community" className="hover:text-primary">Läs vad andra skrivit</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
