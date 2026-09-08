import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useReviewSummary } from '@/hooks/useReviewSummary';
import { modelKeyCandidates } from '@/lib/reviewMatch';
import { StarRating } from './StarRating';
import { ReviewCard } from './ReviewCard';
import type { CarReview } from './types';

const REVIEW_COLUMNS =
  'id,user_id,make,model,model_normalized,year,rating,title,body,pros,cons,ownership_months,mileage_km,status,created_at';

/** Visar vad bilägare tycker om just den här modellen. */
export const ModelReviews = ({ make, model }: { make?: string | null; model?: string | null }) => {
  const summary = useReviewSummary(make, model);
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<CarReview[] | null>(null);

  useEffect(() => {
    if (!open || reviews) return;
    let cancelled = false;
    (async () => {
      const keys = modelKeyCandidates(make, model);
      const { data } = await supabase
        .from('car_reviews')
        .select(REVIEW_COLUMNS)
        .eq('status', 'approved')
        .in('model_normalized', keys)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      const rows = (data ?? []) as CarReview[];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      let names: Record<string, string | null> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id,display_name').in('id', ids);
        names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
      }
      setReviews(rows.map((r) => ({ ...r, author: names[r.user_id] ?? null })));
    })();
    return () => { cancelled = true; };
  }, [open, reviews, make, model]);

  const label = `${make ?? ''} ${model ?? ''}`.trim();

  return (
    <section className="bg-card border border-border rounded-2xl p-5">
      <h2 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        Vad ägare tycker
      </h2>
      {summary && summary.count > 0 ? (
        <>
          <div className="flex items-center gap-3 mt-3">
            <StarRating value={summary.average} />
            <span className="text-sm text-muted-foreground">
              {summary.average} av 5 · {summary.count} {summary.count === 1 ? 'omdöme' : 'omdömen'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Läs vad folk skrivit om {label}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground mt-3">
          Ingen har skrivit om {label} än.{' '}
          <Link to="/community" className="text-primary hover:underline">Dela din erfarenhet</Link>
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Omdömen om {label}</DialogTitle>
          </DialogHeader>
          {reviews === null ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Hämtar omdömen...
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Inga omdömen ännu.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} showCar={false} />)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
