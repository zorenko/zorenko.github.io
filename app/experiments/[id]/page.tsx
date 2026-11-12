import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentDemo } from "@/components/experiments";
import { EXPERIMENTS, LISTED, experimentHref, isListed } from "@/content/experiments";
import { enter } from "@/lib/dom";
import { pageMeta } from "@/lib/site";

/* One experiment: the live demo, what it is and how it works, then the next listed one (wrapping round to the first).
   Hidden experiments get a page too, marked as unlisted and kept out of search engines. */

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => EXPERIMENTS.map((xp) => ({ id: xp.id }));

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const xp = EXPERIMENTS.find((x) => x.id === id);
  if (!xp) return {};
  return isListed(xp) ? pageMeta(xp.title, xp.blurb) : { ...pageMeta(xp.title, xp.blurb), robots: { index: false, follow: false } };
}

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const xp = EXPERIMENTS.find((x) => x.id === id);
  if (!xp) notFound();
  const listed = isListed(xp);
  const k = LISTED.indexOf(xp);
  const next = LISTED[(k + 1) % LISTED.length]; // a hidden one (k = -1) leads to the first

  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>{xp.title}</h1>
        <p className="q-plead">{xp.blurb}</p>
        {!listed && <p>Unlisted: only people with the link can see this.</p>}
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
