/* Feature flags: whole sections of the site that are built but not shown yet. Set one to true to bring it back.

   Off means: nothing links to the section (home page, dock, carousel, How I work), and its pages
   render "Page not found" instead of their content. The pages, posts and experiments themselves stay in the repo. */
export const SHOW = {
  /** Writing: /blog/ and every post, the latest posts on the home page, the dock's Writing button, and the post links on How I work */
  writing: false,
  /** Experiments: /experiments/ and every experiment's page, the dock's Experiments button, and the home page wall */
  experiments: false,
  /** Project pages: /work/sanna/, /work/celsia/, /work/earlier-work/. Off, the carousel titles don't link */
  projectPages: false,
};

/** Whether a link on the site leads somewhere that's shown. Links outside the flagged sections always do. */
export const isShown = (href: string) => {
  if (href.startsWith("/blog/")) return SHOW.writing;
  if (href.startsWith("/experiments/")) return SHOW.experiments;
  if (href.startsWith("/work/")) return SHOW.projectPages;
  return true;
};
