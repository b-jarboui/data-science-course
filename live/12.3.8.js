// 12.3.8 Bayesian optimization: learn from each trial (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const TRI = [[0.5, 2.4], [2, 1.6], [8, 3.1]];
  const CAND = [[1.5, 1.7, 0.1, 1.5], [4, 1.9, 0.4, 1.1], [7, 2.9, 0.2, 2.5]];
  const CX = P ? 0 : -3.0;
  const PILL = P ? [0, 1.35, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.0, 0] : [3.6, 0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
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
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // the plot: penalty weight 0..10 across, score 0.5..3.5 up
  const PX0 = P ? -3.0 : -5.8, PW = P ? 6.2 : 5.6, PY0 = P ? -2.9 : -2.3, PH = P ? 3.4 : 3.4;
  const px = l => PX0 + l / 10 * PW, py = v => PY0 + (Math.max(0.5, Math.min(3.5, v)) - 0.5) / 3.0 * PH, pp = (l, v) => [px(l), py(v), 0];

  // 0-1 the bike shop and the wish
  const BIKE = P ? [0, -0.9] : [CX, -0.4];
  const bp = (x, y) => [BIKE[0] + x, BIKE[1] + y, 0];
  const wheel = x => { const c = new M.Circle({ radius: 0.45, color: C.cyan, strokeWidth: 3 }); c.moveTo(bp(x, 0)); return c; };
  const tube = (a, b) => new M.Line({ start: bp(...a), end: bp(...b), color: C.ink, strokeWidth: 3 });
  const bike = [wheel(-0.8), wheel(0.8), tube([-0.8, 0], [-0.1, 0]), tube([-0.1, 0], [-0.35, 0.75]), tube([-0.8, 0], [-0.35, 0.75]),
    tube([-0.35, 0.75], [0.55, 0.75]), tube([-0.1, 0], [0.55, 0.75]), tube([0.55, 0.75], [0.8, 0]), tube([0.55, 0.75], [0.62, 0.95]),
    tube([0.48, 0.95], [0.78, 0.95]), tube([-0.52, 0.85], [-0.18, 0.85])];
  await until(S(0)); await play(new M.LaggedStart(bike.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }), ...say('STILL TUNING THE BIKE-PRICE MODEL'));
  await until(S(1)); await play(...fbox(['find a good penalty weight', ['without hundreds of trials', C.pink]], C.amber), ...say('FEW TRIALS, GOOD PENALTY WEIGHT', C.amber));

  // 2-4 the axes
  const xAxis = new M.Line({ start: pp(0, 0.5), end: pp(10, 0.5), color: C.muted, strokeWidth: 3 });
  const xt = [0, 2, 4, 6, 8, 10].flatMap(v => {
    const t = T(String(v), 16, C.amber, true); t.moveTo([px(v), PY0 - 0.28, 0]);
    return [new M.Line({ start: [px(v), PY0 - 0.07, 0], end: [px(v), PY0 + 0.07, 0], color: C.muted, strokeWidth: 2 }), t];
  });
  const xTitle = T('penalty weight →', P ? 15 : 16, C.amber); xTitle.moveTo([px(5), PY0 - 0.6, 0]);
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...bike)), ...unbox(), new M.Create(xAxis), new M.FadeIn(new M.VGroup(...xt, xTitle)),
    ...say('A LINE FROM 0 TO 10: PENALTY WEIGHT', C.amber));
  const yAxis = new M.Line({ start: pp(0, 0.5), end: pp(0, 3.5), color: C.muted, strokeWidth: 3 });
  const yt = [1, 2, 3].flatMap(v => {
    const t = T(String(v), 16, C.muted, true); t.moveTo([PX0 - 0.28, py(v), 0]);
    return [new M.Line({ start: [PX0 - 0.07, py(v), 0], end: [PX0 + 0.07, py(v), 0], color: C.muted, strokeWidth: 2 }), t];
  });
  const yTitle = T('↑ score', P ? 15 : 16, C.ink); yTitle.moveTo([PX0 + 0.55, py(3.5) + 0.25, 0]);
  await until(S(3)); await play(new M.Create(yAxis), new M.FadeIn(new M.VGroup(...yt, yTitle)), ...say('ABOVE IT: THE CROSS-VALIDATION SCORE'));
  await until(S(4)); await play(...fbox(['smaller score', ['= fewer mistakes', C.green]], C.green), ...say('SMALLER = BETTER', C.green));

  // 5-9 three trials so far
  const tDots = TRI.map(([l, v]) => new M.Dot({ point: pp(l, v), radius: 0.13, color: C.cyan }));
  const tLabs = TRI.map(([l, v]) => { const t = T(v.toFixed(1), 17, C.cyan, true, true); t.moveTo([px(l) + (l < 1 ? 0.15 : 0), py(v) + 0.32, 0]); return t; });
  await until(S(5)); await play(...fbox(['results of 3 trials', ['so far', C.muted]]), ...say('THREE TRIALS ALREADY DONE'));
  for (let k = 0; k < 3; k++) {
    await until(S(6 + k));
    const [l, v] = TRI[k];
    await play(new M.FadeIn(tDots[k]), new M.Flash(tDots[k], { color: C.cyan }), new M.FadeIn(tLabs[k]),
      ...fbox([`trial ${k + 1}: penalty ${l}`, [`score = ${v.toFixed(1)}`, C.cyan]]));
  }
  await until(S(9)); await play(new M.Indicate(tLabs[1], { color: C.green }), ...fbox(['best so far', ['1.6 at penalty 2', C.green]], C.green), ...say('BEST SO FAR = 1.6', C.green));

  // 10-12 where next?
  const q = T('?', P ? 38 : 42, C.amber, false, true); q.moveTo(pp(5, 2.2));
  await until(S(10)); await play(new M.FadeIn(q), ...unbox(), ...say('WHERE DO WE PUT TRIAL 4?', C.amber));
  await until(S(11)); await play(new M.Indicate(q, { color: C.muted }), ...say('BY CHANCE, LIKE RANDOM SEARCH?', C.muted));
  await until(S(12)); await play(new M.LaggedStart(tDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.5 }),
    ...say('THE 3 TRIALS ALREADY TELL US SOMETHING'));

  // 13-16 a valley in fog
  const fog = [];
  for (let j = 0; j < 4; j++) {
    const y = py(1.0 + j * 0.7);
    for (let i = 0; i < 6; i++) fog.push(new M.Line({ start: [px(i * 1.7 + 0.2), y, 0], end: [px(i * 1.7 + 1.3), y, 0], color: C.line, strokeWidth: 6 }));
  }
  await until(S(13)); await play(new M.FadeOut(q), new M.LaggedStart(fog.map(f => new M.FadeIn(f)), { lagRatio: 0.03, runTime: 1.4 }),
    ...fbox(['find the lowest point', ['of a valley in fog', C.muted]]), ...say('A VALLEY COVERED BY FOG', C.muted));
  const poles = TRI.map(([l, v]) => new M.DashedLine({ start: pp(l, 0.5), end: pp(l, v), color: C.cyan }));
  await until(S(14)); await play(new M.LaggedStart(poles.map(p => new M.Create(p)), { lagRatio: 0.3, runTime: 1.4 }), ...say('EACH VISIT: THE HEIGHT THERE'));
  // the surrogate curve and its band
  const cr = (pts, x) => {
    let i = 0; while (i < pts.length - 2 && x > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const t = (x - p1[0]) / (p2[0] - p1[0]);
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0] || 1) * (p2[0] - p1[0]), m2 = (p3[1] - p1[1]) / (p3[0] - p1[0] || 1) * (p2[0] - p1[0]);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
  const MU1 = [[0, 2.7], [0.5, 2.4], [1.5, 1.7], [2, 1.6], [4, 1.9], [7, 2.9], [8, 3.1], [10, 3.4]];
  const SG1 = [[0, 0.2], [0.5, 0], [1, 0.11], [1.5, 0.1], [2, 0], [4, 0.4], [5, 0.42], [7, 0.2], [8, 0], [9, 0.2], [10, 0.3]];
  const MU2 = [[0, 2.7], [0.5, 2.4], [1.5, 1.7], [2, 1.6], [3, 1.75], [4, 2.1], [5.5, 2.5], [7, 2.9], [8, 3.1], [10, 3.4]];
  const SG2 = [[0, 0.2], [0.5, 0], [1, 0.11], [1.5, 0.1], [2, 0], [3, 0.12], [4, 0], [6, 0.22], [7, 0.2], [8, 0], [9, 0.2], [10, 0.3]];
  const xs = Array.from({ length: 101 }, (_, i) => i / 10);
  function curveOf(mu, color = C.green, sw = 4, dashed = false) {
    // a chain of short lines: a curve, never a filled shape
    return new M.VGroup(...xs.slice(1).map((x, i) => new M.Line({ start: pp(xs[i], cr(mu, xs[i])), end: pp(x, cr(mu, x)), color, strokeWidth: sw })));
  }
  function bandOf(mu, sg) {
    const bx = xs.filter(x => x >= 0.1 && x <= 9.9);
    const up = bx.map(x => pp(x, Math.min(3.45, cr(mu, x) + 2 * Math.max(0, cr(sg, x)))));
    const dn = bx.slice().reverse().map(x => pp(x, cr(mu, x) - 2 * Math.max(0, cr(sg, x))));
    const b = new M.Polygon({ vertices: [...up, ...dn], color: '#3b3470', strokeWidth: 1 });
    b.setFill('#2a2452', 0.85);
    return new M.VGroup(b);
  }
  const guess = curveOf(MU1, C.muted, 3);
  await until(S(15)); await play(new M.Create(guess), ...say('HEIGHTS → GUESS THE VALLEY SHAPE'));
  const gapArrow = new M.DoubleArrow({ start: pp(2.4, 3.3), end: pp(7.6, 3.3), color: C.violet, strokeWidth: 3 });
  const gapLab = T('far from visits: less known', 15, C.violet); gapLab.moveTo([px(5), py(3.3) - 0.3, 0]);
  await until(S(16)); await play(new M.Create(gapArrow), new M.FadeIn(gapLab), ...say('FAR FROM VISITS: WE KNOW LESS', C.violet));

  // 17-23 the surrogate model and its band
  await until(S(17)); await play(new M.FadeOut(new M.VGroup(...fog, ...poles, guess, gapArrow, gapLab)), ...unbox(), ...say('SAME IDEA FOR THE PENALTY WEIGHT'));
  let curve = curveOf(MU1);
  await until(S(18)); await play(new M.Create(curve), ...say('A CURVE PREDICTS THE SCORE EVERYWHERE', C.green));
  await until(S(19)); await play(new M.LaggedStart(tDots.map(d => new M.Flash(d, { color: C.green })), { lagRatio: 0.3, runTime: 1.5 }),
    ...fbox(['the curve is built from', ['the 3 known scores', C.cyan]]));
  await until(S(20)); await play(...fbox(['surrogate model =', ['a cheap stand-in', C.green], ['for slow, costly trials', C.green]], C.green), ...say('SURROGATE MODEL', C.green));
  let band = bandOf(MU1, SG1);
  await until(S(21)); await play(new M.FadeOut(curve), new M.FadeIn(band), ...say('A BAND: HOW UNSURE THE MODEL IS', C.violet));
  curve = curveOf(MU1); await play(new M.FadeIn(curve));
  const narrowP = pp(1.5, 1.95), wideP = pp(5, 3.15);
  const nLab = T('narrow', 15, C.ink), wLab = T('wide', 15, C.ink); nLab.moveTo(narrowP); wLab.moveTo(wideP);
  await until(S(22)); await play(new M.FadeIn(nLab), new M.FadeIn(wLab), ...fbox(['narrow band = less unsure', ['wide band = more unsure', C.violet]], C.violet));
  await until(S(23)); await play(new M.FadeOut(new M.VGroup(nLab, wLab)), ...fbox(['uncertainty =', ['how unsure a prediction is', C.violet]], C.violet), ...say('UNCERTAINTY', C.violet));

  // 24-29 exploit or explore
  await until(S(24)); await play(...unbox(), ...say('TWO REASONS TO PICK THE NEXT TRIAL'));
  const nearArc = new M.Circle({ radius: 0.42, color: C.green, strokeWidth: 3 }); nearArc.moveTo(pp(1.8, 1.65));
  await until(S(25)); await play(new M.Create(nearArc), ...say('1: TEST NEAR A GOOD SCORE', C.green));
  await until(S(26)); await play(...fbox(['search near good results', ['= exploitation', C.green]], C.green));
  const farArc = new M.Circle({ radius: 0.55, color: C.violet, strokeWidth: 3 }); farArc.moveTo(pp(5, 2.3));
  await until(S(27)); await play(new M.Create(farArc), ...say('2: TEST WHERE WE KNOW LITTLE', C.violet));
  await until(S(28)); await play(...fbox(['search less known areas', ['= exploration', C.violet]], C.violet));
  await until(S(29)); await play(new M.Indicate(nearArc, { color: C.green }), new M.Indicate(farArc, { color: C.violet }),
    ...fbox(['Bayesian optimization:', 'earlier results balance', [' exploitation + exploration', C.amber]], C.amber), ...say('BAYESIAN OPTIMIZATION', C.amber));

  // 30-36 three places for trial 4: predicted score and uncertainty
  const cLines = CAND.map(([l]) => new M.DashedLine({ start: pp(l, 0.5), end: pp(l, 3.5), color: C.amber }));
  const cMu = CAND.map(([l, m]) => new M.Dot({ point: pp(l, m), radius: 0.1, color: C.amber }));
  const HEAD = 'λ    score  unsure';
  const rowTxt = (k, n) => { const [l, m, s] = CAND[k]; return `${String(l).padEnd(5)}${m.toFixed(1).padEnd(7)}${n > 1 ? s.toFixed(1) : '?'}`; };
  const table = (done, last) => [['penalty  predicted  uncertainty', C.muted], ...CAND.map((_, k) => {
    const [l, m, s] = CAND[k];
    return [`${String(l).padEnd(9)}${(k < done[0] ? m.toFixed(1) : '?').padEnd(11)}${k < done[1] ? s.toFixed(1) : '?'}`, k === last ? C.amber : C.ink];
  })];
  await until(S(30)); await play(new M.FadeOut(new M.VGroup(nearArc, farArc)), ...cLines.map(c => new M.Create(c)), ...fbox(table([0, 0], -1), C.amber),
    ...say('3 PLACES FOR TRIAL 4', C.amber));
  for (let k = 0; k < 3; k++) {
    await until(S(31 + 2 * k));
    await play(new M.FadeIn(cMu[k]), new M.Flash(cMu[k], { color: C.amber }), ...fbox(table([k + 1, k], k), C.amber));
    await until(S(32 + 2 * k));
    const [l, m, s] = CAND[k];
    const bar = new M.Line({ start: pp(l, m - 2 * s), end: pp(l, m + 2 * s), color: C.violet, strokeWidth: 6 });
    cLines[k].bar = bar;
    await play(new M.Create(bar), ...fbox(table([k + 1, k + 1], k), C.violet));
  }

  // 37-43 lower confidence bound
  await until(S(37)); await play(...fbox(['look at both:', ['predicted score', C.amber], ['+ chance of better', C.violet]], C.amber), ...say('BOTH: PREDICTION AND A CHANCE OF BETTER'));
  await until(S(38)); await play(...fbox(['predicted score', ['− 2 × uncertainty', C.violet]], C.amber), ...say('SUBTRACT 2 × UNCERTAINTY', C.violet));
  const lDots = CAND.map(([l, m, s, b]) => new M.Dot({ point: pp(l, b), radius: 0.12, color: C.pink }));
  const lLabs = CAND.map(([l, m, s, b]) => { const t = T(b.toFixed(1), 17, C.pink, true, true); t.moveTo([px(l) + 0.38, py(b) - 0.08, 0]); return t; });
  const lcbRows = [];
  for (let k = 0; k < 3; k++) {
    const [l, m, s, b] = CAND[k];
    await until(S(39 + k));
    lcbRows.push([`${l}: ${m.toFixed(1)} − ${(2 * s).toFixed(1)} = ${b.toFixed(1)}`, C.pink]);
    await play(new M.FadeIn(lDots[k]), new M.Flash(lDots[k], { color: C.pink }), new M.FadeIn(lLabs[k]),
      ...fbox([['predicted − 2 × uncertainty', C.muted], ...lcbRows], C.pink));
  }
  await until(S(42)); await play(new M.LaggedStart(lLabs.map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.3, runTime: 1.5 }),
    ...say('LOWER CONFIDENCE BOUND (LCB)', C.pink));
  await until(S(43)); await play(...fbox(['LCB = predicted score', ['− 2 × uncertainty', C.pink]], C.pink));

  // 44-46 choose the smallest LCB
  await until(S(44)); await play(...say('PICK THE SMALLEST LCB', C.green));
  await until(S(45)); await play(new M.Indicate(lLabs[1], { color: C.green }), new M.Flash(lDots[1], { color: C.green }),
    ...fbox(['LCB: 1.5, 1.1, 2.5', ['smallest = 1.1 → penalty 4', C.green]], C.green), ...say('NEXT TRIAL: PENALTY 4', C.green));
  await until(S(46)); await play(new M.Indicate(cLines[1].bar, { color: C.violet }), ...say('BIG UNCERTAINTY → WORTH A LOOK', C.violet));

  // 47-49 trial 4 and the update
  const t4 = new M.Dot({ point: pp(4, 2.1), radius: 0.13, color: C.cyan });
  const t4Lab = T('2.1', 17, C.cyan, true, true); t4Lab.moveTo([px(4) - 0.38, py(2.1) + 0.12, 0]);
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(...cMu, ...lDots, ...lLabs, cLines[0].bar, cLines[2].bar, cLines[0], cLines[2])),
    new M.FadeIn(t4), new M.Flash(t4, { color: C.cyan }), new M.FadeIn(t4Lab), ...fbox(['trial 4: penalty 4', ['real score = 2.1', C.cyan]]), ...say('TRIAL 4: REAL SCORE 2.1'));
  await until(S(48)); await play(new M.Indicate(tLabs[1], { color: C.green }), ...fbox(['scores: 2.4, 1.6, 3.1, 2.1', ['best = 1.6 at penalty 2', C.green]], C.green), ...say('BEST STAYS 1.6', C.green));
  const band2 = bandOf(MU2, SG2), curve2 = curveOf(MU2);
  await until(S(49)); await play(new M.FadeOut(new M.VGroup(band, curve, cLines[1].bar, cLines[1])), new M.FadeIn(band2), ...say('ADD TRIAL 4 → UPDATE CURVE AND BAND', C.violet));
  await play(new M.FadeIn(curve2));

  // 50-51 the loop and the best score after each trial
  await until(S(50)); await play(...fbox(['1. fit the curve + band', '2. pick the smallest LCB', '3. run that trial', ['4. add it, repeat', C.amber]], C.amber), ...say('REPEAT: EACH RESULT GUIDES THE NEXT', C.amber));
  const BEST = [2.4, 1.6, 1.6, 1.6];
  const GX = P ? -2.6 : 1.7, GY = P ? -5.25 : -2.75, GW = P ? 5.4 : 3.8, GH = P ? 0.9 : 1.2;
  const gx = k => GX + (k + 0.5) / 4 * GW, gy = v => GY + (v - 1.0) / 1.6 * GH;
  const gAxis = [new M.Line({ start: [GX, GY, 0], end: [GX + GW, GY, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [GX, GY, 0], end: [GX, GY + GH + 0.15, 0], color: C.muted, strokeWidth: 2 })];
  const gNums = [0, 1, 2, 3].map(k => { const t = T(String(k + 1), 15, C.muted, true); t.moveTo([gx(k), GY - 0.22, 0]); return t; });
  const gTitle = T('best score after each trial', 15, C.green); gTitle.moveTo([GX + GW / 2, GY + GH + 0.38, 0]);
  const bDots = BEST.map((v, k) => new M.Dot({ point: [gx(k), gy(v), 0], radius: 0.08, color: C.green }));
  const bLabs = BEST.map((v, k) => { const t = T(v.toFixed(1), 15, C.green, true); t.moveTo([gx(k), gy(v) + 0.24, 0]); return t; });
  const bSegs = BEST.slice(1).map((v, k) => new M.Line({ start: [gx(k), gy(BEST[k]), 0], end: [gx(k + 1), gy(v), 0], color: C.green, strokeWidth: 2 }));
  await until(S(51)); await play(...gAxis.map(l => new M.Create(l)), new M.FadeIn(new M.VGroup(...gNums, gTitle)),
    new M.LaggedStart(BEST.map((_, k) => new M.FadeIn(new M.VGroup(bDots[k], bLabs[k], ...(k ? [bSegs[k - 1]] : [])))), { lagRatio: 0.5, runTime: 2.4 }),
    ...unbox(), ...say('BEST SCORE: FALLS OR STAYS THE SAME', C.green));

  // 52-54 when to use it, the trap, recap
  await until(S(52)); await play(...fbox(['useful when each trial', ['takes long or costs a lot', C.amber]], C.amber), ...say('FOR SLOW, COSTLY TRIALS', C.amber));
  await until(S(53)); await play(new M.Indicate(t4Lab, { color: C.pink }), ...fbox(['LCB at 4 = 1.1', ['real score = 2.1', C.pink], ['low LCB ≠ a promise', C.pink]], C.pink), ...say('A LOW LCB IS NO PROMISE', C.pink));
  await until(S(54)); await play(...fbox(['Bayesian optimization:', ['learn from each trial', C.green], ['before choosing the next', C.green]], C.green), ...say('RECAP: BAYESIAN OPTIMIZATION', C.green));
}
