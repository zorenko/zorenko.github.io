import { Experience } from "@/components/experience";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("About", "Independent digital designer with 10 years of experience in product development: product, brand and design engineering.");

export default function About() {
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>About</h1>
        <p className="q-plead">Independent digital designer with 10 years of experience in product development. Helping companies with product, brand and design engineering through the full scope of design work from problem definition to shipping final solutions. Previously, part of Celsia, Cognite, Yandex and other teams.</p>
      </header>

      {/* No visible section titles here; aria-label names them for screen readers */}
      <section className="q-sec" {...enter(2)} aria-label="Experience">
        <Experience />
      </section>

      <section className="q-sec" {...enter(3)} aria-label="Outside work">
        <p className="q-prose">In my spare time, I build my own products such as Muster and Visuals. I also love a good hike, travel to new places and Zwift.</p>
      </section>
    </main>
  );
}
