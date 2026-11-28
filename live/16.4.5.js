// 16.4.5 Kriging: weights from a straight-line variogram model, estimate at (160, 100).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SX = P ? 0.0136 : 0.018, MX = P ? 0 : -2.0, SY = P ? 1.6 : 0.9;
  const ex = e => MX + (e - 200) * SX;
  const GX0 = P ? -3.0 : -6.0, GY0 = P ? -3.3 : -2.7, GS = P ? 6.2 / 450 : 5.9 / 450, GV = P ? 0.24 : 0.2;
  const g = (d, v) => [GX0 + d * GS, GY0 + v * GV, 0];
  const B1 = P ? -0.7 : -0.85, B2 = P ? -2.3 : -2.1;   // bar rows under the strip
  const BOXP = P ? [0, -4.65, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c);

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
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const grp = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.0;
    if (wd > maxw) grp.scale(maxw / wd);
    const a = [new M.FadeIn(grp)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = grp; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  const NM = ['A', 'B', 'C', 'D'], EAST = [0, 100, 300, 400], TEMP = [18, 18, 22, 22];
  const tcol = t => t === 18 ? C.cyan : C.amber;

  // 0-5 street, sensors, readings
  const street = new M.RoundedRectangle({ width: 500 * SX, height: 0.3, cornerRadius: 0.15, color: C.muted, strokeWidth: 1.5 });
  street.setFill(C.line, 0.6); street.moveTo([ex(200), SY, 0]);
  const mapLab = T('temperature map', 14, C.muted); mapLab.moveTo([ex(-50) + 0.8, SY + 0.45, 0]);
  await until(S(0)); await play(new M.FadeIn(street), new M.FadeIn(mapLab), ...say('COMPLETE THE TEMPERATURE MAP'));
  const sens = NM.map((n, k) => {
    const p = [ex(EAST[k]), SY, 0];
    const halo = new M.Dot({ point: p, radius: 0.23, color: C.green }); halo.setFill(C.green, 0.18);
    const d = new M.Dot({ point: p, radius: 0.1, color: C.green });
    const lab = T(n, 17, C.ink, true, true); lab.moveTo([p[0], SY + 0.34, 0]);
    return new M.VGroup(halo, d, lab);
  });
  await until(S(1)); await play(new M.FadeOut(mapLab), new M.LaggedStart(sens.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR 4 SENSORS', C.green));
  const temps = [];
  for (let k = 0; k < 4; k++) {
    await until(S(2 + k));
    const t = T(`${TEMP[k]}°`, 15, tcol(TEMP[k]), true); t.moveTo([ex(EAST[k]), SY - 0.36, 0]); temps.push(t);
    await play(new M.FadeIn(t), new M.Flash(sens[k].submobjects[1], { color: tcol(TEMP[k]) }), ...say(`SENSOR ${NM[k]}: ${TEMP[k]} °C`, tcol(TEMP[k])));
  }

  // 6-8 the new spot
  let spotE = 160;
  const qc = new M.Circle({ radius: 0.2, color: C.pink, strokeWidth: 2.5 }); qc.moveTo([ex(160), SY, 0]);
  let qt = T('?', 18, C.pink, true, true); qt.moveTo([ex(160), SY + 0.36, 0]);
  await until(S(6)); await play(new M.Create(qc), new M.FadeIn(qt), ...say('NEW SPOT: (160, 100)', C.pink));
  await until(S(7)); await play(new M.Indicate(qc, { color: C.pink }), ...say('NO SENSOR HERE', C.pink));
  await until(S(8)); await play(...say('ESTIMATE IT FROM THE READINGS AROUND IT?', C.violet));

  // 9-12 distances
  const bracket = (x1, x2, y, col, txt) => {
    const l = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color: col, strokeWidth: 3 });
    const c1 = new M.Line({ start: [x1, y + 0.1, 0], end: [x1, y - 0.1, 0], color: col, strokeWidth: 3 });
    const c2 = new M.Line({ start: [x2, y + 0.1, 0], end: [x2, y - 0.1, 0], color: col, strokeWidth: 3 });
    const t = T(txt, P ? 17 : 13, col, true); t.moveTo([(x1 + x2) / 2, y - (P ? 0.24 : 0.19), 0]);
    return new M.VGroup(l, c1, c2, t);
  };
  const BR = SY - 0.72;
  await until(S(9)); await play(new M.Indicate(sens[1], { color: C.cyan }), new M.Indicate(sens[2], { color: C.amber }), ...say('NEAREST SENSORS: B AND C', C.green));
  const bB = bracket(ex(100), ex(160), BR, C.cyan, '60 m'), bC = bracket(ex(160), ex(300), BR, C.amber, '140 m'), bBC = bracket(ex(100), ex(300), BR - 0.45, C.violet, '200 m');
  await until(S(10)); await play(new M.Create(bB), ...say('B TO THE SPOT: 60 m', C.cyan));
  await until(S(11)); await play(new M.Create(bC), ...say('C TO THE SPOT: 140 m', C.amber));
  await until(S(12)); await play(new M.Create(bBC), ...say('B TO C: 200 m', C.violet));

  // 13-19 a bar of one whole share
  await until(S(13)); await play(...say('COMBINE BOTH READINGS', C.green));
  const xB = ex(100), xC = ex(300), W = xC - xB;
  const share = new M.Rectangle({ width: W, height: 0.4, color: C.violet, strokeWidth: 2 }); share.setFill(C.violet, 0.25); share.moveTo([(xB + xC) / 2, B2, 0]);
  const shareLab = T('1 whole share', 14, C.violet, true); shareLab.moveTo([(xB + xC) / 2, B2 - 0.4, 0]);
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(bB, bC, bBC)), new M.FadeIn(share), new M.FadeIn(shareLab), ...say('A BAR = ONE WHOLE SHARE', C.violet));
  const cut = new M.Line({ start: [(xB + xC) / 2, B2 - 0.25, 0], end: [(xB + xC) / 2, B2 + 0.25, 0], color: C.ink, strokeWidth: 3 });
  const pB = T('B', 15, C.cyan, true, true).moveTo([xB + W / 4, B2, 0]), pC = T('C', 15, C.amber, true, true).moveTo([xC - W / 4, B2, 0]);
  await until(S(15)); await play(new M.Create(cut), new M.FadeIn(pB), new M.FadeIn(pC), ...say('TWO PARTS: ONE FOR EACH SENSOR', C.violet));
  await until(S(16)); await play(new M.Indicate(pB, { color: C.cyan }), new M.Indicate(pC, { color: C.amber }), ...say("EACH PART = HOW MUCH OF A READING WE USE"));
  await until(S(17)); await play(...say('THIS SHARE = A WEIGHT', C.green));
  await until(S(18)); await play(...fbox(['weight B + weight C', ['= 1 whole share', C.green]], C.green));
  await until(S(19)); await play(new M.Indicate(cut, { color: C.amber }), ...say('HOW LARGE SHOULD EACH WEIGHT BE?', C.amber));
  const shareGrp = new M.VGroup(share, shareLab, cut, pB, pC);

  // 20-28 the variogram and its straight-line model
  const xAx = new M.Arrow({ start: g(0, 0), end: g(460, 0), color: C.muted, strokeWidth: 2.5 });
  const yAx = new M.Arrow({ start: g(0, 0), end: g(0, 10.2), color: C.muted, strokeWidth: 2.5 });
  const xt = [100, 200, 300, 400].map(d => T(String(d), P ? 16 : 13, C.muted, true).moveTo([g(d, 0)[0], GY0 - 0.25, 0]));
  const yt = [4, 8].map(v => T(String(v), P ? 16 : 13, C.muted, true).moveTo([GX0 - 0.25, g(0, v)[1], 0]));
  const xLab = T('m', P ? 16 : 13, C.muted, true); xLab.moveTo([g(460, 0)[0], GY0 - 0.25, 0]);
  const axes = new M.VGroup(xAx, yAx, ...xt, ...yt, xLab);
  const pts = [[100, 0], [200, 8], [300, 8], [400, 8]].map(([d, v]) => { const h = new M.Dot({ point: g(d, v), radius: 0.2, color: C.cyan }); h.setFill(C.cyan, 0.2);
    return new M.VGroup(h, new M.Dot({ point: g(d, v), radius: 0.09, color: C.cyan })); });
  await until(S(20)); await play(new M.FadeOut(shareGrp), ...dropBox(), new M.Create(axes), new M.LaggedStart(pts.map(p => new M.FadeIn(p)), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR VARIOGRAM', C.cyan));
  await until(S(21)); await play(...say('DIFFERENCE VS DISTANCE', C.cyan));
  const yLab = T('semivariance (°C²)', P ? 16 : 13, C.green); yLab.moveTo([GX0 + (P ? 1.55 : 1.25), g(0, 10.2)[1], 0]);
  await until(S(22)); await play(new M.FadeIn(yLab), new M.LaggedStart(pts.map(p => new M.Indicate(p, { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }), ...say('DOT HEIGHT = SEMIVARIANCE', C.green));
  await until(S(23)); await play(...fbox(['semivariance =', ['  ½ × mean squared difference', C.green], '  at one distance'], C.green));
  const model = new M.Line({ start: g(0, 0), end: g(450, 9), color: C.amber, strokeWidth: 3.5 });
  await until(S(24)); await play(new M.Create(model, { runTime: 1.6 }), ...say('A STRAIGHT LINE FROM ZERO', C.amber));
  await until(S(25)); await play(new M.Indicate(model, { color: C.amber }), ...say('MODEL = SIMPLE DESCRIPTION OF THE PATTERN', C.amber));
  const step1 = new M.DashedLine({ start: g(50, 0), end: g(50, 1), color: C.amber, strokeWidth: 2 });
  await until(S(26)); await play(new M.Create(step1), ...fbox(['model value =', ['  distance ÷ 50', C.amber], '+1 °C² every 50 m'], C.amber));
  await until(S(27)); await play(...say('MODEL → WEIGHTS → ESTIMATE = KRIGING', C.green));
  await until(S(28)); await play(new M.Indicate(sens[1], { color: C.green }), new M.Indicate(sens[2], { color: C.green }), ...say('ORDINARY KRIGING WITH B AND C', C.green));

  // 29-33 model values for 60, 140, 200 m
  await until(S(29)); await play(new M.FadeOut(step1), ...say('MODEL VALUE FOR EACH DISTANCE', C.amber));
  const mv = (d, v, col) => { const ln = new M.DashedLine({ start: g(d, 0), end: g(d, v), color: col, strokeWidth: 2 });
    const dt = new M.Dot({ point: g(d, v), radius: 0.1, color: col }); const t = T(String(v), 14, col, true, true); t.moveTo([g(d, v)[0] - 0.3, g(d, v)[1] + 0.2, 0]);
    return new M.VGroup(ln, dt, t); };
  const v1 = mv(60, 1.2, C.cyan), v2 = mv(140, 2.8, C.amber), v3 = mv(200, 4, C.violet);
  await until(S(30)); await play(new M.Create(v1), ...fbox([['B–spot: 60 ÷ 50 = 1.2', C.cyan]], C.cyan));
  await until(S(31)); await play(new M.Create(v2), ...fbox([['B–spot: 60 ÷ 50 = 1.2', C.cyan], ['C–spot: 140 ÷ 50 = 2.8', C.amber]], C.amber));
  await until(S(32)); await play(new M.Create(v3), ...fbox([['B–spot: 60 ÷ 50 = 1.2', C.cyan], ['C–spot: 140 ÷ 50 = 2.8', C.amber], ['B–C: 200 ÷ 50 = 4', C.violet]], C.violet));
  await until(S(33)); await play(new M.Indicate(yLab, { color: C.green }), ...say('ALL THREE IN °C² (SQUARED DEGREES)', C.green));

  // 34-42 the bar of length 4 and the weights
  const graph = new M.VGroup(axes, ...pts, yLab, model, v1, v2, v3);
  const xs = ex(160);
  const segB = new M.Rectangle({ width: xs - xB, height: 0.36, color: C.pink, strokeWidth: 2 }); segB.setFill(C.pink, 0.3); segB.moveTo([(xB + xs) / 2, B1, 0]);
  const segC = new M.Rectangle({ width: xC - xs, height: 0.36, color: C.green, strokeWidth: 2 }); segC.setFill(C.green, 0.3); segC.moveTo([(xs + xC) / 2, B1, 0]);
  const bar4 = new M.Rectangle({ width: W, height: 0.36, color: C.violet, strokeWidth: 2.5 }); bar4.moveTo([(xB + xC) / 2, B1, 0]);
  const lab4 = T('length 4', 14, C.violet, true); lab4.moveTo([(xB + xC) / 2, B1 + 0.38, 0]);
  await until(S(34)); await play(new M.FadeOut(graph), new M.Create(bar4), new M.FadeIn(lab4), ...say('A BAR OF LENGTH 4 FROM B TO C', C.violet));
  const drop = new M.DashedLine({ start: [xs, SY - 0.22, 0], end: [xs, B1 - 0.25, 0], color: C.pink, strokeWidth: 2 });
  let l12 = T('1.2', 15, C.pink, true, true); l12.moveTo([(xB + xs) / 2, B1 - 0.4, 0]);
  let l28 = T('2.8', 15, C.green, true, true); l28.moveTo([(xs + xC) / 2, B1 - 0.4, 0]);
  await until(S(35)); await play(new M.Create(drop), new M.FadeIn(segB), new M.FadeIn(segC), new M.FadeIn(l12), new M.FadeIn(l28), ...say('THE SPOT SPLITS IT: 1.2 AND 2.8', C.pink));
  await until(S(36)); await play(...fbox(['straight-line model', 'spot between B and C', ['→ lengths give the weights', C.green]], C.green));
  await until(S(37)); await play(new M.Indicate(segB, { color: C.pink }), ...say('SPOT IS CLOSER TO B → B GETS MORE', C.cyan));
  // weights bar
  const wB = new M.Rectangle({ width: W * 0.7, height: 0.4, color: C.cyan, strokeWidth: 2 }); wB.setFill(C.cyan, 0.45); wB.moveTo([xB + W * 0.35, B2, 0]);
  const wC = new M.Rectangle({ width: W * 0.3, height: 0.4, color: C.amber, strokeWidth: 2 }); wC.setFill(C.amber, 0.45); wC.moveTo([xC - W * 0.15, B2, 0]);
  let tB = T('B 0.7', 14, C.cyan, true, true); tB.moveTo([xB + W * 0.35, B2 - 0.4, 0]);
  let tC = T('C 0.3', 14, C.amber, true, true); tC.moveTo([xC - W * 0.15, B2 - 0.4, 0]);
  await until(S(38)); await play(new M.Indicate(l28, { color: C.green }), new M.Indicate(segC, { color: C.green }), ...fbox([['weight B = opposite length ÷ 4', C.cyan], '= 2.8 ÷ 4'], C.cyan), ...say('B: THE OPPOSITE LENGTH 2.8', C.cyan));
  await until(S(39)); await play(new M.FadeIn(wB), new M.FadeIn(tB), ...fbox([['weight B', C.cyan], '= 2.8 ÷ 4 = 0.7'], C.cyan));
  await until(S(40)); await play(new M.Indicate(l12, { color: C.pink }), new M.Indicate(segB, { color: C.pink }), ...fbox(['weight B = 2.8 ÷ 4 = 0.7', ['weight C = 1.2 ÷ 4', C.amber]], C.amber), ...say('C: THE OPPOSITE LENGTH 1.2', C.amber));
  await until(S(41)); await play(new M.FadeIn(wC), new M.FadeIn(tC), ...fbox(['weight B = 2.8 ÷ 4 = 0.7', ['weight C = 1.2 ÷ 4 = 0.3', C.amber]], C.amber));
  await until(S(42)); await play(new M.Indicate(new M.VGroup(wB, wC), { color: C.green }), ...fbox(['weight B = 0.7', 'weight C = 0.3', ['0.7 + 0.3 = 1', C.green]], C.green), ...say('THE WEIGHTS ADD UP TO 1', C.green));

  // 43-47 the estimate
  await until(S(43)); await play(new M.Indicate(temps[1], { color: C.cyan }), ...fbox([['B: 18 × 0.7', C.cyan]], C.cyan), ...say("B'S READING × B'S WEIGHT", C.cyan));
  await until(S(44)); await play(...fbox([['B: 18 × 0.7 = 12.6', C.cyan]], C.cyan), ...say('B GIVES 12.6 °C', C.cyan));
  await until(S(45)); await play(new M.Indicate(temps[2], { color: C.amber }), ...fbox([['B: 18 × 0.7 = 12.6', C.cyan], ['C: 22 × 0.3', C.amber]], C.amber), ...say("C'S READING × C'S WEIGHT", C.amber));
  await until(S(46)); await play(...fbox([['B: 18 × 0.7 = 12.6', C.cyan], ['C: 22 × 0.3 = 6.6', C.amber]], C.amber), ...say('C GIVES 6.6 °C', C.amber));
  const est = T('19.2°', 16, C.pink, true, true); est.moveTo([ex(160), SY + 0.38, 0]);
  await until(S(47)); await play(new M.FadeOut(qt), new M.FadeIn(est), new M.Flash(qc, { color: C.pink }),
    ...fbox([['B: 18 × 0.7 = 12.6', C.cyan], ['C: 22 × 0.3 = 6.6', C.amber], ['12.6 + 6.6 = 19.2 °C', C.pink]], C.pink), ...say('ESTIMATE AT THE SPOT: 19.2 °C', C.pink));
  qt = est;

  // 48-49 the formula
  await until(S(48)); await play(...say('THE CALCULATION IN ONE SHORT FORMULA', C.cyan));
  await until(S(49)); await play(...fbox(['estimate =', ['  B reading × B weight', C.cyan], ['+ C reading × C weight', C.amber]], C.cyan));

  // 50-51 the spot halfway
  const xm = ex(200);
  const tgt = (o, x) => { const c = o.copy(); c.moveTo([x, o.getCenter()[1], 0]); return c; };
  const nsegB = new M.Rectangle({ width: xm - xB, height: 0.36, color: C.pink, strokeWidth: 2 }); nsegB.setFill(C.pink, 0.3); nsegB.moveTo([(xB + xm) / 2, B1, 0]);
  const nsegC = new M.Rectangle({ width: xC - xm, height: 0.36, color: C.green, strokeWidth: 2 }); nsegC.setFill(C.green, 0.3); nsegC.moveTo([(xm + xC) / 2, B1, 0]);
  const nwB = new M.Rectangle({ width: W * 0.5, height: 0.4, color: C.cyan, strokeWidth: 2 }); nwB.setFill(C.cyan, 0.45); nwB.moveTo([xB + W * 0.25, B2, 0]);
  const nwC = new M.Rectangle({ width: W * 0.5, height: 0.4, color: C.amber, strokeWidth: 2 }); nwC.setFill(C.amber, 0.45); nwC.moveTo([xC - W * 0.25, B2, 0]);
  const n12 = T('2', 15, C.pink, true, true).moveTo([(xB + xm) / 2, B1 - 0.4, 0]), n28 = T('2', 15, C.green, true, true).moveTo([(xm + xC) / 2, B1 - 0.4, 0]);
  const ntB = T('B 0.5', 14, C.cyan, true, true).moveTo([xB + W * 0.25, B2 - 0.4, 0]), ntC = T('C 0.5', 14, C.amber, true, true).moveTo([xC - W * 0.25, B2 - 0.4, 0]);
  const q2 = T('?', 18, C.pink, true, true); q2.moveTo([xm, SY + 0.38, 0]);
  await until(S(50)); await play(new M.Transform(qc, tgt(qc, xm), { runTime: 1.4 }), new M.Transform(drop, tgt(drop, xm), { runTime: 1.4 }), new M.FadeOut(qt), new M.FadeIn(q2),
    new M.Transform(segB, nsegB), new M.Transform(segC, nsegC), new M.Transform(wB, nwB), new M.Transform(wC, nwC),
    new M.FadeOut(new M.VGroup(l12, l28, tB, tC)), new M.FadeIn(new M.VGroup(n12, n28, ntB, ntC)),
    ...fbox(['spot halfway: (200, 100)', ['weights 0.5 and 0.5', C.green]], C.green), ...say('HALFWAY → BOTH WEIGHTS 0.5', C.green));
  const est2 = T('20°', 16, C.pink, true, true); est2.moveTo([xm, SY + 0.38, 0]);
  await until(S(51)); await play(new M.FadeOut(q2), new M.FadeIn(est2), ...fbox(['18 × 0.5 + 22 × 0.5', ['= 9 + 11 = 20 °C', C.pink]], C.pink), ...say('ESTIMATE: 20 °C', C.pink));

  // 52-54 use and warning
  await until(S(52)); await play(new M.LaggedStart(sens.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }), ...say('FEW MEASUREMENTS → A FULL MAP', C.green));
  await until(S(53)); await play(...fbox(['wrong model of distance', ['→ poor estimate', C.amber]], C.amber), ...say('A BAD MODEL GIVES A POOR ESTIMATE', C.amber));
  await until(S(54)); await play(...say('KRIGING: READINGS × WEIGHTS FROM DISTANCE', C.green));
}
