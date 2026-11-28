// lesson 5.2.4
// 5.2.4 Normal standardization. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const GOLD = C.gold || C.amber;

  // Layout constants (phone 8x14.22, y in [-5.5, 4.3]; laptop 14.22x8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.2;
  const AX_W = P ? 6.6 : 7.4;
  const X0 = CX - AX_W / 2;
  const BASE = P ? -4.6 : -2.1;
  const HMAX = P ? 5.0 : 2.9;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.4, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Grams scale: [490, 510] -> x; density [0, 0.22] -> y
  const w2x = v => X0 + ((v - 490) / 20) * AX_W;
  const d2y = d => BASE + (d / 0.22) * HMAX;
  const normPDF = (v, mu, sd) => (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((v - mu) / sd, 2));

  // Standard normal z-scale: [-3.5, 3.5] -> x; std density [0, 0.44] -> y
  const z2x = z => X0 + ((z + 3.5) / 7) * AX_W;
  const zd2y = d => BASE + (d / 0.44) * HMAX;
  const stdPDF = z => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);

  function makeCurve(mu, sd, color, sw = 3.5, steps = 60) {
    const segs = [];
    for (let i = 0; i < steps; i++) {
      const a = 490 + (i / steps) * 20;
      const b = 490 + ((i + 1) / steps) * 20;
      segs.push(new M.Line({ start: [w2x(a), d2y(normPDF(a, mu, sd)), 0], end: [w2x(b), d2y(normPDF(b, mu, sd)), 0], color, strokeWidth: sw }));
    }
    return new M.VGroup(...segs);
  }

  function makeShade(mu, sd, v1, v2, color, opacity = 0.45, steps = 30) {
    const verts = [[w2x(v1), BASE, 0]];
    for (let i = 0; i <= steps; i++) {
      const v = v1 + (i / steps) * (v2 - v1);
      verts.push([w2x(v), d2y(normPDF(v, mu, sd)), 0]);
    }
    verts.push([w2x(v2), BASE, 0]);
    const poly = new M.Polygon({ vertices: verts, color, strokeWidth: 1.5 });
    poly.setFill(color, opacity);
    return poly;
  }

  function makeStdCurve(color = C.violet, sw = 4, steps = 60) {
    const segs = [];
    for (let i = 0; i < steps; i++) {
      const a = -3.5 + (i / steps) * 7;
      const b = -3.5 + ((i + 1) / steps) * 7;
      segs.push(new M.Line({ start: [z2x(a), zd2y(stdPDF(a)), 0], end: [z2x(b), zd2y(stdPDF(b)), 0], color, strokeWidth: sw }));
    }
    return new M.VGroup(...segs);
  }

  function makeStdShade(z1, z2, color, opacity = 0.45, steps = 32) {
    const verts = [[z2x(z1), BASE, 0]];
    for (let i = 0; i <= steps; i++) {
      const z = z1 + (i / steps) * (z2 - z1);
      verts.push([z2x(z), zd2y(stdPDF(z)), 0]);
    }
    verts.push([z2x(z2), BASE, 0]);
    const poly = new M.Polygon({ vertices: verts, color, strokeWidth: 1.5 });
    poly.setFill(color, opacity);
    return poly;
  }

  // Formula box helper
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Shared grams axis
  const axisG = new M.Line({ start: [w2x(490), BASE, 0], end: [w2x(510), BASE, 0], color: C.muted, strokeWidth: 3 });
  const ticksG = [492, 496, 500, 504, 508].map(v => new M.VGroup(
    new M.Line({ start: [w2x(v), BASE - 0.08, 0], end: [w2x(v), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, C.muted, true).moveTo([w2x(v), BASE - 0.36, 0])
  ));
  const unitG = T('grams', 16, C.muted); unitG.moveTo([w2x(510) - 0.15, BASE - 0.72, 0]);

  // 0-4: underweight rule (< 496 g), Machine A vs Machine C
  const limitLine = new M.DashedLine({ start: [w2x(496), BASE, 0], end: [w2x(496), BASE + HMAX * 0.95, 0], color: C.amber });
  const limitTag = pill('UNDERWEIGHT < 496 g', C.amber, 15); limitTag.moveTo([w2x(494.2), BASE + HMAX * 0.85, 0]);

  await until(S(0));
  await play(
    new M.Create(axisG),
    new M.FadeIn(new M.VGroup(...ticksG, unitG)),
    new M.Create(limitLine),
    new M.FadeIn(limitTag),
    ...say('RULE: UNDER 496 g = UNDERWEIGHT', C.amber)
  );

  await until(S(1));
  await play(...say('HOW OFTEN DOES IT HAPPEN?', C.amber), ...fbox([['LIMIT', C.amber], 'underweight < 496 g', 'how often?'], C.amber));

  const curveA = makeCurve(500, 2, C.cyan, 4);
  await until(S(2));
  await play(new M.FadeIn(curveA), ...say('MACHINE A: MEAN 500, SD 2', C.cyan), ...fbox([['MACHINE A', C.cyan], 'mean = 500 g', 'sd   = 2 g']));

  const curveC = makeCurve(500, 4, GOLD, 4);
  await until(S(3));
  await play(new M.FadeIn(curveC), ...say('MACHINE C: MEAN 500, SD 4', GOLD), ...fbox([['MACHINE A', C.cyan], 'mean 500, sd 2', ['MACHINE C', GOLD], 'mean 500, sd 4'], GOLD));

  await until(S(4));
  await play(new M.Indicate(limitLine, { color: C.amber }), ...say('WHICH MAKES MORE UNDERWEIGHT?', C.amber));

  // 5-12: Machine A tail & z-score = -2
  await until(S(5));
  await play(new M.FadeOut(curveC), ...say('MACHINE A FIRST: LIMIT AT 496 g', C.cyan));

  const tailA = makeShade(500, 2, 490, 496, C.amber, 0.55);
  await until(S(6));
  await play(new M.FadeIn(tailA), ...say('THIN TAIL TO THE LEFT OF 496', C.amber));

  await until(S(7));
  await play(new M.Indicate(tailA, { color: C.amber }), ...say('CHANCE = AREA OF THAT TAIL', C.amber));

  await until(S(8));
  await play(...say('MEASURE DISTANCE IN SD STEPS', C.green), ...fbox([['KEY IDEA', C.green], 'distance from mean', 'in standard deviations'], C.green));

  const distLine = new M.Line({ start: [w2x(500), BASE + 0.45, 0], end: [w2x(496), BASE + 0.45, 0], color: C.amber, strokeWidth: 3.5 });
  const distLbl = T('4 g below', 17, C.amber, true); distLbl.moveTo([w2x(498), BASE + 0.78, 0]);
  await until(S(9));
  await play(new M.Create(distLine), new M.FadeIn(distLbl), ...say('500 DOWN TO 496 = 4 GRAMS', C.amber));

  const step1 = new M.Arc({ radius: (w2x(500) - w2x(498)) / 2, startAngle: 0, angle: Math.PI, color: C.green, strokeWidth: 3 });
  step1.moveTo([w2x(499), BASE + 0.25, 0]);
  const step2 = new M.Arc({ radius: (w2x(498) - w2x(496)) / 2, startAngle: 0, angle: Math.PI, color: C.green, strokeWidth: 3 });
  step2.moveTo([w2x(497), BASE + 0.25, 0]);
  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(distLine, distLbl)), new M.Create(step1), new M.Create(step2), ...say('4 GRAMS ÷ 2 GRAMS = 2 STEPS', C.green));

  const zTagA = pill('2 STEPS BELOW', C.green, 15); zTagA.moveTo([w2x(493), BASE + HMAX * 0.5, 0]);
  await until(S(11));
  await play(new M.FadeIn(zTagA), ...say('2 STEPS BELOW THE MEAN', C.green));

  await until(S(12));
  await play(...say('Z-SCORE = −2', C.violet), ...fbox([['MACHINE A', C.cyan], '496 − 500 = −4 g', ['z = −4 ÷ 2 = −2', C.violet]], C.violet));

  // 13-22: standard normal curve (mean 0, sd 1), area left of -2 = 0.023
  const axisZ = new M.Line({ start: [z2x(-3.5), BASE, 0], end: [z2x(3.5), BASE, 0], color: C.muted, strokeWidth: 3 });
  const ticksZ = [-3, -2, -1, 0, 1, 2, 3].map(z => new M.VGroup(
    new M.Line({ start: [z2x(z), BASE - 0.08, 0], end: [z2x(z), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(z > 0 ? `+${z}` : String(z), 17, C.muted, true).moveTo([z2x(z), BASE - 0.36, 0])
  ));
  const unitZ = T('z (steps)', 16, C.violet, true); unitZ.moveTo([z2x(3.5) - 0.35, BASE - 0.72, 0]);
  const stdCurve = makeStdCurve(C.violet, 4);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(axisG, ...ticksG, unitG, limitLine, limitTag, curveA, tailA, step1, step2, zTagA)),
    new M.Create(axisZ),
    new M.FadeIn(new M.VGroup(...ticksZ, unitZ)),
    new M.FadeIn(stdCurve),
    ...say('STANDARD BELL: MEAN 0, SD 1', C.violet)
  );

  await until(S(14));
  await play(...say('STANDARD NORMAL CURVE (−3 TO +3)', C.violet), ...fbox([['STANDARD NORMAL', C.violet], 'mean = 0', 'sd   = 1'], C.violet));

  await until(S(15));
  await play(...say('EVERY BELL BECOMES THIS ONE', C.cyan));

  await until(S(16));
  await play(...say('ONE SHARED CURRENCY FOR ALL BELLS', C.muted));

  const zLineA = new M.DashedLine({ start: [z2x(-2), BASE, 0], end: [z2x(-2), zd2y(stdPDF(-2)) + 0.9, 0], color: C.amber });
  const stdTailA = makeStdShade(-3.5, -2, C.amber, 0.55);
  await until(S(17));
  await play(new M.Create(zLineA), new M.FadeIn(stdTailA), ...say('AREA TO THE LEFT OF z = −2?', C.amber));

  await until(S(18));
  await play(...say('READ FROM TABLE OR SPREADSHEET', C.cyan));

  const aLbl = T('0.023', 19, C.amber, true); aLbl.moveTo([z2x(-2.55), BASE + 0.65, 0]);
  await until(S(19));
  await play(new M.FadeIn(aLbl), ...say('AREA LEFT OF −2 ≈ 0.023', C.amber), ...fbox([['MACHINE A (z = −2)', C.cyan], ['area = 0.0228 ≈ 0.023', C.amber]], C.amber));

  await until(S(20));
  await play(...say('≈ 2.3%  (~23 BAGS IN 1,000)', C.green), ...fbox([['MACHINE A', C.cyan], 'z = −2', ['≈ 2.3%  (23 in 1,000)', C.green]], C.green));

  const mid95 = makeStdShade(-2, 2, C.cyan, 0.22);
  await until(S(21));
  await play(new M.FadeIn(mid95), ...say('CHECK: 95% WITHIN ±2 → 5% OUTSIDE', C.cyan));

  await until(S(22));
  await play(new M.FadeOut(mid95), new M.Indicate(stdTailA, { color: C.amber }), ...say('HALF OF 5% ≈ 2.5%: CLOSE TO 2.3%', C.amber),
    ...fbox([['QUICK CHECK', C.cyan], '5% ÷ 2 = 2.5%', ['table: 2.3%  (close)', C.green]], C.green));

  // 23-29: Machine C: z = -1, area = 0.16 (159 in 1,000) -> ~7x more
  await until(S(23));
  await play(...say('NOW MACHINE C, STEP BY STEP', GOLD), ...fbox([['MACHINE C', GOLD], 'mean = 500 g', 'sd   = 4 g'], GOLD));

  await until(S(24));
  await play(...say('500 DOWN TO 496 = 4 GRAMS AGAIN', GOLD));

  await until(S(25));
  await play(...say('SD = 4 GRAMS → JUST 1 STEP', GOLD), ...fbox([['MACHINE C', GOLD], '496 − 500 = −4 g', 'sd = 4 g → 1 step'], GOLD));

  const zLineC = new M.DashedLine({ start: [z2x(-1), BASE, 0], end: [z2x(-1), zd2y(stdPDF(-1)) + 0.6, 0], color: GOLD });
  await until(S(26));
  await play(new M.Create(zLineC), ...say('Z-SCORE = −1', GOLD), ...fbox([['MACHINE C', GOLD], ['z = −4 ÷ 4 = −1', GOLD]], GOLD));

  const stdTailC = makeStdShade(-3.5, -1, GOLD, 0.42);
  const cLbl = T('0.16', 21, C.ink, true); cLbl.moveTo([z2x(-1.5), BASE + (P ? 0.45 : 0.3), 0]);
  await until(S(27));
  await play(new M.FadeIn(stdTailC), new M.FadeIn(cLbl), ...say('AREA LEFT OF −1 ≈ 0.16', GOLD), ...fbox([['MACHINE C (z = −1)', GOLD], ['area = 0.159 ≈ 0.16', GOLD]], GOLD));

  await until(S(28));
  await play(...say('≈ 16%  (~159 BAGS IN 1,000)', GOLD), ...fbox([['MACHINE C', GOLD], 'z = −1', ['≈ 16%  (159 in 1,000)', GOLD]], GOLD));

  await until(S(29));
  await play(...say('MACHINE C: ~7× MORE UNDERWEIGHT!', C.amber), ...fbox([['SAME MEAN, SAME LIMIT', C.ink], ['A:  23 in 1,000', C.cyan], ['C: 159 in 1,000  (~7×)', GOLD]], C.amber));

  // 30-35: short version & what it is for
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(zLineA, stdTailA, aLbl, zLineC, stdTailC, cLbl)), ...say('THE SHORT VERSION', C.cyan));

  await until(S(31));
  await play(...say('z = (VALUE − MEAN) ÷ SD', C.green), ...fbox([['z-score formula', C.cyan], ['z = (value − mean) ÷ sd', C.green]], C.green));

  await until(S(32));
  await play(...say('DISTANCE FROM MEAN IN SD STEPS', C.green));

  const demoTail = makeStdShade(-3.5, -1.5, C.violet, 0.42);
  await until(S(33));
  await play(new M.FadeIn(demoTail), ...say('THEN READ AREA ON STANDARD CURVE', C.violet));

  await until(S(34));
  await play(...say('ANY TOLERANCE → A CHANCE', C.cyan), ...fbox([['USED FOR', C.cyan], 'turn any tolerance', 'into a chance']));

  await until(S(35));
  await play(...say('COMPARE MACHINES ON ONE SCALE', C.green));

  // 36-38: common trap — sign/side (1 - left area) & must be normal
  await until(S(36));
  await play(new M.FadeOut(demoTail), ...say('TRAP: WATCH THE SIGN AND SIDE', C.amber));

  const rightTail = makeStdShade(1.5, 3.5, C.amber, 0.48);
  const rtLbl = T('1 − left area', 17, C.amber, true); rtLbl.moveTo([z2x(2.2), BASE + 0.95, 0]);
  await until(S(37));
  await play(new M.FadeIn(rightTail), new M.FadeIn(rtLbl), ...say('ABOVE A LIMIT = 1 − LEFT AREA', C.amber), ...fbox([['WATCH THE SIDE', C.amber], 'table = area to left', ['above = 1 − left area', C.amber]], C.amber));

  await until(S(38));
  await play(new M.FadeOut(new M.VGroup(rightTail, rtLbl)), ...say('ONLY VALID FOR A BELL CURVE', C.amber));

  // 39-40: next lesson (lifetimes) & one-sentence summary
  await until(S(39));
  await play(...say('NEXT: HOW LONG MACHINE PARTS LAST', C.violet));

  const finalTail = makeStdShade(-3.5, -2, C.cyan, 0.45);
  await until(S(40));
  await play(
    new M.FadeIn(finalTail),
    ...say('STEPS FROM MEAN → STANDARD BELL AREA', C.green),
    ...fbox([['STANDARDIZATION', C.violet], ['z = (value − mean) ÷ sd', C.green], 'read area on standard bell'], C.green)
  );
}
