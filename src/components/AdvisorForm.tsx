import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import type { Car, CarReason } from './GuidedSearch';

type Priority = 'lag_manadskostnad' | 'tryggt' | 'familj' | 'el_hybrid' | 'korglädje' | 'billig_aga';

const BODY_TYPES: { key: string; label: string }[] = [
  { key: 'suv', label: 'SUV' },
  { key: 'kombi', label: 'Kombi' },
  { key: 'sedan', label: 'Sedan' },
  { key: 'halvkombi', label: 'Halvkombi' },
  { key: 'smabil', label: 'Småbil' },
  { key: 'coupe', label: 'Coupé' },
];

const FUELS: { key: string; label: string }[] = [
  { key: 'el', label: 'El' },
  { key: 'laddhybrid', label: 'Laddhybrid' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'bensin', label: 'Bensin' },
  { key: 'diesel', label: 'Diesel' },
];

const MILEAGES = [
  { key: 'low', label: 'Under 100 mil', text: 'kör cirka 50 mil/månad' },
  { key: 'mid', label: '100–300 mil', text: 'kör cirka 200 mil/månad' },
  { key: 'high', label: 'Över 300 mil', text: 'kör mer än 300 mil/månad' },
];

const SEATS = [
  { key: '4-5', label: '4–5 säten', value: 5 },
  { key: '5', label: 'Måste vara 5', value: 5 },
  { key: '7', label: '7 säten', value: 7 },
];

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: 'lag_manadskostnad', label: 'Låg månadskostnad' },
  { key: 'tryggt', label: 'Tryggt köp' },
  { key: 'familj', label: 'Familjevänlig' },
  { key: 'el_hybrid', label: 'Elbil/hybrid' },
  { key: 'korglädje', label: 'Körglädje' },
  { key: 'billig_aga', label: 'Billig att äga' },
];

const fmt = (n: number) => new Intl.NumberFormat('sv-SE').format(n);

interface AdvisorFormProps {
  onResults: (cars: Car[], message: string, carReasons: CarReason[]) => void;
  onScrollToResults?: () => void;
}

export const AdvisorForm = ({ onResults, onScrollToResults }: AdvisorFormProps) => {
  const [budget, setBudget] = useState<[number, number]>([100_000, 300_000]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);
  const [mileage, setMileage] = useState<string>('mid');
  const [seats, setSeats] = useState<string>('4-5');
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = <T extends string>(arr: T[], set: (a: T[]) => void, v: T) => {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const customerProfile = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Budget ${fmt(budget[0])}–${fmt(budget[1])} kr.`);
    if (bodies.length) parts.push(`Biltyp: ${bodies.join(', ')}.`);
    if (fuels.length) parts.push(`Drivmedel: ${fuels.join(', ')}.`);
    const m = MILEAGES.find((x) => x.key === mileage);
    if (m) parts.push(`Kund ${m.text}.`);
    const s = SEATS.find((x) => x.key === seats);
    if (s) parts.push(`Behov: ${s.label.toLowerCase()}.`);
    if (priorities.length) {
      const labels = priorities.map((p) => PRIORITIES.find((x) => x.key === p)?.label).filter(Boolean);
      parts.push(`Prioriterar: ${labels.join(', ')}.`);
    }
    return parts.join(' ');
  }, [budget, bodies, fuels, mileage, seats, priorities]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const filters: Record<string, unknown> = {
        budget: `${budget[0]}-${budget[1]}`,
      };
      if (bodies.length) filters.bodyType = bodies;
      if (fuels.length) filters.fuel = fuels;
      // Map priorities to soft hints
      if (priorities.includes('el_hybrid') && !fuels.length) {
        filters.fuel = ['el', 'laddhybrid', 'hybrid'];
      }

      sessionStorage.setItem('findcar-last-filters', JSON.stringify({ filters, customerProfile }));

      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: { action: 'load_more', filters, excludeIds: [], customerProfile, language: 'sv' },
      });
      if (error) throw error;
      const cars = (data?.cars || []) as Car[];
      if (cars.length === 0) {
        toast.info('Inga bilar matchade — prova att vidga budget eller välja färre kriterier.');
        return;
      }
      onResults(cars, data?.message || 'Här är dina rekommendationer:', data?.carReasons || []);
      setTimeout(() => onScrollToResults?.(), 80);
    } catch (e) {
      console.error(e);
      toast.error('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-[0_12px_40px_-24px_hsl(220_30%_20%/0.25)] overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Bilrådgivaren</p>
          <h2 className="text-lg font-semibold text-foreground mt-1">Berätta vad du behöver</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live data
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-7">
        {/* Budget */}
        <Field label="Budget" hint={`${fmt(budget[0])} – ${fmt(budget[1])} kr`}>
          <div className="pt-3 px-1">
            <Slider
              min={30_000}
              max={800_000}
              step={10_000}
              value={budget}
              onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])}
            />
            <div className="flex justify-between mt-2 text-[11px] text-muted-foreground tabular-nums">
              <span>30 000 kr</span>
              <span>800 000 kr</span>
            </div>
          </div>
        </Field>

        {/* Biltyp */}
        <Field label="Biltyp" hint="Välj en eller flera">
          <ChipGroup options={BODY_TYPES} selected={bodies} onToggle={(v) => toggle(bodies, setBodies, v)} />
        </Field>

        {/* Drivmedel */}
        <Field label="Drivmedel" hint="Välj en eller flera">
          <ChipGroup options={FUELS} selected={fuels} onToggle={(v) => toggle(fuels, setFuels, v)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
          {/* Körning */}
          <Field label="Körning per månad">
            <RadioPills options={MILEAGES.map(({ key, label }) => ({ key, label }))} value={mileage} onChange={setMileage} />
          </Field>
          {/* Säten */}
          <Field label="Antal säten">
            <RadioPills options={SEATS.map(({ key, label }) => ({ key, label }))} value={seats} onChange={setSeats} />
          </Field>
        </div>

        {/* Priorities */}
        <Field label="Vad är viktigast?" hint="Välj de som passar dig">
          <ChipGroup
            options={PRIORITIES.map((p) => ({ key: p.key, label: p.label }))}
            selected={priorities}
            onToggle={(v) => toggle(priorities, setPriorities as (a: string[]) => void, v) as unknown as void}
          />
        </Field>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-8 py-5 border-t border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Vi jämför mot tusentals begagnade bilar och visar de bästa matchningarna.
        </p>
        <Button size="lg" onClick={handleSubmit} disabled={loading} className="rounded-full h-12 px-7 font-semibold">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Söker…</> : 'Visa rekommendationer'}
        </Button>
      </div>
    </div>
  );
};

/* ---------- helpers ---------- */

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <span className="text-xs text-muted-foreground tabular-nums">{hint}</span>}
    </div>
    {children}
  </div>
);

const ChipGroup = ({
  options,
  selected,
  onToggle,
}: {
  options: { key: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const active = selected.includes(o.key);
      return (
        <button
          key={o.key}
          type="button"
          onClick={() => onToggle(o.key)}
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm transition-colors ${
            active
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-foreground/30'
          }`}
        >
          {active && <Check className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      );
    })}
  </div>
);

const RadioPills = ({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-muted/60 border border-border">
    {options.map((o) => (
      <button
        key={o.key}
        type="button"
        onClick={() => onChange(o.key)}
        className={`h-9 px-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
          value === o.key
            ? 'bg-card text-foreground shadow-sm border border-border'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);