// 15.2.7 Temporal-difference learning: learning from each move.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const GX = P ? 0 : -2.75, GY = P ? 0.85 : -0.65, CS = P ? 2.6 : 2.1;
  const PILL = P ? [0, 3.85, 0] : [GX, 1.92, 0];
  const BOXP = P ? [0, -3.7, 0] : [3.55, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  const pos = {
    A: [GX - CS / 2, GY + CS / 2, 0],
    B: [GX + CS / 2, GY + CS / 2, 0],
    C: [GX - CS / 2, GY - CS / 2, 0],
    D: [GX + CS / 2, GY - CS / 2, 0],
  };

  // Formula box: one box at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.7;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.65 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  // Clean vector arrow built from Lines (safe across all manim-web builds)
  function makeArrow(p1, p2, color, sw = 3, op = 0.9, hl = 0.16) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, ca = Math.cos(0.56), sa = Math.sin(0.56);
    const w1 = [p2[0] - hl * (ux * ca - uy * sa), p2[1] - hl * (ux * sa + uy * ca), 0];
    const w2 = [p2[0] - hl * (ux * ca + uy * sa), p2[1] - hl * (-ux * sa + uy * ca), 0];
    const s0 = new M.Line({ start: p1, end: p2, color, strokeWidth: sw }); s0.setStrokeOpacity(op);
    const s1 = new M.Line({ start: p2, end: w1, color, strokeWidth: sw }); s1.setStrokeOpacity(op);
    const s2 = new M.Line({ start: p2, end: w2, color, strokeWidth: sw }); s2.setStrokeOpacity(op);
    return new M.VGroup(s0, s1, s2);
  }

  // Grid builder: returns static cell frames + independent value Text objects
  function buildGrid(initVals, showDock = true) {
    const statics = [];
    const valMobs = {};
    for (const id of ['A', 'B', 'C', 'D']) {
      const [cx, cy] = pos[id];
      const isDock = id === 'D' && showDock;
      const rect = new M.RoundedRectangle({
        width: CS - 0.14, height: CS - 0.14, cornerRadius: 0.14,
        color: isDock ? C.green : C.line, strokeWidth: isDock ? 2.5 : 2
      });
      rect.setFill(C.card, 0.92); rect.moveTo([cx, cy, -0.01]);
      statics.push(rect);
      const letter = T(id, P ? 22 : 20, isDock ? C.green : C.ink, true, true);
      letter.moveTo([cx - CS * 0.34, cy + CS * 0.34, 0]);
      statics.push(letter);
      if (isDock) {
        const dk = T('DOCK', P ? 17 : 16, C.green, true, true);
        dk.moveTo([cx, cy - CS * 0.35, 0]);
        statics.push(dk);
      }
      const valCol = initVals[id] === '?' ? C.muted : C.cyan;
      const vt = T(String(initVals[id]), P ? 34 : 32, valCol, true, true);
      vt.moveTo([cx, cy - 0.04, 0]);
      valMobs[id] = vt;
    }
    return { gridStatic: new M.VGroup(...statics), valMobs };
  }

  function buildPolicy() {
    const items = [];
    const addPol = (p1, p2, lab, lp) => {
      items.push(makeArrow(p1, p2, C.muted, 2.2, 0.65, 0.13));
      const t = T(lab, P ? 16 : 15, C.ink, true, true); t.moveTo(lp); items.push(t);
    };
    addPol([GX - 0.28, GY + CS / 2 + 0.24, 0], [GX + 0.28, GY + CS / 2 + 0.24, 0], '50%', [GX, GY + CS / 2 + 0.44, 0]);
    addPol([GX + 0.28, GY + CS / 2 - 0.34, 0], [GX - 0.28, GY + CS / 2 - 0.34, 0], '50%', [GX, GY + CS / 2 - 0.54, 0]);
    addPol([GX - CS / 2, GY + 0.28, 0], [GX - CS / 2, GY - 0.28, 0], '50%', [GX - CS / 2 - 0.38, GY, 0]);
    addPol([GX + CS / 2, GY + 0.28, 0], [GX + CS / 2, GY - 0.28, 0], '50%', [GX + CS / 2 + 0.38, GY, 0]);
    addPol([GX - 0.28, GY - CS / 2, 0], [GX + 0.28, GY - CS / 2, 0], '100%', [GX, GY - CS / 2 - 0.24, 0]);
    return new M.VGroup(...items);
  }

  // White delivery cart (3 independent leaf mobjects so Transform never detaches)
  function cartTarget(id) {
    const [cx, cy] = pos[id], px = cx + CS * 0.25, py = cy + CS * 0.27;
    const body = new M.RoundedRectangle({ width: 0.34, height: 0.18, cornerRadius: 0.05, color: C.ink, strokeWidth: 2 });
    body.setFill(C.ink, 0.95); body.moveTo([px, py + 0.03, 0]);
    const w1 = new M.Dot({ point: [px - 0.09, py - 0.10, 0], radius: 0.045, color: C.ink });
    const w2 = new M.Dot({ point: [px + 0.09, py - 0.10, 0], radius: 0.045, color: C.ink });
    return [body, w1, w2];
  }

  let gridStatic = null, valMobs = null, policyGroup = null, cartParts = null;
  let hlBox = null, moveMobs = [];

  function setVal(id, str, col = C.cyan, flash = false) {
    const [cx, cy] = pos[id];
    const next = T(String(str), P ? 34 : 32, col, true, true);
    next.moveTo([cx, cy - 0.04, 0]);
    const old = valMobs[id];
    valMobs[id] = next;
    const a = [new M.FadeOut(old, { runTime: 0.45 }), new M.FadeIn(next, { runTime: 0.55 })];
    if (flash) a.push(new M.Flash(next, { color: col, flashRadius: 0.28, lineLength: 0.18, runTime: 0.6 }));
    return a;
  }

  function highlightCell(id, col = C.amber) {
    const box = new M.RoundedRectangle({
      width: CS - 0.08, height: CS - 0.08, cornerRadius: 0.16, color: col, strokeWidth: 4.5
    });
    box.setFill(col, 0.08); box.moveTo([pos[id][0], pos[id][1], 0.01]);
    const a = [new M.FadeIn(box, { runTime: 0.5 })];
    if (hlBox) a.push(new M.FadeOut(hlBox, { runTime: 0.45 }));
    hlBox = box;
    return a;
  }
  function clearHighlight() {
    if (!hlBox) return [];
    const old = hlBox; hlBox = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  function moveCart(id, rt = 0.65) {
    const tgt = cartTarget(id);
    return cartParts.map((m, i) => new M.Transform(m, tgt[i], { runTime: rt }));
  }

  function clearMove() {
    if (!moveMobs.length) return [];
    const old = moveMobs; moveMobs = [];
    return [new M.FadeOut(new M.VGroup(...old), { runTime: 0.45 })];
  }

  function showMoveArrow(from, to, badgeText, badgeCol = C.amber) {
    const a = clearMove();
    let p1, p2, bp;
    // Badges sit in free space: never on a cell letter, value, cart or policy label.
    if (from === 'B' && to === 'D') {
      p1 = [GX + CS / 2, GY + 0.32, 0]; p2 = [GX + CS / 2, GY - 0.32, 0];
      bp = [GX + CS / 2 - 0.5, GY + 0.45, 0];
    } else if (from === 'A' && to === 'B') {
      p1 = [GX - 0.32, GY + CS / 2 + 0.24, 0]; p2 = [GX + 0.32, GY + CS / 2 + 0.24, 0];
      bp = [GX + 0.4, GY + CS / 2 - 0.22, 0];
    } else if (from === 'A' && to === 'C') {
      p1 = [GX - CS / 2, GY + 0.32, 0]; p2 = [GX - CS / 2, GY - 0.32, 0];
      bp = [GX - CS / 2 - 0.52, GY - 0.30, 0];
    } else {
      p1 = [GX - 0.32, GY - CS / 2, 0]; p2 = [GX + 0.32, GY - CS / 2, 0];
      bp = [GX, GY - CS / 2 - 0.46, 0];
    }
    const arr = makeArrow(p1, p2, badgeCol, 4.5, 1.0, 0.18);
    moveMobs.push(arr);
    a.push(new M.FadeIn(arr, { runTime: 0.5 }));
    if (badgeText) {
      const b = pill(badgeText, badgeCol, P ? 18 : 17); b.moveTo(bp);
      moveMobs.push(b);
      a.push(new M.FadeIn(b, { runTime: 0.5 }));
    }
    return a;
  }

  // --- 0-2: Unknown warehouse ---
  ({ gridStatic, valMobs } = buildGrid({ A: '?', B: '?', C: '?', D: '?' }, false));
  cartParts = cartTarget('A');
  await until(S(0));
  await play(
    new M.FadeIn(gridStatic, { runTime: 0.9 }),
    ...Object.values(valMobs).map(v => new M.FadeIn(v, { runTime: 0.9 })),
    ...cartParts.map(p => new M.FadeIn(p, { runTime: 0.9 })),
    ...say('NEW WAREHOUSE', C.cyan)
  );

  await until(S(1));
  await play(
    new M.LaggedStart(Object.values(valMobs).map(v => new M.Indicate(v, { color: C.amber })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('UNKNOWN MOVES & REWARDS', C.muted)
  );

  await until(S(2));
  await play(
    new M.LaggedStart(Object.values(valMobs).map(v => new M.Indicate(v, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('LEARN CELL VALUES FROM EXPERIENCE?', C.amber)
  );

  // --- 3-5: Draw 4 cells with 0s and fixed policy ---
  await until(S(3));
  const oldGrid = gridStatic, oldVals = Object.values(valMobs);
  ({ gridStatic, valMobs } = buildGrid({ A: '0', B: '0', C: '0', D: '0' }, true));
  await play(
    new M.FadeOut(new M.VGroup(oldGrid, ...oldVals), { runTime: 0.45 }),
    new M.FadeIn(gridStatic, { runTime: 0.7 }),
    new M.LaggedStart(Object.values(valMobs).map(v => new M.FadeIn(v)), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('START WITH 0 IN EVERY CELL', C.cyan)
  );

  await until(S(4));
  await play(
    new M.LaggedStart(Object.values(valMobs).map(v => new M.Indicate(v, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('FIRST GUESSES: STATE VALUES = 0', C.cyan)
  );

  await until(S(5));
  policyGroup = buildPolicy();
  await play(new M.FadeIn(policyGroup, { runTime: 0.9 }), ...say('ORIGINAL POLICY: MOVE CHANCES', C.cyan));

  // --- 6-9: First move B -> D (+10) ---
  await until(S(6));
  await play(...moveCart('B', 0.65), ...highlightCell('B', C.cyan), ...say('START DELIVERY AT CELL B', C.cyan));

  await until(S(7));
  await play(
    ...showMoveArrow('B', 'D', '+10', C.amber),
    ...moveCart('D', 0.7),
    new M.Flash(valMobs.D, { color: C.amber, flashRadius: 0.3, runTime: 0.7 }),
    ...say('B → D : EARNS +10 POINTS', C.amber)
  );

  await until(S(8));
  await play(
    new M.Indicate(valMobs.B, { color: C.cyan, runTime: 0.9 }),
    ...fbox(['cell B surprise', ['expected = 0', C.cyan], ['earned   = 10', C.amber]], C.amber),
    ...say('EXPECTED 0, GOT 10', C.amber)
  );

  await until(S(9));
  await play(
    new M.Indicate(valMobs.B, { color: C.pink, runTime: 0.9 }),
    ...say('OLD GUESS MUST CHANGE', C.pink)
  );

  // --- 10-13: Bus journey analogy (clean standalone picture) ---
  const busY = P ? 0.5 : -0.25;
  const busW = P ? 5.8 : 8.4;
  const b2x = m => -busW / 2 + (m - 15) / 20 * busW;
  const busLine = new M.Line({ start: [b2x(15), busY, 0], end: [b2x(35), busY, 0], color: C.muted, strokeWidth: 3 });
  const busTicks = [15, 20, 25, 30, 35].map(m => new M.VGroup(
    new M.Line({ start: [b2x(m), busY - 0.1, 0], end: [b2x(m), busY + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    T(String(m), 18, C.muted, true).moveTo([b2x(m), busY - 0.42, 0])
  ));
  const busUnit = T('minutes', 16, C.muted); busUnit.moveTo([b2x(35) - 0.2, busY - 0.85, 0]);
  const dot20 = new M.Dot({ point: [b2x(20), busY, 0], radius: 0.14, color: C.cyan });
  const lab20 = T('old guess: 20', 18, C.cyan, true); lab20.moveTo([b2x(20), busY + 0.55, 0]);

  await until(S(10));
  const warehouseAll = [gridStatic, ...Object.values(valMobs), policyGroup, ...cartParts];
  await play(
    new M.FadeOut(new M.VGroup(...warehouseAll), { runTime: 0.5 }),
    ...clearHighlight(), ...clearMove(), ...clearBox(),
    new M.Create(busLine, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...busTicks, busUnit), { runTime: 0.7 }),
    new M.FadeIn(dot20, { runTime: 0.7 }), new M.FadeIn(lab20, { runTime: 0.7 }),
    ...showA('BUS GUESS: 20 MINUTES', C.cyan, P ? [0, 3.85, 0] : [0, 1.92, 0])
  );

  const dot30 = new M.Dot({ point: [b2x(30), busY, 0], radius: 0.14, color: C.amber });
  const lab30 = T('today: 30', 18, C.amber, true); lab30.moveTo([b2x(30), busY + 0.55, 0]);
  const gapLine = new M.DashedLine({ start: [b2x(20), busY + 0.22, 0], end: [b2x(30), busY + 0.22, 0], color: C.amber });
  await until(S(11));
  await play(
    new M.FadeIn(dot30, { runTime: 0.6 }), new M.FadeIn(lab30, { runTime: 0.6 }),
    new M.Create(gapLine, { runTime: 0.6 }),
    new M.Flash(dot30, { color: C.amber, runTime: 0.6 }),
    ...showA('TODAY: 30 MINUTES', C.amber, P ? [0, 3.85, 0] : [0, 1.92, 0])
  );

  const dot25 = new M.Dot({ point: [b2x(25), busY, 0], radius: 0.16, color: C.green });
  const lab25 = T('new guess: 25', 19, C.green, true, true); lab25.moveTo([b2x(25), busY + 1.05, 0]);
  const nudgeArr = makeArrow([b2x(20) + 0.16, busY + 0.04, 0], [b2x(25) - 0.18, busY + 0.04, 0], C.green, 4, 1, 0.16);
  await until(S(12));
  await play(
    new M.FadeIn(nudgeArr, { runTime: 0.7 }),
    new M.FadeIn(dot25, { runTime: 0.7 }), new M.FadeIn(lab25, { runTime: 0.7 }),
    new M.Flash(dot25, { color: C.green, runTime: 0.7 }),
    ...showA('MOVE HALFWAY → 25 MINUTES', C.green, P ? [0, 3.85, 0] : [0, 1.92, 0])
  );

  await until(S(13));
  await play(
    new M.Indicate(dot25, { color: C.green, runTime: 0.9 }),
    ...showA('BLEND OLD GUESS + NEW EXPERIENCE', C.green, P ? [0, 3.85, 0] : [0, 1.92, 0])
  );

  // --- 14-16: Return to warehouse, name TD learning ---
  await until(S(14));
  ({ gridStatic, valMobs } = buildGrid({ A: '0', B: '0', C: '0', D: '0' }, true));
  policyGroup = buildPolicy();
  cartParts = cartTarget('B');
  await play(
    new M.FadeOut(new M.VGroup(busLine, ...busTicks, busUnit, dot20, lab20, dot30, lab30, gapLine, dot25, lab25, nudgeArr), { runTime: 0.5 }),
    new M.FadeIn(gridStatic, { runTime: 0.7 }),
    ...Object.values(valMobs).map(v => new M.FadeIn(v, { runTime: 0.7 })),
    new M.FadeIn(policyGroup, { runTime: 0.7 }),
    ...cartParts.map(p => new M.FadeIn(p, { runTime: 0.7 })),
    ...say('CART LEARNS AFTER EVERY MOVE', C.cyan)
  );

  await until(S(15));
  await play(...say('TEMPORAL-DIFFERENCE (TD) LEARNING', C.green));

  await until(S(16));
  await play(
    ...fbox([['TD learning', C.green], 'compare old estimate', 'with newer estimate'], C.green),
    ...say('DIFFERENCE BETWEEN ESTIMATES OVER TIME', C.violet)
  );

  // --- 17-26: Worked Step 1: B -> D (0 -> 5) ---
  await until(S(17));
  // During the worked steps only the move being learned is drawn (policy arrows rest).
  await play(
    new M.FadeOut(policyGroup, { runTime: 0.45 }),
    ...highlightCell('B', C.amber),
    ...showMoveArrow('B', 'D', '+10', C.amber),
    ...moveCart('D', 0.7),
    ...say('STEP 1: MOVE B → D', C.amber)
  );

  await until(S(18));
  await play(
    new M.Indicate(valMobs.B, { color: C.cyan, runTime: 0.8 }),
    ...fbox(['Step 1: update cell B', ['old estimate = 0', C.cyan]], C.cyan),
    ...say('OLD ESTIMATE (B) = 0', C.cyan)
  );

  await until(S(19));
  await play(
    new M.Indicate(valMobs.D, { color: C.green, runTime: 0.8 }),
    ...fbox(['Step 1: update cell B', 'old    = 0', ['reward = 10', C.amber], ['future = 0 (dock)', C.green]], C.amber),
    ...say('REWARD = 10, NO FUTURE REWARDS', C.amber)
  );

  await until(S(20));
  await play(
    ...fbox(['Step 1: update cell B', 'old    = 0', ['target = 10 + 0 = 10', C.amber]], C.amber),
    ...say('TARGET = 10', C.amber)
  );

  await until(S(21));
  await play(
    ...fbox(['Step 1: update cell B', 'old    = 0', 'target = 10', ['error  = 10 − 0 = 10', C.pink]], C.pink),
    ...say('ERROR = 10 − 0 = 10', C.pink)
  );

  await until(S(22));
  await play(
    ...fbox(['Step 1: update cell B', 'error  = 10', ['correct half of error', C.green]], C.green),
    ...say('CORRECT HALF OF THE ERROR', C.green)
  );

  await until(S(23));
  await play(
    ...fbox(['Step 1: update cell B', 'error  = 10', ['learning rate = share', C.green]], C.green),
    ...say('LEARNING RATE = SHARE CORRECTED', C.green)
  );

  await until(S(24));
  await play(
    ...fbox(['Step 1: update cell B', 'error         = 10', ['learning rate = 0.5', C.green]], C.green),
    ...say('LEARNING RATE = 0.5', C.green)
  );

  await until(S(25));
  await play(
    ...setVal('B', '5', C.cyan, true),
    ...fbox(['Step 1: update cell B', ['change = 0.5 × 10 = 5', C.green], ['new B  = 0 + 5 = 5', C.cyan]], C.cyan),
    ...say('ADD 5 TO OLD ESTIMATE', C.green)
  );

  await until(S(26));
  await play(
    new M.Indicate(valMobs.B, { color: C.cyan, runTime: 0.8 }),
    ...clearMove(),
    ...fbox(['Step 1 complete', ['cell B: 0 → 5', C.cyan]], C.cyan),
    ...say('CELL B = 5', C.cyan)
  );

  // --- 27-37: Worked Step 2: A -> B (0 -> 1.25) + Bootstrapping ---
  await until(S(27));
  await play(
    ...highlightCell('A', C.amber),
    ...moveCart('A', 0.65),
    ...say('STEP 2: NEW DELIVERY AT A', C.cyan)
  );

  await until(S(28));
  await play(
    ...showMoveArrow('A', 'B', '0', C.amber),
    ...moveCart('B', 0.65),
    ...fbox(['Step 2: update cell A', 'move: A → B', ['reward = 0', C.amber]], C.amber),
    ...say('A → B : REWARD = 0', C.amber)
  );

  await until(S(29));
  await play(
    new M.Indicate(valMobs.B, { color: C.cyan, runTime: 0.9 }),
    ...fbox(['Step 2: update cell A', 'reward   = 0', ['next (B) = 5', C.cyan]], C.cyan),
    ...say('NEXT CELL B HAS VALUE 5', C.cyan)
  );

  // Purple discounted badge near B -> A
  // Under B's value, inside cell B (clear of both values and the move badge).
  const discPill = pill('0.5 × 5 = 2.5', C.violet, P ? 17 : 16);
  discPill.moveTo([pos.B[0] + 0.05, pos.B[1] - CS * 0.3, 0]);
  moveMobs.push(discPill);
  await until(S(30));
  await play(
    new M.FadeIn(discPill, { runTime: 0.6 }),
    ...fbox(['Step 2: update cell A', 'next (B)   = 5', ['discounted = 0.5 × 5 = 2.5', C.violet]], C.violet),
    ...say('DISCOUNT BY 0.5 → 2.5', C.violet)
  );

  await until(S(31));
  await play(
    ...fbox(['Step 2: update cell A', 'reward     = 0', ['discounted = 2.5', C.violet], ['target     = 0 + 2.5 = 2.5', C.amber]], C.amber),
    ...say('TARGET = 0 + 2.5 = 2.5', C.amber)
  );

  await until(S(32));
  await play(
    new M.Indicate(valMobs.A, { color: C.pink, runTime: 0.8 }),
    ...fbox(['Step 2: update cell A', 'old (A) = 0', 'target  = 2.5', ['error   = 2.5 − 0 = 2.5', C.pink]], C.pink),
    ...say('ERROR = 2.5', C.pink)
  );

  await until(S(33));
  await play(
    ...fbox(['Step 2: update cell A', 'error  = 2.5', ['change = 0.5 × 2.5 = 1.25', C.green]], C.green),
    ...say('HALF OF 2.5 = 1.25', C.green)
  );

  await until(S(34));
  await play(
    ...setVal('A', '1.25', C.cyan, true),
    ...fbox(['Step 2: update cell A', 'old (A) = 0', ['new A   = 0 + 1.25 = 1.25', C.cyan]], C.cyan),
    ...say('0 + 1.25 = 1.25', C.cyan)
  );

  await until(S(35));
  await play(
    new M.Indicate(valMobs.A, { color: C.cyan, runTime: 0.8 }),
    ...clearMove(),
    ...fbox(['Step 2 complete', ['cell A: 0 → 1.25', C.cyan]], C.cyan),
    ...say('CELL A = 1.25', C.cyan)
  );

  await until(S(36));
  await play(
    new M.Indicate(valMobs.A, { color: C.violet, runTime: 0.8 }),
    new M.Indicate(valMobs.B, { color: C.violet, runTime: 0.8 }),
    ...say('A LEARNS BEFORE REACHING DOCK', C.violet)
  );

  const bootArr = makeArrow([GX + 0.36, GY + CS / 2 - 0.10, 0], [GX - 0.36, GY + CS / 2 - 0.10, 0], C.violet, 4, 1, 0.16);
  moveMobs.push(bootArr);
  await until(S(37));
  await play(
    new M.FadeIn(bootArr, { runTime: 0.6 }),
    ...fbox([['Bootstrapping', C.violet], 'use estimate of B (5)', 'to update A (→ 1.25)'], C.violet),
    ...say('BOOTSTRAPPING', C.violet)
  );

  // --- 38-42: Worked Step 3: B -> D again (5 -> 7.5) ---
  await until(S(38));
  await play(
    ...highlightCell('B', C.amber),
    ...showMoveArrow('B', 'D', '+10', C.amber),
    ...moveCart('D', 0.65),
    ...fbox(['Step 3: update cell B', 'move: B → D', ['reward = 10', C.amber]], C.amber),
    ...say('STEP 3: B → D (+10)', C.amber)
  );

  await until(S(39));
  await play(
    new M.Indicate(valMobs.B, { color: C.cyan, runTime: 0.8 }),
    ...fbox(['Step 3: update cell B', ['old (B) = 5', C.cyan], ['target  = 10', C.amber]], C.amber),
    ...say('TARGET = 10, OLD = 5', C.amber)
  );

  await until(S(40));
  await play(
    ...fbox(['Step 3: update cell B', 'old (B) = 5', 'target  = 10', ['error   = 10 − 5 = 5', C.pink]], C.pink),
    ...say('ERROR = 10 − 5 = 5', C.pink)
  );

  await until(S(41));
  await play(
    ...fbox(['Step 3: update cell B', 'error  = 5', ['change = 0.5 × 5 = 2.5', C.green]], C.green),
    ...say('HALF OF 5 = 2.5', C.green)
  );

  await until(S(42));
  await play(
    ...setVal('B', '7.5', C.cyan, true),
    ...clearMove(),
    ...fbox(['Step 3 complete', ['new B = 5 + 2.5 = 7.5', C.cyan]], C.cyan),
    ...say('CELL B = 7.5', C.cyan)
  );

  // --- 43-47: Error plot + many deliveries settling to 4, 6, 10 ---
  const chW = P ? 6.4 : 4.9, chH = P ? 2.9 : 2.7;
  const chX0 = BOXP[0] - chW / 2 + 0.35, chY0 = BOXP[1] - chH / 2 + 0.15;
  const chX1 = chX0 + chW - 0.5, chY1 = chY0 + chH - 0.25;
  const errs = [10, 2.5, 5, 7.5, 3.2, 4.4, 2.1, 2.8, 1.4, 1.7, 0.9, 0.4];
  const ex = i => chX0 + i / (errs.length - 1) * (chX1 - chX0);
  const ey = v => chY0 + v / 10 * (chY1 - chY0);

  const axX = new M.Line({ start: [chX0, chY0, 0], end: [chX1 + 0.15, chY0, 0], color: C.muted, strokeWidth: 2 });
  const axY = new M.Line({ start: [chX0, chY0, 0], end: [chX0, chY1 + 0.18, 0], color: C.muted, strokeWidth: 2 });
  const yLabs = [0, 5, 10].map(v => {
    const t = T(String(v), 17, C.muted, true); t.moveTo([chX0 - 0.32, ey(v), 0]); return t;
  });
  const chTitle = T('TD error per move', 19, C.pink, true, true);
  chTitle.moveTo([(chX0 + chX1) / 2, chY1 + 0.34, 0]);
  const chXLab = T('updates →', 17, C.muted, true);
  chXLab.moveTo([chX1 - 0.35, chY0 - 0.30, 0]);
  const chartFrame = new M.VGroup(axX, axY, ...yLabs, chTitle, chXLab);

  const eDots = errs.map((v, i) => new M.Dot({ point: [ex(i), ey(v), 0], radius: i < 3 ? 0.085 : 0.065, color: C.pink }));
  const eSegs = [];
  for (let i = 0; i < errs.length - 1; i++) {
    eSegs.push(new M.Line({ start: [ex(i), ey(errs[i]), 0], end: [ex(i + 1), ey(errs[i + 1]), 0], color: C.pink, strokeWidth: 2.5 }));
  }
  const eLab0 = T('10', 18, C.pink, true, true); eLab0.moveTo([ex(0) + 0.3, ey(10) - 0.02, 0]);
  const eLab1 = T('2.5', 18, C.pink, true, true); eLab1.moveTo([ex(1) + 0.06, ey(2.5) - 0.3, 0]);
  const eLab2 = T('5', 18, C.pink, true, true); eLab2.moveTo([ex(2) + 0.06, ey(5) + 0.28, 0]);

  await until(S(43));
  await play(
    ...clearBox(), ...clearHighlight(),
    new M.FadeIn(chartFrame, { runTime: 0.6 }),
    new M.LaggedStart([
      new M.FadeIn(eDots[0]), new M.FadeIn(eLab0),
      new M.Create(eSegs[0]), new M.FadeIn(eDots[1]), new M.FadeIn(eLab1),
      new M.Create(eSegs[1]), new M.FadeIn(eDots[2]), new M.FadeIn(eLab2)
    ], { lagRatio: 0.18, runTime: 1.8 }),
    ...say('THREE ERRORS: 10, 2.5, 5', C.pink)
  );

  await until(S(44));
  await play(
    new M.Indicate(eSegs[1], { color: C.amber, runTime: 1.0 }),
    new M.Indicate(eDots[2], { color: C.amber, runTime: 1.0 }),
    ...say('ERROR CAN RISE ON NEW MOVES', C.amber)
  );

  // Beat 45: extend curve + run deliveries while values move smoothly toward 4, 6, 10
  await until(S(45));
  const restCurve = [];
  for (let i = 2; i < errs.length - 1; i++) {
    restCurve.push(new M.Create(eSegs[i]));
    restCurve.push(new M.FadeIn(eDots[i + 1]));
  }
  await play(
    new M.LaggedStart(restCurve, { lagRatio: 0.14, runTime: 1.9 }),
    ...setVal('C', '7.5', C.cyan), ...setVal('A', '2.8', C.cyan), ...setVal('B', '6.4', C.cyan),
    ...moveCart('C', 0.6),
    ...say('MANY DELIVERIES, SMALLER LEARNING RATE', C.cyan)
  );
  await play(
    ...setVal('C', '9.4', C.cyan), ...setVal('A', '3.7', C.cyan), ...setVal('B', '6.1', C.cyan),
    ...moveCart('A', 0.6)
  );

  await until(S(46));
  await play(
    ...setVal('A', '4', C.cyan, true),
    ...setVal('B', '6', C.cyan, true),
    ...setVal('C', '10', C.cyan, true),
    ...say('APPROACHES: A = 4, B = 6, C = 10', C.green)
  );

  await until(S(47));
  await play(
    new M.LaggedStart([valMobs.A, valMobs.B, valMobs.C].map(v => new M.Indicate(v, { color: C.green })), { lagRatio: 0.18, runTime: 1.4 }),
    ...say('TRUE VALUES UNDER ORIGINAL POLICY', C.green)
  );

  // --- 48-51: The three formulas ---
  const chartAll = [chartFrame, ...eDots, ...eSegs, eLab0, eLab1, eLab2];
  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(...chartAll), { runTime: 0.55 }),
    ...fbox([['TD learning: 3 steps', C.cyan]], C.cyan),
    ...say('THREE SHORT FORMULAS', C.cyan)
  );

  await until(S(49));
  await play(
    ...fbox([
      ['1. target = reward', C.amber],
      ['          + discount × next', C.violet]
    ], C.amber),
    ...say('1. TARGET = REWARD + DISCOUNT × NEXT', C.amber)
  );

  await until(S(50));
  await play(
    ...fbox([
      ['1. target = reward', C.amber],
      ['          + discount × next', C.violet],
      ['2. error  = target − old', C.pink]
    ], C.pink),
    ...say('2. ERROR = TARGET − OLD', C.pink)
  );

  await until(S(51));
  await play(
    ...fbox([
      ['1. target = reward', C.amber],
      ['          + discount × next', C.violet],
      ['2. error  = target − old', C.pink],
      ['3. new    = old', C.green],
      ['          + learning rate × error', C.green]
    ], C.green),
    ...say('3. NEW = OLD + LEARNING RATE × ERROR', C.green)
  );

  // --- 52-54: What it is for, trap, recap ---
  await until(S(52));
  await play(
    ...moveCart('C', 0.65),
    new M.LaggedStart([valMobs.A, valMobs.B, valMobs.C].map(v => new M.Indicate(v, { color: C.cyan })), { lagRatio: 0.16, runTime: 1.4 }),
    ...say('LEARN FROM EXPERIENCE, NO MAP NEEDED', C.cyan)
  );

  await until(S(53));
  await play(
    ...highlightCell('B', C.pink),
    ...setVal('B', '7.6', C.pink),
    ...fbox([['Trap: learning rate stays large', C.pink], 'estimates keep bouncing', ['B: 6 → 7.6 → 5.1 → 6.9', C.pink]], C.pink),
    ...say('LARGE LEARNING RATE: VALUES BOUNCE', C.pink)
  );
  await play(...setVal('B', '5.1', C.pink));
  await play(...setVal('B', '6.9', C.pink));

  await until(S(54));
  await play(
    ...clearHighlight(),
    ...setVal('B', '6', C.cyan, true),
    ...moveCart('A', 0.6),
    ...fbox([
      ['target = reward + discount × next', C.amber],
      ['error  = target − old', C.pink],
      ['new    = old + learning rate × error', C.green]
    ], C.green),
    ...say('TD = REWARD + NEXT ESTIMATE', C.green)
  );
}
