/* A walkthrough with a multiplayer cursor: a named cursor goes through a demo by itself, scene by scene, and clicks
   what a visitor would. Shared by the demos (Visuals, Celsia, Sanna, Muster): each loads it before its script.js and
   gives it its scenes at the end of script.js. It knows nothing of the demo itself.

   - A scene is one page of the demo: `enter` takes the cursor there (a click in the sidebar), then its `steps` run in
     order. `where()` says where the demo is now: a scene's index, or a number between two (2.5: past scene 2).
   - The visitor takes over the moment they press or type in the demo: the cursor fades out, and its step stops where it
     is. Their pointer can hover over the demo, or scroll it, while the cursor goes on. Once they've taken over, it comes
     back when they've been still for a while (no pressing, moving or scrolling), or have left the demo, and carries on
     from the page they're on: the first step on it that hasn't run yet, or else the next scene.
   - A step that ran to its end is done until the tour comes round again; one that was stopped runs again from its start.
   - It runs only for a fine pointer without reduced motion: on a phone, or with reduced motion, the demo is as before.
   - In the site's carousel it runs only in the middle card: it starts when its card first comes to the middle, stops
     and fades out where it is when the card moves to the side, and fades back in there and carries on when the card is
     back in the middle.

   Walkthrough({ name, color, scenes, where, tidy, loop }). `loop: false` is for a demo whose story ends (Sanna: all
   tasks complete): after the last scene the cursor leaves for good, and the demo is the visitor's. The cursor's look is
   here; the hover it gives what it points at (.is-walk-hover) is in each demo's CSS, a twin of each of the demo's own
   :hover rules.

   "You": in the site's work carousel, the visitor's own pointer over a card's picture or demo is a cursor in the same
   look, named You. This file draws it inside a demo; components/you-cursor.tsx draws it over the rest of the cards,
   with the same CSS (app/site.css). Both cursors are the same size on screen as the site's, whatever the scale the demo is shown at. */
