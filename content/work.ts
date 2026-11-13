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
   `href` links the title (only the title: the picture doesn't link). Links starting with http open in a new tab. */

export type WorkMedia =
  | { type: "demo"; src: string; width: number; height: number; title: string; background?: string; glass?: boolean }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string }
  | { type: "slides"; slides: { src: string; url?: string }[]; alt: string; browser?: { background: string } };

export type WorkItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  media: WorkMedia;
};

export const WORK: WorkItem[] = [
  {
    // Only the app's window (?app). Without ?app the page is a Mac desktop with the window, Safari and the Dock.
    id: "visuals",
    title: "Visuals",
    description: "Saves pictures from X, Pinterest and any page. Your own Claude tags them, and writes a brand project's brief from its pictures.",
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
    id: "muster",
    title: "Muster",
    description: "Finds every skill across Claude Code, Codex, plugins and projects, flags clashes and duplicates, and sorts them into folders.",
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
    id: "sanna",
    title: "Sanna",
    description: "Two app redesigns and more than 140 merged pull requests in ten weeks.",
    href: "/work/sanna/",
    media: {
      // A Mac desktop with Sanna's client app in Safari. With ?app it's only the app.
      type: "demo",
      src: "/demos/sanna/index.html",
      width: 1180,
      height: 696,
      title: "Sanna demo: a Mac desktop with Sanna's client app in Safari, on an annual financial statement",
      // The demo's wallpaper, showing while it loads
      background:
        "radial-gradient(120% 90% at 0% 0%, #f6e3cc 0%, transparent 60%), radial-gradient(100% 100% at 100% 100%, #d3dcc4 0%, transparent 60%), linear-gradient(135deg, #f3e9dc, #e4e2d2)",
    },
  },
  {
    id: "celsia",
    title: "Celsia",
    description: "An ESG reporting module, from zero to one. Celsia was acquired in 2024.",
    href: "/work/celsia/",
    media: {
      type: "demo",
      src: "/demos/celsia/index.html",
      width: 1180,
      height: 696,
      title: "Celsia demo: the reporting module, with data input, insights and targets",
      // The app's light grey, showing while the demo loads
      background: "#f1f1f3",
    },
  },
  {
    id: "earlier-work",
    title: "Yandex, Kaspersky, Cognite",
    description: "Cloud, security and industrial data products.",
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
        // A pale, warm sunset wallpaper: apricot at the top left, rose at the top right, deep coral at the bottom right
        background:
          "radial-gradient(70% 90% at 0% 0%, #fff1de 0%, transparent 65%), radial-gradient(60% 80% at 100% 0%, #fad5de 0%, transparent 65%), radial-gradient(80% 100% at 100% 100%, #f3a493 0%, transparent 70%), radial-gradient(60% 70% at 0% 100%, #f9c6a2 0%, transparent 70%), linear-gradient(135deg, #fde7cd, #f6c0b0)",
      },
    },
  },
];
