// 10.3.3 Try it: odds and the odds ratio.
// Two groups of patients as dots (teal came, red missed). The learner moves sliders or taps a dot to flip it,
// sees odds, chances, the odds ratio and its coefficient, makes random data, and solves small challenges the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TEAL = '#2dd4bf', RED = '#f87171';
  const START = [{ came: 75, missed: 25 }, { came: 90, missed: 10 }];
  const NAME = ['A: no reminder', 'B: one reminder'];
  let g = START.map(x => ({ ...x })), newCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 500' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sliders = [];
  function slider(k, key, color) {
    const out = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '8.5rem', color } });
    const inp = h('input', { type: 'range', min: 1, max: 100, step: 1, value: g[k][key], 'aria-label': `Group ${'AB'[k]}, ${key}`,
      style: { flex: '1 1 8rem', accentColor: color }, oninput: e => { g[k][key] = +e.target.value; draw(); } });
    sliders.push({ k, key, inp, out });
    return h('div', { class: 'sim-row', style: { alignItems: 'center', marginTop: '.4rem' } }, out, inp);
  }
  function newData() {
    for (const x of g) { const c = rnd(10, 95); x.came = c; x.missed = 100 - c; }
    newCount++; draw();
  }
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: odds and the odds ratio'),
    h('p', { class: 'sub' }, 'Each dot is a patient: teal came, red missed. Move the sliders, or tap a dot to flip it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        slider(0, 'came', TEAL), slider(0, 'missed', RED), slider(1, 'came', TEAL), slider(1, 'missed', RED),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Back to the clinic', () => { g = START.map(x => ({ ...x })); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const odds = x => x.came / x.missed, chance = x => x.came / (x.came + x.missed);
  const r2 = x => Math.round(x * 100) / 100, f2 = x => fmt(r2(x));
  const pct = x => fmt(Math.round(chance(x) * 1000) / 10);
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const chal = challenges(ch, [
    { text: 'Make the odds ratio exactly 2.',
      check: st => near(st.or, 2), why: 'Yes! Group B’s odds are twice group A’s, so the odds ratio is 2.' },
    { text: 'Make the chance in group B exactly 3 times the chance in group A. Is the odds ratio 3 too?',
      check: st => near(st.cr, 3), why: 'No: the odds ratio comes out bigger than 3. Tripling the chance is not tripling the odds.' },
    { text: 'Keep the odds ratio at exactly 3, but make the chance rise by less than 5 points.',
      check: st => near(st.or, 3) && st.pB > st.pA && (st.pB - st.pA) * 100 < 5,
      why: 'Right: when almost everyone already comes, tripling the odds barely moves the chance. Chances stop at 100%, odds have no ceiling.' },
    { text: 'Press “New data” twice. Does e to the power of the coefficient always give the odds ratio?',
      check: st => st.newCount >= 2, why: 'Always: the coefficient is the log of the odds ratio, and e to the power undoes the log.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, VH = 500, F = NARROW ? 1.25 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const GX = [VW / 4, VW * 3 / 4], TOPD = 50, BASE = 465, HB = 100, half = VW / 2;
  const txt = (x, y, str, fill, size = 14, anchor = 'middle', bold = true) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas', 'font-weight': bold ? 700 : 400 }, str);

  // tap a dot: a came patient becomes missed, a missed patient becomes came
  svg.addEventListener('pointerdown', e => {
    const t = e.target, j = t.getAttribute && t.getAttribute('data-g');
    if (j == null) return;
    const x = g[+j], i = +t.getAttribute('data-i');
    if (i < x.came) { if (x.came > 1 && x.missed < 100) { x.came--; x.missed++; } }
    else if (x.missed > 1 && x.came < 100) { x.missed--; x.came++; }
    draw();
  });

  function panel(k, x0, title, vals, labels, maxv, color, ceiling) {
    const bw = Math.min(48, half * 0.2), xs = [x0 + half * 0.3, x0 + half * 0.7], l0 = x0 + half * 0.12, l1 = x0 + half * 0.88;
    k.push(txt(x0 + half / 2, 335, title, color, 13),
      s('line', { x1: l0, x2: l1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    if (ceiling) k.push(s('line', { x1: l0, x2: l1, y1: BASE - HB, y2: BASE - HB, stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
      txt(l1, BASE - HB - 6, '100%', C.violet, 11, 'end'));
    else k.push(s('line', { x1: l1, x2: l1, y1: BASE - 4, y2: BASE - HB - 8, stroke: color, 'stroke-width': 2 }),
      s('polygon', { points: `${l1 - 6},${BASE - HB - 4} ${l1 + 6},${BASE - HB - 4} ${l1},${BASE - HB - 16}`, fill: color }));
    vals.forEach((v, j) => {
      const hh = v / maxv * HB;
      k.push(s('rect', { x: xs[j] - bw / 2, y: BASE - hh, width: bw, height: hh, fill: color, 'fill-opacity': .82, rx: 2 }),
        txt(xs[j], BASE + 20, `${'AB'[j]} ${labels[j]}`, color, 13));
    });
  }

  function draw() {
    const k = [], n = g.map(x => x.came + x.missed);
    const rows = Math.max(...n.map(v => Math.ceil(v / 10)));
    const pitch = Math.min(NARROW ? 17 : 18, 200 / rows), r = pitch * 0.38;
    g.forEach((x, j) => {
      const left = GX[j] - 4.5 * pitch;
      k.push(txt(GX[j], 26, NAME[j], C.ink, 15));
      for (let i = 0; i < n[j]; i++)
        k.push(s('circle', { cx: left + (i % 10) * pitch, cy: TOPD + Math.floor(i / 10) * pitch, r, fill: i < x.came ? TEAL : RED,
          'data-g': j, 'data-i': i, style: 'cursor:pointer' }));
      k.push(txt(GX[j], 278, `odds = ${f2(odds(x))}`, C.amber, 15), txt(GX[j], 300, `chance = ${pct(x)}%`, C.violet, 15));
    });
    const oA = odds(g[0]), oB = odds(g[1]), pA = chance(g[0]), pB = chance(g[1]);
    panel(k, 0, 'chance (stops at 100%)', [pA * 100, pB * 100], [`${pct(g[0])}%`, `${pct(g[1])}%`], 100, TEAL, true);
    panel(k, half, 'odds (no ceiling)', [oA, oB], [f2(oA), f2(oB)], Math.max(oA, oB), C.amber, false);
    svg.replaceChildren(...k);

    const or = oB / oA, cr = pB / pA, coef = Math.log(or);
    fbox(box, [
      `A: odds = ${g[0].came} ÷ ${g[0].missed} = ${f2(oA)}`,
      `B: odds = ${g[1].came} ÷ ${g[1].missed} = ${f2(oB)}`,
      [`odds ratio   = ${f2(oB)} ÷ ${f2(oA)} = ${f2(or)}`, C.amber],
      [`chance ratio = ${pct(g[1])}% ÷ ${pct(g[0])}% = ${f2(cr)}`, C.violet],
      [`coefficient  = log of ${f2(or)} = ${f2(coef)}`, C.cyan],
      [`e^${f2(coef)} ≈ ${f2(or)}, back to the odds ratio`, C.green]]);
    note.textContent = near(or, 1) ? 'Same odds in both groups: the odds ratio is 1, so B is no different from A.'
      : Math.abs(or - cr) < 0.1 * cr ? 'Odds ratio and chance ratio are close here. That only happens when few patients come in both groups.'
      : `The odds changed × ${f2(or)}, the chance only × ${f2(cr)}. Chances stop at 100%, odds have no ceiling.`;
    sliders.forEach(sl => { sl.inp.value = g[sl.k][sl.key]; sl.out.textContent = `${'AB'[sl.k]} ${sl.key}: ${g[sl.k][sl.key]}`; });
    chal.update({ or, cr, pA, pB, newCount });
  }
  draw();
  return () => {};
}
