"use client";

/* Analytics consent: a small glass island (styled like the dock) that asks before Google Tag Manager loads
   (Google Analytics runs inside the container). Nothing from Google loads, and no cookies are set, until the
   visitor picks Allow. The choice is kept in localStorage ("q-analytics": "granted" or "denied").
   <CookieSettings /> reopens the island to change it. Rendered once in the root layout, only when GTM_ID in
   lib/site.ts is set. */

import { GoogleTagManager } from "@next/third-parties/google";
import { useEffect, useRef, useState } from "react";

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

export function Consent({ gtmId, load }: { gtmId: string; load: boolean }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false); // the chevron's menu holding Decline
  const rootRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);
  const viaKeyboard = useRef(false); // opened with Enter or Space: move focus into the menu

  useEffect(() => {
    const saved = read();
    if (saved === "denied") clearAnalyticsCookies(); // the tag can rewrite them while the page unloads after Decline
    setChoice(saved);
    setOpen(saved === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  // The menu closes on a click outside or Escape (which hands focus back to the chevron)
  useEffect(() => {
    if (!menu) return;
    if (viaKeyboard.current) declineRef.current?.focus({ preventScroll: true });
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(false);
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
  };

  return (
    <>
      {load && choice === "granted" && <GoogleTagManager gtmId={gtmId} />}
      {open && (
        <section className="q-consent" ref={rootRef} aria-label="Analytics cookies" data-open={menu ? "true" : undefined}>
          <span className="q-dock-bg" aria-hidden="true" />
          <p className="q-consent-text">Allow analytics cookies?</p>
          <div className="q-consent-actions">
            {/* A split button: Allow, and a chevron that opens a menu with Decline */}
            <button type="button" className="q-consent-btn q-consent-allow" onClick={() => decide("granted")}>
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
            {menu && (
              <div className="q-consent-menu" id="q-consent-menu" role="menu">
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
