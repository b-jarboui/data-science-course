// 21.2.5 Try it: answer correctness.
// Ten held-out cards. The learner flips answers, drags a card's date across the rule change on 1 March,
// switches between grading by each card's date and lazily by today's guide, and makes random sets.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const MONTHS = [['Feb', 28], ['Mar', 31], ['Apr', 30], ['May', 31]], DAYS = 120, MAR1 = 28;
  const TOPICS = ['HOURS', 'HOURS', 'HOURS', 'HOURS', 'HOURS', 'LOANS', 'LOANS', 'LOANS', 'ROOMS', 'ROOMS'];
  const TCOL = { HOURS: C.cyan, LOANS: C.pink, ROOMS: C.amber };
  const RIGHT = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];
  // card 1 asks about Sunday opening on 15 Feb (day 14); the assistant answers from today's guide: 10 AM
  const start = () => TOPICS.map((topic, k) => k === 0 ? { topic, sens: true, date: 14, ans: 'ten' } : { topic, sens: false, match: !!RIGHT[k] });
  let cards = start(), mode = 'date', sel = 0, c1moved = false;

  const svg = s('svg', { viewBox: '0 0 700 450' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const dateIn = h('input', { type: 'range', min: 0, max: DAYS - 1, step: 1, value: 14, style: { flex: '1 1 10rem' } });
  const dateLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const bDate = btn('Grade by the rule on each card’s date', () => { mode = 'date'; draw(); });
  const bToday = btn('Grade by today’s guide (lazy)', () => { mode = 'today'; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: grade by the rule of that day'),
    h('p', { class: 'sub' }, 'Ten held-out question cards. Tap a card to select it. Drag a dated card along the timeline, or use the slider, to change the day it was asked. The Sunday rule changes on 1 March.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, dateLabel, dateIn),
        h('div', { class: 'sim-row' }, btn('Change the answer', flip), bDate, bToday),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData),
          btn('Start again', () => { cards = start(); sel = 0; c1moved = false; mode = 'date'; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const lab = v => v === 'ten' ? '10 AM' : 'noon';
  const truth = (c, m) => m === 'today' || c.date >= MAR1 ? 'ten' : 'noon';
  const right = (c, m) => c.sens ? c.ans === truth(c, m) : c.match;
  const count = m => cards.filter(c => right(c, m)).length;
  function dayLabel(d) { let m = 0; while (d >= MONTHS[m][1]) { d -= MONTHS[m][1]; m++; } return `${d + 1} ${MONTHS[m][0]}`; }

  const chal = challenges(ch, [
    { text: 'Switch to “today’s guide”. Which card changes, and how does the score move?',
      check: st => st.mode === 'today' && st.pToday !== st.pDate,
      why: 'A card whose rule changed flips: its answer matches today’s guide, but not the rule on its date. The score moves without the assistant getting any better.' },
    { text: 'Grading by each card’s date, make answer correctness exactly 50%.',
      check: st => st.mode === 'date' && st.pDate === 50,
      why: 'Yes: 5 right answers out of 10 questions is 5 ÷ 10, which is 50 out of 100.' },
    { text: 'Drag card 1’s date so that its answer “10 AM” is truly right, graded on its date.',
      check: st => st.mode === 'date' && st.c1sens && st.c1moved && st.c1ans === 'ten' && st.c1date >= MAR1,
      why: 'From 1 March the rule says 10 AM, so a person asking then is really served by “10 AM”. Same answer, different date, different grade.' },
    { text: 'Find data where the lazy grade is LOWER than the fair grade. Try “New data” or change answers.',
      check: st => st.pToday < st.pDate,
      why: 'An answer of “noon” to a February question is right for that person, but today’s guide marks it wrong. Lazy grading can be off in both directions.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, fs1 = NARROW ? 13 : 15, fs2 = NARROW ? 11 : 13;
  const X0 = 24, X1 = VW - 24, TLY = 78, GY = 130, RH = 62, GW = (VW - 20) / 2;
  svg.setAttribute('viewBox', `0 0 ${VW} 450`);
  const dayX = d => X0 + (d + 0.5) / DAYS * (X1 - X0);

  function flip() { const c = cards[sel]; if (c.sens) c.ans = c.ans === 'ten' ? 'noon' : 'ten'; else c.match = !c.match; draw(); }
  function newData() {
    cards = TOPICS.map((topic, k) => (k === 0 || (k < 5 && Math.random() < 0.35))
      ? { topic, sens: true, date: rnd(0, DAYS - 1), ans: Math.random() < 0.75 ? 'ten' : 'noon' }
      : { topic, sens: false, match: Math.random() < 0.7 });
    sel = 0; c1moved = false; draw();
  }
  function setDate(d) {
    const c = cards[sel]; if (!c.sens) return;
    c.date = Math.max(0, Math.min(DAYS - 1, d));
    if (sel === 0) c1moved = true;
    draw();
  }
  dateIn.addEventListener('input', () => setDate(+dateIn.value));

  // tap a card to select it; drag a date marker along the timeline
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < GY - 10) {
      let best = -1, bd = 28;
      cards.forEach((c, i) => { if (c.sens && Math.abs(dayX(c.date) - p.x) < bd) { bd = Math.abs(dayX(c.date) - p.x); best = i; } });
      if (best < 0 && cards[sel].sens) best = sel;
      if (best < 0) return;
      sel = best; dragging = true; svg.setPointerCapture(e.pointerId); move(e);
      return;
    }
    const col = p.x < 10 + GW ? 0 : 1, row = Math.floor((p.y - GY) / RH);
    if (row >= 0 && row < 5) { sel = col * 5 + row; draw(); }
  });
  const move = e => { if (dragging) setDate(Math.round((toSvg(e).x - X0) / (X1 - X0) * DAYS - 0.5)); };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function draw() {
    const k = [], xb = dayX(MAR1 - 0.5), mono = 'Consolas';
    // timeline: the Sunday rule before and after 1 March
    k.push(s('text', { x: X0, y: 18, fill: C.muted, 'font-size': 12, 'font-family': mono }, 'Sunday opening rule'),
      s('line', { x1: X0, x2: xb, y1: TLY, y2: TLY, stroke: C.green, 'stroke-width': 4 }),
      s('line', { x1: xb, x2: X1, y1: TLY, y2: TLY, stroke: C.violet, 'stroke-width': 4 }),
      s('line', { x1: xb, x2: xb, y1: TLY - 14, y2: TLY + 14, stroke: C.ink, 'stroke-width': 2 }),
      s('text', { x: (X0 + xb) / 2, y: TLY - 30, fill: C.green, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, NARROW ? 'noon' : 'opens at noon'),
      s('text', { x: (xb + X1) / 2, y: TLY - 30, fill: C.violet, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, NARROW ? 'from 1 Mar: 10 AM' : 'from 1 March: opens at 10 AM'),
      s('text', { x: X1, y: TLY + 42, fill: C.violet, 'font-size': 12, 'text-anchor': 'end', 'font-family': mono }, 'today →'));
    let d0 = 0;
    for (const [m, n] of MONTHS) {
      k.push(s('text', { x: dayX(d0 + n / 2), y: TLY + 22, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': mono }, m));
      d0 += n;
    }
    cards.forEach((c, i) => {
      if (!c.sens) return;
      const x = dayX(c.date);
      k.push(s('circle', { cx: x, cy: TLY, r: i === sel ? 9 : 6, fill: C.amber, stroke: i === sel ? C.ink : 'none', 'stroke-width': 2 }),
        s('text', { x, y: TLY - 12, fill: C.amber, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, `Q${i + 1}`));
    });
    // the ten cards
    cards.forEach((c, i) => {
      const x = 10 + Math.floor(i / 5) * GW + 4, y = GY + (i % 5) * RH, w = GW - 8, ok = right(c, mode);
      const line2 = c.sens ? `${mode === 'date' ? 'agreed' : 'guide'} ${lab(truth(c, mode))} · said ${lab(c.ans)}`
        : c.match ? 'said = agreed answer' : 'said ≠ agreed answer';
      k.push(s('rect', { x, y, width: w, height: 54, rx: 9, fill: C.card, stroke: i === sel ? C.ink : '#344264', 'stroke-width': i === sel ? 2.5 : 1 }),
        s('rect', { x: x + 5, y: y + 6, width: 5, height: 42, rx: 2.5, fill: TCOL[c.topic] }),
        s('text', { x: x + 18, y: y + 22, 'font-size': fs1, 'font-family': mono },
          s('tspan', { fill: C.ink, 'font-weight': 700 }, `Q${i + 1} `),
          s('tspan', { fill: TCOL[c.topic] }, c.topic),
          c.sens ? s('tspan', { fill: C.amber }, ` · ${dayLabel(c.date)}`) : null),
        s('text', { x: x + 18, y: y + 43, fill: '#b2bdd9', 'font-size': fs2, 'font-family': mono }, line2),
        s('text', { x: x + w - 18, y: y + 37, fill: ok ? C.green : C.pink, 'font-size': 24, 'font-weight': 700, 'text-anchor': 'middle' }, ok ? '✓' : '✗'));
    });
    svg.replaceChildren(...k);

    const r = count(mode), other = mode === 'date' ? 'today' : 'date', r2 = count(other);
    fbox(box, [mode === 'date' ? 'graded by: the rule on each card’s date' : 'graded by: today’s guide (lazy)',
      `right answers = ${r}`, 'questions     = 10',
      [`correctness   = ${r} ÷ 10 = ${r * 10}%`, C.amber],
      [`${other === 'date' ? 'by each card’s date' : 'lazy, today’s guide'}: ${r2} ÷ 10 = ${r2 * 10}%`, C.muted]]);

    const c = cards[sel];
    if (c.sens) {
      const fair = right(c, 'date');
      note.textContent = `Card ${sel + 1} was asked on ${dayLabel(c.date)}. The rule in force then: Sunday opens at ${lab(truth(c, 'date'))}. The assistant said ${lab(c.ans)}`
        + (mode === 'date' ? (fair ? ', so it is right.' : ', so it is wrong.')
          : `. Today’s guide says 10 AM, so the lazy grade calls it ${ok(c) ? 'right' : 'wrong'}` + (ok(c) !== fair ? ', which is not true for that person.' : '.'));
    } else {
      note.textContent = `Card ${sel + 1}: the assistant’s answer ${c.match ? 'says the same thing as' : 'does not match'} the agreed answer. Its rule never changed, so its date does not matter. Tap “Change the answer” to flip it.`;
    }
    dateIn.disabled = !c.sens;
    if (c.sens) dateIn.value = c.date;
    dateLabel.textContent = c.sens ? `Card ${sel + 1} asked on ${dayLabel(c.date)}` : `Card ${sel + 1}: no date needed`;
    bDate.className = 'sim-btn' + (mode === 'date' ? ' go' : '');
    bToday.className = 'sim-btn' + (mode === 'today' ? ' go' : '');
    chal.update({ mode, pDate: count('date') * 10, pToday: count('today') * 10,
      c1sens: cards[0].sens, c1ans: cards[0].ans, c1date: cards[0].date, c1moved });
  }
  const ok = c => right(c, mode);
  draw();
  return () => { dragging = false; };
}
