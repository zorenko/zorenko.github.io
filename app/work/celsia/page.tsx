import { Project } from "@/components/project";
import { Reveal } from "@/components/reveal";
import { WORK } from "@/content/work";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Celsia", "Celsia. Reporting module from zero to one, acquired 2024.", "/assets/img/work/celsia-slide-01.jpg");

// The same demo as the home page's carousel card
const demo = WORK.find((w) => w.id === "celsia")?.media;

export default function Celsia() {
  return (
    <Project
      title="Celsia"
      lead="Reporting module from zero to one, acquired 2024"
      role="Lead Designer · 2022–2024"
      demo={demo?.type === "demo" ? demo : undefined}
      intro={
        <>
          <p>Celsia is a sustainability reporting platform for the EU frameworks: CSRD and ESRS and the EU taxonomy for companies, and SFDR for investment funds. It fits the workflows of very different user groups and keeps every report compliant with the regulation.</p>
          <p>I led design across product and marketing, working closely with the Head of Product and with Customer Success, Sustainability Advisory and Sales.</p>
        </>
      }
      shots={[
        { src: "/assets/img/work/celsia-slide-01.jpg", caption: "Reporting module, 0 → 1", alt: "Celsia reporting module: a sustainability disclosure with navigation down the left." },
        { src: "/assets/img/work/celsia-slide-05.jpg", caption: "Emissions data", alt: "Celsia emissions data shown as a stacked bar chart above a table." },
        { src: "/assets/img/work/celsia-slide-09.jpg", caption: "Targets & actions", alt: "Celsia target for reducing air pollutant emissions, with a trend chart." },
      ]}
      next={{ href: "/work/earlier-work/", title: "Yandex, Kaspersky, Cognite" }}
    >
      <Reveal as="section" className="q-case" aria-labelledby="q-case-hl">
        <h2 id="q-case-hl">Highlights</h2>
        <ul className="q-points">
          <li>Led UX for the platform: a full redesign, a design system and a complete UI overhaul. Design became a selling point, supporting around 150% customer growth and 90% renewals.</li>
          <li>Designed the flagship reporting module and scaled it from 3 pilot clients to about 55% of enterprise customers. Users said it cut their reporting costs by up to 70%.</li>
          <li>Raised the design practice across the company with a UX research pipeline, better cross-functional tooling and shared rituals.</li>
        </ul>
        <p className="q-note">Figures are approximate because of an NDA, but the direction is accurate.</p>
      </Reveal>
      <Reveal as="section" className="q-case" aria-labelledby="q-case-did">
        <h2 id="q-case-did">What I did</h2>
        <h3>Product design and design system</h3>
        <ul className="q-points">
          <li>Led the full platform redesign and introduced a design system.</li>
          <li>Built the system on tokens, which brought dark mode and atomic components and helped ship the flagship product in under 12 months.</li>
          <li>Wrote documentation so design and engineering used it the same way, which cut rework from design debt.</li>
        </ul>
        <h3>Product strategy and UX research</h3>
        <ul className="q-points">
          <li>Set up the UX research practice, with pipelines and dashboards that brought customer and sales insights straight into product strategy.</li>
          <li>Introduced shared workflows, tooling and regular rituals that took friction out of delivery.</li>
        </ul>
        <h3>Design team</h3>
        <ul className="q-points">
          <li>Grew the design team from one designer to four and mentored two juniors into strong mid-level designers.</li>
          <li>Started Design club and Concept lab to raise quality and collaboration across the company.</li>
          <li>Advocated for design craft through talks and shared practices.</li>
        </ul>
        <h3>Brand and marketing, in a support role</h3>
        <ul className="q-points">
          <li>Brought product and user knowledge into the marketing designer’s brand and communication work.</li>
          <li>Contributed to workshops, surveys and early concepts: visual metaphors, illustrations and data visualisations.</li>
          <li>Kept marketing materials aligned with the product’s value proposition.</li>
        </ul>
      </Reveal>
    </Project>
  );
}
