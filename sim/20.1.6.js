// 20.1.6 Try it: Token cross-entropy & iterative training.
// Drag the model's chances directly (to see the halving bar and −log₂(p) spike at 1%),
// or step / play gradient updates with a learning-rate knob and live loss-vs-step curve.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const WORDS = ['nine', 'ten', 'noon'];
  const COLORS = [C.cyan, C.violet, C.amber];
  const START_P = [0.125, 0.375, 0.50];
  const START_Q = [0.50, 0.25, 0.25];

  let q = START_Q.slice(); // true newsletter shares
  let z = START_P.map(x => Math.log(x)); // model logits
  let lr = 1.5;
  let speed = 3;
  let step = 0;
  let timer = null;
  let lastStep = null;
  let manualSteps = 0;
  let usedRandom = false;
  let diverged = false;

  const clampLogits = arr => {
    const mean = (arr[0] + arr[1] + arr[2]) / 3;
    return arr.map(v => Math.max(-10, Math.min(10, v - mean)));
  };
  const softmax = arr => {
    const m = Math.max(...arr);
    const ex = arr.map(v => Math.exp(v - m));
    const sum = ex[0] + ex[1] + ex[2];
    return ex.map(v => Math.max(1e-6, v / sum));
  };
  const tokenLoss = p => -Math.log2(Math.max(1e-6, p));
  const avgLoss = (p, target = q) => target.reduce((acc, qk, i) => acc - qk * Math.log2(Math.max(1e-6, p[i])), 0);
  const floorLoss = (target = q) => avgLoss(target, target);

  let history = [];
  let startAvg = 0;

  function initHistory() {
    const p = softmax(z);
    const a = avgLoss(p), l0 = tokenLoss(p[0]);
    step = 0;
    lastStep = null;
    startAvg = a;
    history = [{ step: 0, avg: a, nine: l0, p0: p[0] }];
  }
  initHistory();

  // DOM structure
  const svg = s('svg', { viewBox: '0 0 700 490' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const iterBadge = pill('STEP 0', C.cyan);
  const playBtn = btn('Play', togglePlay);
  const lrVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });

  const lrSlider = h('input', {
    type: 'range', min: '0.2', max: '12', step: '0.1', value: String(lr),
    style: { flex: '1 1 110px' },
    oninput: e => { lr = +e.target.value; draw(); }
  });
  const spSlider = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: String(speed),
    style: { flex: '1 1 90px' },
    oninput: e => { speed = +e.target.value; if (timer) { stop(); startPlay(); } draw(); }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: token cross-entropy & training'),
    h('p', { class: 'sub' }, 'Drag any word bar to change the model’s chance, or press Step / Play to watch training lower the loss step by step.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.5rem', justifyContent: 'space-between' } },
          pill('CONTEXT: "LIBRARY OPENS AT ___"', C.muted), iterBadge),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); doStep(true); }, 'go'),
          playBtn,
          btn('Reset', resetDefault),
          btn('New data (random)', newRandom),
          btn('Try 1% (trap)', () => { stop(); setProb(0, 0.01); })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Learning rate'),
          lrSlider, lrVal,
          h('span', { class: 'sim-note', style: { margin: 0, marginLeft: '.4rem' } }, 'Speed'),
          spSlider, spVal)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Drag the “nine” bar down to 1% (or press “Try 1% (trap)”). Watch how sharply the loss rises.',
      check: st => st.p0 <= 0.015,
      why: 'At 1%, −log₂(0.01) jumps to 6.64 bits. Cross-entropy strongly punishes confident wrong predictions.' },
    { text: 'Press Reset, then press Step 4 times. Watch “nine” climb toward 50% and the loss fall.',
      check: st => st.manualSteps >= 4 && st.avg < st.startAvg - 0.3,
      why: 'Each step adjusts the weights toward the true newsletter shares, lowering the loss bit by bit.' },
    { text: 'Will training still find the right shares on different newsletters? Press “New data”, predict where it stops, then press Play until it reaches the green floor.',
      check: st => st.usedRandom && st.step >= 3 && st.avg <= st.floor + 0.02,
      why: 'Yes! Matching the true shares of any newsletter mix always reaches the lowest possible average loss.' },
    { text: 'Break learning on purpose: raise Learning rate high and press Play (or Step) until the average loss jumps UP instead of falling.',
      check: st => st.diverged,
      why: 'With too big a learning rate, each update overshoots the target shares and bounces back and forth.' },
  ]);

  // Actions
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function startPlay() {
    if (timer) return;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= 40) { stop(); return; }
      doStep(false);
    }, Math.round(1000 / speed));
  }
  function togglePlay() {
    if (timer) stop();
    else {
      if (step >= 40) { initHistory(); }
      startPlay();
    }
  }
  function resetDefault() {
    stop();
    q = START_Q.slice();
    z = clampLogits(START_P.map(x => Math.log(x)));
    lr = 1.5;
    lrSlider.value = '1.5';
    manualSteps = 0;
    initHistory();
    draw();
  }
  function newRandom() {
    stop();
    const r0 = rnd(2, 7), r1 = rnd(1, 6), r2 = rnd(1, 6), tot = r0 + r1 + r2;
    q = [r0 / tot, r1 / tot, r2 / tot];
    const s0 = rnd(1, 6), s1 = rnd(1, 6), s2 = rnd(1, 6), stot = s0 + s1 + s2;
    z = clampLogits([s0 / stot, s1 / stot, s2 / stot].map(x => Math.log(x)));
    usedRandom = true;
    initHistory();
    draw();
  }
  function setProb(idx, targetVal) {
    const val = Math.max(0.01, Math.min(0.98, targetVal));
    const p = softmax(z);
    const others = [0, 1, 2].filter(i => i !== idx);
    const rem = 1 - val;
    const otherSum = p[others[0]] + p[others[1]];
    const next = [0, 0, 0];
    next[idx] = val;
    if (otherSum > 1e-6) {
      next[others[0]] = rem * (p[others[0]] / otherSum);
      next[others[1]] = rem * (p[others[1]] / otherSum);
    } else {
      next[others[0]] = rem / 2;
      next[others[1]] = rem / 2;
    }
    z = clampLogits(next.map(v => Math.log(Math.max(1e-5, v))));
    initHistory();
    draw();
  }
  function doStep(isManual) {
    const oldP = softmax(z);
    const oldAvg = avgLoss(oldP), oldNine = tokenLoss(oldP[0]);
    const grad = oldP.map((pk, i) => pk - q[i]);
    z = clampLogits(z.map((zk, i) => zk - lr * grad[i]));
    const newP = softmax(z);
    const newAvg = avgLoss(newP), newNine = tokenLoss(newP[0]);
    step++;
    if (isManual) manualSteps++;
    if (newAvg > oldAvg + 0.12) diverged = true;
    lastStep = { oldP0: oldP[0], newP0: newP[0], oldNine, newNine, oldAvg, newAvg, grad0: grad[0] };
    history.push({ step, avg: newAvg, nine: newNine, p0: newP[0] });
    draw();
  }

  // Geometry (responsive for phone and laptop)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 520 : 485, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const BX0 = NARROW ? 66 : 86, BX1 = VW - (NARROW ? 66 : 88);
  const BAR_Y0 = 26, BAR_H = 26, BAR_GAP = 14;
  const HALV_Y = BAR_Y0 + 3 * (BAR_H + BAR_GAP) + 22, HALV_H = 28;
  const GX0 = NARROW ? 46 : 62, GX1 = VW - 22;
  const GY0 = VH - 36, GY1 = HALV_Y + HALV_H + 56;

  // Pointer dragging on the 3 word probability bars
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    for (let i = 0; i < 3; i++) {
      const y = BAR_Y0 + i * (BAR_H + BAR_GAP);
      if (pt.y >= y - 6 && pt.y <= y + BAR_H + 6 && pt.x >= BX0 - 10 && pt.x <= BX1 + 14) {
        stop();
        dragging = i;
        svg.setPointerCapture(e.pointerId);
        setProb(i, (pt.x - BX0) / (BX1 - BX0));
        return;
      }
    }
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const pt = toSvg(e);
    setProb(dragging, (pt.x - BX0) / (BX1 - BX0));
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });

  const pct = x => (x * 100 >= 9.95 ? (x * 100).toFixed(1).replace(/\.0$/, '') : (x * 100).toFixed(1)) + '%';

  function draw() {
    const p = softmax(z);
    const curNine = tokenLoss(p[0]);
    const curAvg = avgLoss(p);
    const fl = floorLoss();
    const k = [];

    // Section 1: Draggable probability bars with true-share markers
    k.push(s('text', { x: BX0, y: 14, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
      'MODEL CHANCE (DRAG BARS)  ·  DASHED = TRUE NEWSLETTER SHARE'));

    for (let i = 0; i < 3; i++) {
      const y = BAR_Y0 + i * (BAR_H + BAR_GAP);
      const w = Math.max(3, (BX1 - BX0) * p[i]);
      const tx = BX0 + (BX1 - BX0) * q[i];
      const barCol = i === 0 && p[0] <= 0.05 ? C.pink : COLORS[i];
      k.push(
        s('text', { x: BX0 - 10, y: y + BAR_H * 0.68, fill: barCol, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, WORDS[i]),
        s('rect', { x: BX0, y, width: BX1 - BX0, height: BAR_H, rx: 6, fill: C.bg, stroke: C.line }),
        s('rect', { x: BX0, y: y + 2, width: w, height: BAR_H - 4, rx: 4, fill: barCol, 'fill-opacity': 0.82 }),
        s('line', { x1: tx, x2: tx, y1: y - 4, y2: y + BAR_H + 4, stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }),
        s('circle', { cx: BX0 + w, cy: y + BAR_H / 2, r: 6.5, fill: C.ink, stroke: barCol, 'stroke-width': 2 }),
        s('text', { x: BX1 + 10, y: y + BAR_H * 0.68, fill: barCol, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, pct(p[i]))
      );
    }

    // Section 2: Halving bar for "nine"
    const hw = Math.max(2, (BX1 - BX0) * p[0]);
    const hCol = p[0] <= 0.05 ? C.pink : (p[0] >= 0.45 ? C.green : C.amber);
    k.push(
      s('text', { x: BX0, y: HALV_Y - 7, fill: hCol, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `HALVING BAR FOR "NINE": ${fmt(curNine)} BITS`),
      s('rect', { x: BX0, y: HALV_Y, width: BX1 - BX0, height: HALV_H, rx: 6, fill: C.bg, stroke: C.line }),
      s('rect', { x: BX0, y: HALV_Y + 2, width: hw, height: HALV_H - 4, rx: 4, fill: hCol, 'fill-opacity': 0.78 })
    );
    for (const [frac, lab] of [[0.5, '1b'], [0.25, '2b'], [0.125, '3b'], [0.0625, '4b']]) {
      const cx = BX0 + (BX1 - BX0) * frac;
      k.push(
        s('line', { x1: cx, x2: cx, y1: HALV_Y, y2: HALV_Y + HALV_H, stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }),
        s('text', { x: cx, y: HALV_Y + HALV_H + 14, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, lab)
      );
    }
    k.push(s('text', { x: BX1, y: HALV_Y + HALV_H + 14, fill: C.green, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0b (100%)'));

    // Section 3: Growing loss-versus-iteration curve
    const maxStep = Math.max(8, step);
    const maxLoss = Math.max(3.5, ...history.map(h => Math.max(h.avg, h.nine))) * 1.08;
    const gx = st => GX0 + (st / maxStep) * (GX1 - GX0);
    const gy = ls => GY0 - (Math.min(ls, maxLoss) / maxLoss) * (GY0 - GY1);

    k.push(
      s('text', { x: GX0, y: GY1 - 12, fill: C.ink, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS VS STEP (BITS)'),
      s('text', { x: GX1, y: GY1 - 12, fill: C.cyan, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
        'CYAN = AVG LOSS · AMBER = NINE · GREEN = FLOOR')
    );

    const yStep = maxLoss > 6 ? 2 : 1;
    for (let lv = 0; lv <= Math.floor(maxLoss); lv += yStep) {
      const y = gy(lv);
      k.push(
        s('line', { x1: GX0, x2: GX1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: GX0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, lv)
      );
    }
    k.push(s('line', { x1: GX0, x2: GX0, y1: GY1, y2: GY0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: GX0, x2: GX1, y1: GY0, y2: GY0, stroke: C.muted, 'stroke-width': 1.5 }));

    // Green floor line
    const fy = gy(fl);
    k.push(
      s('line', { x1: GX0, x2: GX1, y1: fy, y2: fy, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '7 5' }),
      s('text', { x: GX1 - 4, y: fy - 6, fill: C.green, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `floor ${fmt(fl)} bits`)
    );

    // X ticks
    const xTickStep = maxStep <= 10 ? 1 : (maxStep <= 24 ? 4 : 5);
    for (let st = 0; st <= maxStep; st += xTickStep) {
      const x = gx(st);
      k.push(
        s('line', { x1: x, x2: x, y1: GY0, y2: GY0 + 5, stroke: C.muted }),
        s('text', { x, y: GY0 + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, st)
      );
    }

    // Curves: nine-only loss (amber) and average newsletter loss (cyan)
    if (history.length > 1) {
      const ninePts = history.map(pt => `${gx(pt.step).toFixed(1)},${gy(pt.nine).toFixed(1)}`).join(' ');
      const avgPts = history.map(pt => `${gx(pt.step).toFixed(1)},${gy(pt.avg).toFixed(1)}`).join(' ');
      k.push(
        s('polyline', { points: ninePts, fill: 'none', stroke: C.amber, 'stroke-width': 2.2, 'stroke-opacity': 0.8 }),
        s('polyline', { points: avgPts, fill: 'none', stroke: C.cyan, 'stroke-width': 3 })
      );
    }
    history.forEach((pt, idx) => {
      const isLast = idx === history.length - 1;
      k.push(
        s('circle', { cx: gx(pt.step), cy: gy(pt.nine), r: isLast ? 4.5 : 2.8, fill: C.amber }),
        s('circle', { cx: gx(pt.step), cy: gy(pt.avg), r: isLast ? 5.5 : 3.2, fill: C.cyan })
      );
    });

    svg.replaceChildren(...k);

    // Formula box & status readouts
    iterBadge.textContent = `STEP ${step}`;
    lrVal.textContent = lr.toFixed(1);
    spVal.textContent = `${speed}/s`;

    const lines = [
      [`true shares: ${pct(q[0])} / ${pct(q[1])} / ${pct(q[2])}`, C.muted],
      [`model:       ${pct(p[0])} / ${pct(p[1])} / ${pct(p[2])}`, C.ink],
      [`loss(nine) = −log₂(${p[0].toFixed(3)}) = ${fmt(curNine)} bits`, p[0] <= 0.05 ? C.pink : C.amber],
      [`avg loss   = ${fmt(curAvg)} bits  (floor ${fmt(fl)})`, curAvg <= fl + 0.02 ? C.green : C.cyan],
    ];
    if (lastStep) {
      const dp = (lastStep.newP0 - lastStep.oldP0) * 100;
      const sign = dp >= 0 ? '+' : '';
      const dl = lastStep.newAvg - lastStep.oldAvg;
      lines.push([
        `step ${step}: nine ${pct(lastStep.oldP0)} → ${pct(lastStep.newP0)} (${sign}${dp.toFixed(1)} pts)`,
        dl > 0.05 ? C.pink : C.green
      ]);
    }
    fbox(box, lines);

    if (lastStep && lastStep.newAvg > lastStep.oldAvg + 0.05) {
      note.textContent = 'The learning rate is too big: the update jumped past the target shares, so the average loss went UP!';
    } else if (p[0] <= 0.02) {
      note.textContent = 'Confident wrong trap: giving “nine” almost no chance makes its loss shoot past 6 bits.';
    } else if (curAvg <= fl + 0.02) {
      note.textContent = 'Settled! The model’s chances match the true newsletter shares, reaching the lowest possible average loss.';
    } else {
      note.textContent = 'Press Step to inspect one weight update, or Play to watch the loss curve fall toward the green floor.';
    }

    chal.update({ p0: p[0], step, manualSteps, avg: curAvg, startAvg, floor: fl, usedRandom, diverged });
  }

  draw();
  return () => stop();
}
