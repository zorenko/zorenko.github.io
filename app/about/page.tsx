import { Experience } from "@/components/experience";
import { Projects } from "@/components/projects";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("About", "Design engineer in Oslo. Seven years designing and building complex, data-dense software.");

export default function About() {
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>About</h1>
        <p className="q-plead">Based in Oslo. I design and build clear, calm interfaces for products with a lot going on, from first sketch to shipped code.</p>
      </header>

      {/* No visible section titles here; aria-label names them for screen readers */}
      <section className="q-sec" {...enter(2)} aria-label="Experience">
        <Experience />
      </section>

      <section className="q-sec" {...enter(3)} aria-label="Projects">
        <Projects />
      </section>
    </main>
  );
}
