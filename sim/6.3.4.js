// 6.3.4 Try it: credible intervals from the green posterior hill.
// The learner drags tail cuts (or picks 80/90/95/99%), tests one-sided cutoffs,
// inspects more parts, draws fresh random batches, compares priors, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // --- Exact Beta PDF, CDF, and inverse CDF ---
  function lgamma(z) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return (a === 1 && x === 0) ? b : (b === 1 && x === 1) ? a : 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - (lgamma(a) + lgamma(b) - lgamma(a + b)));
  }
  function betacf(x, a, b) {
    const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-30;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; let hVal = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; hVal *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; const del = d * c; hVal *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return hVal;
  }
  function betaCdf(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(x, a, b) / a : 1 - bt * betacf(1 - x, b, a) / b;
  }
  function betaInv(p, a, b) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (betaCdf(mid, a, b) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // --- Simulation state (starts at exact lesson values: Beta(2,8) + 3 fail, 7 pass -> Beta(5,15)) ---
  let fails = 3, passes = 7;
  let priorKind = 'shop'; // 'shop' = Beta(2, 8), 'flat' = Beta(1, 1)
  let showPrior = false;
  let mode = 'ci';        // 'ci' = equal-tails credible interval, 'below' = one-sided P(rate < cutoff)
  let level = 95;         // 50..99
  let cutoff = 30;        // 1..99 (in percent)
  let trueRate = 0.25;    // used when inspecting +10 more parts
  let randomCount = 0;
  let toggledPrior = false;

  const priorAB = () => priorKind === 'shop' ? [2, 8] : [1, 1];
  const postAB = () => { const [pa, pb] = priorAB(); return [pa + fails, pb + passes]; };
  const r1 = x => Math.round(x * 10) / 10;

  // --- DOM ---
  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const modeRow = h('div', { class: 'sim-row' });
  const ctrlRow = h('div', { class: 'sim-row' });
  const dataRow = h('div', { class: 'sim-row' });
  const priorRow = h('div', { class: 'sim-row' });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: credible intervals'),
    h('p', { class: 'sub' }, 'Cut equal tails off the green posterior hill to see the believable range for the failure rate. Drag the cut lines directly on the chart, or use the buttons.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, modeRow, ctrlRow, dataRow, priorRow),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Switch to a 90% credible interval. Notice how the range shrinks compared with 95%.',
      check: st => st.mode === 'ci' && st.level === 90,
      why: 'Right: asking for less certainty (90% instead of 95%) cuts 5% off each tail and gives a shorter range.' },
    { text: 'Switch to “Below a cutoff” and move the line to 40%. Read the probability that the rate is below 40%.',
      check: st => st.mode === 'below' && st.cutoff === 40,
      why: 'Yes! The shaded area left of 40% is the exact posterior probability that the failure rate is below 40%.' },
    { text: 'In “Middle interval” at 95%, press “Inspect +10 more parts” until the 95% range is under 25 points wide.',
      check: st => st.mode === 'ci' && st.level === 95 && st.width < 25 && st.n >= 30,
      why: 'More parts sharpen the green posterior hill, so the 95% credible interval shrinks as you gather evidence.' },
    { text: 'Press “New batch (random)” and then switch between “Shop prior” and “Flat prior” to see how the interval moves.',
      check: st => st.randomCount >= 1 && st.toggledPrior,
      why: 'A credible interval depends on both the data and the prior—change the prior and the range shifts.' },
  ]);

  function inspectMore(k = 10) {
    for (let i = 0; i < k; i++) {
      if (Math.random() < trueRate) fails++; else passes++;
    }
    draw();
  }

  function newRandomBatch() {
    trueRate = rnd(12, 55) / 100;
    fails = 0; passes = 0;
    for (let i = 0; i < 10; i++) {
      if (Math.random() < trueRate) fails++; else passes++;
    }
    randomCount++;
    draw();
  }

  function reset() {
    fails = 3; passes = 7;
    priorKind = 'shop'; showPrior = false;
    mode = 'ci'; level = 95; cutoff = 30; trueRate = 0.25;
    draw();
  }

  // --- SVG geometry ---
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 420, F = NARROW ? 1.20 : 1;
  const X0 = NARROW ? 24 : 42, X1 = VW - (NARROW ? 16 : 24), BASE = 312, TOP = 38;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const xOf = r => X0 + r * (X1 - X0);

  // --- Pointer dragging on the SVG ---
  let dragging = false;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  function updateFromPointer(e) {
    const pt = toSvg(e);
    const r = Math.max(0.01, Math.min(0.99, (pt.x - X0) / (X1 - X0)));
    const [a, b] = postAB();
    if (mode === 'ci') {
      const cdf = betaCdf(r, a, b);
      const tail = Math.min(cdf, 1 - cdf);
      level = Math.max(50, Math.min(99, Math.round((1 - 2 * tail) * 100)));
    } else {
      cutoff = Math.max(1, Math.min(99, Math.round(r * 100)));
    }
    draw();
  }
  svg.addEventListener('pointerdown', e => {
    dragging = true; svg.setPointerCapture(e.pointerId); updateFromPointer(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) updateFromPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function areaPath(a, b, r0, r1, yScale, steps = 80) {
    if (r1 <= r0) return '';
    let d = `M ${xOf(r0).toFixed(1)} ${BASE}`;
    for (let i = 0; i <= steps; i++) {
      const r = r0 + (r1 - r0) * (i / steps);
      const y = BASE - betaPdf(r, a, b) * yScale;
      d += ` L ${xOf(r).toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L ${xOf(r1).toFixed(1)} ${BASE} Z`;
    return d;
  }

  function curvePath(a, b, yScale, steps = 160) {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      const y = BASE - betaPdf(r, a, b) * yScale;
      d += (i === 0 ? 'M ' : ' L ') + `${xOf(r).toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }

  function renderControls() {
    modeRow.replaceChildren(
      btn('Middle interval', () => { mode = 'ci'; draw(); }, mode === 'ci' ? 'go' : ''),
      btn('Below a cutoff', () => { mode = 'below'; draw(); }, mode === 'below' ? 'go' : '')
    );

    if (mode === 'ci') {
      ctrlRow.replaceChildren(
        ...[80, 90, 95, 99].map(lv => btn(`${lv}%`, () => { level = lv; draw(); }, level === lv ? 'go' : ''))
      );
    } else {
      ctrlRow.replaceChildren(
        btn('−5%', () => { cutoff = Math.max(1, cutoff - 5); draw(); }),
        btn('+5%', () => { cutoff = Math.min(99, cutoff + 5); draw(); }),
        btn('20% limit', () => { cutoff = 20; draw(); }, cutoff === 20 ? 'go' : ''),
        btn('40% limit', () => { cutoff = 40; draw(); }, cutoff === 40 ? 'go' : ''),
        btn('50% limit', () => { cutoff = 50; draw(); }, cutoff === 50 ? 'go' : '')
      );
    }

    dataRow.replaceChildren(
      btn('Fail −1', () => { if (fails > 0) { fails--; draw(); } }),
      btn('Fail +1', () => { if (fails + passes < 200) { fails++; draw(); } }),
      btn('Pass −1', () => { if (passes > 0) { passes--; draw(); } }),
      btn('Pass +1', () => { if (fails + passes < 200) { passes++; draw(); } }),
      btn('Inspect +10 more parts', () => inspectMore(10), 'go'),
      btn('New batch (random)', newRandomBatch)
    );

    priorRow.replaceChildren(
      btn('Shop prior Beta(2, 8)', () => { if (priorKind !== 'shop') toggledPrior = true; priorKind = 'shop'; draw(); }, priorKind === 'shop' ? 'go' : ''),
      btn('Flat prior Beta(1, 1)', () => { if (priorKind !== 'flat') toggledPrior = true; priorKind = 'flat'; draw(); }, priorKind === 'flat' ? 'go' : ''),
      btn(showPrior ? 'Hide prior hill' : 'Compare with prior', () => { showPrior = !showPrior; draw(); }),
      btn('Start again', reset, 'ghost')
    );
  }

  function draw() {
    renderControls();
    const [pa, pb] = priorAB();
    const [a, b] = postAB();
    const n = fails + passes;
    const mean = a / (a + b);

    // Peak density for y-scale
    const modeR = (a > 1 && b > 1) ? (a - 1) / (a + b - 2) : (a === 1 && b === 1 ? 0.5 : (a > b ? 0.99 : 0.01));
    const postPeak = Math.max(betaPdf(modeR, a, b), betaPdf(mean, a, b), 1);
    const maxY = Math.max(6.2, postPeak * 1.12);
    const yScale = (BASE - TOP) / maxY;

    const alpha = (100 - level) / 100;
    const tailPct = r1(alpha * 50);
    const lo = betaInv(alpha / 2, a, b);
    const hi = betaInv(1 - alpha / 2, a, b);
    const widthPts = (hi - lo) * 100;
    const pBelow = betaCdf(cutoff / 100, a, b);

    const k = [];
    // Vertical gridlines & percentage ticks
    for (let v = 0; v <= 100; v += 20) {
      const x = xOf(v / 100);
      k.push(
        s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x, y: BASE + 20 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`)
      );
    }
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));

    // Optional prior hill overlay
    if (showPrior) {
      k.push(s('path', { d: curvePath(pa, pb, yScale), fill: 'none', stroke: C.cyan, 'stroke-width': 2.2, 'stroke-dasharray': '7 5', 'stroke-opacity': 0.85 }));
    }

    if (mode === 'ci') {
      // Shaded tails & middle
      k.push(
        s('path', { d: areaPath(a, b, 0, lo, yScale, 40), fill: C.pink, 'fill-opacity': 0.52 }),
        s('path', { d: areaPath(a, b, lo, hi, yScale, 90), fill: C.green, 'fill-opacity': 0.42 }),
        s('path', { d: areaPath(a, b, hi, 1, yScale, 40), fill: C.pink, 'fill-opacity': 0.52 })
      );
    } else {
      const c = cutoff / 100;
      k.push(
        s('path', { d: areaPath(a, b, 0, c, yScale, 80), fill: C.green, 'fill-opacity': 0.48 }),
        s('path', { d: areaPath(a, b, c, 1, yScale, 80), fill: C.pink, 'fill-opacity': 0.24 })
      );
    }

    // Glowing posterior curve outline
    const cPath = curvePath(a, b, yScale);
    k.push(
      s('path', { d: cPath, fill: 'none', stroke: C.green, 'stroke-width': 7, 'stroke-opacity': 0.18 }),
      s('path', { d: cPath, fill: 'none', stroke: C.green, 'stroke-width': 2.8 })
    );

    // Mean dashed line
    const xm = xOf(mean), ym = BASE - betaPdf(mean, a, b) * yScale;
    k.push(
      s('line', { x1: xm, x2: xm, y1: Math.max(TOP + 8, ym), y2: BASE, stroke: C.amber, 'stroke-width': 1.8, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.75 }),
      s('text', { x: xm, y: Math.max(TOP + 4, ym - 8), fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `mean ${r1(mean * 100)}%`)
    );

    if (mode === 'ci') {
      const xL = xOf(lo), xR = xOf(hi);
      const yL = BASE - betaPdf(lo, a, b) * yScale, yR = BASE - betaPdf(hi, a, b) * yScale;
      // Cut lines & draggable handles
      k.push(
        s('line', { x1: xL, x2: xL, y1: Math.min(BASE - 24, yL - 12), y2: BASE, stroke: C.amber, 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }),
        s('line', { x1: xR, x2: xR, y1: Math.min(BASE - 24, yR - 12), y2: BASE, stroke: C.amber, 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }),
        s('circle', { cx: xL, cy: BASE, r: 7 * F, fill: C.amber, stroke: C.bg, 'stroke-width': 2, style: 'cursor:ew-resize' }),
        s('circle', { cx: xR, cy: BASE, r: 7 * F, fill: C.amber, stroke: C.bg, 'stroke-width': 2, style: 'cursor:ew-resize' })
      );
      // Center share label
      const midX = (xL + xR) / 2;
      const midY = BASE - Math.min(postPeak * yScale * 0.42, (BASE - TOP) * 0.42);
      k.push(s('text', { x: midX, y: Math.min(BASE - 16, midY), fill: C.green, 'font-size': 18 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${level}%`));

      // Interval bar below axis
      const barY = BASE + 54;
      k.push(
        s('line', { x1: xL, x2: xR, y1: barY, y2: barY, stroke: C.green, 'stroke-width': 5, 'stroke-linecap': 'round' }),
        s('circle', { cx: xL, cy: barY, r: 4.5, fill: C.green }),
        s('circle', { cx: xR, cy: barY, r: 4.5, fill: C.green }),
        s('text', { x: Math.min(X1 - 50 * F, Math.max(X0 + 50 * F, (xL + xR) / 2)), y: barY + 20 * F, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${level}% credible: ${r1(lo * 100)}% to ${r1(hi * 100)}%`)
      );

      // Optional prior interval bar
      if (showPrior) {
        const pLo = betaInv(alpha / 2, pa, pb), pHi = betaInv(1 - alpha / 2, pa, pb);
        const pxL = xOf(pLo), pxR = xOf(pHi), pBarY = BASE + 94;
        k.push(
          s('line', { x1: pxL, x2: pxR, y1: pBarY, y2: pBarY, stroke: C.cyan, 'stroke-width': 4, 'stroke-linecap': 'round' }),
          s('circle', { cx: pxL, cy: pBarY, r: 4, fill: C.cyan }),
          s('circle', { cx: pxR, cy: pBarY, r: 4, fill: C.cyan }),
          s('text', { x: Math.min(X1 - 60 * F, Math.max(X0 + 60 * F, (pxL + pxR) / 2)), y: pBarY + 18 * F, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            `prior ${level}%: ${r1(pLo * 100)}% to ${r1(pHi * 100)}%`)
        );
      }

      fbox(box, [
        `prior     = Beta(${pa}, ${pb})`,
        `batch     = ${fails} fail, ${passes} pass (${n} parts)`,
        `posterior = Beta(${a}, ${b}), mean ${r1(mean * 100)}%`,
        [`tails     = ${fmt(tailPct)}% left + ${fmt(tailPct)}% right`, C.pink],
        [`${level}% range = ${r1(lo * 100)}% to ${r1(hi * 100)}%`, C.green],
        [`width     = ${r1(widthPts)} points`, C.amber]
      ]);
      note.textContent = `Equal-tails ${level}% credible interval: cut ${fmt(tailPct)}% off each tail and keep the middle ${level}% of posterior belief.`;
    } else {
      const xc = xOf(cutoff / 100);
      k.push(
        s('line', { x1: xc, x2: xc, y1: TOP + 12, y2: BASE, stroke: C.amber, 'stroke-width': 2.8, 'stroke-dasharray': '7 5' }),
        s('circle', { cx: xc, cy: BASE, r: 8 * F, fill: C.amber, stroke: C.bg, 'stroke-width': 2, style: 'cursor:ew-resize' }),
        s('rect', { x: Math.min(X1 - 154 * F, Math.max(X0, xc - 77 * F)), y: BASE + 38, width: 154 * F, height: 28 * F, rx: 14 * F, fill: C.bg, stroke: C.green }),
        s('text', { x: Math.min(X1 - 77 * F, Math.max(X0 + 77 * F, xc)), y: BASE + 38 + 18 * F, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `P(< ${cutoff}%) = ${r1(pBelow * 100)}%`)
      );

      fbox(box, [
        `prior     = Beta(${pa}, ${pb})`,
        `batch     = ${fails} fail, ${passes} pass (${n} parts)`,
        `posterior = Beta(${a}, ${b}), mean ${r1(mean * 100)}%`,
        [`cutoff    = rate below ${cutoff}%`, C.amber],
        [`P(rate < ${cutoff}%) = ${r1(pBelow * 100)}%`, C.green],
        [`P(rate > ${cutoff}%) = ${r1((1 - pBelow) * 100)}%`, C.pink]
      ]);
      note.textContent = `One-sided question: ${r1(pBelow * 100)}% of the green area lies left of ${cutoff}%. Drag the amber handle to test any contract limit.`;
    }

    svg.replaceChildren(...k);
    chal.update({ mode, level, cutoff, width: widthPts, n, fails, passes, priorKind, randomCount, toggledPrior });
  }

  draw();
  return () => {};
}
