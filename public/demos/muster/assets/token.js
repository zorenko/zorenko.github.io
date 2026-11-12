/* Hero token engine, shared by every landing variant (window.MusterToken).
   After graphicalui.com: a pill inside a sentence holds a die-cut sticker and a
   word. On change the word morphs letter by letter (torph), the pill's width
   springs, and the sticker pops (scale .4 → 1.2 → 1 with a rotation overshoot)
   while the old one shrinks away. Several tokens take turns autoplaying.

   MusterToken.mount({
     root,                       // element holding the [data-token="<set>"] buttons
     sets: { set: [[label, stickerHTML, restingRotationDeg], …] },
     morph: 200,                 // letter morph duration, ms
     first: 600, every: 1800,    // autoplay: first tick, then each tick (ms)
     // opt-in (the defaults keep today's behaviour):
     limit: Infinity,            // autoplay stops after this many ticks (e.g. 3: each of three words turns once)
     remeasure: false,           // re-measure the words when their size changes after load (user text spacing)
     hideHints: false,           // the "Next: …" descriptions are hidden nodes, not stray text at the end of <body>
     pop: 1.2,                   // the sticker's peak scale on its way in (1.05: a calmer pop)
   })

   Markup per token (the first option ships in the HTML so first paint is complete):
   <button class="token" data-token="set" style="--label-w:4em">
     <span class="token__sizer" aria-hidden="true">&#8203;</span>
     <span class="token__icon" aria-hidden="true"><span class="token__layer" data-r="-9" style="rotate:-9deg"><span class="token__art">…</span></span></span>
     <span class="token__text" aria-hidden="true"><span class="token__morph">Label</span></span>
   </button> */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  /* ── springs ─────────────────────────────────────────────────────────
     Motion's {visualDuration, bounce} spring, sampled into a CSS linear()
     curve so WAAPI can play it. Browsers without linear() (Safari < 17.2)
     get a cubic-bezier with a similar overshoot. */
  const HAS_LINEAR = CSS.supports('transition-timing-function', 'linear(0, 1)');
  const spring = (visualDuration, bounce = 0) => {
    const w = 2 * Math.PI / (visualDuration * 1.2), z = Math.max(.05, Math.min(1, 1 - bounce));
    const wd = w * Math.sqrt(Math.max(0, 1 - z * z));
    const x = t => z < 1
      ? 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t))
      : 1 - Math.exp(-w * t) * (1 + w * t);
    const envelope = t => z < 1 ? Math.exp(-z * w * t) * Math.hypot(1, z * w / wd) : Math.exp(-w * t) * (1 + w * t);
    let end = 0;
    while (envelope(end) > .001) end += 1 / 120;
    const duration = Math.round(end * 1000);
    if (!HAS_LINEAR) {
      const easing = bounce >= .4 ? 'cubic-bezier(.34, 1.45, .64, 1)' : bounce > 0 ? 'cubic-bezier(.3, 1.15, .5, 1)' : 'cubic-bezier(.22, 1, .36, 1)';
      return { duration, easing };
    }
    const n = Math.max(8, Math.round(end * 60)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(i === n ? 1 : +x(end * i / n).toFixed(4));
    return { duration, easing: `linear(${pts.join(', ')})` };
  };
  const SPRING_WIDTH = spring(.24, .2);   // the pill resizing
  const SPRING_SETTLE = spring(.18, .47); // the sticker settling after its pop
  const SPRING_EXIT = spring(.2, .2);     // the old sticker shrinking away
  const EASE_TEXT = 'cubic-bezier(.19, 1, .22, 1)';

  /* ── TextMorph (after torph): letters that both words share glide to their
     new spot, the rest fade and shrink out or fade and grow in.
     Pairing is an order-preserving match (a longest common subsequence that
     prefers runs of adjacent letters), so shared letters never cross each
     other: "Claude Code" → "Codex" keeps "Code" together and drops "Claude". */
  const pairLetters = (a, b) => {
    // M: best score with a[i-1] ~ b[j-1] matched; D: best score overall. A match is worth 10,
    // +3 if it extends a run, so "Code" in one piece beats a "C" from elsewhere plus "ode".
    const n = a.length, m = b.length, NEG = -1e9;
    const M = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG));
    const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) M[i][j] = Math.max(D[i - 1][j - 1] + 10, M[i - 1][j - 1] + 13);
      D[i][j] = Math.max(D[i - 1][j], D[i][j - 1], M[i][j]);
    }
    const pairs = new Map(); // index in b → index in a
    let i = n, j = m, inRun = false;
    while (i > 0 && j > 0) {
      const target = inRun ? M[i][j] : D[i][j];
      if (!inRun && target === D[i - 1][j]) { i--; continue; }
      if (!inRun && target === D[i][j - 1]) { j--; continue; }
      // here (i, j) is a match; decide whether the run continues diagonally
      pairs.set(j - 1, i - 1);
      inRun = i > 1 && j > 1 && M[i][j] === M[i - 1][j - 1] + 13;
      i--; j--;
    }
    return pairs;
  };

  function textMorph(el, { duration = 400, ease = EASE_TEXT } = {}) {
    let first = true, seq = 0, current = [];
    // new letters inherit the id of the old letter they pair with; the rest get fresh ids
    const ids = s => {
      const chars = [...s], pairs = pairLetters(current.map(x => x.c), chars);
      current = chars.map((c, k) => ({ c, id: pairs.has(k) ? current[pairs.get(k)].id : `m${seq++}` }));
      return current;
    };
    const live = () => [...el.children].filter(n => !n.dataset.exit);
    const shift = n => { const t = getComputedStyle(n).transform; return t && t !== 'none' ? new DOMMatrix(t) : { e: 0, f: 0 }; };
    // visual = where the letter is drawn right now (mid-animation included); otherwise its layout spot
    const pos = (visual = false) => {
      const r = el.getBoundingClientRect(), m = {};
      for (const n of live()) {
        const b = n.getBoundingClientRect(), t = visual ? { e: 0, f: 0 } : shift(n);
        m[n.dataset.id] = { x: b.left - r.left - t.e, y: b.top - r.top - t.f };
      }
      return m;
    };
    const near = (i, list, keep, fwdFirst) => {
      const back = () => { for (let j = i - 1; j >= 0; j--) if (keep.has(list[j])) return list[j]; };
      const fwd = () => { for (let j = i + 1; j < list.length; j++) if (keep.has(list[j])) return list[j]; };
      return fwdFirst ? (fwd() ?? back()) : (back() ?? fwd());
    };
    return {
      set(text, instant = false) {
        if (first) el.textContent = '';
        const next = ids(text), nextIds = next.map(s => s.id), nextSet = new Set(nextIds);
        const prev = pos(true);
        const oldNodes = live(), oldIds = oldNodes.map(n => n.dataset.id);
        const kept = new Set(oldIds.filter(id => nextSet.has(id)));

        // 1. freeze the leaving letters where they are drawn
        const exiting = oldNodes.filter(n => !nextSet.has(n.dataset.id));
        for (const n of exiting) {
          const t = shift(n), op = getComputedStyle(n).opacity, l = n.offsetLeft + t.e, top = n.offsetTop + t.f;
          n.getAnimations().forEach(a => a.cancel());
          Object.assign(n.style, { position: 'absolute', left: `${l}px`, top: `${top}px`, opacity: op, pointerEvents: 'none' });
          n.dataset.exit = '1';
        }

        // 2. reconcile: reuse kept letters by id, create the new ones
        const byId = new Map(oldNodes.filter(n => kept.has(n.dataset.id)).map(n => [n.dataset.id, n]));
        byId.forEach(n => n.remove());
        const nodes = next.map(({ id, c }) => {
          let n = byId.get(id);
          if (!n) { n = document.createElement('span'); n.dataset.id = id; }
          n.textContent = c;
          el.append(n);
          return n;
        });

        if (first || instant) {
          first = false;
          exiting.forEach(n => n.remove());
          nodes.forEach(n => n.getAnimations().forEach(a => a.cancel()));
          return;
        }
        const curr = pos();

        // 3. kept letters slide from where they were; new ones ride along with their nearest kept neighbour
        next.forEach(({ id }, i) => {
          const n = nodes[i], isNew = !kept.has(id), a = isNew ? near(i, nextIds, kept, false) : id;
          const dx = a ? prev[a].x - curr[a].x : 0, dy = a ? prev[a].y - curr[a].y : 0;
          n.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${isNew ? .95 : 1})` }, { transform: 'none' }],
            { duration, easing: ease, fill: 'backwards' });
          if (isNew) n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * .5, delay: duration * .25, easing: 'linear', fill: 'backwards' });
        });

        // 4. leaving letters follow their nearest kept neighbour and fade fast
        for (const n of exiting) {
          const a = near(oldIds.indexOf(n.dataset.id), oldIds, kept, true);
          const dx = a ? curr[a].x - prev[a].x : 0, dy = a ? curr[a].y - prev[a].y : 0;
          n.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(.95)` }], { duration, easing: ease, fill: 'forwards' });
          n.animate([{ opacity: n.style.opacity || 1 }, { opacity: 0 }], { duration: duration * .25, easing: 'linear', fill: 'forwards' })
            .finished.then(() => n.remove(), () => n.remove());
        }
      },
    };
  }

  /* ── tokens ──────────────────────────────────────────────────────────
     They play themselves in turn (first tick, then every tick) while the
     sentence is on screen, the tab is visible and nobody hovers or focuses
     it. The first click stops autoplay for good (WCAG 2.2.2), and so does `limit`. */
  function mount({ root, sets, morph = 200, first = 600, every = 1800, limit = Infinity, remeasure = false, hideHints = false, pop = 1.2, speak = l => l.replace(' › ', ', ') }) {
    if (!root) return null;
    let reduced = motionQuery.matches;
    const chars = label => [...label].map(c => `<span>${c}</span>`).join('');
    const layerHTML = (art, rot) => `<span class="token__layer" data-r="${rot}" style="rotate:${rot}deg"><span class="token__art">${art}</span></span>`;

    const tokens = $$('[data-token]', root).filter(btn => sets[btn.dataset.token]).map(btn => {
      const set = sets[btn.dataset.token];
      const measure = document.createElement('span');
      measure.className = 'token__measure';
      measure.setAttribute('aria-hidden', 'true');
      // the morph draws one inline-block per letter (no kerning between them), so measure the same way
      measure.innerHTML = set.map(([l]) => `<span>${chars(l)}</span>`).join('');
      btn.append(measure);
      const t = { btn, set, i: 0, icon: $('.token__icon', btn), morph: textMorph($('.token__morph', btn), { duration: morph }), measure, ems: [], widthAnim: null };
      t.morph.set(set[0][0]);
      if (!t.icon.firstElementChild) t.icon.innerHTML = layerHTML(set[0][1], set[0][2]);
      return t;
    });
    if (!tokens.length) return null;

    // widths in em: they follow the font size through every breakpoint without re-measuring
    const measureAll = () => tokens.forEach(t => {
      const fs = parseFloat(getComputedStyle(t.btn).fontSize);
      t.ems = [...t.measure.children].map(s => Math.ceil(s.getBoundingClientRect().width / fs * 100) / 100);
      t.btn.style.setProperty('--label-w', `${t.ems[t.i]}em`);
    });

    // A heading's accessible name is built from its content, buttons included, so a token's label is
    // its current word only. "Next: …" goes in a description, and a click announces the new word
    // (a focused button's label change isn't reliably spoken).
    const label = t => speak(t.set[t.i][0]);
    const hint = t => `Next: ${speak(t.set[(t.i + 1) % t.set.length][0])}`;
    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
    tokens.forEach((t, k) => {
      t.desc = document.createElement('span');
      t.desc.className = 'sr-only';
      t.desc.id = `token-next-${k}`;
      // aria-describedby still reads a hidden node
      if (hideHints) t.desc.hidden = true;
      document.body.append(t.desc);
      const by = t.btn.getAttribute('aria-describedby');
      t.btn.setAttribute('aria-describedby', by ? `${by} ${t.desc.id}` : t.desc.id);
    });
    const name = t => { t.btn.setAttribute('aria-label', label(t)); t.desc.textContent = hint(t); };
    tokens.forEach(name);

    const swapIcon = (t, art, rot, instant) => {
      const holder = document.createElement('span');
      holder.innerHTML = layerHTML(art, rot);
      const next = holder.firstElementChild;
      if (instant) { t.icon.replaceChildren(next); return; }
      // the old sticker shrinks away from wherever it is right now
      $$('.token__layer:not(.is-exiting)', t.icon).forEach(o => {
        const cs = getComputedStyle(o), y = +o.dataset.r, s = Math.sign(y) || 1;
        const op = cs.opacity, sc = cs.scale === 'none' ? '1' : cs.scale, ro = cs.rotate === 'none' ? '0deg' : cs.rotate;
        o.getAnimations().forEach(a => a.cancel());
        o.classList.add('is-exiting');
        const out = [
          o.animate({ opacity: [op, 0] }, { duration: 200, easing: 'ease-out', fill: 'forwards' }),
          o.animate({ scale: [sc, '.5'] }, { ...SPRING_EXIT, fill: 'forwards' }),
          o.animate({ rotate: [ro, `${y + 5 * s}deg`] }, { duration: 200, easing: 'ease-out', fill: 'forwards' }),
        ];
        Promise.all(out.map(a => a.finished)).then(() => o.remove(), () => {});
      });
      t.icon.append(next);
      // pop: scale .4 → pop (1.2 by default) → 1 with a rotation overshoot, then a springy settle
      const s = Math.sign(rot) || 1;
      next.animate([
        { scale: '.4', rotate: `${rot - 16 * s}deg`, easing: 'cubic-bezier(.16, .55, .3, 1)' },
        { scale: `${pop}`, rotate: `${rot + 5 * s}deg`, offset: 2 / 3, easing: SPRING_SETTLE.easing },
        { scale: '1', rotate: `${rot}deg` },
      ], { duration: 600 });
      next.animate({ opacity: [0, 1] }, { duration: 180, easing: 'ease-out' });
    };

    // a word's text can change after mount (the hero's folders count up the findings): measure it again
    const relabel = (t, i, text) => {
      t.set[i] = [text, t.set[i][1], t.set[i][2]];
      const m = t.measure.children[i];
      m.innerHTML = chars(text);
      t.ems[i] = Math.ceil(m.getBoundingClientRect().width / parseFloat(getComputedStyle(t.btn).fontSize) * 100) / 100;
    };

    const show = (t, i, instant = reduced) => {
      const [text, art, rot] = t.set[i], same = t.i === i;
      const from = t.btn.getBoundingClientRect().width;
      t.widthAnim?.cancel();
      t.i = i;
      t.btn.style.setProperty('--label-w', `${t.ems[i]}em`);
      if (!instant) {
        const to = t.btn.offsetWidth;
        if (Math.abs(to - from) > .5) t.widthAnim = t.btn.animate({ width: [`${from}px`, `${to}px`] }, SPRING_WIDTH);
      }
      t.morph.set(text, instant);
      // the same word with a new number keeps its sticker
      if (!same) swapIcon(t, art, rot, instant);
      name(t);
    };

    // autoplay: one timer, restarted on every change of state
    let turn = 0, ticks = 0, timer = 0, started = false, stopped = false, ready = false, hovered = false, focused = false, onScreen = true;
    const canPlay = () => ready && !reduced && !stopped && !document.hidden && onScreen && !hovered && !focused;
    const tick = () => {
      timer = 0;
      if (!canPlay()) return;
      started = true;
      const t = tokens[turn];
      turn = (turn + 1) % tokens.length;
      show(t, (t.i + 1) % t.set.length);
      if (++ticks >= limit) stopped = true;
      sync();
    };
    const sync = () => {
      if (!canPlay()) { clearTimeout(timer); timer = 0; return; }
      if (!timer) timer = setTimeout(tick, started ? every : first);
    };

    tokens.forEach(t => t.btn.addEventListener('click', () => {
      stopped = true;
      sync();
      show(t, (t.i + 1) % t.set.length);
      live.textContent = '';
      requestAnimationFrame(() => { live.textContent = label(t); });
    }));
    root.addEventListener('pointerenter', () => { hovered = true; sync(); });
    root.addEventListener('pointerleave', () => { hovered = false; sync(); });
    root.addEventListener('focusin', () => { focused = true; sync(); });
    root.addEventListener('focusout', () => { focused = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    motionQuery.addEventListener?.('change', e => { reduced = e.matches; sync(); });
    new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(root);

    measureAll();
    document.fonts?.addEventListener?.('loadingdone', measureAll);
    if (remeasure && typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => measureAll());
      tokens.forEach(t => [...t.measure.children].forEach(s => ro.observe(s)));
    }
    fontsReady.then(() => { measureAll(); ready = true; sync(); });
    return { tokens, show, relabel, stop: () => { stopped = true; sync(); } };
  }

  window.MusterToken = { mount, spring, textMorph, EASE_TEXT };
})();
