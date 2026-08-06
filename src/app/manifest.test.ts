import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("returns the expected web application manifest metadata", () => {
    const result = manifest();
    expect(result.name).toBe("Mark Anthony Serrano");
    expect(result.short_name).toBe("Mark Anthony Serrano");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.background_color).toBe("#ffffff");
    expect(result.theme_color).toBe("#006bb6");
    expect(result.icons).toHaveLength(2);
  });
});
