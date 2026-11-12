"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentUI } from "./types";

/* Montage: the video editor from the video-editor repo, built as a static site into public/demos/video-editor/
   (`npm run build:portfolio` there) and shown in an iframe, opening a montage of Muster's screenshots on a loop.
   It's always the whole editor. Where there's less room than it needs (previews, the /experiments/ list, phones),
   it's laid out at a desktop width and scaled down to fit, so it still shows the canvas, timeline and side panel.
   Like Koi and Birds, the iframe loads the first time it scrolls into view and is told to pause whenever it's off
   screen or the tab is hidden. */

const SRC = "/demos/video-editor/index.html?project=/demos/video-editor/projects/tour/montage.json";
/** The narrowest the editor lays out well at, side panel and all; anything narrower is this, scaled down */
const EDITOR_WIDTH = 960;

export function Montage({ interactive = false }: { interactive?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const on = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const post = useCallback(() => frameRef.current?.contentWindow?.postMessage(on.current ? "play" : "pause", location.origin), []);

  useEffect(() => {
    const el = ref.current!;
    let seen = false;
    const sync = () => {
      on.current = seen && !document.hidden;
      if (on.current) setLoaded(true);
      post();
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    io.observe(el);
    ro.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [post]);

  // Below EDITOR_WIDTH the iframe keeps the box's shape at EDITOR_WIDTH wide and is scaled down into it
  const scale = box && box.w < EDITOR_WIDTH ? box.w / EDITOR_WIDTH : 1;
  const size = box && scale < 1 ? { width: EDITOR_WIDTH, height: box.h / scale, transform: `scale(${scale})` } : undefined;

  return (
    <span className={interactive ? "q-montage" : "q-montage q-montage--preview"} ref={ref}>
      {loaded && box && (
        <iframe
          ref={frameRef}
          src={SRC}
          style={size}
          title={interactive ? "Montage, a video editor" : ""}
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? undefined : -1}
          onLoad={post}
        />
      )}
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <Montage />,
  demo: () => <Montage interactive />,
  well: "editor",
};
