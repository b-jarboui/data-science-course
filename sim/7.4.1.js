// 7.4.1 Try it: the design picks the test.
// The learner answers the three design questions (kind of answer, number of groups, paired or not),
// drags cookies along the grams line (or drags the cracked counts), makes random data,
// and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const SHIFTS = ['Morning', 'Afternoon', 'Night', 'Weekend'], COL = [C.amber, C.green, C.violet, C.pink];
  const LET = ['A', 'B', 'C'], PC = [C.violet, C.green, C.pink];
  const START = { w: [[29, 30, 31], [28, 30, 32], [26, 30, 34], [27, 30, 33]], hot: [40, 30, 20], cool: [39, 29, 19], cracked: [8, 12, 20, 10] };
  const TESTS = { anova: 'one-way ANOVA', welch: 'Welch’s t-test', paired: 'paired t-test', chi: 'chi-square test' };
  const copy = o => JSON.parse(JSON.stringify(o));
  let d = copy(START), kind = 'number', groups = 3, paired = false, strangers = false, drag = null, hits = [];

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const lab = t => h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 650 } }, t);
  const opts = [];
  const opt = (label, on, pick, off) => { const o = { on, off, b: btn(label, () => { pick(); if (!paired) strangers = false; draw(); }) }; opts.push(o); return o.b; };
  const strBtn = btn('Mix them up as strangers', () => { if (paired) { strangers = !strangers; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the design picks the test'),
    h('p', { class: 'sub' }, 'Answer the three design questions with the buttons. The picture and the chosen test change at once. Drag a cookie along the grams line, or drag a bar to change how many cookies are cracked.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, lab('1 · Each cookie gives'),
          opt('A number (weight)', () => kind === 'number', () => { kind = 'number'; }),
          opt('A category (cracked?)', () => kind === 'category', () => { kind = 'category'; paired = false; })),
        h('div', { class: 'sim-row' }, lab('2 · How many shifts?'),
          ...[2, 3, 4].map(n => opt(`${n} shifts`, () => !paired && groups === n, () => { groups = n; }, () => paired))),
        h('div', { class: 'sim-row' }, lab('3 · Readings'),
          opt('Weighed once (separate)', () => !paired, () => { paired = false; }),
          opt('Same cookies hot, then cool (paired)', () => paired, () => { paired = true; kind = 'number'; })),
        h('div', { class: 'sim-row' }, strBtn,
          btn('New data (random)', newData),
          btn('Start again', () => { d = copy(START); kind = 'number'; groups = 3; paired = false; strangers = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const avg = v => v.reduce((a, b) => a + b, 0) / v.length;
  const spread = v => Math.max(...v) - Math.min(...v);
  const r1 = x => Math.round(x * 10) / 10;
  const shown = () => groups === 2 ? [0, 2] : groups === 3 ? [0, 1, 2] : [0, 1, 2, 3];
  const testId = () => kind === 'category' ? 'chi' : paired ? 'paired' : groups === 2 ? 'welch' : 'anova';

  const chal = challenges(ch, [
    { text: 'Change one design answer so that the sim picks Welch’s t-test.',
      check: st => st.test === 'welch', why: 'Right: a number and two separate groups lead to Welch’s t-test. It compares two averages and does not need similar spreads.' },
    { text: 'Find a design that leads to the chi-square test.',
      check: st => st.test === 'chi', why: 'Yes: when each answer is a label like cracked or whole, you count per shift, and chi-square asks whether cracking depends on the shift.' },
    { text: 'Choose paired readings, then drag a cool dot so that one cookie loses exactly 2 grams.',
      check: st => st.paired && st.changes.includes(2), why: 'Good: the paired t-test works with each cookie’s own change, hot weight minus cool weight.' },
    { text: 'With every cookie losing exactly 1 gram (“Start again” gives that), choose paired readings and press “Mix them up as strangers”. Can you still see the loss?',
      check: st => st.paired && st.strangers && st.changes.every(c => c === 1) && Math.min(st.hotSpread, st.coolSpread) >= 10,
      why: 'That is the trap: each cookie clearly lost 1 gram, but as strangers the wide spread between cookies hides it.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 30, X1 = VW - 24, AX = 392, LO = 15, HI = 45;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const gx = g => X0 + (g - LO) / (HI - LO) * (X1 - X0);
  const xg = x => Math.max(LO, Math.min(HI, Math.round(LO + (x - X0) / (X1 - X0) * (HI - LO))));
  const laneY = r => 72 + r * (groups === 2 ? 150 : groups === 3 ? 105 : 80);
  const tx = (x, y, str, fill, size = 13, anchor = 'middle', bold = true) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': bold ? 700 : 400, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, str);

  function newData() {
    d.w = d.w.map(() => { const c = rnd(26, 34), sp = rnd(1, 5); return [0, 1, 2].map(() => Math.max(LO, Math.min(HI, c + rnd(-sp, sp)))); });
    d.hot = [0, 1, 2].map(() => rnd(18, 44));
    d.cool = d.hot.map(v => Math.max(LO, v - rnd(0, 3)));
    d.cracked = d.cracked.map(() => rnd(2, 40));
    draw();
  }

  // drag a dot sideways (grams) or a bar up and down (cracked count)
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = null, bd = 30;
    for (const t of hits) {
      const dd = t.bar ? (Math.abs(p.x - t.x) < t.w / 2 ? 0 : 99) : Math.hypot(p.x - t.x, p.y - t.y);
      if (dd < bd) { bd = dd; best = t; }
    }
    if (!best) return;
    drag = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => { if (!drag) return; drag.set(toSvg(e)); draw(); };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });

  function draw() {
    const k = [], add = (...e) => k.push(...e);
    hits = [];
    const dot = (x, y, c, label, ly, set) => {
      add(s('circle', { cx: x, cy: y, r: 17, fill: c, 'fill-opacity': .18 }), s('circle', { cx: x, cy: y, r: 8, fill: c }), tx(x, ly, label, c));
      hits.push({ x, y, set });
    };
    if (kind === 'number') {
      add(s('line', { x1: X0, x2: X1, y1: AX, y2: AX, stroke: C.muted, 'stroke-width': 2 }), tx(X1, AX + 40, 'grams', C.muted, 12, 'end', false));
      for (let g = LO; g <= HI; g += 5) add(s('line', { x1: gx(g), x2: gx(g), y1: AX - 5, y2: AX + 5, stroke: C.muted }), tx(gx(g), AX + 22, g, C.muted, 13, 'middle', false));
      if (!paired) shown().forEach((i, r) => {
        const y = laneY(r), w = d.w[i], c = COL[i], m = avg(w), a = Math.min(...w), b = Math.max(...w);
        add(tx(X0, y - 26, SHIFTS[i].toUpperCase(), c, 13, 'start'),
          s('line', { x1: gx(m), x2: gx(m), y1: y - 32, y2: y - 16, stroke: c, 'stroke-width': 3 }),
          s('line', { x1: gx(a), x2: gx(b), y1: y + 42, y2: y + 42, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }),
          gx(b) < X1 - 50 ? tx(gx(b) + 10, y + 46, `${b - a} g`, c, 12, 'start') : tx(gx(a) - 10, y + 46, `${b - a} g`, c, 12, 'end'));
        w.forEach((g, j) => dot(gx(g), y, c, g, y + 28, p => { d.w[i][j] = xg(p.x); }));
      });
      else {
        const HY = 130, CY = 290;
        add(tx(X0, HY - 74, 'HOT', C.amber, 13, 'start'), tx(X0, CY + 80, 'COOL', C.cyan, 13, 'start'));
        d.hot.forEach((hv, j) => {
          const cv = d.cool[j], hx = gx(hv), cx = gx(cv), chg = hv - cv;
          if (!strangers) add(s('line', { x1: hx, y1: HY + 12, x2: cx, y2: CY - 12, stroke: PC[j], 'stroke-width': 2, opacity: .8 }),
            tx((hx + cx) / 2 + 8, (HY + CY) / 2 + 4 + (j - 1) * 18, chg > 0 ? `−${chg} g` : chg < 0 ? `+${-chg} g` : '0 g', PC[j], 12, 'start'));
          dot(hx, HY, strangers ? C.amber : PC[j], `${LET[j]} ${hv}`, HY - 26, p => { d.hot[j] = xg(p.x); });
          dot(cx, CY, strangers ? C.cyan : PC[j], `${LET[j]} ${cv}`, CY + 32, p => { d.cool[j] = xg(p.x); });
        });
        if (strangers) [[d.hot, HY - 50, C.amber], [d.cool, CY + 54, C.cyan]].forEach(([v, y, c]) => {
          const a = Math.min(...v), b = Math.max(...v);
          add(s('line', { x1: gx(a), x2: gx(b), y1: y, y2: y, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }),
            gx(b) < X1 - 90 ? tx(gx(b) + 10, y + 4, `spread ${b - a} g`, c, 12, 'start') : tx(gx(a) - 10, y + 4, `spread ${b - a} g`, c, 12, 'end'));
        });
      }
    } else {
      const BASE = 372, TOPB = 64, u = (BASE - TOPB) / 100, sh = shown(), sl = (X1 - X0) / sh.length, bw = Math.min(96, sl * 0.55);
      sh.forEach((i, r) => {
        const cx = X0 + sl * (r + 0.5), n = d.cracked[i], yb = BASE - n * u;
        add(s('rect', { x: cx - bw / 2, y: TOPB, width: bw, height: yb - TOPB, fill: COL[i], 'fill-opacity': .22, stroke: COL[i], rx: 4 }),
          s('rect', { x: cx - bw / 2, y: yb, width: bw, height: n * u, fill: C.pink, 'fill-opacity': .85, rx: 4 }),
          s('line', { x1: cx - bw / 2 - 6, x2: cx + bw / 2 + 6, y1: yb, y2: yb, stroke: C.ink, 'stroke-width': 3 }),
          tx(cx, TOPB + 20, `${100 - n} whole`, C.ink, 12),
          tx(cx, Math.max(TOPB + 44, yb - 8), `${n} cracked`, C.pink, 12),
          tx(cx, BASE + 24, SHIFTS[i], COL[i], sh.length > 3 ? 12 : 13));
        hits.push({ bar: true, x: cx, w: sl, set: p => { d.cracked[i] = Math.max(0, Math.min(100, Math.round((BASE - p.y) / u))); } });
      });
    }
    svg.replaceChildren(...k);

    const t = testId(), lines = [
      `answer: ${kind === 'number' ? 'a number (weight)' : 'a category (cracked?)'}`,
      `groups: ${paired ? '2 conditions (hot, cool)' : `${shown().length} shifts`}`,
      `paired: ${paired ? 'yes, same cookies' : 'no (independent)'}`,
      [`→ ${TESTS[t]}`, C.amber], ' '];
    if (kind === 'category') shown().forEach(i => lines.push(`${SHIFTS[i].padEnd(9)} ${d.cracked[i]} cracked · ${100 - d.cracked[i]} whole`));
    else if (!paired) shown().forEach(i => lines.push(`${SHIFTS[i].padEnd(9)} mean ${fmt(r1(avg(d.w[i])))} · spread ${spread(d.w[i])} g`));
    else {
      d.hot.forEach((hv, j) => lines.push(`${LET[j]}: ${hv} − ${d.cool[j]} = ${hv - d.cool[j]} g`));
      if (strangers) lines.push([`spread: hot ${spread(d.hot)} g · cool ${spread(d.cool)} g`, C.pink]);
    }
    fbox(box, lines);
    note.textContent = {
      anova: 'One-way ANOVA compares the group averages against the spread inside each group. The short line above each lane is its mean; the bar below is its spread.',
      welch: 'Welch’s t-test compares two averages and does not need similar spreads.',
      paired: strangers ? 'As strangers, the wide spread between cookies hides each cookie’s small change. That is the trap.'
        : 'The paired t-test looks at each cookie’s own change: hot weight minus cool weight.',
      chi: 'Each shift has 100 cookies. Chi-square asks: does cracking depend on the shift?'
    }[t];

    opts.forEach(o => { const on = o.on(); o.b.className = 'sim-btn ' + (on ? 'go' : ''); o.b.setAttribute('aria-pressed', on); o.b.disabled = !!(o.off && o.off()); });
    strBtn.textContent = strangers ? 'Link each cookie again' : 'Mix them up as strangers';
    strBtn.disabled = !paired;
    const changes = d.hot.map((hv, j) => hv - d.cool[j]);
    chal.update({ test: t, paired, strangers, changes, hotSpread: spread(d.hot), coolSpread: spread(d.cool) });
  }
  draw();
  return () => { drag = null; };
}
