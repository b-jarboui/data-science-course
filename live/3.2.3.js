// 3.2.3 Time alignment: put every clock on one timeline (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  // shared data (chapters/3.2.md)
  const IN = { 8: 18, 9: 21, 10: 24, 11: 27, 12: 30 };   // sensor A, local time
  const OUT = { 4: 15, 5: 17, 6: 19, 7: 21, 8: 24 };     // weather website, UTC
  const OFF = 4, AH = [8, 9, 10, 11, 12], WH = [4, 5, 6, 7, 8];

  // layout: laptop = hours along x, three tracks stacked; phone = hours down y, three tracks side by side
  const XC = 0.7, DX = 1.2, HX = -5.85, TY = { A: 0.95, W: -0.05, U: -1.05 };
  const Y0 = 0.9, DY = 0.75, TX = { A: -1.7, W: 0.15, U: 2.0 };
  const CW = P ? 1.65 : 1.05, CH = P ? 0.6 : 0.82;
  const PILL = P ? [0, 2.6, 0] : [XC, 1.85, 0];
  const ZONE = P ? [0, 3.6, 0] : [XC, -2.2, 0];
  const pos = (h, tr) => P ? [TX[tr], Y0 - (h - 4) * DY, 0] : [XC + (h - 8) * DX, TY[tr], 0];
  const hpos = (tr, sub) => P ? [TX[tr], sub ? 1.63 : 1.95, 0] : [HX, TY[tr] + (sub ? -0.18 : 0.16), 0];
  const minus = (a, b) => [a[0] - b[0], a[1] - b[1], 0];
  const hh = h => `${h}:00`;
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
    r.setFill(C.card, 0.95); r.moveTo(ZONE);
    const left = ZONE[0] - wd / 2 + 0.35, top = ZONE[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // one reading = one card: the time written on the row, and the temperature
  function card(h, tr, time, temp, color) {
    const p = pos(h, tr);
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(p);
    const t = T(time, 15, C.muted, true), v = T(`${temp}°`, P ? 20 : 22, color, true, true);
    if (P) { t.moveTo([p[0] - 0.38, p[1], 0]); v.moveTo([p[0] + 0.45, p[1], 0]); }
    else { t.moveTo([p[0], p[1] + 0.19, 0]); v.moveTo([p[0], p[1] - 0.15, 0]); }
    return { g: new M.VGroup(r, t, v), r, t, v, p };
  }
  function head(tr, main, sub, color) {
    const m = T(main, P ? 16 : 18, color, false, true); m.moveTo(hpos(tr, false));
    const s = T(sub, 15, C.muted); s.moveTo(hpos(tr, true));
    return { m, s };
  }
  const ring = (h, tr, color) => {
    const r = new M.RoundedRectangle({ width: CW + 0.18, height: CH + 0.18, cornerRadius: 0.15, color, strokeWidth: 3 });
    r.moveTo(pos(h, tr)); return r;
  };
  function clock(c, hour, color) {
    const R = 0.42;
    const face = new M.Circle({ radius: R, color, strokeWidth: 3 }); face.setFill(C.card, 0.95); face.moveTo(c);
    const parts = [face];
    for (let k = 0; k < 12; k += 3) {
      const a = Math.PI / 2 - k * Math.PI / 6;
      parts.push(new M.Line({ start: [c[0] + 0.78 * R * Math.cos(a), c[1] + 0.78 * R * Math.sin(a), 0], end: [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), 0], color: C.muted, strokeWidth: 2 }));
    }
    const ha = Math.PI / 2 - (hour % 12) * Math.PI / 6;
    parts.push(new M.Line({ start: c, end: [c[0], c[1] + 0.75 * R, 0], color: C.ink, strokeWidth: 2 }));
    parts.push(new M.Line({ start: c, end: [c[0] + 0.52 * R * Math.cos(ha), c[1] + 0.52 * R * Math.sin(ha), 0], color, strokeWidth: 4 }));
    return new M.VGroup(...parts);
  }

  // 0 the question: inside versus outside
  const GH = P ? [0, 0.4, 0] : [-2.3, 0.0, 0], SUN = P ? [0, -2.7, 0] : [3.7, 0.1, 0];
  const ghBody = new M.Rectangle({ width: 2.0, height: 1.2, color: C.cyan, strokeWidth: 3 }); ghBody.setFill(C.cyan, 0.12); ghBody.moveTo(GH);
  const apex = [GH[0], GH[1] + 1.25, 0];
  const ghRoofL = new M.Line({ start: [GH[0] - 1.0, GH[1] + 0.6, 0], end: apex, color: C.cyan, strokeWidth: 3 });
  const ghRoofR = new M.Line({ start: apex, end: [GH[0] + 1.0, GH[1] + 0.6, 0], color: C.cyan, strokeWidth: 3 });
  const ghPane = new M.Line({ start: [GH[0], GH[1] - 0.6, 0], end: apex, color: C.cyan, strokeWidth: 2 });
  const ghLab = T('inside', 22, C.cyan); ghLab.moveTo([GH[0], GH[1] - 0.95, 0]);
  const sunC = new M.Circle({ radius: 0.48, color: C.amber }); sunC.setFill(C.amber, 0.85); sunC.moveTo(SUN);
  const rays = Array.from({ length: 8 }, (_, k) => {
    const a = k * Math.PI / 4;
    return new M.Line({ start: [SUN[0] + 0.66 * Math.cos(a), SUN[1] + 0.66 * Math.sin(a), 0], end: [SUN[0] + 0.92 * Math.cos(a), SUN[1] + 0.92 * Math.sin(a), 0], color: C.amber, strokeWidth: 3 });
  });
  const sunLab = T('outside', 22, C.violet); sunLab.moveTo([SUN[0], SUN[1] - 1.3, 0]);
  const q = T('?', 54, C.amber, false, true); q.moveTo(P ? [0, -1.15, 0] : [(GH[0] + SUN[0]) / 2, 0.1, 0]);
  const gh = new M.VGroup(ghBody, ghRoofL, ghRoofR, ghPane, ghLab), sun = new M.VGroup(sunC, ...rays, sunLab);
  await until(S(0)); await play(new M.LaggedStart([new M.FadeIn(gh), new M.FadeIn(sun), new M.FadeIn(q)], { lagRatio: 0.3, runTime: 1.6 }), ...say('HOW MUCH WARMER IS IT INSIDE?', C.amber));

  // 1 sensor A: one reading every hour (local times)
  const hA = head('A', 'SENSOR A', 'inside', C.cyan);
  const A = {}; AH.forEach(h => { A[h] = card(h, 'A', hh(h), IN[h], C.cyan); });
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(gh, sun, q)), new M.FadeIn(hA.m), new M.FadeIn(hA.s),
    new M.LaggedStart(AH.map(h => new M.FadeIn(A[h].g)), { lagRatio: 0.15, runTime: 1.4 }), ...say('SENSOR A: ONE READING EVERY HOUR'));

  // 2 the website: one reading every hour
  const hW = head('W', 'WEBSITE', 'outside', C.violet);
  const Wc = {}; WH.forEach(h => { Wc[h] = card(h, 'W', hh(h), OUT[h], C.violet); });
  await until(S(2));
  await play(new M.FadeIn(hW.m), new M.FadeIn(hW.s),
    new M.LaggedStart(WH.map(h => new M.FadeIn(Wc[h].g)), { lagRatio: 0.15, runTime: 1.4 }), ...say('WEBSITE: OUTSIDE, EVERY HOUR', C.violet));

  // 3 side by side by the time written
  const allTimes = [...WH.map(h => Wc[h].t), ...AH.map(h => A[h].t)];
  await until(S(3)); await play(new M.LaggedStart(allTimes.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.12, runTime: 1.8 }), ...say('SIDE BY SIDE, BY THE TIME WRITTEN', C.amber));

  // 4-7 the 8:00 match says colder inside
  const r1 = ring(8, 'A', C.amber), r2 = ring(8, 'W', C.amber);
  await until(S(4)); await play(new M.Create(r1), new M.Indicate(A[8].v, { color: C.amber }), ...say('SENSOR A · 8:00 → 18°'));
  await until(S(5)); await play(new M.Create(r2), new M.Indicate(Wc[8].v, { color: C.amber }), ...say('WEBSITE · 8:00 → 24°', C.violet));
  const d6 = T('−6°', 22, C.pink, true, true); d6.moveTo(pos(8, 'U'));
  await until(S(6)); await play(new M.FadeIn(d6), ...say('18 − 24 = −6: COLDER INSIDE?', C.pink));
  await until(S(7)); await play(new M.Indicate(d6, { color: C.pink }), ...say('STRANGE: A GREENHOUSE TRAPS WARMTH', C.amber));

  // 8-10 the clocks
  await until(S(8)); await play(new M.FadeOut(new M.VGroup(r1, r2, d6)),
    new M.LaggedStart(allTimes.map(t => new M.Indicate(t, { color: C.ink })), { lagRatio: 0.1, runTime: 1.2 }), ...say('LOOK CLOSER AT THE CLOCKS'));
  const sA2 = T('inside · local time', 15, C.muted); sA2.moveTo(hpos('A', true));
  await until(S(9)); await play(new M.FadeOut(hA.s), new M.FadeIn(sA2),
    new M.LaggedStart(AH.map(h => new M.Indicate(A[h].t, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.4 }), ...say('GREENHOUSE: LOCAL TIME = WALL CLOCK'));
  const sW2 = T('outside · UTC', 15, C.muted); sW2.moveTo(hpos('W', true));
  await until(S(10)); await play(new M.FadeOut(hW.s), new M.FadeIn(sW2),
    new M.LaggedStart(WH.map(h => new M.Indicate(Wc[h].t, { color: C.violet })), { lagRatio: 0.12, runTime: 1.4 }), ...say('WEBSITE: UTC', C.violet));

  // 11-12 two clocks: UTC 8:00 and local 12:00
  const ZY = ZONE[1];
  const C1 = [P ? -3.0 : XC - 2.7, ZY, 0], C2 = [P ? 0.3 : XC + 0.8, ZY, 0];
  const lab2 = (x, a, b, col) => {
    const m = T(a, P ? 15 : 17, col, true, true); m.moveTo([x, ZY + 0.16, 0]);
    const s2 = T(b, 15, C.muted); s2.moveTo([x, ZY - 0.18, 0]);
    return [m, s2];
  };
  const clockU = clock(C1, 8, C.green), labU = lab2(P ? -1.95 : XC - 1.55, 'UTC 8:00', 'world clock', C.green);
  const clockL = clock(C2, 12, C.cyan), labL = lab2(P ? 1.6 : XC + 2.2, 'LOCAL 12:00', 'wall clock', C.cyan);
  const plus4 = T('+4 h', P ? 17 : 19, C.amber, true, true); plus4.moveTo([P ? -0.85 : XC - 0.25, ZY, 0]);
  await until(S(11)); await play(new M.FadeIn(clockU), new M.FadeIn(labU[0]), new M.FadeIn(labU[1]), ...say('UTC = ONE SHARED WORLD CLOCK', C.green));
  await until(S(12)); await play(new M.FadeIn(plus4), new M.FadeIn(clockL), new M.FadeIn(labL[0]), new M.FadeIn(labL[1]), ...say('LOCAL = 4 HOURS AHEAD OF UTC', C.amber));

  // 13 the offset
  await until(S(13)); await play(new M.FadeOut(new M.VGroup(clockU, ...labU, plus4, clockL, ...labL)),
    ...fbox(['local = UTC + 4', ['+4 = the offset', C.amber]], C.amber), ...say('UTC + 4 · THE +4 IS THE OFFSET', C.amber));

  // 14-15 website 8:00 is noon on the wall clock
  const tag = pill('= 12:00 LOCAL', C.amber, 15); tag.moveTo(pos(8, 'U'));
  await until(S(14)); await play(new M.FadeIn(tag), new M.Indicate(Wc[8].g, { color: C.amber }),
    ...fbox(['8:00 UTC + 4 h', ['= 12:00 local (noon)', C.amber]], C.amber), ...say('WEBSITE 8:00 = NOON ON THE WALL CLOCK', C.amber));
  const r3 = ring(8, 'A', C.pink), r4 = ring(8, 'W', C.pink);
  await until(S(15)); await play(new M.Create(r3), new M.Create(r4), ...say('WE COMPARED MORNING INSIDE WITH NOON OUTSIDE', C.pink));

  // 16-17 one timeline: local time
  const tlParts = [], tlLabs = [];
  let tl, tlHead;
  if (P) {
    tl = new M.Line({ start: [-2.85, Y0 + 0.4, 0], end: [-2.85, Y0 - 8 * DY - 0.4, 0], color: C.muted, strokeWidth: 3 });
    for (let hr = 4; hr <= 12; hr++) {
      const y = pos(hr, 'A')[1];
      tlParts.push(new M.Line({ start: [-2.93, y, 0], end: [-2.77, y, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(hh(hr), 15, C.muted, true); t.moveTo([-3.4, y, 0]); tlLabs.push(t);
    }
    tlHead = T('LOCAL', 15, C.cyan, false, true); tlHead.moveTo([-3.3, 1.95, 0]);
  } else {
    const YT = -2.0;
    tl = new M.Line({ start: [XC - 4 * DX - 0.6, YT, 0], end: [XC + 4 * DX + 0.6, YT, 0], color: C.muted, strokeWidth: 3 });
    for (let hr = 4; hr <= 12; hr++) {
      const x = pos(hr, 'A')[0];
      tlParts.push(new M.Line({ start: [x, YT - 0.07, 0], end: [x, YT + 0.07, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(hh(hr), 15, C.muted, true); t.moveTo([x, YT - 0.3, 0]); tlLabs.push(t);
    }
    tlHead = T('LOCAL TIME', 16, C.cyan, false, true); tlHead.moveTo([HX, YT - 0.15, 0]);
  }
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(r3, r4, tag)), ...clearBox(), new M.Create(tl),
    new M.FadeIn(new M.VGroup(...tlParts, ...tlLabs)), ...say('TIME ALIGNMENT: ONE TIMELINE FOR ALL', C.green));
  await until(S(17)); await play(new M.FadeIn(tlHead),
    new M.LaggedStart(AH.map(h => new M.Indicate(A[h].t, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.4 }), ...say('OUR ONE TIMELINE: LOCAL TIME'));

  // 18 add four hours: the UTC readings step aside to be converted
  const hU = head('U', 'WEBSITE', 'outside · UTC', C.violet), hO = head('W', 'OUTSIDE', 'local time', C.violet);
  const Uc = {}, mv = [];
  for (const hr of WH) {
    Uc[hr] = card(hr, 'U', hh(hr), OUT[hr], C.violet);
    const d = minus(Uc[hr].p, Wc[hr].p);
    mv.push(new M.FadeOut(Wc[hr].g, { shift: d }), new M.FadeIn(Uc[hr].g, { shift: d }));
  }
  const dh = minus(hpos('U', false), hpos('W', false));
  await until(S(18));
  await play(...mv, new M.FadeOut(hW.m, { shift: dh }), new M.FadeOut(sW2, { shift: dh }),
    new M.FadeIn(hU.m, { shift: dh }), new M.FadeIn(hU.s, { shift: dh }), ...say('+4 HOURS TO EVERY WEBSITE TIME', C.amber));
  await play(new M.FadeIn(hO.m), new M.FadeIn(hO.s));

  // 19-23 each website time + 4 → its place on local time
  const Wl = {};
  for (const [i, hr] of WH.entries()) {
    await until(S(19 + i));
    const nc = card(hr + OFF, 'W', hh(hr + OFF), OUT[hr], C.violet);
    const d = minus(nc.p, Uc[hr].p);
    await play(new M.FadeOut(Uc[hr].g, { shift: d }), new M.FadeIn(nc.g, { shift: d }),
      ...say(`${hh(hr)} UTC + 4 = ${hh(hr + OFF)} LOCAL · ${OUT[hr]}°`, C.violet));
    Wl[hr + OFF] = nc;
  }

  // 24 line up again with sensor A
  const hD = head('U', 'WARMER BY', 'inside − outside', C.amber);
  await until(S(24)); await play(new M.FadeOut(new M.VGroup(hU.m, hU.s)), new M.FadeIn(hD.m), new M.FadeIn(hD.s), ...say('NOW LINE THEM UP AGAIN WITH SENSOR A'));

  // 25-29 the gaps, hour by hour
  const diffs = [];
  for (const [i, hr] of AH.entries()) {
    await until(S(25 + i));
    const o = OUT[hr - OFF], dd = IN[hr] - o;
    const t = T(`+${dd}°`, 22, C.amber, true, true); t.moveTo(pos(hr, 'U')); diffs.push(t);
    await play(new M.Indicate(A[hr].g, { color: C.cyan }), new M.Indicate(Wl[hr].g, { color: C.violet }), new M.FadeIn(t),
      ...say(`${hh(hr)} · ${IN[hr]} − ${o} = ${dd}° WARMER`, C.amber));
  }

  // 30 now it makes sense
  await until(S(30)); await play(new M.LaggedStart(diffs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 2.0 }),
    ...say('WARMER INSIDE, MORE AND MORE THROUGH THE MORNING', C.green));

  // 31-32 the rule
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(tl, ...tlParts, ...tlLabs, tlHead)),
    ...fbox(['local time = UTC time + offset']), ...say('IN SHORT: ADD THE OFFSET'));
  await until(S(32)); await play(...fbox(['local time = UTC time + offset', ['local time = UTC time + 4 h', C.amber]]), ...say('HERE: OFFSET = +4 HOURS', C.amber));

  // 33-34 what it is for
  await until(S(33)); await play(new M.LaggedStart(AH.flatMap(h => [new M.Indicate(A[h].g, { color: C.green }), new M.Indicate(Wl[h].g, { color: C.green })]), { lagRatio: 0.12, runTime: 2.2 }),
    ...say('JOIN BY TIME = PUT ROWS SIDE BY SIDE', C.green));
  const r5 = ring(8, 'A', C.pink), r6 = ring(12, 'W', C.pink);
  await until(S(34)); await play(new M.Create(r5), new M.Create(r6), ...say('NOT ALIGNED: READINGS NEVER TAKEN TOGETHER', C.pink));

  // 35-36 the trap: a time with no offset
  const BIG = P ? [0, 0.1, 0] : [XC, 0.5, 0];
  const BS = P ? 1.35 : 1;
  function bigCard(time, w, tx, vx) {
    const r = new M.RoundedRectangle({ width: Math.min(w * BS, FW - 0.6), height: 1.3 * BS, cornerRadius: 0.16, color: C.cyan, strokeWidth: 3 });
    r.setFill(C.card, 0.95); r.moveTo(BIG);
    const t = T(time, (time.length > 5 ? 28 : 32) * (P && time.length <= 5 ? 1.35 : 1), C.ink, true); t.moveTo([BIG[0] + tx * (P && time.length <= 5 ? BS : 1), BIG[1], 0]);
    const v = T('18°', (P && time.length <= 5) ? 46 : 34, C.cyan, true, true); v.moveTo([BIG[0] + vx * (P && time.length <= 5 ? BS : 1), BIG[1], 0]);
    return { g: new M.VGroup(r, t, v), t };
  }
  const big = bigCard('8:00', 3.4, -0.75, 0.95);
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(...AH.map(h => A[h].g), ...AH.map(h => Wl[h].g), ...diffs, hA.m, sA2, hO.m, hO.s, hD.m, hD.s, r5, r6)),
    ...clearBox(), new M.FadeIn(big.g), ...say('TRAP: A TIME WITH NO OFFSET', C.pink));
  const q1 = pill('8:00 LOCAL?', C.pink, P ? 20 : 16), q2 = pill('8:00 UTC?', C.pink, P ? 20 : 16);
  if (P) { q1.moveTo([0, BIG[1] - 2.1, 0]); q2.moveTo([0, BIG[1] - 3.0, 0]); }
  else { q1.moveTo([BIG[0] - 1.5, BIG[1] - 1.25, 0]); q2.moveTo([BIG[0] + 1.5, BIG[1] - 1.25, 0]); }
  await until(S(36)); await play(new M.FadeIn(q1), new M.FadeIn(q2), new M.Indicate(big.t, { color: C.pink }), ...say('WHOSE 8:00? NOBODY CAN TELL', C.pink));

  // 37 the offset can change during the year
  await until(S(37)); await play(...fbox(['winter: local = UTC + 1', ['summer: local = UTC + 2', C.amber]], C.amber), ...say('SOME PLACES: CLOCKS JUMP 1 HOUR FOR SUMMER', C.amber));

  // 38 store the offset with every time
  const big2 = bigCard('8:00 UTC+4', 5.0, -0.75, 1.6);
  const utcNote = T('= 4:00 UTC', P ? 26 : 22, C.green, true); utcNote.moveTo([BIG[0], BIG[1] - (P ? 1.6 : 1.15), 0]);
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(big.g, q1, q2)), ...clearBox(), new M.FadeIn(big2.g), new M.FadeIn(utcNote),
    ...say('STORE THE OFFSET (OR UTC) WITH EVERY TIME', C.green));

  // 39 recap: one timeline, then compare
  const fA = head('A', 'SENSOR A', 'inside · local time', C.cyan), fO = head('W', 'OUTSIDE', 'local time', C.violet);
  const endA = AH.map(h => card(h, 'A', hh(h), IN[h], C.cyan)), endW = AH.map(h => card(h, 'W', hh(h), OUT[h - OFF], C.violet));
  await until(S(39));
  await play(new M.FadeOut(new M.VGroup(big2.g, utcNote)), new M.FadeIn(fA.m), new M.FadeIn(fA.s), new M.FadeIn(fO.m), new M.FadeIn(fO.s),
    new M.LaggedStart(AH.flatMap((_, i) => [new M.FadeIn(endA[i].g), new M.FadeIn(endW[i].g)]), { lagRatio: 0.1, runTime: 1.8 }),
    ...say('ONE TIMELINE FIRST, THEN COMPARE', C.green));
}
