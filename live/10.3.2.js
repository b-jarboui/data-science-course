// 10.3.2 Logistic regression (live manim-web scene).
// Beat i = sentence i (0-based, 0..51). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const PILL = [0, 1.92, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.45, 0.48, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  const sig = z => 1 / (1 + Math.exp(-z));
  const B0 = Math.log(3); // ~1.0986 -> sig(B0) = 0.75
  const lossOf = b => {
    const p0 = sig(B0), p1 = sig(B0 + b), p2 = sig(B0 + 2 * b);
    return -(75 * Math.log(p0) + 25 * Math.log(1 - p0)
           + 90 * Math.log(p1) + 10 * Math.log(1 - p1)
           + 27 * Math.log(p2) +  1 * Math.log(1 - p2));
  };

  // Formula box: one at a time, auto-scaled to fit laptop right column or phone top.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.40;
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
    const maxw = P ? FW - 1.0 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow, { runTime: 0.5 })];
    boxNow = null;
    return a;
  }

  function makeCurve(fn, xA, xB, n, toXY, color = C.cyan, width = 4) {
    const segs = [];
    for (let i = 0; i < n; i++) {
      const u0 = xA + (xB - xA) * (i / n);
      const u1 = xA + (xB - xA) * ((i + 1) / n);
      segs.push(new M.Line({ start: toXY(u0, fn(u0)), end: toXY(u1, fn(u1)), color, strokeWidth: width }));
    }
    return segs;
  }

  function glowDot(pt, color = C.cyan, r = 0.11, haloR = 0.25) {
    const h = new M.Dot({ point: pt, radius: haloR, color }); h.setFill(color, 0.20);
    const d = new M.Dot({ point: pt, radius: r, color }); d.setFill(color, 1);
    return { g: new M.VGroup(h, d), core: d };
  }

  // =========================================================================
  // ACT 1: CLINIC QUESTION, 3 ROWS OF RECORDS, AND DATA DOTS (Sentences 0-6)
  // =========================================================================

  // 0: How can our clinic predict the chance of coming after each number of reminders?
  const cardXs = P ? [-2.35, 0, 2.35] : [-3.5, 0, 3.5];
  const cardY = P ? -0.9 : -0.45;
  const cardW = P ? 2.05 : 2.75, cardH = P ? 2.25 : 2.05;
  const cards = [0, 1, 2].map((n, k) => {
    const cx = cardXs[k];
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([cx, cardY, 0]);
    const num = T(String(n), P ? 36 : 42, C.cyan, true, true); num.moveTo([cx, cardY + 0.45, 0]);
    const sub = T(n === 1 ? 'reminder' : 'reminders', P ? 16 : 18, C.muted); sub.moveTo([cx, cardY - 0.02, 0]);
    const q = T('? %', P ? 24 : 26, C.amber, true, true); q.moveTo([cx, cardY - 0.58, 0]);
    return new M.VGroup(r, num, sub, q);
  });
  await until(S(0));
  await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.18, runTime: 1.4 }), ...say('PREDICT CHANCE OF COMING'));

  // 1: Line up the appointment records in three rows.
  const rowY = P ? [0.45, -1.35, -3.15] : [0.75, -0.55, -1.85];
  const rowNames = P ? ['0 rem', '1 rem', '2 rem'] : ['0 reminders', '1 reminder', '2 reminders'];
  const rowLabels = rowNames.map((s, k) => {
    const t = T(s, P ? 16 : 19, C.ink, false, true);
    t.moveTo([P ? -3.15 : -5.0, rowY[k], 0]);
    return t;
  });
  const rowGuides = rowY.map(y => {
    const ln = new M.Line({ start: [P ? -3.6 : -6.1, y - (P ? 0.85 : 0.62), 0], end: [P ? 3.6 : 6.1, y - (P ? 0.85 : 0.62), 0], color: C.line, strokeWidth: 1.5 });
    ln.setStrokeOpacity(0.6);
    return ln;
  });
  const legY = P ? -4.35 : -2.68;
  const legDot1 = new M.Dot({ point: [P ? -1.55 : -1.8, legY, 0], radius: 0.09, color: C.cyan }); legDot1.setFill(C.cyan, 1);
  const legTxt1 = T('came', P ? 17 : 18, C.cyan); legTxt1.moveTo([P ? -0.95 : -1.2, legY, 0]);
  const legDot2 = new M.Dot({ point: [P ? 0.55 : 0.7, legY, 0], radius: 0.09, color: C.pink }); legDot2.setFill(C.pink, 1);
  const legTxt2 = T('missed', P ? 17 : 18, C.pink); legTxt2.moveTo([P ? 1.3 : 1.45, legY, 0]);
  const legend = new M.VGroup(legDot1, legTxt1, legDot2, legTxt2);

  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...cards), { runTime: 0.6 }),
    new M.LaggedStart(rowLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...rowGuides), { runTime: 0.8 }),
    new M.FadeIn(legend, { runTime: 0.8 }),
    ...say('CLINIC RECORDS IN 3 ROWS')
  );

  // Helper to build one row of patient dots (5 dots high, left-to-right columns: cyan came, pink missed)
  function buildPatientRow(rowIdx, total, came, fracStr, pctStr) {
    const x0 = P ? -2.25 : -3.25, dx = P ? 0.19 : 0.26, dy = P ? 0.17 : 0.19, r = P ? 0.055 : 0.072;
    const cy = rowY[rowIdx];
    const cameDots = [], missDots = [];
    for (let i = 0; i < total; i++) {
      const col = Math.floor(i / 5), rIn = i % 5;
      const px = x0 + col * dx, py = cy + (2 - rIn) * dy;
      const isCame = i < came;
      const d = new M.Dot({ point: [px, py, 0], radius: r, color: isCame ? C.cyan : C.pink });
      d.setFill(isCame ? C.cyan : C.pink, 0.92);
      if (isCame) cameDots.push(d); else missDots.push(d);
    }
    const gCame = new M.VGroup(...cameDots);
    const gMiss = new M.VGroup(...missDots);
    let summary;
    if (P) {
      const t1 = T(fracStr, 16, C.ink, true); t1.moveTo([2.65, cy + 0.18, 0]);
      const t2 = T(pctStr, 17, C.cyan, true, true); t2.moveTo([2.65, cy - 0.18, 0]);
      summary = new M.VGroup(t1, t2);
    } else {
      const t1 = T(`${fracStr}  (${pctStr})`, 19, C.cyan, true);
      t1.moveTo([4.15, cy, 0]);
      summary = t1;
    }
    return { gCame, gMiss, summary };
  }

  // 2: With no reminder, seventy-five out of one hundred patients come.
  const r0 = buildPatientRow(0, 100, 75, '75/100', '75%');
  await until(S(2));
  await play(new M.FadeIn(r0.gCame, { runTime: 0.9 }), new M.FadeIn(r0.gMiss, { runTime: 0.9 }), new M.FadeIn(r0.summary, { runTime: 0.9 }), ...say('0 REMINDERS: 75 OF 100 CAME'));

  // 3: With one reminder, ninety out of one hundred come.
  const r1 = buildPatientRow(1, 100, 90, '90/100', '90%');
  await until(S(3));
  await play(new M.FadeIn(r1.gCame, { runTime: 0.9 }), new M.FadeIn(r1.gMiss, { runTime: 0.9 }), new M.FadeIn(r1.summary, { runTime: 0.9 }), ...say('1 REMINDER: 90 OF 100 CAME'));

  // 4: With two reminders, twenty-seven out of twenty-eight come.
  const r2 = buildPatientRow(2, 28, 27, '27/28', '96%');
  await until(S(4));
  await play(new M.FadeIn(r2.gCame, { runTime: 0.9 }), new M.FadeIn(r2.gMiss, { runTime: 0.9 }), new M.FadeIn(r2.summary, { runTime: 0.9 }), ...say('2 REMINDERS: 27 OF 28 CAME'));

  // 5: Put a dot above each reminder count to show the share that comes.
  const dXMin = P ? -2.6 : -4.2, dXMax = P ? 3.1 : 4.2;
  const dYMin = P ? -3.4 : -2.2, dYMax = P ? 0.85 : 1.15;
  const dRX = r => dXMin + (0.16 + 0.34 * r) * (dXMax - dXMin);
  const dPY = p => dYMin + p * (dYMax - dYMin);

  const dXAxis = new M.Line({ start: [dXMin, dYMin, 0], end: [dXMax, dYMin, 0], color: C.muted, strokeWidth: 2.5 });
  const dYAxis = new M.Line({ start: [dXMin, dYMin, 0], end: [dXMin, dYMax, 0], color: C.muted, strokeWidth: 2.5 });
  const dGuide100 = new M.DashedLine({ start: [dXMin, dPY(1), 0], end: [dXMax, dPY(1), 0], color: C.line });
  const dGuide50 = new M.DashedLine({ start: [dXMin, dPY(0.5), 0], end: [dXMax, dPY(0.5), 0], color: C.line });
  const dXTicks = [0, 1, 2].map(r => {
    const x = dRX(r);
    const tk = new M.Line({ start: [x, dYMin - 0.08, 0], end: [x, dYMin + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(r), 18, C.muted, true); lb.moveTo([x, dYMin - 0.32, 0]);
    return new M.VGroup(tk, lb);
  });
  const dXLab = T('reminders', 17, C.muted); dXLab.moveTo([(dXMin + dXMax) / 2, dYMin - 0.66, 0]);
  const dYTicks = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([p, s]) => {
    const y = dPY(p);
    const tk = new M.Line({ start: [dXMin - 0.08, y, 0], end: [dXMin + 0.08, y, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(s, 16, C.muted, true); lb.moveTo([dXMin - 0.52, y, 0]);
    return new M.VGroup(tk, lb);
  });
  const dYLab = T('share who came', 16, C.muted); dYLab.moveTo([dXMin + 0.75, dYMax + 0.28, 0]);

  const shares = [[0, 0.75, '75%'], [1, 0.90, '90%'], [2, 27 / 28, '96%']];
  const shareDots = shares.map(([r, p, s]) => {
    const pt = [dRX(r), dPY(p), 0];
    const gd = glowDot(pt, C.cyan, 0.13, 0.28);
    const lb = T(s, 18, C.cyan, true, true); lb.moveTo([pt[0], pt[1] + 0.36, 0]);
    return { g: new M.VGroup(gd.g, lb), core: gd.core, pt };
  });

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...rowLabels, ...rowGuides, legend, r0.gCame, r0.gMiss, r0.summary, r1.gCame, r1.gMiss, r1.summary, r2.gCame, r2.gMiss, r2.summary), { runTime: 0.6 }),
    new M.Create(dXAxis, { runTime: 0.7 }),
    new M.Create(dYAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(dGuide100, dGuide50, ...dXTicks, dXLab, ...dYTicks, dYLab), { runTime: 0.8 }),
    new M.LaggedStart(shareDots.map(d => new M.FadeIn(d.g)), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('SHARE WHO CAME BY REMINDERS')
  );

  // 6: The dots rise quickly at first and then level out.
  const segRise1 = new M.DashedLine({ start: shareDots[0].pt, end: shareDots[1].pt, color: C.amber });
  const segRise2 = new M.DashedLine({ start: shareDots[1].pt, end: shareDots[2].pt, color: C.violet });
  const lblRise1 = T('+15%', 17, C.amber, true, true);
  lblRise1.moveTo([(shareDots[0].pt[0] + shareDots[1].pt[0]) / 2 + 0.28, (shareDots[0].pt[1] + shareDots[1].pt[1]) / 2 - 0.32, 0]);
  const lblRise2 = T('+6%', 17, C.violet, true, true);
  lblRise2.moveTo([(shareDots[1].pt[0] + shareDots[2].pt[0]) / 2, (shareDots[1].pt[1] + shareDots[2].pt[1]) / 2 - 0.34, 0]);

  await until(S(6));
  await play(
    new M.Create(segRise1, { runTime: 0.7 }),
    new M.Create(segRise2, { runTime: 0.7 }),
    new M.FadeIn(lblRise1, { runTime: 0.7 }),
    new M.FadeIn(lblRise2, { runTime: 0.7 }),
    new M.LaggedStart(shareDots.map(d => new M.Indicate(d.g, { color: C.amber })), { lagRatio: 0.22, runTime: 1.4 }),
    ...say('RISES QUICKLY, THEN LEVELS OUT', C.amber)
  );

  // =========================================================================
  // ACT 2: THE S-SHAPED CURVE — SIGMOID (Sentences 7-16)
  // =========================================================================
  const sXMin = P ? -2.7 : -5.7, sXMax = P ? 3.2 : 1.3;
  const sYMin = P ? -3.5 : -2.2, sYMax = P ? 0.95 : 1.15;
  const zMin = -4.8, zMax = 4.8;
  const sx = z => sXMin + ((z - zMin) / (zMax - zMin)) * (sXMax - sXMin);
  const sy = p => sYMin + p * (sYMax - sYMin);
  const sXY = (z, p) => [sx(z), sy(p), 0];

  const sXAxis = new M.Line({ start: [sXMin, sYMin, 0], end: [sXMax, sYMin, 0], color: C.muted, strokeWidth: 2.5 });
  const sYAxis = new M.Line({ start: [sXMin, sYMin, 0], end: [sXMin, sYMax, 0], color: C.muted, strokeWidth: 2.5 });
  const sTopGuide = new M.DashedLine({ start: [sXMin, sy(1), 0], end: [sXMax, sy(1), 0], color: C.line });
  const sMidGuide = new M.DashedLine({ start: [sXMin, sy(0.5), 0], end: [sXMax, sy(0.5), 0], color: C.line });
  const sZeroV = new M.DashedLine({ start: [sx(0), sYMin, 0], end: [sx(0), sYMax, 0], color: C.line });
  const sigSegs = makeCurve(sig, zMin, zMax, 38, sXY, C.cyan, 4);

  // 7: Picture an S-shaped curve that rises and then flattens near the top.
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(dXAxis, dYAxis, dGuide100, dGuide50, ...dXTicks, dXLab, ...dYTicks, dYLab, ...shareDots.map(d => d.g), segRise1, segRise2, lblRise1, lblRise2), { runTime: 0.6 }),
    new M.Create(sXAxis, { runTime: 0.7 }),
    new M.Create(sYAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(sTopGuide, sMidGuide, sZeroV), { runTime: 0.7 }),
    new M.LaggedStart(sigSegs.map(ln => new M.Create(ln)), { lagRatio: 0.04, runTime: 1.6 }),
    ...say('AN S-SHAPED CURVE')
  );

  // 8: A number called a score runs along the bottom of the curve.
  const sXTicks = [-4, -2, 0, 2, 4].map(z => {
    const x = sx(z);
    const tk = new M.Line({ start: [x, sYMin - 0.08, 0], end: [x, sYMin + 0.08, 0], color: C.amber, strokeWidth: 2 });
    const lb = T(String(z), 17, C.amber, true); lb.moveTo([x, sYMin - 0.30, 0]);
    return new M.VGroup(tk, lb);
  });
  const sXLab = T('score', 18, C.amber, false, true); sXLab.moveTo([(sXMin + sXMax) / 2, sYMin - 0.64, 0]);
  await until(S(8));
  await play(
    new M.LaggedStart(sXTicks.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.FadeIn(sXLab, { runTime: 0.7 }),
    new M.Indicate(sXAxis, { color: C.amber, runTime: 0.9 }),
    ...say('BOTTOM AXIS = SCORE', C.amber)
  );

  // 9: The chance of coming runs up the side.
  const sYTicks = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([p, s]) => {
    const y = sy(p);
    const tk = new M.Line({ start: [sXMin - 0.08, y, 0], end: [sXMin + 0.08, y, 0], color: C.cyan, strokeWidth: 2 });
    const lb = T(s, 16, C.cyan, true); lb.moveTo([sXMin - 0.52, y, 0]);
    return new M.VGroup(tk, lb);
  });
  const sYLab = T('chance of coming', 16, C.cyan, false, true); sYLab.moveTo([sXMin + 0.95, sYMax + 0.28, 0]);
  await until(S(9));
  await play(
    new M.FadeIn(new M.VGroup(...sYTicks, sYLab), { runTime: 0.7 }),
    new M.Indicate(sYAxis, { color: C.cyan, runTime: 0.8 }),
    ...say('SIDE AXIS = CHANCE OF COMING')
  );

  // 10: Start at a score, go up to the curve and then across to read the chance.
  const exZ = 1.5, exP = sig(exZ);
  const exStartDot = new M.Dot({ point: sXY(exZ, 0), radius: 0.09, color: C.amber }); exStartDot.setFill(C.amber, 1);
  const exUp = new M.DashedLine({ start: sXY(exZ, 0), end: sXY(exZ, exP), color: C.amber });
  const exHit = glowDot(sXY(exZ, exP), C.amber, 0.11, 0.24);
  const exAcross = new M.DashedLine({ start: sXY(exZ, exP), end: [sXMin, sy(exP), 0], color: C.amber });
  const exRead = T('~82%', 16, C.amber, true, true); exRead.moveTo([sXMin + 0.52, sy(exP) + 0.24, 0]);
  await until(S(10));
  await play(
    new M.FadeIn(exStartDot, { runTime: 0.4 }),
    new M.Create(exUp, { runTime: 0.7 }),
    new M.FadeIn(exHit.g, { runTime: 0.5 }),
    new M.Create(exAcross, { runTime: 0.7 }),
    new M.FadeIn(exRead, { runTime: 0.6 }),
    ...say('SCORE → UP TO CURVE → ACROSS', C.amber)
  );

  // 11: At a score of zero, the curve gives a chance of fifty percent.
  const z0Up = new M.DashedLine({ start: sXY(0, 0), end: sXY(0, 0.5), color: C.amber });
  const z0Across = new M.DashedLine({ start: sXY(0, 0.5), end: [sXMin, sy(0.5), 0], color: C.amber });
  const z0Dot = glowDot(sXY(0, 0.5), C.amber, 0.12, 0.26);
  const z0Lab = T('0 → 50%', 18, C.amber, true, true); z0Lab.moveTo([sx(0) + 0.88, sy(0.5) - 0.28, 0]);
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(exStartDot, exUp, exHit.g, exAcross, exRead), { runTime: 0.5 }),
    new M.Create(z0Up, { runTime: 0.6 }),
    new M.Create(z0Across, { runTime: 0.6 }),
    new M.FadeIn(z0Dot.g, { runTime: 0.6 }),
    new M.Flash(z0Dot.core, { color: C.amber }),
    new M.FadeIn(z0Lab, { runTime: 0.6 }),
    ...say('SCORE 0 → 50% CHANCE', C.amber)
  );

  // 12: At the far left, the chance comes close to zero.
  const leftDot = glowDot(sXY(-4.2, sig(-4.2)), C.pink, 0.11, 0.24);
  const leftLab = T('near 0%', 17, C.pink, true, true); leftLab.moveTo([sx(-3.5), sy(0.18), 0]);
  await until(S(12));
  await play(
    new M.FadeIn(leftDot.g, { runTime: 0.6 }),
    new M.Flash(leftDot.core, { color: C.pink }),
    new M.FadeIn(leftLab, { runTime: 0.6 }),
    ...say('FAR LEFT → NEAR 0%', C.pink)
  );

  // 13: At the far right, the chance comes close to one hundred percent.
  const rightDot = glowDot(sXY(4.2, sig(4.2)), C.green, 0.11, 0.24);
  const rightLab = T('near 100%', 17, C.green, true, true); rightLab.moveTo([sx(3.25), sy(0.82), 0]);
  await until(S(13));
  await play(
    new M.FadeIn(rightDot.g, { runTime: 0.6 }),
    new M.Flash(rightDot.core, { color: C.green }),
    new M.FadeIn(rightLab, { runTime: 0.6 }),
    ...say('FAR RIGHT → NEAR 100%', C.green)
  );

  // 14: This S-shaped translator is called the sigmoid.
  const sigName = pill('SIGMOID', C.cyan, 16); sigName.moveTo([sx(-2.3), sy(0.72), 0]);
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(leftDot.g, leftLab, rightDot.g, rightLab, z0Up, z0Across, z0Lab), { runTime: 0.5 }),
    new M.FadeIn(sigName, { runTime: 0.6 }),
    new M.LaggedStart(sigSegs.map(ln => new M.Indicate(ln, { color: C.amber })), { lagRatio: 0.02, runTime: 1.2 }),
    ...say('SIGMOID = S-SHAPED TRANSLATOR')
  );

  // 15: We give every extra reminder the same step on the score line.
  const stZs = [1.1, 2.2, 3.3];
  const stMarkers = stZs.map((z, k) => {
    const d = new M.Dot({ point: sXY(z, 0), radius: 0.09, color: C.amber }); d.setFill(C.amber, 1);
    const lb = T(`${k}r`, 14, C.amber, true); lb.moveTo([sx(z), sYMin + 0.22, 0]);
    return new M.VGroup(d, lb);
  });
  const stepBar1 = new M.Line({ start: [sx(1.1) + 0.08, sYMin + 0.44, 0], end: [sx(2.2) - 0.08, sYMin + 0.44, 0], color: C.amber, strokeWidth: 3 });
  const stepBar2 = new M.Line({ start: [sx(2.2) + 0.08, sYMin + 0.44, 0], end: [sx(3.3) - 0.08, sYMin + 0.44, 0], color: C.amber, strokeWidth: 3 });
  const stepLbl1 = T('+step', 13, C.amber, true); stepLbl1.moveTo([sx(1.65), sYMin + 0.65, 0]);
  const stepLbl2 = T('+step', 13, C.amber, true); stepLbl2.moveTo([sx(2.75), sYMin + 0.65, 0]);

  await until(S(15));
  await play(
    new M.FadeOut(z0Dot.g, { runTime: 0.4 }),
    new M.LaggedStart(stMarkers.map(m => new M.FadeIn(m)), { lagRatio: 0.16, runTime: 0.9 }),
    new M.Create(stepBar1, { runTime: 0.6 }),
    new M.Create(stepBar2, { runTime: 0.6 }),
    new M.FadeIn(stepLbl1, { runTime: 0.6 }),
    new M.FadeIn(stepLbl2, { runTime: 0.6 }),
    ...say('EACH REMINDER = SAME SCORE STEP', C.amber)
  );

  // 16: A rule that uses this line and sigmoid to predict a chance is called logistic regression.
  const lrTraces = stZs.map(z => new M.DashedLine({ start: sXY(z, 0.16), end: sXY(z, sig(z)), color: C.green }));
  const lrDots = stZs.map(z => glowDot(sXY(z, sig(z)), C.green, 0.10, 0.22));
  await until(S(16));
  await play(
    new M.LaggedStart(lrTraces.map(l => new M.Create(l)), { lagRatio: 0.18, runTime: 1.0 }),
    new M.LaggedStart(lrDots.map(d => new M.FadeIn(d.g)), { lagRatio: 0.18, runTime: 1.0 }),
    ...fbox(['score  = start + step × rem', ['chance = sigmoid(score)', C.cyan]], C.green),
    ...say('LOGISTIC REGRESSION', C.green)
  );

  // =========================================================================
  // ACT 3: FITTING THE STEP SIZE — ITERATIONS & LOSS (Sentences 17-37)
  // =========================================================================
  const fXMin = P ? -2.7 : -5.7, fXMax = P ? 3.2 : 1.3;
  const fYMin = P ? -1.65 : -2.2, fYMax = P ? 1.15 : 1.15;
  const fx = r => fXMin + ((r + 0.25) / 2.6) * (fXMax - fXMin);
  const fy = p => fYMin + p * (fYMax - fYMin);
  const fXY = (r, p) => [fx(r), fy(p), 0];

  const fXAxis = new M.Line({ start: [fXMin, fYMin, 0], end: [fXMax, fYMin, 0], color: C.muted, strokeWidth: 2.5 });
  const fYAxis = new M.Line({ start: [fXMin, fYMin, 0], end: [fXMin, fYMax, 0], color: C.muted, strokeWidth: 2.5 });
  const fG100 = new M.DashedLine({ start: [fXMin, fy(1), 0], end: [fXMax, fy(1), 0], color: C.line });
  const fG50 = new M.DashedLine({ start: [fXMin, fy(0.5), 0], end: [fXMax, fy(0.5), 0], color: C.line });
  const fXTicks = [0, 1, 2].map(r => {
    const x = fx(r);
    const tk = new M.Line({ start: [x, fYMin - 0.08, 0], end: [x, fYMin + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(r), 17, C.muted, true); lb.moveTo([x, fYMin - 0.28, 0]);
    return new M.VGroup(tk, lb);
  });
  const fXLab = T('reminders', 16, C.muted); fXLab.moveTo([(fXMin + fXMax) / 2, fYMin - 0.56, 0]);
  const fYTicks = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([p, s]) => {
    const y = fy(p);
    const tk = new M.Line({ start: [fXMin - 0.08, y, 0], end: [fXMin + 0.08, y, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(s, 15, C.muted, true); lb.moveTo([fXMin - 0.50, y, 0]);
    return new M.VGroup(tk, lb);
  });
  const fYLab = T('chance', 16, C.muted); fYLab.moveTo([fXMin + 0.45, fYMax + 0.25, 0]);

  const realPts = [[0, 0.75, '75/100'], [1, 0.90, '90/100'], [2, 27 / 28, '27/28']];
  const realDots = realPts.map(([r, p, s]) => {
    const pt = fXY(r, p);
    const gd = glowDot(pt, C.cyan, 0.12, 0.26);
    const lb = T(s, 15, C.cyan, true); lb.moveTo([pt[0], pt[1] + 0.42, 0]);
    return { g: new M.VGroup(gd.g, lb), core: gd.core, pt };
  });

  // 17: How do we find a good step size for these patients?
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(
      sXAxis, sYAxis, sTopGuide, sMidGuide, sZeroV, ...sigSegs,
      ...sXTicks, sXLab, ...sYTicks, sYLab, sigName,
      ...stMarkers, stepBar1, stepBar2, stepLbl1, stepLbl2,
      ...lrTraces, ...lrDots.map(d => d.g)
    ), { runTime: 0.6 }),
    new M.Create(fXAxis, { runTime: 0.6 }),
    new M.Create(fYAxis, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(fG100, fG50, ...fXTicks, fXLab, ...fYTicks, fYLab, ...realDots.map(d => d.g)), { runTime: 0.8 }),
    ...fbox(['score = start + step × rem', ['step  = ?', C.amber]], C.amber),
    ...say('FIND A GOOD STEP SIZE', C.amber)
  );

  // 18: The starting score is the score for patients with no reminder.
  const startRing = new M.Circle({ radius: 0.28, color: C.amber, strokeWidth: 2.5 });
  startRing.moveTo(realDots[0].pt);
  await until(S(18));
  await play(
    new M.Create(startRing, { runTime: 0.7 }),
    new M.Flash(realDots[0].core, { color: C.amber }),
    ...say('START SCORE = SCORE AT 0 REMINDERS', C.amber)
  );

  // 19: Keep it at about one point one, which gives about seventy-five percent.
  const predDot0 = new M.Dot({ point: fXY(0, 0.75), radius: 0.10, color: C.amber }); predDot0.setFill(C.amber, 1);
  await until(S(19));
  await play(
    new M.FadeIn(predDot0, { runTime: 0.6 }),
    new M.FadeOut(startRing, { runTime: 0.5 }),
    ...fbox([['start = 1.1  (75%)', C.amber], ['step  = ?', C.muted]], C.amber),
    ...say('KEEP START ≈ 1.1  (75%)', C.amber)
  );

  // 20: For the first try, add zero for each extra reminder.
  const makeFitSegs = b => makeCurve(r => sig(B0 + b * r), -0.18, 2.22, 24, fXY, C.amber, 3.5);
  const predSegs = makeFitSegs(0);
  const predDot1 = new M.Dot({ point: fXY(1, sig(B0)), radius: 0.10, color: C.amber }); predDot1.setFill(C.amber, 1);
  const predDot2 = new M.Dot({ point: fXY(2, sig(B0)), radius: 0.10, color: C.amber }); predDot2.setFill(C.amber, 1);

  await until(S(20));
  await play(
    new M.LaggedStart(predSegs.map(ln => new M.Create(ln)), { lagRatio: 0.04, runTime: 1.0 }),
    new M.FadeIn(predDot1, { runTime: 0.6 }),
    new M.FadeIn(predDot2, { runTime: 0.6 }),
    ...fbox([['Try 1:  step = 0', C.amber], 'start = 1.1'], C.amber),
    ...say('TRY 1: STEP = 0', C.amber)
  );

  // 21: That gives every group the same score.
  let scoreTags = [0, 1, 2].map(r => {
    const t = T('score 1.1', P ? 13 : 14, C.amber, true);
    t.moveTo([fx(r), fy(0.14), 0]);
    return t;
  });
  await until(S(21));
  await play(
    new M.LaggedStart(scoreTags.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('EVERY GROUP GETS SCORE 1.1', C.amber)
  );

  // 22: Now the curve predicts about seventy-five of the hundred patients with one reminder will come.
  let guessLbl1 = T('75/100', 15, C.amber, true);
  guessLbl1.moveTo([fx(1), fy(0.75) - 0.30, 0]);
  let guessLbl2 = null;
  await until(S(22));
  await play(
    new M.Flash(predDot1, { color: C.amber }),
    new M.FadeIn(guessLbl1, { runTime: 0.6 }),
    ...fbox(['Try 1:  step = 0', ['1 rem guess: 75/100', C.amber]], C.amber),
    ...say('PREDICTS 75 OF 100 AT 1 REMINDER', C.amber)
  );

  // 23: Ninety really come, so that guess is too low.
  const err1 = new M.Line({ start: fXY(1, sig(B0)), end: fXY(1, 0.90), color: C.pink, strokeWidth: 4 });
  const err2 = new M.Line({ start: fXY(2, sig(B0)), end: fXY(2, 27 / 28), color: C.pink, strokeWidth: 4 });
  await until(S(23));
  await play(
    new M.Create(err1, { runTime: 0.7 }),
    new M.Create(err2, { runTime: 0.7 }),
    new M.Flash(realDots[1].core, { color: C.pink }),
    ...fbox(['Try 1:  step = 0', 'guess: 75/100', ['real:  90/100 (too low)', C.pink]], C.pink),
    ...say('90 REALLY COME — TOO LOW', C.pink)
  );

  // 24: To grade a guess, look at the chance it gives to each answer that really happens.
  await until(S(24));
  await play(
    new M.LaggedStart(realDots.map(d => new M.Indicate(d.g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['grade each guess:', ['chance of real answers', C.cyan]], C.cyan),
    ...say('CHECK CHANCE OF REAL ANSWERS')
  );

  // 25: A lower chance for a real answer earns a higher cost.
  await until(S(25));
  await play(
    new M.Indicate(err1, { color: C.pink, runTime: 0.9 }),
    new M.Indicate(err2, { color: C.pink, runTime: 0.9 }),
    ...fbox([['lower chance → higher cost', C.pink], ['higher chance → lower cost', C.green]], C.pink),
    ...say('LOWER CHANCE → HIGHER COST', C.pink)
  );

  // 26: We add those costs into a total called loss.
  // Build the mini Loss-vs-Step chart cleanly (right-bottom on laptop, lower half on phone).
  const lXMin = P ? -2.4 : 2.75, lXMax = P ? 3.0 : 6.35;
  const lYMin = P ? -5.15 : -2.55, lYMax = P ? -3.0 : -0.95;
  const lx = b => lXMin + (b / 1.45) * (lXMax - lXMin);
  const ly = v => lYMin + ((v - 91) / (107 - 91)) * (lYMax - lYMin);
  const lXY = (b, v) => [lx(b), ly(v), 0];

  const lXAxis = new M.Line({ start: [lXMin, lYMin, 0], end: [lXMax, lYMin, 0], color: C.muted, strokeWidth: 2 });
  const lYAxis = new M.Line({ start: [lXMin, lYMin, 0], end: [lXMin, lYMax, 0], color: C.muted, strokeWidth: 2 });
  const lTitle = T('loss vs step', 16, C.violet, true, true); lTitle.moveTo([(lXMin + lXMax) / 2, lYMax + 0.22, 0]);
  const lXTicks = [[0, '0'], [0.69, '0.7'], [1.1, '1.1']].map(([b, s]) => {
    const x = lx(b);
    const tk = new M.Line({ start: [x, lYMin - 0.06, 0], end: [x, lYMin + 0.06, 0], color: C.muted, strokeWidth: 1.5 });
    const lb = T(s, P ? 16 : 15, C.muted, true); lb.moveTo([x, lYMin - 0.27, 0]);
    return new M.VGroup(tk, lb);
  });
  const lYTicks = [[93, '93'], [105, '105']].map(([v, s]) => {
    const y = ly(v);
    const tk = new M.Line({ start: [lXMin - 0.06, y, 0], end: [lXMin + 0.06, y, 0], color: C.muted, strokeWidth: 1.5 });
    const lb = T(s, P ? 16 : 15, C.muted, true); lb.moveTo([lXMin - 0.42, y, 0]);
    return new M.VGroup(tk, lb);
  });

  await until(S(26));
  await play(
    new M.Create(lXAxis, { runTime: 0.6 }),
    new M.Create(lYAxis, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(lTitle, ...lXTicks, ...lYTicks), { runTime: 0.7 }),
    ...fbox([['loss = total of all costs', C.violet], ['lower loss = better fit', C.green]], C.violet),
    ...say('LOSS = TOTAL COST', C.violet)
  );

  // 27: With a step of zero, the loss is about one hundred and five.
  const lp0 = lXY(0, lossOf(0));
  const lDot0 = glowDot(lp0, C.pink, 0.09, 0.20);
  const lTxt0 = T('105', P ? 16 : 15, C.pink, true, true); lTxt0.moveTo([lp0[0] + 0.36, lp0[1] - 0.04, 0]);
  await until(S(27));
  await play(
    new M.FadeIn(lDot0.g, { runTime: 0.6 }),
    new M.Flash(lDot0.core, { color: C.pink }),
    new M.FadeIn(lTxt0, { runTime: 0.5 }),
    ...fbox(['Try 1:  step = 0', ['loss ≈ 105', C.pink]], C.pink),
    ...say('STEP 0 → LOSS ≈ 105', C.pink)
  );

  // 28: Raise the step to about zero point six nine and check again.
  const b2 = 0.69, p1_b2 = sig(B0 + b2), p2_b2 = sig(B0 + 2 * b2);
  const fitB2 = makeFitSegs(b2);
  const nextTags2 = ['1.1', '1.8', '2.5'].map((s, r) => {
    const t = T(`score ${s}`, P ? 13 : 14, C.amber, true); t.moveTo([fx(r), fy(0.14), 0]); return t;
  });
  const err1_b2 = new M.Line({ start: fXY(1, p1_b2), end: fXY(1, 0.90), color: C.pink, strokeWidth: 4 });
  const err2_b2 = new M.Line({ start: fXY(2, p2_b2), end: fXY(2, 27 / 28), color: C.pink, strokeWidth: 4 });
  const newDot1_b2 = new M.Dot({ point: fXY(1, p1_b2), radius: 0.10, color: C.amber }); newDot1_b2.setFill(C.amber, 1);
  const newDot2_b2 = new M.Dot({ point: fXY(2, p2_b2), radius: 0.10, color: C.amber }); newDot2_b2.setFill(C.amber, 1);

  await until(S(28));
  await play(
    ...predSegs.map((ln, k) => new M.Transform(ln, fitB2[k], { runTime: 0.9 })),
    new M.Transform(predDot1, newDot1_b2, { runTime: 0.9 }),
    new M.Transform(predDot2, newDot2_b2, { runTime: 0.9 }),
    new M.Transform(err1, err1_b2, { runTime: 0.9 }),
    new M.Transform(err2, err2_b2, { runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(...scoreTags, guessLbl1), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...nextTags2), { runTime: 0.7 }),
    ...fbox([['Try 2:  step = 0.69', C.amber], 'start = 1.1'], C.amber),
    ...say('TRY 2: RAISE STEP TO 0.69', C.amber)
  );
  scoreTags = nextTags2;

  // 29: Now it predicts about eighty-six of the hundred with one reminder.
  guessLbl1 = T('86/100', 15, C.amber, true); guessLbl1.moveTo([fx(1), fy(p1_b2) - 0.30, 0]);
  await until(S(29));
  await play(
    new M.Flash(predDot1, { color: C.amber }),
    new M.FadeIn(guessLbl1, { runTime: 0.6 }),
    ...fbox(['Try 2:  step = 0.69', ['1 rem: 86/100 (real 90)', C.amber]], C.amber),
    ...say('1 REMINDER: ~86 OF 100', C.amber)
  );

  // 30: It predicts about twenty-six of the twenty-eight with two reminders.
  guessLbl2 = T('26/28', 15, C.amber, true); guessLbl2.moveTo([fx(2), fy(p2_b2) - 0.30, 0]);
  await until(S(30));
  await play(
    new M.Flash(predDot2, { color: C.amber }),
    new M.FadeIn(guessLbl2, { runTime: 0.6 }),
    ...fbox(['Try 2:  step = 0.69', '1 rem: 86/100', ['2 rem: 26/28  (real 27)', C.amber]], C.amber),
    ...say('2 REMINDERS: ~26 OF 28', C.amber)
  );

  // 31: That is still low, but the loss drops to about ninety-four.
  const lp1 = lXY(b2, lossOf(b2));
  const lEdge01 = new M.Line({ start: lp0, end: lp1, color: C.amber, strokeWidth: 2.5 });
  const lDot1 = glowDot(lp1, C.amber, 0.09, 0.20);
  const lTxt1 = T('94', P ? 16 : 15, C.amber, true, true); lTxt1.moveTo([lp1[0] + 0.05, lp1[1] + 0.28, 0]);
  await until(S(31));
  await play(
    new M.Create(lEdge01, { runTime: 0.6 }),
    new M.FadeIn(lDot1.g, { runTime: 0.6 }),
    new M.Flash(lDot1.core, { color: C.amber }),
    new M.FadeIn(lTxt1, { runTime: 0.5 }),
    ...fbox(['Try 2:  step = 0.69', ['loss ≈ 94  (down from 105)', C.amber]], C.amber),
    ...say('LOSS DROPS TO ≈ 94', C.amber)
  );

  // 32: Raise the step again, to about one point one.
  const b3 = B0, p1_b3 = sig(B0 + b3), p2_b3 = sig(B0 + 2 * b3);
  const fitB3 = makeFitSegs(b3);
  const nextTags3 = ['1.1', '2.2', '3.3'].map((s, r) => {
    const t = T(`score ${s}`, P ? 13 : 14, C.green, true); t.moveTo([fx(r), fy(0.14), 0]); return t;
  });
  const newDot1_b3 = new M.Dot({ point: fXY(1, p1_b3), radius: 0.10, color: C.green }); newDot1_b3.setFill(C.green, 1);
  const newDot2_b3 = new M.Dot({ point: fXY(2, p2_b3), radius: 0.10, color: C.green }); newDot2_b3.setFill(C.green, 1);

  await until(S(32));
  await play(
    ...predSegs.map((ln, k) => new M.Transform(ln, fitB3[k], { runTime: 0.9 })),
    new M.Transform(predDot1, newDot1_b3, { runTime: 0.9 }),
    new M.Transform(predDot2, newDot2_b3, { runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(err1, err2, ...scoreTags, guessLbl1, guessLbl2), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...nextTags3), { runTime: 0.7 }),
    ...fbox([['Try 3:  step = 1.1', C.green], 'start = 1.1'], C.green),
    ...say('TRY 3: RAISE STEP TO 1.1', C.green)
  );
  scoreTags = nextTags3;

  // 33: Now it predicts about ninety of the hundred with one reminder.
  guessLbl1 = T('90/100 ✓', 15, C.green, true); guessLbl1.moveTo([fx(1), fy(p1_b3) - 0.30, 0]);
  await until(S(33));
  await play(
    new M.Flash(predDot1, { color: C.green }),
    new M.FadeIn(guessLbl1, { runTime: 0.6 }),
    ...fbox(['Try 3:  step = 1.1', ['1 rem: 90/100 ✓', C.green]], C.green),
    ...say('1 REMINDER: 90 OF 100 ✓', C.green)
  );

  // 34: It also predicts about twenty-seven of the twenty-eight with two reminders.
  guessLbl2 = T('27/28 ✓', 15, C.green, true); guessLbl2.moveTo([fx(2), fy(p2_b3) - 0.30, 0]);
  await until(S(34));
  await play(
    new M.Flash(predDot2, { color: C.green }),
    new M.FadeIn(guessLbl2, { runTime: 0.6 }),
    ...fbox(['Try 3:  step = 1.1', '1 rem: 90/100 ✓', ['2 rem: 27/28 ✓', C.green]], C.green),
    ...say('2 REMINDERS: 27 OF 28 ✓', C.green)
  );

  // 35: The loss drops to about ninety-three.
  const lp2 = lXY(b3, lossOf(b3));
  const lEdge12 = new M.Line({ start: lp1, end: lp2, color: C.green, strokeWidth: 2.5 });
  const lDot2 = glowDot(lp2, C.green, 0.10, 0.22);
  const lTxt2 = T('93', P ? 16 : 15, C.green, true, true); lTxt2.moveTo([lp2[0] + 0.08, lp2[1] + 0.30, 0]);
  await until(S(35));
  await play(
    new M.Create(lEdge12, { runTime: 0.5 }),
    new M.FadeIn(lDot2.g, { runTime: 0.5 }),
    new M.Flash(lDot2.core, { color: C.green }),
    new M.FadeIn(lTxt2, { runTime: 0.5 }),
    ...fbox(['Try 3:  step = 1.1', ['loss ≈ 93  (lowest)', C.green]], C.green),
    ...say('LOSS DROPS TO ≈ 93', C.green)
  );

  // 36: Watch the loss curve flatten as smaller changes give almost no improvement.
  const lossSegs = makeCurve(lossOf, 0, 1.42, 24, lXY, C.violet, 3);
  const flatBar = new M.Line({ start: [lx(0.85), ly(93.1), 0], end: [lx(1.32), ly(93.1), 0], color: C.green, strokeWidth: 3 });
  flatBar.setStrokeOpacity(0.85);
  await until(S(36));
  await play(
    new M.LaggedStart(lossSegs.map(ln => new M.Create(ln)), { lagRatio: 0.05, runTime: 1.4 }),
    new M.Create(flatBar, { runTime: 0.7 }),
    ...say('LOSS CURVE FLATTENS AT THE BOTTOM', C.violet)
  );

  // 37: Picking the numbers that make the recorded answers most likely is called maximum likelihood.
  await until(S(37));
  await play(
    new M.Indicate(lDot2.g, { color: C.green, runTime: 1.0 }),
    new M.LaggedStart(realDots.map(d => new M.Indicate(d.g, { color: C.green })), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox(['lowest loss =', 'most likely real answers', ['→ maximum likelihood', C.green]], C.green),
    ...say('MAXIMUM LIKELIHOOD', C.green)
  );

  // =========================================================================
  // ACT 4: TRACE 2 REMINDERS AND THE SIGMOID FORMULA (Sentences 38-47)
  // =========================================================================
  const s2XAxis = new M.Line({ start: [sXMin, sYMin, 0], end: [sXMax, sYMin, 0], color: C.muted, strokeWidth: 2.5 });
  const s2YAxis = new M.Line({ start: [sXMin, sYMin, 0], end: [sXMin, sYMax, 0], color: C.muted, strokeWidth: 2.5 });
  const s2Top = new M.DashedLine({ start: [sXMin, sy(1), 0], end: [sXMax, sy(1), 0], color: C.line });
  const s2Mid = new M.DashedLine({ start: [sXMin, sy(0.5), 0], end: [sXMax, sy(0.5), 0], color: C.line });
  const s2Zero = new M.DashedLine({ start: [sx(0), sYMin, 0], end: [sx(0), sYMax, 0], color: C.line });
  const s2XTicks = [-4, -2, 0, 2, 4].map(z => {
    const x = sx(z);
    const tk = new M.Line({ start: [x, sYMin - 0.08, 0], end: [x, sYMin + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(z), 16, C.muted, true); lb.moveTo([x, sYMin - 0.30, 0]);
    return new M.VGroup(tk, lb);
  });
  const s2XLab = T('score', 17, C.muted); s2XLab.moveTo([(sXMin + sXMax) / 2, sYMin - 0.64, 0]);
  const s2YTicks = [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([p, s]) => {
    const y = sy(p);
    const tk = new M.Line({ start: [sXMin - 0.08, y, 0], end: [sXMin + 0.08, y, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(s, 15, C.muted, true); lb.moveTo([sXMin - 0.52, y, 0]);
    return new M.VGroup(tk, lb);
  });
  const s2YLab = T('chance', 16, C.muted); s2YLab.moveTo([sXMin + 0.45, sYMax + 0.28, 0]);
  const sigSegs2 = makeCurve(sig, zMin, zMax, 38, sXY, C.cyan, 4);

  // 38: Here the best step is about one point one, like the starting score.
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(
      fXAxis, fYAxis, fG100, fG50, ...fXTicks, fXLab, ...fYTicks, fYLab,
      ...realDots.map(d => d.g), ...predSegs, predDot0, predDot1, predDot2,
      ...scoreTags, guessLbl1, guessLbl2,
      lXAxis, lYAxis, lTitle, ...lXTicks, ...lYTicks,
      lDot0.g, lTxt0, lEdge01, lDot1.g, lTxt1, lEdge12, lDot2.g, lTxt2, ...lossSegs, flatBar
    ), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(s2XAxis, s2YAxis, s2Top, s2Mid, s2Zero, ...s2XTicks, s2XLab, ...s2YTicks, s2YLab, ...sigSegs2), { runTime: 0.8 }),
    ...fbox([['start ≈ 1.1', C.amber], ['step  ≈ 1.1', C.amber], 'score = 1.1 + 1.1 × rem'], C.amber),
    ...say('START ≈ 1.1,  STEP ≈ 1.1', C.amber)
  );

  // 39: With two reminders, that gives a score of about three point three.
  const t33Dots = [1.1, 2.2, 3.3].map((z, k) => {
    const d = new M.Dot({ point: sXY(z, 0), radius: k === 2 ? 0.11 : 0.08, color: C.amber }); d.setFill(C.amber, 1);
    return d;
  });
  const t33Step1 = new M.Line({ start: [sx(1.1) + 0.06, sYMin + 0.24, 0], end: [sx(2.2) - 0.06, sYMin + 0.24, 0], color: C.amber, strokeWidth: 2.5 });
  const t33Step2 = new M.Line({ start: [sx(2.2) + 0.06, sYMin + 0.24, 0], end: [sx(3.3) - 0.06, sYMin + 0.24, 0], color: C.amber, strokeWidth: 2.5 });
  const t33Lbl = T('3.3', 17, C.amber, true, true); t33Lbl.moveTo([sx(3.3), sYMin + 0.46, 0]);
  await until(S(39));
  await play(
    new M.FadeIn(new M.VGroup(...t33Dots, t33Step1, t33Step2, t33Lbl), { runTime: 0.7 }),
    new M.Flash(t33Dots[2], { color: C.amber }),
    ...fbox(['2 reminders:', 'score = 1.1 + 1.1 × 2', ['      = 3.3', C.amber]], C.amber),
    ...say('2 REMINDERS → SCORE ≈ 3.3', C.amber)
  );

  // 40: Trace that score up to the S, then across to about ninety-six percent.
  const p33 = sig(3.3);
  const t33Up = new M.DashedLine({ start: sXY(3.3, 0.05), end: sXY(3.3, p33), color: C.green });
  const t33Hit = glowDot(sXY(3.3, p33), C.green, 0.12, 0.25);
  const t33Across = new M.DashedLine({ start: sXY(3.3, p33), end: [sXMin, sy(p33), 0], color: C.green });
  const t33Pct = T('≈ 96%', 17, C.green, true, true); t33Pct.moveTo([sXMin + 0.65, sy(p33) - 0.24, 0]);
  await until(S(40));
  await play(
    new M.Create(t33Up, { runTime: 0.7 }),
    new M.FadeIn(t33Hit.g, { runTime: 0.5 }),
    new M.Flash(t33Hit.core, { color: C.green }),
    new M.Create(t33Across, { runTime: 0.7 }),
    new M.FadeIn(t33Pct, { runTime: 0.5 }),
    ...fbox(['score  = 3.3', ['chance ≈ 96%', C.green]], C.green),
    ...say('SCORE 3.3 → ABOUT 96%', C.green)
  );

  // 41: The curve has a short formula that uses e, a fixed number near two point seven.
  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...t33Dots, t33Step1, t33Step2, t33Lbl, t33Up, t33Hit.g, t33Across, t33Pct), { runTime: 0.6 }),
    ...fbox([['e ≈ 2.718', C.amber], ['a fixed number near 2.7', C.muted]], C.amber),
    ...say('e ≈ 2.7  (A FIXED NUMBER)', C.amber)
  );

  // 42: A calculator has a button for e to a given power.
  const keyPos = [sx(-2.5), sy(0.68), 0];
  const keyRect = new M.RoundedRectangle({ width: 1.55, height: 0.92, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.5 });
  keyRect.setFill(C.card, 0.96); keyRect.moveTo(keyPos);
  const keyTxt = T('e^x', 28, C.amber, true, true); keyTxt.moveTo(keyPos);
  const keySub = T('calculator key', 13, C.muted); keySub.moveTo([keyPos[0], keyPos[1] - 0.66, 0]);
  const calcKey = new M.VGroup(keyRect, keyTxt, keySub);
  await until(S(42));
  await play(
    new M.FadeIn(calcKey, { runTime: 0.7 }),
    new M.Indicate(calcKey, { color: C.amber, runTime: 0.8 }),
    ...fbox(['calculator button:', ['  [ e^x ]', C.amber]], C.amber),
    ...say('CALCULATOR BUTTON: e^x', C.amber)
  );

  // 43: The result grows as the number in the power grows.
  const growDots = [0, 1, 2].map(z => glowDot(sXY(z, sig(z)), C.amber, 0.10, 0.22));
  await until(S(43));
  await play(
    new M.LaggedStart(growDots.map(d => new M.FadeIn(d.g)), { lagRatio: 0.2, runTime: 0.9 }),
    ...fbox(['e^0  =  1', 'e^1  ≈  2.7', ['e^2  ≈  7.4  (grows!)', C.amber]], C.amber),
    ...say('BIGGER POWER → BIGGER RESULT', C.amber)
  );

  // 44: The power here is the score.
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(calcKey, ...growDots.map(d => d.g)), { runTime: 0.5 }),
    ...fbox(['power = score', ['→  e^score', C.cyan]], C.cyan),
    ...say('POWER = SCORE')
  );

  // 45: Chance equals e to the power of the score, divided by one plus that same result.
  await until(S(45));
  await play(
    new M.LaggedStart(sigSegs2.map(ln => new M.Indicate(ln, { color: C.cyan })), { lagRatio: 0.02, runTime: 1.2 }),
    ...fbox([
      ['chance =    e^score', C.cyan],
      ['         ─────────────', C.muted],
      ['          1 + e^score', C.cyan]
    ], C.cyan),
    ...say('SIGMOID FORMULA')
  );

  // 46: At score zero, e to the power zero equals one.
  const z0Mark = new M.Dot({ point: sXY(0, 0), radius: 0.11, color: C.amber }); z0Mark.setFill(C.amber, 1);
  await until(S(46));
  await play(
    new M.FadeIn(z0Mark, { runTime: 0.5 }),
    new M.Flash(z0Mark, { color: C.amber }),
    ...fbox(['at score = 0:', ['e^0 = 1', C.amber]], C.amber),
    ...say('AT SCORE 0:  e^0 = 1', C.amber)
  );

  // 47: One divided by one plus one gives a chance of one half.
  const hUp = new M.DashedLine({ start: sXY(0, 0), end: sXY(0, 0.5), color: C.green });
  const hAcross = new M.DashedLine({ start: sXY(0, 0.5), end: [sXMin, sy(0.5), 0], color: C.green });
  const hDot = glowDot(sXY(0, 0.5), C.green, 0.12, 0.26);
  const hLab = T('1/2 = 50%', 17, C.green, true, true); hLab.moveTo([sx(0) + 1.05, sy(0.5) - 0.25, 0]);
  await until(S(47));
  await play(
    new M.Create(hUp, { runTime: 0.6 }),
    new M.Create(hAcross, { runTime: 0.6 }),
    new M.FadeIn(hDot.g, { runTime: 0.5 }),
    new M.Flash(hDot.core, { color: C.green }),
    new M.FadeIn(hLab, { runTime: 0.5 }),
    ...fbox(['chance = 1 ÷ (1 + 1)', ['       = 1/2 = 50%', C.green]], C.green),
    ...say('1 ÷ (1 + 1) = 1/2 = 50%', C.green)
  );

  // =========================================================================
  // ACT 5: USE CASE, TRAP, AND RECAP (Sentences 48-51)
  // =========================================================================

  // 48: Use logistic regression when you want the chance of a yes-or-no outcome.
  const yesBadge = pill('YES: CAME', C.cyan, 15); yesBadge.moveTo([sx(-2.3), sy(0.78), 0]);
  const noBadge = pill('NO: MISSED', C.pink, 15); noBadge.moveTo([sx(2.4), sy(0.24), 0]);
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(z0Mark, hUp, hAcross, hDot.g, hLab), { runTime: 0.5 }),
    new M.FadeIn(yesBadge, { runTime: 0.6 }),
    new M.FadeIn(noBadge, { runTime: 0.6 }),
    ...fbox(['Use for: yes / no', ['output: 0% to 100%', C.cyan]], C.cyan),
    ...say('USE FOR YES-OR-NO CHANCES')
  );

  // 49: One trap is treating the score step as a fixed change in percent.
  const trapTicks = [1.1, 2.2, 3.3].map(z => {
    const d = new M.Dot({ point: sXY(z, 0), radius: 0.09, color: C.amber }); d.setFill(C.amber, 1);
    return d;
  });
  const trapStep1 = new M.Line({ start: [sx(1.1) + 0.06, sYMin + 0.24, 0], end: [sx(2.2) - 0.06, sYMin + 0.24, 0], color: C.amber, strokeWidth: 3 });
  const trapStep2 = new M.Line({ start: [sx(2.2) + 0.06, sYMin + 0.24, 0], end: [sx(3.3) - 0.06, sYMin + 0.24, 0], color: C.amber, strokeWidth: 3 });
  const trapLbl1 = T('+1.1', 14, C.amber, true); trapLbl1.moveTo([sx(1.65), sYMin + 0.48, 0]);
  const trapLbl2 = T('+1.1', 14, C.amber, true); trapLbl2.moveTo([sx(2.75), sYMin + 0.48, 0]);

  await until(S(49));
  await play(
    new M.FadeOut(new M.VGroup(yesBadge, noBadge), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...trapTicks, trapStep1, trapStep2, trapLbl1, trapLbl2), { runTime: 0.7 }),
    ...fbox([['Trap: +1.1 score', C.pink], ['≠ fixed % jump', C.pink]], C.pink),
    ...say('TRAP: SCORE STEP ≠ FIXED %', C.pink)
  );

  // 50: Near the top of the S, the same step moves the chance less.
  const pA = sig(1.1), pB = sig(2.2), pC = sig(3.3);
  const run1 = new M.Line({ start: sXY(1.1, pA), end: sXY(2.2, pA), color: C.amber, strokeWidth: 2.5 });
  const rise1 = new M.Line({ start: sXY(2.2, pA), end: sXY(2.2, pB), color: C.amber, strokeWidth: 4.5 });
  const jump1 = T('+15%', 16, C.amber, true, true); jump1.moveTo([sx(1.70), sy(pA - 0.13), 0]);

  const run2 = new M.Line({ start: sXY(2.2, pB), end: sXY(3.3, pB), color: C.pink, strokeWidth: 2.5 });
  const rise2 = new M.Line({ start: sXY(3.3, pB), end: sXY(3.3, pC), color: C.pink, strokeWidth: 4.5 });
  const jump2 = T('+6%', 16, C.pink, true, true); jump2.moveTo([sx(3.3) + 0.44, sy((pB + pC) / 2), 0]);

  const topDots = [[1.1, pA, C.amber], [2.2, pB, C.amber], [3.3, pC, C.pink]].map(([z, p, c]) => {
    const d = new M.Dot({ point: sXY(z, p), radius: 0.09, color: c }); d.setFill(c, 1); return d;
  });

  await until(S(50));
  await play(
    new M.Create(run1, { runTime: 0.5 }),
    new M.Create(rise1, { runTime: 0.6 }),
    new M.FadeIn(jump1, { runTime: 0.5 }),
    new M.Create(run2, { runTime: 0.5 }),
    new M.Create(rise2, { runTime: 0.6 }),
    new M.FadeIn(jump2, { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...topDots), { runTime: 0.5 }),
    ...fbox(['1.1 → 2.2 :  +15%', ['2.2 → 3.3 :   +6%', C.pink], ['smaller near the top', C.muted]], C.pink),
    ...say('SAME STEP, SMALLER % NEAR TOP', C.pink)
  );

  // 51: Logistic regression fits a straight score line and turns that score into a chance.
  await until(S(51));
  await play(
    new M.LaggedStart(sigSegs2.map(ln => new M.Indicate(ln, { color: C.green })), { lagRatio: 0.02, runTime: 1.3 }),
    ...fbox([
      ['1. straight score line', C.amber],
      '   score = 1.1 + 1.1 × rem',
      ['2. S-curve → chance', C.cyan]
    ], C.green),
    ...say('SCORE LINE → SIGMOID → CHANCE', C.green)
  );
}
