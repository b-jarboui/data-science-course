// lesson 5.2.3
// 5.2.3 Normal law. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const PINK = C.pink || C.violet;
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

  // Map weight v in [490, 510] to x, and density d in [0, 0.22] to y
  const w2x = v => X0 + ((v - 490) / 20) * AX_W;
  const d2y = d => BASE + (d / 0.22) * HMAX;
  const normPDF = (v, mu, sd) => (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((v - mu) / sd, 2));

  // Helper: smooth normal curve VGroup
  function makeCurve(mu, sd, color, sw = 3.5, vMin = 490, vMax = 510, steps = 60) {
    const segs = [];
    for (let i = 0; i < steps; i++) {
      const a = vMin + (i / steps) * (vMax - vMin);
      const b = vMin + ((i + 1) / steps) * (vMax - vMin);
      segs.push(new M.Line({ start: [w2x(a), d2y(normPDF(a, mu, sd)), 0], end: [w2x(b), d2y(normPDF(b, mu, sd)), 0], color, strokeWidth: sw }));
    }
    return new M.VGroup(...segs);
  }

  // Helper: shaded area under normal curve from v1 to v2
  function makeShade(mu, sd, v1, v2, color, opacity = 0.35, steps = 36) {
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

  // 0-1: three filling machines (A cyan, B pink, C gold)
  const mCols = [C.cyan, PINK, GOLD];
  const mNames = ['Machine A', 'Machine B', 'Machine C'];
  const MS = P ? 1.4 : 1;
  const mXs = [-2.1, 0, 2.1].map(dx => CX + dx * (P ? 1.25 : 1.05));
  const mY = P ? -2.8 : -0.6;
  const machines = mCols.map((col, k) => {
    const x = mXs[k];
    const body = new M.RoundedRectangle({ width: 1.5 * MS, height: 1.5 * MS, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    body.setFill(C.card, 0.9); body.moveTo([x, mY, 0]);
    const top = new M.Polygon({
      vertices: [[x - 0.55 * MS, mY + 1.25 * MS, 0], [x + 0.55 * MS, mY + 1.25 * MS, 0], [x + 0.22 * MS, mY + 0.75 * MS, 0], [x - 0.22 * MS, mY + 0.75 * MS, 0]],
      color: col, strokeWidth: 2
    });
    top.setFill(col, 0.25);
    const lbl = T(mNames[k], P ? 19 : 17, col, true); lbl.moveTo([x, mY, 0]);
    return new M.VGroup(body, top, lbl);
  });

  await until(S(0));
  await play(new M.LaggedStart(machines.map(m => new M.FadeIn(m)), { lagRatio: 0.2, runTime: 1.3 }), ...say('THREE FILLING MACHINES'));

  await until(S(1));
  await play(...say('HOW IS EACH MACHINE DIFFERENT?', C.amber), ...fbox([['QUESTION', C.amber], 'how do A, B, C differ?', 'one picture for each'], C.amber));

  // 2-5: Machine A histogram -> smooth symmetric bell
  const axis = new M.Line({ start: [w2x(490), BASE, 0], end: [w2x(510), BASE, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = [492, 496, 500, 504, 508];
  const ticks = tickVals.map(v => new M.VGroup(
    new M.Line({ start: [w2x(v), BASE - 0.08, 0], end: [w2x(v), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, C.muted, true).moveTo([w2x(v), BASE - 0.36, 0])
  ));
  const unit = T('grams', 16, C.muted); unit.moveTo([w2x(510) - 0.15, BASE - 0.72, 0]);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...machines)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...say('MACHINE A: WEIGH THOUSANDS OF BAGS')
  );

  const histBars = [];
  for (let v = 493; v < 507; v++) {
    const mid = v + 0.5;
    const h = d2y(normPDF(mid, 500, 2)) - BASE;
    const bw = (w2x(v + 1) - w2x(v)) - 0.03;
    const r = new M.Rectangle({ width: bw, height: Math.max(0.04, h), color: C.cyan, strokeWidth: 1.5 });
    r.setFill(C.cyan, 0.4);
    r.moveTo([w2x(mid), BASE + h / 2, 0]);
    histBars.push(r);
  }
  await until(S(3));
  await play(new M.LaggedStart(histBars.map(r => new M.FadeIn(r)), { lagRatio: 0.04, runTime: 1.2 }), ...say('ONE HUMP, THIN TAILS'));

  await until(S(4));
  await play(
    new M.Indicate(histBars[6], { color: C.amber }),
    new M.Indicate(histBars[7], { color: C.amber }),
    ...say('MOST BAGS NEAR 500 g', C.cyan)
  );

  const curveA = makeCurve(500, 2, C.cyan, 4);
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(...histBars)), new M.FadeIn(curveA), ...say('SMOOTH, SYMMETRIC BELL', C.cyan));

  // 6-8: symmetric, normal law
  const symLine = new M.DashedLine({ start: [w2x(500), BASE, 0], end: [w2x(500), d2y(normPDF(500, 500, 2)) + 0.2, 0], color: C.amber });
  await until(S(6));
  await play(new M.Create(symLine), ...say('SYMMETRIC = MIRROR HALVES', C.amber));

  await until(S(7));
  await play(...say('THE NORMAL LAW (NORMAL CURVE)', C.cyan), ...fbox([['NORMAL CURVE', C.cyan], 'smooth symmetric bell', 'area = 1']));

  await until(S(8));
  await play(...say('“NORMAL” IS JUST ITS NAME', C.muted));

  // 9-13: two numbers: mean (500) and standard deviation (2)
  await until(S(9));
  await play(...say('TWO NUMBERS SET THE BELL', C.cyan), ...fbox([['TWO NUMBERS', C.cyan], '1. mean (centre)', '2. standard deviation']));

  const meanTag = pill('MEAN = 500 g', C.amber, 16); meanTag.moveTo([w2x(500), d2y(normPDF(500, 500, 2)) + 0.45, 0]);
  await until(S(10));
  await play(new M.FadeIn(meanTag), ...say('MEAN = CENTRE (500 g)', C.amber), ...fbox([['MACHINE A', C.cyan], ['mean = 500 g', C.amber], 'sd   = ?']));

  const sdLine = new M.Line({ start: [w2x(500), BASE + HMAX * 0.56, 0], end: [w2x(502), BASE + HMAX * 0.56, 0], color: C.green, strokeWidth: 3.5 });
  const sdLbl = T('sd = 2 g', 17, C.green, true); sdLbl.moveTo([w2x(502.6) + sdLbl.getWidth() / 2, BASE + HMAX * 0.56, 0]);
  await until(S(11));
  await play(new M.Create(sdLine), new M.FadeIn(sdLbl), ...say('STANDARD DEVIATION = 2 g', C.green), ...fbox([['MACHINE A', C.cyan], 'mean = 500 g', ['sd   = 2 g', C.green]]));

  await until(S(12));
  await play(new M.Indicate(sdLine, { color: C.green }), ...say('SD = TYPICAL SPREAD', C.green));

  await until(S(13));
  await play(new M.FadeOut(new M.VGroup(sdLine, sdLbl, meanTag)), ...say('STEPS AWAY FROM THE CENTRE', C.cyan));

  // 14-20: 68-95-99.7 rule
  const sh1 = makeShade(500, 2, 498, 502, C.green, 0.42);
  const t68 = T('68%', 22, C.green, true); t68.moveTo([w2x(500), BASE + HMAX * 0.42, 0]);
  await until(S(14));
  await play(new M.FadeIn(sh1), ...say('±1 SD: 498 TO 502 g', C.green));

  await until(S(15));
  await play(new M.FadeIn(t68), ...say('ABOUT 68%  (~2 IN 3 BAGS)', C.green), ...fbox([['±1 SD (498–502)', C.green], ['≈ 68%', C.green]], C.green));

  const sh2 = makeShade(500, 2, 496, 504, C.cyan, 0.3);
  const t95 = T('95%', 22, C.cyan, true); t95.moveTo([w2x(500), BASE + HMAX * 0.42, 0]);
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(sh1, t68)), new M.FadeIn(sh2), ...say('±2 SD: 496 TO 504 g', C.cyan));

  await until(S(17));
  await play(new M.FadeIn(t95), ...say('ABOUT 95% OF BAGS', C.cyan), ...fbox(['±1 SD:  68%', ['±2 SD:  95%', C.cyan]], C.cyan));

  const sh3 = makeShade(500, 2, 494, 506, C.amber, 0.25);
  const t997 = T('99.7%', 22, C.amber, true); t997.moveTo([w2x(500), BASE + HMAX * 0.42, 0]);
  await until(S(18));
  await play(new M.FadeOut(new M.VGroup(sh2, t95)), new M.FadeIn(sh3), ...say('±3 SD: 494 TO 506 g', C.amber));

  await until(S(19));
  await play(new M.FadeIn(t997), ...say('ABOUT 99.7%  (ALMOST ALL)', C.amber), ...fbox(['±1 SD:  68%', '±2 SD:  95%', ['±3 SD:  99.7%', C.amber]], C.amber));

  await until(S(20));
  await play(...say('THE 68–95–99.7 RULE', C.amber));

  // 21-23: Machine B (mean 504, sd 2) — location
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(sh3, t997, symLine)),
    ...say('MACHINE B: MEAN 504, SD 2', PINK),
    ...fbox([['MACHINE B', PINK], 'mean = 504 g', 'sd   = 2 g'], PINK)
  );

  const curveB = makeCurve(504, 2, PINK, 4);
  const shiftArr = new M.Line({ start: [w2x(500), d2y(normPDF(500, 500, 2)) + 0.25, 0], end: [w2x(504), d2y(normPDF(504, 504, 2)) + 0.25, 0], color: PINK, strokeWidth: 3 });
  const shiftLbl = T('+4 g', 18, PINK, true); shiftLbl.moveTo([w2x(502), d2y(normPDF(500, 500, 2)) + 0.52, 0]);
  await until(S(22));
  await play(new M.FadeIn(curveB), new M.Create(shiftArr), new M.FadeIn(shiftLbl), ...say('SAME BELL, SLID 4 g RIGHT', PINK));

  await until(S(23));
  await play(...say('MEAN = LOCATION', PINK), ...fbox([['LOCATION', PINK], 'changing the mean', 'slides the bell'], PINK));

  // 24-28: Machine C (mean 500, sd 4) — scale
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(curveB, shiftArr, shiftLbl)),
    ...say('MACHINE C: MEAN 500, SD 4', GOLD),
    ...fbox([['MACHINE C', GOLD], 'mean = 500 g', 'sd   = 4 g'], GOLD)
  );

  const curveC = makeCurve(500, 4, GOLD, 4);
  await until(S(25));
  await play(new M.FadeIn(curveC), ...say('TWICE AS WIDE, HALF AS TALL', GOLD));

  await until(S(26));
  await play(...say('AREA MUST STAY 1', GOLD), ...fbox([['SAME AREA = 1', GOLD], '2× wider → ½ as tall'], GOLD));

  const dotA = new M.Dot({ point: [w2x(500), d2y(normPDF(500, 500, 2)), 0], radius: 0.1, color: C.cyan });
  const lblA = T('A: ~0.2 / g', 17, C.cyan, true); lblA.moveTo([w2x(505.8), d2y(normPDF(500, 500, 2)), 0]);
  const dotC = new M.Dot({ point: [w2x(500), d2y(normPDF(500, 500, 4)), 0], radius: 0.1, color: GOLD });
  const lblC = T('C: ~0.1 / g', 17, GOLD, true); lblC.moveTo([w2x(505.8), d2y(normPDF(500, 500, 4)), 0]);
  const gA = new M.DashedLine({ start: [w2x(500) + 0.15, d2y(normPDF(500, 500, 2)), 0], end: [lblA.getCenter()[0] - lblA.getWidth() / 2 - 0.1, d2y(normPDF(500, 500, 2)), 0], color: C.cyan, strokeWidth: 1.5 });
  const gC = new M.DashedLine({ start: [w2x(500) + 0.15, d2y(normPDF(500, 500, 4)), 0], end: [lblC.getCenter()[0] - lblC.getWidth() / 2 - 0.1, d2y(normPDF(500, 500, 4)), 0], color: GOLD, strokeWidth: 1.5 });
  await until(S(27));
  await play(new M.FadeIn(new M.VGroup(dotA, lblA, dotC, lblC, gA, gC)), ...say('PEAKS: 0.2 vs 0.1 PER GRAM', GOLD));

  await until(S(28));
  await play(...say('STANDARD DEVIATION = SCALE', GOLD), ...fbox([['SCALE', GOLD], 'changing sd stretches', 'or squeezes the bell'], GOLD));

  // 29-32: short version in one line
  await until(S(29));
  await play(new M.FadeOut(new M.VGroup(curveC, dotA, lblA, dotC, lblC, gA, gC)), ...say('THE SHORT VERSION', C.cyan));

  await until(S(30));
  await play(...say('X = WEIGHT OF ONE BAG', C.cyan), ...fbox([['X = bag weight', C.cyan], '(before we weigh it)']));

  await until(S(31));
  await play(...say('X ~ NORMAL(500, 2)', C.green), ...fbox([['X ~ Normal(500, 2)', C.green], 'mean = 500 g', 'sd   = 2 g'], C.green));

  await until(S(32));
  await play(...say('MEAN = WHERE  ·  SD = HOW WIDE', C.amber));

  // 33-35: what it is for
  await until(S(33));
  await play(...say('MANY SMALL CAUSES → BELL SHAPE', C.cyan), ...fbox([['WHY BELLS APPEAR', C.cyan], 'many small, separate', 'pushes up and down']));

  await until(S(34));
  await play(...say('WEIGHTS · HEIGHTS · ERRORS', C.muted));

  await until(S(35));
  await play(...say('2 NUMBERS → CHANCE OF ANY RANGE', C.green));

  // 36-37: common trap — skewed lifetimes
  await until(S(36));
  await play(...say('TRAP: NOT EVERY HUMP IS A BELL', C.amber));

  const skewSegs = [];
  for (let i = 0; i < 60; i++) {
    const t1 = (i / 60) * 10, t2 = ((i + 1) / 60) * 10;
    const f = t => t * t * Math.exp(-t * 0.85) * 0.42;
    const x1 = w2x(491 + t1 * 1.8), x2 = w2x(491 + t2 * 1.8);
    skewSegs.push(new M.Line({ start: [x1, d2y(f(t1)), 0], end: [x2, d2y(f(t2)), 0], color: GOLD, strokeWidth: 3.5 }));
  }
  const skewCurve = new M.VGroup(...skewSegs);
  await until(S(37));
  await play(new M.FadeOut(curveA), new M.FadeIn(skewCurve), ...say('LONG ONE-SIDED TAIL ≠ BELL', GOLD), ...fbox([['COMMON TRAP', GOLD], 'skewed lifetimes', 'do NOT fit a bell'], GOLD));

  // 38-39: next lesson (standard normal) & one-sentence summary
  const finalCurve = makeCurve(500, 2, C.cyan, 4);
  const finalLine = new M.DashedLine({ start: [w2x(500), BASE, 0], end: [w2x(500), d2y(normPDF(500, 500, 2)) + 0.15, 0], color: C.amber });
  await until(S(38));
  await play(new M.FadeOut(skewCurve), new M.FadeIn(finalCurve), ...say('NEXT: ONE STANDARD BELL', C.violet));

  await until(S(39));
  await play(
    new M.Create(finalLine),
    ...say('PLACED BY MEAN · STRETCHED BY SD', C.green),
    ...fbox([['NORMAL CURVE', C.cyan], ['mean = where', C.amber], ['sd   = how wide', C.green]], C.green)
  );
}
