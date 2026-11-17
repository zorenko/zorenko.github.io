import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { ExperimentWall } from "@/components/experiment-wall";
import { LISTED } from "@/content/experiments";
import { PostList } from "@/components/post-list";
import { ScrambleText } from "@/components/scramble";
import { WorkCarousel } from "@/components/work-carousel";
import { posts } from "@/content/posts";
import { WORK } from "@/content/work";
import { enter } from "@/lib/dom";
import { SHOW } from "@/lib/flags";
import { LINKEDIN, NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${NAME} | Digital Designer` },
  openGraph: { type: "website", title: `${NAME} | Digital Designer`, description: "Digital designer with 10 years of experience in product development: product, brand and design engineering." },
};

// The experiments wall at the bottom of the page. Hidden for now; true brings it back (with SHOW.experiments on too).
const SHOW_EXPERIMENTS_WALL = false;

export default function Home() {
  return (
    <main className="q" id="q-main">
      <header className="q-head" {...enter(0)}>
        <div className="q-profile">
          <div className="q-who">
            <ScrambleText as="h1" className="q-name" text="Anastasia Z." delay={150} />
          </div>
        </div>

        <div className="q-tools">
          <a className="q-icon" href={LINKEDIN} target="_blank" rel="me noopener" aria-label="LinkedIn">
            {/* A padded viewBox, so the mark draws at 14px inside the 16px slot */}
            <svg viewBox="-1 -1 18 18" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" /></svg>
          </a>
          <CopyEmail className="q-icon" label="Copy email address">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" /><path d="m2.5 4.5 5.5 4 5.5-4" /></svg>
          </CopyEmail>
        </div>

        <p>Designer with 10 years of experience in product development. Helping companies with product, brand and design engineering through the full scope of design work from problem definition to shipping final solutions. Previously, part of Celsia, Cognite, Yandex and <Link href="/about/">other teams</Link>. Based in Oslo.</p>
      </header>

      {/* The carousel names itself ("Work") for screen readers, so no visible title */}
      <div className="q-sec q-sec--work" id="q-work" {...enter(1)}>
        <WorkCarousel items={WORK} label="Work" />
      </div>

      {/* No visible section title; aria-label names it for screen readers */}
      {SHOW.writing && (
        <section className="q-sec" {...enter(2)} aria-label="Writing">
          <PostList posts={posts.slice(0, 3)} />
          <Link className="q-more" href="/blog/">All posts</Link>
        </section>
      )}

      {SHOW.experiments && SHOW_EXPERIMENTS_WALL && (
        <section className="q-sec q-sec--wall" {...enter(3)} aria-label="Experiments">
          <ExperimentWall items={LISTED} />
        </section>
      )}
    </main>
  );
}
