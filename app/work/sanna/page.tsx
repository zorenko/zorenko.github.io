import { Project } from "@/components/project";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Sanna", "Sanna. Two app redesigns, 140+ merged PRs in ten weeks.", "/assets/img/work/sanna-slide-02.jpg");

export default function Sanna() {
  return (
    <Project
      title="Sanna"
      lead="Two app redesigns, 140+ merged PRs in ten weeks"
      role="Design Engineer · 2025"
      shots={[
        { src: "/assets/img/work/sanna-slide-02.jpg", caption: "Annual financial statement", alt: "Sanna: a guided flow for finalising the annual financial statement." },
        { src: "/assets/img/work/sanna-slide-04.jpg", caption: "Onboarding", alt: "Sanna onboarding with a welcome step and task list." },
      ]}
      next={{ href: "/work/celsia/", title: "Celsia" }}
    />
  );
}
