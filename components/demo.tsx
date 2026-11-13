"use client";

/* A live demo: a self-contained page in public/demos/<name>/ (a `demo` entry in content/work.ts), shown in an iframe.
   The page is laid out at its own size (demo.width × demo.height) and scaled to fit the box, which keeps the demo's
   shape. Used by the work carousel's cards and at the top of a project page, so both show the same thing. */

import { useEffect, useRef, type CSSProperties } from "react";
import type { WorkMedia } from "@/content/work";
import { cssVars } from "@/lib/dom";

export type DemoMedia = Extract<WorkMedia, { type: "demo" }>;

export function Demo({ demo, className = "", inert, tabIndex }: {
  demo: DemoMedia;
  /** The box's look: the carousel passes its card style, a project page its own */
  className?: string;
  /** Starts inert (the carousel switches it on for the middle card, through .q-demo-frame) */
  inert?: boolean;
  tabIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The scale follows the box's laid-out width (transforms on it, like the carousel's, don't count)
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => el.style.setProperty("--demo-scale", String(e.contentRect.width / demo.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [demo.width]);

  const style: CSSProperties = {
    ...cssVars({ "--demo-ratio": `${demo.width} / ${demo.height}` }),
    ...(demo.background ? { background: demo.background } : {}),
  };
  return (
    <div className={`q-demo ${className}`} data-demo="" data-glass={demo.glass ? "" : undefined} style={style} ref={ref}>
      <div className="q-demo-frame" inert={inert}>
        <iframe src={demo.src} width={demo.width} height={demo.height} title={demo.title} loading="lazy" tabIndex={tabIndex} />
      </div>
    </div>
  );
}
