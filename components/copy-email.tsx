"use client";

/* Copy email with a small tooltip. Never opens the mail app: if the clipboard is blocked, the tooltip shows the address.
   The text stays while the tooltip fades out (data-shown), and is cleared after, so the next copy is announced again. */

import { useRef, useState, type ReactNode } from "react";
import { copyText } from "@/lib/dom";
import { EMAIL } from "@/lib/site";

const FADE = 200; // a little over the tooltip's 180ms fade in app/site.css (.q-tip)

export function CopyEmail({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const [tip, setTip] = useState("");
  const [shown, setShown] = useState(false);
  const timer = useRef(0);
  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      onClick={async () => {
        const ok = await copyText(EMAIL);
        clearTimeout(timer.current);
        setTip(ok ? "Email copied" : EMAIL);
        setShown(true);
        timer.current = window.setTimeout(() => {
          setShown(false);
          timer.current = window.setTimeout(() => setTip(""), FADE);
        }, ok ? 1500 : 4000);
      }}
    >
      {children}
      <span className="q-tip" role="status" data-shown={shown ? "" : undefined}>{tip}</span>
    </button>
  );
}
