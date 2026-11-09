/* Renders post lists from /blog/posts.json into every <ul data-posts="N"> (empty value = all posts),
   newest first. To publish a post: add /blog/<slug>/index.html and one entry to posts.json. */
(() => {
  const lists = [...document.querySelectorAll("ul[data-posts]")];
  if (!lists.length) return;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = { format: (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  fetch("/blog/posts.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((posts) => {
      posts.sort((a, b) => b.date.localeCompare(a.date));
      for (const ul of lists) {
        const limit = Number(ul.dataset.posts) || posts.length;
        ul.innerHTML = posts.slice(0, limit).map((p, k) => {
          const d = new Date(`${p.date}T12:00:00`);
          return `<li style="--k:${k}"><a class="q-row q-post" href="/blog/${esc(p.slug)}/"><span class="q-post__title">${esc(p.title)}</span><time class="q-meta" datetime="${esc(p.date)}">${fmt.format(d)}</time></a></li>`;
        }).join("");
        ul.removeAttribute("aria-busy");
      }
    })
    .catch(() => {
      for (const ul of lists) {
        ul.innerHTML = '<li class="q-row"><a href="/blog/">Read the blog</a></li>';
        ul.removeAttribute("aria-busy");
      }
    });
})();
