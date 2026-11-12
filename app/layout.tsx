import type { Metadata, Viewport } from "next";
import { Faculty_Glyphic, Geist } from "next/font/google";
import { Dock } from "@/components/dock";
import { NAME, OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted by next/font under their own names, which site.css uses directly ("Geist", "Faculty Glyphic").
// The variables feed Tailwind's font-sans and font-serif for shadcn components.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const faculty = Faculty_Glyphic({ subsets: ["latin"], weight: "400", variable: "--font-faculty" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${NAME} | Design Engineer`, template: `%s | ${NAME}` },
  description: "Design engineer in Oslo. Seven years designing and building complex, data-dense software.",
  openGraph: { images: OG_IMAGE },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

// Runs before first paint: the saved theme (or the device's), and on /experiments/ the remembered canvas view.
const HEAD_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("q-theme");if(t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches)d.classList.add("q-dark");if((location.pathname==="/experiments/"||location.pathname==="/experiments")&&!location.hash&&localStorage.getItem("q-xp-view")==="canvas")d.dataset.xpView="canvas"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body className={`v-quiet ${geist.variable} ${faculty.variable}`}>
        <a className="q-skip" href="#q-main">
          Skip to content
        </a>
        <div className="q-fade" aria-hidden="true" />
        {children}
        <Dock />
      </body>
    </html>
  );
}
