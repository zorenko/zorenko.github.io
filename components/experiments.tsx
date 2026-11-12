"use client";

/* Experiments: live previews (home page cards, canvas tiles) and interactive demos (/experiments/).
   Previews loop only while on screen and the tab is visible. Reduced motion shows one still frame. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { afterPaint, cssVars, prefersReducedMotion } from "@/lib/dom";
import type { Experiment } from "@/content/experiments";
import { useScramble } from "./scramble";

/** Call tick every `ms` while `ref` is on screen and the page is visible. A data-phase (0–1) on an
    ancestor shifts the first tick, so repeated previews on the canvas don't all move in step. */
function useLoop(ref: RefObject<HTMLElement | null>, ms: number, tick: () => void, enabled = true) {
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || prefersReducedMotion()) return;
    const phase = Number(el.closest<HTMLElement>("[data-phase]")?.dataset.phase) || 0;
    const run = () => tickRef.current();
    let timer = 0;
    let seen = false;
    const sync = () => {
      const on = seen && !document.hidden;
      if (on && !timer) {
        timer = window.setTimeout(() => {
          run();
          timer = window.setInterval(run, ms);
        }, phase * ms);
      } else if (!on && timer) {
        clearTimeout(timer);
        clearInterval(timer);
        timer = 0;
      }
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
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [ref, ms, enabled]);
}

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

/* Scrambled text: the name and role resolve out of random glyphs, one letter at a time. A hidden copy of the
   final text (.q-scr-ghost) holds the width so the line never jumps. Plays once when it scrolls into view,
   again on hover of the card it sits in (looping there) or on the Replay button next to it. */

function ScrambleLine({ text, className, run, delay, labelled }: { text: string; className: string; run: number; delay: number; labelled: boolean }) {
  const { content, play } = useScramble(text, 50);
  useEffect(() => {
    if (run) play(delay);
  }, [run, delay, play]);
  return (
    <span className={`q-scr-line ${className}`} aria-label={labelled ? text : undefined}>
      <span className="q-scr-ghost" aria-hidden="true">{text}</span>
      <span className="q-scr-live" aria-hidden="true">{content}</span>
    </span>
  );
}

export function ScrambleName({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0);
  const play = useCallback(() => setRun((r) => r + 1), []);
  const [inCard, setInCard] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const card = el.closest("a");
    const replay = el.closest(".q-xp")?.querySelector("[data-replay]");
    setInCard(!!card);
    card?.addEventListener("pointerenter", play);
    replay?.addEventListener("click", play);
    let once: IntersectionObserver | undefined;
    if (!prefersReducedMotion()) {
      once = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          play();
          once?.disconnect();
        }
      });
      once.observe(el);
    }
    return () => {
      card?.removeEventListener("pointerenter", play);
      replay?.removeEventListener("click", play);
      once?.disconnect();
    };
  }, [play]);
  useLoop(ref, 3600, play, inCard);

  const lines = (
    <>
      <ScrambleLine text="Anastasia Zorenko" className="q-scr-name" run={run} delay={0} labelled={large} />
      <ScrambleLine text="Design engineer" className="q-scr-role" run={run} delay={220} labelled={large} />
    </>
  );
  return large ? (
    <div className="q-scr q-scr--lg" ref={ref as RefObject<HTMLDivElement>}>
      <span className="q-scr-mark" aria-hidden="true">az</span>
      <div className="q-scr-who">{lines}</div>
    </div>
  ) : (
    <span className="q-scr" ref={ref}>
      <span className="q-scr-mark">az</span>
      <span className="q-scr-who">{lines}</span>
    </span>
  );
}

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

const PREVIEWS: Record<Experiment["id"], () => ReactNode> = {
  "morphing-button": () => <MorphButton />,
  "scrambled-text": () => <ScrambleName />,
  "theme-switch": () => <ThemeMini size="md" />,
  "koi-and-birds": () => <KoiAndBirds />,
  "stamp-folder": () => <StampFolder size="md" />,
};

/** The interactive demo in its well, as a card (the /experiments/ list and each experiment's page) */
export function ExperimentDemo({ xp }: { xp: Experiment }) {
  const demo = {
    "morphing-button": <MorphButton interactive />,
    "scrambled-text": (
      <>
        <ScrambleName large />
        <button className="q-xp-replay" type="button" data-replay="">Replay</button>
      </>
    ),
    "theme-switch": <ThemeMini interactive size="lg" />,
    "koi-and-birds": <KoiAndBirds interactive />,
    "stamp-folder": <StampFolder interactive size="lg" />,
  }[xp.id];
  return <div className={xp.id === "koi-and-birds" ? "q-well q-well--scene" : "q-well q-well--lg"}>{demo}</div>;
}

/** The live preview on its own (home page experiments wall) */
export function ExperimentPreview({ xp }: { xp: Experiment }) {
  return <>{PREVIEWS[xp.id]()}</>;
}

/** Thumbnail with a live preview, then the title and one line about it */
export function ExperimentCardBody({ xp }: { xp: Experiment }) {
  return (
    <>
      <span className="q-thumb q-thumb--stage" aria-hidden="true">
        <span className="q-stage">{PREVIEWS[xp.id]()}</span>
      </span>
      <span className="q-card-text">
        <span>{xp.title}</span>
        <span className="q-muted">{xp.blurb}</span>
      </span>
    </>
  );
}
