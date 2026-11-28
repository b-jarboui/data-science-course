// 14.3.9 Embedding distortion: when a map changes the truth.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Exact shared tasting scores from chapters/14.3.md (first 6 cyan, last 6 amber)
  const ATTRS = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rt', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const TEAS = {
    A: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    B: [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    C: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    D: [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
  };
  const attrCol = i => (i < 6 ? C.cyan : C.amber);

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.15;
  const PILL = P ? [0, 1.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.5, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box (one at a time, never overlaps data)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
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

  // Helper: caliper bracket between two x coordinates
  function caliper(x1, x2, y, tickDir, color, labelText, labelDy) {
    const main = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 3.5 });
    const t1 = new M.Line({ start: [x1, y, 0], end: [x1, y + tickDir * 0.22, 0], color, strokeWidth: 2.5 });
    const t2 = new M.Line({ start: [x2, y, 0], end: [x2, y + tickDir * 0.22, 0], color, strokeWidth: 2.5 });
    const parts = [main, t1, t2];
    if (labelText) {
      const t = T(labelText, P ? 18 : 19, color, true, true);
      t.moveTo([(x1 + x2) / 2, y + labelDy, 0]);
      parts.push(t);
    }
    return new M.VGroup(...parts);
  }

  // Helper: tea dot with glowing halo and letter
  function teaDot(pos, letter, color, labelDy = 0.42, r = 0.14) {
    const halo = new M.Dot({ point: pos, radius: r * 2.1, color });
    halo.setFill(color, 0.2);
    const core = new M.Dot({ point: pos, radius: r, color });
    const lab = T(letter, P ? 20 : 21, C.ink, true, true);
    lab.moveTo([pos[0], pos[1] + labelDy, 0]);
    return { g: new M.VGroup(halo, core, lab), core };
  }

  // ===========================================================================
  // ACT 1 (0-3): Customer looking at a tea flavor map
  // ===========================================================================
  const mapCY = P ? -1.75 : -0.55;
  const mapW = P ? 6.8 : 7.6, mapH = P ? 4.6 : 3.5;
  const mapCard = new M.RoundedRectangle({ width: mapW, height: mapH, cornerRadius: 0.22, color: C.line, strokeWidth: 2 });
  mapCard.setFill(C.card, 0.72);
  mapCard.moveTo([CX, mapCY, -0.01]);
  const mapGridLines = [];
  for (let i = -2; i <= 2; i++) {
    const gx = CX + i * (mapW / 6);
    const gl = new M.Line({ start: [gx, mapCY - mapH / 2 + 0.15, -0.005], end: [gx, mapCY + mapH / 2 - 0.15, -0.005], color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.35);
    mapGridLines.push(gl);
  }
  for (let j = -1; j <= 1; j++) {
    const gy = mapCY + j * (mapH / 4);
    const gl = new M.Line({ start: [CX - mapW / 2 + 0.15, gy, -0.005], end: [CX + mapW / 2 - 0.15, gy, -0.005], color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.35);
    mapGridLines.push(gl);
  }
  const mapTitle = T('Tea map (2D)', P ? 16 : 17, C.muted);
  mapTitle.moveTo([CX - mapW / 2 + 0.28 + mapTitle.getWidth() / 2, mapCY + mapH / 2 - 0.30, 0]);
  const introBase = new M.VGroup(mapCard, ...mapGridLines, mapTitle);

  const mp = {
    A: [CX - mapW * 0.34, mapCY - mapH * 0.16, 0],
    B: [CX - mapW * 0.22, mapCY - mapH * 0.10, 0],
    C: [CX + mapW * 0.22, mapCY + mapH * 0.12, 0],
    D: [CX + mapW * 0.35, mapCY + mapH * 0.18, 0],
  };
  const introDots = [
    teaDot(mp.A, 'A', C.cyan, -0.40),
    teaDot(mp.B, 'B', C.cyan, 0.40),
    teaDot(mp.C, 'C', C.amber, -0.40),
    teaDot(mp.D, 'D', C.amber, 0.40),
  ];

  await until(S(0));
  await play(
    new M.FadeIn(introBase, { runTime: 0.7 }),
    new M.LaggedStart(introDots.map(d => new M.FadeIn(d.g)), { lagRatio: 0.15, runTime: 1.3 }),
    ...say('TEA FLAVOR MAP', C.cyan)
  );

  // S(1): close pair vs far pair
  const closeLine = new M.Line({ start: mp.A, end: mp.B, color: C.cyan, strokeWidth: 4 });
  const closeTag = T('close', P ? 16 : 17, C.cyan, true, true);
  closeTag.moveTo([(mp.A[0] + mp.B[0]) / 2 - 0.05, mp.A[1] - 0.78, 0]);
  const farLine = new M.Line({ start: mp.A, end: mp.D, color: C.pink, strokeWidth: 3.5 });
  const farTag = T('far apart', P ? 16 : 17, C.pink, true, true);
  farTag.moveTo([(mp.A[0] + mp.D[0]) / 2 - 0.25, (mp.A[1] + mp.D[1]) / 2 + 0.45, 0]);
  await until(S(1));
  await play(
    new M.Create(closeLine, { runTime: 0.7 }),
    new M.FadeIn(closeTag, { runTime: 0.6 }),
    new M.Create(farLine, { runTime: 0.9 }),
    new M.FadeIn(farTag, { runTime: 0.6 }),
    ...say('CLOSE PAIR  VS  FAR PAIR', C.amber)
  );

  // S(2): customer assumes larger gap = larger taste difference
  const midLine = new M.DashedLine({ start: mp.B, end: mp.C, color: C.amber });
  const midTag = T('smaller gap?', P ? 15 : 16, C.amber, true);
  midTag.moveTo([(mp.B[0] + mp.C[0]) / 2 + 0.35, (mp.B[1] + mp.C[1]) / 2 - 0.48, 0]);
  await until(S(2));
  await play(
    new M.Create(midLine, { runTime: 0.8 }),
    new M.FadeIn(midTag, { runTime: 0.6 }),
    new M.Indicate(farLine, { color: C.pink, runTime: 1.0 }),
    ...say('LARGER GAP = MORE DIFFERENT?', C.amber)
  );

  // S(3): can we always trust distances on a smaller map?
  const qCircle = new M.Circle({ radius: 0.34, color: C.pink, strokeWidth: 3 });
  qCircle.setFill(C.bg, 0.95);
  qCircle.moveTo([CX, mapCY + mapH / 2 - 0.50, 0]);
  const qTxt = T('?', 28, C.pink, true, true);
  qTxt.moveTo([CX, mapCY + mapH / 2 - 0.50, 0]);
  const qBadge = new M.VGroup(qCircle, qTxt);
  await until(S(3));
  await play(
    new M.FadeIn(qBadge, { runTime: 0.6 }),
    new M.Indicate(farTag, { color: C.pink, runTime: 0.9 }),
    ...say('CAN WE TRUST MAP DISTANCES?', C.pink)
  );

  // ===========================================================================
  // ACT 2a (4-5): Return to original 12 tasting scores for teas A, B, C and D
  // ===========================================================================
  const gridCY = P ? -1.80 : -0.55;
  const cellW = P ? 3.30 : 3.65, cellH = P ? 2.20 : 1.65;
  const gapX = 0.25, gapY = P ? 0.30 : 0.25;
  const teaOrder = ['A', 'B', 'C', 'D'];
  const fourCards = teaOrder.map((name, idx) => {
    const col = idx % 2, row = Math.floor(idx / 2);
    const cx = CX + (col === 0 ? -(cellW + gapX) / 2 : (cellW + gapX) / 2);
    const cy = gridCY + (row === 0 ? (cellH + gapY) / 2 : -(cellH + gapY) / 2);
    const box = new M.RoundedRectangle({ width: cellW, height: cellH, cornerRadius: 0.14, color: C.line, strokeWidth: 1.8 });
    box.setFill(C.card, 0.9);
    box.moveTo([cx, cy, 0]);
    const head = T('Tea ' + name, P ? 18 : 19, idx < 2 ? C.cyan : C.amber, true, true);
    head.moveTo([cx - cellW / 2 + 0.22 + head.getWidth() / 2, cy + cellH / 2 - 0.26, 0]);
    const baseY = cy - cellH / 2 + 0.26;
    const maxBH = cellH - 0.72;
    const step = (cellW - 0.44) / 12;
    const bars = TEAS[name].map((v, i) => {
      const h = (v / 10) * maxBH;
      const b = new M.Rectangle({ width: step * 0.72, height: Math.max(0.05, h), color: attrCol(i), strokeWidth: 1 });
      b.setFill(attrCol(i), 0.85);
      b.moveTo([cx - (cellW - 0.44) / 2 + (i + 0.5) * step, baseY + h / 2, 0]);
      return b;
    });
    const baseLn = new M.Line({ start: [cx - cellW / 2 + 0.18, baseY, 0], end: [cx + cellW / 2 - 0.18, baseY, 0], color: C.muted, strokeWidth: 1.5 });
    return new M.VGroup(box, head, baseLn, ...bars);
  });

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(introBase, ...introDots.map(d => d.g), closeLine, closeTag, farLine, farTag, midLine, midTag, qBadge), { runTime: 0.6 }),
    new M.LaggedStart(fourCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('ORIGINAL SCORES: TEAS A, B, C, D', C.cyan)
  );

  // S(5): Each tea has 12 scores
  const attrNote = T('12 scores:  6 floral/sweet (cyan)  +  6 roast/smoke (amber)', P ? 15 : 16, C.muted);
  attrNote.moveTo([CX, P ? -4.55 : -2.62, 0]);
  await until(S(5));
  await play(
    new M.FadeIn(attrNote, { runTime: 0.6 }),
    new M.Indicate(fourCards[0], { color: C.cyan, runTime: 1.0 }),
    ...fbox(['Original tasting data', ['12 scores per tea', C.cyan], '6 floral + 6 roast']),
    ...say('12 TASTE & SMELL SCORES EACH', C.cyan)
  );

  // ===========================================================================
  // ACT 2b (6-25): Aligned dual 12-bar comparison (A vs B, C vs D, A vs D, B vs C)
  // ===========================================================================
  const barStep = P ? 0.53 : 0.60;
  const barW = P ? 0.37 : 0.42;
  const barCenterX = P ? 0.34 : CX + 0.28;
  const colX = i => barCenterX + (i - 5.5) * barStep;
  const teaLabX = P ? -3.32 : -6.05;
  const topBaseY = P ? -0.90 : 0.05;
  const botBaseY = P ? -4.35 : -2.35;
  const attrY = P ? -1.42 : -0.35;
  const diffY = P ? -1.96 : -0.78;
  const barScale = P ? 0.16 : 0.11;

  const makeBar = (i, baseY, val, color) => {
    const h = Math.max(0.06, val * barScale);
    const r = new M.Rectangle({ width: barW, height: h, color, strokeWidth: 1.5 });
    r.setFill(color, 0.84);
    r.moveTo([colX(i), baseY + h / 2, 0]);
    return r;
  };
  const makeNums = (scores, baseY, hiCols = []) =>
    scores.map((v, i) => {
      const col = hiCols.includes(i) ? C.pink : attrCol(i);
      const t = T(String(v), P ? 15 : 16, col, true);
      t.moveTo([colX(i), baseY + v * barScale + (P ? 0.22 : 0.18), 0]);
      return t;
    });
  const makeTeaTag = (letter, baseY, color) => {
    const box = new M.RoundedRectangle({ width: P ? 0.62 : 0.72, height: P ? 0.56 : 0.56, cornerRadius: 0.12, color, strokeWidth: 2 });
    box.setFill(C.card, 0.95);
    box.moveTo([teaLabX, baseY + 0.45, 0]);
    const txt = T(letter, P ? 22 : 24, color, true, true);
    txt.moveTo([teaLabX, baseY + 0.45, 0]);
    return new M.VGroup(box, txt);
  };

  const xLeft = colX(0) - barStep * 0.55, xRight = colX(11) + barStep * 0.55;
  const topBase = new M.Line({ start: [xLeft, topBaseY, 0], end: [xRight, topBaseY, 0], color: C.muted, strokeWidth: 2 });
  const botBase = new M.Line({ start: [xLeft, botBaseY, 0], end: [xRight, botBaseY, 0], color: C.muted, strokeWidth: 2 });
  const attrLabels = ATTRS.map((s, i) => {
    const t = T(s, P ? 15 : 14, attrCol(i), true);
    t.moveTo([colX(i), attrY, 0]);
    return t;
  });
  const barLegend = T('First 6: floral/sweet (cyan)   ·   Last 6: roast/smoke (amber)', P ? 15 : 14, C.muted);
  barLegend.moveTo([CX, P ? -4.95 : -2.75, 0]);

  const topBars = TEAS.A.map((v, i) => makeBar(i, topBaseY, v, attrCol(i)));
  const botBars = TEAS.B.map((v, i) => makeBar(i, botBaseY, v, attrCol(i)));
  let topTag = makeTeaTag('A', topBaseY, C.cyan);
  let botTag = makeTeaTag('B', botBaseY, C.cyan);
  let topNums = makeNums(TEAS.A, topBaseY);
  let botNums = makeNums(TEAS.B, botBaseY);

  let fjBox = null, lastBox = null;
  let fjDiffs = [], lastDiffs = [];

  const makeColOutline = (c0, c1, color) => {
    const w = (c1 - c0 + 1) * barStep + 0.14;
    const topY = topBaseY + (c0 === 0 ? 0.85 : 1.02) * (P ? 1.25 : 1.0);
    const botY = botBaseY - 0.08;
    const r = new M.RoundedRectangle({ width: w, height: topY - botY, cornerRadius: 0.14, color, strokeWidth: 2.2 });
    r.moveTo([(colX(c0) + colX(c1)) / 2, (topY + botY) / 2, 0]);
    return r;
  };
  const makeDiffBadges = (cols, txt, color) =>
    cols.map(i => {
      const t = T(txt, P ? 15 : 15, color, true, true);
      t.moveTo([colX(i), diffY, 0]);
      return t;
    });

  // S(6): Draw 12 scores for tea A beside those for tea B
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(...fourCards, attrNote), { runTime: 0.55 }),
    new M.Create(topBase, { runTime: 0.6 }),
    new M.Create(botBase, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...attrLabels, barLegend), { runTime: 0.6 }),
    new M.FadeIn(topTag, { runTime: 0.6 }),
    new M.FadeIn(botTag, { runTime: 0.6 }),
    new M.LaggedStart([...topBars, ...botBars].map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...topNums, ...botNums), { runTime: 0.8 }),
    ...fbox(['Tea A vs Tea B', '12 tasting scores']),
    ...say('COMPARE TEA A AND TEA B', C.cyan)
  );

  // S(7): Only Floral and Jasmine scores differ
  fjBox = makeColOutline(0, 1, C.pink);
  const topNumsABPink = makeNums(TEAS.A, topBaseY, [0, 1]);
  const botNumsABPink = makeNums(TEAS.B, botBaseY, [0, 1]);
  await until(S(7));
  await play(
    new M.Create(fjBox, { runTime: 0.7 }),
    new M.Transform(topBars[0], makeBar(0, topBaseY, TEAS.A[0], C.pink), { runTime: 0.6 }),
    new M.Transform(topBars[1], makeBar(1, topBaseY, TEAS.A[1], C.pink), { runTime: 0.6 }),
    new M.Transform(botBars[0], makeBar(0, botBaseY, TEAS.B[0], C.pink), { runTime: 0.6 }),
    new M.Transform(botBars[1], makeBar(1, botBaseY, TEAS.B[1], C.pink), { runTime: 0.6 }),
    new M.FadeOut(new M.VGroup(topNums[0], topNums[1], botNums[0], botNums[1]), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(topNumsABPink[0], topNumsABPink[1], botNumsABPink[0], botNumsABPink[1]), { runTime: 0.5 }),
    ...fbox(['A vs B', ['Floral & Jasmine differ', C.pink], 'other 10 scores match'], C.pink),
    ...say('ONLY FLORAL & JASMINE DIFFER', C.pink)
  );
  topNums[0] = topNumsABPink[0]; topNums[1] = topNumsABPink[1];
  botNums[0] = botNumsABPink[0]; botNums[1] = botNumsABPink[1];

  // S(8): Each of these two scores differs by two
  fjDiffs = makeDiffBadges([0, 1], '±2', C.pink);
  await until(S(8));
  await play(
    new M.LaggedStart(fjDiffs.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 0.6 }),
    ...fbox(['A vs B differences', ['Floral:  |1 - 3| = 2', C.pink], ['Jasmine: |3 - 1| = 2', C.pink]], C.pink),
    ...say('EACH DIFFERS BY 2', C.pink)
  );

  // S(9): Square each difference by multiplying 2 by 2
  const fjSq = makeDiffBadges([0, 1], '2²=4', C.amber);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...fjDiffs), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...fjSq), { runTime: 0.5 }),
    ...fbox(['Square each difference', ['2 × 2 = 4', C.amber], ['2 × 2 = 4', C.amber]], C.amber),
    ...say('SQUARE EACH: 2 × 2 = 4', C.amber)
  );
  fjDiffs = fjSq;

  // S(10): Four plus four makes eight (short gap: 1.93s!)
  await until(S(10));
  await play(
    ...fbox(['A vs B', ['4 + 4 = 8', C.amber]], C.amber),
    ...say('4 + 4 = 8', C.amber)
  );

  // S(11): Take the square root of eight
  await until(S(11));
  await play(
    ...fbox(['Original distance A–B', 'sum of squares = 8', ['distance = √8', C.cyan]], C.cyan),
    ...say('DISTANCE = SQUARE ROOT OF 8', C.cyan)
  );

  // S(12): What a square root is
  await until(S(12));
  await play(
    ...fbox(['What is √8 ?', ['2.83 × 2.83 ≈ 8', C.green], 'multiplied by itself'], C.green),
    ...say('SQUARE ROOT: N × N = 8', C.green)
  );

  // S(13): Distance between tea A and tea B ≈ 2.83
  await until(S(13));
  await play(
    new M.Indicate(fjBox, { color: C.cyan, runTime: 0.9 }),
    ...fbox(['Original distance', ['A – B = √8 ≈ 2.83', C.cyan]], C.cyan),
    ...say('ORIGINAL A – B ≈ 2.83', C.cyan)
  );

  // S(14): Repeat the calculation for tea C and tea D
  const newTopTagC = makeTeaTag('C', topBaseY, C.amber);
  const newBotTagD = makeTeaTag('D', botBaseY, C.amber);
  const newTopNumsC = makeNums(TEAS.C, topBaseY, [0, 1]);
  const newBotNumsD = makeNums(TEAS.D, botBaseY, [0, 1]);
  const fjDiffsCD = makeDiffBadges([0, 1], '±2', C.pink);
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(topTag, botTag, ...topNums, ...botNums, ...fjDiffs), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(newTopTagC, newBotTagD, ...newTopNumsC, ...newBotNumsD, ...fjDiffsCD), { runTime: 0.65 }),
    ...TEAS.C.map((v, i) => new M.Transform(topBars[i], makeBar(i, topBaseY, v, i < 2 ? C.pink : attrCol(i)), { runTime: 0.7 })),
    ...TEAS.D.map((v, i) => new M.Transform(botBars[i], makeBar(i, botBaseY, v, i < 2 ? C.pink : attrCol(i)), { runTime: 0.7 })),
    ...fbox(['Repeat for C vs D', ['Fl, Ja: each differs by 2', C.pink], 'Last 6: all 7 (diff 0)'], C.cyan),
    ...say('REPEAT FOR TEA C AND TEA D', C.cyan)
  );
  topTag = newTopTagC; botTag = newBotTagD;
  topNums = newTopNumsC; botNums = newBotNumsD;
  fjDiffs = fjDiffsCD;

  // S(15): C–D original distance is also ≈ 2.83
  await until(S(15));
  await play(
    new M.Indicate(fjBox, { color: C.green, runTime: 0.9 }),
    ...fbox(['Original distances', 'A – B = √8 ≈ 2.83', ['C – D = √8 ≈ 2.83', C.green]], C.green),
    ...say('ORIGINAL C – D ≈ 2.83 TOO', C.green)
  );

  // S(16): Now compare tea A with tea D
  const newTopTagA2 = makeTeaTag('A', topBaseY, C.cyan);
  const newTopNumsA2 = makeNums(TEAS.A, topBaseY);
  const newBotNumsD2 = makeNums(TEAS.D, botBaseY);
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(topTag, ...topNums, ...botNums, fjBox, ...fjDiffs), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(newTopTagA2, ...newTopNumsA2, ...newBotNumsD2), { runTime: 0.6 }),
    ...TEAS.A.map((v, i) => new M.Transform(topBars[i], makeBar(i, topBaseY, v, attrCol(i)), { runTime: 0.65 })),
    new M.Transform(botBars[0], makeBar(0, botBaseY, TEAS.D[0], C.cyan), { runTime: 0.65 }),
    new M.Transform(botBars[1], makeBar(1, botBaseY, TEAS.D[1], C.cyan), { runTime: 0.65 }),
    ...fbox(['Compare Tea A and Tea D', 'check all 12 scores'], C.amber),
    ...say('COMPARE TEA A AND TEA D', C.amber)
  );
  topTag = newTopTagA2; topNums = newTopNumsA2; botNums = newBotNumsD2;
  fjBox = null; fjDiffs = [];

  // S(17): Floral and Jasmine scores each differ by 2
  fjBox = makeColOutline(0, 1, C.pink);
  fjDiffs = makeDiffBadges([0, 1], '±2', C.pink);
  const topADPink = makeNums(TEAS.A, topBaseY, [0, 1]);
  const botADPink = makeNums(TEAS.D, botBaseY, [0, 1]);
  await until(S(17));
  await play(
    new M.Create(fjBox, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...fjDiffs), { runTime: 0.5 }),
    new M.Transform(topBars[0], makeBar(0, topBaseY, TEAS.A[0], C.pink), { runTime: 0.5 }),
    new M.Transform(topBars[1], makeBar(1, topBaseY, TEAS.A[1], C.pink), { runTime: 0.5 }),
    new M.Transform(botBars[0], makeBar(0, botBaseY, TEAS.D[0], C.pink), { runTime: 0.5 }),
    new M.Transform(botBars[1], makeBar(1, botBaseY, TEAS.D[1], C.pink), { runTime: 0.5 }),
    new M.FadeOut(new M.VGroup(topNums[0], topNums[1], botNums[0], botNums[1]), { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(topADPink[0], topADPink[1], botADPink[0], botADPink[1]), { runTime: 0.45 }),
    ...fbox(['A vs D', ['Fl, Ja: 2 scores differ by 2', C.pink]], C.pink),
    ...say('FLORAL & JASMINE DIFFER BY 2', C.pink)
  );
  topNums[0] = topADPink[0]; topNums[1] = topADPink[1];
  botNums[0] = botADPink[0]; botNums[1] = botADPink[1];

  // S(18): Last six scores each differ by 4
  lastBox = makeColOutline(6, 11, C.amber);
  lastDiffs = makeDiffBadges([6, 7, 8, 9, 10, 11], '±4', C.amber);
  await until(S(18));
  await play(
    new M.Create(lastBox, { runTime: 0.7 }),
    new M.LaggedStart(lastDiffs.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 0.7 }),
    ...fbox(['A vs D', ['Fl, Ja: 2 differ by 2', C.pink], ['Last 6: 6 differ by 4', C.amber]], C.amber),
    ...say('LAST 6 SCORES DIFFER BY 4', C.amber)
  );

  // S(19): First two squared differences add to 8
  await until(S(19));
  await play(
    new M.Indicate(fjBox, { color: C.pink, runTime: 0.85 }),
    ...fbox(['A vs D squared diffs', ['First 2: 2² + 2² = 8', C.pink]], C.pink),
    ...say('FIRST TWO SQUARED = 8', C.pink)
  );

  // S(20): Last six squared differences add to 96
  await until(S(20));
  await play(
    new M.Indicate(lastBox, { color: C.amber, runTime: 0.9 }),
    ...fbox(['A vs D squared diffs', ['First 2: 2² + 2² = 8', C.pink], ['Last 6:  6 × 4² = 96', C.amber]], C.amber),
    ...say('LAST SIX SQUARED = 96', C.amber)
  );

  // S(21): Eight plus ninety-six makes 104
  await until(S(21));
  await play(
    ...fbox(['A vs D', 'First 2 = 8,  Last 6 = 96', ['8 + 96 = 104', C.amber]], C.amber),
    ...say('8 + 96 = 104', C.amber)
  );

  // S(22): Square root is ≈ 10.20
  await until(S(22));
  await play(
    ...fbox(['Original distance A–D', 'sum of squares = 104', ['A – D = √104 ≈ 10.20', C.amber]], C.amber),
    ...say('ORIGINAL A – D ≈ 10.20', C.amber)
  );

  // S(23): Repeat the calculation for tea B and tea C
  const newTopTagB2 = makeTeaTag('B', topBaseY, C.cyan);
  const newBotTagC2 = makeTeaTag('C', botBaseY, C.amber);
  const newTopNumsB2 = makeNums(TEAS.B, topBaseY, [0, 1]);
  const newBotNumsC2 = makeNums(TEAS.C, botBaseY, [0, 1]);
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(topTag, botTag, ...topNums, ...botNums), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(newTopTagB2, newBotTagC2, ...newTopNumsB2, ...newBotNumsC2), { runTime: 0.6 }),
    ...TEAS.B.map((v, i) => new M.Transform(topBars[i], makeBar(i, topBaseY, v, i < 2 ? C.pink : attrCol(i)), { runTime: 0.65 })),
    ...TEAS.C.map((v, i) => new M.Transform(botBars[i], makeBar(i, botBaseY, v, i < 2 ? C.pink : attrCol(i)), { runTime: 0.65 })),
    ...fbox(['Repeat for B vs C', ['First 2: diff 2 → 8', C.pink], ['Last 6:  diff 4 → 96', C.amber]], C.cyan),
    ...say('REPEAT FOR TEA B AND TEA C', C.cyan)
  );
  topTag = newTopTagB2; botTag = newBotTagC2;
  topNums = newTopNumsB2; botNums = newBotNumsC2;

  // S(24): Their original distance is also ≈ 10.20
  await until(S(24));
  await play(
    new M.Indicate(lastBox, { color: C.green, runTime: 0.9 }),
    ...fbox(['Original distance B–C', '8 + 96 = 104', ['B – C = √104 ≈ 10.20', C.green]], C.green),
    ...say('ORIGINAL B – C ≈ 10.20 TOO', C.green)
  );

  // S(25): Equally different in original tasting scores
  await until(S(25));
  await play(
    new M.Indicate(fjBox, { color: C.green, runTime: 0.8 }),
    new M.Indicate(lastBox, { color: C.green, runTime: 0.8 }),
    ...fbox(['Original distant pairs', ['A – D ≈ 10.20', C.green], ['B – C ≈ 10.20', C.green], ['EQUALLY DIFFERENT', C.green]], C.green),
    ...say('A – D AND B – C ARE EQUALLY DIFFERENT', C.green)
  );

  // ===========================================================================
  // ACT 3 (26-38): Simplified map placing all four teas on a horizontal line
  // ===========================================================================
  const lineY = P ? -2.45 : -0.45;
  const nx0 = P ? -3.05 : -5.65, nx1 = P ? 3.05 : 1.35;
  const n2x = v => nx0 + (v / 11) * (nx1 - nx0);

  const axisLine = new M.Line({ start: [nx0 - 0.35, lineY, 0], end: [nx1 + 0.35, lineY, 0], color: C.muted, strokeWidth: 3 });
  const tickItems = [];
  for (let v = 0; v <= 11; v++) {
    const x = n2x(v);
    const major = v === 0 || v === 1 || v === 5 || v === 10 || v === 11;
    tickItems.push(new M.Line({ start: [x, lineY - (major ? 0.11 : 0.06), 0], end: [x, lineY + (major ? 0.11 : 0.06), 0], color: major ? C.ink : C.muted, strokeWidth: major ? 2 : 1.5 }));
    if (major) {
      const lb = T(String(v), P ? 16 : 17, C.muted, true);
      lb.moveTo([x, lineY - 0.36, 0]);
      tickItems.push(lb);
    }
  }
  const axisCap = T('map position (steps)', P ? 15 : 16, C.muted);
  axisCap.moveTo([n2x(5.5), lineY + 0.42, 0]);
  const axisTicks = new M.VGroup(...tickItems, axisCap);

  // S(26): Imagine a smaller map along a horizontal line
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(
      topBase, botBase, ...attrLabels, barLegend,
      ...topBars, ...botBars, topTag, botTag, ...topNums, ...botNums,
      fjBox, lastBox, ...fjDiffs, ...lastDiffs
    ), { runTime: 0.6 }),
    new M.Create(axisLine, { runTime: 0.8 }),
    new M.FadeIn(axisTicks, { runTime: 0.7 }),
    ...clearBox(),
    ...say('SMALLER MAP: ONE HORIZONTAL LINE', C.cyan)
  );

  // S(27): Place tea A at 0 and tea B at 1
  const dA = teaDot([n2x(0), lineY, 0], 'A', C.cyan, 0.42, 0.15);
  const dB = teaDot([n2x(1), lineY, 0], 'B', C.cyan, 0.42, 0.15);
  await until(S(27));
  await play(
    new M.FadeIn(dA.g, { runTime: 0.6 }),
    new M.FadeIn(dB.g, { runTime: 0.6 }),
    new M.Flash(dA.core, { color: C.cyan, runTime: 0.7 }),
    new M.Flash(dB.core, { color: C.cyan, runTime: 0.7 }),
    ...fbox(['Map positions', ['A at 0', C.cyan], ['B at 1', C.cyan]], C.cyan),
    ...say('A AT 0,  B AT 1', C.cyan)
  );

  // S(28): Place tea C at 10 and tea D at 11
  const dC = teaDot([n2x(10), lineY, 0], 'C', C.amber, 0.42, 0.15);
  const dD = teaDot([n2x(11), lineY, 0], 'D', C.amber, 0.42, 0.15);
  await until(S(28));
  await play(
    new M.FadeIn(dC.g, { runTime: 0.6 }),
    new M.FadeIn(dD.g, { runTime: 0.6 }),
    new M.Flash(dC.core, { color: C.amber, runTime: 0.7 }),
    new M.Flash(dD.core, { color: C.amber, runTime: 0.7 }),
    ...fbox(['Map positions', ['A = 0,   B = 1', C.cyan], ['C = 10,  D = 11', C.amber]], C.amber),
    ...say('C AT 10,  D AT 11', C.amber)
  );

  // S(29): A and B sit 1 step apart
  const brAB = caliper(n2x(0), n2x(1), lineY - (P ? 0.92 : 0.85), 1, C.cyan, '1', -0.32);
  await until(S(29));
  await play(
    new M.Create(brAB, { runTime: 0.7 }),
    ...fbox(['Close pairs on map', ['A – B = 1 - 0 = 1', C.cyan]], C.cyan),
    ...say('MAP A – B = 1 STEP', C.cyan)
  );

  // S(30): C and D also sit 1 step apart
  const brCD = caliper(n2x(10), n2x(11), lineY - (P ? 0.92 : 0.85), 1, C.amber, '1', -0.32);
  await until(S(30));
  await play(
    new M.Create(brCD, { runTime: 0.7 }),
    ...fbox(['Close pairs on map', ['A – B = 1', C.cyan], ['C – D = 1', C.amber]], C.cyan),
    ...say('MAP C – D = 1 STEP', C.amber)
  );

  // S(31): Keeps two closest pairs together
  const grpW = (n2x(1) - n2x(0)) + 0.78;
  const grpAB = new M.RoundedRectangle({ width: grpW, height: 1.05, cornerRadius: 0.20, color: C.green, strokeWidth: 2.5 });
  grpAB.moveTo([(n2x(0) + n2x(1)) / 2, lineY + 0.16, 0]);
  const grpCD = new M.RoundedRectangle({ width: grpW, height: 1.05, cornerRadius: 0.20, color: C.green, strokeWidth: 2.5 });
  grpCD.moveTo([(n2x(10) + n2x(11)) / 2, lineY + 0.16, 0]);
  await until(S(31));
  await play(
    new M.Create(grpAB, { runTime: 0.65 }),
    new M.Create(grpCD, { runTime: 0.65 }),
    ...fbox(['Close pairs preserved ✓', ['A–B = 1,  C–D = 1', C.green]], C.green),
    ...say('CLOSE PAIRS STAY TOGETHER ✓', C.green)
  );

  // S(32): Measure distance between A and D
  const adY = lineY + (P ? 1.25 : 1.10);
  const lineAD = caliper(n2x(0), n2x(11), adY, -1, C.pink, '', 0);
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(grpAB, grpCD), { runTime: 0.45 }),
    new M.Create(lineAD, { runTime: 0.9 }),
    ...say('MEASURE MAP A – D', C.pink)
  );

  // S(33): Map distance is 11 steps
  const lblAD = T('A – D = 11 steps', P ? 18 : 19, C.pink, true, true);
  lblAD.moveTo([(n2x(0) + n2x(11)) / 2, adY + 0.36, 0]);
  await until(S(33));
  await play(
    new M.FadeIn(lblAD, { runTime: 0.55 }),
    ...fbox(['Map distance A–D', ['11 - 0 = 11 steps', C.pink]], C.pink),
    ...say('MAP A – D = 11 STEPS', C.pink)
  );

  // S(34): Measure distance between B and C
  const bcY = lineY - (P ? 1.75 : 1.55);
  const lineBC = caliper(n2x(1), n2x(10), bcY, 1, C.amber, '', 0);
  await until(S(34));
  await play(
    new M.Create(lineBC, { runTime: 0.9 }),
    ...say('MEASURE MAP B – C', C.amber)
  );

  // S(35): Ten minus one gives nine steps
  const lblBC = T('B – C = 9 steps', P ? 18 : 19, C.amber, true, true);
  lblBC.moveTo([(n2x(1) + n2x(10)) / 2, bcY - 0.36, 0]);
  await until(S(35));
  await play(
    new M.FadeIn(lblBC, { runTime: 0.55 }),
    ...fbox(['Map distances', ['A – D = 11 steps', C.pink], ['B – C = 10 - 1 = 9', C.amber]], C.amber),
    ...say('MAP B – C = 9 STEPS', C.amber)
  );

  // S(36): Two different distances even though original distances are equal
  await until(S(36));
  await play(
    new M.Indicate(lblAD, { color: C.pink, runTime: 0.9 }),
    new M.Indicate(lblBC, { color: C.amber, runTime: 0.9 }),
    ...fbox(['Original vs Map', ['Original: 10.20 = 10.20', C.green], ['Map:      11 ≠ 9', C.pink]], C.pink),
    ...say('MAP: 11 ≠ 9  (ORIGINAL: EQUAL!)', C.pink)
  );

  // S(37): Gap between A and D looks larger
  const extraL = new M.Line({ start: [n2x(0), adY, 0], end: [n2x(1), adY, 0], color: C.ink, strokeWidth: 5 });
  const extraR = new M.Line({ start: [n2x(10), adY, 0], end: [n2x(11), adY, 0], color: C.ink, strokeWidth: 5 });
  await until(S(37));
  await play(
    new M.Create(extraL, { runTime: 0.5 }),
    new M.Create(extraR, { runTime: 0.5 }),
    new M.Indicate(lineAD, { color: C.pink, runTime: 0.9 }),
    ...say('A – D LOOKS LARGER THAN B – C', C.pink)
  );

  // S(38): This difference comes from the map, not from original tasting scores
  await until(S(38));
  await play(
    new M.Indicate(axisLine, { color: C.pink, runTime: 0.9 }),
    ...fbox(['Why 11 ≠ 9 ?', ['Created by the map,', C.pink], ['not by the taste scores', C.muted]], C.pink),
    ...say('CREATED BY THE MAP, NOT THE TASTE', C.pink)
  );

  // ===========================================================================
  // ACT 4 (39-41): Naming Embedding and Embedding Distortion
  // ===========================================================================
  const leftPos = P ? [0, -0.25, 0] : [CX - 2.05, -0.35, 0];
  const rightPos = P ? [0, -3.05, 0] : [CX + 2.05, -0.35, 0];
  const eLeftW = P ? 6.4 : 3.25, eLeftH = P ? 2.0 : 2.35;
  const eRightW = P ? 6.4 : 3.05, eRightH = P ? 1.55 : 2.35;

  const lCard = new M.RoundedRectangle({ width: eLeftW, height: eLeftH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  lCard.setFill(C.card, 0.92); lCard.moveTo(leftPos);
  const lHead = T('Tea A: 12 scores', P ? 18 : 17, C.cyan, true, true);
  lHead.moveTo([leftPos[0], leftPos[1] + eLeftH / 2 - 0.32, 0]);
  const lStep = (eLeftW - 0.6) / 12;
  const lBaseY = leftPos[1] - eLeftH / 2 + 0.34;
  const lBars = TEAS.A.map((v, i) => {
    const h = (v / 10) * (eLeftH - 0.95);
    const b = new M.Rectangle({ width: lStep * 0.72, height: Math.max(0.06, h), color: attrCol(i), strokeWidth: 1 });
    b.setFill(attrCol(i), 0.86);
    b.moveTo([leftPos[0] - (eLeftW - 0.6) / 2 + (i + 0.5) * lStep, lBaseY + h / 2, 0]);
    return b;
  });
  const embLeft = new M.VGroup(lCard, lHead, ...lBars);

  // Clean arrow from 12 scores to 2 numbers (Lines only)
  const arrParts = [];
  if (P) {
    const y1 = leftPos[1] - eLeftH / 2 - 0.14, y2 = rightPos[1] + eRightH / 2 + 0.14;
    arrParts.push(
      new M.Line({ start: [0, y1, 0], end: [0, y2, 0], color: C.amber, strokeWidth: 3.5 }),
      new M.Line({ start: [-0.16, y2 + 0.20, 0], end: [0, y2, 0], color: C.amber, strokeWidth: 3.5 }),
      new M.Line({ start: [0.16, y2 + 0.20, 0], end: [0, y2, 0], color: C.amber, strokeWidth: 3.5 })
    );
    const aLbl = T('embedding', 16, C.amber, true);
    aLbl.moveTo([1.05, (y1 + y2) / 2, 0]);
    arrParts.push(aLbl);
  } else {
    const x1 = leftPos[0] + eLeftW / 2 + 0.14, x2 = rightPos[0] - eRightW / 2 - 0.14, ay = leftPos[1];
    arrParts.push(
      new M.Line({ start: [x1, ay, 0], end: [x2, ay, 0], color: C.amber, strokeWidth: 3.5 }),
      new M.Line({ start: [x2 - 0.18, ay + 0.15, 0], end: [x2, ay, 0], color: C.amber, strokeWidth: 3.5 }),
      new M.Line({ start: [x2 - 0.18, ay - 0.15, 0], end: [x2, ay, 0], color: C.amber, strokeWidth: 3.5 })
    );
    const aLbl = T('embedding', 15, C.amber, true);
    aLbl.moveTo([(x1 + x2) / 2, ay + 0.32, 0]);
    arrParts.push(aLbl);
  }
  const embArrow = new M.VGroup(...arrParts);

  const rCard = new M.RoundedRectangle({ width: eRightW, height: eRightH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  rCard.setFill(C.card, 0.92); rCard.moveTo(rightPos);
  const rHead = T('2 map numbers', P ? 18 : 17, C.amber, true, true);
  rHead.moveTo([rightPos[0], rightPos[1] + eRightH / 2 - 0.34, 0]);
  const rVal = T('A = (0, 0)', P ? 26 : 24, C.ink, true, true);
  rVal.moveTo([rightPos[0], rightPos[1] - 0.16, 0]);
  const embRight = new M.VGroup(rCard, rHead, rVal);

  // S(39): Smaller set of numbers = embedding
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(axisLine, axisTicks, dA.g, dB.g, dC.g, dD.g, brAB, brCD, lineAD, lblAD, lineBC, lblBC, extraL, extraR), { runTime: 0.6 }),
    new M.FadeIn(embLeft, { runTime: 0.7 }),
    new M.Create(embArrow, { runTime: 0.7 }),
    new M.FadeIn(embRight, { runTime: 0.7 }),
    ...fbox([['Embedding', C.cyan], 'smaller set of numbers', 'describing each item'], C.cyan),
    ...say('EMBEDDING', C.cyan)
  );

  // S(40): Replaces 12 tasting scores with 2 position numbers
  const tag12 = T('12 numbers', P ? 16 : 16, C.cyan, true, true);
  tag12.moveTo([leftPos[0], leftPos[1] - eLeftH / 2 - (P ? -0.18 : 0.28), 0]);
  const tag2 = T('2 numbers', P ? 16 : 16, C.amber, true, true);
  tag2.moveTo([rightPos[0], rightPos[1] - eRightH / 2 - (P ? -0.18 : 0.28), 0]);
  await until(S(40));
  await play(
    new M.Indicate(embLeft, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(embRight, { color: C.amber, runTime: 0.8 }),
    new M.FadeIn(tag12, { runTime: 0.5 }),
    new M.FadeIn(tag2, { runTime: 0.5 }),
    ...fbox(['Our tea map', ['12 tasting scores', C.cyan], ['→ 2 position numbers', C.amber]], C.amber),
    ...say('12 SCORES  →  2 POSITION NUMBERS', C.amber)
  );

  // S(41): Embedding distortion
  const distPos = [CX, P ? -4.55 : -2.28, 0];
  const distRect = new M.RoundedRectangle({ width: P ? 6.6 : 7.3, height: 0.82, cornerRadius: 0.16, color: C.pink, strokeWidth: 2.5 });
  distRect.setFill(C.card, 0.95); distRect.moveTo(distPos);
  const distTxt = T('Original: A–D = B–C    →    Map: 11 ≠ 9', P ? 16 : 17, C.pink, true, true);
  distTxt.moveTo(distPos);
  const distortBox = new M.VGroup(distRect, distTxt);
  await until(S(41));
  await play(
    new M.FadeIn(distortBox, { runTime: 0.7 }),
    new M.Indicate(distortBox, { color: C.pink, runTime: 0.9 }),
    ...fbox([['Embedding distortion', C.pink], 'embedding changes true', 'relationships'], C.pink),
    ...say('EMBEDDING DISTORTION', C.pink)
  );

  // ===========================================================================
  // ACT 5 (42-51): Original vs Map distance bars & Distance Ratio formula
  // ===========================================================================
  const rowsData = [
    { pair: 'A – B', orig: 2.83, map: 1, oCol: C.cyan, mCol: C.cyan },
    { pair: 'C – D', orig: 2.83, map: 1, oCol: C.cyan, mCol: C.cyan },
    { pair: 'A – D', orig: 10.20, map: 11, oCol: C.amber, mCol: C.pink },
    { pair: 'B – C', orig: 10.20, map: 9, oCol: C.amber, mCol: C.amber },
  ];
  const rowYs = P ? [-0.25, -1.25, -2.35, -3.35] : [0.42, -0.32, -1.16, -1.90];
  const headY = P ? 0.65 : 1.15;
  const pairX = P ? -3.15 : -5.80;
  const origX0 = P ? -2.42 : -4.92;
  const mapX0 = P ? 0.56 : -1.28;
  const bScale = P ? 0.165 : 0.20;
  const barH = P ? 0.42 : 0.36;

  const hPair = T('PAIR', P ? 15 : 16, C.muted, true, true); hPair.moveTo([pairX, headY, 0]);
  const hOrig = T('ORIGINAL', P ? 15 : 16, C.cyan, true, true); hOrig.moveTo([origX0 + 1.0, headY, 0]);
  const hMap = T('MAP', P ? 15 : 16, C.amber, true, true); hMap.moveTo([mapX0 + 0.95, headY, 0]);
  const hLine = new M.Line({ start: [P ? -3.55 : -6.25, headY - 0.30, 0], end: [P ? 3.55 : 2.05, headY - 0.30, 0], color: C.line, strokeWidth: 2 });
  const tblHead = new M.VGroup(hPair, hOrig, hMap, hLine);

  const tblRows = rowsData.map((d, idx) => {
    const y = rowYs[idx];
    const pTxt = T(d.pair, P ? 16 : 18, C.ink, true, true); pTxt.moveTo([pairX, y, 0]);
    const ow = Math.max(0.16, d.orig * bScale);
    const oBar = new M.Rectangle({ width: ow, height: barH, color: d.oCol, strokeWidth: 1.5 });
    oBar.setFill(d.oCol, 0.82); oBar.moveTo([origX0 + ow / 2, y, 0]);
    const oVal = T(d.orig.toFixed(2), P ? 15 : 16, d.oCol, true);
    oVal.moveTo([origX0 + ow + 0.12 + oVal.getWidth() / 2, y, 0]);

    const mw = Math.max(0.16, d.map * bScale);
    const mBar = new M.Rectangle({ width: mw, height: barH, color: d.mCol, strokeWidth: 1.5 });
    mBar.setFill(d.mCol, 0.82); mBar.moveTo([mapX0 + mw / 2, y, 0]);
    const mVal = T(String(d.map), P ? 15 : 16, d.mCol, true);
    mVal.moveTo([mapX0 + mw + 0.12 + mVal.getWidth() / 2, y, 0]);

    return new M.VGroup(pTxt, oBar, oVal, mBar, mVal);
  });

  // S(42): Place original distances beside map distances
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(embLeft, embArrow, embRight, tag12, tag2, distortBox), { runTime: 0.55 }),
    new M.FadeIn(tblHead, { runTime: 0.6 }),
    new M.LaggedStart(tblRows.map(r => new M.FadeIn(r)), { lagRatio: 0.14, runTime: 1.1 }),
    ...clearBox(),
    ...say('ORIGINAL VS MAP DISTANCES', C.cyan)
  );

  // S(43): In original data, both distant pairs have the same distance
  const hlMidY = (rowYs[2] + rowYs[3]) / 2;
  const hlH = (rowYs[2] - rowYs[3]) + (P ? 0.72 : 0.62);
  const hlOrig = new M.RoundedRectangle({ width: P ? 2.86 : 3.30, height: hlH, cornerRadius: 0.14, color: C.green, strokeWidth: 2.5 });
  hlOrig.moveTo([origX0 + (P ? 1.28 : 1.50), hlMidY, 0]);
  await until(S(43));
  await play(
    new M.Create(hlOrig, { runTime: 0.7 }),
    new M.Indicate(hlOrig, { color: C.green, runTime: 0.8 }),
    ...fbox(['Original distant pairs', ['A – D = 10.20', C.green], ['B – C = 10.20', C.green]], C.green),
    ...say('ORIGINAL: BOTH = 10.20', C.green)
  );

  // S(44): On the map, one pair has 11 and the other has 9
  const hlMap = new M.RoundedRectangle({ width: P ? 2.66 : 3.05, height: hlH, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.5 });
  hlMap.moveTo([mapX0 + (P ? 1.18 : 1.38), hlMidY, 0]);
  await until(S(44));
  await play(
    new M.Create(hlMap, { runTime: 0.7 }),
    new M.Indicate(hlMap, { color: C.pink, runTime: 0.8 }),
    ...fbox(['Map distant pairs', ['A – D = 11', C.pink], ['B – C = 9', C.amber]], C.pink),
    ...say('MAP: 11  VS  9', C.pink)
  );

  // S(45): Compare these distances using a short formula
  await until(S(45));
  await play(
    ...fbox(['Compare two distances', ['using a short formula', C.cyan]], C.cyan),
    ...say('A SHORT FORMULA TO COMPARE', C.cyan)
  );

  // S(46): Distance ratio = first distance ÷ second distance
  await until(S(46));
  await play(
    ...fbox([['distance ratio =', C.cyan], '  first distance', '  ÷ second distance'], C.cyan),
    ...say('RATIO = FIRST ÷ SECOND', C.cyan)
  );

  // S(47): Original ratio = 1
  await until(S(47));
  await play(
    new M.Indicate(hlOrig, { color: C.green, runTime: 0.9 }),
    ...fbox(['Original distance ratio', '10.20 ÷ 10.20', ['= 1.00', C.green]], C.green),
    ...say('ORIGINAL RATIO = 1', C.green)
  );

  // S(48): Map ratio = 11 ÷ 9 ≈ 1.22
  await until(S(48));
  await play(
    new M.Indicate(hlMap, { color: C.pink, runTime: 0.9 }),
    ...fbox(['Distance ratios', ['Original: 10.20 ÷ 10.20 = 1', C.green], ['Map:      11 ÷ 9 ≈ 1.22', C.pink]], C.pink),
    ...say('MAP RATIO = 11 ÷ 9 ≈ 1.22', C.pink)
  );

  // S(49): About 22% difference created by the map
  const pctY = P ? -4.42 : -2.62;
  const pctRect = new M.RoundedRectangle({ width: P ? 6.6 : 7.5, height: 0.70, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  pctRect.setFill(C.card, 0.95); pctRect.moveTo([CX, pctY, 0]);
  const pctTxt = T('Map creates +22% difference between equal pairs', P ? 15 : 16, C.pink, true, true);
  pctTxt.moveTo([CX, pctY, 0]);
  const pctBadge = new M.VGroup(pctRect, pctTxt);
  await until(S(49));
  await play(
    new M.FadeIn(pctBadge, { runTime: 0.65 }),
    new M.Indicate(pctBadge, { color: C.pink, runTime: 0.9 }),
    ...fbox(['Map ratio ≈ 1.22', ['Original  = 1.00', C.green], ['+22% from map!', C.pink]], C.pink),
    ...say('+22% DIFFERENCE CREATED BY MAP', C.pink)
  );

  // S(50): Check whether a smaller map preserves relationships that matter
  const markX = P ? 3.48 : 2.02;
  const checks = [
    T('✓', P ? 20 : 22, C.green, true, true).moveTo([markX, rowYs[0], 0]),
    T('✓', P ? 20 : 22, C.green, true, true).moveTo([markX, rowYs[1], 0]),
    T('!', P ? 20 : 22, C.pink, true, true).moveTo([markX, rowYs[2], 0]),
    T('!', P ? 20 : 22, C.pink, true, true).moveTo([markX, rowYs[3], 0]),
  ];
  await until(S(50));
  await play(
    new M.LaggedStart(checks.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 0.9 }),
    ...fbox(['Check your question', ['Close pairs?  Yes ✓', C.green], ['Far gaps?     No  !', C.pink]], C.cyan),
    ...say('CHECK WHAT MATTERS TO YOUR QUESTION', C.cyan)
  );

  // S(51): Preserve close neighbors without preserving every distance
  await until(S(51));
  await play(
    new M.Indicate(checks[0], { color: C.green, runTime: 0.8 }),
    new M.Indicate(checks[1], { color: C.green, runTime: 0.8 }),
    new M.Indicate(checks[2], { color: C.pink, runTime: 0.8 }),
    new M.Indicate(checks[3], { color: C.pink, runTime: 0.8 }),
    ...say('CLOSE NEIGHBORS ✓   EVERY DISTANCE ✗', C.amber)
  );

  // ===========================================================================
  // ACT 6 (52-54): t-SNE / UMAP trap & final takeaway
  // ===========================================================================
  function makeMethodCard(title, center, w, h, withEdges) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
    box.setFill(C.card, 0.92); box.moveTo(center);
    const hd = T(title, P ? 18 : 19, C.violet, true, true);
    hd.moveTo([center[0], center[1] + h / 2 - 0.30, 0]);
    const y0 = center[1] - 0.15;
    const pA = [center[0] - w * 0.30, y0 - 0.32, 0];
    const pB = [center[0] - w * 0.24, y0 + 0.24, 0];
    const pC = [center[0] + w * 0.24, y0 - 0.26, 0];
    const pD = [center[0] + w * 0.30, y0 + 0.30, 0];
    const items = [box, hd];
    if (withEdges) {
      items.push(
        new M.Line({ start: pA, end: pB, color: C.cyan, strokeWidth: 3.5 }),
        new M.Line({ start: pC, end: pD, color: C.amber, strokeWidth: 3.5 })
      );
    }
    const gap = new M.DashedLine({ start: [center[0] - w * 0.16, y0, 0], end: [center[0] + w * 0.16, y0, 0], color: C.pink });
    const q = T('gap ?', P ? 15 : 15, C.pink, true, true);
    q.moveTo([center[0], y0 + 0.32, 0]);
    items.push(
      gap, q,
      teaDot(pA, 'A', C.cyan, -0.32, 0.11).g,
      teaDot(pB, 'B', C.cyan, 0.32, 0.11).g,
      teaDot(pC, 'C', C.amber, -0.32, 0.11).g,
      teaDot(pD, 'D', C.amber, 0.32, 0.11).g
    );
    return new M.VGroup(...items);
  }

  const mCardW = P ? 3.30 : 3.55, mCardH = P ? 2.55 : 2.15;
  const mCardY = P ? -0.65 : 0.10;
  const tsneCard = makeMethodCard('t-SNE map', [CX - (mCardW / 2 + 0.15), mCardY, 0], mCardW, mCardH, false);
  const umapCard = makeMethodCard('UMAP map', [CX + (mCardW / 2 + 0.15), mCardY, 0], mCardW, mCardH, true);

  // S(52): Especially important for t-SNE or UMAP
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(tblHead, ...tblRows, hlOrig, hlMap, pctBadge, ...checks), { runTime: 0.55 }),
    new M.FadeIn(tsneCard, { runTime: 0.75 }),
    new M.FadeIn(umapCard, { runTime: 0.75 }),
    ...fbox(['t-SNE & UMAP maps', ['Neighbors: useful', C.green], ['Big gaps:  check!', C.pink]], C.violet),
    ...say('ESPECIALLY FOR t-SNE & UMAP', C.violet)
  );

  // S(53): Before trusting an important gap or group, check original measurements
  const verY = P ? -3.55 : -1.98;
  const verW = P ? 6.9 : 7.4, verH = P ? 1.45 : 1.05;
  const vBox = new M.RoundedRectangle({ width: verW, height: verH, cornerRadius: 0.16, color: C.green, strokeWidth: 2.5 });
  vBox.setFill(C.card, 0.95); vBox.moveTo([CX, verY, 0]);
  const vTxt = T('Check the 12 original measurements ✓', P ? 17 : 18, C.green, true, true);
  vTxt.moveTo([CX, verY + (P ? 0.30 : 0.20), 0]);
  const vStep = (verW - 1.4) / 12;
  const vBars = TEAS.A.map((v, i) => {
    const h = (v / 10) * (P ? 0.42 : 0.32) + 0.08;
    const b = new M.Rectangle({ width: vStep * 0.65, height: h, color: attrCol(i), strokeWidth: 1 });
    b.setFill(attrCol(i), 0.85);
    b.moveTo([CX - (verW - 1.4) / 2 + (i + 0.5) * vStep, verY - (P ? 0.48 : 0.35) + h / 2, 0]);
    return b;
  });
  const verifyBar = new M.VGroup(vBox, vTxt, ...vBars);

  await until(S(53));
  await play(
    new M.FadeIn(verifyBar, { runTime: 0.75 }),
    new M.Indicate(verifyBar, { color: C.green, runTime: 0.9 }),
    ...fbox(['Before trusting a gap', '1. Spot pattern on map', ['2. Check original data', C.green]], C.green),
    ...say('CHECK THE ORIGINAL MEASUREMENTS', C.green)
  );

  // S(54): Smaller map helps you explore; original data must support conclusions
  await until(S(54));
  await play(
    new M.Indicate(tsneCard, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(umapCard, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(verifyBar, { color: C.green, runTime: 1.0 }),
    ...fbox(['Remember', ['Map:      explore', C.cyan], ['Original: conclude', C.green]], C.green),
    ...say('MAP TO EXPLORE · ORIGINAL TO CONCLUDE', C.green)
  );
}
