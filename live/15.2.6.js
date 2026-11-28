// 15.2.6 Value iteration: finding the best moves.
// Beat i = sentence i (0-based, 54 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 3.95, 0] : [0, 1.98, 0];
  const GX = P ? -1.3 : -4.0, GY = P ? 0.75 : -0.55;
  const CS = P ? 2.0 : 1.9, GAP = P ? 0.14 : 0.16, STEP = CS + GAP;
  const COPY_X = P ? 2.55 : -0.35, COPY_Y = GY;
  const CCS = P ? 1.12 : 1.08, CGAP = 0.1, CSTEP = CCS + CGAP;
  const BOXP = P ? [0, -3.75, 0] : [3.95, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const OFF = { A: [-0.5, 0.5], B: [0.5, 0.5], C: [-0.5, -0.5], D: [0.5, -0.5] };
  const CELLS = ['A', 'B', 'C', 'D'];
  const cellPos = k => [GX + OFF[k][0] * STEP, GY + OFF[k][1] * STEP, 0];
  const copyPos = k => [COPY_X + OFF[k][0] * CSTEP, COPY_Y + OFF[k][1] * CSTEP, 0];

  // Vector arrow built from three Lines (clean tip, exact thickness, safe with FadeIn/FadeOut)
  function makeArrow(a, b, color, sw = 3, op = 0.85, tip = 0.16, z = 0.02) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const pa = [a[0], a[1], z], pb = [b[0], b[1], z];
    const bx = b[0] - ux * tip, by = b[1] - uy * tip;
    const l1 = new M.Line({ start: pa, end: pb, color, strokeWidth: sw });
    const l2 = new M.Line({ start: [bx + px * tip * 0.62, by + py * tip * 0.62, z], end: pb, color, strokeWidth: sw });
    const l3 = new M.Line({ start: [bx - px * tip * 0.62, by - py * tip * 0.62, z], end: pb, color, strokeWidth: sw });
    [l1, l2, l3].forEach(l => l.setStrokeOpacity(op));
    return new M.VGroup(l1, l2, l3);
  }

  // Exact endpoints for the 6 allowed moves on the fixed 2x2 grid
  const INSET = P ? 0.56 : 0.58, PAR = 0.16;
  const pA = cellPos('A'), pB = cellPos('B'), pC = cellPos('C'), pD = cellPos('D');
  const MOVES = {
    AB: [[pA[0] + INSET, pA[1] + PAR], [pB[0] - INSET, pB[1] + PAR]],
    BA: [[pB[0] - INSET, pB[1] - PAR], [pA[0] + INSET, pA[1] - PAR]],
    AC: [[pA[0] - PAR, pA[1] - INSET], [pC[0] - PAR, pC[1] + INSET]],
    CA: [[pC[0] + PAR, pC[1] + INSET], [pA[0] + PAR, pA[1] - INSET]],
    BD: [[pB[0], pB[1] - INSET], [pD[0], pD[1] + INSET]],
    CD: [[pC[0] + INSET, pC[1]], [pD[0] - INSET, pD[1]]],
  };
  const moveArrow = (k, color, sw = 4.5, op = 0.96) => makeArrow(MOVES[k][0], MOVES[k][1], color, sw, op, 0.18, 0.03);

  function cellBorder(k, color, sw = 4) {
    const r = new M.RoundedRectangle({ width: CS, height: CS, cornerRadius: 0.18, color, strokeWidth: sw });
    r.setFill(color, 0.12);
    r.moveTo([cellPos(k)[0], cellPos(k)[1], 0.01]);
    return r;
  }

  function copyBorder(k, color, sw = 3.5) {
    const r = new M.RoundedRectangle({ width: CCS, height: CCS, cornerRadius: 0.12, color, strokeWidth: sw });
    r.setFill(color, 0.15);
    r.moveTo([copyPos(k)[0], copyPos(k)[1], 0.01]);
    return r;
  }

  // Formula box: one at a time at BOXP
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.3;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null; return [new M.FadeOut(old)];
  }

  // Temporary highlight overlay manager (never re-wraps existing objects)
  let hiNow = [];
  function setHi(mobs = [], rt = 0.75) {
    const a = [];
    if (hiNow.length) a.push(...hiNow.map(m => new M.FadeOut(m, { runTime: rt })));
    if (mobs.length) a.push(...mobs.map(m => new M.FadeIn(m, { runTime: rt })));
    hiNow = mobs;
    return a;
  }

  // Main grid value labels & iteration subtitle
  const valMob = {};
  function setVal(k, txt, color = C.cyan, flash = false, rt = 0.7) {
    const t = T(String(txt), P ? 34 : 36, color, true, true);
    t.moveTo([cellPos(k)[0], cellPos(k)[1], 0.02]);
    const a = [new M.FadeIn(t, { runTime: rt })];
    if (valMob[k]) a.push(new M.FadeOut(valMob[k], { runTime: rt }));
    if (flash) a.push(new M.Flash(t, { color, flashRadius: 0.34, lineLength: 0.18, runTime: rt }));
    valMob[k] = t;
    return a;
  }

  let subNow = null;
  function setSub(txt, color = C.amber) {
    const a = [];
    if (subNow) a.push(new M.FadeOut(subNow, { runTime: 0.6 }));
    if (txt) {
      const t = T(txt, P ? 18 : 19, color, true, true);
      t.moveTo([GX, GY - STEP / 2 - CS / 2 - 0.32, 0]);
      a.push(new M.FadeIn(t, { runTime: 0.6 }));
      subNow = t;
    } else subNow = null;
    return a;
  }

  // Build fixed 2x2 warehouse grid (cell positions never change)
  const gridCells = {}, baseMobs = [];
  for (const k of CELLS) {
    const p = cellPos(k), isD = k === 'D';
    const box = new M.RoundedRectangle({ width: CS, height: CS, cornerRadius: 0.18, color: isD ? C.green : C.line, strokeWidth: isD ? 3 : 2 });
    box.setFill(isD ? C.green : C.card, isD ? 0.13 : 0.94);
    box.moveTo(p);
    const corner = T(k, P ? 22 : 21, isD ? C.green : C.ink, true, true);
    corner.moveTo([p[0] - CS * 0.34, p[1] + CS * 0.34, 0.01]);
    gridCells[k] = box;
    baseMobs.push(box, corner);
  }
  const dockTag = T('DOCK', P ? 17 : 16, C.green, true, true);
  dockTag.moveTo([pD[0], pD[1] - CS * 0.35, 0.01]);
  baseMobs.push(dockTag);

  // White delivery cart icon in top-right of cell A
  const cartX = pA[0] + CS * 0.25, cartY = pA[1] + CS * 0.30;
  const cartBody = new M.RoundedRectangle({ width: 0.38, height: 0.2, cornerRadius: 0.04, color: C.ink, strokeWidth: 2 });
  cartBody.setFill(C.ink, 0.95); cartBody.moveTo([cartX, cartY + 0.04, 0.02]);
  const wh1 = new M.Circle({ radius: 0.055, color: C.ink, strokeWidth: 1.5 }); wh1.setFill(C.bg, 1); wh1.moveTo([cartX - 0.11, cartY - 0.09, 0.02]);
  const wh2 = new M.Circle({ radius: 0.055, color: C.ink, strokeWidth: 1.5 }); wh2.setFill(C.bg, 1); wh2.moveTo([cartX + 0.11, cartY - 0.09, 0.02]);
  const cart = new M.VGroup(cartBody, wh1, wh2);
  baseMobs.push(cart);

  // Subtle base arrows for all 6 allowed moves + gold +10 reward labels
  const baseArrows = {};
  for (const k of Object.keys(MOVES)) {
    const isDock = k === 'BD' || k === 'CD';
    const arr = makeArrow(MOVES[k][0], MOVES[k][1], isDock ? C.amber : C.muted, isDock ? 3 : 2.3, isDock ? 0.65 : 0.42, 0.14, 0.02);
    baseArrows[k] = arr;
    baseMobs.push(arr);
  }
  const rewBD = T('+10', P ? 19 : 18, C.amber, true, true); rewBD.moveTo([pB[0] + 0.5, pB[1] - INSET + 0.08, 0.02]);
  const rewCD = T('+10', P ? 19 : 18, C.amber, true, true); rewCD.moveTo([pC[0] + INSET - 0.05, pC[1] - 0.36, 0.02]);
  baseMobs.push(rewBD, rewCD);

  // 0: warehouse, allowed moves and rewards
  await until(S(0));
  await play(new M.LaggedStart(baseMobs.map(m => new M.FadeIn(m)), { lagRatio: 0.05, runTime: 1.8 }),
    ...say('WAREHOUSE, MOVES, AND REWARDS'));

  // 1: cart does not yet know which moves are best
  const qMarks = ['A', 'B', 'C'].map(k => {
    const t = T('?', P ? 32 : 34, C.amber, true, true);
    t.moveTo([cellPos(k)[0], cellPos(k)[1], 0.02]);
    return t;
  });
  await until(S(1));
  await play(new M.LaggedStart(qMarks.map(q => new M.FadeIn(q)), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('WHICH MOVES ARE BEST?', C.amber));

  // 2: find the best moves from every cell before the cart even starts
  await until(S(2));
  await play(new M.LaggedStart(['A', 'B', 'C'].map(k => new M.Indicate(gridCells[k], { color: C.cyan })), { lagRatio: 0.2, runTime: 1.8 }),
    ...say('PLAN BEFORE THE CART STARTS'));

  // 3: place a zero inside each of the four cells
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...qMarks), { runTime: 0.5 }),
    ...setVal('A', '0', C.cyan, true), ...setVal('B', '0', C.cyan, true),
    ...setVal('C', '0', C.cyan, true), ...setVal('D', '0', C.green, true),
    ...say('START EVERY CELL AT 0'));

  // 4: first estimates of the best possible return from each cell
  await until(S(4));
  await play(new M.LaggedStart(CELLS.map(k => new M.Indicate(valMob[k], { color: C.cyan })), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('FIRST ESTIMATES OF BEST RETURN'));

  // 5: cell D stays at zero because no future rewards remain after delivery
  await until(S(5));
  await play(...setHi([cellBorder('D', C.green, 4)]), new M.Indicate(valMob.D, { color: C.green }),
    ...say('CELL D STAYS AT 0 (DELIVERY ENDS)', C.green));

  // 6: imagine standing at a road where you can choose between two paths
  const rx = BOXP[0], ry = BOXP[1], rW = P ? 6.4 : 4.9, rH = P ? 2.6 : 2.7;
  const roadCard = new M.RoundedRectangle({ width: rW, height: rH, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 });
  roadCard.setFill(C.card, 0.95); roadCard.moveTo(BOXP);
  const junc = [rx - rW * 0.3, ry, 0.01];
  const end1 = [rx + rW * 0.22, ry + 0.65, 0.01], end2 = [rx + rW * 0.22, ry - 0.65, 0.01];
  const jDot = new M.Dot({ point: junc, radius: 0.12, color: C.ink });
  const jLab = T('YOU', 15, C.ink, true, true); jLab.moveTo([junc[0], junc[1] - 0.34, 0.02]);
  const p1Line = makeArrow(junc, end1, C.muted, 3.5, 0.9, 0.16, 0.02);
  const p2Line = makeArrow(junc, end2, C.muted, 3.5, 0.9, 0.16, 0.02);
  const p1Lab = T('Path 1', 16, C.muted, true); p1Lab.moveTo([rx - 0.2, ry + 0.72, 0.02]);
  const p2Lab = T('Path 2', 16, C.muted, true); p2Lab.moveTo([rx - 0.2, ry - 0.72, 0.02]);
  const roadMobs = [roadCard, p1Line, p2Line, jDot, jLab, p1Lab, p2Lab];
  await until(S(6));
  await play(...setHi([]), ...roadMobs.map(m => new M.FadeIn(m, { runTime: 0.9 })),
    ...say('CHOOSE BETWEEN TWO PATHS', C.amber));

  // 7: if you know what each path offers, choose the better one
  const offer1 = T('+2', 19, C.muted, true, true); offer1.moveTo([end1[0] + 0.45, end1[1], 0.02]);
  const offer2 = T('+10', 21, C.amber, true, true); offer2.moveTo([end2[0] + 0.5, end2[1], 0.02]);
  const bestRoad = makeArrow(junc, end2, C.green, 5, 0.98, 0.18, 0.03);
  const pickLab = T('BETTER', 15, C.green, true, true); pickLab.moveTo([rx + 0.15, ry - 0.22, 0.02]);
  roadMobs.push(offer1, offer2, bestRoad, pickLab);
  await until(S(7));
  await play(new M.FadeIn(offer1), new M.FadeIn(offer2), new M.FadeIn(bestRoad), new M.FadeIn(pickLab),
    ...say('PICK THE BETTER PATH', C.green));

  // 8: our cart compares its possible moves in the same way
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(...roadMobs), { runTime: 0.7 }),
    ...setHi([cellBorder('A', C.amber), moveArrow('AB', C.amber), moveArrow('AC', C.amber)]),
    ...say('COMPARE POSSIBLE MOVES', C.amber));

  // 9: reward from each move, plus half the estimated value of the next cell
  await until(S(9));
  await play(...fbox([['Each move’s return:', C.ink], ['reward', C.amber], ['+ 0.5 × next cell value', C.violet]], C.violet),
    ...say('REWARD + HALF OF NEXT VALUE', C.violet));

  // 10: instead of the mean, keep the largest one
  await until(S(10));
  await play(...fbox([['Not the mean of moves', C.muted], ['Keep the LARGEST return', C.amber]], C.amber),
    ...say('KEEP THE LARGEST RETURN', C.amber));

  // 11: repeat until the cell values stop changing
  await until(S(11));
  await play(...setHi([]),
    new M.LaggedStart(['A', 'B', 'C'].map(k => new M.Indicate(gridCells[k], { color: C.green })), { lagRatio: 0.18, runTime: 1.6 }),
    ...fbox([['Repeat on every cell', C.ink], ['until values stop changing', C.green]], C.green),
    ...say('REPEAT UNTIL VALUES SETTLE', C.green));

  // 12: each round of calculations is called an iteration
  await until(S(12));
  await play(...fbox([['1 full round of updates', C.ink], ['= 1 iteration', C.cyan]], C.cyan),
    ...say('EACH ROUND = 1 ITERATION', C.cyan));

  // 13: this method is called value iteration
  await until(S(13));
  await play(...fbox([['VALUE ITERATION', C.green], ['compare moves → keep largest', C.ink], ['repeat every round', C.muted]], C.green),
    ...say('VALUE ITERATION', C.green));

  // 14: begin first iteration
  await until(S(14));
  await play(...clearBox(), ...setSub('ITERATION 1', C.amber), ...say('ITERATION 1', C.amber));

  // 15: keep a copy of the old values beside the grid
  const copyMobs = [];
  const copyHead = T('OLD COPY', P ? 19 : 19, C.violet, true, true);
  copyHead.moveTo([COPY_X, COPY_Y + CSTEP / 2 + CCS / 2 + 0.3, 0]);
  const copyNote = T('stays fixed', P ? 17 : 16, C.ink, true);
  copyNote.moveTo([COPY_X, COPY_Y - CSTEP / 2 - CCS / 2 - 0.28, 0]);
  copyMobs.push(copyHead, copyNote);
  for (const k of CELLS) {
    const p = copyPos(k), isD = k === 'D';
    const b = new M.RoundedRectangle({ width: CCS, height: CCS, cornerRadius: 0.12, color: isD ? C.green : C.violet, strokeWidth: 2 });
    b.setFill(C.card, 0.92); b.moveTo(p);
    const l = T(k, 16, C.ink, true, true); l.moveTo([p[0] - CCS * 0.34, p[1] + CCS * 0.32, 0.01]);
    copyMobs.push(b, l);
  }
  const copyValMob = {};
  function setCopyVal(k, txt, color = C.violet, flash = false, rt = 0.65) {
    const t = T(String(txt), P ? 22 : 24, color, true, true);
    t.moveTo([copyPos(k)[0], copyPos(k)[1], 0.02]);
    const a = [new M.FadeIn(t, { runTime: rt })];
    if (copyValMob[k]) a.push(new M.FadeOut(copyValMob[k], { runTime: rt }));
    if (flash) a.push(new M.Flash(t, { color, flashRadius: 0.22, lineLength: 0.12, runTime: rt }));
    copyValMob[k] = t;
    return a;
  }
  await until(S(15));
  await play(...copyMobs.map(m => new M.FadeIn(m, { runTime: 0.9 })),
    ...setCopyVal('A', '0', C.violet), ...setCopyVal('B', '0', C.violet),
    ...setCopyVal('C', '0', C.violet), ...setCopyVal('D', '0', C.green),
    ...say('COPY OF OLD VALUES', C.violet));

  // 16: every calculation in this round uses that same copy
  const copyFrame = new M.RoundedRectangle({ width: CSTEP + CCS + 0.24, height: CSTEP + CCS + 0.24, cornerRadius: 0.18, color: C.violet, strokeWidth: 3 });
  copyFrame.moveTo([COPY_X, COPY_Y, 0.01]);
  await until(S(16));
  await play(...setHi([copyFrame]), ...say('EVERY STEP READS THE OLD COPY', C.violet));

  // 17: Iteration 1, cell A right -> B (reward 0, old B = 0)
  await until(S(17));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AB', C.amber), copyBorder('B', C.violet)]),
    ...fbox([['Cell A: move right → B', C.amber], ['reward = 0', C.amber], ['old B  = 0', C.violet]], C.amber),
    ...say('CELL A: MOVE RIGHT → B', C.amber));

  // 18: 0 + 0.5 * 0 = 0
  await until(S(18));
  await play(...fbox([['Cell A: right → B', C.amber], ['0 + 0.5 × 0 = 0', C.cyan]], C.cyan),
    ...say('0 + 0.5 × 0 = 0', C.cyan));

  // 19: moving down also gives 0, so new value of A is 0
  await until(S(19));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AC', C.amber), copyBorder('C', C.violet)]),
    ...setVal('A', '0', C.cyan, true),
    ...fbox([['Cell A:', C.ink], ['right → B: 0 + 0.5×0 = 0', C.muted], ['down  → C: 0 + 0.5×0 = 0', C.muted], ['new A = larger of 0, 0 = 0', C.cyan]], C.cyan),
    ...say('NEW A = 0', C.cyan));

  // 20: Cell B: left gives 0, down gives 10
  await until(S(20));
  await play(...setHi([cellBorder('B', C.cyan), moveArrow('BA', C.muted, 4, 0.85), moveArrow('BD', C.amber, 5, 0.98), copyBorder('A', C.violet), copyBorder('D', C.green)]),
    ...fbox([['Cell B:', C.ink], ['left → A: 0 + 0.5×0 = 0', C.muted], ['down → D: 10 + 0.5×0 = 10', C.amber]], C.amber),
    ...say('CELL B: LEFT 0 vs DOWN 10', C.amber));

  // 21: keep the larger number, 10 (gap 2.03s)
  await until(S(21));
  await play(...setVal('B', '10', C.cyan, true, 0.7),
    ...fbox([['Cell B:', C.ink], ['left → A: 0', C.muted], ['down → D: 10', C.amber], ['new B = larger of 0, 10 = 10', C.cyan]], C.cyan),
    ...say('NEW B = 10', C.cyan));

  // 22: Cell C: up gives 0, right gives 10
  await until(S(22));
  await play(...setHi([cellBorder('C', C.cyan), moveArrow('CA', C.muted, 4, 0.85), moveArrow('CD', C.amber, 5, 0.98), copyBorder('A', C.violet), copyBorder('D', C.green)]),
    ...fbox([['Cell C:', C.ink], ['up    → A: 0 + 0.5×0 = 0', C.muted], ['right → D: 10 + 0.5×0 = 10', C.amber]], C.amber),
    ...say('CELL C: UP 0 vs RIGHT 10', C.amber));

  // 23: keep 10 again (short gap 1.28s)
  await until(S(23));
  await play(...setVal('C', '10', C.cyan, true, 0.6),
    ...fbox([['Cell C:', C.ink], ['up    → A: 0', C.muted], ['right → D: 10', C.amber], ['new C = larger of 0, 10 = 10', C.cyan]], C.cyan),
    ...say('NEW C = 10', C.cyan));

  // 24: end of iteration 1 -> 0, 10, 10, 0
  await until(S(24));
  await play(...setHi([]),
    new M.LaggedStart(CELLS.map(k => new M.Indicate(valMob[k], { color: C.cyan })), { lagRatio: 0.16, runTime: 1.8 }),
    ...fbox([['End of Iteration 1', C.cyan], ['A = 0,   B = 10', C.cyan], ['C = 10,  D = 0', C.cyan]], C.cyan),
    ...say('ITERATION 1:  0, 10, 10, 0', C.cyan));

  // 25: cells beside the dock now show the reward they can reach
  await until(S(25));
  await play(...setHi([cellBorder('B', C.amber), cellBorder('C', C.amber), moveArrow('BD', C.amber, 5), moveArrow('CD', C.amber, 5)]),
    ...say('VALUE SPREADS FROM THE DOCK', C.amber));

  // 26: copy new values and begin iteration 2
  await until(S(26));
  await play(...setHi([]), ...setSub('ITERATION 2', C.amber),
    ...setCopyVal('B', '10', C.violet, true), ...setCopyVal('C', '10', C.violet, true),
    ...clearBox(), ...say('ITERATION 2: COPY UPDATED', C.amber));

  // 27: Cell A right -> B (reward 0)
  await until(S(27));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AB', C.amber, 5)]),
    ...fbox([['Cell A: move right → B', C.amber], ['reward = 0', C.amber]], C.amber),
    ...say('CELL A: MOVE RIGHT → B', C.amber));

  // 28: Cell B now has a value of 10 (gap 2.10s)
  await until(S(28));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AB', C.amber, 5), copyBorder('B', C.violet)]),
    ...fbox([['Cell A: right → B', C.amber], ['reward = 0', C.amber], ['old B  = 10', C.violet]], C.violet),
    ...say('OLD B = 10', C.violet));

  // 29: 0 + 0.5 * 10 = 5 (gap 2.56s)
  await until(S(29));
  await play(...fbox([['Cell A: right → B', C.amber], ['0 + 0.5 × 10 = 5', C.cyan]], C.cyan),
    ...say('0 + 0.5 × 10 = 5', C.cyan));

  // 30: moving down to C also gives 5
  await until(S(30));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AB', C.cyan, 4.5), moveArrow('AC', C.amber, 5), copyBorder('C', C.violet)]),
    ...fbox([['Cell A:', C.ink], ['right → B: 0 + 0.5×10 = 5', C.cyan], ['down  → C: 0 + 0.5×10 = 5', C.cyan]], C.cyan),
    ...say('DOWN → C ALSO GIVES 5', C.cyan));

  // 31: both moves equally good, new value of A is 5
  await until(S(31));
  await play(...setVal('A', '5', C.cyan, true),
    ...fbox([['Cell A:', C.ink], ['right → B: 5', C.cyan], ['down  → C: 5', C.cyan], ['new A = larger of 5, 5 = 5', C.cyan]], C.cyan),
    ...say('NEW A = 5', C.cyan));

  // 32: in B and C, reaching the dock still gives 10
  await until(S(32));
  await play(...setHi([cellBorder('B', C.cyan), cellBorder('C', C.cyan), moveArrow('BD', C.amber, 5), moveArrow('CD', C.amber, 5)]),
    ...fbox([['Cells B & C:', C.ink], ['to dock D: 10 + 0.5×0 = 10', C.amber]], C.amber),
    ...say('B & C TO DOCK: STILL 10', C.amber));

  // 33: returning to A gives 0 because old copy A is still 0
  await until(S(33));
  await play(...setHi([cellBorder('B', C.cyan), cellBorder('C', C.cyan), moveArrow('BA', C.violet, 4.5), moveArrow('CA', C.violet, 4.5), copyBorder('A', C.violet)]),
    ...fbox([['Cells B & C:', C.ink], ['to dock D: 10', C.amber], ['back to A: 0 + 0.5×0 = 0', C.violet], ['(old copy A is still 0)', C.muted]], C.violet),
    ...say('OLD COPY A IS STILL 0', C.violet));

  // 34: both cells keep 10 (gap 2.24s)
  await until(S(34));
  await play(new M.Indicate(valMob.B, { color: C.cyan, runTime: 0.75 }), new M.Indicate(valMob.C, { color: C.cyan, runTime: 0.75 }),
    ...fbox([['Cells B & C:', C.ink], ['larger of 10, 0 = 10', C.cyan]], C.cyan),
    ...say('B AND C KEEP 10', C.cyan));

  // 35: iteration 2 ends with 5, 10, 10, 0
  await until(S(35));
  await play(...setHi([]),
    new M.LaggedStart(CELLS.map(k => new M.Indicate(valMob[k], { color: C.cyan })), { lagRatio: 0.16, runTime: 1.8 }),
    ...fbox([['End of Iteration 2', C.cyan], ['A = 5,   B = 10', C.cyan], ['C = 10,  D = 0', C.cyan]], C.cyan),
    ...say('ITERATION 2:  5, 10, 10, 0', C.cyan));

  // 36: copy these values and begin iteration 3
  await until(S(36));
  await play(...setSub('ITERATION 3', C.amber), ...setCopyVal('A', '5', C.violet, true),
    ...clearBox(), ...say('ITERATION 3: COPY UPDATED', C.amber));

  // 37: from A, both moves still give 5 (gap 2.72s)
  await until(S(37));
  await play(...setHi([cellBorder('A', C.cyan), moveArrow('AB', C.cyan, 4.5), moveArrow('AC', C.cyan, 4.5)]),
    ...fbox([['Cell A:', C.ink], ['right → B: 0 + 0.5×10 = 5', C.cyan], ['down  → C: 0 + 0.5×10 = 5', C.cyan], ['new A = 5 (unchanged)', C.green]], C.green),
    ...say('CELL A: STILL 5', C.cyan));

  // 38: from B and C, returning to A gives half of 5
  await until(S(38));
  await play(...setHi([cellBorder('B', C.cyan), cellBorder('C', C.cyan), moveArrow('BA', C.violet, 4.5), moveArrow('CA', C.violet, 4.5), copyBorder('A', C.violet)]),
    ...fbox([['Cells B & C:', C.ink], ['back to A: 0 + 0.5 × 5', C.violet]], C.violet),
    ...say('BACK TO A: HALF OF 5', C.violet));

  // 39: half of 5 is 2.5 (gap 2.61s)
  await until(S(39));
  await play(...fbox([['Cells B & C:', C.ink], ['back to A: 0 + 0.5×5 = 2.5', C.violet]], C.violet),
    ...say('0.5 × 5 = 2.5', C.violet));

  // 40: reaching the dock still gives 10, better than 2.5
  await until(S(40));
  await play(...setHi([cellBorder('B', C.green), cellBorder('C', C.green), moveArrow('BD', C.amber, 5), moveArrow('CD', C.amber, 5)]),
    ...fbox([['Cells B & C:', C.ink], ['to dock D: 10', C.amber], ['back to A: 2.5', C.muted], ['larger of 10, 2.5 = 10', C.green]], C.green),
    ...say('10 > 2.5: KEEP 10', C.green));

  // 41: iteration 3 ends with 5, 10, 10, 0 again
  await until(S(41));
  await play(...setHi([]),
    new M.LaggedStart(CELLS.map(k => new M.Indicate(valMob[k], { color: C.green })), { lagRatio: 0.16, runTime: 1.8 }),
    ...fbox([['End of Iteration 3', C.green], ['A = 5,   B = 10', C.green], ['C = 10,  D = 0', C.green], ['no cell changed!', C.green]], C.green),
    ...say('ITERATION 3:  5, 10, 10, 0 (SETTLED)', C.green));

  // 42: draw a line showing largest change in any cell after each iteration
  const cW = P ? 6.8 : 5.1, cH = P ? 3.1 : 3.2;
  const chartCard = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.18, color: C.line, strokeWidth: 2 });
  chartCard.setFill(C.card, 0.95); chartCard.moveTo(BOXP);
  const cTitle = T('Largest change per iteration', P ? 19 : 18, C.ink, true, true);
  cTitle.moveTo([BOXP[0], BOXP[1] + cH / 2 - 0.34, 0.01]);
  const axL = BOXP[0] - cW / 2 + 0.85, axR = BOXP[0] + cW / 2 - 0.4;
  const axB = BOXP[1] - cH / 2 + 0.62, axT = BOXP[1] + cH / 2 - 0.72;
  const cx = iter => axL + 0.25 + (iter - 1) / 4 * (axR - axL - 0.5);
  const cy = val => axB + (val / 10) * (axT - axB);
  const xAxis = new M.Line({ start: [axL, axB, 0.01], end: [axR, axB, 0.01], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: [axL, axB, 0.01], end: [axL, axT, 0.01], color: C.muted, strokeWidth: 2 });
  const chartMobs = [chartCard, cTitle, xAxis, yAxis];
  for (const v of [0, 5, 10]) {
    const gl = new M.Line({ start: [axL, cy(v), 0.005], end: [axR, cy(v), 0.005], color: C.line, strokeWidth: 1 });
    gl.setStrokeOpacity(0.6);
    const yl = T(String(v), 16, C.muted, true); yl.moveTo([axL - 0.32, cy(v), 0.01]);
    chartMobs.push(gl, yl);
  }
  for (let it = 1; it <= 5; it++) {
    const tk = new M.Line({ start: [cx(it), axB - 0.06, 0.01], end: [cx(it), axB + 0.06, 0.01], color: C.muted, strokeWidth: 2 });
    const xl = T(String(it), 16, C.muted, true); xl.moveTo([cx(it), axB - 0.28, 0.01]);
    chartMobs.push(tk, xl);
  }
  await until(S(42));
  await play(...clearBox(), ...chartMobs.map(m => new M.FadeIn(m, { runTime: 0.9 })),
    ...say('LARGEST CHANGE PER ITERATION', C.amber));

  // 43: largest change falls from 10, to 5, to 0
  const pt1 = [cx(1), cy(10), 0.02], pt2 = [cx(2), cy(5), 0.02], pt3 = [cx(3), cy(0), 0.02];
  const d1 = new M.Dot({ point: pt1, radius: 0.1, color: C.amber });
  const d2 = new M.Dot({ point: pt2, radius: 0.1, color: C.amber });
  const d3 = new M.Dot({ point: pt3, radius: 0.11, color: C.green });
  const s12 = new M.Line({ start: pt1, end: pt2, color: C.amber, strokeWidth: 3.5 });
  const s23 = new M.Line({ start: pt2, end: pt3, color: C.amber, strokeWidth: 3.5 });
  const lb1 = T('10', 18, C.amber, true, true); lb1.moveTo([pt1[0] + 0.32, pt1[1] + 0.12, 0.02]);
  const lb2 = T('5', 18, C.amber, true, true); lb2.moveTo([pt2[0] + 0.26, pt2[1] + 0.2, 0.02]);
  const lb3 = T('0', 18, C.green, true, true); lb3.moveTo([pt3[0], pt3[1] + 0.28, 0.02]);
  chartMobs.push(d1, lb1, s12, d2, lb2, s23, d3, lb3);
  await until(S(43));
  await play(new M.LaggedStart([
    new M.FadeIn(d1), new M.FadeIn(lb1), new M.Create(s12),
    new M.FadeIn(d2), new M.FadeIn(lb2), new M.Create(s23),
    new M.FadeIn(d3), new M.FadeIn(lb3), new M.Flash(d3, { color: C.green, flashRadius: 0.2, lineLength: 0.12 }),
  ], { lagRatio: 0.22, runTime: 2.4 }), ...say('CHANGE: 10 → 5 → 0', C.amber));

  // 44: run more iterations quickly and see values remain unchanged
  const pt4 = [cx(4), cy(0), 0.02], pt5 = [cx(5), cy(0), 0.02];
  const s34 = new M.Line({ start: pt3, end: pt4, color: C.green, strokeWidth: 3.5 });
  const d4 = new M.Dot({ point: pt4, radius: 0.1, color: C.green });
  const s45 = new M.Line({ start: pt4, end: pt5, color: C.green, strokeWidth: 3.5 });
  const d5 = new M.Dot({ point: pt5, radius: 0.1, color: C.green });
  const lb5 = T('0', 18, C.green, true, true); lb5.moveTo([pt5[0], pt5[1] + 0.28, 0.02]);
  chartMobs.push(s34, d4, s45, d5, lb5);
  await until(S(44));
  await play(...setSub('ITERATION 4', C.green), new M.Create(s34, { runTime: 0.6 }), new M.FadeIn(d4, { runTime: 0.6 }),
    ...say('MORE ITERATIONS: ZERO CHANGE', C.green));
  await until(S(44) + 1.6);
  await play(...setSub('ITERATION 5', C.green), new M.Create(s45, { runTime: 0.6 }), new M.FadeIn(d5, { runTime: 0.6 }), new M.FadeIn(lb5, { runTime: 0.6 }),
    new M.LaggedStart(CELLS.map(k => new M.Indicate(valMob[k], { color: C.green })), { lagRatio: 0.1, runTime: 0.9 }));

  // 45: write our repeated calculation as a short formula
  await until(S(45));
  await play(new M.FadeOut(new M.VGroup(...chartMobs, ...copyMobs, ...Object.values(copyValMob)), { runTime: 0.8 }),
    ...setSub(''), ...fbox([['Value iteration formula', C.cyan]], C.cyan),
    ...say('THE SHORT FORMULA', C.cyan));

  // 46: new state value = largest of estimated returns from all available moves
  await until(S(46));
  await play(...fbox([
    ['new value(cell) =', C.cyan],
    ['  largest return', C.amber],
    ['  across all allowed moves', C.ink],
  ], C.amber), ...say('KEEP THE LARGEST RETURN', C.amber));

  // 47: each estimated return = reward + discount factor * old next cell value
  await until(S(47));
  await play(...fbox([
    ['new value(cell) = largest of:', C.cyan],
    ['  reward + 0.5 × old value(next)', C.amber],
    ['  reward: immediate points', C.muted],
    ['  0.5:    discount factor', C.violet],
  ], C.violet), ...say('REWARD + DISCOUNT × OLD NEXT VALUE', C.violet));

  // 48: find the best possible returns and the moves that achieve them
  await until(S(48));
  await play(new M.LaggedStart(['A', 'B', 'C'].map(k => new M.Indicate(valMob[k], { color: C.green })), { lagRatio: 0.18, runTime: 1.8 }),
    ...say('BEST RETURNS AND BEST MOVES', C.green));

  // 49: from cell A, either move is best (gap 2.58s)
  const bestAB = moveArrow('AB', C.green, 5.5, 0.98);
  const bestAC = moveArrow('AC', C.green, 5.5, 0.98);
  await until(S(49));
  await play(new M.FadeIn(bestAB, { runTime: 0.8 }), new M.FadeIn(bestAC, { runTime: 0.8 }),
    ...setHi([cellBorder('A', C.green)]),
    ...fbox([['Best moves:', C.green], ['A → right or down (5)', C.green]], C.green),
    ...say('CELL A: RIGHT OR DOWN', C.green));

  // 50: from cell B, best move is down; from cell C, it is right
  const bestBD = moveArrow('BD', C.green, 5.5, 0.98);
  const bestCD = moveArrow('CD', C.green, 5.5, 0.98);
  await until(S(50));
  await play(new M.FadeIn(bestBD, { runTime: 0.8 }), new M.FadeIn(bestCD, { runTime: 0.8 }),
    ...setHi([cellBorder('B', C.green), cellBorder('C', C.green)]),
    ...fbox([
      ['Best moves:', C.green],
      ['A → right or down (5)', C.cyan],
      ['B → down to D     (10)', C.green],
      ['C → right to D    (10)', C.green],
    ], C.green),
    ...say('B → DOWN,   C → RIGHT', C.green));

  // 51: be careful: value iteration needs to know possible results and rewards of each move
  const mapBorder = new M.RoundedRectangle({ width: STEP + CS + 0.24, height: STEP + CS + 0.24, cornerRadius: 0.22, color: C.pink, strokeWidth: 3.5 });
  mapBorder.moveTo([GX, GY, 0.01]);
  await until(S(51));
  await play(...setHi([mapBorder]),
    ...fbox([
      ['Be careful:', C.pink],
      ['Needs the full warehouse map:', C.ink],
      ['  • where every move goes', C.amber],
      ['  • every move’s reward', C.amber],
    ], C.pink),
    ...say('NEEDS FULL MAP & REWARDS', C.pink));

  // 52: a cart in an unknown warehouse may need to learn through experience instead
  const fogMobs = [];
  for (const k of ['B', 'C', 'D']) {
    const p = cellPos(k);
    const f = new M.RoundedRectangle({ width: CS, height: CS, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
    f.setFill(C.bg, 0.9); f.moveTo([p[0], p[1], 0.05]);
    const q = T('?', 38, C.violet, true, true); q.moveTo([p[0], p[1], 0.06]);
    fogMobs.push(f, q);
  }
  await until(S(52));
  await play(...setHi([]), ...fogMobs.map(m => new M.FadeIn(m, { runTime: 0.9 })),
    ...fbox([
      ['Unknown warehouse?', C.violet],
      ['Map and rewards are hidden.', C.muted],
      ['Learn from experience instead.', C.violet],
    ], C.violet),
    ...say('UNKNOWN MAP → LEARN BY EXPERIENCE', C.violet));

  // 53: remember: value iteration repeatedly compares possible moves until we find the best values and choices
  await until(S(53));
  await play(new M.FadeOut(new M.VGroup(...fogMobs), { runTime: 0.8 }),
    new M.LaggedStart([bestAB, bestAC, bestBD, bestCD].map(m => new M.Indicate(m, { color: C.amber })), { lagRatio: 0.14, runTime: 1.8 }),
    ...fbox([
      ['Value iteration recap:', C.green],
      ['1. Start every cell at 0', C.muted],
      ['2. Keep the largest return', C.amber],
      ['3. Repeat until change = 0', C.green],
    ], C.green),
    ...say('COMPARE MOVES UNTIL VALUES SETTLE', C.green));
}
