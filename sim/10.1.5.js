// 10.1.5 Try it: least squares as projection onto the column space.
// Drag the landing point across the flat sheet (or use the sliders) to see the residual length²,
// dot products, 90° angle, and Pythagoras' split update live; switch to the scatter plot to see the trap.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const AREAS = [40, 40, 40, 60, 60, 60, 80, 80, 80, 100, 100, 100];
  const START_RENTS = [860, 770, 770, 1040, 1020, 940, 1250, 1210, 1140, 1470, 1380, 1350];
  const BCOL = [C.cyan, C.amber, C.pink]; // Building X, Y, Z

  function solveOLS(rents) {
    const n = rents.length;
    const xBar = 70;
    const yBar = rents.reduce((p, q) => p + q, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = AREAS[i] - xBar;
      num += dx * (rents[i] - yBar);
      den += dx * dx;
    }
    const bStar = num / den;
    const aStar = yBar - bStar * xBar;
    let ssrStar = 0, sst = 0, ssfStar = 0;
    for (let i = 0; i < n; i++) {
      const fit = aStar + bStar * AREAS[i];
      ssrStar += (rents[i] - fit) ** 2;
      sst += (rents[i] - yBar) ** 2;
      ssfStar += (fit - yBar) ** 2;
    }
    return { aStar, bStar, yBar, ssrStar, sst, ssfStar };
  }

  let rents = START_RENTS.slice();
  let ols = solveOLS(rents);
  let a = ols.aStar, b = ols.bStar;
  let mode = 'sheet'; // 'sheet' | 'scatter'
  let anim = 0;
  let movedAway = false, isRandom = false, randomDrops = 0, viewedScatterAtProj = false;

  const SPAN_A = 220, SPAN_B = 5.5;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const fmtInt = x => Math.round(x).toLocaleString('en-US');

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const aVal = h('span', { style: { color: C.amber, fontFamily: 'Consolas, monospace', fontWeight: 700 } });
  const bVal = h('span', { style: { color: C.green, fontFamily: 'Consolas, monospace', fontWeight: 700 } });
  const aSlider = h('input', { type: 'range', step: '1', style: { flex: '1 1 110px', accentColor: C.amber } });
  const bSlider = h('input', { type: 'range', step: '0.1', style: { flex: '1 1 110px', accentColor: C.green } });
  const viewBtn = btn('Show scatter plot', () => toggleMode());

  aSlider.addEventListener('input', () => { cancelAnimationFrame(anim); a = +aSlider.value; draw(); });
  bSlider.addEventListener('input', () => { cancelAnimationFrame(anim); b = +bSlider.value; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: drop straight onto the sheet'),
    h('p', { class: 'sub' }, 'Every point on the green sheet is a list a line can make (intercept × ones + slope × areas). Drag the green dot across the sheet, or press “Drop straight down” to land at the right angle.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 180px' } },
            'Intercept', aSlider, aVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem', flex: '1 1 180px' } },
            'Slope', bSlider, bVal)),
        h('div', { class: 'sim-row' },
          btn('Drop straight down', () => dropToProjection(), 'go'),
          viewBtn,
          btn('New data (random)', () => makeRandomData()),
          btn('Start again', () => resetAll()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Drag the green point away from the landing spot until the residual length² rises above 40,000.',
      check: st => st.ssr > 40000,
      why: 'Yes! Moving anywhere away from the projection makes the residual arrow longer and its squared length bigger.'
    },
    {
      text: 'Bring both dot products back to 0 (drag the point or press “Drop straight down”). Watch the 90° angle return.',
      check: st => st.movedAway && st.atProj,
      why: 'Right: at the closest point, the residual meets both design columns at a right angle, so both dot products are 0.'
    },
    {
      text: 'Press “New data (random)” and then “Drop straight down”, twice. Does fitted² + residual² always equal actual²?',
      check: st => st.randomDrops >= 2,
      why: 'Always! Dropping straight down creates a right-angle triangle, so Pythagoras works for every dataset.'
    },
    {
      text: 'Press “Show scatter plot” while at the projection. Look at the pink residual sticks — are they at 90° to the line?',
      check: st => st.viewedScatterAtProj,
      why: 'No! The 90° angle lives in 12-dimensional list space. On the scatter plot, residual sticks always stay vertical.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // 3D sheet basis: (u, v) in [-1, 1]^2 centered at projection landing point P* = (CX, CY)
  const CX = NARROW ? 205 : 355;
  const CY = 288;
  const UX = NARROW ? [102, 22] : [168, 28];   // intercept direction
  const VX = NARROW ? [52, -46] : [88, -62];   // slope direction
  const H_RES = 165;
  const O_UV = [-0.88, -0.35];

  const sheetPt = (u, v, z = 0) => [
    CX + u * UX[0] + v * VX[0],
    CY + u * UX[1] + v * VX[1] - z
  ];

  function syncSliders() {
    aSlider.min = Math.round(ols.aStar - SPAN_A);
    aSlider.max = Math.round(ols.aStar + SPAN_A);
    bSlider.min = (ols.bStar - SPAN_B).toFixed(1);
    bSlider.max = (ols.bStar + SPAN_B).toFixed(1);
    aSlider.value = a.toFixed(0);
    bSlider.value = b.toFixed(1);
    aVal.textContent = fmt(Math.round(a));
    bVal.textContent = fmt(Math.round(b * 10) / 10);
  }

  function metrics() {
    let ssr = 0, dotOnes = 0, dotAreas = 0, ssf = 0;
    for (let i = 0; i < 12; i++) {
      const fit = a + b * AREAS[i];
      const res = rents[i] - fit;
      ssr += res * res;
      dotOnes += res;
      dotAreas += AREAS[i] * res;
      ssf += (fit - ols.yBar) ** 2;
    }
    const diff = Math.max(0, ssr - ols.ssrStar);
    const angle = Math.atan2(Math.sqrt(ols.ssrStar), Math.sqrt(diff)) * 180 / Math.PI;
    const atProj = Math.abs(a - ols.aStar) < 1.5 && Math.abs(b - ols.bStar) < 0.04;
    return { ssr, dotOnes, dotAreas, ssf, angle, atProj };
  }

  function toggleMode() {
    mode = mode === 'sheet' ? 'scatter' : 'sheet';
    viewBtn.textContent = mode === 'sheet' ? 'Show scatter plot' : 'Show list space';
    draw();
  }

  function makeRandomData() {
    cancelAnimationFrame(anim);
    const trueB = rnd(6, 15);
    const trueA = rnd(5, 11) * 50;
    rents = AREAS.map(ar => Math.max(200, trueA + trueB * ar + rnd(-9, 9) * 10));
    ols = solveOLS(rents);
    a = clamp(ols.aStar + (Math.random() < 0.5 ? -1 : 1) * rnd(70, 150), ols.aStar - SPAN_A, ols.aStar + SPAN_A);
    b = clamp(ols.bStar + (Math.random() < 0.5 ? -1 : 1) * (rnd(15, 35) / 10), ols.bStar - SPAN_B, ols.bStar + SPAN_B);
    isRandom = true;
    draw();
  }

  function resetAll() {
    cancelAnimationFrame(anim);
    rents = START_RENTS.slice();
    ols = solveOLS(rents);
    a = ols.aStar; b = ols.bStar;
    isRandom = false;
    mode = 'sheet';
    viewBtn.textContent = 'Show scatter plot';
    draw();
  }

  function dropToProjection() {
    cancelAnimationFrame(anim);
    const wasOff = Math.abs(a - ols.aStar) > 2 || Math.abs(b - ols.bStar) > 0.05;
    if (isRandom && wasOff) randomDrops++;
    const a0 = a, b0 = b, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      const e = k * k * (3 - 2 * k);
      a = a0 + (ols.aStar - a0) * e;
      b = b0 + (ols.bStar - b0) * e;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Pointer dragging on the SVG (works on touch & mouse)
  let dragging = false;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  function handlePointer(e) {
    const p = toSvg(e);
    if (mode === 'sheet') {
      const dx = p.x - CX, dy = p.y - CY;
      const det = UX[0] * VX[1] - UX[1] * VX[0];
      let u = clamp((dx * VX[1] - dy * VX[0]) / det, -1, 1);
      let v = clamp((UX[0] * dy - UX[1] * dx) / det, -1, 1);
      // Gentle magnetic snap near exact projection
      if (Math.hypot(u, v) < 0.045) { u = 0; v = 0; }
      a = ols.aStar + u * SPAN_A;
      b = ols.bStar + v * SPAN_B;
    } else {
      // Scatter plot drag: drag vertically to shift intercept, or horizontally right/left to tilt
      const sx0 = NARROW ? 56 : 74, sx1 = VW - 24, sy0 = 378, sy1 = 38;
      const minR = Math.min(600, ...rents) - 100, maxR = Math.max(1500, ...rents) + 120;
      const area = clamp(30 + (p.x - sx0) / (sx1 - sx0) * 80, 35, 105);
      const rent = minR + (sy0 - p.y) / (sy0 - sy1) * (maxR - minR);
      if (Math.abs(area - 70) < 14) {
        a = clamp(rent - b * 70, ols.aStar - SPAN_A, ols.aStar + SPAN_A);
      } else {
        const mid = a + b * 70;
        b = clamp((rent - mid) / (area - 70), ols.bStar - SPAN_B, ols.bStar + SPAN_B);
        a = clamp(mid - b * 70, ols.aStar - SPAN_A, ols.aStar + SPAN_A);
      }
    }
    draw();
  }

  svg.addEventListener('pointerdown', e => {
    cancelAnimationFrame(anim);
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    handlePointer(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) handlePointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function svgArrow(els, p0, p1, color, sw = 3.5, tip = 11) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, t = Math.min(tip, len * 0.35);
    const ca = Math.cos(0.45), sa = Math.sin(0.45);
    const b1 = [p1[0] - t * (ux * ca - uy * sa), p1[1] - t * (ux * sa + uy * ca)];
    const b2 = [p1[0] - t * (ux * ca + uy * sa), p1[1] - t * (-ux * sa + uy * ca)];
    els.push(
      s('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }),
      s('line', { x1: b1[0], y1: b1[1], x2: p1[0], y2: p1[1], stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }),
      s('line', { x1: b2[0], y1: b2[1], x2: p1[0], y2: p1[1], stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' })
    );
  }

  function drawSheet(m) {
    const els = [];
    const c0 = sheetPt(-1.05, -1.05), c1 = sheetPt(1.05, -1.05);
    const c2 = sheetPt(1.05, 1.05), c3 = sheetPt(-1.05, 1.05);
    const polyPts = [c0, c1, c2, c3].map(p => p.join(',')).join(' ');
    els.push(s('polygon', { points: polyPts, fill: C.green, 'fill-opacity': 0.11, stroke: C.green, 'stroke-width': 2 }));

    // Grid lines on the flat sheet
    for (const g of [-0.6, -0.2, 0.2, 0.6]) {
      const pA = sheetPt(g, -1.05), pB = sheetPt(g, 1.05);
      const pC = sheetPt(-1.05, g), pD = sheetPt(1.05, g);
      els.push(
        s('line', { x1: pA[0], y1: pA[1], x2: pB[0], y2: pB[1], stroke: C.green, 'stroke-opacity': 0.22, 'stroke-width': 1 }),
        s('line', { x1: pC[0], y1: pC[1], x2: pD[0], y2: pD[1], stroke: C.green, 'stroke-opacity': 0.22, 'stroke-width': 1 })
      );
    }

    const O = sheetPt(O_UV[0], O_UV[1]);
    const Pstar = sheetPt(0, 0);
    const Tip = [Pstar[0], Pstar[1] - H_RES];
    const u = clamp((a - ols.aStar) / SPAN_A, -1, 1);
    const v = clamp((b - ols.bStar) / SPAN_B, -1, 1);
    const Cur = sheetPt(u, v);

    // Subtle plumb-line shadow from Tip to Pstar
    els.push(
      s('line', { x1: Tip[0], y1: Tip[1], x2: Pstar[0], y2: Pstar[1], stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '5 5', 'stroke-opacity': m.atProj ? 0 : 0.4 }),
      s('circle', { cx: Pstar[0], cy: Pstar[1], r: 6, fill: 'none', stroke: C.amber, 'stroke-width': 1.8, 'stroke-opacity': m.atProj ? 0 : 0.65 })
    );

    // Sheet corner label
    els.push(s('text', {
      x: c1[0] - 8, y: c1[1] + 20, fill: C.green, 'font-size': 13 * F,
      'text-anchor': 'end', 'font-family': 'Consolas', 'font-weight': 700
    }, 'COLUMN SPACE (FLAT SHEET)'));

    // Design column axis hints
    const oU = sheetPt(O_UV[0] + 0.55, O_UV[1]);
    const oV = sheetPt(O_UV[0], O_UV[1] + 0.55);
    svgArrow(els, O, oU, C.amber, 2.2, 8);
    svgArrow(els, O, oV, C.green, 2.2, 8);
    els.push(
      s('text', { x: oU[0] + 4, y: oU[1] + 16, fill: C.amber, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'ones'),
      s('text', { x: oV[0] - 8, y: oV[1] - 6, fill: C.green, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'areas')
    );

    // Main arrows: fitted (green), actual rents (cyan), residual (pink)
    svgArrow(els, O, Cur, C.green, 3.8, 11);
    svgArrow(els, O, Tip, C.cyan, 4.0, 12);
    svgArrow(els, Cur, Tip, C.pink, 3.8, 11);

    // 90° right-angle mark when at projection
    if (m.atProj) {
      const dx = O[0] - Cur[0], dy = O[1] - Cur[1], l = Math.hypot(dx, dy) || 1;
      const sz = 16;
      const p1 = [Cur[0] + dx / l * sz, Cur[1] + dy / l * sz];
      const p2 = [p1[0], p1[1] - sz];
      const p3 = [Cur[0], Cur[1] - sz];
      els.push(s('polyline', {
        points: `${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`,
        fill: 'none', stroke: C.amber, 'stroke-width': 2.6
      }));
    }

    // Draggable handle on the sheet + origin & actual tip dots
    els.push(
      s('circle', { cx: O[0], cy: O[1], r: 5, fill: C.ink }),
      s('circle', { cx: Tip[0], cy: Tip[1], r: 7, fill: C.cyan }),
      s('circle', { cx: Cur[0], cy: Cur[1], r: 16, fill: C.green, 'fill-opacity': 0.22 }),
      s('circle', { cx: Cur[0], cy: Cur[1], r: 8.5, fill: C.green, stroke: C.bg, 'stroke-width': 2 })
    );

    // Clear labels
    els.push(
      s('text', { x: Tip[0] - 12, y: Tip[1] - 14, fill: C.cyan, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'actual rents'),
      s('text', { x: Cur[0] + 14, y: Cur[1] + 5, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'fitted (drag)'),
      s('text', {
        x: (Cur[0] + Tip[0]) / 2 + 12, y: (Cur[1] + Tip[1]) / 2,
        fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas'
      }, `res² = ${fmtInt(m.ssr)}`)
    );

    // Top angle pill inside SVG
    const angCol = m.atProj ? C.amber : C.muted;
    const angTxt = m.atProj ? 'ANGLE TO SHEET: 90.0°  (PROJECTION!)' : `ANGLE TO SHEET: ${m.angle.toFixed(1)}°`;
    const pw = NARROW ? 280 : 320;
    els.push(
      s('rect', { x: 16, y: 14, width: pw, height: 30, rx: 15, fill: C.bg, stroke: angCol, 'stroke-width': 1.8 }),
      s('text', { x: 16 + pw / 2, y: 34, fill: angCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, angTxt)
    );

    svg.replaceChildren(...els);
  }

  function drawScatter(m) {
    const els = [];
    const x0 = NARROW ? 56 : 74, x1 = VW - 24, y0 = 378, y1 = 44;
    const minR = Math.min(600, ...rents) - 100, maxR = Math.max(1500, ...rents) + 120;
    const sx = ar => x0 + (ar - 30) / 80 * (x1 - x0);
    const sy = r => y0 - (r - minR) / (maxR - minR) * (y0 - y1);

    // Grid & axes
    for (let r = Math.ceil(minR / 200) * 200; r <= maxR; r += 200) {
      const y = sy(r);
      els.push(
        s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: x0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r)
      );
    }
    for (const ar of [40, 60, 80, 100]) {
      const x = sx(ar);
      els.push(
        s('line', { x1: x, x2: x, y1: y0, y2: y0 + 6, stroke: C.muted }),
        s('text', { x, y: y0 + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, ar)
      );
    }
    els.push(
      s('line', { x1: x0, x2: x1, y1: y0, y2: y0, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: x0, x2: x0, y1: y0, y2: y1, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: (x0 + x1) / 2, y: y0 + 44, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'area (square metres)'),
      s('text', { x: x0 + 6, y: y1 - 12, fill: C.muted, 'font-size': 13 * F, 'font-family': 'Consolas' }, 'rent ($)')
    );

    // Fitted line
    const lx0 = 32, lx1 = 108;
    els.push(s('line', {
      x1: sx(lx0), y1: sy(a + b * lx0), x2: sx(lx1), y2: sy(a + b * lx1),
      stroke: C.ink, 'stroke-width': 3
    }));

    // Vertical residual sticks & apartment dots
    for (let i = 0; i < 12; i++) {
      const px = sx(AREAS[i]), py = sy(rents[i]), pf = sy(a + b * AREAS[i]);
      els.push(
        s('line', { x1: px, y1: pf, x2: px, y2: py, stroke: C.pink, 'stroke-width': 2.5 }),
        s('circle', { cx: px, cy: py, r: 6.5, fill: BCOL[i % 3], stroke: C.bg, 'stroke-width': 1.5 })
      );
    }

    // Banner reminding of the trap
    const bw = NARROW ? 310 : 370;
    els.push(
      s('rect', { x: x1 - bw, y: 12, width: bw, height: 28, rx: 14, fill: C.bg, stroke: C.pink, 'stroke-width': 1.8 }),
      s('text', { x: x1 - bw / 2, y: 31, fill: C.pink, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        m.atProj ? 'SCATTER PLOT: VERTICAL STICKS, NOT 90°!' : 'SCATTER PLOT: DRAG OR USE SLIDERS')
    );

    svg.replaceChildren(...els);
  }

  function draw() {
    syncSliders();
    const m = metrics();
    if (m.ssr > 40000) movedAway = true;
    if (mode === 'scatter' && m.atProj) viewedScatterAtProj = true;

    if (mode === 'sheet') drawSheet(m);
    else drawScatter(m);

    const d1 = Math.abs(m.dotOnes) < 1 ? 0 : Math.round(m.dotOnes);
    const d2 = Math.abs(m.dotAreas) < 10 ? 0 : Math.round(m.dotAreas);
    const pythSum = m.ssf + m.ssr;

    fbox(box, [
      `fitted = ${fmt(Math.round(a))}·ones + ${fmt(Math.round(b * 10) / 10)}·area`,
      [`residual length² = ${fmtInt(m.ssr)}`, m.atProj ? C.amber : C.pink],
      [`ones · res = ${d1}   area · res = ${d2}`, (d1 === 0 && d2 === 0) ? C.green : C.muted],
      m.atProj
        ? [`Pythagoras: ${fmtInt(m.ssf)} + ${fmtInt(m.ssr)} = ${fmtInt(ols.sst)}`, C.green]
        : [`fitted² + res² = ${fmtInt(pythSum)} ≠ ${fmtInt(ols.sst)}`, C.muted]
    ]);

    note.textContent = mode === 'scatter'
      ? 'On the scatter plot, every pink residual stick is vertical — even at the exact projection. The 90° right angle is in 12-dimensional list space.'
      : m.atProj
        ? 'Right on the projection! The residual meets the sheet at 90°, both dot products are 0, and fitted² + residual² equals actual².'
        : 'Off the projection: the residual arrow leans sideways, so its squared length is bigger and Pythagoras does not hold.';

    chal.update({ ssr: m.ssr, atProj: m.atProj, movedAway, randomDrops, viewedScatterAtProj });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
