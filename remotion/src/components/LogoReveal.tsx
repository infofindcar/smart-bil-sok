import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const LogoReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({
    frame: frame - 155,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.9 },
  });
  const outOpacity = interpolate(frame, [280, 298], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(inSpring, outOpacity);
  const scale = interpolate(inSpring, [0, 1], [0.92, 1]);
  const tagSpring = spring({
    frame: frame - 170,
    fps,
    config: { damping: 22, stiffness: 110 },
  });
  const tagOpacity = Math.min(tagSpring, outOpacity);
  const tagY = interpolate(tagSpring, [0, 1], [12, 0]);
  const breathe = 1 + Math.sin(frame / 30) * 0.005;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 220,
          letterSpacing: -6,
          lineHeight: 1,
          transform: `scale(${scale * breathe})`,
          textShadow: "0 8px 60px rgba(34,211,238,0.25)",
        }}
      >
        <span style={{ color: "#1e3a8a" }}>Find</span>
        <span style={{ color: "#22d3ee" }}>Car</span>
      </div>
      <div
        style={{
          marginTop: 28,
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          color: "rgba(255,255,255,0.78)",
          fontFamily: "Inter, Arial, sans-serif",
          fontWeight: 300,
          fontSize: 44,
          letterSpacing: 1,
        }}
      >
        Din objektiva bilrecensent
      </div>
    </AbsoluteFill>
  );
};
