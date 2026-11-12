"use client";

/* Section wrappers for page entrances.
   - enter: the staggered fade-up on load (data-enter, delayed by --i × 70ms).
   - observe (default on): fades up once as it scrolls into view (.reveal → .in-view). */

import { createElement, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cssVars } from "@/lib/dom";

type Props = HTMLAttributes<HTMLElement> & {
  as: "section" | "figure" | "div";
  className: string;
  enter?: number;
  observe?: boolean;
  children: ReactNode;
};

export function Reveal({ as, className, enter, observe = true, style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!observe) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [observe]);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: [className, observe && "reveal", inView && "in-view"].filter(Boolean).join(" "),
      "data-enter": enter === undefined ? undefined : "",
      style: enter === undefined ? style : { ...cssVars({ "--i": enter }), ...style },
    },
    children,
  );
}
