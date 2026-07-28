import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ContactForm from "./ContactForm";

describe("ContactForm", () => {
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
});
