import Image from "next/image";
import { scaledHeight, scaledWidth } from "./scaling";

// Backdrop/shell portion of snippetEndcapMarkAnthonySerrano2020.vue: county
// silhouettes, sky/water gradients, clouds, wake and turtle animations.
// Aquarium tank creatures, the Lottie helicopter, and smoke effects are
// later increments - this only reproduces the static/ambient scene.
export default function EndcapShell() {
  return (
    <div className="relative isolate h-[calc(33vw+33vh)] w-full overflow-hidden">
      <div className="absolute bottom-0 left-0 z-[2]" style={scaledWidth(1051)}>
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
        <Image
          src="/assets/county-monterey-overlay.svg"
          alt=""
          width={525}
          height={440}
          unoptimized
          className="absolute bottom-0 left-0 h-auto w-full"
          style={{ height: "auto" }}
        />
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
            style={scaledWidth(175)}
          >
            <Image
              src="/assets/wake1.svg"
              alt=""
              width={87}
              height={4}
              unoptimized
              className="h-auto w-full"
              style={{ height: "auto" }}
            />
          </div>
          <div
            className="absolute right-[35%] bottom-[65%] z-[3] animate-sway-2-delayed motion-reduce:animate-none"
            style={scaledWidth(209)}
          >
            <Image
              src="/assets/wake2.svg"
              alt=""
              width={104}
              height={4}
              unoptimized
              className="h-auto w-full"
              style={{ height: "auto" }}
            />
          </div>
          <div
            className="absolute right-[46%] bottom-[25%] z-[3] animate-sway-3-delayed motion-reduce:animate-none"
            style={scaledWidth(129)}
          >
            <Image
              src="/assets/wake3.svg"
              alt=""
              width={64}
              height={2}
              unoptimized
              className="h-auto w-full"
              style={{ height: "auto" }}
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
      </div>
    </div>
  );
}
