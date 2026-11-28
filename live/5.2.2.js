// lesson 5.2.2
// 5.2.2 Continuous uniform law. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  // Layout constants (phone 8x14.22, y in [-5.5, 4.3]; laptop 14.22x8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.2;
  const AX_W = P ? 6.6 : 7.4;
  const X0 = CX - AX_W / 2;
  const BASE = P ? -4.2 : -2.0;
  const RECT_H = P ? 4.2 : 2.2;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.4, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Map mm v in [0, 20] to x
  const m2x = v => X0 + (v / 20) * AX_W;

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

  // 0-4: plastic film strip, printed mark, blade, 0-20 mm span
  const stripY = P ? -3.0 : -0.6;
  const FH2 = P ? 1.1 : 0.7;
  const film = new M.Rectangle({ width: AX_W, height: 2 * FH2, color: C.muted, strokeWidth: 2 });
  film.setFill(C.card, 0.85); film.moveTo([CX, stripY, 0]);
  const blade = new M.Polygon({
    vertices: [[m2x(15) - 0.14, stripY + FH2 + 0.85, 0], [m2x(15) + 0.14, stripY + FH2 + 0.85, 0], [m2x(15), stripY + FH2 + 0.05, 0]],
    color: C.amber, strokeWidth: 2
  });
  blade.setFill(C.amber, 0.85);

  await until(S(0));
  await play(new M.FadeIn(film), new M.FadeIn(blade), ...say('BLADE CUTS THE BAG FILM'));

  const mark = new M.Line({ start: [m2x(0), stripY - FH2, 0], end: [m2x(0), stripY + FH2, 0], color: C.cyan, strokeWidth: 4 });
  const markLbl = T('mark (0)', 17, C.cyan, true); markLbl.moveTo([m2x(0) + 0.5, stripY + FH2 + 0.3, 0]);
  await until(S(1));
  await play(new M.Create(mark), new M.FadeIn(markLbl), ...say('PRINTED MARK ON EACH BAG'));

  const spanLine = new M.Line({ start: [m2x(0), stripY - FH2 - 0.3, 0], end: [m2x(20), stripY - FH2 - 0.3, 0], color: C.cyan, strokeWidth: 2.5 });
  const spanLbl = T('0 to 20 mm', 18, C.cyan, true); spanLbl.moveTo([CX, stripY - FH2 - 0.65, 0]);
  await until(S(2));
  await play(new M.Create(spanLine), new M.FadeIn(spanLbl), ...say('CUT LANDS 0 TO 20 mm AFTER MARK'));

  await until(S(3));
  await play(...say('1 mm ≈ THICKNESS OF A COIN', C.muted));

  await until(S(4));
  await play(...say('CHANCE BETWEEN 5 AND 15 mm?', C.amber), ...fbox([['QUESTION', C.amber], '5 mm  to  15 mm', 'what is the chance?'], C.amber));

  // 5-8: 0-20 mm axis and evenly spread glowing dots
  const axis = new M.Line({ start: [m2x(0), BASE, 0], end: [m2x(20), BASE, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = [0, 5, 10, 15, 20];
  const ticks = tickVals.map(v => new M.VGroup(
    new M.Line({ start: [m2x(v), BASE - 0.08, 0], end: [m2x(v), BASE + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 18, C.muted, true).moveTo([m2x(v), BASE - 0.36, 0])
  ));
  const unit = T('mm', 16, C.muted); unit.moveTo([m2x(20) + 0.05, BASE - 0.7, 0]);

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(film, blade, mark, markLbl, spanLine, spanLbl)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, unit)),
    ...say('LINE FROM 0 TO 20 mm')
  );

  const sampleCuts = [0.6, 1.4, 2.3, 3.1, 4.0, 4.9, 5.7, 6.6, 7.5, 8.3, 9.1, 10.0, 10.9, 11.7, 12.6, 13.4, 14.2, 15.1, 16.0, 16.8, 17.7, 18.5, 19.3];
  const cutDots = sampleCuts.map((v, i) => {
    const y = BASE + 0.22 + (i % 3) * 0.24;
    return new M.Dot({ point: [m2x(v), y, 0], radius: 0.09, color: C.cyan });
  });
  await until(S(6));
  await play(new M.LaggedStart(cutDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.5 }), ...say('DROP ONE DOT FOR EACH CUT'));

  await until(S(7));
  await play(...say('DOTS SPREAD EVENLY', C.cyan));

  await until(S(8));
  await play(...say('EVERY POSITION EQUALLY LIKELY', C.green));

  // 9-14: flat rectangle density, area = 1, height = 1/20
  await until(S(9));
  await play(...say('CHANCE = AREA UNDER DENSITY', C.cyan), ...fbox(['measurement:', 'chance = area', 'under density curve']));

  const topLine = new M.Line({ start: [m2x(0), BASE + RECT_H, 0], end: [m2x(20), BASE + RECT_H, 0], color: C.cyan, strokeWidth: 4 });
  await until(S(10));
  await play(new M.Create(topLine), ...say('SAME HEIGHT EVERYWHERE', C.cyan));

  const rect = new M.Rectangle({ width: AX_W, height: RECT_H, color: C.cyan, strokeWidth: 3 });
  rect.setFill(C.cyan, 0.18);
  rect.moveTo([CX, BASE + RECT_H / 2, 0]);
  await until(S(11));
  await play(new M.FadeOut(new M.VGroup(...cutDots, topLine)), new M.FadeIn(rect), ...say('FLAT RECTANGLE ON 0 TO 20', C.cyan));

  const area1 = pill('TOTAL AREA = 1', C.amber, 17); area1.moveTo([CX, BASE + RECT_H / 2, 0]);
  await until(S(12));
  await play(new M.FadeIn(area1), ...say('TOTAL AREA MUST BE 1', C.amber));

  await until(S(13));
  await play(...say('AREA = WIDTH × HEIGHT', C.amber), ...fbox(['rectangle area:', ['width × height = 1', C.amber]], C.amber));

  const hLbl = T('1/20', 19, C.amber, true); hLbl.moveTo(P ? [m2x(2.5), BASE + RECT_H - 0.35, 0] : [m2x(0) - 0.55, BASE + RECT_H, 0]);
  const wLbl = T('width = 20', 17, C.cyan, true); wLbl.moveTo([CX, BASE - 0.72, 0]);
  await until(S(14));
  await play(new M.FadeIn(hLbl), new M.FadeIn(wLbl), ...say('HEIGHT = 1/20 PER mm', C.amber), ...fbox(['width  = 20', ['height = 1/20', C.amber], '20 × 1/20 = 1'], C.amber));

  // 15-16: continuous uniform law
  await until(S(15));
  await play(new M.FadeOut(area1), ...say('CONTINUOUS UNIFORM LAW', C.violet), ...fbox([['UNIFORM LAW', C.violet], 'same height everywhere', 'area = 1'], C.violet));

  await until(S(16));
  await play(...say('LAW = RULE FOR EVERY RANGE', C.violet));

  // 17-22: shade 5 to 15 -> width 10, height 1/20 -> area = 1/2
  await until(S(17));
  await play(...say('QUESTION 1: 5 TO 15 mm', C.green));

  const shade1 = new M.Rectangle({ width: m2x(15) - m2x(5), height: RECT_H, color: C.green, strokeWidth: 2.5 });
  shade1.setFill(C.green, 0.42);
  shade1.moveTo([m2x(10), BASE + RECT_H / 2, 0]);
  await until(S(18));
  await play(new M.FadeIn(shade1), ...say('SHADE FROM 5 TO 15 mm', C.green));

  const w10 = T('width = 10', 18, C.green, true); w10.moveTo([m2x(10), BASE + RECT_H + 0.3, 0]);
  await until(S(19));
  await play(new M.FadeIn(w10), ...say('SHADED WIDTH = 10 mm', C.green));

  await until(S(20));
  await play(new M.Indicate(hLbl, { color: C.amber }), ...say('HEIGHT = 1/20', C.amber));

  const halfLbl = T('1/2', 24, C.green, true); halfLbl.moveTo([m2x(10), BASE + RECT_H / 2, 0]);
  await until(S(21));
  await play(new M.FadeIn(halfLbl), ...say('10 × 1/20 = 1/2', C.green), ...fbox(['5 to 15 mm:', '10 × 1/20 = 10/20', ['= 1/2  (50%)', C.green]], C.green));

  await until(S(22));
  await play(new M.Indicate(shade1, { color: C.green }), ...say('HALF OF ALL CUTS', C.green));

  // 23-25: second question: > 15 mm spoils bag -> 5 × 1/20 = 1/4
  await until(S(23));
  await play(new M.FadeOut(new M.VGroup(shade1, w10, halfLbl)), ...say('QUESTION 2: MORE THAN 15 mm?', C.amber), ...fbox([['SPOILED BAG', C.amber], 'cut > 15 mm', '(15 to 20 mm)'], C.amber));

  const shade2 = new M.Rectangle({ width: m2x(20) - m2x(15), height: RECT_H, color: C.amber, strokeWidth: 2.5 });
  shade2.setFill(C.amber, 0.45);
  shade2.moveTo([m2x(17.5), BASE + RECT_H / 2, 0]);
  const w5 = T('5 mm', 18, C.amber, true); w5.moveTo([m2x(17.5), BASE + RECT_H + 0.3, 0]);
  await until(S(24));
  await play(new M.FadeIn(shade2), new M.FadeIn(w5), ...say('15 TO 20 mm: WIDTH = 5 mm', C.amber));

  const qtrLbl = T('1/4', 22, C.amber, true); qtrLbl.moveTo([m2x(17.5), BASE + RECT_H / 2, 0]);
  await until(S(25));
  await play(new M.FadeIn(qtrLbl), ...say('5 × 1/20 = 1/4  (1 IN 4 SPOILED)', C.amber), ...fbox(['15 to 20 mm:', '5 × 1/20', ['= 1/4  (25%)', C.amber]], C.amber));

  // 26-28: pattern — just compare widths
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(shade2, w5, qtrLbl)), ...say('PATTERN: JUST COMPARE WIDTHS', C.cyan));

  await until(S(27));
  await play(...say('SHADED WIDTH ÷ WHOLE WIDTH', C.green), ...fbox([['chance', C.ink], ['= shaded width', C.green], ['  ÷ whole width', C.muted]], C.green));

  await until(S(28));
  await play(...fbox(['10 ÷ 20 = 1/2', [' 5 ÷ 20 = 1/4', C.amber]], C.cyan), ...say('10/20 = 1/2   ·   5/20 = 1/4', C.cyan));

  // 29-34: short version with letters a, b, c, d + mean at 10
  await until(S(29));
  await play(...say('THE SHORT VERSION', C.cyan));

  await until(S(30));
  await play(...fbox([['P(range)', C.ink], ['= range width', C.green], ['  ÷ total width', C.muted]], C.green));

  const labA = T('a = 0', 17, C.cyan, true); labA.moveTo([m2x(0) + 0.2, BASE - 1.08, 0]);
  const labB = T('b = 20', 17, C.cyan, true); labB.moveTo([m2x(20) - 0.3, BASE - 1.08, 0]);
  await until(S(31));
  await play(new M.FadeOut(wLbl), new M.FadeIn(labA), new M.FadeIn(labB), ...say('WHOLE LINE: a TO b', C.cyan));

  const shade3 = new M.Rectangle({ width: m2x(15) - m2x(5), height: RECT_H, color: C.green, strokeWidth: 2.5 });
  shade3.setFill(C.green, 0.38);
  shade3.moveTo([m2x(10), BASE + RECT_H / 2, 0]);
  const labC = T('c = 5', 17, C.green, true); labC.moveTo([m2x(5), BASE + RECT_H + 0.3, 0]);
  const labD = T('d = 15', 17, C.green, true); labD.moveTo([m2x(15), BASE + RECT_H + 0.3, 0]);
  await until(S(32));
  await play(new M.FadeIn(shade3), new M.FadeIn(labC), new M.FadeIn(labD), ...say('RANGE: c TO d', C.green));

  await until(S(33));
  await play(...say('P(c to d) = (d − c) ÷ (b − a)', C.green), ...fbox([['P(c to d)', C.ink], ['= (d − c) ÷ (b − a)', C.green], ['= 10 ÷ 20 = 1/2', C.amber]], C.green));

  const meanLine = new M.DashedLine({ start: [m2x(10), BASE, 0], end: [m2x(10), BASE + RECT_H, 0], color: C.amber });
  const fulcrum = new M.Polygon({
    vertices: [[m2x(10), BASE - 0.58, 0], [m2x(10) - 0.2, BASE - 0.86, 0], [m2x(10) + 0.2, BASE - 0.86, 0]],
    color: C.amber, strokeWidth: 2
  });
  fulcrum.setFill(C.amber, 0.9);
  const meanLbl = T('mean = 10', 18, C.amber, true); meanLbl.moveTo([m2x(10), BASE - 1.12, 0]);
  await until(S(34));
  await play(new M.Create(meanLine), new M.FadeIn(fulcrum), new M.FadeIn(meanLbl), ...say('MEAN = 10 mm (BALANCE POINT)', C.amber));

  // 35-36: what it is for
  await until(S(35));
  await play(...say('NO SPOT FAVOURED BETWEEN a AND b', C.cyan), ...fbox([['USE UNIFORM WHEN', C.cyan], 'only min & max known', 'every spot equally likely']));

  await until(S(36));
  await play(...say('RANDOM ARRIVAL · CUT ON A STRIP', C.muted));

  // 37-40: common trap — small sample clusters; blade drift
  const tenCluster = [1.8, 2.5, 3.1, 8.4, 9.0, 9.7, 10.2, 16.5, 17.1, 18.8];
  const smallDots = tenCluster.map((v, i) => new M.Dot({ point: [m2x(v), BASE + 0.25 + (i % 2) * 0.25, 0], radius: 0.11, color: C.amber }));
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(shade3, labA, labB, labC, labD, meanLine, fulcrum, meanLbl)),
    new M.LaggedStart(smallDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('TRAP: SMALL SAMPLES CLUSTER', C.amber)
  );

  await until(S(38));
  await play(new M.LaggedStart(smallDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.06, runTime: 1.2 }), ...say('10 CUTS CLUSTER JUST BY CHANCE', C.amber));

  const longRunDots = [];
  for (let i = 0; i < 32; i++) {
    const v = 0.4 + (i / 31) * 19.2;
    longRunDots.push(new M.Dot({ point: [m2x(v), BASE + 0.8 + (i % 3) * 0.28, 0], radius: 0.07, color: C.cyan }));
  }
  await until(S(39));
  await play(new M.LaggedStart(longRunDots.map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.2 }), ...say('UNIFORM = LONG-RUN PATTERN', C.cyan));

  const driftPoly = new M.Polygon({
    vertices: [[m2x(0), BASE, 0], [m2x(20), BASE, 0], [m2x(20), BASE + RECT_H * 1.25, 0], [m2x(0), BASE + RECT_H * 0.25, 0]],
    color: C.amber, strokeWidth: 3
  });
  driftPoly.setFill(C.amber, 0.25);
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(...smallDots, ...longRunDots)), new M.FadeIn(driftPoly), ...say('IF BLADE DRIFTS → FLAT IS WRONG', C.amber));

  // 41-42: next lesson (bell) & one-sentence summary
  const bellPts = [];
  for (let i = 0; i <= 40; i++) {
    const t = -3 + (i / 40) * 6;
    const x = CX + (t / 3) * (AX_W * 0.48);
    const y = BASE + Math.exp(-0.5 * t * t) * RECT_H * 1.15;
    bellPts.push([x, y, 0]);
  }
  const bellSegs = [];
  for (let i = 0; i < bellPts.length - 1; i++) {
    bellSegs.push(new M.Line({ start: bellPts[i], end: bellPts[i + 1], color: C.violet, strokeWidth: 3.5 }));
  }
  const bellCurve = new M.VGroup(...bellSegs);
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(driftPoly, rect, hLbl)), new M.FadeIn(bellCurve), ...say('NEXT: THE BELL CURVE', C.violet));

  const finalRect = new M.Rectangle({ width: AX_W, height: RECT_H, color: C.cyan, strokeWidth: 3 });
  finalRect.setFill(C.cyan, 0.18); finalRect.moveTo([CX, BASE + RECT_H / 2, 0]);
  const finalShade = new M.Rectangle({ width: m2x(15) - m2x(5), height: RECT_H, color: C.green, strokeWidth: 2.5 });
  finalShade.setFill(C.green, 0.42); finalShade.moveTo([m2x(10), BASE + RECT_H / 2, 0]);
  await until(S(42));
  await play(
    new M.FadeOut(bellCurve),
    new M.FadeIn(finalRect),
    new M.FadeIn(finalShade),
    ...say('CHANCE = SHADED WIDTH ÷ WHOLE WIDTH', C.green),
    ...fbox([['UNIFORM LAW', C.cyan], ['chance = shaded width', C.green], ['       ÷ whole width', C.green]], C.green)
  );
}
