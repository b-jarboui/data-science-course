// 17.3.4 Stride and padding: count where the filter fits.
// Beat i = sentence i (0-based, 52 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  // Shared 4x4 tile from chapters/17.3.md: bright glaze = 4, dark chip = 1.
  const TILE = [
    [4, 4, 4, 4],
    [4, 4, 1, 1],
    [4, 4, 1, 1],
    [4, 4, 4, 4],
  ];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3]).
  const CELL = P ? 0.72 : 0.80;
  const GX = P ? 0.15 : -2.5;
  const GY = P ? 1.4 : -0.42;
  const PILL = P ? [0, 3.95, 0] : [0, 2.08, 0];
  const NETC = P ? [0, -1.85, 0] : [3.25, 0.72, 0];
  const BOXP = P ? [0, -4.35, 0] : [3.25, -1.85, 0];
  const SCORE_Y = P ? -0.58 : -2.52;
  const NL_X = P ? 0.0 : 3.25;
  const NL_Y = P ? -3.12 : -0.62;
  const NL_SP = P ? 0.68 : 0.78;

  const colX = c => GX + (c - 1.5) * CELL; // c = 0..3 for cols 1..4; -1 and 4 for padding
  const rowY = r => GY + (1.5 - r) * CELL; // r = 0..3 for rows 1..4
  const pairX = c => (colX(c) + colX(c + 1)) / 2;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 5.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.6 }));
    boxNow = g;
    return a;
  }

  // Helper: build the fixed 4x4 tile cells (squares, chip hatch lines, and separate number texts)
  const sqGrid = [], brightNums = [], chipNums = [], chipHatches = [];
  for (let r = 0; r < 4; r++) {
    sqGrid.push([]);
    for (let c = 0; c < 4; c++) {
      const v = TILE[r][c], isChip = v === 1;
      const x = colX(c), y = rowY(r);
      const sq = new M.Rectangle({ width: CELL - 0.04, height: CELL - 0.04, color: isChip ? C.pink : C.cyan, strokeWidth: 1.8 });
      sq.setFill(isChip ? C.pink : C.cyan, isChip ? 0.16 : 0.28);
      sq.moveTo([x, y, -0.01]);
      sqGrid[r].push(sq);

      if (isChip) {
        const d = CELL * 0.32;
        const h1 = new M.Line({ start: [x - d, y - d, -0.005], end: [x + d, y + d, -0.005], color: C.pink, strokeWidth: 1 });
        h1.setStrokeOpacity(0.28);
        const h2 = new M.Line({ start: [x - d, y + 0.04, -0.005], end: [x - 0.04, y + d, -0.005], color: C.pink, strokeWidth: 1 });
        h2.setStrokeOpacity(0.28);
        const h3 = new M.Line({ start: [x + 0.04, y - d, -0.005], end: [x + d, y - 0.04, -0.005], color: C.pink, strokeWidth: 1 });
        h3.setStrokeOpacity(0.28);
        chipHatches.push(h1, h2, h3);
      }

      const num = T(String(v), P ? 21 : 23, isChip ? C.pink : C.ink, true, true);
      num.moveTo([x, y, 0.01]);
      if (isChip) chipNums.push(num);
      else brightNums.push(num);
    }
  }

  // Helper: dashed patterned square for padding at column c (-1 or 4) on row 2
  function makePadSquare(c) {
    const x = colX(c), y = rowY(1), h = (CELL - 0.04) / 2;
    const top = new M.DashedLine({ start: [x - h, y + h, 0], end: [x + h, y + h, 0], color: C.violet });
    const bot = new M.DashedLine({ start: [x - h, y - h, 0], end: [x + h, y - h, 0], color: C.violet });
    const lft = new M.DashedLine({ start: [x - h, y - h, 0], end: [x - h, y + h, 0], color: C.violet });
    const rgt = new M.DashedLine({ start: [x + h, y - h, 0], end: [x + h, y + h, 0], color: C.violet });
    const bg = new M.Rectangle({ width: CELL - 0.08, height: CELL - 0.08, color: C.violet, strokeWidth: 0 });
    bg.setFill(C.violet, 0.14); bg.moveTo([x, y, -0.01]);
    const d = h * 0.72;
    const d1 = new M.Line({ start: [x - d, y - d, -0.005], end: [x + d, y + d, -0.005], color: C.violet, strokeWidth: 1 });
    d1.setStrokeOpacity(0.3);
    const d2 = new M.Line({ start: [x - d, y + d, -0.005], end: [x + d, y - d, -0.005], color: C.violet, strokeWidth: 1 });
    d2.setStrokeOpacity(0.3);
    const box = new M.VGroup(bg, d1, d2, top, bot, lft, rgt);
    const zero = T('0', P ? 21 : 23, C.violet, true, true); zero.moveTo([x, y, 0.01]);
    const tag = T('added', P ? 15 : 13, C.violet, true); tag.moveTo([x, y + h + 0.18, 0]);
    return { box, zero, tag };
  }

  // Helper: 2-square filter outline centered over columns (c, c+1) on row 2
  function makeWin(c, color = C.amber) {
    const r = new M.RoundedRectangle({ width: 2 * CELL - 0.02, height: CELL + 0.04, cornerRadius: 0.10, color, strokeWidth: 3.4 });
    r.setFill(color, 0.08);
    r.moveTo([pairX(c), rowY(1), 0.02]);
    return r;
  }

  // Helper: score badge placed below pair (c, c+1)
  function makeScoreBadge(c, val, color = C.amber) {
    const g = pill(String(val), color, P ? 16 : 17);
    g.moveTo([pairX(c), SCORE_Y, 0]);
    return g;
  }

  // Helper: small numbered position marker below pair (c, c+1)
  function makePosMark(c, label, color = C.amber) {
    const g = pill(label, color, 15);
    g.moveTo([pairX(c), SCORE_Y, 0]);
    return g;
  }

  // Helper: horizontal bracket below tile spanning columns [cFrom .. cTo]
  function makeBracket(cFrom, cTo, y, text, color = C.amber) {
    const xL = colX(cFrom) - CELL / 2 + 0.06, xR = colX(cTo) + CELL / 2 - 0.06;
    const h = 0.12;
    const bLine = new M.Line({ start: [xL, y, 0], end: [xR, y, 0], color, strokeWidth: 2.5 });
    const lTick = new M.Line({ start: [xL, y, 0], end: [xL, y + h, 0], color, strokeWidth: 2.5 });
    const rTick = new M.Line({ start: [xR, y, 0], end: [xR, y + h, 0], color, strokeWidth: 2.5 });
    const lab = T(text, 15, color, true);
    lab.moveTo([(xL + xR) / 2, y - 0.24, 0]);
    return new M.VGroup(bLine, lTick, rTick, lab);
  }

  // Neural network representation of the 2-square filter (PEDAGOGY.md: L.net)
  const N = net({
    layers: [2, 1],
    center: NETC,
    width: P ? 2.4 : 2.5,
    height: P ? 1.0 : 1.08,
    r: P ? 0.25 : 0.27,
    names: ['left', 'right'],
    outName: 'score',
    color: C.cyan,
  });
  const wTop = T('+1', P ? 15 : 16, C.cyan, true, true);
  wTop.moveTo([(N.pos(0, 0)[0] + N.pos(1, 0)[0]) / 2, (N.pos(0, 0)[1] + N.pos(1, 0)[1]) / 2 + 0.24, 0]);
  const wBot = T('−1', P ? 15 : 16, C.pink, true, true);
  wBot.moveTo([(N.pos(0, 1)[0] + N.pos(1, 0)[0]) / 2, (N.pos(0, 1)[1] + N.pos(1, 0)[1]) / 2 - 0.24, 0]);

  // 0: ceramics workshop camera checks tiles for chips
  const tileAll = [...sqGrid.flat(), ...chipHatches];
  const tileTag = T('tile photo', P ? 15 : 16, C.muted, true);
  tileTag.moveTo([GX, rowY(3) - CELL / 2 - 0.22, 0]);
  await until(S(0));
  await play(
    new M.LaggedStart(tileAll.map(o => new M.FadeIn(o)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.FadeIn(tileTag, { runTime: 0.8 }),
    ...say('TILE CAMERA CHECK')
  );

  // 1: can a bigger step miss where bright glaze turns dark?
  const edgeX = (colX(1) + colX(2)) / 2;
  const chipEdge = new M.DashedLine({
    start: [edgeX, rowY(1) + CELL / 2 + 0.08, 0.03],
    end: [edgeX, rowY(2) - CELL / 2 - 0.08, 0.03],
    color: C.amber,
  });
  chipEdge.setStrokeWidth(3.5);
  const edgeLabel = T('chip edge', P ? 15 : 14, C.amber, true, true);
  edgeLabel.moveTo([edgeX, rowY(0) + CELL / 2 + (P ? 0.58 : 0.52), 0]);
  await until(S(1));
  await play(new M.Create(chipEdge, { runTime: 0.8 }), new M.FadeIn(edgeLabel, { runTime: 0.7 }), ...say('CAN A BIG STEP MISS THE EDGE?', C.amber));

  // 2: four rows of four squares
  const rowLabels = [1, 2, 3, 4].map((n, r) => {
    const t = T(String(n), 15, r === 1 ? C.cyan : C.muted, true);
    t.moveTo([colX(-1) - CELL / 2 - 0.34, rowY(r), 0]);
    return t;
  });
  const colLabels = [1, 2, 3, 4].map((n, c) => {
    const t = T(String(n), 15, C.muted, true);
    t.moveTo([colX(c), rowY(0) + CELL / 2 + 0.24, 0]);
    return t;
  });
  await until(S(2));
  await play(
    new M.LaggedStart([...rowLabels, ...colLabels].map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.1 }),
    ...say('4 ROWS × 4 SQUARES')
  );

  // 3: bright glaze reads 4
  await until(S(3));
  await play(
    new M.LaggedStart(brightNums.map(t => new M.FadeIn(t)), { lagRatio: 0.05, runTime: 0.9 }),
    ...say('BRIGHT GLAZE = 4', C.cyan)
  );

  // 4: dark chip reads 1
  await until(S(4));
  await play(
    new M.LaggedStart(chipNums.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 0.8 }),
    ...say('DARK CHIP = 1', C.pink)
  );

  // 5: second row readings are 4, 4, 1, 1
  const row2Outline = new M.RoundedRectangle({
    width: 4 * CELL + 0.06,
    height: CELL + 0.06,
    cornerRadius: 0.08,
    color: C.cyan,
    strokeWidth: 2.2,
  });
  row2Outline.moveTo([GX, rowY(1), 0.01]);
  await until(S(5));
  for (let r = 0; r < 4; r++) {
    if (r === 1) continue;
    for (let c = 0; c < 4; c++) {
      const isChip = TILE[r][c] === 1;
      sqGrid[r][c].setFill(isChip ? C.pink : C.cyan, 0.07);
      sqGrid[r][c].setStrokeOpacity(0.28);
    }
  }
  await play(
    new M.FadeOut(tileTag, { runTime: 0.5 }),
    new M.Create(row2Outline, { runTime: 0.8 }),
    ...say('ROW 2:  4,  4,  1,  1', C.cyan)
  );

  // 6: short ruler covering two squares at a time
  const winBox = makeWin(0, C.amber);
  await until(S(6));
  await play(new M.Create(winBox, { runTime: 0.9 }), ...say('2-SQUARE RULER', C.amber));

  // 7: two-square strip is our filter
  await until(S(7));
  await play(new M.Indicate(winBox, { color: C.amber, runTime: 0.9 }), ...say('FILTER = 2-SQUARE STRIP', C.amber));

  // 8: start with filter over the first two fours -> introduce L.net beside fixed tile
  await until(S(8));
  await play(
    new M.FadeIn(N.group, { runTime: 0.9 }),
    new M.Indicate(sqGrid[1][0], { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(sqGrid[1][1], { color: C.cyan, runTime: 0.8 }),
    ...say('START ON FIRST TWO 4s', C.cyan)
  );

  // 9: take right reading away from left reading (cyan +1, pink -1)
  await until(S(9));
  await play(
    ...N.weight(0, 0, 0, 1),
    ...N.weight(0, 1, 0, -1),
    new M.FadeIn(wTop, { runTime: 0.7 }),
    new M.FadeIn(wBot, { runTime: 0.7 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '4', C.cyan),
    ...fbox(['filter: left − right', ['weights: +1 (cyan), −1 (pink)', C.muted]]),
    ...say('LEFT − RIGHT', C.cyan)
  );

  // 10: four minus four gives zero
  await until(S(10));
  await play(
    ...N.flow(0, C.amber),
    ...N.value(1, 0, '0', C.amber),
    ...fbox(['pair: 4, 4', ['4 − 4 = 0', C.amber]], C.amber),
    ...say('4 − 4 = 0', C.amber)
  );

  // 11: zero is the score for this pair
  const scoreTitle = T('scores', 15, C.muted, true);
  scoreTitle.moveTo([colX(-1) - CELL / 2 - 0.12, SCORE_Y, 0]);
  const s2_0 = makeScoreBadge(0, '0', C.amber);
  await until(S(11));
  await play(new M.FadeIn(scoreTitle, { runTime: 0.5 }), new M.FadeIn(s2_0, { runTime: 0.7 }), ...say('SCORE FOR PAIR 1 = 0', C.amber));

  // 12: move two squares right to the two ones
  const step2Arrow = new M.Arrow({
    start: [pairX(0), SCORE_Y + 0.34, 0],
    end: [pairX(2), SCORE_Y + 0.34, 0],
    color: C.amber,
    strokeWidth: 2.5,
  });
  const step2Lab = T('+2', 15, C.amber, true, true);
  step2Lab.moveTo([(pairX(0) + pairX(2)) / 2, SCORE_Y + 0.54, 0]);
  await until(S(12));
  await play(
    new M.Transform(winBox, makeWin(2, C.amber), { runTime: 0.85 }),
    new M.Create(step2Arrow, { runTime: 0.75 }),
    new M.FadeIn(step2Lab, { runTime: 0.6 }),
    ...N.value(0, 0, '1', C.pink),
    ...N.value(0, 1, '1', C.pink),
    ...say('MOVE 2 SQUARES RIGHT', C.amber)
  );

  // 13: one minus one gives another zero
  const s2_1 = makeScoreBadge(2, '0', C.amber);
  await until(S(13));
  await play(
    ...N.flow(0, C.amber),
    ...N.value(1, 0, '0', C.amber),
    new M.FadeIn(s2_1, { runTime: 0.7 }),
    ...fbox(['pair: 1, 1', ['1 − 1 = 0', C.amber], ['scores: 0, 0', C.muted]], C.amber),
    ...say('1 − 1 = 0', C.amber)
  );

  // 14: the size of each step is called the stride
  await until(S(14));
  await play(
    new M.Indicate(step2Arrow, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(step2Lab, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['stride = step size = 2', C.cyan], 'scores: 0, 0'], C.cyan),
    ...say('STRIDE = STEP SIZE', C.cyan)
  );

  // 15: stride of 2 checks both dark squares and skips the pair across the chip edge
  const skipBox = new M.RoundedRectangle({ width: 2 * CELL - 0.06, height: CELL - 0.02, cornerRadius: 0.10, color: C.pink, strokeWidth: 2.4 });
  skipBox.moveTo([pairX(1), rowY(1), 0.02]);
  const skipTag = pill('SKIPPED', C.pink, P ? 15 : 14);
  skipTag.moveTo([pairX(1), SCORE_Y, 0]);
  await until(S(15));
  await play(
    new M.Create(skipBox, { runTime: 0.8 }),
    new M.FadeIn(skipTag, { runTime: 0.7 }),
    new M.Indicate(chipEdge, { color: C.pink, runTime: 0.9 }),
    ...fbox(['stride = 2', ['skips middle pair [4, 1]', C.pink], 'chip edge missed!'], C.pink),
    ...say('STRIDE 2 SKIPS THE CHIP EDGE', C.pink)
  );

  // 16: start again and use a stride of one
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(s2_0, s2_1, step2Arrow, step2Lab, skipBox, skipTag), { runTime: 0.6 }),
    new M.Transform(winBox, makeWin(0, C.green), { runTime: 0.7 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '4', C.cyan),
    ...N.value(1, 0, '0', C.amber),
    ...fbox([['stride = 1', C.green], 'start at first two squares'], C.green),
    ...say('START AGAIN: STRIDE = 1', C.green)
  );

  // 17: the filter now fits in three places (trace all three positions: 0, middle, 0)
  const s1_0 = makeScoreBadge(0, '0', C.muted);
  const s1_2 = makeScoreBadge(2, '0', C.muted);
  await until(S(17));
  await play(new M.FadeIn(s1_0, { runTime: 0.5 }), ...say('3 FITTING POSITIONS', C.green));
  await play(new M.Transform(winBox, makeWin(1, C.green), { runTime: 0.55 }));
  await play(
    new M.Transform(winBox, makeWin(2, C.green), { runTime: 0.55 }),
    new M.FadeIn(s1_2, { runTime: 0.5 })
  );

  // 18: at the middle pair, four minus one gives three (pause on middle score)
  const s1_1 = makeScoreBadge(1, '3', C.green);
  await until(S(18));
  await play(
    new M.Transform(winBox, makeWin(1, C.green), { runTime: 0.6 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '1', C.pink),
    ...say('MIDDLE PAIR: 4 − 1 = 3', C.green)
  );
  await play(
    ...N.flow(0, C.green),
    ...N.value(1, 0, '3', C.green),
    new M.FadeIn(s1_1, { runTime: 0.6 }),
    ...fbox(['middle pair: 4, 1', ['4 − 1 = 3', C.green], 'scores: 0, 3, 0'], C.green)
  );

  // 19: a score above zero marks a drop in brightness from left to right
  await until(S(19));
  await play(
    new M.Indicate(s1_1, { color: C.amber, runTime: 0.9 }),
    new M.Indicate(chipEdge, { color: C.green, runTime: 0.9 }),
    ...fbox([['score > 0  →  brightness drop', C.green], '4 (bright) → 1 (dark)', 'scores: 0, 3, 0'], C.green),
    ...say('SCORE > 0 = BRIGHT → DARK DROP', C.green)
  );

  // 20: set the stride back to two
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(s1_0, s1_1, s1_2), { runTime: 0.5 }),
    new M.Transform(winBox, makeWin(0, C.amber), { runTime: 0.65 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '4', C.cyan),
    ...N.value(1, 0, ''),
    ...fbox([['stride = 2', C.amber]], C.amber),
    ...say('BACK TO STRIDE = 2', C.amber)
  );

  // 21: add one square at each end
  let padL = makePadSquare(-1), padR = makePadSquare(4);
  await until(S(21));
  await play(
    new M.FadeIn(padL.box, { runTime: 0.7 }),
    new M.FadeIn(padR.box, { runTime: 0.7 }),
    ...say('ADD 1 SQUARE AT EACH END', C.violet)
  );

  // 22: give each added square a zero
  await until(S(22));
  await play(
    new M.FadeIn(padL.zero, { runTime: 0.7 }),
    new M.FadeIn(padR.zero, { runTime: 0.7 }),
    ...say('GIVE EACH ADDED SQUARE A 0', C.violet)
  );

  // 23: those zeros come from us
  await until(S(23));
  await play(
    new M.FadeIn(padL.tag, { runTime: 0.6 }),
    new M.FadeIn(padR.tag, { runTime: 0.6 }),
    new M.Indicate(padL.zero, { color: C.violet, runTime: 0.7 }),
    new M.Indicate(padR.zero, { color: C.violet, runTime: 0.7 }),
    ...say('WE ADD THESE ZEROS: NOT IN THE PHOTO', C.violet)
  );

  // 24: the added squares are called padding
  await until(S(24));
  await play(
    ...fbox([['padding = 1 zero per end', C.violet], 'row: 0, 4, 4, 1, 1, 0'], C.violet),
    ...say('PADDING = BORDER SQUARES', C.violet)
  );

  // 25: start on the left zero, one square farther left than before
  const oldStart = new M.RoundedRectangle({ width: 2 * CELL - 0.04, height: CELL + 0.02, cornerRadius: 0.10, color: C.muted, strokeWidth: 1.8 });
  oldStart.moveTo([pairX(0), rowY(1), 0.015]);
  const shiftTag = T('1 square left', P ? 15 : 14, C.violet, true);
  shiftTag.moveTo([pairX(-1), SCORE_Y + 0.34, 0]);
  await until(S(25));
  await play(
    new M.FadeIn(oldStart, { runTime: 0.5 }),
    new M.Transform(winBox, makeWin(-1, C.violet), { runTime: 0.85 }),
    new M.FadeIn(shiftTag, { runTime: 0.6 }),
    ...N.value(0, 0, '0', C.violet),
    ...N.value(0, 1, '4', C.cyan),
    ...say('START 1 SQUARE FARTHER LEFT', C.violet)
  );

  // 26: zero minus four means taking four away from zero (number line with 4 hops left)
  const nlX = v => NL_X + (v + 2) * NL_SP; // v in [-4..0] centered at v = -2
  const nlLine = new M.Line({ start: [nlX(-4) - 0.25, NL_Y, 0], end: [nlX(0) + 0.25, NL_Y, 0], color: C.muted, strokeWidth: 2.2 });
  const nlTicks = [-4, -3, -2, -1, 0].map(v => new M.VGroup(
    new M.Line({ start: [nlX(v), NL_Y - 0.08, 0], end: [nlX(v), NL_Y + 0.08, 0], color: v === -4 ? C.pink : C.muted, strokeWidth: 2 }),
    T(v < 0 ? '−' + Math.abs(v) : '0', 15, v === -4 ? C.pink : (v === 0 ? C.violet : C.muted), true)
      .moveTo([nlX(v), NL_Y - 0.28, 0])
  ));
  const nlDot0 = new M.Dot({ point: [nlX(0), NL_Y, 0.02], radius: 0.08, color: C.violet });
  const nlHops = [0, -1, -2, -3].map(v => {
    const r = NL_SP / 2;
    const arc = new M.Arc({ radius: r, startAngle: 0, angle: Math.PI, color: C.pink, strokeWidth: 2.4 });
    arc.moveTo([(nlX(v) + nlX(v - 1)) / 2, NL_Y + r / 2, 0.01]);
    return arc;
  });
  await until(S(26));
  await play(
    new M.Create(nlLine, { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...nlTicks, nlDot0), { runTime: 0.5 }),
    ...fbox(['pair: 0, 4', ['0 − 4: 4 steps left from 0', C.pink]], C.pink),
    ...say('0 − 4: STEP 4 LEFT FROM 0', C.pink)
  );
  await play(new M.LaggedStart(nlHops.map(a => new M.Create(a)), { lagRatio: 0.35, runTime: 1.4 }));

  // 27: that gives a score of negative four
  const nlDotM4 = new M.Dot({ point: [nlX(-4), NL_Y, 0.03], radius: 0.10, color: C.pink });
  const sp_0 = makeScoreBadge(-1, '−4', C.pink);
  await until(S(27));
  await play(
    new M.FadeIn(nlDotM4, { runTime: 0.4 }),
    new M.Flash(nlDotM4, { color: C.pink, runTime: 0.6 }),
    ...N.flow(0, C.pink),
    ...N.value(1, 0, '−4', C.pink),
    new M.FadeIn(sp_0, { runTime: 0.6 }),
    ...fbox(['pair: 0, 4', ['0 − 4 = −4', C.pink]], C.pink),
    ...say('SCORE = −4', C.pink)
  );

  // 28: the new start changes which pairs the filter checks
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(oldStart, shiftTag, nlLine, ...nlTicks, nlDot0, nlDotM4, ...nlHops), { runTime: 0.7 }),
    ...fbox(['new start shifts every pair', 'stride = 2, padding = 1'], C.amber),
    ...say('NEW START → NEW PAIRS', C.amber)
  );

  // 29: next two-square step now lands on the four and the one at the chip edge
  await until(S(29));
  await play(
    new M.Transform(winBox, makeWin(1, C.green), { runTime: 0.85 }),
    new M.Indicate(chipEdge, { color: C.green, runTime: 0.9 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '1', C.pink),
    ...say('STEP 2 LANDS ON CHIP EDGE', C.green)
  );

  // 30: four minus one gives three
  const sp_1 = makeScoreBadge(1, '3', C.green);
  await until(S(30));
  await play(
    ...N.flow(0, C.green),
    ...N.value(1, 0, '3', C.green),
    new M.FadeIn(sp_1, { runTime: 0.6 }),
    ...fbox(['pair: 4, 1', ['4 − 1 = 3', C.green], 'scores: −4, 3'], C.green),
    ...say('4 − 1 = 3', C.green)
  );

  // 31: one more step puts the filter over the last one and the added zero
  await until(S(31));
  await play(
    new M.Transform(winBox, makeWin(3, C.amber), { runTime: 0.85 }),
    ...N.value(0, 0, '1', C.pink),
    ...N.value(0, 1, '0', C.violet),
    ...say('LAST STEP: 1 AND ADDED 0', C.violet)
  );

  // 32: one minus zero gives one
  const sp_2 = makeScoreBadge(3, '1', C.amber);
  await until(S(32));
  await play(
    ...N.flow(0, C.amber),
    ...N.value(1, 0, '1', C.amber),
    new M.FadeIn(sp_2, { runTime: 0.6 }),
    ...fbox(['pair: 1, 0', ['1 − 0 = 1', C.amber], 'scores: −4, 3, 1'], C.amber),
    ...say('1 − 0 = 1', C.amber)
  );

  // 33: that drop comes from the zero outside the photo
  await until(S(33));
  await play(
    new M.Indicate(padR.box, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(sp_2, { color: C.violet, runTime: 0.9 }),
    ...fbox(['1 − 0 = 1', ['drop is from added border 0', C.violet], 'scores: −4, 3, 1'], C.violet),
    ...say('DROP FROM ADDED ZERO', C.violet)
  );

  // 34: how many scores will you get?
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(sp_0, sp_1, sp_2, scoreTitle), { runTime: 0.55 }),
    ...fbox([['how many scores will fit?', C.amber]], C.amber),
    ...say('HOW MANY SCORES?', C.amber)
  );

  // 35: hide the padding and use a stride of two
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(padL.box, padL.zero, padL.tag, padR.box, padR.zero, padR.tag), { runTime: 0.6 }),
    new M.Transform(winBox, makeWin(0, C.cyan), { runTime: 0.7 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '4', C.cyan),
    ...N.value(1, 0, '0', C.amber),
    ...fbox(['no padding: row width = 4', 'filter = 2,  stride = 2'], C.cyan),
    ...say('NO PADDING, STRIDE = 2', C.cyan)
  );

  // 36: the filter makes one score before it moves
  const pos1 = makePosMark(0, '#1', C.amber);
  await until(S(36));
  await play(
    new M.FadeIn(pos1, { runTime: 0.65 }),
    ...fbox(['first position → 1 score', ['before any move', C.amber]], C.amber),
    ...say('1 SCORE BEFORE MOVING', C.amber)
  );

  // 37: one full move gives a second score
  const mv2Arrow = new M.Arrow({
    start: [pairX(0), SCORE_Y + 0.34, 0],
    end: [pairX(2), SCORE_Y + 0.34, 0],
    color: C.green,
    strokeWidth: 2.5,
  });
  const pos2 = makePosMark(2, '#2', C.green);
  await until(S(37));
  await play(
    new M.Transform(winBox, makeWin(2, C.green), { runTime: 0.75 }),
    new M.Create(mv2Arrow, { runTime: 0.65 }),
    new M.FadeIn(pos2, { runTime: 0.65 }),
    ...N.value(0, 0, '1', C.pink),
    ...N.value(0, 1, '1', C.pink),
    ...fbox(['first position = 1', 'full moves     = 1', ['1 + 1 = 2 scores', C.green]], C.green),
    ...say('1 FULL MOVE → 2 SCORES', C.green)
  );

  // 38: bring back the padding (short beat: 1.37s)
  padL = makePadSquare(-1);
  padR = makePadSquare(4);
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(pos1, pos2, mv2Arrow), { runTime: 0.5 }),
    new M.FadeIn(padL.box, { runTime: 0.5 }),
    new M.FadeIn(padL.zero, { runTime: 0.5 }),
    new M.FadeIn(padR.box, { runTime: 0.5 }),
    new M.FadeIn(padR.zero, { runTime: 0.5 }),
    new M.Transform(winBox, makeWin(-1, C.violet), { runTime: 0.6 }),
    ...N.value(0, 0, '0', C.violet),
    ...N.value(0, 1, '4', C.cyan),
    ...N.value(1, 0, '−4', C.pink),
    ...say('PADDING BACK: 6 SQUARES', C.violet)
  );

  // 39: six squares minus the two covered by the filter leaves four squares to move
  const brk4 = makeBracket(1, 4, SCORE_Y + 0.16, '4 squares to move', C.amber);
  await until(S(39));
  await play(
    new M.FadeIn(brk4, { runTime: 0.8 }),
    ...fbox(['row with padding = 6', 'filter covers    = 2', ['6 − 2 = 4 squares to move', C.amber]], C.amber),
    ...say('6 − 2 = 4 SQUARES TO MOVE', C.amber)
  );

  // 40: four divided by two tells you how many two-square moves fit
  const mvP1 = new M.Arrow({ start: [pairX(-1), SCORE_Y + 0.42, 0], end: [pairX(1), SCORE_Y + 0.42, 0], color: C.cyan, strokeWidth: 2.5 });
  const mvP2 = new M.Arrow({ start: [pairX(1), SCORE_Y + 0.42, 0], end: [pairX(3), SCORE_Y + 0.42, 0], color: C.cyan, strokeWidth: 2.5 });
  await until(S(40));
  await play(
    new M.Create(mvP1, { runTime: 0.6 }),
    new M.Transform(winBox, makeWin(1, C.cyan), { runTime: 0.6 }),
    ...fbox(['room to move = 4', 'stride       = 2', ['4 ÷ 2 = 2 full moves', C.cyan]], C.cyan),
    ...say('4 ÷ 2 = 2 MOVES FIT', C.cyan)
  );
  await play(
    new M.Create(mvP2, { runTime: 0.6 }),
    new M.Transform(winBox, makeWin(3, C.cyan), { runTime: 0.6 })
  );

  // 41: two moves plus the first position give three scores
  const pp1 = makePosMark(-1, '#1', C.green);
  const pp2 = makePosMark(1, '#2', C.green);
  const pp3 = makePosMark(3, '#3', C.green);
  await until(S(41));
  await play(
    new M.FadeOut(brk4, { runTime: 0.45 }),
    new M.LaggedStart([new M.FadeIn(pp1), new M.FadeIn(pp2), new M.FadeIn(pp3)], { lagRatio: 0.25, runTime: 1.0 }),
    ...fbox(['full moves = 2', 'first pos  = +1', ['2 + 1 = 3 scores', C.green]], C.green),
    ...say('2 MOVES + 1 START = 3 SCORES', C.green)
  );

  // 42: hide the padding again and try a stride of three
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(padL.box, padL.zero, padR.box, padR.zero, mvP1, mvP2, pp1, pp2, pp3), { runTime: 0.55 }),
    new M.Transform(winBox, makeWin(0, C.pink), { runTime: 0.7 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '4', C.cyan),
    ...N.value(1, 0, '0', C.amber),
    ...fbox(['no padding: row = 4, filter = 2', ['try stride = 3', C.pink]], C.pink),
    ...say('NO PADDING, STRIDE = 3', C.pink)
  );

  // 43: four minus two leaves only two squares to move
  const brk2 = makeBracket(2, 3, SCORE_Y + 0.16, 'only 2 squares left', C.amber);
  await until(S(43));
  await play(
    new M.FadeIn(brk2, { runTime: 0.75 }),
    ...fbox(['row = 4,  filter = 2', ['4 − 2 = 2 squares to move', C.amber]], C.amber),
    ...say('4 − 2 = 2 SQUARES TO MOVE', C.amber)
  );

  // 44: three-square step cannot fit, so only the first position gives a score
  const ghostX = pairX(3), ghostY = rowY(1), gw = 2 * CELL - 0.04, gh = CELL + 0.02;
  const gTop = new M.DashedLine({ start: [ghostX - gw / 2, ghostY + gh / 2, 0.02], end: [ghostX + gw / 2, ghostY + gh / 2, 0.02], color: C.pink });
  const gBot = new M.DashedLine({ start: [ghostX - gw / 2, ghostY - gh / 2, 0.02], end: [ghostX + gw / 2, ghostY - gh / 2, 0.02], color: C.pink });
  const gLft = new M.DashedLine({ start: [ghostX - gw / 2, ghostY - gh / 2, 0.02], end: [ghostX - gw / 2, ghostY + gh / 2, 0.02], color: C.pink });
  const gRgt = new M.DashedLine({ start: [ghostX + gw / 2, ghostY - gh / 2, 0.02], end: [ghostX + gw / 2, ghostY + gh / 2, 0.02], color: C.pink });
  const ghostWin = new M.VGroup(gTop, gBot, gLft, gRgt);
  const badStep = new M.Arrow({ start: [pairX(0), SCORE_Y + 0.44, 0], end: [pairX(3), SCORE_Y + 0.44, 0], color: C.pink, strokeWidth: 2.5 });
  const only1 = makePosMark(0, '#1', C.amber);
  await until(S(44));
  await play(
    new M.FadeIn(ghostWin, { runTime: 0.7 }),
    new M.Create(badStep, { runTime: 0.7 }),
    new M.FadeIn(only1, { runTime: 0.6 }),
    ...fbox(['2 ÷ 3 = 0.67 → 0 full moves', ['0 + 1 = 1 score only', C.pink]], C.pink),
    ...say('STEP OF 3 DOES NOT FIT', C.pink)
  );

  // 45: subtract filter width from row width (including padding)
  await until(S(45));
  await play(
    new M.FadeOut(new M.VGroup(brk2, ghostWin, badStep, only1), { runTime: 0.6 }),
    ...fbox([['1) row width − filter width', C.cyan], ['   (include any padding)', C.muted]], C.cyan),
    ...say('STEP 1: WIDTH − FILTER', C.cyan)
  );

  // 46: divide by the stride (short beat: 1.53s)
  await until(S(46));
  await play(
    ...fbox(['1) row width − filter width', ['2) ÷ stride', C.amber]], C.amber),
    ...say('STEP 2: DIVIDE BY STRIDE', C.amber)
  );

  // 47: round down to count only full moves
  await until(S(47));
  await play(
    ...fbox(['1) row width − filter width', '2) ÷ stride', ['3) round down (full moves)', C.violet]], C.violet),
    ...say('STEP 3: ROUND DOWN', C.violet)
  );

  // 48: add one for the score at the first position
  await until(S(48));
  await play(
    ...fbox(['scores =', ['  floor((width − filter) ÷ stride)', C.cyan], ['  + 1', C.green]], C.green),
    ...say('STEP 4: ADD 1 FOR START', C.green)
  );

  // 49: use the rule to predict how many scores you will get
  await until(S(49));
  await play(
    ...fbox([
      'scores = 1 + floor((w − f) ÷ s)',
      ['no pad: 1 + floor((4−2)÷2) = 2', C.cyan],
      ['padded: 1 + floor((6−2)÷2) = 3', C.violet],
    ], C.cyan),
    ...say('PREDICT THE SCORE COUNT', C.cyan)
  );

  // 50: look at the pairs to see whether the filter crosses the edge you care about
  padL = makePadSquare(-1);
  padR = makePadSquare(4);
  await until(S(50));
  await play(
    new M.FadeIn(padL.box, { runTime: 0.55 }),
    new M.FadeIn(padL.zero, { runTime: 0.55 }),
    new M.FadeIn(padR.box, { runTime: 0.55 }),
    new M.FadeIn(padR.zero, { runTime: 0.55 }),
    new M.Transform(winBox, makeWin(1, C.green), { runTime: 0.8 }),
    new M.Indicate(chipEdge, { color: C.green, runTime: 0.9 }),
    ...N.value(0, 0, '4', C.cyan),
    ...N.value(0, 1, '1', C.pink),
    ...N.value(1, 0, '3', C.green),
    ...say('CHECK IF A PAIR CROSSES THE EDGE', C.green)
  );

  // 51: stride sets the step size, and padding adds border squares that can change which pairs the filter checks
  await until(S(51));
  await play(
    new M.Indicate(winBox, { color: C.amber, runTime: 0.9 }),
    new M.Indicate(padL.box, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(padR.box, { color: C.violet, runTime: 0.9 }),
    ...fbox([
      ['stride  = step size', C.amber],
      ['padding = border squares', C.violet],
      ['scores  = 1 + floor((w−f)÷s)', C.green],
    ], C.green),
    ...say('STRIDE = STEP  ·  PADDING = BORDER', C.green)
  );
}
