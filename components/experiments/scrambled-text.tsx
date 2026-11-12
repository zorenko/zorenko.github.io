"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/dom";
import { useScramble } from "../scramble";
import type { ExperimentUI } from "./types";
import { useLoop } from "./use-loop";

/* Scrambled text: the name and role resolve out of random glyphs, one letter at a time. A hidden copy of the
   final text (.q-scr-ghost) holds the width so the line never jumps. Plays once when it scrolls into view,
   again on hover of the card it sits in (looping there) or on the Replay button next to it. */

function ScrambleLine({ text, className, run, delay, labelled }: { text: string; className: string; run: number; delay: number; labelled: boolean }) {
  const { content, play } = useScramble(text, 50);
  useEffect(() => {
    if (run) play(delay);
  }, [run, delay, play]);
  return (
    <span className={`q-scr-line ${className}`} aria-label={labelled ? text : undefined}>
      <span className="q-scr-ghost" aria-hidden="true">{text}</span>
      <span className="q-scr-live" aria-hidden="true">{content}</span>
    </span>
  );
}

export function ScrambleName({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0);
  const play = useCallback(() => setRun((r) => r + 1), []);
  const [inCard, setInCard] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const card = el.closest("a");
    const replay = el.closest(".q-xp")?.querySelector("[data-replay]");
    setInCard(!!card);
    card?.addEventListener("pointerenter", play);
    replay?.addEventListener("click", play);
    let once: IntersectionObserver | undefined;
    if (!prefersReducedMotion()) {
      once = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          play();
          once?.disconnect();
        }
      });
      once.observe(el);
    }
    return () => {
      card?.removeEventListener("pointerenter", play);
      replay?.removeEventListener("click", play);
      once?.disconnect();
    };
  }, [play]);
  useLoop(ref, 3600, play, inCard);

  const lines = (
    <>
      <ScrambleLine text="Anastasia Zorenko" className="q-scr-name" run={run} delay={0} labelled={large} />
      <ScrambleLine text="Design engineer" className="q-scr-role" run={run} delay={220} labelled={large} />
    </>
  );
  return large ? (
    <div className="q-scr q-scr--lg" ref={ref as RefObject<HTMLDivElement>}>
      <span className="q-scr-mark" aria-hidden="true">az</span>
      <div className="q-scr-who">{lines}</div>
    </div>
  ) : (
    <span className="q-scr" ref={ref}>
      <span className="q-scr-mark">az</span>
      <span className="q-scr-who">{lines}</span>
    </span>
  );
}

export const ui: ExperimentUI = {
  preview: () => <ScrambleName />,
  demo: () => (
    <>
      <ScrambleName large />
      <button className="q-xp-replay" type="button" data-replay="">Replay</button>
    </>
  ),
};
