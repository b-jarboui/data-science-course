// 10.3.12 Try it: Quantile regression with iterative loss minimization.
// Drag the cutoff marker or any patient dot, change the low-guess penalty (target share),
// and step or play gradient descent to watch the loss-versus-iteration curve grow.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const CLINIC = {
    morning: [5, 5, 10, 10, 10, 15, 15, 20, 40],
    afternoon: [10, 10, 15, 20, 20, 25, 30, 40, 60]
  };
  const START_Q = { morning: 8, afternoon: 20 };

  let session = 'morning';
  let pts = CLINIC.morning.slice();
  let isRandom = false;
  let lowW = 4;            // highW is fixed at 1 -> target share = lowW / (lowW + 1)
  let lr = 0.5;            // step size (learning rate)
  let speed = 4;           // steps per second
  let guess = START_Q.morning;
  let history = [];
  let lastStep = null;
  let timer = null;
  let bounced = false;
  let settled = false;

  const r2 = x => Math.round(x * 100) / 100;
  const r1 = x => Math.round(x * 10) / 10;

  function lossDetail(q, data = pts, lw = lowW) {
    let lowMin = 0, highMin = 0, nLow = 0, nHigh = 0, nExact = 0;
    for (const y of data) {
      if (y > q + 1e-6) { lowMin += y - q; nLow++; }
      else if (y < q - 1e-6) { highMin += q - y; nHigh++; }
      else { nExact++; }
    }
    const lowCost = lw * lowMin;
    const highCost = highMin;
    return {
      lowMin, highMin, lowCost, highCost,
      total: lowCost + highCost,
      nLow, nHigh, nExact,
      covered: nHigh + nExact
    };
  }

  // Subgradient interval [gLeft, gRight] of piecewise-linear convex loss at q
  function subgrad(q) {
    let lt = 0, le = 0, gt = 0, ge = 0;
    for (const y of pts) {
      if (y < q - 1e-6) lt++;
      if (y <= q + 1e-6) le++;
      if (y > q + 1e-6) gt++;
      if (y >= q - 1e-6) ge++;
    }
    const gLeft = lt - lowW * ge;
    const gRight = le - lowW * gt;
    if (gLeft <= 0 && gRight >= 0) return 0;
    return gRight < 0 ? gRight : gLeft;
  }

  function bestOpt() {
    let bestQ = pts[0], bestL = Infinity;
    for (const y of pts) {
      const l = lossDetail(y).total;
      if (l < bestL) { bestL = l; bestQ = y; }
    }
    return { q: bestQ, loss: bestL };
  }

  function resetTrace(newGuess = guess) {
    stopPlay();
    guess = Math.max(0, Math.min(70, r2(newGuess)));
    bounced = false;
    settled = subgrad(guess) === 0;
    lastStep = null;
    history = [{ step: 0, q: guess, loss: lossDetail(guess).total }];
  }

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function doStep() {
    const oldQ = guess;
    const oldD = lossDetail(oldQ);
    const g = subgrad(oldQ);
    if (g === 0) {
      settled = true;
      lastStep = { oldQ, g: 0, delta: 0, newQ: oldQ, oldLoss: oldD.total, newLoss: oldD.total };
      stopPlay();
      draw();
      return;
    }
    let delta = -lr * g;
    let nextQ = Math.max(0, Math.min(70, r2(oldQ + delta)));
    // Snap cleanly onto an optimal data point only when the step size is gentle
    if (lr <= 0.8 && Math.abs(delta) <= 1.0) {
      const lo = Math.min(oldQ, nextQ), hi = Math.max(oldQ, nextQ);
      for (const y of pts) {
        if (y >= lo && y <= hi && subgrad(y) === 0) {
          nextQ = y;
          delta = r2(nextQ - oldQ);
          break;
        }
      }
    }
    const newD = lossDetail(nextQ);
    if (newD.total > oldD.total + 0.05) bounced = true;
    guess = nextQ;
    settled = subgrad(guess) === 0;
    history.push({ step: history.length, q: guess, loss: newD.total });
    if (history.length > 80) history.shift();
    lastStep = { oldQ, g, delta: r2(delta), newQ: guess, oldLoss: oldD.total, newLoss: newD.total };
    if (settled) stopPlay();
    draw();
  }

  function togglePlay() {
    if (timer) { stopPlay(); draw(); return; }
    if (settled) resetTrace(START_Q[session]);
    playBtn.textContent = 'Pause';
    timer = setInterval(doStep, Math.round(1000 / speed));
    draw();
  }

  // UI skeleton
  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const statusPill = pill('STEP 0', C.amber);
  const playBtn = btn('Play', togglePlay);
  const btnMorn = btn('Morning', () => switchSession('morning'), 'go');
  const btnAft = btn('Afternoon', () => switchSession('afternoon'));

  const lowSlider = h('input', {
    type: 'range', min: 1, max: 9, step: 1, value: lowW,
    oninput: e => { lowW = +e.target.value; resetTrace(guess); draw(); }
  });
  const lowOut = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.pink } });

  const lrSlider = h('input', {
    type: 'range', min: 0.1, max: 2.0, step: 0.1, value: lr,
    oninput: e => { lr = +e.target.value; lrOut.textContent = fmt(lr); draw(); }
  });
  const lrOut = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan } }, fmt(lr));

  const spdSlider = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: speed,
    oninput: e => {
      speed = +e.target.value;
      spdOut.textContent = `${speed}/s`;
      if (timer) { clearInterval(timer); timer = setInterval(doStep, Math.round(1000 / speed)); }
    }
  });
  const spdOut = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.muted } }, `${speed}/s`);

  function switchSession(name) {
    session = name;
    isRandom = false;
    pts = CLINIC[name].slice();
    btnMorn.className = 'sim-btn ' + (name === 'morning' ? 'go' : '');
    btnAft.className = 'sim-btn ' + (name === 'afternoon' ? 'go' : '');
    resetTrace(START_Q[name]);
    draw();
  }

  function makeRandom() {
    isRandom = true;
    const base = session === 'morning' ? 5 : 10;
    const raw = [];
    for (let i = 0; i < 8; i++) raw.push(Math.round((base + rnd(0, 28)) / 5) * 5);
    raw.push(Math.min(65, Math.max(...raw) + rnd(10, 25)));
    pts = raw.sort((a, b) => a - b);
    resetTrace(Math.min(20, pts[1]));
    draw();
  }

  function resetAll() {
    lowW = 4; lowSlider.value = 4;
    lr = 0.5; lrSlider.value = 0.5; lrOut.textContent = '0.5';
    switchSession(session);
  }

  const sliderRow = (label, input, out) => h('div', { class: 'sim-row', style: { alignItems: 'center', marginTop: '.55rem' } },
    h('span', { style: { minWidth: '8.8rem', fontSize: '.92rem', color: '#cbd5f5' } }, label),
    input, out);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: quantile regression'),
    h('p', { class: 'sub' }, 'Drag the amber cutoff marker or any patient dot. Press Step or Play to watch the model slide toward the lowest token loss.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', doStep, 'go'),
          playBtn,
          btn('Reset', () => { resetTrace(START_Q[session]); draw(); }),
          statusPill),
        h('div', { class: 'sim-row' },
          btnMorn, btnAft,
          btn('New data (random)', makeRandom),
          btn('Clinic defaults', resetAll)),
        sliderRow('Low-guess penalty', lowSlider, lowOut),
        sliderRow('Step size (rate)', lrSlider, lrOut),
        sliderRow('Play speed', spdSlider, spdOut)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press Step or Play on Morning until the model settles at the lowest loss (150 tokens at 20 minutes).',
      check: st => st.session === 'morning' && !st.isRandom && st.lowW === 4 && st.steps > 0 && Math.abs(st.guess - 20) <= 0.15 && Math.round(st.loss) === 150,
      why: 'Yes! With 4 tokens for guessing low and 1 for guessing high, the lowest loss is 150 at 20 minutes, covering 8 of 9 morning waits.'
    },
    {
      text: 'Switch to Afternoon and press Play (or Step) to find the lowest-cost 80% cutoff.',
      check: st => st.session === 'afternoon' && !st.isRandom && st.lowW === 4 && st.steps > 0 && Math.abs(st.guess - 40) <= 0.15 && Math.round(st.loss) === 230,
      why: 'Right: the afternoon session settles at 40 minutes (230 tokens) — 20 minutes longer than the morning.'
    },
    {
      text: 'Switch to Morning, set Low-guess penalty to 1 (equal cost: 50% target), then fit. Where does it land?',
      check: st => st.session === 'morning' && !st.isRandom && st.lowW === 1 && st.steps > 0 && Math.abs(st.guess - 10) <= 0.15,
      why: 'Equal penalties (1 low, 1 high) give a 50% target share, so quantile regression lands on the median: 10 minutes.'
    },
    {
      text: 'Break learning on purpose: set Step size to 1.8 or higher, press Reset, and run at least 6 steps.',
      check: st => st.lr >= 1.8 && st.steps >= 6 && st.bounced,
      why: 'Too big a step size jumps past the lowest-cost cutoff over and over, so the loss curve bounces instead of settling.'
    }
  ]);

  // SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 470, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 28 : 48, X1 = VW - (NARROW ? 18 : 28);
  const AXIS_Y = 205;
  const DOT_R = NARROW ? 9 : 10;
  const STACK_DY = NARROW ? 22 : 24;
  const n2x = v => X0 + (v / 70) * (X1 - X0);
  const x2n = x => Math.max(0, Math.min(70, ((x - X0) / (X1 - X0)) * 70));

  // Loss-vs-iteration chart bounds
  const GX0 = NARROW ? 48 : 66, GX1 = X1, GY0 = 285, GY1 = 432;

  function dotCoords() {
    return pts.map((v, i) => {
      const up = pts.slice(0, i).filter(x => x === v).length;
      return { i, v, x: n2x(v), y: AXIS_Y - 22 - up * STACK_DY };
    });
  }

  // Drag either a patient dot or the amber cutoff marker
  let dragMode = null; // 'marker' | number (dot index)
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > 255) return;
    const coords = dotCoords();
    let hitDot = -1, bestDist = 22;
    for (const d of coords) {
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      if (dist < bestDist) { bestDist = dist; hitDot = d.i; }
    }
    const mx = n2x(guess);
    if (hitDot >= 0 && Math.abs(p.x - mx) > 14 || (hitDot >= 0 && p.y > 90 && Math.abs(p.x - mx) > 8)) {
      dragMode = hitDot;
    } else {
      dragMode = 'marker';
    }
    svg.setPointerCapture(e.pointerId);
    onDrag(e);
  });
  function onDrag(e) {
    if (dragMode === null) return;
    const p = toSvg(e);
    if (dragMode === 'marker') {
      resetTrace(r1(x2n(p.x)));
    } else {
      pts[dragMode] = Math.round(x2n(p.x));
      resetTrace(guess);
    }
    draw();
  }
  svg.addEventListener('pointermove', onDrag);
  svg.addEventListener('pointerup', () => {
    if (typeof dragMode === 'number') pts.sort((a, b) => a - b);
    dragMode = null;
    draw();
  });

  function draw() {
    const det = lossDetail(guess);
    const opt = bestOpt();
    const targetPct = Math.round((lowW / (lowW + 1)) * 100);
    const k = [];

    // Top panel title
    const sessCol = session === 'morning' ? C.cyan : C.violet;
    k.push(s('text', { x: X0, y: 22, fill: sessCol, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `${session.toUpperCase()} WAITS (${pts.length} PATIENTS)${isRandom ? ' · RANDOM' : ''}`));
    k.push(s('text', { x: X1, y: 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
      `covered: ${det.covered}/${pts.length} (${Math.round(det.covered / pts.length * 100)}%)`));

    // Shaded covered region to the left of cutoff
    const mx = n2x(guess);
    k.push(s('rect', { x: X0, y: 68, width: Math.max(0, mx - X0), height: AXIS_Y - 68, fill: C.green, 'fill-opacity': 0.07, rx: 4 }));

    // Axis and ticks
    k.push(s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let v = 0; v <= 70; v += 10) {
      const x = n2x(v);
      k.push(s('line', { x1: x, x2: x, y1: AXIS_Y - 5, y2: AXIS_Y + 5, stroke: C.muted, 'stroke-width': 2 }));
      k.push(s('text', { x, y: AXIS_Y + 21, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
    }
    k.push(s('text', { x: X1, y: AXIS_Y + 38, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'minutes'));

    // Gap lines from each dot to the marker
    const coords = dotCoords();
    for (const d of coords) {
      if (Math.abs(d.v - guess) > 0.2) {
        const isLow = d.v > guess;
        k.push(s('line', {
          x1: d.x, x2: mx, y1: d.y, y2: d.y,
          stroke: isLow ? C.pink : C.cyan,
          'stroke-width': isLow ? 2.4 : 1.3,
          'stroke-opacity': isLow ? 0.65 : 0.35,
          'stroke-dasharray': isLow ? '5 4' : '3 4'
        }));
      }
    }

    // Patient dots
    for (const d of coords) {
      const col = d.v > guess + 0.05 ? C.pink : (Math.abs(d.v - guess) <= 0.05 ? C.green : sessCol);
      k.push(s('circle', { cx: d.x, cy: d.y, r: DOT_R + 5, fill: col, 'fill-opacity': 0.16 }));
      k.push(s('circle', { cx: d.x, cy: d.y, r: DOT_R, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ew-resize' }));
    }

    // Value labels above each unique stack
    const topByVal = new Map();
    for (const d of coords) topByVal.set(d.v, d);
    for (const [v, d] of topByVal.entries()) {
      k.push(s('text', { x: d.x, y: d.y - DOT_R - 6, fill: C.ink, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
    }

    // Cutoff marker line and draggable pill handle
    const mCol = settled ? C.green : C.amber;
    k.push(s('line', { x1: mx, x2: mx, y1: 60, y2: AXIS_Y + 8, stroke: mCol, 'stroke-width': 3, 'stroke-dasharray': '7 5' }));
    const pw = 84 * F, ph = 25 * F;
    const px = Math.max(X0, Math.min(X1 - pw, mx - pw / 2));
    k.push(s('rect', { x: px, y: 34, width: pw, height: ph, rx: ph / 2, fill: C.bg, stroke: mCol, 'stroke-width': 2, style: 'cursor:ew-resize' }));
    k.push(s('text', { x: px + pw / 2, y: 34 + ph * 0.68, fill: mCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, `${fmt(r1(guess))} min`));

    // --- Bottom panel: Loss vs Iteration curve ---
    k.push(s('line', { x1: X0, x2: X1, y1: 256, y2: 256, stroke: C.line, 'stroke-width': 1 }));
    k.push(s('text', { x: GX0, y: 274, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS VS. ITERATION'));
    k.push(s('text', { x: GX1, y: 274, fill: C.green, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `best possible: ${fmt(r1(opt.loss))} (at ${opt.q}m)`));

    const maxStep = Math.max(10, history[history.length - 1].step);
    const minStep = history[0].step;
    const losses = history.map(h0 => h0.loss);
    const yMin = Math.max(0, Math.floor(Math.min(opt.loss, ...losses) * 0.85));
    const yMax = Math.max(yMin + 40, Math.ceil(Math.max(...losses, opt.loss + 30) * 1.08));
    const sx = st => GX0 + ((st - minStep) / Math.max(1, maxStep - minStep)) * (GX1 - GX0);
    const sy = lv => GY1 - ((lv - yMin) / (yMax - yMin)) * (GY1 - GY0);

    // Chart axes & horizontal grid
    k.push(s('rect', { x: GX0, y: GY0, width: GX1 - GX0, height: GY1 - GY0, fill: C.bg, 'fill-opacity': 0.45, rx: 6 }));
    for (let t = 0; t <= 2; t++) {
      const lv = Math.round(yMin + (t / 2) * (yMax - yMin));
      const y = sy(lv);
      k.push(s('line', { x1: GX0, x2: GX1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }));
      k.push(s('text', { x: GX0 - 7, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, lv));
    }

    // Best-possible dashed reference line
    const yBest = sy(opt.loss);
    k.push(s('line', { x1: GX0, x2: GX1, y1: yBest, y2: yBest, stroke: C.green, 'stroke-width': 1.5, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.75 }));

    // Polyline of loss over iterations
    if (history.length > 1) {
      const dStr = history.map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${sx(pt.step).toFixed(1)},${sy(pt.loss).toFixed(1)}`).join(' ');
      k.push(s('path', { d: dStr, fill: 'none', stroke: bounced ? C.pink : C.amber, 'stroke-width': 2.6 }));
    }
    for (const pt of history) {
      k.push(s('circle', { cx: sx(pt.step), cy: sy(pt.loss), r: 3.2, fill: C.amber }));
    }
    const last = history[history.length - 1];
    k.push(s('circle', { cx: sx(last.step), cy: sy(last.loss), r: 5.5, fill: settled ? C.green : C.amber, stroke: C.bg, 'stroke-width': 1.5 }));

    k.push(s('text', { x: GX0, y: GY1 + 18, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, `step ${minStep}`));
    k.push(s('text', { x: GX1, y: GY1 + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `step ${maxStep}`));

    svg.replaceChildren(...k);

    // Controls and readouts
    lowOut.textContent = `${lowW} low : 1 high → ${targetPct}%`;
    statusPill.textContent = `STEP ${last.step} · LOSS ${fmt(r1(det.total))}`;
    statusPill.style.color = settled ? C.green : (bounced ? C.pink : C.amber);
    statusPill.style.borderColor = statusPill.style.color;

    const lines = [
      [`target: ${lowW}/${lowW + 1} = ${targetPct}%   guess = ${fmt(r1(guess))} min`, C.amber],
      [`low:  ${fmt(r1(det.lowMin))}m × ${lowW} = ${fmt(r1(det.lowCost))}`, C.pink],
      [`high: ${fmt(r1(det.highMin))}m × 1 = ${fmt(r1(det.highCost))}`, C.cyan],
      [`total loss = ${fmt(r1(det.total))} tokens`, settled ? C.green : C.amber]
    ];
    if (lastStep) {
      const sign = lastStep.delta >= 0 ? '+' : '−';
      lines.push([`step: ${fmt(r1(lastStep.oldQ))} ${sign} ${fmt(r1(Math.abs(lastStep.delta)))} → ${fmt(r1(lastStep.newQ))}`, C.muted]);
    }
    fbox(box, lines);

    if (settled) {
      note.textContent = `Settled at ${fmt(r1(guess))} minutes (lowest loss: ${fmt(r1(det.total))} tokens). Drag a dot or change the penalty to test again.`;
    } else if (bounced && lr >= 1.5) {
      note.textContent = 'The step size is too large: the guess jumps past the best cutoff and the loss bounces up and down.';
    } else {
      const g = subgrad(guess);
      note.textContent = g < 0
        ? `Low-guess cost pulls harder (${det.nLow} dots right × ${lowW} vs ${det.nHigh} left × 1), so the next step moves RIGHT.`
        : `High-guess cost pulls harder (${det.nHigh} dots left × 1 vs ${det.nLow} right × ${lowW}), so the next step moves LEFT.`;
    }

    chal.update({
      session, isRandom, lowW, lr, guess,
      loss: det.total,
      steps: last.step,
      bounced, settled
    });
  }

  resetTrace(START_Q.morning);
  draw();
  return () => stopPlay();
}
