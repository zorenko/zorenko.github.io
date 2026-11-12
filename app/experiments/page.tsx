import { ExperimentsCanvas } from "@/components/experiments-canvas";
import { MorphButton, ScrambleName, ThemeMini } from "@/components/experiments";
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
          <article className="q-xp" id="morphing-button" aria-labelledby="xp-morph">
            <div className="q-well q-well--lg">
              <MorphButton interactive />
            </div>
            <div className="q-xp-text">
              <h2 id="xp-morph">Morphing Button</h2>
              <p>A button that resizes smoothly as its label and icon change. A hidden copy of the next state is measured, the width animates to it, and the icon and label slide through clipped cells while the old ones pop out of the layout. Click it to step through the states.</p>
            </div>
          </article>

          <article className="q-xp" id="scrambled-text" aria-labelledby="xp-scr">
            <div className="q-well q-well--lg">
              <ScrambleName large />
              <button className="q-xp-replay" type="button" data-replay="">Replay</button>
            </div>
            <div className="q-xp-text">
              <h2 id="xp-scr">Scrambled Text</h2>
              <p>Type that resolves out of random glyphs, one letter at a time. The unresolved letters keep flickering in a faded monospace, and a hidden copy of the final text holds the width so the line never jumps. It&apos;s the same effect as the name at the top of the home page.</p>
            </div>
          </article>

          <article className="q-xp" id="theme-switch" aria-labelledby="xp-theme">
            <div className="q-well q-well--lg">
              <ThemeMini interactive size="lg" />
            </div>
            <div className="q-xp-text">
              <h2 id="xp-theme">Theme Switch</h2>
              <p>A light and dark toggle whose icon spins and unblurs into place while the page eases between palettes. The whole preview is drawn in em, so a single font-size scales it. Click the page to switch it.</p>
            </div>
          </article>
        </div>
      </main>
      <ExperimentsCanvas />
    </>
  );
}
