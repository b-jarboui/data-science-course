// lesson 6.1.4
// 6.1.4 Mean squared error.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Layout: ml line 499..504 with TRUE 501 / DIAL 500; one row per sample + error table (left on laptop, under the
// line on phone); the two-step picture for sample 2; an MSE bar chart on its own axis; the repair trap (true 503).
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
  const n2x = v => x0 + (v - 499) / 5 * L0;
  const ROW = P ? 0.75 : 0.65, ROW0 = 0.65;
  const rowY = k => LY + ROW0 + (3 - k) * ROW;
  const goldTop = rowY(0) + 0.55;
  const NUM = P ? 18 : 19;
  const tab = P
    ? { xS: -2.3, xA: -0.2, xB: 1.9, y: k => -4.25 - k * 0.62, head: -3.65, cap: -3.1 }
    : { xS: -6.55, xA: -5.65, xB: -4.6, y: k => rowY(k), head: goldTop + 0.05, cap: goldTop + 0.5 };

  function buildBase() {
    const axis = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
    const ticks = [499, 500, 501, 502, 503, 504].map(v => new M.VGroup(
      new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted }),
      T(String(v), P ? 16 : 17, C.muted, true).moveTo([n2x(v), LY - 0.36, 0])
    ));
    const unit = T('ml', P ? 16 : 17, C.muted); unit.moveTo([x0 + L0 + 0.3, LY, 0]);
    const gold = new M.DashedLine({ start: [n2x(501), LY, 0], end: [n2x(501), goldTop, 0], color: C.amber, strokeWidth: 3 });
    const goldTag = pill('TRUE 501', C.amber, 16); goldTag.moveTo([n2x(501), goldTop + 0.3, 0]);
    const dial = new M.Line({ start: [n2x(500), LY, 0], end: [n2x(500), goldTop, 0], color: C.muted, strokeWidth: 2.5 });
    const dialTag = pill('DIAL 500', C.muted, 16); dialTag.moveTo([n2x(500) - 0.1 - dialTag.getWidth() / 2, goldTop + 0.3, 0]);
    return { axis, ticks, unit, gold, goldTag, dial, dialTag, all: [axis, ...ticks, unit, gold, goldTag, dial, dialTag] };
  }
  function dot(val, y, color, big) {
    const p = [n2x(val), y, 0];
    const halo = new M.Dot({ point: p, radius: big ? 0.24 : 0.19, color }); halo.setFill(color, 0.25);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    return { g: new M.VGroup(halo, d), d, p };
  }
  const seg = (a, b, y, color, w = 5) => new M.Line({ start: [n2x(a), y, 0], end: [n2x(b), y, 0], color, strokeWidth: w });
  function makeHist(mu, sd, baseY, maxH, color) {
    const bars = [], nBins = 25, bw = 5 / nBins, pxW = L0 / nBins * 0.86;
    for (let i = 0; i < nBins; i++) {
      const vc = 499 + (i + 0.5) * bw, z = (vc - mu) / sd, h = maxH * Math.exp(-0.5 * z * z);
      if (h < 0.04) continue;
      const rect = new M.Rectangle({ width: pxW, height: h, color, strokeWidth: 1 });
      rect.setFill(color, 0.45); rect.moveTo([n2x(vc), baseY + h / 2, 0]); bars.push(rect);
    }
    return bars;
  }

  const base = buildBase();

  // 0: two recipes guess 501 ml
  await until(S(0));
  await play(new M.Create(base.axis), new M.FadeIn(new M.VGroup(...base.ticks, base.unit)),
    new M.Create(base.gold), new M.FadeIn(base.goldTag), ...say('TWO RECIPES, TARGET = 501 ml', C.amber));

  // 1: Recipe A: no lean, wide scatter (upper hill)
  const baseA = LY + (P ? 1.8 : 1.7), baseB = LY + 0.04;
  const hA = goldTop - baseA - 0.15, hB = baseA - baseB - 0.35;
  const histA0 = makeHist(501, 1.0, baseA, hA, C.cyan), histB0 = makeHist(500.5, 0.5, baseB, hB, PINK);
  const baseLineA = new M.Line({ start: [x0, baseA, 0], end: [x0 + L0, baseA, 0], color: C.muted, strokeWidth: 1.5 });
  const labA = T('many A', NUM, C.cyan, true); labA.moveTo([n2x(503.2) + 0.1, baseA + 0.35, 0]);
  const labB = T('many B', NUM, PINK, true); labB.moveTo([n2x(503.2) + 0.1, baseB + 0.35, 0]);
  await until(S(1));
  await play(new M.Create(baseLineA), new M.LaggedStart(histA0.map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 1.2 }), new M.FadeIn(labA),
    ...fbox([['Recipe A', C.cyan], 'bias 0, variance 1'], C.cyan), ...say('A: NO LEAN, WIDE SCATTER', C.cyan));

  // 2: Recipe B: leans -0.5, tight
  await until(S(2));
  await play(new M.Create(base.dial), new M.FadeIn(base.dialTag),
    new M.LaggedStart(histB0.map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 1.2 }), new M.FadeIn(labB),
    ...fbox([['A: bias 0, variance 1', C.cyan], ['B: bias −0.5,', PINK], ['   variance 0.25', PINK]], PINK), ...say('B: LEANS −0.5, TIGHT SCATTER', PINK));

  // 3: which one should the plant use?
  await until(S(3));
  await play(...fbox([['A or B?', C.amber], 'we need one fair score'], C.amber), ...say('WE NEED ONE FAIR SCORE', C.amber));

  // 4: how far is each guess from the truth?
  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(...histA0, ...histB0, baseLineA, labA, labB)), ...say('HOW FAR FROM THE TRUTH?', C.amber));

  // 5: measure against the gold line
  await until(S(5));
  await play(new M.Indicate(base.gold, { color: C.amber }), new M.Indicate(base.goldTag, { color: C.amber }),
    ...fbox(['measure every guess', ['from the gold line 501', C.amber], 'not from its own centre'], C.amber), ...say('MEASURE FROM THE GOLD LINE', C.amber));

  // 6: error of a guess
  await until(S(6));
  await play(...fbox([['ERROR', C.violet], '= guess − 501'], C.violet), ...say('ERROR = DISTANCE FROM TRUTH', C.violet));

  // 7: four samples, rows + error table
  const A = [502, 500, 501.5, 500.5], B = [501, 500, 500.75, 500.25];
  const eA = ['+1', '−1', '+0.5', '−0.5'], eB = ['0', '−1', '−0.25', '−0.75'], qA = ['1', '1', '0.25', '0.25'];
  const rows = A.map((a, k) => {
    const y = rowY(k);
    const guide = new M.DashedLine({ start: [x0, y, 0], end: [x0 + L0, y, 0], color: C.grid, strokeWidth: 1.2 });
    const sTag = T(`S${k + 1}`, P ? 16 : 17, C.muted, true); sTag.moveTo(P ? [n2x(499.25), y, 0] : [tab.xS, tab.y(k), 0]);
    const tTag = P ? T(`S${k + 1}`, NUM, C.muted, true).moveTo([tab.xS, tab.y(k), 0]) : null;
    const da = dot(a, y, C.cyan, true), db = dot(B[k], y, PINK, false);
    const sa = seg(501, a, y + 0.14, C.cyan), sb = a === 0 ? null : (B[k] !== 501 ? seg(501, B[k], y - 0.14, PINK) : null);
    const ta = T(eA[k], NUM, C.cyan, true); ta.moveTo([tab.xA, tab.y(k), 0]);
    const ta2 = T(qA[k], NUM, C.cyan, true); ta2.moveTo([tab.xA, tab.y(k), 0]);
    const tb = T(eB[k], NUM, PINK, true); tb.moveTo([tab.xB, tab.y(k), 0]);
    return { y, guide, sTag, tTag, da, db, sa, sb, ta, ta2, tb };
  });
  const cap = T('error = guess − 501', P ? 16 : 15, C.muted); cap.moveTo([P ? 0 : -5.55, tab.cap, 0]);
  const headS = T('sample', P ? 17 : 16, C.muted); headS.moveTo([tab.xS, tab.head, 0]);
  const headA = T('A', NUM, C.cyan, true, true); headA.moveTo([tab.xA, tab.head, 0]);
  const headA2 = T('A²', NUM, C.cyan, true, true); headA2.moveTo([tab.xA, tab.head, 0]);
  const headB = T('B', NUM, PINK, true, true); headB.moveTo([tab.xB, tab.head, 0]);
  await until(S(7));
  await play(new M.FadeIn(new M.VGroup(...rows.flatMap(r => [r.guide, r.sTag, ...(r.tTag ? [r.tTag] : [])]), cap, headS, headA, headB)),
    new M.LaggedStart(rows.map(r => new M.FadeIn(r.da.g)), { lagRatio: 0.12, runTime: 1.1 }), ...say('RECIPE A: 4 SAMPLES', C.cyan));

  // 8: A's errors
  await until(S(8));
  await play(...rows.flatMap(r => [new M.Create(r.sa), new M.FadeIn(r.ta)]), ...say('A ERRORS: +1, −1, +0.5, −0.5', C.cyan));

  // 9: Recipe B dots
  await until(S(9));
  await play(new M.LaggedStart(rows.map(r => new M.FadeIn(r.db.g)), { lagRatio: 0.12, runTime: 1.1 }), ...say('RECIPE B: FROM THE GOLD LINE', PINK));

  // 10: B's errors
  await until(S(10));
  await play(...rows.flatMap(r => [...(r.sb ? [new M.Create(r.sb)] : []), new M.FadeIn(r.tb)]), ...say('B ERRORS: 0, −1, −0.25, −0.75', PINK));

  // 11: most of B's errors are below the line
  await until(S(11));
  await play(new M.LaggedStart(rows.filter(r => r.sb).map(r => new M.Indicate(r.sb, { color: PINK })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['B errors: 0, −1, −0.25, −0.75', PINK], 'mostly below 501:', ['its lean', PINK]], PINK), ...say('MOST OF B IS BELOW 501', PINK));

  // 12: square each error
  await until(S(12));
  await play(...fbox(['square each error', '−1 × −1 = 1', ['both sides count,', C.violet], ['big misses count more', C.violet]], C.violet), ...say('SQUARE EACH ERROR', C.violet));

  // 13: for A, squares are 1, 1, 0.25, 0.25 (A column turns into squares)
  await until(S(13));
  await play(new M.FadeOut(headA), new M.FadeIn(headA2), ...rows.flatMap(r => [new M.FadeOut(r.ta), new M.FadeIn(r.ta2)]),
    ...fbox([['A squared errors', C.cyan], '1, 1, 0.25, 0.25', ['all positive now', C.green]], C.cyan), ...say('A SQUARES: 1, 1, 0.25, 0.25', C.cyan));

  // 14: average the squares over many days
  await until(S(14));
  await play(...fbox(['average the squares', ['over many, many days', C.violet]], C.violet), ...say('AVERAGE OVER MANY, MANY DAYS', C.violet));

  // 15: mean squared error
  await until(S(15));
  await play(...fbox([['MEAN SQUARED ERROR', C.amber], 'long-run average of', '(guess − true value)²'], C.amber), ...say('MEAN SQUARED ERROR', C.amber));

  // 16: smaller is better, 0 = perfect
  await until(S(16));
  await play(...fbox(['smaller is better', ['0 = every guess perfect', C.green]], C.green), ...say('SMALLER = BETTER', C.green));

  // 17: splits into two pieces
  const rowStuff = rows.flatMap(r => [r.guide, r.sTag, r.da.g, r.db.g, r.sa, ...(r.sb ? [r.sb] : [])]);
  const tableStuff = [cap, headS, headA2, headB, ...rows.flatMap(r => [r.ta2, r.tb, ...(r.tTag ? [r.tTag] : [])])];
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(...rowStuff, ...tableStuff)),
    ...fbox([['MSE splits into', C.amber], ['two pieces we know', C.amber]], C.amber), ...say('SPLITS INTO TWO PIECES', C.amber));

  // 18: picture sample 2's pink error as two steps
  const labX = n2x(501.3);
  const sideLab = (s, k, color) => { const t = T(s, NUM, color, true); t.moveTo([labX + t.getWidth() / 2, rowY(k), 0]); return t; };
  const pinkCentre = new M.Line({ start: [n2x(500.5), LY, 0], end: [n2x(500.5), rowY(0) + 0.2, 0], color: PINK, strokeWidth: 4 });
  const pinkLab = sideLab('pink line: B centre 500.5', 0, PINK);
  const s2 = dot(500, rowY(2), PINK, true);
  const s2Lab = sideLab('S2: B said 500', 3, PINK);
  const arrow = (a, b, y, color) => new M.Arrow({ start: [n2x(a), y, 0], end: [n2x(b), y, 0], color, strokeWidth: 5, buff: 0, tipLength: 0.16 });
  const step1 = arrow(501, 500.5, rowY(1), C.amber), step1Lab = sideLab('step 1 = bias: −0.5', 1, C.amber);
  const step2 = arrow(500.5, 500, rowY(2), PINK), step2Lab = sideLab('step 2 = scatter: −0.5', 2, PINK);
  await until(S(18));
  await play(new M.Create(pinkCentre), new M.FadeIn(pinkLab), new M.FadeIn(s2.g), new M.FadeIn(s2Lab), ...say('ERROR = TWO STEPS', PINK));

  // 19: step 1 = gold line to pink centre (bias)
  await until(S(19));
  await play(new M.GrowArrow(step1), new M.FadeIn(step1Lab), ...say('STEP 1: BIAS (501 → 500.5)', C.amber));

  // 20: step 2 = pink centre to dot (scatter)
  await until(S(20));
  await play(new M.GrowArrow(step2), new M.FadeIn(step2Lab), ...say('STEP 2: SCATTER (500.5 → 500)', PINK));

  // 21: Sample 2: B=500, centre=500.5, gold=501
  await until(S(21));
  await play(new M.Indicate(s2.d, { color: PINK }), ...fbox(['sample 2: B = 500', ['B centre = 500.5', PINK], ['truth = 501', C.amber]], PINK), ...say('S2: B = 500, CENTRE = 500.5', PINK));

  // 22: error -1 = bias (-0.5) + scatter (-0.5)
  await until(S(22));
  await play(...fbox(['error = 500 − 501 = −1', ['= bias step −0.5', C.amber], ['+ scatter step −0.5', PINK]], C.ink), ...say('−1 = −0.5 (BIAS) + −0.5 (SCATTER)', C.ink));

  // 23: square & average scatter -> variance
  await until(S(23));
  await play(new M.Indicate(step2, { color: PINK }), ...fbox(['scatter steps:', 'square, then average', ['= VARIANCE', C.violet]], C.violet), ...say('SCATTER² → VARIANCE', C.violet));

  // 24: square bias -> bias²
  await until(S(24));
  await play(new M.Indicate(step1, { color: C.amber }), ...fbox(['bias step, squared', ['= BIAS²', C.amber]], C.amber), ...say('BIAS STEP² → BIAS²', C.amber));

  // 25: MSE = variance + bias²
  await until(S(25));
  await play(...fbox([['MSE = variance + bias²', C.green]], C.green), ...say('MSE = VARIANCE + BIAS²', C.green));

  // 26: why only two pieces? scatter steps cancel out
  await until(S(26));
  await play(...fbox(['scatter steps go up', 'as often as down:', ['no extra lean', C.muted]], C.ink), ...say('SCATTER UP & DOWN CANCELS OUT', C.muted));

  // 27-34: MSE bar chart on its own axis (0 to 2.5 squared ml)
  const CY = P ? -4.6 : LY, cx0 = x0, CW = L0, m2x = v => cx0 + v / 2.5 * CW;
  const cAxis = new M.Line({ start: [cx0, CY, 0], end: [cx0 + CW, CY, 0], color: C.muted, strokeWidth: 3 });
  const cTicks = [0, 0.5, 1, 1.5, 2, 2.5].map(v => new M.VGroup(
    new M.Line({ start: [m2x(v), CY - 0.08, 0], end: [m2x(v), CY + 0.08, 0], color: C.muted }),
    T(String(v), P ? 16 : 17, C.muted, true).moveTo([m2x(v), CY - 0.36, 0])));
  const cTitle = T('MSE (squared ml)', P ? 17 : 17, C.muted); cTitle.moveTo([cx0 + CW / 2, CY - 0.8, 0]);
  const yA = P ? -0.9 : rowY(0) - 0.2, yB = P ? -2.6 : rowY(2) - 0.1, BH = P ? 0.8 : 0.55;
  const rect = (v0, v1, y, color) => {
    const r = new M.Rectangle({ width: m2x(v1) - m2x(v0), height: BH, color, strokeWidth: 2 });
    r.setFill(color, 0.55); r.moveTo([(m2x(v0) + m2x(v1)) / 2, y, 0]); return r;
  };
  const rowName = (s, y, color) => { const t = T(s, 20, color, true, true); t.moveTo([cx0 - 0.3, y, 0]); return t; };
  const nameA = rowName('A', yA, C.cyan), nameB = rowName('B', yB, PINK);
  const barA = rect(0, 1, yA, C.cyan);
  const valA = T('1', NUM, C.cyan, true, true); valA.moveTo([m2x(1) + 0.3, yA, 0]);
  const barBv = rect(0, 0.25, yB, C.violet), barBb = rect(0.25, 0.5, yB, C.amber);
  const valB = T('0.5', NUM, PINK, true, true); valB.moveTo([m2x(0.5) + 0.4, yB, 0]);
  const keyV = T('violet: variance', P ? 16 : 16, C.violet, true), keyB = T('amber: bias²', P ? 16 : 16, C.amber, true);
  const kY = yB - (P ? 0.8 : 0.6);
  keyV.moveTo([cx0 + keyV.getWidth() / 2, kY, 0]); keyB.moveTo([cx0 + keyV.getWidth() + 0.4 + keyB.getWidth() / 2, kY, 0]);
  const pic = [pinkCentre, pinkLab, s2.g, s2Lab, step1, step1Lab, step2, step2Lab];

  await until(S(27));
  await play(new M.FadeOut(new M.VGroup(...pic, ...base.all)),
    new M.FadeIn(new M.VGroup(cAxis, ...cTicks, cTitle, nameA, nameB)),
    ...fbox([['Recipe A', C.cyan], 'MSE = variance + bias²'], C.cyan), ...say('COMPUTE RECIPE A', C.cyan));

  // 28: Var(A) = 1, Bias(A) = 0
  await until(S(28));
  await play(...fbox([['Recipe A', C.cyan], 'variance = 1', 'bias = 0, 0² = 0'], C.cyan), ...say('A: VARIANCE 1, BIAS² 0', C.cyan));

  // 29: 1 + 0 = 1
  await until(S(29));
  await play(new M.FadeIn(barA), new M.FadeIn(valA), ...fbox([['Recipe A', C.cyan], '1 + 0 = 1'], C.cyan), ...say('MSE OF A = 1', C.cyan));

  // 30: Now Recipe B
  await until(S(30));
  await play(new M.Indicate(nameB, { color: PINK }), ...fbox([['Recipe B', PINK], 'MSE = variance + bias²'], PINK), ...say('NOW RECIPE B', PINK));

  // 31: Var(B) = 0.25
  await until(S(31));
  await play(new M.FadeIn(barBv), new M.FadeIn(keyV), ...fbox([['Recipe B', PINK], 'variance = 0.25'], PINK), ...say('B: VARIANCE = 0.25', PINK));

  // 32: Bias(B) = -0.5, (-0.5)² = 0.25
  await until(S(32));
  await play(new M.FadeIn(barBb), new M.FadeIn(keyB), ...fbox([['Recipe B', PINK], 'variance = 0.25', 'bias² = −0.5 × −0.5', '      = 0.25'], PINK), ...say('B: BIAS² = 0.25', C.amber));

  // 33: 0.25 + 0.25 = 0.5
  await until(S(33));
  await play(new M.FadeIn(valB), ...fbox([['Recipe B', PINK], '0.25 + 0.25 = 0.5'], PINK), ...say('MSE OF B = 0.5', PINK));

  // 34: B scores half as much as A -> B wins here
  await until(S(34));
  await play(new M.Indicate(valB, { color: C.green }), ...fbox([['MSE of A = 1', C.cyan], ['MSE of B = 0.5', PINK], ['B wins here', C.green]], C.green), ...say('B SCORES HALF OF A → B WINS', C.green));

  // 35: a little lean bought a big cut in scatter
  await until(S(35));
  await play(new M.Indicate(barBb, { color: C.amber }), ...say('LITTLE LEAN → BIG CUT IN SCATTER', C.amber));

  // 36: archers analogy
  await until(S(36));
  await play(...fbox(['steady pull to one side', ['can beat', C.green], 'wild shots all around'], C.ink), ...say('STEADY PULL BEATS WILD SHOTS', C.ink));

  // 37: formula MSE = variance + bias²
  await until(S(37));
  await play(...fbox([['MSE = variance + bias²', C.amber]], C.amber), ...say('MSE = VARIANCE + BIAS²', C.amber));

  // 38: read it in words
  await until(S(38));
  await play(...fbox(['MSE = mean squared error', ['average squared miss', C.amber], ['= scatter + lean²', C.amber]], C.amber), ...say('AVERAGE MISS² = SCATTER + LEAN²', C.amber));

  // 39: what is it for?
  await until(S(39));
  await play(...fbox(['one number compares', 'any two recipes,', ['leaning or not', C.green]], C.green), ...say('ONE NUMBER COMPARES ANY TWO RECIPES', C.green));

  // 40: bias-variance trade-off
  await until(S(40));
  await play(...fbox(['THE TRADE-OFF', ['accept a little bias', C.amber], ['to cut a lot of variance', C.violet]], C.green), ...say('THE BIAS-VARIANCE TRADE-OFF', C.green));

  // 41: Trap - B wins only because dial 500 is close to 501 (ml line comes back, fresh)
  const base2 = buildBase();
  const chart = [cAxis, ...cTicks, cTitle, nameA, nameB, barA, valA, barBv, barBb, valB, keyV, keyB];
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(...chart)), new M.FadeIn(new M.VGroup(...base2.all)),
    ...fbox(['B wins only because', ['dial 500 is close', C.muted], ['to the truth 501', C.amber]], C.violet), ...say('TRAP: ONLY BECAUSE DIAL IS CLOSE', C.violet));

  // 42: repair moves true mean to 503
  const gold503 = new M.DashedLine({ start: [n2x(503), LY, 0], end: [n2x(503), goldTop, 0], color: C.amber, strokeWidth: 3 });
  const tag503 = pill('NEW TRUE 503', C.amber, 16); tag503.moveTo([n2x(503), goldTop + 0.3, 0]);
  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(base2.gold, base2.goldTag)), new M.Create(gold503), new M.FadeIn(tag503),
    ...fbox(['after a repair:', ['true average = 503', C.amber]], C.amber), ...say('REPAIR → TRUE MEAN = 503 ml', C.amber));

  // 43: B's centre moves to 501.5
  const bNew = new M.Line({ start: [n2x(501.5), LY, 0], end: [n2x(501.5), rowY(1), 0], color: PINK, strokeWidth: 4 });
  const bNewLab = T('B centre 501.5', NUM, PINK, true); bNewLab.moveTo([n2x(501.5), rowY(1) + 0.35, 0]);
  await until(S(43));
  await play(new M.Create(bNew), new M.FadeIn(bNewLab), ...fbox(['(503 + 500) ÷ 2', ['= 501.5', PINK]], PINK), ...say('B CENTRE = 501.5', PINK));

  // 44: bias = -1.5, bias² = 2.25
  const bigBias = new M.Arrow({ start: [n2x(503), rowY(2), 0], end: [n2x(501.5), rowY(2), 0], color: C.violet, strokeWidth: 5, buff: 0, tipLength: 0.18 });
  const bigLab = T('bias −1.5', NUM, C.violet, true); bigLab.moveTo([n2x(502.25), rowY(2) - 0.38, 0]);
  await until(S(44));
  await play(new M.GrowArrow(bigBias), new M.FadeIn(bigLab), ...fbox(['bias = 501.5 − 503', ['= −1.5', C.violet], ['bias² = 2.25', C.violet]], C.violet), ...say('BIAS = −1.5  →  BIAS² = 2.25', C.violet));

  // 45: MSE(B) = 0.25 + 2.25 = 2.5; A (1) wins
  await until(S(45));
  await play(...fbox([['MSE of B:', PINK], ['0.25 + 2.25 = 2.5', PINK], ['MSE of A = 1: A wins', C.cyan]], C.cyan), ...say('B: 2.5  vs  A: 1 → A WINS', C.cyan));

  // 46: truth is hidden
  await until(S(46));
  await play(new M.Indicate(base2.dial, { color: C.muted }), ...fbox(['truth is hidden:', ['is the dial close?', C.muted], 'we never know for sure'], C.ink), ...say('TRUTH IS HIDDEN: IS THE DIAL CLOSE?', C.muted));

  // 47: one-sentence summary
  await until(S(47));
  await play(...fbox([['MEAN SQUARED ERROR', C.amber], 'average squared miss', ['= variance + bias²', C.green]], C.green), ...say('MSE = VARIANCE + BIAS²', C.green));
}
