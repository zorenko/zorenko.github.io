/* Work carousel on the home page (components/work-carousel.tsx), in order: the first one starts in the middle.

   To add a slide, add an entry here. Media is one of:
   - demo: a self-contained page in public/demos/<name>/, shown live in an iframe. It's drawn at `width` × `height`
     and scaled to fit the card, so lay it out for that size (the Muster demo's ?embed mode shows only its desk).
   - image: a still, cropped to the card's shape (1180 × 696) from the top.
   - video: muted and looping; plays only while it's on screen.
   A demo can set `background`, shown while it loads.
   `href` links the title (and, for images and videos, the picture in the middle). Links starting with http open
   in a new tab. */

export type WorkMedia =
  | { type: "demo"; src: string; width: number; height: number; title: string; background?: string }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string };

export type WorkItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  media: WorkMedia;
};

export const WORK: WorkItem[] = [
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
    media: { type: "image", src: "/assets/img/work/sanna-slide-02.jpg", alt: "Sanna app screens" },
  },
  {
    id: "celsia",
    title: "Celsia",
    description: "An ESG reporting module, from zero to one. Celsia was acquired in 2024.",
    href: "/work/celsia/",
    media: { type: "image", src: "/assets/img/work/celsia-slide-01.jpg", alt: "Celsia reporting module" },
  },
  {
    id: "earlier-work",
    title: "Yandex, Kaspersky, Cognite",
    description: "Cloud, security and industrial data products.",
    href: "/work/earlier-work/",
    media: { type: "image", src: "/assets/img/work/other-slide-07.jpg", alt: "Screens from earlier work" },
  },
];
