/* Everything else that moves: scrolling each page (the dock shrinks on the way down), the dock's menu, the theme
   switch (a cross-fade of the whole page), How I work's steps opening, and the cookie banner going away. Each is
   held to the frame budget in support.ts. */

import { budgetFor, expect, expectSmooth, gesture, measure, quiet, settled, test } from "./support";

const PAGES = ["/", "/about/", "/how-i-work/"];

for (const path of PAGES) {
  test(`scrolling ${path} down and back up`, async ({ page, cdp, phone }, info) => {
    await page.goto(path);
    await settled(page);
    const { width, height } = page.viewportSize()!;
    // Away from the carousel, which takes sideways swipes for itself
    const at = { x: width / 2, y: height - 120, touch: phone };
    const r = await measure(page, `scroll ${path}`, async () => {
      await gesture(cdp, { ...at, dy: 1_400, speed: 1_600 });
      await gesture(cdp, { ...at, dy: -1_400, speed: 2_400 });
    });
    expectSmooth(r, budgetFor(info));
  });
}

test("opening and closing the dock's menu", async ({ page }, info) => {
  await page.goto("/about/");
  await settled(page);
  const r = await measure(page, "dock menu", async () => {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(600);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  });
  expectSmooth(r, budgetFor(info));
});

test("switching the colour theme", async ({ page }, info) => {
  await page.goto("/");
  await settled(page);
  await quiet(page);
  const html = page.locator("html");
  const r = await measure(page, "theme switch", async () => {
    for (const theme of ["Dark", "Light"]) {
      await page.getByRole("button", { name: /^Colour theme/ }).click();
      await page.waitForTimeout(300);
      await page.getByRole("radio", { name: theme }).click();
      await page.waitForTimeout(700);
    }
  });
  await expect(html).not.toHaveClass(/q-dark/);
  expectSmooth(r, budgetFor(info));
});

test("opening How I work's steps", async ({ page }, info) => {
  await page.goto("/how-i-work/");
  await settled(page);
  const steps = page.locator(".q-ts-btn");
  const n = await steps.count();
  expect(n).toBeGreaterThan(0);
  const r = await measure(page, "how i work steps", async () => {
    for (let k = 0; k < n; k++) {
      await steps.nth(k).click();
      await page.waitForTimeout(450);
    }
    for (let k = 0; k < n; k++) {
      await steps.nth(k).click();
      await page.waitForTimeout(250);
    }
  });
  expectSmooth(r, budgetFor(info));
});

test("the cookie banner going away", async ({ page }, info) => {
  await page.goto("/about/");
  await settled(page);
  const banner = page.locator(".q-consent");
  test.skip(!(await banner.isVisible()), "no cookie banner (analytics off in lib/site.ts)");
  const r = await measure(page, "cookie banner", async () => {
    // "Allow": analytics itself is blocked in the tests (playwright.config.ts), so nothing is sent
    await page.locator(".q-consent-allow").click();
    await banner.waitFor({ state: "detached" }).catch(() => {});
  });
  expectSmooth(r, budgetFor(info));
});
