// 13.1.10 Try it: the kernel trick.
// Drag ?, Plum P2, or Apple A3 on the shifted grid (or tap + nudge),
// verify that the 4-number dot product always equals (a · b)^2,
// test opposite dot products with equal squares, generate fresh data,
// and switch between the curved boundary in (u, v) and straight line in (u^2, v^2).
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const PLUM = C.violet;
  const APPLE = '#fb923c';
  const WHITE = '#ffffff';
  const HUE = ['#ef4444', '#f97316', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#65a30d', '#22c55e'];

  // Exact lesson shifted coordinates (origin at 200 g, hue 3 -> x=4, y=3)
  const START = {
    q: { u: -1, v: 1 },   // Unknown ? : 150 g, hue 4
    p: { u: -1, v: 0 },   // Plum P2   : 150 g, hue 3
    a: { u: 2,  v: -2 },  // Apple A3  : 300 g, hue 1
  };
  const META = {
    q: { name: 'Unknown ?', short: '?', color: WHITE },
    p: { name: 'Plum P2',   short: 'P2', color: PLUM },
    a: { name: 'Apple A3',  short: 'A3', color: APPLE },
  };

  let pts = { q: { ...START.q }, p: { ...START.p }, a: { ...START.a } };
  let sel = 'q';
  let view = 'orig';       // 'orig' = (u, v) grid, 'sq' = (u^2, v^2) axes
  let showBound = false;
  let radius = 2;          // boundary u^2 + v^2 = radius^2 (default 4)

  // Challenge tracking state
  let touched = false;
  let newDataCount = 0;
  let viewedSqWithBound = false;
  let foundOpposite = false;
  const seenByContext = new Map();

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 680;
  const VH = NARROW ? 430 : 440;
  const F = NARROW ? 1.15 : 1;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const radLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const radSlider = h('input', {
    type: 'range', min: '1', max: '3.5', step: '0.5', value: String(radius),
    style: { width: '130px', accentColor: C.amber },
    oninput: e => { radius = parseFloat(e.target.value); showBound = true; draw(); }
  });

  const btnBound = btn('Show boundary', () => {
    showBound = !showBound;
    if (showBound && view === 'sq') viewedSqWithBound = true;
    draw();
  });
  const btnView = btn('Switch to squared axes (u², v²)', () => {
    view = view === 'orig' ? 'sq' : 'orig';
    if (showBound && view === 'sq') viewedSqWithBound = true;
    draw();
  });

  const selBtns = {};
  for (const key of ['q', 'p', 'a']) {
    selBtns[key] = btn(META[key].name, () => { sel = key; draw(); });
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the kernel trick'),
    h('p', { class: 'sub' },
      'Drag Unknown ?, Plum P2, or Apple A3 on the grid, or select one and nudge it. Watch the 2-number dot product, the 4-number dot product, and the squared shortcut stay equal.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          selBtns.q, selBtns.p, selBtns.a,
          btn('←', () => nudge(-1, 0)),
          btn('→', () => nudge(1, 0)),
          btn('↑', () => nudge(0, 1)),
          btn('↓', () => nudge(0, -1)),
          selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Reset', doReset, 'go'),
          btn('New data', doNewData),
          btnBound,
          btnView),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Boundary radius:'),
          radSlider, radLabel)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Math helpers (unrounded internally)
  const cleanZero = x => (Object.is(x, -0) || Math.abs(x) < 1e-12 ? 0 : x);
  const signFmt = x => {
    const v = cleanZero(x);
    return v < 0 ? '−' + fmt(Math.abs(v)) : fmt(v);
  };
  const dot2 = (a, b) => a.u * b.u + a.v * b.v;
  const phi = a => [a.u * a.u, a.u * a.v, a.u * a.v, a.v * a.v];
  const dot4 = (a, b) => {
    const fa = phi(a), fb = phi(b);
    return fa[0] * fb[0] + fa[1] * fb[1] + fa[2] * fb[2] + fa[3] * fb[3];
  };
  const kernel = (a, b) => { const d = dot2(a, b); return d * d; };
  const tuple2 = a => `(${signFmt(a.u)}, ${signFmt(a.v)})`;
  const tuple4 = a => `(${phi(a).map(signFmt).join(', ')})`;

  const isOriginal = () =>
    pts.q.u === START.q.u && pts.q.v === START.q.v &&
    pts.p.u === START.p.u && pts.p.v === START.p.v &&
    pts.a.u === START.a.u && pts.a.v === START.a.v;

  function recordDots() {
    const dP = dot2(pts.q, pts.p);
    const dA = dot2(pts.q, pts.a);
    // Simultaneous opposite dot products with ? (P2 vs A3)
    if (dP !== 0 && dP === -dA) foundOpposite = true;
    // Sequential opposite dot products while keeping ? fixed
    const ctxKey = `q:${pts.q.u},${pts.q.v}`;
    if (!seenByContext.has(ctxKey)) seenByContext.set(ctxKey, new Set());
    const set = seenByContext.get(ctxKey);
    for (const d of [dP, dA]) {
      if (d !== 0) {
        if (set.has(-d)) foundOpposite = true;
        set.add(d);
      }
    }
  }

  function nudge(du, dv) {
    touched = true;
    pts[sel].u = Math.max(-3, Math.min(4, pts[sel].u + du));
    pts[sel].v = Math.max(-2, Math.min(5, pts[sel].v + dv));
    recordDots();
    draw();
  }

  function doReset() {
    touched = true;
    pts = { q: { ...START.q }, p: { ...START.p }, a: { ...START.a } };
    radius = 2;
    radSlider.value = '2';
    recordDots();
    draw();
  }

  function doNewData() {
    touched = true;
    newDataCount++;
    const pick = () => ({ u: rnd(-3, 4), v: rnd(-2, 5) });
    let q = pick(), p = pick(), a = pick();
    for (let t = 0; t < 20; t++) {
      if ((q.u !== 0 || q.v !== 0) &&
          (p.u !== q.u || p.v !== q.v) &&
          (a.u !== q.u || a.v !== q.v) &&
          (a.u !== p.u || a.v !== p.v)) break;
      q = pick(); p = pick(); a = pick();
    }
    pts = { q, p, a };
    recordDots();
    draw();
  }

  // Self-checking challenges matching sentences 51–53
  const chal = challenges(ch, [
    {
      text: 'Restore the original positions (press Reset if you moved any fruit) and check that the kernel with Apple A3 equals 16.',
      check: st => st.touched && st.original && st.kA === 16,
      why: 'Yes! At the original positions, ? · A3 = −4 and (−4)² = 16, matching the 4-number dot product.'
    },
    {
      text: 'Find two positions that give opposite original dot products (like −4 and +4) but the exact same squared kernel result.',
      check: st => st.foundOpposite,
      why: 'Right! Squaring removes the minus sign, so opposite dot products −d and +d produce the exact same kernel score.'
    },
    {
      text: 'Press “New data” twice to test fresh fruit positions. Does the squared shortcut always match the 4-number dot product?',
      check: st => st.newDataCount >= 2,
      why: 'Always an exact match! K(a, b) = (a · b)² equals the 4-number dot product for every pair of positions.'
    },
    {
      text: 'Turn on “Show boundary” and switch to the squared axes (u², v²) to see the circle turn into a straight line.',
      check: st => st.viewedSqWithBound,
      why: 'Yes! The same rule u² + v² = R² is a straight line in squared coordinates and a circle of radius R on the original grid.'
    }
  ]);

  // Square grid geometry (DX === DY so u^2 + v^2 = R^2 is a true circle)
  const PAD_L = NARROW ? 66 : 96;
  const PAD_T = 24;
  const PAD_B = 52;
  const PAD_R = 24;
  const GRID_SZ = Math.min(VW - PAD_L - PAD_R, VH - PAD_T - PAD_B);
  const GX0 = PAD_L + Math.max(0, (VW - PAD_L - PAD_R - GRID_SZ) / 2);
  const GY1 = PAD_T + GRID_SZ;
  const GY0 = PAD_T;

  const USTEP = GRID_SZ / 8.5;
  const x2px = x => GX0 + x * USTEP;
  const y2px = y => GY1 - y * USTEP;
  const uv2px = (u, v) => [x2px(u + 4), y2px(v + 3)];

  // Dragging on the original (u, v) grid
  let dragging = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    if (view !== 'orig') return;
    const pt = toSvg(e);
    let best = null, bestD = 34 * F;
    for (const key of ['q', 'p', 'a']) {
      const [px, py] = uv2px(pts[key].u, pts[key].v);
      const d = Math.hypot(pt.x - px, pt.y - py);
      if (d < bestD) { bestD = d; best = key; }
    }
    if (!best) return;
    sel = best;
    dragging = best;
    touched = true;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (!dragging || view !== 'orig') return;
    const pt = toSvg(e);
    const u = Math.max(-3, Math.min(4, Math.round((pt.x - GX0) / USTEP - 4)));
    const v = Math.max(-2, Math.min(5, Math.round((GY1 - pt.y) / USTEP - 3)));
    if (u !== pts[dragging].u || v !== pts[dragging].v) {
      pts[dragging].u = u;
      pts[dragging].v = v;
      recordDots();
      draw();
    }
  });

  svg.addEventListener('pointerup', () => { dragging = null; });
  svg.addEventListener('pointercancel', () => { dragging = null; });

  function drawFruit(k, key, px, py, tagText) {
    const col = META[key].color;
    const isSel = key === sel;
    const r = 10 * F;
    if (isSel) {
      k.push(s('circle', { cx: px, cy: py, r: r * 1.95, fill: 'none', stroke: C.cyan, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
    }
    k.push(s('circle', { cx: px, cy: py, r: r * 1.55, fill: col, 'fill-opacity': 0.16 }));
    if (key === 'q') {
      const d = r * 1.15;
      k.push(s('polygon', {
        points: `${px},${py - d} ${px + d},${py} ${px},${py + d} ${px - d},${py}`,
        fill: WHITE, stroke: WHITE, 'stroke-width': 2, style: view === 'orig' ? 'cursor:grab' : ''
      }));
    } else if (key === 'p') {
      k.push(s('circle', { cx: px, cy: py, r, fill: PLUM, stroke: PLUM, 'stroke-width': 2, style: view === 'orig' ? 'cursor:grab' : '' }));
    } else {
      k.push(s('rect', { x: px - r * 0.9, y: py - r * 0.9, width: r * 1.8, height: r * 1.8, fill: APPLE, stroke: APPLE, 'stroke-width': 2, style: view === 'orig' ? 'cursor:grab' : '' }));
    }
    k.push(s('text', {
      x: px + (px > GX0 + GRID_SZ * 0.72 ? -14 * F : 14 * F),
      y: py - 11 * F,
      fill: col, 'font-size': 12.5 * F, 'font-weight': 700,
      'text-anchor': px > GX0 + GRID_SZ * 0.72 ? 'end' : 'start',
      'font-family': 'Consolas, monospace'
    }, tagText));
  }

  function drawOrig(k) {
    // Grid lines
    for (let x = 1; x <= 8; x++) {
      k.push(s('line', { x1: x2px(x), x2: x2px(x), y1: GY0, y2: GY1, stroke: C.line, 'stroke-width': 1 }));
    }
    for (let y = 1; y <= 8; y++) {
      k.push(s('line', { x1: GX0, x2: GX0 + GRID_SZ, y1: y2px(y), y2: y2px(y), stroke: C.line, 'stroke-width': 1 }));
    }
    // Outer weight & hue axes
    k.push(s('line', { x1: GX0, x2: GX0 + GRID_SZ, y1: GY1, y2: GY1, stroke: C.muted, 'stroke-width': 2 }));
    k.push(s('line', { x1: GX0, x2: GX0, y1: GY0, y2: GY1, stroke: C.muted, 'stroke-width': 2 }));

    // Weight ticks & labels (grams)
    for (let x = 0; x <= 8; x += 2) {
      k.push(s('text', { x: x2px(x), y: GY1 + 17 * F, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(x * 50)));
    }
    k.push(s('text', { x: GX0 + GRID_SZ / 2, y: GY1 + 38 * F, fill: C.ink, 'font-size': 12.5 * F, 'text-anchor': 'middle' }, 'Weight (grams)  |  shifted u'));

    // Hue ticks + fixed colour strip
    const stripX = GX0 - (NARROW ? 46 : 54);
    const stripW = NARROW ? 12 : 14;
    for (let y = 1; y <= 8; y++) {
      k.push(s('text', { x: GX0 - 10, y: y2px(y) + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, String(y)));
      k.push(s('rect', { x: stripX, y: y2px(y) - USTEP * 0.48, width: stripW, height: USTEP * 0.96, fill: HUE[y - 1] }));
    }
    k.push(s('text', { x: stripX + stripW / 2, y: y2px(8) - USTEP * 0.65, fill: HUE[7], 'font-size': 10 * F, 'text-anchor': 'middle' }, 'green'));
    k.push(s('text', { x: stripX + stripW / 2, y: y2px(1) + USTEP * 0.85, fill: HUE[0], 'font-size': 10 * F, 'text-anchor': 'middle' }, 'red'));

    // Shifted (u, v) axes centered at (4, 3) = (200 g, hue 3)
    const [ox, oy] = uv2px(0, 0);
    k.push(s('line', { x1: GX0, x2: GX0 + GRID_SZ, y1: oy, y2: oy, stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': 0.8 }));
    k.push(s('line', { x1: ox, x2: ox, y1: GY0, y2: GY1, stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': 0.8 }));
    k.push(s('circle', { cx: ox, cy: oy, r: 4, fill: C.cyan }));

    for (let u = -3; u <= 4; u++) {
      if (u === 0) continue;
      k.push(s('text', { x: x2px(u + 4), y: oy + 14 * F, fill: C.cyan, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, (u > 0 ? '+' : '−') + Math.abs(u)));
    }
    for (let v = -2; v <= 5; v++) {
      if (v === 0) continue;
      k.push(s('text', { x: ox + 12 * F, y: y2px(v + 3) + 4, fill: C.cyan, 'font-size': 10.5 * F, 'text-anchor': 'start', 'font-family': 'Consolas' }, (v > 0 ? '+' : '−') + Math.abs(v)));
    }

    // Curved circle boundary u^2 + v^2 = R^2
    if (showBound) {
      const rpx = radius * USTEP;
      k.push(s('circle', { cx: ox, cy: oy, r: rpx, fill: C.cyan, 'fill-opacity': 0.12, stroke: C.amber, 'stroke-width': 3 }));
      k.push(s('text', { x: ox, y: Math.max(GY0 + 16, oy - rpx - 8), fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `u² + v² = ${fmt(radius * radius)}  (circle r = ${fmt(radius)})`));
    }

    // Connecting lines from ? to P2 and A3
    const [qx, qy] = uv2px(pts.q.u, pts.q.v);
    const [px, py] = uv2px(pts.p.u, pts.p.v);
    const [ax, ay] = uv2px(pts.a.u, pts.a.v);
    k.push(s('line', { x1: qx, y1: qy, x2: px, y2: py, stroke: PLUM, 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }));
    k.push(s('line', { x1: qx, y1: qy, x2: ax, y2: ay, stroke: APPLE, 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }));

    // Draw the 3 draggable fruits
    drawFruit(k, 'p', px, py, `P2 ${tuple2(pts.p)}`);
    drawFruit(k, 'a', ax, ay, `A3 ${tuple2(pts.a)}`);
    drawFruit(k, 'q', qx, qy, `? ${tuple2(pts.q)}`);
  }

  function drawSquared(k) {
    const r2 = radius * radius;
    const maxCoord = Math.max(
      r2 + 1,
      pts.q.u * pts.q.u, pts.q.v * pts.q.v,
      pts.p.u * pts.p.u, pts.p.v * pts.p.v,
      pts.a.u * pts.a.u, pts.a.v * pts.a.v
    );
    const SMAX = Math.max(6, Math.ceil(maxCoord) + 1);
    const step = GRID_SZ / SMAX;
    const sx = v => GX0 + v * step;
    const sy = v => GY1 - v * step;
    const tickInc = SMAX > 14 ? 4 : SMAX > 8 ? 2 : 1;

    for (let i = 1; i <= SMAX; i += tickInc) {
      k.push(s('line', { x1: sx(i), x2: sx(i), y1: GY0, y2: GY1, stroke: C.line, 'stroke-width': 1 }));
      k.push(s('line', { x1: GX0, x2: GX0 + GRID_SZ, y1: sy(i), y2: sy(i), stroke: C.line, 'stroke-width': 1 }));
    }
    k.push(s('line', { x1: GX0, x2: GX0 + GRID_SZ, y1: GY1, y2: GY1, stroke: C.cyan, 'stroke-width': 2.2 }));
    k.push(s('line', { x1: GX0, x2: GX0, y1: GY0, y2: GY1, stroke: C.cyan, 'stroke-width': 2.2 }));

    for (let i = 0; i <= SMAX; i += tickInc) {
      k.push(s('text', { x: sx(i), y: GY1 + 18 * F, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(i)));
      k.push(s('text', { x: GX0 - 10, y: sy(i) + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, String(i)));
    }
    k.push(s('text', { x: GX0 + GRID_SZ / 2, y: GY1 + 39 * F, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'u²  →'));
    k.push(s('text', { x: GX0 - 26, y: GY0 + 10, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'v²'));

    // Straight line boundary u^2 + v^2 = R^2
    if (showBound) {
      const clipR2 = Math.min(r2, SMAX);
      k.push(s('polygon', {
        points: `${sx(0)},${sy(0)} ${sx(clipR2)},${sy(0)} ${sx(0)},${sy(clipR2)}`,
        fill: C.cyan, 'fill-opacity': 0.14
      }));
      k.push(s('line', { x1: sx(0), y1: sy(clipR2), x2: sx(clipR2), y2: sy(0), stroke: C.amber, 'stroke-width': 3.2 }));
      k.push(s('text', { x: sx(clipR2 * 0.52) + 8, y: sy(clipR2 * 0.52) - 8, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `u² + v² = ${fmt(r2)} (straight line)`));
    }

    for (const key of ['p', 'a', 'q']) {
      const u2 = pts[key].u * pts[key].u, v2 = pts[key].v * pts[key].v;
      drawFruit(k, key, sx(u2), sy(v2), `${META[key].short} (${u2}, ${v2})`);
    }
  }

  function draw() {
    for (const key of ['q', 'p', 'a']) {
      selBtns[key].className = 'sim-btn' + (sel === key ? ' go' : '');
    }
    btnBound.className = 'sim-btn' + (showBound ? ' go' : '');
    btnBound.textContent = showBound ? 'Hide boundary' : 'Show boundary';
    btnView.textContent = view === 'orig' ? 'Switch to squared axes (u², v²)' : 'Back to original grid (u, v)';
    radLabel.textContent = `r = ${fmt(radius)}  (u² + v² = ${fmt(radius * radius)})`;

    const k = [];
    if (view === 'orig') drawOrig(k);
    else drawSquared(k);
    svg.replaceChildren(...k);

    const dP = dot2(pts.q, pts.p), dA = dot2(pts.q, pts.a);
    const d4P = dot4(pts.q, pts.p), d4A = dot4(pts.q, pts.a);
    const kP = kernel(pts.q, pts.p), kA = kernel(pts.q, pts.a);

    const lines = [
      [`?  ${tuple2(pts.q)}  →  ${tuple4(pts.q)}`, WHITE],
      [`P2 ${tuple2(pts.p)}  →  ${tuple4(pts.p)}`, PLUM],
      [`A3 ${tuple2(pts.a)}  →  ${tuple4(pts.a)}`, APPLE],
      '────────────────────────────────────────',
      [`? & P2: dot=${signFmt(dP)} | 4-num=${fmt(d4P)} | (${signFmt(dP)})²=${fmt(kP)} ✓`, C.green],
      [`? & A3: dot=${signFmt(dA)} | 4-num=${fmt(d4A)} | (${signFmt(dA)})²=${fmt(kA)} ✓`, C.amber],
    ];
    if (showBound) {
      const r2 = radius * radius;
      const side = a => (a.u * a.u + a.v * a.v <= r2 ? 'IN' : 'OUT');
      lines.push([`u²+v² ≤ ${fmt(r2)}:  ? ${side(pts.q)}  P2 ${side(pts.p)}  A3 ${side(pts.a)}`, C.cyan]);
    }
    fbox(box, lines);

    const selPt = pts[sel];
    selLabel.textContent = `Selected: ${META[sel].name} ${tuple2(selPt)} (${(selPt.u + 4) * 50} g, hue ${selPt.v + 3})`;

    if (view === 'sq') {
      note.textContent = showBound
        ? `In squared axes (u², v²), the rule u² + v² = ${fmt(radius * radius)} is a straight line. Switch back to see the exact same rule as a circle!`
        : 'Each fruit is now plotted at (u², v²). Turn on “Show boundary” to see a straight line here become a circle on the original grid.';
    } else if (dP !== 0 && dP === -dA) {
      note.textContent = `Look at that: ? · P2 = ${signFmt(dP)} and ? · A3 = ${signFmt(dA)} are opposite, yet squaring gives the exact same kernel score (${fmt(kP)}).`;
    } else {
      note.textContent = 'Every time you move a fruit, the 4-number dot product and the squared 2-number shortcut match exactly. A kernel score is a similarity, not a probability.';
    }

    chal.update({
      touched,
      original: isOriginal(),
      kA,
      foundOpposite,
      newDataCount,
      viewedSqWithBound,
    });
  }

  recordDots();
  draw();
  return () => {};
}
