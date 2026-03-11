import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BarChart3, Car, Image, MapPin, Sparkles, Loader2 } from 'lucide-react';

const Admin = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withImages: 0, cities: 0, makes: 0 });
  const [enrichStatus, setEnrichStatus] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [storedPassword, setStoredPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin-password', {
        body: { password },
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setIsAuthed(true);
        setStoredPassword(password);
        fetchStats();
      } else {
        setError('Fel lösenord');
      }
    } catch {
      setError('Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data } = await supabase.from('Lovable').select('id, image_thumb_url, city, make');
    if (data) {
      setStats({
        total: data.length,
        withImages: data.filter((c) => c.image_thumb_url).length,
        cities: new Set(data.map((c) => c.city)).size,
        makes: new Set(data.map((c) => c.make)).size,
      });
    }
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    setEnrichStatus('Berikar bildata med AI...');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('enrich-car-data', {
        body: { password: storedPassword },
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setEnrichStatus(data.message);
      } else {
        setEnrichStatus(`Fel: ${data?.error || 'Okänt fel'}`);
      }
    } catch {
      setEnrichStatus('Något gick fel vid berikningn.');
    } finally {
      setIsEnriching(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">Find Car Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Admin-lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifierar...' : 'Logga in'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Car, value: stats.total, label: 'Totala bilar' },
    { icon: Image, value: stats.withImages, label: 'Med bilder' },
    { icon: BarChart3, value: stats.makes, label: 'Märken' },
    { icon: MapPin, value: stats.cities, label: 'Städer' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="bg-card rounded-xl p-4 border border-border text-center">
                <s.icon className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Enrich car data */}
          <div className="bg-card rounded-xl p-6 border border-border mb-8 space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Berika bildata med AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Använder Gemini för att härleda drivetrain från model_raw och identifiera färg från bilbilder. 
                AI-härledda värden sparas med citattecken.
              </p>
            </div>
            <Button onClick={handleEnrich} disabled={isEnriching} className="gap-2">
              {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isEnriching ? 'Berikar...' : 'Kör berikningn'}
            </Button>
            {enrichStatus && (
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{enrichStatus}</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Synkronisering och avancerade funktioner kommer snart.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
