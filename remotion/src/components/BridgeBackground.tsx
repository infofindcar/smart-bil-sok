import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const BridgeBackground = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const horizon = height * 0.62;
  const camX = Math.sin(frame / 60) * 8;
  const camY = Math.sin(frame / 90) * 4;
  const glowPulse = 0.55 + Math.sin(frame / 45) * 0.08;

  return (
    <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px)` }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #07090f 0%, #0c1220 35%, #131a2e 55%, #0a0d18 75%, #05070d 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: horizon - 180,
          height: 220,
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(255,170,90,0.18) 0%, rgba(120,80,160,0.10) 40%, rgba(0,0,0,0) 75%)",
          opacity: glowPulse,
        }}
      />
      <DistantCity horizon={horizon} width={width} frame={frame} />
      <BridgeCables horizon={horizon} width={width} height={height} />
      <Asphalt horizon={horizon} width={width} height={height} frame={frame} />
      <StreetLamps horizon={horizon} width={width} frame={frame} />
      <FogBand horizon={horizon} width={width} frame={frame} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const DistantCity = ({ horizon, width, frame }: { horizon: number; width: number; frame: number }) => {
  const dots = Array.from({ length: 60 }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const rx = (seed % 233280) / 233280;
    const ry = ((seed * 7) % 233280) / 233280;
    const x = rx * width;
    const y = horizon - 120 + ry * 80;
    const size = 1 + (i % 4);
    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / (10 + (i % 7)) + i));
    const hue = i % 5 === 0 ? "#ffd9a3" : i % 3 === 0 ? "#a3c8ff" : "#fff4d6";
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: 999,
          background: hue,
          opacity: twinkle * 0.7,
          boxShadow: `0 0 ${4 + size}px ${hue}`,
        }}
      />
    );
  });
  return <>{dots}</>;
};

const BridgeCables = ({ horizon, width, height }: { horizon: number; width: number; height: number }) => {
  const pillarColor = "rgba(20,28,45,0.95)";
  const cableColor = "rgba(80,100,140,0.45)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
      <rect x={width * 0.45} y={horizon - 220} width={14} height={220} fill={pillarColor} />
      <rect x={width * 0.545} y={horizon - 220} width={14} height={220} fill={pillarColor} />
      <line x1={width * 0.46} y1={horizon - 220} x2={width * 0.55} y2={horizon - 220} stroke={pillarColor} strokeWidth={6} />
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13;
        const x1 = width * 0.467 + t * (width * 0.083);
        const y1 = horizon - 220;
        const x2 = width * 0.30 + t * (width * 0.40);
        const y2 = horizon - 4;
        return <line key={`c1-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={cableColor} strokeWidth={1} />;
      })}
      <rect x={-30} y={horizon - 380} width={26} height={380 + (height - horizon)} fill="rgba(10,14,22,0.98)" />
      <rect x={width + 4} y={horizon - 380} width={26} height={380 + (height - horizon)} fill="rgba(10,14,22,0.98)" />
    </svg>
  );
};

const Asphalt = ({ horizon, width, height, frame }: { horizon: number; width: number; height: number; frame: number }) => {
  const roadTop = horizon;
  const roadH = height - roadTop;
  const streakSpacing = 220;
  const speed = 6;
  const offset = (frame * speed) % streakSpacing;
  const streaks = Array.from({ length: Math.ceil(width / streakSpacing) + 2 }).map((_, i) => {
    const x = i * streakSpacing - offset;
    return (
      <div
        key={`s-${i}`}
        style={{
          position: "absolute",
          left: x,
          top: roadTop + roadH * 0.35,
          width: 140,
          height: 3,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
          filter: "blur(1px)",
        }}
      />
    );
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: roadTop,
          width,
          height: roadH,
          background: "linear-gradient(180deg, #0a0d15 0%, #0d111c 30%, #11151f 60%, #0a0d14 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: roadTop + 4,
          width,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: roadTop + roadH * 0.55,
          width,
          height: roadH * 0.06,
          background: "linear-gradient(180deg, rgba(255,200,140,0.08) 0%, rgba(255,200,140,0) 100%)",
          filter: "blur(8px)",
        }}
      />
      {streaks}
    </>
  );
};

const StreetLamps = ({ horizon, width, frame }: { horizon: number; width: number; frame: number }) => {
  const spacing = 280;
  const speed = 2.2;
  const offset = (frame * speed) % spacing;
  const railingY = horizon - 6;
  const lamps = Array.from({ length: Math.ceil(width / spacing) + 3 }).map((_, i) => {
    const x = i * spacing - offset - 100;
    return (
      <div key={`lamp-${i}`}>
        <div
          style={{
            position: "absolute",
            left: x,
            top: railingY - 70,
            width: 2,
            height: 70,
            background: "rgba(35,40,55,0.95)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: x - 24,
            top: railingY - 90,
            width: 50,
            height: 50,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(255,210,140,0.85) 0%, rgba(255,180,90,0.35) 35%, rgba(255,160,70,0) 70%)",
            filter: "blur(2px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: x - 3,
            top: railingY - 73,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#fff2c4",
            boxShadow: "0 0 18px #ffd28a",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: x - 80,
            top: railingY + 10,
            width: 170,
            height: 60,
            background:
              "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,200,130,0.18) 0%, rgba(255,200,130,0) 70%)",
            filter: "blur(4px)",
          }}
        />
      </div>
    );
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: railingY,
          width,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(60,70,90,0) 0%, rgba(60,70,90,0.9) 50%, rgba(60,70,90,0) 100%)",
        }}
      />
      {lamps}
    </>
  );
};

const FogBand = ({ horizon, width, frame }: { horizon: number; width: number; frame: number }) => {
  const drift1 = ((frame * 0.6) % (width + 600)) - 300;
  const drift2 = ((frame * 0.4) % (width + 800)) - 400;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: drift1,
          top: horizon - 60,
          width: 1200,
          height: 90,
          background:
            "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(180,200,230,0.10) 0%, rgba(180,200,230,0) 70%)",
          filter: "blur(12px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -drift2,
          top: horizon - 30,
          width: 1500,
          height: 70,
          background:
            "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(160,180,220,0.08) 0%, rgba(160,180,220,0) 70%)",
          filter: "blur(14px)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
};
