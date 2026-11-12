import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// A fully static site: `next build` writes plain HTML, CSS and JS to out/, which GitHub Pages serves.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // keeps URLs like /blog/borrowing-timing/ as they were
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default createMDX()(nextConfig);
