/* Work carousel on the home page (components/work-carousel.tsx), in order: the first one starts in the middle.

   To add a slide, add an entry here. Media is one of:
   - demo: a self-contained page in public/demos/<name>/, shown live in an iframe. It's drawn at `width` × `height`
     and scaled to fit the card, so lay it out for that size (the Muster demo's ?embed mode shows only its desk).
   - image: a still, cropped to the card's shape (1180 × 696) from the top.
   - video: muted and looping; plays only while it's on screen.
   - slides: stills that fade one into the next while the card is on screen, middle or side. In the middle they hold
     still while the cursor is on them, where arrows step back and forward; with reduced motion they only move with
     the arrows. Each picture loads just before its turn. With `browser`, they show in a Safari window on that
     background, its address bar showing each slide's `url`; without, they fill the card, cropped like an image.
   A demo can set `background`, shown while it loads, and `glass`: the demo's page is see-through where it wants the
   glass (Visuals' sidebar), so `background` stays under it as a tint that the side cards show through faintly.
   `href` links the title (only the title: the picture doesn't link). Links starting with http open in a new tab.
   `year` shows after the title, after a middle dot: the same years as the project's page, where it has one. */

export type WorkMedia =
  | { type: "demo"; src: string; width: number; height: number; title: string; background?: string; glass?: boolean }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string }
  | { type: "slides"; slides: { src: string; url?: string }[]; alt: string; browser?: { background: string } };

export type WorkItem = {
  id: string;
  title: string;
  /** When it was made: a year or a range, such as "2022–2026" */
  year: string;
  description: string;
  href?: string;
  media: WorkMedia;
};

export const WORK: WorkItem[] = [
  {
    // Only the app's window (?app). Without ?app the page is a Mac desktop with the window, Safari and the Dock.
    id: "visuals",
    title: "Visuals",
    year: "2026",
    description: "Inspiration gets lost across X, Pinterest and open tabs. Visuals keeps it in one place, tags it with your own Claude and turns it into a brief.",
    media: {
      type: "demo",
      src: "/demos/visuals/index.html?app",
      width: 1180,
      height: 696,
      title: "Visuals demo: the Visuals window, with a brand project",
      // The demo's wallpaper, a light tint, nearly opaque: the cards behind show through faintly (glass)
      glass: true,
      background:
        "radial-gradient(120% 90% at 0% 0%, rgb(241 236 210 / 0.9) 0%, transparent 60%), radial-gradient(100% 100% at 100% 100%, rgb(197 214 238 / 0.9) 0%, transparent 60%), linear-gradient(135deg, rgb(238 240 224 / 0.86), rgb(216 225 239 / 0.86))",
    },
  },
  {
    id: "celsia",
    title: "Celsia",
    year: "2022–2026",
    description: "EU sustainability reporting is slow, costly and easy to get wrong. Celsia makes reporting easy, ensures compliance and supports collaboration. Acquired in 2024.",
    href: "/work/celsia/",
    media: {
      type: "demo",
      src: "/demos/celsia/index.html?glass",
      width: 1180,
      height: 696,
      title: "Celsia demo: the reporting module, with data input, insights and targets",
      // The app's off-white as frosted glass: the page is see-through around its white panel, and this tint, a little
      // see-through, is blurred over whatever is behind the card
      glass: true,
      background: "linear-gradient(135deg, rgb(252 251 250 / 0.78), rgb(244 244 245 / 0.72))",
    },
  },
  {
    id: "muster",
    title: "Muster",
    year: "2026",
    description: "AI skills pile up across Claude Code, Codex, plugins and projects, clashing and duplicated. Muster finds every one and sorts them into folders.",
    href: "https://musteryourskills.com/",
    media: {
      type: "demo",
      src: "/demos/muster/index.html?embed",
      width: 1180,
      height: 696,
      title: "Muster demo: a Mac desktop with Muster in Safari, the menu bar and Terminal",
      // The landing page's wallpaper, showing while the demo loads
      background:
        "radial-gradient(120% 90% at 0% 0%, #f7e3d3 0%, transparent 60%), radial-gradient(100% 100% at 100% 100%, #c6c3f0 0%, transparent 60%), linear-gradient(135deg, #f1e4ea, #dcd8f3)",
    },
  },
  {
    id: "earlier-work",
    title: "Yandex, Kaspersky, Cognite",
    year: "2015–2021",
    description: "Engineers running clouds, security and industrial sites drown in dense, fast-moving data. Interfaces that keep it readable and quick to act on.",
    href: "/work/earlier-work/",
    // The screens of the "portfolio – cv" Figma file's Section 3 (node 453:10709), in its order, exported at 2x
    // and scaled to 2000 px wide. Each `url` is what the address bar shows with it.
    media: {
      type: "slides",
      slides: [
        "console.cloud.yandex.ru",
        "fusion.cognite.com",
        "yt.yandex-team.ru",
        "fusion.cognite.com",
        "logbroker.yandex-team.ru",
        "fusion.cognite.com",
        "cloud.yandex.ru/marketplace",
        "fusion.cognite.com",
        "status.cloud.yandex.ru",
      ].map((url, i) => ({ src: `/assets/img/work/earlier-screen-${String(i + 1).padStart(2, "0")}.jpg`, url })),
      alt: "Screens from earlier work at Yandex, Kaspersky and Cognite",
      browser: {
        // A gray steel wallpaper: near-white at the top left, pale silver at the top right, soft slate at the bottom right
        background:
          "radial-gradient(70% 90% at 0% 0%, #fcfcfd 0%, transparent 65%), radial-gradient(60% 80% at 100% 0%, #f1f3f6 0%, transparent 65%), radial-gradient(80% 100% at 100% 100%, #d3d9e0 0%, transparent 70%), radial-gradient(60% 70% at 0% 100%, #e7ebef 0%, transparent 70%), linear-gradient(135deg, #f6f7f9, #e1e5ea)",
      },
    },
  },
  {
    id: "sanna",
    title: "Sanna",
    year: "2026",
    description: "Year-end accounts and tax returns overwhelm small business owners. Sanna's app walks them through it step by step, with an accountant alongside.",
    href: "/work/sanna/",
    media: {
      // A Mac desktop with Sanna's client app in Safari. With ?app it's only the app.
      type: "demo",
      src: "/demos/sanna/index.html",
      width: 1180,
      height: 696,
      title: "Sanna demo: a Mac desktop with Sanna's client app in Safari, on an annual financial statement",
      // The demo's wallpaper (pastel cream at the top left, clear apricot orange at the bottom right), showing while it loads
      background:
        "radial-gradient(120% 90% at 0% 0%, #fff4e4 0%, transparent 60%), radial-gradient(100% 100% at 100% 100%, #ffbf8f 0%, transparent 60%), linear-gradient(135deg, #fdf0df, #fcd9bd)",
    },
  },
];
