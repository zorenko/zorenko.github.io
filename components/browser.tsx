/* A Safari window on a wallpaper, filling a work card (1180 × 696): its toolbar as in the Muster demo, the address
   bar showing `url` (the path after the first slash in grey). The window's page is 902 × 576 in 1180ths of the card
   (app/site.css, .q-car-desk), the same in every card that uses it. `children` is the page; `around` sits on the
   wallpaper beside the window (a slideshow's arrows); `dark` gives Safari its dark toolbar, for a dark page. Used by the carousel's slideshows and by demos with `browser`. */

import type { ReactNode } from "react";

export function Browser({ background, url, dark, children, around }: {
  background: string;
  url: string;
  dark?: boolean;
  children: ReactNode;
  around?: ReactNode;
}) {
  const slash = url.indexOf("/");
  return (
    <div className={`q-car-desk${dark ? " q-car-desk--dark" : ""}`} style={{ background }}>
      <div className="q-car-win">
        <div className="q-car-sbar" aria-hidden="true">
          <span className="q-car-lights"><i /><i /><i /></span>
          <i className="q-car-ico q-car-ico--side" />
          <span className="q-car-nav"><i /><i /></span>
          <span className="q-car-url">
            {slash < 0 ? url : url.slice(0, slash)}
            {slash >= 0 && <span>{url.slice(slash)}</span>}
            <i className="q-car-ico q-car-ico--reload" />
          </span>
          <span className="q-car-tools"><i className="q-car-ico q-car-ico--share" /><i className="q-car-ico q-car-ico--plus" /><i className="q-car-ico q-car-ico--tabs" /></span>
        </div>
        {children}
      </div>
      {around}
    </div>
  );
}
