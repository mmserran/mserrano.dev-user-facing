import { describe, expect, it } from "vitest";
import { scaledHeight, scaledWidth } from "./scaling";

describe("illustration scaling", () => {
  it("scales width against the shared reference size", () => {
    expect(scaledWidth(784.94)).toEqual({
      width: "calc((784.94 / 784.94) * 33vw)",
      maxWidth: "calc((784.94 / 784.94) * 25vw)",
    });
  });

  it("scales height against the shared reference size", () => {
    expect(scaledHeight(225)).toEqual({
      height: "calc((225 / 784.94) * 33vw)",
      maxHeight: "calc((225 / 784.94) * 25vw)",
    });
  });
});
