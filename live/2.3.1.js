// 2.3.1 Counts and rates (live manim-web lesson).
// Beat i = sentence i (0-based, 0..53). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Route palette (chapters/2.3.md: A = blue, B = orange, C = purple)
  const RA = '#4aa8ff', RB = '#fb923c', RC = C.violet;
  const RCOLS = [RA, RB, RC];
  const RNAMES = ['Route A', 'Route B', 'Route C'];
  const COUNTS = [30, 15, 6];
  const RIDERS = [20000, 5000, 1000];
  const RIDER_LABELS = ['20,000', '5,000', '1,000'];
  const RATES = [1.5, 3, 6];
  const RATE_LABELS = ['1.5', '3', '6'];

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]) & laptop (14.22 x 8, y in [-3.0, 2.3])
  const PILL = P ? [0, 1.95, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 3.3, 0] : [3.9, -0.45, 0];
  const BAR_CX = P ? 0.2 : -2.4;
  const BAR_SP = P ? 2.15 : 2.35;
  const BAR_W = P ? 0.68 : 0.72;
  const BAR_BASE = P ? -3.8 : -1.95;
  const BAR_HMAX = P ? 3.55 : 2.6;
  const barColX = k => BAR_CX + (k - 1) * BAR_SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.2;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Visual builders (all parts positioned with moveTo)
  function glowBar(x, baseY, width, height, color) {
    const h = Math.max(0.14, height);
    const cy = baseY + h / 2;
    const cr = Math.min(0.08, h / 3);
    const outer = new M.RoundedRectangle({ width: width + 0.18, height: h + 0.12, cornerRadius: cr + 0.04, color, strokeWidth: 1 });
    outer.setStrokeOpacity(0); outer.setFill(color, 0.14); outer.moveTo([x, cy, 0]);
    const inner = new M.RoundedRectangle({ width: width + 0.08, height: h + 0.05, cornerRadius: cr + 0.02, color, strokeWidth: 1 });
    inner.setStrokeOpacity(0); inner.setFill(color, 0.25); inner.moveTo([x, cy, 0]);
    const core = new M.RoundedRectangle({ width, height: h, cornerRadius: cr, color, strokeWidth: 2 });
    core.setFill(color, 0.86); core.moveTo([x, cy, 0]);
    return { outer, inner, core, parts: [outer, inner, core] };
  }

  function busIcon(x, y, color, letter, sc = 1) {
    const body = new M.RoundedRectangle({ width: 1.48 * sc, height: 0.72 * sc, cornerRadius: 0.13 * sc, color, strokeWidth: 2 });
    body.setFill(color, 0.24); body.moveTo([x, y, 0]);
    const wins = [-0.42, 0, 0.42].map(dx => {
      const w = new M.Rectangle({ width: 0.30 * sc, height: 0.23 * sc, color, strokeWidth: 1.2 });
      w.setFill(color, 0.55); w.moveTo([x + dx * sc, y + 0.12 * sc, 0]);
      return w;
    });
    const w1 = new M.Circle({ radius: 0.13 * sc, color, strokeWidth: 2 }); w1.setFill(C.bg, 1); w1.moveTo([x - 0.42 * sc, y - 0.36 * sc, 0]);
    const w2 = new M.Circle({ radius: 0.13 * sc, color, strokeWidth: 2 }); w2.setFill(C.bg, 1); w2.moveTo([x + 0.42 * sc, y - 0.36 * sc, 0]);
    const badge = T(letter, Math.round(18 * sc), C.ink, true, true); badge.moveTo([x, y - 0.14 * sc, 0]);
    return new M.VGroup(body, ...wins, w1, w2, badge);
  }

  function envelopeIcon(x, y, color = C.pink, sc = 1) {
    const w = 0.46 * sc, h = 0.30 * sc;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.04 * sc, color, strokeWidth: 1.8 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const l1 = new M.Line({ start: [x - w * 0.46, y + h * 0.42, 0], end: [x, y - h * 0.05, 0], color, strokeWidth: 1.5 });
    const l2 = new M.Line({ start: [x + w * 0.46, y + h * 0.42, 0], end: [x, y - h * 0.05, 0], color, strokeWidth: 1.5 });
    const dot = new M.Dot({ point: [x + w * 0.48, y + h * 0.46, 0], radius: 0.06 * sc, color: C.amber });
    return new M.VGroup(r, l1, l2, dot);
  }

  function riderIcon(x, y, color = C.ink, sc = 1) {
    const head = new M.Circle({ radius: 0.10 * sc, color, strokeWidth: 1.5 });
    head.setFill(color, 0.95); head.moveTo([x, y + 0.18 * sc, 0]);
    const body = new M.Arc({ radius: 0.18 * sc, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 0.95); body.moveTo([x, y - 0.06 * sc, 0]);
    return new M.VGroup(head, body);
  }

  function cBlock(x, y, w, h, color, fillOp = 0.88) {
    const b = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.05, h / 3), color, strokeWidth: 1.2 });
    b.setFill(color, fillOp); b.moveTo([x, y, 0]);
    return b;
  }

  // =========================================================================
  // BEATS 0-4: City bus service, 3 routes, complaints, the boss's question
  // =========================================================================
  const ROAD_Y = P ? -2.2 : -1.25;
  const roadW = P ? 6.8 : 11.4;
  const road = new M.Line({ start: [-roadW / 2, ROAD_Y, 0], end: [roadW / 2, ROAD_Y, 0], color: C.muted, strokeWidth: 3 });
  const bSpecs = P
    ? [[-2.6, 1.0, 1.3], [-1.3, 0.9, 2.0], [0.0, 1.0, 1.5], [1.3, 0.9, 2.2], [2.6, 1.0, 1.2]]
    : [[-4.4, 1.2, 1.5], [-2.2, 1.3, 2.2], [0.0, 1.4, 1.8], [2.2, 1.2, 2.4], [4.4, 1.3, 1.4]];
  const skyline = new M.VGroup(...bSpecs.flatMap(([bx, bw, bh]) => {
    const r = new M.Rectangle({ width: bw, height: bh, color: C.muted, strokeWidth: 1.6 });
    r.setFill('#18214a', 0.95); r.moveTo([bx, ROAD_Y + bh / 2 + 0.04, -0.01]);
    const wins = [];
    for (let wy = ROAD_Y + 0.45; wy < ROAD_Y + bh - 0.2; wy += 0.42) {
      for (const dx of [-bw * 0.25, bw * 0.25]) {
        const w = new M.Rectangle({ width: 0.16, height: 0.16, color: C.amber, strokeWidth: 0.8 });
        w.setFill(C.amber, 0.55); w.moveTo([bx + dx, wy, 0]);
        wins.push(w);
      }
    }
    return [r, ...wins];
  }));

  // 0: Imagine you work for the bus service of a city.
  await until(S(0));
  await play(new M.Create(road, { runTime: 0.8 }), new M.FadeIn(skyline, { runTime: 0.9 }), ...say('CITY BUS SERVICE'));

  // 1: The city has three bus routes, called A, B and C.
  const busSP = P ? 2.2 : 3.6;
  const busSC = P ? 0.92 : 1.15;
  const busY = ROAD_Y + 0.50 * busSC;
  const busXs = [-busSP, 0, busSP];
  const buses0 = busXs.map((x, k) => busIcon(x, busY, C.muted, ['A', 'B', 'C'][k], busSC));
  const busLabs0 = busXs.map((x, k) => T(RNAMES[k], P ? 20 : 22, C.ink, false, true).moveTo([x, ROAD_Y - 0.45, 0]));
  await until(S(1));
  await play(
    new M.LaggedStart(buses0.map((b, k) => new M.FadeIn(b, { shift: [0, 0.15, 0] })), { lagRatio: 0.25, runTime: 1.3 }),
    new M.LaggedStart(busLabs0.map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.3 }),
    ...say('THREE BUS ROUTES: A, B, C')
  );

  // 2: Route A is blue, route B is orange, and route C is purple.
  const buses = busXs.map((x, k) => busIcon(x, busY, RCOLS[k], ['A', 'B', 'C'][k], busSC));
  const busLabs = busXs.map((x, k) => T(RNAMES[k], P ? 20 : 22, RCOLS[k], false, true).moveTo([x, ROAD_Y - 0.45, 0]));
  await until(S(2));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeOut(buses0[k], { runTime: 0.4 })), { lagRatio: 0.55, runTime: 2.2 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeOut(busLabs0[k], { runTime: 0.4 })), { lagRatio: 0.55, runTime: 2.2 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(buses[k], { runTime: 0.5 })), { lagRatio: 0.55, runTime: 2.4 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(busLabs[k], { runTime: 0.5 })), { lagRatio: 0.55, runTime: 2.4 }),
    ...say('A = BLUE · B = ORANGE · C = PURPLE', C.ink)
  );

  // 3: Each weekday, some riders send a complaint. A complaint is a message that says something went wrong.
  const envBaseY = busY + 0.92 * busSC;
  const envelopes = [];
  const envCounts = [3, 2, 1];
  for (let k = 0; k < 3; k++) {
    const n = envCounts[k];
    for (let j = 0; j < n; j++) {
      const ex = busXs[k] + (j - (n - 1) / 2) * (P ? 0.52 : 0.62);
      const ey = envBaseY + (j % 2) * 0.14;
      envelopes.push(envelopeIcon(ex, ey, C.pink, P ? 0.85 : 1.0));
    }
  }
  await until(S(3));
  await play(
    new M.LaggedStart(envelopes.map(e => new M.FadeIn(e, { shift: [0, 0.25, 0] })), { lagRatio: 0.16, runTime: 1.5 }),
    ...say('COMPLAINT = SOMETHING WENT WRONG', C.pink)
  );

  // 4: Your boss asks you one question: on which route are riders least happy?
  const qMarks = busXs.map(x => {
    const c = new M.Circle({ radius: 0.24, color: C.amber, strokeWidth: 2 });
    c.setFill(C.card, 0.95); c.moveTo([x, ROAD_Y - 1.15, 0]);
    const t = T('?', 22, C.amber, true, true); t.moveTo([x, ROAD_Y - 1.15, 0]);
    return new M.VGroup(c, t);
  });
  await until(S(4));
  await play(
    new M.LaggedStart(qMarks.map(q => new M.FadeIn(q)), { lagRatio: 0.2, runTime: 1.1 }),
    new M.LaggedStart(buses.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.3 }),
    ...say('WHICH ROUTE ARE RIDERS LEAST HAPPY?', C.amber)
  );

  // =========================================================================
  // BEATS 5-11: One weekday of complaints -> glowing bars -> counts
  // =========================================================================
  const cAxisX = barColX(0) - (P ? 1.05 : 1.25);
  const cFloorEnd = barColX(2) + (P ? 0.95 : 1.15);
  const cFloor = new M.Line({ start: [cAxisX, BAR_BASE, 0], end: [cFloorEnd, BAR_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const cRouteLabs = RNAMES.map((name, k) => T(name, P ? 18 : 20, RCOLS[k], false, true).moveTo([barColX(k), BAR_BASE - 0.38, 0]));
  const cNote = T('1 weekday', P ? 15 : 16, C.muted).moveTo([cFloorEnd - 0.55, BAR_BASE - 0.78, 0]);

  // 5: Let's look at one weekday of complaints first.
  // the complaint envelopes stay on screen and drop into a pile above each route
  const pileEnv = [];
  { let n = 0;
    for (let k = 0; k < 3; k++) for (let j = 0; j < envCounts[k]; j++, n++)
      pileEnv.push(envelopeIcon(barColX(k) + (j - (envCounts[k] - 1) / 2) * (P ? 0.55 : 0.6), BAR_BASE + 0.35, C.pink, P ? 0.95 : 1.0));
  }
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(road, skyline, ...buses, ...busLabs, ...qMarks), { runTime: 0.6 }),
    ...envelopes.map((e, i) => new M.Transform(e, pileEnv[i], { runTime: 0.9 })),
    new M.Create(cFloor, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...cRouteLabs, cNote), { runTime: 0.7 }),
    ...say('ONE WEEKDAY OF COMPLAINTS')
  );

  // 6: Route A gets thirty complaints.
  const numStartY = BAR_BASE + (P ? 1.1 : 0.85);
  const cNums = COUNTS.map((v, k) => T(String(v), P ? 28 : 30, RCOLS[k], true, true).moveTo([barColX(k), numStartY, 0]));
  await until(S(6));
  await play(new M.FadeIn(cNums[0], { runTime: 0.5 }), new M.Flash(cNums[0], { color: RA, runTime: 0.6 }), ...say('ROUTE A: 30 COMPLAINTS', RA));

  // 7: Route B gets fifteen.
  await until(S(7));
  await play(new M.FadeIn(cNums[1], { runTime: 0.5 }), new M.Flash(cNums[1], { color: RB, runTime: 0.5 }), ...say('ROUTE B: 15 COMPLAINTS', RB));

  // 8: Route C gets six.
  await until(S(8));
  await play(new M.FadeIn(cNums[2], { runTime: 0.5 }), new M.Flash(cNums[2], { color: RC, runTime: 0.5 }), ...say('ROUTE C: 6 COMPLAINTS', RC));

  // 9: Let's draw each number as a glowing bar. A taller bar means more complaints.
  const cAxis = new M.Line({ start: [cAxisX, BAR_BASE, 0], end: [cAxisX, BAR_BASE + BAR_HMAX + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const cTicks = [0, 10, 20, 30].map(v => {
    const y = BAR_BASE + (v / 30) * BAR_HMAX;
    return new M.VGroup(
      new M.Line({ start: [cAxisX - 0.08, y, 0], end: [cAxisX + 0.06, y, 0], color: C.muted, strokeWidth: 1.5 }),
      T(String(v), P ? 15 : 16, C.muted, true).moveTo([cAxisX - 0.34, y, 0])
    );
  });
  const cYLab = T('complaints', P ? 15 : 16, C.muted).moveTo([cAxisX - 0.25, BAR_BASE + BAR_HMAX + 0.5, 0]);
  const cBars = COUNTS.map((v, k) => glowBar(barColX(k), BAR_BASE, BAR_W, (v / 30) * BAR_HMAX, RCOLS[k]));
  const cNumBarPos = COUNTS.map((v, k) => [barColX(k), BAR_BASE + (v / 30) * BAR_HMAX + 0.32, 0]);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...envelopes), { runTime: 0.5 }),
    new M.Create(cAxis, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...cTicks, cYLab), { runTime: 0.8 }),
    ...cBars.flatMap(b => b.parts.map(p => new M.FadeIn(p, { shift: [0, 0.2, 0], runTime: 1.2 }))),
    ...cNums.map((t, k) => new M.Transform(t, T(String(COUNTS[k]), P ? 22 : 24, RCOLS[k], true, true).moveTo(cNumBarPos[k]), { runTime: 1.1 })),
    ...say('TALLER BAR = MORE COMPLAINTS')
  );

  // 10: Route A has the tallest bar by far. It looks like the worst route.
  const worstTag = pill('WORST?', C.amber, P ? 15 : 16);
  worstTag.moveTo([barColX(0), BAR_BASE + BAR_HMAX + 0.85, 0]);
  await until(S(10));
  await play(
    new M.Indicate(cBars[0].core, { color: C.amber, runTime: 1.1 }),
    new M.FadeIn(worstTag, { shift: [0, 0.1, 0], runTime: 0.8 }),
    ...say('ROUTE A LOOKS WORST...', C.amber)
  );

  // 11: Each of these numbers is a count. A count means how many times something happened.
  await until(S(11));
  await play(
    new M.FadeOut(worstTag, { runTime: 0.6 }),
    new M.LaggedStart(cNums.map(n => new M.Indicate(n, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('COUNT = HOW MANY TIMES IT HAPPENED', C.cyan)
  );

  // =========================================================================
  // BEATS 12-17: Wait — the riders! Put riders next to the bars
  // =========================================================================
  // 12: But wait. The three routes do not carry the same number of people.
  await until(S(12));
  await play(
    new M.LaggedStart(cRouteLabs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('WAIT: DIFFERENT NUMBERS OF PEOPLE', C.amber)
  );

  // 13: Let's put the riders next to the bars. A rider is one person taking one trip.
  const BAR_DX = P ? -0.34 : -0.36;
  const shiftedBars = COUNTS.map((v, k) => glowBar(barColX(k) + BAR_DX, BAR_BASE, BAR_W * 0.92, (v / 30) * BAR_HMAX, RCOLS[k]));
  const shiftedNumPos = COUNTS.map((v, k) => [barColX(k) + BAR_DX, BAR_BASE + (v / 30) * BAR_HMAX + 0.32, 0]);
  const keyBox = new M.RoundedRectangle({ width: P ? 5.6 : 4.2, height: P ? 1.15 : 1.35, cornerRadius: 0.16, color: C.ink, strokeWidth: 2 });
  keyBox.setFill(C.card, 0.95); keyBox.moveTo(BOXP);
  const keyIcon = riderIcon(BOXP[0] - (P ? 2.15 : 1.55), BOXP[1], C.ink, 1.05);
  const keyL1 = T('1 rider =', P ? 18 : 19, C.cyan, true, true).moveTo([BOXP[0] + 0.35, BOXP[1] + 0.22, 0]);
  const keyL2 = T('1 person, 1 trip', P ? 18 : 19, C.ink, true).moveTo([BOXP[0] + 0.35, BOXP[1] - 0.20, 0]);
  const riderKey = new M.VGroup(keyBox, keyIcon, keyL1, keyL2);

  await until(S(13));
  await play(
    ...cBars.flatMap((b, k) => b.parts.map((p, j) => new M.Transform(p, shiftedBars[k].parts[j], { runTime: 0.9 }))),
    ...cNums.map((t, k) => new M.Transform(t, T(String(COUNTS[k]), P ? 20 : 22, RCOLS[k], true, true).moveTo(shiftedNumPos[k]), { runTime: 0.9 })),
    new M.FadeIn(riderKey, { runTime: 0.9 }),
    ...say('RIDER = 1 PERSON, 1 TRIP', C.ink)
  );

  // Helper: stack of rider blocks beside each bar (20, 5, 1 blocks proportional to 20k, 5k, 1k)
  const RIDER_DX = P ? 0.42 : 0.46;
  function makeRiderStack(k, count) {
    const rx = barColX(k) + RIDER_DX;
    const dx = P ? 0.22 : 0.24, dy = P ? 0.28 : 0.22;
    const items = [];
    for (let i = 0; i < count; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = rx + (col - 0.5) * dx;
      const by = BAR_BASE + 0.14 + row * dy;
      const dot = new M.RoundedRectangle({ width: dx * 0.78, height: dy * 0.76, cornerRadius: 0.04, color: C.ink, strokeWidth: 1 });
      dot.setFill(C.ink, 0.85); dot.moveTo([bx, by, 0]);
      items.push(dot);
    }
    const rows = Math.ceil(count / 2);
    const stackTop = BAR_BASE + 0.14 + (rows - 1) * dy + dy * 0.38;
    const sub = T('riders', 15, C.muted).moveTo([rx + 0.05, stackTop + 0.27, 0]);
    const lab = T(RIDER_LABELS[k], P ? 18 : 18, C.ink, true, true).moveTo([rx + 0.05, stackTop + 0.6, 0]);
    return { stack: new M.VGroup(...items), label: new M.VGroup(lab, sub) };
  }
  const rStackA = makeRiderStack(0, 20);
  const rStackB = makeRiderStack(1, 5);
  const rStackC = makeRiderStack(2, 1);

  // 14: Route A carries twenty thousand riders each weekday.
  await until(S(14));
  await play(
    new M.FadeIn(rStackA.stack, { shift: [0, 0.18, 0], runTime: 0.9 }),
    new M.FadeIn(rStackA.label, { runTime: 0.8 }),
    ...say('ROUTE A: 20,000 RIDERS', RA)
  );

  // 15: Route B carries five thousand.
  await until(S(15));
  await play(
    new M.FadeIn(rStackB.stack, { shift: [0, 0.15, 0], runTime: 0.7 }),
    new M.FadeIn(rStackB.label, { runTime: 0.7 }),
    ...say('ROUTE B: 5,000 RIDERS', RB)
  );

  // 16: Route C carries only one thousand.
  await until(S(16));
  await play(
    new M.FadeIn(rStackC.stack, { shift: [0, 0.15, 0], runTime: 0.7 }),
    new M.FadeIn(rStackC.label, { runTime: 0.7 }),
    ...say('ROUTE C: 1,000 RIDERS', RC)
  );

  // 17: Route A has many more complaints partly because it carries many more people.
  await until(S(17));
  await play(
    new M.FadeOut(riderKey, { runTime: 0.5 }),
    new M.Indicate(cBars[0].core, { color: C.amber, runTime: 1.2 }),
    new M.Indicate(rStackA.stack, { color: C.amber, runTime: 1.2 }),
    ...say('MORE RIDERS → MORE COMPLAINTS', C.amber)
  );

  // =========================================================================
  // BEATS 18-21: School analogy -> fair question -> fixed group of 1,000
  // =========================================================================
  // 18: Here is a comparison. A big school will have more absent students than a small one, even if it is not worse.
  function schoolCard(cx, cy, title, total, absent, borderCol) {
    const cw = P ? 3.25 : 4.6, ch = P ? 3.2 : 3.25;
    const card = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color: borderCol, strokeWidth: 2 });
    card.setFill(C.card, 0.92); card.moveTo([cx, cy, 0]);
    const head = T(title, P ? 17 : 20, borderCol, true, true).moveTo([cx, cy + ch / 2 - 0.36, 0]);
    const cols = 5, rows = Math.ceil(total / cols);
    const dx = P ? 0.52 : 0.70, dy = P ? 0.44 : 0.44;
    const dots = [];
    for (let i = 0; i < total; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const px = cx + (c - (cols - 1) / 2) * dx;
      const py = cy + 0.15 + ((rows - 1) / 2 - r) * dy;
      const isAbs = i < absent;
      const d = new M.Dot({ point: [px, py, 0], radius: P ? 0.12 : 0.14, color: isAbs ? C.pink : C.muted });
      d.setFill(isAbs ? C.pink : C.muted, isAbs ? 0.95 : 0.45);
      dots.push(d);
    }
    const foot = T(`${absent} absent (of ${total})`, P ? 15 : 18, C.pink, true).moveTo([cx, cy - ch / 2 + 0.38, 0]);
    return new M.VGroup(card, head, ...dots, foot);
  }
  const bigSchool = schoolCard(P ? -1.78 : -2.85, P ? -1.4 : -0.45, 'BIG SCHOOL', 20, 4, C.cyan);
  const smallSchool = schoolCard(P ? 1.78 : 2.85, P ? -1.4 : -0.45, 'SMALL SCHOOL', 5, 2, C.violet);

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(
      cFloor, cAxis, ...cTicks, cYLab, cNote, ...cRouteLabs, ...cNums,
      ...cBars.flatMap(b => b.parts),
      rStackA.stack, rStackA.label, rStackB.stack, rStackB.label, rStackC.stack, rStackC.label
    ), { runTime: 0.6 }),
    new M.FadeIn(bigSchool, { shift: [0, 0.15, 0], runTime: 1.0 }),
    new M.FadeIn(smallSchool, { shift: [0, 0.15, 0], runTime: 1.0 }),
    ...say('BIG SCHOOL: MORE ABSENT, NOT WORSE', C.violet)
  );

  // 19: So the fair question is: how many complaints for the same number of riders?
  const fairXs = P ? [-2.25, 0, 2.25] : [-3.3, 0, 3.3];
  const fairY = P ? -1.6 : -0.55;
  const fairBoxes = fairXs.map((x, k) => {
    const r = new M.RoundedRectangle({ width: P ? 1.9 : 2.5, height: P ? 1.9 : 2.0, cornerRadius: 0.16, color: RCOLS[k], strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([x, fairY, 0]);
    const rl = T(RNAMES[k], P ? 16 : 19, RCOLS[k], true, true).moveTo([x, fairY + 0.56, 0]);
    const ic = riderIcon(x, fairY - 0.05, C.ink, 1.0);
    const same = T('same riders', P ? 15 : 16, C.muted, true).moveTo([x, fairY - 0.58, 0]);
    const q = T('? complaints', P ? 15 : 17, C.amber, true, true).moveTo([x, fairY + 1.25, 0]);
    return new M.VGroup(r, rl, ic, same, q);
  });
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(bigSchool, smallSchool), { runTime: 0.6 }),
    new M.LaggedStart(fairBoxes.map(b => new M.FadeIn(b, { shift: [0, 0.15, 0] })), { lagRatio: 0.18, runTime: 1.1 }),
    ...say('SAME RIDERS → HOW MANY COMPLAINTS?', C.amber)
  );

  // 20: Let's pick one fixed group size: one thousand riders.
  const unitY = P ? -1.5 : -0.45;
  const unitRect = new M.RoundedRectangle({ width: P ? 4.4 : 4.8, height: P ? 2.4 : 2.3, cornerRadius: 0.2, color: C.green, strokeWidth: 2.5 });
  unitRect.setFill(C.card, 0.95); unitRect.moveTo([0, unitY, 0]);
  const unitIcons = [-0.85, -0.28, 0.28, 0.85].map(dx => riderIcon(dx, unitY + 0.42, C.green, 0.95));
  const unitNum = T('1,000 riders', P ? 30 : 32, C.green, true, true).moveTo([0, unitY - 0.25, 0]);
  const unitSub = T('one fixed group', P ? 17 : 18, C.muted).moveTo([0, unitY - 0.72, 0]);
  const unitCard = new M.VGroup(unitRect, ...unitIcons, unitNum, unitSub);
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...fairBoxes), { runTime: 0.6 }),
    new M.FadeIn(unitCard, { runTime: 0.9 }),
    new M.Flash(unitNum, { color: C.green, runTime: 0.7 }),
    ...say('FIXED GROUP SIZE = 1,000 RIDERS', C.green)
  );

  // 21: Picture the riders of each route split into groups of one thousand.
  const ovItems = [];
  const ovTileW = P ? 0.46 : 0.62, ovTileH = P ? 0.36 : 0.42, ovGap = P ? 0.08 : 0.10;
  const ovLeft = P ? -2.25 : -3.4;
  // Row A: 20 groups (2 rows of 10)
  const ovAY = P ? -0.15 : 0.45;
  ovItems.push(T('A  (20)', P ? 17 : 20, RA, true, true).moveTo([ovLeft - (P ? 0.75 : 1.05), ovAY - 0.2, 0]));
  for (let i = 0; i < 20; i++) {
    const c = i % 10, r = Math.floor(i / 10);
    const tile = cBlock(ovLeft + c * (ovTileW + ovGap), ovAY - r * (ovTileH + ovGap), ovTileW, ovTileH, RA, 0.75);
    ovItems.push(tile);
  }
  // Row B: 5 groups
  const ovBY = P ? -1.85 : -0.85;
  ovItems.push(T('B  (5)', P ? 17 : 20, RB, true, true).moveTo([ovLeft - (P ? 0.75 : 1.05), ovBY, 0]));
  for (let i = 0; i < 5; i++) {
    ovItems.push(cBlock(ovLeft + i * (ovTileW + ovGap), ovBY, ovTileW, ovTileH, RB, 0.75));
  }
  // Row C: 1 group
  const ovCY = P ? -2.95 : -1.80;
  ovItems.push(T('C  (1)', P ? 17 : 20, RC, true, true).moveTo([ovLeft - (P ? 0.75 : 1.05), ovCY, 0]));
  ovItems.push(cBlock(ovLeft, ovCY, ovTileW, ovTileH, RC, 0.75));
  const ovNote = T('each block = 1,000 riders', P ? 15 : 17, C.muted).moveTo([0, ovCY - (P ? 0.85 : 0.72), 0]);
  ovItems.push(ovNote);
  const splitOverview = new M.VGroup(...ovItems);

  await until(S(21));
  await play(
    new M.FadeOut(unitCard, { runTime: 0.6 }),
    new M.FadeIn(splitOverview, { shift: [0, 0.15, 0], runTime: 1.1 }),
    ...say('SPLIT INTO GROUPS OF 1,000', C.cyan)
  );

  // =========================================================================
  // BEATS 22-26: Route A — 20 groups, share 30 complaints -> 1.5 each
  // =========================================================================
  const SH_CX = P ? 0 : -2.55;
  const aCols = P ? 5 : 10, aRows = P ? 4 : 2;
  const aSX = P ? 1.38 : 0.72, aSY = P ? 1.22 : 1.28;
  const aSlotW = P ? 1.16 : 0.60, aSlotH = P ? 0.94 : 0.94;
  const aTopRowY = P ? -0.55 : -0.45;
  const aSlotPos = i => {
    const c = i % aCols, r = Math.floor(i / aCols);
    return [SH_CX + (c - (aCols - 1) / 2) * aSX, aTopRowY - r * aSY, 0];
  };
  const aSlots = Array.from({ length: 20 }, (_, i) => {
    const [sx, sy] = aSlotPos(i);
    const box = new M.RoundedRectangle({ width: aSlotW, height: aSlotH, cornerRadius: 0.08, color: RA, strokeWidth: 1.6 });
    box.setFill(C.card, 0.75); box.moveTo([sx, sy, 0]);
    const lb = T('1k', P ? 15 : 13, C.muted, true).moveTo([sx, sy - aSlotH / 2 - 0.14, 0]);
    return new M.VGroup(box, lb);
  });
  const aHead = T('Route A: 20 groups of 1,000', P ? 17 : 18, RA, true, true).moveTo([SH_CX, P ? -5.18 : -2.62, 0]);

  // 22: Route A has twenty groups of one thousand riders.
  await until(S(22));
  await play(
    new M.FadeOut(splitOverview, { runTime: 0.5 }),
    new M.LaggedStart(aSlots.map(s => new M.FadeIn(s)), { lagRatio: 0.05, runTime: 1.1 }),
    new M.FadeIn(aHead, { runTime: 0.8 }),
    ...fbox([['Route A', RA], '20 groups of 1,000'], RA),
    ...say('ROUTE A: 20 GROUPS OF 1,000', RA)
  );

  // 23: Its thirty complaints are shared across those twenty groups.
  const bankPitchX = P ? 0.44 : 0.45, bankY0 = P ? 0.56 : 0.68, bankRowDY = 0.34;
  const bankW = P ? 0.35 : 0.36, bankH = 0.23;
  const bankPos = i => [SH_CX + ((i % 15) - 7) * bankPitchX, bankY0 + Math.floor(i / 15) * bankRowDY, 0];
  const aFull = Array.from({ length: 20 }, (_, i) => {
    const [bx, by] = bankPos(i);
    return cBlock(bx, by, bankW, bankH, RA, 0.9);
  });
  // Last 10 blocks built as 10 touching pairs of half-blocks so they split cleanly in beat 25
  const aHalves = [];
  for (let i = 0; i < 10; i++) {
    const [bx, by] = bankPos(20 + i);
    const hw = bankW * 0.49;
    aHalves.push(cBlock(bx - hw * 0.51, by, hw, bankH, RA, 0.9));
    aHalves.push(cBlock(bx + hw * 0.51, by, hw, bankH, RA, 0.9));
  }
  const aBankLab = T('30 complaints', P ? 16 : 17, RA, true, true).moveTo([SH_CX, bankY0 + bankRowDY + 0.34, 0]);

  await until(S(23));
  await play(
    new M.LaggedStart([...aFull, ...aHalves].map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.1 }),
    new M.FadeIn(aBankLab, { runTime: 0.8 }),
    ...fbox([['Route A', RA], '30 complaints', '20 groups'], RA),
    ...say('SHARE 30 COMPLAINTS ACROSS 20 GROUPS', RA)
  );

  // 24: Give each group one complaint first. That uses twenty complaints.
  const aFullW = P ? 0.82 : 0.44, aFullH = 0.34;
  await until(S(24));
  await play(
    new M.FadeOut(aBankLab, { runTime: 0.5 }),
    new M.LaggedStart(aFull.map((b, i) => {
      const [sx, sy] = aSlotPos(i);
      return new M.Transform(b, cBlock(sx, sy - 0.16, aFullW, aFullH, RA, 0.92), { pathArc: -0.35, runTime: 0.8 });
    }), { lagRatio: 0.08, runTime: 2.3 }),
    ...fbox([['Route A', RA], '1 each → 20 used', ['10 left over', C.amber]], RA),
    ...say('1 EACH → USES 20 (10 LEFT)', C.amber)
  );

  // 25: The ten left over give each group one half more.
  const aHalfH = aFullH * 0.5;
  await until(S(25));
  await play(
    new M.LaggedStart(aHalves.map((b, i) => {
      const [sx, sy] = aSlotPos(i);
      return new M.Transform(b, cBlock(sx, sy + 0.14, aFullW, aHalfH, C.amber, 0.92), { pathArc: -0.3, runTime: 0.7 });
    }), { lagRatio: 0.06, runTime: 1.8 }),
    ...fbox([['Route A', RA], '1 + 0.5 each', ['= 1.5 per 1,000', RA]], RA),
    ...say('10 LEFT → +0.5 TO EACH GROUP', C.amber)
  );

  // 26: So route A has one and a half complaints for each thousand riders.
  const [f0x, f0y] = aSlotPos(0);
  const aFocus = new M.RoundedRectangle({ width: aSlotW + 0.14, height: aSlotH + 0.14, cornerRadius: 0.1, color: C.amber, strokeWidth: 3 });
  aFocus.setFill(C.amber, 0.06); aFocus.moveTo([f0x, f0y, 0]);
  const aResTag = pill('1.5 EACH', RA, P ? 16 : 17);
  aResTag.moveTo([SH_CX, P ? 0.65 : 0.72, 0]);
  await until(S(26));
  await play(
    new M.Create(aFocus, { runTime: 0.7 }),
    new M.FadeIn(aResTag, { shift: [0, 0.1, 0], runTime: 0.8 }),
    ...fbox([['per 1,000 riders', C.muted], ['A: 1.5', RA]], RA),
    ...say('ROUTE A: 1.5 PER 1,000 RIDERS', RA)
  );

  // =========================================================================
  // BEATS 27-28: Route B — 5 groups, 15 complaints -> 3 each
  // =========================================================================
  const bSX = P ? 1.38 : 1.34, bSlotW = P ? 1.12 : 1.10, bSlotH = P ? 1.80 : 1.72;
  const bY = P ? -1.85 : -0.75;
  const bPos = k => [SH_CX + (k - 2) * bSX, bY, 0];
  const bSlots = Array.from({ length: 5 }, (_, k) => {
    const [sx, sy] = bPos(k);
    const box = new M.RoundedRectangle({ width: bSlotW, height: bSlotH, cornerRadius: 0.1, color: RB, strokeWidth: 2 });
    box.setFill(C.card, 0.8); box.moveTo([sx, sy, 0]);
    const lb = T('1k', P ? 15 : 15, C.muted, true).moveTo([sx, sy - bSlotH / 2 - 0.24, 0]);
    return new M.VGroup(box, lb);
  });
  const bHead = T('Route B: 5 groups of 1,000', P ? 17 : 18, RB, true, true).moveTo([SH_CX, bY - bSlotH / 2 - 0.78, 0]);

  // 27: Route B has five groups of one thousand riders.
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...aSlots, ...aFull, ...aHalves, aHead, aFocus, aResTag), { runTime: 0.5 }),
    new M.LaggedStart(bSlots.map(s => new M.FadeIn(s)), { lagRatio: 0.12, runTime: 1.0 }),
    new M.FadeIn(bHead, { runTime: 0.8 }),
    ...fbox([['per 1,000 riders', C.muted], ['A: 1.5', RA], ['B: 5 groups', RB]], RB),
    ...say('ROUTE B: 5 GROUPS OF 1,000', RB)
  );

  // 28: Fifteen complaints shared across five groups is three for each thousand riders.
  const bBlocks = [];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 5; k++) {
      const [sx, sy] = bPos(k);
      const by = sy - bSlotH / 2 + 0.30 + row * 0.44;
      bBlocks.push(cBlock(sx, by, bSlotW * 0.72, aFullH, RB, 0.9));
    }
  }
  const bNumLabs = Array.from({ length: 5 }, (_, k) => {
    const [sx, sy] = bPos(k);
    return T('3', P ? 20 : 20, RB, true, true).moveTo([sx, sy + bSlotH / 2 + 0.28, 0]);
  });
  await until(S(28));
  await play(
    new M.LaggedStart(bBlocks.map(b => new M.FadeIn(b, { shift: [0, -0.35, 0] })), { lagRatio: 0.08, runTime: 1.8 }),
    new M.LaggedStart(bNumLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.3 }),
    ...fbox([['per 1,000 riders', C.muted], ['A: 1.5', RA], ['B: 3', RB]], RB),
    ...say('ROUTE B: 15 ÷ 5 = 3 PER 1,000', RB)
  );

  // =========================================================================
  // BEATS 29-30: Route C — 1 group, 6 complaints -> 6 each
  // =========================================================================
  const cSlotW = P ? 2.0 : 1.7, cSlotH = P ? 3.1 : 2.85;
  const cY = P ? -1.8 : -0.6;
  const cSlotBox = new M.RoundedRectangle({ width: cSlotW, height: cSlotH, cornerRadius: 0.14, color: RC, strokeWidth: 2.2 });
  cSlotBox.setFill(C.card, 0.8); cSlotBox.moveTo([SH_CX, cY, 0]);
  const cSlotLb = T('1k', 16, C.muted, true).moveTo([SH_CX, cY - cSlotH / 2 - 0.24, 0]);
  const cSlot = new M.VGroup(cSlotBox, cSlotLb);
  const cHead = T('Route C: 1 group of 1,000', P ? 17 : 18, RC, true, true).moveTo([SH_CX, cY - cSlotH / 2 - 0.72, 0]);

  // 29: Route C has just one group of one thousand riders.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...bSlots, ...bBlocks, ...bNumLabs, bHead), { runTime: 0.5 }),
    new M.FadeIn(cSlot, { runTime: 0.8 }),
    new M.FadeIn(cHead, { runTime: 0.8 }),
    ...fbox([['per 1,000 riders', C.muted], ['A: 1.5', RA], ['B: 3', RB], ['C: 1 group', RC]], RC),
    ...say('ROUTE C: 1 GROUP OF 1,000', RC)
  );

  // 30: Its six complaints all fall in that one group: six for each thousand riders.
  const cBlocks = Array.from({ length: 6 }, (_, j) => {
    const by = cY - cSlotH / 2 + 0.30 + j * 0.43;
    return cBlock(SH_CX, by, cSlotW * 0.68, aFullH, RC, 0.9);
  });
  const cNumLab = T('6', P ? 26 : 26, RC, true, true).moveTo([SH_CX, cY + cSlotH / 2 + 0.32, 0]);
  await until(S(30));
  await play(
    new M.LaggedStart(cBlocks.map(b => new M.FadeIn(b, { shift: [0, -0.35, 0] })), { lagRatio: 0.15, runTime: 1.6 }),
    new M.FadeIn(cNumLab, { runTime: 0.8 }),
    ...fbox([['per 1,000 riders', C.muted], ['A: 1.5', RA], ['B: 3', RB], ['C: 6', RC]], RC),
    ...say('ROUTE C: 6 PER 1,000 RIDERS', RC)
  );

  // =========================================================================
  // BEATS 31-37: Redraw bars as rates -> picture flips -> rate & denominator
  // =========================================================================
  const rFloor = new M.Line({ start: [cAxisX, BAR_BASE, 0], end: [cFloorEnd, BAR_BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const rAxis = new M.Line({ start: [cAxisX, BAR_BASE, 0], end: [cAxisX, BAR_BASE + BAR_HMAX + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const rTicks = [0, 2, 4, 6].map(v => {
    const y = BAR_BASE + (v / 6) * BAR_HMAX;
    return new M.VGroup(
      new M.Line({ start: [cAxisX - 0.08, y, 0], end: [cAxisX + 0.06, y, 0], color: C.muted, strokeWidth: 1.5 }),
      T(String(v), P ? 15 : 16, C.muted, true).moveTo([cAxisX - 0.32, y, 0])
    );
  });
  const rYLab = T('per 1,000 riders', P ? 15 : 16, C.cyan).moveTo([cAxisX + 0.82, BAR_BASE + BAR_HMAX + 0.42, 0]);
  const rRouteLabs = RNAMES.map((name, k) => T(name, P ? 18 : 20, RCOLS[k], false, true).moveTo([barColX(k), BAR_BASE - 0.38, 0]));
  const rBars = RATES.map((v, k) => glowBar(barColX(k), BAR_BASE, BAR_W, (v / 6) * BAR_HMAX, RCOLS[k]));
  const rNums = RATES.map((v, k) => T(RATE_LABELS[k], P ? 22 : 24, RCOLS[k], true, true).moveTo([barColX(k), BAR_BASE + (v / 6) * BAR_HMAX + 0.32, 0]));

  // 31: Now let's redraw the bars with these new numbers: one and a half, three, and six.
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(cSlot, ...cBlocks, cNumLab, cHead), { runTime: 0.5 }),
    new M.Create(rFloor, { runTime: 0.7 }),
    new M.Create(rAxis, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...rTicks, rYLab, ...rRouteLabs), { runTime: 0.8 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(rBars[k].outer, { shift: [0, 0.2, 0] })), { lagRatio: 0.3, runTime: 1.8 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(rBars[k].inner, { shift: [0, 0.2, 0] })), { lagRatio: 0.3, runTime: 1.8 }),
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(rBars[k].core, { shift: [0, 0.2, 0] })), { lagRatio: 0.3, runTime: 1.8 }),
    new M.LaggedStart(rNums.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.8 }),
    ...say('COMPLAINTS PER 1,000 RIDERS')
  );

  // 32: The picture flips. Route C now has the tallest bar.
  await until(S(32));
  await play(
    new M.Indicate(rBars[2].core, { color: C.amber, runTime: 1.1 }),
    new M.Flash(rNums[2], { color: RC, runTime: 0.9 }),
    ...say('THE PICTURE FLIPS: ROUTE C IS TALLEST', RC)
  );

  // 33: For its riders, route C is the worst. Route A is the best.
  const rWorst = pill('WORST', C.pink, 15);
  rWorst.moveTo([barColX(2), BAR_BASE + BAR_HMAX + 0.84, 0]);
  const rBest = pill('BEST', C.green, 15);
  rBest.moveTo([barColX(0), BAR_BASE + (1.5 / 6) * BAR_HMAX + 0.84, 0]);
  await until(S(33));
  await play(
    new M.FadeIn(rWorst, { shift: [0, 0.1, 0], runTime: 0.8 }),
    new M.FadeIn(rBest, { shift: [0, 0.1, 0], runTime: 0.8 }),
    new M.Indicate(rBars[2].core, { color: C.pink, runTime: 1.0 }),
    new M.Indicate(rBars[0].core, { color: C.green, runTime: 1.0 }),
    ...say('WORST = C (6)  ·  BEST = A (1.5)', C.green)
  );

  // 34: A number like this is called a rate. A rate is a count for a fixed group size.
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(rWorst, rBest), { runTime: 0.5 }),
    new M.LaggedStart(rNums.map(n => new M.Indicate(n, { color: C.green })), { lagRatio: 0.22, runTime: 1.2 }),
    ...fbox([['rate', C.green], 'a count for a', 'fixed group size'], C.green),
    ...say('RATE = COUNT FOR A FIXED GROUP SIZE', C.green)
  );

  // 35: You already know one rate: a percent is a count for every hundred.
  await until(S(35));
  await play(
    ...fbox([['percent (%)', C.amber], 'a count for', 'every 100'], C.amber),
    ...say('PERCENT = COUNT FOR EVERY 100', C.amber)
  );

  // 36: When we divide, the number we divide by is called the denominator.
  await until(S(36));
  await play(
    ...fbox(['count ÷ denominator', ['        ↑', C.violet], ['   denominator', C.violet], ['what we divide by', C.muted]], C.violet),
    ...say('DENOMINATOR = WHAT WE DIVIDE BY', C.violet)
  );

  // 37: Here, we divide by riders, so the denominator is riders.
  await until(S(37));
  await play(
    new M.Indicate(rYLab, { color: C.violet, runTime: 1.0 }),
    ...fbox(['complaints ÷ riders', ['             ↑', C.violet], ['    denominator', C.violet]], C.violet),
    ...say('HERE: DENOMINATOR = RIDERS', C.violet)
  );

  // =========================================================================
  // BEATS 38-43: The one-line formula & check on Route A
  // =========================================================================
  // 38: Now the short version, in one line.
  await until(S(38));
  await play(
    ...fbox([['the short version', C.cyan]], C.cyan),
    ...say('THE FORMULA IN ONE LINE')
  );

  // 39: Rate for each thousand riders equals complaints, divided by riders, times one thousand.
  await until(S(39));
  await play(
    ...fbox([['rate = complaints ÷ riders × 1,000', C.ink], ['(for each 1,000 riders)', C.muted]], C.cyan),
    ...say('COMPLAINTS ÷ RIDERS × 1,000', C.cyan)
  );

  // 40: Let's check it on route A.
  await until(S(40));
  await play(
    new M.Indicate(rBars[0].core, { color: RA, runTime: 0.7 }),
    ...fbox([['check on Route A', RA], 'complaints = 30', 'riders     = 20,000'], RA),
    ...say('CHECK ON ROUTE A', RA)
  );

  // 41: Thirty divided by twenty thousand is a tiny number: the complaints for one single rider.
  await until(S(41));
  await play(
    ...fbox([['Route A: step 1', RA], ['30 ÷ 20,000 = 0.0015', C.amber], ['for 1 single rider', C.muted]], RA),
    ...say('30 ÷ 20,000 = 0.0015 FOR 1 RIDER', C.amber)
  );

  // 42: Times one thousand turns it into complaints for a group of one thousand: one and a half.
  await until(S(42));
  await play(
    new M.Flash(rNums[0], { color: C.green, runTime: 0.9 }),
    new M.Indicate(rNums[0], { color: C.green, runTime: 1.0 }),
    ...fbox([['Route A: step 2', RA], ['0.0015 × 1,000 = 1.5', C.green], ['for 1,000 riders ✓', C.green]], C.green),
    ...say('0.0015 × 1,000 = 1.5 PER 1,000', C.green)
  );

  // 43: In everyday words: share the count across the people, then look at a group of one thousand.
  await until(S(43));
  await play(
    ...fbox([['in everyday words:', C.cyan], '1. share across people', '2. look at 1,000 riders'], C.cyan),
    ...say('SHARE ACROSS PEOPLE → LOOK AT 1,000', C.cyan)
  );

  // =========================================================================
  // BEATS 44-46: What it is for — Count vs Rate
  // =========================================================================
  function toolCard(cx, cy, title, color, vals, maxV, line1, line2) {
    const cw = P ? 6.4 : 5.4, ch = P ? 2.75 : 3.45;
    const card = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color, strokeWidth: 2.2 });
    card.setFill(C.card, 0.94); card.moveTo([cx, cy, 0]);
    const head = T(title, P ? 21 : 22, color, true, true).moveTo([cx, cy + ch / 2 - 0.38, 0]);
    const mbBase = cy - (P ? 0.35 : 0.45), mbMax = P ? 0.95 : 1.25;
    const mbW = P ? 0.58 : 0.65, mbSP = P ? 1.25 : 1.25;
    const mini = [];
    for (let k = 0; k < 3; k++) {
      const mx = cx + (k - 1) * mbSP;
      const mh = Math.max(0.16, (vals[k] / maxV) * mbMax);
      const b = cBlock(mx, mbBase + mh / 2, mbW, mh, RCOLS[k], 0.85);
      const vt = T(String(vals[k]), P ? 16 : 16, RCOLS[k], true, true).moveTo([mx, mbBase + mh + 0.18, 0]);
      mini.push(b, vt);
    }
    const baseLine = new M.Line({ start: [cx - mbSP - 0.55, mbBase, 0], end: [cx + mbSP + 0.55, mbBase, 0], color: C.muted, strokeWidth: 1.5 });
    const t1 = T(line1, P ? 16 : 18, C.ink, false, true).moveTo([cx, cy - ch / 2 + 0.66, 0]);
    const t2 = T(line2, P ? 15 : 16, C.muted).moveTo([cx, cy - ch / 2 + 0.30, 0]);
    return new M.VGroup(card, head, baseLine, ...mini, t1, t2);
  }
  const countCard = toolCard(P ? 0 : -3.05, P ? -0.25 : -0.45, 'USE A COUNT', C.cyan, [30, 15, 6], 30, 'Total = 51 complaints', 'Plan how many staff');
  const rateCard = toolCard(P ? 0 : 3.05, P ? -3.45 : -0.45, 'USE A RATE', C.green, [1.5, 3, 6], 6, 'Per 1,000 riders', 'Compare different sizes');

  // 44: Use a count when you need the total, for example to plan how many staff answer complaints.
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(rFloor, rAxis, ...rTicks, rYLab, ...rRouteLabs, ...rNums, ...rBars.flatMap(b => b.parts)), { runTime: 0.5 }),
    ...hideBox(),
    new M.FadeIn(countCard, { shift: [0, 0.15, 0], runTime: 1.0 }),
    ...say('COUNT = WHEN YOU NEED THE TOTAL', C.cyan)
  );

  // 45: Use a rate when you compare groups of different sizes.
  await until(S(45));
  await play(
    new M.FadeIn(rateCard, { shift: [0, 0.15, 0], runTime: 1.0 }),
    ...say('RATE = COMPARE DIFFERENT SIZES', C.green)
  );

  // 46: A rate answers: for the same number of riders, which route gets more complaints?
  await until(S(46));
  await play(
    new M.Indicate(rateCard, { color: C.green, runTime: 1.1 }),
    ...say('SAME RIDERS → WHICH ROUTE GETS MORE?', C.green)
  );

  // =========================================================================
  // BEATS 47-51: Common trap — wrong denominator & "per what?"
  // =========================================================================
  const fracY = P ? -0.9 : -0.15;
  const fracW = P ? 5.2 : 5.4;
  const trapTopBox = new M.RoundedRectangle({ width: fracW, height: 0.85, cornerRadius: 0.14, color: C.ink, strokeWidth: 2 });
  trapTopBox.setFill(C.card, 0.94); trapTopBox.moveTo([0, fracY + 0.72, 0]);
  const trapTopLab = T('complaints', P ? 24 : 26, C.ink, true, true).moveTo([0, fracY + 0.72, 0]);
  const trapTop = new M.VGroup(trapTopBox, trapTopLab);

  const trapLine = new M.Line({ start: [-fracW / 2 - 0.25, fracY, 0], end: [fracW / 2 + 0.25, fracY, 0], color: C.amber, strokeWidth: 3.5 });

  const trapBotBox = new M.RoundedRectangle({ width: fracW, height: 0.95, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.4 });
  trapBotBox.setFill(C.card, 0.94); trapBotBox.moveTo([0, fracY - 0.78, 0]);
  const trapBotLab = T('denominator ?', P ? 24 : 26, C.amber, true, true).moveTo([0, fracY - 0.78, 0]);
  const trapBot = new M.VGroup(trapBotBox, trapBotLab);

  // 47: Here is a common trap. A rate can only be as good as its denominator.
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(countCard, rateCard), { runTime: 0.5 }),
    new M.FadeIn(trapTop, { runTime: 0.8 }),
    new M.Create(trapLine, { runTime: 0.7 }),
    new M.FadeIn(trapBot, { runTime: 0.8 }),
    ...say('TRAP: CHECK THE DENOMINATOR', C.pink)
  );

  // 48: Divide by the wrong thing, like the number of buses, and you answer a different question.
  const busBotBox = new M.RoundedRectangle({ width: fracW, height: 0.95, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.4 });
  busBotBox.setFill(C.card, 0.94); busBotBox.moveTo([0, fracY - 0.78, 0]);
  const miniBus = busIcon(-1.75, fracY - 0.74, C.pink, '', 0.52);
  const busBotLab = T('number of buses', P ? 20 : 22, C.pink, true, true).moveTo([0.45, fracY - 0.78, 0]);
  const trapBus = new M.VGroup(busBotBox, miniBus, busBotLab);
  const trapWarn = T('answers a different question', P ? 17 : 19, C.pink, false, true).moveTo([0, fracY - 1.62, 0]);

  await until(S(48));
  await play(
    new M.FadeOut(trapBot, { runTime: 0.5 }),
    new M.FadeIn(trapBus, { runTime: 0.8 }),
    new M.FadeIn(trapWarn, { shift: [0, 0.1, 0], runTime: 0.8 }),
    ...say('WRONG DENOMINATOR = DIFFERENT QUESTION', C.pink)
  );

  // 49: People say per for this. Per bus means for each bus.
  const perY = fracY - 2.38;
  const perRect = new M.RoundedRectangle({ width: P ? 5.6 : 6.0, height: 0.78, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  perRect.setFill(C.card, 0.95); perRect.moveTo([0, perY, 0]);
  const perText = T('per bus  =  for each bus', P ? 20 : 22, C.amber, true, true).moveTo([0, perY, 0]);
  const perCard = new M.VGroup(perRect, perText);
  await until(S(49));
  await play(
    new M.FadeIn(perCard, { shift: [0, 0.12, 0], runTime: 0.9 }),
    ...say('“PER” MEANS “FOR EACH”', C.amber)
  );

  // 50: Complaints per bus tells you about busy buses, not about how riders feel.
  function contrastRow(cy, leftTxt, rightTxt, color) {
    const rw = P ? 6.6 : 9.4, rh = P ? 1.35 : 1.15;
    const box = new M.RoundedRectangle({ width: rw, height: rh, cornerRadius: 0.16, color, strokeWidth: 2 });
    box.setFill(C.card, 0.94); box.moveTo([0, cy, 0]);
    if (P) {
      const t1 = T(leftTxt, 19, color, true, true).moveTo([0, cy + 0.28, 0]);
      const t2 = T(rightTxt, 18, C.ink).moveTo([0, cy - 0.28, 0]);
      return new M.VGroup(box, t1, t2);
    }
    const t1 = T(leftTxt, 21, color, true, true).moveTo([-2.15, cy, 0]);
    const arr = T('→', 24, C.muted, true, true).moveTo([0.45, cy, 0]);
    const t2 = T(rightTxt, 21, C.ink, false, true).moveTo([2.65, cy, 0]);
    return new M.VGroup(box, t1, arr, t2);
  }
  const cRowBus = contrastRow(P ? -0.6 : 0.2, 'complaints per bus', 'busy buses', C.pink);
  const cRowRider = contrastRow(P ? -2.45 : -1.3, 'complaints per rider', 'how riders feel', C.green);
  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(trapTop, trapLine, trapBus, trapWarn, perCard), { runTime: 0.5 }),
    new M.FadeIn(cRowBus, { shift: [0, 0.15, 0], runTime: 0.9 }),
    new M.FadeIn(cRowRider, { shift: [0, 0.15, 0], runTime: 0.9 }),
    ...say('PER BUS = BUSY BUSES, NOT RIDERS', C.pink)
  );

  // 51: So always ask: per what? Per rider, per bus, or per day?
  const pwY = P ? -0.35 : 0.4;
  const pwRect = new M.RoundedRectangle({ width: P ? 4.4 : 4.6, height: 1.0, cornerRadius: 0.2, color: C.amber, strokeWidth: 2.5 });
  pwRect.setFill(C.card, 0.96); pwRect.moveTo([0, pwY, 0]);
  const pwText = T('PER WHAT?', P ? 30 : 32, C.amber, true, true).moveTo([0, pwY, 0]);
  const perWhatTitle = new M.VGroup(pwRect, pwText);

  const chSpecs = [['per rider', C.green], ['per bus', C.cyan], ['per day', C.violet]];
  const perChoices = chSpecs.map(([label, col], k) => {
    const cx = P ? 0 : (k - 1) * 3.5;
    const cy = P ? -1.85 - k * 1.15 : -1.25;
    const r = new M.RoundedRectangle({ width: P ? 4.4 : 2.9, height: 0.82, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo([cx, cy, 0]);
    const t = T(label, P ? 22 : 22, col, true, true).moveTo([cx, cy, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(cRowBus, cRowRider), { runTime: 0.5 }),
    new M.FadeIn(perWhatTitle, { runTime: 0.7 }),
    new M.LaggedStart(perChoices.map(c => new M.FadeIn(c, { shift: [0, 0.15, 0] })), { lagRatio: 0.25, runTime: 1.3 }),
    ...say('ALWAYS ASK: PER WHAT?', C.amber)
  );

  // =========================================================================
  // BEATS 52-53: Next-lesson teaser (2.3.2 axis baselines) & 1-sentence recap
  // =========================================================================
  // 52: Even with the right numbers, a chart can still trick the eye. That is our next lesson.
  function previewChart(cx, cy, title, baseVal, color) {
    const cw = P ? 3.3 : 4.7, ch = P ? 3.2 : 3.2;
    const card = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.18, color, strokeWidth: 2 });
    card.setFill(C.card, 0.93); card.moveTo([cx, cy, 0]);
    const head = T(title, P ? 16 : 18, color, true, true).moveTo([cx, cy + ch / 2 - 0.34, 0]);
    const bBase = cy - ch / 2 + 0.62, bMax = 1.65;
    const vals = [96, 94, 92];
    const span = 100 - baseVal;
    const mbSP = P ? 0.86 : 1.15, mbW = P ? 0.50 : 0.65;
    const bars = [];
    for (let k = 0; k < 3; k++) {
      const mx = cx + (k - 1) * mbSP;
      const mh = Math.max(0.18, ((vals[k] - baseVal) / span) * bMax);
      bars.push(cBlock(mx, bBase + mh / 2, mbW, mh, RCOLS[k], 0.85));
      bars.push(T(String(vals[k]), 15, RCOLS[k], true).moveTo([mx, bBase + mh + 0.18, 0]));
    }
    const bl = new M.Line({ start: [cx - mbSP - 0.45, bBase, 0], end: [cx + mbSP + 0.45, bBase, 0], color: C.muted, strokeWidth: 1.6 });
    const foot = T(P ? 'same: 96, 94, 92' : 'same numbers: 96, 94, 92', 15, C.muted).moveTo([cx, cy - ch / 2 + 0.25, 0]);
    return new M.VGroup(card, head, bl, ...bars, foot);
  }
  const chartZero = previewChart(P ? -1.78 : -2.85, P ? -1.5 : -0.45, 'AXIS FROM 0', 0, C.green);
  const chartCut = previewChart(P ? 1.78 : 2.85, P ? -1.5 : -0.45, 'AXIS FROM 90', 90, C.pink);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(perWhatTitle, ...perChoices), { runTime: 0.5 }),
    new M.FadeIn(chartZero, { shift: [0, 0.15, 0], runTime: 0.9 }),
    new M.FadeIn(chartCut, { shift: [0, 0.15, 0], runTime: 0.9 }),
    ...say('NEXT LESSON: CHARTS THAT TRICK THE EYE', C.violet)
  );

  // 53: In one sentence: to compare groups of different sizes, divide each count by the group size.
  const endBarsCX = P ? 0 : -2.9;
  const endBase = P ? -4.3 : -1.75;
  const endMax = P ? 2.4 : 2.3;
  const endSP = P ? 1.7 : 1.75;
  const endFloor = new M.Line({ start: [endBarsCX - endSP - 0.7, endBase, 0], end: [endBarsCX + endSP + 0.7, endBase, 0], color: C.muted, strokeWidth: 2 });
  const endBars = RATES.map((v, k) => glowBar(endBarsCX + (k - 1) * endSP, endBase, 0.64, (v / 6) * endMax, RCOLS[k]));
  const endLabs = RATES.map((v, k) => new M.VGroup(
    T(RATE_LABELS[k], 20, RCOLS[k], true, true).moveTo([endBarsCX + (k - 1) * endSP, endBase + (v / 6) * endMax + 0.28, 0]),
    T(['A', 'B', 'C'][k], 18, RCOLS[k], true, true).moveTo([endBarsCX + (k - 1) * endSP, endBase - 0.32, 0])
  ));

  const recapPos = P ? [0, -0.35, 0] : [2.85, -0.45, 0];
  const recapRect = new M.RoundedRectangle({ width: P ? 6.6 : 5.8, height: P ? 1.9 : 2.3, cornerRadius: 0.2, color: C.green, strokeWidth: 2.5 });
  recapRect.setFill(C.card, 0.96); recapRect.moveTo(recapPos);
  const recapL1 = T('rate = count ÷ group size', P ? 21 : 23, C.green, true, true).moveTo([recapPos[0], recapPos[1] + 0.38, 0]);
  const recapL2 = T('compare groups of different sizes', P ? 16 : 18, C.ink).moveTo([recapPos[0], recapPos[1] - 0.28, 0]);
  const recapCard = new M.VGroup(recapRect, recapL1, recapL2);

  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(chartZero, chartCut), { runTime: 0.5 }),
    new M.Create(endFloor, { runTime: 0.7 }),
    ...endBars.flatMap(b => b.parts.map(p => new M.FadeIn(p, { shift: [0, 0.15, 0], runTime: 0.9 }))),
    new M.FadeIn(new M.VGroup(...endLabs), { runTime: 0.9 }),
    new M.FadeIn(recapCard, { shift: [0, 0.15, 0], runTime: 1.0 }),
    ...say('DIVIDE EACH COUNT BY THE GROUP SIZE', C.green)
  );
}
