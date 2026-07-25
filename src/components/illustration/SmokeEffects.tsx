"use client";

import { useEffect, useState } from "react";
import { scaledWidth } from "./scaling";

type Pipe = "far-left" | "left";

// Which chimney puffs, in order, before repeating: twice on the taller/back
// pipe, then once on the shorter/front one. Each entry is a single, finite
// play (not a looping CSS animation) - a fresh mount every time, with a
// pause between plays, so nothing ever needs to line up with an in-flight
// CSS loop. That sidesteps the flashing/cut-off restarts a looping
// animation plus a separately-ticking JS timer kept producing.
const SEQUENCE: Pipe[] = ["far-left", "far-left", "left"];
const RISE_MS = 10_000; // matches the smoke-rise-* keyframes' 10s duration
const SAME_PIPE_PAUSE_MS = 670;
const SWITCH_PIPE_PAUSE_MS = 420;

function SmokeCluster({ playKey }: { playKey: number }) {
  return (
    <svg key={playKey} viewBox="0 0 76.94 212.41" aria-hidden="true" className="h-auto w-full">
      <circle
        cx="31.11"
        cy="202.98"
        r="6.75"
        fill="#fff"
        className="opacity-0 motion-reduce:opacity-75 animate-smoke-rise-br motion-reduce:animate-none"
      />
      <circle
        cx="22.11"
        cy="178.98"
        r="9"
        fill="#fff"
        className="opacity-0 motion-reduce:opacity-75 animate-smoke-rise-bl motion-reduce:animate-none"
      />
      <circle
        cx="41.11"
        cy="142.98"
        r="12"
        fill="#fff"
        className="opacity-0 motion-reduce:opacity-75 animate-smoke-rise-tr motion-reduce:animate-none"
      />
      <circle
        cx="21.11"
        cy="109.98"
        r="16"
        fill="#fff"
        className="opacity-0 motion-reduce:opacity-75 animate-smoke-rise-tl motion-reduce:animate-none"
      />
    </svg>
  );
}

export default function SmokeEffects() {
  const [step, setStep] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [visible, setVisible] = useState(true);

  // Rising phase: showing the current pipe's puffs for one finite play.
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), RISE_MS);
    return () => clearTimeout(timer);
  }, [visible, playKey]);

  // Paused phase: nothing visible, then advance to the next play. A switch
  // to a different pipe gets its own pause length from a same-pipe repeat.
  useEffect(() => {
    if (visible) return;
    const next = (step + 1) % SEQUENCE.length;
    const pauseMs = SEQUENCE[next] === SEQUENCE[step] ? SAME_PIPE_PAUSE_MS : SWITCH_PIPE_PAUSE_MS;
    const timer = setTimeout(() => {
      setStep(next);
      setPlayKey((k) => k + 1);
      setVisible(true);
    }, pauseMs);
    return () => clearTimeout(timer);
  }, [visible, step]);

  const activePipe = SEQUENCE[step];

  return (
    <>
      <div className="absolute top-[-14vw] left-0" style={scaledWidth(154)}>
        {visible && activePipe === "far-left" && <SmokeCluster playKey={playKey} />}
      </div>
      <div className="absolute top-[-9vw] left-[2vw]" style={scaledWidth(154)}>
        {visible && activePipe === "left" && <SmokeCluster playKey={playKey} />}
      </div>
    </>
  );
}
