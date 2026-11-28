// lesson 6.1.3
// 6.1.3 Estimator variance.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Layout: ml line 499..503 with TRUE 501 / DIAL 500; one row per sample (A cyan, B pink) + a distance table
// (left on laptop, under the line on phone); squares picture for "squaring"; spread bars for SD 2 / 1 / 0.5;
// two histograms at the end with the gold line kept on screen.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;

  const PILL = P ? [0, 4.3, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 3.1, 0] : [4.75, 0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    const BC = P ? [0, 3.95 - ht / 2, 0] : BOXP;   // phone: the box hangs from a fixed top
    r.setFill(C.card, 0.95); r.moveTo(BC);
    const left = BC[0] - wd / 2 + 0.32, top = BC[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 3.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // ---- geometry
  const LY = P ? -2.2 : -2.6;
  const x0 = P ? -3.5 : -4.0, L0 = P ? 6.7 : 5.9;
  const n2x = v => x0 + (v - 499) / 4 * L0;
  const ROW = P ? 0.75 : 0.65, ROW0 = 0.65;
  const rowY = k => LY + ROW0 + (3 - k) * ROW;
  const goldTop = rowY(0) + 0.55;
  const NUM = P ? 18 : 19;
  const tab = P
    ? { xS: -2.3, xA: -0.2, xB: 1.9, y: k => -4.25 - k * 0.62, head: -3.65, cap: -3.1, left: -3.4 }
    : { xS: -6.55, xA: -5.65, xB: -4.6, y: k => rowY(k), head: goldTop + 0.05, cap: goldTop + 0.5, left: -6.85 };

  function buildBase() {
    const axis = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
    const ticks = [499, 500, 501, 502, 503].map(v => new M.VGroup(
      new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted }),
      T(String(v), P ? 16 : 17, C.muted, true).moveTo([n2x(v), LY - 0.36, 0])
    ));
    const unit = T('ml', P ? 16 : 17, C.muted); unit.moveTo([x0 + L0 + 0.3, LY, 0]);
    const gold = new M.DashedLine({ start: [n2x(501), LY, 0], end: [n2x(501), goldTop, 0], color: C.amber, strokeWidth: 3 });
    const goldTag = pill('TRUE 501', C.amber, 16); goldTag.moveTo([n2x(501), goldTop + 0.3, 0]);
    const dial = new M.Line({ start: [n2x(500), LY, 0], end: [n2x(500), goldTop, 0], color: C.muted, strokeWidth: 2.5 });
    const dialTag = pill('DIAL 500', C.muted, 16); dialTag.moveTo([n2x(500), goldTop + 0.3, 0]);
    return { axis, ticks, unit, gold, goldTag, dial, dialTag, line: [axis, ...ticks, unit], all: [axis, ...ticks, unit, gold, goldTag, dial, dialTag] };
  }
  function dot(val, y, color, big) {
    const p = [n2x(val), y, 0];
    const halo = new M.Dot({ point: p, radius: big ? 0.24 : 0.19, color }); halo.setFill(color, 0.25);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    return { g: new M.VGroup(halo, d), d, p };
  }
  const seg = (a, b, y, color) => new M.Line({ start: [n2x(a), y, 0], end: [n2x(b), y, 0], color, strokeWidth: 5 });

  const A = [502, 500, 501.5, 500.5], B = [501, 500, 500.75, 500.25];
  const dA = ['+1', '−1', '+0.5', '−0.5'], dB = ['+0.5', '−0.5', '+0.25', '−0.25'];

  const base = buildBase();

  // 0: two recipes guessed average fill
  await until(S(0));
  await play(new M.Create(base.axis), new M.FadeIn(new M.VGroup(...base.ticks, base.unit)),
    new M.Create(base.gold), new M.FadeIn(base.goldTag), ...say('TWO RECIPES, SAME TARGET (501)', C.amber));

  // 1: Recipe A plain average
  await until(S(1));
  await play(...fbox([['Recipe A', C.cyan], 'plain average of 4'], C.cyan), ...say('RECIPE A: PLAIN AVERAGE', C.cyan));

  // 2: Recipe B halfway to 500
  await until(S(2));
  await play(new M.Create(base.dial), new M.FadeIn(base.dialTag),
    ...fbox([['Recipe A: plain average', C.cyan], ['Recipe B: halfway to 500', PINK]], PINK), ...say('RECIPE B: HALFWAY TO 500', PINK));

  // 3: A unbiased, B leans -0.5
  await until(S(3));
  await play(...fbox([['A: unbiased (bias 0)', C.cyan], ['B: leans −0.5 ml', PINK]], C.amber), ...say('A: NO LEAN  ·  B: −0.5 ml', C.amber));

  // 4: pink dots looked closer together
  await until(S(4));
  await play(...say('BUT B LOOKED CLOSER TOGETHER', PINK));

  // 5: the four samples again (one row each) + empty distance table
  const rows = A.map((a, k) => {
    const y = rowY(k);
    const guide = new M.DashedLine({ start: [x0, y, 0], end: [x0 + L0, y, 0], color: C.grid, strokeWidth: 1.2 });
    const sTag = T(`S${k + 1}`, P ? 16 : 17, C.muted, true); sTag.moveTo(P ? [n2x(499.25), y, 0] : [tab.xS, tab.y(k), 0]);
    const tTag = P ? T(`S${k + 1}`, NUM, C.muted, true).moveTo([tab.xS, tab.y(k), 0]) : null;
    const da = dot(a, y, C.cyan, true), db = dot(B[k], y, PINK, false);
    const sa = seg(501, a, y + 0.14, C.cyan), sb = seg(500.5, B[k], y - 0.14, PINK);
    const ta = T(dA[k], NUM, C.cyan, true); ta.moveTo([tab.xA, tab.y(k), 0]);
    const tb = T(dB[k], NUM, PINK, true); tb.moveTo([tab.xB, tab.y(k), 0]);
    return { y, guide, sTag, tTag, da, db, sa, sb, ta, tb };
  });
  const cap = T('distance from own middle', P ? 16 : 15, C.muted); cap.moveTo([P ? 0 : -5.55, tab.cap, 0]);
  const head = [T('sample', P ? 17 : 16, C.muted), T('A', NUM, C.cyan, true, true), T('B', NUM, PINK, true, true)];
  head[0].moveTo([tab.xS, tab.head, 0]); head[1].moveTo([tab.xA, tab.head, 0]); head[2].moveTo([tab.xB, tab.head, 0]);
  await until(S(5));
  await play(new M.FadeIn(new M.VGroup(...rows.flatMap(r => [r.guide, r.sTag, ...(r.tTag ? [r.tTag] : [])]), cap, ...head)),
    new M.LaggedStart(rows.flatMap(r => [r.da.g, r.db.g]).map(g => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('4 SAMPLES: CYAN (A) & PINK (B)', C.ink));

  // 6: A's middle is 501
  const midA = new M.Line({ start: [n2x(501), LY, 0], end: [n2x(501), rowY(0) + 0.35, 0], color: C.cyan, strokeWidth: 4 });
  await until(S(6));
  await play(new M.Create(midA), ...fbox([['A middle = 501', C.cyan]], C.cyan), ...say('A MIDDLE = 501', C.cyan));

  // 7: S1: A is +1 above middle
  await until(S(7));
  await play(new M.Create(rows[0].sa), new M.FadeIn(rows[0].ta), ...say('S1: A IS +1 ml ABOVE', C.cyan));

  // 8: S2 -1, S3 +0.5, S4 -0.5
  await until(S(8));
  await play(...[1, 2, 3].flatMap(k => [new M.Create(rows[k].sa), new M.FadeIn(rows[k].ta)]), ...say('A: +1, −1, +0.5, −0.5', C.cyan));

  // 9: B's middle is 500.5
  const midB = new M.Line({ start: [n2x(500.5), LY, 0], end: [n2x(500.5), rowY(0) + 0.35, 0], color: PINK, strokeWidth: 4 });
  await until(S(9));
  await play(new M.Create(midB), ...fbox([['B middle = 500.5', PINK]], PINK), ...say('B MIDDLE = 500.5', PINK));

  // 10: S1: B is +0.5 above middle
  await until(S(10));
  await play(new M.Create(rows[0].sb), new M.FadeIn(rows[0].tb), ...say('S1: B IS +0.5 ml ABOVE', PINK));

  // 11: S2 -0.5, S3 +0.25, S4 -0.25
  await until(S(11));
  await play(...[1, 2, 3].flatMap(k => [new M.Create(rows[k].sb), new M.FadeIn(rows[k].tb)]), ...say('B: +0.5, −0.5, +0.25, −0.25', PINK));

  // 12: every distance for B is half of A's
  await until(S(12));
  await play(new M.LaggedStart(rows.map(r => new M.Indicate(r.tb, { color: C.amber })), { lagRatio: 0.15, runTime: 1.4 }),
    ...fbox([['A: 1,  1,  0.5,  0.5', C.cyan], ['B: 0.5, 0.5, 0.25, 0.25', PINK], ['B = exactly half', C.amber]], C.amber),
    ...say('EVERY B DISTANCE = HALF OF A', C.amber));

  // 13: why? halfway to dial cuts every jump in half
  await until(S(13));
  await play(...say('HALFWAY TO DIAL → HALF EVERY JUMP', PINK));

  // 14: dog walking halfway between you and home
  const dogY = P ? 0.2 : -0.9;
  const hX = P ? -3.0 : -6.0, yX = P ? 3.0 : 1.4, dX = (hX + yX) / 2;
  const dogLine = new M.Line({ start: [hX, dogY, 0], end: [yX, dogY, 0], color: C.muted, strokeWidth: 3 });
  const homeDot = new M.Dot({ point: [hX, dogY, 0], radius: 0.16, color: C.muted });
  const dogDot = new M.Dot({ point: [dX, dogY, 0], radius: 0.16, color: PINK });
  const youDot = new M.Dot({ point: [yX, dogY, 0], radius: 0.16, color: C.cyan });
  const homeLab = T('home', 19, C.muted, true); homeLab.moveTo([hX, dogY - 0.45, 0]);
  const dogLab = T('dog (like B)', 19, PINK, true); dogLab.moveTo([dX, dogY + 0.45, 0]);
  const youLab = T('you (like A)', 19, C.cyan, true); youLab.moveTo([yX - (P ? 0.5 : 0), dogY + 0.45, 0]);
  const stepY = dogY - (P ? 1.3 : 1.2);
  const youArrow = new M.Arrow({ start: [yX - 2.0, stepY, 0], end: [yX, stepY, 0], color: C.cyan, strokeWidth: 4, buff: 0, tipLength: 0.2 });
  const dogArrow = new M.Arrow({ start: [dX - 1.0, stepY - 0.55, 0], end: [dX, stepY - 0.55, 0], color: PINK, strokeWidth: 4, buff: 0, tipLength: 0.2 });
  const youStepLab = T('2 m', 19, C.cyan, true); youStepLab.moveTo([yX - 1.0, stepY + 0.3, 0]);
  const dogStepLab = T('1 m', 19, PINK, true); dogStepLab.moveTo([dX - 0.5, stepY - 0.25, 0]);
  const plotA = [...base.all, midA, midB, ...rows.flatMap(r => [r.guide, r.sTag, r.da.g, r.db.g, r.sa, r.sb])];
  const tableA = [cap, ...head, ...rows.flatMap(r => [r.ta, r.tb, ...(r.tTag ? [r.tTag] : [])])];
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...plotA, ...tableA)), ...fbox(['you step 2 m', ['dog steps 1 m', PINK]], PINK),
    new M.Create(dogLine), new M.FadeIn(new M.VGroup(homeDot, dogDot, youDot, homeLab, dogLab, youLab)),
    ...say('YOU STEP 2 m → DOG STEPS 1 m', PINK));
  await play(new M.GrowArrow(youArrow), new M.FadeIn(youStepLab), new M.GrowArrow(dogArrow), new M.FadeIn(dogStepLab));

  // 15: how do we put a number on scatter?
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(dogLine, homeDot, dogDot, youDot, homeLab, dogLab, youLab, youArrow, dogArrow, youStepLab, dogStepLab)),
    ...fbox(['B scatters less.', ['How much less?', C.amber]], C.amber), ...say('HOW TO NUMBER THE SCATTER?', C.amber));

  // 16-18: variance recalled; squaring pictured as squares on sample 1's distances
  const SQ = P ? 2.3 : 2.2;                      // side of A's square (distance 1)
  const sqC = P ? [-1.4, -0.4] : [-3.6, -1.25];  // centre of A's square
  const sqA = new M.Square({ sideLength: SQ, color: C.cyan, strokeWidth: 3 }); sqA.setFill(C.cyan, 0.12); sqA.moveTo([sqC[0], sqC[1], 0]);
  const bx = sqC[0] + SQ / 2 + (P ? 0.9 : 1.1) + SQ / 4, by = sqC[1] - SQ / 2 + SQ / 4;
  const sqB = new M.Square({ sideLength: SQ / 2, color: PINK, strokeWidth: 3 }); sqB.setFill(PINK, 0.15); sqB.moveTo([bx, by, 0]);
  const sideA = T('side 1', NUM, C.cyan, true); sideA.moveTo([sqC[0], sqC[1] - SQ / 2 - 0.32, 0]);
  const sideB = T('side 0.5', NUM, PINK, true); sideB.moveTo([bx, by - SQ / 4 - 0.32, 0]);
  const areaA = T('area 1', NUM, C.cyan, true); areaA.moveTo([sqC[0], sqC[1] - SQ / 2 - 0.72, 0]);
  const areaB = T('area 0.25', NUM, PINK, true); areaB.moveTo([bx, by - SQ / 4 - 0.72, 0]);
  const sqTitle = T('S1 distance, squared', P ? 18 : 18, C.ink, true); sqTitle.moveTo([(sqC[0] + bx) / 2, sqC[1] + SQ / 2 + 0.4, 0]);
  // quarter grid inside A's square: B's square fits 4 times
  const qv = new M.DashedLine({ start: [sqC[0], sqC[1] - SQ / 2, 0], end: [sqC[0], sqC[1] + SQ / 2, 0], color: PINK, strokeWidth: 2 });
  const qh = new M.DashedLine({ start: [sqC[0] - SQ / 2, sqC[1], 0], end: [sqC[0] + SQ / 2, sqC[1], 0], color: PINK, strokeWidth: 2 });

  await until(S(16));
  await play(...fbox([['VARIANCE', C.violet], 'our tool for spread', '(unit on spread)'], C.violet), ...say('VARIANCE', C.violet));

  await until(S(17));
  await play(...fbox([['variance =', C.violet], 'average of', '(distance from middle)²'], C.violet), ...say('SQUARE DISTANCES, THEN AVERAGE', C.violet));

  await until(S(18));
  await play(new M.FadeIn(sqTitle), new M.Create(sqA), new M.FadeIn(sideA), new M.FadeIn(areaA),
    ...fbox(['squaring: x × x', '−1 × −1 = +1', ['always positive', C.green]], C.green), ...say('SQUARING MAKES ALL POSITIVE', C.green));

  // 19: use it on guesses over many samples
  await until(S(19));
  await play(new M.Create(sqB), new M.FadeIn(sideB), new M.FadeIn(areaB), new M.Create(qv), new M.Create(qh),
    ...fbox([['B: half the side', PINK], ['= a quarter of', PINK], ['   the square', PINK]], PINK), ...say('OVER MANY, MANY SAMPLES', C.cyan));

  // 20: estimator's variance
  await until(S(20));
  await play(...fbox([['ESTIMATOR VARIANCE', C.violet], 'spread of its guesses', 'around their own', 'long-run middle'], C.violet), ...say('ESTIMATOR VARIANCE', C.violet));

  // 21-28: spread bars on the ml line: 1 bottle ±2, A ±1, B ±0.5 (typical distance = standard deviation)
  const base2 = buildBase();
  const barY = k => rowY(0) - k * ROW * 1.4;
  function bar(lo, hi, k, color) {
    const y = barY(k);
    const ln = new M.Line({ start: [n2x(lo), y, 0], end: [n2x(hi), y, 0], color, strokeWidth: 7 });
    const c1 = new M.Line({ start: [n2x(lo), y - 0.16, 0], end: [n2x(lo), y + 0.16, 0], color, strokeWidth: 4 });
    const c2 = new M.Line({ start: [n2x(hi), y - 0.16, 0], end: [n2x(hi), y + 0.16, 0], color, strokeWidth: 4 });
    const mid = new M.Dot({ point: [(n2x(lo) + n2x(hi)) / 2, y, 0], radius: 0.1, color });
    return new M.VGroup(ln, c1, c2, mid);
  }
  function legend(s, k, color) {
    const t = T(s, NUM, color, true);
    const y = P ? tab.y(k) : barY(k);
    t.moveTo([tab.left + t.getWidth() / 2, y, 0]);
    return t;
  }
  const bar1 = bar(499, 503, 0, C.ink), barA = bar(500, 502, 1, C.cyan), barB = bar(500, 501, 2, PINK);
  const leg1 = legend('1 bottle: ±2', 0, C.ink), legA = legend('A: ±1', 1, C.cyan), legB = legend('B: ±0.5', 2, PINK);
  const legCap = T('typical distance (SD)', P ? 16 : 15, C.muted); legCap.moveTo([P ? 0 : -5.55, P ? tab.cap - 0.5 : tab.cap, 0]);

  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(sqA, sqB, sideA, sideB, areaA, areaB, sqTitle, qv, qh)),
    new M.FadeIn(new M.VGroup(...base2.all)), new M.FadeIn(legCap),
    ...fbox([['Recipe A', C.cyan], 'its spread is called', ['the standard error', C.cyan]], C.cyan), ...say('RECIPE A: STANDARD ERROR', C.cyan));

  // 22: standard error = SD of sample mean
  await until(S(22));
  await play(...fbox([['standard error', C.cyan], '= SD of a sample mean'], C.cyan), ...say('SD OF A SAMPLE MEAN', C.cyan));

  // 23: one bottle SD = 2 ml
  await until(S(23));
  await play(new M.Create(bar1), new M.FadeIn(leg1), ...fbox(['1 bottle: SD = 2 ml'], C.ink), ...say('1 BOTTLE: SD = 2 ml', C.ink));

  // 24: average of 4 bottles: 2 ÷ √4
  await until(S(24));
  await play(new M.Create(barA), ...fbox(['1 bottle: SD = 2 ml', ['average of 4: 2 ÷ √4', C.cyan]], C.cyan), ...say('4 BOTTLES: 2 ÷ √4', C.cyan));

  // 25: √4 = 2, so 2 ÷ 2 = 1 ml
  await until(S(25));
  await play(new M.FadeIn(legA), ...fbox(['√4 = 2  (2 × 2 = 4)', ['2 ÷ 2 = 1 ml', C.cyan]], C.cyan), ...say('STANDARD ERROR OF A = 1 ml', C.cyan));

  // 26: A's variance = 1 × 1 = 1
  await until(S(26));
  await play(new M.Indicate(legA, { color: C.cyan }), ...fbox([['Recipe A', C.cyan], 'SD = 1 ml', ['variance = 1 × 1 = 1', C.cyan]], C.cyan), ...say('VARIANCE OF A = 1', C.cyan));

  // 27: Recipe B halves every distance -> SD = 0.5 ml
  await until(S(27));
  await play(new M.Create(barB), new M.FadeIn(legB), ...fbox([['Recipe B', PINK], 'halves every distance', ['SD = 0.5 ml', PINK]], PINK), ...say('SD OF B = 0.5 ml', PINK));

  // 28: B's variance = 0.5 × 0.5 = 0.25
  await until(S(28));
  await play(...fbox([['Recipe B', PINK], 'SD = 0.5 ml', ['variance = 0.5 × 0.5', PINK], ['         = 0.25', PINK]], PINK), ...say('VARIANCE OF B = 0.25 (ONE QUARTER)', PINK));

  // 29: half distance -> quarter variance
  await until(S(29));
  await play(...fbox(['half the distance', 'squared: ½ × ½ = ¼', ['a quarter of the variance', C.amber]], C.amber), ...say('½ DISTANCE → ¼ VARIANCE', C.amber));

  // 30: B scatters a quarter as much as A
  await until(S(30));
  await play(...fbox([['variance A = 1', C.cyan], ['variance B = 0.25', PINK], ['B = ¼ of A', C.amber]], C.ink), ...say('B SCATTERS ¼ AS MUCH AS A', PINK));

  // 31: run 1,000 days -> two hills (gold and dial lines stay)
  function makeHist(mu, sd, baseY, maxH, color) {
    const bars = [], nBins = 20, bw = 4 / nBins, pxW = L0 / nBins * 0.86;
    for (let i = 0; i < nBins; i++) {
      const vc = 499 + (i + 0.5) * bw, z = (vc - mu) / sd, h = maxH * Math.exp(-0.5 * z * z);
      if (h < 0.04) continue;
      const rect = new M.Rectangle({ width: pxW, height: h, color, strokeWidth: 1 });
      rect.setFill(color, 0.45); rect.moveTo([n2x(vc), baseY + h / 2, 0]); bars.push(rect);
    }
    return bars;
  }
  const baseA = LY + (P ? 1.8 : 1.7), baseB = LY + 0.04;
  const hA = goldTop - baseA - 0.15, hB = baseA - baseB - 0.35;
  const histA = makeHist(501, 1.0, baseA, hA, C.cyan), histB = makeHist(500.5, 0.5, baseB, hB, PINK);
  const baseLineA = new M.Line({ start: [x0, baseA, 0], end: [x0 + L0, baseA, 0], color: C.muted, strokeWidth: 1.5 });
  const cLineA = new M.Line({ start: [n2x(501), baseA, 0], end: [n2x(501), baseA + hA + 0.05, 0], color: C.cyan, strokeWidth: 4 });
  const cLineB = new M.Line({ start: [n2x(500.5), baseB, 0], end: [n2x(500.5), baseB + hB + 0.05, 0], color: PINK, strokeWidth: 4 });
  const labA = T('many A', NUM, C.cyan, true); labA.moveTo([x0 + 0.1 + labA.getWidth() / 2, baseA + hA - 0.05, 0]);
  const labB = T('many B', NUM, PINK, true); labB.moveTo([x0 + 0.1 + labB.getWidth() / 2, baseB + hB - 0.05, 0]);
  await until(S(31));
  await play(new M.FadeOut(new M.VGroup(bar1, barA, barB, leg1)), new M.Create(baseLineA),
    new M.LaggedStart([...histA, ...histB].map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.8 }),
    new M.FadeIn(labA), new M.FadeIn(labB), ...say('1,000 DAYS → TWO HILLS', C.ink));

  // 32: cyan hill is wide, centred on 501
  await until(S(32));
  await play(new M.Create(cLineA), new M.Indicate(legA, { color: C.cyan }), ...say('CYAN HILL: WIDE, ON 501', C.cyan));

  // 33: pink hill is narrow, centred on 500.5
  await until(S(33));
  await play(new M.Create(cLineB), new M.Indicate(legB, { color: PINK }), ...say('PINK HILL: NARROW, ON 500.5', PINK));

  // 34: formula
  await until(S(34));
  await play(...fbox([['variance of estimator', C.violet], '= long-run average of', '(guess − own mean)²'], C.violet), ...say('FORMULA: ESTIMATOR VARIANCE', C.violet));

  // 35: in words
  await until(S(35));
  await play(...fbox(['how widely guesses', 'wander from their', ['own centre (squared)', C.violet]], C.violet), ...say('HOW WIDELY GUESSES WANDER', C.violet));

  // 36: what is it for? small variance = steady
  await until(S(36));
  await play(new M.Indicate(new M.VGroup(...histB), { color: PINK }), ...fbox(['small variance', ['= steady answers', C.green]], C.green), ...say('SMALL VARIANCE = STEADY', C.green));

  // 37: two unbiased recipes -> pick smaller variance
  await until(S(37));
  await play(...fbox(['both bias 0?', ['pick the smaller', C.green], ['variance', C.green]], C.green), ...say('NO BIAS EITHER? PICK SMALLER VARIANCE', C.green));

  // 38: Trap - distance from OWN centre, not truth
  await until(S(38));
  await play(...fbox([['TRAP', C.violet], 'variance measures from', 'OWN centre, not truth'], C.violet), ...say('TRAP: OWN CENTRE ≠ TRUTH', C.violet));

  // 39: pink hill is tight, but not on gold line
  const offY = baseA - 0.18;
  const offGap = new M.Arrow({ start: [n2x(501), offY, 0], end: [n2x(500.5), offY, 0], color: C.amber, strokeWidth: 4, buff: 0, tipLength: 0.16 });
  await until(S(39));
  await play(new M.GrowArrow(offGap), new M.Indicate(base2.gold, { color: C.amber }), new M.Indicate(base2.goldTag, { color: C.amber }),
    ...say('TIGHT, BUT OFF THE GOLD LINE', PINK));

  // 40: clock 5 minutes slow
  await until(S(40));
  await play(...fbox(['clock 5 min slow:', 'very steady (small variance)', ['always wrong (biased)', C.violet]], C.violet), ...say('STEADY ≠ RIGHT', C.violet));

  // 41: which recipe is better overall?
  await until(S(41));
  await play(...fbox([['A: no lean, wide', C.cyan], ['B: leans, narrow', PINK], ['which wins?', C.amber]], C.amber), ...say('A (NO LEAN) vs B (LESS SCATTER)?', C.amber));

  // 42: next lesson - join bias and variance
  await until(S(42));
  await play(...say('NEXT: ONE SCORE FOR BOTH', C.cyan));

  // 43: one-sentence summary
  await until(S(43));
  await play(...fbox([['ESTIMATOR VARIANCE', C.violet], 'how much guesses scatter', 'from sample to sample'], C.green), ...say('VARIANCE = SCATTER OF GUESSES', C.green));
}
