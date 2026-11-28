// 14.4.3 Graph representations: two ways to record friendships.
// Beat i = sentence i (0-based, 53 sentences: 0..52). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 14.4 data and colours (fixed, exact)
  const NAMES = ['Ana', 'Ben', 'Cara', 'Dan'];
  const RCOL = [C.cyan, '#60a5fa', '#fb923c', C.violet]; // Ana=cyan, Ben=blue, Cara=orange, Dan=purple
  const EDGES = [[0, 1], [1, 2], [2, 3]]; // (Ana, Ben), (Ben, Cara), (Cara, Dan)
  const ADJ = [
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 0, 1, 0],
  ];
  const DEG = [1, 2, 2, 1];

  // Layout constants (Laptop: 14.22 x 8, y in [-3.0, 2.3]; Phone: 8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 3.95, 0] : [0, 1.98, 0];
  const BOXP = P ? [0, -4.45, 0] : [-4.1, -2.42, 0];
  const BOX1 = P ? [0, -3.95, 0] : [0, -2.15, 0];
  // Indicate on a node circle hid its name (dark fill): circles get a Flash ring instead
  const ping = (c, color, r) => new M.Flash(c, { color, flashRadius: r + 0.08, numLines: 14, lineLength: 0.18, runTime: 0.8 });
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, auto-scaled to fit cleanly
  let boxNow = null;
  function fbox(lines, color = C.cyan, pos = BOXP) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const left = pos[0] - wd / 2 + 0.32, top = pos[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  // Helper: draw an edge line cleanly between two circle borders
  function edgeLine(a, b, r, color = C.ink, width = 4) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const pad = r + 0.03;
    return new M.Line({
      start: [a[0] + dx / d * pad, a[1] + dy / d * pad, -0.01],
      end: [b[0] - dx / d * pad, b[1] - dy / d * pad, -0.01],
      color, strokeWidth: width,
    });
  }

  // Helper: reader icon (head + shoulders)
  function readerIcon(pos, color) {
    const head = new M.Circle({ radius: 0.17, color }); head.setFill(color, 0.95); head.moveTo([pos[0], pos[1] + 0.24, 0]);
    const body = new M.Arc({ radius: 0.32, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 0.95); body.moveTo([pos[0], pos[1] - 0.18, 0]);
    return new M.VGroup(head, body);
  }

  // =========================================================================
  // PHASE 1 (0–13): Bookshop event -> 4 readers -> Graph (nodes & edges)
  // =========================================================================

  // 0: Bookshop reading event card
  const shopPos = P ? [0, -0.9, 0] : [0, -0.25, 0];
  const shopCard = new M.RoundedRectangle({ width: P ? 6.6 : 6.0, height: P ? 2.9 : 2.3, cornerRadius: 0.24, color: C.amber, strokeWidth: 2.5 });
  shopCard.setFill(C.card, 0.95); shopCard.moveTo(shopPos);
  const pageL = new M.RoundedRectangle({ width: 0.58, height: 0.72, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2 });
  pageL.setFill(C.cyan, 0.25); pageL.moveTo([shopPos[0] - 0.32, shopPos[1] + 0.42, 0]);
  const pageR = new M.RoundedRectangle({ width: 0.58, height: 0.72, cornerRadius: 0.06, color: C.amber, strokeWidth: 2 });
  pageR.setFill(C.amber, 0.25); pageR.moveTo([shopPos[0] + 0.32, shopPos[1] + 0.42, 0]);
  const spine = new M.Line({ start: [shopPos[0], shopPos[1] + 0.06, 0], end: [shopPos[0], shopPos[1] + 0.78, 0], color: C.ink, strokeWidth: 2.5 });
  const shopT1 = T('Bookshop Reading Event', P ? 25 : 28, C.ink, false, true); shopT1.moveTo([shopPos[0], shopPos[1] - 0.32, 0]);
  const shopT2 = T('4 invited readers', P ? 19 : 20, C.muted); shopT2.moveTo([shopPos[0], shopPos[1] - 0.78, 0]);
  const shopGroup = new M.VGroup(shopCard, pageL, pageR, spine, shopT1, shopT2);

  await until(S(0));
  await play(new M.FadeIn(shopGroup, { runTime: 1.0 }), ...say('BOOKSHOP READING EVENT', C.amber));

  // 1: Who already knows each other?
  const P1_Y = P ? -0.4 : 0.05;
  const P1_X = P ? [-2.85, -0.95, 0.95, 2.85] : [-4.2, -1.4, 1.4, 4.2];
  // phone: the four readers stand in a big square (Ana, Ben on top; Dan, Cara below) to fill the tall screen
  const P1_POS = P ? [[-1.9, 1.3, 0], [1.9, 1.3, 0], [1.9, -1.9, 0], [-1.9, -1.9, 0]] : P1_X.map(x => [x, P1_Y, 0]);
  const P1_MID = P ? -0.3 : P1_Y;
  const iconsMuted = P1_POS.map(p => readerIcon(p, C.muted));
  const qLinks = [];
  for (let k = 0; k < 3; k++) {
    const a = P1_POS[k], b = P1_POS[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d;
    const ln = new M.DashedLine({ start: [a[0] + ux * 0.48, a[1] + 0.05 + uy * 0.48, 0], end: [b[0] - ux * 0.48, b[1] + 0.05 - uy * 0.48, 0], color: C.amber });
    const q = T('?', P ? 20 : 22, C.amber, true, true);
    q.moveTo([(a[0] + b[0]) / 2 + (uy !== 0 ? 0.38 : 0), (a[1] + b[1]) / 2 + (uy !== 0 ? 0 : 0.38), 0]);
    qLinks.push(ln, q);
  }
  await until(S(1));
  await play(
    new M.FadeOut(shopGroup, { runTime: 0.6 }),
    new M.LaggedStart(iconsMuted.map(ic => new M.FadeIn(ic)), { lagRatio: 0.12, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...qLinks), { runTime: 0.8 }),
    ...say('WHO ALREADY KNOWS WHOM?', C.amber)
  );

  // 2: Four readers: Ana, Ben, Cara and Dan
  const iconsCol = P1_POS.map((p, k) => readerIcon(p, RCOL[k]));
  const nameBelow = P1_POS.map((p, k) => {
    const t = T(NAMES[k], P ? 22 : 24, RCOL[k], false, true);
    t.moveTo([p[0], p[1] - 0.62, 0]);
    return t;
  });
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...iconsMuted, ...qLinks), { runTime: 0.5 }),
    new M.LaggedStart(iconsCol.map((ic, k) => new M.FadeIn(new M.VGroup(ic, nameBelow[k]))), { lagRatio: 0.25, runTime: 2.0 }),
    ...say('4 READERS: ANA, BEN, CARA, DAN', C.cyan)
  );

  // 3: Draw a circle for each reader and write their name inside
  const R1 = P ? 0.62 : 0.62;
  const p1Circs = P1_POS.map((p, k) => {
    const c = new M.Circle({ radius: R1, color: RCOL[k], strokeWidth: 3.5 });
    c.setFill(C.card, 0.95); c.moveTo(p); return c;
  });
  const p1Names = P1_POS.map((p, k) => {
    const t = T(NAMES[k], P ? 20 : 24, RCOL[k], false, true);
    t.moveTo(p); return t;
  });
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...iconsCol, ...nameBelow), { runTime: 0.5 }),
    new M.LaggedStart(p1Circs.map(c => new M.Create(c)), { lagRatio: 0.18, runTime: 1.5 }),
    new M.LaggedStart(p1Names.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('ONE CIRCLE PER READER', C.cyan)
  );

  // 4: Ana and Ben are friends -> line between their circles
  const p1Edges = EDGES.map(([a, b]) => edgeLine(P1_POS[a], P1_POS[b], R1, C.ink, 4));
  await until(S(4));
  await play(
    new M.Create(p1Edges[0], { runTime: 0.9 }),
    ping(p1Circs[0], C.amber, R1),
    ping(p1Circs[1], C.amber, R1),
    ...say('ANA — BEN', C.amber)
  );

  // 5: Ben and Cara are also friends
  await until(S(5));
  await play(
    ping(p1Circs[1], C.amber, R1),
    ping(p1Circs[2], C.amber, R1),
    ...say('BEN AND CARA ARE FRIENDS', C.amber)
  );

  // 6: Draw another line between their circles
  await until(S(6));
  await play(new M.Create(p1Edges[1], { runTime: 0.9 }), ...say('BEN — CARA', C.amber));

  // 7: Finally, Cara and Dan are friends
  await until(S(7));
  await play(
    ping(p1Circs[2], C.amber, R1),
    ping(p1Circs[3], C.amber, R1),
    ...say('CARA AND DAN ARE FRIENDS', C.amber)
  );

  // 8: Draw a line between their circles, too
  await until(S(8));
  await play(new M.Create(p1Edges[2], { runTime: 0.9 }), ...say('CARA — DAN', C.amber));

  // 9: Four circles and three lines
  await until(S(9));
  await play(
    ...fbox([['Circles: 4  (Ana, Ben, Cara, Dan)', C.cyan], ['Lines:   3  (friendships)', C.amber]], C.cyan, BOX1),
    ...say('4 CIRCLES  ·  3 LINES', C.green)
  );

  // 10: This picture helps us see who is connected to whom
  await until(S(10));
  await play(
    new M.LaggedStart(p1Edges.map(e => new M.Indicate(e, { color: C.cyan })), { lagRatio: 0.25, runTime: 1.5 }),
    ...say('SEE WHO IS CONNECTED', C.cyan)
  );

  // 11: We call this kind of picture a graph
  const graphFrame = new M.RoundedRectangle({
    width: P ? 7.4 : 10.6, height: P ? 4.95 : 2.0, cornerRadius: 0.25, color: C.green, strokeWidth: 2.5,
  });
  graphFrame.moveTo([0, P1_MID, 0]);
  await until(S(11));
  await play(new M.Create(graphFrame, { runTime: 0.9 }), ...say('THIS PICTURE = A GRAPH', C.green));

  // 12: Each circle is called a node (a reader)
  await until(S(12));
  await play(
    new M.FadeOut(graphFrame, { runTime: 0.5 }),
    new M.LaggedStart(p1Circs.map(c => ping(c, C.cyan, R1)), { lagRatio: 0.15, runTime: 1.4 }),
    ...fbox([['node = circle (a reader)', C.cyan]], C.cyan, BOX1),
    ...say('CIRCLE = NODE (READER)', C.cyan)
  );

  // 13: Each line is called an edge (a friendship)
  await until(S(13));
  await play(
    new M.LaggedStart(p1Edges.map(e => new M.Indicate(e, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['node = circle (a reader)', C.muted], ['edge = line (a friendship)', C.amber]], C.amber, BOX1),
    ...say('LINE = EDGE (FRIENDSHIP)', C.amber)
  );

  // =========================================================================
  // PHASE 2 (14–19): Persistent Graph + Edge List
  // =========================================================================

  // Persistent graph coordinates:
  // Laptop: clean 2x2 U-path on left (Ana top-left -> Ben top-right -> Cara bottom-right -> Dan bottom-left)
  // Phone: horizontal chain across top (y = 2.65)
  const R2 = 0.48;
  const GPOS = P
    ? [[-2.7, 2.65, 0], [-0.9, 2.65, 0], [0.9, 2.65, 0], [2.7, 2.65, 0]]
    : [[-5.4, 0.65, 0], [-2.6, 0.65, 0], [-2.6, -1.15, 0], [-5.4, -1.15, 0]];

  const gCircs = GPOS.map((p, k) => {
    const c = new M.Circle({ radius: R2, color: RCOL[k], strokeWidth: 3.2 });
    c.setFill(C.card, 0.95); c.moveTo(p); return c;
  });
  const gNames = GPOS.map((p, k) => {
    const t = T(NAMES[k], P ? 19 : 21, RCOL[k], false, true);
    t.moveTo(p); return t;
  });
  const gEdges = EDGES.map(([a, b]) => edgeLine(GPOS[a], GPOS[b], R2, C.ink, 3.8));
  const gTitle = T('GRAPH', P ? 15 : 16, C.muted, true, true);
  gTitle.moveTo(P ? [0, 3.38, 0] : [-4.0, 1.38, 0]);

  // 14: How can we store these friendships inside a computer?
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...p1Circs, ...p1Names, ...p1Edges), { runTime: 0.6 }),
    ...hideBox(),
    new M.FadeIn(new M.VGroup(...gEdges, ...gCircs, ...gNames, gTitle), { runTime: 0.9 }),
    ...say('HOW TO STORE THIS IN A COMPUTER?', C.violet)
  );

  // 15: Way 1: list of all connected pairs
  const EL_POS = P ? [0, -1.6, 0] : [2.8, -0.25, 0];
  const EL_W = P ? 6.6 : 5.6, EL_H = P ? 4.4 : 3.1;
  const elCard = new M.RoundedRectangle({ width: EL_W, height: EL_H, cornerRadius: 0.22, color: C.cyan, strokeWidth: 2.2 });
  elCard.setFill(C.card, 0.95); elCard.moveTo(EL_POS);
  const elHead1 = T('CONNECTED PAIRS', P ? 20 : 21, C.cyan, true, true);
  elHead1.moveTo([EL_POS[0], EL_POS[1] + EL_H / 2 - 0.42, 0]);
  const elDiv = new M.Line({
    start: [EL_POS[0] - EL_W / 2 + 0.35, EL_POS[1] + EL_H / 2 - 0.78, 0],
    end: [EL_POS[0] + EL_W / 2 - 0.35, EL_POS[1] + EL_H / 2 - 0.78, 0],
    color: C.line, strokeWidth: 2,
  });
  const elRowY = [0, 1, 2].map(k => EL_POS[1] + (P ? 0.7 : 0.32) - k * (P ? 0.95 : 0.66));
  const elSlots = elRowY.map(y => new M.DashedLine({
    start: [EL_POS[0] - EL_W / 2 + 0.6, y - 0.26, 0],
    end: [EL_POS[0] + EL_W / 2 - 0.6, y - 0.26, 0],
    color: C.line,
  }));

  function makeEdgeRow(idx, a, b, y) {
    const cx = EL_POS[0], sz = P ? 22 : 22;
    const num = T(`${idx}.`, sz, C.muted, true); num.moveTo([cx - 2.05, y, 0]);
    const d1 = new M.Dot({ point: [cx - 1.38, y, 0], radius: 0.11, color: RCOL[a] });
    const n1 = T(NAMES[a], sz, RCOL[a], false, true); n1.moveTo([cx - 0.68, y, 0]);
    const dash = T('—', sz, C.muted, true); dash.moveTo([cx + 0.12, y, 0]);
    const d2 = new M.Dot({ point: [cx + 0.68, y, 0], radius: 0.11, color: RCOL[b] });
    const n2 = T(NAMES[b], sz, RCOL[b], false, true); n2.moveTo([cx + 1.38, y, 0]);
    return new M.VGroup(num, d1, n1, dash, d2, n2);
  }
  const elRows = EDGES.map(([a, b], k) => makeEdgeRow(k + 1, a, b, elRowY[k]));

  await until(S(15));
  await play(
    new M.Create(elCard, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(elHead1, elDiv, ...elSlots), { runTime: 0.8 }),
    ...say('WAY 1: LIST CONNECTED PAIRS', C.cyan)
  );

  // 16: Ana and Ben on the first line
  await until(S(16));
  await play(
    new M.Indicate(gEdges[0], { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(elRows[0], { runTime: 0.8 }),
    ...say('LINE 1: (ANA, BEN)', C.cyan)
  );

  // 17: Ben and Cara on the second line
  await until(S(17));
  await play(
    new M.Indicate(gEdges[1], { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(elRows[1], { runTime: 0.8 }),
    ...say('LINE 2: (BEN, CARA)', C.cyan)
  );

  // 18: Cara and Dan on the third line
  await until(S(18));
  await play(
    new M.Indicate(gEdges[2], { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(elRows[2], { runTime: 0.8 }),
    ...say('LINE 3: (CARA, DAN)', C.cyan)
  );

  // 19: Called an edge list
  const elHead2 = T('EDGE LIST', P ? 21 : 22, C.green, true, true);
  elHead2.moveTo(elHead1.getCenter());
  await until(S(19));
  await play(
    new M.FadeOut(elHead1, { runTime: 0.4 }),
    new M.FadeIn(elHead2, { runTime: 0.5 }),
    new M.Indicate(elCard, { color: C.green, runTime: 0.9 }),
    ...say('EDGE LIST = CONNECTED PAIRS', C.green)
  );

  // =========================================================================
  // PHASE 3 (20–52): Adjacency Matrix, Filling Rows, Symmetry, Degree & Pitfall
  // =========================================================================

  // Matrix geometry
  const CW = P ? 1.22 : 1.02, CH = P ? 1.1 : 0.68;
  const GX = P ? -2.30 : 0.55;
  const GY_TOP = P ? 1.2 : 1.06; // top edge of row 0
  const colX = c => GX + (c + 0.5) * CW;
  const rowY = r => GY_TOP - (r + 0.5) * CH;
  const cellPos = (r, c) => [colX(c), rowY(r), 0];

  // Build 4x4 grid cells and outer border
  const cellRects = [];
  for (let r = 0; r < 4; r++) {
    cellRects.push([]);
    for (let c = 0; c < 4; c++) {
      const box = new M.Rectangle({ width: CW - 0.04, height: CH - 0.04, color: C.line, strokeWidth: 1.6 });
      box.setFill(C.card, 0.92);
      box.moveTo(cellPos(r, c));
      cellRects[r].push(box);
    }
  }
  const matCenter = [GX + 2 * CW, GY_TOP - 2 * CH, 0];
  const matBorder = new M.RoundedRectangle({ width: 4 * CW + 0.08, height: 4 * CH + 0.08, cornerRadius: 0.10, color: C.cyan, strokeWidth: 2.2 });
  matBorder.moveTo(matCenter);

  // 20: Another way, using a table
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(elCard, elHead2, elDiv, ...elSlots, ...elRows), { runTime: 0.6 }),
    new M.Create(matBorder, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...cellRects.flat()), { runTime: 0.8 }),
    ...say('WAY 2: USE A TABLE', C.amber)
  );

  // 21: Four reader names across the top
  const colHdrs = NAMES.map((name, c) => {
    const t = T(name, P ? 19 : 20, RCOL[c], false, true);
    t.moveTo([colX(c), GY_TOP + 0.30, 0]);
    return t;
  });
  await until(S(21));
  await play(
    new M.LaggedStart(colHdrs.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('READER NAMES ACROSS THE TOP', C.cyan)
  );

  // 22: Same four names down the left side, in the same order
  const rowHdrs = NAMES.map((name, r) => {
    const t = T(name, P ? 19 : 20, RCOL[r], false, true);
    t.moveTo([GX - (P ? 0.68 : 0.65), rowY(r), 0]);
    return t;
  });
  await until(S(22));
  await play(
    new M.LaggedStart(rowHdrs.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('SAME NAMES DOWN THE LEFT', C.cyan)
  );

  // 23: Each small box represents a possible connection between two readers
  const sampleBox = new M.RoundedRectangle({ width: CW - 0.02, height: CH - 0.02, cornerRadius: 0.06, color: C.amber, strokeWidth: 3 });
  sampleBox.moveTo(cellPos(0, 1));
  await until(S(23));
  await play(
    new M.Create(sampleBox, { runTime: 0.7 }),
    ...fbox([['Each box = one pair of readers', C.ink], ['4 × 4 = 16 possible pairs', C.amber]], C.amber),
    ...say('EACH BOX = POSSIBLE CONNECTION', C.amber)
  );

  // 24: 1 when friendship exists, 0 when no friendship is recorded
  await until(S(24));
  await play(
    new M.FadeOut(sampleBox, { runTime: 0.5 }),
    ...fbox([['1 = friendship exists', C.green], ['0 = no friendship recorded', C.muted]], C.green),
    ...say('1 = FRIENDS  ·  0 = NOT RECORDED', C.green)
  );

  // 25: Table of numbers in rows and columns = matrix
  const demoRow = new M.RoundedRectangle({ width: 4 * CW + 0.06, height: CH, cornerRadius: 0.06, color: C.violet, strokeWidth: 2.5 });
  demoRow.moveTo([GX + 2 * CW, rowY(0), 0]);
  const demoCol = new M.RoundedRectangle({ width: CW, height: 4 * CH + 0.06, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2.5 });
  demoCol.moveTo([colX(1), GY_TOP - 2 * CH, 0]);
  await until(S(25));
  await play(
    new M.Create(demoRow, { runTime: 0.7 }),
    new M.Create(demoCol, { runTime: 0.7 }),
    ...say('ROWS AND COLUMNS = A MATRIX', C.violet)
  );

  // 26: Called an adjacency matrix
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(demoRow, demoCol), { runTime: 0.5 }),
    new M.Indicate(matBorder, { color: C.cyan, runTime: 0.9 }),
    ...fbox([['Adjacency matrix:', C.cyan], ['records direct connections', C.ink]], C.cyan),
    ...say('ADJACENCY MATRIX', C.cyan)
  );

  // Helpers to fill cells and highlight active row
  const cellVals = Array.from({ length: 4 }, () => Array(4).fill(null));
  function makeCellDigit(r, c) {
    const v = ADJ[r][c];
    const t = T(String(v), P ? 24 : 25, v === 1 ? C.green : C.muted, true, v === 1);
    t.moveTo(cellPos(r, c));
    cellVals[r][c] = t;
    return t;
  }
  function tintCell(r, c) {
    if (ADJ[r][c] === 1) cellRects[r][c].setFill(C.green, 0.18);
  }
  let rowHiNow = null;
  function showRowHi(r) {
    const box = new M.RoundedRectangle({ width: 4 * CW + 0.08, height: CH + 0.02, cornerRadius: 0.07, color: RCOL[r], strokeWidth: 2.6 });
    box.moveTo([GX + 2 * CW, rowY(r), 0]);
    const a = [new M.FadeIn(box, { runTime: 0.45 })];
    if (rowHiNow) a.push(new M.FadeOut(rowHiNow, { runTime: 0.4 }));
    rowHiNow = box;
    return a;
  }

  // 27: Fill the first row, which belongs to Ana
  await until(S(27));
  await play(
    ...showRowHi(0),
    ping(gCircs[0], RCOL[0], R2),
    ...say('ROW 1: ANA', RCOL[0])
  );

  // 28: Ana to Ana = 0
  const d00 = makeCellDigit(0, 0);
  await until(S(28));
  await play(
    new M.FadeIn(d00, { runTime: 0.6 }),
    ...fbox([['(Ana, Ana) -> 0', C.muted], ['not own friend', C.muted]], RCOL[0]),
    ...say('ANA TO ANA = 0', C.muted)
  );

  // 29: Ana is friends with Ben -> 1 under Ben
  const d01 = makeCellDigit(0, 1);
  await until(S(29));
  tintCell(0, 1);
  await play(
    new M.Indicate(gEdges[0], { color: C.green, runTime: 0.9 }),
    new M.FadeIn(d01, { runTime: 0.6 }),
    ...fbox([['(Ana, Ben) -> 1', C.green], ['friendship exists', C.green]], C.green),
    ...say('ANA — BEN = 1', C.green)
  );

  // 30: Ana has no recorded friendship with Cara -> 0
  const d02 = makeCellDigit(0, 2);
  await until(S(30));
  await play(
    new M.FadeIn(d02, { runTime: 0.6 }),
    ...fbox([['(Ana, Cara) -> 0', C.muted], ['no direct friendship', C.muted]], RCOL[0]),
    ...say('ANA TO CARA = 0', C.muted)
  );

  // 31: Ana has no recorded friendship with Dan -> 0
  const d03 = makeCellDigit(0, 3);
  await until(S(31));
  await play(
    new M.FadeIn(d03, { runTime: 0.6 }),
    ...fbox([['(Ana, Dan) -> 0', C.muted], ['no direct friendship', C.muted]], RCOL[0]),
    ...say('ANA TO DAN = 0', C.muted)
  );

  // 32: Ana's row contains 0, 1, 0, 0
  await until(S(32));
  await play(
    new M.LaggedStart([d00, d01, d02, d03].map(d => new M.Indicate(d, { color: RCOL[0] })), { lagRatio: 0.18, runTime: 1.4 }),
    ...fbox([['Ana row:  0, 1, 0, 0', RCOL[0]]], RCOL[0]),
    ...say('ANA ROW: 0, 1, 0, 0', RCOL[0])
  );

  // 33: Move to second row (Ben)
  await until(S(33));
  await play(
    ...showRowHi(1),
    ping(gCircs[1], RCOL[1], R2),
    ...say('ROW 2: BEN', RCOL[1])
  );

  // 34: Ben is friends with Ana and Cara
  await until(S(34));
  await play(
    new M.Indicate(gEdges[0], { color: RCOL[1], runTime: 0.9 }),
    new M.Indicate(gEdges[1], { color: RCOL[1], runTime: 0.9 }),
    ...say('BEN — ANA  &  BEN — CARA', RCOL[1])
  );

  // 35: Ben's row contains 1, 0, 1, 0
  const r1Digits = [0, 1, 2, 3].map(c => makeCellDigit(1, c));
  await until(S(35));
  [0, 1, 2, 3].forEach(c => tintCell(1, c));
  await play(
    new M.LaggedStart(r1Digits.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.3 }),
    ...fbox([['Ben row:  1, 0, 1, 0', RCOL[1]]], RCOL[1]),
    ...say('BEN ROW: 1, 0, 1, 0', RCOL[1])
  );

  // 36: Cara is friends with Ben and Dan
  await until(S(36));
  await play(
    ...showRowHi(2),
    new M.Indicate(gEdges[1], { color: RCOL[2], runTime: 0.9 }),
    new M.Indicate(gEdges[2], { color: RCOL[2], runTime: 0.9 }),
    ...say('CARA — BEN  &  CARA — DAN', RCOL[2])
  );

  // 37: Cara's row contains 0, 1, 0, 1
  const r2Digits = [0, 1, 2, 3].map(c => makeCellDigit(2, c));
  await until(S(37));
  [0, 1, 2, 3].forEach(c => tintCell(2, c));
  await play(
    new M.LaggedStart(r2Digits.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.3 }),
    ...fbox([['Cara row: 0, 1, 0, 1', RCOL[2]]], RCOL[2]),
    ...say('CARA ROW: 0, 1, 0, 1', RCOL[2])
  );

  // 38: Dan is friends only with Cara
  await until(S(38));
  await play(
    ...showRowHi(3),
    new M.Indicate(gEdges[2], { color: RCOL[3], runTime: 0.9 }),
    ...say('DAN — CARA ONLY', RCOL[3])
  );

  // 39: Dan's row contains 0, 0, 1, 0
  const r3Digits = [0, 1, 2, 3].map(c => makeCellDigit(3, c));
  await until(S(39));
  [0, 1, 2, 3].forEach(c => tintCell(3, c));
  await play(
    new M.LaggedStart(r3Digits.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.3 }),
    ...fbox([['Dan row:  0, 0, 1, 0', RCOL[3]]], RCOL[3]),
    ...say('DAN ROW: 0, 0, 1, 0', RCOL[3])
  );

  // 40: Our table is now complete
  await until(S(40));
  await play(
    new M.FadeOut(rowHiNow, { runTime: 0.4 }),
    new M.Indicate(matBorder, { color: C.green, runTime: 0.85 }),
    ...say('ADJACENCY MATRIX COMPLETE', C.green)
  );
  rowHiNow = null;

  // 41: Six ones in the table, but only three friendships
  const oneCoords = [[0, 1], [1, 0], [1, 2], [2, 1], [2, 3], [3, 2]];
  await until(S(41));
  await play(
    new M.LaggedStart(oneCoords.map(([r, c]) => new M.Indicate(cellVals[r][c], { color: C.amber })), { lagRatio: 0.14, runTime: 1.6 }),
    ...fbox([['Ones in table: 6', C.amber], ['Friendships:   3', C.cyan]], C.amber),
    ...say('6 ONES  ·  ONLY 3 FRIENDSHIPS', C.amber)
  );

  // 42: Each friendship appears twice because it works in both directions
  const symColors = [C.cyan, C.amber, C.violet];
  const symPairs = [[[0, 1], [1, 0]], [[1, 2], [2, 1]], [[2, 3], [3, 2]]];
  const symBoxes = [];
  symPairs.forEach((pair, k) => {
    pair.forEach(([r, c]) => {
      const b = new M.RoundedRectangle({ width: CW - 0.08, height: CH - 0.08, cornerRadius: 0.06, color: symColors[k], strokeWidth: 2.6 });
      b.moveTo(cellPos(r, c));
      symBoxes.push(b);
    });
  });
  const diagLine = new M.DashedLine({
    start: [GX + 0.08, GY_TOP - 0.06, 0],
    end: [GX + 4 * CW - 0.08, GY_TOP - 4 * CH + 0.06, 0],
    color: C.muted,
  });
  await until(S(42));
  await play(
    new M.Create(diagLine, { runTime: 0.7 }),
    new M.LaggedStart(symBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox([['Both directions: (Ana,Ben) & (Ben,Ana)', C.cyan], ['Each friendship appears twice', C.amber]], C.violet),
    ...say('BOTH DIRECTIONS → APPEARS TWICE', C.violet)
  );

  // 43: Use the table to count how many friends each reader has (label "friends" BEFORE naming "degree")
  const DEG_X = P ? 3.3 : 5.45;
  const friendsHdr = T('friends', P ? 15 : 17, C.cyan, true, true);
  friendsHdr.moveTo([DEG_X, GY_TOP + 0.30, 0]);
  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(diagLine, ...symBoxes), { runTime: 0.5 }),
    new M.FadeIn(friendsHdr, { runTime: 0.6 }),
    ...fbox([['Count friends from each row', C.cyan]], C.cyan),
    ...say('COUNT FRIENDS FROM EACH ROW', C.cyan)
  );

  // 44: Number of direct connections = degree of a node
  const degHdr = T('degree', P ? 15 : 18, C.amber, true, true);
  degHdr.moveTo([DEG_X, GY_TOP + 0.30, 0]);
  await until(S(44));
  await play(
    new M.FadeOut(friendsHdr, { runTime: 0.4 }),
    new M.FadeIn(degHdr, { runTime: 0.5 }),
    ...fbox([['degree = number of direct connections', C.amber]], C.amber),
    ...say('DIRECT CONNECTIONS = DEGREE', C.amber)
  );

  // 45: Short formula: degree = sum of numbers in reader's row
  await until(S(45));
  await play(
    ...fbox([['degree = sum of reader’s row', C.amber], ['add all numbers across the row', C.muted]], C.amber),
    ...say('DEGREE = SUM OF THE ROW', C.amber)
  );

  // 46: Ana=1, Ben=2, Cara=2, Dan=1
  const degVals = DEG.map((d, r) => {
    const t = T(String(d), P ? 24 : 25, RCOL[r], true, true);
    t.moveTo([DEG_X, rowY(r), 0]);
    return t;
  });
  const badgePos = P
    ? [[-2.7, 1.92, 0], [-0.9, 1.92, 0], [0.9, 1.92, 0], [2.7, 1.92, 0]]
    : [[-6.25, 0.65, 0], [-1.75, 0.65, 0], [-1.75, -1.15, 0], [-6.25, -1.15, 0]];
  const degBadges = DEG.map((d, k) => {
    const bg = new M.Circle({ radius: 0.21, color: RCOL[k], strokeWidth: 2 });
    bg.setFill(C.bg, 0.95); bg.moveTo(badgePos[k]);
    const tx = T(String(d), 16, RCOL[k], true, true); tx.moveTo(badgePos[k]);
    return new M.VGroup(bg, tx);
  });
  await until(S(46));
  await play(
    new M.LaggedStart(degVals.map((t, k) => new M.FadeIn(new M.VGroup(t, degBadges[k]))), { lagRatio: 0.28, runTime: 2.0 }),
    ...fbox([['Ana: 1    Ben: 2', C.ink], ['Cara: 2   Dan: 1', C.green]], C.green),
    ...say('DEGREES: 1, 2, 2, 1', C.green)
  );

  // 47: Edge list is useful for a short list of existing connections
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(...degBadges), { runTime: 0.5 }),
    new M.LaggedStart(gEdges.map(e => new M.Indicate(e, { color: C.cyan })), { lagRatio: 0.18, runTime: 1.3 }),
    ...fbox([['Edge list (3 pairs):', C.cyan], ['(Ana,Ben) (Ben,Cara) (Cara,Dan)', C.ink]], C.cyan),
    ...say('EDGE LIST: SHORT LIST OF EDGES', C.cyan)
  );

  // 48: Adjacency matrix is useful to check whether two readers are directly connected
  const lookupBox = new M.RoundedRectangle({ width: CW - 0.04, height: CH - 0.04, cornerRadius: 0.06, color: C.green, strokeWidth: 3.2 });
  lookupBox.moveTo(cellPos(1, 2));
  await until(S(48));
  await play(
    new M.Create(lookupBox, { runTime: 0.7 }),
    ...fbox([['Matrix: check any pair at once', C.green], ['(Ben, Cara) -> 1  (direct friends)', C.ink]], C.green),
    ...say('MATRIX: CHECK ANY PAIR FAST', C.green)
  );

  // 49: Ana knows Ben, and Ben knows Cara
  await until(S(49));
  await play(
    new M.FadeOut(lookupBox, { runTime: 0.4 }),
    new M.Indicate(gEdges[0], { color: C.amber, runTime: 1.0 }),
    new M.Indicate(gEdges[1], { color: C.amber, runTime: 1.0 }),
    ...fbox([['Ana — Ben — Cara', C.amber], ['connected through Ben', C.muted]], C.amber),
    ...say('ANA — BEN — CARA', C.amber)
  );

  // 50: That does not mean Ana and Cara are directly connected
  let noEdgeParts;
  if (P) {
    // Arch cleanly above Ben (y = 2.65, R2 = 0.48 -> top 3.13; pill bottom 3.72)
    const l1 = new M.DashedLine({ start: [-2.40, 3.06, 0], end: [-0.90, 3.44, 0], color: C.pink });
    const l2 = new M.DashedLine({ start: [-0.90, 3.44, 0], end: [0.60, 3.06, 0], color: C.pink });
    const xMark = T('×', 24, C.pink, true, true); xMark.moveTo([-0.90, 3.44, 0]);
    noEdgeParts = [l1, l2, xMark];
  } else {
    // Diagonal across empty center of the 2x2 U-shape from Ana (-5.4, 0.65) to Cara (-2.6, -1.15)
    const ln = new M.DashedLine({ start: [-4.96, 0.37, 0], end: [-3.04, -0.87, 0], color: C.pink });
    const xMark = T('×', 26, C.pink, true, true); xMark.moveTo([-4.00, -0.25, 0]);
    noEdgeParts = [ln, xMark];
  }
  const zeroBox1 = new M.RoundedRectangle({ width: CW - 0.04, height: CH - 0.04, cornerRadius: 0.06, color: C.pink, strokeWidth: 3.2 });
  zeroBox1.moveTo(cellPos(0, 2));
  await until(S(50));
  await play(
    new M.FadeIn(new M.VGroup(...noEdgeParts), { runTime: 0.8 }),
    new M.Create(zeroBox1, { runTime: 0.7 }),
    ...say('NOT DIRECTLY CONNECTED', C.pink)
  );

  // 51: A zero means no direct friendship is recorded, not that they cannot know each other
  const zeroBox2 = new M.RoundedRectangle({ width: CW - 0.04, height: CH - 0.04, cornerRadius: 0.06, color: C.pink, strokeWidth: 3.0 });
  zeroBox2.moveTo(cellPos(2, 0));
  await until(S(51));
  await play(
    new M.Create(zeroBox2, { runTime: 0.7 }),
    new M.Indicate(cellVals[0][2], { color: C.pink, runTime: 1.0 }),
    ...fbox([['0 = no direct friendship recorded', C.pink], ['indirect ties can still exist', C.muted]], C.pink),
    ...say('0 = NO DIRECT EDGE RECORDED', C.pink)
  );

  // 52: Recap: edge list records connected pairs; adjacency matrix records every possible pair in a table
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(...noEdgeParts, zeroBox1, zeroBox2), { runTime: 0.6 }),
    new M.LaggedStart(gEdges.map(e => new M.Indicate(e, { color: C.cyan })), { lagRatio: 0.16, runTime: 1.2 }),
    new M.Indicate(matBorder, { color: C.green, runTime: 1.2 }),
    ...fbox([['Edge list: connected pairs (3)', C.cyan], ['Matrix:    every pair in a table', C.green]], C.green),
    ...say('EDGE LIST vs ADJACENCY MATRIX', C.green)
  );
}
