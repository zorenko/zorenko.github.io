"use client";

/* Copy email with a small tooltip. Never opens the mail app: if the clipboard is blocked, the tooltip shows the address. */

import { useRef, useState, type ReactNode } from "react";
import { copyText } from "@/lib/dom";
import { EMAIL } from "@/lib/site";

export function CopyEmail({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const [tip, setTip] = useState("");
  const timer = useRef(0);
  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      onClick={async () => {
        const ok = await copyText(EMAIL);
        setTip(ok ? "Email copied" : EMAIL);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setTip(""), ok ? 1500 : 4000);
      }}
    >
      {children}
      <span className="q-tip" role="status">{tip}</span>
    </button>
  );
}
