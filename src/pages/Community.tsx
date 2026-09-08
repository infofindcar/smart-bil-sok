import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, Search, Loader2, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReviewCard } from '@/components/community/ReviewCard';
import { ReviewForm } from '@/components/community/ReviewForm';
import { StarRating } from '@/components/community/StarRating';
import type { CarReview } from '@/components/community/types';

const REVIEW_COLUMNS =
  'id,user_id,make,model,model_normalized,year,rating,title,body,pros,cons,ownership_months,mileage_km,status,created_at';

const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<CarReview[]>([]);
  const [mine, setMine] = useState<CarReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'new' | 'top'>('new');
  const [writing, setWriting] = useState(false);

  const attachAuthors = useCallback(async (rows: CarReview[]) => {
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length === 0) return rows;
    const { data } = await supabase.from('profiles').select('id,display_name').in('id', ids);
    const names = Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name]));
    return rows.map((r) => ({ ...r, author: names[r.user_id] ?? null }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('car_reviews')
      .select(REVIEW_COLUMNS)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(200);
    setReviews(await attachAuthors((data ?? []) as CarReview[]));
    setLoading(false);
  }, [attachAuthors]);

  const loadMine = useCallback(async () => {
    if (!user) return setMine([]);
    const { data } = await supabase
      .from('car_reviews')
      .select(REVIEW_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMine((data ?? []) as CarReview[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMine(); }, [loadMine]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? reviews.filter((r) => `${r.make} ${r.model}`.toLowerCase().includes(q))
      : reviews;
    return sort === 'top' ? [...list].sort((a, b) => b.rating - a.rating) : list;
  }, [reviews, query, sort]);

  const totals = useMemo(() => {
    if (reviews.length === 0) return null;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return { count: reviews.length, avg: Math.round(avg * 10) / 10 };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Community — bilägare berättar | FindCar"
        description="Läs vad riktiga bilägare tycker om sina bilar: betyg, plus, minus, ägandetid och miltal. Dela dina egna erfarenheter."
        path="/community"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FindCar Community',
          description: 'Omdömen från bilägare om bilmodeller.',
          url: 'https://findcar.se/community',
        }}
      />
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold">Community</h1>
            <p className="text-muted-foreground">
              Riktiga bilägare berättar hur bilen faktiskt varit att äga. Betygen syns även när du söker bil.
            </p>
            {totals && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <StarRating value={totals.avg} size="sm" />
                <span>{totals.avg} i snitt · {totals.count} inlägg</span>
              </div>
            )}
          </header>

          {!writing ? (
            user ? (
              <Button className="gap-2" onClick={() => setWriting(true)}>
                <MessageSquarePlus className="h-4 w-4" /> Skriv om din bil
              </Button>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Logga in för att skriva om din bil. Att läsa kräver inget konto.
                </p>
                {!authLoading && (
                  <Button asChild size="sm"><Link to="/logga-in">Logga in</Link></Button>
                )}
              </div>
            )
          ) : (
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4">Skriv om din bil</h2>
              <ReviewForm
                onDone={() => {
                  setWriting(false);
                  loadMine();
                }}
              />
            </section>
          )}

          {mine.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dina inlägg</h2>
              {mine.map((r) => (
                <div key={r.id} className="space-y-1">
                  {r.status !== 'approved' && (
                    <p className="text-[11px] flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      {r.status === 'pending' ? 'Väntar på granskning' : 'Nekad — kontakta oss om du har frågor'}
                    </p>
                  )}
                  <ReviewCard review={{ ...r, author: 'Du' }} />
                </div>
              ))}
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Sök märke eller modell"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                <Button variant={sort === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setSort('new')}>Nyast</Button>
                <Button variant={sort === 'top' ? 'default' : 'outline'} size="sm" onClick={() => setSort('top')}>Högst betyg</Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Hämtar inlägg...
              </div>
            ) : visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Inga inlägg än — bli den första att berätta om din bil.
              </p>
            ) : (
              <div className="space-y-4">
                {visible.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Community;
