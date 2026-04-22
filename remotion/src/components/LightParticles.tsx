import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  // Deterministic pseudo-random by index
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  const seed2 = ((i + 7) * 7919) % 100000;
  const r2 = seed2 / 100000;
  return {
    x: r * 100,
    y: r2 * 100,
    size: 2 + r * 4,
    speed: 0.15 + r2 * 0.35,
    opacity: 0.18 + r * 0.32,
    phase: r2 * Math.PI * 2,
  };
});

/**
 * Floating ambient particles for atmospheric depth.
 * Drift slowly upward with gentle horizontal sway.
 */
export const LightParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {PARTICLES.map((p, i) => {
        const progress = ((frame * p.speed) / durationInFrames) % 1;
        const y = p.y - progress * 30; // drift up
        const sway = Math.sin(frame * 0.02 + p.phase) * 1.5;
        const x = p.x + sway;
        const twinkle = interpolate(
          Math.sin(frame * 0.05 + p.phase * 2),
          [-1, 1],
          [0.4, 1]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(180, 210, 255, 0.9)",
              boxShadow: "0 0 8px rgba(150, 200, 255, 0.6)",
              opacity: p.opacity * twinkle,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};