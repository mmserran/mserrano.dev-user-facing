import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Preserve authored hrefs (including trailing slashes) so SEO URL assertions
// match next.config.ts trailingSlash: true without Next's production router.
vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname?: string };
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    const {
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      passHref: _passHref,
      prefetch: _prefetch,
      locale: _locale,
      legacyBehavior: _legacyBehavior,
      ...anchorProps
    } = rest;
    const resolved = typeof href === "string" ? href : (href.pathname ?? "");
    return createElement("a", { href: resolved, ...anchorProps }, children);
  },
}));

vi.mock("lottie-web/build/player/lottie_light", () => ({
  default: {
    loadAnimation: vi.fn(() => ({
      destroy: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
    })),
  },
}));
