/* What the performance tests share: a probe in every page that records frames and slow work, a `measure()` that
   runs an interaction and reports how smooth it was, and the budgets those reports are held to.

   The probe (installed before any of the site's own code runs) keeps:
   - every frame of the top page, from requestAnimationFrame: a gap of two frames' time is a dropped frame;
   - long animation frames (50ms or more of work before a frame could be shown), with the scripts that took the
     time, in the page and in the demos' iframes;
   - layout shifts, interactions (event timing), the largest paint;
   - every CSS animation and transition that runs, with the properties it animates;
   - how often the site asks for a frame (requestAnimationFrame calls), to check it stops when nothing moves. */

import { test as base, expect, type CDPSession, type Page, type TestInfo } from "@playwright/test";

export const FRAME_MS = 1000 / 60;

/* Properties a browser can animate on the GPU alone, without layout or paint on every frame */
export const COMPOSITED = new Set(["transform", "translate", "rotate", "scale", "opacity", "filter", "backdrop-filter", "visibility"]);
/* Properties that move or resize things: animating one lays out the page again on every frame, the usual cause of
   stutter. Colours and the like only repaint, which is cheap for a short fade (a hover) but not on a loop. */
const LAYOUT = /^(width|height|(min|max)-(width|height)|top|left|right|bottom|inset.*|margin.*|padding.*|border(-\w+)?-width|font-size|line-height|letter-spacing|word-spacing|(row-|column-)?gap|flex(-basis|-grow|-shrink)?|grid-template-.*)$/;

/* Animations that break the rule above but are known and small enough to leave, each with why. A new entry here
   is a decision: prefer moving the animation to transform or opacity. Matched on the frame, the element and the
   property. */
export const KNOWN: { frame: RegExp; target: RegExp; prop: string; why: string }[] = [
  {
    frame: /^\/demos\/sanna\//,
    target: /^i\.t\d/,
    prop: "width",
    why: "Sanna demo: the three 3px step ticks beside the screen widen as the walkthrough moves on (8 → 24px, 250ms); measured with no dropped frames",
  },
  {
    frame: /^\/demos\/visuals\//,
    target: /^button\.tile\.is-looking::before$/,
    prop: "background-position-x",
    why: "Visuals demo: the shimmer over a tile while it 'looks' repaints that tile each frame, for about a second at a time; measured with no dropped frames",
  },
  {
    frame: /^\/demos\/visuals\//,
    target: /^button\.tile\.is-looking::before$/,
    prop: "background-position-y",
    why: "As above",
  },
  {
    frame: /^page$/,
    target: /^span\.q-dock-bg$/,
    prop: "inset",
    why: "The dock's glass grows into the menu (440ms): scaling it instead would stretch its rounded corners and its blur. One small element; measured smooth on a phone's CPU",
  },
  {
    frame: /^page$/,
    target: /^div#q-ts-[\w-]+\.q-ts-body$/,
    prop: "grid-template-rows",
    why: "How I work's steps open to their own height (320ms), pushing the steps below down: there's no transform for that. Measured smooth on a phone's CPU",
  },
];

/** The properties of an animation that make it lay out or repaint the page on every frame, less known ones */
export function costly(a: Animated) {
  // The browser's own view transition (the theme's cross-fade) sizes a snapshot of the page that never changes size
  if (a.name.startsWith("-ua-view-transition")) return [];
  return a.props.filter(
    (prop) =>
      (LAYOUT.test(prop) || (a.looping && !COMPOSITED.has(prop))) &&
      !KNOWN.some((k) => k.prop === prop && k.frame.test(a.frame) && k.target.test(a.target)),
  );
}

type Loaf = { at: number; duration: number; blocking: number; scripts: string[]; frame: string };
type Shift = { at: number; value: number; input: boolean; sources: string[] };
type Interaction = { at: number; name: string; duration: number };
type Animated = { at: number; kind: string; name: string; target: string; props: string[]; looping: boolean; frame: string };

