"use client";

/* Experiments canvas: a second view of /experiments/, an endless board of experiment cards in staggered columns
   that you drag, scroll or arrow-key around. Also renders the List / Canvas switch in the top-right corner.
   The board is a fixed pool of tiles that wraps around as you pan, so nothing is created or destroyed mid-drag.
   The choice is remembered; the inline script in the root layout's <head> applies it before first paint. */

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/dom";
import { EXPERIMENTS, experimentHref } from "@/content/experiments";
import { ExperimentCardBody } from "./experiments";

const KEY = "q-xp-view";
const GAP = 20;
const DECAY = 0.995; // velocity kept per millisecond while gliding
const STEP = 180; // arrow-key move
const mod = (a: number, n: number) => ((a % n) + n) % n;

type View = "list" | "canvas";
type Controller = { setView: (view: View, save?: boolean) => void };

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{children}</svg>
);
const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "list", label: "List", icon: icon(<><rect x="2.25" y="2.75" width="11.5" height="4.25" rx="1.25" /><rect x="2.25" y="9" width="11.5" height="4.25" rx="1.25" /></>) },
  { id: "canvas", label: "Canvas", icon: icon(<><rect x="2.25" y="2.25" width="5" height="6.5" rx="1.25" /><rect x="2.25" y="10.75" width="5" height="3" rx="1.25" /><rect x="8.75" y="2.25" width="5" height="3" rx="1.25" /><rect x="8.75" y="7.25" width="5" height="6.5" rx="1.25" /></>) },
];

