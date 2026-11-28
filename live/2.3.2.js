// 2.3.2 Axis baselines: where the axis starts (live manim-web lesson).
// Beat i = sentence i (0-based, 0..44). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 2.3 data: Route A (blue) 96%, Route B (orange) 94%, Route C (purple) 92%
  const VALS = [96, 94, 92];
  const NAMES = ['Route A', 'Route B', 'Route C'];
  const RA = '#60a5fa', RB = '#fb923c', RC = C.violet;
  const RCOL = [RA, RB, RC];

  // Responsive layout constants (phone: 8 x 14.22, y in [-5.5, 4.3]; laptop: 14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 1.85, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.35, -0.35, 0];
  const AX = P ? -2.55 : -5.35;
  const AX_END = P ? 3.25 : 0.75;
  const BASE = P ? -4.20 : -2.30;
  const TOP = P ? 0.80 : 1.05;
  const H = TOP - BASE;
  const BX = P ? [-1.25, 0.45, 2.15] : [-3.80, -2.05, -0.30];
  const BW = P ? 0.90 : 0.92;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const yVal = (v, base = 0) => BASE + ((v - base) / (100 - base)) * H;

  // Formula box: one at a time, auto-sized to safe bounds
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.41 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.66, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.33, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Reusable chart builders
  function makeBar(k, v, base, minH = 0) {
    const h = Math.max(minH, yVal(v, base) - BASE);
    const col = RCOL[k], x = BX[k], cy = BASE + h / 2;
    const glow = new M.Rectangle({ width: BW + 0.16, height: h + 0.12, color: col, strokeWidth: 1.5 });
    glow.setFill(col, 0.14); glow.setStrokeOpacity(0.22); glow.moveTo([x, cy, 0]);
    const fill = new M.Rectangle({ width: BW, height: h, color: col, strokeWidth: 2.2 });
    fill.setFill(col, 0.80); fill.moveTo([x, cy, 0]);
    return { glow, fill };
  }

  function makeValLabel(k, v, base) {
    const t = T(`${v}%`, P ? 17 : 18, RCOL[k], true, true);
    t.moveTo([BX[k], yVal(v, base) + 0.24, 0]);
    return t;
  }

  function makeYAxisTicks(vals, base, bottomColor = null) {
    const parts = [];
    for (const v of vals) {
      const y = yVal(v, base);
      const isBot = v === base && bottomColor;
      const gline = new M.Line({ start: [AX, y, 0], end: [AX_END, y, 0], color: C.grid, strokeWidth: 1 });
      gline.setStrokeOpacity(v === base ? 0 : 0.35);
      const tick = new M.Line({ start: [AX - 0.11, y, 0], end: [AX, y, 0], color: isBot ? bottomColor : C.muted, strokeWidth: isBot ? 2.5 : 1.8 });
      const lbl = T(String(v), P ? 16 : 17, isBot ? bottomColor : C.muted, true, !!isBot);
      lbl.moveTo([AX - 0.46, y, 0]);
      parts.push(gline, tick, lbl);
    }
    return new M.VGroup(...parts);
  }

  function makeTickBox(y, color) {
    const b = new M.RoundedRectangle({ width: 0.72, height: 0.38, cornerRadius: 0.10, color, strokeWidth: 2.2 });
    b.setFill(color, 0.14); b.moveTo([AX - 0.46, y, 0]);
    return b;
  }

  // 0-1: Transit dashboard with three bus routes and timetable meaning
  const dashY = P ? -1.25 : -0.35;
  const dashW = P ? 6.8 : 9.4, dashH = P ? 4.8 : 3.6;
  const dashCard = new M.RoundedRectangle({ width: dashW, height: dashH, cornerRadius: 0.22, color: C.line, strokeWidth: 2 });
  dashCard.setFill(C.card, 0.94); dashCard.moveTo([0, dashY, 0]);
  const dashTitle = T('CITY TRANSIT DASHBOARD', P ? 17 : 19, C.muted, true, true);
  dashTitle.moveTo([0, dashY + dashH / 2 - 0.42, 0]);
  const dashDiv = new M.Line({ start: [-dashW / 2 + 0.35, dashY + dashH / 2 - 0.78, 0], end: [dashW / 2 - 0.35, dashY + dashH / 2 - 0.78, 0], color: C.line, strokeWidth: 1.5 });

  function makeBus(x, y, col, label) {
    const s = P ? 0.86 : 1.0;
    const body = new M.RoundedRectangle({ width: 1.55 * s, height: 0.74 * s, cornerRadius: 0.14 * s, color: col, strokeWidth: 2.2 });
    body.setFill(col, 0.22); body.moveTo([x, y, 0]);
    const wins = [-0.42, 0, 0.42].map(dx => {
      const w = new M.Rectangle({ width: 0.32 * s, height: 0.24 * s, color: col, strokeWidth: 1.2 });
      w.setFill(col, 0.48); w.moveTo([x + dx * s, y + 0.10 * s, 0]);
      return w;
    });
    const wheels = [-0.44, 0.44].map(dx => {
      const wh = new M.Circle({ radius: 0.13 * s, color: C.ink, strokeWidth: 2 });
      wh.setFill(C.bg, 1); wh.moveTo([x + dx * s, y - 0.38 * s, 0]);
      return wh;
    });
    const tag = T(label, P ? 16 : 18, col, true, true);
    tag.moveTo([x, y - 0.78 * s, 0]);
    return new M.VGroup(body, ...wins, ...wheels, tag);
  }

  const busY = P ? dashY + 0.65 : dashY + 0.28;
  const busXs = P ? [-2.10, 0, 2.10] : [-2.85, 0, 2.85];
  const buses = [0, 1, 2].map(k => makeBus(busXs[k], busY, RCOL[k], NAMES[k]));

  await until(S(0));
  await play(
    new M.FadeIn(new M.VGroup(dashCard, dashTitle, dashDiv)),
    new M.LaggedStart(buses.map(b => new M.FadeIn(b)), { lagRatio: 0.18, runTime: 1.3 }),
    ...say('DASHBOARD: BUSES ON TIME', C.cyan)
  );

  // Beat 1: Timetable badge + mini clock + green checkmark
  const ttY = P ? dashY - 1.25 : dashY - 1.12;
  const ttBox = new M.RoundedRectangle({ width: P ? 5.9 : 7.2, height: P ? 1.15 : 0.86, cornerRadius: 0.16, color: C.green, strokeWidth: 2 });
  ttBox.setFill(C.bg, 0.92); ttBox.moveTo([0, ttY, 0]);
  const clkX = P ? -2.30 : -2.95;
  const clkFace = new M.Circle({ radius: 0.24, color: C.green, strokeWidth: 2 }); clkFace.setFill(C.green, 0.12); clkFace.moveTo([clkX, ttY, 0]);
  const clkH = new M.Line({ start: [clkX, ttY, 0], end: [clkX, ttY + 0.15, 0], color: C.green, strokeWidth: 2.2 });
  const clkM = new M.Line({ start: [clkX, ttY, 0], end: [clkX + 0.12, ttY, 0], color: C.green, strokeWidth: 2.2 });
  const ttText = T(P ? 'TIMETABLE 08:00 = ARRIVAL 08:00' : 'TIMETABLE 08:00  →  BUS ARRIVES 08:00', P ? 15 : 18, C.ink, true);
  ttText.moveTo([P ? 0.12 : 0.05, ttY, 0]);
  const chkX = P ? 2.52 : 3.08;
  const chk1 = new M.Line({ start: [chkX - 0.14, ttY, 0], end: [chkX - 0.03, ttY - 0.11, 0], color: C.green, strokeWidth: 3 });
  const chk2 = new M.Line({ start: [chkX - 0.03, ttY - 0.11, 0], end: [chkX + 0.16, ttY + 0.13, 0], color: C.green, strokeWidth: 3 });
  const ttGroup = new M.VGroup(ttBox, clkFace, clkH, clkM, ttText, chk1, chk2);

  await until(S(1));
  await play(new M.FadeIn(ttGroup), ...say('ON TIME = MATCHES THE TIMETABLE', C.green));

  // 2-6: Numbers first (table + 10x10 grid of 100 buses)
  const TX = P ? 0 : -2.55, TY = P ? -0.05 : -0.35;
  const TW = P ? 6.8 : 6.2, TH = P ? 2.75 : 3.10;
  const tblBg = new M.RoundedRectangle({ width: TW, height: TH, cornerRadius: 0.18, color: C.line, strokeWidth: 2 });
  tblBg.setFill(C.card, 0.94); tblBg.moveTo([TX, TY, 0]);
  const colX0 = TX - (P ? 2.15 : 1.95), colX1 = TX + (P ? 0.10 : 0.10), colX2 = TX + (P ? 2.10 : 1.92);
  const hdrY = TY + TH / 2 - 0.38;
  const tblHdr = new M.VGroup(
    T('ROUTE', P ? 16 : 17, C.muted, true, true).moveTo([colX0, hdrY, 0]),
    T('ON TIME', P ? 16 : 17, C.muted, true, true).moveTo([colX1, hdrY, 0]),
    T('OF 100', P ? 16 : 17, C.muted, true, true).moveTo([colX2, hdrY, 0]),
    new M.Line({ start: [TX - TW / 2 + 0.25, hdrY - 0.30, 0], end: [TX + TW / 2 - 0.25, hdrY - 0.30, 0], color: C.line, strokeWidth: 1.5 })
  );
  const rowYs = P ? [TY + 0.34, TY - 0.28, TY - 0.90] : [TY + 0.38, TY - 0.32, TY - 1.02];

  // 10 x 10 grid representing 100 buses
  const GX = P ? 0 : 3.55, GY = P ? -3.35 : -0.35, GS = P ? 0.24 : 0.26;
  const gridDots = [];
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10), c = i % 10;
    const d = new M.Dot({ point: [GX + (c - 4.5) * GS, GY + (4.5 - r) * GS, 0], radius: P ? 0.068 : 0.075, color: C.muted });
    d.setFill(C.muted, 0.45);
    gridDots.push(d);
  }
  const gridHdr = T('100 BUSES', P ? 16 : 17, C.muted, true, true);
  gridHdr.moveTo([GX, GY + 5 * GS + 0.26, 0]);
  let gridCounter = T('each dot = 1 bus', P ? 16 : 17, C.muted, true);
  gridCounter.moveTo([GX, GY - 5 * GS - 0.32, 0]);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(dashCard, dashTitle, dashDiv, ...buses, ttGroup)),
    new M.FadeIn(tblBg), new M.FadeIn(tblHdr),
    new M.FadeIn(gridHdr), new M.FadeIn(gridCounter),
    new M.FadeIn(new M.VGroup(...gridDots)),
    ...say('PERCENT = HOW MANY OUT OF 100', C.cyan)
  );

  // Beats 3-5: Populate rows A (96%), B (94%), C (92%) and color the 100-bus grid
  const rowObjs = [];
  const pctLabels = [];
  for (let k = 0; k < 3; k++) {
    await until(S(k + 3));
    const v = VALS[k], col = RCOL[k], y = rowYs[k];
    const rName = T(NAMES[k], P ? 18 : 19, col, true, true); rName.moveTo([colX0, y, 0]);
    const rPct = T(`${v}%`, P ? 20 : 22, col, true, true); rPct.moveTo([colX1, y, 0]);
    const rOut = T(`${v} / 100`, P ? 17 : 18, C.ink, true); rOut.moveTo([colX2, y, 0]);
    const rowG = new M.VGroup(rName, rOut);
    rowObjs.push(rowG);
    pctLabels.push(rPct);
    for (let i = 0; i < 100; i++) {
      if (i < v) { gridDots[i].setColor(col); gridDots[i].setFill(col, 0.92); }
      else { gridDots[i].setColor(C.grid); gridDots[i].setFill(C.grid, 0.35); }
    }
    const nextCounter = T(`${v} of 100 on time`, P ? 16 : 17, col, true, true);
    nextCounter.moveTo([GX, GY - 5 * GS - 0.32, 0]);
    const oldCounter = gridCounter; gridCounter = nextCounter;
    await play(
      new M.FadeIn(rowG), new M.FadeIn(rPct),
      new M.FadeOut(oldCounter), new M.FadeIn(gridCounter),
      ...say(`${NAMES[k].toUpperCase()}: ${v}%`, col)
    );
  }

  // Beat 6: Close numbers; gap A - C is only 4 out of 100
  const gapHalos = [];
  for (let i = 0; i < 100; i++) {
    if (i < 92) { gridDots[i].setColor(C.cyan); gridDots[i].setFill(C.cyan, 0.35); }
    else if (i < 96) {
      gridDots[i].setColor(C.amber); gridDots[i].setFill(C.amber, 1);
      const halo = new M.Circle({ radius: P ? 0.115 : 0.125, color: C.amber, strokeWidth: 1.8 });
      halo.setFill(C.amber, 0.18); halo.moveTo(gridDots[i].getCenter());
      gapHalos.push(halo);
    } else { gridDots[i].setColor(C.grid); gridDots[i].setFill(C.grid, 0.25); }
  }
  const gapCounter = T('gap A − C = 4 of 100', P ? 17 : 18, C.amber, true, true);
  gapCounter.moveTo([GX, GY - 5 * GS - 0.32, 0]);
  const oldGridCounter = gridCounter; gridCounter = gapCounter;

  await until(S(6));
  await play(
    new M.FadeOut(oldGridCounter), new M.FadeIn(gridCounter),
    new M.LaggedStart(gapHalos.map(h => new M.FadeIn(h)), { lagRatio: 0.15, runTime: 0.9 }),
    new M.Indicate(pctLabels[0], { color: C.amber }),
    new M.Indicate(pctLabels[2], { color: C.amber }),
    ...say('GAP A TO C: ONLY 4 OUT OF 100', C.amber)
  );

  // 7-9: Manager's truncated bar chart (starts at 90)
  const yAxisLine = new M.Line({ start: [AX, BASE, 0], end: [AX, TOP + 0.14, 0], color: C.muted, strokeWidth: 2.5 });
  const xAxisLine = new M.Line({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const xLabels = [0, 1, 2].map(k => {
    const t = T(NAMES[k], P ? 16 : 17, RCOL[k], true, true);
    t.moveTo([BX[k], BASE - 0.36, 0]);
    return t;
  });
  const yUnit = T('% on time', P ? 15 : 16, C.muted, true);
  yUnit.moveTo([AX + 0.25, TOP + 0.36, 0]);

  let ticksNow = makeYAxisTicks([90, 92, 94, 96, 98, 100], 90);
  let bars = [0, 1, 2].map(k => makeBar(k, VALS[k], 90));
  let valLabels = [0, 1, 2].map(k => makeValLabel(k, VALS[k], 90));

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(tblBg, tblHdr, ...rowObjs, ...pctLabels, gridHdr, gridCounter, ...gridDots, ...gapHalos)),
    new M.Create(yAxisLine), new M.Create(xAxisLine),
    new M.FadeIn(new M.VGroup(...xLabels, yUnit, ticksNow)),
    ...bars.flatMap(b => [new M.FadeIn(b.glow), new M.FadeIn(b.fill)]),
    new M.FadeIn(new M.VGroup(...valLabels)),
    ...say('THE MANAGER’S BAR CHART', C.amber)
  );

  // Beat 8: Route C's bar looks tiny — 1/3 as tall as Route A's bar
  const thirdLines8 = [92, 94].map(v => new M.DashedLine({
    start: [BX[0] - BW / 2 - 0.08, yVal(v, 90), 0],
    end: [BX[0] + BW / 2 + 0.08, yVal(v, 90), 0],
    color: C.pink, strokeWidth: 2.5
  }));
  const thirdTag8 = T('1/3 of A', P ? 16 : 17, C.pink, true, true);
  thirdTag8.moveTo([BX[2], yVal(92, 90) + 0.58, 0]);

  await until(S(8));
  await play(
    new M.Indicate(bars[2].fill, { color: C.pink }),
    ...thirdLines8.map(l => new M.Create(l)),
    new M.FadeIn(thirdTag8),
    ...say('C LOOKS LIKE 1/3 OF A!', C.pink)
  );

  // Beat 9: Who is right — numbers or picture?
  await until(S(9));
  await play(
    ...fbox([['Numbers: 96% vs 92%', C.cyan], ['Picture: C is 1/3 of A', C.pink], ['Who is right?', C.amber]], C.amber),
    ...say('NUMBERS VS. PICTURE?', C.amber)
  );

  // 10: Look at the axis (the ruler on the side)
  const axisHiBox = new M.RoundedRectangle({ width: 0.92, height: H + 0.52, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.5 });
  axisHiBox.setFill(C.amber, 0.10); axisHiBox.moveTo([AX - 0.44, (BASE + TOP) / 2, 0]);
  const axisArrow = new M.Arrow({ start: [AX + 0.92, TOP - 0.45, 0], end: [AX + 0.10, TOP - 0.45, 0], color: C.amber, strokeWidth: 2.5 });
  const axisLbl = T('axis (ruler)', P ? 16 : 17, C.amber, true, true);
  axisLbl.moveTo([AX + 1.85, TOP - 0.45, 0]);

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...thirdLines8, thirdTag8)),
    ...clearBox(),
    new M.Create(axisHiBox), new M.Create(axisArrow), new M.FadeIn(axisLbl),
    ...say('AXIS = THE RULER ON THE SIDE', C.amber)
  );

  // 11: The bottom of the ruler is the baseline
  let baseLineNow = new M.DashedLine({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.pink, strokeWidth: 3 });
  let baseBoxNow = makeTickBox(BASE, C.pink);
  const baseArrow = new M.Arrow({ start: [BX[0] + 0.15, BASE - 0.88, 0], end: [AX + 0.15, BASE - 0.10, 0], color: C.pink, strokeWidth: 2.5 });
  const baseLbl = T('baseline (90!)', P ? 16 : 17, C.pink, true, true);
  baseLbl.moveTo([BX[0] + 1.15, BASE - 0.90, 0]);

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(axisHiBox, axisArrow, axisLbl)),
    new M.Create(baseLineNow), new M.Create(baseBoxNow),
    new M.Create(baseArrow), new M.FadeIn(baseLbl),
    ...say('BASELINE = WHERE EVERY BAR STARTS', C.pink)
  );

  // 12: Switch to baseline at 0 (empty bars ready to rise)
  const ticks0 = makeYAxisTicks([0, 20, 40, 60, 80, 100], 0, C.green);
  const baseLine0 = new M.DashedLine({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.green, strokeWidth: 3 });
  const baseBox0 = makeTickBox(BASE, C.green);

  // ghost outlines: where the three bars will rise to (removed when the bars are drawn)
  const ghosts = [0, 1, 2].map(k => {
    const h = yVal(VALS[k], 0) - BASE;
    const g = new M.DashedLine({ start: [BX[k], BASE + 0.1, 0], end: [BX[k], BASE + h, 0], color: RCOL[k], strokeWidth: 2 });
    const cap = new M.Line({ start: [BX[k] - BW / 2, BASE + h, 0], end: [BX[k] + BW / 2, BASE + h, 0], color: RCOL[k], strokeWidth: 2 });
    const q = T('?', P ? 20 : 20, RCOL[k], true, true).moveTo([BX[k], BASE + h + 0.26, 0]);
    return new M.VGroup(g, cap, q);
  });
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(
      ...bars.flatMap(b => [b.glow, b.fill]),
      ...valLabels, ticksNow, baseLineNow, baseBoxNow, baseArrow, baseLbl
    )),
    new M.FadeIn(ticks0), new M.Create(baseLine0), new M.Create(baseBox0),
    new M.LaggedStart(ghosts.map(g => new M.FadeIn(g)), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('BASELINE AT 0', C.green)
  );
  ticksNow = ticks0;
  baseLineNow = baseLine0;
  baseBoxNow = baseBox0;

  // 13-15: Draw bars rising from 0 to 96, 94, 92
  bars = [0, 1, 2].map(k => makeBar(k, 0, 0, 0.04));
  valLabels = [];
  for (let k = 0; k < 3; k++) {
    await until(S(k + 13));
    const tgt = makeBar(k, VALS[k], 0);
    const vl = makeValLabel(k, VALS[k], 0);
    valLabels.push(vl);
    await play(
      new M.FadeOut(ghosts[k], { runTime: 0.4 }),
      new M.Transform(bars[k].glow, tgt.glow, { runTime: 0.85 }),
      new M.Transform(bars[k].fill, tgt.fill, { runTime: 0.85 }),
      new M.FadeIn(vl, { runTime: 0.85 }),
      ...say(`${NAMES[k].toUpperCase()}: 0 → ${VALS[k]}`, RCOL[k])
    );
  }

  // 16: The three bars look almost equal
  const topBand = new M.RoundedRectangle({
    width: (BX[2] - BX[0]) + BW + 0.34,
    height: (yVal(96, 0) - yVal(92, 0)) + 0.2,
    cornerRadius: 0.10, color: C.green, strokeWidth: 2
  });
  topBand.setFill(C.green, 0.10);
  topBand.moveTo([(BX[0] + BX[2]) / 2, (yVal(96, 0) + yVal(92, 0)) / 2, 0]);

  // the % labels move up into one row above the band so the band does not cover them
  const rowLabels16 = [0, 1, 2].map(k => T(`${VALS[k]}%`, P ? 17 : 18, RCOL[k], true, true).moveTo([BX[k], yVal(96, 0) + 0.38, 0]));
  await until(S(16));
  await play(
    ...valLabels.map((v, k) => new M.Transform(v, rowLabels16[k], { runTime: 0.6 })),
    new M.Create(topBand),
    new M.LaggedStart(bars.map(b => new M.Indicate(b.fill, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('ALMOST EQUAL — JUST LIKE THE DATA', C.green)
  );

  // 17: With a bar, your eye reads its length
  const lenArrows = [0, 1, 2].map(k => {
    const x = BX[k] + BW / 2 + 0.16;
    const topY = yVal(VALS[k], 0);
    const shaft = new M.Line({ start: [x, BASE + 0.04, 0], end: [x, topY - 0.04, 0], color: C.amber, strokeWidth: 2.4 });
    const capB = new M.Line({ start: [x - 0.09, BASE + 0.04, 0], end: [x + 0.09, BASE + 0.04, 0], color: C.amber, strokeWidth: 2.4 });
    const capT = new M.Line({ start: [x - 0.09, topY - 0.04, 0], end: [x + 0.09, topY - 0.04, 0], color: C.amber, strokeWidth: 2.4 });
    return new M.VGroup(shaft, capB, capT);
  });

  await until(S(17));
  await play(
    new M.FadeOut(topBand),
    new M.LaggedStart(lenArrows.map(a => new M.Create(a)), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('YOUR EYE READS BAR LENGTH', C.amber)
  );

  // 18: Three people standing on the same floor (vignette card at BOXP)
  const pcW = P ? 5.2 : 3.9, pcH = P ? 1.88 : 3.05;
  const pcCard = new M.RoundedRectangle({ width: pcW, height: pcH, cornerRadius: 0.18, color: C.green, strokeWidth: 2 });
  pcCard.setFill(C.card, 0.95); pcCard.moveTo(BOXP);
  const pFloorY = BOXP[1] - pcH / 2 + (P ? 0.22 : 0.42);
  const pFloor = new M.Line({ start: [BOXP[0] - pcW / 2 + 0.35, pFloorY, 0], end: [BOXP[0] + pcW / 2 - 0.35, pFloorY, 0], color: C.green, strokeWidth: 2.5 });
  const pXs = P ? [-1.35, 0, 1.35] : [BOXP[0] - 1.05, BOXP[0], BOXP[0] + 1.05];
  const pHs = P ? [1.14, 1.07, 1.00] : [1.88, 1.78, 1.68];
  const pHeadR = P ? 0.11 : 0.15;
  const pBodyW = P ? 0.24 : 0.32;
  const peopleFigs = [0, 1, 2].map(k => {
    const h = pHs[k], col = RCOL[k], x = pXs[k];
    const bodyH = h - 2 * pHeadR - 0.04;
    const body = new M.RoundedRectangle({ width: pBodyW, height: bodyH, cornerRadius: 0.08, color: col, strokeWidth: 1.8 });
    body.setFill(col, 0.85); body.moveTo([x, pFloorY + bodyH / 2, 0]);
    const head = new M.Circle({ radius: pHeadR, color: col, strokeWidth: 1.8 });
    head.setFill(col, 0.92); head.moveTo([x, pFloorY + h - pHeadR, 0]);
    return new M.VGroup(body, head);
  });
  let peopleHdr = T('SAME FLOOR', P ? 15 : 16, C.green, true, true);
  peopleHdr.moveTo([BOXP[0], BOXP[1] + pcH / 2 - 0.26, 0]);
  const peopleCard = new M.VGroup(pcCard, pFloor, ...peopleFigs);

  await until(S(18));
  await play(new M.FadeIn(peopleCard), new M.FadeIn(peopleHdr), ...say('SAME FLOOR → FAIR COMPARISON', C.green));

  // 19: Move the baseline up to 90; watch the bottom of the bars disappear, then zoom 90..100
  const cutW = AX_END - AX - 0.06;
  const cutX = (AX + 0.06 + AX_END) / 2;
  const cutH90 = yVal(90, 0) - BASE;
  const cutCurtain = new M.Rectangle({ width: cutW, height: 0.04, color: C.bg, strokeWidth: 1 });
  cutCurtain.setFill(C.bg, 0.90); cutCurtain.setStrokeOpacity(0); cutCurtain.moveTo([cutX, BASE + 0.02, 0]);
  const cutCurtain90 = new M.Rectangle({ width: cutW, height: cutH90, color: C.bg, strokeWidth: 1 });
  cutCurtain90.setFill(C.bg, 0.90); cutCurtain90.setStrokeOpacity(0); cutCurtain90.moveTo([cutX, BASE + cutH90 / 2, 0]);
  const cutLine = new M.Line({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.pink, strokeWidth: 3.2 });
  const cutLine90 = new M.Line({ start: [AX, yVal(90, 0), 0], end: [AX_END, yVal(90, 0), 0], color: C.pink, strokeWidth: 3.2 });

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...lenArrows), { runTime: 0.5 }),
    new M.Transform(cutCurtain, cutCurtain90, { runTime: 1.25 }),
    new M.Transform(cutLine, cutLine90, { runTime: 1.25 }),
    ...say('MOVE BASELINE UP TO 90', C.pink)
  );

  // Zoom the remaining 90..100 section to fill the chart
  const ticks90 = makeYAxisTicks([90, 92, 94, 96, 98, 100], 90, C.pink);
  const baseLine90 = new M.DashedLine({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.pink, strokeWidth: 3 });
  const baseBox90 = makeTickBox(BASE, C.pink);
  const newValLabels90 = [0, 1, 2].map(k => makeValLabel(k, VALS[k], 90));
  const tgtBars90 = [0, 1, 2].map(k => makeBar(k, VALS[k], 90));

  await play(
    new M.FadeOut(new M.VGroup(cutCurtain, cutLine, ticksNow, baseLineNow, baseBoxNow, ...valLabels), { runTime: 1.1 }),
    new M.FadeIn(ticks90, { runTime: 1.1 }),
    new M.FadeIn(baseLine90, { runTime: 1.1 }),
    new M.FadeIn(baseBox90, { runTime: 1.1 }),
    ...bars.flatMap((b, k) => [
      new M.Transform(b.glow, tgtBars90[k].glow, { runTime: 1.2 }),
      new M.Transform(b.fill, tgtBars90[k].fill, { runTime: 1.2 })
    ]),
    new M.FadeIn(new M.VGroup(...newValLabels90), { runTime: 1.1 })
  );
  ticksNow = ticks90;
  baseLineNow = baseLine90;
  baseBoxNow = baseBox90;
  valLabels = newValLabels90;

  // 20: Three people standing in a pool, only heads above water
  const waterH = P ? 0.93 : 1.58;
  const waterW = pcW - 0.50;
  const waterRect = new M.Rectangle({ width: waterW, height: 0.04, color: C.cyan, strokeWidth: 1 });
  waterRect.setFill(C.cyan, 0.32); waterRect.setStrokeOpacity(0); waterRect.moveTo([BOXP[0], pFloorY + 0.02, 0]);
  const waterTarget = new M.Rectangle({ width: waterW, height: waterH, color: C.cyan, strokeWidth: 1 });
  waterTarget.setFill(C.cyan, 0.34); waterTarget.setStrokeOpacity(0); waterTarget.moveTo([BOXP[0], pFloorY + waterH / 2, 0]);
  const waterLine = new M.DashedLine({
    start: [BOXP[0] - waterW / 2, pFloorY + waterH, 0],
    end: [BOXP[0] + waterW / 2, pFloorY + waterH, 0],
    color: C.cyan, strokeWidth: 2.5
  });
  const poolHdr = T('IN A POOL', P ? 15 : 16, C.cyan, true, true);
  poolHdr.moveTo([BOXP[0], BOXP[1] + pcH / 2 - 0.26, 0]);

  await until(S(20));
  await play(
    new M.FadeOut(peopleHdr), new M.FadeIn(poolHdr),
    new M.Transform(waterRect, waterTarget, { runTime: 1.2 }),
    new M.Create(waterLine, { runTime: 1.0 }),
    ...say('LIKE STANDING IN A POOL', C.cyan)
  );

  // 21-23: Steps above 90 (A: 6 steps, B: 4 steps, C: 2 steps)
  function makeStepMarks(k, steps) {
    const lines = [];
    for (let s = 1; s < steps; s++) {
      const y = yVal(90 + s, 90);
      lines.push(new M.Line({ start: [BX[k] - BW / 2 + 0.04, y, 0], end: [BX[k] + BW / 2 - 0.04, y, 0], color: C.bg, strokeWidth: 2.2 }));
    }
    const tag = T(`${steps} steps`, P ? 16 : 17, RCOL[k], true, true);
    tag.moveTo([BX[k], yVal(90 + steps, 90) + 0.24, 0]);
    stepTags.push(tag);
    return new M.VGroup(...lines, tag);
  }
  const stepTags = [];

  const stepA = makeStepMarks(0, 6);
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(peopleCard, poolHdr, waterRect, waterLine, ...valLabels)),
    new M.FadeIn(stepA),
    ...fbox([['Above 90:', C.muted], ['A: 6 steps', RA]], RA),
    ...say('ROUTE A: 6 STEPS ABOVE 90', RA)
  );

  const stepB = makeStepMarks(1, 4);
  await until(S(22));
  await play(
    new M.FadeIn(stepB, { runTime: 0.75 }),
    ...fbox([['Above 90:', C.muted], ['A: 6 steps', RA], ['B: 4 steps', RB]], RB),
    ...say('ROUTE B: 4 STEPS', RB)
  );

  const stepC = makeStepMarks(2, 2);
  await until(S(23));
  await play(
    new M.FadeIn(stepC, { runTime: 0.75 }),
    ...fbox([['Above 90:', C.muted], ['A: 6 steps', RA], ['B: 4 steps', RB], ['C: 2 steps', RC]], RC),
    ...say('ROUTE C: 2 STEPS', RC)
  );

  // 24: Two is one third of six
  const thirdLines24 = [92, 94].map(v => new M.DashedLine({
    start: [BX[0] - BW / 2 - 0.10, yVal(v, 90), 0],
    end: [BX[0] + BW / 2 + 0.10, yVal(v, 90), 0],
    color: C.pink, strokeWidth: 2.6
  }));

  await until(S(24));
  await play(
    ...thirdLines24.map(l => new M.Create(l)),
    new M.Indicate(bars[2].fill, { color: C.pink }),
    ...fbox([['A = 6 steps', RA], ['C = 2 steps', RC], ['2 ÷ 6 = 1/3', C.pink]], C.pink),
    ...say('2 IS 1/3 OF 6', C.pink)
  );

  // 25: Real numbers are 92 and 96; real gap is still 4
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...stepTags), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...valLabels), { runTime: 0.8 }),
    ...fbox([['Real numbers:', C.muted], ['A = 96,  C = 92', C.ink], ['Real gap = 4', C.amber]], C.amber),
    ...say('REAL GAP IS STILL 4', C.amber)
  );

  // 26: Nothing in the data changed; only the baseline moved
  await until(S(26));
  await play(
    new M.Indicate(baseBoxNow, { color: C.pink }),
    new M.Indicate(baseLineNow, { color: C.pink }),
    ...say('SAME DATA — ONLY BASELINE MOVED', C.pink)
  );

  // 27: Truncating the axis (cutting off)
  const cutSlashes = new M.VGroup(
    new M.Line({ start: [AX - 0.12, BASE - 0.15, 0], end: [AX + 0.12, BASE - 0.05, 0], color: C.pink, strokeWidth: 2.6 }),
    new M.Line({ start: [AX - 0.12, BASE - 0.27, 0], end: [AX + 0.12, BASE - 0.17, 0], color: C.pink, strokeWidth: 2.6 })
  );
  const cutOffLbl = T('0–90 cut', 15, C.pink, true);
  cutOffLbl.moveTo([AX - 0.44, BASE - 0.42, 0]);

  await until(S(27));
  await play(
    new M.Create(cutSlashes), new M.FadeIn(cutOffLbl),
    ...fbox([['Truncating =', C.pink], ['cutting off 0 to 90', C.ink]], C.pink),
    ...say('TRUNCATING = CUTTING OFF THE AXIS', C.pink)
  );

  // 28: Measure how much the cut axis stretched the difference
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(stepA, stepB, stepC, ...thirdLines24)),
    ...fbox([['Measure the stretch:', C.amber], ['Cut chart vs. Real', C.ink]], C.amber),
    ...say('HOW MUCH DID IT STRETCH?', C.amber)
  );

  // 29: On the cut chart, A's bar is 3x as tall as C's bar
  const mX = BX[2] + BW / 2 + 0.24;
  const gA = new M.DashedLine({ start: [BX[0] + BW / 2, yVal(96, 90), 0], end: [mX, yVal(96, 90), 0], color: C.pink, strokeWidth: 1.8 });
  const gC = new M.DashedLine({ start: [BX[2] + BW / 2, yVal(92, 90), 0], end: [mX, yVal(92, 90), 0], color: C.pink, strokeWidth: 1.8 });
  const mLine = new M.Line({ start: [mX, BASE, 0], end: [mX, yVal(96, 90), 0], color: C.pink, strokeWidth: 2.8 });
  const mTicks = [90, 92, 94, 96].map(v => new M.Line({ start: [mX - 0.10, yVal(v, 90), 0], end: [mX + 0.10, yVal(v, 90), 0], color: C.pink, strokeWidth: 2.4 }));
  const mTag = T('3×', P ? 18 : 20, C.pink, true, true);
  mTag.moveTo([mX, yVal(96, 90) + 0.28, 0]);
  const threeXGroup = new M.VGroup(gA, gC, mLine, ...mTicks, mTag);

  await until(S(29));
  await play(
    new M.FadeIn(threeXGroup),
    ...fbox([['Cut chart:', C.pink], ['A is 3× taller than C', C.pink]], C.pink),
    ...say('CUT CHART: A = 3× BAR C', C.pink)
  );

  // 30: In real numbers, A is only 4 more than C out of 100
  await until(S(30));
  await play(
    ...fbox([['Cut chart:  3× taller', C.pink], ['Real data: +4 of 100', C.green]], C.green),
    ...say('REAL NUMBERS: ONLY +4 OUT OF 100', C.green)
  );

  // 31: Picture shouts a big gap; numbers whisper a small one
  await until(S(31));
  await play(
    new M.Indicate(bars[0].fill, { color: C.pink }),
    new M.Indicate(bars[2].fill, { color: C.pink }),
    ...fbox([['Picture: SHOUTS big', C.pink], ['Numbers: whisper +4', C.cyan]], C.amber),
    ...say('PICTURE SHOUTS · NUMBERS WHISPER', C.amber)
  );

  // 32: The short version is one line
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(threeXGroup, cutOffLbl), { runTime: 0.7 }),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE', C.cyan)
  );

  // 33: Bar length equals the number, minus the baseline
  await until(S(33));
  await play(
    ...fbox([['bar length =', C.cyan], ['  number − baseline', C.amber]], C.cyan),
    ...say('LENGTH = NUMBER − BASELINE', C.cyan)
  );

  // 34: Check on Route C: 92 - 90 = 2 steps
  const cX = BX[2] + BW / 2 + 0.20;
  const cBrack = new M.VGroup(
    new M.Line({ start: [cX, BASE, 0], end: [cX, yVal(92, 90), 0], color: RC, strokeWidth: 2.6 }),
    new M.Line({ start: [cX - 0.09, BASE, 0], end: [cX + 0.09, BASE, 0], color: RC, strokeWidth: 2.4 }),
    new M.Line({ start: [cX - 0.09, yVal(92, 90), 0], end: [cX + 0.09, yVal(92, 90), 0], color: RC, strokeWidth: 2.4 }),
    T('2', P ? 18 : 19, RC, true, true).moveTo([cX + 0.24, (BASE + yVal(92, 90)) / 2, 0])
  );

  await until(S(34));
  await play(
    new M.FadeIn(cBrack),
    new M.Indicate(bars[2].fill, { color: RC }),
    ...fbox([['length = num − base', C.muted], ['Route C: 92 − 90 = 2', RC]], RC),
    ...say('ROUTE C: 92 − 90 = 2 STEPS', RC)
  );

  // 35: In words: bar only shows the part above the baseline
  const aboveBox = new M.RoundedRectangle({
    width: (BX[2] - BX[0]) + BW + 0.36,
    height: (yVal(96, 90) - BASE) + 0.16,
    cornerRadius: 0.12, color: C.amber, strokeWidth: 2.4
  });
  aboveBox.setFill(C.amber, 0.06);
  aboveBox.moveTo([(BX[0] + BX[2]) / 2, (BASE + yVal(96, 90)) / 2, 0]);

  await until(S(35));
  await play(
    new M.Create(aboveBox),
    ...say('ONLY THE PART ABOVE THE BASELINE', C.amber)
  );

  // 36: When baseline is 0, bar length equals the whole number
  const ticks0b = makeYAxisTicks([0, 20, 40, 60, 80, 100], 0, C.green);
  const baseLine0b = new M.DashedLine({ start: [AX, BASE, 0], end: [AX_END, BASE, 0], color: C.green, strokeWidth: 3 });
  const baseBox0b = makeTickBox(BASE, C.green);
  const valLabels0b = [0, 1, 2].map(k => makeValLabel(k, VALS[k], 0));
  const tgtBars0 = [0, 1, 2].map(k => makeBar(k, VALS[k], 0));

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(cBrack, aboveBox, cutSlashes, ticksNow, baseLineNow, baseBoxNow, ...valLabels)),
    new M.FadeIn(ticks0b), new M.FadeIn(baseLine0b), new M.FadeIn(baseBox0b),
    ...bars.flatMap((b, k) => [
      new M.Transform(b.glow, tgtBars0[k].glow, { runTime: 1.2 }),
      new M.Transform(b.fill, tgtBars0[k].fill, { runTime: 1.2 })
    ]),
    new M.FadeIn(new M.VGroup(...valLabels0b)),
    ...fbox([['baseline = 0:', C.green], ['  96 − 0 = 96', RA], ['  94 − 0 = 94', RB], ['  92 − 0 = 92', RC]], C.green),
    ...say('BASELINE = 0 → FULL NUMBER', C.green)
  );
  ticksNow = ticks0b;
  baseLineNow = baseLine0b;
  baseBoxNow = baseBox0b;
  valLabels = valLabels0b;

  // 37: Bars compare amounts, so bars should start at zero
  await until(S(37));
  await play(
    new M.Indicate(baseBoxNow, { color: C.green }),
    new M.Indicate(baseLineNow, { color: C.green }),
    ...fbox([['BAR RULE:', C.green], ['Start bars at 0', C.ink]], C.green),
    ...say('BARS COMPARE AMOUNTS → START AT 0', C.green)
  );

  // 38: To show small changes, use dots or a line instead of bars
  const ticks90d = makeYAxisTicks([90, 92, 94, 96, 98, 100], 90);
  const dotPts = [0, 1, 2].map(k => [BX[k], yVal(VALS[k], 90), 0]);
  const connLines = [
    new M.Line({ start: dotPts[0], end: dotPts[1], color: C.cyan, strokeWidth: 3 }),
    new M.Line({ start: dotPts[1], end: dotPts[2], color: C.cyan, strokeWidth: 3 })
  ];
  const dotHalos = [0, 1, 2].map(k => {
    const h = new M.Dot({ point: dotPts[k], radius: 0.30, color: RCOL[k] });
    h.setFill(RCOL[k], 0.20);
    return h;
  });
  const dotCores = [0, 1, 2].map(k => new M.Dot({ point: dotPts[k], radius: 0.13, color: RCOL[k] }));
  const dotVals = [0, 1, 2].map(k => {
    const t = T(`${VALS[k]}%`, P ? 17 : 18, RCOL[k], true, true);
    t.moveTo([dotPts[k][0], dotPts[k][1] + 0.36, 0]);
    return t;
  });

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(...bars.flatMap(b => [b.glow, b.fill]), ...valLabels, ticksNow, baseLineNow, baseBoxNow)),
    new M.FadeIn(ticks90d),
    ...connLines.map(l => new M.Create(l)),
    ...dotHalos.map(h => new M.FadeIn(h)),
    ...dotCores.map(d => new M.FadeIn(d)),
    new M.FadeIn(new M.VGroup(...dotVals)),
    ...fbox([['Small changes?', C.cyan], ['Use dots or a line', C.green]], C.cyan),
    ...say('SMALL CHANGES → DOTS OR A LINE', C.cyan)
  );

  // 39: Eye reads where each point sits, not how long it is
  const posGuides = [0, 1, 2].map(k => new M.DashedLine({
    start: [AX, dotPts[k][1], 0], end: dotPts[k], color: RCOL[k], strokeWidth: 2
  }));

  await until(S(39));
  await play(
    new M.LaggedStart(posGuides.map(l => new M.Create(l)), { lagRatio: 0.18, runTime: 1.2 }),
    new M.LaggedStart(dotCores.map((d, k) => new M.Flash(d, { color: RCOL[k] })), { lagRatio: 0.2, runTime: 1.3 }),
    ...say('YOUR EYE READS POSITION, NOT LENGTH', C.cyan)
  );

  // 40: Ruler can start near the numbers without fooling you
  const okBox90 = makeTickBox(BASE, C.green);

  await until(S(40));
  await play(
    new M.Create(okBox90),
    ...fbox([['Dots / lines:', C.cyan], ['Axis can start at 90', C.green]], C.green),
    ...say('90 BASELINE IS FINE FOR DOTS', C.green)
  );

  // 41: Always read the axis numbers before you trust bar sizes
  const readAxisBox = new M.RoundedRectangle({ width: 0.92, height: H + 0.52, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.6 });
  readAxisBox.setFill(C.amber, 0.10); readAxisBox.moveTo([AX - 0.44, (BASE + TOP) / 2, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(okBox90),
    new M.Create(readAxisBox),
    ...fbox([['Habit:', C.amber], ['Read the axis first!', C.ink]], C.amber),
    ...say('ALWAYS READ THE AXIS NUMBERS', C.amber)
  );

  // 42-44: Common trap & final recap (side-by-side mini charts)
  function makeMiniChart(cx, cy, w, h, base, title, footer, col) {
    const border = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: col, strokeWidth: 2.2 });
    border.setFill(C.card, 0.95); border.moveTo([cx, cy, 0]);
    const hdr = T(title, P ? 15 : 16, col, true, true);
    hdr.moveTo([cx, cy + h / 2 - 0.34, 0]);
    const ftr = T(footer, P ? 15 : 15, col, true);
    ftr.moveTo([cx, cy - h / 2 + 0.30, 0]);
    const mBase = cy - h / 2 + 0.72, mTop = cy + h / 2 - 0.74, mH = mTop - mBase;
    const mAx = cx - w / 2 + 0.72, mAxEnd = cx + w / 2 - 0.32;
    const yL = new M.Line({ start: [mAx, mBase, 0], end: [mAx, mTop + 0.08, 0], color: C.muted, strokeWidth: 1.8 });
    const xL = new M.Line({ start: [mAx, mBase, 0], end: [mAxEnd, mBase, 0], color: col, strokeWidth: 2 });
    const tBot = T(String(base), 15, col, true, true); tBot.moveTo([mAx - 0.34, mBase, 0]);
    const tTop = T('100', 15, C.muted, true); tTop.moveTo([mAx - 0.34, mTop, 0]);
    const bXs = [mAx + 0.45, (mAx + mAxEnd) / 2 + 0.05, mAxEnd - 0.35];
    const bW = P ? 0.42 : 0.44;
    const mBars = [0, 1, 2].map(k => {
      const bh = ((VALS[k] - base) / (100 - base)) * mH;
      const r = new M.Rectangle({ width: bW, height: bh, color: RCOL[k], strokeWidth: 1.5 });
      r.setFill(RCOL[k], 0.82); r.moveTo([bXs[k], mBase + bh / 2, 0]);
      return r;
    });
    const inner = new M.VGroup(hdr, ftr, yL, xL, tBot, tTop, ...mBars);
    return { border, inner };
  }

  const mcW = P ? 3.45 : 3.45, mcH = P ? 3.85 : 3.35;
  const mcY = P ? -1.85 : -0.50;
  const honestMini = makeMiniChart(P ? -1.88 : -4.25, mcY, mcW, mcH, 0, 'START AT 0', 'true size', C.green);
  const cutMini = makeMiniChart(P ? 1.88 : -0.45, mcY, mcW, mcH, 90, 'CUT AT 90', 'looks 3× bigger', C.pink);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(
      yAxisLine, xAxisLine, ...xLabels, yUnit, ticks90d,
      ...connLines, ...dotHalos, ...dotCores, ...dotVals, ...posGuides, readAxisBox
    )),
    new M.FadeIn(honestMini.border), new M.FadeIn(honestMini.inner),
    new M.FadeIn(cutMini.border), new M.FadeIn(cutMini.inner),
    ...fbox([['Common trap:', C.pink], ['Small gap looks big', C.ink]], C.pink),
    ...say('TRAP: SMALL GAPS LOOK BIG', C.pink)
  );

  // 43: A small gap may still matter — show its true size, then explain why
  await until(S(43));
  await play(
    new M.Indicate(honestMini.border, { color: C.green }),
    ...fbox([['4 of 100 can matter:', C.amber], ['1. Show true size', C.green], ['2. Explain why', C.cyan]], C.green),
    ...say('SHOW TRUE SIZE, THEN EXPLAIN', C.green)
  );

  // 44: Recap — bars should start at zero so length matches the real number
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(cutMini.border, cutMini.inner)),
    new M.Indicate(honestMini.border, { color: C.green }),
    ...fbox([['Start bars at 0', C.green], ['length = real number', C.amber]], C.green),
    ...say('BARS START AT 0 → HONEST LENGTH', C.green)
  );
}
