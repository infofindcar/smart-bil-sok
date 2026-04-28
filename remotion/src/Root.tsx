import { Composition } from "remotion";
import { HeroLoop } from "./HeroLoop";

export const RemotionRoot = () => (
  <Composition
    id="hero-loop"
    component={HeroLoop}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
  />
);
