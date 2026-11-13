/* The Sanna demo (index.html says what it is). One state object; the timeline, the task, Hege's panel and the progress
   under the task each draw from it. A soft ring points at the next thing to press, so a visitor can follow the flow:
   Continue → each unknown transaction → the two questions → Send to Hege → back on the timeline, where Hege approves it. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms))
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const $ = (sel, root = document) => root.querySelector(sel)

  /* ── icons (Lucide, as Sanna uses) ── */
  const P = {
    form: '<path d="M4 14h6"/><path d="M4 2h10"/><rect x="4" y="18" width="16" height="4" rx="1"/><rect x="4" y="6" width="16" height="4" rx="1"/>',
    landmark: '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
    fileText: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    userRound: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    checkCheck: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
    scanEye: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    bookOpen: '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    fileQuestion: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M9 9.5a3 2.5 0 016 0c0 2-2 2-3 3.5"/><path d="M12 17h.01"/>',
    moveRight: '<path d="M18 8L22 12L18 16"/><path d="M2 12H22"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    handCoins: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>',
    download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
    files: '<path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z"/><path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    note: '<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.72a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.28 17.61a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98"/>',
    upRight: '<path d="M13 5H19V11"/><path d="M19 5L5 19"/>',
    calendar: '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
    receipt: '<path d="M12 17V7"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"/>',
    banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    fileCheck: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m9 15 2 2 4-4"/>',
    laptop: '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"/><path d="M20.054 15.987H3.946"/>',
    refund: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  }
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>`
  const HEGE = 'assets/hege.webp'

  /* ── content ── */
  // What a transaction can be. `needs` shows under the category; `file` is what Add receipt attaches.
  const CATS = {
    loan: { name: 'Loan', icon: 'handCoins', needs: 'Loan requires a loan agreement. If you do not have it, use our template to create a document', template: true, required: true },
    software: { name: 'Software', icon: 'laptop', needs: 'Add the receipt or the invoice from the seller.' },
    sale: { name: 'Customer payment', icon: 'receipt', needs: 'Add the invoice this payment is for.' },
    deposit: { name: 'Owner deposit', icon: 'banknote' },
    refund: { name: 'Refund', icon: 'refund' },
    other: { name: 'Other', icon: 'ellipsis' },
  }
  const TX = [
    { id: 't1', amount: '+50.00 kr', in: true, date: '30 Sep 2025', from: 'Nordvik Holding AS', cat: 'loan', file: 'Loan agreement – Nordvik Holding AS.pdf',
      thread: [
        { who: 'hege', html: '<b>Hege</b> suggested category <strong>Loan</strong> and asked for more context' },
        { who: 'you', html: '<b>Anastasia</b> shared context', body: 'I don’t have a loan agreement' },
        { who: 'hege', html: '<b>Hege</b> left a comment', body: 'Use the template' },
      ] },
    { id: 't2', amount: '−1,492.50 kr', date: '2 Oct 2025', from: 'Figma', cat: 'software', file: 'Figma invoice – October.pdf',
      thread: [{ who: 'hege', html: '<b>Hege</b> suggested category <strong>Software</strong> and asked for the receipt' }] },
    { id: 't3', amount: '+6,715.56 kr', in: true, date: '14 Oct 2025', from: 'Nordlys Design AS', cat: undefined, file: 'Invoice 1042 – Nordlys Design AS.pdf',
      thread: [{ who: 'hege', html: '<b>Hege</b> asked what this payment is for' }] },
  ]
  const QS = [
    { id: 'q1', text: 'Did the company buy anything in 2025 that it will use for years, like a computer or a car, for more than 15,000 kr?' },
    { id: 'q2', text: 'Did a shareholder lend money to the company in 2025, or borrow from it?' },
  ]
  // The task's ten steps: three done before the demo starts, two for you, the rest for Hege and Sanna
  const STEPS = [
    ['Connect the bank account', 'You'], ['Share last year’s accounts', 'You'], ['Close the documented transactions', 'Hege'],
    ['Review unknown transactions', 'You'], ['Answer 2 questions', 'You'], ['Draft the statement', 'Hege'], ['Check the balance', 'Sanna'],
    ['Write the notes', 'Hege'], ['Final review', 'Hege'], ['File with the Register Centre', 'Sanna'],
  ]
  const INFO = {
    onboarding: ['Onboarding', 'Completed 9 January. Hege set up Company AS in Sanna and met you for a first call.'],
    started: ['Getting started', 'Completed 21 January. You connected the bank account and shared last year’s accounts.'],
    afs: ['Annual financial statement', 'Hege needs a few answers before she drafts the statement. Due 28 February.'],
    'afs-review': ['In review by accountant', 'Hege is going through your answers and receipts. You’ll hear from her if she needs more.'],
    'afs-done': ['Annual financial statement', 'Approved by Hege today. Sanna files it with the Brønnøysund Register Centre by 31 July.'],
    'tax-return': ['Tax return 2025', 'Sanna is preparing the company’s tax return. It will be ready for you to check in May.'],
    'annual-accounts': ['Annual accounts 2025', 'Sanna drafts the annual accounts from the statement. Hege signs them off before filing.'],
  }

  const S = {
    phase: 'work', // work → review (sent to Hege) → approved → done (all tasks complete)
    sheet: false, sent: false, sending: false,
    step: 'tx', // the open step: 'tx', 'qs' or none
    process: false,
    panel: undefined, menu: false, unsure: false, hint: undefined, noteOpen: false,
    answers: {},
    fresh: new Set(), // steps just done, drawn darker for a moment
  }
  const txById = (id) => TX.find((t) => t.id === id)
  const txDone = () => TX.every((t) => t.sent)
  const qsDone = () => QS.every((q) => S.answers[q.id])
  const stepsDone = () => 3 + (txDone() ? 1 : 0) + (qsDone() ? 1 : 0)

  const desk = $('[data-desk]')
  const app = $('[data-app]')
  const tl = $('[data-tl]')
  const tlIn = $('[data-tl-in]')
  const sheet = $('[data-sheet]')
  const sheetIn = $('.sheet__in', sheet)
  const sheetScroll = $('[data-sheet-scroll]')
  const sheetCol = $('[data-sheet-col]')
  const foot = $('[data-foot]')
  const panel = $('[data-panel]')
  const layer = $('[data-layer]')

  /* ── the rail, the bar at the bottom ── */
  $('[data-rail]').innerHTML = `
    <span class="rail__me" data-tip="Hege, your accountant · online"><img src="${HEGE}" alt="Hege" width="40" height="40" /></span>
    <i class="rail__sep"></i>
    <button type="button" class="rail__btn" aria-current="page" data-act="top" data-tip="Timeline" aria-label="Timeline">${icon('form')}</button>
    <span class="rail__btn" data-tip="Bank">${icon('landmark')}</span>
    <span class="rail__btn" data-tip="Documents">${icon('fileText')}</span>
    <i class="rail__sep"></i>
    <span class="rail__btn" data-tip="Profile">${icon('userRound')}</span>`
  $('[data-bar]').innerHTML = `
    <img class="bybar__art" src="assets/bar.webp" alt="" />
    <span class="bybar__who"><img src="assets/mark.svg" alt="" />In progress by Sanna</span>
    ${[['tax-return', 'Tax return'], ['annual-accounts', 'Annual accounts']].map(([id, d]) => `<button type="button" class="doc" data-act="info" data-arg="${id}">${icon('fileText')}${d}${icon('upRight')}</button>`).join('')}`

  /* ── the timeline ── */
  const dots = '<img class="tcard__art tcard__dots" src="assets/dots.webp" alt="" /><i class="tcard__fade"></i>'
  const infoBtn = (id) => `<button type="button" class="ibtn" data-act="info" data-arg="${id}" aria-label="About this task">${icon('info')}</button>`
  const doneCard = (title, id, cls = '') => `
    <div class="tcard is-past ${cls}">${dots}
      <div class="tcard__text"><span class="tcard__status st-done">${icon('checkCheck')}Completed</span><span class="tcard__title">${title}</span></div>
      <div class="tcard__acts">${infoBtn(id)}</div>
    </div>`
  function afsCard() {
    const left = 2 - (txDone() ? 1 : 0) - (qsDone() ? 1 : 0)
    let status
    if (S.phase === 'work') status = `<span class="tcard__status st-due">${icon('calendar')}Due in 5d<i class="dot"></i>${left ? `${left} step${left > 1 ? 's' : ''} for you` : 'Ready to send'}</span>`
    if (S.phase === 'review') status = `<span class="tcard__status st-review">${icon('scanEye')}In review by accountant<i class="dot"></i><span class="soft">Due in 5d</span></span>`
    if (S.phase === 'approved') status = `<span class="tcard__status st-done">${icon('checkCheck')}Completed</span>`
    const acts = S.phase === 'work'
      ? `<button type="button" class="tbtn" data-act="open-task">Continue</button>${infoBtn('afs')}`
      : infoBtn(S.phase === 'review' ? 'afs-review' : 'afs-done')
    return `
      <div class="tcard ${S.phase === 'approved' ? 'is-flipping' : ''}" data-afs>
        <img class="tcard__art tcard__flowers" src="assets/flowers.webp" alt="" />
        <div class="tcard__text">${status}<span class="tcard__title">Annual financial statement</span></div>
        <div class="tcard__acts">${acts}</div>
      </div>`
  }
  const allDone = () => `
    <div class="tcard tcard--all is-entering">
      <div class="tcard__art tcard__clouds"><img src="assets/clouds.webp" alt="" /></div>
      <div class="alldone"><b>${icon('checkCheck')}All tasks complete</b><p>You’ve completed all assigned tasks. We’ll reach out if there’s anything else you need to review or submit.</p></div>
    </div>`
  const sharesCard = () => `
    <div class="tcard is-locked">
      <img class="tcard__art tcard__trees" src="assets/trees.webp" alt="" />
      <div class="tcard__text"><span class="tcard__status st-lock">${icon('lock')}Upcoming</span><span class="tcard__title">Shareholdings information</span></div>
      <div class="tcard__acts"><button type="button" class="tbtn is-locked" data-act="locked">${icon('lock')}Start task</button></div>
    </div>`
  const row = ({ month, body, focus, empty, id }) => `
    <div class="tl-row ${focus ? 'tl-row--focus' : ''}" ${id ? `data-row="${id}"` : ''}>
      <div class="tl-rail"><i class="tl-dot"></i><i class="tl-line"></i></div>
      <div class="tl-body ${empty ? 'tl-body--empty' : ''}"><p class="tl-month">${month}</p>${empty ? '<p class="tl-none">No tasks due</p>' : `<div class="tl-cards">${body}</div>`}</div>
    </div>`
  function renderTimeline() {
    const done = S.phase === 'done'
    tlIn.innerHTML = [
      '<p class="tl-year">2026</p>',
      row({ month: 'January', body: doneCard('Onboarding', 'onboarding') + doneCard('Getting started', 'started') }),
      done ? row({ month: 'February', id: 'past', body: doneCard('Annual financial statement', 'afs-done', 'is-entering') }) : '',
      row({ month: 'Today’s focus', focus: true, id: 'focus', body: done ? allDone() : afsCard() }),
      row({ month: 'March', empty: true }),
      row({ month: 'April', body: sharesCard() }),
      row({ month: 'May–December', empty: true }),
    ].join('')
    renderTicks()
  }
  // Today's focus in the middle; once it's all done, the task that just moved into February at the top, above it
  const centerFocus = (smooth) => {
    const f = $('[data-row="focus"] .tl-cards', tlIn)
    if (!f) return
    const past = S.phase === 'done' && $('[data-row="past"] .tl-cards', tlIn)
    const top = past ? past.offsetTop - 100 : f.offsetTop - (tl.clientHeight - f.offsetHeight) / 2 - 8
    tl.scrollTo({ top, behavior: smooth && !reduced ? 'smooth' : 'auto' })
  }
  // Where you are in the year: eleven ticks, the one under the middle of the view in orange
  const ticks = $('[data-ticks]')
  ticks.innerHTML = '<i></i>'.repeat(11)
  function renderTicks() {
    const max = tl.scrollHeight - tl.clientHeight
    const at = Math.round((max > 0 ? tl.scrollTop / max : 0.5) * 10)
    ticks.querySelectorAll('i').forEach((el, i) => { el.className = `t${Math.min(Math.abs(i - at), 3)}` })
  }
  tl.addEventListener('scroll', () => { renderTicks(); closePop() }, { passive: true })

  /* ── the task ── */
  function processHTML() {
    const n = stepsDone()
    return `<ol class="process">${STEPS.map(([name, who], i) => {
      const cls = i < n ? 'is-done' : (i === 3 && !txDone()) || i === 4 ? 'is-now' : ''
      return `<li class="${cls}"><span class="n">${i < n ? icon('check') : i + 1}</span><b>${name}</b><span>${who}</span></li>`
    }).join('')}</ol>`
  }
  function txStepHTML() {
    const done = txDone()
    const open = S.step === 'tx'
    const head = `
      <div class="step__head">
        <div class="step__name">
          ${done ? `<span class="step__state is-done">${icon('checkCheck')}Completed</span>` : `<span class="step__state">${icon('loader')}In progress</span>`}
          <span class="step__title">${done ? 'Unknown transactions sent to Hege' : `Review ${TX.length} unknown transactions`}</span>
        </div>
        <button type="button" class="cont" data-act="step" data-arg="tx" aria-expanded="${open}">Continue${icon('right')}</button>
      </div>`
    if (!open) return `<section class="box box--step">${head}</section>`
    const rows = TX.map((t) => `
      <div class="tx ${t.sent ? 'is-sent' : ''} ${S.justSent === t.id ? 'is-just-sent' : ''}">
        <span class="tx__ico">${icon(t.sent ? 'check' : 'fileQuestion')}</span>
        <div class="tx__text">
          <span class="tx__title">${t.sent ? esc(CATS[t.cat].name) : 'Unknown transaction'}</span>
          <span class="tx__meta">${t.sent ? '<span class="sent">Sent to Hege</span><i></i>' : ''}${t.date}<i></i>${esc(t.from)}<i></i>Folio account</span>
        </div>
        <span class="tx__amt ${t.in ? 'is-in' : 'is-out'}">${t.amount}</span>
        <button type="button" class="go ${S.panel === t.id ? 'is-open' : ''}" data-act="tx" data-arg="${t.id}" aria-label="${S.panel === t.id ? 'Close' : 'Open'} this transaction">${icon(S.panel === t.id ? 'x' : 'moveRight')}</button>
      </div>`).join('')
    return `
      <section class="box box--step">${head}
        <div class="step__body">
          <div class="says"><img src="${HEGE}" alt="" /><div><b><em>Hege</em> says:</b>Hello Anastasia! I have reviewed this year's account movements and closed the transactions for which we have sufficient documentation. For the remaining transactions, we need additional information. Please review them and share the necessary description and/or documentation.</div></div>
          <div class="txs">${rows}</div>
        </div>
      </section>`
  }
  function qsStepHTML() {
    const done = qsDone()
    const open = S.step === 'qs'
    const fresh = !done && !Object.keys(S.answers).length
    const head = `
      <div class="step__head">
        <div class="step__name">
          ${done ? `<span class="step__state is-done">${icon('checkCheck')}Completed</span>` : `<span class="step__state">${icon('loader')}In progress</span>`}
          <span class="step__title">Answer 2 questions</span>
        </div>
        ${fresh && !open ? '<span class="new">2 new</span>' : ''}
        <button type="button" class="cont" data-act="step" data-arg="qs" aria-expanded="${open}">Continue${icon('right')}</button>
      </div>`
    if (!open) return `<section class="box box--step">${head}</section>`
    return `
      <section class="box box--step">${head}
        <div class="step__body">
          <div class="says"><img src="${HEGE}" alt="" /><div><b><em>Hege</em> says:</b>Two quick questions about 2025, so the statement shows everything the company owns and owes.</div></div>
          <div class="qs">${QS.map((q) => `
            <div class="q" data-q="${q.id}"><p>${q.text}</p>
              <span class="yn" role="group" aria-label="Answer">${['Yes', 'No'].map((a) => `<button type="button" data-act="answer" data-arg="${q.id}:${a}" aria-pressed="${S.answers[q.id] === a}">${a}</button>`).join('')}</span>
            </div>`).join('')}
          </div>
        </div>
      </section>`
  }
  let sheetKey
  function renderSheet() {
    if (!S.sheet) return
    const key = S.sent ? 'sent' : 'task'
    const top = sheetScroll.scrollTop
    if (S.sent) {
      sheetCol.innerHTML = `
        <div class="sent-to">
          <span class="sent-to__ico">${icon('checkCheck')}</span>
          <h2>Sent to Hege</h2>
          <p>She’ll go through your answers and receipts, and let you know if she needs anything else. You’ll see it on your timeline.</p>
          <button type="button" class="cta" data-act="close-task">Back to timeline</button>
        </div>`
    } else {
      sheetCol.innerHTML = `
        <h1 class="sheet__title">Help us finalize the annual financial statement</h1>
        <section class="box about">
          <div><span class="label">${icon('bookOpen')}About the annual financial statement</span>
          <p>The annual financial statement is the company's official accounts for the year. It summarizes income, expenses, assets, and liabilities, and is reported to the authorities.</p></div>
          <button type="button" class="link" data-act="process" aria-expanded="${S.process}">Process${icon('right')}</button>
          ${S.process ? processHTML() : ''}
        </section>
        <div class="steps" style="display:flex;flex-direction:column;gap:8px">${txStepHTML()}${qsStepHTML()}</div>`
    }
    if (key !== sheetKey) { sheetCol.classList.remove('page-in'); void sheetCol.offsetWidth; sheetCol.classList.add('page-in'); sheetScroll.scrollTop = 0 }
    else sheetScroll.scrollTop = top
    sheetKey = key
    renderFoot()
    renderShift()
  }
  let lastDone = 3
  function renderFoot() {
    const n = stepsDone()
    if (n > lastDone) { for (let i = lastDone; i < n; i++) S.fresh.add(i); setTimeout(() => { S.fresh.clear(); renderFoot() }, reduced ? 0 : 900) }
    lastDone = n
    const ready = txDone() && qsDone() && !S.sent
    foot.innerHTML = `
      <div class="foot__col">
        <div class="foot__main">
          <div class="foot__row"><span>Task progress</span><em>${icon(n === 10 ? 'checkCheck' : 'loader')}${n}/10</em></div>
          <div class="bar">${STEPS.map((_, i) => `<i class="${S.fresh.has(i) ? 'is-fresh' : i < n ? 'is-done' : !S.sent && i >= n && i < 5 ? 'is-now' : ''}"></i>`).join('')}</div>
        </div>
        ${ready ? `<button type="button" class="cta cta--sm" data-act="send-hege" ${S.sending ? 'disabled' : ''}>${S.sending ? `${icon('loader', 'spin')}Sending` : 'Send to Hege'}</button>` : ''}
      </div>`
    renderCoach()
  }
  // With Hege's panel open, the task's column moves left so the panel doesn't cover it
  function renderShift() {
    if (!S.panel) { sheetIn.style.setProperty('--shift', '0px'); return }
    const w = sheetIn.clientWidth
    const col = Math.min(600, w)
    const room = w - 16 - 368 - 32 // left of the panel, with a gap
    const left = Math.max(32, Math.min((w - col) / 2, room - col))
    sheetIn.style.setProperty('--shift', `${left - (w - col) / 2}px`)
  }

  /* ── Hege's panel ── */
  let panelKey
  function renderPanel() {
    const t = txById(S.panel)
    if (!t) {
      if (!panel.hidden && !panel.classList.contains('is-leaving')) {
        panel.classList.add('is-leaving')
        setTimeout(() => { panel.hidden = true; panel.classList.remove('is-leaving') }, reduced ? 0 : 180)
      }
      panelKey = undefined
      return
    }
    const sc = $('.tpanel__scroll', panel)
    const top = sc?.scrollTop
    panel.classList.remove('is-leaving')
    panel.hidden = false
    const cat = CATS[t.cat]
    const evs = t.thread.map((e, i) => `
      <div class="ev ${e.isNew ? 'is-new' : ''}">
        <span class="ev__who">${e.who === 'hege' ? `<img src="${HEGE}" alt="" />` : 'A'}</span>
        <div class="ev__text"><p>${e.html}</p>${e.body ? `<p class="ev__body">${esc(e.body)}</p>` : ''}${e.file ? `<span class="ev__file">${icon('fileCheck')}${esc(e.file)}</span>` : ''}</div>
      </div>`).join('')
    t.thread.forEach((e) => { e.isNew = false })
    let form
    if (t.sent) {
      form = `<div class="waiting">${icon('check')}Sent to Hege. She’ll reply here if she needs more.</div>`
    } else {
      const menu = S.menu ? `<div class="menu" role="listbox">${Object.entries(CATS).map(([k, c]) => `<button type="button" role="option" data-act="cat" data-arg="${k}" aria-selected="${t.cat === k}">${icon(c.icon)}<span>${c.name}</span>${t.cat === k ? icon('check', 'ok') : ''}</button>`).join('')}</div>` : ''
      const receipt = `
        <div class="receipt">
          <button type="button" class="field field--receipt" data-act="receipt">${icon('files')}<span>Add receipt</span>${icon('plus')}</button>
          ${t.attached ? `<div class="file">${icon('fileCheck')}<span>${esc(t.file)}</span>${t.uploading ? '<i class="file__bar"></i>' : `<button type="button" class="rm" data-act="rm-file" aria-label="Remove">${icon('x')}</button>`}</div>` : ''}
        </div>`
      const note = S.noteOpen || t.note
        ? `<textarea class="note" data-note placeholder="Add a note" rows="2">${esc(t.note || '')}</textarea>`
        : `<button type="button" class="field field--note" data-act="note">${icon('note')}<span>Add a note</span></button>`
      form = `
        <div class="ev">
          <span class="ev__who">A</span>
          <div class="ev__text" style="gap:8px"><p>Provide context for this transaction</p>
            <div class="form">
              <div class="form__group">
                <button type="button" class="field ${cat ? '' : 'is-empty'}" data-act="menu" aria-haspopup="listbox" aria-expanded="${S.menu}">${cat ? icon(cat.icon) : ''}<span>${cat ? cat.name : 'Choose a category'}</span>${icon('down', 'chev')}</button>
                ${menu}
                ${cat?.needs ? `<div class="need">${esc(cat.needs)}${cat.template ? `<button type="button" data-act="template" class="${t.template ? 'is-done' : ''}">${icon(t.template ? 'check' : 'download')}${t.template ? 'Template downloaded' : 'Download template'}</button>` : ''}</div>` : ''}
              </div>
              <div class="form__group">${receipt}${note}</div>
              <div class="form__group">
                <button type="button" class="unsure" data-act="unsure" aria-expanded="${S.unsure}">Not sure what to send${icon('down')}</button>
                ${S.unsure ? '<p class="unsure-text">Send what you have: a receipt, an invoice, a contract, or a short note on what it was for. Hege will ask if she needs more.</p>' : ''}
                ${S.hint ? `<p class="hint">${esc(S.hint)}</p>` : ''}
                <button type="button" class="cta" data-act="send" ${S.sendingTx ? 'disabled' : ''}>${S.sendingTx ? `${icon('loader', 'spin')}Sending` : 'Send'}</button>
              </div>
            </div>
          </div>
        </div>`
    }
    panel.innerHTML = `<div class="tpanel__scroll">${evs}${form}</div>`
    const sc2 = $('.tpanel__scroll', panel)
    // The same transaction keeps its scroll. A new one opens on Hege's notes, then glides down to the form
    if (panelKey === t.id) sc2.scrollTop = top
    else if (reduced) sc2.scrollTop = sc2.scrollHeight
    else { sc2.scrollTop = 0; const id = t.id; setTimeout(() => { if (panelKey === id) sc2.scrollTo({ top: sc2.scrollHeight, behavior: 'smooth' }) }, 650) }
    panelKey = t.id
    renderCoach()
  }

  /* ── the flow ── */
  const setPath = () => {
    $('[data-path]').textContent = S.sheet ? '/tasks/annual-financial-statement' : '/timeline'
    $('[data-act="back"]').disabled = !S.sheet
  }
  function openTask() {
    if (S.phase !== 'work') return
    closePop()
    S.sheet = true
    sheet.hidden = false
    sheet.classList.remove('is-leaving')
    app.classList.add('has-sheet')
    sheetKey = undefined
    renderSheet()
    setPath()
    // A moment on the title, then down to the open step, where the ring is
    setTimeout(() => { if (S.sheet && !S.sent && !S.panel && S.step) scrollToStep(S.step) }, reduced ? 0 : 700)
  }
  async function closeTask() {
    if (!S.sheet) return
    const sent = S.sent
    S.sheet = false
    S.panel = undefined; S.menu = false
    renderPanel()
    setPath()
    sheet.classList.add('is-leaving')
    app.classList.remove('has-sheet')
    setTimeout(() => { sheet.hidden = true; sheet.classList.remove('is-leaving') }, reduced ? 0 : 200)
    if (sent && S.phase === 'work') {
      S.phase = 'review'
      renderTimeline(); centerFocus(false); renderCoach()
      await wait(2800)
      S.phase = 'approved'
      renderTimeline(); renderCoach()
      toast(`<img src="${HEGE}" alt="" /><span><b>Hege</b> approved the annual financial statement</span>`)
      await wait(1300)
      S.phase = 'done'
      renderTimeline()
      centerFocus(true)
      renderCoach()
    } else {
      renderTimeline(); renderCoach()
    }
  }
  function openTx(id) {
    S.menu = false; S.unsure = false; S.hint = undefined
    S.noteOpen = false
    S.panel = S.panel === id ? undefined : id
    renderSheet(); renderPanel()
  }
  async function attach() {
    const t = txById(S.panel)
    if (t.attached) return
    t.attached = true; t.uploading = true; S.hint = undefined
    renderPanel()
    await wait(700)
    t.uploading = false
    if (S.panel === t.id) renderPanel()
  }
  async function sendTx() {
    const t = txById(S.panel)
    if (!t || t.sent || S.sendingTx) return
    if (!t.cat) { S.hint = 'Choose a category first.'; renderPanel(); return }
    if (CATS[t.cat].required && !t.attached) { S.hint = 'Add the loan agreement before you send.'; renderPanel(); return }
    S.hint = undefined; S.sendingTx = true; S.menu = false
    renderPanel()
    await wait(650)
    S.sendingTx = false
    t.sent = true
    t.thread.push({ who: 'you', html: '<b>Anastasia</b> shared context', body: t.note || `It’s ${CATS[t.cat].name.toLowerCase()}.`, file: t.attached ? t.file : undefined, isNew: true })
    S.justSent = t.id
    S.panel = undefined
    renderPanel(); renderSheet()
    S.justSent = undefined
    if (txDone()) {
      await wait(700)
      if (S.sheet && !S.sent) { S.step = 'qs'; renderSheet(); scrollToStep('qs') }
    }
  }
  const scrollToStep = (id) => {
    const el = $(`[data-act="step"][data-arg="${id}"]`, sheetCol)?.closest('.box')
    if (el) sheetScroll.scrollTo({ top: el.offsetTop - 16, behavior: reduced ? 'auto' : 'smooth' })
  }
  async function answer(arg) {
    const [id, a] = arg.split(':')
    const was = qsDone()
    S.answers[id] = a
    renderSheet()
    if (!was && qsDone()) {
      await wait(500)
      if (S.step === 'qs') { S.step = undefined; renderSheet() }
    }
  }
  async function sendHege() {
    if (S.sending || !txDone() || !qsDone()) return
    S.sending = true; renderFoot()
    await wait(900)
    S.sending = false
    S.sent = true
    S.panel = undefined; renderPanel()
    renderSheet()
  }

  /* ── popovers and toasts ── */
  function showPop(btn, id) {
    if (layer.dataset.for === id) { closePop(); return }
    const [title, text] = INFO[id]
    // The app is zoomed (styles.css): rects are on screen, the popover's place is in the app's own pixels
    const a = app.getBoundingClientRect()
    const k = a.width / app.offsetWidth || 1
    const r = btn.getBoundingClientRect()
    const above = r.top - a.top > a.height / 2
    const left = Math.max(12, Math.min((r.right - a.left) / k - 260, app.offsetWidth - 272))
    const y = above ? `bottom:${(a.bottom - r.top) / k + 8}px` : `top:${(r.bottom - a.top) / k + 8}px`
    layer.dataset.for = id
    layer.innerHTML = `<div class="pop" role="dialog" style="left:${left}px;${y}"><b>${esc(title)}</b>${esc(text)}</div>`
  }
  function closePop() { if (layer.dataset.for) { layer.innerHTML = ''; delete layer.dataset.for } }
  function toast(html, ms = 3200) {
    const box = $('[data-toasts]')
    const el = document.createElement('div')
    el.className = 'toast'
    el.innerHTML = html
    box.append(el)
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220) }, reduced ? ms / 2 : ms)
  }

  /* ── coach: the next thing to press ── */
  function renderCoach() {
    desk.querySelectorAll('.is-coach').forEach((el) => el.classList.remove('is-coach'))
    let el
    if (!S.sheet) el = S.phase === 'work' ? $('[data-act="open-task"]', tlIn) : undefined
    else if (S.sent) el = $('.sent-to .cta', sheetCol)
    else if (S.panel) {
      const t = txById(S.panel)
      if (!t.sent) {
        if (S.menu) el = undefined
        else if (!t.cat) el = $('[data-act="menu"]', panel)
        else if (CATS[t.cat].template && !t.template) el = $('[data-act="template"]', panel)
        else if (CATS[t.cat].required && !t.attached) el = $('[data-act="receipt"]', panel)?.parentElement
        else if (!t.uploading) el = $('[data-act="send"]', panel)
      }
    } else if (!txDone()) {
      if (S.step !== 'tx') el = $('[data-act="step"][data-arg="tx"]', sheetCol)
      else el = $(`[data-act="tx"][data-arg="${TX.find((t) => !t.sent).id}"]`, sheetCol)
    } else if (!qsDone()) {
      if (S.step !== 'qs') el = $('[data-act="step"][data-arg="qs"]', sheetCol)
      else el = $(`[data-q="${QS.find((q) => !S.answers[q.id]).id}"] .yn`, sheetCol)
    } else el = $('[data-act="send-hege"]', foot)
    el?.classList.add('is-coach')
  }

  function tick() {
    const d = new Date()
    const day = d.toLocaleDateString('en-GB', { weekday: 'short' })
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    $('[data-time]').textContent = `${day} ${date} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  }

  /* ── input ── */
  const ACTIONS = {
    'open-task': openTask,
    'close-task': closeTask,
    back: closeTask,
    top: () => { if (S.sheet) closeTask(); else centerFocus(true) },
    process: () => { S.process = !S.process; renderSheet() },
    step: (id) => { S.step = S.step === id ? undefined : id; if (S.step !== 'tx') S.panel = undefined; renderPanel(); renderSheet() },
    tx: (id) => openTx(id),
    menu: () => { S.menu = !S.menu; renderPanel() },
    cat: (k) => { txById(S.panel).cat = k; S.menu = false; S.hint = undefined; renderPanel() },
    template: () => {
      const t = txById(S.panel)
      if (t.template) return
      t.template = true
      renderPanel()
      toast(`${icon('download', 'is-ok')}<span>Downloaded <b>Loan agreement template.docx</b></span>`, 2400)
    },
    receipt: attach,
    'rm-file': () => { const t = txById(S.panel); t.attached = false; renderPanel() },
    note: () => { S.noteOpen = true; renderPanel(); $('[data-note]', panel)?.focus() },
    unsure: () => { S.unsure = !S.unsure; renderPanel() },
    send: sendTx,
    answer,
    'send-hege': sendHege,
    info: (id, e) => showPop(e.target.closest('[data-act]'), id),
    locked: (_, e) => {
      const b = e.target.closest('[data-act]')
      b.classList.remove('is-shaking'); void b.offsetWidth; b.classList.add('is-shaking')
      toast(`${icon('lock')}<span>Shareholdings information opens in April.</span>`, 2400)
    },
  }
  desk.addEventListener('click', (e) => {
    if (e.target.closest('[data-dock]')) {
      const el = e.target.closest('[data-dock]')
      if (!reduced) { el.classList.remove('is-bouncing'); void el.offsetWidth; el.classList.add('is-bouncing'); setTimeout(() => el.classList.remove('is-bouncing'), 600) }
      return
    }
    const el = e.target.closest('[data-act]')
    if (!e.target.closest('.pop') && !(el && el.dataset.act === 'info')) closePop()
    if (S.menu && !e.target.closest('.menu, [data-act="menu"]')) { S.menu = false; renderPanel() }
    if (!el || el.disabled) return
    ACTIONS[el.dataset.act]?.(el.dataset.arg, e)
  })
  desk.addEventListener('input', (e) => {
    if (e.target.matches('[data-note]')) txById(S.panel).note = e.target.value
  })
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (layer.dataset.for) closePop()
    else if (S.menu) { S.menu = false; renderPanel() }
    else if (S.panel) { S.panel = undefined; renderPanel(); renderSheet() }
    else if (S.sheet) closeTask()
  })
  addEventListener('resize', () => { renderShift(); renderTicks(); closePop() })

  tick()
  setInterval(tick, 20000)
  renderTimeline()
  centerFocus(false)
  renderCoach()
  setPath()
  // The fonts change the heights: centre Today's focus again once they're in
  document.fonts?.ready.then(() => { if (!S.sheet) centerFocus(false) })
})()
