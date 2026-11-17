import { defineConfig, devices } from "@playwright/test";

/* Performance tests (tests/perf/): load speed, page weight, smooth frames while things move, and a quiet page once
   they stop. Run them with `npm run test:perf`, which builds the site first; how they measure is in
   tests/perf/README.md.

   Always headless: a visible browser window sits over everything else on the screen, and one that isn't in front is
   held to 30 frames a second anyway. On a Mac the headless browser draws with the GPU (Metal), as a visitor's
   browser does; without one (most CI machines) it draws in software, which can't keep up with the live demos, so the
   frame-rate checks are skipped there and the rest still run. */

const PORT = 4173;
const gpu = process.platform === "darwin" ? ["--use-gl=angle", "--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] : [];
// Analytics never loads in a test (it would count the runs as visits); everything else does, Google Fonts included
const noAnalytics = "--host-resolver-rules=MAP *googletagmanager.com ~NOTFOUND, MAP *google-analytics.com ~NOTFOUND, MAP *doubleclick.net ~NOTFOUND, MAP cloud.umami.is ~NOTFOUND";

export default defineConfig({
  testDir: "tests/perf",
  // One at a time: tests running side by side would share the CPU and GPU and slow each other's frames
  workers: 1,
  fullyParallel: false,
  // A frame can be late because something else on the machine was busy; a real problem fails twice
  retries: 1,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/perf/report" }]],
  outputDir: "tests/perf/results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    launchOptions: { args: [...gpu, noAnalytics] },
    // No trace: recording one takes screenshots as it goes, which costs the very frames being measured
    trace: "off",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } },
    // A mid-range phone: touch, a small screen and, in the tests, a CPU four times slower (tests/perf/support.ts)
    { name: "phone", use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: `node tests/perf/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
