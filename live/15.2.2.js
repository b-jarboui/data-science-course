// 15.2.2 Discounted return: why earlier rewards matter.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 1.88, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.28, 0] : [4.45, -0.42, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one box on screen at a time.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.41 : 0.40;
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
    const maxw = P ? FW - 0.9 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }

  // Helper: glowing arrow built from Line primitives (guaranteed clean in manim-web).
  function glowArrow(p1, p2, color, trim = 0.52, off = [0, 0]) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const st = [p1[0] + ux * trim + off[0], p1[1] + uy * trim + off[1], 0];
    const en = [p2[0] - ux * trim + off[0], p2[1] - uy * trim + off[1], 0];
    const glow = new M.Line({ start: st, end: en, color, strokeWidth: 10 });
    glow.setStrokeOpacity(0.24);
    const shaft = new M.Line({ start: st, end: en, color, strokeWidth: 4 });
    const hl = 0.22, ang = 0.52, base = Math.atan2(uy, ux) + Math.PI;
    const w1 = new M.Line({ start: en, end: [en[0] + hl * Math.cos(base + ang), en[1] + hl * Math.sin(base + ang), 0], color, strokeWidth: 4 });
    const w2 = new M.Line({ start: en, end: [en[0] + hl * Math.cos(base - ang), en[1] + hl * Math.sin(base - ang), 0], color, strokeWidth: 4 });
    return new M.VGroup(glow, shaft, w1, w2);
  }

  // ===========================================================================
  // ACT 1 (0–13): The 4-cell grid, white delivery cart, green dock, two routes
  // ===========================================================================
  const GY = P ? -2.0 : -0.68;
  const CELL = P ? 2.6 : 1.85;
  const pos = {
    A: [CX - CELL / 2, GY + CELL / 2, 0],
    B: [CX + CELL / 2, GY + CELL / 2, 0],
    C: [CX - CELL / 2, GY - CELL / 2, 0],
    D: [CX + CELL / 2, GY - CELL / 2, 0],
  };

  const cellBoxes = {}, gridItems = [];
  for (const k of ['A', 'B', 'C', 'D']) {
    const isDock = k === 'D';
    const box = new M.RoundedRectangle({
      width: CELL - 0.14, height: CELL - 0.14, cornerRadius: 0.16,
      color: isDock ? C.green : C.line, strokeWidth: isDock ? 3 : 2.5,
    });
    box.setFill(isDock ? C.green : C.card, isDock ? 0.16 : 0.95);
    box.moveTo(pos[k]);
    cellBoxes[k] = box;
    gridItems.push(box);

    const lbl = T(k, P ? 20 : 19, isDock ? C.green : C.muted, true, true);
    lbl.moveTo([pos[k][0] - CELL / 2 + 0.34, pos[k][1] + CELL / 2 - 0.32, 0]);
    gridItems.push(lbl);

    if (isDock) {
      const dockTxt = T('DOCK', P ? 16 : 15, C.green, true, true);
      dockTxt.moveTo([pos[k][0], pos[k][1] - CELL / 2 + 0.34, 0]);
      gridItems.push(dockTxt);
    }
  }

  // Delivery cart (white): 3 primitives transformed together for smooth motion.
  function makeCartParts(p) {
    const body = new M.RoundedRectangle({ width: 0.58, height: 0.30, cornerRadius: 0.08, color: C.ink, strokeWidth: 2 });
    body.setFill(C.ink, 0.96); body.moveTo([p[0], p[1] + 0.05, 0]);
    const w1 = new M.Circle({ radius: 0.075, color: C.ink, strokeWidth: 2.5 });
    w1.setFill(C.bg, 1); w1.moveTo([p[0] - 0.16, p[1] - 0.14, 0]);
    const w2 = new M.Circle({ radius: 0.075, color: C.ink, strokeWidth: 2.5 });
    w2.setFill(C.bg, 1); w2.moveTo([p[0] + 0.16, p[1] - 0.14, 0]);
    return [body, w1, w2];
  }
  const cart = makeCartParts(pos.A);
  const moveCart = (p, rt = 0.85) => {
    const tgt = makeCartParts(p);
    return cart.map((part, idx) => new M.Transform(part, tgt[idx], { runTime: rt }));
  };

  function makeRewardTag(txt, p, col = C.amber) {
    const bg = new M.RoundedRectangle({ width: txt.length > 2 ? 0.72 : 0.52, height: 0.36, cornerRadius: 0.18, color: col, strokeWidth: 2 });
    bg.setFill(C.bg, 0.95); bg.moveTo(p);
    const t = T(txt, 17, col, true, true); t.moveTo(p);
    return new M.VGroup(bg, t);
  }

  // 0: Let's return to our small delivery cart.
  await until(S(0));
  await play(
    new M.LaggedStart(gridItems.map(o => new M.FadeIn(o)), { lagRatio: 0.05, runTime: 0.9 }),
    ...cart.map(p => new M.FadeIn(p, { runTime: 0.8 })),
    ...say('DELIVERY CART ON THE 4-CELL GRID')
  );

  // 1: The cart starts in cell A and needs to reach the dock in cell D.
  await until(S(1));
  await play(
    new M.Indicate(cellBoxes.A, { color: C.ink, runTime: 0.8 }),
    new M.Indicate(cellBoxes.D, { color: C.green, runTime: 1.0 }),
    ...say('START AT A  →  REACH DOCK D', C.green)
  );

  // 2: Imagine the cart has two possible routes.
  await until(S(2));
  await play(
    ...say('TWO POSSIBLE ROUTES', C.cyan),
    ...fbox([['Route 1:  ?', C.cyan], ['Route 2:  ?', C.pink]], C.cyan)
  );

  // 3: On the first route, the cart moves right to cell B.
  const r1Arr1 = glowArrow(pos.A, pos.B, C.cyan, CELL * 0.27);
  await until(S(3));
  await play(
    new M.FadeIn(r1Arr1, { runTime: 0.6 }),
    ...moveCart(pos.B, 0.85),
    ...say('ROUTE 1 · MOVE 1: A → B', C.cyan)
  );

  // 4: The reward for this move is zero.
  const r1Tag1 = makeRewardTag('0', [(pos.A[0] + pos.B[0]) / 2 - 0.32, pos.A[1] + 0.34, 0], C.amber);
  await until(S(4));
  await play(
    new M.FadeIn(r1Tag1, { runTime: 0.55 }),
    ...fbox([['Route 1', C.cyan], ['move 1:  0', C.amber], ['total:   0', C.muted]], C.cyan),
    ...say('MOVE 1 REWARD = 0', C.amber)
  );

  // 5: The cart then moves down to the dock.
  const r1Arr2 = glowArrow(pos.B, pos.D, C.cyan, CELL * 0.27);
  await until(S(5));
  await play(
    new M.FadeIn(r1Arr2, { runTime: 0.55 }),
    ...moveCart(pos.D, 0.8),
    ...say('ROUTE 1 · MOVE 2: B → D', C.cyan)
  );

  // 6: The reward for this move is ten points.
  const r1Tag2 = makeRewardTag('+10', [pos.B[0] + 0.44, (pos.B[1] + pos.D[1]) / 2, 0], C.amber);
  await until(S(6));
  await play(
    new M.FadeIn(r1Tag2, { runTime: 0.55 }),
    new M.Flash(cellBoxes.D, { color: C.amber, flashRadius: 0.45, runTime: 0.7 }),
    ...fbox([['Route 1', C.cyan], ['move 1:  0', C.muted], ['move 2: 10', C.amber], ['total:  10', C.amber]], C.amber),
    ...say('MOVE 2 REWARD = 10 POINTS', C.amber)
  );

  // 7: The delivery takes two moves.
  await until(S(7));
  await play(
    ...fbox([['Route 1: A → B → D', C.cyan], ['rewards: 0, 10', C.amber], ['2 moves  |  total 10', C.cyan]], C.cyan),
    ...say('ROUTE 1: 2 MOVES', C.cyan)
  );

  // 8: Now let's watch the second route.
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(r1Arr1, r1Arr2, r1Tag1, r1Tag2), { runTime: 0.45 }),
    ...moveCart(pos.A, 0.7),
    ...fbox([['Route 2', C.pink], ['starting at A...', C.muted]], C.pink),
    ...say('SECOND ROUTE', C.pink)
  );

  // 9: The cart moves right to cell B and earns zero points.
  const r2Arr1 = glowArrow(pos.A, pos.B, C.pink, CELL * 0.27, [0, 0.16]);
  const r2Tag1 = makeRewardTag('0', [(pos.A[0] + pos.B[0]) / 2 - 0.32, pos.A[1] + 0.46, 0], C.amber);
  await until(S(9));
  await play(
    new M.FadeIn(r2Arr1, { runTime: 0.55 }),
    ...moveCart(pos.B, 0.8),
    new M.FadeIn(r2Tag1, { runTime: 0.55 }),
    ...fbox([['Route 2', C.pink], ['move 1 (A→B): 0', C.amber]], C.pink),
    ...say('MOVE 1: A → B (REWARD 0)', C.pink)
  );

  // 10: It moves left, back to cell A, and earns zero points.
  const r2Arr2 = glowArrow(pos.B, pos.A, C.pink, CELL * 0.27, [0, -0.16]);
  const r2Tag2 = makeRewardTag('0', [(pos.A[0] + pos.B[0]) / 2, pos.A[1] - 0.46, 0], C.amber);
  await until(S(10));
  await play(
    new M.FadeIn(r2Arr2, { runTime: 0.55 }),
    ...moveCart(pos.A, 0.8),
    new M.FadeIn(r2Tag2, { runTime: 0.55 }),
    ...fbox([['Route 2', C.pink], ['moves 1–2: 0, 0', C.amber]], C.pink),
    ...say('MOVE 2: B → A (REWARD 0)', C.pink)
  );

  // 11: It moves down to cell C and earns zero points.
  const r2Arr3 = glowArrow(pos.A, pos.C, C.pink, CELL * 0.27);
  const r2Tag3 = makeRewardTag('0', [pos.A[0] - 0.42, (pos.A[1] + pos.C[1]) / 2, 0], C.amber);
  await until(S(11));
  await play(
    new M.FadeIn(r2Arr3, { runTime: 0.55 }),
    ...moveCart(pos.C, 0.8),
    new M.FadeIn(r2Tag3, { runTime: 0.55 }),
    ...fbox([['Route 2', C.pink], ['moves 1–3: 0, 0, 0', C.amber]], C.pink),
    ...say('MOVE 3: A → C (REWARD 0)', C.pink)
  );

  // 12: Finally, it moves right to the dock and earns ten points.
  const r2Arr4 = glowArrow(pos.C, pos.D, C.pink, CELL * 0.27);
  const r2Tag4 = makeRewardTag('+10', [(pos.C[0] + pos.D[0]) / 2, pos.C[1] - 0.42, 0], C.amber);
  await until(S(12));
  await play(
    new M.FadeIn(r2Arr4, { runTime: 0.55 }),
    ...moveCart(pos.D, 0.8),
    new M.FadeIn(r2Tag4, { runTime: 0.55 }),
    new M.Flash(cellBoxes.D, { color: C.amber, flashRadius: 0.45, runTime: 0.7 }),
    ...fbox([['Route 2', C.pink], ['rewards: 0, 0, 0, 10', C.amber], ['total:   10', C.amber]], C.amber),
    ...say('MOVE 4: C → D (REWARD 10)', C.amber)
  );

  // 13: This delivery takes four moves.
  await until(S(13));
  await play(
    ...fbox([['Route 2: A→B→A→C→D', C.pink], ['rewards: 0, 0, 0, 10', C.amber], ['4 moves  |  total 10', C.pink]], C.pink),
    ...say('ROUTE 2: 4 MOVES', C.pink)
  );

  // ===========================================================================
  // ACT 2a (14–17): Place both routes' rewards on two aligned timelines
  // ===========================================================================
  const MX = P ? [-2.45, -1.15, 0.15, 1.45] : [-4.25, -2.75, -1.25, 0.25];
  const RLX = P ? -3.55 : -5.68;
  const RESX = P ? 3.0 : 1.48;
  const Y_HDR = P ? 1.15 : 1.15;
  const Y_WT  = P ? 0.55 : 0.70;
  const Y1    = P ? -0.45 : -0.02;
  const Y1_D  = P ? -1.45 : -0.76;
  const Y2    = P ? -2.85 : -1.68;
  const Y2_D  = P ? -3.85 : -2.42;
  const TW = P ? 1.0 : 0.96, TH = P ? 0.64 : 0.50;

  function makeTile(txt, p, borderCol, textCol = borderCol, fillCol = C.card, fillOp = 0.95, w = TW) {
    const r = new M.RoundedRectangle({ width: w, height: TH, cornerRadius: 0.14, color: borderCol, strokeWidth: 2.2 });
    r.setFill(fillCol, fillOp); r.moveTo(p);
    const t = T(txt, P ? 22 : 19, textCol, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  }

  function buildTimelines() {
    const hdrs = [1, 2, 3, 4].map((m, i) => {
      const t = T(`Move ${m}`, P ? 17 : 16, C.muted, true);
      t.moveTo([MX[i], Y_HDR, 0]);
      return t;
    });
    const r1Lbl = T(P ? 'R1' : 'Route 1', P ? 19 : 17, C.cyan, true, true); r1Lbl.moveTo([RLX, Y1, 0]);
    const r2Lbl = T(P ? 'R2' : 'Route 2', P ? 19 : 17, C.pink, true, true); r2Lbl.moveTo([RLX, Y2, 0]);
    // Connectors run only in the gaps between tiles, never through a number.
    const seg = (i, y, col) => new M.Line({ start: [MX[i] + TW / 2 + 0.04, y, 0], end: [MX[i + 1] - TW / 2 - 0.04, y, 0], color: col, strokeWidth: 3 });
    const r1Line = new M.VGroup(seg(0, Y1, C.cyan));
    const r2Line = new M.VGroup(seg(0, Y2, C.pink), seg(1, Y2, C.pink), seg(2, Y2, C.pink));
    const r1Tiles = [
      makeTile('0', [MX[0], Y1, 0], C.muted, C.muted),
      makeTile('10', [MX[1], Y1, 0], C.amber, C.amber, C.amber, 0.15),
    ];
    const r2Tiles = [
      makeTile('0', [MX[0], Y2, 0], C.muted, C.muted),
      makeTile('0', [MX[1], Y2, 0], C.muted, C.muted),
      makeTile('0', [MX[2], Y2, 0], C.muted, C.muted),
      makeTile('10', [MX[3], Y2, 0], C.amber, C.amber, C.amber, 0.15),
    ];
    return { hdrs, r1Lbl, r2Lbl, r1Line, r2Line, r1Tiles, r2Tiles };
  }

  const tl1 = buildTimelines();

  // 14: Let's place the rewards from both routes on two lines, in the order they arrive.
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...gridItems, ...cart, r2Arr1, r2Arr2, r2Arr3, r2Arr4, r2Tag1, r2Tag2, r2Tag3, r2Tag4), { runTime: 0.6 }),
    ...say('REWARDS IN THE ORDER THEY ARRIVE', C.cyan)
  );
  await play(
    new M.LaggedStart([
      ...tl1.hdrs.map(h => new M.FadeIn(h)),
      new M.FadeIn(tl1.r1Lbl), new M.Create(tl1.r1Line), ...tl1.r1Tiles.map(t => new M.FadeIn(t)),
      new M.FadeIn(tl1.r2Lbl), new M.Create(tl1.r2Line), ...tl1.r2Tiles.map(t => new M.FadeIn(t)),
    ], { lagRatio: 0.06, runTime: 1.4 }),
    ...fbox([['Route 1: 0, 10', C.cyan], ['Route 2: 0, 0, 0, 10', C.pink]], C.cyan)
  );

  // 15: Both routes earn ten points in total.
  await until(S(15));
  await play(
    new M.Indicate(tl1.r1Tiles[1], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(tl1.r2Tiles[3], { color: C.amber, runTime: 0.9 }),
    ...fbox([['Route 1 total = 10', C.amber], ['Route 2 total = 10', C.amber]], C.amber),
    ...say('BOTH EARN 10 POINTS IN TOTAL', C.amber)
  );

  // 16: But the first route reaches the dock sooner.
  await until(S(16));
  await play(
    new M.Flash(tl1.r1Tiles[1], { color: C.cyan, flashRadius: 0.4, runTime: 0.8 }),
    new M.Indicate(tl1.r1Tiles[1], { color: C.cyan, runTime: 0.8 }),
    ...say('ROUTE 1 REACHES THE DOCK SOONER', C.cyan)
  );

  // 17: How can we teach the cart to prefer the first route?
  await until(S(17));
  await play(
    ...fbox([['Route 1: 10 (move 2)', C.cyan], ['Route 2: 10 (move 4)', C.pink], ['Same total → tie!', C.amber]], C.amber),
    ...say('HOW TO PREFER THE FASTER ROUTE?', C.amber)
  );

  // ===========================================================================
  // ACT 2b (18–20): Everyday intuition — gift today vs next week
  // ===========================================================================
  function makeGift(center, color, labelTxt) {
    const [x, y] = center;
    const box = new M.RoundedRectangle({ width: 1.25, height: 1.05, cornerRadius: 0.12, color, strokeWidth: 3 });
    box.setFill(color, 0.16); box.moveTo([x, y, 0]);
    const rv = new M.Line({ start: [x, y - 0.52, 0], end: [x, y + 0.52, 0], color: C.amber, strokeWidth: 4 });
    const rh = new M.Line({ start: [x - 0.62, y, 0], end: [x + 0.62, y, 0], color: C.amber, strokeWidth: 4 });
    const b1 = new M.Circle({ radius: 0.16, color: C.amber, strokeWidth: 3 }); b1.moveTo([x - 0.18, y + 0.66, 0]);
    const b2 = new M.Circle({ radius: 0.16, color: C.amber, strokeWidth: 3 }); b2.moveTo([x + 0.18, y + 0.66, 0]);
    const lbl = T(labelTxt, P ? 18 : 19, color, true, true); lbl.moveTo([x, y - 0.92, 0]);
    return new M.VGroup(box, rv, rh, b1, b2, lbl);
  }
  const giftToday = makeGift([CX - (P ? 1.55 : 1.75), GY, 0], C.green, 'TODAY');
  const giftLater = makeGift([CX + (P ? 1.55 : 1.75), GY, 0], C.muted, 'NEXT WEEK');

  // 18: Imagine someone offers you the same gift today or next week.
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...tl1.hdrs, tl1.r1Lbl, tl1.r2Lbl, tl1.r1Line, tl1.r2Line, ...tl1.r1Tiles, ...tl1.r2Tiles), { runTime: 0.55 }),
    new M.FadeIn(giftToday, { runTime: 0.7 }),
    new M.FadeIn(giftLater, { runTime: 0.7 }),
    ...fbox([['Same gift:', C.ink], ['Today', C.green], ['or Next week?', C.muted]], C.amber),
    ...say('SAME GIFT: TODAY OR NEXT WEEK?', C.amber)
  );

  // 19: You might prefer to receive the gift today rather than wait.
  await until(S(19));
  await play(
    new M.Indicate(giftToday, { color: C.green, runTime: 0.9 }),
    new M.Flash(giftToday, { color: C.green, flashRadius: 0.65, runTime: 0.8 }),
    ...say('TODAY FEELS BETTER THAN WAITING', C.green)
  );

  // 20: We can give the cart a similar reason to prefer earlier rewards.
  const BX = P ? [-2.4, -0.8, 0.8, 2.4] : [-4.55, -3.10, -1.65, -0.20];
  const B_BASE = P ? -3.45 : -2.20;
  const B_FULL = P ? 3.20 : 2.55;
  const BW = P ? 0.92 : 0.90;
  const barFloor = new M.Line({ start: [BX[0] - 0.7, B_BASE, 0], end: [BX[3] + 0.7, B_BASE, 0], color: C.muted, strokeWidth: 2 });
  const barMoveLbls = [1, 2, 3, 4].map((m, i) => {
    const t = T(`Move ${m}`, P ? 17 : 16, C.muted, true);
    t.moveTo([BX[i], B_BASE - 0.34, 0]);
    return t;
  });

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(giftToday, giftLater), { runTime: 0.55 }),
    new M.Create(barFloor, { runTime: 0.55 }),
    ...barMoveLbls.map(t => new M.FadeIn(t, { runTime: 0.55 })),
    ...fbox([['Give earlier rewards', C.ink], ['more value', C.violet]], C.violet),
    ...say('EARLIER REWARDS MATTER MORE', C.violet)
  );

  // ===========================================================================
  // ACT 2c (21–28): Halving value bars + naming discounting, factor, return
  // ===========================================================================
  function makeBarStep(idx, frac, lblTxt) {
    const x = BX[idx], h = B_FULL * frac;
    const ghost = new M.Rectangle({ width: BW, height: B_FULL, color: C.grid, strokeWidth: 1.5 });
    ghost.setFill(C.card, 0.25); ghost.moveTo([x, B_BASE + B_FULL / 2, -0.01]);
    const bar = new M.Rectangle({ width: BW, height: h, color: C.violet, strokeWidth: 2 });
    bar.setFill(C.violet, 0.82); bar.moveTo([x, B_BASE + h / 2, 0]);
    const val = T(lblTxt, P ? 21 : 18, C.violet, true, true);
    val.moveTo([x, B_BASE + h + 0.32, 0]);
    return { ghost, bar, val };
  }
  function makeHalfStep(i) {
    const midX = (BX[i] + BX[i + 1]) / 2, y = B_BASE + B_FULL + 0.38;
    const t = T('×0.5', P ? 17 : 16, C.amber, true, true);
    t.moveTo([midX, y + 0.24, 0]);
    const arr = glowArrow([BX[i] + 0.15, y, 0], [BX[i + 1] - 0.15, y, 0], C.amber, 0.18);
    return new M.VGroup(arr, t);
  }

  const bs0 = makeBarStep(0, 1, '1');
  const bs1 = makeBarStep(1, 0.5, '1/2');
  const bs2 = makeBarStep(2, 0.25, '1/4');
  const bs3 = makeBarStep(3, 0.125, '1/8');
  const hs01 = makeHalfStep(0), hs12 = makeHalfStep(1), hs23 = makeHalfStep(2);

  // 21: Let's count the reward from the first move at its full value.
  await until(S(21));
  await play(
    new M.FadeIn(bs0.ghost, { runTime: 0.4 }),
    new M.FadeIn(bs0.bar, { runTime: 0.65 }),
    new M.FadeIn(bs0.val, { runTime: 0.65 }),
    ...fbox([['Move 1:  full value', C.violet], ['         × 1', C.ink]], C.violet),
    ...say('MOVE 1: FULL VALUE (× 1)', C.violet)
  );

  // 22: For the second move, we count only half of the reward.
  await until(S(22));
  await play(
    new M.FadeIn(hs01, { runTime: 0.55 }),
    new M.FadeIn(bs1.ghost, { runTime: 0.4 }),
    new M.FadeIn(bs1.bar, { runTime: 0.65 }),
    new M.FadeIn(bs1.val, { runTime: 0.65 }),
    ...fbox([['Move 1:  × 1', C.muted], ['Move 2:  × 1/2 (half)', C.violet]], C.violet),
    ...say('MOVE 2: HALF OF THE REWARD', C.violet)
  );

  // 23: For the third move, we count half of that half, which is one quarter.
  await until(S(23));
  await play(
    new M.FadeIn(hs12, { runTime: 0.55 }),
    new M.FadeIn(bs2.ghost, { runTime: 0.4 }),
    new M.FadeIn(bs2.bar, { runTime: 0.65 }),
    new M.FadeIn(bs2.val, { runTime: 0.65 }),
    ...fbox([['Move 2:  × 1/2', C.muted], ['Move 3:  × 1/4', C.violet]], C.violet),
    ...say('MOVE 3: ONE QUARTER (× 1/4)', C.violet)
  );

  // 24: For every extra move, we reduce the value of the reward by half again.
  await until(S(24));
  await play(
    new M.FadeIn(hs23, { runTime: 0.55 }),
    new M.FadeIn(bs3.ghost, { runTime: 0.4 }),
    new M.FadeIn(bs3.bar, { runTime: 0.65 }),
    new M.FadeIn(bs3.val, { runTime: 0.65 }),
    ...fbox([['Each extra move:', C.ink], ['1 → 1/2 → 1/4 → 1/8', C.violet]], C.violet),
    ...say('EACH EXTRA MOVE: HALF AGAIN', C.violet)
  );

  // 25: This reduction in value is called discounting.
  await until(S(25));
  await play(
    new M.LaggedStart([bs0.bar, bs1.bar, bs2.bar, bs3.bar].map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.15, runTime: 1.1 }),
    ...fbox([['Discounting', C.violet], ['= reducing later', C.ink], ['  reward values', C.ink]], C.violet),
    ...say('DISCOUNTING', C.violet)
  );

  // 26: The number we multiply by after each extra move is called the discount factor.
  await until(S(26));
  await play(
    new M.LaggedStart([hs01, hs12, hs23].map(h => new M.Indicate(h, { color: C.amber })), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox([['Discount factor', C.amber], ['= number we multiply', C.ink], ['  by each extra move', C.ink]], C.amber),
    ...say('DISCOUNT FACTOR', C.amber)
  );

  // 27: Our discount factor is one half, or zero point five.
  await until(S(27));
  await play(
    ...fbox([['discount factor', C.ink], ['= 1/2 = 0.5', C.amber]], C.amber),
    ...say('DISCOUNT FACTOR = 0.5', C.amber)
  );

  // 28: When we add the rewards after discounting, the result is called the discounted return.
  const plusSigns = [0, 1, 2].map(i => {
    const t = T('+', 22, C.violet, true, true);
    t.moveTo([(BX[i] + BX[i + 1]) / 2, B_BASE + 0.28, 0]);
    return t;
  });
  await until(S(28));
  await play(
    new M.LaggedStart(plusSigns.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 0.8 }),
    ...fbox([['Discounted return', C.violet], ['= sum of all', C.ink], ['  discounted rewards', C.violet]], C.violet),
    ...say('DISCOUNTED RETURN', C.violet)
  );

  // ===========================================================================
  // ACT 3 (29–42): Worked examples on Route 1 and Route 2
  // ===========================================================================
  const tl2 = buildTimelines();
  const wtLbls = ['×1', '×0.5', '×0.25', '×0.125'].map((w, i) => {
    const t = T(w, P ? 17 : 16, C.violet, true, true);
    t.moveTo([MX[i], Y_WT, 0]);
    return t;
  });

  // 29: Let's calculate the discounted return for our first route.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(
      barFloor, ...barMoveLbls,
      bs0.ghost, bs0.bar, bs0.val, bs1.ghost, bs1.bar, bs1.val,
      bs2.ghost, bs2.bar, bs2.val, bs3.ghost, bs3.bar, bs3.val,
      hs01, hs12, hs23, ...plusSigns
    ), { runTime: 0.55 }),
    ...say('CALCULATE ROUTE 1', C.cyan)
  );
  await play(
    new M.LaggedStart([
      ...tl2.hdrs.map(h => new M.FadeIn(h)),
      ...wtLbls.map(w => new M.FadeIn(w)),
      new M.FadeIn(tl2.r1Lbl), new M.Create(tl2.r1Line), ...tl2.r1Tiles.map(t => new M.FadeIn(t)),
    ], { lagRatio: 0.05, runTime: 1.0 }),
    ...fbox([['Route 1', C.cyan], ['rewards: 0, 10', C.amber]], C.cyan)
  );

  // 30: The first reward is zero, and we count its full value.
  const r1d0 = makeTile('0', [MX[0], Y1_D, 0], C.violet, C.violet, C.violet, 0.14);
  await until(S(30));
  await play(
    new M.Indicate(tl2.r1Tiles[0], { color: C.violet, runTime: 0.7 }),
    new M.FadeIn(r1d0, { runTime: 0.6 }),
    ...fbox([['Route 1', C.cyan], ['move 1: 0 × 1 = 0', C.violet]], C.violet),
    ...say('MOVE 1: 0 × 1 = 0', C.violet)
  );

  // 31: The second reward is ten, and we count half of ten, which is five.
  const r1d1 = makeTile('5', [MX[1], Y1_D, 0], C.violet, C.violet, C.violet, 0.22);
  await until(S(31));
  await play(
    new M.Indicate(tl2.r1Tiles[1], { color: C.amber, runTime: 0.7 }),
    new M.FadeIn(r1d1, { runTime: 0.65 }),
    ...fbox([['Route 1', C.cyan], ['move 1:  0 × 1   = 0', C.muted], ['move 2: 10 × 0.5 = 5', C.violet]], C.violet),
    ...say('MOVE 2: HALF OF 10 = 5', C.violet)
  );

  // 32: Zero plus five makes five.
  const r1Plus = T('+', 20, C.violet, true, true);
  r1Plus.moveTo([(MX[0] + MX[1]) / 2, Y1_D, 0]);
  await until(S(32));
  await play(
    new M.FadeIn(r1Plus, { runTime: 0.5 }),
    ...fbox([['Route 1', C.cyan], ['0 + 5 = 5', C.violet]], C.violet),
    ...say('0 + 5 = 5', C.violet)
  );

  // 33: The discounted return for the first route is five.
  const r1Res = makeTile('= 5', [RESX, Y1_D, 0], C.cyan, C.cyan, C.cyan, 0.16, P ? 1.02 : 1.08);
  await until(S(33));
  await play(
    new M.FadeIn(r1Res, { runTime: 0.6 }),
    new M.Flash(r1Res, { color: C.cyan, flashRadius: 0.4, runTime: 0.7 }),
    ...fbox([['Route 1', C.cyan], ['discounted return = 5', C.cyan]], C.cyan),
    ...say('ROUTE 1 RETURN = 5', C.cyan)
  );

  // 34: Now let's calculate the discounted return for the second route.
  await until(S(34));
  await play(
    new M.FadeIn(tl2.r2Lbl, { runTime: 0.5 }),
    new M.Create(tl2.r2Line, { runTime: 0.6 }),
    new M.LaggedStart(tl2.r2Tiles.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.8 }),
    ...fbox([['Route 2', C.pink], ['rewards: 0, 0, 0, 10', C.amber]], C.pink),
    ...say('CALCULATE ROUTE 2', C.pink)
  );

  // 35: The first three rewards are zero, so discounting them still gives zero.
  const r2d0 = makeTile('0', [MX[0], Y2_D, 0], C.violet, C.violet, C.violet, 0.12);
  const r2d1 = makeTile('0', [MX[1], Y2_D, 0], C.violet, C.violet, C.violet, 0.12);
  const r2d2 = makeTile('0', [MX[2], Y2_D, 0], C.violet, C.violet, C.violet, 0.12);
  await until(S(35));
  await play(
    new M.LaggedStart([r2d0, r2d1, r2d2].map(t => new M.FadeIn(t)), { lagRatio: 0.16, runTime: 0.9 }),
    ...fbox([['Route 2', C.pink], ['moves 1–3: 0, 0, 0', C.violet]], C.violet),
    ...say('FIRST THREE REWARDS: STILL 0', C.violet)
  );

  // 36: The fourth reward is ten points.
  await until(S(36));
  await play(
    new M.Indicate(tl2.r2Tiles[3], { color: C.amber, runTime: 0.8 }),
    new M.Flash(tl2.r2Tiles[3], { color: C.amber, flashRadius: 0.38, runTime: 0.7 }),
    ...fbox([['Route 2', C.pink], ['move 4 reward = 10', C.amber]], C.amber),
    ...say('MOVE 4 REWARD = 10', C.amber)
  );

  // 37: We count half of ten, which is five.
  let r2d3 = makeTile('5', [MX[3], Y2_D, 0], C.violet, C.violet, C.violet, 0.22);
  await until(S(37));
  await play(
    new M.FadeIn(r2d3, { runTime: 0.6 }),
    ...fbox([['Move 4: halve 3 times', C.pink], ['1st half: 10 → 5', C.violet]], C.violet),
    ...say('HALF OF 10 = 5', C.violet)
  );

  // 38: We count half of five, which is two point five.
  const r2d3b = makeTile('2.5', [MX[3], Y2_D, 0], C.violet, C.violet, C.violet, 0.22);
  await until(S(38));
  await play(
    new M.FadeOut(r2d3, { runTime: 0.35 }),
    new M.FadeIn(r2d3b, { runTime: 0.55 }),
    ...fbox([['Move 4: halve 3 times', C.pink], ['1st half:  10 → 5', C.muted], ['2nd half:   5 → 2.5', C.violet]], C.violet),
    ...say('HALF OF 5 = 2.5', C.violet)
  );
  r2d3 = r2d3b;

  // 39: We count half of two point five, which is one point two five.
  const r2d3c = makeTile('1.25', [MX[3], Y2_D, 0], C.violet, C.violet, C.violet, 0.24);
  await until(S(39));
  await play(
    new M.FadeOut(r2d3, { runTime: 0.35 }),
    new M.FadeIn(r2d3c, { runTime: 0.55 }),
    ...fbox([['Move 4: halve 3 times', C.pink], ['2nd half:   5 → 2.5', C.muted], ['3rd half: 2.5 → 1.25', C.violet]], C.violet),
    ...say('HALF OF 2.5 = 1.25', C.violet)
  );
  r2d3 = r2d3c;

  // 40: The discounted return for the second route is one point two five.
  const r2Res = makeTile('=1.25', [RESX, Y2_D, 0], C.pink, C.pink, C.pink, 0.16, P ? 1.06 : 1.12);
  await until(S(40));
  await play(
    new M.FadeIn(r2Res, { runTime: 0.6 }),
    new M.Flash(r2Res, { color: C.pink, flashRadius: 0.4, runTime: 0.7 }),
    ...fbox([['Route 1 return = 5', C.cyan], ['Route 2 return = 1.25', C.pink]], C.violet),
    ...say('ROUTE 2 RETURN = 1.25', C.pink)
  );

  // 41: Notice that the cart still earns ten real reward points on either route.
  await until(S(41));
  await play(
    new M.Indicate(tl2.r1Tiles[1], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(tl2.r2Tiles[3], { color: C.amber, runTime: 0.9 }),
    ...fbox([['Real rewards earned:', C.amber], ['Route 1: 10 points', C.amber], ['Route 2: 10 points', C.amber]], C.amber),
    ...say('REAL REWARD IS STILL 10', C.amber)
  );

  // 42: Discounting only changes how we value those rewards when comparing routes.
  await until(S(42));
  await play(
    new M.Indicate(r1Res, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(r2Res, { color: C.violet, runTime: 0.9 }),
    ...fbox([['Comparison value:', C.violet], ['Route 1: 5', C.cyan], ['Route 2: 1.25', C.pink]], C.violet),
    ...say('ONLY CHANGES HOW WE VALUE THEM', C.violet)
  );

  // ===========================================================================
  // ACT 4 (43–47): The recursive formula and what discounted return is for
  // ===========================================================================

  // 43: We can now write the calculation as a short formula.
  await until(S(43));
  await play(
    ...fbox([['What we did for Route 1:', C.cyan], ['0  +  0.5 × 10  =  5', C.violet], ['first + factor × rest', C.muted]], C.cyan),
    ...say('THE SHORT FORMULA', C.cyan)
  );

  // 44: Discounted return equals the first reward, plus the discount factor times the remaining discounted return.
  const boxFirst = new M.RoundedRectangle({ width: TW + 0.18, height: TH + 0.18, cornerRadius: 0.16, color: C.amber, strokeWidth: 3 });
  boxFirst.moveTo([MX[0], Y1, 0]);
  const boxRest = new M.RoundedRectangle({ width: TW + 0.18, height: TH + 0.18, cornerRadius: 0.16, color: C.violet, strokeWidth: 3 });
  boxRest.moveTo([MX[1], Y1, 0]);
  await until(S(44));
  await play(
    new M.Create(boxFirst, { runTime: 0.7 }),
    new M.Create(boxRest, { runTime: 0.7 }),
    ...fbox([['discounted return =', C.cyan], ['  first reward', C.amber], ['  + factor × remaining', C.violet], ['    discounted return', C.violet], ['Route 1: 0 + 0.5 × 10 = 5', C.ink]], C.cyan),
    ...say('FIRST + FACTOR × REMAINING', C.cyan)
  );

  // 45: We repeat this calculation until there are no more rewards.
  await until(S(45));
  await play(
    new M.LaggedStart(tl2.r2Tiles.map(t => new M.Indicate(t, { color: C.violet })), { lagRatio: 0.18, runTime: 1.3 }),
    ...fbox([['Route 2, repeat:', C.pink], ['0 + 0.5×(0 + 0.5×(0 + 0.5×10))', C.violet], ['= 1.25  (no rewards left)', C.pink]], C.violet),
    ...say('REPEAT UNTIL NO MORE REWARDS', C.violet)
  );

  // 46: We use discounted return to compare routes that earn different rewards at different times.
  await until(S(46));
  await play(
    new M.FadeOut(new M.VGroup(boxFirst, boxRest), { runTime: 0.45 }),
    new M.Indicate(tl2.r1Lbl, { color: C.cyan, runTime: 0.7 }),
    new M.Indicate(tl2.r2Lbl, { color: C.pink, runTime: 0.7 }),
    ...fbox([['Compare whole routes', C.green], ['different rewards,', C.ink], ['different times', C.ink]], C.green),
    ...say('COMPARE WHOLE ROUTES', C.green)
  );

  // 47: Our cart prefers the first route because five is greater than one point two five.
  const winBox = new M.RoundedRectangle({ width: (P ? 1.02 : 1.08) + 0.22, height: TH + 0.22, cornerRadius: 0.18, color: C.green, strokeWidth: 3.5 });
  winBox.moveTo([RESX, Y1_D, 0]);
  await until(S(47));
  await play(
    new M.Create(winBox, { runTime: 0.6 }),
    new M.Flash(r1Res, { color: C.green, flashRadius: 0.5, runTime: 0.8 }),
    ...fbox([['Route 1:  5', C.green], ['Route 2:  1.25', C.muted], ['5 > 1.25 → Route 1!', C.green]], C.green),
    ...say('CART PREFERS ROUTE 1 (5 > 1.25)', C.green)
  );

  // ===========================================================================
  // ACT 5 (48–53): Sensitivity to the discount factor & recap
  // ===========================================================================
  const SX0 = P ? -2.65 : -4.95, SX1 = P ? 2.65 : 0.25;
  const SY = P ? 0.48 : 0.88;
  const sx = g => SX0 + g * (SX1 - SX0);

  const track = new M.Line({ start: [SX0, SY, 0], end: [SX1, SY, 0], color: C.muted, strokeWidth: 4 });
  const ticks = [0, 0.5, 1].map(v => {
    const tk = new M.Line({ start: [sx(v), SY - 0.12, 0], end: [sx(v), SY + 0.12, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(v), 16, C.muted, true); lb.moveTo([sx(v), SY - 0.36, 0]);
    return new M.VGroup(tk, lb);
  });
  const sTitle = T('discount factor', 16, C.amber, true, true); sTitle.moveTo([(SX0 + SX1) / 2, SY + 0.36, 0]);
  const makeKnob = g => new M.Dot({ point: [sx(g), SY, 0], radius: 0.16, color: C.amber });
  const knob = makeKnob(0.5);

  const C_BASE = P ? -4.10 : -2.42;
  const C_MAXH = P ? 3.20 : 2.30;
  const C_X1 = CX - (P ? 1.35 : 1.55);
  const C_X2 = CX + (P ? 1.35 : 1.55);
  const C_BW = P ? 1.35 : 1.35;

  const cFloor = new M.Line({ start: [C_X1 - 1.15, C_BASE, 0], end: [C_X2 + 1.15, C_BASE, 0], color: C.muted, strokeWidth: 2 });
  const cTopLine = new M.DashedLine({ start: [C_X1 - 1.15, C_BASE + C_MAXH, 0], end: [C_X2 + 1.15, C_BASE + C_MAXH, 0], color: C.line });
  const cTopLbl = T('10', 15, C.muted, true); cTopLbl.moveTo([C_X1 - 1.42, C_BASE + C_MAXH, 0]);
  const cLbl1 = T('Route 1 (2m)', P ? 16 : 16, C.cyan, true); cLbl1.moveTo([C_X1, C_BASE - 0.34, 0]);
  const cLbl2 = T('Route 2 (4m)', P ? 16 : 16, C.pink, true); cLbl2.moveTo([C_X2, C_BASE - 0.34, 0]);

  function makeRetBar(x, val, color) {
    const h = Math.max(0.06, (val / 10) * C_MAXH);
    const r = new M.Rectangle({ width: C_BW, height: h, color, strokeWidth: 2 });
    r.setFill(color, 0.78); r.moveTo([x, C_BASE + h / 2, 0]);
    return r;
  }
  function makeRetVal(x, val, txt, color) {
    const h = Math.max(0.06, (val / 10) * C_MAXH);
    const t = T(txt, 20, color, true, true);
    t.moveTo([x, C_BASE + h + 0.30, 0]);
    return t;
  }

  const bar1 = makeRetBar(C_X1, 5, C.cyan);
  const bar2 = makeRetBar(C_X2, 1.25, C.pink);
  let val1 = makeRetVal(C_X1, 5, '5', C.cyan);
  let val2 = makeRetVal(C_X2, 1.25, '1.25', C.pink);

  // 48: But be careful: the discount factor controls how much the cart cares about later rewards.
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(
      ...tl2.hdrs, ...wtLbls,
      tl2.r1Lbl, tl2.r1Line, ...tl2.r1Tiles, r1d0, r1d1, r1Plus, r1Res, winBox,
      tl2.r2Lbl, tl2.r2Line, ...tl2.r2Tiles, r2d0, r2d1, r2d2, r2d3, r2Res
    ), { runTime: 0.5 }),
    ...say('THE DISCOUNT FACTOR MATTERS', C.amber)
  );
  await play(
    new M.Create(track, { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...ticks, sTitle, knob, cFloor, cTopLine, cTopLbl, cLbl1, cLbl2), { runTime: 0.6 }),
    new M.FadeIn(bar1, { runTime: 0.6 }), new M.FadeIn(bar2, { runTime: 0.6 }),
    new M.FadeIn(val1, { runTime: 0.6 }), new M.FadeIn(val2, { runTime: 0.6 }),
    ...fbox([['factor = 0.5', C.amber], ['Route 1 = 5', C.cyan], ['Route 2 = 1.25', C.pink]], C.amber)
  );

  // 49: If the discount factor is one, we count every reward at its full value.
  const v1_10 = makeRetVal(C_X1, 10, '10', C.cyan);
  const v2_10 = makeRetVal(C_X2, 10, '10', C.pink);
  await until(S(49));
  await play(
    new M.Transform(knob, makeKnob(1.0), { runTime: 0.9 }),
    new M.Transform(bar1, makeRetBar(C_X1, 10, C.cyan), { runTime: 0.9 }),
    new M.Transform(bar2, makeRetBar(C_X2, 10, C.pink), { runTime: 0.9 }),
    new M.FadeOut(val1, { runTime: 0.35 }), new M.FadeOut(val2, { runTime: 0.35 }),
    new M.FadeIn(v1_10, { runTime: 0.6 }), new M.FadeIn(v2_10, { runTime: 0.6 }),
    ...fbox([['factor = 1', C.amber], ['every reward = full', C.ink]], C.amber),
    ...say('FACTOR = 1: FULL VALUE ALWAYS', C.amber)
  );
  val1 = v1_10; val2 = v2_10;

  // 50: Both of our routes then have a return of ten.
  await until(S(50));
  await play(
    new M.Indicate(val1, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(val2, { color: C.amber, runTime: 0.8 }),
    ...fbox([['factor = 1', C.amber], ['Route 1 = 10', C.cyan], ['Route 2 = 10  (tie!)', C.pink]], C.amber),
    ...say('BOTH ROUTES HAVE RETURN 10', C.amber)
  );

  // 51: A very small discount factor can make an important reward far in the future almost worthless.
  const v1_tiny = makeRetVal(C_X1, 1, '1', C.cyan);
  const v2_tiny = makeRetVal(C_X2, 0.01, '0.01', C.pink);
  await until(S(51));
  await play(
    new M.Transform(knob, makeKnob(0.1), { runTime: 1.0 }),
    new M.Transform(bar1, makeRetBar(C_X1, 1, C.cyan), { runTime: 1.0 }),
    new M.Transform(bar2, makeRetBar(C_X2, 0.01, C.pink), { runTime: 1.0 }),
    new M.FadeOut(val1, { runTime: 0.35 }), new M.FadeOut(val2, { runTime: 0.35 }),
    new M.FadeIn(v1_tiny, { runTime: 0.6 }), new M.FadeIn(v2_tiny, { runTime: 0.6 }),
    ...fbox([['factor = 0.1', C.pink], ['move 2: 10 → 1', C.cyan], ['move 4: 10 → 0.01', C.pink]], C.pink),
    ...say('TINY FACTOR: FUTURE ≈ 0', C.pink)
  );
  val1 = v1_tiny; val2 = v2_tiny;

  // 52: We choose the discount factor to suit the goal we want the cart to reach.
  const v1_bal = makeRetVal(C_X1, 5, '5', C.cyan);
  const v2_bal = makeRetVal(C_X2, 1.25, '1.25', C.pink);
  await until(S(52));
  await play(
    new M.Transform(knob, makeKnob(0.5), { runTime: 0.9 }),
    new M.Transform(bar1, makeRetBar(C_X1, 5, C.cyan), { runTime: 0.9 }),
    new M.Transform(bar2, makeRetBar(C_X2, 1.25, C.pink), { runTime: 0.9 }),
    new M.FadeOut(val1, { runTime: 0.35 }), new M.FadeOut(val2, { runTime: 0.35 }),
    new M.FadeIn(v1_bal, { runTime: 0.6 }), new M.FadeIn(v2_bal, { runTime: 0.6 }),
    ...fbox([['Choose factor to suit', C.green], ['your goal (e.g. 0.5)', C.ink]], C.green),
    ...say('CHOOSE FACTOR FOR THE GOAL', C.green)
  );
  val1 = v1_bal; val2 = v2_bal;

  // 53: Remember: discounted return combines a route's rewards into one number that gives earlier rewards more value.
  await until(S(53));
  await play(
    new M.Indicate(bar1, { color: C.green, runTime: 0.9 }),
    new M.Flash(val1, { color: C.cyan, flashRadius: 0.4, runTime: 0.8 }),
    ...fbox([['Discounted return:', C.violet], ['one number per route', C.ink], ['earlier rewards > later', C.green]], C.cyan),
    ...say('EARLIER REWARDS MATTER MORE', C.cyan)
  );
}
