"use client";

/* Scrambled text: type resolves out of random glyphs, one letter at a time.
   Unresolved letters keep flickering every 60ms in a faded monospace (.q-enc). */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/dom";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?/";
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

type Frame = { n: number; glyphs: string[] };

/** Returns what to render (the plain text once resolved) and play(delay), which starts a new run */
export function useScramble(text: string, stepMs: number) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const timers = useRef<number[]>([]);
  const stop = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
  };

  const play = useCallback(
    (delay = 0) => {
      stop();
      if (prefersReducedMotion()) return setFrame(null);
      const chars = [...text];
      const glyphs = chars.map((c) => (c === " " ? " " : rnd()));
      let n = 0;
      const draw = () => setFrame({ n, glyphs: [...glyphs] });
      draw();
      timers.current.push(
        window.setTimeout(() => {
          timers.current.push(
            window.setInterval(() => {
              for (let k = n; k < chars.length; k++) if (chars[k] !== " ") glyphs[k] = rnd();
              draw();
            }, 60),
            window.setInterval(() => {
              if (++n < chars.length) return draw();
              stop();
              setFrame(null);
            }, stepMs),
          );
        }, delay),
      );
    },
    [text, stepMs],
  );
  useEffect(() => stop, []);

  const chars = [...text];
  const content: ReactNode = frame
    ? chars.map((c, k) =>
        c === " " || k < frame.n ? c : (
          <span key={k} className="q-enc" aria-hidden="true">
            {frame.glyphs[k]}
          </span>
        ),
      )
    : text;
  return { content, scrambling: frame !== null, play };
}

/** A heading or line that scrambles in once, `delay` ms after it mounts (the name on the home page) */
export function ScrambleText({ as: Tag, className, text, delay }: { as: "h1" | "p"; className: string; text: string; delay: number }) {
  const { content, scrambling, play } = useScramble(text, 70);
  useEffect(() => {
    if (!prefersReducedMotion()) play(delay);
  }, [play, delay]);
  return (
    <Tag className={className} aria-label={scrambling ? text : undefined}>
      {content}
    </Tag>
  );
}
