import SectionDivider from "@/components/typography/SectionDivider";
import {
  getTripletSectionView,
  type PageBuilderSection,
  type Project,
  type TripletGraphItemView,
  type TripletTechCardView,
  type TripletTechnologyItemView,
} from "@/lib/content";
import TechLogo from "./TechLogo";

// Mirrors the Gridsome frontend's pbTriplet.vue: a titled row of exactly
// three items, each either a technology logo (pbTripletItemTechnology.vue)
// or a proficiency breakdown (replacing pbTripletItemGraph.vue's Chart.js
// usage-vs-similar-market bars - see getTripletSectionView for why). Unlike
// the other page-builder components, pbTriplet can appear more than once per
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
  return (
    <div className="flex w-full max-w-[320px] flex-col items-center">
      <h5 className="shine-text animate-shine motion-reduce:animate-none mb-6 text-sm font-semibold tracking-widest text-white uppercase">
        {item.title}
      </h5>
      <div className="grid w-full max-w-[260px] grid-cols-2 gap-3">
        {item.cards.map((card) => (
          <TripletTechCard key={card.key} card={card} />
        ))}
      </div>
    </div>
  );
}

// Ports pbTripletItemGraph.vue's category selection, but replaces its
// Chart.js bars comparing this project's tech against unrelated "similar"
// market alternatives with a plain proficiency reading - see
// getTripletSectionView for the reasoning. "High Proficiency" and "First
// used here" render as compact icon badges (not wide always-visible pills),
// expanding inline on hover/focus to reveal the full label, so the card's
// default state stays uncluttered. Same link-purpose and no-url-fallback
// treatment as TripletTechnologyItem/TechnologyCarousel/TechnologyBreakdown's
// legend, so every technology mention in the app is consistently clickable.
function TripletTechCard({ card }: { card: TripletTechCardView }) {
  const { technology } = card;
  const bodyClassName = `flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3`;

  const badges = (card.isHighProficiency || card.isFirstUsedHere) && (
    <div className="absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
      {card.isHighProficiency && <TripletCardBadge kind="proficiency" label="High Proficiency" glyph="★" />}
      {card.isFirstUsedHere && <TripletCardBadge kind="new" label="First used here" glyph="✦" />}
    </div>
  );

  const body = (
    <>
      <TechLogo filter={technology} size={48} backdrop={false} square={technology.is_square} />
      <span className="shine-text animate-shine motion-reduce:animate-none text-center text-[11px] font-semibold tracking-wide text-white uppercase">
        {technology.title}
      </span>
      <span className="text-center text-[10px] text-white/55">
        {card.projects} {card.projects === 1 ? "project" : "projects"}
      </span>
      <span className="text-center text-[10px] font-semibold text-[#7fc4ff]">{card.statistic}</span>
    </>
  );

  return (
    <div className={`group/card relative ${card.isActive ? "" : "opacity-70"}`}>
      {badges}
      {technology.url ? (
        <a
          href={technology.url}
          target="_blank"
          rel="noopener noreferrer"
          title={technology.title}
          className={`${bodyClassName} transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none`}
        >
          {body}
        </a>
      ) : (
        <div className={bodyClassName}>{body}</div>
      )}
    </div>
  );
}

// Collapsed to just the glyph by default (a fixed-size circle, never part of
// the collapsing measurement so nothing ever peeks out); hovering anywhere on
// the card (group/card, from TripletTechCard) or focusing this badge directly
// grows a sibling span from zero width/padding to reveal the label already
// sitting in the DOM (clipped, not `aria-hidden`), so the full text is always
// in the accessibility tree - no floating tooltip needed.
function TripletCardBadge({ kind, label, glyph }: { kind: "proficiency" | "new"; label: string; glyph: string }) {
  return (
    <span
      tabIndex={0}
      className={`group/badge flex items-center rounded-full text-xs leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
        kind === "proficiency" ? "bg-brand-blue text-white" : "bg-brand-yellow text-black"
      }`}
    >
      <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center">
        {glyph}
      </span>
      <span className="max-w-0 overflow-hidden pr-0 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase transition-all duration-200 ease-out group-hover/card:max-w-[140px] group-hover/card:pr-2 group-focus-visible/badge:max-w-[140px] group-focus-visible/badge:pr-2">
        {label}
      </span>
    </span>
  );
}
