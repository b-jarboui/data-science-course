// 16.4.3 Spatial autocorrelation: Moran's I with four street sensors.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SX = P ? 0.0136 : 0.0168, MX = P ? 0 : -2.3;
  const ex = e => MX + (e - 200) * SX;
  const TY0 = P ? 0.0 : -0.6, TK = P ? 0.5 : 0.4;
  const ty = t => TY0 + (t - 20) * TK;
  const at = (e, t) => [ex(e), ty(t), 0];
  const BOXP = P ? [0, -4.2, 0] : [4.3, -0.3, 0];
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
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const NM = ['A', 'B', 'C', 'D'], EAST = [0, 100, 300, 400];
  let TEMP = [18, 18, 22, 22];
  const tcol = t => t < 20 ? C.cyan : C.amber;

  // 0-1 street and sensors
  const base = ty(15.5);
  const street = new M.Line({ start: [ex(-50), base, 0], end: [ex(450), base, 0], color: C.muted, strokeWidth: 3 });
  const streetLab = T('street', 17, C.muted); streetLab.moveTo([ex(-50) + 0.45, base - 0.66, 0]);
  const houses = new M.VGroup(...[[-20, 0.9], [55, 1.4], [150, 1.0], [245, 1.6], [350, 1.15], [430, 0.8]].map(([e, h]) => {
    const r = new M.Rectangle({ width: P ? 0.6 : 0.75, height: h, color: C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([ex(e), base + h / 2 + 0.05, 0]); return r;
  }));
  await until(S(0)); await play(new M.Create(street), new M.FadeIn(streetLab), new M.FadeIn(houses), ...say('DO NEARBY STREETS HAVE SIMILAR TEMPERATURES?'));
  const letters = NM.map((n, k) => T(n, 19, C.ink, true, true).moveTo([ex(EAST[k]), base - 0.32, 0]));
  const posts = EAST.map(e => { const d = new M.Dot({ point: [ex(e), base, 0], radius: 0.08, color: C.ink }); return d; });
  await until(S(1)); await play(new M.LaggedStart(letters.map((l, k) => new M.FadeIn(new M.VGroup(l, posts[k]))), { lagRatio: 0.2, runTime: 1.4 }), ...say('4 SENSORS ALONG THE STREET'));

  // temperature axis appears with the first reading
  const axX = ex(-50);
  const axis = new M.Line({ start: [axX, base, 0], end: [axX, ty(24.6), 0], color: C.muted, strokeWidth: 2 });
  const ticks = [16, 18, 20, 22, 24].map(v => T(String(v), 14, C.muted, true).moveTo([axX - 0.3, ty(v), 0]));
  const unit = T('°C', 14, C.muted, true); unit.moveTo([axX, ty(24.6) + 0.25, 0]);

  // 2-5 readings as glowing dots on stems
  const stems = [], dots = [], tl = [];
  const mkDot = (k, t) => {
    const p = at(EAST[k], t), col = tcol(t);
    const halo = new M.Dot({ point: p, radius: 0.25, color: col }); halo.setFill(col, 0.2);
    const d = new M.Dot({ point: p, radius: 0.12, color: col });
    return new M.VGroup(halo, d);
  };
  const mkStem = (k, t) => { const s = new M.Line({ start: [ex(EAST[k]), base, 0], end: at(EAST[k], t), color: tcol(t), strokeWidth: 2 }); s.setStrokeOpacity(0.5); return s; };
  // side away from the neighbor link: A and C to the left, B and D to the right
  const side = k => (k % 2 ? 1 : -1) * (P ? 0.44 : 0.5);
  const mkTl = (k, t) => T(`${t}°`, 16, tcol(t), true).moveTo(t < 20 ? [ex(EAST[k]) + side(k), ty(t) - 0.12, 0] : [ex(EAST[k]), ty(t) + 0.38, 0]);
  for (let k = 0; k < 4; k++) {
    await until(S(2 + k));
    stems[k] = mkStem(k, TEMP[k]); dots[k] = mkDot(k, TEMP[k]); tl[k] = mkTl(k, TEMP[k]);
    const extra = k === 0 ? [new M.FadeIn(new M.VGroup(axis, ...ticks, unit)), new M.FadeOut(houses)] : [];
    await play(...extra, new M.Create(stems[k]), new M.FadeIn(dots[k]), new M.FadeIn(tl[k]), ...say(`SENSOR ${NM[k]}: ${TEMP[k]} °C`, tcol(TEMP[k])));
  }

  // 6-9 the pattern
  await until(S(6)); await play(new M.Indicate(dots[0], { color: C.cyan }), new M.Indicate(dots[1], { color: C.cyan }), ...say('A AND B: CLOSE, SAME TEMPERATURE', C.cyan));
  await until(S(7)); await play(new M.Indicate(dots[2], { color: C.amber }), new M.Indicate(dots[3], { color: C.amber }), ...say('C AND D: CLOSE, SAME TEMPERATURE', C.amber));
  const grpBox = (e1, e2, t, col) => { const r = new M.RoundedRectangle({ width: ex(e2) - ex(e1) + 0.9, height: 1.15, cornerRadius: 0.2, color: col, strokeWidth: 2 }); r.moveTo([(ex(e1) + ex(e2)) / 2, ty(t) + 0.12, 0]); return r; };
  const gCool = grpBox(0, 100, 18, C.cyan), gWarm = grpBox(300, 400, 22, C.amber);
  await until(S(8)); await play(new M.Create(gCool), new M.Create(gWarm), ...say('COOL GROUP  |  WARM GROUP', C.violet));
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(gCool, gWarm)), ...say('ONE NUMBER FOR THIS PATTERN?', C.violet));

  // 10-13 the mean
  await until(S(10)); await play(...say('STEP 1: THE MEAN TEMPERATURE', C.green));
  await until(S(11)); await play(...fbox(['18 + 18 + 22 + 22', ['= 80', C.green]], C.green));
  await until(S(12)); await play(...fbox(['18 + 18 + 22 + 22 = 80', ['mean = 80 ÷ 4 = 20 °C', C.green]], C.green));
  const meanLine = new M.DashedLine({ start: at(-50, 20), end: at(450, 20), color: C.green, strokeWidth: 2.5 });
  const meanLab = T('mean 20', 14, C.green, true); meanLab.moveTo([ex(-50) + 0.55, ty(20) + 0.22, 0]);
  await until(S(13)); await play(new M.Create(meanLine), new M.FadeIn(meanLab), ...say('A LINE AT 20 °C', C.green));

  // 14-18 deviations
  let devs = [], devL = [];
  const mkDev = (k, t) => {
    const col = tcol(t);
    const seg = new M.Line({ start: at(EAST[k], 20), end: at(EAST[k], t), color: col, strokeWidth: 5 });
    const lab = T(t < 20 ? '−2' : '+2', 16, col, true, true); lab.moveTo([ex(EAST[k]) + side(k) * 0.85, ty((t + 20) / 2) + (t < 20 ? 0.12 : 0), 0]);
    return [seg, lab];
  };
  for (let k = 0; k < 4; k++) [devs[k], devL[k]] = mkDev(k, TEMP[k]);
  await until(S(14)); await play(new M.Create(devs[0]), new M.Create(devs[1]), ...say('A AND B: 2 BELOW THE MEAN', C.cyan));
  await until(S(15)); await play(new M.Create(devs[2]), new M.Create(devs[3]), ...say('C AND D: 2 ABOVE THE MEAN', C.amber));
  await until(S(16)); await play(new M.FadeIn(devL[0]), new M.FadeIn(devL[1]), ...say('BELOW → MINUS 2', C.cyan));
  await until(S(17)); await play(new M.FadeIn(devL[2]), new M.FadeIn(devL[3]), ...say('ABOVE → PLUS 2', C.amber));
  await until(S(18)); await play(new M.LaggedStart(devL.map(l => new M.Indicate(l)), { lagRatio: 0.15, runTime: 1.2 }), ...fbox(['deviation =', ['  reading − mean', C.violet], '18 − 20 = −2', '22 − 20 = +2'], C.violet), ...say('READING − MEAN = DEVIATION', C.violet));

  // 19-24 neighbors
  await until(S(19)); await play(...say('WHICH SENSORS ARE CLOSE ENOUGH TO COMPARE?'));
  await until(S(20)); await play(...fbox(['neighbors:', ['  100 m apart or less', C.violet]], C.violet), ...say('NEIGHBORS: 100 m OR LESS', C.violet));
  const linkY = t => ty(t) - 0.0;
  const mkLink = (i, j) => new M.Line({ start: at(EAST[i], TEMP[i]), end: at(EAST[j], TEMP[j]), color: C.violet, strokeWidth: 4 });
  const dLab = (e1, e2, s, col) => T(s, 14, col, true).moveTo([(ex(e1) + ex(e2)) / 2, base + 0.22, 0]);
  let lAB = mkLink(0, 1), lCD = mkLink(2, 3);
  const d100a = dLab(0, 100, '100 m', C.violet), d100b = dLab(300, 400, '100 m', C.violet), d200 = dLab(100, 300, '200 m', C.pink);
  await until(S(21)); await play(new M.Create(lAB), new M.FadeIn(d100a), ...say('A–B: 100 m → NEIGHBORS, DRAW A LINK', C.violet));
  await until(S(22)); await play(new M.Create(lCD), new M.FadeIn(d100b), ...say('C–D: 100 m → NEIGHBORS', C.violet));
  const noBC = new M.DashedLine({ start: at(100, 18), end: at(300, 22), color: C.pink, strokeWidth: 2 });
  await until(S(23)); await play(new M.Create(noBC), new M.FadeIn(d200), ...say('B–C: 200 m → NOT CONNECTED', C.pink));
  await play(new M.FadeOut(noBC));
  await until(S(24)); await play(new M.Indicate(lAB, { color: C.cyan }), new M.Indicate(lCD, { color: C.amber }), ...say('EACH NEIGHBOR: SAME SIDE OF THE MEAN', C.green));

  // 25-27 names
  await until(S(25)); await play(...fbox(['nearby places: similar', 'or different readings?', ['= spatial autocorrelation', C.green]], C.green), ...say('SPATIAL AUTOCORRELATION', C.green));
  await until(S(26)); await play(...say("ONE NUMBER TO MEASURE IT: MORAN'S I", C.amber));
  await until(S(27)); await play(...say("LET'S CALCULATE MORAN'S I", C.amber));

  // 28-35 neighbor products
  const prodRows = [];
  await until(S(28)); await play(...fbox([['neighbor products', C.amber], 'deviation × neighbor deviation'], C.amber), ...say('MULTIPLY NEIGHBOR DEVIATIONS', C.amber));
  const pr = [['A·B: (−2)×(−2) = +4', 0, 1], ['B·A: (−2)×(−2) = +4', 1, 0], ['C·D: (+2)×(+2) = +4', 2, 3], ['D·C: (+2)×(+2) = +4', 3, 2]];
  for (let k = 0; k < 4; k++) {
    await until(S(29 + k));
    prodRows.push(pr[k][0]);
    await play(new M.Indicate(devL[pr[k][1]], { color: C.amber }), new M.Indicate(devL[pr[k][2]], { color: C.amber }),
      ...fbox([['neighbor products', C.amber], ...prodRows], C.amber));
  }
  await until(S(33)); await play(...say('SAME SIGN → POSITIVE (+)', C.green));
  await until(S(34)); await play(...say('DIFFERENT SIGNS → NEGATIVE (−)', C.pink));
  await until(S(35)); await play(...fbox([['neighbor products', C.amber], '+4, +4, +4, +4', ['mean = 16 ÷ 4 = 4', C.amber]], C.amber), ...say('MEAN OF THE PRODUCTS = 4', C.amber));

  // 36-40 squared deviations
  await until(S(36)); await play(...say('HOW FAR ARE ALL READINGS FROM THE MEAN?', C.violet));
  await until(S(37)); await play(new M.LaggedStart(devs.map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.15, runTime: 1.2 }), ...fbox([['each deviation × itself', C.violet], '(−2)×(−2) = 4'], C.violet));
  await until(S(38)); await play(...say('NUMBER × ITSELF = SQUARING', C.violet));
  await until(S(39)); await play(...fbox([['squared deviations', C.violet], 'A: (−2)² = 4   B: (−2)² = 4', 'C: (+2)² = 4   D: (+2)² = 4'], C.violet), ...say('ALL FOUR SQUARES = 4', C.violet));
  await until(S(40)); await play(...fbox([['squared deviations', C.violet], '4, 4, 4, 4', ['mean = 16 ÷ 4 = 4', C.violet]], C.violet));

  // 41-45 divide
  await until(S(41)); await play(...fbox(['mean of products', ['÷ mean of squares', C.ink]], C.cyan), ...say('DIVIDE THE FIRST MEAN BY THE SECOND'));
  await until(S(42)); await play(...fbox(['mean of products', '÷ mean of squares', ['= 4 ÷ 4 = 1', C.green]], C.green), ...say('4 ÷ 4 = 1', C.green));
  await until(S(43)); await play(...say('THE STEPS AS A SHORT FORMULA', C.cyan));
  await until(S(44)); await play(...fbox(["Moran's I =", ['  mean of neighbor products', C.amber], ['  ÷ mean of squared deviations', C.violet], ['I = 4 ÷ 4 = +1', C.green]], C.cyan));
  await until(S(45)); await play(new M.Indicate(lAB, { color: C.green }), new M.Indicate(lCD, { color: C.green }), ...say('+1: NEIGHBORS HAVE MATCHING DEVIATIONS', C.green));

  // 46-49 swap the readings of B and C
  TEMP = [18, 22, 18, 22];
  const nd1 = mkDot(1, 22), nd2 = mkDot(2, 18), ns1 = mkStem(1, 22), ns2 = mkStem(2, 18), nt1 = mkTl(1, 22), nt2 = mkTl(2, 18);
  const [dv1, dl1] = mkDev(1, 22), [dv2, dl2] = mkDev(2, 18);
  await until(S(46)); await play(new M.FadeOut(new M.VGroup(lAB, lCD, devs[1], devs[2], devL[1], devL[2])),
    new M.Transform(dots[1], nd1, { pathArc: -0.8, runTime: 1.6 }), new M.Transform(dots[2], nd2, { pathArc: -0.8, runTime: 1.6 }),
    new M.Transform(stems[1], ns1), new M.Transform(stems[2], ns2), new M.Transform(tl[1], nt1), new M.Transform(tl[2], nt2),
    ...say('SWAP THE READINGS OF B AND C', C.pink));
  await play(new M.Create(dv1), new M.Create(dv2), new M.FadeIn(dl1), new M.FadeIn(dl2));
  devs[1] = dv1; devs[2] = dv2; devL[1] = dl1; devL[2] = dl2;
  lAB = mkLink(0, 1); lCD = mkLink(2, 3);
  await until(S(47)); await play(new M.Create(lAB), new M.Create(lCD), ...say('EACH NEIGHBOR: OPPOSITE SIDE OF THE MEAN', C.pink));
  await until(S(48)); await play(...fbox([['neighbor products', C.pink], 'A·B, B·A: (−2)×(+2) = −4', 'C·D, D·C: (+2)×(−2) = −4', ['squares: still 4, 4, 4, 4', C.violet]], C.pink));
  await until(S(49)); await play(...fbox(["Moran's I", ['= −4 ÷ 4 = −1', C.pink]], C.pink), ...say('−4 ÷ 4 = −1', C.pink));

  // 50-54 meaning and a warning
  await until(S(50)); await play(...fbox([['I > 0: neighbors similar', C.green], 'I < 0: neighbors different'], C.green), ...say("POSITIVE MORAN'S I → NEIGHBORS SIMILAR", C.green));
  await until(S(51)); await play(new M.Indicate(lAB, { color: C.pink }), new M.Indicate(lCD, { color: C.pink }), ...fbox(['I > 0: neighbors similar', ['I < 0: neighbors different', C.pink]], C.pink), ...say("NEGATIVE MORAN'S I → NEIGHBORS DIFFERENT", C.pink));
  await until(S(52)); await play(new M.LaggedStart(dots.map(d => new M.Indicate(d)), { lagRatio: 0.15, runTime: 1.4 }), ...say('HOW ARE TEMPERATURES ARRANGED ON THE MAP?', C.cyan));
  await until(S(53)); await play(new M.Indicate(d200, { color: C.amber }), ...fbox(['neighbor distance', ['  changes → result can change', C.amber]], C.amber), ...say('CHANGE THE NEIGHBOR DISTANCE → I CAN CHANGE', C.amber));
  await until(S(54)); await play(...say('NEARBY PLACES: SIMILAR OR DIFFERENT?', C.green));
}
