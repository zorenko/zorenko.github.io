/* A company's or product's name with its mark before it, on a small rounded tile in its colour, like an app icon.
   Used before the work carousel's titles (components/work-carousel.tsx).
   The marks are one-colour SVGs in public/assets/img/companies/, drawn in `fg` through a CSS mask. Visuals and Muster
   share one mark, in their own app icons' colours. Where the rest came from: Sanna, Cognite and Yandex Cloud from their
   sites; Celsia from its old site (on the Internet Archive). */

type Mark = { bg: string; fg?: string; wide?: boolean };

export const COMPANIES = {
  sanna: { bg: "linear-gradient(#573c25, #3a210c)", fg: "#fbf8f0" },
  celsia: { bg: "#1c1c57" },
  cognite: { bg: "#1a1a1a", wide: true },
  "yandex-cloud": { bg: "#2a9fff" },
  visuals: { bg: "linear-gradient(#3a3a3a, #1f1f1f 60%, #171717)", fg: "#fafafa" },
  muster: { bg: "linear-gradient(#f3f76f, #edf12f 60%, #e7ec24)", fg: "#202020" },
} satisfies Record<string, Mark>;

export type CompanyId = keyof typeof COMPANIES;

export function CompanyIcon({ id }: { id: CompanyId }) {
  const m: Mark = COMPANIES[id];
  return (
    <span className="q-co-icon" style={{ background: m.bg }} aria-hidden="true">
      <span
        className={`q-co-mark${m.wide ? " q-co-mark--wide" : ""}`}
        style={{ background: m.fg ?? "#fff", maskImage: `url(/assets/img/companies/${id}.svg)` }}
      />
    </span>
  );
}

/* The icon and the name stay together on one line */
export function Company({ id, children, as: Tag = "span" }: { id?: CompanyId; children: React.ReactNode; as?: "span" | "b" }) {
  return (
    <Tag className="q-co">
      {id && <CompanyIcon id={id} />}
      {children}
    </Tag>
  );
}
