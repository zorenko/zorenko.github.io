/* The Celsia demo (index.html says what it is): one state object S, a render function for each region writing innerHTML
   from S, and one click listener that runs ACTIONS[data-act](data-arg). */
;(() => {
  const $ = (s, root = document) => root.querySelector(s)
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ''}</svg>`
  // the skeuomorphic ones (skeu.js), only in the app's sidebar and on Home
  const skeu = (name) => `<svg class="sk" viewBox="0 0 24 24" aria-hidden="true">${SKEU[name] ?? ''}</svg>`
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 40) : ms))
  /* A rounded rectangle for the charts' SVG, with squircle corners like the CSS ones (styles.css, --sq): each corner a
     curve that hugs it (a superellipse, in one cubic Bézier), its radius grown by the same 1.6. `flat` leaves the bottom
     square, for a bar standing on the axis or on the bar below. */
  const sqPath = (x, y, w, h, r, flat) => {
    r = Math.max(0, Math.min(r * 1.6, w / 2, flat ? h : h / 2)); const c = r * 0.09, f = (n) => +n.toFixed(2)
    const b = flat ? `V${f(y + h)}H${f(x)}` : `V${f(y + h - r)}C${f(x + w)} ${f(y + h - c)} ${f(x + w - c)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}C${f(x + c)} ${f(y + h)} ${f(x)} ${f(y + h - c)} ${f(x)} ${f(y + h - r)}`
    return `M${f(x)} ${f(y + r)}C${f(x)} ${f(y + c)} ${f(x + c)} ${f(y)} ${f(x + r)} ${f(y)}H${f(x + w - r)}C${f(x + w - c)} ${f(y)} ${f(x + w)} ${f(y + c)} ${f(x + w)} ${f(y + r)}${b}Z`
  }

  /* The size the page is really shown at, in device pixels per CSS pixel: the site scales the demo down to fit a card,
     so the halftone panels below are drawn for that. Checked again now and then, since the card's size changes with
     the window. */
  let gridK = 0
  function sizeGrid() {
    let scale = 1
    try { const f = window.frameElement; if (f) scale = f.getBoundingClientRect().width / innerWidth || 1 } catch {}
    const k = scale * devicePixelRatio
    snapBars()
    if (Math.abs(k - gridK) < 0.01) return
    gridK = k
    // the progress bars are a whole number of device pixels tall (4px at 1×), so they all come out the same
    document.documentElement.style.setProperty('--bar-h', `${Math.max(2, Math.round(4 * k)) / k}px`)
    requestAnimationFrame(() => { findPanels(true); snapBars() })
  }
  /* …and each sits on a whole device pixel: rows 36px apart land on different fractions of a pixel at the card's
     scale, which smears one bar over 5 rows and the next over 6. Each is nudged (by less than a pixel) onto the grid,
     again after every render and scroll. The grid is that of the layer the browser draws the demo into: the site's
     card (will-change: transform), which it then places on the screen as a whole, so every bar moves alike. */
  let cardLayer
  function snapBars() {
    let scale = 1, top0 = 0
    try {
      const f = window.frameElement
      if (f) {
        if (cardLayer === undefined) { cardLayer = null; for (let e = f.parentElement; e; e = e.parentElement) if (getComputedStyle(e).willChange.includes('transform')) { cardLayer = e; break } }
        const r = f.getBoundingClientRect(); scale = r.width / innerWidth || 1; top0 = r.top - (cardLayer ? cardLayer.getBoundingClientRect().top : 0)
      }
    } catch {}
    const dpr = devicePixelRatio, k = scale * dpr
    document.querySelectorAll('.progress__bar, .topic__bar').forEach((el) => {
      const was = +(el.dataset.dy || 0), y = (top0 + (el.getBoundingClientRect().top - was) * scale) * dpr
      const dy = +((Math.round(y) - y) / k).toFixed(3)
      if (dy !== was) { el.style.translate = `0 ${dy}px`; el.dataset.dy = dy }
    })
  }
  let snapQueued = false
  const queueSnap = () => { if (snapQueued) return; snapQueued = true; requestAnimationFrame(() => { snapQueued = false; snapBars() }) }
  addEventListener('scroll', queueSnap, { capture: true, passive: true })

  /* The picture panels (.gart in the guide, .tour__shot on Home and Help) are a halftone of styles.css's --panel
     gradient, like print in reverse: a grid of dots on near-black, each as big as the gradient is light there and in its
     colour, brightened. Drawn on a canvas in whole device pixels for each panel's size (again when it changes, or the scale
     does); --panel stays underneath as the fallback. */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t)
  const clamp01 = (x) => Math.max(0, Math.min(1, x))
  const P_FROM = hex('#34363e'), P_TO = hex('#2b2d34'), P_INDIGO = hex('#8a8962'), P_LIGHT = hex('#43464f'), P_PAPER = '#25262b'
  // --panel's colour at (u, v), 0–1 across and down: the 135° base, the accent's glow at the bottom left, the lift at the top right
  function panelColor(u, v, W, H) {
    let c = mix(P_FROM, P_TO, clamp01((u * W + v * H) / (W + H)))
    c = mix(c, P_INDIGO, clamp01(1 - Math.hypot(u / 0.9, (v - 1) / 1.2) / 0.65))
    return mix(c, P_LIGHT, clamp01(1 - Math.hypot((u - 1) / 0.8, v / 1.1) / 0.6))
  }
  const noise = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n) } // the same speckle every time
  const panelCache = new Map()
  function paintPanel(el) {
    const W = el.offsetWidth, H = el.offsetHeight, k = gridK || devicePixelRatio
    if (!W || !H) return
    const key = `${W}x${H}@${k.toFixed(3)}`
    if (el.dataset.panel === key) return
    el.dataset.panel = key
    let url = panelCache.get(key)
    if (!url) {
      const pw = Math.round(W * k), ph = Math.round(H * k), pitch = Math.max(2, Math.round(3 * k))
      const cv = document.createElement('canvas'), g = cv.getContext('2d')
      cv.width = pw; cv.height = ph
      g.fillStyle = P_PAPER; g.fillRect(0, 0, pw, ph)
      const dots = []; let lo = 1, hi = 0
      for (let y = pitch / 2; y < ph; y += pitch) for (let x = pitch / 2; x < pw; x += pitch) {
        const c = panelColor(x / pw, y / ph, W, H), d = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255
        dots.push([x, y, c, d]); lo = Math.min(lo, d); hi = Math.max(hi, d)
      }
      for (const [x, y, c, d] of dots) {
        // spread over this panel's range, so the darkest corner keeps the finest dots and the lightest stays open
        const t = 0.05 + 0.6 * clamp01((d - lo) / (hi - lo || 1) + (noise(x, y) - 0.5) * 0.14)
        g.fillStyle = `rgb(${c.map((v) => Math.round(Math.min(255, v * 1.6 + 16))).join(' ')})`
        g.beginPath(); g.arc(x, y, (pitch / 2) * Math.sqrt(t) * 1.05, 0, Math.PI * 2); g.fill()
      }
      url = cv.toDataURL()
      panelCache.set(key, url)
    }
    el.style.background = `url(${url}) 0 0 / ${W}px ${H}px no-repeat`
  }
  const panelSizes = new ResizeObserver((entries) => entries.forEach((e) => paintPanel(e.target)))
  const watched = new WeakSet()
  function findPanels(all) {
    document.querySelectorAll('.gart, .tour__shot').forEach((el) => {
      if (!watched.has(el)) { watched.add(el); panelSizes.observe(el) }
      if (all) paintPanel(el)
    })
  }
  let panelsQueued = false
  new MutationObserver(() => { queueSnap(); if (panelsQueued) return; panelsQueued = true; requestAnimationFrame(() => { panelsQueued = false; findPanels() }) })
    .observe(document.body, { childList: true, subtree: true })

  sizeGrid()
  addEventListener('resize', sizeGrid)
  setInterval(sizeGrid, 1000)

  /* ── content ──
     In plain words, for someone new to sustainability reporting: no standard's codes or paragraph numbers, and none
     of the production app's specialist set-up (its disclosure checklists and reporting rules). Only Climate targets
     is written, in full, with a table and two charts, as a real report would have. */
  const PEOPLE = {
    hh: { name: 'Hannah Hayes', ini: 'HH', c: '' },
    ib: { name: 'Isabel Brooks', ini: 'IB', c: 'b' },
    lm: { name: 'Liam Moore', ini: 'LM', c: 'c' },
    sd: { name: 'Sophie Davis', ini: 'SD', c: 'd' },
  }
  const ME = 'hh'
  const SUBS = [
    { name: 'Northfield England', by: 'lm' },
    { name: 'Northfield Scotland', by: 'ib' },
    { name: 'Northfield Ireland', by: 'sd' },
    { name: 'Northfield Wales', by: 'hh' },
  ]
  const SHARES = [0.41, 0.27, 0.19] // numbers: each company's share; the last one gets the rest
  const AI_NOTE = 'Written by AI from the attached document.'
  const FILE_POOL = ['Energy_invoices_2023.pdf', 'Board_minutes_Q3_2023.pdf', 'Supplier_survey_2023.pdf', 'Fleet_fuel_log_2023.pdf']

  // Every data point: a paragraph (text) or a value in its text (a target or a number). Fields left out take defaults.
  const DPS = {
    // The net-zero target, in Climate targets' table
    't-nz': { kind: 'target', name: 'Net zero across our value chain by 2045', unit: 't CO₂e', actual: [[2020, 128000], [2021, 123200], [2022, 118480], [2023, 114000]], goal: [2045, 12800], source: 'From a target', owner: 'ib', files: ['Climate_plan_2023.pdf'], ask: 'Give the target the plan is built around: how much, and by when.' },
    // Climate targets. Laid out the way a report under the EU's climate standard (ESRS E1) shows its targets: what each
    // one covers, its starting year and value, the goal, progress so far, whether it's science-based, the steps that get
    // there and what each cuts, and that carbon credits don't count. The numbers add up with Energy use and Emissions.
    'e14-how': { name: 'How we set our targets', source: 'Written by AI', note: AI_NOTE, files: ['Climate_strategy_2023.pdf'], ask: 'Explain how the company decided on its climate targets: when, from which starting year, and for which parts of the business.',
      comments: [{ by: 'ib', when: '2 days ago', text: 'Can we say which parts of the business we looked at? The auditors asked last year.' }],
      subs: [
        'We set our targets together with the group in 2021, using science-based guidance and our 2020 emissions.',
        'We followed the group. The Glasgow plant added its own target for process heat after its 2022 energy check.',
        null,
        'The group set the targets. Our site helped through the workshop on what matters most, and by collecting supplier data.',
      ],
      summary: 'Northfield set its climate targets as a group in 2021, using science-based guidance and our 2020 emissions as the starting point. Each company helped through a workshop on what matters most and by collecting data from suppliers, and the Glasgow plant added its own target for process heat after its 2022 energy check.' },
    'e14-targets': { name: 'Our emission targets', ask: 'Give your emission targets: how much, by when, and from which starting year.' },
    't-s1': { kind: 'target', name: 'Cut direct and energy emissions by 42% by 2030', unit: 't CO₂e', actual: [[2020, 24600], [2021, 22000], [2022, 19580], [2023, 17600]], goal: [2030, 14268], source: 'From a target', owner: 'lm', files: ['Direct_emissions_2023.pdf'], edited: '2.10.2023',
      note: 'Buying the Glasgow plant in 2022 changes our 2020 emissions by less than 5%, so the starting point stays.',
      ask: 'Give the target as a number, the year it should be reached, and the year it is measured from.',
      comments: [
        { by: 'ib', when: 'Yesterday', text: 'Does buying the Glasgow plant change our 2020 starting point?' },
        { by: 'lm', when: 'Yesterday', text: 'Barely, by less than 5%. I added a note.' },
      ] },
    't-s23': { kind: 'target', name: 'Cut value chain emissions per tonne we make by 25% by 2030', unit: 't CO₂e per tonne', actual: [[2020, 5.79], [2021, 5.74], [2022, 5.51], [2023, 5.33]], goal: [2030, 4.34], dec: 2, source: 'From a target', owner: 'sd', files: ['Supplier_survey_2023.pdf'], ask: 'Give the target as a number, the year it should be reached, and the year it is measured from.' },
    'e14-table': { kind: 'table', block: true, name: 'Our targets at a glance', source: 'Added up', owner: 'lm', ask: 'Show each target with its starting point, where it stands now and its goal, side by side.' },
    'e14-progress': { name: 'Progress in 2023', owner: 'lm', edited: '4.10.2023', ask: 'Say how far the company has come on each target, and explain why.' },
    'e14-path': { kind: 'chart', block: true, name: 'Direct and energy emissions against the 2030 goal', source: 'From a number', owner: 'lm', files: ['Direct_emissions_2023.pdf'], ask: 'Show the emissions each year since the starting year, next to the path to the goal.' },
    'e14-material': { name: 'Where our biggest impacts are', ask: 'Explain how the targets match the areas where the company affects the climate most.',
      subs: [
        'Our largest impacts are electricity at the Leeds plant and trucking in raw materials.',
        'Gas-fired process heat and the aluminium we buy matter most for us.',
        'Delivering to customers in Germany and the Netherlands is our largest source of emissions.',
        null,
      ],
      summary: 'Our 2023 review found the biggest climate impacts in electricity and gas-fired heat at our plants, the aluminium we buy, and trucking materials and products. Our targets focus on these areas.' },
    'e14-levers': { name: 'What we are doing to get there', ask: 'List the main steps the company is taking to reach its targets, and how much each will cut.',
      comments: [{ by: 'sd', when: '3 days ago', text: 'Add the heat pumps in Glasgow here?' }],
      subs: [
        'Department heads have a bonus tied to saving energy. We are putting solar panels on the roof in 2024.',
        'We are replacing the gas boilers in Glasgow with heat pumps by 2027.',
        null,
        'All our electricity has been renewable since 2022.',
      ],
      summary: 'Our main steps are renewable electricity at every site, with solar panels on the roof in Leeds in 2024, and replacing the gas-fired heat in Glasgow with heat pumps by 2027. Our Welsh site has run on renewable electricity since 2022, and department heads have a bonus tied to saving energy.' },
    'e14-steps': { kind: 'chart', block: true, name: 'What each step cuts by 2030', source: 'Typed in', owner: 'lm', files: ['Capex_plan_2024-2027.pdf'], ask: 'Show each main step with how much it is expected to cut, and by when.' },
    'e14-risks': { name: 'How climate risks shape our targets', ask: 'Explain how the ways climate change could affect the business were used when setting the targets.', edited: '21.09.2023', owner: 'ib' },
    'e14-achievable': { name: 'Why the targets are realistic', ask: 'Say whether the targets are based on science, why they can be reached, what pays for the steps, and whether carbon credits count towards them.' },
    // Emissions, in Climate targets' chart and in Insights
    'g-s1': { kind: 'metric', name: 'Direct emissions (Scope 1)', unit: 't CO₂e', years: [[2021, 14100], [2022, 13280], [2023, 12480]], sum: true, source: 'From a number', owner: 'lm', files: ['Direct_emissions_2023.pdf'], ask: 'Give the emissions from sources the company owns, in tonnes of CO₂.' },
    'g-s2': { kind: 'metric', name: 'Emissions from energy we buy (Scope 2)', unit: 't CO₂e', years: [[2021, 7900], [2022, 6300], [2023, 5120]], sum: true, source: 'From a number', ask: 'Give the emissions from the electricity and heat the company buys, in tonnes of CO₂.' },
  }

  // The report's sections: only Climate targets is written; the rest of the contents is there to see, not to open.
  // A value in a paragraph is [[data point|its words]].
  const REPORTS = [
    { id: 'e1-4', title: 'Climate targets', paras: {
      'e14-how': 'In 2021, Northfield set climate targets for the whole group. Today they cover all four of our companies, in England, Scotland, Ireland and Wales, and every kind of emissions, from our own boilers and vans to the materials we buy and the trucks that deliver our products. We measure them all from 2020, the last full year before we set them. In May 2022, the Science Based Targets initiative checked them and confirmed they match what science says is needed to keep warming to 1.5°C.',
      'e14-targets': 'For 2030 we have two targets. We aim to [[t-s1|cut our direct emissions and those from the energy we buy by 42% by 2030]], from 24,600 to 14,268 tonnes of CO₂e. And because most of our emissions come from what we buy, we aim to [[t-s23|cut the emissions in our value chain by 25% for every tonne we make by 2030]]. Both are steps towards net zero by 2045, which our climate plan sets out.',
      'e14-table': { block: () => targetsTable() },
      'e14-progress': 'By the end of 2023, our direct and energy emissions were 28% below 2020, ahead of the straight line to 2030. Most of the cut came from renewable electricity, which three of our four sites now buy, and from saving energy, above all new burners and heat recovery at the Leeds plant. Value chain emissions per tonne fell by 8%, more slowly than we need: our suppliers’ own cuts take time to show in our numbers, and 36% of what we buy is still estimated from what we spend on it rather than measured.',
      'e14-path': { block: () => pathChart() },
      'e14-material': 'We chose these targets after a review of where our business affects the climate most, which we repeated in 2023. In 2023, 85% of our emissions came from our value chain, and the goods and services we buy, above all aluminium and packaging, made up 60% on their own. At our own sites, gas for process heat in Leeds and Glasgow is the largest source.',
      'e14-levers': 'Four steps make up most of the cut to 2030. We are moving every site to renewable electricity by 2025, with solar panels on the roof in Leeds in 2024 and a ten-year contract with a Scottish wind farm. We are replacing the gas boilers in Leeds and Glasgow with heat pumps by 2027, switching the vans that deliver in England to electric ones by 2028, and saving energy at every site each year. For the value chain, our 40 largest suppliers, who make up 70% of what we buy, have agreed to set their own targets by 2025.',
      'e14-steps': { block: () => stepsChart() },
      'e14-risks': 'Every year we also look at how climate change could affect our business. In 2023 we used two futures: one where warming is kept to 1.5°C, and one where it reaches 3°C. In the first, carbon prices could add €1.9 million a year to our energy and material costs by 2030. In the second, flooding and summer heat put the Leeds plant most at risk. Both point the same way: use less gas, and work more closely with our suppliers.',
      'e14-achievable': 'Together, the four steps cut 11,800 tonnes compared with 2020, more than the 10,332 tonnes the 2030 target needs, which leaves room if a project runs late. We have set aside €14.2 million for them from 2024 to 2027. We don’t count carbon credits or carbon removed from the air towards these targets. The Board checks our progress every quarter, 20% of the management team’s yearly bonus depends on it, and if we buy or sell a business that changes our 2020 emissions by more than 5%, we recalculate the starting point.',
    } },
  ]
  const reportById = (id) => REPORTS.find((r) => r.id === id)
  const PARA_OF = {} // data point → its paragraph
  const REPORT_OF = {} // data point → its report
  const valuesIn = (text) => typeof text === 'string' ? [...text.matchAll(/\[\[([^|]+)\|/g)].map((m) => m[1]) : []
  for (const r of REPORTS) for (const [pid, text] of Object.entries(r.paras)) {
    PARA_OF[pid] = pid; REPORT_OF[pid] = r.id
    for (const id of valuesIn(text)) { PARA_OF[id] = pid; REPORT_OF[id] = r.id }
  }
  const order = (rid) => Object.entries(reportById(rid).paras).flatMap(([pid, t]) => [pid, ...valuesIn(t)])

  // The report's contents: one group a topic
  const TOC = [
    { id: 'climate', name: 'Climate', kids: [{ name: 'Our climate plan', off: true }, { report: 'e1-4', name: 'Climate targets' }, { name: 'Energy use', off: true }, { name: 'Emissions', off: true }] },
    { id: 'pollution', name: 'Pollution', kids: [{ name: 'Air, water and soil', off: true }] },
    { id: 'water', name: 'Water', kids: [{ name: 'Water use', off: true }] },
    { id: 'people', name: 'People', kids: [{ name: 'Our employees', off: true }] },
    { id: 'conduct', name: 'Business conduct', kids: [{ name: 'Anti-corruption', off: true }] },
  ]

  /* ── state ── */
  const S = {
    report: 'e1-4',
    open: new Set(['climate']), // the table of contents' open groups
    tocOpen: false, // the table of contents' popup
    sel: undefined, // the open data point
    tab: 'details',
    editing: undefined, // a paragraph being edited
    html: {}, // paragraphs edited in the report
    more: new Set(), // texts shown in full: `${dp}:answer`, `${dp}:sub0`
    menu: false, // the owner menu
    layer: undefined, // 'guide'
    sums: {}, // a text's answer written from its companies' answers: { text, busy, used }
    dp: {}, // what can change on each data point
  }
  for (const [id, d] of Object.entries(DPS)) {
    d.kind ??= 'narrative'
    S.dp[id] = {
      owner: d.owner ?? 'hh', edited: d.edited ?? '8.09.2023', source: d.source ?? 'Typed in', note: d.note ?? '',
      files: [...(d.files ?? [])], comments: (d.comments ?? []).map((c) => ({ ...c })),
    }
  }

  const app = $('[data-app]')
  const rail = $('[data-rail]')
  const toc = $('[data-toc]')
  const stage = $('[data-stage]')
  const dpEl = $('[data-dp]')
  const layer = $('[data-layer]')

  /* ── numbers ── */
  const num = (v, dec = 0) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  const withUnit = (v, d) => d.unit === '%' ? `${num(v, d.dec)}%` : `${num(v, d.dec)} ${d.unit}`
  const pct = (a, b) => ((b - a) / a) * 100
  const signed = (p) => { const a = Math.round(Math.abs(p) * 10) / 10; return `${p > 0 ? '+' : '−'}${num(a, a % 1 ? 1 : 0)}%` }
  const short = (v) => {
    if (v < 1000) return num(v, v < 10 && v % 1 ? 2 : 0)
    const k = v >= 100000 ? Math.round(v / 1000) : Math.round(v / 100) / 10
    return `${num(k, k % 1 ? 1 : 0)}k`
  }
  // The chart's top: four even steps of a round size, just above the largest value
  const niceMax = (v) => {
    const raw = (v * 1.1) / 4, p = 10 ** Math.floor(Math.log10(raw))
    return [1, 1.5, 2, 2.5, 4, 5, 10].find((m) => m * p >= raw) * p * 4
  }
  const plainText = (pid) => {
    const html = S.html[pid] ?? reportById(REPORT_OF[pid]).paras[pid]
    if (typeof html !== 'string') return ''
    return html.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
  }
  const kindLabel = (d) => ({ narrative: 'Text', target: 'Target', metric: 'Number', table: 'Table', chart: 'Chart' })[d.kind]
  const kindIcon = (d) => ({ narrative: 'align-justified', target: 'target-arrow', metric: 'chart-histogram', table: 'table', chart: 'chart-line' })[d.kind]
  const avatar = (pid, lg) => { const p = PEOPLE[pid]; return `<span class="avatar ${p.c ? `avatar--${p.c}` : ''} ${lg ? 'avatar--lg' : ''}" title="${esc(p.name)}">${p.ini}</span>` }

  /* ── a chart for a target or a metric ── */
  function chart(d, W, H) {
    const L = 34, R = 16, T = 14, B = 20
    const pw = W - L - R, ph = H - T - B
    let out = ''
    const ys = d.kind === 'target' ? [...d.actual.map((a) => a[1]), d.goal[1]] : d.years.map((a) => a[1])
    const ymax = niceMax(Math.max(...ys))
    const y = (v) => T + ph - (v / ymax) * ph
    for (let i = 0; i <= 4; i++) {
      const v = (ymax / 4) * i
      out += `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-axis" x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${short(v)}</text>`
    }
    if (d.kind === 'target') {
      const y0 = d.actual[0][0], y1 = d.goal[0]
      const x = (yr) => L + ((yr - y0) / (y1 - y0)) * pw
      const step = y1 - y0 > 8 ? 5 : 1
      for (let yr = y0; yr <= y1; yr += step) out += `<text class="ch-axis" x="${x(yr)}" y="${H - 4}" text-anchor="middle">${yr}</text>`
      const last = d.actual.at(-1)
      out += `<path class="ch-plan" d="M${x(last[0])} ${y(last[1])}L${x(y1)} ${y(d.goal[1])}"/>`
      out += `<path class="ch-line" d="${d.actual.map(([yr, v], i) => `${i ? 'L' : 'M'}${x(yr)} ${y(v)}`).join('')}"/>`
      out += d.actual.map(([yr, v]) => `<circle class="ch-dot" cx="${x(yr)}" cy="${y(v)}" r="3"/>`).join('')
      // The goal's label under its dot, clear of the dashed line coming down to it; above it when the dot is low
      const gy = y(d.goal[1]), low = gy > T + ph - 22
      out += `<circle class="ch-goal" cx="${x(y1)}" cy="${gy}" r="4"/><text class="ch-label" x="${x(y1) - 2}" y="${low ? gy - 10 : gy + 16}" text-anchor="end">${signed(pct(d.actual[0][1], d.goal[1]))} by ${y1}</text>`
    } else {
      const n = d.years.length, slot = pw / n, bw = Math.min(36, slot * 0.42)
      d.years.forEach(([yr, v], i) => {
        const cx = L + slot * (i + 0.5), now = i === n - 1
        out += `<path class="ch-bar ${now ? 'ch-bar--now' : ''}" d="${sqPath(cx - bw / 2, y(v), bw, T + ph - y(v), 3, true)}"/>`
        out += `<text class="ch-axis" x="${cx}" y="${y(v) - 5}" text-anchor="middle">${short(v)}${d.unit === '%' ? '%' : ''}</text><text class="ch-axis" x="${cx}" y="${H - 4}" text-anchor="middle">${yr}</text>`
      })
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(d.name)}">${out}</svg>`
  }

  /* ── the app's sidebar ── */
  // Its items go to the demo's pages (RAIL, further down); the one holding the open page is current
  function renderRail() {
    const here = SECTION[S.page]
    const item = (x) => {
      const [p, ico, tip] = x
      return `<button type="button" class="rail__item" data-act="go" data-arg="${p}" data-tip="${tip}" aria-label="${tip}" ${here === p ? 'aria-current="page"' : ''}>${skeu(ico)}</button>`
    }
    rail.innerHTML = `
      <button type="button" class="rail__logo" data-act="go" data-arg="home" aria-label="Celsia, home"><img src="assets/logo.svg" alt="" width="26" height="26" /></button>
      ${RAIL.map(item).join('')}
      <span class="rail__gap"></span>
      ${RAIL_END.map(item).join('')}`
  }

  /* ── the table of contents: an icon button at the report's top left, and the contents in a popup under it ── */
  function renderToc() {
    const node = (n) => {
      if (n.kids) {
        const open = S.open.has(n.id)
        return `<button type="button" class="toc__row toc__row--group" data-act="toggle" data-arg="${n.id}" aria-expanded="${open}"><span class="toc__name">${esc(n.name)}</span>${icon('chevron-down')}</button>
          ${open ? `<div class="toc__kids">${n.kids.map(node).join('')}</div>` : ''}`
      }
      if (n.off) return `<button type="button" class="toc__row is-off" data-act="off" title="Not in this demo"><span class="toc__name">${esc(n.name)}</span></button>`
      return `<button type="button" class="toc__row" data-act="report" data-arg="${n.report}" ${S.report === n.report ? 'aria-current="page"' : ''}><span class="toc__name">${esc(n.name)}</span></button>`
    }
    toc.innerHTML = `<button type="button" class="iconbtn toc__btn" data-act="toc" aria-label="Contents" title="Contents" aria-expanded="${S.tocOpen}" ${S.tocOpen ? 'aria-pressed="true"' : ''}>${icon('list')}</button>`
      + (S.tocOpen ? `<div class="toc__pop" role="menu" aria-label="Contents">${TOC.map(node).join('')}</div>` : '') + guideChip()
  }

  /* ── the report ── */
  const paraHTML = (html) => html.replace(/\[\[([^|]+)\|([^\]]+)\]\]/g, (_, id, words) =>
    `<span class="v" data-act="pick" data-arg="${id}" data-v="${id}" role="button" tabindex="0" aria-label="${esc(kindLabel(DPS[id]))}: ${esc(DPS[id].name)}">${words}</span>`)
  /* Tables and charts in the report: each is a data point of its own (a block), made from the targets' and numbers'
     data points, so it agrees with them. They follow the demo's colours: greys and the accent's lemon. */
  const S12_2020 = [15000, 9600] // direct (Scope 1) and energy (Scope 2) emissions in the starting year
  const rowsOf = (id) => DPS[id].actual
  const changeSoFar = (id) => { const a = rowsOf(id); return pct(a[0][1], a.at(-1)[1]) }
  function targetsTable() {
    const rows = [
      ['t-s1', 'Direct and energy emissions', 'Scope 1 and 2, t CO₂e'],
      ['t-s23', 'Value chain emissions per tonne we make', 'Scope 3, t CO₂e per tonne'],
      ['t-nz', 'Net zero, all emissions', 'Scope 1, 2 and 3, t CO₂e'],
    ]
    return `<figure class="fig">
      <figcaption class="fig__cap">Our climate targets<small>Measured from 2020</small></figcaption>
      <table class="rtable">
        <thead><tr><th>Target</th><th>2020</th><th>2023</th><th>So far</th><th>Goal</th></tr></thead>
        <tbody>${rows.map(([id, name, sub]) => {
          const d = DPS[id], [, start] = d.actual[0], [, now] = d.actual.at(-1), [gy, gv] = d.goal
          return `<tr><td><b>${name}</b><small>${sub}</small></td><td>${num(start, d.dec)}</td><td>${num(now, d.dec)}</td><td>${signed(Math.round(changeSoFar(id)))}</td><td><b>${signed(Math.round(pct(start, gv)))}</b><small>by ${gy}</small></td></tr>`
        }).join('')}</tbody>
      </table>
      <p class="fig__note">Emissions from the energy we buy are counted from the electricity we choose to buy (market-based). Per tonne uses what we made each year: 18,090 tonnes in 2023. Carbon credits don’t count towards any target.</p>
    </figure>`
  }
  // Direct and energy emissions each year since 2020, by kind, with the straight line to the 2030 goal
  function pathChart() {
    const W = 496, H = 210, L = 40, R = 8, T = 12, B = 26, max = 30000
    const s1 = [[2020, S12_2020[0]], ...DPS['g-s1'].years], s2 = [[2020, S12_2020[1]], ...DPS['g-s2'].years]
    const [gy, gv] = DPS['t-s1'].goal, start = S12_2020[0] + S12_2020[1]
    const yrs = []; for (let y = 2020; y <= gy; y++) yrs.push(y)
    const step = (W - L - R) / yrs.length, bw = Math.min(26, step * .56)
    const x = (y) => L + (y - 2020 + .5) * step, y = (v) => T + (H - T - B) * (1 - v / max)
    let out = ''
    for (let v = 0; v <= max; v += 10000) out += `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v ? `${v / 1000}k` : 0}</text>`
    s1.forEach(([yr, a], i) => {
      const b = s2[i][1]
      out += `<rect class="ch-s1" x="${x(yr) - bw / 2}" y="${y(a)}" width="${bw}" height="${y(0) - y(a)}" rx="2"/>`
      out += `<rect class="ch-s2" x="${x(yr) - bw / 2}" y="${y(a + b)}" width="${bw}" height="${y(a) - y(a + b) - 1.5}" rx="2"/>`
      if (i === 0 || i === s1.length - 1) out += `<text class="ch-val" x="${x(yr)}" y="${y(a + b) - 6}" text-anchor="middle">${short(a + b)}</text>`
    })
    out += `<line class="ch-path" x1="${x(2020)}" y1="${y(start)}" x2="${x(gy)}" y2="${y(gv)}"/>`
    out += `<circle class="ch-goal" cx="${x(gy)}" cy="${y(gv)}" r="4"/><text class="ch-val ch-val--goal" x="${x(gy)}" y="${y(gv) - 10}" text-anchor="end">Goal ${short(gv)}</text>`
    yrs.forEach((yr) => { if (yr <= s1.at(-1)[0] || yr === 2025 || yr === gy) out += `<text class="ch-axis" x="${x(yr)}" y="${H - 6}" text-anchor="middle">${yr}</text>` })
    return `<figure class="fig">
      <figcaption class="fig__cap">Direct and energy emissions<small>t CO₂e a year, against the 2030 goal</small></figcaption>
      <svg class="fig__svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Direct and energy emissions fell from ${num(start)} t in 2020 to ${num(s1.at(-1)[1] + s2.at(-1)[1])} t in 2023; the goal is ${num(gv)} t by ${gy}">${out}</svg>
      <p class="fig__key"><span><i class="k-s1"></i>Direct (Scope 1)</span><span><i class="k-s2"></i>Energy we buy (Scope 2)</span><span><i class="k-path"></i>Straight line to the goal</span></p>
    </figure>`
  }
  // The main steps to 2030: what each cuts a year by then, compared with 2020, by when, and how much of it is done.
  // What's done adds up to 2023's cut (24,600 to 17,600): renewable electricity is the fall in energy emissions, saving
  // energy the fall in direct ones. The Targets page plans with them too.
  const STEPS = [
    ['Renewable electricity at every site', 6000, 2025, 4480],
    ['Saving energy at every site', 2800, 2030, 2520],
    ['Heat pumps in Leeds and Glasgow', 2400, 2027, 0],
    ['Electric delivery vans in England', 600, 2028, 0],
  ]
  function stepsChart() {
    const total = STEPS.reduce((n, s) => n + s[1], 0), [, gv] = DPS['t-s1'].goal, need = S12_2020[0] + S12_2020[1] - gv
    const max = Math.max(total, need)
    return `<figure class="fig">
      <figcaption class="fig__cap">What each step cuts by 2030<small>t CO₂e a year, compared with 2020</small></figcaption>
      <div class="hbars">${STEPS.map(([n, v, yr]) => `<div class="hbar"><span class="hbar__name">${n}<small>by ${yr}</small></span><span class="hbar__track"><i style="--w:${(v / max) * 100}%"></i></span><span class="hbar__v">${num(v)}</span></div>`).join('')}
        <div class="hbar hbar--sum"><span class="hbar__name">All four steps</span><span class="hbar__track"><i style="--w:${(total / max) * 100}%"></i><b style="--at:${(need / max) * 100}%" title="What the target needs"></b></span><span class="hbar__v">${num(total)}</span></div>
      </div>
      <p class="fig__key"><span><i class="k-need"></i>The 2030 target needs ${num(need)}</span></p>
    </figure>`
  }
  const commentsIn = (pid) => order(REPORT_OF[pid]).filter((id) => PARA_OF[id] === pid).reduce((n, id) => n + S.dp[id].comments.length, 0)
  function renderStage(enter) {
    const r = reportById(S.report)
    const i = REPORTS.indexOf(r)
    const prev = REPORTS[i - 1], next = REPORTS[i + 1]
    const link = (rep, dir) => rep ? `<button type="button" class="dr-link dr-link--${dir}" data-act="report" data-arg="${rep.id}">${dir === 'prev' ? icon('arrow-narrow-left') : ''}<div><small>${dir === 'prev' ? 'Previous' : 'Next'}</small><span>${esc(rep.title)}</span></div>${dir === 'next' ? icon('arrow-narrow-right') : ''}</button>` : '<span></span>'
    stage.innerHTML = `
      <article class="paper ${enter ? 'is-in' : ''}" data-paper>
        <h1 class="paper__title">${esc(r.title)}</h1>
        <div class="parent">
          ${Object.keys(r.paras).map((pid) => `
            <div class="para" data-act="pick" data-arg="${pid}" data-para="${pid}" tabindex="0" aria-label="${esc(DPS[pid].name)}">
              ${typeof r.paras[pid] === 'string' ? `<p class="para__text">${S.html[pid] ?? paraHTML(r.paras[pid])}</p>` : `<div class="para__block">${r.paras[pid].block()}</div>`}
              ${countHTML(pid)}
            </div>`).join('')}
        </div>
      </article>
      <div class="paper__foot">${link(prev, 'prev')}${link(next, 'next')}</div>`
    applySel()
  }
  const countHTML = (pid) => { const n = commentsIn(pid); return n ? `<span class="para__count" data-count title="${n} comment${n === 1 ? '' : 's'}">${icon('message')}${n}</span>` : '' }
  function updateCounts() {
    stage.querySelectorAll('[data-para]').forEach((p) => { p.querySelector('[data-count]')?.remove(); p.insertAdjacentHTML('beforeend', countHTML(p.dataset.para)) })
  }

  // The selection: the open data point's paragraph gets a tint and the toolbar; a value in the text, a stronger tint.
  function applySel() {
    stage.querySelectorAll('.is-sel').forEach((el) => el.classList.remove('is-sel'))
    stage.querySelector('.bar')?.remove()
    if (!S.sel || REPORT_OF[S.sel] !== S.report) return
    const para = stage.querySelector(`[data-para="${PARA_OF[S.sel]}"]`)
    para?.classList.add('is-sel')
    stage.querySelector(`[data-v="${S.sel}"]`)?.classList.add('is-sel')
    const d = DPS[S.sel]
    para?.insertAdjacentHTML('afterbegin', `
      <div class="bar" role="toolbar" aria-label="${esc(kindLabel(d))}">
        <span class="bar__label">${icon(kindIcon(d))}${kindLabel(d)}</span>
        <button type="button" class="iconbtn" data-act="tab" data-arg="comments" aria-label="Comments" title="Comments" aria-pressed="${S.tab === 'comments'}">${icon('message')}</button>
        <button type="button" class="iconbtn" data-act="edit" aria-label="Edit the text" title="${d.block ? 'Tables and charts are made from their numbers' : 'Edit the text'}" aria-pressed="${S.editing === PARA_OF[S.sel]}" ${d.block ? 'disabled' : ''}>${icon('pencil')}</button>
      </div>`)
  }

  /* ── the data point sidebar ── */
  function renderDp(enter) {
    if (!S.sel) { dpEl.hidden = true; dpEl.innerHTML = ''; return }
    const keep = enter ? 0 : dpEl.scrollTop
    const wasHidden = dpEl.hidden
    dpEl.hidden = false
    const id = S.sel, d = DPS[id], st = S.dp[id]
    const list = order(S.report), i = list.indexOf(id)
    const tabs = [['details', 'Details'], ['guidance', 'What to write'], ['comments', 'Comments']]
    if (!tabs.some(([k]) => k === S.tab)) S.tab = 'details'
    dpEl.innerHTML = `
      <div class="dp__head" data-dp-head>
        <span class="dp__kind">${icon(kindIcon(d))}${kindLabel(d)}</span>
        <span class="dp__nav">
          <button type="button" class="iconbtn" data-act="step" data-arg="-1" aria-label="Previous data point" title="Previous" ${i <= 0 ? 'disabled' : ''}>${icon('arrow-narrow-up')}</button>
          <button type="button" class="iconbtn" data-act="step" data-arg="1" aria-label="Next data point" title="Next" ${i >= list.length - 1 ? 'disabled' : ''}>${icon('arrow-narrow-down')}</button>
          <button type="button" class="iconbtn" data-act="close" aria-label="Close" title="Close">${icon('x')}</button>
        </span>
      </div>
      <div class="dp__body ${enter && !wasHidden ? 'is-in' : ''}">
        ${d.kind === 'target' || d.kind === 'metric' ? `<div class="cover">${chart(d, 300, 124)}</div>` : ''}
        <h2 class="dp__title">${esc(d.name)}</h2>
        <div class="tabs"><div class="tabs__list" role="tablist">${tabs.map(([k, label]) => `<button type="button" class="tab" role="tab" data-act="tab" data-arg="${k}" aria-selected="${S.tab === k}" data-tab="${k}">${label}${k === 'comments' && st.comments.length ? `<span class="count">${st.comments.length}</span>` : ''}</button>`).join('')}</div></div>
        ${TABS[S.tab](id, d, st)}
      </div>`
    dpEl.scrollTop = keep
    if (enter && wasHidden) { dpEl.classList.remove('is-in'); void dpEl.offsetWidth; dpEl.classList.add('is-in') }
    onDpScroll()
  }

  const kv = (k, v, row = false) => `<div class="kv"><div class="kv__k">${k}</div><div class="kv__v ${row ? 'kv__v--row' : ''}">${v}</div></div>`
  const sect = (title, body) => `<section class="sect">${title ? `<div class="sect__head">${title}</div>` : ''}${body}</section>`
  const SOURCE_ICON = { 'Typed in': 'pencil', 'Written by AI': 'sparkles', 'From a target': 'target-arrow', 'From a number': 'chart-histogram', 'Added up': 'sum', 'Written from your companies': 'sparkles' }
  const moreBtn = (key) => `<button type="button" class="btn btn--ghost-muted" data-act="more" data-arg="${key}">${S.more.has(key) ? 'Show less' : 'Show more'}</button>`

  const TABS = {
    details(id, d, st) {
      let value = ''
      if (d.kind === 'target') {
        const [by, bv] = d.actual[0], [ly, lv] = d.actual.at(-1), [gy, gv] = d.goal
        const done = Math.max(0, Math.min(100, ((bv - lv) / (bv - gv)) * 100))
        value = sect('Progress', `
          <div class="progress progress--big"><span class="progress__bar" style="--p:${done}%"><i></i></span><span>${num(done)}%</span></div>
          ${kv(`Start, ${by}`, num(bv, d.dec))}
          ${kv(`Now, ${ly}`, `${num(lv, d.dec)} <span class="muted">${signed(pct(bv, lv))}</span>`, true)}
          ${kv(`Goal, ${gy}`, `${num(gv, d.dec)} <span class="muted">${signed(pct(bv, gv))}</span>`, true)}
          ${kv('Unit', esc(d.unit))}`)
      } else if (d.kind === 'metric') {
        const [, v] = d.years.at(-1), [py, pv] = d.years.at(-2)
        const ch = pct(pv, v), good = d.better === 'up' ? ch > 0 : ch < 0
        value = sect('2023', `
          <div class="stat"><span class="big">${withUnit(v, d)}</span><span class="${good ? 'delta' : 'delta delta--off'}">${signed(ch)} from ${py}</span></div>
          ${d.sum ? `<button type="button" class="btn btn--ghost-muted" data-act="metric" data-arg="${id}">${icon('chart-line')}Open in Insights</button>` : ''}`)
      }
      const answer = d.kind === 'narrative'
        ? sect('', `<p class="${S.more.has(`${id}:answer`) ? '' : 'clamp'}" data-answer>${esc(plainText(id))}</p>${moreBtn(`${id}:answer`)}`)
        : ''
      const people = Object.entries(PEOPLE)
      const gov = sect('', `
        ${kv('Owner', `<button type="button" class="who" data-act="menu" aria-haspopup="menu" aria-expanded="${S.menu}">${avatar(st.owner)}<span>${esc(PEOPLE[st.owner].name)}</span>${icon('chevron-down')}</button>
          ${S.menu ? `<div class="menu" role="menu">${people.map(([pid, p]) => `<button type="button" class="menu__item" role="menuitemradio" aria-checked="${pid === st.owner}" data-act="owner" data-arg="${pid}">${avatar(pid)}${esc(p.name)}${pid === st.owner ? icon('check') : ''}</button>`).join('')}</div>` : ''}`)}
        ${kv('Last edited', esc(st.edited))}
        ${kv('Source', `<span class="tag">${icon(SOURCE_ICON[st.source] ?? 'pencil')}${esc(st.source)}</span>`)}
        ${kv('Files', `${st.files.map((f, i) => `<span class="file ${st.justAdded === i ? 'is-new' : ''}"><span class="pdf" aria-hidden="true"></span><span class="file__name" title="${esc(f)}">${esc(f.replace(/\.pdf$/, '').replace(/_/g, ' '))}</span><button type="button" class="iconbtn iconbtn--sm" data-act="unfile" data-arg="${i}" aria-label="Remove ${esc(f)}">${icon('x')}</button></span>`).join('')}
          <button type="button" class="addfile" data-act="file">${icon('plus')}Add file</button>`, true)}
        ${kv('Note', `<textarea class="note" data-note rows="2" placeholder="Add a note" aria-label="Note">${esc(st.note)}</textarea>`)}`)
      st.justAdded = undefined
      return value + answer + gov + subsHTML(id, d)
    },
    guidance(id, d) {
      return sect('', `<p class="about-text">${esc(d.ask)}</p>`)
    },
    comments(id, d, st) {
      return sect('', `
        ${st.comments.length ? `<div class="comments">${st.comments.map((c, i) => `<div class="comment ${c.isNew && i === st.comments.length - 1 ? 'is-new' : ''}">${avatar(c.by)}<div><div class="comment__meta"><b>${esc(PEOPLE[c.by].name)}</b><small>${esc(c.when)}</small></div><p>${esc(c.text)}</p></div></div>`).join('')}</div>` : '<p class="empty">No comments yet. Ask a colleague about this.</p>'}
        <div class="compose"><textarea data-compose rows="1" placeholder="Write a comment" aria-label="Write a comment"></textarea><button type="button" class="iconbtn" data-act="send" aria-label="Send" title="Send">${icon('send')}</button></div>`)
    },
  }

  // The companies' answers: a number's add up; a text's can be written into one answer.
  function subsHTML(id, d) {
    if (d.kind === 'metric' && d.sum) {
      const total = d.years.at(-1)[1]
      let left = total
      const vals = SUBS.map((_, i) => { if (i === SUBS.length - 1) return left; const v = Math.round(total * SHARES[i]); left -= v; return v })
      return sect('From your companies', `
        <div class="subs">${SUBS.map((s, i) => `<div class="sub"><div class="sub__head">${avatar(s.by)}<span class="sub__name">${esc(s.name)}</span><span class="sub__v">${withUnit(vals[i], d)}</span></div></div>`).join('')}</div>`)
    }
    if (!d.subs) return ''
    const sum = S.sums[id]
    const summary = sum
      ? `<div class="ai ${sum.busy ? 'is-busy' : ''}"><p class="${sum.busy ? 'caret' : ''}" data-sum>${esc(sum.text)}</p>
         ${!sum.busy ? (sum.used ? `<p class="ai__done">${icon('circle-check')}In the report</p>` : `<button type="button" class="btn btn--primary btn--sm write" data-act="use-sum">${icon('check')}Use this answer</button>`) : ''}</div>`
      : `<button type="button" class="btn btn--ai write" data-act="write" data-write>${icon('sparkles')}Write one answer from theirs</button>`
    return sect('From your companies', `
      ${summary}
      <div class="subs">${SUBS.map((s, i) => {
        const t = d.subs[i]
        const key = `${id}:sub${i}`
        return `<div class="sub"><div class="sub__head">${avatar(s.by)}<span class="sub__name">${esc(s.name)}</span></div>
          ${t ? `<p class="sub__text ${S.more.has(key) ? '' : 'clamp'}">${esc(t)}</p>${t.length > 110 ? moreBtn(key) : ''}` : '<p class="hint">No answer yet</p>'}</div>`
      }).join('')}</div>`)
  }

  function onDpScroll() { $('[data-dp-head]', dpEl)?.classList.toggle('is-stuck', dpEl.scrollTop > 4) }
  dpEl.addEventListener('scroll', onDpScroll, { passive: true })

  /* ── a dialog: the report's guide ── */
  function renderLayer() {
    const html = S.layer === 'guide' ? guideHTML() : ''
    const opening = !layer.innerHTML && html, shown = layer.dataset.shown
    // Redrawing the same dialog keeps its scroll and doesn't replay its entrance
    const scroller = $('[data-guide-body]', layer), keep = scroller?.scrollTop ?? 0
    layer.innerHTML = html
    layer.dataset.shown = S.layer ?? ''
    layer.classList.toggle('is-still', !opening && shown === S.layer)
    if (!opening && shown === S.layer) { const sc = $('[data-guide-body]', layer); if (sc) sc.scrollTop = keep }
    if (opening) ($('[data-act="close-layer"]', layer) ?? $('button', layer))?.focus()
  }

  /* ── notes at the bottom right ── */
  function toast(text, ico = 'check') {
    const el = document.createElement('div')
    el.className = 'toast'
    el.innerHTML = `${icon(ico)}<span>${esc(text)}</span>`
    $('[data-toasts]').append(el)
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220) }, 3000)
  }

  /* ── editing a paragraph ── */
  function startEdit(pid) {
    finishEdit()
    const p = stage.querySelector(`[data-para="${pid}"]`)
    if (!p) return
    S.editing = pid
    p.classList.add('is-editing')
    const t = $('.para__text', p)
    t.contentEditable = 'true'
    t.focus()
    const r = document.createRange(); r.selectNodeContents(t); r.collapse(false)
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r)
    applySel()
  }
  function finishEdit() {
    if (!S.editing) return
    const pid = S.editing
    S.editing = undefined
    const p = stage.querySelector(`[data-para="${pid}"]`)
    if (!p) return
    const t = $('.para__text', p)
    t.contentEditable = 'false'
    p.classList.remove('is-editing')
    const html = t.innerHTML.replace(/ class="v[^"]*"/g, ' class="v"')
    const before = S.html[pid] ?? paraHTML(reportById(REPORT_OF[pid]).paras[pid])
    if (html !== before) { S.html[pid] = html; S.dp[pid].edited = 'Today'; S.dp[pid].owner = ME; if (S.sel && PARA_OF[S.sel] === pid) renderDp() }
    applySel()
  }

  /* ── input ── */
  function pick(id) {
    if (S.editing && PARA_OF[id] === S.editing) return
    finishEdit()
    const opening = !S.sel
    if (S.sel !== id) S.menu = false
    S.sel = id
    applySel()
    renderDp(opening || true)
  }
  function reveal(id, scroll = true) {
    const el = stage.querySelector(`[data-v="${id}"]`) ?? stage.querySelector(`[data-para="${PARA_OF[id]}"]`)
    if (!el) return
    if (scroll) el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    const p = stage.querySelector(`[data-para="${PARA_OF[id]}"]`)
    p.classList.remove('is-flash'); void p.offsetWidth; p.classList.add('is-flash')
  }
  async function write(id) {
    const d = DPS[id]
    S.sums[id] = { text: '', busy: true }
    renderDp()
    await wait(700)
    const words = d.summary.split(/(?<= )/)
    for (const w of words) {
      if (!S.sums[id]) return
      S.sums[id].text += w
      const el = S.sel === id && $('[data-sum]', dpEl)
      if (el) el.textContent = S.sums[id].text
      await wait(28)
    }
    S.sums[id].busy = false
    if (S.sel === id) renderDp()
  }

  /* ════════ the other pages: Home, Help center, Insights, a target ════════
     Each page is a function in PAGES that returns its HTML from S; renderPage() draws the one open. */
  const pageEl = $('[data-page]')
  const reportEl = $('[data-report]')
  const SECTION = { home: 'home', help: 'help', report: 'report', target: 'target', metric: 'metric' }
  // [page, skeuomorphic icon, name]
  const RAIL = [
    ['home', 'home', 'Home'],
    ['target', 'target', 'Targets'],
    ['metric', 'insights', 'Insights'],
    ['report', 'report', 'Report'],
  ]
  const RAIL_END = [['help', 'help', 'Help center']] // above the avatar
  const plural = (n, w) => `${n} ${n === 1 ? w : `${w}s`}`
  const COUNTRY = { no: 'England', se: 'Scotland', dk: 'Ireland', wa: 'Wales' }

  Object.assign(S, {
    page: 'home', // the demo starts at Home
    todo: new Set(),
    help: { q: '' },
    guide: { step: 0, read: new Set([0]), min: false },
    metric: 'g-s1',
    met: { range: '1q', on: new Set(['no', 'dk', 'se', 'wa']), forecast: true, target: true, targets: {}, editTarget: false },
    tgt: { show: { mile: true, interp: true, actual: true, impact: true }, base: 24600, miles: [[2025, 19400], [2027, 17300], [2030, 14268]], edit: undefined, actions: [true, true, false, false] },
  })

  /* ── navigation ── */
  function go(p, set) {
    finishEdit()
    S.menu = false; S.tocOpen = false
    S.page = p
    S.layer = undefined
    if (set) set()
    renderAll(true)
  }
  function renderAll(enter) {
    const isReport = S.page === 'report'
    reportEl.hidden = !isReport
    pageEl.hidden = isReport
    renderRail()
    if (isReport) { renderToc(); renderStage(); renderDp() } else renderPage(enter)
    renderLayer()
  }
  function renderPage(enter) {
    const keep = pageEl.scrollTop
    pageEl.innerHTML = `<div class="pg pg--${S.page} ${enter ? 'is-in' : ''}">${PAGES[S.page]()}</div>`
    pageEl.scrollTop = enter ? 0 : keep
    $('[data-autofocus]', pageEl)?.focus()
  }

  /* ════ Home ════ */
  const TODO = [['tour', 'Take the product tour', 'Onboarding · 3 min'], ['invite', 'Invite your team', 'Isabel and Liam are waiting'], ['file', 'Upload last year’s report', 'So Celsia can fill in what it already knows'], ['target', 'Review the climate targets', 'Due Friday']]
  // The report's topics and how far each has come: Climate opens, the rest are only on Home
  const TOPICS = [['Climate', 82, 'report'], ['Pollution', 60], ['Water', 35], ['People', 48], ['Business conduct', 15]]
  const SKILLS = [
    ['people', 'Celsia community', 'Ask others who report, and share what works', 'toast', 'The community opens in its own site'],
    ['sparkles', 'Ask AI', 'Get answers about reporting in plain words', 'toast', 'Ask AI isn’t in this demo'],
    ['academy', 'Celsia Academy', 'Short courses and webinars by experts', 'go', 'help'],
  ]
  const tourCard = (title) => `<button type="button" class="tour" data-act="tour"><span class="tour__shot"><img src="assets/tour.webp" alt="" width="800" height="506" /></span>
    <span class="tour__foot"><span><b>${title}</b><small>3 minutes and you’re up to speed</small></span><span class="play">${icon('player-play')}</span></span></button>`
  const PAGES = {}
  PAGES.home = () => `
    <div class="wrap">
      <h1 class="h1 h1--hello">Welcome back, Hannah</h1>
      <p class="hello-sub">Report 2023 is due in 6 weeks. Here’s where things stand.</p>
      <div class="home-top">
        <section class="todo" aria-label="To do">
          <h2 class="h2 h2--list">To do</h2>
          ${TODO.map(([k, t, sub]) => { const done = S.todo.has(k); return `<div class="todo__row ${done ? 'is-done' : ''}">
            <button type="button" class="tick" role="checkbox" aria-checked="${done}" data-act="todo" data-arg="${k}" aria-label="${t}">${icon(done ? 'circle-check' : 'circle-dashed-check')}</button>
            <span class="todo__text"><b>${t}</b><small>${sub}</small></span></div>` }).join('')}
        </section>
        ${tourCard('Product tour')}
      </div>
      <div class="h2row"><h2 class="h2">Report 2023</h2><small>Due 31 March</small></div>
      <div class="topics">${TOPICS.map(([n, p, to]) => `<button type="button" class="topic ${to ? '' : 'is-off'}" data-act="${to ? 'go' : 'toast'}" data-arg="${to ?? `${n} isn’t written in this demo`}"><span class="topic__name">${n}</span><span class="topic__bar" style="--p:${p}%"><i></i></span><span class="topic__pct">${p}%</span>${icon('arrow-narrow-right')}</button>`).join('')}</div>
      <h2 class="h2 h2--sect">Quick links</h2>
      <div class="cards3">${[['report', 'report', 'Report', 'Write and review it with your team'], ['target', 'target', 'Targets', 'Plan the actions that reach them'], ['metric', 'insights', 'Insights', 'Follow your numbers against targets']]
        .map(([p, i, t, sub]) => `<button type="button" class="qcard is-on" data-act="go" data-arg="${p}">${skeu(i)}<b>${t}</b><small>${sub}</small></button>`).join('')}</div>
      <h2 class="h2 h2--sect">Learn with Celsia</h2>
      <div class="cards3">${SKILLS.map(([i, t, sub, act, arg]) => `<button type="button" class="skill is-on" data-act="${act}" data-arg="${esc(arg)}"><span class="skill__art">${skeu(i)}</span><b>${t}</b><small>${sub}</small></button>`).join('')}</div>
    </div>`

  /* ════ Help center ════ */
  const HELP = [
    { id: 'basics', icon: 'file-text', name: 'Reporting basics', items: ['What is a sustainability report?', 'Who has to report, and when', 'Choosing what to report on', 'Writing clear answers', 'Working with your auditor'] },
    { id: 'climate', icon: 'chart-histogram', name: 'Climate basics', items: ['Scope 1, 2 and 3, explained', 'How to measure your emissions', 'Setting a climate target', 'Renewable energy, explained', 'How climate change affects a business'] },
  ]
  const APP_GUIDES = ['How to get started', 'Inviting your team', 'How data flows into the report', 'Working with your companies', 'About Celsia']
  const article = (t) => `<li><button type="button" class="art" data-act="article" data-arg="${esc(t)}">${icon('file')}<span>${esc(t)}</span></button></li>`
  // a card shows its first three articles; the search finds the rest
  const helpCard = (id, ico, name, items) => `<section class="hcard"><h3 class="hcard__head"><span class="hcard__ico">${icon(ico)}</span>${esc(name)}</h3><ul class="arts">${items.slice(0, 3).map(article).join('')}</ul></section>`
  function helpResults() {
    const q = S.help.q.trim().toLowerCase()
    const hits = [...APP_GUIDES.map((t) => [t, 'Using Celsia']), ...HELP.flatMap((g) => g.items.map((t) => [t, g.name]))].filter(([t]) => t.toLowerCase().includes(q))
    return hits.length
      ? `<ul class="arts arts--results">${hits.map(([t, g]) => `<li><button type="button" class="art" data-act="article" data-arg="${esc(t)}">${icon('file')}<span>${esc(t)}</span><small>${esc(g)}</small></button></li>`).join('')}</ul>`
      : `<p class="empty">Nothing found for “${esc(S.help.q.trim())}”. Try “emissions” or “report”.</p>`
  }
  PAGES.help = () => `
    <div class="wrap">
      <h1 class="h1">How can we help?</h1>
      <label class="search search--big">${icon('search')}<input type="search" data-help-q value="${esc(S.help.q)}" placeholder="Search articles" aria-label="Search articles" /></label>
      <div data-help-results ${S.help.q.trim() ? '' : 'hidden'}>${S.help.q.trim() ? helpResults() : ''}</div>
      <div data-help-main ${S.help.q.trim() ? 'hidden' : ''}>
        <div class="cards2 cards2--help">${helpCard('app', 'bulb', 'Using Celsia', APP_GUIDES)}${tourCard('Product tour')}</div>
        <div class="cards2">${HELP.map((g) => helpCard(g.id, g.icon, g.name, g.items)).join('')}</div>
        <p class="muted help-foot">Stuck? <button type="button" class="link" data-act="toast" data-arg="Support would open a chat here">Talk to us</button>, we usually answer within an hour.</p>
      </div>
    </div>`

  /* The report's guide: it opens only from the product tour's card (on Home, and in the Help center), not when the
     report does. Its pictures follow the Figma concept's onboarding ("Celsia app – Concepts 24-25", 2004:30632), redrawn
     from the demo's own screens: each is a crop of a screen (assets/guide-*.webp, made by taking screenshots of the
     demo) on a coloured panel. Hidden, it leaves a chip at the report's bottom left to pick it up again. */
  const GUIDE = [
    { t: 'Welcome', art: 'report', h: 'This is your report', p: ['Write it and review it here, with your team. The highlighted numbers and texts come from your companies and documents, and stay up to date.', 'The guide takes a minute. Hide it any time, and pick it up again from the Guide button.'] },
    { t: 'Details', art: 'details', h: 'Details and comments', p: ['Click any highlighted number or text to see who owns it, its files and its comments.', 'Ask a colleague right there, instead of over email.'] },
    { t: 'Answers', art: 'write', h: 'One answer from many', p: ['Your companies answer the report’s questions in Celsia. Open a text, and Celsia writes one answer from theirs.', 'Read it, then put it in the report with one click.'] },
  ]
  const shot = (name, w, h, cls = '') => `<span class="gart__shot ${cls}"><img src="assets/guide-${name}.webp" alt="" width="${w}" height="${h}" /></span>`
  const ARTS = {
    report: () => shot('report', 720, 425),
    details: () => shot('report', 720, 425, 'gart__shot--a') + shot('dp', 320, 560, 'gart__shot--b'),
    write: () => shot('report', 720, 425, 'gart__shot--a') + shot('write', 320, 560, 'gart__shot--b'),
  }
  const guideArt = (a) => `<div class="gart gart--${a}">${ARTS[a]()}</div>`
  const guideChip = () => S.guide.min && S.layer !== 'guide' ? `<button type="button" class="guide-chip" data-act="guide-open">${icon('book')}Guide<span class="muted">${S.guide.read.size} of ${GUIDE.length}</span></button>` : ''
  function guideHTML() {
    const g = S.guide, step = GUIDE[g.step], last = g.step === GUIDE.length - 1
    return `<div class="dialog dialog--guide" role="dialog" aria-modal="true" aria-label="Report guide">
      <nav class="guide__nav" aria-label="Guide"><p class="guide__label">Guide</p>${GUIDE.map((x, i) => `<button type="button" class="guide__step" data-act="guide-to" data-arg="${i}" ${i === g.step ? 'aria-current="step"' : ''}><span class="guide__tick ${g.read.has(i) ? 'is-read' : ''}">${icon(g.read.has(i) ? 'circle-check' : 'circle-dashed-check')}</span>${x.t}</button>`).join('')}</nav>
      <div class="guide__main">
        <button type="button" class="iconbtn guide__hide" data-act="guide-hide" aria-label="Hide the guide" title="Hide">${icon('x')}</button>
        <div class="guide__body" data-guide-body>
          ${guideArt(step.art)}
          <h3 class="guide__title">${step.h}</h3>
          ${step.p.map((t) => `<p>${t}</p>`).join('')}
        </div>
        <div class="guide__foot">
          <span class="guide__dots">${GUIDE.map((_, i) => `<i ${i === g.step ? 'class="is-on"' : ''}></i>`).join('')}</span>
          <span>
            ${g.step ? `<button type="button" class="btn" data-act="guide-step" data-arg="-1">Back</button>` : ''}
            <button type="button" class="btn btn--primary" data-act="guide-step" data-arg="1">${last ? 'Done' : 'Next'}</button>
          </span>
        </div>
      </div>
    </div>`
  }

  /* ════ Insights: a number's chart against its target, by country ════ */
  const MET_C = [['no', 'England', 'var(--tone-1)'], ['se', 'Scotland', 'var(--tone-2)'], ['dk', 'Ireland', 'var(--tone-3)'], ['wa', 'Wales', 'var(--steel-1)']]
  // 2024 by quarter, Q4 the forecast; each company's share as in the report's sidebar (SHARES), 12,040 t in all
  const Q24 = { no: [1338, 1199, 1091, 1308], se: [881, 790, 718, 862], dk: [620, 556, 506, 606], wa: [424, 380, 346, 415] }
  const YEARS = [[2020, 15000], [2021, 14100], [2022, 13280], [2023, 12480], [2024, 12040]] // as in the report
  const YSHARE = { no: 0.41, se: 0.27, dk: 0.19, wa: 0.13 }
  const MONTHW = [0.35, 0.32, 0.33]
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const RANGES = [['1m', 'Months'], ['1q', 'Quarters'], ['5y', 'Years']]
  const metFactor = () => DPS[S.metric].years.at(-1)[1] / 12480
  const metTarget = () => S.met.targets[S.metric] ?? Math.round((DPS[S.metric].years.at(-1)[1] * 0.945) / 100) * 100
  // The periods on the chart: { label, v: { no, dk, se }, forecast }
  function metPeriods() {
    const f = metFactor(), r = S.met.range
    const sc = (v) => Math.round(v * f)
    if (r === '1q') return [0, 1, 2, 3].map((i) => ({ label: `Q${i + 1}`, v: Object.fromEntries(MET_C.map(([c]) => [c, sc(Q24[c][i])])), forecast: i === 3 }))
    if (r === '1m') return MONTHS.map((m, i) => { const q = Math.floor(i / 3), w = MONTHW[i % 3]; return { label: m, v: Object.fromEntries(MET_C.map(([c]) => [c, sc(Q24[c][q] * w)])), forecast: i >= 9 } })
    return YEARS.map(([y, v]) => ({ label: String(y), v: Object.fromEntries(MET_C.map(([c]) => [c, sc(v * YSHARE[c])])), forecast: y === 2024 }))
  }
  const sumOn = (p, on = S.met.on) => MET_C.reduce((n, [c]) => n + (on.has(c) ? p.v[c] : 0), 0)
  const yearly = () => S.met.range === '1q' || S.met.range === '1m'
  // Within a year, the bars build up to the year's total (a waterfall), so they meet the yearly target line
  function metChart(W, H) {
    const ps = metPeriods().filter((p) => S.met.forecast || !p.forecast)
    const fall = yearly()
    const bars = [...ps]
    if (yearly()) bars.push({ label: 'Total', total: true, forecast: S.met.forecast })
    const all = ps.reduce((n, p) => n + sumOn(p), 0)
    const target = metTarget()
    const tops = fall ? [all] : bars.map((p) => sumOn(p))
    if (S.met.target) tops.push(target)
    const ymax = niceMax(Math.max(...tops, 1))
    const L = 44, R = 0, T = 12, B = 26, pw = W - L - R, ph = H - T - B
    const y = (v) => T + ph - (v / ymax) * ph
    const ty = S.met.target ? y(target) : -99
    const slot = pw / bars.length, bw = Math.min(44, slot * 0.42)
    let out = ''
    const fc = bars.findIndex((p) => p.forecast)
    if (fc >= 0) {
      const fx = L + slot * fc
      out += `<path class="mc-fc" d="${sqPath(fx, T, L + pw - fx, ph, 8)}"/><svg class="ico mc-fc__i" x="${fx + 10}" y="${T + 8}" width="12" height="12" viewBox="0 0 24 24">${ICONS.sparkles}</svg><text class="mc-fc__t" x="${fx + 26}" y="${T + 18}">Forecast</text>`
    }
    // The axis' numbers, except one the target's own number on the axis would cover
    for (let i = 0; i <= 4; i++) { const v = (ymax / 4) * i; out += `<line class="ch-grid ch-grid--solid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>${Math.abs(y(v) - ty) < 14 ? '' : `<text class="ch-axis" x="${L - 10}" y="${y(v) + 3}" text-anchor="end">${short(v)}</text>`}` }
    let run = 0
    bars.forEach((p, i) => {
      const cx = L + slot * (i + 0.5), x = cx - bw / 2
      let base = p.total || !fall ? 0 : run
      const parts = p.total ? MET_C.map(([c]) => [c, ps.reduce((n, q) => n + (S.met.on.has(c) ? q.v[c] : 0), 0)]) : MET_C.map(([c]) => [c, S.met.on.has(c) ? p.v[c] : 0])
      const shown = parts.filter(([, v]) => v)
      // Stacked from the bottom, with a hairline of white between colours; the top one rounded; a forecast paler
      shown.forEach(([c, v], j) => {
        const col = MET_C.find((m) => m[0] === c)[2]
        const top = j === shown.length - 1
        out += `<path class="mc-bar" d="${sqPath(x, y(base + v), bw, y(base) - y(base + v), top ? 4 : 0, true)}" style="fill:${col}" ${p.forecast ? 'opacity=".5"' : ''}><title>${COUNTRY[c]}, ${p.label}: ${num(v)}</title></path>`
        base += v
      })
      if (!p.total) run += sumOn(p)
      out += `<text class="ch-axis ${p.total ? 'is-strong' : ''}" x="${cx}" y="${H - 6}" text-anchor="middle">${p.label}</text>`
    })
    if (S.met.target) {
      // The target's number sits on the axis, where the line starts, so it never covers a bar
      out += `<line class="mc-target" x1="${L}" x2="${W - R}" y1="${ty}" y2="${ty}"/><g><title>Target: ${num(target)}</title><path class="mc-pill" d="${sqPath(0, ty - 9, L - 4, 18, 9)}"/><text class="mc-pill__t" x="${(L - 4) / 2}" y="${ty + 3.5}" text-anchor="middle">${short(target)}</text></g>`
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(DPS[S.metric].name)} by ${yearly() ? 'period' : 'year'}, against its target">${out}</svg>`
  }
  // A bar with its top corners rounded by r
  const forecastTotal = () => metPeriods().reduce((n, p) => n + sumOn(p, new Set(MET_C.map(([c]) => c))), 0)
  function metAlert() {
    if (!yearly() || !S.met.forecast) return ''
    const d = DPS[S.metric], total = forecastTotal(), target = metTarget(), unit = d.unit === 't CO₂e' ? 't' : d.unit
    const form = S.met.editTarget ? `<form class="tform" data-tform><label>Target for 2024 <input data-target-input value="${target}" inputmode="numeric" aria-label="Target for 2024" data-autofocus /></label><span class="muted">${esc(d.unit)}</span><button type="submit" class="btn btn--sm btn--primary">Save</button><button type="button" class="btn btn--sm" data-act="target-cancel">Cancel</button></form>` : ''
    return total > target
      ? `<div class="alert alert--warn">${icon('alert-triangle')}<div><b>On course to miss the target by ${num(total - target)} ${unit}</b><p>At this pace, 2024 ends at ${num(total)} ${unit}, above the target of ${num(target)} ${unit}. <button type="button" class="link" data-act="go" data-arg="target">Add actions</button> or <button type="button" class="link" data-act="target-edit">change the target</button>.</p>${form}</div></div>`
      : `<div class="alert alert--ok">${icon('circle-check')}<div><b>On track</b><p>At this pace, 2024 ends at ${num(total)} ${unit}, within the target of ${num(target)} ${unit}. <button type="button" class="link" data-act="target-edit">Change the target</button></p>${form}</div></div>`
  }
  PAGES.metric = () => {
    const ps = metPeriods().filter((p) => S.met.forecast || !p.forecast)
    const total = (c) => ps.reduce((n, p) => n + p.v[c], 0), all = MET_C.reduce((n, [c]) => n + total(c), 0)
    const d = DPS[S.metric]
    return `
    <div class="wrap met">
      <div class="met__head">
        <div><h1 class="h1 h1--tight">${esc(d.name)}</h1><p class="muted">${esc(d.unit)}, ${yearly() ? '2024' : '2020 to 2024'}${S.metric === 'g-s1' || S.metric === 'g-s2' ? ` · Part of <button type="button" class="link" data-act="go" data-arg="target">our 2030 target</button>` : ''}</p></div>
        <div class="seg" role="group" aria-label="Period">${RANGES.map(([r, t]) => `<button type="button" aria-pressed="${S.met.range === r}" data-act="met-range" data-arg="${r}">${t}</button>`).join('')}</div>
      </div>
      <div class="met__chart">${metChart(576, 300)}</div>
      <div class="met__keys">
        ${MET_C.map(([c, n, col]) => { const on = S.met.on.has(c); return `<button type="button" class="key ${on ? '' : 'is-off'}" style="--c:${col}" role="checkbox" aria-checked="${on}" data-act="met-c" data-arg="${c}"><i></i>${n}<span title="${num(total(c))} t">${Math.round((total(c) / all) * 100)}%</span></button>` }).join('')}
        <span class="met__toggles">${[['forecast', 'Forecast'], ['target', 'Target']].map(([k, t]) => `<button type="button" class="chip" data-act="met-show" data-arg="${k}" aria-pressed="${S.met[k]}">${icon(S.met[k] ? 'eye' : 'eye-off')}${t}</button>`).join('')}</span>
      </div>
      ${metAlert()}
    </div>`
  }

  /* ════ A target: the report's 2030 target for direct and energy emissions (t-s1), planned with the report's steps ════
     The plan runs straight from 2020 through its milestones; what actually happened is drawn to 2023; from there the steps
     picked each cut what's left of them, in a straight line, by their year. */
  const TGT = DPS['t-s1']
  const TGT_X = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]
  const TGT_NOW = TGT.actual.at(-1)
  const interp = (yr) => {
    const pts = [[2020, S.tgt.base], ...S.tgt.miles]
    for (let i = 1; i < pts.length; i++) if (yr <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((yr - x0) / (x1 - x0)) * (y1 - y0) }
    return pts.at(-1)[1]
  }
  const impactAt = (yr) => TGT_NOW[1] - STEPS.reduce((n, [, cut, y, done], i) => n + (S.tgt.actions[i] ? (cut - done) * Math.max(0, Math.min(1, (yr - TGT_NOW[0]) / (y - TGT_NOW[0]))) : 0), 0)
  function tgtChart(W, H) {
    const L = 34, R = 10, T = 14, B = 28, pw = W - L - R, ph = H - T - B, sh = S.tgt.show
    const x = (i) => L + (i / (TGT_X.length - 1)) * pw
    const ymax = 30000, y = (v) => T + ph - (v / ymax) * ph
    const line = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')
    let out = ''
    TGT_X.forEach((yr, i) => { out += `<text class="tg-x ${S.tgt.miles.some((m) => m[0] === yr) || yr === 2020 ? 'is-mile' : ''}" x="${x(i)}" y="${H - 6}" text-anchor="middle">’${String(yr).slice(2)}</text>` })
    for (let v = 0; v <= ymax; v += 10000) out += `<line class="ch-grid ch-grid--solid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-axis" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v ? `${v / 1000}k` : 0}</text>`
    // The plan as a soft area under its line
    if (sh.interp) { const pts = TGT_X.map((yr, i) => [x(i), y(interp(yr))]); out += `<path class="tg-area" d="M${pts[0][0]} ${T + ph}${pts.map((p) => `L${p[0]} ${p[1]}`).join('')}L${pts.at(-1)[0]} ${T + ph}Z"/><path class="tg-line" d="${line(pts)}"/>` }
    if (sh.actual) { const pts = TGT.actual.map(([yr, v]) => [x(TGT_X.indexOf(yr)), y(v)]); out += `<path class="tg-actual" d="${line(pts)}"/>${pts.map(([cx, cy], i) => `<circle class="tg-dot" cx="${cx}" cy="${cy}" r="3"><title>${TGT.actual[i][0]}: ${num(TGT.actual[i][1])} tonnes</title></circle>`).join('')}` }
    if (sh.impact) { const from = TGT_X.indexOf(TGT_NOW[0]), pts = TGT_X.slice(from).map((yr, i) => [x(from + i), y(impactAt(yr))]); out += `<path class="tg-impact" d="${line(pts)}"/>` }
    if (sh.mile) for (const [yr, v] of [[2020, S.tgt.base], ...S.tgt.miles]) { const i = TGT_X.indexOf(yr); if (i >= 0) out += `<circle class="tg-mile" cx="${x(i)}" cy="${y(v)}" r="4.5"><title>${yr}: ${num(v)} tonnes</title></circle>` }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Direct and energy emissions: the plan, its milestones, what happened to 2023, and the effect of the chosen steps">${out}</svg>`
  }
  const tgtCell = (key, v) => S.tgt.edit === key
    ? `<input class="val__input val__input--wide" data-tgt="${key}" value="${v}" inputmode="numeric" aria-label="Value in tonnes" data-autofocus />`
    : `<button type="button" class="val val--edit" data-act="tgt-edit" data-arg="${key}" title="Click to change">${num(v)}${icon('pencil')}</button>`
  PAGES.target = () => {
    const t = S.tgt, sh = t.show, final = t.miles.at(-1), reach = Math.round(impactAt(final[0]))
    const legend = [['interp', 'Plan', 'var(--steel-1)'], ['actual', 'So far', 'var(--text)'], ['mile', 'Milestones', 'var(--text)'], ['impact', 'With our steps', 'var(--brand)']]
    const rows = [[2020, t.base, 'base', 'Start'], ...t.miles.map(([yr, v], i) => [yr, v, `m${i}`, i === t.miles.length - 1 ? 'Goal' : ''])]
    return `
    <div class="wrap">
      <div class="tg-head"><div><h1 class="h1 h1--tight">${esc(TGT.name)}</h1><p class="muted">Direct emissions and those from the energy we buy, from ${num(t.base)} tonnes in 2020 to ${num(final[1])} by ${final[0]}. ${num(TGT_NOW[1])} in ${TGT_NOW[0]}.</p></div>
        <button type="button" class="btn btn--sm" data-act="in-report" data-arg="t-s1">${icon('file-text')}In the report</button></div>
      <div class="tg-chart">${tgtChart(576, 210)}</div>
      <div class="tg-legend">${legend.map(([k, n, c]) => `<button type="button" class="key ${sh[k] ? '' : 'is-off'}" style="--c:${c}" role="checkbox" aria-checked="${sh[k]}" data-act="tgt-show" data-arg="${k}"><i class="key--${k}"></i>${n}</button>`).join('')}</div>
      <ol class="steps">
        <li class="step"><span class="step__n">1</span><div class="step__body">
          <h2 class="h2">Milestones</h2><p class="muted">Where emissions should be on the way. In tonnes of CO₂e.</p>
          <div class="gtable">${rows.map(([yr, v, key, tag]) => `<div class="gtable__row"><span class="gtable__y">${yr}${tag ? ` <span class="tag">${tag}</span>` : ''}</span><span>${tgtCell(key, v)}</span><span class="muted">${key === 'base' ? '' : signed(pct(t.base, v))}</span></div>`).join('')}</div>
        </div></li>
        <li class="step"><span class="step__n">2</span><div class="step__body">
          <h2 class="h2">Steps</h2><p class="muted">Pick what will help. The dashed line on the chart shows what’s left of them, from ${TGT_NOW[0]}.</p>
          <div class="acts">${STEPS.map(([n, cut, yr, done], i) => `<button type="button" class="act-row" role="checkbox" aria-checked="${t.actions[i]}" data-act="tgt-action" data-arg="${i}"><span class="cbox ${t.actions[i] ? 'is-on' : ''}">${icon('check')}</span><span class="act-row__n">${n}</span><span class="muted">−${num(cut)} t by ${yr}${done ? `, ${Math.round((done / cut) * 100)}% done` : ''}</span></button>`).join('')}</div>
          <p class="verdict ${reach <= final[1] ? 'is-ok' : ''}">${reach <= final[1] ? icon('circle-check') : icon('alert-triangle')}<span>${reach <= final[1] ? `These steps reach the goal: ${num(reach)} tonnes by ${final[0]}.` : `These steps get to ${num(reach)} tonnes by ${final[0]}, ${num(reach - final[1])} short of the goal.`}</span></p>
        </div></li>
        <li class="step"><span class="step__n">3</span><div class="step__body">
          <h2 class="h2">Tracking</h2><p class="muted">Checked every quarter against the numbers in <button type="button" class="link" data-act="go" data-arg="metric">Insights</button>, and reported in <button type="button" class="link" data-act="in-report" data-arg="t-s1">Climate targets</button>.</p>
        </div></li>
      </ol>
    </div>`
  }

  /* ── the page actions ── */
  const PAGE_ACTIONS = {
    go: (p) => go(p),
    article: (t) => toast(`“${t}” opens in the help center`, 'book'),
    todo: (k) => { S.todo.has(k) ? S.todo.delete(k) : S.todo.add(k); renderPage(); if (S.todo.size === TODO.length) toast('All done for today') },
    tour: () => { S.todo.add('tour'); S.guide = { ...S.guide, step: 0, min: false }; go('report', () => { S.layer = 'guide' }) },
    metric: (id) => go('metric', () => { S.metric = id; S.met.editTarget = false }),
    'in-report': (id) => { go('report', () => { S.report = REPORT_OF[id]; S.sel = id; S.tab = 'details' }); applySel(); renderDp(true); reveal(id) },
    'guide-open': () => { S.guide.min = false; S.layer = 'guide'; renderLayer(); renderToc() },
    'guide-hide': () => { S.guide.min = true; S.layer = undefined; renderLayer(); renderToc() },
    'guide-to': (i) => { S.guide.step = Number(i); renderLayer() },
    'guide-step': (n) => {
      const g = S.guide
      g.read.add(g.step)
      if (Number(n) > 0 && g.step === GUIDE.length - 1) { g.min = false; S.layer = undefined; renderLayer(); renderToc(); return toast('You’ve finished the guide') }
      g.step = Math.max(0, Math.min(GUIDE.length - 1, g.step + Number(n))); renderLayer()
    },
    'met-range': (r) => { S.met.range = r; S.met.editTarget = false; renderPage() },
    'met-c': (c) => { const on = S.met.on; on.has(c) ? on.delete(c) : on.add(c); renderPage() },
    'met-show': (k) => { S.met[k] = !S.met[k]; renderPage() },
    'target-edit': () => { S.met.editTarget = true; renderPage() },
    'target-cancel': () => { S.met.editTarget = false; renderPage() },
    'tgt-show': (k) => { S.tgt.show[k] = !S.tgt.show[k]; renderPage() },
    'tgt-edit': (k) => { S.tgt.edit = k; renderPage(); $(`[data-tgt="${k}"]`, pageEl)?.select() },
    'tgt-action': (i) => { S.tgt.actions[i] = !S.tgt.actions[i]; renderPage() },
  }

  // Values typed on a page: the target's baseline and milestones, the metric's target
  function commitInput(el) {
    const v = Number(String(el.value).replace(/[^\d.]/g, ''))
    if (el.dataset.tgt) {
      const k = el.dataset.tgt
      if (Number.isFinite(v) && v >= 0) { if (k === 'base') S.tgt.base = v; else S.tgt.miles[Number(k.slice(1))][1] = v }
      S.tgt.edit = undefined
    }
    renderPage()
  }
  pageEl.addEventListener('keydown', (e) => {
    const t = e.target
    if (t.dataset.tgt && e.key === 'Enter') { e.preventDefault(); commitInput(t) }
    if (t.dataset.tgt && e.key === 'Escape') { e.stopPropagation(); S.tgt.edit = undefined; renderPage() }
  })
  pageEl.addEventListener('focusout', (e) => { const t = e.target; if (t.dataset.tgt && S.tgt.edit) commitInput(t) })
  pageEl.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-tform]')) return
    e.preventDefault()
    const v = Number(String($('[data-target-input]', e.target).value).replace(/[^\d.]/g, ''))
    if (Number.isFinite(v) && v > 0) { S.met.targets[S.metric] = v; toast(`The 2024 target is ${num(v)} ${DPS[S.metric].unit} now`) }
    S.met.editTarget = false; renderPage()
  })
  // Searches and filters redraw only their results, so the field keeps its focus
  pageEl.addEventListener('input', (e) => {
    const t = e.target
    if (t.matches('[data-help-q]')) {
      S.help.q = t.value
      const has = !!t.value.trim(), res = $('[data-help-results]', pageEl)
      res.hidden = !has; $('[data-help-main]', pageEl).hidden = has
      res.innerHTML = has ? helpResults() : ''
    }
  })

  const ACTIONS = {
    pick: (id) => pick(id),
    report: (rid) => {
      finishEdit()
      if (S.report === rid) { S.tocOpen = false; return renderToc() }
      // with the sidebar open, it stays open on the new section's first paragraph (on the same tab)
      S.tocOpen = false
      S.report = rid; S.sel = S.sel ? order(rid)[0] : undefined; S.menu = false
      stage.scrollTop = 0
      renderToc(); renderStage(true); renderDp(true)
    },
    toggle: (gid) => { S.open.has(gid) ? S.open.delete(gid) : S.open.add(gid); renderToc() },
    toc: () => { S.tocOpen = !S.tocOpen; renderToc() },
    off: () => toast('Only Climate targets is written in this demo', 'info-square'),
    close: () => { finishEdit(); S.sel = undefined; S.menu = false; applySel(); renderDp() },
    step: (n) => { const list = order(S.report); const next = list[list.indexOf(S.sel) + Number(n)]; if (next) { pick(next); reveal(next) } },
    tab: (k) => { if (!S.sel) return; S.tab = k; S.menu = false; applySel(); renderDp(); dpEl.scrollTop = Math.min(dpEl.scrollTop, $('.tabs', dpEl).offsetTop - 44) },
    edit: () => { if (!S.sel || DPS[S.sel].block) return; const pid = PARA_OF[S.sel]; S.editing === pid ? finishEdit() : startEdit(pid) },
    'close-layer': () => {
      if (S.layer === 'guide') return ACTIONS['guide-hide']()
      S.layer = undefined; renderLayer()
    },
    more: (key) => { S.more.has(key) ? S.more.delete(key) : S.more.add(key); renderDp() },
    menu: () => { S.menu = !S.menu; renderDp() },
    owner: (pid) => { S.dp[S.sel].owner = pid; S.menu = false; renderDp(); toast(`${PEOPLE[pid].name} owns this data point now`) },
    file: () => { const st = S.dp[S.sel]; const f = FILE_POOL.find((x) => !st.files.includes(x)) ?? 'Document.pdf'; st.files.push(f); st.justAdded = st.files.length - 1; renderDp() },
    unfile: (i) => { S.dp[S.sel].files.splice(Number(i), 1); renderDp() },
    send: () => {
      const box = $('[data-compose]', dpEl)
      const text = box?.value.trim()
      if (!text) return box?.focus()
      S.dp[S.sel].comments.push({ by: ME, when: 'Just now', text, isNew: true })
      renderDp(); updateCounts()
      $('[data-compose]', dpEl)?.focus()
    },
    write: () => write(S.sel),
    'use-sum': () => {
      const id = S.sel, sum = S.sums[id]
      S.html[id] = esc(sum.text); sum.used = true
      Object.assign(S.dp[id], { edited: 'Today', owner: ME, source: 'Written from your companies' })
      renderStage(); renderDp(); reveal(id)
      toast('The answer is in the report')
    },
    toast: (text) => toast(text, 'info-square'),
  }

  Object.assign(ACTIONS, PAGE_ACTIONS)

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]')
    if (S.menu && !e.target.closest('.menu, .who')) { S.menu = false; renderDp() }
    if (S.tocOpen && !e.target.closest('.toc')) { S.tocOpen = false; renderToc() }
    if (e.target === layer) return ACTIONS['close-layer']()
    if (!el) {
      // A click on the report's background lets go of the data point
      if (e.target.closest('[data-stage]') && !e.target.closest('.para, .bar')) { finishEdit(); if (S.sel) ACTIONS.close() }
      return
    }
    if (el.closest('.is-editing') && !el.closest('.bar')) return
    ACTIONS[el.dataset.act]?.(el.dataset.arg, e)
  })
  // The toolbar keeps the text's focus, so its pencil can end an edit
  stage.addEventListener('mousedown', (e) => { if (e.target.closest('.bar')) e.preventDefault() })
  stage.addEventListener('focusout', (e) => { if (S.editing && e.target.matches?.('.para__text') && !stage.contains(e.relatedTarget)) finishEdit() })
  stage.addEventListener('input', (e) => {
    if (!e.target.matches('.para__text')) return
    const el = S.sel === S.editing && $('[data-answer]', dpEl)
    if (el) el.textContent = e.target.textContent.trim()
  })
  dpEl.addEventListener('input', (e) => { if (e.target.matches('[data-note]')) S.dp[S.sel].note = e.target.value })
  // On the document: after a redraw the focus can be on the body
  document.addEventListener('keydown', (e) => {
    const t = e.target
    if (t.matches('[data-compose]') && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); return ACTIONS.send() }
    if ((t.matches('.v') || t.matches('.para')) && !t.closest('.is-editing') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return pick(t.dataset.arg) }
    if (e.key === 'Escape') {
      if (S.layer) return ACTIONS['close-layer']()
      if (S.page !== 'report') return
      if (S.tocOpen) { S.tocOpen = false; renderToc(); return $('.toc__btn', toc)?.focus() }
      if (S.menu) { S.menu = false; return renderDp() }
      if (S.editing) { finishEdit(); return }
      if (S.sel) ACTIONS.close()
    }
  })

  /* ── the walkthrough: Anastasia's cursor starts at Home, takes the product tour into the report and its guide, then
     goes through the report, Insights and a target, and does on each what a visitor would (../walkthrough.js runs it,
     and gives way to the visitor). Each step finds what it presses when it gets there, and skips what's done: a second
     time round, the answer is written ── */
  const railItem = (p) => () => $(`.rail__item[data-arg="${p}"]`, rail)
  if (!new URLSearchParams(location.search).has('nowalk')) window.Walkthrough?.({
    name: 'Anastasia',
    color: '#496aff',
    // Each page's place in the tour; the Help center sits after the page it's nearest
    where: () => ({ home: 0, help: 0.5, report: 1, metric: 2, target: 3 })[S.page],
    // Before it carries on: what the visitor left open closed
    tidy: async () => {
      if (S.editing) finishEdit()
      if (S.menu) { S.menu = false; renderDp() }
      if (S.tocOpen) { S.tocOpen = false; renderToc() }
    },
    scenes: [
      // Home: a to-do ticked off, then the product tour
      { enter: (w) => w.click(railItem('home')), steps: [
        async (w) => {
          const todo = () => $('[data-act="todo"][aria-checked="false"]:not([data-arg="tour"])', pageEl)
          if (todo()) { await w.click(todo); await w.pause(1000) }
          await w.hover(() => $('[data-act="tour"]', pageEl))
          await w.pause(600)
        },
      ] },
      // The report, from Home's product tour: its guide, a step on, then hidden; a target in the text; down through the
      // section's table and charts and back; then a paragraph whose answer is written from the companies' answers, and
      // put in the report
      { enter: async (w) => {
        if (S.page !== 'home') { await w.click(railItem('home')); await w.pause(700) }
        await w.click(() => $('[data-act="tour"]', pageEl))
      }, steps: [
        async (w) => {
          if (S.layer !== 'guide') return
          await w.pause(1600)
          await w.click(() => $('[data-act="guide-step"][data-arg="1"]', layer))
          await w.pause(1600)
          await w.click(() => $('[data-act="guide-hide"]', layer))
          await w.pause(800)
        },
        async (w) => {
          if (S.report !== 'e1-4') {
            if (!S.tocOpen) { await w.click(() => $('.toc__btn', toc)); await w.pause(600) }
            await w.click(() => $('[data-act="report"][data-arg="e1-4"]', toc)); await w.pause(900)
          }
          await w.click(() => $('.v[data-v="t-s1"]', stage))
          await w.pause(2200)
        },
        // Down through the section, as a reader would: the table, the chart of the path to 2030, the steps; then back up
        async (w) => {
          const to = (pid) => { const el = $(`[data-para="${pid}"]`, stage); return el ? el.getBoundingClientRect().top - stage.getBoundingClientRect().top - 72 : 0 }
          await w.hover(() => $('[data-para="e14-table"]', stage), { x: 300, y: 60 })
          await w.pause(500)
          for (const [pid, at] of [['e14-table', { x: 330, y: 90 }], ['e14-path', { x: 440, y: 150 }], ['e14-steps', { x: 300, y: 190 }]]) {
            await w.scroll(stage, to(pid))
            await w.pause(500)
            await w.hover(() => $(`[data-para="${pid}"]`, stage), at)
            await w.pause(1500)
          }
          await w.scroll(stage, -stage.scrollTop)
          await w.pause(900)
        },
        async (w) => {
          if (S.report !== 'e1-4' || S.sums['e14-how']) return
          await w.click(() => $('[data-para="e14-how"]', stage), { x: 60, y: 30 })
          await w.pause(900)
          const write = () => $('[data-write]', dpEl)
          if (!(await w.show(write))) return
          await w.pause(300)
          if (!(await w.click(write))) return
          // Out of the sidebar, so its name doesn't sit over the answer being written
          await w.aside(-250, 10)
          await w.until(() => S.sums['e14-how'] && !S.sums['e14-how'].busy, 20000)
          await w.pause(1400)
          const use = () => $('[data-act="use-sum"]', dpEl)
          await w.show(use)
          if (await w.click(use)) await w.pause(2200)
        },
      ] },
      // Insights: years instead of quarters, then a country off and on again
      { enter: (w) => w.click(railItem('metric')), steps: [
        async (w) => {
          const range = S.met.range === '5y' ? '1q' : '5y'
          await w.click(() => $(`[data-act="met-range"][data-arg="${range}"]`, pageEl))
          await w.pause(1600)
          const dk = () => $('[data-act="met-c"][data-arg="dk"]', pageEl)
          await w.show(dk)
          await w.click(dk)
          await w.pause(1300)
          await w.click(dk)
          await w.pause(900)
        },
      ] },
      // A target: an action picked, then up to the chart, where its effect moves
      { enter: (w) => w.click(railItem('target')), steps: [
        async (w) => {
          const act = () => $('.act-row[aria-checked="false"]', pageEl)
          if (!act()) return
          await w.show(act)
          await w.click(act)
          await w.pause(1600)
          await w.scroll(pageEl, -pageEl.scrollTop)
          await w.hover(() => $('.tg-chart', pageEl), { x: 360, y: 90 })
          await w.pause(1600)
        },
      ] },
    ],
  })

  renderAll()
})()
