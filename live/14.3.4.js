// 14.3.4 Low-rank reconstruction: rebuilding the original scores.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;

  const SHORT = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rs', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const TEA_A = [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
  const REBUILT2 = [2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
  const TEAS = [
    ['A', TEA_A, '(-7.35, -4.90)'],
    ['B', [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3], '(-7.35, -4.90)'],
    ['C', [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], '(-7.35, +4.90)'],
    ['D', [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], '(-7.35, +4.90)'],
    ['E', [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3], '(+7.35, -4.90)'],
    ['F', [9, 7, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3], '(+7.35, -4.90)'],
    ['G', [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7], '(+7.35, +4.90)'],
    ['H', [9, 7, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7], '(+7.35, +4.90)'],
  ];

  // Layout constants: laptop y in [-3.0, 2.3], phone y in [-5.5, 4.3]
  const CX = P ? 0.22 : -2.35;
  const SP = P ? 0.53 : 0.64;
  const GAP = P ? 0.24 : 0.32;
  const BW = P ? 0.36 : 0.44;
  const PW = BW * 0.48;
  const POFF = BW * 0.27;
  const BASE = P ? -4.35 : -2.10;
  const UNIT = P ? 0.52 : 0.34;
  const ZERO_Y = BASE + 5 * UNIT;
  const PILL = P ? [0, 1.92, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.28, 0] : [4.55, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.8 : 4.1;

  const colx = k => CX + (k - 5.5) * SP + (k < 6 ? -GAP / 2 : GAP / 2);
  const attrCol = k => (k < 6 ? C.cyan : C.amber);
  const AXIS_X = colx(0) - SP / 2 - (P ? 0.10 : 0.12);
  const AXIS_R = colx(11) + SP / 2 + (P ? 0.10 : 0.12);

  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.38 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow, { runTime: 0.45 })];
    boxNow = null;
    return a;
  }

  // Bar builders (never 0 height so Transform stays smooth)
  function scoreBar(k, v, color = attrCol(k), opts = {}) {
    const { x = colx(k), w = BW, fillOp = 0.82, strokeW = 1.6 } = opts;
    const h = Math.max(0.05, Math.abs(v) * UNIT);
    const b = new M.Rectangle({ width: w, height: h, color, strokeWidth: strokeW });
    b.setFill(color, fillOp);
    b.moveTo([x, BASE + h / 2, 0]);
    return b;
  }
  function devBar(k, d, color = attrCol(k), opts = {}) {
    const { x = colx(k), w = BW, fillOp = 0.82, strokeW = 1.6 } = opts;
    const h = Math.max(0.05, Math.abs(d) * UNIT);
    const cy = d >= 0 ? ZERO_Y + h / 2 : ZERO_Y - h / 2;
    const b = new M.Rectangle({ width: w, height: h, color, strokeWidth: strokeW });
    b.setFill(color, fillOp);
    b.moveTo([x, cy, 0]);
    return b;
  }

  function makeScoreAxes() {
    const parts = [];
    const xAxis = new M.Line({ start: [AXIS_X, BASE, 0], end: [AXIS_R, BASE, 0], color: C.muted, strokeWidth: 2 });
    const yAxis = new M.Line({ start: [AXIS_X, BASE, 0], end: [AXIS_X, BASE + 10 * UNIT, 0], color: C.muted, strokeWidth: 2 });
    parts.push(xAxis, yAxis);
    for (const v of [0, 2, 5, 8, 10]) {
      const y = BASE + v * UNIT;
      const g = new M.Line({ start: [AXIS_X, y, -0.01], end: [AXIS_R, y, -0.01], color: C.line, strokeWidth: 1 });
      g.setStrokeOpacity(0.5);
      const t = T(String(v), P ? 15 : 15, C.muted, true);
      t.moveTo([AXIS_X - 0.28, y, 0]);
      parts.push(g, t);
    }
    SHORT.forEach((name, k) => {
      const t = T(name, P ? 15 : 14, attrCol(k), true);
      t.moveTo([colx(k), BASE - (P ? 0.34 : 0.28), 0]);
      parts.push(t);
    });
    const g1 = T('first 6 · floral', P ? 15 : 15, C.cyan);
    g1.moveTo([(colx(0) + colx(5)) / 2, BASE - (P ? 0.78 : 0.62), 0]);
    const g2 = T('last 6 · roast', P ? 15 : 15, C.amber);
    g2.moveTo([(colx(6) + colx(11)) / 2, BASE - (P ? 0.78 : 0.62), 0]);
    parts.push(g1, g2);
    return new M.VGroup(...parts);
  }

  function makeCenteredAxes() {
    const parts = [];
    const yAxis = new M.Line({ start: [AXIS_X, BASE, 0], end: [AXIS_X, BASE + 10 * UNIT, 0], color: C.muted, strokeWidth: 2 });
    const zeroLine = new M.Line({ start: [AXIS_X, ZERO_Y, 0], end: [AXIS_R, ZERO_Y, 0], color: C.ink, strokeWidth: 2.2 });
    parts.push(yAxis, zeroLine);
    for (const d of [-4, -3, -2, 0, 2, 4]) {
      const y = ZERO_Y + d * UNIT;
      const g = new M.Line({ start: [AXIS_X, y, -0.01], end: [AXIS_R, y, -0.01], color: C.line, strokeWidth: 1 });
      g.setStrokeOpacity(0.5);
      const t = T(d > 0 ? `+${d}` : String(d), P ? 15 : 14, d === 0 ? C.ink : C.muted, true);
      t.moveTo([AXIS_X - 0.30, y, 0]);
      parts.push(g, t);
    }
    const zeroTag = T('0 = mean', P ? 15 : 14, C.muted, true);
    zeroTag.moveTo([AXIS_R - 0.7, BASE + 10 * UNIT + 0.22, 0]);
    parts.push(zeroTag);
    SHORT.forEach((name, k) => {
      const t = T(name, P ? 15 : 14, attrCol(k), true);
      t.moveTo([colx(k), BASE - (P ? 0.34 : 0.28), 0]);
      parts.push(t);
    });
    const g1 = T('first 6 · floral', P ? 15 : 15, C.cyan);
    g1.moveTo([(colx(0) + colx(5)) / 2, BASE - (P ? 0.78 : 0.62), 0]);
    const g2 = T('last 6 · roast', P ? 15 : 15, C.amber);
    g2.moveTo([(colx(6) + colx(11)) / 2, BASE - (P ? 0.78 : 0.62), 0]);
    parts.push(g1, g2);
    return new M.VGroup(...parts);
  }

  // ===== 0-3: Eight teas, saving 2 scores instead of 12 =====
  const rowStep = P ? 0.8 : 0.48;
  const rowTop = P ? 0.95 : 1.18;
  const rowY = r => rowTop - r * rowStep;
  const badgeX = P ? -3.35 : -6.10;
  const cellStart = P ? -2.65 : -5.30;
  const cellSp = P ? 0.51 : 0.58;
  const cellW = P ? 0.41 : 0.46;
  const cellH = P ? 0.52 : 0.32;

  const teaBadges = [];
  const teaStrips = [];
  const teaPairBoxes = [];
  TEAS.forEach(([letter, scores, pairText], r) => {
    const y = rowY(r);
    const bg = new M.RoundedRectangle({ width: P ? 0.56 : 0.52, height: cellH + 0.04, cornerRadius: 0.1, color: letter === 'A' ? C.cyan : C.muted, strokeWidth: 2 });
    bg.setFill(C.card, 0.95); bg.moveTo([badgeX, y, 0]);
    const lt = T(letter, P ? 18 : 17, letter === 'A' ? C.cyan : C.ink, true, true);
    lt.moveTo([badgeX, y, 0]);
    teaBadges.push(new M.VGroup(bg, lt));

    const cells = scores.map((val, k) => {
      const x = cellStart + k * cellSp + (k >= 6 ? (P ? 0.14 : 0.22) : 0);
      const col = attrCol(k);
      const rect = new M.Rectangle({ width: cellW, height: cellH, color: col, strokeWidth: 1.2 });
      rect.setFill(col, 0.20 + 0.075 * val);
      rect.moveTo([x, y, 0]);
      const num = T(String(val), P ? 15 : 13, C.ink, true);
      num.moveTo([x, y, 0]);
      return new M.VGroup(rect, num);
    });
    teaStrips.push(new M.VGroup(...cells));

    const pbox = new M.RoundedRectangle({ width: P ? 3.5 : 3.2, height: cellH + 0.04, cornerRadius: 0.12, color: letter === 'A' ? C.amber : C.violet, strokeWidth: 1.8 });
    pbox.setFill(C.card, 0.95); pbox.moveTo([P ? -1.0 : -3.75, y, 0]);
    const pt = T(pairText, P ? 16 : 16, letter === 'A' ? C.amber : C.ink, true);
    pt.moveTo([P ? -1.0 : -3.75, y, 0]);
    teaPairBoxes.push(new M.VGroup(pbox, pt));
  });

  await until(S(0));
  await play(
    new M.LaggedStart(teaBadges.map((b, r) => new M.FadeIn(new M.VGroup(b, teaStrips[r]))), { lagRatio: 0.1, runTime: 1.6 }),
    ...say('8 TEAS · 12 SCORES EACH', C.cyan),
    ...fbox(['8 teas × 12 scores', ['= 96 numbers saved', C.cyan]])
  );

  await until(S(1));
  await play(
    new M.LaggedStart(teaStrips.map(st => new M.FadeOut(st)), { lagRatio: 0.05, runTime: 0.9 }),
    new M.LaggedStart(teaPairBoxes.map(pb => new M.FadeIn(pb)), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('SAVE ONLY 2 COMPONENT SCORES', C.amber),
    ...fbox(['8 teas × 2 PC scores', ['= 16 numbers saved', C.amber]], C.amber)
  );

  // Sentence 2: focus on tea A, ask for the 12 original scores back
  const qSlots = Array.from({ length: 12 }, (_, k) => {
    const x = colx(k);
    const y = P ? -1.55 : -0.70;
    const r = new M.RoundedRectangle({ width: BW, height: P ? 0.85 : 0.72, cornerRadius: 0.08, color: attrCol(k), strokeWidth: 1.8 });
    r.setFill(C.card, 0.5); r.moveTo([x, y, 0]);
    const q = T('?', P ? 20 : 20, C.muted, true, true);
    q.moveTo([x, y, 0]);
    return new M.VGroup(r, q);
  });
  const aCard = new M.RoundedRectangle({ width: P ? 4.8 : 4.6, height: 0.72, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.2 });
  aCard.setFill(C.card, 0.95); aCard.moveTo([CX, P ? 0.30 : 0.65, 0]);
  const aCardTxt = T('Tea A:  PC1 -7.35,  PC2 -4.90', P ? 17 : 18, C.amber, true);
  aCardTxt.moveTo([CX, P ? 0.30 : 0.65, 0]);
  const aCardGrp = new M.VGroup(aCard, aCardTxt);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...teaBadges, ...teaPairBoxes), { runTime: 0.6 }),
    new M.FadeIn(aCardGrp, { runTime: 0.6 }),
    new M.LaggedStart(qSlots.map(q => new M.FadeIn(q)), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('WANT THE 12 ORIGINAL SCORES BACK?', C.violet),
    ...fbox(['Saved: 2 PC scores', ['Asked: 12 tasting scores', C.violet]], C.violet)
  );

  const downArrow = new M.Arrow({ start: [CX, P ? -0.15 : 0.22, 0], end: [CX, P ? -1.00 : -0.24, 0], color: C.amber, strokeWidth: 3 });
  await until(S(3));
  await play(
    new M.Create(downArrow, { runTime: 0.7 }),
    new M.LaggedStart(qSlots.map(q => new M.Indicate(q, { color: C.amber })), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('REBUILD 12 SCORES FROM 2 NUMBERS?', C.amber)
  );

  // ===== 4-7: Original tasting scores for Tea A as 12 glowing bars =====
  let scoreAxes = makeScoreAxes();
  const teaTagBg = new M.RoundedRectangle({ width: 1.35, height: 0.44, cornerRadius: 0.12, color: C.cyan, strokeWidth: 1.8 });
  teaTagBg.setFill(C.card, 0.95); teaTagBg.moveTo([AXIS_X + 0.9, BASE + 9.2 * UNIT, 0]);
  const teaTagTx = T('TEA A', 16, C.cyan, true, true);
  teaTagTx.moveTo([AXIS_X + 0.9, BASE + 9.2 * UNIT, 0]);
  const teaTag = new M.VGroup(teaTagBg, teaTagTx);

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(aCardGrp, downArrow, ...qSlots), { runTime: 0.55 }),
    new M.FadeIn(scoreAxes, { runTime: 0.7 }),
    new M.FadeIn(teaTag, { runTime: 0.7 }),
    ...say('TEA A: ORIGINAL 12 SCORES', C.cyan),
    ...fbox(['Tea A (original)', '12 tasting scores'])
  );

  const origNumLabels = TEA_A.map((val, k) => {
    const t = T(String(val), P ? 17 : 18, attrCol(k), true, true);
    t.moveTo([colx(k), BASE + val * UNIT + 0.26, 0]);
    return t;
  });
  await until(S(5));
  await play(
    new M.LaggedStart(origNumLabels.slice(0, 6).map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.8 }),
    ...say('FIRST 6: 1, 3, 2, 2, 2, 2', C.cyan),
    ...fbox(['Tea A (original)', ['first 6: 1,3,2,2,2,2', C.cyan]])
  );

  await until(S(6));
  await play(
    new M.LaggedStart(origNumLabels.slice(6, 12).map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 0.9 }),
    ...say('LAST 6: ALL 3', C.amber),
    ...fbox(['Tea A (original)', ['first 6: 1,3,2,2,2,2', C.cyan], ['last  6: 3,3,3,3,3,3', C.amber]])
  );

  const origBars = TEA_A.map((val, k) => scoreBar(k, 0.05));
  await until(S(7));
  await play(
    new M.LaggedStart(origBars.map((b, k) => new M.Transform(b, scoreBar(k, TEA_A[k]), { runTime: 0.65 })), { lagRatio: 0.06, runTime: 1.8 }),
    ...say('12 GLOWING BARS · TEA A', C.cyan)
  );

  // ===== 8-12: Place Tea A on the 2D PC1-PC2 map =====
  const MC = [CX, P ? -2.2 : -0.45, 0];
  const MW = P ? 6.2 : 6.8;
  const MH = P ? 5.6 : 2.9;
  const m2p = (x, y) => [MC[0] + (x / 10) * (MW / 2), MC[1] + (y / 7) * (MH / 2), 0];

  const mapFrame = new M.RoundedRectangle({ width: MW + 0.35, height: MH + 0.35, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
  mapFrame.setFill(C.card, 0.55); mapFrame.moveTo(MC);
  const pc1Axis = new M.Line({ start: [MC[0] - MW / 2, MC[1], 0], end: [MC[0] + MW / 2, MC[1], 0], color: C.muted, strokeWidth: 2 });
  const pc2Axis = new M.Line({ start: [MC[0], MC[1] - MH / 2, 0], end: [MC[0], MC[1] + MH / 2, 0], color: C.muted, strokeWidth: 2 });
  const pc1Lab = T('PC1', P ? 15 : 16, C.cyan, true);
  pc1Lab.moveTo([MC[0] + MW / 2 - 0.32, MC[1] + 0.24, 0]);
  const pc2Lab = T('PC2', P ? 15 : 16, C.amber, true);
  pc2Lab.moveTo([MC[0] + 0.40, MC[1] + MH / 2 - 0.16, 0]);

  const otherClusters = [
    [-7.35, 4.90, 'C, D'],
    [7.35, -4.90, 'E, F'],
    [7.35, 4.90, 'G, H'],
  ];
  const otherDots = otherClusters.map(([x, y, lab]) => {
    const p = m2p(x, y);
    const d = new M.Dot({ point: p, radius: 0.11, color: C.muted });
    d.setFill(C.muted, 0.75);
    const t = T(lab, P ? 15 : 15, C.muted, true);
    t.moveTo([p[0], p[1] + 0.30, 0]);
    return new M.VGroup(d, t);
  });
  const pA = m2p(-7.35, -4.90);
  const bSub = T('B', P ? 15 : 15, C.muted, true);
  bSub.moveTo([pA[0] + 0.34, pA[1] - 0.24, 0]);
  const aHalo = new M.Dot({ point: pA, radius: 0.30, color: C.cyan });
  aHalo.setFill(C.cyan, 0.22);
  const aDot = new M.Dot({ point: pA, radius: 0.14, color: C.cyan });
  const aLab = T('A', P ? 18 : 19, C.cyan, true, true);
  aLab.moveTo([pA[0] - 0.32, pA[1] + 0.28, 0]);
  const mapBase = new M.VGroup(mapFrame, pc1Axis, pc2Axis, pc1Lab, pc2Lab, ...otherDots, bSub);
  const aPointGrp = new M.VGroup(aHalo, aDot, aLab);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(scoreAxes, teaTag, ...origBars, ...origNumLabels), { runTime: 0.6 }),
    new M.FadeIn(mapBase, { runTime: 0.7 }),
    new M.FadeIn(aPointGrp, { runTime: 0.8 }),
    new M.Flash(aDot, { color: C.cyan, runTime: 0.7 }),
    ...say('TEA A ON THE 2D PC MAP', C.violet),
    ...fbox(['Tea A on PC map', '2 principal components'], C.violet)
  );

  const dropX = new M.DashedLine({ start: pA, end: m2p(-7.35, 0), color: C.cyan, strokeWidth: 2.2 });
  const lblX = T('-7.35', P ? 16 : 17, C.cyan, true, true);
  lblX.moveTo([pA[0], MC[1] + 0.28, 0]);
  await until(S(9));
  await play(
    new M.Create(dropX, { runTime: 0.8 }),
    new M.FadeIn(lblX, { runTime: 0.6 }),
    ...say('PC1 SCORE ≈ −7.35', C.cyan),
    ...fbox(['Tea A on PC map', ['PC1 ≈ -7.35', C.cyan]], C.cyan)
  );

  const dropY = new M.DashedLine({ start: pA, end: m2p(0, -4.90), color: C.amber, strokeWidth: 2.2 });
  const lblY = T('-4.90', P ? 16 : 17, C.amber, true, true);
  lblY.moveTo([MC[0] + 0.56, pA[1], 0]);
  await until(S(10));
  await play(
    new M.Create(dropY, { runTime: 0.8 }),
    new M.FadeIn(lblY, { runTime: 0.6 }),
    ...say('PC2 SCORE ≈ −4.90', C.amber),
    ...fbox(['Tea A on PC map', ['PC1 ≈ -7.35', C.cyan], ['PC2 ≈ -4.90', C.amber]], C.amber)
  );

  const aRing = new M.Circle({ radius: 0.36, color: C.amber, strokeWidth: 2.6 });
  aRing.setFill(C.amber, 0.08); aRing.moveTo(pA);
  await until(S(11));
  await play(
    new M.Create(aRing, { runTime: 0.7 }),
    new M.Indicate(aPointGrp, { color: C.amber, runTime: 0.9 }),
    ...say('KEEP ONLY THIS ONE POINT', C.violet)
  );

  const coordTagBg = new M.RoundedRectangle({ width: P ? 4.6 : 4.4, height: 0.62, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 });
  coordTagBg.setFill(C.card, 0.95); coordTagBg.moveTo([CX, P ? 0.55 : 0.85, 0]);
  const coordTagTx = T('A:  (-7.35,  -4.90)', P ? 18 : 19, C.ink, true, true);
  coordTagTx.moveTo([CX, P ? 0.55 : 0.85, 0]);
  const coordTag = new M.VGroup(coordTagBg, coordTagTx);
  const ghostSlots = Array.from({ length: 12 }, (_, k) => {
    const r = new M.Rectangle({ width: BW, height: P ? 1.4 : 1.0, color: attrCol(k), strokeWidth: 1.5 });
    r.setFill(attrCol(k), 0.08);
    r.moveTo([colx(k), P ? -1.45 : -0.75, 0]);
    return r;
  });

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(mapBase, aPointGrp, dropX, lblX, dropY, lblY, aRing), { runTime: 0.6 }),
    new M.FadeIn(coordTag, { runTime: 0.6 }),
    new M.LaggedStart(ghostSlots.map(g => new M.FadeIn(g)), { lagRatio: 0.04, runTime: 1.0 }),
    ...say('REBUILD 12 BARS FROM THIS POINT', C.amber)
  );

  // ===== 13-16: Two principal components as two patterns =====
  const p1Y = P ? -0.9 : 0.35;
  const p2Y = P ? -3.8 : -1.45;
  const pH = P ? 1.05 : 0.62;
  const p1Title = T('Pattern 1  (PC1)', P ? 16 : 16, C.cyan, true, true);
  p1Title.moveTo([CX - (P ? 1.5 : 2.1), p1Y + pH / 2 + 0.30, 0]);
  const p2Title = T('Pattern 2  (PC2)', P ? 16 : 16, C.amber, true, true);
  p2Title.moveTo([CX - (P ? 1.5 : 2.1), p2Y + pH / 2 + 0.30, 0]);

  const p1Bars = Array.from({ length: 12 }, (_, k) => {
    const active = k < 6;
    const b = new M.Rectangle({ width: BW, height: active ? pH : 0.08, color: active ? C.cyan : C.muted, strokeWidth: 1.6 });
    b.setFill(active ? C.cyan : C.muted, active ? 0.78 : 0.4);
    b.moveTo([colx(k), p1Y, 0]);
    return b;
  });
  const p2Bars = Array.from({ length: 12 }, (_, k) => {
    const active = k >= 6;
    const b = new M.Rectangle({ width: BW, height: active ? pH : 0.08, color: active ? C.amber : C.muted, strokeWidth: 1.6 });
    b.setFill(active ? C.amber : C.muted, active ? 0.78 : 0.4);
    b.moveTo([colx(k), p2Y, 0]);
    return b;
  });

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(coordTag, ...ghostSlots), { runTime: 0.55 }),
    new M.FadeIn(new M.VGroup(p1Title, p2Title), { runTime: 0.6 }),
    new M.LaggedStart([...p1Bars, ...p2Bars].map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 1.0 }),
    ...say('TWO PATTERNS WE CAN COMBINE', C.violet),
    ...fbox(['2 patterns', ['PC1: first 6 together', C.cyan], ['PC2: last  6 together', C.amber]], C.violet)
  );

  const p1Box = new M.RoundedRectangle({ width: colx(5) - colx(0) + BW + 0.24, height: pH + 0.28, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.2 });
  p1Box.setFill(C.cyan, 0.06); p1Box.moveTo([(colx(0) + colx(5)) / 2, p1Y, 0]);
  await until(S(14));
  await play(
    new M.Create(p1Box, { runTime: 0.6 }),
    new M.LaggedStart(p1Bars.slice(0, 6).map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.0 }),
    ...say('PATTERN 1 → FIRST 6 BARS', C.cyan)
  );

  const p2Box = new M.RoundedRectangle({ width: colx(11) - colx(6) + BW + 0.24, height: pH + 0.28, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.2 });
  p2Box.setFill(C.amber, 0.06); p2Box.moveTo([(colx(6) + colx(11)) / 2, p2Y, 0]);
  await until(S(15));
  await play(
    new M.Create(p2Box, { runTime: 0.6 }),
    new M.LaggedStart(p2Bars.slice(6, 12).map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.06, runTime: 1.0 }),
    ...say('PATTERN 2 → LAST 6 BARS', C.amber)
  );

  const p1Amt = T('× (-7.35)', P ? 17 : 18, C.cyan, true, true);
  p1Amt.moveTo([colx(8.5), p1Y + pH / 2 + 0.30, 0]);
  const p2Amt = T('× (-4.90)', P ? 17 : 18, C.amber, true, true);
  p2Amt.moveTo([colx(8.5), p2Y + pH / 2 + 0.30, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(new M.VGroup(p1Amt, p2Amt), { runTime: 0.7 }),
    ...say('SCORES = HOW MUCH OF EACH PATTERN', C.green),
    ...fbox(['How much of each?', ['(-7.35) × Pattern 1', C.cyan], ['(-4.90) × Pattern 2', C.amber]], C.green)
  );

  // ===== 17-26: Centered bars & PC1 contribution =====
  const centeredAxes = makeCenteredAxes();
  const cBars = Array.from({ length: 12 }, (_, k) => devBar(k, 0, attrCol(k)));
  const cValLabels = Array.from({ length: 12 }, (_, k) => {
    const t = T('0', P ? 15 : 16, C.muted, true);
    t.moveTo([colx(k), ZERO_Y + 0.26, 0]);
    return t;
  });

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(p1Title, p2Title, ...p1Bars, ...p2Bars, p1Box, p2Box, p1Amt, p2Amt), { runTime: 0.55 }),
    new M.FadeIn(centeredAxes, { runTime: 0.7 }),
    new M.LaggedStart(cBars.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...cValLabels), { runTime: 0.7 }),
    ...say('12 EMPTY BARS: CHANGES FROM MEAN', C.muted),
    ...fbox(['Changes from mean', 'all 12 start at 0'])
  );

  await until(S(18));
  await play(
    ...say('LOADING = ATTRIBUTE WEIGHT IN A PC', C.cyan),
    ...fbox(['Loading', 'how much an attribute', 'contributes to a PC'])
  );

  const loadY = ZERO_Y + (P ? 1.25 : 0.92);
  const pc1LoadHead = T('PC1 loadings:', P ? 15 : 15, C.cyan, true);
  pc1LoadHead.moveTo([colx(1.6), loadY + 0.34, 0]);
  const pc1LoadsFirst = Array.from({ length: 6 }, (_, k) => {
    const t = T('.41', P ? 15 : 14, C.cyan, true, true);
    t.moveTo([colx(k), loadY, 0]);
    return t;
  });
  await until(S(19));
  await play(
    new M.FadeIn(pc1LoadHead, { runTime: 0.5 }),
    new M.LaggedStart(pc1LoadsFirst.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('PC1 FIRST 6 LOADINGS ≈ 0.4082', C.cyan),
    ...fbox(['PC1 loadings', ['first 6 ≈ 0.4082', C.cyan], ['        = 1 / √6', C.muted]])
  );

  const pc1LoadsLast = Array.from({ length: 6 }, (_, k) => {
    const t = T('0', P ? 15 : 15, C.muted, true);
    t.moveTo([colx(6 + k), loadY, 0]);
    return t;
  });
  await until(S(20));
  await play(
    new M.LaggedStart(pc1LoadsLast.map(t => new M.FadeIn(t)), { lagRatio: 0.06, runTime: 0.7 }),
    ...say('PC1 LAST 6 LOADINGS = 0', C.muted),
    ...fbox(['PC1 loadings', ['first 6 ≈ 0.4082', C.cyan], ['last  6 = 0', C.muted]])
  );

  const hiBox0 = new M.RoundedRectangle({ width: BW + 0.16, height: 3.6 * UNIT, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  hiBox0.setFill(C.cyan, 0.05); hiBox0.moveTo([colx(0), ZERO_Y - 1.5 * UNIT, 0]);
  await until(S(21));
  await play(
    new M.Create(hiBox0, { runTime: 0.6 }),
    ...say('PC1 SCORE × FLORAL LOADING', C.cyan),
    ...fbox(['Floral (attr 1)', 'PC1 score × loading', ['(-7.35) × 0.4082', C.cyan]])
  );

  await until(S(22));
  await play(
    ...say('EXACT RESULT = −3', C.cyan),
    ...fbox(['Floral (attr 1)', '(-3√6) × (1 / √6)', ['= -3', C.cyan]])
  );

  const lblM3_0 = T('-3', P ? 15 : 16, C.cyan, true, true);
  lblM3_0.moveTo([colx(0), ZERO_Y - 3 * UNIT - 0.28, 0]);
  await until(S(23));
  await play(
    new M.Transform(cBars[0], devBar(0, -3, C.cyan), { runTime: 0.9 }),
    new M.FadeOut(cValLabels[0], { runTime: 0.4 }),
    new M.FadeIn(lblM3_0, { runTime: 0.6 }),
    ...say('FIRST BAR: 3 STEPS BELOW ZERO', C.cyan)
  );
  cValLabels[0] = lblM3_0;

  const nextFiveLbls = [1, 2, 3, 4, 5].map(k => {
    const t = T('-3', P ? 15 : 16, C.cyan, true, true);
    t.moveTo([colx(k), ZERO_Y - 3 * UNIT - 0.28, 0]);
    return t;
  });
  await until(S(24));
  await play(
    new M.FadeOut(hiBox0, { runTime: 0.4 }),
    new M.LaggedStart([1, 2, 3, 4, 5].map(k => new M.Transform(cBars[k], devBar(k, -3, C.cyan), { runTime: 0.65 })), { lagRatio: 0.16, runTime: 1.6 }),
    new M.FadeOut(new M.VGroup(...cValLabels.slice(1, 6)), { runTime: 0.4 }),
    new M.LaggedStart(nextFiveLbls.map(t => new M.FadeIn(t)), { lagRatio: 0.16, runTime: 1.4 }),
    ...say('SAME LOADING FOR NEXT 5 ATTRIBUTES', C.cyan),
    ...fbox(['Attributes 2 to 6', 'same loading: 1 / √6', ['each gets -3', C.cyan]])
  );
  for (let i = 0; i < 5; i++) cValLabels[1 + i] = nextFiveLbls[i];

  const m3Line = new M.DashedLine({ start: [colx(0) - BW / 2 - 0.1, ZERO_Y - 3 * UNIT, 0], end: [colx(5) + BW / 2 + 0.1, ZERO_Y - 3 * UNIT, 0], color: C.cyan, strokeWidth: 2 });
  await until(S(25));
  await play(
    new M.Create(m3Line, { runTime: 0.6 }),
    new M.LaggedStart(cBars.slice(0, 6).map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.0 }),
    ...say('ALL 6 BARS REACH −3', C.cyan)
  );

  await until(S(26));
  await play(
    new M.LaggedStart(pc1LoadsLast.map(t => new M.Indicate(t, { color: C.muted })), { lagRatio: 0.07, runTime: 1.1 }),
    ...say('LAST 6 STAY AT 0 (LOADING = 0)', C.muted),
    ...fbox(['Last 6 attributes', '(-7.35) × 0 = 0', ['bars stay at 0', C.muted]], C.muted)
  );

  // ===== 27-34: Bring in PC2 =====
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(pc1LoadHead, ...pc1LoadsFirst, ...pc1LoadsLast, m3Line), { runTime: 0.55 }),
    ...say('NOW BRING IN PC2 (SCORE ≈ −4.90)', C.amber),
    ...fbox(['Second component (PC2)', ['PC2 score ≈ -4.90', C.amber]], C.amber)
  );

  const pc2LoadHead = T('PC2 loadings:', P ? 15 : 15, C.amber, true);
  pc2LoadHead.moveTo([colx(7.6), loadY + 0.34, 0]);
  const pc2LoadsFirst = Array.from({ length: 6 }, (_, k) => {
    const t = T('0', P ? 15 : 15, C.muted, true);
    t.moveTo([colx(k), loadY, 0]);
    return t;
  });
  await until(S(28));
  await play(
    new M.FadeIn(pc2LoadHead, { runTime: 0.5 }),
    new M.LaggedStart(pc2LoadsFirst.map(t => new M.FadeIn(t)), { lagRatio: 0.06, runTime: 0.9 }),
    ...say('PC2 FIRST 6 LOADINGS = 0', C.muted),
    ...fbox(['PC2 loadings', ['first 6 = 0 (no change)', C.muted]], C.amber)
  );

  const pc2LoadsLast = Array.from({ length: 6 }, (_, k) => {
    const t = T('.41', P ? 15 : 14, C.amber, true, true);
    t.moveTo([colx(6 + k), loadY, 0]);
    return t;
  });
  await until(S(29));
  await play(
    new M.LaggedStart(pc2LoadsLast.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('PC2 LAST 6 LOADINGS ≈ 0.4082', C.amber),
    ...fbox(['PC2 loadings', ['first 6 = 0', C.muted], ['last  6 ≈ 0.4082 (1/√6)', C.amber]], C.amber)
  );

  const hiBox6 = new M.RoundedRectangle({ width: BW + 0.16, height: 2.6 * UNIT, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 });
  hiBox6.setFill(C.amber, 0.05); hiBox6.moveTo([colx(6), ZERO_Y - 1.0 * UNIT, 0]);
  await until(S(30));
  await play(
    new M.Create(hiBox6, { runTime: 0.6 }),
    ...say('PC2 SCORE × LOADING', C.amber),
    ...fbox(['Roast (attr 7)', 'PC2 score × loading', ['(-4.90) × 0.4082', C.amber]], C.amber)
  );

  await until(S(31));
  await play(
    ...say('EXACT RESULT = −2', C.amber),
    ...fbox(['Roast (attr 7)', '(-2√6) × (1 / √6)', ['= -2', C.amber]], C.amber)
  );

  const lastSixLbls = [6, 7, 8, 9, 10, 11].map(k => {
    const t = T('-2', P ? 15 : 16, C.amber, true, true);
    t.moveTo([colx(k), ZERO_Y - 2 * UNIT - 0.28, 0]);
    return t;
  });
  await until(S(32));
  await play(
    new M.FadeOut(hiBox6, { runTime: 0.4 }),
    new M.LaggedStart([6, 7, 8, 9, 10, 11].map(k => new M.Transform(cBars[k], devBar(k, -2, C.amber), { runTime: 0.65 })), { lagRatio: 0.12, runTime: 1.5 }),
    new M.FadeOut(new M.VGroup(...cValLabels.slice(6, 12)), { runTime: 0.4 }),
    new M.LaggedStart(lastSixLbls.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('LAST 6 BARS DROP TO −2', C.amber)
  );
  for (let i = 0; i < 6; i++) cValLabels[6 + i] = lastSixLbls[i];

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(pc2LoadHead, ...pc2LoadsFirst, ...pc2LoadsLast), { runTime: 0.55 }),
    ...say('6 BARS AT −3, 6 BARS AT −2', C.violet),
    ...fbox(['Centered rebuild', ['first 6: -3', C.cyan], ['last  6: -2', C.amber]], C.violet)
  );

  const meanHighlight = new M.Line({ start: [AXIS_X, ZERO_Y, 0], end: [AXIS_R, ZERO_Y, 0], color: C.violet, strokeWidth: 3.5 });
  await until(S(34));
  await play(
    new M.Create(meanHighlight, { runTime: 0.7 }),
    new M.Indicate(meanHighlight, { color: C.violet, runTime: 0.9 }),
    ...say('CHANGES FROM MEAN, NOT SCORES YET', C.violet)
  );

  // ===== 35-40: Add the mean of 5 to every bar =====
  scoreAxes = makeScoreAxes();
  const meanLine = new M.DashedLine({ start: [AXIS_X, ZERO_Y, 0], end: [AXIS_R, ZERO_Y, 0], color: C.green, strokeWidth: 2 });
  const meanTag = T('mean = 5', P ? 15 : 15, C.green, true, true);
  meanTag.moveTo([AXIS_R - 0.62, ZERO_Y + 0.24, 0]);

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(centeredAxes, meanHighlight), { runTime: 0.55 }),
    new M.FadeIn(scoreAxes, { runTime: 0.7 }),
    new M.Create(meanLine, { runTime: 0.7 }),
    new M.FadeIn(meanTag, { runTime: 0.6 }),
    ...say('ADD MEAN (+5) TO EVERY BAR', C.green),
    ...fbox(['Return to tasting scores', ['score = change + 5', C.green]], C.green)
  );

  const rebLblsFirst = [0, 1, 2, 3, 4, 5].map(k => {
    const t = T('2', P ? 16 : 17, C.cyan, true, true);
    t.moveTo([colx(k), BASE + 2 * UNIT + 0.26, 0]);
    return t;
  });
  await until(S(36));
  await play(
    new M.LaggedStart([0, 1, 2, 3, 4, 5].map(k => new M.Transform(cBars[k], scoreBar(k, 2, C.cyan), { runTime: 0.7 })), { lagRatio: 0.08, runTime: 1.3 }),
    new M.FadeOut(new M.VGroup(...cValLabels.slice(0, 6)), { runTime: 0.4 }),
    new M.LaggedStart(rebLblsFirst.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('−3 + 5 = 2', C.cyan),
    ...fbox(['Add mean (+5)', ['-3 + 5 = 2  (first 6)', C.cyan]], C.cyan)
  );
  for (let i = 0; i < 6; i++) cValLabels[i] = rebLblsFirst[i];

  const rebLblsLast = [6, 7, 8, 9, 10, 11].map(k => {
    const t = T('3', P ? 16 : 17, C.amber, true, true);
    t.moveTo([colx(k), BASE + 3 * UNIT + 0.26, 0]);
    return t;
  });
  await until(S(37));
  await play(
    new M.LaggedStart([6, 7, 8, 9, 10, 11].map(k => new M.Transform(cBars[k], scoreBar(k, 3, C.amber), { runTime: 0.7 })), { lagRatio: 0.08, runTime: 1.3 }),
    new M.FadeOut(new M.VGroup(...cValLabels.slice(6, 12)), { runTime: 0.4 }),
    new M.LaggedStart(rebLblsLast.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('−2 + 5 = 3', C.amber),
    ...fbox(['Add mean (+5)', ['-3 + 5 = 2  (first 6)', C.cyan], ['-2 + 5 = 3  (last 6)', C.amber]], C.amber)
  );
  for (let i = 0; i < 6; i++) cValLabels[6 + i] = rebLblsLast[i];

  await until(S(38));
  await play(
    new M.LaggedStart(cBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('REBUILT: SIX 2s AND SIX 3s', C.green),
    ...fbox(['Rebuilt Tea A (2 PCs)', ['first 6: 2,2,2,2,2,2', C.cyan], ['last  6: 3,3,3,3,3,3', C.amber]], C.green)
  );

  await until(S(39));
  await play(
    ...say('LOW-RANK RECONSTRUCTION', C.green),
    ...fbox(['Low-rank reconstruction', ['2 PCs → 12 rebuilt scores', C.green]], C.green)
  );

  await until(S(40));
  await play(
    ...say('LOW RANK = FEWER DIRECTIONS (2 < 12)', C.violet),
    ...fbox(['Low rank', ['2 directions kept', C.violet], 'out of 12 attributes'], C.violet)
  );

  // ===== 41-48: Compare original (filled) beside rebuilt (outlined) & measure error =====
  const origCompBars = TEA_A.map((val, k) => scoreBar(k, val, attrCol(k), { x: colx(k) - POFF, w: PW, fillOp: 0.88, strokeW: 1.4 }));
  const legOrigSq = new M.Rectangle({ width: 0.20, height: 0.20, color: C.cyan, strokeWidth: 1.5 });
  legOrigSq.setFill(C.cyan, 0.88); legOrigSq.moveTo([AXIS_X + 0.55, BASE + 9.2 * UNIT, 0]);
  const legOrigTx = T('original', P ? 15 : 15, C.ink);
  legOrigTx.moveTo([AXIS_X + 1.32, BASE + 9.2 * UNIT, 0]);
  const legRebSq = new M.Rectangle({ width: 0.20, height: 0.20, color: C.cyan, strokeWidth: 2.2 });
  legRebSq.setFill(C.cyan, 0.14); legRebSq.moveTo([AXIS_X + 2.45, BASE + 9.2 * UNIT, 0]);
  const legRebTx = T('rebuilt (outlined)', P ? 15 : 15, C.ink);
  legRebTx.moveTo([AXIS_X + 3.68, BASE + 9.2 * UNIT, 0]);
  const legendGrp = new M.VGroup(legOrigSq, legOrigTx, legRebSq, legRebTx);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...cValLabels, meanLine, meanTag), { runTime: 0.45 }),
    new M.LaggedStart(cBars.map((b, k) => new M.Transform(b, scoreBar(k, REBUILT2[k], attrCol(k), { x: colx(k) + POFF, w: PW, fillOp: 0.14, strokeW: 2.4 }), { runTime: 0.8 })), { lagRatio: 0.04, runTime: 1.2 }),
    new M.LaggedStart(origCompBars.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 1.2 }),
    new M.FadeIn(legendGrp, { runTime: 0.7 }),
    ...say('COMPARE: ORIGINAL VS REBUILT', C.cyan),
    ...fbox(['Compare Tea A', 'filled   = original', 'outlined = rebuilt'])
  );

  const matchTicks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => {
    const t = T('✓', P ? 16 : 17, C.green, true, true);
    t.moveTo([colx(k), BASE + TEA_A[k] * UNIT + 0.32, 0]);
    return t;
  });
  await until(S(42));
  await play(
    new M.LaggedStart(matchTicks.map(t => new M.FadeIn(t)), { lagRatio: 0.06, runTime: 1.2 }),
    ...say('10 OF 12 MATCH EXACTLY', C.green),
    ...fbox(['Exact matches', ['10 of 12 match', C.green], 'Ro..Fr = 2, Rs..Sm = 3'], C.green)
  );

  // Floral mismatch (orig 1, rebuilt 2)
  const flGap = new M.Line({ start: [colx(0) - POFF, BASE + 1 * UNIT, 0], end: [colx(0) - POFF, BASE + 2 * UNIT, 0], color: C.pink, strokeWidth: 4 });
  const flLab = T('1 vs 2', P ? 15 : 14, C.pink, true, true);
  flLab.moveTo([colx(0), BASE + 2 * UNIT + 0.34, 0]);
  await until(S(43));
  await play(
    new M.Transform(cBars[0], scoreBar(0, 2, C.pink, { x: colx(0) + POFF, w: PW, fillOp: 0.16, strokeW: 2.8 }), { runTime: 0.7 }),
    new M.Create(flGap, { runTime: 0.6 }),
    new M.FadeIn(flLab, { runTime: 0.6 }),
    ...say('FLORAL: ORIGINAL 1, REBUILT 2', C.pink),
    ...fbox(['Floral mismatch', 'original = 1', ['rebuilt  = 2', C.pink]], C.pink)
  );

  // Jasmine mismatch (orig 3, rebuilt 2)
  const jaGap = new M.Line({ start: [colx(1) + POFF, BASE + 2 * UNIT, 0], end: [colx(1) + POFF, BASE + 3 * UNIT, 0], color: C.pink, strokeWidth: 4 });
  const jaLab = T('3 vs 2', P ? 15 : 14, C.pink, true, true);
  jaLab.moveTo([colx(1), BASE + 3 * UNIT + 0.34, 0]);
  await until(S(44));
  await play(
    new M.Transform(cBars[1], scoreBar(1, 2, C.pink, { x: colx(1) + POFF, w: PW, fillOp: 0.16, strokeW: 2.8 }), { runTime: 0.7 }),
    new M.Create(jaGap, { runTime: 0.6 }),
    new M.FadeIn(jaLab, { runTime: 0.6 }),
    ...say('JASMINE: ORIGINAL 3, REBUILT 2', C.pink),
    ...fbox(['Two mismatches', ['Floral:  1 vs 2', C.pink], ['Jasmine: 3 vs 2', C.pink]], C.pink)
  );

  const flDiff = T('-1', P ? 15 : 16, C.pink, true, true);
  flDiff.moveTo([colx(0), BASE + 2 * UNIT + 0.34, 0]);
  const jaDiff = T('+1', P ? 15 : 16, C.pink, true, true);
  jaDiff.moveTo([colx(1), BASE + 3 * UNIT + 0.34, 0]);
  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(flLab, jaLab), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(flDiff, jaDiff), { runTime: 0.6 }),
    new M.Indicate(flGap, { color: C.pink, runTime: 0.8 }),
    new M.Indicate(jaGap, { color: C.pink, runTime: 0.8 }),
    ...say('EACH DIFFERS BY 1', C.pink),
    ...fbox(['Differences', ['Floral:  1 - 2 = -1', C.pink], ['Jasmine: 3 - 2 = +1', C.pink]], C.pink)
  );

  await until(S(46));
  await play(
    ...say('SQUARE EACH DIFF, THEN ADD', C.pink),
    ...fbox(['Reconstruction error', '(-1)² = 1', '(+1)² = 1', ['sum = 1² + 1²', C.pink]], C.pink)
  );

  await until(S(47));
  await play(
    new M.Indicate(flDiff, { color: C.pink, runTime: 0.8 }),
    new M.Indicate(jaDiff, { color: C.pink, runTime: 0.8 }),
    ...say('SQUARED ERROR = 1 + 1 = 2', C.pink),
    ...fbox(['Squared error', '= (-1)² + (+1)²', ['= 1 + 1 = 2', C.pink]], C.pink)
  );

  // Sentence 48: Add PC3 -> exact rebuild!
  const flTick = T('✓', P ? 16 : 17, C.green, true, true);
  flTick.moveTo([colx(0), BASE + 1 * UNIT + 0.32, 0]);
  const jaTick = T('✓', P ? 16 : 17, C.green, true, true);
  jaTick.moveTo([colx(1), BASE + 3 * UNIT + 0.32, 0]);
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(flGap, jaGap, flDiff, jaDiff), { runTime: 0.45 }),
    new M.Transform(cBars[0], scoreBar(0, 1, C.cyan, { x: colx(0) + POFF, w: PW, fillOp: 0.14, strokeW: 2.4 }), { runTime: 0.9 }),
    new M.Transform(cBars[1], scoreBar(1, 3, C.cyan, { x: colx(1) + POFF, w: PW, fillOp: 0.14, strokeW: 2.4 }), { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(flTick, jaTick), { runTime: 0.7 }),
    ...say('KEEP PC3 → ALL 12 MATCH (ERROR = 0)', C.green),
    ...fbox(['Keep 3 PCs (add PC3)', 'Fl: 2 - 1 = 1  ✓', 'Ja: 2 + 1 = 3  ✓', ['squared error = 0', C.green]], C.green)
  );

  // ===== 49-54: Formula, meaning of retained, use, caution, recap =====
  await until(S(49));
  await play(
    ...say('THE RECONSTRUCTION FORMULA', C.cyan),
    ...fbox(['Low-rank reconstruction', 'in one short formula'], C.cyan)
  );

  await until(S(50));
  await play(
    ...say('MEAN + SUM(SCORE × LOADING)', C.amber),
    ...fbox([
      ['rebuilt = mean', C.ink],
      ['  + sum(score × loading)', C.amber],
      ['  for retained PCs', C.muted],
      ['e.g. 5 + (-3) + 0 = 2', C.cyan],
    ], C.amber)
  );

  await until(S(51));
  await play(
    ...say('RETAINED = COMPONENTS WE KEEP', C.violet),
    ...fbox([
      ['retained PCs = kept PCs', C.violet],
      'k = 2 → fast, error = 2',
      'k = 3 → exact, error = 0',
    ], C.violet)
  );

  // Return to 2-PC view to remind of approximate rebuild & caution
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(flTick, jaTick), { runTime: 0.4 }),
    new M.Transform(cBars[0], scoreBar(0, 2, C.cyan, { x: colx(0) + POFF, w: PW, fillOp: 0.14, strokeW: 2.4 }), { runTime: 0.7 }),
    new M.Transform(cBars[1], scoreBar(1, 2, C.cyan, { x: colx(1) + POFF, w: PW, fillOp: 0.14, strokeW: 2.4 }), { runTime: 0.7 }),
    ...say('STORE LESS · REBUILD APPROXIMATELY', C.green),
    ...fbox(['What it is for', ['store 2 scores per tea', C.cyan], ['rebuild 12 approx scores', C.green]], C.green)
  );

  const warnFl = new M.Line({ start: [colx(0) - POFF, BASE + 1 * UNIT, 0], end: [colx(0) - POFF, BASE + 2 * UNIT, 0], color: C.pink, strokeWidth: 4 });
  const warnJa = new M.Line({ start: [colx(1) + POFF, BASE + 2 * UNIT, 0], end: [colx(1) + POFF, BASE + 3 * UNIT, 0], color: C.pink, strokeWidth: 4 });
  await until(S(53));
  await play(
    new M.Transform(cBars[0], scoreBar(0, 2, C.pink, { x: colx(0) + POFF, w: PW, fillOp: 0.16, strokeW: 2.8 }), { runTime: 0.6 }),
    new M.Transform(cBars[1], scoreBar(1, 2, C.pink, { x: colx(1) + POFF, w: PW, fillOp: 0.16, strokeW: 2.8 }), { runTime: 0.6 }),
    new M.Create(warnFl, { runTime: 0.6 }),
    new M.Create(warnJa, { runTime: 0.6 }),
    ...say('CAREFUL: REBUILT = ESTIMATE', C.pink),
    ...fbox(['Be careful', ['rebuilt = estimate', C.pink], 'not always exact'], C.pink)
  );

  await until(S(54));
  await play(
    new M.LaggedStart(cBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.05, runTime: 1.5 }),
    ...say('SHARED PATTERNS REBUILD · SMALL DETAILS MAY FADE', C.amber),
    ...fbox([
      ['Remember', C.amber],
      'few patterns → many scores',
      ['small details may fade', C.pink],
    ], C.amber)
  );
}
