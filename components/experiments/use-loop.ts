"use client";

import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/dom";

/** Call tick every `ms` while `ref` is on screen and the page is visible. A data-phase (0–1) on an
    ancestor shifts the first tick, so repeated previews on the canvas don't all move in step. */
export function useLoop(ref: RefObject<HTMLElement | null>, ms: number, tick: () => void, enabled = true) {
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || prefersReducedMotion()) return;
    const phase = Number(el.closest<HTMLElement>("[data-phase]")?.dataset.phase) || 0;
    const run = () => tickRef.current();
    let timer = 0;
    let seen = false;
    const sync = () => {
      const on = seen && !document.hidden;
      if (on && !timer) {
        timer = window.setTimeout(() => {
          run();
          timer = window.setInterval(run, ms);
        }, phase * ms);
      } else if (!on && timer) {
        clearTimeout(timer);
        clearInterval(timer);
        timer = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [ref, ms, enabled]);
}
