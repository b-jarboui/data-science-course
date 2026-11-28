// 6.3.3 Beta–binomial updating (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 43 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants: portrait phone (8 x 14.22, y in [-5.5, 4.3]) and laptop (14.22 x 8, y in [-3.0, 2.3])
  const X0 = P ? -3.35 : -6.25, X1 = P ? 3.35 : 1.65, L0 = X1 - X0, CX = (X0 + X1) / 2;
  const BASE = P ? -0.65 : -1.55;
  const HMAX = P ? 2.75 : 2.50;
  const YMAX = 4.65;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.15, 0] : [4.55, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.8 : 4.25;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const px = pct => X0 + (pct / 100) * L0;
  const py = dens => BASE + (dens / YMAX) * HMAX;

  // Exact Beta PDF for integer shape numbers a, b >= 1
  const logFact = n => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const betaPdf = (x, a, b) => {
    if (x <= 0 || x >= 1) return 0;
    const logB = logFact(a - 1) + logFact(b - 1) - logFact(a + b - 1);
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logB);
  };

  // One formula box at a time (matches approved reference 1.2.4)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.39;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Drawing helpers (every returned object is fresh, placed with moveTo, fills via setFill)
  function makeAxis(y = BASE, maxPct = 100, step = 20, showUnit = true) {
    const xOf = pct => X0 + (pct / maxPct) * L0;
    const line = new M.Line({ start: [X0, y, 0], end: [X1, y, 0], color: C.muted, strokeWidth: 3 });
    const parts = [];
    for (let v = 0; v <= maxPct; v += step) {
      const x = xOf(v);
      parts.push(new M.Line({ start: [x, y - 0.08, 0], end: [x, y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(v + '%', P ? 15 : 17, C.muted, true);
      t.moveTo([x, y - 0.33, 0]);
      parts.push(t);
    }
    const unit = showUnit ? T('failure rate', P ? 15 : 16, C.muted) : null;
    if (unit) unit.moveTo([CX, y - 0.68, 0]);
    return { line, ticks: new M.VGroup(...parts), unit, xOf };
  }

  function makeBetaHill(a, b, color, fillOp = 0.17, nSeg = 54) {
    const pts = [];
    for (let i = 0; i <= nSeg; i++) {
      const pct = (i / nSeg) * 100;
      pts.push([px(pct), py(betaPdf(pct / 100, a, b)), 0]);
    }
    const dx = L0 / nSeg;
    const strips = [];
    const glowLines = [];
    const segs = [];
    for (let i = 0; i < nSeg; i++) {
      const h = Math.max(0.005, (betaPdf((i + 0.5) / nSeg, a, b) / YMAX) * HMAX);
      const r = new M.Rectangle({ width: dx + 0.015, height: h, color, strokeWidth: 0 });
      r.setFill(color, fillOp);
      r.moveTo([px(((i + 0.5) / nSeg) * 100), BASE + h / 2, 0]);
      strips.push(r);
      const g = new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: 7 });
      g.setStrokeOpacity(0.18);
      glowLines.push(g);
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: 3.2 }));
    }
    return {
      fill: new M.VGroup(...strips),
      glow: new M.VGroup(...glowLines),
      segs
    };
  }

  function makeGhostCurve(a, b, color, nSeg = 48) {
    const segs = [];
    for (let i = 0; i < nSeg; i++) {
      const p0 = [px((i / nSeg) * 100), py(betaPdf(i / nSeg, a, b)), 0];
      const p1 = [px(((i + 1) / nSeg) * 100), py(betaPdf((i + 1) / nSeg, a, b)), 0];
      const l = new M.Line({ start: p0, end: p1, color, strokeWidth: 2 });
      l.setStrokeOpacity(0.5);
      segs.push(l);
    }
    return new M.VGroup(...segs);
  }

  function makePart(x, y, fail, ghost = false, scale = 1) {
    const col = fail ? C.pink : C.green;
    const w = (P ? 0.42 : 0.46) * scale, h = (P ? 0.36 : 0.40) * scale;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07 * scale, color: col, strokeWidth: ghost ? 1.5 : 2 });
    body.setFill(col, ghost ? 0.14 : 0.34);
    body.moveTo([x, y, 0]);
    const prH = 0.09 * scale, prDx = w * 0.22;
    const p1 = new M.Line({ start: [x - prDx, y + h / 2, 0], end: [x - prDx, y + h / 2 + prH, 0], color: col, strokeWidth: 2 });
    const p2 = new M.Line({ start: [x + prDx, y + h / 2, 0], end: [x + prDx, y + h / 2 + prH, 0], color: col, strokeWidth: 2 });
    const mark = T(fail ? '✕' : '✓', Math.round((P ? 15 : 16) * scale), col, true, true);
    mark.moveTo([x, y, 0]);
    return new M.VGroup(body, p1, p2, mark);
  }

  function makeDot(p, color, r = 0.10) {
    const halo = new M.Dot({ point: p, radius: r * 2.1, color });
    halo.setFill(color, 0.22);
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return { g: new M.VGroup(halo, d), d };
  }

  function makeJug(x, y, w, h, fillFrac, color, titleText, subText) {
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.5 });
    body.setFill(C.card, 0.9);
    body.moveTo([x, y, 0]);
    const fh = (h - 0.10) * fillFrac;
    const liq = new M.RoundedRectangle({ width: w - 0.12, height: fh, cornerRadius: 0.08, color, strokeWidth: 0 });
    liq.setFill(color, 0.42);
    liq.moveTo([x, y - h / 2 + 0.05 + fh / 2, 0]);
    const handle = new M.Arc({ radius: h * 0.24, startAngle: -Math.PI / 2, angle: Math.PI, color });
    handle.moveTo([x + w / 2 + h * 0.10, y + 0.02, 0]);
    const topL = T(titleText, P ? 17 : 18, color, true, true);
    topL.moveTo([x, y, 0]);
    const botL = T(subText, P ? 15 : 16, C.muted, true);
    botL.moveTo([x, y - h / 2 - 0.28, 0]);
    return new M.VGroup(body, liq, handle, topL, botL);
  }

  // ==================== ACT 1 (0–5): Five bars melt into a smooth Beta hill ====================

  // 0: Last lesson, we updated belief over five candidate rates, one bar at a time.
  const ax = makeAxis(BASE, 100, 20, true);
  const GRID_RATES = [10, 20, 30, 40, 50];
  const GRID_POST = [3, 30, 40, 21, 6];
  const barW = P ? 0.42 : 0.50;
  const bars5 = GRID_RATES.map((rate, k) => {
    const h = Math.max(0.10, (GRID_POST[k] / 40) * (HMAX * 0.78));
    const r = new M.Rectangle({ width: barW, height: h, color: C.green, strokeWidth: 2 });
    r.setFill(C.green, 0.72);
    r.moveTo([px(rate), BASE + h / 2, 0]);
    return r;
  });
  const barLabs5 = GRID_RATES.map((rate, k) => {
    const h = Math.max(0.10, (GRID_POST[k] / 40) * (HMAX * 0.78));
    const t = T(GRID_POST[k] + '%', P ? 16 : 15, C.green, true);
    t.moveTo([px(rate), BASE + h + 0.24, 0]);
    return t;
  });

  await until(S(0));
  await play(
    new M.Create(ax.line),
    new M.FadeIn(ax.ticks),
    new M.FadeIn(ax.unit),
    new M.LaggedStart(bars5.map(b => new M.FadeIn(b)), { lagRatio: 0.16, runTime: 1.5 }),
    new M.LaggedStart(barLabs5.map(t => new M.FadeIn(t)), { lagRatio: 0.16, runTime: 1.5 }),
    ...say('LAST LESSON: 5 CANDIDATE RATES', C.green)
  );

  // 1: But the true failure rate could be any value, like twenty two or twenty seven percent, not only five.
  const m22 = makeDot([px(22), BASE, 0], C.amber, 0.09);
  const m27 = makeDot([px(27), BASE, 0], C.amber, 0.09);
  const s22 = new M.DashedLine({ start: [px(22), BASE + 0.08, 0], end: [px(22), BASE + HMAX * 0.90, 0], color: C.amber });
  const s27 = new M.DashedLine({ start: [px(27), BASE + 0.08, 0], end: [px(27), BASE + HMAX * 0.72, 0], color: C.amber });
  const l22 = T('22%', P ? 17 : 18, C.amber, true, true);
  l22.moveTo([px(22) - 0.12, BASE + HMAX * 0.90 + 0.26, 0]);
  const l27 = T('27%', P ? 17 : 18, C.amber, true, true);
  l27.moveTo([px(27) + 0.28, BASE + HMAX * 0.72 + 0.26, 0]);

  await until(S(1));
  await play(
    new M.Create(s22), new M.Create(s27),
    new M.FadeIn(m22.g), new M.FadeIn(m27.g),
    new M.FadeIn(l22), new M.FadeIn(l27),
    new M.Flash(m22.d, { color: C.amber }),
    new M.Flash(m27.d, { color: C.amber }),
    ...say('COULD BE 22%, 27%, ANY RATE', C.amber)
  );

  // 2: With every value allowed, the bars melt into one smooth hill.
  const introHill = makeBetaHill(3, 7, C.cyan, 0.18);
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...bars5, ...barLabs5, s22, s27, m22.g, m27.g, l22, l27)),
    new M.FadeIn(introHill.fill),
    new M.FadeIn(introHill.glow),
    new M.LaggedStart(introHill.segs.map(l => new M.Create(l)), { lagRatio: 0.025, runTime: 1.4 }),
    ...say('BARS MELT INTO ONE SMOOTH HILL', C.cyan)
  );

  // 3: A hill like this, on the line from zero to one hundred percent, is a distribution.
  const span01 = new M.Arrow({ start: [X0 + 0.05, BASE + 0.16, 0], end: [X1 - 0.05, BASE + 0.16, 0], color: C.amber, strokeWidth: 2.5 });
  await until(S(3));
  await play(
    new M.Create(span01),
    new M.Indicate(introHill.fill, { color: C.cyan }),
    ...fbox([['distribution', C.cyan], 'belief spread smoothly', 'from 0% to 100%'], C.cyan),
    ...say('A DISTRIBUTION ON 0% TO 100%', C.cyan)
  );

  // 4: You met one family of such hills in unit five: the beta distribution.
  const fam1 = makeGhostCurve(6, 6, C.violet);
  const fam2 = makeGhostCurve(2, 10, C.amber);
  await until(S(4));
  await play(
    new M.FadeOut(span01),
    new M.FadeIn(fam1),
    new M.FadeIn(fam2),
    ...fbox([['beta distribution', C.violet], 'a family of smooth hills', 'on 0% to 100%'], C.violet),
    ...say('FAMILY OF HILLS: BETA', C.violet)
  );

  // 5: A beta hill is set by two numbers, called shape numbers.
  const cardY = P ? 1.15 : 0.15;
  const cardDx = P ? 1.75 : 1.95;
  const cardW = P ? 2.65 : 2.90, cardH = P ? 1.55 : 1.50;
  function makeShapeCard(x, title, val, col) {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95);
    r.moveTo([x, cardY, 0]);
    const topT = T(title, P ? 16 : 17, C.muted, true);
    topT.moveTo([x, cardY + 0.42, 0]);
    const valT = T(val, P ? 36 : 40, col, true, true);
    valT.moveTo([x, cardY - 0.14, 0]);
    return { r, topT, valT };
  }
  const sc1 = makeShapeCard(CX - cardDx, '1st shape number', '?', C.pink);
  const sc2 = makeShapeCard(CX + cardDx, '2nd shape number', '?', C.green);

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(introHill.fill, introHill.glow, ...introHill.segs, fam1, fam2, ax.line, ax.ticks, ax.unit)),
    new M.FadeIn(sc1.r), new M.FadeIn(sc1.topT), new M.FadeIn(sc1.valT),
    new M.FadeIn(sc2.r), new M.FadeIn(sc2.topT), new M.FadeIn(sc2.valT),
    ...fbox([['Beta(first, second)', C.cyan], 'set by two shape numbers'], C.cyan),
    ...say('TWO SHAPE NUMBERS SET THE HILL', C.cyan)
  );

  // ==================== ACT 2 (6–11): Friendly reading & shop prior Beta(2, 8) ====================

  // 6: Here is a friendly way to read them. Think of them as counts of failures and passes you have already seen.
  const subFail = T('past failures', P ? 17 : 18, C.pink, true);
  subFail.moveTo([CX - cardDx, cardY - cardH / 2 - 0.32, 0]);
  const subPass = T('past passes', P ? 17 : 18, C.green, true);
  subPass.moveTo([CX + cardDx, cardY - cardH / 2 - 0.32, 0]);

  await until(S(6));
  await play(
    new M.FadeIn(subFail),
    new M.FadeIn(subPass),
    ...fbox(['friendly reading:', ['1st = past failures', C.pink], ['2nd = past passes', C.green]], C.amber),
    ...say('READ AS: PAST FAILURES & PASSES', C.amber)
  );

  // 7: The repair shop's prior is beta two, eight.
  const v2 = T('2', P ? 38 : 42, C.pink, true, true); v2.moveTo([CX - cardDx, cardY - 0.14, 0]);
  const v8 = T('8', P ? 38 : 42, C.green, true, true); v8.moveTo([CX + cardDx, cardY - 0.14, 0]);

  await until(S(7));
  await play(
    new M.FadeOut(sc1.valT), new M.FadeIn(v2),
    new M.FadeOut(sc2.valT), new M.FadeIn(v8),
    ...fbox([['shop prior: Beta(2, 8)', C.cyan]], C.cyan),
    ...say('SHOP PRIOR: BETA(2, 8)', C.cyan)
  );

  // 8: Read it as: it is as if we had already seen two failures and eight passes.
  const ghostY = P ? -1.20 : -1.55;
  const ghostSp = P ? 0.64 : 0.72;
  const ghostParts = Array.from({ length: 10 }, (_, k) =>
    makePart(CX + (k - 4.5) * ghostSp, ghostY, k < 2, true, 1.0)
  );
  const ghostTag = T('2 failures  +  8 passes', P ? 17 : 18, C.cyan, true);
  ghostTag.moveTo([CX, ghostY - 0.56, 0]);

  await until(S(8));
  await play(
    new M.LaggedStart(ghostParts.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.4 }),
    new M.FadeIn(ghostTag),
    ...fbox([['Prior: Beta(2, 8)', C.cyan], ['as if 2 failures', C.pink], ['and 8 passes', C.green]], C.cyan),
    ...say('AS IF: 2 FAILURES, 8 PASSES', C.cyan)
  );

  // 9: These are not real parts. It is only a handy way to say how strong, and where, the owner's belief is.
  const ghostBox = new M.RoundedRectangle({ width: 10 * ghostSp + 0.36, height: 1.05, cornerRadius: 0.14, color: C.muted, strokeWidth: 1.8 });
  ghostBox.moveTo([CX, ghostY + 0.02, 0]);
  const notReal = T('not real parts — shows belief & weight', P ? 15 : 16, C.muted);
  notReal.moveTo([CX, ghostY - 0.92, 0]);

  await until(S(9));
  await play(
    new M.Create(ghostBox),
    new M.FadeIn(notReal),
    ...fbox([['Beta(2, 8) — prior', C.cyan], 'not real parts', ['belief weight = 10', C.muted]], C.muted),
    ...say('NOT REAL PARTS: OWNER’S BELIEF', C.muted)
  );

  // 10: Let's draw that hill. It peaks low, near twelve percent, and fades out towards fifty.
  const ax1 = makeAxis(BASE, 100, 20, true);
  const priorHill = makeBetaHill(2, 8, C.cyan, 0.18);
  const pk12 = [px(12.5), py(betaPdf(0.125, 2, 8)), 0];
  const pk12Dot = makeDot(pk12, C.cyan, 0.08);
  const pk12Lab = T('peak ≈ 12%', P ? 16 : 17, C.cyan, true);
  pk12Lab.moveTo([px(16), pk12[1] + 0.34, 0]);
  const fade50 = T('fades near 50%', P ? 15 : 16, C.muted);
  fade50.moveTo([px(58), BASE + 0.45, 0]);
  const fadeArr = new M.Arrow({ start: [px(52), BASE + 0.32, 0], end: [px(50), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 });

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(sc1.r, sc1.topT, v2, sc2.r, sc2.topT, v8, subFail, subPass, ...ghostParts, ghostTag, ghostBox, notReal)),
    new M.Create(ax1.line),
    new M.FadeIn(ax1.ticks),
    new M.FadeIn(ax1.unit),
    new M.FadeIn(priorHill.fill),
    new M.FadeIn(priorHill.glow),
    new M.LaggedStart(priorHill.segs.map(l => new M.Create(l)), { lagRatio: 0.025, runTime: 1.4 }),
    new M.FadeIn(pk12Dot.g),
    new M.FadeIn(pk12Lab),
    new M.FadeIn(fade50),
    new M.Create(fadeArr),
    ...fbox([['Prior: Beta(2, 8)', C.cyan], 'peak ≈ 12%', 'fades near 50%'], C.cyan),
    ...say('PRIOR BETA(2, 8) · PEAK ≈ 12%', C.cyan)
  );

  // 11: Its centre, the mean, is the failures divided by all the parts: two out of ten, twenty percent.
  const mean20Y = py(betaPdf(0.20, 2, 8));
  const mean20Line = new M.DashedLine({ start: [px(20), BASE, 0], end: [px(20), mean20Y + 0.25, 0], color: C.amber });
  const mean20Dot = makeDot([px(20), BASE, 0], C.amber, 0.085);
  const mean20Tag = T('mean 20%', P ? 16 : 17, C.amber, true, true);
  mean20Tag.moveTo([px(33), mean20Y + 0.32, 0]);

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(pk12Dot.g, pk12Lab, fade50, fadeArr)),
    new M.Create(mean20Line),
    new M.FadeIn(mean20Dot.g),
    new M.FadeIn(mean20Tag),
    new M.Flash(mean20Dot.d, { color: C.amber }),
    ...fbox([['Prior: Beta(2, 8)', C.cyan], 'all parts = 2 + 8 = 10', ['mean = 2 ÷ 10 = 20%', C.amber]], C.amber),
    ...say('PRIOR MEAN = 2 ÷ 10 = 20%', C.amber)
  );

  // ==================== ACT 3 (12–23): New batch arrives & just add ====================

  // 12: Now the new batch arrives: ten parts, three failures, seven passes.
  const batchY = P ? -1.85 : -2.42;
  const batchSp = P ? 0.62 : 0.68;
  const batchParts = Array.from({ length: 10 }, (_, k) =>
    makePart(CX + (k - 4.5) * batchSp, batchY, k < 3, false, 0.92)
  );
  const batchLab = T('New batch: 3 failures, 7 passes', P ? 17 : 16, C.amber, true);
  batchLab.moveTo([CX, batchY - 0.44, 0]);

  await until(S(12));
  await play(
    new M.FadeOut(ax1.unit),
    new M.LaggedStart(batchParts.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.3 }),
    new M.FadeIn(batchLab),
    ...fbox([['New batch (10 parts)', C.amber], ['3 failures', C.pink], ['7 passes', C.green]], C.amber),
    ...say('NEW BATCH: 3 FAIL, 7 PASS', C.amber)
  );

  // 13: Last lesson, we multiplied the prior by the likelihood, then rescaled. We could do that again, at every point of the hill.
  const multMarks = [10, 20, 30, 40, 50].map(pct => {
    const t = T('×', P ? 18 : 20, C.amber, true, true);
    t.moveTo([px(pct), py(betaPdf(pct / 100, 2, 8)) + 0.18, 0]);
    return t;
  });

  await until(S(13));
  await play(
    new M.LaggedStart(multMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.14, runTime: 1.2 }),
    ...fbox(['old way:', 'prior × likelihood', 'at every single point', ['(then rescale)', C.muted]], C.muted),
    ...say('COULD MULTIPLY AT EVERY POINT…', C.muted)
  );

  // 14: But with a beta prior and pass or fail data, the answer is wonderfully easy.
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...multMarks)),
    ...fbox([['Beta prior', C.cyan], ['+ pass / fail data', C.amber], ['= much easier!', C.green]], C.green),
    ...say('BETA + PASS/FAIL = EASY', C.green)
  );

  // 15: The posterior is again a beta hill. We just add.
  await until(S(15));
  await play(
    ...fbox([['Posterior = Beta(?, ?)', C.green], ['We just add!', C.amber]], C.green),
    ...say('POSTERIOR IS BETA: JUST ADD', C.green)
  );

  // 16: Add the new failures to the first number. Two plus three makes five.
  await until(S(16));
  await play(
    new M.LaggedStart(batchParts.slice(0, 3).map(p => new M.Indicate(p, { color: C.pink })), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox([['1st (failures):', C.pink], ['  2 + 3 = 5', C.amber], ['2nd (passes):', C.muted], '  8 + ?'], C.pink),
    ...say('FAILURES: 2 + 3 = 5', C.pink)
  );

  // 17: Add the new passes to the second number. Eight plus seven makes fifteen.
  await until(S(17));
  await play(
    new M.LaggedStart(batchParts.slice(3).map(p => new M.Indicate(p, { color: C.green })), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox([['1st (failures):', C.pink], '  2 + 3 = 5', ['2nd (passes):', C.green], ['  8 + 7 = 15', C.amber]], C.green),
    ...say('PASSES: 8 + 7 = 15', C.green)
  );

  // 18: So the posterior is beta five, fifteen.
  await until(S(18));
  await play(
    ...fbox([['Prior:     Beta(2, 8)', C.cyan], ['Batch:     +3, +7', C.amber], ['Posterior: Beta(5, 15)', C.green]], C.green),
    ...say('POSTERIOR = BETA(5, 15)', C.green)
  );

  // 19: As if we had now seen five failures and fifteen passes in total.
  const totSp = P ? 0.32 : 0.36;
  const totDots = Array.from({ length: 20 }, (_, k) => {
    const col = k < 5 ? C.pink : C.green;
    const r = new M.RoundedRectangle({ width: totSp * 0.74, height: 0.28, cornerRadius: 0.05, color: col, strokeWidth: 1.5 });
    r.setFill(col, 0.78);
    r.moveTo([CX + (k - 9.5) * totSp, batchY, 0]);
    return r;
  });
  const totLab = T('5 failures + 15 passes = 20 total', P ? 17 : 16, C.green, true);
  totLab.moveTo([CX, batchY - 0.42, 0]);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...batchParts, batchLab)),
    new M.LaggedStart(totDots.map(d => new M.FadeIn(d)), { lagRatio: 0.03, runTime: 1.1 }),
    new M.FadeIn(totLab),
    ...fbox([['Beta(5, 15)', C.green], ['5 failures + 15 passes', C.ink], ['= 20 parts total', C.amber]], C.green),
    ...say('TOTAL: 5 FAILURES, 15 PASSES', C.green)
  );

  // 20: Let's draw the new hill in green, next to the blue prior.
  const postHill = makeBetaHill(5, 15, C.green, 0.20);
  // labels sit in the empty space right of both hills, like a legend
  const postTag = T('Posterior Beta(5,15)', P ? 16 : 16, C.green, true, true);
  postTag.moveTo([px(P ? 66 : 64), py(4.1), 0]);
  const priorTag = T('Prior Beta(2,8)', P ? 16 : 16, C.cyan, true, true);
  priorTag.moveTo([postTag.getCenter()[0], py(4.1) - 0.42, 0]);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...totDots, totLab, mean20Line, mean20Dot.g, mean20Tag)),
    new M.FadeIn(postHill.fill),
    new M.FadeIn(postHill.glow),
    new M.LaggedStart(postHill.segs.map(l => new M.Create(l)), { lagRatio: 0.025, runTime: 1.4 }),
    new M.FadeIn(priorTag),
    new M.FadeIn(postTag),
    ...fbox([['Blue:  Prior Beta(2, 8)', C.cyan], ['Green: Posterior Beta(5, 15)', C.green]], C.green),
    ...say('GREEN POSTERIOR vs BLUE PRIOR', C.green)
  );

  // 21: It is taller and narrower. We are surer than before, because we have more evidence.
  const tallArr = new M.Arrow({ start: [px(22.2), py(3.55), 0], end: [px(22.2), py(4.30), 0], color: C.green, strokeWidth: 3 });
  const narL = new M.Arrow({ start: [px(5), py(1.7), 0], end: [px(12), py(1.7), 0], color: C.green, strokeWidth: 2.5 });
  const narR = new M.Arrow({ start: [px(45), py(1.7), 0], end: [px(36), py(1.7), 0], color: C.green, strokeWidth: 2.5 });

  await until(S(21));
  await play(
    new M.Create(tallArr), new M.Create(narL), new M.Create(narR),
    ...fbox([['More evidence (10 → 20)', C.green], 'taller & narrower hill', ['= more sure than before', C.amber]], C.green),
    ...say('TALLER & NARROWER = MORE SURE', C.green)
  );

  // 22: And it has slid a little to the right, towards more failures.
  const shiftArr = new M.Arrow({ start: [px(12.5), py(3.55), 0], end: [px(22.2), py(3.55), 0], color: C.amber, strokeWidth: 3.5 });

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(tallArr, narL, narR)),
    new M.Create(shiftArr),
    ...say('SLID RIGHT → MORE FAILURES', C.amber)
  );

  // 23: Its mean is five out of twenty. That is twenty five percent.
  const mean25Line = new M.DashedLine({ start: [px(25), BASE, 0], end: [px(25), py(betaPdf(0.25, 5, 15)) + 0.15, 0], color: C.amber });
  const mean25Dot = makeDot([px(25), BASE, 0], C.amber, 0.09);
  const mean25Tag = T('mean 25%', P ? 16 : 17, C.amber, true, true);
  mean25Tag.moveTo([px(25), BASE - 0.72, 0]);

  await until(S(23));
  await play(
    new M.FadeOut(shiftArr),
    new M.Create(mean25Line),
    new M.FadeIn(mean25Dot.g),
    new M.FadeIn(mean25Tag),
    new M.Flash(mean25Dot.d, { color: C.amber }),
    ...fbox([['Posterior: Beta(5, 15)', C.green], 'total = 5 + 15 = 20', ['mean  = 5 ÷ 20 = 25%', C.amber]], C.green),
    ...say('POSTERIOR MEAN = 5 ÷ 20 = 25%', C.green)
  );

  // ==================== ACT 4 (24–29): Compare 20%, 30%, 25% & Mixing jugs ====================

  // 24: Let's compare three numbers on the line.
  const ZLY = P ? 1.50 : 0.45;
  const axZ = makeAxis(ZLY, 50, 10, false);

  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(
      ax1.line, ax1.ticks, priorHill.fill, priorHill.glow, ...priorHill.segs,
      postHill.fill, postHill.glow, ...postHill.segs, priorTag, postTag,
      mean25Line, mean25Dot.g, mean25Tag
    )),
    new M.Create(axZ.line, { runTime: 0.8 }),
    new M.FadeIn(axZ.ticks, { runTime: 0.8 }),
    ...hideBox(),
    ...say('COMPARE 3 NUMBERS ON THE LINE', C.cyan)
  );

  // 25: The prior alone said twenty percent.
  const x20z = axZ.xOf(20), x25z = axZ.xOf(25), x30z = axZ.xOf(30);
  const d20 = makeDot([x20z, ZLY, 0], C.cyan, 0.11);
  const stem20 = new M.Line({ start: [x20z, ZLY + 0.11, 0], end: [x20z, ZLY + 0.65, 0], color: C.cyan, strokeWidth: 2.5 });
  const t20 = T('Prior 20%', P ? 16 : 18, C.cyan, true, true);
  t20.moveTo([x20z - (P ? 0.35 : 0.25), ZLY + 0.90, 0]);

  await until(S(25));
  await play(
    new M.Create(stem20, { runTime: 0.7 }),
    new M.FadeIn(d20.g, { runTime: 0.7 }),
    new M.FadeIn(t20, { runTime: 0.7 }),
    new M.Flash(d20.d, { color: C.cyan }),
    ...fbox([['Prior alone: 20%', C.cyan]], C.cyan),
    ...say('PRIOR ALONE: 20%', C.cyan)
  );

  // 26: The batch alone said three out of ten, thirty percent.
  const d30 = makeDot([x30z, ZLY, 0], C.amber, 0.11);
  const stem30 = new M.Line({ start: [x30z, ZLY + 0.11, 0], end: [x30z, ZLY + 0.65, 0], color: C.amber, strokeWidth: 2.5 });
  const t30 = T('Batch 30%', P ? 16 : 18, C.amber, true, true);
  t30.moveTo([x30z + (P ? 0.35 : 0.25), ZLY + 0.90, 0]);

  await until(S(26));
  await play(
    new M.Create(stem30, { runTime: 0.8 }),
    new M.FadeIn(d30.g, { runTime: 0.8 }),
    new M.FadeIn(t30, { runTime: 0.8 }),
    new M.Flash(d30.d, { color: C.amber }),
    ...fbox([['Prior alone: 20%', C.cyan], ['Batch alone: 30% (3/10)', C.amber]], C.amber),
    ...say('BATCH ALONE: 3 ÷ 10 = 30%', C.amber)
  );

  // 27: The posterior says twenty five percent: in between.
  const d25 = makeDot([x25z, ZLY, 0], C.green, 0.12);
  const stem25 = new M.Line({ start: [x25z, ZLY + 0.12, 0], end: [x25z, ZLY + 1.15, 0], color: C.green, strokeWidth: 3 });
  const t25 = T('Posterior 25%', P ? 17 : 19, C.green, true, true);
  t25.moveTo([x25z, ZLY + 1.42, 0]);

  await until(S(27));
  await play(
    new M.Create(stem25, { runTime: 0.8 }),
    new M.FadeIn(d25.g, { runTime: 0.8 }),
    new M.FadeIn(t25, { runTime: 0.8 }),
    new M.Flash(d25.d, { color: C.green }),
    ...fbox([['Prior alone: 20%', C.cyan], ['Batch alone: 30%', C.amber], ['Posterior:   25% (between)', C.green]], C.green),
    ...say('POSTERIOR = 25% (IN BETWEEN)', C.green)
  );

  // 28: It is like mixing two jugs of juice. The mix tastes somewhere between them, closer to the bigger jug.
  const JUG_Y = P ? -0.95 : -1.55;
  const jugW = P ? 1.25 : 1.35, jugH = P ? 1.18 : 1.08;
  const jugSp = P ? 2.25 : 2.55;
  const jugPrior = makeJug(CX - jugSp, JUG_Y, jugW, jugH, 0.52, C.cyan, '20%', 'prior');
  const jugPlus = T('+', P ? 26 : 28, C.muted, true, true); jugPlus.moveTo([CX - jugSp / 2, JUG_Y, 0]);
  const jugBatch = makeJug(CX, JUG_Y, jugW, jugH, 0.52, C.amber, '30%', 'batch');
  const jugEq = T('=', P ? 26 : 28, C.muted, true, true); jugEq.moveTo([CX + jugSp / 2, JUG_Y, 0]);
  const jugMix = makeJug(CX + jugSp, JUG_Y, jugW, jugH, 0.84, C.green, '25%', 'mix');

  await until(S(28));
  await play(
    new M.LaggedStart([
      new M.FadeIn(jugPrior), new M.FadeIn(jugPlus), new M.FadeIn(jugBatch), new M.FadeIn(jugEq), new M.FadeIn(jugMix)
    ], { lagRatio: 0.14, runTime: 1.4 }),
    ...fbox(['Like mixing two jugs:', 'mix lies between them', ['closer to the bigger jug', C.amber]], C.amber),
    ...say('MIXING JUGS: CLOSER TO BIGGER', C.amber)
  );

  // 29: Here the prior counts as ten parts and the batch as ten parts, so they meet in the middle.
  const w10L = T('10 parts', P ? 15 : 16, C.cyan, true); w10L.moveTo([CX - jugSp, JUG_Y + jugH / 2 + 0.24, 0]);
  const w10R = T('10 parts', P ? 15 : 16, C.amber, true); w10R.moveTo([CX, JUG_Y + jugH / 2 + 0.24, 0]);
  const w20M = T('20 parts', P ? 15 : 16, C.green, true); w20M.moveTo([CX + jugSp, JUG_Y + jugH / 2 + 0.24, 0]);

  await until(S(29));
  await play(
    new M.FadeIn(w10L), new M.FadeIn(w10R), new M.FadeIn(w20M),
    new M.Indicate(t25, { color: C.green }),
    ...fbox([['Prior: 10 parts (20%)', C.cyan], ['Batch: 10 parts (30%)', C.amber], ['Equal → exact middle 25%', C.green]], C.green),
    ...say('10 PARTS + 10 PARTS → MIDPOINT', C.green)
  );

  // ==================== ACT 5 (30–37): Naming, one-line rule, and what it is for ====================

  // 30: A pair like this, a beta prior with pass or fail counts, is called beta–binomial updating.
  const pairY = P ? 1.55 : 0.45;
  const pairDx = P ? 1.85 : 2.15;
  const pairW = P ? 2.75 : 3.05, pairH = 1.05;
  function makePairCard(x, y, line1, line2, col) {
    const r = new M.RoundedRectangle({ width: pairW, height: pairH, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t1 = T(line1, P ? 18 : 19, col, true, true); t1.moveTo([x, y + 0.18, 0]);
    const t2 = T(line2, P ? 15 : 16, C.muted); t2.moveTo([x, y - 0.22, 0]);
    return new M.VGroup(r, t1, t2);
  }
  const cBeta = makePairCard(CX - pairDx, pairY, 'Beta prior', 'smooth hill', C.cyan);
  const cPlus = T('+', P ? 28 : 30, C.muted, true, true); cPlus.moveTo([CX, pairY, 0]);
  const cBin = makePairCard(CX + pairDx, pairY, 'Pass / fail counts', '3 fail, 7 pass', C.amber);
  const bbBanner = pill('BETA–BINOMIAL UPDATING', C.green, P ? 20 : 22);
  bbBanner.moveTo([CX, pairY - 1.25, 0]);

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(
      axZ.line, axZ.ticks, d20.g, stem20, t20, d30.g, stem30, t30, d25.g, stem25, t25,
      jugPrior, jugPlus, jugBatch, jugEq, jugMix, w10L, w10R, w20M
    )),
    new M.FadeIn(cBeta), new M.FadeIn(cPlus), new M.FadeIn(cBin),
    new M.FadeIn(bbBanner),
    ...fbox([['Beta–binomial updating', C.green], 'Beta prior', '+ pass / fail counts'], C.green),
    ...say('BETA–BINOMIAL UPDATING', C.green)
  );

  // 31: Binomial is the name, from unit five, for counting yes answers in a fixed number of yes or no trials. Here, a yes is a failed part.
  const binY = P ? -1.15 : -1.95;
  const binSp = P ? 0.62 : 0.68;
  const binParts = Array.from({ length: 10 }, (_, k) =>
    makePart(CX + (k - 4.5) * binSp, binY, k < 3, false, 0.90)
  );
  const binNote = T('10 fixed trials · count YES (failed) = 3', P ? 15 : 16, C.pink, true);
  binNote.moveTo([CX, binY - 0.50, 0]);

  await until(S(31));
  await play(
    new M.Indicate(cBin, { color: C.amber }),
    new M.LaggedStart(binParts.map(p => new M.FadeIn(p)), { lagRatio: 0.07, runTime: 1.2 }),
    new M.FadeIn(binNote),
    ...fbox([['Binomial:', C.amber], 'count YES in fixed trials', ['here: YES = failed part', C.pink]], C.amber),
    ...say('BINOMIAL = COUNT YES IN FIXED TRIALS', C.amber)
  );

  // 32: Here is the short version, in one line.
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(cBeta, cPlus, cBin, bbBanner, ...binParts, binNote), { runTime: 0.8 }),
    ...hideBox(),
    ...say('THE SHORT VERSION IN ONE LINE', C.cyan)
  );

  // 33: Beta of a and b, plus f failures and p passes, becomes beta of a plus f, and b plus p.
  const ruleY = P ? 1.45 : 0.35;
  const ruleW = P ? 6.9 : 7.5, ruleH = P ? 1.75 : 1.35;
  const ruleCard = new M.RoundedRectangle({ width: ruleW, height: ruleH, cornerRadius: 0.20, color: C.green, strokeWidth: 2.5 });
  ruleCard.setFill(C.card, 0.96);
  ruleCard.moveTo([CX, ruleY, 0]);
  let ruleLines;
  if (P) {
    const r1 = T('Beta(a, b)  +  f fail, p pass', 20, C.cyan, true, true); r1.moveTo([CX, ruleY + 0.34, 0]);
    const r2 = T('→  Beta(a + f, b + p)', 22, C.green, true, true); r2.moveTo([CX, ruleY - 0.32, 0]);
    ruleLines = [r1, r2];
  } else {
    const r1 = T('Beta(a, b) + (f fail, p pass)  →  Beta(a + f, b + p)', 18, C.green, true, true);
    r1.moveTo([CX, ruleY, 0]);
    ruleLines = [r1];
  }

  await until(S(33));
  await play(
    new M.FadeIn(ruleCard),
    new M.LaggedStart(ruleLines.map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.1 }),
    ...fbox([['Beta(a, b)', C.cyan], ['+ f failures, p passes', C.amber], ['→ Beta(a + f, b + p)', C.green]], C.green),
    ...say('BETA(a, b) → BETA(a + f, b + p)', C.green)
  );

  // 34: In everyday words: add failures to the first number, and passes to the second.
  const wFail = T('+ failures  →  first number', P ? 19 : 20, C.pink, true);
  wFail.moveTo([CX, ruleY - (P ? 1.50 : 1.25), 0]);
  const wPass = T('+ passes    →  second number', P ? 19 : 20, C.green, true);
  wPass.moveTo([CX, ruleY - (P ? 2.05 : 1.75), 0]);

  await until(S(34));
  await play(
    new M.FadeIn(wFail), new M.FadeIn(wPass),
    ...fbox(['In everyday words:', ['failures → 1st number', C.pink], ['passes   → 2nd number', C.green]], C.amber),
    ...say('FAILURES → 1ST · PASSES → 2ND', C.amber)
  );

  // 35: The posterior mean is the new first number, divided by the sum of both numbers.
  const meanCard = new M.RoundedRectangle({ width: P ? 6.6 : 6.8, height: 0.96, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  meanCard.setFill(C.card, 0.95);
  meanCard.moveTo([CX, ruleY - (P ? 3.10 : 2.65), 0]);
  const meanEq = T('mean = (a + f) ÷ (a + f + b + p)', P ? 18 : 19, C.amber, true, true);
  meanEq.moveTo([CX, ruleY - (P ? 3.10 : 2.65), 0]);

  await until(S(35));
  await play(
    new M.FadeIn(meanCard), new M.FadeIn(meanEq),
    ...fbox([['posterior mean', C.amber], '= (a + f) ÷ (a + f + b + p)', ['= 5 ÷ 20 = 25%', C.green]], C.amber),
    ...say('MEAN = 1ST ÷ SUM OF BOTH', C.amber)
  );

  // 36: What is it for? It turns updating into simple adding. You can update after every batch, even by hand.
  function makeStepBox(x, y, topTxt, botTxt, col) {
    const w = P ? 2.05 : 2.15, h = P ? 1.10 : 1.08;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: col, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t1 = T(topTxt, P ? 15 : 16, C.muted, true); t1.moveTo([x, y + 0.22, 0]);
    const t2 = T(botTxt, P ? 18 : 19, col, true, true); t2.moveTo([x, y - 0.18, 0]);
    return new M.VGroup(r, t1, t2);
  }
  const chY = P ? 1.15 : 0.15;
  const chSp = P ? 2.45 : 2.75;
  const st1 = makeStepBox(CX - chSp, chY, 'Start prior', 'Beta(2, 8)', C.cyan);
  const stA1 = new M.Arrow({ start: [CX - chSp + 1.08, chY, 0], end: [CX - 1.08, chY, 0], color: C.amber, strokeWidth: 2.5 });
  const stB1 = T('+3, +7', P ? 16 : 15, C.amber, true); stB1.moveTo([CX - chSp / 2, chY + (P ? 0.78 : 0.34), 0]);
  const st2 = makeStepBox(CX, chY, 'After batch 1', 'Beta(5, 15)', C.green);
  const stA2 = new M.Arrow({ start: [CX + 1.08, chY, 0], end: [CX + chSp - 1.08, chY, 0], color: C.violet, strokeWidth: 2.5 });
  const stB2 = T('+next', P ? 16 : 15, C.violet, true); stB2.moveTo([CX + chSp / 2, chY + (P ? 0.78 : 0.34), 0]);
  const st3 = makeStepBox(CX + chSp, chY, 'After batch 2', 'Beta(?, ?)', C.violet);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(ruleCard, ...ruleLines, wFail, wPass, meanCard, meanEq)),
    new M.LaggedStart([
      new M.FadeIn(st1), new M.Create(stA1), new M.FadeIn(stB1),
      new M.FadeIn(st2), new M.Create(stA2), new M.FadeIn(stB2), new M.FadeIn(st3)
    ], { lagRatio: 0.14, runTime: 1.5 }),
    ...fbox([['What is it for?', C.cyan], 'turns updating into adding', ['update batch by batch', C.green]], C.cyan),
    ...say('UPDATE AFTER EVERY BATCH BY HAND', C.cyan)
  );

  // 37: Today's posterior, beta five, fifteen, becomes the prior for the next batch.
  const handoffTag = pill('TODAY’S POSTERIOR = NEXT PRIOR', C.violet, P ? 17 : 18);
  handoffTag.moveTo([CX, chY - 1.25, 0]);

  await until(S(37));
  await play(
    new M.Indicate(st2, { color: C.green }),
    new M.Indicate(stA2, { color: C.violet }),
    new M.FadeIn(handoffTag),
    ...fbox([['Today: Beta(5, 15)', C.green], ['becomes the prior', C.violet], ['for the next batch', C.violet]], C.violet),
    ...say('TODAY’S POSTERIOR = NEXT PRIOR', C.violet)
  );

  // ==================== ACT 6 (38–42): Common trap (peak vs mean), range preview, recap ====================

  // 38: Here is a common trap. The peak of the hill and its mean are not the same.
  const ax2 = makeAxis(BASE, 100, 20, true);
  const postHill2 = makeBetaHill(5, 15, C.green, 0.22);

  // 39 (built now, lines+dots shown at 38): The peak of beta five, fifteen sits at about twenty two percent. The mean is twenty five.
  const pkX = px(22.22), pkY = py(betaPdf(4 / 18, 5, 15));
  const mnX = px(25.00), mnY = py(betaPdf(0.25, 5, 15));
  const pkLine = new M.DashedLine({ start: [pkX, BASE, 0], end: [pkX, pkY, 0], color: C.violet });
  const pkDot = makeDot([pkX, pkY, 0], C.violet, 0.085);
  const pkLbl = T('peak ≈ 22%', P ? 15 : 16, C.violet, true, true);
  pkLbl.moveTo([px(11), pkY + 0.38, 0]);
  const pkArr = new M.Arrow({ start: [px(14), pkY + 0.24, 0], end: [pkX - 0.06, pkY + 0.06, 0], color: C.violet, strokeWidth: 2 });

  const mnLine = new M.DashedLine({ start: [mnX, BASE, 0], end: [mnX, mnY, 0], color: C.amber });
  const mnDot = makeDot([mnX, BASE, 0], C.amber, 0.085);
  const mnLbl = T('mean = 25%', P ? 15 : 16, C.amber, true, true);
  mnLbl.moveTo([px(42), mnY + 0.25, 0]);
  const mnArr = new M.Arrow({ start: [px(33), mnY + 0.14, 0], end: [mnX + 0.08, mnY - 0.08, 0], color: C.amber, strokeWidth: 2 });

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(st1, stA1, stB1, st2, stA2, stB2, st3, handoffTag)),
    new M.Create(ax2.line),
    new M.FadeIn(ax2.ticks),
    new M.FadeIn(ax2.unit),
    new M.FadeIn(postHill2.fill),
    new M.FadeIn(postHill2.glow),
    new M.LaggedStart(postHill2.segs.map(l => new M.Create(l)), { lagRatio: 0.025, runTime: 1.3 }),
    new M.Create(pkLine), new M.FadeIn(pkDot.g), new M.Create(mnLine), new M.FadeIn(mnDot.g),
    ...fbox([['Common trap:', C.pink], ['peak ≠ mean', C.amber]], C.pink),
    ...say('COMMON TRAP: PEAK ≠ MEAN', C.pink)
  );

  await until(S(39));
  await play(
    new M.Create(pkArr), new M.FadeIn(pkLbl),
    new M.Create(mnArr), new M.FadeIn(mnLbl),
    ...fbox([['Beta(5, 15):', C.green], ['peak ≈ 22%', C.violet], ['mean = 25%', C.amber]], C.amber),
    ...say('PEAK ≈ 22%  ·  MEAN = 25%', C.amber)
  );

  // 40: A lopsided hill, with a long thin tail on one side, pulls its mean towards that tail. So always say which summary you report.
  const tailBand = new M.Rectangle({ width: px(68) - px(38), height: 0.65, color: C.pink, strokeWidth: 1.5 });
  tailBand.setFill(C.pink, 0.14);
  tailBand.moveTo([(px(38) + px(68)) / 2, BASE + 0.34, 0]);
  const tailLbl = T('long thin tail →', P ? 15 : 16, C.pink, true);
  tailLbl.moveTo([px(55), BASE + 0.92, 0]);
  const pullArr = new M.Arrow({ start: [pkX, BASE + 0.55, 0], end: [px(36), BASE + 0.55, 0], color: C.pink, strokeWidth: 3 });

  await until(S(40));
  await play(
    new M.FadeIn(tailBand), new M.FadeIn(tailLbl), new M.Create(pullArr),
    ...fbox([['Long tail pulls mean →', C.pink], 'peak ≈ 22% vs mean = 25%', ['say which you report!', C.amber]], C.pink),
    ...say('LONG TAIL PULLS THE MEAN', C.pink)
  );

  // 41: And a single summary still hides the doubt. Next lesson, we put a range around it.
  const rngL = px(9.1), rngR = px(45.6);
  const rngBand = new M.Rectangle({ width: rngR - rngL, height: HMAX * 0.92, color: C.cyan, strokeWidth: 1.5 });
  rngBand.setFill(C.cyan, 0.10);
  rngBand.moveTo([(rngL + rngR) / 2, BASE + (HMAX * 0.92) / 2, 0]);
  const rngBar = new M.Line({ start: [rngL, BASE - 1.05, 0], end: [rngR, BASE - 1.05, 0], color: C.cyan, strokeWidth: 4 });
  const rngCapL = new M.Line({ start: [rngL, BASE - 1.18, 0], end: [rngL, BASE - 0.92, 0], color: C.cyan, strokeWidth: 3 });
  const rngCapR = new M.Line({ start: [rngR, BASE - 1.18, 0], end: [rngR, BASE - 0.92, 0], color: C.cyan, strokeWidth: 3 });
  const rngTxt = T('next: 95% range (9% to 46%)', P ? 15 : 16, C.cyan, true);
  rngTxt.moveTo([(rngL + rngR) / 2, BASE - 1.38, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(tailBand, tailLbl, pullArr, ax2.unit)),
    new M.FadeIn(rngBand),
    new M.Create(rngBar), new M.FadeIn(rngCapL), new M.FadeIn(rngCapR), new M.FadeIn(rngTxt),
    ...fbox(['One number hides doubt', ['next: a range of rates', C.cyan]], C.cyan),
    ...say('NEXT: PUT A RANGE AROUND IT', C.cyan)
  );

  // 42: In one sentence: with a beta prior, add failures and passes to its two numbers, and you have the posterior.
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(rngBand, rngBar, rngCapL, rngCapR, rngTxt)),
    new M.Indicate(postHill2.fill, { color: C.green }),
    ...fbox([['Beta(a, b)', C.cyan], ['+ f fail, p pass', C.amber], ['= Beta(a + f, b + p)', C.green]], C.green),
    ...say('ADD FAILURES & PASSES → POSTERIOR', C.green)
  );
}
