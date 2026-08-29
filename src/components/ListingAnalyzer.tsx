import { useState } from 'react';
import { ScanSearch, CheckCircle2, AlertTriangle, AlertCircle, Loader2, ArrowRight, Sparkles, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal } from './ScrollReveal';

type Verdict = 'bra' | 'ok' | 'varning';
type Section = { status: Verdict; text: string };
type Result = {
  pris: Section;
  rykte: Section;
  annonskvalitet: Section;
  agandekostnad: Section;
  summering: string;
  score?: number;
  score_label?: string;
  liknande_modeller?: string[];
  bil?: { make?: string; model?: string; year?: number; mileage_km?: number; price_sek?: number };
};

type CarRow = {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  mileage: number | null;
  image_thumb_url: string | null;
  city: string | null;
};

type SimMode = 'better' | 'class';

const verdictStyles: Record<Verdict, { dot: string; label: string }> = {
  bra: { dot: 'bg-emerald-500', label: 'Bra' },
  ok: { dot: 'bg-amber-500', label: 'OK' },
  varning: { dot: 'bg-rose-500', label: 'Kolla' },
};

const VerdictIcon = ({ v }: { v: Verdict }) => {
  if (v === 'bra') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (v === 'ok') return <AlertCircle className="h-4 w-4 text-amber-500" />;
  return <AlertTriangle className="h-4 w-4 text-rose-500" />;
};

type SectionKey = 'pris' | 'rykte' | 'annonskvalitet' | 'agandekostnad';
const rows: Array<{ key: SectionKey; label: string }> = [
  { key: 'pris', label: 'Pris vs marknad' },
  { key: 'rykte', label: 'Modellens rykte' },
  { key: 'annonskvalitet', label: 'Annonsens kvalitet' },
  { key: 'agandekostnad', label: 'Ägandekostnad' },
];

const scoreColor = (s: number) => {
  if (s >= 8) return 'text-emerald-500';
  if (s >= 6) return 'text-amber-500';
  return 'text-rose-500';
};

const scoreRing = (s: number) => {
  if (s >= 8) return 'from-emerald-500/30 to-emerald-500/5 border-emerald-500/40';
  if (s >= 6) return 'from-amber-500/30 to-amber-500/5 border-amber-500/40';
  return 'from-rose-500/30 to-rose-500/5 border-rose-500/40';
};

