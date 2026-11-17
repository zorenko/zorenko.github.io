/* Loading each page: how soon something shows (FCP) and the main thing shows (LCP), whether anything jumps once
   shown (CLS), how long the page is too busy to respond while it starts (TBT), and how much it downloads.

   On a throttled connection, as Lighthouse measures: desktop on cable, the phone on slow 4G with a CPU four times
   slower. The limits are Google's "good" Core Web Vitals; the weights are what the site downloads today plus some
   room, so a page that suddenly grows fails here first. */

import type { CDPSession, Page } from "@playwright/test";
import { NETWORK, expect, quiet, settled, test, throttleNetwork } from "./support";

const PAGES = [
  { path: "/", name: "home" },
  { path: "/about/", name: "about" },
  { path: "/how-i-work/", name: "how i work" },
  { path: "/not-a-page/", name: "page not found" },
];

const VITALS = {
  desktop: { fcp: 1_000, lcp: 1_500, cls: 0.02, tbt: 100 },
  // Google's "good" thresholds for a phone
  phone: { fcp: 1_800, lcp: 2_500, cls: 0.02, tbt: 200 },
};

// KB over the wire (gzipped): the page's own scripts, styles and fonts, and everything it loads in its first five
// seconds, the live demos and their pictures included (on a computer). Today's weights plus about 15%
// (2026-11: JS 157, CSS 15, fonts 42; everything 6,090 on a computer, 1,962 on a phone)
const WEIGHT = {
  desktop: { js: 180, css: 18, fonts: 50, total: 7_000 },
  phone: { js: 180, css: 18, fonts: 50, total: 2_300 },
};

type Resource = { name: string; type: string; bytes: number; frame: string };

async function resources(page: Page) {
  const all = await Promise.all(
    page.frames().map((f) =>
      f
        .evaluate(() =>
          [...performance.getEntriesByType("navigation"), ...performance.getEntriesByType("resource")].map((e) => {
            const r = e as PerformanceResourceTiming;
            return { name: r.name, type: r.initiatorType, bytes: r.transferSize || r.encodedBodySize, frame: location.pathname };
          }),
        )
        .catch(() => [] as Resource[]),
    ),
  );
  return all.flat();
}

const kb = (rs: Resource[]) => Math.round(rs.reduce((a, r) => a + r.bytes, 0) / 1024);

/** Loads a page on the project's connection and reads its timings, Chrome's and the probe's */
async function load(page: Page, cdp: CDPSession, phone: boolean, path: string) {
  await throttleNetwork(cdp, phone ? NETWORK.slow4g : NETWORK.cable);
  await page.goto(path);
  await settled(page);
  await page.waitForTimeout(1_000);
  return page.evaluate(() => {
    const p = window.__perf;
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
    const cls = p.shifts.filter((s) => !s.input).reduce((a, s) => a + s.value, 0);
    // Total blocking time: each long frame's time past 50ms, after the first paint
    const start = performance.timeOrigin + (fcp ?? p.text.half ?? 0);
    const tbt = p.loafs.filter((l) => l.at >= start).reduce((a, l) => a + l.blocking, 0);
    return { fcp, lcps: p.lcp, text: p.text, picture: p.picture, cls, tbt, shifts: p.shifts.filter((s) => !s.input) };
  });
}

const ms = (n?: number) => (n === undefined ? "none" : `${Math.round(n)}ms`);

