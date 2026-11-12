/* Muster landing — behaviour. No dependencies. */
(() => {
  'use strict';

  /* Invites: a Google Apps Script web app that adds each signup as a row in the leads sheet; invites go out by hand.
     It receives JSON POSTs, sent as text/plain so the browser skips the CORS preflight Apps Script can't answer:
       { email, wants: [...], skills, source: 'cta' }   from the join form
     A reply of { ok: false } counts as a failure. Left empty, nothing is sent and the form only shows its success state. */
  const WAITLIST_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzFYEckmbL_foEaMUCNYeRQbNuL88oG1QrncHd8Bjq4IRaQtrCKqz0REadW4j4KM4l3/exec';
  /* Contact: the same kind of web app, bound to the messages sheet (source in contact.gs).
       { email, message, website }   from "Send us a message" in the footer; website is a honeypot only bots fill */
  const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxUEJ_6JhFw4nXXGnIbECWjcwfIBdyKZ7goeZwnaZqCcWvQRapsTFINcIxxtSz35wvr/exec';

  document.documentElement.classList.remove('no-js');
  // iOS only applies :active (every press scale here) once the page listens for touches
  addEventListener('touchstart', () => {}, { passive: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // shot mode (?shot=web|pop|term, set in <head>): the page is a still picture of one demo surface for the phone carousel
  const SHOT = document.documentElement.dataset.shot;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ── mobile menu ─────────────────────────────────────────────────── */
  const nav = $('.nav'), burger = $('[data-burger]');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger?.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__sheet :is(a, button)').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ── app mock: scale the 1180px design to its container ──────────── */
  const fits = $$('[data-fit]');
  const fit = () => fits.forEach(el => el.style.setProperty('--s', el.clientWidth / +el.dataset.fit));
  fit();

  /* ── hero swarm ──────────────────────────────────────────────────────
     The skills on your Mac pop up one by one, each tagged with what's wrong
     with it: new, a copy of another, conflicting, unused, old, dragged in
     by a plugin, or copied over for Codex. All the while, skills dissolve and new ones take their place.
     As you scroll, each files itself into its folder in the app's sidebar
     and the row blinks on landing. Scrolling also has depth: the chips are the far layer and drift up
     slower than the page (DEPTH), the app is the near one and rises faster. */
  // the page shows one hero picture: this one, or with /hero2 (?hero=2, set in <head> as .hero-folders) the folders below
  $(document.documentElement.classList.contains('hero-folders') ? '[data-hero]' : '[data-muster]')?.remove();
  const stage = $('[data-hero]'), shot = $('[data-hero-shot]'), swarm = $('[data-swarm]');
  // On a phone the stage starts below the fold, so its part of the entrance (the glow, the app, the chips' ring)
  // holds (html.hero-wait, set in <head>) until most of it scrolls into view, and then plays in the same beats as
  // on desktop. heroT0 is when that entrance started: page load, or that moment
  const root = document.documentElement;
  const waiting = () => root.classList.contains('hero-wait');
  let heroT0 = 0;
  if (waiting()) {
    if (!stage) root.classList.remove('hero-wait');
    else {
      const io = new IntersectionObserver(([e]) => {
        if (e.intersectionRatio < .25) return; // the first report can be a sliver at the fold
        io.disconnect(); heroT0 = performance.now(); root.classList.remove('hero-wait');
      }, { threshold: .25 });
      io.observe(stage);
    }
  }
  const TAG = { new: 'new', conflict: 'conflicts', copy: '2 copies', vague: 'vague', plugin: 'plugin', old: 'v0.3', codex: 'Codex copy' };
  // [name, folder row, tag kind, tag text (defaults to TAG[kind])]
  const SWARM = [
    ['commit-message', 'Code', 'conflict'], ['frontend-design', 'Design', 'new'], ['translate-de', 'Writing', 'copy'], ['travel-planner', 'Personal', 'unused', '64d unused'],
    ['pr-review', 'Review', 'codex', 'also in Codex'], ['moodboard', 'Design', 'plugin'], ['my-standup', 'Planning', 'copy'], ['find-skills', 'find-skills', 'new'],
    ['conventional-commits', 'Code', 'conflict'], ['refund-reply', 'Inbox', 'old'], ['side-quest', 'Side', 'vague'], ['translate-es', 'Writing', 'copy'],
    ['okr-draft', 'Admin', 'unused', '41d unused'], ['icon-audit', 'Design', 'plugin'], ['grill-me', 'grill-me', 'new', 'updated'], ['code-search', 'Review'],
    ['brand-fonts', 'Design', 'conflict'], ['triage', 'Admin', 'copy'], ['inbox-zero', 'Inbox'], ['incident-review', 'Code', 'copy'],
    ['ui-taste', 'Design', 'conflict'], ['copywriting', 'Writing', 'plugin'], ['my-fancy-skill', 'my-fancy-skill', 'vague'], ['summarize-thread', 'Inbox'],
    ['postmortem-draft', 'Writing', 'copy'], ['ticket-tagger', 'Admin', 'copy'], ['meeting-notes', 'Inbox', 'copy'], ['flaky-tests', 'Code', 'new'],
    ['color-story', 'Design', 'plugin'], ['weekly-plan', 'Planning'], ['helper', 'Personal', 'vague'], ['retro-notes', 'Planning', 'old', 'v0.2'],
    ['spring-curves', 'Motion', 'new'], ['expense-check', 'Admin', 'unused', '33d unused'], ['deploy-check', 'Side', 'new'], ['tldr', 'Writing', 'old', 'v0.1'],
    ['easing-tokens', 'Motion'], ['ui-review', 'Design', 'copy'], ['a11y-check', 'Review', 'codex', 'also in Codex'], ['standup-summary', 'Planning', 'copy'],
  ];
  let chips = [];

  // more skills than fit on screen at once, so the mess keeps changing
  const POOL = [...SWARM,
    ['design-critique', 'Design', 'copy'], ['type-scale', 'Design', 'plugin'], ['recipe-scaler', 'Personal', 'unused', '52d unused'], ['quick-fix', 'Code', 'vague'],
    ['landing-copy', 'Side', 'vague'], ['spacing-lint', 'Design', 'plugin'], ['apology-email', 'Inbox', 'old', 'v1.0'], ['animation-polish', 'Motion', 'copy'],
    ['changelog', 'Code', 'new'], ['release-notes', 'Writing', 'copy'], ['bug-repro', 'Code'], ['sql-explain', 'Code', 'plugin'],
    ['lint-fix', 'Review', 'copy'], ['figma-export', 'Design', 'plugin'], ['logo-variants', 'Design', 'unused', '47d unused'], ['hover-states', 'Motion', 'copy'],
    ['scroll-reveal', 'Motion', 'vague'], ['email-triage', 'Inbox', 'copy'], ['calendar-prep', 'Inbox', 'new'], ['1on1-notes', 'Planning', 'copy'],
    ['roadmap-draft', 'Planning', 'old', 'v0.4'], ['invoice-chaser', 'Admin', 'vague'], ['tax-receipts', 'Personal', 'unused', '90d unused'], ['workout-log', 'Personal', 'old', 'v0.1'],
    ['blog-outline', 'Writing', 'vague'], ['seo-title', 'Side', 'plugin'], ['waitlist-copy', 'Side', 'copy'], ['code-explain', 'Review', 'conflict'],
  ];
  // i staggers the first entrance; a swapped-in chip passes d (ms) to start right away; a rebuilt one is still
  const chipHTML = ([name, , kind, text], i, d, still) =>
    `<span class="sw__in${still ? ' sw__in--still' : ''}" style="--i:${i}${d != null ? `;--d:${d}ms` : ''}">${name}${kind ? `<em class="sw__tag sw__tag--${kind}">${text || TAG[kind]}</em>` : ''}</span>`;
  let rows = new Map(), fallback = null, area = null, built = false;

  // the speed a click's ripple travels through the chips (px/ms)
  const RIPPLE_SPEED = 1.4;

  // On a short desktop screen the stage gives up some of its chip band, so the app's top edge (and its
  // entrance) still shows on the first screen: PEEK px of it above the fold, but never under BAND px of
  // chips above it. Phones keep their fixed stage; reduced motion parks the shot higher, so it needs none of this.
  // travel: the scroll (px) the hero's choreography plays over, 3/4 of the stage's natural height, so a
  // fitted (shorter) stage doesn't play it faster. start: the scroll it begins at, 0 on desktop (the stage peeks
  // above the fold); on a phone, once 60% of the stage is on screen, so the chips file in where you can see them.
  // The viewport height is taken once per width, so a phone's toolbar sliding away doesn't move it
  const PEEK = 180, BAND = 200, wide = matchMedia('(min-width: 810px)');
  let travel = 0, start = 0, startW = 0, vh0 = innerHeight;
  function fitStage() {
    if (!stage || !shot) return;
    const was = stage.style.height;
    // a phone's stage, trimmed to its rows (layoutSwarm), stays as it is while only the height changes (the
    // toolbar sliding away), so its chips don't re-lay out mid-scroll
    if (!wide.matches && was && innerWidth === startW) return false;
    stage.style.height = stage.style.minHeight = '';
    travel = stage.offsetHeight * .75;
    if (innerWidth !== startW) { startW = innerWidth; vh0 = innerHeight; }
    start = wide.matches ? 0 : Math.max(0, stage.getBoundingClientRect().top + scrollY + stage.offsetHeight * .6 - vh0);
    if (wide.matches && !reduced) {
      const vis = shot.offsetHeight * .54, top = stage.getBoundingClientRect().top + scrollY;
      const H = Math.max(BAND + vis, Math.min(stage.offsetHeight, innerHeight - PEEK - top + vis));
      if (H < stage.offsetHeight) { stage.style.height = `${Math.round(H)}px`; stage.style.minHeight = '0'; }
    }
    return stage.style.height !== was;
  }

  function buildSwarm() {
    if (!swarm) return;
    // as many chips as the free canvas holds, above the shot and in the margins beside it on a wide
    // screen: 36 on a phone, ~40 on a laptop, up to 52 on a wide monitor (the first 40 are SWARM)
    const H = stage.clientHeight, W = stage.clientWidth, top0 = H - shot.offsetHeight * .54;
    const side = Math.max(0, (W - shot.offsetWidth) / 2 - 48) * Math.max(0, H - top0);
    const free = W * Math.max(60, top0 - 68) + 2 * side;
    // a phone's band takes ~25 of its smaller chips in rows that run off both edges (flow, below); 36 are dealt so even
    // the last row fills on a wide phone, and any that don't fit sit out
    const list = POOL.slice(0, Math.round(clamp(free / 13500, wide.matches ? 10 : 36, 52)));
    swarm.innerHTML = list.map(e => `<div class="sw"></div>`).join('');
    // the first wave starts 680ms into the entrance (the hero's third beat, just after the app), not after the fonts;
    // while a phone's entrance holds, its clock hasn't started
    swarm.style.setProperty('--d0', `${waiting() ? 680 : Math.max(0, Math.round(680 - (performance.now() - heroT0)))}ms`);
    rows = new Map($$('[data-landing] li', shot).map(li => [li.dataset.row, li]));
    fallback = $('.app__group', shot);
    chips = $$('.sw', swarm).map((el, i) => ({ el, i, entry: list[i], landed: false }));
    const still = built && !waiting(); built = true; // only the first build plays the entrance (or a rebuild before it began)
    chips.forEach(c => { c.el.innerHTML = chipHTML(c.entry, c.i, null, still); });
    layoutSwarm();
    // the first wave spills out of the app like a ring on water: from the middle of its top edge, at an
    // even speed, reaching the far corners in 700ms however many chips there are (--i × 30ms). Each chip
    // starts 12px nearer the app (--dx/--dy) and drifts out as it lands.
    const mid = (Math.max(0, area.ox) + Math.min(area.W, area.ox + area.shotW)) / 2;
    const vec = c => [c.x + c.w / 2 - mid, c.y + c.h / 2 - area.top0];
    const shown = chips.filter(c => !c.off), far = Math.max(1, ...shown.map(c => Math.hypot(...vec(c))));
    shown.forEach(c => {
      const [vx, vy] = vec(c), d = Math.hypot(vx, vy) || 1, st = c.el.firstElementChild.style;
      st.setProperty('--i', (d / far * 700 / 30).toFixed(2));
      st.setProperty('--dx', `${(-vx / d * 12).toFixed(1)}px`);
      st.setProperty('--dy', `${(-vy / d * 12).toFixed(1)}px`);
    });
  }

  function measure(c) {
    c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
    c.target = rows.get(c.entry[1]) || fallback;
    // offset of the target, measured in the shot's own (unscaled-by-scroll) frame
    const sr = shot.getBoundingClientRect(), tr = c.target.getBoundingClientRect();
    c.tx = tr.left - sr.left + tr.width * .5; c.ty = tr.top - sr.top + tr.height * .5;
  }

  // a spot that doesn't cover another chip, in the band above the shot or in a margin beside it when the
  // chip fits there. When the canvas is full the chip sits out (hidden) rather than land on top of another
  function place(c, r) {
    const others = chips.filter(o => o !== c && o.x != null);
    const sideW = area.side - c.w, sideA = sideW > 0 ? sideW * (area.H - area.yMax) : 0;
    const topA = (area.W - c.w - 32) * (area.yMax - area.yMin);
    let best = null;
    for (let k = 0; k < 160; k++) {
      let x, y;
      const pick = r() * (topA + 2 * sideA);
      if (pick < topA) { x = 16 + r() * Math.max(1, area.W - c.w - 32); y = area.yMin + r() * (area.yMax - area.yMin); }
      else {
        x = 16 + r() * sideW; if (pick > topA + sideA) x = area.W - c.w - x;
        y = area.yMax + r() * (area.H - area.yMax);
      }
      const hit = others.some(o => x < o.x + o.w + 12 && x + c.w + 12 > o.x && y < o.y + o.h + 10 && y + c.h + 10 > o.y);
      if (!hit) { best = { x, y }; break; }
    }
    c.off = !best; c.el.hidden = c.off;
    c.x = best ? best.x : null; c.y = best ? best.y : null;
    if (c.off) c.cx = null; // the cursor and the ripple leave it alone
  }

  // A phone's band is too narrow for random spots: most chips found none and sat out, leaving ~6. There they
  // fill loose rows instead, 8-22px apart and nudged up or down by up to 3px, so it still reads as a heap. The
  // rows run past both edges of the screen (each starts 10-60px off the left, and a chip may start up to 40px
  // short of the right edge), so the pile reads as bigger than the phone; a chip below the band sits out
  function flow(r) {
    // as many rows as fit between 16px under the stage's top edge and 16px over the app's (desktop's closest);
    // it returns what's left under the last row it filled, which layoutSwarm takes off the stage, so both gaps
    // come out at 16px (a row the chips ran out before counts as left over too)
    const h = Math.max(...chips.map(c => c.h)), rowH = h + 9, start = () => -10 - r() * 50;
    const top = 16, bottom = area.top0 - 16 - h;
    let x = start(), y = top, last = top;
    for (const c of chips) {
      if (x > area.W - 40) { x = start(); y += rowH; }
      c.off = y > bottom + 1; c.el.hidden = c.off;
      c.x = c.off ? null : x; c.y = c.off ? null : y + (r() - .5) * 6;
      if (c.off) c.cx = null; else { x += c.w + 8 + r() * 14; last = y; }
    }
    return bottom - last;
  }

  function layoutSwarm(fitted) {
    if (!chips.length) return;
    const H = stage.clientHeight, top0 = H - shot.offsetHeight * (1 - .46); // shot top before any scroll
    // side: how wide the margin beside the shot is, less 16px from the stage edge and 32px from the shot
    const W = stage.clientWidth, side = (W - shot.offsetWidth) / 2 - 48;
    // stageH and shot sizes are cached here so drawSwarm never has to read layout mid-frame
    area = { W, H: H - 52, side, yMin: 22, yMax: Math.max(62, top0 - 46), top0, stageH: H, shotW: shot.offsetWidth, shotH: shot.offsetHeight };
    // the shot's left edge: centred on desktop, pinned to the gutter and running off the right on a phone (styles.css)
    area.ox = shot.offsetLeft - shot.offsetWidth / 2;
    // the size a chip shrinks to as it files: 70%, or on a small shot (a phone's app is ~54% scale) about
    // 1.4 sidebar rows (26px at 1180) of a 30px chip, so it doesn't land wider than the sidebar
    area.end = Math.min(.7, area.shotW / 1180 * 26 * 1.4 / 30);
    const r = rng(11);
    chips.forEach(c => { c.x = null; c.el.hidden = false; });
    if (wide.matches) chips.forEach(c => { measure(c); place(c, r); });
    else {
      chips.forEach(measure);
      // a phone's stage fits its rows: back to its natural height, then it gives up what the rows leave over and
      // lays out again. Every layout starts over, so an earlier trim (or fonts that rewrapped the rows) can't stick
      if (!fitted && stage.style.height) { stage.style.height = stage.style.minHeight = ''; return layoutSwarm(); }
      const spare = flow(r);
      if (!fitted && spare > 1) { stage.style.height = `${Math.round(stage.offsetHeight - spare)}px`; stage.style.minHeight = '0'; return layoutSwarm(true); }
    }
    const shown = chips.filter(c => !c.off);
    area.far = Math.max(1, ...shown.map(gap));
    shown.forEach(pull);
  }

  // the sidebar pulls like a magnet: every chip moves from the first bit of scroll, but the pull fades
  // with distance, so near ones travel faster and file in within a short scroll (dur, in p) and far ones
  // creep (and show the drift). dur grows with distance^1.5, so speed (distance / dur) falls as 1/√distance;
  // with dur ∝ distance every chip would cover the same share per scroll and the far ones would streak.
  // The floor keeps the nearest from flicking in. Distance to its own row, at rest
  const gap = c => Math.hypot(c.x + c.w / 2 - (area.ox + c.tx), c.y + c.h / 2 - (area.top0 + c.ty));
  function pull(c) {
    c.dur = Math.max(.3, .95 * Math.pow(Math.min(1, gap(c) / area.far), 1.5));
  }

  // skills swap in and out once the first wave has landed, so the mess never sits still. The beat is uneven
  // (one every 280-800ms) and now and then two or three go at once, 70ms apart, so it moves in gusts rather
  // than ticking like a clock. A chip swaps until it's a third of the way to its row, so a little scroll doesn't
  // freeze the pile; it pauses while the page is hidden or the hero off screen, and reduced motion turns it off
  let swarmP = 0, shotY = 46;
  const DEPTH = .35;
  if (!reduced && !SHOT) {
    const r = Math.random;
    const swapOut = c => {
      if (!chips.includes(c) || c.off) return; // the swarm was rebuilt (a resize) since it was picked
      // swap once the old one has dissolved (sw-out), whatever its duration
      const old = c.el.firstElementChild;
      const swap = e => {
        if (e.target !== old || e.animationName !== 'sw-out') return;
        old.removeEventListener('animationend', swap); old.removeEventListener('animationcancel', swap);
        // picked now, not when it started to leave, so two leaving together can't bring in the same skill
        const shown = new Set(chips.map(o => o.entry[0]));
        const fresh = POOL.filter(e => !shown.has(e[0])), { x, y, entry } = c;
        const put = e => { c.entry = e; c.el.innerHTML = chipHTML(e, c.i, 40); measure(c); };
        const fits = () => !chips.some(o => o !== c && o.x != null && x < o.x + o.w + 4 && x + c.w + 4 > o.x && y < o.y + o.h && y + c.h > o.y);
        c.el.classList.remove('is-out');
        if (wide.matches && fresh.length) { put(fresh[Math.floor(r() * fresh.length)]); c.x = null; place(c, r); }
        // a phone's newcomer takes the leaver's spot in its row, and so does a desktop one that found no free spot:
        // any skill that fits before the next chip, or the leaver again, so the canvas never thins out. (Only ever
        // taking a shorter one wore the names down to the shortest, and then nothing could change)
        if (!wide.matches || c.off) {
          c.off = c.el.hidden = false; // hidden, it would measure 0 wide
          let ok = false;
          for (let k = 0; k < 12 && fresh.length && !ok; k++) { put(fresh.splice(Math.floor(r() * fresh.length), 1)[0]); ok = fits(); }
          if (!ok) put(entry);
          c.x = x; c.y = y;
        }
        if (!c.off) pull(c);
        drawSwarm(swarmP);
      };
      old.addEventListener('animationend', swap); old.addEventListener('animationcancel', swap);
      c.el.classList.add('is-out');
    };
    const tick = () => {
      setTimeout(tick, 280 + r() * 520);
      if (waiting() || !chips.length || document.hidden || stage.getBoundingClientRect().bottom < 0) return;
      // never swap a chip that's still coming in (the first wave lands by ~2s): each one gets 2.4s on screen
      const now = performance.now(), idle = chips.filter(o => !o.off && swarmP < o.dur * .3 && now - (o.t || heroT0) > 2400 && !o.el.classList.contains('is-out'));
      const n = Math.min(idle.length, r() < .3 ? 2 + (r() < .4) : 1);
      for (let k = 0; k < n; k++) {
        const c = idle.splice(Math.floor(r() * idle.length), 1)[0];
        c.t = now;
        setTimeout(() => swapOut(c), k * 70);
      }
    };
    setTimeout(tick, 420);
  }

  // what the check turns up as the skills file in: the overview opens a row under its stats and one more finding
  // card rises into it every 18% of the scroll, from when the nearest chips have landed (.22) to before the farthest
  // do (.76). Only a change of count touches the DOM: the cursor's spring redraws every frame. A card's number counts
  // up from 0 as it rises (500ms, ease-out), so it reads as found, not printed; the first card waits out the row
  // opening (120ms, styles.css). Reduced motion: no count
  const flagBox = $('[data-flags]'), flags = flagBox ? $$('.flag', flagBox) : [], FLAG_AT = [.22, .4, .58, .76];
  let found = -1;
  const countUp = (el, delay) => {
    const num = $('strong', el), to = +(num.dataset.n ??= num.textContent), t0 = performance.now() + delay;
    const step = now => {
      if (!el.classList.contains('is-on')) { num.textContent = to; return; }
      const t = clamp((now - t0) / 500);
      num.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    num.textContent = 0; requestAnimationFrame(step);
  };
  function paintFlags(p) {
    const n = FLAG_AT.filter(at => p >= at).length;
    if (!flagBox || n === found) return;
    const was = Math.max(0, found);
    found = n;
    flagBox.classList.toggle('is-open', n > 0);
    flags.forEach((el, i) => {
      el.classList.toggle('is-on', i < n);
      if (i >= was && i < n && !reduced) countUp(el, i === 0 ? 120 : 0);
    });
  }

  function drawSwarm(p) {
    swarmP = p;
    paintFlags(p);
    if (!chips.length || !area) return;
    // where the shot sits in the stage, from cached sizes and its current offset: no layout read after paintHero's write
    const ox = area.ox, oy = area.stageH - area.shotH * (1 - shotY / 100);
    // the parallax: a chip that hasn't been filed yet moves up at (1 - DEPTH) of the scroll (p is scrollY / travel)
    const drift = DEPTH * p * travel;
    for (const c of chips) {
      if (c.off) continue;
      // straight at the row: it moves with the scroll from the first pixel (start speed 1× its mean) and
      // settles into the row (end speed 0), a Hermite curve. Arriving at speed read as a slam
      const raw = clamp(p / c.dur), t = raw * (1 + raw - raw * raw);
      const tx = ox + c.tx - c.w / 2, ty = oy + c.ty - c.h / 2;
      const y0 = c.y + drift, x = c.x + (tx - c.x) * t, y = y0 + (ty - y0) * t;
      // it shrinks toward the row's size and fades as it settles, not in the last instant
      const s = 1 - t * (1 - area.end), o = t < .7 ? 1 : 1 - (t - .7) / .3;
      // the cursor's nudge (below) fades out as the chip is filed; a pushed chip also swells, up to 5%
      const nx = (c.nx || 0) * (1 - t), ny = (c.ny || 0) * (1 - t), lift = 1 + .05 * (c.lift || 0) * (1 - t);
      c.cx = x + c.w / 2; c.cy = y + c.h / 2;
      c.el.style.transform = `translate3d(${(x + nx).toFixed(1)}px, ${(y + ny).toFixed(1)}px, 0) scale(${(s * lift).toFixed(3)})`;
      c.el.style.opacity = o.toFixed(3);
      if (t >= .99 && !c.landed) {
        c.landed = true;
        const li = c.target.closest('li');
        if (li && !reduced) { li.classList.add('is-landed'); requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('is-landed'))); }
      } else if (t < .9) c.landed = false;
    }
  }

  /* ── the swarm makes room for the cursor ────────────────────────────
     Chips near a mouse pointer lean away from it on a spring, swelling a little
     as they're pushed (a stone in water), and settle back when it leaves, so the
     pile answers you as well as changing on its own.
     Mouse only (touch has no hover), never under reduced motion. */
  if (stage && swarm && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const R = 160, PUSH = 22, K = 170, C = 22; // reach and push (px); spring stiffness and damping: a touch under critical, no visible bounce
    let ptr = null, raf = 0, last = 0;
    const step = now => {
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      let moving = false;
      for (const c of chips) {
        let gx = 0, gy = 0; // where the spring is headed
        if (ptr && c.cx != null) {
          const dx = c.cx - ptr.x, dy = c.cy - ptr.y, d = Math.hypot(dx, dy);
          if (d > 0 && d < R) { const f = PUSH * (1 - d / R) ** 2; gx = dx / d * f; gy = dy / d * f; }
        }
        c.nx ??= 0; c.ny ??= 0; c.vx ??= 0; c.vy ??= 0;
        c.vx += ((gx - c.nx) * K - c.vx * C) * dt; c.vy += ((gy - c.ny) * K - c.vy * C) * dt;
        c.nx += c.vx * dt; c.ny += c.vy * dt;
        c.lift = Math.min(1, Math.hypot(c.nx, c.ny) / PUSH);
        if (Math.abs(gx - c.nx) + Math.abs(gy - c.ny) + Math.abs(c.vx) + Math.abs(c.vy) > .05) moving = true;
      }
      drawSwarm(swarmP);
      raf = moving ? requestAnimationFrame(step) : 0;
      if (!raf) last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      ptr = { x: e.clientX - r.left - stage.clientLeft, y: e.clientY - r.top - stage.clientTop };
      kick();
    });
    stage.addEventListener('pointerleave', () => { ptr = null; kick(); });
  }

  /* ── a click or tap on the canvas sends a ripple ───────────────────────
     An unseen wave spreads from the spot at 1.4px/ms; each chip it reaches swells to
     108% and settles, drifting 6px outward, the same crest as the entrance
     (sw-in). Chips still coming in or swapping out are left alone. */
  if (stage && swarm && !reduced) {
    stage.addEventListener('click', e => {
      if (!area) return;
      const r = stage.getBoundingClientRect();
      const px = e.clientX - r.left - stage.clientLeft, py = e.clientY - r.top - stage.clientTop;
      for (const c of chips) {
        const el = c.el.firstElementChild;
        if (!el || c.cx == null || c.el.classList.contains('is-out') || el.getAnimations().some(a => a.animationName === 'sw-in' && a.playState !== 'finished')) continue;
        const dx = c.cx - px, dy = c.cy - py, d = Math.hypot(dx, dy) || 1, ux = dx / d * 6, uy = dy / d * 6;
        el.animate([
          { transform: 'translate(0, 0) scale(1)', easing: 'cubic-bezier(.33, 1, .68, 1)' },
          { transform: `translate(${ux.toFixed(1)}px, ${uy.toFixed(1)}px) scale(1.08)`, offset: .45, easing: 'cubic-bezier(.37, 0, .63, 1)' },
          { transform: 'translate(0, 0) scale(1)' },
        ], { duration: 600, delay: d / RIPPLE_SPEED });
      }
    });
  }

  // the hero token's engine, once mounted (below): the folders drive its words with what they find
  let heroToken = null;

  /* ── hero folders ────────────────────────────────────────────────────
     After the app's first run. The skills swirl on three tilted rings around a grid of folders (the app's folder
     icons), and Muster sorts them for about RUN_MS: every BEAT_MS a chip in front leaves its ring, shows what Muster
     found on it (a conflict, a duplicate, an update…), and flies into its folder; a fresh one takes its place on
     the ring. The folders wait in grey and take the accent with their first skill; the glass front gulps each
     one, and under it Muster says what it found ("1 conflict found"). Every ROUND skills the folders hold full for
     a beat, then go back to grey in a wave, so their numbers stay believable, while the rings and the flights
     carry on. The last round that fits in RUN_MS ends it: the folders stay full, the rings come to rest, and the
     button plays it again. The rings are sized around the folders, so the skills swirl around them, not under.
     What it finds shows as it happens: two copies of a skill merge in flight, a folder that takes a conflict
     shakes and flashes red, an update pops a green "↑" off its folder. Each chip carries the agent it's for (Claude
     Code, Codex or both). A chip ends its flight by dropping in behind the folder's glass front. Hovering (or
     tapping) a folder fans its skills out above it, and hovering a finding names the skills behind it. The
     headline's token counts the findings up as they come.
     A button pauses it (WCAG 2.2.2), and it also holds off screen and in a hidden tab.
     Everything runs on one clock (vt) that only moves while it plays; CSS motion pauses with it. Reduced motion
     shows the rings standing still and the folders full. */
  const mu = $('[data-muster]');
  if (mu) {
    // a chip shows what it is from the start (FACT) and what Muster found on it once it's sorted (FOUND; an
    // unused one keeps its own "64d unused")
    const FACT = new Set(['plugin', 'codex', 'old']);
    const FOUND = { conflict: ['conflict', 'conflict found'], copy: ['copy', 'duplicate found'], new: ['update', 'update found'], vague: ['vague', 'vague description'] };
    const orbitEl = $('[data-muster-orbit]', mu), flyEl = $('[data-muster-fly]', mu);
    const foldersEl = $('[data-muster-folders]', mu), pauseBtn = $('[data-muster-pause]', mu);
    // the folders, 4 × 2 (3 × 2 on a phone), and which rows of the skills' data (SWARM, POOL) each takes
    const WIDE_FOLDERS = [
      ['Code', ['Code', 'Side']], ['Review', ['Review']], ['Design', ['Design']], ['Motion', ['Motion']],
      ['Writing', ['Writing']], ['Inbox and meetings', ['Inbox']], ['Planning', ['Planning']], ['Admin', ['Admin', 'Personal']],
    ];
    const PHONE_FOLDERS = [
      ['Code', ['Code', 'Review', 'Side']], ['Design', ['Design', 'Motion']], ['Writing', ['Writing']],
      ['Inbox', ['Inbox']], ['Planning', ['Planning']], ['Admin', ['Admin', 'Personal']],
    ];
    // what Muster finds, worst first: the dot's colour, and how a folder says it (short on a phone's narrow folders)
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const FINDS = [
      ['conflict', 'red', n => `${plural(n, 'conflict', 'conflicts')} found`, n => plural(n, 'conflict', 'conflicts')],
      ['copy', 'amber', n => `${plural(n, 'duplicate', 'duplicates')} found`, n => plural(n, 'duplicate', 'duplicates')],
      ['unused', 'grey', n => `${n} unused found`, n => `${n} unused`],
      ['vague', 'amber', n => `${plural(n, 'vague description', 'vague descriptions')}`, n => `${n} vague`],
      ['new', 'green', n => `${plural(n, 'update', 'updates')} found`, n => plural(n, 'update', 'updates')],
    ];
    // the rings, after the app's: three around the folders, each k times their size (a negative ry puts the front
    // above the middle), the middle one turning the other way
    const MU_RINGS = [{ k: 1.25, ry: 1, speed: 1 }, { k: 1.45, ry: -1, speed: -.75 }, { k: 1.7, ry: 1, speed: .6 }];
    // TURN: one turn at pace 1. The pace and the dimming settle toward each phase's (about two thirds of the way in
    // SETTLE): a quick swirl as the chips first come in, then slower and dimmer behind the folders for good.
    // FLIGHT_MS to the folder's mouth, then DROP_MS falling in. HOLD_MS: how long the full folders show before they
    // go grey again
    const TURN = 40000, SETTLE = 700, BEAT_MS = 150, FLIGHT_MS = 620, DROP_MS = 300, HOLD_MS = 2400, WAVE_MS = 60, RUN_MS = 30000;
    const PACE = { intro: 1, sort: .5 }, DIM = { intro: 1, sort: .6 };
    const muPhone = matchMedia('(max-width: 809px)');
    let folders = [], slots = [], flights = new Set(), events = [], picks = [], stream = [];
    let vt = 0, raf = 0, last = 0, pace = 4, dim = 1, phase = 'intro', turnedM = 0, round = 0, sent = 0, done = 0;
    let geo = null, playing = false, held = false, seen = false, inView = false, runFrom = 0, roundFrom = 0;
    const ROUND = () => muPhone.matches ? 30 : 40;

    const after = (ms, fn) => events.push({ t: vt + ms, fn });
    const shuffle = (list, r) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    function buildFolders() {
      const list = muPhone.matches ? PHONE_FOLDERS : WIDE_FOLDERS;
      foldersEl.parentElement.setAttribute('aria-label', `Skills swirling and flying into folders: ${list.map(([n]) => n).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Under each folder, what Muster found in it, like a conflict, a duplicate or an unused skill`);
      // inside the icon, back to front: the back and its tab, two papers, the fan (its skills, behind the front until
      // it opens), the drop (a chip falling in), and the glass front with the count and a red flash for conflicts
      foldersEl.innerHTML = list.map((_, i) => `<li class="fold"><div class="fold__icon"><span class="fold__back"></span><span class="fold__paper"></span><span class="fold__paper"></span><span class="fold__fan"></span><span class="fold__drop"></span><span class="fold__front"><span class="fold__flash"></span><span class="fold__count">0</span></span></div><p class="fold__name">${list[i][0]}</p><ul class="fold__status"></ul></li>`).join('');
      folders = $$('.fold', foldersEl).map((li, i) => ({
        rows: list[i][1], li, icon: $('.fold__icon', li), front: $('.fold__front', li), flash: $('.fold__flash', li), count: $('.fold__count', li),
        fan: $('.fold__fan', li), drop: $('.fold__drop', li), status: $('.fold__status', li), n: 0, found: {}, shown: new Set(), items: [],
      }));
      // its skills fan out while a mouse is over a full folder, or after a tap (another tap, or one elsewhere, closes it)
      // (the pointer's type comes from pointerdown: some browsers' click events don't carry it)
      folders.forEach(f => {
        let touch = false;
        f.li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') openFan(f, true); });
        f.li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') openFan(f, false); });
        f.li.addEventListener('pointerdown', e => { touch = e.pointerType !== 'mouse'; });
        f.li.addEventListener('click', () => { if (touch) { const open = !f.li.classList.contains('is-open'); folders.forEach(g => openFan(g, false)); openFan(f, open); } });
      });
      // every skill on the page's list that has a folder here (the loose ones at the root don't)
      picks = POOL.filter(e => folders.some(f => f.rows.includes(e[1])));
      stream = [];
    }
    const folderOf = entry => folders.find(f => f.rows.includes(entry[1]));
    const kindOf = entry => entry[2];
    const tones = Object.fromEntries(FINDS.map(([k, tone]) => [k, tone]));

    // which agent a skill is for: Claude Code mostly, about a third Codex, both for a skill copied over for Codex
    const AGENT = { claude: '<i class="logo logo--claude sw__agent" style="--src:url(assets/logos/claude.svg)"></i>', codex: '<i class="logo sw__agent" style="--src:url(assets/logos/openai.svg)"></i>' };
    const agents = ([name, , kind]) => {
      if (kind === 'codex') return AGENT.claude + AGENT.codex;
      const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
      return h % 10 < 3 ? AGENT.codex : AGENT.claude;
    };
    // a skill's chip: the agent, the name, what it is (a plugin, a version…) and, with `verdict`, what Muster found
    // on it (shown once it's sorted); with `dot`, the finding's dot before the name instead, as in the folder's fan
    function pill(entry, { verdict = false, dot = false, cls = '', style = '' } = {}) {
      const [name, , kind, text] = entry, [tone, label] = FOUND[kind] || (kind === 'unused' ? ['unused', text] : []);
      const fact = FACT.has(kind) ? `<em class="sw__tag sw__tag--${kind}">${text || TAG[kind]}</em>` : '';
      const lead = dot && tones[kind] ? `<b class="dot dot--${tones[kind]}"></b>` : '';
      return `<span class="sw__in${cls}"${style ? ` style="${style}"` : ''}>${lead}${agents(entry)}${name}${fact}${verdict && tone ? `<span class="sw__verdict"><em class="sw__tag sw__tag--${tone}">${label}</em></span>` : ''}</span>`;
    }

    // the fan: up to IN_FAN of the folder's skills, those Muster found something on first, rising out of it in a
    // tilted stack, and a last chip for how many more (as in the app)
    // It holds as many as fit between the folder and the stage's top edge, so a top-row folder's fan isn't cut off
    const IN_FAN = 5, FAN_STEP = 30, FAN_LIFT = 30;
    function fillFan(f) {
      const room = f.top / f.k - 8, fits = Math.max(2, Math.floor((room - FAN_LIFT - 15) / FAN_STEP) + 1);
      const items = [...f.items].sort((a, b) => !!tones[kindOf(b)] - !!tones[kindOf(a)]);
      const n = items.length > Math.min(IN_FAN, fits) ? Math.min(IN_FAN, fits - 1) : items.length;
      const shown = items.slice(0, n), more = items.length - n;
      const spot = i => { const side = i % 2 ? 1 : -1; return `--x:${side * (6 + i * 3)}px;--y:${-FAN_LIFT - i * FAN_STEP}px;--r:${side * 2.5}deg;--i:${i}`; };
      f.fan.innerHTML = shown.map((e, i) => `<div class="sw" style="${spot(i)}">${pill(e, { dot: true, cls: ' sw__in--still' })}</div>`).join('')
        + (more ? `<div class="sw" style="${spot(shown.length)}"><span class="sw__in sw__in--still sw__more">+${more}</span></div>` : '');
    }
    function openFan(f, open) {
      open = open && f.n > 0;
      if (open === f.li.classList.contains('is-open')) return;
      // fresh chips need a closed style first, or the fan has nothing to rise from
      if (open) { fillFan(f); void f.fan.offsetWidth; }
      f.li.classList.toggle('is-open', open);
    }

    // a finding's skills, for its tooltip: conflicts in pairs, the rest with what's wrong. At most three, then how many more
    function tipFor(f, k) {
      const own = f.items.filter(e => kindOf(e) === k), names = [];
      if (k === 'conflict') {
        const others = f.items.filter(e => kindOf(e) !== k);
        for (let i = 0; i < own.length; i += 2) names.push(`${own[i][0]} <i>↔</i> ${(own[i + 1] || others[0] || own[i])[0]}`);
      } else {
        const why = { copy: () => '2 copies', unused: e => e[3], vague: () => 'vague description', new: () => 'update available' }[k];
        own.forEach(e => names.push(`${e[0]} <i>· ${why(e)}</i>`));
      }
      const lines = names.slice(0, 3).map(n => `<span>${n}</span>`).join('');
      return `<span class="fold__tip">${lines}${names.length > 3 ? `<span class="fold__tip-more">and ${names.length - 3} more</span>` : ''}</span>`;
    }

    // the skills come round without end: the list shuffled again each time it runs out, skipping any already on a ring
    let shuffles = 0;
    function nextSkill() {
      const onRings = new Set(slots.map(s => s.chip?.entry));
      for (let k = 0; k < 2; k++) {
        if (!stream.length) stream = shuffle(picks, rng(++shuffles * 97));
        const i = stream.findIndex(e => !onRings.has(e));
        if (i !== -1) return stream.splice(i, 1)[0];
        stream = [];
      }
      return picks[0];
    }

    function paintFolder(f) {
      f.count.textContent = f.n;
      // the two worst findings; a line that's new since the last paint clears in
      const lines = FINDS.filter(([k]) => f.found[k]).slice(0, 2).map(([k, tone, long, short]) => [k, `<b class="dot dot--${tone}"></b>${(muPhone.matches ? short : long)(f.found[k])}`]);
      // updated in place, so a line under the pointer keeps its tooltip open as the folder fills
      f.shown = new Set(lines.map(([k]) => k));
      const old = new Map($$('li', f.status).map(li => [li.dataset.k, li]));
      lines.forEach(([k, html], i) => {
        let li = old.get(k);
        if (!li) { li = document.createElement('li'); li.dataset.k = k; li.className = 'is-new'; }
        const next = html + tipFor(f, k);
        if (li.innerHTML !== next) li.innerHTML = next;
        if (f.status.children[i] !== li) f.status.insertBefore(li, f.status.children[i] || null);
        old.delete(k);
      });
      old.forEach(li => li.remove());
      if (f.li.classList.contains('is-open')) fillFan(f);
    }

    // a folder back to grey and empty: its lines fade with it, then go
    function empty(f) {
      openFan(f, false);
      f.li.classList.remove('is-in');
      f.n = 0; f.found = {}; f.items = [];
      after(320, () => { if (!f.n) { f.shown = new Set(); paintFolder(f); } });
    }

    // where everything is, in the stage's own pixels: the rings' middle (the folders' middle) and each folder's mouth
    function measureMuster() {
      const sr = mu.getBoundingClientRect(), fr = foldersEl.getBoundingClientRect();
      geo = { W: mu.clientWidth, H: mu.clientHeight, cx: fr.left - sr.left + fr.width / 2, cy: fr.top - sr.top + fr.height / 2, bw: fr.width / 2, bh: fr.height / 2 };
      // each ring as wide as it must be to clear the folders' corners (a chip's half width beside them, 18px above
      // and below), and no taller than the stage; past the stage's edges by 40px at most, so on a narrow screen a
      // ring can still cross the folders, and drawRings fades a chip out there
      const bw = geo.bw + 60, bh = geo.bh + 18;
      geo.rings = MU_RINGS.map(({ k }) => {
        const ry = Math.min(bh * k, geo.H / 2 - 22), clear = ry > bh ? bw / Math.sqrt(1 - (bh / ry) ** 2) * 1.05 : Infinity;
        return { rx: Math.min(Math.max(bw * k, clear), geo.W / 2 + 40), ry };
      });
      folders.forEach(f => {
        // the icon's place in the stage, from its folder (the icon itself may be mid-swell or mid-shake), and its
        // scale (a phone zooms it to 78%)
        const r = f.li.getBoundingClientRect();
        f.k = parseFloat(getComputedStyle(f.icon).zoom) || 1; f.x = r.left - sr.left + r.width / 2; f.top = r.top - sr.top;
      });
    }

    function makeSlots() {
      const n = muPhone.matches ? 14 : Math.round(clamp(geo.W / 56, 18, 28)), r = rng(5);
      orbitEl.textContent = '';
      slots = Array.from({ length: n }, (_, i) => ({ ring: MU_RINGS[i % 3], r: i % 3, angle: Math.floor(i / 3) / Math.ceil(n / 3) * Math.PI * 2 + r() * .5, chip: null }));
    }

    // a chip comes onto a ring: it pops in after `delay` ms (the chip's own CSS entrance) and can be sorted once it has
    function seat(slot, entry, delay) {
      const el = document.createElement('div');
      el.className = 'sw';
      el.innerHTML = pill(entry, { verdict: true, cls: reduced ? ' sw__in--still' : '', style: `--d:${Math.round(delay)}ms` });
      orbitEl.append(el);
      slot.chip = { el, entry, w: el.offsetWidth, ready: vt + delay + 600, blur: -1, z: -1 }; // once its entrance is over
    }

    function onRing(slot) {
      const angle = slot.angle + turnedM * slot.ring.speed, depth = Math.sin(angle), near = (depth + 1) / 2, size = geo.rings[slot.r];
      return {
        x: geo.cx + Math.cos(angle) * size.rx, y: geo.cy + depth * size.ry * slot.ring.ry, depth,
        scale: .6 + .4 * near, opacity: (.3 + .7 * near) * dim, blur: Math.round(Math.max(0, (.6 - near) / .6) * 9) / 2, z: Math.round(near * 10),
      };
    }

    function drawRings() {
      for (const slot of slots) {
        const c = slot.chip;
        if (!c) continue;
        const o = onRing(slot);
        // where a ring crosses the folders (a narrow screen), a chip fades out over the last 24px before it would touch them
        const out = Math.max(Math.abs(o.x - geo.cx) - geo.bw - c.w * o.scale / 2, Math.abs(o.y - geo.cy) - geo.bh - 15);
        c.el.style.transform = `translate3d(${(o.x - c.w * o.scale / 2).toFixed(1)}px, ${o.y.toFixed(1)}px, 0) scale(${o.scale.toFixed(3)})`;
        c.el.style.opacity = (o.opacity * clamp(1 + out / 24)).toFixed(3);
        if (c.blur !== o.blur) { c.blur = o.blur; c.el.style.filter = o.blur ? `blur(${o.blur}px)` : ''; }
        if (c.z !== o.z) { c.z = o.z; c.el.style.zIndex = o.z; }
      }
    }

    // one skill leaves its ring for its folder: out of its depth into full view, then on the strong in-out curve,
    // as in the app, to just over the folder's mouth, small enough to fit in it (FLIGHT_MS). There it drops in
    // behind the glass front (DROP_MS), and the folder takes it. A duplicate starts as two copies that merge on the way
    function fly(slot) {
      const c = slot.chip, f = folderOf(c.entry);
      slot.chip = null;
      const from = c.el.style.transform, op = c.el.style.opacity, blur = c.el.style.filter || 'blur(0px)';
      c.el.classList.add('is-sorted');
      // moving it to the flight layer would replay its entrance; only the finding's tag clears in
      c.el.firstElementChild.classList.add('sw__in--still');
      flyEl.append(c.el);
      const w = c.el.offsetWidth, s = Math.min(.75, 92 * f.k / w), mouth = f.top + 23 * f.k;
      const anim = c.el.animate([
        { transform: from, opacity: op, filter: blur },
        { opacity: 1, filter: 'blur(0px)', offset: .25 },
        { transform: `translate3d(${(f.x - w * s / 2).toFixed(1)}px, ${mouth.toFixed(1)}px, 0) scale(${s.toFixed(3)})`, opacity: 1, filter: 'blur(0px)' },
      ], { duration: FLIGHT_MS, easing: 'cubic-bezier(.77, 0, .175, 1)', fill: 'forwards' });
      flights.add(anim);
      if (kindOf(c.entry) === 'copy' && !reduced) {
        const ghost = c.el.firstElementChild.cloneNode(true);
        ghost.classList.add('sw__ghost');
        c.el.prepend(ghost);
        const merge = ghost.animate([
          { transform: 'translate(16px, -34px) rotate(-3deg)', opacity: .9 },
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        ], { duration: 420, delay: 80, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' });
        flights.add(merge);
        merge.onfinish = () => { flights.delete(merge); ghost.remove(); };
      }
      anim.onfinish = () => { flights.delete(anim); drop(f, c, w, s); };
      // a fresh skill takes its place on the ring
      after(420, () => { if (!slot.chip) seat(slot, nextSkill(), 0); });
    }
    // into the folder: the chip moves into the icon, between the papers and the front, and falls in behind the
    // glass as the front gulps it. In the icon's own pixels (108 × 86), so a phone's smaller folders scale it too
    function drop(f, c, w, s) {
      const k = s / f.k;
      c.el.getAnimations().forEach(a => a.cancel());
      c.el.style.cssText = '';
      f.drop.append(c.el);
      const fall = c.el.animate([
        { transform: `translate(${(54 - w * k / 2).toFixed(1)}px, 23px) scale(${k.toFixed(3)})`, opacity: 1 },
        { opacity: 1, offset: .55 },
        { transform: `translate(${(54 - w * k * .45).toFixed(1)}px, 60px) scale(${(k * .9).toFixed(3)})`, opacity: 0 },
      ], { duration: DROP_MS, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' });
      flights.add(fall);
      fall.onfinish = () => { flights.delete(fall); c.el.remove(); };
      land(f, c.entry);
    }

    function land(f, entry) {
      const first = !f.n, kind = kindOf(entry);
      f.n++; f.items.push(entry);
      if (tones[kind]) { f.found[kind] = (f.found[kind] || 0) + 1; runFound[kind] = (runFound[kind] || 0) + 1; }
      if (first) f.li.classList.add('is-in');
      else if (!reduced) {
        const rest = f.li.classList.contains('is-open') ? -18 : 0; // an open folder's front is already tipped
        track(f.front.animate([{ transform: `rotateX(${rest}deg)` }, { transform: `rotateX(${rest - 28}deg)`, offset: .35 }, { transform: `rotateX(${rest}deg)` }], { duration: 480, easing: 'cubic-bezier(.23, 1, .32, 1)' }));
      }
      if (!reduced) showFound(f, kind);
      paintFolder(f);
      // the round's last skill is in: hold the folders full, then grey them in a wave, and sort on
      if (++done === ROUND()) {
        // the end, if another round (the hold, the grey wave and as long as this one took) wouldn't be over by
        // RUN_MS, give or take 3s
        const next = vt + HOLD_MS + folders.length * WAVE_MS + 260 + (vt - roundFrom);
        if (next - runFrom > RUN_MS + 3000) return finish();
        phase = 'hold';
        after(HOLD_MS, regrey);
      }
    }
    // an animation that pauses with the rest (flights), and lets go when it's done
    const track = a => { flights.add(a); a.addEventListener('finish', () => flights.delete(a)); return a; };

    // what it found, as it happens: a conflict shakes the folder and flashes its glass red; an update pops a
    // green "↑ update" off it, which rises and fades
    function showFound(f, kind) {
      if (kind === 'conflict') {
        track(f.icon.animate([{ translate: '0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '-3px 0' }, { translate: '2px 0' }, { translate: '0' }], { duration: 380, easing: 'ease-out' }));
        track(f.flash.animate([{ opacity: 0 }, { opacity: .55, offset: .25 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' }));
      } else if (kind === 'new') {
        const tag = document.createElement('span');
        tag.className = 'fold__pop';
        tag.textContent = '↑ update';
        f.li.append(tag);
        const up = tag.animate([
          { transform: 'translate(-50%, 8px) scale(.9)', opacity: 0 },
          { transform: 'translate(-50%, -10px) scale(1)', opacity: 1, offset: .3 },
          { transform: 'translate(-50%, -26px) scale(1)', opacity: 0 },
        ], { duration: 1000, easing: 'cubic-bezier(.23, 1, .32, 1)', fill: 'forwards' });
        flights.add(up);
        up.onfinish = () => { flights.delete(up); tag.remove(); };
      }
    }

    // the headline's token counts the findings: every TOKEN_MS it shows the next kind found so far in this run
    // (duplicates, conflicts, unused), with its number, and lands on the last at the end. A click on the token is
    // someone reading it: from then on it's theirs
    const TOKEN_KINDS = [['copy', 1, 'duplicate', 'duplicates'], ['conflict', 2, 'conflict', 'conflicts'], ['unused', 3, 'unused', 'unused']], TOKEN_MS = 2400;
    let runFound = {}, tokenTurn = 0, tokenFree = false;
    $('.hero [data-token]')?.addEventListener('click', () => { tokenFree = true; });
    function turnToken(again = true) {
      const api = heroToken, t = api?.tokens[0];
      // not while someone has the headline under the pointer or focused (the engine holds then too)
      if (t && !tokenFree && !t.btn.closest('.h-hero')?.matches(':hover, :focus-within')) {
        api.stop();
        for (let n = 0; n < TOKEN_KINDS.length; n++) {
          const [k, i, one, many] = TOKEN_KINDS[(tokenTurn + n) % TOKEN_KINDS.length];
          if (!runFound[k]) continue;
          tokenTurn += n + 1;
          api.relabel(t, i, plural(runFound[k], one, many));
          api.show(t, i);
          break;
        }
      }
      if (again && phase !== 'end') after(TOKEN_MS, turnToken);
    }

    // the folders back to grey in a wave, then the next round
    function regrey() {
      folders.forEach((g, i) => after(i * WAVE_MS, () => empty(g)));
      after(folders.length * WAVE_MS + 260, () => { sent = done = 0; phase = 'sort'; roundFrom = vt; });
    }
    // it's over: the folders stay full, the rings slow to a stop (tick), and the button plays it again
    function finish() {
      phase = 'end';
      events = events.filter(e => e.fn !== turnToken);
      turnToken(false);
      mu.classList.add('is-held');
      pauseBtn.setAttribute('aria-label', 'Play the animation again');
    }
    function replay() {
      held = false; mu.classList.remove('is-held');
      pauseBtn.setAttribute('aria-label', 'Pause the animation');
      phase = 'hold'; runFrom = vt; pace = 2; runFound = {};
      events = events.filter(e => e.fn !== turnToken && e.fn !== beat); // a turn or a beat still waiting from the last run
      regrey();
      after(folders.length * WAVE_MS + 300, beat);
      after(1600, turnToken);
      sync(); if (playing && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    }

    // every BEAT_MS one goes, while the round has skills to send: a ready chip in front of the folders if there is
    // one (a random one, so the folders fill in no set order), else the frontmost ready one. The beat itself never stops
    function beat() {
      if (phase === 'end') return;
      after(BEAT_MS, beat);
      if (phase !== 'sort' || sent >= ROUND()) return;
      const ready = slots.filter(s => s.chip && s.chip.ready <= vt);
      if (!ready.length) return;
      const at = new Map(ready.map(s => [s, onRing(s).depth])), front = ready.filter(s => at.get(s) > .2);
      fly(front.length ? front[Math.floor(Math.random() * front.length)] : ready.reduce((b, s) => at.get(s) > at.get(b) ? s : b));
      sent++;
    }

    // the start: the rings fill (a quick swirl), then the sorting begins
    function start(first) {
      round++; sent = done = 0; phase = 'intro'; pace = 4; runFound = {};
      if (!tokenFree) heroToken?.stop(); // the folders drive the token from here (turnToken)
      mu.classList.toggle('is-held', held);
      pauseBtn.setAttribute('aria-label', held ? 'Play the animation' : 'Pause the animation');
      folders.forEach(f => { f.n = 0; f.found = {}; f.shown = new Set(); f.items = []; f.li.classList.remove('is-in', 'is-open'); paintFolder(f); });
      // the first chips come in with the hero's third beat, from 680ms after load; after a rebuild at once
      const r = rng(round), base = first ? Math.max(0, 680 - performance.now()) : 0;
      slots.forEach(s => seat(s, nextSkill(), base + r() * 900));
      drawRings();
      after(base + 1500, () => { phase = 'sort'; runFrom = roundFrom = vt; beat(); });
      after(base + 2700, turnToken);
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      // no cap on the step: the flights run on real time, so the clock keeps up with them after a slow frame
      const dt = last ? now - last : 16;
      last = now; vt += dt;
      const k = 1 - Math.exp(-dt / SETTLE), key = phase === 'intro' ? 'intro' : 'sort';
      pace += ((phase === 'end' ? 0 : PACE[key]) - pace) * k; dim += (DIM[key] - dim) * k;
      turnedM += dt * pace * Math.PI * 2 / TURN;
      let i;
      while ((i = events.findIndex(e => e.t <= vt)) !== -1) events.splice(i, 1)[0].fn();
      drawRings();
      // at the end, once the rings are still and the last skill is in, the clock stops
      if (phase === 'end' && pace < .01 && !flights.size && !events.length) { cancelAnimationFrame(raf); raf = 0; }
    }

    // it plays while it's on screen, the tab is showing and nobody has paused it
    function sync() {
      const go = inView && !held && !document.hidden;
      if (go === playing) return;
      playing = go;
      mu.classList.toggle('is-paused', !go);
      flights.forEach(a => go ? a.play() : a.pause());
      if (go) { if (!seen) { seen = true; start(true); } if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
      else { cancelAnimationFrame(raf); raf = 0; }
    }

    // reduced motion, standing still: the rings full and a round's skills sorted
    function still() {
      measureMuster(); makeSlots();
      shuffle(picks, rng(97)).slice(0, ROUND()).forEach(e => { const f = folderOf(e); f.n++; f.items.push(e); if (tones[e[2]]) f.found[e[2]] = (f.found[e[2]] || 0) + 1; f.li.classList.add('is-in'); });
      folders.forEach(paintFolder);
      slots.forEach(s => seat(s, nextSkill(), 0));
      drawRings();
    }

    buildFolders();
    if (reduced) still();
    else {
      pauseBtn.hidden = false;
      measureMuster(); makeSlots();
      pauseBtn.addEventListener('click', () => {
        if (phase === 'end') return replay();
        held = !held;
        mu.classList.toggle('is-held', held);
        pauseBtn.setAttribute('aria-label', held ? 'Play the animation' : 'Pause the animation');
        sync();
      });
      new IntersectionObserver(([e]) => { inView = e.isIntersecting && e.intersectionRatio >= .2; sync(); }, { threshold: [0, .2] }).observe(mu);
      document.addEventListener('visibilitychange', sync);
    }
    // a press anywhere else closes a fan (pointerdown: iOS doesn't send clicks from empty canvas); Escape closes
    // fans and hides the tooltips until the pointer moves again
    document.addEventListener('pointerdown', e => { if (!e.target.closest?.('.fold')) folders.forEach(f => openFan(f, false)); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { folders.forEach(f => openFan(f, false)); foldersEl.classList.add('is-quiet'); } });
    mu.addEventListener('pointermove', () => foldersEl.classList.remove('is-quiet'));
    // the folders and rings follow the stage's size (its height follows the window's); a phone has its own
    // folders, so crossing to or from one starts afresh
    let wasPhone = muPhone.matches;
    new ResizeObserver(() => {
      if (muPhone.matches !== wasPhone) {
        wasPhone = muPhone.matches;
        events = []; flights.forEach(a => a.cancel()); flights.clear(); flyEl.textContent = '';
        buildFolders();
        if (reduced) return still();
        measureMuster(); makeSlots();
        if (seen) start(false);
        return;
      }
      measureMuster(); drawRings();
    }).observe(mu);
    document.fonts?.ready.then(() => { measureMuster(); slots.forEach(s => { if (s.chip) s.chip.w = s.chip.el.offsetWidth; }); drawRings(); });
  }

  /* ── play step art only while it's on screen ─────────────────────── */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-playing'); io.unobserve(e.target); }
  }), { threshold: .35 });
  $$('[data-play]').forEach(el => io.observe(el));

  // phones: the step pictures share one box height (styles.css); a picture taller than its box is scaled down to
  // fit with CSS zoom (it shrinks the layout too, so the picture stays centred). Measured again when the width
  // or the fonts change
  const arts = $$('.step__art'), narrow = matchMedia('(max-width: 809px)');
  const fitArts = () => arts.forEach(a => {
    const c = a.firstElementChild;
    if (!c) return;
    c.style.zoom = '';
    if (!narrow.matches) return;
    const cs = getComputedStyle(a), room = a.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (c.offsetHeight > room) c.style.zoom = (room / c.offsetHeight).toFixed(3);
  });
  if (arts.length) {
    let artW = innerWidth;
    fitArts();
    document.fonts?.ready.then(fitArts);
    addEventListener('resize', () => { if (innerWidth !== artW) { artW = innerWidth; fitArts(); } }, { passive: true });
  }

  /* ── privacy heading: the pills' stickers pop in once, with the hero token's pop (scale .4 → 1.05 → 1 and a
        rotation overshoot), 80ms apart, once the line is on screen ── */
  const sntLine = $('[data-stickers]');
  if (sntLine && !reduced) {
    const stickers = $$('.token__layer', sntLine);
    sntLine.classList.add('is-armed');
    new IntersectionObserver((es, ob) => {
      if (!es.some(e => e.isIntersecting)) return;
      ob.disconnect();
      sntLine.classList.remove('is-armed');
      stickers.forEach((el, i) => {
        const rot = parseFloat(getComputedStyle(el).rotate) || 0, s = Math.sign(rot) || 1, delay = 150 + i * 80;
        el.animate([
          { scale: '.4', rotate: `${rot - 16 * s}deg`, easing: 'cubic-bezier(.16, .55, .3, 1)' },
          { scale: '1.05', rotate: `${rot + 3 * s}deg`, offset: 2 / 3, easing: 'cubic-bezier(.3, 1.15, .5, 1)' },
          { scale: '1', rotate: `${rot}deg` },
        ], { duration: 600, delay, fill: 'backwards' });
        el.animate({ opacity: [0, 1] }, { duration: 180, delay, easing: 'ease-out', fill: 'backwards' });
      });
    }, { threshold: .6 }).observe(sntLine);
  }

  /* ── install: the terminal types one command, then plays it once ─── */
  const shell = $('[data-shell]');
  if (shell && !reduced) {
    const cmd = $('[data-type]', shell), text = cmd.textContent;
    const spinner = $('[data-spinner]', shell);
    shell.classList.add('is-armed');
    cmd.textContent = '';
    new IntersectionObserver((es, ob) => {
      if (!es.some(e => e.isIntersecting)) return;
      ob.disconnect();
      // a short beat, then ~38ms a key; the script's data-at times start from here
      [...text].forEach((ch, i) => setTimeout(() => { cmd.textContent += ch; }, 300 + i * 38));
      $$('[data-at]', shell).forEach(l => setTimeout(() => l.classList.add('is-in'), +l.dataset.at));
      $$('[data-until]', shell).forEach(l => setTimeout(() => l.classList.add('is-out'), +l.dataset.until));
      if (spinner) {
        const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
        let f = 0;
        const spin = setInterval(() => { spinner.textContent = frames[f = (f + 1) % frames.length]; }, 80);
        setTimeout(() => clearInterval(spin), +spinner.closest('[data-until]').dataset.until);
      }
    }, { threshold: .35 }).observe(shell);
  }

  /* ── CTA: the same skills, mustered into tidy rows ───────────────── */
  const ctaRows = $('[data-cta-rows]');
  if (ctaRows) {
    const groups = [
      ['Design', ['ui-taste', 'design-critique', 'frontend-design', 'brand-fonts', 'ux-copy-review', 'canvas-design', 'motion-review']],
      ['Code', ['pr-review', 'commit-message', 'code-search', 'webapp-testing', 'flaky-tests', 'sql-explain', 'release-notes']],
      ['Inbox and meetings', ['refund-reply', 'apology-email', 'inbox-zero', 'meeting-notes', 'summarize-thread', 'handoff-note', 'tldr']],
      ['Writing', ['copywriting', 'translate-es', 'okr-draft', 'doc-coauthoring', 'postmortem-draft', 'grill-me', 'my-standup']],
    ];
    const row = gs => `<div class="cta__row"><div class="cta__track">${[0, 1].map(() => gs.map(([label, names]) =>
      `<span class="sw sw--label" style="position:static"><span class="sw__in">${label}</span></span>` +
      names.map(n => `<span class="sw" style="position:static"><span class="sw__in">${n}</span></span>`).join('')).join('')).join('')}</div></div>`;
    ctaRows.innerHTML = row(groups.slice(0, 2)) + row(groups.slice(2));
  }

  /* ── scroll-linked: hero shot, swarm, scrubbed problem text ──────── */
  const scrub = $('[data-scrub]'), scrubText = $('[data-scrub-text]'), scrubChips = scrub ? $$('.chip', scrub) : [];
  let words = [];
  if (scrubText) {
    scrubText.innerHTML = scrubText.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    words = $$('.w', scrubText);
  }
  // The hero follows the scroll through a damped spring-ish lerp, so a wheel's
  // coarse steps turn into one smooth glide instead of 100px jumps.
  let heroTarget = 0, heroP = -1, heroRaf = 0, heroT = 0;
  const paintHero = p => {
    const visible = stage.getBoundingClientRect().bottom > 0; // the frame's only layout read, before any write
    const e = 1 - Math.pow(1 - clamp(p / .8), 2); // the near layer: up 40% of its height in the first 80% of the scroll
    shotY = 46 - 40 * e;
    // the transform itself, not a custom property: a variable would restyle the whole app mock every frame
    shot.style.transform = `translate(-50%, ${shotY.toFixed(2)}%)`;
    if (visible) drawSwarm(p);
  };
  const heroTick = t => {
    const dt = heroT ? Math.min(64, t - heroT) : 16;
    heroT = t;
    heroP += (heroTarget - heroP) * (1 - Math.exp(-dt / 70));
    if (Math.abs(heroTarget - heroP) < .0004) heroP = heroTarget;
    paintHero(heroP);
    if (heroP !== heroTarget) heroRaf = requestAnimationFrame(heroTick);
    else { heroRaf = 0; heroT = 0; }
  };

  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    if (stage && shot && !reduced && !SHOT) { // a shot hides the hero: it has no size to scroll through
      heroTarget = clamp((scrollY - start) / (travel || stage.offsetHeight * .75)); // before init, the unfitted stage
      if (heroP < 0) { heroP = heroTarget; paintHero(heroP); }  // first paint: no glide from the top
      else if (!heroRaf) heroRaf = requestAnimationFrame(heroTick);
    }
    if (scrub && words.length && !reduced) {
      const r = scrub.getBoundingClientRect();
      const p = clamp((-r.top + vh * .15) / ((r.height - vh) * .85));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-on', i < n));
      // the pile grows with the sentence: one more chip every few words
      const shown = scrubChips.filter(c => c.offsetParent !== null); // smaller screens hide some chips
      shown.forEach((c, i) => c.classList.toggle('is-on', p > (i + .5) / (shown.length + 1)));
    }
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  const init = () => {
    fitStage();
    buildSwarm();
    if (reduced) { words.forEach(w => w.classList.add('is-on')); scrubChips.forEach(c => c.classList.add('is-on')); if (shot) { shotY = 6; shot.style.transform = 'translate(-50%, 6%)'; } drawSwarm(1); }
    frame();
  };
  addEventListener('scroll', request, { passive: true });
  let resizeT, lastW = innerWidth;
  addEventListener('resize', () => {
    fit(); clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      fitStage();
      // a phone's address bar only changes the height: keep the chips, and only re-lay them out if the stage
      // itself changed (a phone's stage is a fixed 460px, so they stay put as the toolbar slides away)
      if (innerWidth !== lastW) { lastW = innerWidth; buildSwarm(); }
      else if (area && (stage.clientHeight !== area.stageH || shot.offsetWidth !== area.shotW)) layoutSwarm();
      if (reduced) drawSwarm(1);
      else if (stage && shot && heroP >= 0) paintHero(heroP);
      frame();
    }, 120);
  }, { passive: true });
  // slow web fonts don't hold the hero back: start after 300ms at most, re-measure the chips when the fonts land
  const fontsIn = document.fonts?.ready || Promise.resolve();
  Promise.race([fontsIn, new Promise(r => setTimeout(r, 300))]).then(init);
  // and again once the shot has scaled into place (shot-in): the folder rows the chips fly to sit 4% off until then
  const remeasure = () => { if (!chips.length) return; chips.forEach(measure); chips.forEach(c => { if (!c.off) pull(c); }); drawSwarm(reduced ? 1 : swarmP); };
  // the fonts can rewrap the headline and move the stage: fit it again and re-lay the chips if it changed
  fontsIn.then(() => { if (chips.length && (fitStage() || !wide.matches)) layoutSwarm(); remeasure(); });
  shot?.addEventListener('animationend', e => { if (e.target.classList.contains('app')) remeasure(); });

  /* ── hero token: "Zero order" → "6 duplicates" → "2 conflicts" → "10 unused"
     Each word has a die-cut sticker (white-outlined flat shapes, tilted r°). */
  const STICKER = inner => `<svg viewBox="0 0 64 64">${inner}</svg>`;
  const TOKENS = [
    { label: 'Zero order', r: -9, art: STICKER(`
      <g fill="#fff" stroke="#fff" stroke-width="7.5" stroke-linejoin="round">
        <rect x="5" y="16" width="26" height="32" rx="6" transform="rotate(-16 18 32)"/><rect x="24" y="5" width="26" height="32" rx="6" transform="rotate(12 37 21)"/><rect x="27" y="27" width="30" height="31" rx="6" transform="rotate(-5 42 42)"/></g>
      <rect x="5" y="16" width="26" height="32" rx="6" transform="rotate(-16 18 32)" fill="#EFEFED"/>
      <rect x="24" y="5" width="26" height="32" rx="6" transform="rotate(12 37 21)" fill="#DEDEDA"/>
      <rect x="27" y="27" width="30" height="31" rx="6" transform="rotate(-5 42 42)" fill="#202020"/>
      <rect x="33" y="35" width="14" height="5" rx="2.5" transform="rotate(-5 42 42)" style="fill:var(--accent-on-dark)"/>
      <rect x="33" y="44" width="18" height="3" rx="1.5" transform="rotate(-5 42 42)" fill="#6C6C6C"/>`) },
    { label: '6 duplicates', r: 8, art: STICKER(`
      <g fill="#fff" stroke="#fff" stroke-width="7.5" stroke-linejoin="round"><rect x="7" y="6" width="32" height="40" rx="7"/><rect x="23" y="18" width="32" height="40" rx="7"/></g>
      <rect x="7" y="6" width="32" height="40" rx="7" fill="#EFEFED"/>
      <rect x="13" y="14" width="20" height="5" rx="2.5" fill="#BDBDB8"/><rect x="13" y="24" width="14" height="3" rx="1.5" fill="#BDBDB8"/>
      <rect x="23" y="18" width="32" height="40" rx="7" fill="#fff" stroke="#E4E4E0" stroke-width="1.5"/>
      <rect x="29" y="26" width="20" height="5" rx="2.5" fill="#FF9D2E"/><rect x="29" y="36" width="14" height="3" rx="1.5" fill="#BDBDB8"/><rect x="29" y="43" width="18" height="3" rx="1.5" fill="#BDBDB8"/>`) },
    { label: '2 conflicts', r: -8, art: STICKER(`
      <g fill="#fff" stroke="#fff" stroke-width="7.5" stroke-linejoin="round"><rect x="3" y="14" width="26" height="36" rx="6" transform="rotate(-10 16 32)"/><rect x="35" y="14" width="26" height="36" rx="6" transform="rotate(10 48 32)"/><circle cx="32" cy="31" r="10"/></g>
      <rect x="3" y="14" width="26" height="36" rx="6" transform="rotate(-10 16 32)" fill="#EFEFED"/>
      <rect x="35" y="14" width="26" height="36" rx="6" transform="rotate(10 48 32)" fill="#202020"/>
      <circle cx="32" cy="31" r="10" fill="#FF5263"/>
      <path d="M28 27l8 8M36 27l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) },
    { label: '10 unused', r: 9, art: STICKER(`
      <g fill="#fff" stroke="#fff" stroke-width="7.5" stroke-linejoin="round"><rect x="8" y="14" width="34" height="42" rx="7"/><path d="M46 6a11 11 0 1 0 11 14a9 9 0 0 1-11-14z"/></g>
      <rect x="8" y="14" width="34" height="42" rx="7" fill="#EFEFED"/>
      <rect x="14" y="23" width="20" height="5" rx="2.5" fill="#D4D4D0"/><rect x="14" y="33" width="14" height="3" rx="1.5" fill="#D4D4D0"/><rect x="14" y="40" width="18" height="3" rx="1.5" fill="#D4D4D0"/>
      <path d="M46 6a11 11 0 1 0 11 14a9 9 0 0 1-11-14z" fill="#A3A3A3"/>`) },
  ];
  // the engine (morph, sticker pop, width spring, autoplay) is shared with the other variants: assets/token.js
  heroToken = window.MusterToken?.mount({
    root: $('.hero .h-hero'),
    sets: { pile: TOKENS.map(t => [t.label, t.art, t.r]) },
    morph: 240,             // a touch longer than the reference's 200ms: this headline is bigger
    first: 2600, every: 2400, // first change once the skill chips have landed (~2s)
    pop: 1.05,              // a softer sticker pop than the engine's 1.2, to sit with the hero's calm entrance
  });

  /* ── story: the cleanup bar, numbers and receipts light up together ── */
  const cleanup = $('[data-cleanup]');
  if (cleanup) {
    const story = cleanup.closest('.story'), tip = $('[data-tip]', cleanup), track = $('.cleanup__track', cleanup);
    const keyed = $$('[data-k]', story);
    const bar = $('.cleanup__bar', cleanup), labels = $('.cleanup__labels', cleanup), receipts = $('.receipts', story);
    const grouped = el => bar.contains(el) || labels.contains(el) || receipts.contains(el);
    let current = null, mid = 0;
    // magnetic tip: it sits on the segment's centre and leans part of the way toward the cursor.
    // `aim` is where the arrow should point; `now` eases toward it every frame.
    const PULL = .4;
    let aim = 0, now = 0, raf = 0, last = 0;
    const place = () => {
      const half = tip.offsetWidth / 2, at = clamp(now, half, track.offsetWidth - half);
      tip.style.setProperty('--x', `${at}px`);
      tip.style.setProperty('--ax', `${clamp(now - at, 12 - half, half - 12)}px`);
    };
    const follow = t => {
      now += (aim - now) * (1 - Math.exp(-(t - last) / 60));
      last = t;
      if (Math.abs(aim - now) < .1) { now = aim; raf = 0; } else raf = requestAnimationFrame(follow);
      place();
    };
    const steer = (x, jump) => {
      aim = x;
      if (jump || reduced) { cancelAnimationFrame(raf); raf = 0; now = x; place(); }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(follow); }
    };
    const show = k => {
      current = k;
      story.classList.toggle('is-focus', !!k);
      keyed.forEach(el => el.classList.toggle('is-hot', !!k && el.dataset.k === k));
      const seg = k && $(`.cleanup__bar [data-k="${k}"]`, cleanup);
      if (!seg) { tip.classList.remove('is-on'); return; }
      tip.innerHTML = seg.dataset.label;
      mid = seg.offsetLeft + seg.offsetWidth / 2;
      // first appearance: jump to the segment, then fade in; after that, glide between segments
      steer(mid, !tip.classList.contains('is-on'));
      tip.classList.add('is-on');
    };
    const mouse = e => e.pointerType === 'mouse';
    bar.addEventListener('pointermove', e => {
      if (!mouse(e) || !current || reduced) return;
      const x = e.clientX - track.getBoundingClientRect().left;
      steer(mid + (x - mid) * PULL);
    });
    keyed.forEach(el => {
      el.addEventListener('pointerenter', e => { if (mouse(e)) show(el.dataset.k); });
      // only clear when the pointer leaves the whole bar or the whole row of receipts,
      // so moving between neighbours glides the tip across instead of hiding and reshowing it
      if (!grouped(el)) el.addEventListener('pointerleave', e => { if (mouse(e)) show(null); });
      // touch: segments light up through focus; receipts can't take focus, so a tap toggles them
      if (!bar.contains(el)) el.addEventListener('click', () => { if (lastType !== 'mouse') show(current === el.dataset.k ? null : el.dataset.k); });
      el.addEventListener('focus', () => show(el.dataset.k));
      el.addEventListener('blur', () => show(null));
    });
    [bar, labels, receipts].forEach(g => g.addEventListener('pointerleave', e => { if (mouse(e)) show(null); }));
    let lastType = 'mouse';
    addEventListener('pointerdown', e => {
      lastType = e.pointerType;
      if (!mouse(e) && current && !e.target.closest('[data-k]')) show(null); // tap elsewhere clears it
    }, { passive: true });

    // when the bar comes into view, 229 counts down to what's left
    const left = $('[data-count]', cleanup);
    if (left && !reduced) {
      const to = +left.textContent, from = +left.dataset.count;
      left.textContent = from;
      new IntersectionObserver((es, ob) => es.forEach(e => {
        if (!e.isIntersecting) return;
        ob.disconnect();
        const t0 = performance.now(), dur = 1400;
        const step = t => {
          const q = clamp((t - t0) / dur), eased = 1 - Math.pow(1 - q, 4);
          left.textContent = Math.round(from + (to - from) * eased);
          if (q < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }), { threshold: .5 }).observe(left);
    }
  }

  /* ── story: what the cleanup saves, in tokens, money and sanity. One bad session on the cleanup's Mac, turn by
     turn, to scale: the 75 kept put ~7,500 tokens into every turn; the 154 that went had filled Claude Code's list to
     its cap (~10,000), so they add ~2,500. At turn 4 a duplicate loads by mistake, then the skill you meant; at
     turn 8 two skills with opposite rules both load; 2,500 each, and each stays for every turn after. After Muster
     the skills you meant still load: 7,500 → 10,000 → 12,500, against 10,000 → 15,000 → 20,000 before.
     Beside it, the card: what that's worth in a month on an API key at Opus 5.5 prices, for light, typical or heavy
     use ── */
  const turn = $('[data-turn]');
  if (turn) {
    const TURNS = 12, AT = { wrong: 4, clash: 8 }, PART = { kept: 7500, idle: 2500, wrong: 2500, clash: 2500 };
    const SEGS = ['clash', 'wrong', 'idle', 'ran', 'kept']; // top to bottom; ran and kept stay, the rest goes
    const STAYS = ['ran', 'kept'];
    const LABEL = { kept: 'Skill list, kept', ran: 'Skills that ran', idle: 'Skills you don’t need', wrong: 'The wrong duplicate', clash: 'The other clashing skill' };
    // Opus 5.5 per token: cached reads $0.20 per million on every turn, a cache write ($5 per million) once a session
    const READ = .2 / 1e6, WRITE = 5 / 1e6, DAYS = 21;
    // turns a day, sessions a day
    const USE = { light: [100, 5], typical: [400, 10], heavy: [1500, 25] };
    const cols = $('[data-turn-cols]', turn), tip = $('[data-turn-tip]', turn), plot = $('.tchart__plot', turn), chartEl = $('.tchart', turn);
    const live = $('[data-turn-live]', turn), end = $('[data-turn-end]', turn);
    const MAX = 22000, fmt = n => n.toLocaleString('en-US');
    let after = false, cur = null, lastPointer = 'mouse';

    // what each part puts into turn n: the skill you meant (after the wrong pick) and the clashing skill your
    // agent follows both ran, and still run after Muster
    const at = (key, n) => key === 'ran' ? (n >= AT.wrong ? PART.wrong : 0) + (n >= AT.clash ? PART.clash : 0) : !AT[key] || n >= AT[key] ? PART[key] : 0;
    const total = n => SEGS.reduce((t, k) => t + at(k, n), 0);
    const stays = n => STAYS.reduce((t, k) => t + at(k, n), 0), junk = n => total(n) - stays(n);
    cols.innerHTML = Array.from({ length: TURNS }, (_, i) => `<div class="tcol" style="--i:${i}" data-n="${i + 1}"><div class="tcol__stack">${SEGS.filter(k => at(k, i + 1)).map(k =>
      `<i class="tseg tseg--${k}" data-part="${STAYS.includes(k) ? 'kept' : k}" style="--v:${at(k, i + 1)}"></i>`).join('')}</div></div>`).join('');
    // the labels wait for the columns only on the way in
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return;
      ob.disconnect(); setTimeout(() => chartEl.classList.add('is-landed'), 1600);
    }), { threshold: .35 }).observe(chartEl);

    // hover (or tap) a column: a card beside it with that turn's tokens, part by part; the other columns dim.
    // Right of the first half of the columns, left of the rest, level with the column's top
    const row = (k, v) => `<span class="tchart__row"><i class="tkey tkey--${k}"></i>${LABEL[k]}<em>${fmt(v)}</em></span>`;
    const showCol = c => {
      cur = c;
      $$('.tcol', cols).forEach(x => x.classList.toggle('is-hot', x === c));
      turn.classList.toggle('has-col', !!c);
      if (!c) { tip.classList.remove('is-on'); return; }
      const n = +c.dataset.n;
      const parts = after ? STAYS : SEGS;
      tip.innerHTML = `<b>Turn ${n}</b>${parts.filter(k => at(k, n)).map(k => row(k, at(k, n))).join('')}` + (after
        ? `<span class="tchart__sum">${fmt(stays(n))} tokens, ${fmt(junk(n))} fewer than before</span>`
        : `<span class="tchart__sum">${fmt(total(n))} tokens, ${fmt(junk(n))} of them you didn’t need</span>`);
      // beside the column, on the side it fits (right for the first half when both do); on a phone where neither
      // does, under the axis, so it never covers the switch above the plot
      const bar = $('.tcol__stack', c).offsetWidth, mid = cols.offsetLeft + c.offsetLeft + c.offsetWidth / 2;
      const tw = tip.offsetWidth, th = tip.offsetHeight, ph = plot.offsetHeight, pw = plot.offsetWidth;
      const top = ph - (after ? stays(n) : total(n)) / MAX * ph;
      const rightX = mid + bar / 2 + 12, leftX = mid - bar / 2 - 12 - tw;
      const okR = rightX + tw <= pw, okL = leftX >= 0;
      let x, y = clamp(top, 0, Math.max(0, ph - th));
      if (okR && (n <= TURNS / 2 || !okL)) x = rightX;
      else if (okL) x = leftX;
      else { x = clamp(mid - tw / 2, 0, Math.max(0, pw - tw)); y = ph + 30; }
      tip.style.setProperty('--x', `${x}px`);
      tip.style.setProperty('--y', `${y}px`);
      tip.classList.add('is-on');
    };
    cols.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { const c = e.target.closest('.tcol'); if (c && c !== cur) showCol(c); } });
    cols.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') showCol(null); });
    cols.addEventListener('click', e => { const c = e.target.closest('.tcol'); if (c && lastPointer !== 'mouse') showCol(c === cur ? null : c); });
    addEventListener('resize', () => { if (cur) showCol(null); }); // its place was measured for the old width

    // one focus for the chart and the cleanup above it: a legend item lights its part in every column and the
    // matching numbers up there; a segment, number or receipt up there lights the matching part of every column.
    // Merged leads to the wrong pick too (it was one of the duplicates), kept to the clash (its 9 conflicts were fixed)
    const story = turn.closest('.story'), clean = $$('.cleanup [data-k], .receipts [data-k]', story);
    const TO_CLEAN = { kept: ['kept'], idle: ['off', 'merged', 'archived'], wrong: ['merged'], clash: ['kept'] };
    const FROM_CLEAN = { kept: ['kept', 'clash'], off: ['idle'], merged: ['idle', 'wrong'], archived: ['idle'] };
    const light = parts => {
      if (parts) turn.dataset.hot = parts.join(' '); else delete turn.dataset.hot;
      $$('[data-part]', turn).forEach(el => el.classList.toggle('is-hot', !!parts && parts.includes(el.dataset.part)));
    };
    const hot = p => {
      light(p && [p]);
      story.classList.toggle('is-focus', !!p);
      clean.forEach(el => el.classList.toggle('is-hot', !!p && TO_CLEAN[p].includes(el.dataset.k)));
    };
    $$('.turn__facts [data-part]', turn).forEach(li => {
      li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hot(li.dataset.part); });
      li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hot(null); });
      li.addEventListener('click', () => { if (lastPointer !== 'mouse') hot(li.classList.contains('is-hot') && turn.dataset.hot === li.dataset.part ? null : li.dataset.part); });
    });
    clean.forEach(el => {
      const on = () => light(FROM_CLEAN[el.dataset.k]);
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') on(); });
      el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') light(null); });
      el.addEventListener('focus', on);
      el.addEventListener('blur', () => light(null));
      // touch: the cleanup toggles its own highlight on a tap (its listener runs first); the chart follows it
      el.addEventListener('click', () => { if (lastPointer !== 'mouse') { if (el.classList.contains('is-hot')) on(); else light(null); } });
    });
    addEventListener('pointerdown', e => {
      lastPointer = e.pointerType;
      if (e.pointerType === 'mouse' || e.target.closest('.turn__seg')) return;
      if (cur && !cols.contains(e.target)) showCol(null); // a tap elsewhere clears the tip and the legend
      if (turn.dataset.hot && !e.target.closest('.turn__facts, .cleanup, .receipts')) hot(null);
    }, { passive: true });

    // the card: what Muster takes off in a month at this usage, in dollars and tokens. Per day: the 2,500 extra on
    // every turn, plus one wrong pick and one clash, each loaded once (a cache write) and read for half a session
    const perDay = u => {
      const [turns, sessions] = USE[u], ride = turns / sessions / 2;
      const tokens = PART.idle * turns + (PART.wrong + PART.clash) * (1 + ride); // the clash saves the skill not followed
      const dollars = PART.idle * (turns * READ + sessions * WRITE) + (PART.wrong + PART.clash) * (WRITE + ride * READ);
      return { tokens, dollars };
    };
    const compact = n => n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}k`;
    const monthEl = $('[data-save-month]', turn), yearEl = $('[data-save-year]', turn), tokEl = $('[data-save-tokens]', turn), fineEl = $('[data-save-fine]', turn);
    let shown = perDay('typical').dollars * DAYS, countRaf = 0;
    const setMoney = (u, quiet) => {
      const { tokens, dollars } = perDay(u), to = dollars * DAYS, from = shown, [turns, sessions] = USE[u];
      yearEl.textContent = `$${fmt(Math.round(to * 12))} a year`;
      tokEl.textContent = `${compact(tokens)} fewer tokens sent a day`;
      if (!quiet) live.textContent = `About $${Math.round(to)} a month, $${fmt(Math.round(to * 12))} a year, ${compact(tokens)} fewer tokens sent a day.`;
      fineEl.textContent = `The chart is one bad session; this counts one wrong pick and one clash a day. ${fmt(turns)} turns a day over ${sessions} sessions, ${DAYS} days a month, on an API key at Opus 5.5 prices. Muster’s own daily check isn’t counted.`;
      cancelAnimationFrame(countRaf);
      if (reduced) { shown = to; monthEl.textContent = `$${Math.round(to)}`; return; }
      const t0 = performance.now();
      const step = t => {
        const q = clamp((t - t0) / 420), v = from + (to - from) * (1 - Math.pow(1 - q, 3));
        shown = v; monthEl.textContent = `$${Math.round(v)}`;
        if (q < 1) countRaf = requestAnimationFrame(step);
      };
      countRaf = requestAnimationFrame(step);
    };

    // the two switches are radio groups: click, or the arrow keys move between options. The chart starts on Before;
    // After Muster waits for a click
    const pickers = {
      view: v => {
        after = v === 'after';
        turn.classList.toggle('is-after', after);
        const t = TURNS;
        end.innerHTML = after
          ? `<span class="m-hide">${fmt(stays(t))} tokens · ${fmt(junk(t))} fewer</span><span class="m-only">${fmt(junk(t))} fewer</span>`
          : `<span class="m-hide">${fmt(total(t))} tokens · ${fmt(junk(t))} Muster takes off</span><span class="m-only">${fmt(junk(t))} off</span>`;
        live.textContent = after ? `After Muster: ${fmt(stays(t))} tokens by turn ${t}, ${fmt(junk(t))} fewer.` : `Before: ${fmt(total(t))} tokens by turn ${t}, ${fmt(junk(t))} of them you didn’t need.`;
        if (cur) showCol(cur);
      },
      use: setMoney,
    };
    $$('[data-turn-group]', turn).forEach(group => {
      const btns = $$('[data-turn-pick]', group), run = pickers[group.dataset.turnGroup], hl = $('.turn__seg-hl', group);
      // the white highlight sits under the picked option and slides to the next, as in the join form
      const place = () => {
        const b = btns.find(x => x.getAttribute('aria-checked') === 'true');
        hl.style.width = `${b.offsetWidth}px`; hl.style.height = `${b.offsetHeight}px`;
        hl.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
      };
      // first paint, a font swap or a resize: placed without a slide
      new ResizeObserver(() => { hl.style.transition = 'none'; place(); void hl.offsetWidth; hl.style.transition = ''; }).observe(group);
      const pick = b => {
        if (b.getAttribute('aria-checked') === 'true') return;
        btns.forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
        place();
        run(b.dataset.turnPick);
      };
      btns.forEach((b, i) => {
        b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
        b.addEventListener('click', () => pick(b));
        b.addEventListener('keydown', e => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!d) return;
          e.preventDefault();
          const next = btns[(i + d + btns.length) % btns.length];
          pick(next); next.focus();
        });
      });
    });
    setMoney('typical', true);
  }

  /* ── Try it: one Muster, three ways in ─────────────────────────────────
     A Mac desktop with the CLI in Terminal, the full app in a browser
     (127.0.0.1:55350, served by the Mac app) and the menu bar popover.
     All three read one set of sample data that matches the app shot above:
     98 Claude Code and Codex skills in eight folders (two with subfolders),
     5 new ones waiting to be sorted, and 26 things that need a look.
     Fixes and moves are pretend, but every surface shows them. In the
     popover, views stack like macOS menus: click in, "‹" goes back. */
  const desk = $('[data-desk]');
  if (desk) {
    const pop = $('[data-pop]', desk), view = $('[data-view]', desk), toastEl = $('[data-toast]', desk);
    const badge = $('[data-badge]', desk), toggle = $('[data-pop-toggle]', desk);

    // Folders nest. `extra` = skills the demo doesn't list by name, so the counts match the app shot.
    // Folders only live in Muster: moving a skill never moves its file, so Claude Code still finds it.
    const FOLDERS = [
      { id: 'Admin', label: 'Admin', extra: 0, list: [['ticket-tagger', 'v1.1.0', 31], ['triage', 'v1', 12], ['expense-check', 'v2', 6], ['vendor-email', 'v1', 3], ['okr-draft', 'v1', 0]] },
      { id: 'Code', label: 'Code', extra: 15, list: [['commit-message', 'v3', 40], ['conventional-commits', 'v2', 31], ['incident-review', 'v1', 8], ['flaky-tests', 'v1', 6], ['quick-fix', 'v1', 2]] },
      { id: 'Code/Review', label: 'Review', parent: 'Code', extra: 0, list: [['pr-review', 'v1.1.0', 42], ['code-search', 'v1', 19], ['code-review', 'v1', 5]] },
      { id: 'Design', label: 'Design', extra: 14, list: [['frontend-design', 'v1', 22], ['ui-taste', 'v2', 14], ['brand-fonts', 'v1', 9], ['design-critique', 'v1', 7], ['ui-review', 'v1', 4], ['moodboard', 'v0.3.0', 0], ['icon-audit', 'v0.3.0', 0]] },
      { id: 'Design/Motion', label: 'Motion', parent: 'Design', extra: 0, list: [['animation-polish', 'v2', 11], ['easing-tokens', 'v1', 3]] },
      { id: 'Inbox', label: 'Inbox and meetings', extra: 2, list: [['summarize-thread', 'v1', 27], ['refund-reply', 'v2', 11], ['meeting-notes', 'v1', 9], ['inbox-zero', 'v1', 5], ['apology-email', 'v2', 2]] },
      { id: 'Personal', label: 'Personal', extra: 0, list: [['recipe-scaler', 'v1', 3], ['gift-ideas', 'v1', 2], ['helper', 'v1', 1], ['travel-planner', 'v1', 0]] },
      { id: 'Planning', label: 'Planning', extra: 0, list: [['standup-summary', 'v2', 18], ['my-standup', 'v1', 9], ['weekly-plan', 'v1', 7], ['roadmap-draft', 'v1', 2], ['retro-notes', 'v1', 1]] },
      { id: 'Side', label: 'Side project', extra: 8, list: [['deploy-check', 'v1', 5], ['side-quest', 'v1', 6], ['landing-copy', 'v1', 4], ['notes-helper', 'v1', 3], ['todo-helper', 'v1', 1]] },
      { id: 'Writing', label: 'Writing', extra: 5, list: [['tldr', 'v1', 8], ['copywriting', 'v1', 12], ['translate-de', 'v1', 6], ['translate-es', 'v1', 5], ['postmortem-draft', 'v1', 3]] },
    ];
    // found since the last scan, each with the folder Muster suggests from what the skill does
    const UNSORTED = [['spring-curves', 'v0.2.0', 1, 'Design/Motion'], ['motion-review', 'v1', 1, 'Design/Motion'], ['sql-explain', 'v1', 4, 'Code'], ['ux-copy-review', 'v1', 2, 'Writing'], ['pitch-deck', 'v1', 3, 'Planning']];
    const ROOT = [['find-skills', 'v0.4.0', 6, 'globe'], ['grill-me', 'v1.2.0', 4, 'globe'], ['my-fancy-skill', 'v2', 3, 'doc']];
    const PACK = ['moodboard', 'icon-audit', 'color-story', 'type-scale', 'grid-check', 'spacing-lint', 'logo-brief', 'copy-tone'];
    // skills that live in ~/.agents/skills, where Codex looks; Codex picks them, not Claude
    const CODEX = new Set(['code-review', 'sql-explain', 'flaky-tests', 'quick-fix', 'deploy-check']);
    // skills a tool installed and keeps updated; editing their files is pointless, the next update undoes it
    const INSTALLED = { 'conventional-commits': 'skills.sh', 'ui-taste': 'GitHub', 'find-skills': 'skills.sh', 'grill-me': 'skills.sh', 'motion-review': 'GitHub', 'spring-curves': 'skills.sh' };

    // every skill: name → { v, runs, folder, unsorted?, suggest? }
    const SKILLS = new Map(), FOLDER = new Map(FOLDERS.map(f => [f.id, f]));
    FOLDERS.forEach(f => { f.skills = f.list.map(([n, v, runs]) => { SKILLS.set(n, { v, runs, folder: f.id }); return n; }); });
    PACK.forEach(n => SKILLS.has(n) || SKILLS.set(n, { v: 'v0.3.0', runs: 0, folder: 'Design' }));
    ROOT.forEach(([n, v, runs, ico]) => SKILLS.set(n, { v, runs, folder: null, ico }));
    UNSORTED.forEach(([n, v, runs, suggest]) => SKILLS.set(n, { v, runs, folder: null, unsorted: true, suggest }));
    // a copy of the starting point, for "Start over"
    const initial = { folders: FOLDERS.map(f => ({ ...f, skills: [...f.skills] })), skills: [...SKILLS].map(([n, x]) => [n, { ...x }]) };
    const restore = () => {
      FOLDERS.splice(0, FOLDERS.length, ...initial.folders.map(f => ({ ...f, skills: [...f.skills] })));
      FOLDER.clear(); FOLDERS.forEach(f => FOLDER.set(f.id, f));
      SKILLS.clear(); initial.skills.forEach(([n, x]) => SKILLS.set(n, { ...x }));
      fixed.clear();
    };
    const kids = id => FOLDERS.filter(f => (f.parent || null) === id);
    const count = id => { const f = FOLDER.get(id); return f.skills.length + f.extra + kids(id).reduce((t, k) => t + count(k.id), 0); };
    const crumb = id => { const f = FOLDER.get(id); return (f.parent ? `${crumb(f.parent)} › ` : '') + f.label; };
    const unsorted = () => [...SKILLS].filter(([, x]) => x.unsorted).map(([n]) => n);
    const moveSkill = (n, to) => {
      const x = SKILLS.get(n);
      if (x.folder) { const f = FOLDER.get(x.folder); f.skills = f.skills.filter(k => k !== n); }
      x.folder = to; x.unsorted = false; FOLDER.get(to).skills.push(n);
    };
    const addFolder = (parent, name) => {
      const label = name.replace(/[<>&"'/\\]/g, '').trim().slice(0, 24) || 'New folder';
      let id = `${parent}/${label}`, k = 2;
      while (FOLDER.has(id)) id = `${parent}/${label} ${k++}`;
      const f = { id, label: id.split('/').pop(), parent, extra: 0, skills: [] };
      FOLDERS.push(f); FOLDER.set(id, f);
      return f;
    };
    const where = n => {
      const x = SKILLS.get(n);
      if (PACK.includes(n)) return 'plugin: design-pack';
      if (CODEX.has(n)) return `~/.agents/skills/${n}`;
      if (x?.folder === 'Side') return `side-project/.claude/skills/${n}`;
      return `~/.claude/skills/${n}`;
    };

    const VAGUE = [['todo-helper', 'Helps with stuff.'], ['helper', 'A helpful skill.'], ['quick-fix', 'Fixes things quickly.'], ['notes-helper', 'Notes.'],
      ['side-quest', 'For the side project.'], ['my-fancy-skill', 'My fancy skill.'], ['landing-copy', 'Copy.'], ['deploy-check', 'Checks.']];

    // the top of each SKILL.md, for the preview; anything not listed shows its description only
    const MD = {
      'commit-message': ['Writes the commit message for staged changes.', ['# Commit messages', 'Write the summary in plain English.', 'Never use a type prefix.', 'Wrap the body at 72 characters.']],
      'conventional-commits': ['Formats commits as Conventional Commits. Use when writing a commit message.', ['# Conventional commits', 'Keep the subject under 72 characters.', 'Start with a type: feat:, fix: or chore:', 'Add a scope when one package changed.']],
      'brand-fonts': ['Applies our brand typography to headings and marketing pages.', ['# Brand fonts', 'Set every heading in the brand typeface.', 'Never fall back to Inter.']],
      'ui-taste': ['Opinionated defaults for clean, neutral product UI.', ['# UI taste', 'Keep interfaces neutral.', 'Use Inter for all text, headings included.', 'One accent colour per screen.']],
      'code-review': ['Reviews a diff for bugs, tests and naming.', ['# Code review', 'Read the diff top to bottom before commenting.', 'Flag missing tests first.']],
      'pr-review': ['Reviews a pull request for bugs, tests and naming. Use when asked to review a PR.', ['# PR review', 'Read the diff top to bottom before commenting.', 'Flag missing tests first.', 'Suggest, don’t rewrite.']],
      'code-search': ['Finds where something is defined or used across the repo.', ['# Code search', 'Start with ripgrep, then open the top three hits.']],
      'frontend-design': ['Builds distinctive, production-grade frontend interfaces.', ['# Frontend design', 'Pick an aesthetic direction before writing code.', 'Avoid generic, templated layouts.']],
      'standup-summary': ['Turns yesterday’s commits and messages into a standup update.', ['# Standup summary', 'Read yesterday’s commits and messages.', 'Write three lines: done, doing, next.']],
      'my-standup': ['My standup format.', ['# My standup', 'Read yesterday’s commits and messages.', 'Write a three-line update.', 'Add a Blockers line if anything is stuck.']],
      'animation-polish': ['Reviews UI motion for timing, easing and interruptions.', ['# Animation polish', 'Enter with ease-out; exit faster than you enter.', 'Keep UI feedback under 300ms.']],
      'easing-tokens': ['Our easing curves and durations as tokens.', ['# Easing tokens', '--ease-out: cubic-bezier(.23, 1, .32, 1)', '--dur-fast: 150ms']],
      'spring-curves': ['Spring presets for gesture-driven animation.', ['# Spring curves', 'Sheets: stiffness 400, damping 30.', 'Never spring a fade.']],
      'motion-review': ['Critiques an animation and suggests fixes.', ['# Motion review', 'Ask what the motion is for before tuning it.']],
      'sql-explain': ['Explains a slow SQL query plan in plain words.', ['# SQL explain', 'Run EXPLAIN ANALYZE, then walk the plan bottom-up.']],
      'ux-copy-review': ['Tightens interface copy: buttons, errors, empty states.', ['# UX copy review', 'Buttons say what happens.', 'Errors say what to do next.']],
      'pitch-deck': ['Outlines a pitch deck from a product brief.', ['# Pitch deck', 'Problem, insight, product, traction, ask.', 'One idea per slide.']],
      'travel-planner': ['Plans a trip itinerary with bookings and buffers.', ['# Travel planner', 'Leave a free half-day after every long flight.']],
      'summarize-thread': ['Summarizes a long chat thread into bullet points.', ['# Summarize thread', 'Lead with the decision, then open questions.']],
      'find-skills': ['Finds and installs skills from skills.sh.', ['# Find skills', 'Search skills.sh before writing a new skill.']],
      'grill-me': ['Asks hard questions about a plan until the gaps show.', ['# Grill me', 'Ask one question at a time.', 'Don’t accept “it depends”.']],
      'ticket-tagger': ['Labels incoming support tickets by area and urgency.', ['# Ticket tagger', 'Tag the area first, then urgency from p1 to p3.']],
      'triage': ['Triages incoming tickets and assigns an owner.', ['# Triage', 'Label by area and urgency.', 'Assign an owner from the on-call list.']],
    };
    const VAGUE_DESC = Object.fromEntries(VAGUE);
    const mdOf = n => MD[n] || [VAGUE_DESC[n] || `${n.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())}.`, []];
    const preview = n => {
      const [d, body] = mdOf(n);
      return `<div class="pv-md"><p class="pv-md__file"><span>SKILL.md</span><button type="button" class="pv-link" data-go="toast:edit">Open</button></p><pre><span class="pv-md__fm">---\nname: ${n}\ndescription: ${d}\n---</span>${body.length ? `\n${body.join('\n')}` : ''}</pre></div>`;
    };

    // kind: conflict | duplicate | unused | vague; w = how many "need a look" it accounts for.
    // tok = how the fix changes what every turn carries (the skill listing, in tokens): a merge or an archive
    // takes one description out, design-pack takes 8, and clearer descriptions run longer. Tiebreak lines
    // (about 25 tokens in CLAUDE.md) and in-place updates are too small to show.
    // Fixes follow where a skill came from: your own skills get edited or merged; skills a tool
    // installed get a tiebreak line in ~/.claude/CLAUDE.md instead, because an update would undo an edit.
    const ISSUES = [
      { id: 'c1', kind: 'conflict', w: 1, skills: ['commit-message', 'conventional-commits'], keep: 'conventional-commits', trigger: 'commit message',
        title: '<code>commit-message</code> × <code>conventional-commits</code>',
        text: 'Both load on their own when you ask for a commit message, and they give opposite rules. Claude can only follow one.',
        lines: { 'conventional-commits': 'Keep the subject under 72 characters. <mark class="hl hl--g">Start with a type: feat:, fix: or chore:</mark>', 'commit-message': 'Write the summary in plain English. <mark class="hl hl--r">Never use a type prefix.</mark>' },
        tiebreak: 'When commit-message and conventional-commits disagree on type prefixes, follow conventional-commits.',
        how: 'conventional-commits comes from skills.sh, so editing it is pointless: the next update undoes it. A tiebreak line goes in your CLAUDE.md instead.',
        fix: 'Add the tiebreak', copy: 'the tiebreak line',
        done: 'Added to <code>~/.claude/CLAUDE.md</code>. Next time both match, Claude follows <code>conventional-commits</code>.' },
      { id: 'c2', kind: 'conflict', w: 1, skills: ['brand-fonts', 'ui-taste'], trigger: 'headings',
        title: '<code>brand-fonts</code> × <code>ui-taste</code>',
        text: 'Both load on their own for anything with headings, and they disagree about the typeface.',
        lines: { 'brand-fonts': 'Set every heading in the brand typeface. <mark class="hl hl--r">Never fall back to Inter.</mark>', 'ui-taste': 'Keep interfaces neutral. <mark class="hl hl--r">Use Inter for all text, headings included.</mark>' },
        tiebreak: 'When brand-fonts and ui-taste disagree on typefaces, follow brand-fonts on marketing pages and ui-taste on product screens.',
        how: 'ui-taste is installed from GitHub, so the tiebreak goes in your CLAUDE.md. Or edit brand-fonts, which is yours.',
        fix: 'Add the tiebreak', copy: 'the tiebreak line',
        done: 'Added to <code>~/.claude/CLAUDE.md</code>. Marketing pages get the brand typeface, product screens get Inter.' },
      { id: 'd1', tok: -100, kind: 'duplicate', w: 1, skills: ['standup-summary', 'my-standup'], sim: 93,
        same: ['Read yesterday’s commits and messages', 'Write a three-line update'], diff: ['my-standup adds a Blockers line'],
        how: 'Both are yours, so they can simply become one.',
        fix: 'Merge into standup-summary', copy: 'the merge as a diff',
        done: 'Merged. The Blockers line from <code>my-standup</code> now lives in <code>standup-summary</code>.' },
      { id: 'd2', tok: -100, kind: 'duplicate', w: 1, skills: ['translate-de', 'translate-es'], sim: 91,
        same: ['Same instructions, word for word'], diff: ['Only the target language and glossary change'],
        fix: 'Merge into one translate skill', copy: 'the merge as a diff',
        done: 'Merged into <code>translate</code>, with both glossaries.' },
      { id: 'd3', tok: -100, kind: 'duplicate', w: 1, skills: ['incident-review', 'postmortem-draft'], sim: 88,
        same: ['Write a blameless timeline', 'End with follow-up actions'], diff: ['postmortem-draft also drafts the announcement'],
        fix: 'Merge into incident-review', copy: 'the merge as a diff',
        done: 'Merged. <code>incident-review</code> now drafts the announcement too.' },
      { id: 'd4', tok: -100, kind: 'duplicate', w: 1, skills: ['ticket-tagger', 'triage'], sim: 84,
        same: ['Label incoming tickets by area and urgency'], diff: ['triage also assigns an owner'],
        fix: 'Merge into ticket-tagger', copy: 'the merge as a diff',
        done: 'Merged. <code>ticket-tagger</code> now assigns an owner too.' },
      { id: 'd5', kind: 'duplicate', w: 1, skills: ['meeting-notes', 'summarize-thread'], sim: 82,
        same: ['Turn a long conversation into bullet points'], diff: ['meeting-notes adds owners and dates'],
        fix: 'Sharpen both descriptions', copy: 'the new descriptions',
        done: 'Done. <code>meeting-notes</code> is for calls, <code>summarize-thread</code> for chat threads.' },
      { id: 'd6', kind: 'duplicate', w: 1, skills: ['pr-review', 'code-review'], sim: 90,
        same: ['Review a diff for bugs, tests and naming', 'Flag missing tests first'], diff: ['code-review is the copy you made for Codex', 'It missed your last edit: “Suggest, don’t rewrite.”'],
        how: 'One copy for Claude Code, one for Codex. Since then, only one got your edits.',
        fix: 'Bring code-review up to date', copy: 'the update as a diff',
        done: 'Updated. Codex’s <code>code-review</code> now has the same rules as <code>pr-review</code>.' },
      { id: 'u1', tok: -800, kind: 'unused', w: 8, skills: PACK, label: '8 skills from <code>design-pack</code>',
        text: 'You installed the plugin for one job. None of its 8 skills ran in 30 days, yet their descriptions add about 800 tokens to every turn.',
        how: 'It’s a plugin, so one switch turns off all 8.',
        fix: 'Disable design-pack', copy: 'the disable command',
        done: 'Disabled <code>design-pack</code>. Turn it back on any time.' },
      { id: 'u2', tok: -100, kind: 'unused', w: 1, skills: ['travel-planner'], label: '<code>travel-planner</code>',
        text: 'Last ran 64 days ago. It’s yours, so it can be archived rather than deleted.',
        fix: 'Archive travel-planner', copy: 'mv ~/.claude/skills/travel-planner ~/.claude/skills-archive/',
        done: 'Archived. It’s in <code>~/.claude/skills-archive</code> if you want it back.' },
      { id: 'u3', tok: -100, kind: 'unused', w: 1, skills: ['okr-draft'], label: '<code>okr-draft</code>',
        text: 'Last ran 41 days ago. Planning season might bring it back.',
        fix: 'Archive okr-draft', copy: 'mv ~/.claude/skills/okr-draft ~/.claude/skills-archive/',
        done: 'Archived. It’s in <code>~/.claude/skills-archive</code> if you want it back.' },
      { id: 'v1', tok: 320, kind: 'vague', w: 8, skills: VAGUE.map(([n]) => n), label: '8 skills with vague descriptions',
        text: 'Claude picks a skill by its description. These say almost nothing, so Claude can’t tell when to use them.',
        fix: 'Draft better descriptions', copy: 'the drafts',
        done: 'Drafted 8 new descriptions. You review each one before it’s saved.' },
    ];
    const KIND = { conflict: ['Conflicts', 'Conflict', 'red'], duplicate: ['Duplicates', 'Duplicate', 'amber'], unused: ['Unused', 'Unused', 'grey'], vague: ['Vague descriptions', 'Vague description', 'amber'] };
    const RANK = { red: 3, amber: 2, grey: 1 };
    const byId = Object.fromEntries(ISSUES.map(i => [i.id, i]));
    const fixed = new Set();
    let popFlash = false; // set for one render, when the menu bar opens on a count that changed elsewhere
    let justFixed = null; // the issue just fixed: its "done" note pops in once, on that render only
    const open = () => ISSUES.filter(i => !fixed.has(i.id));
    const remaining = () => open().reduce((s, i) => s + i.w, 0);
    // what the 89 Claude Code descriptions add to every turn (about 100 tokens each, Anthropic's figure; Codex's 9
    // are its own list), before and after the fixes so far, to the nearest hundred
    const LISTING = 8900;
    const listing = () => Math.round(ISSUES.reduce((s, i) => s + (fixed.has(i.id) ? i.tok || 0 : 0), LISTING) / 100) * 100;
    const fmtTok = n => n.toLocaleString('en-US');
    const tokNote = i => !i.tok ? '' : i.tok < 0
      ? ` Every turn now carries about ${fmtTok(-i.tok)} fewer tokens.`
      : ` Clearer descriptions run longer: about ${fmtTok(i.tok)} more tokens on every turn, and Claude can tell when to use them.`;
    const issuesFor = n => open().filter(i => i.skills.includes(n));
    const issueLabel = i => i.label || i.title || i.skills.map(s => `<code>${s}</code>`).join(' × ');

    // dots for a folder or a skill: colour of the worst open issue, two dots if more than one
    const marks = list => {
      if (!list.length) return '';
      const c = list.map(i => KIND[i.kind][2]).sort((a, b) => RANK[b] - RANK[a])[0];
      return list.length > 1 ? `<span class="pair pair--${c}"></span>` : `<b class="dot dot--${c}"></b>`;
    };
    const folderIssues = id => open().filter(i => i.skills.some(n => { const f = SKILLS.get(n)?.folder; return f === id || f?.startsWith(`${id}/`); }));

    const item = (go, inner, extra = '') => `<li><button type="button" class="pv-item ${extra}" data-go="${go}">${inner}</button></li>`;
    const skillRow = (n, go = `skill:${n}`) => {
      const s = SKILLS.get(n);
      return item(go, `<span class="pv-item__name"><code>${n}</code><small>${s.v}</small></span>${marks(issuesFor(n))}<em>${s.runs}</em>`);
    };
    const navBar = (label, right = '') => `<div class="pv-nav"><button type="button" class="pv-back" data-back>${label}</button>${right ? `<small>${right}</small>` : ''}</div>`;

    const folderRow = f => item(`folder:${f.id}`, `<i class="ico ico--folder"></i><span class="pv-item__name">${f.label}</span>${marks(folderIssues(f.id))}<em>${count(f.id)}</em><i class="chev"></i>`);
    const homeList = () => {
      const waiting = unsorted().length;
      return (waiting ? item('unsorted', `<i class="ico ico--tray"></i><span class="pv-item__name">Unsorted</span><span class="pv-new">${waiting} new</span><i class="chev"></i>`) : '') +
        kids(null).map(folderRow).join('') +
        [...SKILLS].filter(([, x]) => !x.folder && !x.unsorted).map(([n, x]) => item(`skill:${n}`, `<i class="ico ico--${x.ico || 'doc'}"></i><span class="pv-item__name">${n}</span>${marks(issuesFor(n))}`)).join('');
    };

    // what an issue is about and how to fix it: the popover and the browser show the same thing
    const issueDetail = i => {
      let body = '';
      if (i.kind === 'conflict') {
        body = `<p class="pv-trigger">Both load for “${i.trigger}”</p>` +
          i.skills.map(n => `<div class="pv-block${i.keep === n ? ' is-keep' : ''}"><p class="pv-block__name"><code>${n}</code><small>${INSTALLED[n] ? `from ${INSTALLED[n]}` : 'yours'}</small></p><p class="pv-block__line">${i.lines[n]}</p></div>`).join('') +
          `<div class="pv-block pv-block--fix"><p class="pv-block__name"><small>Adds to ~/.claude/CLAUDE.md</small></p><p class="pv-block__line">${i.tiebreak}</p></div>`;
      } else if (i.kind === 'duplicate') {
        body = `<div class="pv-block"><p class="pv-block__name"><small>The same</small></p><ul>${i.same.map(x => `<li>${x}</li>`).join('')}</ul></div>
                <div class="pv-block"><p class="pv-block__name"><small>Different</small></p><ul>${i.diff.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
      } else if (i.kind === 'unused') {
        body = i.skills.length > 1 ? `<div class="pv-block"><ul>${i.skills.map(n => `<li><code>${n}</code></li>`).join('')}</ul></div>` : '';
      } else {
        body = `<div class="pv-block"><ul>${VAGUE.map(([n, d]) => `<li><code>${n}</code>: “${d}”</li>`).join('')}</ul></div>`;
      }
      const actions = fixed.has(i.id)
        ? `<p class="pv-done${justFixed === i.id ? ' is-new' : ''}"><i class="ok-ico"></i><span>${i.done}${tokNote(i)}</span></p>`
        : `${i.how ? `<p class="pv-note">${i.how}</p>` : ''}<div class="pv-actions"><button type="button" class="pv-btn pv-btn--dark" data-fix="${i.id}">${i.fix}</button><button type="button" class="pv-btn" data-copy="${i.id}">Copy instead</button></div>`;
      return body + actions;
    };

    const VIEWS = {
      home() {
        const n = remaining();
        const status = n ? `<b class="dot dot--amber"></b>${n} need a look` : '<b class="dot dot--green"></b>All clear';
        return `
          <div class="pv-head">
            <p class="pv-big"><strong>32</strong><span>runs today</span></p>
            <div class="pv-status"><button type="button" data-go="needs"${popFlash ? ' class="is-flash"' : ''}>${status}</button><small>Scanned 3 minutes ago <i class="pv-sync"></i></small></div>
          </div>
          <div class="pv-week" aria-label="Runs over the last five days">
            <span style="--v:.94">Thu<i></i><b>30</b></span><span style="--v:.78">Fri<i></i><b>25</b></span><span style="--v:.22">Sat<i></i><b>7</b></span><span style="--v:.28">Sun<i></i><b>9</b></span><span style="--v:1" class="is-today">Today<i></i><b>32</b></span>
          </div>
          <label class="pv-search"><i class="ico ico--search"></i><input type="search" placeholder="Search 98 skills" aria-label="Search skills" data-search /></label>
          <ul class="pv-list" data-results>${homeList()}</ul>
          <ul class="pv-list pv-sep">
            ${item('most', '<span class="pv-item__name">Most used, 30 days</span><i class="chev"></i>', 'is-muted')}
            ${item('needs', `<span class="pv-item__name">Needs a look</span><em>${n || ''}</em><i class="chev"></i>`, 'is-muted')}
            ${item('changed', '<span class="pv-item__name">Changed lately</span><i class="chev"></i>', 'is-muted')}
          </ul>
          <ul class="pv-list pv-sep">
            ${item('toast:new', '<span class="pv-item__name">New skill…</span>')}
            ${item('web:overview', '<span class="pv-item__name">Open Muster</span><small class="pv-hint">in your browser</small>')}
          </ul>`;
      },
      folder(id) {
        const f = FOLDER.get(id), sub = kids(id);
        return `${navBar(f.parent ? FOLDER.get(f.parent).label : 'Muster', `${count(id)} skills`)}
          <p class="pv-title">${f.label}</p>
          <p class="pv-sub">${f.parent ? crumb(id) : 'Runs in the last 30 days'}</p>
          <ul class="pv-list">${sub.map(folderRow).join('')}${f.skills.map(n => skillRow(n)).join('')}
          ${f.extra > 0 ? `<li><button type="button" class="pv-item is-muted" data-go="web:folder:${id}"><span class="pv-item__name">${f.extra} more in the app</span></button></li>` : ''}
          ${!f.skills.length && !sub.length ? '<li class="pv-empty">Empty for now. Open a skill and pick “Move…” to put it here.</li>' : ''}</ul>
          <ul class="pv-list pv-sep"><li data-slot><button type="button" class="pv-item is-muted" data-newfolder="${id}"><i class="ico ico--plus"></i><span class="pv-item__name">New folder inside ${f.label}</span></button></li></ul>`;
      },
      skill(n) {
        const x = SKILLS.get(n), list = issuesFor(n), auto = Math.round(x.runs * .7), codex = CODEX.has(n);
        const home = x.unsorted ? '<span class="pv-new">Unsorted</span>' : x.folder ? crumb(x.folder) : 'Top level';
        return `${navBar('Back')}
          <p class="pv-title"><code>${n}</code></p>
          <p class="pv-sub">${x.v} · ${x.runs} runs in 30 days${x.runs ? ` (${auto} picked by ${codex ? 'Codex' : 'Claude'}, ${x.runs - auto} ${codex ? `typed as $${n}` : `typed as /${n}`})` : ''}</p>
          <div class="pv-row"><span class="pv-row__label">Folder</span><span class="pv-row__val">${home}</span><button type="button" class="pv-btn pv-btn--sm" data-go="move:${n}">Move…</button></div>
          ${preview(n)}
          <div class="pv-block"><p class="pv-block__name"><small>${INSTALLED[n] ? `Installed from ${INSTALLED[n]}` : PACK.includes(n) ? 'Came with a plugin' : codex ? 'Yours, for Codex' : 'Yours'}</small></p><p class="pv-block__line">${where(n)}</p></div>
          ${list.length
            ? `<p class="pv-group"><span>Needs a look</span></p><ul class="pv-list">${list.map(i => item(`issue:${i.id}`, `<b class="dot dot--${KIND[i.kind][2]}"></b><span class="pv-item__name">${KIND[i.kind][1]}</span><i class="chev"></i>`)).join('')}</ul>`
            : '<p class="pv-done"><i class="ok-ico"></i>Nothing to fix here.</p>'}`;
      },
      move(n) {
        const x = SKILLS.get(n), rows = [];
        const walk = (parent, depth) => kids(parent).forEach(f => { rows.push([f, depth]); walk(f.id, depth + 1); });
        walk(null, 0);
        return `${navBar('Back')}<p class="pv-title">Move <code>${n}</code></p>
          <p class="pv-sub">Only its folder in Muster changes. The file stays where ${CODEX.has(n) ? 'Codex' : 'Claude Code'} finds it.</p>
          <ul class="pv-list">${rows.map(([f, d]) => `<li><button type="button" class="pv-item" style="padding-left:${6 + d * 18}px" data-move="${n}" data-to="${f.id}"${x.folder === f.id ? ' disabled' : ''}><i class="ico ico--folder"></i><span class="pv-item__name">${f.label}</span>${x.suggest === f.id && x.unsorted ? '<span class="pv-new">Suggested</span>' : ''}${x.folder === f.id ? '<i class="ok-ico"></i>' : ''}</button></li>`).join('')}</ul>`;
      },
      unsorted() {
        const list = unsorted();
        return `${navBar('Muster')}<p class="pv-title">Unsorted</p>
          <p class="pv-sub">${list.length ? 'Found since yesterday. Muster suggests a folder from what each skill does.' : 'Everything has a home.'}</p>
          <ul class="pv-list">${list.map(n => `<li class="pv-sort"><button type="button" class="pv-item" data-go="skill:${n}"><span class="pv-item__name"><code>${n}</code></span></button><button type="button" class="pv-chip" data-move="${n}" data-to="${SKILLS.get(n).suggest}" aria-label="Move ${n} to ${crumb(SKILLS.get(n).suggest)}">${crumb(SKILLS.get(n).suggest)}</button></li>`).join('')}</ul>
          ${list.length > 1 ? '<div class="pv-actions"><button type="button" class="pv-btn pv-btn--dark" data-sortall>Accept all suggestions</button></div>' : ''}
          ${list.length ? '<p class="pv-note">Click a suggestion to accept it, or open a skill to pick another folder.</p>' : '<p class="pv-done"><i class="ok-ico"></i>All sorted. Folders live in Muster, so nothing moved on disk.</p>'}`;
      },
      needs() {
        const n = remaining();
        const groups = ['conflict', 'duplicate', 'unused', 'vague'].map(k => {
          const list = ISSUES.filter(i => i.kind === k);
          const left = list.filter(i => !fixed.has(i.id)).reduce((s, i) => s + i.w, 0);
          return `<p class="pv-group"><span>${KIND[k][0]}</span><span>${left || '✓'}</span></p><ul class="pv-list">${list.map(i => fixed.has(i.id)
            ? item(`issue:${i.id}`, `<i class="ok-ico"></i><span class="pv-item__name">${issueLabel(i)}</span>`, 'is-fixed is-wrap')
            : item(`issue:${i.id}`, `<b class="dot dot--${KIND[k][2]}"></b><span class="pv-item__name">${issueLabel(i)}</span>${i.sim ? `<em>${i.sim}%</em>` : ''}<i class="chev"></i>`, 'is-wrap')).join('')}</ul>`;
        }).join('');
        return `${navBar('Muster')}<p class="pv-title">Needs a look</p><p class="pv-sub">${n ? `${n} things from today’s check` : 'All clear. Nice.'}</p>${groups}`;
      },
      issue(id) {
        const i = byId[id], [, one, c] = KIND[i.kind];
        return `${navBar('Back', i.sim ? `${i.sim}% similar` : '')}
          <p class="pv-kicker"><b class="dot dot--${c}"></b>${one}</p>
          <p class="pv-title">${issueLabel(i)}</p>
          ${i.text ? `<p class="pv-text">${i.text}</p>` : '<div style="height:8px"></div>'}
          ${issueDetail(i)}`;
      },
      most() {
        const top = [...SKILLS].sort((a, b) => b[1].runs - a[1].runs).slice(0, 7), max = top[0][1].runs;
        return `${navBar('Muster')}<p class="pv-title">Most used</p><p class="pv-sub">Last 30 days</p>
          <ul class="pv-list">${top.map(([n, s]) => item(`skill:${n}`, `<span class="pv-item__name"><code>${n}</code></span><span class="pv-bar"><i style="--v:${(s.runs / max).toFixed(2)}"></i></span><em>${s.runs}</em>`)).join('')}</ul>`;
      },
      changed() {
        const rows = [['commit-message', 'v3 · you edited it, 2 days ago'], ['grill-me', 'v1.2.0 · updated from skills.sh, 4 days ago'], ['pr-review', 'v1.1.0 · you edited it, last week'], ['find-skills', 'v0.4.0 · installed last week']];
        return `${navBar('Muster')}<p class="pv-title">Changed lately</p><p class="pv-sub">Edits, updates and installs</p>
          <ul class="pv-list">${rows.map(([n, t]) => item(`skill:${n}`, `<span class="pv-item__name" style="flex-direction:column;align-items:flex-start;gap:2px"><code>${n}</code><small>${t}</small></span><i class="chev"></i>`)).join('')}</ul>`;
      },
    };

    const TOASTS = {
      new: 'Creates a new SKILL.md in the folder you pick.',
      edit: 'Opens the SKILL.md in your editor.',
      add: 'Opens Add skills: starter packs and packages to install.',
    };
    let toastT;
    const toast = html => {
      // a second toast while one is up: the pill dips and settles, so the new text doesn't just snap in
      if (!toastEl.hidden && !toastEl.classList.contains('is-leaving')) toastEl.animate(reduced
        ? [{ opacity: .5 }, { opacity: 1 }]
        : [{ opacity: .5, transform: 'translate(-50%, 3px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 150, easing: 'cubic-bezier(.23, 1, .32, 1)' });
      toastEl.classList.remove('is-leaving');
      toastEl.innerHTML = html; toastEl.hidden = false;
      clearTimeout(toastT); toastT = setTimeout(() => { toastEl.classList.add('is-leaving'); }, 3200);
    };
    toastEl.addEventListener('animationend', () => {
      if (toastEl.classList.contains('is-leaving')) { toastEl.hidden = true; toastEl.classList.remove('is-leaving'); }
    });

    // ── shared state changes: the same three moves, whichever surface they come from ──
    const FROM = { menu: 'the menu bar', web: 'the browser', term: 'Terminal' };
    const others = from => { const t = Object.keys(FROM).filter(k => k !== from).map(k => FROM[k]).join(' and '); return t[0].toUpperCase() + t.slice(1); };
    const doMove = (n, to) => { moveSkill(n, to); return `Moved to ${crumb(to)}. The file stays where ${CODEX.has(n) ? 'Codex' : 'Claude Code'} finds it.`; };
    const doSortAll = () => { const list = unsorted(); list.forEach(n => moveSkill(n, SKILLS.get(n).suggest)); return `Sorted ${list.length} skills into folders. Nothing moved on disk.`; };
    const doFix = (id, from) => { fixed.add(id); justFixed = id; return `Fixed in ${FROM[from]}. ${others(from)} show it too.`; };
    const copyMsg = id => { const c = byId[id].copy; return c.startsWith('mv ') ? `In the app, this copies <code>${c}</code> so you can run it yourself.` : `In the app, this copies ${c} so you can apply it yourself.`; };
    // after any change, every surface redraws; the menu bar badge pops when the change came from elsewhere
    const changed = (from, msg, kb = false) => {
      dirty = true;
      seen[scene] = remaining();
      webFlash = from !== 'web' && !reduced;
      renderWeb();
      webFlash = false;
      render(from === 'menu' && kb);
      if (from !== 'menu' && !reduced) { toggle.classList.remove('is-bump'); void toggle.offsetWidth; toggle.classList.add('is-bump'); }
      if (msg) toast(msg);
    };

    // ── the showcase: one surface on screen at a time. Picking another minimises the window into the Dock
    // and brings the next one out, or drops the menu bar popover onto an empty desktop. The menu bar
    // (and its badge) stays put the whole time: that's the thread between the three. ──
    const wins = { term: $('[data-win="term"]', desk), web: $('[data-win="web"]', desk) };
    const APP = { term: 'Terminal', web: 'Safari' };
    const frontApp = $('[data-front-app]', desk), dockOf = k => $(`[data-dock="${k}"]`, desk);
    const sceneBtns = $$('[data-scene]'), resetBtn = $('[data-reset]'), badgeMini = $('[data-badge-mini]');
    const phone = matchMedia('(max-width: 809px)');
    let still = false; // a deep link opens straight on its scene: no minimise, no bounce
    const animated = () => !reduced && !phone.matches && !still;
    const launched = new Set(['web']); // Safari is already running; Terminal launches the first time it's picked
    let scene = 'web', want = 'web', sceneQ = Promise.resolve(), dirty = false;
    const MENUS = { Finder: 'File Edit View Go Window Help', Safari: 'File Edit View History Bookmarks Window Help', Terminal: 'Shell Edit View Window Help' };
    const menusEl = $('[data-menus]', desk);
    const dockState = () => {
      Object.keys(wins).forEach(k => dockOf(k).classList.toggle('is-running', launched.has(k)));
      const open = Object.keys(wins).find(k => !wins[k].hidden), name = open ? APP[open] : 'Finder';
      if (frontApp.textContent !== name) { frontApp.textContent = name; menusEl.innerHTML = MENUS[name].split(' ').map(m => `<span>${m}</span>`).join(''); }
    };
    // the window scales from (or to) the middle of its Dock icon
    const genie = (k, out) => {
      const w = wins[k];
      if (!animated() || !w.animate) return Promise.resolve();
      const d = dockOf(k).getBoundingClientRect(), r = w.getBoundingClientRect();
      w.style.transformOrigin = `${d.left + d.width / 2 - r.left}px ${d.top + d.height / 2 - r.top}px`;
      const frames = [{ transform: 'scale(.04)', opacity: 0 }, { transform: 'none', opacity: 1 }];
      return w.animate(out ? frames.reverse() : frames, out
        ? { duration: 200, easing: 'cubic-bezier(.23, 1, .32, 1)' } // ease-out: the next window waits on this, so no slow start
        : { duration: 420, easing: 'cubic-bezier(.23, 1, .32, 1)' }).finished;
    };
    const bounce = k => { const d = dockOf(k); d.classList.remove('is-bouncing'); void d.offsetWidth; d.classList.add('is-bouncing'); };
    const showWin = async k => {
      if (!wins[k].hidden) return;
      if (!launched.has(k)) { launched.add(k); if (animated()) { bounce(k); dockState(); await wait(300); } }
      wins[k].hidden = false; dockState();
      await genie(k, false);
    };
    const hideWin = async k => { if (wins[k].hidden) return; await genie(k, true); wins[k].hidden = true; dockState(); updateCoach(); };
    // what each scene last showed for "need a look", so arriving after a change elsewhere can flash it
    const seen = { web: 26, pop: 26, term: 26 };
    const apply = async k => {
      scene = k;
      const n = remaining(), stale = seen[k] !== n && !reduced;
      seen[k] = n;
      if (stale && k === 'web') { webFlash = true; renderWeb(); webFlash = false; }
      if (stale && k === 'pop') { stack = ['home']; popFlash = true; render(); popFlash = false; }
      sceneBtns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === k)));
      if (k !== 'pop') setOpen(false);
      await Promise.all(Object.keys(wins).filter(x => x !== k).map(hideWin));
      if (k === 'pop') setOpen(true); else await showWin(k);
      updateCoach();
      // the first visit to Terminal runs a check, so the window opens on something
      if (k === 'term' && !checkedOnce) type(['muster check']);
    };
    // clicks can come faster than the animations: only the latest pick plays
    const setScene = k => { want = k; return (sceneQ = sceneQ.then(() => (want === k ? apply(k) : null))); };

    sceneBtns.forEach(b => b.addEventListener('click', () => setScene(b.dataset.scene)));
    // arrow keys move between the cards, like any tab list
    $('[data-scenes]').addEventListener('keydown', e => {
      const i = sceneBtns.indexOf(document.activeElement), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (i < 0 || !d) return;
      e.preventDefault();
      const next = sceneBtns[(i + d + sceneBtns.length) % sceneBtns.length];
      next.focus(); setScene(next.dataset.scene);
    });
    desk.addEventListener('click', e => {
      const b = e.target.closest('[data-close], [data-dock]');
      if (!b) return;
      if (b.dataset.dock) setScene(b.dataset.dock);
      else hideWin(b.closest('[data-win]').dataset.win);
    });
    // like a real menu bar extra: a click anywhere else on the desktop closes the popover
    desk.addEventListener('pointerdown', e => {
      if (phone.matches || pop.classList.contains('is-closed') || pop.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });
    $$('[data-drag]', desk).forEach(bar => bar.addEventListener('pointerdown', e => {
      if (phone.matches || e.button !== 0 || e.target.closest('button')) return;
      const w = bar.closest('[data-win]'), d = desk.getBoundingClientRect(), r = w.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      const move = ev => {
        w.style.left = `${clamp(ev.clientX - d.left - dx, 80 - r.width, d.width - 80)}px`;
        w.style.top = `${clamp(ev.clientY - d.top - dy, 30, d.height - 40)}px`;
        w.style.right = 'auto'; w.style.margin = '0';
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    }));

    // ── Terminal: the muster CLI. Type, or click a highlighted command to have it typed for you ──
    const tty = $('[data-tty]', desk), log = $('[data-tty-log]', desk), input = $('[data-tty-input]', desk), promptEl = $('[data-tty-prompt]', desk);
    const PS1 = '<span class="t-dir">~</span> <span class="t-dim">%</span>';
    const esc = v => String(v).replace(/[<>&"]/g, ch => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', '"': 'quot' }[ch]};`);
    const plain = html => html.replace(/<[^>]+>/g, '');
    const t = (cls, v) => `<span class="t-${cls}">${v}</span>`;
    const run$ = (cmd, label = cmd) => `<button type="button" class="t-run" data-run="${cmd}">${esc(label)}</button>`;
    const say = (...rows) => { rows.forEach(r => log.insertAdjacentHTML('beforeend', `<p>${r}</p>`)); tty.scrollTop = tty.scrollHeight; };
    const TONE = { red: 'red', amber: 'amber', grey: 'dim' };
    const bullet = list => { if (!list.length) return ''; const c = list.map(i => KIND[i.kind][2]).sort((a, b) => RANK[b] - RANK[a])[0]; return t(TONE[c], list.length > 1 ? '●●' : '●'); };
    const num = id => ISSUES.findIndex(i => i.id === id) + 1;
    const termLabel = i => i.kind === 'conflict' ? i.skills.join(' × ') : i.kind === 'duplicate' ? i.skills.join(' ≈ ') : plain(i.label);
    const findFolder = q => { q = q.toLowerCase().replace(/\/$/, ''); return FOLDERS.find(f => f.id.toLowerCase() === q || f.label.toLowerCase() === q); };
    const findIssue = q => /^\d+$/.test(q) ? ISSUES[q - 1] : issuesFor(q)[0] || ISSUES.find(i => i.skills.includes(q));
    const wait = ms => new Promise(r => setTimeout(r, reduced || SHOT ? 0 : ms));
    let pending = null, checkedOnce = false;
    const ask = (q, yes) => { pending = { q, yes }; promptEl.innerHTML = `${q} ${t('dim', '[')}${run$('y')}${t('dim', '/N]')}`; updateCoach(); };

    const CLI = {
      help() {
        say(`${t('strong', 'muster')} ${t('dim', 'sorts and checks your agent skills')}`, '',
          ...[['scan', 'muster scan', 'find every skill'], ['check', 'muster check', 'what needs a look'], ['fix <n>', 'muster fix 1', 'fix one, after a yes'],
            ['ls [folder]', 'muster ls', 'folders, or one folder'], ['show <skill>', 'muster show pr-review', 'one skill in detail'],
            ['sort', 'muster sort', 'file the new skills'], ['open', 'muster open', 'the app, in your browser']]
            .map(([label, cmd, what]) => `  ${run$(cmd, `muster ${label}`)}${' '.repeat(15 - label.length)}${t('dim', what)}`));
      },
      async scan() {
        say(t('dim', 'Looking for skills on this Mac…'));
        await wait(700);
        say(`${t('ok', '✓')} Found skills in:`, `  ~/.claude/skills    52  ${t('dim', 'Claude Code')}`, `  ~/.agents/skills     9  ${t('dim', 'Codex')}`, '  3 plugins           29', '  4 projects           8',
          `${t('ok', '✓')} ${t('strong', '98 skills: 89 Claude Code, 9 Codex.')} No files changed.`,
          `${unsorted().length ? `${unsorted().length} are new: ${run$('muster sort')}. ` : ''}What needs a look: ${run$('muster check')}`);
      },
      check() {
        checkedOnce = true;
        const n = remaining();
        say(t('dim', 'Today’s check, 3 minutes ago. 98 skills, 89 Claude Code, 9 Codex.'));
        ['conflict', 'duplicate', 'unused', 'vague'].forEach(k => {
          const list = open().filter(i => i.kind === k);
          if (!list.length) return;
          say('', `${t(TONE[KIND[k][2]], '●')} ${KIND[k][0]} ${t('dim', list.reduce((s, i) => s + i.w, 0))}`,
            ...list.map(i => `  ${String(num(i.id)).padStart(2)}  ${esc(termLabel(i))}${i.sim ? t('dim', `  ${i.sim}%`) : ''}`));
        });
        say('', t('dim', `Your Claude Code skills add ~${fmtTok(listing())} tokens to every turn${listing() < LISTING ? `, down from ${fmtTok(LISTING)}` : ''}.`));
        say('', n ? `${t('strong', `${n} need a look.`)} See one: ${run$(`muster fix ${num(open()[0].id)}`)}` : `${t('ok', '✓')} ${t('strong', 'All clear.')}`);
        updateCoach();
      },
      fix(q) {
        const i = q && findIssue(q);
        if (!i) { say(q ? `Nothing to fix matches “${esc(q)}”. ${run$('muster check')} lists them by number.` : `Which one? ${run$('muster check')} lists them by number.`); return; }
        if (fixed.has(i.id)) { say(`${t('ok', '✓')} Already fixed. ${plain(i.done)}`); return; }
        say(`${t(TONE[KIND[i.kind][2]], '●')} ${KIND[i.kind][1]}: ${t('strong', esc(termLabel(i)))}${i.sim ? t('dim', `, ${i.sim}% similar`) : ''}`);
        if (i.text) say(plain(i.text));
        if (i.kind === 'conflict') say(...i.skills.map(n => `  ${n.padEnd(22)}${t('red', plain(i.lines[n].match(/<mark[^>]*>(.*?)<\/mark>/)[1]))}`));
        if (i.kind === 'duplicate') say(...i.same.map(x => `  ${t('dim', 'same')}  ${x}`), ...i.diff.map(x => `  ${t('dim', 'diff')}  ${x}`));
        if (i.kind === 'unused' && i.skills.length > 1) say(`  ${i.skills.join(', ')}`);
        if (i.kind === 'vague') say(`  ${VAGUE.map(([n]) => n).join(', ')}`);
        if (i.how) say(t('dim', plain(i.how)));
        if (i.tiebreak) say(t('dim', '~/.claude/CLAUDE.md'), t('ok', `+ ${i.tiebreak}`));
        ask(`${esc(i.fix)}?`, () => {
          const msg = doFix(i.id, 'term');
          say(`${t('ok', '✓')} ${plain(i.done)}`);
          if (i.tok) say(t('dim', tokNote(i).trim()));
          changed('term', msg);
        });
      },
      ls(q) {
        if (q) {
          const f = findFolder(q);
          if (!f) { say(`No folder called “${esc(q)}”. ${run$('muster ls')} shows them all.`); return; }
          say(`${t('strong', crumb(f.id))}  ${t('dim', `${count(f.id)} skills, runs in 30 days`)}`,
            ...kids(f.id).map(k => `  ${run$(`muster ls ${k.id.toLowerCase()}`, `${k.label}/`)}${' '.repeat(Math.max(1, 30 - k.label.length))}${String(count(k.id)).padStart(3)}  ${bullet(folderIssues(k.id))}`),
            ...f.skills.map(n => { const x = SKILLS.get(n); return `  ${n.padEnd(22)}${t('dim', x.v.padEnd(9))}${String(x.runs).padStart(3)}  ${bullet(issuesFor(n))}`; }));
          if (f.extra) say(t('dim', `  + ${f.extra} more, left out of this demo`));
          return;
        }
        const rows = [], walk = (p, d) => kids(p).forEach(f => { rows.push([f, d]); walk(f.id, d + 1); });
        walk(null, 0);
        const waiting = unsorted().length;
        say(...(waiting ? [`  ${run$('muster sort', 'Unsorted')}${' '.repeat(23)}${t('amber', `${waiting} new`)}`] : []),
          ...rows.map(([f, d]) => `  ${' '.repeat(d * 2)}${run$(`muster ls ${f.id.toLowerCase()}`, `${f.label}/`)}${' '.repeat(Math.max(1, 30 - d * 2 - f.label.length))}${String(count(f.id)).padStart(3)}  ${bullet(folderIssues(f.id))}`),
          `  ${[...SKILLS].filter(([, x]) => !x.folder && !x.unsorted).map(([n]) => n).join('  ')}`);
      },
      show(q) {
        const n = q && SKILLS.has(q.toLowerCase()) && q.toLowerCase();
        if (!n) { say(q ? `No skill called “${esc(q)}”.` : 'Which skill? For example:', `Try ${run$('muster show pr-review')}`); return; }
        const x = SKILLS.get(n), [d, body] = mdOf(n), list = issuesFor(n);
        say(`${t('strong', n)}  ${t('dim', `${x.v} · ${x.unsorted ? 'Unsorted' : x.folder ? crumb(x.folder) : 'Top level'} · ${x.runs} runs in 30 days`)}`, t('dim', where(n)), '',
          t('dim', '---'), t('dim', `name: ${n}`), t('dim', `description: ${esc(d)}`), t('dim', '---'), ...body.map(esc));
        if (list.length) say('', ...list.map(i => `${t(TONE[KIND[i.kind][2]], '●')} ${KIND[i.kind][1]}: ${run$(`muster fix ${num(i.id)}`)}`));
      },
      sort() {
        const list = unsorted();
        if (!list.length) { say(`${t('ok', '✓')} Nothing to sort. Every skill has a folder.`); return; }
        say(`${list.length} new since yesterday. Suggested folders:`, ...list.map(n => `  ${n.padEnd(18)}→ ${crumb(SKILLS.get(n).suggest)}`));
        ask(`Accept all ${list.length}?`, () => {
          const msg = doSortAll();
          say(`${t('ok', '✓')} ${msg}`);
          changed('term', `Sorted in Terminal. ${others('term')} show it too.`);
        });
      },
      open(q) {
        const f = q && findFolder(q), route = f ? `folder:${f.id}` : 'overview';
        say(`Opening ${t('strong', `http://127.0.0.1:55350${pathOf(route)}`)} in your browser…`);
        setTimeout(() => openWeb(route), reduced ? 0 : 350);
      },
    };
    CLI.status = CLI.check;

    const run = async raw => {
      const line = raw.trim();
      if (pending) {
        const p = pending; pending = null; promptEl.innerHTML = PS1;
        say(`${p.q} ${t('dim', '[y/N]')} ${esc(line)}`);
        if (/^y(es)?$/i.test(line)) p.yes(); else say(t('dim', 'Nothing changed.'));
        return;
      }
      say(`${PS1} ${esc(line)}`);
      if (!line) return;
      hist.push(line); hp = hist.length;
      const [cmd, ...rest] = line.split(/\s+/);
      if (cmd === 'clear') { log.innerHTML = ''; return; }
      // "check" works as well as "muster check"
      const [verb = 'help', ...args] = cmd === 'muster' ? rest : [cmd, ...rest];
      const key = /^(-h|--help)$/.test(verb) ? 'help' : verb;
      if (Object.hasOwn(CLI, key)) { busy = true; await CLI[key](args.join(' ')); busy = false; }
      else if (cmd !== 'muster') say(`zsh: command not found: ${esc(cmd)}`, t('dim', `This Terminal only runs muster. Try ${run$('muster help')}`));
      else say(`muster: no command “${esc(verb)}”. See ${run$('muster help')}`);
    };
    const hist = [];
    let hp = 0, busy = false, typing = Promise.resolve();
    // types commands as if someone were at the keyboard, one after the other
    const type = cmds => (typing = typing.then(async () => {
      for (const cmd of cmds) {
        input.value = '';
        for (const ch of cmd) { input.value += ch; await wait(26); }
        await wait(160);
        input.value = '';
        await run(cmd);
        await wait(380);
      }
    }));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); if (busy) return; const v = input.value; input.value = ''; run(v); }
      else if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hp = Math.max(0, hp - 1); input.value = hist[hp]; }
      else if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hp = Math.min(hist.length, hp + 1); input.value = hist[hp] || ''; }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); log.innerHTML = ''; }
      else if (e.key === 'Tab' && input.value) {
        const m = input.value.match(/^(?:muster\s+)?(\S*)$/), hits = m ? Object.keys(CLI).filter(k => k.startsWith(m[1])) : [];
        if (hits.length === 1) { e.preventDefault(); input.value = `muster ${hits[0]} `; }
      }
    });
    let ttyTouch = false;
    tty.addEventListener('pointerdown', e => { ttyTouch = e.pointerType !== 'mouse'; });
    tty.addEventListener('click', e => {
      const b = e.target.closest('[data-run]');
      if (b) { if (pending && !/^[yn]$/.test(b.dataset.run)) run(''); type([b.dataset.run]); return; }
      if (ttyTouch && !e.target.closest('.tty__line')) return;
      if (!getSelection().toString()) input.focus({ preventScroll: true });
    });

    // ── the browser: the full app, served on 127.0.0.1:55350. Laid out like the v0 prototype's Skills
    //    page (muster-prototype.vercel.app/#/skills, V0): search, Overview and Health, then every skill
    //    in a folder tree; a top bar with the crumb, and one article per page ──
    const webSide = $('[data-web-side]', desk), webMain = $('[data-web-main]', desk), webPath = $('[data-web-path]', desk), webBack = $('[data-web-back]', desk), webFwdBtn = $('[data-web-fwd]', desk);
    const webQ = $('[data-web-q]', desk);
    let webStack = ['overview'], webFwd = [], webFlash = false, range = '30';
    const openFolders = new Set();
    const pathOf = route => {
      const [name, arg = ''] = route.split(':');
      return { overview: '/skills', needs: '/skills/health', unsorted: '/skills/new', folder: `/skills/folders/${arg.toLowerCase().replace(/ /g, '-')}`, skill: `/skills/${arg}`, issue: `/skills/health/${num(arg)}` }[name];
    };
    const linkRow = (route, inner) => `<button type="button" class="web__link" data-web="${route}">${inner}</button>`;
    const crumbLink = (route, label) => `<button type="button" class="web__crumb-link" data-web="${route}">${label}</button><span class="web__crumb-sep">/</span>`;
    const folderCrumbs = id => { const f = FOLDER.get(id); return (f.parent ? folderCrumbs(f.parent) : '') + crumbLink(`folder:${id}`, f.label); };
    // the 7 / 30 / 90 day switch on Overview scales the runs; everything else is a 30-day figure
    const RANGE = { 7: .24, 30: 1, 90: 2.8 };
    const sc = x => Math.round(x * RANGE[range]);
    const BY_VERSION = { 'pr-review': [['v1.1.0', 18], ['v1.0.0', 24]], 'commit-message': [['v3', 22], ['v2', 14], ['v1', 4]], 'ticket-tagger': [['v1.1.0', 22], ['v1.0.0', 9]] };
    // where the 98 skills live: Claude Code's folders, Codex's, and one plugin
    const PLACES = [['~/.claude/skills', 'Claude Code', 68, 543, 2], ['~/.agents/skills', 'Codex', 9, 31, 0], ['side-project/.claude/skills', 'Claude Code, side-project', 13, 47, 0], ['design-pack', 'Claude Code plugin', 8, 0, 8]];
    const openOf = k => open().filter(i => i.kind === k).reduce((s, i) => s + i.w, 0);
    // one bar a day for the last 30 days, the same shape every visit
    const daily = (n, runs) => {
      let h = [...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const w = Array.from({ length: 30 }, () => { h = (h * 1103515245 + 12345) >>> 0; return .15 + ((h >>> 16) % 100) / 100; });
      const sum = w.reduce((a, b) => a + b), out = w.map(x => Math.floor(x / sum * runs));
      [...w.keys()].sort((a, b) => w[b] - w[a]).slice(0, runs - out.reduce((a, b) => a + b)).forEach(i => out[i]++);
      return out;
    };
    const chart = (n, runs) => {
      const d = daily(n, runs), max = Math.max(...d, 1);
      return `<figure class="web__chart" aria-label="${n} runs per day, last 30 days"><div class="web__bars">${d.map((v, i) => `<i style="--v:${(v / max).toFixed(2)}" title="${v} ${v === 1 ? 'run' : 'runs'}, ${i === 29 ? 'today' : `${29 - i} days ago`}"></i>`).join('')}</div><figcaption><span>30 days ago</span><span>Today</span></figcaption></figure>`;
    };
    const banner = (tone, title, text, action = '') => `<section class="web__banner"><div><h3>${tone ? `<b class="dot dot--${tone}"></b>` : ''}${title}</h3><p>${text}</p></div>${action}</section>`;
    const issueBanner = (n, i) => {
      const other = i.skills.length === 2 ? i.skills.find(s => s !== n) : null, c = KIND[i.kind][2];
      const go = `<button type="button" class="web__btn" data-web="issue:${i.id}">${i.kind === 'conflict' || i.kind === 'duplicate' ? 'Compare' : 'Review'}</button>`;
      if (i.kind === 'conflict') return banner(c, `Conflicts with <code>${other}</code>`, i.text, go);
      if (i.kind === 'duplicate') return banner(c, `Looks like <code>${other}</code> · <span class="web__sim">${i.sim}% similar</span>`, i.diff[0] + '.', go);
      if (i.kind === 'unused') return banner(c, 'Not used in 30 days', i.skills.length > 1 ? `One of ${issueLabel(i)}. ${i.how || ''}` : i.text, go);
      return banner(c, 'Vague description', 'Claude picks a skill by its description, and this one says almost nothing.', go);
    };
    const WEB = {
      overview() {
        const n = remaining(), waiting = unsorted().length, unused = openOf('unused'), dup = open().filter(i => i.kind === 'duplicate'), con = open().filter(i => i.kind === 'conflict');
        const top = [...SKILLS].sort((a, b) => b[1].runs - a[1].runs).slice(0, 6);
        return {
          crumb: 'Overview',
          actions: `<div class="web__seg" role="radiogroup" aria-label="Period">${['7', '30', '90'].map(r => `<button type="button" role="radio" aria-checked="${r === range}" data-range="${r}">${r} days</button>`).join('')}</div>`,
          body: `<h1 class="web__h">Overview</h1>
          <div class="web__stats">
            <div><span>Skills</span><strong>98</strong></div>
            <div><span>Runs, ${range} days</span><strong>${sc(621)}</strong></div>
            <div><span>Active skills</span><strong>88</strong></div>
            <div><span><b class="dot dot--${n ? 'amber' : 'green'}"></b>Needs a look</span><strong${webFlash ? ' class="is-flash"' : ''}>${n}</strong></div>
          </div>
          <ul class="web__rows">
            ${waiting ? `<li><span><strong>${waiting}</strong> new skills since yesterday, each with a suggested folder.</span><button type="button" class="web__btn" data-web="unsorted">Sort</button></li>` : ''}
            <li><span>Your Claude Code skills add about <strong>${fmtTok(listing())}</strong> tokens to every turn${listing() < LISTING ? `, down from ${fmtTok(LISTING)}` : ''}.</span></li>
            <li><span>The top 10 skills account for <strong>41%</strong> of runs.</span></li>
            <li><span><strong>27</strong> skills ran once or twice in 30 days, and <strong>${unused}</strong> didn’t run at all.</span>${unused ? '<button type="button" class="web__btn" data-web="needs">Clean up</button>' : ''}</li>
            ${dup.length || con.length ? `<li><span><strong>${dup.length}</strong> pairs look like duplicates${dup.some(i => i.id === 'd6') ? ', one of them across Claude Code and Codex,' : ''} and <strong>${con.length}</strong> conflict.</span><button type="button" class="web__btn" data-web="needs">Review</button></li>` : ''}
          </ul>
          <section class="web__sec"><h2>Most used</h2>
            <table class="web__table"><thead><tr><th>Skill</th><th class="num">Runs</th><th>By version</th></tr></thead><tbody>${top.map(([s, x]) => `<tr><td>${linkRow(`skill:${s}`, `<code>${s}</code>`)}</td><td class="num">${sc(x.runs)}</td><td class="muted">${(BY_VERSION[s] || [[x.v, x.runs]]).map(([v, k]) => `${v}: ${sc(k)}`).join(' · ')}</td></tr>`).join('')}</tbody></table>
          </section>
          <section class="web__sec"><h2>By place</h2>
            <table class="web__table"><thead><tr><th>Folder</th><th class="num">Skills</th><th class="num">Runs</th><th class="num">Not used</th></tr></thead><tbody>${PLACES.map(([p, agent, k, runs, idle]) => `<tr><td><span class="web__mono">${p}</span> <span class="muted">${agent}</span></td><td class="num">${k}</td><td class="num">${sc(runs)}</td><td class="num">${p === 'design-pack' && fixed.has('u1') ? 'Off' : idle}</td></tr>`).join('')}</tbody></table>
          </section>`,
        };
      },
      needs() {
        const kinds = ['conflict', 'duplicate', 'unused', 'vague'];
        const row = i => {
          const desc = i.kind === 'duplicate' ? `${i.diff[0]}.` : i.text || '';
          const label = `${issueLabel(i)}${i.sim ? ` <span class="muted">·</span> <span class="web__sim">${i.sim}% similar</span>` : ''}`;
          return fixed.has(i.id)
            ? `<li class="is-fixed"><span class="web__hrow">${linkRow(`issue:${i.id}`, issueLabel(i))}</span><small><i class="ok-ico"></i>Fixed</small></li>`
            : `<li><span class="web__hrow">${linkRow(`issue:${i.id}`, label)}${desc ? `<small>${desc}</small>` : ''}</span><button type="button" class="web__btn" data-web="issue:${i.id}">${i.kind === 'conflict' || i.kind === 'duplicate' ? 'Compare' : 'Review'}</button></li>`;
        };
        return {
          crumb: 'Health',
          body: `<h1 class="web__h">Health</h1>
          <p class="web__lede">Runs every day and on every new skill. Last ran today at 07:00.</p>
          <div class="web__stats">${kinds.map(k => `<button type="button" data-jump="${k}"${openOf(k) ? '' : ' disabled'}><span>${openOf(k) ? `<b class="dot dot--${KIND[k][2]}"></b>` : ''}${KIND[k][0].replace(' descriptions', '')}</span><strong${webFlash ? ' class="is-flash"' : ''}>${openOf(k)}</strong></button>`).join('')}</div>
          ${kinds.map(k => `<section class="web__sec" id="web-${k}"><h2><b class="dot dot--${openOf(k) ? KIND[k][2] : 'green'}"></b>${KIND[k][0]}<span class="web__count">${openOf(k) || '✓'}</span></h2><ul class="web__rows">${ISSUES.filter(i => i.kind === k).map(row).join('')}</ul></section>`).join('')}`,
        };
      },
      issue(id) {
        const i = byId[id], [, one, c] = KIND[i.kind];
        return {
          crumb: `${crumbLink('needs', 'Health')}${one}`,
          body: `<div class="web__narrow"><p class="pv-kicker"><b class="dot dot--${c}"></b>${one}${i.sim ? ` · ${i.sim}% similar` : ''}</p>
          <h1 class="web__h">${issueLabel(i)}</h1>
          ${i.text ? `<p class="web__lede">${i.text}</p>` : ''}${issueDetail(i)}</div>`,
        };
      },
      folder(id) {
        const f = FOLDER.get(id);
        return {
          crumb: `${crumbLink('overview', 'Overview')}${f.parent ? folderCrumbs(f.parent) : ''}${f.label}`,
          body: `<h1 class="web__h">${f.label}</h1><p class="web__lede">${count(id)} skills. Folders live in Muster: the files stay where your agents find them.</p>
          <table class="web__table"><thead><tr><th>Skill</th><th>Version</th><th class="num">Runs, 30 days</th></tr></thead><tbody>
          ${kids(id).map(k => `<tr><td>${linkRow(`folder:${k.id}`, `<i class="ico ico--folder"></i>${k.label}${marks(folderIssues(k.id))}`)}</td><td></td><td class="num">${count(k.id)} skills</td></tr>`).join('')}
          ${f.skills.map(n => { const x = SKILLS.get(n); return `<tr><td>${linkRow(`skill:${n}`, `<code>${n}</code>${marks(issuesFor(n))}`)}</td><td class="muted">${x.v}</td><td class="num">${x.runs}</td></tr>`; }).join('')}
          </tbody></table>
          ${f.extra ? `<p class="web__more">+ ${f.extra} more, left out of this demo</p>` : ''}
          ${!f.skills.length && !kids(id).length ? '<p class="web__more">Empty for now. Open a skill and pick a folder for it.</p>' : ''}`,
        };
      },
      skill(n) {
        const x = SKILLS.get(n), list = issuesFor(n), rows = [], [d, body] = mdOf(n), codex = CODEX.has(n);
        const walk = (p, dp) => kids(p).forEach(f => { rows.push([f, dp]); walk(f.id, dp + 1); });
        walk(null, 0);
        const from = INSTALLED[n] ? `Updated from ${INSTALLED[n]}` : PACK.includes(n) ? 'Comes with design-pack' : 'Yours';
        return {
          crumb: `${x.folder ? folderCrumbs(x.folder) : x.unsorted ? crumbLink('unsorted', 'New skills') : ''}${n}`,
          actions: '<button type="button" class="web__btn is-ghost" data-go="toast:edit">Open SKILL.md</button>',
          body: `<header class="web__skill">
            <h1 class="web__h web__mono">${n}<span class="web__ver">${x.v}</span></h1>
            <p class="web__meta"><span>${x.runs ? `Used ${x.runs} ${x.runs === 1 ? 'time' : 'times'} in 30 days` : 'Never used'}</span><span>${from}</span><span><span class="web__mono">${where(n)}</span> · ${codex ? 'Codex' : 'Claude Code'}</span></p>
            <label class="web__field"><span>Folder</span><select data-web-move="${n}">${x.folder ? '' : `<option selected disabled>${x.unsorted ? 'Not sorted yet' : 'Top level'}</option>`}${rows.map(([f, dp]) => `<option value="${f.id}"${x.folder === f.id ? ' selected' : ''}>${'   '.repeat(dp)}${f.label}</option>`).join('')}</select></label>
          </header>
          ${x.unsorted || list.length ? `<div class="web__banners">${x.unsorted ? banner('', 'New since yesterday', `Muster suggests ${crumb(x.suggest)}, from what the skill does.`, `<button type="button" class="web__btn is-primary" data-move="${n}" data-to="${x.suggest}">Move to ${crumb(x.suggest)}</button>`) : ''}${list.map(i => issueBanner(n, i)).join('')}</div>` : ''}
          <section class="web__sec">${x.runs ? chart(n, x.runs) : '<p class="web__lede">Not used in the last 30 days.</p>'}</section>
          <section class="web__sec"><h2>Summary</h2><pre class="web__code">${d}</pre></section>
          ${body.length ? `<section class="web__sec"><h2>Instructions</h2><pre class="web__code">${body.join('\n')}</pre></section>` : ''}`,
        };
      },
      unsorted() {
        const list = unsorted();
        return {
          crumb: `${crumbLink('overview', 'Overview')}New skills`,
          body: `<h1 class="web__h">New skills</h1><p class="web__lede">${list.length ? 'Found since yesterday. Muster suggests a folder from what each skill does.' : 'All sorted. Folders live in Muster, so nothing moved on disk.'}</p>
          ${list.length ? `<ul class="web__rows">${list.map(n => `<li><span class="web__hrow">${linkRow(`skill:${n}`, `<code>${n}</code>`)}<small>${mdOf(n)[0]}</small></span><button type="button" class="web__btn" data-move="${n}" data-to="${SKILLS.get(n).suggest}" aria-label="Move ${n} to ${crumb(SKILLS.get(n).suggest)}"><i class="ico ico--folder"></i>${crumb(SKILLS.get(n).suggest)}</button></li>`).join('')}</ul>
          ${list.length > 1 ? '<div class="pv-actions"><button type="button" class="web__btn is-primary" data-sortall>Accept all suggestions</button></div>' : ''}` : '<p class="pv-done"><i class="ok-ico"></i>Everything has a home.</p>'}`,
        };
      },
    };
    // the sidebar: Overview, Health and new skills, then the folder tree (or search results)
    const sideSkill = (n, here, d = 0) => {
      const x = SKILLS.get(n);
      return `<li><button type="button" class="web__item${here === `skill:${n}` ? ' is-on' : ''}" style="--d:${d}" data-web="skill:${n}"${here === `skill:${n}` ? ' aria-current="page"' : ''}><i class="ico ico--${x.ico || 'doc'}"></i><span class="web__name">${n}</span><small>${x.unsorted ? 'New' : x.v}</small>${marks(issuesFor(n))}</button></li>`;
    };
    const tree = (parent, here, d) => kids(parent).map(f => {
      const on = openFolders.has(f.id), ext = f.extra ? `<li><button type="button" class="web__item is-more" style="--d:${d + 1}" data-web="folder:${f.id}"><span class="web__name">${f.extra} more</span></button></li>` : '';
      return `<li><button type="button" class="web__item" style="--d:${d}" data-fold="${f.id}" aria-expanded="${on}"><i class="ico ico--folder${on ? '-open' : ''}"></i><span class="web__name">${f.label}</span>${marks(folderIssues(f.id))}</button>
        ${on ? `<ul>${tree(f.id, here, d + 1)}${f.skills.map(n => sideSkill(n, here, d + 1)).join('')}${ext}</ul>` : ''}</li>`;
    }).join('');
    const renderSide = () => {
      const route = webStack[webStack.length - 1], [name] = route.split(':'), n = remaining(), waiting = unsorted().length;
      const here = name === 'issue' ? 'needs' : route, q = webQ.value.trim().toLowerCase();
      const navItem = (r, ico, label, end = '') => `<li><button type="button" class="web__item${here === r ? ' is-on' : ''}" data-web="${r}"${here === r ? ' aria-current="page"' : ''}><i class="ico ico--${ico}"></i><span class="web__name">${label}</span>${end}</button></li>`;
      const hits = q ? [...SKILLS.keys()].filter(s => s.includes(q)) : null;
      webSide.innerHTML = `<ul class="web__nav">
          ${navItem('overview', 'grid', 'Overview')}
          ${navItem('needs', 'heart', 'Health', `<em${webFlash ? ' class="is-flash"' : ''}>${n || '✓'}</em>`)}
          ${waiting ? navItem('unsorted', 'tray', 'New skills', `<span class="pv-new">${waiting}</span>`) : ''}
          <li><button type="button" class="web__item" data-go="toast:add"><i class="ico ico--plus"></i><span class="web__name">Add skills</span></button></li>
        </ul>
        <p class="web__group">Skills <em>${hits ? hits.length : 98}</em></p>
        <ul class="web__tree">${hits
          ? hits.map(s => sideSkill(s, here)).join('') || `<li class="web__empty">No skills match “${q.replace(/[<>&"]/g, '')}”.</li>`
          : tree(null, here, 0) + [...SKILLS].filter(([, x]) => !x.folder && !x.unsorted).map(([s]) => sideSkill(s, here)).join('')}</ul>`;
    };
    const renderWeb = () => {
      const route = webStack[webStack.length - 1], [name, arg] = route.split(':');
      // a skill's folders open in the tree, the way the prototype reveals the selection
      if (name === 'skill') for (let f = SKILLS.get(arg).folder; f; f = FOLDER.get(f).parent) openFolders.add(f);
      if (name === 'folder') for (let f = arg; f; f = FOLDER.get(f).parent) openFolders.add(f);
      const page = WEB[name](arg);
      renderSide();
      webMain.innerHTML = `<header class="web__top"><span class="web__crumb">${page.crumb}</span>${page.actions ? `<div class="web__acts">${page.actions}</div>` : ''}</header><article class="web__art">${page.body}</article>`;
      webPath.textContent = pathOf(route);
      webBack.disabled = webStack.length < 2;
      webFwdBtn.disabled = !webFwd.length;
      updateCoach();
    };
    const webGo = route => { if (webStack[webStack.length - 1] !== route) { webStack.push(route); webFwd = []; } renderWeb(); webMain.scrollTop = 0; };
    const openWeb = route => { webGo(route); setScene('web'); };
    wins.web.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.web) webGo(b.dataset.web);
      else if (b.dataset.fold) { const f = b.dataset.fold; openFolders.has(f) ? openFolders.delete(f) : openFolders.add(f); renderSide(); updateCoach(); $(`[data-fold="${f}"]`, webSide)?.focus({ preventScroll: true }); }
      else if (b.dataset.range) { range = b.dataset.range; renderWeb(); $(`[data-range="${range}"]`, webMain)?.focus({ preventScroll: true }); }
      else if (b.dataset.jump) {
        const el = $(`#web-${b.dataset.jump}`, webMain), bar = $('.web__top', webMain);
        if (el) webMain.scrollTo({ top: webMain.scrollTop + el.getBoundingClientRect().top - webMain.getBoundingClientRect().top - (bar?.offsetHeight || 0) - 8, behavior: reduced ? 'auto' : 'smooth' });
      }
      else if ('webBack' in b.dataset) { if (webStack.length > 1) { webFwd.push(webStack.pop()); renderWeb(); } }
      else if ('webFwd' in b.dataset) { if (webFwd.length) { webStack.push(webFwd.pop()); renderWeb(); } }
      else if (b.dataset.move) changed('web', doMove(b.dataset.move, b.dataset.to));
      else if ('sortall' in b.dataset) changed('web', doSortAll());
      else if (b.dataset.fix) changed('web', doFix(b.dataset.fix, 'web'));
      else if (b.dataset.copy) toast(copyMsg(b.dataset.copy));
      else if (b.dataset.go?.startsWith('toast:')) toast(TOASTS[b.dataset.go.slice(6)]);
    });
    webMain.addEventListener('change', e => { const n = e.target.dataset.webMove; if (n) changed('web', doMove(n, e.target.value)); });
    webQ.addEventListener('input', () => { renderSide(); updateCoach(); });
    webQ.addEventListener('keydown', e => { if (e.key === 'Escape' && webQ.value) { e.stopPropagation(); webQ.value = ''; renderSide(); updateCoach(); } });

    // ── a soft ring on the one thing worth trying in the scene on screen, until it's been tried ──
    let coached = null;
    const COACH = {
      web: () => wins.web.hidden ? dockOf('web') : unsorted().length < UNSORTED.length ? null
        : webStack[webStack.length - 1] === 'unsorted' ? $('[data-web-main] [data-sortall]', desk) : $('[data-web-side] [data-web="unsorted"]', desk),
      pop: () => pop.classList.contains('is-closed') ? toggle : menuFolder ? null : $('[data-view] [data-go^="folder:"]', desk),
      term: () => wins.term.hidden ? dockOf('term') : pending ? $('[data-run="y"]', promptEl) : fixed.size ? null : $$('[data-tty-log] [data-run^="muster fix"]', desk).pop(),
    };
    const updateCoach = () => {
      coached?.classList.remove('is-coach');
      coached = phone.matches || SHOT ? null : COACH[scene]?.() || null;
      coached?.classList.add('is-coach');
      resetBtn.hidden = !dirty;
    };
    let menuFolder = false;

    let stack = ['home'];
    // dir: 'push' / 'pop' slides the view in on pointer navigation; in-place re-renders and keyboard stay still
    const render = (focus = false, dir = null) => {
      const [name, arg] = stack[stack.length - 1].split(':');
      view.innerHTML = VIEWS[name](arg);
      justFixed = null;
      view.scrollTop = 0;
      view.classList.remove('is-in');
      if (dir) { view.style.setProperty('--dx', dir === 'push' ? '4px' : '-4px'); void view.offsetWidth; view.classList.add('is-in'); }
      if (focus) $('button, input', view)?.focus({ preventScroll: true });
      const n = remaining();
      badge.textContent = n || '✓';
      badgeMini.textContent = n || '✓';
      if (name === 'folder') menuFolder = true;
      updateCoach();
    };
    const go = (route, { reset = false, focus = false } = {}) => {
      if (route.startsWith('toast:')) { toast(TOASTS[route.slice(6)]); return; }
      if (route.startsWith('web:')) { openWeb(route.slice(4)); return; }
      stack = reset ? ['home', route] : [...stack, route];
      setOpen(true);
      render(focus, focus ? null : 'push');
    };
    const back = (kb = true) => { if (stack.length > 1) { stack.pop(); render(true, kb ? null : 'pop'); } };
    const setOpen = o => {
      // grow from the menu-bar toggle (offsets: the closed popover's own scale doesn't skew them)
      if (o && pop.classList.contains('is-closed')) pop.style.transformOrigin = `${Math.round(toggle.offsetParent.offsetLeft + toggle.offsetLeft + toggle.offsetWidth / 2 - pop.offsetLeft)}px 0`;
      pop.classList.toggle('is-closed', !o); toggle.setAttribute('aria-expanded', String(o)); toggle.classList.toggle('is-on', o); updateCoach(); };

    view.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const kb = e.detail === 0; // keyboard activation: move focus into the new view
      if (b.dataset.move) {
        const msg = doMove(b.dataset.move, b.dataset.to);
        if (stack[stack.length - 1].startsWith('move:')) stack.pop();
        changed('menu', msg, kb);
      }
      else if ('sortall' in b.dataset) changed('menu', doSortAll(), kb);
      else if (b.dataset.newfolder) {
        const slot = b.closest('[data-slot]');
        slot.className = 'pv-newfolder';
        slot.innerHTML = `<input type="text" maxlength="24" placeholder="Folder name" aria-label="New folder name" data-newname="${b.dataset.newfolder}" /><button type="button" class="pv-btn pv-btn--sm pv-btn--dark" data-addfolder>Add</button>`;
        $('input', slot).focus();
      }
      else if ('addfolder' in b.dataset) addFromInput($('input', b.parentElement));
      else if (b.dataset.go) go(b.dataset.go, { focus: kb });
      else if ('back' in b.dataset) back(kb);
      else if (b.dataset.fix) changed('menu', doFix(b.dataset.fix, 'menu'), kb);
      else if (b.dataset.copy) toast(copyMsg(b.dataset.copy));
    });
    const addFromInput = input => {
      const f = addFolder(input.dataset.newname, input.value);
      changed('menu', `Added ${crumb(f.id)}. Open any skill and pick “Move…” to put it there.`);
    };
    view.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-newname]')) { e.preventDefault(); addFromInput(e.target); } });
    view.addEventListener('input', e => {
      if (!e.target.matches('[data-search]')) return;
      const q = e.target.value.trim().toLowerCase(), res = $('[data-results]', view);
      if (!q) { res.innerHTML = homeList(); return; }
      const hits = [...SKILLS.keys()].filter(n => n.includes(q)).slice(0, 9);
      res.innerHTML = hits.length ? hits.map(n => skillRow(n)).join('') : `<li class="pv-empty">No skill matches “${q.replace(/[<>&"]/g, '')}”</li>`;
    });
    pop.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (stack.length > 1) back(); else { setOpen(false); toggle.focus(); }
    });
    // the menu bar icon is the way into the menu bar scene; once there, it opens and closes the popover as usual
    toggle.addEventListener('click', () => { if (scene !== 'pop') setScene('pop'); else setOpen(pop.classList.contains('is-closed')); });
    toggle.addEventListener('animationend', e => { if (e.animationName === 'bump') toggle.classList.remove('is-bump'); });

    // start: the app in Safari. Terminal waits in the Dock with the help ready for when it opens
    // the launch banner at the top of the log: the logo as half-block pixels (two to a line), drawn as rects so the
    // blocks meet whatever the line height and the mono face. Our own mark is drawn by hand (MARK_ART); a lab logo with
    // hand-drawn rows (window.MusterLogo.cli) prints those in the accent; any other is the tab icon, sampled to 18×14
    const icon = document.querySelector('link[rel="icon"]');
    const BW = 18, BH = 14; // a cell is about 1ch by half a line, so 18×14 reads square
    const sampleIcon = async href => {
      const S = 8, img = new Image();
      // a set size, stretched to the grid: without one Firefox won't draw it and the others each fit it their own way
      const svg = (await (await fetch(href)).text()).replace(/<svg\b([^>]*)>/, (m, a) =>
        `<svg${a.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '')} width="${BW * S}" height="${BH * S}" preserveAspectRatio="none">`);
      img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = BW * S; c.height = BH * S;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height).data, px = [];
      // each pixel takes the colour most of its cell is (no blur at the edges); under half covered, it's empty
      for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
        const n = new Map();
        let on = 0;
        for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) {
          const i = ((y * S + v) * c.width + x * S + u) * 4;
          if (d[i + 3] < 128) continue;
          on++;
          const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4, e = n.get(k);
          e ? (e[0]++, e[1] += d[i], e[2] += d[i + 1], e[3] += d[i + 2]) : n.set(k, [1, d[i], d[i + 1], d[i + 2]]);
        }
        if (on * 2 < S * S) continue;
        const [k, r, gr, b] = [...n.values()].sort((a, z) => z[0] - a[0])[0];
        px.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="rgb(${[r, gr, b].map(v => Math.round(v / k)).join()})"/>`);
      }
      return { w: BW, h: BH, px: px.join('') };
    };
    const cliArt = rows => {
      const art = rows.map(r => r.replace(/\s+muster$/, ''));
      const px = art.flatMap((r, y) => [...r].flatMap((c, x) => [
        '█▀'.includes(c) ? `<rect x="${x}" y="${y * 2}" width="1.02" height="1.02"/>` : '',
        '█▄'.includes(c) ? `<rect x="${x}" y="${y * 2 + 1}" width="1.02" height="1.02"/>` : '',
      ])).join('');
      return { w: Math.max(...art.map(r => [...r].length)), h: art.length * 2, px, mono: true };
    };
    // the mark by hand, 20×16: sampled at 18×14 its arrows break into T bars. '#' is the glyph, 'T' the tile with the
    // primary button's top-lit gradient; both are accent tokens, so the banner follows the colour lab
    const MARK_ART = [
      '..TTTTTTTTTTTTTTTT..',
      '.TTTTTTTTTTTTTTTTTT.',
      'TTTTTTT######TTTTTTT',
      'TTTTTTTT####TTTTTTTT',
      'TTTTTTTTT##TTTTTTTTT',
      'TT#TTTTTTTTTTTTTT#TT',
      'TT##TTTT####TTTT##TT',
      'TT###TT######TT###TT',
      'TT###TT######TT###TT',
      'TT##TTTT####TTTT##TT',
      'TT#TTTTTTTTTTTTTT#TT',
      'TTTTTTTTT##TTTTTTTTT',
      'TTTTTTTT####TTTTTTTT',
      'TTTTTTT######TTTTTTT',
      '.TTTTTTTTTTTTTTTTTT.',
      '..TTTTTTTTTTTTTTTT..',
    ];
    const markArt = () => {
      const h = MARK_ART.length, runs = MARK_ART.flatMap((r, y) => [...r.matchAll(/T+|#+/g)].map(m =>
        `<rect x="${m.index}" y="${y}" width="${m[0].length + .02}" height="1.02" style="fill:${m[0][0] === '#' ? 'var(--accent-ink)' : 'url(#tty-tile)'}"/>`));
      const stops = [[0, 'hi'], [.6, 'mid'], [1, 'lo']].map(([o, k]) => `<stop offset="${o}" style="stop-color:var(--accent-${k})"/>`).join('');
      return { w: MARK_ART[0].length, h, px: `<defs><linearGradient id="tty-tile" gradientUnits="userSpaceOnUse" x2="0" y2="${h}">${stops}</linearGradient></defs>${runs.join('')}` };
    };
    const ttyBanner = ({ w, h, px, mono }) => `<div class="tty__banner${mono ? ' is-mono' : ''}" data-tty-banner aria-hidden="true">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" shape-rendering="crispEdges" style="--w:${w};--lines:${h / 2}">${px}</svg>
      <span><b>Muster</b>${t('dim', 'v0 · the skills on this Mac')}</span></div>`;
    let bannerRun = 0;
    const showBanner = async () => {
      const run = ++bannerRun, rows = window.MusterLogo?.cli;
      let art = null;
      try { art = rows ? cliArt(rows) : !window.MusterLogo ? markArt() : icon && await sampleIcon(icon.href); } catch { /* no icon to read: no banner */ }
      if (run !== bannerRun) return;
      $('[data-tty-banner]', log)?.remove();
      if (art) log.insertAdjacentHTML('afterbegin', ttyBanner(art));
    };
    // Safari's favicon is the tab's own icon, so it follows the logo and colour lab too
    const showFav = () => $$('.sbar__fav', desk).forEach(f => { f.classList.add('has-icon'); f.style.backgroundImage = `url("${icon.href}")`; });
    if (icon) showFav();
    addEventListener('muster:logo', () => { if (icon) showFav(); showBanner(); });
    const boot = () => {
      showBanner();
      say(t('dim', `Last login: ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} on ttys001`));
      return run('muster help').then(() => say('', t('dim', 'Type a command, or click one.')));
    };
    // "Reset the demo": sample data, Terminal and the browser go back to how the page loaded; the scene stays
    const reset = () => {
      restore();
      checkedOnce = menuFolder = dirty = false;
      Object.keys(seen).forEach(k => { seen[k] = 26; });
      pending = null; promptEl.innerHTML = PS1; log.innerHTML = ''; hist.length = 0; hp = 0;
      boot();
      Object.values(wins).forEach(w => { w.style.left = w.style.top = w.style.right = w.style.margin = ''; });
      webStack = ['overview']; webFwd = []; stack = ['home']; range = '30'; openFolders.clear(); webQ.value = '';
      renderWeb(); render();
      if (scene === 'term') type(['muster check']);
    };
    resetBtn.addEventListener('click', reset);
    boot();
    renderWeb();
    render();
    dockState();
    // ?try=pop or ?try=term opens the demo on that surface, for links straight to it
    // (a shot opens on its surface the same way, and stays still)
    const asked = SHOT || new URLSearchParams(location.search).get('try');
    if (asked === 'pop' || asked === 'term') {
      // arrive settled: no minimise or bounce, and no fades on the cards or the popover for the first frames
      still = true; document.documentElement.classList.add('is-still');
      setScene(asked).then(() => { if (!SHOT) requestAnimationFrame(() => requestAnimationFrame(() => { still = false; document.documentElement.classList.remove('is-still'); })); });
    }

    // the menu bar shows the visitor's own day and time, macOS style
    const timeEl = $('[data-desk-time]', desk);
    const tick = () => {
      const d = new Date();
      timeEl.textContent = `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    };
    tick(); setInterval(tick, 20_000);
  }

  // a sideways row's current item: the one snapped to the gutter, or at the row's end (which the last one can't
  // reach) the last. It gets .is-current, and the others dim (styles.css)
  const currentIn = (track, items) => {
    const pitch = items[1].offsetLeft - items[0].offsetLeft; // 0 where the row isn't sideways (desktop, hidden)
    const end = track.scrollLeft > track.scrollWidth - track.clientWidth - 2;
    const i = !pitch ? 0 : end ? items.length - 1 : Math.round(track.scrollLeft / pitch);
    items.forEach((it, k) => it.classList.toggle('is-current', k === i));
    return i;
  };

  /* ── the demo on phones: three screenshots to swipe ─────────────────
     Each frame is this page in shot mode, in a 900×600 iframe laid out at desktop width and scaled to the frame,
     cropped from the slide's data-x. Loaded only on a phone, once the carousel is near, with the lab's
     colour, type and logo, so the pictures match the page. Its arrows are the row-nav below */
  const shots = $('[data-shots]');
  if (shots && !SHOT) {
    const slides = $$('.shot', shots);
    const CROP = 480;
    const fitShots = () => slides.forEach(sl => {
      const f = $('iframe', sl);
      if (f) f.style.transform = `scale(${sl.firstElementChild.clientWidth / CROP}) translateX(${-sl.dataset.x}px)`;
    });
    const load = () => {
      slides.forEach(sl => {
        const f = document.createElement('iframe');
        Object.assign(f, { src: srcOf(sl), title: '', tabIndex: -1, inert: true });
        f.setAttribute('aria-hidden', 'true');
        f.addEventListener('load', () => f.classList.add('is-in'), { once: true });
        $('[data-shot-frame]', sl).append(f);
      });
      fitShots();
      addEventListener('resize', fitShots, { passive: true });
      // the lab (variants.js) recolours the page in place: the pictures reload to match
      addEventListener('muster:logo', () => slides.forEach(sl => { const f = $('iframe', sl); if (f && f.src !== new URL(srcOf(sl), location.href).href) f.src = srcOf(sl); }));
    };
    const srcOf = sl => {
      const q = new URLSearchParams(location.search);
      q.delete('try'); q.set('shot', sl.dataset.shot);
      return `${location.pathname}?${q}`;
    };
    const phoneQ = matchMedia('(max-width: 809px)');
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || !phoneQ.matches) return;
      near.disconnect(); load();
    }, { rootMargin: '600px 0px' });
    near.observe(shots);
  }

  /* ── prev/next arrows for the rows that scroll sideways on phones (the steps, the demo, the roadmap): one item per
     press, and each end's arrow switches off when the row is there; they mark the current item too (currentIn) */
  $$('[data-row-nav]').forEach(nav => {
    const track = $(nav.dataset.rowNav), items = track ? [...track.children] : [];
    if (items.length < 2) return;
    const [prev, next] = $$('[data-dir]', nav);
    const sync = () => {
      prev.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 2;
      currentIn(track, items);
    };
    nav.addEventListener('click', e => {
      const b = e.target.closest('[data-dir]');
      if (b) track.scrollBy({ left: +b.dataset.dir * (items[1].offsetLeft - items[0].offsetLeft), behavior: reduced ? 'auto' : 'smooth' });
    });
    track.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync, { passive: true });
    sync();
  });

  /* ── page scrollbar: where the OS keeps a gutter for it, the native one hides and a pill floats over the page
     (styles: .vbar). Drag it to scroll; it turns light while it's over the dark problem section ── */
  if (!SHOT && innerWidth > document.documentElement.clientWidth) {
    const root = document.documentElement, problem = $('.problem'), bar = document.createElement('div');
    bar.className = 'vbar';
    bar.setAttribute('aria-hidden', 'true');
    root.classList.add('has-vbar');
    document.body.append(bar);
    const EDGE = 8; // the track's inset top and bottom, as on the other scrollbars
    let raf = 0, drag = null;
    const metrics = () => {
      const vh = root.clientHeight, max = root.scrollHeight - vh, track = vh - EDGE * 2;
      return { max, track, h: Math.max(32, track * vh / (vh + max)) };
    };
    const paint = () => {
      raf = 0;
      const { max, track, h } = metrics();
      bar.hidden = max <= 0;
      if (bar.hidden) return;
      const y = EDGE + (track - h) * clamp(scrollY / max), mid = y + h / 2, r = problem?.getBoundingClientRect();
      bar.style.height = `${h}px`;
      bar.style.transform = `translateY(${y}px)`;
      bar.classList.toggle('is-light', !!r && r.top < mid && r.bottom > mid);
    };
    const queue = () => { raf ||= requestAnimationFrame(paint); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    new ResizeObserver(queue).observe(document.body);
    bar.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      drag = { y: e.clientY, top: scrollY };
      bar.classList.add('is-drag');
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      const { max, track, h } = metrics();
      scrollTo({ top: drag.top + (e.clientY - drag.y) * max / (track - h), behavior: 'instant' });
    });
    const release = () => { drag = null; bar.classList.remove('is-drag'); };
    bar.addEventListener('pointerup', release);
    bar.addEventListener('pointercancel', release);
    paint();
  }

  /* ── FAQ: one open at a time (native `name` does this in new browsers) */
  const qas = $$('[data-accordion] details');
  qas.forEach(d => d.addEventListener('toggle', () => { if (d.open) qas.forEach(o => { if (o !== d) o.open = false; }); }));

  /* ── waitlist ────────────────────────────────────────────────────────
     One step: what they'd fix first, how many skills, what they do, email. All four are needed */
  const post = async (body, url = WAITLIST_ENDPOINT) => {
    if (!url) return;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    if (!res.ok || (await res.json().catch(() => ({}))).ok === false) throw new Error(String(res.status));
  };
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  // a field that says no shakes its head once: a quick, shrinking side-to-side. The message under it carries
  // the error, so reduced motion skips the shake
  const shake = el => reduced || el.animate(
    { translate: ['0', '-6px', '5px', '-3px', '2px', '0'] },
    { duration: 400, easing: 'ease-out' });
  const joinForm = $('[data-join]'), done = $('[data-join-done]'), joinError = $('[data-join-error]');
  // "How many skills": the highlight slides to the picked option. The first pick fades it in where it lands
  // (placed, then shown), and a resize (four across ↔ two by two) moves it without a slide
  $$('.seg', joinForm).forEach(seg => {
    const segHl = $('.seg__hl', seg);
    const place = () => {
      const l = $('input:checked', seg)?.closest('label');
      if (!l) return;
      segHl.style.width = `${l.offsetWidth}px`; segHl.style.height = `${l.offsetHeight}px`;
      segHl.style.transform = `translate(${l.offsetLeft}px, ${l.offsetTop}px)`;
    };
    const show = () => {
      if (segHl.classList.contains('is-on')) return place();
      if (!$('input:checked', seg)) return;
      place(); void segHl.offsetWidth; segHl.classList.add('is-on');
    };
    seg.addEventListener('change', show);
    show(); // a pick the browser restored on reload
    new ResizeObserver(() => {
      if (!segHl.classList.contains('is-on')) return;
      segHl.style.transition = 'none'; place(); void segHl.offsetWidth; segHl.style.transition = '';
    }).observe(seg);
  });
  if (joinForm) {
    const answers = () => ({
      wants: $$('input[name="wants"]:checked', joinForm).map(i => i.value),
      skills: $('input[name="skills"]:checked', joinForm)?.value || '',
      roles: $$('input[name="roles"]:checked', joinForm).map(i => i.value),
      email: joinForm.elements.email.value.trim(),
    });
    const check = {
      wants: a => a.wants.length ? '' : 'Pick at least one.',
      skills: a => a.skills ? '' : 'Pick one. A guess is fine.',
      roles: a => a.roles.length ? '' : 'Pick at least one.',
      email: a => !a.email ? 'Enter your email so we can let you in.' : EMAIL.test(a.email) ? '' : 'That email doesn’t look right. Check it and try again.',
    };
    // one question's error under it; returns whether it's answered
    const mark = q => {
      const text = check[q](answers()), err = $(`#join-${q}-error`, joinForm);
      err.textContent = text; err.hidden = !text;
      $(`[data-q="${q}"]`, joinForm).toggleAttribute('data-invalid', !!text);
      if (q === 'email') joinForm.elements.email.toggleAttribute('aria-invalid', !!text);
      return !text;
    };
    // a flagged question re-checks as it's answered, quietly
    joinForm.addEventListener('input', ev => {
      const q = ev.target.closest('[data-q]');
      if (q?.hasAttribute('data-invalid')) mark(q.dataset.q);
    });
    joinForm.addEventListener('submit', async ev => {
      ev.preventDefault();
      const bad = Object.keys(check).filter(q => !mark(q));
      if (bad.length) {
        bad.forEach(q => shake($(`[data-q="${q}"] :is(.picks, .seg, .signup__row)`, joinForm)));
        return $(`[data-q="${bad[0]}"] input`, joinForm).focus();
      }
      const btn = $('button[type="submit"]', joinForm);
      const { wants, skills, roles, email } = answers();
      btn.disabled = true; joinError.hidden = true;
      try {
        await post({ email, wants, skills, roles, source: 'cta' });
        // PostHog (snippet in index.html): the signup and its answers, with the email on the person
        window.posthog?.capture('waitlist_joined', { wants, skills, roles, source: 'cta', $set: { email, roles } });
        joinForm.hidden = true; done.hidden = false;
        $('[data-join-done-text]', done).textContent = 'We send each one by hand, usually within a few hours. Check your inbox, and your spam folder if it’s not there by tomorrow.'
          + (wants.includes('team') ? ' Team sharing is next on our roadmap.' : '');
        done.focus({ preventScroll: true });
      } catch {
        joinError.textContent = 'That didn’t go through. Check your connection and try again.';
        joinError.hidden = false;
      } finally { btn.disabled = false; }
    });
  }

  /* "Get your invite" anywhere: scroll to the form, then focus the first question */
  $$('a[href="#join"]').forEach(a => a.addEventListener('click', () => {
    setTimeout(() => $('[data-join] input')?.focus({ preventScroll: true }), reduced ? 0 : 700);
  }));

  /* ── contact: a dialog from the nav, the FAQ and the footer. Email and message, each checked when you leave it (once it has
     something in it) and both on send, then a thank-you in place of the form. Reopening after a send starts fresh. */
  const contact = $('[data-contact]');
  if (contact) {
    const form = $('[data-contact-form]', contact), sent = $('[data-contact-done]', contact), sendError = $('[data-contact-error]', contact);
    const { email, message } = form.elements;
    const check = {
      email: v => !v ? 'Enter your email so we can reply.' : EMAIL.test(v) ? '' : 'That email doesn’t look right. Check it and try again.',
      message: v => v ? '' : 'Write a message first.',
    };
    // one field's error under it; returns whether the field is fine. A field that just turned bad shakes
    const mark = (field, nudge = true) => {
      const text = check[field.name](field.value.trim()), err = $(`#${field.id}-error`, contact);
      if (text && nudge && err.hidden) shake(field);
      err.textContent = text; err.hidden = !text;
      field.toggleAttribute('aria-invalid', !!text);
      return !text;
    };
    const clearMarks = () => [email, message].forEach(f => {
      f.removeAttribute('aria-invalid'); $(`#${f.id}-error`, contact).hidden = true;
    });
    [email, message].forEach(f => {
      // leaving a field checks it, unless it's still empty (that waits for Send) or you're closing the dialog
      f.addEventListener('blur', ev => {
        if (f.value.trim() && !ev.relatedTarget?.matches('[data-contact-close]')) mark(f);
      });
      // a flagged field re-checks as it's fixed, quietly
      f.addEventListener('input', () => { if (f.hasAttribute('aria-invalid')) mark(f, false); });
    });

    $$('[data-contact-open]').forEach(b => b.addEventListener('click', () => {
      if (!sent.hidden) { form.reset(); form.hidden = false; sent.hidden = true; }
      sendError.hidden = true; clearMarks();
      contact.showModal();
    }));
    $$('[data-contact-close]', contact).forEach(b => b.addEventListener('click', () => contact.close()));
    // a click on the backdrop lands on the dialog itself
    contact.addEventListener('click', ev => { if (ev.target === contact) contact.close(); });

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const bad = [email, message].filter(f => !mark(f, false));
      if (bad.length) { bad.forEach(shake); return bad[0].focus(); }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; sendError.hidden = true;
      try {
        await post({ email: email.value.trim(), message: message.value.trim(), website: form.elements.website.value }, CONTACT_ENDPOINT);
        window.posthog?.capture('contact_sent', { $set: { email: email.value.trim() } });
        form.hidden = true; sent.hidden = false;
        sent.focus();
      } catch {
        sendError.textContent = 'That didn’t go through. Check your connection and try again.';
        sendError.hidden = false;
      } finally { btn.disabled = false; }
    });
  }
})();
