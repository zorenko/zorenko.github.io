import { Project } from "@/components/project";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Yandex, Cognite", "Yandex, Cognite. Developer tools for the cloud and industrial data.", "/assets/img/work/other-slide-07.jpg");

export default function EarlierWork() {
  return (
    <Project
      title="Yandex, Cognite"
      lead="Developer tools for the cloud and industrial data"
      role="Product Designer · 2019–2022"
      shots={[
        { src: "/assets/img/work/other-slide-07.jpg", caption: "Yandex Cloud · Marketplace", alt: "Yandex Cloud Marketplace landing page with featured products." },
        { src: "/assets/img/work/other-slide-01.jpg", caption: "Performance diagnostics", alt: "Performance diagnostics dashboard with a time-series chart." },
        { src: "/assets/img/work/other-slide-03.jpg", caption: "Operations console", alt: "A dark operations console with a dense table of tasks and statuses." },
      ]}
      next={{ href: "/work/sanna/", title: "Sanna" }}
    />
  );
}
