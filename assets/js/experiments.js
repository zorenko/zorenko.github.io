/* Experiments: live previews in the home tray and interactive demos on /experiments/.
   Previews loop only while on screen and the tab is visible. Reduced motion shows one still frame. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Call tick every `ms` while `el` is on screen and the page is visible.
  const loop = (el, ms, tick) => {
    if (reduce) return;
    let timer = 0, seen = false;
    const sync = () => {
      const on = seen && !document.hidden;
      if (on && !timer) timer = setInterval(tick, ms);
      else if (!on && timer) { clearInterval(timer); timer = 0; }
    };
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(el);
    document.addEventListener("visibilitychange", sync);
  };

  // Morphing button: measure a hidden sizer, animate width to it, slide icon and label through clipped cells.
  const svg = (d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    copy: svg('<rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1.75"/><path d="M10.75 5.25V3.5c0-.7-.55-1.25-1.25-1.25h-6c-.7 0-1.25.55-1.25 1.25v6c0 .7.55 1.25 1.25 1.25h1.75"/>'),
    check: svg('<path d="m3 8.5 3.25 3L13 4.5"/>'),
    arrow: svg('<path d="M3 8h10"/><path d="m9 4 4 4-4 4"/>'),
  };
  const STATES = [
    { icon: "copy", label: "Copy email" },
    { icon: "check", label: "Copied", ok: true },
    { icon: "arrow", label: "Say hello" },
  ];

  document.querySelectorAll("[data-morph]").forEach((btn) => {
    const iconBox = btn.querySelector(":scope > .q-morph-icon");
    const labelBox = btn.querySelector(":scope > .q-morph-label");
    const sizer = btn.querySelector(":scope > .q-morph-sizer");
    let i = 0;
    const fit = () => {
      const cs = getComputedStyle(btn);
      const chrome = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((s, k) => s + parseFloat(cs[k]), 0);
      btn.style.width = `${Math.ceil(sizer.scrollWidth + chrome)}px`;
    };
    const swap = (box, html) => {
      for (const old of box.querySelectorAll(".q-swap:not(.is-out)")) {
        if (reduce) { old.remove(); continue; }
        old.classList.add("is-out");
        old.setAttribute("aria-hidden", "true");
        setTimeout(() => old.remove(), 200);
      }
      const next = document.createElement("span");
      next.className = reduce ? "q-swap" : "q-swap is-in";
      next.innerHTML = html;
      box.append(next);
    };
    const advance = () => {
      i = (i + 1) % STATES.length;
      const s = STATES[i];
      btn.toggleAttribute("data-ok", !!s.ok);
      swap(iconBox, ICON[s.icon]);
      swap(labelBox, s.label);
      sizer.innerHTML = `<span class="q-morph-icon">${ICON[s.icon]}</span><span>${s.label}</span>`;
      fit();
    };
    fit();
    new ResizeObserver(fit).observe(sizer); // web fonts landing late change the width
    requestAnimationFrame(() => requestAnimationFrame(() => btn.classList.add("is-ready")));
    if (btn.matches("button")) btn.addEventListener("click", advance);
    else loop(btn, 1450, advance);
  });

  // Scrambled text: each line resolves out of random glyphs, one letter at a time.
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%*+=?/";
  const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const scramble = (el, delay) => {
    const text = el.dataset.text;
    clearTimeout(el._t); clearInterval(el._flip); clearInterval(el._step);
    if (reduce) { el.textContent = text; return; }
    const chars = [...text];
    const g = chars.map((c) => (c === " " ? " " : rnd()));
    let n = 0;
    const draw = () => {
      el.innerHTML = chars.map((c, k) => (c === " " ? " " : k < n ? c : `<span class="q-enc">${g[k]}</span>`)).join("");
    };
    draw();
    el._t = setTimeout(() => {
      el._flip = setInterval(() => {
        for (let k = n; k < chars.length; k++) if (chars[k] !== " ") g[k] = rnd();
        draw();
      }, 60);
      el._step = setInterval(() => {
        if (++n < chars.length) return draw();
        clearInterval(el._flip); clearInterval(el._step);
        el.textContent = text;
      }, 50);
    }, delay);
  };

  document.querySelectorAll("[data-scramble-group]").forEach((group) => {
    const lines = [...group.querySelectorAll(".q-scr-live")];
    const play = () => lines.forEach((l, k) => scramble(l, k * 220));
    const card = group.closest("a");
    const replay = group.closest(".q-xp")?.querySelector("[data-replay]");
    card?.addEventListener("pointerenter", play);
    replay?.addEventListener("click", play);
    if (reduce) return;
    const once = new IntersectionObserver(([e]) => { if (e.isIntersecting) { play(); once.disconnect(); } });
    once.observe(group);
    if (card) loop(group, 3600, play);
  });

  // Theme switch: a tiny page flips between light and dark; the icon spins and unblurs in.
  document.querySelectorAll("[data-mini]").forEach((mini) => {
    const icon = mini.querySelector(".q-mini-icon");
    const flip = () => {
      const dark = mini.classList.toggle("is-dark");
      icon.removeAttribute("data-anim");
      void icon.offsetWidth;
      icon.setAttribute("data-anim", "");
      if (mini.matches("button")) {
        mini.setAttribute("aria-pressed", String(dark));
      }
    };
    if (mini.matches("button")) mini.addEventListener("click", flip);
    else loop(mini, 1800, flip);
  });
})();
