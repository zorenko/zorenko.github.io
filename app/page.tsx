import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { Experience } from "@/components/experience";
import { ExperimentWall } from "@/components/experiment-wall";
import { EXPERIMENTS } from "@/content/experiments";
import { PostList } from "@/components/post-list";
import { ScrambleText } from "@/components/scramble";
import { WorkCarousel } from "@/components/work-carousel";
import { posts } from "@/content/posts";
import { WORK } from "@/content/work";
import { enter } from "@/lib/dom";
import { LINKEDIN, NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${NAME} | Design Engineer` },
  openGraph: { type: "website", title: `${NAME} | Design Engineer`, description: "Design engineer in Oslo." },
};

export default function Home() {
  return (
    <main className="q" id="q-main">
      <header className="q-head" {...enter(0)}>
        <div className="q-profile">
          <Link className="q-mark" href="/" aria-label={`${NAME}, home`}>az</Link>
          <div className="q-who">
            <ScrambleText as="h1" className="q-name" text={NAME} delay={150} />
            <ScrambleText as="p" className="q-role" text="Design engineer" delay={400} />
          </div>
        </div>

        <div className="q-tools">
          <a className="q-icon" href={LINKEDIN} target="_blank" rel="me noopener" aria-label="LinkedIn">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11ZM4 6h2v6H4V6Zm1-3a1.1 1.1 0 1 1 0 2.2A1.1 1.1 0 0 1 5 3Zm2.5 3h1.9v.9c.3-.5 1-1.1 2.1-1.1 2 0 2.5 1.2 2.5 2.9V12h-2V9.1c0-.8-.1-1.6-1.1-1.6s-1.3.7-1.3 1.6V12h-2V6Z" /></svg>
          </a>
          <CopyEmail className="q-icon" label="Copy email address">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" /><path d="m2.5 4.5 5.5 4 5.5-4" /></svg>
          </CopyEmail>
        </div>

        <p>Based in Oslo. I design and build clear, calm interfaces for products with a lot going on, from first sketch to shipped code.</p>
      </header>

      {/* The carousel names itself ("Work") for screen readers, so no visible title */}
      <div className="q-sec" {...enter(1)}>
        <WorkCarousel items={WORK} label="Work" />
      </div>

      <section className="q-sec" {...enter(2)} aria-labelledby="q-exp">
        <Experience />
      </section>

      <section className="q-sec" {...enter(3)} aria-labelledby="q-writing">
        <div className="q-title-row">
          <h2 className="q-title" id="q-writing">Writing</h2>
          <Link className="q-more" href="/blog/">All posts</Link>
        </div>
        <PostList posts={posts.slice(0, 3)} />
      </section>

      <section className="q-sec q-sec--wall" {...enter(4)} aria-label="Experiments">
        <ExperimentWall items={EXPERIMENTS} />
      </section>
    </main>
  );
}
