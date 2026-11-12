"use client";

/* Experiments wall (home page): a full-width masonry grid of live previews, about one screen tall. Modelled on the
   work grid at robably.net, with smaller tiles: columns about 250px wide; tiles of different heights, 6px apart;
   on hover the corners round right out and the preview eases in a little; every other column drifts down as the
   page scrolls past.

   There are only a few experiments, so they repeat, arranged so the same one never sits next to itself. Each
   column's tiles add up to the wall's height, the last one taking what's left, so the bottom edge is straight.
   The first tile of each experiment is a link; the repeats are hidden from screen readers and skipped by Tab. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Experiment } from "@/content/experiments";
import { cssVars, prefersReducedMotion } from "@/lib/dom";
import { ExperimentPreview } from "./experiments";

// Tile heights, as a share of the width (the reference's image shapes)
const RATIOS = [0.5625, 1.1425, 0.75, 1.3758, 0.9608, 0.5475, 0.85, 1.2];
const PAD = 3; // px round each tile, so 6px between them
const DRIFT = 0.06; // how far the odd columns drift, per px scrolled past the wall's top

// About 250px per column (smaller than the reference's 4 / 3 / 2 columns): 6 at 1440px wide, 4 at 1024, 2 on phones
const COLUMN = 250;
const columnsFor = (width: number) => Math.min(8, Math.max(2, Math.round(width / COLUMN)));

type Tile = { xp: Experiment; height: number; first: boolean; phase: string };

function layout(items: readonly Experiment[], width: number, inner: number, height: number) {
  const cols = columnsFor(width);
  const colW = inner / cols;
  const count = new Map<string, number>(); // how many times each experiment has been placed so far
  return Array.from({ length: cols }, (_, c) => {
    const tiles: Tile[] = [];
    let left = height;
    for (let k = 0; ; k++) {
      // The last tile takes what's left, once that's no more than a tall tile; none ends up thin
      const last = left <= colW * 1.45;
      // Narrow columns skip the flattest shapes: the previews shrink less than the tiles, and would be cut off
      const ratio = Math.max(RATIOS[(c * 3 + k * 5) % RATIOS.length], colW < 300 ? 0.8 : 0.62);
      const h = last ? left : Math.min((colW - PAD * 2) * ratio + PAD * 2, left - colW * 0.55);
      const xp = items[(c + k * 2) % items.length]; // neighbours across and below always differ
      // Each repeat of an experiment starts its loop at a different point (golden-ratio steps), so they don't move in step
      const n = count.get(xp.id) ?? 0;
      count.set(xp.id, n + 1);
      tiles.push({ xp, height: h, first: n === 0, phase: ((n * 0.618034) % 1).toFixed(2) });
      left -= h;
      if (last) break;
    }
    return tiles;
  });
}

export function ExperimentWall({ items }: { items: readonly Experiment[] }) {
  const ref = useRef<HTMLDivElement>(null);
  // Rendered first at the reference's default size, then measured
  const [size, setSize] = useState({ width: 1350, inner: 1332, height: 869 });
  const columns = useMemo(() => layout(items, size.width, size.inner, size.height), [items, size]);

  useEffect(() => {
    const el = ref.current!;
    const measure = () => {
      const cs = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setSize({ width: el.clientWidth, inner, height: el.clientHeight });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Odd columns drift down as the wall scrolls up past the top of the screen
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    let frame = 0;
    const drift = () => {
      frame = 0;
      const y = DRIFT * Math.max(0, -el.getBoundingClientRect().top);
      el.querySelectorAll<HTMLElement>(".q-wall-col:nth-child(even)").forEach((col) => {
        col.style.transform = y ? `translate3d(0, ${y}px, 0)` : "";
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(drift);
    };
    addEventListener("scroll", onScroll, { passive: true });
    drift();
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [columns]);

  return (
    // Previews scale with the columns (a little under full size at 1440px wide)
    <div className="q-wall" ref={ref} style={cssVars({ "--wall-z": Math.min(1.5, Math.max(0.8, size.inner / columnsFor(size.width) / COLUMN)).toFixed(3) })}>
      {columns.map((tiles, c) => (
        <div className="q-wall-col" key={c}>
          {tiles.map((t, k) => (
            <Link
              key={k}
              className="q-wall-tile"
              href={`/experiments/#${t.xp.id}`}
              style={{ height: t.height }}
              data-phase={t.phase}
              aria-label={t.first ? t.xp.title : undefined}
              aria-hidden={t.first ? undefined : true}
              tabIndex={t.first ? undefined : -1}
            >
              <span className="q-wall-well">
                <span className="q-stage">
                  <ExperimentPreview xp={t.xp} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
