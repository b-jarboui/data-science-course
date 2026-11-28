// 10.1.3 Residuals: the leftover gaps.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const APTS = [
    // [area, rent, bldg, resid, dxOff]
    [40, 860, 'X', 60, 0], [40, 770, 'Y', -30, -0.9], [40, 770, 'Z', -30, 0.9],
    [60, 1040, 'X', 40, 0], [60, 1020, 'Y', 20, 0], [60, 940, 'Z', -60, 0],
    [80, 1250, 'X', 50, 0], [80, 1210, 'Y', 10, 0], [80, 1140, 'Z', -60, 0],
    [100, 1470, 'X', 70, 0], [100, 1380, 'Y', -20, 0], [100, 1350, 'Z', -50, 0],
  ];
  const BCOL = { X: C.cyan, Y: C.amber, Z: C.pink };
  const fit = a => 400 + 10 * a;

  // Layout bounds: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const X0 = P ? -2.65 : -5.45, X1 = P ? 3.45 : 1.55, CX = (X0 + X1) / 2;
  const Y0 = P ? -4.55 : -2.25, Y1 = P ? 1.00 : 1.25;
  const PILL = P ? [0, 1.92, 0] : [CX, 1.88, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.45, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // One formula box at a time: lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function makeArrow(start, end, color, sw = 2.6, tip = 0.13) {
    const dx = end[0] - start[0], dy = end[1] - start[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const base = [end[0] - ux * tip, end[1] - uy * tip, 0];
    return new M.VGroup(
      new M.Line({ start, end, color, strokeWidth: sw }),
      new M.Line({ start: [base[0] + px * tip * 0.55, base[1] + py * tip * 0.55, 0], end, color, strokeWidth: sw }),
      new M.Line({ start: [base[0] - px * tip * 0.55, base[1] - py * tip * 0.55, 0], end, color, strokeWidth: sw })
    );
  }

  function perpFoot(p, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy);
    return [a[0] + t * vx, a[1] + t * vy, 0];
  }

  function rightAngle(foot, towardA, towardB, size = 0.16, color = C.pink) {
    const ux = towardA[0] - foot[0], uy = towardA[1] - foot[1], ul = Math.hypot(ux, uy) || 1;
    const vx = towardB[0] - foot[0], vy = towardB[1] - foot[1], vl = Math.hypot(vx, vy) || 1;
    const p1 = [foot[0] + ux / ul * size, foot[1] + uy / ul * size, 0];
    const p2 = [p1[0] + vx / vl * size, p1[1] + vy / vl * size, 0];
    const p3 = [foot[0] + vx / vl * size, foot[1] + vy / vl * size, 0];
    return new M.VGroup(
      new M.Line({ start: p1, end: p2, color, strokeWidth: 2 }),
      new M.Line({ start: p2, end: p3, color, strokeWidth: 2 })
    );
  }

  function makePlot({ ax0, ax1, ry0, ry1, xTicks, yTicks, badge }) {
    const toXY = (a, r) => [X0 + (a - ax0) / (ax1 - ax0) * (X1 - X0), Y0 + (r - ry0) / (ry1 - ry0) * (Y1 - Y0), 0];
    const parts = [];
    for (const r of yTicks) {
      const y = toXY(ax0, r)[1];
      const gl = new M.Line({ start: [X0, y, 0], end: [X1, y, 0], color: C.grid, strokeWidth: 1 });
      gl.setStrokeOpacity(0.32);
      const tk = new M.Line({ start: [X0 - 0.08, y, 0], end: [X0, y, 0], color: C.muted, strokeWidth: 2 });
      const lb = T(r.toLocaleString('en-US'), P ? 16 : 16, C.muted, true);
      lb.moveTo([X0 - 0.14 - lb.getWidth() / 2, y, 0]);
      parts.push(gl, tk, lb);
    }
    for (const a of xTicks) {
      const x = toXY(a, ry0)[0];
      const gl = new M.Line({ start: [x, Y0, 0], end: [x, Y1, 0], color: C.grid, strokeWidth: 1 });
      gl.setStrokeOpacity(0.28);
      const tk = new M.Line({ start: [x, Y0 - 0.08, 0], end: [x, Y0, 0], color: C.muted, strokeWidth: 2 });
      const lb = T(String(a), P ? 16 : 17, C.muted, true);
      lb.moveTo([x, Y0 - 0.30, 0]);
      parts.push(gl, tk, lb);
    }
    const xAxis = new M.Line({ start: [X0, Y0, 0], end: [X1, Y0, 0], color: C.muted, strokeWidth: 2.5 });
    const yAxis = new M.Line({ start: [X0, Y0, 0], end: [X0, Y1, 0], color: C.muted, strokeWidth: 2.5 });
    const xLab = T('area (m²)', P ? 15 : 17, C.muted); xLab.moveTo([CX, Y0 - 0.62, 0]);
    const yLab = T('rent ($)', P ? 15 : 17, C.muted); yLab.moveTo([X0 - 0.12, Y1 + 0.24, 0]);
    parts.push(xAxis, yAxis, xLab, yLab);
    if (badge) {
      const b = pill(badge, C.muted, P ? 15 : 15);
      b.moveTo([X1 - 1.12, Y0 + 0.30, 0]);
      parts.push(b);
    }
    const aStart = Math.max(ax0, (ry0 - 400) / 10);
    const aEnd = Math.min(ax1, (ry1 - 400) / 10);
    const lineA = toXY(aStart, fit(aStart)), lineB = toXY(aEnd, fit(aEnd));
    const glow = new M.Line({ start: lineA, end: lineB, color: C.ink, strokeWidth: 9 });
    glow.setStrokeOpacity(0.16);
    const core = new M.Line({ start: lineA, end: lineB, color: C.ink, strokeWidth: 3.2 });
    return { toXY, axes: new M.VGroup(...parts), glow, core, lineA, lineB };
  }

  function makeLegend() {
    const items = [];
    [['X', C.cyan, -1.95], ['Y', C.amber, -1.15], ['Z', C.pink, -0.35]].forEach(([name, col, dx]) => {
      const x = X1 + dx, y = Y0 + 0.30;
      const d = new M.Dot({ point: [x, y, 0], radius: 0.075, color: col });
      const t = T(name, P ? 16 : 15, col, true, true); t.moveTo([x + 0.22, y, 0]);
      items.push(d, t);
    });
    return new M.VGroup(...items);
  }

  function makeDot(p, color, r = 0.085) {
    const halo = new M.Dot({ point: p, radius: r * 2.2, color }); halo.setFill(color, 0.2);
    const dot = new M.Dot({ point: p, radius: r, color });
    return { group: new M.VGroup(halo, dot), dot };
  }

  // ===== ACT 1: THE FITTED LINE AND 12 APARTMENTS (Beats 0-5) =====
  const full1 = makePlot({ ax0: 28, ax1: 112, ry0: 700, ry1: 1550, xTicks: [40, 60, 80, 100], yTicks: [800, 1000, 1200, 1400] });

  // 0: Our line says the mean rent is four hundred plus ten times the area.
  await until(S(0));
  await play(
    new M.FadeIn(full1.axes, { runTime: 0.8 }),
    new M.Create(full1.core, { runTime: 1.4 }),
    new M.FadeIn(full1.glow, { runTime: 1.4 }),
    ...say('MEAN RENT = 400 + 10 × AREA', C.ink),
    ...fbox([['mean rent', C.muted], ['= 400 + 10 × area', C.ink]], C.ink)
  );

  // 1: But real apartments rarely sit exactly on the line.
  const dots1 = APTS.map(([a, r, b, , dx]) => makeDot(full1.toXY(a + dx, r), BCOL[b], P ? 0.08 : 0.085));
  const leg1 = makeLegend();
  await until(S(1));
  await play(
    new M.LaggedStart(dots1.map(d => new M.FadeIn(d.group)), { lagRatio: 0.08, runTime: 1.5 }),
    new M.FadeIn(leg1, { runTime: 0.8 }),
    ...say('12 REAL APARTMENTS (X, Y, Z)', C.cyan)
  );

  // 2: Let's look at one apartment: building X, eighty square metres.
  const pX80 = full1.toXY(80, 1250), pF80 = full1.toXY(80, 1200), pA80 = full1.toXY(80, 700);
  const ringX = new M.Circle({ radius: 0.22, color: C.cyan, strokeWidth: 2.5 });
  ringX.setFill(C.cyan, 0); ringX.moveTo(pX80);
  const vGuide80 = new M.DashedLine({ start: pA80, end: pX80, color: C.cyan });
  await until(S(2));
  await play(
    new M.Create(vGuide80, { runTime: 0.7 }),
    new M.Create(ringX, { runTime: 0.6 }),
    new M.Flash(dots1[6].dot, { color: C.cyan }),
    ...say('BUILDING X · 80 m²', C.cyan),
    ...fbox([['Building X', C.cyan], 'area = 80 m²'], C.cyan)
  );

  // 3: Its actual rent is one thousand two hundred and fifty dollars.
  const hGuide1250 = new M.DashedLine({ start: [X0, pX80[1], 0], end: pX80, color: C.cyan });
  const tagAct1 = T('$1,250', P ? 15 : 16, C.cyan, true, true);
  tagAct1.moveTo([pX80[0] - 0.75, pX80[1] + 0.30, 0]);
  await until(S(3));
  await play(
    new M.Create(hGuide1250, { runTime: 0.7 }),
    new M.FadeIn(tagAct1, { runTime: 0.6 }),
    ...say('ACTUAL RENT = $1,250', C.cyan),
    ...fbox([['Building X · 80 m²', C.cyan], ['actual = $1,250', C.cyan]], C.cyan)
  );

  // 4: The line, at eighty square metres, says one thousand two hundred.
  const fitDot1 = new M.Dot({ point: pF80, radius: 0.085, color: C.ink });
  const tagFit1 = T('$1,200', P ? 15 : 16, C.ink, true, true);
  tagFit1.moveTo([pF80[0] + 0.78, pF80[1] - 0.24, 0]);
  await until(S(4));
  await play(
    new M.FadeIn(fitDot1, { runTime: 0.5 }),
    new M.Flash(fitDot1, { color: C.ink }),
    new M.FadeIn(tagFit1, { runTime: 0.5 }),
    ...say('LINE AT 80 m² = $1,200', C.ink),
    ...fbox([['actual = $1,250', C.cyan], ['fitted = 400 + 10×80', C.muted], ['       = $1,200', C.ink]], C.ink)
  );

  // 5: The value the line gives for an apartment is called its fitted value. It is the line's guess.
  await until(S(5));
  await play(
    new M.Indicate(fitDot1, { color: C.amber, runTime: 1.2 }),
    new M.Indicate(tagFit1, { color: C.amber, runTime: 1.2 }),
    ...say('FITTED VALUE = THE LINE’S GUESS', C.amber),
    ...fbox([['fitted value', C.amber], 'the line’s guess', ['at 80 m² → $1,200', C.ink]], C.amber)
  );

  // ===== ACT 2: ZOOMED IN ON BUILDING X (80 m²) (Beats 6-12) =====
  const zX = makePlot({ ax0: 65, ax1: 95, ry0: 1080, ry1: 1320, xTicks: [70, 80, 90], yTicks: [1100, 1200, 1300], badge: 'ZOOM · 80 m²' });
  const zxDotP = zX.toXY(80, 1250), zxFitP = zX.toXY(80, 1200);
  const zxDot = makeDot(zxDotP, C.cyan, 0.11);
  const zxFit = new M.Dot({ point: zxFitP, radius: 0.095, color: C.ink });
  const zxActLab = T('actual $1,250', P ? 16 : 17, C.cyan, true, true);
  zxActLab.moveTo([zxDotP[0], zxDotP[1] + 0.36, 0]);
  const zxFitLab = T('fitted $1,200', P ? 16 : 17, C.ink, true, true);
  zxFitLab.moveTo([zxFitP[0] + (P ? 1.05 : 1.22), zxFitP[1] - 0.28, 0]);

  // 6: On the plot, the dot sits a little above the line.
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(
      full1.axes, full1.glow, full1.core, leg1, ringX, vGuide80, hGuide1250, tagAct1, fitDot1, tagFit1,
      ...dots1.map(d => d.group)
    ), { runTime: 0.55 }),
    ...say('DOT SITS ABOVE THE LINE', C.cyan)
  );
  await play(
    new M.FadeIn(zX.axes, { runTime: 0.5 }),
    new M.FadeIn(zX.glow, { runTime: 0.5 }),
    new M.FadeIn(zX.core, { runTime: 0.5 }),
    new M.FadeIn(zxDot.group, { runTime: 0.6 }),
    new M.FadeIn(zxFit, { runTime: 0.6 }),
    new M.FadeIn(zxActLab, { runTime: 0.6 }),
    new M.FadeIn(zxFitLab, { runTime: 0.6 })
  );

  // 7: Draw a thin vertical stick from the dot down to the line.
  const stickX = new M.Line({ start: zxDotP, end: zxFitP, color: C.green, strokeWidth: 4.5 });
  await until(S(7));
  await play(
    new M.Create(stickX, { runTime: 1.1 }),
    ...say('THIN VERTICAL STICK: DOT → LINE', C.green)
  );

  // 8: The stick measures the gap in dollars.
  const gTopX = new M.DashedLine({ start: [X0, zxDotP[1], 0], end: zxDotP, color: C.cyan });
  const gBotX = new M.DashedLine({ start: [X0, zxFitP[1], 0], end: zxFitP, color: C.muted });
  const dollarX = T('gap ($)', P ? 15 : 16, C.green, true);
  dollarX.moveTo([zxDotP[0] - 0.72, (zxDotP[1] + zxFitP[1]) / 2, 0]);
  await until(S(8));
  await play(
    new M.Create(gTopX, { runTime: 0.6 }),
    new M.Create(gBotX, { runTime: 0.6 }),
    new M.FadeIn(dollarX, { runTime: 0.6 }),
    ...say('MEASURES THE GAP IN DOLLARS', C.green)
  );

  // 9: One thousand two hundred and fifty minus one thousand two hundred is fifty.
  const val50 = T('+$50', P ? 18 : 20, C.green, true, true);
  val50.moveTo([zxDotP[0] - 0.68, (zxDotP[1] + zxFitP[1]) / 2, 0]);
  await until(S(9));
  await play(
    new M.FadeOut(dollarX, { runTime: 0.3 }),
    new M.FadeIn(val50, { runTime: 0.6 }),
    ...say('1,250 − 1,200 = +50', C.green),
    ...fbox([['actual  = 1,250', C.cyan], ['fitted  = 1,200', C.ink], ['1,250 − 1,200 = +50', C.green]], C.green)
  );

  // 10: This gap is called the residual. Residual means what is left over.
  await until(S(10));
  await play(
    new M.Indicate(stickX, { color: C.amber, runTime: 1.1 }),
    new M.Indicate(val50, { color: C.amber, runTime: 1.1 }),
    ...say('RESIDUAL = WHAT IS LEFT OVER', C.green)
  );

  // 11: So the residual equals the actual rent minus the fitted rent.
  await until(S(11));
  await play(
    ...say('RESIDUAL = ACTUAL − FITTED', C.green),
    ...fbox([['residual = actual − fitted', C.amber], ['         = 1,250 − 1,200', C.muted], ['         = +50', C.green]], C.green)
  );

  // 12: Here it is plus fifty: the apartment costs fifty dollars more than the line says.
  const upArr = makeArrow([zxFitP[0] - 0.22, zxFitP[1] + 0.05, 0], [zxDotP[0] - 0.22, zxDotP[1] - 0.05, 0], C.green, 2.4, 0.12);
  await until(S(12));
  await play(
    new M.FadeIn(upArr, { runTime: 0.7 }),
    new M.Flash(zxDot.dot, { color: C.green }),
    ...say('+$50 MORE THAN THE LINE SAYS', C.green)
  );

  // ===== ACT 3: SECOND APARTMENT — BUILDING Z (60 m²) (Beats 13-17) =====
  const zZ = makePlot({ ax0: 45, ax1: 75, ry0: 880, ry1: 1120, xTicks: [50, 60, 70], yTicks: [900, 1000, 1100], badge: 'ZOOM · 60 m²' });
  const zzDotP = zZ.toXY(60, 940), zzFitP = zZ.toXY(60, 1000), zzAxisP = zZ.toXY(60, 880);
  const zzVGuide = new M.DashedLine({ start: zzAxisP, end: zzFitP, color: C.muted });

  // 13: Now a second apartment: building Z, sixty square metres.
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(
      zX.axes, zX.glow, zX.core, zxDot.group, zxFit, zxActLab, zxFitLab, stickX, gTopX, gBotX, val50, upArr
    ), { runTime: 0.55 }),
    ...say('BUILDING Z · 60 m²', C.pink),
    ...fbox([['Building Z', C.pink], 'area = 60 m²'], C.pink)
  );
  await play(
    new M.FadeIn(zZ.axes, { runTime: 0.5 }),
    new M.FadeIn(zZ.glow, { runTime: 0.5 }),
    new M.FadeIn(zZ.core, { runTime: 0.5 }),
    new M.Create(zzVGuide, { runTime: 0.6 })
  );

  // 14: Its actual rent is nine hundred and forty dollars.
  const zzDot = makeDot(zzDotP, C.pink, 0.11);
  const zzHAct = new M.DashedLine({ start: [X0, zzDotP[1], 0], end: zzDotP, color: C.pink });
  const zzActLab = T('actual $940', P ? 16 : 17, C.pink, true, true);
  zzActLab.moveTo([zzDotP[0] + (P ? 1.05 : 1.12), zzDotP[1] - 0.06, 0]);
  await until(S(14));
  await play(
    new M.FadeIn(zzDot.group, { runTime: 0.5 }),
    new M.Flash(zzDot.dot, { color: C.pink }),
    new M.Create(zzHAct, { runTime: 0.6 }),
    new M.FadeIn(zzActLab, { runTime: 0.5 }),
    ...say('ACTUAL RENT = $940', C.pink),
    ...fbox([['Building Z · 60 m²', C.pink], ['actual = $940', C.pink]], C.pink)
  );

  // 15: The line says one thousand.
  const zzFit = new M.Dot({ point: zzFitP, radius: 0.095, color: C.ink });
  const zzFitLab = T('fitted $1,000', P ? 16 : 17, C.ink, true, true);
  zzFitLab.moveTo([zzFitP[0] - (P ? 1.05 : 1.22), zzFitP[1] + 0.28, 0]);
  await until(S(15));
  await play(
    new M.FadeIn(zzFit, { runTime: 0.5 }),
    new M.Flash(zzFit, { color: C.ink }),
    new M.FadeIn(zzFitLab, { runTime: 0.5 }),
    ...say('FITTED RENT = $1,000', C.ink),
    ...fbox([['actual = $940', C.pink], ['fitted = $1,000', C.ink]], C.ink)
  );

  // 16: Nine hundred and forty minus one thousand is minus sixty.
  const stickZ = new M.Line({ start: zzFitP, end: zzDotP, color: C.pink, strokeWidth: 4.5 });
  const valM60 = T('−$60', P ? 18 : 20, C.pink, true, true);
  valM60.moveTo([zzDotP[0] + 0.68, (zzDotP[1] + zzFitP[1]) / 2, 0]);
  await until(S(16));
  await play(
    new M.Create(stickZ, { runTime: 0.9 }),
    new M.FadeIn(valM60, { runTime: 0.6 }),
    ...say('940 − 1,000 = −60', C.pink),
    ...fbox([['residual = actual − fitted', C.amber], ['         = 940 − 1,000', C.muted], ['         = −60', C.pink]], C.pink)
  );

  // 17: A minus residual means the dot sits below the line: sixty dollars cheaper than the line says.
  const dnArr = makeArrow([zzFitP[0] + 0.22, zzFitP[1] - 0.05, 0], [zzDotP[0] + 0.22, zzDotP[1] + 0.05, 0], C.pink, 2.4, 0.12);
  await until(S(17));
  await play(
    new M.FadeIn(dnArr, { runTime: 0.7 }),
    new M.Indicate(stickZ, { color: C.pink, runTime: 1.0 }),
    ...say('−$60 BELOW THE LINE (CHEAPER)', C.pink)
  );

  // ===== ACT 4: WHY VERTICAL, NOT SLANTED? (Beats 18-20) =====
  // 18: Why is the stick vertical, and not slanted?
  const footZ = perpFoot(zzDotP, zZ.lineA, zZ.lineB);
  const slantQ = new M.DashedLine({ start: zzDotP, end: footZ, color: C.amber });
  const qMark = T('?', P ? 20 : 22, C.amber, true, true);
  qMark.moveTo([(zzDotP[0] + footZ[0]) / 2 - 0.30, (zzDotP[1] + footZ[1]) / 2 - 0.12, 0]);
  await until(S(18));
  await play(
    new M.Create(slantQ, { runTime: 0.7 }),
    new M.FadeIn(qMark, { runTime: 0.5 }),
    ...say('WHY VERTICAL, NOT SLANTED?', C.amber)
  );

  // 19: We know the area exactly. We are using it to guess the rent.
  const exact60 = pill('60 m² EXACT', C.cyan, 15);
  exact60.moveTo([zzAxisP[0] + (P ? 1.02 : 1.25), Y0 - 0.26, 0]);
  const exactLine = new M.Line({ start: zzAxisP, end: zzFitP, color: C.cyan, strokeWidth: 2.2 });
  exactLine.setStrokeOpacity(0.55);
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(slantQ, qMark), { runTime: 0.4 }),
    new M.FadeIn(exact60, { runTime: 0.6 }),
    new M.Create(exactLine, { runTime: 0.6 }),
    ...say('AREA IS KNOWN EXACTLY', C.cyan),
    ...fbox([['area = 60 m² (known)', C.cyan], ['guess rent from area', C.ink]], C.cyan)
  );

  // 20: So the error is in the rent, which runs up and down on the plot.
  const yUpDown = new M.VGroup(
    makeArrow([X0 + 0.24, (Y0 + Y1) / 2, 0], [X0 + 0.24, (Y0 + Y1) / 2 + 0.75, 0], C.amber, 2.5, 0.13),
    makeArrow([X0 + 0.24, (Y0 + Y1) / 2, 0], [X0 + 0.24, (Y0 + Y1) / 2 - 0.75, 0], C.amber, 2.5, 0.13)
  );
  await until(S(20));
  await play(
    new M.FadeIn(yUpDown, { runTime: 0.6 }),
    new M.Indicate(stickZ, { color: C.amber, runTime: 1.0 }),
    ...say('ERROR IS IN RENT (UP & DOWN)', C.amber),
    ...fbox([['rent runs up & down', C.amber], ['→ error is vertical', C.ink]], C.amber)
  );

  // ===== ACT 5: ALL 12 RESIDUALS, SUM = 0, FORMULA & BARGAINS (Beats 21-27) =====
  const full2 = makePlot({ ax0: 28, ax1: 112, ry0: 700, ry1: 1550, xTicks: [40, 60, 80, 100], yTicks: [800, 1000, 1200, 1400] });
  const dots2 = APTS.map(([a, r, b, , dx]) => makeDot(full2.toXY(a + dx, r), BCOL[b], P ? 0.08 : 0.085));
  const leg2 = makeLegend();
  const sticks = APTS.map(([a, r, , res, dx]) => new M.Line({
    start: full2.toXY(a + dx, fit(a)),
    end: full2.toXY(a + dx, r),
    color: res >= 0 ? C.green : C.pink,
    strokeWidth: 3.4
  }));
  const upSticks = sticks.filter((_, i) => APTS[i][3] > 0);
  const dnSticks = sticks.filter((_, i) => APTS[i][3] < 0);

  // 21: Now every apartment gets its own stick. That makes twelve residuals.
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(
      zZ.axes, zZ.glow, zZ.core, zzVGuide, zzDot.group, zzHAct, zzActLab, zzFit, zzFitLab,
      stickZ, valM60, dnArr, exact60, exactLine, yUpDown
    ), { runTime: 0.5 }),
    ...say('12 APARTMENTS → 12 RESIDUALS', C.cyan),
    ...fbox([['12 apartments', C.ink], ['12 vertical sticks', C.cyan]], C.cyan)
  );
  await play(
    new M.FadeIn(full2.axes, { runTime: 0.45 }),
    new M.FadeIn(full2.glow, { runTime: 0.45 }),
    new M.FadeIn(full2.core, { runTime: 0.45 }),
    new M.FadeIn(leg2, { runTime: 0.45 }),
    ...dots2.map(d => new M.FadeIn(d.group, { runTime: 0.45 }))
  );
  await play(new M.LaggedStart(sticks.map(st => new M.Create(st)), { lagRatio: 0.1, runTime: 1.5 }));

  // 22: Some sticks point up, some point down.
  await until(S(22));
  await play(
    new M.LaggedStart(upSticks.map(st => new M.Indicate(st, { color: C.green })), { lagRatio: 0.08, runTime: 0.7 }),
    new M.LaggedStart(dnSticks.map(st => new M.Indicate(st, { color: C.pink })), { lagRatio: 0.08, runTime: 0.7 }),
    ...say('ABOVE +    BELOW −', C.amber)
  );

  // 23: For this line, the ups and downs balance exactly. The twelve residuals add up to zero.
  await until(S(23));
  await play(
    new M.LaggedStart(upSticks.map(st => new M.Indicate(st, { color: C.green })), { lagRatio: 0.1, runTime: 1.3 }),
    ...say('UPS AND DOWNS BALANCE TO 0', C.amber),
    ...fbox([['above (+):  +250', C.green], ['below (−):  −250', C.pink], ['sum of 12 =    0', C.amber]], C.amber)
  );
  await play(new M.LaggedStart(dnSticks.map(st => new M.Indicate(st, { color: C.pink })), { lagRatio: 0.1, runTime: 1.3 }));

  // 24: We will see why in lesson five.
  await until(S(24));
  await play(...say('WHY THEY BALANCE → LESSON 10.1.5', C.violet));

  // 25: In symbols: residual equals actual minus fitted.
  await until(S(25));
  await play(
    ...say('RESIDUAL = ACTUAL − FITTED', C.cyan),
    ...fbox([['residual = actual − fitted', C.amber], ['above the line  →  +', C.green], ['below the line  →  −', C.pink]], C.cyan)
  );

  // 26: What is it for? A residual shows how far the line misses for each apartment.
  await until(S(26));
  await play(
    new M.LaggedStart(sticks.map(st => new M.Indicate(st, { color: C.amber })), { lagRatio: 0.08, runTime: 2.0 }),
    ...say('SHOWS HOW FAR THE LINE MISSES', C.amber)
  );

  // 27: It can also flag a bargain: a big minus residual means cheap for its size.
  const bRing1 = new M.Circle({ radius: 0.22, color: C.pink, strokeWidth: 2.5 });
  bRing1.setFill(C.pink, 0); bRing1.moveTo(full2.toXY(60, 940));
  const bRing2 = new M.Circle({ radius: 0.22, color: C.pink, strokeWidth: 2.5 });
  bRing2.setFill(C.pink, 0); bRing2.moveTo(full2.toXY(80, 1140));
  const bLab1 = T('−60', P ? 16 : 15, C.pink, true, true);
  bLab1.moveTo([full2.toXY(60, 940)[0] + 0.44, full2.toXY(60, 940)[1] - 0.18, 0]);
  const bLab2 = T('−60', P ? 16 : 15, C.pink, true, true);
  bLab2.moveTo([full2.toXY(80, 1140)[0] + 0.44, full2.toXY(80, 1140)[1] - 0.18, 0]);
  await until(S(27));
  await play(
    new M.Create(bRing1, { runTime: 0.6 }),
    new M.Create(bRing2, { runTime: 0.6 }),
    new M.Flash(dots2[5].dot, { color: C.pink }),
    new M.Flash(dots2[8].dot, { color: C.pink }),
    new M.FadeIn(bLab1, { runTime: 0.5 }),
    new M.FadeIn(bLab2, { runTime: 0.5 }),
    ...say('BIG MINUS = BARGAIN FOR ITS SIZE', C.pink),
    ...fbox([['bargains (cheap for size)', C.pink], ['Z, 60 m²: −$60', C.pink], ['Z, 80 m²: −$60', C.pink]], C.pink)
  );

  // ===== ACT 6: THE TRAP & ONE-SENTENCE RECAP (Beats 28-31) =====
  const trap = makePlot({ ax0: 70, ax1: 90, ry0: 1120, ry1: 1290, xTicks: [75, 80, 85], yTicks: [1150, 1200, 1250], badge: 'ZOOM · 80 m²' });
  const tDotP = trap.toXY(80, 1250), tFitP = trap.toXY(80, 1200);
  const tFoot = perpFoot(tDotP, trap.lineA, trap.lineB);
  const tDot = makeDot(tDotP, C.cyan, 0.11);
  const tFit = new M.Dot({ point: tFitP, radius: 0.09, color: C.ink });
  const tSlant = new M.DashedLine({ start: tDotP, end: tFoot, color: C.pink });
  const tSq = rightAngle(tFoot, tDotP, trap.lineB, 0.18, C.pink);
  const tBad = T('✗ slanted', P ? 16 : 17, C.pink, true, true);
  tBad.moveTo([tDotP[0] + (P ? 0.95 : 1.05), tDotP[1] + 0.36, 0]);

  // 28: Here is the trap. Do not measure the shortest, slanted distance from the dot to the line.
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(
      full2.axes, full2.glow, full2.core, leg2, bRing1, bRing2, bLab1, bLab2,
      ...dots2.map(d => d.group), ...sticks
    ), { runTime: 0.5 }),
    ...say('TRAP: DO NOT MEASURE SLANTED', C.pink),
    ...fbox([['✗ slanted distance', C.pink], ['not the residual!', C.muted]], C.pink)
  );
  await play(
    new M.FadeIn(trap.axes, { runTime: 0.45 }),
    new M.FadeIn(trap.glow, { runTime: 0.45 }),
    new M.FadeIn(trap.core, { runTime: 0.45 }),
    new M.FadeIn(tDot.group, { runTime: 0.45 }),
    new M.FadeIn(tFit, { runTime: 0.45 }),
    new M.Create(tSlant, { runTime: 0.8 }),
    new M.Create(tSq, { runTime: 0.5 }),
    new M.FadeIn(tBad, { runTime: 0.5 })
  );

  // 29: That distance mixes area and rent together, and it is not in dollars.
  const tCorner = [tFoot[0], tDotP[1], 0];
  const legArea = new M.Line({ start: tDotP, end: tCorner, color: C.amber, strokeWidth: 3 });
  const legRent = new M.Line({ start: tCorner, end: tFoot, color: C.cyan, strokeWidth: 3 });
  const labArea = T('m²', P ? 16 : 18, C.amber, true, true);
  labArea.moveTo([(tDotP[0] + tCorner[0]) / 2, tCorner[1] + 0.24, 0]);
  const labRent = T('$', P ? 16 : 18, C.cyan, true, true);
  labRent.moveTo([tCorner[0] + 0.25, (tCorner[1] + tFoot[1]) / 2, 0]);
  await until(S(29));
  await play(
    new M.FadeOut(tBad, { runTime: 0.3 }),
    new M.Create(legArea, { runTime: 0.6 }),
    new M.Create(legRent, { runTime: 0.6 }),
    new M.FadeIn(labArea, { runTime: 0.5 }),
    new M.FadeIn(labRent, { runTime: 0.5 }),
    ...say('MIXES m² AND $ — NOT IN DOLLARS', C.amber),
    ...fbox([['slanted mixes:', C.pink], ['  area (m²) + rent ($)', C.amber], ['  not in dollars!', C.pink]], C.amber)
  );

  // 30: The residual is always the straight up-and-down gap.
  const tStick = new M.Line({ start: tDotP, end: tFitP, color: C.green, strokeWidth: 5 });
  const tGood = T('✓ +$50', P ? 18 : 20, C.green, true, true);
  tGood.moveTo([tDotP[0] - 0.82, (tDotP[1] + tFitP[1]) / 2, 0]);
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(tSlant, tSq, legArea, legRent, labArea, labRent), { runTime: 0.45 }),
    new M.Create(tStick, { runTime: 0.8 }),
    new M.FadeIn(tGood, { runTime: 0.6 }),
    ...say('ALWAYS STRAIGHT UP-AND-DOWN ($)', C.green),
    ...fbox([['✓ vertical gap only', C.green], ['measured purely in $', C.ink]], C.green)
  );

  // 31: In one sentence: a residual is the actual rent minus what the line predicts.
  await until(S(31));
  await play(
    new M.Indicate(tStick, { color: C.amber, runTime: 1.2 }),
    new M.Indicate(tGood, { color: C.amber, runTime: 1.2 }),
    ...say('RESIDUAL = ACTUAL − PREDICTED', C.amber),
    ...fbox([['residual = actual − fitted', C.amber], ['above the line: +', C.green], ['below the line: −', C.pink]], C.amber)
  );
}
