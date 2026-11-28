// 10.1.2 Try it: slope and intercept.
// The learner drags the intercept (on the rent axis), drags the slope handle,
// tests any floor area in the formula, generates random apartment sets, and solves 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const AREAS = [40, 60, 80, 100];
  const DEFAULT_TRUE = { slope: 10, intercept: 400 };
  const DEFAULT_APTS = [
    { a: 40, r: 860, b: 'X', dx: 0 }, { a: 40, r: 770, b: 'Y', dx: -1.4 }, { a: 40, r: 770, b: 'Z', dx: 1.4 },
    { a: 60, r: 1040, b: 'X', dx: -0.8 }, { a: 60, r: 1020, b: 'Y', dx: 0.8 }, { a: 60, r: 940, b: 'Z', dx: 0 },
    { a: 80, r: 1250, b: 'X', dx: 0 }, { a: 80, r: 1210, b: 'Y', dx: 0 }, { a: 80, r: 1140, b: 'Z', dx: 0 },
    { a: 100, r: 1470, b: 'X', dx: 0 }, { a: 100, r: 1380, b: 'Y', dx: -0.8 }, { a: 100, r: 1350, b: 'Z', dx: 0.8 }
  ];
  const BCOL = { X: C.cyan, Y: C.amber, Z: C.pink };

  let apts = DEFAULT_APTS.map(d => ({ ...d }));
  let trueSlope = DEFAULT_TRUE.slope, trueIntercept = DEFAULT_TRUE.intercept;
  let slope = 10, intercept = 400, testArea = 80;
  let isDefault = true, isRandom = false, usedFitBtn = false, fittedRandomByHand = false;
  let anim = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const slopeVal = h('span', { style: { color: C.amber, fontFamily: 'Consolas, monospace', fontWeight: 700, minWidth: '5.5ch' } });
  const intVal = h('span', { style: { color: C.green, fontFamily: 'Consolas, monospace', fontWeight: 700, minWidth: '5.5ch' } });
  const areaVal = h('span', { style: { color: C.cyan, fontFamily: 'Consolas, monospace', fontWeight: 700, minWidth: '5.5ch' } });

  const slopeSlider = h('input', {
    type: 'range', min: 0, max: 20, step: 1, value: slope, style: { flex: '1 1 8rem' },
    oninput: e => { cancelAnimationFrame(anim); slope = +e.target.value; draw(); }
  });
  const intSlider = h('input', {
    type: 'range', min: 0, max: 1000, step: 50, value: intercept, style: { flex: '1 1 8rem' },
    oninput: e => { cancelAnimationFrame(anim); intercept = +e.target.value; draw(); }
  });
  const areaSlider = h('input', {
    type: 'range', min: 0, max: 100, step: 10, value: testArea, style: { flex: '1 1 8rem' },
    oninput: e => { testArea = +e.target.value; draw(); }
  });

  function bumpSlope(d) {
    cancelAnimationFrame(anim);
    slope = Math.max(0, Math.min(20, slope + d));
    draw();
  }
  function bumpInt(d) {
    cancelAnimationFrame(anim);
    intercept = Math.max(0, Math.min(1000, intercept + d));
    draw();
  }

  function makeRandomData() {
    cancelAnimationFrame(anim);
    let ns = trueSlope, ni = trueIntercept;
    for (let k = 0; k < 40; k++) {
      const candS = rnd(5, 14);
      const candI = rnd(3, 12) * 50;
      if ((candS !== slope || candI !== intercept) && (candS !== trueSlope || candI !== trueIntercept) &&
          candI + 100 * candS <= 1750 && candI + 40 * candS >= 450) {
        ns = candS; ni = candI; break;
      }
    }
    trueSlope = ns; trueIntercept = ni;
    apts = [];
    for (const a of AREAS) {
      const m = trueIntercept + trueSlope * a;
      const dxX = rnd(35, 75), dxZ = -rnd(35, 75), dxY = -(dxX + dxZ);
      apts.push({ a, r: m + dxX, b: 'X', dx: 0 });
      apts.push({ a, r: m + dxY, b: 'Y', dx: 0 });
      apts.push({ a, r: m + dxZ, b: 'Z', dx: 0 });
    }
    isDefault = false;
    isRandom = true;
    usedFitBtn = false;
    draw();
  }

  function animateFit() {
    usedFitBtn = true;
    cancelAnimationFrame(anim);
    const s0 = slope, i0 = intercept, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      const e = k * k * (3 - 2 * k);
      slope = k < 1 ? s0 + (trueSlope - s0) * e : trueSlope;
      intercept = k < 1 ? i0 + (trueIntercept - i0) * e : trueIntercept;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function resetAll() {
    cancelAnimationFrame(anim);
    apts = DEFAULT_APTS.map(d => ({ ...d }));
    trueSlope = DEFAULT_TRUE.slope;
    trueIntercept = DEFAULT_TRUE.intercept;
    slope = 10; intercept = 400; testArea = 80;
    isDefault = true; isRandom = false; usedFitBtn = false;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: slope and intercept'),
    h('p', { class: 'sub' }, 'Drag the green intercept dot on the left, drag the amber tilt dot on the right, or slide the check area along the bottom.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('span', { style: { minWidth: '5.5rem', color: C.amber, fontWeight: 650 } }, 'Slope'),
          btn('−1', () => bumpSlope(-1)), slopeSlider, btn('+1', () => bumpSlope(1)), slopeVal),
        h('div', { class: 'sim-row' },
          h('span', { style: { minWidth: '5.5rem', color: C.green, fontWeight: 650 } }, 'Intercept'),
          btn('−50', () => bumpInt(-50)), intSlider, btn('+50', () => bumpInt(50)), intVal),
        h('div', { class: 'sim-row' },
          h('span', { style: { minWidth: '5.5rem', color: C.cyan, fontWeight: 650 } }, 'Check area'),
          areaSlider, areaVal),
        h('div', { class: 'sim-row' },
          btn('Fit the stars', animateFit, 'go'),
          btn('New data (random)', makeRandomData),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Make the line steeper so every extra square metre adds $15 (keep the intercept at $400).',
      check: st => st.slope === 15 && st.intercept === 400,
      why: 'Yes! With slope 15, each 20 square metres now adds $300 instead of $200.' },
    { text: 'Keep the slope at $10 per m², and lift the line so it starts at $600 on the rent axis.',
      check: st => st.slope === 10 && st.intercept === 600,
      why: 'Right: changing the intercept shifts the whole line up or down without changing its tilt.' },
    { text: 'Press “Start again”, then move “Check area” to 0 m² to read the intercept on the drawing.',
      check: st => st.isDefault && st.slope === 10 && st.intercept === 400 && st.testArea === 0,
      why: 'At 0 m² the line reads $400 — a point that places the drawing, not the rent of a real apartment.' },
    { text: 'Press “New data”, then adjust slope and intercept by hand so your line lands on all four new stars.',
      check: st => st.fittedRandomByHand,
      why: 'Well done! Every straight pattern of mean stars is captured by just two numbers: slope and intercept.' }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 56 : 72, X1 = VW - 22, Y0 = 376, Y1 = 28;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const AMAX = 108, RMAX = 2000;
  const a2x = a => X0 + (a / AMAX) * (X1 - X0);
  const r2y = r => Y0 - (r / RMAX) * (Y0 - Y1);
  const x2a = x => ((x - X0) / (X1 - X0)) * AMAX;
  const y2r = y => ((Y0 - y) / (Y0 - Y1)) * RMAX;

  function starPoints(cx, cy, outer = 8.5 * F) {
    const inner = outer * 0.44, out = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? outer : inner;
      const ang = -Math.PI / 2 + k * Math.PI / 5;
      out.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
    }
    return out.join(' ');
  }

  // Pointer dragging for intercept handle, slope handle, and check-area handle
  let drag = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const ix = a2x(0), iy = r2y(intercept);
    const sx = a2x(100), sy = r2y(Math.min(RMAX, Math.max(0, intercept + 100 * slope)));
    const tx = a2x(testArea), ty = Y0;
    const dist = (x, y) => Math.hypot(p.x - x, p.y - y);
    const hit = 30 * F;
    if (dist(ix, iy) <= hit) drag = 'intercept';
    else if (dist(sx, sy) <= hit) drag = 'slope';
    else if (dist(tx, ty) <= hit || Math.abs(p.y - Y0) <= 22) drag = 'area';
    else return;
    cancelAnimationFrame(anim);
    svg.setPointerCapture(e.pointerId);
    onDrag(e);
  });

  function onDrag(e) {
    if (!drag) return;
    const p = toSvg(e);
    if (drag === 'intercept') {
      const raw = y2r(p.y);
      intercept = Math.max(0, Math.min(1000, Math.round(raw / 50) * 50));
    } else if (drag === 'slope') {
      const raw = (y2r(p.y) - intercept) / 100;
      slope = Math.max(0, Math.min(20, Math.round(raw)));
    } else if (drag === 'area') {
      const raw = x2a(p.x);
      testArea = Math.max(0, Math.min(100, Math.round(raw / 10) * 10));
    }
    draw();
  }
  svg.addEventListener('pointermove', onDrag);
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointercancel', () => { drag = null; });

  function draw() {
    const k = [];
    const outside = testArea < 40;
    const pred = intercept + slope * testArea;

    // Subtle shaded regions: no-data zone (0..40) and data range (40..100)
    k.push(
      s('rect', { x: a2x(0), y: Y1, width: a2x(40) - a2x(0), height: Y0 - Y1, fill: C.pink, 'fill-opacity': outside ? 0.13 : 0.05 }),
      s('rect', { x: a2x(40), y: Y1, width: a2x(100) - a2x(40), height: Y0 - Y1, fill: C.cyan, 'fill-opacity': 0.04 }),
      s('text', { x: a2x(20), y: Y0 - 10, fill: C.pink, 'fill-opacity': outside ? 0.95 : 0.55, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'no data'),
      s('text', { x: a2x(70), y: Y0 - 10, fill: C.cyan, 'fill-opacity': 0.65, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'data: 40–100 m²')
    );

    // Gridlines and axis ticks
    for (let r = 0; r <= RMAX; r += 400) {
      const y = r2y(r);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r)
      );
    }
    for (let a = 0; a <= 100; a += 20) {
      const x = a2x(a);
      k.push(
        s('line', { x1: x, x2: x, y1: Y1, y2: Y0, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x, y: Y0 + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a)
      );
    }

    // Main axes and axis labels
    k.push(
      s('line', { x1: X0, x2: X1, y1: Y0, y2: Y0, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X0, y1: Y1, y2: Y0, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: (X0 + X1) / 2, y: VH - 14, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'area (m²)'),
      s('text', { x: X0 - 4, y: Y1 - 10, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'start' }, 'rent ($)')
    );

    // Compact legend in top-right
    const legX = X1 - (NARROW ? 145 : 190);
    [
      { dx: 0, col: C.cyan, t: 'X' },
      { dx: 34 * F, col: C.amber, t: 'Y' },
      { dx: 68 * F, col: C.pink, t: 'Z' }
    ].forEach(it => {
      k.push(
        s('circle', { cx: legX + it.dx, cy: Y1 - 12, r: 4.5, fill: it.col }),
        s('text', { x: legX + it.dx + 9, y: Y1 - 8, fill: C.muted, 'font-size': 12 * F }, it.t)
      );
    });
    k.push(
      s('polygon', { points: starPoints(legX + 106 * F, Y1 - 12, 6), fill: C.ink }),
      s('text', { x: legX + 116 * F, y: Y1 - 8, fill: C.ink, 'font-size': 12 * F }, 'mean')
    );

    // 12 apartment dots
    for (const d of apts) {
      if (d.r < 0 || d.r > RMAX) continue;
      k.push(s('circle', { cx: a2x(d.a + d.dx), cy: r2y(d.r), r: 5 * F, fill: BCOL[d.b], 'fill-opacity': 0.72 }));
    }

    // 4 mean stars
    for (const a of AREAS) {
      const m = trueIntercept + trueSlope * a;
      k.push(s('polygon', { points: starPoints(a2x(a), r2y(m)), fill: C.ink, stroke: C.bg, 'stroke-width': 1 }));
    }

    // User's straight line: dashed in 0..40 (outside data), solid in 40..100 (inside data)
    const yAt0 = r2y(Math.max(0, Math.min(RMAX, intercept)));
    const yAt40 = r2y(Math.max(0, Math.min(RMAX, intercept + 40 * slope)));
    const yAt100 = r2y(Math.max(0, Math.min(RMAX, intercept + 100 * slope)));
    k.push(
      s('line', { x1: a2x(0), y1: yAt0, x2: a2x(40), y2: yAt40, stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-opacity': 0.85 }),
      s('line', { x1: a2x(40), y1: yAt40, x2: a2x(100), y2: yAt100, stroke: C.ink, 'stroke-width': 3.5 })
    );

    // Live slope step triangle from 40 to 60 m²
    const r40 = intercept + 40 * slope, r60 = intercept + 60 * slope;
    if (r60 <= RMAX && r40 >= 0) {
      const x40 = a2x(40), x60 = a2x(60), y40 = r2y(r40), y60 = r2y(r60);
      k.push(
        s('line', { x1: x40, y1: y40, x2: x60, y2: y40, stroke: C.cyan, 'stroke-width': 2.5 }),
        s('line', { x1: x60, y1: y40, x2: x60, y2: y60, stroke: C.amber, 'stroke-width': 2.5 }),
        s('text', { x: (x40 + x60) / 2, y: y40 + 16 * F, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '+20 m²'),
        s('text', { x: x60 + 8, y: (y40 + y60) / 2 + 4, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, `+$${fmt(Math.round(20 * slope))}`)
      );
    }

    // Check-area vertical/horizontal guide and bottom handle
    const predClamped = Math.max(0, Math.min(RMAX, pred));
    const tx = a2x(testArea), ty = r2y(predClamped);
    const probeCol = outside ? C.pink : C.cyan;
    k.push(
      s('line', { x1: tx, y1: Y0, x2: tx, y2: ty, stroke: probeCol, 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
      s('line', { x1: X0, y1: ty, x2: tx, y2: ty, stroke: probeCol, 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
      s('circle', { cx: tx, cy: ty, r: 5.5 * F, fill: probeCol }),
      s('circle', { cx: tx, cy: Y0, r: 9 * F, fill: C.bg, stroke: probeCol, 'stroke-width': 2.5, style: 'cursor:ew-resize' }),
      s('text', { x: tx, y: Y0 + 4, fill: probeCol, 'font-size': 10 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, '↔')
    );

    // Draggable intercept handle (green) and slope handle (amber)
    k.push(
      s('circle', { cx: a2x(0), cy: yAt0, r: 16 * F, fill: C.green, 'fill-opacity': 0.18, style: 'cursor:ns-resize' }),
      s('circle', { cx: a2x(0), cy: yAt0, r: 8 * F, fill: C.green, stroke: C.bg, 'stroke-width': 2, style: 'cursor:ns-resize' }),
      s('circle', { cx: a2x(100), cy: yAt100, r: 16 * F, fill: C.amber, 'fill-opacity': 0.18, style: 'cursor:ns-resize' }),
      s('circle', { cx: a2x(100), cy: yAt100, r: 8 * F, fill: C.amber, stroke: C.bg, 'stroke-width': 2, style: 'cursor:ns-resize' })
    );

    svg.replaceChildren(...k);

    // Sync sliders and readouts
    const sDisp = Math.round(slope * 10) / 10;
    const iDisp = Math.round(intercept);
    slopeSlider.value = Math.round(slope);
    intSlider.value = Math.round(intercept / 50) * 50;
    areaSlider.value = testArea;
    slopeVal.textContent = `$${fmt(sDisp)}/m²`;
    intVal.textContent = `$${fmt(iDisp)}`;
    areaVal.textContent = `${testArea} m²`;

    // Live formula box
    const exactMatch = Math.abs(slope - trueSlope) < 1e-6 && Math.abs(intercept - trueIntercept) < 1e-6;
    if (isRandom && !usedFitBtn && exactMatch) fittedRandomByHand = true;

    fbox(box, [
      [`slope     = $${fmt(sDisp)} / m²  (+20 m² → +$${fmt(Math.round(20 * slope))})`, C.amber],
      [`intercept = $${fmt(iDisp)}  (at 0 m²)`, C.green],
      [`mean rent = ${fmt(iDisp)} + ${fmt(sDisp)} × area`, C.ink],
      [`at ${testArea} m²: ${fmt(iDisp)} + ${fmt(sDisp)} × ${testArea} = $${fmt(Math.round(pred))}` + (outside ? ' (outside data!)' : ''), outside ? C.pink : C.cyan]
    ]);

    if (outside) {
      note.textContent = `Caution: ${testArea} m² is outside our 40–100 m² data. Reading the line here gives a point on the drawing, not a real apartment price.`;
    } else if (exactMatch) {
      note.textContent = 'Exact match! Your line lands right on all four mean stars.';
    } else if (Math.abs(slope - trueSlope) >= 0.5) {
      note.textContent = slope < trueSlope
        ? 'Your line is too flat for the stars — try raising the slope (drag the amber dot up).'
        : 'Your line is too steep for the stars — try lowering the slope (drag the amber dot down).';
    } else {
      note.textContent = intercept < trueIntercept
        ? 'Right tilt! Now lift the intercept (drag the green dot up) so the line lands on the stars.'
        : 'Right tilt! Now lower the intercept (drag the green dot down) so the line lands on the stars.';
    }

    chal.update({
      slope: sDisp,
      intercept: iDisp,
      testArea,
      isDefault,
      fittedRandomByHand
    });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
