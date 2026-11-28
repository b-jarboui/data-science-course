// 11.2.1 Naive forecasts (live lesson in site/live/engine.js).
// Beat i = sentence i (0-based, 46 sentences).
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;

  // Shared hotel data (chapters/11.2.md)
  const THIS_YR = [20, 24, 20, 23, 24, 29];
  const REAL7 = 35;

  // Layout: phone 8 x 14.22 (y -5.5..4.3), laptop 14.22 x 8 (y -3.0..2.3)
  const X0 = P ? -2.95 : -5.5, X1 = P ? 3.55 : 1.85;
  const CX = (X0 + X1) / 2;
  const CY0 = P ? -5.55 : -2.45, CY1 = P ? 1.25 : 1.6;
  const PILL = P ? [0, 2.15, 0] : [CX, 2.02, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.65, -0.3, 0];
  const colW = (X1 - X0) / 8;
  const wx = w => X0 + (w - 0.5) * colW;
  const roomY = r => CY0 + (r / 40) * (CY1 - CY0);
  const pt = (w, r, z = 0) => [wx(w), roomY(r), z];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);
  const LAB = P ? 18 : 17;
  const AX = P ? 16 : 15;

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // ---------- 0-3 the hotel: 40 rooms ----------
  const GC = 8, GR = 5, gs = P ? 0.88 : 0.62, gq = P ? 0.68 : 0.48;
  const GCEN = P ? [0, -2.55, 0] : [CX, -0.4, 0];
  const roomPos = k => { const r = Math.floor(k / GC), c = k % GC; return [GCEN[0] + (c - (GC - 1) / 2) * gs, GCEN[1] + ((GR - 1) / 2 - r) * gs, 0]; };
  const rooms = Array.from({ length: 40 }, (_, k) => {
    const q = new M.Square({ sideLength: gq, color: C.muted, strokeWidth: 1.5 });
    q.setFill(C.card, 0.9); q.moveTo(roomPos(k)); return q;
  });
  const roof = new M.Polygon({ vertices: [[GCEN[0] - GC * gs / 2 - 0.15, GCEN[1] + GR * gs / 2 + 0.05, 0], [GCEN[0], GCEN[1] + GR * gs / 2 + 0.75, 0], [GCEN[0] + GC * gs / 2 + 0.15, GCEN[1] + GR * gs / 2 + 0.05, 0]], color: C.violet, strokeWidth: 2 });
  await until(S(0));
  await play(new M.Create(roof, { runTime: 0.8 }), new M.LaggedStart(rooms.map(q => new M.FadeIn(q, { runTime: 0.3 })), { lagRatio: 0.04, runTime: 1.6 }),
    ...say('A SMALL HOTEL: 40 ROOMS', C.violet));

  const taken = Array.from({ length: 20 }, (_, k) => {
    const q = new M.Square({ sideLength: gq, color: C.cyan, strokeWidth: 1.5 });
    q.setFill(C.cyan, 0.8); q.moveTo(roomPos(k)); return q;
  });
  const cnt = T('20 of 40 rooms taken', P ? 22 : 20, C.cyan, true, true);
  cnt.moveTo([GCEN[0], GCEN[1] - GR * gs / 2 - (P ? 0.75 : 0.55), 0]);
  await until(S(1));
  await play(new M.LaggedStart(taken.map(q => new M.FadeIn(q, { runTime: 0.3 })), { lagRatio: 0.06, runTime: 1.8 }),
    new M.FadeIn(cnt, { runTime: 0.6 }), ...say('COUNT EVERY SATURDAY NIGHT', C.cyan), ...fbox(['Saturday, week 1', ['20 rooms taken', C.cyan]], C.cyan));

  await until(S(2));
  await play(new M.LaggedStart(taken.map(q => new M.Indicate(q, { color: C.cyan, runTime: 0.5 })), { lagRatio: 0.03, runTime: 1.4 }),
    ...say('OCCUPIED = GUESTS USE THE ROOM', C.cyan), ...fbox([['occupied', C.cyan], '= guests are using it'], C.cyan));

  await until(S(3));
  await play(...say('CHRISTMAS SOON: PLAN THE STAFF', C.amber), ...fbox(['next week = Christmas', ['how many staff?', C.amber]], C.amber));

  // ---------- 4 chart ----------
  const axisParts = [];
  axisParts.push(new M.Line({ start: [X0, CY0, 0], end: [X1, CY0, 0], color: C.muted, strokeWidth: 2 }));
  axisParts.push(new M.Line({ start: [X0, CY0, 0], end: [X0, CY1, 0], color: C.muted, strokeWidth: 2 }));
  for (const r of [0, 10, 20, 30, 40]) {
    const y = roomY(r);
    if (r > 0) { const gl = new M.Line({ start: [X0, y, -0.015], end: [X1, y, -0.015], color: C.grid, strokeWidth: 1 }); axisParts.push(gl); }
    const lb = T(String(r), AX, C.muted, true); lb.moveTo([X0 - 0.32, y, 0]); axisParts.push(lb);
  }
  const yTitle = T('rooms', AX, C.muted); yTitle.moveTo([X0 - 0.3, CY1 + 0.24, 0]); axisParts.push(yTitle);
  const wkNames = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  for (let w = 1; w <= 8; w++) {
    const lb = T(wkNames[w - 1], AX, w >= 7 ? C.amber : C.muted, true); lb.moveTo([wx(w), CY0 - 0.24, 0]); axisParts.push(lb);
  }
  const xTitle = T('weeks →', AX, C.muted); xTitle.moveTo([X1 - 0.45, CY0 - 0.55, 0]); axisParts.push(xTitle);
  const axes = new M.VGroup(...axisParts);

  const dots = THIS_YR.map((v, i) => new M.Dot({ point: pt(i + 1, v, 0.01), radius: 0.085, color: C.cyan }));
  const labs = THIS_YR.map((v, i) => { const t = T(String(v), LAB, C.cyan, true); t.moveTo([wx(i + 1), roomY(v) - 0.27, 0]); return t; });
  const segs = THIS_YR.slice(0, -1).map((v, i) => new M.Line({ start: pt(i + 1, v, 0.004), end: pt(i + 2, THIS_YR[i + 1], 0.004), color: C.cyan, strokeWidth: 3 }));

  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(roof, ...rooms, ...taken, cnt), { runTime: 0.6 }), new M.FadeIn(axes, { runTime: 0.9 }),
    ...say('ONE DOT PER WEEK', C.cyan), ...fbox(['left → right = weeks', 'up = rooms taken'], C.cyan));

  // 5-11 weeks 1..6 (week 3 storm in beat 8)
  const wkBeat = [5, 6, 7, 9, 10, 11];
  const wkSay = ['WEEK 1: 20 ROOMS', 'WEEK 2: 24', 'WEEK 3: 20', 'WEEK 4: 23', 'WEEK 5: 24', 'WEEK 6: 29'];
  for (let i = 0; i < 6; i++) {
    await until(S(wkBeat[i]));
    const extra = i > 0 ? [new M.Create(segs[i - 1], { runTime: 0.5 })] : [];
    await play(...extra, new M.FadeIn(dots[i], { runTime: 0.5 }), new M.FadeIn(labs[i], { runTime: 0.5 }), new M.Flash(dots[i], { color: C.cyan, runTime: 0.7 }), ...say(wkSay[i], C.cyan));
    if (i === 2) {
      await until(S(8));
      const storm = T('storm: road closed', P ? 17 : 15, C.pink, true); storm.moveTo([wx(3), roomY(13.5), 0]);
      await play(new M.FadeIn(storm, { runTime: 0.5 }), new M.Indicate(labs[2], { color: C.pink, runTime: 0.9 }), ...say('A STORM CLOSED THE ROAD', C.pink));
      await until(S(9) - 0.4);
      await play(new M.FadeOut(storm, { runTime: 0.4 }));
    }
  }

  // 12 week 7 hidden
  const hidBox = new M.RoundedRectangle({ width: colW * 0.85, height: roomY(39) - roomY(31), cornerRadius: 0.12, color: C.muted, strokeWidth: 1.8 });
  hidBox.setFill(C.card, 0.85); hidBox.moveTo(pt(7, 35));
  const hidQ = T('?', 26, C.muted, true, true); hidQ.moveTo(pt(7, 35));
  const nowLine = new M.DashedLine({ start: [(wx(6) + wx(7)) / 2, CY0, 0], end: [(wx(6) + wx(7)) / 2, CY1, 0], color: C.muted });
  const nowLab = T('now', AX, C.muted, true); nowLab.moveTo([(wx(6) + wx(7)) / 2, CY0 - 0.55, 0]);
  await until(S(12));
  await play(new M.FadeIn(hidBox, { runTime: 0.6 }), new M.FadeIn(hidQ, { runTime: 0.6 }), new M.Create(nowLine, { runTime: 0.6 }), new M.FadeIn(nowLab, { runTime: 0.6 }),
    ...say('END OF WEEK 6: WEEK 7 IS HIDDEN', C.muted), ...fbox(['now = end of week 6', ['week 7 = ?', C.amber]], C.muted));

  await until(S(13));
  await play(new M.Indicate(hidQ, { color: C.amber, runTime: 1.0 }), ...say('HOW MANY ROOMS NEXT WEEK?', C.amber));

  await until(S(14));
  await play(...say('FORECAST = A GUESS ABOUT THE FUTURE', C.amber), ...fbox([['forecast', C.amber], '= a guess about', '  a future count'], C.amber));

  await until(S(15));
  await play(new M.Indicate(dots[5], { color: C.amber, runTime: 1.0 }), new M.Indicate(labs[5], { color: C.amber, runTime: 1.0 }), ...say('NEXT WEEK = THIS WEEK?', C.amber));

  // 16-18 flat dashed line at 29
  const flat = new M.DashedLine({ start: pt(6, 29, 0.012), end: pt(8, 29, 0.012), color: C.amber });
  const ring7 = new M.Circle({ radius: 0.11, color: C.amber, strokeWidth: 3 }); ring7.setFill(C.amber, 0.25); ring7.moveTo(pt(7, 29, 0.015));
  const ring8 = new M.Circle({ radius: 0.11, color: C.amber, strokeWidth: 3 }); ring8.setFill(C.amber, 0.25); ring8.moveTo(pt(8, 29, 0.015));
  const f7 = T('29', LAB, C.amber, true, true); f7.moveTo([wx(7), roomY(29) - 0.3, 0]);
  const f8 = T('29', LAB, C.amber, true, true); f8.moveTo([wx(8), roomY(29) - 0.3, 0]);
  await until(S(16));
  await play(new M.Create(flat, { runTime: 0.9 }), new M.FadeIn(ring7, { runTime: 0.6 }), new M.FadeIn(f7, { runTime: 0.6 }),
    ...say('FLAT LINE FROM THE LAST DOT: 29', C.amber), ...fbox(['last count = 29', ['week 7 forecast = 29', C.amber]], C.amber));

  await until(S(17));
  await play(new M.Indicate(dots[5], { color: C.amber, runTime: 1.0 }), ...say('NAIVE FORECAST: ONLY THE LATEST COUNT', C.amber),
    ...fbox([['naive forecast', C.amber], 'uses only the', 'latest count'], C.amber));

  await until(S(18));
  await play(new M.FadeIn(ring8, { runTime: 0.6 }), new M.FadeIn(f8, { runTime: 0.6 }), new M.Flash(ring8, { color: C.amber, runTime: 0.8 }),
    ...say('WEEK 8 FORECAST: ALSO 29', C.amber), ...fbox(['week 7 forecast = 29', ['week 8 forecast = 29', C.amber]], C.amber));

  // 19 test on earlier weeks: hide weeks 2..6
  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(flat, ring7, ring8, f7, f8, ...dots.slice(1), ...labs.slice(1), ...segs), { runTime: 0.8 }),
    ...say('TEST THE RULE ON PAST WEEKS', C.violet), ...fbox(['hide each real count', ['guess first, then reveal', C.violet]], C.violet));

  // per-week test
  const ERR_Y = P ? roomY(37.3) : roomY(37.3);
  const errTitle = T('errors:', 16, C.muted, true); errTitle.moveTo([wx(1), ERR_Y, 0]);
  const errLabs = [];
  let tmp = [];
  function guessParts(w) {
    const f = THIS_YR[w - 2];
    const dash = new M.DashedLine({ start: pt(w - 1, f, 0.012), end: pt(w, f, 0.012), color: C.amber });
    const ring = new M.Circle({ radius: 0.11, color: C.amber, strokeWidth: 3 }); ring.setFill(C.amber, 0.25); ring.moveTo(pt(w, f, 0.015));
    return { dash, ring, f };
  }
  function errParts(w, f) {
    const v = THIS_YR[w - 1], e = v - f;
    const col = e >= 0 ? C.green : C.pink;
    const seg = new M.Line({ start: [wx(w) + 0.2, roomY(f), 0.02], end: [wx(w) + 0.2, roomY(v), 0.02], color: col, strokeWidth: 4 });
    const lab = T((e > 0 ? '+' : e < 0 ? '−' : '') + Math.abs(e), LAB, col, true, true); lab.moveTo([wx(w), ERR_Y, 0]);
    return { seg, lab, e, v };
  }
  // fresh copies (objects that were faded out do not come back reliably)
  for (let i = 1; i < 6; i++) {
    dots[i] = new M.Dot({ point: pt(i + 1, THIS_YR[i], 0.01), radius: 0.085, color: C.cyan });
    labs[i] = T(String(THIS_YR[i]), LAB, C.cyan, true); labs[i].moveTo([wx(i + 1), roomY(THIS_YR[i]) - 0.27, 0]);
    segs[i - 1] = new M.Line({ start: pt(i, THIS_YR[i - 1], 0.004), end: pt(i + 1, THIS_YR[i], 0.004), color: C.cyan, strokeWidth: 3 });
  }
  async function reveal(w) { // dot + label + segment line of week w
    return [new M.Create(segs[w - 2], { runTime: 0.5 }), new M.FadeIn(dots[w - 1], { runTime: 0.5 }), new M.FadeIn(labs[w - 1], { runTime: 0.5 }), new M.Flash(dots[w - 1], { color: C.cyan, runTime: 0.7 })];
  }

  // week 2 in detail (20-25)
  let g = guessParts(2);
  await until(S(20));
  await play(new M.Create(g.dash, { runTime: 0.6 }), new M.FadeIn(g.ring, { runTime: 0.6 }), ...say('GUESS WEEK 2: COPY 20', C.amber),
    ...fbox(['week 1 = 20', ['forecast week 2 = 20', C.amber]], C.amber));
  await until(S(21));
  await play(...(await reveal(2)), ...say('REAL WEEK 2: 24', C.cyan), ...fbox(['forecast = 20', ['real     = 24', C.cyan]], C.cyan));
  let er = errParts(2, g.f);
  await until(S(22));
  await play(new M.Create(er.seg, { runTime: 0.7 }), new M.Indicate(er.seg, { color: C.green, runTime: 1.0 }), ...say('THE GAP = HOW FAR IT MISSED', C.green));
  await until(S(23));
  await play(...say('REAL − FORECAST', C.green), ...fbox([['error =', C.green], '  real − forecast'], C.green));
  await until(S(24));
  await play(new M.FadeIn(errTitle, { runTime: 0.5 }), ...say('THIS IS THE FORECAST ERROR', C.green));
  await until(S(25));
  await play(new M.FadeIn(er.lab, { runTime: 0.6 }), ...say('24 − 20 = +4 ROOMS', C.green), ...fbox(['real − forecast', ['24 − 20 = +4', C.green]], C.green));
  errLabs.push(er.lab); tmp = [g.dash, g.ring, er.seg];

  // week 3 (26-29)
  g = guessParts(3);
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...tmp), { runTime: 0.4 }), new M.Create(g.dash, { runTime: 0.6 }), new M.FadeIn(g.ring, { runTime: 0.6 }),
    ...say('GUESS WEEK 3: COPY 24', C.amber), ...fbox(['week 2 = 24', ['forecast week 3 = 24', C.amber]], C.amber));
  await until(S(27));
  await play(...(await reveal(3)), ...say('REAL WEEK 3: 20 (STORM)', C.cyan));
  er = errParts(3, g.f);
  await until(S(28));
  await play(new M.Create(er.seg, { runTime: 0.6 }), new M.FadeIn(er.lab, { runTime: 0.6 }), ...say('20 − 24 = −4 ROOMS', C.pink),
    ...fbox(['real − forecast', ['20 − 24 = −4', C.pink]], C.pink));
  await until(S(29));
  await play(new M.Indicate(er.lab, { color: C.pink, runTime: 1.0 }), ...say('MINUS = FORECAST TOO HIGH', C.pink),
    ...fbox([['minus error', C.pink], '= forecast too high'], C.pink));
  errLabs.push(er.lab); tmp = [g.dash, g.ring, er.seg];

  // week 4 (30-31)
  g = guessParts(4);
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(...tmp), { runTime: 0.4 }), new M.Create(g.dash, { runTime: 0.6 }), new M.FadeIn(g.ring, { runTime: 0.6 }),
    ...say('GUESS WEEK 4: COPY 20', C.amber), ...fbox(['week 3 = 20', ['forecast week 4 = 20', C.amber]], C.amber));
  er = errParts(4, g.f);
  await until(S(31));
  await play(...(await reveal(4)), new M.Create(er.seg, { runTime: 0.6 }), new M.FadeIn(er.lab, { runTime: 0.6 }),
    ...say('REAL 23: ERROR +3', C.green), ...fbox(['real − forecast', ['23 − 20 = +3', C.green]], C.green));
  errLabs.push(er.lab); tmp = [g.dash, g.ring, er.seg];

  // week 5 (32), week 6 (33)
  for (const [w, b, txt] of [[5, 32, 'WEEK 5: 1 ROOM LOW (+1)'], [6, 33, 'WEEK 6: 5 ROOMS LOW (+5)']]) {
    g = guessParts(w); er = errParts(w, g.f);
    await until(S(b));
    await play(new M.FadeOut(new M.VGroup(...tmp), { runTime: 0.4 }), new M.Create(g.dash, { runTime: 0.5 }), new M.FadeIn(g.ring, { runTime: 0.5 }));
    await play(...(await reveal(w)), new M.Create(er.seg, { runTime: 0.5 }), new M.FadeIn(er.lab, { runTime: 0.5 }),
      ...say(txt, C.green), ...fbox([`forecast ${g.f}, real ${er.v}`, [`${er.v} − ${g.f} = +${er.e}`, C.green]], C.green));
    errLabs.push(er.lab); tmp = [g.dash, g.ring, er.seg];
  }

  // 34-36 Christmas
  const f7b = new M.DashedLine({ start: pt(6, 29, 0.012), end: pt(7, 29, 0.012), color: C.amber });
  const r7b = new M.Circle({ radius: 0.11, color: C.amber, strokeWidth: 3 }); r7b.setFill(C.amber, 0.25); r7b.moveTo(pt(7, 29, 0.015));
  const f7lab = T('29', LAB, C.amber, true, true); f7lab.moveTo([wx(7) + 0.42, roomY(29), 0]);
  const real = new M.Dot({ point: pt(7, REAL7, 0.025), radius: 0.095, color: C.ink });
  const realLab = T('35', LAB, C.ink, true, true); realLab.moveTo([wx(7) + 0.42, roomY(REAL7), 0]);
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...tmp, hidBox, hidQ), { runTime: 0.4 }), new M.Create(f7b, { runTime: 0.5 }), new M.FadeIn(r7b, { runTime: 0.5 }), new M.FadeIn(f7lab, { runTime: 0.5 }),
    new M.FadeIn(real, { runTime: 0.6 }), new M.FadeIn(realLab, { runTime: 0.6 }), new M.Flash(real, { color: C.ink, runTime: 0.9 }),
    ...say('REAL CHRISTMAS: 35 ROOMS', C.ink));
  await until(S(35));
  await play(new M.Indicate(f7lab, { color: C.amber, runTime: 1.0 }), ...say('THE FORECAST WAS 29', C.amber), ...fbox(['forecast = 29', ['real     = 35', C.ink]], C.amber));
  const seg7 = new M.Line({ start: [wx(7) - 0.2, roomY(29), 0.02], end: [wx(7) - 0.2, roomY(REAL7), 0.02], color: C.green, strokeWidth: 4 });
  const e7 = T('+6', LAB, C.green, true, true); e7.moveTo([wx(7), ERR_Y + (P ? 0.0 : 0.0) + 0.0, 0]);
  e7.moveTo([wx(7) - 0.55, roomY(32), 0]);
  await until(S(36));
  await play(new M.Create(seg7, { runTime: 0.6 }), new M.FadeIn(e7, { runTime: 0.6 }), ...say('35 − 29 = +6 ROOMS', C.green),
    ...fbox(['real − forecast', ['35 − 29 = +6', C.green]], C.green));

  // 37-40 why useful: benchmark
  await until(S(37));
  await play(...say('WHY IS SUCH A SIMPLE RULE USEFUL?', C.violet));
  await until(S(38));
  await play(new M.LaggedStart(errLabs.map(t => new M.Indicate(t, { color: C.violet, runTime: 0.6 })), { lagRatio: 0.15, runTime: 1.5 }),
    ...say('BENCHMARK = A STANDARD TO COMPARE', C.violet), ...fbox([['benchmark', C.violet], 'a standard to', 'compare with'], C.violet));
  await until(S(39));
  await play(...say('A NEW RULE MUST BEAT THE NAIVE ONE', C.violet), ...fbox(['naive errors:', ['+4 −4 +3 +1 +5', C.violet], 'can another rule do better?'], C.violet));
  await until(S(40));
  await play(new M.LaggedStart([3, 4].map(i => new M.Indicate(dots[i], { color: C.green, runTime: 0.7 })), { lagRatio: 0.3, runTime: 1.3 }),
    ...say('GOOD WHEN COUNTS CHANGE SLOWLY', C.green), ...fbox(['week 4 → 5: 23 → 24', ['small change, small error', C.green]], C.green));

  // 41 formula
  await until(S(41));
  await play(...say('NEXT WEEK = LAST COUNT SEEN', C.amber), ...fbox([['next week’s forecast', C.amber], '= the last count', '  you have seen'], C.amber));

  // 42-43 trap
  const back = new M.DashedLine({ start: pt(6, 33, 0.03), end: pt(5, 33, 0.03), color: C.pink });
  const backLab = T('1 step back', P ? 16 : 15, C.pink, true); backLab.moveTo([(wx(5) + wx(6)) / 2, roomY(35), 0]);
  await until(S(42));
  await play(new M.Create(back, { runTime: 0.6 }), new M.FadeIn(backLab, { runTime: 0.6 }), ...say('TRAP: IT LOOKS BACK ONLY ONE STEP', C.pink));
  await until(S(43));
  await play(new M.Indicate(seg7, { color: C.pink, runTime: 1.0 }), new M.Indicate(e7, { color: C.pink, runTime: 1.0 }),
    ...say('CHRISTMAS JUMP: STILL THE OLD 29', C.pink), ...fbox(['count jumps to 35', ['forecast stays 29', C.pink]], C.pink));

  // 44 next lesson
  const lastYr = new M.Dot({ point: pt(7, 32, 0.02), radius: 0.08, color: C.pink }); lastYr.setFill(C.pink, 0.85);
  const lyLab = T('last year 32', P ? 16 : 15, C.pink, true); lyLab.moveTo([wx(8) - (P ? 0.45 : 0.1), roomY(25), 0]);
  await until(S(44));
  await play(new M.FadeOut(new M.VGroup(back, backLab, e7), { runTime: 0.4 }), new M.FadeIn(lastYr, { runTime: 0.6 }), new M.FadeIn(lyLab, { runTime: 0.6 }),
    ...say('NEXT: LOOK BACK ONE WHOLE YEAR', C.pink), ...fbox(['next lesson:', ['same week last year', C.pink]], C.pink));

  // 45 summary
  await until(S(45));
  await play(new M.Indicate(r7b, { color: C.amber, runTime: 1.0 }), ...say('NAIVE = COPY THE LATEST COUNT', C.amber),
    ...fbox([['naive forecast', C.amber], 'copy the latest count', ['= benchmark for others', C.violet]], C.amber));
}
