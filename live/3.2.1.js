// 3.2.1 Validation rules: a rule says which values are possible (live version of script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const HOURS = [8, 9, 10, 11, 12, 13], LOGGED = [18, 21, 24, 27, 86, 31];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const neg = s => String(s).replace('-', '−');

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent (at most 3 lines)
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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const tally = (n, pass, brk) => fbox(['rule: −10 ≤ reading ≤ 60', `checked ${n} of 6`, [`pass ${pass}   break ${brk}`, brk ? C.pink : C.green]], C.green);

  // 0-1 the greenhouse, the plants, the sensor by the door
  const GH = P ? { x: 0, y: -2.7, w: 7.0, h: 4.6, roof: 1.4 } : { x: CX, y: -1.0, w: 5.4, h: 2.4, roof: 1.0 };
  const PS = P ? 1.6 : 1; // plant size
  const gl = GH.x - GH.w / 2, gr = GH.x + GH.w / 2, gb = GH.y - GH.h / 2, gt = GH.y + GH.h / 2;
  const walls = new M.Rectangle({ width: GH.w, height: GH.h, color: C.cyan, strokeWidth: 2 }); walls.setFill(C.cyan, 0.05); walls.moveTo([GH.x, GH.y, 0]);
  const roof = new M.Polygon({ vertices: [[gl - 0.2, gt, 0], [gr + 0.2, gt, 0], [GH.x, gt + GH.roof, 0]], color: C.cyan, strokeWidth: 2 }); roof.setFill(C.cyan, 0.05);
  const panes = [1, 2, 3].map(k => { const l = new M.Line({ start: [gl + k * GH.w / 4, gb, 0], end: [gl + k * GH.w / 4, gt, 0], color: C.cyan, strokeWidth: 1 }); l.setStrokeOpacity(0.35); return l; });
  const plant = x => {
    const stem = new M.Line({ start: [x, gb, 0], end: [x, gb + 1.1 * PS, 0], color: C.green, strokeWidth: 3 });
    const leaf1 = new M.Line({ start: [x, gb + 0.45 * PS, 0], end: [x - 0.28 * PS, gb + 0.68 * PS, 0], color: C.green, strokeWidth: 3 });
    const leaf2 = new M.Line({ start: [x, gb + 0.72 * PS, 0], end: [x + 0.28 * PS, gb + 0.95 * PS, 0], color: C.green, strokeWidth: 3 });
    const fruit = [[x + 0.17 * PS, gb + 0.42 * PS], [x - 0.17 * PS, gb + 0.88 * PS]].map(([a, b]) => { const t = new M.Circle({ radius: 0.1 * PS, color: C.amber }); t.setFill(C.amber, 0.9); t.moveTo([a, b, 0]); return t; });
    return new M.VGroup(stem, leaf1, leaf2, ...fruit);
  };
  const step = (GH.w - 2.4) / 3;
  const plants = [0, 1, 2, 3].map(k => plant(gl + 0.6 + k * step));
  const door = new M.Rectangle({ width: 0.7 * PS, height: 1.3 * PS, color: C.muted, strokeWidth: 2 }); door.moveTo([gr - 0.6 * PS, gb + 0.65 * PS, 0]);
  const knob = new M.Dot({ point: [gr - 0.4 * PS, gb + 0.65 * PS, 0], radius: 0.04 * PS, color: C.muted });
  const sensorBox = p => { const r = new M.RoundedRectangle({ width: 0.38, height: 0.26, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 1); r.moveTo(p); return r; };
  const sensorLed = p => new M.Dot({ point: p, radius: 0.05, color: C.cyan });
  const SP0 = [gr - 0.6 * PS, gb + 1.62 * PS, 0];
  const sBox = sensorBox(SP0), sLed = sensorLed(SP0);
  const sLab = T('sensor', 15, C.cyan); sLab.moveTo([SP0[0], SP0[1] + 0.35, 0]);

  await until(S(0));
  await play(new M.Create(walls), new M.Create(roof), new M.FadeIn(new M.VGroup(...panes)),
    new M.LaggedStart(plants.map(p => new M.FadeIn(p)), { lagRatio: 0.25, runTime: 1.6 }), ...say('A GREENHOUSE OF TOMATO PLANTS', C.green));
  await until(S(1));
  await play(new M.FadeIn(door), new M.FadeIn(knob), new M.FadeIn(sBox), new M.FadeIn(sLed), new M.FadeIn(sLab),
    new M.Flash(sLed, { color: C.cyan }), ...say('SENSOR BY THE DOOR: AIR TEMPERATURE'));

  // 2-12 the log: a table, one row per hour
  const TX = P ? 0.6 : CX, TY = P ? -2.3 : -0.5, RH = P ? 0.85 : 0.42, CW = P ? 1.8 : 1.6;
  const TS = P ? 22 : 18; // table text size
  const ttop = TY + 3.5 * RH, tbot = TY - 3.5 * RH, rowY = r => TY + (3 - r) * RH;
  const frame = new M.Rectangle({ width: 2 * CW, height: 7 * RH, color: C.cyan, strokeWidth: 2 }); frame.setFill(C.card, 0.6); frame.moveTo([TX, TY, 0]);
  const rules = [new M.Line({ start: [TX, ttop, 0], end: [TX, tbot, 0], color: C.cyan, strokeWidth: 1 }),
    new M.Line({ start: [TX - CW, ttop - RH, 0], end: [TX + CW, ttop - RH, 0], color: C.cyan, strokeWidth: 2 })];
  for (let k = 2; k < 7; k++) { const l = new M.Line({ start: [TX - CW, ttop - k * RH, 0], end: [TX + CW, ttop - k * RH, 0], color: C.muted, strokeWidth: 1 }); l.setStrokeOpacity(0.4); rules.push(l); }
  const hTime = T('time', TS, C.muted, false, true); hTime.moveTo([TX - CW / 2, rowY(0), 0]);
  const hTemp = T('°C', TS, C.muted, false, true); hTemp.moveTo([TX + CW / 2, rowY(0), 0]);
  const logLab = T('the log', P ? 19 : 17, C.cyan); logLab.moveTo([TX, ttop + 0.3, 0]);
  const times = HOURS.map((hr, k) => { const t = T(`${hr}:00`, TS, C.ink, true); t.moveTo([TX - CW / 2, rowY(k + 1), 0]); return t; });
  const temps = LOGGED.map((v, k) => { const t = T(String(v), TS, C.cyan, true); t.moveTo([TX + CW / 2, rowY(k + 1), 0]); return t; });
  const SP1 = P ? [-3.1, TY + 1.2, 0] : [-5.8, TY + 0.9, 0];
  const sBox2 = sensorBox(SP1), sLed2 = sensorLed(SP1);
  const sLab2 = T('sensor', 15, C.cyan); sLab2.moveTo([SP1[0], SP1[1] - 0.35, 0]);
  const arrow = new M.Arrow({ start: [SP1[0] + 0.3, SP1[1], 0], end: [TX - CW - 0.12, SP1[1], 0], color: C.cyan, strokeWidth: 2 });
  const hourly = T('every hour', 15, C.muted); hourly.moveTo([(SP1[0] + 0.3 + TX - CW - 0.12) / 2, SP1[1] + 0.25, 0]);

  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(walls, roof, ...panes, ...plants, door, knob, sLab)),
    new M.Transform(sBox, sBox2), new M.Transform(sLed, sLed2), new M.FadeIn(frame), new M.FadeIn(new M.VGroup(...rules, hTime, hTemp, logLab)));
  await play(new M.Create(arrow), new M.FadeIn(hourly), new M.FadeIn(sLab2), ...say('THE LOG: ONE READING EVERY HOUR'));
  await until(S(3));
  await play(new M.LaggedStart([new M.Indicate(hTime, { color: C.amber }), new M.Indicate(hTemp, { color: C.amber })], { lagRatio: 0.5, runTime: 1.6 }),
    ...say('EACH ROW: TIME + TEMPERATURE (°C)'));
  await until(S(4));
  await play(new M.Indicate(hTemp, { color: C.cyan }), ...fbox(['°C = degrees Celsius', ['water freezes at 0 °C', C.cyan]]), ...say('CELSIUS: USED IN MOST COUNTRIES'));
  await until(S(5)); await play(...boxOut(), ...say('HOW WARM DID IT GET THIS MORNING?', C.amber));
  await until(S(6));
  await play(new M.LaggedStart(times.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.6 }), ...say('8:00 TO 13:00', C.amber));
  const readRow = k => play(new M.FadeIn(temps[k]), new M.Indicate(times[k], { color: C.amber }));
  await until(S(7)); await readRow(0);
  await until(S(8)); await readRow(1);
  await until(S(9)); await readRow(2);
  await until(S(10)); await readRow(3);
  await until(S(11)); await readRow(4);
  await until(S(12)); await readRow(5);

  // 13-15 each reading becomes a dot on a time line
  const Y0 = P ? -5.6 : -2.45, U = P ? 0.07 : 0.0345, SPX = P ? 0.9 : 0.95, X8 = P ? -2.4 : -5.45;
  const AX = X8 - 0.6, XR = X8 + 6 * SPX + 0.45;
  const tx = hr => X8 + (hr - 8) * SPX, yv = v => Y0 + (v + 10) * U;
  const xAxis = new M.Line({ start: [AX, Y0, 0], end: [XR, Y0, 0], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: [AX, Y0, 0], end: [AX, yv(92), 0], color: C.muted, strokeWidth: 2 });
  const yLab = {}, axisParts = [];
  for (const v of [-10, 0, 30, 60, 90]) {
    axisParts.push(new M.Line({ start: [AX - 0.07, yv(v), 0], end: [AX + 0.07, yv(v), 0], color: C.muted }));
    yLab[v] = T(neg(v), 15, C.muted, true); yLab[v].moveTo([AX - 0.35, yv(v), 0]); axisParts.push(yLab[v]);
  }
  for (const hr of HOURS) {
    axisParts.push(new M.Line({ start: [tx(hr), Y0 - 0.06, 0], end: [tx(hr), Y0 + 0.06, 0], color: C.muted }));
    const t = T(`${hr}:00`, 15, C.muted, true); t.moveTo([tx(hr), Y0 - 0.3, 0]); axisParts.push(t);
  }
  const unitC = T('°C', 15, C.muted); unitC.moveTo([AX + 0.35, yv(92), 0]); axisParts.push(unitC);

  const dotParts = (hr, v, color = C.cyan, text = String(v)) => {
    const p = [tx(hr), yv(v), 0];
    const halo = new M.Dot({ point: p, radius: 0.24, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    const lab = T(text, P ? 15 : 17, color, true); lab.moveTo([p[0], p[1] + 0.36, 0]);
    return [halo, d, lab];
  };
  const dots = HOURS.map((hr, k) => new M.VGroup(...dotParts(hr, LOGGED[k])));
  const seg = (a, b) => { const l = new M.Line({ start: [a[0], a[1], -0.01], end: [b[0], b[1], -0.01], color: C.cyan, strokeWidth: 2 }); l.setStrokeOpacity(0.5); return l; };
  const pts = HOURS.map((hr, k) => [tx(hr), yv(LOGGED[k])]);
  const segs = pts.slice(1).map((p, k) => seg(pts[k], p));

  await until(S(13));
  await play(new M.FadeOut(new M.VGroup(frame, ...rules, hTime, hTemp, logLab, ...times, ...temps, sBox, sLed, sLab2, arrow, hourly)),
    new M.Create(xAxis), new M.Create(yAxis), new M.FadeIn(new M.VGroup(...axisParts)), ...say('EACH READING = ONE DOT'));
  await play(new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 1.6 }));
  await until(S(14));
  await play(new M.LaggedStart(segs.map(l => new M.Create(l)), { lagRatio: 0.6, runTime: 2.0 }), ...say('THEY CLIMB GENTLY… THEN ONE JUMPS', C.amber));
  await play(new M.Flash(dots[4].submobjects[1], { color: C.amber }), new M.Indicate(dots[4], { color: C.amber }));
  await until(S(15)); await play(new M.Indicate(dots[4], { color: C.amber }), ...say('86 °C WOULD COOK THE TOMATOES!', C.amber));

  // 16-21 the allowed range and the rule
  await until(S(16));
  await play(new M.Indicate(yLab[-10], { color: C.green }), new M.Indicate(yLab[60], { color: C.green }),
    ...fbox(['the sensor maker says:', ['it measures −10 to 60 °C', C.green]], C.green), ...say('THE SENSOR MEASURES −10 TO 60', C.green));
  const lim60 = new M.DashedLine({ start: [AX, yv(60), 0], end: [XR, yv(60), 0], color: C.amber });
  await until(S(17)); await play(new M.Create(lim60), new M.Indicate(yLab[60], { color: C.amber }), ...say('ABOVE 60: CANNOT BE REAL', C.amber));
  const band = new M.Rectangle({ width: XR - AX, height: 70 * U, color: C.green, strokeWidth: 1 });
  band.setFill(C.green, 0.12); band.moveTo([(AX + XR) / 2, yv(25), -0.01]);
  const bandLab = T('allowed range', 15, C.green); bandLab.moveTo([AX + 0.9, yv(60) - 0.22, 0]);
  await until(S(18)); await play(new M.FadeIn(band), new M.FadeIn(bandLab), ...say('ALLOWED RANGE: −10 TO 60', C.green));
  await until(S(19)); await play(...fbox(['rule: a reading must be', ['between −10 and 60', C.green]], C.green), ...say('A RULE: INSIDE THE BAND', C.green));
  await until(S(20)); await play(...fbox(['validation rule', ['−10 ≤ reading ≤ 60', C.green]], C.green), ...say('VALIDATION RULE: SAYS WHAT IS POSSIBLE', C.green));
  await until(S(21));
  await play(...fbox([['✓ reading in −10 … 60', C.green], ['✓ every row has a time', C.violet], ['✓ reading is a number', C.violet]], C.violet),
    ...say('OTHER RULES CHECK OTHER THINGS', C.violet));

  // 22-26 check every row against the rule
  const marks = HOURS.map((hr, k) => { const ok = LOGGED[k] <= 60; const t = T(ok ? '✓' : '✗', 20, ok ? C.green : C.pink, false, true); t.moveTo([tx(hr), yv(LOGGED[k]) - 0.4, 0]); return t; });
  await until(S(22)); await play(...tally(0, 0, 0), ...say('CHECK EVERY ROW, ONE AT A TIME'));
  await until(S(23)); await play(new M.FadeIn(marks[0]), new M.Indicate(dots[0], { color: C.green }), ...tally(1, 1, 0), ...say('18: INSIDE THE BAND → PASS', C.green));
  await until(S(24));
  await play(new M.LaggedStart([1, 2, 3].map(k => new M.FadeIn(marks[k])), { lagRatio: 0.6, runTime: 2.2 }), ...tally(4, 4, 0), ...say('21, 24, 27: ALL PASS', C.green));
  await until(S(25));
  await play(new M.FadeIn(marks[4]), new M.Flash(dots[4].submobjects[1], { color: C.pink }), ...tally(5, 4, 1), ...say('86 > 60: IT BREAKS THE RULE', C.pink));
  await until(S(26)); await play(new M.FadeIn(marks[5]), new M.Indicate(dots[5], { color: C.green }), ...tally(6, 5, 1), ...say('31: IT PASSES', C.green));

  // 27 the pink flag
  const fx = tx(12) + 0.28, fy = yv(86);
  const tri = new M.Polygon({ vertices: [[fx, fy + 0.6, 0], [fx + 0.36, fy + 0.48, 0], [fx, fy + 0.36, 0]], color: C.pink, strokeWidth: 2 }); tri.setFill(C.pink, 0.9);
  const flag = new M.VGroup(new M.Line({ start: [fx, fy + 0.05, 0], end: [fx, fy + 0.6, 0], color: C.ink, strokeWidth: 2 }), tri);
  await until(S(27));
  for (const part of dots[4].submobjects.slice(0, 2)) part.setColor(C.pink);
  dots[4].submobjects[0].setFill(C.pink, 0.18); dots[4].submobjects[1].setFill(C.pink, 1);
  await play(new M.FadeIn(flag), ...say('FLAG = LOOK AT THIS ROW', C.pink));

  // 28-29 investigate the neighbours
  await until(S(28));
  await play(new M.LaggedStart([new M.Indicate(dots[3], { color: C.amber }), new M.Indicate(dots[5], { color: C.amber })], { lagRatio: 0.5, runTime: 1.6 }),
    ...say('NEIGHBOURS: JUST BEFORE AND AFTER', C.amber));
  const nbLine = new M.DashedLine({ start: [tx(11), yv(27), 0], end: [tx(13), yv(31), 0], color: C.amber });
  const ghost = new M.Circle({ radius: 0.2, color: C.amber }); ghost.moveTo([tx(12), yv(30), 0]);
  const ghostLab = T('≈ 30', 15, C.amber, true); ghostLab.moveTo([tx(12), yv(30) - 0.42, 0]);
  await until(S(29));
  await play(new M.Create(nbLine), new M.Create(ghost), new M.FadeIn(ghostLab),
    ...fbox(['before  27', 'after   31', ['so the truth ≈ 30', C.amber]], C.amber), ...say('PROBABLY CLOSE TO 30', C.amber));

  // 30-34 the Fahrenheit row, converted step by step
  const lab86F = T('86 °F', P ? 15 : 17, C.pink, true); lab86F.moveTo([tx(12) - 0.18, fy + 0.36, 0]);
  await until(S(30));
  await play(new M.FadeOut(dots[4].submobjects[2]), new M.FadeIn(lab86F),
    ...fbox(['this row came from', 'a spare sensor', ['set to °F (Fahrenheit)', C.amber]], C.amber), ...say('SPARE SENSOR, SET TO FAHRENHEIT', C.amber));
  await until(S(31)); await play(...fbox(['°C = (°F − 32) × 5 ÷ 9']), ...say('SUBTRACT 32, THEN × 5, THEN ÷ 9'));
  await until(S(32)); await play(...fbox(['(86 − 32) × 5 ÷ 9', ['86 − 32 = 54', C.amber]]));
  await until(S(33)); await play(...fbox(['(86 − 32) × 5 ÷ 9', '86 − 32 = 54', ['54 × 5 = 270', C.amber]]));
  await until(S(34)); await play(...fbox(['86 − 32 = 54', '54 × 5 = 270', ['270 ÷ 9 = 30 °C', C.amber]], C.amber));

  // 35-36 it fits; correct the row and note the change
  await until(S(35));
  await play(new M.LaggedStart([new M.Indicate(dots[3], { color: C.green }), new M.Indicate(ghost, { color: C.green }), new M.Indicate(dots[5], { color: C.green })], { lagRatio: 0.5, runTime: 2.0 }),
    ...say('27 < 30 < 31: IT FITS', C.green));
  const [fh, fd, fl] = dotParts(12, 30);
  const note = T('was 86 °F', 15, C.pink); note.moveTo([tx(12), yv(30) - 0.8, 0]);
  const fixMark = T('✓', 20, C.green, false, true); fixMark.moveTo([tx(12), yv(30) - 0.4, 0]);
  const fixPt = [tx(12), yv(30)];
  await until(S(36));
  await play(new M.Transform(dots[4].submobjects[0], fh), new M.Transform(dots[4].submobjects[1], fd),
    new M.Transform(segs[3], seg(pts[3], fixPt)), new M.Transform(segs[4], seg(fixPt, pts[5])),
    new M.FadeOut(new M.VGroup(lab86F, flag, marks[4], ghost, ghostLab, nbLine)), new M.FadeIn(fl), new M.FadeIn(note), new M.FadeIn(fixMark),
    ...fbox(['12:00   86 → 30 °C', ['note: °F row, converted', C.muted]]), ...say('CORRECT TO 30, NOTE THE CHANGE'));

  // 37-39 the definition, the rule in words, what it is for
  await until(S(37));
  await play(...fbox(['validation rule = a test', 'every value must pass,', ['written before results', C.green]], C.green), ...say('WRITTEN BEFORE YOU LOOK AT RESULTS', C.green));
  await until(S(38));
  await play(new M.Indicate(bandLab, { color: C.green }), ...fbox(['valid if', ['reading ≥ −10', C.green], ['and reading ≤ 60', C.green]], C.green), ...say('OUR RULE, IN WORDS', C.green));
  await until(S(39));
  await play(...fbox(['catch it early,', 'before it spoils', ['an average or a chart', C.amber]], C.green), ...say('CATCHES IMPOSSIBLE VALUES EARLY', C.green));

  // 40-42 the trap: a wrong value that looks possible
  await until(S(40));
  await play(...fbox(['a rule catches only', ['values that look impossible', C.amber]], C.amber), ...say('TRAP: ONLY IMPOSSIBLE-LOOKING VALUES', C.amber));
  const wiP = [tx(14), yv(50), 0];
  const wiHalo = new M.Dot({ point: wiP, radius: 0.24, color: C.violet }); wiHalo.setFill(C.violet, 0.18);
  const wiDot = new M.Dot({ point: wiP, radius: 0.1, color: C.violet });
  const wiLab = T('50', P ? 15 : 17, C.violet, true); wiLab.moveTo([wiP[0] - 0.42, wiP[1], 0]);
  const whatLab = T('what if?', 15, C.violet); whatLab.moveTo([tx(14), Y0 - 0.3, 0]);
  const wiMark = T('✓', 20, C.green, false, true); wiMark.moveTo([wiP[0] + 0.38, wiP[1], 0]);
  await until(S(41));
  await play(new M.LaggedStart([new M.FadeIn(whatLab), new M.FadeIn(new M.VGroup(wiHalo, wiDot, wiLab)), new M.FadeIn(wiMark)], { lagRatio: 0.5, runTime: 2.0 }),
    ...fbox(['what if a °F reading', 'of 50 slipped in?', ['−10 ≤ 50 ≤ 60  ✓ passes', C.green]], C.violet), ...say('50 IS INSIDE THE BAND: IT PASSES', C.green));
  const wiGhost = new M.Circle({ radius: 0.2, color: C.amber }); wiGhost.moveTo([tx(14), yv(10), 0]);
  const wiArrow = new M.Arrow({ start: [tx(14), yv(50) - 0.28, 0], end: [tx(14), yv(10) + 0.24, 0], color: C.amber, strokeWidth: 2 });
  const wiTrue = T('= 10 °C', 15, C.amber, true); wiTrue.moveTo([tx(14) - 0.62, yv(10), 0]);
  await until(S(42));
  await play(new M.Create(wiArrow), new M.Create(wiGhost), new M.FadeIn(wiTrue),
    ...fbox(['50 °F is really 10 °C', ['the rule cannot see it', C.pink]], C.pink), ...say('THE RULE CANNOT SEE THIS MISTAKE', C.pink));

  // 43-44 a flag means check, not delete; the one-sentence summary
  await until(S(43));
  await play(new M.FadeOut(new M.VGroup(wiHalo, wiDot, wiLab, whatLab, wiMark, wiGhost, wiArrow, wiTrue)),
    ...fbox(['flag = check, not delete', ['86 was a real reading,', C.pink], ['in the wrong unit', C.pink]], C.pink), ...say('FLAG = CHECK, NOT DELETE', C.pink));
  await play(new M.Indicate(note, { color: C.pink }), new M.Indicate(dots[4].submobjects[1], { color: C.pink }));
  await until(S(44));
  await play(new M.Indicate(bandLab, { color: C.green }), new M.Indicate(dots[4].submobjects[1], { color: C.green }),
    ...fbox(['a validation rule flags', 'values that cannot be true', ['→ a person checks them', C.green]], C.green), ...say('FLAG THE IMPOSSIBLE → A PERSON CHECKS', C.green));
}
