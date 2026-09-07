import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  Lock, Car, Users, Search, TrendingUp, RefreshCw, MapPin, BarChart3,
  Smartphone, Monitor, MessageSquare, Loader2, AlertTriangle, Link2,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type Entry = { label: string; count: number };

type Stats = {
  cars: {
    total: number; makes: number; cities: number; new_24h: number;
    last_import: string | null; last_created: string | null;
    with_gallery: number; with_image: number; missing_info: number; partner_cars: number;
  } | null;
  traffic: {
    visitors_today: number; visitors_7d: number; visitors_30d: number;
    pageviews_today: number; pageviews_7d: number;
    daily: { day: string; visitors: number; pageviews: number }[];
    top_pages: { page: string; views: number }[];
    devices: { device: string; views: number }[];
    referrers: { source: string; views: number }[];
    searches_today: number; searches_7d: number;
    searches_daily: { day: string; searches: number }[];
    no_results_7d: number; results_7d: number; car_views_7d: number; shares_30d: number;
  } | null;
  searchPreferences: { budget: Entry[]; makes: Entry[]; bodies: Entry[]; fuels: Entry[]; sampled: number };
  leads: {
    last7: number;
    recent: { id: string; car_id: number | null; customer_name: string; customer_email: string; customer_phone: string | null; dealer_name: string | null; status: string | null; created_at: string }[];
  };
  feedback: { id: string; message: string; email: string | null; page_path: string | null; status: string; created_at: string }[];
  listingAnalyses30d: number;
  generatedAt: string;
};

const nf = new Intl.NumberFormat('sv-SE');
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) : '–';
const fmtDay = (day: string) => day.slice(5).replace('-', '/');

const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={`bg-card rounded-2xl border border-border p-5 ${className}`}>
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">{title}</h2>
    {children}
  </section>
);

