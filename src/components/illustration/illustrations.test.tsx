import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AquariumTank1Penguins from "./AquariumTank1Penguins";
import AquariumTank2PelagicConveyor from "./AquariumTank2PelagicConveyor";
import AquariumTank3RotatingExhibit from "./AquariumTank3RotatingExhibit";
import EndcapShell from "./EndcapShell";
import Helicopter from "./Helicopter";
import LighthouseBeams from "./LighthouseBeams";
import SmokeEffects from "./SmokeEffects";
import StarField from "./StarField";

describe("Illustration Components", () => {
  it("renders EndcapShell without fill", () => {
    const { container } = render(<EndcapShell />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders EndcapShell with fill prop", () => {
    const { container } = render(<EndcapShell fill />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders StarField", () => {
    const { container } = render(<StarField />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders SmokeEffects", () => {
    const { container } = render(<SmokeEffects />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders LighthouseBeams", () => {
    const { container } = render(<LighthouseBeams />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders Helicopter", () => {
    const { container } = render(<Helicopter />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders AquariumTank1Penguins", () => {
    const { container } = render(<AquariumTank1Penguins />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders AquariumTank2PelagicConveyor", () => {
    const { container } = render(<AquariumTank2PelagicConveyor />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders AquariumTank3RotatingExhibit", () => {
    const { container } = render(<AquariumTank3RotatingExhibit />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
