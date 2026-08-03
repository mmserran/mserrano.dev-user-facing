import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionDivider from "./SectionDivider";

describe("SectionDivider", () => {
  it("renders a labeled title inside an h3 heading", () => {
    render(<SectionDivider title="Related" />);

    expect(screen.getByRole("heading", { level: 3, name: "Related" })).toBeInTheDocument();
  });

  it("puts the id on the heading itself, so a caller can aria-labelledby it directly", () => {
    render(<SectionDivider id="related-projects-heading" title="Related" />);

    expect(screen.getByRole("heading", { level: 3, name: "Related" })).toHaveAttribute(
      "id",
      "related-projects-heading",
    );
  });

  it("renders an unlabeled, decorative rule for the backend's '---' bare-divider title", () => {
    const { container } = render(<SectionDivider title="---" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing for an empty title", () => {
    const { container } = render(<SectionDivider title="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
