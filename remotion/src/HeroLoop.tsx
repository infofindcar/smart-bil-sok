import { AbsoluteFill } from "remotion";
import { BridgeBackground } from "./components/BridgeBackground";
import { CoupeCar } from "./components/CoupeCar";
import { LogoReveal } from "./components/LogoReveal";

export const HeroLoop = () => {
  return (
    <AbsoluteFill style={{ background: "#05070d", overflow: "hidden" }}>
      <BridgeBackground />
      <CoupeCar />
      <LogoReveal />
    </AbsoluteFill>
  );
};
