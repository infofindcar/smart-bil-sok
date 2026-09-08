import { Star } from 'lucide-react';

export const StarRating = ({
  value,
  size = 'md',
  onChange,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (v: number) => void;
}) => {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-7 w-7' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Betyg">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n - 0.5;
        const star = (
          <Star
            className={`${px} ${filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} av 5 stjärnor`}
            aria-checked={value === n}
            role="radio"
            className="p-0.5 hover:scale-110 transition-transform"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
};
