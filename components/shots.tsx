"use client";

/* Project screenshots that open in a lightbox: Esc closes, arrow keys step through, focus returns to the opener. */

import { useCallback, useEffect, useRef, useState } from "react";
import { afterPaint, prefersReducedMotion } from "@/lib/dom";
import { Reveal } from "./reveal";

export type Shot = { src: string; alt: string; caption: string; width?: number; height?: number };

export function Shots({ shots, enter }: { shots: Shot[]; enter: number }) {
  const lbRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const frames = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(-1);
  const [mounted, setMounted] = useState(false); // in the DOM (not hidden)
  const [shown, setShown] = useState(false); // data-open, which runs the transition
  const opener = useRef(-1);
  const closeT = useRef(0);

  const show = useCallback(
    (i: number) => {
      const k = (i + shots.length) % shots.length;
      setIndex(k);
      // warm the neighbours so arrow keys don't wait on the network
      for (const d of [1, -1]) new Image().src = shots[(k + d + shots.length) % shots.length].src;
    },
    [shots],
  );

  const open = (i: number) => {
    clearTimeout(closeT.current);
    opener.current = i;
    show(i);
    setMounted(true);
    document.body.style.overflow = "hidden";
  };
  const close = useCallback(() => {
    setShown(false);
    document.body.style.overflow = "";
    closeT.current = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : 250);
    frames.current[opener.current]?.focus({ preventScroll: true });
  }, []);

  // Once visible, fade in on the next frames and move focus into the dialog
  useEffect(() => {
    if (!mounted) return;
    closeRef.current?.focus({ preventScroll: true });
    return afterPaint(() => setShown(true));
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); show(index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopImmediatePropagation(); show(index - 1); }
      else if (e.key === "Tab") { e.preventDefault(); closeRef.current?.focus(); }
    };
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, [mounted, index, show, close]);

  useEffect(() => () => { document.body.style.overflow = ""; clearTimeout(closeT.current); }, []);

  const current = index >= 0 ? shots[index] : null;

  return (
    <>
      <Reveal as="section" className="q-shots" enter={enter} aria-label="Screens" observe={false}>
        {shots.map((s, i) => (
          <Reveal as="figure" className="q-shot" key={s.src}>
            <button className="q-frame" type="button" aria-label={`Enlarge: ${s.caption}`} ref={(el) => { frames.current[i] = el; }} onClick={() => open(i)}>
              <img src={s.src} width={s.width ?? 1600} height={s.height ?? 1022} alt={s.alt} loading="lazy" decoding="async" />
            </button>
            <figcaption>{s.caption}</figcaption>
          </Reveal>
        ))}
      </Reveal>

      <div className="q-lb" role="dialog" aria-modal="true" aria-label="Image viewer" hidden={!mounted} data-open={shown ? "" : undefined} ref={lbRef}>
        <div className="q-lb-bg" onClick={close} />
        <figure className="q-lb-body">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current?.src} alt={current?.alt ?? ""} onClick={close} />
          <figcaption>{current?.caption}</figcaption>
        </figure>
        <button className="q-lb-close" type="button" aria-label="Close" ref={closeRef} onClick={close}>
          Close
        </button>
      </div>
    </>
  );
}