const Kpi = ({ icon: Icon, value, label, sub }: { icon: any; value: string | number; label: string; sub?: string }) => (
  <div className="bg-card rounded-2xl border border-border p-4">
    <Icon className="h-5 w-5 text-primary mb-2" />
    <p className="text-2xl font-bold leading-tight">{typeof value === 'number' ? nf.format(value) : value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
    {sub && <p className="text-[11px] text-muted-foreground/80 mt-1">{sub}</p>}
  </div>
);

const BarList = ({ items, empty }: { items: { label: string; count: number }[]; empty?: string }) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty ?? 'Ingen data än.'}</p>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="truncate pr-3">{i.label}</span>
            <span className="text-muted-foreground shrink-0">{nf.format(i.count)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const Admin = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = useCallback(async (pwd: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('admin-stats', { body: { password: pwd } });
    if (fnError || (data as any)?.error) {
      setError('Kunde inte hämta statistiken. Prova igen.');
      return;
    }
    setStats(data as Stats);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin-password', { body: { password } });
      if (fnError) throw fnError;
      if (data?.success) {
        setIsAuthed(true);
        setStoredPassword(password);
        await fetchStats(password);
      } else {
        setError('Fel lösenord');
      }
    } catch {
      setError('Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SEO title="Admin | FindCar" description="Intern administration." path="/admin" noindex />
        <div className="w-full max-w-sm text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">FindCar Dashboard</p>
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

  const t = stats?.traffic;
  const c = stats?.cars;
  const chartData = (t?.daily ?? []).map((d) => ({
    day: fmtDay(d.day),
    besökare: d.visitors,
    sidvisningar: d.pageviews,
    sökningar: (t?.searches_daily ?? []).find((s) => s.day === d.day)?.searches ?? 0,
  }));

  const noResultShare = t && t.searches_7d > 0 ? Math.round((t.no_results_7d / t.searches_7d) * 100) : 0;
  const galleryShare = c && c.total > 0 ? Math.round((c.with_gallery / c.total) * 100) : 0;
  const missingShare = c && c.total > 0 ? Math.round((c.missing_info / c.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin | FindCar" description="Intern administration." path="/admin" noindex />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Översikt</h1>
              <p className="text-sm text-muted-foreground">
                Uppdaterad {fmtDate(stats?.generatedAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);
                await fetchStats(storedPassword);
                setIsRefreshing(false);
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>

          {!stats ? (
            <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Hämtar siffror...
            </div>
          ) : (
            <>
              {/* 1. Dagens siffror */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Kpi icon={Users} value={t?.visitors_today ?? 0} label="Besökare idag" sub={`${nf.format(t?.pageviews_today ?? 0)} sidvisningar`} />
                <Kpi icon={TrendingUp} value={t?.visitors_7d ?? 0} label="Besökare 7 dagar" sub={`${nf.format(t?.visitors_30d ?? 0)} senaste 30 dagarna`} />
                <Kpi icon={Search} value={t?.searches_today ?? 0} label="Sökningar idag" sub={`${nf.format(t?.searches_7d ?? 0)} senaste 7 dagarna`} />
                <Kpi icon={Car} value={c?.total ?? 0} label="Aktiva bilar" sub={`${nf.format(c?.new_24h ?? 0)} nya senaste dygnet`} />
              </div>

              {/* 2. Trafik */}
              <Card title="Besökare senaste 30 dagarna">
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Mätningen är precis igång — kurvan fylls på från och med idag.
                  </p>
                ) : (
                  <div className="h-64 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="besökare" stroke="hsl(var(--primary))" fill="url(#visGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="sökningar" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                <Card title="Mest besökta sidor">
                  <BarList items={(t?.top_pages ?? []).map((p) => ({ label: p.page, count: p.views }))} />
                </Card>
                <Card title="Mobil eller dator">
                  <BarList items={(t?.devices ?? []).map((d) => ({ label: d.device, count: d.views }))} />
                  <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> mobil</span>
                    <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> dator</span>
                  </div>
                </Card>
                <Card title="Varifrån besökarna kom">
                  <BarList items={(t?.referrers ?? []).map((r) => ({ label: r.source, count: r.views }))} />
                </Card>
              </div>

              {/* 3. Sökningar */}
              <Card title="Sökningar med Clutch">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-2xl font-bold">{nf.format(t?.searches_7d ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">Sökningar 7 dagar</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${noResultShare > 25 ? 'text-destructive' : ''}`}>{noResultShare}%</p>
                    <p className="text-xs text-muted-foreground">Utan träff (7 dagar)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nf.format(t?.car_views_7d ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">Bilar öppnade (7 dagar)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nf.format(stats.listingAnalyses30d)}</p>
                    <p className="text-xs text-muted-foreground">Annonsanalyser (30 dagar)</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium mb-2">Budget</p>
                    <BarList items={stats.searchPreferences.budget} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Märken</p>
                    <BarList items={stats.searchPreferences.makes} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Biltyper</p>
                    <BarList items={stats.searchPreferences.bodies} />
                  </div>
                </div>
              </Card>

              {/* 4. Kunder */}
              <div className="grid md:grid-cols-2 gap-4">


                <Card title="Kontaktförfrågningar">
                  <p className="text-2xl font-bold mb-4">
                    {nf.format(stats.leads.last7)} <span className="text-xs font-normal text-muted-foreground">senaste 7 dagarna</span>
                  </p>
                  <ul className="divide-y divide-border">
                    {stats.leads.recent.map((l) => (
                      <li key={l.id} className="py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{l.customer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{l.customer_email}{l.customer_phone ? ` · ${l.customer_phone}` : ''}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Link2 className="h-3 w-3" /> Bil {l.car_id ?? '–'}{l.dealer_name ? ` · ${l.dealer_name}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] text-muted-foreground">{fmtDate(l.created_at)}</span>
                            <p className="text-[11px] text-muted-foreground">{l.status ?? '–'}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                    {stats.leads.recent.length === 0 && <li className="py-2 text-sm text-muted-foreground">Inga förfrågningar än.</li>}
                  </ul>
                </Card>
              </div>

              <Card title="Förbättringsförslag från besökare">
                <ul className="divide-y divide-border">
                  {stats.feedback.map((f) => (
                    <li key={f.id} className="py-3 text-sm">
                      <p className="whitespace-pre-wrap">{f.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        {f.email || 'anonym'} · {f.page_path || '–'} · {fmtDate(f.created_at)}
                      </p>
                    </li>
                  ))}
                  {stats.feedback.length === 0 && <li className="py-2 text-sm text-muted-foreground">Inga förslag än.</li>}
                </ul>
              </Card>

              {/* 5. Bilbeståndet */}
              <Card title="Bilbeståndet">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{nf.format(c?.total ?? 0)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> aktiva bilar</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nf.format(c?.makes ?? 0)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> märken</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nf.format(c?.cities ?? 0)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> städer</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nf.format(c?.partner_cars ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">bilar från avtalspartner</p>
                  </div>
                </div>
                <div className="mt-5 space-y-1.5 text-sm">
                  <p className="text-muted-foreground">
                    Senaste import: <span className="text-foreground">{fmtDate(c?.last_import)}</span> · nyaste bil upplagd {fmtDate(c?.last_created)}
                  </p>
                  <p className={galleryShare >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {galleryShare}% av bilarna har ett bildgalleri ({nf.format(c?.with_gallery ?? 0)} bilar) · {nf.format(c?.with_image ?? 0)} har minst en bild
                  </p>
                  <p className={missingShare > 20 ? 'text-amber-600 dark:text-amber-400 flex items-center gap-1' : 'text-muted-foreground flex items-center gap-1'}>
                    {missingShare > 20 && <AlertTriangle className="h-3.5 w-3.5" />}
                    {nf.format(c?.missing_info ?? 0)} bilar saknar någon uppgift ({missingShare}%)
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
