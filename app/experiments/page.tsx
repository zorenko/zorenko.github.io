import Link from "next/link";
import { ExperimentsCanvas } from "@/components/experiments-canvas";
import { ExperimentDemo } from "@/components/experiments";
import { EXPERIMENTS, experimentHref } from "@/content/experiments";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Experiments", "Small interaction patterns and component ideas, built in the browser.");

export default function Experiments() {
  return (
    <>
      <main className="q q-xp-page" id="q-main">
        <header className="q-phead" {...enter(1)}>
          <h1>Experiments</h1>
          <p className="q-plead">Small interaction patterns and component ideas, built in the browser. Each one is live, so go ahead and poke it.</p>
        </header>

        <div className="q-tray q-tray--stack q-xp-list" {...enter(2)}>
          {EXPERIMENTS.map((xp) => (
            <article className="q-xp" id={xp.id} key={xp.id} aria-labelledby={`xp-${xp.id}`}>
              <ExperimentDemo xp={xp} />
              <div className="q-xp-text">
                <h2 id={`xp-${xp.id}`}>
                  <Link href={experimentHref(xp)}>{xp.title} <span aria-hidden="true">→</span></Link>
                </h2>
                <p>{xp.blurb}.</p>
              </div>
            </article>
          ))}
        </div>
      </main>
      <ExperimentsCanvas />
    </>
  );
}
