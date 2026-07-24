import type { CSSProperties } from "react";

// The Gridsome endcap illustration's source SVGs share one reference width
// (their common natural size before export); every asset's on-page size is
// derived from that ratio, scaling with viewport width, so pieces stay
// proportional to each other at any screen size.
const NORMALIZING_VALUE = 784.94;

// Ported from the endcap's `scaled-width`/`scaled-height` Sass mixins:
// width tracks viewport width (33vw basis) but is capped by the width of
// the land strip flanking the center water channel (25vw, since the water
// channel itself is 50vw).
export function scaledWidth(value: number): CSSProperties {
  return {
    width: `calc((${value} / ${NORMALIZING_VALUE}) * 33vw)`,
    maxWidth: `calc((${value} / ${NORMALIZING_VALUE}) * 25vw)`,
  };
}

export function scaledHeight(value: number): CSSProperties {
  return {
    height: `calc((${value} / ${NORMALIZING_VALUE}) * 33vw)`,
    maxHeight: `calc((${value} / ${NORMALIZING_VALUE}) * 25vw)`,
  };
}
