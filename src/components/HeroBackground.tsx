import { useEffect, useRef } from 'react';

interface HeroBackgroundProps {
  parallaxY?: number;
  /** Called once per car passing the camera (close to viewer) */
  onCenterPass?: () => void;
}

/**
 * Canvas-animated night highway with cars in the distance.
 *
 * Perspective trick: a vanishing point near the upper-middle of the canvas.
 * "Cars" are spawned far away (small, near horizon) and travel toward (oncoming,
 * white headlights) or away from the camera (red tail lights), growing larger
 * as they approach. A slow camera sway loops continuously for cinematic feel.
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    /**
     * A car driving on the highway.
     * - z: depth, 0 = at camera, 1 = at horizon (far)
     * - lane: -2..2, lateral lane offset (negative = oncoming side)
     * - dir: +1 = approaching camera (oncoming, white headlights),
     *        -1 = moving away (tail lights)
     */
    type Car = {
      z: number;
      lane: number;
      dir: 1 | -1;
      speed: number; // dz per frame
      passed: boolean;
    };

    const cars: Car[] = [];
    const spawnCar = (initial = false): Car => {
      const dir: 1 | -1 = Math.random() > 0.45 ? 1 : -1;
      // Oncoming on the left lanes (-2,-1), tail-lights on right lanes (+1,+2)
      const lane = dir === 1
        ? -1 - Math.random() * 1.1
        : 1 + Math.random() * 1.1;
      return {
        z: initial ? Math.random() * 0.95 + 0.05 : 1, // start at horizon
        lane,
        dir,
        // Approaching cars feel faster (perspective). Tail lights drift away slower.
        speed: dir === 1 ? 0.0028 + Math.random() * 0.0022 : 0.0018 + Math.random() * 0.0014,
        passed: false,
      };
    };
    for (let i = 0; i < 8; i++) cars.push(spawnCar(true));

    let frame = 0;
    const render = () => {
      frame++;

      // Slow looping camera sway (sinusoidal) — gentle horizontal drift
      const t = frame / 60;
      const cameraSway = Math.sin(t * 0.18) * (width * 0.04);

      // Vanishing point — slightly above center for road-into-distance feel
      const vpX = width / 2 + cameraSway;
      const vpY = height * 0.42;

      // ===== Background sky/ground =====
      const sky = ctx.createLinearGradient(0, 0, 0, vpY);
      sky.addColorStop(0, '#0a0a0a');
      sky.addColorStop(1, '#16162a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, vpY);

      const ground = ctx.createLinearGradient(0, vpY, 0, height);
      ground.addColorStop(0, '#16162a');
      ground.addColorStop(0.5, '#0d0d18');
      ground.addColorStop(1, '#050509');
      ctx.fillStyle = ground;
      ctx.fillRect(0, vpY, width, height - vpY);

      // Subtle horizon glow
      const glow = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, width * 0.5);
      glow.addColorStop(0, 'rgba(80,120,200,0.12)');
      glow.addColorStop(1, 'rgba(80,120,200,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      // ===== Road lane reflection lines (perspective) =====
      // Draws a few lane-edge streaks that emerge from the vanishing point.
      const drawLane = (laneOffset: number) => {
        const grad = ctx.createLinearGradient(vpX, vpY, vpX + laneOffset * width * 0.6, height);
        grad.addColorStop(0, 'rgba(120,160,220,0)');
        grad.addColorStop(0.6, 'rgba(140,180,230,0.06)');
        grad.addColorStop(1, 'rgba(160,200,240,0.18)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(vpX + laneOffset * width * 0.6, height);
        ctx.stroke();
      };
      drawLane(-0.55);
      drawLane(-0.18);
      drawLane(0.18);
      drawLane(0.55);

      // ===== Cars =====
      // Sort by depth so far ones render behind near ones
      cars.sort((a, b) => b.z - a.z);

      const centerX = width / 2;
      const centerBand = width * 0.18;

      for (const car of cars) {
        // Update depth
        car.z -= car.speed * car.dir;
        // Cars approaching go from z=1 -> z=0; cars going away from z=0.05 -> z=1
        if (car.dir === 1 && car.z <= 0.02) {
          // Passed the camera
          Object.assign(car, spawnCar(false));
          continue;
        }
        if (car.dir === -1 && car.z >= 1) {
          Object.assign(car, spawnCar(false));
          continue;
        }

        // Perspective scale: near (z small) = big, far (z=1) = tiny
        const scale = Math.pow(1 - car.z, 1.6); // 0..1
        // Project lane position to screen
        const laneSpread = width * 0.35; // how far lanes extend from vanishing point at the bottom
        const screenX = vpX + car.lane * laneSpread * (1 - car.z);
        const screenY = vpY + (height - vpY) * (1 - car.z);

        // Headlight/taillight pair geometry
        const pairGap = 8 + scale * 55; // distance between left+right light
        const lightR = 4 + scale * 28;  // radius of each light glow
        const beamLen = 80 + scale * 320; // forward beam length (only for approaching)
        const opacity = 0.35 + scale * 0.55;

        if (car.dir === 1) {
          // Oncoming: white-blue headlights + forward beam cones
          const col = '230,240,255';

          // Beam cones (only visible when somewhat close)
          if (scale > 0.15) {
            const beamGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY + beamLen * 0.3, beamLen);
            beamGrad.addColorStop(0, `rgba(${col},${0.18 * scale})`);
            beamGrad.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(screenX - pairGap * 0.6, screenY);
            ctx.lineTo(screenX + pairGap * 0.6, screenY);
            ctx.lineTo(screenX + pairGap * 2.5, screenY + beamLen);
            ctx.lineTo(screenX - pairGap * 2.5, screenY + beamLen);
            ctx.closePath();
            ctx.fill();
          }

          // The two headlights themselves
          for (const dx of [-pairGap / 2, pairGap / 2]) {
            const lg = ctx.createRadialGradient(screenX + dx, screenY, 0, screenX + dx, screenY, lightR * 3);
            lg.addColorStop(0, `rgba(${col},${opacity})`);
            lg.addColorStop(0.3, `rgba(${col},${opacity * 0.4})`);
            lg.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.arc(screenX + dx, screenY, lightR * 3, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.fillStyle = `rgba(255,255,255,${Math.min(1, opacity * 1.2)})`;
            ctx.beginPath();
            ctx.arc(screenX + dx, screenY, Math.max(1, lightR * 0.35), 0, Math.PI * 2);
            ctx.fill();
          }

          // Trigger logo swap when an approaching car passes near the camera
          if (!car.passed && car.z < 0.18 && Math.abs(screenX - centerX) < centerBand) {
            car.passed = true;
            const now = performance.now();
            if (now - lastPassRef.current > 5000) {
              lastPassRef.current = now;
              onCenterPass?.();
            }
          }
        } else {
          // Receding: red tail lights + soft red trail
          const col = '255,70,55';

          // Tail trail (going toward horizon)
          if (scale > 0.1) {
            const trailGrad = ctx.createLinearGradient(screenX, screenY, vpX, vpY);
            trailGrad.addColorStop(0, `rgba(${col},${0.22 * scale})`);
            trailGrad.addColorStop(1, `rgba(${col},0)`);
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = Math.max(1, pairGap * 0.5);
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(vpX + (screenX - vpX) * 0.2, vpY + (screenY - vpY) * 0.2);
            ctx.stroke();
          }

          for (const dx of [-pairGap / 2, pairGap / 2]) {
            const lg = ctx.createRadialGradient(screenX + dx, screenY, 0, screenX + dx, screenY, lightR * 2.5);
            lg.addColorStop(0, `rgba(${col},${opacity})`);
            lg.addColorStop(0.4, `rgba(${col},${opacity * 0.3})`);
            lg.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.arc(screenX + dx, screenY, lightR * 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255,120,90,${Math.min(1, opacity * 1.1)})`;
            ctx.beginPath();
            ctx.arc(screenX + dx, screenY, Math.max(1, lightR * 0.3), 0, Math.PI * 2);
            ctx.fill();
          }
        }
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