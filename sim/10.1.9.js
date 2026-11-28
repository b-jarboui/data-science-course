// 10.1.9 Try it: model assumptions and building correlation.
// The learner drags apartments (or shifts a whole building), toggles building colours,
// creates fresh random datasets with/without shared building lean, and tests 100 datasets
// to see how often the usual 95% slope interval actually catches the true slope.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  // Shared Chapter 10.1 data (exact numbers): { a: area, y: rent, b: 0(X)|1(Y)|2(Z) }
  const START = [
    { a: 40, y: 860, b: 0 }, { a: 60, y: 1040, b: 0 }, { a: 80, y: 1250, b: 0 }, { a: 100, y: 1470, b: 0 },
    { a: 40, y: 770, b: 1 }, { a: 60, y: 1020, b: 1 }, { a: 80, y: 1210, b: 1 }, { a: 100, y: 1380, b: 1 },
    { a: 40, y: 770, b: 2 }, { a: 60, y: 940, b: 2 }, { a: 80, y: 1140, b: 2 }, { a: 100, y: 1350, b: 2 },
  ];
  const BCOL = [C.cyan, C.amber, C.pink];
  const BNAME = ['X', 'Y', 'Z'];
  const T95_DF10 = 2.228139;

  let pts = START.map(p => ({ ...p }));
  let sel = 0, showColours = true, lean = 55, lastTest = null;

  const svg = s('svg', { viewBox: '0 0 700 490' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const leanVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.amber } }, `$${lean}`);
  const slider = h('input', {
    type: 'range', min: 0, max: 80, step: 5, value: lean,
    style: { flex: '1 1 140px', accentColor: C.amber },
    oninput: e => { lean = +e.target.value; leanVal.textContent = `$${lean}`; }
  });
  const colBtn = btn('Hide colours', () => {
    showColours = !showColours;
    colBtn.textContent = showColours ? 'Hide colours' : 'Colour by building';
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: checking independence'),
    h('p', { class: 'sub' }, 'Each dot is an apartment, coloured by building (X cyan, Y amber, Z pink). Drag any dot up or down, shift a whole building, or test fresh random datasets.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Dot −20', () => bumpDot(-20)),
          btn('Dot +20', () => bumpDot(20)),
          btn('Building −20', () => bumpBuilding(-20)),
          btn('Building +20', () => bumpBuilding(20)),
          selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Building lean:'),
          slider, leanVal),
        h('div', { class: 'sim-row' },
          btn('New data', () => { makeNewData(); draw(); }, 'go'),
          btn('Test 100 datasets', () => { runTest100(); draw(); }, 'go'),
          colBtn,
          btn('Start again', () => { pts = START.map(p => ({ ...p })); sel = 0; lastTest = null; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // Statistics helpers
  function randn() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function fitOLS(arr) {
    const n = arr.length;
    const mx = arr.reduce((t, p) => t + p.a, 0) / n;
    const my = arr.reduce((t, p) => t + p.y, 0) / n;
    let sxx = 0, sxy = 0, sst = 0;
    for (const p of arr) {
      const dx = p.a - mx, dy = p.y - my;
      sxx += dx * dx; sxy += dx * dy; sst += dy * dy;
    }
    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const res = arr.map(p => p.y - (intercept + slope * p.a));
    const sse = res.reduce((t, r) => t + r * r, 0);
    const r2 = sst > 0 ? Math.max(0, 1 - sse / sst) : 1;
    const sRes = Math.sqrt(Math.max(0, sse / (n - 2)));
    const se = sxx > 0 ? sRes / Math.sqrt(sxx) : 0;
    const margin = T95_DF10 * se;
    const bMeans = [0, 1, 2].map(b => {
      let sum = 0, cnt = 0;
      arr.forEach((p, i) => { if (p.b === b) { sum += res[i]; cnt++; } });
      return cnt ? sum / cnt : 0;
    });
    return { slope, intercept, res, r2, sRes, se, lo: slope - margin, hi: slope + margin, bMeans };
  }

  // Generate a random 12-apartment dataset from 3 buildings (true slope = 10, intercept = 400)
  // Buildings differ moderately in typical apartment size (realistic neighbourhood clustering),
  // so shared building error (lean > 0) makes the naive 95% slope CI too narrow.
  const CLUSTER_AREAS = [
    [40, 45, 55, 60],
    [60, 65, 75, 80],
    [80, 85, 95, 100],
  ];
  function sampleDataset(leanStd) {
    const out = [];
    for (let b = 0; b < 3; b++) {
      const bShift = leanStd * randn();
      for (let k = 0; k < 4; k++) {
        const a = CLUSTER_AREAS[b][k];
        const y = Math.max(620, Math.min(1580, Math.round(400 + 10 * a + bShift + 25 * randn())));
        out.push({ a, y, b });
      }
    }
    return out;
  }

  function makeNewData() {
    pts = sampleDataset(lean);
    lastTest = null;
  }

  function runTest100() {
    let hits = 0, r2Sum = 0;
    for (let t = 0; t < 100; t++) {
      const st = fitOLS(sampleDataset(lean));
      if (st.lo <= 10 && 10 <= st.hi) hits++;
      r2Sum += st.r2;
    }
    lastTest = { lean, hits, meanR2: r2Sum / 100 };
  }

  function clampY(y) { return Math.max(620, Math.min(1580, Math.round(y))); }
  function bumpDot(d) { pts[sel].y = clampY(pts[sel].y + d); lastTest = null; draw(); }
  function bumpBuilding(d) {
    const b = pts[sel].b;
    pts.forEach(p => { if (p.b === b) p.y = clampY(p.y + d); });
    lastTest = null;
    draw();
  }

  // Challenges (easy to deeper, self-checking)
  const chal = challenges(ch, [
    {
      text: 'Drag Building X’s dots down (or use Building −20) until Building X’s mean residual is within $10 of 0.',
      check: st => Math.abs(st.bMeans[0]) <= 10,
      why: 'Nice! When Building X no longer sits entirely above the line, its four apartments stop leaning together.'
    },
    {
      text: 'Move Building Z’s apartments so ALL four sit above the line (every Z residual > 0).',
      check: st => st.zRes.every(r => r > 0),
      why: 'Right: now Building Z’s errors lean together above the line — correlated, not four separate clues.'
    },
    {
      text: 'Set Building lean to $0 and press “Test 100 datasets”. Does the usual 95% interval work when errors are independent?',
      check: st => st.lastTest && st.lastTest.lean === 0,
      why: 'Yes! With no shared building lean, errors are independent and the usual 95% interval catches the true slope about 95 times in 100.'
    },
    {
      text: 'Now set Building lean to $50 or more and press “Test 100 datasets”. How often does the usual interval catch the true slope?',
      check: st => st.lastTest && st.lastTest.lean >= 50,
      why: 'Far less than 95%! Shared building errors make the usual interval too narrow, even when R-squared looks high.'
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 490, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 46 : 58, X1 = VW - 16;
  const Y0 = 26, Y1 = 326; // scatter plot vertical span
  const ax = a => X0 + (a - 30) / 80 * (X1 - X0);
  const ay = y => Y1 - (y - 600) / 1000 * (Y1 - Y0);
  const yToRent = py => 600 + (Y1 - py) / (Y1 - Y0) * 1000;

  // Small horizontal offset if two dots share the exact same area & nearly same rent
  function dotPx(i) {
    const p = pts[i];
    let dx = 0;
    for (let j = 0; j < pts.length; j++) {
      if (j !== i && pts[j].a === p.a && Math.abs(pts[j].y - p.y) < 18) {
        dx = i < j ? -6 * F : 6 * F;
      }
    }
    return [ax(p.a) + dx, ay(p.y)];
  }

  // Pointer dragging (touch & mouse)
  let dragging = -1;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bestD = 34 * F;
    pts.forEach((_, i) => {
      const [dx, dy] = dotPx(i);
      const d = Math.hypot(p.x - dx, p.y - dy);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    pts[dragging].y = clampY(yToRent(p.y));
    lastTest = null;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;
  const signed = x => {
    const v = Math.round(x);
    return v > 0 ? `+$${v}` : v < 0 ? `−$${Math.abs(v)}` : '$0';
  };

  function draw() {
    const st = fitOLS(pts);
    const k = [];

    // Scatter grid & axes
    for (let r = 600; r <= 1600; r += 200) {
      const y = ay(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 7, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r)
      );
    }
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      k.push(
        s('line', { x1: x, x2: x, y1: Y0, y2: Y1, stroke: C.line, 'stroke-opacity': 0.5 }),
        s('text', { x, y: Y1 + 17 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a)
      );
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: (X0 + X1) / 2, y: Y1 + 33 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'area (m²)'),
      s('text', { x: X0 + 4, y: Y0 - 8, fill: C.muted, 'font-size': 12 * F }, 'rent ($)')
    );

    // Fitted OLS line
    const lx0 = 33, lx1 = 107;
    const ly0 = st.intercept + st.slope * lx0, ly1 = st.intercept + st.slope * lx1;
    k.push(s('line', {
      x1: ax(lx0), y1: ay(ly0), x2: ax(lx1), y2: ay(ly1),
      stroke: C.ink, 'stroke-width': 3, 'stroke-opacity': 0.92
    }));

    // Residual sticks and dots
    pts.forEach((p, i) => {
      const [px, py] = dotPx(i);
      const fy = ay(st.intercept + st.slope * p.a);
      const col = showColours ? BCOL[p.b] : C.ink;
      k.push(s('line', { x1: px, y1: fy, x2: px, y2: py, stroke: col, 'stroke-width': 2.2, 'stroke-opacity': 0.78 }));
      if (i === sel) {
        k.push(s('circle', { cx: px, cy: py, r: 12 * F, fill: col, 'fill-opacity': 0.22, stroke: col, 'stroke-width': 1.8 }));
      }
      k.push(s('circle', { cx: px, cy: py, r: 6.5 * F, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor: ns-resize' }));
    });

    // Bottom strip: residuals by building (group-by-group check)
    const BY0 = 376, BZERO = 426, BHALF = 36;
    const rScale = d => BZERO - Math.max(-90, Math.min(90, d)) / 90 * BHALF;
    k.push(
      s('line', { x1: X0, x2: X1, y1: BY0 - 8, y2: BY0 - 8, stroke: C.line }),
      s('text', { x: X0, y: BY0 + 8, fill: C.muted, 'font-size': 12 * F }, 'Residuals by building:'),
      s('line', { x1: X0, x2: X1, y1: BZERO, y2: BZERO, stroke: C.muted, 'stroke-dasharray': '5 5' }),
      s('text', { x: X0 - 7, y: BZERO + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0')
    );

    const gW = (X1 - X0) / 3;
    for (let b = 0; b < 3; b++) {
      const cx = X0 + gW * (b + 0.5);
      const col = showColours ? BCOL[b] : C.muted;
      const bIdx = [];
      pts.forEach((p, i) => { if (p.b === b) bIdx.push(i); });
      bIdx.forEach((idx, m) => {
        const dx = cx + (m - 1.5) * (NARROW ? 16 : 24);
        const ry = rScale(st.res[idx]);
        k.push(
          s('line', { x1: dx, y1: BZERO, x2: dx, y2: ry, stroke: col, 'stroke-width': 2.2, 'stroke-opacity': 0.8 }),
          s('circle', { cx: dx, cy: ry, r: 4.5 * F, fill: col })
        );
      });
      const my = rScale(st.bMeans[b]);
      k.push(
        s('line', { x1: cx - gW * 0.34, x2: cx + gW * 0.34, y1: my, y2: my, stroke: col, 'stroke-width': 3.2 }),
        s('text', { x: cx, y: VH - 8, fill: col, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${BNAME[b]} (${signed(st.bMeans[b])})`)
      );
    }

    svg.replaceChildren(...k);

    // Formula box
    const maxLean = Math.max(...st.bMeans.map(Math.abs));
    const leanWarn = maxLean >= 25;
    const lines = [
      `slope = $${fmt(r2(st.slope))}/m²  |  R² = ${Math.round(st.r2 * 100)}%`,
      [`usual 95% CI: $${fmt(r2(st.lo))} to $${fmt(r2(st.hi))}`, leanWarn ? C.pink : C.green],
      'building mean residuals:',
      [`X ${signed(st.bMeans[0])}   Y ${signed(st.bMeans[1])}   Z ${signed(st.bMeans[2])}`, leanWarn ? C.amber : C.cyan],
    ];
    if (lastTest) {
      const ok = lastTest.hits >= 88;
      lines.push([
        `100 tests (lean $${lastTest.lean}): ${lastTest.hits}/100 hit 10 (R²≈${Math.round(lastTest.meanR2 * 100)}%)`,
        ok ? C.green : C.pink
      ]);
    }
    fbox(box, lines);

    note.textContent = lastTest
      ? (lastTest.hits < 88
          ? `With building lean = $${lastTest.lean}, the usual 95% interval caught the true slope of 10 only ${lastTest.hits} times in 100 — too narrow even though R-squared averaged ${Math.round(lastTest.meanR2 * 100)}%.`
          : `With building lean = $${lastTest.lean}, errors are nearly independent, so the usual 95% interval caught the true slope ${lastTest.hits} times in 100 — right around 95%.`)
      : (leanWarn
          ? 'At least one building leans strongly above or below the line. Shared building errors break independence, so the usual interval cannot be trusted.'
          : 'All three buildings sit close to zero on average — no strong shared building lean here.');

    const sp = pts[sel];
    selLabel.textContent = `Selected: Building ${BNAME[sp.b]}, ${sp.a} m² ($${sp.y}, resid ${signed(st.res[sel])})`;

    const zRes = pts.map((p, i) => (p.b === 2 ? st.res[i] : null)).filter(v => v !== null);
    chal.update({ bMeans: st.bMeans, zRes, r2: st.r2, maxLean, lastTest });
  }

  draw();
  return () => {};
}
