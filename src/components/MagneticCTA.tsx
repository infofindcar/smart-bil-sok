import { ReactNode } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';

/** Magnetic hover wrapper — CTA drifts toward pointer on desktop.
 *  No-op on touch or when reduced-motion is enabled. */
export default function MagneticCTA({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useMagnetic<HTMLDivElement>(16, 140);
  return (
    <div ref={ref} className={`inline-block ${className}`} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