export const ListingAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simMode, setSimMode] = useState<SimMode | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simCars, setSimCars] = useState<CarRow[]>([]);
  const [simError, setSimError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Klistra in en hel länk som börjar med http eller https.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-listing', {
        body: { url: trimmed },
      });
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        let msg = 'Något gick fel. Försök igen.';
        if (ctx) {
          try {
            const j = await ctx.json();
            if (j?.message) msg = j.message;
          } catch {}
        }
        setError(msg);
      } else if (data?.result) {
        setResult(data.result as Result);
      } else {
        setError('Inget svar från analysen. Försök igen.');
      }
    } catch (err) {
      console.error(err);
      setError('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setUrl('');
    setSimMode(null);
    setSimCars([]);
    setSimError(null);
  };

  const findCars = async (mode: SimMode) => {
    if (!result?.bil) return;
    setSimMode(mode);
    setSimLoading(true);
    setSimError(null);
    setSimCars([]);
    try {
      const { make, model, year, mileage_km, price_sek } = result.bil;
      const models = (result.liknande_modeller ?? []).map((m) => m.trim()).filter(Boolean);

      if (mode === 'class' && models.length === 0) {
        setSimError('Vi hittade inga liknande modeller att jämföra med.');
        setSimLoading(false);
        return;
      }

      // Tabellen blockerar anon-select via RLS — hämta via edge-funktion.
      const { data, error: qErr } = await supabase.functions.invoke('cars-public', {
        body: {
          action: 'alternatives',
          mode,
          make,
          model,
          models,
          year: year ?? null,
          mileage: mileage_km ?? null,
          price: price_sek ?? null,
        },
      });
      if (qErr) throw qErr;
      const cars = ((data?.cars ?? []) as CarRow[]).slice(0, 6);
      setSimCars(cars);
      if (cars.length === 0) setSimError('Inga matchande bilar i vår databas just nu.');
    } catch (e) {
      console.error(e);
      setSimError('Kunde inte hämta bilar just nu.');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <section className="px-5 md:px-8 pt-2 pb-12 md:pb-16">
      <ScrollReveal className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/40 to-card/80 backdrop-blur-sm p-5 md:p-6 shadow-[0_2px_20px_-12px_hsl(var(--foreground)/0.15)]">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ScanSearch className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg md:text-xl leading-tight text-foreground">
                Hittat en annons någon annanstans?
              </h2>
              <p className="text-[13px] md:text-sm text-muted-foreground mt-1 leading-relaxed">
                Klistra in länken — Clutch går igenom priset, modellen och annonsen åt dig.
              </p>
            </div>
          </div>

          {!result && (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Klistra in länk till annonsen"
                maxLength={1000}
                disabled={loading}
                className="flex-1 rounded-xl border border-border/50 bg-background/70 px-4 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground px-5 py-2.5 text-[14px] font-medium shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.5)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyserar…
                  </>
                ) : (
                  <>
                    Analysera
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {error && !loading && (
            <p className="mt-3 text-[13px] text-rose-500">{error}</p>
          )}

          {!result && !loading && !error && (
            <p className="mt-3 text-[12px] text-muted-foreground/80">
              Tar några sekunder. Tre analyser per dag, helt gratis.
            </p>
          )}

          {loading && (
            <div className="mt-5 space-y-2.5">
              {rows.map((r) => (
                <div key={r.key} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          )}

          {result && (
            <div className="mt-5">
              {(result.bil?.make || typeof result.score === 'number') && (
                <div className={`mb-4 flex items-center gap-4 rounded-xl border bg-gradient-to-br p-4 ${typeof result.score === 'number' ? scoreRing(result.score) : 'from-card to-card border-border/40'}`}>
                  {typeof result.score === 'number' && (
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <div className={`font-serif text-3xl md:text-4xl leading-none ${scoreColor(result.score)}`}>
                        {result.score.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">/ 10</div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {result.bil?.make && (
                      <div className="text-[13px] font-medium text-foreground truncate">
                        {[result.bil.make, result.bil.model, result.bil.year].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    {result.score_label && (
                      <div className="text-[12px] text-muted-foreground mt-0.5">{result.score_label}</div>
                    )}
                  </div>
                </div>
              )}
              <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden">
                {rows.map((r) => {
                  const section = result[r.key];
                  const style = verdictStyles[section.status];
                  return (
                    <div key={r.key} className="flex items-start gap-3 p-3.5 bg-background/40">
                      <div className="shrink-0 mt-0.5">
                        <VerdictIcon v={section.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-foreground">{r.label}</span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{section.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-[13px] text-foreground leading-relaxed">
                  <span className="font-medium">Sammanfattning: </span>
                  {result.summering}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => findCars('better')}
                  disabled={simLoading}
                  className={`group rounded-xl border px-3.5 py-2.5 text-left transition-colors ${simMode === 'better' ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12.5px] font-medium text-foreground">Hitta samma modell – bättre deal</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Lägre pris eller mil i vår databas</p>
                </button>
                <button
                  type="button"
                  onClick={() => findCars('class')}
                  disabled={simLoading}
                  className={`group rounded-xl border px-3.5 py-2.5 text-left transition-colors ${simMode === 'class' ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12.5px] font-medium text-foreground">Liknande bilar i samma klass</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Konkurrenter från samma segment</p>
                </button>
              </div>

              {simMode && (
                <div className="mt-3">
                  {simLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[4/3] rounded-lg bg-muted/40 animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!simLoading && simError && (
                    <p className="text-[12px] text-muted-foreground">{simError}</p>
                  )}
                  {!simLoading && simCars.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {simCars.map((c) => (
                        <Link
                          key={c.id}
                          to={`/bil/${c.id}`}
                          className="group rounded-lg overflow-hidden border border-border/40 bg-background/40 hover:border-primary/40 transition-colors"
                        >
                          {c.image_thumb_url && (
                            <div className="aspect-[4/3] bg-muted/40 overflow-hidden">
                              <img
                                src={c.image_thumb_url}
                                alt={`${c.make ?? ''} ${c.model ?? ''}`.trim()}
                                loading="lazy"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-2">
                            <div className="text-[11.5px] font-medium text-foreground truncate">
                              {[c.make, c.model].filter(Boolean).join(' ')}
                            </div>
                            <div className="text-[10.5px] text-muted-foreground mt-0.5 flex justify-between">
                              <span>{c.year ?? ''} · {c.mileage ? `${Math.round(c.mileage / 1000)}k km` : ''}</span>
                              <span className="font-medium text-foreground">
                                {c.price ? `${c.price.toLocaleString('sv-SE')} kr` : ''}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={reset}
                className="mt-3 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Analysera en annan annons →
              </button>
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
};