// 15.2.3 Policies: how the cart chooses its moves (live manim-web lesson).
// Beat i = sentence i (0-based, 53 sentences: 0..52). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]) and laptop (14.22 x 8, y in [-3.0, 2.3])
  const GX = P ? 0 : -2.4;
  const GY = P ? -0.62 : -0.68;
  const CS = P ? 2.45 : 2.04;
  const GAP = 0.22;
  const STEP = CS + GAP;
  const HC = CS / 2;

  const PILL = P ? [0, 2.42, 0] : [GX, 1.98, 0];
  const BOXP = P ? [0, 3.7, 0] : [3.45, 0.68, 0];
  const AUX = P ? [0, -4.18, 0] : [3.45, -1.68, 0];

  const pos = {
    A: [GX - STEP / 2, GY + STEP / 2, 0],
    B: [GX + STEP / 2, GY + STEP / 2, 0],
    C: [GX - STEP / 2, GY - STEP / 2, 0],
    D: [GX + STEP / 2, GY - STEP / 2, 0],
  };

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.37 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 5.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Helpers: grid cells, highlights, white cart, glowing arrows, probability labels, cell count badges
  function makeCell(name) {
    const isDock = name === 'D';
    const p = pos[name];
    const r = new M.RoundedRectangle({
      width: CS, height: CS, cornerRadius: 0.16,
      color: isDock ? C.green : C.line, strokeWidth: isDock ? 3 : 2.5,
    });
    r.setFill(isDock ? '#0e2524' : C.card, 0.94);
    r.moveTo(p);
    const parts = [r];
    if (isDock) {
      const lab = T('D · DOCK', P ? 17 : 18, C.green, true, true);
      lab.moveTo([p[0], p[1] - HC + 0.28, 0.01]);
      parts.push(lab);
    } else {
      const dx = (name === 'A' || name === 'C') ? -HC + 0.28 : HC - 0.28;
      const dy = (name === 'A' || name === 'B') ? HC - 0.28 : -HC + 0.28;
      const lab = T(name, P ? 22 : 24, C.muted, true, true);
      lab.moveTo([p[0] + dx, p[1] + dy, 0.01]);
      parts.push(lab);
    }
    return new M.VGroup(...parts);
  }

  function cellHighlight(name, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: CS + 0.1, height: CS + 0.1, cornerRadius: 0.18, color, strokeWidth: 3.5,
    });
    r.setFill(color, 0.08);
    r.moveTo([pos[name][0], pos[name][1], 0.015]);
    return r;
  }

  // White delivery cart kept as separate primitives so Transform works cleanly on every leaf
  function cartParts(pt) {
    const body = new M.RoundedRectangle({
      width: 0.46, height: 0.26, cornerRadius: 0.06, color: C.ink, strokeWidth: 2,
    });
    body.setFill(C.ink, 0.96);
    body.moveTo([pt[0], pt[1] + 0.05, 0.04]);
    const w1 = new M.Circle({ radius: 0.06, color: C.cyan, strokeWidth: 2 });
    w1.setFill(C.bg, 1);
    w1.moveTo([pt[0] - 0.13, pt[1] - 0.11, 0.05]);
    const w2 = new M.Circle({ radius: 0.06, color: C.cyan, strokeWidth: 2 });
    w2.setFill(C.bg, 1);
    w2.moveTo([pt[0] + 0.13, pt[1] - 0.11, 0.05]);
    return [body, w1, w2];
  }
  function fadeInCart(cart, runTime = 0.6) {
    return cart.map(part => new M.FadeIn(part, { runTime }));
  }
  function fadeOutCart(cart, runTime = 0.5) {
    return cart.map(part => new M.FadeOut(part, { runTime }));
  }
  function moveCart(cart, pt, runTime = 0.85) {
    const dst = cartParts(pt);
    return cart.map((part, i) => new M.Transform(part, dst[i], { runTime }));
  }

  // Glowing arrows between neighbouring cells (non-overlapping lanes)
  const OFF = 0.44, LANE = 0.24;
  const EP = {
    AB: [[pos.A[0] + OFF, pos.A[1] + LANE, 0], [pos.B[0] - OFF, pos.B[1] + LANE, 0]],
    BA: [[pos.B[0] - OFF, pos.B[1] - LANE, 0], [pos.A[0] + OFF, pos.A[1] - LANE, 0]],
    AC: [[pos.A[0] - LANE, pos.A[1] - OFF, 0], [pos.C[0] - LANE, pos.C[1] + OFF, 0]],
    CA: [[pos.C[0] + LANE, pos.C[1] + OFF, 0], [pos.A[0] + LANE, pos.A[1] - OFF, 0]],
    BD: [[pos.B[0], pos.B[1] - OFF, 0], [pos.D[0], pos.D[1] + OFF, 0]],
    CD: [[pos.C[0] + OFF, pos.C[1], 0], [pos.D[0] - OFF, pos.D[1], 0]],
  };
  const LABP = {
    AB: [GX, pos.A[1] + LANE + 0.30, 0.03],
    BA: [GX, pos.A[1] - LANE - 0.30, 0.03],
    AC: [pos.A[0] - LANE - 0.46, GY, 0.03],
    CA: [pos.A[0] + LANE + 0.40, GY, 0.03],
    BD: [pos.B[0] + 0.48, GY, 0.03],
    CD: [GX, pos.C[1] + 0.47, 0.03],
  };

  function makeArrow(key, color, width = 5.5, opacity = 1, glow = true, z = 0.02) {
    const [p1, p2] = EP[key];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const hl = 0.22, hw = 0.14;
    const tip = [p2[0], p2[1], z];
    const w1 = [p2[0] - ux * hl + px * hw, p2[1] - uy * hl + py * hw, z];
    const w2 = [p2[0] - ux * hl - px * hw, p2[1] - uy * hl - py * hw, z];
    const parts = [];
    if (glow) {
      const g = new M.Line({
        start: [p1[0], p1[1], z - 0.005],
        end: [p2[0] - ux * 0.05, p2[1] - uy * 0.05, z - 0.005],
        color, strokeWidth: width + 7,
      });
      g.setStrokeOpacity(0.18 * opacity);
      parts.push(g);
    }
    const shaft = new M.Line({
      start: [p1[0], p1[1], z],
      end: [p2[0] - ux * 0.04, p2[1] - uy * 0.04, z],
      color, strokeWidth: width,
    });
    const a1 = new M.Line({ start: w1, end: tip, color, strokeWidth: Math.min(width, 5.5) });
    const a2 = new M.Line({ start: w2, end: tip, color, strokeWidth: Math.min(width, 5.5) });
    [shaft, a1, a2].forEach(l => l.setStrokeOpacity(opacity));
    parts.push(shaft, a1, a2);
    return new M.VGroup(...parts);
  }

  function probLabel(key, text, color = C.cyan) {
    const t = T(text, P ? 19 : 18, color, true, true);
    t.moveTo(LABP[key]);
    return t;
  }

  function countBadge(cell, text, color = C.cyan) {
    const p = pos[cell];
    const t = T(text, P ? 20 : 21, color, true, true);
    const wd = Math.max(0.76, t.getWidth() + 0.28), ht = 0.44;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.bg, 0.94);
    // In the dock, sit below the arriving arrows (C→D ends on the left, B→D from the top).
    const y = cell === 'D' ? p[1] - (P ? 0.5 : 0.38) : p[1];
    const x = cell === 'D' ? p[0] + 0.12 : p[0];
    r.moveTo([x, y, 0.04]);
    t.moveTo([x, y, 0.05]);
    return new M.VGroup(r, t);
  }

  function pulseAlong(key, color = C.amber, runTime = 0.85) {
    const [p1, p2] = EP[key];
    const d = new M.Dot({ point: [p1[0], p1[1], 0.06], radius: 0.11, color });
    const dst = new M.Dot({ point: [p2[0], p2[1], 0.06], radius: 0.11, color });
    return { dot: d, anim: new M.Transform(d, dst, { runTime }) };
  }

  // Build the fixed 4-cell grid
  const cells = { A: makeCell('A'), B: makeCell('B'), C: makeCell('C'), D: makeCell('D') };
  let cart = cartParts(pos.A);

  // 0: Our delivery cart is back in cell A.
  await until(S(0));
  await play(
    new M.LaggedStart([cells.A, cells.B, cells.C, cells.D].map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 0.9 }),
    ...fadeInCart(cart, 0.9),
    ...say('CART STARTS IN CELL A')
  );

  // 1: The cart can move right to cell B or down to cell C.
  const prevAB = makeArrow('AB', C.muted, 3, 0.75, false);
  const prevAC = makeArrow('AC', C.muted, 3, 0.75, false);
  await until(S(1));
  await play(new M.FadeIn(prevAB), new M.FadeIn(prevAC), ...say('RIGHT TO B  OR  DOWN TO C'));

  // 2: Both moves are allowed, but how should the cart choose between them?
  await until(S(2));
  await play(
    new M.Indicate(prevAB, { color: C.amber }),
    new M.Indicate(prevAC, { color: C.amber }),
    ...say('HOW SHOULD THE CART CHOOSE?', C.amber)
  );

  // 3: Imagine you give the cart a coin to help it decide.
  const coinC = new M.Circle({ radius: 0.56, color: C.amber, strokeWidth: 3 });
  coinC.setFill('#241d0f', 0.95);
  coinC.moveTo(AUX);
  const coinT = T('COIN', 20, C.amber, true, true);
  coinT.moveTo(AUX);
  const coinSingle = new M.VGroup(coinC, coinT);
  await until(S(3));
  await play(new M.FadeIn(coinSingle), ...say('GIVE THE CART A COIN', C.amber));

  // 4: The coin has two sides, and each side has an equal chance of appearing.
  function makeSide(x, label, sub, color) {
    const c = new M.Circle({ radius: 0.52, color, strokeWidth: 3 });
    c.setFill(C.card, 0.95);
    c.moveTo([x, AUX[1] + 0.12, 0]);
    const t1 = T(label, 19, color, true, true);
    t1.moveTo([x, AUX[1] + 0.12, 0.01]);
    const t2 = T(sub, 15, C.muted, true);
    t2.moveTo([x, AUX[1] - 0.62, 0.01]);
    return new M.VGroup(c, t1, t2);
  }
  const side1 = makeSide(AUX[0] - 1.05, 'SIDE 1', '→ to B', C.cyan);
  const side2 = makeSide(AUX[0] + 1.05, 'SIDE 2', '↓ to C', C.cyan);
  await until(S(4));
  await play(
    new M.FadeOut(coinSingle),
    new M.FadeIn(side1),
    new M.FadeIn(side2),
    ...say('TWO EQUAL SIDES', C.amber)
  );

  // 5: If the coin shows one side, the cart moves right.
  await until(S(5));
  await play(
    new M.Indicate(side1, { color: C.amber }),
    ...moveCart(cart, pos.B, 0.85),
    ...say('SIDE 1 → MOVE RIGHT TO B')
  );

  // 6: If the coin shows the other side, the cart moves down.
  const cartDown = cartParts(pos.A);
  await until(S(6));
  await play(
    ...fadeOutCart(cart, 0.35),
    new M.Indicate(side2, { color: C.amber }),
    ...moveCart(cartDown, pos.C, 0.85),
    ...say('SIDE 2 → MOVE DOWN TO C')
  );

  // 7: Each move has a fifty percent chance of being chosen.
  cart = cartParts(pos.A);
  const pct1 = T('50%', 18, C.amber, true, true); pct1.moveTo([AUX[0] - 1.05, AUX[1] + 0.86, 0.01]);
  const pct2 = T('50%', 18, C.amber, true, true); pct2.moveTo([AUX[0] + 1.05, AUX[1] + 0.86, 0.01]);
  await until(S(7));
  await play(
    ...fadeOutCart(cartDown, 0.35),
    ...fadeInCart(cart, 0.5),
    new M.FadeIn(pct1),
    new M.FadeIn(pct2),
    ...say('50% CHANCE EACH', C.amber)
  );

  // 8: Let's draw two arrows from cell A, one for each move.
  const arrAB = makeArrow('AB', C.cyan, 5.5, 1, true);
  const arrAC = makeArrow('AC', C.cyan, 5.5, 1, true);
  const labAB = probLabel('AB', '50%', C.cyan);
  const labAC = probLabel('AC', '50%', C.cyan);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(prevAB, prevAC, side1, side2, pct1, pct2)),
    new M.FadeIn(arrAB), new M.FadeIn(arrAC),
    new M.FadeIn(labAB), new M.FadeIn(labAC),
    ...say('CELL A: TWO ARROWS')
  );

  // 9: We make both arrows equally wide because both moves have equal chances.
  await until(S(9));
  await play(
    new M.Indicate(arrAB, { color: C.amber }),
    new M.Indicate(arrAC, { color: C.amber }),
    ...fbox([['Cell A', C.cyan], ['right → B : 50%', C.ink], ['down  → C : 50%', C.ink]]),
    ...say('EQUAL WIDTH = EQUAL CHANCE')
  );

  // 10: Now let's give the cart the same rule in cell B.
  const hlB = cellHighlight('B', C.cyan);
  await until(S(10));
  await play(
    new M.FadeIn(hlB),
    ...moveCart(cart, pos.B, 0.8),
    ...say('CELL B: SAME RULE')
  );

  // 11: The cart has a fifty percent chance of moving left to cell A.
  const arrBA = makeArrow('BA', C.cyan, 5.5, 1, true);
  const labBA = probLabel('BA', '50%', C.cyan);
  await until(S(11));
  await play(
    new M.FadeIn(arrBA), new M.FadeIn(labBA),
    ...fbox([['Cell B', C.cyan], ['left → A : 50%', C.ink]])
  );

  // 12: It has a fifty percent chance of moving down to the dock.
  const arrBD = makeArrow('BD', C.cyan, 5.5, 1, true);
  const labBD = probLabel('BD', '50%', C.cyan);
  await until(S(12));
  await play(
    new M.FadeIn(arrBD), new M.FadeIn(labBD),
    ...fbox([['Cell B', C.cyan], ['left → A : 50%', C.ink], ['down → D : 50%', C.green]])
  );

  // 13: But in cell C, let's give the cart a different rule.
  const hlC = cellHighlight('C', C.amber);
  const cartAtC = cartParts(pos.C);
  await until(S(13));
  await play(
    new M.FadeOut(hlB),
    new M.FadeIn(hlC),
    ...fadeOutCart(cart, 0.4),
    ...fadeInCart(cartAtC, 0.5),
    ...fbox([['Cell C', C.amber], ['a different rule', C.ink]], C.amber),
    ...say('CELL C: DIFFERENT RULE', C.amber)
  );
  cart = cartAtC;

  // 14: The cart always moves right to the dock.
  const arrCD = makeArrow('CD', C.cyan, 11, 1, true);
  const labCD = probLabel('CD', '100%', C.green);
  await until(S(14));
  await play(
    new M.FadeIn(arrCD),
    new M.Indicate(cells.D, { color: C.green }),
    ...fbox([['Cell C', C.amber], ['always right → D', C.green]], C.amber),
    ...say('ALWAYS RIGHT TO DOCK', C.green)
  );

  // 15: Moving right has a one hundred percent chance.
  await until(S(15));
  await play(
    new M.FadeIn(labCD),
    ...fbox([['Cell C', C.amber], ['right → D : 100%', C.green]], C.amber)
  );

  // 16: Moving up has a zero percent chance.
  const arrCA = makeArrow('CA', '#637096', 2, 0.55, false);
  const labCA = probLabel('CA', '0%', C.muted);
  await until(S(16));
  await play(
    new M.FadeIn(arrCA), new M.FadeIn(labCA),
    ...fbox([['Cell C', C.amber], ['right → D : 100%', C.green], ['up    → A :   0%', C.muted]], C.amber)
  );

  // 17: We draw a wide arrow towards the dock and a thin, grey arrow towards cell A.
  await until(S(17));
  await play(
    new M.Indicate(arrCD, { color: C.green }),
    new M.Indicate(arrCA, { color: C.muted }),
    ...say('WIDE = 100%   THIN GREY = 0%', C.amber)
  );

  // 18: We now have a rule that tells the cart how to choose in every cell.
  const cartBackA = cartParts(pos.A);
  await until(S(18));
  await play(
    new M.FadeOut(hlC),
    ...fadeOutCart(cart, 0.4),
    ...fadeInCart(cartBackA, 0.5),
    ...fbox([['A: → 50%  ↓ 50%', C.cyan], ['B: ← 50%  ↓ 50%', C.cyan], ['C: → 100% ↑  0%', C.amber]]),
    ...say('A RULE FOR EVERY CELL')
  );
  cart = cartBackA;

  // 19: This rule is called a policy.
  await until(S(19));
  await play(
    new M.LaggedStart([arrAB, arrAC, arrBA, arrBD, arrCD].map(a => new M.Indicate(a, { color: C.green })), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('POLICY', C.green)
  );

  // 20: A policy gives each available action a probability, which means its chance of being chosen.
  await until(S(20));
  await play(
    new M.LaggedStart([labAB, labAC, labBA, labBD, labCD, labCA].map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...say('PROBABILITY = CHANCE OF BEING CHOSEN')
  );

  // 21: The probabilities in each cell must add to one hundred percent.
  await until(S(21));
  await play(
    ...fbox([['A:  50% + 50% = 100%', C.cyan], ['B:  50% + 50% = 100%', C.cyan], ['C: 100% +  0% = 100%', C.green]], C.green),
    ...say('EACH CELL ADDS TO 100%', C.green)
  );

  // 22: This is because the cart must choose one of its available moves.
  await until(S(22));
  await play(
    new M.LaggedStart([cells.A, cells.B, cells.C].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.18, runTime: 1.3 }),
    ...say('MUST PICK ONE ALLOWED MOVE')
  );

  // 23: Cell D needs no rule because the delivery ends there.
  const hlD = cellHighlight('D', C.green);
  await until(S(23));
  await play(
    new M.FadeIn(hlD),
    ...fbox([['Cell D (dock)', C.green], ['delivery ends here', C.muted], ['no rule needed', C.ink]], C.green),
    ...say('CELL D: DELIVERY ENDS', C.green)
  );

  // 24: When a policy uses chance to choose between moves, we call it a stochastic policy.
  const hlA_v = cellHighlight('A', C.violet);
  const hlB_v = cellHighlight('B', C.violet);
  await until(S(24));
  await play(
    new M.FadeOut(hlD),
    new M.FadeIn(hlA_v), new M.FadeIn(hlB_v),
    ...fbox([['Stochastic policy', C.violet], ['uses chance between moves', C.ink]], C.violet),
    ...say('STOCHASTIC = USES CHANCE', C.violet)
  );

  // 25: When a policy always chooses the same move in every cell, we call it a deterministic policy.
  const hlC_a = cellHighlight('C', C.amber);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(hlA_v, hlB_v)),
    new M.FadeIn(hlC_a),
    ...fbox([['Deterministic policy', C.amber], ['always picks the same move', C.ink]], C.amber),
    ...say('DETERMINISTIC = ALWAYS SAME MOVE', C.amber)
  );

  // 26: Our policy uses chance in cells A and B, but not in cell C.
  const hlA_v2 = cellHighlight('A', C.violet);
  const hlB_v2 = cellHighlight('B', C.violet);
  await until(S(26));
  await play(
    new M.FadeIn(hlA_v2), new M.FadeIn(hlB_v2),
    ...fbox([['A, B: 50% / 50% (chance)', C.violet], ['C:   100% /  0% (fixed)', C.amber]]),
    ...say('A & B: CHANCE · C: FIXED')
  );

  // 27: Let's see how this policy affects the cart's journey.
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(hlA_v2, hlB_v2, hlC_a)),
    ...clearBox(),
    ...say('FOLLOW THE POLICY')
  );

  // 28: Imagine one hundred carts start separate deliveries from cell A.
  let badgeA = countBadge('A', '100', C.ink);
  const barW = P ? 5.6 : 4.8, barH = 0.44;
  const barBg = new M.RoundedRectangle({ width: barW, height: barH, cornerRadius: 0.08, color: C.line, strokeWidth: 2 });
  barBg.setFill(C.card, 0.92);
  barBg.moveTo([AUX[0], AUX[1], 0]);
  const barTitle = T('100 carts from cell A', 16, C.muted);
  barTitle.moveTo([AUX[0], AUX[1] + 0.48, 0]);
  await until(S(28));
  await play(
    ...fadeOutCart(cart, 0.4),
    new M.FadeIn(badgeA),
    new M.FadeIn(barBg),
    new M.FadeIn(barTitle),
    ...fbox([['Start at cell A', C.muted], ['100 carts', C.ink]]),
    ...say('100 CARTS START AT A')
  );

  // 29: We expect about fifty carts to move right to cell B.
  const pAB = pulseAlong('AB', C.cyan, 0.8);
  const badgeA50 = countBadge('A', '50', C.muted);
  let badgeB = countBadge('B', '50', C.cyan);
  await until(S(29));
  await play(
    pAB.anim,
    new M.FadeOut(badgeA), new M.FadeIn(badgeA50),
    new M.FadeIn(badgeB),
    ...fbox([['Move 1 from A:', C.muted], ['→ B : 50 carts (50%)', C.cyan]]),
    ...say('~50 CARTS → CELL B')
  );
  badgeA = badgeA50;

  // 30: We expect the other fifty to move down to cell C.
  const pAC = pulseAlong('AC', C.cyan, 0.8);
  let badgeC = countBadge('C', '50', C.cyan);
  await until(S(30));
  await play(
    new M.FadeOut(pAB.dot, { runTime: 0.25 }),
    pAC.anim,
    new M.FadeOut(badgeA),
    new M.FadeIn(badgeC),
    ...fbox([['Move 1 from A:', C.muted], ['→ B : 50 carts (50%)', C.cyan], ['→ C : 50 carts (50%)', C.cyan]]),
    ...say('~50 CARTS → CELL C')
  );

  // 31: Of the fifty carts in cell B, we expect half to move towards the dock.
  const pBD = pulseAlong('BD', C.green, 0.8);
  const badgeB25 = countBadge('B', '25', C.violet);
  await until(S(31));
  await play(
    new M.FadeOut(pAC.dot, { runTime: 0.25 }),
    new M.Indicate(badgeB, { color: C.amber }),
    ...fbox([['Cell B: 50 carts', C.cyan], ['half go down → D', C.green], ['50 ÷ 2 = 25', C.amber]], C.amber),
    ...say('HALF OF 50 IN B → DOCK', C.amber)
  );

  // 32: That gives us twenty-five carts reaching the dock in two moves.
  let badgeD = countBadge('D', '25', C.green);
  const seg25 = new M.Rectangle({ width: barW * 0.25, height: barH - 0.08, color: C.green, strokeWidth: 1 });
  seg25.setFill(C.green, 0.82);
  seg25.moveTo([AUX[0] - barW / 2 + barW * 0.125, AUX[1], 0.01]);
  const seg25Lab = T('25', 15, C.bg, true, true);
  seg25Lab.moveTo([AUX[0] - barW / 2 + barW * 0.125, AUX[1], 0.02]);
  await until(S(32));
  await play(pBD.anim, new M.FadeOut(badgeB), new M.FadeIn(badgeB25));
  badgeB = badgeB25;
  await play(
    new M.FadeOut(pBD.dot, { runTime: 0.25 }),
    new M.FadeIn(badgeD),
    new M.FadeIn(seg25), new M.FadeIn(seg25Lab),
    ...fbox([['In 2 moves:', C.muted], ['A → B → D : 25 carts', C.green]], C.green),
    ...say('25 AT DOCK IN 2 MOVES', C.green)
  );

  // 33: All fifty carts in cell C move directly to the dock.
  const pCD = pulseAlong('CD', C.green, 0.8);
  const badgeD2 = countBadge('D', '25+50', C.green);
  const seg50 = new M.Rectangle({ width: barW * 0.50, height: barH - 0.08, color: C.cyan, strokeWidth: 1 });
  seg50.setFill(C.cyan, 0.82);
  seg50.moveTo([AUX[0] - barW / 2 + barW * 0.50, AUX[1], 0.01]);
  const seg50Lab = T('50', 15, C.bg, true, true);
  seg50Lab.moveTo([AUX[0] - barW / 2 + barW * 0.50, AUX[1], 0.02]);
  await until(S(33));
  await play(
    new M.Indicate(badgeC, { color: C.green }),
    ...fbox([['Cell C: 50 carts', C.cyan], ['all go right → D', C.green]], C.green),
    ...say('ALL 50 IN C → DOCK', C.green)
  );
  await play(
    pCD.anim,
    new M.FadeOut(badgeC),
    new M.FadeOut(badgeD), new M.FadeIn(badgeD2)
  );
  badgeD = badgeD2;

  // 34: That gives us another fifty carts reaching the dock in two moves.
  await until(S(34));
  await play(
    new M.FadeOut(pCD.dot, { runTime: 0.25 }),
    new M.FadeIn(seg50), new M.FadeIn(seg50Lab),
    ...fbox([['In 2 moves:', C.muted], ['A → B → D : 25 carts', C.green], ['A → C → D : 50 carts', C.cyan]], C.green)
  );

  // 35: Twenty-five plus fifty makes seventy-five.
  const badgeD75 = countBadge('D', '75', C.amber);
  const barFoot = T('75 in 2 moves', 15, C.green, true);
  barFoot.moveTo([AUX[0] - barW * 0.125, AUX[1] - 0.44, 0]);
  await until(S(35));
  await play(
    new M.FadeOut(badgeD), new M.FadeIn(badgeD75),
    new M.FadeIn(barFoot),
    ...fbox([['A → B → D : 25', C.ink], ['A → C → D : 50', C.ink], ['25 + 50 = 75 carts', C.amber]], C.amber),
    ...say('25 + 50 = 75 CARTS', C.amber)
  );
  badgeD = badgeD75;

  // 36: So each cart has a seventy-five percent chance of finishing in exactly two moves.
  await until(S(36));
  await play(
    new M.Indicate(badgeD, { color: C.green }),
    ...fbox([['75 out of 100 carts', C.ink], ['= 75% in 2 moves', C.green]], C.green),
    ...say('75% CHANCE IN 2 MOVES', C.green)
  );

  // 37: The remaining carts need more moves to complete their deliveries.
  const pBA = pulseAlong('BA', C.violet, 0.8);
  const badgeA25 = countBadge('A', '25', C.violet);
  const segRem = new M.Rectangle({ width: barW * 0.25, height: barH - 0.08, color: C.violet, strokeWidth: 1 });
  segRem.setFill(C.violet, 0.72);
  segRem.moveTo([AUX[0] + barW / 2 - barW * 0.125, AUX[1], 0.01]);
  const segRemLab = T('25', 15, C.bg, true, true);
  segRemLab.moveTo([AUX[0] + barW / 2 - barW * 0.125, AUX[1], 0.02]);
  const remFoot = T('25 longer', 15, C.violet, true);
  remFoot.moveTo([AUX[0] + barW * 0.375, AUX[1] - 0.44, 0]);
  await until(S(37));
  await play(
    pBA.anim,
    new M.FadeOut(badgeB),
    new M.FadeIn(badgeA25),
    new M.FadeIn(segRem), new M.FadeIn(segRemLab), new M.FadeIn(remFoot),
    ...say('25 CARTS NEED MORE MOVES', C.violet)
  );

  // 38: We can also calculate the chance of following one particular route.
  cart = cartParts(pos.A);
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(
      pBA.dot, badgeD, badgeA25,
      barBg, barTitle, seg25, seg25Lab, seg50, seg50Lab, barFoot, segRem, segRemLab, remFoot
    )),
    ...fadeInCart(cart, 0.5),
    ...clearBox(),
    ...say('CHANCE OF ONE ROUTE')
  );

  // 39: Let's choose the route from cell A to cell B, then to the dock.
  const routeAB = makeArrow('AB', C.amber, 7, 1, true, 0.03);
  const routeBD = makeArrow('BD', C.amber, 7, 1, true, 0.03);
  await until(S(39));
  await play(
    new M.FadeIn(routeAB), new M.FadeIn(routeBD),
    ...fbox([['Route: A → B → D', C.amber]], C.amber),
    ...say('ROUTE: A → B → D', C.amber)
  );

  // 40: The chance of the first move is one half.
  await until(S(40));
  await play(
    ...moveCart(cart, pos.B, 0.8),
    new M.Indicate(labAB, { color: C.amber }),
    ...fbox([['Route: A → B → D', C.amber], ['A → B : 1/2  (50%)', C.cyan]], C.amber),
    ...say('FIRST MOVE: 1/2')
  );

  // 41: The chance of the second move, once the cart reaches cell B, is also one half.
  await until(S(41));
  await play(
    ...moveCart(cart, pos.D, 0.8),
    new M.Indicate(labBD, { color: C.amber }),
    ...fbox([['Route: A → B → D', C.amber], ['A → B : 1/2  (50%)', C.cyan], ['B → D : 1/2  (50%)', C.cyan]], C.amber),
    ...say('SECOND MOVE: 1/2')
  );

  // 42: We multiply one half by one half, which gives one quarter.
  await until(S(42));
  await play(
    ...fbox([['Route: A → B → D', C.muted], ['1/2 × 1/2 = 1/4', C.amber]], C.amber),
    ...say('1/2 × 1/2 = 1/4', C.amber)
  );

  // 43: One quarter is twenty-five percent.
  await until(S(43));
  await play(
    ...fbox([['Route: A → B → D', C.muted], ['1/2 × 1/2 = 1/4', C.ink], ['         = 25%', C.green]], C.green),
    ...say('1/4 = 25%', C.green)
  );

  // 44: Here is our short formula for the chance of following a route.
  const cartReset = cartParts(pos.A);
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(routeAB, routeBD)),
    ...fadeOutCart(cart, 0.35),
    ...fadeInCart(cartReset, 0.5),
    ...say('ROUTE CHANCE FORMULA')
  );
  cart = cartReset;

  // 45: Multiply the probabilities of choosing each move along the route.
  await until(S(45));
  await play(
    ...fbox([['route chance =', C.cyan], ['  move 1 × move 2 × ...', C.amber], ['  0.5 × 0.5 = 0.25 (25%)', C.green]]),
    ...say('MULTIPLY MOVE CHANCES', C.amber)
  );

  // 46: This formula works here because our cart always arrives where its chosen move takes it.
  await until(S(46));
  await play(
    new M.LaggedStart([arrAB, arrAC, arrBD, arrCD].map(a => new M.Indicate(a, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('EACH MOVE REACHES ITS TARGET')
  );

  // 47: We use policies to control how machines make choices in different situations.
  await until(S(47));
  await play(
    new M.LaggedStart([cells.A, cells.B, cells.C].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.2 }),
    ...fbox([['Policy = control rule', C.cyan], ['cell A → choose move', C.ink], ['cell B → choose move', C.ink], ['cell C → choose move', C.ink]]),
    ...say('POLICIES CONTROL CHOICES')
  );

  // 48: By changing the policy, we can change how often the cart reaches the dock quickly.
  const arrBA_0 = makeArrow('BA', '#637096', 2, 0.55, false);
  const labBA_0 = probLabel('BA', '0%', C.muted);
  const arrBD_100 = makeArrow('BD', C.cyan, 11, 1, true);
  const labBD_100 = probLabel('BD', '100%', C.green);
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(arrBA, labBA, arrBD, labBD)),
    new M.FadeIn(arrBA_0), new M.FadeIn(labBA_0),
    new M.FadeIn(arrBD_100), new M.FadeIn(labBD_100),
    ...fbox([['Change cell B to 100% ↓', C.amber], ['A → B → D : 50%', C.green], ['A → C → D : 50%', C.green], ['In 2 moves: 100%!', C.green]], C.green),
    ...say('CHANGE POLICY → FASTER DOCK', C.green)
  );

  // 49: But be careful: a fifty percent chance does not promise exactly fifty successes in one hundred tries.
  const arrBA_r = makeArrow('BA', C.cyan, 5.5, 1, true);
  const labBA_r = probLabel('BA', '50%', C.cyan);
  const arrBD_r = makeArrow('BD', C.cyan, 5.5, 1, true);
  const labBD_r = probLabel('BD', '50%', C.cyan);

  // Three sample 100-try runs in AUX around a dashed 50 line
  const trials = [47, 54, 49, 52];
  const baseY = AUX[1] - 0.58, maxH = 1.15;
  const tx = k => AUX[0] + (k - 1.5) * 1.05;
  const line50Y = baseY + 0.5 * maxH;
  const dash50 = new M.DashedLine({ start: [tx(0) - 0.55, line50Y, 0.02], end: [tx(3) + 0.55, line50Y, 0.02], color: C.amber });
  const tag50 = T('50', 16, C.amber, true, true); tag50.moveTo([tx(3) + 0.78, line50Y, 0.02]);
  const trialBars = trials.map((val, k) => {
    const h = (val / 100) * maxH;
    const b = new M.Rectangle({ width: 0.56, height: h, color: C.pink, strokeWidth: 1.5 });
    b.setFill(C.pink, 0.72);
    b.moveTo([tx(k), baseY + h / 2, 0.01]);
    const vLab = T(String(val), 15, C.ink, true, true);
    vLab.moveTo([tx(k), baseY + h + 0.18, 0.02]);
    const rLab = T(`#${k + 1}`, 15, C.muted, true);
    rLab.moveTo([tx(k), baseY - 0.2, 0.02]);
    return new M.VGroup(b, vLab, rLab);
  });
  const trialTitle = T('100 tries (50% chance)', 15, C.muted);
  trialTitle.moveTo([AUX[0], baseY + maxH + 0.24, 0]);

  await until(S(49));
  await play(
    new M.FadeOut(new M.VGroup(arrBA_0, labBA_0, arrBD_100, labBD_100)),
    new M.FadeIn(arrBA_r), new M.FadeIn(labBA_r),
    new M.FadeIn(arrBD_r), new M.FadeIn(labBD_r),
    new M.FadeIn(trialTitle), new M.Create(dash50), new M.FadeIn(tag50),
    new M.LaggedStart(trialBars.slice(0, 3).map(g => new M.FadeIn(g)), { lagRatio: 0.15, runTime: 0.9 }),
    ...fbox([['Watch out!', C.pink], ['50% ≠ always 50 of 100', C.amber]], C.pink),
    ...say('50% ≠ EXACTLY 50 OF 100', C.pink)
  );

  // 50: The actual number can change each time we repeat the deliveries.
  await until(S(50));
  await play(
    new M.FadeIn(trialBars[3]),
    new M.LaggedStart(trialBars.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('ACTUAL COUNT VARIES EACH RUN', C.amber)
  );

  // 51: A policy tells us the chances of choosing moves, not the exact route the cart will follow.
  await until(S(51));
  await play(
    new M.FadeOut(new M.VGroup(trialTitle, dash50, tag50, ...trialBars)),
    ...fbox([['A policy gives:', C.cyan], ['  ✓ chances of moves', C.green], ['  ✗ not the exact route', C.pink]]),
    ...say('CHANCES, NOT EXACT ROUTE')
  );

  // 52: Remember: a policy is a rule that gives each available move a chance of being chosen.
  await until(S(52));
  await play(
    new M.LaggedStart([arrAB, arrAC, arrBA_r, arrBD_r, arrCD].map(a => new M.Indicate(a, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox([['Policy:', C.amber], ['a rule that gives each', C.ink], ['available move a chance', C.green]], C.amber),
    ...say('POLICY = RULE FOR MOVE CHANCES', C.amber)
  );
}
