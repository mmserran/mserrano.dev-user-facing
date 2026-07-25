import Image from "next/image";
import { scaledWidth } from "./scaling";

// Ported from .aquarium-tank1 in snippetEndcapMarkAnthonySerrano2020.vue: a
// rotated viewing window holding three independent penguins, each drifting
// on its own always-on keyframe loop (no JS-driven state, unlike tank 3).
export default function AquariumTank1Penguins() {
  return (
    <div
      className="absolute overflow-hidden"
      style={{ bottom: "7vw", left: "0.1vw", width: "5.6vw", height: "5.6vw", transform: "rotate(12deg)" }}
    >
      <Image
        src="/assets/african-penguin.svg"
        alt=""
        width={22}
        height={15}
        unoptimized
        className="absolute h-auto animate-penguin-slow-descent motion-reduce:animate-none"
        style={{ ...scaledWidth(44), top: "-1.1vw", left: "3vw", opacity: 0.75, transform: "rotate(-12deg)" }}
      />
      <Image
        src="/assets/african-penguin.svg"
        alt=""
        width={22}
        height={15}
        unoptimized
        className="absolute h-auto animate-penguin-fun motion-reduce:animate-none"
        style={{ ...scaledWidth(44), top: "-1vw", left: "4vw", opacity: 0.75, transform: "rotate(-12deg)" }}
      />
      <Image
        src="/assets/african-penguin.svg"
        alt=""
        width={22}
        height={15}
        unoptimized
        className="absolute h-auto animate-penguin-slow-poke motion-reduce:animate-none"
        style={{ ...scaledWidth(44), top: "0.5vw", left: "6vw", opacity: 0.75, transform: "rotate(-12deg)" }}
      />
    </div>
  );
}
