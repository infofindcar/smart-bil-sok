import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { modelKeyCandidates, pickSummary, type ReviewSummary } from '@/lib/reviewMatch';

/**
 * Hämtar community-betyg för en bil. Anrop från många bilkort slås ihop till
 * en enda databasförfrågan per tick, och resultatet cachas i minnet.
 */
const cache = new Map<string, ReviewSummary>();
const known = new Set<string>();
let queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const flush = async () => {
  timer = null;
  const keys = [...queue].filter((k) => !known.has(k));
  queue = new Set();
  if (keys.length === 0) return;
  keys.forEach((k) => known.add(k));

  const { data, error } = await supabase.rpc('car_review_summary', { _keys: keys });
  if (!error) {
    for (const row of data ?? []) {
      cache.set(row.model_normalized, {
        count: Number(row.review_count),
        average: Math.round(Number(row.avg_rating) * 10) / 10,
      });
    }
  }
  listeners.forEach((fn) => fn());
};

const request = (keys: string[]) => {
  const fresh = keys.filter((k) => !known.has(k));
  if (fresh.length === 0) return;
  fresh.forEach((k) => queue.add(k));
  if (!timer) timer = setTimeout(flush, 60);
};

export const useReviewSummary = (make?: string | null, model?: string | null) => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    const keys = modelKeyCandidates(make, model);
    if (keys.length === 0) return;

    const read = () => setSummary(pickSummary(Object.fromEntries(cache), make, model));
    read();
    request(keys);
    listeners.add(read);
    return () => { listeners.delete(read); };
  }, [make, model]);

  return summary;
};
