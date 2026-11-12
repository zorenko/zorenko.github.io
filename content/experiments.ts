/* The experiments, in the order they're listed on /experiments/ and tiled on its canvas. Each one has its own page
   at /experiments/<id>/ (app/experiments/[id]/page.tsx) with the live demo, the paragraphs in `about` and, if there's
   one, a link to what it was based on. Each id needs its own file in components/experiments/ (see index.tsx there).

   hidden: true keeps an experiment off the home page wall, the list and the canvas, and out of search engines. Its
   page is still built, so the link works for anyone you send it to: a place for drafts and things not ready to show. */
export const EXPERIMENTS = [
  {
    id: "koi-and-birds",
    title: "Koi and Birds",
    blurb: "Koi, a flock and a single bird, drawn in a grid of characters",
    about: [
      "A koi pond, a flock seen from above and a single bird seen side-on, all drawn on one canvas as a grid of tinted tiles and monospace characters. Each cell works out where it falls on a body, shades it like a lit cylinder and picks a character by brightness.",
      "The koi swim on a chain of joints with a wave running down it. The birds flap and glide, bank into turns and keep their distance from each other. The side-on wings are a small 3D model that bends at the wrist, seen from a little above.",
      "Click to feed the koi or startle the birds, and move the cursor slowly to draw them in. The panel switches scenes and shows the skeleton underneath.",
    ],
    basedOn: { label: "the koi pond on daoho.dev", href: "https://www.daoho.dev/" },
  },
  {
    id: "stamp-folder",
    title: "Stamp Folder",
    blurb: "A frosted folder whose stamps peek out on hover and fan out when it opens",
    about: [
      "A frosted folder cover, hinged on the left, with two stamps blurred behind it. On hover the cover tilts a little and the stamps slide partway out, tipped at an angle, one just after the other, with a small spring.",
      "Click it and the cover swings open while the stamps settle flat, side by side. The stamps are drawn in CSS and SVG, their perforated edges are a mask of half-circle bites, and the cover blurs whatever is behind it.",
      "Hover, focus or click the folder, and use the dots to change its colour.",
    ],
    basedOn: { label: "a folder animation by @AdityaSur11 on X", href: "https://x.com/AdityaSur11/status/2116088350071558294" },
  },
] as const satisfies readonly {
  id: string;
  title: string;
  blurb: string;
  about: readonly string[];
  basedOn?: { label: string; href: string };
  hidden?: boolean;
}[];
export type Experiment = (typeof EXPERIMENTS)[number];

/** Whether an experiment shows on the home page wall, the list and the canvas */
export const isListed = (xp: Experiment) => !("hidden" in xp && xp.hidden);
/** The experiments that show on the site, in order */
export const LISTED: readonly Experiment[] = EXPERIMENTS.filter(isListed);

export const experimentHref = (xp: Experiment) => `/experiments/${xp.id}/`;