declare global {
  interface Window {
    __perf: {
      frames: number[];
      loafs: Loaf[];
      shifts: Shift[];
      events: Interaction[];
      /** Chrome's largest-paint candidates; `slide` is the picture's place in a carousel slideshow, if it's in one */
      lcp: { at: number; size: number; element: string; slide?: number }[];
      /** When the page's first heading or paragraph was half and then fully visible (ms since navigation): what a
          visitor sees, which Chrome's paint timings miss for text that fades in on the GPU */
      text: { half?: number; full?: number };
      /** The same for the page's main picture (the middle work card's, or the first in main): loaded and half visible */
      picture: { half?: number; element?: string };
      animated: Animated[];
      rafCalls: number;
    };
  }
}

/* Runs in every frame, the page and each demo, before anything else. Times are absolute (timeOrigin + now), so
   the page's and the iframes' can be compared. */
/** Exported for one-off scripts (import it into a Playwright script and pass it to addInitScript) */
export function probe() {
  const t0 = performance.timeOrigin;
  const isTop = window === window.top;
  const frameName = () => (isTop ? "page" : location.pathname + location.search);
  const p: Window["__perf"] = { frames: [], loafs: [], shifts: [], events: [], lcp: [], text: {}, picture: {}, animated: [], rafCalls: 0 };
  Object.defineProperty(window, "__perf", { value: p });

  const describe = (n: Node | null | undefined) => {
    const el = n instanceof Element ? n : n?.parentElement;
    if (!el) return "?";
    const cls = typeof el.className === "string" ? el.className : el.getAttribute("class") ?? "";
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (cls ? "." + cls.trim().split(/\s+/).slice(0, 3).join(".") : "");
  };

  // The site's own frame requests are counted; the probe's loop below uses the original, so it isn't
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    p.rafCalls++;
    return raf(cb);
  };

  /* Every animation and transition, once, with what it animates. Caught as they start (CSS animations and
     transitions fire an event; script animations go through Element.animate), so watching costs nothing per frame. */
  const seen = new WeakSet<Animation>();
  const record = (a: Animation) => {
    if (seen.has(a)) return;
    seen.add(a);
    const effect = a.effect as KeyframeEffect | null;
    const props = new Set<string>();
    if ("transitionProperty" in a) props.add((a as CSSTransition).transitionProperty);
    else for (const k of effect?.getKeyframes() ?? []) for (const prop of Object.keys(k)) if (!["offset", "computedOffset", "easing", "composite"].includes(prop)) props.add(prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()));
    const name = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? a.id ?? "";
    const pseudo = effect?.pseudoElement ?? "";
    p.animated.push({ at: t0 + performance.now(), kind: a.constructor.name, name, target: describe(effect?.target) + pseudo, props: [...props], looping: effect?.getTiming().iterations === Infinity, frame: frameName() });
  };
  const started = (e: AnimationEvent | TransitionEvent) => {
    const el = e.target as Element;
    const name = "animationName" in e ? e.animationName : e.propertyName;
    const pseudo = e.pseudoElement || null;
    for (const a of el.getAnimations?.({ subtree: true }) ?? []) {
      const own = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty;
      if (own === name && ((a.effect as KeyframeEffect).pseudoElement ?? null) === pseudo && (a.effect as KeyframeEffect).target === el) record(a);
    }
  };
  addEventListener("animationstart", started, true);
  addEventListener("transitionrun", started, true);
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
    const a = animate.apply(this, args);
    record(a);
    return a;
  };

  // How visible the page's first heading or paragraph is, its own and its ancestors' opacity together
  const opacity = (el: Element | null) => {
    if (!el) return 0;
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };

  if (isTop) {
    const loop = (t: number) => {
      p.frames.push(t0 + t);
      if (p.text.full === undefined) {
        const o = opacity(document.querySelector("main h1, main p"));
        if (o >= 0.5) p.text.half ??= t;
        if (o >= 0.99) p.text.full = t;
      }
      if (p.picture.half === undefined) {
        const img = document.querySelector<HTMLImageElement>("main .q-car-card.is-active .q-car-media img, main img");
        if (img?.complete && img.naturalWidth && opacity(img) >= 0.5) {
          p.picture.half = t;
          p.picture.element = describe(img);
        }
      }
      raf(loop);
    };
    raf(loop);
  }

  const observe = (type: string, fn: (e: any) => void, opts: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
    } catch {}
  };
  observe("long-animation-frame", (e) =>
    p.loafs.push({
      at: t0 + e.startTime,
      duration: e.duration,
      blocking: e.blockingDuration,
      scripts: e.scripts.map((s: any) => `${Math.round(s.duration)}ms ${s.invoker || s.invokerType} (${(s.sourceURL || "").replace(location.origin, "")}${s.sourceFunctionName ? " " + s.sourceFunctionName : ""})`),
      frame: frameName(),
    }),
  );
  if (!isTop) return;
  observe("layout-shift", (e) => p.shifts.push({ at: t0 + e.startTime, value: e.value, input: e.hadRecentInput, sources: (e.sources ?? []).map((s: any) => describe(s.node)) }));
  observe("event", (e) => e.interactionId && p.events.push({ at: t0 + e.startTime, name: e.name, duration: e.duration }), { durationThreshold: 16 });
  observe("largest-contentful-paint", (e) => {
    const slide = e.element?.closest?.(".q-car-slides") ? Number(e.element.dataset.i) : undefined;
    p.lcp.push({ at: e.startTime, size: e.size, element: describe(e.element), slide });
  });
}

