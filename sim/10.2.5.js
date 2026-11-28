// 10.2.5 Try it: splines joined at a knot.
// Drag the four Cedar listings up/down, move the knot age, adjust the extra bend size,
// inspect any age step by step, compare with a wiggly multi-knot curve, and try fresh random data.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_RENTS = [1320, 1400, 1400, 1480];
  const AGES = [0, 10, 20, 30];
  const NAMES = ['I', 'J', 'K', 'L'];

  let rents = START_RENTS.slice();
  let knot = 20;      // knot age in years (10..25)
  let bend = 160;     // extra bend size ($ per decade^2)
  let inspect = 30;   // inspected age in years (0..35)
  let overfit = false;
  let isRandom = false, randomFitted = false, randomFits = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const knotVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });
  const bendVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.green, fontWeight: 700 } });
  const inspVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } });

  const knotSlider = h('input', {
    type: 'range', min: 10, max: 25, step: 1, value: knot,
    style: { flex: '1 1 140px', accentColor: C.amber },
    oninput: e => { knot = Number(e.target.value); draw(); }
  });
  const bendSlider = h('input', {
    type: 'range', min: -240, max: 360, step: 10, value: bend,
    style: { flex: '1 1 140px', accentColor: C.green },
    oninput: e => { bend = Number(e.target.value); checkRandomFit(); draw(); }
  });
  const inspSlider = h('input', {
    type: 'range', min: 0, max: 35, step: 1, value: inspect,
    style: { flex: '1 1 140px', accentColor: C.cyan },
    oninput: e => { inspect = Number(e.target.value); draw(); }
  });

  const overfitBtn = btn('Compare: many knots', () => { overfit = !overfit; draw(); });

  const sliderRow = (label, input, readout) =>
    h('label', { class: 'sim-row', style: { marginTop: '.55rem', justifyContent: 'space-between' } },
      h('span', { style: { minWidth: '8.2rem', fontWeight: 600 } }, label), input, readout);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: splines joined at a knot'),
    h('p', { class: 'sub' }, 'Drag any Cedar dot (I, J, K, L) up or down, or drag the amber knot line left and right. The curve up to the knot stays fixed while the extra bend adjusts the right side.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        sliderRow('Knot age', knotSlider, knotVal),
        sliderRow('Extra bend size', bendSlider, bendVal),
        sliderRow('Inspect age', inspSlider, inspVal),
        h('div', { class: 'sim-row' },
          btn('Fit bend to card L', () => fitToL(), 'go'),
          overfitBtn,
          btn('New data (random)', () => newData()),
          btn('Start again', () => reset()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Quadratic passing through I (0), J (10), K (20)
  function coeffs() {
    const [y0, y1, y2] = rents;
    return [y0, (-3 * y0 + 4 * y1 - y2) / 2, (y0 - 2 * y1 + y2) / 2];
  }
  function oldCurve(age) {
    const [c0, c1, c2] = coeffs(), a = age / 10;
    return c0 + c1 * a + c2 * a * a;
  }
  function oldSlope(age) {
    const [, c1, c2] = coeffs(), a = age / 10;
    return c1 + 2 * c2 * a; // dollars per decade
  }
  function extraBend(age) {
    const d = (age - knot) / 10;
    return d > 0 ? bend * d * d : 0;
  }
  function spline(age) {
    return oldCurve(age) + extraBend(age);
  }
  function missAtL() {
    return rents[3] - spline(30);
  }

  function checkRandomFit() {
    if (isRandom && !randomFitted && Math.abs(missAtL()) < 1.5) {
      randomFitted = true;
      randomFits++;
    }
  }
  function fitToL() {
    const d = (30 - knot) / 10;
    if (d > 0) bend = Math.round((rents[3] - oldCurve(30)) / (d * d) * 10) / 10;
    bendSlider.value = Math.max(-240, Math.min(360, Math.round(bend / 10) * 10));
    checkRandomFit();
    draw();
  }
  function newData() {
    const y0 = rnd(128, 136) * 10;
    const y1 = rnd(134, 144) * 10;
    const y2 = rnd(134, 144) * 10;
    let y3 = rnd(130, 152) * 10;
    const q3 = y0 + 3 * (-3 * y0 + 4 * y1 - y2) / 2 + 9 * (y0 - 2 * y1 + y2) / 2;
    if (Math.abs(y3 - q3) < 60) y3 = Math.min(1540, Math.max(1260, Math.round((q3 + (q3 > 1400 ? -120 : 120)) / 10) * 10));
    rents = [y0, y1, y2, y3];
    knot = 20; bend = 0; inspect = 30;
    isRandom = true; randomFitted = false;
    knotSlider.value = knot; bendSlider.value = bend; inspSlider.value = inspect;
    draw();
  }
  function reset() {
    rents = START_RENTS.slice();
    knot = 20; bend = 160; inspect = 30; overfit = false;
    isRandom = false; randomFitted = false;
    knotSlider.value = knot; bendSlider.value = bend; inspSlider.value = inspect;
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Drag card L up to $1,520, then adjust the extra bend until the spline hits L (miss = $0).',
      check: st => st.rents[3] === 1520 && Math.abs(st.missL) < 0.5 && st.knot === 20 &&
        st.rents[0] === 1320 && st.rents[1] === 1400 && st.rents[2] === 1400,
      why: 'Nice! Bend size 200 lifts age 30 by $200 to reach $1,520, while ages 0 to 20 stay completely untouched.'
    },
    {
      text: 'Press “Start again”, then slide Inspect age to 25 to see how much the bend adds halfway to age 30.',
      check: st => st.isDefault && st.inspect === 25,
      why: 'Halfway past the knot is 0.5 decades, and 0.5 squared is 0.25. So the bend adds only $40 — a quarter of $160.'
    },
    {
      text: 'Move the knot to age 15 and press “Fit bend to card L”. Watch what happens at age 20.',
      check: st => st.knot === 15 && Math.abs(st.missL) < 0.5,
      why: 'Because the bend starts at age 15, it lifts the curve at age 20 off card K. Knot placement decides where the shape can change.'
    },
    {
      text: 'Press “New data (random)” and fit the spline to card L, twice. Then press “Compare: many knots”.',
      check: st => st.randomFits >= 2 && st.overfit,
      why: 'One knot smoothly reaches L on any random set. Adding knots between every pair of cards lets the curve chase random bumps.'
    }
  ]);

  // SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 50 : 64, X1 = VW - (NARROW ? 16 : 24), TOP = 26, BASE = 384;
  const XMIN = 0, XMAX = 35, YMIN = 1240, YMAX = 1560;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const px = age => X0 + (age - XMIN) / (XMAX - XMIN) * (X1 - X0);
  const py = rent => BASE - (rent - YMIN) / (YMAX - YMIN) * (BASE - TOP);
  const xToAge = x => XMIN + (x - X0) / (X1 - X0) * (XMAX - XMIN);
  const yToRent = y => YMIN + (BASE - y) / (BASE - TOP) * (YMAX - YMIN);

  // Pointer dragging for dots I..L, the knot line, or the inspect probe
  let drag = null; // { kind: 'dot', i } | { kind: 'knot' } | { kind: 'inspect' }
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = null, bestD = 30;
    AGES.forEach((age, i) => {
      const d = Math.hypot(p.x - px(age), p.y - py(rents[i]));
      if (d < bestD) { bestD = d; best = { kind: 'dot', i }; }
    });
    if (!best && Math.abs(p.x - px(knot)) < 18 && p.y >= TOP && p.y <= BASE) best = { kind: 'knot' };
    if (!best && p.x >= X0 && p.x <= X1 && p.y >= TOP && p.y <= BASE) best = { kind: 'inspect' };
    if (!best) return;
    drag = best;
    svg.setPointerCapture(e.pointerId);
    onMove(e);
  });
  function onMove(e) {
    if (!drag) return;
    const p = toSvg(e);
    if (drag.kind === 'dot') {
      const val = Math.max(1260, Math.min(1540, Math.round(yToRent(p.y) / 10) * 10));
      rents[drag.i] = val;
      checkRandomFit();
    } else if (drag.kind === 'knot') {
      knot = Math.max(10, Math.min(25, Math.round(xToAge(p.x))));
      knotSlider.value = knot;
      checkRandomFit();
    } else if (drag.kind === 'inspect') {
      inspect = Math.max(0, Math.min(35, Math.round(xToAge(p.x))));
      inspSlider.value = inspect;
    }
    draw();
  }
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { drag = null; });

  function pathFor(fn, a0, a1, steps) {
    let d = '';
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (a1 - a0) * k / steps;
      const x = px(a), y = Math.max(TOP - 14, Math.min(BASE + 14, py(fn(a))));
      d += (k === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return d;
  }

  function draw() {
    const k = [];
    // Clip area for curves
    k.push(s('defs', {}, s('clipPath', { id: 'sp-clip' },
      s('rect', { x: X0, y: TOP - 8, width: X1 - X0, height: BASE - TOP + 16 }))));

    // Shaded no-data region past age 30
    k.push(s('rect', { x: px(30), y: TOP, width: X1 - px(30), height: BASE - TOP, fill: C.pink, 'fill-opacity': 0.06 }),
      s('text', { x: (px(30) + X1) / 2, y: BASE - 10, fill: C.pink, 'fill-opacity': 0.75, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'no data'));

    // Horizontal grid + y ticks
    for (const r of [1240, 1320, 1400, 1480, 1560]) {
      const y = py(r);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r.toLocaleString('en-US')));
    }
    // Axes
    k.push(s('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.5 }));
    for (const a of [0, 10, 20, 30]) {
      const x = px(a);
      k.push(s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted }),
        s('text', { x, y: BASE + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, a),
        s('text', { x, y: BASE + 38, fill: C.cyan, 'fill-opacity': 0.75, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${a / 10} dec`));
    }
    k.push(s('text', { x: X0 + 4, y: TOP - 9, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Segoe UI, sans-serif' }, 'Monthly rent ($)'));

    // Vertical amber knot line + draggable handle
    const kx = px(knot);
    k.push(s('line', { x1: kx, x2: kx, y1: TOP, y2: BASE, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
      s('rect', { x: kx - 32 * F, y: TOP + 4, width: 64 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.amber, style: 'cursor:ew-resize' }),
      s('text', { x: kx, y: TOP + 19 * F, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, `KNOT ${knot}`));

    // Curves (clipped)
    const cg = s('g', { 'clip-path': 'url(#sp-clip)' });
    // Dashed continuation of old curve past knot
    cg.append(s('path', { d: pathFor(oldCurve, knot, 35, 36), fill: 'none', stroke: C.muted, 'stroke-width': 2.4, 'stroke-dasharray': '7 6', 'stroke-opacity': 0.8 }));
    // Left piece (0..knot) in cyan
    cg.append(s('path', { d: pathFor(oldCurve, 0, knot, 40), fill: 'none', stroke: C.cyan, 'stroke-width': 3.5 }));
    // Right piece (knot..30) in green + extrapolated (30..35) dashed green
    cg.append(s('path', { d: pathFor(spline, knot, 30, 36), fill: 'none', stroke: C.green, 'stroke-width': 3.5 }));
    cg.append(s('path', { d: pathFor(spline, 30, 35, 16), fill: 'none', stroke: C.green, 'stroke-width': 2.5, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.7 }));

    // Optional many-knots overfit overlay
    if (overfit) {
      for (const ek of [5, 15, 25]) {
        cg.append(s('line', { x1: px(ek), x2: px(ek), y1: TOP, y2: BASE, stroke: C.pink, 'stroke-width': 1.2, 'stroke-dasharray': '3 4', 'stroke-opacity': 0.55 }));
      }
      const wig = a => {
        const base = spline(a);
        const corr = a > 20 ? (rents[3] - spline(30)) * Math.pow((a - 20) / 10, 2) : 0;
        return base + corr - 66 * Math.sin(a * Math.PI / 10);
      };
      cg.append(s('path', { d: pathFor(wig, 0, 30, 72), fill: 'none', stroke: C.pink, 'stroke-width': 2.8, 'stroke-opacity': 0.9 }));
    }

    // Extra bend lift arrow at inspected age (if inspect > knot)
    const qInsp = oldCurve(inspect), bInsp = extraBend(inspect), sInsp = spline(inspect);
    if (inspect > knot && Math.abs(bInsp) >= 2) {
      const ix = px(inspect);
      cg.append(s('line', { x1: ix, x2: ix, y1: py(qInsp), y2: py(sInsp), stroke: C.green, 'stroke-width': 3 }),
        s('circle', { cx: ix, cy: py(qInsp), r: 4.5, fill: C.bg, stroke: C.muted, 'stroke-width': 2 }));
    }
    // Inspect probe marker on spline
    cg.append(s('circle', { cx: px(inspect), cy: py(sInsp), r: 7, fill: C.amber, 'fill-opacity': 0.25 }),
      s('circle', { cx: px(inspect), cy: py(sInsp), r: 4.5, fill: C.amber }));

    // Miss line at card L if non-zero
    const missL = missAtL();
    if (Math.abs(missL) >= 1) {
      cg.append(s('line', { x1: px(30), x2: px(30), y1: py(spline(30)), y2: py(rents[3]), stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }));
    }
    k.push(cg);

    // Listing dots I, J, K, L (draggable)
    AGES.forEach((age, i) => {
      const x = px(age), y = py(rents[i]);
      const col = i === 3 && Math.abs(missL) >= 1 ? C.amber : C.cyan;
      k.push(
        s('circle', { cx: x, cy: y, r: 15, fill: col, 'fill-opacity': 0.16, style: 'cursor:ns-resize' }),
        s('circle', { cx: x, cy: y, r: 6.5, fill: col, stroke: C.bg, 'stroke-width': 1.5, style: 'cursor:ns-resize' }),
        s('text', {
          x: i === 0 ? x + 10 : (i === 3 ? x - 6 : x),
          y: i === 0 ? y + 22 : y - 14,
          fill: col, 'font-size': 12.5 * F, 'font-weight': 700,
          'text-anchor': i === 0 ? 'start' : (i === 3 ? 'end' : 'middle'),
          'font-family': 'Consolas', style: 'pointer-events:none'
        }, `${NAMES[i]} $${rents[i].toLocaleString('en-US')}`)
      );
    });

    svg.replaceChildren(...k);

    // Slider readouts & button state
    knotVal.textContent = `${knot} yr (${fmt(knot / 10)} dec)`;
    bendVal.textContent = `${bend >= 0 ? '+' : ''}${fmt(bend)}`;
    inspVal.textContent = `${inspect} yr (${fmt(inspect / 10)} dec)`;
    overfitBtn.className = 'sim-btn ' + (overfit ? 'go' : '');

    // Formula box
    const aDec = inspect / 10, kDec = knot / 10;
    const r1 = x => Math.round(x * 10) / 10;
    const missTxt = Math.abs(missL) < 0.5 ? '$0 (exact hit)' : `${missL > 0 ? '+' : '−'}$${fmt(Math.abs(r1(missL)))}`;
    if (inspect <= knot) {
      fbox(box, [
        [`inspect = age ${inspect} (${fmt(aDec)} dec)`, C.cyan],
        `age ≤ knot (${knot}) → extra bend = $0`,
        `old curve = $${fmt(r1(qInsp))}`,
        [`spline    = $${fmt(r1(sInsp))}`, C.amber],
        [`slope at knot = ${fmt(r1(oldSlope(knot)))} $/dec`, C.muted],
        [`miss at L = ${missTxt}`, Math.abs(missL) < 0.5 ? C.green : C.pink]
      ]);
    } else {
      const past = r1(aDec - kDec), sq = Math.round(past * past * 1000) / 1000;
      const sign = bInsp >= 0 ? '+' : '−';
      fbox(box, [
        [`inspect = age ${inspect} (${fmt(aDec)} dec)`, C.cyan],
        `past knot = ${fmt(aDec)} − ${fmt(kDec)} = ${fmt(past)} dec`,
        [`bend = ${fmt(bend)} × ${fmt(past)}² (${fmt(sq)}) = ${sign}$${fmt(Math.abs(r1(bInsp)))}`, C.green],
        [`spline = ${fmt(r1(qInsp))} ${sign} ${fmt(Math.abs(r1(bInsp)))} = $${fmt(r1(sInsp))}`, C.amber],
        [`miss at L = ${missTxt}`, Math.abs(missL) < 0.5 ? C.green : C.pink]
      ]);
    }

    note.textContent = overfit
      ? 'The pink curve adds knots between every pair of listings: it hits all four cards, but swings wildly in between.'
      : inspect > 30
        ? 'Past age 30 there are no listings at all, so the dashed curve is only guessing.'
        : 'At the knot, both pieces meet at the same height and share the same slope because the extra bend starts flat at 0.';

    const isDefault = rents.join() === START_RENTS.join() && knot === 20 && Math.abs(bend - 160) < 0.5;
    chal.update({ rents, knot, bend, inspect, overfit, missL, isDefault, randomFits });
  }

  draw();
  return () => {};
}
