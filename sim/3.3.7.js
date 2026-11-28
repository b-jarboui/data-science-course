// 3.3.7 Try it: measurement error (random noise vs systematic rounding down).
// The learner drags recorded answers for 5 students (or uses -1 / +1), switches between
// random noise, rounding down to 0/5, and exact phone GPS, simulates 100 or 1,000 students,
// and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_TRUE = [23, 28, 34, 37, 28];
  const START_RAND = [25, 26, 35, 36, 28];
  const roundDown = x => Math.floor((x - 1) / 5) * 5;
  const r2 = x => Math.round(x * 100) / 100;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  let truth = START_TRUE.slice();
  let rec = START_RAND.slice();
  let sel = 0;
  let mode = 'random'; // 'random' | 'round' | 'exact' | 'custom'
  let size = 5;        // 5 | 100 | 1000
  let simData = null;  // { trueMean, recMean, avgErr, pts: [[n, runningMean], ...] }
  let progress = 1;
  let anim = 0;
  let sim1000Random = false;
  let sim1000Round = false;
  let exactFresh = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bRand = btn('Random noise', () => setMode('random'));
  const bRound = btn('Round down (0 or 5)', () => setMode('round'));
  const bExact = btn('Exact (phone GPS)', () => setMode('exact'));
  const bN5 = btn('5 students', () => setSize(5));
  const bN100 = btn('100 students', () => setSize(100));
  const bN1k = btn('1,000 students', () => setSize(1000));
  const bMinus = btn('−1 min', () => bump(-1));
  const bPlus = btn('+1 min', () => bump(1));
  const nudgeRow = h('div', { class: 'sim-row', style: { alignItems: 'center' } }, bMinus, bPlus, selLabel);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: random noise vs systematic push'),
    h('p', { class: 'sub' }, 'Cyan bars are the true trips from the phone. Drag any answer dot up or down (or tap a student and use −1 / +1), or test 100 and 1,000 students.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        nudgeRow,
        h('div', { class: 'sim-row' }, bRand, bRound, bExact),
        h('div', { class: 'sim-row' },
          bN5, bN100, bN1k,
          btn('New data', () => freshData()),
          btn('Start again', () => resetAll()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'With 5 students, adjust the answers so every student has an error, yet the recorded mean still equals the true mean.',
      check: st => st.size === 5 && st.allNonZero && st.sumErr === 0,
      why: 'Yes! Upward and downward errors cancel to zero, so individual mistakes do not move the mean.' },
    { text: 'Press “Round down (0 or 5)” with 5 students. Notice every arrow points down.',
      check: st => st.size === 5 && st.mode === 'round',
      why: 'Every error pushes the same way, so the errors pile up and pull the mean below the truth.' },
    { text: 'Try “1,000 students” with “Random noise”, and then with “Round down (0 or 5)”.',
      check: st => st.sim1000Random && st.sim1000Round,
      why: 'With 1,000 students, random noise cancels out near the true mean, while rounding down stays stuck about 3 minutes too low.' },
    { text: 'Switch to “Exact (phone GPS)” and press “New data”. Does the recorded mean match the truth?',
      check: st => st.exactFresh,
      why: 'Always. Measuring better removes the error at the source, instead of hoping more people will fix it.' },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 42 : 56, X1 = VW - 16, TOP = 36, BASE = 356;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);

  function applyRule5(rule) {
    if (rule === 'round') rec = truth.map(roundDown);
    else if (rule === 'exact') rec = truth.slice();
    else rec = truth.map(v => Math.max(10, Math.min(45, v + rnd(-4, 4))));
  }

  function runSim(n, rule) {
    const tr = Array.from({ length: n }, () => rnd(18, 42));
    const rc = tr.map(v => rule === 'round' ? roundDown(v) : rule === 'exact' ? v : v + rnd(-4, 4));
    const trueMean = avg(tr), recMean = avg(rc);
    const step = Math.max(1, Math.floor(n / 90));
    const pts = [];
    let runSum = 0;
    for (let i = 0; i < n; i++) {
      runSum += rc[i];
      if (i === 0 || (i + 1) % step === 0 || i === n - 1) pts.push([i + 1, runSum / (i + 1)]);
    }
    simData = { n, trueMean, recMean, avgErr: recMean - trueMean, pts };
    if (n === 1000 && rule === 'random') sim1000Random = true;
    if (n === 1000 && rule === 'round') sim1000Round = true;
    cancelAnimationFrame(anim);
    const t0 = performance.now();
    progress = 0;
    const tick = now => {
      const k = Math.min(1, (now - t0) / 650);
      progress = k * (2 - k);
      draw();
      if (k < 1) anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  function setMode(m) {
    mode = m;
    if (size === 5) {
      if (m === 'random' && truth.join() === START_TRUE.join()) rec = START_RAND.slice();
      else applyRule5(m);
      draw();
    } else {
      runSim(size, m);
    }
  }

  function setSize(n) {
    size = n;
    if (n === 5) {
      cancelAnimationFrame(anim);
      if (mode === 'custom') mode = 'random';
      draw();
    } else {
      const rule = mode === 'custom' ? 'random' : mode;
      mode = rule;
      runSim(n, rule);
    }
  }

  function freshData() {
    if (mode === 'exact') exactFresh = true;
    if (size === 5) {
      truth = Array.from({ length: 5 }, () => rnd(18, 42));
      const rule = mode === 'custom' ? 'random' : mode;
      mode = rule;
      applyRule5(rule);
      draw();
    } else {
      const rule = mode === 'custom' ? 'random' : mode;
      mode = rule;
      runSim(size, rule);
    }
  }

  function resetAll() {
    cancelAnimationFrame(anim);
    truth = START_TRUE.slice();
    rec = START_RAND.slice();
    sel = 0;
    mode = 'random';
    size = 5;
    simData = null;
    progress = 1;
    draw();
  }

  function bump(d) {
    if (size !== 5) return;
    rec[sel] = Math.max(10, Math.min(45, rec[sel] + d));
    mode = 'custom';
    draw();
  }

  // Drag a student's recorded answer dot up or down (5-student mode)
  let dragging = -1;
  const YMIN5 = 10, YMAX5 = 45;
  const val2y5 = v => BASE - (v - YMIN5) / (YMAX5 - YMIN5) * (BASE - TOP);
  const y2val5 = y => Math.round(YMIN5 + (BASE - y) / (BASE - TOP) * (YMAX5 - YMIN5));
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    if (size !== 5) return;
    const p = toSvg(e), sl = (X1 - X0) / 5, i = Math.floor((p.x - X0) / sl);
    if (i < 0 || i >= 5) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0 || size !== 5) return;
    const p = toSvg(e);
    rec[dragging] = Math.max(YMIN5, Math.min(YMAX5, y2val5(p.y)));
    mode = 'custom';
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function syncButtons() {
    const set = (el, active) => { el.className = 'sim-btn ' + (active ? 'go' : ''); };
    set(bRand, mode === 'random');
    set(bRound, mode === 'round');
    set(bExact, mode === 'exact');
    set(bN5, size === 5);
    set(bN100, size === 100);
    set(bN1k, size === 1000);
    nudgeRow.style.display = size === 5 ? 'flex' : 'none';
  }

  function svgArrow(k, x, y0, y1, color) {
    const dy = y1 - y0, dist = Math.abs(dy), dir = dy >= 0 ? 1 : -1;
    const tipY = dist > 14 ? y1 - dir * 6 : y1;
    const hh = Math.min(10, dist * 0.55), hw = Math.min(7, hh * 0.78);
    k.push(
      s('line', { x1: x, x2: x, y1: y0, y2: tipY, stroke: color, 'stroke-width': 3 }),
      s('line', { x1: x - hw, x2: x, y1: tipY - dir * hh, y2: tipY, stroke: color, 'stroke-width': 3 }),
      s('line', { x1: x + hw, x2: x, y1: tipY - dir * hh, y2: tipY, stroke: color, 'stroke-width': 3 })
    );
  }

  function drawPill(k, x, y, label, color) {
    const w = Math.max(88, label.length * 9.2 + 20) * F, hgt = 24 * F;
    k.push(
      s('rect', { x, y: y - hgt / 2, width: w, height: hgt, rx: hgt / 2, fill: C.bg, stroke: color, 'stroke-width': 1.5 }),
      s('text', { x: x + w / 2, y: y + 5 * F, fill: color, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, label)
    );
  }

  function draw5() {
    const sl = (X1 - X0) / 5, dx = Math.min(26, sl * 0.2), bw = Math.min(24, sl * 0.2);
    const k = [];
    for (let g = 10; g <= 45; g += 5) {
      const y = val2y5(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-dasharray': '4 5' }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }));

    const errs = truth.map((t, i) => rec[i] - t);
    const tMean = avg(truth), rMean = avg(rec), sumErr = errs.reduce((a, b) => a + b, 0);

    // Mean lines
    const yT = val2y5(tMean), yR = val2y5(rMean);
    const rCol = mode === 'round' ? C.pink : mode === 'exact' ? C.cyan : sumErr === 0 ? C.green : C.amber;
    k.push(
      s('line', { x1: X0, x2: X1, y1: yT, y2: yT, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
      s('line', { x1: X0, x2: X1, y1: yR, y2: yR, stroke: rCol, 'stroke-width': 2.5 })
    );

    // 5 students
    truth.forEach((tv, i) => {
      const rv = rec[i], err = errs[i], cx = X0 + sl * (i + 0.5);
      const tx = cx - dx, rx = cx + dx, yt = val2y5(tv), yr = val2y5(rv);
      if (i === sel) k.push(s('rect', { x: cx - sl / 2 + 4, y: TOP - 10, width: sl - 8, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': 0.04, rx: 8 }));
      // True bar + dot
      k.push(
        s('rect', { x: tx - bw / 2, y: yt, width: bw, height: Math.max(0, BASE - yt), fill: C.cyan, 'fill-opacity': 0.25, stroke: C.cyan, 'stroke-width': 1.2, rx: 2 }),
        s('circle', { cx: tx, cy: yt, r: 5.5, fill: C.cyan }),
        s('text', { x: tx, y: yt - 10, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tv),
        s('line', { x1: tx + 6, x2: rx, y1: yt, y2: yt, stroke: C.muted, 'stroke-width': 1.3 })
      );
      // Error arrow or exact ring
      const eCol = err > 0 ? C.green : err < 0 ? C.pink : C.green;
      if (err !== 0) svgArrow(k, rx, yt, yr, eCol);
      else k.push(s('circle', { cx: rx, cy: yr, r: 10, fill: 'none', stroke: C.green, 'stroke-width': 2 }));
      // Recorded dot + label
      const dotCol = mode === 'round' ? C.pink : mode === 'exact' ? C.cyan : C.amber;
      k.push(
        s('circle', { cx: rx, cy: yr, r: 12, fill: dotCol, 'fill-opacity': 0.16 }),
        s('circle', { cx: rx, cy: yr, r: 6.5, fill: dotCol }),
        s('text', { x: rx, y: err >= 0 ? yr - 12 : yr + 20, fill: dotCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, rv)
      );
      // Student index and error badge below baseline
      const eTxt = err > 0 ? `+${err}` : err < 0 ? `−${Math.abs(err)}` : '0';
      k.push(
        s('text', { x: cx, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `#${i + 1}`),
        s('text', { x: cx, y: BASE + 44, fill: err === 0 ? C.muted : eCol, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, eTxt)
      );
    });

    // Place TRUE pill on left, RECORDED pill on right so they never collide even when equal
    drawPill(k, X0 + 6, Math.max(TOP + 14, yT - 16), `TRUE ${fmt(r2(tMean))}`, C.cyan);
    const recLab = `ANSWERS ${fmt(r2(rMean))}`;
    const recW = Math.max(88, recLab.length * 9.2 + 20) * F;
    drawPill(k, X1 - recW - 4, Math.max(TOP + 14, yR - 16), recLab, rCol);

    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 70, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' },
      'Cyan = true trip (phone)  ·  Dot = recorded answer  ·  Arrow = error'));
    svg.replaceChildren(...k);

    const eStr = errs.map(e => e > 0 ? `+${e}` : e < 0 ? `−${Math.abs(e)}` : '0').join(', ');
    const sumStr = sumErr > 0 ? `+${sumErr}` : sumErr < 0 ? `−${Math.abs(sumErr)}` : '0';
    fbox(box, [
      ['recorded = true + error', C.muted],
      `true mean     = ${fmt(r2(tMean))} min`,
      `errors        = ${eStr}`,
      `total error   = ${sumStr} min`,
      [`recorded mean = ${fmt(r2(rMean))} min`, rCol]
    ]);
    note.textContent = sumErr === 0
      ? 'The errors cancel to 0, so the recorded mean matches the true mean.'
      : sumErr < 0
        ? `Errors sum to ${sumStr}, pulling the mean ${fmt(r2(tMean - rMean))} min below the truth.`
        : `Errors sum to ${sumStr}, pulling the mean ${fmt(r2(rMean - tMean))} min above the truth.`;
    const se = errs[sel], seTxt = se > 0 ? `+${se}` : se < 0 ? `−${Math.abs(se)}` : '0';
    selLabel.textContent = `Selected: #${sel + 1} (true ${truth[sel]}, answer ${rec[sel]}, error ${seTxt})`;

    chal.update({
      size, mode, sumErr,
      allNonZero: errs.every(e => e !== 0),
      sim1000Random, sim1000Round, exactFresh
    });
  }

  function drawSim() {
    const d = simData;
    const YMIN = 22, YMAX = 36;
    const vy = v => BASE - (Math.max(YMIN, Math.min(YMAX, v)) - YMIN) / (YMAX - YMIN) * (BASE - TOP);
    const vx = n => X0 + (n - 1) / Math.max(1, d.n - 1) * (X1 - X0);
    const col = mode === 'round' ? C.pink : mode === 'exact' ? C.cyan : C.green;
    const k = [];

    for (const g of [24, 27, 30, 33]) {
      const y = vy(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-dasharray': '4 5' }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 })
    );
    for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
      const nTick = Math.max(1, Math.round(frac * d.n));
      const x = X0 + frac * (X1 - X0);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE - 4, y2: BASE + 5, stroke: C.muted }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, nTick.toLocaleString())
      );
    }
    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 48, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'number of students'));

    const yT = vy(d.trueMean);
    k.push(s('line', { x1: X0, x2: X1, y1: yT, y2: yT, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }));

    const shown = Math.max(2, Math.round(d.pts.length * progress));
    const slice = d.pts.slice(0, shown);
    const poly = slice.map(([n, m]) => `${vx(n).toFixed(1)},${vy(m).toFixed(1)}`).join(' ');
    const last = slice[slice.length - 1];
    const lx = vx(last[0]), ly = vy(last[1]);

    k.push(
      s('polyline', { points: poly, fill: 'none', stroke: col, 'stroke-width': 3.2, 'stroke-linejoin': 'round' }),
      s('circle', { cx: lx, cy: ly, r: 11, fill: col, 'fill-opacity': 0.2 }),
      s('circle', { cx: lx, cy: ly, r: 5.5, fill: col })
    );

    if (progress > 0.95 && Math.abs(d.avgErr) > 0.6) {
      svgArrow(k, X1 - 24, yT, ly, col);
      k.push(s('text', { x: X1 - 34, y: (yT + ly) / 2 + 5, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `${d.avgErr > 0 ? '+' : '−'}${fmt(r2(Math.abs(d.avgErr)))}`));
    }

    drawPill(k, X0 + 8, Math.max(TOP + 14, yT - 18), `TRUE ${fmt(r2(d.trueMean))}`, C.cyan);
    const rLab = `MEAN ${fmt(r2(last[1]))}`;
    const rW = Math.max(88, rLab.length * 9.2 + 20) * F;
    drawPill(k, X1 - rW - 4, Math.min(BASE - 18, Math.max(TOP + 16, ly + (last[1] < d.trueMean ? 20 : -20))), rLab, col);
    svg.replaceChildren(...k);

    const ruleName = mode === 'round' ? 'round down (0 or 5)' : mode === 'exact' ? 'exact (phone GPS)' : 'random noise (±4)';
    const gap = d.avgErr;
    const gapStr = Math.abs(gap) < 0.005 ? '0' : `${gap > 0 ? '+' : '−'}${fmt(r2(Math.abs(gap)))} min`;
    fbox(box, [
      `students      = ${d.n.toLocaleString()}`,
      `rule          = ${ruleName}`,
      `true mean     = ${fmt(r2(d.trueMean))} min`,
      `average error = ${gapStr}`,
      [`recorded mean = ${fmt(r2(d.recMean))} min`, col]
    ]);
    note.textContent = mode === 'round'
      ? `Even with ${d.n.toLocaleString()} students, every student still rounds down, so the mean stays stuck below the truth.`
      : mode === 'exact'
        ? `With exact phone times, every error is zero — the recorded mean matches the truth.`
        : `With ${d.n.toLocaleString()} students, random up-and-down guesses cancel out and the mean hugs the truth.`;

    chal.update({
      size, mode, sumErr: 0, allNonZero: false,
      sim1000Random, sim1000Round, exactFresh
    });
  }

  function draw() {
    syncButtons();
    if (size === 5) draw5();
    else drawSim();
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
