// lesson 7.3.2
// 7.3.2 Two-proportion z-test (live manim-web scene).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 3.85, 0] : [CX, 2.05, 0];
  const BOXP = P ? [0, 2.35, 0] : [4.35, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // 0: Last lesson, one count vs fixed 1/2
  const recapTag = pill('LAST LESSON: 9/10 vs FIXED 50%', C.muted, P ? 17 : 18);
  recapTag.moveTo([CX, P ? -0.8 : -0.35, 0]);
  const recapMarks = [];
  for (let k = 0; k < 10; k++) {
    const m = T(k === 3 ? '✕' : '✓', P ? 30 : 30, k === 3 ? C.muted : C.green, true);
    m.moveTo([CX + (k - 4.5) * (P ? 0.62 : 0.6), P ? 0.4 : 0.75, 0]);
    recapMarks.push(m);
  }
  await until(S(0));
  await play(new M.FadeIn(recapTag), new M.LaggedStart(recapMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.1, runTime: 1.2 }), ...say('BEFORE: ONE COUNT VS 1/2', C.muted));

  // 1: Fairer test: old script vs new script side by side
  const gX1 = CX - (P ? 1.85 : 2.15), gX2 = CX + (P ? 1.85 : 2.15), gY = P ? -1.1 : -0.45;
  const gW = P ? 3.1 : 3.3, gH = P ? 2.5 : 2.4;
  const oldBox = new M.RoundedRectangle({ width: gW, height: gH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  oldBox.setFill(C.card, 0.92); oldBox.moveTo([gX1, gY, 0]);
  const oldHead = T('OLD SCRIPT', P ? 20 : 21, C.amber, true); oldHead.moveTo([gX1, gY + 0.78, 0]);

  const newBox = new M.RoundedRectangle({ width: gW, height: gH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  newBox.setFill(C.card, 0.92); newBox.moveTo([gX2, gY, 0]);
  const newHead = T('NEW SCRIPT', P ? 20 : 21, C.cyan, true); newHead.moveTo([gX2, gY + 0.78, 0]);

  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(recapTag, ...recapMarks)),
    new M.FadeIn(new M.VGroup(oldBox, oldHead)),
    new M.FadeIn(new M.VGroup(newBox, newHead)),
    ...say('SIDE BY SIDE: OLD VS NEW', C.cyan)
  );

  // 2: 100 tickets each
  const oldN = T('100 tickets', P ? 18 : 19, C.muted, true); oldN.moveTo([gX1, gY + 0.25, 0]);
  const newN = T('100 tickets', P ? 18 : 19, C.muted, true); newN.moveTo([gX2, gY + 0.25, 0]);
  await until(S(2));
  await play(new M.FadeIn(oldN), new M.FadeIn(newN), ...say('100 TICKETS IN EACH GROUP', C.ink));

  // 3: Old script: 45/100 = 45%
  const oldRes = T('45 ✓  (45%)', P ? 22 : 23, C.amber, true); oldRes.moveTo([gX1, gY - 0.45, 0]);
  await until(S(3));
  await play(new M.FadeIn(oldRes), ...say('OLD SCRIPT: 45 OF 100 (45%)', C.amber));

  // 4: New script: 60/100 = 60%
  const newRes = T('60 ✓  (60%)', P ? 22 : 23, C.cyan, true); newRes.moveTo([gX2, gY - 0.45, 0]);
  await until(S(4));
  await play(new M.FadeIn(newRes), ...say('NEW SCRIPT: 60 OF 100 (60%)', C.cyan));

  // 5: Proportion = share of a group
  await until(S(5));
  await play(
    ...fbox(['proportion (rate):', ['45 / 100 = 45%', C.amber], ['60 / 100 = 60%', C.cyan]], C.cyan),
    ...say('PROPORTION = SHARE OF A GROUP', C.cyan)
  );

  // 6: Two bars: amber 45%, cyan 60%
  const BASE = P ? -4.6 : -2.3;
  const MAXH = P ? 4.4 : 3.4; // 100% height
  const bX1 = CX - (P ? 1.35 : 1.55), bX2 = CX + (P ? 1.35 : 1.55), bW = P ? 1.25 : 1.4;
  const h45 = 0.45 * MAXH, h60 = 0.60 * MAXH, h525 = 0.525 * MAXH;

  const axis = new M.Line({ start: [CX - 2.9, BASE, 0], end: [CX + 2.9, BASE, 0], color: C.muted, strokeWidth: 2 });
  const barOld = new M.Rectangle({ width: bW, height: h45, color: C.amber, strokeWidth: 2 });
  barOld.setFill(C.amber, 0.8); barOld.moveTo([bX1, BASE + h45 / 2, 0]);
  const barNew = new M.Rectangle({ width: bW, height: h60, color: C.cyan, strokeWidth: 2 });
  barNew.setFill(C.cyan, 0.8); barNew.moveTo([bX2, BASE + h60 / 2, 0]);

  const lblOld = T('Old: 45%', P ? 18 : 19, C.amber, true); lblOld.moveTo([bX1, BASE - 0.35, 0]);
  const lblNew = T('New: 60%', P ? 18 : 19, C.cyan, true); lblNew.moveTo([bX2, BASE - 0.35, 0]);

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(oldBox, oldHead, oldN, oldRes, newBox, newHead, newN, newRes)),
    new M.Create(axis),
    new M.FadeIn(barOld),
    new M.FadeIn(barNew),
    new M.FadeIn(lblOld),
    new M.FadeIn(lblNew),
    ...say('OLD 45%  VS  NEW 60%', C.cyan)
  );

  // 7: Gap = 15 percentage points
  const gapLine = new M.DoubleArrow({ start: [CX, BASE + h45, 0], end: [CX, BASE + h60, 0], color: C.green, strokeWidth: 3 });
  const gapDash1 = new M.DashedLine({ start: [bX1 + bW / 2, BASE + h45, 0], end: [CX + 0.2, BASE + h45, 0], color: C.amber });
  const gapDash2 = new M.DashedLine({ start: [CX - 0.2, BASE + h60, 0], end: [bX2 - bW / 2, BASE + h60, 0], color: C.cyan });
  const gapTag = pill('+15 pts', C.green, 16);
  gapTag.moveTo([CX, BASE + h60 + 0.42, 0]);
  await until(S(7));
  await play(
    new M.Create(gapDash1),
    new M.Create(gapDash2),
    new M.Create(gapLine),
    new M.FadeIn(gapTag),
    ...fbox(['gap = 60% − 45%', ['    = 15 percentage points', C.green]], C.green),
    ...say('GAP = 15 PERCENTAGE POINTS', C.green)
  );

  // 8: Is 15-point gap real or luck?
  await until(S(8));
  await play(new M.Indicate(gapTag, { color: C.amber }), ...say('REAL GAP, OR JUST LUCK?', C.amber));

  // 9: Null hypothesis: same resolution rate
  await until(S(9));
  await play(
    ...fbox(['null hypothesis:', ['both scripts have same rate', C.amber]], C.amber),
    ...say('NULL: BOTH SCRIPTS EQUAL', C.amber)
  );

  // 10: Estimate shared rate from all tickets together
  await until(S(10));
  await play(...say('ESTIMATE SHARED RATE FROM ALL', C.violet));

  // 11: One pile: 200 tickets
  await until(S(11));
  await play(
    ...fbox(['combine both groups:', ['100 + 100 = 200 tickets', C.violet]], C.violet),
    ...say('ONE PILE: 200 TICKETS', C.violet)
  );

  // 12: Resolved in total: 45 + 60 = 105
  await until(S(12));
  await play(
    ...fbox(['total tickets: 200', ['total resolved: 45 + 60 = 105', C.violet]], C.violet),
    ...say('RESOLVED: 45 + 60 = 105', C.violet)
  );

  // 13: 105 / 200 = 52.5%
  const poolLine = new M.DashedLine({ start: [CX - 2.6, BASE + h525, 0], end: [CX + 2.6, BASE + h525, 0], color: C.violet, strokeWidth: 3 });
  const poolTag = pill('POOLED: 52.5%', C.violet, 16);
  poolTag.moveTo([CX, BASE + h525 + 0.4, 0]);
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(gapLine, gapDash1, gapDash2, gapTag)),
    new M.Create(poolLine),
    new M.FadeIn(poolTag),
    ...fbox(['pooled rate:', ['105 / 200 = 52.5%', C.violet]], C.violet),
    ...say('105 / 200 = 52.5%', C.violet)
  );

  // 14: Pooled rate
  await until(S(14));
  await play(new M.Indicate(poolTag, { color: C.violet }), ...say('POOLED = POURED INTO ONE POOL', C.violet));

  // 15: How much would the gap wobble by luck?
  const L0 = P ? 6.6 : 7.4;
  const ZY = P ? -4.0 : -1.9;
  const z2x = z => CX + (z / 3.5) * (L0 / 2); // z from -3.5 to +3.5
  const zAxis = new M.Line({ start: [z2x(-3.5), ZY, 0], end: [z2x(3.5), ZY, 0], color: C.muted, strokeWidth: 2 });
  const zeroTick = new M.Line({ start: [z2x(0), ZY - 0.12, 0], end: [z2x(0), ZY + 0.12, 0], color: C.ink, strokeWidth: 2 });
  const zeroLbl = T('0', 18, C.ink, true); zeroLbl.moveTo([z2x(0), ZY - 0.36, 0]);
  const zTitle = T('gap (new − old) if both scripts are equal', 17, C.muted);
  zTitle.moveTo([CX, ZY - 0.85, 0]);
  const zTitle2 = T('gap in standard errors (z)', 17, C.muted);
  zTitle2.moveTo([CX, ZY - 0.85, 0]);

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(axis, barOld, barNew, lblOld, lblNew, poolLine, poolTag)),
    new M.Create(zAxis),
    new M.FadeIn(zeroTick),
    new M.FadeIn(zeroLbl),
    new M.FadeIn(zTitle),
    ...say('HOW MUCH DOES THE GAP WOBBLE?', C.amber)
  );

  // 16-17: Imagine running trial again and again; gap bounces around zero
  const WOBBLE = [-0.6, 0.9, -1.2, 0.3, -0.2, 1.1, -0.8, 0.5, -0.4, 0.7, 0.1, -1.0];
  const wDots = WOBBLE.map((v, k) => {
    const d = new M.Dot({ point: [z2x(v), ZY + 0.28 + (k % 3) * 0.24, 0], radius: 0.1, color: C.muted });
    d.setFill(C.muted, 0.85);
    return d;
  });
  await until(S(16));
  await play(new M.LaggedStart(wDots.slice(0, 6).map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 1.4 }), ...say('REPEAT TRIAL WITH EQUAL SCRIPTS', C.muted));

  await until(S(17));
  await play(new M.LaggedStart(wDots.slice(6).map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 1.4 }), ...say('GAP BOUNCES AROUND ZERO', C.muted));

  // 18: Standard error = typical size of bounce
  const seBracket = new M.DoubleArrow({ start: [z2x(0), ZY + 1.15, 0], end: [z2x(1), ZY + 1.15, 0], color: C.amber, strokeWidth: 3 });
  const seLbl = pill('1 SE ≈ 7 pts', C.amber, 15); seLbl.moveTo([z2x(0.5), ZY + 1.58, 0]);
  await until(S(18));
  await play(new M.Create(seBracket), ...say('TYPICAL BOUNCE = STANDARD ERROR', C.amber));

  // 19: About 7 percentage points
  await until(S(19));
  await play(
    new M.FadeIn(seLbl),
    ...fbox(['standard error (SE):', ['≈ 7 percentage points', C.amber]], C.amber),
    ...say('STANDARD ERROR ≈ 7 POINTS', C.amber)
  );

  // 20: Uses pooled rate (52.5%) and sizes (100, 100)
  await until(S(20));
  await play(...fbox(['pooled rate = 52.5%', 'group sizes: 100 and 100', ['SE ≈ 7.06 pts', C.amber]], C.amber));

  // 21: Why pooled rate
  await until(S(21));
  await play(...say('UNDER NULL: ONE SHARED RATE', C.violet));

  // 22: Measure our gap in these units
  await until(S(22));
  await play(...say('MEASURE OUR GAP IN SE UNITS', C.cyan));

  // 23: 15 / 7.06 ≈ 2.12
  await until(S(23));
  await play(
    ...fbox(['15 pts ÷ 7.06 pts', ['≈ 2.12 standard errors', C.cyan]], C.cyan),
    ...say('15 ÷ 7.06 ≈ 2.12', C.cyan)
  );

  // 24: Called z
  await until(S(24));
  await play(
    new M.Transform(zTitle, zTitle2),
    ...fbox([['z = 2.12', C.cyan], ['standard errors from zero', C.muted]], C.cyan),
    ...say('Z = 2.12 STANDARD ERRORS', C.cyan)
  );

  // 25: Bell curve centred on 0, gap marked at 2.12
  const BELLH = P ? 3.3 : 2.6;
  const bellY = z => ZY + BELLH * Math.exp(-0.5 * z * z);
  const bellPts = [];
  for (let i = 0; i <= 70; i++) {
    const z = -3.5 + (i / 70) * 7.0;
    bellPts.push([z2x(z), bellY(z), 0]);
  }
  const bell = new M.VMobject({ color: C.cyan, strokeWidth: 3 });
  bell.setPointsAsCorners(bellPts);
  bell.setFill(C.bg, 0);

  const zLinePos = new M.Line({ start: [z2x(2.12), ZY, 0], end: [z2x(2.12), bellY(2.12) + 0.9, 0], color: C.amber, strokeWidth: 3 });
  const zTagPos = pill('z = +2.12', C.amber, 15); zTagPos.moveTo([z2x(2.12), bellY(2.12) + 1.25, 0]);

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...wDots, seBracket, seLbl)),
    new M.Create(bell),
    new M.Create(zLinePos),
    new M.FadeIn(zTagPos),
    ...say('BELL CURVE AT 0 — OUR Z = 2.12', C.cyan)
  );

  // 26: Chance this far out on either side ≈ 3 in 100
  const rTailPts = [[z2x(2.12), ZY, 0]];
  for (let i = 0; i <= 20; i++) {
    const z = 2.12 + (i / 20) * (3.5 - 2.12);
    rTailPts.push([z2x(z), bellY(z), 0]);
  }
  rTailPts.push([z2x(3.5), ZY, 0]);
  const rTail = new M.Polygon({ vertices: rTailPts, color: C.amber, strokeWidth: 1 });
  rTail.setFill(C.amber, 0.7);

  const lTailPts = [[z2x(-3.5), ZY, 0]];
  for (let i = 0; i <= 20; i++) {
    const z = -3.5 + (i / 20) * (3.5 - 2.12);
    lTailPts.push([z2x(z), bellY(z), 0]);
  }
  lTailPts.push([z2x(-2.12), ZY, 0]);
  const lTail = new M.Polygon({ vertices: lTailPts, color: C.amber, strokeWidth: 1 });
  lTail.setFill(C.amber, 0.7);

  const zLineNeg = new M.Line({ start: [z2x(-2.12), ZY, 0], end: [z2x(-2.12), bellY(-2.12) + 0.9, 0], color: C.amber, strokeWidth: 2 });
  const zTagNeg = pill('-2.12', C.amber, 14); zTagNeg.moveTo([z2x(-2.12), bellY(-2.12) + 1.2, 0]);

  await until(S(26));
  await play(
    new M.FadeIn(rTail),
    new M.FadeIn(lTail),
    new M.Create(zLineNeg),
    new M.FadeIn(zTagNeg),
    ...say('EITHER SIDE: ~3 IN 100', C.amber)
  );

  // 27: p-value ≈ 0.034
  await until(S(27));
  await play(
    ...fbox([['z = 2.12', C.cyan], ['two-sided p ≈ 0.034', C.amber]], C.amber),
    ...say('P-VALUE ≈ 0.034', C.amber)
  );

  // 28: Below 5% -> reject null
  await until(S(28));
  await play(
    ...fbox([['p = 0.034 < 0.05', C.green], ['reject null: new looks better', C.green]], C.green),
    ...say('REJECT NULL: NEW SCRIPT BETTER', C.green)
  );

  // 29: The formula
  await until(S(29));
  await play(...say('THE FORMULA', C.cyan));

  // 30: z = difference / pooled SE
  await until(S(30));
  await play(
    ...fbox([['z = (new share − old share)', C.ink], ['     ÷ pooled SE', C.ink], ['  = 15% ÷ 7.06% ≈ 2.12', C.cyan]], C.cyan),
    ...say('Z = GAP ÷ POOLED SE', C.cyan)
  );

  // 31: Read it
  await until(S(31));
  await play(...say('GAP IN UNITS OF TYPICAL LUCK', C.amber));

  // 32: Pooled SE formula intro
  await until(S(32));
  await play(...fbox([['pooled SE =', C.violet], ['p = pooled rate = 0.525', C.muted]], C.violet));

  // 33: p * (1 - p)
  await until(S(33));
  await play(...fbox(['pooled SE =', ['  p × (1 − p)', C.violet], ['p = pooled rate = 0.525', C.muted]], C.violet));

  // 34: * (1/n1 + 1/n2)
  await until(S(34));
  await play(...fbox(['pooled SE =', '  p × (1 − p)', ['  × (1/n₁ + 1/n₂)', C.cyan], ['n₁, n₂ = group sizes (100)', C.muted]], C.violet));

  // 35: square root
  await until(S(35));
  await play(
    ...fbox(['pooled SE =', ['  √[ p × (1 − p) × (1/n₁ + 1/n₂) ]', C.amber], ['  = √[0.525 × 0.475 × 0.02]', C.muted], ['  ≈ 0.0706 (about 7 points)', C.amber]], C.amber),
    ...say('TAKE THE SQUARE ROOT', C.amber)
  );

  // 36: Idea is gap divided by wobble
  await until(S(36));
  await play(
    ...fbox([['z = gap ÷ wobble', C.cyan], ['software does the arithmetic', C.muted]], C.cyan),
    ...say('IDEA: GAP ÷ WOBBLE', C.cyan)
  );

  // 37: What is it for?
  await until(S(37));
  await play(
    ...fbox(['use: two separate groups', '• two adverts', '• two treatments', '• two shops'], C.green),
    ...say('TWO SHARES, TWO SEPARATE GROUPS', C.green)
  );

  // 38: Trap 1: bell curve needs enough cases
  await until(S(38));
  await play(...say('TRAP 1: NEEDS ENOUGH CASES', C.violet));

  // 39: Rule of thumb: at least ~5 resolved and ~5 not in each group
  await until(S(39));
  await play(
    ...fbox(['simple rule (each group):', ['≥ 5 resolved AND ≥ 5 not', C.violet]], C.violet),
    ...say('AT LEAST 5 YES & 5 NO EACH', C.violet)
  );

  // 40: Tiny groups -> exact method later
  await until(S(40));
  await play(...say('TINY GROUPS → USE EXACT TEST', C.muted));

  // 41: Trap 2: same customers in both groups
  await until(S(41));
  await play(
    ...fbox(['trap 2: same people twice', ['needs two SEPARATE groups', C.violet]], C.violet),
    ...say('TRAP 2: MUST BE SEPARATE GROUPS', C.violet)
  );

  // 42: In one sentence
  await until(S(42));
  await play(
    new M.Indicate(zTagPos, { color: C.amber }),
    ...fbox([['Two-proportion z-test', C.cyan], 'is the gap between two shares', ['big compared with luck?', C.amber]], C.cyan),
    ...say('TWO-PROPORTION Z-TEST', C.cyan)
  );
}
