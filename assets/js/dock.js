/* Dock: a floating bottom bar (Home, Experiments, About) whose last button opens a menu upward with the
   theme switch, the same pages and a link to Writing. Built here so every page gets identical markup from one place. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const path = location.pathname.replace(/index\.html$/, "");

  const g = (inner) => `<svg class="q-dock-glyph" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const ICON = {
    home: {
      outline: g('<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5H5.5A1.5 1.5 0 0 1 4 19Z"/>'),
      active: g('<path class="q-dock-fill" fill-rule="evenodd" d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Zm6 4.5v5.5h4V15Z"/>'),
    },
    lab: {
      outline: g('<path d="M9.5 3.5h5M10.5 3.5v5.25L5.7 17.2a2.2 2.2 0 0 0 1.9 3.3h8.8a2.2 2.2 0 0 0 1.9-3.3l-4.8-8.45V3.5M7.9 14h8.2"/>'),
      active: g('<path d="M9.5 3.5h5"/><path class="q-dock-fill" d="M10.5 3.5v5.25L5.7 17.2a2.2 2.2 0 0 0 1.9 3.3h8.8a2.2 2.2 0 0 0 1.9-3.3l-4.8-8.45V3.5Z"/>'),
    },
    writing: {
      outline: g('<path d="M14.25 5.25 18.75 9.75M4.5 19.5l1-4.25L15.6 5.15a1.77 1.77 0 0 1 2.5 0l.75.75a1.77 1.77 0 0 1 0 2.5L8.75 18.5Z"/><path d="M13 19.5h6.5"/>'),
      active: g('<path class="q-dock-fill" d="M4.5 19.5l1-4.25L15.6 5.15a1.77 1.77 0 0 1 2.5 0l.75.75a1.77 1.77 0 0 1 0 2.5L8.75 18.5Z"/><path d="M13 19.5h6.5"/>'),
    },
    about: {
      outline: g('<circle cx="12" cy="8" r="3.75"/><path d="M5 19.25c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5a1 1 0 0 1-1 1.25H6a1 1 0 0 1-1-1.25Z"/>'),
      active: g('<circle class="q-dock-fill" cx="12" cy="8" r="3.75"/><path class="q-dock-fill" d="M5 19.25c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5a1 1 0 0 1-1 1.25H6a1 1 0 0 1-1-1.25Z"/>'),
    },
  };
  const CHEVRONS = g('<path d="m8.5 9.5 3.5-3.5 3.5 3.5M8.5 14.5l3.5 3.5 3.5-3.5"/>');
  const SUN = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"/></svg>';
  const SYSTEM = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.75" y="2.75" width="12.5" height="8.5" rx="1.75"/><path d="M5.5 13.75h5M8 11.25v2.5"/></svg>';
  const MOON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 9.6A5.75 5.75 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1Z"/></svg>';

  const ITEMS = [
    { label: "Home", href: "/", icon: "home", on: path === "/" },
    { label: "Experiments", href: "/experiments/", icon: "lab", on: path.startsWith("/experiments/") },
    { label: "About", href: "/about/", icon: "about", on: path.startsWith("/about/") },
  ];
  const MORE = [{ label: "Writing", href: "/blog/", icon: "writing", on: path.startsWith("/blog/") }];
  const current = (it) => (it.on ? ' aria-current="page" data-active' : "");

  const row = (it) => `<li><a class="q-dock-row" href="${it.href}"${current(it)}>${it.on ? ICON[it.icon].active : ICON[it.icon].outline}<span>${it.label}</span></a></li>`;

  const nav = document.createElement("nav");
  nav.className = "q-dock";
  nav.setAttribute("aria-label", "Primary");
  nav.innerHTML = `
    <div class="q-dock-island">
      <span class="q-dock-bg" aria-hidden="true"></span>
      <div class="q-dock-bar">
        ${ITEMS.map((it) => `<a class="q-dock-icon" href="${it.href}" aria-label="${it.label}"${current(it)}>${it.on ? ICON[it.icon].active : ICON[it.icon].outline}<span class="q-dock-tip" aria-hidden="true">${it.label}</span></a>`).join("")}
        <button class="q-dock-icon q-dock-expand" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="q-dock-menu">${CHEVRONS}<span class="q-dock-tip" aria-hidden="true">More</span></button>
      </div>
      <div class="q-dock-panel" id="q-dock-menu" hidden>
        <div class="q-dock-theme" role="radiogroup" aria-label="Colour theme">
          <span class="q-dock-pill" aria-hidden="true"></span>
          <button type="button" role="radio" data-theme="light">${SUN}Light</button>
          <button type="button" role="radio" data-theme="dark">${MOON}Dark</button>
          <button type="button" role="radio" data-theme="system">${SYSTEM}System</button>
        </div>
        <ul class="q-dock-list" role="list">${ITEMS.map(row).join("")}</ul>
        <ul class="q-dock-list q-dock-list--more" role="list">${MORE.map(row).join("")}</ul>
      </div>
    </div>`;
  document.body.append(nav);

  const island = nav.querySelector(".q-dock-island");
  const bg = nav.querySelector(".q-dock-bg");
  const bar = nav.querySelector(".q-dock-bar");
  const panel = nav.querySelector(".q-dock-panel");
  const expand = nav.querySelector(".q-dock-expand");

  // Theme: Light and Dark are saved; System clears the choice and follows the device, live.
  // The inline script in each page's <head> applies the same rule before first paint.
  const themeEl = nav.querySelector(".q-dock-theme");
  const themeBtns = [...themeEl.querySelectorAll("[data-theme]")];
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");
  const mode = () => { try { return localStorage.getItem("q-theme") || "system"; } catch { return "system"; } };
  const applyTheme = () => {
    const m = mode();
    root.classList.toggle("q-dark", m === "dark" || (m === "system" && prefersDark.matches));
    themeEl.dataset.value = m;
    for (const b of themeBtns) b.setAttribute("aria-checked", String(b.dataset.theme === m));
  };
  themeBtns.forEach((b) => b.addEventListener("click", () => {
    try {
      if (b.dataset.theme === "system") localStorage.removeItem("q-theme");
      else localStorage.setItem("q-theme", b.dataset.theme);
    } catch {}
    applyTheme();
  }));
  prefersDark.addEventListener("change", applyTheme);
  applyTheme();

  // Open and close: the incoming view takes the layout, the outgoing one pops out and fades,
  // and the background grows or shrinks from the old size to the new one (anchored bottom centre).
  let open = false;
  let leaveT = 0;
  const rect = () => island.getBoundingClientRect();
  const swap = (show, hide) => {
    clearTimeout(leaveT);
    show.hidden = false;
    show.classList.remove("is-leaving");
    show.classList.add("is-entering");
    hide.classList.remove("is-entering");
    if (reduce) { hide.hidden = true; return; }
    hide.classList.add("is-leaving");
    leaveT = setTimeout(() => { hide.hidden = true; hide.classList.remove("is-leaving"); }, 170);
  };
  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    const from = rect();
    swap(open ? panel : bar, open ? bar : panel);
    island.dataset.open = String(open);
    expand.setAttribute("aria-expanded", String(open));
    const to = rect();
    if (!reduce) {
      const dx = (to.width - from.width) / 2;
      const dy = to.height - from.height;
      bg.animate(
        [{ inset: `${dy}px ${dx}px 0px ${dx}px` }, { inset: "0px 0px 0px 0px" }],
        { duration: 440, easing: "cubic-bezier(0.32, 1.12, 0.36, 1)" }
      );
    }
    if (open) {
      panel.querySelectorAll(".q-dock-theme, .q-dock-list li").forEach((el, k) => el.style.setProperty("--k", k));
      (panel.querySelector(".q-dock-row[aria-current]") || panel.querySelector(".q-dock-row")).focus({ preventScroll: true });
    }
  };
  expand.addEventListener("click", () => setOpen(true));
  document.addEventListener("pointerdown", (e) => { if (open && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (open && e.key === "Escape") { setOpen(false); expand.focus({ preventScroll: true }); }
  });
  panel.addEventListener("focusout", (e) => { if (open && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false); });

  // Shrinks while scrolling down, returns on the way up
  let last = scrollY, run = 0;
  addEventListener("scroll", () => {
    const y = scrollY, d = y - last;
    last = y;
    if (!d || open) return;
    if ((d > 0) !== (run > 0)) run = 0;
    run += d;
    if (run > 14 && y > 72) island.dataset.mini = "true";
    else if (run < -14 || y <= 72) delete island.dataset.mini;
  }, { passive: true });
})();
