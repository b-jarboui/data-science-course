// 16.4.6 Spatial block validation: random holdout vs hiding a whole district.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SX = P ? 0.0136 : 0.016, MX = P ? 0 : -2.5, MY = P ? 0.8 : 0.0;
  const px = (e, n = 100) => [MX + (e - 200) * SX, MY + (n - 100) * SX, 0];
  const BOXP = P ? [0, -4.0, 0] : [4.55, -0.3, 0];
  const DT = MY + 100 * SX, DB = P ? MY - 2.25 : MY - 100 * SX;
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
    const maxw = P ? FW - 1.0 : 4.5;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const NM = ['A', 'B', 'C', 'D'], EAST = [0, 100, 300, 400], TEMP = [18, 18, 22, 22];
  const tcol = t => t === 18 ? C.cyan : C.amber;
  const Y_T = MY - 0.42, Y_P = MY - (P ? 0.86 : 0.82), Y_G = MY - (P ? 1.32 : 1.18), Y_A = MY + 0.72;

  // 0-1 two districts
  const wPoly = new M.Rectangle({ width: 270 * SX, height: DT - DB, color: C.cyan, strokeWidth: 3 }); wPoly.setFill(C.cyan, 0.06); wPoly.moveTo([px(65)[0], (DT + DB) / 2, 0]);
  const corners = [[px(200)[0], DB, 0], [px(470)[0], DB, 0], [px(470)[0], DT, 0], [px(200)[0], DT, 0]];
  const ePoly = new M.VGroup(...corners.map((c, i) => new M.DashedLine({ start: c, end: corners[(i + 1) % 4], color: C.amber, strokeWidth: 3 })));
  const wLab = T('WEST', 16, C.cyan, true, true); wLab.moveTo([px(75, 0)[0], DB - 0.25, 0]);
  const eLab = T('EAST', 16, C.amber, true, true); eLab.moveTo([px(325, 0)[0], DB - 0.25, 0]);
  const street = new M.RoundedRectangle({ width: 500 * SX, height: 0.3, cornerRadius: 0.15, color: C.muted, strokeWidth: 1.5 });
  street.setFill(C.line, 0.6); street.moveTo(px(200));
  await until(S(0)); await play(new M.Create(wPoly), new M.Create(ePoly), new M.FadeIn(new M.VGroup(wLab, eLab, street)), ...say('ESTIMATE A DISTRICT WITHOUT SENSORS'));
  await until(S(1)); await play(...say('WILL THE ESTIMATES BE CLOSE TO THE REAL ONES?', C.violet));

  // 2-6 sensors and readings
  const sens = NM.map((n, k) => {
    const p = px(EAST[k]);
    const halo = new M.Dot({ point: p, radius: 0.24, color: C.green }); halo.setFill(C.green, 0.18);
    const d = new M.Dot({ point: p, radius: 0.1, color: C.green });
    const lab = T(n, 17, C.ink, true, true); lab.moveTo([p[0], MY + 0.35, 0]);
    return new M.VGroup(halo, d, lab);
  });
  await until(S(2)); await play(new M.LaggedStart(sens.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR 4 SENSORS', C.green));
  const temps = [];
  const dn = ['WEST', 'WEST', 'EAST', 'EAST'];
  for (let k = 0; k < 4; k++) {
    await until(S(3 + k));
    const t = T(`${TEMP[k]}°`, 15, tcol(TEMP[k]), true); t.moveTo([px(EAST[k])[0], Y_T, 0]); temps.push(t);
    await play(new M.FadeIn(t), new M.Flash(sens[k].submobjects[1], { color: tcol(TEMP[k]) }), ...say(`${dn[k]}: SENSOR ${NM[k]} READS ${TEMP[k]} °C`, tcol(TEMP[k])));
  }

  // cards, predictions, gaps
  const card = k => { const r = new M.RoundedRectangle({ width: 0.72, height: 0.36, cornerRadius: 0.08, color: C.violet, strokeWidth: 2 }); r.setFill(C.violet, 1); r.moveTo([px(EAST[k])[0], Y_T, 0]);
    const q = T('?', 15, C.bg, true, true); q.moveTo([px(EAST[k])[0], Y_T, 0]); return new M.VGroup(r, q); };
  const predL = (k, v, col) => T(`guess ${v}°`, P ? 15 : 14, col, true).moveTo([px(EAST[k])[0], Y_P, 0]);
  const gapL = (k, v, col) => T(`gap ${v}°`, P ? 15 : 14, col, true, true).moveTo([px(EAST[k])[0], Y_G, 0]);
  const arrow = (i, j, lift = 0) => new M.Arrow({ start: [px(EAST[i])[0] + (j > i ? 0.15 : -0.15), Y_A + lift, 0], end: [px(EAST[j])[0] + (j > i ? -0.12 : 0.12), Y_A + lift, 0], color: C.green, strokeWidth: 3 });

  // 7-13 the idea
  const demo = card(2);
  await until(S(7)); await play(new M.FadeIn(demo, { shift: [0, -0.25, 0] }), ...say('HIDE SOME READINGS UNDER CARDS', C.violet));
  await until(S(8)); await play(new M.Indicate(temps[1], { color: C.green }), new M.Indicate(temps[3], { color: C.green }), ...say('ESTIMATE FROM THE READINGS WE STILL SEE', C.green));
  await until(S(9)); await play(...say('ESTIMATE BEFORE THE ANSWER = PREDICTION', C.amber));
  await until(S(10)); await play(new M.FadeOut(demo, { shift: [0, 0.3, 0] }), new M.Indicate(temps[2], { color: C.amber }), ...say('REMOVE CARDS, COMPARE WITH THE REAL READINGS', C.amber));
  await until(S(11)); await play(...say('TEST WITH HIDDEN READINGS = VALIDATION', C.green));
  await until(S(12)); await play(...say('A VERY SIMPLE PREDICTION RULE', C.cyan));
  await until(S(13)); await play(...fbox(['RULE: a hidden sensor gets', ['the nearest visible reading', C.green]], C.green));

  // 14-20 a random draw: B and D
  const BAG = P ? [0, -2.25, 0] : [-3.3, -2.45, 0];
  const bag = new M.RoundedRectangle({ width: 2.3, height: 0.62, cornerRadius: 0.2, color: C.muted, strokeWidth: 2 }); bag.setFill(C.card, 0.95); bag.moveTo(BAG);
  const tags = NM.map((n, k) => T(n, 16, C.ink, true, true).moveTo([BAG[0] + (k - 1.5) * 0.48, BAG[1], 0]));
  const bagLab = T('bag', 13, C.muted); bagLab.moveTo([BAG[0] - 1.5, BAG[1], 0]);
  await until(S(14)); await play(new M.FadeIn(new M.VGroup(bag, bagLab, ...tags)), ...say('PICK 2 SENSORS BY CHANCE', C.pink));
  const lifted = [1, 3].map(k => { const t = T(NM[k], 16, C.pink, true, true); t.moveTo([tags[k].getCenter()[0], BAG[1] + 0.6, 0]); return t; });
  await until(S(15)); await play(new M.Transform(tags[1], lifted[0]), new M.Transform(tags[3], lifted[1]), new M.Indicate(sens[1], { color: C.pink }), new M.Indicate(sens[3], { color: C.pink }), ...say('DRAWN: B AND D', C.pink));
  let cards = [card(1), card(3)];
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(bag, bagLab, ...tags)), ...cards.map(c => new M.FadeIn(c, { shift: [0, -0.25, 0] })), ...say('COVER THE READINGS, KEEP THE POSITIONS', C.violet));
  const aAB = arrow(0, 1), aCD = arrow(2, 3);
  await until(S(17)); await play(new M.Create(aAB), ...say('NEAREST VISIBLE SENSOR TO B: A', C.green));
  const pB = predL(1, 18, C.cyan);
  await until(S(18)); await play(new M.FadeIn(pB), ...say('PREDICT 18 °C FOR B', C.cyan));
  await until(S(19)); await play(new M.Create(aCD), ...say('NEAREST VISIBLE SENSOR TO D: C', C.green));
  const pD = predL(3, 22, C.amber);
  await until(S(20)); await play(new M.FadeIn(pD), ...say('PREDICT 22 °C FOR D', C.amber));

  // 21-28 uncover and score
  await until(S(21)); await play(...cards.map(c => new M.FadeOut(c, { shift: [0, 0.3, 0] })), ...say('UNCOVER THE HIDDEN READINGS', C.violet));
  await until(S(22)); await play(new M.Indicate(temps[1], { color: C.green }), new M.Indicate(pB, { color: C.green }), ...say('B REALLY READS 18 °C: EXACT', C.green));
  await until(S(23)); await play(new M.Indicate(temps[3], { color: C.green }), new M.Indicate(pD, { color: C.green }), ...say('D REALLY READS 22 °C: EXACT', C.green));
  await until(S(24)); await play(...fbox(['absolute error =', ['  size of the gap', C.pink], '  |guess − real reading|'], C.pink), ...say('SIZE OF THE GAP = ABSOLUTE ERROR', C.pink));
  const gB = gapL(1, 0, C.green), gD = gapL(3, 0, C.green);
  await until(S(25)); await play(new M.FadeIn(gB), new M.FadeIn(gD), ...say('DRAW THE TWO GAPS', C.pink));
  await until(S(26)); await play(new M.Indicate(gB), new M.Indicate(gD), ...fbox(['B: |18 − 18| = 0', 'D: |22 − 22| = 0'], C.green), ...say('BOTH ERRORS: 0 °C', C.green));
  await until(S(27)); await play(...fbox(['B: |18 − 18| = 0', 'D: |22 − 22| = 0', ['mean = (0 + 0) ÷ 2 = 0', C.green]], C.green));
  await until(S(28)); await play(...say('MEAN ABSOLUTE ERROR (MAE) = 0 °C', C.green));
  const res1 = 'random B, D:  MAE 0 °C';

  // 29-35 the test the city cares about
  await until(S(29)); await play(...say('LOOKS GREAT, BUT IS IT THE RIGHT TEST?', C.amber));
  await until(S(30)); await play(new M.Indicate(ePoly, { color: C.amber }), ...say('CITY: A WHOLE DISTRICT WITH NO READINGS', C.amber));
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(aAB, aCD, pB, pD, gB, gD)), ...say('SHOW ALL READINGS, NEW TEST', C.cyan));
  await until(S(32)); await play(new M.Indicate(wPoly, { color: C.cyan }), new M.Indicate(ePoly, { color: C.amber }), ...fbox(['district = group of', ['nearby positions', C.violet], ['= a SPATIAL BLOCK', C.violet]], C.violet), ...say('EACH DISTRICT = A SPATIAL BLOCK', C.violet));
  cards = [card(2), card(3)];
  const shade = new M.Rectangle({ width: 270 * SX, height: DT - DB, color: C.violet, strokeWidth: 0 }); shade.setFill(C.violet, 0.14); shade.moveTo([px(335)[0], (DT + DB) / 2, 0]);
  await until(S(33)); await play(new M.FadeIn(shade), ...cards.map(c => new M.FadeIn(c, { shift: [0, -0.25, 0] })), ...say('COVER ALL OF EAST DISTRICT', C.violet));
  await until(S(34)); await play(new M.Indicate(shade, { color: C.violet }), ...say('HIDE A WHOLE BLOCK = SPATIAL BLOCK VALIDATION', C.violet));
  await until(S(35)); await play(new M.Indicate(sens[0], { color: C.green }), new M.Indicate(sens[1], { color: C.green }), ...say('C, D HIDDEN.  A, B VISIBLE', C.green));

  // 36-45 predict, uncover, score
  await until(S(36)); await play(...fbox(['SAME RULE: a hidden sensor gets', ['the nearest visible reading', C.green]], C.green));
  const aBC = arrow(1, 2), aBD = arrow(1, 3, 0.34);
  await until(S(37)); await play(new M.Create(aBC), ...say('NEAREST VISIBLE SENSOR TO C: B', C.green));
  const pC2 = predL(2, 18, C.cyan);
  await until(S(38)); await play(new M.FadeIn(pC2), ...say('PREDICT 18 °C FOR C', C.cyan));
  await until(S(39)); await play(new M.Create(aBD), ...say('NEAREST VISIBLE SENSOR TO D: ALSO B', C.green));
  const pD2 = predL(3, 18, C.cyan);
  await until(S(40)); await play(new M.FadeIn(pD2), ...say('PREDICT 18 °C FOR D', C.cyan));
  await until(S(41)); await play(...cards.map(c => new M.FadeOut(c, { shift: [0, 0.3, 0] })), ...say('UNCOVER THE REAL READINGS', C.violet));
  const gapBar = k => { const r = new M.Rectangle({ width: P ? 0.2 : 0.16, height: 4 * (P ? 0.13 : 0.12), color: C.pink, strokeWidth: 1 }); r.setFill(C.pink, 0.85);
    r.moveTo(P ? [px(EAST[k])[0], Y_G - 0.55, 0] : [px(EAST[k])[0] + 0.58, (Y_P + Y_G) / 2, 0]); return r; };
  const gC = gapL(2, 4, C.pink), gD2 = gapL(3, 4, C.pink), bC = gapBar(2), bD = gapBar(3);
  await until(S(42)); await play(new M.Indicate(temps[2], { color: C.pink }), new M.FadeIn(bC), new M.FadeIn(gC), ...fbox(['C: |18 − 22| = 4'], C.pink), ...say('C READS 22 °C: ERROR 4 °C', C.pink));
  await until(S(43)); await play(new M.Indicate(temps[3], { color: C.pink }), new M.FadeIn(bD), new M.FadeIn(gD2), ...fbox(['C: |18 − 22| = 4', 'D: |18 − 22| = 4'], C.pink), ...say('D READS 22 °C: ERROR 4 °C', C.pink));
  await until(S(44)); await play(...fbox(['C: |18 − 22| = 4', 'D: |18 − 22| = 4', ['4 + 4 = 8', C.pink]], C.pink));
  await until(S(45)); await play(...fbox(['C: |18 − 22| = 4', 'D: |18 − 22| = 4', '4 + 4 = 8', ['MAE = 8 ÷ 2 = 4 °C', C.pink]], C.pink), ...say('MEAN ABSOLUTE ERROR = 4 °C', C.pink));

  // 46-53 formula, comparison, lessons
  await until(S(46)); await play(...say('THE ERROR IN ONE SHORT FORMULA', C.cyan));
  await until(S(47)); await play(...fbox(['MAE =', ['  sum of absolute errors', C.pink], ['  ÷ number of predictions', C.cyan]], C.cyan));
  await until(S(48)); await play(...fbox(['each test: 2 hidden', 'same nearest-reading rule'], C.violet), ...say('SAME SIZE TEST, SAME RULE', C.violet));
  await until(S(49)); await play(...fbox([[res1, C.green], ['East block:   MAE 4 °C', C.pink]], C.amber), ...say('RANDOM: 0 °C   BLOCK: 4 °C', C.amber));
  await until(S(50)); await play(new M.Indicate(shade, { color: C.violet }), ...say('BLOCK TEST = AN AREA WITHOUT READINGS', C.green));
  await until(S(51)); await play(new M.Indicate(sens[0], { color: C.amber }), new M.Indicate(sens[2], { color: C.amber }), ...say('RANDOM HIDING CAN LOOK TOO GOOD', C.amber));
  await until(S(52)); await play(...say('4 SENSORS: NOT ENOUGH FOR THE WHOLE CITY', C.amber));
  await until(S(53)); await play(...say('BLOCK VALIDATION: HIDE A WHOLE GROUP TOGETHER', C.green));
}
