// 10.2.5 Splines: keep the old curve, add a bend after a knot at age 20 (cards I, J, K, L).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // --- layout (phone 8 x 14.22, laptop 14.22 x 8) ----------------------------
  const PILL = P ? [0, 0.75, 0] : [0, 1.94, 0];
  const BOXP = P ? [0, 2.95, 0] : [4.45, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.9 : 4.3;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  const AX0 = P ? -2.7 : -5.7, AW = P ? 5.9 : 6.0;
  const Y0 = P ? -4.6 : -2.25, HT = P ? 4.3 : 3.35;
  const ax = age => AX0 + age / 30 * AW;
  const ry = r => Y0 + (r - 1250) / 250 * HT;
  const pt = (age, r) => [ax(age), ry(r), 0];
  const f = age => { const a = age / 10; return 1320 + 120 * a - 40 * a * a; };
  const bend = age => { const d = Math.max(0, age / 10 - 2); return 160 * d * d; };
  const spl = age => f(age) + bend(age);
  const money = r => '$' + (r / 1000).toFixed(3).replace('.', ',');

  // --- helpers ---------------------------------------------------------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function glowDot(p, color = C.cyan) {
    const halo = new M.Dot({ point: p, radius: 0.24, color }); halo.setFill(color, 0.2);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    return new M.VGroup(halo, d);
  }

  function curveOf(fn, a0, a1, color, sw = 4) {
    const pts = [];
    for (let i = 0; i <= 50; i++) { const age = a0 + (a1 - a0) * i / 50; pts.push(pt(age, fn(age))); }
    return chain(pts, color, sw);
  }
  // a curve is a chain of short coloured lines (no fill, true colour)
  function chain(pts, color, sw) {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: sw }));
    return new M.VGroup(...segs);
  }

  // --- 0-1 a new listing card -------------------------------------------------
  const cardY = P ? -2.3 : -0.4;
  const cardR = new M.RoundedRectangle({ width: 3.4, height: 1.5, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.5 });
  cardR.setFill(C.card, 0.94); cardR.moveTo([0, cardY, 0]);
  const cardM = new M.Circle({ radius: 0.1, color: C.cyan }); cardM.setFill(C.cyan, 0.9); cardM.moveTo([-1.3, cardY + 0.42, 0]);
  const cardT1 = T('Card L · Cedar', 18, C.cyan, true, true); cardT1.moveTo([0.15, cardY + 0.42, 0]);
  const cardT2 = T('60 m²  ·  NEW', 18, C.ink, true); cardT2.moveTo([0, cardY - 0.2, 0]);
  const card = new M.VGroup(cardR, cardM, cardT1, cardT2);
  await until(S(0));
  await play(new M.FadeIn(card, { shift: [0, 0.3, 0] }), ...say('ANOTHER CEDAR LISTING ARRIVES', C.cyan));

  await until(S(1));
  await play(new M.Indicate(card, { color: C.amber }), ...say('REACH IT AND KEEP THE OLD FIT?', C.amber));

  // --- 2-4 chart, three dots, the old curve ----------------------------------
  const xAxis = new M.Line({ start: [AX0, Y0, 0], end: [ax(30) + 0.25, Y0, 0], color: C.muted, strokeWidth: 3 });
  const xTicks = [0, 10, 20, 30].map(v => new M.VGroup(
    new M.Line({ start: [ax(v), Y0 - 0.07, 0], end: [ax(v), Y0 + 0.07, 0], color: C.muted }),
    T(String(v), 17, C.muted, true).moveTo([ax(v), Y0 - 0.32, 0])));
  const xTitle = T('building age (years)', 16, C.muted); xTitle.moveTo([ax(15), Y0 - 0.66, 0]);
  const yAxis = new M.Line({ start: [AX0, Y0, 0], end: [AX0, ry(1500) + 0.15, 0], color: C.muted, strokeWidth: 3 });
  const yTicks = [1300, 1400, 1500].map(v => new M.VGroup(
    new M.Line({ start: [AX0 - 0.07, ry(v), 0], end: [AX0 + 0.07, ry(v), 0], color: C.muted }),
    T(money(v), 15, C.muted, true).moveTo([AX0 - 0.55, ry(v), 0])));
  const yTitle = T('rent per month', 15, C.muted); yTitle.moveTo([AX0 + 0.9, ry(1500) + 0.35, 0]);
  await until(S(2));
  await play(new M.FadeOut(card), new M.Create(xAxis), new M.Create(yAxis),
    new M.FadeIn(new M.VGroup(...xTicks, xTitle, ...yTicks, yTitle)), ...say('AGE ALONG THE BOTTOM · RENT UP THE SIDE', C.cyan));

  const data = [[0, 1320], [10, 1400], [20, 1400]];
  const dots = data.map(([a, r]) => glowDot(pt(a, r)));
  const dlabs = data.map(([a, r]) => { const t = T(money(r), 15, C.cyan, true, true); t.moveTo(a === 0 ? [ax(a) + 0.30 + t.getWidth() / 2, ry(r) - 0.36, 0] : [ax(a), ry(r) + 0.38, 0]); return t; });
  await until(S(3));
  await play(new M.LaggedStart(dots.map((d, i) => new M.FadeIn(new M.VGroup(d, dlabs[i]))), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('CARDS I, J, K: AGES 0, 10, 20', C.cyan));

  const cv = curveOf(f, 0, 20, C.green, 4);
  await until(S(4));
  await play(new M.Create(cv, { runTime: 1.5 }), ...say('LAST LESSON’S CURVE HITS ALL 3', C.green));

  // --- 5-8 the new dot and the gap -------------------------------------------
  const v30 = new M.DashedLine({ start: [ax(30), Y0, 0], end: [ax(30), ry(1500), 0], color: C.muted });
  await until(S(5));
  await play(new M.Create(v30), new M.Indicate(xTicks[3], { color: C.cyan }), ...say('NEW LISTING: 30 YEARS OLD', C.cyan));

  const dotL = glowDot(pt(30, 1480));
  const labL = T('$1,480', 15, C.cyan, true, true); labL.moveTo([ax(30) - (P ? 0.55 : 0.1), ry(1480) + 0.38, 0]);
  await until(S(6));
  await play(new M.FadeIn(dotL), new M.FadeIn(labL), new M.Flash(dotL.submobjects[1], { color: C.cyan }), ...say('IT ASKS $1,480 (CARD L)', C.cyan));

  const ext = curveOf(f, 20, 30, C.muted, 3);
  const old30 = new M.Circle({ radius: 0.12, color: C.muted, strokeWidth: 2.5 }); old30.moveTo(pt(30, 1320));
  const old30L = T('$1,320', 15, C.muted, true, true); old30L.moveTo([ax(30) - 0.75, ry(1320), 0]);
  await until(S(7));
  await play(new M.Create(ext), new M.FadeIn(old30), new M.FadeIn(old30L), ...say('OLD CURVE AT 30: $1,320', C.muted));

  const gap = new M.Line({ start: [ax(30), ry(1320) + 0.13, 0], end: [ax(30), ry(1480) - 0.13, 0], color: C.pink, strokeWidth: 4 });
  const gapL = T('+$160', 16, C.pink, true, true);
  gapL.moveTo(P ? [ax(30) - 0.45, ry(1395), 0] : [ax(30) + 0.22 + gapL.getWidth() / 2, ry(1400), 0]);
  await until(S(8));
  await play(new M.Create(gap), new M.FadeIn(gapL), ...say('NEW DOT: $160 ABOVE THE OLD CURVE', C.pink));

  // --- 9-10 two roads that join -----------------------------------------------
  const rdA = [], rdB = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; rdA.push([BOXP[0] - 1.8 + 1.8 * u, BOXP[1] + 0.3 - 0.5 * u, 0]); }
  for (let i = 0; i <= 20; i++) { const u = i / 20; rdB.push([BOXP[0] + 1.8 * u, BOXP[1] - 0.2 - 0.5 * u + 1.6 * u * u, 0]); }
  const roadA = chain(rdA, C.cyan, 7);
  const roadB = chain(rdB, C.amber, 7);
  const joinDot = new M.Dot({ point: [BOXP[0], BOXP[1] - 0.2, 0], radius: 0.09, color: C.ink });
  const roadT = T('two roads, one direction', 15, C.ink); roadT.moveTo([BOXP[0], BOXP[1] - 1.0, 0]);
  await until(S(9));
  await play(new M.Create(roadA), new M.Create(roadB), new M.FadeIn(joinDot), new M.FadeIn(roadT), ...say('TWO ROADS JOIN, SAME DIRECTION', C.amber));

  await until(S(10));
  await play(new M.Flash(joinDot, { color: C.amber }), ...say('OUR 2 CURVE PIECES SHOULD JOIN LIKE THIS', C.amber));

  // --- 11-18 keep the old curve, add a bend -----------------------------------
  await until(S(11));
  await play(new M.FadeOut(new M.VGroup(roadA, roadB, joinDot, roadT)), new M.Indicate(cv, { color: C.green }), ...say('KEEP THE OLD CURVE THROUGH AGE 20', C.green));

  // the extra bend is drawn ON TOP of the old curve: violet bars = what the bend adds (0 at the knot, grows)
  const bendC = new M.VGroup(...[22.5, 25].map(a =>
    new M.Line({ start: pt(a, f(a)), end: pt(a, spl(a)), color: C.violet, strokeWidth: 5 })));
  const bendL = T('extra bend', 15, C.violet, true, true);
  bendL.moveTo([ax(23.5), ry(f(23.5)) - 0.42, 0]);
  await until(S(12));
  await play(new M.Create(bendC), new M.FadeIn(bendL), ...say('AFTER 20: ADD AN EXTRA BEND', C.violet));

  const b0 = new M.Dot({ point: pt(20, 1400), radius: 0.09, color: C.violet });
  await until(S(13));
  await play(new M.FadeIn(b0), new M.Flash(b0, { color: C.violet }), ...say('THE BEND STARTS AT 0, THEN GROWS', C.violet));

  const sp = curveOf(spl, 20, 30, C.amber, 4);
  const knotP = pt(20, 1400);
  await until(S(14));
  await play(new M.Create(sp, { runTime: 1.4 }), new M.Indicate(dots[2], { color: C.amber }), ...say('PIECES MEET AT $1,400', C.amber));

  const tan = new M.Line({ start: pt(13, 1428), end: pt(27, 1372), color: C.ink, strokeWidth: 2.5 });
  await until(S(15));
  await play(new M.Create(tan), ...say('AT THE JOIN: OLD CURVE SLOPES DOWN', C.ink));

  // the bend starts flat: a short violet level mark on the floor at age 20
  const flat = new M.Line({ start: [ax(18), Y0 + 0.12, 0], end: [ax(22), Y0 + 0.12, 0], color: C.violet, strokeWidth: 5 });
  await until(S(16));
  await play(new M.Create(flat), new M.Indicate(tan, { color: C.amber }), ...say('BEND STARTS FLAT → SAME DIRECTION', C.violet));

  await until(S(17));
  await play(new M.Indicate(tan, { color: C.amber }),
    ...fbox(['at the join (age 20):', ['both fall $40', C.amber], ['per decade', C.amber]], C.amber), ...say('BOTH: −$40 PER DECADE', C.amber));

  await until(S(18));
  await play(new M.FadeOut(new M.VGroup(tan, flat)), new M.Flash(dots[2].submobjects[1], { color: C.green }), ...say('NO SHARP CORNER', C.green));

  // --- 19-21 knot and spline ---------------------------------------------------
  const knot = new M.Rectangle({ width: 0.3, height: 0.3, color: C.pink, strokeWidth: 3 }); knot.moveTo(knotP);
  const knotL = T('KNOT', 15, C.pink, true, true); knotL.moveTo([ax(20) - 0.55, ry(1400) + 0.48, 0]);
  await until(S(19));
  await play(new M.FadeOut(dlabs[2]), new M.Create(knot), new M.FadeIn(knotL), ...say('WHERE PIECES MEET = A KNOT', C.pink));

  await until(S(20));
  await play(new M.Indicate(cv, { color: C.green }), new M.Indicate(sp, { color: C.amber }),
    ...fbox(['pieces joined at knots', ['= SPLINE', C.green]], C.green), ...say('PIECES + KNOTS = SPLINE', C.green));

  const k20 = new M.DashedLine({ start: [ax(20), Y0, 0], end: [ax(20), ry(1400) - 0.2, 0], color: C.pink });
  await until(S(21));
  await play(new M.Create(k20), new M.Indicate(xTicks[2], { color: C.pink }), ...say('OUR KNOT: AGE 20', C.pink));

  // --- 22-32 the prediction at age 30 -----------------------------------------
  await until(S(22));
  await play(new M.Indicate(dotL, { color: C.amber }), ...say('NEW PREDICTION AT AGE 30?', C.amber));

  await until(S(23));
  await play(...fbox(['30 − 20 = 10 years', ['= 1 decade past the knot', C.violet]], C.violet), ...say('1 DECADE BEYOND THE KNOT', C.violet));
  await until(S(24));
  await play(...fbox(['distance d = 1', ['square it: d × d', C.violet]], C.violet), ...say('SQUARING = NUMBER × ITSELF', C.violet));
  await until(S(25));
  await play(...fbox(['distance d = 1', ['1 × 1 = 1', C.violet]], C.violet), ...say('1 × 1 = 1', C.violet));
  await until(S(26));
  await play(new M.Indicate(gap, { color: C.pink }), new M.Indicate(gapL, { color: C.pink }),
    ...fbox(['needed at 30:', ['1,480 − 1,320 = 160', C.pink]], C.pink), ...say('THE OLD CURVE NEEDS $160 MORE', C.pink));
  await until(S(27));
  await play(...fbox(['bend = 160 × d²', ['    = 160 × 1', C.violet]], C.violet), ...say('MULTIPLY: 160 × SQUARED DISTANCE', C.violet));
  const b30 = new M.Line({ start: [ax(30), ry(1320) + 0.13, 0], end: [ax(30), ry(1480) - 0.13, 0], color: C.violet, strokeWidth: 5 });
  await until(S(28));
  await play(new M.FadeIn(b30), new M.Indicate(bendL, { color: C.violet }),
    ...fbox(['bend = 160 × 1', ['     = +160', C.violet]], C.violet), ...say('THE BEND ADDS $160 AT 30', C.violet));
  await until(S(29));
  await play(new M.Indicate(old30L, { color: C.ink }),
    ...fbox(['old prediction  1,320', ['+ bend           160', C.violet]], C.amber), ...say('OLD $1,320 + BEND $160', C.amber));
  await until(S(30));
  await play(new M.Flash(dotL.submobjects[1], { color: C.amber }), new M.Indicate(sp, { color: C.amber }),
    ...fbox(['old prediction  1,320', ['+ bend           160', C.violet], ['= 1,480 ✓', C.amber]], C.amber), ...say('SPLINE REACHES $1,480 ✓', C.amber));

  await until(S(31));
  await play(new M.Indicate(knot, { color: C.pink }), ...fbox(['at the knot (age 20):', ['d = 20 − 20 = 0', C.pink]], C.pink), ...say('AT THE KNOT: DISTANCE = 0', C.pink));
  await until(S(32));
  await play(new M.Indicate(b0, { color: C.violet }),
    ...fbox(['at the knot (age 20):', 'd = 0', ['0 × 0 = 0 → adds $0', C.green]], C.green), ...say('0² = 0: NOTHING ADDED AT THE JOIN', C.green));

  // --- 33-36 the rule ------------------------------------------------------------
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(bendC, bendL, b0, b30)), ...say('READ THE RULE', C.cyan));
  await until(S(34));
  await play(new M.Indicate(cv, { color: C.green }),
    ...fbox([['age ≤ 20:', C.green], ['  rent = old curve', C.green]], C.green), ...say('UP TO 20: THE OLD CURVE', C.green));
  await until(S(35));
  await play(new M.Indicate(sp, { color: C.amber }),
    ...fbox([['age ≤ 20:', C.green], ['  rent = old curve', C.green], ['age > 20:', C.amber], ['  d = decades past 20', C.violet], ['  square it: d²', C.violet]], C.amber),
    ...say('ABOVE 20: DECADES PAST 20, SQUARED', C.violet));
  await until(S(36));
  await play(...fbox([['age ≤ 20:', C.green], ['  rent = old curve', C.green], ['age > 20:', C.amber], ['  rent = old curve', C.amber], ['       + 160 × d²', C.violet]], C.amber),
    ...say('× $160, ADD TO THE OLD PREDICTION', C.violet));

  // --- 37-40 when to use, many knots, recap --------------------------------------
  await until(S(37));
  await play(new M.Indicate(cv, { color: C.green }), new M.Indicate(sp, { color: C.amber }), ...say('BENDS DIFFER BY AGE RANGE → SPLINE', C.green));
  await until(S(38));
  await play(new M.Indicate(knot, { color: C.pink }), ...say('EACH KNOT = ONE MORE CHANGE OF SHAPE', C.pink));

  const wig = curveOf(a => spl(a) + 28 * Math.sin(Math.PI * a / 5), 0, 30, C.pink, 2.5);
  await until(S(39));
  await play(new M.Create(wig, { runTime: 1.6 }), ...say('TOO MANY KNOTS CHASE SMALL ACCIDENTS', C.pink));

  await until(S(40));
  await play(new M.FadeOut(wig), new M.Indicate(cv, { color: C.green }), new M.Indicate(sp, { color: C.amber }),
    ...say('SPLINE: PIECES THAT BEND IN DIFFERENT PLACES', C.green));
}
