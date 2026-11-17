/* The work carousel on the home page: the cards turning over on first view, then every way of moving it (arrow
   keys, trackpad swipes, dragging and flicking, clicking a side card, a finger on a phone), the hover tilt, the
   slideshow, and each live demo playing in the middle. Each is held to the frame budget in support.ts. */

import type { Page } from "@playwright/test";
import { WORK } from "../../content/work";
import { budgetFor, expect, expectSmooth, gesture, measure, now, quiet, report, settled, test } from "./support";

const N = WORK.length;

/** Which project is in the middle (cards repeat round the loop, so it's the card's index modulo the list) */
const activeIndex = (page: Page) =>
  page.evaluate((n) => {
    const cards = [...document.querySelectorAll(".q-car-card")];
    return cards.findIndex((c) => c.classList.contains("is-active")) % n;
  }, N);

/** The middle card's picture or demo */
const middle = (page: Page) => page.locator(".q-car-card.is-active .q-car-media");

/** Waits for the carousel to come to rest: the page stops asking for frames */
const still = (page: Page) => quiet(page);

/** Brings project i to the middle with the arrow keys, a card at a time, letting it stop after each */
async function bringToMiddle(page: Page, i: number) {
  for (let k = 0; k < N && (await activeIndex(page)) !== i; k++) {
    await page.keyboard.press("ArrowRight");
    await still(page);
  }
  expect(await activeIndex(page)).toBe(i);
}

async function open(page: Page) {
  await page.goto("/");
  await settled(page);
  await page.locator(".q-car.is-laid-out").waitFor();
  await still(page);
}

