import type { MDXComponents } from "mdx/types";

// Required by @next/mdx. Map Markdown elements to custom components here if a post needs them.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return components;
}
