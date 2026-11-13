"use client";

/* Dock: a floating bottom bar (Home, About) whose last button opens a menu upward with the same pages and
   links to Experiments, Writing and How I work (less any switched off in lib/flags.ts). On an Experiments, Writing or How I work page, that page's
   icon joins the bar while you're there. Beside it, in the bottom right corner, a matching one-button theme
   switch opens upward into Light, Dark and System. Rendered once in the root layout. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { cssVars, prefersReducedMotion } from "@/lib/dom";
import { isShown } from "@/lib/flags";

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg className="q-dock-glyph" viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

const ICON = {
  home: {
    outline: <Glyph><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5H5.5A1.5 1.5 0 0 1 4 19Z" /></Glyph>,
    active: <Glyph><path className="q-dock-fill" fillRule="evenodd" d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Zm6 4.5v5.5h4V15Z" /></Glyph>,
  },
  lab: {
    outline: <Glyph><path d="M9.5 3.5h5M10.5 3.5v5.25L5.7 17.2a2.2 2.2 0 0 0 1.9 3.3h8.8a2.2 2.2 0 0 0 1.9-3.3l-4.8-8.45V3.5M7.9 14h8.2" /></Glyph>,
    active: <Glyph><path d="M9.5 3.5h5" /><path className="q-dock-fill" d="M10.5 3.5v5.25L5.7 17.2a2.2 2.2 0 0 0 1.9 3.3h8.8a2.2 2.2 0 0 0 1.9-3.3l-4.8-8.45V3.5Z" /></Glyph>,
  },
  writing: {
    outline: <Glyph><path d="M14.25 5.25 18.75 9.75M4.5 19.5l1-4.25L15.6 5.15a1.77 1.77 0 0 1 2.5 0l.75.75a1.77 1.77 0 0 1 0 2.5L8.75 18.5Z" /><path d="M13 19.5h6.5" /></Glyph>,
    active: <Glyph><path className="q-dock-fill" d="M4.5 19.5l1-4.25L15.6 5.15a1.77 1.77 0 0 1 2.5 0l.75.75a1.77 1.77 0 0 1 0 2.5L8.75 18.5Z" /><path d="M13 19.5h6.5" /></Glyph>,
  },
  stack: {
    outline: <Glyph><path d="M12 3.75 3.75 8 12 12.25 20.25 8Z" /><path d="m3.75 12 8.25 4.25L20.25 12M3.75 16l8.25 4.25L20.25 16" /></Glyph>,
    active: <Glyph><path className="q-dock-fill" d="M12 3.75 3.75 8 12 12.25 20.25 8Z" /><path d="m3.75 12 8.25 4.25L20.25 12M3.75 16l8.25 4.25L20.25 16" /></Glyph>,
  },
  about: {
    outline: <Glyph><circle cx="12" cy="8" r="3.75" /><path d="M5 19.25c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5a1 1 0 0 1-1 1.25H6a1 1 0 0 1-1-1.25Z" /></Glyph>,
    active: <Glyph><circle className="q-dock-fill" cx="12" cy="8" r="3.75" /><path className="q-dock-fill" d="M5 19.25c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5a1 1 0 0 1-1 1.25H6a1 1 0 0 1-1-1.25Z" /></Glyph>,
  },
};
const CHEVRONS = <Glyph><path d="m8.5 9.5 3.5-3.5 3.5 3.5M8.5 14.5l3.5 3.5 3.5-3.5" /></Glyph>;

const THEMES = [
  { id: "light", label: "Light", icon: <Glyph><circle cx="12" cy="12" r="4" /><path d="M12 2.75v1.5M12 19.75v1.5M2.75 12h1.5M19.75 12h1.5M5.46 5.46l1.06 1.06M17.48 17.48l1.06 1.06M5.46 18.54l1.06-1.06M17.48 6.52l1.06-1.06" /></Glyph> },
  { id: "dark", label: "Dark", icon: <Glyph><path d="M19.75 14.4A8.25 8.25 0 1 1 9.6 4.25a6.5 6.5 0 0 0 10.15 10.15Z" /></Glyph> },
  { id: "system", label: "System", icon: <Glyph><rect x="3.25" y="4.25" width="17.5" height="12.5" rx="2.5" /><path d="M8.5 20.25h7M12 16.75v3.5" /></Glyph> },
] as const;
type Mode = (typeof THEMES)[number]["id"];

// Light and Dark are saved; System clears the choice and follows the device, live.
// The inline script in the root layout's <head> applies the same rule before first paint.
const readMode = (): Mode => {
  try {
    return (localStorage.getItem("q-theme") as Mode) || "system";
  } catch {
    return "system";
  }
};
const applyTheme = (): Mode => {
  const m = readMode();
  const dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("q-dark", dark);
  return m;
};

type Item = { label: string; href: string; icon: keyof typeof ICON; on: boolean };
type View = "bar" | "panel";

export function Dock() {
  const path = (usePathname() || "/").replace(/\/?$/, "/");
  const items: Item[] = [
    { label: "Home", href: "/", icon: "home", on: path === "/" },
    { label: "About", href: "/about/", icon: "about", on: path.startsWith("/about/") },
  ];
  const more = (
    [
      { label: "Experiments", href: "/experiments/", icon: "lab", on: path.startsWith("/experiments/") },
      { label: "Writing", href: "/blog/", icon: "writing", on: path.startsWith("/blog/") },
      { label: "How I work", href: "/how-i-work/", icon: "stack", on: path.startsWith("/how-i-work/") },
    ] satisfies Item[]
  ).filter((it) => isShown(it.href)); // sections switched off in lib/flags.ts drop out
  const bar = [...items, ...more.filter((it) => it.on)];
  const current = (it: Item) => (it.on ? ({ "aria-current": "page", "data-active": "" } as const) : {});

  const navRef = useRef<HTMLElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  const [open, setOpenState] = useState(false);
  const [entering, setEntering] = useState<View | null>(null);
  const [leaving, setLeaving] = useState<View | null>(null);
  const [mini, setMini] = useState(false);
  const openRef = useRef(false);
  const fromRect = useRef<DOMRect | null>(null);
  const leaveT = useRef(0);
  const refocus = useRef(false); // Escape returns focus to the menu button once the bar is back

  // Open and close: the incoming view takes the layout, the outgoing one pops out and fades,
  // and the background grows or shrinks from the old size to the new one (anchored bottom centre).
  const setOpen = useCallback((next: boolean) => {
    if (next === openRef.current) return;
    openRef.current = next;
    fromRect.current = islandRef.current!.getBoundingClientRect();
    clearTimeout(leaveT.current);
    setEntering(next ? "panel" : "bar");
    if (prefersReducedMotion()) setLeaving(null);
    else {
      setLeaving(next ? "bar" : "panel");
      leaveT.current = window.setTimeout(() => setLeaving(null), 170);
    }
    setOpenState(next);
  }, []);

  useLayoutEffect(() => {
    const from = fromRect.current;
    if (!from) return;
    fromRect.current = null;
    const to = islandRef.current!.getBoundingClientRect();
    if (!prefersReducedMotion()) {
      const dx = (to.width - from.width) / 2;
      const dy = to.height - from.height;
      bgRef.current!.animate([{ inset: `${dy}px ${dx}px 0px ${dx}px` }, { inset: "0px 0px 0px 0px" }], {
        duration: 440,
        easing: "cubic-bezier(0.32, 1.12, 0.36, 1)",
      });
    }
    if (!open && refocus.current) {
      refocus.current = false;
      expandRef.current?.focus({ preventScroll: true });
    }
    if (open) {
      const panel = panelRef.current!;
      (panel.querySelector<HTMLElement>(".q-dock-row[aria-current]") || panel.querySelector<HTMLElement>(".q-dock-row"))?.focus({ preventScroll: true });
    }
  }, [open]);

  // Navigating closes the menu
  useEffect(() => setOpen(false), [path, setOpen]);

  useEffect(() => {
    const nav = navRef.current!;
    const onPointerDown = (e: PointerEvent) => {
      if (openRef.current && !nav.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (openRef.current && e.key === "Escape") {
        refocus.current = true;
        setOpen(false);
      }
    };
    // Shrinks while scrolling down, returns on the way up
    let last = scrollY;
    let run = 0;
    const onScroll = () => {
      const y = scrollY;
      const d = y - last;
      last = y;
      if (!d || openRef.current) return;
      if (d > 0 !== run > 0) run = 0;
      run += d;
      if (run > 14 && y > 72) setMini(true);
      else if (run < -14 || y <= 72) setMini(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("scroll", onScroll);
      clearTimeout(leaveT.current);
    };
  }, [setOpen]);

  const viewClass = (base: string, v: View) =>
    [base, entering === v && "is-entering", leaving === v && "is-leaving"].filter(Boolean).join(" ");
  const row = (it: Item, k: number) => (
    <li key={it.href} style={cssVars({ "--k": k })}>
      <Link className="q-dock-row" href={it.href} {...current(it)}>
        {it.on ? ICON[it.icon].active : ICON[it.icon].outline}
        <span>{it.label}</span>
      </Link>
    </li>
  );

  return (
    <>
      <nav className="q-dock" aria-label="Primary" ref={navRef}>
        <div className="q-dock-island" ref={islandRef} data-open={String(open)} data-mini={mini ? "true" : undefined}>
          <span className="q-dock-bg" aria-hidden="true" ref={bgRef} />
          <div className={viewClass("q-dock-bar", "bar")} hidden={open && leaving !== "bar"}>
            {bar.map((it) => (
              <Link key={it.href} className="q-dock-icon" href={it.href} aria-label={it.label} {...current(it)}>
                {it.on ? ICON[it.icon].active : ICON[it.icon].outline}
                <span className="q-dock-tip" aria-hidden="true">{it.label}</span>
              </Link>
            ))}
            <button
              ref={expandRef}
              className="q-dock-icon q-dock-expand"
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="q-dock-menu"
              onClick={() => setOpen(true)}
            >
              {CHEVRONS}
              <span className="q-dock-tip" aria-hidden="true">More</span>
            </button>
          </div>
          <div
            className={viewClass("q-dock-panel", "panel")}
            id="q-dock-menu"
            ref={panelRef}
            hidden={!open && leaving !== "panel"}
            onBlur={(e) => {
              if (openRef.current && e.relatedTarget && !navRef.current!.contains(e.relatedTarget as Node)) setOpen(false);
            }}
          >
            <ul className="q-dock-list" role="list">{items.map((it, k) => row(it, k))}</ul>
            <ul className="q-dock-list q-dock-list--more" role="list">{more.map((it, k) => row(it, items.length + k))}</ul>
          </div>
        </div>
      </nav>
      <ThemeSwitch mini={mini} />
    </>
  );
}

// One button showing the current theme; opening it grows the island upward into all three, like the dock's menu.
function ThemeSwitch({ mini }: { mini: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode | undefined>(undefined);
  const [open, setOpenState] = useState(false);
  const openRef = useRef(false);
  const fromHeight = useRef<number | null>(null);
  const refocus = useRef(false);

  const setOpen = useCallback((next: boolean, focusTrigger = false) => {
    if (next === openRef.current) return;
    openRef.current = next;
    refocus.current = focusTrigger;
    fromHeight.current = rootRef.current!.offsetHeight; // layout size, unaffected by the mini scale
    setOpenState(next);
  }, []);

  useLayoutEffect(() => {
    const from = fromHeight.current;
    if (from === null) return;
    fromHeight.current = null;
    const dy = rootRef.current!.offsetHeight - from;
    if (!prefersReducedMotion()) {
      bgRef.current!.animate([{ inset: `${dy}px 0px 0px 0px` }, { inset: "0px 0px 0px 0px" }], {
        duration: 440,
        easing: "cubic-bezier(0.32, 1.12, 0.36, 1)",
      });
    }
    if (open) listRef.current!.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    else if (refocus.current) {
      refocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    const prefersDark = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => setMode(applyTheme());
    onScheme();
    const onPointerDown = (e: PointerEvent) => {
      if (openRef.current && !rootRef.current!.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (openRef.current && e.key === "Escape") setOpen(false, true);
    };
    prefersDark.addEventListener("change", onScheme);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      prefersDark.removeEventListener("change", onScheme);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpen]);

  const choose = (m: Mode) => {
    try {
      if (m === "system") localStorage.removeItem("q-theme");
      else localStorage.setItem("q-theme", m);
    } catch {}
    setMode(applyTheme());
    setOpen(false, true);
  };

  // Up and Down move between the options
  const onListKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const opts = [...listRef.current!.querySelectorAll<HTMLElement>("button")];
    const i = opts.indexOf(document.activeElement as HTMLElement);
    opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length]?.focus();
  };

  const current = THEMES.find((t) => t.id === (mode ?? "system"))!;

  return (
    <div className="q-theme" ref={rootRef} data-open={String(open)} data-mini={mini && !open ? "true" : undefined}>
      <span className="q-dock-bg" aria-hidden="true" ref={bgRef} />
      {open ? (
        <div
          className="q-theme-list"
          id="q-theme-menu"
          role="radiogroup"
          aria-label="Colour theme"
          ref={listRef}
          onKeyDown={onListKeyDown}
          onBlur={(e) => {
            if (openRef.current && e.relatedTarget && !rootRef.current!.contains(e.relatedTarget as Node)) setOpen(false);
          }}
        >
          {THEMES.map((t, k) => (
            <button
              key={t.id}
              className="q-dock-icon"
              type="button"
              role="radio"
              aria-label={t.label}
              aria-checked={mode === t.id}
              style={cssVars({ "--k": k })}
              onClick={() => choose(t.id)}
            >
              {t.icon}
              <span className="q-dock-tip" aria-hidden="true">{t.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          ref={triggerRef}
          className="q-dock-icon q-theme-trigger"
          type="button"
          aria-label={`Colour theme: ${current.label}`}
          aria-expanded={false}
          aria-controls="q-theme-menu"
          onClick={() => setOpen(true)}
        >
          {current.icon}
          <span className="q-dock-tip" aria-hidden="true">Theme</span>
        </button>
      )}
    </div>
  );
}