test.describe("work carousel", () => {
  test("the cards turn over smoothly on first view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".q-car.is-laid-out").waitFor();
    const from = await now(page);
    // The turn (Web Animations on the cards, 1.5s, the outer cards starting later): wait for it to start, then to
    // end. The middle card's live demo loads meanwhile, so this also checks that doesn't hold the turn up
    const turning = () => [...document.querySelectorAll(".q-car-card")].some((c) => c.getAnimations().some((a) => a.playState === "running"));
    await page.waitForFunction(turning, null, { timeout: 5_000 });
    await page.waitForFunction(() => ![...document.querySelectorAll(".q-car-card")].some((c) => c.getAnimations().some((a) => a.playState === "running")), null, { timeout: 5_000 });
    expectSmooth(await report(page, "intro", from, await now(page)), budgetFor(test.info()));
  });

  test("arrow keys move it one card at a time", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "no keyboard on a phone");
    await open(page);
    const r = await measure(page, "arrow keys", async () => {
      for (let i = 0; i < N; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(500);
      }
      for (let i = 0; i < 2; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(500);
      }
    });
    expectSmooth(r, budgetFor(info));
    expect(await activeIndex(page)).toBe(N - 2);
  });

  test("keys pressed quickly in a row", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "no keyboard on a phone");
    await open(page);
    const r = await measure(page, "quick keys", async () => {
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(60);
      }
      await still(page);
    });
    expectSmooth(r, budgetFor(info));
  });

  test("a sideways trackpad swipe", async ({ page, cdp }, info) => {
    test.skip(info.project.name === "phone", "no trackpad on a phone");
    await open(page);
    const box = (await middle(page).boundingBox())!;
    const r = await measure(page, "trackpad swipe", async () => {
      await gesture(cdp, { x: box.x + box.width / 2, y: box.y + box.height / 2, dx: 900 });
      await still(page);
      await gesture(cdp, { x: box.x + box.width / 2, y: box.y + box.height / 2, dx: -900, speed: 2400 });
      await still(page);
    });
    expectSmooth(r, budgetFor(info));
  });

  test("dragging with the mouse, then flicking", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "no mouse on a phone");
    await open(page);
    const box = (await middle(page).boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const r = await measure(page, "drag and flick", async () => {
      // A slow drag, let go standing still…
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let k = 1; k <= 30; k++) {
        await page.mouse.move(x - k * 15, y);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(120);
      await page.mouse.up();
      await still(page);
      // …then a quick flick the other way
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let k = 1; k <= 6; k++) await page.mouse.move(x + k * 40, y);
      await page.mouse.up();
      await still(page);
    });
    expectSmooth(r, budgetFor(info));
  });

  test("clicking a side card brings it to the middle", async ({ page, phone }, info) => {
    await open(page);
    const before = await activeIndex(page);
    const side = page.locator(".q-car-card:not(.is-active):not([style*='hidden']) .q-car-media").filter({ visible: true });
    // The card to the right of the middle: the visible side card furthest right of the middle one's centre
    const mid = (await middle(page).boundingBox())!;
    const boxes = await side.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    const right = boxes.filter((b) => b.x + b.width / 2 > mid.x + mid.width / 2).sort((a, b) => a.x - b.x)[0];
    // A point on the part of it that shows: right of the middle card, left of the screen's edge
    const x = (Math.max(right.x, mid.x + mid.width) + Math.min(right.x + right.width, page.viewportSize()!.width)) / 2;
    const y = right.y + right.height / 2;
    const r = await measure(page, phone ? "tap side card" : "click side card", async () => {
      if (phone) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
      await still(page);
    });
    expectSmooth(r, budgetFor(info));
    expect(await activeIndex(page)).toBe((before + 1) % N);
  });

  test("a finger swipe on a phone", async ({ page, cdp }, info) => {
    test.skip(info.project.name !== "phone", "touch only");
    await open(page);
    const box = (await middle(page).boundingBox())!;
    const r = await measure(page, "finger swipe", async () => {
      for (const dx of [260, 260, -260]) {
        await gesture(cdp, { x: box.x + box.width / 2, y: box.y + box.height / 2, dx, touch: true, speed: 1600 });
        await still(page);
      }
    });
    expectSmooth(r, budgetFor(info));
  });

  test("the middle picture tilts toward the pointer", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "no pointer to hover with on a phone");
    const slides = WORK.findIndex((w) => w.media.type === "slides" || w.media.type === "image");
    test.skip(slides < 0, "no picture card to tilt");
    await open(page);
    await bringToMiddle(page, slides);
    const box = (await middle(page).boundingBox())!;
    const r = await measure(page, "hover tilt", async () => {
      // Round the picture's edge, then away
      for (let k = 0; k <= 60; k++) {
        const a = (k / 60) * Math.PI * 2;
        await page.mouse.move(box.x + box.width * (0.5 + 0.4 * Math.cos(a)), box.y + box.height * (0.5 + 0.4 * Math.sin(a)));
        await page.waitForTimeout(16);
      }
      await page.mouse.move(box.x + box.width / 2, box.y - 200);
    });
    expectSmooth(r, budgetFor(info));
  });

  test("the slideshow fades from picture to picture", async ({ page }, info) => {
    const slides = WORK.findIndex((w) => w.media.type === "slides");
    test.skip(slides < 0, "no slideshow");
    await open(page);
    await bringToMiddle(page, slides);
    // Away from the card, so it isn't held still under the pointer
    await page.mouse.move(5, 5);
    const r = await measure(page, "slideshow", () => page.waitForTimeout(4_500), { settle: 0 });
    expectSmooth(r, budgetFor(info));
  });
});

test.describe("demos in the middle card", () => {
  for (const [i, w] of WORK.entries()) {
    if (w.media.type !== "demo") continue;
    test(`${w.title}: its walkthrough plays smoothly`, async ({ page }, info) => {
      await open(page);
      await bringToMiddle(page, i);
      // A phone plays the recording; with a mouse, the live demo once it has drawn
      const ready = page.locator(".q-car-card.is-active .q-demo-frame[data-ready]");
      await ready.waitFor({ state: "attached", timeout: 15_000 });
      await page.mouse.move(5, 5);
      const r = await measure(page, `${w.title} demo`, () => page.waitForTimeout(5_000), { settle: 0 });
      expectSmooth(r, budgetFor(info));
    });
  }
});
