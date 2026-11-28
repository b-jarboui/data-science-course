// 17.3.6 Pooling: keep the biggest score in each patch.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;

  const TILE = [
    [4, 4, 4, 4],
    [4, 4, 1, 1],
    [4, 4, 1, 1],
    [4, 4, 4, 4],
  ];
  const SCORES = [
    [0, 0, 0],
    [0, 3, 0],
    [0, 3, 0],
    [0, 0, 0],
  ];

  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.4, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time; leading spaces indent.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.4 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.66, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.33, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function arrow(a, b, color = C.muted) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, sz = 0.15;
    const w1 = [b[0] - ux * sz - uy * sz * 0.6, b[1] - uy * sz + ux * sz * 0.6, 0];
    const w2 = [b[0] - ux * sz + uy * sz * 0.6, b[1] - uy * sz - ux * sz * 0.6, 0];
    return new M.VGroup(
      new M.Line({ start: a, end: b, color, strokeWidth: 3 }),
      new M.Line({ start: w1, end: b, color, strokeWidth: 3 }),
      new M.Line({ start: w2, end: b, color, strokeWidth: 3 })
    );
  }

  const fmtNum = v => (v < 0 ? '−' + Math.abs(v) : String(v));

  const cellPos = (gx, gy, rows, cols, st, r, c) => [
    gx + (c - (cols - 1) / 2) * st,
    gy + ((rows - 1) / 2 - r) * st,
    0,
  ];

  function outlineRect(gx, gy, rows, cols, st, r0, r1, c0, c1, color = C.amber, sw = 3.5) {
    const a = cellPos(gx, gy, rows, cols, st, r0, c0);
    const b = cellPos(gx, gy, rows, cols, st, r1, c1);
    const w = (c1 - c0 + 1) * st + 0.04;
    const h = (r1 - r0 + 1) * st + 0.04;
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: sw });
    box.moveTo([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]);
    return box;
  }

  function makeTileCell(val, pos, sz) {
    const bright = val === 4;
    const rect = new M.RoundedRectangle({
      width: sz, height: sz, cornerRadius: 0.08,
      color: bright ? C.cyan : C.pink, strokeWidth: bright ? 2 : 2.5,
    });
    rect.setFill(bright ? C.cyan : C.bg, bright ? 0.25 : 0.96);
    rect.moveTo(pos);
    const parts = [rect];
    if (false) {
      const d = sz * 0.34;
      const h1 = new M.Line({ start: [pos[0] - d, pos[1] - d, 0], end: [pos[0] + d, pos[1] + d, 0], color: C.pink, strokeWidth: 1.5 });
      const h2 = new M.Line({ start: [pos[0] - d, pos[1] + d, 0], end: [pos[0] + d, pos[1] - d, 0], color: C.pink, strokeWidth: 1.5 });
      h1.setStrokeOpacity(0.28);
      h2.setStrokeOpacity(0.28);
      parts.push(h1, h2);
    }
    const txt = T(String(val), P ? 22 : 24, bright ? C.ink : C.pink, true, true);
    txt.moveTo(pos);
    parts.push(txt);
    return new M.VGroup(...parts);
  }

  function makeScoreRect(pos, sz, val, empty = false) {
    const col = empty ? C.grid : (val > 0 ? C.amber : (val < 0 ? C.pink : C.grid));
    const fillCol = empty ? C.card : (val > 0 ? C.amber : (val < 0 ? C.pink : C.card));
    const fillOp = empty ? 0.6 : (val > 0 ? 0.22 : (val < 0 ? 0.18 : 0.92));
    const r = new M.RoundedRectangle({ width: sz, height: sz, cornerRadius: 0.08, color: col, strokeWidth: val !== 0 && !empty ? 2.5 : 1.8 });
    r.setFill(fillCol, fillOp);
    r.moveTo(pos);
    return r;
  }

  function makeScoreCell(val, pos, sz, fontSize = P ? 23 : 25) {
    const r = makeScoreRect(pos, sz, val, false);
    const col = val > 0 ? C.amber : (val < 0 ? C.pink : C.ink);
    const t = T(fmtNum(val), fontSize, col, true, true);
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  // =========================================================================
  // PHASE 1 (Beats 0-10): 4x4 Tile + 4x3 Edge-Score Grid
  // =========================================================================
  const ST1 = P ? 0.8 : 0.86, SZ1 = ST1 - 0.08;
  const TX1 = P ? -1.78 : -4.45, SX1 = P ? 1.98 : -0.35, GY1 = P ? -1.65 : -0.7;

  const tileCells = TILE.map((row, r) =>
    row.map((v, c) => makeTileCell(v, cellPos(TX1, GY1, 4, 4, ST1, r, c), SZ1))
  );
  const tileTitle = T('TILE (brightness)', P ? 15 : 16, C.cyan, true, true);
  tileTitle.moveTo([TX1, GY1 + 2 * ST1 + 0.3, 0]);

  const p1ScoreBoxes = SCORES.map((row, r) =>
    row.map((_, c) => makeScoreRect(cellPos(SX1, GY1, 4, 3, ST1, r, c), SZ1, 0, true))
  );
  const p1ScoreTitle = T('EDGE SCORES', P ? 15 : 16, C.amber, true, true);
  p1ScoreTitle.moveTo([SX1, GY1 + 2 * ST1 + 0.3, 0]);
  const p1Arrow = arrow([TX1 + 2 * ST1 + 0.14, GY1, 0], [SX1 - 1.5 * ST1 - 0.14, GY1, 0], C.muted);

  // Beat 0: show the 4x4 tile
  await until(S(0));
  await play(
    new M.FadeIn(tileTitle),
    new M.LaggedStart(tileCells.flat().map(g => new M.FadeIn(g)), { lagRatio: 0.05, runTime: 1.5 }),
    ...say('TILE: BRIGHT 4, DARK CHIP 1', C.cyan)
  );

  // Beat 1: outline first two squares in row 2 (r=1, c=0..1)
  const winBox = outlineRect(TX1, GY1, 4, 4, ST1, 1, 1, 0, 1, C.amber, 3.5);
  await until(S(1));
  await play(new M.Create(winBox, { runTime: 0.8 }), ...say('ROW 2: TWO BRIGHT SQUARES', C.amber));

  // Beat 2: both squares read 4
  await until(S(2));
  await play(
    new M.Indicate(tileCells[1][0], { color: C.amber, runTime: 0.8 }),
    new M.Indicate(tileCells[1][1], { color: C.amber, runTime: 0.8 }),
    ...fbox(['left square  = 4', 'right square = 4'])
  );

  // Beat 3: subtract right from left
  await until(S(3));
  await play(...say('LEFT − RIGHT', C.cyan), ...fbox(['left − right', ['4 − 4', C.amber]]));

  // Beat 4: 4 - 4 = 0 placed in score grid (r=1, c=0)
  const p1ZeroPos = cellPos(SX1, GY1, 4, 3, ST1, 1, 0);
  const p1ZeroTxt = T('0', P ? 22 : 24, C.cyan, true, true);
  p1ZeroTxt.moveTo(p1ZeroPos);
  await until(S(4));
  await play(
    new M.FadeIn(p1ScoreTitle, { runTime: 0.7 }),
    new M.FadeIn(p1Arrow, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...p1ScoreBoxes.flat()), { runTime: 0.7 }),
    new M.Transform(p1ScoreBoxes[1][0], makeScoreRect(p1ZeroPos, SZ1, 0, false), { runTime: 0.7 }),
    new M.FadeIn(p1ZeroTxt, { runTime: 0.7 }),
    new M.Flash(p1ZeroTxt, { color: C.cyan, runTime: 0.7 }),
    ...fbox(['left − right', ['4 − 4 = 0', C.cyan]])
  );

  // Beat 5: slide outline to row 2, cols 2-3 (r=1, c=1..2)
  await until(S(5));
  await play(
    new M.Transform(winBox, outlineRect(TX1, GY1, 4, 4, ST1, 1, 1, 1, 2, C.amber, 3.5), { runTime: 0.9 }),
    ...say('NEXT TO THE CHIP', C.amber)
  );

  // Beat 6: bright square 4 and dark square 1
  await until(S(6));
  await play(
    new M.Indicate(tileCells[1][1], { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(tileCells[1][2], { color: C.pink, runTime: 0.9 }),
    ...fbox(['left (bright) = 4', ['right (chip)  = 1', C.pink]])
  );

  // Beat 7: 4 - 1 = 3 placed in score grid (r=1, c=1)
  const p1ThreePos = cellPos(SX1, GY1, 4, 3, ST1, 1, 1);
  const p1ThreeTxt = T('3', P ? 22 : 24, C.amber, true, true);
  p1ThreeTxt.moveTo(p1ThreePos);
  await until(S(7));
  await play(
    new M.Transform(p1ScoreBoxes[1][1], makeScoreRect(p1ThreePos, SZ1, 3, false), { runTime: 0.8 }),
    new M.FadeIn(p1ThreeTxt, { runTime: 0.8 }),
    new M.Flash(p1ThreeTxt, { color: C.amber, runTime: 0.8 }),
    ...fbox(['left − right', ['4 − 1 = 3', C.amber]], C.amber)
  );

  // Beat 8: edge score name
  await until(S(8));
  await play(
    new M.Indicate(p1ZeroTxt, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(p1ThreeTxt, { color: C.amber, runTime: 0.8 }),
    ...say('EDGE SCORE = LEFT − RIGHT', C.cyan)
  );

  // Beat 9: zero means brightness stays same
  await until(S(9));
  await play(
    new M.Indicate(p1ZeroTxt, { color: C.cyan, runTime: 0.9 }),
    ...say('0 = BRIGHTNESS STAYS THE SAME', C.cyan),
    ...fbox(['score 0', ['4 → 4  (no drop)', C.cyan]])
  );

  // Beat 10: three means brightness drops by 3
  await until(S(10));
  await play(
    new M.Indicate(p1ThreeTxt, { color: C.amber, runTime: 0.9 }),
    ...say('3 = BRIGHTNESS DROPS BY 3', C.amber),
    ...fbox(['score 3', ['4 → 1  (drops by 3)', C.amber]], C.amber)
  );

  // =========================================================================
  // PHASE 2 (Beats 11-32): Full Score Grid + Patches + Max Pooling Output
  // =========================================================================
  const ST2 = P ? 0.9 : 0.92, SZ2 = ST2 - 0.08;
  const SX2 = P ? -1.65 : -4.2, SY2 = P ? -1.75 : -0.78;
  const OX2 = P ? 2.15 : -0.35, OS2 = P ? 1.02 : 1.04;
  const OUT1P = [OX2, SY2 + ST2, 0];
  const OUT2P = [OX2, SY2 - ST2, 0];

  const scoreCells = SCORES.map((row, r) =>
    row.map((v, c) => makeScoreCell(v, cellPos(SX2, SY2, 4, 3, ST2, r, c), SZ2))
  );
  const gridTitle = T('EDGE SCORE GRID', P ? 15 : 16, C.cyan, true, true);
  gridTitle.moveTo([SX2, SY2 + 2 * ST2 + 0.3, 0]);
  const patchBox = outlineRect(SX2, SY2, 4, 3, ST2, 0, 1, 0, 1, C.amber, 4);

  // Beat 11: reveal full score grid and outline upper-left 2x2 patch
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(tileTitle, p1ScoreTitle, p1Arrow, winBox, p1ZeroTxt, p1ThreeTxt, ...tileCells.flat(), ...p1ScoreBoxes.flat()), { runTime: 0.55 }),
    ...say('UPPER-LEFT 2 × 2 PATCH', C.amber)
  );
  await play(
    new M.FadeIn(gridTitle, { runTime: 0.7 }),
    new M.LaggedStart(scoreCells.flat().map(g => new M.FadeIn(g)), { lagRatio: 0.04, runTime: 0.9 }),
    new M.Create(patchBox, { runTime: 0.9 }),
    ...fbox(['upper-left outline', ['4 scores inside', C.amber]], C.amber)
  );

  // Beat 12: called a patch
  await until(S(12));
  await play(new M.Indicate(patchBox, { color: C.amber, runTime: 0.9 }), ...say('PATCH = SMALL GROUP OF SQUARES', C.amber));

  // Beat 13: top row 0 and 0
  const rowHi = outlineRect(SX2, SY2, 4, 3, ST2, 0, 0, 0, 1, C.cyan, 3);
  await until(S(13));
  await play(
    new M.Create(rowHi, { runTime: 0.8 }),
    new M.Indicate(scoreCells[0][0], { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(scoreCells[0][1], { color: C.cyan, runTime: 0.8 }),
    ...fbox(['top row: 0, 0'])
  );

  // Beat 14: bottom row 0 and 3
  await until(S(14));
  await play(
    new M.Transform(rowHi, outlineRect(SX2, SY2, 4, 3, ST2, 1, 1, 0, 1, C.amber, 3), { runTime: 0.8 }),
    new M.Indicate(scoreCells[1][0], { color: C.amber, runTime: 0.8 }),
    new M.Indicate(scoreCells[1][1], { color: C.amber, runTime: 0.8 }),
    ...fbox(['top row:    0, 0', ['bottom row: 0, 3', C.amber]], C.amber)
  );

  // Beat 15: imagine each square holds a card with its score
  const p1Cards = [scoreCells[0][0], scoreCells[0][1], scoreCells[1][0], scoreCells[1][1]];
  await until(S(15));
  await play(
    new M.FadeOut(rowHi, { runTime: 0.4 }),
    new M.LaggedStart(p1Cards.map(g => new M.Indicate(g, { color: C.cyan })), { lagRatio: 0.16, runTime: 1.2 }),
    ...say('EACH SQUARE = ONE SCORE CARD', C.cyan)
  );

  // Beat 16: keep the biggest card
  await until(S(16));
  await play(
    new M.Indicate(scoreCells[1][1], { color: C.amber, runTime: 0.9 }),
    new M.Flash(scoreCells[1][1], { color: C.amber, runTime: 0.8 }),
    ...say('KEEP THE BIGGEST CARD', C.amber),
    ...fbox(['cards: 0, 0, 0, 3', ['biggest = 3', C.amber]], C.amber)
  );

  // Beat 17: pooling = one number for the whole patch
  const outTitle = T('NEW SCORE', P ? 15 : 16, C.amber, true, true);
  outTitle.moveTo([OX2, SY2 + 2 * ST2 + 0.3, 0]);
  const out1Box = new M.RoundedRectangle({ width: OS2, height: OS2, cornerRadius: 0.12, color: C.muted, strokeWidth: 2.5 });
  out1Box.setFill(C.card, 0.92);
  out1Box.moveTo(OUT1P);
  const arrow1 = arrow([SX2 + 1.5 * ST2 + 0.16, OUT1P[1], 0], [OX2 - OS2 / 2 - 0.16, OUT1P[1], 0], C.amber);

  await until(S(17));
  await play(
    new M.FadeIn(outTitle, { runTime: 0.8 }),
    new M.FadeIn(arrow1, { runTime: 0.8 }),
    new M.FadeIn(out1Box, { runTime: 0.8 }),
    ...say('POOLING = ONE NUMBER FOR A PATCH', C.green)
  );

  // Beat 18: maximum = biggest number
  await until(S(18));
  await play(
    ...say('MAXIMUM = BIGGEST NUMBER', C.amber),
    ...fbox(['maximum = biggest number', ['from 0, 0, 0, 3 → 3', C.amber]], C.amber)
  );

  // Beat 19: max pooling
  await until(S(19));
  await play(new M.Indicate(patchBox, { color: C.green, runTime: 0.8 }), ...say('MAX POOLING = KEEP THE MAXIMUM', C.green));

  // Beat 20: top row has two zeros -> biggest so far is 0
  const scanBox = outlineRect(SX2, SY2, 4, 3, ST2, 0, 0, 0, 1, C.cyan, 3.5);
  await until(S(20));
  await play(
    new M.Create(scanBox, { runTime: 0.8 }),
    ...say('CHECK THE PATCH STEP BY STEP', C.cyan),
    ...fbox(['top row: 0, 0', ['biggest so far = 0', C.cyan]])
  );

  // Beat 21: bottom left also has 0
  await until(S(21));
  await play(
    new M.Transform(scanBox, outlineRect(SX2, SY2, 4, 3, ST2, 1, 1, 0, 0, C.cyan, 3.5), { runTime: 0.7 }),
    ...fbox(['bottom left: 0', ['biggest so far = 0', C.cyan]])
  );

  // Beat 22: bottom right has 3, bigger than 0
  await until(S(22));
  await play(
    new M.Transform(scanBox, outlineRect(SX2, SY2, 4, 3, ST2, 1, 1, 1, 1, C.amber, 3.5), { runTime: 0.7 }),
    new M.Flash(scoreCells[1][1], { color: C.amber, runTime: 0.8 }),
    ...fbox(['bottom right: 3 > 0', ['biggest so far = 3', C.amber]], C.amber)
  );

  // Beat 23: put 3 in one new square
  const out1Amber = new M.RoundedRectangle({ width: OS2, height: OS2, cornerRadius: 0.12, color: C.amber, strokeWidth: 3.5 });
  out1Amber.setFill(C.amber, 0.22);
  out1Amber.moveTo(OUT1P);
  const out1Num = T('3', P ? 30 : 32, C.amber, true, true);
  out1Num.moveTo(OUT1P);
  await until(S(23));
  await play(
    new M.FadeOut(scanBox, { runTime: 0.5 }),
    new M.Transform(out1Box, out1Amber, { runTime: 0.8 }),
    new M.FadeIn(out1Num, { runTime: 0.8 }),
    new M.Flash(out1Num, { color: C.amber, runTime: 0.8 }),
    ...say('NEW SCORE = 3', C.amber)
  );

  // Beat 24: look at the formula box
  await until(S(24));
  await play(...say('LOOK AT THE FORMULA BOX', C.cyan), ...fbox([['New score = ?', C.amber]], C.cyan));

  // Beat 25: formula
  await until(S(25));
  await play(
    ...fbox([
      ['New score =', C.ink],
      ['biggest score in the patch', C.amber],
      ['from 0, 0, 0, 3  →  3', C.green],
    ], C.amber),
    ...say('NEW SCORE = BIGGEST SCORE IN PATCH', C.amber)
  );

  // Beat 26: what if 3 and upper-left 0 trade places? (copy of patch)
  const CS = P ? 0.64 : 0.66, CSZ = CS - 0.06;
  const COPYP = P ? [-0.65, -4.55, 0] : [-0.85, -1.78, 0];
  const copyRects = [0, 0, 0, 3].map((v, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    return makeScoreRect(cellPos(COPYP[0], COPYP[1], 2, 2, CS, r, c), CSZ, v, false);
  });
  const copyNumsBefore = [0, 0, 0, 3].map((v, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const t = T(String(v), P ? 19 : 20, v > 0 ? C.amber : C.ink, true, true);
    t.moveTo(cellPos(COPYP[0], COPYP[1], 2, 2, CS, r, c));
    return t;
  });
  const copyOutline = outlineRect(COPYP[0], COPYP[1], 2, 2, CS, 0, 1, 0, 1, C.violet, 3);
  const copyTag = T('copy', P ? 16 : 15, C.violet, true);
  copyTag.moveTo([COPYP[0], COPYP[1] - CS - 0.22, 0]);
  const copyArr = arrow([COPYP[0] + CS + 0.14, COPYP[1], 0], [COPYP[0] + CS + 0.72, COPYP[1], 0], C.violet);
  const copyOutBox = new M.RoundedRectangle({ width: 0.74, height: 0.74, cornerRadius: 0.1, color: C.violet, strokeWidth: 2.5 });
  copyOutBox.setFill(C.card, 0.92);
  copyOutBox.moveTo([COPYP[0] + CS + 1.18, COPYP[1], 0]);
  const copyQ = T('?', P ? 24 : 26, C.violet, true, true);
  copyQ.moveTo([COPYP[0] + CS + 1.18, COPYP[1], 0]);

  await until(S(26));
  await play(
    new M.FadeIn(new M.VGroup(...copyRects, ...copyNumsBefore, copyOutline, copyTag, copyArr, copyOutBox, copyQ), { runTime: 0.8 }),
    ...say('WHAT IF 3 AND 0 TRADE PLACES?', C.violet),
    ...fbox(['trade places inside copy', ['new score = ?', C.violet]], C.violet)
  );

  // Swap 3 (index 3) and upper-left 0 (index 0) inside the copy
  const posTL = cellPos(COPYP[0], COPYP[1], 2, 2, CS, 0, 0);
  const posBR = cellPos(COPYP[0], COPYP[1], 2, 2, CS, 1, 1);
  const swappedThree = T('3', P ? 19 : 20, C.amber, true, true);
  swappedThree.moveTo(posTL);
  const swappedZero = T('0', P ? 19 : 20, C.ink, true, true);
  swappedZero.moveTo(posBR);
  await until(S(26) + 2.1);
  await play(
    new M.Transform(copyRects[3], makeScoreRect(posTL, CSZ, 3, false), { pathArc: 0.8, runTime: 1.0 }),
    new M.Transform(copyRects[0], makeScoreRect(posBR, CSZ, 0, false), { pathArc: 0.8, runTime: 1.0 }),
    new M.FadeOut(copyNumsBefore[0], { runTime: 0.4 }),
    new M.FadeOut(copyNumsBefore[3], { runTime: 0.4 }),
    new M.FadeIn(swappedThree, { runTime: 0.9 }),
    new M.FadeIn(swappedZero, { runTime: 0.9 })
  );

  // Beat 27: three is still the biggest score -> stays 3
  const copyThree = T('3', P ? 24 : 26, C.amber, true, true);
  copyThree.moveTo([COPYP[0] + CS + 1.18, COPYP[1], 0]);
  const copyOutAmber = new M.RoundedRectangle({ width: 0.74, height: 0.74, cornerRadius: 0.1, color: C.amber, strokeWidth: 3 });
  copyOutAmber.setFill(C.amber, 0.22);
  copyOutAmber.moveTo([COPYP[0] + CS + 1.18, COPYP[1], 0]);
  await until(S(27));
  await play(
    new M.FadeOut(copyQ, { runTime: 0.4 }),
    new M.Transform(copyOutBox, copyOutAmber, { runTime: 0.7 }),
    new M.FadeIn(copyThree, { runTime: 0.7 }),
    new M.Flash(copyThree, { color: C.amber, runTime: 0.8 }),
    ...say('NEW SCORE STAYS 3', C.amber),
    ...fbox(['swapped: 3, 0, 0, 0', ['biggest is still 3', C.amber]], C.amber)
  );

  // Beat 28: patch just below the first one (rows 3-4, cols 1-2 -> r=2..3, c=0..1)
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(...copyRects, copyNumsBefore[1], copyNumsBefore[2], swappedThree, swappedZero, copyOutline, copyTag, copyArr, copyOutBox, copyThree), { runTime: 0.6 }),
    new M.Transform(patchBox, outlineRect(SX2, SY2, 4, 3, ST2, 2, 3, 0, 1, C.amber, 4), { runTime: 0.9 }),
    ...say('NEXT PATCH: JUST BELOW', C.amber),
    ...fbox(['second patch', 'rows 3–4, cols 1–2'], C.amber)
  );

  // Beat 29: top row of second patch has 0 and 3
  const rowHi2 = outlineRect(SX2, SY2, 4, 3, ST2, 2, 2, 0, 1, C.amber, 3);
  await until(S(29));
  await play(
    new M.Create(rowHi2, { runTime: 0.7 }),
    new M.Indicate(scoreCells[2][0], { color: C.amber, runTime: 0.7 }),
    new M.Indicate(scoreCells[2][1], { color: C.amber, runTime: 0.7 }),
    ...fbox([['top row: 0, 3', C.amber]])
  );

  // Beat 30: bottom row has two zeros
  await until(S(30));
  await play(
    new M.Transform(rowHi2, outlineRect(SX2, SY2, 4, 3, ST2, 3, 3, 0, 1, C.cyan, 3), { runTime: 0.7 }),
    new M.Indicate(scoreCells[3][0], { color: C.cyan, runTime: 0.7 }),
    new M.Indicate(scoreCells[3][1], { color: C.cyan, runTime: 0.7 }),
    ...fbox(['top row:    0, 3', 'bottom row: 0, 0'])
  );

  // Beat 31: biggest score here is 3 too -> second output square below first
  const out2Box = new M.RoundedRectangle({ width: OS2, height: OS2, cornerRadius: 0.12, color: C.amber, strokeWidth: 3.5 });
  out2Box.setFill(C.amber, 0.22);
  out2Box.moveTo(OUT2P);
  const out2Num = T('3', P ? 30 : 32, C.amber, true, true);
  out2Num.moveTo(OUT2P);
  const arrow2 = arrow([SX2 + 1.5 * ST2 + 0.16, OUT2P[1], 0], [OX2 - OS2 / 2 - 0.16, OUT2P[1], 0], C.amber);
  await until(S(31));
  await play(
    new M.FadeOut(rowHi2, { runTime: 0.4 }),
    new M.FadeIn(arrow2, { runTime: 0.8 }),
    new M.FadeIn(out2Box, { runTime: 0.8 }),
    new M.FadeIn(out2Num, { runTime: 0.8 }),
    new M.Flash(out2Num, { color: C.amber, runTime: 0.8 }),
    ...fbox(['patch 2: 0, 3, 0, 0', ['new score = 3', C.amber]], C.amber)
  );

  // Beat 32: use max pooling to find biggest drop in brightness in each patch
  await until(S(32));
  await play(
    new M.Indicate(out1Box, { color: C.green, runTime: 0.9 }),
    new M.Indicate(out2Box, { color: C.green, runTime: 0.9 }),
    ...say('EACH PATCH → BIGGEST DROP', C.green),
    ...fbox(['patch 1 → 3', 'patch 2 → 3', ['biggest drop in each patch', C.green]], C.green)
  );

  // =========================================================================
  // PHASE 3 (Beats 33-35): Neural Network View using L.net(...)
  // =========================================================================
  const N = net({
    layers: [4, 1],
    center: P ? [-0.15, -1.45, 0] : [-2.45, -0.7, 0],
    width: P ? 3.2 : 4.0,
    height: P ? 3.2 : 2.85,
    r: 0.3,
    names: ['r1 c1', 'r1 c2', 'r2 c1', 'r2 c2'],
    outName: 'next',
    color: C.cyan,
  });
  const netHead1 = T('FIRST PATCH (4 scores)', P ? 15 : 15, C.violet, true, true);
  netHead1.moveTo([N.pos(0, 0)[0], N.pos(0, 0)[1] + 0.62, 0]);
  const netHead2 = T('NEXT LAYER', P ? 15 : 15, C.amber, true, true);
  netHead2.moveTo([N.pos(1, 0)[0], N.pos(0, 0)[1] + 0.62, 0]);
  const netVals = [];
  const putVal = (l, i, s, col = C.ink) => {
    const a = N.value(l, i, s, col);
    netVals.push(a[0].mobject);
    return a;
  };

  // Beat 33: first patch sends its result to the next layer (group of circles)
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(gridTitle, outTitle, patchBox, arrow1, arrow2, out1Box, out1Num, out2Box, out2Num, ...scoreCells.flat()), { runTime: 0.55 }),
    ...say('PATCH → NEXT LAYER', C.violet)
  );
  await play(
    new M.FadeIn(N.group, { runTime: 0.9 }),
    new M.FadeIn(netHead1, { runTime: 0.8 }),
    new M.FadeIn(netHead2, { runTime: 0.8 }),
    ...putVal(0, 0, '0', C.ink),
    ...putVal(0, 1, '0', C.ink),
    ...putVal(0, 2, '0', C.ink),
    ...putVal(0, 3, '3', C.amber),
    ...N.weight(0, 0, 0, 0.2),
    ...N.weight(0, 1, 0, 0.2),
    ...N.weight(0, 2, 0, 0.2),
    ...N.weight(0, 3, 0, 1.0),
    ...fbox(['4 patch circles:', '0, 0, 0, 3', ['→ 1 circle in next layer', C.amber]], C.violet)
  );

  // Beat 34: signal flows left to right, lights up output circle with 3
  await until(S(34));
  await play(...N.flow(0, C.amber));
  await play(
    ...putVal(1, 0, '3', C.amber),
    new M.Flash(N.nodes[1][0], { color: C.amber, runTime: 0.8 }),
    ...say('4 SCORES → 1 SCORE: 3', C.amber),
    ...fbox(['4 patch scores: 0, 0, 0, 3', ['next layer gets: 3', C.amber]], C.amber)
  );

  // Beat 35: next layer uses these scores to look for a chip
  await until(S(35));
  await play(
    new M.Flash(N.nodes[1][0], { color: C.green, runTime: 0.9 }),
    ...say('NEXT LAYER LOOKS FOR A CHIP', C.green),
    ...fbox(['next layer score = 3', ['strong drop → check for chip', C.green]], C.green)
  );

  // =========================================================================
  // PHASE 4 (Beats 36-37): Common Trap — Dark to Bright Missed
  // =========================================================================
  const T4Y = P ? 0.15 : -0.65;
  const T4X = P ? 0 : -4.4;
  const T4SZ = P ? 0.86 : 0.9;
  const revLeft = makeTileCell(1, [T4X - T4SZ / 2 - 0.06, T4Y, 0], T4SZ);
  const revRight = makeTileCell(4, [T4X + T4SZ / 2 + 0.06, T4Y, 0], T4SZ);
  const revTitle = T('DARK → BRIGHT', P ? 15 : 16, C.pink, true, true);
  revTitle.moveTo([T4X, T4Y + T4SZ / 2 + 0.34, 0]);
  const revSub = T('1 − 4 = −3', P ? 17 : 18, C.pink, true, true);
  revSub.moveTo([T4X, T4Y - T4SZ / 2 - 0.36, 0]);

  // Beat 36: sharp change from dark to bright can be missed
  await until(S(36));
  await play(
    new M.FadeOut(N.group, { runTime: 0.5 }),
    new M.FadeOut(netHead1, { runTime: 0.5 }),
    new M.FadeOut(netHead2, { runTime: 0.5 }),
    ...netVals.map(v => new M.FadeOut(v, { runTime: 0.5 })),
    ...say('TRAP: DARK → BRIGHT MISSED', C.pink)
  );
  await play(
    new M.FadeIn(revTitle, { runTime: 0.8 }),
    new M.FadeIn(revLeft, { runTime: 0.8 }),
    new M.FadeIn(revRight, { runTime: 0.8 }),
    ...fbox(['dark on left  = 1', 'bright on right = 4', ['sharp change!', C.pink]], C.pink)
  );

  // Beat 37: 1 - 4 = -3, so 0 beats it
  const P4X = P ? -1.45 : -1.45, P4Y = P ? -2.75 : -0.65;
  const P4ST = P ? 0.82 : 0.82, P4SZ = P4ST - 0.07;
  const negPatchVals = [[0, 0], [0, -3]];
  const negCells = negPatchVals.map((row, r) =>
    row.map((v, c) => makeScoreCell(v, cellPos(P4X, P4Y, 2, 2, P4ST, r, c), P4SZ, P ? 20 : 21))
  );
  const negOutline = outlineRect(P4X, P4Y, 2, 2, P4ST, 0, 1, 0, 1, C.pink, 3);
  const negOutX = P ? 1.8 : 1.1;
  const negArrow = arrow([P4X + P4ST + 0.14, P4Y, 0], [negOutX - 0.62, P4Y, 0], C.pink);
  const negOutBox = new M.RoundedRectangle({ width: 0.96, height: 0.96, cornerRadius: 0.12, color: C.cyan, strokeWidth: 3 });
  negOutBox.setFill(C.card, 0.92);
  negOutBox.moveTo([negOutX, P4Y, 0]);
  const negOutNum = T('0', P ? 28 : 30, C.cyan, true, true);
  negOutNum.moveTo([negOutX, P4Y, 0]);

  await until(S(37));
  await play(
    new M.FadeIn(revSub, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...negCells.flat(), negOutline, negArrow, negOutBox, negOutNum), { runTime: 0.9 }),
    new M.Flash(negOutNum, { color: C.pink, runTime: 0.8 }),
    ...say('0 BEATS −3', C.pink),
    ...fbox(['1 − 4 = −3', 'patch: 0, 0, 0, −3', ['biggest = 0  (0 > −3)', C.pink]], C.pink)
  );

  // =========================================================================
  // PHASE 5 (Beats 38-40): Keeps Biggest Score, Loses Exact Spot
  // =========================================================================
  const S5ST = P ? 0.76 : 0.78, S5SZ = S5ST - 0.07;
  const P5X = P ? -1.65 : -4.25;
  const P5AY = P ? -0.45 : 0.32;
  const P5BY = P ? -2.75 : -1.78;
  const P5OX = P ? 1.8 : -0.75;
  const P5OY = (P5AY + P5BY) / 2;

  const patchACells = [[0, 0], [0, 3]].map((row, r) =>
    row.map((v, c) => makeScoreCell(v, cellPos(P5X, P5AY, 2, 2, S5ST, r, c), S5SZ, P ? 20 : 21))
  );
  const patchAOut = outlineRect(P5X, P5AY, 2, 2, S5ST, 0, 1, 0, 1, C.amber, 3);
  const patchATag = T('3 at bottom right', P ? 17 : 16, C.muted, true);
  patchATag.moveTo([P5X, P5AY + S5ST + 0.25, 0]);

  const patchBCells = [[3, 0], [0, 0]].map((row, r) =>
    row.map((v, c) => makeScoreCell(v, cellPos(P5X, P5BY, 2, 2, S5ST, r, c), S5SZ, P ? 20 : 21))
  );
  const patchBOut = outlineRect(P5X, P5BY, 2, 2, S5ST, 0, 1, 0, 1, C.violet, 3);
  const patchBTag = T('3 at top left', P ? 17 : 16, C.muted, true);
  patchBTag.moveTo([P5X, P5BY - S5ST - 0.25, 0]);

  const p5OutBox = new M.RoundedRectangle({ width: 1.06, height: 1.06, cornerRadius: 0.12, color: C.amber, strokeWidth: 3.5 });
  p5OutBox.setFill(C.amber, 0.22);
  p5OutBox.moveTo([P5OX, P5OY, 0]);
  const p5OutNum = T('3', P ? 32 : 34, C.amber, true, true);
  p5OutNum.moveTo([P5OX, P5OY, 0]);
  const p5OutTag = T('same new score', P ? 17 : 16, C.amber, true);
  p5OutTag.moveTo([P5OX, P5OY + 0.78, 0]);
  const p5ArrA = arrow([P5X + S5ST + 0.16, P5AY, 0], [P5OX - 0.68, P5OY + 0.16, 0], C.amber);
  const p5ArrB = arrow([P5X + S5ST + 0.16, P5BY, 0], [P5OX - 0.68, P5OY - 0.16, 0], C.violet);

  // Beat 38: tells you which patch the 3 came from
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(revTitle, revLeft, revRight, revSub, negOutline, negArrow, negOutBox, negOutNum, ...negCells.flat()), { runTime: 0.5 }),
    ...say('KNOWS WHICH PATCH', C.cyan)
  );
  await play(
    new M.FadeIn(new M.VGroup(...patchACells.flat(), patchAOut, patchATag, p5ArrA, p5OutBox, p5OutNum, p5OutTag), { runTime: 0.9 }),
    ...fbox(['new score = 3', ['which patch? upper left', C.cyan]])
  );

  // Beat 39: 3 could have come from any square inside that patch
  await until(S(39));
  await play(
    new M.FadeIn(new M.VGroup(...patchBCells.flat(), patchBOut, patchBTag, p5ArrB), { runTime: 0.9 }),
    ...say('COULD BE ANY SQUARE INSIDE', C.violet),
    ...fbox(['both patches → 3', ['exact square = ?', C.pink]], C.violet)
  );

  // Beat 40: recap — keeps biggest score, loses exact spot
  await until(S(40));
  await play(
    new M.Indicate(p5OutBox, { color: C.amber, runTime: 0.9 }),
    new M.Flash(p5OutNum, { color: C.amber, runTime: 0.9 }),
    ...say('KEEP BIGGEST SCORE · LOSE EXACT SPOT', C.amber),
    ...fbox([['keep: biggest score (3)', C.amber], ['lose: exact spot', C.pink]], C.amber)
  );

  // =========================================================================
  // PHASE 6 (Beats 41-43): Try It Preview Beats
  // =========================================================================
  const T6ST = P ? 0.94 : 0.96, T6SZ = T6ST - 0.08;
  const T6X = P ? -1.45 : -3.8, T6Y = P ? -1.65 : -0.7;
  const T6OX = P ? 1.95 : -0.65;

  const t6Rects = [0, 0, 0, 3].map((v, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    return makeScoreRect(cellPos(T6X, T6Y, 2, 2, T6ST, r, c), T6SZ, v, false);
  });
  const t6Nums = [0, 0, 0, 3].map((v, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const t = T(String(v), P ? 24 : 26, v > 0 ? C.amber : C.ink, true, true);
    t.moveTo(cellPos(T6X, T6Y, 2, 2, T6ST, r, c));
    return t;
  });
  const t6Outline = outlineRect(T6X, T6Y, 2, 2, T6ST, 0, 1, 0, 1, C.amber, 3.5);
  const t6Arrow = arrow([T6X + T6ST + 0.16, T6Y, 0], [T6OX - 0.68, T6Y, 0], C.amber);
  const t6OutBox = new M.RoundedRectangle({ width: 1.08, height: 1.08, cornerRadius: 0.12, color: C.amber, strokeWidth: 3.5 });
  t6OutBox.setFill(C.amber, 0.22);
  t6OutBox.moveTo([T6OX, T6Y, 0]);
  const t6OutNum = T('3', P ? 32 : 34, C.amber, true, true);
  t6OutNum.moveTo([T6OX, T6Y, 0]);

  // Beat 41: drag the 3 to another square inside the outline to check
  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...patchACells.flat(), ...patchBCells.flat(), patchAOut, patchBOut, patchATag, patchBTag, p5ArrA, p5ArrB, p5OutBox, p5OutNum, p5OutTag), { runTime: 0.5 }),
    ...say('TRY IT 1: DRAG THE 3', C.cyan)
  );
  await play(
    new M.FadeIn(new M.VGroup(...t6Rects, ...t6Nums, t6Outline, t6Arrow, t6OutBox, t6OutNum), { runTime: 0.8 }),
    ...fbox(['drag 3 to another square', ['new score stays 3', C.amber]])
  );
  const t6BL = cellPos(T6X, T6Y, 2, 2, T6ST, 1, 0);
  const t6BR = cellPos(T6X, T6Y, 2, 2, T6ST, 1, 1);
  const t6Moved3 = T('3', P ? 24 : 26, C.amber, true, true);
  t6Moved3.moveTo(t6BL);
  const t6Moved0 = T('0', P ? 24 : 26, C.ink, true, true);
  t6Moved0.moveTo(t6BR);
  await play(
    new M.Transform(t6Rects[3], makeScoreRect(t6BL, T6SZ, 3, false), { pathArc: 0.7, runTime: 0.9 }),
    new M.Transform(t6Rects[2], makeScoreRect(t6BR, T6SZ, 0, false), { pathArc: 0.7, runTime: 0.9 }),
    new M.FadeOut(t6Nums[2], { runTime: 0.3 }),
    new M.FadeOut(t6Nums[3], { runTime: 0.3 }),
    new M.FadeIn(t6Moved3, { runTime: 0.8 }),
    new M.FadeIn(t6Moved0, { runTime: 0.8 }),
    new M.Indicate(t6OutBox, { color: C.amber, runTime: 0.9 })
  );

  // Beat 42: change the 3 to 0 to make the new score 0
  const t6ZeroBL = T('0', P ? 24 : 26, C.ink, true, true);
  t6ZeroBL.moveTo(t6BL);
  const t6OutZero = T('0', P ? 32 : 34, C.cyan, true, true);
  t6OutZero.moveTo([T6OX, T6Y, 0]);
  const t6OutCyan = new M.RoundedRectangle({ width: 1.08, height: 1.08, cornerRadius: 0.12, color: C.cyan, strokeWidth: 3 });
  t6OutCyan.setFill(C.card, 0.92);
  t6OutCyan.moveTo([T6OX, T6Y, 0]);

  await until(S(42));
  await play(
    new M.Transform(t6Rects[3], makeScoreRect(t6BL, T6SZ, 0, false), { runTime: 0.8 }),
    new M.FadeOut(t6Moved3, { runTime: 0.4 }),
    new M.FadeIn(t6ZeroBL, { runTime: 0.8 }),
    new M.Transform(t6OutBox, t6OutCyan, { runTime: 0.8 }),
    new M.FadeOut(t6OutNum, { runTime: 0.4 }),
    new M.FadeIn(t6OutZero, { runTime: 0.8 }),
    new M.Flash(t6OutZero, { color: C.cyan, runTime: 0.8 }),
    ...say('TRY IT 2: CHANGE 3 TO 0', C.cyan),
    ...fbox(['patch: 0, 0, 0, 0', ['new score = 0', C.cyan]])
  );

  // Beat 43: tap New data, choose the biggest score before checking the formula box
  const freshVals = [2, 0, 5, 1];
  const freshNums = freshVals.map((v, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const t = T(String(v), P ? 24 : 26, v === 5 ? C.amber : C.ink, true, true);
    t.moveTo(cellPos(T6X, T6Y, 2, 2, T6ST, r, c));
    return t;
  });
  const freshQ = T('?', P ? 32 : 34, C.green, true, true);
  freshQ.moveTo([T6OX, T6Y, 0]);
  const fresh5 = T('5', P ? 32 : 34, C.amber, true, true);
  fresh5.moveTo([T6OX, T6Y, 0]);
  const t6OutGreen = new M.RoundedRectangle({ width: 1.08, height: 1.08, cornerRadius: 0.12, color: C.amber, strokeWidth: 3.5 });
  t6OutGreen.setFill(C.amber, 0.22);
  t6OutGreen.moveTo([T6OX, T6Y, 0]);

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(t6Nums[0], t6Nums[1], t6ZeroBL, t6Moved0, t6OutZero), { runTime: 0.4 }),
    new M.Transform(t6Rects[0], makeScoreRect(cellPos(T6X, T6Y, 2, 2, T6ST, 0, 0), T6SZ, 0, false), { runTime: 0.7 }),
    new M.Transform(t6Rects[1], makeScoreRect(cellPos(T6X, T6Y, 2, 2, T6ST, 0, 1), T6SZ, 0, false), { runTime: 0.7 }),
    new M.Transform(t6Rects[3], makeScoreRect(t6BL, T6SZ, 5, false), { runTime: 0.7 }),
    new M.Transform(t6Rects[2], makeScoreRect(t6BR, T6SZ, 0, false), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...freshNums, freshQ), { runTime: 0.8 }),
    ...say('TRY IT 3: NEW DATA & PREDICT', C.green),
    ...fbox(['new patch: 2, 0, 5, 1', ['choose the biggest score!', C.green]], C.green)
  );
  await until(S(43) + 2.1);
  await play(
    new M.FadeOut(freshQ, { runTime: 0.4 }),
    new M.Transform(t6OutBox, t6OutGreen, { runTime: 0.7 }),
    new M.FadeIn(fresh5, { runTime: 0.7 }),
    new M.Flash(fresh5, { color: C.amber, runTime: 0.8 }),
    ...fbox(['new patch: 2, 0, 5, 1', ['biggest score = 5', C.amber]], C.amber)
  );
}
