import type { CSSProperties } from "react";

/** Inline style with CSS custom properties, e.g. cssVars({ "--i": 1 }) */
export const cssVars = (vars: Record<`--${string}`, string | number>) => vars as CSSProperties;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wait two frames, so a class added now starts its transition from the current state */
export const afterPaint = (fn: () => void) => {
  let inner = 0;
  const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(fn)));
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
};

/** Copy text to the clipboard, falling back to execCommand where the Clipboard API is blocked */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
  ta.style.cssText = "position:fixed;top:0;opacity:0";
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

/** Props for the staggered entrance on page load: <header {...enter(1)}> */
export const enter = (i: number) => ({ "data-enter": "", style: cssVars({ "--i": i }) });
