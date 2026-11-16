# Live demos in the work carousel

How to make a clickable demo of a product for the home page carousel, like Visuals', Celsia's, Sanna's and Muster's. Read this, then read the
nearest existing demo: the files are the real reference, this is the map.

## How the carousel shows a demo

- A slide in `content/work.ts` with `media: { type: "demo", src, width, height, title, background }`.
- `src` is a static page in `public/demos/<name>/`. The carousel loads it in an iframe drawn at `width` × `height`
  (1180 × 696, or 1180 × 753 in a browser window) and scales it to the card. **Design and check the page at exactly that size.**
- The iframe is `loading="lazy"`, and `inert` until its card is in the middle, so it can't be clicked from the side.
- `background` shows while the page loads: use the page's own background so there's no flash.
- `glass: true` makes the card glass: the demo's page is see-through where it wants the glass, over the card's
  `background`, which is then a nearly opaque tint. Chrome doesn't blur the side cards behind it from inside the
  carousel's 3D (`backdrop-filter` on the card, the frame or the track: all stay sharp), so the tint does the work.
  Visuals uses it: its page is transparent in `?app`, and its window only tints it.
- `browser: { background, url }` puts the demo in a Safari window on a wallpaper, the same window as the earlier
  work's slideshow (`components/browser.tsx`). The window's page is 902 × 576 in the card's 1180ths, so lay the demo
  out at 1180 × 753 to fill it. Celsia uses it.
- The first slide in `content/work.ts` is the cover: the one in the middle when the page loads.
- A query string picks how the page shows (`?app`, `?embed`), so one page can serve several framings.
- `components/demo.tsx` draws the iframe and scales it to its box. The carousel uses it, and so can a project page:
  pass the slide's `media` from `content/work.ts` to `<Project demo={…}>` (as `app/work/celsia/page.tsx` does), and
  it shows at the top, wider than the text. Both read the same entry, so there's one place to change a demo.

## The demos

| Demo | What it is | Framing |
| --- | --- | --- |
| `public/demos/visuals/` | Made by hand: about 1,000 lines of plain HTML, CSS and JS, no build. Follows the real app's screens and words. | `?app`: only the app's window, filling the frame (used on the site). No query: a Mac desktop with the window, Safari and the Dock. |
| `public/demos/celsia/` | Made by hand, like Visuals, from Figma frames (some only concepts), rebranded away from the production app because the work is under NDA, and simplified so anyone can follow it: plain words instead of the standards' codes, none of the production app's specialist set-up (disclosure checklists, table blocks), and a made-up company, Northfield. Dark, in soft greys with one pale lemon accent, Geist, Lucide icons, and skeuomorphic icons in the sidebar and on Home. It starts at Home; the app's sidebar moves between Home, Data input with its guide, a report whose numbers and texts open in a sidebar, Insights, the Pollution topic, a target and the Help center. The guide's and the tour's pictures are crops of the demo's own screens on a dotted dark panel: take them again when the screens change. | Only the app's window. `?glass`: see-through around its panel, for a glass card (no longer used: the site shows it at 1180 × 753 in a browser window). |
| `public/demos/sanna/` | Made by hand like Visuals, from Sanna's screens in Figma (no repo to run): the timeline, a task with Hege's panel, All tasks complete. The flow between the screens is made up. | No query: a Mac desktop with Sanna's web app in Safari (used on the site). `?app`: only the app. |
| `public/demos/muster/` | A copy of the Muster landing page (its own repo). | `?embed`: only the landing page's Mac desktop. Its head comment says how to copy it again. |

Prefer the Visuals approach for a new demo: a product with a landing page can be copied as Muster was, but a hand-made
page is smaller and shows the app's real screens.

**Framing: only the app's window by default.** It reads best when the app itself is the story (Visuals). Add a Mac
desktop around it when the demo needs it, such as a story that crosses apps: a browser extension or a menu bar item
(Muster), or a web app, which reads as one in Safari (Sanna). The Visuals and Sanna pages have both, so either is a small change.

## Making a new one (the Visuals recipe)

