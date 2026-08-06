// Animates the Santa Cruz lighthouse's light bars (baked into
// county-santacruz.svg's `lighthouse-lights` group, whose fill/transform
// values are copied here) so they cycle on one at a time, clockwise, instead
// of sitting frozen. This is an inline <svg> overlay - not next/image, like
// the rest of the base illustration - because each bar needs its own
// independent animation delay. It shares the same viewBox and positioning as
// the county-santacruz.svg <Image> in EndcapShell so the two align exactly.
//
// Reduced motion falls back to the illustration's original static look:
// NW/SW steady at full brightness, NE/SE steady dim - the same imbalance the
// artwork always had before animation, not a new state.
export default function LighthouseBeams() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 492 374.45"
      className="absolute right-0 bottom-0 h-auto w-full"
    >
      <rect
        x="11"
        y="174.44"
        width="24"
        height="8"
        transform="translate(112.54 334.5) rotate(157.5)"
        fill="#ffc420"
        className="animate-light-sw motion-reduce:animate-none opacity-0 motion-reduce:opacity-100"
      />
      <rect
        x="11"
        y="147.44"
        width="24"
        height="8"
        transform="translate(-13.71 300.16) rotate(-157.5)"
        fill="#ffc420"
        className="animate-light-nw motion-reduce:animate-none opacity-0 motion-reduce:opacity-100"
      />
      <rect
        x="103"
        y="147.44"
        width="24"
        height="8"
        transform="translate(-49.2 55.54) rotate(-22.5)"
        fill="#ffc420"
        className="animate-light-ne motion-reduce:animate-none opacity-0 motion-reduce:opacity-70"
      />
      <rect
        x="103"
        y="174.44"
        width="24"
        height="8"
        transform="translate(77.04 -30.43) rotate(22.5)"
        fill="#ffc420"
        className="animate-light-se motion-reduce:animate-none opacity-0 motion-reduce:opacity-70"
      />
    </svg>
  );
}
