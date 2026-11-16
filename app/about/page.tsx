import { Experience } from "@/components/experience";
import { enter } from "@/lib/dom";
import { SHOW } from "@/lib/flags";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("About", "Designing digital products for over 10 years, specialised in complex B2B products, mostly devtools. Now working with companies as a digital designer.");

export default function About() {
  return (
    <main className="q q-about" id="q-main">
      <header className="q-phead" {...enter(1)}>
        <h1>About</h1>
        <p className="q-plead">I&apos;ve been designing digital products for over 10 years, and since 2018 I&apos;ve specialised in complex B2B products, mostly devtools. In 2022 I joined Celsia as design lead, shaping a sustainability reporting platform from MVP to a mature product.</p>
        <p className="q-plead">Today I work with companies as a digital designer, helping with a wide range of problems, from product to branding.</p>
        <p className="q-plead">I care about the whole experience, the quality and the details. I also believe done is better than perfect, and I don&apos;t see a contradiction there. I&apos;ve always championed design systems as codified design expertise, a way to keep quality high at scale. Now, with AI, I ship front-end code myself, so I can experiment faster and make sure the product works exactly as it should.</p>
      </header>

      <section className="q-sec" {...enter(2)} aria-labelledby="q-about-work">
        <h2 className="q-sec-title" id="q-about-work">Work</h2>
        <Experience />
      </section>

      {SHOW.personal && (
        <section className="q-sec" {...enter(3)} aria-labelledby="q-about-personal">
          <h2 className="q-sec-title" id="q-about-personal">Personal</h2>
          <p className="q-prose">Six years ago I moved to Norway to join Cognite, and it&apos;s been home ever since. Living here gave me a new perspective on life, work and design as a practice. In my free time I explore the city, get my usual ramen at Koie, and train on Zwift so I can finally crush those <s className="q-strike">damned</s> Norwegian hills.</p>
          <p className="q-prose">I love visiting new places and have been to 40 countries so far. Favourites include the French Alps, plus quick trips to Copenhagen and Amsterdam. Next year I&apos;m planning my third trip to Japan.</p>
        </section>
      )}
    </main>
  );
}
