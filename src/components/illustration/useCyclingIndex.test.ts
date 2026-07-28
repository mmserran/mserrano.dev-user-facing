import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCyclingIndex } from "./useCyclingIndex";

describe("useCyclingIndex", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at index 0 and advances after initialDelay and subsequent delays", () => {
    const delays = [2, 4, 3];
    const initialDelay = 1;

    const { result } = renderHook(() => useCyclingIndex(delays, initialDelay));

    // Initially at index 0
    expect(result.current).toBe(0);

    // Advance initialDelay (1 sec) -> advances to index (0 + 1) % 3 = 1
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1);

    // Next delay is delays[1] = 4 sec -> advances to index (1 + 1) % 3 = 2
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(2);

    // Next delay is delays[2] = 3 sec -> advances to index (2 + 1) % 3 = 0 (wrap around)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(0);

    // Next delay is delays[0] = 2 sec -> advances to index 1
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(1);
  });
});
