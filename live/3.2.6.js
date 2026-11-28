// 3.2.6 Complete-case bias: the gaps are the hottest hours, so the complete-case mean is too cool.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const V = [18, 22, 28, 37, 40, 38, 32, 25];            // reference thermometer, 8:00 to 15:00
  const HOT = [3, 4, 5], CC = [0, 1, 2, 6, 7];            // sensor C: gaps above 35 °C, complete cases
  const HOURS = ['8', '9', '10', '11', '12', '1', '2', '3'];
  const TL = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00'];
  const CX = P ? 0 : -2.6, SP = P ? 0.8 : 0.85, BASE = P ? -4.85 : -2.35, U = P ? 0.165 : 0.122;
  const XL = CX - 4 * SP, XR = CX + 4 * SP;
  const PILL = P ? [0, 0.25, 0] : [CX, 1.85, 0];
  const BOXP = [4.5, -0.3, 0], BTOP = 4.25;               // laptop: box centre on the right; phone: box top edge
  const colx = k => CX + (k - 3.5) * SP, vy = v => BASE + (v - 15) * U;
  const at = (i, f) => S(i) + f * (E(i) - S(i));
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21, lh = P ? 0.4 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const wd = Math.max(...texts.map((t, i) => t.getWidth() + ind[i])) + 0.7, ht = rows.length * lh + 0.4;
    const c = P ? [0, BTOP - ht / 2, 0] : BOXP;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(c);
    const left = c[0] - wd / 2 + 0.35, top = c[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind[i] + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const boxRow = k => boxNow.submobjects[1 + k];

  // picture parts
  function dot(k, v, color) {
    const p = [colx(k), vy(v), 0];
    const halo = new M.Dot({ point: p, radius: 0.26, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: 0.11, color });
    const lab = T(String(v), P ? 15 : 17, color, true);
    if (v === 22 || v === 28 || v === 32) lab.moveTo([p[0] + 0.3 + lab.getWidth() / 2, p[1], 0]);   // beside the dot: clear of the 25/30/35° lines
    else lab.moveTo([p[0], p[1] + 0.38, 0]);
    return new M.VGroup(halo, d, lab);
  }
  function gap(k) {                                        // hollow dashed circle at the true value
    const x = colx(k), y = vy(V[k]), r = 0.2, n = 10, parts = [];
    for (let j = 0; j < n; j++) {
      const a0 = j * 2 * Math.PI / n, a1 = a0 + 0.6 * 2 * Math.PI / n;
      parts.push(new M.Line({ start: [x + r * Math.cos(a0), y + r * Math.sin(a0), 0], end: [x + r * Math.cos(a1), y + r * Math.sin(a1), 0], color: C.amber, strokeWidth: 3 }));
    }
    return new M.VGroup(...parts);
  }
  const hline = (v, color) => new M.DashedLine({ start: [XL, vy(v), 0], end: [XR, vy(v), 0], color });
  const tag = (s, v, color) => { const t = T(s, P ? 15 : 16, color, true); t.moveTo([XR + 0.34, vy(v), 0]); return t; };
  const arrow = () => new M.Arrow({ start: [colx(4), vy(30), 0], end: [colx(4), vy(25), 0], color: C.pink, buff: 0, strokeWidth: 4 });
  const minus5 = () => { const t = T('−5°', P ? 16 : 18, C.pink, true); t.moveTo([colx(4) + 0.45, vy(27.5), 0]); return t; };
  const row = k => `${TL[k].padStart(5)}  ${HOT.includes(k) ? ' —' : V[k] + ' °C'}`;
  const table8 = (ok, gp, mark = '') => TL.map((_, k) => HOT.includes(k) ? [row(k), gp] : [row(k) + mark, ok]);

  // 0-2 sensor C under the roof, and a reliable thermometer beside it
  const K = P ? 1.4 : 1.6, IX = P ? CX : 0, IY = P ? -3.0 : -1.8, FS = P ? 19 : 22;  // laptop: bigger, centred
  const roofY = x => IY + K * 1.6 - 0.9 * Math.abs(x - IX) / 2.2;
  const roof = [new M.Line({ start: [IX - K * 2.2, IY + K * 0.7, 0], end: [IX, IY + K * 1.6, 0], color: C.green, strokeWidth: 3 }),
    new M.Line({ start: [IX, IY + K * 1.6, 0], end: [IX + K * 2.2, IY + K * 0.7, 0], color: C.green, strokeWidth: 3 })];
  const roofLab = T('greenhouse roof', FS, C.green); roofLab.moveTo([IX, IY + K * 1.95, 0]);
  const SXc = IX - K * 0.75, TXc = IX + K * 0.75;
  const sWire = new M.Line({ start: [SXc, IY + K * 0.425, 0], end: [SXc, roofY(SXc), 0], color: C.muted, strokeWidth: 2 });
  const sBox = new M.RoundedRectangle({ width: K * 0.8, height: K * 0.55, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 }); sBox.setFill(C.card, 1); sBox.moveTo([SXc, IY + K * 0.15, 0]);
  const sLab = T('C', P ? 26 : 36, C.amber, true, true); sLab.moveTo([SXc, IY + K * 0.15, 0]);
  const sCap = T('sensor C', FS, C.amber); sCap.moveTo([SXc, IY - K * 0.6, 0]);
  const sensor = [sWire, sBox, sLab, sCap];
  const tWire = new M.Line({ start: [TXc, IY + K * 0.825, 0], end: [TXc, roofY(TXc), 0], color: C.muted, strokeWidth: 2 });
  const tube = new M.RoundedRectangle({ width: K * 0.24, height: K * 0.95, cornerRadius: K * 0.12, color: C.ink, strokeWidth: 2 }); tube.moveTo([TXc, IY + K * 0.35, 0]);
  const bulb = new M.Circle({ radius: K * 0.17, color: C.ink }); bulb.setFill(C.ink, 1); bulb.moveTo([TXc, IY - K * 0.2, 0]);
  const merc = new M.Line({ start: [TXc, IY - K * 0.05, 0], end: [TXc, IY + K * 0.55, 0], color: C.ink, strokeWidth: 5 });
  const tCap = T('thermometer', FS, C.ink); tCap.moveTo([TXc, IY - K * 0.6, 0]);
  const thermo = [tWire, tube, bulb, merc, tCap];

  await until(S(0)); await play(new M.LaggedStart([...roof, roofLab, ...sensor].map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: 1.6 }), ...say('SENSOR C: SILENT ABOVE 35 °C', C.amber));
  await until(S(1)); await play(new M.LaggedStart(thermo.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: 1.4 }), ...say('HOT DAY: A RELIABLE THERMOMETER', C.ink));
  await until(S(2)); await play(new M.Indicate(tube, { color: C.ink }), new M.Indicate(bulb, { color: C.ink }), ...say('JUST THIS ONCE: THE TRUE TEMPERATURE', C.ink));

  // 3 the time line: hours along the bottom, °C up the side
  const axis = new M.Line({ start: [XL, BASE, 0], end: [XR, BASE, 0], color: C.muted, strokeWidth: 3 });
  const grid = [20, 30, 40].map(g => new M.Line({ start: [XL, vy(g), 0], end: [XR, vy(g), 0], color: C.grid, strokeWidth: 1.5 }));
  const ylabs = [20, 30, 40].map(g => { const t = T(g + '°', P ? 14 : 16, C.muted, true); t.moveTo([XL - 0.36, vy(g), 0]); return t; });
  const xlabs = HOURS.map((s, k) => { const t = T(s, P ? 15 : 17, C.muted, true); t.moveTo([colx(k), BASE - 0.3, 0]); return t; });
  const unit = T('hour', 14, C.muted); unit.moveTo([XR + 0.36, BASE - 0.3, 0]);
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...roof, roofLab, ...sensor, ...thermo)), new M.Create(axis),
    new M.FadeIn(new M.VGroup(...grid, ...ylabs, ...xlabs, unit)), ...say('TRUE READINGS: 8 AM TO 3 PM', C.ink));

  // 4-6 the eight true readings, each when it is said
  const dots = V.map((v, k) => dot(k, v, C.ink));
  for (const [i, ks] of [[4, [0, 1, 2]], [5, [3, 4, 5]], [6, [6, 7]]]) {
    await until(S(i));
    for (let j = 0; j < ks.length; j++) {
      await until(at(i, j / ks.length));
      await play(new M.FadeIn(dots[ks[j]]), new M.Flash(dots[ks[j]].submobjects[1], { color: C.ink }));
    }
  }
  // 7 rise and fall
  await until(S(7)); await play(new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.3, runTime: 2.6 }), ...say('RISE TO A HOT PEAK, THEN FALL', C.ink));

  // 8-13 the true mean: running total, then divide by 8
  await until(S(8)); await play(...say('TRUE MEAN: FIRST THE TOTAL', C.ink), ...fbox(['true total', ['0', C.ink]], C.ink));
  const sumSteps = [[9, 0, [0, 1], '18 + 22 = 40'], [9, 0.5, [2], '40 + 28 = 68'], [10, 0, [3], '68 + 37 = 105'], [10, 0.5, [4], '105 + 40 = 145'],
    [11, 0, [5], '145 + 38 = 183'], [12, 0, [6], '183 + 32 = 215'], [12, 0.5, [7], '215 + 25 = 240']];
  for (const [i, f, ks, s] of sumSteps) {
    if (f === 0) await until(S(i)); else await until(at(i, f));
    await play(...ks.map(k => new M.Indicate(dots[k], { color: C.cyan })), ...fbox(['true total', [s, C.ink]], C.ink));
  }
  const truthLine = hline(30, C.ink), truthTag = tag('30°', 30, C.ink);
  await until(S(13)); await play(new M.Create(truthLine), new M.FadeIn(truthTag), ...fbox(['true total = 240', ['240 ÷ 8 = 30 °C', C.ink]], C.ink), ...say('TRUE MEAN = 30 °C', C.ink));

  // 14-16 what sensor C sent: the three hottest hours become gaps
  const cd = {}; CC.forEach(k => { cd[k] = dot(k, V[k], C.amber); });
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(...CC.map(k => dots[k]))), new M.LaggedStart(CC.map(k => new M.FadeIn(cd[k])), { lagRatio: 0.2, runTime: 1.4 }), ...say('WHAT SENSOR C SENT', C.amber));
  const thr = hline(35, C.pink), thrTag = tag('35°', 35, C.pink);
  await until(S(15)); await play(new M.Create(thr), new M.FadeIn(thrTag), ...say('ABOVE 35 °C AT 11, 12 AND 1', C.pink));
  await until(at(15, 0.55)); await play(new M.LaggedStart(HOT.map(k => new M.Indicate(dots[k], { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('SENSOR C SENT NOTHING', C.pink));
  const gp = {}; HOT.forEach(k => { gp[k] = gap(k); });
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(...HOT.map(k => dots[k]))), new M.LaggedStart(HOT.map(k => new M.Create(gp[k])), { lagRatio: 0.3, runTime: 1.6 }), ...say('GAP = HOLLOW DASHED CIRCLE', C.amber));

  // 17-19 the log table: complete cases, complete-case analysis
  await until(S(17)); await play(...fbox(table8(C.ink, C.pink), C.amber), ...say('WHAT DOES A BUSY ANALYST DO?', C.muted));
  await until(at(17, 0.55)); await play(...HOT.map(k => new M.Indicate(boxRow(k), { color: C.pink })), ...say('IGNORE GAPS, KEEP COMPLETE ROWS', C.amber));
  await until(S(18)); await play(...fbox(table8(C.green, C.muted, '  ✓'), C.green), ...say('COMPLETE CASE = ROW WITH NO GAP', C.green));
  await until(S(19)); await play(...fbox(CC.map(k => [row(k), C.green]), C.green), ...say('COMPLETE-CASE ANALYSIS: ONLY THOSE ROWS', C.green));

  // 20-23 the complete-case mean
  await until(S(20)); await play(...fbox(['complete cases', ['18, 22, 28, 32, 25', C.amber]], C.amber), ...say('SENSOR C’S COMPLETE CASES', C.amber));
  await until(at(20, 0.35)); await play(new M.LaggedStart(CC.map(k => new M.Indicate(cd[k], { color: C.ink })), { lagRatio: 0.35, runTime: Math.max(2, (E(20) - S(20)) * 0.6) }));
  const ccSteps = [[21, 0, [0, 1, 2], '18 + 22 + 28 = 68'], [21, 0.55, [6], '68 + 32 = 100'], [22, 0, [7], '100 + 25 = 125']];
  for (const [i, f, ks, s] of ccSteps) {
    if (f === 0) await until(S(i)); else await until(at(i, f));
    await play(...ks.map(k => new M.Indicate(cd[k], { color: C.ink })), ...fbox(['complete total', [s, C.amber]], C.amber));
  }
  const ccLine = hline(25, C.amber), ccTag = tag('25°', 25, C.amber);
  await until(S(23)); await play(new M.Create(ccLine), new M.FadeIn(ccTag), ...fbox(['complete total = 125', ['125 ÷ 5 = 25 °C', C.amber]], C.amber), ...say('COMPLETE-CASE MEAN = 25 °C', C.amber));

  // 24-25 five degrees too cool, because the gaps are the hottest hours
  await until(S(24)); await play(new M.Indicate(truthLine, { color: C.ink }), new M.Indicate(truthTag, { color: C.ink }), ...say('THE TRUTH: 30 °C', C.ink));
  const arr = arrow(), lab5 = minus5();
  await until(at(24, 0.45)); await play(new M.FadeIn(arr, { shift: [0, -0.15, 0] }), new M.FadeIn(lab5),
    ...fbox([['true mean     = 30', C.ink], ['complete-case = 25', C.amber], ['5 °C too cool', C.pink]], C.pink), ...say('5 DEGREES TOO COOL', C.pink));
  await until(S(25)); await play(...say('NOT A FAIR HANDFUL', C.pink));
  await until(at(25, 0.45)); await play(new M.LaggedStart(HOT.map(k => new M.Indicate(gp[k], { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('THE GAPS = THE HOTTEST HOURS', C.pink));

  // 26 class photo: the tallest step out
  const PH = P ? [0, 2.45, 0] : [4.5, -0.4, 0], GW = P ? 0.8 : 0.52, HS = [1.2, 1.6, 1.0, 1.9, 1.4, 1.8, 1.1], TALL = [1, 3, 5], STAY = [0, 2, 4, 6];
  const ground = PH[1] - 1.2;
  const frame = new M.RoundedRectangle({ width: 7 * GW + 0.5, height: 2.9, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 }); frame.setFill(C.card, 0.95); frame.moveTo(PH);
  const cap = T('class photo', 16, C.violet); cap.moveTo([PH[0], PH[1] + 1.15, 0]);
  const kids = HS.map((hh, k) => {
    const x = PH[0] + (k - 3) * GW;
    const body = new M.Rectangle({ width: 0.28, height: hh - 0.3, color: C.violet, strokeWidth: 1 }); body.setFill(C.violet, 0.8); body.moveTo([x, ground + (hh - 0.3) / 2, 0]);
    const head = new M.Circle({ radius: 0.13, color: C.violet }); head.setFill(C.violet, 1); head.moveTo([x, ground + hh - 0.13, 0]);
    return new M.VGroup(body, head);
  });
  const avgLine = hh => new M.DashedLine({ start: [PH[0] - 3.5 * GW - 0.1, ground + hh, 0], end: [PH[0] + 3.5 * GW + 0.1, ground + hh, 0], color: C.amber });
  const avgA = avgLine(10 / 7);
  await until(S(26)); await play(...boxOut(), new M.FadeIn(frame), new M.FadeIn(cap), new M.LaggedStart(kids.map(o => new M.FadeIn(o)), { lagRatio: 0.12, runTime: 1.2 }),
    new M.Create(avgA), ...say('CLASS PHOTO: TALLEST STEP OUT', C.violet));
  await until(at(26, 0.5)); await play(...TALL.map(k => new M.FadeOut(kids[k], { shift: [0, 0.5, 0] })), new M.Transform(avgA, avgLine(1.175)), ...say('THE CLASS LOOKS SHORTER', C.violet));

  // 27-28 bias: missing the truth the same way, again and again
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(frame, cap, ...STAY.map(k => kids[k]), avgA)), ...say('SAME WAY, AGAIN AND AGAIN = BIAS', C.violet));
  for (const f of [0.35, 0.55, 0.75]) {
    await until(at(27, f)); await play(new M.Indicate(arr, { color: C.pink, runTime: 0.8 }), new M.Indicate(lab5, { color: C.pink, runTime: 0.8 }));
  }
  await until(S(28)); await play(new M.Indicate(ccLine, { color: C.violet }), new M.Indicate(ccTag, { color: C.violet }), ...say('COMPLETE-CASE BIAS', C.violet));

  // 29-30 missing not at random: the heat caused the gaps
  await until(S(29)); await play(...say('LAST LESSON: MISSING NOT AT RANDOM', C.violet));
  await until(at(29, 0.6)); await play(new M.Indicate(thr, { color: C.pink }), new M.LaggedStart(HOT.map(k => new M.Indicate(gp[k], { color: C.pink })), { lagRatio: 0.3, runTime: 1.4 }), ...say('THE HEAT ITSELF CAUSED THE GAPS', C.pink));
  await until(S(30)); await play(new M.Indicate(arr, { color: C.pink }), new M.Indicate(lab5, { color: C.pink }), ...say('EXACTLY WHEN COMPLETE CASES GO WRONG', C.pink));

  // 31-32 coin-flip gaps: a fair handful, the mean only wobbles
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(ccLine, ccTag, arr, lab5, thr, thrTag)), ...say('IF THE GAPS WERE COIN FLIPS…', C.cyan));
  const c3 = dot(3, 37, C.amber), c5 = dot(5, 38, C.amber), g1 = gap(1), g6 = gap(6);
  await until(at(31, 0.5)); await play(new M.FadeOut(new M.VGroup(gp[3], gp[5], cd[1], cd[6])), new M.FadeIn(c3), new M.FadeIn(c5),
    new M.Create(g1), new M.Create(g6), ...say('COIN-FLIP GAPS: A FAIR HANDFUL', C.cyan));
  const cfLine = hline(29.2, C.cyan);
  await until(S(32)); await play(new M.Create(cfLine), ...fbox(['coin-flip tries', ['29.2   30.6   30.4', C.cyan], 'near 30, both sides'], C.cyan), ...say('WOBBLES A LITTLE, NO LEAN', C.cyan));

  // 33-34 back to the heat gaps: error = complete-case mean − true mean
  const cd1 = dot(1, 22, C.amber), cd6 = dot(6, 32, C.amber), g3 = gap(3), g5 = gap(5);
  const ccLine2 = hline(25, C.amber), ccTag2 = tag('25°', 25, C.amber), gapsNow = [g3, gp[4], g5];
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(cfLine, c3, c5, g1, g6)), new M.FadeIn(cd1), new M.FadeIn(cd6), new M.Create(g3), new M.Create(g5),
    new M.Create(ccLine2), new M.FadeIn(ccTag2), ...fbox(['error =', ['  complete-case mean', C.amber], ['  − true mean', C.ink]], C.violet), ...say('ERROR = COMPLETE-CASE − TRUE', C.violet));
  await until(S(34)); await play(...fbox(['error = 25 − 30', ['      = −5 °C', C.pink]], C.pink), ...say('25 − 30 = −5', C.pink));
  const arr2 = arrow(), lab52 = minus5();
  await until(at(34, 0.55)); await play(new M.FadeIn(arr2, { shift: [0, -0.15, 0] }), new M.FadeIn(lab52), ...say('MINUS = TOO LOW', C.pink));

  // 35-36 what it is for: can I drop rows with gaps?
  await until(S(35)); await play(...fbox(table8(C.ink, C.pink), C.green), ...say('CAN I SIMPLY DROP ROWS WITH GAPS?', C.green));
  await until(S(36)); await play(new M.LaggedStart(gapsNow.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }),
    ...HOT.map(k => new M.Indicate(boxRow(k), { color: C.amber })), ...say('ASK: IS THE GAP LINKED TO THE VALUE?', C.amber));

  // 37-38 the trap: a clean table, a crooked answer
  await until(S(37)); await play(...fbox([...CC.map(k => [row(k), C.ink]), ['mean = 25 °C', C.green]], C.green), ...say('TRAP: NO GAPS FEELS TRUSTWORTHY', C.pink));
  await until(S(38)); await play(...fbox([...CC.map(k => [row(k), C.ink]), ['mean  = 25 °C', C.pink], ['truth = 30 °C', C.ink]], C.pink),
    new M.Indicate(arr2, { color: C.pink }), new M.Indicate(lab52, { color: C.pink }), ...say('CLEAN TABLE, CROOKED ANSWER', C.pink));

  // 39 one sentence
  await until(S(39)); await play(...fbox(['drop rows with gaps?', ['by chance      → safe', C.green], ['linked to value → bias', C.pink]], C.green), ...say('SAFE ONLY WHEN GAPS HAPPEN BY CHANCE', C.green));
}
