import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentDemo } from "@/components/experiments";
import { EXPERIMENTS, experimentHref } from "@/content/experiments";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

/* One experiment: the live demo, what it is and how it works, then the next one (wrapping round to the first) */

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => EXPERIMENTS.map((xp) => ({ id: xp.id }));

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const xp = EXPERIMENTS.find((x) => x.id === id);
  return xp ? pageMeta(xp.title, xp.blurb) : {};
}

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const k = EXPERIMENTS.findIndex((x) => x.id === id);
  if (k < 0) notFound();
  const xp = EXPERIMENTS[k];
  const next = EXPERIMENTS[(k + 1) % EXPERIMENTS.length];

  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>{xp.title}</h1>
        <p className="q-plead">{xp.blurb}</p>
      </header>
      <div className="q-tray q-tray--stack q-xp-solo" {...enter(2)}>
        <div className="q-xp">
          <ExperimentDemo xp={xp} />
        </div>
      </div>
      <div className="q-pbody" {...enter(3)}>
        {xp.about.map((p) => <p key={p}>{p}</p>)}
        {"basedOn" in xp && (
          <p className="q-muted">
            Based on <a href={xp.basedOn.href}>{xp.basedOn.label}</a>.
          </p>
        )}
      </div>
      <nav className="q-pnav" {...enter(4)} aria-label="More experiments">
        <Link href="/experiments/">All experiments</Link>
        <Link href={experimentHref(next)}>Next: {next.title} →</Link>
      </nav>
    </main>
  );
}
