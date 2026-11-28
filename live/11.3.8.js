// 11.3.8 Kalman filtering. Beat i follows sentence i in lesson.json.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 2.65, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.1, 0] : [4.45, -0.2, 0];
  const BOXMAX = P ? FW - 1.0 : 4.4;

  // number line (cases)
  const NU = P ? 0.74 : 0.85;
  const NY = P ? -2.6 : -2.05;
  const nx = v => CX + (v - 54) * NU;
  // upper work area
  const ROW1 = P ? 1.4 : 0.75;
  const ROW2 = P ? 0.35 : -0.2;
  const MID = (ROW1 + ROW2) / 2;

  const point = (x, y) => [x, y, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, x0, y, color = C.ink, size = 20, mono = true) =>
    T(String(text), size, color, mono).moveTo(point(x0, y));
  const line = (x0, y0, x1, y1, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: point(x0, y0), end: point(x1, y1), color, strokeWidth });
  const rect = (x0, y, width, height, color, fill = 0.85) => {
    const shape = new M.Rectangle({ width, height, color, strokeWidth: 2 });
    shape.setFill(color, fill);
    return shape.moveTo(point(x0, y));
  };
  const dot = (x0, y, radius, color) => {
    const shape = new M.Dot({ point: point(x0, y), radius, color });
    shape.setFill(color, 1);
    return shape;
  };
  const ring = (x0, y, radius, color) => {
    const c = new M.Circle({ radius, color, strokeWidth: 3.5 });
    c.setFill(C.bg, 1);
    return c.moveTo(point(x0, y));
  };
  const arrow = (x0, x1, y, color, w = 4) => {
    const s = Math.sign(x1 - x0);
    return new M.VGroup(
      line(x0, y, x1, y, color, w),
      line(x1 - s * 0.18, y + 0.12, x1, y, color, w),
      line(x1 - s * 0.18, y - 0.12, x1, y, color, w));
  };
  const fade = object => new M.FadeIn(object, { runTime: 0.4 });
  const out = object => new M.FadeOut(object, { runTime: 0.3 });
  const draw = object => new M.Create(object, { runTime: 0.5 });
  const pulse = (object, color) => new M.Indicate(object, { color, runTime: 0.7 });

  let boxNow = null;
  function fbox(rows, color = C.cyan) {
    const size = P ? 23 : 21, rowHeight = P ? 0.46 : 0.42;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.6;
    const height = rows.length * rowHeight + 0.38;
    const card = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    card.setFill(C.card, 0.96);
    card.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo(point(
      BOXP[0] - width / 2 + 0.3 + t.getWidth() / 2,
      BOXP[1] + ((rows.length - 1) / 2 - i) * rowHeight)));
    const g = new M.VGroup(card, ...texts);
    if (width > BOXMAX) g.scale(BOXMAX / width);
    const a = [fade(g)];
    if (boxNow) a.push(out(boxNow));
    boxNow = g;
    return a;
  }

  // ---------- 0: hidden demand at North ----------
  const introC = new M.Circle({ radius: P ? 1.0 : 0.9, color: C.amber, strokeWidth: 3 });
  introC.setFill(C.card, 0.9);
  introC.moveTo(point(CX, P ? 0.6 : 0.2));
  const intro = new M.VGroup(
    introC,
    label('?', CX, P ? 0.6 : 0.2, C.amber, 48),
    label('NORTH: hidden demand', CX, P ? -0.8 : -1.0, C.amber, 22),
  );
  await until(S(0));
  await play(fade(intro), ...say('BEST GUESS OF NORTH’S HIDDEN DEMAND?'));

  // ---------- 1-5: forecast, reading, gap ----------
  const axis = [line(nx(49.3), NY, nx(58.7), NY, C.muted, 2.5)];
  for (let v = 50; v <= 58; v++) {
    axis.push(line(nx(v), NY - 0.08, nx(v), NY + 0.08, C.muted, 2));
    if (v % 2 === 0) axis.push(label(v, nx(v), NY - 0.38, v === 50 ? C.cyan : v === 58 ? C.amber : C.muted, P ? 21 : 20));
  }
  const axisG = new M.VGroup(...axis);
  const fRing = ring(nx(50), NY, 0.16, C.cyan);
  const fName = label('forecast', nx(50), NY - 0.8, C.cyan, P ? 19 : 18, false);
  const tDot = dot(nx(58), NY, 0.16, C.amber);
  const tName = label('till reading', nx(58), NY - 0.8, C.amber, P ? 19 : 18, false);

  await until(S(1));
  await play(out(intro), fade(axisG), fade(fRing), fade(fName), ...say('FORECAST: 50 CASES'));

  await until(S(2));
  await play(fade(tDot), fade(tName), ...say('NEW TILL READING: 58', C.amber));

  const seg = line(nx(50) + 0.17, NY, nx(58) - 0.17, NY, C.ink, 5);
  await until(S(3));
  await play(draw(seg), ...say('A LINE BETWEEN THE TWO DOTS', C.ink));

  const gapLabel = label('gap: 8 cases', nx(54), NY + 0.5, C.ink, P ? 22 : 21);
  await until(S(4));
  await play(fade(gapLabel), ...fbox([['58 − 50 = 8 cases', C.ink]], C.ink), ...say('8 CASES APART', C.ink));

  const qMark = label('?', nx(54), NY + 1.05, C.green, 34);
  await until(S(5));
  await play(fade(qMark), ...say('WHERE DOES THE NEW GUESS GO?', C.green));

  // ---------- 6-12: two clouds of possible misses ----------
  const CU = P ? 0.36 : 0.3;
  const fOff = [-4, -3, -2, -2, -1, -1, -0.5, 0, 0, 0.5, 1, 1, 2, 2, 3, 4];
  const tOff = [-7, -6, -4.5, -3.5, -2.5, -1.5, -1, 0, 0.5, 1.5, 2.5, 3, 4, 5, 6, 7];
  const jit = k => ((k * 37) % 5 - 2) * 0.06;
  const fCloud = new M.VGroup(...fOff.map((o, k) => dot(CX + o * CU, ROW1 + jit(k), 0.06, C.cyan)));
  const tCloud = new M.VGroup(...tOff.map((o, k) => dot(CX + o * CU, ROW2 + jit(k + 2), 0.06, C.amber)));
  const zeroLine = new M.DashedLine({ start: point(CX, ROW2 - 0.4), end: point(CX, ROW1 + 0.4), color: C.muted });
  const zeroText = label('0 = no miss', CX, ROW1 + 0.62, C.muted, 17, false);
  const rowX = P ? -3.2 : CX - 3.1;
  const fRow = label('forecast', rowX, ROW1 + (P ? 0.38 : 0), C.cyan, 18, false);
  const tRow = label('till', rowX, ROW2 + (P ? 0.38 : 0), C.amber, 18, false);
  const numX = P ? 3.45 : CX + 2.75;
  const fVar = label('4', numX, ROW1, C.cyan, 28);
  const tVar = label('12', numX, ROW2, C.amber, 28);

  await until(S(6));
  await play(out(qMark), fade(zeroLine), fade(zeroText), fade(fCloud), fade(tCloud), fade(fRow), fade(tRow),
    ...fbox([['possible misses', C.ink], ['of each source', C.ink]], C.ink),
    ...say('TWO CLOUDS OF POSSIBLE MISSES', C.ink));

  await until(S(7));
  await play(pulse(fCloud, C.cyan), ...say('TIGHT CLOUD: THE FORECAST'));

  await until(S(8));
  await play(pulse(tCloud, C.amber), ...say('WIDE CLOUD: THE TILL READING', C.amber));

  await until(S(9));
  await play(...fbox([['variance', C.violet], ['how spread out', C.ink], ['the possible errors are', C.ink]], C.violet),
    ...say('VARIANCE = HOW SPREAD OUT', C.violet));

  await until(S(10));
  await play(fade(fVar), pulse(fCloud, C.cyan), ...fbox([['forecast variance = 4', C.cyan]], C.cyan),
    ...say('FORECAST VARIANCE: 4'));

  await until(S(11));
  await play(fade(tVar), pulse(tCloud, C.amber), ...fbox([['forecast variance = 4', C.cyan], ['till variance     = 12', C.amber]], C.amber),
    ...say('TILL ERROR VARIANCE: 12', C.amber));

  await until(S(12));
  await play(new M.LaggedStart([pulse(fCloud, C.cyan), pulse(tCloud, C.amber)], { lagRatio: 0.6, runTime: 1.4 }),
    ...fbox([['one miss gives', C.ink], ['no clue to the other', C.ink], ['(independent)', C.violet]], C.violet),
    ...say('THE TWO MISSES ARE INDEPENDENT', C.violet));

  // ---------- 13-17: bars 4 and 12, share 1/4 ----------
  const BU = 0.4;
  const BH = P ? 0.55 : 0.5;
  const X0 = CX - 8 * BU;
  const barF = rect(X0 + 2 * BU, ROW1, 4 * BU, BH, C.cyan);
  const barT = rect(X0 + 6 * BU, ROW2, 12 * BU, BH, C.amber);
  const barFtxt = label('4', X0 + 2 * BU, ROW1, C.bg, 24);
  const barTtxt = label('12', X0 + 6 * BU, ROW2, C.bg, 24);
  const barTend = rect(X0 + 10 * BU, MID, 12 * BU, BH, C.amber);
  const barTtxtEnd = label('12', X0 + 10 * BU, MID, C.bg, 24);
  const barFmid = rect(X0 + 2 * BU, MID, 4 * BU, BH, C.cyan);
  const barFtxtMid = label('4', X0 + 2 * BU, MID, C.bg, 24);
  const total = label('total 16', CX, MID + BH / 2 + 0.35, C.ink, 22);

  await until(S(13));
  await play(...[zeroLine, zeroText, fCloud, tCloud, fRow, tRow, fVar, tVar].map(out),
    fade(barF), fade(barFtxt), fade(barT), fade(barTtxt),
    ...fbox([['forecast bar: 4', C.cyan], ['till bar:     12', C.amber]], C.ink),
    ...say('A BAR OF 4 BESIDE A BAR OF 12', C.ink));

  await until(S(14));
  await play(out(barF), out(barFtxt), out(barT), out(barTtxt),
    fade(barFmid), fade(barFtxtMid), fade(barTend), fade(barTtxtEnd), fade(total),
    ...fbox([['4 + 12 = 16', C.ink]], C.ink), ...say('END TO END: 16 IN TOTAL', C.ink));

  const quarters = new M.VGroup(...[1, 2, 3].map(k => new M.DashedLine({
    start: point(X0 + 4 * k * BU, MID - BH / 2 - 0.12), end: point(X0 + 4 * k * BU, MID + BH / 2 + 0.12), color: C.ink })));
  const quarterTxt = label('1/4', X0 + 2 * BU, MID - BH / 2 - 0.38, C.cyan, 24);
  await until(S(15));
  await play(draw(quarters), fade(quarterTxt), pulse(barFmid, C.cyan),
    ...fbox([['4 ÷ 16 = 1/4', C.cyan]], C.cyan), ...say('THE FORECAST’S 4 IS ONE QUARTER', C.cyan));

  await until(S(16));
  await play(pulse(quarterTxt, C.green),
    ...fbox([['move 1/4 of the way', C.green], ['toward the reading', C.amber]], C.green),
    ...say('MOVE ONE QUARTER TOWARD THE READING', C.green));

  await until(S(17));
  await play(pulse(barFmid, C.cyan),
    ...fbox([['smaller forecast bar', C.cyan], ['→ smaller share', C.green], ['  for the reading', C.amber]], C.green),
    ...say('STEADIER FORECAST, SMALLER SHARE', C.green));

  // ---------- 18-21: move a quarter of the gap ----------
  const pieces = new M.VGroup(...[52, 54, 56].map(v => line(nx(v), NY - 0.22, nx(v), NY + 0.22, C.ink, 4)));
  const firstPiece = line(nx(50) + 0.17, NY, nx(52), NY, C.green, 8);
  const pieceTxt = label('2', nx(51), NY + 0.42, C.green, 26);
  const moveArrow = arrow(nx(50), nx(52) - 0.18, NY + (P ? 0.95 : 0.8), C.green);
  const newDot = dot(nx(52), NY, 0.17, C.green);
  const newName = label('new estimate: 52', nx(52), NY + (P ? 1.45 : 1.2), C.green, P ? 21 : 21);

  await until(S(18));
  await play(out(gapLabel), draw(pieces), ...fbox([['8 cases ÷ 4 pieces', C.ink]], C.ink),
    ...say('SPLIT THE GAP INTO 4 EQUAL PIECES', C.ink));

  await until(S(19));
  await play(draw(firstPiece), fade(pieceTxt), ...fbox([['8 ÷ 4 = 2 cases', C.green]], C.green),
    ...say('ONE PIECE = 2 CASES', C.green));

  await until(S(20));
  await play(draw(moveArrow), ...fbox([['start at 50', C.cyan], ['move 2 toward 58', C.green]], C.green),
    ...say('FROM 50, MOVE 2 TOWARD 58', C.green));

  await until(S(21));
  await play(fade(newDot), fade(newName), ...fbox([['50 + 2 = 52 cases', C.green]], C.green),
    ...say('NEW ESTIMATE: 52 CASES', C.green));

  // ---------- 22-24: variance 4 -> 3 ----------
  const CW = P ? 1.1 : 1.0;
  const cells = [0, 1, 2, 3].map(k => rect(CX + (k - 1.5) * CW, MID, CW * 0.9, BH, C.cyan));
  const cellsTitle = label('forecast variance: 4', CX, MID + BH / 2 + 0.35, C.cyan, 21);
  const cellsAfter = label('updated variance: 3', CX, MID - BH / 2 - 0.4, C.green, 22);

  await until(S(22));
  await play(...[barFmid, barFtxtMid, barTend, barTtxtEnd, total, quarters, quarterTxt].map(out),
    ...cells.map(fade), fade(cellsTitle),
    ...fbox([['two independent sources', C.ink], ['→ a steadier estimate', C.green]], C.green),
    ...say('THE NEW ESTIMATE IS STEADIER', C.green));

  await until(S(23));
  await play(new M.FadeOut(cells[3], { runTime: 0.6 }),
    ...fbox([['3/4 of the variance', C.ink], ['remains', C.ink]], C.green),
    ...say('THREE QUARTERS REMAIN', C.green));

  await until(S(24));
  await play(fade(cellsAfter), ...[0, 1, 2].map(k => pulse(cells[k], C.green)),
    ...fbox([['3/4 × 4 = 3', C.green]], C.green), ...say('UPDATED VARIANCE: 3', C.green));

  // ---------- 25-29: names and formulas ----------
  await until(S(25));
  await play(...fbox([['forecast + reading', C.ink], ['→ blend, repeat', C.ink], ['Kalman filtering', C.green]], C.green),
    ...say('KALMAN FILTERING', C.green));

  await until(S(26));
  await play(pulse(firstPiece, C.green), pulse(pieceTxt, C.green),
    ...fbox([['Kalman gain', C.green], ['= the reading’s share', C.ink], ['= 1/4 here', C.green]], C.green),
    ...say('KALMAN GAIN = THE READING’S SHARE', C.green));

  await until(S(27));
  await play(...fbox([['gain = forecast variance', C.cyan], ['  ÷ (forecast variance', C.cyan], ['     + reading variance)', C.amber], ['= 4 ÷ (4 + 12) = 1/4', C.green]], C.green),
    ...say('GAIN = 4 ÷ (4 + 12)', C.green));

  await until(S(28));
  await play(pulse(newDot, C.green),
    ...fbox([['new = forecast', C.cyan], ['  + gain × gap', C.green], ['= 50 + 1/4 × 8 = 52', C.green]], C.green),
    ...say('NEW = 50 + 1/4 × 8 = 52', C.green));

  await until(S(29));
  await play(...[0, 1, 2].map(k => pulse(cells[k], C.green)),
    ...fbox([['new variance', C.green], ['= forecast variance', C.cyan], ['  × (1 − gain)', C.ink], ['= 4 × 3/4 = 3', C.green]], C.green),
    ...say('NEW VARIANCE = 4 × (1 − 1/4) = 3', C.green));

  // ---------- 30: carry forward ----------
  const nextTxt = label('next forecast starts here', nx(52), NY + (P ? 1.45 : 1.2), C.green, P ? 19 : 19, false);
  await until(S(30));
  await play(...[cells[0], cells[1], cells[2], cellsTitle, cellsAfter].map(out), out(newName), fade(nextTxt), pulse(newDot, C.green),
    ...fbox([['52 → start of the', C.green], ['next forecast', C.green]], C.green),
    ...say('CARRY 52 INTO THE NEXT FORECAST', C.green));

  // ---------- 31-32: trap ----------
  const trapF = rect(X0 + 8 * BU, MID, 16 * BU, BH, C.cyan);
  const trapTxt = label('till variance = 0 → gain = 4 ÷ 4 = 1', CX, MID + BH / 2 + 0.38, C.pink, P ? 17 : 19);
  const jumpArrow = arrow(nx(52) + 0.2, nx(58) - 0.25, NY + (P ? 0.95 : 0.8), C.pink);
  const jumpDot = ring(nx(58), NY, 0.27, C.pink);
  await until(S(31));
  await play(out(nextTxt), out(moveArrow), fade(trapF), fade(trapTxt),
    ...fbox([['trap: till never wrong', C.pink], ['till variance = 0', C.pink], ['gain = 4 ÷ (4 + 0) = 1', C.pink]], C.pink),
    ...say('TRAP: TILL VARIANCE SET TO ZERO', C.pink));

  await until(S(32));
  await play(draw(jumpArrow), draw(jumpDot),
    ...fbox([['estimate jumps to 58', C.pink], ['every wobble pulls it', C.pink]], C.pink),
    ...say('EACH WOBBLE PULLS TOO FAR', C.pink));

  // ---------- 33: recap ----------
  const recapF = rect(X0 + 2 * BU, MID, 4 * BU, BH, C.cyan);
  const recapT = rect(X0 + 10 * BU, MID, 12 * BU, BH, C.amber);
  const recapFt = label('4', X0 + 2 * BU, MID, C.bg, 24);
  const recapTt = label('12', X0 + 10 * BU, MID, C.bg, 24);
  const recapTxt = label('gain = 1/4', CX, MID + BH / 2 + 0.38, C.green, 22);
  await until(S(33));
  await play(...[trapF, trapTxt, jumpArrow, jumpDot].map(out),
    fade(recapF), fade(recapT), fade(recapFt), fade(recapTt), fade(recapTxt), fade(moveArrow),
    ...fbox([['forecast 50, reading 58', C.ink], ['gain 1/4 → estimate 52', C.green], ['variance 4 → 3', C.green]], C.green),
    ...say('MOVE TOWARD THE READING BY THE GAIN', C.green));
}
