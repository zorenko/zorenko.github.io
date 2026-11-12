import Link from "next/link";
import type { ReactNode } from "react";
import { enter } from "@/lib/dom";
import { Shots, type Shot } from "./shots";

/** A project page: title, role, optional intro, screenshots that open in a lightbox, optional write-up, next project */
export function Project({ title, lead, role, intro, shots, next, children }: {
  title: string;
  lead: string;
  role: string;
  intro?: ReactNode;
  shots: Shot[];
  next: { href: string; title: string };
  children?: ReactNode;
}) {
  const shotsAt = intro ? 3 : 2;
  return (
    <main className="q" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>{title}</h1>
        <p className="q-plead">{lead}</p>
        <p>{role}</p>
      </header>
      {intro && <div className="q-pbody" {...enter(2)}>{intro}</div>}
      <Shots shots={shots} enter={shotsAt} />
      {children}
      <nav className="q-pnav" {...enter(shotsAt + 1)} aria-label="More projects">
        <Link href="/#q-work">All projects</Link>
        <Link href={next.href}>Next: {next.title} →</Link>
      </nav>
    </main>
  );
}
