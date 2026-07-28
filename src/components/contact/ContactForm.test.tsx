import { render, screen, waitFor } from "@testing-library/react";
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
    vi.spyOn(window, "open").mockImplementation(() => null);
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
    const directEmailLink = screen.getByRole("link", {
      name: /mark@example\.com.*opens in a new window/i,
    });
    expect(directEmailLink).toHaveAttribute("href", "mailto:mark@example.com");
    expect(directEmailLink).toHaveAttribute("target", "_blank");
    expect(directEmailLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(
      screen.getByRole("button", { name: "How to let webmail open email links" }),
    ).toHaveAttribute("aria-describedby", "webmail-handler-help");
    const tooltip = document.getElementById("webmail-handler-help");
    expect(tooltip).toHaveTextContent(
      /allow your preferred webmail service to open email links/i,
    );
    expect(tooltip).toHaveClass(
      "fixed",
      "max-h-[calc(100vh-2rem)]",
      "w-[calc(100vw-2rem)]",
      "max-w-80",
    );
    expect(tooltip).not.toHaveClass("sm:absolute");
  }, 10_000);

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

  it("builds the draft from current form controls after DOM-only autofill", async () => {
    render(<ContactForm contactEmail="mark@example.com" />);

    const name = screen.getByRole("textbox", { name: /your name/i });
    const email = screen.getByRole("textbox", { name: /your e-mail/i });
    const subject = screen.getByRole("textbox", { name: /subject/i });
    const message = screen.getByRole("textbox", { name: /your message/i });

    const inputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const textareaValueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    inputValueSetter?.call(name, "Jane Doe");
    inputValueSetter?.call(email, "jane@example.com");
    inputValueSetter?.call(subject, "Autofilled subject");
    textareaValueSetter?.call(message, "Autofilled message");

    name.closest("form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await waitFor(() => {
      expect(buildContactMailto).toHaveBeenCalledWith("mark@example.com", {
        name: "Jane Doe",
        email: "jane@example.com",
        subject: "Autofilled subject",
        message: "Autofilled message",
      });
      expect(window.open).toHaveBeenCalledWith(
        "mailto:mark@example.com",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });
});
