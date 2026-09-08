import { ThumbsUp, ThumbsDown, Gauge, CalendarClock } from 'lucide-react';
import { StarRating } from './StarRating';
import type { CarReview } from './types';

const nf = new Intl.NumberFormat('sv-SE');

const ownershipLabel = (months: number | null) => {
  if (!months) return null;
  if (months < 12) return `${months} mån`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} år ${rest} mån` : `${years} år`;
};

export const ReviewCard = ({ review, showCar = true }: { review: CarReview; showCar?: boolean }) => {
  const ownership = ownershipLabel(review.ownership_months);
  return (
    <article className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showCar && (
            <h3 className="font-semibold truncate">
              {review.make} {review.model}
              {review.year ? ` ${review.year}` : ''}
            </h3>
          )}
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {review.author || 'Bilägare'} · {new Date(review.created_at).toLocaleDateString('sv-SE')}
            </span>
          </div>
        </div>
      </div>

      {review.title && <p className="font-medium mt-3">{review.title}</p>}
      <p className="text-sm text-foreground/85 leading-relaxed mt-2 whitespace-pre-wrap">{review.body}</p>

      {(review.pros?.length || review.cons?.length) ? (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {review.pros?.length > 0 && (
            <ul className="space-y-1">
              {review.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          )}
          {review.cons?.length > 0 && (
            <ul className="space-y-1">
              {review.cons.map((c, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <ThumbsDown className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {(ownership || review.mileage_km) && (
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
          {ownership && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" /> Ägt {ownership}
            </span>
          )}
          {review.mileage_km ? (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {nf.format(review.mileage_km)} mil
            </span>
          ) : null}
        </div>
      )}
    </article>
  );
};
