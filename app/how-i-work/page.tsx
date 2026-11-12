import Link from "next/link";
import { StackTabs } from "@/components/how-i-work";
import { isStackVersion, posts, type Post } from "@/content/posts";
import { TABS } from "@/content/stack";
import { enter } from "@/lib/dom";
import { formatDate, pageMeta } from "@/lib/site";

export const metadata = pageMeta("How I work", "How Anastasia Zorenko works: the steps and tools for product, branding and growth work, and what is changing.");

// Posts about each step ("product/design" → posts), newest first
const postsByStep: Record<string, Post[]> = {};
for (const p of posts) for (const k of p.stack ?? []) (postsByStep[k] ??= []).push(p);

// Every post tagged "Tech stack" is one version of the stack: the newest gives "Last updated", the rest are listed below it
const versions = posts.filter(isStackVersion).map((p, k, all) => ({ ...p, v: all.length - k }));
const [latest, ...older] = versions;

export default function HowIWork() {
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>How I work</h1>
        <p className="q-plead">The tools I use at each step of my work, for the three kinds of work I do. Some are settled, some I’m trying out, and some are on their way out.</p>
      </header>

      <StackTabs tabs={TABS} postsByStep={postsByStep} />

      <section className="q-sec q-ts-log" {...enter(4)} aria-labelledby="q-ts-log">
        <h2 className="q-sr" id="q-ts-log">Versions</h2>
        <p className="q-ts-updated">
          {latest ? (
            <>
              Last updated: <time dateTime={latest.date}>{formatDate(latest.date)}</time> ·{" "}
              <Link href={`/blog/${latest.slug}/`} title={latest.title}>Update notes</Link>
            </>
          ) : (
            <>Changes are explained on the <Link href="/blog/">blog</Link>.</>
          )}
        </p>
        {older.length > 0 && (
          <div>
            <h3 className="q-title">Previous versions</h3>
            <ul className="q-list" role="list">
              {older.map((p) => (
                <li className="q-row" key={p.slug}>
                  <span><span className="q-ts-v">v{p.v}</span><time dateTime={p.date}>{formatDate(p.date)}</time></span>
                  <Link href={`/blog/${p.slug}/`} title={p.title} aria-label={`Update notes for version ${p.v}, ${formatDate(p.date)}`}>Update notes</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
