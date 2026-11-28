// 3.1.10 Long and wide forms (live manim-web lesson).
// Beat i = sentence i (0-based, 40 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 3.1.10 data (fixed)
  const MONTHS = ['Jan', 'Feb', 'Mar'];
  const NORTH = [90, 110, 100];
  const SOUTH = [40, 60, 50];
  const LONG_ROWS = [
    ['North', 'Jan', '90', C.cyan],
    ['North', 'Feb', '110', C.cyan],
    ['North', 'Mar', '100', C.cyan],
    ['South', 'Jan', '40', C.pink],
    ['South', 'Feb', '60', C.pink],
    ['South', 'Mar', '50', C.pink],
  ];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 3.95, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.15, 0] : [-3.35, -1.80, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);

  // Wide table geometry (4 cols: Store, Jan, Feb, Mar; + optional Apr col in beat 36)
  const WCW = P ? [1.50, 1.20, 1.20, 1.20] : [1.35, 1.05, 1.05, 1.05];
  const W_TOTAL_W = WCW.reduce((a, b) => a + b, 0);
  const WX0 = P ? -W_TOTAL_W / 2 : -5.6;
  const WRH = P ? 0.50 : 0.54;
  const WT = P ? 3.10 : 1.32;
  const wColLeft = c => WX0 + WCW.slice(0, c).reduce((a, b) => a + b, 0);
  const wColX = c => wColLeft(c) + (c < WCW.length ? WCW[c] : WCW[3]) / 2;
  const wRowY = r => WT - (r + 0.5) * WRH; // r=0 header, 1 North, 2 South
  const WCX = WX0 + W_TOTAL_W / 2;

  // Long table geometry (3 cols: Store, Month, Sales; 1 header + 6 rows, +2 April rows in beat 37)
  const LCW = P ? [1.95, 1.95, 1.95] : [1.80, 1.70, 1.70];
  const L_TOTAL_W = LCW.reduce((a, b) => a + b, 0);
  const LX0 = P ? -L_TOTAL_W / 2 : 0.70;
  const LRH = P ? 0.42 : 0.44;
  const LT = P ? 0.35 : 1.32;
  const lColLeft = c => LX0 + LCW.slice(0, c).reduce((a, b) => a + b, 0);
  const lColX = c => lColLeft(c) + LCW[c] / 2;
  const lRowY = r => LT - (r + 0.5) * LRH; // r=0 header, 1..6 data, 7..8 April
  const LCX = LX0 + L_TOTAL_W / 2;

  const FS_HDR = P ? 16 : 17;
  const FS_VAL = P ? 16 : 18;
  const FS_LVAL = P ? 15 : 16;

  // Formula box helper (one box at a time)
  let boxNow = null;
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.35 })];
  }
  function fbox(lines, color = C.cyan, where = BOXP) {
    const size = P ? 19 : 18, lh = P ? 0.39 : 0.37;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(where);
    const left = where[0] - wd / 2 + 0.31, top = where[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 5.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.45 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.35 }));
    boxNow = g;
    return a;
  }

  // Primitive helpers
  function makeCell(x, y, w, h, label, {
    fill = C.card, fillOp = 0.92, stroke = C.line, strokeWidth = 1.6,
    textColor = C.ink, fontSize = FS_VAL, mono = true, bold = false
  } = {}) {
    const r = new M.Rectangle({ width: w, height: h, color: stroke, strokeWidth });
    r.setFill(fill, fillOp);
    r.moveTo([x, y, 0]);
    if (label === '' || label == null) return r;
    const t = T(String(label), fontSize, textColor, mono, bold);
    t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }

  function makeOutline(cx, cy, w, h, color, strokeWidth = 3) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth });
    r.moveTo([cx, cy, 0]);
    return r;
  }

  function makeArrow(p1, p2, color, strokeWidth = 2.6, head = 0.16) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const ang = Math.atan2(dy, dx);
    const a1 = ang + Math.PI - 0.5, a2 = ang + Math.PI + 0.5;
    const shaft = new M.Line({ start: [p1[0], p1[1], 0], end: [p2[0], p2[1], 0], color, strokeWidth });
    const w1 = new M.Line({ start: [p2[0], p2[1], 0], end: [p2[0] + head * Math.cos(a1), p2[1] + head * Math.sin(a1), 0], color, strokeWidth });
    const w2 = new M.Line({ start: [p2[0], p2[1], 0], end: [p2[0] + head * Math.cos(a2), p2[1] + head * Math.sin(a2), 0], color, strokeWidth });
    return new M.VGroup(shaft, w1, w2);
  }

  function makeLongRow(idx, vals, color) {
    const y = lRowY(idx + 1);
    const cells = vals.map((v, c) => makeCell(lColX(c), y, LCW[c], LRH, v, {
      fill: color, fillOp: 0.14, stroke: color, strokeWidth: 1.4,
      textColor: c === 2 ? color : C.ink, fontSize: FS_LVAL, mono: c === 2, bold: c === 2
    }));
    return new M.VGroup(...cells);
  }

  function buildFullWide(titleText = 'WIDE FORM') {
    const all = [];
    const title = T(titleText, P ? 16 : 17, C.amber, true, true);
    title.moveTo([WCX, WT + 0.24, 0]);
    all.push(title);
    const hdr = ['Store', ...MONTHS].map((h, c) => makeCell(wColX(c), wRowY(0), WCW[c], WRH, h, {
      fill: C.card, fillOp: 0.95, stroke: C.amber, strokeWidth: 1.6,
      textColor: c === 0 ? C.muted : C.amber, fontSize: FS_HDR, mono: false, bold: true
    }));
    all.push(...hdr);
    const rN = ['North', ...NORTH].map((v, c) => makeCell(wColX(c), wRowY(1), WCW[c], WRH, v, {
      fill: C.cyan, fillOp: 0.14, stroke: C.cyan, strokeWidth: 1.5,
      textColor: C.cyan, fontSize: FS_VAL, mono: c > 0, bold: c === 0
    }));
    const rS = ['South', ...SOUTH].map((v, c) => makeCell(wColX(c), wRowY(2), WCW[c], WRH, v, {
      fill: C.pink, fillOp: 0.14, stroke: C.pink, strokeWidth: 1.5,
      textColor: C.pink, fontSize: FS_VAL, mono: c > 0, bold: c === 0
    }));
    all.push(...rN, ...rS);
    return { title, hdr, rN, rS, all };
  }

  function buildFullLong(titleText = 'LONG FORM') {
    const all = [];
    const title = T(titleText, P ? 16 : 17, C.green, true, true);
    title.moveTo([LCX, LT + 0.22, 0]);
    all.push(title);
    const hdr = ['Store', 'Month', 'Sales'].map((h, c) => makeCell(lColX(c), lRowY(0), LCW[c], LRH, h, {
      fill: C.card, fillOp: 0.95, stroke: C.green, strokeWidth: 1.6,
      textColor: C.green, fontSize: P ? 15 : 16, mono: false, bold: true
    }));
    all.push(...hdr);
    const rows = LONG_ROWS.map((row, idx) => makeLongRow(idx, row.slice(0, 3), row[3]));
    all.push(...rows);
    return { title, hdr, rows, all };
  }

  // =========================================================================
  // 0-8: Build the wide report step by step
  // =========================================================================
  const wideShell = makeOutline(WCX, WT - 1.5 * WRH, W_TOTAL_W + 0.12, 3 * WRH + 0.12, C.muted, 2);
  let wideTitle = T('3-MONTH REPORT', P ? 16 : 17, C.cyan, true, true);
  wideTitle.moveTo([WCX, WT + 0.24, 0]);

  // empty slots are shown at once, so the report frame is never a blank box
  const wEmptySlots = [];
  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= 3; c++) {
      wEmptySlots.push(makeCell(wColX(c), wRowY(r), WCW[c], WRH, '', {
        fill: C.card, fillOp: 0.45, stroke: C.line, strokeWidth: 1.2
      }));
    }
  }
  const reportIcon = T('$', P ? 30 : 34, C.amber, true, true);
  reportIcon.moveTo([wColX(0), WT - 1.5 * WRH, 0]);
  await until(S(0));
  await play(new M.Create(wideShell, { runTime: 0.8 }), new M.FadeIn(wideTitle, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...wEmptySlots), { runTime: 0.6 }), new M.FadeIn(reportIcon, { runTime: 0.6 }),
    ...say('3-MONTH SALES REPORT'));

  // 1: two rows, one for each shop
  const wStoreHdr = makeCell(wColX(0), wRowY(0), WCW[0], WRH, 'Store', {
    stroke: C.muted, textColor: C.muted, fontSize: FS_HDR, mono: false, bold: true
  });
  const wNorthName = makeCell(wColX(0), wRowY(1), WCW[0], WRH, 'North', {
    fill: C.cyan, fillOp: 0.16, stroke: C.cyan, textColor: C.cyan, fontSize: FS_VAL, mono: false, bold: true
  });
  const wSouthName = makeCell(wColX(0), wRowY(2), WCW[0], WRH, 'South', {
    fill: C.pink, fillOp: 0.16, stroke: C.pink, textColor: C.pink, fontSize: FS_VAL, mono: false, bold: true
  });
  await until(S(1));
  await play(
    new M.FadeOut(wideShell, { runTime: 0.3 }), new M.FadeOut(reportIcon, { runTime: 0.3 }),
    new M.FadeIn(wStoreHdr, { runTime: 0.4 }),
    new M.LaggedStart([new M.FadeIn(wNorthName), new M.FadeIn(wSouthName)], { lagRatio: 0.3, runTime: 0.8 }),
    ...say('2 ROWS: ONE FOR EACH SHOP')
  );

  // 2: column for each month: Jan, Feb, Mar
  const wMonthHdrs = MONTHS.map((m, i) => makeCell(wColX(i + 1), wRowY(0), WCW[i + 1], WRH, m, {
    fill: C.card, fillOp: 0.95, stroke: C.amber, strokeWidth: 1.6,
    textColor: C.amber, fontSize: FS_HDR, mono: false, bold: true
  }));
  await until(S(2));
  await play(
    new M.LaggedStart(wMonthHdrs.map(h => new M.FadeIn(h)), { lagRatio: 0.28, runTime: 1.2 }),
    ...say('3 MONTH COLUMNS: JAN · FEB · MAR', C.amber)
  );

  // 3: North values 90, 110, 100
  const wNorthVals = NORTH.map((v, i) => makeCell(wColX(i + 1), wRowY(1), WCW[i + 1], WRH, v, {
    fill: C.cyan, fillOp: 0.16, stroke: C.cyan, strokeWidth: 1.5,
    textColor: C.cyan, fontSize: FS_VAL, mono: true, bold: true
  }));
  await until(S(3));
  await play(
    new M.LaggedStart(wNorthVals.map(c => new M.FadeIn(c)), { lagRatio: 0.32, runTime: 1.5 }),
    ...say('NORTH: 90 · 110 · 100', C.cyan)
  );

  // 4: South values 40, 60, 50
  const wSouthVals = SOUTH.map((v, i) => makeCell(wColX(i + 1), wRowY(2), WCW[i + 1], WRH, v, {
    fill: C.pink, fillOp: 0.16, stroke: C.pink, strokeWidth: 1.5,
    textColor: C.pink, fontSize: FS_VAL, mono: true, bold: true
  }));
  await until(S(4));
  await play(
    new M.LaggedStart(wSouthVals.map(c => new M.FadeIn(c)), { lagRatio: 0.32, runTime: 1.5 }),
    ...say('SOUTH: 40 · 60 · 50', C.pink)
  );

  // 5: All numbers are sales in dollars
  const unitNote = T('all values = sales ($)', P ? 14 : 15, C.muted, true);
  unitNote.moveTo([WCX, WT - 3 * WRH - 0.22, 0]);
  await until(S(5));
  await play(new M.FadeIn(unitNote, { runTime: 0.45 }), ...say('ALL NUMBERS = SALES IN DOLLARS', C.amber));

  // 6: January matches earlier: 90 for North, 40 for South
  const janBox = makeOutline(wColX(1), WT - 1.5 * WRH, WCW[1] + 0.08, 3 * WRH + 0.08, C.amber, 3);
  await until(S(6));
  await play(
    new M.Create(janBox, { runTime: 0.6 }),
    ...fbox(['January (earlier):', ['North = $90', C.cyan], ['South = $40', C.pink]], C.amber),
    ...say('JAN MATCHES EARLIER: 90 & 40', C.amber)
  );

  // 7: Easy for people to read: one shop per line, months across
  const acrossArr = makeArrow([wColLeft(1) + 0.1, WT - 3 * WRH - 0.50], [WX0 + W_TOTAL_W - 0.1, WT - 3 * WRH - 0.50], C.green, 2.5, 0.15);
  const acrossLbl = T('months across', P ? 14 : 15, C.green, true);
  acrossLbl.moveTo([(wColLeft(1) + WX0 + W_TOTAL_W) / 2, WT - 3 * WRH - 0.72, 0]);
  await until(S(7));
  await play(
    new M.FadeOut(janBox, { runTime: 0.35 }),
    ...clearBox(),
    new M.FadeIn(acrossArr, { runTime: 0.5 }),
    new M.FadeIn(acrossLbl, { runTime: 0.5 }),
    ...say('EASY FOR PEOPLE: SHOPS DOWN, MONTHS ACROSS', C.green)
  );

  // 8: Called wide form
  const wideMonthsBox = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, wRowY(0), WCW[1] + WCW[2] + WCW[3] + 0.08, WRH + 0.08, C.amber, 3);
  const wideTitle2 = T('WIDE FORM', P ? 16 : 17, C.amber, true, true);
  wideTitle2.moveTo([WCX, WT + 0.24, 0]);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(acrossArr, acrossLbl, wideTitle), { runTime: 0.4 }),
    new M.FadeIn(wideTitle2, { runTime: 0.4 }),
    new M.Create(wideMonthsBox, { runTime: 0.6 }),
    ...fbox([['WIDE FORM', C.amber], 'months spread across', 'many columns'], C.amber),
    ...say('WIDE FORM', C.amber)
  );
  wideTitle = wideTitle2;

  // =========================================================================
  // 9-10: Owner wants a line chart over time
  // =========================================================================
  const chX0 = P ? -2.35 : 1.75, chX1 = P ? 2.65 : 6.15;
  const chY0 = P ? -2.45 : -1.55, chY1 = P ? -0.15 : 0.95;
  const chX = i => chX0 + (i + 0.35) / 2.7 * (chX1 - chX0);
  const chY = v => chY0 + (v / 120) * (chY1 - chY0);

  const chAxes = new M.VGroup(
    new M.Line({ start: [chX0, chY0, 0], end: [chX1, chY0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [chX0, chY0, 0], end: [chX0, chY1, 0], color: C.muted, strokeWidth: 2 })
  );
  const chTitle = T('SALES OVER TIME', P ? 15 : 16, C.ink, true, true);
  chTitle.moveTo([(chX0 + chX1) / 2, chY1 + 0.28, 0]);
  const chTicks = [];
  MONTHS.forEach((m, i) => {
    const t = T(m, 14, C.muted, true);
    t.moveTo([chX(i), chY0 - 0.25, 0]);
    chTicks.push(t);
  });
  [0, 60, 120].forEach(v => {
    const t = T('$' + v, 13, C.muted, true);
    t.moveTo([chX0 - 0.38, chY(v), 0]);
    chTicks.push(t);
  });
  const nPts = NORTH.map((v, i) => [chX(i), chY(v), 0]);
  const sPts = SOUTH.map((v, i) => [chX(i), chY(v), 0]);
  const nLines = [
    new M.Line({ start: nPts[0], end: nPts[1], color: C.cyan, strokeWidth: 3 }),
    new M.Line({ start: nPts[1], end: nPts[2], color: C.cyan, strokeWidth: 3 })
  ];
  const sLines = [
    new M.Line({ start: sPts[0], end: sPts[1], color: C.pink, strokeWidth: 3 }),
    new M.Line({ start: sPts[1], end: sPts[2], color: C.pink, strokeWidth: 3 })
  ];
  const nDots = nPts.map(pt => new M.Dot({ point: pt, radius: 0.08, color: C.cyan }));
  const sDots = sPts.map(pt => new M.Dot({ point: pt, radius: 0.08, color: C.pink }));
  const chLegN = T('North', 14, C.cyan, true, true); chLegN.moveTo([nPts[2][0] + 0.45, nPts[2][1], 0]);
  const chLegS = T('South', 14, C.pink, true, true); chLegS.moveTo([sPts[2][0] + 0.45, sPts[2][1], 0]);
  const chartAll = [chAxes, chTitle, ...chTicks, ...nLines, ...sLines, ...nDots, ...sDots, chLegN, chLegS];

  await until(S(9));
  await play(
    new M.FadeOut(wideMonthsBox, { runTime: 0.35 }),
    ...clearBox(),
    new M.FadeIn(new M.VGroup(chAxes, chTitle, ...chTicks), { runTime: 0.55 }),
    new M.LaggedStart([...nLines.map(l => new M.Create(l)), ...sLines.map(l => new M.Create(l))], { lagRatio: 0.2, runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...nDots, ...sDots, chLegN, chLegS), { runTime: 0.5 }),
    ...say('GOAL: CHART OF SALES OVER TIME', C.cyan)
  );

  // 10: Charting & analysis tools want a different shape
  const chartBox = makeOutline((chX0 + chX1) / 2, (chY0 + chY1) / 2, chX1 - chX0 + 0.9, chY1 - chY0 + 0.95, C.violet, 2.5);
  await until(S(10));
  await play(new M.Create(chartBox, { runTime: 0.7 }), ...say('TOOLS WANT A DIFFERENT SHAPE', C.violet));

  // =========================================================================
  // 11-18: Rebuild into Long Form, one cell at a time
  // =========================================================================
  const longTitle = T('LONG FORM', P ? 16 : 17, C.green, true, true);
  longTitle.moveTo([LCX, LT + 0.22, 0]);
  const lHdrs = ['Store', 'Month', 'Sales'].map((h, c) => makeCell(lColX(c), lRowY(0), LCW[c], LRH, h, {
    fill: C.card, fillOp: 0.95, stroke: c === 0 ? C.muted : C.green, strokeWidth: 1.7,
    textColor: c === 0 ? C.ink : C.green, fontSize: P ? 15 : 16, mono: false, bold: true
  }));

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(...chartAll, chartBox), { runTime: 0.45 }),
    new M.FadeIn(longTitle, { runTime: 0.45 }),
    new M.LaggedStart(lHdrs.map(h => new M.FadeIn(h)), { lagRatio: 0.2, runTime: 0.7 }),
    ...say('ONE MONTH COL · ONE SALES COL', C.green)
  );

  // 12: Empty 6-row grid skeleton ready to fill
  const lSkeleton = [];
  for (let r = 1; r <= 6; r++) {
    for (let c = 0; c < 3; c++) {
      lSkeleton.push(makeCell(lColX(c), lRowY(r), LCW[c], LRH, '', {
        fill: C.card, fillOp: 0.35, stroke: C.line, strokeWidth: 1.0
      }));
    }
  }
  await until(S(12));
  await play(new M.FadeIn(new M.VGroup(...lSkeleton), { runTime: 0.6 }), ...say('REBUILD: ONE CELL AT A TIME', C.cyan));

  // 13: North, Jan, 90 -> row 1
  const lRows = [];
  let srcBox = makeOutline(wColX(1), wRowY(1), WCW[1] + 0.06, WRH + 0.06, C.cyan, 3);
  const dot0 = new M.Dot({ point: [wColX(1), wRowY(1), 0], radius: 0.11, color: C.cyan });
  const row0 = makeLongRow(0, LONG_ROWS[0].slice(0, 3), C.cyan);
  lRows.push(row0);
  await until(S(13));
  await play(new M.FadeIn(srcBox, { runTime: 0.3 }), new M.FadeIn(dot0, { runTime: 0.25 }), ...say('NORTH, JAN, 90 → ROW 1', C.cyan));
  await play(new M.Transform(dot0, new M.Dot({ point: [LCX, lRowY(1), 0], radius: 0.11, color: C.cyan }), { pathArc: P ? -0.45 : -0.5, runTime: 0.7 }));
  await play(new M.FadeOut(dot0, { runTime: 0.2 }), new M.FadeIn(row0, { runTime: 0.4 }));

  // 14: North, Feb, 110 -> row 2
  const srcBox1 = makeOutline(wColX(2), wRowY(1), WCW[2] + 0.06, WRH + 0.06, C.cyan, 3);
  const dot1 = new M.Dot({ point: [wColX(2), wRowY(1), 0], radius: 0.11, color: C.cyan });
  const row1 = makeLongRow(1, LONG_ROWS[1].slice(0, 3), C.cyan);
  lRows.push(row1);
  await until(S(14));
  await play(new M.FadeOut(srcBox, { runTime: 0.2 }), new M.FadeIn(srcBox1, { runTime: 0.25 }), new M.FadeIn(dot1, { runTime: 0.2 }), ...say('NORTH, FEB, 110 → ROW 2', C.cyan));
  await play(new M.Transform(dot1, new M.Dot({ point: [LCX, lRowY(2), 0], radius: 0.11, color: C.cyan }), { pathArc: P ? -0.45 : -0.5, runTime: 0.6 }));
  await play(new M.FadeOut(dot1, { runTime: 0.2 }), new M.FadeIn(row1, { runTime: 0.35 }));
  srcBox = srcBox1;

  // 15: North, Mar, 100 -> row 3
  const srcBox2 = makeOutline(wColX(3), wRowY(1), WCW[3] + 0.06, WRH + 0.06, C.cyan, 3);
  const dot2 = new M.Dot({ point: [wColX(3), wRowY(1), 0], radius: 0.11, color: C.cyan });
  const row2 = makeLongRow(2, LONG_ROWS[2].slice(0, 3), C.cyan);
  lRows.push(row2);
  await until(S(15));
  await play(new M.FadeOut(srcBox, { runTime: 0.2 }), new M.FadeIn(srcBox2, { runTime: 0.25 }), new M.FadeIn(dot2, { runTime: 0.2 }), ...say('NORTH, MAR, 100 → ROW 3', C.cyan));
  await play(new M.Transform(dot2, new M.Dot({ point: [LCX, lRowY(3), 0], radius: 0.11, color: C.cyan }), { pathArc: P ? -0.45 : -0.5, runTime: 0.6 }));
  await play(new M.FadeOut(dot2, { runTime: 0.2 }), new M.FadeIn(row2, { runTime: 0.35 }));
  srcBox = srcBox2;

  // 16: South Jan 40, Feb 60, Mar 50 -> rows 4, 5, 6
  const srcBoxS = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, wRowY(2), WCW[1] + WCW[2] + WCW[3] + 0.08, WRH + 0.06, C.pink, 3);
  const sFlyDots = [1, 2, 3].map(c => new M.Dot({ point: [wColX(c), wRowY(2), 0], radius: 0.11, color: C.pink }));
  const row3 = makeLongRow(3, LONG_ROWS[3].slice(0, 3), C.pink);
  const row4 = makeLongRow(4, LONG_ROWS[4].slice(0, 3), C.pink);
  const row5 = makeLongRow(5, LONG_ROWS[5].slice(0, 3), C.pink);
  lRows.push(row3, row4, row5);
  await until(S(16));
  await play(
    new M.FadeOut(srcBox, { runTime: 0.25 }),
    new M.FadeIn(srcBoxS, { runTime: 0.3 }),
    new M.FadeIn(new M.VGroup(...sFlyDots), { runTime: 0.25 }),
    ...say('SOUTH: JAN 40 · FEB 60 · MAR 50', C.pink)
  );
  await play(new M.LaggedStart(sFlyDots.map((d, k) =>
    new M.Transform(d, new M.Dot({ point: [LCX, lRowY(4 + k), 0], radius: 0.11, color: C.pink }), { pathArc: P ? -0.4 : -0.45 })
  ), { lagRatio: 0.25, runTime: 1.1 }));
  await play(
    new M.FadeOut(new M.VGroup(...sFlyDots), { runTime: 0.25 }),
    new M.LaggedStart([new M.FadeIn(row3), new M.FadeIn(row4), new M.FadeIn(row5)], { lagRatio: 0.22, runTime: 0.85 })
  );

  // 17: 6 rows and 3 columns: store, month, sales
  const rowNums = [1, 2, 3, 4, 5, 6].map((n, i) => {
    const t = T(String(n), 14, C.green, true, true);
    t.moveTo([LX0 - 0.30, lRowY(i + 1), 0]);
    return t;
  });
  await until(S(17));
  await play(
    new M.FadeOut(srcBoxS, { runTime: 0.3 }),
    new M.LaggedStart(rowNums.map(n => new M.FadeIn(n)), { lagRatio: 0.1, runTime: 0.7 }),
    new M.LaggedStart(lHdrs.map(h => new M.Indicate(h, { color: C.amber })), { lagRatio: 0.2, runTime: 0.9 }),
    ...say('6 ROWS × 3 COLUMNS', C.green)
  );

  // 18: Long form: each row holds one value with its labels next to it
  const oneRowBox = makeOutline(LCX, lRowY(1), L_TOTAL_W + 0.08, LRH + 0.08, C.green, 3);
  await until(S(18));
  await play(
    new M.Create(oneRowBox, { runTime: 0.6 }),
    ...fbox([['LONG FORM', C.green], '1 row = 1 value', '+ its labels next to it'], C.green),
    ...say('LONG FORM', C.green)
  );

  // =========================================================================
  // 19-20: Reshaping = melting & pivoting
  // =========================================================================
  const meltStart = P ? [-1.35, 1.24] : [-0.95, 0.78];
  const meltEnd = P ? [-1.35, 0.70] : [0.5, 0.78];
  const pivStart = P ? [1.35, 0.70] : [0.5, 0.05];
  const pivEnd = P ? [1.35, 1.24] : [-0.95, 0.05];
  const meltArr = makeArrow(meltStart, meltEnd, C.amber, 3, 0.17);
  const pivArr = makeArrow(pivStart, pivEnd, C.green, 3, 0.17);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(oneRowBox, ...rowNums), { runTime: 0.35 }),
    ...clearBox(),
    new M.FadeIn(meltArr, { runTime: 0.45 }),
    new M.FadeIn(pivArr, { runTime: 0.45 }),
    ...say('RESHAPING', C.violet)
  );

  const meltTxt = T('melt', P ? 15 : 17, C.amber, true, true);
  meltTxt.moveTo(P ? [-2.10, 0.97, 0] : [-0.22, 1.05, 0]);
  const pivTxt = T('pivot', P ? 15 : 17, C.green, true, true);
  pivTxt.moveTo(P ? [2.15, 0.97, 0] : [-0.22, -0.22, 0]);
  await until(S(20));
  await play(
    new M.FadeIn(meltTxt, { runTime: 0.45 }),
    new M.FadeIn(pivTxt, { runTime: 0.45 }),
    new M.Indicate(meltArr, { color: C.amber, runTime: 0.5 }),
    ...say('WIDE → LONG: MELT · LONG → WIDE: PIVOT', C.violet)
  );

  // =========================================================================
  // 21-22: Egg tray analogy (grid -> labeled single queue)
  // =========================================================================
  const firstScreenAll = [
    wideTitle, wStoreHdr, wNorthName, wSouthName, ...wEmptySlots, ...wMonthHdrs,
    ...wNorthVals, ...wSouthVals, unitNote,
    longTitle, ...lHdrs, ...lSkeleton, ...lRows,
    meltArr, pivArr, meltTxt, pivTxt
  ];

  const EGG_R = P ? 0.34 : 0.38;
  const eggTrayX = P ? [-1.55, 0, 1.55] : [-1.7, 0, 1.7];
  const eggTrayY = P ? [0.65, -0.65] : [0.42, -0.82];
  const trayRect = new M.RoundedRectangle({
    width: P ? 4.9 : 5.4, height: P ? 2.5 : 2.5, cornerRadius: 0.32, color: C.amber, strokeWidth: 2.5
  });
  trayRect.setFill(C.card, 0.85);
  trayRect.moveTo([0, (eggTrayY[0] + eggTrayY[1]) / 2, 0]);

  const trayLabels = [
    T('N', 17, C.cyan, true, true).moveTo([eggTrayX[0] - (P ? 1.1 : 1.25), eggTrayY[0], 0]),
    T('S', 17, C.pink, true, true).moveTo([eggTrayX[0] - (P ? 1.1 : 1.25), eggTrayY[1], 0]),
    ...MONTHS.map((m, i) => T(m, 16, C.amber, true, true).moveTo([eggTrayX[i], eggTrayY[0] + (P ? 0.85 : 0.82), 0]))
  ];
  const eggColors = [C.cyan, C.cyan, C.cyan, C.pink, C.pink, C.pink];
  const eggGridPos = [
    [eggTrayX[0], eggTrayY[0], 0], [eggTrayX[1], eggTrayY[0], 0], [eggTrayX[2], eggTrayY[0], 0],
    [eggTrayX[0], eggTrayY[1], 0], [eggTrayX[1], eggTrayY[1], 0], [eggTrayX[2], eggTrayY[1], 0]
  ];
  const eggs = eggGridPos.map((pt, i) => {
    const c = new M.Circle({ radius: EGG_R, color: eggColors[i], strokeWidth: 2.5 });
    c.setFill(eggColors[i], 0.82);
    c.moveTo(pt);
    return c;
  });

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...firstScreenAll), { runTime: 0.45 }),
    new M.FadeIn(trayRect, { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...trayLabels), { runTime: 0.45 }),
    new M.LaggedStart(eggs.map(e => new M.FadeIn(e)), { lagRatio: 0.1, runTime: 0.8 }),
    ...say('WIDE = EGGS IN A 2 × 3 TRAY', C.amber)
  );

  // 22: Single queue, each egg carries its own label
  const eggQPos = P
    ? [0, 1, 2, 3, 4, 5].map(i => [-1.0, 2.35 - i * 1.02, 0])
    : [0, 1, 2, 3, 4, 5].map(i => [-4.75 + i * 1.9, 0.15, 0]);
  const eggTagTexts = ['N · Jan · 90', 'N · Feb · 110', 'N · Mar · 100', 'S · Jan · 40', 'S · Feb · 60', 'S · Mar · 50'];
  const eggTags = eggQPos.map((pt, i) => {
    const tagPos = P ? [pt[0] + 2.05, pt[1], 0] : [pt[0], pt[1] - 0.78, 0];
    const r = new M.RoundedRectangle({ width: P ? 2.85 : 1.72, height: 0.42, cornerRadius: 0.12, color: eggColors[i], strokeWidth: 1.6 });
    r.setFill(C.card, 0.94);
    r.moveTo(tagPos);
    const t = T(eggTagTexts[i], P ? 15 : 13, eggColors[i], true, true);
    t.moveTo(tagPos);
    return new M.VGroup(r, t);
  });

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(trayRect, ...trayLabels), { runTime: 0.35 }),
    new M.LaggedStart(eggs.map((e, i) => {
      const target = new M.Circle({ radius: EGG_R * (P ? 0.82 : 0.88), color: eggColors[i], strokeWidth: 2.5 });
      target.setFill(eggColors[i], 0.82);
      target.moveTo(eggQPos[i]);
      return new M.Transform(e, target, { pathArc: 0.3 });
    }), { lagRatio: 0.1, runTime: 1.25 }),
    ...say('LONG = ONE QUEUE, EACH LABELED', C.green)
  );
  await play(new M.LaggedStart(eggTags.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.75 }));

  // =========================================================================
  // 23-28: Check nothing was lost (both tables back on screen)
  // =========================================================================
  const w2 = buildFullWide('WIDE FORM');
  const l2 = buildFullLong('LONG FORM');

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(...eggs, ...eggTags), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...w2.all), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...l2.all), { runTime: 0.45 }),
    ...say('CHECK: NOTHING WAS LOST', C.amber)
  );

  // 24: Wide form had 2 rows x 3 months = 6 numbers
  const wide6Box = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, (wRowY(1) + wRowY(2)) / 2, WCW[1] + WCW[2] + WCW[3] + 0.08, 2 * WRH + 0.08, C.amber, 3);
  await until(S(24));
  await play(
    new M.Create(wide6Box, { runTime: 0.6 }),
    ...fbox([['Wide: 2 × 3 = 6 numbers', C.amber]], C.amber),
    ...say('WIDE: 2 × 3 = 6 NUMBERS', C.amber)
  );

  // 25: Long form has 6 rows = the same 6 numbers
  const long6Box = makeOutline(lColX(2), (lRowY(1) + lRowY(6)) / 2, LCW[2] + 0.08, 6 * LRH + 0.08, C.green, 3);
  await until(S(25));
  await play(
    new M.FadeOut(wide6Box, { runTime: 0.3 }),
    new M.Create(long6Box, { runTime: 0.6 }),
    ...fbox(['Wide: 2 × 3 = 6 numbers', ['Long: 6 rows = 6 numbers', C.green]], C.green),
    ...say('LONG: 6 ROWS = SAME 6 NUMBERS', C.green)
  );

  // 26: North still adds to 90 + 110 + 100 = 300
  const wNorthBox = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, wRowY(1), WCW[1] + WCW[2] + WCW[3] + 0.08, WRH + 0.08, C.cyan, 3);
  const lNorthBox = makeOutline(LCX, lRowY(2), L_TOTAL_W + 0.08, 3 * LRH + 0.08, C.cyan, 3);
  await until(S(26));
  await play(
    new M.FadeOut(long6Box, { runTime: 0.3 }),
    new M.Create(wNorthBox, { runTime: 0.5 }),
    new M.Create(lNorthBox, { runTime: 0.5 }),
    ...fbox([['North total:', C.cyan], '90 + 110 + 100 = 300', ['same in both ✓', C.green]], C.cyan),
    ...say('NORTH STILL ADDS TO $300', C.cyan)
  );

  // 27: South still adds to 40 + 60 + 50 = 150
  const wSouthBox = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, wRowY(2), WCW[1] + WCW[2] + WCW[3] + 0.08, WRH + 0.08, C.pink, 3);
  const lSouthBox = makeOutline(LCX, lRowY(5), L_TOTAL_W + 0.08, 3 * LRH + 0.08, C.pink, 3);
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(wNorthBox, lNorthBox), { runTime: 0.3 }),
    new M.Create(wSouthBox, { runTime: 0.5 }),
    new M.Create(lSouthBox, { runTime: 0.5 }),
    ...fbox([['South total:', C.pink], '40 + 60 + 50 = 150', ['same in both ✓', C.green]], C.pink),
    ...say('SOUTH STILL ADDS TO $150', C.pink)
  );

  // 28: Everyday words: wide spreads a label across columns, long writes label in each row
  const wLblBox = makeOutline((wColLeft(1) + WX0 + W_TOTAL_W) / 2, wRowY(0), WCW[1] + WCW[2] + WCW[3] + 0.08, WRH + 0.08, C.amber, 3);
  const lLblBox = makeOutline(lColX(1), (lRowY(1) + lRowY(6)) / 2, LCW[1] + 0.08, 6 * LRH + 0.08, C.green, 3);
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(wSouthBox, lSouthBox), { runTime: 0.3 }),
    new M.Create(wLblBox, { runTime: 0.5 }),
    new M.Create(lLblBox, { runTime: 0.5 }),
    ...fbox([['Wide: label across cols', C.amber], ['Long: label in each row', C.green]], C.violet),
    ...say('WIDE = ACROSS COLS · LONG = IN EACH ROW', C.violet)
  );

  // =========================================================================
  // 29-34: What each shape is for + GROUP BY month
  // =========================================================================
  const wideGlow = makeOutline(WCX, WT - 1.5 * WRH, W_TOTAL_W + 0.14, 3 * WRH + 0.14, C.amber, 3.2);
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(wLblBox, lLblBox), { runTime: 0.3 }),
    new M.Create(wideGlow, { runTime: 0.55 }),
    ...fbox([['WIDE FORM', C.amber], 'Good for people:', 'read & compare at a glance'], C.amber),
    ...say('WIDE = FOR PEOPLE TO READ', C.amber)
  );

  const salesColBox = makeOutline(lColX(2), (lRowY(0) + lRowY(6)) / 2, LCW[2] + 0.08, 7 * LRH + 0.08, C.green, 3);
  await until(S(30));
  await play(
    new M.FadeOut(wideGlow, { runTime: 0.3 }),
    new M.Create(salesColBox, { runTime: 0.55 }),
    ...fbox([['LONG FORM', C.green], 'Good for computers:', 'group · filter · chart'], C.green),
    ...say('LONG = FOR COMPUTERS', C.green)
  );

  // 31: One GROUP BY month
  await until(S(31));
  await play(
    new M.FadeOut(salesColBox, { runTime: 0.3 }),
    ...fbox([['SELECT month, SUM(sales)', C.green], ['GROUP BY month', C.amber]], C.green),
    ...say('ONE GROUP BY MONTH', C.green)
  );

  // 32: Jan: 90 + 40 = 130
  const janBoxA = makeOutline(LCX, lRowY(1), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  const janBoxB = makeOutline(LCX, lRowY(4), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  await until(S(32));
  await play(
    new M.Create(janBoxA, { runTime: 0.45 }),
    new M.Create(janBoxB, { runTime: 0.45 }),
    ...fbox([['GROUP BY month', C.muted], ['Jan:  90 + 40 = $130', C.amber]], C.amber),
    ...say('JANUARY: 90 + 40 = $130', C.amber)
  );

  // 33: Feb: 110 + 60 = 170
  const febBoxA = makeOutline(LCX, lRowY(2), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  const febBoxB = makeOutline(LCX, lRowY(5), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(janBoxA, janBoxB), { runTime: 0.25 }),
    new M.Create(febBoxA, { runTime: 0.45 }),
    new M.Create(febBoxB, { runTime: 0.45 }),
    ...fbox([['Jan:  90 + 40 = $130', C.muted], ['Feb: 110 + 60 = $170', C.amber]], C.amber),
    ...say('FEBRUARY: 110 + 60 = $170', C.amber)
  );

  // 34: Mar: 100 + 50 = 150
  const marBoxA = makeOutline(LCX, lRowY(3), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  const marBoxB = makeOutline(LCX, lRowY(6), L_TOTAL_W + 0.08, LRH + 0.06, C.amber, 3);
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(febBoxA, febBoxB), { runTime: 0.25 }),
    new M.Create(marBoxA, { runTime: 0.45 }),
    new M.Create(marBoxB, { runTime: 0.45 }),
    ...fbox([['Jan:  90 + 40 = $130', C.muted], ['Feb: 110 + 60 = $170', C.muted], ['Mar: 100 + 50 = $150', C.amber]], C.amber),
    ...say('MARCH: 100 + 50 = $150', C.amber)
  );

  // =========================================================================
  // 35-37: Common trap (storing long-term in wide form) + April
  // =========================================================================
  const trapBox = makeOutline(WCX, WT - 1.5 * WRH, W_TOTAL_W + 0.14, 3 * WRH + 0.14, C.pink, 3.2);
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(marBoxA, marBoxB), { runTime: 0.3 }),
    ...clearBox(),
    new M.Create(trapBox, { runTime: 0.55 }),
    ...say('TRAP: STORING LONG-TERM IN WIDE FORM', C.pink)
  );

  // 36: Every new month needs a new column & query rewrite
  const aprW = P ? 1.10 : 1.05;
  const aprX = WX0 + W_TOTAL_W + aprW / 2;
  const aprWideCells = [
    makeCell(aprX, wRowY(0), aprW, WRH, '+ Apr?', { fill: C.pink, fillOp: 0.22, stroke: C.pink, strokeWidth: 2, textColor: C.pink, fontSize: FS_HDR, mono: false, bold: true }),
    makeCell(aprX, wRowY(1), aprW, WRH, '?', { fill: C.pink, fillOp: 0.12, stroke: C.pink, strokeWidth: 1.8, textColor: C.pink, fontSize: FS_VAL }),
    makeCell(aprX, wRowY(2), aprW, WRH, '?', { fill: C.pink, fillOp: 0.12, stroke: C.pink, strokeWidth: 1.8, textColor: C.pink, fontSize: FS_VAL })
  ];
  await until(S(36));
  await play(
    new M.LaggedStart(aprWideCells.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 0.7 }),
    ...fbox([['Wide + April:', C.pink], 'new column needed!', 'rewrite every query'], C.pink),
    ...say('NEW MONTH = NEW COLUMN + REWRITE QUERIES', C.pink)
  );

  // 37: In long form, April is just two more rows
  const aprLongRow1 = makeLongRow(6, ['North', 'Apr', '...'], C.green);
  const aprLongRow2 = makeLongRow(7, ['South', 'Apr', '...'], C.green);
  const aprLongBox = makeOutline(LCX, (lRowY(7) + lRowY(8)) / 2, L_TOTAL_W + 0.08, 2 * LRH + 0.08, C.green, 3);
  await until(S(37));
  await play(
    new M.FadeOut(trapBox, { runTime: 0.3 }),
    ...clearBox(),
    new M.LaggedStart([new M.FadeIn(aprLongRow1), new M.FadeIn(aprLongRow2)], { lagRatio: 0.25, runTime: 0.65 }),
    new M.Create(aprLongBox, { runTime: 0.45 }),
    ...say('LONG FORM: APRIL IS JUST 2 MORE ROWS', C.green)
  );

  // =========================================================================
  // 38-39: Chapter 3.1 wrap-up & one-sentence recap
  // =========================================================================
  const secondScreenAll = [
    ...w2.all, ...l2.all, ...aprWideCells, aprLongRow1, aprLongRow2, aprLongBox
  ];
  const steps = [
    ['RAW FILES', 'CSV · JSON · API', C.muted],
    ['KEYS & JOINS', 'one clean grain', C.cyan],
    ['GROUP & WINDOW', 'totals & trends', C.amber],
    ['CLEAN TABLE ✓', 'ready to analyze', C.green]
  ];
  const pipeCards = [];
  const pipeArrows = [];
  const cardW = P ? 5.2 : 2.75, cardH = P ? 0.95 : 1.15;
  steps.forEach(([hd, sub, col], i) => {
    const pos = P ? [0, 2.05 - i * 1.55, 0] : [-4.8 + i * 3.2, -0.25, 0];
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.16, color: col, strokeWidth: 2.2 });
    r.setFill(C.card, 0.94);
    r.moveTo(pos);
    const t1 = T(hd, P ? 17 : 16, col, true, true); t1.moveTo([pos[0], pos[1] + 0.18, 0]);
    const t2 = T(sub, P ? 14 : 13, C.ink, false, false); t2.moveTo([pos[0], pos[1] - 0.20, 0]);
    pipeCards.push(new M.VGroup(r, t1, t2));
    if (i > 0) {
      const prev = P ? [0, 2.05 - (i - 1) * 1.55, 0] : [-4.8 + (i - 1) * 3.2, -0.25, 0];
      const a1 = P ? [prev[0], prev[1] - cardH / 2 - 0.08] : [prev[0] + cardW / 2 + 0.06, prev[1]];
      const a2 = P ? [pos[0], pos[1] + cardH / 2 + 0.08] : [pos[0] - cardW / 2 - 0.06, pos[1]];
      pipeArrows.push(makeArrow(a1, a2, C.muted, 2.5, 0.14));
    }
  });

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(...secondScreenAll), { runTime: 0.45 }),
    new M.LaggedStart(pipeCards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.25 }),
    new M.LaggedStart(pipeArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.22, runTime: 0.9 }),
    ...say('CHAPTER 3.1 COMPLETE', C.green)
  );

  // 39: One-sentence recap
  const recapY = P ? 0.0 : -0.25;
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...pipeCards, ...pipeArrows), { runTime: 0.45 }),
    ...fbox([
      ['WIDE  = months across columns (people)', C.amber],
      ['LONG  = one row per value (computers)', C.green],
      ['SAME NUMBERS · RESHAPE TO FIT THE JOB', C.ink]
    ], C.amber, [0, recapY, 0]),
    ...say('SAME NUMBERS · RESHAPE TO FIT THE JOB', C.amber)
  );
}
