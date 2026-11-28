// 2.2.4 Small multiples: one panel per day, same rulers in every panel.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // --- data (hours 6..22) ------------------------------------------------------
  const HRS = Array.from({ length: 17 }, (_, i) => 6 + i);
  const WD = [5, 25, 60, 35, 15, 15, 20, 18, 15, 18, 30, 55, 65, 35, 20, 10, 5];   // example weekday
  const SAT = [2, 3, 5, 8, 15, 25, 35, 40, 45, 42, 38, 28, 20, 15, 10, 6, 3];
  const SUN = [2, 2, 4, 6, 12, 22, 32, 42, 45, 40, 34, 25, 18, 12, 8, 5, 2];
  const sc = s => WD.map(v => Math.round(v * s));
  const DAYS = [
    { name: 'Mon', v: sc(0.9), col: C.amber }, { name: 'Tue', v: WD, col: C.amber },
    { name: 'Wed', v: sc(0.95), col: C.amber }, { name: 'Thu', v: sc(0.92), col: C.amber },
    { name: 'Fri', v: sc(0.85), col: C.amber }, { name: 'Sat', v: SAT, col: C.pink }, { name: 'Sun', v: SUN, col: C.pink }];
  const YMAX = 70;

  // --- layout (phone 8 x 14.22, laptop 14.22 x 8) ------------------------------
  let PILL = P ? [0, 3.4, 0] : [0, 1.94, 0];
  const BOXP = P ? [0, -5.0, 0] : [3.4, -1.85, 0];
  const BOX_MAXW = P ? FW - 0.9 : 5.6;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // big chart
  const BX0 = P ? -3.1 : -5.6, BX1 = P ? 3.4 : 5.6, BY0 = P ? -4.3 : -2.35, BY1 = P ? 2.3 : 1.3;
  const bx = h => BX0 + (h - 6) / 16 * (BX1 - BX0);
  const by = v => BY0 + v / YMAX * (BY1 - BY0);

  // --- helpers ---------------------------------------------------------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function polyline(pts, color, sw) {
    const v = new M.VMobject({ color, strokeWidth: sw });
    v.setPointsAsCorners(pts);
    v.setStroke(color, sw); v.setFill(color, 0);
    return v;
  }

  function bike(cx, cy, s, color) {
    const w1 = [cx - 0.5 * s, cy, 0], w2 = [cx + 0.5 * s, cy, 0], seat = [cx - 0.1 * s, cy + 0.45 * s, 0], bar = [cx + 0.35 * s, cy + 0.5 * s, 0];
    const c1 = new M.Circle({ radius: 0.3 * s, color, strokeWidth: 3 }); c1.moveTo(w1);
    const c2 = new M.Circle({ radius: 0.3 * s, color, strokeWidth: 3 }); c2.moveTo(w2);
    const mid = [cx, cy, 0];
    return new M.VGroup(c1, c2,
      new M.Line({ start: w1, end: seat, color, strokeWidth: 3 }), new M.Line({ start: seat, end: mid, color, strokeWidth: 3 }),
      new M.Line({ start: mid, end: w2, color, strokeWidth: 3 }), new M.Line({ start: w1, end: mid, color, strokeWidth: 3 }),
      new M.Line({ start: seat, end: bar, color, strokeWidth: 3 }), new M.Line({ start: bar, end: w2, color, strokeWidth: 3 }));
  }

  // --- 0-1 the station question ------------------------------------------------
  const bk = bike(0, P ? -0.6 : -0.5, P ? 1.6 : 1.4, C.cyan);
  await until(S(0));
  await play(new M.Create(bk), ...say('WHEN TO BRING EXTRA BIKES?', C.cyan));
  await until(S(1));
  await play(...say('WEEKDAYS vs WEEKENDS: SAME BUSY TIMES?', C.amber));

  // --- 2-6 the weekday line chart ----------------------------------------------
  const bAxX = new M.Line({ start: [BX0, BY0, 0], end: [BX1, BY0, 0], color: C.muted, strokeWidth: 2.5 });
  const bAxY = new M.Line({ start: [BX0, BY0, 0], end: [BX0, BY1, 0], color: C.muted, strokeWidth: 2.5 });
  const bYlab = T('bikes rented per hour', 15, C.muted); bYlab.moveTo([BX0 + 1.3, BY1 + 0.3, 0]);
  await until(S(2));
  await play(new M.FadeOut(bk), new M.Create(bAxX), new M.Create(bAxY), new M.FadeIn(bYlab), ...say('THE WEEKDAY LINE CHART', C.amber));

  const hTicks = [6, 8, 12, 18, 22].map(h => new M.VGroup(
    new M.Line({ start: [bx(h), BY0 - 0.06, 0], end: [bx(h), BY0 + 0.06, 0], color: C.muted }),
    T(h + ' h', 15, C.muted, true).moveTo([bx(h), BY0 - 0.3, 0])));
  await until(S(3));
  await play(new M.LaggedStart(hTicks.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('EARLY MORNING → LATE EVENING', C.muted));

  const bDots = HRS.map((h, i) => {
    const p = [bx(h), by(WD[i]), 0];
    const halo = new M.Dot({ point: p, radius: 0.16, color: C.amber }); halo.setFill(C.amber, 0.2);
    return new M.VGroup(halo, new M.Dot({ point: p, radius: 0.07, color: C.amber }));
  });
  await until(S(4));
  await play(new M.LaggedStart(bDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.6 }), ...say('EACH DOT = BIKES IN ONE HOUR', C.amber));

  const bLine = polyline(HRS.map((h, i) => [bx(h), by(WD[i]), 0]), C.amber, 3);
  const pk8 = T('8 h: 60', 15, C.amber, true, true); pk8.moveTo([bx(8), by(60) + 0.32, 0]);
  await until(S(5));
  await play(new M.Create(bLine), new M.FadeIn(pk8), ...say('HIGH POINT AT 8 IN THE MORNING', C.amber));
  const pk18 = T('18 h: 65', 15, C.amber, true, true); pk18.moveTo([bx(18), by(65) + 0.32, 0]);
  await until(S(6));
  await play(new M.FadeIn(pk18), new M.Indicate(bDots[12], { color: C.amber }), ...say('ANOTHER AT 6 IN THE EVENING', C.amber));

  // --- 7-9 one chart, seven lines ----------------------------------------------
  const crowd = DAYS.filter(d => d.name !== 'Tue').map(d => polyline(HRS.map((h, i) => [bx(h), by(d.v[i]), 0]), d.col, 2.5));
  const satBig = crowd[4];
  await until(S(7));
  await play(new M.FadeOut(new M.VGroup(...bDots, pk8, pk18)),
    new M.LaggedStart(crowd.map(c => new M.Create(c)), { lagRatio: 0.15, runTime: 2.0 }), ...say('ONE LINE PER DAY, SAME CHART', C.ink));
  const key = new M.VGroup(T('weekday', 15, C.amber, true, true), T('weekend', 15, C.pink, true, true));
  key.submobjects[0].moveTo([BX1 - 0.7, BY1 + 0.3, 0]); key.submobjects[1].moveTo([BX1 - 0.7, BY1 - 0.05, 0]);
  await until(S(8));
  await play(new M.FadeIn(key), ...say('LINES CROSS AND COVER EACH OTHER', C.pink));
  await until(S(9));
  await play(new M.Indicate(satBig, { color: C.pink, scaleFactor: 1.05 }), ...say('FOLLOW SATURDAY? HARD WORK', C.pink));

  // --- 10-15 panels ----------------------------------------------------------------
  const PW = P ? 1.38 : 2.35, PH = P ? 3.0 : 1.75;
  const pos = P
    ? [[-3.0, 1.0], [-1.5, 1.0], [0, 1.0], [1.5, 1.0], [3.0, 1.0], [-0.75, -2.35], [0.75, -2.35]]
    : [[-5.2, 0.35], [-2.6, 0.35], [0, 0.35], [2.6, 0.35], [5.2, 0.35], [-5.2, -1.85], [-2.6, -1.85]];
  const padL = P ? 0.44 : 0.34;
  const panels = DAYS.map((d, k) => {
    const [cx, cy] = pos[k];
    const left = cx - PW / 2 + padL, right = cx + PW / 2 - (P ? 0.17 : 0.1), bot = cy - PH / 2 + (P ? 0.36 : 0.22), top = cy + PH / 2 - (P ? 0.44 : 0.36);
    const px = h => left + (h - 6) / 16 * (right - left);
    const py = (v, mx) => bot + v / mx * (top - bot);
    const frame = new M.RoundedRectangle({ width: PW, height: PH, cornerRadius: 0.1, color: C.line, strokeWidth: 1.5 });
    frame.setFill(C.card, 0.85); frame.moveTo([cx, cy, 0]);
    const name = T(d.name, P ? 17 : 14, d.col, true, true); name.moveTo([cx, cy + PH / 2 - (P ? 0.2 : 0.17), 0]);
    const axX = new M.Line({ start: [left, bot, 0], end: [right, bot, 0], color: C.muted, strokeWidth: 1.5 });
    const axY = new M.Line({ start: [left, bot, 0], end: [left, top, 0], color: C.muted, strokeWidth: 1.5 });
    const lineAt = mx => polyline(HRS.map((h, i) => [px(h), py(d.v[i], mx), 0]), d.col, 2.2);
    const topLab = mx => T(String(mx), P ? 15 : 11, C.muted, true).moveTo([left - (P ? 0.22 : 0.15), top, 0]);
    const zero = T('0', P ? 15 : 11, C.muted, true); zero.moveTo([left - (P ? 0.22 : 0.15), bot, 0]);
    return { d, cx, cy, left, right, bot, top, px, py, frame, name, axX, axY, lineAt, topLab, zero,
      line: lineAt(YMAX), tl: topLab(YMAX), own: Math.max(...d.v) };
  });
  const parts = p => new M.VGroup(p.name, p.axX, p.axY, p.line, p.tl, p.zero);

  await until(S(10));
  await play(new M.FadeOut(new M.VGroup(bAxX, bAxY, bYlab, ...hTicks, bLine, ...crowd, key)),
    new M.LaggedStart(panels.map(p => new M.FadeIn(p.frame)), { lagRatio: 0.1, runTime: 1.2 }), ...say('A LITTLE CHART FOR EACH DAY', C.cyan));
  await until(S(11));
  await play(new M.LaggedStart(panels.slice(0, 5).map(p => new M.FadeIn(parts(p))), { lagRatio: 0.15, runTime: 1.4 }), ...say('ROW 1: MONDAY → FRIDAY', C.amber));
  await until(S(12));
  await play(new M.LaggedStart(panels.slice(5).map(p => new M.FadeIn(parts(p))), { lagRatio: 0.2, runTime: 1.0 }), ...say('ROW 2: SATURDAY, SUNDAY', C.pink));
  await until(S(13));
  await play(new M.Indicate(panels[5].line, { color: C.pink }), ...say('NOW EACH LINE IS EASY TO FOLLOW', C.green));
  await until(S(14));
  await play(new M.Indicate(panels[0].frame, { color: C.cyan }), ...say('EACH LITTLE CHART = A PANEL', C.cyan));
  await until(S(15));
  await play(new M.LaggedStart(panels.map(p => new M.Indicate(p.frame, { color: C.green })), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('SAME KIND OF CHART, REPEATED = SMALL MULTIPLES', C.green));

  // --- 16-18 the photo idea ----------------------------------------------------------
  const PH_C = P ? [[-1.6, -5.0], [1.6, -5.0]] : [[1.9, -1.75], [4.9, -1.75]];
  const photo = ([x, y], bikeS, lab, col) => {
    const fr = new M.RoundedRectangle({ width: 2.3, height: 1.45, cornerRadius: 0.1, color: C.ink, strokeWidth: 2 });
    fr.setFill(C.card, 0.95); fr.moveTo([x, y, 0]);
    const b = bike(x, y - 0.15, bikeS, col);
    const t = T(lab, 13, col, true); t.moveTo([x, y - 0.95, 0]);
    return new M.VGroup(fr, b, t);
  };
  const ph1 = photo(PH_C[0], 0.9, 'big bike', C.cyan);
  await until(S(16));
  await play(new M.FadeIn(ph1), ...say('PHOTOS: SAME SPOT, SAME CAMERA', C.cyan));
  const ph2 = photo(PH_C[1], 0.9, 'small bike, zoomed in', C.violet);
  await until(S(17));
  await play(new M.FadeIn(ph2), ...say('ZOOM IN: A SMALL BIKE LOOKS JUST AS BIG', C.violet));
  await until(S(18));
  await play(new M.FadeOut(new M.VGroup(ph1, ph2)), ...say('SAME PROBLEM WITH CHART RULERS', C.violet));

  // --- 19-25 axes and their limits -------------------------------------------------
  const p1 = panels[1], p5 = panels[5];
  await until(S(19));
  await play(new M.Indicate(p1.axX, { color: C.cyan }), new M.Indicate(p1.axY, { color: C.cyan }), ...say('AXIS = RULER AT BOTTOM OR SIDE', C.cyan));
  await until(S(20));
  await play(new M.Indicate(p1.tl, { color: C.cyan, scaleFactor: 1.6 }), new M.Indicate(p1.zero, { color: C.cyan, scaleFactor: 1.6 }),
    ...say('AXIS LIMIT = FIRST OR LAST NUMBER', C.cyan));

  // own limits
  const ownAnims = [];
  panels.forEach(p => {
    ownAnims.push(new M.Transform(p.line, p.lineAt(p.own)), new M.Transform(p.tl, p.topLab(p.own)));
  });
  await until(S(21));
  await play(...ownAnims, ...say('TRAP: EACH PANEL ENDS AT ITS OWN BUSIEST HOUR', C.pink));
  await until(S(22));
  await play(new M.LaggedStart(panels.map(p => new M.Indicate(p.tl, { color: C.pink, scaleFactor: 1.6 })), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('EVERY TOP POINT TOUCHES THE TOP', C.pink));
  await until(S(23));
  await play(new M.Indicate(p5.line, { color: C.pink }), new M.Indicate(p1.line, { color: C.amber }),
    ...say('SATURDAY LOOKS AS BUSY AS A WEEKDAY', C.pink));

  const sameAnims = [];
  panels.forEach(p => { sameAnims.push(new M.Transform(p.line, p.lineAt(YMAX)), new M.Transform(p.tl, p.topLab(YMAX))); });
  await until(S(24));
  await play(...sameAnims, ...say('SAME SIDE RULER: 0 TO 70 IN EVERY PANEL', C.green));

  const lvl = [p1, p5].map(p => new M.DashedLine({ start: [p.left, p.py(45, YMAX), 0], end: [p.right, p.py(45, YMAX), 0], color: C.green }));
  await until(S(25));
  await play(new M.Create(lvl[0]), new M.Create(lvl[1]), ...say('SAME HEIGHT = SAME NUMBER OF BIKES', C.green));

  // --- 26-27 same hours across the bottom ----------------------------------------
  const hrLab = panels.map(p => new M.VGroup(
    T('6', P ? 15 : 10, C.muted, true).moveTo([p.px(6), p.bot - (P ? 0.18 : 0.12), 0]),
    T('22', P ? 15 : 10, C.muted, true).moveTo([p.px(22), p.bot - (P ? 0.18 : 0.12), 0])));
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...lvl)), new M.FadeIn(new M.VGroup(...hrLab)), ...say('SAME HOURS: 6 h TO 22 h EVERYWHERE', C.cyan));
  const at8 = panels.map(p => new M.DashedLine({ start: [p.px(8), p.bot, 0], end: [p.px(8), p.top, 0], color: C.cyan }));
  await until(S(27));
  await play(new M.LaggedStart(at8.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.2 }), ...say('8 h SITS IN THE SAME PLACE', C.cyan));

  // --- 28-34 read the patterns --------------------------------------------------------
  await until(S(28));
  await play(new M.FadeOut(new M.VGroup(...at8)),
    new M.LaggedStart(panels.slice(0, 5).map(p => new M.Indicate(p.line, { color: C.amber })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('LOOK ACROSS THE WEEKDAYS', C.amber));
  const pkDots = [];
  panels.slice(0, 5).forEach(p => [8, 18].forEach(h => {
    const v = p.d.v[h - 6], dt = new M.Dot({ point: [p.px(h), p.py(v, YMAX), 0], radius: 0.06, color: C.ink });
    pkDots.push(dt);
  }));
  await until(S(29));
  await play(new M.LaggedStart(pkDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.2 }), ...say('PEAKS AT 8 h AND 18 h', C.amber));
  await until(S(30));
  await play(new M.Indicate(p5.line, { color: C.pink }), new M.Indicate(panels[6].line, { color: C.pink }), ...say('NOW THE TWO WEEKEND PANELS', C.pink));
  const humps = panels.slice(5).map(p => {
    const w = p.px(16) - p.px(12), h = p.py(48, YMAX) - p.bot;
    const r = new M.Rectangle({ width: w, height: h, color: C.pink, strokeWidth: 2 });
    r.setFill(C.pink, 0.12); r.moveTo([(p.px(12) + p.px(16)) / 2, p.bot + h / 2, 0]);
    return r;
  });
  await until(S(31));
  await play(new M.FadeIn(humps[0]), new M.FadeIn(humps[1]), ...say('ONE WIDE RISE: NOON TO 4 PM', C.pink));
  const l45 = T('45', P ? 16 : 13, C.pink, true, true); l45.moveTo([p5.px(14), p5.py(45, YMAX) + 0.17, 0]);
  await until(S(32));
  await play(new M.FadeIn(l45), ...say('WEEKEND HIGH: ABOUT 45', C.pink));
  const l65 = T('65', P ? 16 : 13, C.amber, true, true); l65.moveTo([p1.px(18) + (P ? 0 : 0.18), p1.py(65, YMAX) + 0.06, 0]);
  await until(S(33));
  await play(new M.FadeIn(l65), new M.Indicate(p1.line, { color: C.amber }), ...say('EXAMPLE WEEKDAY: EVENING PEAK 65', C.amber));
  await until(S(34));
  await play(...fbox([['weekdays: extra bikes', C.amber], ['  before 8 h and 18 h', C.amber], ['weekends: extra bikes', C.pink], ['  around noon to 4 pm', C.pink]], C.green),
    ...say('DIFFERENT SHAPES → DIFFERENT TIMES', C.green));

  // --- 35-39 the rule and the trap -------------------------------------------------
  await until(S(35));
  await play(...say('THE DRAWING RULE', C.cyan));
  await until(S(36));
  await play(...fbox(['1. one panel per day', ['2. same ruler limits', C.green], ['   in every panel', C.green]], C.cyan),
    new M.LaggedStart(panels.map(p => new M.Indicate(p.tl, { color: C.green, scaleFactor: 1.5 })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('ONE PANEL PER DAY, SAME LIMITS', C.green));
  await until(S(37));
  await play(...say('COMPARE PATTERNS, NO CROWD OF LINES', C.green));
  await until(S(38));
  await play(...fbox([['TRAP:', C.pink], ['each chart picks', C.pink], ['its own ruler limits', C.pink]], C.pink), ...say('TRAP: EACH CHART PICKS ITS OWN LIMITS', C.pink));
  await until(S(39));
  await play(...fbox(['SMALL MULTIPLES:', ['one chart per group', C.cyan], ['on matching rulers', C.green]], C.green),
    new M.LaggedStart(panels.map(p => new M.Indicate(p.frame, { color: C.green })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('SAME RULERS → A FAIR COMPARISON', C.green));
}
