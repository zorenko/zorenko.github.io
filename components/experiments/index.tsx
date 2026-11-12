"use client";

/* Experiments: each one lives in its own file here (component and styles) and exports `ui` (see types.ts).
   This file maps the ids in content/experiments.ts to them and renders the shared frames round them.
   Previews loop only while on screen and the tab is visible; reduced motion shows one still frame.

   Adding one: write <id>.tsx (exporting `ui`) and <id>.css next to it, import it below, and add an entry to
   content/experiments.ts. Its page at /experiments/<id>/ is built from that entry. */

import type { Experiment } from "@/content/experiments";
import type { ExperimentUI } from "./types";
import { ui as koiAndBirds } from "./koi-and-birds";
import { ui as morphingButton } from "./morphing-button";
import { ui as scrambledText } from "./scrambled-text";
import { ui as stampFolder } from "./stamp-folder";
import { ui as themeSwitch } from "./theme-switch";

const UI: Record<Experiment["id"], ExperimentUI> = {
  "morphing-button": morphingButton,
  "scrambled-text": scrambledText,
  "theme-switch": themeSwitch,
  "koi-and-birds": koiAndBirds,
  "stamp-folder": stampFolder,
};

/** The interactive demo in its well (the /experiments/ list and each experiment's page) */
export function ExperimentDemo({ xp }: { xp: Experiment }) {
  const { demo, well = "lg" } = UI[xp.id];
  return <div className={`q-well q-well--${well}`}>{demo()}</div>;
}

/** The live preview on its own (home page experiments wall) */
export function ExperimentPreview({ xp }: { xp: Experiment }) {
  return <>{UI[xp.id].preview()}</>;
}

/** Thumbnail with a live preview, then the title and one line about it (canvas cards) */
export function ExperimentCardBody({ xp }: { xp: Experiment }) {
  return (
    <>
      <span className="q-thumb q-thumb--stage" aria-hidden="true">
        <span className="q-stage">{UI[xp.id].preview()}</span>
      </span>
      <span className="q-card-text">
        <span>{xp.title}</span>
        <span className="q-muted">{xp.blurb}</span>
      </span>
    </>
  );
}
