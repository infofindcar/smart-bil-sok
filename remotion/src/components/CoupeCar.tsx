import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const CoupeCar = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const horizon = height * 0.62;
  const carWidth = 760;
  const carHeight = 230;
  const startX = width + 200;
  const endX = -carWidth - 200;
  const x = interpolate(frame, [0, 150], [startX, endX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 1.6),
  });
  const carY = horizon - carHeight + 90;
  const bob = Math.sin(frame / 6) * 1.2;
  const headlightIntensity = 0.85 + Math.sin(frame / 7) * 0.08;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - 380,
          top: carY + carHeight - 70,
          width: 460,
          height: 110,
          background:
            "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(255,245,210,0.55) 0%, rgba(255,235,180,0.20) 35%, rgba(255,220,160,0) 70%)",
          filter: "blur(6px)",
          opacity: headlightIntensity,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x + carWidth - 80,
          top: carY + carHeight - 80,
          width: 320,
          height: 80,
          background:
            "radial-gradient(ellipse 100% 100% at 0% 50%, rgba(255,40,40,0.45) 0%, rgba(255,40,40,0.18) 40%, rgba(255,40,40,0) 75%)",
          filter: "blur(8px)",
          mixBlendMode: "screen",
        }}
      />
      <div style={{ position: "absolute", left: x, top: carY + bob, width: carWidth, height: carHeight }}>
        <CarSVG width={carWidth} height={carHeight} />
      </div>
      <div
        style={{
          position: "absolute",
          left: x + 30,
          top: carY + carHeight + bob - 10,
          width: carWidth - 60,
          height: 90,
          background: "linear-gradient(180deg, rgba(20,30,50,0.55) 0%, rgba(20,30,50,0) 100%)",
          transform: "scaleY(-1)",
          opacity: 0.35,
          filter: "blur(4px)",
          borderRadius: "50% 50% 0 0 / 80% 80% 0 0",
        }}
      />
    </AbsoluteFill>
  );
};

const CarSVG = ({ width, height }: { width: number; height: number }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 760 230" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2230" />
          <stop offset="55%" stopColor="#10131c" />
          <stop offset="100%" stopColor="#06080d" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4a66" />
          <stop offset="100%" stopColor="#0c1220" />
        </linearGradient>
        <linearGradient id="windowSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(180,210,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="headlight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff8d8" />
          <stop offset="60%" stopColor="#ffd98a" />
          <stop offset="100%" stopColor="rgba(255,200,100,0)" />
        </radialGradient>
        <radialGradient id="taillight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ff6060" />
          <stop offset="60%" stopColor="#cc1818" />
          <stop offset="100%" stopColor="rgba(120,0,0,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="380" cy="222" rx="340" ry="10" fill="rgba(0,0,0,0.55)" />
      <path
        d="M 30 170 C 30 140, 60 120, 110 118 L 180 118 C 220 100, 270 78, 340 70 C 410 64, 470 64, 520 78 C 560 88, 600 102, 640 116 L 700 122 C 728 126, 738 142, 738 168 L 738 188 L 30 188 Z"
        fill="url(#bodyGrad)"
      />
      <path
        d="M 215 116 C 250 92, 295 78, 345 74 C 405 70, 460 72, 505 84 C 530 90, 552 98, 568 108 L 568 118 L 215 118 Z"
        fill="url(#glassGrad)"
      />
      <path
        d="M 230 112 C 270 92, 320 80, 370 78 C 425 76, 475 80, 515 92 L 515 100 L 230 116 Z"
        fill="url(#windowSheen)"
        opacity="0.6"
      />
      <rect x="402" y="76" width="3" height="42" fill="#06080d" opacity="0.85" />
      <rect x="60" y="118" width="660" height="2" fill="rgba(180,200,230,0.35)" />
      <rect x="40" y="172" width="690" height="14" fill="rgba(0,0,0,0.45)" />
      <line x1="285" y1="120" x2="290" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="500" y1="120" x2="505" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="640" y1="124" x2="645" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <rect x="320" y="138" width="32" height="4" rx="2" fill="rgba(200,210,230,0.55)" />
      <rect x="540" y="138" width="32" height="4" rx="2" fill="rgba(200,210,230,0.55)" />
      <path d="M 600 188 a 70 70 0 0 1 140 0 Z" fill="#05070b" />
      <path d="M 60 188 a 70 70 0 0 1 140 0 Z" fill="#05070b" />
      <circle cx="670" cy="188" r="44" fill="#0a0c12" />
      <circle cx="670" cy="188" r="34" fill="#1a1d26" />
      <circle cx="670" cy="188" r="22" fill="#2a2f3c" />
      <circle cx="670" cy="188" r="6" fill="#0a0c12" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect key={deg} x="668" y="172" width="4" height="32" fill="#3a4050" transform={`rotate(${deg} 670 188)`} />
      ))}
      <circle cx="130" cy="188" r="44" fill="#0a0c12" />
      <circle cx="130" cy="188" r="34" fill="#1a1d26" />
      <circle cx="130" cy="188" r="22" fill="#2a2f3c" />
      <circle cx="130" cy="188" r="6" fill="#0a0c12" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect key={`r-${deg}`} x="128" y="172" width="4" height="32" fill="#3a4050" transform={`rotate(${deg} 130 188)`} />
      ))}
      <ellipse cx="728" cy="148" rx="14" ry="9" fill="url(#headlight)" />
      <ellipse cx="730" cy="150" rx="6" ry="4" fill="#ffffff" />
      <rect x="32" y="138" width="22" height="10" rx="2" fill="url(#taillight)" />
      <rect x="34" y="140" width="18" height="6" rx="1" fill="#ff3030" opacity="0.9" />
      <g transform="translate(70 158)">
        <rect x="0" y="0" width="140" height="26" rx="3" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1" />
        <rect x="0" y="0" width="16" height="26" rx="3" fill="#1a3a8a" />
        <text x="8" y="10" fill="#ffd400" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="700" textAnchor="middle">
          S
        </text>
        <text
          x="80"
          y="20"
          fill="#0a0a0a"
          fontFamily="Arial Black, Arial, sans-serif"
          fontSize="18"
          fontWeight="900"
          letterSpacing="1.2"
          textAnchor="middle"
        >
          FINDCAR
        </text>
      </g>
      <path d="M 240 80 C 320 70, 440 70, 520 84" stroke="rgba(200,220,255,0.35)" strokeWidth="1.5" fill="none" />
    </svg>
  );
};
