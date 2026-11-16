"use client";

/* A demo: a self-contained page in public/demos/<name>/ (a `demo` entry in content/work.ts). The page is laid out at
   its own size (demo.width × demo.height) and scaled to fit, which keeps the demo's shape. With `browser` it sits in a
   Safari window on a wallpaper (components/browser.tsx) and the box is a card's 1180 × 696; without, it fills the box.
   Used by the work carousel's cards and at the top of a project page, so both show the same thing.

   It shows in steps, each over the last, so there's always something to see however slow the connection:
   1. A still of the demo as it opens (still.webp in the demo's folder), straight away, and on the server.
   2. Then, with a mouse or trackpad, the live demo in an iframe, fading in over the still once it has drawn.
      On a phone or tablet, where a demo this small can't be used, a recording of its walkthrough instead (tour.mp4),
      fetched only when it first plays: when it's on screen (in the carousel, in the middle card). It pauses
      elsewhere.
      With reduced motion, Save-Data or a 2G connection, the still stays.
   The stills and recordings are made by scripts/capture-demos.mjs. */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WorkMedia } from "@/content/work";
import { afterPaint, cssVars, prefersReducedMotion } from "@/lib/dom";
import { Browser } from "./browser";

export type DemoMedia = Extract<WorkMedia, { type: "demo" }>;

type Mode = "still" | "tour" | "live";

function pickMode(): Mode {
  if (matchMedia("(pointer: fine)").matches) return "live";
  const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (prefersReducedMotion() || net?.saveData || /2g/.test(net?.effectiveType ?? "")) return "still";
  return "tour";
}

export function Demo({ demo, className = "", inert, tabIndex }: {
  demo: DemoMedia;
  /** The box's look: the carousel passes its card style, a project page its own */
  className?: string;
  /** Starts inert (the carousel switches it on for the middle card, through .q-demo-frame) */
  inert?: boolean;
  tabIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("still");
  // The live demo or the recording has drawn: it fades in, and the still under it goes
  const [ready, setReady] = useState(false);
  const dir = demo.src.slice(0, demo.src.lastIndexOf("/") + 1);

  useEffect(() => setMode(pickMode()), []);

  // The scale follows the page's laid-out width: the box's, or the window's (transforms, like the carousel's, don't count)
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => el.style.setProperty("--demo-scale", String(e.contentRect.width / demo.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [demo.width]);

  // The live demo: shown once it has loaded, its fonts are in and it has painted
  useEffect(() => {
    if (mode !== "live") return;
    const iframe = iframeRef.current!;
    let cancel = () => {};
    const show = async () => {
      try {
        await iframe.contentDocument?.fonts.ready;
      } catch {}
      cancel = afterPaint(() => setReady(true));
    };
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentWindow?.location.href !== "about:blank") show();
    iframe.addEventListener("load", show);
    return () => {
      iframe.removeEventListener("load", show);
      cancel();
    };
  }, [mode]);

  // The recording: plays while it's on screen and, in the carousel, its card is in the middle (its frame isn't inert)
  useEffect(() => {
    if (mode !== "tour") return;
    const frame = ref.current!;
    const video = videoRef.current!;
    let seen = false;
    const sync = () => {
      if (seen && !frame.inert && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    }, { threshold: 0.4 });
    io.observe(frame);
    const mo = new MutationObserver(sync);
    mo.observe(frame, { attributes: true, attributeFilter: ["inert"] });
    document.addEventListener("visibilitychange", sync);
    const playing = () => setReady(true);
    video.addEventListener("playing", playing, { once: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("playing", playing);
    };
  }, [mode]);

  const { browser } = demo;
  const style: CSSProperties = {
    ...cssVars({ "--demo-ratio": browser ? "1180 / 696" : `${demo.width} / ${demo.height}` }),
    ...(demo.background ? { background: demo.background } : {}),
  };
  const frame = (
    <div className="q-demo-frame" inert={inert} ref={ref} data-ready={ready ? "" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="q-demo-still"
        src={`${dir}still.webp`}
        srcSet={`${dir}still.webp ${demo.width}w, ${dir}still@2x.webp ${demo.width * 2}w`}
        sizes="min(1000px, 86vw)"
        width={demo.width}
        height={demo.height}
        alt={demo.title}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {mode === "live" && (
        <iframe ref={iframeRef} src={demo.src} width={demo.width} height={demo.height} title={demo.title} loading="lazy" tabIndex={tabIndex} />
      )}
      {mode === "tour" && (
        <video ref={videoRef} src={`${dir}tour.mp4`} muted loop playsInline preload="none" aria-hidden="true" disablePictureInPicture />
      )}
    </div>
  );
  return (
    <div className={`q-demo ${className}`} data-demo="" data-glass={demo.glass ? "" : undefined} data-mode={mode} style={style}>
      {browser ? <Browser background={browser.background} url={browser.url} dark={browser.dark}>{frame}</Browser> : frame}
    </div>
  );
}
