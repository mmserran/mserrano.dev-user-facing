import { getMediaVariants, type ProjectFilter } from "@/lib/content";

// Shared "does this filter have a resolvable logo" rendering, used by both
// FilterBar's small filter chips (circular backdrop in the filter's brand
// color) and TechnologyCarousel's larger plain logo cards. A filter whose
// image never got processed by the migration backend falls back to a letter
// avatar either way, rather than a broken image.
//
// The circular backdrop (for contrast against white/mono marks like
// WordPress/Shopify) is skipped for logos content.json flags as already
// full-color, e.g. Vue/jQuery/AngularJS, and for callers that opt out of the
// backdrop entirely (the Gridsome technology carousel never applied one).
export default function TechLogo({
  filter,
  size,
  backdrop = true,
  square = false,
}: {
  filter: ProjectFilter;
  size: number;
  backdrop?: boolean;
  square?: boolean;
}) {
  const [variant] = getMediaVariants(filter.image);
  const dimensions = { width: size, height: size };

  if (variant) {
    const backgroundColor = backdrop && !filter.is_full_color ? filter.primary : "transparent";
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small fixed-size icon, not worth Next Image's loader machinery
      <img
        src={variant.url}
        alt=""
        style={{ ...dimensions, backgroundColor }}
        className={`box-border shrink-0 object-contain ${backdrop ? "rounded-full p-0.5" : square ? "p-[5px]" : ""}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...dimensions, backgroundColor: filter.primary, color: filter.secondary, fontSize: size * 0.5 }}
      className={`flex shrink-0 items-center justify-center font-bold ${backdrop ? "rounded-full" : "rounded-md"}`}
    >
      {filter.title.slice(0, 1).toUpperCase()}
    </span>
  );
}
