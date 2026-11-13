import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { enter } from "@/lib/dom";
import { SHOW } from "@/lib/flags";
import { Demo, type DemoMedia } from "./demo";
import { Shots, type Shot } from "./shots";

/** A project page: title, role, an optional live demo, optional intro, screenshots that open in a lightbox, optional
    write-up, next project */
export function Project({ title, lead, role, demo, intro, shots, next, children }: {
  title: string;
  lead: string;
  role: string;
  /** The project's demo from content/work.ts, so it's the same one the home page's carousel shows */
  demo?: DemoMedia;
  intro?: ReactNode;
  shots: Shot[];
  next: { href: string; title: string };
  children?: ReactNode;
}) {
  const introAt = demo ? 3 : 2;
  if (!SHOW.projectPages) notFound(); // switched off in lib/flags.ts
  const shotsAt = introAt + (intro ? 1 : 0);
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>{title}</h1>
        <p className="q-plead">{lead}</p>
        <p>{role}</p>
      </header>
      {demo && (
        <figure className="q-pdemo" {...enter(2)}>
          <Demo demo={demo} />
          <figcaption>A live demo: click around</figcaption>
        </figure>
      )}
      {intro && <div className="q-pbody" {...enter(introAt)}>{intro}</div>}
      <Shots shots={shots} enter={shotsAt} />
      {children}
      <nav className="q-pnav" {...enter(shotsAt + 1)} aria-label="More projects">
        <Link href="/#q-work">All projects</Link>
        <Link href={next.href}>Next: {next.title} →</Link>
      </nav>
    </main>
  );
}