/* What `measure()` reports for one stretch of time */
export type Report = {
  label: string;
  ms: number;
  frames: number;
  /** Frames that should have been shown and weren't */
  dropped: number;
  longestFrame: number;
  p95Frame: number;
  loafs: Loaf[];
  shift: number;
  shifts: Shift[];
  slowestInteraction: number;
  /** Animations and transitions that lay out or repaint on every frame (see LAYOUT) */
  costly: Animated[];
  /** Whether frames were drawn on a GPU, as a visitor's browser does (frame-rate budgets only apply then) */
  gpu: boolean;
};

export type Budget = {
  /** Most dropped frames, as a share of the frames there should have been (one is always allowed: a single late
      frame can't be told from the machine being busy for a moment, and a real problem drops more) */
  droppedShare: number;
  /** Longest a single frame may take, ms */
  longestFrame: number;
  /** Most main-thread work blocking a single frame, ms (long animation frames' blocking time) */
  blocking: number;
  /** Most layout shift (sum of shift scores), not counting what moves in answer to a click or key */
  shift: number;
  /** Slowest a click, tap or key may take to show its result, ms */
  interaction: number;
};

/* Desktop: a laptop at 60 frames a second. Phone: a mid-range phone, with the CPU slowed four times. */
export const BUDGET: Record<"desktop" | "phone", Budget> = {
  desktop: { droppedShare: 0.02, longestFrame: 50, blocking: 0, shift: 0.001, interaction: 100 },
  phone: { droppedShare: 0.05, longestFrame: 70, blocking: 50, shift: 0.001, interaction: 200 },
};

export const budgetFor = (info: TestInfo) => BUDGET[info.project.name === "phone" ? "phone" : "desktop"];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

async function gather(page: Page) {
  const all = await Promise.all(page.frames().map((f) => f.evaluate(() => window.__perf).catch(() => null)));
  const top = all[0];
  if (!top) throw new Error("The perf probe isn't in the page: was the page opened with the `test` from tests/perf/support.ts?");
  const loafs = new Map<string, Loaf>();
  const animated: Animated[] = [];
  for (const p of all) {
    if (!p) continue;
    for (const l of p.loafs) loafs.set(`${Math.round(l.at)}:${Math.round(l.duration)}`, l);
    animated.push(...p.animated);
  }
  return { top, loafs: [...loafs.values()], animated };
}

export async function now(page: Page) {
  return page.evaluate(() => performance.timeOrigin + performance.now());
}

