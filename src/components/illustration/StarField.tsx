const STAR_LOOP_VH = 300;

type StarLayer = {
  pixelSize: number;
  count: number;
  seed: number;
  animationClassName: string;
};

// Density/size/speed tiers carried over from decorPixelStars.vue.
const STAR_LAYERS: StarLayer[] = [
  { pixelSize: 2, count: 300, seed: 1, animationClassName: "animate-star-drift-slow" },
  { pixelSize: 4, count: 60, seed: 2, animationClassName: "animate-star-drift-medium" },
  { pixelSize: 7, count: 15, seed: 3, animationClassName: "animate-star-drift-fast" },
];

// mulberry32 - small seeded PRNG. A plain Math.random() here would run once
// for the SSR HTML pass and again for the RSC payload, producing two
// different star fields and a hydration mismatch; a fixed seed keeps every
// render pass identical, standing in for the Sass `random()` function,
// which only ever evaluates once at Sass compile time.
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStarShadow(count: number, seed: number) {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const x = (random() * 100).toFixed(2);
    const y = (random() * STAR_LOOP_VH).toFixed(2);
    return `${x}vw ${y}vh #fff`;
  }).join(", ");
}

export default function StarField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {STAR_LAYERS.map((layer) => {
        const shadow = generateStarShadow(layer.count, layer.seed);
        return (
          <div
            key={layer.pixelSize}
            className={`absolute bg-transparent opacity-60 motion-reduce:animate-none after:absolute after:top-[300vh] after:h-[inherit] after:w-[inherit] after:bg-transparent after:[box-shadow:var(--star-shadow)] after:content-[''] ${layer.animationClassName}`}
            style={{
              width: layer.pixelSize,
              height: layer.pixelSize,
              boxShadow: shadow,
              ["--star-shadow" as string]: shadow,
            }}
          />
        );
      })}
    </div>
  );
}
