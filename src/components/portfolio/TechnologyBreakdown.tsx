import {
  getTechnologyBreakdown,
  type Project,
  type ProjectFilter,
  type TechnologyGraphChildSlice,
} from "@/lib/content";

const GRAPH_WIDTH = 800;
const GRAPH_HEIGHT = 500;
const CENTER_X = 400;
const CENTER_Y = 400;
const CENTER_RADIUS = 100;
const SLICE_RANGE = 250;
const MIN_RADIUS = 50;

function polarPoint(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(radians),
    y: CENTER_Y + radius * Math.sin(radians),
  };
}

function wedgePath(radius: number, start: number, end: number) {
  const from = polarPoint(radius, start);
  const to = polarPoint(radius, end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER_X} ${CENTER_Y} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
}

function sliceRadius(weight: number, isChild = false) {
  if (weight <= 0.05) {
    return 0.875 * SLICE_RANGE + CENTER_RADIUS + MIN_RADIUS;
  }
  const scaledWeight = isChild ? Math.min(1, weight + 0.5) : weight;
  return scaledWeight * SLICE_RANGE + CENTER_RADIUS + MIN_RADIUS;
}

function childWedges(
  children: TechnologyGraphChildSlice[],
  start: number,
  end: number,
  layer: "underlay" | "overlay",
) {
  const paths: React.ReactNode[] = [];
  let position = start;

  children.forEach((child, index) => {
    const childEnd = position + child.weight * (end - start);
    if (child.technology && childEnd > position) {
      paths.push(
        <path
          key={`${layer}-${child.technology.slug}-${index}`}
          d={wedgePath(sliceRadius(child.weight, true), position, childEnd)}
          fill={child.technology.primary}
          fillOpacity={layer === "overlay" ? 0.25 : undefined}
        />,
      );
    }
    position = childEnd;
  });

  return paths;
}

function TechnologyLink({ technology, subdued = false }: { technology: ProjectFilter; subdued?: boolean }) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="h-[0.6em] w-12 shrink-0"
        style={{ backgroundColor: technology.primary }}
      />
      <span className="relative tracking-widest uppercase">
        {technology.title}
        <span
          aria-hidden="true"
          className="absolute top-1/2 -right-5 h-[7px] w-[7px] -translate-y-1/2 rotate-45 bg-white opacity-0 group-hover:animate-[technology-star-twirl_3s_infinite] group-hover:opacity-100 group-focus-visible:animate-[technology-star-twirl_3s_infinite] group-focus-visible:opacity-100 motion-reduce:animate-none"
        />
      </span>
    </>
  );
  const className = `group flex min-h-11 w-fit items-center gap-2.5 py-1 text-sm text-white transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue ${subdued ? "opacity-50 hover:opacity-100 focus-visible:opacity-100" : ""}`;

  return technology.url ? (
    <a href={technology.url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  );
}

function headingId(title: string) {
  return `technology-${title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`;
}

export default function TechnologyBreakdown({ project }: { project: Project }) {
  const breakdown = getTechnologyBreakdown(project);
  if (!breakdown || breakdown.graph.length === 0) {
    return null;
  }

  const graphSlices = breakdown.graph.map((slice, index) => {
    const start = 180 + breakdown.graph.slice(0, index).reduce((sum, previous) => sum + previous.weight * 180, 0);
    return { slice, start, end: start + slice.weight * 180 };
  });

  return (
    <section
      aria-labelledby="technology-breakdown-heading"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
    >
      <h2 id="technology-breakdown-heading" className="sr-only">
        Technology breakdown
      </h2>
      <div aria-hidden="true" className="mb-8 h-px w-full bg-white/62" />

      <svg
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="img"
        aria-labelledby="technology-graph-title"
        aria-describedby="technology-graph-description"
        className="mx-auto block h-auto w-full max-w-[800px]"
      >
        <title id="technology-graph-title">{`Technology usage breakdown for ${project.general.title}`}</title>
        <desc id="technology-graph-description">
          A weighted semicircle showing the project&apos;s primary technologies and their nested frameworks.
          The linked legend following the chart lists every technology by category.
        </desc>
        {graphSlices.map(({ slice, start, end }) => {
          return (
            <g key={slice.technology.slug}>
              {childWedges(slice.breakdown, start, end, "underlay")}
              <path d={wedgePath(sliceRadius(slice.weight), start, end)} fill={slice.technology.primary} />
              {childWedges(slice.breakdown, start, end, "overlay")}
            </g>
          );
        })}
        <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS} fill="#000" fillOpacity="0.2" />
        <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS * 0.8125} fill="#fff" fillOpacity="0.9" />
        <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS * 0.5875} fill="#fff" fillOpacity="0.65" />
      </svg>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-0 xl:grid-cols-4 xl:gap-10">
        {breakdown.legend.map((section) => (
          <section key={section.title} aria-labelledby={headingId(section.title)} className="w-full min-w-0 max-w-80 justify-self-center">
            <h3
              id={headingId(section.title)}
              className="shine-text animate-shine motion-reduce:animate-none mb-1 text-base font-semibold tracking-widest text-white uppercase"
            >
              {section.title}
            </h3>
            {section.entries.map((entry) => (
              <div key={`${entry.general ? "general" : "parent"}-${entry.technology?.slug ?? section.title}`}>
                {entry.technology && <TechnologyLink technology={entry.technology} />}
                {entry.children.map((technology) => (
                  <div key={technology.slug} className="ml-5">
                    <TechnologyLink technology={technology} subdued={entry.general} />
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
