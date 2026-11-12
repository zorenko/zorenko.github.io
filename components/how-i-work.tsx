"use client";

/* How I work: the Product / Branding / Growth tabs and the steps that open.
   Arrow keys, Home and End move between tabs; the choice is kept in the URL (#branding, #growth) so a tab
   can be linked to. Panel ids are prefixed so the hash never scrolls the page.
   Each step is one row (number, name, its tools' icons, how many posts are about it) that opens to show the
   tools and those posts. */

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Post } from "@/content/posts";
import { STATUS_LABEL, stepSlug, type Tab, type Tool } from "@/content/stack";
import { cssVars } from "@/lib/dom";
import { formatMonth } from "@/lib/site";

const CHEV = (
  <svg className="q-ts-chev" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 6 4 4 4-4" />
  </svg>
);
const DOC = (
  <svg className="q-ts-doc" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.75 1.75h5.5l3 3v9.5h-8.5z" />
    <path d="M9 1.75V5h3.25" />
    <path d="M6 8.25h4M6 10.75h3" />
  </svg>
);

function ToolIcon({ tool, row = false }: { tool: Tool; row?: boolean }) {
  const out = row && tool.status === "phasing-out" ? "" : undefined;
  if (!tool.icon)
    return (
      <span className="q-ts-icon" aria-hidden="true" data-out={out}>
        {tool.name[0]}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`q-ts-icon${tool.iconPad ? " q-ts-icon--pad" : ""}`} src={`/assets/img/stack/${tool.icon}`} alt="" width={20} height={20} data-out={out} />
  );
}

function Panel({ tab, hidden, postsByStep }: { tab: Tab; hidden: boolean; postsByStep: Record<string, Post[]> }) {
  const [open, setOpen] = useState<boolean[]>(() => tab.steps.map(() => false));
  const allOpen = open.every(Boolean);

  return (
    <section className="q-ts-panel" id={`q-ts-${tab.id}`} role="tabpanel" aria-labelledby={`q-ts-tab-${tab.id}`} tabIndex={0} data-enter="" style={cssVars({ "--i": 3 })} hidden={hidden}>
      <p className="q-ts-intro">{tab.intro}</p>
      <ol className="q-ts" role="list" aria-label={`${tab.label} process`}>
        {tab.steps.map((step, k) => {
          const id = `q-ts-${tab.id}-${stepSlug(step.name)}`;
          const posts = postsByStep[`${tab.id}/${stepSlug(step.name)}`] ?? [];
          return (
            <li className="q-ts-step" style={cssVars({ "--k": k })} key={step.name}>
              <h2 className="q-ts-head">
                <button type="button" className="q-ts-btn" aria-controls={id} aria-expanded={open[k]} onClick={() => setOpen((o) => o.map((v, x) => (x === k ? !v : v)))}>
                  <span className="q-ts-n">{String(k + 1).padStart(2, "0")}</span>
                  <span className="q-ts-title">
                    {step.name}
                    <span className="q-sr">: {step.tools.map((t) => t.name).join(", ")}</span>
                  </span>
                  <span className="q-ts-icons" aria-hidden="true">
                    {step.tools.map((t, x) => <ToolIcon tool={t} row key={x} />)}
                  </span>
                  <span className="q-ts-count">{posts.length ? `${posts.length} post${posts.length > 1 ? "s" : ""}` : ""}</span>
                  {CHEV}
                </button>
              </h2>
              <div className="q-ts-body" id={id} inert={!open[k]}>
                <div className="q-ts-inner">
                  <p className="q-ts-desc">{step.desc}</p>
                  <ul className="q-ts-tools" role="list">
                    {step.tools.map((t, x) => (
                      <li className="q-ts-tool" key={x}>
                        <b className="q-ts-name">
                          <ToolIcon tool={t} />
                          {t.name}
                        </b>
                        <span className="q-ts-note">{t.note}</span>
                        <span className="q-ts-status" data-status={t.status}>{STATUS_LABEL[t.status]}</span>
                      </li>
                    ))}
                  </ul>
                  {posts.length > 0 && (
                    <div className="q-ts-writing">
                      <h3 className="q-ts-label">Writing about this step</h3>
                      <ul className="q-ts-posts" role="list">
                        {posts.map((p) => (
                          <li className="q-ts-post" key={p.slug}>
                            {DOC}
                            <Link href={`/blog/${p.slug}/`}>{p.title}</Link>
                            <time dateTime={p.date}>{formatMonth(p.date)}</time>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="q-ts-all" onClick={() => setOpen(open.map(() => !allOpen))}>
        {allOpen ? "Close all steps" : "Open all steps"}
      </button>
    </section>
  );
}

export function StackTabs({ tabs, postsByStep }: { tabs: Tab[]; postsByStep: Record<string, Post[]> }) {
  const [selected, setSelected] = useState(0);
  const [switched, setSwitched] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number, { focus = false, push = false } = {}) => {
    setSelected(i);
    if (focus) tabRefs.current[i]?.focus();
    if (push) history.replaceState(history.state, "", i === 0 ? location.pathname + location.search : `#${tabs[i].id}`);
  };

  // The tab named in the URL, now and when the hash changes (other hashes, like the skip link's #q-main, are ignored)
  useEffect(() => {
    const fromHash = () => {
      const i = tabs.findIndex((t) => `#${t.id}` === location.hash);
      if (i >= 0) setSelected(i);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <>
      <div
        className="q-ts-tabs"
        role="tablist"
        aria-label="Kind of work"
        data-enter=""
        style={cssVars({ "--i": 2 })}
        data-value={String(selected)}
        data-switched={switched ? "" : undefined}
        onKeyDown={(e) => {
          const i = tabRefs.current.indexOf(document.activeElement as HTMLButtonElement);
          const n = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key];
          if (i < 0 || n === undefined) return;
          e.preventDefault();
          setSwitched(true);
          select((n + tabs.length) % tabs.length, { focus: true, push: true });
        }}
      >
        <span className="q-ts-pill" aria-hidden="true" />
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`q-ts-tab-${t.id}`}
            aria-controls={`q-ts-${t.id}`}
            aria-selected={i === selected}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => {
              if (i === selected) return;
              setSwitched(true);
              select(i, { push: true });
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <Fragment key={t.id}>
          <Panel tab={t} hidden={i !== selected} postsByStep={postsByStep} />
        </Fragment>
      ))}
    </>
  );
}
