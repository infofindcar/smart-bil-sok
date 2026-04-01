import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BarChart3, Car, Image, MapPin, Sparkles, Loader2, Square, CheckCircle, AlertCircle, Palette, Cog, RefreshCw, Clock } from 'lucide-react';

const Admin = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withImages: 0, cities: 0, makes: 0, drivetrainEnriched: 0, colorEnriched: 0, bodyTypeEnriched: 0, horsepowerEnriched: 0, needsEnrichment: 0, newFromLastImport: 0, lastImportTime: '' });
  const [storedPassword, setStoredPassword] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enrich state
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichLog, setEnrichLog] = useState<string[]>([]);
  const [enrichProgress, setEnrichProgress] = useState<{ processed: number; total: number } | null>(null);
  const stopRef = useRef(false);

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
    const [
      totalRes,
      withImagesRes,
      drivetrainRes,
      colorRes,
      bodyTypeRes,
      horsepowerRes,
      needsEnrichmentRes,
      citiesData,
      makesData,
      latestCarRes,
    ] = await Promise.all([
      supabase.from('Lovable').select('*', { count: 'exact', head: true }),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).not('image_thumb_url', 'is', null),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).not('drivetrain', 'is', null).not('drivetrain', 'eq', 'Unknown').not('drivetrain', 'eq', 'Okänd'),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).not('color', 'is', null).not('color', 'eq', 'Unknown').not('color', 'eq', 'Okänd'),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).not('body_type', 'is', null).not('body_type', 'eq', 'Unknown').not('body_type', 'eq', 'Okänd'),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).not('horsepower', 'is', null).gt('horsepower', 0),
      supabase.from('Lovable').select('*', { count: 'exact', head: true }).or('drivetrain.is.null,drivetrain.eq.Unknown,color.is.null,color.eq.Unknown,body_type.is.null,body_type.eq.Unknown,horsepower.is.null,horsepower.eq.0'),
      supabase.from('Lovable').select('city'),
      supabase.from('Lovable').select('make'),
      supabase.from('Lovable').select('created_at').order('created_at', { ascending: false }).limit(1),
    ]);

    const total = totalRes.count ?? 0;
    const cities = new Set((citiesData.data ?? []).map((c: any) => c.city)).size;
    const makes = new Set((makesData.data ?? []).map((c: any) => c.make)).size;

    // Find cars added in the latest import batch (same created_at minute)
    let newFromLastImport = 0;
    let lastImportTime = '';
    if (latestCarRes.data && latestCarRes.data.length > 0) {
      const latestTime = new Date(latestCarRes.data[0].created_at!);
      // Consider cars within 2 hours of the latest as same import batch
      const cutoff = new Date(latestTime.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const newCarsRes = await supabase.from('Lovable').select('*', { count: 'exact', head: true }).gte('created_at', cutoff);
      newFromLastImport = newCarsRes.count ?? 0;
      lastImportTime = latestTime.toLocaleString('sv-SE');
    }

    setStats({
      total,
      withImages: withImagesRes.count ?? 0,
      cities,
      makes,
      drivetrainEnriched: drivetrainRes.count ?? 0,
      colorEnriched: colorRes.count ?? 0,
      bodyTypeEnriched: bodyTypeRes.count ?? 0,
      horsepowerEnriched: horsepowerRes.count ?? 0,
      needsEnrichment: needsEnrichmentRes.count ?? 0,
      newFromLastImport,
      lastImportTime,
    });
  };

  const addLog = useCallback((msg: string) => {
    setEnrichLog((prev) => [...prev, `${new Date().toLocaleTimeString('sv-SE')} — ${msg}`]);
  }, []);

  const handleEnrich = async () => {
    setIsEnriching(true);
    stopRef.current = false;
    setEnrichLog([]);
    setEnrichProgress(null);

    let totalProcessed = 0;
    let totalBodyType = 0;
    let totalDrivetrain = 0;
    let totalColor = 0;
    let totalHorsepower = 0;
    let totalErrors = 0;
    let firstRun = true;

    addLog('Startar berikning...');

    while (!stopRef.current) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('enrich-car-data', {
          body: { password: storedPassword },
        });

        if (fnError) throw fnError;
        if (!data?.success) {
          addLog(`Fel: ${data?.error || 'Okänt fel'}`);
          break;
        }

        const { processed, remaining, drivetrainUpdated, colorUpdated, bodyTypeUpdated, horsepowerUpdated, errors } = data;
        totalProcessed += processed;
        totalDrivetrain += drivetrainUpdated || 0;
        totalColor += colorUpdated || 0;
        totalBodyType += bodyTypeUpdated || 0;
        totalHorsepower += horsepowerUpdated || 0;
        totalErrors += errors || 0;

        if (firstRun) {
          const total = processed + remaining;
          setEnrichProgress({ processed: totalProcessed, total });
          firstRun = false;
        } else {
          setEnrichProgress((prev) => prev ? { ...prev, processed: prev.total - remaining } : null);
        }

        addLog(`✓ ${processed} bilar berikade (drivetrain: ${drivetrainUpdated || 0}, färg: ${colorUpdated || 0}, karosstyp: ${bodyTypeUpdated || 0}, HP: ${horsepowerUpdated || 0}). ${remaining} kvar.`);

        if (remaining === 0) {
          addLog(`🎉 Klart! Totalt: ${totalProcessed} bilar. Drivetrain: ${totalDrivetrain}, Färg: ${totalColor}, Karosstyp: ${totalBodyType}, HP: ${totalHorsepower}, Fel: ${totalErrors}`);
          break;
        }
      } catch (e) {
        addLog(`Fel: ${e instanceof Error ? e.message : 'Okänt fel'}`);
        break;
      }
    }

    if (stopRef.current) {
      addLog(`⏹ Stoppad manuellt efter ${totalProcessed} bilar.`);
    }

    setIsEnriching(false);
    fetchStats();
  };

  const handleStop = () => {
    stopRef.current = true;
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
    { icon: Clock, value: stats.newFromLastImport, label: `Nya (senaste import)`, subtitle: stats.lastImportTime || undefined },
    { icon: Image, value: stats.withImages, label: 'Med bilder' },
    { icon: BarChart3, value: stats.makes, label: 'Märken' },
    { icon: MapPin, value: stats.cities, label: 'Städer' },
  ];

  const enrichCards = [
    { icon: Cog, value: `${stats.drivetrainEnriched}/${stats.total}`, label: 'Drivetrain berikad' },
    { icon: Palette, value: `${stats.colorEnriched}/${stats.total}`, label: 'Färg berikad' },
    { icon: Car, value: `${stats.bodyTypeEnriched}/${stats.total}`, label: 'Karosstyp berikad' },
    { icon: Sparkles, value: `${stats.horsepowerEnriched}/${stats.total}`, label: 'HP berikad' },
    { icon: stats.needsEnrichment > 0 ? AlertCircle : CheckCircle, value: stats.needsEnrichment, label: 'Behöver berikas', highlight: stats.needsEnrichment > 0 },
  ];

  const progressPercent = enrichProgress
    ? Math.round((enrichProgress.processed / enrichProgress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);
                await fetchStats();
                setIsRefreshing(false);
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="bg-card rounded-xl p-4 border border-border text-center">
                <s.icon className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {enrichCards.map((s) => (
              <div key={s.label} className={`bg-card rounded-xl p-4 border text-center ${(s as any).highlight ? 'border-destructive' : 'border-border'}`}>
                <s.icon className={`h-6 w-6 mx-auto mb-2 ${(s as any).highlight ? 'text-destructive' : 'text-primary'}`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-6 border border-border mb-8 space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Berika bildata med AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kör i omgångar om 25 bilar. Drivetrain härleds från modellnamn, färg identifieras från bilder.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEnrich} disabled={isEnriching} className="gap-2">
                {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isEnriching ? 'Berikar...' : 'Kör berikning'}
              </Button>
              {isEnriching && (
                <Button onClick={handleStop} variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stoppa
                </Button>
              )}
            </div>

            {enrichProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{enrichProgress.processed} av {enrichProgress.total} bilar</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
            )}

            {enrichLog.length > 0 && (
              <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                {enrichLog.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{line}</p>
                ))}
              </div>
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
