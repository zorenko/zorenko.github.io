"use client";

/* Umami: cookieless visit counts, so it runs without asking (Google Analytics, in consent.tsx, still asks). Page views,
   client-side route changes included, are Umami's own. On top, one listener here counts clicks on links that leave
   the site (EVENTS.outbound, or EVENTS.linkedin for LinkedIn); the other events are sent where they happen
   (lib/track.ts). Rendered once in the root layout, in production builds only; data-domains keeps local previews of
   the build from counting.
   Page views of "Page not found" (app/not-found.tsx, marked data-not-found) are dropped: they are almost all bots
   trying old or made-up addresses (/auth/logout and the like), one 0-second visit at a time. */

import Script from "next/script";
import { useEffect } from "react";
import { EVENTS, track } from "@/lib/track";

// Umami looks this up on window by name (data-before-send) before every send; a falsy return cancels it. A page view
// is the payload without an event name. Defined when this module loads, so before the script (afterInteractive) runs.
const BEFORE_SEND = "qUmamiBeforeSend";
if (typeof window !== "undefined")
  Object.assign(window, {
    [BEFORE_SEND]: (_type: string, payload: { name?: string }) => (!payload.name && document.querySelector("[data-not-found]") ? null : payload),
  });

export function Analytics({ websiteId, domain }: { websiteId: string; domain: string }) {
  useEffect(() => {
    // Capture phase and pointer-agnostic "click": also a middle click's auxclick, which opens a link in a new tab
    const onClick = (e: MouseEvent) => {
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !/^https?:$/.test(a.protocol) || a.hostname === location.hostname) return;
      if (/(^|\.)linkedin\.com$/.test(a.hostname)) track(EVENTS.linkedin, { from: location.pathname });
      else track(EVENTS.outbound, { url: `${a.hostname}${a.pathname === "/" ? "" : a.pathname}`, from: location.pathname });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return <Script src="https://cloud.umami.is/script.js" data-website-id={websiteId} data-domains={domain} data-before-send={BEFORE_SEND} strategy="afterInteractive" />;
}
