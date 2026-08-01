"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

import StarField from "@/components/illustration/StarField";
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
  onHover: (technology: ProjectFilter | null) => void,
) {
  const paths: ReactNode[] = [];
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
          pointerEvents={layer === "overlay" ? "none" : undefined}
          onMouseEnter={layer === "underlay" ? () => onHover(child.technology ?? null) : undefined}
          onMouseLeave={layer === "underlay" ? () => onHover(null) : undefined}
        />,
      );
    }
    position = childEnd;
  });

  return paths;
}

function TechnologyLink({
  technology,
  subdued = false,
  active = false,
  onHoverChange,
  onFocusChange,
}: {
  technology: ProjectFilter;
  subdued?: boolean;
  active?: boolean;
  onHoverChange: (slug: string | null) => void;
  onFocusChange: (slug: string | null) => void;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="h-[0.6em] w-[50px] shrink-0"
        style={{ backgroundColor: technology.primary }}
      />
      <span className="relative tracking-widest uppercase">
        {technology.title}
        <span
          aria-hidden="true"
          data-technology-diamond
          className={`absolute top-1/2 -right-5 h-[7px] w-[7px] -translate-y-1/2 rotate-45 bg-white motion-reduce:animate-none ${active ? "animate-[technology-star-twirl_3s_infinite] opacity-100" : "opacity-0 group-hover:animate-[technology-star-twirl_3s_infinite] group-hover:opacity-100 group-focus-visible:animate-[technology-star-twirl_3s_infinite] group-focus-visible:opacity-100"}`}
        />
      </span>
    </>
  );
  const className = `group flex min-h-10 w-fit items-center gap-2.5 text-sm leading-5 text-white transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue sm:min-h-6 ${subdued ? "opacity-50 hover:opacity-100 focus-visible:opacity-100" : ""}`;
  const interactionProps = {
    onMouseEnter: () => onHoverChange(technology.slug),
    onMouseLeave: () => onHoverChange(null),
    onFocus: () => onFocusChange(technology.slug),
    onBlur: () => onFocusChange(null),
  };

  return technology.url ? (
    <a
      href={technology.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...interactionProps}
    >
      {content}
    </a>
  ) : (
    <span tabIndex={0} className={className} {...interactionProps}>
      {content}
    </span>
  );
}

function headingId(title: string) {
  return `technology-${title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`;
}

export default function TechnologyBreakdown({ project }: { project: Project }) {
  const [tooltip, setTooltip] = useState({ label: "", x: 0, y: 0 });
  const [hoveredTechnology, setHoveredTechnologySlug] = useState<string | null>(null);
  const [focusedTechnology, setFocusedTechnology] = useState<string | null>(null);
  const activeTechnology = hoveredTechnology ?? focusedTechnology;
  const breakdown = getTechnologyBreakdown(project);
  if (!breakdown || breakdown.graph.length === 0) {
    return null;
  }

  const graphSlices = breakdown.graph.map((slice, index) => {
    const start = 180 + breakdown.graph.slice(0, index).reduce((sum, previous) => sum + previous.weight * 180, 0);
    return { slice, start, end: start + slice.weight * 180 };
  });

  const moveTooltip = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTooltip((current) => ({
      ...current,
      x: event.clientX - bounds.left + 12,
      y: event.clientY - bounds.top + 12,
    }));
  };

  const setHoveredTechnology = (technology: ProjectFilter | null) => {
    setTooltip((current) => ({ ...current, label: technology?.title ?? "" }));
    setHoveredTechnologySlug(technology?.slug ?? null);
  };

  return (
    <section
      aria-labelledby="technology-breakdown-heading"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
    >
      <h2 id="technology-breakdown-heading" className="sr-only">
        Technology breakdown
      </h2>
      <div aria-hidden="true" className="h-px w-full bg-white/62" />

      <div
        className="relative mx-auto mt-10 mb-4 w-full max-w-[800px] sm:mt-12 sm:mb-5"
        onMouseMove={moveTooltip}
        onMouseLeave={() => setHoveredTechnology(null)}
      >
        <svg
          viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
          role="img"
          aria-label={`Technology usage breakdown for ${project.general.title}`}
          aria-describedby="technology-graph-description"
          className="block h-auto w-full"
        >
          <desc id="technology-graph-description">
            A weighted semicircle showing the project&apos;s primary technologies and their nested frameworks.
            The linked legend following the chart lists every technology by category.
          </desc>
          {graphSlices.map(({ slice, start, end }) => {
            return (
              <g key={slice.technology.slug}>
                {childWedges(slice.breakdown, start, end, "underlay", setHoveredTechnology)}
                <path
                  d={wedgePath(sliceRadius(slice.weight), start, end)}
                  fill={slice.technology.primary}
                  onMouseEnter={() => setHoveredTechnology(slice.technology)}
                  onMouseLeave={() => setHoveredTechnology(null)}
                />
                {childWedges(slice.breakdown, start, end, "overlay", setHoveredTechnology)}
              </g>
            );
          })}
          <g aria-hidden="true" pointerEvents="none">
            {graphSlices.flatMap(({ slice, start, end }) => {
              const outlines: ReactNode[] = [];
              if (slice.technology.slug === activeTechnology) {
                outlines.push(
                  <path
                    key={`outline-${slice.technology.slug}`}
                    data-technology-outline={slice.technology.slug}
                    d={wedgePath(sliceRadius(slice.weight), start, end)}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />,
                );
              }

              let position = start;
              slice.breakdown.forEach((child, index) => {
                const childEnd = position + child.weight * (end - start);
                if (child.technology?.slug === activeTechnology && childEnd > position) {
                  outlines.push(
                    <path
                      key={`outline-${child.technology.slug}-${index}`}
                      data-technology-outline={child.technology.slug}
                      d={wedgePath(sliceRadius(child.weight, true), position, childEnd)}
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />,
                  );
                }
                position = childEnd;
              });
              return outlines;
            })}
          </g>
          <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS} fill="#000" fillOpacity="0.2" />
          <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS * 0.8125} fill="#fff" fillOpacity="0.9" />
          <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_RADIUS * 0.5875} fill="#fff" fillOpacity="0.65" />
        </svg>
        <StarField foreground />
        {tooltip.label && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 rounded-sm border border-white/30 bg-[#090a0f]/95 px-2.5 py-1.5 text-xs font-semibold tracking-widest whitespace-nowrap text-white uppercase shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.label}
          </div>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-[1000px] grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-0 xl:grid-cols-4 xl:gap-10">
        {breakdown.legend.map((section) => (
          <section key={section.title} aria-labelledby={headingId(section.title)} className="w-full min-w-0 max-w-80 justify-self-center">
            <h3
              id={headingId(section.title)}
              className="shine-text animate-shine motion-reduce:animate-none mb-[3px] text-base font-semibold tracking-widest text-white uppercase"
            >
              {section.title}
            </h3>
            {section.entries.map((entry) => (
              <div key={`${entry.general ? "general" : "parent"}-${entry.technology?.slug ?? section.title}`}>
                {entry.technology && (
                  <TechnologyLink
                    technology={entry.technology}
                    active={entry.technology.slug === activeTechnology}
                    onHoverChange={setHoveredTechnologySlug}
                    onFocusChange={setFocusedTechnology}
                  />
                )}
                {entry.children.map((technology) => (
                  <div key={technology.slug} className="ml-5">
                    <TechnologyLink
                      technology={technology}
                      subdued={entry.general}
                      active={technology.slug === activeTechnology}
                      onHoverChange={setHoveredTechnologySlug}
                      onFocusChange={setFocusedTechnology}
                    />
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
