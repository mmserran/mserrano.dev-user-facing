"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import SectionDivider from "@/components/typography/SectionDivider";
import { getMobileMosaic, type Project } from "@/lib/content";
import MobileDeviceFrame, { MOBILE_DEVICE_POOL, type MobileDeviceKey } from "./MobileDeviceFrame";
import { usePrefersReducedMotion } from "./ProjectTileImage";

const ROW_HEIGHT_PX = 500;
const MIN_COLUMNS = 3;
const COLUMN_WIDTH_PX = 240;
const INITIAL_ROW_COUNT = 4; // 1 + income_buffer(3), ported from pbMobileMozaicActual.vue
const INCOME_BUFFER_ROWS = 3;
const SCROLL_PX_PER_SECOND = 200;
const SCROLL_OFFSET_PX = 750;
const OFFSET_THROTTLE_MS = 300;

const OFFSET_SPECIAL_POOL = ["0%", "100%", "slowScrollFromTop", "footerScrollUp", "midScroll", "midScroll"];
const OFFSET_NORMAL_POOL = ["33%", "66%", "rand%", "rand%", "rand%"];

interface Cell {
  device: MobileDeviceKey;
  offset: string;
  screenshot: string;
}

interface RowState {
  generation: number;
  topPx: number;
  cells: Cell[];
}

// A draw-without-replacement pool: pops unique items until empty, then
// reshuffles and refills from `source`. Ports get_randomScreen/
// get_randomDevice's "no repeats until every item's had a turn" behavior.
class DrawPool<T> {
  private pool: T[] = [];
  constructor(private readonly source: readonly T[]) {}
  draw(): T {
    if (this.pool.length === 0) {
      this.pool = [...this.source];
      for (let i = this.pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]];
      }
    }
    return this.pool.pop() as T;
  }
}

// Ports get_randomOffset: most draws favor one of the "special" curves (a
// static top/bottom crop or a named pan), a third favor a plain static crop,
// and every draw has a chance of ignoring both pools for a flat random
// percentage instead - a literal port of pbMobileMozaicActual.vue's
// animation.throttle, toggled on a 300ms interval independent of any single
// device frame, so the mosaic never settles into an obviously repeating
// pattern across rows drawn in the same window.
function drawOffset(throttled: boolean, specialPool: string[], normalPool: string[]): string {
  const rng = Math.random();
  if (throttled) {
    return `${rng * 100}%`;
  }
  if (rng < 0.25 || rng > 0.6) {
    if (specialPool.length === 0) specialPool.push(...OFFSET_SPECIAL_POOL);
    return specialPool.pop() as string;
  }
  if (normalPool.length === 0) normalPool.push(...OFFSET_NORMAL_POOL);
  const value = normalPool.pop() as string;
  return value === "rand%" ? `${rng * 100}%` : value;
}

function subscribeNever() {
  return () => {};
}

// Row layout depends on measuring the container's real width and picks are
// genuinely random, so - like the Vue original's <ClientOnly> wrapper -
// nothing renders until after hydration. useSyncExternalStore (rather than a
// useState+useEffect flip) matches this codebase's usePrefersReducedMotion:
// mounted-ness never changes once true, so it never actually needs to
// notify a subscriber - only to disagree between the server and first
// client snapshot.
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

