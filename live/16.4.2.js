// 16.4.2 Spatial joins: copy a district name to each sensor row by position.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SX = P ? 0.0136 : 0.013, MX = P ? 0 : -3.3, MY = P ? 0.6 : -0.4;
  const px = (e, n = 100) => [MX + (e - 200) * SX, MY + (n - 100) * SX, 0];
  const BOXP = P ? [0, -5.85, 0] : [3.7, -2.45, 0];
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
    const maxw = P ? FW - 1.0 : 5.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  const SENS = [['A', 0, 18], ['B', 100, 18], ['C', 300, 22], ['D', 400, 22]];
  const tcol = t => t === 18 ? C.cyan : C.amber;

  // 0-3 the map and two districts
  const street = new M.RoundedRectangle({ width: 500 * SX, height: 0.36, cornerRadius: 0.18, color: C.muted, strokeWidth: 1.5 });
  street.setFill(C.line, 0.6); street.moveTo(px(200));
  const frame = new M.Rectangle({ width: 500 * SX, height: 200 * SX, color: C.muted, strokeWidth: 1.5 }); frame.moveTo(px(200, 100));
  await until(S(0)); await play(new M.FadeIn(frame), new M.FadeIn(street), ...say('TEMPERATURES IN DIFFERENT PARTS OF THE CITY'));
  const divider = new M.Line({ start: px(200, 0), end: px(200, 200), color: C.muted, strokeWidth: 2 });
  await until(S(1)); await play(new M.Create(divider), ...say('2 AREAS = 2 DISTRICTS', C.violet));
  const wFill = new M.Rectangle({ width: 250 * SX, height: 200 * SX, color: C.cyan, strokeWidth: 0 }); wFill.setFill(C.cyan, 0.08); wFill.moveTo(px(75, 100));
  const eFill = new M.Rectangle({ width: 250 * SX, height: 200 * SX, color: C.amber, strokeWidth: 0 }); eFill.setFill(C.amber, 0.08); eFill.moveTo(px(325, 100));
  const wLab = T('WEST', 18, C.cyan, true, true); wLab.moveTo(px(75, 178));
  const eLab = T('EAST', 18, C.amber, true, true); eLab.moveTo(px(325, 178));
  await until(S(2)); await play(new M.FadeIn(wFill), new M.FadeIn(wLab), ...say('LEFT: WEST DISTRICT', C.cyan));
  await until(S(3)); await play(new M.FadeIn(eFill), new M.FadeIn(eLab), ...say('RIGHT: EAST DISTRICT', C.amber));

  // 4-8 sensors and readings
  const mk = (nm, e) => {
    const p = px(e);
    const halo = new M.Dot({ point: p, radius: 0.25, color: C.green }); halo.setFill(C.green, 0.18);
    const d = new M.Dot({ point: p, radius: 0.11, color: C.green });
    const lab = T(nm, 18, C.ink, true, true); lab.moveTo([p[0], p[1] + 0.36, 0]);
    return new M.VGroup(halo, d, lab);
  };
  const sens = SENS.map(([nm, e]) => mk(nm, e));
  await until(S(4)); await play(new M.LaggedStart(sens.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.6 }), ...say('OUR 4 SENSORS AGAIN', C.green));
  const temps = [];
  for (let k = 0; k < 4; k++) {
    await until(S(5 + k));
    const [nm, e, t] = SENS[k], p = px(e);
    const lab = T(`${t}°`, 15, tcol(t), true); lab.moveTo([p[0], p[1] - 0.4, 0]);
    temps.push(lab);
    await play(new M.FadeIn(lab), new M.Flash(sens[k].submobjects[1], { color: tcol(t) }), ...say(`SENSOR ${nm}: ${t} °C`, tcol(t)));
  }
  await until(S(9)); await play(...say('WHICH DISTRICT DOES EACH READING BELONG TO?', C.violet));

  // 10-14 the table
  const TX = P ? 0 : 3.7, TY = P ? -1.35 : 0.9, RH = P ? 0.7 : 0.48;
  const COL = (P ? [-3.0, -1.75, -0.45, 0.85, 2.5] : [-2.5, -1.35, -0.2, 0.95, 2.25]).map(o => TX + o);
  const rowY = k => TY - RH * (k + 1);
  const TS = P ? 18 : 16; // table cell text size (bigger on phone)
  const head = ['sensor', 'east', 'north', '°C'].map((s, j) => T(s, P ? 16 : 15, C.muted, true).moveTo([COL[j], TY, 0]));
  const hline = new M.Line({ start: [COL[0] - 0.55, TY - RH / 2, 0], end: [COL[3] + 0.45, TY - RH / 2, 0], color: C.muted, strokeWidth: 1.5 });
  await until(S(10)); await play(new M.FadeIn(new M.VGroup(...head)), new M.Create(hline), ...say('A TABLE BESIDE THE MAP'));
  const names = SENS.map(([nm], k) => T(nm, TS + 1, C.ink, true, true).moveTo([COL[0], rowY(k), 0]));
  await until(S(11)); await play(new M.LaggedStart(names.map(n => new M.FadeIn(n)), { lagRatio: 0.2, runTime: 1.2 }), ...say('ONE ROW PER SENSOR'));
  const cells = SENS.map(([nm, e, t], k) => [null,
    T(String(e), TS, C.ink, true).moveTo([COL[1], rowY(k), 0]),
    T('100', TS, C.ink, true).moveTo([COL[2], rowY(k), 0]),
    T(String(t), TS, tcol(t), true).moveTo([COL[3], rowY(k), 0]), null]);
  await until(S(12)); await play(new M.LaggedStart(cells.map(r => new M.FadeIn(new M.VGroup(r[1], r[2], r[3]))), { lagRatio: 0.2, runTime: 1.4 }), ...say('NAME, POSITION, TEMPERATURE'));
  const dHead = T('district', P ? 16 : 15, C.violet, true); dHead.moveTo([COL[4], TY, 0]);
  const hline2 = new M.Line({ start: [COL[3] + 0.45, TY - RH / 2, 0], end: [COL[4] + 0.6, TY - RH / 2, 0], color: C.violet, strokeWidth: 1.5 });
  const slots = SENS.map((_, k) => { const r = new M.Rectangle({ width: 1.05, height: RH * 0.8, color: C.violet, strokeWidth: 1.5 }); r.moveTo([COL[4], rowY(k), 0]); return r; });
  await until(S(13)); await play(new M.FadeIn(dHead), new M.Create(hline2), new M.LaggedStart(slots.map(s => new M.Create(s)), { lagRatio: 0.15, runTime: 1.2 }), ...say('NEW EMPTY COLUMN: DISTRICT', C.violet));
  await until(S(14)); await play(new M.LaggedStart(slots.map(s => new M.Indicate(s, { color: C.violet })), { lagRatio: 0.15, runTime: 1.2 }), ...say('HOW DO WE FILL IT FROM THE MAP?', C.violet));

  // 15-21 sheet, polygons, points
  const sheet = new M.RoundedRectangle({ width: 500 * SX + 0.4, height: 200 * SX + 0.4, cornerRadius: 0.12, color: C.ink, strokeWidth: 1 });
  sheet.setFill(C.ink, 0.06); sheet.setStrokeOpacity(0.5); sheet.moveTo(px(200, 100));
  await until(S(15)); await play(new M.FadeIn(sheet, { shift: [0, -0.3, 0] }), ...say('A TRANSPARENT SHEET OVER THE MAP', C.ink));
  const wPoly = new M.Rectangle({ width: 250 * SX, height: 200 * SX, color: C.cyan, strokeWidth: 4 }); wPoly.moveTo(px(75, 100));
  const corners = [px(200, 0), px(450, 0), px(450, 200), px(200, 200)];
  const ePoly = new M.VGroup(...corners.map((c, i) => new M.DashedLine({ start: c, end: corners[(i + 1) % 4], color: C.amber, strokeWidth: 4 })));
  await until(S(16)); await play(new M.Create(wPoly), new M.Create(ePoly), ...say('DRAW BOTH DISTRICT BORDERS', C.amber));
  await until(S(17)); await play(new M.Indicate(wPoly, { color: C.cyan }), new M.Indicate(ePoly, { color: C.amber }), ...say('CLOSED SHAPES OF STRAIGHT LINES'));
  await until(S(18)); await play(...say('CLOSED SHAPE = POLYGON', C.green));
  await until(S(19)); await play(new M.LaggedStart(sens.map(s => new M.Flash(s.submobjects[1], { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('EACH SENSOR = A POINT', C.green));
  await until(S(20)); await play(...say('WHICH POLYGON CONTAINS EACH POINT?', C.violet));
  const border = new M.Line({ start: px(200, 0), end: px(200, 200), color: C.pink, strokeWidth: 5 });
  await until(S(21)); await play(new M.Create(border), ...say('INSIDE COUNTS. ON THE BORDER DOES NOT', C.pink));
  await until(S(22)); await play(new M.FadeOut(border), ...say('INSIDE → COPY THE DISTRICT NAME INTO THE ROW', C.green));

  // 23-26 the name
  await until(S(23)); await play(...say('CONNECT INFORMATION USING POSITIONS', C.cyan));
  await until(S(24)); await play(new M.Indicate(sheet, { color: C.green }), ...say('THIS IS A SPATIAL JOIN', C.green));
  await until(S(25)); await play(new M.LaggedStart(sens.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }), ...say('SPATIAL = ABOUT POSITION OR SPACE', C.green));
  await until(S(26)); await play(new M.Indicate(new M.VGroup(...names), { color: C.violet }), ...say('JOIN = CONNECT DIFFERENT SETS OF DATA', C.violet));

  // 27-36 one sensor at a time
  const dname = [];
  const writeName = (k, s, col) => {
    const t = T(s, TS, col, true, true); t.moveTo([COL[4], rowY(k), 0]);
    const a = [new M.FadeIn(t)]; if (dname[k]) a.push(new M.FadeOut(dname[k])); dname[k] = t; return a;
  };
  await until(S(27)); await play(...say('ONE SENSOR AT A TIME', C.ink));
  const plan = [['West', C.cyan, wPoly], ['West', C.cyan, wPoly], ['East', C.amber, ePoly], ['East', C.amber, ePoly]];
  for (let k = 0; k < 4; k++) {
    const [dn, col, poly] = plan[k], nm = SENS[k][0];
    await until(S(28 + 2 * k)); await play(new M.Indicate(sens[k], { color: col }), new M.Indicate(poly, { color: col }), ...say(`${nm} IS INSIDE ${dn.toUpperCase()}`, col));
    await until(S(29 + 2 * k)); await play(new M.Indicate(names[k], { color: col }), ...writeName(k, dn, col));
  }
  await until(S(36)); await play(new M.LaggedStart(dname.map(t => new M.Indicate(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('ALL 4 SENSORS HAVE A DISTRICT', C.green));

  // 37-40 move B to 250
  // B is rebuilt at its new place (dot + letter + reading together); the old one fades out.
  const moveB = (e, tdx = 0) => {
    const g = mk('B', e), p = px(e);
    if (tdx) g.submobjects[2].shift([-0.3, 0, 0]); // letter left of the pink border line
    const t = T('18°', 15, C.cyan, true); t.moveTo([p[0] + tdx, p[1] - 0.4, 0]);
    const a = [new M.FadeOut(sens[1]), new M.FadeOut(temps[1]), new M.FadeIn(g, { runTime: 1.2 }), new M.FadeIn(t, { runTime: 1.2 })];
    sens[1] = g; temps[1] = t; return a;
  };
  let bEast = cells[1][1];
  const setEast = (s) => { const t = T(s, TS, C.pink, true, true); t.moveTo([COL[1], rowY(1), 0]); const a = [new M.FadeOut(bEast), new M.FadeIn(t)]; bEast = t; return a; };
  await until(S(37)); await play(...moveB(250), ...setEast('250'), ...say('MOVE B TO 250 m EAST', C.pink));
  await until(S(38)); await play(new M.Indicate(cells[1][2], { color: C.pink }), ...say('NORTH STAYS 100 m', C.pink));
  await until(S(39)); await play(new M.Indicate(ePoly, { color: C.amber }), new M.Indicate(sens[1], { color: C.amber }), ...say('B IS NOW INSIDE EAST', C.amber));
  await until(S(40)); await play(...writeName(1, 'East', C.amber), ...say('WEST → EAST', C.amber));

  // 41-44 move B onto the border
  // sens[1] now sits at 250; move it by the gap to 200
  await until(S(41)); await play(...moveB(200, 0.5), ...setEast('200'), ...say('MOVE B TO EXACTLY 200 m EAST', C.pink));
  const border2 = new M.Line({ start: px(200, 0), end: px(200, 200), color: C.pink, strokeWidth: 5 });
  await until(S(42)); await play(new M.Create(border2), new M.Flash(sens[1].submobjects[1], { color: C.pink }), ...say('B IS ON THE BORDER', C.pink));
  await until(S(43)); await play(...say('OUR RULE: ON THE BORDER → NEITHER POLYGON', C.pink));
  const blank = T('(blank)', P ? 15 : 14, C.muted, true); blank.moveTo([COL[4], rowY(1), 0]);
  await until(S(44)); await play(new M.FadeOut(dname[1]), new M.FadeIn(blank), new M.Indicate(slots[1], { color: C.pink }), ...say('KEEP THE ROW, LEAVE THE DISTRICT BLANK', C.pink));
  dname[1] = blank;

  // 45-47 the rule
  await until(S(45)); await play(...say('THE MATCHING RULE IN SHORT LINES', C.cyan));
  await until(S(46)); await play(...fbox(['point inside a polygon', ['  → copy its district name', C.green]], C.green));
  await until(S(47)); await play(...fbox(['point inside a polygon', ['  → copy its district name', C.green], 'no polygon matches', ['  → leave it blank', C.pink]], C.green));

  // 48-51 why and a warning
  await until(S(48)); await play(new M.LaggedStart(dname.map(t => new M.Indicate(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('GROUP READINGS BY DISTRICT, NO HAND CHECKS', C.green));
  await until(S(49)); await play(new M.Indicate(border2, { color: C.amber }), ...say('OTHER JOINS MAY USE OTHER BORDER RULES', C.amber));
  await until(S(50)); await play(new M.Indicate(blank, { color: C.amber }), ...say('ALWAYS CHECK THE BORDER RULE FIRST', C.amber));
  await until(S(51)); await play(...say('SPATIAL JOIN = CONNECT DATA BY POSITION', C.green));
}
