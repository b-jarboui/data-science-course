// 15.1.3 Try it: epsilon-greedy selection.
// Spin the wheel step by step or run Play with a speed slider, adjust epsilon (0% to 100%),
// watch live return-rate estimates and cumulative regret grow, test fresh data, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';

  // Simulation state (default hidden rates match chapters/15.1.md: A = 50%, B = 70%)
  let trueA = 0.50, trueB = 0.70;
  let initA = [1], initB = [0];
  let histA = [], histB = [];
  let eps = 25;
  let steps = 0, cumRegret = 0, regretSeries = [0];
  let bestCount = 0, worseCount = 0;
  let lastStep = null, lastAngle = -Math.PI * 0.75;
  let showTrue = false, newDataUsed = false;
  let speed = 5, timer = null;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 610 : 460;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const epsVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.violet } });
  const epsSlider = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: eps,
    style: { flex: '1 1 130px', accentColor: C.violet },
    oninput: e => { eps = +e.target.value; draw(); }
  });

  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const spdSlider = h('input', {
    type: 'range', min: 1, max: 25, step: 1, value: speed,
    style: { width: '100px', accentColor: C.cyan },
    oninput: e => { speed = +e.target.value; if (timer) { stopPlay(); startPlay(); } draw(); }
  });

  const playBtn = btn('Play', () => (timer ? stopPlay() : startPlay()));
  const trueBtn = btn('Show true rates', () => { showTrue = !showTrue; trueBtn.textContent = showTrue ? 'Hide true rates' : 'Show true rates'; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: epsilon-greedy wheel'),
    h('p', { class: 'sub' }, 'Drag ε to resize the random slice of the wheel. Press Step (or tap the wheel) to serve one learner, or press Play to watch estimates and regret over many learners.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('strong', { style: { fontFamily: 'Consolas, monospace', color: C.violet } }, 'ε'),
          epsSlider, epsVal),
        h('div', { class: 'sim-row' },
          btn('Step', () => doStep(), 'go'),
          playBtn,
          btn('Reset', () => resetRun()),
          btn('New data', () => makeNewData()),
          trueBtn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'),
          spdSlider, spdVal)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Keep ε at 25%. Press Step (or Play) until the app chooses Prompt B at least once.',
      check: st => st.eps === 25 && st.steps > 0 && st.nB > 1,
      why: 'Yes! The 25% random slice gave Prompt B a chance, even though it started at 0%.'
    },
    {
      text: 'Set ε to 0%, press Reset, then run at least 20 steps. Watch whether the app ever tests the other prompt.',
      check: st => st.eps === 0 && st.steps >= 20 && (st.nA === 1 || st.nB === 1),
      why: 'With ε = 0% there is no exploration. The app gets stuck on the first prompt that looked good and never discovers the better one.'
    },
    {
      text: 'Set ε to 100%, press Reset, and run at least 30 steps. Watch the regret curve climb.',
      check: st => st.eps === 100 && st.steps >= 30,
      why: 'At 100% every choice is random. The app learns both rates, but keeps picking the weaker prompt half the time so regret climbs fast.'
    },
    {
      text: 'Press "New data", set ε between 10% and 30%, and run at least 60 steps so the app chooses the better prompt more often.',
      check: st => st.newDataUsed && st.eps >= 10 && st.eps <= 30 && st.steps >= 60 && st.bestCount > st.worseCount,
      why: 'Great! A small ε discovers whichever prompt is truly better on fresh data and bends the regret curve flatter.'
    }
  ]);

  function resetRun() {
    stopPlay();
    histA = initA.slice();
    histB = initB.slice();
    steps = 0;
    cumRegret = 0;
    regretSeries = [0];
    bestCount = 0;
    worseCount = 0;
    lastStep = null;
    lastAngle = -Math.PI * 0.75;
    draw();
  }

  function makeNewData() {
    const low = rnd(25, 50) / 100;
    const high = rnd(65, 85) / 100;
    if (Math.random() < 0.5) {
      trueA = low; trueB = high;
      initA = [1]; initB = [0];
    } else {
      trueA = high; trueB = low;
      initA = [0]; initB = [1];
    }
    newDataUsed = true;
    resetRun();
  }

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function startPlay() {
    if (timer) return;
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      if (steps >= 200) { stopPlay(); return; }
      doStep();
    }, Math.max(35, Math.round(1000 / speed)));
  }

  const winsA = () => histA.reduce((a, b) => a + b, 0);
  const winsB = () => histB.reduce((a, b) => a + b, 0);
  const estA = () => histA.length ? winsA() / histA.length : 0;
  const estB = () => histB.length ? winsB() / histB.length : 0;

  function doStep() {
    const eA = estA(), eB = estB();
    const pRand = eps / 100;
    const u = Math.random();
    const isRandom = u < pRand;
    let choice, reason;

    // Angle for visual pointer (0 = 12 o'clock, clockwise in radians)
    if (isRandom) {
      const span = pRand * Math.PI * 2;
      lastAngle = -Math.PI / 2 + (0.15 + 0.7 * Math.random()) * span;
      choice = Math.random() < 0.5 ? 'A' : 'B';
      reason = 'random';
    } else {
      const span = pRand * Math.PI * 2;
      const greedySpan = Math.PI * 2 - span;
      lastAngle = -Math.PI / 2 + span + (0.12 + 0.76 * Math.random()) * greedySpan;
      if (Math.abs(eA - eB) < 1e-9) { choice = 'A'; reason = 'greedy (tie → A)'; }
      else if (eA > eB) { choice = 'A'; reason = 'greedy (A higher)'; }
      else { choice = 'B'; reason = 'greedy (B higher)'; }
    }

    const rateTrue = choice === 'A' ? trueA : trueB;
    const reward = Math.random() < rateTrue ? 1 : 0;
    if (choice === 'A') histA.push(reward);
    else histB.push(reward);

    const bestTrue = Math.max(trueA, trueB);
    const stepRegret = Math.max(0, bestTrue - rateTrue);
    cumRegret = Math.round((cumRegret + stepRegret) * 10000) / 10000;
    steps += 1;
    regretSeries.push(cumRegret);
    if (stepRegret < 1e-9) bestCount += 1;
    else worseCount += 1;

    lastStep = { step: steps, isRandom, reason, choice, reward, stepRegret };
    draw();
  }

  // Click wheel area to advance one step
  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const pt = p.matrixTransform(svg.getScreenCTM().inverse());
    const wx = NARROW ? 102 : 116, wy = NARROW ? 96 : 126, wr = NARROW ? 68 : 82;
    if (Math.hypot(pt.x - wx, pt.y - wy) <= wr + 8) doStep();
  });

  function sectorPath(cx, cy, r, startDeg, sweepDeg) {
    const a0 = (startDeg - 90) * Math.PI / 180;
    const a1 = (startDeg + sweepDeg - 90) * Math.PI / 180;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
  }

  function drawRewardIcon(out, cx, cy, r, val) {
    if (val === 1) {
      out.push(
        s('circle', { cx, cy, r, fill: C.green, 'fill-opacity': 0.24, stroke: C.green, 'stroke-width': 1.6 }),
        s('path', { d: `M ${cx - r * 0.45} ${cy} L ${cx - r * 0.1} ${cy + r * 0.38} L ${cx + r * 0.5} ${cy - r * 0.36}`, fill: 'none', stroke: C.green, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      );
    } else {
      out.push(
        s('circle', { cx, cy, r, fill: C.muted, 'fill-opacity': 0.16, stroke: C.muted, 'stroke-width': 1.5 }),
        s('line', { x1: cx - r * 0.38, y1: cy - r * 0.38, x2: cx + r * 0.38, y2: cy + r * 0.38, stroke: C.muted, 'stroke-width': 1.6 }),
        s('line', { x1: cx - r * 0.38, y1: cy + r * 0.38, x2: cx + r * 0.38, y2: cy - r * 0.38, stroke: C.muted, 'stroke-width': 1.6 })
      );
    }
  }

  function drawCard(out, x, y, w, hgt, name, sub, color, isQuiz, hist, trueRate, highlight) {
    const wins = hist.reduce((a, b) => a + b, 0);
    const n = hist.length;
    const rate = n ? wins / n : 0;
    const pct = Math.round(rate * 100);

    out.push(s('rect', {
      x, y, width: w, height: hgt, rx: 12,
      fill: C.bg, stroke: highlight ? C.ink : color,
      'stroke-width': highlight ? 2.6 : 1.8
    }));

    // Icon
    const ix = x + 22, iy = y + 22;
    if (isQuiz) {
      out.push(
        s('rect', { x: ix - 10, y: iy - 10, width: 20, height: 20, rx: 4, fill: color, 'fill-opacity': 0.18, stroke: color, 'stroke-width': 1.5 }),
        s('text', { x: ix, y: iy + 5, fill: color, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?')
      );
    } else {
      out.push(
        s('circle', { cx: ix, cy: iy, r: 10, fill: color, 'fill-opacity': 0.18, stroke: color, 'stroke-width': 1.5 }),
        s('line', { x1: ix, y1: iy, x2: ix, y2: iy - 6, stroke: color, 'stroke-width': 1.6 }),
        s('line', { x1: ix, y1: iy, x2: ix + 5, y2: iy + 1, stroke: color, 'stroke-width': 1.6 })
      );
    }

    out.push(
      s('text', { x: ix + 18, y: iy + 5, fill: color, 'font-size': 15, 'font-weight': 700, 'font-family': '"Segoe UI", sans-serif' }, name),
      s('text', { x: ix + 92, y: iy + 5, fill: C.muted, 'font-size': 12.5, 'font-family': '"Segoe UI", sans-serif' }, sub),
      s('text', { x: x + w - 14, y: iy + 5, fill: C.muted, 'font-size': 13.5, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${wins} / ${n}`)
    );

    // Recent reward dots (up to 16 fit cleanly)
    const maxDots = NARROW ? 13 : 16;
    const shown = hist.slice(-maxDots);
    const dotR = 7.5, dotGap = (w - 32) / maxDots;
    shown.forEach((v, i) => drawRewardIcon(out, x + 20 + i * dotGap, y + 50, dotR, v));
    if (hist.length > maxDots) {
      out.push(s('text', { x: x + w - 14, y: y + 54, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, `+${hist.length - maxDots}`));
    }

    // Return-rate bar
    const bx = x + 14, by = y + hgt - 24, bw = w - 82, bh = 14;
    out.push(
      s('rect', { x: bx, y: by, width: bw, height: bh, rx: 5, fill: '#141d38', stroke: C.line, 'stroke-width': 1 }),
      s('rect', { x: bx, y: by, width: Math.max(2, bw * rate), height: bh, rx: 5, fill: color, 'fill-opacity': 0.85 }),
      s('text', { x: x + w - 14, y: by + 12, fill: color, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${pct}%`)
    );

    if (showTrue) {
      const tx = bx + bw * trueRate;
      out.push(
        s('line', { x1: tx, y1: by - 4, x2: tx, y2: by + bh + 4, stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '3 2' }),
        s('text', { x: Math.min(bx + bw - 14, Math.max(bx + 18, tx)), y: by - 6, fill: C.ink, 'font-size': 10.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `true ${Math.round(trueRate * 100)}%`)
      );
    }
  }

  function draw() {
    const k = [];
    const wx = NARROW ? 102 : 116, wy = NARROW ? 96 : 126, wr = NARROW ? 64 : 78;

    // 1. Epsilon-greedy wheel
    k.push(s('circle', { cx: wx, cy: wy, r: wr, fill: C.amber, 'fill-opacity': 0.28, stroke: C.ink, 'stroke-width': 2 }));
    if (eps === 100) {
      k.push(s('circle', { cx: wx, cy: wy, r: wr, fill: C.violet, 'fill-opacity': 0.50, stroke: C.ink, 'stroke-width': 2 }));
    } else if (eps > 0) {
      k.push(s('path', { d: sectorPath(wx, wy, wr, 0, eps * 3.6), fill: C.violet, 'fill-opacity': 0.50, stroke: C.violet, 'stroke-width': 1.5 }));
    }
    k.push(s('circle', { cx: wx, cy: wy, r: wr, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));

    // Wheel slice text
    if (eps >= 15 && eps < 100) {
      const midA = (eps * 1.8 - 90) * Math.PI / 180;
      k.push(s('text', {
        x: wx + wr * 0.52 * Math.cos(midA), y: wy + wr * 0.52 * Math.sin(midA) + 4,
        fill: C.violet, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `${eps}%`));
    }
    if (eps <= 85 && eps > 0) {
      const midG = ((eps * 3.6 + 360) / 2 - 90) * Math.PI / 180;
      k.push(s('text', {
        x: wx + wr * 0.48 * Math.cos(midG), y: wy + wr * 0.48 * Math.sin(midG) + 4,
        fill: C.amber, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `${100 - eps}%`));
    }
    if (eps === 0) {
      k.push(s('text', { x: wx, y: wy + 5, fill: C.amber, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '100% BEST'));
    } else if (eps === 100) {
      k.push(s('text', { x: wx, y: wy + 5, fill: C.violet, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '100% RAND'));
    }

    // Pointer needle
    const px = wx + wr * 0.78 * Math.cos(lastAngle), py = wy + wr * 0.78 * Math.sin(lastAngle);
    k.push(
      s('line', { x1: wx, y1: wy, x2: px, y2: py, stroke: C.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round' }),
      s('circle', { cx: px, cy: py, r: 4.5, fill: lastStep ? (lastStep.isRandom ? C.violet : C.amber) : C.ink }),
      s('circle', { cx: wx, cy: wy, r: 5, fill: C.ink })
    );

    // Iteration counter & spin caption
    const stepText = `STEP ${steps}`;
    if (NARROW) {
      k.push(
        s('rect', { x: 192, y: 26, width: 210, height: 136, rx: 12, fill: C.bg, stroke: C.line }),
        s('text', { x: 208, y: 54, fill: C.cyan, 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, stepText),
        s('text', { x: 208, y: 78, fill: C.amber, 'font-size': 13, 'font-family': 'Consolas' }, `best:   ${100 - eps}%`),
        s('text', { x: 208, y: 98, fill: C.violet, 'font-size': 13, 'font-family': 'Consolas' }, `random: ${eps}%`),
        s('text', { x: 208, y: 124, fill: lastStep ? (lastStep.choice === 'A' ? C.cyan : ORANGE) : C.muted, 'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas' },
          lastStep ? `last: ${lastStep.isRandom ? 'RAND' : 'BEST'} → ${lastStep.choice}` : 'tap wheel or Step'),
        s('text', { x: 208, y: 146, fill: lastStep ? (lastStep.reward ? C.green : C.muted) : C.muted, 'font-size': 13, 'font-family': 'Consolas' },
          lastStep ? (lastStep.reward ? 'returned (+1)' : 'no return (0)') : '')
      );
    } else {
      k.push(
        s('text', { x: wx, y: 28, fill: C.cyan, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, stepText),
        s('text', { x: wx, y: wy + wr + 22, fill: C.muted, 'font-size': 12.5, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          lastStep ? `${lastStep.isRandom ? 'RANDOM' : 'GREEDY'} → ${lastStep.choice} (${lastStep.reward ? '+1' : '0'})` : 'tap wheel or Step')
      );
    }

    // 2. Prompt cards
    if (NARROW) {
      drawCard(k, 14, 184, 392, 98, 'Prompt A', 'Quiz', C.cyan, true, histA, trueA, lastStep?.choice === 'A');
      drawCard(k, 14, 294, 392, 98, 'Prompt B', 'Reminder', ORANGE, false, histB, trueB, lastStep?.choice === 'B');
    } else {
      drawCard(k, 232, 20, 452, 102, 'Prompt A', 'Quiz', C.cyan, true, histA, trueA, lastStep?.choice === 'A');
      drawCard(k, 232, 134, 452, 102, 'Prompt B', 'Reminder', ORANGE, false, histB, trueB, lastStep?.choice === 'B');
    }

    // 3. Cumulative regret vs step curve
    const gx0 = NARROW ? 46 : 56, gx1 = VW - 18;
    const gy0 = NARROW ? 446 : 292, gy1 = NARROW ? 566 : 420;
    const gw = gx1 - gx0, gh = gy1 - gy0;
    const maxS = Math.max(20, steps);
    const gap = Math.abs(trueA - trueB);
    const maxR = Math.max(4, Math.ceil(Math.max(cumRegret, maxS * gap * 0.5) * 1.1));
    const avgReg = steps ? cumRegret / steps : 0;

    k.push(
      s('rect', { x: 14, y: gy0 - 34, width: VW - 28, height: gh + 66, rx: 12, fill: C.bg, stroke: C.line }),
      s('text', { x: 26, y: gy0 - 12, fill: C.pink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'CUMULATIVE REGRET'),
      s('text', { x: VW - 24, y: gy0 - 12, fill: C.ink, 'font-size': 12.5, 'text-anchor': 'end', 'font-family': 'Consolas' },
        `total ${fmt(cumRegret)}  ·  avg ${avgReg.toFixed(3)}/step`)
    );

    // Grid + y ticks
    for (let t = 0; t <= 2; t++) {
      const val = (maxR * t) / 2;
      const y = gy1 - (gh * t) / 2;
      k.push(
        s('line', { x1: gx0, x2: gx1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x: gx0 - 6, y: y + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(val))
      );
    }
    k.push(
      s('line', { x1: gx0, x2: gx0, y1: gy0, y2: gy1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: gx0, x2: gx1, y1: gy1, y2: gy1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (gx0 + gx1) / 2, y: gy1 + 22, fill: C.muted, 'font-size': 11.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `iterations (0 to ${maxS})`)
    );

    // Reference dashed line: always picking the weaker prompt
    const refEndR = Math.min(maxR, steps * gap);
    if (steps > 0) {
      const refX = gx0 + (steps / maxS) * gw;
      const refY = gy1 - (refEndR / maxR) * gh;
      k.push(s('line', { x1: gx0, y1: gy1, x2: refX, y2: refY, stroke: C.muted, 'stroke-width': 1.3, 'stroke-dasharray': '5 5' }));
    }

    // Live cumulative regret polyline
    const pts = regretSeries.map((r, i) => `${(gx0 + (i / maxS) * gw).toFixed(1)},${(gy1 - Math.min(1, r / maxR) * gh).toFixed(1)}`).join(' ');
    k.push(s('polyline', { points: pts, fill: 'none', stroke: C.pink, 'stroke-width': 2.8, 'stroke-linejoin': 'round' }));
    if (steps > 0) {
      const lx = gx0 + (steps / maxS) * gw;
      const ly = gy1 - Math.min(1, cumRegret / maxR) * gh;
      k.push(s('circle', { cx: lx, cy: ly, r: 4.5, fill: C.pink }));
    }

    svg.replaceChildren(...k);

    // Update control labels
    epsSlider.value = eps;
    epsVal.textContent = `ε = ${eps}% (${100 - eps}% best)`;
    spdVal.textContent = `${speed} step${speed === 1 ? '' : 's'}/s`;

    // Formula box: live step numbers
    const lines = [];
    if (!lastStep) {
      lines.push(['Start: 1 observation per prompt', C.muted]);
      lines.push([`Prompt A: ${winsA()}/${histA.length} = ${Math.round(estA() * 100)}%`, C.cyan]);
      lines.push([`Prompt B: ${winsB()}/${histB.length} = ${Math.round(estB() * 100)}%`, ORANGE]);
      lines.push([`rule: ${100 - eps}% best, ${eps}% random`, C.amber]);
    } else {
      lines.push([`Step ${lastStep.step}  ·  ${lastStep.reason}`, lastStep.isRandom ? C.violet : C.amber]);
      lines.push([`chose ${lastStep.choice}  →  reward = ${lastStep.reward}`, lastStep.reward ? C.green : C.muted]);
      lines.push([`A: ${winsA()}/${histA.length} (${Math.round(estA() * 100)}%)   B: ${winsB()}/${histB.length} (${Math.round(estB() * 100)}%)`, C.ink]);
      lines.push([`regret +${fmt(lastStep.stepRegret)}  ·  total ${fmt(cumRegret)}`, lastStep.stepRegret > 0 ? C.pink : C.green]);
    }
    if (showTrue) {
      lines.push([`true rates: A = ${Math.round(trueA * 100)}%, B = ${Math.round(trueB * 100)}%`, C.muted]);
    }
    fbox(box, lines);

    note.textContent = eps === 0
      ? 'ε = 0% (pure greedy): never explores the lower-looking prompt.'
      : eps === 100
        ? 'ε = 100% (pure random): explores forever, even after learning which prompt is better.'
        : 'Regret measures expected reward lost compared with always picking the better prompt. Flatter curve = better learning.';

    chal.update({
      eps, steps, nA: histA.length, nB: histB.length,
      bestCount, worseCount, newDataUsed
    });
  }

  resetRun();
  return () => stopPlay();
}
