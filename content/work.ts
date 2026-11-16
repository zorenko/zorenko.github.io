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
   With `browser`, a demo shows in the same Safari window on that background as the slides, its address bar showing
   `url`. The window's page is 902 × 576 in the card's 1180ths, so lay the demo out at 1180 × 753 to fill it.
   `href` links the title (only the title: the picture doesn't link). Links starting with http open in a new tab.
   `year` shows after the title, after a middle dot: the same years as the project's page, where it has one.
   `icons` are the tiles before the title (components/company.tsx): one before it, or one before each name of a title
   that lists several, split at its commas ("Yandex, Cognite").
   `sites` are the products' or companies' own sites, the same way: one for the title, or one for each name. The title
   links to them (in a new tab) while its `href`, a project page, is switched off (lib/flags.ts). */

import type { CompanyId } from "@/components/company";

export type WorkMedia =
  | { type: "demo"; src: string; width: number; height: number; title: string; background?: string; glass?: boolean; browser?: { background: string; url: string; dark?: boolean } }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string }
  | { type: "slides"; slides: { src: string; url?: string }[]; alt: string; browser?: { background: string } };

export type WorkItem = {
  id: string;
  title: string;
  /** Tiles before the title: one, or one for each of its comma-separated names */
  icons?: CompanyId[];
  /** Their own sites: one, or one for each of its comma-separated names */
  sites?: string[];
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
    icons: ["visuals"],
    year: "2026",
    description: "Personal project. A home for the design references you save and never use: Claude sorts and tags them, learns your preferences and turns collections into a brief.",
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
    icons: ["celsia"],
    sites: ["https://celsia.io/"],
    year: "2022–2026",
    description: "Design lead. Celsia is software that helps companies collect data and write their EU sustainability (CSRD) reports. Acquired by ISS-Corporate in 2024.",
    href: "/work/celsia/",
    media: {
      type: "demo",
      src: "/demos/celsia/index.html",
      // In a Safari window like the earlier work's, so laid out at the window page's shape (902 × 576)
      width: 1180,
      height: 753,
      title: "Celsia demo: the reporting module, with data input, insights and targets",
      browser: {
        url: "app.celsia.io",
        // dark, like the app: Safari's dark toolbar on a soft grey wallpaper, lighter at the top left, grey all over (no
        // tint of the accent)
        dark: true,
        background:
          "radial-gradient(70% 90% at 0% 0%, #5b5d63 0%, transparent 65%), radial-gradient(60% 80% at 100% 0%, #48494e 0%, transparent 65%), radial-gradient(80% 100% at 100% 100%, #3b3c41 0%, transparent 70%), radial-gradient(60% 70% at 0% 100%, #36373c 0%, transparent 70%), linear-gradient(135deg, #46474c, #2c2d31)",
      },
    },
  },
  {
    id: "muster",
    title: "Muster",
    icons: ["muster"],
    year: "2026",
    description: "Personal project. Muster sorts the skills installed in Claude Code and Codex, keeps them updated, and flags the ones that clash, repeat or never run.",
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
    title: "Yandex, Cognite",
    icons: ["yandex-cloud", "cognite"],
    sites: ["https://yandex.cloud/en", "https://www.cognite.com/"],
    year: "2019–2022",
    description: "Product designer. Developer tools for the cloud and industrial data: consoles, dashboards and app builders that help developers work with complex systems and act on them.",
    href: "/work/earlier-work/",
    // The screens of the "portfolio – cv" Figma file's Section 3 (node 453:10709), in its order, exported at 2x
    // and scaled to 2000 px wide. Each `url` is what the address bar shows with it.
    media: {
      type: "slides",
      slides: [
        "yandex.ru",
        "cognite.com",
        "yandex.ru",
        "cognite.com",
        "yandex.ru",
        "cognite.com",
        "yandex.ru",
        "cognite.com",
        "yandex.ru",
      ].map((url, i) => ({ src: `/assets/img/work/earlier-screen-${String(i + 1).padStart(2, "0")}.jpg`, url })),
      alt: "Screens from earlier work at Yandex and Cognite",
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
    icons: ["sanna"],
    sites: ["https://www.sanna.no/"],
    year: "2026",
    description: "Contract work. Sanna is an accounting firm that automates the routine work and gives each company its own accountant at a fixed monthly price.",
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
