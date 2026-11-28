// 16.4.4 Variograms: how temperature differences change with distance.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  // street strip (top)
  const SX = P ? 0.0136 : 0.018, MX = P ? 0 : -2.0, SY = P ? 1.6 : 0.9;
  const ex = e => MX + (e - 200) * SX;
  // variogram graph (bottom)
  const GX0 = P ? -3.0 : -6.0, GY0 = P ? -3.2 : -2.9, GS = P ? 6.2 / 450 : 5.9 / 450, GV = P ? 0.25 : 0.2;
  const g = (d, v) => [GX0 + d * GS, GY0 + v * GV, 0];
  const BOXP = P ? [0, -4.85, 0] : [4.3, -0.3, 0];
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

  const NM = ['A', 'B', 'C', 'D'], EAST = [0, 100, 300, 400], TEMP = [18, 18, 22, 22];
  const tcol = t => t === 18 ? C.cyan : C.amber;

  // 0-1 the street and a spot without a sensor
  const street = new M.RoundedRectangle({ width: 500 * SX, height: 0.3, cornerRadius: 0.15, color: C.muted, strokeWidth: 1.5 });
  street.setFill(C.line, 0.6); street.moveTo([ex(200), SY, 0]);
  const qc = new M.Circle({ radius: 0.2, color: C.pink, strokeWidth: 2.5 }); qc.moveTo([ex(160), SY, 0]);
  const qt = T('?', 18, C.pink, true, true); qt.moveTo([ex(160), SY + 0.36, 0]);
  const spot = new M.VGroup(qc, qt);
  await until(S(0)); await play(new M.FadeIn(street), new M.FadeIn(spot), ...say('TEMPERATURE WHERE THERE IS NO SENSOR?', C.pink));
  await until(S(1)); await play(...say('TRUST NEARBY SENSORS MORE THAN FAR ONES?', C.violet));

  // 2-6 sensors and readings
  const sens = NM.map((n, k) => {
    const p = [ex(EAST[k]), SY, 0];
    const halo = new M.Dot({ point: p, radius: 0.23, color: C.green }); halo.setFill(C.green, 0.18);
    const d = new M.Dot({ point: p, radius: 0.1, color: C.green });
    const lab = T(n, 17, C.ink, true, true); lab.moveTo([p[0], SY + 0.34, 0]);
    return new M.VGroup(halo, d, lab);
  });
  await until(S(2)); await play(new M.FadeOut(spot), new M.LaggedStart(sens.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR 4 SENSORS', C.green));
  const temps = [];
  for (let k = 0; k < 4; k++) {
    await until(S(3 + k));
    const t = T(`${TEMP[k]}°`, 15, tcol(TEMP[k]), true); t.moveTo([ex(EAST[k]), SY - 0.36, 0]); temps.push(t);
    await play(new M.FadeIn(t), new M.Flash(sens[k].submobjects[1], { color: tcol(TEMP[k]) }), ...say(`SENSOR ${NM[k]}: ${TEMP[k]} °C`, tcol(TEMP[k])));
  }

  // pair brackets under the strip
  const BR = SY - 0.72, LV = 0.42;
  const bracket = (i, j, lvl, col, txt) => {
    const y = BR - lvl * LV, x1 = ex(EAST[i]), x2 = ex(EAST[j]);
    const l = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color: col, strokeWidth: 3 });
    const c1 = new M.Line({ start: [x1, y + 0.1, 0], end: [x1, y - 0.1, 0], color: col, strokeWidth: 3 });
    const c2 = new M.Line({ start: [x2, y + 0.1, 0], end: [x2, y - 0.1, 0], color: col, strokeWidth: 3 });
    const t = T(txt, 13, col, true); t.moveTo([(x1 + x2) / 2, y - 0.18, 0]);
    return new M.VGroup(l, c1, c2, t);
  };
  let shown = [];
  const swap = (...nw) => { const a = shown.length ? [new M.FadeOut(new M.VGroup(...shown))] : []; shown = nw; return [...a, ...nw.map(b => new M.Create(b))]; };

  // 7-10 pairs
  await until(S(7)); await play(...say('COMPARE TWO SENSORS AT A TIME', C.violet));
  await until(S(8)); await play(new M.Indicate(sens[0], { color: C.violet }), new M.Indicate(sens[1], { color: C.violet }), ...say('TWO SENSORS = A PAIR', C.violet));
  await until(S(9)); await play(...say('FOR EACH PAIR: THE DISTANCE', C.violet));
  await until(S(10)); await play(...say('AND THE TEMPERATURE DIFFERENCE', C.amber));

  // 11-21 three example pairs
  await until(S(11)); await play(new M.Indicate(sens[0], { color: C.cyan }), new M.Indicate(sens[1], { color: C.cyan }), ...say('PAIR A–B', C.cyan));
  await until(S(12)); await play(...swap(bracket(0, 1, 0, C.cyan, '100 m')), ...say('A–B: 100 m APART', C.cyan));
  await until(S(13)); await play(new M.Indicate(temps[0]), new M.Indicate(temps[1]), ...fbox([['A–B: 100 m', C.cyan], '18 − 18 = 0°'], C.cyan));
  await until(S(14)); await play(new M.Indicate(sens[2], { color: C.amber }), new M.Indicate(sens[3], { color: C.amber }), ...say('PAIR C–D', C.amber));
  await until(S(15)); await play(...swap(bracket(2, 3, 0, C.amber, '100 m')), ...say('C–D: ALSO 100 m APART', C.amber));
  await until(S(16)); await play(new M.Indicate(temps[2]), new M.Indicate(temps[3]), ...fbox([['C–D: 100 m', C.amber], '22 − 22 = 0°'], C.amber));
  await until(S(17)); await play(new M.Indicate(sens[1], { color: C.pink }), new M.Indicate(sens[2], { color: C.pink }), ...say('PAIR B–C', C.pink));
  await until(S(18)); await play(...swap(bracket(1, 2, 0, C.pink, '200 m')), ...fbox([['B–C: 200 m', C.pink], '18° and 22°'], C.pink), ...say('B–C: 200 m APART', C.pink));
  await until(S(19)); await play(new M.Indicate(temps[1]), new M.Indicate(temps[2]), ...say('18 °C AND 22 °C', C.pink));
  await until(S(20)); await play(...fbox([['B–C: 200 m', C.pink], '22 − 18 = 4°'], C.pink));
  await until(S(21)); await play(...swap(), ...fbox(['100 m pairs: 0° apart', ['200 m pair:  4° apart', C.pink]], C.green), ...say('CLOSER PAIRS → MORE SIMILAR', C.green));

  // 22-24 the graph
  const xAx = new M.Arrow({ start: g(0, 0), end: g(460, 0), color: C.muted, strokeWidth: 2.5 });
  const yAx = new M.Arrow({ start: g(0, 0), end: g(0, 10.5), color: C.muted, strokeWidth: 2.5 });
  await until(S(22)); await play(new M.Create(xAx), new M.Create(yAx), ...say('A PICTURE: DIFFERENCE VS DISTANCE'));
  const xt = [100, 200, 300, 400].map(d => T(String(d), 14, C.muted, true).moveTo([g(d, 0)[0], GY0 - 0.25, 0]));
  const xLab = T('distance (m)', 14, C.muted); xLab.moveTo([g(440, 0)[0] - 0.4, GY0 + 0.25, 0]);
  await until(S(23)); await play(new M.FadeIn(new M.VGroup(...xt, xLab)), ...say('ALONG THE BOTTOM: DISTANCE IN METERS'));
  const yt = [4, 8].map(v => T(String(v), 14, C.muted, true).moveTo([GX0 - 0.25, g(0, v)[1], 0]));
  let yLab = T('how different?', 14, C.amber); yLab.moveTo([GX0 + 1.05, g(0, 10.5)[1], 0]);
  await until(S(24)); await play(new M.FadeIn(new M.VGroup(...yt)), new M.FadeIn(yLab), ...say('UP THE SIDE: HOW DIFFERENT', C.amber));

  // 25-30 semivariance
  await until(S(25)); await play(...say('BIG DIFFERENCES COUNT MORE', C.amber));
  await until(S(26)); await play(...fbox([['1. square each difference', C.amber], '   4 × 4 = 16'], C.amber), ...say('NUMBER × ITSELF = SQUARING', C.amber));
  await until(S(27)); await play(...fbox(['1. square each difference', ['2. mean for pairs at', C.violet], ['   the same distance', C.violet]], C.violet));
  await until(S(28)); await play(...fbox(['1. square each difference', '2. mean at the same distance', ['3. take half', C.green]], C.green));
  await until(S(29)); await play(...fbox(['1. square each difference', '2. mean at the same distance', '3. take half', ['= SEMIVARIANCE', C.green]], C.green), ...say('THIS MEASURE = SEMIVARIANCE', C.green));
  const yLab2 = T('semivariance', 14, C.green); yLab2.moveTo([GX0 + 1.0, g(0, 10.5)[1], 0]);
  await until(S(30)); await play(new M.FadeOut(yLab), new M.FadeIn(yLab2), ...say('SEMIVARIANCE VS DISTANCE = VARIOGRAM', C.green));
  yLab = yLab2;
  await until(S(31)); await play(...say('BUILD IT: EACH PAIR COUNTED ONCE', C.cyan));

  // 32-35 100 m
  const vdot = (d, v, col) => { const halo = new M.Dot({ point: g(d, v), radius: 0.22, color: col }); halo.setFill(col, 0.2);
    const dt = new M.Dot({ point: g(d, v), radius: 0.1, color: col }); return new M.VGroup(halo, dt); };
  const vlab = (d, v, col) => T(`(${d}, ${v})`, 13, col, true).moveTo([g(d, v)[0], g(d, v)[1] + 0.32, 0]);
  await until(S(32)); await play(...swap(bracket(0, 1, 0, C.cyan, 'A–B 100 m: 0°'), bracket(2, 3, 0, C.cyan, 'C–D 100 m: 0°')),
    ...fbox([['100 m', C.cyan], 'A–B: 0°   C–D: 0°'], C.cyan), ...say('100 m: BOTH DIFFERENCES ARE 0', C.cyan));
  await until(S(33)); await play(...fbox([['100 m', C.cyan], '0 × 0 = 0   0 × 0 = 0'], C.cyan));
  await until(S(34)); await play(...fbox([['100 m', C.cyan], '0 × 0 = 0   0 × 0 = 0', ['half of mean 0 = 0', C.cyan]], C.cyan));
  const d1 = vdot(100, 0, C.cyan), l1 = vlab(100, 0, C.cyan);
  await until(S(35)); await play(new M.FadeIn(d1), new M.Flash(d1.submobjects[1], { color: C.cyan }), new M.FadeIn(l1), ...say('FIRST DOT: 100 m, HEIGHT 0', C.cyan));

  // 36-40 200 m
  await until(S(36)); await play(...swap(bracket(1, 2, 0, C.pink, 'B–C 200 m: 4°')), ...say('200 m: PAIR B–C', C.pink));
  await until(S(37)); await play(...fbox([['200 m', C.pink], 'B–C: 22 − 18 = 4°'], C.pink));
  await until(S(38)); await play(...fbox([['200 m', C.pink], 'B–C: 4°', '4 × 4 = 16'], C.pink));
  await until(S(39)); await play(...fbox([['200 m', C.pink], 'B–C: 4°', '4 × 4 = 16', ['half of 16 = 8', C.pink]], C.pink));
  const d2 = vdot(200, 8, C.pink), l2 = vlab(200, 8, C.pink);
  await until(S(40)); await play(new M.FadeIn(d2), new M.Flash(d2.submobjects[1], { color: C.pink }), new M.FadeIn(l2), ...say('NEXT DOT: 200 m, HEIGHT 8', C.pink));

  // 41-43 300 m
  await until(S(41)); await play(...swap(bracket(0, 2, 0, C.amber, 'A–C 300 m: 4°'), bracket(1, 3, 1, C.amber, 'B–D 300 m: 4°')), ...say('300 m: A–C AND B–D', C.amber));
  await until(S(42)); await play(...fbox([['300 m', C.amber], 'A–C: 4°   B–D: 4°', '4 × 4 = 16   4 × 4 = 16'], C.amber));
  const d3 = vdot(300, 8, C.amber), l3 = vlab(300, 8, C.amber);
  await until(S(43)); await play(new M.FadeIn(d3), new M.Flash(d3.submobjects[1], { color: C.amber }), new M.FadeIn(l3),
    ...fbox([['300 m', C.amber], '16, 16 → mean 16', ['half of 16 = 8', C.amber]], C.amber));

  // 44-45 400 m
  await until(S(44)); await play(...swap(bracket(0, 3, 0, C.violet, 'A–D 400 m: 4°')), ...say('400 m: A–D, DIFFERENCE 4°', C.violet));
  const d4 = vdot(400, 8, C.violet), l4 = vlab(400, 8, C.violet);
  await until(S(45)); await play(new M.FadeIn(d4), new M.Flash(d4.submobjects[1], { color: C.violet }), new M.FadeIn(l4),
    ...fbox([['400 m', C.violet], '4 × 4 = 16', ['half of 16 = 8', C.violet]], C.violet));

  // 46-49 the formula and the unit
  const vd = [d1, d2, d3, d4];
  await until(S(46)); await play(...swap(), new M.LaggedStart(vd.map(d => new M.Indicate(d)), { lagRatio: 0.2, runTime: 1.6 }), ...say('4 DOTS: DIFFERENCE GROWS WITH DISTANCE', C.green));
  await until(S(47)); await play(...say('THE CALCULATION IN ONE SHORT FORMULA', C.cyan));
  await until(S(48)); await play(...fbox(['semivariance =', ['  ½ × mean of (difference)²', C.green], '  at the chosen distance'], C.green));
  const unitLab = T('°C²', 15, C.violet, true, true); unitLab.moveTo([GX0 - 0.35, g(0, 10.5)[1], 0]);
  await until(S(49)); await play(new M.FadeIn(unitLab), new M.Flash(unitLab, { color: C.violet }), ...fbox(['°C × °C = °C²', ['squared degrees Celsius', C.violet]], C.violet), ...say('UNIT: °C², NOT °C', C.violet));

  // 50-53 meaning and a warning
  await until(S(50)); await play(new M.Indicate(d1, { color: C.green }), ...say('NEARBY SENSORS: MORE SIMILAR', C.green));
  await until(S(51)); await play(new M.LaggedStart(vd.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.4 }), ...say('HOW MUCH TO TRUST READINGS AT EACH DISTANCE'));
  await until(S(52)); await play(...fbox(['pairs per distance:', ['100 m: 2   200 m: 1', C.amber], ['300 m: 2   400 m: 1', C.amber]], C.amber), ...say('4 SENSORS = VERY FEW PAIRS', C.amber));
  await until(S(53)); await play(...say('VARIOGRAM: DIFFERENCE VS DISTANCE', C.green));
}