for (const { path, name } of PAGES) {
  /* What a visitor sees: something on screen (the first of Chrome's first paint and the page's first heading or
     paragraph half visible), then the main content (its text fully in, and its main picture, the middle work card's
     on the home page, loaded and half visible) */
  test(`${name} loads quickly and doesn't jump`, async ({ page, cdp, phone }) => {
    const v = await load(page, cdp, phone, path);
    const shown = Math.min(v.fcp ?? Infinity, v.text.half ?? Infinity);
    const main = Math.max(v.picture.half ?? 0, v.text.full ?? 0) || Infinity;
    const limit = VITALS[phone ? "phone" : "desktop"];
    const summary = `${name}: first shown ${ms(shown)}, main content ${ms(main)} (text fully in ${ms(v.text.full)}, picture ${ms(v.picture.half)} ${v.picture.element ?? ""}), CLS ${v.cls.toFixed(3)}, TBT ${Math.round(v.tbt)}ms`;
    console.log("  " + summary);
    test.info().annotations.push({ type: "perf", description: summary });

    expect.soft(shown, `${name}: something shows (first contentful paint)`).toBeLessThanOrEqual(limit.fcp);
    expect.soft(main, `${name}: the main content shows (largest contentful paint)`).toBeLessThanOrEqual(limit.lcp);
    expect.soft(v.cls, `${name}: layout shift\n${v.shifts.map((s) => `    ${s.value.toFixed(4)}: ${s.sources.join(", ")}`).join("\n")}`).toBeLessThanOrEqual(limit.cls);
    expect.soft(v.tbt, `${name}: total blocking time`).toBeLessThanOrEqual(limit.tbt);
  });

  /* What Google sees: Chrome reports each visit's paint timings (Search Console's Core Web Vitals, PageSpeed
     Insights) and Lighthouse reads the same. Two things make them differ from what a visitor sees:
     - text that fades in from transparent is painted while still invisible, and the fade runs on the GPU, so Chrome
       only notices it at the next repaint, if at all;
     - Chrome's largest paint keeps updating until the visitor first clicks or scrolls, so a bigger picture that
       appears later becomes the page's largest paint. The work carousel's slideshow moving on to its next picture
       does that on a computer (at about 2.9s; the side card's picture is bigger on screen than the middle card's
       still), and that's left as it is: the slideshow is meant to play, and the page is in by then. So the
       slideshow's later pictures don't count here; anything else that paints late still does. */
  test(`${name}: Google measures it as a visitor sees it`, async ({ page, cdp, phone }) => {
    const v = await load(page, cdp, phone, path);
    const lcp = v.lcps.filter((l) => !l.slide).at(-1);
    const slideshow = v.lcps.at(-1)?.slide ? v.lcps.at(-1) : undefined;
    const limit = VITALS[phone ? "phone" : "desktop"];
    const summary = `${name}, as Chrome reports it: FCP ${ms(v.fcp)} (text visible ${ms(v.text.half)}), LCP ${ms(lcp?.at)} ${lcp?.element ?? ""}${slideshow ? ` (then the slideshow's next picture at ${ms(slideshow.at)}, not counted)` : ""}`;
    console.log("  " + summary);
    test.info().annotations.push({ type: "perf", description: summary });
    expect.soft(v.fcp, `${name}: Chrome reported no first contentful paint, though the text was visible at ${ms(v.text.half)}`).toBeDefined();
    if (v.fcp !== undefined && v.text.half !== undefined) {
      expect.soft(v.fcp, `${name}: Chrome's first contentful paint, long after the text was visible at ${ms(v.text.half)}`).toBeLessThanOrEqual(v.text.half + 250);
    }
    expect.soft(lcp, `${name}: Chrome reported no largest contentful paint`).toBeDefined();
    if (lcp) expect.soft(lcp.at, `${name}: Chrome's largest contentful paint (${lcp.element})`).toBeLessThanOrEqual(limit.lcp);
  });
}

test("the home page downloads no more than it needs", async ({ page, phone }) => {
  await page.goto("/");
  await settled(page);
  await page.waitForTimeout(5_000);
  const all = await resources(page);
  const own = all.filter((r) => r.frame === "/");
  const weight = {
    js: kb(own.filter((r) => /\.js(\?|$)/.test(r.name))),
    css: kb(own.filter((r) => /\.css(\?|$)/.test(r.name))),
    fonts: kb(own.filter((r) => /\.woff2(\?|$)/.test(r.name))),
    total: kb(all),
  };
  const limit = WEIGHT[phone ? "phone" : "desktop"];
  const summary = `home weight: JS ${weight.js}KB, CSS ${weight.css}KB, fonts ${weight.fonts}KB, everything ${weight.total}KB (${all.length} requests)`;
  console.log("  " + summary);
  test.info().annotations.push({ type: "perf", description: summary });
  const biggest = [...all].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((r) => `    ${Math.round(r.bytes / 1024)}KB ${r.name.replace(/^https?:\/\/localhost:\d+/, "")}`).join("\n");
  for (const k of Object.keys(limit) as (keyof typeof limit)[]) {
    expect.soft(weight[k], `home: ${k} downloaded, in KB. Biggest downloads:\n${biggest}`).toBeLessThanOrEqual(limit[k]);
  }
});

test("each device loads only its own kind of demo", async ({ page, phone }) => {
  await page.goto("/");
  await settled(page);
  await page.waitForTimeout(3_000);
  const names = (await resources(page)).map((r) => r.name);
  if (phone) {
    // A phone gets stills and, in the middle card, a recording: never the live demos, which are whole pages
    expect(names.filter((n) => /\/demos\/[^/]+\/index\.html/.test(n)), "live demos loaded on a phone").toEqual([]);
    expect(await page.locator(".q-car iframe").count()).toBe(0);
  } else {
    // A computer gets the live demos: never the recordings made for phones
    expect(names.filter((n) => /tour\.mp4/.test(n)), "phone recordings loaded on a computer").toEqual([]);
  }
});

test("pictures below and beside the carousel wait until they're needed", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  // The cards have turned over to face the screen: until then they're edge-on, and look off screen
  await quiet(page);
  // Every picture that isn't on screen is lazy; those on screen may load at once, and so may the cards either side
  // of the middle one, even when they only peek in at the edge: they're one swipe away
  const eager = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>(".q-car-card")];
    const middle = cards.findIndex((c) => c.classList.contains("is-active"));
    const neighbours = new Set([cards.at(middle - 1), cards[(middle + 1) % cards.length]]);
    return [...document.images]
      .filter((img) => img.loading !== "lazy")
      .filter((img) => {
        const r = img.getBoundingClientRect();
        const card = img.closest<HTMLElement>(".q-car-card");
        if (card && neighbours.has(card)) return false;
        const hidden = card?.style.visibility === "hidden";
        return hidden || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth;
      })
      .map((img) => {
        const r = img.getBoundingClientRect();
        return `${img.currentSrc || img.src} at x ${Math.round(r.left)}…${Math.round(r.right)}, y ${Math.round(r.top)}…${Math.round(r.bottom)} (screen ${innerWidth}×${innerHeight})`;
      });
  });
  expect(eager, "pictures off screen that load straight away").toEqual([]);
});
