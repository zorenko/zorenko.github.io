/* Umami events (components/analytics.tsx loads Umami). Each shows in the Umami dashboard under Events, by name,
   with its data as properties. Calls before Umami has loaded, or where it never loads (`npm run dev`, tests, other
   hosts), do nothing.
   Called from code, not Umami's data-umami-event attributes: on a link those make Umami do the navigation itself,
   a full page load that would skip Next's client-side routing. */

type Data = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Data) => void };
  }
}

export const EVENTS = {
  email: "Email copied",
  linkedin: "LinkedIn opened",
  project: "Project opened",
  demo: "Demo used",
  outbound: "Outside link opened",
  cookiesAllowed: "Cookies allowed",
  cookiesDeclined: "Cookies declined",
  cookieQuestionOpened: "Cookie question opened",
} as const;

export function track(event: (typeof EVENTS)[keyof typeof EVENTS], data?: Data) {
  try {
    window.umami?.track(event, data);
  } catch {}
}
