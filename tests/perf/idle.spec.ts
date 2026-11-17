/* A page that has stopped moving should stop working: no frames asked for, no animations left running, the CPU
   left alone. That keeps laptops cool and phones' batteries full, and leaves the whole frame free for the next
   interaction. The live demo in the middle card plays its walkthrough on a loop on purpose, so it's left out;
   the demos beside it must be still. */

import type { Page } from "@playwright/test";
import { expect, quiet, settled, test } from "./support";

const IDLE_MS = 2_000;

/** What each frame (the page, then each demo) did over IDLE_MS of nobody touching anything */
async function idle(page: Page) {
  const at = () =>
    Promise.all(page.frames().map((f) => f.evaluate(() => ({ raf: window.__perf?.rafCalls ?? 0, animations: window.__perf?.animated.length ?? 0, url: location.pathname + location.search })).catch(() => null)));
  const before = await at();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const cpu = async () => (await cdp.send("Performance.getMetrics")).metrics.find((m) => m.name === "TaskDuration")!.value;
  const cpuBefore = await cpu();
  await page.waitForTimeout(IDLE_MS);
  const cpuMs = ((await cpu()) - cpuBefore) * 1000;
  const after = await at();
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running").map((a) => `${a.constructor.name} ${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty}`),
  );
  await cdp.detach();
  // Each demo, and whether it's the one in the middle card
  const middle = await Promise.all(page.frames().map(async (f) => (f.parentFrame() ? (await f.frameElement()).evaluate((el) => !!(el as Element).closest(".q-car-card.is-active")) : false)));
  const frames = after.map((a, i) => ({ url: a?.url ?? "?", raf: (a?.raf ?? 0) - (before[i]?.raf ?? 0), animations: (a?.animations ?? 0) - (before[i]?.animations ?? 0), middle: middle[i] }));
  return { top: frames[0], demos: frames.slice(1), running, cpuMs };
}

for (const path of ["/about/", "/how-i-work/"]) {
  test(`${path} is still once it has loaded`, async ({ page, phone }) => {
    await page.goto(path);
    await settled(page);
    await quiet(page);
    const r = await idle(page);
    console.log(`  ${path} idle: ${r.top.raf} frame requests, ${r.running.length} animations running, ${Math.round(r.cpuMs)}ms CPU in ${IDLE_MS}ms`);
    expect.soft(r.top.raf, "frames asked for while nothing moves").toBe(0);
    expect.soft(r.running, "animations still running").toEqual([]);
    // Next.js and the browser do a little housekeeping; a page that keeps working shows up as far more than this
    expect.soft(r.cpuMs, "CPU time spent while nothing moves").toBeLessThanOrEqual(phone ? 120 : 40);
  });
}

test("the home page: only the middle demo keeps playing", async ({ page, phone }) => {
  await page.goto("/");
  await settled(page);
  await quiet(page);
  await page.mouse.move(5, 5);
  const r = await idle(page);
  console.log(`  home idle: page ${r.top.raf} frame requests; demos ${r.demos.map((d) => `${d.url}${d.middle ? " (middle)" : ""} ${d.raf}`).join(", ") || "none"}; ${Math.round(r.cpuMs)}ms CPU`);
  expect.soft(r.top.raf, "the page asks for frames while the carousel is still").toBe(0);
  expect.soft(r.running, "animations still running on the page").toEqual([]);
  expect.soft(r.demos.filter((d) => !d.middle && (d.raf > 0 || d.animations > 0)), "demos beside the middle card still animating").toEqual([]);
  if (phone) expect.soft(r.demos, "live demos on a phone").toEqual([]);
});

// Fades are fine with reduced motion (nothing moves); anything else isn't
test("with reduced motion, nothing moves on its own", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/about/", "/how-i-work/"]) {
    await page.goto(path);
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    const moving = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration) > 1)
        .map((a) => {
          const effect = a.effect as KeyframeEffect;
          const props = "transitionProperty" in a ? [(a as CSSTransition).transitionProperty] : effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k));
          const el = effect.target as Element | null;
          return { props: [...new Set(props)], what: `${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty} on ${el?.tagName.toLowerCase()}.${el?.getAttribute("class") ?? ""}` };
        })
        .filter((a) => a.props.some((p) => p !== "opacity"))
        .map((a) => a.what),
    );
    expect.soft(moving, `${path}: animations that move things with reduced motion on`).toEqual([]);
  }
});
