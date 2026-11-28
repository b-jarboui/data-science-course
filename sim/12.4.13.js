// 12.4.13 Try it: Paired model comparison with the bootstrap.
// Tap any of the 12 pump cards to adjust Tool A or Tool B predictions, step through bootstrap
// rounds one by one or press Play to grow the histogram and watch the 95% interval settle.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const WHITE = '#FFFFFF';
  const BLUE = '#58A6FF';
  const PURPLE = C.violet;

  // Fixed chapter 12.4 twelve water pumps
  const START = [
    { id: 1,  act: 12, a: 18, b: 14 },
    { id: 2,  act: 8,  a: 8,  b: 10 },
    { id: 3,  act: 14, a: 14, b: 12 },
    { id: 4,  act: 6,  a: 8,  b: 7  },
    { id: 5,  act: 16, a: 15, b: 14 },
    { id: 6,  act: 20, a: 22, b: 20 },
    { id: 7,  act: 18, a: 17, b: 20 },
    { id: 8,  act: 22, a: 22, b: 21 },
    { id: 9,  act: 24, a: 25, b: 24 },
    { id: 10, act: 26, a: 24, b: 25 },
    { id: 11, act: 28, a: 28, b: 28 },
    { id: 12, act: 30, a: 31, b: 30 },
  ];

  const clone = arr => arr.map(p => ({ ...p }));
  let pumps = clone(START);
  let sel = 0;
  let isDefault = true;
  let usedRandom = false;

  // Bootstrap state (exact integer sums -> O(1) memory & microsecond quantiles at 10,000+ rounds)
  let rounds = 0;
  let stepsClicked = 0;
  let sumCounts = new Map();
  let lastDraw = null;       // array of 12 pump indices from most recent round
  let lastCounts = null;     // length-12 array of how many times each pump was drawn
  let lastSum = 0;
  let history = [];          // [{ r, lo, hi }] for stabilizing interval strip
  let playing = false;
  let raf = 0;
  let speedLevel = 4;        // 1..10 (slow 1/s up to fast ~400/s)
  let carry = 0;
  let lastTs = 0;

  const diffOf = p => Math.abs(p.a - p.act) - Math.abs(p.b - p.act);
  const fmtS = v => v > 0 ? `+${fmt(v)}` : v < 0 ? `−${fmt(Math.abs(v))}` : '0';
  const dCol = v => v > 0 ? PURPLE : v < 0 ? BLUE : C.muted;
  const r2 = x => Math.round(x * 100) / 100;

  const svg = s('svg', { viewBox: '0 0 700 520' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selInfo = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('Play', togglePlay, 'go');
  const speedVal = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '5.5rem' } });
  const speedSlider = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: speedLevel,
    'aria-label': 'Simulation speed',
    oninput: e => { speedLevel = +e.target.value; updateSpeedLabel(); }
  });

  const rates = [1, 3, 8, 20, 45, 90, 180, 320, 520, 800]; // rounds per second
  function updateSpeedLabel() {
    speedVal.textContent = `Speed: ${rates[speedLevel - 1]}/s`;
  }
  updateSpeedLabel();

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: paired bootstrap comparison'),
    h('p', { class: 'sub' }, 'Tap a pump card to change Tool A or Tool B’s prediction. Press Step to draw twelve cards with replacement, or Play to grow the histogram and watch the 95% interval settle.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step (1 round)', () => { stopPlay(); runRounds(1, true); draw(); }, 'go'),
          playBtn,
          btn('Reset rounds', () => { stopPlay(); resetBootstrap(); draw(); }),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, speedVal, speedSlider)
        ),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Tool A −1', () => bumpPred('a', -1)),
          btn('Tool A +1', () => bumpPred('a', 1)),
          btn('Tool B −1', () => bumpPred('b', -1)),
          btn('Tool B +1', () => bumpPred('b', 1)),
          selInfo
        ),
        h('div', { class: 'sim-row' },
          btn('New pumps (random)', newRandomPumps),
          btn('Start again (lesson pumps)', () => {
            stopPlay();
            pumps = clone(START);
            sel = 0;
            isDefault = true;
            resetBootstrap();
            draw();
          })
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const chal = challenges(ch, [
    {
      text: 'On the lesson pumps, press “Step (1 round)” three times and watch how repeats change each round’s mean.',
      check: st => st.isDefault && st.stepsClicked >= 3,
      why: 'Yes! Each round draws 12 cards with replacement, so some pumps repeat, others are skipped, and the round mean moves.'
    },
    {
      text: 'Press “Play” (raise Speed if you like) until at least 1,000 rounds finish. Check whether zero sits inside the 95% interval.',
      check: st => st.isDefault && st.rounds >= 1000,
      why: 'Right: the 95% interval settles near −0.67 to +1.25 hours and includes zero, so these 12 pumps do not give convincing evidence.'
    },
    {
      text: 'Tap pump cards and adjust Tool A or Tool B’s predictions, then run at least 500 rounds so the 95% interval lies completely above zero.',
      check: st => st.rounds >= 500 && st.ciLo != null && st.ciLo > 0,
      why: 'Nice! When Tool B consistently beats Tool A across the pumps, the entire 95% interval stays above zero.'
    },
    {
      text: 'Press “New pumps (random)” and run at least 500 rounds on a fresh set of twelve pumps.',
      check: st => st.usedRandom && st.rounds >= 500,
      why: 'Fresh pumps give a new observed difference and a new bootstrap interval — the same check tests whether the gap is convincing or could be chance.'
    }
  ]);

  function resetBootstrap() {
    rounds = 0;
    sumCounts = new Map();
    lastDraw = null;
    lastCounts = null;
    lastSum = 0;
    history = [];
    carry = 0;
  }

  function bumpPred(which, delta) {
    stopPlay();
    pumps[sel][which] = Math.max(0, Math.min(40, pumps[sel][which] + delta));
    isDefault = false;
    resetBootstrap();
    draw();
  }

  function newRandomPumps() {
    stopPlay();
    // Randomly vary whether there is a real bias or near-tie so learners see both outcomes
    const biasB = [-2, -1, 0, 0, 1, 2][rnd(0, 5)];
    pumps = Array.from({ length: 12 }, (_, i) => {
      const act = rnd(6, 30);
      const errA = rnd(0, 5);
      const errB = Math.max(0, Math.min(6, errA - biasB + rnd(-2, 2)));
      const sA = Math.random() < 0.5 ? -1 : 1;
      const sB = Math.random() < 0.5 ? -1 : 1;
      return {
        id: i + 1,
        act,
        a: Math.max(0, act + sA * errA),
        b: Math.max(0, act + sB * errB)
      };
    });
    isDefault = false;
    usedRandom = true;
    resetBootstrap();
    draw();
  }

  function percentileFromCounts(p) {
    if (rounds === 0) return null;
    const keys = Array.from(sumCounts.keys()).sort((a, b) => a - b);
    const pos = p * (rounds - 1);
    const k0 = Math.floor(pos), k1 = Math.ceil(pos);
    let acc = 0, v0 = null, v1 = null;
    for (const k of keys) {
      acc += sumCounts.get(k);
      if (v0 === null && acc > k0) v0 = k / 12;
      if (v1 === null && acc > k1) { v1 = k / 12; break; }
    }
    return v0 + (v1 - v0) * (pos - k0);
  }

  function runRounds(count, isManualStep = false) {
    const diffs = pumps.map(diffOf);
    for (let r = 0; r < count; r++) {
      let s0 = 0;
      const drawIdx = (r === count - 1) ? new Array(12) : null;
      const counts = (r === count - 1) ? new Array(12).fill(0) : null;
      for (let k = 0; k < 12; k++) {
        const pick = Math.floor(Math.random() * 12);
        s0 += diffs[pick];
        if (drawIdx) { drawIdx[k] = pick; counts[pick]++; }
      }
      rounds++;
      sumCounts.set(s0, (sumCounts.get(s0) || 0) + 1);
      if (drawIdx) {
        lastDraw = drawIdx;
        lastCounts = counts;
        lastSum = s0;
      }
      if (rounds >= 20 && (rounds <= 60 ? rounds % 5 === 0 : rounds <= 400 ? rounds % 25 === 0 : rounds <= 2000 ? rounds % 100 === 0 : rounds % 500 === 0)) {
        history.push({ r: rounds, lo: percentileFromCounts(0.025), hi: percentileFromCounts(0.975) });
        if (history.length > 80) history.shift();
      }
    }
    if (isManualStep) stepsClicked++;
  }

  function stopPlay() {
    playing = false;
    cancelAnimationFrame(raf);
    playBtn.textContent = 'Play';
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    playing = true;
    playBtn.textContent = 'Pause';
    lastTs = performance.now();
    carry = 0;
    const tick = now => {
      if (!playing) return;
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      carry += dt * rates[speedLevel - 1];
      const n = Math.floor(carry);
      if (n > 0) {
        carry -= n;
        runRounds(Math.min(n, 250));
        draw();
      }
      if (rounds >= 10000) { stopPlay(); draw(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 580 : 510;
  const F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // Card grid bounds (clickable)
  const COLS = NARROW ? 4 : 6, ROWS = NARROW ? 3 : 2;
  const GX0 = 10, GY0 = 10, GW = VW - 20;
  const CGAP = NARROW ? 6 : 8;
  const CW = (GW - CGAP * (COLS - 1)) / COLS;
  const CH = NARROW ? 66 : 64;
  const cardRects = [];

  svg.addEventListener('pointerdown', e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    for (let i = 0; i < cardRects.length; i++) {
      const b = cardRects[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        sel = i;
        draw();
        return;
      }
    }
  });

  function draw() {
    const diffs = pumps.map(diffOf);
    const obsSum = diffs.reduce((a, b) => a + b, 0);
    const obsMean = obsSum / 12;
    const ciLo = rounds >= 20 ? percentileFromCounts(0.025) : null;
    const ciHi = rounds >= 20 ? percentileFromCounts(0.975) : null;

    const els = [];
    cardRects.length = 0;

    // 1. Twelve clickable pump cards
    pumps.forEach((p, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = GX0 + col * (CW + CGAP), y = GY0 + row * (CH + CGAP);
      cardRects.push({ x, y, w: CW, h: CH });
      const d = diffs[i], dc = dCol(d);
      const picked = lastCounts ? lastCounts[i] : null;
      const isSel = i === sel;
      const dim = picked === 0 ? 0.45 : 1;

      els.push(
        s('rect', {
          x, y, width: CW, height: CH, rx: 8,
          fill: C.bg, 'fill-opacity': dim,
          stroke: isSel ? C.cyan : (picked > 0 ? C.amber : '#344264'),
          'stroke-width': isSel ? 2.5 : (picked > 0 ? 1.8 : 1.2),
          style: 'cursor:pointer'
        }),
        // Small pump icon glyph
        s('rect', { x: x + 7, y: y + 9, width: 10, height: 7, rx: 1.5, fill: C.cyan, 'fill-opacity': 0.35 * dim, stroke: C.cyan, 'stroke-width': 1 }),
        s('circle', { cx: x + 20, cy: y + 12.5, r: 4.2, fill: C.cyan, 'fill-opacity': 0.25 * dim, stroke: C.cyan, 'stroke-width': 1 }),
        s('text', { x: x + 29, y: y + 16, fill: C.ink, 'fill-opacity': dim, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `P${p.id}`),
        // Errors line
        s('text', { x: x + CW / 2, y: y + 35, fill: BLUE, 'fill-opacity': dim, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `A:${Math.abs(p.a - p.act)}  `),
        s('text', { x: x + CW / 2 + 19 * F, y: y + 35, fill: PURPLE, 'fill-opacity': dim, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `B:${Math.abs(p.b - p.act)}`),
        // Signed paired difference
        s('text', { x: x + CW / 2, y: y + 55, fill: dc, 'fill-opacity': dim, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmtS(d))
      );

      // Draw count badge from the last bootstrap round (shows replacement & repeats!)
      if (picked != null && picked > 0) {
        els.push(
          s('rect', { x: x + CW - 24, y: y + 4, width: 20, height: 15, rx: 7, fill: C.amber }),
          s('text', { x: x + CW - 14, y: y + 15, fill: '#0b1020', 'font-size': 10.5, 'font-weight': 800, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `×${picked}`)
        );
      }
    });

    // 2. Growing bootstrap histogram
    const HY_TOP = GY0 + ROWS * (CH + CGAP) + 28;
    const H_BASE = VH - 118;
    const H_MAX = H_BASE - HY_TOP - 28;
    const HX0 = 36, HX1 = VW - 20;

    // Dynamic x-range that always includes 0, observed mean, and all observed bootstrap sums
    let minV = Math.min(-1.5, obsMean - 0.8);
    let maxV = Math.max(1.8, obsMean + 0.8);
    for (const k of sumCounts.keys()) {
      const mv = k / 12;
      if (mv - 0.25 < minV) minV = mv - 0.25;
      if (mv + 0.25 > maxV) maxV = mv + 0.25;
    }
    minV = Math.floor(minV * 2) / 2;
    maxV = Math.ceil(maxV * 2) / 2;
    const vx = v => HX0 + (v - minV) / (maxV - minV) * (HX1 - HX0);

    // Header row: round counter + verdict badge
    const verdict = ciLo == null
      ? { txt: 'RUN 20+ ROUNDS FOR 95% CI', col: C.muted }
      : (ciLo > 0 ? { txt: 'ABOVE 0 · TOOL B BETTER', col: PURPLE }
        : (ciHi < 0 ? { txt: 'BELOW 0 · TOOL A BETTER', col: BLUE }
          : { txt: 'INCLUDES 0 · NOT CONVINCING', col: C.amber }));

    els.push(
      s('text', { x: HX0, y: HY_TOP - 8, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `ROUNDS: ${rounds.toLocaleString()}`),
      s('text', { x: HX1, y: HY_TOP - 8, fill: verdict.col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, verdict.txt)
    );

    // Axis + ticks
    els.push(s('line', { x1: HX0, x2: HX1, y1: H_BASE, y2: H_BASE, stroke: C.muted, 'stroke-width': 2 }));
    const stepTick = (maxV - minV) > 5 ? 1 : 0.5;
    for (let v = Math.ceil(minV / stepTick) * stepTick; v <= maxV + 1e-6; v += stepTick) {
      const tx = vx(v), isZ = Math.abs(v) < 1e-6;
      els.push(
        s('line', { x1: tx, x2: tx, y1: H_BASE - 4, y2: H_BASE + 5, stroke: isZ ? WHITE : C.muted, 'stroke-width': isZ ? 2 : 1.3 }),
        s('text', { x: tx, y: H_BASE + 19, fill: isZ ? WHITE : C.muted, 'font-size': 11.5 * F, 'font-weight': isZ ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, isZ ? '0' : fmtS(r2(v)))
      );
    }
    els.push(
      s('text', { x: HX0, y: H_BASE + 34, fill: BLUE, 'font-size': 11 * F, 'font-family': 'Consolas' }, '← Tool A better'),
      s('text', { x: HX1, y: H_BASE + 34, fill: PURPLE, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'Tool B better →')
    );

    // Vertical reference lines: 0 and observed mean
    const xZero = vx(0), xObs = vx(obsMean);
    els.push(
      s('line', { x1: xZero, x2: xZero, y1: HY_TOP + 6, y2: H_BASE, stroke: WHITE, 'stroke-opacity': 0.55, 'stroke-width': 1.8, 'stroke-dasharray': '5 5' }),
      s('line', { x1: xObs, x2: xObs, y1: HY_TOP + 20, y2: H_BASE, stroke: C.cyan, 'stroke-opacity': 0.75, 'stroke-width': 1.8, 'stroke-dasharray': '3 4' }),
      s('text', { x: xObs, y: HY_TOP + 15, fill: C.cyan, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `obs ${fmtS(r2(obsMean))}`)
    );

    // Histogram bars (bin width = 2/12 = 1/6 hour -> zero discrete aliasing)
    if (rounds > 0) {
      const bins = new Map();
      let maxCnt = 1;
      for (const [sumK, cnt] of sumCounts.entries()) {
        const b = Math.floor(sumK / 2);
        const nxt = (bins.get(b) || 0) + cnt;
        bins.set(b, nxt);
        if (nxt > maxCnt) maxCnt = nxt;
      }
      const bw = Math.max(4, (vx(1 / 6) - vx(0)) * 0.86);
      for (const [b, cnt] of bins.entries()) {
        const center = (2 * b + 0.5) / 12;
        const hBar = Math.max(4, (cnt / maxCnt) * H_MAX);
        const inside = ciLo == null || (center >= ciLo && center <= ciHi);
        const col = ciLo == null ? C.cyan : (inside ? C.cyan : C.pink);
        els.push(s('rect', {
          x: vx(center) - bw / 2, y: H_BASE - hBar, width: bw, height: hBar, rx: 2,
          fill: col, 'fill-opacity': inside ? 0.78 : 0.38
        }));
      }

      // Highlight latest single-round mean dot
      if (lastDraw) {
        const lm = lastSum / 12;
        els.push(s('circle', {
          cx: vx(lm), cy: H_BASE - 7, r: 5.5,
          fill: C.amber, stroke: '#0b1020', 'stroke-width': 1.5
        }));
      }
    } else {
      els.push(s('text', { x: (HX0 + HX1) / 2, y: H_BASE - H_MAX * 0.45, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        'Press Step or Play to draw bootstrap rounds'));
    }

    // 95% confidence interval bracket
    if (ciLo != null && ciHi != null) {
      const xL = vx(ciLo), xR = vx(ciHi), yCI = HY_TOP + 34;
      const col = (ciLo > 0 || ciHi < 0) ? C.green : C.amber;
      els.push(
        s('line', { x1: xL, x2: xL, y1: yCI, y2: H_BASE, stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
        s('line', { x1: xR, x2: xR, y1: yCI, y2: H_BASE, stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
        s('line', { x1: xL, x2: xR, y1: yCI, y2: yCI, stroke: col, 'stroke-width': 4 }),
        s('line', { x1: xL, x2: xL, y1: yCI - 6, y2: yCI + 6, stroke: col, 'stroke-width': 2.5 }),
        s('line', { x1: xR, x2: xR, y1: yCI - 6, y2: yCI + 6, stroke: col, 'stroke-width': 2.5 }),
        s('text', { x: xL - 4, y: yCI - 9, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmtS(r2(ciLo))),
        s('text', { x: xR + 4, y: yCI - 9, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, fmtS(r2(ciHi)))
      );
    }

    // 3. Stabilizing 95% interval strip (replaces training-loss curve for non-training bootstrap)
    const SY0 = H_BASE + 52, SH_STRIP = 56, SY1 = SY0 + SH_STRIP;
    const sy = v => SY1 - ((v - minV) / (maxV - minV)) * SH_STRIP;
    els.push(
      s('rect', { x: HX0, y: SY0, width: HX1 - HX0, height: SH_STRIP, rx: 6, fill: C.bg, stroke: C.line }),
      s('line', { x1: HX0, x2: HX1, y1: sy(0), y2: sy(0), stroke: WHITE, 'stroke-opacity': 0.35, 'stroke-dasharray': '4 4' }),
      s('text', { x: HX0 + 6, y: SY0 + 13, fill: C.muted, 'font-size': 10.5 * F, 'font-family': 'Consolas' }, '95% interval bounds as rounds grow (dashed = 0)')
    );
    if (history.length >= 2) {
      const maxR = Math.max(100, history[history.length - 1].r);
      const sx = r => HX0 + 6 + (r / maxR) * (HX1 - HX0 - 12);
      const ptsLo = history.map(pt => `${sx(pt.r).toFixed(1)},${sy(pt.lo).toFixed(1)}`).join(' ');
      const ptsHi = history.map(pt => `${sx(pt.r).toFixed(1)},${sy(pt.hi).toFixed(1)}`).join(' ');
      els.push(
        s('polyline', { points: ptsLo, fill: 'none', stroke: BLUE, 'stroke-width': 2 }),
        s('polyline', { points: ptsHi, fill: 'none', stroke: PURPLE, 'stroke-width': 2 })
      );
    }

    svg.replaceChildren(...els);

    // Formula box
    const lines = [
      ['Observed (12 pumps):', C.muted],
      `sum = ${fmtS(obsSum)} h  |  mean = ${fmtS(r2(obsMean))} h`
    ];
    if (rounds > 0 && lastDraw) {
      const lastMean = lastSum / 12;
      const listStr = lastDraw.map(idx => fmtS(diffs[idx])).join(',');
      lines.push(
        [`Round #${rounds.toLocaleString()} drawn diffs:`, C.cyan],
        listStr,
        [`sum = ${fmtS(lastSum)}  →  mean = ${fmtS(r2(lastMean))} h`, dCol(lastSum)]
      );
      if (ciLo != null && ciHi != null) {
        const inc0 = ciLo <= 0 && ciHi >= 0;
        lines.push([`95% CI: [${fmtS(r2(ciLo))}, ${fmtS(r2(ciHi))}] h`, inc0 ? C.amber : C.green]);
      } else {
        lines.push(['Run 20+ rounds to show 95% CI', C.muted]);
      }
    } else {
      lines.push(['Press Step or Play to start', C.amber]);
    }
    fbox(box, lines);

    const sp = pumps[sel];
    const sEa = Math.abs(sp.a - sp.act), sEb = Math.abs(sp.b - sp.act);
    selInfo.textContent = `Selected P${sp.id} (Actual ${sp.act}h · A:${sp.a} err ${sEa} · B:${sp.b} err ${sEb} · diff ${fmtS(sEa - sEb)})`;

    note.textContent = ciLo == null
      ? 'Positive difference means Tool B had the smaller error; negative means Tool A did better.'
      : (ciLo > 0
        ? 'Zero is below the 95% interval: Tool B makes convincingly smaller mistakes on these pumps.'
        : (ciHi < 0
          ? 'Zero is above the 95% interval: Tool A makes convincingly smaller mistakes on these pumps.'
          : 'Zero lies inside the 95% interval: these 12 pumps do not give convincing evidence that either tool is better overall.'));

    chal.update({ isDefault, usedRandom, stepsClicked, rounds, ciLo, ciHi });
  }

  draw();
  return () => stopPlay();
}
