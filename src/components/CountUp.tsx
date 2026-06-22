import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
  suffix?: string;
  prefix?: string;
}

/**
 * Animates a number from 0 → end when scrolled into view.
 * Uses easeOutCubic for a premium "settle" feel. Animates once.
 */
export const CountUp = ({
  end,
  duration = 1400,
  className = '',
  format,
  suffix = '',
  prefix = '',
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          let raf = 0;
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(end * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          observer.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const display = format ? format(value) : value.toString();
  return <span ref={ref} className={`tabular-nums ${className}`}>{prefix}{display}{suffix}</span>;
};