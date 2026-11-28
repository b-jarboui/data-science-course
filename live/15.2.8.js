// 15.2.8 Q-learning: learning which move is best.
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const ORANGE = '#fb923c';
  const fmt = x => {
    const r = Math.round(x * 100) / 100;
    return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.85;
  const CY = P ? -0.78 : -0.65;
  const CW = P ? 3.2 : 3.1;
  const CH = P ? 2.45 : 2.05;
  const PILL = P ? [0, 2.0, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.4, 0] : [3.85, 0.85, 0];
  const GRAPHP = P ? [0, -4.45, 0] : [3.85, -1.65, 0];
  const GW = P ? 6.6 : 5.3;
  const GH = P ? 1.85 : 1.75;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // One formula box at a time (matches 1.2.4 reference)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 18, lh = P ? 0.39 : 0.38;
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
    const maxw = P ? FW - 0.8 : 5.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.45 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.35 }));
    boxNow = g;
    return a;
  }

  // Fixed 4-cell warehouse grid: A (top-left), B (top-right), C (bottom-left), D (bottom-right dock)
  const CELL = {
    A: [CX - CW / 2, CY + CH / 2, 0],
    B: [CX + CW / 2, CY + CH / 2, 0],
    C: [CX - CW / 2, CY - CH / 2, 0],
    D: [CX + CW / 2, CY - CH / 2, 0],
  };
  const CART_POS = {
    A: [CELL.A[0] - 0.18, CELL.A[1] + 0.14, 0],
    B: [CELL.B[0] + 0.15, CELL.B[1] + 0.28, 0],
    C: [CELL.C[0] - 0.35, CELL.C[1] - 0.15, 0],
    D: [CELL.D[0] + 0.06, CELL.D[1] + 0.14, 0],
  };

  // Build warehouse grid (never moves)
  const cellRects = {};
  const gridParts = [];
  for (const name of ['A', 'B', 'C', 'D']) {
    const p = CELL[name], isDock = name === 'D';
    const rect = new M.Rectangle({ width: CW, height: CH, color: isDock ? C.green : C.muted, strokeWidth: isDock ? 3 : 2 });
    rect.setFill(isDock ? C.green : C.card, isDock ? 0.14 : 0.86);
    rect.moveTo(p);
    cellRects[name] = rect;
    gridParts.push(rect);
    const tag = T(name, 20, isDock ? C.green : C.ink, true, true);
    // B's letter goes top-right: the A → B value chip sits on the top-left of B.
    // C's letter goes bottom-left: the A → C value chip sits on C's top-left.
    tag.moveTo([p[0] + (name === 'B' ? CW / 2 - 0.28 : -CW / 2 + 0.28), p[1] + (name === 'C' ? -CH / 2 + 0.26 : CH / 2 - 0.26), 0]);
    gridParts.push(tag);
  }
  const dockWord = T('DOCK', 17, C.green, true, true);
  dockWord.moveTo([CELL.D[0], CELL.D[1] - 0.44, 0]);
  const dockPts = T('+10 pts', 17, C.amber, true, true);
  dockPts.moveTo([CELL.D[0], CELL.D[1] - 0.78, 0]);
  gridParts.push(dockWord, dockPts);
  const gridGroup = new M.VGroup(...gridParts);

  // Cyan state values from previous lesson (A=4, B=6, C=10)
  const stateVals = { A: '4', B: '6', C: '10' };
  const stateTexts = {};
  for (const k of ['A', 'B', 'C']) {
    const t = T(stateVals[k], 24, C.cyan, true, true);
    t.moveTo([CELL[k][0] + (k === 'B' ? -0.42 : 0.45), CELL[k][1] - 0.36, 0]);
    stateTexts[k] = t;
  }

  // White delivery cart (4 separate leaf parts so Transform moves every part smoothly)
  function makeCartParts(pos) {
    const [x, y] = pos;
    const body = new M.RoundedRectangle({ width: 0.48, height: 0.24, cornerRadius: 0.06, color: C.ink, strokeWidth: 2 });
    body.setFill(C.ink, 0.94); body.moveTo([x, y + 0.04, 0]);
    const handle = new M.Line({ start: [x - 0.23, y + 0.14, 0], end: [x - 0.33, y + 0.24, 0], color: C.ink, strokeWidth: 3 });
    const w1 = new M.Circle({ radius: 0.065, color: C.ink, strokeWidth: 2 });
    w1.setFill(C.bg, 1); w1.moveTo([x - 0.14, y - 0.12, 0]);
    const w2 = new M.Circle({ radius: 0.065, color: C.ink, strokeWidth: 2 });
    w2.setFill(C.bg, 1); w2.moveTo([x + 0.14, y - 0.12, 0]);
    return [body, handle, w1, w2];
  }
  const cartParts = makeCartParts(CART_POS.A);
  const moveCartA = (cell, runTime = 0.65) => {
    const target = makeCartParts(CART_POS[cell]);
    return cartParts.map((m, i) => new M.Transform(m, target[i], { runTime }));
  };

  // All 6 action arrows + Q-value label coordinates (carefully placed with zero overlap)
  const ARROW_DEF = {
    AB: { from: 'A', to: 'B', dir: 'right', r: 0,
          p1: [CELL.A[0] + CW / 2 - 0.52, CELL.A[1] + 0.34, 0],
          p2: [CELL.A[0] + CW / 2 + 0.52, CELL.A[1] + 0.34, 0],
          lp: [CELL.A[0] + CW / 2 - 0.50, CELL.A[1] + 0.68, 0] },
    AC: { from: 'A', to: 'C', dir: 'down', r: 0,
          p1: [CELL.A[0] - 0.55, CELL.A[1] - CH / 2 + 0.38, 0],
          p2: [CELL.A[0] - 0.55, CELL.A[1] - CH / 2 - 0.38, 0],
          lp: [CELL.A[0] - 1.10, CELL.A[1] - CH / 2 + 0.36, 0] },
    BA: { from: 'B', to: 'A', dir: 'left', r: 0,
          p1: [CELL.B[0] - CW / 2 + 0.52, CELL.B[1] - 0.34, 0],
          p2: [CELL.B[0] - CW / 2 - 0.52, CELL.B[1] - 0.34, 0],
          lp: [CELL.B[0] - CW / 2 + 0.50, CELL.B[1] - 0.68, 0] },
    BD: { from: 'B', to: 'D', dir: 'down', r: 10,
          p1: [CELL.B[0] + 0.36, CELL.B[1] - CH / 2 + 0.38, 0],
          p2: [CELL.B[0] + 0.36, CELL.B[1] - CH / 2 - 0.38, 0],
          lp: [CELL.B[0] + 0.98, CELL.B[1] - CH / 2 + 0.38, 0] },
    CA: { from: 'C', to: 'A', dir: 'up', r: 0,
          p1: [CELL.C[0] + 0.55, CELL.C[1] + CH / 2 - 0.38, 0],
          p2: [CELL.C[0] + 0.55, CELL.C[1] + CH / 2 + 0.38, 0],
          lp: [CELL.C[0] + 1.08, CELL.C[1] + CH / 2 - 0.36, 0] },
    CD: { from: 'C', to: 'D', dir: 'right', r: 10,
          p1: [CELL.C[0] + CW / 2 - 0.52, CELL.C[1] - 0.26, 0],
          p2: [CELL.C[0] + CW / 2 + 0.52, CELL.C[1] - 0.26, 0],
          lp: [CELL.C[0] + CW / 2 - 0.50, CELL.C[1] - 0.64, 0] },
  };
  const KEYS = ['AB', 'AC', 'BA', 'BD', 'CA', 'CD'];
  // Each Q-value chip sits right beside the middle of ITS arrow (not near another arrow).
  for (const k of KEYS) {
    const { p1, p2 } = ARROW_DEF[k];
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    const horizontal = Math.abs(p2[0] - p1[0]) > Math.abs(p2[1] - p1[1]);
    const side = { AB: 1, BA: -1, CD: -1, AC: -1, CA: 1, BD: 1 }[k];
    ARROW_DEF[k].lp = horizontal ? [mx, my + side * 0.36, 0] : [mx + side * 0.5, my - (k === 'CA' ? 0.3 : 0), 0];
  }

  function makeArrowParts(p1, p2, col = C.muted, sw = 3.2, gop = 0.16, op = 0.85) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, hl = 0.20, a = 0.52;
    const cs = Math.cos(a), sn = Math.sin(a);
    const b1 = [p2[0] - hl * (ux * cs - uy * sn), p2[1] - hl * (uy * cs + ux * sn), 0];
    const b2 = [p2[0] - hl * (ux * cs + uy * sn), p2[1] - hl * (uy * cs - ux * sn), 0];
    const glow = new M.Line({ start: [p1[0], p1[1], -0.01], end: [p2[0], p2[1], -0.01], color: col, strokeWidth: sw + 7 });
    glow.setStrokeOpacity(gop);
    const shaft = new M.Line({ start: p1, end: p2, color: col, strokeWidth: sw });
    shaft.setStrokeOpacity(op);
    const barb1 = new M.Line({ start: p2, end: b1, color: col, strokeWidth: sw });
    barb1.setStrokeOpacity(op);
    const barb2 = new M.Line({ start: p2, end: b2, color: col, strokeWidth: sw });
    barb2.setStrokeOpacity(op);
    return [glow, shaft, barb1, barb2];
  }

  const arrows = {};
  for (const k of KEYS) arrows[k] = makeArrowParts(ARROW_DEF[k].p1, ARROW_DEF[k].p2, C.muted, 3.0, 0.12, 0.78);
  const fadeInArrowA = (k, runTime = 0.45) => arrows[k].map(ln => new M.FadeIn(ln, { runTime }));
  function styleArrowA(k, col, sw = 3.2, gop = 0.18, op = 0.9, runTime = 0.35) {
    return arrows[k].map((ln, idx) => {
      const t = ln.copy();
      t.setColor(col);
      t.setStrokeWidth(idx === 0 ? sw + 7 : sw);
      t.setStrokeOpacity(idx === 0 ? gop : op);
      return new M.Transform(ln, t, { runTime });
    });
  }
  const restyleAllA = (col = C.muted, sw = 3.0, gop = 0.12, op = 0.75, runTime = 0.35) =>
    KEYS.flatMap(k => styleArrowA(k, col, sw, gop, op, runTime));

  // Action-value labels beside each arrow (replace cleanly with FadeOut + FadeIn)
  const qLab = {};
  function setQA(k, text, col = ORANGE, size = 18, runTime = 0.35) {
    // Readable chip with a dark fill (sizes raised for the phone).
    const t = L.pill(String(text), col, Math.max(size, P ? 20 : 18));
    t.moveTo(ARROW_DEF[k].lp);
    const a = [new M.FadeIn(t, { runTime })];
    if (qLab[k]) a.push(new M.FadeOut(qLab[k], { runTime: Math.min(0.28, runTime) }));
    qLab[k] = t;
    return a;
  }

  // Exact Q-learning simulation (gamma = 0.5, alpha = 0.5) for beats 39-42
  const NEXT_ACTIONS = { A: ['AB', 'AC'], B: ['BA', 'BD'], C: ['CA', 'CD'], D: [] };
  const simQ = { AB: 0, AC: 0, BA: 0, BD: 0, CA: 0, CD: 0 };
  const simHistory = []; // [{ step, move, absErr, snap }]
  const simSeq = ['BD', 'AB', 'BD'];
  const cycle = ['AC', 'CD', 'CA', 'BA', 'AB', 'BD'];
  for (let c = 0; c < 10; c++) simSeq.push(...cycle); // 63 total steps
  for (let i = 0; i < simSeq.length; i++) {
    const k = simSeq[i], def = ARROW_DEF[k];
    const nexts = NEXT_ACTIONS[def.to];
    const maxNext = nexts.length ? Math.max(...nexts.map(nk => simQ[nk])) : 0;
    const target = def.r + 0.5 * maxNext;
    const err = target - simQ[k];
    simQ[k] = simQ[k] + 0.5 * err;
    simHistory.push({ step: i + 1, move: k, absErr: Math.abs(err), snap: { ...simQ } });
  }

  // --- Beats 0-1: cell values known, but which move? ---
  await until(S(0));
  await play(
    new M.FadeIn(gridGroup, { runTime: 0.7 }),
    ...['A', 'B', 'C'].map(k => new M.FadeIn(stateTexts[k], { runTime: 0.7 })),
    ...cartParts.map(m => new M.FadeIn(m, { runTime: 0.7 })),
    ...say('CELL VALUES LEARNED', C.cyan)
  );

  const qMarkCart = T('?', 24, C.amber, true, true);
  qMarkCart.moveTo([CART_POS.A[0] + 0.36, CART_POS.A[1] + 0.36, 0]);
  await until(S(1));
  await play(
    new M.FadeIn(qMarkCart, { runTime: 0.4 }),
    ...['A', 'B', 'C'].map(k => new M.Indicate(stateTexts[k], { color: C.cyan, runTime: 0.7 })),
    ...say('CELL VALUE ≠ WHICH MOVE?', C.amber)
  );

  // --- Beats 2-6: stand in cell B, compare down vs left ---
  const bRing = new M.Rectangle({ width: CW - 0.08, height: CH - 0.08, color: C.ink, strokeWidth: 3 });
  bRing.moveTo(CELL.B);
  await until(S(2));
  await play(
    new M.FadeOut(qMarkCart, { runTime: 0.3 }),
    ...moveCartA('B', 0.75),
    new M.Create(bRing, { runTime: 0.5 }),
    ...say('IMAGINE YOU ARE IN CELL B', C.ink)
  );

  await until(S(3));
  await play(
    ...fadeInArrowA('BA', 0.5),
    ...fadeInArrowA('BD', 0.5),
    ...styleArrowA('BA', C.cyan, 3.4, 0.2, 0.9, 0.5),
    ...styleArrowA('BD', C.cyan, 3.4, 0.2, 0.9, 0.5),
    ...say('LEFT TO A  OR  DOWN TO DOCK', C.cyan)
  );

  await until(S(4));
  await play(
    ...styleArrowA('BD', C.amber, 4.6, 0.38, 1.0, 0.45),
    ...styleArrowA('BA', C.muted, 2.8, 0.08, 0.55, 0.45),
    new M.Flash(dockPts, { color: C.amber, flashRadius: 0.35, runTime: 0.6 }),
    ...say('DOWN → +10 POINTS NOW', C.amber)
  );

  const zeroTag = T('0 pts', 16, C.pink, true, true);
  zeroTag.moveTo([ARROW_DEF.BA.lp[0], ARROW_DEF.BA.lp[1], 0]);
  await until(S(5));
  await play(
    ...styleArrowA('BD', C.muted, 2.8, 0.08, 0.55, 0.45),
    ...styleArrowA('BA', C.pink, 4.4, 0.34, 1.0, 0.45),
    new M.FadeIn(zeroTag, { runTime: 0.4 }),
    ...say('LEFT → 0 POINTS, FARTHER AWAY', C.pink)
  );

  await until(S(6));
  await play(
    new M.FadeOut(zeroTag, { runTime: 0.3 }),
    new M.FadeOut(bRing, { runTime: 0.3 }),
    ...styleArrowA('BA', ORANGE, 3.4, 0.2, 0.9, 0.45),
    ...styleArrowA('BD', ORANGE, 3.4, 0.2, 0.9, 0.45),
    ...setQA('BA', '?', ORANGE),
    ...setQA('BD', '?', ORANGE),
    ...say('GIVE EACH MOVE ITS OWN VALUE?', ORANGE)
  );

  // --- Beats 7-12: all 6 arrows, action values, Q-learning ---
  await until(S(7));
  await play(
    new M.LaggedStart(['AB', 'AC', 'CA', 'CD'].flatMap(k => fadeInArrowA(k, 0.45)), { lagRatio: 0.08, runTime: 1.2 }),
    ...styleArrowA('BA', C.muted, 3.0, 0.12, 0.78, 0.4),
    ...styleArrowA('BD', C.muted, 3.0, 0.12, 0.78, 0.4),
    ...say('ALL 6 AVAILABLE MOVES', ORANGE)
  );

  await until(S(8));
  await play(
    new M.LaggedStart(KEYS.map(k => new M.Indicate(arrows[k][1], { color: C.cyan, runTime: 0.45 })), { lagRatio: 0.16, runTime: 1.5 }),
    ...say('2 ARROWS FROM A, B, AND C', C.cyan)
  );

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(stateTexts.A, stateTexts.B, stateTexts.C), { runTime: 0.5 }),
    ...['AB', 'AC', 'CA', 'CD'].flatMap(k => setQA(k, '?', ORANGE, 18, 0.45)),
    ...say('ONE NUMBER BESIDE EACH ARROW', ORANGE)
  );

  await until(S(10));
  await play(
    ...styleArrowA('AB', ORANGE, 4.2, 0.32, 1.0, 0.4),
    ...styleArrowA('BD', ORANGE, 4.2, 0.32, 1.0, 0.4),
    ...say('MOVE + BEST CHOICES AFTER', ORANGE)
  );

  await until(S(11));
  await play(
    ...restyleAllA(C.muted, 3.0, 0.12, 0.78, 0.35),
    ...fbox([['Q(cell, move)', ORANGE], '= action value (Q-value)'], ORANGE),
    ...say('ACTION VALUE = Q-VALUE', ORANGE)
  );

  await until(S(12));
  await play(
    ...fbox([['Q-learning', ORANGE], 'learn each move’s value', 'through experience'], ORANGE),
    ...say('Q-LEARNING', ORANGE)
  );

  // --- Beats 13-14: initialize all 6 Q-values to 0, discount=0.5, rate=0.5 ---
  await until(S(13));
  await play(
    ...KEYS.flatMap(k => setQA(k, '0', ORANGE, 18, 0.4)),
    ...say('START: ALL 6 Q-VALUES = 0', ORANGE)
  );

  await until(S(14));
  await play(
    ...fbox([['discount      = 0.5', C.violet], ['learning rate = 0.5', C.cyan], ['all 6 Q-values = 0', ORANGE]], C.violet),
    ...say('DISCOUNT = 0.5 · RATE = 0.5', C.violet)
  );

  // --- Beats 15-22: Step 1 (B -> down -> D) ---
  await until(S(15));
  await play(
    new M.Flash(cartParts[0], { color: C.ink, flashRadius: 0.3, runTime: 0.55 }),
    ...fbox([['Step 1: cart in cell B', C.amber], 'ready to choose a move'], C.amber),
    ...say('STEP 1: CART IN CELL B', C.amber)
  );

  await until(S(16));
  await play(
    ...styleArrowA('BD', ORANGE, 4.8, 0.42, 1.0, 0.4),
    ...moveCartA('D', 0.75),
    new M.Flash(dockPts, { color: C.amber, flashRadius: 0.35, runTime: 0.6 }),
    ...fbox([['Step 1: B → down (D)', C.amber], ['reward = 10', C.amber]], C.amber),
    ...say('B → DOWN → DOCK (+10)', C.amber)
  );

  await until(S(17));
  await play(
    ...fbox(['Step 1: B → down', 'reward    = 10', ['best next = 0 (at dock)', C.muted], ['target    = 10', C.amber]], C.amber),
    ...say('NO FUTURE REWARDS → TARGET = 10', C.amber)
  );

  await until(S(18));
  await play(
    new M.Indicate(qLab.BD, { color: ORANGE, runTime: 0.6 }),
    ...fbox(['target = 10', ['old Q(B, down) = 0', ORANGE]], ORANGE),
    ...say('OLD Q(B, DOWN) = 0', ORANGE)
  );

  await until(S(19));
  await play(
    ...fbox(['target = 10', 'old Q  = 0', ['error  = 10 − 0 = 10', C.pink]], C.pink),
    ...say('ERROR = 10 − 0 = 10', C.pink)
  );

  await until(S(20));
  await play(
    ...setQA('BD', '5', ORANGE, 20, 0.45),
    ...fbox(['error  = 10', ['change = 0.5 × 10 = +5', C.green]], C.green),
    ...say('HALF THE ERROR = +5', C.green)
  );

  await until(S(21));
  await play(
    new M.Flash(qLab.BD, { color: ORANGE, flashRadius: 0.24, runTime: 0.55 }),
    ...fbox(['old Q  = 0', 'change = +5', ['new Q(B, down) = 5', ORANGE]], ORANGE),
    ...say('Q(B, DOWN): 0 → 5', ORANGE)
  );

  await until(S(22));
  await play(
    ...styleArrowA('BD', C.muted, 3.0, 0.12, 0.78, 0.4),
    new M.Indicate(qLab.BA, { color: C.muted, runTime: 0.7 }),
    ...fbox([['Q(B, down) = 5', ORANGE], ['Q(B, left) = 0 (unchanged)', C.muted]], C.muted),
    ...say('Q(B, LEFT) STAYS 0', C.muted)
  );

  // --- Beats 23-32: Step 2 (A -> right -> B) ---
  await until(S(23));
  await play(
    ...moveCartA('A', 0.65),
    ...fbox([['Step 2: new delivery at A', C.cyan]], C.cyan),
    ...say('STEP 2: NEW DELIVERY AT A', C.cyan)
  );

  await until(S(24));
  await play(
    ...styleArrowA('AB', ORANGE, 4.8, 0.42, 1.0, 0.4),
    ...moveCartA('B', 0.7),
    ...fbox([['Step 2: A → right (B)', C.amber], 'reward = 0'], C.amber),
    ...say('A → RIGHT → B (REWARD = 0)', C.amber)
  );

  await until(S(25));
  await play(
    new M.Indicate(qLab.BA, { color: ORANGE, runTime: 0.6 }),
    new M.Indicate(qLab.BD, { color: ORANGE, runTime: 0.6 }),
    ...say('LOOK AT CELL B’S TWO VALUES', ORANGE)
  );

  await until(S(26));
  await play(
    new M.LaggedStart([
      new M.Indicate(qLab.BA, { color: C.muted, runTime: 0.55 }),
      new M.Indicate(qLab.BD, { color: ORANGE, runTime: 0.55 }),
    ], { lagRatio: 0.5, runTime: 1.1 }),
    ...fbox(['In next cell B:', 'Q(B, left) = 0', ['Q(B, down) = 5', ORANGE]], ORANGE),
    ...say('LEFT = 0 · DOWN = 5', ORANGE)
  );

  const maxRing = new M.Circle({ radius: 0.30, color: C.green, strokeWidth: 3 });
  maxRing.moveTo(ARROW_DEF.BD.lp);
  await until(S(27));
  await play(
    new M.Create(maxRing, { runTime: 0.45 }),
    ...fbox(['In next cell B:', ['best next Q = larger of 0, 5', C.green], ['            = 5', C.green]], C.green),
    ...say('USE THE LARGER VALUE: 5', C.green)
  );

  await until(S(28));
  await play(
    ...fbox(['best next Q = 5', ['discounted  = 0.5 × 5 = 2.5', C.violet]], C.violet),
    ...say('HALF OF 5 = 2.5', C.violet)
  );

  await until(S(29));
  await play(
    new M.FadeOut(maxRing, { runTime: 0.35 }),
    ...fbox(['reward     = 0', ['discounted = 2.5', C.violet], ['target = 0 + 2.5 = 2.5', C.amber]], C.amber),
    ...say('TARGET = 0 + 2.5 = 2.5', C.amber)
  );

  await until(S(30));
  await play(
    new M.Indicate(qLab.AB, { color: ORANGE, runTime: 0.6 }),
    ...fbox(['target = 2.5', ['old Q(A, right) = 0', ORANGE]], ORANGE),
    ...say('OLD Q(A, RIGHT) = 0', ORANGE)
  );

  await until(S(31));
  await play(
    ...fbox([['error  = 2.5 − 0 = 2.5', C.pink], ['change = 0.5 × 2.5 = +1.25', C.green]], C.green),
    ...say('ERROR = 2.5 → CHANGE = +1.25', C.green)
  );

  await until(S(32));
  await play(
    ...setQA('AB', '1.25', ORANGE, 18, 0.45),
    new M.Flash(qLab.AB, { color: ORANGE, flashRadius: 0.24, runTime: 0.55 }),
    ...fbox(['old Q  = 0', 'change = +1.25', ['new Q(A, right) = 1.25', ORANGE]], ORANGE),
    ...say('Q(A, RIGHT): 0 → 1.25', ORANGE)
  );

  // --- Beats 33-38: Step 3 (B -> down -> D) ---
  await until(S(33));
  await play(
    ...styleArrowA('AB', C.muted, 3.0, 0.12, 0.78, 0.35),
    ...styleArrowA('BD', ORANGE, 4.8, 0.42, 1.0, 0.35),
    ...moveCartA('D', 0.7),
    ...fbox([['Step 3: B → down (D)', C.amber], 'move down to the dock'], C.amber),
    ...say('STEP 3: B → DOWN → DOCK', C.amber)
  );

  await until(S(34));
  await play(
    new M.Flash(dockPts, { color: C.amber, flashRadius: 0.35, runTime: 0.55 }),
    ...fbox(['Step 3: B → down', ['reward = 10', C.amber], ['target = 10', C.amber]], C.amber),
    ...say('REWARD = 10 · TARGET = 10', C.amber)
  );

  await until(S(35));
  await play(
    new M.Indicate(qLab.BD, { color: ORANGE, runTime: 0.6 }),
    ...fbox(['target = 10', ['old Q(B, down) = 5', ORANGE]], ORANGE),
    ...say('OLD Q(B, DOWN) = 5', ORANGE)
  );

  await until(S(36));
  await play(
    ...fbox(['target = 10', 'old Q  = 5', ['error  = 10 − 5 = 5', C.pink]], C.pink),
    ...say('ERROR = 10 − 5 = 5', C.pink)
  );

  await until(S(37));
  await play(
    ...fbox(['error  = 5', ['change = 0.5 × 5 = +2.5', C.green]], C.green),
    ...say('HALF THE ERROR = +2.5', C.green)
  );

  await until(S(38));
  await play(
    ...setQA('BD', '7.5', ORANGE, 19, 0.45),
    new M.Flash(qLab.BD, { color: ORANGE, flashRadius: 0.24, runTime: 0.55 }),
    ...fbox(['old Q  = 5', 'change = +2.5', ['new Q(B, down) = 7.5', ORANGE]], ORANGE),
    ...say('Q(B, DOWN): 5 → 7.5', ORANGE)
  );

  // --- Beats 39-42: Many deliveries, exploration, small error graph ---
  await until(S(39));
  await play(
    ...styleArrowA('BD', C.muted, 3.0, 0.12, 0.78, 0.3),
    ...moveCartA('A', 0.45),
    ...fbox(['Many deliveries', ['trying all 6 moves', C.cyan]], C.cyan),
    ...say('RUN MANY DELIVERIES', C.cyan)
  );
  // Quick exploratory hop A -> C -> D and update Q-values to step 9 snapshot
  await play(...moveCartA('C', 0.4), ...styleArrowA('AC', ORANGE, 4.0, 0.28, 0.95, 0.3));
  const snap9 = simHistory[8].snap;
  await play(
    ...moveCartA('D', 0.4),
    ...styleArrowA('AC', C.muted, 3.0, 0.12, 0.78, 0.3),
    ...styleArrowA('CD', ORANGE, 4.0, 0.28, 0.95, 0.3),
    ...KEYS.flatMap(k => setQA(k, fmt(snap9[k]), ORANGE, 17, 0.35))
  );

  await until(S(40));
  await play(
    ...styleArrowA('CD', C.muted, 3.0, 0.12, 0.78, 0.3),
    new M.LaggedStart(KEYS.map(k => new M.Indicate(arrows[k][1], { color: C.green, runTime: 0.45 })), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('EXPLORATION = TRY EVERY MOVE', C.green)
  );

  // Build small error-vs-step graph (authentic simulated |error| curve)
  const gx0 = GRAPHP[0] - GW / 2 + 0.55;
  const gx1 = GRAPHP[0] + GW / 2 - 0.18;
  const gy0 = GRAPHP[1] - GH / 2 + 0.25;
  const gy1 = GRAPHP[1] + GH / 2 - 0.12;
  const ptOf = (step, err) => [
    gx0 + ((step - 1) / (simHistory.length - 1)) * (gx1 - gx0),
    gy0 + (Math.min(10, err) / 10) * (gy1 - gy0),
    0,
  ];
  const gCard = new M.RoundedRectangle({ width: GW + 0.2, height: GH + 0.34, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 });
  gCard.setFill(C.card, 0.9); gCard.moveTo(GRAPHP);
  const gXAxis = new M.Line({ start: [gx0, gy0, 0], end: [gx1, gy0, 0], color: C.muted, strokeWidth: 2 });
  const gYAxis = new M.Line({ start: [gx0, gy0, 0], end: [gx0, gy1, 0], color: C.muted, strokeWidth: 2 });
  const gTitle = T('Size of the error at each step', 17, C.pink, true, true);
  gTitle.moveTo([GRAPHP[0] + 0.15, gy1 + 0.14, 0]);
  const gY10 = T('10', 16, C.muted, true); gY10.moveTo([gx0 - 0.3, gy1 - 0.08, 0]);
  const gY0 = T('0', 16, C.muted, true); gY0.moveTo([gx0 - 0.24, gy0 + 0.02, 0]);
  const gXLab = T('steps →', 16, C.muted, true); gXLab.moveTo([gx1 - 0.5, gy0 - 0.2, 0]);
  const graphFrame = new M.VGroup(gCard, gXAxis, gYAxis, gTitle, gY10, gY0, gXLab);

  const curveSegs = [];
  for (let i = 1; i < simHistory.length; i++) {
    const seg = new M.Line({
      start: ptOf(simHistory[i - 1].step, simHistory[i - 1].absErr),
      end: ptOf(simHistory[i].step, simHistory[i].absErr),
      color: C.pink,
      strokeWidth: 2.6,
    });
    curveSegs.push(seg);
  }
  const initSegs = curveSegs.slice(0, 8); // steps 1..9

  await until(S(41));
  await play(
    new M.FadeIn(graphFrame, { runTime: 0.5 }),
    new M.LaggedStart(initSegs.map(seg => new M.Create(seg, { runTime: 0.25 })), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('WATCH THE ERROR GRAPH', C.pink)
  );

  // Beat 42: errors fluctuate then shrink toward zero while Q-values settle
  await until(S(42));
  const segsA = curveSegs.slice(8, 22);
  const segsB = curveSegs.slice(22, 40);
  const segsC = curveSegs.slice(40);
  const snap23 = simHistory[22].snap;
  const snap41 = simHistory[40].snap;
  const snapEnd = simHistory[simHistory.length - 1].snap;

  await play(
    new M.LaggedStart(segsA.map(seg => new M.Create(seg, { runTime: 0.18 })), { lagRatio: 0.15, runTime: 1.4 }),
    ...KEYS.flatMap(k => setQA(k, fmt(snap23[k]), ORANGE, 17, 0.35)),
    ...fbox(['Exploring all 6 moves', ['step = 23', C.cyan], ['last error size = ' + fmt(simHistory[22].absErr), C.pink]], C.pink),
    ...say('ERRORS GROW, THEN APPROACH 0', C.pink)
  );
  await play(
    new M.LaggedStart(segsB.map(seg => new M.Create(seg, { runTime: 0.16 })), { lagRatio: 0.12, runTime: 1.4 }),
    ...KEYS.flatMap(k => setQA(k, fmt(snap41[k]), ORANGE, 17, 0.35)),
    ...fbox(['Exploring all 6 moves', ['step = 41', C.cyan], ['last error size = ' + fmt(simHistory[40].absErr), C.pink]], C.pink)
  );
  await play(
    new M.LaggedStart(segsC.map(seg => new M.Create(seg, { runTime: 0.15 })), { lagRatio: 0.1, runTime: 1.4 }),
    ...KEYS.flatMap(k => setQA(k, fmt(snapEnd[k]), ORANGE, 17, 0.35)),
    ...fbox(['Values settled!', ['step = 63', C.green], ['last error size ≈ 0', C.green]], C.green)
  );

  // --- Beats 43-45: settled Q-values in cells A, B, C ---
  const OPT = { AB: '5', AC: '5', BA: '2.5', BD: '10', CA: '2.5', CD: '10' };
  await until(S(43));
  await play(
    ...KEYS.flatMap(k => setQA(k, OPT[k], ORANGE, 18, 0.35)),
    ...styleArrowA('AB', ORANGE, 4.4, 0.35, 1.0, 0.4),
    ...styleArrowA('AC', ORANGE, 4.4, 0.35, 1.0, 0.4),
    ...fbox(['Settled in cell A:', ['Q(A, right) → 5', ORANGE], ['Q(A, down)  → 5', ORANGE]], ORANGE),
    ...say('CELL A: BOTH MOVES → 5', ORANGE)
  );

  await until(S(44));
  await play(
    ...styleArrowA('AB', C.muted, 3.0, 0.12, 0.78, 0.35),
    ...styleArrowA('AC', C.muted, 3.0, 0.12, 0.78, 0.35),
    ...styleArrowA('BD', C.green, 4.8, 0.4, 1.0, 0.4),
    ...styleArrowA('BA', ORANGE, 3.6, 0.22, 0.9, 0.4),
    ...fbox(['Settled in cell B:', ['Q(B, down) → 10', C.green], ['Q(B, left) → 2.5', ORANGE]], ORANGE),
    ...say('CELL B: DOWN → 10 · LEFT → 2.5', ORANGE)
  );

  await until(S(45));
  await play(
    ...styleArrowA('BD', C.muted, 3.0, 0.12, 0.78, 0.35),
    ...styleArrowA('BA', C.muted, 3.0, 0.12, 0.78, 0.35),
    ...styleArrowA('CD', C.green, 4.8, 0.4, 1.0, 0.4),
    ...styleArrowA('CA', ORANGE, 3.6, 0.22, 0.9, 0.4),
    ...fbox(['Settled in cell C:', ['Q(C, right) → 10', C.green], ['Q(C, up)    → 2.5', ORANGE]], ORANGE),
    ...say('CELL C: RIGHT → 10 · UP → 2.5', ORANGE)
  );

  // --- Beats 46-49: the three short formulas (plain words, no Greek letters) ---
  await until(S(46));
  await play(
    ...restyleAllA(C.muted, 3.0, 0.12, 0.78, 0.35),
    new M.FadeOut(new M.VGroup(graphFrame, ...curveSegs), { runTime: 0.5 }),
    ...fbox([['Q-learning update', C.cyan], 'three short formulas'], C.cyan),
    ...say('THREE SHORT FORMULAS', C.cyan)
  );

  await until(S(47));
  await play(
    ...fbox([
      ['1. target = reward', C.amber],
      ['   + discount × best next Q', C.violet],
    ], C.amber),
    ...say('1. TARGET = REWARD + DISCOUNTED BEST', C.amber)
  );

  await until(S(48));
  await play(
    ...fbox([
      '1. target = reward',
      '   + discount × best next Q',
      ['2. error  = target − old Q', C.pink],
    ], C.pink),
    ...say('2. ERROR = TARGET − OLD Q', C.pink)
  );

  await until(S(49));
  await play(
    ...fbox([
      '1. target = reward',
      '   + discount × best next Q',
      '2. error  = target − old Q',
      ['3. new Q  = old Q + learning rate × error', C.green],
    ], C.green),
    ...say('3. NEW Q = OLD Q + LEARNING RATE × ERROR', C.green)
  );

  // --- Beats 50-51: what it is for (choose highest Q without knowing rules) ---
  await until(S(50));
  await play(
    ...moveCartA('A', 0.6),
    ...['AB', 'AC', 'BD', 'CD'].flatMap(k => styleArrowA(k, C.green, 4.4, 0.34, 1.0, 0.45)),
    ...fbox([['Why Q-learning?', C.green], 'discover the best moves', 'through experience alone'], C.green),
    ...say('LEARN BEST MOVES BY EXPERIENCE', C.green)
  );

  await until(S(51));
  await play(
    ...moveCartA('B', 0.65),
    new M.Indicate(qLab.AB, { color: C.green, runTime: 0.55 }),
    ...fbox([['Best choice in each cell:', C.amber], 'A → right (5)', 'B → down (10)'], C.amber),
    ...say('PICK HIGHEST Q IN CURRENT CELL', C.amber)
  );
  await play(
    ...moveCartA('D', 0.65),
    new M.Indicate(qLab.BD, { color: C.green, runTime: 0.55 }),
    new M.Flash(dockPts, { color: C.amber, flashRadius: 0.35, runTime: 0.55 })
  );

  // --- Beats 52-53: common trap (never trying a move) ---
  await until(S(52));
  await play(
    ...styleArrowA('CD', C.pink, 3.0, 0.14, 0.45, 0.4),
    ...setQA('CD', '?', C.pink, 20, 0.4),
    ...fbox([['Trap: no exploration', C.pink], 'untried move stays 0', 'true value stays hidden'], C.pink),
    ...say('TRAP: UNTRIED MOVE = UNKNOWN', C.pink)
  );

  await until(S(53));
  await play(
    ...styleArrowA('AC', C.amber, 4.4, 0.34, 1.0, 0.4),
    ...styleArrowA('CD', C.green, 4.8, 0.4, 1.0, 0.4),
    ...setQA('CD', '10', ORANGE, 18, 0.4),
    new M.Flash(qLab.CD, { color: C.amber, flashRadius: 0.25, runTime: 0.55 }),
    ...fbox([['Keep exploring:', C.amber], '0 now can lead to +10', 'on the next move'], C.amber),
    ...say('A 0 NOW CAN LEAD TO +10 LATER', C.amber)
  );

  // --- Beat 54: one-sentence recap ---
  await until(S(54));
  await play(
    ...['AB', 'AC', 'BD', 'CD'].flatMap(k => styleArrowA(k, C.green, 4.4, 0.32, 1.0, 0.45)),
    ...['BA', 'CA'].flatMap(k => styleArrowA(k, ORANGE, 3.0, 0.14, 0.78, 0.45)),
    ...fbox([
      ['Q-learning recap:', ORANGE],
      'reward + best next move',
      'nudge old Q toward target',
      ['explore every move', C.green],
    ], ORANGE),
    ...say('REWARD + BEST ESTIMATED NEXT MOVE', ORANGE)
  );
}
