"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { afterPaint, prefersReducedMotion } from "@/lib/dom";
import type { ExperimentUI } from "./types";
import { useLoop } from "./use-loop";

/* Morphing button: a hidden sizer holds the next state; the width animates to it, and the icon and label
   slide through clipped cells while the old ones pop out of the layout. */

const morphIcon = (children: ReactNode) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const MORPH_STATES = [
  {
    label: "Copy email",
    icon: morphIcon(<><rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1.75" /><path d="M10.75 5.25V3.5c0-.7-.55-1.25-1.25-1.25h-6c-.7 0-1.25.55-1.25 1.25v6c0 .7.55 1.25 1.25 1.25h1.75" /></>),
  },
  { label: "Copied", ok: true, icon: morphIcon(<path d="m3 8.5 3.25 3L13 4.5" />) },
  { label: "Say hello", icon: morphIcon(<><path d="M3 8h10" /><path d="m9 4 4 4-4 4" /></>) },
];

type Swap = { key: number; state: number; phase: "static" | "in" | "out" };

export function MorphButton({ interactive = false }: { interactive?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState(0);
  const [swaps, setSwaps] = useState<Swap[]>([{ key: 0, state: 0, phase: "static" }]);
  const [ready, setReady] = useState(false);
  const counter = useRef({ key: 0, state: 0 });

  const fit = useCallback(() => {
    const btn = ref.current;
    const sizer = sizerRef.current;
    if (!btn || !sizer) return;
    const cs = getComputedStyle(btn);
    const chrome = [cs.paddingLeft, cs.paddingRight, cs.borderLeftWidth, cs.borderRightWidth].reduce((s, v) => s + parseFloat(v), 0);
    btn.style.width = `${Math.ceil(sizer.scrollWidth + chrome)}px`;
  }, []);

  const advance = useCallback(() => {
    const reduce = prefersReducedMotion();
    const c = counter.current;
    c.state = (c.state + 1) % MORPH_STATES.length;
    const key = ++c.key;
    setState(c.state);
    setSwaps((list) => [
      ...(reduce ? [] : list.map((s) => ({ ...s, phase: "out" as const }))),
      { key, state: c.state, phase: reduce ? "static" : "in" },
    ]);
    if (!reduce) window.setTimeout(() => setSwaps((list) => list.filter((s) => s.key >= key)), 200);
  }, []);

  useLayoutEffect(fit, [state, fit]);
  useEffect(() => {
    const ro = new ResizeObserver(fit); // web fonts landing late change the width
    ro.observe(sizerRef.current!);
    const cancel = afterPaint(() => setReady(true));
    return () => {
      ro.disconnect();
      cancel();
    };
  }, [fit]);
  useLoop(ref, 1450, advance, !interactive);

  const cell = (part: "icon" | "label") =>
    swaps.map((s) => (
      <span key={s.key} className={s.phase === "static" ? "q-swap" : `q-swap is-${s.phase}`} aria-hidden={s.phase === "out" ? true : undefined}>
        {part === "icon" ? MORPH_STATES[s.state].icon : MORPH_STATES[s.state].label}
      </span>
    ));
  const current = MORPH_STATES[state];
  const props = {
    className: `q-morph q-morph--lg${ready ? " is-ready" : ""}`,
    "data-morph": "",
    "data-ok": current.ok ? "" : undefined,
  };
  const inner = (
    <>
      <span className="q-morph-icon">{cell("icon")}</span>
      <span className="q-morph-label" aria-live={interactive ? "polite" : undefined}>{cell("label")}</span>
      <span className="q-morph-sizer" aria-hidden="true" ref={sizerRef}>
        <span className="q-morph-icon">{current.icon}</span>
        <span>{current.label}</span>
      </span>
    </>
  );
  return interactive ? (
    <button {...props} type="button" ref={ref as RefObject<HTMLButtonElement>} onClick={advance}>
      {inner}
    </button>
  ) : (
    <span {...props} ref={ref}>
      {inner}
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <MorphButton />,
  demo: () => <MorphButton interactive />,
};
