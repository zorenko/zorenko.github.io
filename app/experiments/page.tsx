import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentsCanvas } from "@/components/experiments-canvas";
import { ExperimentPreview } from "@/components/experiments";
import { LISTED, experimentHref } from "@/content/experiments";
import { enter } from "@/lib/dom";
import { SHOW } from "@/lib/flags";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Experiments", "Small interaction patterns and component ideas, built in the browser.");

export default function Experiments() {
  if (!SHOW.experiments) notFound(); // switched off in lib/flags.ts
  return (
    <>
      <main className="q q-xp-page" id="q-main">
        <header className="q-phead" {...enter(1)}>
          <h1>Experiments</h1>
          <p className="q-plead">Small interaction patterns and component ideas, built in the browser. Each one is live, so go ahead and poke it.</p>
        </header>

        <div className="q-tray q-tray--stack q-xp-list" {...enter(2)}>
          {/* Each row: a small square of the looping preview, then the title and blurb. The whole row links to the
              experiment's page, where the full demo is */}
          {LISTED.map((xp) => (
            <Link className="q-xp q-xp--row" id={xp.id} key={xp.id} href={experimentHref(xp)}>
              <span className="q-xp-thumb" aria-hidden="true">
                <span className="q-stage">
                  <ExperimentPreview xp={xp} />
                </span>
              </span>
              <span className="q-xp-text">
                <h2>{xp.title} <span aria-hidden="true">→</span></h2>
                <p>{xp.blurb}.</p>
              </span>
            </Link>
          ))}
        </div>
      </main>
      <ExperimentsCanvas />
    </>
  );
}
