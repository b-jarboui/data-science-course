// 10.2.11 Robust regression: limit the pull of a high rent (Huber loss, iterative rounds).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // Shared chapter 10.2 data (60 m^2 Cedar apartments: I, J, K, L, M)
  const RENTS = [1320, 1400, 1400, 1480, 1800];
  const LIMIT = 120;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 1.78, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 3.22, 0] : [4.58, -0.55, 0];
  const LINE_Y = P ? -0.10 : 0.42;
  const X0 = P ? -3.35 : -6.25, X1 = P ? 3.35 : 2.05;
  const VMIN = 1250, VMAX = 1850;
  const n2x = v => X0 + (v - VMIN) / (VMAX - VMIN) * (X1 - X0);
  const dxPer$ = (X1 - X0) / (VMAX - VMIN);

  // Lower chart rectangle (used for Huber shape, then Loss-by-round)
  const CX0 = P ? -2.65 : -5.45, CX1 = P ? 3.05 : 1.65;
  const CY0 = P ? -4.85 : -2.65, CY1 = P ? -2.35 : -1.10;
  const CHART_TITLE_Y = P ? -2.02 : -0.88;

  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Single formula box (replaces any previous box)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 18, lh = P ? 0.37 : 0.37;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.85 : 4.15;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // Helper: crisp horizontal arrow built from Line segments
  function hArrow(x1, x2, y, color, sw = 3.5) {
    if (Math.abs(x2 - x1) < 0.04) {
      const d = new M.Dot({ point: [x1, y, 0], radius: 0.06, color });
      return new M.VGroup(d);
    }
    const dir = x2 > x1 ? 1 : -1;
    const ah = Math.min(0.16, Math.abs(x2 - x1) * 0.45);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const h1 = new M.Line({ start: [x2, y, 0], end: [x2 - dir * ah, y + ah * 0.65, 0], color, strokeWidth: sw });
    const h2 = new M.Line({ start: [x2, y, 0], end: [x2 - dir * ah, y - ah * 0.65, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, h1, h2);
  }

  // Helper: marker parts at a dollar guess
  const M_TOP = LINE_Y + (P ? 0.90 : 0.78);
  const M_TAG_Y = LINE_Y + (P ? 1.18 : 1.04);
  const mkMarkerLine = (v, col = C.amber) =>
    new M.Line({ start: [n2x(v), LINE_Y - 0.04, 0], end: [n2x(v), M_TOP, 0], color: col, strokeWidth: 3.5 });
  const mkMarkerDot = (v, col = C.amber) =>
    new M.Dot({ point: [n2x(v), LINE_Y, 0], radius: 0.12, color: col });
  function mkMarkerTag(v, col = C.amber, suffix = '') {
    const txt = `$${v.toLocaleString('en-US')}${suffix}`;
    const t = T(txt, P ? 15 : 16, col, true, true);
    const w = t.getWidth() + 0.28, h = 0.34;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(C.bg, 0.95);
    const x = Math.max(X0 + w / 2, Math.min(X1 - w / 2, n2x(v)));
    r.moveTo([x, M_TAG_Y, 0]);
    t.moveTo([x, M_TAG_Y, 0]);
    return new M.VGroup(r, t);
  }

  // Helper: ±120 limit gates around a guess
  function mkGates(v) {
    const xl = n2x(v - LIMIT), xr = n2x(v + LIMIT);
    const y0 = LINE_Y - 0.06, y1 = LINE_Y + (P ? 0.72 : 0.64);
    const gl = new M.DashedLine({ start: [xl, y0, 0], end: [xl, y1, 0], color: C.violet });
    const gr = new M.DashedLine({ start: [xr, y0, 0], end: [xr, y1, 0], color: C.violet });
    return [gl, gr];
  }
  function mkGateLabs(v) {
    const xl = n2x(v - LIMIT), xr = n2x(v + LIMIT);
    const y = M_TAG_Y;
    const tl = T('−120', P ? 12 : 13, C.violet, true); tl.moveTo([xl, y, 0]);
    const tr = T('+120', P ? 12 : 13, C.violet, true); tr.moveTo([xr, y, 0]);
    return new M.VGroup(tl, tr);
  }

  // Helper: labeled pull arrow at a given y row (scaled cleanly so -280 fits on screen)
  const PULL_Y = LINE_Y - (P ? 0.84 : 0.64);
  const NET_Y = LINE_Y - (P ? 1.30 : 0.96);
  const PULL_SCALE = (P ? 0.60 : 0.64) * dxPer$;
  function mkPullArrow(guessVal, pullDollars, y, color, text, sw = 3.5) {
    const x1 = n2x(guessVal);
    const x2 = Math.max(X0 + 0.15, Math.min(X1 - 0.15, x1 + pullDollars * PULL_SCALE));
    const arr = hArrow(x1, x2, y, color, sw);
    const lab = T(text, P ? 14 : 15, color, true, true);
    const dir = pullDollars >= 0 ? 1 : -1;
    let lx = x2 + dir * (lab.getWidth() / 2 + 0.14);
    let ly = y;
    if (lx - lab.getWidth() / 2 < X0 - 0.15 || lx + lab.getWidth() / 2 > X1 + 0.15) {
      lx = (x1 + x2) / 2;
      ly = y - (P ? 0.24 : 0.20);
    }
    lab.moveTo([lx, ly, 0]);
    return new M.VGroup(arr, lab);
  }

  // --- Beats 0-1: Five equal-size apartment cards ---
  const cardNames = ['I', 'J', 'K', 'L', 'M'];
  const cards = cardNames.map((name, k) => {
    const isHigh = k === 4;
    const col = isHigh ? C.pink : C.cyan;
    const sp = P ? 1.35 : 2.15;
    const x = (k - 2) * sp, y = P ? -0.3 : -0.1;
    const cw = P ? 1.12 : 1.72, ch = P ? 1.65 : 2.15;
    const box = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.14, color: col, strokeWidth: isHigh ? 3.5 : 2 });
    box.setFill(C.card, 0.95); box.moveTo([x, y, 0]);
    const wins = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const w = new M.Rectangle({ width: cw * 0.24, height: ch * 0.14, color: col, strokeWidth: 1.2 });
      w.setFill(col, isHigh ? 0.35 : 0.22);
      w.moveTo([x + (c - 0.5) * cw * 0.42, y + ch * 0.14 - r * ch * 0.24, 0]);
      wins.push(w);
    }
    const id = T(name, P ? 18 : 22, col, true, true); id.moveTo([x, y + ch * 0.36, 0]);
    const sz = T('60 m²', P ? 13 : 15, C.muted, true); sz.moveTo([x, y - ch * 0.34, 0]);
    return new M.VGroup(box, ...wins, id, sz);
  });

  await until(S(0));
  await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('5 APARTMENTS · SAME SIZE (60 m²)', C.cyan));

  await until(S(1));
  await play(new M.Indicate(cards[4], { color: C.pink, runTime: 1.0 }),
    new M.Flash(cards[4], { color: C.pink, flashRadius: 0.6, runTime: 0.9 }),
    ...say('CAN ONE HIGH RENT PULL TOO FAR?', C.pink));

  // --- Beat 2: Number line marked in dollars ---
  const line = new M.Line({ start: [X0, LINE_Y, 0], end: [X1, LINE_Y, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = [1300, 1400, 1500, 1600, 1700, 1800];
  const ticks = tickVals.map(v => {
    const x = n2x(v);
    const tk = new M.Line({ start: [x, LINE_Y - 0.08, 0], end: [x, LINE_Y + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(v), P ? 13 : 15, C.muted, true); lb.moveTo([x, LINE_Y - (P ? 0.30 : 0.26), 0]);
    return new M.VGroup(tk, lb);
  });
  const unit = T('dollars ($)', P ? 13 : 14, C.muted);
  unit.moveTo([X1 - (P ? 0.45 : 0.55), LINE_Y - (P ? 0.56 : 0.48), 0]);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...cards), { runTime: 0.5 }),
    new M.Create(line, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...ticks, unit), { runTime: 0.7 }),
    ...say('FIVE ASKING RENTS ($)', C.cyan)
  );

  // --- Beats 3-6: Plot the four regular rents and the fifth high rent ---
  const dotY = LINE_Y + (P ? 0.27 : 0.24);
  const stackY = dotY + (P ? 0.28 : 0.25);
  function mkDot(v, y, col, ring = false) {
    const p = [n2x(v), y, 0];
    const halo = new M.Dot({ point: p, radius: 0.22, color: col }); halo.setFill(col, 0.18);
    const core = new M.Dot({ point: p, radius: 0.10, color: col });
    const parts = [halo, core];
    if (ring) {
      const r = new M.Circle({ radius: 0.17, color: C.pink, strokeWidth: 2.5 }); r.moveTo(p);
      parts.push(r);
    }
    return { g: new M.VGroup(...parts), core };
  }
  const dI = mkDot(1320, dotY, C.cyan);
  const dJ = mkDot(1400, dotY, C.cyan);
  const dK = mkDot(1400, stackY, C.cyan);
  const dL = mkDot(1480, dotY, C.cyan);
  const dM = mkDot(1800, dotY, C.pink, true);

  const clusterBox = new M.RoundedRectangle({
    width: n2x(1480) - n2x(1320) + 0.62,
    height: (P ? 0.88 : 0.76),
    cornerRadius: 0.12, color: C.cyan, strokeWidth: 2
  });
  clusterBox.moveTo([(n2x(1320) + n2x(1480)) / 2, dotY + (P ? 0.14 : 0.12), 0]);

  await until(S(3));
  await play(
    new M.LaggedStart([dI.g, dJ.g, dK.g, dL.g].map(g => new M.FadeIn(g)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.Create(clusterBox, { runTime: 0.8 }),
    ...say('FOUR REGULAR RENTS: CLOSE TOGETHER', C.cyan)
  );

  const labI = T('1,320', P ? 13 : 15, C.cyan, true); labI.moveTo([n2x(1320), dotY + (P ? 0.30 : 0.27), 0]);
  const labJK = T('1,400 (×2)', P ? 13 : 15, C.cyan, true); labJK.moveTo([n2x(1400) + 0.12 - labJK.getWidth() / 2, stackY + (P ? 0.28 : 0.25), 0]);  // ends left of the marker at 1,430
  await until(S(4));
  await play(
    new M.FadeOut(clusterBox, { runTime: 0.4 }),
    new M.FadeIn(labI, { runTime: 0.6 }),
    new M.FadeIn(labJK, { runTime: 0.6 }),
    new M.Flash(dI.core, { color: C.cyan, runTime: 0.7 }),
    new M.Flash(dK.core, { color: C.cyan, runTime: 0.7 }),
    ...say('1,320 · 1,400 · 1,400', C.cyan)
  );

  const labL = T('1,480', P ? 13 : 15, C.cyan, true); labL.moveTo([n2x(1480) + 0.12 + labL.getWidth() / 2, dotY + (P ? 0.30 : 0.27), 0]);
  await until(S(5));
  await play(
    new M.FadeIn(labL, { runTime: 0.6 }),
    new M.Flash(dL.core, { color: C.cyan, runTime: 0.7 }),
    ...say('FOURTH REGULAR RENT: $1,480', C.cyan)
  );

  const labM = T('M: $1,800', P ? 14 : 16, C.pink, true, true); labM.moveTo([n2x(1800), dotY + (P ? 0.32 : 0.29), 0]);
  await until(S(6));
  await play(
    new M.FadeIn(dM.g, { runTime: 0.6 }),
    new M.FadeIn(labM, { runTime: 0.6 }),
    new M.Flash(dM.core, { color: C.pink, flashRadius: 0.3, runTime: 0.8 }),
    ...say('FIFTH RENT (M): $1,800', C.pink)
  );

  // --- Beats 7-10: Average at 1,480, squared gaps, pulls ---
  const mLine = mkMarkerLine(1480, C.amber);
  const mDot = mkMarkerDot(1480, C.amber);
  let mTag = mkMarkerTag(1480, C.amber);

  await until(S(7));
  await play(
    new M.Create(mLine, { runTime: 0.6 }),
    new M.FadeIn(mDot, { runTime: 0.6 }),
    new M.FadeIn(mTag, { runTime: 0.6 }),
    ...fbox([
      ['average of all 5 rents', C.muted],
      '7,400 ÷ 5 = $1,480',
      ['marker starts at $1,480', C.amber]
    ], C.amber),
    ...say('AVERAGE OF ALL FIVE = $1,480', C.amber)
  );

  // Gap segments from 1480 to each rent
  const gI = new M.Line({ start: [n2x(1480), dotY, 0], end: [n2x(1320), dotY, 0], color: C.cyan, strokeWidth: 2.5 });
  const gK = new M.Line({ start: [n2x(1480), stackY, 0], end: [n2x(1400), stackY, 0], color: C.cyan, strokeWidth: 2.5 });
  const gM = new M.Line({ start: [n2x(1480), dotY, 0], end: [n2x(1800), dotY, 0], color: C.pink, strokeWidth: 3.5 });
  const gMLab = T('+320 gap', P ? 14 : 15, C.pink, true);
  gMLab.moveTo([(n2x(1480) + n2x(1800)) / 2, dotY + 0.22, 0]);
  const gapGroup = new M.VGroup(gI, gK, gM, gMLab);

  await until(S(8));
  await play(
    new M.FadeIn(gapGroup, { runTime: 0.7 }),
    ...say('AVERAGE MINIMIZES SQUARED GAPS', C.amber)
  );

  await until(S(9));
  await play(
    ...fbox([
      ['squared gap = gap × gap', C.ink],
      '  80 × 80   =   6,400',
      [' 320 × 320  = 102,400', C.pink]
    ], C.pink),
    ...say('SQUARED GAP = GAP × GAP', C.pink)
  );

  // Pull arrows from marker toward regular rents (left) and M (right)
  const rawLeft = hArrow(n2x(1480), n2x(1320), PULL_Y, C.cyan, 3.5);
  const rawRight = hArrow(n2x(1480), n2x(1800), PULL_Y, C.pink, 4.5);
  const rawPullLab = T('huge pull (+320)', P ? 13 : 14, C.pink, true);
  rawPullLab.moveTo([(n2x(1480) + n2x(1800)) / 2, PULL_Y - (P ? 0.24 : 0.20), 0]);
  const rawPulls = new M.VGroup(rawLeft, rawRight, rawPullLab);

  await until(S(10));
  await play(
    new M.FadeOut(gapGroup, { runTime: 0.4 }),
    new M.FadeIn(rawPulls, { runTime: 0.7 }),
    ...say('EACH LISTING PULLS THE MARKER', C.cyan)
  );

  // --- Beats 11-14: The cap handle at ±120 ---
  let [gateL, gateR] = mkGates(1480);
  await until(S(11));
  await play(
    new M.Create(gateL, { runTime: 0.6 }),
    new M.Create(gateR, { runTime: 0.6 }),
    ...say('A HANDLE LIMITS EACH PULL', C.violet)
  );

  let gateLabs = mkGateLabs(1480);
  await until(S(12));
  await play(
    new M.FadeIn(gateLabs, { runTime: 0.6 }),
    ...fbox([
      ['pull limit = $120', C.violet],
      'marks at −120 and +120'
    ], C.violet),
    ...say('SET THE LIMIT AT $120 OF GAP', C.violet)
  );

  const insideBand = new M.Rectangle({
    width: n2x(1480 + LIMIT) - n2x(1480 - LIMIT),
    height: (P ? 0.74 : 0.66),
    color: C.cyan, strokeWidth: 0
  });
  insideBand.setFill(C.cyan, 0.14);
  insideBand.moveTo([n2x(1480), LINE_Y + (P ? 0.34 : 0.30), 0]);

  await until(S(13));
  await play(
    new M.FadeIn(insideBand, { runTime: 0.6 }),
    ...fbox([
      ['pull limit = $120', C.violet],
      ['gap ≤ 120: full gap pull', C.cyan]
    ], C.cyan),
    ...say('UP TO $120: PULL BY FULL GAP', C.cyan)
  );

  const capLeft = hArrow(n2x(1480), n2x(1480 - LIMIT), PULL_Y, C.cyan, 3.5);
  const capRight = hArrow(n2x(1480), n2x(1480 + LIMIT), PULL_Y, C.pink, 4);
  const capTag = T('capped at +120', P ? 13 : 14, C.violet, true, true);
  capTag.moveTo([n2x(1480 + LIMIT) + (P ? 0.1 : 0.2), PULL_Y - (P ? 0.25 : 0.20), 0]);
  const capArrows = new M.VGroup(capLeft, capRight, capTag);

  await until(S(14));
  await play(
    new M.FadeOut(rawPulls, { runTime: 0.4 }),
    new M.FadeIn(capArrows, { runTime: 0.7 }),
    ...fbox([
      ['gap ≤ 120: pull = full gap', C.cyan],
      ['gap > 120: pull stays 120', C.pink]
    ], C.violet),
    ...say('BEYOND $120: PULL STAYS AT 120', C.pink)
  );

  // --- Beats 15-19: Huber loss curve in lower chart ---
  const hx = g => CX0 + (g / 360) * (CX1 - CX0);
  const hy = loss => CY0 + (loss / 40000) * (CY1 - CY0);
  const hAxisX = new M.Line({ start: [CX0, CY0, 0], end: [CX1, CY0, 0], color: C.muted, strokeWidth: 2 });
  const hAxisY = new M.Line({ start: [CX0, CY0, 0], end: [CX0, CY1, 0], color: C.muted, strokeWidth: 2 });
  const hTicks = [0, 120, 240, 360].map(g => {
    const x = hx(g);
    const tk = new M.Line({ start: [x, CY0 - 0.06, 0], end: [x, CY0 + 0.06, 0], color: g === 120 ? C.violet : C.muted });
    const lb = T(String(g), P ? 12 : 13, g === 120 ? C.violet : C.muted, true);
    lb.moveTo([x, CY0 - (P ? 0.26 : 0.21), 0]);
    return new M.VGroup(tk, lb);
  });
  const hYTicks = [[0, '0'], [20000, '20k'], [40000, '40k']].map(([v, s]) => {
    const y = hy(v);
    const lb = T(s, P ? 12 : 13, C.muted, true); lb.moveTo([CX0 - (P ? 0.36 : 0.38), y, 0]);
    return lb;
  });
  const hXLab = T('gap ($)', P ? 12 : 13, C.muted); hXLab.moveTo([(CX0 + CX1) / 2, CY0 - (P ? 0.50 : 0.40), 0]);
  const hTitle = T('Loss for one listing', P ? 15 : 16, C.amber, false, true);
  hTitle.moveTo([(CX0 + CX1) / 2, CHART_TITLE_Y, 0]);
  const hAxes = new M.VGroup(hAxisX, hAxisY, ...hTicks, ...hYTicks, hXLab, hTitle);

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(insideBand, capArrows), { runTime: 0.45 }),
    new M.FadeIn(hAxes, { runTime: 0.7 }),
    ...say('LOSS = SCORE TO MAKE SMALL', C.amber)
  );

  await until(S(16));
  await play(
    ...fbox([
      ['total loss = sum of all 5', C.amber],
      'loss(I)+loss(J)+loss(K)',
      '  +loss(L)+loss(M)'
    ], C.amber),
    ...say('ADD EACH LOSS FOR TOTAL LOSS', C.amber)
  );

  // Quadratic portion: 0 to 120
  const qSegs = [];
  for (let i = 0; i < 12; i++) {
    const g1 = i * 10, g2 = (i + 1) * 10;
    qSegs.push(new M.Line({ start: [hx(g1), hy(0.5 * g1 * g1), 0], end: [hx(g2), hy(0.5 * g2 * g2), 0], color: C.cyan, strokeWidth: 4 }));
  }
  const hQuad = new M.VGroup(...qSegs);
  const hLimLine = new M.DashedLine({ start: [hx(120), CY0, 0], end: [hx(120), CY1, 0], color: C.violet });
  const hLimDot = new M.Dot({ point: [hx(120), hy(7200), 0], radius: 0.08, color: C.violet });

  await until(S(17));
  await play(
    new M.Create(hLimLine, { runTime: 0.5 }),
    new M.Create(hQuad, { runTime: 0.8 }),
    new M.FadeIn(hLimDot, { runTime: 0.5 }),
    ...fbox([
      ['within limit (gap ≤ 120):', C.cyan],
      'loss = ½ × gap × gap'
    ], C.cyan),
    ...say('INSIDE $120: HALF SQUARED GAP', C.cyan)
  );

  // Linear portion: 120 to 360 + faint squared comparison
  const hLin = new M.Line({ start: [hx(120), hy(7200), 0], end: [hx(360), hy(36000), 0], color: C.violet, strokeWidth: 4 });
  const sqSegs = [];
  for (let i = 0; i < 8; i++) {
    const g1 = 120 + i * 20, g2 = g1 + 20;
    const l = new M.Line({ start: [hx(g1), hy(0.5 * g1 * g1), 0], end: [hx(g2), hy(0.5 * g2 * g2), 0], color: C.pink, strokeWidth: 2 });
    l.setStrokeOpacity(0.45);
    sqSegs.push(l);
  }
  const hSqDash = new M.VGroup(...sqSegs);
  const hSqLab = T('squared', P ? 12 : 13, C.pink); hSqLab.moveTo([hx(245), hy(38000), 0]);

  await until(S(18));
  await play(
    new M.Create(hLin, { runTime: 0.8 }),
    new M.FadeIn(hSqDash, { runTime: 0.6 }),
    new M.FadeIn(hSqLab, { runTime: 0.6 }),
    ...fbox([
      ['gap ≤ 120: ½ × gap²', C.cyan],
      ['gap > 120: +120 per extra $', C.violet]
    ], C.violet),
    ...say('BEYOND $120: FIXED STEP PER DOLLAR', C.violet)
  );

  const hName = T('Huber loss', P ? 15 : 16, C.green, true, true);
  hName.moveTo([hx(280), hy(22000), 0]);
  await until(S(19));
  await play(
    new M.FadeIn(hName, { runTime: 0.6 }),
    new M.Indicate(hLin, { color: C.green, runTime: 0.8 }),
    ...say('HUBER LOSS', C.green)
  );

  // --- Beats 20-38: Iterative rounds + growing Loss-by-round chart ---
  const rx = r => CX0 + 0.35 + (r / 3) * (CX1 - CX0 - 0.75);
  const ry = loss => CY0 + (loss - 44800) / (50400 - 44800) * (CY1 - CY0);
  const lAxisX = new M.Line({ start: [CX0, CY0, 0], end: [CX1, CY0, 0], color: C.muted, strokeWidth: 2 });
  const lAxisY = new M.Line({ start: [CX0, CY0, 0], end: [CX0, CY1, 0], color: C.muted, strokeWidth: 2 });
  const lXTicks = [0, 1, 2, 3].map(r => {
    const x = rx(r);
    const tk = new M.Line({ start: [x, CY0 - 0.06, 0], end: [x, CY0 + 0.06, 0], color: C.muted });
    const lb = T(`R${r}`, P ? 12 : 13, C.muted, true); lb.moveTo([x, CY0 - (P ? 0.25 : 0.21), 0]);
    return new M.VGroup(tk, lb);
  });
  const lYTicks = [[45000, '45k'], [47500, '47.5k'], [50000, '50k']].map(([v, s]) => {
    const y = ry(v);
    const gLine = new M.Line({ start: [CX0, y, 0], end: [CX1, y, 0], color: C.line, strokeWidth: 1 });
    gLine.setStrokeOpacity(0.45);
    const lb = T(s, P ? 11 : 12, C.muted, true); lb.moveTo([CX0 - (P ? 0.42 : 0.44), y, 0]);
    return new M.VGroup(gLine, lb);
  });
  const lTitle = T('Total Huber loss by round', P ? 15 : 16, C.amber, false, true);
  lTitle.moveTo([(CX0 + CX1) / 2, CHART_TITLE_Y, 0]);
  const lAxes = new M.VGroup(lAxisX, lAxisY, ...lXTicks, ...lYTicks, lTitle);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(hAxes, hQuad, hLimLine, hLimDot, hLin, hSqDash, hSqLab, hName), { runTime: 0.45 }),
    new M.FadeIn(lAxes, { runTime: 0.7 }),
    ...say('MOVE THE MARKER IN ROUNDS', C.amber)
  );

  // Round 0: guess = 1,480, loss = 49,600
  const r0Pt = [rx(0), ry(49600), 0];
  const r0Dot = new M.Dot({ point: r0Pt, radius: 0.10, color: C.amber });
  const r0Lab = T('49,600', P ? 13 : 14, C.amber, true, true);
  r0Lab.moveTo([r0Pt[0] + 0.56, r0Pt[1] + 0.04, 0]);

  await until(S(21));
  await play(
    new M.FadeIn(r0Dot, { runTime: 0.5 }),
    new M.FadeIn(r0Lab, { runTime: 0.5 }),
    new M.Flash(r0Dot, { color: C.amber, runTime: 0.7 }),
    ...fbox([
      ['Round 0 · guess = $1,480', C.amber],
      ['total loss = 49,600', C.ink]
    ], C.amber),
    ...say('ROUND 0: $1,480 → LOSS 49,600', C.amber)
  );

  // Beat 22: high listing is +320 right
  const mGap0Line = hArrow(n2x(1480), n2x(1800), PULL_Y, C.pink, 3.5);
  const mGap0Lab = T('+320 right', P ? 14 : 15, C.pink, true, true);
  mGap0Lab.moveTo([(n2x(1480) + n2x(1800)) / 2, PULL_Y - (P ? 0.25 : 0.20), 0]);
  const mGap0 = new M.VGroup(mGap0Line, mGap0Lab);

  await until(S(22));
  await play(
    new M.FadeIn(mGap0, { runTime: 0.65 }),
    new M.Indicate(dM.g, { color: C.pink, runTime: 0.7 }),
    ...say('HIGH LISTING: +$320 RIGHT', C.pink)
  );

  // Beat 23: cap cuts its pull to +120
  const r0High = mkPullArrow(1480, 120, PULL_Y, C.pink, '+120', 4);
  await until(S(23));
  await play(
    new M.FadeOut(mGap0, { runTime: 0.4 }),
    new M.FadeIn(r0High, { runTime: 0.6 }),
    ...fbox([
      ['Round 0 · guess = $1,480', C.amber],
      ['high gap +320 → cap +120', C.pink]
    ], C.pink),
    ...say('CAP CUTS PULL TO +$120 RIGHT', C.pink)
  );

  // Beat 24: four regular pulls add to -280 left
  const r0Reg = mkPullArrow(1480, -280, PULL_Y, C.cyan, '−280', 4);
  await until(S(24));
  await play(
    new M.FadeIn(r0Reg, { runTime: 0.65 }),
    ...fbox([
      ['Round 0 · guess = $1,480', C.amber],
      ['regular: −120−80−80+0 = −280', C.cyan],
      ['high M:  +120 (capped)', C.pink]
    ], C.cyan),
    ...say('FOUR REGULAR PULLS: −$280 LEFT', C.cyan)
  );

  // Beat 25: combined pull = -160 left
  const r0Net = mkPullArrow(1480, -160, NET_Y, C.amber, 'net −160', 4.5);
  await until(S(25));
  await play(
    new M.FadeIn(r0Net, { runTime: 0.65 }),
    ...fbox([
      ['Round 0 · guess = $1,480', C.amber],
      'regular −280   high +120',
      ['combined = −160 (left)', C.amber]
    ], C.amber),
    ...say('COMBINED PULL: $160 LEFT', C.amber)
  );

  // Beat 26: move by one quarter
  await until(S(26));
  await play(
    ...fbox([
      ['combined pull = −160', C.ink],
      ['step = ¼ × (−160) = −40', C.green]
    ], C.green),
    ...say('MOVE BY ¼ OF COMBINED PULL', C.green)
  );

  // Beat 27: move marker -40 left to 1,440
  const mTag1440 = mkMarkerTag(1440, C.amber);
  const [gateL1, gateR1] = mkGates(1440);
  const gateLabs1 = mkGateLabs(1440);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(r0High, r0Reg, r0Net, gateL, gateR, gateLabs), { runTime: 0.4 }),
    new M.Transform(mLine, mkMarkerLine(1440, C.amber), { runTime: 1.1 }),
    new M.Transform(mDot, mkMarkerDot(1440, C.amber), { runTime: 1.1 }),
    new M.FadeOut(mTag, { runTime: 0.4 }),
    new M.FadeIn(mTag1440, { runTime: 0.8 }),
    new M.FadeIn(gateL1, { runTime: 0.7 }),
    new M.FadeIn(gateR1, { runTime: 0.7 }),
    new M.FadeIn(gateLabs1, { runTime: 0.7 }),
    ...fbox([
      ['Round 1 · move −$40 left', C.green],
      ['1,480 − 40 = $1,440', C.amber]
    ], C.amber),
    ...say('MOVE −$40 → NEW GUESS: $1,440', C.amber)
  );
  mTag = mTag1440; gateL = gateL1; gateR = gateR1; gateLabs = gateLabs1;

  // Beat 28: loss drops to 45,600
  const r1Pt = [rx(1), ry(45600), 0];
  const r01Seg = new M.Line({ start: r0Pt, end: r1Pt, color: C.green, strokeWidth: 3.5 });
  const r1Dot = new M.Dot({ point: r1Pt, radius: 0.10, color: C.green });
  const r1Lab = T('45,600', P ? 13 : 14, C.green, true, true);
  r1Lab.moveTo([r1Pt[0] + 0.10, r1Pt[1] + (P ? 0.30 : 0.25), 0]);

  await until(S(28));
  await play(
    new M.Create(r01Seg, { runTime: 0.7 }),
    new M.FadeIn(r1Dot, { runTime: 0.5 }),
    new M.FadeIn(r1Lab, { runTime: 0.5 }),
    new M.Flash(r1Dot, { color: C.green, runTime: 0.7 }),
    ...fbox([
      ['Round 1 · guess = $1,440', C.amber],
      ['loss: 49,600 → 45,600', C.green]
    ], C.green),
    ...say('LOSS DROPS TO 45,600', C.green)
  );

  // Beat 29: round 1 regular pulls = -160 left
  const r1Reg = mkPullArrow(1440, -160, PULL_Y, C.cyan, '−160', 4);
  await until(S(29));
  await play(
    new M.FadeIn(r1Reg, { runTime: 0.65 }),
    ...fbox([
      ['Round 1 · guess = $1,440', C.amber],
      ['regular: −120−40−40+40 = −160', C.cyan]
    ], C.cyan),
    ...say('REGULAR PULLS: −$160 LEFT', C.cyan)
  );

  // Beat 30: high listing still pulls +120 right
  const r1High = mkPullArrow(1440, 120, PULL_Y, C.pink, '+120', 4);
  await until(S(30));
  await play(
    new M.FadeIn(r1High, { runTime: 0.6 }),
    ...fbox([
      ['Round 1 · guess = $1,440', C.amber],
      ['regular: −160', C.cyan],
      ['high M:  +120 (capped)', C.pink]
    ], C.pink),
    ...say('HIGH LISTING: +$120 RIGHT', C.pink)
  );

  // Beat 31: combined pull = -40 left
  const r1Net = mkPullArrow(1440, -40, NET_Y, C.amber, 'net −40', 4.5);
  await until(S(31));
  await play(
    new M.FadeIn(r1Net, { runTime: 0.6 }),
    ...fbox([
      ['Round 1 · guess = $1,440', C.amber],
      'combined = −160 + 120',
      ['         = −40 (left)', C.amber]
    ], C.amber),
    ...say('COMBINED PULL: $40 LEFT', C.amber)
  );

  // Beat 32: quarter again -> -10 left
  await until(S(32));
  await play(
    ...fbox([
      ['combined pull = −40', C.ink],
      ['step = ¼ × (−40) = −10', C.green]
    ], C.green),
    ...say('¼ OF −$40 = MOVE $10 LEFT', C.green)
  );

  // Beat 33: next guess = 1,430
  const mTag1430 = mkMarkerTag(1430, C.amber);
  const [gateL2, gateR2] = mkGates(1430);
  const gateLabs2 = mkGateLabs(1430);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(r1Reg, r1High, r1Net, gateL, gateR, gateLabs), { runTime: 0.4 }),
    new M.Transform(mLine, mkMarkerLine(1430, C.amber), { runTime: 0.9 }),
    new M.Transform(mDot, mkMarkerDot(1430, C.amber), { runTime: 0.9 }),
    new M.FadeOut(mTag, { runTime: 0.4 }),
    new M.FadeIn(mTag1430, { runTime: 0.7 }),
    new M.FadeIn(gateL2, { runTime: 0.6 }),
    new M.FadeIn(gateR2, { runTime: 0.6 }),
    new M.FadeIn(gateLabs2, { runTime: 0.6 }),
    ...fbox([
      ['Round 2 · move −$10 left', C.green],
      ['1,440 − 10 = $1,430', C.amber]
    ], C.amber),
    ...say('NEXT GUESS: $1,430', C.amber)
  );
  mTag = mTag1430; gateL = gateL2; gateR = gateR2; gateLabs = gateLabs2;

  // Beat 34: loss drops again to 45,400
  const r2Pt = [rx(2), ry(45400), 0];
  const r12Seg = new M.Line({ start: r1Pt, end: r2Pt, color: C.green, strokeWidth: 3.5 });
  const r2Dot = new M.Dot({ point: r2Pt, radius: 0.10, color: C.green });
  const r2Lab = T('45,400', P ? 13 : 14, C.green, true, true);
  r2Lab.moveTo([r2Pt[0], r2Pt[1] + (P ? 0.30 : 0.25), 0]);

  await until(S(34));
  await play(
    new M.Create(r12Seg, { runTime: 0.6 }),
    new M.FadeIn(r2Dot, { runTime: 0.5 }),
    new M.FadeIn(r2Lab, { runTime: 0.5 }),
    new M.Flash(r2Dot, { color: C.green, runTime: 0.7 }),
    ...fbox([
      ['Round 2 · guess = $1,430', C.amber],
      ['loss: 45,600 → 45,400', C.green]
    ], C.green),
    ...say('LOSS DROPS TO 45,400', C.green)
  );

  // Beat 35: round 2 regular pulls = -120 left
  const r2Reg = mkPullArrow(1430, -120, PULL_Y, C.cyan, '−120', 4);
  await until(S(35));
  await play(
    new M.FadeIn(r2Reg, { runTime: 0.6 }),
    ...fbox([
      ['Round 2 · guess = $1,430', C.amber],
      ['regular: −110−30−30+50 = −120', C.cyan]
    ], C.cyan),
    ...say('REGULAR PULLS: −$120 LEFT', C.cyan)
  );

  // Beat 36: high listing pulls +120 right
  const r2High = mkPullArrow(1430, 120, PULL_Y, C.pink, '+120', 4);
  await until(S(36));
  await play(
    new M.FadeIn(r2High, { runTime: 0.6 }),
    ...fbox([
      ['Round 2 · guess = $1,430', C.amber],
      ['regular: −120', C.cyan],
      ['high M:  +120 (capped)', C.pink]
    ], C.pink),
    ...say('HIGH LISTING: +$120 RIGHT', C.pink)
  );

  // Beat 37: pulls balance -> marker stays at 1,430
  const mTagDone = mkMarkerTag(1430, C.green);
  const r2Bal = T('−120 + 120 = 0  (balanced!)', P ? 14 : 15, C.green, true, true);
  r2Bal.moveTo([n2x(1430) + (P ? 0.35 : 0.4), NET_Y, 0]);

  await until(S(37));
  await play(
    new M.Transform(mLine, mkMarkerLine(1430, C.green), { runTime: 0.6 }),
    new M.Transform(mDot, mkMarkerDot(1430, C.green), { runTime: 0.6 }),
    new M.FadeOut(mTag, { runTime: 0.4 }),
    new M.FadeIn(mTagDone, { runTime: 0.6 }),
    new M.FadeIn(r2Bal, { runTime: 0.6 }),
    new M.Flash(mDot, { color: C.green, runTime: 0.7 }),
    ...fbox([
      ['combined = −120 + 120 = 0', C.green],
      ['settled at $1,430', C.green]
    ], C.green),
    ...say('PULLS BALANCE → STAYS AT $1,430', C.green)
  );
  mTag = mTagDone;

  // Beat 38: loss chart steps down then stays level
  const r3Pt = [rx(3), ry(45400), 0];
  const r23Seg = new M.Line({ start: r2Pt, end: r3Pt, color: C.green, strokeWidth: 3.5 });
  const r3Dot = new M.Dot({ point: r3Pt, radius: 0.10, color: C.green });
  const r3Lab = T('level', P ? 13 : 14, C.green, true, true);
  r3Lab.moveTo([r3Pt[0], r3Pt[1] + (P ? 0.30 : 0.25), 0]);

  await until(S(38));
  await play(
    new M.Create(r23Seg, { runTime: 0.6 }),
    new M.FadeIn(r3Dot, { runTime: 0.5 }),
    new M.FadeIn(r3Lab, { runTime: 0.5 }),
    new M.Flash(r3Dot, { color: C.green, runTime: 0.7 }),
    ...say('LOSS STEPS DOWN, THEN LEVELS OFF', C.green)
  );

  // --- Beats 39-42: Short Huber loss formula ---
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(r2Reg, r2High, r2Bal, gateL, gateR, gateLabs), { runTime: 0.5 }),
    ...say('THE HUBER LOSS RULE', C.cyan)
  );

  await until(S(40));
  await play(
    ...fbox([
      ['Huber loss (limit = 120):', C.muted],
      ['gap ≤ 120:  ½ × gap²', C.cyan]
    ], C.cyan),
    ...say('INSIDE LIMIT: ½ × GAP²', C.cyan)
  );

  await until(S(41));
  await play(
    ...fbox([
      ['Huber loss (limit = 120):', C.muted],
      ['gap ≤ 120:  ½ × gap²', C.cyan],
      ['gap > 120:  120 × (gap − 60)', C.violet]
    ], C.violet),
    ...say('OUTSIDE LIMIT: 120 × (GAP − 60)', C.violet)
  );

  // Beat 42: gap = distance in either direction
  const dLeft = hArrow(n2x(1430), n2x(1320), PULL_Y, C.amber, 3);
  const dRight = hArrow(n2x(1430), n2x(1800), PULL_Y, C.amber, 3);
  const dLab = T('gap = distance in $ (either side)', P ? 13 : 14, C.amber, true);
  dLab.moveTo([(n2x(1320) + n2x(1800)) / 2, NET_Y, 0]);
  const distMark = new M.VGroup(dLeft, dRight, dLab);

  await until(S(42));
  await play(
    new M.FadeIn(distMark, { runTime: 0.65 }),
    ...fbox([
      ['Huber loss (limit = 120):', C.muted],
      ['gap ≤ 120:  ½ × gap²', C.cyan],
      ['gap > 120:  120 × (gap − 60)', C.violet],
      ['gap = |rent − guess| ($)', C.amber]
    ], C.amber),
    ...say('GAP = DISTANCE IN EITHER DIRECTION', C.amber)
  );

  // --- Beats 43-46: Robust regression name, use, caution, recap ---
  const avgLine = new M.DashedLine({ start: [n2x(1480), LINE_Y - 0.06, 0], end: [n2x(1480), M_TOP - 0.12, 0], color: C.amber });
  const avgLab = T('avg $1,480', P ? 12 : 13, C.amber, true);
  avgLab.moveTo([n2x(1480) + 0.12 + avgLab.getWidth() / 2, M_TOP + 0.05, 0]);
  const avgRef = new M.VGroup(avgLine, avgLab);

  await until(S(43));
  await play(
    new M.FadeOut(distMark, { runTime: 0.4 }),
    new M.FadeIn(avgRef, { runTime: 0.65 }),
    ...say('ROBUST REGRESSION', C.green)
  );

  const brY = LINE_Y - (P ? 0.58 : 0.52);
  const mainBox = new M.VGroup(
    new M.Line({ start: [n2x(1320), brY, 0], end: [n2x(1480), brY, 0], color: C.green, strokeWidth: 3 }),
    new M.Line({ start: [n2x(1320), brY, 0], end: [n2x(1320), brY + 0.12, 0], color: C.green, strokeWidth: 3 }),
    new M.Line({ start: [n2x(1480), brY, 0], end: [n2x(1480), brY + 0.12, 0], color: C.green, strokeWidth: 3 }),
    T('main group', 15, C.green, true, true).moveTo([(n2x(1320) + n2x(1480)) / 2, brY - 0.24, 0])
  );

  await until(S(44));
  await play(
    new M.Create(mainBox, { runTime: 0.7 }),
    new M.Indicate(mTag, { color: C.green, runTime: 0.7 }),
    ...say('STAYS CLOSE TO THE MAIN GROUP', C.cyan)
  );

  await until(S(45));
  await play(
    new M.Indicate(dM.g, { color: C.pink, runTime: 0.8 }),
    new M.Flash(dM.core, { color: C.pink, runTime: 0.8 }),
    ...say('KEEP REAL DATA · LIMIT ITS PULL', C.pink)
  );

  await until(S(46));
  await play(
    new M.Indicate(mTag, { color: C.green, runTime: 0.8 }),
    ...fbox([
      ['Robust fit = $1,430', C.green],
      ['Average    = $1,480', C.amber],
      ['Huber caps large pulls', C.cyan]
    ], C.green),
    ...say('HUBER LOSS: LESS POWER FOR EXTREMES', C.green)
  );
}
