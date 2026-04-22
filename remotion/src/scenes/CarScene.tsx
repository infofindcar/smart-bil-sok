import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

type Props = {
  src: string;
  // Pan direction across the duration
  panX?: [number, number]; // percent
  panY?: [number, number]; // percent
  // Zoom range
  zoom?: [number, number];
  duration: number;
};

/**
 * A single car scene with subtle Ken Burns-style parallax:
 * slow zoom + drift to give a cinematic in-motion feel.
 * Local frame starts at 0 inside its <Sequence>.
 */
export const CarScene: React.FC<Props> = ({
  src,
  panX = [0, 0],
  panY = [0, 0],
  zoom = [1.08, 1.18],
  duration,
}) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, duration], zoom, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(frame, [0, duration], panX, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty = interpolate(frame, [0, duration], panY, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0a0f1a" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          transform: `translate(${tx}%, ${ty}%) scale(${scale})`,
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};