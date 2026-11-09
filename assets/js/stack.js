/* Tech stack page: the Product / Branding / Growth tabs, and the list of versions. */

// Tabs. Arrow keys, Home and End move between tabs; the choice is kept in the URL (#branding, #growth)
// so a tab can be linked to. Panel ids are prefixed so the hash never scrolls the page.
(() => {
  const list = document.querySelector(".q-ts-tabs");
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const key = (t) => t.id.replace("q-ts-tab-", "");

  const select = (i, { focus = false, push = false } = {}) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    list.dataset.value = String(i);
    if (focus) tabs[i].focus();
    if (push) history.replaceState(null, "", i === 0 ? location.pathname : `#${key(tabs[i])}`);
  };
  const fromHash = () => tabs.findIndex((t) => `#${key(t)}` === location.hash);

  tabs.forEach((t, i) => t.addEventListener("click", () => {
    if (t.getAttribute("aria-selected") === "true") return;
    list.dataset.switched = "";
    select(i, { push: true });
  }));
  list.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (i < 0 || n === undefined) return;
    e.preventDefault();
    list.dataset.switched = "";
    select((n + tabs.length) % tabs.length, { focus: true, push: true });
  });
  // Other hashes (the skip link's #q-main) leave the tabs alone
  addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0) select(i); });
  select(Math.max(0, fromHash()));
})();

// Versions: every post in /blog/posts.json tagged "Tech stack" is one version of the stack.
// The newest gives "Last updated"; the rest are listed under "Previous versions", each linking to its update notes.
(() => {
  const updated = document.querySelector("[data-stack-updated]");
  const versions = document.querySelector("[data-stack-versions]");
  if (!updated || !versions) return;

  const TAG = "tech stack";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (iso) => { const d = new Date(`${iso}T12:00:00`); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const notes = (p, label) => `<a href="/blog/${esc(p.slug)}/" title="${esc(p.title)}"${label ? ` aria-label="${esc(label)}"` : ""}>Update notes</a>`;

  fetch("/blog/posts.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((posts) => {
      const list = posts
        .filter((p) => (p.tags || []).some((t) => t.toLowerCase() === TAG))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p, k) => ({ ...p, v: k + 1 }))
        .reverse();
      if (!list.length) return;

      const [latest, ...older] = list;
      updated.innerHTML = `Last updated: <time datetime="${esc(latest.date)}">${fmt(latest.date)}</time> · ${notes(latest)}`;

      if (!older.length) return;
      versions.querySelector("ul").innerHTML = older.map((p) =>
        `<li class="q-row"><span><span class="q-ts-v">v${p.v}</span><time datetime="${esc(p.date)}">${fmt(p.date)}</time></span>${notes(p, `Update notes for version ${p.v}, ${fmt(p.date)}`)}</li>`
      ).join("");
      versions.hidden = false;
    })
    .catch(() => {});
})();
