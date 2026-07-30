"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { getMediaVariants, type ProjectFilter } from "@/lib/content";

// Legacy chip-avatar whitelist (projectSearchChip.vue's `useImage`): only
// these tech slugs, plus anything tagged with a "workplace" value, show a
// real icon. Every other filter falls back to a letter avatar - confirmed
// live: the Bootstrap chip doesn't use its icon even though content.json has
// one for it.
const AVATAR_IMAGE_SLUGS = new Set(["wordpress", "shopify", "vue", "adobe-illustrator"]);

function stubFilter(slug: string): ProjectFilter {
  return {
    slug,
    value: "",
    title: slug,
    url: "",
    affinity: "",
    is_square: false,
    primary: "#64748b",
    secondary: "#ffffff",
    image: "",
    alias: [],
    priority: -1,
    list_trait: [],
    stats: { usage: 0, first_year_used: 0 },
  };
}

function matchesQuery(filter: ProjectFilter, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  if (filter.title.toLowerCase().includes(needle)) return true;
  return filter.alias.some((alias) => alias.toLowerCase().includes(needle));
}

function FilterAvatar({ filter }: { filter: ProjectFilter }) {
  const wantsImage = AVATAR_IMAGE_SLUGS.has(filter.slug) || filter.value.includes("workplace");
  const [variant] = wantsImage ? getMediaVariants(filter.image) : [];

  if (variant) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size icon, not worth Next Image's loader machinery
      <img src={variant.url} alt="" className="size-5 shrink-0 rounded-full object-contain" />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
      style={{ backgroundColor: filter.primary, color: filter.secondary }}
    >
      {filter.title.slice(0, 1).toUpperCase()}
    </span>
  );
}

function FilterChip({ filter, onRemove }: { filter: ProjectFilter; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-black/5 py-1 pr-1 pl-2 text-sm text-black">
      <FilterAvatar filter={filter} />
      {filter.title}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${filter.title} filter`}
        className="flex size-5 items-center justify-center rounded-full text-black/60 hover:bg-black/10 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        <MdClose aria-hidden="true" />
      </button>
    </span>
  );
}

export default function FilterBar({
  filters,
  selectedSlugs,
  onChange,
}: {
  filters: ProjectFilter[];
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
}) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filterBySlug = useMemo(() => new Map(filters.map((f) => [f.slug, f])), [filters]);
  const selectedFilters = selectedSlugs.map((slug) => filterBySlug.get(slug) ?? stubFilter(slug));

  // Mirrors the Gridsome frontend's list_visible_filter computed: only
  // filters with a non-negative priority are offered as suggestions.
  const suggestions = filters.filter((f) => f.priority > -1 && matchesQuery(f, query));

  function toggleSlug(slug: string) {
    onChange(selectedSlugs.includes(slug) ? selectedSlugs.filter((s) => s !== slug) : [...selectedSlugs, slug]);
    setQuery("");
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function removeSlug(slug: string) {
    onChange(selectedSlugs.filter((s) => s !== slug));
    inputRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (suggestions.length === 0 ? -1 : (i + 1) % suggestions.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (suggestions.length === 0 ? -1 : (i - 1 + suggestions.length) % suggestions.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        toggleSlug(suggestions[activeIndex].slug);
      }
    } else if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
    } else if (event.key === "Backspace" && query === "" && selectedSlugs.length > 0) {
      removeSlug(selectedSlugs[selectedSlugs.length - 1]);
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0 && suggestions[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-white/95 px-3 py-2 shadow-lg focus-within:outline focus-within:outline-2 focus-within:outline-brand-yellow">
        {selectedFilters.map((filter) => (
          <FilterChip key={filter.slug} filter={filter} onRemove={() => removeSlug(filter.slug)} />
        ))}
        <input
          ref={inputRef}
          role="combobox"
          type="text"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-label="Filter by technology/query. Add terms to expand search."
          placeholder={selectedFilters.length === 0 ? "Filter by technology/query. Add terms to expand search." : ""}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.parentElement?.parentElement?.contains(event.relatedTarget as Node)) {
              setIsOpen(false);
              setActiveIndex(-1);
            }
          }}
          onKeyDown={onKeyDown}
          className="min-w-32 flex-1 bg-transparent text-black placeholder:text-black/50 focus:outline-none"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Technology filters"
          className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg bg-white py-1 shadow-2xl"
        >
          {suggestions.map((filter, index) => {
            const selected = selectedSlugs.includes(filter.slug);
            return (
              <li
                key={filter.slug}
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleSlug(filter.slug)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-black ${
                  index === activeIndex ? "bg-brand-blue/10" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
                <FilterAvatar filter={filter} />
                <span>{filter.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
