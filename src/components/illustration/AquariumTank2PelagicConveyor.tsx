import Image from "next/image";
import { scaledWidth } from "./scaling";

// Ported from .aquarium-tank2 in snippetEndcapMarkAnthonySerrano2020.vue: a
// fixed formation of pelagic fish riding one shared "track" element across
// the viewing window, rather than swimming independently. `left` offsets for
// tuna-bluefin/mahi-mahi/ocean-sunfish match the Vue source's un-styled
// defaults, confirmed against the live site's computed styles.
export default function AquariumTank2PelagicConveyor() {
  return (
    <div
      className="absolute overflow-hidden"
      style={{ bottom: "7.6vw", left: "5.9vw", width: "3.7vw", height: "5.3vw" }}
    >
      <div
        className="absolute h-full animate-tank2-speed-ramp motion-reduce:animate-none"
        style={{ width: "37vw", left: "0vw" }}
      >
        <Image
          src="/assets/tuna-yellowfin.svg"
          alt=""
          width={48}
          height={33}
          unoptimized
          className="absolute h-auto"
          style={{ ...scaledWidth(97), top: "0.9vw", left: "24.5vw" }}
        />
        <Image
          src="/assets/tuna-bluefin.svg"
          alt=""
          width={48}
          height={33}
          unoptimized
          className="absolute h-auto"
          style={{ ...scaledWidth(97), top: "0.85vw", left: "0vw" }}
        />
        {[1, 2, 3, 4].map((i) => (
          <Image
            key={i}
            src="/assets/school-of-sardines.svg"
            alt=""
            width={64}
            height={24}
            unoptimized
            className="absolute h-auto"
            style={{ ...scaledWidth(129), top: "0.9vw", left: `${1 + 3.8 * i}vw` }}
          />
        ))}
        <Image
          src="/assets/mahi-mahi.svg"
          alt=""
          width={32}
          height={16}
          unoptimized
          className="absolute h-auto"
          style={{ ...scaledWidth(66), top: "1.2vw", left: "30vw" }}
        />
        <Image
          src="/assets/ocean-sunfish.svg"
          alt=""
          width={32}
          height={27}
          unoptimized
          className="absolute h-auto"
          style={{ ...scaledWidth(65), top: "1.2vw", left: "35vw" }}
        />
      </div>
    </div>
  );
}
