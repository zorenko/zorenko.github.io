"use client";

import { useCallback, useRef, useState } from "react";
import { cssVars } from "@/lib/dom";
import type { ExperimentUI } from "./types";
import { useLoop } from "./use-loop";

/* Stamp folder: a frosted cover hinged on the left, with two stamps behind it. Hover (or focus) tilts the cover and
   the stamps peek out; a click swings it open and lays them side by side. Drawn in em (1em = 10px at full size), so the
   size modifier's font-size scales it. Previews loop closed → peek → open and change colour each time round. */

type FoldState = "idle" | "peek" | "open";
const FOLD_COLORS = [
  { id: "yellow", label: "Yellow", swatch: "#e9bf45" },
  { id: "pink", label: "Pink", swatch: "#e0369f" },
  { id: "black", label: "Black", swatch: "#222" },
] as const;
const FOLD_LOOP: FoldState[] = ["idle", "peek", "open", "idle"];

const FOLDER_ART = (
  <>
    <span className="q-fold-edge" />
    <span className="q-fold-back" />
    <span className="q-stamp q-stamp--a">
      <span className="q-stamp-art">
        <span className="q-stamp-v">静かな時間</span>
        <span className="q-stamp-v2">日本</span>
        <svg className="q-stamp-bird" viewBox="0 0 80 50" fill="none" stroke="#5a554c" strokeWidth=".8" strokeLinecap="round" aria-hidden="true">
          <path d="M2 44 C 20 38, 40 30, 78 18" />
          <path d="M18 40 q -4 -6 -10 -6 M30 36 q -2 -8 -8 -10 M46 30 q 4 -6 10 -6 M58 26 q 0 -7 6 -10 M66 22 q 6 -2 9 2" />
          <path d="M8 34 q 3 -2 6 -1 M22 26 q 3 0 4 3 M56 24 q 3 -3 5 -1" stroke="#c9a36a" />
          <path d="M30 26 c 2 -8 10 -12 17 -8 c 4 2 5 7 2 10 c -4 4 -12 4 -19 -2 z" fill="#ddd6c6" />
          <path d="M44 15 c 2 -3 6 -3 7 0 c 1 2 -1 4 -3 4" fill="#8a8170" />
          <path d="M51 16 l 4 1 l -4 1" />
          <path d="M28 25 l -8 -2 l 6 4" />
          <circle cx="48" cy="16" r=".7" fill="#222" stroke="none" />
          <path d="M40 28 l -1 5 M44 28 l 0 5" />
        </svg>
        <span className="q-stamp-val">63<small>円</small></span>
        <span className="q-stamp-np">NIPPON</span>
      </span>
    </span>
    <span className="q-stamp q-stamp--b">
      <span className="q-stamp-art">
        <span className="q-stamp-band"><span className="q-stamp-t">自由な鳥</span><span className="q-stamp-t2">日本の四季</span></span>
        <span className="q-stamp-sun" />
        <svg className="q-stamp-bird" viewBox="0 0 72 64" aria-hidden="true">
          <path d="M2 58 C 20 52, 46 50, 70 54" stroke="#3b2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M60 36 l 10 -8 l -2 12 z" fill="#1d2a55" />
          <ellipse cx="36" cy="34" rx="24" ry="20" fill="#3a8fd0" stroke="#1d2a55" strokeWidth="1.6" />
          <ellipse cx="34" cy="40" rx="16" ry="12" fill="#fbf6ea" stroke="#1d2a55" strokeWidth="1.2" />
          <path d="M44 30 c 8 2 14 8 12 16 c -6 0 -12 -6 -12 -16 z" fill="#2a6fa8" stroke="#1d2a55" strokeWidth="1.2" />
          <circle cx="26" cy="26" r="3.4" fill="#1d2a55" />
          <circle cx="27" cy="25" r="1" fill="#fff" />
          <path d="M17 28 l -7 2 l 7 3 z" fill="#f2a33a" stroke="#1d2a55" strokeWidth="1" />
          <circle cx="20" cy="34" r="3" fill="#ef7f7f" opacity=".7" />
          <path d="M32 54 l -2 4 M38 54 l 0 4" stroke="#1d2a55" strokeWidth="1.6" />
        </svg>
        <span className="q-stamp-price">84円</span>
        <span className="q-stamp-foot"><span>NIPPON</span><span>日本郵便</span></span>
      </span>
    </span>
    <span className="q-fold-cover">
      <span className="q-fold-title">集めたもの</span>
      <span className="q-fold-sub">Mini Archive</span>
      <span className="q-fold-rule" />
    </span>
  </>
);

export function StampFolder({ interactive = false, size }: { interactive?: boolean; size: "md" | "lg" }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<FoldState>("idle");
  const [color, setColor] = useState(0);
  const step = useRef(0);
  const advance = useCallback(() => {
    step.current = (step.current + 1) % FOLD_LOOP.length;
    if (step.current === 0) setColor((c) => (c + 1) % FOLD_COLORS.length);
    setState(FOLD_LOOP[step.current]);
  }, []);
  useLoop(ref, 1300, advance, !interactive);

  const className = `q-fold q-fold--${size}`;
  const folderClass = `q-fold-folder is-${state}`;
  const colorId = FOLD_COLORS[color].id;
  if (!interactive) {
    return (
      <span className={className} data-color={colorId} ref={ref}>
        <span className={folderClass}>{FOLDER_ART}</span>
      </span>
    );
  }
  const open = state === "open";
  const mouse = (e: React.PointerEvent) => e.pointerType === "mouse";
  return (
    <span className={className} data-color={colorId} ref={ref}>
      <button
        type="button"
        className={folderClass}
        aria-label="Mini Archive folder"
        aria-expanded={open}
        onPointerEnter={(e) => mouse(e) && !open && setState("peek")}
        onPointerLeave={(e) => mouse(e) && setState("idle")}
        onFocus={() => !open && setState("peek")}
        onBlur={() => setState("idle")}
        onClick={() => setState(open ? (matchMedia("(hover: hover)").matches ? "peek" : "idle") : "open")}
      >
        {FOLDER_ART}
      </button>
      <span className="q-fold-swatches" role="group" aria-label="Folder colour">
        {FOLD_COLORS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="q-fold-swatch"
            style={cssVars({ "--s": c.swatch })}
            aria-label={c.label}
            aria-pressed={i === color}
            onClick={() => setColor(i)}
          />
        ))}
      </span>
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <StampFolder size="md" />,
  demo: () => <StampFolder interactive size="lg" />,
};
