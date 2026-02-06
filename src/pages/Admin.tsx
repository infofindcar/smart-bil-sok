import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BarChart3, Car, Image, MapPin } from 'lucide-react';

const Admin = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withImages: 0, cities: 0, makes: 0 });

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
    const { data } = await supabase.from('cars').select('id, image_thumb_url, city, make');
    if (data) {
      setStats({
        total: data.length,
        withImages: data.filter((c) => c.image_thumb_url).length,
        cities: new Set(data.map((c) => c.city)).size,
        makes: new Set(data.map((c) => c.make)).size,
      });
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
          <p className="text-sm text-muted-foreground text-center">
            Synkronisering och avancerade funktioner kommer snart.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
