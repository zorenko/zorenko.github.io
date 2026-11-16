"use client";

/* "You": while the pointer is over a work card's picture or demo (not the space around it or the text under it), it
   shows as a multiplayer cursor named You, in the same look as the demos' walkthrough cursor (Anastasia,
   public/demos/walkthrough.js). It's one cursor over the whole card, demo and all: over a demo's live page the pointer
   belongs to the demo's frame, so the demo (walkthrough.js) hides it there and tells this one where it is, in the
   page's pixels ("you-cursor"). Only for a mouse: a touch has no pointer to show.
   The CSS is .walk in app/site.css. */

import { useEffect, useRef } from "react";

const COLOR = "#ef2b08"; // public/demos/walkthrough.js has the same
const ARROW =
  '<svg class="walk__arrow" viewBox="0 0 24 24"><path d="M3.5 2.6 20.6 9.3a.6.6 0 0 1-.05 1.13l-7.3 2.3-2.3 7.3a.6.6 0 0 1-1.13.05L3.1 3a.33.33 0 0 1 .4-.4Z"/></svg>';

export function YouCursor() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(".q-car");
    if (!root || !matchMedia("(pointer: fine)").matches) return;
    // On the body, not in the carousel: its 3D would move a fixed element with it
    const el = document.createElement("div");
    el.className = "walk walk--you";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--walk", COLOR);
    el.innerHTML = `<div class="walk__in">${ARROW}<span class="walk__name">You</span></div>`;
    document.body.append(el);
    root.classList.add("has-you");

    let leaving = 0;
    const hide = () => { clearTimeout(leaving); el.classList.remove("is-on"); };
    const put = (x: number, y: number) => {
      clearTimeout(leaving);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.classList.toggle("is-left", x > innerWidth - 100);
      el.classList.toggle("is-up", y > innerHeight - 44);
      el.classList.add("is-on");
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return hide();
      const on = e.target as Element;
      // Over a demo's live page the demo says where the pointer is (below); only a card's picture or demo shows You
      if (on.tagName === "IFRAME") return;
      if (!on.closest(".q-car-media")) return hide();
      put(e.clientX, e.clientY);
    };
    // From a demo: where the pointer is over it, or null when it's left the demo. Leaving a demo is usually onto its
    // own card, which takes over at once, so wait a moment before hiding: no blink at the demo's edge
    const fromDemo = (e: Event) => {
      const at = (e as CustomEvent<{ x: number; y: number } | null>).detail;
      if (at) return put(at.x, at.y);
      clearTimeout(leaving);
      leaving = window.setTimeout(hide, 80);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", move);
    root.addEventListener("pointerleave", hide);
    addEventListener("you-cursor", fromDemo);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", move);
      root.removeEventListener("pointerleave", hide);
      removeEventListener("you-cursor", fromDemo);
      clearTimeout(leaving);
      root.classList.remove("has-you");
      el.remove();
    };
  }, []);

  return <span ref={ref} hidden />;
}
