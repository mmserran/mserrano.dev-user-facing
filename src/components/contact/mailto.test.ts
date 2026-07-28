import { describe, expect, it } from "vitest";
import { buildContactMailto } from "./mailto";

describe("buildContactMailto", () => {
  it("encodes the subject, sender details, Unicode, reserved characters, and CRLF lines", () => {
    const href = buildContactMailto("mark@example.com", {
      name: " Zoë & Co. ",
      email: " zoe+web@example.com ",
      subject: " Hello & welcome? ",
      message: "First line\nSecond + line",
    });
    const url = new URL(href);

    expect(href).toContain("subject=Hello%20%26%20welcome%3F");
    expect(href).toContain("First%20line%0D%0ASecond%20%2B%20line");
    expect(href).not.toContain("+");
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("mark@example.com");
    expect(url.searchParams.get("subject")).toBe("Hello & welcome?");
    expect(url.searchParams.get("body")).toBe(
      "First line\r\nSecond + line\r\n\r\n—\r\nFrom: Zoë & Co. <zoe+web@example.com>",
    );
  });

  it("normalizes CR, LF, and CRLF message lines without doubling carriage returns", () => {
    const href = buildContactMailto("mark@example.com", {
      name: "Jane",
      email: "jane@example.com",
      subject: "Line endings",
      message: "First\rSecond\nThird\r\nFourth",
    });

    expect(new URL(href).searchParams.get("body")).toBe(
      "First\r\nSecond\r\nThird\r\nFourth\r\n\r\n—\r\nFrom: Jane <jane@example.com>",
    );
  });

  it("creates a useful subject from the sender when subject is blank", () => {
    const href = buildContactMailto("mark@example.com", {
      name: "Jane Visitor",
      email: "jane@example.com",
      subject: " ",
      message: "Hello",
    });

    expect(new URL(href).searchParams.get("subject")).toBe("Message from Jane Visitor");
  });
});
