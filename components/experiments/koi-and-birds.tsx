"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentUI } from "./types";

/* Koi and birds: a self-contained page in public/demos/koi-and-birds/, shown in an iframe that fills the well.
   It loads the first time it scrolls into view, and is told to pause whenever it's off screen or the tab is hidden.
   Previews pick one of the three scenes from their data-phase, so the repeats on the wall and canvas differ. */

const GRID_SCENES = ["koi", "birds", "side"] as const;

export function KoiAndBirds({ interactive = false }: { interactive?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const on = useRef(false);
  const [src, setSrc] = useState<string | null>(null);
  const post = useCallback(() => frameRef.current?.contentWindow?.postMessage(on.current ? "play" : "pause", location.origin), []);

  useEffect(() => {
    const el = ref.current!;
    const phase = Number(el.closest<HTMLElement>("[data-phase]")?.dataset.phase) || 0;
    const url = `/demos/koi-and-birds/index.html?embed&scene=${GRID_SCENES[Math.floor(phase * 3) % 3]}${interactive ? "&panel" : ""}`;
    let seen = false;
    const sync = () => {
      on.current = seen && !document.hidden;
      if (on.current) setSrc((s) => s ?? url);
      post();
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [interactive, post]);

  return (
    <span className={interactive ? "q-scene" : "q-scene q-scene--preview"} ref={ref}>
      {src && (
        <iframe
          ref={frameRef}
          src={src}
          title={interactive ? "Koi and birds, drawn in a grid of characters" : ""}
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? undefined : -1}
          onLoad={post}
        />
      )}
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <KoiAndBirds />,
  demo: () => <KoiAndBirds interactive />,
  well: "scene",
};
