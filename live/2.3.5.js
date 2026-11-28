// 2.3.5 Accessible color: make routes clear without color (live manim-web lesson).
// Beat i = sentence i (0-based, 0..37). Runs in site/live/engine.js.
// Chapter facts (chapters/2.3.md): A = blue solid line + circles, B = orange dashed line + squares,
// C = purple dotted line + triangles. The on-time series per period is an example; the last period
// matches the data sheet (A 96, B 94, C 92).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const RA = '#60a5fa', RB = '#fb923c', RCv = C.violet, GRAY = '#a3acc2';
  const COLS = [RA, RB, RCv];
  const VAL = [[98, 92, 98, 93, 96], [91, 92, 93, 98, 94], [95, 95, 94, 96, 92]];
  const STY = ['solid', 'dashed', 'dotted'];
  const SHP = ['circle', 'square', 'triangle'];

  // ---------------- layout ----------------
  const PILL = P ? [0, 2.3, 0] : [-2.45, 1.92, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.55, -1.75, 0];
  const KEYP = P ? [0, -5.15, 0] : [4.55, 0.45, 0];
  const XP = i => (P ? -2.75 + i * 1.35 : -5.3 + i * 1.55);
  const YV = v => (P ? -3.3 + (v - 90) / 10 * 4.6 : -2.4 + (v - 90) / 10 * 3.6);
  const AXX = P ? -3.2 : -5.75;
  const XEND = XP(4) + 0.3;
  const NOTE_Y = P ? -4.65 : -3.55;
  const NOTE_X = P ? 0 : -2.25;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pts = k => VAL[k].map((v, i) => [XP(i), YV(v), 0]);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.6 : 4.5;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  const hideBox = () => { if (!boxNow) return []; const b = boxNow; boxNow = null; return [new M.FadeOut(b, { runTime: 0.5 })]; };

  // note under the chart: one at a time
  let noteNow = null;
  function note(s, col) {
    const t = T(s, P ? 19 : 18, col, false, true).moveTo([NOTE_X, NOTE_Y, 0]);
    const a = [new M.FadeIn(t, { runTime: 0.5 })];
    if (noteNow) a.push(new M.FadeOut(noteNow, { runTime: 0.4 }));
    noteNow = t;
    return a;
  }
  const hideNote = () => { if (!noteNow) return []; const n = noteNow; noteNow = null; return [new M.FadeOut(n, { runTime: 0.4 })]; };

  const line = (a, b, col, w = 3) => new M.Line({ start: a, end: b, color: col, strokeWidth: w });

  // ---------------- route drawing: line style + marker shape ----------------
  function path(k, style, col, w = 3) {
    const p = pts(k), parts = [];
    if (style === 'solid') { for (let i = 0; i < 4; i++) parts.push(line(p[i], p[i + 1], col, w)); return parts; }
    // walk along the polyline and place dashes or dots at fixed spacing
    const segs = [];
    let total = 0;
    for (let i = 0; i < 4; i++) { const L0 = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); segs.push([p[i], p[i + 1], total, L0]); total += L0; }
    const at = s => { for (const [a, b, s0, L0] of segs) if (s <= s0 + L0 + 1e-9) { const f = (s - s0) / L0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0]; } return p[4]; };
    if (style === 'dashed') {
      const dash = 0.2, gap = 0.13;
      for (let s = 0; s < total; s += dash + gap) parts.push(line(at(s), at(Math.min(total, s + dash)), col, w));
      return parts;
    }
    const step = 0.13;
    for (let s = 0; s <= total + 1e-6; s += step) { const d = new M.Dot({ point: at(s), radius: P ? 0.04 : 0.035, color: col }); d.setFill(col, 1); parts.push(d); }
    return parts;
  }
  function marker(shape, [x, y], col, sc = 1) {
    if (shape === 'circle') { const c = new M.Circle({ radius: 0.12 * sc, color: col, strokeWidth: 2.6 }); c.setFill(C.bg, 1); c.moveTo([x, y, 0]); return c; }
    if (shape === 'square') { const s = new M.RoundedRectangle({ width: 0.24 * sc, height: 0.24 * sc, cornerRadius: 0.01, color: col, strokeWidth: 2.6 }); s.setFill(C.bg, 1); s.moveTo([x, y, 0]); return s; }
    const r = 0.17 * sc, back = new M.Circle({ radius: r * 0.75, color: C.bg, strokeWidth: 0.5 }); back.setFill(C.bg, 1); back.moveTo([x, y - r * 0.1, 0]);
    const v = [[x, y + r, 0], [x - r * 0.87, y - r * 0.5, 0], [x + r * 0.87, y - r * 0.5, 0]];
    return new M.VGroup(back, line(v[0], v[1], col, 2.6), line(v[1], v[2], col, 2.6), line(v[2], v[0], col, 2.6));
  }
  const markers = (k, col) => pts(k).map(p => marker(SHP[k], p, col));
  const letter = (k, col) => T('ABC'[k], P ? 22 : 22, col, true, true).moveTo([XEND + 0.28, YV(VAL[k][4]), 0]);
  function route(k, { col, style = 'solid', marks = false }) {
    const g = new M.VGroup(...path(k, style, col), ...(marks ? markers(k, col) : []), letter(k, col));
    return g;
  }
  const routes = [null, null, null];
  function swap(k, opts, rt = 0.7) {
    const g = route(k, opts), a = [new M.FadeIn(g, { runTime: rt })];
    if (routes[k]) a.push(new M.FadeOut(routes[k], { runTime: rt * 0.8 }));
    routes[k] = g;
    return a;
  }
  const swapAll = (optsFn, rt = 0.7) => [0, 1, 2].flatMap(k => swap(k, optsFn(k), rt));

  // ---------------- chart frame ----------------
  const yAxis = line([AXX, YV(90), 0], [AXX, YV(100) + 0.1, 0], C.muted, 2.2);
  const xAxis = line([AXX, YV(90), 0], [XEND, YV(90), 0], C.muted, 2.2);
  const yTicks = [90, 92, 94, 96, 98, 100].flatMap(v => [
    line([AXX - 0.08, YV(v), 0], [AXX, YV(v), 0], C.muted, 1.6),
    T(String(v), 16, C.muted, true).moveTo([AXX - 0.36, YV(v), 0])]);
  const grid = [92, 94, 96, 98, 100].map(v => { const g = line([AXX, YV(v), 0], [XEND, YV(v), 0], C.grid, 1); g.setStrokeOpacity(0.5); return g; });
  const xTicks = [0, 1, 2, 3, 4].map(i => T(String(i + 1), 16, C.muted, true).moveTo([XP(i), YV(90) - 0.3, 0]));
  const yTitle = T('on time (%)', P ? 17 : 16, C.muted, false, true).moveTo([AXX + 0.55, YV(100) + 0.36, 0]);
  const xTitle = T('time period →', P ? 17 : 16, C.muted, false, true).moveTo([(AXX + XEND) / 2, YV(90) - (P ? 0.7 : 0.62), 0]);
  const frame = new M.VGroup(...grid, yAxis, xAxis, ...yTicks, ...xTicks, yTitle, xTitle);

  // =========================================================================
  // 0-1: dashboard, question
  // =========================================================================
  await until(S(0));
  await play(new M.FadeIn(frame), ...fbox([['city transit', C.muted], ['dashboard chart', C.cyan]], C.cyan), ...say('A CHART ON THE TRANSIT DASHBOARD'));

  await until(S(1));
  await play(...fbox([['can everyone tell', C.ink], ['the routes apart?', C.amber]], C.amber), ...say('CAN EVERYONE TELL THEM APART?', C.amber));

  // 2: one plain line per route
  await until(S(2));
  await play(...[0, 1, 2].flatMap(k => { const g = new M.VGroup(...path(k, 'solid', C.ink)); routes[k] = g; return [new M.Create(g, { runTime: 1.2 })]; }),
    ...say('ONE LINE PER ROUTE OVER TIME'));

  // 3: letters beside the lines
  await until(S(3));
  await play(...hideBox(), ...swapAll(() => ({ col: C.ink }), 0.5), ...say('ROUTE LETTERS BESIDE THE LINES'));

  // 4-6: colours
  await until(S(4)); await play(...swap(0, { col: RA }, 0.5), ...say('ROUTE A: BLUE', RA));
  await until(S(5)); await play(...swap(1, { col: RB }, 0.5), ...say('ROUTE B: ORANGE', RB));
  await until(S(6)); await play(...swap(2, { col: RCv }, 0.5), ...say('ROUTE C: PURPLE', RCv));

  // 7: black and white
  await until(S(7));
  await play(...swapAll(() => ({ col: GRAY })), ...note('black-and-white view', C.ink), ...say('THE SAME CHART IN BLACK AND WHITE', C.ink));

  // 8: follow a line through a crossing (A and C cross at period 1.5, 95%)
  const cross = [(XP(0) + XP(1)) / 2, YV(95), 0];
  const crossRing = new M.Circle({ radius: 0.3, color: C.amber, strokeWidth: 3 }); crossRing.moveTo(cross);
  await until(S(8));
  await play(new M.Create(crossRing), ...say('FOLLOW ONE LINE THROUGH A CROSSING', C.amber));

  // 9: easy to switch by mistake
  await until(S(9));
  await play(new M.Indicate(crossRing, { color: C.pink }), ...note('which line is which?', C.pink),
    ...fbox([['lines look alike:', C.ink], ['easy to switch', C.pink], ['routes by mistake', C.pink]], C.pink),
    ...say('EASY TO SWITCH ROUTES BY MISTAKE', C.pink));

  // 10-11: bus signs with shapes
  const signW = P ? 1.4 : 1.15, signH = P ? 1.6 : 1.55;
  const signXs = P ? [-2.0, 0, 2.0] : [3.25, 4.55, 5.85];
  const signY = P ? 3.6 : 0.0;
  function signs(colFn) {
    return new M.VGroup(...[0, 1, 2].flatMap(k => {
      const col = colFn(k), x = signXs[k];
      const r = new M.RoundedRectangle({ width: signW, height: signH, cornerRadius: 0.12, color: col, strokeWidth: 2.5 });
      r.setFill(C.card, 0.95); r.moveTo([x, signY, 0]);
      const m = marker(SHP[k], [x, signY + 0.18], col, 2.6);
      const l = T('ABC'[k], 22, col, true, true).moveTo([x, signY - 0.5, 0]);
      return [r, m, l];
    }));
  }
  const signsCol = signs(k => COLS[k]), signsGray = signs(() => GRAY);
  await until(S(10));
  await play(...hideBox(), new M.FadeOut(crossRing), ...hideNote(), new M.FadeIn(signsCol), ...say('BUS SIGNS WITH DIFFERENT SHAPES', C.amber));

  await until(S(11));
  await play(new M.FadeOut(signsCol), new M.FadeIn(signsGray), ...note('signs in black and white: still clear', C.green), ...say('STILL CLEAR IN BLACK AND WHITE', C.green));

  // 12: give the routes marks like that
  await until(S(12));
  await play(new M.FadeOut(signsGray), ...hideNote(),
    ...fbox([['give each route', C.ink], ['its own marks', C.green]], C.green), ...say('GIVE EACH ROUTE ITS OWN MARKS', C.green));

  // 13-15: A solid + circles
  await until(S(13));
  await play(...swap(0, { col: RA, style: 'solid' }, 0.6), ...fbox([['route A:', RA], ['a line with no breaks', C.ink]], RA), ...say('A: A LINE WITH NO BREAKS', RA));
  await until(S(14));
  await play(new M.Indicate(routes[0], { color: RA, scaleFactor: 1.02 }), ...fbox([['route A:', RA], ['solid line', C.ink]], RA), ...say('A SOLID LINE', RA));
  await until(S(15));
  await play(...swap(0, { col: RA, style: 'solid', marks: true }, 0.6), ...fbox([['route A:', RA], ['solid line', C.ink], ['+ circles', C.ink]], RA), ...say('A: CIRCLES', RA));

  // 16-18: B dashed + squares
  await until(S(16));
  await play(...swap(1, { col: RB, style: 'dashed' }, 0.6), ...fbox([['route B:', RB], ['short strokes', C.ink], ['with spaces', C.ink]], RB), ...say('B: SHORT STROKES AND SPACES', RB));
  await until(S(17));
  await play(...fbox([['route B:', RB], ['dashed line', C.ink]], RB), ...say('A DASHED LINE', RB));
  await until(S(18));
  await play(...swap(1, { col: RB, style: 'dashed', marks: true }, 0.6), ...fbox([['route B:', RB], ['dashed line', C.ink], ['+ squares', C.ink]], RB), ...say('B: SQUARES', RB));

  // 19-21: C dotted + triangles
  await until(S(19));
  await play(...swap(2, { col: RCv, style: 'dotted' }, 0.6), ...fbox([['route C:', RCv], ['a row of small dots', C.ink]], RCv), ...say('C: A ROW OF SMALL DOTS', RCv));
  await until(S(20));
  await play(...fbox([['route C:', RCv], ['dotted line', C.ink]], RCv), ...say('A DOTTED LINE', RCv));
  await until(S(21));
  await play(...swap(2, { col: RCv, style: 'dotted', marks: true }, 0.6), ...fbox([['route C:', RCv], ['dotted line', C.ink], ['+ triangles', C.ink]], RCv), ...say('C: TRIANGLES', RCv));

  // 22-24: gray again, follow C
  await until(S(22));
  await play(...swapAll(k => ({ col: GRAY, style: STY[k], marks: true })), ...hideBox(), ...note('black-and-white test', C.ink), ...say('ALL GRAY AGAIN', C.ink));

  const p0 = pts(2);
  const ringT = new M.Circle({ radius: 0.3, color: C.green, strokeWidth: 3 }); ringT.moveTo(p0[0]);
  await until(S(23));
  await play(new M.Create(ringT), ...fbox([['find a triangle,', C.green], ['follow the dots', C.ink]], C.green), ...say('FIND A TRIANGLE, FOLLOW ITS DOTS', C.green));

  const ringX = new M.Circle({ radius: 0.3, color: C.green, strokeWidth: 3 }); ringX.moveTo(cross);
  const ringT2 = new M.Circle({ radius: 0.3, color: C.green, strokeWidth: 3 }); ringT2.moveTo(p0[1]);
  await until(S(24));
  await play(new M.LaggedStart([new M.Create(ringX), new M.Create(ringT2)], { lagRatio: 0.5, runTime: 1.0 }),
    ...note('through the crossing: still route C', C.green), ...say('STILL ON C AFTER THE CROSSING', C.green));

  // 25-26: accessible
  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(ringT, ringX, ringT2)),
    ...fbox([['works for more people', C.ink], ['= accessible', C.green]], C.green), ...say('ACCESSIBLE = WORKS FOR MORE PEOPLE', C.green));
  await until(S(26));
  await play(...fbox([['each route clear', C.ink], ['without telling', C.ink], ['colors apart', C.green]], C.green), ...say('NO NEED TO TELL COLORS APART', C.green));

  // 27: colours back
  await until(S(27));
  await play(...swapAll(k => ({ col: COLS[k], style: STY[k], marks: true }), 0.6), ...hideNote(), ...hideBox(), ...say('PUT THE COLORS BACK'));

  // 28-29: the key (legend): letter + line style + shape, same as the chart
  function keyCard(full, color) {
    const parts = [];
    let w, h;
    if (P) {
      w = 7.5; h = 1.0;
      const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(KEYP); parts.push(r);
      const rows = [0, 1, 2].map(k => {
        const cx = KEYP[0] + (k - 1) * 2.45, y = KEYP[1];
        const lt = T('ABC'[k], 22, COLS[k], true, true).moveTo([cx - 0.85, y, 0]);
        return new M.VGroup(lt, ...keySample(k, cx - 0.45, cx + 0.85, y, full));
      });
      return { g: new M.VGroup(...parts, ...rows), rows };
    }
    w = 4.4; h = 2.25;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(KEYP); parts.push(r);
    parts.push(T(full ? 'KEY' : 'KEY (colors only)', 17, full ? C.muted : C.pink, true, true).moveTo([KEYP[0], KEYP[1] + h / 2 - 0.3, 0]));
    const rows = [0, 1, 2].map(k => {
      const y = KEYP[1] + 0.32 - k * 0.55, x0 = KEYP[0] - w / 2;
      const lt = T('ABC'[k], 22, COLS[k], true, true).moveTo([x0 + 0.45, y, 0]);
      const words = full ? T(STY[k] + ' + ' + SHP[k], 17, C.ink, true).moveTo([x0 + 3.15, y, 0]) : T('color only', 17, C.muted, true).moveTo([x0 + 3.15, y, 0]);
      return new M.VGroup(lt, ...keySample(k, x0 + 0.8, x0 + 1.8, y, full), words);
    });
    return { g: new M.VGroup(...parts, ...rows), rows };
  }
  function keySample(k, xa, xb, y, full) {
    if (!full) { const s = new M.RoundedRectangle({ width: 0.5, height: 0.3, cornerRadius: 0.05, color: COLS[k], strokeWidth: 1 }); s.setFill(COLS[k], 1); s.moveTo([(xa + xb) / 2, y, 0]); return [s]; }
    const a = [xa, y, 0], b = [xb, y, 0], out = [];
    if (STY[k] === 'solid') out.push(line(a, b, COLS[k], 3));
    else if (STY[k] === 'dashed') for (let x = xa; x < xb - 0.05; x += 0.33) out.push(line([x, y, 0], [Math.min(xb, x + 0.2), y, 0], COLS[k], 3));
    else for (let x = xa; x <= xb + 1e-6; x += 0.13) { const d = new M.Dot({ point: [x, y, 0], radius: 0.035, color: COLS[k] }); d.setFill(COLS[k], 1); out.push(d); }
    out.push(marker(SHP[k], [(xa + xb) / 2, y], COLS[k]));
    return out;
  }
  const key = keyCard(true, C.cyan);
  await until(S(28));
  await play(new M.FadeIn(key.g), ...say('THE KEY: SAME MARKS AS THE CHART'));

  await until(S(29));
  await play(new M.Indicate(key.g, { color: C.cyan, scaleFactor: 1.03 }),
    ...fbox([['the key tells you', C.ink], ['which marks = which', C.cyan], ['route', C.cyan]], C.cyan), ...say('THE KEY: WHICH MARKS ARE WHICH ROUTE'));

  // 30-32: one route at a time
  const descr = [['A: blue, solid, circles', RA], ['B: orange, dashed, squares', RB], ['C: purple, dotted, triangles', RCv]];
  for (const k of [0, 1, 2]) {
    await until(S(k + 30));
    await play(new M.Indicate(key.rows[k], { color: COLS[k], scaleFactor: 1.08 }), new M.Indicate(routes[k], { color: COLS[k], scaleFactor: 1.02 }),
      ...fbox([descr[k]], COLS[k]), ...say(descr[k][0].toUpperCase(), COLS[k]));
  }

  // 33-34: what it is for; stand out against the background
  await until(S(33));
  await play(...fbox([['many groups', C.ink], ['in one chart?', C.ink], ['use this design', C.green]], C.green), ...say('MANY GROUPS IN ONE CHART', C.green));
  await until(S(34));
  await play(new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(routes[k], { color: C.ink, scaleFactor: 1.02 })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox([['bright lines and shapes', C.ink], ['on the dark background', C.green]], C.green), ...say('LINES AND SHAPES MUST STAND OUT', C.green));

  // 35-36: trap: a key with colors only
  const badKey = keyCard(false, C.pink);
  await until(S(35));
  await play(new M.FadeOut(key.g), new M.FadeIn(badKey.g),
    ...fbox([['trap: key with', C.pink], ['colors only', C.pink]], C.pink), ...say('TRAP: A KEY WITH COLORS ONLY', C.pink));
  const key2 = keyCard(true, C.green);
  await until(S(36));
  await play(new M.FadeOut(badKey.g), new M.FadeIn(key2.g),
    ...fbox([['key = same marks', C.green], ['as the chart', C.ink]], C.green), ...say('SAME MARKS IN KEY AND CHART', C.green));

  // 37: recap
  await until(S(37));
  await play(...fbox([['each group:', C.ink], ['own line style', C.green], ['+ own shape', C.green]], C.green), ...say('LINE STYLE + SHAPE, NOT COLOR ALONE', C.green));
}
