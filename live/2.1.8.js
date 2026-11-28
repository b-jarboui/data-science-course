// 2.1.8 Distribution shape: peaks, tails and skew.
// Beat i = sentence i (0-based, 62 sentences: 0..61). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Exact Saturday library visits from chapters/2.1.md (24 visits, sorted, with purpose colour)
  // borrow: cyan (7), computer: violet (5), study: amber (9), event: pink (3)
  const VISITS = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan], [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber], [60, C.amber], [60, C.amber], [75, C.amber],
    [85, C.pink], [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  const VALS = VISITS.map(v => v[0]);
  const VALS_100 = VALS.map((v, i) => i === 23 ? 100 : v);

  // 90-minute library film example (24 viewers: sum = 1800, mean = 75 min, median = 86 min)
  const FILM = [
    10, 20, 30, 45, 65, 70, 75, 80, 80, 84, 85, 86,
    86, 88, 88, 89, 89, 90, 90, 90, 90, 90, 90, 90,
  ];

  // Responsive layout constants (laptop: y in [-3.0, 2.3]; phone: y in [-5.5, 4.3])
  const PILL = P ? [0, 3.88, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.95, 0] : [0, -2.26, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Main distribution axis geometry
  const X0 = P ? -3.35 : -5.80;
  const X1 = P ? 3.45 : 6.00;
  const L0 = X1 - X0;
  const n2x = v => X0 + (v / 180) * L0;
  const f2x = v => X0 + (v / 100) * L0;
  const AXIS_Y = P ? -3.10 : -0.82;
  const CURVE_BASE = AXIS_Y;
  const CURVE_H = P ? 3.50 : 1.92;
  const DOT_Y = AXIS_Y + (P ? 0.22 : 0.20);
  const DOT_R = P ? 0.068 : 0.080;

  // One formula box at a time, never over the data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20;
    const lh = P ? 0.38 : 0.36;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 9.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Reusable helpers
  function makeHalo(p, col, r = DOT_R) {
    const h = new M.Dot({ point: p, radius: r * 2.15, color: col });
    h.setFill(col, 0.20);
    return h;
  }
  function makeDot(p, col, r = DOT_R) {
    const d = new M.Dot({ point: p, radius: r, color: col });
    d.setFill(col, 1);
    return d;
  }
  function glowDot(p, col, r = 0.09) {
    return new M.VGroup(makeHalo(p, col, r), makeDot(p, col, r));
  }
  function spanBar(x1, x2, y, col, label = '', above = true) {
    const ln = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color: col, strokeWidth: 2.5 });
    const t1 = new M.Line({ start: [x1, y - 0.08, 0], end: [x1, y + 0.08, 0], color: col, strokeWidth: 2.5 });
    const t2 = new M.Line({ start: [x2, y - 0.08, 0], end: [x2, y + 0.08, 0], color: col, strokeWidth: 2.5 });
    const parts = [ln, t1, t2];
    if (label) {
      const lb = T(label, P ? 15 : 16, col, true);
      lb.moveTo([(x1 + x2) / 2, y + (above ? 0.24 : -0.24), 0]);
      parts.push(lb);
    }
    return new M.VGroup(...parts);
  }
  function makeAxis(maxVal, step, mapX, y = AXIS_Y, unitTxt = 'minutes') {
    const ln = new M.Line({ start: [X0, y, 0], end: [X1, y, 0], color: C.muted, strokeWidth: 2.5 });
    const parts = [];
    for (let v = 0; v <= maxVal; v += step) {
      const tx = mapX(v);
      parts.push(
        new M.Line({ start: [tx, y - 0.08, 0], end: [tx, y + 0.08, 0], color: C.muted, strokeWidth: 2 }),
        T(String(v), P ? 15 : 16, C.muted, true).moveTo([tx, y - 0.28, 0])
      );
    }
    if (unitTxt) {
      const u = T(unitTxt, P ? 15 : 16, C.muted);
      u.moveTo([X1 - 0.35, y - (P ? 0.60 : 0.54), 0]);
      parts.push(u);
    }
    return { ln, ticks: new M.VGroup(...parts) };
  }

  // Smooth outline through the sampled heights.
  const CURVE_SEGS = 60;
  function evalKDE(vals, x, h, taperLeft = true, taperRightAt = null) {
    let s = 0;
    for (let i = 0; i < vals.length; i++) {
      const z = (x - vals[i]) / h;
      s += Math.exp(-0.5 * z * z);
    }
    if (taperLeft && x >= 0) s *= 1 - Math.exp(-Math.pow(x / 3.8, 2));
    if (taperRightAt !== null && x > taperRightAt) s *= Math.exp(-Math.pow((x - taperRightAt) / 3.8, 2));
    return s;
  }
  function buildCurve(vals, h, maxVal, mapX, col = C.violet, taperLeft = true, taperRightAt = null) {
    const xs = Array.from({ length: CURVE_SEGS + 1 }, (_, i) => (i / CURVE_SEGS) * maxVal);
    const raw = xs.map(x => evalKDE(vals, x, h, taperLeft, taperRightAt));
    const yMax = Math.max(...raw) || 1;
    const pts = xs.map((x, i) => [mapX(x), CURVE_BASE + (raw[i] / yMax) * CURVE_H, 0]);
    const segs = [];
    for (let i = 0; i < CURVE_SEGS; i++) {
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color: col, strokeWidth: 3.6 }));
    }
    const yAt = v => CURVE_BASE + (evalKDE(vals, v, h, taperLeft, taperRightAt) / yMax) * CURVE_H;
    return { segs, pts, yAt };
  }
  function buildSatDots(coloured = false) {
    return VISITS.map(([v, col], k) => {
      const dup = VALS.slice(0, k).filter(x => x === v).length;
      const p = [n2x(v), DOT_Y + dup * (P ? 0.21 : 0.20), 0];
      const c = coloured ? col : C.cyan;
      return { v, col, p, halo: makeHalo(p, c), d: makeDot(p, c) };
    });
  }
  function makeVMarker(x, yTop, col, label, labPos, dashed = false) {
    const ln = dashed
      ? new M.DashedLine({ start: [x, CURVE_BASE, 0], end: [x, yTop, 0], color: col, strokeWidth: 2.8 })
      : new M.Line({ start: [x, CURVE_BASE, 0], end: [x, yTop, 0], color: col, strokeWidth: 3.2 });
    const lb = T(label, P ? 15 : 17, col, true);
    lb.moveTo(labPos);
    return { ln, lb };
  }

  // ==================== ACT 1 (0–3): Library director wants plain words for shapes ====================

  const dirX = P ? 0 : -3.9, dirY = P ? 1.55 : -0.15;
  const dirHead = new M.Circle({ radius: 0.26, color: C.cyan, strokeWidth: 2.5 });
  dirHead.setFill(C.cyan, 0.25); dirHead.moveTo([dirX, dirY + 0.42, 0]);
  const dirBody = new M.Arc({ radius: 0.46, startAngle: 0, angle: Math.PI, color: C.cyan, strokeWidth: 2.5 });
  dirBody.setFill(C.cyan, 0.25); dirBody.moveTo([dirX, dirY - 0.14, 0]);
  const dirLab = T('Library director', P ? 18 : 19, C.cyan);
  dirLab.moveTo([dirX, dirY - 0.56, 0]);
  const dirIcon = new M.VGroup(dirHead, dirBody, dirLab);

  const cardX = P ? 0 : 1.75, cardY = P ? -1.15 : -0.15;
  const cardW = P ? 6.4 : 7.0, cardH = P ? 2.15 : 2.15;
  const cardBg = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.2, color: C.amber, strokeWidth: 2.5 });
  cardBg.setFill(C.card, 0.94); cardBg.moveTo([cardX, cardY, 0]);
  const cardQ1 = T('“One sentence about', P ? 21 : 24, C.ink);
  cardQ1.moveTo([cardX, cardY + 0.40, 0]);
  const cardQ2 = T('Saturday visit times?”', P ? 21 : 24, C.amber, false, true);
  cardQ2.moveTo([cardX, cardY - 0.14, 0]);
  const cardLine = new M.Line({ start: [cardX - 2.2, cardY - 0.62, 0], end: [cardX + 2.2, cardY - 0.62, 0], color: C.muted, strokeWidth: 2 });

  // Beat 0: Imagine the library director asks for one sentence about Saturday visit times.
  await until(S(0));
  await play(
    new M.FadeIn(dirIcon), new M.Create(cardBg),
    new M.FadeIn(cardQ1), new M.FadeIn(cardQ2), new M.Create(cardLine),
    ...say('ONE SENTENCE ABOUT SATURDAY?', C.amber)
  );

  // Beat 1: She does not want a chart.
  const miniX = P ? 0 : 1.75, miniY = P ? -3.75 : -2.10;
  const miniBox = new M.RoundedRectangle({ width: 2.5, height: 1.35, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  miniBox.setFill(C.card, 0.92); miniBox.moveTo([miniX, miniY, 0]);
  const miniBars = [0.42, 0.85, 0.56, 0.28, 0.64].map((h, k) => {
    const b = new M.Rectangle({ width: 0.24, height: h, color: C.cyan, strokeWidth: 1 });
    b.setFill(C.cyan, 0.55); b.moveTo([miniX - 0.72 + k * 0.36, miniY - 0.48 + h / 2, 0]);
    return b;
  });
  const noX1 = new M.Line({ start: [miniX - 1.15, miniY - 0.58, 0], end: [miniX + 1.15, miniY + 0.58, 0], color: C.pink, strokeWidth: 4 });
  const noX2 = new M.Line({ start: [miniX - 1.15, miniY + 0.58, 0], end: [miniX + 1.15, miniY - 0.58, 0], color: C.pink, strokeWidth: 4 });
  const miniChart = new M.VGroup(miniBox, ...miniBars, noX1, noX2);

  await until(S(1));
  await play(
    new M.FadeIn(miniChart, { runTime: 0.65 }),
    ...say('NO CHART — PLAIN WORDS', C.pink)
  );

  // Beat 2: She wants plain words: what do Saturday visits look like?
  const plainTxt = T('Plain words: what do they look like?', P ? 18 : 21, C.green);
  plainTxt.moveTo([cardX, cardY - 0.66, 0]);
  await until(S(2));
  await play(
    new M.FadeOut(miniChart), new M.FadeOut(cardLine),
    new M.FadeIn(plainTxt), new M.Indicate(cardBg, { color: C.amber }),
    ...say('WHAT DO SATURDAY VISITS LOOK LIKE?', C.amber)
  );

  // Beat 3: To answer her, we need everyday words for shapes.
  function miniSilhouette(cx, cy, heights, col) {
    const frame = new M.RoundedRectangle({ width: 1.9, height: 1.12, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    frame.setFill(C.card, 0.88); frame.moveTo([cx, cy, 0]);
    const pts = heights.map((h, i) => [cx - 0.72 + (i / (heights.length - 1)) * 1.44, cy - 0.38 + h * 0.72, 0]);
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color: col, strokeWidth: 3 }));
    }
    return new M.VGroup(frame, ...segs);
  }
  const silY = P ? -3.65 : -2.15;
  const silSp = P ? 2.2 : 2.6;
  const sils = [
    miniSilhouette(cardX - silSp, silY, [0.05, 0.35, 0.95, 0.50, 0.22, 0.72, 0.15], C.cyan),
    miniSilhouette(cardX, silY, [0.05, 0.95, 0.60, 0.28, 0.14, 0.08, 0.04], C.pink),
    miniSilhouette(cardX + silSp, silY, [0.04, 0.08, 0.14, 0.28, 0.60, 0.95, 0.05], C.violet),
  ];
  await until(S(3));
  await play(
    new M.LaggedStart(sils.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('EVERYDAY WORDS FOR SHAPES', C.cyan)
  );

  // ==================== ACT 2 (4–8): 24 glowing dots, smooth curve, distribution & shape ====================

  const satAxis1 = makeAxis(180, P ? 30 : 20, n2x);
  const satDots1 = buildSatDots(false);

  // Beat 4: Here are our twenty-four Saturday visits as glowing dots along a time line.
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(dirIcon, cardBg, cardQ1, cardQ2, plainTxt, ...sils)),
    new M.Create(satAxis1.ln), new M.FadeIn(satAxis1.ticks),
    new M.LaggedStart(satDots1.map(v => new M.FadeIn(v.halo)), { lagRatio: 0.04, runTime: 1.6 }),
    new M.LaggedStart(satDots1.map(v => new M.FadeIn(v.d)), { lagRatio: 0.04, runTime: 1.6 }),
    ...say('24 SATURDAY VISITS (MINUTES)', C.cyan)
  );

  // Beat 5: Draped over the dots is the smooth curve from the last lesson.
  const satCurve1 = buildCurve(VALS, 11, 180, n2x, C.violet);
  await until(S(5));
  await play(
    new M.LaggedStart(satCurve1.segs.map(s => new M.Create(s)), { lagRatio: 0.02, runTime: 1.8 }),
    ...say('SMOOTH CURVE DRAPED OVER DOTS', C.violet)
  );

  // Beat 6: The curve rises tall where dots crowd together, and stays low where dots are few.
  const tallArr = new M.Arrow({ start: [n2x(13), CURVE_BASE + 0.45, 0], end: [n2x(13), CURVE_BASE + CURVE_H - 0.08, 0], color: C.cyan, strokeWidth: 3 });
  const tallLab = T('crowded → tall', P ? 15 : 17, C.cyan, true);
  tallLab.moveTo([n2x(P ? 38 : 30), CURVE_BASE + CURVE_H + 0.24, 0]);
  const lowArr = new M.Arrow({ start: [n2x(130), CURVE_BASE + 0.95, 0], end: [n2x(130), CURVE_BASE + 0.22, 0], color: C.muted, strokeWidth: 2.5 });
  const lowLab = T('few dots → low', P ? 15 : 17, C.muted, true);
  lowLab.moveTo([n2x(130), CURVE_BASE + 1.18, 0]);
  await until(S(6));
  await play(
    new M.Create(tallArr), new M.FadeIn(tallLab),
    new M.Create(lowArr), new M.FadeIn(lowLab),
    new M.LaggedStart(satDots1.slice(0, 7).map(v => new M.Indicate(v.d, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('CROWDED → TALL   ·   FEW → LOW', C.cyan)
  );

  // Beat 7: The way numbers spread out along a line is called their distribution.
  const distSpan = spanBar(n2x(5), n2x(160), CURVE_BASE - (P ? 0.92 : 0.78), C.cyan, 'distribution', false);
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(tallArr, tallLab, lowArr, lowLab)),
    new M.Create(distSpan),
    ...fbox([['distribution', C.cyan], ['how numbers spread along a line', C.ink]], C.cyan),
    ...say('DISTRIBUTION = HOW NUMBERS SPREAD', C.cyan)
  );

  // Beat 8: The outline of that curve is called the shape of the distribution.
  await until(S(8));
  await play(
    new M.FadeOut(distSpan),
    new M.LaggedStart(satCurve1.segs.filter((_, i) => i % 3 === 0).map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.05, runTime: 1.6 }),
    ...fbox([['shape of the distribution', C.violet], ['the outline of the curve', C.ink]], C.violet),
    ...say('SHAPE = OUTLINE OF THE CURVE', C.violet)
  );

  // ==================== ACT 3 (9–15): Peaks & bimodal ====================

  // Beat 9: Let's read our shape from left to right.
  const lrY = CURVE_BASE + CURVE_H + (P ? 0.36 : 0.26);
  const lrArrow = new M.Arrow({ start: [n2x(10), lrY, 0], end: [n2x(155), lrY, 0], color: C.cyan, strokeWidth: 3 });
  const lrLab = T('read left  →  right', P ? 16 : 17, C.cyan, true);
  lrLab.moveTo([n2x(85), lrY + 0.28, 0]);
  await until(S(9));
  await play(
    ...clearBox(),
    new M.Create(lrArrow, { runTime: 0.85 }), new M.FadeIn(lrLab, { runTime: 0.85 }),
    ...say('READ FROM LEFT TO RIGHT', C.cyan)
  );

  // Beat 10: First, there is a tall hill on the left, near ten to fifteen minutes.
  const pk1P = [n2x(12.5), satCurve1.yAt(12.5), 0];
  const pk1Dot = makeDot(pk1P, C.cyan, 0.11);
  const pk1Ring = new M.Circle({ radius: 0.26, color: C.cyan, strokeWidth: 2.5 });
  pk1Ring.moveTo(pk1P);
  const pk1Pos = [n2x(P ? 26 : 18), pk1P[1] + 0.36, 0];
  const pk1Range = T('10–15 min', P ? 16 : 18, C.cyan, true); pk1Range.moveTo(pk1Pos);
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(lrArrow, lrLab)),
    new M.FadeIn(pk1Dot), new M.Create(pk1Ring), new M.Flash(pk1Dot, { color: C.cyan }),
    new M.FadeIn(pk1Range),
    ...say('TALL HILL NEAR 10–15 MINUTES', C.cyan)
  );

  // Beat 11: A high spot where numbers crowd together is called a peak.
  const pk1Tag = T('PEAK 1', P ? 17 : 19, C.cyan, true); pk1Tag.moveTo(pk1Pos);
  await until(S(11));
  await play(
    new M.FadeOut(pk1Range), new M.FadeIn(pk1Tag),
    ...fbox([['peak', C.cyan], ['high spot where numbers crowd', C.ink]], C.cyan),
    ...say('PEAK = HIGH SPOT WHERE DOTS CROWD', C.cyan)
  );

  // Beat 12: Next, the curve dips, and then rises again near ninety minutes.
  const dipP = [n2x(72), satCurve1.yAt(72), 0];
  const dipArr = new M.Arrow({ start: [dipP[0], dipP[1] + 0.56, 0], end: [dipP[0], dipP[1] + 0.08, 0], color: C.muted, strokeWidth: 2.5 });
  const dipLab = T('dip', P ? 15 : 16, C.muted, true); dipLab.moveTo([dipP[0], dipP[1] + 0.74, 0]);
  const pk2P = [n2x(90), satCurve1.yAt(90), 0];
  const pk2Dot = makeDot(pk2P, C.amber, 0.11);
  const pk2Ring = new M.Circle({ radius: 0.26, color: C.amber, strokeWidth: 2.5 });
  pk2Ring.moveTo(pk2P);
  const pk2Pos = [n2x(94), pk2P[1] + 0.42, 0];
  const pk2Range = T('~90 min', P ? 16 : 18, C.amber, true); pk2Range.moveTo(pk2Pos);
  await until(S(12));
  await play(
    new M.Create(dipArr), new M.FadeIn(dipLab),
    new M.FadeIn(pk2Dot), new M.Create(pk2Ring), new M.Flash(pk2Dot, { color: C.amber }),
    new M.FadeIn(pk2Range),
    ...say('DIPS, THEN RISES NEAR 90 MIN', C.amber)
  );

  // Beat 13: That is a second peak.
  const pk2Tag = T('PEAK 2', P ? 17 : 19, C.amber, true); pk2Tag.moveTo(pk2Pos);
  await until(S(13));
  await play(
    new M.FadeOut(pk2Range, { runTime: 0.65 }), new M.FadeIn(pk2Tag, { runTime: 0.65 }),
    new M.Indicate(pk2Ring, { color: C.amber, runTime: 0.65 }),
    ...say('A SECOND PEAK', C.amber)
  );

  // Beat 14: A shape with two peaks is called bimodal.
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(dipArr, dipLab)),
    new M.Indicate(pk1Tag, { color: C.green }), new M.Indicate(pk2Tag, { color: C.green }),
    ...fbox([['bimodal', C.green], ['a shape with two main peaks', C.ink]], C.green),
    ...say('TWO MAIN PEAKS = BIMODAL', C.green)
  );

  // Beat 15: Bi means two. Modal comes from the mode, the most common number, where dots crowd most.
  await until(S(15));
  await play(
    new M.LaggedStart([new M.Indicate(pk1Ring, { color: C.cyan }), new M.Indicate(pk2Ring, { color: C.amber })], { lagRatio: 0.45, runTime: 1.5 }),
    ...fbox([
      ['bi = two', C.green],
      ['Two places where visits crowd together.', C.ink],
    ], C.green),
    ...say('BI = TWO', C.green)
  );

  // ==================== ACT 4 (16–19): Colour dots by purpose — two peaks = two groups ====================

  // Build purpose legend in the box region (never over data)
  const legItems = [['borrow (7)', C.cyan], ['computer (5)', C.violet], ['study (9)', C.amber], ['event (3)', C.pink]];
  const legendGroup = new M.VGroup(...legItems.flatMap(([name, col], i) => {
    const lx = P ? (i % 2 === 0 ? -1.55 : 1.55) : (i - 1.5) * 2.85;
    const ly = P ? (i < 2 ? 2.72 : 2.22) : -2.20;
    const dt = makeDot([lx - (P ? 0.95 : 1.02), ly, 0], col, 0.085);
    const tx = T(name, P ? 16 : 17, col, true);
    tx.moveTo([lx + (P ? 0.12 : 0.10), ly, 0]);
    return [dt, tx];
  }));

  // Beat 16: Now let's colour each of the twenty-four dots by why the visitor came.
  await until(S(16));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(pk1Ring, pk2Ring)),
    ...satDots1.map(v => new M.Transform(v.halo, makeHalo(v.p, v.col), { runTime: 1.1 })),
    ...satDots1.map(v => new M.Transform(v.d, makeDot(v.p, v.col), { runTime: 1.1 })),
    new M.FadeIn(legendGroup),
    ...say('COLOUR EACH DOT BY PURPOSE', C.cyan)
  );

  // Beat 17: The left peak is mostly light blue: people borrowing books, in and out quickly.
  const leftHi = new M.RoundedRectangle({ width: n2x(20) - n2x(2), height: P ? 0.85 : 0.75, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  leftHi.moveTo([(n2x(2) + n2x(20)) / 2, DOT_Y + 0.12, 0]);
  await until(S(17));
  await play(
    new M.Create(leftHi),
    new M.LaggedStart(satDots1.slice(0, 7).map(v => new M.Flash(v.d, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('LEFT PEAK: BORROWING BOOKS', C.cyan)
  );

  // Beat 18: The right peak is mostly pink and amber: people staying for events or long study visits.
  const rightHi = new M.RoundedRectangle({ width: n2x(102) - n2x(72), height: P ? 0.85 : 0.75, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.5 });
  rightHi.moveTo([(n2x(72) + n2x(102)) / 2, DOT_Y + 0.12, 0]);
  const eventStudyLab = T('events & study', P ? 15 : 17, C.pink, true);
  eventStudyLab.moveTo([n2x(100), pk2P[1] + 0.80, 0]);
  await until(S(18));
  await play(
    new M.FadeOut(leftHi),
    new M.Create(rightHi), new M.FadeIn(eventStudyLab),
    new M.LaggedStart(satDots1.slice(18, 23).map(v => new M.Flash(v.d, { color: v.col })), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('RIGHT PEAK: EVENTS & LONG STUDY', C.pink)
  );

  // Beat 19: So two peaks often mean two different groups, mixed into one picture.
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(rightHi, eventStudyLab, legendGroup)),
    new M.Indicate(pk1Tag, { color: C.cyan }), new M.Indicate(pk2Tag, { color: C.amber }),
    ...fbox([['Two peaks can be a clue:', C.green], ['Different groups may be mixed.', C.ink]], C.green),
    ...say('TWO PEAKS → TWO GROUPS MIXED', C.green)
  );

  // ==================== ACT 5 (20–27): Tails & skew ====================

  // Beat 20: Now look at the two sides of the curve.
  const sideArrL = new M.Arrow({ start: [n2x(26), CURVE_BASE + CURVE_H * 0.55, 0], end: [n2x(4), CURVE_BASE + CURVE_H * 0.55, 0], color: C.cyan, strokeWidth: 3 });
  const sideArrR = new M.Arrow({ start: [n2x(105), CURVE_BASE + CURVE_H * 0.45, 0], end: [n2x(158), CURVE_BASE + CURVE_H * 0.45, 0], color: C.pink, strokeWidth: 3 });
  await until(S(20));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(pk1Dot, pk1Tag, pk2Dot, pk2Tag)),
    new M.Create(sideArrL), new M.Create(sideArrR),
    ...say('LOOK AT THE TWO SIDES', C.cyan)
  );

  // Beat 21: On the left, the curve stops quickly. No visit can be shorter than zero.
  const zeroWall = new M.Line({ start: [n2x(0), CURVE_BASE - 0.08, 0], end: [n2x(0), CURVE_BASE + CURVE_H + 0.12, 0], color: C.cyan, strokeWidth: 4 });
  const zeroLab = T('stops at 0', P ? 15 : 17, C.cyan, true);
  zeroLab.moveTo([n2x(P ? 22 : 16), CURVE_BASE + CURVE_H + 0.34, 0]);
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(sideArrL, sideArrR)),
    new M.Create(zeroWall), new M.FadeIn(zeroLab),
    ...say('LEFT SIDE STOPS AT ZERO', C.cyan)
  );

  // Beat 22: On the right, the curve stretches far out, all the way to one hundred and sixty minutes.
  const tailSegs = [];
  for (let i = 0; i < CURVE_SEGS; i++) {
    const xVal = (i / CURVE_SEGS) * 180;
    if (xVal >= 96) {
      tailSegs.push(new M.Line({ start: satCurve1.pts[i], end: satCurve1.pts[i + 1], color: C.pink, strokeWidth: 4.8 }));
    }
  }
  const tailOverlay = new M.VGroup(...tailSegs);
  const tailY = CURVE_BASE + (P ? 0.92 : 0.72);
  const tailArrow = new M.Arrow({ start: [n2x(102), tailY, 0], end: [n2x(162), tailY, 0], color: C.pink, strokeWidth: 3.5 });
  const tail160Lab = T('to 160 min', P ? 15 : 17, C.pink, true);
  tail160Lab.moveTo([n2x(134), tailY + 0.30, 0]);
  await until(S(22));
  await play(
    new M.Create(tailOverlay), new M.Create(tailArrow), new M.FadeIn(tail160Lab),
    new M.Flash(satDots1[23].d, { color: C.pink }),
    ...say('RIGHT SIDE STRETCHES TO 160 MIN', C.pink)
  );

  // Beat 23: A long, thin stretch on one side is called a tail.
  const tailTag = T('LONG TAIL', P ? 16 : 18, C.pink, true);
  tailTag.moveTo([n2x(134), tailY + 0.30, 0]);
  await until(S(23));
  await play(
    new M.FadeOut(tail160Lab), new M.FadeIn(tailTag),
    ...fbox([['tail', C.pink], ['a long, thin stretch on one side', C.ink]], C.pink),
    ...say('TAIL = LONG, THIN STRETCH', C.pink)
  );

  // Beat 24: When one side stretches out much farther than the other, the shape looks lopsided.
  const spanY = CURVE_BASE + CURVE_H + (P ? 0.20 : 0.14);
  const shortSpan = spanBar(n2x(0), n2x(13), spanY, C.cyan, 'short', true);
  const longSpan = spanBar(n2x(15), n2x(160), spanY, C.pink, 'much longer', true);
  await until(S(24));
  await play(
    new M.FadeOut(zeroLab),
    new M.Create(shortSpan), new M.Create(longSpan),
    ...say('ONE SIDE MUCH LONGER = LOPSIDED', C.amber)
  );

  // Beat 25: A lopsided shape like this is called skewed.
  await until(S(25));
  await play(
    new M.Indicate(longSpan, { color: C.amber }),
    ...fbox([['skewed', C.amber], ['a lopsided shape with one long tail', C.ink]], C.amber),
    ...say('LOPSIDED SHAPE = SKEWED', C.amber)
  );

  // Beat 26: Here is the key rule: we name the skew after the long tail, not the big hill.
  const notHill = T('× not the hill', 15, C.muted, true);
  notHill.moveTo([n2x(P ? 32 : 28), CURVE_BASE + CURVE_H * 0.72, 0]);
  await until(S(26));
  await play(
    new M.FadeIn(notHill), new M.Indicate(tailTag, { color: C.pink }),
    ...fbox([
      ['Key rule:', C.amber],
      ['name skew after the LONG TAIL', C.pink],
      ['(not the big hill)', C.muted],
    ], C.pink),
    ...say('NAME SKEW AFTER THE LONG TAIL', C.pink)
  );

  // Beat 27: Because our long tail stretches to the right, this shape is skewed to the right.
  const skewRightTag = T('SKEWED RIGHT →', P ? 16 : 18, C.pink, true);
  skewRightTag.moveTo([n2x(132), tailY + 0.30, 0]);
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(shortSpan, longSpan, notHill, tailTag)),
    new M.FadeIn(skewRightTag), new M.Indicate(tailArrow, { color: C.pink }),
    ...fbox([['tail stretches right', C.pink], ['→ skewed to the right', C.amber]], C.pink),
    ...say('SKEWED TO THE RIGHT', C.pink)
  );

  // ==================== ACT 6 (28–42): What a long tail does to median and mean ====================

  // Beat 28: Now let's see what a long tail does to the median and the mean.
  await until(S(28));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(zeroWall, tailOverlay, tailArrow, skewRightTag)),
    ...say('TAIL EFFECT: MEDIAN VS MEAN', C.cyan)
  );

  // Beat 29: Line up all twenty-four visits from shortest to longest.
  const chipPos = k => P
    ? [(k % 12 - 5.5) * 0.58, k < 12 ? 0.35 : -1.25, 0]
    : [(k - 11.5) * 0.54, 0.28, 0];
  const chips = VISITS.map(([v, col], k) => {
    const [x, y] = chipPos(k);
    const d = glowDot([x, y + 0.28, 0], col, P ? 0.082 : 0.078);
    const n = T(String(v), 15, C.ink, true);
    n.moveTo([x, y - 0.10, 0]);
    return new M.VGroup(d, n);
  });
  const ordArr = new M.Arrow({
    start: [P ? -3.2 : -6.1, P ? -2.25 : -0.58, 0],
    end: [P ? 3.2 : 6.1, P ? -2.25 : -0.58, 0],
    color: C.muted, strokeWidth: 2,
  });
  const ordLab = T('shortest  →  longest (24 visits)', P ? 16 : 17, C.muted);
  ordLab.moveTo([0, P ? -2.62 : -0.92, 0]);

  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(satAxis1.ln, satAxis1.ticks, ...satDots1.flatMap(v => [v.halo, v.d]), ...satCurve1.segs)),
    new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.03, runTime: 1.5 }),
    new M.Create(ordArr), new M.FadeIn(ordLab),
    ...(P ? fbox(['Numbers show visit times', 'in minutes.']) : []),
    ...say('LINE UP ALL 24 VISITS', C.cyan)
  );

  // Beat 30: The two middle visits are thirty-five and forty minutes.
  const ringAt = (k, col) => {
    const [x, y] = chipPos(k);
    const r = new M.RoundedRectangle({ width: 0.48, height: 0.82, cornerRadius: 0.1, color: col, strokeWidth: 2.5 });
    r.moveTo([x, y + 0.08, 0]);
    return r;
  };
  const midCut = P
    ? new M.DashedLine({ start: [-3.5, -0.42, 0], end: [3.5, -0.42, 0], color: C.green, strokeWidth: 2.5 })
    : new M.DashedLine({ start: [0, -0.25, 0], end: [0, 0.92, 0], color: C.green, strokeWidth: 2.5 });
  const midRings = new M.VGroup(ringAt(11, C.green), ringAt(12, C.green));

  await until(S(30));
  await play(
    new M.Create(midCut), new M.Create(midRings),
    new M.Indicate(chips[11], { color: C.green }), new M.Indicate(chips[12], { color: C.green }),
    ...fbox(['12th and 13th visits:', ['35 min  and  40 min', C.green]], C.green),
    ...say('TWO MIDDLE VISITS: 35 AND 40', C.green)
  );

  // Beat 31: Halfway between them is thirty-seven and a half minutes. That middle mark is the median.
  const medChipTxt = T('MEDIAN = 37.5', P ? 18 : 20, C.green, true);
  medChipTxt.moveTo(P ? [0, -0.42, 0] : [0, 1.24, 0]);
  const medChipBg = new M.RoundedRectangle({ width: medChipTxt.getWidth() + 0.42, height: 0.48, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
  medChipBg.setFill(C.card, 0.96); medChipBg.moveTo(P ? [0, -0.42, 0] : [0, 1.24, 0]);
  const medChipBadge = new M.VGroup(medChipBg, medChipTxt);

  await until(S(31));
  await play(
    new M.FadeIn(medChipBadge),
    ...fbox(['(35 + 40) ÷ 2 = 37.5 min', ['median = 37.5 minutes', C.green]], C.green),
    ...say('MEDIAN = 37.5 MINUTES', C.green)
  );

  // Beat 32: Now compare that with the mean, the fair share, which is about forty-seven minutes.
  const satAxis2 = makeAxis(180, P ? 30 : 20, n2x);
  const satDots2 = buildSatDots(true);
  const satCurve2 = buildCurve(VALS, 11, 180, n2x, C.violet);
  const yMedTop = CURVE_BASE + CURVE_H + (P ? 0.16 : 0.10);
  const yMeanTop = CURVE_BASE + CURVE_H + (P ? 0.56 : 0.34);
  const medM2 = makeVMarker(n2x(37.5), yMedTop, C.green, 'median 37.5',
    [n2x(37.5) - (P ? 0.48 : 0.92), yMedTop + (P ? 0.24 : 0.20), 0], true);
  const meanM2 = makeVMarker(n2x(46.7), yMeanTop, C.amber, 'mean ≈ 46.7',
    [n2x(46.7) + (P ? 1.05 : 1.12), yMeanTop + (P ? 0.18 : 0.16), 0], false);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...chips, ordArr, ordLab, midCut, midRings, medChipBadge)),
    new M.Create(satAxis2.ln), new M.FadeIn(satAxis2.ticks),
    new M.FadeIn(new M.VGroup(...satCurve2.segs)),
    new M.FadeIn(new M.VGroup(...satDots2.flatMap(v => [v.halo, v.d]))),
    new M.Create(medM2.ln), new M.FadeIn(medM2.lb),
    new M.Create(meanM2.ln), new M.FadeIn(meanM2.lb),
    ...fbox([['median = 37.5 min', C.green], ['mean   ≈ 46.7 min (1120 ÷ 24)', C.amber]], C.amber),
    ...say('MEDIAN 37.5  VS  MEAN ≈ 47', C.amber)
  );

  // Beat 33: Why is the mean almost ten minutes higher than the median?
  const gapY = CURVE_BASE + CURVE_H * 0.62;
  const gapArr = new M.Arrow({ start: [n2x(37.5), gapY, 0], end: [n2x(46.7) + 0.04, gapY, 0], color: C.pink, strokeWidth: 3.5 });
  await until(S(33));
  await play(
    new M.Create(gapArr),
    ...fbox([['Mean ≈ 46.7 min', C.amber], ['Median = 37.5 min', C.green], ['Difference ≈ 9.2 min', C.pink]], C.pink),
    new M.Indicate(meanM2.lb, { color: C.amber }),
    ...say('WHY IS MEAN ~10 MIN HIGHER?', C.amber)
  );

  // Beat 34: Think of each minute as a block, shared equally among all twenty-four visitors.
  const BAR_X0 = P ? -3.30 : -5.85;
  const BAR_X1 = P ? 3.30 : 5.85;
  const BAR_STEP = (BAR_X1 - BAR_X0) / 24;
  const BAR_W = BAR_STEP * 0.72;
  const barX = k => BAR_X0 + (k + 0.5) * BAR_STEP;
  const BAR_BASE = P ? -2.35 : -1.05;
  const BAR_U = (P ? 3.15 : 2.30) / 160;

  const barFloor = new M.Line({ start: [BAR_X0 - 0.15, BAR_BASE, 0], end: [BAR_X1 + 0.15, BAR_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const blockBars = VISITS.map(([v, col], k) => {
    const h = Math.max(0.08, v * BAR_U);
    const r = new M.Rectangle({ width: BAR_W, height: h, color: col, strokeWidth: 1.4 });
    r.setFill(col, 0.84);
    r.moveTo([barX(k), BAR_BASE + h / 2, 0]);
    return r;
  });
  const barKeyIdx = [0, 11, 12, 20, 23];
  const barLabs = new M.VGroup(...barKeyIdx.map(k => {
    const t = T(String(VALS[k]), 15, VISITS[k][1], true);
    t.moveTo([barX(k), BAR_BASE - 0.28, 0]);
    return t;
  }));
  const blockNote = T('24 visitors · 1 block = 1 minute', P ? 15 : 16, C.muted);
  blockNote.moveTo([0, BAR_BASE - 0.62, 0]);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(
      satAxis2.ln, satAxis2.ticks, ...satCurve2.segs,
      ...satDots2.flatMap(v => [v.halo, v.d]), medM2.ln, medM2.lb, meanM2.ln, meanM2.lb, gapArr
    )),
    new M.Create(barFloor),
    new M.LaggedStart(blockBars.map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 1.5 }),
    new M.FadeIn(barLabs), new M.FadeIn(blockNote),
    ...fbox(['24 visitors share all blocks', ['1 block = 1 minute', C.cyan]], C.cyan),
    ...say('EACH MINUTE = 1 SHARED BLOCK', C.cyan)
  );

  // Beat 35: The long visits on the right pour many blocks into the shared pile.
  const pourTop = BAR_BASE + 100 * BAR_U + 0.35;
  const pourArrs = [19, 21, 23].map((k, idx) => new M.Arrow({
    start: [barX(k), BAR_BASE + VALS[k] * BAR_U + 0.08, 0],
    end: [barX(7 + idx * 3), pourTop + 0.25, 0],
    color: C.amber, strokeWidth: 2.5,
  }));
  await until(S(35));
  await play(
    new M.LaggedStart(blockBars.slice(18).map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.1, runTime: 1.5 }),
    new M.LaggedStart(pourArrs.map(a => new M.Create(a)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('LONG VISITS POUR IN MANY BLOCKS', C.amber)
  );

  // Beat 36: The all-afternoon student alone adds one hundred and sixty blocks.
  const h160 = 160 * BAR_U;
  const box160 = new M.RoundedRectangle({ width: BAR_W + 0.26, height: h160 + 0.26, cornerRadius: 0.1, color: C.pink, strokeWidth: 2.5 });
  box160.moveTo([barX(23), BAR_BASE + h160 / 2, 0]);
  const lab160 = T('160 blocks!', P ? 16 : 18, C.pink, true);
  lab160.moveTo([barX(23) - (P ? 0.85 : 0.72), BAR_BASE + h160 + 0.28, 0]);
  const top160Dot = new M.Dot({ point: [barX(23), BAR_BASE + h160, 0], radius: 0.05, color: C.pink });
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...pourArrs)),
    new M.Create(box160), new M.FadeIn(lab160), new M.Flash(top160Dot, { color: C.pink }),
    ...fbox([['all-afternoon student:', C.pink], ['adds 160 blocks alone', C.amber], ['total = 1120 blocks', C.ink]], C.pink),
    ...say('ONE STUDENT ADDS 160 BLOCKS', C.pink)
  );

  // Beat 37: All those extra blocks lift everyone's fair share.
  const yBarMed = BAR_BASE + 37.5 * BAR_U;
  const yBarMean = BAR_BASE + 46.7 * BAR_U;
  const barMedLn = new M.DashedLine({ start: [BAR_X0 - 0.1, yBarMed, 0], end: [BAR_X1 + 0.1, yBarMed, 0], color: C.green, strokeWidth: 2 });
  const barShareLn = new M.Line({ start: [BAR_X0 - 0.1, yBarMed, 0], end: [BAR_X1 + 0.1, yBarMed, 0], color: C.amber, strokeWidth: 3.5 });
  const barShareTarget = new M.Line({ start: [BAR_X0 - 0.1, yBarMean, 0], end: [BAR_X1 + 0.1, yBarMean, 0], color: C.amber, strokeWidth: 3.5 });
  const liftArr = new M.Arrow({ start: [barX(4), yBarMed - 0.02, 0], end: [barX(4), yBarMean + 0.45, 0], color: C.amber, strokeWidth: 3.5 });
  const liftLab = T('fair share lifts → 46.7', P ? 16 : 18, C.amber, true);
  liftLab.moveTo([barX(10), yBarMean + 0.62, 0]);

  await until(S(37));
  await play(
    new M.Create(barMedLn), new M.Transform(barShareLn, barShareTarget, { runTime: 1.5 }),
    new M.Create(liftArr), new M.FadeIn(liftLab),
    ...fbox(['1120 ÷ 24 ≈ 46.7 min', ['extra blocks lift fair share', C.amber]], C.amber),
    ...say('EXTRA BLOCKS LIFT THE FAIR SHARE', C.amber)
  );

  // Beat 38: Now check the middle of the line.
  const satAxis3 = makeAxis(180, P ? 30 : 20, n2x);
  const satDots3 = buildSatDots(true);
  const satCurve3 = buildCurve(VALS, 11, 180, n2x, C.violet);
  const medM3 = makeVMarker(n2x(37.5), yMedTop, C.green, 'median 37.5',
    [n2x(37.5) - (P ? 0.48 : 0.92), yMedTop + (P ? 0.24 : 0.20), 0], true);
  const meanLn3 = new M.Line({ start: [n2x(46.7), CURVE_BASE, 0], end: [n2x(46.7), yMeanTop, 0], color: C.amber, strokeWidth: 3.2 });
  const meanLab3 = T('mean ≈ 46.7', P ? 18 : 17, C.amber, true);
  meanLab3.moveTo([n2x(46.7) + (P ? 1.05 : 1.12), yMeanTop + (P ? 0.18 : 0.16), 0]);

  await until(S(38));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(barFloor, ...blockBars, barLabs, blockNote, box160, lab160, barMedLn, barShareLn, liftArr, liftLab), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(satAxis3.ln, satAxis3.ticks, ...satCurve3.segs), { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...satDots3.flatMap(v => [v.halo, v.d])), { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(medM3.ln, medM3.lb, meanLn3, meanLab3), { runTime: 0.8 }),
    ...say('NOW CHECK THE MIDDLE', C.green)
  );

  // Beat 39: Suppose that last student stayed one hundred minutes instead of one hundred and sixty.
  const satCurve100 = buildCurve(VALS_100, 11, 180, n2x, C.violet);
  const p100 = [n2x(100), DOT_Y, 0];
  const ghost160 = new M.Circle({ radius: DOT_R * 1.4, color: C.muted, strokeWidth: 2 });
  ghost160.moveTo(satDots3[23].p);
  const slideArr = new M.Arrow({ start: [n2x(156), DOT_Y + 0.56, 0], end: [n2x(104), DOT_Y + 0.56, 0], color: C.pink, strokeWidth: 3 });
  const slideLab = T('160 → 100', P ? 15 : 17, C.pink, true);
  slideLab.moveTo([n2x(130), DOT_Y + 0.86, 0]);
  const meanLn44 = new M.Line({ start: [n2x(44.2), CURVE_BASE, 0], end: [n2x(44.2), yMeanTop, 0], color: C.amber, strokeWidth: 3.2 });
  const meanLab44 = T('mean ≈ 44.2', P ? 18 : 17, C.amber, true);
  meanLab44.moveTo([n2x(44.2) + (P ? 1.25 : 1.24), yMeanTop + (P ? 0.18 : 0.16), 0]);

  await until(S(39));
  await play(
    new M.FadeIn(ghost160), new M.Create(slideArr), new M.FadeIn(slideLab),
    new M.Transform(satDots3[23].halo, makeHalo(p100, C.amber), { pathArc: 0.55, runTime: 1.5 }),
    new M.Transform(satDots3[23].d, makeDot(p100, C.amber), { pathArc: 0.55, runTime: 1.5 }),
    ...satCurve3.segs.map((s, i) => new M.Transform(s, satCurve100.segs[i], { runTime: 1.5 })),
    new M.Transform(meanLn3, meanLn44, { runTime: 1.5 }),
    new M.Transform(meanLab3, meanLab44, { runTime: 1.5 }),
    ...fbox([['last visit: 160 → 100 min', C.pink], ['(60 minutes shorter)', C.muted]], C.pink),
    ...say('CHANGE 160 → 100 MINUTES', C.pink)
  );

  // Beat 40: The two middle visits would still be thirty-five and forty.
  const mid3540Box = new M.RoundedRectangle({ width: n2x(43) - n2x(32), height: 0.54, cornerRadius: 0.1, color: C.green, strokeWidth: 2.5 });
  mid3540Box.moveTo([(n2x(35) + n2x(40)) / 2, DOT_Y, 0]);
  await until(S(40));
  await play(
    new M.Create(mid3540Box),
    new M.Flash(satDots3[11].d, { color: C.green }), new M.Flash(satDots3[12].d, { color: C.green }),
    ...fbox(['middle two visits:', ['still 35 and 40 min', C.green]], C.green),
    ...say('MIDDLE TWO: STILL 35 AND 40', C.green)
  );

  // Beat 41: So the median does not budge at all, while the mean would drop.
  await until(S(41));
  await play(
    new M.Indicate(medM3.lb, { color: C.green }),
    new M.Indicate(meanLn3, { color: C.amber }),
    ...fbox([['Median stays at 37.5 min', C.green], ['Mean: 1060 ÷ 24 ≈ 44.2 min', C.amber]], C.amber),
    ...say('MEDIAN STAYS · MEAN DROPS', C.amber)
  );

  // Beat 42: A long tail on the right pulls the mean up, usually above the median.
  const satCurveBack = buildCurve(VALS, 11, 180, n2x, C.violet);
  const meanLnBack = new M.Line({ start: [n2x(46.7), CURVE_BASE, 0], end: [n2x(46.7), yMeanTop, 0], color: C.amber, strokeWidth: 3.2 });
  const meanLabBack = T('mean ≈ 46.7 →', P ? 15 : 17, C.amber, true);
  meanLabBack.moveTo([n2x(46.7) + (P ? 1.15 : 1.24), yMeanTop + (P ? 0.18 : 0.16), 0]);
  const pullArr3 = new M.Arrow({ start: [n2x(39), CURVE_BASE + CURVE_H * 0.56, 0], end: [n2x(64), CURVE_BASE + CURVE_H * 0.56, 0], color: C.pink, strokeWidth: 3.5 });

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(ghost160, slideArr, slideLab, mid3540Box)),
    new M.Transform(satDots3[23].halo, makeHalo(satDots3[23].p, C.amber), { pathArc: -0.5, runTime: 1.2 }),
    new M.Transform(satDots3[23].d, makeDot(satDots3[23].p, C.amber), { pathArc: -0.5, runTime: 1.2 }),
    ...satCurve3.segs.map((s, i) => new M.Transform(s, satCurveBack.segs[i], { runTime: 1.2 })),
    new M.Transform(meanLn3, meanLnBack, { runTime: 1.2 }),
    new M.Transform(meanLab3, meanLabBack, { runTime: 1.2 }),
    new M.Create(pullArr3),
    ...fbox([['right tail pulls mean up', C.pink], ['mean (46.7) > median (37.5)', C.amber]], C.pink),
    ...say('RIGHT TAIL → MEAN > MEDIAN', C.pink)
  );

  // ==================== ACT 7 (43–48): Left-skewed — 90-minute library film ====================

  // Beat 43: What if a long tail stretches to the left instead?
  const bigLeftArr = new M.Arrow({ start: [P ? 2.6 : 4.2, P ? -0.4 : 0.1, 0], end: [P ? -2.6 : -4.2, P ? -0.4 : 0.1, 0], color: C.pink, strokeWidth: 5 });
  const bigLeftLab = T('long tail on the LEFT?', P ? 22 : 26, C.pink, true);
  bigLeftLab.moveTo([0, P ? 0.35 : 0.78, 0]);
  await until(S(43));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(
      satAxis3.ln, satAxis3.ticks, ...satCurve3.segs,
      ...satDots3.flatMap(v => [v.halo, v.d]), medM3.ln, medM3.lb, meanLn3, meanLab3, pullArr3
    )),
    new M.Create(bigLeftArr), new M.FadeIn(bigLeftLab),
    ...say('WHAT IF TAIL STRETCHES LEFT?', C.violet)
  );

  // Beat 44: Imagine a ninety-minute library film.
  const filmAxis = makeAxis(100, 20, f2x);
  const filmEndLn = new M.DashedLine({ start: [f2x(90), CURVE_BASE, 0], end: [f2x(90), CURVE_BASE + CURVE_H + 0.15, 0], color: C.violet, strokeWidth: 2.5 });
  const filmEndLab = T('film ends (90 min)', P ? 15 : 17, C.violet, true);
  filmEndLab.moveTo([f2x(P ? 76 : 86), CURVE_BASE + CURVE_H + 0.36, 0]);
  const filmCard = fbox(['Library film', ['90 minutes long', C.violet]], C.violet);
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(bigLeftArr, bigLeftLab)),
    new M.Create(filmAxis.ln), new M.FadeIn(filmAxis.ticks),
    new M.Create(filmEndLn), new M.FadeIn(filmEndLab),
    ...filmCard,
    ...say('90-MINUTE LIBRARY FILM', C.violet)
  );

  // Beat 45: Almost everyone stays to the end, and just a few people leave early.
  const filmDots = FILM.map((v, k) => {
    const dup = FILM.slice(0, k).filter(x => x === v).length;
    const p = [f2x(v), DOT_Y + dup * (P ? 0.16 : 0.15), 0];
    const col = v <= 50 ? C.pink : C.violet;
    return { v, col, p, halo: makeHalo(p, col, DOT_R * 0.92), d: makeDot(p, col, DOT_R * 0.92) };
  });
  await until(S(45));
  await play(
    ...clearBox(),
    new M.LaggedStart(filmDots.slice(4).map(v => new M.FadeIn(v.halo)), { lagRatio: 0.03, runTime: 1.2 }),
    new M.LaggedStart(filmDots.slice(4).map(v => new M.FadeIn(v.d)), { lagRatio: 0.03, runTime: 1.2 }),
    new M.LaggedStart(filmDots.slice(0, 4).map(v => new M.FadeIn(v.halo)), { lagRatio: 0.15, runTime: 1.5 }),
    new M.LaggedStart(filmDots.slice(0, 4).map(v => new M.FadeIn(v.d)), { lagRatio: 0.15, runTime: 1.5 }),
    new M.LaggedStart(filmDots.slice(0, 4).map(v => new M.Flash(v.d, { color: C.pink })), { lagRatio: 0.15, runTime: 1.5 }),
    ...say('MANY STAY NEAR THE END', C.violet)
  );

  // Beat 46: Now the big hill sits on the right, and the long tail stretches to the left.
  const filmCurve = buildCurve(FILM, 6.5, 100, f2x, C.violet, true, 90);
  const filmHillLab = T('BIG HILL', P ? 16 : 18, C.violet, true);
  filmHillLab.moveTo([f2x(86), CURVE_BASE + CURVE_H + 0.36, 0]);
  const fTailY = CURVE_BASE + (P ? 0.96 : 0.78);
  const filmTailArr = new M.Arrow({ start: [f2x(64), fTailY, 0], end: [f2x(8), fTailY, 0], color: C.pink, strokeWidth: 3.5 });
  const filmTailLab = T('← LONG TAIL', P ? 16 : 18, C.pink, true);
  filmTailLab.moveTo([f2x(36), fTailY + 0.32, 0]);
  await until(S(46));
  await play(
    new M.FadeOut(filmEndLab),
    new M.LaggedStart(filmCurve.segs.map(s => new M.Create(s)), { lagRatio: 0.02, runTime: 1.5 }),
    new M.FadeIn(filmHillLab), new M.Create(filmTailArr), new M.FadeIn(filmTailLab),
    ...say('BIG HILL RIGHT · LONG TAIL LEFT', C.pink)
  );

  // Beat 47: Because the tail is on the left, that shape is skewed to the left.
  await until(S(47));
  await play(
    new M.Indicate(filmTailLab, { color: C.pink }), new M.Indicate(filmTailArr, { color: C.pink }),
    ...fbox([['tail stretches left', C.pink], ['→ skewed to the left', C.violet]], C.pink),
    ...say('SKEWED TO THE LEFT', C.pink)
  );

  // Beat 48: Those few short times pull the fair share down, so the mean usually sits below the median.
  const yFilmMed = CURVE_BASE + CURVE_H + (P ? 0.20 : 0.14);
  const yFilmMean = CURVE_BASE + CURVE_H + (P ? 0.56 : 0.34);
  const filmMedM = makeVMarker(f2x(86), yFilmMed, C.green, 'median 86',
    [f2x(86) - (P ? 0.10 : 0.0), yFilmMed + (P ? 0.24 : 0.20), 0], true);
  const filmMeanM = makeVMarker(f2x(75), yFilmMean, C.amber, 'mean 75',
    [f2x(75) - (P ? 0.85 : 1.05), yFilmMean + (P ? 0.14 : 0.14), 0], false);
  const filmPullArr = new M.Arrow({ start: [f2x(85), CURVE_BASE + CURVE_H * 0.62, 0], end: [f2x(71), CURVE_BASE + CURVE_H * 0.62, 0], color: C.amber, strokeWidth: 3.5 });

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(filmHillLab, filmEndLn)),
    new M.Create(filmMedM.ln), new M.FadeIn(filmMedM.lb),
    new M.Create(filmMeanM.ln), new M.FadeIn(filmMeanM.lb),
    new M.Create(filmPullArr),
    ...fbox([['median = 86 min', C.green], ['mean   = 75 min (pulled down)', C.amber], ['mean < median', C.pink]], C.amber),
    ...say('LEFT TAIL → MEAN < MEDIAN', C.amber)
  );

  // ==================== ACT 8 (49–53): Answer the director & what reading shape is for ====================

  // Beat 49: Now we can answer the library director in one clear sentence.
  const satAxis4 = makeAxis(180, P ? 30 : 20, n2x);
  const satDots4 = buildSatDots(true);
  const satCurve4 = buildCurve(VALS, 11, 180, n2x, C.violet);

  await until(S(49));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(
      filmAxis.ln, filmAxis.ticks, ...filmDots.flatMap(v => [v.halo, v.d]),
      ...filmCurve.segs, filmTailArr, filmTailLab,
      filmMedM.ln, filmMedM.lb, filmMeanM.ln, filmMeanM.lb, filmPullArr
    )),
    new M.Create(satAxis4.ln), new M.FadeIn(satAxis4.ticks),
    new M.FadeIn(new M.VGroup(...satCurve4.segs)),
    new M.FadeIn(new M.VGroup(...satDots4.flatMap(v => [v.halo, v.d]))),
    ...say('ANSWER THE LIBRARY DIRECTOR', C.green)
  );

  // Beat 50: Many visits are short, a second group stays about an hour and a half, and a few stay much longer.
  const ans1 = T('many short', P ? 15 : 17, C.cyan, true);
  ans1.moveTo([n2x(P ? 24 : 18), CURVE_BASE + CURVE_H + 0.28, 0]);
  const ans2 = T('group ~1.5 hr', P ? 15 : 17, C.amber, true);
  ans2.moveTo([n2x(92), satCurve4.yAt(90) + 0.45, 0]);
  const ans3Arr = new M.Arrow({ start: [n2x(108), tailY, 0], end: [n2x(162), tailY, 0], color: C.pink, strokeWidth: 3 });
  const ans3 = T('one much longer', P ? 15 : 16, C.pink, true);
  ans3.moveTo([n2x(136), tailY + 0.30, 0]);

  await until(S(50));
  await play(
    new M.LaggedStart([
      new M.FadeIn(ans1),
      new M.FadeIn(ans2),
      new M.Create(ans3Arr),
      new M.FadeIn(ans3),
    ], { lagRatio: 0.35, runTime: 2.6 }),
    ...fbox([
      ['Many visits are short.', C.cyan],
      ['Some last about 90 minutes.', C.amber],
      ['One lasts much longer.', C.pink],
    ], C.green),
    ...say('PLAIN WORDS FROM THE SHAPE', C.green)
  );

  // Beat 51: That is what reading the shape is for.
  await until(S(51));
  await play(
    new M.LaggedStart(satCurve4.segs.filter((_, i) => i % 4 === 0).map(s => new M.Indicate(s, { color: C.green, runTime: 0.6 })), { lagRatio: 0.04, runTime: 0.9 }),
    ...say('WHAT READING SHAPE IS FOR', C.cyan)
  );

  // Beat 52: It helps you spot separate groups, see which way numbers stretch, and choose between the mean and the median.
  const medM4 = makeVMarker(n2x(37.5), yMedTop, C.green, 'median 37.5',
    [n2x(37.5) - (P ? 0.48 : 0.92), yMedTop + (P ? 0.24 : 0.20), 0], true);
  const meanM4 = makeVMarker(n2x(46.7), yMeanTop, C.amber, 'mean ≈ 46.7',
    [n2x(46.7) + (P ? 1.05 : 1.12), yMeanTop + (P ? 0.18 : 0.16), 0], false);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(ans1, ans2, ans3Arr, ans3)),
    new M.Create(medM4.ln), new M.FadeIn(medM4.lb),
    new M.Create(meanM4.ln), new M.FadeIn(meanM4.lb),
    ...fbox([
      ['1. Spot separate groups', C.cyan],
      ['2. See which way data stretches', C.pink],
      ['3. Choose mean vs median', C.green],
    ], C.cyan),
    ...say('GROUPS · STRETCH · MEAN VS MEDIAN', C.cyan)
  );

  // Beat 53: When there is a long tail, the median often describes a typical visit better than the mean.
  const medWinBox = new M.RoundedRectangle({ width: medM4.lb.getWidth() + 0.30, height: 0.44, cornerRadius: 0.12, color: C.green, strokeWidth: 2.5 });
  medWinBox.moveTo(medM4.lb.getCenter());
  await until(S(53));
  await play(
    new M.Create(medWinBox), new M.Indicate(medM4.lb, { color: C.green }),
    ...fbox([['long tail present?', C.pink], ['→ median fits typical visit better', C.green]], C.green),
    ...say('LONG TAIL → MEDIAN FITS TYPICAL', C.green)
  );

  // ==================== ACT 9 (54–59): Common trap — small sample lucky bumps ====================

  // Beat 54: Now watch out for a common trap.
  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(medM4.ln, medM4.lb, meanM4.ln, meanM4.lb, medWinBox), { runTime: 0.7 }),
    ...fbox([['Common trap:', C.pink], ['tiny sample → lucky bumps', C.ink]], C.pink),
    ...say('WATCH OUT: A COMMON TRAP', C.pink)
  );

  // Beat 55: We only have twenty-four visitors, from a single Saturday.
  const n24Lab = T('24 visits (one Saturday)', 18, C.amber, true);
  n24Lab.moveTo([n2x(128), CURVE_BASE + CURVE_H + (P ? 0.24 : 0.18), 0]);
  await until(S(55));
  await play(
    new M.FadeIn(n24Lab),
    new M.LaggedStart(satDots4.map(v => new M.Indicate(v.d, { color: C.amber })), { lagRatio: 0.03, runTime: 1.5 }),
    ...say('ONLY 24 VISITORS · ONE SATURDAY', C.amber)
  );

  // Beat 56: With so few dots, a small bump can appear just by chance.
  const bumpyCurve = buildCurve(VALS, 5.0, 180, n2x, C.violet);
  const bumpP = [n2x(60), bumpyCurve.yAt(60), 0];
  const bumpRing = new M.Circle({ radius: 0.34, color: C.pink, strokeWidth: 2.8 });
  bumpRing.moveTo(bumpP);
  const bumpLab = T('chance bump?', P ? 15 : 17, C.pink, true);
  bumpLab.moveTo([n2x(60), bumpP[1] + 0.56, 0]);
  await until(S(56));
  await play(
    ...satCurve4.segs.map((s, i) => new M.Transform(s, bumpyCurve.segs[i], { runTime: 1.3 })),
    new M.Create(bumpRing), new M.FadeIn(bumpLab),
    ...say('SMALL BUMP BY CHANCE?', C.pink)
  );

  // Beat 57: If you smooth the curve a little more, or check next Saturday's visits, a lucky bump can vanish.
  const smoothCurve = buildCurve(VALS, 16, 180, n2x, C.violet);
  const vanishLab = T('vanished!', P ? 15 : 17, C.muted, true);
  vanishLab.moveTo([n2x(60), bumpP[1] + 0.56, 0]);
  await until(S(57));
  await play(
    ...satCurve4.segs.map((s, i) => new M.Transform(s, smoothCurve.segs[i], { runTime: 1.5 })),
    new M.FadeOut(bumpLab), new M.FadeIn(vanishLab),
    ...fbox([['smooth more  OR  next Saturday', C.amber], ['→ lucky bump vanishes', C.pink]], C.amber),
    ...say('SMOOTH MORE → BUMP VANISHES', C.amber)
  );

  // Beat 58: A real peak usually has a real reason, like a separate group of visitors.
  const cleanCurve = buildCurve(VALS, 11, 180, n2x, C.violet);
  const real1 = T('borrow group', P ? 15 : 17, C.cyan, true);
  real1.moveTo([n2x(P ? 28 : 20), CURVE_BASE + CURVE_H + 0.28, 0]);
  const real2 = T('event / study', P ? 15 : 17, C.amber, true);
  real2.moveTo([n2x(96), cleanCurve.yAt(90) + 0.44, 0]);
  await until(S(58));
  await play(
    new M.FadeOut(new M.VGroup(bumpRing, vanishLab)),
    ...satCurve4.segs.map((s, i) => new M.Transform(s, cleanCurve.segs[i], { runTime: 1.2 })),
    new M.FadeIn(real1), new M.FadeIn(real2),
    ...fbox([['Does the peak appear again?', C.green], ['Compare visits from other days.', C.ink]], C.green),
    ...say('CHECK FOR PEAKS ON OTHER DAYS', C.green)
  );

  // Beat 59: Before you call a bump a peak, count how many dots make it, and look for a reason.
  const cnt1 = T('7 dots', P ? 15 : 16, C.cyan, true);
  cnt1.moveTo([n2x(12), DOT_Y + 0.62, 0]);
  const cnt2 = T('4 dots', P ? 15 : 16, C.amber, true);
  cnt2.moveTo([n2x(90), DOT_Y + 0.62, 0]);
  await until(S(59));
  await play(
    new M.FadeIn(cnt1), new M.FadeIn(cnt2),
    new M.Indicate(real1, { color: C.cyan }), new M.Indicate(real2, { color: C.amber }),
    ...fbox([
      ['Before calling it a peak:', C.amber],
      ['1. Count the dots', C.cyan],
      ['2. Look for a reason', C.green],
    ], C.amber),
    ...say('COUNT THE DOTS · FIND A REASON', C.amber)
  );

  // ==================== ACT 10 (60–61): Recap & bridge to next chapter ====================

  // Beat 60: Recap: describe a shape by its peaks and tail; a long tail pulls the mean toward it, while the median stays put.
  const rcPk1 = T('PEAK 1', P ? 15 : 17, C.cyan, true);
  rcPk1.moveTo([n2x(P ? 16 : 14), CURVE_BASE + CURVE_H + 0.24, 0]);
  const rcPk2 = T('PEAK 2', P ? 15 : 17, C.amber, true);
  rcPk2.moveTo([n2x(92), cleanCurve.yAt(90) + 0.42, 0]);
  const rcTailArr = new M.Arrow({ start: [n2x(108), tailY, 0], end: [n2x(162), tailY, 0], color: C.pink, strokeWidth: 3.2 });
  const rcTailLab = T('TAIL →', P ? 15 : 17, C.pink, true);
  rcTailLab.moveTo([n2x(136), tailY + 0.28, 0]);
  const rcMedM = makeVMarker(n2x(37.5), CURVE_BASE + CURVE_H + (P ? 0.36 : 0.16), C.green, 'median 37.5',
    [n2x(37.5) + (P ? 0.15 : 0.0), CURVE_BASE + CURVE_H + (P ? 0.62 : 0.40), 0], true);
  const rcMeanM = makeVMarker(n2x(46.7), CURVE_BASE + CURVE_H + (P ? 0.80 : 0.36), C.amber, 'mean ≈ 46.7 →',
    [n2x(46.7) + (P ? 0.92 : 1.48), CURVE_BASE + CURVE_H + (P ? 1.00 : 0.46), 0], false);

  await until(S(60));
  await play(
    new M.FadeOut(new M.VGroup(n24Lab, real1, real2, cnt1, cnt2)),
    new M.FadeIn(rcPk1), new M.FadeIn(rcPk2),
    new M.Create(rcTailArr), new M.FadeIn(rcTailLab),
    new M.Create(rcMedM.ln), new M.FadeIn(rcMedM.lb),
    new M.Create(rcMeanM.ln), new M.FadeIn(rcMeanM.lb),
    ...fbox([
      ['Shape = peaks + tail', C.cyan],
      ['long tail pulls mean toward it', C.amber],
    ], C.green),
    ...say('RECAP: PEAKS · TAIL · MEAN VS MEDIAN', C.green)
  );

  // Beat 61: In the next chapter, we will look at two measurements side by side, to see how they move together.
  const scX0 = P ? -2.7 : -3.4, scX1 = P ? 2.8 : 3.6;
  const scY0 = P ? -3.4 : -2.1, scY1 = P ? 1.8 : 1.25;
  const scXAxis = new M.Arrow({ start: [scX0, scY0, 0], end: [scX1, scY0, 0], color: C.muted, strokeWidth: 2.5 });
  const scYAxis = new M.Arrow({ start: [scX0, scY0, 0], end: [scX0, scY1, 0], color: C.muted, strokeWidth: 2.5 });
  const scXLab = T('measurement 1', P ? 16 : 18, C.cyan, true);
  scXLab.moveTo([(scX0 + scX1) / 2, scY0 - 0.42, 0]);
  const scYLab = T('measurement 2', P ? 16 : 18, C.violet, true);
  scYLab.moveTo([scX0 + (P ? 1.2 : 1.35), scY1 + 0.16, 0]);
  const scPairs = [
    [0.10, 0.16], [0.18, 0.28], [0.24, 0.22], [0.31, 0.38], [0.38, 0.45],
    [0.44, 0.41], [0.52, 0.56], [0.58, 0.64], [0.64, 0.58], [0.71, 0.72],
    [0.76, 0.79], [0.82, 0.74], [0.88, 0.88], [0.93, 0.85],
  ];
  const scDots = scPairs.map(([u, v], idx) => {
    const px = scX0 + 0.35 + u * (scX1 - scX0 - 0.75);
    const py = scY0 + 0.30 + v * (scY1 - scY0 - 0.60);
    return glowDot([px, py, 0], idx % 2 === 0 ? C.cyan : C.violet, P ? 0.095 : 0.10);
  });
  const trendLn = new M.DashedLine({
    start: [scX0 + 0.45, scY0 + 0.45, 0],
    end: [scX1 - 0.40, scY1 - 0.35, 0],
    color: C.amber, strokeWidth: 2.5,
  });

  await until(S(61));
  await play(
    ...clearBox(),
    new M.FadeOut(new M.VGroup(
      satAxis4.ln, satAxis4.ticks, ...satCurve4.segs,
      ...satDots4.flatMap(v => [v.halo, v.d]),
      rcPk1, rcPk2, rcTailArr, rcTailLab, rcMedM.ln, rcMedM.lb, rcMeanM.ln, rcMeanM.lb
    )),
    new M.Create(scXAxis), new M.Create(scYAxis),
    new M.FadeIn(scXLab), new M.FadeIn(scYLab),
    new M.LaggedStart(scDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.5 }),
    new M.Create(trendLn),
    ...say('NEXT CHAPTER: TWO MEASUREMENTS', C.violet)
  );
}
