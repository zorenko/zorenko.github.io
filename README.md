# zorenko.github.io

Source for https://zorenko.github.io/. Built with Next.js (static export), React, Tailwind CSS and shadcn/ui, and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

The previous portfolio (2016–2021) lives in [zorenko/portfolio-2021](https://github.com/zorenko/portfolio-2021) and is published at https://zorenko.github.io/portfolio-2021/.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # writes the static site to out/
```

## Where things live

| What | Where |
| --- | --- |
| Pages (one folder per URL) | `app/` |
| Site styles (the `q-*` classes, colours, dark mode) | `app/site.css` |
| Tailwind and the shadcn theme, mapped to the site colours | `app/globals.css` |
| Blog posts | `content/posts.ts` (list) and `content/blog/<slug>.mdx` (text) |
| How I work steps and tools | `content/stack.ts` |
| Work carousel on the home page | `content/work.ts` (slides; how to add one is at the top), `components/work-carousel.tsx` |
| Live demos shown in the carousel | `public/demos/<name>/`; how to make one: `docs/demos.md` (Visuals' is made by hand; Muster's is a copy of the landing page, and its head comment says how to refresh it) |
| Experiments list | `content/experiments.ts` (title, blurb, write-up, and `hidden: true` to unlist one), the home page wall in `components/experiment-wall.tsx` |
| Each experiment's code | `components/experiments/<id>.tsx` and `<id>.css` (how to add one is at the top of `index.tsx` there) |
| Experiment pages | `app/experiments/[id]/page.tsx`, one per entry in `content/experiments.ts` |
| Koi and Birds demo | `public/demos/koi-and-birds/index.html` (self-contained; its head comment lists the `?embed` options) |
| Images | `public/assets/img/` (served at `/assets/img/…`) |

**Publish a post:** add an entry to `content/posts.ts` and write `content/blog/<slug>.mdx`. Tag it `"Tech stack"` to list it as a version on How I work, or give it `stack: ["product/design"]` to list it under that step.

**Add a shadcn component:** `npx shadcn@latest add <component>` (for example `dialog`, `tooltip`, `tabs`). Components land in `components/ui/` and pick up the site's colours and dark mode.
