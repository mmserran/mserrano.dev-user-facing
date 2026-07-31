import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionDivider from "./SectionDivider";

describe("SectionDivider", () => {
  it("renders children inside an h3 heading", () => {
    render(<SectionDivider>Related</SectionDivider>);

    expect(screen.getByRole("heading", { level: 3, name: "Related" })).toBeInTheDocument();
  });
});
