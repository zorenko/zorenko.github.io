/* Experience list: on the home page (under the work carousel) and the About page */

import { cssVars } from "@/lib/dom";
import { Company, type CompanyId } from "./company";

// `icon` is the company's mark (components/company.tsx); the rest get a tile with their first letter. `site` is its own
// site, opened in a new tab, the way the work carousel's titles link.
// On small screens `short` stands in for the name and the note is dropped (app/site.css, .q-xp-full / .q-xp-short)
const EXPERIENCE: { role: string; company: string; short?: string; icon?: CompanyId; site?: string; note?: string; year: number }[] = [
  { role: "Independent Designer", company: "Sanna", icon: "sanna", site: "https://www.sanna.no/", year: 2026 },
  { role: "Design Manager (VP)", company: "ISS-Corporate", short: "ISS-C", icon: "iss-corporate", site: "https://www.iss-corporate.com/", year: 2024 },
  { role: "Design Lead", company: "Celsia", icon: "celsia", note: "now ISS-Corporate", site: "https://celsia.io/", year: 2022 },
  { role: "Product Designer", company: "Cognite", icon: "cognite", site: "https://www.cognite.com/", year: 2020 },
  { role: "Product Designer", company: "Yandex", icon: "yandex-cloud", site: "https://yandex.cloud/en", year: 2019 },
  { role: "UX/UI Designer", company: "Nexign", icon: "nexign", site: "https://nexign.com/en", year: 2018 },
  { role: "UX/UI Designer", company: "Kaspersky", icon: "kaspersky", site: "https://www.kaspersky.com/", year: 2017 },
  { role: "UX/UI Designer", company: "Freelance", year: 2015 },
];

// The company's tile and name (its short name too, for small screens)
function name(e: (typeof EXPERIENCE)[number]) {
  return (
    <Company as="b" id={e.icon} letter={e.company}>
      {e.short ? <><span className="q-xp-full">{e.company}</span><span className="q-xp-short">{e.short}</span></> : e.company}
    </Company>
  );
}

/* No title of its own; each page titles or labels the section */
export function Experience() {
  return (
    <ul className="q-list q-list--lines" role="list">
      {EXPERIENCE.map((e, k) => (
        <li className="q-row" key={e.company} style={cssVars({ "--k": k })}>
          <span className="q-meta q-xp-year">{e.year}</span>
          <span>
            {e.site ? <a href={e.site} target="_blank" rel="noopener">{name(e)}</a> : name(e)}
            {e.note && <span className="q-xp-full"> <span className="q-note-inline">({e.note})</span></span>}
          </span>
          <span className="q-xp-role">{e.role}</span>
        </li>
      ))}
    </ul>
  );
}
