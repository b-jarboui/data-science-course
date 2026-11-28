// 2.1.7 Try it: density curves — sand hills, smooth outline, and area as share.
// The learner drags range handles (a, b) to shade area, drags visit dots to reshape the curve,
// toggles individual sand hills, adjusts hill spread, creates random days, and solves 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  // Shared 2.1 Saturday library visits with purpose colours
  const START = [
    { v: 5, c: C.cyan },   { v: 8, c: C.cyan },   { v: 10, c: C.cyan },   { v: 10, c: C.cyan },
    { v: 12, c: C.cyan },  { v: 15, c: C.cyan },  { v: 15, c: C.cyan },
    { v: 20, c: C.violet },{ v: 25, c: C.violet },{ v: 30, c: C.violet }, { v: 30, c: C.violet },
    { v: 35, c: C.violet },
    { v: 40, c: C.amber }, { v: 45, c: C.amber }, { v: 50, c: C.amber },  { v: 55, c: C.amber },
    { v: 60, c: C.amber }, { v: 60, c: C.amber }, { v: 75, c: C.amber },
    { v: 85, c: C.pink },  { v: 90, c: C.amber }, { v: 90, c: C.pink },   { v: 95, c: C.pink },
    { v: 160, c: C.amber },
  ];

  let visits = START.map(d => ({ ...d }));
  let a = 60, b = 100; // start on the librarian's question
  let bw = 8;
  let sel = 0; // 5-minute visit ready to inspect near 0
  let showHills = false;
  let isRandom = false;
  let movedDot = false;
  let randomMoves = 0;

  // Exact Gaussian density and CDF (Abramowitz & Stegun erf)
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
  }
  const normCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
  const gauss = (x, mu, hVal) => Math.exp(-0.5 * ((x - mu) / hVal) ** 2) / (hVal * Math.sqrt(2 * Math.PI));
  const kdeAt = x => visits.reduce((acc, d) => acc + gauss(x, d.v, bw), 0) / visits.length;
  const curveArea = (lo, hi) => {
    if (hi <= lo) return 0;
    return visits.reduce((acc, d) => acc + (normCdf((hi - d.v) / bw) - normCdf((lo - d.v) / bw)), 0) / visits.length;
  };
  const dotCountIn = (lo, hi) => {
    if (hi <= lo) return 0;
    return visits.filter(d => (lo <= 0 ? d.v >= lo && d.v <= hi : d.v > lo && d.v <= hi)).length;
  };

  // UI elements
  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const spreadLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const hillsBtn = btn('Show small hills', () => { showHills = !showHills; draw(); });
  const spreadSlider = h('input', {
    type: 'range', min: 4, max: 20, step: 1, value: String(bw),
    style: { width: '140px', accentColor: C.cyan, cursor: 'pointer' },
    oninput: e => { bw = +e.target.value; draw(); }
  });

  function setRange(na, nb) {
    a = na; b = nb;
    if (isRandom) randomMoves++;
    draw();
  }

  function bumpDot(delta) {
    visits[sel].v = Math.max(0, Math.min(180, visits[sel].v + delta));
    if (showHills) movedDot = true;
    if (isRandom) randomMoves++;
    draw();
  }

  function makeRandom() {
    const next = [];
    const peak2 = rnd(75, 118);
    for (let i = 0; i < 24; i++) {
      const r = Math.random();
      let val;
      if (r < 0.45) val = rnd(4, 34);
      else if (r < 0.72) val = rnd(32, 68);
      else if (r < 0.93) val = Math.max(10, Math.min(145, peak2 + rnd(-14, 14)));
      else val = rnd(135, 174);
      next.push({ v: val, c: C.cyan });
    }
    visits = next;
    sel = 0;
    isRandom = true;
    randomMoves = 0;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: density curves & area'),
    h('p', { class: 'sub' }, 'Drag the two glowing cut handles to shade any slice of area, or drag any dot in the top strip to watch its sand hill reshape the smooth curve.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('0–60 min', () => setRange(0, 60)),
          btn('60–100 min', () => setRange(60, 100)),
          btn('Below 0', () => setRange(-25, 0)),
          btn('Whole curve', () => setRange(-25, 185)),
          hillsBtn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          spreadLabel, spreadSlider,
          btn('−5', () => bumpDot(-5)), btn('+5', () => bumpDot(5)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandom, 'go'),
          btn('Add a visit', () => {
            if (visits.length < 36) {
              visits.push({ v: rnd(5, 165), c: C.cyan });
              sel = visits.length - 1;
              if (isRandom) randomMoves++;
              draw();
            }
          }),
          btn('Remove a visit', () => {
            if (visits.length > 4) {
              visits.splice(sel, 1);
              sel = Math.min(sel, visits.length - 1);
              if (isRandom) randomMoves++;
              draw();
            }
          }),
          btn('Start again', () => {
            visits = START.map(d => ({ ...d }));
            a = 60; b = 100; bw = 8; sel = 0;
            showHills = false; isRandom = false; movedDot = false; randomMoves = 0;
            spreadSlider.value = String(bw);
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Shade from 0 to 60 minutes (drag the handles or press “0–60 min”) and compare the shaded area with the dots.',
      check: st => st.a === 0 && st.b === 60,
      why: 'Yes! The shaded slice from 0 to 60 minutes estimates the share of visits up to an hour—close to the dot share, with small sand spills across the cut lines.' },
    { text: 'Press “Show small hills”, then drag any dot (or press −5 / +5) to watch its hill reshape the smooth curve.',
      check: st => st.showHills && st.movedDot,
      why: 'Every visitor pours one equal scoop of sand. Moving a dot slides its small hill, and overlapping hills add up into the smooth outline.' },
    { text: 'Check the edge trap: press “Below 0” (or drag both handles to 0 or below) to see sand spilling past zero minutes.',
      check: st => st.a < 0 && st.b <= 0 && st.area > 0.005,
      why: 'Right! The sand hill for a short visit spills slightly below 0, even though no visit can last less than zero minutes. Always check the dots near edges.' },
    { text: 'Press “New data”, then move a cut handle or try any shaded range on the new curve. Does the whole area still equal 1?',
      check: st => st.isRandom && st.randomMoves >= 1,
      why: 'Always! No matter how the visits are spread, all scoops together make one whole pile: total area = 1 (100%).' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 24 : 36, X1 = VW - 18;
  const MIN_M = -25, MAX_M = 185;
  const DOT_TOP = 20, DOT_BOT = 86;
  const TOP = 122, BASE = 392;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const m2x = m => X0 + ((m - MIN_M) / (MAX_M - MIN_M)) * (X1 - X0);
  const x2m = x => Math.max(MIN_M, Math.min(MAX_M, Math.round(MIN_M + ((x - X0) / (X1 - X0)) * (MAX_M - MIN_M))));

  // Pointer interaction: drag range handles a / b, or drag dots in the top strip
  let dotCoords = [];
  let dragKind = null; // 'a' | 'b' | 'dot'
  let dragIdx = -1;

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    // Check dots in the top strip first
    if (p.y < TOP - 16) {
      let best = -1, bestD = 28 * F;
      dotCoords.forEach(dc => {
        const d = Math.hypot(p.x - dc.x, p.y - dc.y);
        if (d < bestD) { bestD = d; best = dc.idx; }
      });
      if (best >= 0) {
        sel = best; dragKind = 'dot'; dragIdx = best;
        svg.setPointerCapture(e.pointerId);
        draw();
        return;
      }
    }
    // Check range cut handles or cut lines in the curve area
    if (p.y >= TOP - 28 && p.y <= BASE + 16) {
      const xa = m2x(a), xb = m2x(b);
      const da = Math.abs(p.x - xa), db = Math.abs(p.x - xb);
      const grab = 32 * F;
      if (da <= grab || db <= grab) {
        dragKind = da <= db ? 'a' : 'b';
        svg.setPointerCapture(e.pointerId);
        return;
      }
      // Tapping elsewhere moves the closer cut handle to that minute
      dragKind = da <= db ? 'a' : 'b';
      const m = x2m(p.x);
      if (dragKind === 'a') a = Math.min(m, b);
      else b = Math.max(m, a);
      if (isRandom) randomMoves++;
      svg.setPointerCapture(e.pointerId);
      draw();
    }
  });

  svg.addEventListener('pointermove', e => {
    if (!dragKind) return;
    const p = toSvg(e);
    const m = x2m(p.x);
    if (dragKind === 'dot') {
      visits[dragIdx].v = Math.max(0, Math.min(180, m));
      if (showHills) movedDot = true;
      if (isRandom) randomMoves++;
      draw();
    } else if (dragKind === 'a') {
      a = m;
      if (a > b) { const tmp = a; a = b; b = tmp; dragKind = 'b'; }
      if (isRandom) randomMoves++;
      draw();
    } else if (dragKind === 'b') {
      b = m;
      if (b < a) { const tmp = a; a = b; b = tmp; dragKind = 'a'; }
      if (isRandom) randomMoves++;
      draw();
    }
  });

  svg.addEventListener('pointerup', () => { dragKind = null; dragIdx = -1; });

  function draw() {
    const N_PTS = 160;
    const xs = [], ys = [];
    let peak = 0.005;
    for (let i = 0; i <= N_PTS; i++) {
      const m = MIN_M + (i / N_PTS) * (MAX_M - MIN_M);
      const yv = kdeAt(m);
      xs.push(m); ys.push(yv);
      if (yv > peak) peak = yv;
    }
    const yMax = peak * 1.16;
    const d2py = d => BASE - (d / yMax) * (BASE - TOP);
    const k = [];

    // Top dot strip
    k.push(
      s('rect', { x: X0, y: DOT_TOP - 6, width: X1 - X0, height: DOT_BOT - DOT_TOP + 10, rx: 10, fill: '#ffffff', 'fill-opacity': 0.03, stroke: C.line }),
      s('text', { x: X0 + 8, y: DOT_TOP + 7, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'VISITS (DRAG ANY DOT)'));

    // Subtle horizontal gridlines
    for (let g = 1; g <= 3; g++) {
      const y = BASE - (g / 3.2) * (BASE - TOP);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.6 }));
    }

    // Highlight negative-time region (< 0) subtly so edge trap is visible
    const xZero = m2x(0);
    k.push(
      s('rect', { x: X0, y: TOP, width: xZero - X0, height: BASE - TOP, fill: C.pink, 'fill-opacity': 0.05 }),
      s('line', { x1: xZero, x2: xZero, y1: DOT_TOP - 6, y2: BASE, stroke: C.pink, 'stroke-opacity': 0.45, 'stroke-dasharray': '4 5' }));

    // Optional individual sand hills
    if (showHills) {
      visits.forEach((vis, idx) => {
        const lo = Math.max(MIN_M, vis.v - bw * 3.2);
        const hi = Math.min(MAX_M, vis.v + bw * 3.2);
        const pts = [];
        for (let i = 0; i <= 26; i++) {
          const m = lo + (i / 26) * (hi - lo);
          pts.push(`${i === 0 ? 'M' : 'L'}${m2x(m).toFixed(1)},${d2py(gauss(m, vis.v, bw) / visits.length).toFixed(1)}`);
        }
        const isSel = idx === sel;
        k.push(s('path', {
          d: pts.join(' '), fill: 'none',
          stroke: isSel ? C.amber : vis.c,
          'stroke-width': isSel ? 2.4 : 1.2,
          'stroke-opacity': isSel ? 0.95 : 0.45
        }));
      });
    }

    // Full density curve subtle fill
    const fullPath = xs.map((m, i) => `${i === 0 ? 'M' : 'L'}${m2x(m).toFixed(1)},${d2py(ys[i]).toFixed(1)}`).join(' ');
    const fullAreaD = `${fullPath} L${m2x(MAX_M).toFixed(1)},${BASE} L${m2x(MIN_M).toFixed(1)},${BASE} Z`;
    k.push(s('path', { d: fullAreaD, fill: C.cyan, 'fill-opacity': 0.14 }));

    // Shaded slice between a and b
    const isNegSlice = b <= 0;
    const sliceCol = isNegSlice ? C.pink : C.amber;
    if (b > a) {
      const S_PTS = 80;
      const sPts = [];
      for (let i = 0; i <= S_PTS; i++) {
        const m = a + (i / S_PTS) * (b - a);
        sPts.push(`${i === 0 ? 'M' : 'L'}${m2x(m).toFixed(1)},${d2py(kdeAt(m)).toFixed(1)}`);
      }
      const sliceD = `${sPts.join(' ')} L${m2x(b).toFixed(1)},${BASE} L${m2x(a).toFixed(1)},${BASE} Z`;
      k.push(s('path', { d: sliceD, fill: sliceCol, 'fill-opacity': isNegSlice ? 0.52 : 0.40 }));
    }

    // Smooth curve outline on top
    k.push(s('path', { d: fullPath, fill: 'none', stroke: C.cyan, 'stroke-width': 3 }));

    // Range cut lines and draggable handles at a and b
    const xa = m2x(a), xb = m2x(b);
    const areaVal = curveArea(a, b);
    const pctStr = `${Math.round(areaVal * 1000) / 10}%`;
    [
      { x: xa, m: a, tag: a <= MIN_M ? '−∞' : `${a}m` },
      { x: xb, m: b, tag: b >= MAX_M ? '+∞' : `${b}m` },
    ].forEach(hnd => {
      k.push(
        s('line', { x1: hnd.x, x2: hnd.x, y1: TOP - 10, y2: BASE, stroke: sliceCol, 'stroke-width': 2.2, 'stroke-dasharray': '6 5' }),
        s('circle', { cx: hnd.x, cy: TOP - 12, r: 9 * F, fill: C.bg, stroke: sliceCol, 'stroke-width': 2.5, style: 'cursor:ew-resize' }),
        s('circle', { cx: hnd.x, cy: TOP - 12, r: 3.5 * F, fill: sliceCol, style: 'cursor:ew-resize' }),
        s('text', {
          x: Math.max(X0 + 18, Math.min(X1 - 18, hnd.x)), y: TOP - 25 * F,
          fill: sliceCol, 'font-size': 12 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, hnd.tag));
    });

    // Area badge inside/above the shaded region
    if (b - a >= 12) {
      const midX = Math.max(X0 + 48, Math.min(X1 - 48, (xa + xb) / 2));
      const badgeY = Math.max(TOP + 22, d2py(kdeAt((a + b) / 2)) - 14);
      k.push(
        s('rect', { x: midX - 42 * F, y: badgeY - 15 * F, width: 84 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: sliceCol, 'fill-opacity': 0.9 }),
        s('text', { x: midX, y: badgeY, fill: sliceCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `AREA ${pctStr}`));
    }

    // X-axis and ticks
    k.push(
      s('line', { x1: X0, x2: xZero, y1: BASE, y2: BASE, stroke: C.pink, 'stroke-width': 1.5, 'stroke-opacity': 0.6 }),
      s('line', { x1: xZero, x2: X1, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }));
    const step = NARROW ? 40 : 20;
    for (let m = 0; m <= 180; m += step) {
      const x = m2x(m);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 6, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: BASE + 22, fill: m === 0 ? C.pink : C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, m));
    }
    k.push(s('text', { x: X1, y: BASE + 38, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'minutes'));

    // Dots in the top strip (stacking ties cleanly)
    const rDot = NARROW ? 5.2 : 5.0;
    const order = visits.map((d, idx) => ({ v: d.v, c: d.c, idx })).sort((p, q) => p.v - q.v);
    const rowsLastX = [];
    dotCoords = [];
    order.forEach(({ v, c, idx }) => {
      const x = m2x(v);
      let row = 0;
      while (row < 4 && rowsLastX[row] != null && x - rowsLastX[row] < rDot * 2.1) row++;
      rowsLastX[row] = x;
      const y = DOT_BOT - 8 - row * (rDot * 2.2);
      dotCoords.push({ idx, x, y, v, c });
    });

    dotCoords.filter(d => d.idx !== sel).forEach(dc => {
      const inRange = b > a && (a <= 0 ? dc.v >= a && dc.v <= b : dc.v > a && dc.v <= b);
      k.push(s('circle', {
        cx: dc.x, cy: dc.y, r: rDot,
        fill: inRange ? sliceCol : dc.c, 'fill-opacity': inRange ? 0.96 : 0.78,
        stroke: C.bg, 'stroke-width': 1, style: 'cursor:grab'
      }));
    });
    const sd = dotCoords.find(d => d.idx === sel);
    if (sd) {
      k.push(
        s('circle', { cx: sd.x, cy: sd.y, r: rDot + 4.5, fill: C.amber, 'fill-opacity': 0.22, stroke: C.amber, 'stroke-width': 1.5 }),
        s('circle', { cx: sd.x, cy: sd.y, r: rDot + 1, fill: C.amber, stroke: C.bg, 'stroke-width': 1.2, style: 'cursor:grab' }),
        s('text', {
          x: Math.max(X0 + 22, Math.min(X1 - 22, sd.x)), y: DOT_TOP + 7,
          fill: C.amber, 'font-size': 12 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `${sd.v} min`));
    }

    svg.replaceChildren(...k);

    // Controls & formula readout
    hillsBtn.classList.toggle('go', showHills);
    hillsBtn.textContent = showHills ? 'Hide small hills' : 'Show small hills';
    spreadLabel.textContent = `Hill spread: ${bw} min`;
    selLabel.textContent = `Selected dot: ${visits[sel].v} min`;

    const cnt = dotCountIn(a, b);
    const dotPct = Math.round((cnt / visits.length) * 1000) / 10;
    const negPct = Math.round(curveArea(-200, 0) * 1000) / 10;
    const rangeTxt = (a <= MIN_M && b >= MAX_M) ? 'whole curve' : `${a} to ${b} min`;
    fbox(box, [
      [`range      = ${rangeTxt}`, sliceCol],
      [`curve area = ${fmt(Math.round(areaVal * 1000) / 1000)}  (${pctStr})`, sliceCol],
      [`dot share  = ${cnt} / ${visits.length}  (${dotPct}%)`, C.green],
      ['whole area = 1.00  (100%)', C.cyan],
      ...(negPct >= 0.1 ? [[`area < 0   = ${negPct}%  (edge spill)`, C.pink]] : [])
    ]);

    note.textContent = isNegSlice
      ? 'Edge trap: no real visit can last less than 0 minutes, yet short sand hills spill slightly left of zero.'
      : showHills
        ? 'Each faint hill is one visitor’s equal scoop of sand. Everywhere hills overlap, their heights add up into the smooth outline.'
        : 'Curve area estimates the share of visits in the range. It is close to the dot share because tiny bits of sand spill across the cut lines.';

    chal.update({ a, b, area: areaVal, showHills, movedDot, isRandom, randomMoves });
  }

  draw();
  return () => {};
}
