// 10.2.8 Residual diagnostics: find a missed curve.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // Shared chapter 10.2 data: 12 regular apartments (cards A through L)
  // Straight rent-on-area fit: fitted(area) = 166⅔ + 20 * area -> 966⅔, 1166⅔, 1366⅔
  const FIT = { 40: 966 + 2 / 3, 50: 1166 + 2 / 3, 60: 1366 + 2 / 3 };
  const DX = P ? 0.14 : 0.13;
  const CARDS = [
    { id: 'A', area: 40, rent: 980,  dx: 0 },
    { id: 'B', area: 40, rent: 1000, dx: -DX },
    { id: 'C', area: 40, rent: 1000, dx: DX },
    { id: 'D', area: 40, rent: 1020, dx: 0 },
    { id: 'E', area: 50, rent: 1060, dx: 0 },
    { id: 'F', area: 50, rent: 1100, dx: -DX },
    { id: 'G', area: 50, rent: 1100, dx: DX },
    { id: 'H', area: 50, rent: 1140, dx: 0 },
    { id: 'I', area: 60, rent: 1320, dx: 0 },
    { id: 'J', area: 60, rent: 1400, dx: -DX },
    { id: 'K', area: 60, rent: 1400, dx: DX },
    { id: 'L', area: 60, rent: 1480, dx: 0 },
  ].map(d => ({ ...d, fit: FIT[d.area], res: d.rent - FIT[d.area] }));

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const xL = P ? -2.75 : -5.4, xR = P ? 3.35 : 1.8;
  const yB = P ? -4.25 : -2.15, yT = P ? 1.05 : 1.25;
  const CX = (xL + xR) / 2;
  const PILL = P ? [0, 2.08, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.42, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Coordinate mappers: Chart 1 (Area vs Rent) and Chart 2 (Fitted Rent vs Residual)
  const xArea = a => xL + (a - 34) / 32 * (xR - xL);
  const yRent = r => yB + (r - 920) / 600 * (yT - yB);
  const xFit = f => xL + (f - 860) / 620 * (xR - xL);
  const yRes = v => yB + (v + 135) / 280 * (yT - yB);

  const DR = P ? 0.08 : 0.068, HR = P ? 0.19 : 0.16;
  function glowDot(p, color = C.cyan, r = DR, hr = HR) {
    const halo = new M.Dot({ point: p, radius: hr, color });
    halo.setFill(color, 0.22);
    const core = new M.Dot({ point: p, radius: r, color });
    return new M.VGroup(halo, core);
  }

  // Formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.40 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.5;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // =========================================================================
  // Beats 0-1: Opening question — one straight line, where does it miss?
  // =========================================================================
  const pCX = P ? 0 : CX, pCY = P ? -1.45 : -0.45, pW = P ? 5.2 : 5.6, pH = P ? 2.6 : 2.3;
  const pX0 = pCX - pW / 2, pY0 = pCY - pH / 2;
  const pAxisX = new M.Line({ start: [pX0, pY0, 0], end: [pX0 + pW, pY0, 0], color: C.muted, strokeWidth: 2.5 });
  const pAxisY = new M.Line({ start: [pX0, pY0, 0], end: [pX0, pY0 + pH, 0], color: C.muted, strokeWidth: 2.5 });
  const pLabX = T('apartment size', P ? 18 : 19, C.muted);
  pLabX.moveTo([pCX, pY0 - 0.35, 0]);
  const pLabY = T('rent', P ? 18 : 19, C.muted);
  pLabY.moveTo([pX0 + pLabY.getWidth() / 2, pY0 + pH + 0.28, 0]);
  const pLine = new M.Line({ start: [pX0 + 0.4, pY0 + 0.45, 0], end: [pX0 + pW - 0.4, pY0 + pH - 0.35, 0], color: C.amber, strokeWidth: 4 });
  const pLineTag = T('straight line', P ? 16 : 17, C.amber, true);
  pLineTag.moveTo([pX0 + pW - 1.1, pY0 + pH - 0.05, 0]);

  await until(S(0));
  await play(
    new M.Create(pAxisX, { runTime: 0.7 }),
    new M.Create(pAxisY, { runTime: 0.7 }),
    new M.FadeIn(pLabX, { runTime: 0.7 }),
    new M.FadeIn(pLabY, { runTime: 0.7 }),
    new M.Create(pLine, { runTime: 1.1 }),
    new M.FadeIn(pLineTag, { runTime: 1.0 }),
    ...say('ONE STRAIGHT LINE: SIZE → RENT', C.amber)
  );

  // Beat 1: Show three illustrative misses around the preview line
  const missSpecs = [
    [0.24, 0.42],
    [0.52, -0.46],
    [0.80, 0.44],
  ];
  const missObjs = [];
  for (const [u, dy] of missSpecs) {
    const mx = pX0 + 0.4 + u * (pW - 0.8);
    const ly = pY0 + 0.45 + u * (pH - 0.8);
    const col = dy > 0 ? C.green : C.pink;
    const gap = new M.DashedLine({ start: [mx, ly, 0], end: [mx, ly + dy, 0], color: col });
    const d = glowDot([mx, ly + dy, 0], C.cyan, 0.08, 0.19);
    const q = T('?', P ? 18 : 19, col, true, true);
    q.moveTo([mx + 0.26, ly + dy * 0.55, 0]);
    missObjs.push(gap, d, q);
  }
  await until(S(1));
  await play(
    new M.LaggedStart(missObjs.map(o => new M.FadeIn(o)), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('WHERE DOES THE LINE MISS?', C.amber)
  );

  // =========================================================================
  // Beats 2-7: Chart 1 — 12 apartment dots, axes, 3 groups, group averages
  // =========================================================================
  const cXAxis = new M.Line({ start: [xL, yB, 0], end: [xR, yB, 0], color: C.muted, strokeWidth: 2.5 });
  const cYAxis = new M.Line({ start: [xL, yB, 0], end: [xL, yT, 0], color: C.muted, strokeWidth: 2.5 });
  const cPts = CARDS.map(d => [xArea(d.area) + d.dx, yRent(d.rent), 0]);
  const cDots = cPts.map(p => glowDot(p, C.cyan));

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(pAxisX, pAxisY, pLabX, pLabY, pLine, pLineTag, ...missObjs), { runTime: 0.6 }),
    new M.Create(cXAxis, { runTime: 0.8 }),
    new M.Create(cYAxis, { runTime: 0.8 }),
    new M.LaggedStart(cDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.3 }),
    ...say('12 APARTMENTS ON A CHART', C.cyan)
  );

  // Beat 3: Floor area along bottom, monthly rent up side
  const cXTicks = [40, 50, 60].map(a => {
    const x = xArea(a);
    const tk = new M.Line({ start: [x, yB - 0.08, 0], end: [x, yB + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(a), P ? 17 : 18, C.muted, true);
    lb.moveTo([x, yB - 0.32, 0]);
    return new M.VGroup(tk, lb);
  });
  const cXTitle = T('Floor area (square metres)', P ? 17 : 18, C.ink);
  cXTitle.moveTo([CX, yB - (P ? 0.82 : 0.70), 0]);

  const cYTicks = [1000, 1100, 1200, 1300, 1400, 1500].map(r => {
    const y = yRent(r);
    const gl = new M.Line({ start: [xL, y, -0.01], end: [xR, y, -0.01], color: C.line, strokeWidth: 1 });
    gl.setStrokeOpacity(0.45);
    const tk = new M.Line({ start: [xL - 0.07, y, 0], end: [xL + 0.07, y, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(r.toLocaleString('en-US'), P ? 15 : 16, C.muted, true);
    lb.moveTo([xL - 0.16 - lb.getWidth() / 2, y, 0]);
    return new M.VGroup(gl, tk, lb);
  });
  const cYTitle = T('Monthly rent ($)', P ? 17 : 18, C.ink);
  cYTitle.moveTo([xL + cYTitle.getWidth() / 2, yT + 0.26, 0]);

  await until(S(3));
  await play(
    new M.FadeIn(new M.VGroup(...cXTicks, cXTitle), { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...cYTicks, cYTitle), { runTime: 0.9 }),
    ...say('BOTTOM: FLOOR AREA  ·  SIDE: RENT', C.muted)
  );

  // Beat 4: Three groups of four apartments
  const grpBoxes = [
    { a: 40, lo: 980, hi: 1020 },
    { a: 50, lo: 1060, hi: 1140 },
    { a: 60, lo: 1320, hi: 1480 },
  ].map(g => {
    const h = Math.max(P ? 0.72 : 0.56, yRent(g.hi) - yRent(g.lo) + 0.36);
    const box = new M.RoundedRectangle({ width: P ? 0.68 : 0.64, height: h, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
    box.setFill(C.cyan, 0.07);
    box.moveTo([xArea(g.a), (yRent(g.lo) + yRent(g.hi)) / 2, 0]);
    const cnt = T('4', P ? 17 : 18, C.cyan, true, true);
    cnt.moveTo([xArea(g.a), (yRent(g.lo) + yRent(g.hi)) / 2 + h / 2 + 0.22, 0]);
    return new M.VGroup(box, cnt);
  });
  await until(S(4));
  await play(
    new M.LaggedStart(grpBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.3 }),
    ...say('3 GROUPS × 4 APARTMENTS', C.cyan)
  );

  // Beat 5: 40 m² average = $1,000
  const avgBar = (a, v) => {
    const x = xArea(a), y = yRent(v), hw = P ? 0.34 : 0.32;
    const ln = new M.Line({ start: [x - hw, y, 0], end: [x + hw, y, 0], color: C.violet, strokeWidth: 3.5 });
    return ln;
  };
  const avgBar40 = avgBar(40, 1000);
  const avgLab40 = T('avg $1,000', P ? 16 : 17, C.violet, true, true);
  avgLab40.moveTo([xArea(40), yRent(1020) + (P ? 0.44 : 0.36), 0]);
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...grpBoxes), { runTime: 0.5 }),
    new M.Create(avgBar40, { runTime: 0.7 }),
    new M.FadeIn(avgLab40, { runTime: 0.7 }),
    new M.LaggedStart(cDots.slice(0, 4).map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('40 m²: AVERAGE = $1,000', C.violet)
  );

  // Beat 6: 50 m² average = $1,100
  const avgBar50 = avgBar(50, 1100);
  const avgLab50 = T('avg $1,100', P ? 16 : 17, C.violet, true, true);
  avgLab50.moveTo([xArea(50), yRent(1140) + (P ? 0.44 : 0.36), 0]);
  await until(S(6));
  await play(
    new M.Create(avgBar50, { runTime: 0.7 }),
    new M.FadeIn(avgLab50, { runTime: 0.7 }),
    new M.LaggedStart(cDots.slice(4, 8).map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('50 m²: AVERAGE = $1,100', C.violet)
  );

  // Beat 7: 60 m² average = $1,400
  const avgBar60 = avgBar(60, 1400);
  const avgLab60 = T('avg $1,400', P ? 16 : 17, C.violet, true, true);
  avgLab60.moveTo([xArea(54.8), yRent(1400), 0]);
  await until(S(7));
  await play(
    new M.Create(avgBar60, { runTime: 0.7 }),
    new M.FadeIn(avgLab60, { runTime: 0.7 }),
    new M.LaggedStart(cDots.slice(8, 12).map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('60 m²: AVERAGE = $1,400', C.violet)
  );

  // =========================================================================
  // Beats 8-12: Straight fitted line and fitted rents at 40, 50, 60 m²
  // =========================================================================
  const fitLine = new M.Line({
    start: [xArea(38), yRent(166 + 2 / 3 + 20 * 38), 0],
    end:   [xArea(64), yRent(166 + 2 / 3 + 20 * 64), 0],
    color: C.amber,
    strokeWidth: 4,
  });
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(avgBar40, avgLab40, avgBar50, avgLab50, avgBar60, avgLab60), { runTime: 0.5 }),
    new M.Create(fitLine, { runTime: 1.2 }),
    ...say('STRAIGHT LINE FITTED TO ALL 12', C.amber)
  );

  // Beat 9: Predicted rent at a card's area = fitted rent
  const fitDots = [40, 50, 60].map(a => glowDot([xArea(a), yRent(FIT[a]), 0], C.amber, P ? 0.095 : 0.085, P ? 0.22 : 0.19));
  await until(S(9));
  await play(
    new M.LaggedStart(fitDots.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.1 }),
    ...say('FITTED RENT = LINE’S PREDICTION', C.amber)
  );

  // Beat 10: Small apartments fitted ≈ $967
  const fGuide40 = new M.DashedLine({ start: [xArea(40), yB, 0], end: [xArea(40), yRent(FIT[40]), 0], color: C.amber });
  const fLab40 = T('≈ $967', P ? 16 : 17, C.amber, true, true);
  fLab40.moveTo([xArea(44.2), yRent(945), 0]);
  await until(S(10));
  await play(
    new M.Create(fGuide40, { runTime: 0.7 }),
    new M.FadeIn(fLab40, { runTime: 0.7 }),
    new M.Flash(fitDots[0].submobjects[1], { color: C.amber, runTime: 0.8 }),
    ...say('SMALL (40 m²): FITTED ≈ $967', C.amber)
  );

  // Beat 11: Medium apartments fitted ≈ $1,167
  const fGuide50 = new M.DashedLine({ start: [xArea(50), yB, 0], end: [xArea(50), yRent(FIT[50]), 0], color: C.amber });
  const fLab50 = T('≈ $1,167', P ? 16 : 17, C.amber, true, true);
  fLab50.moveTo([xArea(45.5), yRent(1215), 0]);
  await until(S(11));
  await play(
    new M.Create(fGuide50, { runTime: 0.7 }),
    new M.FadeIn(fLab50, { runTime: 0.7 }),
    new M.Flash(fitDots[1].submobjects[1], { color: C.amber, runTime: 0.8 }),
    ...say('MEDIUM (50 m²): FITTED ≈ $1,167', C.amber)
  );

  // Beat 12: Large apartments fitted ≈ $1,367
  const fGuide60 = new M.DashedLine({ start: [xArea(60), yB, 0], end: [xArea(60), yRent(FIT[60]), 0], color: C.amber });
  const fLab60 = T('≈ $1,367', P ? 16 : 17, C.amber, true, true);
  fLab60.moveTo([xArea(55.0), yRent(1367), 0]);
  await until(S(12));
  await play(
    new M.Create(fGuide60, { runTime: 0.7 }),
    new M.FadeIn(fLab60, { runTime: 0.7 }),
    new M.Flash(fitDots[2].submobjects[1], { color: C.amber, runTime: 0.8 }),
    ...say('LARGE (60 m²): FITTED ≈ $1,367', C.amber)
  );

  // =========================================================================
  // Beats 13-17: Example dot B ($1,000), signed gap, and "residual"
  // =========================================================================
  const exIdx = 1; // Card B: area 40, rent 1000, fitted 966.67, residual +33.33
  const exPt = cPts[exIdx];
  const exRing = new M.Circle({ radius: P ? 0.21 : 0.18, color: C.green, strokeWidth: 3 });
  exRing.moveTo(exPt);
  const exAskLab = T('asking $1,000', P ? 16 : 17, C.green, true, true);
  exAskLab.moveTo([xArea(40), yRent(1105), 0]);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(fGuide50, fLab50, fGuide60, fLab60, fLab40), { runTime: 0.5 }),
    new M.Create(exRing, { runTime: 0.7 }),
    new M.FadeIn(exAskLab, { runTime: 0.7 }),
    new M.Flash(cDots[exIdx].submobjects[1], { color: C.green, runTime: 0.8 }),
    ...say('EXAMPLE: ASKING RENT = $1,000', C.green)
  );

  // Beat 14: About $33 above the line
  const fitRefH = new M.DashedLine({ start: [exPt[0], yRent(FIT[40]), 0], end: [xArea(40), yRent(FIT[40]), 0], color: C.amber });
  const aboveLab = T('≈ $33 above', P ? 16 : 17, C.green, true, true);
  aboveLab.moveTo([xArea(42.2) + aboveLab.getWidth() / 2, yRent(972), 0]);
  await until(S(14));
  await play(
    new M.Create(fitRefH, { runTime: 0.6 }),
    new M.FadeIn(aboveLab, { runTime: 0.7 }),
    new M.Indicate(exRing, { color: C.green, runTime: 0.9 }),
    ...say('ABOUT $33 ABOVE THE LINE', C.green)
  );

  // Beat 15: Draw the vertical gap from the line to the dot
  const exGap = new M.Line({
    start: [exPt[0], yRent(FIT[40]), 0],
    end:   [exPt[0], exPt[1], 0],
    color: C.green,
    strokeWidth: 4.5,
  });
  await until(S(15));
  await play(
    new M.Create(exGap, { runTime: 0.9 }),
    ...say('GAP FROM LINE TO DOT', C.green)
  );

  // Beat 16: Signed gap — plus above the line, minus below
  const plusSign = T('+', P ? 22 : 22, C.green, true, true);
  plusSign.moveTo([exPt[0] - 0.24, (yRent(FIT[40]) + exPt[1]) / 2, 0]);
  // Demo downward gap on card G (50 m², $1,100 -> -67 below fitted $1,167)
  const gPt = cPts[6];
  const gRefH = new M.DashedLine({ start: [xArea(50), yRent(FIT[50]), 0], end: [gPt[0], yRent(FIT[50]), 0], color: C.amber });
  const gGap = new M.Line({
    start: [gPt[0], yRent(FIT[50]), 0],
    end:   [gPt[0], gPt[1], 0],
    color: C.pink,
    strokeWidth: 4.5,
  });
  const minusSign = T('−', P ? 22 : 22, C.pink, true, true);
  minusSign.moveTo([gPt[0] + 0.24, (yRent(FIT[50]) + gPt[1]) / 2, 0]);

  await until(S(16));
  await play(
    new M.FadeIn(plusSign, { runTime: 0.6 }),
    new M.Create(gRefH, { runTime: 0.6 }),
    new M.Create(gGap, { runTime: 0.9 }),
    new M.FadeIn(minusSign, { runTime: 0.7 }),
    ...say('+ ABOVE THE LINE  ·  − BELOW', C.cyan)
  );

  // Beat 17: Name — residual
  const resTag1 = T('residual ≈ +$33', P ? 17 : 18, C.green, true, true);
  resTag1.moveTo([xArea(40.8), yRent(1125), 0]);
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(exAskLab, aboveLab), { runTime: 0.5 }),
    new M.FadeIn(resTag1, { runTime: 0.7 }),
    new M.Indicate(exGap, { color: C.amber, runTime: 1.0 }),
    ...say('RESIDUAL = SIGNED GAP', C.green)
  );

  // =========================================================================
  // Beats 18-23: Chart 2 — Residual plot setup and example dot
  // =========================================================================
  const rXAxis = new M.Line({ start: [xL, yB, 0], end: [xR, yB, 0], color: C.muted, strokeWidth: 2.5 });
  const rYAxis = new M.Line({ start: [xL, yB, 0], end: [xL, yT, 0], color: C.muted, strokeWidth: 2.5 });
  const zeroY = yRes(0);
  const zeroLine = new M.DashedLine({ start: [xL, zeroY, 0], end: [xR, zeroY, 0], color: C.amber });
  const zeroTick = T('0', P ? 16 : 17, C.amber, true, true);
  zeroTick.moveTo([xL - 0.16 - zeroTick.getWidth() / 2, zeroY, 0]);

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(
      cXAxis, cYAxis, ...cXTicks, cXTitle, ...cYTicks, cYTitle,
      ...cDots, fitLine, ...fitDots, fGuide40,
      exRing, fitRefH, exGap, plusSign, gRefH, gGap, minusSign, resTag1
    ), { runTime: 0.6 }),
    ...say('NEW CHART: ZERO LINE', C.amber)
  );
  await play(
    new M.Create(rXAxis, { runTime: 0.7 }),
    new M.Create(rYAxis, { runTime: 0.7 }),
    new M.Create(zeroLine, { runTime: 0.9 }),
    new M.FadeIn(zeroTick, { runTime: 0.7 })
  );

  // Beat 19: Zero means asking rent matches fitted rent
  const zeroNote = T('asking rent = fitted rent', P ? 16 : 17, C.amber, true);
  zeroNote.moveTo([CX, zeroY + 0.30, 0]);
  await until(S(19));
  await play(
    new M.Indicate(zeroLine, { color: C.amber, runTime: 1.0 }),
    new M.FadeIn(zeroNote, { runTime: 0.8 }),
    ...say('ZERO = ASKING MATCHES FITTED', C.amber)
  );

  // Beat 20: Bottom axis — fitted rent
  const rXTicks = [
    [FIT[40], '$967'],
    [FIT[50], '$1,167'],
    [FIT[60], '$1,367'],
  ].map(([f, lab]) => {
    const x = xFit(f);
    const tk = new M.Line({ start: [x, yB - 0.08, 0], end: [x, yB + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(lab, P ? 16 : 17, C.muted, true);
    lb.moveTo([x, yB - 0.32, 0]);
    return new M.VGroup(tk, lb);
  });
  const rXTitle = T('Fitted rent ($)', P ? 17 : 18, C.ink);
  rXTitle.moveTo([CX, yB - (P ? 0.82 : 0.70), 0]);

  await until(S(20));
  await play(
    new M.FadeIn(new M.VGroup(...rXTicks, rXTitle), { runTime: 0.9 }),
    new M.Indicate(rXAxis, { color: C.cyan, runTime: 0.9 }),
    ...say('BOTTOM: FITTED RENT', C.cyan)
  );

  // Beat 21: Side axis — residual
  const rYTicks = [-100, -50, 50, 100].map(v => {
    const y = yRes(v);
    const gl = new M.Line({ start: [xL, y, -0.01], end: [xR, y, -0.01], color: C.line, strokeWidth: 1 });
    gl.setStrokeOpacity(0.45);
    const tk = new M.Line({ start: [xL - 0.07, y, 0], end: [xL + 0.07, y, 0], color: C.muted, strokeWidth: 2 });
    const s = v > 0 ? `+${v}` : `−${Math.abs(v)}`;
    const lb = T(s, P ? 15 : 16, C.muted, true);
    lb.moveTo([xL - 0.16 - lb.getWidth() / 2, y, 0]);
    return new M.VGroup(gl, tk, lb);
  });
  const rYTitle = T('Residual ($)', P ? 17 : 18, C.ink);
  rYTitle.moveTo([xL + rYTitle.getWidth() / 2, yT + 0.26, 0]);

  await until(S(21));
  await play(
    new M.FadeIn(new M.VGroup(...rYTicks, rYTitle), { runTime: 0.9 }),
    new M.Indicate(rYAxis, { color: C.cyan, runTime: 0.9 }),
    ...say('SIDE: RESIDUAL ($)', C.cyan)
  );

  // Prebuild all 12 residual plot dots & stems (positive = green, negative = pink)
  const rPts = CARDS.map(d => [xFit(d.fit) + d.dx, yRes(d.res), 0]);
  const rCols = CARDS.map(d => d.res >= 0 ? C.green : C.pink);
  const rDots = CARDS.map((d, k) => glowDot(rPts[k], rCols[k]));
  const rStems = CARDS.map((d, k) => {
    const ln = new M.Line({ start: [rPts[k][0], zeroY, -0.01], end: [rPts[k][0], rPts[k][1], -0.01], color: rCols[k], strokeWidth: 1.8 });
    ln.setStrokeOpacity(0.5);
    return ln;
  });

  // Beat 22: Place example dot B (+$33 above zero at $967)
  const exRGuide = new M.DashedLine({ start: [rPts[exIdx][0], yB, 0], end: [rPts[exIdx][0], zeroY, 0], color: C.muted });
  const exRLab = T('+$33', P ? 17 : 18, C.green, true, true);
  exRLab.moveTo([rPts[exIdx][0] + 0.56, rPts[exIdx][1] + 0.08, 0]);
  await until(S(22));
  await play(
    new M.FadeOut(zeroNote, { runTime: 0.4 }),
    new M.Create(exRGuide, { runTime: 0.6 }),
    new M.Create(rStems[exIdx], { runTime: 0.7 }),
    new M.FadeIn(rDots[exIdx], { runTime: 0.7 }),
    new M.Flash(rDots[exIdx].submobjects[1], { color: C.green, runTime: 0.8 }),
    new M.FadeIn(exRLab, { runTime: 0.7 }),
    ...say('EXAMPLE DOT: ($967, +$33)', C.green)
  );

  // Beat 23: Name — residual plot
  await until(S(23));
  await play(
    new M.Indicate(rDots[exIdx], { color: C.amber, runTime: 0.9 }),
    ...say('THIS IS A RESIDUAL PLOT', C.cyan)
  );

  // =========================================================================
  // Beats 24-28: Place left, middle, and right groups on the residual plot
  // =========================================================================
  // Beat 24: Left group — all 4 dots stand above zero
  const leftRest = [0, 2, 3];
  const badgeL = T('all 4 +', P ? 16 : 17, C.green, true, true);
  badgeL.moveTo([xFit(FIT[40]), yRes(92), 0]);
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(exRGuide, exRLab), { runTime: 0.4 }),
    new M.LaggedStart(leftRest.flatMap(k => [new M.Create(rStems[k]), new M.FadeIn(rDots[k])]), { lagRatio: 0.12, runTime: 1.1 }),
    new M.FadeIn(badgeL, { runTime: 0.7 }),
    ...say('LEFT: ALL 4 ABOVE ZERO (+)', C.green)
  );

  // Beat 25: Middle group — all 4 dots stand below zero
  const midIdx = [4, 5, 6, 7];
  const badgeM = T('all 4 −', P ? 16 : 17, C.pink, true, true);
  badgeM.moveTo([xFit(FIT[50]) + 0.34 + badgeM.getWidth() / 2, yRes(-72), 0]);
  await until(S(25));
  await play(
    new M.LaggedStart(midIdx.flatMap(k => [new M.Create(rStems[k]), new M.FadeIn(rDots[k])]), { lagRatio: 0.1, runTime: 1.2 }),
    new M.FadeIn(badgeM, { runTime: 0.7 }),
    ...say('MIDDLE: ALL 4 BELOW ZERO (−)', C.pink)
  );

  // Beat 26: Right group — 4 dots as a group
  const rightIdx = [8, 9, 10, 11];
  const rightBox = new M.RoundedRectangle({
    width: P ? 0.72 : 0.68,
    height: yRes(114) - yRes(-47) + 0.42,
    cornerRadius: 0.14,
    color: C.cyan,
    strokeWidth: 2,
  });
  rightBox.setFill(C.cyan, 0.06);
  rightBox.moveTo([xFit(FIT[60]), (yRes(114) + yRes(-47)) / 2, 0]);
  await until(S(26));
  await play(
    new M.LaggedStart(rightIdx.flatMap(k => [new M.Create(rStems[k]), new M.FadeIn(rDots[k])]), { lagRatio: 0.1, runTime: 1.1 }),
    new M.Create(rightBox, { runTime: 0.8 }),
    ...say('RIGHT GROUP: 4 APARTMENTS', C.cyan)
  );

  // Beat 27: Listing at $1,320 (card I, index 8) falls below its fitted rent
  const iRing = new M.Circle({ radius: P ? 0.21 : 0.18, color: C.pink, strokeWidth: 3 });
  iRing.moveTo(rPts[8]);
  const iLab = T('$1,320 (−$47)', P ? 15 : 16, C.pink, true, true);
  iLab.moveTo([xFit(FIT[60]), yRes(-88), 0]);
  await until(S(27));
  await play(
    new M.FadeOut(rightBox, { runTime: 0.4 }),
    new M.Create(iRing, { runTime: 0.7 }),
    new M.Flash(rDots[8].submobjects[1], { color: C.pink, runTime: 0.8 }),
    new M.FadeIn(iLab, { runTime: 0.7 }),
    ...say('$1,320 FALLS BELOW FITTED RENT', C.pink)
  );

  // Beat 28: The other three dots are above zero
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(iRing, iLab), { runTime: 0.4 }),
    new M.LaggedStart([9, 10, 11].map(k => new M.Indicate(rDots[k], { color: C.green })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('OTHER 3 DOTS ABOVE ZERO (+)', C.green)
  );

  // =========================================================================
  // Beats 29-32: Group average residuals & U shape (missed bend)
  // =========================================================================
  const meanSpecs = [
    { f: FIT[40], r: 33 + 1 / 3,  lab: '+$33', lx: xFit(FIT[40]),                     ly: yRes(92) },
    { f: FIT[50], r: -66 - 2 / 3, lab: '−$67', lx: xFit(FIT[50]) + (P ? 0.74 : 0.86), ly: yRes(-75) },
    { f: FIT[60], r: 33 + 1 / 3,  lab: '+$33', lx: xFit(FIT[60]) - (P ? 0.72 : 0.85), ly: yRes(56) },
  ];
  const avgDots = meanSpecs.map(m => {
    const p = [xFit(m.f), yRes(m.r), 0];
    const halo = new M.Dot({ point: p, radius: P ? 0.30 : 0.27, color: C.amber });
    halo.setFill(C.amber, 0.24);
    const core = new M.Dot({ point: p, radius: P ? 0.145 : 0.13, color: C.amber });
    const ring = new M.Circle({ radius: P ? 0.16 : 0.145, color: C.ink, strokeWidth: 2 });
    ring.moveTo(p);
    return new M.VGroup(halo, core, ring);
  });
  const avgLabs = meanSpecs.map(m => {
    const t = T(m.lab, P ? 16 : 17, C.amber, true, true);
    t.moveTo([m.lx, m.ly, 0]);
    return t;
  });

  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(badgeL, badgeM), { runTime: 0.4 }),
    new M.LaggedStart(avgDots.map((d, i) => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.2 }),
    new M.LaggedStart(avgLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('GROUP AVERAGE RESIDUALS', C.amber)
  );

  // Beat 30: Above zero, below zero, above zero again
  await until(S(30));
  await play(
    new M.LaggedStart(avgDots.map(d => new M.Flash(d.submobjects[1], { color: C.amber })), { lagRatio: 0.35, runTime: 1.8 }),
    new M.LaggedStart(avgDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.35, runTime: 1.8 }),
    ...say('ABOVE → BELOW → ABOVE', C.amber)
  );

  // Beat 31: U shape, like a shallow bowl — exact parabola through (+33⅓, -66⅔, +33⅓)
  const uSegs = [];
  const NSEG = 24;
  for (let s = 0; s < NSEG; s++) {
    const u0 = -1 + 2 * s / NSEG, u1 = -1 + 2 * (s + 1) / NSEG;
    const f0 = FIT[50] + 200 * u0, f1 = FIT[50] + 200 * u1;
    const r0 = -66 - 2 / 3 + 100 * u0 * u0, r1 = -66 - 2 / 3 + 100 * u1 * u1;
    const seg = new M.Line({
      start: [xFit(f0), yRes(r0), 0],
      end:   [xFit(f1), yRes(r1), 0],
      color: C.amber,
      strokeWidth: 4.5,
    });
    uSegs.push(seg);
  }
  await until(S(31));
  await play(
    new M.LaggedStart(uSegs.map(s => new M.Create(s)), { lagRatio: 0.08, runTime: 1.3 }),
    ...say('U SHAPE = SHALLOW BOWL', C.amber)
  );

  // Beat 32: Pattern tells us the straight line misses a bend
  await until(S(32));
  await play(
    new M.LaggedStart(uSegs.map(s => new M.Indicate(s, { color: C.pink })), { lagRatio: 0.03, runTime: 1.3 }),
    ...say('STRAIGHT LINE MISSES A BEND', C.pink)
  );

  // =========================================================================
  // Beats 33-35: Formula comes last
  // =========================================================================
  await until(S(33));
  await play(
    ...fbox([['each dot measures', C.muted], ['the residual', C.cyan]], C.cyan),
    ...say('NOW THE FORMULA', C.cyan)
  );

  await until(S(34));
  await play(
    ...fbox([['residual =', C.cyan], ['  asking rent − fitted rent', C.ink]], C.cyan),
    ...say('RESIDUAL = ASKING − FITTED', C.cyan)
  );

  // Beat 35: Worked example on our first dot B (1,000 - 967 ≈ +$33)
  const bRing2 = new M.Circle({ radius: P ? 0.21 : 0.18, color: C.green, strokeWidth: 3 });
  bRing2.moveTo(rPts[exIdx]);
  await until(S(35));
  await play(
    new M.Create(bRing2, { runTime: 0.7 }),
    new M.Flash(rDots[exIdx].submobjects[1], { color: C.green, runTime: 0.9 }),
    ...fbox([
      ['residual = asking − fitted', C.muted],
      ['         ≈ 1,000 − 967', C.ink],
      ['         ≈ +$33', C.green],
    ], C.green),
    ...say('1,000 − 967 ≈ +$33', C.green)
  );

  // =========================================================================
  // Beats 36-39: Name, purpose, common trap, and recap
  // =========================================================================
  await until(S(36));
  await play(
    new M.FadeOut(bRing2, { runTime: 0.4 }),
    new M.LaggedStart(avgDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.1 }),
    ...fbox([
      ['residual diagnostics', C.cyan],
      ['check the residual plot', C.ink],
      ['for clear patterns', C.amber],
    ], C.cyan),
    ...say('RESIDUAL DIAGNOSTICS', C.cyan)
  );

  await until(S(37));
  await play(
    new M.Indicate(avgDots[1], { color: C.pink, runTime: 1.1 }),
    ...fbox([
      ['where the rule misses:', C.muted],
      ['  40 & 60 m²: too low', C.green],
      ['  50 m²:      too high', C.pink],
    ], C.amber),
    ...say('SPOT WHERE A RULE NEEDS A CHANGE', C.amber)
  );

  await until(S(38));
  await play(
    new M.LaggedStart(rDots.map((d, k) => new M.Indicate(d, { color: rCols[k] })), { lagRatio: 0.05, runTime: 1.5 }),
    ...fbox([
      ['overall average = $0', C.amber],
      ['+ and − gaps cancel out', C.muted],
      ['but the U pattern stays!', C.pink],
    ], C.pink),
    ...say('OVERALL AVERAGE = 0, PATTERN STAYS', C.pink)
  );

  await until(S(39));
  await play(
    new M.LaggedStart(uSegs.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.03, runTime: 1.4 }),
    new M.LaggedStart(avgDots.map(d => new M.Flash(d.submobjects[1], { color: C.amber })), { lagRatio: 0.18, runTime: 1.4 }),
    ...fbox([
      ['U shape in residual plot', C.amber],
      ['= straight line missed', C.ink],
      ['  a bend in the rents', C.cyan],
    ], C.amber),
    ...say('U SHAPE → MISSED BEND', C.amber)
  );
}
