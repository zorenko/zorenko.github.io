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

  /* The progress bars' pixel grid (styles.css .progress__bar), drawn in whole device pixels at the size the page is
     really shown: the site scales the demo down to fit a card, and a 4px grid at 0.68× lands cells and gaps on
     fractions of a pixel, so some gaps vanish and the rows look uneven. Here every cell and gap is the same whole number
     of device pixels. Checked again now and then, since the card's size changes with the window. */
  const DITHER = [[0, 0], [2, 0], [3, 0], [6, 0], [1, 1], [2, 1], [4, 1], [8, 1], [0, 2], [1, 2], [3, 2], [5, 2]] // [column, row]: the scatter after a bar's fill, thinning out
  let gridK = 0
  function sizeGrid() {
    let scale = 1
    try { const f = window.frameElement; if (f) scale = f.getBoundingClientRect().width / innerWidth || 1 } catch {}
    const k = scale * devicePixelRatio
    if (Math.abs(k - gridK) < 0.01) return
    gridK = k
    const pitch = Math.max(3, Math.round(4 * k)), gap = Math.max(1, Math.round(k)), cell = pitch - gap
    const svg = (w, h, rects) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${rects}</svg>`)}")`
    const rect = ([c, r]) => `<rect x='${c * pitch}' y='${r * pitch}' width='${cell}' height='${cell}'/>`
    const st = document.documentElement.style
    st.setProperty('--grid', svg(pitch, pitch, rect([0, 0])))
    st.setProperty('--dither', svg(10 * pitch, 3 * pitch, DITHER.map(rect).join('')))
    st.setProperty('--pitch', `${pitch / k}px`)
    st.setProperty('--bar-h', `${(3 * pitch - gap) / k}px`)
  }
  sizeGrid()
  addEventListener('resize', sizeGrid)
  setInterval(sizeGrid, 1000)

  /* ── content ──
     In plain words, for someone new to sustainability reporting: no standard's codes or paragraph numbers, and none
     of the production app's specialist set-up (its disclosure checklists, table blocks and reporting rules). */
  const PEOPLE = {
    hh: { name: 'Hans Hansen', ini: 'HH', c: '' },
    ib: { name: 'Ingrid Berg', ini: 'IB', c: 'b' },
    lm: { name: 'Lars Moe', ini: 'LM', c: 'c' },
    sd: { name: 'Sofie Dahl', ini: 'SD', c: 'd' },
  }
  const ME = 'hh'
  const SUBS = [
    { name: 'Fjordal Norge', by: 'lm' },
    { name: 'Fjordal Sverige', by: 'ib' },
    { name: 'Fjordal Danmark', by: 'sd' },
    { name: 'Fjordal Suomi', by: 'hh' },
  ]
  const SHARES = [0.41, 0.27, 0.19] // numbers: each company's share; the last one gets the rest
  const AI_NOTE = 'Written by AI from the attached document.'
  const FILE_POOL = ['Energy_invoices_2023.pdf', 'Board_minutes_Q3_2023.pdf', 'Supplier_survey_2023.pdf', 'Fleet_fuel_log_2023.pdf']

  // Every data point: a paragraph (text) or a value in its text (a target or a number). Fields left out take defaults.
  const DPS = {
    // Our climate plan
    'e11-plan': { name: 'Our plan to reach net zero', ask: 'Explain how the company will cut its emissions to reach net zero, and by when.', edited: '14.08.2023' },
    't-nz': { kind: 'target', name: 'Net zero across our value chain by 2045', unit: 't CO₂e', actual: [[2020, 128000], [2021, 123200], [2022, 118480], [2023, 114000]], goal: [2045, 12800], source: 'From a target', owner: 'ib', files: ['Climate_plan_2023.pdf'], ask: 'Give the target the plan is built around: how much, and by when.', note: 'The last 10% is removed from the air for good.' },
    'e11-gov': { name: 'Who approved the plan', ask: 'Say who approved the plan, and how often its progress is checked.' },
    // Climate targets
    'e14-how': { name: 'How we set our targets', source: 'Written by AI', note: AI_NOTE, files: ['Climate_strategy_2023.pdf'], ask: 'Explain how the company decided on its climate targets.',
      comments: [{ by: 'ib', when: '2 days ago', text: 'Can we say which parts of the business we looked at? The auditors asked last year.' }],
      subs: [
        'We set our targets together with the group in 2021, using science-based guidance and our 2020 emissions.',
        'We followed the group. The Gothenburg plant added its own target for process heat after its 2022 energy check.',
        null,
        'The group set the targets. Our site helped through the workshop on what matters most, and by collecting supplier data.',
      ],
      summary: 'Fjordal set its climate targets as a group in 2021, using science-based guidance and our 2020 emissions as the starting point. Each company helped through a workshop on what matters most and by collecting data from suppliers, and the Gothenburg plant added its own target for process heat after its 2022 energy check.' },
    'e14-targets': { name: 'Our emission targets', ask: 'Give your emission targets: how much, by when, and from which starting year.' },
    't-s1': { kind: 'target', name: 'Cut direct emissions per product by 35% by 2025', unit: 't CO₂e per unit', actual: [[2020, 0.84], [2021, 0.8], [2022, 0.74], [2023, 0.69]], goal: [2025, 0.546], dec: 2, source: 'From a target', owner: 'lm', files: ['Direct_emissions_2023.pdf'], edited: '2.10.2023',
      note: 'The Gothenburg plant we bought changes 2020 by less than 5%, so the starting point stays.',
      ask: 'Give the target as a number, the year it should be reached, and the year it is measured from.',
      comments: [
        { by: 'ib', when: 'Yesterday', text: 'Does buying the Gothenburg plant change our 2020 starting point?' },
        { by: 'lm', when: 'Yesterday', text: 'Barely, by less than 5%. I added a note.' },
      ] },
    't-s23': { kind: 'target', name: 'Cut indirect emissions per product by 25% by 2030', unit: 't CO₂e per unit', actual: [[2020, 6.2], [2021, 6.1], [2022, 5.8], [2023, 5.6]], goal: [2030, 4.65], dec: 2, source: 'From a target', owner: 'sd', ask: 'Give the target as a number, the year it should be reached, and the year it is measured from.' },
    'e14-material': { name: 'Where our biggest impacts are', ask: 'Explain how the targets match the areas where the company affects the climate most.',
      subs: [
        'Our largest impacts are electricity at the Bergen plant and trucking in raw materials.',
        'Gas-fired process heat and the aluminium we buy matter most for us.',
        'Delivering to customers in Germany and the Netherlands is our largest source of emissions.',
        null,
      ],
      summary: 'Our 2023 review found the biggest climate impacts in electricity and gas-fired heat at our plants, the aluminium we buy, and trucking materials and products. Our targets focus on these areas.' },
    'e14-risks': { name: 'How climate risks shape our targets', ask: 'Explain how the ways climate change could affect the business were used when setting the targets.', edited: '21.09.2023', owner: 'ib' },
    'e14-levers': { name: 'What we are doing to get there', ask: 'List the main things the company is doing to reach its targets.',
      comments: [{ by: 'sd', when: '3 days ago', text: 'Add the heat pumps in Gothenburg here?' }],
      subs: [
        'Department heads have a bonus tied to saving energy. We are putting solar panels on the roof in 2024.',
        'We are replacing the gas boilers in Gothenburg with heat pumps by 2027.',
        null,
        'All our electricity has been renewable since 2022.',
      ],
      summary: 'Teams are rewarded for saving energy, and we invest in research to cut emissions further. Our main steps are replacing the gas-fired heat in Gothenburg with heat pumps by 2027, solar panels on the roof in Bergen in 2024, and renewable electricity, which already powers our Finnish site.' },
    'e14-achievable': { name: 'Why the targets are realistic', ask: 'Say whether the targets are based on science, and why they can be reached.' },
    // Energy use
    'e15-total': { name: 'Total energy use', ask: 'Give how much energy the company used, and how much of it was renewable.' },
    'e-total': { kind: 'metric', name: 'Total energy use', unit: 'MWh', years: [[2021, 51300], [2022, 49950], [2023, 48210]], sum: true, source: 'From a number', files: ['Energy_report_2023.pdf'], ask: 'Give the energy used by the company’s own sites and vehicles, in MWh.' },
    'e-ren': { kind: 'metric', name: 'Share of renewable energy', unit: '%', years: [[2021, 48], [2022, 55], [2023, 61]], better: 'up', source: 'Added up', ask: 'Give the share of energy that came from renewable sources.' },
    'e15-fossil': { name: 'Energy from fossil fuels', ask: 'Give how much energy came from fossil fuels, and what it was used for.' },
    'e-fossil': { kind: 'metric', name: 'Energy from fossil fuels', unit: 'MWh', years: [[2021, 26700], [2022, 22480], [2023, 18800]], sum: true, source: 'From a number', owner: 'lm', ask: 'Give the energy that came from fossil fuels, in MWh.' },
    'e15-int': { name: 'Energy for each euro earned', ask: 'Give the energy used for each thousand euros of revenue.' },
    'e-int': { kind: 'metric', name: 'Energy per thousand euros of revenue', unit: 'MWh per €1,000', years: [[2021, 0.27], [2022, 0.24], [2023, 0.21]], dec: 2, source: 'Added up', ask: 'Divide the energy used by the revenue, in thousands of euros.' },
    // Emissions
    'e16-s1': { name: 'Direct emissions', ask: 'Give the emissions from sources the company owns, such as its boilers and vehicles.' },
    'g-s1': { kind: 'metric', name: 'Direct emissions (Scope 1)', unit: 't CO₂e', years: [[2021, 14100], [2022, 13280], [2023, 12480]], sum: true, source: 'From a number', owner: 'lm', files: ['Direct_emissions_2023.pdf'], ask: 'Give the emissions from sources the company owns, in tonnes of CO₂.' },
    'e16-s2': { name: 'Emissions from energy we buy', ask: 'Give the emissions from producing the electricity and heat the company buys.' },
    'g-s2': { kind: 'metric', name: 'Emissions from energy we buy (Scope 2)', unit: 't CO₂e', years: [[2021, 7900], [2022, 6300], [2023, 5120]], sum: true, source: 'From a number', ask: 'Give the emissions from the electricity and heat the company buys, in tonnes of CO₂.' },
    'e16-s3': { name: 'Emissions in our value chain', ask: 'Give the emissions from suppliers, transport and the use of your products.' },
    'g-s3': { kind: 'metric', name: 'Value chain emissions (Scope 3)', unit: 't CO₂e', years: [[2021, 101200], [2022, 98900], [2023, 96400]], sum: true, source: 'From a number', owner: 'sd', files: ['Supplier_survey_2023.pdf'], ask: 'Give the emissions from suppliers, transport and the use of your products, in tonnes of CO₂.',
      comments: [{ by: 'sd', when: 'Last week', text: 'Suppliers gave us real numbers for 64% of what we buy. The rest is estimated from spend.' }] },
    'e16-tot': { name: 'Total emissions', ask: 'Add up all three kinds of emissions.' },
    'g-tot': { kind: 'metric', name: 'Total emissions', unit: 't CO₂e', years: [[2021, 123200], [2022, 118480], [2023, 114000]], sum: true, source: 'Added up', ask: 'Add up direct, energy and value chain emissions.' },
  }

  // The report's sections. A value in a paragraph is [[data point|its words]].
  const REPORTS = [
    { id: 'e1-1', title: 'Our climate plan', paras: {
      'e11-plan': 'We adopted our climate plan in March 2023. It sets out how Fjordal will reach [[t-nz|net zero emissions across our value chain by 2045]], in line with keeping global warming to 1.5°C: by using less energy, heating with electricity instead of gas, buying renewable power and working with our largest suppliers.',
      'e11-gov': 'The Board approved the plan, and the management team checks its progress every quarter. Most of the emissions we can’t easily avoid come from the gas-fired heat at our Bergen and Gothenburg plants, which we plan to switch to electricity by 2027.',
    } },
    { id: 'e1-4', title: 'Climate targets', paras: {
      'e14-how': 'At Fjordal, we take our impact on the climate seriously. We set our emission targets through a careful process, using scientific guidance and looking closely at how our own business works.',
      'e14-targets': 'Following the Science Based Targets initiative, we aim to [[t-s1|cut our direct emissions per product by 35% by 2025, compared with 2020]]. We also aim to [[t-s23|cut the emissions from the energy we buy and from our suppliers by 25% per product by 2030]].',
      'e14-material': 'We chose these targets after a careful review of where our business affects the climate most. It looked at our whole value chain and found the biggest impacts in electricity use, transport and the materials we buy.',
      'e14-risks': 'Every year we also look at how climate change could affect our business. This shows us where we can cut the most emissions, and where we are most at risk.',
      'e14-levers': 'We reward teams for meeting these targets and invest in research to find new ways of cutting emissions. We are also moving to renewable energy, which will cut the emissions from the energy we buy.',
      'e14-achievable': 'We believe these targets can be reached, based on our past emissions and how much we expect to grow. We take our aim of becoming carbon neutral seriously and will adjust our plans as needed.',
    } },
    { id: 'e1-5', title: 'Energy use', paras: {
      'e15-total': 'In 2023, our sites and vehicles used [[e-total|48,210 MWh]] of energy, and [[e-ren|61%]] of it came from renewable sources, mostly hydropower.',
      'e15-fossil': 'We used [[e-fossil|18,800 MWh]] of energy from fossil fuels, mainly natural gas for heat at the Bergen and Gothenburg plants. We plan to switch both to electricity by 2027.',
      'e15-int': 'We used [[e-int|0.21 MWh for every thousand euros]] we earned, down from 0.24 in 2022, as sales grew faster than our energy use.',
    } },
    { id: 'e1-6', title: 'Emissions', paras: {
      'e16-s1': 'Our direct emissions in 2023 were [[g-s1|12,480 t CO₂e]], 6% lower than in 2022. Most of them come from gas for heat and from our vehicles.',
      'e16-s2': 'The electricity and heat we buy caused [[g-s2|5,120 t CO₂e]], down as more of our sites switch to renewable power.',
      'e16-s3': 'Emissions in our value chain were [[g-s3|96,400 t CO₂e]]. The goods and services we buy make up 71% of them, and transport 12%.',
      'e16-tot': 'In total, we emitted [[g-tot|114,000 t CO₂e]], or 0.62 tonnes for every thousand euros we earned.',
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
    { id: 'climate', name: 'Climate', kids: REPORTS.map((r) => ({ report: r.id, name: r.title })) },
    { id: 'pollution', name: 'Pollution', kids: [{ name: 'Overview', page: 'topic' }, { name: 'Air, water and soil', off: true }] },
    { id: 'water', name: 'Water', kids: [{ name: 'Water use', off: true }] },
    { id: 'people', name: 'People', kids: [{ name: 'Our employees', off: true }] },
    { id: 'conduct', name: 'Business conduct', kids: [{ name: 'Anti-corruption', off: true }] },
  ]

  /* ── state ── */
  const S = {
    report: 'e1-4',
    open: new Set(['climate']), // the table of contents' open groups
    sel: undefined, // the open data point
    tab: 'details',
    editing: undefined, // a paragraph being edited
    html: {}, // paragraphs edited in the report
    more: new Set(), // texts shown in full: `${dp}:answer`, `${dp}:sub0`
    menu: false, // the owner menu
    layer: undefined, // 'guide'
    sums: {}, // a text's answer written from its companies' answers: { text, busy, used }
    seen: false, // a value in the text has been opened: the coach ring stops pointing at one
    downloading: false,
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
  const kindLabel = (d) => ({ narrative: 'Text', target: 'Target', metric: 'Number' })[d.kind]
  const kindIcon = (d) => ({ narrative: 'align-justified', target: 'target-arrow', metric: 'chart-histogram' })[d.kind]
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
        out += `<rect class="ch-bar ${now ? 'ch-bar--now' : ''}" x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${T + ph - y(v)}" rx="3"/>`
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
      ${RAIL_END.map(item).join('')}
      <span class="rail__avatar">${avatar(ME, true)}</span>`
  }

  /* ── the table of contents ── */
  function renderToc() {
    const node = (n) => {
      if (n.kids) {
        const open = S.open.has(n.id)
        return `<button type="button" class="toc__row toc__row--group" data-act="toggle" data-arg="${n.id}" aria-expanded="${open}"><span class="toc__name">${esc(n.name)}</span>${icon('chevron-down')}</button>
          ${open ? `<div class="toc__kids">${n.kids.map(node).join('')}</div>` : ''}`
      }
      if (n.page) return `<button type="button" class="toc__row" data-act="go" data-arg="${n.page}"><span class="toc__name">${esc(n.name)}</span>${icon('arrow-up-right')}</button>`
      if (n.off) return `<button type="button" class="toc__row is-off" data-act="off" title="Not in this demo"><span class="toc__name">${esc(n.name)}</span></button>`
      return `<button type="button" class="toc__row" data-act="report" data-arg="${n.report}" ${S.report === n.report ? 'aria-current="page"' : ''}><span class="toc__name">${esc(n.name)}</span></button>`
    }
    // The report's name, with its download, heads the table of contents
    toc.innerHTML = `<div class="toc__head"><b>Report 2023</b><button type="button" class="iconbtn" data-act="download" aria-label="${S.downloading ? 'Preparing the PDF' : 'Download the report as a PDF'}" title="${S.downloading ? 'Preparing PDF…' : 'Download PDF'}" ${S.downloading ? 'disabled' : ''}>${S.downloading ? spinner() : icon('download')}</button></div>` + TOC.map(node).join('')
  }

  /* ── the report ── */
  const paraHTML = (html) => html.replace(/\[\[([^|]+)\|([^\]]+)\]\]/g, (_, id, words) =>
    `<span class="v" data-act="pick" data-arg="${id}" data-v="${id}" role="button" tabindex="0" aria-label="${esc(kindLabel(DPS[id]))}: ${esc(DPS[id].name)}">${words}</span>`)
  const commentsIn = (pid) => order(REPORT_OF[pid]).filter((id) => PARA_OF[id] === pid).reduce((n, id) => n + S.dp[id].comments.length, 0)
  function renderStage(enter) {
    const r = reportById(S.report)
    const i = REPORTS.indexOf(r)
    const prev = REPORTS[i - 1], next = REPORTS[i + 1]
    const link = (rep, dir) => rep ? `<button type="button" class="dr-link dr-link--${dir}" data-act="report" data-arg="${rep.id}">${dir === 'prev' ? icon('arrow-narrow-left') : ''}<div><small>${dir === 'prev' ? 'Previous' : 'Next'}</small><span>${esc(rep.title)}</span></div>${dir === 'next' ? icon('arrow-narrow-right') : ''}</button>` : '<span></span>'
    stage.innerHTML = `
      <article class="paper ${enter ? 'is-in' : ''}" data-paper>
        <p class="paper__kicker">Climate</p>
        <h1 class="paper__title">${esc(r.title)}</h1>
        <div class="parent">
          ${Object.keys(r.paras).map((pid) => `
            <div class="para" data-act="pick" data-arg="${pid}" data-para="${pid}" tabindex="0" aria-label="${esc(DPS[pid].name)}">
              <p class="para__text">${S.html[pid] ?? paraHTML(r.paras[pid])}</p>
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
    if (!S.sel || REPORT_OF[S.sel] !== S.report) return renderCoach()
    const para = stage.querySelector(`[data-para="${PARA_OF[S.sel]}"]`)
    para?.classList.add('is-sel')
    stage.querySelector(`[data-v="${S.sel}"]`)?.classList.add('is-sel')
    const d = DPS[S.sel]
    para?.insertAdjacentHTML('afterbegin', `
      <div class="bar" role="toolbar" aria-label="${esc(kindLabel(d))}">
        <span class="bar__label">${icon(kindIcon(d))}${kindLabel(d)}</span>
        <button type="button" class="iconbtn" data-act="tab" data-arg="comments" aria-label="Comments" title="Comments" aria-pressed="${S.tab === 'comments'}">${icon('message')}</button>
        <button type="button" class="iconbtn" data-act="edit" aria-label="Edit the text" title="Edit the text" aria-pressed="${S.editing === PARA_OF[S.sel]}">${icon('pencil')}</button>
      </div>`)
    renderCoach()
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
        ${d.kind === 'narrative' ? '' : `<div class="cover">${chart(d, 300, 124)}</div>`}
        <h2 class="dp__title">${esc(d.name)}</h2>
        <div class="tabs"><div class="tabs__list" role="tablist">${tabs.map(([k, label]) => `<button type="button" class="tab" role="tab" data-act="tab" data-arg="${k}" aria-selected="${S.tab === k}" data-tab="${k}">${label}${k === 'comments' && st.comments.length ? `<span class="count">${st.comments.length}</span>` : ''}</button>`).join('')}</div></div>
        ${TABS[S.tab](id, d, st)}
      </div>`
    dpEl.scrollTop = keep
    if (enter && wasHidden) { dpEl.classList.remove('is-in'); void dpEl.offsetWidth; dpEl.classList.add('is-in') }
    onDpScroll()
    renderCoach()
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
          <div class="progress progress--big"><span class="progress__bar" style="--p:${done}%"><i></i>${done > 0 ? '<b></b>' : ''}</span><span>${num(done)}%</span></div>
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

  /* ── a dialog: the data input guide ── */
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

  // The coach ring: the first value in the text until one is opened, then a narrative's Write button.
  function renderCoach() {
    app.querySelectorAll('.is-coach').forEach((el) => el.classList.remove('is-coach'))
    if (!S.seen) return stage.querySelector('.v:not(.is-sel)')?.classList.add('is-coach')
    if (S.sel && S.tab === 'source' && !Object.keys(S.sums).length) $('[data-write]', dpEl)?.classList.add('is-coach')
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
    if (DPS[id].kind !== 'narrative') S.seen = true
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

  /* ════════ the other pages: Home, Help center, Data input, Insights, Pollution, a target ════════
     Each page is a function in PAGES that returns its HTML from S; renderPage() draws the one open. */
  const pageEl = $('[data-page]')
  const reportEl = $('[data-report]')
  const SECTION = { home: 'home', help: 'help', report: 'report', input: 'report', topic: 'report', target: 'target', metric: 'metric' }
  // [page, skeuomorphic icon, name]
  const RAIL = [
    ['home', 'home', 'Home'],
    ['target', 'target', 'Targets'],
    ['metric', 'insights', 'Insights'],
    ['report', 'report', 'Report'],
  ]
  const RAIL_END = [['help', 'help', 'Help center']] // above the avatar
  const spinner = () => '<svg class="ico spin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
  const plural = (n, w) => `${n} ${n === 1 ? w : `${w}s`}`
  const pill = (status) => `<span class="pill pill--${status.toLowerCase().replace(/ /g, '-')}">${esc(status)}</span>`
  // A dropdown on a page: one open at a time (S.pmenu); picking runs MENU[key](value)
  const dropdown = (key, label, items, cur, cls = '') => `<div class="dd ${cls}"><button type="button" class="dd__btn" data-act="pmenu" data-arg="${key}" aria-haspopup="menu" aria-expanded="${S.pmenu === key}">${label}${icon('chevron-down')}</button>${S.pmenu === key ? `<div class="menu" role="menu">${items.map(([v, t]) => `<button type="button" class="menu__item" role="menuitemradio" aria-checked="${v === cur}" data-act="choose" data-arg="${key}:${esc(v)}">${t}${v === cur ? icon('check') : ''}</button>`).join('')}</div>` : ''}</div>`
  const COUNTRY = { no: 'Norway', se: 'Sweden', dk: 'Denmark' }

  Object.assign(S, {
    page: 'home', // the demo starts at Home
    pmenu: undefined, // a page's open dropdown
    todo: new Set(),
    help: { q: '', all: new Set() },
    guide: { step: 0, read: new Set([0]), seen: false, min: false },
    inp: { open: new Set(['g-s1', 'g-s3']), more: false, edit: undefined, vals: {} },
    metric: 'g-s1',
    met: { range: '1q', on: new Set(['no', 'dk', 'se']), forecast: true, target: true, targets: {}, editTarget: false },
    topic: { tab: 'people', q: '', role: 'all', open: new Set(['parent', 'p-hh']), reviewer: undefined, added: false, flash: undefined },
    tgt: { show: { mile: true, interp: true, impact: true }, base: 200, miles: [[2025, 170], [2030, 140], [2040, 90], [2050, 40]], edit: undefined, actions: [true, true, false, false] },
  })
  PEOPLE.ll = { name: 'Lara Larsen', ini: 'LL', c: 'e' }

  /* ── navigation ── */
  function go(p, set) {
    finishEdit()
    S.menu = false; S.pmenu = undefined
    S.page = p
    S.layer = undefined
    // Data input's guide opens by itself the first time
    if (p === 'input' && !S.guide.seen) { S.guide.seen = true; S.layer = 'guide' }
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
  const TODO = [['tour', 'Take the product tour', 'Onboarding · 3 min'], ['invite', 'Invite your team', 'Ingrid and Lars are waiting'], ['file', 'Upload last year’s report', 'So Celsia can fill in what it already knows'], ['target', 'Review the climate targets', 'Due Friday']]
  // The report's topics and how far each has come: Climate and Pollution open, the rest are only on Home
  const TOPICS = [['Climate', 82, 'report'], ['Pollution', 60, 'topic'], ['Water', 35], ['People', 48], ['Business conduct', 15]]
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
      <h1 class="h1 h1--hello">Welcome back, Hans</h1>
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
      <div class="topics">${TOPICS.map(([n, p, to]) => `<button type="button" class="topic ${to ? '' : 'is-off'}" data-act="${to ? 'go' : 'toast'}" data-arg="${to ?? `${n} isn’t written in this demo`}"><span class="topic__name">${n}</span><span class="topic__bar" style="--p:${p}%"><i></i>${p > 0 ? '<b></b>' : ''}</span><span class="topic__pct">${p}%</span>${icon('arrow-narrow-right')}</button>`).join('')}</div>
      <h2 class="h2 h2--sect">Quick links</h2>
      <div class="cards3">${[['input', 'table', 'Data input', 'Collect the numbers for your report'], ['report', 'report', 'Report', 'Write and review it with your team'], ['metric', 'insights', 'Insights', 'Follow your numbers against targets']]
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
  const helpCard = (id, ico, name, items) => {
    const all = S.help.all.has(id)
    return `<section class="hcard"><h3 class="hcard__head"><span class="hcard__ico">${icon(ico)}</span>${esc(name)}</h3><ul class="arts">${(all ? items : items.slice(0, 3)).map(article).join('')}</ul>
      ${items.length > 3 ? `<button type="button" class="btn btn--sm hcard__more" data-act="help-all" data-arg="${id}">${all ? 'Show fewer' : `All ${items.length} articles`}${icon(all ? 'chevron-up' : 'arrow-narrow-right')}</button>` : ''}</section>`
  }
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

  /* ════ Data input: the year's emissions, by company and by kind ════ */
  // A value's source: calc (added up from the rows under it), sub (from one of the group's companies), link (from a
  // document), manual (typed in here: click it to edit)
  const SRC = { manual: ['pencil', 'Typed in'], calc: ['sum', 'Added up'], sub: ['building', 'From a company'], link: ['link', 'From a document'] }
  const splitSubs = (id) => { const total = DPS[id].years.at(-1)[1]; let left = total; return SUBS.map((s, i) => { const v = i === SUBS.length - 1 ? left : Math.round(total * SHARES[i]); left -= v; return { key: `${id}:${i}`, name: s.name, src: 'sub', v } }) }
  const INPUT = [
    { id: 'g-s1', kids: splitSubs('g-s1') },
    { id: 'g-s2', kids: splitSubs('g-s2') },
    { id: 'g-s3', kids: [
      { key: 'g-s3:goods', name: 'Goods and services we buy', src: 'link', v: 68444, com: 1, note: 'From Supplier survey 2023' },
      { key: 'g-s3:transport', name: 'Transport', src: 'link', v: 11568, note: 'From the logistics company’s report' },
      { key: 'g-s3:travel', name: 'Business travel', src: 'manual', v: 2410 },
      { key: 'g-s3:waste', name: 'Waste', src: 'manual', v: 1880 },
      { key: 'g-s3:other', name: 'Everything else', src: 'manual', v: 12098, com: 2 },
    ] },
    { id: 'g-tot', calc: () => sumOf('g-s1') + sumOf('g-s2') + sumOf('g-s3') },
  ]
  const MORE_INPUT = [
    { key: 'x:bio', name: 'CO₂ from burning wood and biofuel', src: 'manual', v: 310 },
    { key: 'x:rem', name: 'CO₂ removed from the air', src: 'manual', v: 0 },
  ]
  for (const r of INPUT) for (const k of r.kids ?? []) S.inp.vals[k.key] = k.v
  for (const k of MORE_INPUT) S.inp.vals[k.key] = k.v
  const sumOf = (id) => { const r = INPUT.find((x) => x.id === id); return r.kids ? r.kids.reduce((n, k) => n + S.inp.vals[k.key], 0) : r.calc() }
  const valCell = (key, src, v, dec = 0) => {
    const [ico, label] = SRC[src]
    if (S.inp.edit === key) return `<span class="val"><span title="${label}">${icon(ico)}</span><input class="val__input" data-inp="${key}" value="${v}" inputmode="decimal" aria-label="Value" data-autofocus /></span>`
    const text = num(v, dec)
    return src === 'manual'
      ? `<button type="button" class="val val--edit" data-act="inp-edit" data-arg="${key}" title="Typed in: click to change">${icon(ico)}<span>${text}</span></button>`
      : `<span class="val val--${src}" title="${label}">${icon(ico)}<span>${text}</span></span>`
  }
  const comCell = (n, act, arg) => n ? `<button type="button" class="com" data-act="${act}" data-arg="${esc(arg)}" aria-label="${plural(n, 'comment')}">${icon('message')}${n}</button>` : '<span></span>'
  function inputRows() {
    const q = S.inp.q?.trim().toLowerCase() ?? ''
    let out = ''
    for (const r of INPUT) {
      const d = DPS[r.id], open = S.inp.open.has(r.id)
      const kids = (r.kids ?? []).filter((k) => !q || k.name.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
      if (q && !d.name.toLowerCase().includes(q) && !kids.length) continue
      out += `<div class="trow trow--parent ${r.kids ? '' : 'trow--total'}" role="row">
        <span class="trow__name">${r.kids ? `<button type="button" class="iconbtn iconbtn--sm exp" data-act="inp-open" data-arg="${r.id}" aria-expanded="${open}" aria-label="${open ? 'Collapse' : 'Expand'}">${icon('chevron-down')}</button>` : '<span class="exp-gap"></span>'}<b>${esc(d.name)}</b></span>
        ${valCell(r.id, 'calc', sumOf(r.id))}
        ${comCell(S.dp[r.id].comments.length, 'inp-com', r.id)}
        <button type="button" class="iconbtn" data-act="metric" data-arg="${r.id}" aria-label="Open ${esc(d.name)} in Insights" title="Open in Insights">${icon('chart-line')}</button>
      </div>`
      if (open || q) for (const k of kids) out += `<div class="trow trow--kid" role="row">
        <span class="trow__name">${esc(k.name)}</span>
        ${valCell(k.key, k.src, S.inp.vals[k.key])}
        ${comCell(k.com ?? 0, 'toast', `Comments on ${k.name} open in its sidebar`)}
        <span></span>
      </div>`
    }
    if (S.inp.more) for (const k of MORE_INPUT.filter((k) => !q || k.name.toLowerCase().includes(q))) out += `<div class="trow trow--parent" role="row">
        <span class="trow__name"><span class="exp-gap"></span><b>${esc(k.name)}</b></span>
        ${valCell(k.key, k.src, S.inp.vals[k.key])}<span></span><span></span></div>`
    return out || `<p class="empty trow-empty">Nothing matches “${esc(q)}”. <button type="button" class="link" data-act="inp-clear">Clear search</button></p>`
  }
  PAGES.input = () => `
    <div class="wrap">
      <p class="kicker">Climate</p>
      <h1 class="h1">Greenhouse gas emissions, 2023</h1>
      <div class="toolbar">
        <label class="search">${icon('search')}<input type="search" data-inp-q value="${esc(S.inp.q ?? '')}" placeholder="Search" aria-label="Search data points" /></label>
        <span class="toolbar__right">
          <button type="button" class="iconbtn" data-act="toast" data-arg="Importing from Excel isn’t in this demo" aria-label="Import" title="Import from Excel">${icon('upload')}</button>
          <button type="button" class="iconbtn" data-act="guide-open" aria-label="Data input guide" title="Guide">${icon('help')}</button>
        </span>
      </div>
      <div class="tcard" role="table" aria-label="Data points">
        <div class="trow trow--head" role="row"><span></span><span>Tonnes CO₂e</span><span></span><span></span></div>
        <div data-inp-rows>${inputRows()}</div>
        ${S.inp.more ? '' : `<button type="button" class="btn btn--sm load-more" data-act="inp-more">Show 2 more</button>`}
      </div>
      <p class="legend">${['manual', 'calc', 'sub', 'link'].map((k) => `<span>${icon(SRC[k][0])}${SRC[k][1]}</span>`).join('')}</p>
    </div>
    ${S.guide.min ? `<button type="button" class="guide-chip" data-act="guide-open">${icon('book')}Guide<span class="muted">${S.guide.read.size} of ${GUIDE.length}</span></button>` : ''}`

  /* the guide over Data input. Its pictures follow the Figma concept's onboarding ("Celsia app – Concepts 24-25",
     2004:30632), redrawn from the demo's own screens: each is a crop of a screen (assets/guide-*.webp, made by taking
     screenshots of the demo) on a coloured panel. */
  const GUIDE = [
    { t: 'Welcome', art: 'report', h: 'This is where your numbers go', p: ['Collect the numbers and texts for your report here. Everything you enter flows straight into it.', 'The guide takes a minute. Hide it any time, and open it again from the question mark.'] },
    { t: 'Your numbers', art: 'table', h: 'Where numbers come from', p: ['The small icon next to each number says where it came from:'],
      items: ['manual', 'calc', 'sub', 'link'].map((k) => [SRC[k][0], SRC[k][1], { manual: 'You typed it in. Click it to change it.', calc: 'Added up from the rows under it.', sub: 'Sent by one of your companies.', link: 'Taken from a document, and kept up to date.' }[k]]) },
    { t: 'Into the report', art: 'both', h: 'From numbers to report', p: ['Each number has its place in the report’s text. Change it here, and the report changes with it.', 'Texts work the same way: your companies write their answers, and Celsia helps you turn them into one.'] },
    { t: 'Details', art: 'details', h: 'Details and comments', p: ['Click any number or text to see who owns it, its files and its comments.', 'Ask a colleague right there, instead of over email.'] },
  ]
  const shot = (name, w, h, cls = '', label = '') => `<span class="gart__shot ${cls}"><img src="assets/guide-${name}.webp" alt="" width="${w}" height="${h}" />${label ? `<span class="chip-label">${label}</span>` : ''}</span>`
  const ARTS = {
    report: () => shot('report', 720, 425),
    table: () => shot('table', 1160, 600),
    both: () => shot('input', 720, 425, 'gart__shot--a', 'Data input') + shot('report', 720, 425, 'gart__shot--b', 'Report'),
    details: () => shot('input', 720, 425, 'gart__shot--a') + shot('dp', 320, 560, 'gart__shot--b'),
  }
  const guideArt = (a) => `<div class="gart gart--${a}">${ARTS[a]()}</div>`
  function guideHTML() {
    const g = S.guide, step = GUIDE[g.step], last = g.step === GUIDE.length - 1
    return `<div class="dialog dialog--guide" role="dialog" aria-modal="true" aria-label="Data input guide">
      <nav class="guide__nav" aria-label="Guide"><p class="guide__label">Guide</p>${GUIDE.map((x, i) => `<button type="button" class="guide__step" data-act="guide-to" data-arg="${i}" ${i === g.step ? 'aria-current="step"' : ''}><span class="guide__tick ${g.read.has(i) ? 'is-read' : ''}">${icon(g.read.has(i) ? 'circle-check' : 'circle-dashed-check')}</span>${x.t}</button>`).join('')}</nav>
      <div class="guide__main">
        <button type="button" class="iconbtn guide__hide" data-act="guide-hide" aria-label="Hide the guide" title="Hide">${icon('x')}</button>
        <div class="guide__body" data-guide-body>
          ${guideArt(step.art)}
          <h3 class="guide__title">${step.h}</h3>
          ${step.p.map((t) => `<p>${t}</p>`).join('')}
          ${step.items ? `<ul class="gitems">${step.items.map(([i, t, d]) => `<li><span class="gitems__ico">${icon(i)}</span><span><b>${t}</b>${d}</span></li>`).join('')}</ul>` : ''}
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
  const MET_C = [['no', 'Norway', 'var(--tone-1)'], ['se', 'Sweden', 'var(--tone-2)'], ['dk', 'Denmark', 'var(--tone-3)']]
  const Q24 = { no: [1450, 1300, 1180, 1420], dk: [620, 560, 520, 610], se: [1180, 1060, 990, 1150] } // 2024, Q4 is the forecast
  const YEARS = [[2020, 13900], [2021, 14100], [2022, 13280], [2023, 12480], [2024, 12040]]
  const YSHARE = { no: 0.45, dk: 0.19, se: 0.36 }
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
    const L = 40, R = 0, T = 12, B = 26, pw = W - L - R, ph = H - T - B
    const y = (v) => T + ph - (v / ymax) * ph
    const slot = pw / bars.length, bw = Math.min(44, slot * 0.42)
    let out = ''
    const fc = bars.findIndex((p) => p.forecast)
    if (fc >= 0) {
      const fx = L + slot * fc
      out += `<rect class="mc-fc" x="${fx}" y="${T}" width="${L + pw - fx}" height="${ph}" rx="8"/><svg class="ico mc-fc__i" x="${fx + 10}" y="${T + 8}" width="12" height="12" viewBox="0 0 24 24">${ICONS.sparkles}</svg><text class="mc-fc__t" x="${fx + 26}" y="${T + 18}">Forecast</text>`
    }
    for (let i = 0; i <= 4; i++) { const v = (ymax / 4) * i; out += `<line class="ch-grid ch-grid--solid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-axis" x="${L - 10}" y="${y(v) + 3}" text-anchor="end">${short(v)}</text>` }
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
        out += `<path class="mc-bar" d="${barPath(x, y(base + v), bw, y(base) - y(base + v), top ? 4 : 0)}" style="fill:${col}" ${p.forecast ? 'opacity=".5"' : ''}><title>${COUNTRY[c]}, ${p.label}: ${num(v)}</title></path>`
        base += v
      })
      if (!p.total) run += sumOn(p)
      out += `<text class="ch-axis ${p.total ? 'is-strong' : ''}" x="${cx}" y="${H - 6}" text-anchor="middle">${p.label}</text>`
    })
    if (S.met.target) {
      const ty = y(target), label = `Target ${short(target)}`, lw = label.length * 6.2 + 18
      out += `<line class="mc-target" x1="${L}" x2="${W - R}" y1="${ty}" y2="${ty}"/><rect class="mc-pill" x="${L + 6}" y="${ty - 11}" width="${lw}" height="22" rx="11"/><text class="mc-pill__t" x="${L + 6 + lw / 2}" y="${ty + 4}" text-anchor="middle">${label}</text>`
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(DPS[S.metric].name)} by ${yearly() ? 'period' : 'year'}, against its target">${out}</svg>`
  }
  // A bar with its top corners rounded by r
  const barPath = (x, y, w, h, r) => { r = Math.min(r, h, w / 2); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z` }
  const forecastTotal = () => metPeriods().reduce((n, p) => n + sumOn(p, new Set(['no', 'dk', 'se'])), 0)
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
        <div><h1 class="h1 h1--tight">${esc(d.name)}</h1><p class="muted">${esc(d.unit)}, ${yearly() ? '2024' : '2020 to 2024'}</p></div>
        <div class="seg" role="group" aria-label="Period">${RANGES.map(([r, t]) => `<button type="button" aria-pressed="${S.met.range === r}" data-act="met-range" data-arg="${r}">${t}</button>`).join('')}</div>
      </div>
      <div class="met__chart">${metChart(576, 260)}</div>
      <div class="met__keys">
        ${MET_C.map(([c, n, col]) => { const on = S.met.on.has(c); return `<button type="button" class="key ${on ? '' : 'is-off'}" style="--c:${col}" role="checkbox" aria-checked="${on}" data-act="met-c" data-arg="${c}"><i></i>${n}<span title="${num(total(c))} t">${Math.round((total(c) / all) * 100)}%</span></button>` }).join('')}
        <span class="met__toggles">${[['forecast', 'Forecast'], ['target', 'Target']].map(([k, t]) => `<button type="button" class="chip" data-act="met-show" data-arg="${k}" aria-pressed="${S.met[k]}">${icon(S.met[k] ? 'eye' : 'eye-off')}${t}</button>`).join('')}</span>
      </div>
      ${metAlert()}
    </div>`
  }

  /* ════ Pollution: the topic's progress, its people, and a to-do list ════ */
  const COMPANIES = [
    { id: 'parent', name: 'Fjordal Group', logo: ['H', 'var(--steel-1)'], people: [
      { id: 'p-hh', who: 'hh', roles: ['Writes', 'Reviews'], tasks: [['Policies', 'Writes'], ['Targets', 'Reviews']] },
      { id: 'p-ll', who: 'll', roles: ['Writes'], tasks: [['Actions', 'Writes'], ['Numbers', 'Writes']] },
      { id: 'p-ib', who: 'ib', roles: ['Helps'], tasks: [['Policies', 'Helps']] },
    ] },
    { id: 'no', name: 'Fjordal Norge', logo: ['N', 'var(--steel-2)'], people: [{ id: 'n-lm', who: 'lm', roles: ['Writes'], tasks: [['Numbers', 'Writes'], ['Actions', 'Writes']] }] },
    { id: 'se', name: 'Fjordal Sverige', logo: ['S', 'var(--steel-3)'], people: [{ id: 's-ib', who: 'ib', roles: ['Writes'], tasks: [['Numbers', 'Writes']] }, { id: 's-sd', who: 'sd', roles: ['Reviews'], tasks: [['Numbers', 'Reviews']] }] },
    { id: 'dk', name: 'Fjordal Danmark', logo: ['D', 'var(--steel-4)'], people: [{ id: 'd-sd', who: 'sd', roles: ['Writes'], tasks: [['Numbers', 'Writes']] }] },
  ]
  const TASK_START = { 'p-hh:0': 'To do', 'p-hh:1': 'To do', 'p-ll:0': 'In progress', 'p-ll:1': 'Done', 'p-ib:0': 'Done', 'n-lm:0': 'Done', 'n-lm:1': 'Done', 's-ib:0': 'Done', 's-sd:0': 'In progress', 'd-sd:0': 'Done' }
  S.topic.tasks = { ...TASK_START }
  const NEXT_STATUS = { 'To do': 'In progress', 'In progress': 'Done', Done: 'To do' }
  const personStatus = (p) => { const ss = p.tasks.map((_, i) => S.topic.tasks[`${p.id}:${i}`]); return ss.every((s) => s === 'Done') ? 'Done' : ss.every((s) => s === 'To do') ? 'To do' : 'In progress' }
  const companyStatus = (c) => { const ss = c.people.map(personStatus); return ss.every((s) => s === 'Done') ? 'Done' : ss.every((s) => s === 'To do') ? 'To do' : 'In progress' }
  const topicProgress = () => { const v = Object.values(S.topic.tasks); return Math.round((v.filter((s) => s === 'Done').length / v.length) * 100) }
  const ring = (pct) => { const r = 7, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="${r}" class="ring__bg"/><circle cx="9" cy="9" r="${r}" class="ring__fg" stroke-dasharray="${(pct / 100) * c} ${c}"/></svg>` }
  const logo = ([l, c]) => `<span class="clogo" style="--c:${c}">${l}</span>`
  const E2 = [['Policies', 100], ['Actions', 60], ['Targets', 40, 'target'], ['Air, water and soil', 80], ['Hazardous substances', 100], ['Costs and savings', 0]]
  function rolesHTML() {
    const t = S.topic, q = t.q.trim().toLowerCase()
    const match = (c, p) => (t.role === 'all' || p.roles.includes(t.role)) && (!q || PEOPLE[p.who].name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || p.tasks.some(([n]) => n.toLowerCase().includes(q)))
    let out = ''
    for (const c of COMPANIES) {
      const ppl = c.people.filter((p) => match(c, p))
      if (!ppl.length) continue
      const open = t.open.has(c.id) || !!q
      out += `<div class="rrow rrow--co"><button type="button" class="iconbtn iconbtn--sm exp" data-act="topic-open" data-arg="${c.id}" aria-expanded="${open}" aria-label="${open ? 'Collapse' : 'Expand'} ${esc(c.name)}">${icon('chevron-down')}</button>${logo(c.logo)}<span class="rrow__name">${esc(c.name)}</span><span class="rrow__role"></span><span class="stack">${c.people.map((p) => avatar(p.who)).join('')}</span>${pill(companyStatus(c))}</div>`
      if (!open) continue
      for (const p of ppl) {
        const po = t.open.has(p.id) || !!q
        out += `<div class="rrow rrow--person ${t.flash === p.id ? 'is-new' : ''}"><button type="button" class="iconbtn iconbtn--sm exp" data-act="topic-open" data-arg="${p.id}" aria-expanded="${po}" aria-label="${po ? 'Collapse' : 'Expand'}">${icon('chevron-down')}</button>${avatar(p.who, true)}<span class="rrow__name">${esc(PEOPLE[p.who].name)}</span><span class="rrow__role">${p.roles.join(' and ').toLowerCase().replace(/^./, (m) => m.toUpperCase())}</span><span class="stack"></span>${pill(personStatus(p))}</div>`
        if (po) p.tasks.forEach(([n, r], i) => {
          const k = `${p.id}:${i}`, st = t.tasks[k]
          out += `<div class="rrow rrow--task">${n === 'Targets' ? `<button type="button" class="rrow__name link-row" data-act="go" data-arg="target">${n}${icon('arrow-up-right')}</button>` : `<span class="rrow__name">${n}</span>`}<span class="rrow__role">${r}</span><span class="stack"></span><button type="button" class="pill-btn" data-act="task" data-arg="${k}" title="Change the status">${pill(st)}</button></div>`
        })
      }
    }
    return out || '<p class="empty trow-empty">No one matches. <button type="button" class="link" data-act="topic-clear">Clear the filter</button></p>'
  }
  PAGES.topic = () => {
    const t = S.topic, pct = topicProgress()
    const mine = COMPANIES.flatMap((c) => c.people.filter((p) => p.who === ME).flatMap((p) => p.tasks.map(([n, r], i) => ({ k: `${p.id}:${i}`, n, r, c: c.name }))))
    return `
    <div class="wrap">
      <p class="kicker">Report 2023</p>
      <h1 class="h1">Pollution</h1>
      <div class="facts">
        <div class="fact"><span class="fact__k">Done</span><span class="fact__v">${ring(pct)}${pct}%</span></div>
        <div class="fact"><span class="fact__k">Owner</span><span class="fact__v">${avatar(ME, true)}${PEOPLE[ME].name}</span></div>
        <div class="fact"><span class="fact__k">Reviewer</span>${dropdown('reviewer', t.reviewer ? `<span class="fact__v">${avatar(t.reviewer, true)}${PEOPLE[t.reviewer].name}</span>` : `<span class="fact__v fact__v--empty"><span class="assign">${icon('user')}</span>Choose someone</span>`, Object.entries(PEOPLE).filter(([k]) => k !== ME).map(([k, p]) => [k, `${avatar(k)}${p.name}`]), t.reviewer, 'dd--fact')}</div>
      </div>
      <div class="ptabs"><div class="tabs__list" role="tablist">${[['people', 'People'], ['progress', 'Progress'], ['todo', 'My tasks']].map(([k, n]) => `<button type="button" class="tab" role="tab" aria-selected="${t.tab === k}" data-act="topic-tab" data-arg="${k}">${n}${k === 'todo' ? `<span class="count">${mine.filter((m) => t.tasks[m.k] !== 'Done').length}</span>` : ''}</button>`).join('')}</div></div>
      ${t.tab === 'people' ? `
        <div class="toolbar">
          <label class="search">${icon('search')}<input type="search" data-topic-q value="${esc(t.q)}" placeholder="Search people" aria-label="Search people" /></label>
          ${dropdown('role', t.role === 'all' ? 'Everyone' : `${t.role}`, [['all', 'Everyone'], ['Writes', 'Writes'], ['Reviews', 'Reviews'], ['Helps', 'Helps']], t.role, 'dd--plain')}
          <button type="button" class="btn btn--primary btn--sm toolbar__end" data-act="add-role" ${t.added ? 'disabled' : ''}>${icon('plus')}Add person</button>
        </div>
        <div class="roles" data-roles>${rolesHTML()}</div>` : ''}
      ${t.tab === 'progress' ? `<div class="drs">${E2.map(([name, p, to]) => `<button type="button" class="dr" data-act="${to ? 'go' : 'toast'}" data-arg="${to ?? `${name} isn’t written in this demo`}"><span class="dr__name">${name}</span><span class="progress"><span class="progress__bar" style="--p:${p}%"><i></i>${p > 0 ? '<b></b>' : ''}</span><span class="muted">${p}%</span></span>${icon('arrow-narrow-right')}</button>`).join('')}</div>` : ''}
      ${t.tab === 'todo' ? `<div class="todos">${mine.map((m) => { const done = t.tasks[m.k] === 'Done'; return `<div class="todo__row ${done ? 'is-done' : ''}"><button type="button" class="tick" role="checkbox" aria-checked="${done}" data-act="task-done" data-arg="${m.k}" aria-label="${m.n}">${icon(done ? 'circle-check' : 'circle-dashed-check')}</button><div class="todo__text"><b>${m.r === 'Reviews' ? 'Review' : 'Write'} the ${m.n.toLowerCase()}</b><small>${esc(m.c)} · ${t.tasks[m.k]}</small></div></div>` }).join('')}</div>` : ''}
    </div>`
  }

  /* ════ A target: Reduce air pollution from our plants ════ */
  const TGT_X = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2040, 2050]
  const TGT_ACTIONS = [['Filters on the Bergen kilns', 18, 2025], ['Cleaner burners in Gothenburg', 22, 2027], ['Electric heat at both plants', 45, 2030], ['Electric trucks', 25, 2040]]
  const interp = (yr) => {
    const pts = [[2023, S.tgt.base], ...S.tgt.miles]
    for (let i = 1; i < pts.length; i++) if (yr <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((yr - x0) / (x1 - x0)) * (y1 - y0) }
    return pts.at(-1)[1]
  }
  const impactAt = (yr) => S.tgt.base - TGT_ACTIONS.reduce((n, [, cut, y], i) => n + (S.tgt.actions[i] && yr >= y ? cut : 0), 0)
  function tgtChart(W, H) {
    const L = 8, R = 8, T = 14, B = 28, pw = W - L - R, ph = H - T - B, sh = S.tgt.show
    const x = (i) => L + (i / (TGT_X.length - 1)) * pw
    const ymax = 220, y = (v) => T + ph - (v / ymax) * ph
    let out = ''
    TGT_X.forEach((yr, i) => { out += `<text class="tg-x ${S.tgt.miles.some((m) => m[0] === yr) || yr === 2023 ? 'is-mile' : ''}" x="${x(i)}" y="${H - 6}" text-anchor="middle">’${String(yr).slice(2)}</text>` })
    for (let v = 0; v <= ymax; v += 55) out += `<line class="ch-grid ch-grid--solid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`
    // The plan as a soft area under its line
    if (sh.interp) { const pts = TGT_X.map((yr, i) => [x(i), y(interp(yr))]); out += `<path class="tg-area" d="M${pts[0][0]} ${T + ph}${pts.map((p) => `L${p[0]} ${p[1]}`).join('')}L${pts.at(-1)[0]} ${T + ph}Z"/><path class="tg-line" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')}"/>` }
    if (sh.impact) { const pts = TGT_X.map((yr, i) => [x(i), y(impactAt(yr))]); out += `<path class="tg-impact" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')}"/>` }
    if (sh.mile) for (const [yr, v] of [[2023, S.tgt.base], ...S.tgt.miles]) { const i = TGT_X.indexOf(yr); if (i >= 0) out += `<circle class="tg-mile" cx="${x(i)}" cy="${y(v)}" r="4.5"><title>${yr}: ${num(v)} tonnes</title></circle>` }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Air pollution: the plan, its milestones, and the effect of the chosen actions">${out}</svg>`
  }
  const tgtCell = (key, v) => S.tgt.edit === key
    ? `<input class="val__input val__input--wide" data-tgt="${key}" value="${v}" inputmode="numeric" aria-label="Value in tonnes" data-autofocus />`
    : `<button type="button" class="val val--edit" data-act="tgt-edit" data-arg="${key}" title="Click to change">${num(v)}${icon('pencil')}</button>`
  PAGES.target = () => {
    const t = S.tgt, sh = t.show, final = t.miles.at(-1), reach = impactAt(2050)
    const legend = [['interp', 'Plan', 'var(--steel-3)'], ['mile', 'Milestones', 'var(--text)'], ['impact', 'With our actions', 'var(--brand)']]
    const rows = [[2023, t.base, 'base', 'Start'], ...t.miles.map(([yr, v], i) => [yr, v, `m${i}`, i === t.miles.length - 1 ? 'Goal' : ''])]
    return `
    <div class="wrap">
      <div class="tg-head"><div><p class="kicker">Target</p><h1 class="h1 h1--tight">Reduce air pollution from our plants</h1><p class="muted">From 200 to 40 tonnes a year by 2050</p></div></div>
      <div class="tg-chart">${tgtChart(576, 210)}</div>
      <div class="tg-legend">${legend.map(([k, n, c]) => `<button type="button" class="key ${sh[k] ? '' : 'is-off'}" style="--c:${c}" role="checkbox" aria-checked="${sh[k]}" data-act="tgt-show" data-arg="${k}"><i class="key--${k}"></i>${n}</button>`).join('')}</div>
      <ol class="steps">
        <li class="step"><span class="step__n">1</span><div class="step__body">
          <h2 class="h2">Milestones</h2><p class="muted">Where emissions should be, year by year. In tonnes.</p>
          <div class="gtable">${rows.map(([yr, v, key, tag]) => `<div class="gtable__row"><span class="gtable__y">${yr}${tag ? ` <span class="tag">${tag}</span>` : ''}</span><span>${tgtCell(key, v)}</span><span class="muted">${key === 'base' ? '' : signed(pct(t.base, v))}</span></div>`).join('')}</div>
        </div></li>
        <li class="step"><span class="step__n">2</span><div class="step__body">
          <h2 class="h2">Actions</h2><p class="muted">Pick what will help. The dashed line on the chart shows their effect.</p>
          <div class="acts">${TGT_ACTIONS.map(([n, cut, yr], i) => `<button type="button" class="act-row" role="checkbox" aria-checked="${t.actions[i]}" data-act="tgt-action" data-arg="${i}"><span class="cbox ${t.actions[i] ? 'is-on' : ''}">${icon('check')}</span><span class="act-row__n">${n}</span><span class="muted">−${cut} t from ${yr}</span></button>`).join('')}</div>
          <p class="verdict ${reach <= final[1] ? 'is-ok' : ''}">${reach <= final[1] ? icon('circle-check') : icon('alert-triangle')}<span>${reach <= final[1] ? `These actions reach the goal: ${num(reach)} tonnes by 2050.` : `These actions get to ${num(reach)} tonnes by 2050, ${num(reach - final[1])} short of the goal.`}</span></p>
        </div></li>
        <li class="step"><span class="step__n">3</span><div class="step__body">
          <h2 class="h2">Tracking</h2><p class="muted">Checked every year against the numbers in <button type="button" class="link" data-act="go" data-arg="input">Data input</button>.</p>
        </div></li>
      </ol>
    </div>`
  }

  /* ── the page actions ── */
  const MENU = {
    reviewer: (v) => { S.topic.reviewer = v; toast(`${PEOPLE[v].name} reviews Pollution now`) },
    role: (v) => { S.topic.role = v },
  }
  const PAGE_ACTIONS = {
    go: (p) => go(p),
    pmenu: (k) => { S.pmenu = S.pmenu === k ? undefined : k; renderPage() },
    choose: (arg) => { const i = arg.indexOf(':'); MENU[arg.slice(0, i)](arg.slice(i + 1)); S.pmenu = undefined; renderPage() },
    article: (t) => toast(`“${t}” opens in the help center`, 'book'),
    todo: (k) => { S.todo.has(k) ? S.todo.delete(k) : S.todo.add(k); renderPage(); if (S.todo.size === TODO.length) toast('All done for today') },
    tour: () => { S.todo.add('tour'); S.guide = { ...S.guide, step: 0, min: false, seen: true }; go('input'); S.layer = 'guide'; renderLayer() },
    'help-all': (k) => { S.help.all.has(k) ? S.help.all.delete(k) : S.help.all.add(k); renderPage() },
    metric: (id) => go('metric', () => { S.metric = id; S.met.editTarget = false }),
    'inp-open': (id) => { S.inp.open.has(id) ? S.inp.open.delete(id) : S.inp.open.add(id); renderPage() },
    'inp-clear': () => { S.inp.q = ''; renderPage() },
    'topic-clear': () => { Object.assign(S.topic, { q: '', role: 'all' }); renderPage() },
    'inp-more': () => { S.inp.more = true; renderPage() },
    'inp-edit': (k) => { S.inp.edit = k; renderPage(); $(`[data-inp="${k}"]`, pageEl)?.select() },
    'inp-com': (id) => { go('report', () => { S.report = REPORT_OF[id]; S.sel = id; S.tab = 'comments' }); applySel(); renderDp(true); reveal(id) },
    'guide-open': () => { S.guide.min = false; S.layer = 'guide'; renderLayer(); renderPage() },
    'guide-hide': () => { S.guide.min = true; S.layer = undefined; renderLayer(); renderPage() },
    'guide-to': (i) => { S.guide.step = Number(i); renderLayer() },
    'guide-step': (n) => {
      const g = S.guide
      g.read.add(g.step)
      if (Number(n) > 0 && g.step === GUIDE.length - 1) { g.min = false; S.layer = undefined; renderLayer(); renderPage(); return toast('You’ve finished the guide') }
      g.step = Math.max(0, Math.min(GUIDE.length - 1, g.step + Number(n))); renderLayer()
    },
    'met-range': (r) => { S.met.range = r; S.met.editTarget = false; renderPage() },
    'met-c': (c) => { const on = S.met.on; on.has(c) ? on.delete(c) : on.add(c); renderPage() },
    'met-show': (k) => { S.met[k] = !S.met[k]; renderPage() },
    'target-edit': () => { S.met.editTarget = true; renderPage() },
    'target-cancel': () => { S.met.editTarget = false; renderPage() },
    'topic-tab': (k) => { S.topic.tab = k; renderPage() },
    'topic-open': (id) => { const o = S.topic.open; o.has(id) ? o.delete(id) : o.add(id); renderPage() },
    task: (k) => { S.topic.tasks[k] = NEXT_STATUS[S.topic.tasks[k]]; renderPage() },
    'task-done': (k) => { S.topic.tasks[k] = S.topic.tasks[k] === 'Done' ? 'To do' : 'Done'; renderPage() },
    'add-role': () => {
      COMPANIES[0].people.push({ id: 'p-sd', who: 'sd', roles: ['Helps'], tasks: [['Numbers', 'Helps']] })
      S.topic.tasks['p-sd:0'] = 'To do'; S.topic.added = true; S.topic.flash = 'p-sd'; S.topic.open.add('parent'); S.topic.role = 'all'; S.topic.q = ''
      renderPage(); toast('Sofie Dahl helps with Pollution now')
    },
    'tgt-show': (k) => { S.tgt.show[k] = !S.tgt.show[k]; renderPage() },
    'tgt-edit': (k) => { S.tgt.edit = k; renderPage(); $(`[data-tgt="${k}"]`, pageEl)?.select() },
    'tgt-action': (i) => { S.tgt.actions[i] = !S.tgt.actions[i]; renderPage() },
  }

  // Values typed on a page: Data input's manual values, the target's baseline and milestones, the metric's target
  function commitInput(el) {
    const v = Number(String(el.value).replace(/[^\d.]/g, ''))
    if (el.dataset.inp) { if (Number.isFinite(v)) { S.inp.vals[el.dataset.inp] = v } S.inp.edit = undefined }
    if (el.dataset.tgt) {
      const k = el.dataset.tgt
      if (Number.isFinite(v) && v >= 0) { if (k === 'base') S.tgt.base = v; else S.tgt.miles[Number(k.slice(1))][1] = v }
      S.tgt.edit = undefined
    }
    renderPage()
  }
  pageEl.addEventListener('keydown', (e) => {
    const t = e.target
    if ((t.dataset.inp || t.dataset.tgt) && e.key === 'Enter') { e.preventDefault(); commitInput(t) }
    if ((t.dataset.inp || t.dataset.tgt) && e.key === 'Escape') { e.stopPropagation(); S.inp.edit = undefined; S.tgt.edit = undefined; renderPage() }
  })
  pageEl.addEventListener('focusout', (e) => { const t = e.target; if ((t.dataset.inp && S.inp.edit) || (t.dataset.tgt && S.tgt.edit)) commitInput(t) })
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
    if (t.matches('[data-inp-q]')) { S.inp.q = t.value; $('[data-inp-rows]', pageEl).innerHTML = inputRows() }
    if (t.matches('[data-topic-q]')) { S.topic.q = t.value; $('[data-roles]', pageEl).innerHTML = rolesHTML() }
  })

  const ACTIONS = {
    pick: (id) => pick(id),
    report: (rid) => {
      finishEdit()
      if (S.report === rid) return
      S.report = rid; S.sel = undefined; S.menu = false
      stage.scrollTop = 0
      renderToc(); renderStage(true); renderDp()
    },
    toggle: (gid) => { S.open.has(gid) ? S.open.delete(gid) : S.open.add(gid); renderToc() },
    off: () => toast('Only Climate is written in this demo', 'info-square'),
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
    download: async () => {
      S.downloading = true; renderToc()
      await wait(1400)
      S.downloading = false; renderToc()
      toast('Report 2023.pdf is ready', 'download')
    },
  }

  Object.assign(ACTIONS, PAGE_ACTIONS)

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]')
    if (S.menu && !e.target.closest('.menu, .who')) { S.menu = false; renderDp() }
    if (S.pmenu && !e.target.closest('.dd')) { S.pmenu = undefined; renderPage() }
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
      if (S.pmenu) { S.pmenu = undefined; return renderPage() }
      if (S.page !== 'report') return
      if (S.menu) { S.menu = false; return renderDp() }
      if (S.editing) { finishEdit(); return }
      if (S.sel) ACTIONS.close()
    }
  })

  /* ── the walkthrough: Anastasia's cursor starts at Home, takes the product tour into Data input and its guide, then
     goes through the report, Insights and a target, and does on each what a visitor would (../walkthrough.js runs it,
     and gives way to the visitor). Each step finds what it presses when it gets there, and skips what's done: a second
     time round, the answer is written ── */
  const railItem = (p) => () => $(`.rail__item[data-arg="${p}"]`, rail)
  if (!new URLSearchParams(location.search).has('nowalk')) window.Walkthrough?.({
    name: 'Anastasia',
    color: '#7b4dff',
    // Each page's place in the tour; the Help center and Pollution sit after the page they're nearest
    where: () => ({ home: 0, input: 1, help: 1.5, report: 2, topic: 2.5, metric: 3, target: 4 })[S.page],
    // Before it carries on: what the visitor left open closed
    tidy: async () => {
      if (S.editing) finishEdit()
      if (S.menu) { S.menu = false; renderDp() }
      if (S.pmenu) { S.pmenu = undefined; renderPage() }
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
      // Data input, from Home's product tour: its guide, two steps on, then hidden, and a row opened
      { enter: async (w) => {
        if (S.page !== 'home') { await w.click(railItem('home')); await w.pause(700) }
        await w.click(() => $('[data-act="tour"]', pageEl))
      }, steps: [
        async (w) => {
          if (S.layer !== 'guide') { await w.click(() => $('[data-act="guide-open"]', pageEl)); await w.pause(800) }
          for (let i = 0; i < 2; i++) {
            await w.pause(1600)
            await w.click(() => $('[data-act="guide-step"][data-arg="1"]', layer))
          }
          await w.pause(1600)
          await w.click(() => $('[data-act="guide-hide"]', layer))
          await w.pause(800)
          const row = () => $('[data-act="inp-open"][aria-expanded="false"]', pageEl)
          if (row()) { await w.click(row); await w.pause(1400) }
        },
      ] },
      // The report: a target in the text; then a paragraph whose answer is written from the companies' answers, and
      // put in the report
      { enter: (w) => w.click(railItem('report')), steps: [
        async (w) => {
          if (S.report !== 'e1-4') { await w.click(() => $('[data-act="report"][data-arg="e1-4"]', toc)); await w.pause(900) }
          await w.click(() => $('.v[data-v="t-s1"]', stage))
          await w.pause(2200)
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
