import { Project } from "@/components/project";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("Yandex, Kaspersky, Cognite", "Yandex, Kaspersky, Cognite. Cloud, security and industrial data products.", "/assets/img/work/other-slide-07.jpg");

export default function EarlierWork() {
  return (
    <Project
      title="Yandex, Kaspersky, Cognite"
      lead="Cloud, security and industrial data products"
      role="Product Designer · 2015–2021"
      shots={[
        { src: "/assets/img/work/other-slide-07.jpg", caption: "Yandex Cloud · Marketplace", alt: "Yandex Cloud Marketplace landing page with featured products." },
        { src: "/assets/img/work/other-slide-01.jpg", caption: "Performance diagnostics", alt: "Performance diagnostics dashboard with a time-series chart." },
        { src: "/assets/img/work/other-slide-03.jpg", caption: "Operations console", alt: "A dark operations console with a dense table of tasks and statuses." },
      ]}
      next={{ href: "/work/sanna/", title: "Sanna" }}
    />
  );
}
