// 3.3.3 Simple random sampling (live manim-web lesson).
// Beat i = sentence i (0-based, 0..44). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const CX = P ? 0 : -2.25;
  const PILL = [0, 1.95, 0];
  const BOXP = P ? [0, 3.32, 0] : [4.55, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Helper: simple vector arrow made from Lines
  function mkArrow(start, end, color = C.cyan, head = 0.18) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const p1 = [end[0] - head * (ux * 0.85 - uy * 0.52), end[1] - head * (uy * 0.85 + ux * 0.52), 0];
    const p2 = [end[0] - head * (ux * 0.85 + uy * 0.52), end[1] - head * (uy * 0.85 - ux * 0.52), 0];
    return new M.VGroup(
      new M.Line({ start, end, color, strokeWidth: 2.5 }),
      new M.Line({ start: end, end: p1, color, strokeWidth: 2.5 }),
      new M.Line({ start: end, end: p2, color, strokeWidth: 2.5 })
    );
  }

  // Helper: centered statement card
  function mkCard(lines, center, maxW, color = C.cyan) {
    const size = P ? 21 : 23, lh = P ? 0.46 : 0.48;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c));
    const wd = Math.min(maxW, Math.max(...texts.map(t => t.getWidth())) + 0.9);
    const ht = rows.length * lh + 0.5;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.2, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.96); r.moveTo(center);
    const top = center[1] + ht / 2 - 0.25 - lh / 2;
    texts.forEach((t, i) => {
      if (t.getWidth() > wd - 0.5) t.scaleToFitWidth(wd - 0.5);
      t.moveTo([center[0], top - i * lh, 0]);
    });
    return new M.VGroup(r, ...texts);
  }

  // Helper: glowing student dot
  function glowDot(pt, color = C.cyan, rad = 0.13) {
    const halo = new M.Dot({ point: pt, radius: rad * 2.1, color });
    halo.setFill(color, 0.18);
    const core = new M.Dot({ point: pt, radius: rad, color });
    core.setFill(color, 1);
    return new M.VGroup(halo, core);
  }

  // =========================================================================
  // ACT 1 (Beats 0-1): Full roster of 1,000 students, choose 10 fairly?
  // =========================================================================
  const rCols = P ? 10 : 20, rRows = P ? 10 : 5;
  const rDx = P ? 0.54 : 0.46, rDy = 0.44;
  const rCenter = P ? [0, -1.85, 0] : [0, -0.45, 0];
  const rFrameW = P ? 6.4 : 10.0, rFrameH = P ? 5.4 : 3.0;
  const rosterFrame = new M.RoundedRectangle({ width: rFrameW, height: rFrameH, cornerRadius: 0.22, color: C.line, strokeWidth: 2 });
  rosterFrame.setFill(C.card, 0.72); rosterFrame.moveTo(rCenter);
  const rosterTitle = T('FULL ROSTER · 1,000 STUDENTS', P ? 19 : 21, C.cyan, true);
  rosterTitle.moveTo([rCenter[0], rCenter[1] + rFrameH / 2 - 0.30, 0]);
  const rosterSub = T('1 dot = 10 students', P ? 16 : 17, C.muted, true);
  rosterSub.moveTo([rCenter[0], rCenter[1] - rFrameH / 2 + 0.28, 0]);

  const rosterPts = [];
  const rosterDots = [];
  for (let r = 0; r < rRows; r++) {
    for (let c = 0; c < rCols; c++) {
      const pt = [
        rCenter[0] + (c - (rCols - 1) / 2) * rDx,
        rCenter[1] + ((rRows - 1) / 2 - r) * rDy - 0.02,
        0
      ];
      rosterPts.push(pt);
      const d = new M.Dot({ point: pt, radius: P ? 0.095 : 0.085, color: C.cyan });
      d.setFill(C.cyan, 0.78);
      rosterDots.push(d);
    }
  }

  // Beat 0: We now have a good list: the full roster of one thousand students.
  await until(S(0));
  await play(
    new M.Create(rosterFrame, { runTime: 0.7 }),
    new M.FadeIn(rosterTitle),
    new M.FadeIn(rosterSub),
    new M.LaggedStart(rosterDots.map(d => new M.FadeIn(d)), { lagRatio: 0.015, runTime: 1.9 }),
    ...say('FULL ROSTER: 1,000 STUDENTS', C.cyan)
  );

  // Beat 1: But how do we choose ten of them fairly?
  const pickIdx = [4, 15, 22, 37, 46, 53, 68, 74, 86, 95];
  const rosterSel = pickIdx.map(idx => {
    const pt = rosterPts[idx];
    const ring = new M.Circle({ radius: 0.17, color: C.amber });
    ring.moveTo(pt);
    const dot = new M.Dot({ point: pt, radius: 0.11, color: C.amber });
    dot.setFill(C.amber, 1);
    return new M.VGroup(ring, dot);
  });
  await until(S(1));
  await play(
    new M.LaggedStart(rosterSel.map(g => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('HOW TO CHOOSE 10 FAIRLY?', C.amber)
  );

  // =========================================================================
  // ACT 2 (Beats 2-6): Tiny problem — 5 students A..E, trips 10..50, mean 30
  // =========================================================================
  const STU = [
    { name: 'A', val: 10 },
    { name: 'B', val: 20 },
    { name: 'C', val: 30 },
    { name: 'D', val: 40 },
    { name: 'E', val: 50 },
  ];
  const LW = P ? 6.6 : 7.6;
  const lx0 = CX - LW / 2;
  const xMin = v => lx0 + (v / 60) * LW;
  const AY = P ? -0.05 : 0.50;
  const dotY = AY + (P ? 0.32 : 0.28);

  const phRings = STU.map(st => {
    const c = new M.Circle({ radius: 0.22, color: C.violet });
    c.moveTo([xMin(st.val), dotY, 0]);
    return c;
  });

  // Beat 2: Let's first make the problem tiny, so we can see everything.
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(rosterFrame, rosterTitle, rosterSub, ...rosterDots, ...rosterSel)),
    new M.LaggedStart(phRings.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }),
    ...say('MAKE IT TINY: 5 STUDENTS', C.violet)
  );

  // Beat 3: Imagine just five students, called A, B, C, D and E.
  const stuDots = STU.map(st => glowDot([xMin(st.val), dotY, 0], C.cyan, P ? 0.14 : 0.13));
  const stuLabs = STU.map(st => {
    const t = T(st.name, P ? 22 : 21, C.ink, true);
    t.moveTo([xMin(st.val) + (P ? 0.34 : 0.32), dotY + (P ? 0.34 : 0.30), 0]);   // upper right: clear of the mean line
    return t;
  });
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...phRings)),
    new M.LaggedStart(STU.map((_, i) => new M.FadeIn(stuDots[i])), { lagRatio: 0.18, runTime: 2.2 }),
    new M.LaggedStart(STU.map((_, i) => new M.FadeIn(stuLabs[i])), { lagRatio: 0.18, runTime: 2.2 }),
    ...say('5 STUDENTS: A, B, C, D, E', C.cyan)
  );

  // Beat 4: Their trips are ten, twenty, thirty, forty and fifty minutes.
  const axisLine = new M.Line({ start: [lx0, AY, 0], end: [lx0 + LW, AY, 0], color: C.muted, strokeWidth: 2.5 });
  const axisTicks = [10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [xMin(v), AY - 0.07, 0], end: [xMin(v), AY + 0.07, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 18 : 17, C.cyan, true).moveTo([xMin(v), AY - (P ? 0.30 : 0.25), 0])
  ));
  const axisUnit = T('min', P ? 15 : 15, C.muted);
  axisUnit.moveTo([lx0 + LW - 0.15, AY - (P ? 0.30 : 0.25), 0]);

  await until(S(4));
  await play(
    new M.Create(axisLine, { runTime: 0.9 }),
    new M.LaggedStart(axisTicks.map(tk => new M.FadeIn(tk)), { lagRatio: 0.18, runTime: 2.4 }),
    new M.FadeIn(axisUnit),
    ...say('TRIPS: 10, 20, 30, 40, 50 MIN', C.cyan)
  );

  // Beat 5: Their mean is thirty minutes. Let's draw it as a dashed line.
  const trueLine1 = new M.DashedLine({
    start: [xMin(30), AY + 0.03, 0],
    end: [xMin(30), AY + (P ? 1.02 : 0.84), 0],
    color: C.amber
  });
  const trueTag1 = T('true mean = 30', P ? 16 : 15, C.amber, true);
  trueTag1.moveTo([xMin(30), AY + (P ? 1.24 : 1.00), 0]);
  await until(S(5));
  await play(
    new M.Create(trueLine1, { runTime: 1.0 }),
    new M.FadeIn(trueTag1),
    ...fbox(['5 students: A to E', 'trips: 10, 20, 30, 40, 50', ['true mean = 30 min', C.amber]], C.amber),
    ...say('TRUE MEAN = 30 MINUTES', C.amber)
  );

  // Beat 6: We want a sample of two students.
  const pairHi = new M.VGroup(
    new M.Circle({ radius: 0.24, color: C.green }).moveTo([xMin(10), dotY, 0]),
    new M.Circle({ radius: 0.24, color: C.green }).moveTo([xMin(20), dotY, 0])
  );
  await until(S(6));
  await play(
    new M.FadeIn(pairHi, { runTime: 0.7 }),
    ...fbox(['5 students: A to E', 'true mean = 30 min', ['sample size = 2', C.green]], C.green),
    ...say('SAMPLE SIZE = 2 STUDENTS', C.green)
  );

  // =========================================================================
  // ACT 3 (Beats 7-12): List all 10 possible pairs
  // =========================================================================
  const PAIRS = [
    { a: 'A', b: 'B', r: 0, c: 0, m: 15 },
    { a: 'A', b: 'C', r: 0, c: 1, m: 20 },
    { a: 'A', b: 'D', r: 0, c: 2, m: 25 },
    { a: 'A', b: 'E', r: 0, c: 3, m: 30 },
    { a: 'B', b: 'C', r: 1, c: 0, m: 25 },
    { a: 'B', b: 'D', r: 1, c: 1, m: 30 },
    { a: 'B', b: 'E', r: 1, c: 2, m: 35 },
    { a: 'C', b: 'D', r: 2, c: 0, m: 35 },
    { a: 'C', b: 'E', r: 2, c: 1, m: 40 },
    { a: 'D', b: 'E', r: 3, c: 0, m: 45 },
  ];
  const cardW = P ? 1.58 : 1.82, cardH = P ? 0.88 : 0.56;
  const colSp = P ? 1.76 : 1.98, rowSp = P ? 1.02 : 0.68;
  const row0Y = P ? -1.40 : -0.35;
  const cardPos = p => [CX + (p.c - 1.5) * colSp, row0Y - p.r * rowSp, 0];

  const cardBgs = PAIRS.map(p => {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.14, color: C.line, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo(cardPos(p));
    return r;
  });
  const cardNames = PAIRS.map(p => {
    const [x, y] = cardPos(p);
    const t = T(`${p.a}, ${p.b}`, P ? 20 : 18, C.cyan, true);
    t.moveTo(P ? [x, y + 0.19, 0] : [x - 0.40, y, 0]);
    return t;
  });

  // Beat 7: How many different pairs can we make? Let's list them all.
  await until(S(7));
  await play(
    new M.FadeOut(pairHi, { runTime: 0.6 }),
    ...fbox(['sample size = 2', 'list every possible pair'], C.cyan),
    ...say('ALL POSSIBLE PAIRS OF 2', C.cyan)
  );

  // Beat 8: A with B. A with C. A with D. A with E.
  await until(S(8));
  await play(
    new M.LaggedStart([0, 1, 2, 3].map(i => new M.FadeIn(cardBgs[i])), { lagRatio: 0.3, runTime: 2.5 }),
    new M.LaggedStart([0, 1, 2, 3].map(i => new M.FadeIn(cardNames[i])), { lagRatio: 0.3, runTime: 2.5 })
  );

  // Beat 9: B with C. B with D. B with E.
  await until(S(9));
  await play(
    new M.LaggedStart([4, 5, 6].map(i => new M.FadeIn(cardBgs[i])), { lagRatio: 0.3, runTime: 2.3 }),
    new M.LaggedStart([4, 5, 6].map(i => new M.FadeIn(cardNames[i])), { lagRatio: 0.3, runTime: 2.3 })
  );

  // Beat 10: C with D. C with E.
  await until(S(10));
  await play(
    new M.LaggedStart([7, 8].map(i => new M.FadeIn(cardBgs[i])), { lagRatio: 0.35, runTime: 1.4 }),
    new M.LaggedStart([7, 8].map(i => new M.FadeIn(cardNames[i])), { lagRatio: 0.35, runTime: 1.4 })
  );

  // Beat 11: And D with E.
  await until(S(11));
  await play(
    new M.FadeIn(cardBgs[9], { runTime: 0.7 }),
    new M.FadeIn(cardNames[9], { runTime: 0.7 })
  );

  // Beat 12: That is ten possible pairs.
  await until(S(12));
  await play(
    new M.LaggedStart(cardBgs.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.06, runTime: 1.2 }),
    ...fbox(['5 students, choose 2', ['10 possible pairs', C.amber]], C.amber),
    ...say('10 POSSIBLE PAIRS', C.amber)
  );

  // =========================================================================
  // ACT 4 (Beats 13-17): Equal chance 1/10, cards in a hat, definition
  // =========================================================================
  const chanceLabs = PAIRS.map(p => {
    const [x, y] = cardPos(p);
    const t = T('1/10', P ? 19 : 16, C.green, true);
    t.moveTo(P ? [x, y - 0.2, 0] : [x + 0.42, y, 0]);
    return t;
  });

  // Beat 13: A fair draw gives every one of these ten pairs the same chance: one in ten.
  await until(S(13));
  await play(
    new M.LaggedStart(chanceLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 2.0 }),
    ...fbox(['every pair gets:', ['1 in 10 chance', C.green]], C.green),
    ...say('EACH PAIR: 1 IN 10 CHANCE', C.green)
  );

  // Beat 14: Picture ten folded cards in a hat, one pair on each card. You pull one card without looking.
  const hx = P ? 1.75 : 0.25, hy = P ? -3.75 : -2.05;
  const hatBody = new M.RoundedRectangle({ width: P ? 2.1 : 1.9, height: P ? 0.95 : 0.75, cornerRadius: 0.22, color: C.violet, strokeWidth: 2.5 });
  hatBody.setFill(C.card, 0.95); hatBody.moveTo([hx, hy - 0.18, 0]);
  const hatBrim = new M.RoundedRectangle({ width: P ? 2.75 : 2.5, height: 0.18, cornerRadius: 0.09, color: C.violet, strokeWidth: 2 });
  hatBrim.setFill(C.violet, 0.35); hatBrim.moveTo([hx, hy + (P ? 0.28 : 0.18), 0]);
  const hatText = T('10 cards', P ? 15 : 14, C.muted, true);
  hatText.moveTo([hx, hy - 0.20, 0]);
  const pulledCard = new M.RoundedRectangle({ width: 0.92, height: 0.44, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
  pulledCard.setFill(C.bg, 0.95); pulledCard.moveTo([hx, hy + (P ? 0.85 : 0.66), 0]);
  const pulledLab = T('B, E', 15, C.amber, true);
  pulledLab.moveTo([hx, hy + (P ? 0.85 : 0.66), 0]);
  const hatGroup = new M.VGroup(hatBody, hatBrim, hatText, pulledCard, pulledLab);

  await until(S(14));
  await play(
    new M.FadeIn(hatGroup, { runTime: 1.2 }),
    new M.Flash(pulledCard, { color: C.amber }),
    ...say('10 CARDS IN A HAT → PULL 1', C.violet)
  );

  // Beat 15: This way of choosing is called a simple random sample.
  await until(S(15));
  await play(
    new M.FadeOut(hatGroup, { runTime: 0.7 }),
    ...fbox([['Simple random sample', C.cyan], 'all 10 pairs', 'equally likely'], C.cyan),
    ...say('SIMPLE RANDOM SAMPLE', C.cyan)
  );

  // Beat 16: Random means decided by chance, not by anyone's choice.
  await until(S(16));
  await play(
    ...fbox([['random:', C.amber], 'decided by chance,', 'not human choice'], C.amber),
    ...say('RANDOM = DECIDED BY CHANCE', C.amber)
  );

  // Beat 17: Simple random means every possible sample of that size has the same chance.
  await until(S(17));
  await play(
    new M.LaggedStart(chanceLabs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.08, runTime: 2.0 }),
    ...fbox([['simple random:', C.green], 'every pair has the', 'same 1 in 10 chance'], C.green),
    ...say('EVERY SAMPLE: SAME CHANCE', C.green)
  );

  // =========================================================================
  // ACT 5 (Beats 18-20): Every student appears in 4 of 10 pairs
  // =========================================================================
  const ringA = new M.Circle({ radius: 0.25, color: C.amber });
  ringA.moveTo([xMin(10), dotY, 0]);

  // Beat 18: So each student has a fair chance too. Look at student A.
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...chanceLabs), { runTime: 0.6 }),
    new M.FadeIn(ringA),
    new M.Flash(stuDots[0], { color: C.amber }),
    ...say('LOOK AT STUDENT A', C.amber)
  );

  // Beat 19: A appears in four of the ten pairs. So A has four chances in ten.
  const aOutlines = [0, 1, 2, 3].map(i => {
    const r = new M.RoundedRectangle({ width: cardW + 0.04, height: cardH + 0.04, cornerRadius: 0.15, color: C.amber, strokeWidth: 3 });
    r.moveTo(cardPos(PAIRS[i]));
    return r;
  });
  await until(S(19));
  await play(
    new M.LaggedStart(aOutlines.map(r => new M.Create(r)), { lagRatio: 0.16, runTime: 1.6 }),
    ...fbox(['student A appears in:', 'AB, AC, AD, AE', ['4 of 10 pairs = 4/10', C.amber]], C.amber),
    ...say('A IS IN 4 OF 10 PAIRS', C.amber)
  );

  // Beat 20: The same is true for B, for C, for D and for E.
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(ringA, ...aOutlines), { runTime: 0.6 }),
    new M.LaggedStart([1, 2, 3, 4].map(i => new M.Indicate(stuDots[i], { color: C.green })), { lagRatio: 0.25, runTime: 2.2 }),
    ...fbox(['A: 4/10   B: 4/10', 'C: 4/10   D: 4/10', ['E: 4/10  (all equal!)', C.green]], C.green),
    ...say('A, B, C, D, E: ALL 4 IN 10', C.green)
  );

  // =========================================================================
  // ACT 6 (Beats 21-25): Mean trip of each pair
  // =========================================================================
  const cardMeans = PAIRS.map(p => {
    const [x, y] = cardPos(p);
    const col = p.m === 30 ? C.green : (p.m === 15 || p.m === 45) ? C.pink : C.amber;
    const t = T(String(p.m), P ? 21 : 18, col, true);
    t.moveTo(P ? [x, y - 0.2, 0] : [x + 0.44, y, 0]);
    return t;
  });

  // Beat 21: Now let's find the mean trip of each pair.
  await until(S(21));
  await play(
    ...fbox(['pair mean =', 'average of its 2 trips'], C.cyan),
    ...say('MEAN TRIP OF EACH PAIR', C.cyan)
  );

  // Beat 22: A with B gives fifteen. A with E gives thirty. D with E gives forty-five.
  await until(S(22));
  await play(
    new M.LaggedStart([0, 3, 9].map(i => new M.FadeIn(cardMeans[i])), { lagRatio: 0.72, runTime: 4.2 }),
    ...fbox(['A,B: (10+20)÷2 = 15', ['A,E: (10+50)÷2 = 30', C.green], 'D,E: (40+50)÷2 = 45'], C.amber),
    ...say('AB = 15 · AE = 30 · DE = 45', C.amber)
  );

  // Beat 23: Here are all ten pair means: fifteen, twenty, twenty-five, thirty, twenty-five.
  await until(S(23));
  await play(
    new M.LaggedStart([
      new M.Indicate(cardMeans[0], { color: C.pink }),
      new M.FadeIn(cardMeans[1]),
      new M.FadeIn(cardMeans[2]),
      new M.Indicate(cardMeans[3], { color: C.green }),
      new M.FadeIn(cardMeans[4]),
    ], { lagRatio: 0.45, runTime: 4.2 }),
    ...say('15, 20, 25, 30, 25', C.cyan)
  );

  // Beat 24: Then thirty, thirty-five, thirty-five, forty and forty-five.
  await until(S(24));
  await play(
    new M.LaggedStart([
      new M.FadeIn(cardMeans[5]),
      new M.FadeIn(cardMeans[6]),
      new M.FadeIn(cardMeans[7]),
      new M.FadeIn(cardMeans[8]),
      new M.Indicate(cardMeans[9], { color: C.pink }),
    ], { lagRatio: 0.42, runTime: 3.6 }),
    ...say('30, 35, 35, 40, 45', C.cyan)
  );

  // Beat 25: Some pairs land low, some land high. One pair can miss the truth by a lot.
  const extremeOutlines = [0, 9].map(i => {
    const r = new M.RoundedRectangle({ width: cardW + 0.05, height: cardH + 0.05, cornerRadius: 0.15, color: C.pink, strokeWidth: 3 });
    r.moveTo(cardPos(PAIRS[i]));
    return r;
  });
  await until(S(25));
  await play(
    new M.Create(extremeOutlines[0], { runTime: 0.8 }),
    new M.Create(extremeOutlines[1], { runTime: 0.8 }),
    ...fbox([['lowest:  15  (−15)', C.pink], ['true:    30', C.amber], ['highest: 45  (+15)', C.pink]], C.pink),
    ...say('ONE PAIR CAN MISS BY 15 MIN', C.pink)
  );

  // =========================================================================
  // ACT 7 (Beats 26-32): Dot plot of all 10 pair means, unbiased vs parking
  // =========================================================================
  const DY = P ? -1.50 : -0.95;
  const dotLine = new M.Line({ start: [lx0, DY, 0], end: [lx0 + LW, DY, 0], color: C.muted, strokeWidth: 2.5 });
  const dotTicks = [10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [xMin(v), DY - 0.07, 0], end: [xMin(v), DY + 0.07, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 18 : 17, C.muted, true).moveTo([xMin(v), DY - (P ? 0.34 : 0.30), 0])
  ));
  const dotUnit = T('minutes', P ? 15 : 15, C.muted);
  dotUnit.moveTo([lx0 + LW - 0.35, DY - (P ? 0.65 : 0.56), 0]);
  const trueLine2 = new M.DashedLine({
    start: [xMin(30), DY + 0.03, 0],   // starts above the axis: does not cross the "30" tick label
    end: [xMin(30), DY + (P ? 1.75 : 1.52), 0],
    color: C.amber
  });
  const trueTag2 = T('true mean = 30', P ? 17 : 16, C.amber, true);
  trueTag2.moveTo([xMin(30), DY + (P ? 2.02 : 1.78), 0]);

  const SORTED_MEANS = [15, 20, 25, 25, 30, 30, 35, 35, 40, 45];
  const seenCnt = {};
  const meanDots = SORTED_MEANS.map(v => {
    const level = seenCnt[v] || 0;
    seenCnt[v] = level + 1;
    const pt = [xMin(v), DY + (P ? 0.34 : 0.30) + level * (P ? 0.44 : 0.40), 0];
    return glowDot(pt, C.cyan, P ? 0.14 : 0.13);
  });

  // Beat 26: Now let's stack all ten pair means as dots on a line.
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(
      axisLine, ...axisTicks, axisUnit, trueLine1, trueTag1,
      ...stuDots, ...stuLabs, ...cardBgs, ...cardNames, ...cardMeans, ...extremeOutlines
    ), { runTime: 0.6 }),
    new M.Create(dotLine, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...dotTicks, dotUnit, trueLine2, trueTag2)),
    new M.LaggedStart(meanDots.map(d => new M.FadeIn(d)), { lagRatio: 0.12, runTime: 2.0 }),
    ...say('ALL 10 PAIR MEANS AS DOTS', C.cyan)
  );

  // Beat 27: They pile up around thirty, spread evenly on both sides.
  const symY = DY + (P ? 1.28 : 1.15);
  const symLeft = new M.VGroup(
    mkArrow([xMin(30) - 0.20, symY, 0], [xMin(15), symY, 0], C.green),
    T('−15', 16, C.green, true).moveTo([(xMin(30) + xMin(15)) / 2, symY + 0.24, 0])
  );
  const symRight = new M.VGroup(
    mkArrow([xMin(30) + 0.20, symY, 0], [xMin(45), symY, 0], C.green),
    T('+15', 16, C.green, true).moveTo([(xMin(30) + xMin(45)) / 2, symY + 0.24, 0])
  );
  await until(S(27));
  await play(
    new M.FadeIn(symLeft),
    new M.FadeIn(symRight),
    new M.Indicate(meanDots[4], { color: C.amber }),
    new M.Indicate(meanDots[5], { color: C.amber }),
    ...say('BALANCED AROUND 30', C.green)
  );

  // Beat 28: Let's take the mean of all ten pair means. They add up to three hundred.
  await until(S(28));
  await play(
    new M.LaggedStart(meanDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.08, runTime: 2.2 }),
    ...fbox(['15+20+25+25+30', '+30+35+35+40+45', ['sum = 300', C.amber]], C.amber),
    ...say('SUM OF ALL 10 MEANS = 300', C.amber)
  );

  // Beat 29: Three hundred divided by ten is exactly thirty.
  const meanMarker = new M.VGroup(
    new M.Line({ start: [xMin(30), DY - 0.16, 0], end: [xMin(30), DY + 0.16, 0], color: C.green, strokeWidth: 5 }),
    new M.Dot({ point: [xMin(30), DY, 0], radius: 0.11, color: C.green }).setFill(C.green, 1)
  );
  await until(S(29));
  await play(
    new M.FadeIn(meanMarker),
    new M.Flash(meanMarker, { color: C.green }),
    ...fbox(['sum   = 300', 'count = 10 pairs', ['300 ÷ 10 = 30 min', C.green]], C.green),
    ...say('300 ÷ 10 = 30 (EXACTLY!)', C.green)
  );

  // Beat 30: This is the key idea. A single sample can miss. But the method does not lean one way.
  await until(S(30));
  await play(
    new M.Indicate(meanDots[0], { color: C.pink }),
    new M.Indicate(meanDots[9], { color: C.pink }),
    ...fbox([['1 sample: can miss', C.pink], ['method:   centered', C.green], ['          at 30 min', C.green]], C.amber),
    ...say('ONE CAN MISS · NO LEAN', C.amber)
  );

  // Beat 31: Remember, bias means missing in the same direction again and again. A method with no bias is called unbiased.
  const unbiasedTag = new M.VGroup(
    new M.RoundedRectangle({ width: 2.1, height: 0.44, cornerRadius: 0.22, color: C.green, strokeWidth: 2 }).setFill(C.bg, 0.92).moveTo([xMin(46), DY + (P ? 1.35 : 1.18), 0]),
    T('UNBIASED', 17, C.green, true).moveTo([xMin(46), DY + (P ? 1.35 : 1.18), 0])
  );
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(symLeft, symRight), { runTime: 0.6 }),
    new M.FadeIn(unbiasedTag),
    ...fbox([['bias:', C.pink], 'leans one way', ['unbiased:', C.green], 'no lean either way'], C.green),
    ...say('NO BIAS = UNBIASED', C.green)
  );

  // Beat 32: Compare the parking list from the last lesson. It always leaned low.
  const PY = P ? -3.70 : -2.25;
  const parkLine = new M.Line({ start: [lx0, PY, 0], end: [lx0 + LW, PY, 0], color: C.line, strokeWidth: 2 });
  const parkTrue = new M.DashedLine({ start: [xMin(30), PY - 0.22, 0], end: [xMin(30), PY + 0.55, 0], color: C.amber });
  const parkMark = new M.Line({ start: [xMin(24), PY - 0.22, 0], end: [xMin(24), PY + 0.55, 0], color: C.pink, strokeWidth: 3.5 });
  const parkDots = [20, 22, 24, 24, 26, 28].map((v, i) => {
    const up = (i === 3) ? 0.30 : 0;
    const d = new M.Dot({ point: [xMin(v), PY + 0.22 + up, 0], radius: 0.10, color: C.pink });
    d.setFill(C.pink, 0.9);
    return d;
  });
  const parkArrow = mkArrow([xMin(30) - 0.08, PY + 0.48, 0], [xMin(24) + 0.08, PY + 0.48, 0], C.pink, 0.14);
  const parkLab = T('parking list ≈ 24 (leans low)', P ? 16 : 15, C.pink, true);
  parkLab.moveTo([CX, PY - (P ? 0.48 : 0.40), 0]);
  const parkGroup = [parkLine, parkTrue, parkMark, ...parkDots, parkArrow, parkLab];

  await until(S(32));
  await play(
    new M.FadeIn(new M.VGroup(...parkGroup)),
    ...fbox([['simple random: 30', C.green], ['parking list:  24', C.pink], ['(6 min too low)', C.pink]], C.pink),
    ...say('PARKING LIST: LEANED LOW', C.pink)
  );

  // =========================================================================
  // ACT 8 (Beats 33-36): Back to the real university (1,000 students)
  // =========================================================================
  const uCols = P ? 10 : 20, uRows = P ? 10 : 5;
  const uDx = P ? 0.52 : 0.36, uDy = 0.40;
  const uCenter = P ? [0, -2.05, 0] : [CX, -0.55, 0];
  const uFW = P ? 6.2 : 8.0, uFH = P ? 5.0 : 2.9;
  const uFrame = new M.RoundedRectangle({ width: uFW, height: uFH, cornerRadius: 0.20, color: C.line, strokeWidth: 2 });
  uFrame.setFill(C.card, 0.72); uFrame.moveTo(uCenter);
  const uTitle = T('ROSTER · 1,000 · 1 DOT = 10 STUDENTS', P ? 17 : 19, C.cyan, true);
  uTitle.moveTo([uCenter[0], uCenter[1] + uFH / 2 - 0.28, 0]);
  const uPts = [];
  const uDots = [];
  for (let r = 0; r < uRows; r++) {
    for (let c = 0; c < uCols; c++) {
      const pt = [
        uCenter[0] + (c - (uCols - 1) / 2) * uDx,
        uCenter[1] + ((uRows - 1) / 2 - r) * uDy - 0.08,
        0
      ];
      uPts.push(pt);
      const d = new M.Dot({ point: pt, radius: P ? 0.09 : 0.075, color: C.cyan });
      d.setFill(C.cyan, 0.72);
      uDots.push(d);
    }
  }

  // Beat 33: Now back to the real university.
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(
      dotLine, ...dotTicks, dotUnit, trueLine2, trueTag2,
      ...meanDots, meanMarker, unbiasedTag, ...parkGroup
    ), { runTime: 0.6 }),
    ...hideBox(),
    new M.Create(uFrame, { runTime: 0.7 }),
    new M.FadeIn(uTitle),
    new M.FadeIn(new M.VGroup(...uDots)),
    ...say('BACK TO THE 1,000 STUDENTS', C.cyan)
  );

  // Beat 34: Number the roster from one to one thousand.
  const uNums = T('#1   #2   #3   …   #999   #1,000', P ? 17 : 16, C.cyan, true);
  uNums.moveTo([uCenter[0], uCenter[1] - uFH / 2 - (P ? 0.36 : 0.32), 0]);
  await until(S(34));
  await play(
    new M.FadeIn(uNums),
    ...fbox(['roster numbered:', ['1, 2, 3 … 1,000', C.cyan]], C.cyan),
    ...say('NUMBER ROSTER: 1 TO 1,000', C.cyan)
  );

  // Beat 35: Let a computer draw ten different numbers by chance.
  const uPick = [3, 12, 26, 38, 50, 61, 73, 81, 90, 98];
  const uSel = uPick.map(idx => {
    const pt = uPts[idx];
    const ring = new M.Circle({ radius: P ? 0.16 : 0.14, color: C.amber });
    ring.moveTo(pt);
    const dot = new M.Dot({ point: pt, radius: P ? 0.10 : 0.09, color: C.amber });
    dot.setFill(C.amber, 1);
    return new M.VGroup(ring, dot);
  });
  await until(S(35));
  await play(
    new M.LaggedStart(uSel.map(g => new M.FadeIn(g)), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox([['computer draw (10):', C.amber], '42, 118, 267, 389,', '504, 612, 735, 819,', '903, 981'], C.amber),
    ...say('COMPUTER DRAWS 10 NUMBERS', C.amber)
  );

  // Beat 36: Each student now has ten chances in one thousand. That is one chance in one hundred.
  const onePt = uPts[44];
  const uOneRing = new M.Circle({ radius: 0.24, color: C.green });
  uOneRing.moveTo(onePt);
  // tag below the roster, not on the dots
  const tagY = uCenter[1] - uFH / 2 - (P ? 0.95 : 0.85), tagX = uCenter[0];
  const uOneTag = new M.VGroup(
    new M.RoundedRectangle({ width: P ? 3.4 : 3.2, height: 0.46, cornerRadius: 0.23, color: C.green, strokeWidth: 2 }).setFill(C.bg, 0.95).moveTo([tagX, tagY, 0]),
    T('each student: 1 in 100', P ? 17 : 16, C.green, true).moveTo([tagX, tagY, 0])
  );
  await until(S(36));
  await play(
    new M.FadeIn(uOneRing),
    new M.FadeIn(uOneTag),
    new M.Flash(uOneRing, { color: C.green }),
    ...fbox(['each student:', '10 in 1,000', ['= 1 in 100 chance', C.green]], C.green),
    ...say('EACH STUDENT: 1 IN 100', C.green)
  );

  // =========================================================================
  // ACT 9 (Beats 37-40): The idea in one line, everyday words, what it is for
  // =========================================================================
  // Beat 37: Here is the idea in one line.
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(uFrame, uTitle, ...uDots, uNums, ...uSel, uOneRing, uOneTag), { runTime: 0.7 }),
    ...hideBox(),
    ...say('THE IDEA IN ONE LINE', C.cyan)
  );

  // Beat 38: Simple random sample: every possible sample of the chosen size is equally likely.
  const defCard = mkCard([
    ['Simple random sample', C.cyan],
    ['Every possible sample of the', C.ink],
    ['chosen size is equally likely.', C.amber],
  ], P ? [0, -0.35, 0] : [0, 0.15, 0], P ? 7.1 : 10.2, C.cyan);
  await until(S(38));
  await play(
    new M.FadeIn(defCard, { runTime: 1.0 }),
    ...say('SIMPLE RANDOM SAMPLE', C.cyan)
  );

  // Beat 39: In everyday words: let chance choose, and give everyone the same chance.
  const plainCard = mkCard([
    ['In everyday words:', C.green],
    ['Let chance choose, and give', C.ink],
    ['everyone the same chance.', C.ink],
  ], P ? [0, -2.65, 0] : [0, -1.75, 0], P ? 7.1 : 10.2, C.green);
  await until(S(39));
  await play(
    new M.FadeIn(plainCard, { runTime: 1.0 }),
    ...say('LET CHANCE CHOOSE FAIRLY', C.green)
  );

  // Beat 40: This is what it is for: it removes our own choices from the sample, so the answer does not lean.
  const scY = P ? -1.75 : -0.55;
  const beamW = P ? 4.8 : 6.4;
  const beam = new M.Line({ start: [-beamW / 2, scY, 0], end: [beamW / 2, scY, 0], color: C.green, strokeWidth: 4 });
  const stand = new M.Line({ start: [0, scY, 0], end: [0, scY - 1.05, 0], color: C.muted, strokeWidth: 3 });
  const base = new M.Line({ start: [-0.9, scY - 1.05, 0], end: [0.9, scY - 1.05, 0], color: C.muted, strokeWidth: 3 });
  const pivot = new M.Dot({ point: [0, scY, 0], radius: 0.13, color: C.amber }).setFill(C.amber, 1);
  const panL = new M.VGroup(
    new M.RoundedRectangle({ width: 1.8, height: 0.50, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 }).setFill(C.card, 0.95).moveTo([-beamW / 2 + 0.6, scY + 0.45, 0]),
    T('low draws', 16, C.cyan, true).moveTo([-beamW / 2 + 0.6, scY + 0.45, 0])
  );
  const panR = new M.VGroup(
    new M.RoundedRectangle({ width: 1.8, height: 0.50, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 }).setFill(C.card, 0.95).moveTo([beamW / 2 - 0.6, scY + 0.45, 0]),
    T('high draws', 16, C.cyan, true).moveTo([beamW / 2 - 0.6, scY + 0.45, 0])
  );
  const balNote = T('no personal choice → stays level', P ? 18 : 20, C.green, true);
  balNote.moveTo([0, scY - 1.55, 0]);
  const scaleGroup = new M.VGroup(stand, base, beam, pivot, panL, panR, balNote);

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(defCard, plainCard), { runTime: 0.7 }),
    new M.FadeIn(scaleGroup, { runTime: 1.0 }),
    ...say('REMOVES CHOICE → NO LEAN', C.green)
  );

  // =========================================================================
  // ACT 10 (Beats 41-44): Common trap, clear groups preview, recap
  // =========================================================================
  const gCenterY = P ? -1.95 : -0.60;
  const gLeft = CX - (P ? 3.2 : 3.7);
  const gRight = CX + (P ? 3.2 : 3.7);
  const gateLine = new M.Line({ start: [gLeft, gCenterY - 1.35, 0], end: [gLeft, gCenterY + 1.25, 0], color: C.amber, strokeWidth: 3 });
  const gateLab = T('8:00 GATE', 16, C.amber, true);
  gateLab.moveTo([gLeft + 0.75, gCenterY + 1.45, 0]);
  const laterLab = T('arriving later →', 16, C.muted, true);
  laterLab.moveTo([gRight - 1.1, gCenterY + 1.45, 0]);

  const gateDotPts = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      gateDotPts.push([gLeft + 0.48 + c * 0.56, gCenterY + 0.85 - r * 0.45, 0]);
    }
  }
  const laterDotPts = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      laterDotPts.push([gLeft + 2.05 + c * (P ? 0.82 : 0.92), gCenterY + 0.85 - r * 0.45, 0]);
    }
  }
  const gateDots = gateDotPts.map(pt => glowDot(pt, C.cyan, 0.11));
  const laterDots = laterDotPts.map(pt => glowDot(pt, C.cyan, 0.11));

  // Beat 41: Here is a common trap. Grabbing whoever is near feels random, but it is not.
  await until(S(41));
  await play(
    new M.FadeOut(scaleGroup, { runTime: 0.7 }),
    new M.Create(gateLine),
    new M.FadeIn(gateLab),
    new M.FadeIn(laterLab),
    new M.FadeIn(new M.VGroup(...gateDots, ...laterDots)),
    ...say('TRAP: NEARBY ≠ RANDOM', C.pink)
  );

  // Beat 42: Asking the first ten students at the gate at eight o'clock misses everyone who arrives later.
  const gateBox = new M.RoundedRectangle({ width: 1.30, height: 2.35, cornerRadius: 0.18, color: C.pink, strokeWidth: 3 });
  gateBox.moveTo([gLeft + 0.76, gCenterY - 0.05, 0]);
  const laterGreyDots = laterDotPts.map(pt => {
    const d = new M.Dot({ point: pt, radius: 0.10, color: C.muted });
    d.setFill(C.muted, 0.35);
    return d;
  });
  const missedTag = new M.VGroup(
    new M.RoundedRectangle({ width: 2.4, height: 0.46, cornerRadius: 0.23, color: C.pink, strokeWidth: 2 }).setFill(C.bg, 0.94).moveTo([(gLeft + 2.05 + gRight) / 2, gCenterY - 0.05, 0]),
    T('ALL MISSED!', 17, C.pink, true).moveTo([(gLeft + 2.05 + gRight) / 2, gCenterY - 0.05, 0])
  );

  await until(S(42));
  await play(
    new M.Create(gateBox, { runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(...laterDots), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...laterGreyDots), { runTime: 0.7 }),
    new M.FadeIn(missedTag),
    ...fbox([['first 10 at 8:00:', C.pink], 'misses everyone', 'who arrives later', ['→ biased sample', C.pink]], C.pink),
    ...say('8:00 GATE MISSES LATER ARRIVALS', C.pink)
  );

  // Beat 43: In the next lesson, we will see how to do even better when the population has clear groups.
  function campusBox(title, sub, center, cols, rows, color) {
    const bw = P ? 6.2 : 4.8, bh = P ? 2.15 : 2.9;
    const r = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.20, color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.88); r.moveTo(center);
    const t1 = T(title, P ? 20 : 21, color, true);
    t1.moveTo([center[0], center[1] + bh / 2 - 0.34, 0]);
    const t2 = T(sub, P ? 16 : 16, C.muted, true);
    t2.moveTo([center[0], center[1] - bh / 2 + 0.28, 0]);
    const dots = [];
    const dx = (bw - 1.2) / Math.max(1, cols - 1), dy = (bh - 1.25) / Math.max(1, rows - 1);
    for (let rr = 0; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        const pt = [
          center[0] + (cc - (cols - 1) / 2) * dx,
          center[1] + ((rows - 1) / 2 - rr) * dy + 0.02,
          0
        ];
        const d = new M.Dot({ point: pt, radius: 0.10, color });
        d.setFill(color, 0.9);
        dots.push(d);
      }
    }
    return new M.VGroup(r, t1, t2, ...dots);
  }
  const cityGroup = campusBox('CITY CAMPUS', '600 students · mean 20 min', P ? [0, -0.45, 0] : [-2.85, -0.55, 0], 6, 3, C.cyan);
  const hillGroup = campusBox('HILL CAMPUS', '400 students · mean 45 min', P ? [0, -3.20, 0] : [2.85, -0.55, 0], 4, 3, C.amber);

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(gateLine, gateLab, laterLab, ...gateDots, ...laterGreyDots, gateBox, missedTag), { runTime: 0.7 }),
    ...hideBox(),
    new M.FadeIn(cityGroup, { runTime: 0.9 }),
    new M.FadeIn(hillGroup, { runTime: 0.9 }),
    ...say('NEXT: CLEAR GROUPS', C.violet)
  );

  // Beat 44: In one sentence: a simple random sample gives every possible sample the same chance, so it does not lean.
  const recapCard = mkCard([
    ['Simple random sample', C.cyan],
    ['Every possible sample gets', C.ink],
    ['the same chance,', C.ink],
    ['so the method does not lean.', C.green],
  ], P ? [0, -1.65, 0] : [0, -0.45, 0], P ? 7.2 : 10.6, C.green);

  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(cityGroup, hillGroup), { runTime: 0.7 }),
    new M.FadeIn(recapCard, { runTime: 1.0 }),
    ...say('SAME CHANCE → DOES NOT LEAN', C.green)
  );
}
