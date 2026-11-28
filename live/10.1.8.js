// 10.1.8 Slope uncertainty: how sure is the slope?
// Beat i = sentence i (0-based, 41 sentences: 0..40). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 2.02, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.38, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Exact shared data from chapters/10.1.md: [area, rent, color, displayDx]
  // Building X = cyan, Y = amber, Z = pink. Tiny x-nudge on tied (40, 770) so both dots show.
  const APTS = [
    [40, 860, C.cyan, 0],   [40, 770, C.amber, -1.4], [40, 770, C.pink, 1.4],
    [60, 1040, C.cyan, 0],  [60, 1020, C.amber, 0],   [60, 940, C.pink, 0],
    [80, 1250, C.cyan, 0],  [80, 1210, C.amber, 0],   [80, 1140, C.pink, 0],
    [100, 1470, C.cyan, 0], [100, 1380, C.amber, 0],  [100, 1350, C.pink, 0],
  ];

  // One formula box at a time (leading spaces indent)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 18 : 19, lh = P ? 0.35 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.56, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.28, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.45;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.5 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.4 }));
    boxNow = g;
    return a;
  }

  // Scatter plot coordinates: area 25..115 m², rent 600..1650 $
  const PX0 = P ? -2.75 : -5.35, PX1 = P ? 3.45 : 0.95;
  const PY0 = P ? -4.25 : -2.25, PY1 = P ? 1.10 : 1.18;
  const ax = a => PX0 + ((a - 25) / 90) * (PX1 - PX0);
  const ay = r => PY0 + ((r - 600) / 1050) * (PY1 - PY0);
  const fitLine = (slope, intercept, color = C.ink, sw = 3, dashed = false, a0 = 30, a1 = 110) => {
    const p0 = [ax(a0), ay(intercept + slope * a0), 0];
    const p1 = [ax(a1), ay(intercept + slope * a1), 0];
    return dashed
      ? new M.DashedLine({ start: p0, end: p1, color })
      : new M.Line({ start: p0, end: p1, color, strokeWidth: sw });
  };
  const lineThroughCentre = (slope, y70 = 1100, color = C.violet, sw = 2, dashed = false) =>
    fitLine(slope, y70 - slope * 70, color, sw, dashed);

  function makeScatter() {
    const items = [];
    const xAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.5 });
    const yAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.5 });
    items.push(xAxis, yAxis);
    for (const r of [800, 1000, 1200, 1400, 1600]) {
      const y = ay(r);
      const gl = new M.Line({ start: [PX0, y, 0], end: [PX1, y, 0], color: C.grid, strokeWidth: 1 });
      gl.setStrokeOpacity(0.35);
      const lb = T(String(r), P ? 13 : 14, C.muted, true);
      lb.moveTo([PX0 - (P ? 0.45 : 0.48), y, 0]);
      items.push(gl, lb);
    }
    for (const a of [40, 60, 80, 100]) {
      const x = ax(a);
      const tk = new M.Line({ start: [x, PY0 - 0.07, 0], end: [x, PY0 + 0.07, 0], color: C.muted, strokeWidth: 2 });
      const lb = T(String(a), P ? 14 : 15, C.muted, true);
      lb.moveTo([x, PY0 - 0.26, 0]);
      items.push(tk, lb);
    }
    const xTitle = T('area (m²)', P ? 14 : 15, C.muted);
    xTitle.moveTo([(PX0 + PX1) / 2, PY0 - 0.56, 0]);
    const yTitle = T('rent ($)', P ? 14 : 15, C.muted);
    yTitle.moveTo([PX0 + 0.15, PY1 + 0.24, 0]);
    items.push(xTitle, yTitle);
    const frame = new M.VGroup(...items);
    const dots = APTS.map(([a, r, col, dx]) => {
      const pt = [ax(a + dx), ay(r), 0];
      const halo = new M.Dot({ point: pt, radius: P ? 0.19 : 0.17, color: col });
      halo.setFill(col, 0.2);
      const core = new M.Dot({ point: pt, radius: P ? 0.095 : 0.085, color: col });
      return new M.VGroup(halo, core);
    });
    const whiteLine = fitLine(10, 400, C.ink, 3.5);
    return { frame, dots, whiteLine };
  }

  // Helper: slope number line spanning [minV, maxV]
  function makeSlopeLine(minV, maxV, yPos, ticks, width = P ? 6.2 : 6.0) {
    const xL = CX - width / 2, xR = CX + width / 2;
    const s2x = v => xL + ((v - minV) / (maxV - minV)) * width;
    const parts = [new M.Line({ start: [xL, yPos, 0], end: [xR, yPos, 0], color: C.muted, strokeWidth: 3 })];
    for (const v of ticks) {
      const x = s2x(v);
      parts.push(new M.Line({ start: [x, yPos - 0.09, 0], end: [x, yPos + 0.09, 0], color: C.muted, strokeWidth: 2 }));
      const lb = T(String(v), P ? 16 : 15, C.muted, true);
      lb.moveTo([x, yPos - 0.32, 0]);
      parts.push(lb);
    }
    const unit = T('slope ($ per m²)', P ? 16 : 15, C.muted);
    unit.moveTo([CX, yPos - 0.68, 0]);
    parts.push(unit);
    return { group: new M.VGroup(...parts), s2x, xL, xR };
  }

  // Helper: small boxed word chip
  function chip(label, color, wd, ht = 0.56, size = P ? 15 : 16) {
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.94);
    const t = T(label, size, color, true, true);
    return new M.VGroup(r, t);
  }

  // =========================================================================
  // ACT 1 (0-5): 12 apartments, wobbling lines, seesaw around centre
  // =========================================================================
  const sc1 = makeScatter();
  const slopeStepH = new M.Line({ start: [ax(60), ay(1000), 0], end: [ax(80), ay(1000), 0], color: C.cyan, strokeWidth: 2.5 });
  const slopeStepV = new M.Line({ start: [ax(80), ay(1000), 0], end: [ax(80), ay(1200), 0], color: C.cyan, strokeWidth: 2.5 });
  const slopeTag = T('+$10 / m²', P ? 15 : 16, C.cyan, true, true);
  slopeTag.moveTo([ax(92), ay(1060), 0]);
  const slopeHint = new M.VGroup(slopeStepH, slopeStepV, slopeTag);

  // 0: Our slope says ten dollars per square metre.
  await until(S(0));
  await play(
    new M.FadeIn(sc1.frame, { runTime: 0.6 }),
    new M.LaggedStart(sc1.dots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 0.8 }),
    new M.Create(sc1.whiteLine, { runTime: 0.9 }),
    new M.FadeIn(slopeHint, { runTime: 0.9 }),
    ...say('SLOPE = $10 PER m²')
  );

  // 1: But it comes from only twelve apartments.
  await until(S(1));
  await play(
    new M.LaggedStart(sc1.dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('ONLY 12 APARTMENTS', C.amber)
  );

  // 2: Twelve different apartments would give a slightly different slope.
  const ALT = [
    [40, 740], [40, 810], [40, 730],
    [60, 960], [60, 1050], [60, 980],
    [80, 1240], [80, 1180], [80, 1270],
    [100, 1490], [100, 1410], [100, 1460],
  ];
  const altDots = ALT.map(([a, r], idx) => {
    const c = new M.Circle({ radius: P ? 0.085 : 0.075, color: C.violet, strokeWidth: 2.2 });
    c.setFill(C.violet, 0.25);
    c.moveTo([ax(a + (idx % 3 - 1) * 1.4), ay(r), 0]);
    return c;
  });
  const altLine = lineThroughCentre(11.1, 1108, C.violet, 3);
  await until(S(2));
  await play(
    new M.FadeOut(slopeHint, { runTime: 0.4 }),
    new M.LaggedStart(altDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 0.9 }),
    new M.Create(altLine, { runTime: 0.9 }),
    ...say('NEW SAMPLE → NEW SLOPE', C.violet)
  );

  // 3: Picture many samples of twelve. Each one gives its own line.
  const FAN_SLOPES = [
    [8.7, 1094], [9.2, 1110], [9.5, 1090], [9.8, 1106],
    [10.3, 1092], [10.6, 1112], [10.9, 1096], [11.3, 1105], [8.9, 1108],
  ];
  const fanLines = FAN_SLOPES.map(([m, y70]) => {
    const ln = lineThroughCentre(m, y70, C.violet, 2);
    ln.setStrokeOpacity(0.55);
    return ln;
  });
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...altDots, altLine), { runTime: 0.4 }),
    new M.LaggedStart(fanLines.map(ln => new M.Create(ln)), { lagRatio: 0.14, runTime: 2.2 }),
    ...say('MANY SAMPLES → MANY LINES', C.violet)
  );

  // 4: The lines tilt up and down, roughly around the centre of the data, like a seesaw.
  const cPt = [ax(70), ay(1100), 0];
  const pivotRing = new M.Circle({ radius: 0.2, color: C.amber, strokeWidth: 2.5 });
  pivotRing.setFill(C.amber, 0.18);
  pivotRing.moveTo(cPt);
  const pivotDot = new M.Dot({ point: cPt, radius: 0.09, color: C.amber });
  const pivotLbl = T('centre (70, 1100)', P ? 13 : 14, C.amber, true);
  pivotLbl.moveTo([ax(70) + (P ? 0.85 : 0.95), ay(960), 0]);
  const pivotGrp = new M.VGroup(pivotRing, pivotDot, pivotLbl);
  const seesaw = lineThroughCentre(10, 1100, C.amber, 3.8);
  await until(S(4));
  await play(new M.FadeIn(pivotGrp, { runTime: 0.6 }), new M.FadeIn(seesaw, { runTime: 0.5 }), ...say('SEESAW AROUND THE CENTRE', C.amber));
  await play(new M.Transform(seesaw, lineThroughCentre(11.6, 1100, C.amber, 3.8), { runTime: 1.0 }));
  await play(new M.Transform(seesaw, lineThroughCentre(8.4, 1100, C.amber, 3.8), { runTime: 1.1 }));

  // 5: How big is that wobble? It depends on two things.
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...fanLines, seesaw), { runTime: 0.6 }),
    ...fbox(['wobble depends on:', ['1. noise around line', C.pink], ['2. spread of areas', C.green]]),
    ...say('WOBBLE DEPENDS ON TWO THINGS')
  );

  // =========================================================================
  // ACT 2 (6-7): Factor 1 — Noise around the line ($50)
  // =========================================================================
  const sticks = APTS.map(([a, r, col, dx]) => {
    const x = ax(a + dx);
    return new M.Line({ start: [x, ay(400 + 10 * a), 0], end: [x, ay(r), 0], color: col, strokeWidth: 2.4 });
  });
  const wideTiltA = lineThroughCentre(11.9, 1100, C.pink, 2, true);
  const wideTiltB = lineThroughCentre(8.1, 1100, C.pink, 2, true);

  // 6: First, the noise. More noise around the line means more wobble.
  await until(S(6));
  await play(
    new M.LaggedStart(sticks.map(st => new M.Create(st)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.Create(wideTiltA, { runTime: 0.8 }),
    new M.Create(wideTiltB, { runTime: 0.8 }),
    ...say('1. MORE NOISE → MORE WOBBLE', C.pink)
  );

  // 7: Our noise is the residual standard error: fifty dollars.
  const bandHi = fitLine(10, 450, C.pink, 2, true);
  const bandLo = fitLine(10, 350, C.pink, 2, true);
  const bandLbl = T('± $50', P ? 15 : 16, C.pink, true, true);
  bandLbl.moveTo([ax(102), ay(1540), 0]);
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(wideTiltA, wideTiltB), { runTime: 0.45 }),
    new M.Create(bandHi, { runTime: 0.7 }),
    new M.Create(bandLo, { runTime: 0.7 }),
    new M.FadeIn(bandLbl, { runTime: 0.6 }),
    ...fbox([['1. noise = $50', C.pink], '   (typical gap)', ['2. spread of areas', C.muted]], C.pink),
    ...say('NOISE = $50 (TYPICAL GAP)', C.pink)
  );

  // =========================================================================
  // ACT 3 (8-10): Factor 2 — Area spread & holding a ruler steady
  // =========================================================================
  const spanY = PY0 + 0.14;
  const spanBar = new M.Line({ start: [ax(40), spanY, 0], end: [ax(100), spanY, 0], color: C.green, strokeWidth: 4.5 });
  const spanL = new M.Line({ start: [ax(40), spanY - 0.12, 0], end: [ax(40), spanY + 0.12, 0], color: C.green, strokeWidth: 3 });
  const spanR = new M.Line({ start: [ax(100), spanY - 0.12, 0], end: [ax(100), spanY + 0.12, 0], color: C.green, strokeWidth: 3 });
  const spanTxt = T('40 to 100 m²', P ? 14 : 15, C.green, true, true);
  spanTxt.moveTo([ax(70), spanY + 0.25, 0]);
  const spanGrp = new M.VGroup(spanBar, spanL, spanR, spanTxt);

  // 8: Second, how spread out the areas are.
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...sticks, bandHi, bandLo, bandLbl), { runTime: 0.45 }),
    new M.FadeIn(spanGrp, { runTime: 0.7 }),
    ...fbox(['1. noise = $50', ['2. spread of areas', C.green]], C.green),
    ...say('2. HOW SPREAD OUT ARE AREAS?', C.green)
  );

  // 9: Think of holding a ruler steady. Hands far apart hold it better than hands close together.
  const rW = P ? 2.6 : 2.7;
  const yTopR = P ? -0.35 : 0.25;
  const yBotR = P ? -2.75 : -1.55;
  const topBeam = new M.Line({ start: [CX - rW, yTopR, 0], end: [CX + rW, yTopR, 0], color: C.green, strokeWidth: 9 });
  const gripG1 = new M.RoundedRectangle({ width: 0.30, height: 0.52, cornerRadius: 0.10, color: C.green, strokeWidth: 2 });
  gripG1.setFill(C.green, 0.85); gripG1.moveTo([CX - 1.9, yTopR, 0]);
  const gripG2 = new M.RoundedRectangle({ width: 0.30, height: 0.52, cornerRadius: 0.10, color: C.green, strokeWidth: 2 });
  gripG2.setFill(C.green, 0.85); gripG2.moveTo([CX + 1.9, yTopR, 0]);
  const lblWide = T('hands far apart → steady', P ? 16 : 17, C.green, true, true);
  lblWide.moveTo([CX, yTopR + 0.56, 0]);
  const topRuler = new M.VGroup(topBeam, gripG1, gripG2, lblWide);

  const botBeam = new M.Line({ start: [CX - rW, yBotR, 0], end: [CX + rW, yBotR, 0], color: C.pink, strokeWidth: 9 });
  const gripP1 = new M.RoundedRectangle({ width: 0.30, height: 0.52, cornerRadius: 0.10, color: C.pink, strokeWidth: 2 });
  gripP1.setFill(C.pink, 0.85); gripP1.moveTo([CX - 0.45, yBotR, 0]);
  const gripP2 = new M.RoundedRectangle({ width: 0.30, height: 0.52, cornerRadius: 0.10, color: C.pink, strokeWidth: 2 });
  gripP2.setFill(C.pink, 0.85); gripP2.moveTo([CX + 0.45, yBotR, 0]);
  const lblClose = T('hands close → big wobble', P ? 16 : 17, C.pink, true, true);
  lblClose.moveTo([CX, yBotR + 0.68, 0]);
  const botExtras = new M.VGroup(gripP1, gripP2, lblClose);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(sc1.frame, ...sc1.dots, sc1.whiteLine, pivotGrp, spanGrp), { runTime: 0.45 }),
    new M.FadeIn(topRuler, { runTime: 0.7 }),
    new M.FadeIn(botBeam, { runTime: 0.7 }),
    new M.FadeIn(botExtras, { runTime: 0.7 }),
    ...say('HANDS FAR APART = STEADIER', C.green)
  );
  await play(new M.Transform(botBeam, new M.Line({ start: [CX - rW, yBotR - 0.50, 0], end: [CX + rW, yBotR + 0.50, 0], color: C.pink, strokeWidth: 9 }), { runTime: 0.8 }));
  await play(new M.Transform(botBeam, new M.Line({ start: [CX - rW, yBotR + 0.50, 0], end: [CX + rW, yBotR - 0.50, 0], color: C.pink, strokeWidth: 9 }), { runTime: 0.9 }));

  // 10: Areas far apart hold the line steadier, in the same way.
  const AY = P ? -1.15 : -0.55;
  const a2x = a => CX + ((a - 70) / 40) * (P ? 2.85 : 2.75);
  const aLine = new M.Line({ start: [a2x(30), AY, 0], end: [a2x(110), AY, 0], color: C.muted, strokeWidth: 3 });
  const aTicks = [40, 60, 70, 80, 100].map(a => {
    const x = a2x(a);
    const col = a === 70 ? C.amber : C.muted;
    return new M.VGroup(
      new M.Line({ start: [x, AY - 0.08, 0], end: [x, AY + 0.08, 0], color: col, strokeWidth: 2 }),
      T(String(a), P ? 16 : 15, col, true).moveTo([x, AY - 0.28, 0])
    );
  });
  const areaDotGroups = [40, 60, 80, 100].map(a => {
    const cols = [C.cyan, C.amber, C.pink];
    return new M.VGroup(...cols.map((col, j) => new M.Dot({ point: [a2x(a), AY + 0.28 + j * 0.24, 0], radius: 0.09, color: col })));
  });
  const aUnit = T('apartment areas (m²)', P ? 14 : 15, C.muted);
  aUnit.moveTo([CX, AY + 1.15, 0]);
  const wideCapL = new M.RoundedRectangle({ width: 0.36, height: 0.92, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
  wideCapL.setFill(C.green, 0.12); wideCapL.moveTo([a2x(40), AY + 0.52, 0]);
  const wideCapR = new M.RoundedRectangle({ width: 0.36, height: 0.92, cornerRadius: 0.12, color: C.green, strokeWidth: 2 });
  wideCapR.setFill(C.green, 0.12); wideCapR.moveTo([a2x(100), AY + 0.52, 0]);

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(topRuler, botBeam, botExtras), { runTime: 0.45 }),
    new M.Create(aLine, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...aTicks, aUnit), { runTime: 0.6 }),
    new M.LaggedStart(areaDotGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.FadeIn(wideCapL, { runTime: 0.7 }),
    new M.FadeIn(wideCapR, { runTime: 0.7 }),
    ...say('WIDE AREAS = STEADIER LINE', C.green)
  );

  // =========================================================================
  // ACT 4 (11-20): Measure area spread (6,000) & compute Standard Error (0.65)
  // =========================================================================
  const meanLine = new M.DashedLine({ start: [a2x(70), AY - 0.15, 0], end: [a2x(70), AY + 1.10, 0], color: C.amber });
  const meanTag = T('mean = 70 m²', P ? 15 : 16, C.amber, true, true);
  meanTag.moveTo([a2x(70), AY + 1.38, 0]);
  const meanMark = new M.VGroup(meanLine, meanTag);

  // 11: Let's measure the spread of areas around their mean of seventy.
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(wideCapL, wideCapR, aUnit), { runTime: 0.4 }),
    new M.Create(meanLine, { runTime: 0.6 }),
    new M.FadeIn(meanTag, { runTime: 0.6 }),
    ...fbox([['mean area = 70 m²', C.amber], 'measure distances', 'from 70, squared'], C.amber),
    ...say('SPREAD AROUND MEAN 70 m²', C.amber)
  );

  function sqCard(area, distTxt, sqTxt, yBar, lblX) {
    const xA = a2x(area), xM = a2x(70);
    const bar = new M.Line({ start: [xM, yBar, 0], end: [xA, yBar, 0], color: C.cyan, strokeWidth: 3 });
    const dLbl = T(distTxt, P ? 16 : 15, C.cyan, true);
    dLbl.moveTo([lblX, yBar, 0]);
    const box = new M.RoundedRectangle({ width: P ? 0.96 : 0.94, height: 0.44, cornerRadius: 0.1, color: C.cyan, strokeWidth: 1.8 });
    box.setFill(C.card, 0.92);
    box.moveTo([xA, AY - 1.42, 0]);
    const sLbl = T(sqTxt, P ? 17 : 16, C.cyan, true, true);
    sLbl.moveTo([xA, AY - 1.42, 0]);
    return new M.VGroup(bar, dLbl, box, sLbl);
  }

  const c40 = sqCard(40, '-30', '900', AY - 1.0, a2x(40) - (P ? 0.40 : 0.38));
  const c60 = sqCard(60, '-10', '100', AY - 0.74, a2x(60) - (P ? 0.40 : 0.38));
  const c80 = sqCard(80, '+10', '100', AY - 0.74, a2x(80) + (P ? 0.40 : 0.38));
  const c100 = sqCard(100, '+30', '900', AY - 1.0, a2x(100) + (P ? 0.40 : 0.38));

  // 12: Forty is thirty below. Squared, that is nine hundred.
  await until(S(12));
  await play(
    new M.FadeIn(c40, { runTime: 0.75 }),
    new M.Indicate(areaDotGroups[0], { color: C.cyan, runTime: 0.7 }),
    ...fbox(['distances from 70:', [' 40: (-30)² = 900', C.cyan]]),
    ...say('40 IS 30 BELOW → 30² = 900')
  );

  // 13: Sixty is ten below. Squared, one hundred.
  await until(S(13));
  await play(
    new M.FadeIn(c60, { runTime: 0.75 }),
    new M.Indicate(areaDotGroups[1], { color: C.cyan, runTime: 0.7 }),
    ...fbox([' 40: (-30)² = 900', [' 60: (-10)² = 100', C.cyan]]),
    ...say('60 IS 10 BELOW → 10² = 100')
  );

  // 14: Eighty is ten above: one hundred. One hundred is thirty above: nine hundred.
  await until(S(14));
  await play(
    new M.FadeIn(c80, { runTime: 0.7 }),
    new M.Indicate(areaDotGroups[2], { color: C.cyan, runTime: 0.65 }),
    ...say('80 → 100  AND  100 → 900')
  );
  await play(
    new M.FadeIn(c100, { runTime: 0.7 }),
    new M.Indicate(areaDotGroups[3], { color: C.cyan, runTime: 0.65 }),
    ...fbox([' 40: 900   60: 100', [' 80: 100  100: 900', C.cyan], ['one set = 2,000', C.muted]])
  );

  // 15: Each size appears three times, so the total is six thousand.
  const x3Tags = [40, 60, 80, 100].map(a => {
    const t = T('× 3', P ? 16 : 15, C.amber, true, true);
    t.moveTo([a2x(a), AY - 1.84, 0]);
    return t;
  });
  const totSpreadTxt = T('3 × 2,000 = 6,000', P ? 17 : 18, C.amber, true, true);
  totSpreadTxt.moveTo([CX, AY - 2.28, 0]);
  await until(S(15));
  await play(
    new M.LaggedStart(x3Tags.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(totSpreadTxt, { runTime: 0.8 }),
    ...fbox(['each size appears 3×', 'spread = 3 × 2,000', ['       = 6,000', C.amber]], C.amber),
    ...say('3 EACH → TOTAL SPREAD = 6,000', C.amber)
  );

  // 16: Now divide the noise by the square root of this spread.
  await until(S(16));
  await play(
    ...fbox(['wobble = noise ÷ √spread', ['       = 50 ÷ √6,000', C.cyan]]),
    ...say('NOISE ÷ √(AREA SPREAD)')
  );

  // 17: The square root of six thousand is about seventy-seven and a half.
  const sqY = P ? -1.45 : -0.55;
  const sqBox = new M.Rectangle({ width: 2.0, height: 2.0, color: C.violet, strokeWidth: 2.5 });
  sqBox.setFill(C.violet, 0.16);
  sqBox.moveTo([CX, sqY, 0]);
  const sqIn = T('6,000', P ? 24 : 26, C.amber, true, true);
  sqIn.moveTo([CX, sqY, 0]);
  const sqSideB = T('√6,000 ≈ 77.5', P ? 18 : 19, C.violet, true, true);
  sqSideB.moveTo([CX, sqY - 1.32, 0]);
  const sqSideR = T('77.5', P ? 16 : 17, C.violet, true);
  sqSideR.moveTo([CX + 1.45, sqY, 0]);
  const sqrtVisual = new M.VGroup(sqBox, sqIn, sqSideB, sqSideR);

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(aLine, ...aTicks, ...areaDotGroups, meanMark, c40, c60, c80, c100, ...x3Tags, totSpreadTxt), { runTime: 0.45 }),
    new M.FadeIn(sqrtVisual, { runTime: 0.8 }),
    ...fbox(['noise   = 50', ['√6,000 ≈ 77.5', C.violet]], C.violet),
    ...say('√6,000 ≈ 77.5', C.violet)
  );

  // 18: Fifty divided by seventy-seven and a half is about zero point six five.
  const divY = P ? -1.45 : -0.55;
  const divCard = new M.RoundedRectangle({ width: P ? 5.6 : 5.4, height: 1.95, cornerRadius: 0.2, color: C.amber, strokeWidth: 2 });
  divCard.setFill(C.card, 0.94);
  divCard.moveTo([CX, divY, 0]);
  const numT = T('50', P ? 28 : 30, C.pink, true, true);
  numT.moveTo([CX - 1.15, divY + 0.36, 0]);
  const fracBar = new M.Line({ start: [CX - 1.85, divY, 0], end: [CX - 0.45, divY, 0], color: C.ink, strokeWidth: 2.5 });
  const denT = T('77.5', P ? 26 : 28, C.violet, true, true);
  denT.moveTo([CX - 1.15, divY - 0.38, 0]);
  const eqT = T('≈  0.65', P ? 28 : 30, C.amber, true, true);
  eqT.moveTo([CX + 0.95, divY + 0.04, 0]);
  const unitT = T('$ / m²', P ? 15 : 16, C.muted, true);
  unitT.moveTo([CX + 1.25, divY - 0.42, 0]);
  const divVisual = new M.VGroup(divCard, numT, fracBar, denT, eqT, unitT);

  await until(S(18));
  await play(
    new M.FadeOut(sqrtVisual, { runTime: 0.4 }),
    new M.FadeIn(divVisual, { runTime: 0.8 }),
    ...fbox(['noise   = 50', '√spread ≈ 77.5', ['50 ÷ 77.5 ≈ 0.65', C.amber]], C.amber),
    ...say('50 ÷ 77.5 ≈ 0.65', C.amber)
  );

  // 19: So the slope's typical wobble is about sixty-five cents per square metre.
  const SLY = P ? -1.35 : -0.65;
  const sl1 = makeSlopeLine(6, 14, SLY, [6, 8, 10, 12, 14]);
  const s10Dot = new M.Dot({ point: [sl1.s2x(10), SLY, 0], radius: 0.12, color: C.ink });
  const s10Lbl = T('10', P ? 17 : 18, C.ink, true, true);
  s10Lbl.moveTo([sl1.s2x(10), SLY + 0.36, 0]);
  const seY = SLY + 0.78;
  const seBar = new M.Line({ start: [sl1.s2x(9.35), seY, 0], end: [sl1.s2x(10.65), seY, 0], color: C.amber, strokeWidth: 5 });
  const seCapL = new M.Line({ start: [sl1.s2x(9.35), seY - 0.12, 0], end: [sl1.s2x(9.35), seY + 0.12, 0], color: C.amber, strokeWidth: 3 });
  const seCapR = new M.Line({ start: [sl1.s2x(10.65), seY - 0.12, 0], end: [sl1.s2x(10.65), seY + 0.12, 0], color: C.amber, strokeWidth: 3 });
  const seLbl = T('± $0.65', P ? 16 : 17, C.amber, true, true);
  seLbl.moveTo([sl1.s2x(10), seY + 0.32, 0]);
  const seGrp = new M.VGroup(seBar, seCapL, seCapR);

  await until(S(19));
  await play(
    new M.FadeOut(divVisual, { runTime: 0.4 }),
    new M.FadeIn(sl1.group, { runTime: 0.6 }),
    new M.FadeIn(s10Dot, { runTime: 0.6 }),
    new M.FadeIn(s10Lbl, { runTime: 0.6 }),
    new M.FadeIn(seGrp, { runTime: 0.7 }),
    new M.FadeIn(seLbl, { runTime: 0.7 }),
    ...say('TYPICAL WOBBLE ≈ ± $0.65 / m²', C.amber)
  );

  // 20: The typical wobble of an estimate is its standard error, from chapter six.
  const seNameLbl = T('SE ≈ $0.65', P ? 16 : 17, C.green, true, true);
  seNameLbl.moveTo([sl1.s2x(10), seY + 0.32, 0]);
  await until(S(20));
  await play(
    new M.FadeOut(seLbl, { runTime: 0.35 }),
    new M.FadeIn(seNameLbl, { runTime: 0.55 }),
    new M.Indicate(seGrp, { color: C.green, runTime: 0.8 }),
    ...fbox([['standard error (SE)', C.green], '= 50 ÷ √6,000', ['≈ $0.65 / m²', C.amber]], C.green),
    ...say('STANDARD ERROR (SE) ≈ $0.65', C.green)
  );

  // =========================================================================
  // ACT 5 (21-30): Confidence interval, t multiplier (2.23), 8.56 to 11.44
  // =========================================================================
  const plausBar = new M.Line({ start: [sl1.s2x(8.56), SLY, 0], end: [sl1.s2x(11.44), SLY, 0], color: C.cyan, strokeWidth: 9 });
  plausBar.setStrokeOpacity(0.55);
  const plausLbl = T('plausible slopes?', P ? 16 : 16, C.cyan, true);
  plausLbl.moveTo([sl1.s2x(10), SLY - 1.05, 0]);

  // 21: From chapter six, a confidence interval is a range of plausible values for an unknown number.
  await until(S(21));
  await play(
    new M.Create(plausBar, { runTime: 0.8 }),
    new M.FadeIn(plausLbl, { runTime: 0.7 }),
    ...say('CONFIDENCE INTERVAL = PLAUSIBLE')
  );

  // 22: It is the estimate, plus or minus a multiplier times the standard error.
  await until(S(22));
  await play(
    ...fbox(['confidence interval:', ['estimate ± mult × SE', C.cyan], '10 ± mult × 0.65']),
    ...say('ESTIMATE ± MULTIPLIER × SE')
  );

  // 23: The multiplier comes from the t distribution, the reference curve from chapter six.
  const TY = P ? -2.35 : -1.50;
  const TW = P ? 3.1 : 3.0;
  const TH = P ? 2.4 : 2.1;
  const t2x = t => CX + (t / 4) * TW;
  const tPdf = t => Math.pow(1 + (t * t) / 10, -5.5);
  const tAxis = new M.Line({ start: [t2x(-4), TY, 0], end: [t2x(4), TY, 0], color: C.muted, strokeWidth: 2.5 });
  const tZero = new M.DashedLine({ start: [t2x(0), TY, 0], end: [t2x(0), TY + TH, 0], color: C.grid });
  const tZeroLbl = T('0', P ? 16 : 15, C.muted, true);
  tZeroLbl.moveTo([t2x(0), TY - 0.28, 0]);
  const curveSegs = [];
  const NSEG = 64;
  for (let k = 0; k < NSEG; k++) {
    const u0 = -4 + (8 * k) / NSEG, u1 = -4 + (8 * (k + 1)) / NSEG;
    curveSegs.push(new M.Line({
      start: [t2x(u0), TY + tPdf(u0) * TH, 0],
      end: [t2x(u1), TY + tPdf(u1) * TH, 0],
      color: C.violet, strokeWidth: 3.2
    }));
  }
  const tCurve = new M.VGroup(...curveSegs);
  const tTitle = T('t distribution (df = 10)', P ? 15 : 16, C.violet, true);
  tTitle.moveTo([CX, TY + TH + 0.34, 0]);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(sl1.group, s10Dot, s10Lbl, seGrp, seNameLbl, plausBar, plausLbl), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(tAxis, tZero, tZeroLbl, tTitle), { runTime: 0.6 }),
    new M.Create(tCurve, { runTime: 1.0 }),
    ...say('THE t REFERENCE CURVE', C.violet)
  );

  // 24: With ten degrees of freedom, it gives a multiplier of about two point two three.
  const NSHADE = 36;
  const shadeStrips = [];
  const stripW = (2 * 2.23 / NSHADE) * (TW / 4) + 0.015;
  for (let k = 0; k < NSHADE; k++) {
    const u = -2.23 + ((k + 0.5) * 4.46) / NSHADE;
    const h = tPdf(u) * TH;
    const r = new M.Rectangle({ width: stripW, height: h, color: C.cyan, strokeWidth: 0 });
    r.setFill(C.cyan, 0.28);
    r.moveTo([t2x(u), TY + h / 2, 0]);
    shadeStrips.push(r);
  }
  const tShade = new M.VGroup(...shadeStrips);
  const tCutL = new M.Line({ start: [t2x(-2.23), TY, 0], end: [t2x(-2.23), TY + tPdf(-2.23) * TH + 0.35, 0], color: C.cyan, strokeWidth: 2.5 });
  const tCutR = new M.Line({ start: [t2x(2.23), TY, 0], end: [t2x(2.23), TY + tPdf(2.23) * TH + 0.35, 0], color: C.cyan, strokeWidth: 2.5 });
  const tLblL = T('-2.23', P ? 16 : 15, C.cyan, true, true);
  tLblL.moveTo([t2x(-2.23), TY - 0.30, 0]);
  const tLblR = T('+2.23', P ? 16 : 15, C.cyan, true, true);
  tLblR.moveTo([t2x(2.23), TY - 0.30, 0]);
  const pct95 = T('95%', P ? 22 : 24, C.ink, true, true);
  pct95.moveTo([CX, TY + 0.42 * TH, 0]);
  const tMarks = new M.VGroup(tCutL, tCutR, tLblL, tLblR, pct95);

  await until(S(24));
  await play(
    new M.FadeIn(tShade, { runTime: 0.75 }),
    new M.FadeIn(tMarks, { runTime: 0.75 }),
    ...fbox(['df = 12 − 2 = 10', ['95% multiplier ≈ 2.23', C.violet]], C.violet),
    ...say('df = 10  →  MULTIPLIER ≈ 2.23', C.violet)
  );

  // 25: It is a bit more than two, because the noise itself was estimated from few apartments.
  const twoL = new M.DashedLine({ start: [t2x(-2), TY, 0], end: [t2x(-2), TY + 1.05, 0], color: C.amber });
  const twoR = new M.DashedLine({ start: [t2x(2), TY, 0], end: [t2x(2), TY + 1.05, 0], color: C.amber });
  const twoNote = T('2.23 > 2 (small sample)', P ? 16 : 15, C.amber, true);
  twoNote.moveTo([CX, TY - 0.70, 0]);
  const twoGrp = new M.VGroup(twoL, twoR, twoNote);

  await until(S(25));
  await play(
    new M.Create(twoL, { runTime: 0.6 }),
    new M.Create(twoR, { runTime: 0.6 }),
    new M.FadeIn(twoNote, { runTime: 0.6 }),
    ...say('2.23 > 2: SMALL SAMPLE NOISE', C.amber)
  );

  // 26: Two point two three times zero point six five is about one point four four.
  const sl2 = makeSlopeLine(6, 14, SLY, [6, 8, 10, 12, 14]);
  const p10 = new M.Dot({ point: [sl2.s2x(10), SLY, 0], radius: 0.12, color: C.ink });
  const p10L = T('10', P ? 17 : 18, C.ink, true, true);
  p10L.moveTo([sl2.s2x(10), SLY + 0.36, 0]);
  const mY = SLY + 0.85;
  const mLeft = new M.Line({ start: [sl2.s2x(10), mY, 0], end: [sl2.s2x(8.56), mY, 0], color: C.amber, strokeWidth: 4 });
  const mRight = new M.Line({ start: [sl2.s2x(10), mY, 0], end: [sl2.s2x(11.44), mY, 0], color: C.amber, strokeWidth: 4 });
  const mLblL = T('−1.44', P ? 16 : 15, C.amber, true, true);
  mLblL.moveTo([sl2.s2x(9.28), mY + 0.28, 0]);
  const mLblR = T('+1.44', P ? 16 : 15, C.amber, true, true);
  mLblR.moveTo([sl2.s2x(10.72), mY + 0.28, 0]);
  const marginGrp = new M.VGroup(mLeft, mRight, mLblL, mLblR);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(tAxis, tZero, tZeroLbl, tTitle, tCurve, tShade, tMarks, twoGrp), { runTime: 0.45 }),
    new M.FadeIn(sl2.group, { runTime: 0.55 }),
    new M.FadeIn(p10, { runTime: 0.55 }),
    new M.FadeIn(p10L, { runTime: 0.55 }),
    new M.FadeIn(marginGrp, { runTime: 0.8 }),
    ...fbox(['SE     ≈ 0.65', 'margin = 2.23 × 0.65', ['       ≈ 1.44', C.amber]], C.amber),
    ...say('MARGIN = 2.23 × 0.65 ≈ $1.44', C.amber)
  );

  // 27: Ten minus one point four four is eight point five six.
  const loDot = new M.Dot({ point: [sl2.s2x(8.56), SLY, 0], radius: 0.12, color: C.cyan });
  const loDrop = new M.DashedLine({ start: [sl2.s2x(8.56), mY, 0], end: [sl2.s2x(8.56), SLY, 0], color: C.cyan });
  const loLbl = T('8.56', P ? 18 : 17, C.cyan, true, true);
  loLbl.moveTo([sl2.s2x(8.56) - (P ? 0.42 : 0.40), SLY + 0.34, 0]);
  await until(S(27));
  await play(
    new M.Create(loDrop, { runTime: 0.5 }),
    new M.FadeIn(loDot, { runTime: 0.5 }),
    new M.FadeIn(loLbl, { runTime: 0.5 }),
    new M.Flash(loDot, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['margin ≈ 1.44', ['low  = 10 − 1.44 = 8.56', C.cyan]]),
    ...say('LOW END: 10 − 1.44 = 8.56')
  );

  // 28: Ten plus one point four four is eleven point four four.
  const hiDot = new M.Dot({ point: [sl2.s2x(11.44), SLY, 0], radius: 0.12, color: C.cyan });
  const hiDrop = new M.DashedLine({ start: [sl2.s2x(11.44), mY, 0], end: [sl2.s2x(11.44), SLY, 0], color: C.cyan });
  const hiLbl = T('11.44', P ? 18 : 17, C.cyan, true, true);
  hiLbl.moveTo([sl2.s2x(11.44) + (P ? 0.48 : 0.46), SLY + 0.34, 0]);
  await until(S(28));
  await play(
    new M.Create(hiDrop, { runTime: 0.5 }),
    new M.FadeIn(hiDot, { runTime: 0.5 }),
    new M.FadeIn(hiLbl, { runTime: 0.5 }),
    new M.Flash(hiDot, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['low  = 10 − 1.44 = 8.56', ['high = 10 + 1.44 = 11.44', C.cyan]]),
    ...say('HIGH END: 10 + 1.44 = 11.44')
  );

  // 29: So the ninety-five percent confidence interval runs from about eight and a half
  const ciBar = new M.Line({ start: [sl2.s2x(8.56), SLY, 0], end: [sl2.s2x(11.44), SLY, 0], color: C.green, strokeWidth: 9 });
  const ciCapL = new M.Line({ start: [sl2.s2x(8.56), SLY - 0.18, 0], end: [sl2.s2x(8.56), SLY + 0.18, 0], color: C.green, strokeWidth: 3.5 });
  const ciCapR = new M.Line({ start: [sl2.s2x(11.44), SLY - 0.18, 0], end: [sl2.s2x(11.44), SLY + 0.18, 0], color: C.green, strokeWidth: 3.5 });
  const ciTag = pill('95% CI: 8.56 TO 11.44', C.green, P ? 15 : 16);
  ciTag.moveTo([CX, SLY - 1.15, 0]);
  await until(S(29));
  await play(
    new M.Create(ciBar, { runTime: 0.8 }),
    new M.FadeIn(ciCapL, { runTime: 0.5 }),
    new M.Indicate(loLbl, { color: C.green, runTime: 0.8 }),
    ...say('95% CI: FROM ABOUT $8.50...', C.green)
  );

  // 30: to eleven and a half dollars per square metre.
  await until(S(30));
  await play(
    new M.FadeIn(ciCapR, { runTime: 0.5 }),
    new M.FadeIn(ciTag, { runTime: 0.6 }),
    new M.Indicate(hiLbl, { color: C.green, runTime: 0.8 }),
    ...fbox([['95% CI for slope:', C.green], '8.56 to 11.44 $/m²', ['(about 8.5 to 11.5)', C.muted]], C.green),
    ...say('...TO ABOUT $11.50 PER m²', C.green)
  );

  // =========================================================================
  // ACT 6 (31-32): True slope & 95% coverage across repeated samples
  // =========================================================================
  const SBY = P ? -4.35 : -2.35;
  const STY = P ? 0.90 : 1.05;
  const sl3 = makeSlopeLine(6, 14, SBY, [6, 8, 10, 12, 14]);
  const trueLine = new M.DashedLine({ start: [sl3.s2x(10), SBY, 0], end: [sl3.s2x(10), STY, 0], color: C.amber });
  const trueLbl = T('true slope (all apartments)', P ? 14 : 15, C.amber, true, true);
  trueLbl.moveTo([sl3.s2x(10), STY + 0.24, 0]);

  // 31: The true slope is the one we would get from every apartment in the neighbourhood.
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(sl2.group, p10, p10L, marginGrp, loDot, loDrop, loLbl, hiDot, hiDrop, hiLbl, ciBar, ciCapL, ciCapR, ciTag), { runTime: 0.45 }),
    new M.FadeIn(sl3.group, { runTime: 0.55 }),
    new M.Create(trueLine, { runTime: 0.7 }),
    new M.FadeIn(trueLbl, { runTime: 0.6 }),
    ...say('TRUE SLOPE = ALL APARTMENTS', C.amber)
  );

  // 32: Intervals made this way catch the true slope in about ninety-five out of one hundred samples.
  // 20 sample intervals: 19 catch 10 (green), 1 misses (pink, row 13)
  const SAMPLES20 = [
    [8.56, 11.44], [8.95, 11.65], [8.25, 10.95], [9.15, 11.95], [8.60, 11.30],
    [7.95, 10.75], [9.35, 12.15], [8.70, 11.50], [8.40, 11.10], [9.05, 11.85],
    [8.15, 10.85], [8.85, 11.65], [9.25, 12.05], [10.30, 13.10], [8.50, 11.20],
    [8.90, 11.70], [8.30, 11.00], [9.10, 11.90], [8.65, 11.45], [8.45, 11.25],
  ];
  const rowStep = (STY - SBY - 0.32) / 20;
  const ivGroups = SAMPLES20.map(([lo, hi], idx) => {
    const y = SBY + 0.22 + idx * rowStep;
    const hit = lo <= 10 && hi >= 10;
    const col = hit ? C.green : C.pink;
    const seg = new M.Line({ start: [sl3.s2x(lo), y, 0], end: [sl3.s2x(hi), y, 0], color: col, strokeWidth: hit ? 2.6 : 3.6 });
    const mid = new M.Dot({ point: [sl3.s2x((lo + hi) / 2), y, 0], radius: 0.055, color: col });
    return new M.VGroup(seg, mid);
  });
  await until(S(32));
  await play(
    new M.LaggedStart(ivGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.12, runTime: 3.0 }),
    ...fbox(['20 samples shown:', ['19 catch true slope', C.green], [' 1 misses (≈ 95%)', C.pink]], C.green),
    ...say('CATCHES TRUE SLOPE ≈ 95% OF TIME', C.green)
  );

  // =========================================================================
  // ACT 7 (33-34): Formula recap in plain words
  // =========================================================================
  const R1Y = P ? -0.45 : 0.25;
  const R2Y = P ? -2.05 : -1.05;
  const cSlope = chip('slope', C.ink, 1.25).moveTo([CX - 2.05, R1Y, 0]);
  const opPM = T('±', P ? 22 : 24, C.muted, true, true).moveTo([CX - 1.18, R1Y, 0]);
  const cMult = chip('multiplier', C.violet, 1.85).moveTo([CX - 0.02, R1Y, 0]);
  const opMul = T('×', P ? 22 : 24, C.muted, true, true).moveTo([CX + 1.16, R1Y, 0]);
  const cSE1 = chip('SE', C.amber, 0.92).moveTo([CX + 1.88, R1Y, 0]);
  const row1 = new M.VGroup(cSlope, opPM, cMult, opMul, cSE1);

  const cSE2 = chip('SE', C.amber, 0.92).moveTo([CX - 2.25, R2Y, 0]);
  const opEq = T('=', P ? 22 : 24, C.muted, true, true).moveTo([CX - 1.54, R2Y, 0]);
  const cNoise = chip('noise', C.pink, 1.25).moveTo([CX - 0.68, R2Y, 0]);
  const opDiv = T('÷', P ? 22 : 24, C.muted, true, true).moveTo([CX + 0.18, R2Y, 0]);
  const cSpread = chip('√(area spread)', C.green, 2.35).moveTo([CX + 1.62, R2Y, 0]);
  const row2 = new M.VGroup(cSE2, opEq, cNoise, opDiv, cSpread);

  // 33: In words: the slope, plus or minus the multiplier times the standard error.
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(sl3.group, trueLine, trueLbl, ...ivGroups), { runTime: 0.45 }),
    new M.FadeIn(row1, { runTime: 0.8 }),
    ...fbox(['95% CI =', ['slope ± t* × SE', C.cyan], '= 10 ± 2.23 × 0.65']),
    ...say('SLOPE ± MULTIPLIER × SE')
  );

  // 34: And the standard error is the noise, divided by the square root of the area spread.
  await until(S(34));
  await play(
    new M.FadeIn(row2, { runTime: 0.8 }),
    ...fbox([['SE = noise ÷ √spread', C.amber], '   = 50 ÷ √6,000', '   ≈ 0.65 $/m²'], C.amber),
    ...say('SE = NOISE ÷ √(AREA SPREAD)', C.amber)
  );

  // =========================================================================
  // ACT 8 (35-37): What it is for, zero outside the interval, link != cause
  // =========================================================================
  const slW = makeSlopeLine(0, 14, SLY, [0, 2, 4, 6, 8, 10, 12, 14]);
  const wBar = new M.Line({ start: [slW.s2x(8.56), SLY, 0], end: [slW.s2x(11.44), SLY, 0], color: C.green, strokeWidth: 9 });
  const wCapL = new M.Line({ start: [slW.s2x(8.56), SLY - 0.18, 0], end: [slW.s2x(8.56), SLY + 0.18, 0], color: C.green, strokeWidth: 3.5 });
  const wCapR = new M.Line({ start: [slW.s2x(11.44), SLY - 0.18, 0], end: [slW.s2x(11.44), SLY + 0.18, 0], color: C.green, strokeWidth: 3.5 });
  const wDot = new M.Dot({ point: [slW.s2x(10), SLY, 0], radius: 0.11, color: C.ink });
  const wLbl = T('8.56 to 11.44', P ? 15 : 16, C.green, true, true);
  wLbl.moveTo([slW.s2x(10), SLY + 0.44, 0]);
  const wCIGrp = new M.VGroup(wBar, wCapL, wCapR, wDot, wLbl);

  // 35: What is it for? It tells you how precisely the data pin down the rent added per square metre.
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(row1, row2), { runTime: 0.45 }),
    new M.FadeIn(slW.group, { runTime: 0.6 }),
    new M.FadeIn(wCIGrp, { runTime: 0.7 }),
    ...fbox(['slope  = $10 / m²', ['95% CI: 8.56–11.44', C.green], 'pins down the slope'], C.green),
    ...say('HOW PRECISELY WE PIN DOWN SLOPE', C.green)
  );

  // 36: Zero is far outside the interval, so rent clearly rises with area here.
  const zDot = new M.Dot({ point: [slW.s2x(0), SLY, 0], radius: 0.13, color: C.pink });
  const zTick = new M.Line({ start: [slW.s2x(0), SLY - 0.22, 0], end: [slW.s2x(0), SLY + 0.65, 0], color: C.pink, strokeWidth: 3 });
  const zLbl = T('0 (no rise)', P ? 16 : 15, C.pink, true, true);
  zLbl.moveTo([slW.s2x(0) + 0.55, SLY + 0.88, 0]);
  const gapLine = new M.DashedLine({ start: [slW.s2x(0.3), SLY + 0.32, 0], end: [slW.s2x(8.2), SLY + 0.32, 0], color: C.pink });
  const gapTxt = T('far outside!', P ? 16 : 15, C.pink, true);
  gapTxt.moveTo([slW.s2x(4.2), SLY + 0.58, 0]);
  const zeroGrp = new M.VGroup(zTick, zLbl, gapLine, gapTxt);

  await until(S(36));
  await play(
    new M.FadeIn(zDot, { runTime: 0.5 }),
    new M.FadeIn(zeroGrp, { runTime: 0.7 }),
    new M.Flash(zDot, { color: C.pink, runTime: 0.6 }),
    ...say('0 IS FAR OUTSIDE → CLEAR RISE', C.pink)
  );

  // 37: That is a link, not proof that the extra space itself causes the higher rent.
  const causeBadge = pill('LINK ≠ PROOF OF CAUSE', C.amber, P ? 16 : 17);
  causeBadge.moveTo([CX, SLY - 1.25, 0]);
  await until(S(37));
  await play(
    new M.FadeIn(causeBadge, { runTime: 0.7 }),
    ...fbox(['0 is far outside CI', ['clear link with area', C.green], ['not proof of cause', C.amber]], C.amber),
    ...say('LINK, NOT PROOF OF CAUSE', C.amber)
  );

  // =========================================================================
  // ACT 9 (38-40): The trap, next-lesson bridge, and one-sentence recap
  // =========================================================================
  const sc2 = makeScatter();
  const ciLoLine = lineThroughCentre(8.56, 1100, C.green, 2.6, true);
  const ciHiLine = lineThroughCentre(11.44, 1100, C.green, 2.6, true);
  const wedgeLbl = T('mean slope CI', P ? 16 : 16, C.green, true, true);
  wedgeLbl.moveTo([ax(88), ay(920), 0]);

  // 38: Here is the trap. The interval is about the mean rent change, not about any single apartment.
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(slW.group, wCIGrp, zDot, zeroGrp, causeBadge), { runTime: 0.45 }),
    new M.FadeIn(sc2.frame, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...sc2.dots), { runTime: 0.6 }),
    new M.Create(sc2.whiteLine, { runTime: 0.6 }),
    new M.Create(ciLoLine, { runTime: 0.7 }),
    new M.Create(ciHiLine, { runTime: 0.7 }),
    new M.FadeIn(wedgeLbl, { runTime: 0.6 }),
    ...fbox([['TRAP:', C.pink], 'CI = mean rent change', ['NOT one apartment!', C.pink]], C.pink),
    ...say('TRAP: MEAN CHANGE, NOT ONE', C.pink)
  );
  await play(
    new M.Indicate(sc2.dots[9], { color: C.pink, runTime: 0.8 }),
    new M.Indicate(sc2.dots[5], { color: C.pink, runTime: 0.8 })
  );

  // 39: And it rests on promises about the data, which we check in the next lesson.
  const xDots = [sc2.dots[0], sc2.dots[3], sc2.dots[6], sc2.dots[9]];
  const zDots = [sc2.dots[2], sc2.dots[5], sc2.dots[8], sc2.dots[11]];
  await until(S(39));
  await play(
    new M.LaggedStart([...xDots, ...zDots].map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox(['next lesson (10.1.9):', ['check model promises', C.violet], 'X above · Z below'], C.violet),
    ...say('CHECK PROMISES NEXT LESSON', C.violet)
  );

  // 40: In one sentence: the slope's confidence interval shows the range of plausible rent added per square metre.
  await until(S(40));
  await play(
    new M.Indicate(ciHiLine, { color: C.green, runTime: 1.0 }),
    new M.Indicate(ciLoLine, { color: C.green, runTime: 1.0 }),
    ...fbox(['slope  = $10 / m²', 'SE     ≈ $0.65 / m²', ['95% CI: $8.56–$11.44', C.green]], C.green),
    ...say('PLAUSIBLE SLOPE: $8.56 TO $11.44', C.green)
  );
}
