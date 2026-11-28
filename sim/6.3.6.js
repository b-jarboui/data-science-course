// 6.3.6 Try it: prior sensitivity analysis.
// Compare two priors (Owner in cyan, Manager in violet) updated with the same batch of parts.
// Adjust batch size, failures, or either prior, draw fresh random data, grow the batch by +20,
// and watch the two posteriors and their 95% credible intervals separate or merge.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Lanczos log-gamma & exact Beta PDF / 95% credible interval (for a, b >= 1)
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
  const betaPdf = (x, a, b) => {
    if (x <= 0) return a === 1 ? b : 0;
    if (x >= 1) return b === 1 ? a : 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
  };

  function betaCI95(a, b) {
    const N = 800, dx = 1 / N;
    const ys = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) ys[i] = betaPdf(i * dx, a, b);
    const cdf = new Float64Array(N + 1);
    for (let i = 1; i <= N; i++) cdf[i] = cdf[i - 1] + 0.5 * (ys[i - 1] + ys[i]) * dx;
    const tot = cdf[N] || 1;
    const quant = q => {
      const target = q * tot;
      for (let i = 1; i <= N; i++) {
        if (cdf[i] >= target) {
          const frac = (target - cdf[i - 1]) / Math.max(1e-12, cdf[i] - cdf[i - 1]);
          return (i - 1 + frac) * dx;
        }
      }
      return 1;
    };
    return [quant(0.025), quant(0.975)];
  }

  const pct1 = x => fmt(Math.round(x * 1000) / 10) + '%';
  const pct0 = x => Math.round(x * 100) + '%';

  // State: Owner Beta(2, 8), Manager Beta(1, 1), Batch = 3 fail, 7 pass (10 parts)
  let a1 = 2, b1 = 8;
  let a2 = 1, b2 = 1;
  let n = 10, f = 3;
  let trueRate = 0.30, isRandom = false, randomAdded = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  function makeSlider(label, col, min, max, get, set) {
    const valEl = h('span', { style: { color: col, fontFamily: 'Consolas, monospace', fontWeight: 700, minWidth: '3.2ch', textAlign: 'right' } });
    const inp = h('input', {
      type: 'range', min, max, value: get(),
      style: { flex: '1 1 7.5rem', accentColor: col, minHeight: '36px' },
      oninput: e => { set(+e.target.value); draw(); }
    });
    const minus = btn('−', () => { set(Math.max(min, get() - 1)); draw(); }, 'ghost');
    const plus = btn('+', () => { set(Math.min(+inp.max, get() + 1)); draw(); }, 'ghost');
    minus.style.padding = '0 .6rem';
    plus.style.padding = '0 .6rem';
    const row = h('div', { class: 'sim-row', style: { marginTop: '.4rem' } },
      h('span', { style: { color: '#b2bdd9', minWidth: '10.2rem', fontSize: '.9rem' } }, label),
      minus, inp, plus, valEl);
    return {
      row,
      sync(newMax) {
        if (newMax != null) inp.max = String(newMax);
        const v = get();
        if (v > +inp.max) inp.max = String(v);
        inp.value = String(v);
        valEl.textContent = String(v);
      }
    };
  }

  const slN = makeSlider('Batch size (parts)', C.amber, 0, 200, () => n, v => {
    const rate = n > 0 ? f / n : trueRate;
    n = v;
    f = Math.max(0, Math.min(n, Math.round(rate * n)));
  });
  const slF = makeSlider('Batch failures', C.pink, 0, 200, () => f, v => {
    f = Math.max(0, Math.min(n, v));
    if (n > 0) trueRate = f / n;
  });
  const slA1 = makeSlider('Owner prior (a)', C.cyan, 1, 50, () => a1, v => { a1 = v; });
  const slB1 = makeSlider('Owner prior (b)', C.cyan, 1, 50, () => b1, v => { b1 = v; });
  const slA2 = makeSlider('Manager prior (a)', C.violet, 1, 50, () => a2, v => { a2 = v; });
  const slB2 = makeSlider('Manager prior (b)', C.violet, 1, 50, () => b2, v => { b2 = v; });

  function newRandomData() {
    n = rnd(8, 16);
    trueRate = rnd(15, 55) / 100;
    let nf = 0;
    for (let i = 0; i < n; i++) if (Math.random() < trueRate) nf++;
    f = nf;
    isRandom = true;
    randomAdded = 0;
    draw();
  }

  function addMore20() {
    const rate = isRandom ? trueRate : (n > 0 ? f / n : 0.30);
    let nf = 0;
    for (let i = 0; i < 20; i++) if (Math.random() < rate) nf++;
    const addN = Math.min(20, 250 - n);
    if (addN <= 0) return;
    const scaledFail = addN === 20 ? nf : Math.round((nf / 20) * addN);
    n += addN;
    f = Math.min(n, f + scaledFail);
    if (isRandom) randomAdded++;
    draw();
  }

  function startAgain() {
    a1 = 2; b1 = 8; a2 = 1; b2 = 1;
    n = 10; f = 3; trueRate = 0.30;
    isRandom = false; randomAdded = 0;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: prior sensitivity'),
    h('p', { class: 'sub' }, 'Update Owner’s prior (cyan) and Manager’s prior (purple) with the same batch of parts. Drag on the chart to change the batch rate, grow the batch size, or change either prior and watch whether the two posteriors agree.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('New data (random)', newRandomData, 'go'),
          btn('Add +20 random parts', addMore20),
          btn('Small batch (3/10)', () => { n = 10; f = 3; trueRate = 0.30; isRandom = false; draw(); }),
          btn('Big batch (30/100)', () => { n = 100; f = 30; trueRate = 0.30; isRandom = false; draw(); }),
          btn('Strong owner (8, 32)', () => { a1 = 8; b1 = 32; draw(); }),
          btn('Start again', startAgain)),
        slN.row, slF.row, slA1.row, slB1.row, slA2.row, slB2.row),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Keep Owner Beta(2, 8) and Manager Beta(1, 1). Grow the batch until the two posterior means are within 2 percentage points of each other.',
      check: st => st.a1 === 2 && st.b1 === 8 && st.a2 === 1 && st.b2 === 1 && st.n > 0 && st.gap <= 0.02,
      why: 'With enough data, both hills slide to the same place and nearly merge — the data speak louder than the prior.'
    },
    {
      text: 'With only 10 parts in the batch, adjust the two priors so the posterior means sit at least 15 percentage points apart.',
      check: st => st.n === 10 && st.gap >= 0.15,
      why: 'When data are small, different priors pull the posteriors far apart. Say so honestly and collect more data.'
    },
    {
      text: 'Make Owner’s prior heavy (a + b ≥ 40, e.g. press “Strong owner (8, 32)”), keep Manager flat (1, 1), and test the big batch (100+ parts).',
      check: st => (st.a1 + st.b1) >= 40 && st.a2 === 1 && st.b2 === 1 && st.n >= 100,
      why: 'A heavier prior carries more weight, so it takes even more real parts before the two posteriors agree.'
    },
    {
      text: 'Press “New data (random)” and then press “Add +20 random parts” three times. Watch the two hills and their 95% intervals.',
      check: st => st.randomAdded >= 3,
      why: 'No matter what fresh data look like, adding more parts shrinks both 95% intervals and brings the two priors together.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 410 : 700, VH = 440, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 24 : 38), W = X1 - X0;
  const TOP = 42, BASE = 266, H = BASE - TOP;
  const xOf = rate => X0 + rate * W;

  // Pointer drag on chart sets batch failure rate (when n > 0)
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  function setRateFromPointer(e) {
    if (n <= 0) return;
    const p = toSvg(e);
    const r = Math.max(0, Math.min(1, (p.x - X0) / W));
    f = Math.round(r * n);
    trueRate = f / n;
    draw();
  }
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= TOP - 10 && p.y <= BASE + 30 && p.x >= X0 && p.x <= X1 && n > 0) {
      dragging = true; svg.setPointerCapture(e.pointerId); setRateFromPointer(e);
    }
  });
  svg.addEventListener('pointermove', e => { if (dragging) setRateFromPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });

  function curvePaths(a, b, maxY) {
    const N = 140;
    let dLine = '', dFill = `M ${xOf(0).toFixed(1)} ${BASE}`;
    for (let i = 0; i <= N; i++) {
      const r = i / N;
      const y = BASE - (betaPdf(r, a, b) / maxY) * H;
      const x = xOf(r);
      dLine += (i ? ' L ' : 'M ') + `${x.toFixed(1)} ${y.toFixed(1)}`;
      dFill += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    dFill += ` L ${xOf(1).toFixed(1)} ${BASE} Z`;
    return { dLine, dFill };
  }

  function draw() {
    slN.sync(Math.max(200, n));
    slF.sync(n);
    slA1.sync(); slB1.sync();
    slA2.sync(); slB2.sync();

    const p = n - f;
    const pa1 = a1 + f, pb1 = b1 + p;
    const pa2 = a2 + f, pb2 = b2 + p;
    const m1 = pa1 / (pa1 + pb1);
    const m2 = pa2 / (pa2 + pb2);
    const gap = Math.abs(m1 - m2);
    const ci1 = betaCI95(pa1, pb1);
    const ci2 = betaCI95(pa2, pb2);

    // Common density scale across both posteriors and both priors
    let maxY = 1.4;
    for (let i = 0; i <= 160; i++) {
      const r = i / 160;
      maxY = Math.max(maxY, betaPdf(r, a1, b1), betaPdf(r, a2, b2), betaPdf(r, pa1, pb1), betaPdf(r, pa2, pb2));
    }
    maxY *= 1.12;

    const k = [];

    // Vertical grid & 0%..100% ticks
    for (let g = 0; g <= 100; g += 20) {
      const x = xOf(g / 100);
      k.push(
        s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x, y: BASE + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g + '%')
      );
    }
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));

    // Faint dashed starting priors
    const pr1 = curvePaths(a1, b1, maxY);
    const pr2 = curvePaths(a2, b2, maxY);
    k.push(
      s('path', { d: pr1.dLine, fill: 'none', stroke: C.cyan, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', 'stroke-opacity': 0.45 }),
      s('path', { d: pr2.dLine, fill: 'none', stroke: C.violet, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', 'stroke-opacity': 0.45 })
    );

    // Glowing posterior hills
    const po1 = curvePaths(pa1, pb1, maxY);
    const po2 = curvePaths(pa2, pb2, maxY);
    k.push(
      s('path', { d: po1.dFill, fill: C.cyan, 'fill-opacity': 0.18 }),
      s('path', { d: po1.dLine, fill: 'none', stroke: C.cyan, 'stroke-width': 2.8 }),
      s('path', { d: po2.dFill, fill: C.violet, 'fill-opacity': 0.18 }),
      s('path', { d: po2.dLine, fill: 'none', stroke: C.violet, 'stroke-width': 2.8 })
    );

    // Batch rate marker (draggable handle)
    if (n > 0) {
      const br = f / n, xb = xOf(br);
      k.push(
        s('line', { x1: xb, x2: xb, y1: TOP + 6, y2: BASE, stroke: C.amber, 'stroke-width': 1.8, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.75 }),
        s('circle', { cx: xb, cy: TOP + 8, r: 5.5, fill: C.amber, style: 'cursor:ew-resize' })
      );
    }

    // Posterior mean lines
    const x1m = xOf(m1), x2m = xOf(m2);
    k.push(
      s('line', { x1: x1m, x2: x1m, y1: BASE, y2: BASE - (betaPdf(m1, pa1, pb1) / maxY) * H, stroke: C.cyan, 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }),
      s('circle', { cx: x1m, cy: BASE, r: 5, fill: C.cyan }),
      s('line', { x1: x2m, x2: x2m, y1: BASE, y2: BASE - (betaPdf(m2, pa2, pb2) / maxY) * H, stroke: C.violet, 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }),
      s('circle', { cx: x2m, cy: BASE, r: 5, fill: C.violet })
    );

    // Top legend + live sensitivity badge
    const gapCol = gap <= 0.02 ? C.green : gap <= 0.05 ? C.amber : C.pink;
    const gapTxt = gap <= 0.02 ? `AGREE (${fmt(Math.round(gap * 1000) / 10)} pts)`
      : `GAP ${fmt(Math.round(gap * 1000) / 10)} pts`;
    k.push(
      s('circle', { cx: X0 + 6, cy: 18, r: 5, fill: C.cyan }),
      s('text', { x: X0 + 16, y: 22, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Owner Beta(${pa1},${pb1})`),
      s('circle', { cx: X0 + (NARROW ? 162 : 210), cy: 18, r: 5, fill: C.violet }),
      s('text', { x: X0 + (NARROW ? 172 : 220), y: 22, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Mgr Beta(${pa2},${pb2})`),
      s('text', { x: X1, y: 22, fill: gapCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, gapTxt)
    );

    // 95% credible intervals below the axis
    k.push(s('text', { x: X0, y: 318, fill: C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, '95% CREDIBLE INTERVALS (dashed curves above = starting priors)'));

    function drawCI(ci, mean, y, col, label) {
      const xl = xOf(ci[0]), xr = xOf(ci[1]), xm = xOf(mean);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }),
        s('line', { x1: xl, x2: xr, y1: y, y2: y, stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round' }),
        s('line', { x1: xl, x2: xl, y1: y - 7, y2: y + 7, stroke: col, 'stroke-width': 2.2 }),
        s('line', { x1: xr, x2: xr, y1: y - 7, y2: y + 7, stroke: col, 'stroke-width': 2.2 }),
        s('circle', { cx: xm, cy: y, r: 4.5, fill: C.bg, stroke: col, 'stroke-width': 2.5 }),
        s('text', { x: X0, y: y - 11, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' },
          `${label}: ${pct0(ci[0])}–${pct0(ci[1])}  (mean ${pct1(mean)})`)
      );
    }
    drawCI(ci1, m1, 356, C.cyan, 'Owner');
    drawCI(ci2, m2, 408, C.violet, 'Manager');

    svg.replaceChildren(...k);

    // Live formula box
    const batchLine = n > 0
      ? `batch:   ${f} fail, ${p} pass (${n} parts, ${pct0(f / n)})`
      : 'batch:   0 parts (priors only)';
    fbox(box, [
      [batchLine, C.amber],
      [`Owner:   Beta(${a1}+${f}, ${b1}+${p}) = Beta(${pa1}, ${pb1})`, C.cyan],
      [`  mean ${pct1(m1)}  ·  95% CI ${pct0(ci1[0])}–${pct0(ci1[1])}`, C.cyan],
      [`Manager: Beta(${a2}+${f}, ${b2}+${p}) = Beta(${pa2}, ${pb2})`, C.violet],
      [`  mean ${pct1(m2)}  ·  95% CI ${pct0(ci2[0])}–${pct0(ci2[1])}`, C.violet],
      [`mean gap: ${fmt(Math.round(gap * 1000) / 10)} percentage points`, gapCol]
    ]);

    if (n === 0) {
      note.textContent = 'With no data yet, each posterior equals its starting prior. Raise the batch size or press “New data (random)”.';
    } else if (gap <= 0.02) {
      note.textContent = 'The two hills and 95% intervals nearly merge: the data are doing the talking, so you can report the answer with confidence.';
    } else if (gap <= 0.05) {
      note.textContent = 'Getting closer: the two posteriors mostly overlap, though the starting prior still nudges the answer a little.';
    } else {
      note.textContent = 'Noticeable gap: with this data and these priors, the starting belief still matters. Report the sensitivity or collect more parts.';
    }

    chal.update({ a1, b1, a2, b2, n, f, gap, isRandom, randomAdded });
  }

  draw();
  return () => {};
}
