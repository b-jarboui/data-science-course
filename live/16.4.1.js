// 16.4.1 Coordinate reference systems: measuring distances on a flat map grid.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const SX = P ? 0.014 : 0.0168, SY = P ? 0.026 : 0.019, MX = P ? 0.4 : -2.1, MY = P ? 0.2 : -1.1;
  const px = (e, n = 100) => [MX + (e - 200) * SX, MY + (n - 100) * SY, 0];
  const BOXP = P ? [0, -4.65, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, P ? [0, 4.35, 0] : undefined);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 24 : 21, lh = P ? 0.5 : 0.42;
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
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  const SENS = [['A', 0, 18], ['B', 100, 18], ['C', 300, 22], ['D', 400, 22]];
  const tcol = t => t === 18 ? C.cyan : C.amber;

  // 0 the street
  const street = new M.RoundedRectangle({ width: 460 * SX, height: 0.42, cornerRadius: 0.2, color: C.muted, strokeWidth: 2 });
  street.setFill(C.line, 0.7); street.moveTo(px(200));
  // label above the street, in the gap between the '?' spot (160) and sensor C (300): never on a reading
  const streetLab = T('straight street', 16, C.muted); streetLab.moveTo([px(232)[0], px(0, 100)[1] + 0.42, 0]);
  await until(S(0)); await play(new M.FadeIn(street), new M.FadeIn(streetLab), ...say('HOW WARM ARE THE STREETS?', C.amber));

  // 1-3 four sensors
  const sens = SENS.map(([nm, e]) => {
    const p = px(e);
    const halo = new M.Dot({ point: p, radius: 0.27, color: C.cyan }); halo.setFill(C.cyan, 0.18);
    const d = new M.Dot({ point: p, radius: 0.12, color: C.cyan });
    const lab = T(nm, 20, C.ink, true, true); lab.moveTo([p[0], p[1] + 0.38, 0]);
    return new M.VGroup(halo, d, lab);
  });
  await until(S(1)); await play(new M.LaggedStart(sens.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.6 }), ...say('4 SENSORS ON ONE STREET'));
  // a little thermometer next to sensor A
  const tp = px(0); const thx = tp[0] - 0.62, thy = tp[1] + 0.55;
  const tube = new M.RoundedRectangle({ width: 0.16, height: 0.62, cornerRadius: 0.08, color: C.ink, strokeWidth: 2 }); tube.moveTo([thx, thy + 0.12, 0]);
  const bulb = new M.Circle({ radius: 0.13, color: C.amber }); bulb.setFill(C.amber, 1); bulb.moveTo([thx, thy - 0.26, 0]);
  const merc = new M.Rectangle({ width: 0.06, height: 0.38, color: C.amber, strokeWidth: 1 }); merc.setFill(C.amber, 1); merc.moveTo([thx, thy + 0.0, 0]);
  const thermo = new M.VGroup(tube, merc, bulb);
  await until(S(2)); await play(new M.FadeIn(thermo), ...say('SENSOR = SMALL DEVICE THAT MEASURES AIR TEMPERATURE'));
  await until(S(3)); await play(new M.FadeOut(thermo), ...say('ALL READ AT THE SAME TIME: AFTERNOON', C.violet));
  await until(S(4)); await play(new M.LaggedStart(sens.map(s => new M.Indicate(s, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('SENSORS ON A PICTURE OF THE STREET'));

  // 5-8 readings
  const temps = [];
  for (let k = 0; k < 4; k++) {
    await until(S(5 + k));
    const [nm, e, t] = SENS[k], p = px(e);
    const lab = T(`${t} °C`, 17, tcol(t), true); lab.moveTo([p[0], p[1] - 0.45, 0]);
    temps.push(lab);
    await play(new M.FadeIn(lab), new M.Flash(sens[k].submobjects[1], { color: tcol(t) }), ...say(`SENSOR ${nm}: ${t} °C`, tcol(t)));
  }

  // 9-11 a spot without a sensor
  const qp = px(160);
  const qc = new M.Circle({ radius: 0.24, color: C.pink, strokeWidth: 2.5 }); qc.moveTo(qp);
  const qt = T('?', 22, C.pink, true, true); qt.moveTo([qp[0], qp[1] + 0.46, 0]);
  const spot = new M.VGroup(qc, qt);
  await until(S(9)); await play(new M.FadeIn(spot), ...say('NO SENSOR HERE: HOW WARM?', C.pink));
  await until(S(10)); await play(new M.Indicate(sens[1], { color: C.green }), new M.Indicate(sens[2], { color: C.green }), ...say('WHICH SENSORS ARE NEARBY?', C.green));
  await until(S(11)); await play(...say('WE NEED DISTANCES ON THE MAP', C.amber));

  // 12 curved Earth onto a flat sheet
  const arcY = px(0, 200)[1] + 0.35;
  const curve = new M.Arc({ radius: 6, startAngle: Math.PI / 2 - 0.38, angle: 0.76, color: C.violet, strokeWidth: 4 });
  curve.moveTo([MX, arcY, 0]);
  const flat = new M.Line({ start: [MX - 6 * Math.sin(0.38), arcY, 0], end: [MX + 6 * Math.sin(0.38), arcY, 0], color: C.violet, strokeWidth: 4 });
  await until(S(12)); await play(new M.Create(curve), ...say('CURVED EARTH → FLAT SHEET', C.violet));
  await play(new M.Transform(curve, flat, { runTime: 1.4 }));

  // 13 the grid
  const gl = [];
  for (let e = 0; e <= 400; e += 100) gl.push(new M.Line({ start: px(e, 0), end: px(e, 200), color: C.cyan, strokeWidth: 1.5 }));
  for (let n = 0; n <= 200; n += 100) gl.push(new M.Line({ start: px(-30, n), end: px(450, n), color: C.cyan, strokeWidth: 1.5 }));
  gl.forEach(l => l.setStrokeOpacity(0.35));
  const grid = new M.VGroup(...gl);
  await until(S(13)); await play(new M.FadeOut(curve), new M.FadeOut(streetLab), new M.Create(grid, { runTime: 1.5 }), ...say('COVER IT WITH A GRID, LIKE SQUARED PAPER'));

  // 14 starting point
  const o = px(0, 0);
  const odot = new M.Dot({ point: o, radius: 0.12, color: C.green });
  const olab = T('start (0, 0)', 15, C.green, true); olab.moveTo([o[0] + 0.05, o[1] - 0.68, 0]);
  await until(S(14)); await play(new M.FadeIn(odot), new M.Flash(odot, { color: C.green }), new M.FadeIn(olab), ...say('A STARTING POINT', C.green));

  // 15 east
  const eArr = new M.Arrow({ start: o, end: px(450, 0), color: C.amber, strokeWidth: 3 });
  const eTicks = [100, 200, 300, 400].map(v => T(String(v), 15, C.amber, true).moveTo([px(v, 0)[0], o[1] - 0.3, 0]));
  const eLab = T('EAST →', 15, C.amber, true, true); eLab.moveTo([px(450, 0)[0] - 0.35, o[1] + 0.25, 0]);
  await until(S(15)); await play(new M.Create(eArr), new M.FadeIn(new M.VGroup(...eTicks, eLab)), ...say('HOW FAR EAST?', C.amber));

  // 16 north
  const nArr = new M.Arrow({ start: o, end: [o[0], px(0, 230)[1], 0], color: C.violet, strokeWidth: 3 });
  const nTicks = [100, 200].map(v => T(String(v), 15, C.violet, true).moveTo([px(-30)[0] - 0.3, px(0, v)[1], 0]));
  const nLab = T('NORTH ↑', 15, C.violet, true, true); nLab.moveTo([o[0] - 0.75, px(0, 230)[1], 0]);
  await until(S(16)); await play(new M.Create(nArr), new M.FadeIn(new M.VGroup(...nTicks, nLab)), ...say('HOW FAR NORTH?', C.violet));

  // 17 meters
  const unit = T('meters', 15, C.muted); unit.moveTo([px(450, 0)[0] - (P ? 0.4 : 0.1), o[1] - 0.62, 0]);
  await until(S(17)); await play(new M.FadeIn(unit), new M.LaggedStart(eTicks.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...say('BOTH DISTANCES IN METERS (m)', C.ink));

  // 18-21 coordinates of each sensor
  const drops = [], coords = [];
  for (let k = 0; k < 4; k++) {
    await until(S(18 + k));
    const [nm, e] = SENS[k], p = px(e);
    const dl = new M.DashedLine({ start: [p[0], p[1] - 0.14, 0], end: px(e, 0), color: C.amber, strokeWidth: 2 });
    const cl = T(`(${e}, 100)`, 15, C.green, true); cl.moveTo([p[0] - (k === 0 ? 0.8 : 0), p[1] + 0.75, 0]);
    drops.push(dl); coords.push(cl);
    const extra = k === 0 ? [new M.FadeOut(new M.VGroup(...temps))] : [];
    await play(new M.Create(dl), new M.FadeIn(cl), new M.Indicate(sens[k], { color: C.green }), ...extra, ...say(`${nm}: ${e} m EAST, 100 m NORTH`, C.green));
  }

  // 22-26 coordinates and the rules behind them
  await until(S(22)); await play(new M.FadeOut(new M.VGroup(...drops)), ...say('2 NUMBERS = WHERE THE SENSOR IS', C.green));
  await until(S(23)); await play(new M.LaggedStart(coords.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }), ...say('THESE NUMBERS = COORDINATES', C.green));
  await until(S(24)); await play(...say('COORDINATES NEED RULES', C.amber));
  await until(S(25)); await play(...fbox(['THE RULES', ['start: (0, 0)', C.green], ['directions: east, north', C.amber], ['units: meters', C.ink]], C.amber), ...say('START, DIRECTIONS, UNITS', C.amber));
  await until(S(26)); await play(new M.Indicate(boxNow, { color: C.cyan }), ...say('RULES = COORDINATE REFERENCE SYSTEM (CRS)', C.cyan));

  // 27-31 projection
  const curve2 = new M.Arc({ radius: 6, startAngle: Math.PI / 2 - 0.38, angle: 0.76, color: C.violet, strokeWidth: 4 });
  curve2.moveTo([MX, arcY, 0]);
  const flat2 = new M.Line({ start: [MX - 6 * Math.sin(0.38), arcY, 0], end: [MX + 6 * Math.sin(0.38), arcY, 0], color: C.violet, strokeWidth: 4 });
  await until(S(27)); await play(new M.Create(curve2), new M.Indicate(grid, { color: C.cyan }), ...say('EARTH IS CURVED, THE GRID IS FLAT', C.violet));
  await until(S(28)); await play(new M.Transform(curve2, flat2, { runTime: 1.4 }), ...say('MAP PROJECTION: CURVED → FLAT', C.violet));
  await until(S(29)); await play(new M.FadeOut(curve2), ...fbox(['projected CRS', ['  = CRS + map projection', C.violet]], C.violet), ...say('PROJECTED COORDINATE REFERENCE SYSTEM', C.violet));
  await until(S(30)); await play(...say('NO FLAT MAP KEEPS EVERY DISTANCE EXACT', C.amber));
  await until(S(31)); await play(...dropBox(), ...say('OUR STREET: LOCAL DISTANCES ≈ REAL', C.green));

  // 32-38 distance A to B
  const yA = px(0)[1];
  const seg = (e1, e2, col) => { const l = new M.Line({ start: [px(e1)[0], yA - 0.75, 0], end: [px(e2)[0], yA - 0.75, 0], color: col, strokeWidth: 4 });
    const c1 = new M.Line({ start: [px(e1)[0], yA - 0.62, 0], end: [px(e1)[0], yA - 0.88, 0], color: col, strokeWidth: 3 });
    const c2 = new M.Line({ start: [px(e2)[0], yA - 0.62, 0], end: [px(e2)[0], yA - 0.88, 0], color: col, strokeWidth: 3 });
    return new M.VGroup(l, c1, c2); };
  await until(S(32)); await play(new M.Indicate(sens[0], { color: C.amber }), new M.Indicate(sens[1], { color: C.amber }), ...say('DISTANCE: A TO B', C.amber));
  const rowLine = new M.DashedLine({ start: px(-50), end: px(450), color: C.violet, strokeWidth: 2 });
  await until(S(33)); await play(new M.Create(rowLine), new M.Indicate(coords[0], { color: C.violet }), new M.Indicate(coords[1], { color: C.violet }), ...say('BOTH 100 m NORTH', C.violet));
  const sAB = seg(0, 100, C.amber);
  await until(S(34)); await play(new M.FadeOut(rowLine), new M.Create(sAB), ...say('ONLY THE EAST GAP MATTERS', C.amber));
  await until(S(35)); await play(new M.Indicate(coords[0], { color: C.amber }), ...fbox([['A east = 0', C.ink]], C.amber));
  await until(S(36)); await play(new M.Indicate(coords[1], { color: C.amber }), ...fbox(['A east = 0', ['B east = 100', C.ink]], C.amber));
  await until(S(37)); await play(...fbox(['A east = 0', 'B east = 100', ['100 − 0', C.amber]], C.amber));
  const lAB = T('100 m', 16, C.amber, true, true); lAB.moveTo([px(50)[0], yA - 1.05, 0]);
  await until(S(38)); await play(new M.FadeIn(lAB), ...fbox(['A east = 0', 'B east = 100', ['100 − 0 = 100 m', C.amber]], C.amber), ...say('A TO B: 100 m', C.amber));

  // 39-43 distance B to C
  await until(S(39)); await play(new M.Indicate(sens[1], { color: C.pink }), new M.Indicate(sens[2], { color: C.pink }), ...dropBox(), ...say('DISTANCE: B TO C', C.pink));
  const sBC = seg(100, 300, C.pink);
  await until(S(40)); await play(new M.Create(sBC), new M.Indicate(coords[1], { color: C.pink }), ...fbox([['B east = 100', C.ink]], C.pink));
  await until(S(41)); await play(new M.Indicate(coords[2], { color: C.pink }), ...fbox(['B east = 100', ['C east = 300', C.ink]], C.pink));
  await until(S(42)); await play(...fbox(['B east = 100', 'C east = 300', ['300 − 100', C.pink]], C.pink));
  const lBC = T('200 m', 16, C.pink, true, true); lBC.moveTo([px(200)[0], yA - 1.05, 0]);
  await until(S(43)); await play(new M.FadeIn(lBC), ...fbox(['B east = 100', 'C east = 300', ['300 − 100 = 200 m', C.pink]], C.pink), ...say('B TO C: 200 m', C.pink));

  // 44-46 the formula
  await until(S(44)); await play(...say('THE METHOD IN ONE SHORT LINE: A FORMULA', C.cyan));
  await until(S(45)); await play(new M.LaggedStart(coords.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.12, runTime: 1.2 }), ...say('SAME NORTH → USE THE EAST NUMBERS', C.violet));
  await until(S(46)); await play(...fbox(['distance =', ['  larger east − smaller east', C.cyan], ['A–B: 100 − 0 = 100 m', C.amber], ['B–C: 300 − 100 = 200 m', C.pink]], C.cyan));

  // 47-48 why it is useful
  await until(S(47)); await play(...say('A GOOD PROJECTED CRS IS USEFUL', C.green));
  await until(S(48)); await play(new M.Indicate(spot, { color: C.pink }), new M.Indicate(sens[1], { color: C.green }), new M.Indicate(sens[2], { color: C.green }), ...say('MEASURE DISTANCES, FIND NEARBY SENSORS', C.green));

  // 49-52 careful: angles in degrees
  const mapAll = new M.VGroup(street, ...sens, spot, grid, odot, olab, eArr, ...eTicks, eLab, nArr, ...nTicks, nLab, unit, ...coords, sAB, sBC, lAB, lBC);
  const G = P ? [-1.35, -0.2, 0] : [-2.1, -0.55, 0], R = P ? 1.85 : 1.65, w = R * 0.55;
  const at = (x, y) => [G[0] + x, G[1] + y, 0];
  const globe = new M.Circle({ radius: R, color: C.cyan, strokeWidth: 2.5 }); globe.setFill(C.cyan, 0.08); globe.moveTo(G);
  const wedge = new M.VGroup(
    new M.Line({ start: at(0, R), end: at(-w, 0), color: C.violet, strokeWidth: 2.5 }), new M.Line({ start: at(-w, 0), end: at(0, -R), color: C.violet, strokeWidth: 2.5 }),
    new M.Line({ start: at(0, R), end: at(w, 0), color: C.violet, strokeWidth: 2.5 }), new M.Line({ start: at(w, 0), end: at(0, -R), color: C.violet, strokeWidth: 2.5 }));
  const deg = T('1°', 18, C.violet, true, true); deg.moveTo(at(0, R + 0.3));
  await until(S(49)); await play(new M.FadeOut(mapAll), ...dropBox(), new M.FadeIn(globe), new M.Create(wedge), ...say('CAREFUL: SOME CRS USE ANGLES', C.amber));
  await until(S(50)); await play(new M.FadeIn(deg), new M.Flash(deg, { color: C.violet }), ...say('ANGLES IN DEGREES (°), NOT METERS', C.violet));
  const yTop = R * 0.72, wTop = w * (1 - 0.72);
  const wide = new M.Line({ start: at(-w, 0), end: at(w, 0), color: C.amber, strokeWidth: 5 });
  const narrow = new M.Line({ start: at(-wTop, yTop), end: at(wTop, yTop), color: C.amber, strokeWidth: 5 });
  const wl = T('1° = long way', P ? 16 : 15, C.amber, true); wl.moveTo(at(R + (P ? 1.45 : 1.25), 0));
  const nl = T('1° = short way', P ? 16 : 15, C.amber, true); nl.moveTo(at(R + (P ? 1.45 : 1.25), yTop));
  await until(S(51)); await play(new M.Create(wide), new M.FadeIn(wl), ...say('SAME 1°, DIFFERENT DISTANCES', C.amber));
  await play(new M.Create(narrow), new M.FadeIn(nl));
  await until(S(52)); await play(...fbox(['difference in degrees', ['  ≠ distance in meters', C.amber]], C.amber), ...say('DEGREES ARE NOT METERS', C.amber));
  await until(S(53)); await play(...fbox(['distance in meters?', ['  use a local projected CRS', C.green]], C.green), ...say('LOCAL PROJECTED CRS → DISTANCES IN METERS', C.green));
}
