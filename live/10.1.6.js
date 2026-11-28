// 10.1.6 R-squared: share of rent variation explained compared with guessing the mean.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Shared chapter 10.1 apartment data (exact numbers from chapters/10.1.md)
  // Building X = cyan, Y = amber, Z = pink. Tiny dx separates the two $770 apartments at area 40.
  const APTS = [
    { a: 40, r: 860, c: C.cyan, dx: 0 },
    { a: 40, r: 770, c: C.amber, dx: -0.13 },
    { a: 40, r: 770, c: C.pink, dx: 0.13 },
    { a: 60, r: 1040, c: C.cyan, dx: 0 },
    { a: 60, r: 1020, c: C.amber, dx: 0 },
    { a: 60, r: 940, c: C.pink, dx: 0 },
    { a: 80, r: 1250, c: C.cyan, dx: 0 },
    { a: 80, r: 1210, c: C.amber, dx: 0 },
    { a: 80, r: 1140, c: C.pink, dx: 0 },
    { a: 100, r: 1470, c: C.cyan, dx: 0 },
    { a: 100, r: 1380, c: C.amber, dx: 0 },
    { a: 100, r: 1350, c: C.pink, dx: 0 },
  ];
  const MEAN_R = 1100;
  const fitRent = a => 400 + 10 * a;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 2.15, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.15, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Scatter plot frame
  const XL = P ? -2.35 : -5.5, XR = P ? 3.35 : 0.9;
  const YB = P ? -4.55 : -2.35, YT = P ? 1.15 : 1.35;
  const ax = a => XL + (a - 30) / 80 * (XR - XL);
  const ay = r => YB + (r - 600) / 1000 * (YT - YB);
  const pt = d => [ax(d.a) + d.dx, ay(d.r), 0];

  // One formula box at a time: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.40 : 0.42;
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
    const maxw = P ? FW - 0.9 : 4.5;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // Helpers to build reusable axes, lines, sticks and bars (never reuse faded-out mobjects)
  function makeYAxis() {
    const parts = [new M.Line({ start: [XL, YB, 0], end: [XL, YT, 0], color: C.muted, strokeWidth: 2.5 })];
    for (const r of [800, 1000, 1200, 1400]) {
      const y = ay(r);
      parts.push(
        new M.Line({ start: [XL - 0.08, y, 0], end: [XL + 0.08, y, 0], color: C.muted, strokeWidth: 2 }),
        T(String(r), P ? 15 : 16, C.muted, true).moveTo([XL - (P ? 0.56 : 0.55), y, 0])
      );
    }
    const yLab = T('rent ($)', P ? 16 : 16, C.muted);
    yLab.moveTo([XL + 0.25, YT + 0.24, 0]);
    parts.push(yLab);
    return new M.VGroup(...parts);
  }

  function makeXAxis() {
    const parts = [new M.Line({ start: [XL, YB, 0], end: [XR, YB, 0], color: C.muted, strokeWidth: 2.5 })];
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      parts.push(
        new M.Line({ start: [x, YB - 0.08, 0], end: [x, YB + 0.08, 0], color: C.muted, strokeWidth: 2 }),
        T(String(a), P ? 15 : 16, C.muted, true).moveTo([x, YB - 0.30, 0])
      );
    }
    const xLab = T('area (m²)', P ? 16 : 16, C.muted);
    xLab.moveTo([(XL + XR) / 2, YB - (P ? 0.68 : 0.58), 0]);
    parts.push(xLab);
    return new M.VGroup(...parts);
  }

  function makeLegend() {
    const items = [['X', C.cyan], ['Y', C.amber], ['Z', C.pink]];
    const parts = [];
    const baseX = XR - (P ? 2.15 : 2.1), baseY = YB + 0.34;
    items.forEach(([name, col], i) => {
      const x = baseX + i * 0.78;
      const d = new M.Dot({ point: [x, baseY, 0], radius: 0.08, color: col }); d.setFill(col, 1);
      const t = T(name, 15, col, true, true); t.moveTo([x + 0.24, baseY, 0]);
      parts.push(d, t);
    });
    return new M.VGroup(...parts);
  }

  function makeFitLine() {
    return new M.Line({
      start: [ax(34), ay(fitRent(34)), 0],
      end: [ax(106), ay(fitRent(106)), 0],
      color: C.ink,
      strokeWidth: 3.5,
    });
  }

  // Build initial scatter objects
  const yAxis = makeYAxis();
  const xAxis = makeXAxis();
  const legend = makeLegend();
  const fitLine = makeFitLine();
  const dots = APTS.map(d => {
    const p = pt(d);
    const halo = new M.Dot({ point: p, radius: 0.21, color: d.c }); halo.setFill(d.c, 0.16);
    const dot = new M.Dot({ point: p, radius: 0.095, color: d.c }); dot.setFill(d.c, 1);
    return new M.VGroup(halo, dot);
  });

  // 0: "How good is our line, overall?"
  await until(S(0));
  await play(
    new M.FadeIn(yAxis, { runTime: 0.7 }),
    new M.FadeIn(xAxis, { runTime: 0.7 }),
    new M.FadeIn(legend, { runTime: 0.7 }),
    new M.LaggedStart(dots.map(g => new M.FadeIn(g)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.Create(fitLine, { runTime: 1.1 }),
    ...say('HOW GOOD IS OUR LINE?')
  );

  // 1: "To judge it, we need something to compare it with."
  await until(S(1));
  await play(
    new M.Indicate(fitLine, { color: C.amber, runTime: 1.2 }),
    ...say('WE NEED A COMPARISON', C.amber)
  );

  // 2: "Imagine a renter who knows nothing about area."
  await until(S(2));
  await play(
    new M.FadeOut(fitLine, { runTime: 0.7 }),
    new M.FadeOut(xAxis, { runTime: 0.7 }),
    ...say('NO AREA INFORMATION', C.muted)
  );

  // 3: "Their best single guess for every apartment is the mean rent: one thousand one hundred dollars."
  const yMean = ay(MEAN_R);
  const meanDot = new M.Dot({ point: [XL, yMean, 0], radius: 0.10, color: C.amber }); meanDot.setFill(C.amber, 1);
  const meanLbl = T('1,100', P ? 17 : 17, C.amber, true, true); meanLbl.moveTo([XL + 0.45, yMean + 0.24, 0]);
  const meanTick = new M.VGroup(meanDot, meanLbl);
  await until(S(3));
  await play(
    new M.FadeIn(meanTick, { runTime: 0.7 }),
    new M.Flash(meanDot, { color: C.amber, runTime: 0.9 }),
    ...fbox([['mean rent = $1,100', C.amber], ['best single guess', C.muted]], C.amber),
    ...say('BEST GUESS = MEAN RENT ($1,100)', C.amber)
  );

  // 4: "This guess is called the baseline. Draw it as a flat line."
  const baseLine = new M.DashedLine({ start: [XL, yMean, 0], end: [XR, yMean, 0], color: C.amber, strokeWidth: 3 });
  const baseTag = pill('BASELINE', C.amber, 14);
  baseTag.moveTo([ax(65), yMean + 0.30, 0]);
  await until(S(4));
  await play(
    new M.Create(baseLine, { runTime: 1.2 }),
    new M.FadeIn(baseTag, { runTime: 0.8 }),
    ...say('BASELINE = FLAT LINE AT $1,100', C.amber)
  );

  // 5: "Each apartment now has a stick to the flat line."
  const baseSticks = APTS.map(d => {
    const x = ax(d.a) + d.dx;
    return new M.Line({ start: [x, ay(d.r), 0], end: [x, yMean, 0], color: C.pink, strokeWidth: 2.2 });
  });
  await until(S(5));
  await play(
    new M.LaggedStart(baseSticks.map(l => new M.Create(l)), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('EACH APARTMENT: STICK TO FLAT LINE', C.pink)
  );

  // 6: "For example, a seven hundred and seventy dollar apartment sits three hundred and thirty below it."
  const exIdx = 1; // Building Y, area 40, rent $770
  const exApt = APTS[exIdx];
  const exX = ax(exApt.a) + exApt.dx, exY = ay(exApt.r);
  const hiStick = new M.Line({ start: [exX, exY, 0], end: [exX, yMean, 0], color: C.amber, strokeWidth: 4.5 });
  const exLabel = T('−330', P ? 18 : 18, C.amber, true, true);
  exLabel.moveTo([ax(40) + 0.56, (exY + yMean) / 2, 0]);
  await until(S(6));
  await play(
    new M.Create(hiStick, { runTime: 0.8 }),
    new M.Flash(dots[exIdx].submobjects[1], { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(exLabel, { runTime: 0.7 }),
    ...fbox(['apartment: $770', 'baseline:  $1,100', ['stick:     −$330', C.amber]], C.amber),
    ...say('$770 SITS $330 BELOW $1,100', C.amber)
  );

  // 7: "Three hundred and thirty squared is one hundred and eight thousand, nine hundred."
  const dxStep = ax(60) - ax(40);
  const exH = Math.abs(yMean - exY);
  const exSide = Math.min(exH, dxStep * 0.66);
  const exSq = new M.Rectangle({ width: exSide, height: exH, color: C.pink, strokeWidth: 2 });
  exSq.setFill(C.pink, 0.24);
  exSq.moveTo([ax(40) + 0.16 + exSide / 2, (exY + yMean) / 2, 0]);
  const exSqLbl = T('330²', P ? 17 : 17, C.pink, true, true);
  exSqLbl.moveTo([ax(40) + 0.16 + exSide / 2, (exY + yMean) / 2, 0]);
  await until(S(7));
  await play(
    new M.FadeOut(exLabel, { runTime: 0.4 }),
    new M.FadeIn(exSq, { runTime: 0.8 }),
    new M.FadeIn(exSqLbl, { runTime: 0.8 }),
    ...fbox(['stick:    330', 'squared:  330 × 330', ['        = 108,900', C.pink]], C.pink),
    ...say('330 SQUARED = 108,900', C.pink)
  );

  // 8: "Square every stick in the same way, and add them all up."
  const baseSquares = APTS.map(d => {
    const x = ax(d.a) + d.dx, y = ay(d.r), h = Math.abs(yMean - y);
    const k = APTS.filter(e => e.a === d.a).indexOf(d);
    const w = dxStep * 0.2;
    const dir = d.a === 100 ? -1 : 1;
    const sq = new M.Rectangle({ width: w, height: h, color: C.pink, strokeWidth: 1.4 });
    sq.setFill(C.pink, 0.14);
    sq.moveTo([x + dir * (0.14 + k * (w + 0.05) + w / 2), (y + yMean) / 2, 0]);
    return sq;
  });
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(hiStick, exSq, exSqLbl), { runTime: 0.45 }),
    new M.LaggedStart(baseSquares.map(sq => new M.FadeIn(sq)), { lagRatio: 0.08, runTime: 1.6 }),
    ...fbox(['square all 12 sticks', ['and add them up...', C.pink]], C.pink),
    ...say('SQUARE ALL 12 STICKS & ADD', C.pink)
  );

  // 9: "The total is six hundred and twenty-five thousand."
  await until(S(9));
  await play(
    new M.LaggedStart(baseSquares.map(sq => new M.Indicate(sq, { color: C.amber })), { lagRatio: 0.04, runTime: 1.3 }),
    ...fbox(['baseline squared sticks', ['total = 625,000', C.pink]], C.pink),
    ...say('BASELINE TOTAL = 625,000', C.pink)
  );

  // 10: "This is the total variation in rent: how much the rents spread around their mean."
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...baseSquares), { runTime: 0.7 }),
    ...fbox([['total variation', C.pink], ['(spread around mean)', C.muted], ['= 625,000', C.pink]], C.pink),
    ...say('TOTAL VARIATION = 625,000', C.pink)
  );

  // 11: "Now switch to our sloped line."
  const xAxis2 = makeXAxis();
  const fitLine2 = makeFitLine();
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(baseLine, baseTag, meanTick, ...baseSticks), { runTime: 0.6 }),
    new M.FadeIn(xAxis2, { runTime: 0.6 }),
    new M.Create(fitLine2, { runTime: 0.85 }),
    ...say('NOW SWITCH TO OUR SLOPED LINE', C.cyan)
  );

  // 12: "Its squared sticks added up to only twenty-five thousand."
  const fitSticks = APTS.map(d => {
    const x = ax(d.a) + d.dx;
    return new M.Line({ start: [x, ay(d.r), 0], end: [x, ay(fitRent(d.a)), 0], color: C.pink, strokeWidth: 2.5 });
  });
  const fitSquares = APTS.map(d => {
    const x = ax(d.a) + d.dx, y1 = ay(d.r), y2 = ay(fitRent(d.a)), h = Math.max(0.05, Math.abs(y2 - y1));
    const sq = new M.Rectangle({ width: h, height: h, color: C.pink, strokeWidth: 1.5 });
    sq.setFill(C.pink, 0.35);
    sq.moveTo([x + h / 2 + 0.03, (y1 + y2) / 2, 0]);
    return sq;
  });
  await until(S(12));
  await play(
    new M.LaggedStart(fitSticks.map(l => new M.Create(l)), { lagRatio: 0.06, runTime: 1.2 }),
    new M.LaggedStart(fitSquares.map(sq => new M.FadeIn(sq)), { lagRatio: 0.06, runTime: 1.3 }),
    ...fbox(['sloped line squares', ['leftover = 25,000', C.amber]], C.amber),
    ...say('SLOPED LINE SQUARES = 25,000', C.amber)
  );

  // 13: "So the line leaves twenty-five thousand out of six hundred and twenty-five thousand unexplained."
  // Transition from scatter plot to a literal horizontal variation bar (625,000 total, 25,000 = 4% pink slice)
  const BAR_CX = P ? 0 : -2.3;
  const BAR_Y = P ? -1.55 : -0.45;
  const BAR_W = P ? 6.2 : 5.8;
  const BAR_H = P ? 1.25 : 1.05;
  const BAR_L = BAR_CX - BAR_W / 2, BAR_R = BAR_CX + BAR_W / 2;
  const pinkW = BAR_W * 0.04, greenW = BAR_W * 0.96;

  const barBg = new M.RoundedRectangle({ width: BAR_W, height: BAR_H, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  barBg.setFill(C.card, 0.85); barBg.moveTo([BAR_CX, BAR_Y, 0]);

  const pinkRect = new M.Rectangle({ width: pinkW, height: BAR_H - 0.06, color: C.pink, strokeWidth: 1.5 });
  pinkRect.setFill(C.pink, 0.88); pinkRect.moveTo([BAR_R - pinkW / 2, BAR_Y, 0]);

  const pinkArrow = new M.Arrow({
    start: [BAR_R - pinkW / 2, BAR_Y - BAR_H / 2 - 0.72, 0],
    end: [BAR_R - pinkW / 2, BAR_Y - BAR_H / 2 - 0.08, 0],
    color: C.pink,
    strokeWidth: 2.5,
  });
  const pinkAmt = T('25,000 left', P ? 17 : 17, C.pink, true, true);
  pinkAmt.moveTo([BAR_R - 0.72, BAR_Y - BAR_H / 2 - 0.98, 0]);

  const totalLbl = T('total variation = 625,000', P ? 18 : 18, C.muted, true);
  totalLbl.moveTo([BAR_CX - 0.5, BAR_Y - BAR_H / 2 - (P ? 1.65 : 1.52), 0]);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(yAxis, xAxis2, legend, fitLine2, ...dots, ...fitSticks, ...fitSquares), { runTime: 0.6 }),
    ...say('25,000 OF 625,000 UNEXPLAINED', C.pink)
  );
  await play(
    new M.FadeIn(barBg, { runTime: 0.7 }),
    new M.FadeIn(pinkRect, { runTime: 0.8 }),
    new M.Create(pinkArrow, { runTime: 0.7 }),
    new M.FadeIn(pinkAmt, { runTime: 0.7 }),
    new M.FadeIn(totalLbl, { runTime: 0.7 }),
    ...fbox([['unexplained = 25,000', C.pink], ['total       = 625,000', C.muted]], C.pink)
  );

  // 14: "Twenty-five thousand divided by six hundred and twenty-five thousand is zero point zero four."
  const dec04 = pill('0.04', C.pink, 16);
  dec04.moveTo([BAR_R - 0.35, BAR_Y + BAR_H / 2 + 0.48, 0]);
  await until(S(14));
  await play(
    new M.FadeIn(dec04, { runTime: 0.7 }),
    new M.Indicate(pinkRect, { color: C.pink, runTime: 1.0 }),
    ...fbox(['unexplained ÷ total', '= 25,000 ÷ 625,000', ['= 0.04', C.pink]], C.pink),
    ...say('25,000 ÷ 625,000 = 0.04', C.pink)
  );

  // 15: "That is four hundredths, or four percent, left over."
  const tickParts = [];
  for (let k = 1; k < 10; k++) {
    const x = BAR_L + BAR_W * (k / 10);
    tickParts.push(new M.Line({ start: [x, BAR_Y - BAR_H / 2, 0], end: [x, BAR_Y - BAR_H / 2 + 0.14, 0], color: C.muted, strokeWidth: 1.5 }));
  }
  const barTicks = new M.VGroup(...tickParts);
  const pct4 = pill('4% LEFT', C.pink, 16);
  pct4.moveTo([BAR_R - 0.55, BAR_Y + BAR_H / 2 + 0.48, 0]);
  await until(S(15));
  await play(
    new M.FadeOut(dec04, { runTime: 0.4 }),
    new M.FadeIn(pct4, { runTime: 0.6 }),
    new M.FadeIn(barTicks, { runTime: 0.7 }),
    ...fbox(['0.04 = 4 / 100', ['     = 4% left over', C.pink]], C.pink),
    ...say('4% LEFT OVER', C.pink)
  );

  // 16: "So the line explains the other ninety-six percent."
  const greenRect = new M.Rectangle({ width: greenW - 0.04, height: BAR_H - 0.06, color: C.green, strokeWidth: 1.5 });
  greenRect.setFill(C.green, 0.78); greenRect.moveTo([BAR_L + greenW / 2, BAR_Y, 0]);
  const greenLbl = T('96% explained', P ? 24 : 24, C.bg, true, true);
  greenLbl.moveTo([BAR_L + greenW / 2, BAR_Y, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(greenRect, { runTime: 0.9 }),
    new M.FadeIn(greenLbl, { runTime: 0.9 }),
    ...fbox([['left over:  4%', C.pink], ['explained: 96%', C.green]], C.green),
    ...say('LINE EXPLAINS THE OTHER 96%', C.green)
  );

  // 17: "This share is called R-squared."
  const r2Badge = pill('R-SQUARED = 96%', C.green, P ? 18 : 18);
  r2Badge.moveTo([BAR_L + greenW / 2 - 0.25, BAR_Y + BAR_H / 2 + 0.52, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(r2Badge, { runTime: 0.7 }),
    new M.Indicate(greenRect, { color: C.green, runTime: 1.0 }),
    ...say('THIS SHARE = R-SQUARED', C.green)
  );

  // 18: "In words: R-squared equals one, minus the leftover variation divided by the total variation."
  await until(S(18));
  await play(
    ...fbox([['R² = 1 − leftover ÷ total', C.cyan], ['   = 1 − unexplained share', C.muted]], C.cyan),
    ...say('R² = 1 − LEFTOVER ÷ TOTAL', C.cyan)
  );

  // 19: "One minus zero point zero four gives zero point nine six: ninety-six percent."
  await until(S(19));
  await play(
    new M.Indicate(r2Badge, { color: C.amber, runTime: 1.1 }),
    ...fbox(['R² = 1 − 25,000 ÷ 625,000', ['   = 1 − 0.04', C.pink], ['   = 0.96  (96%)', C.green]], C.green),
    ...say('1 − 0.04 = 0.96  (96%)', C.green)
  );

  // 20: "From the last lesson, the fitted part was six hundred thousand."
  const fitAmtLbl = T('fitted part = 600,000', P ? 17 : 17, C.green, true, true);
  fitAmtLbl.moveTo([BAR_L + greenW / 2 - 0.35, BAR_Y - BAR_H / 2 - 0.42, 0]);
  await until(S(20));
  await play(
    new M.FadeIn(fitAmtLbl, { runTime: 0.7 }),
    ...fbox([['fitted part = 600,000', C.green], ['leftover    =  25,000', C.pink], 'total       = 625,000'], C.green),
    ...say('FITTED PART = 600,000', C.green)
  );

  // 21: "Six hundred thousand out of six hundred and twenty-five thousand is also ninety-six percent."
  await until(S(21));
  await play(
    new M.Indicate(fitAmtLbl, { color: C.amber, runTime: 1.0 }),
    ...fbox(['R² = fitted ÷ total', ['   = 600,000 ÷ 625,000', C.green], ['   = 0.96  (96%)', C.amber]], C.amber),
    ...say('600,000 ÷ 625,000 = 96%', C.amber)
  );

  // 22: "For a least squares line, R-squared runs from zero to one."
  const SC_Y = P ? 0.65 : 0.85;
  const SC_L = P ? -2.9 : -5.0, SC_R = P ? 2.9 : 0.4;
  const scX = v => SC_L + v * (SC_R - SC_L);
  const scLine = new M.Line({ start: [SC_L, SC_Y, 0], end: [SC_R, SC_Y, 0], color: C.muted, strokeWidth: 3.5 });
  const scDot0 = new M.Dot({ point: [scX(0), SC_Y, 0], radius: 0.11, color: C.pink }); scDot0.setFill(C.pink, 1);
  const scDot1 = new M.Dot({ point: [scX(1), SC_Y, 0], radius: 0.11, color: C.green }); scDot1.setFill(C.green, 1);
  const scDot96 = new M.Dot({ point: [scX(0.96), SC_Y, 0], radius: 0.10, color: C.amber }); scDot96.setFill(C.amber, 1);
  const scMid = new M.Line({ start: [scX(0.5), SC_Y - 0.10, 0], end: [scX(0.5), SC_Y + 0.10, 0], color: C.muted, strokeWidth: 2 });
  const scLab0 = T('0', P ? 26 : 20, C.pink, true, true); scLab0.moveTo([scX(0), SC_Y - (P ? 0.44 : 0.36), 0]);
  const scLab5 = T('0.5', P ? 22 : 17, C.muted, true); scLab5.moveTo([scX(0.5), SC_Y - (P ? 0.42 : 0.34), 0]);
  const scLab1 = T('1', P ? 26 : 20, C.green, true, true); scLab1.moveTo([scX(1), SC_Y - (P ? 0.44 : 0.36), 0]);
  const scLab96 = T('ours: 0.96', P ? 22 : 16, C.amber, true, true); scLab96.moveTo([scX(P ? 0.80 : 0.84), SC_Y + (P ? 0.50 : 0.38), 0]);
  const scaleGrp = new M.VGroup(scLine, scMid, scDot0, scDot1, scDot96, scLab0, scLab5, scLab1, scLab96);

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(barBg, pinkRect, pinkArrow, pinkAmt, totalLbl, barTicks, pct4, greenRect, greenLbl, r2Badge, fitAmtLbl), { runTime: 0.55 }),
    ...say('R² RUNS FROM 0 TO 1', C.cyan)
  );
  await play(
    new M.FadeIn(scaleGrp, { runTime: 0.85 }),
    ...fbox(['least squares line:', ['0  ≤  R²  ≤  1', C.cyan], ['ours: 0.96', C.amber]], C.cyan)
  );

  // Helper for the two extreme mini-plots (R² = 0 and R² = 1)
  function makeMiniPlot(cx, cy, w, h, kind) {
    const col = kind === 0 ? C.pink : C.green;
    const card = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    card.setFill(C.card, 0.92); card.moveTo([cx, cy, 0]);
    const x0 = cx - w * 0.38, x1 = cx + w * 0.38;
    const y0 = cy - h * 0.28, y1 = cy + h * 0.34;
    const parts = [card];
    const xs = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9];
    if (kind === 0) {
      const ym = (y0 + y1) / 2;
      parts.push(new M.DashedLine({ start: [x0, ym, 0], end: [x1, ym, 0], color: C.amber, strokeWidth: 2.5 }));
      const offs = [0.42, -0.38, 0.32, -0.44, 0.36, -0.28];
      xs.forEach((f, i) => {
        const px = x0 + f * (x1 - x0), py = ym + offs[i] * (y1 - y0);
        parts.push(new M.Line({ start: [px, py, 0], end: [px, ym, 0], color: C.pink, strokeWidth: 1.8 }));
        const d = new M.Dot({ point: [px, py, 0], radius: 0.075, color: C.cyan }); d.setFill(C.cyan, 1);
        parts.push(d);
      });
      const lbl = T('R² = 0  (flat baseline)', P ? 15 : 15, C.pink, true, true);
      lbl.moveTo([cx, cy - h / 2 - 0.28, 0]);
      parts.push(lbl);
    } else {
      parts.push(new M.Line({ start: [x0, y0, 0], end: [x1, y1, 0], color: C.ink, strokeWidth: 2.5 }));
      xs.forEach(f => {
        const px = x0 + f * (x1 - x0), py = y0 + f * (y1 - y0);
        const d = new M.Dot({ point: [px, py, 0], radius: 0.075, color: C.green }); d.setFill(C.green, 1);
        parts.push(d);
      });
      const lbl = T('R² = 1  (dots on line)', P ? 15 : 15, C.green, true, true);
      lbl.moveTo([cx, cy - h / 2 - 0.28, 0]);
      parts.push(lbl);
    }
    return new M.VGroup(...parts);
  }

  const miniW = P ? 2.85 : 2.55, miniH = P ? 2.35 : 1.9;
  const miniY = P ? -2.2 : -1.35;
  const mini0 = makeMiniPlot(P ? -1.65 : -3.85, miniY, miniW, miniH, 0);
  const mini1 = makeMiniPlot(P ? 1.65 : -0.75, miniY, miniW, miniH, 1);

  // 23: "Zero means the line does no better than the flat baseline."
  await until(S(23));
  await play(
    new M.Flash(scDot0, { color: C.pink, runTime: 0.9 }),
    new M.FadeIn(mini0, { runTime: 0.8 }),
    ...fbox([['R² = 0', C.pink], 'same as flat baseline', '0% explained'], C.pink),
    ...say('R² = 0: NO BETTER THAN BASELINE', C.pink)
  );

  // 24: "One means every dot sits exactly on the line."
  await until(S(24));
  await play(
    new M.Flash(scDot1, { color: C.green, runTime: 0.9 }),
    new M.FadeIn(mini1, { runTime: 0.8 }),
    ...fbox([['R² = 1', C.green], 'every dot on the line', '100% explained'], C.green),
    ...say('R² = 1: EVERY DOT ON THE LINE', C.green)
  );

  // 25: "What is it for? It tells you how much of the spread in rent the line accounts for."
  const CMP_W = P ? 5.9 : 5.5, CMP_H = P ? 0.92 : 0.78;
  const CMP_L = BAR_CX - CMP_W / 2, CMP_R = BAR_CX + CMP_W / 2;
  const lineBarY = P ? -2.55 : -1.35;
  const baseBarY = P ? -0.35 : 0.35;

  const cmpLineBg = new M.RoundedRectangle({ width: CMP_W, height: CMP_H, cornerRadius: 0.08, color: C.muted, strokeWidth: 1.5 });
  cmpLineBg.setFill(C.card, 0.9); cmpLineBg.moveTo([BAR_CX, lineBarY, 0]);
  const cmpLineG = new M.Rectangle({ width: CMP_W * 0.96 - 0.03, height: CMP_H - 0.06, color: C.green, strokeWidth: 1 });
  cmpLineG.setFill(C.green, 0.8); cmpLineG.moveTo([CMP_L + CMP_W * 0.48, lineBarY, 0]);
  const cmpLineP = new M.Rectangle({ width: CMP_W * 0.04, height: CMP_H - 0.06, color: C.pink, strokeWidth: 1 });
  cmpLineP.setFill(C.pink, 0.88); cmpLineP.moveTo([CMP_R - CMP_W * 0.02, lineBarY, 0]);
  const cmpLineTitle = T('Our sloped line: 96% of spread explained', P ? 17 : 17, C.green, false, true);
  cmpLineTitle.moveTo([BAR_CX, lineBarY + CMP_H / 2 + 0.32, 0]);
  const cmpLineIn = T('96% explained', P ? 20 : 20, C.bg, true, true);
  cmpLineIn.moveTo([CMP_L + CMP_W * 0.48, lineBarY, 0]);
  const cmpLineGrp = new M.VGroup(cmpLineBg, cmpLineG, cmpLineP, cmpLineTitle, cmpLineIn);

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(scaleGrp, mini0, mini1), { runTime: 0.55 }),
    ...say('HOW MUCH RENT SPREAD IS EXPLAINED', C.green)
  );
  await play(
    new M.FadeIn(cmpLineGrp, { runTime: 0.85 }),
    ...fbox(['what it is for:', ['share of rent spread', C.green], ['accounted for = 96%', C.amber]], C.green)
  );

  // 26: "So you can compare it fairly with the plain mean guess."
  const cmpBaseBg = new M.RoundedRectangle({ width: CMP_W, height: CMP_H, cornerRadius: 0.08, color: C.pink, strokeWidth: 1.5 });
  cmpBaseBg.setFill(C.pink, 0.72); cmpBaseBg.moveTo([BAR_CX, baseBarY, 0]);
  const cmpBaseTitle = T('Plain mean guess ($1,100): 0% explained', P ? 17 : 17, C.pink, false, true);
  cmpBaseTitle.moveTo([BAR_CX, baseBarY + CMP_H / 2 + 0.32, 0]);
  const cmpBaseIn = T('100% unexplained (625,000)', P ? 18 : 18, C.bg, true, true);
  cmpBaseIn.moveTo([BAR_CX, baseBarY, 0]);
  const cmpBaseGrp = new M.VGroup(cmpBaseBg, cmpBaseTitle, cmpBaseIn);

  await until(S(26));
  await play(
    new M.FadeIn(cmpBaseGrp, { runTime: 0.85 }),
    ...say('FAIR COMPARISON WITH MEAN GUESS', C.amber)
  );

  // 27: "Here is the trap. R-squared is a share, not dollars."
  const cardY = P ? -1.4 : -0.45, cardW = P ? 2.95 : 2.65, cardH = P ? 2.4 : 2.15;
  const cLeftX = P ? -1.7 : -3.85, cRightX = P ? 1.7 : -0.75;

  const rShare = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
  rShare.setFill(C.card, 0.94); rShare.moveTo([cLeftX, cardY, 0]);
  const tShareBig = T('96%', P ? 36 : 36, C.green, true, true); tShareBig.moveTo([cLeftX, cardY + 0.32, 0]);
  const tShareSub = T('a share  ✓', P ? 18 : 18, C.green, false, true); tShareSub.moveTo([cLeftX, cardY - 0.52, 0]);
  const cardShare = new M.VGroup(rShare, tShareBig, tShareSub);

  const rDol = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.pink, strokeWidth: 2.5 });
  rDol.setFill(C.card, 0.94); rDol.moveTo([cRightX, cardY, 0]);
  const tDolBig = T('$ ??', P ? 36 : 36, C.pink, true, true); tDolBig.moveTo([cRightX, cardY + 0.32, 0]);
  const tDolSub = T('not dollars  ✕', P ? 18 : 18, C.pink, false, true); tDolSub.moveTo([cRightX, cardY - 0.52, 0]);
  const cardDollar = new M.VGroup(rDol, tDolBig, tDolSub);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(cmpLineGrp, cmpBaseGrp), { runTime: 0.55 }),
    ...say('TRAP: A SHARE, NOT DOLLARS', C.pink)
  );
  await play(
    new M.FadeIn(cardShare, { runTime: 0.75 }),
    new M.FadeIn(cardDollar, { runTime: 0.75 }),
    ...fbox([['trap 1:', C.pink], ['R² = 96%  (a share)', C.green], ['not a dollar error', C.pink]], C.pink)
  );

  // 28: "Ninety-six percent does not tell you how many dollars a guess can be off."
  const dollarNote = pill('OFF BY $50? OR $500? R² CANNOT SAY', C.pink, P ? 15 : 15);
  dollarNote.moveTo([BAR_CX, cardY - cardH / 2 - 0.65, 0]);
  await until(S(28));
  await play(
    new M.Indicate(cardDollar, { color: C.pink, runTime: 1.0 }),
    new M.FadeIn(dollarNote, { runTime: 0.7 }),
    ...fbox(['R² = 96% alone:', ['off by $50? or $500?', C.pink], ['R² cannot tell you', C.muted]], C.pink),
    ...say('DOES NOT TELL DOLLARS OFF', C.pink)
  );

  // 29: "It also does not prove that a bigger area causes a higher rent."
  const causeY = P ? -1.45 : -0.4;
  const bW = P ? 2.35 : 2.1, bH = P ? 1.05 : 0.95;
  const bLX = P ? -2.1 : -4.25, bRX = P ? 2.1 : -0.35;
  const boxA = new M.RoundedRectangle({ width: bW, height: bH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  boxA.setFill(C.card, 0.94); boxA.moveTo([bLX, causeY, 0]);
  const txtA = T('bigger area', P ? 18 : 18, C.cyan, false, true); txtA.moveTo([bLX, causeY, 0]);

  const boxB = new M.RoundedRectangle({ width: bW, height: bH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  boxB.setFill(C.card, 0.94); boxB.moveTo([bRX, causeY, 0]);
  const txtB = T('higher rent', P ? 18 : 18, C.cyan, false, true); txtB.moveTo([bRX, causeY, 0]);

  const arr = new M.Arrow({ start: [bLX + bW / 2 + 0.1, causeY, 0], end: [bRX - bW / 2 - 0.1, causeY, 0], color: C.muted, strokeWidth: 3 });
  const xMid = (bLX + bRX) / 2;
  const cross1 = new M.Line({ start: [xMid - 0.28, causeY - 0.28, 0], end: [xMid + 0.28, causeY + 0.28, 0], color: C.pink, strokeWidth: 4.5 });
  const cross2 = new M.Line({ start: [xMid - 0.28, causeY + 0.28, 0], end: [xMid + 0.28, causeY - 0.28, 0], color: C.pink, strokeWidth: 4.5 });
  const causeNote = pill('CLOSE FIT ≠ PROOF OF CAUSE', C.pink, 16);
  causeNote.moveTo([BAR_CX, causeY - 1.25, 0]);
  const causeGrp = new M.VGroup(boxA, txtA, boxB, txtB, arr, cross1, cross2, causeNote);

  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(cardShare, cardDollar, dollarNote), { runTime: 0.55 }),
    ...say('HIGH R² DOES NOT PROVE CAUSE', C.pink)
  );
  await play(
    new M.FadeIn(causeGrp, { runTime: 0.85 }),
    ...fbox([['trap 2:', C.pink], ['high R² = close fit', C.cyan], ['not proof of cause', C.pink]], C.pink)
  );

  // 30: "In one sentence: R-squared is the share of rent variation that the line explains, compared with guessing the mean."
  const finBg = new M.RoundedRectangle({ width: BAR_W, height: BAR_H, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  finBg.setFill(C.card, 0.9); finBg.moveTo([BAR_CX, BAR_Y, 0]);
  const finG = new M.Rectangle({ width: greenW - 0.04, height: BAR_H - 0.06, color: C.green, strokeWidth: 1.5 });
  finG.setFill(C.green, 0.82); finG.moveTo([BAR_L + greenW / 2, BAR_Y, 0]);
  const finP = new M.Rectangle({ width: pinkW, height: BAR_H - 0.06, color: C.pink, strokeWidth: 1.5 });
  finP.setFill(C.pink, 0.9); finP.moveTo([BAR_R - pinkW / 2, BAR_Y, 0]);
  const finIn = T('96% explained', P ? 24 : 24, C.bg, true, true); finIn.moveTo([BAR_L + greenW / 2, BAR_Y, 0]);
  const finTop = pill('R² = 96%  (0.96)', C.amber, 20); finTop.moveTo([BAR_CX, BAR_Y + BAR_H / 2 + 0.65, 0]);
  const finSub = T('compared with guessing the mean ($1,100)', P ? 16 : 16, C.muted);
  finSub.moveTo([BAR_CX, BAR_Y - BAR_H / 2 - 0.52, 0]);
  const finGrp = new M.VGroup(finBg, finG, finP, finIn, finTop, finSub);

  await until(S(30));
  await play(
    new M.FadeOut(causeGrp, { runTime: 0.55 }),
    ...say('R² = SHARE EXPLAINED VS. MEAN', C.amber)
  );
  await play(
    new M.FadeIn(finGrp, { runTime: 0.9 }),
    ...fbox([['R² = 1 − leftover ÷ total', C.cyan], '   = 1 − 25,000 ÷ 625,000', ['   = 0.96  (96%)', C.amber]], C.amber)
  );
}