1. **Study the real app first, from its repo.** Read its README and design doc. Run its Storybook on a free port (6006
   may be another project's): `STORYBOOK=true bunx storybook dev -p 6116 --no-open --ci`, list the stories from
   `localhost:6116/index.json`, and screenshot the ones you need with Playwright at 1180 × 720. Take the colours, radii
   and type from its CSS tokens (Visuals: `src/lib/ui/app.css`), its icons (Lucide), and its exact words.
2. **Copy `public/demos/visuals/` as the starting point** and keep its shape:
   - `index.html`: the window's frame; a head comment that says what the demo is and what it follows.
   - `styles.css`: the app's tokens at the top, then one section per area.
   - `script.js`, in one IIFE:
     - one state object `S`;
     - a render function for each region (`renderSide`, `renderPanel`, `renderOpen`, `renderLayer`), each writing
       `innerHTML` from `S`;
     - every control has `data-act` and `data-arg`; one click listener calls `ACTIONS[act](arg, event)`;
     - `renderPanel` keeps the scroll and skips the fade-in when the same page draws again (`pageKey`);
     - an animation that a re-render would restart, such as Sort's tags on each tile, changes the DOM in place;
     - a fake wait (`wait(ms)`, shortened with reduced motion) stands in for the app's real work, such as Claude
       answering; streamed answers are written a few characters at a time;
     - the walkthrough (every demo): Anastasia's cursor, a multiplayer one, goes through the pages and does on each
       what a visitor would (Visuals: Sort, Ask, the tag graph, Colors (beige, then blue), Generate; Celsia: Home, the data
       input guide, a target in the report, an answer written from the companies' answers, Insights and a target's
       actions; Sanna: the task, press by press (`nextTarget`); Muster: Sort and a fix in Safari, a folder in the menu bar, a
       fix in Terminal). Visuals, Celsia and Muster go round again (Muster resets its demo first); Sanna's story ends
       at All tasks complete, so its tour does too (`loop: false`). The cursor shows the way, so no demo has a ring
       or highlight on what to press next (the coach rings were taken out).
       `public/demos/walkthrough.js` is the engine, shared, and knows nothing of a demo: a demo loads it before its
       `script.js` and gives it its scenes at the end of `script.js`, and twins its `:hover` rules as `.is-walk-hover` (a
       line each, at the end of its `styles.css`).
       The visitor takes over when they press or type in the demo (hovering and scrolling don't); when they've been
       still for 5 seconds, or left it, the cursor carries on from their page. While it drives, `focus()` does nothing and `scrollIntoView()` scrolls only
       inside the demo, so the tour never scrolls the site or takes the carousel's arrow keys. In the carousel it runs only
       in the middle card (the others are `inert`): it starts when its card first comes to the middle, stops and fades
       out when the card moves to the side, and fades back in where it was and carries on when it's back (0.3 s after the card passes halfway, as it settles). It's off with reduced
       motion, on touch screens, and with `?nowalk`. After a round it starts again after 1.5 seconds. Over the carousel the
       visitor's own pointer over a card's picture or demo (not the space around it or the text under it) is a cursor in the same look, named You (`components/you-cursor.tsx` outside the demos,
       `walkthrough.js` inside them, at the same size on screen);
     - a change inside a tile (Visuals' slider) updates the tile in place: redrawing it and focusing again can jump to
       one of the loop's copies and scroll the grid.
3. **Follow the app's current version.** Check its version and design doc before each change: Visuals' brand
   projects, tag graph and palette changed between 0.9 and 0.16. Port the real logic where it's small (the tag graph's
   layout is `tag-graph.ts`, ported to plain JS).
4. **Pictures and content.** Use real pictures the person picks, with credit: Visuals' are posts from X and one
   Pinterest pin, listed in `pictures.js` (one entry per post: its link, its files, then a title, tags, colors and what
   Ask says of it, written by hand from looking at each picture). Keep copies in the demo's folder (WebP, 800px wide at
   most), since links to other sites break.
   - X: a post's pictures come from its public embed data, with no sign-in:
     `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=<t>`, where `t` is
     `((id / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')`. `mediaDetails` lists each picture; a video's
     `media_url_https` is its still. Add `?format=jpg&name=medium` to a picture's URL.
   - Pinterest: the pin's picture on `i.pinimg.com` (the `736x` size), from the pin's page.
   - From Figma (Sanna): take each screen's design context with the Figma MCP, and download its pictures and
     illustrations. Big ones (a vectorised illustration can be 4 MB of SVG) go to WebP at twice their drawn size, with the
     same canvas trick; icons are Lucide's, from `node_modules/lucide-react`.
   - Convert to WebP in headless Chromium (canvas `toDataURL('image/webp', 0.74)`): this Mac's ffmpeg and `sips`
     can't write WebP. Put downloads in their own folder and the scripts elsewhere, outside the repo.
5. **Add the slide** in `content/work.ts`.

## Checking it

- Serve `public/` (`python3 -m http.server 8731` from `public/`) and drive the page with Playwright at 1180 × 696:
  click through each flow, take screenshots, and fail on any `pageerror` or console error.
- Then look at it in the carousel on the dev server (`npm run dev`), in the middle card.

## Gotchas

- An `<img>` with `width` and `height` attributes needs `height: auto` in CSS, or it keeps the attribute's height.
- Tiles' pictures are `loading="lazy"`: a feed of 40 posts loads only what's in view.
- No `alert()` or `confirm()`: use the demo's own dialogs and toasts.
- Keyboard shortcuts work only once the iframe has focus; every flow must work with clicks alone.
- Fonts come from Google Fonts; everything else is in the folder. No analytics, no other network calls.
- Respect `prefers-reduced-motion`: the demos cut animations and fake waits short.
