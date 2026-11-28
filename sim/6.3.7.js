// 6.3.7 Try it: Markov chain Monte Carlo (a walker draws the hill).
// Tap or drag on the rate line to set the start, adjust step size, step one by one
// or run thousands of steps, switch to random hills, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // --- target hill factory (exact Beta(5, 15) or fresh random hill) ----------
  function makeBetaHill(a, b, label, isShop = false) {
    const raw = r => (r <= 0.001 || r >= 0.999) ? 0 : Math.pow(r, a - 1) * Math.pow(1 - r, b - 1);
    return finalizeHill(raw, label, isShop);
  }
  function makeBumpyHill(m1, m2, w1, w2) {
    const raw = r => (r <= 0.01 || r >= 0.99) ? 0
      : w1 * Math.exp(-Math.pow((r - m1) / 0.09, 2)) + w2 * Math.exp(-Math.pow((r - m2) / 0.09, 2));
    return finalizeHill(raw, 'Two-bump mystery hill', false);
  }
  function finalizeHill(raw, label, isShop) {
    const G = 1000;
    const vals = new Float64Array(G);
    let area = 0;
    for (let i = 0; i < G; i++) {
      const r = (i + 0.5) / G;
      vals[i] = raw(r);
      area += vals[i] / G;
    }
    let mean = 0, cdf = 0, lo = 0, hi = 1, maxH = 0, gotLo = false, gotHi = false;
    for (let i = 0; i < G; i++) {
      const r = (i + 0.5) / G;
      const d = vals[i] / area;
      if (d > maxH) maxH = d;
      mean += r * d / G;
      cdf += d / G;
      if (!gotLo && cdf >= 0.025) { lo = r; gotLo = true; }
      if (!gotHi && cdf >= 0.975) { hi = r; gotHi = true; }
    }
    return {
      label, isShop, maxH,
      trueMean: mean * 100, trueLo: lo * 100, trueHi: hi * 100,
      density: r => raw(r) / area
    };
  }
  function randomHill() {
    if (Math.random() < 0.35) {
      const m1 = rnd(20, 34) / 100, m2 = rnd(58, 74) / 100;
      return makeBumpyHill(m1, m2, rnd(7, 12) / 10, rnd(5, 10) / 10);
    }
    const a = rnd(3, 10), b = rnd(5, 18);
    return makeBetaHill(a, b, `Random Beta(${a}, ${b})`, false);
  }

  // --- simulation state ------------------------------------------------------
  const SHOP_HILL = makeBetaHill(5, 15, 'Beta(5, 15)', true);
  const N_BINS = 25, BW = 1 / N_BINS;
  let hill = SHOP_HILL;
  let startPct = 25, stepPct = 10, showTrue = true;
  let cur = 0.25, steps = 0, accepted = 0, singleSteps = 0;
  let bins = new Array(N_BINS).fill(0);
  let samples = [];
  let last = null; // { from, prop, hOld, hNew, ratio, moved }
  let anim = 0;

  // --- UI layout -------------------------------------------------------------
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 430, F = NARROW ? 1.22 : 1;
  const X0 = NARROW ? 36 : 48, X1 = VW - 16, BASE = 374, TOP = 42;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });

  const startVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const stepVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const startSlider = h('input', {
    type: 'range', min: 5, max: 95, step: 1, value: startPct,
    style: { flex: '1 1 120px', accentColor: C.amber },
    oninput: e => { startPct = +e.target.value; resetChain(); }
  });
  const stepSlider = h('input', {
    type: 'range', min: 1, max: 30, step: 1, value: stepPct,
    style: { flex: '1 1 120px', accentColor: C.cyan },
    oninput: e => { stepPct = +e.target.value; draw(); }
  });
  const toggleBtn = btn('Hide true hill', () => {
    showTrue = !showTrue;
    toggleBtn.textContent = showTrue ? 'Hide true hill' : 'Show true hill';
    draw();
  }, 'ghost');

  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: MCMC walker'),
    h('p', { class: 'sub' }, 'The walker stands on the rate line, proposes a nearby spot, always climbs, and sometimes steps down. Tap or drag on the chart to move the start.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Start:'), startSlider, startVal),
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Step size:'), stepSlider, stepVal),
        h('div', { class: 'sim-row' },
          btn('Step once', () => { cancelAnimationFrame(anim); takeStep(true); draw(); }, 'go'),
          btn('+50 steps', () => runBurst(50, 2)),
          btn('+1,000 steps', () => runBurst(1000, 40)),
          btn('New data (random hill)', () => { hill = randomHill(); resetChain(); }),
          btn('Reset footprints', () => resetChain()),
          btn('Shop hill: Beta(5, 15)', () => { hill = SHOP_HILL; startPct = 25; stepPct = 10; startSlider.value = 25; stepSlider.value = 10; resetChain(); }),
          toggleBtn)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // --- challenges (self-checking, easy to deeper) ----------------------------
  const chal = challenges(ch, [
    {
      text: 'Press “Step once” 5 times. Watch how higher proposals always move, while lower ones move only sometimes.',
      check: st => st.singleSteps >= 5,
      why: 'Yes! Every step compares only two heights: new ÷ old. Higher spots are always accepted; lower spots are accepted with chance new ÷ old.'
    },
    {
      text: 'On the shop hill Beta(5, 15), take at least 2,000 steps (with step size 8% to 15%). See how close the footprint mean gets to 25%.',
      check: st => st.isShop && st.steps >= 2000 && st.stepSize >= 8 && st.stepSize <= 15 && Math.abs(st.mean - 25) <= 2.5,
      why: 'Nice! With enough well-sized steps, the footprints trace out Beta(5, 15), with mean near 25% and middle 95% near 9% to 46%.'
    },
    {
      text: 'Test the trap: set Start to 80% or higher, Step size to 2% or less, and press “+50 steps”. Notice where the footprints pile up.',
      check: st => st.start >= 80 && st.stepSize <= 2 && st.steps >= 50 && (st.mean - st.trueMean) >= 15,
      why: 'You found the trap! Starting far away with tiny steps leaves early footprints stuck near the start, missing the peak of the hill.'
    },
    {
      text: 'Press “New data (random hill)” and run at least 2,000 steps with a medium step size (8% to 15%). Does the walker still find the new hill?',
      check: st => !st.isShop && st.steps >= 2000 && st.stepSize >= 8 && st.stepSize <= 15 && Math.abs(st.mean - st.trueMean) <= 3.5,
      why: 'Every time! Because MCMC only needs the ratio of two heights, it works on any hill — even one with no simple formula.'
    }
  ]);

  // --- MCMC mechanics --------------------------------------------------------
  function record(r) {
    const k = Math.min(N_BINS - 1, Math.max(0, Math.floor(r * N_BINS)));
    bins[k]++;
    samples.push(r);
    steps++;
  }
  function takeStep(isSingle) {
    const span = stepPct / 100;
    const from = cur;
    const hOld = hill.density(from);
    const prop = from + (Math.random() * 2 - 1) * span;
    let hNew = 0, ratio = 0, moved = false;
    if (prop > 0.002 && prop < 0.998) {
      hNew = hill.density(prop);
      ratio = hOld > 0 ? Math.min(1, hNew / hOld) : 1;
      if (hNew >= hOld || Math.random() < ratio) {
        cur = prop;
        moved = true;
        accepted++;
      }
    }
    record(cur);
    if (isSingle) singleSteps++;
    last = { from, prop: Math.max(0, Math.min(1, prop)), hOld, hNew, ratio, moved };
  }
  function resetChain() {
    cancelAnimationFrame(anim);
    cur = startPct / 100;
    steps = 0; accepted = 0;
    bins = new Array(N_BINS).fill(0);
    samples = [];
    last = null;
    draw();
  }
  function runBurst(total, perFrame) {
    cancelAnimationFrame(anim);
    let left = total;
    const tick = () => {
      const n = Math.min(left, perFrame);
      for (let i = 0; i < n; i++) takeStep(false);
      left -= n;
      draw();
      if (left > 0) anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  // --- pointer interaction: tap or drag on SVG to set start position ---------
  let dragging = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const setFromPointer = e => {
    const p = toSvg(e);
    const pct = Math.max(5, Math.min(95, Math.round((p.x - X0) / (X1 - X0) * 100)));
    startPct = pct;
    startSlider.value = pct;
    resetChain();
  };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); setFromPointer(e); });
  svg.addEventListener('pointermove', e => { if (dragging) setFromPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });

  // --- stats helper ----------------------------------------------------------
  function sampleStats() {
    if (!steps) return { mean: startPct, lo: startPct, hi: startPct };
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i];
    const sorted = samples.slice().sort((a, b) => a - b);
    return {
      mean: (sum / samples.length) * 100,
      lo: sorted[Math.floor(0.025 * (sorted.length - 1))] * 100,
      hi: sorted[Math.floor(0.975 * (sorted.length - 1))] * 100
    };
  }

  // --- draw SVG + formula box + challenges -----------------------------------
  const px = r => X0 + r * (X1 - X0);
  function draw() {
    const histH = steps > 0 ? bins.map(c => c / (steps * BW)) : bins.map(() => 0);
    const maxY = Math.max(hill.maxH * 1.15, ...histH, 4.6);
    const py = h => BASE - (h / maxY) * (BASE - TOP);
    const k = [];

    // subtle horizontal grid
    const yStep = maxY > 6 ? 2 : 1;
    for (let g = 0; g <= maxY; g += yStep) {
      const y = py(g);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }

    // footprint histogram bars (cyan)
    const barW = (X1 - X0) / N_BINS;
    for (let i = 0; i < N_BINS; i++) {
      if (histH[i] <= 0) continue;
      const y = py(histH[i]);
      k.push(s('rect', {
        x: X0 + i * barW + 1.5, y, width: Math.max(2, barW - 3), height: Math.max(1, BASE - y),
        fill: C.cyan, 'fill-opacity': 0.62, stroke: C.cyan, 'stroke-width': 1, rx: 2
      }));
    }

    // true hill curve (green)
    if (showTrue) {
      let pts = '';
      for (let i = 0; i <= 120; i++) {
        const r = i / 120;
        pts += `${px(r).toFixed(1)},${py(hill.density(r)).toFixed(1)} `;
      }
      const areaPts = `${px(0).toFixed(1)},${BASE} ${pts}${px(1).toFixed(1)},${BASE}`;
      k.push(s('polygon', { points: areaPts, fill: C.green, 'fill-opacity': 0.14 }),
        s('polyline', { points: pts, fill: 'none', stroke: C.green, 'stroke-width': 3.2 }));
    }

    // last step heights + proposal arrow (when stepping or after a step)
    if (last && steps <= 100) {
      const xf = px(last.from), xp = px(last.prop);
      const yf = py(last.hOld), yp = py(last.hNew);
      const pCol = last.hNew >= last.hOld ? C.green : C.pink;
      k.push(
        s('line', { x1: xf, x2: xf, y1: BASE, y2: yf, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
        s('circle', { cx: xf, cy: yf, r: 5, fill: C.amber }),
        s('line', { x1: xp, x2: xp, y1: BASE, y2: yp, stroke: pCol, 'stroke-width': 2.5 }),
        s('circle', { cx: xp, cy: yp, r: 5, fill: pCol }),
        s('line', { x1: xf, x2: xp, y1: BASE - 24, y2: BASE - 24, stroke: C.violet, 'stroke-width': 2.5 })
      );
    }

    // footprint mean + 95% interval bar (when >= 10 steps)
    const st = sampleStats();
    if (steps >= 10) {
      const xm = px(st.mean / 100);
      k.push(
        s('line', { x1: xm, x2: xm, y1: TOP, y2: BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
        s('line', { x1: px(st.lo / 100), x2: px(st.hi / 100), y1: BASE - 2, y2: BASE - 2, stroke: C.amber, 'stroke-width': 5 })
      );
    }

    // axis + percent ticks
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    for (const v of [0, 20, 40, 60, 80, 100]) {
      const x = px(v / 100);
      k.push(s('line', { x1: x, x2: x, y1: BASE - 5, y2: BASE + 5, stroke: C.muted, 'stroke-width': 2 }),
        s('text', { x, y: BASE + 22 * F, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`));
    }
    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 44, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'failure rate (%)'));

    // walker standing on the rate line
    const wx = px(cur);
    k.push(
      s('circle', { cx: wx, cy: BASE, r: 6, fill: C.amber }),
      s('path', { d: `M ${wx - 10} ${BASE - 6} A 10 10 0 0 1 ${wx + 10} ${BASE - 6} Z`, fill: C.amber }),
      s('circle', { cx: wx, cy: BASE - 22, r: 6.5, fill: C.amber })
    );

    // top pill badge inside chart for hill name + step count
    const pillTxt = `${showTrue ? hill.label : 'Hidden hill'}  ·  ${steps} steps`;
    k.push(
      s('rect', { x: X0 + 6, y: 8, width: Math.min(X1 - X0 - 12, pillTxt.length * 8.5 * F + 24), height: 26 * F, rx: 13 * F, fill: C.bg, stroke: C.green }),
      s('text', { x: X0 + 18, y: 8 + 17 * F, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, pillTxt)
    );

    svg.replaceChildren(...k);

    // update slider readouts
    startVal.textContent = `${startPct}%`;
    stepVal.textContent = `±${stepPct}%`;

    // update formula box
    const lines = [];
    if (last) {
      const resTxt = last.moved
        ? `→ MOVED to ${fmt(Math.round(last.prop * 1000) / 10)}%`
        : `→ STAYED at ${fmt(Math.round(last.from * 1000) / 10)}% (recorded again)`;
      lines.push(
        `last step: ${fmt(Math.round(last.from * 1000) / 10)}% → propose ${fmt(Math.round(last.prop * 1000) / 10)}%`,
        `heights:   new ${fmt(Math.round(last.hNew * 100) / 100)}  vs  old ${fmt(Math.round(last.hOld * 100) / 100)}`,
        [`chance = min(1, new ÷ old) = ${fmt(Math.round(last.ratio * 100) / 100)}  ${resTxt}`, last.moved ? C.green : C.amber]
      );
    } else {
      lines.push(
        `walker at: ${startPct}%   (height ≈ ${fmt(Math.round(hill.density(cur) * 100) / 100)})`,
        ['press “Step once” or “+50 steps” to begin', C.cyan]
      );
    }
    const accPct = steps ? Math.round((accepted / steps) * 100) : 0;
    lines.push(
      `steps = ${steps}   accepted = ${accPct}%`,
      steps >= 10
        ? [`footprints: mean ${fmt(Math.round(st.mean * 10) / 10)}%   95%: ${Math.round(st.lo)}–${Math.round(st.hi)}%`, C.amber]
        : 'footprints: take steps to build the histogram'
    );
    if (showTrue) {
      lines.push([`exact hill: mean ${fmt(Math.round(hill.trueMean * 10) / 10)}%   95%: ${Math.round(hill.trueLo)}–${Math.round(hill.trueHi)}%`, C.green]);
    }
    fbox(box, lines);

    note.textContent = steps < 20
      ? 'Rule 1: higher proposals always move. Rule 2: lower proposals move with chance new height ÷ old height.'
      : 'Cyan bars are the walker’s footprints. The amber dashed line is the footprint mean; the thick amber bar is the middle 95%.';

    chal.update({
      isShop: hill.isShop,
      start: startPct,
      stepSize: stepPct,
      steps,
      singleSteps,
      mean: st.mean,
      trueMean: hill.trueMean
    });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
