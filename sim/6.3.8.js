// 6.3.8 Try it: Chain diagnostics — trace plots, warm-up, and R-hat.
// Runs 4 real Metropolis-Hastings chains on the repair shop posterior Beta(5, 15).
// Drag the 4 starting dots on the left axis, tune step size / steps / warm-up,
// generate fresh random runs, and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  const DEFAULT_STARTS = [5, 30, 60, 90];
  const COLS = [C.cyan, C.green, C.amber, C.pink];

  let starts = DEFAULT_STARTS.slice();
  let stepSize = 10;   // percent (0.5 to 25)
  let nSteps = 2000;   // steps per chain (100 to 2000)
  let warmup = 10;     // percent of steps dropped (0 to 50)
  let seed = 63801;
  let chains = [];
  let seenWarmup0 = false;
  let goodNewData = 0;

  // --- seeded PRNG + real Metropolis-Hastings on Beta(5, 15) ---
  function mulberry32(a) {
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const logPost = p => (p <= 0.001 || p >= 0.999) ? -Infinity : 4 * Math.log(p) + 14 * Math.log(1 - p);

  function simulate() {
    const u = mulberry32(seed);
    const sd = stepSize / 100;
    const randN = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, u()))) * Math.cos(2 * Math.PI * u());
    chains = starts.map(st => {
      let p = Math.max(0.005, Math.min(0.995, st / 100));
      let lp = logPost(p);
      const out = new Float32Array(nSteps + 1);
      out[0] = p * 100;
      for (let t = 1; t <= nSteps; t++) {
        const prop = p + sd * randN();
        if (prop > 0.001 && prop < 0.999) {
          const lprop = logPost(prop);
          if (lprop >= lp || Math.log(Math.max(1e-12, u())) < lprop - lp) {
            p = prop; lp = lprop;
          }
        }
        out[t] = p * 100;
      }
      return out;
    });
  }

  // --- Gelman-Rubin R-hat on post-warmup draws ---
  function computeStats() {
    const m = chains.length;
    const drop = Math.min(nSteps - 4, Math.floor((warmup / 100) * nSteps));
    const n = nSteps + 1 - drop;
    const means = [], vars = [];
    for (let c = 0; c < m; c++) {
      let sum = 0;
      for (let t = drop; t <= nSteps; t++) sum += chains[c][t];
      const mu = sum / n;
      let ss = 0;
      for (let t = drop; t <= nSteps; t++) { const d = chains[c][t] - mu; ss += d * d; }
      means.push(mu);
      vars.push(ss / Math.max(1, n - 1));
    }
    const grand = means.reduce((a, b) => a + b, 0) / m;
    const W = vars.reduce((a, b) => a + b, 0) / m;
    const BoverN = means.reduce((a, mu) => a + (mu - grand) * (mu - grand), 0) / (m - 1);
    const varHat = ((n - 1) / n) * W + BoverN;
    const rhat = W > 1e-9 ? Math.sqrt(Math.max(1, varHat / W)) : (BoverN > 1e-9 ? 99 : 1);
    return { drop, n, means, grand, withinSD: Math.sqrt(W), betweenSD: Math.sqrt(BoverN), rhat };
  }

  // --- UI ---
  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  function makeSlider(label, min, max, step, val, unit, onChange) {
    const read = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, minWidth: '4.4rem', textAlign: 'right' } }, `${val}${unit}`);
    const input = h('input', {
      type: 'range', min, max, step, value: val,
      style: { flex: '1', accentColor: C.cyan, minHeight: '36px', cursor: 'pointer' },
      oninput: e => { const v = +e.target.value; read.textContent = `${v}${unit}`; onChange(v); }
    });
    const wrap = h('label', {
      style: { display: 'flex', alignItems: 'center', gap: '0.55rem', flex: '1 1 15rem', fontSize: '0.94rem', color: '#cfd8f0' }
    }, h('span', { style: { minWidth: '5.3rem' } }, label), input, read);
    return { wrap, set(v) { input.value = v; read.textContent = `${v}${unit}`; } };
  }

  const slStep = makeSlider('Step size', 0.5, 25, 0.5, stepSize, '%', v => { stepSize = v; rerun(); });
  const slSteps = makeSlider('Steps', 100, 2000, 100, nSteps, '', v => { nSteps = v; rerun(); });
  const slWarm = makeSlider('Warm-up', 0, 50, 5, warmup, '%', v => {
    warmup = v;
    if (warmup === 0) seenWarmup0 = true;
    draw();
  });

  function applyPreset(step, steps, warm, st = DEFAULT_STARTS) {
    stepSize = step; nSteps = steps; warmup = warm; starts = st.slice();
    slStep.set(stepSize); slSteps.set(nSteps); slWarm.set(warmup);
    if (warmup === 0) seenWarmup0 = true;
    rerun();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: chain diagnostics'),
    h('p', { class: 'sub' }, 'Four walkers explore the repair shop failure rate. Drag the four starting dots on the left edge, or tune step size, steps and warm-up to watch the traces and R-hat update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { marginTop: '0.9rem' } }, slStep.wrap, slSteps.wrap, slWarm.wrap),
        h('div', { class: 'sim-row' },
          btn('Good run', () => applyPreset(10, 2000, 10), 'go'),
          btn('Bad run', () => applyPreset(0.5, 200, 0)),
          btn('New data', () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            simulate();
            const st = computeStats();
            const span = Math.max(...starts) - Math.min(...starts);
            if (st.rhat < 1.01 && span >= 60) goodNewData++;
            draw();
          }),
          btn('Reset starts', () => { starts = DEFAULT_STARTS.slice(); rerun(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Break the mixing: press “Bad run” (or shrink step size to 1% or less) until R-hat rises above 2.',
      check: st => st.rhat > 2,
      why: 'With tiny steps, each walker stays near its start, so the spread between chains is much bigger than the spread within each chain.' },
    { text: 'Now fix it with far-apart starts (at least 60% apart): raise step size and steps until R-hat drops below 1.01.',
      check: st => st.rhat < 1.01 && st.startSpan >= 60,
      why: 'Well done! All four traces mix like one fuzzy caterpillar and agree on a failure rate near 25%.' },
    { text: 'See warm-up work: set warm-up to 0%, then raise warm-up to 25% or more to throw away the starting travel.',
      check: st => st.seenWarmup0 && st.warmup >= 25,
      why: 'Dropping warm-up removes the initial climb from 5% and drop from 90% so they do not pull the chain means apart.' },
    { text: 'On a good run (R-hat below 1.01, starts far apart), press “New data” twice. Does R-hat stay near 1?',
      check: st => st.goodNewData >= 2,
      why: 'Yes! Fresh random walks wiggle differently each time, yet still explore the same hill and keep R-hat near 1.00.' },
  ]);

  // --- SVG geometry (phone vs laptop) ---
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 420, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 56 : 64, X1 = VW - (NARROW ? 66 : 86), TOP = 28, BASE = 366;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const xOf = t => X0 + (t / nSteps) * (X1 - X0);
  const yOf = r => BASE - (r / 100) * (BASE - TOP);

  // --- drag the 4 starting dots on the left axis ---
  let dragIdx = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const pt = toSvg(e);
    if (pt.x > X0 + 34) return;
    let best = -1, bestD = 36;
    starts.forEach((r, i) => {
      const d = Math.hypot(pt.x - X0, pt.y - yOf(r));
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    dragIdx = best;
    svg.setPointerCapture(e.pointerId);
    moveStart(e);
  });
  const moveStart = e => {
    if (dragIdx < 0) return;
    const pt = toSvg(e);
    const r = Math.round(((BASE - pt.y) / (BASE - TOP)) * 100);
    starts[dragIdx] = Math.max(2, Math.min(98, r));
    rerun();
  };
  svg.addEventListener('pointermove', moveStart);
  svg.addEventListener('pointerup', () => { dragIdx = -1; });
  svg.addEventListener('pointercancel', () => { dragIdx = -1; });

  function rerun() { simulate(); draw(); }

  function draw() {
    const st = computeStats();
    const k = [];

    // horizontal grid + y ticks
    for (let r = 0; r <= 100; r += 25) {
      const y = yOf(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 12, y: y + 4 * F, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${r}%`)
      );
    }
    // x ticks
    for (let q = 0; q <= 4; q++) {
      const stepVal = Math.round((q / 4) * nSteps), x = xOf(stepVal);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted }),
        s('text', { x, y: BASE + 22 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, stepVal)
      );
    }
    k.push(
      s('text', { x: (X0 + X1) / 2, y: VH - 8, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'middle' }, 'step number'),
      s('text', { x: X1 + 10, y: TOP - 8, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, 'means')
    );

    // warm-up shaded region
    const xWarm = xOf(st.drop);
    if (st.drop > 0) {
      k.push(
        s('rect', { x: X0, y: TOP, width: xWarm - X0, height: BASE - TOP, fill: C.amber, 'fill-opacity': 0.11 }),
        s('line', { x1: xWarm, x2: xWarm, y1: TOP, y2: BASE, stroke: C.amber, 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }),
        s('text', { x: Math.max(X0 + 28, (X0 + xWarm) / 2), y: TOP + 16 * F, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'warm-up')
      );
    }

    // 4 trace polylines (downsampled cleanly to <= 260 vertices for fast 60fps updates)
    const stride = Math.max(1, Math.floor(nSteps / 250));
    chains.forEach((arr, c) => {
      const pts = [];
      for (let t = 0; t <= nSteps; t += stride) pts.push(`${xOf(t).toFixed(1)},${yOf(arr[t]).toFixed(1)}`);
      if (nSteps % stride !== 0) pts.push(`${xOf(nSteps).toFixed(1)},${yOf(arr[nSteps]).toFixed(1)}`);
      k.push(s('polyline', {
        points: pts.join(' '), fill: 'none', stroke: COLS[c],
        'stroke-width': 1.65, 'stroke-opacity': 0.88, 'stroke-linejoin': 'round'
      }));
    });

    // post-warmup mean lines + non-overlapping right-side mean labels
    const meanLabels = st.means.map((mu, c) => ({ c, mu, y: yOf(mu) })).sort((a, b) => a.y - b.y);
    const minGap = 17 * F;
    for (let i = 1; i < meanLabels.length; i++) {
      if (meanLabels[i].y - meanLabels[i - 1].y < minGap) meanLabels[i].y = meanLabels[i - 1].y + minGap;
    }
    for (let i = meanLabels.length - 1; i >= 0; i--) {
      if (meanLabels[i].y > BASE - 4) meanLabels[i].y = BASE - 4;
      if (i > 0 && meanLabels[i].y - meanLabels[i - 1].y < minGap) meanLabels[i - 1].y = meanLabels[i].y - minGap;
    }
    meanLabels.forEach(({ c, mu, y }) => {
      const ym = yOf(mu);
      k.push(
        s('line', { x1: xWarm, x2: X1, y1: ym, y2: ym, stroke: COLS[c], 'stroke-width': 1.8, 'stroke-dasharray': '5 4', 'stroke-opacity': 0.85 }),
        s('circle', { cx: X1 + 6, cy: ym, r: 4 * F, fill: COLS[c] }),
        s('text', { x: X1 + 15, y: y + 4 * F, fill: COLS[c], 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${Math.round(mu)}%`)
      );
    });

    // axes frame + draggable starting handles
    k.push(
      s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 2 })
    );
    starts.forEach((r, c) => {
      const y = yOf(r);
      k.push(
        s('circle', { cx: X0, cy: y, r: 12 * F, fill: COLS[c], 'fill-opacity': 0.22, style: 'cursor:ns-resize' }),
        s('circle', { cx: X0, cy: y, r: 6.5 * F, fill: COLS[c], stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' })
      );
    });

    svg.replaceChildren(...k);

    const rhatCol = st.rhat < 1.01 ? C.green : st.rhat < 1.1 ? C.amber : C.pink;
    const rhatTxt = st.rhat >= 10 ? st.rhat.toFixed(1) : st.rhat.toFixed(2);
    const verdict = st.rhat < 1.01 ? 'agree ✓' : st.rhat < 1.1 ? 'borderline' : 'disagree ✗';
    fbox(box, [
      ['CHAIN MEANS (post warm-up)', C.muted],
      `  ${st.means.map(m => `${Math.round(m)}%`).join(', ')}`,
      [`within spread  ≈ ${fmt(Math.round(st.withinSD * 10) / 10)}%`, C.cyan],
      [`between spread ≈ ${fmt(Math.round(st.betweenSD * 10) / 10)}%`, C.amber],
      [`R-hat = ${rhatTxt}  (${verdict})`, rhatCol],
    ]);

    const startSpan = Math.max(...starts) - Math.min(...starts);
    note.textContent = st.rhat < 1.01
      ? (startSpan < 40
        ? 'R-hat is near 1, but your starts are close together. Drag them further apart to truly test exploration.'
        : 'All four chains mix over the same band and agree on the failure rate near 25%.')
      : 'The chains do not agree yet: between-chain spread is too big compared with within-chain movement.';

    chal.update({ rhat: st.rhat, stepSize, nSteps, warmup, startSpan, seenWarmup0, goodNewData });
  }

  simulate();
  draw();
  return () => {};
}