// Renders the project's pbMobileMozaic block: an endlessly-recycling,
// tilted collage of the project's own mobile screenshots. Ported from
// pbMobileMozaicActual.vue - see MobileDeviceFrame for the per-frame pan
// curves. Renders nothing when the block is absent or the project has no
// mobile screenshots to draw from (e.g. mserrano-dev).
//
// Deliberate deviation from the Vue source: pbMobileMozaicActual.vue draws
// one screenshot per row (list_row.src) and shares it across every cell in
// that row, so several phones in the same row often show the same capture.
// Here each cell draws its own screenshot instead, for more variety per
// row - device and offset selection are still drawn per cell exactly as
// upstream.
export default function MobileMosaic({ project }: { project: Project }) {
  const { title, screenshots } = getMobileMosaic(project);
  const reducedMotion = usePrefersReducedMotion();
  const mounted = useMounted();

  const [columnCount, setColumnCount] = useState(0);
  const [rows, setRows] = useState<RowState[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const columnCountRef = useRef(0);
  const generationRef = useRef(0);
  const screenshotPoolRef = useRef<DrawPool<string> | null>(null);
  const devicePoolRef = useRef<DrawPool<MobileDeviceKey> | null>(null);
  const offsetPoolsRef = useRef({ special: [] as string[], normal: [] as string[] });
  const throttleRef = useRef(false);
  const pausedRef = useRef(false);
  const rowMetaRef = useRef({ numRow: 0, numAdded: 0, ptrFirstChild: 0 });

  useEffect(() => {
    if (!mounted || screenshots.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    function updateColumnCount() {
      const width = container!.clientWidth;
      const next = Math.max(MIN_COLUMNS, Math.floor(width / COLUMN_WIDTH_PX));
      columnCountRef.current = next;
      setColumnCount(next);
    }

    // Read synchronously on mount (matches Carousel.tsx's own
    // ResizeObserver convention) rather than relying solely on the
    // observer's own initial callback, which real browsers fire
    // asynchronously and test doubles may not fire at all.
    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [mounted, screenshots.length]);

  // The animated infinite-scroll system. Skipped entirely under reduced
  // motion, which instead renders one static row further down. Reads
  // columnCountRef rather than the columnCount state: the ResizeObserver
  // effect above already updated the ref synchronously within this same
  // commit, but this effect doesn't depend on the columnCount state itself -
  // gating on that stale state value would leave this effect permanently
  // skipped once mount's first pass reads it before the resize observer
  // effect (declared above) has had a chance to run.
  useEffect(() => {
    if (!mounted || reducedMotion || screenshots.length === 0 || columnCountRef.current === 0) return;

    screenshotPoolRef.current = new DrawPool(screenshots);
    devicePoolRef.current = new DrawPool(MOBILE_DEVICE_POOL);
    offsetPoolsRef.current = { special: [], normal: [] };
    rowMetaRef.current = { numRow: 0, numAdded: 0, ptrFirstChild: 0 };

    function buildRow(topPx: number): RowState {
      const cells: Cell[] = [];
      for (let i = 0; i < columnCountRef.current; i++) {
        cells.push({
          device: devicePoolRef.current!.draw(),
          offset: drawOffset(throttleRef.current, offsetPoolsRef.current.special, offsetPoolsRef.current.normal),
          screenshot: screenshotPoolRef.current!.draw(),
        });
      }
      generationRef.current += 1;
      return { generation: generationRef.current, topPx, cells };
    }

    function recycleRow() {
      const meta = rowMetaRef.current;
      const ptr = meta.ptrFirstChild;
      const topPx = ROW_HEIGHT_PX * (meta.numRow + meta.numAdded);
      meta.numAdded += 1;
      meta.ptrFirstChild = (meta.numRow + meta.numAdded) % meta.numRow;
      setRows((prev) => {
        const next = [...prev];
        next[ptr] = buildRow(topPx);
        return next;
      });
    }

    let rafHandle: number;
    let animationStart: number | null = null;
    function tick(timestamp: number) {
      // Builds the initial rows here, in the first animation-frame callback,
      // rather than synchronously in the effect body - setting up an
      // external system's initial state belongs in the callback that starts
      // driving it, not the effect body itself (react-hooks/set-state-in-effect).
      if (rowMetaRef.current.numRow === 0) {
        const initialRows: RowState[] = [];
        for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
          initialRows.push(buildRow(ROW_HEIGHT_PX * rowMetaRef.current.numRow));
          rowMetaRef.current.numRow += 1;
        }
        setRows(initialRows);
      }
      if (!pausedRef.current && stageRef.current) {
        if (animationStart === null) animationStart = timestamp;
        const scrollPosition = ((timestamp - animationStart) / 1000) * -SCROLL_PX_PER_SECOND;
        const meta = rowMetaRef.current;
        const currentRange = (meta.numRow + meta.numAdded - 1) * ROW_HEIGHT_PX;
        const neededRange = -scrollPosition + ROW_HEIGHT_PX * INCOME_BUFFER_ROWS;
        if (neededRange > currentRange) {
          recycleRow();
        }
        stageRef.current.style.transform = `translateY(${scrollPosition - SCROLL_OFFSET_PX}px)`;
      }
      rafHandle = requestAnimationFrame(tick);
    }
    rafHandle = requestAnimationFrame(tick);

    function handleVisibilityChange() {
      pausedRef.current = document.hidden;
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const throttleInterval = setInterval(() => {
      throttleRef.current = !throttleRef.current;
    }, OFFSET_THROTTLE_MS);

    return () => {
      cancelAnimationFrame(rafHandle);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(throttleInterval);
    };
    // columnCountRef deliberately only seeds the initial build - a later
    // resize updates the ref for rows recycled from then on, matching
    // pbMobileMozaicActual.vue (existing rows keep whatever column count
    // they were built with).
  }, [mounted, reducedMotion, screenshots]);

  if (screenshots.length === 0) {
    return null;
  }

  const headingId = "mobile-mosaic-heading";

  return (
    <section aria-labelledby={headingId} className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
      <SectionDivider>
        <span id={headingId}>{title}</span>
      </SectionDivider>

      <div className="mt-8">
        {mounted && (
          <div ref={containerRef} aria-hidden="true" className="relative h-[500px] w-full overflow-hidden">
            {reducedMotion ? (
              <StaticMosaicRow screenshots={screenshots} columnCount={columnCount} />
            ) : (
              <div className="animate-mosaic-roll">
                <div ref={stageRef} className="relative">
                  {rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="absolute left-0 flex h-[500px] w-full items-center justify-center"
                      style={{ top: row.topPx }}
                    >
                      {row.cells.map((cell, cellIndex) => (
                        <div
                          key={`${row.generation}-${cellIndex}`}
                          className={`flex min-w-60 flex-1 justify-center ${cellIndex % 2 === 1 ? "-translate-y-[250px]" : ""}`}
                        >
                          <MobileDeviceFrame
                            filename={cell.screenshot}
                            device={cell.device}
                            offset={cell.offset}
                            reducedMotion={false}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Under prefers-reduced-motion: one static, untilted row - no perspective
// rotation, no infinite scroll, no per-image pan (WCAG 2.2.2 has no
// accommodation on the live site otherwise, since its animation never stops).
function StaticMosaicRow({ screenshots, columnCount }: { screenshots: string[]; columnCount: number }) {
  const poolsRef = useRef({
    screenshot: new DrawPool(screenshots),
    device: new DrawPool(MOBILE_DEVICE_POOL),
  });
  const [row, setRow] = useState<{ screenshot: string; device: MobileDeviceKey }[] | null>(null);

  // Drawing mutates the pools, so it belongs in an effect, not render -
  // otherwise an unrelated re-render (e.g. React StrictMode's double-render)
  // would silently reshuffle the visible row.
  useEffect(() => {
    if (columnCount === 0) return;
    setRow(
      Array.from({ length: columnCount }, () => ({
        screenshot: poolsRef.current.screenshot.draw(),
        device: poolsRef.current.device.draw(),
      })),
    );
  }, [columnCount]);

  if (!row) return null;

  return (
    <div className="flex h-[500px] w-full items-center justify-center">
      {row.map((cell, index) => (
        <div key={index} className="flex min-w-60 flex-1 justify-center">
          <MobileDeviceFrame filename={cell.screenshot} device={cell.device} offset="0%" reducedMotion />
        </div>
      ))}
    </div>
  );
}
