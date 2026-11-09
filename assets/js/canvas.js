/* Experiments canvas: a second view of /experiments/, an endless board of experiment cards in staggered columns
   that you drag, scroll or arrow-key around. Also builds the List / Canvas switch in the top-right corner.
   The board is a fixed pool of tiles that wraps around as you pan, so nothing is created or destroyed mid-drag.
   The choice is remembered; the inline script in the page <head> applies it before first paint. */
(() => {
  const tpl = document.getElementById("q-cv-cards");
  if (!tpl) return;
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KEY = "q-xp-view";
  const GAP = 20;
  const DECAY = 0.995; // velocity kept per millisecond while gliding
  const mod = (a, n) => ((a % n) + n) % n;

  // Switch
  const icon = (d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${d}</svg>`;
  const VIEWS = [
    { id: "list", label: "List", icon: icon('<rect x="2.25" y="2.75" width="11.5" height="4.25" rx="1.25"/><rect x="2.25" y="9" width="11.5" height="4.25" rx="1.25"/>') },
    { id: "canvas", label: "Canvas", icon: icon('<rect x="2.25" y="2.25" width="5" height="6.5" rx="1.25"/><rect x="2.25" y="10.75" width="5" height="3" rx="1.25"/><rect x="8.75" y="2.25" width="5" height="3" rx="1.25"/><rect x="8.75" y="7.25" width="5" height="6.5" rx="1.25"/>') },
  ];
  const sw = document.createElement("div");
  sw.className = "q-views";
  sw.setAttribute("role", "radiogroup");
  sw.setAttribute("aria-label", "View");
  sw.innerHTML = `<span class="q-views-pill" aria-hidden="true"></span>${VIEWS.map((v) =>
    `<button type="button" role="radio" data-view="${v.id}" aria-label="${v.label}">${v.icon}<span class="q-views-tip" aria-hidden="true">${v.label}</span></button>`).join("")}`;
  document.body.append(sw);
  const btns = [...sw.querySelectorAll("[data-view]")];

  // Canvas
  const cv = document.createElement("section");
  cv.className = "q-cv";
  cv.tabIndex = 0;
  cv.setAttribute("aria-label", "Experiments canvas. Arrow keys move around, Enter opens the card in the middle.");
  const cards = [...tpl.content.children];
  cv.innerHTML = `
    <ul class="q-sr">${cards.map((c) => `<li><a href="${c.getAttribute("href")}" tabindex="-1">${c.querySelector(".q-card-text > span").textContent}</a></li>`).join("")}</ul>
    <div class="q-cv-layer" aria-hidden="true"></div>`;
  const layer = cv.querySelector(".q-cv-layer");
  const hint = document.createElement("div");
  hint.className = "q-cv-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.innerHTML = "<b>Experiments</b><span>Drag to explore</span>";
  document.body.append(cv, hint);

  let tiles = [], cols = 0, rows = 0, cw = 0, ch = 0, th = 0, px = 0, py = 0, centre = null;

  // Enough columns and rows to cover the viewport plus one spare on each side. Columns come in multiples of
  // 2 × the card count and rows in multiples of the card count, so a tile shows the same card wherever it wraps to.
  const build = () => {
    const n = cards.length;
    const needCols = Math.ceil(innerWidth / (248 + GAP)) + 2;
    const needRows = Math.ceil(innerHeight / 200) + 3;
    if (tiles.length && needCols <= cols && needRows <= rows) return false;
    cols = Math.ceil(needCols / (2 * n)) * 2 * n;
    rows = Math.ceil(needRows / n) * n;
    layer.textContent = "";
    tiles = [];
    const step = n > 2 ? 2 : 1; // neighbours, including the staggered ones, never repeat a card
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const el = cards[mod(step * i + j, n)].cloneNode(true);
        el.dataset.phase = (((i * 7 + j * 3) % 10) / 10).toFixed(1);
        layer.append(el);
        tiles.push({ i, j, el });
      }
    }
    window.qxpMount?.(layer);
    measure();
    return true;
  };
  // Cells fit the tallest card, so re-measure once the web fonts land
  const measure = () => {
    th = Math.max(...tiles.slice(0, cards.length).map((t) => t.el.offsetHeight));
    cw = tiles[0].el.offsetWidth + GAP;
    ch = th + GAP;
  };

  const place = () => {
    const w = cols * cw, h = rows * ch;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    let best = null, bestD = Infinity;
    for (const t of tiles) {
      const x = mod(t.i * cw + px + cw, w) - cw;
      const y = mod(t.j * ch + (t.i % 2 ? ch / 2 : 0) + py + ch, h) - ch;
      t.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const d = Math.hypot(x + cw / 2 - cx, y + th / 2 - cy);
      if (d < bestD) { bestD = d; best = t.el; }
    }
    if (best !== centre) { centre?.removeAttribute("data-centre"); best?.setAttribute("data-centre", ""); centre = best; }
  };

  let frame = 0;
  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; place(); }); };
  const pan = (dx, dy) => { px += dx; py += dy; schedule(); };

  // Glide: keeps the release velocity and lets it decay, like a flicked list
  let vx = 0, vy = 0, glideRaf = 0;
  const stopGlide = () => { cancelAnimationFrame(glideRaf); glideRaf = 0; vx = vy = 0; };
  const glide = (v0x, v0y) => {
    stopGlide();
    if (reduce) return;
    vx = v0x; vy = v0y;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(now - last, 32);
      last = now;
      px += vx * dt; py += vy * dt;
      place();
      const k = DECAY ** dt;
      vx *= k; vy *= k;
      glideRaf = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(tick) : 0;
    };
    glideRaf = requestAnimationFrame(tick);
  };
  // Move by about (dx, dy), easing out: the start velocity that a glide with DECAY carries that far
  const nudge = (dx, dy) => {
    if (reduce) return pan(dx, dy);
    const s = -Math.log(DECAY);
    glide(vx + dx * s, vy + dy * s);
  };

  // Drag with mouse, pen or touch. A 4px dead zone keeps taps and clicks on cards working.
  let drag = null, dragged = false;
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || drag) return;
    stopGlide();
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moving: false, trail: [] };
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moving) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moving = true;
      try { cv.setPointerCapture(e.pointerId); } catch {}
      cv.setAttribute("data-dragging", "");
    }
    pan(e.clientX - drag.x, e.clientY - drag.y);
    drag.x = e.clientX; drag.y = e.clientY;
    drag.trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    while (drag.trail.length > 2 && e.timeStamp - drag.trail[0].t > 90) drag.trail.shift();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moving, trail } = drag;
    drag = null;
    if (!moving) return;
    cv.removeAttribute("data-dragging");
    dragged = true;
    setTimeout(() => { dragged = false; });
    const a = trail[0], b = trail[trail.length - 1];
    const dt = b && b.t - a.t;
    if (e.type === "pointerup" && dt > 0 && e.timeStamp - b.t < 60) {
      const cap = (v) => Math.max(-3, Math.min(3, v));
      glide(cap((b.x - a.x) / dt), cap((b.y - a.y) / dt));
    }
  };
  cv.addEventListener("pointerup", release);
  cv.addEventListener("pointercancel", release);
  cv.addEventListener("dragstart", (e) => e.preventDefault());

  // Trackpad and wheel pan in both directions; pinch (ctrlKey) is left to the browser
  cv.addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    stopGlide();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    const swapAxes = e.shiftKey && !e.deltaX;
    pan(-(swapAxes ? e.deltaY : e.deltaX) * unit, -(swapAxes ? 0 : e.deltaY) * unit);
  }, { passive: false });

  // Keyboard: arrows move, Enter opens the card nearest the middle
  const STEP = 180;
  const KEYS = { ArrowLeft: [STEP, 0], ArrowRight: [-STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };
  cv.addEventListener("keydown", (e) => {
    if (KEYS[e.key]) { e.preventDefault(); nudge(...KEYS[e.key]); }
    else if (e.key === "Enter" && centre) { e.preventDefault(); open(centre.getAttribute("href")); }
  });

  // Opening a card switches to the list and scrolls to that experiment
  const open = (hash) => {
    const target = document.querySelector(hash);
    setView("list");
    if (!target) return;
    history.replaceState(null, "", hash);
    target.setAttribute("tabindex", "-1");
    target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    target.focus({ preventScroll: true });
  };
  cv.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (dragged) { e.preventDefault(); e.stopPropagation(); return; }
    if (link) { e.preventDefault(); open(link.getAttribute("href")); }
  }, true);

  const refit = () => {
    if (root.dataset.xpView !== "canvas") return;
    if (!build()) measure();
    place();
  };
  addEventListener("resize", refit);
  document.fonts?.ready.then(refit);

  const setView = (view, save = true) => {
    const canvas = view === "canvas";
    if (canvas) root.dataset.xpView = "canvas";
    else delete root.dataset.xpView;
    for (const b of btns) {
      const on = b.dataset.view === view;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (save) try { canvas ? localStorage.setItem(KEY, "canvas") : localStorage.removeItem(KEY); } catch {}
    if (!canvas) return;
    stopGlide();
    if (build()) {
      // first row starts under the hint, columns centred in the window
      px = Math.round((innerWidth - (Math.floor(innerWidth / cw) * cw - GAP)) / 2);
      py = 88;
    }
    place();
  };

  btns.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  sw.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = btns.find((b) => b.getAttribute("aria-checked") !== "true");
    setView(next.dataset.view);
    next.focus();
  });

  setView(root.dataset.xpView === "canvas" ? "canvas" : "list", false);
})();
