/* Experience list: on the home page (under the work carousel) and the About page */

const EXPERIENCE = [
  { role: "Design Engineer", company: "Sanna", year: 2026 },
  { role: "Design Manager, VP", company: "ISS-Corporate", year: 2024 },
  { role: "Lead Designer", company: "Celsia", year: 2022 },
  { role: "Product Designer", company: "Cognite", year: 2021 },
  { role: "Product Designer", company: "Yandex Cloud", year: 2019 },
  { role: "UX/UI Designer", company: "Nexign", year: 2017 },
  { role: "Product Designer", company: "Kaspersky", year: 2015 },
];

/* No visible title; each page labels the section for screen readers */
export function Experience() {
  return (
    <ul className="q-list" role="list">
      {EXPERIENCE.map((e) => (
        <li className="q-row" key={e.company}>
          <span>{e.role} · <b>{e.company}</b></span>
          <span className="q-meta">{e.year}</span>
        </li>
      ))}
    </ul>
  );
}