/* Whether the page draws on a GPU or in software (SwiftShader) */
export async function hasGpu(page: Page) {
  return page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    return !!renderer && !/swiftshader|llvmpipe|software/i.test(renderer);
  });
}

/** Waits until the page stops asking for frames (nothing of the site's is animating from script) */
// `span` is longer than the carousel's pause before its cards turn over (FLIP_WAIT_MS), so that pause isn't taken for rest
export async function quiet(page: Page, { timeout = 5_000, span = 450 } = {}) {
  const until = Date.now() + timeout;
  let last = await page.evaluate(() => window.__perf.rafCalls);
  while (Date.now() < until) {
    await page.waitForTimeout(span);
    const calls = await page.evaluate(() => window.__perf.rafCalls);
    if (calls === last) return;
    last = calls;
  }
  throw new Error(`The page kept asking for frames for ${timeout}ms`);
}

/** Runs `action`, waits `settle` ms for what it set moving to finish, and reports what happened meanwhile */
export async function measure(page: Page, label: string, action: () => Promise<unknown>, { settle = 400 } = {}): Promise<Report> {
  const from = await now(page);
  await action();
  await page.waitForTimeout(settle);
  const to = await now(page);
  return report(page, label, from, to);
}

/** What happened between two times (from `now()`) */
export async function report(page: Page, label: string, from: number, to: number): Promise<Report> {
  const { top, loafs, animated } = await gather(page);
  const inside = (at: number) => at >= from && at <= to;
  const stamps = top.frames.filter(inside);
  const gaps = stamps.slice(1).map((t, i) => t - stamps[i]);
  const sorted = [...gaps].sort((a, b) => a - b);
  const shifts = top.shifts.filter((s) => inside(s.at) && !s.input);
  return {
    label,
    ms: Math.round(to - from),
    frames: gaps.length,
    dropped: sum(gaps.map((g) => Math.max(0, Math.round(g / FRAME_MS) - 1))),
    longestFrame: Math.round(sorted.at(-1) ?? 0),
    p95Frame: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
    loafs: loafs.filter((l) => inside(l.at)),
    shift: sum(shifts.map((s) => s.value)),
    shifts,
    slowestInteraction: Math.max(0, ...top.events.filter((e) => inside(e.at)).map((e) => e.duration)),
    costly: animated.filter((a) => inside(a.at) && costly(a).length),
    gpu: await hasGpu(page),
  };
}

const describeLoafs = (loafs: Loaf[]) =>
  loafs
    .sort((a, b) => b.blocking - a.blocking || b.duration - a.duration)
    .slice(0, 5)
    .map((l) => `    ${Math.round(l.duration)}ms frame (${Math.round(l.blocking)}ms blocking) in ${l.frame}: ${l.scripts.join("; ") || "style, layout and paint"}`)
    .join("\n");

/** Holds a report to a budget, every check at once, and attaches the report to the test */
export function expectSmooth(r: Report, budget: Budget) {
  const info = test.info();
  const expectedFrames = Math.max(1, Math.round(r.ms / FRAME_MS));
  const summary = `${r.label}: ${r.frames} frames in ${r.ms}ms, ${r.dropped} dropped, longest ${r.longestFrame}ms, p95 ${r.p95Frame}ms, ${r.loafs.length} long frames, shift ${r.shift.toFixed(3)}, slowest interaction ${Math.round(r.slowestInteraction)}ms${r.gpu ? "" : " (software rendering: frame rate not checked)"}`;
  console.log("  " + summary);
  info.annotations.push({ type: "perf", description: summary });
  void info.attach(`${r.label}.json`, { body: JSON.stringify(r, null, 2), contentType: "application/json" });

  if (r.gpu) {
    expect.soft(r.frames, `${r.label}: frames were drawn`).toBeGreaterThan(0);
    expect.soft(r.dropped, `${r.label}: dropped ${r.dropped} of ${expectedFrames} frames`).toBeLessThanOrEqual(Math.max(1, Math.floor(budget.droppedShare * expectedFrames)));
    expect.soft(r.longestFrame, `${r.label}: longest frame took ${r.longestFrame}ms`).toBeLessThanOrEqual(budget.longestFrame);
  }
  const blocking = Math.max(0, ...r.loafs.map((l) => l.blocking));
  expect.soft(blocking, `${r.label}: main thread blocked a frame for ${Math.round(blocking)}ms\n${describeLoafs(r.loafs)}`).toBeLessThanOrEqual(budget.blocking);
  expect.soft(r.shift, `${r.label}: layout shifted\n${r.shifts.map((s) => `    ${s.value.toFixed(3)}: ${s.sources.join(", ")}`).join("\n")}`).toBeLessThanOrEqual(budget.shift);
  expect.soft(r.slowestInteraction, `${r.label}: slowest interaction took ${Math.round(r.slowestInteraction)}ms`).toBeLessThanOrEqual(budget.interaction);
  expect
    .soft([...new Set(r.costly.map((a) => `${a.kind} ${a.name} on ${a.target} (${a.frame}) animates ${costly(a).join(", ")}${a.looping ? " on a loop" : ""}`))], `${r.label}: animations that lay out or repaint the page on every frame`)
    .toEqual([]);
}