export function ExperimentsCanvas() {
  const cvRef = useRef<HTMLElement>(null);
  const tileEls = useRef<(HTMLAnchorElement | null)[]>([]);
  const ctl = useRef<Controller | null>(null);
  const btnRefs = useRef<Record<View, HTMLButtonElement | null>>({ list: null, canvas: null });
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });
  const [view, setViewState] = useState<View>("list");
  const router = useRouter();

  useEffect(() => {
    const cv = cvRef.current!;
    const root = document.documentElement;
    const reduce = prefersReducedMotion();
    const n = EXPERIMENTS.length;
    type Tile = { i: number; j: number; el: HTMLAnchorElement };
    let tiles: Tile[] = [];
    let cols = 0, rows = 0, cw = 0, ch = 0, th = 0, px = 0, py = 0;
    let centre: HTMLElement | null = null;

    // Enough columns and rows to cover the viewport plus one spare on each side. Columns come in multiples of
    // 2 × the card count and rows in multiples of the card count, so a tile shows the same card wherever it wraps to.
    const build = () => {
      const needCols = Math.ceil(innerWidth / (248 + GAP)) + 2;
      const needRows = Math.ceil(innerHeight / 200) + 3;
      if (tiles.length && needCols <= cols && needRows <= rows) return false;
      cols = Math.ceil(needCols / (2 * n)) * 2 * n;
      rows = Math.ceil(needRows / n) * n;
      flushSync(() => setGrid({ cols, rows }));
      tiles = [];
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) tiles.push({ i, j, el: tileEls.current[i * rows + j]! });
      measure();
      return true;
    };
    // Cells fit the tallest card, so re-measure once the web fonts land
    const measure = () => {
      th = Math.max(...tiles.slice(0, n).map((t) => t.el.offsetHeight));
      cw = tiles[0].el.offsetWidth + GAP;
      ch = th + GAP;
    };

    const place = () => {
      const w = cols * cw, h = rows * ch;
      const cx = innerWidth / 2, cy = innerHeight / 2;
      let best: HTMLElement | null = null, bestD = Infinity;
      for (const t of tiles) {
        const x = mod(t.i * cw + px + cw, w) - cw;
        const y = mod(t.j * ch + (t.i % 2 ? ch / 2 : 0) + py + ch, h) - ch;
        t.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        const d = Math.hypot(x + cw / 2 - cx, y + th / 2 - cy);
        if (d < bestD) { bestD = d; best = t.el; }
      }
      if (best !== centre) {
        centre?.removeAttribute("data-centre");
        best?.setAttribute("data-centre", "");
        centre = best;
      }
    };

    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; place(); }); };
    const pan = (dx: number, dy: number) => { px += dx; py += dy; schedule(); };

    // Glide: keeps the release velocity and lets it decay, like a flicked list
    let vx = 0, vy = 0, glideRaf = 0;
    const stopGlide = () => { cancelAnimationFrame(glideRaf); glideRaf = 0; vx = vy = 0; };
    const glide = (v0x: number, v0y: number) => {
      stopGlide();
      if (reduce) return;
      vx = v0x; vy = v0y;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(now - last, 32);
        last = now;
        px += vx * dt; py += vy * dt;
        place();
        const k = DECAY ** dt;
        vx *= k; vy *= k;
        glideRaf = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(tick) : 0;
      };
      glideRaf = requestAnimationFrame(tick);
    };
    // Move by about (dx, dy), easing out: the start velocity that a glide with DECAY carries that far
    const nudge = (dx: number, dy: number) => {
      if (reduce) return pan(dx, dy);
      const s = -Math.log(DECAY);
      glide(vx + dx * s, vy + dy * s);
    };

    // Drag with mouse, pen or touch. A 4px dead zone keeps taps and clicks on cards working.
    type Drag = { id: number; sx: number; sy: number; x: number; y: number; moving: boolean; trail: { x: number; y: number; t: number }[] };
    let drag: Drag | null = null, dragged = false;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      stopGlide();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moving: false, trail: [] };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moving) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
        drag.moving = true;
        try { cv.setPointerCapture(e.pointerId); } catch {}
        cv.setAttribute("data-dragging", "");
      }
      pan(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX; drag.y = e.clientY;
      drag.trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      while (drag.trail.length > 2 && e.timeStamp - drag.trail[0].t > 90) drag.trail.shift();
    };
    const release = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { moving, trail } = drag;
      drag = null;
      if (!moving) return;
      cv.removeAttribute("data-dragging");
      dragged = true;
      setTimeout(() => { dragged = false; });
      const a = trail[0], b = trail[trail.length - 1];
      const dt = b && b.t - a.t;
      if (e.type === "pointerup" && dt > 0 && e.timeStamp - b.t < 60) {
        const cap = (v: number) => Math.max(-3, Math.min(3, v));
        glide(cap((b.x - a.x) / dt), cap((b.y - a.y) / dt));
      }
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();

    // Trackpad and wheel pan in both directions; pinch (ctrlKey) is left to the browser
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      stopGlide();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      const swapAxes = e.shiftKey && !e.deltaX;
      pan(-(swapAxes ? e.deltaY : e.deltaX) * unit, -(swapAxes ? 0 : e.deltaY) * unit);
    };

    // Keyboard: arrows move, Enter opens the card nearest the middle
    const KEYS: Record<string, [number, number]> = { ArrowLeft: [STEP, 0], ArrowRight: [-STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };
    const onKeyDown = (e: KeyboardEvent) => {
      if (KEYS[e.key]) { e.preventDefault(); nudge(...KEYS[e.key]); }
      else if (e.key === "Enter" && centre) { e.preventDefault(); router.push(centre.getAttribute("href")!); }
    };

    // Cards open the experiment's own page; a click that ends a drag opens nothing
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (dragged) { e.preventDefault(); e.stopPropagation(); return; }
      if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); router.push(link.getAttribute("href")!); }
    };

    const refit = () => {
      if (root.dataset.xpView !== "canvas") return;
      if (!build()) measure();
      place();
    };

    const setView = (next: View, save = true) => {
      const canvas = next === "canvas";
      if (canvas) root.dataset.xpView = "canvas";
      else delete root.dataset.xpView;
      setViewState(next);
      if (save) try { canvas ? localStorage.setItem(KEY, "canvas") : localStorage.removeItem(KEY); } catch {}
      if (!canvas) return;
      stopGlide();
      if (build()) {
        // first row starts under the hint, columns centred in the window
        px = Math.round((innerWidth - (Math.floor(innerWidth / cw) * cw - GAP)) / 2);
        py = 88;
      }
      place();
    };
    ctl.current = { setView };

    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("dragstart", onDragStart);
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.addEventListener("keydown", onKeyDown);
    cv.addEventListener("click", onClick, true);
    addEventListener("resize", refit);
    let alive = true;
    document.fonts?.ready.then(() => alive && refit());

    // Canvas when the head script already chose it, or when arriving here by a link with the canvas remembered
    let stored = false;
    try { stored = !location.hash && localStorage.getItem(KEY) === "canvas"; } catch {}
    const first = requestAnimationFrame(() => setView(root.dataset.xpView === "canvas" || stored ? "canvas" : "list", false));

    return () => {
      alive = false;
      cancelAnimationFrame(first);
      cancelAnimationFrame(frame);
      stopGlide();
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", release);
      cv.removeEventListener("pointercancel", release);
      cv.removeEventListener("dragstart", onDragStart);
      cv.removeEventListener("wheel", onWheel);
      cv.removeEventListener("keydown", onKeyDown);
      cv.removeEventListener("click", onClick, true);
      removeEventListener("resize", refit);
      delete root.dataset.xpView; // other pages scroll normally
      ctl.current = null;
    };
  }, [router]);

  const n = EXPERIMENTS.length;
  const step = n > 2 ? 2 : 1; // neighbours, including the staggered ones, never repeat a card
  const tiles = [];
  for (let i = 0; i < grid.cols; i++) {
    for (let j = 0; j < grid.rows; j++) {
      const idx = i * grid.rows + j;
      const xp = EXPERIMENTS[mod(step * i + j, n)];
      tiles.push(
        <a
          key={`${i}-${j}`}
          className="q-cv-tile"
          href={experimentHref(xp)}
          tabIndex={-1}
          data-phase={(((i * 7 + j * 3) % 10) / 10).toFixed(1)}
          ref={(el) => { tileEls.current[idx] = el; }}
        >
          <ExperimentCardBody xp={xp} />
        </a>,
      );
    }
  }

  return (
    <>
      <div
        className="q-views"
        role="radiogroup"
        aria-label="View"
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
          e.preventDefault();
          const next: View = view === "list" ? "canvas" : "list";
          ctl.current?.setView(next);
          btnRefs.current[next]?.focus();
        }}
      >
        <span className="q-views-pill" aria-hidden="true" />
        {VIEWS.map((v) => (
          <button
            key={v.id}
            ref={(el) => { btnRefs.current[v.id] = el; }}
            type="button"
            role="radio"
            data-view={v.id}
            aria-label={v.label}
            aria-checked={view === v.id}
            tabIndex={view === v.id ? 0 : -1}
            onClick={() => ctl.current?.setView(v.id)}
          >
            {v.icon}
            <span className="q-views-tip" aria-hidden="true">{v.label}</span>
          </button>
        ))}
      </div>
      <section className="q-cv" tabIndex={0} aria-label="Experiments canvas. Arrow keys move around, Enter opens the card in the middle." ref={cvRef}>
        <ul className="q-sr">
          {EXPERIMENTS.map((xp) => (
            <li key={xp.id}>
              <a href={experimentHref(xp)} tabIndex={-1}>{xp.title}</a>
            </li>
          ))}
        </ul>
        <div className="q-cv-layer" aria-hidden="true">{tiles}</div>
      </section>
      <div className="q-cv-hint" aria-hidden="true">
        <b>Experiments</b>
        <span>Drag to explore</span>
      </div>
    </>
  );
}
