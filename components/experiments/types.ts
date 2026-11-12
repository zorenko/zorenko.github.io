import type { ReactNode } from "react";

/** What each experiment file exports as `ui`: the small looping preview (home page wall, canvas cards), the interactive
    demo (the /experiments/ list and the experiment's own page), and how tall the demo's well is (default "lg"). */
export type ExperimentUI = { preview: () => ReactNode; demo: () => ReactNode; well?: "lg" | "scene" | "editor" };
