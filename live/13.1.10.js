// 13.1.10 Kernel trick: finding patterns beyond straight lines.
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Chapter 13.1 colours and shapes:
  // plums = purple circles, apples = orange squares, pears = green triangles, unknown = white diamond.
  const PLUM = C.violet;
  const APPLE = '#fb923c';
  const PEAR = C.green;
  const WHITE = '#ffffff';
  const GOLD = C.amber;

  const HUE = ['#ef4444', '#f97316', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#65a30d', '#22c55e'];

  // Responsive layout bounds:
  // Phone  (8 x 14.22): content strictly in y [-5.5, 4.3]
  // Laptop (14.22 x 8): content strictly in y [-3.0, 2.3]
  const U = P ? 0.74 : 0.44;
  const XL = P ? -2.85 : -4.60;
  const XR = XL + 8.5 * U;
  const YB = P ? -4.80 : -2.30;
  const YT = YB + 8.5 * U;
  const CX = (XL + XR) / 2;
  const PILL = P ? [0, 2.22, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.48, 0] : [3.85, -0.35, 0];
  const FR = P ? 0.145 : 0.115;

  const X = x => XL + x * U;
  const Y = y => YB + y * U;
  const xy = (x, y) => [X(x), Y(y), 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Squared axes (u^2, v^2) in [0, 5] x [0, 5]
  const SU = P ? 1.20 : 0.72;
  const SXL = P ? -2.85 : -4.60;
  const SYB = P ? -4.80 : -2.25;
  const SXR = SXL + 5 * SU;
  const SYT = SYB + 5 * SU;
  const sxy = (a, b) => [SXL + a * SU, SYB + b * SU, 0];

  // Exact chapter 13.1 shared dataset (1 weight unit = 50 grams)
  const FRUITS = [
    { id: 'P1', label: 'plum',  x: 1, y: 3 },
    { id: 'P2', label: 'plum',  x: 3, y: 3 },
    { id: 'P3', label: 'plum',  x: 2, y: 2 },
    { id: 'P4', label: 'plum',  x: 2, y: 4 },
    { id: 'A1', label: 'apple', x: 4, y: 3 },
    { id: 'A2', label: 'apple', x: 8, y: 3 },
    { id: 'A3', label: 'apple', x: 6, y: 1 },
    { id: 'A4', label: 'apple', x: 6, y: 5 },
    { id: 'R1', label: 'pear',  x: 3, y: 7 },
    { id: 'R2', label: 'pear',  x: 5, y: 7 },
    { id: 'R3', label: 'pear',  x: 4, y: 6 },
    { id: 'R4', label: 'pear',  x: 4, y: 8 },
  ];
  const UNK = { x: 3, y: 4 };

  // Basic helpers (all off-screen construction; never re-wrap on-screen objects)
  const fadeOutList = list => list.filter(Boolean).map(o => new M.FadeOut(o));
  const txt = (s, size, color, p, mono = false, bold = false) => {
    const t = T(s, size, color, mono, bold);
    t.moveTo(p);
    return t;
  };
  const ln = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const dln = (start, end, color = C.muted) =>
    new M.DashedLine({ start, end, color });
  const rect = (width, height, p, color, fillOp = 0, strokeWidth = 2) => {
    const r = new M.Rectangle({ width, height, color, strokeWidth });
    r.setFill(color, fillOp);
    r.moveTo(p);
    return r;
  };
  const rrect = (width, height, p, color, fillColor = C.card, fillOp = 0.95, strokeWidth = 2, cornerRadius = 0.14) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius, color, strokeWidth });
    r.setFill(fillColor, fillOp);
    r.moveTo(p);
    return r;
  };
  const ring = (p, color = GOLD, radius = FR * 1.9) => {
    const c = new M.Circle({ radius, color, strokeWidth: 2.5 });
    c.setFill(color, 0);
    c.moveTo(p);
    return c;
  };
  const arrow = (start, end, color = GOLD, strokeWidth = 2.6, tip = 0.13) => {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const bx = end[0] - ux * tip, by = end[1] - uy * tip;
    const px = -uy * tip * 0.55, py = ux * tip * 0.55;
    const shaft = new M.Line({ start, end: [bx, by, start[2] || 0], color, strokeWidth });
    const head = new M.Polygon({
      vertices: [end, [bx + px, by + py, end[2] || 0], [bx - px, by - py, end[2] || 0]],
      color, strokeWidth: 1
    });
    head.setFill(color, 1);
    return new M.VGroup(shaft, head);
  };
  const crossMark = (p, color = C.pink, r = 0.12) => new M.VGroup(
    ln([p[0] - r, p[1] - r, 0], [p[0] + r, p[1] + r, 0], color, 3),
    ln([p[0] - r, p[1] + r, 0], [p[0] + r, p[1] - r, 0], color, 3)
  );

  // Fruit symbols matching chapter 13.1
  function fruitGlyph(label, p, r = FR) {
    const color = label === 'plum' ? PLUM : label === 'apple' ? APPLE : PEAR;
    const halo = new M.Dot({ point: p, radius: r * 1.7, color });
    halo.setFill(color, 0.15);
    let body;
    if (label === 'plum') {
      body = new M.Circle({ radius: r, color, strokeWidth: 2 });
      body.setFill(color, 0.95);
      body.moveTo(p);
    } else if (label === 'apple') {
      body = new M.Rectangle({ width: r * 1.85, height: r * 1.85, color, strokeWidth: 2 });
      body.setFill(color, 0.95);
      body.moveTo(p);
    } else {
      body = new M.Polygon({
        vertices: [
          [p[0], p[1] + r * 1.2, 0],
          [p[0] - r * 1.1, p[1] - r * 0.85, 0],
          [p[0] + r * 1.1, p[1] - r * 0.85, 0],
        ],
        color, strokeWidth: 2
      });
      body.setFill(color, 0.95);
    }
    return new M.VGroup(halo, body);
  }

  function unknownGlyph(p, r = FR * 1.15) {
    const outer = new M.Dot({ point: p, radius: r * 1.9, color: WHITE });
    outer.setFill(WHITE, 0.10);
    const inner = new M.Dot({ point: p, radius: r * 1.35, color: WHITE });
    inner.setFill(WHITE, 0.18);
    const body = new M.Polygon({
      vertices: [
        [p[0], p[1] + r * 1.15, 0],
        [p[0] + r * 1.15, p[1], 0],
        [p[0], p[1] - r * 1.15, 0],
        [p[0] - r * 1.15, p[1], 0],
      ],
      color: WHITE, strokeWidth: 2
    });
    body.setFill(WHITE, 0.98);
    return new M.VGroup(outer, inner, body);
  }

  // One formula box at a time (copies approved 1.2.4 pattern)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = rrect(wd, ht, BOXP, color, C.card, 0.96, 2, 0.16);
    const left = BOXP[0] - wd / 2 + 0.325, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.75 : 5.4, maxh = P ? 1.55 : 3.8;
    const scf = Math.min(1, maxw / wd, maxh / ht);
    if (scf < 1) { g.scale(scf); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Build the chapter 13.1 weight-and-hue grid + fixed hue colour strip
  function buildPlotGrid() {
    const parts = [];
    for (let x = 1; x <= 8; x++) {
      const g = ln([X(x), YB, -0.01], [X(x), YT, -0.01], C.grid, 0.8);
      g.setStrokeOpacity(0.55);
      parts.push(g);
    }
    for (let y = 1; y <= 8; y++) {
      const g = ln([XL, Y(y), -0.01], [XR, Y(y), -0.01], C.grid, 0.8);
      g.setStrokeOpacity(0.55);
      parts.push(g);
    }
    // Axes
    parts.push(ln([XL, YB, 0], [XR, YB, 0], C.muted, 2.5));
    parts.push(ln([XL, YB, 0], [XL, YT, 0], C.muted, 2.5));
    // Weight ticks every 50g, labels every 100g for clean spacing
    for (let x = 0; x <= 8; x++) {
      parts.push(ln([X(x), YB - 0.06, 0], [X(x), YB + 0.06, 0], C.muted, 1.5));
      if (x % 2 === 0) {
        parts.push(txt(String(x * 50), P ? 14 : 14, C.muted, [X(x), YB - 0.25, 0], true));
      }
    }
    parts.push(txt('Weight (grams) →', P ? 16 : 16, C.ink, [(XL + XR) / 2, YB - 0.58, 0]));
    // Hue ticks 1..8
    for (let y = 1; y <= 8; y++) {
      parts.push(ln([XL - 0.06, Y(y), 0], [XL + 0.06, Y(y), 0], C.muted, 1.5));
      parts.push(txt(String(y), P ? 14 : 14, C.muted, [XL - 0.24, Y(y), 0], true));
    }
    // Fixed hue colour strip
    const sx = XL - (P ? 0.68 : 0.68), sw = 0.22;
    HUE.forEach((col, i) => {
      parts.push(rect(sw, U * 0.96, [sx, Y(i + 1), 0], col, 0.95, 1));
    });
    parts.push(txt('Hue', P ? 15 : 15, C.ink, [XL - 0.35, YT + 0.20, 0]));
    parts.push(txt('green', 11, HUE[7], [sx, Y(8) + U * 0.62, 0]));
    parts.push(txt('red', 11, HUE[0], [sx, Y(1) - U * 0.62, 0]));
    return new M.VGroup(...parts);
  }

  // Build shifted (u, v) axes centered at (4, 3) = (200 g, hue 3)
  function buildShiftedAxes() {
    const parts = [
      ln([XL, Y(3), 0], [XR, Y(3), 0], C.cyan, 2.6),
      ln([X(4), YB, 0], [X(4), YT, 0], C.cyan, 2.6),
    ];
    const oDot = new M.Dot({ point: xy(4, 3), radius: 0.09, color: C.cyan });
    oDot.setFill(C.cyan, 1);
    parts.push(oDot);
    parts.push(txt('u', P ? 16 : 16, C.cyan, [XR + 0.16, Y(3), 0], true, true));
    parts.push(txt('v', P ? 16 : 16, C.cyan, [X(4), YT + 0.18, 0], true, true));
    return new M.VGroup(...parts);
  }

  function buildShiftedTicks() {
    const parts = [];
    for (let u = -3; u <= 4; u++) {
      if (u === 0) continue;
      parts.push(txt((u > 0 ? '+' : '−') + Math.abs(u), P ? 15 : 12, C.cyan, [X(4 + u), Y(3) - 0.22, 0], true));
    }
    for (let v = -2; v <= 5; v++) {
      if (v === 0) continue;
      parts.push(txt((v > 0 ? '+' : '−') + Math.abs(v), P ? 15 : 12, C.cyan, [X(4) + 0.26, Y(3 + v), 0], true));
    }
    return new M.VGroup(...parts);
  }

  // =========================================================================
  // BEATS 0–1: Straight line struggles; can a new description help?
  // =========================================================================
  const IC = P ? [0, -1.35, 0] : [CX, -0.45, 0];
  const RIN = P ? 0.72 : 0.56, ROUT = P ? 2.05 : 1.52;
  const introPlums = [0, 1, 2, 3].map(k => {
    const a = k * Math.PI / 2 + 0.4;
    return fruitGlyph('plum', [IC[0] + Math.cos(a) * RIN, IC[1] + Math.sin(a) * RIN, 0], FR * 1.15);
  });
  const introApples = [0, 1, 2, 3, 4, 5, 6, 7].map(k => {
    const a = k * Math.PI / 4 + 0.2;
    return fruitGlyph('apple', [IC[0] + Math.cos(a) * ROUT, IC[1] + Math.sin(a) * ROUT, 0], FR * 1.15);
  });
  const badLine = ln(
    [IC[0] - ROUT * 1.25, IC[1] - ROUT * 0.45, 0],
    [IC[0] + ROUT * 1.25, IC[1] + ROUT * 0.45, 0],
    GOLD, 3.2
  );
  const badXs = [
    crossMark([IC[0] + Math.cos(0.95) * ROUT, IC[1] + Math.sin(0.95) * ROUT, 0]),
    crossMark([IC[0] + Math.cos(4.12) * ROUT, IC[1] + Math.sin(4.12) * ROUT, 0]),
    crossMark([IC[0] + Math.cos(1.97) * RIN, IC[1] + Math.sin(1.97) * RIN, 0]),
  ];

  await until(S(0));
  await play(
    new M.LaggedStart([...introPlums, ...introApples].map(o => new M.FadeIn(o)), { lagRatio: 0.05, runTime: 1.0 }),
    new M.Create(badLine, { runTime: 1.0 }),
    ...badXs.map(x => new M.FadeIn(x, { runTime: 1.0 })),
    ...say('STRAIGHT LINE STRUGGLES', GOLD)
  );

  const introCurve = new M.Circle({ radius: (RIN + ROUT) / 2, color: C.cyan, strokeWidth: 3.5 });
  introCurve.setFill(C.cyan, 0.12);
  introCurve.moveTo(IC);

  await until(S(1));
  await play(
    new M.FadeOut(badLine),
    ...fadeOutList(badXs),
    new M.Create(introCurve, { runTime: 1.1 }),
    ...say('A NEW DESCRIPTION FOR A BETTER BOUNDARY?', C.cyan)
  );

  // =========================================================================
  // BEATS 2–3: Twelve known fruits on the weight & hue drawing; focus 3
  // =========================================================================
  const plotGrid = buildPlotGrid();
  const fruitDots = FRUITS.map(f => ({ ...f, mob: fruitGlyph(f.label, xy(f.x, f.y)) }));

  await until(S(2));
  await play(
    ...fadeOutList([...introPlums, ...introApples, introCurve]),
    new M.FadeIn(plotGrid, { runTime: 0.8 }),
    new M.LaggedStart(fruitDots.map(f => new M.FadeIn(f.mob)), { lagRatio: 0.06, runTime: 1.2 }),
    ...say('12 KNOWN FRUITS: WEIGHT & HUE', C.cyan)
  );

  const otherMobs = fruitDots.filter(f => f.id !== 'P2' && f.id !== 'A3').map(f => f.mob);
  const mobP2 = fruitDots.find(f => f.id === 'P2').mob;
  const mobA3 = fruitDots.find(f => f.id === 'A3').mob;
  const mobQ = unknownGlyph(xy(UNK.x, UNK.y));
  const tagQ = txt('?', P ? 18 : 17, WHITE, [X(UNK.x) - 0.30, Y(UNK.y), 0], true, true);
  const tagP2 = txt('P2', P ? 16 : 15, PLUM, [X(3), Y(3) - 0.47, 0], true, true);
  const tagA3 = txt('A3', P ? 16 : 15, APPLE, [X(6) + 0.32, Y(1) + 0.22, 0], true, true);

  await until(S(3));
  await play(
    ...fadeOutList(otherMobs),
    new M.FadeIn(mobQ),
    new M.Flash(mobQ, { color: WHITE }),
    new M.FadeIn(tagQ), new M.FadeIn(tagP2), new M.FadeIn(tagA3),
    ...say('FOCUS: UNKNOWN ?, PLUM P2, APPLE A3', GOLD)
  );

  // =========================================================================
  // BEATS 4–5: Shift grid origin to (200 g, hue 3) = (4, 3)
  // =========================================================================
  const shiftedAxes = buildShiftedAxes();
  const originTag = pill('START (0, 0)', C.cyan, P ? 15 : 13);
  originTag.moveTo([X(4) + (P ? 1.05 : 0.92), Y(3) + (P ? 0.38 : 0.30), 0]);

  await until(S(4));
  await play(
    new M.Create(shiftedAxes, { runTime: 1.1 }),
    new M.FadeIn(originTag),
    ...fbox(['New starting point:', ['200 g, hue 3  →  (0, 0)', C.cyan]], C.cyan),
    ...say('START COUNTING AT 200 g, HUE 3', C.cyan)
  );

  const shiftedTicks = buildShiftedTicks();
  await until(S(5));
  await play(
    new M.FadeIn(shiftedTicks),
    new M.Indicate(mobQ, { color: WHITE }),
    new M.Indicate(mobP2, { color: PLUM }),
    new M.Indicate(mobA3, { color: APPLE }),
    ...say('FRUITS STAY STILL — ONLY COUNTING MOVES', C.muted)
  );

  // =========================================================================
  // BEATS 6–11: Shifted coordinates of ?, P2, and A3
  // =========================================================================
  const qArr1 = arrow(xy(4, 3), xy(3, 3), WHITE, 2.8, 0.12);
  const qArr2 = arrow(xy(3, 3), xy(3, 4), WHITE, 2.8, 0.12);
  const qStep1 = txt('−1', P ? 15 : 14, WHITE, [X(3.5), Y(3) - 0.24, 0], true, true);
  const qStep2 = txt('+1', P ? 15 : 14, WHITE, [X(3) - 0.30, Y(3.5), 0], true, true);

  await until(S(6));
  await play(
    new M.FadeOut(originTag),
    new M.FadeIn(qArr1), new M.FadeIn(qStep1),
    new M.FadeIn(qArr2), new M.FadeIn(qStep2),
    ...say('UNKNOWN ?: 1 LEFT, 1 UP', WHITE)
  );

  const coordQ = txt('(−1, 1)', P ? 15 : 14, WHITE, [X(3) - 0.05, Y(4) + 0.34, 0], true, true);
  await until(S(7));
  await play(
    new M.FadeIn(coordQ),
    ...fbox(['Shifted positions (u, v):', ['?   : (−1,  1)', WHITE]], C.cyan),
    ...say('UNKNOWN = (−1, 1)', C.cyan)
  );

  const p2Ring = ring(xy(3, 3), PLUM);
  const p2Gx = dln(xy(3, 3), [X(3), YB, 0], PLUM);
  const p2Gy = dln(xy(3, 3), [XL, Y(3), 0], PLUM);

  await until(S(8));
  await play(
    ...fadeOutList([qArr1, qArr2, qStep1, qStep2]),
    new M.FadeIn(p2Ring), new M.Create(p2Gx), new M.Create(p2Gy),
    ...say('PLUM P2: 150 g, HUE 3', PLUM)
  );

  const p2Arr = arrow(xy(4, 3), xy(3, 3), PLUM, 2.8, 0.12);
  const coordP2 = txt('(−1, 0)', P ? 15 : 14, PLUM, [X(3), Y(3) - 0.74, 0], true, true);

  await until(S(9));
  await play(
    new M.FadeIn(p2Arr), new M.FadeIn(coordP2),
    ...fbox(['Shifted positions (u, v):', ['?   : (−1,  1)', WHITE], ['P2  : (−1,  0)', PLUM]], PLUM),
    ...say('PLUM P2 = (−1, 0)', PLUM)
  );

  const a3Ring = ring(xy(6, 1), APPLE);
  const a3Gx = dln(xy(6, 1), [X(6), YB, 0], APPLE);
  const a3Gy = dln(xy(6, 1), [XL, Y(1), 0], APPLE);

  await until(S(10));
  await play(
    ...fadeOutList([p2Ring, p2Gx, p2Gy, p2Arr]),
    new M.FadeIn(a3Ring), new M.Create(a3Gx), new M.Create(a3Gy),
    ...say('APPLE A3: 300 g, HUE 1', APPLE)
  );

  const a3Arr1 = arrow(xy(4, 3), xy(6, 3), APPLE, 2.8, 0.12);
  const a3Arr2 = arrow(xy(6, 3), xy(6, 1), APPLE, 2.8, 0.12);
  const coordA3 = txt('(2, −2)', P ? 15 : 14, APPLE, [X(6) + 0.56, Y(1) - 0.25, 0], true, true);

  await until(S(11));
  await play(
    new M.FadeIn(a3Arr1), new M.FadeIn(a3Arr2), new M.FadeIn(coordA3),
    ...fbox([
      'Shifted positions (u, v):',
      ['?   : (−1,  1)', WHITE],
      ['P2  : (−1,  0)', PLUM],
      ['A3  : ( 2, −2)', APPLE],
    ], APPLE),
    ...say('APPLE A3 = (2, −2)', APPLE)
  );

  // =========================================================================
  // BEATS 12–19: Original 2-number dot products
  // =========================================================================
  const linkQP = ln(xy(3, 4), xy(3, 3), PLUM, 3.2);
  const linkQA = ln(xy(3, 4), xy(6, 1), APPLE, 3.2);

  await until(S(12));
  await play(
    ...fadeOutList([a3Ring, a3Gx, a3Gy, a3Arr1, a3Arr2]),
    new M.Create(linkQP), new M.Create(linkQA),
    ...fbox(['Compare two positions:', ['multiply matching numbers', GOLD], ['and add the results', GOLD]], GOLD),
    ...say('MULTIPLY MATCHING, THEN ADD', GOLD)
  );

  await until(S(13));
  await play(
    new M.Indicate(linkQP, { color: PLUM }),
    ...fbox([
      ['? (−1, 1)  &  P2 (−1, 0)', PLUM],
      ['first : (−1) × (−1) = 1', C.cyan],
    ], PLUM),
    ...say('FIRST: (−1) × (−1) = 1', C.cyan)
  );

  await until(S(14));
  await play(
    ...fbox([
      ['? (−1, 1)  &  P2 (−1, 0)', PLUM],
      'first : (−1) × (−1) = 1',
      ['second:   1  ×   0  = 0', C.cyan],
    ], PLUM),
    ...say('SECOND: 1 × 0 = 0', C.cyan)
  );

  const badgeQP = pill('1', C.green, 15);
  badgeQP.moveTo([X(2.4), Y(3.5), 0]);
  await until(S(15));
  await play(
    new M.FadeIn(badgeQP, { runTime: 0.7 }),
    ...fbox([
      ['? (−1, 1)  &  P2 (−1, 0)', PLUM],
      'first : (−1) × (−1) = 1',
      'second:   1  ×   0  = 0',
      ['total :   1  +   0  = 1', C.green],
    ], C.green),
    ...say('RESULT FOR PLUM = 1', C.green)
  );

  await until(S(16));
  await play(
    new M.Indicate(linkQA, { color: APPLE }),
    ...fbox([
      ['? (−1, 1)  &  A3 (2, −2)', APPLE],
      ['first : (−1) × 2 = −2', GOLD],
    ], APPLE),
    ...say('FIRST: (−1) × 2 = −2', APPLE)
  );

  await until(S(17));
  await play(
    ...fbox([
      ['? (−1, 1)  &  A3 (2, −2)', APPLE],
      'first : (−1) ×   2  = −2',
      ['second:   1  × (−2) = −2', GOLD],
    ], APPLE),
    ...say('SECOND: 1 × (−2) = −2', APPLE)
  );

  const badgeQA = pill('−4', C.pink, 15);
  badgeQA.moveTo([X(4.85), Y(2.65), 0]);
  await until(S(18));
  await play(
    new M.FadeIn(badgeQA, { runTime: 0.7 }),
    ...fbox([
      ['? (−1, 1)  &  A3 (2, −2)', APPLE],
      'first : (−1) ×   2  = −2',
      'second:   1  × (−2) = −2',
      ['total :  −2  + (−2) = −4', C.pink],
    ], C.pink),
    ...say('RESULT FOR APPLE = −4', C.pink)
  );

  await until(S(19));
  await play(
    new M.Indicate(badgeQP, { color: C.green }),
    new M.Indicate(badgeQA, { color: C.pink }),
    ...fbox([
      ['DOT PRODUCT', C.green],
      ['? · P2 =  1', PLUM],
      ['? · A3 = −4', APPLE],
    ], C.green),
    ...say('THIS IS THE DOT PRODUCT', C.green)
  );

  // =========================================================================
  // BEATS 20–34: Four-number richer description (u^2, uv, uv, v^2)
  // =========================================================================
  const plotStageMobs = [
    plotGrid, shiftedAxes, shiftedTicks,
    mobQ, mobP2, mobA3, tagQ, tagP2, tagA3,
    coordQ, coordP2, coordA3, linkQP, linkQA, badgeQP, badgeQA
  ];

  // Table layout (cleanly clear of PILL and BOXP on both phone and laptop)
  const colXs = P ? [-1.15, -0.02, 1.11, 2.24] : [-3.35, -2.35, -1.35, -0.35];
  // phone rows spread over the full height (lower third used)
  const rowYs = P ? [0.20, -1.95, -4.10] : [0.55, -0.55, -1.65];
  const hdrY  = P ? 1.20 : 1.32;
  const lblX  = P ? -2.78 : -5.18;
  const resX  = P ? 3.30 : 0.56;
  const sw    = P ? 0.96 : 0.84;
  const sh    = P ? 0.95 : 0.68;

  const rowSpecs = [
    { name: '?  (−1, 1)',  color: WHITE, vals: ['1', '−1', '−1', '1'] },
    { name: 'P2 (−1, 0)',  color: PLUM,  vals: ['1', '0',  '0',  '0'] },
    { name: 'A3 (2, −2)',  color: APPLE, vals: ['4', '−4', '−4', '4'] },
  ];

  const rowLabels = rowSpecs.map((r, ri) =>
    txt(r.name, P ? 15 : 16, r.color, [lblX, rowYs[ri], 0], true, true)
  );
  const slotBoxes = rowSpecs.map((r, ri) =>
    colXs.map(cx => rrect(sw, sh, [cx, rowYs[ri], 0], r.color, C.card, 0.9, 2, 0.12))
  );

  await until(S(20));
  await play(
    ...fadeOutList(plotStageMobs),
    new M.LaggedStart([...rowLabels, ...slotBoxes.flat()].map(o => new M.FadeIn(o)), { lagRatio: 0.04, runTime: 1.2 }),
    ...fbox(['Richer description:', ['4 numbers instead of 2', C.cyan]], C.cyan),
    ...say('4 NUMBERS INSTEAD OF 2', C.cyan)
  );

  const colHdrs = ['u²', 'u × v', 'u × v', 'v²'].map((s, ci) =>
    txt(s, P ? 16 : 16, GOLD, [colXs[ci], hdrY, 0], true, true)
  );
  await until(S(21));
  await play(
    new M.LaggedStart(colHdrs.map(o => new M.FadeIn(o)), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox(['Rule for (u, v):', ['(u²,  u×v,  u×v,  v²)', GOLD]], GOLD),
    ...say('u²,  u × v,  u × v,  v²', GOLD)
  );

  await until(S(22));
  await play(
    new M.Indicate(colHdrs[0], { color: C.cyan }),
    new M.Indicate(colHdrs[3], { color: C.cyan }),
    ...fbox(['Squaring a number:', ['u² = u × u', C.cyan], ['v² = v × v', C.cyan]], C.cyan),
    ...say('SQUARING = NUMBER × ITSELF', C.muted)
  );

  const slotTexts = [[], [], []];
  const putSlot = (ri, ci, col = rowSpecs[ri].color) => {
    const t = txt(rowSpecs[ri].vals[ci], P ? 20 : 19, col, [colXs[ci], rowYs[ri], 0], true, true);
    slotTexts[ri].push(t);
    return t;
  };

  // Unknown fruit 4 numbers step by step (beats 23–26)
  const q0 = putSlot(0, 0, C.cyan);
  await until(S(23));
  await play(
    new M.FadeIn(q0), new M.Indicate(slotBoxes[0][0], { color: C.cyan }),
    ...fbox(['Unknown ? (−1, 1):', ['u² = (−1) × (−1) = 1', C.cyan]], C.cyan),
    ...say('FIRST: (−1)² = 1', C.cyan)
  );

  const q1 = putSlot(0, 1, C.cyan), q2 = putSlot(0, 2, C.cyan);
  await until(S(24));
  await play(
    new M.FadeIn(q1), new M.FadeIn(q2),
    new M.Indicate(slotBoxes[0][1], { color: C.cyan }),
    new M.Indicate(slotBoxes[0][2], { color: C.cyan }),
    ...fbox(['Unknown ? (−1, 1):', 'u²  = 1', ['u×v = (−1) × 1 = −1 (twice)', C.cyan]], C.cyan),
    ...say('(−1) × 1 = −1, WRITTEN TWICE', C.cyan)
  );

  const q3 = putSlot(0, 3, C.cyan);
  await until(S(25));
  await play(
    new M.FadeIn(q3), new M.Indicate(slotBoxes[0][3], { color: C.cyan }),
    ...fbox(['Unknown ? (−1, 1):', 'u²  = 1,  u×v = −1, −1', ['v²  = 1 × 1 = 1', C.cyan]], C.cyan),
    ...say('LAST: 1² = 1', C.cyan)
  );

  await until(S(26));
  await play(
    new M.LaggedStart(slotBoxes[0].map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['Unknown ? (−1, 1):', ['→ (1, −1, −1, 1)', C.green]], C.green),
    ...say('UNKNOWN → (1, −1, −1, 1)', C.green)
  );

  // Plum P2 4 numbers (beat 27)
  const pSlots = [0, 1, 2, 3].map(ci => putSlot(1, ci, PLUM));
  await until(S(27));
  await play(
    new M.LaggedStart(pSlots.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['Plum P2 (−1, 0):', ['→ (1, 0, 0, 0)', PLUM]], PLUM),
    ...say('PLUM P2 → (1, 0, 0, 0)', PLUM)
  );

  // Apple A3 4 numbers (beat 28)
  const aSlots = [0, 1, 2, 3].map(ci => putSlot(2, ci, APPLE));
  await until(S(28));
  await play(
    new M.LaggedStart(aSlots.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['Apple A3 (2, −2):', ['→ (4, −4, −4, 4)', APPLE]], APPLE),
    ...say('APPLE A3 → (4, −4, −4, 4)', APPLE)
  );

  // Beat 29: richer patterns
  await until(S(29));
  await play(
    new M.LaggedStart(colHdrs.map(h => new M.Indicate(h, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['Four numbers per fruit:', ['more ways to spot patterns', C.cyan]], C.cyan),
    ...say('NEW WAYS TO LOOK FOR PATTERNS', C.cyan)
  );

  // Beat 30: 4-number dot products intro
  await until(S(30));
  await play(
    ...fbox(['4-number dot product:', ['multiply matching slots', GOLD], ['and add all four', GOLD]], GOLD),
    ...say('4-NUMBER DOT PRODUCTS', GOLD)
  );

  // Beats 31–32: Unknown & Plum 4-number dot product = 1
  const hiP = rrect(colXs[3] - colXs[0] + sw + 0.24, sh + 0.22, [(colXs[0] + colXs[3]) / 2, rowYs[1], 0], PLUM, PLUM, 0.10, 2.5, 0.16);
  await until(S(31));
  await play(
    new M.FadeIn(hiP),
    ...fbox([
      ['? & P2  (4 numbers)', PLUM],
      '1×1 + (−1)×0 + (−1)×0 + 1×0',
      ['= 1 + 0 + 0 + 0', C.cyan],
    ], PLUM),
    ...say('1 + 0 + 0 + 0', PLUM)
  );

  const resP = pill('= 1', C.green, 15);
  resP.moveTo([resX, rowYs[1], 0]);
  await until(S(32));
  await play(
    new M.FadeIn(resP, { runTime: 0.65 }),
    ...fbox([
      ['? & P2  (4 numbers)', PLUM],
      '1 + 0 + 0 + 0',
      ['= 1', C.green],
    ], C.green),
    ...say('RESULT = 1', C.green)
  );

  // Beats 33–34: Unknown & Apple 4-number dot product = 16
  const hiA = rrect(colXs[3] - colXs[0] + sw + 0.24, sh + 0.22, [(colXs[0] + colXs[3]) / 2, rowYs[2], 0], APPLE, APPLE, 0.10, 2.5, 0.16);
  await until(S(33));
  await play(
    new M.FadeOut(hiP), new M.FadeIn(hiA),
    ...fbox([
      ['? & A3  (4 numbers)', APPLE],
      '1×4 + (−1)(−4) + (−1)(−4) + 1×4',
      ['= 4 + 4 + 4 + 4', GOLD],
    ], APPLE),
    ...say('4 + 4 + 4 + 4', APPLE)
  );

  const resA = pill('= 16', GOLD, 15);
  resA.moveTo([resX, rowYs[2], 0]);
  await until(S(34));
  await play(
    new M.FadeIn(resA, { runTime: 0.65 }),
    ...fbox([
      ['? & A3  (4 numbers)', APPLE],
      '4 + 4 + 4 + 4',
      ['= 16', GOLD],
    ], GOLD),
    ...say('RESULT = 16', GOLD)
  );

  // =========================================================================
  // BEATS 35–42: Shortcut = Kernel Trick = Degree-2 Polynomial Kernel
  // =========================================================================
  const tableStageMobs = [
    ...rowLabels, ...slotBoxes.flat(), ...colHdrs,
    ...slotTexts.flat(), hiA, resP, resA
  ];

  const CCX = P ? 0 : -2.75;
  const CCY = P ? -1.15 : -0.45;
  const cardW = P ? 3.05 : 2.75, cardH = P ? 2.85 : 2.55, gap = P ? 1.05 : 0.95;
  const lx = CCX - cardW / 2 - gap / 2, rx = CCX + cardW / 2 + gap / 2;

  const leftCard = new M.VGroup(
    rrect(cardW, cardH, [lx, CCY, 0], C.cyan, C.card, 0.96, 2.2, 0.18),
    txt('2-NUMBER DOT', P ? 15 : 15, C.cyan, [lx, CCY + cardH * 0.34, 0], true, true),
    txt('? · P2 =  1', P ? 18 : 18, PLUM, [lx, CCY + 0.12, 0], true, true),
    txt('? · A3 = −4', P ? 18 : 18, APPLE, [lx, CCY - 0.68, 0], true, true)
  );
  const rightCard = new M.VGroup(
    rrect(cardW, cardH, [rx, CCY, 0], GOLD, C.card, 0.96, 2.2, 0.18),
    txt('4-NUMBER DOT', P ? 15 : 15, GOLD, [rx, CCY + cardH * 0.34, 0], true, true),
    txt('? · P2 =  1', P ? 18 : 18, C.green, [rx, CCY + 0.12, 0], true, true),
    txt('? · A3 = 16', P ? 18 : 18, GOLD, [rx, CCY - 0.68, 0], true, true)
  );

  await until(S(35));
  await play(
    ...fadeOutList(tableStageMobs),
    new M.FadeIn(leftCard), new M.FadeIn(rightCard),
    ...fbox(['Original dot products:', ['? · P2 =  1', PLUM], ['? · A3 = −4', APPLE]], C.cyan),
    ...say('LOOK BACK: 1 AND −4', C.cyan)
  );

  const sqArr1 = arrow([lx + cardW / 2 + 0.08, CCY + 0.12, 0], [rx - cardW / 2 - 0.08, CCY + 0.12, 0], GOLD, 3, 0.15);
  const sqArr2 = arrow([lx + cardW / 2 + 0.08, CCY - 0.68, 0], [rx - cardW / 2 - 0.08, CCY - 0.68, 0], GOLD, 3, 0.15);
  const sqLbl1 = txt('( )²', 15, GOLD, [CCX, CCY + 0.42, 0], true, true);
  const sqLbl2 = txt('( )²', 15, GOLD, [CCX, CCY - 0.38, 0], true, true);

  await until(S(36));
  await play(
    new M.FadeIn(sqArr1), new M.FadeIn(sqArr2),
    new M.FadeIn(sqLbl1), new M.FadeIn(sqLbl2),
    ...fbox(['Square each original dot:', ['   1²  =  1', C.green], ['(−4)² = 16', GOLD]], GOLD),
    ...say('1² = 1     (−4)² = 16', GOLD)
  );

  const matchPill = pill('✓ SAME RESULT — NO 4-NUMBER LIST NEEDED', C.green, P ? 15 : 14);
  matchPill.moveTo([CCX, CCY - cardH / 2 - 0.55, 0]);
  await until(S(37));
  await play(
    new M.FadeIn(matchPill),
    ...say('SAME RESULTS WITHOUT LONGER LISTS', C.green)
  );

  const kBadge = pill('KERNEL', GOLD, 18);
  kBadge.moveTo([CCX, CCY + cardH / 2 + 0.45, 0]);
  await until(S(38));
  await play(
    new M.FadeIn(kBadge),
    new M.Indicate(sqArr1, { color: GOLD }),
    new M.Indicate(sqArr2, { color: GOLD }),
    ...say('THIS COMPARISON IS A KERNEL', GOLD)
  );

  const trickBadge = pill('THE KERNEL TRICK', C.green, 18);
  trickBadge.moveTo([CCX, CCY + cardH / 2 + 0.45, 0]);
  await until(S(39));
  await play(
    new M.FadeOut(kBadge), new M.FadeIn(trickBadge),
    ...say('SKIPPING LONGER LISTS = KERNEL TRICK', C.green)
  );

  await until(S(40));
  await play(
    new M.Indicate(sqLbl1, { color: C.cyan }),
    new M.Indicate(sqLbl2, { color: C.cyan }),
    ...fbox(['Degree-2 polynomial kernel:', ['squares the original dot product', C.cyan]], C.cyan),
    ...say('DEGREE-2 POLYNOMIAL KERNEL', C.cyan)
  );

  await until(S(41));
  await play(
    ...fbox(['One short formula:', ['...']], C.cyan),
    ...say('ONE SHORT LINE', C.cyan)
  );

  await until(S(42));
  await play(
    ...fbox([
      ['K(a, b) = (a · b)²', GOLD],
      ['? & P2 :   1²  =  1', PLUM],
      ['? & A3 : (−4)² = 16', APPLE],
    ], GOLD),
    ...say('KERNEL = (ORIGINAL DOT PRODUCT)²', GOLD)
  );

  // =========================================================================
  // BEATS 43–48: Straight line in (u^2, v^2) -> Circle of radius 2 in (u, v)
  // =========================================================================
  const compMobs = [leftCard, rightCard, sqArr1, sqArr2, sqLbl1, sqLbl2, matchPill, trickBadge];

  await until(S(43));
  await play(
    ...fadeOutList(compMobs),
    ...fbox(['Next question:', ['How does this make a curve?', C.violet]], C.violet),
    ...say('HOW DOES THIS MAKE A CURVED BOUNDARY?', C.violet)
  );

  // Build (u^2, v^2) axes
  const sqGridParts = [];
  for (let i = 1; i <= 5; i++) {
    const gv = ln([SXL + i * SU, SYB, -0.01], [SXL + i * SU, SYT, -0.01], C.grid, 0.8);
    gv.setStrokeOpacity(0.5);
    const gh = ln([SXL, SYB + i * SU, -0.01], [SXR, SYB + i * SU, -0.01], C.grid, 0.8);
    gh.setStrokeOpacity(0.5);
    sqGridParts.push(gv, gh);
  }
  sqGridParts.push(ln([SXL, SYB, 0], [SXR, SYB, 0], C.muted, 2.5));
  sqGridParts.push(ln([SXL, SYB, 0], [SXL, SYT, 0], C.muted, 2.5));
  for (let i = 0; i <= 5; i++) {
    sqGridParts.push(txt(String(i), 14, C.muted, [SXL + i * SU, SYB - 0.25, 0], true));
    sqGridParts.push(txt(String(i), 14, C.muted, [SXL - 0.26, SYB + i * SU, 0], true));
  }
  sqGridParts.push(txt('u²  →', 17, C.cyan, [(SXL + SXR) / 2, SYB - 0.58, 0], true, true));
  sqGridParts.push(txt('v²', 17, C.cyan, [SXL - 0.26, SYT + 0.22, 0], true, true));
  const sqAxes = new M.VGroup(...sqGridParts);

  const sqQ = unknownGlyph(sxy(1, 1), FR * 1.15);
  const sqP = fruitGlyph('plum', sxy(1, 0), FR * 1.15);
  const sqA = fruitGlyph('apple', sxy(4, 4), FR * 1.15);
  const sqLblQ = txt('? (1,1)', 14, WHITE, [sxy(1, 1)[0] + 0.55, sxy(1, 1)[1] + 0.22, 0], true);
  const sqLblP = txt('P2 (1,0)', 14, PLUM, [sxy(1, 0)[0] + 0.60, sxy(1, 0)[1] + 0.24, 0], true);
  const sqLblA = txt('A3 (4,4)', 14, APPLE, [sxy(4, 4)[0] - 0.15, sxy(4, 4)[1] + 0.34, 0], true);

  await until(S(44));
  await play(
    new M.FadeIn(sqAxes),
    new M.FadeIn(sqQ), new M.FadeIn(sqP), new M.FadeIn(sqA),
    new M.FadeIn(sqLblQ), new M.FadeIn(sqLblP), new M.FadeIn(sqLblA),
    ...fbox(['Separate boundary rule:', ['u² + v² = 4', GOLD], 'inside < 4   outside > 4'], GOLD),
    ...say('RULE: u² + v² = 4', GOLD)
  );

  const sqFill = new M.Polygon({
    vertices: [sxy(0, 0), sxy(4, 0), sxy(0, 4)],
    color: C.cyan, strokeWidth: 0
  });
  sqFill.setFill(C.cyan, 0.14);
  const sqLine = ln(sxy(0, 4), sxy(4, 0), GOLD, 3.6);
  const sqLineTag = txt('u² + v² = 4', 15, GOLD, [sxy(2.3, 2.3)[0] + 0.35, sxy(2.3, 2.3)[1] + 0.18, 0], true, true);

  await until(S(45));
  await play(
    new M.FadeIn(sqFill),
    new M.Create(sqLine, { runTime: 1.0 }),
    new M.FadeIn(sqLineTag),
    ...say('IN SQUARED AXES: A STRAIGHT LINE', C.green)
  );

  // Return to original (u, v) drawing: circle of radius 2 grid spaces!
  const sqMobs = [sqAxes, sqQ, sqP, sqA, sqLblQ, sqLblP, sqLblA, sqFill, sqLine, sqLineTag];
  const plotGrid2 = buildPlotGrid();
  const shAxes2 = buildShiftedAxes();
  const q2M = unknownGlyph(xy(3, 4));
  const p2M = fruitGlyph('plum', xy(3, 3));
  const a3M = fruitGlyph('apple', xy(6, 1));
  const lq2 = txt('?', 16, WHITE, [X(3) - 0.30, Y(4), 0], true, true);
  const lp2 = txt('P2', 15, PLUM, [X(3), Y(3) - 0.47, 0], true, true);
  const la3 = txt('A3', 15, APPLE, [X(6) + 0.32, Y(1) + 0.22, 0], true, true);

  const circleB = new M.Circle({ radius: 2 * U, color: GOLD, strokeWidth: 3.6 });
  circleB.setFill(C.cyan, 0.13);
  circleB.moveTo(xy(4, 3));
  const radArr = arrow(xy(4, 3), xy(6, 3), GOLD, 2.6, 0.13);
  const radTxt = txt('r = 2', 15, GOLD, [X(5), Y(3) + 0.24, 0], true, true);

  await until(S(46));
  await play(
    ...fadeOutList(sqMobs),
    new M.FadeIn(plotGrid2), new M.FadeIn(shAxes2),
    new M.FadeIn(q2M), new M.FadeIn(p2M), new M.FadeIn(a3M),
    new M.FadeIn(lq2), new M.FadeIn(lp2), new M.FadeIn(la3),
    new M.Create(circleB, { runTime: 1.1 }),
    new M.FadeIn(radArr), new M.FadeIn(radTxt),
    ...fbox(['Back in original grid:', ['u² + v² = 4', GOLD], ['circle of radius 2 spaces', C.cyan]], GOLD),
    ...say('ORIGINAL GRID: CIRCLE OF RADIUS 2', GOLD)
  );

  await until(S(47));
  await play(
    new M.Indicate(circleB, { color: C.cyan }),
    ...fbox(['Same rule, two views:', ['In (u², v²): straight line', C.green], ['In (u, v)  : curved circle', GOLD]], C.cyan),
    ...say('STRAIGHT THERE = CURVED HERE', C.cyan)
  );

  // Beat 48: SVM curved margin rings
  const innerMargin = new M.Circle({ radius: 1.65 * U, color: C.green, strokeWidth: 1.8 });
  innerMargin.setFill(C.green, 0);
  innerMargin.setStrokeOpacity(0.65);
  innerMargin.moveTo(xy(4, 3));
  const outerMargin = new M.Circle({ radius: 2.35 * U, color: C.green, strokeWidth: 1.8 });
  outerMargin.setFill(C.green, 0);
  outerMargin.setStrokeOpacity(0.65);
  outerMargin.moveTo(xy(4, 3));

  await until(S(48));
  await play(
    new M.Create(innerMargin), new M.Create(outerMargin),
    ...fbox(['What it is for:', ['Support Vector Machines', C.green], 'find curved boundaries fast'], C.green),
    ...say('USEFUL FOR SUPPORT VECTOR MACHINES', C.green)
  );

  // =========================================================================
  // BEAT 49: Common trap — not a probability; opposite patterns look similar
  // =========================================================================
  const oppDot = fruitGlyph('apple', xy(2, 5));
  const oppLbl = txt('(−2, 2)', 14, C.pink, [X(2) - 0.10, Y(5) + 0.34, 0], true, true);
  const a3Coord2 = txt('(2, −2)', 14, APPLE, [X(6) + 0.50, Y(1) - 0.25, 0], true, true);
  const vecA3 = arrow(xy(4, 3), xy(6, 1), APPLE, 2.6, 0.13);
  const vecOpp = arrow(xy(4, 3), xy(2, 5), C.pink, 2.6, 0.13);
  const oppTag1 = pill('dot = −4 → 16', APPLE, 13);
  oppTag1.moveTo([X(6.1), Y(2.15), 0]);
  const oppTag2 = pill('dot = +4 → 16', C.pink, 13);
  oppTag2.moveTo([X(2.0), Y(6.05), 0]);

  await until(S(49));
  await play(
    ...fadeOutList([circleB, radArr, radTxt, innerMargin, outerMargin]),
    new M.FadeIn(oppDot), new M.FadeIn(oppLbl), new M.FadeIn(a3Coord2),
    new M.FadeIn(vecA3), new M.FadeIn(vecOpp),
    new M.FadeIn(oppTag1), new M.FadeIn(oppTag2),
    ...fbox([
      ['Watch out:', C.pink],
      'not a probability!',
      ['(−4)² = 16  and  (+4)² = 16', C.pink],
    ], C.pink),
    ...say('TRAP: OPPOSITES GIVE SAME SCORE', C.pink)
  );

  // =========================================================================
  // BEATS 50–54: Try it preview + final recap
  // =========================================================================
  const dragQ = unknownGlyph(xy(5, 5));
  const dragArrow = arrow(xy(3, 4), xy(5, 5), C.cyan, 2.6, 0.13);

  await until(S(50));
  await play(
    ...fadeOutList([oppDot, oppLbl, vecA3, vecOpp, oppTag1, oppTag2]),
    new M.FadeIn(dragArrow), new M.FadeIn(dragQ),
    ...fbox([
      ['Try it: drag any fruit', C.cyan],
      '2-num dot   updates live',
      '4-num dot   updates live',
      '(a · b)²    always matches',
    ], C.cyan),
    ...say('TRY IT: DRAG THE FRUITS', C.cyan)
  );

  const g1Ring = ring(xy(6, 1), GOLD);
  const g1Line = ln(xy(3, 4), xy(6, 1), GOLD, 3.0);

  await until(S(51));
  await play(
    ...fadeOutList([dragArrow, dragQ]),
    new M.FadeIn(g1Ring), new M.Create(g1Line),
    ...fbox([
      ['Try it goal 1:', GOLD],
      'Original positions:',
      ['K(?, A3) = (−4)² = 16  ✓', C.green],
    ], GOLD),
    ...say('GOAL 1: KERNEL WITH APPLE = 16', GOLD)
  );

  const oppDot2 = fruitGlyph('apple', xy(2, 5));
  const vecA3b = arrow(xy(4, 3), xy(6, 1), APPLE, 2.4, 0.12);
  const vecOppb = arrow(xy(4, 3), xy(2, 5), C.pink, 2.4, 0.12);

  await until(S(52));
  await play(
    ...fadeOutList([g1Ring, g1Line]),
    new M.FadeIn(oppDot2), new M.FadeIn(vecA3b), new M.FadeIn(vecOppb),
    ...fbox([
      ['Try it goal 2:', C.pink],
      'Opposite dot products:',
      ['−4 and +4  →  both give 16', C.pink],
    ], C.pink),
    ...say('GOAL 2: OPPOSITE DOTS, SAME SQUARE', C.pink)
  );

  const circleFinal = new M.Circle({ radius: 2 * U, color: C.green, strokeWidth: 3.2 });
  circleFinal.setFill(C.green, 0.12);
  circleFinal.moveTo(xy(4, 3));

  await until(S(53));
  await play(
    ...fadeOutList([oppDot2, vecA3b, vecOppb]),
    new M.Create(circleFinal, { runTime: 1.0 }),
    ...fbox([
      ['Try it goal 3:', C.green],
      'Press New data',
      'Test shortcut & curved boundary',
    ], C.green),
    ...say('PRESS NEW DATA & EXPLORE CURVES', C.green)
  );

  await until(S(54));
  await play(
    new M.Indicate(circleFinal, { color: GOLD }),
    ...fbox([
      ['REMEMBER: THE KERNEL TRICK', C.green],
      ['K(a, b) = (a · b)²', GOLD],
      'Richer patterns, shortcut math',
    ], C.green),
    ...say('RICHER DESCRIPTIONS WITHOUT EXTRA LISTS', C.green)
  );
}
