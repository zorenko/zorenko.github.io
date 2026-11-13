/* The Visuals demo (index.html says what it is). One state object; the sidebar, the page, an open picture and the dialogs
   each draw from it. A sort changes the tiles in place, so the tags it gives can show on each tile for a moment. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const appOnly = document.documentElement.classList.contains('is-app-only')
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms))
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const $ = (sel, root = document) => root.querySelector(sel)

  /* ── icons (Lucide, as Visuals uses) ── */
  const PATHS = {
    house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    tags: '<path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"/><path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"/><circle cx="10.5" cy="6.5" r=".5" fill="currentColor"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    up: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    down: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    again: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    move: '<path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.73"/><path d="M2 13h10"/><path d="m9 16 3-3-3-3"/>',
    minus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    shapes: '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    listplus: '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
    columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pipette: '<path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  }
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`
  const spinner = () => icon('spin', 'spin')

  /* ── colours: Visuals' palette (src/lib/domain/schema/colors.schema.ts): 10 families of 5 shades, light to dark, in
     OKLCH. A picture names the ones it has, as 'family.shade', 0 to 4 ── */
  const FAMILIES = {
    red: [25, [0.93, 0.8, 0.64, 0.5, 0.36], [0.04, 0.1, 0.2, 0.17, 0.11]],
    orange: [55, [0.94, 0.86, 0.76, 0.64, 0.5], [0.04, 0.09, 0.16, 0.16, 0.13]],
    yellow: [98, [0.97, 0.93, 0.87, 0.75, 0.6], [0.05, 0.11, 0.17, 0.15, 0.11]],
    green: [145, [0.94, 0.84, 0.7, 0.55, 0.38], [0.04, 0.1, 0.16, 0.13, 0.09]],
    teal: [195, [0.94, 0.85, 0.72, 0.56, 0.38], [0.03, 0.07, 0.11, 0.09, 0.07]],
    blue: [255, [0.94, 0.85, 0.63, 0.47, 0.32], [0.03, 0.075, 0.16, 0.16, 0.11]],
    purple: [315, [0.93, 0.8, 0.63, 0.48, 0.33], [0.04, 0.09, 0.16, 0.15, 0.1]],
    pink: [357, [0.94, 0.84, 0.72, 0.58, 0.42], [0.04, 0.08, 0.15, 0.15, 0.1]],
    brown: [70, [0.92, 0.78, 0.63, 0.5, 0.4], [0.035, 0.06, 0.08, 0.08, 0.07]],
    grey: [0, [0.97, 0.82, 0.62, 0.4, 0.22], [0, 0, 0, 0, 0]],
  }
  const SHADE_WORDS = ['pale', 'light', '', 'deep', 'dark']
  const OWN_NAMES = { brown: ['beige', 'tan', 'brown', 'deep brown', 'dark brown'], grey: ['white', 'light gray', 'gray', 'dark gray', 'black'] }
  const swatchName = (key) => {
    const [f, s] = key.split('.')
    return OWN_NAMES[f]?.[s] ?? (SHADE_WORDS[s] ? `${SHADE_WORDS[s]} ${f}` : f)
  }
  const swatchLight = (key) => { const [f, s] = key.split('.'); return FAMILIES[f][1][s] }
  const swatchHex = (key) => { const [f, s] = key.split('.'); const [h, l, c] = FAMILIES[f]; return `oklch(${l[s]} ${c[s]} ${h})` }

  /* ── tags, of three kinds ── */
  const KINDS = { what: 'What', style: 'Style', subject: 'Subject' }
  const TAG_KIND = {
    poster: 'what', interface: 'what', dashboard: 'what', 'brand system': 'what', 'landing page': 'what', website: 'what', tool: 'what',
    mobile: 'what', illustration: 'what', drawing: 'what', '3d': 'what', gradient: 'what', print: 'what', type: 'what', photography: 'what', collage: 'what',
    'dark mode': 'style', light: 'style', serif: 'style', minimal: 'style', lines: 'style', geometric: 'style', isometric: 'style', grain: 'style',
    chrome: 'style', soft: 'style', bold: 'style', editorial: 'style', skeuomorphic: 'style', pixel: 'style', motion: 'style',
    architecture: 'subject', flowers: 'subject', fruit: 'subject', birds: 'subject', night: 'subject', map: 'subject', data: 'subject',
  }
  const kindOf = (t) => TAG_KIND[t] ?? 'style'

  /* ── the tag graph, as Visuals draws it (tag-graph.ts): a dot is a tag, larger and darker on more pictures; a line joins
     two tags on the same pictures, each tag's 3 strongest. Every tag is a circle, and its color says its kind: What
     in the brand's yellow green, Style and Subject in colors that go with it (styles.css). The dots are a little
     smaller than the app's. The layout is a few hundred steps of
     forces from a spiral, with no randomness, so the same tags give the same graph ── */
  const G = { width: 428, edge: 16, lowest: 160, small: 3, large: 8.5, steps: 300, labelSteps: 60, gap: 6, bend: 0.12 }
  const NAME_SIZE = { large: 12.5, middle: 12, small: 11.5 }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  const r1 = (v) => Math.round(v * 10) / 10
  function graphOf(tags, links) {
    const most = Math.max(1, ...tags.map((t) => t.count))
    const shares = tags.map((t) => Math.sqrt(t.count / most))
    const radii = shares.map((sh) => G.small + (G.large - G.small) * sh)
    const tiers = shares.map((sh) => (sh > 0.6 ? 'large' : sh > 0.4 ? 'middle' : 'small'))
    const boxes = tags.map((t, i) => ({ left: radii[i], right: radii[i] + G.gap + t.name.length * NAME_SIZE[tiers[i]] * 0.56, half: Math.max(radii[i], 8) }))
    const index = new Map(tags.map((t, i) => [t.key, i]))
    const pairs = links.flatMap((l) => (index.has(l.first) && index.has(l.second) ? [{ from: index.get(l.first), to: index.get(l.second), strength: l.strength }] : []))
    const degrees = tags.map((_, i) => pairs.filter((p) => p.from === i || p.to === i).length)
    const mid = { x: G.width / 2, y: 0 }
    const bodies = tags.map((_, i) => { const a = i * 2.399963; const d = 30 * Math.sqrt(i); return { x: mid.x + Math.cos(a) * d, y: Math.sin(a) * d, vx: 0, vy: 0 } })
    const cx = (b, i) => b.x + (boxes[i].right - boxes[i].left) / 2
    const inside = (b, i) => { b.x = clamp(b.x, G.edge + boxes[i].left, G.width - G.edge - boxes[i].right) }
    const separate = (i, j, share) => {
      const a = bodies[i], b = bodies[j], A = boxes[i], B = boxes[j]
      const ox = Math.min(a.x + A.right, b.x + B.right) - Math.max(a.x - A.left, b.x - B.left) + 6
      const oy = Math.min(a.y + A.half, b.y + B.half) - Math.max(a.y - A.half, b.y - B.half) + 4
      if (ox <= 0 || oy <= 0) return
      const vertical = oy <= ox * 2
      const apart = vertical ? a.y - b.y : cx(a, i) - cx(b, j)
      const half = ((vertical ? oy : ox) / 2) * share * (apart > 0 || (apart === 0 && i < j) ? 1 : -1)
      if (vertical) { a.y += half; b.y -= half } else { a.x += half; b.x -= half }
    }
    for (let step = 0; step < G.steps; step++) {
      const heat = 1 - step / G.steps
      bodies.forEach((b, i) => {
        for (let j = i + 1; j < bodies.length; j++) {
          const o = bodies[j]
          const dx = cx(b, i) - cx(o, j), dy = b.y - o.y
          const push = (200 * heat) / Math.max(16, dx * dx + dy * dy)
          b.vx += dx * push; b.vy += dy * push; o.vx -= dx * push; o.vy -= dy * push
        }
      })
      for (const { from, to, strength } of pairs) {
        const a = bodies[from], b = bodies[to]
        const dx = b.x + b.vx - a.x - a.vx, dy = b.y + b.vy - a.y - a.vy
        const dist = Math.max(1, Math.hypot(dx, dy))
        const wanted = radii[from] + radii[to] + 80 - 46 * strength
        const stiff = (0.7 * heat) / Math.max(1, Math.min(degrees[from], degrees[to]))
        const move = ((dist - wanted) / dist) * stiff
        const shareB = degrees[from] / (degrees[from] + degrees[to])
        b.vx -= dx * move * shareB; b.vy -= dy * move * shareB
        a.vx += dx * move * (1 - shareB); a.vy += dy * move * (1 - shareB)
      }
      bodies.forEach((b, i) => {
        b.vx += (mid.x - cx(b, i)) * 0.07 * heat; b.vy += (mid.y - b.y) * 0.05 * heat
        b.vx *= 0.6; b.vy *= 0.6; b.x += b.vx; b.y += b.vy
      })
      bodies.forEach((_, i) => { for (let j = i + 1; j < bodies.length; j++) separate(i, j, 0.5) })
      bodies.forEach(inside)
    }
    for (let step = 0; step < G.labelSteps; step++) {
      bodies.forEach((_, i) => { for (let j = i + 1; j < bodies.length; j++) separate(i, j, 1) })
      bodies.forEach(inside)
    }
    const top = Math.min(...bodies.map((b, i) => b.y - boxes[i].half))
    const bottom = Math.max(...bodies.map((b, i) => b.y + boxes[i].half))
    const left = Math.min(...bodies.map((b, i) => b.x - boxes[i].left))
    const right = Math.max(...bodies.map((b, i) => b.x + boxes[i].right))
    const height = tags.length ? Math.max(G.lowest, bottom - top + 2 * G.edge) : G.lowest
    const sx = tags.length ? (G.width - right - left) / 2 : 0
    const sy = tags.length ? (height - bottom - top) / 2 : 0
    const nodes = tags.map((t, i) => ({ ...t, x: bodies[i].x + sx, y: bodies[i].y + sy, radius: radii[i], share: shares[i], tier: tiers[i] }))
    return { nodes, height, links: links.flatMap((l) => (index.has(l.first) && index.has(l.second) ? [{ ...l, from: nodes[index.get(l.first)], to: nodes[index.get(l.second)] }] : [])) }
  }
  const linkPath = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y
    return `M${r1(a.x)} ${r1(a.y)}Q${r1((a.x + b.x) / 2 - dy * G.bend)} ${r1((a.y + b.y) / 2 + dx * G.bend)} ${r1(b.x)} ${r1(b.y)}`
  }
  function circlePath({ x, y, radius }) {
    const r = r1(radius)
    return `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 0 0 ${r1(2 * r)} 0a${r} ${r} 0 0 0 ${r1(-2 * r)} 0Z`
  }

  /* ── the library, newest first: posts saved from X and Pinterest (pictures.js). A post of several pictures is one tile,
     a slider. `pending` are the tags a sort gives: a new picture has none yet. With the Mac (no ?app), the last six are
     on a page in Safari instead, to save from there ── */
  const POSTS = window.VISUALS_POSTS.map((p) => ({
    ...p, w: p.files[0].w, h: p.files[0].h, src: p.files[0].src,
    tags: p.isNew ? [] : p.tags, pending: p.tags, isNew: Boolean(p.isNew),
  }))
  const PLATES = appOnly ? [] : POSTS.slice(-6)
  const PICS = POSTS.filter((p) => !PLATES.includes(p))
  const byId = (id) => S.pics.find((p) => p.id === id) ?? PLATES.find((p) => p.id === id)

  /* ── buckets: the pictures of a project. A template gives a new bucket its sections, which say what each picture is
     for, so Ask takes from each picture only that part ── */
  const TEMPLATES = {
    none: { name: 'No sections', sections: [] },
    product: { name: 'Product design', sections: ['Layout', 'Typography', 'Color', 'Components', 'Illustration style', 'Motion'] },
    branding: { name: 'Branding project', sections: ['Logo', 'Typography', 'Color', 'Imagery', 'Layout', 'Illustration style'] },
    website: { name: 'Website', sections: ['Hero', 'Layout', 'Typography', 'Color', 'Imagery', 'Motion'] },
  }
  const PART = { Logo: 'look', Typography: 'type', Color: 'palette', Imagery: 'look', Layout: 'layout', 'Illustration style': 'look', Components: 'look', Hero: 'layout', Motion: 'look' }
  let bucketSeq = 0
  const makeBucket = (name, template, fill = {}, loose = []) => {
    const sections = TEMPLATES[template].sections.map((s) => ({ name: s, ids: [...(fill[s] ?? [])] }))
    return { id: `b${++bucketSeq}`, name, sections, ids: [...loose, ...sections.flatMap((s) => s.ids)] }
  }
  const sectionOf = (b, id) => b.sections.find((s) => s.ids.includes(id))
  const looseOf = (b) => b.ids.filter((id) => !sectionOf(b, id))
  const orderOf = (b) => [...b.sections.flatMap((s) => s.ids), ...looseOf(b)]

  /* ── brand projects (Visuals 0.16): a bucket with a brief. Its page is one grid, a row for each section and a column for
     each direction, with the pictures in no direction at the bottom. The panel on the right is the brief, in tabs:
     Overview, Constraints and wishes, then each direction. Generate asks Claude Code to fill in a tab's empty fields,
     never over the person's text. A picture has a comment: what the person likes in it and what they don't ── */
  const FIRST_SECTION = 'Illustration and imagery'
  const MORE_SECTIONS = ['Logo', 'Typography', 'Color and texture', 'Layout', 'Photography', 'Iconography', 'Motion']
  const Q = (id, label, placeholder) => ({ id, label, placeholder })
  const BRIEF_PARTS = [
    { name: 'The company', qs: [Q('company', 'What it does', "What it does, for whom, what's different, what stage. One paragraph."), Q('surprise', 'The thing a customer would be surprised to learn', 'A fact about the business that few people know.'), Q('name', 'Name', 'Final, or a working name')] },
    { name: 'Audience', qs: [Q('audience', 'Who the brand must win over first', 'Buyers, investors, hires…'), Q('belief', 'What they believe today, and what they should believe after one look', 'Today they think… After one look, they think…')] },
    { name: 'What the brand has to do', qs: [Q('first', 'First', 'The most important job of the brand'), Q('second', 'Second', 'The next job'), Q('personality', 'Personality', '3–5 words'), Q('never', 'Never', '3–5 words')] },
    { name: 'What exists already', qs: [Q('keep', 'Keep', 'Logo, colour, typeface, symbol, photography, or "nothing"'), Q('free', 'Free to change', 'What can change')] },
    { name: 'The world it draws from', qs: [Q('world', 'Real things from this business that could appear in the pictures', 'One on each line: an object, a place, a process, a document, a material')] },
    { name: 'Constraints and wishes', qs: [Q('stay-away', 'Stay away from', 'Competitors, and what about them'), Q('must-be-happy', 'Must be happy', 'Who, and what they want'), Q('type', 'Type', 'Free fonts only? Anything loved or banned'), Q('languages', 'Languages', 'English, German…'), Q('applications', 'First applications', 'Website hero, social post, report cover, signage…'), Q('never-say', 'Never say', 'Words or topics the brand avoids')] },
  ]
  const DIRECTION_QS = [Q('drawn', "What's drawn", 'The objects, people or scenes'), Q('angle', 'From what angle', 'Isometric, front-on, aerial, close-up'), Q('line', 'Line', 'Weight, colour, or none'),
    Q('colours', 'Colours, and which one is the accent', 'Two greens, and a red accent'), Q('texture', 'Texture', 'Paper grain, gradients, shaders, or none'), Q('layout', 'Layout', 'One object centred in lots of space'),
    Q('never-appears', 'Never appears', 'What the pictures never show'), Q('feels-like', 'Feels like', 'Like X, not Y')]
  // What Generate writes in the demo: Claude Code's answers from the brief and the references
  const GENERATED = {
    surprise: 'Most of the collection is drawings of things that were never built: only one in ten was ever made.',
    audience: 'People in Oslo from 25 to 45 who go to galleries, but not to design museums.',
    belief: "Today they think it's a quiet place for experts. After one look, they think it's where you see how things get made.",
    first: 'Make people want to visit the new building.',
    second: 'Show the collection as working drawings, not as relics.',
    personality: 'Curious, exact, generous, calm',
    never: 'Stiff, nostalgic, loud, corporate',
    keep: 'Nothing',
    free: 'Everything: the name, the mark, the colours and the type',
    world: 'Axonometric drawings\nPlaster models\nThe archive drawers\nPoster proofs\nThe concrete of the new building',
    'stay-away': "Other museums' white-cube minimalism, and tech brands' gradients",
    'must-be-happy': 'The director, who wants the collection at the centre, not the building',
    type: 'Free fonts only. A serif is welcome.',
    applications: 'Opening posters, the website hero, signs in the building, the ticket',
    'never-say': 'Iconic, timeless, world-class',
    d1: { drawn: 'Creatures and objects from the collection, cast in silver', angle: 'Front-on and close up', line: 'None: the form comes from light on metal', colours: 'Black and silver, with a vermilion accent',
      texture: 'Polished chrome, soft reflections', layout: 'One subject fills the frame, and a small label points at it', 'never-appears': 'People, and photographs of the building', 'feels-like': 'Like a reliquary, not a sci-fi game' },
    d2: { drawn: 'Buildings as axonometric drawings, and type set large', angle: 'Axonometric and front-on', line: 'Hairline, black', colours: 'Paper white and black, with an orange accent',
      texture: 'Paper grain', layout: 'An editorial grid with a lot of margin', 'never-appears': 'Gradients and 3D renders', 'feels-like': 'Like an archive, not a startup' },
    other: { drawn: 'Objects from the collection, one at a time', angle: 'Front-on', line: 'Fine, black', colours: 'Two neutrals and one accent from the palette',
      texture: 'None', layout: 'One object centred in a lot of space', 'never-appears': 'Stock photography', 'feels-like': 'Like a catalogue, not an advert' },
  }
  const makeProject = (id, name, sections, directions, place, answers = {}) => ({
    id, name, answers, directions, sections: sections.map((n) => ({ name: n, folded: false })),
    place: Object.fromEntries(Object.entries(place).map(([pid, [sec, dir]]) => [pid, { s: sec, d: dir }])), ids: Object.keys(place),
  })
  // The pictures in a cell of the grid: a section in a direction
  const cellOf = (pr, sec, dir) => pr.ids.filter((id) => pr.place[id].s === sec && pr.place[id].d === dir)

  /* ── state ── */
  const S = {
    front: 'app',
    page: 'pictures', // pictures | tag | tags | colors | project | bucket
    tag: undefined, // the tag of the tag page
    bucket: undefined, // the id of the bucket page
    project: undefined, // the id of the brand project page
    projects: [
      makeProject('p1', 'Museum brand', [FIRST_SECTION, 'Logo', 'Typography', 'Color and texture', 'Layout'], [
        { id: 'd1', name: 'Silver myth', answers: {}, palette: [['#111215', 8], ['#b9bcc2', 6], ['#c8402e', 3], ['#d39a3c', 2]] },
        { id: 'd2', name: 'Paper and stone', answers: {}, palette: [['#f2efe8', 7], ['#1c1c1c', 5], ['#e8622c', 3], ['#b8a58c', 2]] },
      ], {
        sishen: [FIRST_SECTION, 'd1'], golden: [FIRST_SECTION, 'd1'], garden: [FIRST_SECTION, 'd1'], ando: [FIRST_SECTION, 'd2'],
        dynamic: ['Logo', 'd1'], guide: ['Logo', 'd2'], agu: ['Typography', 'd1'], answer: ['Typography', 'd2'],
        polar: ['Color and texture', 'd1'], sun: ['Color and texture', 'd2'], iso: ['Layout', 'd1'], achievable: ['Layout', 'd2'], lines: [FIRST_SECTION, undefined],
      }, {
        company: 'A museum of design and architecture in Oslo: drawings, models and posters from 1900 until now. It opens a new building by the fjord in 2027.',
        name: 'Formhuset, a working name',
        languages: 'Norwegian and English',
      }),
    ],
    briefTab: 'overview', // overview | constraints | a direction's id
    gen: undefined, // Generate, while it runs: { tab, busy }
    comments: { sishen: { like: 'The silver, and the one red block', dislike: '' } },
    commentOpen: undefined, // the picture whose comment is open
    hoverTag: undefined, // the tag under the pointer in the graph
    sectionMenu: false,
    pics: PICS,
    buckets: [
      makeBucket('App redesign', 'product', { Layout: ['drones', 'storage'], Color: ['nightshift'], Components: ['widgets', 'cards'], Motion: ['microtext', 'motionsection'] }),
    ],
    favs: ['poster', 'brand system', 'interface', '3d'],
    useful: new Set(),
    notUseful: new Set(),
    sorting: false,
    progress: '',
    open: undefined, // id of the open picture
    openList: [],
    ask: { mode: 'summary', busy: false },
    answers: {}, // picture | bucket: { asked, text, shown, busy }
    tagDraft: false,
    tagSel: undefined,
    colorSel: 'red.2', // Colors always shows one color's pictures
    menu: false,
    slides: {}, // the picture that a post's tile shows: its index
    sel: new Set(), // selected tiles
    selLast: undefined,
    barMenu: undefined, // add | move | template
    draft: undefined, // a new bucket: { name, template }
    layer: undefined, // search | paste
    saved: new Set(),
    arriving: new Set(),
    seen: new Set(['page:pictures']), // the sidebar's pages the person has opened: the coach ring points at the next one
    coach: undefined, // the Mac desktop's steps, after the pages: safari | save | visuals
  }
  const bucketById = (id) => S.buckets.find((b) => b.id === id)
  const projectById = (id) => S.projects.find((b) => b.id === id)
  const holderById = (id) => projectById(id) ?? bucketById(id)

  const desk = $('[data-desk]')
  const side = $('[data-side]')
  const panel = $('[data-panel]')
  const layer = $('[data-layer]')

  const countOf = (tag) => S.pics.filter((p) => p.tags.includes(tag)).length
  const allTags = () => {
    const m = new Map()
    for (const p of S.pics) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }
  const allColors = () => {
    const m = new Map()
    for (const p of S.pics) if (!p.isNew) for (const c of p.colors) m.set(c, (m.get(c) ?? 0) + 1)
    return m
  }
  const newCount = () => S.pics.filter((p) => p.isNew).length
  const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`

  /* ── the sidebar ── */
  function renderSide() {
    const row = (act, arg, ico, name, count, current) =>
      `<button type="button" class="row" data-act="${act}" ${arg ? `data-arg="${esc(arg)}"` : ''} ${current ? 'aria-current="page"' : ''}>${icon(ico)}<span class="row__name">${esc(name)}</span>${count !== undefined ? `<span class="count">${count}</span>` : ''}</button>`
    const tagsN = allTags().length
    const colorsN = allColors().size
    side.innerHTML = `
      <div class="side__top">
        <div class="brand"><img src="assets/mark.svg" alt="" width="20" height="20" />Visuals
          ${S.sorting ? `<span class="iconbtn iconbtn--sm" title="${esc(S.progress)} Claude Code looks at each one." style="margin-left:auto">${spinner()}</span>` : ''}
          <button type="button" class="iconbtn iconbtn--sm" data-act="paste" aria-label="Save a link" title="Paste a link to save" ${S.sorting ? 'style="margin-left:0"' : ''}>${icon('plus')}</button>
        </div>
        <button type="button" class="search-row" data-act="search" aria-keyshortcuts="Meta+K">${icon('search')}<span>Search</span><kbd>⌘K</kbd></button>
      </div>
      <div class="side__group">
        ${row('page', 'pictures', 'grid', 'All pictures', S.pics.length, S.page === 'pictures')}
        ${row('page', 'tags', 'tags', 'Tags', tagsN || undefined, S.page === 'tags')}
        ${row('page', 'colors', 'palette', 'Colors', colorsN || undefined, S.page === 'colors')}
      </div>
      ${S.favs.length ? `<div class="side__group"><div class="side__head">Favourites <span class="count">${S.favs.length}</span></div>
        ${S.favs.map((t) => row('tag', t, 'tag', t, countOf(t), S.page === 'tag' && S.tag === t)).join('')}</div>` : ''}
      <div class="side__group"><div class="side__head">Brand projects <span class="count">${S.projects.length}</span>
          <button type="button" class="iconbtn iconbtn--xs side__add" data-act="new-project" aria-label="New brand project" title="New brand project">${icon('plus')}</button></div>
        ${S.projects.map((b) => row('project', b.id, 'shapes', b.name, b.ids.length, S.page === 'project' && S.project === b.id)).join('')}</div>
      ${S.buckets.length ? `<div class="side__group"><div class="side__head">Buckets <span class="count">${S.buckets.length}</span></div>
        ${S.buckets.map((b) => row('bucket', b.id, 'box', b.name, b.ids.length, S.page === 'bucket' && S.bucket === b.id)).join('')}</div>` : ''}
      <div class="side__group side__foot"><span class="row is-static" aria-disabled="true" title="Not in this demo">${icon('settings')}<span class="row__name">Settings</span></span></div>`
    renderCoach()
  }

  /* ── the page ── */
  // A post of several pictures is a slider: the first one gives the tile its shape, another covers it, cropped. Its
  // arrows show on hover and go round; dots say which one shows. A video shows its still, with a small mark.
  const tileLabel = (p, i) => [p.isNew ? 'New' : '', p.files[i].video ? 'Video' : '', p.title, p.site, p.files.length > 1 ? `${i + 1} of ${p.files.length}` : ''].filter(Boolean).join(' · ')
  const tileHTML = (p, copy = false, comment = false) => {
    const n = p.files.length
    const i = S.slides[p.id] ?? 0
    const f = p.files[i]
    const label = tileLabel(p, i)
    const on = S.sel.has(p.id)
    const skip = copy ? ' tabindex="-1"' : ''
    const arrow = (d, ico, name) => `<button type="button" class="slide slide--${ico}" data-act="slide" data-arg="${p.id}:${d}" aria-label="${name}"${skip}>${icon(ico)}</button>`
    return `<div ${copy ? 'aria-hidden="true" data-copy' : 'role="listitem"'} class="tile-wrap"><button type="button"${skip} class="tile${S.arriving.has(p.id) ? ' is-arriving' : ''}${on ? ' is-selected' : ''}" data-act="open" data-arg="${p.id}" data-tile="${p.id}" aria-label="${esc(label)}">
      <img src="${f.src}" alt="" width="${p.w}" height="${p.h}" style="aspect-ratio:${p.w}/${p.h}" loading="lazy" decoding="async" draggable="false" />${p.isNew ? '<span class="dot"></span>' : ''}
      ${f.video ? `<span class="vmark">${icon('play')}</span>` : ''}${n > 1 ? `<span class="place">${p.files.map((_, d) => `<i${d === i ? ' class="is-on"' : ''}></i>`).join('')}</span>` : ''}</button>
      <button type="button"${skip} class="tick${on ? ' is-on' : ''}" data-act="select" data-arg="${p.id}" aria-pressed="${on}" aria-label="Select ${esc(p.title)}">${icon('check')}</button>
      ${n > 1 ? arrow(-1, 'left', 'Previous picture') + arrow(1, 'right', 'Next picture') : ''}${comment ? commentHTML(p) : ''}</div>`
  }
  // In a brand project, a tile's comment button opens two fields: what the person likes in it and what they don't
  function commentHTML(p) {
    const c = S.comments[p.id]
    const has = Boolean(c?.like || c?.dislike)
    const open = S.commentOpen === p.id
    return `<button type="button" class="cmt${has ? ' is-on' : ''}" data-act="comment" data-arg="${p.id}" aria-expanded="${open}" aria-label="${has ? 'Your comment' : 'Comment'} on ${esc(p.title)}">${icon('comment')}</button>
      ${open ? `<div class="cpop" role="dialog" aria-label="Comment on ${esc(p.title)}">
        <label>What I like<textarea data-cmt="like" data-arg="${p.id}" placeholder="The grain, the calm colors">${esc(c?.like ?? '')}</textarea></label>
        <label>What I don't like<textarea data-cmt="dislike" data-arg="${p.id}" placeholder="The red, the crowded layout">${esc(c?.dislike ?? '')}</textarea></label></div>` : ''}`
  }
  // Each picture goes to the shortest column, in order, so the feed reads from the top
  function columnsOf(list, width, colWidth) {
    const n = Math.max(2, Math.min(5, Math.floor((width + 8) / colWidth)))
    const cols = Array.from({ length: n }, () => ({ h: 0, items: [] }))
    for (const p of list) {
      const c = cols.reduce((a, b) => (b.h < a.h - 0.001 ? b : a))
      c.items.push(p)
      c.h += p.h / p.w + 0.06
    }
    return cols
  }
  function gridHTML(list, width, colWidth = 168, comment = false) {
    return `<div class="grid${S.sel.size ? ' is-selecting' : ''}" role="list" aria-label="Pictures">${columnsOf(list, width, colWidth).map((c) => `<div class="col">${c.items.map((p) => tileHTML(p, false, comment)).join('')}</div>`).join('')}</div>`
  }

  /* All pictures loops: past the last picture the first ones come again, in each column. A column holds its pictures a
     few times over (runs), and moves down by a whole run as the page scrolls past one, which looks the same, so the
     scroll stays the browser's own. Columns loop each on its own, so the masonry has no gap where it starts again. The
     page is very tall, with no scrollbar, and opens in its middle, so it loops up as well as down. */
  const LOOP_H = 200000
  let loopBase = LOOP_H / 2 // where the first run starts; it moves when the page jumps back to its middle
  const LOOP_PAD = 16 // the scroll's padding over the grid
  function loopGridHTML(list, width, colWidth = 168) {
    return `<div class="grid grid--loop${S.sel.size ? ' is-selecting' : ''}" role="list" aria-label="Pictures" data-loop style="height:${LOOP_H}px">${columnsOf(list, width, colWidth).map((c) =>
      `<div class="col">${[0, 1, 2].map((r) => `<div class="run">${c.items.map((p) => tileHTML(p, r !== 1)).join('')}</div>`).join('')}</div>`).join('')}</div>`
  }
  function loopScroll(box) {
    const grid = $('[data-loop]', box)
    if (!grid) return
    // Far from the middle, jump back to it: the columns move with it, so nothing seems to move
    const mid = LOOP_H / 2
    if (Math.abs(box.scrollTop - mid) > LOOP_H / 4) {
      const jump = Math.round(box.scrollTop - mid)
      loopBase -= jump
      box.scrollTop -= jump
    }
    // The top of the view, from the first run's start. Each column starts a run above it, so its second run, the one
    // that isn't a copy for screen readers and Tab, is always the one at the top of the view
    const y = box.scrollTop - LOOP_PAD - loopBase
    for (const col of grid.children) {
      const h = Number(col.dataset.period)
      const t = loopBase + (Math.floor(y / h) - 1) * h
      if (col.dataset.t !== String(t)) { col.dataset.t = String(t); col.style.transform = `translateY(${t}px)` }
    }
  }
  function setupLoop(fresh) {
    const grid = $('[data-loop]', panel)
    if (!grid) return
    const box = grid.closest('[data-scroll]')
    if (fresh) { loopBase = LOOP_H / 2; box.scrollTop = loopBase }
    for (const col of grid.children) {
      const h = col.firstElementChild.getBoundingClientRect().height + 8 // a run, and the gap after it
      col.dataset.period = String(h)
      // Enough runs to fill the view, with one to spare above and below
      while (col.children.length < 2 + Math.ceil(box.clientHeight / h)) col.append(col.lastElementChild.cloneNode(true))
    }
    loopScroll(box)
    box.addEventListener('scroll', () => loopScroll(box), { passive: true })
  }
  const panelWidth = () => panel.clientWidth || 760
  const ASK_W = 288
  const BRIEF_W = 320

  // The bar at the bottom: the selected tiles' toolbar, or else, on All pictures, the new pictures' bar
  const chev = icon('chev', 'ico--chev')
  function selBarHTML() {
    const n = S.sel.size
    if (S.draft) {
      const t = S.draft.template
      return `<div class="floatbar__in" role="toolbar" aria-label="New bucket"><span class="floatbar__text">${n} selected</span>
        <input class="bar-input" data-draft-name value="${esc(S.draft.name)}" placeholder="Such as: Bakery brand" aria-label="Name of the new bucket" />
        <span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="template" aria-expanded="${S.barMenu === 'template'}">${icon('list')}${TEMPLATES[t].name}${chev}</button>
          ${S.barMenu === 'template' ? `<div class="menu menu--up menu--wide" role="menu"><p class="menu__label">Start with sections</p>${Object.entries(TEMPLATES).map(([k, v]) => `<button type="button" role="menuitemradio" aria-checked="${k === t}" class="menu__two" data-act="template" data-arg="${k}"><span><b>${v.name}</b>${v.sections.length ? `<small>${v.sections.join(', ')}</small>` : ''}</span>${k === t ? icon('check') : ''}</button>`).join('')}</div>` : ''}</span>
        <button type="button" class="btn btn--brand" data-act="make-bucket">Make bucket</button>
        <button type="button" class="btn btn--ghost" data-act="cancel-bucket">Cancel</button></div>`
    }
    const pr = S.page === 'project' ? projectById(S.project) : undefined
    if (pr) {
      const others = [...S.projects, ...S.buckets].filter((x) => x !== pr)
      return `<div class="floatbar__in" role="toolbar" aria-label="Selected pictures"><span class="floatbar__text">${n} selected</span>
        ${pr.directions.length ? `<span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="dir" aria-expanded="${S.barMenu === 'dir'}">${icon('columns')}Move to direction${chev}</button>
          ${S.barMenu === 'dir' ? `<div class="menu menu--up" role="menu">${pr.directions.map((d) => `<button type="button" role="menuitem" data-act="move-dir" data-arg="${d.id}">${esc(d.name)}</button>`).join('')}<hr /><button type="button" role="menuitem" data-act="move-dir" data-arg="">Not in a direction</button></div>` : ''}</span>` : ''}
        <span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="move" aria-expanded="${S.barMenu === 'move'}">${icon('move')}Move to section${chev}</button>
          ${S.barMenu === 'move' ? `<div class="menu menu--up" role="menu">${pr.sections.map((x) => `<button type="button" role="menuitem" data-act="move-to" data-arg="${esc(x.name)}">${esc(x.name)}</button>`).join('')}<hr /><button type="button" role="menuitem" data-act="move-to" data-arg="">Not in a section</button></div>` : ''}</span>
        <span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="add" aria-expanded="${S.barMenu === 'add'}">${icon('box')}Add to bucket${chev}</button>
          ${S.barMenu === 'add' ? `<div class="menu menu--up" role="menu">${others.map((x) => `<button type="button" role="menuitem" data-act="add-to" data-arg="${x.id}">${icon(x.place ? 'shapes' : 'box')}${esc(x.name)}<span class="count" style="margin-left:auto">${x.ids.length}</span></button>`).join('')}</div>` : ''}</span>
        <button type="button" class="btn btn--ghost btn--bar" data-act="remove-from-bucket">${icon('minus')}Remove</button>
        <button type="button" class="btn btn--ghost btn--bar" data-act="clear-sel">Clear</button></div>`
    }
    const b = S.page === 'bucket' ? bucketById(S.bucket) : undefined
    const others = [...S.projects, ...S.buckets].filter((x) => x !== b)
    return `<div class="floatbar__in" role="toolbar" aria-label="Selected pictures"><span class="floatbar__text">${n} selected</span>
      ${b?.sections.length ? `<span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="move" aria-expanded="${S.barMenu === 'move'}">${icon('move')}Move to section${chev}</button>
        ${S.barMenu === 'move' ? `<div class="menu menu--up" role="menu">${b.sections.map((s) => `<button type="button" role="menuitem" data-act="move-to" data-arg="${esc(s.name)}">${esc(s.name)}<span class="count" style="margin-left:auto">${s.ids.length}</span></button>`).join('')}<hr /><button type="button" role="menuitem" data-act="move-to" data-arg="">Not in a section</button></div>` : ''}</span>` : ''}
      <span class="menu-anchor"><button type="button" class="btn btn--ghost btn--bar" data-act="bar-menu" data-arg="add" aria-expanded="${S.barMenu === 'add'}">${icon('box')}Add to bucket${chev}</button>
        ${S.barMenu === 'add' ? `<div class="menu menu--up" role="menu">${others.map((x) => `<button type="button" role="menuitem" data-act="add-to" data-arg="${x.id}">${icon(x.place ? 'shapes' : 'box')}${esc(x.name)}<span class="count" style="margin-left:auto">${x.ids.length}</span></button>`).join('')}${others.length ? '<hr />' : ''}<button type="button" role="menuitem" data-act="new-bucket">${icon('plus')}New bucket…</button></div>` : ''}</span>
      ${b ? `<button type="button" class="btn btn--ghost btn--bar" data-act="remove-from-bucket">${icon('minus')}Remove from bucket</button>` : ''}
      <button type="button" class="btn btn--ghost btn--bar" data-act="clear-sel">Clear</button></div>`
  }
  function barHTML() {
    if (S.sel.size) return selBarHTML()
    if (S.page !== 'pictures') return ''
    const n = newCount()
    if (S.sorting) return `<div class="floatbar__in" role="toolbar" aria-label="New pictures"><span class="floatbar__text is-muted">${spinner()}${esc(S.progress)}</span></div>`
    if (!n) return ''
    return `<div class="floatbar__in" role="toolbar" aria-label="New pictures"><span class="floatbar__text"><span class="dot dot--inline"></span>${plural(n, 'new picture')}</span>
      <button type="button" class="btn btn--brand" data-act="sort">Sort</button></div>`
  }
  function updateBar() {
    const bar = $('[data-bar]', panel)
    if (!bar) return
    const html = barHTML()
    if (!html) {
      if (!bar.firstElementChild) return
      bar.classList.add('is-leaving')
      setTimeout(() => { bar.classList.remove('is-leaving'); if (!barHTML()) bar.innerHTML = '' }, 200)
      return
    }
    bar.classList.remove('is-leaving')
    bar.innerHTML = html
    $('[data-draft-name]', bar)?.focus()
    renderCoach()
  }

  function tagHeadHTML(tag) {
    const fav = S.favs.includes(tag)
    return `<div class="thead">
      <button type="button" class="iconbtn iconbtn--sm star${fav ? ' is-on' : ''}" data-act="fav" data-arg="${esc(tag)}" aria-pressed="${fav}" title="${fav ? 'Take it out of Favourites' : 'Add it to Favourites, in the sidebar'}">${icon('star')}</button>
      <h2>${esc(tag)}</h2><span class="count">${countOf(tag)}</span>
      <div class="thead__end"><span class="count" style="padding-right:4px">${KINDS[kindOf(tag)]}</span>
        <button type="button" class="iconbtn iconbtn--sm" data-act="tag-menu" data-arg="${esc(tag)}" aria-label="More on ${esc(tag)}" aria-expanded="${S.menu === tag}">${icon('ellipsis')}</button>
        ${S.menu === tag ? `<div class="menu" role="menu">
          <button type="button" role="menuitem" data-act="useful" data-arg="${esc(tag)}" ${S.useful.has(tag) ? 'disabled' : ''}>${icon('up')}${S.useful.has(tag) ? 'Useful: you said so' : 'Useful'}</button>
          <button type="button" role="menuitem" data-act="not-useful" data-arg="${esc(tag)}">${icon('down')}Not useful: take it off all</button>
          <hr /><p class="menu__note">Visuals learns from both, and the next sort follows it.</p></div>` : ''}
      </div></div>`
  }

  function bucketHTML(b, width) {
    const grid = (ids) => gridHTML(ids.map(byId), width, 112)
    const head = `<div class="thead"><h2>${esc(b.name)}</h2><span class="count">${b.ids.length}</span></div>`
    if (!b.ids.length) return `${head}<p class="empty-line">No pictures yet. Select pictures on any page, then press Add to bucket.${b.sections.length ? ' Then Move to section says what each one is for.' : ''}</p>`
    if (!b.sections.length) return head + grid(b.ids)
    const loose = looseOf(b)
    return head + b.sections.map((s) => `<section class="bsec" aria-label="${esc(s.name)}"><h3 class="bsec__head">${esc(s.name)} <span class="count">${s.ids.length}</span></h3>
        ${s.ids.length ? grid(s.ids) : '<p class="empty-line">No pictures. Select pictures, then press Move to section.</p>'}</section>`).join('')
      + (loose.length ? `<section class="bsec" aria-label="Not in a section"><h3 class="bsec__head">Not in a section <span class="count">${loose.length}</span></h3>${grid(loose)}</section>` : '')
  }

  function projectHTML(pr, width) {
    const dirs = pr.directions.length ? pr.directions : [{ id: undefined, name: '' }]
    const n = dirs.length
    const cellW = (width - 8 * (n - 1)) / n - 16
    const grid = (ids) => (ids.length ? gridHTML(ids.map(byId), cellW, Math.max(72, Math.min(112, (cellW + 8) / 2)), true) : '')
    const cols = `style="grid-template-columns:repeat(${n}, minmax(0, 1fr))"`
    const head = `<div class="thead"><h2>${esc(pr.name)}</h2><span class="count">${pr.ids.length}</span><div class="thead__end">
      <span class="menu-anchor"><button type="button" class="iconbtn iconbtn--sm" data-act="section-menu" aria-label="Add section" title="Add section" aria-expanded="${S.sectionMenu}">${icon('listplus')}</button>
        ${S.sectionMenu ? `<div class="menu" role="menu"><p class="menu__label">Add a section</p>${MORE_SECTIONS.filter((x) => !pr.sections.some((y) => y.name === x)).map((x) => `<button type="button" role="menuitem" data-act="add-section" data-arg="${esc(x)}">${esc(x)}</button>`).join('') || '<p class="menu__note">It has all of them.</p>'}</div>` : ''}</span>
      <button type="button" class="iconbtn iconbtn--sm" data-act="new-direction" aria-label="New direction" title="New direction">${icon('columns')}</button></div></div>`
    const dirRow = pr.directions.length ? `<div class="dirs" ${cols}>${dirs.map((d) => `<div class="dir"><span>${esc(d.name)}</span><span class="count">${pr.ids.filter((id) => pr.place[id].d === d.id).length}</span></div>`).join('')}</div>` : ''
    const palette = (d) => {
      const busy = S.genColors === d.id
      return `<div class="palette">${(d.palette ?? []).map(([hex, k]) => `<span class="hexchip"><i style="background:${hex}"></i><code>${hex}</code><span class="count">${k}</span></span>`).join('')}
        <button type="button" class="btn btn--line btn--xs" data-act="gen-colors" data-arg="${d.id}" ${busy ? 'disabled' : ''}>${busy ? spinner() : icon('pipette')}${d.palette?.length ? 'Generate again' : 'Generate colors'}</button></div>`
    }
    const rows = [...pr.sections, { name: undefined }].map((sec) => {
      const all = pr.ids.filter((id) => pr.place[id].s === sec.name && (pr.directions.length ? pr.place[id].d : true))
      if (sec.name === undefined && !all.length) return ''
      const name = sec.name ?? 'Not in a section'
      return `<section class="prow${sec.folded ? ' is-folded' : ''}" aria-label="${esc(name)}">
        <button type="button" class="prow__head" ${sec.name ? `data-act="fold" data-arg="${esc(sec.name)}"` : ''} aria-expanded="${!sec.folded}">${sec.name ? icon('chev', 'prow__chev') : ''}${esc(name)} <span class="count">${all.length}</span></button>
        ${sec.folded ? '' : `<div class="cells" ${cols}>${dirs.map((d) => `<div class="cell">${sec.name === 'Color and texture' && d.id ? palette(d) : ''}${grid(cellOf(pr, sec.name, d.id))}</div>`).join('')}</div>`}</section>`
    }).join('')
    const loose = pr.directions.length ? pr.ids.filter((id) => !pr.place[id].d) : []
    const bottom = loose.length ? `<section class="prow" aria-label="Not in a direction"><div class="prow__head">Not in a direction <span class="count">${loose.length}</span></div>
      <div class="cell">${gridHTML(loose.map(byId), width - 16, 112, true)}</div></section>` : ''
    const empty = pr.ids.length ? '' : '<p class="empty-line">No pictures yet. Select pictures on any page, then press Add to bucket.</p>'
    return head + dirRow + empty + rows + bottom
  }
  const tabsOf = (pr) => [['overview', 'Overview'], ['constraints', 'Constraints and wishes'], ...pr.directions.map((d) => [d.id, d.name])]
  const questionsOf = (pr, tab) => (tab === 'overview' ? BRIEF_PARTS.slice(0, -1) : tab === 'constraints' ? BRIEF_PARTS.slice(-1) : [{ name: undefined, qs: DIRECTION_QS }])
  const answersOf = (pr, tab) => (tab === 'overview' || tab === 'constraints' ? pr.answers : pr.directions.find((d) => d.id === tab).answers)
  function briefHTML(pr) {
    const tab = S.briefTab
    const answers = answersOf(pr, tab)
    const gen = S.gen?.tab === tab && S.gen.project === pr.id
    const empty = questionsOf(pr, tab).flatMap((x) => x.qs).filter((q) => !answers[q.id]?.trim()).length
    return `<div class="brief"><div class="brief__head"><h3>Brief</h3><button type="button" class="iconbtn iconbtn--sm" data-act="copy-brief" aria-label="Copy brief" title="Copy the brief, as Markdown">${icon('copy')}</button></div>
      <div class="brief__tabs" role="tablist" aria-label="Parts of the brief">${tabsOf(pr).map(([id, name]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-act="brief-tab" data-arg="${id}">${esc(name)}</button>`).join('')}
        <button type="button" class="iconbtn iconbtn--xs" data-act="new-direction" aria-label="New direction" title="New direction">${icon('plus')}</button></div>
      <div class="brief__gen">${gen
        ? `<button type="button" class="btn btn--line btn--sm" data-act="stop-gen">${icon('stop')}Stop</button><span class="brief__note">${spinner()}Claude Code fills the empty fields…</span>`
        : `<button type="button" class="btn btn--line btn--sm" data-act="generate" ${empty && !S.gen ? '' : 'disabled'}>${icon('sparkles')}Generate</button><span class="brief__note">${S.gen ? 'Another tab generates now.' : empty ? `Fills in the ${plural(empty, 'empty field')} from the brief and the references.` : 'Every field has an answer.'}</span>`}</div>
      ${questionsOf(pr, tab).map((part) => `<section class="bpart">${part.name ? `<h4>${esc(part.name)}</h4>` : ''}
        ${part.qs.map((q) => `<label class="bq"><span>${esc(q.label)}</span><textarea rows="1" data-q="${q.id}" placeholder="${esc(q.placeholder)}">${esc(answers[q.id] ?? '')}</textarea></label>`).join('')}</section>`).join('')}</div>`
  }
  // A brief's field grows with its text, a field of one line too
  const grow = (t) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px` }
  function renderBrief() {
    const box = $('[data-brief]', panel)
    if (!box) return
    const top = box.scrollTop
    box.innerHTML = briefHTML(projectById(S.project))
    box.scrollTop = top
    box.querySelectorAll('textarea').forEach(grow)
    renderCoach()
  }

  /* ── the tag graph on the Tags page ── */
  let graphMemo = { key: '' }
  function tagGraph() {
    const tags = allTags()
    const key = JSON.stringify(tags) + S.pics.map((p) => p.tags.join()).join('|')
    if (graphMemo.key === key) return graphMemo.graph
    const names = new Set(tags.map(([t]) => t))
    const counts = new Map()
    for (const p of S.pics) {
      const shown = [...new Set(p.tags)].filter((t) => names.has(t)).sort()
      shown.forEach((a, i) => { for (const b of shown.slice(i + 1)) { const k = `${a}\n${b}`; const c = counts.get(k) ?? { first: a, second: b, count: 0 }; c.count++; counts.set(k, c) } })
    }
    const kept = new Map()
    const strong = [...counts.values()].sort((a, b) => b.count - a.count || `${a.first}${a.second}`.localeCompare(`${b.first}${b.second}`)).filter(({ first, second }) => {
      const ok = (kept.get(first) ?? 0) < 3 || (kept.get(second) ?? 0) < 3
      if (ok) { kept.set(first, (kept.get(first) ?? 0) + 1); kept.set(second, (kept.get(second) ?? 0) + 1) }
      return ok
    })
    const most = Math.max(1, ...strong.map((l) => l.count))
    const graph = graphOf(tags.map(([name, count]) => ({ key: name, name, count, kind: kindOf(name) })), strong.map((l) => ({ ...l, strength: l.count / most })))
    graphMemo = { key, graph }
    return graph
  }
  function graphHTML() {
    const g = tagGraph()
    const focus = S.hoverTag && g.nodes.find((x) => x.key === S.hoverTag)
    const near = focus ? new Set(g.links.filter((l) => l.first === focus.key || l.second === focus.key).flatMap((l) => [l.first, l.second])) : undefined
    const links = g.links.map((l) => {
      const on = focus && (l.first === focus.key || l.second === focus.key)
      return `<path d="${linkPath(l.from, l.to)}" stroke-width="${r1(0.75 + 1.25 * l.strength)}" stroke-opacity="${on ? 0.45 : focus ? 0.03 : (0.07 + 0.13 * l.strength).toFixed(2)}"/>`
    }).join('')
    const nodes = g.nodes.map((x) => {
      const sel = S.tagSel === x.name
      const faded = near && !near.has(x.key)
      const dark = x.tier === 'large' || sel || (near && !faded)
      const fill = dark ? 'is-dark' : x.tier === 'middle' ? 'is-mid' : ''
      return `<g class="gnode${faded ? ' is-faded' : ''}" role="button" tabindex="0" data-act="pick-tag" data-arg="${esc(x.name)}" data-node="${esc(x.name)}" aria-pressed="${sel}" aria-label="${esc(x.name)}, ${KINDS[x.kind]}, ${plural(x.count, 'picture')}">
        <circle cx="${r1(x.x)}" cy="${r1(x.y)}" r="${r1(x.radius + 6)}" class="gnode__hit"/>
        ${sel ? `<path d="${circlePath({ ...x, radius: x.radius + 3 })}" class="gnode__ring"/>` : ''}
        <path d="${circlePath(x)}" fill="#fff"/><path d="${circlePath(x)}" class="gnode__dot gnode__dot--${x.kind}" fill-opacity="${(0.55 + 0.45 * x.share).toFixed(2)}"/>
        <text x="${r1(x.x + x.radius + G.gap)}" y="${r1(x.y)}" font-size="${NAME_SIZE[x.tier]}" class="${fill}${x.tier === 'large' || sel ? ' is-bold' : ''}">${esc(x.name)}</text></g>`
    }).join('')
    let tip = ''
    if (focus) {
      const linked = g.links.filter((l) => l.first === focus.key || l.second === focus.key).map((l) => [l.first === focus.key ? l.second : l.first, l.count]).sort((a, b) => b[1] - a[1]).slice(0, 3)
      const low = focus.y > (g.height * 3) / 4
      const side = focus.x < G.width / 4 ? 'is-left' : focus.x > (G.width * 3) / 4 ? 'is-right' : ''
      const top = low ? `calc(${((focus.y - focus.radius) / g.height) * 100}% - 8px)` : `calc(${((focus.y + focus.radius) / g.height) * 100}% + 8px)`
      tip = `<div class="gtip ${side}${low ? ' is-low' : ''}" role="tooltip" style="left:${(focus.x / G.width) * 100}%;top:${top}"><b>${esc(focus.name)}</b> · ${plural(focus.count, 'picture')}${linked.length ? `<span>Most often with ${linked.map(([t, k]) => `${esc(t)} (${k})`).join(', ')}</span>` : ''}</div>`
    }
    return `<div class="graph" data-graph><svg viewBox="0 0 ${G.width} ${r1(g.height)}" role="group" aria-label="Tags and their links"><g class="glinks" aria-hidden="true">${links}</g>${nodes}</svg>${tip}</div>`
  }
  const renderGraph = () => { const el = $('[data-graph]', panel); if (el) el.outerHTML = graphHTML() }

  const pageKey = () => `${S.page}:${S.tag ?? ''}:${S.bucket ?? ''}:${S.project ?? ''}`
  function renderPanel() {
    // A page drawn again for a change on it keeps its scroll, and doesn't fade in again
    const key = pageKey()
    const fresh = panel.dataset.key !== key
    const scrolls = fresh ? [] : [...panel.querySelectorAll('[data-scroll]')].map((el) => el.scrollTop)
    const anim = fresh ? ' page-in' : ''
    const w = panelWidth()
    let html = ''
    if (S.page === 'pictures') {
      html = `<div class="scroll scroll--loop${anim}" data-scroll>${loopGridHTML(S.pics, w - 32)}</div>`
    } else if (S.page === 'tag') {
      const list = S.pics.filter((p) => p.tags.includes(S.tag))
      html = `<div class="scroll${anim}" data-scroll>${tagHeadHTML(S.tag)}${list.length ? gridHTML(list, w - 32) : '<p class="empty-line">No pictures have this tag now.</p>'}</div>`
    } else if (S.page === 'project') {
      const pr = projectById(S.project)
      html = `<div class="split${anim}"><div class="scroll scroll--project" data-scroll>${projectHTML(pr, w - BRIEF_W - 32)}</div>
        <aside class="brief-pane" data-scroll data-brief aria-label="Brief">${briefHTML(pr)}</aside></div>`
    } else if (S.page === 'bucket') {
      const b = bucketById(S.bucket)
      const hasAsk = b.ids.length > 0
      html = `<div class="split${anim}"><div class="scroll" data-scroll>${bucketHTML(b, w - (hasAsk ? ASK_W : 0) - 32)}</div>
        ${hasAsk ? `<aside class="bucket-ask" data-scroll aria-label="Ask about this bucket">${askHTML('bucket')}</aside>` : ''}</div>`
    } else if (S.page === 'tags') {
      // One tag is always selected: the one picked last, or else the largest
      if (!countOf(S.tagSel)) S.tagSel = allTags()[0]?.[0]
      const right = S.tagSel && countOf(S.tagSel)
        ? `${tagHeadHTML(S.tagSel)}${gridHTML(S.pics.filter((p) => p.tags.includes(S.tagSel)), w * 0.54 - 32)}`
        : '<p class="empty-line">Press a tag to see its pictures.</p>'
      html = `<div class="split${anim}"><div class="split__left" data-scroll>
          ${graphHTML()}
        </div><div class="split__right" data-scroll>${right}</div></div>`
    } else if (S.page === 'colors') {
      const used = allColors()
      const swatches = Object.keys(FAMILIES).flatMap((f) => [0, 1, 2, 3, 4].map((s) => `${f}.${s}`))
      // One color is always selected: the one picked last, or else the color on the most pictures
      if (!used.get(S.colorSel)) S.colorSel = [...used].sort((a, b) => b[1] - a[1])[0]?.[0]
      const sel = S.colorSel
      const list = sel ? S.pics.filter((p) => !p.isNew && p.colors.includes(sel)) : []
      // All the swatches look the same. A dot marks the ones that pictures have: those open their pictures
      html = `<div class="split${anim}"><div class="split__left split__left--swatches"><div class="swatches">${swatches.map((k) => {
        const n = used.get(k)
        return `<button type="button" class="swatch${swatchLight(k) > 0.7 ? ' is-light' : ''}" style="background:${swatchHex(k)}" data-act="pick-color" data-arg="${k}" aria-label="${swatchName(k)}${n ? `, ${plural(n, 'picture')}` : ', no pictures'}" title="${swatchName(k)}${n ? ` · ${n}` : ''}" aria-pressed="${sel === k}" ${n ? '' : 'aria-disabled="true"'}>${n ? '<i class="swatch__dot"></i>' : ''}</button>`
      }).join('')}</div></div>
        <div class="split__right" data-scroll>${sel ? `<div class="chead"><i style="background:${swatchHex(sel)};box-shadow:inset 0 0 0 1px rgb(0 0 0 / .1)"></i>${swatchName(sel)} <span class="count">${list.length}</span></div>${gridHTML(list, w * 0.54 - 32)}` : '<p class="empty-line">Press a color with a dot to see its pictures. Sort finds the colors of each picture.</p>'}</div></div>`
    }
    const title = S.page === 'tag' ? S.tag : S.page === 'bucket' ? bucketById(S.bucket).name : S.page === 'project' ? projectById(S.project).name : { pictures: 'All pictures', tags: 'Tags', colors: 'Colors' }[S.page]
    panel.innerHTML = `<h1 class="sr-only">${esc(title)}</h1>${html}<div class="floatbar" data-bar>${barHTML()}</div>`
    panel.dataset.key = key
    panel.querySelectorAll('[data-scroll]').forEach((el, i) => { if (scrolls[i]) el.scrollTop = scrolls[i] })
    setupLoop(fresh)
    $('[data-brief]', panel)?.querySelectorAll('textarea').forEach(grow)
    placeComment()
    $('[data-draft-name]', panel)?.focus()
    renderOpen()
    renderCoach()
  }

  /* ── Ask Claude Code: a pane on an open picture, and on a bucket's page ── */
  const PLACEHOLDERS = {
    summary: 'Such as: the style for a landing page. Palette, type and layout.',
    skill: 'Such as: a skill for posters in this style.',
    prompt: 'Such as: a prompt for a pricing page in this style.',
  }
  const BUCKET_PLACEHOLDERS = {
    summary: 'Such as: the brand guide. Logo, type, color and imagery.',
    skill: 'Such as: a skill for the menu and the website.',
    prompt: 'Such as: a prompt for the museum’s landing page.',
  }
  function askHTML(kind) {
    const a = S.answers[kind]
    const holders = kind === 'bucket' ? BUCKET_PLACEHOLDERS : PLACEHOLDERS
    const modes = `<div class="seg" role="group" aria-label="What to ask for" style="align-self:flex-start">${['summary', 'skill', 'prompt'].map((m) => `<button type="button" data-act="ask-mode" data-arg="${m}" aria-pressed="${S.ask.mode === m}" ${a ? 'disabled' : ''}>${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>`
    let body
    if (!a) {
      const waits = S.ask.busy
      body = `<textarea data-ask-text="${kind}" placeholder="${holders[S.ask.mode]}" aria-label="Ask about ${kind === 'bucket' ? 'this bucket' : 'this picture'}"></textarea>
        <div><button type="button" class="btn btn--brand" data-act="send" data-arg="${kind}" ${waits ? 'disabled' : ''}>Send</button></div>
        ${waits ? '<p class="ask__note">One question runs at a time: Send waits for the other one.</p>' : ''}
        ${kind === 'bucket' ? '<p class="ask__note">Each section says what its pictures are for: Claude Code takes only that part, such as the type from a picture in Typography.</p>' : ''}`
    } else if (a.busy) {
      body = `<p class="ask__asked">You asked: ${esc(a.asked)}</p><div class="answer__who">${spinner()}Claude Code looks at ${kind === 'bucket' ? `the ${plural(bucketById(S.bucket).ids.length, 'picture')}` : 'the picture'}…</div>`
    } else {
      const done = a.shown >= a.text.length
      body = `<p class="ask__asked">You asked: ${esc(a.asked)}</p><pre class="answer${done ? '' : ' caret'}" data-stream="${kind}">${esc(a.text.slice(0, a.shown))}</pre>
        ${done ? `<div class="ask__acts"><button type="button" class="btn btn--brand" data-act="copy" data-arg="${kind}">${icon('copy')}Copy</button><button type="button" class="btn btn--line" data-act="ask-again" data-arg="${kind}">${icon('again')}Start again</button></div>
        <p class="ask__note">Visuals does not save this. Copy it before you close it.</p>` : ''}`
    }
    return `<div class="ask" data-ask="${kind}"><div class="ask__label">${icon('sparkles')}Ask Claude Code</div>${modes}${body}</div>`
  }
  const renderAsk = (kind) => {
    const box = $(`[data-ask="${kind}"]`, panel)
    if (box) box.outerHTML = askHTML(kind)
    renderCoach()
  }
  const cap = (s) => s[0].toUpperCase() + s.slice(1)
  const uniq = (list) => [...new Set(list)]
  function pictureAnswer(p, mode, ask) {
    const palette = p.colors.map(swatchName).join(', ')
    const { look, type, layout } = p.about
    if (mode === 'skill') {
      const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `---\nname: ${slug}-style\ndescription: Use for ${ask || 'a page'} in the style of "${p.title}".\n---\n- Look: ${look}.\n- Palette: ${palette}.\n- Type: ${type}.\n- Layout: ${layout}.`
    }
    if (mode === 'prompt') return `Make ${ask || 'a landing page'} in this style: ${look}. Use ${palette}. Type: ${type}. Layout: ${layout}.`
    return `# ${p.title}\n\n## Palette\n- ${cap(palette)}.\n\n## Type\n- ${cap(type)}.\n\n## Layout\n- ${cap(layout)}.\n\n## The feel\n- ${cap(look)}.`
  }
  // Each section gives only its part: the type from a picture in Typography, not its palette
  function bucketAnswer(b, mode, ask) {
    const parts = []
    for (const s of b.sections) {
      const ps = s.ids.map(byId)
      const key = PART[s.name] ?? 'look'
      const lines = key === 'palette'
        ? [uniq(ps.flatMap((p) => p.colors)).map(swatchName).join(', ')]
        : ps.map((p) => p.about[key]).filter((v) => v && !v.startsWith('none'))
      if (ps.length && lines.length) parts.push([s.name, lines])
    }
    const loose = looseOf(b).map(byId)
    if (loose.length) parts.push([b.sections.length ? 'From the other pictures' : 'The style', loose.map((p) => p.about.look)])
    const body = parts.map(([n, lines]) => `## ${n}\n${lines.map((l) => `- ${cap(l)}.`).join('\n')}`).join('\n\n')
    if (mode === 'skill') {
      const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `---\nname: ${slug}\ndescription: Use for ${ask || 'any page or print'} of ${b.name}.\n---\n\n${body}`
    }
    if (mode === 'prompt') return `Make ${ask || 'a one-page brand guide'} for ${b.name}. ${parts.map(([n, lines]) => `${n}: ${lines.join('; ')}.`).join(' ')}`
    return `# Visual direction: ${b.name}\n\n${body}`
  }
  async function send(kind) {
    if (S.ask.busy) return
    const field = $(`[data-ask-text="${kind}"]`, panel)
    const asked = field?.value.trim() || field?.placeholder.replace(/^Such as: /, '') || ''
    const subject = kind === 'bucket' ? bucketById(S.bucket) : byId(S.open)
    if (!subject) return
    const still = () => (kind === 'bucket' ? S.page === 'bucket' && S.bucket === subject.id : S.open === subject.id)
    const text = kind === 'bucket' ? bucketAnswer(subject, S.ask.mode, field?.value.trim()) : pictureAnswer(subject, S.ask.mode, field?.value.trim())
    const a = { asked: cap(asked), text, shown: 0, busy: true }
    S.answers[kind] = a
    S.ask.busy = true
    renderAsk(kind)
    await wait(kind === 'bucket' ? 1300 : 900)
    a.busy = false
    if (still()) renderAsk(kind)
    while (a.shown < text.length && still() && S.answers[kind] === a) {
      a.shown = Math.min(text.length, a.shown + 4)
      const out = $(`[data-stream="${kind}"]`, panel)
      if (out) { out.textContent = text.slice(0, a.shown); out.scrollTop = out.scrollHeight }
      await new Promise((r) => setTimeout(r, reduced ? 0 : 12))
    }
    a.shown = text.length
    S.ask.busy = false
    if (still()) renderAsk(kind)
    // Another pane that waited can send now
    const other = kind === 'bucket' ? 'picture' : 'bucket'
    if (!S.answers[other]) renderAsk(other)

  }

  /* ── Generate: Claude Code fills in the tab's empty fields, one after another, written as it answers. It never writes
     over the person's text: a field that they filled while it ran stays theirs ── */
  async function generate() {
    const pr = projectById(S.project)
    const tab = S.briefTab
    if (S.gen) return
    const run = { project: pr.id, tab, busy: true }
    S.gen = run
    renderBrief()
    await wait(1100)
    const answers = answersOf(pr, tab)
    const from = tab === 'overview' || tab === 'constraints' ? GENERATED : GENERATED[tab] ?? GENERATED.other
    for (const q of questionsOf(pr, tab).flatMap((x) => x.qs)) {
      if (S.gen !== run) break
      if (answers[q.id]?.trim() || !from[q.id]) continue
      const text = from[q.id]
      let shown = 0
      while (shown < text.length && S.gen === run) {
        shown = Math.min(text.length, shown + 3)
        answers[q.id] = text.slice(0, shown)
        const field = S.page === 'project' && S.project === pr.id && S.briefTab === tab && $(`[data-q="${q.id}"]`, panel)
        if (field && document.activeElement !== field) { field.value = answers[q.id]; grow(field) }
        await new Promise((r) => setTimeout(r, reduced ? 0 : 14))
      }
      await wait(120)
    }
    const stopped = S.gen !== run
    S.gen = undefined
    if (S.page === 'project') renderBrief()
    if (!stopped) toast(`Claude Code filled in the empty fields of ${esc(tabsOf(pr).find(([id]) => id === tab)[1])}. Change any of them: they're yours now.`)
  }
  // Places an open comment inside the page: it opens to the left of its tile near the right edge
  function placeComment() {
    const pop = $('.cpop', panel)
    if (!pop) return
    const box = pop.closest('[data-scroll]').getBoundingClientRect()
    if (pop.getBoundingClientRect().right > box.right - 8) pop.classList.add('is-left')
    pop.querySelector('textarea')?.focus()
  }
  function briefMarkdown(pr) {
    const line = (q, a) => `- ${q.label}: ${a[q.id]?.trim() || ''}`
    const refs = currentList().map(byId)
    const num = (id) => refs.findIndex((p) => p.id === id) + 1
    const parts = BRIEF_PARTS.map((part) => `## ${part.name}\n${part.qs.map((q) => line(q, pr.answers)).join('\n')}`)
    const dirs = pr.directions.map((d, i) => `## Direction ${i + 1}: ${d.name}\n${DIRECTION_QS.map((q) => line(q, d.answers)).join('\n')}
- Palette: ${(d.palette ?? []).map(([hex]) => hex).join(', ')}
- References: ${pr.ids.filter((id) => pr.place[id].d === d.id).map(num).sort((a, b) => a - b).join(', ')}`)
    const table = refs.map((p, i) => `| ${i + 1} | ${p.title} | ${pr.place[p.id].s ?? ''} | ${S.comments[p.id]?.like ?? ''} | ${S.comments[p.id]?.dislike ?? ''} | ${p.link} |`)
    return `# Brief: ${pr.name}\n\n${[...parts, ...dirs].join('\n\n')}\n\n## References\n| # | Picture | Section | What I like | What I don't like | Link |\n| - | - | - | - | - | - |\n${table.join('\n')}\n`
  }

  /* ── an open picture, as a page over the panel ── */
  function chipsHTML(p) {
    if (p.isNew && !p.tags.length) return '<span class="count" style="padding:0 6px">No tags yet. Sort gives them.</span>'
    return `<ul class="chips" aria-label="Its tags">${p.tags.map((t) => `<li class="chip"><button type="button" data-act="tag" data-arg="${esc(t)}" title="See its pictures">${esc(t)}</button><button type="button" class="chip__x" data-act="untag" data-arg="${esc(t)}" aria-label="Take ${esc(t)} off this picture">${icon('x')}</button></li>`).join('')}</ul>`
  }
  function renderOpen() {
    $('.pv', panel)?.remove()
    const p = S.open && byId(S.open)
    if (!p) return
    const i = S.openList.indexOf(p.id)
    const prev = S.openList[i - 1]
    const next = S.openList[i + 1]
    panel.insertAdjacentHTML('beforeend', `<div class="pv" role="dialog" aria-label="${esc(p.title)}">
      <div class="pv__stage${p.files.length > 1 ? ' is-stack' : ''}">
        ${p.files.length > 1
          ? `<div class="pv__scroll" data-pv-scroll>${p.files.map((f, k) => `<img src="${f.src}" alt="${esc(p.title)}, ${k + 1} of ${p.files.length}" width="${f.w}" height="${f.h}" />`).join('')}</div>`
          : `<img src="${p.src}" alt="${esc(p.title)}" width="${p.w}" height="${p.h}" />`}
        ${prev ? `<button type="button" class="iconbtn pv__nav pv__nav--prev" data-act="open" data-arg="${prev}" aria-label="The picture before">${icon('left')}</button>` : ''}
        ${next ? `<button type="button" class="iconbtn pv__nav pv__nav--next" data-act="open" data-arg="${next}" aria-label="The next picture">${icon('right')}</button>` : ''}
        <div class="pv__bar">
          <div class="pv__group" data-chips>${chipsHTML(p)}${S.tagDraft
            ? '<input class="chip-input" data-tag-input placeholder="A tag, then Enter" aria-label="New tag" />'
            : `<button type="button" class="iconbtn iconbtn--sm" data-act="add-tag" aria-label="Add a tag" title="Add a tag">${icon('plus')}</button>`}</div>
          ${p.isNew ? '' : `<div class="pv__group">${p.colors.map((c) => `<button type="button" class="cdot" style="background:${swatchHex(c)}" data-act="color" data-arg="${c}" title="${swatchName(c)}" aria-label="${swatchName(c)}: see its pictures"></button>`).join('')}</div>`}
        </div>
      </div>
      <aside class="pv__side">
        <div class="pv__head"><div class="pv__top"><span>${p.by ? `@${esc(p.by)} · ` : ''}${esc(p.site)}</span><button type="button" class="iconbtn iconbtn--sm" data-act="close" aria-label="Close">${icon('x')}</button></div>
          <p class="pv__title">${esc(p.title)}</p><a class="pv__link" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer" title="Open the post">${esc(p.link.replace(/^https:\/\/(www\.)?/, ''))}</a></div>
        ${askHTML('picture')}
      </aside></div>`)
    // A post opens at the picture that its tile shows
    const k = S.slides[p.id] ?? 0
    if (k) $('[data-pv-scroll]', panel)?.children[k]?.scrollIntoView({ block: 'start' })
    if (S.tagDraft) $('[data-tag-input]', panel)?.focus()
  }

  /* ── dialogs: Search, Paste a link ── */
  function renderLayer() {
    if (!S.layer) { layer.innerHTML = ''; return }
    if (S.layer === 'search') {
      layer.innerHTML = `<div class="scrim" data-act="close-layer"></div><div class="dialog dialog--search" role="dialog" aria-label="Search">
        <div class="search__field">${icon('search')}<input data-search placeholder="Search tags, buckets and pictures" aria-label="Search" autocomplete="off" /></div>
        <div class="results" data-results></div></div>`
      renderResults('')
      $('[data-search]', layer).focus()
      return
    }
    if (S.layer === 'paste') {
      layer.innerHTML = `<div class="scrim" data-act="close-layer"></div><div class="dialog dialog--search" role="dialog" aria-label="Save a link">
        <div class="search__field">${icon('plus')}<input data-paste placeholder="Paste a link to a picture or a post, then Enter" aria-label="Link" autocomplete="off" /></div>
        <p class="empty-line" style="padding:10px 14px 12px">Visuals keeps the link, and finds the picture on the page.</p></div>`
      $('[data-paste]', layer).focus()
    }
  }
  function renderResults(q) {
    const box = $('[data-results]', layer)
    if (!box) return
    const s = q.trim().toLowerCase()
    const tags = allTags().filter(([t]) => !s || t.includes(s)).slice(0, s ? 5 : 3)
    const projects = S.projects.filter((b) => !s || b.name.toLowerCase().includes(s)).slice(0, 3)
    const buckets = S.buckets.filter((b) => !s || b.name.toLowerCase().includes(s)).slice(0, 3)
    const pics = S.pics.filter((p) => !s || p.title.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s))).slice(0, 4)
    box.innerHTML = (tags.length ? `<h4>Tags</h4>${tags.map(([t, n]) => `<button type="button" class="result" data-act="tag" data-arg="${esc(t)}">${icon('tag')}${esc(t)}<span class="count">${n}</span></button>`).join('')}` : '')
      + (projects.length ? `<h4>Brand projects</h4>${projects.map((b) => `<button type="button" class="result" data-act="project" data-arg="${b.id}">${icon('shapes')}${esc(b.name)}<span class="count">${b.ids.length}</span></button>`).join('')}` : '')
      + (buckets.length ? `<h4>Buckets</h4>${buckets.map((b) => `<button type="button" class="result" data-act="bucket" data-arg="${b.id}">${icon('box')}${esc(b.name)}<span class="count">${b.ids.length}</span></button>`).join('')}` : '')
      + (pics.length ? `<h4>Pictures</h4>${pics.map((p) => `<button type="button" class="result" data-act="open-all" data-arg="${p.id}"><img src="${p.src}" alt="" />${esc(p.title)}<span class="count">${esc(p.site)}</span></button>`).join('')}` : '')
      || '<p class="empty-line" style="padding:12px 8px">Nothing found. Try “poster” or “museum”.</p>'
    box.querySelector('.result')?.classList.add('is-active')
  }

  /* ── notes at the bottom right of the window ── */
  function toast(text) {
    const box = $('[data-toasts]')
    const el = document.createElement('div')
    el.className = 'toast'
    el.innerHTML = `${icon('ok')}<span>${text}</span>`
    box.append(el)
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220) }, 3400)
  }
  /* ── everything at once ── */
  function render() {
    renderSide()
    renderPanel()
    renderLayer()
  }
  function clearSelection() {
    S.sel.clear()
    S.selLast = undefined
    S.barMenu = undefined
    S.draft = undefined
  }
  function go(page, arg) {
    S.page = page
    S.menu = false
    S.open = undefined
    S.tagDraft = false
    delete S.answers.picture
    if (page === 'tag') S.tag = arg
    S.seen.add(page === 'project' || page === 'bucket' ? `${page}:${arg}` : `page:${page}`)
    if (page === 'bucket') {
      if (S.bucket !== arg) delete S.answers.bucket
      S.bucket = arg
    }
    if (page === 'project') {
      if (S.project !== arg) S.briefTab = 'overview'
      S.project = arg
      S.commentOpen = undefined
      S.sectionMenu = false
    }
    clearSelection()
    S.layer = undefined
    render()
  }
  function openPicture(id, list) {
    if (list) S.openList = list
    if (S.open !== id) delete S.answers.picture
    S.open = id
    S.tagDraft = false
    S.menu = false
    renderOpen()
  }
  const currentList = () => {
    if (S.page === 'tag') return S.pics.filter((p) => p.tags.includes(S.tag)).map((p) => p.id)
    if (S.page === 'bucket') return orderOf(bucketById(S.bucket))
    if (S.page === 'project') {
      const pr = projectById(S.project)
      const dirs = pr.directions.length ? pr.directions.map((d) => d.id) : [undefined]
      const inGrid = [...pr.sections.map((x) => x.name), undefined].flatMap((sec) => dirs.flatMap((d) => cellOf(pr, sec, d)))
      return [...inGrid, ...pr.ids.filter((id) => !inGrid.includes(id))]
    }
    if (S.page === 'tags' && S.tagSel) return S.pics.filter((p) => p.tags.includes(S.tagSel)).map((p) => p.id)
    if (S.page === 'colors' && S.colorSel) return S.pics.filter((p) => !p.isNew && p.colors.includes(S.colorSel)).map((p) => p.id)
    return S.pics.map((p) => p.id)
  }
  // A tile's box, or ⌘ and a press, selects it; Shift and a press selects all from the one selected last
  function select(id, range) {
    const list = currentList()
    if (range && S.selLast && list.includes(S.selLast)) {
      const [a, b] = [list.indexOf(S.selLast), list.indexOf(id)].sort((x, y) => x - y)
      for (const x of list.slice(a, b + 1)) S.sel.add(x)
    } else if (S.sel.has(id)) S.sel.delete(id)
    else S.sel.add(id)
    S.selLast = id
    if (!S.sel.size) { S.draft = undefined; S.barMenu = undefined }
    renderPanel()
  }
  const uniqueName = (name) => {
    let n = name
    for (let i = 2; S.buckets.some((b) => b.name.toLowerCase() === n.toLowerCase()); i++) n = `${name} ${i}`
    return n
  }

  /* Sort: Claude looks at each new picture in turn. The tile shows the tags it gave for a moment, and its dot goes */
  async function sort() {
    const list = S.pics.filter((p) => p.isNew)
    if (S.sorting || !list.length) return
    S.sorting = true
    const first = !S.sortedOnce
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      S.progress = `Sorting ${i + 1} of ${list.length}…`
      renderSide()
      updateBar()
      const tiles = () => [...panel.querySelectorAll(`[data-tile="${p.id}"]`)]
      for (const t of tiles()) t.classList.add('is-looking')
      await wait(760)
      p.tags = p.pending.filter((t) => !S.notUseful.has(t))
      p.isNew = false
      for (const now of tiles()) {
        now.classList.remove('is-looking')
        now.querySelector('.dot')?.classList.add('is-gone')
        now.insertAdjacentHTML('beforeend', `<span class="flash" aria-hidden="true">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</span>`)
        setTimeout(() => { now.querySelector('.flash')?.remove(); now.querySelector('.dot.is-gone')?.remove() }, 2800)
      }
      if (S.open === p.id) renderOpen()
    }
    S.sorting = false
    S.progress = ''
    renderSide()
    updateBar()
    if (S.page !== 'pictures') renderPanel()
    const left = S.notUseful.size ? ` It left out ${[...S.notUseful].map((t) => `“${esc(t)}”`).join(', ')}, as you said.` : ''
    toast(`Sorted ${plural(list.length, 'picture')}.${left}`)
    S.sortedOnce = true
  }

  /* ── Safari and the extension ── */
  const siteGrid = $('[data-site-grid]')
  function renderSite() {
    siteGrid.innerHTML = PLATES.map((p) => {
      const saved = S.saved.has(p.id)
      return `<figure class="plate"><img src="${p.src}" alt="${esc(p.title)}" width="${p.w}" height="${p.h}" draggable="false" />
        <button type="button" class="save${saved ? ' is-saved' : ''}" data-act="save" data-arg="${p.id}" ${saved ? 'aria-disabled="true"' : ''}>${saved ? `${icon('check')}Saved` : '<img src="assets/mark.svg" alt="" />Save to Visuals'}</button>
        <figcaption>${esc(p.title)}</figcaption></figure>`
    }).join('')
    renderCoach()
  }
  let extTimer
  function extToast(kind, title, desc) {
    const el = $('[data-ext-toast]')
    clearTimeout(extTimer)
    el.hidden = false
    el.classList.remove('is-leaving')
    el.dataset.kind = kind
    el.innerHTML = `${kind === 'loading' ? spinner() : icon('ok')}<span style="min-width:0"><b>${esc(title)}</b><small>${esc(desc)}</small></span>`
    if (kind !== 'loading') extTimer = setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => { el.hidden = true }, 200) }, 3200)
  }
  async function save(id) {
    if (S.saved.has(id)) return
    const p = PLATES.find((x) => x.id === id)
    S.saved.add(id)
    const btn = $(`[data-act="save"][data-arg="${id}"]`, siteGrid)
    if (btn) { btn.classList.remove('is-coach'); btn.innerHTML = `${spinner()}Saving…` }
    extToast('loading', 'Saving to Visuals', p.title)
    await wait(650)
    addNew(p)
    renderSite()
    extToast('success', 'Saved to Visuals', 'Visuals sorts it with the next new pictures.')
    if (S.coach === 'save' || S.coach === 'safari') S.coach = 'visuals'
    renderCoach()
    bounce('app')
  }
  // A saved link comes in as a new picture, with a dot, at the top of the feed
  function addNew(p) {
    if (S.pics.includes(p)) return
    p.tags = []
    p.isNew = true
    S.pics.unshift(p)
    S.arriving.add(p.id)
    renderSide()
    if (S.front === 'app' && S.page === 'pictures') { renderPanel(); clearArrivals() }
  }
  const clearArrivals = () => setTimeout(() => S.arriving.clear(), 700)

  /* ── the Mac: which app is in front, the Dock, the menu bar, the clock ── */
  const MENUS = { app: ['File', 'Edit', 'View', 'Window', 'Help'], web: ['File', 'Edit', 'View', 'History', 'Bookmarks', 'Window', 'Help'] }
  function front(app) {
    if (S.front === app) return
    S.front = app
    for (const w of desk.querySelectorAll('[data-win]')) {
      const on = w.dataset.win === app
      w.hidden = !on
      if (on) { w.classList.remove('is-opening'); void w.offsetWidth; w.classList.add('is-opening') }
    }
    $('[data-front-app]').textContent = app === 'app' ? 'Visuals' : 'Safari'
    $('[data-menus]').innerHTML = MENUS[app].map((m) => `<span>${m}</span>`).join('')
    if (app === 'web') { S.sawSafari = true; if (S.coach === 'safari') S.coach = 'save' }
    if (app === 'app') {
      if (S.coach === 'visuals') S.coach = undefined
      if (S.arriving.size) { S.page = 'pictures'; S.open = undefined; S.layer = undefined; clearSelection() }
      render()
      clearArrivals()
    }
    renderCoach()
  }
  function bounce(app) {
    const el = $(`[data-dock="${app}"]`)
    if (!el || reduced) return
    el.classList.remove('is-bouncing'); void el.offsetWidth; el.classList.add('is-bouncing')
    setTimeout(() => el.classList.remove('is-bouncing'), 600)
  }
  // A soft ring on the next page to open in the sidebar, in its order, until each has been opened:
  // Tags, Colors, the brand project, then the bucket. On the Mac desktop, then Safari and a save.
  const TOUR = () => ['page:tags', 'page:colors', ...S.projects.map((b) => `project:${b.id}`), ...S.buckets.map((b) => `bucket:${b.id}`)]
  function renderCoach() {
    desk.querySelectorAll('.is-coach').forEach((el) => el.classList.remove('is-coach'))
    const next = TOUR().find((k) => !S.seen.has(k))
    if (!next && !appOnly && !S.sawSafari && !S.coach) S.coach = 'safari'
    if (S.coach === 'safari') $('[data-dock="web"]').classList.add('is-coach')
    if (S.coach === 'visuals') $('[data-dock="app"]').classList.add('is-coach')
    if (S.coach === 'save') siteGrid?.querySelector('.save:not(.is-saved)')?.classList.add('is-coach')
    if (!next || S.front !== 'app' || S.layer) return
    const [act, arg] = next.split(':')
    $(`[data-act="${act}"][data-arg="${arg}"]`, side)?.classList.add('is-coach')
  }
  function tick() {
    const d = new Date()
    const day = d.toLocaleDateString('en-GB', { weekday: 'short' })
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    $('[data-time]').textContent = `${day} ${date} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  }

  /* ── input ── */
  const ACTIONS = {
    page: (a) => go(a),
    tag: (a) => { S.tagSel = a; go('tag', a) },
    bucket: (a) => go('bucket', a),
    project: (a) => go('project', a),
    'new-project': () => {
      const pr = makeProject(`p${S.projects.length + 1}${Date.now() % 1000}`, uniqueName('New brand project'), [FIRST_SECTION], [], {})
      S.projects.push(pr)
      go('project', pr.id)
      toast('Made a brand project. Select pictures on any page, then Add to bucket.')
    },
    fold: (a) => { const x = projectById(S.project).sections.find((y) => y.name === a); x.folded = !x.folded; renderPanel() },
    'section-menu': () => { S.sectionMenu = !S.sectionMenu; renderPanel() },
    'add-section': (a) => { projectById(S.project).sections.push({ name: a, folded: false }); S.sectionMenu = false; renderPanel(); toast(`Added the section ${esc(a)}.`) },
    'new-direction': () => {
      const pr = projectById(S.project)
      const id = `d${pr.directions.length + 1}${Date.now() % 1000}`
      pr.directions.push({ id, name: `Direction ${pr.directions.length + 1}`, answers: {}, palette: [] })
      S.briefTab = id
      renderPanel()
      toast('Made a direction: a column of its own, and a tab in the brief. Select pictures, then Move to direction.')
    },
    'move-dir': (a) => {
      const pr = projectById(S.project)
      for (const id of S.sel) pr.place[id].d = a || undefined
      const n = S.sel.size
      const d = pr.directions.find((x) => x.id === a)
      clearSelection(); renderPanel()
      toast(d ? `Moved ${plural(n, 'picture')} to ${esc(d.name)}.` : `${plural(n, 'picture')} in no direction now.`)
    },
    'gen-colors': async (a) => {
      S.genColors = a
      renderPanel()
      await wait(900)
      const d = projectById(S.project)?.directions.find((x) => x.id === a)
      S.genColors = undefined
      if (d && !d.palette.length) d.palette = [['#1f1f1f', 2], ['#efece4', 2], ['#c4562e', 1]]
      if (S.page === 'project') renderPanel()
      if (d) toast(`Found the main colors in ${esc(d.name)}'s pictures, in their pixels. No question to Claude.`)
    },
    'brief-tab': (a) => { S.briefTab = a; renderBrief() },
    generate: () => generate(),
    'stop-gen': () => { S.gen = undefined; renderBrief() },
    'copy-brief': () => {
      navigator.clipboard?.writeText(briefMarkdown(projectById(S.project))).catch(() => {})
      toast('Copied the brief, as Markdown: the answers, each direction, and a table of the references.')
    },
    comment: (a) => { S.commentOpen = S.commentOpen === a ? undefined : a; renderPanel() },
    open: (a, e) => {
      if (S.sel.size || e.metaKey || e.ctrlKey || e.shiftKey) select(a, e.shiftKey)
      else openPicture(a, S.open ? undefined : currentList())
    },
    select: (a, e) => select(a, e.shiftKey),
    // The next or the previous picture of a post, in its tile
    slide: (a) => {
      const [id, d] = a.split(':')
      const p = byId(id)
      const n = p.files.length
      const i = (S.slides[id] = ((S.slides[id] ?? 0) + Number(d) + n) % n)
      // Changed in place, in each of the post's tiles (the loop has copies): redrawing them would move the focus to
      // another copy's arrow, and scroll the grid to it
      const f = p.files[i]
      for (const tile of panel.querySelectorAll(`[data-tile="${id}"]`)) {
        $('img', tile).src = f.src
        tile.querySelectorAll('.place i').forEach((dot, k) => dot.classList.toggle('is-on', k === i))
        $('.vmark', tile)?.remove()
        if (f.video) $('img', tile).insertAdjacentHTML('afterend', `<span class="vmark">${icon('play')}</span>`)
        tile.setAttribute('aria-label', tileLabel(p, i))
      }
    },
    'open-all': (a) => { S.layer = undefined; renderLayer(); openPicture(a, S.pics.map((p) => p.id)) },
    close: () => { S.open = undefined; S.tagDraft = false; delete S.answers.picture; renderOpen(); renderCoach() },
    sort: () => sort(),
    fav: (a) => {
      S.favs = S.favs.includes(a) ? S.favs.filter((t) => t !== a) : [...S.favs, a]
      renderSide(); renderPanel()
    },
    'tag-menu': (a) => { S.menu = S.menu === a ? false : a; renderPanel() },
    useful: (a) => {
      S.useful.add(a); S.menu = false
      renderPanel()
      toast(`Visuals learned it: more tags like “${esc(a)}”.`)
    },
    'not-useful': (a) => {
      const n = countOf(a)
      for (const p of S.pics) p.tags = p.tags.filter((t) => t !== a)
      S.notUseful.add(a)
      S.favs = S.favs.filter((t) => t !== a)
      if (S.tagSel === a) S.tagSel = undefined
      const stay = S.page === 'tags'
      S.menu = false
      if (stay) render(); else go('pictures')
      toast(`Took “${esc(a)}” off ${plural(n, 'picture')}. The next sort leaves it out.`)
    },
    'pick-tag': (a) => { S.tagSel = a; S.menu = false; renderPanel() },
    'pick-color': (a, e) => {
      if (e.target.closest('[aria-disabled="true"]')) return
      S.colorSel = a; renderPanel()
    },
    color: (a) => { S.colorSel = a; go('colors') },
    untag: (a) => {
      const p = byId(S.open)
      p.tags = p.tags.filter((t) => t !== a)
      renderOpen(); renderSide()
    },
    'add-tag': () => { S.tagDraft = true; renderOpen() },
    'ask-mode': (a) => {
      S.ask.mode = a
      for (const b of panel.querySelectorAll('[data-act="ask-mode"]')) b.setAttribute('aria-pressed', String(b.dataset.arg === a))
      for (const t of panel.querySelectorAll('[data-ask-text]')) t.placeholder = (t.dataset.askText === 'bucket' ? BUCKET_PLACEHOLDERS : PLACEHOLDERS)[a]
    },
    send: (a) => send(a),
    copy: (a, e) => {
      navigator.clipboard?.writeText(S.answers[a]?.text ?? '').catch(() => {})
      const btn = e.target.closest('button')
      btn.innerHTML = `${icon('check')}Copied`
      setTimeout(() => { if (btn.isConnected) btn.innerHTML = `${icon('copy')}Copy` }, 1500)
    },
    'ask-again': (a) => { delete S.answers[a]; renderAsk(a) },
    // the selected tiles' toolbar
    'bar-menu': (a) => { S.barMenu = S.barMenu === a ? undefined : a; updateBar() },
    'clear-sel': () => { clearSelection(); renderPanel() },
    'add-to': (a) => {
      const b = holderById(a)
      const ids = [...S.sel].filter((id) => !b.ids.includes(id))
      b.ids.unshift(...ids)
      if (b.place) for (const id of ids) b.place[id] = { s: undefined, d: undefined }
      clearSelection()
      renderSide(); renderPanel()
      toast(`Added ${plural(ids.length, 'picture')} to <button type="button" class="link" data-act="${b.place ? 'project' : 'bucket'}" data-arg="${b.id}">${esc(b.name)}</button>.`)
    },
    'new-bucket': () => { S.draft = { name: '', template: 'product' }; S.barMenu = undefined; updateBar() },
    template: (a) => { S.draft.template = a; S.barMenu = undefined; updateBar() },
    'cancel-bucket': () => { S.draft = undefined; S.barMenu = undefined; updateBar() },
    'make-bucket': () => {
      const name = uniqueName(S.draft.name.trim() || 'New brand')
      const b = makeBucket(name, S.draft.template, {}, [...S.sel])
      S.buckets.unshift(b)
      const n = S.sel.size
      go('bucket', b.id)
      toast(`Made “${esc(name)}” with ${plural(n, 'picture')}.${b.sections.length ? ' Select some, then Move to section.' : ''}`)
    },
    'move-to': (a) => {
      if (S.page === 'project') {
        const pr = projectById(S.project)
        for (const id of S.sel) pr.place[id].s = a || undefined
        const n = S.sel.size
        clearSelection(); renderPanel()
        toast(a ? `Moved ${plural(n, 'picture')} to ${esc(a)}.` : `${plural(n, 'picture')} in no section now.`)
        return
      }
      const b = bucketById(S.bucket)
      for (const id of S.sel) {
        for (const s of b.sections) s.ids = s.ids.filter((x) => x !== id)
        if (a) b.sections.find((s) => s.name === a).ids.push(id)
      }
      const n = S.sel.size
      clearSelection()
      delete S.answers.bucket
      renderPanel()
      toast(a ? `Moved ${plural(n, 'picture')} to ${esc(a)}.` : `${plural(n, 'picture')} in no section now.`)
    },
    'remove-from-bucket': () => {
      if (S.page === 'project') {
        const pr = projectById(S.project)
        pr.ids = pr.ids.filter((id) => !S.sel.has(id))
        for (const id of S.sel) delete pr.place[id]
        const n = S.sel.size
        clearSelection(); renderSide(); renderPanel()
        toast(`Took ${plural(n, 'picture')} out of ${esc(pr.name)}. They stay in All pictures.`)
        return
      }
      const b = bucketById(S.bucket)
      b.ids = b.ids.filter((id) => !S.sel.has(id))
      for (const s of b.sections) s.ids = s.ids.filter((id) => !S.sel.has(id))
      const n = S.sel.size
      clearSelection()
      delete S.answers.bucket
      renderSide(); renderPanel()
      toast(`Took ${plural(n, 'picture')} out of ${esc(b.name)}. They stay in All pictures.`)
    },
    search: () => { S.layer = 'search'; renderLayer(); renderCoach() },
    paste: () => { S.layer = 'paste'; renderLayer(); renderCoach() },
    'close-layer': () => { S.layer = undefined; renderLayer(); renderSide() },
    save: (a) => save(a),
  }
  desk.addEventListener('click', (e) => {
    const dock = e.target.closest('[data-dock]')
    if (dock) { if (S.front !== dock.dataset.dock) bounce(dock.dataset.dock); front(dock.dataset.dock); return }
    const el = e.target.closest('[data-act]:not(.cpop)')
    // A click outside an open menu, or a comment, closes it
    if (S.barMenu && !e.target.closest('.menu-anchor')) { S.barMenu = undefined; updateBar() }
    if (S.commentOpen && !e.target.closest('.cpop, [data-act="comment"]')) { S.commentOpen = undefined; if (!el) renderPanel() }
    if (S.sectionMenu && !e.target.closest('.menu-anchor')) { S.sectionMenu = false; if (!el) renderPanel() }
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') {
      if (S.menu && !e.target.closest('.menu')) { S.menu = false; renderPanel() }
      return
    }
    ACTIONS[el.dataset.act]?.(el.dataset.arg, e)
  })
  desk.addEventListener('input', (e) => {
    if (e.target.matches('[data-search]')) renderResults(e.target.value)
    if (e.target.matches('[data-draft-name]') && S.draft) S.draft.name = e.target.value
    if (e.target.matches('[data-q]')) {
      const pr = projectById(S.project)
      answersOf(pr, S.briefTab)[e.target.dataset.q] = e.target.value
      grow(e.target)
    }
    if (e.target.matches('[data-cmt]')) {
      const c = (S.comments[e.target.dataset.arg] ??= { like: '', dislike: '' })
      c[e.target.dataset.cmt] = e.target.value
      $(`[data-act="comment"][data-arg="${e.target.dataset.arg}"]`, panel)?.classList.toggle('is-on', Boolean(c.like || c.dislike))
    }
  })
  // The graph: a tag under the pointer, or with the focus, shows its links and a tooltip; the others fade
  const hoverTag = (name) => { if (S.hoverTag !== name) { S.hoverTag = name; renderGraph() } }
  panel.addEventListener('pointerover', (e) => { if (S.page === 'tags') hoverTag(e.target.closest('[data-node]')?.dataset.node) })
  panel.addEventListener('pointerleave', () => hoverTag(undefined))
  desk.addEventListener('keydown', (e) => {
    const t = e.target
    if (t.matches('[data-node]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ACTIONS['pick-tag'](t.dataset.node); $(`[data-node="${t.dataset.node}"]`, panel)?.focus(); return }
    if (t.matches('[data-tag-input]')) {
      if (e.key === 'Enter') {
        const v = t.value.trim().toLowerCase()
        const p = byId(S.open)
        if (v && p && !p.tags.includes(v)) { p.tags.push(v); if (!TAG_KIND[v]) TAG_KIND[v] = 'style' }
        S.tagDraft = false
        renderOpen(); renderSide()
        const chips = panel.querySelectorAll('.chip')
        if (v) chips[chips.length - 1]?.classList.add('is-new')
      } else if (e.key === 'Escape') { S.tagDraft = false; renderOpen() }
      e.stopPropagation()
      return
    }
    if (t.matches('[data-draft-name]')) {
      if (e.key === 'Enter') ACTIONS['make-bucket']()
      else if (e.key === 'Escape') ACTIONS['cancel-bucket']()
      e.stopPropagation()
      return
    }
    if (t.matches('[data-search]') && e.key === 'Enter') { $('.result.is-active', layer)?.click(); return }
    if (t.matches('[data-paste]') && e.key === 'Enter') {
      const next = PLATES.find((p) => !S.saved.has(p.id))
      const text = t.value.trim()
      if (!text) return
      S.layer = undefined; renderLayer()
      if (!next) { toast('No more pictures in this demo.'); return }
      try { next.site = new URL(/^https?:/.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, '') } catch { /* keep its site */ }
      S.saved.add(next.id)
      renderSite()
      if (S.page !== 'pictures' || S.open) go('pictures')
      addNew(next)
      toast('Saved the link. Sort tags it.')
      return
    }
  })
  document.addEventListener('keydown', (e) => {
    if (S.front !== 'app') return
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ACTIONS.search(); return }
    if (e.key === 'Escape') {
      if (S.layer) ACTIONS['close-layer']()
      else if (S.commentOpen) { S.commentOpen = undefined; renderPanel() }
      else if (S.sectionMenu) { S.sectionMenu = false; renderPanel() }
      else if (S.menu) { S.menu = false; renderPanel() }
      else if (S.open) ACTIONS.close()
      else if (S.barMenu) { S.barMenu = undefined; updateBar() }
      else if (S.sel.size) ACTIONS['clear-sel']()
      return
    }
    const typing = e.target.matches('input, textarea')
    if (S.open && !typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const i = S.openList.indexOf(S.open)
      const id = S.openList[i + (e.key === 'ArrowLeft' ? -1 : 1)]
      if (id) openPicture(id)
    }
  })
  let resizeTimer
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (S.front === 'app') renderPanel() }, 120) })

  $('[data-menus]').innerHTML = MENUS.app.map((m) => `<span>${m}</span>`).join('')
  tick()
  setInterval(tick, 20000)
  renderSite()
  render()
})()
