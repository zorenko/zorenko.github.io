/* How I work (/how-i-work/). Each tab (Product, Branding, Growth) has its own steps, and each step its tools.
   Branding and Growth are behind flags (lib/flags.ts); with only one tab shown, the page has no tabs to switch.
   status is one of "active", "experiment", "phasing-out".
   icon is a file in public/assets/img/stack/ (square, 64px); leave it out to get a letter tile instead.
   iconPad: true insets icons that have no background of their own.
   After changing the stack, write a blog post tagged "Tech stack" (content/posts.ts) explaining the change:
   it becomes the newest version at the bottom of the page. */
export type Status = "active" | "experiment" | "phasing-out";
export type Tool = { name: string; note: string; status: Status; icon?: string; iconPad?: boolean };
export type Step = { name: string; desc: string; tools: Tool[] };
export type Tab = { id: string; label: string; intro: string; steps: Step[] };

/** "Review and test" → "review-and-test", as used in a post's stack: ["product/review-and-test"] */
export const stepSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const STATUS_LABEL: Record<Status, string> = {
  active: "Active",
  experiment: "Experiment",
  "phasing-out": "Phasing out",
};

export const TABS: Tab[] = [
  {
    id: "product",
    label: "Product",
    intro: "Designing and building software, from the first question to shipped code.",
    steps: [
      {
        name: "Discover",
        desc: "Understand the problem, the people and the data.",
        tools: [
          { name: "Notion", icon: "notion.png", note: "Research notes and project docs", status: "active" },
          { name: "Claude", icon: "claude.png", note: "Synthesis, first drafts, thinking out loud", status: "active" },
        ],
      },
      {
        name: "Define",
        desc: "Agree on scope and turn it into a plan.",
        tools: [
          { name: "Linear", icon: "linear.png", note: "Issues, scope and priorities", status: "active" },
          { name: "Granola", icon: "granola.png", note: "Notes from scoping calls and workshops", status: "active" },
          { name: "Whiteboard", icon: "whiteboard.svg", note: "Sketching flows and ideas by hand", status: "active" },
          { name: "FigJam", note: "User flows and workshop boards", status: "phasing-out" },
        ],
      },
      {
        name: "Design",
        desc: "Explore layouts, then settle the system.",
        tools: [
          { name: "Figma", icon: "figma.png", note: "Exploration, components and tokens", status: "active" },
          { name: "Claude Code", icon: "claude-code.svg", iconPad: true, note: "Experiments, design.md, tokens and skills", status: "active" },
          { name: "Storybook", icon: "storybook.svg", note: "Component work and prototypes", status: "active" },
        ],
      },
      {
        name: "Build and ship",
        desc: "Prototype and ship in real code.",
        tools: [
          { name: "Claude Code", icon: "claude-code.svg", iconPad: true, note: "Building, refactoring and reviewing", status: "active" },
          { name: "Conductor", icon: "conductor.png", note: "Several coding agents in parallel", status: "active" },
          { name: "Granola", icon: "granola.png", note: "Talking through tasks for the agents", status: "active" },
        ],
      },
      {
        name: "Review and test",
        desc: "Check it in the browser, see how people use it, refine.",
        tools: [
          { name: "Google Analytics", icon: "google-analytics.svg", note: "Traffic and where visitors come from", status: "active" },
          { name: "PostHog", icon: "posthog.png", note: "Product analytics and session replays", status: "active" },
          { name: "gstack", icon: "gstack.png", note: "Automated browser QA and design review", status: "experiment" },
        ],
      },
    ],
  },
  {
    id: "branding",
    label: "Branding",
    intro: "Identities for products and people: references, concepts, the system and its rules.",
    steps: [
      {
        name: "Research",
        desc: "Collect references and find the territory.",
        tools: [
          { name: "Are.na", icon: "arena.png", note: "Reference boards that stay organised", status: "active" },
          { name: "Pinterest", icon: "pinterest.png", note: "Quick mood boards", status: "phasing-out" },
        ],
      },
      {
        name: "Concept",
        desc: "Sketch directions and test them fast.",
        tools: [{ name: "Claude", icon: "claude.png", note: "Naming, voice and copy directions", status: "active" }],
      },
      {
        name: "Identity",
        desc: "Logo, type, colour and the system around them.",
        tools: [{ name: "Figma", icon: "figma.png", note: "Logo, type and colour work", status: "active" }],
      },
      {
        name: "Guidelines",
        desc: "Write the rules down so others can use them.",
        tools: [
          { name: "Notion", icon: "notion.png", note: "Brand guidelines and assets", status: "active" },
          { name: "Claude Code", icon: "claude-code.svg", iconPad: true, note: "Guidelines and websites", status: "active" },
          { name: "Framer", icon: "framer.png", note: "Brand sites", status: "phasing-out" },
        ],
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    intro: "Growing my own brand: demo videos, posts on X and LinkedIn, and writing here.",
    steps: [
      {
        name: "Plan",
        desc: "Decide what to share and when.",
        tools: [
          { name: "Notion", icon: "notion.png", note: "Content calendar and ideas", status: "active" },
          { name: "Claude", icon: "claude.png", note: "Drafting and editing posts", status: "active" },
        ],
      },
      {
        name: "Make",
        desc: "Demos, recordings and visuals.",
        tools: [
          { name: "Jitter", icon: "jitter.png", note: "Motion for posts", status: "experiment" },
          { name: "Figma", icon: "figma.png", note: "Post visuals and thumbnails", status: "active" },
        ],
      },
      {
        name: "Publish",
        desc: "Share it where people are.",
        tools: [
          { name: "X", icon: "x.png", note: "Building in public", status: "active" },
          { name: "LinkedIn", icon: "linkedin.png", note: "Longer posts and case studies", status: "active" },
        ],
      },
    ],
  },
];
