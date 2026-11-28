// lesson 5.2.1
// 5.2.1 Densities and area. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, LINE_Y } = L;

  // Layout constants (phone 8x14.22, y in [-5.5, 4.3]; laptop 14.22x8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.2;
  const AX_W = P ? 6.6 : 7.4;
  const X0 = CX - AX_W / 2;
  const BASE = P ? -4.8 : -2.1;
  const HMAX = P ? 5.6 : 2.9;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.4, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Map weight v in [496, 504] to x, and density d in [0, 0.25] to y
  const w2x = v => X0 + ((v - 496) / 8) * AX_W;
  const d2y = d => BASE + (d / 0.25) * HMAX;
  const tentD = v => Math.max(0, 0.25 * (1 - Math.abs(v - 500) / 4));

  // Formula box helper (matching reference lesson)
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

  // 0-3: rice filling machine & bags
  const BS = P ? 1.45 : 1;
  const bagXs = [-1.9, 0, 1.9].map(dx => CX + dx * (P ? 1.27 : 1.05));
  const bagY = P ? -3.2 : -0.6;
  const bags = [];
  const label500s = [];
  const actuals = [];
  const sampleW = ['498.7 g', '500.4 g', '501.2 g'];
  for (let k = 0; k < 3; k++) {
    const x = bagXs[k];
    const body = new M.RoundedRectangle({ width: 1.25 * BS, height: 1.55 * BS, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
    body.setFill(C.card, 0.9); body.moveTo([x, bagY, 0]);
    const seal = new M.Rectangle({ width: 1.05 * BS, height: 0.18 * BS, color: C.muted, strokeWidth: 1.5 });
    seal.setFill(C.muted, 0.4); seal.moveTo([x, bagY + 0.86 * BS, 0]);
    bags.push(new M.VGroup(body, seal));
    const l500 = T('500 g', P ? 24 : 20, C.amber, true); l500.moveTo([x, bagY + 0.1 * BS, 0]);
    label500s.push(l500);
    const act = T(sampleW[k], P ? 19 : 17, k === 1 ? C.cyan : C.amber, true); act.moveTo([x, bagY - 0.42 * BS, 0]);
    actuals.push(act);
  }
  const hopper = new M.Polygon({
    vertices: [[CX - 0.8 * BS, bagY + 2.0 * BS, 0], [CX + 0.8 * BS, bagY + 2.0 * BS, 0], [CX + 0.25 * BS, bagY + 1.25 * BS, 0], [CX - 0.25 * BS, bagY + 1.25 * BS, 0]],
    color: C.muted, strokeWidth: 2
  });
  hopper.setFill(C.card, 0.85);

  await until(S(0));
  await play(new M.FadeIn(hopper), new M.LaggedStart(bags.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }), ...say('RICE FILLING MACHINE'));

  await until(S(1));
  await play(new M.LaggedStart(label500s.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }), ...say('LABEL: 500 GRAMS', C.amber));

  await until(S(2));
  await play(new M.LaggedStart(actuals.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.0 }), ...say('A LITTLE MORE, A LITTLE LESS', C.cyan));

  await until(S(3));
  await play(...say('CHANCE BETWEEN 498 g AND 502 g?', C.amber), ...fbox([['QUESTION', C.amber], '498 g  to  502 g', 'what is the chance?'], C.amber));

  // 4: weigh 200 bags -> build weight axis
  const axis = new M.Line({ start: [w2x(496), BASE, 0], end: [w2x(504), BASE, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = [496, 498, 500, 502, 504];
  const ticks = tickVals.map(v => new M.VGroup(
    new M.Line({ start: [w2x(v), BASE - 0.08, 0], end: [w2x(v), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, C.muted, true).moveTo([w2x(v), BASE - 0.36, 0])
  ));
  const unit = T('grams', 16, C.muted); unit.moveTo([w2x(504) - 0.1, BASE - 0.72, 0]);

  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(hopper, ...bags, ...label500s, ...actuals)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...say('WEIGH 200 BAGS FIRST')
  );

  // 5-9: 4 histogram bars (2g wide): 25, 75, 75, 25
  const counts = [25, 75, 75, 25];
  const binW = w2x(498) - w2x(496);
  const binOutlines = counts.map((_, k) => {
    const r = new M.Rectangle({ width: binW - 0.06, height: 0.14, color: C.muted, strokeWidth: 1.5 });
    r.setFill(C.muted, 0.15);
    r.moveTo([w2x(497 + k * 2), BASE + 0.07, 0]);
    return r;
  });

  await until(S(5));
  await play(new M.LaggedStart(binOutlines.map(r => new M.FadeIn(r)), { lagRatio: 0.1, runTime: 0.9 }), ...say('4 BOXES, EACH 2 GRAMS WIDE'));

  const bars = [];
  const barLabs = [];
  const barH = c => (c / 75) * (HMAX * 0.82);
  for (let k = 0; k < 4; k++) {
    const h = barH(counts[k]);
    const b = new M.Rectangle({ width: binW - 0.08, height: h, color: C.cyan, strokeWidth: 2 });
    b.setFill(C.cyan, 0.45);
    b.moveTo([w2x(497 + k * 2), BASE + h / 2, 0]);
    const lab = T(String(counts[k]), 20, C.cyan, true);
    lab.moveTo([w2x(497 + k * 2), BASE + h + 0.28, 0]);
    bars.push(b);
    barLabs.push(lab);
  }

  const binText = ['496–498 g: 25 BAGS', '498–500 g: 75 BAGS', '500–502 g: 75 BAGS', '502–504 g: 25 BAGS'];
  for (let k = 0; k < 4; k++) {
    await until(S(6 + k));
    await play(new M.FadeOut(binOutlines[k]), new M.FadeIn(bars[k]), new M.FadeIn(barLabs[k]), ...say(binText[k]));
  }

  // 10-13: histogram & middle two bars = 150/200 = 3/4
  await until(S(10));
  await play(...say('HISTOGRAM: BAGS PER BOX', C.muted), ...fbox(['total = 200 bags', '4 boxes × 2 g wide']));

  await until(S(11));
  bars[1].setFill(C.amber, 0.6); bars[1].setColor(C.amber);
  bars[2].setFill(C.amber, 0.6); bars[2].setColor(C.amber);
  await play(new M.Indicate(bars[1], { color: C.amber }), new M.Indicate(bars[2], { color: C.amber }), ...say('498 TO 502 g = TWO MIDDLE BARS', C.amber));

  await until(S(12));
  await play(...say('75 + 75 = 150 OUT OF 200', C.amber), ...fbox(['middle bars:', ['75 + 75 = 150 bags', C.amber], 'out of 200'], C.amber));

  await until(S(13));
  await play(...say('CHANCE = 3/4', C.green), ...fbox(['150 ÷ 200', ['= 3/4  (75%)', C.green]], C.green));

  // 14-15: weight is a measurement, any value on the line
  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(...bars, ...barLabs)), ...say('WEIGHT = A MEASUREMENT, NOT A COUNT', C.violet));

  const pt1 = new M.Dot({ point: [w2x(499.3), BASE + 0.16, 0], radius: 0.1, color: C.cyan });
  const pt2 = new M.Dot({ point: [w2x(499.31), BASE + 0.42, 0], radius: 0.1, color: C.amber });
  const lbl1 = T('499.3', 16, C.cyan, true); lbl1.moveTo([w2x(499.3) - 0.65, BASE + 0.38, 0]);
  const lbl2 = T('499.31', 16, C.amber, true); lbl2.moveTo([w2x(499.31) + 0.72, BASE + 0.68, 0]);
  const extraPts = [497.4, 498.6, 500.15, 500.82, 502.3].map(v => new M.Dot({ point: [w2x(v), BASE + 0.16, 0], radius: 0.08, color: C.cyan }));

  await until(S(15));
  await play(new M.FadeIn(new M.VGroup(pt1, pt2, lbl1, lbl2, ...extraPts)), ...say('ANY VALUE ON THE LINE IS POSSIBLE', C.cyan));

  // 16: narrower boxes, more bags (16 fine bars)
  const fineBars = [];
  const N = 16, step = 8 / N;
  for (let i = 0; i < N; i++) {
    const mid = 496 + (i + 0.5) * step;
    const h = (tentD(mid) / 0.25) * HMAX;
    const r = new M.Rectangle({ width: (AX_W / N) - 0.03, height: Math.max(0.05, h), color: C.cyan, strokeWidth: 1.2 });
    r.setFill(C.cyan, 0.35);
    r.moveTo([w2x(mid), BASE + h / 2, 0]);
    fineBars.push(r);
  }
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(pt1, pt2, lbl1, lbl2, ...extraPts)),
    new M.LaggedStart(fineBars.map(r => new M.FadeIn(r)), { lagRatio: 0.04, runTime: 1.2 }),
    ...say('NARROWER BOXES, MORE BAGS')
  );

  // 17: smooth tent curve from 496 to 500 to 504
  const tentLeft = new M.Line({ start: [w2x(496), d2y(0), 0], end: [w2x(500), d2y(0.25), 0], color: C.cyan, strokeWidth: 4 });
  const tentRight = new M.Line({ start: [w2x(500), d2y(0.25), 0], end: [w2x(504), d2y(0), 0], color: C.cyan, strokeWidth: 4 });
  await until(S(17));
  await play(
    new M.Create(tentLeft),
    new M.Create(tentRight),
    new M.FadeOut(new M.VGroup(...fineBars)),
    ...say('SMOOTH TENT, HIGHEST AT 500 g', C.cyan)
  );

  // 18: narrower boxes hold fewer bags -> shrink toward nothing
  const tinyBar = new M.Rectangle({ width: 0.14, height: 0.35, color: C.amber, strokeWidth: 1.5 });
  tinyBar.setFill(C.amber, 0.7);
  tinyBar.moveTo([w2x(500), BASE + 0.175, 0]);
  await until(S(18));
  await play(new M.FadeIn(tinyBar), ...say('NARROWER BOXES → FEWER BAGS PER BOX', C.amber));

  // 19-21: new rule: area = share of bags; total area = 1
  const fullFill = new M.Polygon({
    vertices: [[w2x(496), BASE, 0], [w2x(500), d2y(0.25), 0], [w2x(504), BASE, 0]],
    color: C.cyan, strokeWidth: 0
  });
  fullFill.setFill(C.cyan, 0.22);

  await until(S(19));
  await play(
    new M.FadeOut(tinyBar),
    ...say('NEW RULE: AREA = SHARE OF BAGS', C.green),
    ...fbox([['NEW RULE', C.green], 'area = share of bags', 'not height'], C.green)
  );

  await until(S(20));
  await play(new M.FadeIn(fullFill), ...say('AREA = FLAT SPACE INSIDE', C.cyan));

  const area1Tag = pill('TOTAL AREA = 1', C.amber, 17);
  area1Tag.moveTo([w2x(500), BASE + HMAX * 0.38, 0]);
  await until(S(21));
  await play(new M.FadeIn(area1Tag), ...say('TOTAL AREA UNDER TENT = 1', C.amber), ...fbox(['all bags = the whole', ['total area = 1', C.amber]], C.amber));

  // 22-27: shade 498 to 502, subtract two outer triangles (1/8 each) -> 3/4
  await until(S(22));
  await play(new M.FadeOut(area1Tag), ...say('CHANCE OF A RANGE = SHADED AREA', C.green));

  const midPoly = new M.Polygon({
    vertices: [
      [w2x(498), BASE, 0],
      [w2x(498), d2y(tentD(498)), 0],
      [w2x(500), d2y(0.25), 0],
      [w2x(502), d2y(tentD(502)), 0],
      [w2x(502), BASE, 0]
    ],
    color: C.green, strokeWidth: 2
  });
  midPoly.setFill(C.green, 0.42);
  const v498 = new M.DashedLine({ start: [w2x(498), BASE, 0], end: [w2x(498), d2y(tentD(498)), 0], color: C.green });
  const v502 = new M.DashedLine({ start: [w2x(502), BASE, 0], end: [w2x(502), d2y(tentD(502)), 0], color: C.green });

  await until(S(23));
  await play(new M.FadeIn(midPoly), new M.Create(v498), new M.Create(v502), ...say('SHADE FROM 498 TO 502 g', C.green));

  const leftTri = new M.Polygon({
    vertices: [[w2x(496), BASE, 0], [w2x(498), BASE, 0], [w2x(498), d2y(tentD(498)), 0]],
    color: C.violet, strokeWidth: 2
  });
  leftTri.setFill(C.violet, 0.45);
  const rightTri = new M.Polygon({
    vertices: [[w2x(502), BASE, 0], [w2x(504), BASE, 0], [w2x(502), d2y(tentD(502)), 0]],
    color: C.violet, strokeWidth: 2
  });
  rightTri.setFill(C.violet, 0.45);

  await until(S(24));
  await play(new M.FadeIn(leftTri), new M.FadeIn(rightTri), ...say('TWO SMALL OUTER TRIANGLES', C.violet));

  const lEighth = T('1/8', 18, C.violet, true); lEighth.moveTo([w2x(497.3), BASE + 0.42, 0]);
  const rEighth = T('1/8', 18, C.violet, true); rEighth.moveTo([w2x(502.7), BASE + 0.42, 0]);
  await until(S(25));
  await play(new M.FadeIn(lEighth), new M.FadeIn(rEighth), ...say('EACH CORNER = 1/8 OF AREA', C.violet), ...fbox(['each corner:', '25 ÷ 200 = 1/8'], C.violet));

  const midThreeQ = T('3/4', 24, C.green, true); midThreeQ.moveTo([w2x(500), BASE + HMAX * 0.42, 0]);
  await until(S(26));
  await play(new M.FadeIn(midThreeQ), ...say('1 − 1/8 − 1/8 = 3/4', C.green), ...fbox(['1 − 1/8 − 1/8', '= 6/8', ['= 3/4', C.green]], C.green));

  await until(S(27));
  await play(new M.Indicate(midThreeQ, { color: C.amber }), ...say('SAME 3/4 AS BEFORE!', C.green));

  // 28: density curve
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(leftTri, rightTri, lEighth, rEighth, midPoly, v498, v502, midThreeQ)),
    ...say('DENSITY CURVE (DENSITY)', C.cyan),
    ...fbox([['DENSITY CURVE', C.cyan], 'area = chance', 'total area = 1'])
  );

  // 29-32: what height means (chance per gram; beach crowd)
  const hArrow = new M.Line({ start: [w2x(500), BASE, 0], end: [w2x(500), d2y(0.25), 0], color: C.amber, strokeWidth: 3 });
  const peakDot = new M.Dot({ point: [w2x(500), d2y(0.25), 0], radius: 0.11, color: C.amber });
  await until(S(29));
  await play(new M.Create(hArrow), new M.FadeIn(peakDot), ...say('WHAT DOES HEIGHT MEAN?', C.amber));

  await until(S(30));
  await play(...say('HEIGHT = CHANCE PER GRAM', C.amber), ...fbox([['HEIGHT ≠ CHANCE', C.amber], 'height = chance per gram', '(how crowded)'], C.amber));

  const peakLbl = T('1/4 per gram', 18, C.amber, true); peakLbl.moveTo([w2x(500) + 1.25, d2y(0.25) - 0.1, 0]);
  await until(S(31));
  await play(new M.FadeIn(peakLbl), ...say('PEAK: 1/4 PER GRAM', C.amber));

  const crowdXs = [497.2, 498.4, 499.1, 499.5, 499.75, 499.95, 500.1, 500.3, 500.55, 500.9, 501.6, 502.8];
  const crowdDots = crowdXs.map(v => new M.Dot({ point: [w2x(v), BASE + 0.14, 0], radius: 0.08, color: C.violet }));
  await until(S(32));
  await play(new M.LaggedStart(crowdDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.0 }), ...say('CROWDED SPOT → COUNT BY AREA', C.violet));

  // 33-37: short version & what it is for
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(hArrow, peakDot, peakLbl, ...crowdDots)), ...say('THE SHORT VERSION', C.cyan));

  await until(S(34));
  await play(...say('CHANCE = AREA OVER THE RANGE', C.green), ...fbox([['chance(range)', C.ink], ['= area under density', C.green], ['  over that range', C.muted]], C.green));

  const midPoly2 = new M.Polygon({
    vertices: [
      [w2x(498), BASE, 0],
      [w2x(498), d2y(tentD(498)), 0],
      [w2x(500), d2y(0.25), 0],
      [w2x(502), d2y(tentD(502)), 0],
      [w2x(502), BASE, 0]
    ],
    color: C.green, strokeWidth: 2
  });
  midPoly2.setFill(C.green, 0.4);
  await until(S(35));
  await play(new M.FadeIn(midPoly2), ...say('SHADE THE RANGE → MEASURE AREA', C.amber));

  await until(S(36));
  await play(...say('ANY CONTINUOUS MEASUREMENT', C.cyan), ...fbox([['USED FOR', C.cyan], 'weights · times', 'lengths · temperatures']));

  await until(S(37));
  await play(new M.Indicate(midPoly2, { color: C.green }), ...say('HOW OFTEN INSIDE SAFE RANGE?', C.green));

  // 38-40: common trap — exact point 500.000 g has area 0
  const thinLine = new M.Line({ start: [w2x(500), BASE, 0], end: [w2x(500), d2y(0.25), 0], color: C.amber, strokeWidth: 2.5 });
  const exactLbl = T('500.000 g', 17, C.amber, true); exactLbl.moveTo([w2x(500) + 1.05, d2y(0.25) - 0.15, 0]);
  await until(S(38));
  await play(new M.FadeOut(midPoly2), new M.Create(thinLine), new M.FadeIn(exactLbl), ...say('TRAP: EXACTLY 500.000 g?', C.amber));

  await until(S(39));
  await play(...say('NO WIDTH → AREA = 0', C.amber), ...fbox([['EXACTLY 500.000 g', C.amber], 'width = 0', ['area = 0 → chance = 0', C.amber]], C.amber));

  const smallRange = new M.Polygon({
    vertices: [
      [w2x(499.5), BASE, 0],
      [w2x(499.5), d2y(tentD(499.5)), 0],
      [w2x(500), d2y(0.25), 0],
      [w2x(500.5), d2y(tentD(500.5)), 0],
      [w2x(500.5), BASE, 0]
    ],
    color: C.green, strokeWidth: 2
  });
  smallRange.setFill(C.green, 0.45);
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(thinLine, exactLbl)), new M.FadeIn(smallRange), ...say('ALWAYS ASK ABOUT A RANGE', C.green));

  // 41-42: teaser for next lesson (flat density) & one-sentence takeaway
  const flatRect = new M.Rectangle({ width: AX_W, height: HMAX * 0.5, color: C.violet, strokeWidth: 3 });
  flatRect.setFill(C.violet, 0.25);
  flatRect.moveTo([CX, BASE + HMAX * 0.25, 0]);
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(fullFill, tentLeft, tentRight, smallRange)), new M.FadeIn(flatRect), ...say('NEXT: A FLAT DENSITY', C.violet));

  const finalTentL = new M.Line({ start: [w2x(496), BASE, 0], end: [w2x(500), d2y(0.25), 0], color: C.cyan, strokeWidth: 4 });
  const finalTentR = new M.Line({ start: [w2x(500), d2y(0.25), 0], end: [w2x(504), BASE, 0], color: C.cyan, strokeWidth: 4 });
  const finalShade = new M.Polygon({
    vertices: [
      [w2x(498), BASE, 0],
      [w2x(498), d2y(tentD(498)), 0],
      [w2x(500), d2y(0.25), 0],
      [w2x(502), d2y(tentD(502)), 0],
      [w2x(502), BASE, 0]
    ],
    color: C.green, strokeWidth: 2
  });
  finalShade.setFill(C.green, 0.42);
  await until(S(42));
  await play(
    new M.FadeOut(flatRect),
    new M.FadeIn(finalShade),
    new M.Create(finalTentL),
    new M.Create(finalTentR),
    ...say('CHANCE = AREA OVER A RANGE', C.green),
    ...fbox([['MEASUREMENT', C.cyan], ['chance = area under', C.green], ['density over a range', C.green]], C.green)
  );
}
