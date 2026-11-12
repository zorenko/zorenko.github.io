/* The experiments, in the order they're listed on /experiments/ and tiled on its canvas.
   Each id needs a live preview in components/experiments.tsx (PREVIEWS) and an article on the page. */
export const EXPERIMENTS = [
  { id: "morphing-button", title: "Morphing Button", blurb: "A button that resizes smoothly as its label and icon change" },
  { id: "scrambled-text", title: "Scrambled Text", blurb: "Type that resolves out of random glyphs, one letter at a time" },
  { id: "theme-switch", title: "Theme Switch", blurb: "A light and dark toggle whose icon spins and unblurs into place" },
] as const;
export type Experiment = (typeof EXPERIMENTS)[number];
