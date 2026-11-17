# Performance tests

Checks that the site loads quickly, never stutters while something moves, and goes quiet when nothing does. They run in a headless Chromium (Playwright) against the built site, the way GitHub Pages serves it.

```sh
npm run test:perf          # builds the site, then runs every test (about 7 minutes)
npm run test:perf:quick    # the same, without building first (uses the out/ you have)
npx playwright test carousel --project=desktop   # one file, one device
npx playwright show-report tests/perf/report     # the last run, with each test's numbers
```

The first time, install the browser: `npx playwright install chromium`.

No browser window opens: everything runs headless. On a Mac the headless browser draws with the GPU (Metal), as a visitor's browser does. Without a GPU (most CI machines) it draws in software, which can't keep up with the live demos, so the frame-rate checks are skipped there and the rest still run.

## Two devices

| | Screen | CPU | Network (load tests) |
| --- | --- | --- | --- |
| `desktop` | 1440 × 900 at 2× | full speed | cable (40ms, 10 Mbit/s) |
| `phone` | Pixel 7, touch | 4× slower, a mid-range phone | slow 4G (150ms, 1.6 Mbit/s) |

## What's tested

| File | What |
| --- | --- |
| `carousel.spec.ts` | The work carousel: the cards turning over on first view, arrow keys (one at a time and quickly), a trackpad swipe, dragging and flicking, clicking or tapping a side card, a finger swipe, the hover tilt, the slideshow, and each demo's walkthrough playing in the middle card |
| `pages.spec.ts` | Scrolling each page down and up (the dock shrinks), the dock's menu, the theme switch, How I work's steps, the cookie banner going away |
| `load.spec.ts` | Each page's load: when something shows, when the main content shows, layout shift, blocking time. What Google measures for the same load. How much the home page downloads. Phones never load the live demos, computers never load the phone recordings, and pictures off screen wait |
| `idle.spec.ts` | Once nothing moves, nothing works: no frames asked for, no animations running, little CPU. Only the middle demo keeps playing. With reduced motion, nothing moves by itself |

## How smoothness is measured

`support.ts` puts a probe in every page and every demo before any of the site's code runs. While a test does something (presses keys, swipes, waits for a walkthrough), the probe keeps:

- **every frame** of the page. At 60 frames a second each should take 16.7ms. A gap of 33ms is one dropped frame, 50ms two, and so on;
- **long animation frames**: frames where the main thread worked 50ms or more, with the scripts that took the time, in the page and in the demos;
- **layout shifts** that weren't caused by a click or key;
- **interactions**: how long a click, tap or key took to show its result;
- **every animation and transition** that starts, with the properties it animates.

Each interaction is then held to a budget (`BUDGET` in `support.ts`):

| | Dropped frames | Longest frame | Main thread blocked | Layout shift | Interaction |
| --- | --- | --- | --- | --- | --- |
| desktop | 2% (always 1 allowed) | 50ms | 0ms | 0.001 | 100ms |
| phone | 5% (always 1 allowed) | 70ms | 50ms | 0.001 | 200ms |

It also fails any animation that lays the page out again on every frame (`width`, `height`, `top`, `margin`…), and any that repaints on a loop. Animate `transform` and `opacity` instead. A short colour fade on hover is fine.

A failure says what went wrong: which frames, which script, which element shifted, which animation. The full numbers are attached to each test in the report.

### Known exceptions

`KNOWN` in `support.ts` lists animations that break the layout rule on purpose, each with why. Today they are the Sanna demo's step ticks, the Visuals demo's shimmer, the dock's glass growing into its menu, and How I work's steps opening. All of them measured smooth on the slowed phone CPU. Adding to that list is a decision: prefer moving the animation to `transform` or `opacity`.

## Noise

Frames are timed on a real machine. If something else on the Mac is busy (a build, another app), a frame can come in late that has nothing to do with the site. So:

- tests run one at a time;
- each test browser opens the site once, unmeasured, before any test runs. A new browser's first pages are slow while it starts the GPU and compiles shaders;
- a failing test runs once more, and a real problem fails both times. A test that passes the second time shows as "flaky" in the report: worth a look if the same one keeps doing it.

## Load budgets

Load times use Google's "good" Core Web Vitals: something on screen within 1.8s and the main content within 2.5s on the phone (1s and 1.5s on desktop), layout shift under 0.02, blocking time under 200ms (100ms on desktop). Download weights are today's plus about 15% (`WEIGHT` in `load.spec.ts`), so a page that suddenly grows fails. Raise them on purpose when something new is worth it.

"When something shows" is read two ways. A visitor's view is the first of Chrome's first paint and the page's first text becoming visible. Google's view is Chrome's own paint timings, which are what Search Console and PageSpeed Insights report. They differ on this site, see below.

## What it found (November 2026)

Almost everything that moves runs at 60 frames a second on both devices: the carousel in every way it can move, the demos, scrolling, the dock, the theme switch, How I work. Nothing shifts, and nothing keeps working once the page is still.

The cards turning over on first view used to skip frames on a computer (in about one load in five, up to 7 frames) while all eight live demos loaded at once. Since #35 only the middle card's demo loads, and it now loads as the cards start to turn: across 30 loads the turn dropped no frames, and the walkthrough cursor starts about 0.3s after the middle card settles (about 1.95s after load, from about 2.85s before).

Three things Google measured differently from what a visitor sees, all fixed:

- **Fading in from fully transparent hid pages from Chrome.** Text and pictures that start at opacity 0 are painted while invisible, and as the fade runs on the GPU Chrome never notices them appear. About, How I work and Page not found reported no first paint, or a late one, and on the home page the carousel's picture didn't count as its largest paint. The page text (`q-in` in `app/site.css`) and the cards turning over (`components/work-carousel.tsx`) now fade from 0.01, which looks the same. Chrome reports the first paint at about 0.15s on a computer and 0.5–0.75s on a phone.
- **On a phone the home page's main picture came late (about 2.7s).** The middle card's still loaded lazily, so the browser fetched it late and at low priority. The first card's picture now loads at once with high priority (`priority` on `Demo`): about 1.55s.
- **On a computer Chrome took the slideshow as the home page's largest paint (about 2.9s).** The slideshow on a side card fades to its next picture then, bigger on screen than the middle card's still. That's left as it is, since the slideshow is meant to play and the page is in by 0.9s; the Google check doesn't count the slideshow's later pictures. Lighthouse may still report it.
