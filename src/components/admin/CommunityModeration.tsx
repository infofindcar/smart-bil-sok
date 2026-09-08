import { useCallback, useEffect, useState } from 'react';
import { Check, X, Loader2, EyeOff, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Row = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  rating: number;
  title: string | null;
  body: string;
  pros: string[];
  cons: string[];
  ownership_months: number | null;
  mileage_km: number | null;
  status: string;
  created_at: string;
  email: string | null;
};

const TABS: { key: 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { key: 'pending', label: 'Väntar' },
  { key: 'approved', label: 'Publicerade' },
  { key: 'rejected', label: 'Nekade' },
];

const fmt = (iso: string) => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

export const CommunityModeration = ({ password }: { password: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('community-moderate', {
      body: { password, action: 'list' },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error('Kunde inte hämta inläggen.');
      return;
    }
    setRows(((data as any)?.reviews ?? []) as Row[]);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    setBusyId(id);
    const { data, error } = await supabase.functions.invoke('community-moderate', {
      body: { password, action: 'set_status', id, status },
    });
    setBusyId(null);
    if (error || (data as any)?.error) return toast.error('Kunde inte spara.');
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === 'approved' ? 'Publicerat' : status === 'rejected' ? 'Nekat' : 'Tillbaka till granskning');
  };

  const visible = rows.filter((r) => r.status === tab);
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <section className="bg-card rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Community — inlägg om bilar{pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal">
              {pendingCount} väntar
            </span>
          )}
        </h2>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'outline'} onClick={() => setTab(t.key)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Hämtar inlägg...
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Inget här just nu.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((r) => (
            <li key={r.id} className="border border-border rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.make} {r.model}{r.year ? ` ${r.year}` : ''}</span>
                <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating}/5
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {r.email || 'okänd e-post'} · {fmt(r.created_at)}
                {r.ownership_months ? ` · ägt ${r.ownership_months} mån` : ''}
                {r.mileage_km ? ` · ${r.mileage_km} mil` : ''}
              </p>
              {r.title && <p className="font-medium mt-2">{r.title}</p>}
              <p className="text-sm mt-1 whitespace-pre-wrap">{r.body}</p>
              {(r.pros?.length || r.cons?.length) ? (
                <p className="text-xs text-muted-foreground mt-2">
                  {r.pros?.length ? `+ ${r.pros.join(', ')}` : ''}
                  {r.pros?.length && r.cons?.length ? ' · ' : ''}
                  {r.cons?.length ? `− ${r.cons.join(', ')}` : ''}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 mt-3">
                {r.status !== 'approved' && (
                  <Button size="sm" className="gap-1" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'approved')}>
                    <Check className="h-3.5 w-3.5" /> Godkänn
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button size="sm" variant="destructive" className="gap-1" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'rejected')}>
                    <X className="h-3.5 w-3.5" /> Neka
                  </Button>
                )}
                {r.status === 'approved' && (
                  <Button size="sm" variant="outline" className="gap-1" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'pending')}>
                    <EyeOff className="h-3.5 w-3.5" /> Avpublicera
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
