/* Site: theme toggle, name scramble, scroll reveal, copy email, lightbox. Each part runs only where its markup exists. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Theme (saved, falls back to the system preference)
  const themeBtn = document.querySelector(".q-theme");
  const applyTheme = (dark) => {
    root.classList.toggle("q-dark", dark);
    themeBtn?.setAttribute("aria-pressed", String(dark));
    themeBtn?.setAttribute("aria-label", dark ? "Light theme" : "Dark theme");
  };
  const saved = localStorage.getItem("q-theme");
  applyTheme(saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  themeBtn?.addEventListener("click", () => {
    const dark = !root.classList.contains("q-dark");
    applyTheme(dark);
    localStorage.setItem("q-theme", dark ? "dark" : "light");
    themeBtn.removeAttribute("data-anim");
    void themeBtn.offsetWidth;
    themeBtn.setAttribute("data-anim", "");
  });

  // Name and role resolve out of placeholder glyphs, one letter every 70ms
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?/";
  const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  function scramble(el, delay) {
    const text = el.textContent;
    if (reduce) return;
    el.setAttribute("aria-label", text);
    const chars = [...text];
    let n = 0;
    const g = chars.map((c) => (c === " " ? " " : rnd()));
    const draw = () => {
      el.innerHTML = chars.map((c, i) => (c === " " ? " " : i < n ? c : `<span class="q-enc" aria-hidden="true">${g[i]}</span>`)).join("");
    };
    draw();
    setTimeout(() => {
      const flip = setInterval(() => {
        for (let i = n; i < chars.length; i++) if (chars[i] !== " ") g[i] = rnd();
        draw();
      }, 60);
      const step = setInterval(() => {
        if (++n >= chars.length) {
          clearInterval(flip);
          clearInterval(step);
          el.textContent = text;
          el.removeAttribute("aria-label");
        } else draw();
      }, 70);
    }, delay);
  }
  document.querySelectorAll("[data-scramble]").forEach((el) => scramble(el, Number(el.dataset.scramble) || 0));

  // Frames fade up once as they scroll in
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
  }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Copy email with a small tooltip. Never opens the mail app: if the clipboard is blocked, the tooltip shows the address.
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
    ta.style.cssText = "position:fixed;top:0;opacity:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  };
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const tip = btn.querySelector(".q-tip");
    let t = 0;
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.dataset.copy);
      tip.textContent = ok ? "Email copied" : btn.dataset.copy;
      clearTimeout(t);
      t = setTimeout(() => { tip.textContent = ""; }, ok ? 1500 : 4000);
    });
  });

  // Lightbox: Esc closes, arrows step through
  const lb = document.querySelector(".q-lb");
  if (!lb) return;
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector("figcaption");
  const frames = [...document.querySelectorAll(".q-frame")];
  let index = -1, opener = null, closeT = 0;
  const show = (i) => {
    index = (i + frames.length) % frames.length;
    const img = frames[index].querySelector("img");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = frames[index].closest("figure").querySelector("figcaption").textContent;
    // warm the neighbours so arrow keys don't wait on the network
    for (const d of [1, -1]) new Image().src = frames[(index + d + frames.length) % frames.length].querySelector("img").src;
  };
  const open = (i) => {
    clearTimeout(closeT);
    opener = frames[i];
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => requestAnimationFrame(() => lb.setAttribute("data-open", "")));
    lb.querySelector(".q-lb-close").focus({ preventScroll: true });
  };
  const close = () => {
    if (lb.hidden) return;
    lb.removeAttribute("data-open");
    document.body.style.overflow = "";
    closeT = setTimeout(() => { lb.hidden = true; }, reduce ? 0 : 250);
    opener?.focus({ preventScroll: true });
  };
  frames.forEach((f, i) => f.addEventListener("click", () => open(i)));
  lb.querySelector(".q-lb-bg").addEventListener("click", close);
  lb.querySelector(".q-lb-close").addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lbImg) close(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); show(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopImmediatePropagation(); show(index - 1); }
    else if (e.key === "Tab") { e.preventDefault(); lb.querySelector(".q-lb-close").focus(); }
  }, true);
})();
