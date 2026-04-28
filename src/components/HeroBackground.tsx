import { useEffect, useRef } from 'react';

interface HeroBackgroundProps {
  parallaxY?: number;
  /** Called once per "headlight pass" through the center of the viewport */
  onCenterPass?: () => void;
}

/**
 * Canvas-animated night-highway background.
 * - Dark gradient base (#0a0a0a -> #1a1a2e)
 * - Slow drifting "headlight" light orbs
 * - Diagonal glowing streaks moving across the screen
 * - No external video/image
 */
export const HeroBackground = ({ parallaxY = 0, onCenterPass }: HeroBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const lastPassRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Headlight orbs — slow horizontal drift
    type Orb = {
      x: number; y: number; vx: number; r: number; hue: number; alpha: number;
      passed: boolean;
    };
    const orbs: Orb[] = [];
    const spawnOrb = (initial = false): Orb => {
      const fromLeft = Math.random() > 0.5;
      const speed = 0.25 + Math.random() * 0.45; // px/frame, very slow
      return {
        x: initial ? Math.random() * width : fromLeft ? -120 : width + 120,
        y: height * (0.35 + Math.random() * 0.45),
        vx: fromLeft ? speed : -speed,
        r: 60 + Math.random() * 90,
        hue: Math.random() > 0.4 ? 200 : 35, // cool white-blue or warm amber
        alpha: 0.35 + Math.random() * 0.3,
        passed: false,
      };
    };
    for (let i = 0; i < 5; i++) orbs.push(spawnOrb(true));

    // Diagonal streaks
    type Streak = { progress: number; speed: number; offset: number; thickness: number; alpha: number };
    const streaks: Streak[] = [];
    const spawnStreak = (initial = false): Streak => ({
      progress: initial ? Math.random() : -0.2,
      speed: 0.0015 + Math.random() * 0.0025,
      offset: Math.random() * height,
      thickness: 0.5 + Math.random() * 1.2,
      alpha: 0.08 + Math.random() * 0.18,
    });
    for (let i = 0; i < 6; i++) streaks.push(spawnStreak(true));

    let frame = 0;
    const render = () => {
      frame++;
      // Base dark gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#0a0a0a');
      bg.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle vignette of stars / depth dots (cheap)
      ctx.globalCompositeOperation = 'lighter';

      // Diagonal streaks (highway light trails)
      for (const s of streaks) {
        s.progress += s.speed;
        if (s.progress > 1.2) Object.assign(s, spawnStreak(false));
        const startX = -width * 0.3 + s.progress * width * 1.6;
        const startY = s.offset - height * 0.2;
        const endX = startX + width * 0.6;
        const endY = startY + height * 0.6;
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, 'rgba(180,210,255,0)');
        grad.addColorStop(0.5, `rgba(200,225,255,${s.alpha})`);
        grad.addColorStop(1, 'rgba(180,210,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.thickness;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Headlight orbs
      const centerX = width / 2;
      const centerBand = width * 0.08;
      for (const o of orbs) {
        o.x += o.vx;
        const offscreen = o.vx > 0 ? o.x - o.r > width + 60 : o.x + o.r < -60;
        if (offscreen) {
          Object.assign(o, spawnOrb(false));
          continue;
        }
        // Detect center pass for logo-swap trigger
        if (!o.passed && Math.abs(o.x - centerX) < centerBand) {
          o.passed = true;
          const now = performance.now();
          if (now - lastPassRef.current > 4500) {
            lastPassRef.current = now;
            onCenterPass?.();
          }
        }
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        const col = o.hue === 35
          ? `255,200,140`
          : `200,225,255`;
        grad.addColorStop(0, `rgba(${col},${o.alpha})`);
        grad.addColorStop(0.4, `rgba(${col},${o.alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [onCenterPass]);

  return (
    <div
      className="absolute inset-0 w-full h-full will-change-transform"
      style={{ transform: `translateY(${parallaxY * 0.4}px)` }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};