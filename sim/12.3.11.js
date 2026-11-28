// 12.3.11 Try it: ridge regression learns, step by step.
// The learner sets λ, the step size and the speed, steps or plays the learning, drags a weight by hand,
// makes random bikes, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [[1, 2, 2, 10], [2, 4, 4, 6], [3, 6, 3, 8], [4, 8, 1, 7], [5, 10, 0, 3], [6, 12, 5, 5]];   // age, mileage, stickers, price
  const WILD = [-3, 1, 0.3], NAMES = ['β1 age', 'β2 mileage', 'β3 stickers'], FC = [C.cyan, C.violet, C.amber];
  let bikes = START.map(r => r.slice()), Z = [], Y = [], target = null;
  let w = WILD.slice(), lambda = 1, rate = 0.02, speed = 8;
  let iter = 0, hist = [], last = null, playing = false, diverged = false, newData = 0, raf = 0, prev = 0, acc = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), data = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('▶ Play', () => playing ? stop() : start(), 'go');
  function slider(label, min, max, stepv, value, show, on) {
    const out = h('b', { style: { minWidth: '3.4em', fontFamily: 'Consolas, monospace' } }, show(value));
    const inp = h('input', { type: 'range', min, max, step: stepv, value, 'aria-label': label, style: { flex: '1 1 8rem' } });
    inp.addEventListener('input', () => { const v = +inp.value; out.textContent = show(v); on(v); });
    return h('div', { class: 'sim-row' }, h('span', { style: { minWidth: '8em' } }, label), inp, out);
  }
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: ridge learns to share'),
    h('p', { class: 'sub' }, 'Each bar is a weight. Press Step or Play: every step nudges all three weights to lower the score = training error + λ × cost. You can also drag a bar to set a weight by hand.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); step(); draw(); }), playBtn,
          btn('Reset', reset),
          btn('New data (random bikes)', () => { bikes = newBikes(); newData++; prep(); reset(); }),
          btn('The six lesson bikes', () => { bikes = START.map(r => r.slice()); prep(); reset(); })),
        slider('λ (penalty knob)', 0, 10, 0.5, lambda, v => fmt(v), v => { lambda = v; solveTarget(); restart(); draw(); }),
        slider('step size', 0.005, 0.12, 0.005, rate, v => v.toFixed(3), v => { rate = v; restart(); draw(); }),
        slider('speed (steps/s)', 1, 30, 1, speed, v => String(v), v => { speed = v; }),
        data),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Set λ to 0 and press Play. Does the split between age and mileage ever even out?',
      check: st => st.lambda === 0 && st.iter >= 40 && st.gap > 0.5 && !st.diverged,
      why: 'No. At λ = 0, moving weight between age and mileage changes no guess, so nothing pushes them to share.' },
    { text: 'Set λ to 1 or more and press Play until age and mileage are within 0.1 of each other.',
      check: st => st.lambda >= 1 && st.iter > 0 && st.gap < 0.1 && !st.diverged,
      why: 'Right: lopsided weights cost more, so each step moves weight toward an even split.' },
    { text: 'Predict first: with step size 0.1, will the score settle? Press Play and see.',
      check: st => st.rate >= 0.1 && st.diverged,
      why: 'Too big a step jumps past the lowest score and lands further away each time, so it explodes. Press Reset.' },
    { text: 'Press New data, set λ to 10 and Play until it settles. Does the sticker weight reach exactly 0?',
      check: st => st.newData > 0 && st.lambda >= 10 && st.settled && Math.abs(st.w3) > 0,
      why: 'It shrinks toward 0 but never lands on it. To drop a feature completely you need lasso, next lesson.' },
  ]);

  // data: rescale each feature to the same spread, measure prices from their mean
  function prep() {
    const n = bikes.length;
    const zs = [0, 1, 2].map(j => {
      const xs = bikes.map(b => b[j]), m = xs.reduce((a, b) => a + b, 0) / n;
      const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / n) || 1;
      return xs.map(x => (x - m) / sd);
    });
    Z = bikes.map((_, i) => zs.map(c => c[i]));
    const ym = bikes.reduce((a, b) => a + b[3], 0) / n;
    Y = bikes.map(b => b[3] - ym);
    solveTarget();
  }
  function solveTarget() {
    const A = [0, 1, 2].map(a => [0, 1, 2].map(b => Z.reduce((t, z) => t + z[a] * z[b], 0) + (a === b ? lambda : 0)));
    const rhs = [0, 1, 2].map(a => Z.reduce((t, z, i) => t + z[a] * Y[i], 0));
    target = solve(A, rhs);
  }
  function solve(A, b) {
    const m = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < 3; c++) {
      let p = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      if (Math.abs(m[p][c]) < 1e-6) return null;                 // λ = 0 with linked features: no single answer
      [m[c], m[p]] = [m[p], m[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const f = m[r][c] / m[c][c]; for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k]; }
    }
    return m.map((row, i) => row[3] / row[i]);
  }
  function newBikes() {
    let ages;
    do { ages = Array.from({ length: 6 }, () => rnd(1, 8)); } while (new Set(ages).size < 4);
    return ages.map(a => [a, 2 * a + rnd(-1, 1), rnd(0, 6), Math.max(1, 11 - a + rnd(-2, 2))]);
  }

  const resid = (v, z, i) => Y[i] - z[0] * v[0] - z[1] * v[1] - z[2] * v[2];
  const miss = v => Z.reduce((t, z, i) => t + resid(v, z, i) ** 2, 0);
  const cost = v => v.reduce((t, x) => t + x * x, 0);
  const score = v => miss(v) + lambda * cost(v);
  const grad = v => [0, 1, 2].map(j => -2 * Z.reduce((t, z, i) => t + resid(v, z, i) * z[j], 0) + 2 * lambda * v[j]);

  // learning
  function step() {
    if (diverged) return;
    const g = grad(w), old = w.slice();
    w = w.map((x, j) => x - rate * g[j]);
    iter++; hist.push(score(w)); last = { old };
    if (!w.every(x => Number.isFinite(x) && Math.abs(x) < 1e4)) { diverged = true; stop(); }
  }
  function restart() { iter = 0; last = null; hist = [score(w)]; }
  function reset() { stop(); w = WILD.slice(); diverged = false; restart(); draw(); }
  function start() { if (diverged) return; playing = true; prev = 0; acc = 1; playBtn.textContent = '❚❚ Pause'; raf = requestAnimationFrame(loop); }
  function stop() { playing = false; cancelAnimationFrame(raf); playBtn.textContent = '▶ Play'; }
  function loop(now) {
    if (!playing) return;
    acc += prev ? (now - prev) / 1000 * speed : 0; prev = now;
    for (let n = 0; acc >= 1 && n < 60 && playing; n++) { acc -= 1; step(); }
    draw();
    if (playing) raf = requestAnimationFrame(loop);
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: weights on top, the curve below
  const VW = NARROW ? 400 : 700, VH = NARROW ? 640 : 440, F = NARROW ? 1.25 : 1;
  const WX = NARROW ? [80, 200, 320] : [90, 200, 310], BW = NARROW ? 64 : 58;
  const Y0 = NARROW ? 185 : 205, U = NARROW ? 45 : 48, TOP = 36, BOT = NARROW ? 345 : 385, NY = NARROW ? 380 : 425;
  const LX0 = NARROW ? 30 : 40, LX1 = NARROW ? 390 : 365;
  const G = NARROW ? { x0: 40, x1: 390, y0: 440, y1: 620 } : { x0: 410, x1: 690, y0: 50, y1: 385 };
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const lo = -(BOT - Y0) / U, hi = (Y0 - TOP) / U, clip = x => Math.max(lo, Math.min(hi, x));
  const ok = x => Number.isFinite(x) && Math.abs(x) < 1e5;
  const f2 = x => ok(x) ? (x < -0.005 ? '−' : '+') + Math.abs(x).toFixed(2) : 'huge';
  const n2 = x => ok(x) ? x.toFixed(2) : 'huge';

  // drag a weight bar: pointer height sets the weight
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x > LX1 + 10 || p.y > BOT + 25 || diverged) return;
    const j = [0, 1, 2].reduce((a, b) => Math.abs(p.x - WX[b]) < Math.abs(p.x - WX[a]) ? b : a, 0);
    if (Math.abs(p.x - WX[j]) > 55) return;
    dragging = j; svg.setPointerCapture(e.pointerId); stop(); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    w[dragging] = Math.round(clip((Y0 - toSvg(e).y) / U) * 10) / 10;
    restart(); draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const k = [];
    // weights
    for (let g = -3; g <= 3; g++) {
      const y = Y0 - g * U;
      k.push(s('line', { x1: LX0, x2: LX1, y1: y, y2: y, stroke: g ? C.line : C.muted, 'stroke-width': g ? 1 : 2 }),
        s('text', { x: LX0 - 6, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g > 0 ? '+' + g : g < 0 ? '−' + -g : '0'));
    }
    k.push(s('text', { x: LX0, y: 20, fill: target ? C.green : C.muted, 'font-size': 13 * F },
      target ? 'dashed box = ridge answer for this λ' : 'λ = 0: no single answer, many splits fit'));
    w.forEach((x, j) => {
      const v = ok(x) ? clip(x) : (x > 0 ? hi : lo), y = Y0 - v * U, cx = WX[j];
      if (target) {
        const ty = Y0 - clip(target[j]) * U;
        k.push(s('rect', { x: cx - BW / 2 - 5, y: Math.min(ty, Y0), width: BW + 10, height: Math.max(1, Math.abs(ty - Y0)), fill: 'none', stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '6 5', rx: 3 }));
      }
      k.push(s('rect', { x: cx - BW / 2, y: Math.min(y, Y0), width: BW, height: Math.max(1, Math.abs(y - Y0)), fill: FC[j], 'fill-opacity': .82, rx: 2 }),
        s('text', { x: cx, y: v < 0 ? y + 18 * F : y - 8, fill: FC[j], 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, f2(x)),
        s('text', { x: cx, y: NY, fill: FC[j], 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle' }, NAMES[j]));
    });
    // score versus step
    const { x0, x1, y0, y1 } = G, n = Math.max(30, hist.length - 1), top = (ok(hist[0]) && hist[0] > 0 ? hist[0] : 1) * 1.15;
    const px = i => x0 + i / n * (x1 - x0), py = v => y1 - Math.min(ok(v) ? v : top, top) / top * (y1 - y0);
    k.push(s('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: 'none', stroke: C.line, rx: 6 }),
      s('text', { x: x0, y: y0 - 10, fill: C.muted, 'font-size': 13 * F }, 'score at each step'),
      s('text', { x: x1, y: y0 - 10, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${iter}`));
    if (target) {
      const b = py(score(target));
      k.push(s('line', { x1: x0, x2: x1, y1: b, y2: b, stroke: C.green, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }),
        s('text', { x: x1 - 6, y: b - 6, fill: C.green, 'font-size': 12 * F, 'text-anchor': 'end' }, 'lowest possible'));
    }
    k.push(s('polyline', { points: hist.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }),
      s('circle', { cx: px(hist.length - 1), cy: py(hist[hist.length - 1]), r: 5, fill: C.cyan }));
    if (diverged) k.push(s('text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2, fill: C.pink, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle' }, 'off the chart: jumping away!'));
    svg.replaceChildren(...k);

    // formula box: this step's numbers
    const m = miss(w), c = cost(w), sc = m + lambda * c, g = grad(w);
    const settled = !diverged && Math.hypot(...g) < 0.01;
    const lines = NAMES.map((nm, j) => [last
      ? `${nm.padEnd(12)}${f2(last.old[j])} → ${f2(w[j])}  (change ${f2(w[j] - last.old[j])})`
      : `${nm.padEnd(12)}${f2(w[j])}`, FC[j]]);
    fbox(box, [last ? `step ${iter}: each weight moves downhill` : `step ${iter}`, ...lines,
      `training error = ${n2(m)}`,
      `cost  = ${w.map(x => n2(x * x)).join(' + ')} = ${n2(c)}`,
      [`score = ${n2(m)} + ${fmt(lambda)} × ${n2(c)} = ${n2(sc)}`, C.amber]]);
    note.textContent = diverged ? 'The step size is too big: each step jumps past the lowest score and lands further away. Press Reset or lower the step size.'
      : !target ? 'At λ = 0, any split of age and mileage with the same total fits equally well, so learning never evens them out.'
      : settled ? 'Settled: the weights reached the ridge answer for this λ. Turn λ and watch them move again.'
      : 'Each step moves every weight a little in the direction that lowers the score.';
    data.textContent = 'Bikes (age, mileage, stickers → price): ' + bikes.map(b => `${b[0]}, ${b[1]}, ${b[2]} → ${b[3]}`).join(' · ') + '. Mileage is always about twice the age.';
    chal.update({ lambda, iter, gap: Math.abs(w[0] - w[1]), rate, diverged, newData, settled, w3: w[2] });
  }
  prep(); restart(); draw();
  return () => { playing = false; cancelAnimationFrame(raf); };
}
