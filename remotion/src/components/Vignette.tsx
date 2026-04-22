import { AbsoluteFill } from "remotion";

/**
 * Persistent dark gradient overlay for cinematic depth + readability
 * if text is layered on top later. Subtle bottom-heavy fade.
 */
export const Vignette: React.FC = () => {
  return (
    <>
      {/* Bottom-heavy gradient for depth */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,15,26,0.35) 0%, rgba(10,15,26,0.05) 35%, rgba(10,15,26,0.15) 65%, rgba(10,15,26,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Radial vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Subtle teal/blue color wash to unify scenes */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(20,40,70,0.18) 0%, transparent 50%, rgba(40,20,60,0.12) 100%)",
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />
    </>
  );
};