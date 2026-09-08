import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(8).max(72).safeParse(password);
    if (!parsed.success) return toast.error('Lösenordet måste vara minst 8 tecken');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error('Länken kan ha gått ut. Begär en ny.');
    toast.success('Lösenordet är uppdaterat.');
    navigate('/community', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Nytt lösenord | FindCar" description="Välj ett nytt lösenord." path="/reset-password" noindex />
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-bold mb-6">Välj ett nytt lösenord</h1>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nytt lösenord</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Sparar...' : 'Spara lösenord'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
