"use client";

import { useEffect, useState } from "react";
import { scaledWidth } from "./scaling";

// [smoke-far-left, smoke-left] active durations in seconds, matching
// snippetEndcapMarkAnthonySerrano2020.vue's play_nextSmokeEffect eventDelay.
const CLUSTER_ACTIVE_SECONDS = [20, 10];

function SmokeCluster({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 76.94 212.41"
      aria-hidden="true"
      className={`h-auto w-full ${active ? "opacity-100" : "opacity-0"}`}
    >
      <circle
        cx="31.11"
        cy="202.98"
        r="6.75"
        fill="#fff"
        className={`opacity-75 ${active ? "animate-smoke-rise-br motion-reduce:animate-none" : ""}`}
      />
      <circle
        cx="22.11"
        cy="178.98"
        r="9"
        fill="#fff"
        className={`opacity-75 ${active ? "animate-smoke-rise-bl motion-reduce:animate-none" : ""}`}
      />
      <circle
        cx="41.11"
        cy="142.98"
        r="12"
        fill="#fff"
        className={`opacity-75 ${active ? "animate-smoke-rise-tr motion-reduce:animate-none" : ""}`}
      />
      <circle
        cx="21.11"
        cy="109.98"
        r="16"
        fill="#fff"
        className={`opacity-75 ${active ? "animate-smoke-rise-tl motion-reduce:animate-none" : ""}`}
      />
    </svg>
  );
}

// Ported from the smoke-effect portion of
// snippetEndcapMarkAnthonySerrano2020.vue: two copies of the same puff
// cluster, alternated by a recursive timer (far-left active 20s, then left
// 10s, repeating forever). Toggling which cluster is active restarts its
// rise/fade keyframes from the top, same as the Vue original's class binding.
export default function SmokeEffects() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = (index: number) => {
      timeoutId = setTimeout(() => {
        const next = (index + 1) % CLUSTER_ACTIVE_SECONDS.length;
        setActiveIndex(next);
        advance(next);
      }, CLUSTER_ACTIVE_SECONDS[index] * 1000);
    };

    advance(0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <div className="absolute top-[-14vw] left-0" style={scaledWidth(154)}>
        <SmokeCluster active={activeIndex === 0} />
      </div>
      <div className="absolute top-[-9vw] left-[2vw]" style={scaledWidth(154)}>
        <SmokeCluster active={activeIndex === 1} />
      </div>
    </>
  );
}
