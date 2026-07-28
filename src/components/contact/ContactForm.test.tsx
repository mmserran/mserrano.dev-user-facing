import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactForm from "./ContactForm";
import { buildContactMailto } from "./mailto";

vi.mock("./mailto", async (importOriginal) => {
  const original = await importOriginal<typeof import("./mailto")>();

  return {
    ...original,
    buildContactMailto: vi.fn(() => "mailto:mark@example.com"),
  };
});

describe("ContactForm", () => {
  beforeEach(() => {
    vi.mocked(buildContactMailto).mockClear();
  });

  it("provides accessible fields, autocomplete hints, and a direct-email fallback", () => {
    render(<ContactForm contactEmail="mark@example.com" />);

    expect(screen.getByRole("textbox", { name: /your name/i })).toHaveAttribute(
      "autocomplete",
      "name",
    );
    expect(screen.getByRole("textbox", { name: /your e-mail/i })).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByRole("textbox", { name: /your message/i })).toBeRequired();
    expect(screen.getByRole("link", { name: "mark@example.com" })).toHaveAttribute(
      "href",
      "mailto:mark@example.com",
    );
  });

  it("clears all entered values with the reset control", async () => {
    const user = userEvent.setup();
    render(<ContactForm contactEmail="mark@example.com" />);

    const name = screen.getByRole("textbox", { name: /your name/i });
    const subject = screen.getByRole("textbox", { name: /subject/i });
    await user.type(name, "Jane");
    await user.type(subject, "Hello");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(name).toHaveValue("");
    expect(subject).toHaveValue("");
  });

  it("builds the draft from current form controls after DOM-only autofill", () => {
    render(<ContactForm contactEmail="mark@example.com" />);

    const name = screen.getByRole("textbox", { name: /your name/i });
    const email = screen.getByRole("textbox", { name: /your e-mail/i });
    const subject = screen.getByRole("textbox", { name: /subject/i });
    const message = screen.getByRole("textbox", { name: /your message/i });

    Object.defineProperty(name, "value", { configurable: true, value: "Jane Doe" });
    Object.defineProperty(email, "value", {
      configurable: true,
      value: "jane@example.com",
    });
    Object.defineProperty(subject, "value", {
      configurable: true,
      value: "Autofilled subject",
    });
    Object.defineProperty(message, "value", {
      configurable: true,
      value: "Autofilled message",
    });

    name.closest("form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(buildContactMailto).toHaveBeenCalledWith("mark@example.com", {
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "Autofilled subject",
      message: "Autofilled message",
    });
  });
});
