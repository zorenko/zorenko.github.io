"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentUI } from "./types";

/* Montage: the video editor from the video-editor repo, built as a static site into public/demos/video-editor/
   (`npm run build:portfolio` there) and shown in an iframe, opening the sample montage of Muster's screenshots.
   Previews, and any demo too narrow for the editor's side panel (the /experiments/ list, phones), show its player
   page instead: the montage alone, playing on a loop. Like Koi and Birds, the iframe loads the first time it scrolls
   into view and is told to pause whenever it's off screen or the tab is hidden. */

const PROJECT = "/demos/video-editor/projects/tour/montage.json";
const EDITOR = `/demos/video-editor/index.html?project=${PROJECT}`;
const PLAYER = `/demos/video-editor/player/index.html?project=${PROJECT}`;
/** The narrowest well the whole editor fits in, side panel and all */
const EDITOR_MIN_WIDTH = 760;

export function Montage({ interactive = false }: { interactive?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const on = useRef(false);
  const [src, setSrc] = useState<string | null>(null);
  const post = useCallback(() => frameRef.current?.contentWindow?.postMessage(on.current ? "play" : "pause", location.origin), []);
  const editor = src === EDITOR;

  useEffect(() => {
    const el = ref.current!;
    let seen = false;
    const sync = () => {
      on.current = seen && !document.hidden;
      if (on.current) setSrc((s) => s ?? (interactive && el.clientWidth >= EDITOR_MIN_WIDTH ? EDITOR : PLAYER));
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
    <span className={editor ? "q-montage" : "q-montage q-montage--player"} ref={ref}>
      {src && (
        <iframe
          ref={frameRef}
          src={src}
          title={editor ? "Montage, a video editor" : ""}
          aria-hidden={editor ? undefined : true}
          tabIndex={editor ? undefined : -1}
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
