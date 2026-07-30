import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProjectFilter } from "@/lib/content";
import FilterBar from "./FilterBar";

function makeFilter(overrides: Partial<ProjectFilter>): ProjectFilter {
  return {
    slug: "test-filter",
    value: "term:framework:1",
    title: "Test Filter",
    url: "",
    affinity: "",
    is_square: false,
    primary: "#000000",
    secondary: "#ffffff",
    image: "",
    alias: [],
    priority: 1,
    list_trait: [],
    stats: { usage: 1, first_year_used: 2020 },
    ...overrides,
  };
}

const filters: ProjectFilter[] = [
  makeFilter({ slug: "wordpress", title: "WordPress", image: "WordPress.png" }),
  makeFilter({ slug: "bootstrap", title: "Bootstrap", image: "Bootstrap.png" }),
  makeFilter({ slug: "python", title: "Python", alias: ["py"] }),
  makeFilter({ slug: "hidden", title: "Hidden Filter", priority: -1 }),
];

describe("FilterBar", () => {
  it("shows the placeholder prompt when nothing is selected", () => {
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      "Filter by technology/query. Add terms to expand search.",
    );
  });

  it("renders a chip with a remove control for each selected filter", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={filters} selectedSlugs={["wordpress"]} onChange={onChange} />);

    expect(screen.getByText("WordPress")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove WordPress filter" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("excludes filters with priority -1 from suggestions", async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Hidden Filter/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /WordPress/ })).toBeInTheDocument();
  });

  it("filters suggestions by typed text against title and alias", async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "py");
    expect(screen.getByRole("option", { name: /Python/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /WordPress/ })).not.toBeInTheDocument();
  });

  it("selects a filter on click and clears the query", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={onChange} />);

    await user.type(screen.getByRole("combobox"), "word");
    await user.click(screen.getByRole("option", { name: /WordPress/ }));

    expect(onChange).toHaveBeenCalledWith(["wordpress"]);
  });

  it("supports arrow-key navigation and Enter to select", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith(["bootstrap"]);
  });

  it("closes the listbox on Escape", async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("removes the last chip on Backspace when the query is empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterBar filters={filters} selectedSlugs={["wordpress", "bootstrap"]} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Backspace}");

    expect(onChange).toHaveBeenCalledWith(["wordpress"]);
  });

  it("only gives whitelisted slugs an image avatar, even when others have an image asset", async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={filters} selectedSlugs={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    const wordpressOption = screen.getByRole("option", { name: /WordPress/ });
    const bootstrapOption = screen.getByRole("option", { name: /Bootstrap/ });

    expect(wordpressOption.querySelector("img")).not.toBeNull();
    expect(bootstrapOption.querySelector("img")).toBeNull();
  });
});
