"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { cssVars } from "@/lib/dom";
import type { ExperimentUI } from "./types";
import { useLoop } from "./use-loop";

/* Theme switch: a tiny page flips between light and dark; the icon spins and unblurs in.
   Drawn in em, so the size modifier's font-size scales the whole preview. */

export function ThemeMini({ interactive = false, size }: { interactive?: boolean; size: "md" | "lg" }) {
  const ref = useRef<HTMLElement>(null);
  const [dark, setDark] = useState(false);
  const [flips, setFlips] = useState(0);
  const flip = useCallback(() => {
    setDark((d) => !d);
    setFlips((n) => n + 1);
  }, []);
  useLoop(ref, 1800, flip, !interactive);

  const svg = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": true } as const;
  const inner = (
    <>
      <span className="q-mini-top">
        <span className="q-mini-mark" />
        <span className="q-mini-who">
          <span className="q-mini-line" style={cssVars({ "--w": "44em" })} />
          <span className="q-mini-line" style={cssVars({ "--w": "30em" })} />
        </span>
        {/* A new key per flip remounts the icon, which restarts its animation */}
        <span className="q-mini-icon" key={flips} data-anim={flips ? "" : undefined}>
          <svg className="q-mini-moon" {...svg} strokeLinejoin="round"><path d="M13.5 9.6A5.75 5.75 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1Z" /></svg>
          <svg className="q-mini-sun" {...svg}><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" /></svg>
        </span>
      </span>
      <span className="q-mini-body">
        <span className="q-mini-line" />
        <span className="q-mini-line" style={cssVars({ "--w": "86%" })} />
        <span className="q-mini-line" style={cssVars({ "--w": "58%" })} />
      </span>
    </>
  );
  const className = `q-mini q-mini--${size}${dark ? " is-dark" : ""}`;
  return interactive ? (
    <button className={className} type="button" data-mini="" aria-pressed={dark} aria-label="Dark preview" ref={ref as RefObject<HTMLButtonElement>} onClick={flip}>
      {inner}
    </button>
  ) : (
    <span className={className} data-mini="" ref={ref}>
      {inner}
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <ThemeMini size="md" />,
  demo: () => <ThemeMini interactive size="lg" />,
};
