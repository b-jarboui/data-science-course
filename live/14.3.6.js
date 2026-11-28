// 14.3.6 Nonnegative matrix factorization: building profiles from parts.
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const ATTRS = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rt', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const TEAS = [
    ['A', [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3], [2, 3]],
    ['B', [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3], [2, 3]],
    ['C', [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], [2, 7]],
    ['D', [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7], [2, 7]],
    ['E', [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3], [8, 3]],
    ['F', [9, 7, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3], [8, 3]],
    ['G', [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7], [8, 7]],
    ['H', [9, 7, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7], [8, 7]],
  ];
  const TEA_A = TEAS[0][1];

  // Layout constants: laptop 14.22 x 8 (y in [-3.0, 2.3]), phone 8 x 14.22 (y in [-5.5, 4.3])
  const CX = P ? 0 : -2.05;
  const PILL = P ? [0, 2.22, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, 3.42, 0] : [4.55, 1.12, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Single formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.39 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // Bar-chart geometry (12 attributes)
  const CHART_W = P ? 6.8 : 7.8;
  const DX = CHART_W / 12;
  const barX = k => CX - 5.5 * DX + k * DX;
  const attrCol = k => (k < 6 ? C.cyan : C.amber);

  function makeBar(x, baseY, val, unit, w, color, fillOp = 0.82, strokeW = 1.6) {
    const h = Math.max(0.03, val * unit);
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: strokeW });
    r.setFill(color, fillOp);
    r.moveTo([x, baseY + h / 2, 0]);
    return r;
  }

  // ---------------------------------------------------------------------------
  // ACT 1: 8 teas -> basic flavor patterns -> 8 x 12 table (sentences 0-3)
  // ---------------------------------------------------------------------------

  // S(0): Imagine you want to describe each of our eight teas using only a few basic flavor patterns.
  const introCards = [];
  TEAS.forEach(([letter, , [a1, a2]], i) => {
    const col = P ? i % 4 : i;
    const row = P ? Math.floor(i / 4) : 0;
    const x = P ? (col - 1.5) * 1.85 : (col - 3.5) * 1.48;
    const y = P ? (row === 0 ? 0.3 : -2.0) : 0.2;
    const cardW = P ? 1.6 : 1.26, cardH = P ? 1.9 : 1.45;
    const box = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.16, color: C.line, strokeWidth: 2 });
    box.setFill(C.card, 0.95); box.moveTo([x, y, 0]);
    const nm = T(`Tea ${letter}`, P ? 18 : 19, C.ink, false, true); nm.moveTo([x, y + (P ? 0.6 : 0.34), 0]);
    const bk = P ? 0.1 : 0.055, by = P ? 0.7 : 0.42, bw = P ? 0.32 : 0.24, bx = P ? 0.22 : 0.18;
    const b1 = new M.Rectangle({ width: bw, height: Math.max(0.12, a1 * bk), color: C.cyan, strokeWidth: 1 });
    b1.setFill(C.cyan, 0.85); b1.moveTo([x - bx, y - by + Math.max(0.12, a1 * bk) / 2, 0]);
    const b2 = new M.Rectangle({ width: bw, height: Math.max(0.12, a2 * bk), color: C.amber, strokeWidth: 1 });
    b2.setFill(C.amber, 0.85); b2.moveTo([x + bx, y - by + Math.max(0.12, a2 * bk) / 2, 0]);
    introCards.push(new M.VGroup(box, nm, b1, b2));
  });
  await until(S(0));
  await play(
    new M.LaggedStart(introCards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('8 TEAS → A FEW FLAVOR PATTERNS')
  );

  // S(1): Could you describe each tea as a mixture of these patterns?
  const mixY = P ? -4.0 : -1.75;
  const p1Chip = pill('PATTERN 1 (FLORAL–FRUIT)', C.cyan, P ? 15 : 17).moveTo([P ? -1.85 : -2.6, mixY, 0]);
  const plusIntro = T('+', P ? 28 : 30, C.green, true, true).moveTo([0, mixY, 0]);
  const p2Chip = pill('PATTERN 2 (ROAST–SMOKE)', C.amber, P ? 15 : 17).moveTo([P ? 1.85 : 2.6, mixY, 0]);
  const mixAsk = T('Mix these to describe any tea?', P ? 20 : 22, C.muted).moveTo([0, mixY - 0.72, 0]);
  await until(S(1));
  await play(
    new M.FadeIn(p1Chip, { runTime: 0.7 }),
    new M.FadeIn(plusIntro, { runTime: 0.7 }),
    new M.FadeIn(p2Chip, { runTime: 0.7 }),
    new M.FadeIn(mixAsk, { runTime: 0.7 }),
    ...say('A MIXTURE OF BASIC PATTERNS?', C.amber)
  );

  // S(2): Here are our eight teas, each with twelve tasting scores.
  const tblCols = 13;
  const tblStepX = P ? 0.55 : 0.84;
  const tblStepY = P ? 0.54 : 0.41;
  const tblLeft = -((tblCols - 1) * tblStepX) / 2;
  const tblTop = P ? 1.35 : 1.25;
  const tblItems = [];
  const rowAItems = [];

  const hdrTea = T('Tea', P ? 15 : 15, C.muted, true, true).moveTo([tblLeft, tblTop, 0]);
  tblItems.push(hdrTea);
  ATTRS.forEach((a, j) => {
    const t = T(a, P ? 15 : 14, attrCol(j), true, true);
    t.moveTo([tblLeft + (j + 1) * tblStepX, tblTop, 0]);
    tblItems.push(t);
  });
  const hdrLine = new M.Line({
    start: [tblLeft - tblStepX * 0.45, tblTop - tblStepY * 0.5, 0],
    end: [tblLeft + 12.5 * tblStepX, tblTop - tblStepY * 0.5, 0],
    color: C.line, strokeWidth: 2
  });
  const midDivTbl = new M.DashedLine({
    start: [tblLeft + 6.5 * tblStepX, tblTop + 0.2, 0],
    end: [tblLeft + 6.5 * tblStepX, tblTop - 8.5 * tblStepY, 0],
    color: C.muted
  });
  tblItems.push(hdrLine, midDivTbl);

  TEAS.forEach(([letter, scores], r) => {
    const y = tblTop - (r + 1) * tblStepY;
    const rl = T(letter, P ? 15 : 16, C.ink, true, true).moveTo([tblLeft, y, 0]);
    tblItems.push(rl);
    if (r === 0) rowAItems.push(rl);
    scores.forEach((v, j) => {
      const st = T(String(v), P ? 15 : 16, attrCol(j), true);
      st.moveTo([tblLeft + (j + 1) * tblStepX, y, 0]);
      tblItems.push(st);
      if (r === 0) rowAItems.push(st);
    });
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...introCards, p1Chip, plusIntro, p2Chip, mixAsk), { runTime: 0.55 }),
    new M.FadeIn(new M.VGroup(...tblItems), { runTime: 1.0 }),
    ...say('8 TEAS × 12 TASTING SCORES', C.cyan)
  );

  // S(3): Look at the twelve scores for tea A.
  const rowAY = tblTop - tblStepY;
  const rowAFrame = new M.RoundedRectangle({
    width: tblCols * tblStepX + 0.16,
    height: tblStepY * 0.92,
    cornerRadius: 0.08,
    color: C.cyan,
    strokeWidth: 2.5
  });
  rowAFrame.setFill(C.cyan, 0.1);
  rowAFrame.moveTo([0, rowAY, -0.005]);
  await until(S(3));
  await play(
    new M.Create(rowAFrame, { runTime: 0.7 }),
    ...say('FOCUS ON TEA A', C.cyan)
  );

  // ---------------------------------------------------------------------------
  // ACT 2: Tea A's 12 bars (sentences 4-6)
  // ---------------------------------------------------------------------------
  const BAR_BASE = P ? -3.3 : -1.9;
  const BAR_U = P ? 0.8 : 0.62;
  const BAR_W = DX * 0.66;

  const axisA = new M.Line({
    start: [barX(0) - DX * 0.55, BAR_BASE, 0],
    end: [barX(11) + DX * 0.55, BAR_BASE, 0],
    color: C.muted, strokeWidth: 2
  });
  const divA = new M.DashedLine({
    start: [(barX(5) + barX(6)) / 2, BAR_BASE - 0.08, 0],
    end: [(barX(5) + barX(6)) / 2, BAR_BASE + 3.55 * BAR_U, 0],
    color: C.muted
  });
  const teaABadge = pill('TEA A', C.cyan, P ? 15 : 16).moveTo([barX(0) + 0.25, BAR_BASE + 3.65 * BAR_U, 0]);
  const attrLabelsA = ATTRS.map((a, k) => T(a, P ? 15 : 14, attrCol(k), true).moveTo([barX(k), BAR_BASE - 0.3, 0]));
  const barsA = TEA_A.map((v, k) => makeBar(barX(k), BAR_BASE, v, BAR_U, BAR_W, attrCol(k), 0.82, 1.5));
  const valsA = TEA_A.map((v, k) => T(String(v), P ? 15 : 17, attrCol(k), true, true).moveTo([barX(k), BAR_BASE + v * BAR_U + 0.24, 0]));

  // S(4): The first six scores are one, three, two, two, two and two.
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...tblItems, rowAFrame), { runTime: 0.5 }),
    new M.Create(axisA, { runTime: 0.6 }),
    new M.Create(divA, { runTime: 0.6 }),
    new M.FadeIn(teaABadge, { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...attrLabelsA), { runTime: 0.5 }),
    new M.LaggedStart(barsA.slice(0, 6).map((b, k) => new M.FadeIn(new M.VGroup(b, valsA[k]))), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('FIRST 6: 1, 3, 2, 2, 2, 2', C.cyan)
  );

  // S(5): The last six scores are all three.
  await until(S(5));
  await play(
    new M.LaggedStart(barsA.slice(6, 12).map((b, k) => new M.FadeIn(new M.VGroup(b, valsA[k + 6]))), { lagRatio: 0.1, runTime: 0.9 }),
    ...say('LAST 6: ALL 3', C.amber)
  );

  // S(6): Notice that the scores within each group are similar.
  const grp1Line = new M.DashedLine({
    start: [barX(0) - DX * 0.4, BAR_BASE + 2 * BAR_U, 0],
    end: [barX(5) + DX * 0.4, BAR_BASE + 2 * BAR_U, 0],
    color: C.cyan
  });
  const grp2Line = new M.DashedLine({
    start: [barX(6) - DX * 0.4, BAR_BASE + 3 * BAR_U, 0],
    end: [barX(11) + DX * 0.4, BAR_BASE + 3 * BAR_U, 0],
    color: C.amber
  });
  const grp1Tag = T('group 1 ≈ 2', P ? 15 : 16, C.cyan, true).moveTo([(barX(0) + barX(5)) / 2, BAR_BASE - 0.72, 0]);
  const grp2Tag = T('group 2 = 3', P ? 15 : 16, C.amber, true).moveTo([(barX(6) + barX(11)) / 2, BAR_BASE - 0.72, 0]);
  await until(S(6));
  await play(
    new M.Create(grp1Line, { runTime: 0.7 }),
    new M.Create(grp2Line, { runTime: 0.7 }),
    new M.FadeIn(grp1Tag, { runTime: 0.6 }),
    new M.FadeIn(grp2Tag, { runTime: 0.6 }),
    ...say('SCORES IN EACH GROUP ARE SIMILAR', C.green)
  );

  // ---------------------------------------------------------------------------
  // ACT 3: Two basic parts -> copies -> add -> compare with Tea A (sentences 7-16)
  // ---------------------------------------------------------------------------
  const P1_BASE = P ? -0.6 : 0.15;
  const P2_BASE = P ? -4.1 : -2.15;
  const BLOCK_U = P ? 0.42 : 0.36;
  const BLOCK_W = DX * 0.64;

  function unitBlock(x, baseY, level, color) {
    const h = BLOCK_U * 0.84;
    const b = new M.Rectangle({ width: BLOCK_W, height: h, color, strokeWidth: 1.5 });
    b.setFill(color, 0.82);
    b.moveTo([x, baseY + (level + 0.5) * BLOCK_U, 0]);
    return b;
  }

  const p1Axis = new M.Line({ start: [barX(0) - DX * 0.5, P1_BASE, 0], end: [barX(11) + DX * 0.5, P1_BASE, 0], color: C.muted, strokeWidth: 2 });
  const p2Axis = new M.Line({ start: [barX(0) - DX * 0.5, P2_BASE, 0], end: [barX(11) + DX * 0.5, P2_BASE, 0], color: C.muted, strokeWidth: 2 });
  const p1Title = T('Part 1', P ? 18 : 19, C.cyan, true, true).moveTo([barX(0) + 0.25, P1_BASE + 2.45 * BLOCK_U, 0]);
  const p2Title = T('Part 2', P ? 18 : 19, C.amber, true, true).moveTo([barX(0) + 0.25, P2_BASE + 3.45 * BLOCK_U, 0]);
  const partAttrLabels = ATTRS.map((a, k) => T(a, P ? 15 : 14, attrCol(k), true).moveTo([barX(k), P2_BASE - 0.32, 0]));

  // S(7): Imagine building a tasting profile using two basic parts, like mixing two ingredients.
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(axisA, divA, teaABadge, ...attrLabelsA, ...barsA, ...valsA, grp1Line, grp2Line, grp1Tag, grp2Tag), { runTime: 0.55 }),
    new M.Create(p1Axis, { runTime: 0.7 }),
    new M.Create(p2Axis, { runTime: 0.7 }),
    new M.FadeIn(p1Title, { runTime: 0.6 }),
    new M.FadeIn(p2Title, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...partAttrLabels), { runTime: 0.6 }),
    ...say('BUILD FROM 2 BASIC PARTS', C.cyan)
  );

  // S(8): Draw the first part with a score of one for each of the first six attributes.
  const p1Row0 = Array.from({ length: 6 }, (_, k) => unitBlock(barX(k), P1_BASE, 0, C.cyan));
  const p1Ones = Array.from({ length: 6 }, (_, k) => T('1', P ? 15 : 15, C.cyan, true).moveTo([barX(k), P1_BASE + BLOCK_U + 0.2, 0]));
  await until(S(8));
  await play(
    new M.LaggedStart(p1Row0.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.0 }),
    new M.LaggedStart(p1Ones.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('PART 1: FIRST 6 = 1', C.cyan)
  );

  // S(9): Its last six scores are zero.
  const p1Zeros = Array.from({ length: 6 }, (_, k) => T('0', P ? 15 : 15, C.muted, true).moveTo([barX(k + 6), P1_BASE + 0.2, 0]));
  await until(S(9));
  await play(
    new M.LaggedStart(p1Zeros.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 0.7 }),
    ...say('PART 1: LAST 6 = 0', C.muted)
  );

  // S(10): Draw the second part with a score of one for each of the last six attributes.
  const p2Row0 = Array.from({ length: 6 }, (_, k) => unitBlock(barX(k + 6), P2_BASE, 0, C.amber));
  const p2Ones = Array.from({ length: 6 }, (_, k) => T('1', P ? 15 : 15, C.amber, true).moveTo([barX(k + 6), P2_BASE + BLOCK_U + 0.2, 0]));
  await until(S(10));
  await play(
    new M.LaggedStart(p2Row0.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.0 }),
    new M.LaggedStart(p2Ones.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('PART 2: LAST 6 = 1', C.amber)
  );

  // S(11): Its first six scores are zero.
  const p2Zeros = Array.from({ length: 6 }, (_, k) => T('0', P ? 15 : 15, C.muted, true).moveTo([barX(k), P2_BASE + 0.2, 0]));
  await until(S(11));
  await play(
    new M.LaggedStart(p2Zeros.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 0.7 }),
    ...say('PART 2: FIRST 6 = 0', C.muted)
  );

  // S(12): Take two copies of the first part and three copies of the second part.
  const p1Row1 = Array.from({ length: 6 }, (_, k) => unitBlock(barX(k), P1_BASE, 1, C.cyan));
  const p2Row1 = Array.from({ length: 6 }, (_, k) => unitBlock(barX(k + 6), P2_BASE, 1, C.amber));
  const p2Row2 = Array.from({ length: 6 }, (_, k) => unitBlock(barX(k + 6), P2_BASE, 2, C.amber));
  const p1CopyTag = pill('× 2 COPIES', C.cyan, P ? 15 : 15).moveTo([barX(8.5), P1_BASE + 1.5 * BLOCK_U, 0]);
  const p2CopyTag = pill('× 3 COPIES', C.amber, P ? 15 : 15).moveTo([barX(2.5), P2_BASE + 2.0 * BLOCK_U, 0]);
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...p1Ones, ...p2Ones), { runTime: 0.4 }),
    new M.LaggedStart(p1Row1.map(b => new M.FadeIn(b)), { lagRatio: 0.06, runTime: 0.9 }),
    new M.LaggedStart([...p2Row1, ...p2Row2].map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.1 }),
    new M.FadeIn(p1CopyTag, { runTime: 0.6 }),
    new M.FadeIn(p2CopyTag, { runTime: 0.6 }),
    ...fbox([['2 × Part 1', C.cyan], ['3 × Part 2', C.amber]]),
    ...say('2 COPIES OF PART 1 · 3 OF PART 2', C.amber)
  );

  // S(13): Add these copies together to build one tasting profile.
  const COMB_BASE = P ? -3.3 : -1.9;
  const COMB_U = P ? 0.75 : 0.54;
  const combAxis = new M.Line({ start: [barX(0) - DX * 0.55, COMB_BASE, 0], end: [barX(11) + DX * 0.55, COMB_BASE, 0], color: C.muted, strokeWidth: 2 });
  const combAttrLabels = ATTRS.map((a, k) => T(a, P ? 15 : 14, attrCol(k), true).moveTo([barX(k), COMB_BASE - 0.3, 0]));
  const moveAnims = [
    ...p1Row0.map((b, k) => new M.Transform(b, makeBar(barX(k), COMB_BASE, 1, COMB_U, BLOCK_W, C.cyan, 0.82, 1.4), { runTime: 1.2 })),
    ...p1Row1.map((b, k) => new M.Transform(b, makeBar(barX(k), COMB_BASE + COMB_U, 1, COMB_U, BLOCK_W, C.cyan, 0.82, 1.4), { runTime: 1.2 })),
    ...p2Row0.map((b, k) => new M.Transform(b, makeBar(barX(k + 6), COMB_BASE, 1, COMB_U, BLOCK_W, C.amber, 0.82, 1.4), { runTime: 1.2 })),
    ...p2Row1.map((b, k) => new M.Transform(b, makeBar(barX(k + 6), COMB_BASE + COMB_U, 1, COMB_U, BLOCK_W, C.amber, 0.82, 1.4), { runTime: 1.2 })),
    ...p2Row2.map((b, k) => new M.Transform(b, makeBar(barX(k + 6), COMB_BASE + 2 * COMB_U, 1, COMB_U, BLOCK_W, C.amber, 0.82, 1.4), { runTime: 1.2 })),
  ];
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(p1Axis, p2Axis, p1Title, p2Title, ...p1Zeros, ...p2Zeros, p1CopyTag, p2CopyTag, ...partAttrLabels), { runTime: 0.45 }),
    new M.Create(combAxis, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...combAttrLabels), { runTime: 0.6 }),
    ...moveAnims,
    ...fbox([['2 × Part 1 + 3 × Part 2', C.green]], C.green),
    ...say('ADD THE COPIES TOGETHER', C.green)
  );

  // S(14): The result has six scores of two and six scores of three.
  const rebVals = [2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
  const rebNumLabels = rebVals.map((v, k) => T(String(v), P ? 15 : 17, attrCol(k), true, true).moveTo([barX(k), COMB_BASE + v * COMB_U + 0.24, 0]));
  await until(S(14));
  await play(
    new M.LaggedStart(rebNumLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.05, runTime: 0.9 }),
    ...fbox(['rebuilt profile:', ['2, 2, 2, 2, 2, 2', C.cyan], ['3, 3, 3, 3, 3, 3', C.amber]]),
    ...say('RESULT: SIX 2s AND SIX 3s', C.cyan)
  );

  // S(15): Compare this profile with the original scores for tea A.
  // Show original Tea A (filled) right beside rebuilt (outlined)
  const PAIR_W = DX * 0.36;
  const PAIR_OFF = DX * 0.20;
  const cmpOrigBars = TEA_A.map((v, k) => makeBar(barX(k) - PAIR_OFF, COMB_BASE, v, COMB_U, PAIR_W, attrCol(k), 0.85, 1.4));
  const cmpRebBars = rebVals.map((v, k) => makeBar(barX(k) + PAIR_OFF, COMB_BASE, v, COMB_U, PAIR_W, attrCol(k), 0.12, 2.4));
  const legY = COMB_BASE + 3.55 * COMB_U;
  const legOrigSq = new M.Rectangle({ width: 0.22, height: 0.22, color: C.cyan, strokeWidth: 1.5 });
  legOrigSq.setFill(C.cyan, 0.85); legOrigSq.moveTo([barX(1.2), legY, 0]);
  const legOrigTx = T('Tea A (original)', P ? 15 : 15, C.ink).moveTo([barX(3.3), legY, 0]);
  const legRebSq = new M.Rectangle({ width: 0.22, height: 0.22, color: C.amber, strokeWidth: 2.4 });
  legRebSq.setFill(C.amber, 0.12); legRebSq.moveTo([barX(7.2), legY, 0]);
  const legRebTx = T('Rebuilt (outline)', P ? 15 : 15, C.ink).moveTo([barX(9.4), legY, 0]);
  const cmpLegend = new M.VGroup(legOrigSq, legOrigTx, legRebSq, legRebTx);

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(...p1Row0, ...p1Row1, ...p2Row0, ...p2Row1, ...p2Row2, ...rebNumLabels), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...cmpOrigBars, ...cmpRebBars, cmpLegend), { runTime: 0.9 }),
    ...say('COMPARE WITH ORIGINAL TEA A', C.amber)
  );

  // S(16): Ten scores match exactly, while floral and jasmine each differ by one.
  const flGap = new M.Line({
    start: [barX(0), COMB_BASE + 1 * COMB_U, 0],
    end: [barX(0), COMB_BASE + 2 * COMB_U, 0],
    color: C.pink, strokeWidth: 4
  });
  const jaGap = new M.Line({
    start: [barX(1), COMB_BASE + 2 * COMB_U, 0],
    end: [barX(1), COMB_BASE + 3 * COMB_U, 0],
    color: C.pink, strokeWidth: 4
  });
  const flTag = T('1 vs 2', P ? 15 : 13, C.pink, true, true).moveTo([barX(0), COMB_BASE + 2.35 * COMB_U, 0]);
  const jaTag = T('3 vs 2', P ? 15 : 13, C.pink, true, true).moveTo([barX(1), COMB_BASE + 3.35 * COMB_U, 0]);
  const fjBox = new M.RoundedRectangle({
    width: DX * 2.1, height: 3.45 * COMB_U, cornerRadius: 0.1, color: C.pink, strokeWidth: 2
  });
  fjBox.setFill(C.pink, 0.06);
  fjBox.moveTo([(barX(0) + barX(1)) / 2, COMB_BASE + 1.72 * COMB_U, -0.01]);
  const matchTicks = Array.from({ length: 10 }, (_, i) => {
    const k = i + 2;
    return T('✓', P ? 15 : 15, C.green, true).moveTo([barX(k), COMB_BASE + TEA_A[k] * COMB_U + 0.24, 0]);
  });

  await until(S(16));
  await play(
    new M.Create(fjBox, { runTime: 0.7 }),
    new M.Create(flGap, { runTime: 0.7 }),
    new M.Create(jaGap, { runTime: 0.7 }),
    new M.FadeIn(flTag, { runTime: 0.6 }),
    new M.FadeIn(jaTag, { runTime: 0.6 }),
    new M.LaggedStart(matchTicks.map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 0.8 }),
    ...fbox([['10 scores match exactly', C.green], ['Floral:  1 vs 2 (diff 1)', C.pink], ['Jasmine: 3 vs 2 (diff 1)', C.pink]], C.pink),
    ...say('10 MATCH · FLORAL & JASMINE DIFFER BY 1', C.pink)
  );

  // ---------------------------------------------------------------------------
  // ACT 4: Nonnegative, Matrix, Matrix Factorization, NMF (sentences 17-22)
  // ---------------------------------------------------------------------------

  // S(17): Notice that we only add parts to build our profile.
  const eqY = P ? -0.2 : -0.1;
  const eq1 = pill('2 × Part 1', C.cyan, P ? 17 : 19).moveTo([CX - (P ? 2.1 : 2.5), eqY, 0]);
  const eqPlus = new M.Circle({ radius: 0.34, color: C.green, strokeWidth: 3 });
  eqPlus.setFill(C.green, 0.18); eqPlus.moveTo([CX - (P ? 0.65 : 0.85), eqY, 0]);
  const eqPlusTx = T('+', 28, C.green, true, true).moveTo([CX - (P ? 0.65 : 0.85), eqY, 0]);
  const eq2 = pill('3 × Part 2', C.amber, P ? 17 : 19).moveTo([CX + (P ? 0.85 : 0.9), eqY, 0]);
  const eqEq = T('=', 26, C.ink, true, true).moveTo([CX + (P ? 2.15 : 2.45), eqY, 0]);
  const eqOut = pill('Profile', C.green, P ? 17 : 19).moveTo([CX + (P ? 3.05 : 3.45), eqY, 0]);
  const eqGroup = [eq1, eqPlus, eqPlusTx, eq2, eqEq, eqOut];

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(combAxis, ...combAttrLabels, ...cmpOrigBars, ...cmpRebBars, cmpLegend, fjBox, flGap, jaGap, flTag, jaTag, ...matchTicks), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...eqGroup), { runTime: 0.8 }),
    ...fbox([['Only add parts (+)', C.green], 'never subtract'], C.green),
    ...say('ONLY ADD PARTS TO BUILD', C.green)
  );

  // S(18): Every part and every amount is zero or positive, never negative.
  const nlY = P ? -2.25 : -1.55;
  const nlW = P ? 6.4 : 7.0;
  const nlX = v => CX + (v - 0.5) * (nlW / 7);
  const nlNeg = new M.Line({ start: [nlX(-3), nlY, 0], end: [nlX(0), nlY, 0], color: C.pink, strokeWidth: 3 });
  nlNeg.setStrokeOpacity(0.45);
  const nlPos = new M.Line({ start: [nlX(0), nlY, 0], end: [nlX(4), nlY, 0], color: C.green, strokeWidth: 4.5 });
  const nlTicks = [-3, -2, -1, 0, 1, 2, 3, 4].map(v => new M.VGroup(
    new M.Line({ start: [nlX(v), nlY - 0.1, 0], end: [nlX(v), nlY + 0.1, 0], color: v < 0 ? C.pink : C.green }),
    T(String(v), P ? 15 : 16, v < 0 ? C.pink : C.green, true).moveTo([nlX(v), nlY - 0.38, 0])
  ));
  const nlCross = T('×  never negative', P ? 15 : 16, C.pink, true).moveTo([nlX(-1.6), nlY + 0.45, 0]);
  const nlDots = [0, 1, 2, 3].map(v => new M.Dot({ point: [nlX(v), nlY, 0], radius: 0.1, color: C.green }));

  await until(S(18));
  await play(
    new M.Create(nlNeg, { runTime: 0.6 }),
    new M.Create(nlPos, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...nlTicks, nlCross, ...nlDots), { runTime: 0.7 }),
    ...say('ZERO OR POSITIVE · NEVER NEGATIVE', C.green)
  );

  // S(19): We call numbers that are zero or positive nonnegative numbers.
  const nnBadge = pill('NONNEGATIVE (≥ 0)', C.green, P ? 16 : 17).moveTo([nlX(2.0), nlY + 0.55, 0]);
  await until(S(19));
  await play(
    new M.FadeIn(nnBadge, { runTime: 0.7 }),
    ...fbox([['nonnegative numbers:', C.green], '0, 1, 2, 3, ... (≥ 0)'], C.green),
    ...say('NONNEGATIVE = ZERO OR POSITIVE', C.green)
  );

  // S(20): A table of numbers arranged in rows and columns is called a matrix.
  // Stylized 8 x 12 matrix on left stage
  const matY = P ? -1.6 : -0.45;
  const dmW = P ? 4.6 : 5.0, dmH = P ? 3.9 : 2.7;
  const dmRect = new M.RoundedRectangle({ width: dmW, height: dmH, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2.4 });
  dmRect.setFill(C.card, 0.95); dmRect.moveTo([CX, matY, 0]);
  const dmCells = [];
  for (let r = 0; r < 8; r++) {
    const cy = matY + dmH / 2 - (r + 0.5) * (dmH / 8);
    const rLab = T(TEAS[r][0], P ? 15 : 12, C.muted, true).moveTo([CX - dmW / 2 - 0.25, cy, 0]);
    dmCells.push(rLab);
    for (let c = 0; c < 12; c++) {
      const cx = CX - dmW / 2 + (c + 0.5) * (dmW / 12);
      const val = TEAS[r][1][c];
      const cell = new M.Rectangle({ width: dmW / 12 - 0.04, height: dmH / 8 - 0.04, color: attrCol(c), strokeWidth: 0.5 });
      cell.setFill(attrCol(c), 0.14 + (val / 10) * 0.62);
      cell.moveTo([cx, cy, 0]);
      dmCells.push(cell);
    }
  }
  const dmRowLbl = T('8 rows (teas)', P ? 15 : 15, C.ink).moveTo([CX - dmW / 2 + 0.85, matY - dmH / 2 - 0.34, 0]);
  const dmColLbl = T('12 columns (scores)', P ? 15 : 15, C.cyan).moveTo([CX + dmW / 2 - 1.15, matY + dmH / 2 + 0.32, 0]);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...eqGroup, nlNeg, nlPos, ...nlTicks, nlCross, ...nlDots, nnBadge), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(dmRect, ...dmCells, dmRowLbl, dmColLbl), { runTime: 0.9 }),
    ...fbox([['matrix:', C.cyan], 'table of rows & columns', '8 rows × 12 columns']),
    ...say('MATRIX = TABLE OF ROWS & COLUMNS', C.cyan)
  );

  // S(21): Replacing one large matrix with smaller matrices that combine to rebuild it is called matrix factorization.
  // Layout: [Data 8x12] ≈ [Amounts 8x2] × [Parts 2x12]
  const mfY = P ? -1.1 : -0.5;
  const mfDataX = CX - (P ? 2.25 : 2.75);
  const mfAmtX = CX + (P ? 0.05 : 0.0);
  const mfPartX = CX + (P ? 2.1 : 2.45);

  const mfData = new M.RoundedRectangle({ width: P ? 2.1 : 2.3, height: P ? 2.3 : 2.3, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2 });
  mfData.setFill(C.card, 0.95); mfData.moveTo([mfDataX, mfY, 0]);
  const mfDataT1 = T('Data', P ? 16 : 17, C.cyan, true, true).moveTo([mfDataX, mfY + 0.25, 0]);
  const mfDataT2 = T('8 × 12', P ? 15 : 15, C.muted, true).moveTo([mfDataX, mfY - 0.2, 0]);

  const mfApprox = T('≈', P ? 24 : 26, C.ink, true, true).moveTo([(mfDataX + mfAmtX) / 2 + 0.22, mfY, 0]);

  const mfAmtW = P ? 1.35 : 1.45, mfAmtH = P ? 2.55 : 2.45;
  const mfAmt = new M.RoundedRectangle({ width: mfAmtW, height: mfAmtH, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.2 });
  mfAmt.setFill(C.card, 0.95); mfAmt.moveTo([mfAmtX, mfY, 0]);
  const mfAmtHdr = T('Amounts', P ? 15 : 15, C.amber, true, true).moveTo([mfAmtX, mfY + mfAmtH / 2 + 0.26, 0]);
  const mfAmtDim = T('8 × 2', P ? 15 : 14, C.muted, true).moveTo([mfAmtX, mfY - mfAmtH / 2 - 0.26, 0]);
  const mfAmtRows = TEAS.map(([letter, , [a1, a2]], r) => {
    const ry = mfY + mfAmtH / 2 - (r + 0.5) * (mfAmtH / 8);
    return new M.VGroup(
      T(letter, P ? 15 : 12, C.muted, true).moveTo([mfAmtX - 0.42, ry, 0]),
      T(String(a1), P ? 15 : 13, C.cyan, true).moveTo([mfAmtX + 0.02, ry, 0]),
      T(String(a2), P ? 15 : 13, C.amber, true).moveTo([mfAmtX + 0.40, ry, 0])
    );
  });

  const mfTimes = T('×', P ? 24 : 26, C.ink, true, true).moveTo([(mfAmtX + mfPartX) / 2 - 0.22, mfY, 0]);

  const mfPartW = P ? 2.15 : 2.45, mfPartH = P ? 1.05 : 1.05;
  const mfPart = new M.RoundedRectangle({ width: mfPartW, height: mfPartH, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2.2 });
  mfPart.setFill(C.card, 0.95); mfPart.moveTo([mfPartX, mfY, 0]);
  const mfPartHdr = T('Parts', P ? 15 : 15, C.cyan, true, true).moveTo([mfPartX, mfY + mfPartH / 2 + 0.26, 0]);
  const mfPartDim = T('2 × 12', P ? 15 : 14, C.muted, true).moveTo([mfPartX, mfY - mfPartH / 2 - 0.26, 0]);
  const mfPartR1 = T('1 1 1 1 1 1  0 0 0 0 0 0', P ? 15 : 11, C.cyan, true).moveTo([mfPartX, mfY + 0.22, 0]);
  const mfPartR2 = T('0 0 0 0 0 0  1 1 1 1 1 1', P ? 15 : 11, C.amber, true).moveTo([mfPartX, mfY - 0.22, 0]);

  const mfObjs = [mfData, mfDataT1, mfDataT2, mfApprox, mfAmt, mfAmtHdr, mfAmtDim, ...mfAmtRows, mfTimes, mfPart, mfPartHdr, mfPartDim, mfPartR1, mfPartR2];

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(dmRect, ...dmCells, dmRowLbl, dmColLbl), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...mfObjs), { runTime: 1.0 }),
    ...fbox([['Matrix factorization:', C.amber], '8×12 ≈ (8×2) × (2×12)', 'Data ≈ Amounts × Parts'], C.amber),
    ...say('MATRIX FACTORIZATION', C.amber)
  );

  // S(22): When the parts and their amounts cannot be negative, we call this nonnegative matrix factorization.
  const amtGe0 = pill('≥ 0', C.green, P ? 15 : 15).moveTo([mfAmtX, mfY + mfAmtH / 2 + 0.68, 0]);
  const partGe0 = pill('≥ 0', C.green, P ? 15 : 15).moveTo([mfPartX, mfY + mfPartH / 2 + 0.68, 0]);
  await until(S(22));
  await play(
    new M.FadeIn(amtGe0, { runTime: 0.7 }),
    new M.FadeIn(partGe0, { runTime: 0.7 }),
    ...fbox([['NMF (Nonnegative):', C.green], ['Amounts ≥ 0', C.green], ['Parts   ≥ 0', C.green]], C.green),
    ...say('NONNEGATIVE MATRIX FACTORIZATION', C.green)
  );

  // ---------------------------------------------------------------------------
  // ACT 5: Iterative learning of Tea A's amounts (sentences 23-46)
  // ---------------------------------------------------------------------------

  // S(23): But how can a computer learn how much of each part to use?
  const amtQ = pill('LEARN THESE?', C.amber, P ? 15 : 15).moveTo([mfAmtX, mfY - mfAmtH / 2 - 0.72, 0]);
  await until(S(23));
  await play(
    new M.Indicate(mfAmt, { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(amtQ, { runTime: 0.6 }),
    ...say('HOW TO LEARN THE AMOUNTS?', C.amber)
  );

  // Build unified iterative-learning stage for S(24)..S(46)
  const L_BASE = P ? -1.85 : -2.15;
  const L_U = P ? 0.56 : 0.62;
  const L_PAIR_W = DX * 0.36;
  const L_OFF = DX * 0.20;

  const lAxis = new M.Line({ start: [barX(0) - DX * 0.55, L_BASE, 0], end: [barX(11) + DX * 0.55, L_BASE, 0], color: C.muted, strokeWidth: 2 });
  const lDiv = new M.DashedLine({
    start: [(barX(5) + barX(6)) / 2, L_BASE - 0.08, 0],
    end: [(barX(5) + barX(6)) / 2, L_BASE + 3.45 * L_U, 0],
    color: C.muted
  });
  const lAttrLbls = ATTRS.map((a, k) => T(a, P ? 15 : 14, attrCol(k), true).moveTo([barX(k), L_BASE - 0.3, 0]));
  const lOrigBars = TEA_A.map((v, k) => makeBar(barX(k) - L_OFF, L_BASE, v, L_U, L_PAIR_W, attrCol(k), 0.85, 1.4));
  const lLegY = L_BASE + 4.3 * L_U;
  const lLegA = new M.Rectangle({ width: 0.2, height: 0.2, color: C.cyan, strokeWidth: 1.4 });
  lLegA.setFill(C.cyan, 0.85); lLegA.moveTo([barX(0.4), lLegY, 0]);
  const lLegATx = T('Tea A', P ? 15 : 15, C.ink).moveTo([barX(1.75), lLegY, 0]);
  const lLegG = new M.Rectangle({ width: 0.2, height: 0.2, color: C.amber, strokeWidth: 2.3 });
  lLegG.setFill(C.amber, 0.14); lLegG.moveTo([barX(4.2), lLegY, 0]);
  const lLegGTx = T('Guess', P ? 15 : 15, C.ink).moveTo([barX(5.55), lLegY, 0]);
  const lFixedTag = pill('PARTS FIXED', C.muted, P ? 15 : 13).moveTo([barX(9.4), lLegY, 0]);

  // S(24): For now, keep our two basic parts fixed and let the computer learn their amounts.
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...mfObjs, amtGe0, partGe0, amtQ), { runTime: 0.5 }),
    new M.Create(lAxis, { runTime: 0.6 }),
    new M.Create(lDiv, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...lAttrLbls, ...lOrigBars, lLegA, lLegATx, lLegG, lLegGTx, lFixedTag), { runTime: 0.8 }),
    ...fbox(['Parts: fixed', ['Learn: amount 1, amount 2', C.amber]]),
    ...say('KEEP PARTS FIXED · LEARN AMOUNTS', C.cyan)
  );

  // S(25): Start with zero copies of the first part and one copy of the second part.
  // Phone only: big start-amount readouts fill the lower third until the loss chart arrives (S30).
  const phStart = P ? [
    pill('amount 1 = 0', C.cyan, 22).moveTo([-1.55, -3.95, 0]),
    pill('amount 2 = 1', C.amber, 22).moveTo([1.55, -3.95, 0])
  ] : [];
  const phLoss = P ? pill('total squared error = 50', C.pink, 22).moveTo([0, -4.9, 0]) : null;
  await until(S(25));
  await play(
    ...phStart.map(o => new M.FadeIn(o, { runTime: 0.6 })),
    ...fbox(['Step 0 (start)', ['amount 1 = 0', C.cyan], ['amount 2 = 1', C.amber]], C.amber),
    ...say('START: AMOUNT 1 = 0, AMOUNT 2 = 1', C.amber)
  );

  // S(26): Our first guess has six scores of zero and six scores of one.
  const guessBars = Array.from({ length: 12 }, (_, k) =>
    makeBar(barX(k) + L_OFF, L_BASE, k < 6 ? 0 : 1, L_U, L_PAIR_W, attrCol(k), 0.14, 2.4)
  );
  const g0Labels = Array.from({ length: 12 }, (_, k) => {
    const v = k < 6 ? 0 : 1;
    return T(String(v), P ? 15 : 14, attrCol(k), true).moveTo([barX(k) + L_OFF, L_BASE + v * L_U + 0.22, 0]);
  });
  await until(S(26));
  await play(
    new M.LaggedStart(guessBars.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 0.8 }),
    new M.LaggedStart(g0Labels.map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 0.8 }),
    ...say('FIRST GUESS: SIX 0s, SIX 1s', C.amber)
  );

  // S(27): Subtract each guessed score from its original score to find the difference.
  const diffs0 = TEA_A.map((v, k) => v - (k < 6 ? 0 : 1));
  const diffLines0 = diffs0.map((d, k) => {
    const g = k < 6 ? 0 : 1;
    return new M.Line({
      start: [barX(k) + L_OFF, L_BASE + g * L_U, 0],
      end: [barX(k) + L_OFF, L_BASE + TEA_A[k] * L_U, 0],
      color: C.pink, strokeWidth: 3.2
    });
  });
  const diffLbls0 = diffs0.map((d, k) =>
    T(String(d), P ? 15 : 14, C.pink, true, true).moveTo([barX(k), L_BASE + TEA_A[k] * L_U + 0.24, 0])
  );
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...g0Labels), { runTime: 0.35 }),
    new M.LaggedStart(diffLines0.map(ln => new M.Create(ln)), { lagRatio: 0.04, runTime: 0.8 }),
    new M.LaggedStart(diffLbls0.map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 0.8 }),
    ...fbox(['differences (orig − guess):', ['1, 3, 2, 2, 2, 2', C.cyan], ['2, 2, 2, 2, 2, 2', C.amber]], C.pink),
    ...say('DIFFERENCE = ORIGINAL − GUESS', C.pink)
  );

  // S(28): Square every difference and add the results.
  await until(S(28));
  await play(
    new M.LaggedStart(diffLbls0.map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.04, runTime: 0.8 }),
    ...fbox(['square & add:', ['1+9+4+4+4+4 = 26', C.cyan], ['4+4+4+4+4+4 = 24', C.amber]], C.pink),
    ...say('SQUARE EVERY DIFFERENCE AND ADD', C.pink)
  );

  // S(29): This gives a total squared error of fifty.
  await until(S(29));
  await play(
    ...(phLoss ? [new M.FadeIn(phLoss, { runTime: 0.6 })] : []),
    ...fbox(['26 + 24', ['total squared error = 50', C.pink]], C.pink),
    ...say('TOTAL SQUARED ERROR = 50', C.pink)
  );

  // S(30): We use this error as our loss, a number we want to make smaller.
  // Loss-vs-Step curve geometry
  const LC_X0 = P ? -2.7 : 2.95, LC_X1 = P ? 2.9 : 6.25;
  const LC_Y0 = P ? -5.1 : -2.55, LC_Y1 = P ? -3.2 : -0.55;
  const lcX = step => LC_X0 + (step / 8) * (LC_X1 - LC_X0);
  const lcY = loss => LC_Y0 + (Math.min(55, loss) / 55) * (LC_Y1 - LC_Y0);

  const lcAxX = new M.Line({ start: [LC_X0, LC_Y0, 0], end: [LC_X1 + 0.15, LC_Y0, 0], color: C.muted, strokeWidth: 2 });
  const lcAxY = new M.Line({ start: [LC_X0, LC_Y0, 0], end: [LC_X0, LC_Y1 + 0.12, 0], color: C.muted, strokeWidth: 2 });
  const lcTitle = T('Loss vs Step', P ? 15 : 15, C.pink, true, true).moveTo([(LC_X0 + LC_X1) / 2, LC_Y1 + 0.22, 0]);
  const lcXLab = T('step', P ? 15 : 13, C.muted, true).moveTo([LC_X1 + 0.45, LC_Y0, 0]);
  const lcYTicks = [0, 25, 50].map(v => T(String(v), P ? 15 : 12, C.muted, true).moveTo([LC_X0 - 0.3, lcY(v), 0]));
  const lcXTicks = [0, 2, 4, 6, 8].map(st => T(String(st), P ? 15 : 12, C.muted, true).moveTo([lcX(st), LC_Y0 - 0.26, 0]));
  const lossDot0 = new M.Dot({ point: [lcX(0), lcY(50), 0], radius: 0.08, color: C.pink });
  const lossLbl0 = T('50', P ? 15 : 13, C.pink, true).moveTo([lcX(0) + 0.28, lcY(50) + 0.08, 0]);
  const lossCurveObjs = [lcAxX, lcAxY, lcTitle, lcXLab, ...lcYTicks, ...lcXTicks, lossDot0, lossLbl0];

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...diffLines0, ...diffLbls0), { runTime: 0.4 }),
    ...(P ? [new M.FadeOut(new M.VGroup(...phStart, phLoss), { runTime: 0.4 })] : []),
    new M.Create(lcAxX, { runTime: 0.6 }),
    new M.Create(lcAxY, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(lcTitle, lcXLab, ...lcYTicks, ...lcXTicks, lossDot0, lossLbl0), { runTime: 0.7 }),
    ...fbox(['Step 0  (0, 1)', ['loss = 50', C.pink], 'goal: make loss smaller'], C.pink),
    ...say('LOSS = 50 (MAKE IT SMALLER)', C.pink)
  );

  // S(31): Find the mean of the six original scores in each group.
  await until(S(31));
  await play(
    new M.LaggedStart(lOrigBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.05, runTime: 0.9 }),
    ...say('FIND EACH GROUP’S MEAN', C.cyan)
  );

  // S(32): The first mean is two, and the second mean is three.
  const meanLine1 = new M.DashedLine({
    start: [barX(0) - DX * 0.45, L_BASE + 2 * L_U, 0],
    end: [barX(5) + DX * 0.45, L_BASE + 2 * L_U, 0],
    color: C.cyan
  });
  const meanLine2 = new M.DashedLine({
    start: [barX(6) - DX * 0.45, L_BASE + 3 * L_U, 0],
    end: [barX(11) + DX * 0.45, L_BASE + 3 * L_U, 0],
    color: C.amber
  });
  const meanTag1 = T('mean = 2', P ? 15 : 14, C.cyan, true).moveTo([barX(2.8), L_BASE + 2 * L_U + 0.22, 0]);
  const meanTag2 = T('mean = 3', P ? 15 : 14, C.amber, true).moveTo([barX(8.5), L_BASE + 3 * L_U + 0.22, 0]);

  await until(S(32));
  await play(
    new M.Create(meanLine1, { runTime: 0.7 }),
    new M.Create(meanLine2, { runTime: 0.7 }),
    new M.FadeIn(meanTag1, { runTime: 0.6 }),
    new M.FadeIn(meanTag2, { runTime: 0.6 }),
    ...fbox([['group 1 mean = 2', C.cyan], ['group 2 mean = 3', C.amber]]),
    ...say('GROUP MEANS: 2 AND 3', C.green)
  );

  // S(33): At each learning step, move each amount halfway toward its group's mean.
  const arr1 = new M.Arrow({
    start: [barX(2.5) + L_OFF, L_BASE + 0.05, 0],
    end: [barX(2.5) + L_OFF, L_BASE + 1.0 * L_U, 0],
    color: C.violet, strokeWidth: 3
  });
  const arr2 = new M.Arrow({
    start: [barX(8.5) + L_OFF, L_BASE + 1.0 * L_U, 0],
    end: [barX(8.5) + L_OFF, L_BASE + 2.0 * L_U, 0],
    color: C.violet, strokeWidth: 3
  });
  await until(S(33));
  await play(
    new M.Create(arr1, { runTime: 0.7 }),
    new M.Create(arr2, { runTime: 0.7 }),
    ...fbox(['learning rule:', ['move halfway to mean', C.violet]], C.violet),
    ...say('MOVE HALFWAY TOWARD EACH MEAN', C.violet)
  );

  // Helper to animate the 12 outlined guess bars to (a1, a2)
  const rebuildGuess = (a1, a2, rt = 0.85) => guessBars.map((b, k) =>
    new M.Transform(b, makeBar(barX(k) + L_OFF, L_BASE, k < 6 ? a1 : a2, L_U, L_PAIR_W, attrCol(k), 0.14, 2.4), { runTime: rt })
  );

  // Helper to add a loss curve segment + dot
  function lossStep(s0, l0, s1, l1, label = '', col = C.green) {
    const seg = new M.Line({ start: [lcX(s0), lcY(l0), 0], end: [lcX(s1), lcY(l1), 0], color: col, strokeWidth: 3 });
    const dot = new M.Dot({ point: [lcX(s1), lcY(l1), 0], radius: 0.075, color: col });
    lossCurveObjs.push(seg, dot);
    const anims = [new M.Create(seg, { runTime: 0.65 }), new M.FadeIn(dot, { runTime: 0.5 })];
    if (label) {
      const tx = T(label, P ? 15 : 12, col, true).moveTo([lcX(s1) + 0.34, lcY(l1) + 0.16, 0]);
      lossCurveObjs.push(tx);
      anims.push(new M.FadeIn(tx, { runTime: 0.5 }));
    }
    return anims;
  }

  // S(34): For the first step, the first amount increases by one, from zero to one.
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(arr1, arr2), { runTime: 0.4 }),
    ...fbox(['Step 1:', ['amt 1: 0 + 1 = 1', C.cyan], 'amt 2: 1'], C.cyan),
    ...say('STEP 1: AMOUNT 1 → 0 + 1 = 1', C.cyan)
  );

  // S(35): The second amount increases by one, from one to two.
  await until(S(35));
  await play(
    ...fbox(['Step 1:', ['amt 1: 0 + 1 = 1', C.cyan], ['amt 2: 1 + 1 = 2', C.amber]], C.amber),
    ...say('STEP 1: AMOUNT 2 → 1 + 1 = 2', C.amber)
  );

  // S(36): Rebuild the profile with these new amounts.
  await until(S(36));
  await play(
    ...rebuildGuess(1, 2, 0.9),
    ...say('REBUILD WITH (1, 2)', C.green)
  );

  // S(37): The loss falls from fifty to fourteen.
  await until(S(37));
  await play(
    ...lossStep(0, 50, 1, 14, '14', C.green),
    ...fbox(['Step 1  (1, 2)', ['loss: 50 → 14', C.green]], C.green),
    ...say('LOSS FALLS: 50 → 14', C.green)
  );

  // S(38): For the second step, the first amount increases by half, reaching one point five.
  await until(S(38));
  await play(
    ...fbox(['Step 2:', ['amt 1: 1 + 0.5 = 1.5', C.cyan], 'amt 2: 2'], C.cyan),
    ...say('STEP 2: AMOUNT 1 → 1.5', C.cyan)
  );

  // S(39): The second amount also increases by half, reaching two point five.
  await until(S(39));
  await play(
    ...fbox(['Step 2:', ['amt 1: 1 + 0.5 = 1.5', C.cyan], ['amt 2: 2 + 0.5 = 2.5', C.amber]], C.amber),
    ...say('STEP 2: AMOUNT 2 → 2.5', C.amber)
  );

  // S(40): Rebuild the profile again, and the loss falls to five.
  await until(S(40));
  await play(
    ...rebuildGuess(1.5, 2.5, 0.85),
    ...lossStep(1, 14, 2, 5, '5', C.green),
    ...fbox(['Step 2  (1.5, 2.5)', ['loss: 14 → 5', C.green]], C.green),
    ...say('REBUILD (1.5, 2.5) · LOSS → 5', C.green)
  );

  // S(41): For the third step, increase each amount by one quarter.
  await until(S(41));
  await play(
    ...fbox(['Step 3:', ['add +0.25 to each', C.violet]], C.violet),
    ...say('STEP 3: ADD 0.25 TO EACH', C.violet)
  );

  // S(42): The first amount reaches one point seven five, and the second reaches two point seven five.
  await until(S(42));
  await play(
    ...rebuildGuess(1.75, 2.75, 0.85),
    ...fbox(['Step 3:', ['amt 1: 1.5 + 0.25 = 1.75', C.cyan], ['amt 2: 2.5 + 0.25 = 2.75', C.amber]], C.cyan),
    ...say('STEP 3: (1.75, 2.75)', C.cyan)
  );

  // S(43): The loss falls to two point seven five.
  await until(S(43));
  await play(
    ...lossStep(2, 5, 3, 2.75, '2.75', C.green),
    ...fbox(['Step 3  (1.75, 2.75)', ['loss: 5 → 2.75', C.green]], C.green),
    ...say('LOSS FALLS TO 2.75', C.green)
  );

  // S(44): Now repeat the steps faster and watch the loss curve become nearly flat.
  const fastPts = [[3, 2.75], [4, 2.1875], [5, 2.0469], [6, 2.0117], [7, 2.0029], [8, 2.0007]];
  const fastSegs = [];
  for (let i = 0; i < fastPts.length - 1; i++) {
    const [s0, l0] = fastPts[i], [s1, l1] = fastPts[i + 1];
    const seg = new M.Line({ start: [lcX(s0), lcY(l0), 0], end: [lcX(s1), lcY(l1), 0], color: C.green, strokeWidth: 3 });
    const dot = new M.Dot({ point: [lcX(s1), lcY(l1), 0], radius: 0.065, color: C.green });
    lossCurveObjs.push(seg, dot);
    fastSegs.push(new M.Create(seg, { runTime: 0.35 }), new M.FadeIn(dot, { runTime: 0.25 }));
  }
  await until(S(44));
  await play(
    ...rebuildGuess(1.99, 2.99, 1.8),
    new M.LaggedStart(fastSegs, { lagRatio: 0.25, runTime: 2.0 }),
    ...fbox(['Steps 4 → 8 (fast)', 'amounts → (2, 3)', ['loss curve flattens', C.green]], C.green),
    ...say('STEPS 4–8: LOSS CURVE FLATTENS', C.green)
  );

  // S(45): The amounts approach two and three, while the loss approaches two.
  const floorLine = new M.DashedLine({
    start: [LC_X0, lcY(2), 0], end: [LC_X1, lcY(2), 0], color: C.pink
  });
  const floorTag = T('loss → 2', P ? 15 : 12, C.pink, true).moveTo([LC_X1 - 0.55, lcY(2) + 0.26, 0]);
  lossCurveObjs.push(floorLine, floorTag);
  await until(S(45));
  await play(
    ...rebuildGuess(2, 3, 0.7),
    new M.Create(floorLine, { runTime: 0.7 }),
    new M.FadeIn(floorTag, { runTime: 0.6 }),
    ...fbox(['settled:', ['amounts → (2, 3)', C.cyan], ['loss    → 2', C.pink]], C.amber),
    ...say('AMOUNTS → (2, 3) · LOSS → 2', C.amber)
  );

  // S(46): The remaining loss comes from the two differences in floral and jasmine scores.
  const remFl = new M.Line({ start: [barX(0), L_BASE + 1 * L_U, 0], end: [barX(0), L_BASE + 2 * L_U, 0], color: C.pink, strokeWidth: 4.5 });
  const remJa = new M.Line({ start: [barX(1), L_BASE + 2 * L_U, 0], end: [barX(1), L_BASE + 3 * L_U, 0], color: C.pink, strokeWidth: 4.5 });
  const remBox = new M.RoundedRectangle({ width: DX * 2.1, height: 3.35 * L_U, cornerRadius: 0.1, color: C.pink, strokeWidth: 2.2 });
  remBox.setFill(C.pink, 0.08);
  remBox.moveTo([(barX(0) + barX(1)) / 2, L_BASE + 1.67 * L_U, -0.01]);
  await until(S(46));
  await play(
    new M.Create(remBox, { runTime: 0.6 }),
    new M.Create(remFl, { runTime: 0.6 }),
    new M.Create(remJa, { runTime: 0.6 }),
    ...fbox([['remaining loss = 2', C.pink], 'Floral:  (1 − 2)² = 1', 'Jasmine: (3 − 2)² = 1'], C.pink),
    ...say('REMAINING LOSS: FLORAL & JASMINE', C.pink)
  );

  // ---------------------------------------------------------------------------
  // ACT 6: Full NMF, Formula, Use, Caution, Recap (sentences 47-54)
  // ---------------------------------------------------------------------------

  // S(47): In full nonnegative matrix factorization, the computer also learns the basic parts.
  const fCardY = P ? -0.9 : -0.4;
  const fLeftX = CX - (P ? 1.85 : 2.15), fRightX = CX + (P ? 1.85 : 2.15);
  const fAmtCard = new M.RoundedRectangle({ width: P ? 2.6 : 2.8, height: P ? 2.1 : 2.0, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.2 });
  fAmtCard.setFill(C.card, 0.95); fAmtCard.moveTo([fLeftX, fCardY, 0]);
  const fAmtT1 = T('Amounts', P ? 18 : 20, C.cyan, true, true).moveTo([fLeftX, fCardY + 0.32, 0]);
  const fAmtT2 = T('8 × 2  (≥ 0)', P ? 15 : 15, C.muted, true).moveTo([fLeftX, fCardY - 0.12, 0]);
  const fAmtT3 = T('learned', P ? 15 : 15, C.green, true).moveTo([fLeftX, fCardY - 0.56, 0]);

  const fPartCard = new M.RoundedRectangle({ width: P ? 2.6 : 2.8, height: P ? 2.1 : 2.0, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.8 });
  fPartCard.setFill(C.card, 0.95); fPartCard.moveTo([fRightX, fCardY, 0]);
  const fPartT1 = T('Basic Parts', P ? 18 : 20, C.amber, true, true).moveTo([fRightX, fCardY + 0.32, 0]);
  const fPartT2 = T('2 × 12  (≥ 0)', P ? 15 : 15, C.muted, true).moveTo([fRightX, fCardY - 0.12, 0]);
  const fPartT3 = T('learned too!', P ? 15 : 15, C.amber, true, true).moveTo([fRightX, fCardY - 0.56, 0]);

  const learnStageAll = [
    lAxis, lDiv, ...lAttrLbls, ...lOrigBars, lLegA, lLegATx, lLegG, lLegGTx, lFixedTag,
    ...guessBars, meanLine1, meanLine2, meanTag1, meanTag2, remBox, remFl, remJa,
    ...lossCurveObjs
  ];

  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(...learnStageAll), { runTime: 0.55 }),
    new M.FadeIn(new M.VGroup(fAmtCard, fAmtT1, fAmtT2, fAmtT3, fPartCard, fPartT1, fPartT2, fPartT3), { runTime: 0.85 }),
    ...fbox([['Full NMF learns:', C.amber], ['1. Amounts (≥ 0)', C.cyan], ['2. Basic parts (≥ 0)', C.amber]], C.amber),
    ...say('FULL NMF: LEARN THE PARTS TOO', C.amber)
  );

  // S(48): The computer repeatedly improves the amounts and the parts, keeping every number nonnegative.
  const altTop = new M.Arrow({
    start: [fLeftX + 1.0, fCardY + 1.35, 0], end: [fRightX - 1.0, fCardY + 1.35, 0],
    color: C.green, strokeWidth: 3
  });
  const altBot = new M.Arrow({
    start: [fRightX - 1.0, fCardY - 1.35, 0], end: [fLeftX + 1.0, fCardY - 1.35, 0],
    color: C.green, strokeWidth: 3
  });
  const altTopT = T('improve parts', P ? 15 : 15, C.green, true).moveTo([CX, fCardY + 1.66, 0]);
  const altBotT = T('improve amounts', P ? 15 : 15, C.green, true).moveTo([CX, fCardY - 1.66, 0]);
  const altGe0 = pill('EVERY NUMBER ≥ 0', C.green, P ? 15 : 15).moveTo([CX, fCardY - (P ? 2.45 : 2.2), 0]);

  await until(S(48));
  await play(
    new M.Create(altTop, { runTime: 0.65 }),
    new M.Create(altBot, { runTime: 0.65 }),
    new M.FadeIn(new M.VGroup(altTopT, altBotT, altGe0), { runTime: 0.65 }),
    ...say('REPEAT: IMPROVE AMOUNTS ⇄ PARTS', C.green)
  );

  // S(49): We can write our rebuilding process in one short formula.
  const formY = P ? -1.6 : -0.35;
  const fCard = new M.RoundedRectangle({ width: P ? 6.8 : 7.4, height: P ? 2.4 : 2.3, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.2 });
  fCard.setFill(C.card, 0.95); fCard.moveTo([CX, formY, 0]);
  const fCardHead = T('Rebuilding Formula', P ? 20 : 22, C.cyan, true, true).moveTo([CX, formY + 0.72, 0]);
  const fCardLine = T('rebuilt score = ?', P ? 20 : 22, C.ink, true).moveTo([CX, formY - 0.1, 0]);

  await until(S(49));
  await play(
    new M.FadeOut(new M.VGroup(fAmtCard, fAmtT1, fAmtT2, fAmtT3, fPartCard, fPartT1, fPartT2, fPartT3, altTop, altBot, altTopT, altBotT, altGe0), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(fCard, fCardHead, fCardLine), { runTime: 0.7 }),
    ...fbox(['One short formula']),
    ...say('ONE SHORT FORMULA', C.cyan)
  );

  // S(50): Rebuilt score equals the sum of each part's score multiplied by its amount.
  const fCardFull1 = T('sum of (part score × amount)', P ? 19 : 21, C.amber, true, true).moveTo([CX, formY + 0.05, 0]);
  const fCardEx1 = T('First 6:  1 × 2  +  0 × 3  =  2', P ? 16 : 17, C.cyan, true).moveTo([CX, formY - 0.52, 0]);
  const fCardEx2 = T('Last 6:   0 × 2  +  1 × 3  =  3', P ? 16 : 17, C.amber, true).moveTo([CX, formY - 0.92, 0]);

  await until(S(50));
  await play(
    new M.FadeOut(fCardLine, { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(fCardFull1, fCardEx1, fCardEx2), { runTime: 0.8 }),
    ...fbox([['rebuilt score =', C.ink], ['  sum of', C.cyan], ['  (part score × amount)', C.amber]], C.amber),
    ...say('SUM OF (PART SCORE × AMOUNT)', C.amber)
  );

  // S(51): Use nonnegative matrix factorization when you want to describe many nonnegative measurements as mixtures of fewer parts.
  const useY = P ? -1.0 : -0.45;
  const manyBars = Array.from({ length: 12 }, (_, k) => {
    const h = 0.35 + ((k * 7 + 3) % 5) * 0.22;
    return makeBar(CX - (P ? 2.85 : 3.2) + k * (P ? 0.2 : 0.22), useY - 0.7, h, 1, P ? 0.14 : 0.15, attrCol(k), 0.82, 1);
  });
  const manyLbl = T('12 scores (≥ 0)', P ? 15 : 15, C.muted, true).moveTo([CX - (P ? 1.75 : 2.0), useY - 1.05, 0]);
  const useArr = new M.Arrow({
    start: [CX - 0.25, useY, 0], end: [CX + 1.05, useY, 0], color: C.green, strokeWidth: 3.5
  });
  const useNmfLbl = T('NMF', P ? 16 : 18, C.green, true, true).moveTo([CX + 0.4, useY + 0.35, 0]);
  const few1 = pill('Part 1', C.cyan, P ? 15 : 16).moveTo([CX + (P ? 2.15 : 2.35), useY + 0.4, 0]);
  const few2 = pill('Part 2', C.amber, P ? 15 : 16).moveTo([CX + (P ? 2.15 : 2.35), useY - 0.35, 0]);
  const fewLbl = T('few parts', P ? 15 : 15, C.green, true).moveTo([CX + (P ? 2.15 : 2.35), useY - 1.05, 0]);

  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(fCard, fCardHead, fCardFull1, fCardEx1, fCardEx2), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...manyBars, manyLbl, useArr, useNmfLbl, few1, few2, fewLbl), { runTime: 0.9 }),
    ...fbox(['When to use NMF:', 'many scores (≥ 0)', ['→ mixture of few parts', C.green]], C.green),
    ...say('MANY SCORES → MIXTURE OF FEW PARTS', C.cyan)
  );

  // S(52): For our teas, these parts give us a shorter description of each tasting profile.
  const sumGroups = [
    ['Teas A, B', '2', '3'],
    ['Teas C, D', '2', '7'],
    ['Teas E, F', '8', '3'],
    ['Teas G, H', '8', '7'],
  ];
  const sumCards = sumGroups.map(([name, a1, a2], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = CX + (col === 0 ? -1 : 1) * (P ? 1.72 : 1.95);
    const y = (P ? -0.35 : 0.15) - row * (P ? 1.65 : 1.55);
    const r = new M.RoundedRectangle({ width: P ? 3.1 : 3.4, height: P ? 1.3 : 1.25, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const nm = T(name, P ? 16 : 18, C.ink, true, true).moveTo([x, y + 0.3, 0]);
    const v1 = T(`Part 1: ${a1}`, P ? 15 : 15, C.cyan, true).moveTo([x - 0.72, y - 0.24, 0]);
    const v2 = T(`Part 2: ${a2}`, P ? 15 : 15, C.amber, true).moveTo([x + 0.72, y - 0.24, 0]);
    return new M.VGroup(r, nm, v1, v2);
  });

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(...manyBars, manyLbl, useArr, useNmfLbl, few1, few2, fewLbl), { runTime: 0.45 }),
    new M.LaggedStart(sumCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 0.95 }),
    ...fbox(['2 numbers instead of 12:', ['A,B:(2,3)  C,D:(2,7)', C.cyan], ['E,F:(8,3)  G,H:(8,7)', C.amber]]),
    ...say('SHORTER DESCRIPTION: 2 NUMBERS PER TEA', C.green)
  );

  // S(53): Be careful: the learned parts are useful patterns, not necessarily real ingredients in the tea.
  const cautY = P ? -1.0 : -0.45;
  const cautCard = new M.RoundedRectangle({ width: P ? 6.8 : 7.4, height: P ? 2.5 : 2.3, cornerRadius: 0.18, color: C.pink, strokeWidth: 2.5 });
  cautCard.setFill(C.card, 0.95); cautCard.moveTo([CX, cautY, 0]);
  const cautTop = T('Learned Parts = Useful Patterns', P ? 19 : 21, C.amber, true, true).moveTo([CX, cautY + 0.45, 0]);
  const cautMid = T('≠', P ? 30 : 32, C.pink, true, true).moveTo([CX, cautY - 0.05, 0]);
  const cautBot = T('Not necessarily real ingredients', P ? 18 : 20, C.pink, true).moveTo([CX, cautY - 0.58, 0]);

  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(...sumCards), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(cautCard, cautTop, cautMid, cautBot), { runTime: 0.8 }),
    ...fbox([['Be careful:', C.pink], 'patterns in data', '≠ real recipe'], C.pink),
    ...say('CAUTION: PATTERNS ≠ REAL INGREDIENTS', C.pink)
  );

  // S(54): Remember: nonnegative matrix factorization builds larger profiles by adding smaller parts, without ever subtracting a part.
  const recY = P ? -1.8 : -0.4;
  const rP1 = pill('Part 1 (≥0)', C.cyan, P ? 16 : 18).moveTo([CX - (P ? 2.15 : 2.45), recY + 0.35, 0]);
  const rPlus = T('+', 30, C.green, true, true).moveTo([CX - (P ? 0.65 : 0.75), recY + 0.35, 0]);
  const rP2 = pill('Part 2 (≥0)', C.amber, P ? 16 : 18).moveTo([CX + (P ? 0.85 : 0.95), recY + 0.35, 0]);
  const rEq = T('=', 28, C.ink, true, true).moveTo([CX + (P ? 2.2 : 2.5), recY + 0.35, 0]);
  const rOut = pill('Profile', C.green, P ? 16 : 18).moveTo([CX + (P ? 3.1 : 3.5), recY + 0.35, 0]);
  const rNoSub = pill('NO SUBTRACTION (−)', C.pink, P ? 15 : 17).moveTo([CX, recY - 0.95, 0]);

  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(cautCard, cautTop, cautMid, cautBot), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(rP1, rPlus, rP2, rEq, rOut, rNoSub), { runTime: 0.85 }),
    ...fbox([['NMF Recap:', C.green], 'add nonnegative parts', 'never subtract'], C.green),
    ...say('ADD POSITIVE PARTS · NEVER SUBTRACT', C.green)
  );
}
