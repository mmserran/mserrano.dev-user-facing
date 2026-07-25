import { useEffect, useState } from "react";

// Replicates the recursive setTimeout loop from the Vue `mounted()` hook in
// snippetEndcapMarkAnthonySerrano2020.vue (`play_nextTankExhibit` /
// `play_nextSmokeEffect`): starts at index 0, waits `initialDelay` seconds,
// then advances through `delays` (seconds per step, wrapping around)
// indefinitely.
export function useCyclingIndex(delays: number[], initialDelay: number): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let current = 0;

    function scheduleNext(delaySeconds: number) {
      timeoutId = setTimeout(() => {
        current = (current + 1) % delays.length;
        setIndex(current);
        scheduleNext(delays[current]);
      }, delaySeconds * 1000);
    }

    scheduleNext(initialDelay);
    return () => clearTimeout(timeoutId);
  }, [delays, initialDelay]);

  return index;
}