(() => {
  const STOP = Symbol('stop')
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
  // What a visitor could press: the cursor shows its hover on it
  const PRESSABLE = 'button, a, [role="button"], [role="tab"], [role="checkbox"], [data-act]'
  const ARROW = '<svg class="walk__arrow" viewBox="0 0 24 24"><path d="M3.5 2.6 20.6 9.3a.6.6 0 0 1-.05 1.13l-7.3 2.3-2.3 7.3a.6.6 0 0 1-1.13.05L3.1 3a.33.33 0 0 1 .4-.4Z"/></svg>'
  const YOU = '#ef2b08' // components/you-cursor.tsx has the same
  // Drawn at 1 in a demo of its own; in the site's frame, at .77 of that on screen, as the site draws You
  const ON_SCREEN = 0.77
  const CSS = `
    .walk { position: fixed; left: 0; top: 0; z-index: 2147483000; pointer-events: none; opacity: 0; transition: opacity .3s cubic-bezier(.23, 1, .32, 1); will-change: transform; }
    .walk.is-on { opacity: 1; }
    .walk__in { position: absolute; left: 0; top: 0; transform: scale(var(--walk-scale, 1)); transform-origin: 0 0; }
    .walk__arrow { position: absolute; left: -3px; top: -3px; width: 26px; height: 26px; overflow: visible; fill: var(--walk); stroke: rgb(255 255 255 / .7); stroke-width: 2.8; stroke-linejoin: round; paint-order: stroke; filter: drop-shadow(0 1px 2px rgb(0 0 0 / .25)); transform-origin: 3px 3px; transition: transform .12s cubic-bezier(.23, 1, .32, 1); }
    .walk.is-pressing .walk__arrow { transform: scale(.84); }
    .walk__name { position: absolute; left: 15px; top: 13px; padding: 4px 9px; border-radius: 6px; background: var(--walk); color: #fff; font: 500 15px/1.3 "Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; letter-spacing: 0; white-space: nowrap; box-shadow: 0 0 0 1.5px rgb(255 255 255 / .7), 0 1px 3px rgb(0 0 0 / .25); }
    .walk.is-left .walk__name { left: auto; right: 8px; }
    .walk.is-up .walk__name { top: auto; bottom: 10px; }
    .walk__ring { position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border: 2px solid var(--walk); border-radius: 50%; animation: walk-ring .5s cubic-bezier(.23, 1, .32, 1) forwards; }
    @keyframes walk-ring { from { opacity: .9; transform: scale(.3); } to { opacity: 0; transform: scale(1.4); } }
    .walk--you { z-index: 2147483001; transition: none; }
    html.has-you, html.has-you * { cursor: none !important; }`
  let styled = false
  const addStyle = () => { if (styled) return; styled = true; const st = document.createElement('style'); st.textContent = CSS; document.head.append(st) }
  // The frame this demo is in on the site, if any (the same site, so its element can be read)
  const frame = (() => { try { return window.frameElement } catch { return null } })()
  // How much smaller than its own pixels the site shows the demo, read now and then: the carousel moves it
  let shown = 1, shownAt = 0
  const shownScale = () => {
    if (!frame) return 1
    const now = performance.now()
    if (now - shownAt > 250) { shownAt = now; shown = frame.getBoundingClientRect().width / (frame.offsetWidth || innerWidth) || 1 }
    return shown
  }
  const cursorScale = () => (frame ? ON_SCREEN / shownScale() : 1)
  // In the carousel, a demo is live only in the middle card: the carousel makes the others inert
  const holder = frame?.closest('.q-demo-frame')
  const centred = () => !holder?.inert
  // A cursor: an arrow and a name, over everything, never in the way of a click
  function makeCursor(name, color, extra = '') {
    addStyle()
    const el = document.createElement('div')
    el.className = `walk ${extra}`
    el.setAttribute('aria-hidden', 'true')
    el.style.setProperty('--walk', color)
    el.innerHTML = `<div class="walk__in">${ARROW}<span class="walk__name"></span></div>`
    el.querySelector('.walk__name').textContent = name
    document.body.append(el)
    // Moves it; the name sits below the arrow, to its right, and flips when that would leave the window
    return (x, y) => {
      const k = cursorScale()
      el.style.setProperty('--walk-scale', k.toFixed(3))
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      el.classList.toggle('is-left', x > innerWidth - 130 * k)
      el.classList.toggle('is-up', y > innerHeight - 56 * k)
      return el
    }
  }

  /* ── You: the visitor's pointer, in a demo in the site's carousel. Only for a mouse: a touch has no pointer to show ── */
  if (frame?.closest('.q-car') && matchMedia('(pointer: fine)').matches) {
    const put = makeCursor('You', YOU, 'walk--you')
    const you = put(-100, -100)
    document.documentElement.classList.add('has-you')
    const show = (e) => { if (e.pointerType === 'mouse') put(e.clientX, e.clientY).classList.add('is-on') }
    addEventListener('pointermove', show, { passive: true, capture: true })
    addEventListener('pointerdown', show, { passive: true, capture: true })
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) you.classList.remove('is-on') })
  }

  window.Walkthrough = function Walkthrough({ name, color, scenes, where, tidy = async () => {}, loop = true, start = 1400, idle = 5000, away = 1500, rest = 1500 }) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer: fine)').matches) return

    /* ── the cursor ── */
    let active = false
    const put = makeCursor(name, color)
    const el = put(innerWidth * 0.72, innerHeight * 0.8)
    let x = innerWidth * 0.72
    let y = innerHeight * 0.8
    const place = () => {
      x = Math.min(innerWidth - 2, Math.max(2, x))
      y = Math.min(innerHeight - 2, Math.max(2, y))
      put(x, y)
    }
    place()

    /* ── while the cursor drives, the demo stays in its frame: what it presses can't scroll the site's page around the
       demo (scrollIntoView scrolls every frame up to the top one), or take the keyboard from it (focus()). The visitor
       isn't typing, so a field that opens doesn't need the focus ── */
    const nativeFocus = HTMLElement.prototype.focus
    HTMLElement.prototype.focus = function (o) { if (!active) nativeFocus.call(this, o) }
    const nativeInto = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (o) { if (active) scrollWithin(this, o); else nativeInto.call(this, o) }
    // Scrolls only the nearest box that scrolls, so `node` shows: as scrollIntoView does, inside the demo
    function scrollWithin(node, o = {}) {
      const opt = typeof o === 'object' ? o : { block: o === false ? 'end' : 'start' }
      for (let box = node.parentElement; box; box = box.parentElement) {
        if (!/(auto|scroll)/.test(getComputedStyle(box).overflowY) || box.scrollHeight <= box.clientHeight) continue
        const r = node.getBoundingClientRect(), b = box.getBoundingClientRect()
        const block = opt.block ?? 'start'
        if (opt.ifNeeded && r.top >= b.top + 8 && r.bottom <= b.bottom - 8) return false
        let d = 0
        if (block === 'start') d = r.top - b.top
        else if (block === 'center') d = r.top + r.height / 2 - (b.top + b.height / 2)
        else if (block === 'end') d = r.bottom - b.bottom
        else if (r.top < b.top + 8) d = r.top - b.top - 8
        else if (r.bottom > b.bottom - 8) d = r.bottom - b.bottom + 8
        if (d) box.scrollBy({ top: d, behavior: opt.behavior === 'smooth' ? 'smooth' : 'auto' })
        return Boolean(d)
      }
      return false
    }

    /* ── one run at a time: taking over ends the run, and every wait in it checks it's still the run ── */
    let run = 0
    const alive = (id) => { if (id !== run) throw STOP }
    const pause = async (id, ms) => { await sleep(ms); alive(id) }
    async function until(id, test, ms = 15000) {
      for (const end = Date.now() + ms; Date.now() < end; await pause(id, 100)) if (test()) return true
      return false
    }

    // A target is an element, a selector, or a function that finds one when the step gets there (pages draw again)
    const find = (target) => (typeof target === 'function' ? target() : typeof target === 'string' ? document.querySelector(target) : target)
    // Where on it to point: a little left of the middle on a wide one, as a hand would, and never outside the window
    function pointOf(node, at) {
      // A value that wraps in a paragraph: its first line
      const r = node.getClientRects()[0] ?? node.getBoundingClientRect()
      const px = at?.x ?? (r.width > 120 ? Math.min(r.width * 0.3, 60) : r.width * 0.5)
      const py = at?.y ?? r.height * 0.5
      return { x: Math.min(innerWidth - 6, Math.max(6, r.left + px)), y: Math.min(innerHeight - 6, Math.max(6, r.top + py)) }
    }

    /* ── hover: what's under the cursor gets the pointer's events (the tag graph listens to them) and a hover look ── */
    let hovered
    let chain = []
    function hoverAt() {
      const under = document.elementFromPoint(x, y)
      const press = under?.closest(PRESSABLE)
      if (hovered !== press) { hovered?.classList.remove('is-walk-hover'); press?.classList.add('is-walk-hover'); hovered = press }
      if (!under || under === chain[0]) return
      // As a browser does: pointerleave on each element the pointer has left, then pointerover where it is
      for (const old of chain) if (old.isConnected && !old.contains(under)) old.dispatchEvent(new PointerEvent('pointerleave', { clientX: x, clientY: y }))
      under.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: x, clientY: y }))
      chain = []
      for (let n = under; n; n = n.parentElement) chain.push(n)
    }
    function unhover() {
      hovered?.classList.remove('is-walk-hover')
      hovered = undefined
      for (const old of chain) if (old.isConnected) old.dispatchEvent(new PointerEvent('pointerleave', { clientX: x, clientY: y }))
      chain = []
    }

    /* ── moving: an ease in and out, along a slight curve, slower the further it goes ── */
    async function move(id, target, at) {
      const node = find(target)
      if (!node) return undefined
      const to = pointOf(node, at)
      const from = { x, y }
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      if (dist > 2) {
        const ms = Math.min(1100, 320 + dist * 0.75)
        const bend = Math.min(60, dist * 0.12) * (to.x > from.x ? 1 : -1)
        const t0 = performance.now()
        await new Promise((done) => {
          const frame = (now) => {
            if (id !== run) return done()
            const t = Math.min(1, (now - t0) / ms)
            const k = ease(t)
            const arc = Math.sin(Math.PI * t) * bend
            x = from.x + (to.x - from.x) * k - ((to.y - from.y) / (dist || 1)) * arc
            y = from.y + (to.y - from.y) * k + ((to.x - from.x) / (dist || 1)) * arc
            place()
            if (t < 1) requestAnimationFrame(frame)
            else done()
          }
          requestAnimationFrame(frame)
        })
        alive(id)
      }
      hoverAt()
      return node
    }
    // A press: the arrow dips, a ring spreads from its tip, then the click lands on what's under it
    async function click(id, target, at) {
      const node = await move(id, target, at)
      if (!node) return false
      await pause(id, 140)
      el.classList.add('is-pressing')
      const ring = document.createElement('i')
      ring.className = 'walk__ring'
      el.firstElementChild.append(ring)
      setTimeout(() => ring.remove(), 600)
      await pause(id, 110)
      el.classList.remove('is-pressing')
      const live = find(target) ?? node
      if (!live.isConnected) return false
      live.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, detail: 1, clientX: x, clientY: y }))
      await pause(id, 60)
      hoverAt()
      return true
    }
    // Steps out of the way of what it just started, such as an answer being written where it pressed
    async function aside(id, dx = -80, dy = 40) {
      const node = document.elementFromPoint(Math.max(6, x + dx), Math.min(innerHeight - 6, y + dy)) ?? document.body
      await move(id, node, { x: x + dx - node.getBoundingClientRect().left, y: y + dy - node.getBoundingClientRect().top })
    }
    // Types into a field a few letters at a time, as the page would hear a person type
    async function type(id, field, text) {
      const node = find(field)
      if (!node) return
      for (let i = 1; i <= text.length; i++) {
        node.value = text.slice(0, i)
        node.dispatchEvent(new InputEvent('input', { bubbles: true, data: text[i - 1], inputType: 'insertText' }))
        await pause(id, 60 + Math.random() * 70)
      }
    }
    // Scrolls what's next into the middle of its box, smoothly, when it isn't in view
    async function show(id, target) {
      const node = find(target)
      if (node && scrollWithin(node, { block: 'center', behavior: 'smooth', ifNeeded: true })) await pause(id, 650)
      return node
    }
    // Scrolls a box smoothly, as a trackpad would
    async function scroll(id, box, by) {
      const node = find(box)
      if (!node) return
      node.scrollBy({ top: by, behavior: 'smooth' })
      await pause(id, 750)
    }

    /* ── the tour ── */
    const done = new Set()
    let scene = 0
    let skipEnter = false
    // Where to carry on: the page the demo is on, if it's a scene, else the next scene after it
    function resumeAt() {
      const pos = where()
      if (pos === undefined) return
      if (Number.isInteger(pos)) { scene = pos; skipEnter = true } else { scene = Math.ceil(pos); skipEnter = false }
      if (scene >= scenes.length) { scene = 0; skipEnter = false; done.clear() }
    }
    async function tour(id) {
      const w = {
        move: (t, at) => move(id, t, at),
        click: (t, at) => click(id, t, at),
        hover: (t, at) => move(id, t, at),
        aside: (dx, dy) => aside(id, dx, dy),
        type: (field, text) => type(id, field, text),
        show: (t) => show(id, t),
        scroll: (box, by) => scroll(id, box, by),
        pause: (ms) => pause(id, ms),
        until: (test, ms) => until(id, test, ms),
      }
      await tidy(w)
      for (;;) {
        const s = scenes[scene]
        if (!skipEnter) { await s.enter(w); await w.pause(700) }
        skipEnter = false
        for (const [i, step] of s.steps.entries()) {
          const key = `${scene}:${i}`
          if (done.has(key)) continue
          await step(w)
          done.add(key)
        }
        scene++
        if (scene === scenes.length) {
          if (!loop) { await w.pause(1200); over = true; stop(); return }
          // Round again, after a rest, as if from the start
          await w.pause(rest)
          scene = 0
          done.clear()
        }
      }
    }
    let over = false
    function go() {
      if (active || over || !centred()) return
      active = true
      const id = ++run
      resumeAt()
      el.classList.add('is-on')
      tour(id).catch((e) => { if (e !== STOP) console.error(e) })
    }
    function stop() {
      if (!active) return
      active = false
      run++
      unhover()
      el.classList.remove('is-on', 'is-pressing')
    }
    // Its card left the middle: its step stops there and the cursor fades out where it is, to fade back in there when
    // the card is back (a side card shows no one's cursor)
    function hold() {
      if (!active) return
      active = false
      run++
      unhover()
      el.classList.remove('is-on', 'is-pressing')
    }

    /* ── the visitor: a press or a key takes over; then stillness, or leaving the demo, gives the tour back ── */
    let timer
    let taken = false
    const later = (ms) => { clearTimeout(timer); timer = setTimeout(() => { taken = false; go() }, ms) }
    const takeOver = (e) => {
      if (!e.isTrusted) return
      taken = true
      stop()
      later(idle)
    }
    // Hovering or scrolling doesn't take over, but once the visitor has, it keeps the demo theirs a while longer
    let last = { x: -1, y: -1 }
    const busy = (e) => {
      if (!e.isTrusted || !taken) return
      // A page scrolling under a still pointer can send a move: only a real one counts
      if (e.type === 'pointermove') {
        if (e.clientX === last.x && e.clientY === last.y) return
        last = { x: e.clientX, y: e.clientY }
      }
      later(idle)
    }
    for (const type of ['pointerdown', 'keydown', 'touchstart']) addEventListener(type, takeOver, { passive: true, capture: true })
    for (const type of ['pointermove', 'wheel']) addEventListener(type, busy, { passive: true, capture: true })
    document.addEventListener('mouseout', (e) => { if (e.isTrusted && !e.relatedTarget && taken) later(away) })
    // In the carousel it starts when its card comes to the middle, stops and hides when the card leaves it, and carries
    // on when the card is back
    // The carousel switches inert as the card passes halfway to the middle, so it starts a moment later, as it settles
    let wasCentred = centred()
    if (wasCentred) later(start)
    if (holder) new MutationObserver(() => {
      const now = centred()
      if (now === wasCentred) return
      wasCentred = now
      if (!now) { clearTimeout(timer); hold() } else later(300)
    }).observe(holder, { attributes: true, attributeFilter: ['inert'] })
  }
})()
