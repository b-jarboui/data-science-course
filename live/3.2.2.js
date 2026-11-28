// 3.2.2 Duplicate records: the key (sensor + time) finds duplicates, not equal values.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  // the six log rows (chapters/3.2.md): sensor, time, °C
  const R = [['A', '9:00', 21], ['A', '10:00', 24], ['B', '10:00', 24], ['B', '11:00', 24], ['A', '11:00', 27], ['A', '11:00', 27]];
  const TX = P ? -0.55 : -2.2, OFF = P ? 1.6 : 1.8, RW = P ? 4.9 : 5.4, RH = P ? 0.7 : 0.6;
  const HEAD_Y = P ? 1.4 : 1.15, ROW0 = HEAD_Y - (P ? 0.75 : 0.62), TS = P ? 26 : 26;
  const TAGX = P ? 2.85 : 1.15;
  const PILL = P ? [0, 2.25, 0] : [TX, 1.85, 0];
  const BOXP = P ? [0, 3.5, 0] : [4.3, 0.45, 0];
  const rowY = k => ROW0 - k * RH;
  const ink = s => s === 'A' ? C.cyan : C.violet;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
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
  const noBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // one log row = background card + three cells, each placed with moveTo
  function makeRow(r, k) {
    const y = rowY(k);
    const bg = new M.RoundedRectangle({ width: RW, height: RH * 0.84, cornerRadius: 0.1, color: C.line, strokeWidth: 1 });
    bg.setFill(C.card, 0.9); bg.moveTo([TX, y, 0]);
    const s = T(r[0], TS, ink(r[0]), true, true); s.moveTo([TX - OFF, y, 0]);
    const t = T(r[1], TS, C.ink, true); t.moveTo([TX, y, 0]);
    const v = T(String(r[2]), TS, C.ink, true, true); v.moveTo([TX + OFF, y, 0]);
    return { bg, s, t, v, all: [bg, s, t, v] };
  }
  const showRow = row => row.all.map(o => new M.FadeIn(o));
  const hideRow = row => row.all.map(o => new M.FadeOut(o));
  const tint = (row, c, o = 0.28) => row.bg.setFill(c, o);
  const plain = row => row.bg.setFill(C.card, 0.9);
  const tag = (s, c, k) => { const p = pill(s, c, 15); p.moveTo([TAGX, rowY(k), 0]); return p; };

  // 0-2 the greenhouse, two sensors, one reading per hour
  const G = P ? { x: 0, b: -1.5, w: 5.6, h: 1.8, r: 1.0 } : { x: -3.0, b: -1.7, w: 5.0, h: 1.8, r: 0.95 };
  const xl = G.x - G.w / 2, xr = G.x + G.w / 2, yt = G.b + G.h;
  const gl = (a, b) => new M.Line({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color: C.muted, strokeWidth: 3 });
  const house = [gl([xl, G.b], [xr, G.b]), gl([xl, G.b], [xl, yt]), gl([xr, G.b], [xr, yt]), gl([xl, yt], [G.x, yt + G.r]), gl([xr, yt], [G.x, yt + G.r])];
  const panes = [-1, 1].map(k => { const l = new M.Line({ start: [G.x + k * G.w / 7, G.b, 0], end: [G.x + k * G.w / 7, yt, 0], color: C.muted, strokeWidth: 1 }); l.setStrokeOpacity(0.5); return l; });
  const door = new M.Rectangle({ width: 0.6, height: 1.0, color: C.muted, strokeWidth: 2 }); door.moveTo([xl + 0.75, G.b + 0.5, 0]);
  const plants = [-1.1, -0.4, 0.4, 1.1].map(dx => { const c = new M.Circle({ radius: 0.17, color: C.green }); c.setFill(C.green, 0.55); c.moveTo([G.x + dx, G.b + 0.22, 0]); return c; });
  const pA = [xl + 0.75, G.b + 1.35, 0], pB = [xr - 0.75, G.b + 1.35, 0];
  const haloA = new M.Dot({ point: pA, radius: 0.3, color: C.cyan }); haloA.setFill(C.cyan, 0.18);
  const dA = new M.Dot({ point: pA, radius: 0.13, color: C.cyan });
  const haloB = new M.Dot({ point: pB, radius: 0.3, color: C.violet }); haloB.setFill(C.violet, 0.18);
  const dB = new M.Dot({ point: pB, radius: 0.13, color: C.violet });
  const sLabels = [T('A', 24, C.cyan, true, true).moveTo([pA[0] + 0.38, pA[1], 0]), T('B', 24, C.violet, true, true).moveTo([pB[0] - 0.38, pB[1], 0]),
    T('door', 16, C.muted).moveTo([pA[0], G.b - 0.3, 0]), T('back', 16, C.muted).moveTo([pB[0], G.b - 0.3, 0])];

  await until(S(0));
  await play(new M.FadeIn(new M.VGroup(...house, ...panes, door, ...plants)), new M.FadeIn(new M.VGroup(haloA, dA, haloB, dB)), ...say('OUR GREENHOUSE · 2 SENSORS', C.green));
  await until(S(1));
  await play(new M.FadeIn(new M.VGroup(...sLabels)), new M.Flash(dA, { color: C.cyan }), new M.Flash(dB, { color: C.violet }), ...say('A: BY THE DOOR · B: AT THE BACK'));

  const HC = P ? { lx: -3.0, hx: [-1.4, 0.6, 2.6], yA: -2.6, yB: -3.4, ax: -4.1, a0: -2.2, a1: 3.4 }
    : { lx: 1.6, hx: [2.6, 3.9, 5.2], yA: 0.4, yB: -0.5, ax: -1.2, a0: 2.0, a1: 5.8 };
  const chart = [new M.Line({ start: [HC.a0, HC.ax, 0], end: [HC.a1, HC.ax, 0], color: C.muted, strokeWidth: 2 })];
  HC.hx.forEach((x, i) => chart.push(T(['9:00', '10:00', '11:00'][i], P ? 17 : 16, C.muted, true).moveTo([x, HC.ax - 0.32, 0])));
  chart.push(T('A', 22, C.cyan, true, true).moveTo([HC.lx, HC.yA, 0]), T('B', 22, C.violet, true, true).moveTo([HC.lx, HC.yB, 0]));
  const hdots = [];
  HC.hx.forEach(x => hdots.push(new M.Dot({ point: [x, HC.yA, 0], radius: 0.11, color: C.cyan }), new M.Dot({ point: [x, HC.yB, 0], radius: 0.11, color: C.violet })));
  await until(S(2));
  await play(new M.FadeIn(new M.VGroup(...chart)), new M.LaggedStart(hdots.map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 2.0 }), ...say('1 READING PER SENSOR, EVERY HOUR'));

  // 3 the log table
  const hs = P ? 20 : 18;
  const head = [T('sensor', hs, C.muted).moveTo([TX - OFF, HEAD_Y, 0]), T('time', hs, C.muted).moveTo([TX, HEAD_Y, 0]), T('°C', hs, C.muted).moveTo([TX + OFF, HEAD_Y, 0])];
  const headLine = new M.Line({ start: [TX - RW / 2, HEAD_Y - (P ? 0.32 : 0.26), 0], end: [TX + RW / 2, HEAD_Y - (P ? 0.32 : 0.26), 0], color: C.muted, strokeWidth: 2 });
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...house, ...panes, door, ...plants, haloA, dA, haloB, dB, ...sLabels, ...chart, ...hdots)),
    new M.FadeIn(new M.VGroup(...head, headLine)), ...say('THE LOG: 6 ROWS, 9:00 TO 11:00'));

  // 4-9 one row per sentence
  const rows = R.map((r, k) => makeRow(r, k));
  for (let k = 0; k < 6; k++) {
    await until(S(4 + k));
    const extra = k === 5 ? [new M.Indicate(rows[4].t, { color: C.pink }), new M.Indicate(rows[4].v, { color: C.pink })] : [];
    await play(...showRow(rows[k]), ...extra);
  }

  // 10-12 some values repeat
  await until(S(10));
  await play(new M.LaggedStart(rows.map(r => new M.Indicate(r.v, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('SOME VALUES APPEAR MORE THAN ONCE', C.amber));
  await until(S(11));
  [1, 2, 3].forEach(i => tint(rows[i], C.amber)); [4, 5].forEach(i => tint(rows[i], C.pink));
  await play(new M.LaggedStart([1, 2, 3, 4, 5].map(i => new M.Indicate(rows[i].v, { color: i < 4 ? C.amber : C.pink })), { lagRatio: 0.3, runTime: 2.4 }),
    ...fbox([['24 → 3 times', C.amber], ['27 → 2 times', C.pink]], C.amber));
  await until(S(12));
  rows.forEach(plain);
  await play(...noBox(), ...say('WHICH ROWS ARE MISTAKES?', C.amber));

  // 13-14 what a duplicate is, and how it happens
  await until(S(13)); await play(...say('DUPLICATE = SAME READING, SAVED TWICE', C.pink));
  const DG = P ? { cx: 0, cy: -4.45, hx: 2.9, dy: 0.6 } : { cx: 3.6, cy: -0.4, hx: 2.5, dy: 0.55 };
  const sx = DG.cx - DG.hx, cxr = DG.cx + DG.hx - 0.65, x1 = sx + 0.25, x2 = cxr - 0.7, xm = (x1 + x2) / 2;
  const sDot = new M.Dot({ point: [sx, DG.cy, 0], radius: 0.14, color: C.cyan });
  const sLab = T('A', 20, C.cyan, true, true); sLab.moveTo([sx, DG.cy - 0.38, 0]);
  const comp = new M.Rectangle({ width: 1.3, height: 2 * DG.dy + 0.5, color: C.ink, strokeWidth: 2 }); comp.setFill(C.card, 0.9); comp.moveTo([cxr, DG.cy, 0]);
  const compLab = T('computer', 14, C.muted); compLab.moveTo([cxr, DG.cy, 0]);
  const a1 = new M.Arrow({ start: [x1, DG.cy + DG.dy, 0], end: [x2, DG.cy + DG.dy, 0], color: C.cyan });
  const l1 = T('27', 16, C.cyan, true); l1.moveTo([xm, DG.cy + DG.dy + 0.2, 0]);
  const back = new M.DashedLine({ start: [x2, DG.cy, 0], end: [x1, DG.cy, 0], color: C.muted });
  const l2 = T('no reply ✗', 15, C.pink); l2.moveTo([xm, DG.cy + 0.2, 0]);
  const a2 = new M.Arrow({ start: [x1, DG.cy - DG.dy, 0], end: [x2, DG.cy - DG.dy, 0], color: C.cyan });
  const l3 = T('27 again', 16, C.cyan, true); l3.moveTo([xm, DG.cy - DG.dy + 0.2, 0]);
  await until(S(14));
  await play(new M.LaggedStart([new M.FadeIn(new M.VGroup(sDot, sLab, comp, compLab)), new M.Create(a1), new M.FadeIn(l1), new M.Create(back), new M.FadeIn(l2),
    new M.Create(a2), new M.FadeIn(l3), new M.Indicate(rows[5].v, { color: C.pink })], { lagRatio: 0.8, runTime: Math.max(4, E(14) - S(14) - 0.5) }),
    ...say('SENT, NO REPLY, SENT AGAIN', C.pink));

  // 15-18 sensor B: same value, different times
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(sDot, sLab, comp, compLab, a1, l1, back, l2, a2, l3)), ...say('SAME NUMBER TWICE: NOT ENOUGH', C.amber));
  await until(S(16));
  tint(rows[2], C.violet); tint(rows[3], C.violet);
  await play(new M.Indicate(rows[2].v, { color: C.violet }), new M.Indicate(rows[3].v, { color: C.violet }), ...say('SENSOR B: 24 AT 10:00, 24 AT 11:00', C.violet));
  const tB = [tag('REAL', C.green, 2), tag('REAL', C.green, 3)];
  await until(S(17));
  await play(...tB.map(t => new M.FadeIn(t)), new M.Indicate(rows[2].t, { color: C.violet }), new M.Indicate(rows[3].t, { color: C.violet }), ...say('2 DIFFERENT TIMES · 2 REAL READINGS', C.green));
  await until(S(18));
  await play(...say('REPEATED MEASUREMENT', C.green), ...fbox([['repeated measurement =', C.green], 'a real reading that', 'gives the same value'], C.green));

  // 19-20 ten o'clock: same time, two sensors
  await until(S(19));
  plain(rows[2]); plain(rows[3]); tint(rows[1], C.cyan); tint(rows[2], C.violet);
  await play(new M.FadeOut(new M.VGroup(...tB)), ...noBox(), new M.Indicate(rows[1].t), new M.Indicate(rows[2].t), ...say('10:00: A AND B BOTH READ 24'));
  const tA = [tag('REAL', C.green, 1), tag('REAL', C.green, 2)];
  await until(S(20));
  await play(...tA.map(t => new M.FadeIn(t)), new M.Indicate(rows[1].s, { color: C.cyan }), new M.Indicate(rows[2].s, { color: C.violet }), ...say('SAME TIME · 2 SENSORS · BOTH REAL', C.green));

  // 21-23 the key
  await until(S(21));
  plain(rows[1]); plain(rows[2]);
  await play(new M.FadeOut(new M.VGroup(...tA)), new M.LaggedStart(rows.flatMap(r => [new M.Indicate(r.s), new M.Indicate(r.t)]), { lagRatio: 0.1, runTime: 2.0 }),
    ...say('SENSOR + TIME, TOGETHER', C.amber));
  await until(S(22));
  await play(...fbox([['key =', C.amber], 'the columns that, together,', 'pick out exactly one row'], C.amber), ...say('THE KEY, FROM THE LAST CHAPTER', C.amber));
  const kl = TX - RW / 2 - 0.1, kr = TX + OFF / 2 + 0.05, ktop = HEAD_Y + 0.3, kbot = rowY(5) - RH / 2 - 0.06;
  let keyBox = new M.RoundedRectangle({ width: kr - kl, height: ktop - kbot, cornerRadius: 0.14, color: C.amber, strokeWidth: 3 });
  keyBox.moveTo([(kl + kr) / 2, (ktop + kbot) / 2, 0]);
  // key outline for a table of n rows; slide a row to slot k (used when a row is removed, so no gap stays)
  const keyBoxN = n => {
    const kb = rowY(n - 1) - RH / 2 - 0.06;
    const b = new M.RoundedRectangle({ width: kr - kl, height: ktop - kb, cornerRadius: 0.14, color: C.amber, strokeWidth: 3 });
    b.moveTo([(kl + kr) / 2, (ktop + kb) / 2, 0]); return b;
  };
  // swap the key outline for one of n rows (fade, not morph, so the outline stays clean)
  const resizeKey = n => { const old = keyBox; keyBox = keyBoxN(n); return [new M.FadeOut(old, { runTime: 0.5 }), new M.FadeIn(keyBox, { runTime: 0.6 })]; };
  const shiftRow =(row, r, k) => { const tg = makeRow(r, k); return row.all.map((o, j) => new M.Transform(o, tg.all[j], { runTime: 0.8 })); };
  await until(S(23));
  await play(new M.Create(keyBox), ...say('KEY = SENSOR + TIME', C.amber), ...fbox([['key = sensor + time', C.amber], 'one row per sensor,', 'for each hour'], C.amber));

  // 24 sort by key: A 9, A 10, A 11, A 11, B 10, B 11
  const slot = [0, 1, 4, 5, 2, 3];
  const moves = [];
  rows.forEach((r, i) => {
    if (slot[i] === i) return;
    const tg = makeRow(R[i], slot[i]);
    r.all.forEach((o, j) => moves.push(new M.Transform(o, tg.all[j], { pathArc: 1.6, runTime: 1.8 })));
  });
  await until(S(24));
  await play(...noBox(), ...moves, ...say('SORT BY KEY · LOOK FOR REPEATS', C.amber));

  // 25-27 count each key
  const c1 = [0, 1, 2, 3].map(i => tag('×1', C.green, slot[i]));
  await until(S(25));
  await play(new M.LaggedStart(c1.map(t => new M.FadeIn(t)), { lagRatio: 1, runTime: Math.max(3, E(25) - S(25) - 0.4) }), ...say('EACH KEY: ONCE', C.green));
  await until(S(26));
  tint(rows[4], C.pink); tint(rows[5], C.pink);
  const t2 = tag('×2', C.pink, 2.5);
  await play(new M.FadeIn(t2), new M.Indicate(rows[4].t, { color: C.pink }), new M.Indicate(rows[5].t, { color: C.pink }), ...say('A AT 11:00 TWICE: THE ONLY DUPLICATE', C.pink));
  await until(S(27));
  plain(rows[4]);
  const t1 = tag('×1', C.green, 2); c1.push(t1);
  await play(...hideRow(rows[5]), new M.FadeOut(t2), new M.FadeIn(t1), ...say('KEEP ONE COPY, REMOVE THE OTHER', C.green));

  // 28-33 sensor A's mean, with and without the duplicate
  const NL = P ? { y: -4.6, x0: -3.2, x1: 3.2 } : { y: -2.0, x0: 2.6, x1: 6.0 };
  const v2x = v => NL.x0 + (v - 20.5) / 7 * (NL.x1 - NL.x0);
  const nl = new M.Line({ start: [NL.x0 - 0.15, NL.y, 0], end: [NL.x1 + 0.15, NL.y, 0], color: C.muted, strokeWidth: 3 });
  const nlUnit = T('°C', 16, C.muted); nlUnit.moveTo([NL.x1 + 0.45, NL.y, 0]);
  const dotAt = (v, up, c) => new M.Dot({ point: [v2x(v), NL.y + 0.25 + up * 0.42, 0], radius: 0.11, color: c });
  const d21 = dotAt(21, 0, C.cyan), d24 = dotAt(24, 0, C.cyan), d27 = dotAt(27, 0, C.cyan), dupDot = dotAt(27, 1, C.pink);
  const dl = [T('21', 16, C.cyan, true).moveTo([v2x(21), NL.y + 0.65, 0]), T('24', 16, C.cyan, true).moveTo([v2x(24), NL.y + 0.65, 0]),
    T('27', 16, C.cyan, true).moveTo([v2x(27) + 0.38, NL.y + 0.25, 0])];
  const marker = (v, c) => new M.Arrow({ start: [v2x(v), NL.y - 0.5, 0], end: [v2x(v), NL.y - 0.06, 0], color: c });
  const mP = marker(24.75, C.pink), mPl = T('24.75', 16, C.pink, true); mPl.moveTo([v2x(24.75) + 0.42, NL.y - 0.62, 0]);
  const mG = marker(24, C.green), mGl = T('24', 16, C.green, true); mGl.moveTo([v2x(24) - 0.3, NL.y - 0.62, 0]);

  await until(S(28));
  rows[5] = makeRow(R[5], 3); tint(rows[5], C.pink);
  [0, 1, 4].forEach(i => tint(rows[i], C.cyan, 0.22));
  await play(new M.FadeOut(new M.VGroup(...c1)), ...showRow(rows[5]), new M.Create(nl), new M.FadeIn(nlUnit),
    new M.LaggedStart([d21, d24, d27, dupDot].map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 1.6 }), new M.FadeIn(new M.VGroup(...dl)),
    ...say('SENSOR A’S MEAN · DUPLICATE STILL IN'));
  await until(S(29));
  await play(new M.LaggedStart([0, 1, 4, 5].map(i => new M.Indicate(rows[i].v, { color: C.amber })), { lagRatio: 0.4, runTime: 2.4 }),
    ...fbox(['21 + 24 + 27 + 27', ['= 99', C.amber]]));
  await until(S(30));
  await play(new M.Create(mP), new M.FadeIn(mPl), ...fbox(['21 + 24 + 27 + 27 = 99', ['99 ÷ 4 = 24.75', C.pink]], C.pink));
  await until(S(31));
  await play(...hideRow(rows[5]), new M.FadeOut(dupDot), ...fbox(['without the copy:', ['21 + 24 + 27 = 72', C.amber]], C.green), ...say('WITHOUT THE DUPLICATE', C.green));
  await until(S(32));
  await play(new M.Create(mG), new M.FadeIn(mGl), ...fbox(['21 + 24 + 27 = 72', ['72 ÷ 3 = 24', C.green]], C.green));
  const dup2 = dotAt(27, 1, C.pink);
  await until(S(33));
  await play(new M.FadeIn(dup2), new M.Flash(dup2, { color: C.pink }), new M.Indicate(mPl, { color: C.pink }),
    ...fbox([['with the copy:  24.75', C.pink], ['each once:      24', C.green]], C.pink), ...say('COUNTED TWICE → MEAN PULLED UP', C.pink));

  // 34-36 the rule, how to find, what it is for
  await until(S(34));
  [0, 1].forEach(i => plain(rows[i])); tint(rows[4], C.pink);
  rows[5] = makeRow(R[5], 3); tint(rows[5], C.pink);
  await play(new M.FadeOut(new M.VGroup(nl, nlUnit, d21, d24, d27, dup2, ...dl, mP, mPl, mG, mGl)), ...showRow(rows[5]),
    ...fbox([['duplicate =', C.pink], 'same key (sensor + time)', 'and every value the same'], C.pink), ...say('DUPLICATE: SAME KEY + SAME VALUES', C.pink));
  await until(S(35));
  await play(new M.Indicate(rows[4].s), new M.Indicate(rows[4].t), new M.Indicate(rows[5].s), new M.Indicate(rows[5].t),
    ...fbox([['to find duplicates:', C.amber], '1. sort by the key', '2. look for a key twice'], C.amber), ...say('SORT BY KEY → FIND REPEATS', C.amber));
  await until(S(36));
  plain(rows[4]);
  const c3 = [0, 1, 2, 3, 4].map(k => tag('×1', C.green, k));
  await play(...hideRow(rows[5]), ...noBox(), ...shiftRow(rows[2], R[2], 3), ...shiftRow(rows[3], R[3], 4), ...resizeKey(5),
    ...say('EVERY REAL READING COUNTS ONCE', C.green));
  await play(new M.LaggedStart(c3.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.4 }));

  // 37-38 trap 1: removing rows by equal temperature
  await until(S(37));
  [1, 2, 3].forEach(i => tint(rows[i], C.pink));
  await play(new M.FadeOut(new M.VGroup(...c3)), new M.LaggedStart([1, 2, 3].map(i => new M.Indicate(rows[i].v, { color: C.pink })), { lagRatio: 0.3, runTime: 1.8 }),
    ...say('TRAP: REMOVING ROWS WITH EQUAL °C', C.pink));
  const lost = [tag('LOST', C.pink, 3), tag('LOST', C.pink, 4)];
  await until(S(38));
  await play(...hideRow(rows[2]), ...hideRow(rows[3]), ...lost.map(t => new M.FadeIn(t)),
    ...fbox(['three 24s → one 24', ['2 real readings lost', C.pink]], C.pink), ...say('TWO REAL READINGS LOST', C.pink));

  // 39-40 trap 2: same key, different values
  await until(S(39));
  plain(rows[1]);
  rows[2] = makeRow(R[2], 4); rows[3] = makeRow(R[3], 5);
  const cf = makeRow(['A', '11:00', 28], 3); tint(cf, C.amber); tint(rows[4], C.amber);
  const sk = tag('SAME KEY', C.amber, 2.5);
  await play(new M.FadeOut(new M.VGroup(...lost)), ...noBox(), ...showRow(rows[2]), ...showRow(rows[3]), ...showRow(cf), new M.FadeIn(sk),
    ...resizeKey(6),
    ...say('TRAP 2: SAME KEY, DIFFERENT VALUES', C.amber));
  await until(S(40));
  await play(new M.Indicate(rows[4].v, { color: C.amber }), new M.Indicate(cf.v, { color: C.amber }),
    ...fbox(['same key, different values', ['= a conflict: check it', C.amber]], C.amber), ...say('NOT A DUPLICATE: A CONFLICT', C.amber));

  // 41 recap
  await until(S(41));
  plain(rows[4]);
  await play(...hideRow(cf), new M.FadeOut(sk), ...shiftRow(rows[2], R[2], 3), ...shiftRow(rows[3], R[3], 4), ...resizeKey(5),
    ...fbox([['key: sensor + time', C.amber], ['not the values alone', C.pink]], C.green), ...say('FIND DUPLICATES BY THE KEY, NOT THE VALUES', C.green));
}
