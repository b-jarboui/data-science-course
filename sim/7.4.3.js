// 7.4.3 Try it: Normality checks and sample size (Shapiro-Wilk W and p-value).
// Drag individual cookies when n <= 12, or change shape and sample size up to n = 2,000,
// run 50 repeated checks, and test your intuition with 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  // --- Accurate normal & Shapiro-Wilk (Royston AS R94) math ---
  function pnorm(z) {
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * erf);
  }

  function qnorm(p) {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425, ph = 1 - pl;
    if (p < pl) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= ph) {
      const q = p - 0.5, r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function shapiroWilk(vals) {
    const n = vals.length;
    const x = vals.slice().sort((a, b) => a - b);
    const mean = x.reduce((a, b) => a + b, 0) / n;
    let ss = 0;
    for (let i = 0; i < n; i++) ss += (x[i] - mean) ** 2;
    if (ss < 1e-12) return { W: 1, p: 1, mean, sd: 0, sorted: x };
    const sd = Math.sqrt(ss / Math.max(1, n - 1));

    if (n === 3) {
      const W = Math.min(1, Math.max(0.75, ((x[2] - x[0]) ** 2 / 2) / ss));
      const p = Math.min(1, Math.max(0, (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.PI / 3)));
      return { W, p, mean, sd, sorted: x };
    }

    const m = new Float64Array(n);
    let m2 = 0;
    for (let i = 0; i < n; i++) {
      m[i] = qnorm((i + 1 - 0.375) / (n + 0.25));
      m2 += m[i] * m[i];
    }
    const u = 1 / Math.sqrt(n);
    const a = new Float64Array(n);
    const cn = m[n - 1] / Math.sqrt(m2);
    a[n - 1] = ((((-2.706056 * u + 4.434685) * u - 2.071190) * u - 0.147981) * u + 0.221157) * u + cn;
    a[0] = -a[n - 1];

    if (n >= 6) {
      const cn1 = m[n - 2] / Math.sqrt(m2);
      a[n - 2] = ((((-3.582633 * u + 5.682633) * u - 1.752461) * u - 0.293762) * u + 0.042981) * u + cn1;
      a[1] = -a[n - 2];
      const phi = (m2 - 2 * m[n - 1] ** 2 - 2 * m[n - 2] ** 2) / (1 - 2 * a[n - 1] ** 2 - 2 * a[n - 2] ** 2);
      const sp = Math.sqrt(phi);
      for (let i = 2; i < n - 2; i++) a[i] = m[i] / sp;
    } else {
      const phi = (m2 - 2 * m[n - 1] ** 2) / (1 - 2 * a[n - 1] ** 2);
      const sp = Math.sqrt(phi);
      for (let i = 1; i < n - 1; i++) a[i] = m[i] / sp;
    }

    let num = 0;
    for (let i = 0; i < n; i++) num += a[i] * x[i];
    const W = Math.min(1, Math.max(1e-9, (num * num) / ss));

    let p = 1;
    if (W < 1 - 1e-12) {
      if (n <= 11) {
        const gamma = 0.459 * n - 2.273;
        const l1w = Math.log(1 - W);
        if (l1w >= gamma) {
          p = 0;
        } else {
          const y = -Math.log(gamma - l1w);
          const mu = -0.0006714 * n ** 3 + 0.025054 * n ** 2 - 0.39978 * n + 0.5440;
          const sigma = Math.exp(-0.0020322 * n ** 3 + 0.062767 * n ** 2 - 0.77857 * n + 1.3822);
          p = 1 - pnorm((y - mu) / sigma);
        }
      } else {
        const ln = Math.log(n);
        const y = Math.log(1 - W);
        const mu = 0.0038915 * ln ** 3 - 0.083751 * ln ** 2 - 0.31082 * ln - 1.5861;
        const sigma = Math.exp(0.0030302 * ln ** 2 - 0.082676 * ln - 0.4803);
        p = 1 - pnorm((y - mu) / sigma);
      }
    }
    return { W, p: Math.min(1, Math.max(0, p)), mean, sd, sorted: x };
  }

  // --- Data generators ---
  const SIZES = [3, 5, 8, 12, 25, 50, 100, 300, 1000, 2000];
  const SHAPES = [
    { id: 'night', label: 'Night (26, 30, 34)', desc: 'The 3 night-shift cookies from the lesson.' },
    { id: 'bell', label: 'True bell', desc: 'Cookies drawn from a true normal bell shape.' },
    { id: 'flat', label: 'Flat shape', desc: 'Every weight from 24 to 36 g is equally likely.' },
    { id: 'skew', label: 'Slight skew', desc: 'Almost a bell, with one side stretching a tiny bit further.' },
    { id: 'strong', label: 'Strong skew', desc: 'One side stretches clearly further.' }
  ];

  function sampleFrom(shapeId, n) {
    if (shapeId === 'night' && n === 3) return [26, 30, 34];
    const arr = [];
    for (let i = 0; i < n; i++) {
      let v;
      if (shapeId === 'flat') {
        v = 24 + Math.random() * 12;
      } else if (shapeId === 'skew') {
        const z = randn();
        v = 30 + 2.2 * (z + 0.062 * (z * z - 1));
      } else if (shapeId === 'strong') {
        const z = randn();
        v = 29.2 + 1.75 * (Math.exp(0.48 * z) - 1.12);
      } else {
        v = 30 + 2.4 * randn();
      }
      arr.push(Math.max(20, Math.min(40, Math.round(v * 10) / 10)));
    }
    return arr;
  }

  // --- State ---
  let shape = 'night';
  let sizeIdx = 0;
  let data = [26, 30, 34];
  let sel = 2;
  let batch = null; // { shape, n, pass, fail }

  // --- DOM ---
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 380, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 28 : 42, X1 = VW - 18, BASE = 322, TOP = 42;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sizeVal = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber } }, 'n = 3');
  const sizeSlider = h('input', {
    type: 'range', min: 0, max: SIZES.length - 1, value: 0,
    style: { flex: '1 1 140px', accentColor: C.cyan },
    oninput: () => {
      sizeIdx = +sizeSlider.value;
      if (shape === 'night' && SIZES[sizeIdx] !== 3) shape = 'bell';
      data = sampleFrom(shape, SIZES[sizeIdx]);
      sel = Math.min(sel, data.length - 1);
      batch = null;
      draw();
    }
  });
  const shapeBtns = SHAPES.map(sh => btn(sh.label, () => {
    shape = sh.id;
    if (shape === 'night') { sizeIdx = 0; sizeSlider.value = 0; }
    data = sampleFrom(shape, SIZES[sizeIdx]);
    sel = Math.min(sel, data.length - 1);
    batch = null;
    draw();
  }));
  const nudgeRow = h('div', { class: 'sim-row', style: { alignItems: 'center' } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  nudgeRow.append(btn('−1 g', () => bump(-1)), btn('+1 g', () => bump(1)), selLabel);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: normality checks and sample size'),
    h('p', { class: 'sub' }, 'Pick a true shape and sample size, or drag the cookies when n ≤ 12. Watch Shapiro–Wilk W and the p-value react.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        nudgeRow,
        h('div', { class: 'sim-row' }, ...shapeBtns),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Sample size:'), sizeSlider, sizeVal),
        h('div', { class: 'sim-row' },
          btn('New sample (random)', () => {
            if (shape === 'night') shape = 'bell';
            data = sampleFrom(shape, SIZES[sizeIdx]);
            batch = null;
            draw();
          }, 'go'),
          btn('Run 50 checks', () => {
            const n = SIZES[sizeIdx];
            const runShape = shape === 'night' ? 'bell' : shape;
            let pass = 0, fail = 0;
            for (let k = 0; k < 50; k++) {
              const smp = sampleFrom(runShape, n);
              const res = shapiroWilk(smp);
              if (res.p < 0.05) fail++; else pass++;
              if (k === 49) data = smp;
            }
            batch = { shape: runShape, n, pass, fail };
            draw();
          }),
          btn('Reset (26, 30, 34)', () => {
            shape = 'night'; sizeIdx = 0; sizeSlider.value = 0;
            data = [26, 30, 34]; sel = 2; batch = null; draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // --- Self-checking challenges ---
  const chal = challenges(ch, [
    {
      text: 'With the 3 night cookies (26, 30, 34), nudge or drag the 34 g cookie to 32 g. Does the check still pass?',
      check: st => st.n === 3 && Math.abs(st.sorted[0] - 26) < 0.15 && Math.abs(st.sorted[1] - 30) < 0.15 && Math.abs(st.sorted[2] - 32) < 0.15,
      why: 'Yes! W drops to about 0.96, and p is about 0.64 — far above 0.05. Three cookies barely test shape.'
    },
    {
      text: 'Pick “Flat shape”, set sample size to n = 5 (or 3), and press “Run 50 checks”. Notice how many still pass.',
      check: st => st.batch && st.batch.shape === 'flat' && st.batch.n <= 5,
      why: 'Almost all of them pass, even though a flat shape is nothing like a bell. Tiny samples rarely fail.'
    },
    {
      text: 'Pick “Slight skew” and move sample size to n = 2000. Watch W stay near 0.99 while the check fails.',
      check: st => st.shape === 'skew' && st.n === 2000 && st.W > 0.98 && st.p < 0.05,
      why: 'With 2,000 cookies the test has sharp eyes: W is near 0.99, yet p drops far below 0.05 over a tiny lean.'
    },
    {
      text: 'Pick “True bell” with n = 50 and press “Run 50 checks”. Do a few true-bell samples still fail by chance?',
      check: st => st.batch && st.batch.shape === 'bell' && st.batch.n >= 25,
      why: 'About 5 in 100 samples from a true bell fail by pure chance — a fail is evidence, not proof.'
    }
  ]);

  // --- Interaction (drag dots when n <= 12) ---
  const LO = 20, HI = 40;
  const v2x = v => X0 + ((v - LO) / (HI - LO)) * (X1 - X0);
  const x2v = x => LO + ((x - X0) / (X1 - X0)) * (HI - LO);

  function bump(delta) {
    if (data.length > 12) return;
    data[sel] = Math.max(LO, Math.min(HI, Math.round((data[sel] + delta) * 10) / 10));
    batch = null;
    draw();
  }

  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    if (data.length > 12) return;
    const pt = toSvg(e);
    let best = -1, bestD = 32 * F;
    data.forEach((v, i) => {
      const d = Math.hypot(v2x(v) - pt.x, (BASE - 24) - pt.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) {
      sel = best; dragging = best;
      svg.setPointerCapture(e.pointerId);
      draw();
    }
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0 || data.length > 12) return;
    const pt = toSvg(e);
    const nv = Math.round(x2v(pt.x) * 2) / 2; // 0.5 g snaps cleanly to 26, 30, 32, 34
    data[dragging] = Math.max(LO, Math.min(HI, nv));
    batch = null;
    draw();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function fmtP(p) {
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  }

  // --- Draw ---
  function draw() {
    const n = data.length;
    const res = shapiroWilk(data);
    const pass = res.p >= 0.05;
    const k = [];

    // Highlight active shape button
    SHAPES.forEach((sh, i) => {
      shapeBtns[i].className = 'sim-btn' + (sh.id === shape ? ' go' : '');
    });
    sizeVal.textContent = `n = ${n}`;
    nudgeRow.style.display = n <= 12 ? 'flex' : 'none';

    // Grid & grams axis
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    for (let g = LO; g <= HI; g += 2) {
      const x = v2x(g);
      k.push(s('line', { x1: x, x2: x, y1: TOP, y2: BASE, stroke: C.line, 'stroke-opacity': g % 4 === 0 ? 0.55 : 0.25 }));
      if (g % 4 === 0) {
        k.push(s('line', { x1: x, x2: x, y1: BASE - 5, y2: BASE + 5, stroke: C.muted, 'stroke-width': 2 }),
          s('text', { x, y: BASE + 24, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
      }
    }
    k.push(s('text', { x: X1, y: BASE + 44, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, sans-serif' }, 'weight (grams)'));

    const sdDraw = Math.max(0.8, res.sd || 2.5);
    const bellH = BASE - TOP - 28;
    const gauss = x => Math.exp(-0.5 * ((x - res.mean) / sdDraw) ** 2);

    if (n <= 12) {
      // Small-n view: fitted bell + equal-area slices + amber expected spots + draggable cookie dots
      // Shaded slices
      const cuts = [];
      for (let i = 1; i < n; i++) cuts.push(res.mean + sdDraw * qnorm(i / n));
      const nStrips = 80;
      for (let i = 0; i < nStrips; i++) {
        const v = LO + (i + 0.5) * ((HI - LO) / nStrips);
        const h = bellH * gauss(v);
        if (h < 1) continue;
        const sIdx = cuts.filter(c => v > c).length;
        const x = v2x(v), sw = (X1 - X0) / nStrips;
        k.push(s('rect', {
          x: x - sw / 2, y: BASE - h, width: sw + 0.5, height: h,
          fill: sIdx % 2 === 0 ? C.cyan : C.violet, 'fill-opacity': 0.16
        }));
      }
      cuts.forEach(c => {
        if (c > LO && c < HI) {
          const cx = v2x(c), h = bellH * gauss(c);
          k.push(s('line', { x1: cx, x2: cx, y1: BASE, y2: BASE - h, stroke: C.ink, 'stroke-opacity': 0.35, 'stroke-width': 1.2 }));
        }
      });

      // Fitted bell curve path
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const v = LO + (HI - LO) * (i / 100);
        pts.push(`${v2x(v).toFixed(1)},${(BASE - bellH * gauss(v)).toFixed(1)}`);
      }
      k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));

      // Expected bell spots (order-statistic centers scaled cleanly to match sample sd)
      const orderIdx = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
      const rawZ = orderIdx.map((_, r) => qnorm((r + 0.5) / n));
      const zSd = Math.sqrt(rawZ.reduce((a, b) => a + b * b, 0) / Math.max(1, n - 1)) || 1;
      const expSpots = rawZ.map(z => res.mean + (res.sd || 0) * (z / zSd));

      orderIdx.forEach((item, rank) => {
        const sx = v2x(expSpots[rank]), dx = v2x(item.v), dy = BASE - 24;
        // Pink mismatch bar
        if (Math.abs(dx - sx) > 2) {
          k.push(s('line', { x1: sx, x2: dx, y1: dy - 22, y2: dy - 22, stroke: C.pink, 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
        }
        // Expected amber spot ring
        k.push(s('circle', { cx: sx, cy: dy, r: 10 * F, fill: C.bg, 'fill-opacity': 0.85, stroke: C.amber, 'stroke-width': 2.5 }));
      });

      // Draggable cookie dots
      data.forEach((v, i) => {
        const cx = v2x(v), cy = BASE - 24, isSel = i === sel;
        if (isSel) k.push(s('circle', { cx, cy, r: 18 * F, fill: C.violet, 'fill-opacity': 0.25, stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
        k.push(s('circle', { cx, cy, r: 7.5 * F, fill: C.violet, style: 'cursor:ew-resize' }));
        if (n <= 8 || isSel) {
          k.push(s('text', { x: cx, y: cy - 30, fill: isSel ? C.amber : C.violet, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(v)));
        }
      });

      selLabel.textContent = `Selected cookie ${sel + 1}: ${fmt(data[sel])} g`;
    } else {
      // Large-n view: histogram + dashed ideal bell overlay
      const nBins = n >= 300 ? 28 : (n >= 50 ? 20 : 14);
      const binW = (HI - LO) / nBins;
      const counts = new Array(nBins).fill(0);
      data.forEach(v => {
        const b = Math.min(nBins - 1, Math.max(0, Math.floor((v - LO) / binW)));
        counts[b]++;
      });
      const maxC = Math.max(1, ...counts);
      // Compare histogram density to normal density scaled to same total area
      const areaScale = n * binW / (sdDraw * Math.sqrt(2 * Math.PI));
      const yMax = Math.max(maxC, areaScale) * 1.08;

      counts.forEach((c, i) => {
        const bx = v2x(LO + i * binW), bw = (X1 - X0) / nBins;
        const h = (c / yMax) * bellH;
        const mid = LO + (i + 0.5) * binW;
        const expC = areaScale * gauss(mid);
        const over = c > expC * 1.18 && mid > res.mean + sdDraw;
        k.push(s('rect', {
          x: bx + 1, y: BASE - h, width: Math.max(1, bw - 2), height: h,
          fill: over ? C.pink : C.violet, 'fill-opacity': 0.72, rx: 1.5
        }));
      });

      // Dashed ideal bell overlay
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const v = LO + (HI - LO) * (i / 100);
        const h = (areaScale * gauss(v) / yMax) * bellH;
        pts.push(`${v2x(v).toFixed(1)},${(BASE - h).toFixed(1)}`);
      }
      k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
    }

    // Status pill at top right of SVG
    const badgeCol = pass ? C.green : C.pink;
    const badgeTxt = pass ? `PASS  (p = ${fmtP(res.p)})` : `FAIL  (p = ${fmtP(res.p)})`;
    const bwBadge = (NARROW ? 168 : 196);
    k.push(
      s('rect', { x: X1 - bwBadge, y: 10, width: bwBadge, height: 28, rx: 14, fill: C.bg, stroke: badgeCol, 'stroke-width': 1.8 }),
      s('text', { x: X1 - bwBadge / 2, y: 29, fill: badgeCol, 'font-size': 13.5 * (NARROW ? 1.05 : 1), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, badgeTxt)
    );
    // Legend label top left
    k.push(s('text', { x: X0, y: 27, fill: C.muted, 'font-size': 12.5 * F, 'font-family': 'Consolas' },
      n <= 12 ? '● cookies   ○ bell spots' : 'bars = sample   --- = bell'));

    svg.replaceChildren(...k);

    // Formula box
    const shObj = SHAPES.find(x => x.id === shape);
    const lines = [
      [`shape  = ${shObj.label}`, C.ink],
      [`size n = ${n}`, C.amber]
    ];
    if (n <= 8) {
      lines.push([`values = ${res.sorted.map(fmt).join(', ')}`, C.violet]);
    } else {
      lines.push([`mean = ${fmt(Math.round(res.mean * 10) / 10)} g   sd = ${fmt(Math.round(res.sd * 10) / 10)} g`, C.muted]);
    }
    lines.push([`W      = ${res.W.toFixed(3)}`, C.cyan]);
    lines.push([`p      = ${fmtP(res.p)}  → ${pass ? 'PASS (≥ 0.05)' : 'FAIL (< 0.05)'}`, badgeCol]);
    if (batch) {
      lines.push([`50 checks: ${batch.pass} pass, ${batch.fail} fail`, batch.fail > batch.pass ? C.pink : C.green]);
    }
    fbox(box, lines);

    // Context note
    if (batch) {
      note.textContent = `Out of 50 fresh samples (n = ${batch.n}, ${SHAPES.find(x => x.id === batch.shape).label}), ${batch.pass} passed and ${batch.fail} failed at the 0.05 cut-off.`;
    } else if (n <= 5) {
      note.textContent = 'Tiny sample: the check rarely fails, even when the true shape is flat or skewed.';
    } else if (n >= 1000 && shape === 'skew') {
      note.textContent = 'Huge sample: W stays near 0.99, yet p drops below 0.05 because even a tiny lean stands out.';
    } else {
      note.textContent = shObj.desc + ' Always read W and p together with the sample size and the plot.';
    }

    chal.update({ shape, n, W: res.W, p: res.p, sorted: res.sorted, batch });
  }

  draw();
  return () => {};
}
