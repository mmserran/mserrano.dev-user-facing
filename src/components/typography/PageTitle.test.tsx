import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageTitle from "./PageTitle";

describe("PageTitle", () => {
  it("renders children inside an h1 heading", () => {
    render(<PageTitle>Test Title</PageTitle>);

    const heading = screen.getByRole("heading", { level: 1, name: "Test Title" });
    expect(heading).toBeInTheDocument();
  });

  it("applies custom class names to the h1 element", () => {
    render(<PageTitle className="custom-class">Custom Title</PageTitle>);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("custom-class");
    expect(heading).toHaveClass("shine-text");
  });
});
