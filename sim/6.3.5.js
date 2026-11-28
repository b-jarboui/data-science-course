// 6.3.5 Try it: posterior prediction vs plug-in prediction.
// The learner adjusts observed parts and tomorrow's batch size, probes any rate on the green
// posterior hill, simulates batches from the crowd, tests fresh random datasets, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Exact math helpers (Lanczos log-gamma, Beta density, Binomial, Beta-Binomial, Gamma sampler)
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(z) {
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1;
    let x = LG[0];
    for (let i = 1; i < 9; i++) x += LG[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  const logBeta = (a, b) => lgamma(a) + lgamma(b) - lgamma(a + b);
  const logChoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  const betaPdf = (x, a, b) => (x <= 0 || x >= 1) ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
  const binomPmf = (k, n, p) => p <= 0 ? (k === 0 ? 1 : 0) : p >= 1 ? (k === n ? 1 : 0) : Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  const betaBinomPmf = (k, n, a, b) => Math.exp(logChoose(n, k) + logBeta(k + a, n - k + b) - logBeta(a, b));

  function randNorm() {
    const u1 = Math.max(1e-12, Math.random()), u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  function randGamma(alpha) {
    if (alpha < 1) return randGamma(alpha + 1) * Math.pow(Math.max(1e-12, Math.random()), 1 / alpha);
    const d = alpha - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = randNorm(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = Math.max(1e-12, Math.random());
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function randBeta(a, b) {
    const x = randGamma(a), y = randGamma(b);
    return x / (x + y);
  }

  // State: shop prior Beta(2, 8) + observed (3 fail, 7 pass) => Beta(5, 15), next batch = 4
  const PRIOR_A = 2, PRIOR_B = 8;
  let obsFail = 3, obsPass = 7, batch = 4;
  let simCounts = [0, 0, 0, 0], simTotal = 0, sampleRates = [], lastBatch = null, lastRate = null;
  let probeRate = null, isRandom = false, anim = 0, pending = 0;

  const postA = () => PRIOR_A + obsFail;
  const postB = () => PRIOR_B + obsPass;
  const postMean = () => postA() / (postA() + postB());

  // Bucket scheme: m=1..3 -> 0..m; m=4 -> 0,1,2,3+; m>=5 -> 0,1,2,3,4+
  function buckets() {
    if (batch <= 3) return Array.from({ length: batch + 1 }, (_, k) => ({ label: `${k} fail`, min: k, max: k }));
    if (batch === 4) return [
      { label: '0 fail', min: 0, max: 0 }, { label: '1 fail', min: 1, max: 1 },
      { label: '2 fail', min: 2, max: 2 }, { label: '3+ fail', min: 3, max: 4 }
    ];
    return [
      { label: '0 fail', min: 0, max: 0 }, { label: '1 fail', min: 1, max: 1 },
      { label: '2 fail', min: 2, max: 2 }, { label: '3 fail', min: 3, max: 3 },
      { label: '4+ fail', min: 4, max: batch }
    ];
  }
  function resetSim() {
    cancelAnimationFrame(anim); pending = 0;
    simCounts = buckets().map(() => 0);
    simTotal = 0; sampleRates = []; lastBatch = null; lastRate = null;
  }

  // DOM layout
  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const failRead = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.pink, fontWeight: 700 } });
  const passRead = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.green, fontWeight: 700 } });
  const batchRead = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });

  function setObs(df, dp) {
    obsFail = Math.max(0, Math.min(80, obsFail + df));
    obsPass = Math.max(1, Math.min(180, obsPass + dp));
    resetSim(); draw();
  }
  function setBatch(db) {
    batch = Math.max(1, Math.min(6, batch + db));
    resetSim(); draw();
  }
  function runTrial() {
    const r = randBeta(postA(), postB());
    const parts = Array.from({ length: batch }, () => Math.random() < r ? 1 : 0);
    const f = parts.reduce((a, b) => a + b, 0);
    const bs = buckets();
    const idx = bs.findIndex(b => f >= b.min && f <= b.max);
    if (idx >= 0) simCounts[idx]++;
    simTotal++;
    sampleRates.push(r);
    if (sampleRates.length > 140) sampleRates.shift();
    lastRate = r; lastBatch = parts;
  }
  function simOne() {
    cancelAnimationFrame(anim); pending = 0;
    runTrial(); draw();
  }
  function simMany(count) {
    pending += count;
    cancelAnimationFrame(anim);
    const step = () => {
      const chunk = Math.min(pending, 18);
      for (let i = 0; i < chunk; i++) runTrial();
      pending -= chunk;
      draw();
      if (pending > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function newRandomData() {
    const n = rnd(6, 18);
    const trueRate = rnd(12, 48) / 100;
    let f = 0;
    for (let i = 0; i < n; i++) if (Math.random() < trueRate) f++;
    obsFail = f; obsPass = n - f;
    if (batch < 2) batch = 4;
    isRandom = true; probeRate = null;
    resetSim(); draw();
  }
  function moreData10() {
    obsFail = Math.min(80, Math.max(1, obsFail) * 10);
    obsPass = Math.min(180, Math.max(1, obsPass) * 10);
    probeRate = null;
    resetSim(); draw();
  }
  function startAgain() {
    obsFail = 3; obsPass = 7; batch = 4;
    isRandom = false; probeRate = null;
    resetSim(); draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: posterior prediction'),
    h('p', { class: 'sub' }, 'Top: the green posterior hill of plausible failure rates (tap or drag on the hill to inspect any rate). Bottom: tomorrow’s batch of parts — compare posterior predictive (cyan) with plug-in (amber), or simulate crowds of batches.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('−', () => setObs(-1, 0)), failRead, btn('+', () => setObs(1, 0)),
          btn('−', () => setObs(0, -1)), passRead, btn('+', () => setObs(0, 1)),
          btn('−', () => setBatch(-1)), batchRead, btn('+', () => setBatch(1))),
        h('div', { class: 'sim-row' },
          btn('Simulate 1 person', simOne),
          btn('Simulate +200 batches', () => simMany(200), 'go'),
          btn('New data (random)', newRandomData),
          btn('More data (×10)', moreData10),
          btn('Start again', startAgain))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Simulate +200 batches” until you reach at least 600 simulated batches. Watch which bars the simulation matches.',
      check: st => st.simTotal >= 600,
      why: 'The simulated bars settle onto the cyan predictive curve, not the amber plug-in bars — averaging over the green hill puts more weight in both ends.' },
    { text: 'Set tomorrow’s batch size to 1 part. Compare the predictive failure chance with the plug-in chance.',
      check: st => st.batch === 1,
      why: 'For one single part, both give the exact same answer: the posterior mean. Uncertainty widens the spread only when predicting multiple parts.' },
    { text: 'Set batch size back to 4, then press “More data (×10)” (or gather 60+ observed parts). Watch the gap between predictive and plug-in.',
      check: st => st.batch === 4 && (st.obsFail + st.obsPass) >= 60,
      why: 'More past data makes the green hill narrow. With little doubt left about the rate, predictive and plug-in nearly agree.' },
    { text: 'Press “New data (random)” and simulate at least 200 batches on that fresh shop data.',
      check: st => st.isRandom && st.simTotal >= 200,
      why: 'Even on completely new data, averaging over plausible rates keeps the doubt and produces a wider predictive spread than plug-in.' }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 410 : 700, VH = NARROW ? 520 : 480, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 38 : 54, X1 = VW - 16;
  const HILL_TOP = 32, HILL_BASE = NARROW ? 168 : 162;
  const STRIP_Y = NARROW ? 214 : 204;
  const BAR_TOP = NARROW ? 266 : 254, BAR_BASE = VH - 46;

  // Drag / tap on the green hill to inspect a single candidate rate
  let probing = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  function setProbe(e) {
    const p = toSvg(e);
    const frac = Math.max(0.01, Math.min(0.99, (p.x - X0) / (X1 - X0)));
    probeRate = Math.round(frac * 100) / 100;
    draw();
  }
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= HILL_TOP - 15 && p.y <= HILL_BASE + 25 && p.x >= X0 && p.x <= X1) {
      probing = true; svg.setPointerCapture(e.pointerId); setProbe(e);
    } else if (probeRate !== null) {
      probeRate = null; draw();
    }
  });
  svg.addEventListener('pointermove', e => { if (probing) setProbe(e); });
  svg.addEventListener('pointerup', () => { probing = false; });

  function draw() {
    const a = postA(), b = postB(), mu = postMean(), bs = buckets();
    const k = [];

    // 1. Upper panel: green posterior hill Beta(a, b) on 0%..100%
    const N = 100;
    let peak = 0;
    const ys = [];
    for (let i = 0; i <= N; i++) {
      const p = i / N, d = betaPdf(p, a, b);
      ys.push(d); if (d > peak) peak = d;
    }
    const p2x = p => X0 + p * (X1 - X0);
    const d2y = d => HILL_BASE - (d / (peak * 1.12 || 1)) * (HILL_BASE - HILL_TOP);

    // Axis ticks for hill
    k.push(s('line', { x1: X0, x2: X1, y1: HILL_BASE, y2: HILL_BASE, stroke: C.muted, 'stroke-width': 1.8 }));
    for (const v of [0, 20, 40, 60, 80, 100]) {
      const tx = p2x(v / 100);
      k.push(s('line', { x1: tx, x2: tx, y1: HILL_BASE, y2: HILL_BASE + 5, stroke: C.muted }),
        s('text', { x: tx, y: HILL_BASE + 19, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`));
    }
    k.push(s('text', { x: X0, y: HILL_TOP - 10, fill: C.green, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `POSTERIOR HILL: Beta(${a}, ${b})`));

    // Filled polygon + smooth curve
    const pts = ys.map((d, i) => `${p2x(i / N).toFixed(1)},${d2y(d).toFixed(1)}`);
    k.push(s('polygon', { points: `${X0},${HILL_BASE} ${pts.join(' ')} ${X1},${HILL_BASE}`, fill: C.green, 'fill-opacity': 0.22 }));
    k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.green, 'stroke-width': 2.8 }));

    // Simulated crowd dots along the hill
    sampleRates.forEach((r, idx) => {
      const isLast = idx === sampleRates.length - 1;
      const cx = p2x(r), cy = HILL_BASE - 5 - ((idx * 17) % 14);
      k.push(s('circle', { cx, cy: isLast ? d2y(betaPdf(r, a, b)) : cy, r: isLast ? 5.5 : 2.3,
        fill: isLast ? C.cyan : C.green, 'fill-opacity': isLast ? 1 : 0.65 }));
    });

    // Posterior mean dashed amber line (plug-in rate)
    const xm = p2x(mu);
    k.push(s('line', { x1: xm, x2: xm, y1: HILL_TOP + 2, y2: HILL_BASE, stroke: C.amber, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' }),
      s('text', { x: Math.min(X1 - 52, Math.max(X0 + 52, xm)), y: HILL_TOP + 10, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `MEAN ${Math.round(mu * 100)}%`));

    // Interactive probe line on hill
    if (probeRate !== null) {
      const xp = p2x(probeRate);
      k.push(s('line', { x1: xp, x2: xp, y1: HILL_TOP, y2: HILL_BASE, stroke: C.violet, 'stroke-width': 2 }),
        s('circle', { cx: xp, cy: d2y(betaPdf(probeRate, a, b)), r: 5, fill: C.violet }));
    }

    // 2. Middle strip: either last simulated batch of charger icons, or probe breakdown
    if (probeRate !== null) {
      const pAll = Math.round(binomPmf(0, batch, probeRate) * 100);
      const pTwo = Math.round(Array.from({ length: batch + 1 }, (_, j) => j >= 2 ? binomPmf(j, batch, probeRate) : 0).reduce((x, y) => x + y, 0) * 100);
      k.push(s('text', { x: (X0 + X1) / 2, y: STRIP_Y + 6, fill: C.violet, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `Person at ${Math.round(probeRate * 100)}%: all pass ${pAll}%` + (batch >= 2 ? ` · 2+ fail ${pTwo}%` : '')));
    } else if (lastBatch) {
      const cx0 = (X0 + X1) / 2, sp = 28;
      k.push(s('text', { x: X0, y: STRIP_Y + 5, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
        `Last draw (${Math.round(lastRate * 100)}%):`));
      lastBatch.forEach((fail, i) => {
        const ix = cx0 + (i - (lastBatch.length - 1) / 2) * sp + (NARROW ? 40 : 25);
        const col = fail ? C.pink : C.green;
        k.push(s('rect', { x: ix - 10, y: STRIP_Y - 12, width: 20, height: 22, rx: 4, fill: col, 'fill-opacity': 0.22, stroke: col, 'stroke-width': 1.8 }),
          s('text', { x: ix, y: STRIP_Y + 4, fill: col, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, fail ? '×' : '✓'));
      });
    } else {
      k.push(s('text', { x: (X0 + X1) / 2, y: STRIP_Y + 5, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        'Tap the green hill to inspect a rate, or press Simulate'));
    }

    // 3. Lower panel: Posterior predictive (cyan) vs Plug-in (amber) vs Simulated
    const predP = bs.map(bk => {
      let sum = 0; for (let j = bk.min; j <= bk.max; j++) sum += betaBinomPmf(j, batch, a, b); return sum;
    });
    const plugP = bs.map(bk => {
      let sum = 0; for (let j = bk.min; j <= bk.max; j++) sum += binomPmf(j, batch, mu); return sum;
    });
    const simP = bs.map((_, i) => simTotal > 0 ? simCounts[i] / simTotal : 0);
    const maxP = Math.max(0.5, ...predP, ...plugP, ...simP) * 1.15;
    const pY = p => BAR_BASE - (p / maxP) * (BAR_BASE - BAR_TOP);

    // Legend
    const legY = BAR_TOP - 16;
    k.push(s('rect', { x: X0, y: legY - 9, width: 12, height: 10, fill: C.cyan, 'fill-opacity': 0.85 }),
      s('text', { x: X0 + 17, y: legY, fill: C.cyan, 'font-size': 12 * F, 'font-family': 'Consolas' }, simTotal > 0 ? 'Simulated + exact predictive' : 'Predictive'),
      s('rect', { x: X1 - (NARROW ? 95 : 135), y: legY - 9, width: 12, height: 10, fill: C.amber, 'fill-opacity': 0.85 }),
      s('text', { x: X1 - (NARROW ? 78 : 118), y: legY, fill: C.amber, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Plug-in'));

    // Gridlines
    const stepG = maxP > 0.7 ? 0.25 : 0.2;
    for (let g = 0; g <= maxP + 1e-6; g += stepG) {
      const gy = pY(g);
      if (gy < BAR_TOP - 2) continue;
      k.push(s('line', { x1: X0, x2: X1, y1: gy, y2: gy, stroke: C.line }),
        s('text', { x: X0 - 7, y: gy + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${Math.round(g * 100)}%`));
    }

    // Grouped bars
    const slotW = (X1 - X0) / bs.length;
    const bw = Math.min(48, slotW * 0.34);
    bs.forEach((bk, i) => {
      const cx = X0 + (i + 0.5) * slotW;
      const xLeft = cx - bw - 3, xRight = cx + 3;
      const yPred = pY(predP[i]), yPlug = pY(plugP[i]);

      if (simTotal > 0) {
        const ySim = pY(simP[i]);
        k.push(s('rect', { x: xLeft, y: ySim, width: bw, height: Math.max(0, BAR_BASE - ySim), fill: C.cyan, 'fill-opacity': 0.78, rx: 3 }),
          s('rect', { x: xLeft, y: yPred, width: bw, height: Math.max(0, BAR_BASE - yPred), fill: 'none', stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '5 3', rx: 3 }),
          s('text', { x: xLeft + bw / 2, y: Math.min(ySim, yPred) - 6, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            `${Math.round(simP[i] * 100)}%`));
      } else {
        k.push(s('rect', { x: xLeft, y: yPred, width: bw, height: Math.max(0, BAR_BASE - yPred), fill: C.cyan, 'fill-opacity': 0.82, rx: 3 }),
          s('text', { x: xLeft + bw / 2, y: yPred - 6, fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            `${Math.round(predP[i] * 100)}%`));
      }

      k.push(s('rect', { x: xRight, y: yPlug, width: bw, height: Math.max(0, BAR_BASE - yPlug), fill: C.amber, 'fill-opacity': 0.80, rx: 3 }),
        s('text', { x: xRight + bw / 2, y: yPlug - 6, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${Math.round(plugP[i] * 100)}%`),
        s('text', { x: cx, y: BAR_BASE + 22, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, bk.label));
    });

    svg.replaceChildren(...k);

    // Controls & Formula box
    failRead.textContent = `Fail: ${obsFail}`;
    passRead.textContent = `Pass: ${obsPass}`;
    batchRead.textContent = `Batch: ${batch}`;

    const tailLabel = bs[bs.length - 1].label;
    const p0Pred = Math.round(predP[0] * 100), p0Plug = Math.round(plugP[0] * 100);
    const pTailPred = Math.round(predP[predP.length - 1] * 100), pTailPlug = Math.round(plugP[plugP.length - 1] * 100);
    const lines = [
      `observed  = ${obsFail} fail, ${obsPass} pass`,
      `posterior = Beta(${a}, ${b})  mean ${fmt(Math.round(mu * 1000) / 10)}%`,
      `next batch of ${batch}:   0 fail | ${tailLabel}`,
      [`  predictive:      ${String(p0Pred).padStart(2)}%    | ${String(pTailPred).padStart(2)}%`, C.cyan],
      [`  plug-in:         ${String(p0Plug).padStart(2)}%    | ${String(pTailPlug).padStart(2)}%`, C.amber]
    ];
    if (simTotal > 0) {
      const s0 = Math.round(simP[0] * 100), sT = Math.round(simP[simP.length - 1] * 100);
      lines.push([`  simulated (${simTotal}): ${String(s0).padStart(2)}%    | ${String(sT).padStart(2)}%`, C.green]);
    }
    fbox(box, lines);

    note.textContent = batch === 1
      ? 'For 1 single part, predictive and plug-in match: both equal the posterior mean.'
      : simTotal > 0
        ? 'White dashed outlines show the exact posterior predictive probabilities — watch the cyan simulated bars settle right onto them.'
        : 'Averaging over the green hill puts more probability in the extremes than plugging in one rate.';

    chal.update({ simTotal, batch, obsFail, obsPass, isRandom });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
