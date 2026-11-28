// 17.3.5 Receptive fields: How far back can a score see?
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared 4x4 ceramics tile brightness grid (chapters/17.3.md)
  const GRID = [
    [4, 4, 4, 4],
    [4, 4, 1, 1],
    [4, 4, 1, 1],
    [4, 4, 4, 4],
  ];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CELL = P ? 0.54 : 0.72;
  const PHOTO_C = P ? [0, 0.35, 0] : [-4.7, -0.55, 0];
  const NET_C = P ? [0.15, -3.85, 0] : [-0.25, -0.55, 0];
  const NET_W = P ? 5.0 : 4.0;
  const NET_H = P ? 2.7 : 2.65;
  const NR = 0.27;
  const PILL = P ? [0, 2.15, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.38, 0] : [4.75, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box (one at a time, replaces the previous one)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.35 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.6, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 3.75;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Tile photo geometry helpers
  const photoX = c => PHOTO_C[0] + (c - 1.5) * CELL;
  const photoY = r => PHOTO_C[1] + (1.5 - r) * CELL;
  const photoPos = (r, c, z = 0) => [photoX(c), photoY(r), z];

  function photoBox(r, c0, c1, color, pad = 0.04, fillOp = 0) {
    const w = (c1 - c0 + 1) * CELL + pad * 2;
    const h = CELL + pad * 2;
    const cx = (photoX(c0) + photoX(c1)) / 2;
    const cy = photoY(r);
    const rect = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color, strokeWidth: 3.5 });
    rect.setFill(color, fillOp);
    rect.moveTo([cx, cy, 0.02]);
    return rect;
  }

  function dashedBox(cx, cy, w, h, color, strokeWidth = 3.2) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    return new M.VGroup(
      new M.DashedLine({ start: [x0, y1, 0.025], end: [x1, y1, 0.025], color, strokeWidth }),
      new M.DashedLine({ start: [x1, y1, 0.025], end: [x1, y0, 0.025], color, strokeWidth }),
      new M.DashedLine({ start: [x1, y0, 0.025], end: [x0, y0, 0.025], color, strokeWidth }),
      new M.DashedLine({ start: [x0, y0, 0.025], end: [x0, y1, 0.025], color, strokeWidth })
    );
  }

  function photoDashedBox(r, c0, c1, color, pad = 0.08) {
    const w = (c1 - c0 + 1) * CELL + pad * 2;
    const h = CELL + pad * 2;
    return dashedBox((photoX(c0) + photoX(c1)) / 2, photoY(r), w, h, color);
  }

  // Build fixed 4x4 tile photo parts (cells, chip hatch marks, brightness numbers, row labels)
  const cells = [], nums = [], hatches = [];
  for (let r = 0; r < 4; r++) {
    cells.push([]); nums.push([]);
    for (let c = 0; c < 4; c++) {
      const v = GRID[r][c], isChip = v === 1;
      const sq = new M.Rectangle({ width: CELL - 0.04, height: CELL - 0.04, color: isChip ? C.pink : C.cyan, strokeWidth: 1.6 });
      sq.setFill(isChip ? '#181c36' : '#26466b', isChip ? 0.96 : 0.88);
      sq.moveTo(photoPos(r, c, 0));
      cells[r].push(sq);

      if (isChip) {
        const d = CELL * 0.34, cx = photoX(c), cy = photoY(r);
        const h1 = new M.Line({ start: [cx - d, cy - d, 0.005], end: [cx - 0.6 * d, cy - 0.6 * d, 0.005], color: C.pink, strokeWidth: 1.2 });
        h1.setStrokeOpacity(0.28);
        const h2 = new M.Line({ start: [cx + 0.6 * d, cy + 0.6 * d, 0.005], end: [cx + d, cy + d, 0.005], color: C.pink, strokeWidth: 1.2 });
        h2.setStrokeOpacity(0.28);
        hatches.push(h1, h2);
      }

      const tx = T(String(v), P ? 20 : 22, isChip ? C.pink : C.ink, true, true);
      tx.moveTo(photoPos(r, c, 0.01));
      nums[r].push(tx);
    }
  }
  const rowLabs = [0, 1, 2, 3].map(r => {
    const t = T(`R${r + 1}`, P ? 13 : 14, r === 1 ? C.amber : C.muted, true);
    t.moveTo([PHOTO_C[0] - 2 * CELL - (P ? 0.32 : 0.34), photoY(r), 0]);
    return t;
  });
  const colLabs = [0, 1, 2, 3].map(c => {
    const t = T(String(c + 1), P ? 15 : 16, C.cyan, true, true);
    t.moveTo([photoX(c), PHOTO_C[1] + 2 * CELL + (P ? 0.24 : 0.28), 0]);
    return t;
  });
  const photoTitle = T('4×4 tile photo', P ? 15 : 16, C.muted);
  photoTitle.moveTo([PHOTO_C[0], P ? PHOTO_C[1] - 2 * CELL - 0.25 : PHOTO_C[1] + 2 * CELL + 0.62, 0]);

  // Neural network via engine helper L.net(...) (3 columns: Row 2 [4], Layer 1 [3], Final [2])
  const N = L.net({
    layers: [4, 3, 2],
    center: NET_C,
    width: NET_W,
    height: NET_H,
    r: NR,
    color: C.cyan,
  });

  const styleWeight = (ln, w) => {
    const a = Math.min(1, Math.abs(w));
    ln.setColor(w < 0 ? C.pink : C.cyan);
    ln.setStrokeWidth(1.5 + 4 * a);
    ln.setStrokeOpacity(0.35 + 0.6 * a);
  };

  // Pre-style all convolution edges after the first pair (which uses N.weight interactively)
  styleWeight(N.edges[0][1][1], 1);
  styleWeight(N.edges[0][2][1], -1);
  styleWeight(N.edges[0][2][2], 1);
  styleWeight(N.edges[0][3][2], -1);
  styleWeight(N.edges[1][0][0], 1);
  styleWeight(N.edges[1][1][0], -1);
  styleWeight(N.edges[1][1][1], 1);
  styleWeight(N.edges[1][2][1], -1);

  const convEdges = [
    N.edges[0][0][0], N.edges[0][1][0],
    N.edges[0][1][1], N.edges[0][2][1],
    N.edges[0][2][2], N.edges[0][3][2],
    N.edges[1][0][0], N.edges[1][1][0],
    N.edges[1][1][1], N.edges[1][2][1],
  ];

  const netHeadY = NET_C[1] + NET_H / 2 + NR + (P ? 0.34 : 0.32);
  const headL0 = T('Row 2', P ? 15 : 16, C.violet, true, true); headL0.moveTo([N.pos(0, 0)[0], netHeadY, 0]);
  const headL1 = T('Layer 1', P ? 15 : 16, C.cyan, true, true); headL1.moveTo([N.pos(1, 0)[0], netHeadY, 0]);
  const headL2 = T('Final', P ? 15 : 16, C.amber, true, true); headL2.moveTo([N.pos(2, 0)[0], netHeadY, 0]);

  function netWinBox(l, i0, i1, color = C.amber) {
    const a = N.pos(l, i0), b = N.pos(l, i1);
    const w = NR * 2 + 0.24, h = Math.abs(a[1] - b[1]) + NR * 2 + 0.22;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 3 });
    r.setFill(color, 0.06);
    r.moveTo([a[0], (a[1] + b[1]) / 2, 0.02]);
    return r;
  }

  function nodeRing(l, i, color = C.amber) {
    const c = new M.Circle({ radius: NR + 0.08, color, strokeWidth: 3.5 });
    c.moveTo([N.pos(l, i)[0], N.pos(l, i)[1], 0.02]);
    return c;
  }

  function trailLine(l1, j, l0, i, color, dashed = false) {
    const a = N.pos(l1, j), b = N.pos(l0, i);
    const start = [a[0] - NR, a[1], 0.02], end = [b[0] + NR, b[1], 0.02];
    return dashed
      ? new M.DashedLine({ start, end, color, strokeWidth: 4.5 })
      : new M.Line({ start, end, color, strokeWidth: 4.5 });
  }

  // --- Beat 0: A tile workshop tests a camera to find a dark chip. ---
  await until(S(0));
  await play(
    new M.LaggedStart(cells.flat().map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...hatches, photoTitle)),
    ...say('TILE PHOTO: FIND THE DARK CHIP', C.cyan)
  );

  // --- Beat 1: The camera reads the brightness of each square in the photo. ---
  await until(S(1));
  await play(
    new M.LaggedStart(nums.flat().map(t => new M.FadeIn(t)), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('BRIGHTNESS READING IN EACH SQUARE', C.cyan)
  );

  // --- Beat 2: Four means the tile’s light coating. ---
  await until(S(2));
  await play(
    new M.Indicate(cells[0][0], { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(cells[1][0], { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(cells[1][1], { color: C.cyan, runTime: 0.8 }),
    ...say('4 = LIGHT COATING', C.cyan)
  );

  // --- Beat 3: One means the dark chip. ---
  await until(S(3));
  await play(
    new M.Indicate(cells[1][2], { color: C.pink, runTime: 0.8 }),
    new M.Indicate(cells[1][3], { color: C.pink, runTime: 0.8 }),
    new M.Indicate(cells[2][2], { color: C.pink, runTime: 0.8 }),
    new M.Indicate(cells[2][3], { color: C.pink, runTime: 0.8 }),
    ...say('1 = DARK CHIP', C.pink)
  );

  // --- Beat 4: In the second row, you read four, four, one, one. ---
  const row2Outline = photoBox(1, 0, 3, C.amber, 0.05, 0.05);
  await until(S(4));
  await play(
    new M.Create(row2Outline, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...rowLabs)),
    new M.LaggedStart(nums[1].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.25, runTime: 1.6 }),
    ...say('ROW 2:  4,  4,  1,  1', C.amber)
  );

  // --- Beat 5: The camera uses readings to calculate numbers called scores. ---
  const r2Vals = [4, 4, 1, 1];
  await until(S(5));
  await play(
    new M.FadeIn(headL0),
    new M.LaggedStart(N.nodes[0].map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 0.9 }),
    ...r2Vals.flatMap((v, i) => N.value(0, i, v, v === 1 ? C.pink : C.ink)),
    ...say('READINGS → SCORES', C.cyan)
  );

  // --- Beat 6: Which squares in the photo can change a final score? ---
  await until(S(6));
  await play(
    new M.FadeIn(headL2),
    new M.LaggedStart(N.nodes[2].map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 0.8 }),
    ...N.value(2, 0, '?', C.muted),
    ...N.value(2, 1, '?', C.muted),
    ...say('WHICH SQUARES CHANGE A FINAL SCORE?', C.amber)
  );

  // --- Beat 7: Imagine a strip that covers two squares side by side. ---
  const photoWin = photoBox(1, 0, 1, C.amber, 0.05, 0.08);
  const netWin = netWinBox(0, 0, 1, C.amber);
  await until(S(7));
  await play(
    new M.FadeOut(row2Outline),
    new M.Create(photoWin, { runTime: 0.8 }),
    new M.Create(netWin, { runTime: 0.8 }),
    ...say('A 2-SQUARE STRIP', C.amber)
  );

  // --- Beat 8: The strip keeps the left number and takes away the right number. ---
  await until(S(8));
  await play(
    ...fbox(['2-square strip:', ['left − right', C.amber]], C.amber),
    ...say('KEEP LEFT,  SUBTRACT RIGHT', C.cyan)
  );

  // --- Beat 9: We call this strip a filter. ---
  await until(S(9));
  await play(
    new M.Indicate(photoWin, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(netWin, { color: C.amber, runTime: 0.8 }),
    ...say('FILTER', C.amber)
  );

  // --- Beat 10: Place the filter over the first two fours. ---
  await until(S(10));
  await play(
    new M.FadeIn(headL1),
    new M.FadeIn(N.nodes[1][0]),
    new M.Create(N.edges[0][0][0], { runTime: 0.7 }),
    new M.Create(N.edges[0][1][0], { runTime: 0.7 }),
    ...say('FILTER OVER 4 AND 4', C.cyan)
  );

  // --- Beat 11: Two numbers called weights tell the filter how to use the readings. ---
  await until(S(11));
  await play(
    ...fbox(['Filter weights:', ['+1  (left)', C.cyan], ['−1  (right)', C.pink]], C.cyan),
    ...say('WEIGHTS:  +1  AND  −1', C.cyan)
  );

  // --- Beat 12: A weight of one keeps the left four as four. ---
  const p00 = N.pos(0, 0), p10 = N.pos(1, 0), p01 = N.pos(0, 1);
  const wPlusTag = T('+1', 16, C.cyan, true, true);
  wPlusTag.moveTo([(p00[0] + p10[0]) / 2, (p00[1] + p10[1]) / 2 + 0.24, 0]);
  await until(S(12));
  await play(
    ...N.weight(0, 0, 0, 1),
    new M.FadeIn(wPlusTag),
    ...fbox(['Window 1:  4, 4', ['4 × (+1) = 4', C.cyan]], C.cyan),
    ...say('4 × (+1) = 4', C.cyan)
  );

  // --- Beat 13: A weight of negative one turns the right four into negative four. ---
  const wMinusTag = T('−1', 16, C.pink, true, true);
  wMinusTag.moveTo([(p01[0] + p10[0]) / 2, (p01[1] + p10[1]) / 2 - 0.24, 0]);
  await until(S(13));
  await play(
    ...N.weight(0, 1, 0, -1),
    new M.FadeIn(wMinusTag),
    ...fbox(['Window 1:  4, 4', ['4 × (+1) =  4', C.cyan], ['4 × (−1) = −4', C.pink]], C.pink),
    ...say('4 × (−1) = −4', C.pink)
  );

  // --- Beat 14: Adding four and negative four is four minus four, which gives zero. ---
  await until(S(14));
  await play(
    ...N.value(1, 0, '0', C.amber),
    new M.Flash(N.nodes[1][0], { color: C.amber }),
    ...fbox(['4 + (−4)', '= 4 − 4', ['= 0', C.amber]], C.amber),
    ...say('4 − 4 = 0', C.amber)
  );

  // --- Beat 15: Move one square right to the four and the one. ---
  await until(S(15));
  await play(
    new M.Transform(photoWin, photoBox(1, 1, 2, C.amber, 0.05, 0.08), { runTime: 0.9 }),
    new M.Transform(netWin, netWinBox(0, 1, 2, C.amber), { runTime: 0.9 }),
    new M.FadeIn(N.nodes[1][1]),
    new M.Create(N.edges[0][1][1], { runTime: 0.8 }),
    new M.Create(N.edges[0][2][1], { runTime: 0.8 }),
    ...N.value(1, 1, '?', C.muted),
    ...fbox(['Window 2:  4, 1', ['4 − 1 = ?', C.amber]], C.amber),
    ...say('MOVE RIGHT:  4  AND  1', C.cyan)
  );

  // --- Beat 16: Four minus one gives three. ---
  await until(S(16));
  await play(
    ...N.value(1, 1, '3', C.amber),
    new M.Flash(N.nodes[1][1], { color: C.amber }),
    ...fbox(['Window 2:  4, 1', ['4 − 1 = 3', C.amber]], C.amber),
    ...say('4 − 1 = 3', C.amber)
  );

  // --- Beat 17: Move right again to the two ones. ---
  await until(S(17));
  await play(
    new M.Transform(photoWin, photoBox(1, 2, 3, C.amber, 0.05, 0.08), { runTime: 0.8 }),
    new M.Transform(netWin, netWinBox(0, 2, 3, C.amber), { runTime: 0.8 }),
    new M.FadeIn(N.nodes[1][2]),
    new M.Create(N.edges[0][2][2], { runTime: 0.7 }),
    new M.Create(N.edges[0][3][2], { runTime: 0.7 }),
    ...say('MOVE RIGHT:  1  AND  1', C.cyan)
  );

  // --- Beat 18: One minus one gives zero. ---
  await until(S(18));
  await play(
    ...N.value(1, 2, '0', C.amber),
    new M.Flash(N.nodes[1][2], { color: C.amber }),
    ...fbox(['Window 3:  1, 1', ['1 − 1 = 0', C.amber]], C.amber),
    ...say('1 − 1 = 0', C.amber)
  );

  // --- Beat 19: The first layer gives zero, three, zero. ---
  const l1Box = netWinBox(1, 0, 2, C.cyan);
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(photoWin, netWin, wPlusTag, wMinusTag)),
    new M.Create(l1Box, { runTime: 0.7 }),
    new M.LaggedStart(N.nodes[1].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['Layer 1 scores:', ['0,  3,  0', C.cyan]], C.cyan),
    ...say('LAYER 1:  0,  3,  0', C.cyan)
  );

  // --- Beat 20: Here, each layer is one step that makes a row of scores. ---
  await until(S(20));
  await play(
    new M.FadeOut(l1Box),
    new M.Indicate(headL0, { color: C.violet, runTime: 0.8 }),
    new M.Indicate(headL1, { color: C.cyan, runTime: 0.8 }),
    ...say('EACH LAYER MAKES A ROW OF SCORES', C.muted)
  );

  // --- Beat 21: The second layer uses the same filter on those scores. ---
  const netWin2 = netWinBox(1, 0, 1, C.amber);
  await until(S(21));
  await play(
    new M.Create(netWin2, { runTime: 0.8 }),
    ...fbox(['Layer 2 (same filter):', ['left − right', C.amber]], C.amber),
    ...say('LAYER 2: SAME FILTER (+1, −1)', C.amber)
  );

  // --- Beat 22: Start with zero and three. ---
  await until(S(22));
  await play(
    new M.Create(N.edges[1][0][0], { runTime: 0.7 }),
    new M.Create(N.edges[1][1][0], { runTime: 0.7 }),
    ...say('START WITH 0 AND 3', C.cyan)
  );

  // --- Beat 23: Zero minus three gives negative three. ---
  await until(S(23));
  await play(
    ...N.value(2, 0, '−3', C.pink),
    new M.Flash(N.nodes[2][0], { color: C.pink }),
    ...fbox(['Left final:  0, 3', ['0 − 3 = −3', C.pink]], C.pink),
    ...say('0 − 3 = −3', C.pink)
  );

  // --- Beat 24: That is three below zero. ---
  const nlC = P ? [0, -6.2, 0] : [4.75, -2.1, 0];
  const nlSpan = P ? 5.2 : 3.2;
  const nlX = v => nlC[0] + (v / 4) * (nlSpan / 2);
  const nlBase = new M.Line({ start: [nlX(-4), nlC[1], 0], end: [nlX(4), nlC[1], 0], color: C.muted, strokeWidth: 2 });
  const nlTicks = [-3, 0, 3].map(v => new M.VGroup(
    new M.Line({ start: [nlX(v), nlC[1] - 0.08, 0], end: [nlX(v), nlC[1] + 0.08, 0], color: v === -3 ? C.pink : C.muted, strokeWidth: 2 }),
    T(v < 0 ? `−${-v}` : String(v), 15, v === -3 ? C.pink : C.muted, true).moveTo([nlX(v), nlC[1] - 0.28, 0])
  ));
  const nlBar = new M.Line({ start: [nlX(0), nlC[1] + 0.16, 0], end: [nlX(-3), nlC[1] + 0.16, 0], color: C.pink, strokeWidth: 3.5 });
  const nlTip1 = new M.Line({ start: [nlX(-3) + 0.12, nlC[1] + 0.25, 0], end: [nlX(-3), nlC[1] + 0.16, 0], color: C.pink, strokeWidth: 3 });
  const nlTip2 = new M.Line({ start: [nlX(-3) + 0.12, nlC[1] + 0.07, 0], end: [nlX(-3), nlC[1] + 0.16, 0], color: C.pink, strokeWidth: 3 });
  const nlDot = new M.Dot({ point: [nlX(-3), nlC[1], 0], radius: 0.09, color: C.pink });
  const numLineGroup = new M.VGroup(nlBase, ...nlTicks, nlBar, nlTip1, nlTip2, nlDot);
  await until(S(24));
  await play(
    new M.FadeIn(numLineGroup, { runTime: 0.8 }),
    ...say('−3 = THREE BELOW ZERO', C.pink)
  );

  // --- Beat 25: Move one place right to three and zero. ---
  await until(S(25));
  await play(
    new M.FadeOut(numLineGroup),
    new M.Transform(netWin2, netWinBox(1, 1, 2, C.amber), { runTime: 0.9 }),
    new M.Create(N.edges[1][1][1], { runTime: 0.8 }),
    new M.Create(N.edges[1][2][1], { runTime: 0.8 }),
    ...say('MOVE RIGHT:  3  AND  0', C.cyan)
  );

  // --- Beat 26: Three minus zero gives three. ---
  await until(S(26));
  await play(
    ...N.value(2, 1, '3', C.amber),
    new M.Flash(N.nodes[2][1], { color: C.amber }),
    ...fbox(['Right final:  3, 0', ['3 − 0 = 3', C.amber]], C.amber),
    ...say('3 − 0 = 3', C.amber)
  );

  // --- Beat 27: The final scores are negative three on the left and three on the right. ---
  const leftLab = T('left', P ? 14 : 15, C.pink, true);
  leftLab.moveTo([N.pos(2, 0)[0] + NR + 0.42, N.pos(2, 0)[1], 0]);
  const rightLab = T('right', P ? 14 : 15, C.amber, true);
  rightLab.moveTo([N.pos(2, 1)[0] + NR + 0.46, N.pos(2, 1)[1], 0]);
  await until(S(27));
  await play(
    new M.FadeOut(netWin2),
    new M.FadeIn(new M.VGroup(leftLab, rightLab)),
    new M.Indicate(N.nodes[2][0], { color: C.pink, runTime: 0.9 }),
    new M.Indicate(N.nodes[2][1], { color: C.amber, runTime: 0.9 }),
    ...fbox(['Final scores:', ['left  = −3', C.pink], ['right =  3', C.amber]], C.amber),
    ...say('FINAL SCORES:  −3 (LEFT),  3 (RIGHT)', C.amber)
  );

  // --- Beat 28: Think of the links as trails you can follow back to the photo. ---
  const dimEdges = convEdges.map(ln => {
    const t = ln.copy();
    t.setColor(C.muted); t.setStrokeWidth(2); t.setStrokeOpacity(0.26);
    return new M.Transform(ln, t, { runTime: 0.9 });
  });
  await until(S(28));
  await play(...dimEdges, ...say('FOLLOW THE LINKS BACK TO THE PHOTO', C.violet));

  // --- Beat 29: Each trail shows where a score gets its numbers. ---
  await until(S(29));
  await play(
    new M.LaggedStart(N.nodes[0].map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('WHERE DOES EACH SCORE GET ITS NUMBERS?', C.violet)
  );

  // --- Beat 30: Start at the left-hand final score. ---
  const lStartRing = nodeRing(2, 0, C.amber);
  await until(S(30));
  await play(
    new M.Create(lStartRing, { runTime: 0.7 }),
    ...fbox(['Trace: left final (−3)', ['start at −3', C.amber]], C.amber),
    ...say('START: LEFT FINAL SCORE (−3)', C.amber)
  );

  // --- Beat 31: Follow the first trail to the first score in the earlier layer. ---
  const lt1A = trailLine(2, 0, 1, 0, C.cyan, false);
  const lt1MidRing = nodeRing(1, 0, C.cyan);
  await until(S(31));
  await play(
    new M.Create(lt1A, { runTime: 0.9 }),
    new M.Create(lt1MidRing, { runTime: 0.6 }),
    ...say('TRAIL 1 → FIRST EARLIER SCORE (0)', C.cyan)
  );

  // --- Beat 32: That score uses photo columns one and two. ---
  const lt1B1 = trailLine(1, 0, 0, 0, C.cyan, false);
  const lt1B2 = trailLine(1, 0, 0, 1, C.cyan, false);
  const lt1Photo = photoBox(1, 0, 1, C.cyan, 0.04, 0.12);
  await until(S(32));
  await play(
    new M.Create(lt1B1, { runTime: 0.8 }),
    new M.Create(lt1B2, { runTime: 0.8 }),
    new M.Create(lt1Photo, { runTime: 0.8 }),
    new M.FadeIn(colLabs[0]),
    new M.FadeIn(colLabs[1]),
    ...fbox(['Left final (−3):', ['trail 1 → cols 1, 2', C.cyan]], C.cyan),
    ...say('TRAIL 1 → COLUMNS 1 AND 2', C.cyan)
  );

  // --- Beat 33: Follow the other trail to the middle score. ---
  const lt2A = trailLine(2, 0, 1, 1, C.violet, true);
  const lt2MidRing = nodeRing(1, 1, C.violet);
  await until(S(33));
  await play(
    new M.Create(lt2A, { runTime: 0.9 }),
    new M.Create(lt2MidRing, { runTime: 0.6 }),
    ...say('TRAIL 2 → MIDDLE SCORE (3)', C.violet)
  );

  // --- Beat 34: That score uses columns two and three. ---
  const lt2B1 = trailLine(1, 1, 0, 1, C.violet, true);
  const lt2B2 = trailLine(1, 1, 0, 2, C.violet, true);
  const lt2Photo = photoDashedBox(1, 1, 2, C.violet, 0.09);
  await until(S(34));
  await play(
    new M.Create(lt2B1, { runTime: 0.8 }),
    new M.Create(lt2B2, { runTime: 0.8 }),
    new M.Create(lt2Photo, { runTime: 0.8 }),
    new M.FadeIn(colLabs[2]),
    ...fbox(['Left final (−3):', ['trail 1 → cols 1, 2', C.cyan], ['trail 2 → cols 2, 3', C.violet]], C.violet),
    ...say('TRAIL 2 → COLUMNS 2 AND 3', C.violet)
  );

  // --- Beat 35: Both trails reach column two, so count that square once. ---
  const shared2 = photoBox(1, 1, 1, C.amber, 0.02, 0.22);
  await until(S(35));
  await play(
    new M.FadeIn(shared2),
    new M.Indicate(cells[1][1], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(N.nodes[0][1], { color: C.amber, runTime: 0.9 }),
    ...say('COLUMN 2 SHARED → COUNT ONCE', C.amber)
  );

  // --- Beat 36: Together they reach columns one through three. ---
  const leftReach = photoBox(1, 0, 2, C.green, 0.05, 0.16);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(lt1Photo, lt2Photo, shared2)),
    new M.Create(leftReach, { runTime: 0.8 }),
    ...fbox(['Left final (−3):', ['cols 1, 2, 3', C.green], ['3 squares', C.amber]], C.green),
    ...say('LEFT FINAL REACHES COLUMNS 1–3', C.green)
  );

  // --- Beat 37: Now start at the right-hand final score. ---
  const rStartRing = nodeRing(2, 1, C.amber);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(lStartRing, lt1A, lt1MidRing, lt1B1, lt1B2, lt2A, lt2MidRing, lt2B1, lt2B2, leftReach)),
    new M.Create(rStartRing, { runTime: 0.7 }),
    ...fbox(['Trace: right final (3)', ['start at 3', C.amber]], C.amber),
    ...say('START: RIGHT FINAL SCORE (3)', C.amber)
  );

  // --- Beat 38: Its first trail goes through the middle score to columns two and three. ---
  const rt1A = trailLine(2, 1, 1, 1, C.cyan, false);
  const rt1MidRing = nodeRing(1, 1, C.cyan);
  const rt1B1 = trailLine(1, 1, 0, 1, C.cyan, false);
  const rt1B2 = trailLine(1, 1, 0, 2, C.cyan, false);
  const rt1Photo = photoBox(1, 1, 2, C.cyan, 0.04, 0.12);
  await until(S(38));
  await play(
    new M.Create(rt1A, { runTime: 0.8 }),
    new M.Create(rt1MidRing, { runTime: 0.6 }),
    new M.Create(rt1B1, { runTime: 0.9 }),
    new M.Create(rt1B2, { runTime: 0.9 }),
    new M.Create(rt1Photo, { runTime: 0.8 }),
    ...fbox(['Right final (3):', ['trail 1 → cols 2, 3', C.cyan]], C.cyan),
    ...say('TRAIL 1 → MIDDLE → COLUMNS 2–3', C.cyan)
  );

  // --- Beat 39: Its other trail goes through the last score to columns three and four. ---
  const rt2A = trailLine(2, 1, 1, 2, C.violet, true);
  const rt2MidRing = nodeRing(1, 2, C.violet);
  const rt2B1 = trailLine(1, 2, 0, 2, C.violet, true);
  const rt2B2 = trailLine(1, 2, 0, 3, C.violet, true);
  const rt2Photo = photoDashedBox(1, 2, 3, C.violet, 0.09);
  await until(S(39));
  await play(
    new M.Create(rt2A, { runTime: 0.8 }),
    new M.Create(rt2MidRing, { runTime: 0.6 }),
    new M.Create(rt2B1, { runTime: 0.9 }),
    new M.Create(rt2B2, { runTime: 0.9 }),
    new M.Create(rt2Photo, { runTime: 0.8 }),
    new M.FadeIn(colLabs[3]),
    ...fbox(['Right final (3):', ['trail 1 → cols 2, 3', C.cyan], ['trail 2 → cols 3, 4', C.violet]], C.violet),
    ...say('TRAIL 2 → LAST → COLUMNS 3–4', C.violet)
  );

  // --- Beat 40: Count the shared square once to get columns two through four. ---
  const rightReach = photoBox(1, 1, 3, C.green, 0.05, 0.16);
  await until(S(40));
  await play(
    new M.Indicate(cells[1][2], { color: C.amber, runTime: 0.9 }),
    new M.Indicate(N.nodes[0][2], { color: C.amber, runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(rt1Photo, rt2Photo)),
    new M.Create(rightReach, { runTime: 0.8 }),
    ...fbox(['Right final (3):', ['col 3 shared (once)', C.muted], ['cols 2, 3, 4', C.green]], C.green),
    ...say('COL 3 SHARED → COLUMNS 2–4', C.green)
  );

  // --- Beat 41: The photo squares a score can reach make up its receptive field. ---
  await until(S(41));
  await play(
    new M.Indicate(rightReach, { color: C.amber, runTime: 1.0 }),
    ...fbox([['RECEPTIVE FIELD', C.amber], 'photo squares a score', 'can reach: cols 2–4'], C.amber),
    ...say('RECEPTIVE FIELD', C.amber)
  );

  // --- Beat 42: The width tells you how many squares the receptive field covers across the row. ---
  const wbY = PHOTO_C[1] - 2 * CELL - (P ? 0.4 : 0.34);
  const wbX0 = photoX(1) - CELL / 2, wbX1 = photoX(3) + CELL / 2;
  const wbLine = new M.Line({ start: [wbX0, wbY, 0], end: [wbX1, wbY, 0], color: C.amber, strokeWidth: 3 });
  const wbL = new M.Line({ start: [wbX0, wbY - 0.1, 0], end: [wbX0, wbY + 0.1, 0], color: C.amber, strokeWidth: 3 });
  const wbR = new M.Line({ start: [wbX1, wbY - 0.1, 0], end: [wbX1, wbY + 0.1, 0], color: C.amber, strokeWidth: 3 });
  const wbTxt = T('width = 3', P ? 15 : 16, C.amber, true, true);
  wbTxt.moveTo([(wbX0 + wbX1) / 2, wbY - 0.28, 0]);
  const widthBrace = new M.VGroup(wbLine, wbL, wbR, wbTxt);
  await until(S(42));
  await play(
    new M.FadeOut(photoTitle),
    new M.FadeIn(widthBrace),
    ...say('WIDTH = SQUARES COVERED ACROSS THE ROW', C.cyan)
  );

  // --- Beat 43: Start with one final score. ---
  const cntY = NET_C[1] - NET_H / 2 - NR - (P ? 0.28 : 0.32);
  const cnt1 = T('1', 20, C.amber, true, true); cnt1.moveTo([N.pos(2, 0)[0], cntY, 0]);
  await until(S(43));
  await play(
    new M.Indicate(N.nodes[2][1], { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(cnt1),
    ...fbox(['Count back:', ['0 steps:  1 final score', C.amber]], C.amber),
    ...say('START: 1 FINAL SCORE', C.amber)
  );

  // --- Beat 44: One step back reaches two earlier scores. ---
  const cnt2 = T('2', 20, C.cyan, true, true); cnt2.moveTo([N.pos(1, 0)[0], cntY, 0]);
  await until(S(44));
  await play(
    new M.Indicate(N.nodes[1][1], { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(N.nodes[1][2], { color: C.cyan, runTime: 0.9 }),
    new M.FadeIn(cnt2),
    ...fbox(['Count back:', '0 steps:  1 score', ['1 step:   2 scores', C.cyan]], C.cyan),
    ...say('1 STEP BACK → 2 EARLIER SCORES', C.cyan)
  );

  // --- Beat 45: Another step back reaches three photo squares, counting the shared square once. ---
  const cnt3 = T('3', 20, C.green, true, true); cnt3.moveTo([N.pos(0, 0)[0], cntY, 0]);
  await until(S(45));
  await play(
    new M.LaggedStart([N.nodes[0][1], N.nodes[0][2], N.nodes[0][3]].map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }),
    new M.Indicate(rightReach, { color: C.green, runTime: 1.0 }),
    new M.FadeIn(cnt3),
    ...fbox(['Count back:', '0 steps:  1 score', '1 step:   2 scores', ['2 steps:  3 squares', C.green]], C.green),
    ...say('2 STEPS BACK → 3 PHOTO SQUARES', C.green)
  );

  // --- Beat 46: Each layer adds one place because the two-square filter moves one place at a time. ---
  const slideWin = photoBox(1, 1, 2, C.amber, 0.06, 0.08);
  await until(S(46));
  await play(
    new M.FadeIn(slideWin, { runTime: 0.6 }),
    ...fbox(['2-square filter, step 1:', ['each layer adds +1', C.amber]], C.amber),
    ...say('EACH LAYER ADDS 1 SQUARE', C.amber)
  );
  await play(new M.Transform(slideWin, photoBox(1, 2, 3, C.amber, 0.06, 0.08), { runTime: 1.2 }));

  // --- Beat 47: Here, the width equals one plus the number of layers. ---
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(slideWin, cnt1, cnt2, cnt3)),
    ...fbox([['width = 1 + layers', C.ink]], C.cyan),
    ...say('WIDTH = 1 + NUMBER OF LAYERS', C.cyan)
  );

  // --- Beat 48: One plus two gives three squares. ---
  await until(S(48));
  await play(
    new M.Indicate(widthBrace, { color: C.amber, runTime: 0.9 }),
    ...fbox([['width = 1 + layers', C.ink], ['      = 1 + 2', C.muted], ['      = 3 squares', C.amber]], C.amber),
    ...say('1 + 2 = 3 SQUARES', C.amber)
  );

  // --- Beat 49: The right-hand final score can use both dark squares and the light square beside them. ---
  await until(S(49));
  await play(
    new M.Indicate(cells[1][1], { color: C.cyan, runTime: 1.0 }),
    new M.Indicate(cells[1][2], { color: C.pink, runTime: 1.0 }),
    new M.Indicate(cells[1][3], { color: C.pink, runTime: 1.0 }),
    ...say('SEES LIGHT (4) + BOTH DARK (1, 1)', C.green)
  );

  // --- Beat 50: If you stop at the earlier scores, you miss the squares in the photo. ---
  const trapBox = dashedBox(N.pos(1, 1)[0], (N.pos(1, 1)[1] + N.pos(1, 2)[1]) / 2, NR * 2 + 0.34, Math.abs(N.pos(1, 1)[1] - N.pos(1, 2)[1]) + NR * 2 + 0.3, C.pink, 3.5);
  await until(S(50));
  await play(
    new M.Create(trapBox, { runTime: 0.8 }),
    ...fbox([['Trap:', C.pink], 'Layer 1 shows 2 scores,', 'not the 3 photo squares'], C.pink),
    ...say('GO ALL THE WAY BACK TO THE PHOTO', C.pink)
  );

  // --- Beat 51: In Try it, tap the photo squares that can change the right-hand final score. ---
  await until(S(51));
  await play(
    new M.FadeOut(trapBox),
    new M.Indicate(rightReach, { color: C.cyan, runTime: 1.0 }),
    ...fbox(['Try it:', ['tap cols 2, 3, 4', C.cyan]], C.cyan),
    ...say('TRY IT: TAP THE REACHED SQUARES', C.cyan)
  );

  // --- Beat 52: Predict which final score changes if the fourth square in our row gets brighter. ---
  const col4Box = photoBox(1, 3, 3, C.amber, 0.05, 0.18);
  const col4NodeRing = nodeRing(0, 3, C.amber);
  await until(S(52));
  await play(
    new M.Create(col4Box, { runTime: 0.7 }),
    new M.Create(col4NodeRing, { runTime: 0.7 }),
    new M.Indicate(N.nodes[2][0], { color: C.muted, runTime: 0.9 }),
    new M.Indicate(N.nodes[2][1], { color: C.amber, runTime: 0.9 }),
    ...fbox(['Predict:', 'col 4:  1 → 4', ['which final score moves?', C.amber]], C.amber),
    ...say('WHAT IF COL 4 GETS BRIGHTER?', C.amber)
  );

  // --- Beat 53: Change that square from one to four to test your prediction. ---
  await until(S(53));
  await play(
    new M.Indicate(cells[1][3], { color: C.green, runTime: 1.0 }),
    ...say('CHANGE COL 4:  1 → 4  IN TRY IT', C.green)
  );

  // --- Beat 54: A receptive field tells you which squares in the original photo can affect a score. ---
  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(col4Box, col4NodeRing)),
    new M.Indicate(rightReach, { color: C.amber, runTime: 1.1 }),
    ...fbox([['Receptive field', C.amber], 'photo squares that can', 'affect a final score', ['width = 1 + 2 = 3', C.green]], C.amber),
    ...say('RECEPTIVE FIELD = SQUARES THAT AFFECT A SCORE', C.amber)
  );
}
