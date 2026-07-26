import Image from "next/image";
import AquariumTank1Penguins from "./AquariumTank1Penguins";
import AquariumTank2PelagicConveyor from "./AquariumTank2PelagicConveyor";
import AquariumTank3RotatingExhibit from "./AquariumTank3RotatingExhibit";
import Helicopter from "./Helicopter";
import LighthouseBeams from "./LighthouseBeams";
import SmokeEffects from "./SmokeEffects";
import { scaledHeight, scaledWidth } from "./scaling";

// Backdrop/shell portion of snippetEndcapMarkAnthonySerrano2020.vue: county
// silhouettes, sky/water gradients, clouds, wake and turtle animations, the
// aquarium tank creatures, the Lottie helicopter, and the smoke effect.
//
// `fill` mirrors the Gridsome landing page's `.endcap { min-height: 100%;
// height: initial }` override: most consumers get the illustration's own
// intrinsic height, but the landing page instead fills its container
// exactly, since it has no content of its own to size the page around.
// `fill` positions against the nearest positioned ancestor (absolute
// inset-0) rather than `h-full`, since a plain percentage height can't
// resolve through a `flex-1` ancestor whose own height comes from the flex
// algorithm rather than a specified CSS height.
export default function EndcapShell({ fill = false }: { fill?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={
        fill
          ? "pointer-events-none absolute inset-0 isolate w-full overflow-hidden"
          : "pointer-events-none relative isolate h-[calc(33vw+33vh)] w-full overflow-hidden"
      }
    >
      <div
        className="absolute bottom-0 left-0 z-[2]"
        style={{ ...scaledWidth(1051), aspectRatio: "525 / 440" }}
      >
        <Image
          src="/assets/county-monterey.svg"
          alt=""
          width={525}
          height={440}
          unoptimized
          priority
          className="absolute bottom-0 left-0 h-auto w-full"
          style={{ height: "auto" }}
        />
        <AquariumTank1Penguins />
        <AquariumTank2PelagicConveyor />
        <AquariumTank3RotatingExhibit />
        {/* Renders after the tanks (not alongside county-monterey.svg above):
            its window-glass/frame details are meant to sit on top of the
            creatures, visually masking anything that spills past a tank's
            illustrated window into the wall - confirmed against the live
            site, which stacks it the same way. */}
        <Image
          src="/assets/county-monterey-overlay.svg"
          alt=""
          width={525}
          height={440}
          unoptimized
          className="absolute bottom-0 left-0 h-auto w-full"
          style={{ height: "auto" }}
        />
        <SmokeEffects />
      </div>

      <div className="absolute right-0 bottom-0 z-[2]" style={scaledWidth(984)}>
        <Image
          src="/assets/county-santacruz.svg"
          alt=""
          width={492}
          height={374}
          unoptimized
          className="absolute right-0 bottom-0 h-auto w-full"
          style={{ height: "auto" }}
        />
        <LighthouseBeams />
      </div>

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#0f2d49_0%,transparent_62%,transparent_100%)] min-[960px]:bg-[linear-gradient(0deg,#0f2d49_0%,#0f2d49_17.5%,transparent_100%)]" />

        <div className="absolute right-0 bottom-0" style={scaledWidth(984)}>
          <Image
            src="/assets/county-santacruz-underlay.svg"
            alt=""
            width={492}
            height={374}
            unoptimized
            className="absolute right-0 bottom-0 h-auto w-full"
            style={{ height: "auto" }}
          />
        </div>

        <div className="absolute inset-0 z-[1] bg-[linear-gradient(0deg,#0f2d49_0%,transparent_50%,transparent_100%)] min-[960px]:bg-[linear-gradient(0deg,#0f2d49,transparent)]" />

        <div
          className="absolute bottom-0 left-0 z-[2] w-full bg-[#2a93d5]"
          style={scaledHeight(225)}
        >
          <div
            className="absolute bottom-[48%] left-[35%] z-[3] animate-sway-1 motion-reduce:animate-none"
            style={{ ...scaledWidth(175), aspectRatio: "87 / 4" }}
          >
            <Image
              src="/assets/wake1.svg"
              alt=""
              fill
              unoptimized
            />
          </div>
          <div
            className="absolute right-[35%] bottom-[65%] z-[3] animate-sway-2-delayed motion-reduce:animate-none"
            style={{ ...scaledWidth(209), aspectRatio: "104 / 4" }}
          >
            <Image
              src="/assets/wake2.svg"
              alt=""
              fill
              unoptimized
            />
          </div>
          <div
            className="absolute right-[46%] bottom-[25%] z-[3] animate-sway-3-delayed motion-reduce:animate-none"
            style={{ ...scaledWidth(129), aspectRatio: "64 / 2" }}
          >
            <Image
              src="/assets/wake3.svg"
              alt=""
              fill
              unoptimized
            />
          </div>
          <div
            className="absolute top-[-0.58vw] left-[62%] z-[3] animate-turtle-swim motion-reduce:animate-none"
            style={scaledWidth(66)}
          >
            <Image
              src="/assets/green-turtle.svg"
              alt=""
              width={32}
              height={20}
              unoptimized
              className="h-auto w-full"
              style={{ height: "auto" }}
            />
          </div>
        </div>

        <div className="absolute top-[12.5%] left-[15%] z-[4]" style={scaledWidth(272)}>
          <Image
            src="/assets/cloud-sun.svg"
            alt=""
            width={135}
            height={63}
            unoptimized
            className="h-auto w-full"
            style={{ height: "auto" }}
          />
        </div>
        <div className="absolute top-[21%] right-[15%] z-[3]" style={scaledWidth(254)}>
          <Image
            src="/assets/cloud-single.svg"
            alt=""
            width={126}
            height={47}
            unoptimized
            className="h-auto w-full"
            style={{ height: "auto" }}
          />
        </div>

        <Helicopter />
      </div>
    </div>
  );
}
