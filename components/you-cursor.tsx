"use client";

/* "You": while the pointer is over a work card's picture or demo (not the space around it or the text under it), it
   shows as a multiplayer cursor named You, in the same look as the demos' walkthrough cursor (Anastasia,
   public/demos/walkthrough.js). Over a demo's live page the pointer belongs to the demo's frame, so this one hides
   there and the demo draws its own You, at the same size on screen. Only for a mouse: a touch has no pointer to show.
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

    const hide = () => el.classList.remove("is-on");
    const move = (e: PointerEvent) => {
      const on = e.target as Element;
      // Only over a card's picture or demo, and not over a demo's live page (it draws its own there)
      if (e.pointerType !== "mouse" || on.tagName === "IFRAME" || !on.closest(".q-car-media")) return hide();
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      el.classList.toggle("is-left", e.clientX > innerWidth - 100);
      el.classList.toggle("is-up", e.clientY > innerHeight - 44);
      el.classList.add("is-on");
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", move);
    root.addEventListener("pointerleave", hide);
    // Over a demo's live page, the frame takes the pointer and the parent hears it leave
    const out = (e: PointerEvent) => { if ((e.relatedTarget as Element | null)?.tagName === "IFRAME") hide(); };
    root.addEventListener("pointerout", out);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", move);
      root.removeEventListener("pointerleave", hide);
      root.removeEventListener("pointerout", out);
      root.classList.remove("has-you");
      el.remove();
    };
  }, []);

  return <span ref={ref} hidden />;
}
