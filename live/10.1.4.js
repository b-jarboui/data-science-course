// 10.1.4 Ordinary least squares (live manim-web lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 10.1 dataset: 12 apartments across buildings X, Y, Z.
  const PTS = [
    { area: 40,  rent: 860,  bld: 'X', color: C.cyan,  dx: 0,     dir: 1 },
    { area: 40,  rent: 770,  bld: 'Y', color: C.amber, dx: -0.09, dir: -1 },
    { area: 40,  rent: 770,  bld: 'Z', color: C.pink,  dx: 0.09,  dir: 1 },
    { area: 60,  rent: 1040, bld: 'X', color: C.cyan,  dx: 0,     dir: 1 },
    { area: 60,  rent: 1020, bld: 'Y', color: C.amber, dx: 0,     dir: -1 },
    { area: 60,  rent: 940,  bld: 'Z', color: C.pink,  dx: 0,     dir: 1 },
    { area: 80,  rent: 1250, bld: 'X', color: C.cyan,  dx: 0,     dir: -1 },
    { area: 80,  rent: 1210, bld: 'Y', color: C.amber, dx: 0,     dir: 1 },
    { area: 80,  rent: 1140, bld: 'Z', color: C.pink,  dx: 0,     dir: -1 },
    { area: 100, rent: 1470, bld: 'X', color: C.cyan,  dx: 0,     dir: -1 },
    { area: 100, rent: 1380, bld: 'Y', color: C.amber, dx: 0,     dir: 1 },
    { area: 100, rent: 1350, bld: 'Z', color: C.pink,  dx: 0,     dir: -1 },
  ];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3])
  const PX0 = P ? -2.75 : -5.5, PX1 = P ? 3.35 : 1.1;
  const PY0 = P ? -4.35 : -2.25, PY1 = P ? 0.75 : 1.20;
  const PCX = (PX0 + PX1) / 2;
  const PILL = P ? [0, 1.80, 0] : [PCX, 1.95, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Scatter coordinate transforms: area in [30, 110], rent in [650, 1550]
  const AMIN = 30, AMAX = 110, RMIN = 650, RMAX = 1550;
  const ax = a => PX0 + (a - AMIN) / (AMAX - AMIN) * (PX1 - PX0);
  const ay = r => PY0 + (r - RMIN) / (RMAX - RMIN) * (PY1 - PY0);

  // Formula box: one box at a time, never over the data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.40 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // Geometry builders
  function buildAxes() {
    const parts = [];
    parts.push(new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 }));
    parts.push(new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 }));
    for (const r of [800, 1000, 1200, 1400]) {
      const y = ay(r);
      const gl = new M.Line({ start: [PX0, y, -0.01], end: [PX1, y, -0.01], color: C.line, strokeWidth: 1 });
      gl.setStrokeOpacity(0.55); parts.push(gl);
      parts.push(new M.Line({ start: [PX0 - 0.08, y, 0], end: [PX0 + 0.04, y, 0], color: C.muted, strokeWidth: 2 }));
      const lbl = T(r.toLocaleString('en-US'), P ? 17 : 16, C.muted, true);
      lbl.moveTo([PX0 - (P ? 0.56 : 0.58), y, 0]); parts.push(lbl);
    }
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      parts.push(new M.Line({ start: [x, PY0 - 0.08, 0], end: [x, PY0 + 0.04, 0], color: C.muted, strokeWidth: 2 }));
      const lbl = T(String(a), P ? 18 : 17, C.muted, true);
      lbl.moveTo([x, PY0 - 0.28, 0]); parts.push(lbl);
    }
    const xLab = T('area (m²)', P ? 17 : 17, C.muted); xLab.moveTo([PCX, PY0 - (P ? 0.64 : 0.60), 0]);
    const yLab = T('rent ($)', P ? 17 : 17, C.muted); yLab.moveTo([PX0 + 0.45, PY1 + 0.25, 0]);
    parts.push(xLab, yLab);
    const leg = [['X', C.cyan], ['Y', C.amber], ['Z', C.pink]];
    leg.forEach(([name, col], idx) => {
      const lx = PX1 - (2 - idx) * (P ? 0.85 : 0.88) - 0.35, ly = PY1 + 0.25;
      const d = new M.Dot({ point: [lx - 0.22, ly, 0], radius: 0.075, color: col });
      const t = T(name, P ? 18 : 17, col, true, true); t.moveTo([lx + 0.02, ly, 0]);
      parts.push(d, t);
    });
    return new M.VGroup(...parts);
  }

  function buildDots() {
    return PTS.map(p => {
      const pt = [ax(p.area) + p.dx, ay(p.rent), 0];
      const halo = new M.Dot({ point: pt, radius: 0.20, color: p.color }); halo.setFill(p.color, 0.20);
      const d = new M.Dot({ point: pt, radius: 0.095, color: p.color });
      return new M.VGroup(halo, d);
    });
  }

  function makeLine(intercept, slope, color = '#ffffff', strokeWidth = 3.5) {
    let a1 = AMIN + 2, a2 = AMAX - 2;
    let r1 = intercept + slope * a1, r2 = intercept + slope * a2;
    if (slope !== 0) {
      if (r1 < RMIN + 10) { r1 = RMIN + 10; a1 = (r1 - intercept) / slope; }
      if (r1 > RMAX - 10) { r1 = RMAX - 10; a1 = (r1 - intercept) / slope; }
      if (r2 < RMIN + 10) { r2 = RMIN + 10; a2 = (r2 - intercept) / slope; }
      if (r2 > RMAX - 10) { r2 = RMAX - 10; a2 = (r2 - intercept) / slope; }
    }
    return new M.Line({ start: [ax(a1), ay(r1), 0], end: [ax(a2), ay(r2), 0], color, strokeWidth });
  }

  function makeStick(pt, intercept, slope, color, strokeWidth = 2.6) {
    const px = ax(pt.area) + pt.dx;
    const yDot = ay(pt.rent), yFit = ay(intercept + slope * pt.area);
    const tiny = Math.abs(yDot - yFit) < 0.006;
    const l = new M.Line({
      start: [px, yFit, 0],
      end: [px, tiny ? yFit + 0.006 : yDot, 0],
      color,
      strokeWidth: tiny ? 0.5 : strokeWidth,
    });
    if (tiny) l.setStrokeOpacity(0);
    return l;
  }

  function makeSquare(pt, intercept, slope, color, fillOp = 0.32) {
    const px = ax(pt.area) + pt.dx;
    const yDot = ay(pt.rent), yFit = ay(intercept + slope * pt.area);
    const h = Math.abs(yDot - yFit);
    const dir = slope === 0 ? (pt.area <= 60 ? 1 : -1) : pt.dir;
    const s = Math.max(0.01, h);
    const r = new M.Rectangle({ width: s, height: s, color, strokeWidth: h < 0.006 ? 0.5 : 1.6 });
    r.setFill(color, h < 0.006 ? 0 : fillOp);
    if (h < 0.006) r.setStrokeOpacity(0);
    r.moveTo([px + dir * s / 2, (yDot + yFit) / 2, 0]);
    return r;
  }

  function makeCentre(labelText = '') {
    const pt = [ax(70), ay(1100), 0];
    const halo = new M.Dot({ point: pt, radius: 0.26, color: C.green }); halo.setFill(C.green, 0.24);
    const dot = new M.Dot({ point: pt, radius: 0.11, color: C.green });
    const parts = [halo, dot];
    if (labelText) {
      const lb = T(labelText, P ? 16 : 17, C.green, true, true);
      lb.moveTo([pt[0] - 0.62, pt[1] + 0.34, 0]);
      parts.push(lb);
    }
    return { group: new M.VGroup(...parts), dot };
  }

  // 0: Many lines could be drawn through our twelve dots.
  const axes1 = buildAxes();
  const dots1 = buildDots();
  const cands = [
    makeLine(220, 12.6, C.muted, 2.2),
    makeLine(610, 7.0, C.muted, 2.2),
    makeLine(480, 9.8, C.muted, 2.2),
  ];
  cands.forEach(l => l.setStrokeOpacity(0.55));
  await until(S(0));
  await play(
    new M.FadeIn(axes1, { runTime: 0.7 }),
    new M.LaggedStart(dots1.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.0 }),
    new M.LaggedStart(cands.map(l => new M.Create(l)), { lagRatio: 0.22, runTime: 1.4 }),
    ...say('MANY POSSIBLE LINES')
  );

  // 1: Why did we pick rent equals four hundred plus ten times the area?
  const fitLine = makeLine(400, 10, '#ffffff', 3.5);
  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...cands), { runTime: 0.6 }),
    new M.Create(fitLine, { runTime: 1.1 }),
    ...say('WHY RENT = 400 + 10 × AREA?', C.amber),
    ...fbox([['rent = 400 + 10 × area', C.ink]])
  );

  // 2: We need a score that says how badly a line fits.
  const sticks = PTS.map(p => makeStick(p, 400, 10, p.rent > 400 + 10 * p.area ? C.green : C.pink, 2.6));
  await until(S(2));
  await play(
    new M.LaggedStart(sticks.map(st => new M.Create(st)), { lagRatio: 0.06, runTime: 1.3 }),
    ...say('SCORE: HOW BADLY DOES IT FIT?')
  );

  // 3: First idea: add up the residuals.
  await until(S(3));
  await play(
    new M.LaggedStart(sticks.map(st => new M.Indicate(st, { color: C.amber })), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('IDEA 1: ADD THE RESIDUALS', C.amber),
    ...fbox(['idea 1:', ['sum of residuals = ?', C.amber]])
  );

  // 4: But plus and minus cancel each other out.
  await until(S(4));
  await play(
    ...say('PLUS AND MINUS CANCEL', C.pink),
    ...fbox([['above: +250', C.green], ['below: −250', C.pink], ['total = 0', C.amber]], C.amber)
  );

  // 5: Look at a flat line at one thousand one hundred dollars, the overall mean rent.
  const meanTag = T('mean $1,100', P ? 16 : 17, C.amber, true, true);
  meanTag.moveTo([(ax(80) + ax(100)) / 2, ay(1100) - 0.26, 0]);
  await until(S(5));
  await play(
    new M.Transform(fitLine, makeLine(1100, 0, C.amber, 3.2), { runTime: 1.4 }),
    ...sticks.map((st, k) => new M.Transform(st, makeStick(PTS[k], 1100, 0, PTS[k].rent > 1100 ? C.green : C.pink, 2.4), { runTime: 1.4 })),
    new M.FadeIn(meanTag, { runTime: 0.9 }),
    ...say('FLAT LINE AT $1,100 (MEAN)', C.amber),
    ...fbox(['flat line: rent = 1,100', ['ignores area', C.muted]], C.amber)
  );

  // 6: Its residuals also add up to zero.
  await until(S(6));
  await play(
    ...say('ALSO ADDS UP TO ZERO', C.pink),
    ...fbox(['flat line ($1,100):', ['above: +1,200', C.green], ['below: −1,200', C.pink], ['total = 0', C.amber]], C.pink)
  );

  // 7: Yet that flat line ignores area completely. So the plain total is not a good score.
  await until(S(7));
  await play(
    new M.LaggedStart(sticks.map(st => new M.Indicate(st, { color: C.pink })), { lagRatio: 0.06, runTime: 1.6 }),
    ...say('PLAIN TOTAL IS NOT A GOOD SCORE', C.pink),
    ...fbox(['fitted line total = 0', 'flat line total   = 0', ['plain total fails', C.pink]], C.pink)
  );

  // 8: Better idea: square each residual first.
  await until(S(8));
  await play(
    new M.FadeOut(meanTag, { runTime: 0.6 }),
    new M.Transform(fitLine, makeLine(400, 10, '#ffffff', 3.5), { runTime: 1.2 }),
    ...sticks.map((st, k) => new M.Transform(st, makeStick(PTS[k], 400, 10, PTS[k].color, 2.6), { runTime: 1.2 })),
    ...say('BETTER IDEA: SQUARE EACH RESIDUAL', C.amber),
    ...fbox(['better idea:', ['square each residual', C.amber]], C.amber)
  );

  // 9: Squaring means multiplying a number by itself. A minus times a minus gives a plus.
  await until(S(9));
  await play(
    ...say('MINUS × MINUS = PLUS', C.green),
    ...fbox([['(+60) × (+60) = +3,600', C.cyan], ['(−30) × (−30) = +900', C.green]], C.green)
  );

  // 10: So every squared residual is positive, and nothing cancels.
  await until(S(10));
  await play(
    ...say('EVERY SQUARE IS POSITIVE', C.green),
    ...fbox([['every square ≥ 0', C.green], ['nothing cancels', C.ink]], C.green)
  );

  // 11: Picture each vertical stick turned into a small square, with the stick as its side.
  const sq = PTS.map(p => makeSquare(p, 400, 10, p.color, 0.34));
  await until(S(11));
  await play(
    new M.LaggedStart(sq.map(s => new M.FadeIn(s)), { lagRatio: 0.08, runTime: 1.9 }),
    ...say('EACH STICK → A SQUARE', C.amber)
  );

  // 12: Let's start with the column at forty square metres.
  const colBox = new M.RoundedRectangle({ width: P ? 1.05 : 1.12, height: PY1 - PY0 - 0.16, cornerRadius: 0.12, color: C.cyan, strokeWidth: 1.8 });
  colBox.setFill(C.cyan, 0.06); colBox.moveTo([ax(40), (PY0 + PY1) / 2, -0.005]);
  await until(S(12));
  await play(
    new M.Create(colBox, { runTime: 0.8 }),
    ...say('START WITH AREA = 40 m²', C.cyan),
    ...fbox(['column: 40 m²', ['fitted rent = $800', C.muted]])
  );

  // 13: Building X has a residual of sixty. Sixty times sixty is three thousand six hundred.
  const lbl40X = T('+60', P ? 16 : 17, C.cyan, true, true);
  lbl40X.moveTo([ax(40) + 0.38, ay(860) + 0.24, 0]);
  await until(S(13));
  await play(
    new M.Indicate(sq[0], { color: C.cyan, runTime: 1.2 }),
    new M.FadeIn(lbl40X, { runTime: 0.7 }),
    ...say('X: 60 × 60 = 3,600', C.cyan),
    ...fbox(['column: 40 m²', ['X: 860 − 800 = +60', C.cyan], ['   60 × 60 = 3,600', C.amber]])
  );

  // 14: Buildings Y and Z each have minus thirty. Each squares to nine hundred.
  const lbl40YZ = T('−30, −30', P ? 15 : 16, C.amber, true, true);
  lbl40YZ.moveTo([ax(40), ay(770) - 0.32, 0]);
  await until(S(14));
  await play(
    new M.Indicate(sq[1], { color: C.amber, runTime: 1.1 }),
    new M.Indicate(sq[2], { color: C.pink, runTime: 1.1 }),
    new M.FadeIn(lbl40YZ, { runTime: 0.7 }),
    ...say('Y & Z: (−30)² = 900 EACH', C.amber),
    ...fbox(['column: 40 m²', ['Y: (−30)² = 900', C.amber], ['Z: (−30)² = 900', C.pink]], C.amber)
  );

  // 15: That column adds up to five thousand four hundred.
  const colSpecs = [
    ['5,400', ax(40), ay(990)],
    ['5,600', ax(60), ay(1170)],
    ['6,200', ax(80), ay(1375)],
    ['7,800', ax(100), ay(1210)],
  ];
  const colTotals = colSpecs.map(([txt, x, y]) => {
    const t = T(txt, P ? 17 : 18, C.amber, true, true);
    t.moveTo([x, y, 0]);
    return t;
  });
  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(lbl40X, lbl40YZ), { runTime: 0.5 }),
    new M.FadeIn(colTotals[0], { runTime: 0.7 }),
    ...say('40 m² COLUMN = 5,400', C.amber),
    ...fbox(['40 m² column:', '3,600 + 900 + 900', ['= 5,400', C.amber]], C.amber)
  );

  // 16: The other three columns give five thousand six hundred, six thousand two hundred, and seven thousand eight hundred.
  await until(S(16));
  await play(
    new M.FadeOut(colBox, { runTime: 0.5 }),
    new M.LaggedStart([colTotals[1], colTotals[2], colTotals[3]].map(t => new M.FadeIn(t)), { lagRatio: 0.55, runTime: 2.6 }),
    ...say('THE OTHER THREE COLUMNS', C.cyan),
    ...fbox(['40 m²:  5,400', '60 m²:  5,600', '80 m²:  6,200', '100 m²: 7,800'])
  );

  // 17: All four together make twenty-five thousand.
  await until(S(17));
  await play(
    new M.LaggedStart(colTotals.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.1, runTime: 1.2 }),
    ...say('ALL FOUR TOGETHER = 25,000', C.amber),
    ...fbox(['5,400 + 5,600', '+ 6,200 + 7,800', ['= 25,000', C.amber]], C.amber)
  );

  // 18: This is called the sum of squared residuals.
  await until(S(18));
  await play(
    ...say('SUM OF SQUARED RESIDUALS', C.green),
    ...fbox(['sum of squared', ['residuals = 25,000', C.green]], C.green)
  );

  // 19: Now try other lines, and compare their sums.
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...colTotals), { runTime: 0.6 }),
    ...say('COMPARE OTHER LINES', C.cyan),
    ...fbox([['slope 10: 25,000', C.green]])
  );

  // 20: Keep the centre of the data fixed, and tilt the line a little.
  const pivot = makeCentre('centre');
  await until(S(20));
  await play(
    new M.FadeIn(pivot.group, { runTime: 0.8 }),
    new M.Flash(pivot.dot, { color: C.green }),
    ...say('PIVOT AT CENTRE (70, 1,100)', C.green)
  );

  function tiltTo(slope, lineColor, fillOp, runTime = 1.4) {
    const ic = 1100 - slope * 70;
    return [
      new M.Transform(fitLine, makeLine(ic, slope, lineColor, 3.5), { runTime }),
      ...sticks.map((st, k) => new M.Transform(st, makeStick(PTS[k], ic, slope, PTS[k].color, 2.5), { runTime })),
      ...sq.map((s, k) => new M.Transform(s, makeSquare(PTS[k], ic, slope, PTS[k].color, fillOp), { runTime })),
    ];
  }

  // 21: A steeper line, adding twelve dollars per square metre, gives forty-nine thousand.
  await until(S(21));
  await play(
    ...tiltTo(12, C.pink, 0.07, 1.5),
    ...say('SLOPE 12 → 49,000', C.pink),
    ...fbox([['slope 10: 25,000', C.muted], ['slope 12: 49,000', C.pink]], C.pink)
  );

  // 22: A flatter line, adding eight dollars per square metre, also gives forty-nine thousand.
  await until(S(22));
  await play(
    ...tiltTo(8, C.pink, 0.07, 1.5),
    ...say('SLOPE 8 → 49,000', C.pink),
    ...fbox([['slope 10: 25,000', C.muted], ['slope 12: 49,000', C.muted], ['slope  8: 49,000', C.pink]], C.pink)
  );

  // 23: The flat line at one thousand one hundred gives six hundred and twenty-five thousand.
  await until(S(23));
  await play(
    ...tiltTo(0, C.pink, 0.05, 1.5),
    ...say('FLAT LINE → 625,000', C.pink),
    ...fbox([
      ['slope 10:  25,000', C.muted],
      ['slope 12:  49,000', C.muted],
      ['slope  8:  49,000', C.muted],
      ['flat (0): 625,000', C.pink],
    ], C.pink)
  );

  // 24: Our line, at twenty-five thousand, has the smallest sum of all.
  await until(S(24));
  await play(
    ...tiltTo(10, '#ffffff', 0.34, 1.3),
    ...say('SLOPE 10: SMALLEST SUM (25,000)', C.green),
    ...fbox([
      ['slope 10:  25,000 ←', C.green],
      ['slope 12:  49,000', C.muted],
      ['slope  8:  49,000', C.muted],
      ['flat (0): 625,000', C.muted],
    ], C.green)
  );

  // 25: No other straight line does better on these twelve apartments.
  await until(S(25));
  await play(
    new M.Indicate(fitLine, { color: C.green, runTime: 1.2 }),
    ...say('NO STRAIGHT LINE DOES BETTER', C.green)
  );

  // 26: Choosing the line with the smallest sum of squared residuals is called ordinary least squares.
  await until(S(26));
  await play(
    ...say('ORDINARY LEAST SQUARES', C.amber),
    ...fbox([['ORDINARY LEAST SQUARES', C.amber], 'smallest sum of', 'squared residuals'], C.amber)
  );

  // 27: Least squares means: the least total of squares. Ordinary marks it as the basic version.
  await until(S(27));
  await play(
    ...say('LEAST = SMALLEST TOTAL OF SQUARES', C.cyan),
    ...fbox([['least squares:', C.cyan], '  least total of squares', ['ordinary:', C.muted], '  the basic version'])
  );

  // 28: In words: for each apartment, take actual minus fitted, and square it.
  await until(S(28));
  await play(
    new M.LaggedStart(sq.map(s => new M.Indicate(s, { color: C.cyan })), { lagRatio: 0.05, runTime: 1.5 }),
    ...say('FOR EACH: (ACTUAL − FITTED)²', C.cyan),
    ...fbox(['for each apartment:', ['(actual − fitted)²', C.cyan]])
  );

  // 29: Then choose the intercept and the slope that make the total as small as possible.
  await until(S(29));
  await play(
    new M.Indicate(fitLine, { color: C.amber, runTime: 1.1 }),
    ...say('CHOOSE INTERCEPT & SLOPE', C.amber),
    ...fbox(['minimise:', ['  sum of (actual − fitted)²', C.cyan], ['choose intercept & slope', C.amber]], C.amber)
  );

  // 30: In chapter nine, you met a loss: a number that measures how wrong a model is.
  await until(S(30));
  await play(
    ...say('LOSS = HOW WRONG A MODEL IS', C.violet),
    ...fbox([['loss:', C.violet], 'a number that measures', 'how wrong a model is'], C.violet)
  );

  // 31: This sum is that kind of loss.
  await until(S(31));
  await play(
    ...say('THIS SUM IS A LOSS', C.violet),
    ...fbox(['loss = sum of', ['  (actual − fitted)²', C.violet]], C.violet)
  );

  // 32: Picture the sum for every possible slope and intercept as a landscape shaped like a bowl.
  const bx = m => PX0 + (m - 5) / 10 * (PX1 - PX0);
  const by = loss => PY0 + loss / 180000 * (PY1 - PY0);
  const lossAt = m => 25000 + 6000 * (m - 10) * (m - 10);

  const bowlAxisParts = [
    new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 }),
    new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 }),
  ];
  for (const [lv, txt] of [[0, '0'], [50000, '50k'], [100000, '100k'], [150000, '150k']]) {
    const y = by(lv);
    if (lv > 0) {
      const gl = new M.Line({ start: [PX0, y, -0.01], end: [PX1, y, -0.01], color: C.line, strokeWidth: 1 });
      gl.setStrokeOpacity(0.5); bowlAxisParts.push(gl);
    }
    bowlAxisParts.push(new M.Line({ start: [PX0 - 0.08, y, 0], end: [PX0 + 0.04, y, 0], color: C.muted, strokeWidth: 2 }));
    const lb = T(txt, P ? 17 : 16, C.muted, true); lb.moveTo([PX0 - 0.52, y, 0]); bowlAxisParts.push(lb);
  }
  for (const m of [6, 8, 10, 12, 14]) {
    const x = bx(m);
    bowlAxisParts.push(new M.Line({ start: [x, PY0 - 0.08, 0], end: [x, PY0 + 0.04, 0], color: C.muted, strokeWidth: 2 }));
    const lb = T(String(m), P ? 18 : 17, C.muted, true); lb.moveTo([x, PY0 - 0.28, 0]); bowlAxisParts.push(lb);
  }
  const bxLab = T('slope ($ per m²)', 17, C.muted); bxLab.moveTo([PCX, PY0 - (P ? 0.64 : 0.60), 0]);
  const byLab = T('loss (sum of squares)', 17, C.violet); byLab.moveTo([PX0 + 1.15, PY1 + 0.25, 0]);
  bowlAxisParts.push(bxLab, byLab);
  const bowlAxes = new M.VGroup(...bowlAxisParts);

  const bowlSegs = [];
  const NSEG = 36;
  for (let i = 0; i < NSEG; i++) {
    const m1 = 5.2 + 9.6 * (i / NSEG), m2 = 5.2 + 9.6 * ((i + 1) / NSEG);
    bowlSegs.push(new M.Line({ start: [bx(m1), by(lossAt(m1)), 0], end: [bx(m2), by(lossAt(m2)), 0], color: C.violet, strokeWidth: 4 }));
  }
  const side8 = new M.Dot({ point: [bx(8), by(49000), 0], radius: 0.10, color: C.pink });
  const side12 = new M.Dot({ point: [bx(12), by(49000), 0], radius: 0.10, color: C.pink });
  const side8L = T('49k', 16, C.pink, true, true); side8L.moveTo([bx(8) - 0.45, by(49000) + 0.14, 0]);
  const side12L = T('49k', 16, C.pink, true, true); side12L.moveTo([bx(12) + 0.45, by(49000) + 0.14, 0]);
  const bowlSides = new M.VGroup(side8, side12, side8L, side12L);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(axes1, ...dots1, fitLine, ...sticks, ...sq, pivot.group), { runTime: 0.65 }),
    new M.FadeIn(bowlAxes, { runTime: 0.8 }),
    new M.LaggedStart(bowlSegs.map(s => new M.Create(s)), { lagRatio: 0.03, runTime: 1.7 }),
    new M.FadeIn(bowlSides, { runTime: 1.0 }),
    ...say('LOSS LANDSCAPE: A BOWL', C.violet),
    ...fbox(['loss by slope:', '  slope  8 → 49,000', '  slope 12 → 49,000'], C.violet)
  );

  // 33: Least squares finds the lowest point of that bowl.
  const minPt = [bx(10), by(25000), 0];
  const minHalo = new M.Dot({ point: minPt, radius: 0.28, color: C.green }); minHalo.setFill(C.green, 0.25);
  const minDot = new M.Dot({ point: minPt, radius: 0.12, color: C.green });
  const minLbl = T('25,000 (lowest)', P ? 16 : 17, C.green, true, true); minLbl.moveTo([minPt[0], minPt[1] + 0.46, 0]);
  const minGrp = new M.VGroup(minHalo, minDot, minLbl);
  await until(S(33));
  await play(
    new M.FadeIn(minGrp, { runTime: 0.7 }),
    new M.Flash(minDot, { color: C.green }),
    ...say('LOWEST POINT OF THE BOWL', C.green),
    ...fbox([['lowest point:', C.green], '  slope = 10', ['  loss  = 25,000', C.amber]], C.green)
  );

  // 34: One more fact: the least squares line always passes through the centre of the data.
  const axes2 = buildAxes();
  const dots2Grp = new M.VGroup(...buildDots());
  const fitLine2 = makeLine(400, 10, '#ffffff', 3.5);
  const centre2 = makeCentre();
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(bowlAxes, ...bowlSegs, bowlSides, minGrp), { runTime: 0.6 }),
    new M.FadeIn(axes2, { runTime: 0.8 }),
    new M.FadeIn(dots2Grp, { runTime: 0.8 }),
    new M.Create(fitLine2, { runTime: 1.0 }),
    new M.FadeIn(centre2.group, { runTime: 0.9 }),
    new M.Flash(centre2.dot, { color: C.green }),
    ...say('ALWAYS PASSES THROUGH THE CENTRE', C.green),
    ...fbox(['least squares line', 'always passes through', ['the centre of the data', C.green]], C.green)
  );

  // 35: That is why we tilted our test lines around that point.
  const gTilt1 = makeLine(260, 12, C.pink, 2.0); gTilt1.setStrokeOpacity(0.5);
  const gTilt2 = makeLine(540, 8, C.pink, 2.0); gTilt2.setStrokeOpacity(0.5);
  const ghostTilts = new M.VGroup(gTilt1, gTilt2);
  await until(S(35));
  await play(
    new M.FadeIn(ghostTilts, { runTime: 0.8 }),
    new M.Flash(centre2.dot, { color: C.amber }),
    ...say('OUR PIVOT POINT', C.cyan)
  );

  // 36: Here, that centre is the mean area, seventy square metres, and the mean rent, one thousand one hundred dollars.
  const vDash = new M.DashedLine({ start: [ax(70), ay(1100), 0], end: [ax(70), PY0, 0], color: C.cyan });
  const hDash = new M.DashedLine({ start: [ax(70), ay(1100), 0], end: [PX0, ay(1100), 0], color: C.amber });
  const lbl70 = T('70', P ? 16 : 17, C.cyan, true, true); lbl70.moveTo([ax(70), PY0 - 0.28, 0]);
  const lbl1100 = T('1,100', P ? 15 : 16, C.amber, true, true); lbl1100.moveTo([PX0 - (P ? 0.56 : 0.58), ay(1100), 0]);
  const lblCtr = T('(70, 1,100)', P ? 16 : 17, C.green, true, true); lblCtr.moveTo([ax(70) - 0.78, ay(1100) + 0.34, 0]);
  const centreLabels = new M.VGroup(lbl70, lbl1100, lblCtr);
  await until(S(36));
  await play(
    new M.FadeOut(ghostTilts, { runTime: 0.5 }),
    new M.Create(vDash, { runTime: 0.9 }),
    new M.Create(hDash, { runTime: 0.9 }),
    new M.FadeIn(centreLabels, { runTime: 0.9 }),
    ...say('CENTRE = (70 m², $1,100)', C.amber),
    ...fbox([['mean area = 70 m²', C.cyan], ['mean rent = $1,100', C.amber], ['400 + 10 × 70 = 1,100', C.green]], C.amber)
  );

  // 37: What is it for? It gives everyone the same best line, by a clear rule.
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(vDash, hDash, centreLabels, centre2.group), { runTime: 0.6 }),
    new M.Indicate(fitLine2, { color: C.green, runTime: 1.1 }),
    ...say('CLEAR RULE → SAME BEST LINE', C.green),
    ...fbox(['what is it for?', 'same data, clear rule', ['→ same best line', C.green]], C.green)
  );

  // 38: Here is the trap. Squaring makes big misses count much more than small ones.
  const sqBig = makeSquare(PTS[0], 400, 10, C.pink, 0.38);
  const sqSmall = makeSquare(PTS[1], 400, 10, C.amber, 0.38);
  const stBig = makeStick(PTS[0], 400, 10, C.pink, 2.8);
  const stSmall = makeStick(PTS[1], 400, 10, C.amber, 2.8);
  const tBig = T('60 → 3,600', P ? 15 : 16, C.pink, true, true); tBig.moveTo([ax(40) + 0.78, ay(860) + 0.24, 0]);
  const tSmall = T('30 → 900', P ? 15 : 16, C.amber, true, true); tSmall.moveTo([ax(40) - 0.15, ay(770) - 0.34, 0]);
  const trapPair = new M.VGroup(stBig, stSmall, sqSmall, tBig, tSmall);
  await until(S(38));
  await play(
    new M.FadeIn(trapPair, { runTime: 0.9 }),
    new M.FadeIn(sqBig, { runTime: 0.9 }),
    ...say('THE TRAP: BIG MISSES COST MORE', C.pink),
    ...fbox([['the trap:', C.pink], 'squaring magnifies', 'big misses'], C.pink)
  );

  // 39: A miss of sixty costs four times as much as a miss of thirty.
  const h60 = Math.abs(ay(860) - ay(800));
  const cx60 = ax(40) + h60 / 2, cy60 = (ay(860) + ay(800)) / 2;
  const quadCross = new M.VGroup(
    new M.Line({ start: [cx60 - h60 / 2, cy60, 0], end: [cx60 + h60 / 2, cy60, 0], color: C.ink, strokeWidth: 1.4 }),
    new M.Line({ start: [cx60, cy60 - h60 / 2, 0], end: [cx60, cy60 + h60 / 2, 0], color: C.ink, strokeWidth: 1.4 })
  );
  await until(S(39));
  await play(
    new M.Create(quadCross, { runTime: 0.7 }),
    new M.Indicate(sqBig, { color: C.pink, runTime: 1.0 }),
    ...say('2× MISS → 4× THE COST', C.pink),
    ...fbox(['miss 30 → 30² =   900', ['miss 60 → 60² = 3,600', C.pink], ['4× as costly!', C.pink]], C.pink)
  );

  // 40: So one strange apartment, far from the others, can pull the whole line toward it.
  // Adding one outlier at (100, 700) shifts the exact OLS line from 400 + 10x to 551.35 + 7.16x.
  const origGhost = new M.DashedLine({ start: [ax(32), ay(720), 0], end: [ax(108), ay(1480), 0], color: C.muted });
  const outPt = [ax(100), ay(700), 0];
  const outHalo = new M.Dot({ point: outPt, radius: 0.28, color: C.pink }); outHalo.setFill(C.pink, 0.26);
  const outDot = new M.Dot({ point: outPt, radius: 0.12, color: C.pink });
  const outLbl = T('outlier', P ? 16 : 17, C.pink, true, true); outLbl.moveTo([outPt[0] - 0.65, outPt[1] + 0.05, 0]);
  const outGrp = new M.VGroup(outHalo, outDot, outLbl);
  const pullArrow = new M.Arrow({ start: [ax(100), ay(1395), 0], end: [ax(100), ay(1275), 0], color: C.pink, strokeWidth: 3 });
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(trapPair, quadCross, sqBig), { runTime: 0.5 }),
    new M.FadeIn(origGhost, { runTime: 0.5 }),
    new M.FadeIn(outGrp, { runTime: 0.7 }),
    new M.Flash(outDot, { color: C.pink }),
    new M.FadeIn(pullArrow, { runTime: 0.8 }),
    new M.Transform(fitLine2, makeLine(551.35, 7.162, C.pink, 3.5), { runTime: 1.4 }),
    ...say('ONE OUTLIER PULLS THE LINE', C.pink),
    ...fbox(['1 strange apartment', 'pulls the whole line', ['slope: 10 → 7.2', C.pink]], C.pink)
  );

  // 41: In one sentence: ordinary least squares picks the line with the smallest sum of squared residuals.
  const finalSq = PTS.map(p => makeSquare(p, 400, 10, p.color, 0.34));
  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(origGhost, outGrp, pullArrow), { runTime: 0.6 }),
    new M.Transform(fitLine2, makeLine(400, 10, '#ffffff', 3.5), { runTime: 1.0 }),
    new M.LaggedStart(finalSq.map(s => new M.FadeIn(s)), { lagRatio: 0.04, runTime: 1.2 }),
    ...say('ORDINARY LEAST SQUARES', C.green),
    ...fbox([['ORDINARY LEAST SQUARES', C.green], 'smallest sum of', 'squared residuals', ['rent = 400 + 10 × area', C.amber]], C.green)
  );
}
