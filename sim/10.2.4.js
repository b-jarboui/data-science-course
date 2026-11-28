// 10.2.4 Try it: polynomial regression, bend knob, iterative fitting, and the 30-year trap.
// Drag Cedar rent dots, turn Start/Climb/Bend by hand or step/play iterative gradient descent,
// watch the loss curve grow, compare with a straight line, and reveal the real 30-year card.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  // Shared Cedar 60 m² cards I, J, K (ages 0, 10, 20) and L (age 30)
  const CLEAN_AGES = [0, 10, 20], CLEAN_RENTS = [1320, 1400, 1400];
  const MESSY_AGES = [0, 5, 10, 15, 20], MESSY_RENTS = [1320, 1380, 1410, 1390, 1400];
  const INIT_B = [1320, 120, 0]; // [start, climb per decade, bend subtracted × d²]

  let ages = CLEAN_AGES.slice(), rents = CLEAN_RENTS.slice(), real30 = 1480;
  let b = INIT_B.slice();        // rent = b[0] + b[1]*d - b[2]*d²
  let messy = false, straight = false, show30 = false, mode = 'start';
  let steps = 0, lr = 0.65, speed = 6, timer = null, diverged = false;
  let history = [], lastStep = null, range = null;

  const pred = (age, params = b) => { const d = age / 10; return params[0] + params[1] * d - params[2] * d * d; };
  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;
  const money = v => (v < 0 ? '−' : '') + '$' + fmt(Math.abs(Math.round(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const calcStats = (params = b) => {
    const errs = ages.map((a, i) => pred(a, params) - rents[i]);
    const totalMiss = errs.reduce((acc, e) => acc + Math.abs(e), 0);
    const mse = errs.reduce((acc, e) => acc + e * e, 0) / ages.length;
    return { errs, totalMiss, mse, rmse: Math.sqrt(mse) };
  };

  // DOM elements
  const svg = s('svg', { viewBox: '0 0 700 410' });
  const lossSvg = s('svg', { viewBox: '0 0 340 160' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const stepBadge = h('span');

  const NAMES = ['Start ($)', 'Climb (+/dec)', 'Bend (−×d²)'];
  const COLS = [C.ink, C.cyan, C.violet];
  const LIM = [[900, 1600, 5], [-200, 300, 5], [-100, 140, 2]];
  const vals = b.map(() => h('span', { style: { font: '700 0.95rem Consolas, monospace', minWidth: '5.5ch', textAlign: 'right' } }));
  const sliders = b.map((_, i) => h('input', {
    type: 'range', min: LIM[i][0], max: LIM[i][1], step: LIM[i][2], value: b[i],
    style: { flex: '1 1 8rem' },
    oninput: e => {
      stopPlay();
      if (i === 2 && straight) return;
      b[i] = +e.target.value; mode = 'hand'; lastStep = null; diverged = false;
      history = [calcStats().rmse]; steps = 0; draw();
    }
  }));

  const lrVal = h('span', { style: { font: '700 0.95rem Consolas, monospace', minWidth: '4.5ch' } });
  const lrSlider = h('input', {
    type: 'range', min: 0.05, max: 1.8, step: 0.05, value: lr, style: { flex: '1 1 6.5rem' },
    oninput: e => { lr = +e.target.value; lrVal.textContent = lr.toFixed(2); }
  });
  const spVal = h('span', { style: { font: '700 0.95rem Consolas, monospace', minWidth: '5.5ch' } });
  const spSlider = h('input', {
    type: 'range', min: 1, max: 15, step: 1, value: speed, style: { flex: '1 1 5.5rem' },
    oninput: e => { speed = +e.target.value; spVal.textContent = `${speed}/s`; if (timer) { stopPlay(); startPlay(); } }
  });

  const playBtn = btn('Play', togglePlay);
  const modeBtn = btn('Straight line (no age²)', toggleStraight);
  const trapBtn = btn('Show real 30-year card', toggle30);
  const messyBtn = btn('5 messy cards', toggleMessy);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: bending the curve & learning the fit'),
    h('p', { class: 'sub' }, 'Each cyan dot is a Cedar apartment. Drag dots up or down, turn Start / Climb / Bend by hand, or press Step / Play to watch the computer learn the fit and shrink the misses.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', doStep, 'go'), playBtn, btn('Reset', resetAll), stepBadge),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { color: C.amber, fontWeight: 650, minWidth: '6.8rem' } }, 'Learning rate'), lrSlider, lrVal,
          h('span', { style: { color: C.muted, fontWeight: 650, marginLeft: '.4rem' } }, 'Speed'), spSlider, spVal),
        ...NAMES.map((n, i) => h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { minWidth: '7.5rem', color: COLS[i], fontWeight: 650 } }, n), sliders[i], vals[i])),
        h('div', { class: 'sim-row' },
          modeBtn, trapBtn, btn('New data (random)', newData), messyBtn)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' } },
            pill('MISSES vs STEP', C.amber),
            h('span', { class: 'sim-note', style: { margin: 0, fontSize: '.85rem' } }, 'avg miss ($)')),
          lossSvg),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Turn the Bend slider by hand so the curve hits all three Cedar dots (total miss $0).',
      check: st => st.mode === 'hand' && st.totalMiss < 1 && !st.messy && !st.straight,
      why: 'Yes! With bend = 40, we subtract 40 × d², pulling the steep line down by 0, 40, and 160 to hit all three dots.' },
    { text: 'Press Reset, then press Step or Play to let the computer learn the curve until total miss drops below $5.',
      check: st => st.steps > 0 && st.totalMiss < 5 && !st.straight,
      why: 'Each iteration nudges start, climb, and bend to shrink the misses, and the loss curve drops smoothly toward zero.' },
    { text: 'Set the learning rate above 1.4 and press Play (or Step) until learning jumps off track and loss blows up.',
      check: st => st.diverged,
      why: 'Too big a learning rate overshoots the best curve on every step, making the misses bounce wilder instead of shrinking.' },
    { text: 'Fit the curve to the cards (miss under $15), then press “Show real 30-year card” to test past the data.',
      check: st => st.show30 && st.totalMiss < 15 && !st.straight && Math.abs(st.miss30) >= 35,
      why: 'Outside the ages it learned from, the squared pull keeps bending the curve away from the real 30-year-old apartment.' },
  ]);

  // Gradient descent in centered decades u = d − 1 so convergence is fast at moderate lr
  // and cleanly diverges above lr ≈ 1.4.
  // rent(u) = c0 + c1*u − c2*u²  <=>  start = c0 − c1 − c2, climb = c1 + 2*c2, bend = c2.
  function doStep() {
    if (diverged) { stopPlay(); return; }
    const oldB = b.slice(), oldStats = calcStats(oldB);
    let c0 = b[0] + b[1] - b[2], c1 = b[1] - 2 * b[2], c2 = straight ? 0 : b[2];
    let g0 = 0, g1 = 0, g2 = 0;
    const n = ages.length;
    for (let i = 0; i < n; i++) {
      const u = ages[i] / 10 - 1;
      const err = (c0 + c1 * u - c2 * u * u) - rents[i];
      g0 += err;
      g1 += err * u;
      g2 += -err * u * u;
    }
    g0 /= n; g1 /= n; g2 /= n;
    c0 -= lr * g0;
    c1 -= lr * g1;
    if (!straight) c2 -= lr * g2; else c2 = 0;
    const nextB = [c0 - c1 - c2, c1 + 2 * c2, c2];
    const nextStats = calcStats(nextB);

    steps++;
    mode = 'learn';
    if (!Number.isFinite(nextStats.rmse) || nextStats.rmse > 1800 || Math.max(...nextB.map(Math.abs)) > 6000) {
      diverged = true;
      stopPlay();
      history.push(Math.min(2000, Number.isFinite(nextStats.rmse) ? nextStats.rmse : 2000));
      lastStep = { step: steps, oldB, newB: nextB, oldMiss: oldStats.totalMiss, newMiss: nextStats.totalMiss, oldRmse: oldStats.rmse, newRmse: nextStats.rmse };
      draw();
      return;
    }
    b = nextB;
    syncSliders();
    history.push(nextStats.rmse);
    if (history.length > 80) history = history.slice(-80);
    lastStep = { step: steps, oldB, newB: b.slice(), oldMiss: oldStats.totalMiss, newMiss: nextStats.totalMiss, oldRmse: oldStats.rmse, newRmse: nextStats.rmse };
    if (nextStats.rmse > Math.max(450, history[0] * 3.2) && steps >= 3) diverged = true;
    range = null;
    draw();
    if (diverged) stopPlay();
  }

  function syncSliders() {
    b.forEach((v, i) => { sliders[i].value = Math.max(LIM[i][0], Math.min(LIM[i][1], v)); });
  }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (diverged) return;
    stopPlay();
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      doStep();
      if (!diverged && calcStats().rmse < 0.08 && !straight) stopPlay();
    }, Math.round(1000 / speed));
  }
  function togglePlay() { if (timer) stopPlay(); else startPlay(); }

  function resetParams(keepData = false) {
    stopPlay();
    if (!keepData) {
      ages = (messy ? MESSY_AGES : CLEAN_AGES).slice();
      rents = (messy ? MESSY_RENTS : CLEAN_RENTS).slice();
      real30 = 1480;
    }
    b = [rents[0], 120, 0];
    if (straight) b[2] = 0;
    mode = 'start'; steps = 0; diverged = false; lastStep = null; range = null;
    history = [calcStats().rmse];
    syncSliders();
    draw();
  }
  function resetAll() {
    messy = false; straight = false; show30 = false;
    lr = 0.65; lrSlider.value = lr; lrVal.textContent = lr.toFixed(2);
    modeBtn.textContent = 'Straight line (no age²)';
    trapBtn.textContent = 'Show real 30-year card';
    messyBtn.textContent = '5 messy cards';
    sliders[2].disabled = false;
    resetParams(false);
  }
  function toggleStraight() {
    stopPlay();
    straight = !straight;
    if (straight) b[2] = 0;
    sliders[2].disabled = straight;
    modeBtn.textContent = straight ? 'Curve (add age²)' : 'Straight line (no age²)';
    steps = 0; diverged = false; lastStep = null; history = [calcStats().rmse];
    syncSliders(); draw();
  }
  function toggle30() {
    show30 = !show30;
    trapBtn.textContent = show30 ? 'Hide 30-year card' : 'Show real 30-year card';
    range = null; draw();
  }
  function toggleMessy() {
    stopPlay();
    messy = !messy;
    messyBtn.textContent = messy ? '3 clean cards' : '5 messy cards';
    resetParams(false);
  }
  function newData() {
    stopPlay();
    const s0 = rnd(124, 136) * 10, c1 = rnd(7, 15) * 10, k2 = rnd(2, 6) * 10;
    ages = (messy ? MESSY_AGES : CLEAN_AGES).slice();
    rents = ages.map(a => {
      const d = a / 10, noise = messy ? rnd(-2, 2) * 10 : 0;
      return Math.round((s0 + c1 * d - k2 * d * d + noise) / 10) * 10;
    });
    // Real 30-year apartment stays gently high rather than plunging like the parabola
    real30 = Math.max(rents[rents.length - 1] + rnd(3, 10) * 10, s0 + 100);
    b = [rents[0], Math.max(40, c1), 0];
    mode = 'start'; steps = 0; diverged = false; lastStep = null; range = null;
    history = [calcStats().rmse];
    syncSliders(); draw();
  }

  // Main chart geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 410, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 56 : 74, X1 = VW - (NARROW ? 28 : 42), BASE = 342, TOP = 36;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const px = age => X0 + (age + 2) / 34 * (X1 - X0);

  let geo = null;
  function getRange() {
    if (dragging >= 0 && range) return range;
    const all = rents.slice();
    if (show30) all.push(real30);
    for (let a = 0; a <= 30; a += 5) {
      const v = pred(a);
      if (Number.isFinite(v) && v > 600 && v < 2400) all.push(v);
    }
    const lo = Math.floor((Math.min(...all) - 40) / 80) * 80;
    const hi = Math.ceil((Math.max(...all) + 40) / 80) * 80;
    return range = [Math.max(700, lo), Math.min(2300, Math.max(hi, lo + 320))];
  }

  // Drag Cedar dots up/down
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bd = 34 * F;
    ages.forEach((a, i) => { const d = Math.hypot(p.x - px(a), p.y - geo.py(rents[i])); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    stopPlay(); dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    rents[dragging] = Math.max(900, Math.min(1800, Math.round(geo.inv(p.y) / 10) * 10));
    steps = 0; diverged = false; lastStep = null; history = [calcStats().rmse];
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; range = null; draw(); });

  function drawLoss() {
    const W = 340, H = 160, x0 = 44, x1 = W - 14, y0 = 130, y1 = 16;
    const k = [], mono = 'Consolas';
    const maxL = Math.max(120, ...history) * 1.1;
    for (let i = 0; i <= 2; i++) {
      const v = Math.round(maxL * i / 2), y = y0 - (v / maxL) * (y0 - y1);
      k.push(s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: x0 - 6, y: y + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': mono }, '$' + v));
    }
    k.push(s('line', { x1: x0, x2: x1, y1: y0, y2: y0, stroke: C.muted }),
      s('line', { x1: x0, x2: x0, y1: y0, y2: y1, stroke: C.muted }),
      s('text', { x: (x0 + x1) / 2, y: H - 6, fill: C.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': mono }, `steps (0 → ${Math.max(10, steps)})`));
    const span = Math.max(10, history.length - 1);
    const pts = history.map((v, i) => [x0 + (i / span) * (x1 - x0), y0 - Math.min(1, v / maxL) * (y0 - y1)]);
    if (pts.length > 1) {
      const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
      k.push(s('path', { d, fill: 'none', stroke: diverged ? C.pink : C.amber, 'stroke-width': 2.5 }));
    }
    const last = pts[pts.length - 1];
    if (last) k.push(s('circle', { cx: last[0], cy: last[1], r: 4.5, fill: diverged ? C.pink : C.green }));
    lossSvg.replaceChildren(...k);
  }

  function draw() {
    const [lo, hi] = getRange(), py = r => BASE - (r - lo) / (hi - lo) * (BASE - TOP);
    geo = { py, inv: y => lo + (BASE - y) / (BASE - TOP) * (hi - lo) };
    const k = [], mono = 'Consolas', gstep = hi - lo > 700 ? 200 : 80;

    // gridlines & y-axis labels
    for (let g = lo; g <= hi; g += gstep) {
      k.push(s('line', { x1: X0, x2: X1, y1: py(g), y2: py(g), stroke: C.line }),
        s('text', { x: X0 - 8, y: py(g) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, money(g)));
    }
    // divider between data range (0..20) and extrapolation (30)
    k.push(s('line', { x1: px(20), x2: px(20), y1: TOP, y2: BASE, stroke: C.line, 'stroke-dasharray': '5 5' }),
      s('text', { x: px(25), y: TOP + 14, fill: C.pink, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-weight': 650 }, 'outside data'));

    // x-axis ticks
    [0, 10, 20, 30].forEach(a => k.push(
      s('text', { x: px(a), y: BASE + 22, fill: a <= 20 ? C.ink : C.pink, 'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, `${a} yr`),
      s('text', { x: px(a), y: BASE + 40 * F, fill: a <= 20 ? C.green : C.pink, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': mono }, `d=${a / 10}`)));

    // curve path: solid on 0..20, dashed pink on 20..30
    const pathFor = (a0, a1) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const a = a0 + (a1 - a0) * i / 40;
        const y = Math.max(TOP - 30, Math.min(BASE + 30, py(pred(a))));
        pts.push((i ? 'L' : 'M') + px(a).toFixed(1) + ',' + y.toFixed(1));
      }
      return pts.join(' ');
    };
    const curveCol = diverged ? C.pink : (straight ? C.violet : C.amber);
    k.push(
      s('path', { d: pathFor(0, 20), fill: 'none', stroke: curveCol, 'stroke-width': 3.5 }),
      s('path', { d: pathFor(20, 30), fill: 'none', stroke: C.pink, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-opacity': 0.85 }));

    // peak marker if the parabola turns inside 0..25 yr
    if (!straight && !diverged && Math.abs(b[2]) > 1) {
      const dPeak = b[1] / (2 * b[2]), aPeak = dPeak * 10;
      if (aPeak > 0.5 && aPeak < 24.5) {
        const rPeak = pred(aPeak);
        if (rPeak >= lo && rPeak <= hi) {
          k.push(s('circle', { cx: px(aPeak), cy: py(rPeak), r: 5, fill: C.amber }),
            s('text', { x: px(aPeak), y: py(rPeak) - 12, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono },
              `${b[2] > 0 ? 'peak' : 'low'} ${r1(aPeak)} yr (${money(rPeak)})`));
        }
      }
    }

    // miss lines + Cedar dots
    const st = calcStats();
    ages.forEach((a, i) => {
      const cx = px(a), cy = py(rents[i]), yp = Math.max(TOP - 15, Math.min(BASE + 15, py(pred(a))));
      const err = st.errs[i];
      if (Math.abs(err) >= 1) {
        k.push(s('line', { x1: cx, x2: cx, y1: cy, y2: yp, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
        if (!messy || i % 2 === 0) {
          k.push(s('text', { x: cx + (a === 20 ? 10 : -10), y: (cy + yp) / 2 + 4, fill: C.pink, 'font-size': 12 * F, 'text-anchor': a === 20 ? 'start' : 'end', 'font-family': mono },
            (err > 0 ? '+' : '−') + Math.round(Math.abs(err))));
        }
      }
      k.push(s('circle', { cx, cy, r: 15, fill: C.cyan, 'fill-opacity': 0.18 }),
        s('circle', { cx, cy, r: 8, fill: C.cyan }),
        s('text', { x: cx, y: cy + 25 * F, fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, money(rents[i])));
      if (i === dragging) k.push(s('circle', { cx, cy, r: 21, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.5 }));
    });

    // 30-year prediction & optional real card L
    const p30 = pred(30), y30 = Math.max(TOP - 10, Math.min(BASE + 10, py(p30)));
    k.push(s('circle', { cx: px(30), cy: y30, r: 6.5, fill: C.bg, stroke: C.pink, 'stroke-width': 2.5 }),
      s('text', { x: px(30), y: y30 + (show30 && p30 <= real30 ? 22 : -13), fill: C.pink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, money(p30) + '?'));
    const miss30 = p30 - real30;
    if (show30) {
      const yr = py(real30);
      k.push(
        s('line', { x1: px(30), x2: px(30), y1: y30, y2: yr, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
        s('circle', { cx: px(30), cy: yr, r: 15, fill: C.green, 'fill-opacity': 0.2 }),
        s('circle', { cx: px(30), cy: yr, r: 8, fill: C.cyan, stroke: C.green, 'stroke-width': 2 }),
        s('text', { x: px(30) - 8, y: yr - 16, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, 'real ' + money(real30)));
    }

    svg.replaceChildren(...k);
    drawLoss();

    // Update controls & formula box
    stepBadge.replaceChildren(pill(`STEP ${steps}`, diverged ? C.pink : C.cyan));
    lrVal.textContent = lr.toFixed(2);
    spVal.textContent = `${speed}/s`;
    b.forEach((v, i) => { vals[i].textContent = fmt(r1(v)); });

    const sign = (v, unit) => `${v < 0 ? '−' : '+'} ${fmt(Math.abs(r1(v)))}${unit}`;
    const bSign = b[2] >= 0 ? `− ${fmt(r1(b[2]))} × d²` : `+ ${fmt(r1(Math.abs(b[2])))} × d²`;
    const lines = [
      `rent = ${fmt(r1(b[0]))} ${sign(b[1], ' × d')}`,
      straight ? ['       (straight line: no d²)', C.violet] : ['       ' + bSign, C.violet],
      [`total miss = ${money(st.totalMiss)}   avg miss = ${money(st.rmse)}`, st.totalMiss < 1 ? C.green : (diverged ? C.pink : C.amber)],
    ];
    if (lastStep) {
      lines.push([`step ${lastStep.step}: bend ${fmt(r1(lastStep.oldB[2]))} → ${fmt(r1(lastStep.newB[2]))}`, C.muted]);
      lines.push([`        miss ${money(lastStep.oldMiss)} → ${money(lastStep.newMiss)}`, lastStep.newMiss <= lastStep.oldMiss ? C.green : C.pink]);
    }
    if (show30) {
      lines.push([`at 30 yr: curve ${money(p30)}, real ${money(real30)} (off ${money(Math.abs(miss30))})`, Math.abs(miss30) >= 35 ? C.pink : C.green]);
    }
    fbox(box, lines);

    note.textContent = diverged
      ? 'Learning rate is too high: each step overshoots and the misses blow up. Press Reset and try a smaller learning rate.'
      : st.totalMiss < 1
        ? 'Every Cedar dot lies right on the curve. Notice how the dashed pink tail still bends past age 20.'
        : straight
          ? 'With d² turned off, the line can only tilt, never bend — so it cannot hit all three curved dots.'
          : 'Press Step to see one update’s numbers, Play to watch learning settle, or drag the sliders and dots yourself.';

    chal.update({ mode, totalMiss: st.totalMiss, messy, straight, steps, diverged, show30, miss30 });
  }

  history = [calcStats().rmse];
  draw();
  return () => stopPlay();
}
