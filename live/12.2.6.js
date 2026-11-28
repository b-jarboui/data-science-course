// lesson 12.2.6
// Cyclic features: months on a clock, two numbers (across = sin, up = cos). Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;
  const PILL = P ? [0, 2.12, 0] : [0, 2.03, 0];
  let BOXP = P ? [0, 3.38, 0] : [0, -2.45, 0], BOXW = P ? FW - 1.1 : 10.8, BOXH = P ? 1.6 : 1.1;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const txt = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const rect = (w, h, pos, color, fill = C.card, op = 0.95, sw = 2) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: sw }); r.setFill(fill, op); r.moveTo(pos); return r; };
  const line = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dash = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const dot = (p, color, r = 0.09) => { const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d; };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x, { runTime: 0.45 }));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x, { runTime: 0.3 }));
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.25 })] : [];
    boxNow = null; if (!lines) return a;
    const size = P ? 21 : 20, lh = P ? 0.4 : 0.36;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = rect(wd, ht, BOXP, color);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, BOXW / wd, BOXH / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP); a.push(new M.FadeIn(g, { runTime: 0.35 })); boxNow = g; return a;
  }
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic.filter(x => !n.includes(x)), ...mk.filter(x => !n.includes(x))), ...fin(...n.filter(x => !pic.includes(x) && !mk.includes(x)))]; pic = n; mk = []; return a; };
  const addPic = (...o) => { pic.push(...o.filter(Boolean)); return fin(...o); };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk.filter(x => !n.includes(x))), ...fin(...n.filter(x => !mk.includes(x)))]; mk = n; return a; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---- 0-6 four bikes and their months ----
  const BK = [['Bike 1', 'March', C.cyan], ['Bike 2', 'June', C.amber], ['Bike 3', 'December', PINK], ['Bike 4', 'January', C.cyan]];
  const bpos = k => P ? [(k % 2 ? 1 : -1) * 1.85, 0.6 - Math.floor(k / 2) * 1.5, 0] : [(k - 1.5) * 3.0, 0.1, 0];
  const bcards = BK.map(([n, , c], k) => { const p = bpos(k); return new M.VGroup(rect(P ? 3.4 : 2.7, 1.2, p, c), txt(n, 19, c, [p[0], p[1] + 0.28, 0])); });
  const bmon = BK.map(([, m], k) => { const p = bpos(k); return txt(`posted: ${m}`, 16, C.ink, [p[0], p[1] - 0.22, 0], true); });
  const bx = P ? 0 : 0, by = P ? 0.2 : -0.2, wr = P ? 0.9 : 0.8;
  const bikePic = new M.VGroup(new M.Circle({ radius: wr, color: C.cyan, strokeWidth: 3 }).moveTo([bx - 1.5, by, 0]), new M.Circle({ radius: wr, color: C.cyan, strokeWidth: 3 }).moveTo([bx + 1.5, by, 0]),
    line([bx - 1.5, by, 0], [bx - 0.6, by + 1.0, 0], C.ink, 4), line([bx - 0.6, by + 1.0, 0], [bx + 0.9, by + 1.0, 0], C.ink, 4), line([bx + 0.9, by + 1.0, 0], [bx - 0.1, by, 0], C.ink, 4),
    line([bx - 0.1, by, 0], [bx - 1.5, by, 0], C.ink, 4), line([bx - 0.1, by, 0], [bx - 0.6, by + 1.0, 0], C.ink, 4), line([bx + 1.5, by, 0], [bx + 0.75, by + 1.5, 0], C.ink, 4),
    rect(1.9, 0.6, [bx, by - (P ? 1.6 : 1.4), 0], C.amber), txt('FOR SALE', 20, C.amber, [bx, by - (P ? 1.6 : 1.4), 0], true));
  await until(S(0)); await play(...picture(bikePic), ...say('YOU WANT TO SELL YOUR BIKE', C.amber));
  await until(S(1)); await play(...fbox(['do prices change with', ['the time of year?', C.amber]], C.amber), ...say('DOES THE MONTH MATTER?', C.amber));
  await until(S(2)); await play(...picture(...bcards), ...fbox(['when did each training bike', ['appear on the website?', C.muted]]), ...say('THE MONTH EACH BIKE WAS POSTED'));
  for (let k = 0; k < 4; k++) {
    await until(S(3 + k)); await play(...addPic(bmon[k]), new M.Indicate(bcards[k].submobjects[1], { color: BK[k][2] }), ...say(`${BK[k][0].toUpperCase()}: ${BK[k][1].toUpperCase()}`, BK[k][2]));
  }

  // ---- 7-17 month as a number on a line ----
  const NY = P ? 0.0 : 0.3, NX0 = P ? -3.3 : -5.5, NS = P ? 0.6 : 1.0;
  const nx = m => NX0 + (m - 1) * NS;
  const nline = line([nx(1) - 0.2, NY, 0], [nx(12) + 0.2, NY, 0], C.muted, 3);
  const nticks = MON.map((_, k) => line([nx(k + 1), NY - 0.07, 0], [nx(k + 1), NY + 0.07, 0], C.muted));
  const nnum = MON.map((_, k) => txt(String(k + 1), P ? 17 : 18, C.amber, [nx(k + 1), NY - 0.32, 0], true));
  const nmon = MON.map((s, k) => txt(s, P ? 15 : 16, C.ink, [nx(k + 1), NY + 0.36, 0]));
  await until(S(7)); await play(...picture(), ...fbox(['give the model the month', ['as a number', C.amber]], C.amber), ...say('THE MONTH AS A NUMBER', C.amber));
  await until(S(8)); await play(...addPic(nline, ...nticks, ...nmon), ...say('A LINE WITH 12 PLACES'));
  await until(S(9)); await play(...addPic(...nnum.slice(0, 3)), ...fbox(['Jan = 1 · Feb = 2 · Mar = 3'], C.amber), ...say('JANUARY 1, FEBRUARY 2, MARCH 3', C.amber));
  await until(S(10)); await play(new M.LaggedStart(nnum.slice(3).map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.5 }), ...fbox(['… up to Dec = 12'], C.amber), ...say('… UNTIL DECEMBER = 12', C.amber));
  pic.push(...nnum.slice(3));
  const ring = (m, c) => { const r = new M.Circle({ radius: P ? 0.28 : 0.34, color: c, strokeWidth: 2.5 }); r.setFill(c, 0); r.moveTo([nx(m), NY + 0.32, 0]); return r; };
  await until(S(11)); await play(...marks(ring(1, C.cyan), ring(12, PINK)), ...say('LOOK AT DECEMBER AND JANUARY'));
  await until(S(12)); await play(...fbox(['12 − 1 = 11'], PINK), ...say('12 − 1 = 11', PINK));
  const brk = (a, b, y, c, s) => new M.VGroup(line([nx(a), y, 0], [nx(b), y, 0], c, 3), line([nx(a), y - 0.1, 0], [nx(a), y + 0.1, 0], c, 3), line([nx(b), y - 0.1, 0], [nx(b), y + 0.1, 0], c, 3), txt(s, P ? 15 : 17, c, [(nx(a) + nx(b)) / 2, y - 0.3, 0]));
  const b11 = brk(1, 12, NY - 0.9, PINK, '11 steps apart');
  await until(S(13)); await play(...marks(ring(1, C.cyan), ring(12, PINK), b11), ...say('DEC AND JAN: 11 STEPS APART', PINK));
  const b6 = brk(6, 12, NY - 1.7, C.amber, '6 steps');
  await until(S(14)); await play(...marks(ring(6, C.amber), ring(12, PINK), b11, b6), ...fbox(['Jun = 6', ['12 − 6 = 6 steps', C.amber]], C.amber), ...say('JUNE AND DECEMBER: 6 STEPS', C.amber));
  await until(S(15)); await play(...fbox(['Dec looks closer to Jun (6)', ['than to Jan (11)', PINK]], PINK), ...say('DECEMBER LOOKS CLOSER TO JUNE?', PINK));
  await until(S(16)); await play(...fbox(['but Dec ends,', ['and Jan begins next day', C.green]], C.green), ...say('BUT DECEMBER IS RIGHT BEFORE JANUARY', C.green));
  await until(S(17)); await play(...fbox(null), ...say('HOW CAN NUMBERS SHOW THAT?', C.amber));

  // ---- 18-27 the clock ----
  const CC = P ? [0, -1.9, 0] : [-3.0, -0.45, 0], R = P ? 2.35 : 1.4, LR = R + (P ? 0.4 : 0.38);
  const at = (m, r = R) => { const a = m * Math.PI / 6; return [CC[0] + r * Math.sin(a), CC[1] + r * Math.cos(a), 0]; };
  const circ = new M.Circle({ radius: R, color: C.muted, strokeWidth: 3 }); circ.setFill(C.card, 0.5); circ.moveTo(CC);
  const hdots = MON.map((_, k) => dot(at(k + 1), C.muted, 0.05));
  const hours = MON.map((_, k) => txt(String(k + 1), 17, C.muted, at(k + 1, LR), true));
  const mlabs = MON.map((s, k) => txt(s, P ? 16 : 15, k === 11 ? PINK : k === 0 ? C.cyan : C.ink, at(k + 1, LR)));
  if (!P) { BOXP = [3.6, -0.2, 0]; BOXW = 6.4; BOXH = 2.6; }
  await until(S(18)); await play(...picture(circ, ...hdots, ...hours), ...fbox(['a clock: 12 places', ['around the edge', C.muted]]), ...say('IMAGINE A CLOCK'));
  await until(S(19)); await play(...hours.flatMap(h => fout(h)), ...addPic(...mlabs), ...fbox(['12 hours → 12 months'], C.amber), ...say('HOURS BECOME MONTHS', C.amber));
  pic = pic.filter(o => !hours.includes(o));
  await until(S(20)); await play(new M.Indicate(mlabs[0], { color: C.cyan }), ...fbox(['January → 1 o’clock'], C.cyan), ...say('JANUARY AT 1 O’CLOCK'));
  await until(S(21)); await play(new M.LaggedStart(mlabs.slice(1).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 2.2 }), ...fbox(['… December → 12, at the top'], PINK), ...say('DECEMBER AT THE TOP', PINK));
  const chordDJ = () => line(at(12), at(1), C.green, 4), chordDJn = () => line(at(12), at(6), PINK, 3);
  await until(S(22)); await play(...marks(chordDJ(), dot(at(12), PINK), dot(at(1), C.cyan)), ...fbox(['Dec and Jan:', ['next to each other', C.green]], C.green), ...say('NOW DECEMBER AND JANUARY ARE NEIGHBOURS', C.green));
  await until(S(23)); await play(...marks(chordDJn(), dot(at(12), PINK), dot(at(6), C.amber)), ...fbox(['Dec and Jun:', ['opposite sides', PINK]], PINK), ...say('DECEMBER AND JUNE: OPPOSITE SIDES', PINK));
  await until(S(24)); await play(...marks(), new M.LaggedStart(mlabs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.15, runTime: 1.8 }), ...fbox(['… Nov → Dec → Jan → Feb …', ['every year again', C.amber]], C.amber), ...say('THE MONTHS GO ROUND AND ROUND', C.amber));
  await until(S(25)); await play(...fbox([['CYCLIC', C.amber], 'repeats like a circle'], C.amber), ...say('THIS IS CALLED CYCLIC', C.amber));
  await until(S(26)); await play(...fbox([['FEATURE', C.cyan], 'information we give the model']), ...say('FEATURE = INFORMATION FOR THE MODEL'));
  await until(S(27)); await play(...fbox(['circle → cyclic features', ['made from the month', C.amber]], C.amber), ...say('CYCLIC FEATURES FROM THE CIRCLE', C.amber));

  // ---- 28-39 across and up ----
  const AX = R + 0.1;
  const axA = line([CC[0] - AX, CC[1], 0], [CC[0] + AX, CC[1], 0], C.cyan, 2), axU = line([CC[0], CC[1] - AX, 0], [CC[0], CC[1] + AX, 0], C.violet, 2);
  await until(S(28)); await play(...addPic(axA, axU), ...fbox(['two number lines', ['crossing at the centre', C.muted]]), ...say('TWO LINES THROUGH THE CENTRE'));
  const rad = line(CC, at(12), C.amber, 3), radL = txt('1', 17, C.amber, [CC[0] - 0.2, CC[1] + R / 2, 0], true);
  await until(S(29)); await play(...marks(rad, radL), ...fbox(['centre → edge', ['= 1 unit', C.amber]], C.amber), ...say('CENTRE TO EDGE = 1 UNIT', C.amber));
  const acrossL = txt('across', 16, C.cyan, [CC[0] + R + 0.55, CC[1] - 0.32, 0]);
  await until(S(30)); await play(...marks(), ...addPic(acrossL), new M.Indicate(axA, { color: C.cyan }), ...fbox(['line 1: right or left?']), ...say('FIRST LINE: RIGHT OR LEFT'));
  const sA = [txt('+', 22, C.cyan, [CC[0] + R * 0.75, CC[1] + 0.2, 0], true), txt('−', 22, C.cyan, [CC[0] - R * 0.75, CC[1] + 0.2, 0], true)];
  await until(S(31)); await play(...addPic(...sA), ...fbox([['ACROSS', C.cyan], '+ on the right', '− on the left']), ...say('ACROSS: + RIGHT, − LEFT'));
  const upL = txt('up', 16, C.violet, [CC[0] + 0.45, CC[1] + R + 0.55, 0]);
  await until(S(32)); await play(...addPic(upL), new M.Indicate(axU, { color: C.violet }), ...fbox(['line 2: above or below?'], C.violet), ...say('SECOND LINE: ABOVE OR BELOW', C.violet));
  const sU = [txt('+', 22, C.violet, [CC[0] + 0.22, CC[1] + R * 0.72, 0], true), txt('−', 22, C.violet, [CC[0] + 0.22, CC[1] - R * 0.72, 0], true)];
  await until(S(33)); await play(...addPic(...sU), ...fbox([['UP', C.violet], '+ above', '− below'], C.violet), ...say('UP: + ABOVE, − BELOW', C.violet));
  const coords = [];
  const cbox = (extra, color = C.amber) => fbox([...coords, ...extra], color);
  const pD = dot(at(12), PINK);
  coords.push(['Dec: across 0, up 1', PINK]);
  await until(S(34)); await play(...addPic(pD), ...cbox([]), ...say('DECEMBER: ACROSS 0, UP 1', PINK));
  const J = at(1), pJ = dot(J, C.cyan);
  const jA = dash(J, [J[0], CC[1], 0], C.cyan), jAv = txt('0.5', 15, C.cyan, [J[0], CC[1] - 0.25, 0], true);
  await until(S(35)); await play(...addPic(pJ), ...marks(jA, jAv), ...cbox([['Jan: across 0.5', C.cyan]], C.cyan), ...say('JANUARY: ACROSS 0.5'));
  const jU = dash(J, [CC[0], J[1], 0], C.violet), jUv = txt('0.87', 15, C.violet, [CC[0] - 0.4, J[1], 0], true);
  coords.push(['Jan: across 0.5, up 0.87', C.cyan]);
  await until(S(36)); await play(...marks(jA, jAv, jU, jUv), ...cbox([], C.cyan), ...say('UP ≈ 0.87', C.violet));
  const pM = dot(at(3), C.green); coords.push(['Mar: across 1, up 0', C.green]);
  await until(S(37)); await play(...marks(), ...addPic(pM), ...cbox([], C.green), ...say('MARCH: ACROSS 1, UP 0', C.green));
  const pJn = dot(at(6), C.amber); coords.push(['Jun: across 0, up −1', C.amber]);
  await until(S(38)); await play(...addPic(pJn), ...cbox([]), ...say('JUNE: ACROSS 0, UP −1', C.amber));
  await until(S(39)); await play(...fbox(['one month → two numbers', ['(across, up)', C.amber]], C.amber), ...say('TWO NUMBERS PER MONTH', C.amber));

  // ---- 40-43 distances ----
  await until(S(40)); await play(...marks(chordDJ()), ...fbox(['straight line', ['Dec → Jan', C.green]], C.green), ...say('A STRAIGHT LINE: DECEMBER TO JANUARY', C.green));
  await until(S(41)); await play(...fbox(['Dec → Jan', ['≈ 0.52 units', C.green]], C.green), ...say('ABOUT 0.52 UNITS', C.green));
  await until(S(42)); await play(...marks(chordDJ(), chordDJn()), ...fbox(['Dec → Jan ≈ 0.52', ['Dec → Jun = 2', PINK]], PINK), ...say('DECEMBER TO JUNE: 2 UNITS', PINK));
  await until(S(43)); await play(...fbox(['0.52 < 2', ['Jan is closer to Dec ✓', C.green]], C.green), ...say('JANUARY IS NOW CLOSER TO DECEMBER', C.green));

  // ---- 44-50 the formula ----
  await until(S(44)); await play(...marks(), ...fbox(null), ...say('THE TWO NUMBERS WITHOUT DRAWING?', C.amber));
  await until(S(45)); await play(new M.LaggedStart(mlabs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.15, runTime: 1.8 }), ...fbox(['a full turn = 360°'], C.amber), ...say('A FULL TURN = 360 DEGREES', C.amber));
  const arcPts = (deg, r) => Array.from({ length: 13 }, (_, k) => { const a = deg * k / 12 * Math.PI / 180; return [CC[0] + r * Math.sin(a), CC[1] + r * Math.cos(a), 0]; });
  const arcOf = (deg, r, c) => { const p = arcPts(deg, r); return new M.VGroup(...p.slice(1).map((q, k) => line(p[k], q, c, 3))); };
  await until(S(46)); await play(...marks(line(CC, at(12), C.amber, 2), line(CC, at(1), C.amber, 2), arcOf(30, R * 0.45, C.amber), txt('30°', 15, C.amber, at(0.5, R * 0.62), true)),
    ...fbox(['360° ÷ 12 = 30°', ['per month', C.amber]], C.amber), ...say('EACH MONTH = 30 DEGREES', C.amber));
  await until(S(47)); await play(...marks(line(CC, at(12), C.amber, 2), line(CC, at(3), C.amber, 2), arcOf(90, R * 0.4, C.amber), txt('angle', 15, C.amber, at(1.5, R * 0.62))),
    ...fbox(['angle = turn clockwise', 'from the top'], C.amber), ...say('THE TURN FROM THE TOP = THE ANGLE', C.amber));
  await until(S(48)); await play(...fbox(['angle = month × 30°', ['Mar: 3 × 30° = 90°', C.green]], C.amber), ...say('ANGLE = MONTH × 30°', C.amber));
  await until(S(49)); await play(...fbox(['two maths rules:', ['sine and cosine', C.violet]], C.violet), ...say('SINE AND COSINE', C.violet));
  await until(S(50)); await play(...fbox([['across = sin(angle)', C.cyan], ['up     = cos(angle)', C.violet], ['Mar: sin 90° = 1, cos 90° = 0', C.green]], C.violet), ...say('ACROSS = SIN, UP = COS', C.violet));

  // ---- 51-54 keep both numbers ----
  const N = at(11), pN = dot(N, C.amber);
  const same = dash([N[0] - 0.15, N[1], 0], [J[0] + 0.15, J[1], 0], PINK);
  await until(S(51)); await play(...marks(pN, same, txt('up 0.87', 15, PINK, [CC[0], J[1] + 0.25, 0], true)), ...fbox(['Jan: up 0.87', 'Nov: up 0.87', ['same up number!', PINK]], PINK), ...say('JAN AND NOV: SAME UP NUMBER', PINK));
  await until(S(52)); await play(...fbox(['only “up”: Jan = Nov ✗', ['across: Jan +0.5, Nov −0.5', C.cyan]], C.cyan), ...say('KEEP ACROSS TOO', C.cyan));
  await until(S(53)); await play(...marks(), ...fbox(['repeating patterns:', ['months · weekdays · hours', C.amber]], C.amber), ...say('MONTHS, WEEKDAYS, HOURS', C.amber));
  await until(S(54)); await play(new M.LaggedStart(mlabs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.15, runTime: 1.8 }), ...fbox(['repeats in a circle?', ['use two numbers', C.green], ['neighbours stay close', C.green]], C.green), ...say('A CIRCLE? USE TWO NUMBERS', C.green));
}
