import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { CarScene } from "./scenes/CarScene";
import { Vignette } from "./components/Vignette";
import { LightParticles } from "./components/LightParticles";

// Total: 300 frames (10s @ 30fps). Designed to loop seamlessly.
// Scene durations include cross-fade overlap.
const SCENE_DURATION = 130; // frames each scene is alive
const CROSSFADE = 30; // overlap between consecutive scenes

// Per-scene start frames so they overlap by CROSSFADE
const STEP = SCENE_DURATION - CROSSFADE; // 100

/**
 * Wraps a scene in a fade-in/fade-out wrapper using local frame.
 * Last scene also fades back to first scene at the very end for seamless loop.
 */
const FadeWrap: React.FC<{
  duration: number;
  fadeIn: number;
  fadeOut: number;
  children: React.ReactNode;
}> = ({ duration, fadeIn, fadeOut, children }) => {
  const frame = useCurrentFrame();
  // Ensure strictly monotonic input range even when fadeIn=0 or fadeOut=0
  const inEnd = Math.max(fadeIn, 1);
  const outStart = Math.min(duration - Math.max(fadeOut, 1), duration - 1);
  const safeOutStart = Math.max(outStart, inEnd + 1);
  const opacity = interpolate(
    frame,
    [0, inEnd, safeOutStart, duration],
    [fadeIn === 0 ? 1 : 0, 1, 1, fadeOut === 0 ? 1 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0f1a" }}>
      {/* Scene 1: SUV side profile — slow zoom-in + slight pan right */}
      <Sequence from={0} durationInFrames={SCENE_DURATION}>
        <FadeWrap duration={SCENE_DURATION} fadeIn={0} fadeOut={CROSSFADE}>
          <CarScene
            src="images/car1.jpg"
            zoom={[1.05, 1.18]}
            panX={[2, -2]}
            panY={[0, -1]}
            duration={SCENE_DURATION}
          />
        </FadeWrap>
      </Sequence>

      {/* Scene 2: Black sedan front 3/4 — push-in with slight downward tilt */}
      <Sequence from={STEP} durationInFrames={SCENE_DURATION}>
        <FadeWrap duration={SCENE_DURATION} fadeIn={CROSSFADE} fadeOut={CROSSFADE}>
          <CarScene
            src="images/car2.jpg"
            zoom={[1.12, 1.02]}
            panX={[-1, 1]}
            panY={[1, -1]}
            duration={SCENE_DURATION}
          />
        </FadeWrap>
      </Sequence>

      {/* Scene 3: Blue wagon rear — slow pull-back */}
      <Sequence from={STEP * 2} durationInFrames={SCENE_DURATION}>
        <FadeWrap duration={SCENE_DURATION} fadeIn={CROSSFADE} fadeOut={0}>
          <CarScene
            src="images/car3.jpg"
            zoom={[1.18, 1.04]}
            panX={[1, -2]}
            panY={[-1, 1]}
            duration={SCENE_DURATION}
          />
        </FadeWrap>
      </Sequence>

      {/* Loop helper — bring scene 1 back at the very end so the loop is seamless */}
      <Sequence from={STEP * 3} durationInFrames={SCENE_DURATION - CROSSFADE}>
        <FadeWrap duration={SCENE_DURATION - CROSSFADE} fadeIn={CROSSFADE} fadeOut={0}>
          <CarScene
            src="images/car1.jpg"
            zoom={[1.05, 1.10]}
            panX={[2, 1]}
            panY={[0, 0]}
            duration={SCENE_DURATION - CROSSFADE}
          />
        </FadeWrap>
      </Sequence>

      {/* Persistent overlays for cinematic look */}
      <LightParticles />
      <Vignette />
    </AbsoluteFill>
  );
};