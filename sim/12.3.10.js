// 12.3.10 Try it: regularization, a fee for big weights.
// The learner turns three weight dials and the penalty weight, sees the misses, the training error, the penalty
// and the total live, lets training turn the dials (Step / Play), checks next month's bikes, makes new random
// shops, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  // rescaled inputs [age, mileage, stickers] = (age − 3.5) ÷ 2, (mileage − 7) ÷ 4, (stickers − 2.5) ÷ 2, prices ($100s).
  // Old bikes: stickers 2, 4, 3, 1, 0, 5; rule A's training error ≈ 1.9, rule B's 2. Next month's bikes: stickers
  // 0, 5, 3, 7, 7, 0; rule A's error ≈ 4, rule B's 2.5 (chapters/12.3.md).
  const START = {
    old: { z: [[-1.25, -1.25, -0.25], [-0.75, -0.75, 0.75], [-0.25, -0.25, 0.25], [0.25, 0.25, -0.75], [0.75, 0.75, -1.25], [1.25, 1.25, 1.25]], y: [10, 6, 8, 7, 3, 5] },
    next: { z: [[-1.25, -1.25, -1.25], [-0.75, -0.75, 1.25], [-0.25, -0.25, 0.25], [0.25, 0.25, 2.25], [0.75, 0.75, 2.25], [1.25, 1.25, -1.25]], y: [10, 6, 8, 4, 4, 6] } };
  const RULE_A = [-3, 1, 0.3], RULE_B = [-1, -1, 0];
  let data = START, base = 6.5, w = RULE_A.slice(), lam = 0.5, lr = 0.1, speed = 5;
  let it = 0, curve = [], last = null, view = 'old', playing = false, anim = 0, acc = 0, prev = 0;
  let seenA0 = false, seenB0 = false, newData = 0, itZeroNew = 0, itPenNew = 0;

  const r2 = x => Math.round(x * 100) / 100;
  const sg = x => { const v = r2(x); return v > 0 ? '+' + fmt(v) : v < 0 ? '−' + fmt(-v) : '0'; };
  const guess = z => base + w[0] * z[0] + w[1] * z[1] + w[2] * z[2];
  const err = set => set.y.reduce((a, y, i) => a + (y - guess(set.z[i])) ** 2, 0) / set.y.length;
  const size = () => w.reduce((a, v) => a + v * v, 0);
  const total = () => err(data.old) + lam * size();
  const near = (a, b) => a.every((v, k) => Math.abs(v - b[k]) < 1e-9);

  // a fresh shop: wear lowers the price (the real pattern), stickers are pure luck
  function makeShop() {
    const bike = age => {
      const a = (age - 3.5) / 2, m = a + rnd(-2, 2) / 8, st = rnd(-4, 4) / 2;
      return { z: [a, m, st], y: Math.max(0.5, 6.5 - a - m + rnd(-4, 4) / 2) };
    };
    const pack = list => ({ z: list.map(b => b.z), y: list.map(b => b.y) });
    return { old: pack([1, 2, 3, 4, 5, 6].map(bike)), next: pack(Array.from({ length: 6 }, () => bike(rnd(1, 6)))) };
  }

  // one training step: turn every dial a little downhill on the total
  function step() {
    const n = data.old.y.length, g = [0, 0, 0], before = w.slice(), t0 = total();
    data.old.z.forEach((z, i) => { const miss = data.old.y[i] - guess(z); z.forEach((v, k) => { g[k] -= 2 * miss * v / n; }); });
    const change = g.map((v, k) => -lr * (v + 2 * lam * w[k]));
    w = w.map((v, k) => Math.max(-50, Math.min(50, v + change[k])));
    it++;
    if (curve.length < 2000) curve.push(total());
    if (data !== START) { if (lam === 0) itZeroNew++; else if (lam >= 0.3) itPenNew++; }
    last = { before, change, t0, t1: total(), after: w.slice() };
  }
  function loop(now) {
    if (!playing) return;
    acc += Math.min(0.25, (now - prev) / 1000) * speed; prev = now;
    let n = 0;
    while (acc >= 1 && n < 40) { step(); acc -= 1; n++; }
    if (n) draw();
    if (w.some(v => Math.abs(v) >= 50) || it >= 5000) setPlaying(false);
    else anim = requestAnimationFrame(loop);
  }
  function setPlaying(on) {
    playing = on; playBtn.textContent = on ? 'Pause' : 'Play';
    cancelAnimationFrame(anim);
    if (on) { prev = performance.now(); acc = 1; anim = requestAnimationFrame(loop); }
  }
  function restart() { last = null; it = 0; curve = [total()]; draw(); }
  function manual() { setPlaying(false); restart(); }

  function slider(label, min, max, stepv, get, set, color, show) {
    const out = h('b', { style: { color, font: '700 1rem Consolas, monospace', minWidth: '3.6rem', textAlign: 'right' } });
    const input = h('input', { type: 'range', min, max, step: stepv, 'aria-label': label,
      style: { flex: '1 1 9rem', accentColor: color, minHeight: '44px' }, oninput: e => set(+e.target.value) });
    return { row: h('label', { class: 'sim-row', style: { marginTop: '.3rem' } }, h('span', { style: { flex: '0 0 9rem' } }, label), input, out),
      sync() { input.value = get(); out.textContent = show(get()); } };
  }
  const wS = ['Age weight', 'Mileage weight', 'Sticker weight'].map((n, k) =>
    slider(n, -3, 3, 0.1, () => w[k], v => { w[k] = v; manual(); }, C.amber, sg));
  const lamS = slider('Penalty weight λ', 0, 2, 0.05, () => lam, v => { lam = v; manual(); }, C.violet, v => fmt(r2(v)));
  const lrS = slider('Learning rate', 0.01, 0.5, 0.01, () => lr, v => { lr = v; draw(); }, C.green, v => fmt(r2(v)));
  const spS = slider('Speed (steps/s)', 1, 30, 1, () => speed, v => { speed = v; draw(); }, C.cyan, v => fmt(v));

  const svg = s('svg', { viewBox: '0 0 700 400' }), cv = s('svg', { viewBox: '0 0 700 160' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('Play', () => setPlaying(!playing));
  const viewBtn = btn('Show next month’s bikes', () => {
    view = view === 'old' ? 'next' : 'old';
    viewBtn.textContent = view === 'old' ? 'Show next month’s bikes' : 'Show the old bikes';
    draw();
  });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: a fee for big weights'),
    h('p', { class: 'sub' }, 'Turn the three weight dials and the penalty weight. The misses, the training error, the penalty and the total update live. Press Step or Play to let training turn the dials for you.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Rule A (−2, −2, +1)', () => { w = RULE_A.slice(); manual(); }),
          btn('Rule B (−1, −1, 0)', () => { w = RULE_B.slice(); manual(); }), viewBtn),
        ...wS.map(x => x.row), lamS.row,
        cv,
        h('div', { class: 'sim-row' },
          btn('Step', () => { setPlaying(false); step(); draw(); }, 'go'), playBtn,
          btn('Reset (rule A start)', () => { setPlaying(false); w = RULE_A.slice(); restart(); }),
          btn('Random start', () => { w = w.map(() => rnd(-30, 30) / 10); manual(); }),
          btn('New data', () => { data = makeShop(); base = data.old.y.reduce((a, b) => a + b, 0) / 6; newData++; itZeroNew = itPenNew = 0; manual(); }),
          btn('The shop’s own bikes', () => { data = START; base = 6.5; manual(); })),
        lrS.row, spS.row),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Keep the penalty weight at 0.5 and find dials with a total below 7, rule A’s score.',
      check: st => st.start && st.lam === 0.5 && st.tot < 6.9,
      why: 'Yes! Smaller dials pay a much smaller fee, so the total drops even if the training error rises a little.' },
    { text: 'Set the penalty weight to 0. Predict which rule wins now, then press Rule A and Rule B to check.',
      check: st => st.seenA0 && st.seenB0,
      why: 'Rule A wins, 1.9 against 2: with no fee, the closest fit to the old bikes always wins, even when it fits luck.' },
    { text: 'Press Reset, keep the penalty weight at 0.5, then press Play. Will training end below rule B’s total of 3? Predict first.',
      check: st => st.start && st.lam === 0.5 && st.it >= 15 && st.tot < 3,
      why: 'Yes: each step turns the dials a little downhill, and the total settles below 3. Now try a learning rate of 0.4 and watch it jump.' },
    { text: 'Press New data. Train with the penalty weight at 0, then at 0.5. Which gives the lower error on next month’s bikes?',
      check: st => st.newData > 0 && st.itZeroNew >= 15 && st.itPenNew >= 15,
      why: 'On most new shops the penalty wins on next month’s bikes. Not on every single draw, which is why you always score on bikes the rule never trained on.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600, F = NARROW ? 1.25 : 1;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 560 : 400, CW = NARROW ? 400 : 700, CHH = NARROW ? 190 : 160;
  const CH = NARROW ? { x0: 40, x1: 390, y0: 40, y1: 290 } : { x0: 46, x1: 440, y0: 40, y1: 360 };
  const BR = NARROW ? { x0: 20, x1: 390, y0: 360, y1: 510 } : { x0: 460, x1: 690, y0: 60, y1: 340 };
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  cv.setAttribute('viewBox', `0 0 ${CW} ${CHH}`);
  const PMAX = 14, py = p => CH.y1 - Math.max(-1, Math.min(PMAX + 1, p)) / PMAX * (CH.y1 - CH.y0);
  const text = (x, y, t, fill, size = 13, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': weight }, t);

  function draw() {
    const set = view === 'old' ? data.old : data.next, n = set.y.length, sl = (CH.x1 - CH.x0) / n;
    const te = err(data.old), sz = size(), pen = lam * sz, tot = te + pen, te2 = err(data.next);
    if (data === START && lam === 0) { if (near(w, RULE_A)) seenA0 = true; if (near(w, RULE_B)) seenB0 = true; }

    // the picture: real prices (dots), guesses (amber bars), misses (pink lines)
    const k = [text(CH.x0, 22, view === 'old' ? 'OLD BIKES: training learns from these' : 'NEXT MONTH: bikes the rule never saw',
      view === 'old' ? C.cyan : C.pink, 14, 'start', 700)];
    for (let g = 0; g <= PMAX; g += 2) {
      k.push(s('line', { x1: CH.x0, x2: CH.x1, y1: py(g), y2: py(g), stroke: C.line }), text(CH.x0 - 8, py(g) + 4, g, C.muted, 12, 'end'));
    }
    set.y.forEach((y, i) => {
      const cx = CH.x0 + sl * (i + 0.5), g = guess(set.z[i]);
      k.push(s('line', { x1: cx, x2: cx, y1: py(g), y2: py(y), stroke: C.pink, 'stroke-width': 3 }),
        s('line', { x1: cx - 16, x2: cx + 16, y1: py(g), y2: py(g), stroke: C.amber, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        s('circle', { cx, cy: py(y), r: 13, fill: C.cyan, 'fill-opacity': .18 }),
        s('circle', { cx, cy: py(y), r: 6.5, fill: C.cyan }),
        text(cx + 10, (py(g) + py(y)) / 2 + 4, sg(y - g), C.pink, 12, 'start', 700),
        text(cx, CH.y1 + 22, NARROW ? i + 1 : 'bike ' + (i + 1), C.muted, 13));
    });

    // the scores: training error, penalty, total (stacked) and next month's error
    const items = [[['training', 'error'], te, C.cyan], [['penalty', ''], pen, C.violet], [['total', ''], tot, C.amber], [['next', 'month'], te2, C.pink]];
    const vmax = Math.max(8, ...items.map(b => b[1])), bw = (BR.x1 - BR.x0) / 4, bh = v => v / vmax * (BR.y1 - BR.y0 - 26);
    k.push(s('line', { x1: BR.x0, x2: BR.x1, y1: BR.y1, y2: BR.y1, stroke: C.muted, 'stroke-width': 2 }));
    items.forEach(([[l1, l2], v, col], j) => {
      const x = BR.x0 + bw * j + bw * 0.15, wd = bw * 0.7, cx = x + wd / 2;
      if (j === 2) {
        k.push(s('rect', { x, y: BR.y1 - bh(te), width: wd, height: bh(te), fill: C.cyan, 'fill-opacity': .8, rx: 3 }),
          s('rect', { x, y: BR.y1 - bh(tot), width: wd, height: bh(pen), fill: C.violet, 'fill-opacity': .8, rx: 3 }));
      } else k.push(s('rect', { x, y: BR.y1 - bh(v), width: wd, height: bh(v), fill: col, 'fill-opacity': .8, rx: 3 }));
      k.push(text(cx, BR.y1 - bh(v) - 8, fmt(r2(v)), col, 15, 'middle', 700),
        text(cx, BR.y1 + 18, l1, col, 12), text(cx, BR.y1 + 34, l2, col, 12));
    });
    svg.replaceChildren(...k);

    // the loss curve: total after every iteration
    const X0 = 44, X1 = CW - 12, Y0 = 34, Y1 = CHH - 26;
    const ymax = Math.max(1, ...curve) * 1.1, xmax = Math.max(20, curve.length - 1);
    const px = i => X0 + i / xmax * (X1 - X0), pc = v => Y1 - Math.min(v, ymax) / ymax * (Y1 - Y0);
    const c = [s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.muted }), s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.muted }),
      text(X0, 20, `iteration ${it}`, C.ink, 15, 'start', 700), text(X1, 20, `total ${fmt(r2(tot))}`, C.amber, 15, 'end', 700),
      text(X1, CHH - 6, 'iterations →', C.muted, 12, 'end'), text(X0 - 6, Y0 + 4, fmt(r2(ymax)), C.muted, 11, 'end'), text(X0 - 6, Y1 + 4, '0', C.muted, 11, 'end')];
    if (curve.length > 1) c.push(s('polyline', { points: curve.map((v, i) => `${px(i)},${pc(v)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    c.push(s('circle', { cx: px(curve.length - 1), cy: pc(curve[curve.length - 1]), r: 5, fill: C.amber }));
    cv.replaceChildren(...c);

    // formula box: this step's numbers first, then the scores
    const lines = [];
    if (last && near(last.after, w)) {
      lines.push([`step ${it}`, C.green], `old dials  ${last.before.map(sg).join('  ')}`, `change     ${last.change.map(sg).join('  ')}`,
        `new dials  ${w.map(sg).join('  ')}`, [`total ${fmt(r2(last.t0))} → ${fmt(r2(last.t1))}`, last.t1 <= last.t0 ? C.green : C.pink]);
    }
    lines.push(`training error = average miss² = ${fmt(r2(te))}`,
      `size = ${w.map(v => `(${sg(v)})²`).join(' + ')}`, `     = ${fmt(r2(sz))}`,
      `penalty = λ × size = ${fmt(r2(lam))} × ${fmt(r2(sz))} = ${fmt(r2(pen))}`,
      [`total = ${fmt(r2(te))} + ${fmt(r2(pen))} = ${fmt(r2(tot))}`, C.amber],
      [`error on next month’s bikes = ${fmt(r2(te2))}`, C.pink]);
    fbox(box, lines);

    const rule = near(w, RULE_A) ? ' The dials are rule A.' : near(w, RULE_B) ? ' The dials are rule B.' : '';
    note.textContent = w.some(v => Math.abs(v) >= 50)
      ? 'The dials flew off: the learning rate is too big, so every step overshoots. Lower it and press Reset.'
      : `Dots are real prices, amber bars are the rule’s guesses, pink lines are the misses.${rule}`;
    [...wS, lamS, lrS, spS].forEach(x => x.sync());
    chal.update({ start: data === START, lam, tot: r2(tot), it, seenA0, seenB0, newData, itZeroNew, itPenNew });
  }
  restart();
  return () => setPlaying(false);
}