/** Slows the CPU (Chrome DevTools' CPU throttling); 1 is full speed */
export async function throttleCpu(page: Page, rate: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  return cdp;
}

/** Network speeds, as Lighthouse uses them */
export const NETWORK = {
  // Lighthouse's desktop setting
  cable: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8 },
  // Lighthouse's mobile setting ("slow 4G")
  slow4g: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
};

export async function throttleNetwork(cdp: CDPSession, net: (typeof NETWORK)[keyof typeof NETWORK]) {
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...net });
}

/** A smooth scroll or swipe, as a real trackpad, mouse wheel or finger makes it (DevTools' synthesized gestures) */
export async function gesture(cdp: CDPSession, opts: { x: number; y: number; dx?: number; dy?: number; touch?: boolean; speed?: number }) {
  await cdp.send("Input.synthesizeScrollGesture", {
    x: opts.x,
    y: opts.y,
    // The gesture's distances are how far the content moves: a positive y scrolls up the page
    xDistance: -(opts.dx ?? 0),
    yDistance: -(opts.dy ?? 0),
    speed: opts.speed ?? 1200,
    gestureSourceType: opts.touch ? "touch" : "mouse",
    preventFling: false,
  });
}

/* The test to use in tests/perf: every page has the probe, and on the phone project the CPU runs four times
   slower. `cdp` is a DevTools session for the page. (Analytics is blocked in playwright.config.ts.) */
export const test = base.extend<{ cdp: CDPSession; phone: boolean }, { warm: void }>({
  /* A browser's first pages are slow for reasons of its own: starting the GPU process, compiling shaders, filling
     caches. A visitor's browser has done all that long before, so each test browser opens the site once, unmeasured,
     before any test runs. */
  warm: [
    async ({ browser }, use, workerInfo) => {
      const project = workerInfo.project.use;
      const context = await browser.newContext({ ...project, baseURL: project.baseURL });
      const page = await context.newPage();
      for (const path of ["/", "/about/", "/how-i-work/"]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        await page.waitForTimeout(1_500);
      }
      await context.close();
      await use();
    },
    { scope: "worker", auto: true },
  ],
  phone: async ({}, use, info) => use(info.project.name === "phone"),
  page: async ({ page }, use) => {
    await page.addInitScript(probe);
    await use(page);
  },
  // Automatic, so the phone's slower CPU applies to every test, whether it asks for `cdp` or not
  cdp: [
    async ({ page, phone }, use) => {
      const cdp = await throttleCpu(page, phone ? 4 : 1);
      await use(cdp);
      await cdp.detach().catch(() => {});
    },
    { auto: true },
  ],
});

export { expect };

/** Waits until the page has loaded, its fonts are in and its entrance animations have finished */
export async function settled(page: Page, extra = 0) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity), null, { timeout: 10_000 });
  if (extra) await page.waitForTimeout(extra);
}
