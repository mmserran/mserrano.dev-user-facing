import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BrowserDeviceFrame from "./BrowserDeviceFrame";

describe("BrowserDeviceFrame", () => {
  it("renders nothing when the screenshot has no manifest variants", () => {
    const { container } = render(<BrowserDeviceFrame filename="unknown.jpg" browser="chrome" animate={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the frame chrome and screenshot for a known screenshot", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    const frame = container.querySelector('img[src*="browser-chrome.svg"]');
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]');
    expect(frame).not.toBeNull();
    expect(screenshot).not.toBeNull();
  });

  it("squares off the bottom corners for the ie8 frame but rounds every other frame", () => {
    const { container: ie8Container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="ie8" animate={false} />,
    );
    const { container: chromeContainer } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    expect(ie8Container.querySelector(".rounded-b-\\[4px\\]")).toBeNull();
    expect(chromeContainer.querySelector(".rounded-b-\\[4px\\]")).not.toBeNull();
  });

  it("only applies the pan animation class when animate is true", () => {
    const { container, rerender } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    const screenshot = () => container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;
    expect(screenshot().className).not.toContain("animate-project-screenshot-pan");

    rerender(<BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />);
    expect(screenshot().className).toContain("animate-project-screenshot-pan");
  });
});
