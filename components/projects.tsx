/* Projects: the case studies and the previous portfolio (About page) */

import Link from "next/link";

const PROJECTS = [
  { href: "/work/sanna/", img: "/assets/img/work/sanna-slide-02.jpg", title: "Sanna", blurb: "Two app redesigns, 140+ merged PRs in ten weeks" },
  { href: "/work/celsia/", img: "/assets/img/work/celsia-slide-01.jpg", title: "Celsia", blurb: "Reporting module from zero to one, acquired 2024" },
  { href: "/work/earlier-work/", img: "/assets/img/work/other-slide-07.jpg", title: "Yandex, Kaspersky, Cognite", blurb: "Cloud, security and industrial data products" },
];

export function Projects() {
  return (
    <>
      <h2 className="q-title" id="q-proj">Projects</h2>
      <div className="q-grid">
        {PROJECTS.map((p) => (
          <Link className="q-card" href={p.href} key={p.href}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="q-thumb"><img src={p.img} alt="" loading="lazy" decoding="async" /></span>
            <span className="q-card-text"><span>{p.title}</span><span className="q-muted">{p.blurb}</span></span>
          </Link>
        ))}
        {/* The previous portfolio is a separate site, so a plain link */}
        <a className="q-card" href="/portfolio-2021/">
          <span className="q-thumb q-thumb--archive"><span className="q-archive-word">2016–2021</span></span>
          <span className="q-card-text"><span>Archive</span><span className="q-muted">The previous portfolio</span></span>
        </a>
      </div>
    </>
  );
}
