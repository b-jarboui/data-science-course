// 1.1.4 Try it: which comparisons make sense?
// The learner picks a column, taps two rows of the café notebook, and asks one of the four ladder questions.
// The sim answers, or explains why the question has no answer. "New orders" makes a fresh random morning.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const COLS = [
    { key: 'drink', name: 'Drink', scale: 'nominal', top: 1 },
    { key: 'size', name: 'Size', scale: 'ordinal', top: 2 },
    { key: 'price', name: 'Price ($)', scale: 'ratio', top: 4 },
  ];
  const QS = ['Same or different?', 'Which is more?', 'How much more?', 'How many times as much?'];
  const SIZES = ['small', 'medium', 'large'];
  const START = [['coffee', 'small', 3], ['tea', 'medium', 4], ['coffee', 'large', 5],
    ['juice', 'medium', 4], ['coffee', 'medium', 4], ['tea', 'small', 3]];
  const fresh = rows => rows.map(r => ({ drink: r[0], size: r[1], price: r[2] }));
  let data = fresh(START), col = 2, A = 2, B = 0, step = 2, typed = false, news = 0;
  const asked = {};   // `${col}:${step}` -> true once answered or refused

  const svg = s('svg', { viewBox: '0 0 700 330' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const colBtns = COLS.map((c, i) => btn(c.name, () => { col = i; ask(); }));
  const qBtns = QS.map((q, i) => btn(`${i + 1}. ${q}`, () => { step = i; ask(); }));
  const typedBtn = btn('Type sizes as 1, 2, 3: off', () => { typed = !typed; ask(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which comparisons make sense?'),
    h('p', { class: 'sub' }, 'Pick a column. Tap two rows to compare them. Then ask one of the four ladder questions.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...colBtns),
        h('div', { class: 'sim-row' }, ...qBtns),
        h('div', { class: 'sim-row' },
          typedBtn,
          btn('New orders (random)', () => { data = fresh(Array.from({ length: 6 }, randRow)); news++; ask(); }),
          btn('Start again', () => { data = fresh(START); col = 2; A = 2; B = 0; step = 2; typed = false; ask(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const pick = a => a[rnd(0, a.length - 1)];
  function randRow() { return [pick(['coffee', 'tea', 'juice']), pick(SIZES), rnd(2, 8)]; }

  const val = (r, c = col) => {
    const v = data[r][COLS[c].key];
    if (COLS[c].key === 'size' && typed) return SIZES.indexOf(v) + 1;
    return v;
  };
  const show = (r, c = col) => {
    const k = COLS[c].key, v = val(r, c);
    return k === 'price' ? `$${v}` : String(v);
  };

  // the answer to the current question: {ok, lines, why}
  function answer() {
    const c = COLS[col], a = val(A), b = val(B), ra = `row ${A + 1}`, rb = `row ${B + 1}`;
    if (A === B) return { ok: false, short: 'Tap two different rows.', why: 'A comparison needs two values side by side.' };
    if (step === 0) return { ok: true, short: a === b ? `${show(A)} and ${show(B)}: the same` : `${show(A)} and ${show(B)}: different` };
    if (step > c.top - 1) {
      if (c.key === 'drink') return { ok: false, short: 'No answer.', why: 'Drinks are names only. They have no order of their own, so step 1 is as high as they go.' };
      if (c.key === 'size') return { ok: false, short: 'No answer.', why: typed
        ? 'The numbers 1, 2, 3 only mark positions in the order. Typing a size as a number does not change its scale: it still stops at step 2.'
        : step === 2 ? 'The size column does not say how big the gaps are between small, medium and large.'
          : 'The size column only ranks sizes, so it cannot say "twice". It stops at step 2.' };
    }
    if (c.key === 'size') {
      const ia = SIZES.indexOf(data[A].size), ib = SIZES.indexOf(data[B].size);
      return { ok: true, short: ia === ib ? `${show(A)} and ${show(B)}: the same size` : `${ia > ib ? show(A) : show(B)} is more than ${ia > ib ? show(B) : show(A)}` };
    }
    // price
    const hi = Math.max(a, b), lo = Math.min(a, b);
    if (step === 1) return { ok: true, short: a === b ? 'Same price.' : `$${hi} is more than $${lo}` };
    if (step === 2) return { ok: true, short: `${hi} − ${lo} = ${hi - lo} dollars more` };
    const r = hi / lo;
    return { ok: true, short: Number.isInteger(r) ? `$${hi} is exactly ${r === 2 ? 'twice' : r + ' times'} $${lo}` : `$${hi} is about ${fmt(Math.round(r * 100) / 100)} times $${lo}`,
      why: 'Zero dollars means free, so "how many times" has one fixed answer.' };
  }

  let last = null;
  function ask() { last = answer(); asked[`${col}:${step}`] = last.ok ? 'yes' : 'no'; draw(); }

  const chal = challenges(ch, [
    { text: 'Pick Drink, tap two coffees, and ask step 1.',
      check: st => st.col === 0 && st.step === 0 && st.same && st.ok,
      why: 'Same. For drinks, "same or different?" is the only question with an answer.' },
    { text: 'Pick Size. Find the highest step that still gets an answer.',
      check: st => st.asked['1:1'] === 'yes' && st.asked['1:2'] === 'no',
      why: 'Step 2. Sizes can be ranked, but the column does not say how big the gaps are: an ordinal scale.' },
    { text: 'The trap: turn on “Type sizes as 1, 2, 3”, tap a large and a small, and ask step 4.',
      check: st => st.typed && st.col === 1 && st.step === 3 && st.largeSmall,
      why: 'Still no answer. The numbers only mark positions in the order; they do not make a large three times a small.' },
    { text: 'Press “New orders” until two prices are exactly twice each other. Tap them and ask step 4.',
      check: st => st.col === 2 && st.step === 3 && st.twice,
      why: 'Price has a true zero, so "twice as much" makes sense: a ratio scale.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 900;   // the drawing card is narrow here: stack the ladder under the table
  const VW = NARROW ? 400 : 700, VH = NARROW ? 512 : 330, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const TX = 8, TW = NARROW ? VW - 16 : 400, RH = 38 * (NARROW ? 1.05 : 1), TY = 8;
  const CW = [0.13, 0.31, 0.3, 0.26].map(f => f * TW);
  const cx = i => TX + CW.slice(0, i).reduce((p, q) => p + q, 0) + CW[i] / 2;
  const LX = NARROW ? 8 : 430, LY = NARROW ? TY + 7 * RH + 24 : 20, LW = NARROW ? VW - 16 : 262;

  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    if (q.x < TX || q.x > TX + TW) return;
    const r = Math.floor((q.y - TY) / RH) - 1;
    if (r < 0 || r > 5) return;
    if (r !== A && r !== B) { B = A; A = r; } else if (r === B) { B = A; A = r; }
    ask();
  });

  function draw() {
    const c = COLS[col], k = [];
    k.push(s('rect', { x: TX, y: TY, width: TW, height: 7 * RH, rx: 12, fill: C.card, stroke: C.line }),
      s('rect', { x: TX, y: TY, width: TW, height: RH, rx: 12, fill: C.cyan, 'fill-opacity': .14 }));
    ['#', 'Drink', 'Size', 'Price ($)'].forEach((t, i) => k.push(s('text', { x: cx(i), y: TY + RH * 0.65, fill: i - 1 === col ? C.amber : C.cyan,
      'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle' }, t)));
    // selected column band
    k.push(s('rect', { x: TX + CW.slice(0, col + 1).reduce((p, q) => p + q, 0) + 2, y: TY + 2, width: CW[col + 1] - 4, height: 7 * RH - 4,
      rx: 8, fill: 'none', stroke: C.amber, 'stroke-width': 2 }));
    data.forEach((d, r) => {
      const y = TY + RH * (r + 1), sel = r === A || r === B;
      if (sel) k.push(s('rect', { x: TX + 3, y: y + 3, width: TW - 6, height: RH - 6, rx: 8, fill: C.amber, 'fill-opacity': .14 }));
      const cells = [String(r + 1), d.drink, typed ? String(SIZES.indexOf(d.size) + 1) : d.size, String(d.price)];
      cells.forEach((t, i) => k.push(s('text', { x: cx(i), y: y + RH * 0.66, 'font-size': 15 * F, 'text-anchor': 'middle',
        'font-family': (i === 0 || i === 3 || (i === 2 && typed)) ? 'Consolas' : null,
        fill: i === 0 ? C.muted : (i - 1 === col && sel) ? C.amber : (i === 2 && typed) ? C.pink : C.ink, 'font-weight': sel ? 700 : 400 }, t)));
      if (sel) k.push(s('text', { x: TX + TW - 10, y: y + RH * 0.66, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end' }, r === A ? 'A' : 'B'));
    });
    // ladder: 4 rungs, step 1 at the bottom
    const rh = NARROW ? 34 : 50, gap = NARROW ? 10 : 18;
    k.push(s('text', { x: LX, y: LY + 6, fill: C.muted, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `${c.name.toUpperCase()}: ${c.scale.toUpperCase()} SCALE`));
    for (let i = 0; i < 4; i++) {
      const y = LY + 16 + (3 - i) * (rh + gap), reach = i < c.top, cur = i === step;
      const col2 = cur ? (last && last.ok ? C.green : C.pink) : reach ? C.cyan : C.line;
      k.push(s('rect', { x: LX, y, width: LW, height: rh, rx: 10, fill: cur ? col2 : C.card, 'fill-opacity': cur ? .18 : 1, stroke: col2, 'stroke-width': cur ? 2.5 : 1.5 }),
        s('text', { x: LX + 12, y: y + rh * 0.62, fill: reach ? C.ink : C.muted, 'font-size': 14 * F, 'font-weight': 650 }, `${i + 1}. ${QS[i]}`));
    }
    svg.replaceChildren(...k);

    const res = last || answer();
    fbox(box, [`column: ${c.name.toLowerCase()} (${c.scale})`, `A = ${show(A)}   B = ${show(B)}`, `step ${step + 1}: ${QS[step].toLowerCase()}`,
      [res.short, res.ok ? C.green : C.pink]]);
    note.textContent = res.why || (res.ok ? `${c.name} reaches step ${c.top}, so it can answer this.` : '');
    colBtns.forEach((b, i) => b.className = 'sim-btn ' + (i === col ? 'go' : ''));
    qBtns.forEach((b, i) => b.className = 'sim-btn ' + (i === step ? 'go' : ''));
    typedBtn.textContent = `Type sizes as 1, 2, 3: ${typed ? 'on' : 'off'}`;
    typedBtn.className = 'sim-btn ' + (typed ? 'go' : '');
    const pa = data[A].price, pb = data[B].price, sa = data[A].size, sb = data[B].size;
    chal.update({ col, step, typed, asked, ok: res.ok, same: A !== B && val(A) === val(B),
      largeSmall: (sa === 'large' && sb === 'small') || (sa === 'small' && sb === 'large'),
      twice: A !== B && (pa === 2 * pb || pb === 2 * pa), news });
  }
  ask();
  return () => {};
}
