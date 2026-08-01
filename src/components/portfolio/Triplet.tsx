import SectionDivider from "@/components/typography/SectionDivider";
import {
  getTripletSectionView,
  type PageBuilderSection,
  type Project,
  type TripletGraphColumn,
  type TripletGraphItemView,
  type TripletTechnologyItemView,
} from "@/lib/content";
import TechLogo from "./TechLogo";

const GRAPH_CHART_HEIGHT = 180;

// Mirrors the Gridsome frontend's pbTriplet.vue: a titled row of exactly
// three items, each either a technology logo (pbTripletItemTechnology.vue)
// or a small usage-comparison bar chart (pbTripletItemGraph.vue). Unlike the
// other page-builder components, pbTriplet can appear more than once per
// project ("Technology", then "Usage vs Similar"), so per PageBuilder's
// contract this reads its data from the dispatched section instead of
// finding the first matching block itself.
export default function Triplet({ section, project }: { section: PageBuilderSection; project: Project }) {
  const view = getTripletSectionView(section, project);

  if (view.items.length === 0) {
    return null;
  }

  return (
    <section aria-label={view.title || "Technology"} className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {view.title && <SectionDivider>{view.title}</SectionDivider>}

      {view.content && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-white/70">{view.content}</p>
      )}

      <div className="my-10 flex flex-col items-center gap-10 md:flex-row md:items-start md:justify-around">
        {view.items.map((item) =>
          item.type === "itemTechnology" ? (
            <TripletTechnologyItem key={item.key} item={item} />
          ) : (
            <TripletGraphItem key={item.key} item={item} />
          ),
        )}
      </div>
    </section>
  );
}

// Same link-purpose and no-url-fallback treatment as TechnologyCarousel's
// TechnologyCard, since it's the same logo + shine-text label idiom.
function TripletTechnologyItem({ item }: { item: TripletTechnologyItemView }) {
  const { technology } = item;
  const body = (
    <>
      <TechLogo filter={technology} size={200} backdrop={false} square={technology.is_square} />
      <span className="shine-text animate-shine motion-reduce:animate-none mt-6 block text-center text-sm font-semibold tracking-wide text-white uppercase">
        {technology.title}
      </span>
    </>
  );

  const className = "flex w-full max-w-[240px] flex-col items-center py-3";

  if (!technology.url) {
    return <div className={className}>{body}</div>;
  }

  return (
    <a
      href={technology.url}
      target="_blank"
      rel="noopener noreferrer"
      title={technology.title}
      className={`${className} rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none`}
    >
      {body}
    </a>
  );
}

function TripletGraphItem({ item }: { item: TripletGraphItemView }) {
  const maxTotal = Math.max(...item.columns.map((column) => column.total), 1);

  return (
    <div className="flex w-full max-w-[320px] flex-col items-center">
      <h5 className="shine-text animate-shine motion-reduce:animate-none mb-6 text-sm font-semibold tracking-widest text-white uppercase">
        {item.title}
      </h5>
      <div className="flex w-full items-end justify-center gap-6">
        {item.columns.map((column) => (
          <TripletGraphColumnBar key={column.key} column={column} maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
}

// Ports pbTripletItemGraph.vue's stacked Chart.js bar as plain divs: the
// project's own usage bar sits solid at the bottom, related technologies
// stack on top (striped, in the project's own brand color, unless that
// related slug is also used elsewhere on this project - see
// getTripletSectionView's still_in_project recolor). A native `title`
// attribute exposes each segment's exact figure on hover, matching the
// Gridsome chart's tooltip; the sr-only line beneath covers screen readers
// and keyboard users the hover tooltip can't reach.
function TripletGraphColumnBar({ column, maxTotal }: { column: TripletGraphColumn; maxTotal: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex w-10 flex-col-reverse overflow-hidden rounded-sm bg-white/10"
        style={{ height: GRAPH_CHART_HEIGHT }}
      >
        {column.segments.map((segment, index) => {
          const stripeColor =
            segment.technology.primary === "#FFFFFF"
              ? segment.technology.secondary
              : segment.technology.primary;

          return (
            <div
              key={`${segment.technology.slug}-${index}`}
              title={`${segment.technology.title}: ${segment.usage}`}
              style={{
                height: `${(segment.usage / maxTotal) * 100}%`,
                backgroundColor: segment.striped ? "transparent" : segment.technology.primary,
                backgroundImage: segment.striped
                  ? `repeating-linear-gradient(45deg, ${stripeColor} 0 3px, transparent 3px 7px)`
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <span className="shine-text animate-shine motion-reduce:animate-none text-center text-xs font-semibold tracking-wide text-white uppercase">
        {column.technology.title}
      </span>
      <span className="sr-only">
        {column.segments
          .map((segment) =>
            segment.technology.slug === column.technology.slug
              ? `${segment.technology.title} usage: ${segment.usage}`
              : `Related technology ${segment.technology.title} usage: ${segment.usage}`,
          )
          .join(". ")}
      </span>
    </div>
  );
}
