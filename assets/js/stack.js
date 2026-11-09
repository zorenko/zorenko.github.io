/* How I work page (/how-i-work/): the Product / Branding / Growth tabs, steps that open, posts about each step, and the list of versions. */

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
    if (push) history.replaceState(null, "", i === 0 ? location.pathname + location.search : `#${key(tabs[i])}`);
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

// Steps and posts. Each step becomes one row: number, name, its tools' icons and how many posts are about it.
// The row opens to show the tools and those posts. A post is about a step when its entry in /blog/posts.json
// has "stack": ["product/design"] (tab id / step name in lowercase with dashes).
// Versions: every post tagged "Tech stack" is one version of the stack. The newest gives "Last updated";
// the rest are listed under "Previous versions", each linking to its update notes.
(() => {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = (iso) => new Date(`${iso}T12:00:00`);
  const fmt = (iso) => { const d = date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const month = (iso) => { const d = date(iso); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  const CHEV = '<svg class="q-ts-chev" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>';
  const DOC = '<svg class="q-ts-doc" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 1.75h5.5l3 3v9.5h-8.5z"/><path d="M9 1.75V5h3.25"/><path d="M6 8.25h4M6 10.75h3"/></svg>';

  // Steps, by "tab/step"
  const steps = new Map();
  const setOpen = (btn, open) => {
    btn.setAttribute("aria-expanded", String(open));
    document.getElementById(btn.getAttribute("aria-controls")).inert = !open;
  };
  for (const ol of document.querySelectorAll("ol.q-ts")) {
    const tab = ol.closest(".q-ts-panel").id.replace("q-ts-", "");
    const btns = [];
    for (const li of ol.children) {
      const head = li.querySelector(".q-ts-head");
      const name = ownText(head);
      const id = `q-ts-${tab}-${slug(name)}`;
      const tools = [...li.querySelectorAll(".q-ts-tool")];
      const icons = tools.map((t) => {
        const icon = t.querySelector(".q-ts-icon").cloneNode(true);
        if (t.querySelector('[data-status="phasing-out"]')) icon.dataset.out = "";
        return icon.outerHTML;
      }).join("");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-ts-btn";
      btn.setAttribute("aria-controls", id);
      btn.innerHTML = `${head.querySelector(".q-ts-n").outerHTML}<span class="q-ts-title">${esc(name)}<span class="q-sr">: ${esc(tools.map((t) => ownText(t.querySelector(".q-ts-name"))).join(", "))}</span></span><span class="q-ts-icons" aria-hidden="true">${icons}</span><span class="q-ts-count"></span>${CHEV}`;
      const inner = document.createElement("div");
      inner.className = "q-ts-inner";
      inner.append(...[...li.children].filter((c) => c !== head));
      const body = document.createElement("div");
      body.className = "q-ts-body";
      body.id = id;
      body.append(inner);
      head.replaceChildren(btn);
      li.append(body);
      setOpen(btn, false);
      btns.push(btn);
      steps.set(`${tab}/${slug(name)}`, { inner, count: btn.querySelector(".q-ts-count") });
    }

    const all = document.createElement("button");
    all.type = "button";
    all.className = "q-ts-all";
    const label = () => { all.textContent = btns.every((b) => b.getAttribute("aria-expanded") === "true") ? "Close all steps" : "Open all steps"; };
    label();
    ol.after(all);
    all.addEventListener("click", () => {
      const open = btns.some((b) => b.getAttribute("aria-expanded") !== "true");
      btns.forEach((b) => setOpen(b, open));
      label();
    });
    btns.forEach((b) => b.addEventListener("click", () => { setOpen(b, b.getAttribute("aria-expanded") !== "true"); label(); }));
  }

  const updated = document.querySelector("[data-stack-updated]");
  const versions = document.querySelector("[data-stack-versions]");
  const notes = (p, label) => `<a href="/blog/${esc(p.slug)}/" title="${esc(p.title)}"${label ? ` aria-label="${esc(label)}"` : ""}>Update notes</a>`;

  fetch("/blog/posts.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((posts) => {
      // Posts about each step, newest first
      const byStep = new Map();
      [...posts].sort((a, b) => b.date.localeCompare(a.date)).forEach((p) =>
        [].concat(p.stack || []).forEach((k) => { if (steps.has(k)) byStep.set(k, [...(byStep.get(k) || []), p]); }));
      byStep.forEach((list, k) => {
        const { inner, count } = steps.get(k);
        count.textContent = `${list.length} post${list.length > 1 ? "s" : ""}`;
        inner.insertAdjacentHTML("beforeend", `<div class="q-ts-writing"><h3 class="q-ts-label">Writing about this step</h3><ul class="q-ts-posts" role="list">${list.map((p) =>
          `<li class="q-ts-post">${DOC}<a href="/blog/${esc(p.slug)}/">${esc(p.title)}</a><time datetime="${esc(p.date)}">${month(p.date)}</time></li>`).join("")}</ul></div>`);
      });

      if (!updated || !versions) return;
      const list = posts
        .filter((p) => (p.tags || []).some((t) => t.toLowerCase() === "tech stack"))
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
