// 12.3.12 Try it: lasso, one step at a time.
// The learner turns the fee knob λ and the learning rate, steps or plays the fitting, drags the six prices,
// makes new data or a new start, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const AGE = [1, 2, 3, 4, 5, 6], STICK = [2, 4, 3, 1, 0, 5], PRICE = [10, 6, 8, 7, 3, 5];   // prices in $100s
  const START = [-1.2, -0.8, 0.3], NAMES = ['age', 'mileage', 'stickers'], COL = [C.cyan, C.violet, C.pink];
  let stick = STICK.slice(), price = PRICE.slice(), start = START.slice(), w = start.slice();
  let lam = 0, lr = 0.1, speed = 6, iter = 0, hist = [], last = null, playing = false, timer = 0, blown = false, settled = false;

  const svg = s('svg', { viewBox: '0 0 700 440' }), lsvg = s('svg', { viewBox: '0 0 700 170' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('▶ Play', () => setPlaying(!playing));
  const iterOut = h('span', { class: 'sim-note', style: { margin: 0 } });
  const lamOut = h('b'), lrOut = h('b'), spOut = h('b');
  const slider = (min, max, step, value, on) => h('input', { type: 'range', min, max, step, value, style: { flex: '1 1 10rem' }, oninput: e => on(+e.target.value) });
  const knobRow = (label, out, input) => h('div', { class: 'sim-row' }, h('span', { style: { minWidth: '10rem' } }, label, ': ', out), input);
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: lasso, one step at a time'),
    h('p', { class: 'sub' }, 'The bars are the weights of age, mileage and stickers (one block = 0.1). Each step moves the weights downhill on the training error, then the fee pulls every weight toward 0 by the same amount. Drag a price dot to change the data.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, lsvg,
        h('div', { class: 'sim-row' }, btn('Step', () => { setPlaying(false); step(); }, 'go'), playBtn, btn('Reset', reset), iterOut),
        knobRow('fee knob λ', lamOut, slider(0, 6, 0.05, lam, v => { lam = v; settled = false; draw(); })),
        knobRow('learning rate', lrOut, slider(0.02, 0.6, 0.02, lr, v => { lr = v; settled = false; draw(); })),
        knobRow('speed (steps/s)', spOut, slider(1, 30, 1, speed, v => { speed = v; draw(); })),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData),
          btn('New start (random)', newStart),
          btn('Back to the six bikes', home))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Predict: with λ = 0.5, will the sticker weight reach exactly 0? Set λ to 0.5 and press Play.',
      check: st => !st.blown && st.iter > 0 && st.lam >= 0.5 && st.w[2] === 0,
      why: 'Yes. The fee pulls every weight toward 0 by the same amount at every step, so a small weight is pulled all the way and stops at exactly 0.' },
    { text: 'Keep only one of the look-alikes: make mileage exactly 0 while age is not 0.',
      check: st => !st.blown && st.iter > 0 && st.w[1] === 0 && st.w[0] !== 0,
      why: 'Age and mileage tell the same story, so a big enough fee lets lasso drop one. Which one survives depends on the start, so this zero does not prove mileage is useless.' },
    { text: 'Turn λ up until every weight is exactly 0. What does every bike get?',
      check: st => !st.blown && st.iter > 0 && st.w.every(v => v === 0),
      why: 'With every weight at 0 the rule ignores all features, so every bike gets the average price.' },
    { text: 'Break it on purpose: find a learning rate so big that the weights blow up.',
      check: st => st.blown,
      why: 'Each step overshoots the bottom and lands further away. A smaller learning rate settles; press Reset to try again.' },
  ]);

  // the maths: features on one common scale, guesses = average price + weights × features
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  function feats() {
    return [AGE, AGE.map(a => 2 * a), stick].map(c => {
      const m = mean(c), sd = Math.sqrt(mean(c.map(v => (v - m) ** 2))) || 1;
      return c.map(v => (v - m) / sd);
    });
  }
  function stats(wt = w) {
    const Z = feats(), avg = mean(price);
    const guess = price.map((_, i) => avg + wt[0] * Z[0][i] + wt[1] * Z[1][i] + wt[2] * Z[2][i]);
    const err = mean(price.map((y, i) => (guess[i] - y) ** 2)), size = wt.reduce((a, v) => a + Math.abs(v), 0);
    return { Z, avg, guess, err, size, score: err + lam * size };
  }
  function record() {
    const st = stats();
    hist.push({ i: iter, err: st.err, score: st.score });
    if (hist.length > 2000) hist = hist.filter((_, k) => k % 2 === 0);
  }

  // one iteration: move downhill on the training error, then the fee pulls each weight toward 0
  function step() {
    if (blown) return;
    const st = stats(), n = price.length;
    const grad = st.Z.map(z => 2 / n * z.reduce((a, zi, i) => a + zi * (st.guess[i] - price[i]), 0));
    const pull = lr * lam, moved = w.map((v, j) => v - lr * grad[j]);
    const after = moved.map(v => Math.abs(v) <= pull ? 0 : v - Math.sign(v) * pull);
    last = { before: w.slice(), move: grad.map(g => -lr * g), pull, after, snapped: after.map((v, j) => v === 0 && w[j] !== 0) };
    settled = Math.max(...after.map((v, j) => Math.abs(v - w[j]))) < 1e-6;
    w = after; iter++;
    if (!w.every(v => Number.isFinite(v) && Math.abs(v) < 1e4)) blown = true;
    record();
    if ((blown || settled) && playing) setPlaying(false);
    draw();
  }
  function setPlaying(on) {
    playing = on && !blown; clearTimeout(timer);
    playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play';
    if (playing) { settled = false; timer = setTimeout(tick, 1000 / speed); }
  }
  function tick() { if (!playing) return; step(); if (playing) timer = setTimeout(tick, 1000 / speed); }
  function reset() { setPlaying(false); w = start.slice(); iter = 0; last = null; blown = false; settled = false; hist = []; record(); draw(); }
  function newData() {
    stick = AGE.map(() => rnd(0, 5));
    price = AGE.map(a => Math.max(1, Math.min(12, 10 - a + rnd(-2, 2))));
    reset();
  }
  function newStart() { start = [0, 1, 2].map(() => rnd(-20, 20) / 10); reset(); }
  function home() { stick = STICK.slice(); price = PRICE.slice(); start = START.slice(); reset(); }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`); lsvg.setAttribute('viewBox', `0 0 ${VW} 170`);
  const ZX = NARROW ? 230 : 400, WS = NARROW ? 48 : 110, ROWS = [62, 112, 162], BH = 28;
  const PX0 = NARROW ? 52 : 70, PB = 392, PU = 12;   // price axis: $100 = 12 px, $0 at y = 392
  const pslot = () => (VW - 12 - PX0) / 6, PY = p => PB - p * PU;
  const tx = (x, y, str, fill, size = 14, anchor = 'start', bold = false) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': bold ? 700 : 400 }, str);
  const f3 = v => v === 0 ? '0' : (v < 0 ? '−' : '+') + (Math.abs(v) > 999 ? 'huge' : Math.abs(v).toFixed(3));
  const f2 = v => Number.isFinite(v) && v < 1e6 ? v.toFixed(2) : 'huge';

  // drag a price dot up or down
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < PY(13) - 15) return;
    const i = Math.floor((p.x - PX0) / pslot());
    if (i < 0 || i > 5) return;
    dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), v = Math.max(1, Math.min(12, Math.round((PB - p.y) / PU * 2) / 2));
    if (v !== price[dragging]) { price[dragging] = v; reset(); }
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = stats(), sl = pslot(), k = [];
    // weight bars, one block = 0.1 of weight
    k.push(tx(ZX - 10, 30, '← lowers price', C.muted, 12, 'end'), tx(ZX + 10, 30, 'raises price →', C.muted, 12),
      s('line', { x1: ZX, x2: ZX, y1: 38, y2: 182, stroke: C.muted, 'stroke-dasharray': '5 5' }));
    w.forEach((v, r) => {
      const y = ROWS[r], c = Math.max(-2.5, Math.min(2.5, Number.isFinite(v) ? v : 0)), n = Math.abs(c) * 10, sg = Math.sign(c), bu = WS / 10;
      for (let b = 0; b < Math.ceil(n - 1e-9); b++) {
        const part = Math.min(1, n - b), x = sg < 0 ? ZX - (b + part) * bu : ZX + b * bu;
        k.push(s('rect', { x: x + 0.6, y: y - BH / 2, width: Math.max(0, part * bu - 1.2), height: BH, fill: COL[r], 'fill-opacity': .82, rx: 1.5 }));
      }
      k.push(tx(8, y - 2, NAMES[r], COL[r], 15, 'start', true), tx(8, y + 16, blown ? 'blew up' : f3(v), COL[r], 14));
      if (v === 0) k.push(tx(ZX + 8, y + 5, 'exactly 0', C.green, 13, 'start', true));
    });
    // six bikes: real price (cyan dot), the rule's guess (amber mark), the miss (pink)
    k.push(tx(PX0, 218, NARROW ? 'drag a price dot' : 'drag a price dot · cyan = real price · amber = the rule’s guess', C.muted, 12));
    for (const g of [0, 5, 10]) k.push(s('line', { x1: PX0, x2: VW - 12, y1: PY(g), y2: PY(g), stroke: C.line }), tx(PX0 - 6, PY(g) + 4, `$${g * 100}`, C.muted, 12, 'end'));
    k.push(s('line', { x1: PX0, x2: VW - 12, y1: PY(st.avg), y2: PY(st.avg), stroke: C.muted, 'stroke-dasharray': '6 6' }),
      tx(VW - 14, PY(st.avg) - 6, `average $${Math.round(st.avg * 100)}`, C.muted, 12, 'end'));
    price.forEach((p, i) => {
      const cx = PX0 + sl * (i + 0.5), g = Math.max(-0.5, Math.min(13, Number.isFinite(st.guess[i]) ? st.guess[i] : 13));
      k.push(s('line', { x1: cx, x2: cx, y1: PY(p), y2: PY(g), stroke: C.pink, 'stroke-width': 2, 'stroke-opacity': .7 }),
        s('line', { x1: cx - 14, x2: cx + 14, y1: PY(g), y2: PY(g), stroke: C.amber, 'stroke-width': 4 }),
        s('circle', { cx, cy: PY(p), r: 9, fill: C.cyan }),
        tx(cx, PY(p) - 14, `$${Math.round(p * 100)}`, C.cyan, 12, 'middle', true),
        tx(cx, PB + 24, NARROW ? `${i + 1}` : `bike ${i + 1}`, C.muted, 12, 'middle'));
    });
    svg.replaceChildren(...k);

    // loss versus iteration
    const LX0 = NARROW ? 46 : 56, LX1 = VW - 12, LY0 = 140, LY1 = 26, q = [];
    const fin = hist.filter(p => Number.isFinite(p.score) && p.score < 1e6);
    const first = fin.length ? fin[0].score : 1;
    const yMax = Math.max(1, Math.ceil(Math.min(Math.max(...fin.map(p => p.score), 0), 3 * first) * 1.1));
    const xMax = Math.max(20, iter);
    const lx = i => LX0 + i / xMax * (LX1 - LX0), ly = v => LY0 - Math.min(Number.isFinite(v) ? v : yMax, yMax) / yMax * (LY0 - LY1);
    q.push(s('line', { x1: LX0, x2: LX1, y1: LY0, y2: LY0, stroke: C.muted }), s('line', { x1: LX0, x2: LX0, y1: LY0, y2: LY1 - 6, stroke: C.muted }),
      tx(LX0 - 6, LY0 + 4, '0', C.muted, 12, 'end'), tx(LX0 - 6, LY1 + 4, String(yMax), C.muted, 12, 'end'),
      tx(LX1, LY0 + 20, `iteration (up to ${xMax})`, C.muted, 12, 'end'),
      tx(LX0 + 6, 16, 'score = error + λ × size', C.amber, 12), tx(LX0 + (NARROW ? 200 : 230), 16, 'error', C.pink, 12),
      tx(LX1, 16, `iteration ${iter}`, C.ink, 13, 'end', true));
    for (const [key, color] of [['score', C.amber], ['err', C.pink]]) {
      q.push(s('polyline', { points: hist.map(p => `${lx(p.i)},${ly(p[key])}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5 }));
      const end = hist[hist.length - 1];
      if (end) q.push(s('circle', { cx: lx(end.i), cy: ly(end[key]), r: 4, fill: color }));
    }
    lsvg.replaceChildren(...q);

    // formula box: this step's numbers
    const col = v => f3(v).padStart(8);
    const lines = [`step ${iter}   λ = ${fmt(lam)}   learning rate = ${fmt(lr)}`, `        ${'age'.padStart(8)}${'miles'.padStart(8)}${'sticker'.padStart(8)}`];
    if (last && iter > 0) {
      lines.push(`before  ${last.before.map(col).join('')}`, `downhill${last.move.map(col).join('')}`,
        [`fee pull: each weight ${last.pull.toFixed(3)} toward 0`, C.amber], [`after   ${last.after.map(col).join('')}`, C.amber]);
    } else lines.push(`start   ${w.map(col).join('')}`, 'Press Step to take one step.');
    lines.push(`error ${f2(st.err)} + ${fmt(lam)} × size ${f2(st.size)}`, [`= score ${f2(st.score)}`, C.amber]);
    if (blown) lines.push(['the weights blew up', C.pink]);
    else if (w.every(v => v === 0)) lines.push([`every bike gets the average: $${Math.round(st.avg * 100)}`, C.green]);
    fbox(box, lines);

    const snapped = last && iter > 0 ? NAMES.filter((_, j) => last.snapped[j]) : [];
    note.textContent = blown ? 'The steps were too big: each one overshot the bottom and the weights blew up. Lower the learning rate and press Reset.'
      : snapped.length ? `This step pulled ${snapped.join(' and ')} to exactly 0.`
      : settled ? 'Settled: more steps change nothing. Turn λ and press Play again to watch the weights move.'
      : 'Each step: move downhill on the training error, then the fee pulls every weight toward 0 by the same amount. A weight that would cross 0 stops at exactly 0.';
    lamOut.textContent = fmt(lam); lrOut.textContent = fmt(lr); spOut.textContent = fmt(speed);
    iterOut.textContent = `Iteration ${iter}`;
    chal.update({ w, lam, blown, iter });
  }
  record();
  draw();
  return () => { playing = false; clearTimeout(timer); };
}
