"use client";

/* Analytics consent: a small glass island (styled like the dock) that asks before Google Tag Manager loads
   (Google Analytics runs inside the container). Nothing from Google loads, and no cookies are set, until the
   visitor picks Allow. The choice is kept in localStorage ("q-analytics": "granted" or "denied").
   <CookieSettings /> reopens the island to change it. Rendered once in the root layout, only when GTM_ID in
   lib/site.ts is set.
   On narrow screens the question waits behind a cookie icon in the bottom left corner (matching the theme switch
   on the right), so it doesn't sit over the page; tapping the icon opens the pill above it. */

import { GoogleTagManager } from "@next/third-parties/google";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/dom";

const KEY = "q-analytics";
const OPEN_EVENT = "q-analytics-open";
type Choice = "granted" | "denied";

const read = (): Choice | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
};

// Remove Google Analytics' cookies (_ga, _ga_<stream>) on every domain form it may have used.
const clearAnalyticsCookies = () => {
  const host = location.hostname;
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const domain of ["", `; domain=${host}`, `; domain=.${host}`])
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
};

/** Keeps something on the page for `ms` after `on` turns false, flagged as leaving, so it can animate out (the
    leaving animations are in app/site.css, [data-leaving]) */
function usePresence(on: boolean, ms: number) {
  const [lingering, setLingering] = useState(false);
  const [was, setWas] = useState(on);
  if (on !== was) {
    setWas(on);
    setLingering(!on && !prefersReducedMotion());
  }
  useEffect(() => {
    if (!lingering) return;
    const t = setTimeout(() => setLingering(false), ms);
    return () => clearTimeout(t);
  }, [lingering, ms]);
  return { shown: on || lingering, leaving: !on && lingering };
}

export function Consent({ gtmId, load }: { gtmId: string; load: boolean }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false); // the chevron's menu holding Decline
  const [expanded, setExpanded] = useState(false); // narrow screens: the pill is shown, not just the icon
  const rootRef = useRef<HTMLElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const allowRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);
  const viaKeyboard = useRef(false); // opened with Enter or Space: move focus into the menu
  // Leaving: after a choice the island sinks back out of the bottom edge it rose from; on narrow screens the pill
  // folds back toward the icon, and the menu fades back into the chevron
  const island = usePresence(open, 240);
  const pill = usePresence(expanded, 160);
  const menuP = usePresence(menu, 160);
  const out = island.leaving ? "out" : undefined;

  useEffect(() => {
    const saved = read();
    if (saved === "denied") clearAnalyticsCookies(); // the tag can rewrite them while the page unloads after Decline
    setChoice(saved);
    setOpen(saved === null);
    const reopen = () => {
      setOpen(true);
      setExpanded(true); // asked for from Cookie settings: skip the icon
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  // The menu closes on a click outside or Escape (which hands focus back to the chevron)
  useEffect(() => {
    if (!menu) return;
    if (viaKeyboard.current) declineRef.current?.focus({ preventScroll: true });
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setMenu(false);
      if (!chipRef.current?.contains(e.target as Node)) setExpanded(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      moreRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  // Narrow screens: once open, the pill folds back into the icon on a tap outside or Escape
  useEffect(() => {
    if (!expanded || menu) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !chipRef.current?.contains(t)) setExpanded(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !chipRef.current?.getClientRects().length) return;
      setExpanded(false);
      chipRef.current!.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded, menu]);

  const decide = (next: Choice) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    if (next === "denied") {
      clearAnalyticsCookies();
      // Tag Manager can't be unloaded once it runs, so a reload is the clean way to stop it.
      if (load && choice === "granted") return location.reload();
    }
    setChoice(next);
    setOpen(false);
    setMenu(false);
    setExpanded(false);
  };

  return (
    <>
      {load && choice === "granted" && <GoogleTagManager gtmId={gtmId} />}
      {island.shown && (
        <button
          type="button"
          className="q-consent-chip"
          data-leaving={out}
          inert={!!out}
          ref={chipRef}
          aria-label="Analytics cookies"
          aria-expanded={expanded}
          aria-controls="q-consent"
          onClick={(e) => {
            const next = !expanded;
            setExpanded(next);
            setMenu(false);
            if (next && e.detail === 0) requestAnimationFrame(() => allowRef.current?.focus({ preventScroll: true }));
          }}
        >
          <span className="q-dock-bg" aria-hidden="true" />
          <svg className="q-dock-glyph" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 9 9 3.5 3.5 0 0 1-4.5-4.5A3.5 3.5 0 0 1 12 3" />
            <path d="M8.5 9h.01M15.5 15h.01M11.5 12.5h.01M11 16.5h.01M7.5 13.5h.01" />
          </svg>
        </button>
      )}
      {island.shown && (
        <section
          className="q-consent"
          id="q-consent"
          ref={rootRef}
          aria-label="Analytics cookies"
          data-open={menuP.shown ? "true" : undefined}
          data-expanded={pill.shown || island.leaving ? "true" : undefined}
          data-leaving={out ?? (pill.leaving ? "fold" : undefined)}
          inert={!!out || pill.leaving}
        >
          <span className="q-dock-bg" aria-hidden="true" />
          <p className="q-consent-text">Allow analytics cookies?</p>
          <div className="q-consent-actions">
            {/* A split button: Allow, and a chevron that opens a menu with Decline */}
            <button type="button" className="q-consent-btn q-consent-allow" ref={allowRef} onClick={() => decide("granted")}>
              Allow
            </button>
            <button
              type="button"
              className="q-consent-btn q-consent-more"
              ref={moreRef}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-controls="q-consent-menu"
              onClick={(e) => {
                viaKeyboard.current = e.detail === 0;
                setMenu((m) => !m);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7.5 10 4.5 4.5 4.5-4.5" />
              </svg>
            </button>
            {menuP.shown && (
              <div className="q-consent-menu" id="q-consent-menu" role="menu" data-leaving={menuP.leaving ? "" : undefined} inert={menuP.leaving}>
                <span className="q-dock-bg" aria-hidden="true" />
                <button type="button" className="q-consent-row" role="menuitem" ref={declineRef} onClick={() => decide("denied")}>
                  Decline
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/** A text button that reopens the consent island, for changing the choice later. */
export function CookieSettings({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Cookie settings
    </button>
  );
}
