import { useEffect, useRef } from 'react';

/** Three drifting gradient orbs layered behind hero content.
 *  Gold/violet/coral glow — mix-blend screen so they sit on top of video
 *  without darkening. Pointer-events disabled. */
export default function HeroOrbs() {
  const hostRef = useRef<HTMLDivElement>(null);

  // Subtle pointer parallax on desktop (skipped when prefers-reduced-motion)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const handle = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      host.style.setProperty('--px', `${x}px`);
      host.style.setProperty('--py', `${y}px`);
    };
    window.addEventListener('pointermove', handle);
    return () => window.removeEventListener('pointermove', handle);
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      style={{ transform: 'translate3d(var(--px, 0), var(--py, 0), 0)', transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <span className="orb orb-gold"   style={{ width: 520, height: 520, top: '-8%',  left: '-6%' }} />
      <span className="orb orb-violet" style={{ width: 440, height: 440, top: '22%',  right: '-8%' }} />
      <span className="orb orb-coral"  style={{ width: 380, height: 380, bottom: '-6%', left: '30%' }} />
    </div>
  );
}
