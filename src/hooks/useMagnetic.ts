import { useEffect, useRef } from 'react';

/** Attaches magnetic hover — element drifts ~strength px toward pointer
 *  when mouse is within radius. Disabled on touch + reduced-motion. */
export function useMagnetic<T extends HTMLElement>(strength = 14, radius = 120) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius + Math.max(rect.width, rect.height) / 2) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = 'translate3d(0, 0, 0)';
        });
        return;
      }
      const pull = Math.min(1, (radius + 80 - dist) / (radius + 80));
      const tx = (dx / radius) * strength * pull;
      const ty = (dy / radius) * strength * pull;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (el) el.style.transform = 'translate3d(0, 0, 0)';
      });
    };

    window.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return ref;
}
