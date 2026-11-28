// 3.1.4 Keys and table grain (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const ROWS = [
    ['101', '1', 'North', 'B1', '2', '$10'],
    ['101', '2', 'North', 'B2', '1', '$20'],
    ['102', '1', 'South', 'B3', '1', '$15'],
    ['103', '1', 'North', 'B2', '1', '$20'],
    ['103', '2', 'North', 'B3', '2', '$15'],
    ['104', '1', 'South', 'B4', '1', '$25'],
  ];
  const HEADERS = ['Order', 'Line', 'Store', 'Book', 'Copies', 'Price'];
  const ROW_COL = ROWS.map(r => r[2] === 'North' ? C.cyan : C.pink);

  // Layout: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const TX = P ? 0.15 : -2.25;
  const CW = P ? [1.15, 0.96, 1.32, 1.05, 1.34, 1.28] : [1.35, 1.15, 1.55, 1.25, 1.55, 1.55];
  const TW = CW.reduce((a, b) => a + b, 0);
  const TL = TX - TW / 2, TR = TX + TW / 2;
  const COL_L = [], COL_X = [];
  let acc = TL;
  for (let c = 0; c < CW.length; c++) { COL_L.push(acc); COL_X.push(acc + CW[c] / 2); acc += CW[c]; }

  const RH = P ? 0.88 : 0.58;
  const HY = P ? 1.35 : 1.05;
  const rowY = r => HY - (r + 1) * RH;
  const TH = 7 * RH, TY = HY - 3 * RH;
  const T_TOP = HY + RH / 2, T_BOT = rowY(5) - RH / 2;

  const PILL = P ? [0, 2.25, 0] : [TX, 1.92, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.50, 0.90, 0];
  const AUX = P ? [0, -5.65, 0] : [4.50, -1.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box: one at a time, auto-fit within maxw
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.36 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // Highlight boxes drawn from explicit coordinates (never wrapping on-screen mobjects)
  function colBox(c0, c1, color, fillOp = 0.08) {
    const x0 = COL_L[c0] + 0.04, x1 = COL_L[c1] + CW[c1] - 0.04;
    const b = new M.RoundedRectangle({ width: x1 - x0, height: TH - 0.06, cornerRadius: 0.12, color, strokeWidth: 3 });
    b.setFill(color, fillOp); b.moveTo([(x0 + x1) / 2, TY, 0]);
    return b;
  }
  function rowBox(r0, r1, color, fillOp = 0.08) {
    const yTop = rowY(r0) + RH / 2 - 0.03, yBot = rowY(r1) - RH / 2 + 0.03;
    const b = new M.RoundedRectangle({ width: TW - 0.06, height: yTop - yBot, cornerRadius: 0.10, color, strokeWidth: 3 });
    b.setFill(color, fillOp); b.moveTo([TX, (yTop + yBot) / 2, 0]);
    return b;
  }
  function cellBox(r, c0, c1, color, fillOp = 0.12) {
    const x0 = COL_L[c0] + 0.05, x1 = COL_L[c1] + CW[c1] - 0.05;
    const b = new M.RoundedRectangle({ width: x1 - x0, height: RH - 0.08, cornerRadius: 0.09, color, strokeWidth: 2.6 });
    b.setFill(color, fillOp); b.moveTo([(x0 + x1) / 2, rowY(r), 0]);
    return b;
  }
  function chip(label, color, w, h, size = 16) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    const t = T(label, size, color, true, true);
    return new M.VGroup(r, t);
  }

  // Build table structure (glowing grid of cells)
  const frame = new M.RoundedRectangle({ width: TW, height: TH, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.2 });
  frame.setFill(C.card, 0.92); frame.moveTo([TX, TY, -0.01]);

  const hdrBg = new M.Rectangle({ width: TW - 0.04, height: RH - 0.02, color: C.line, strokeWidth: 0 });
  hdrBg.setFill('#172347', 0.95); hdrBg.moveTo([TX, HY, -0.005]);
  const hdrTexts = HEADERS.map((h, c) => {
    const t = T(h, P ? 17 : 17, C.muted, true, true);
    t.moveTo([COL_X[c], HY, 0]);
    return t;
  });
  const hdrGroup = new M.VGroup(hdrBg, ...hdrTexts);

  const gLines = [];
  for (let c = 1; c < CW.length; c++) {
    const l = new M.Line({ start: [COL_L[c], T_TOP, -0.002], end: [COL_L[c], T_BOT, -0.002], color: C.line, strokeWidth: 1.4 });
    gLines.push(l);
  }
  for (let r = 0; r < 6; r++) {
    const y = rowY(r) + RH / 2;
    const l = new M.Line({ start: [TL, y, -0.002], end: [TR, y, -0.002], color: r === 0 ? C.cyan : C.line, strokeWidth: r === 0 ? 1.8 : 1.2 });
    gLines.push(l);
  }
  const gridLines = new M.VGroup(...gLines);

  const rowNums = ROWS.map((_, r) => {
    const t = T(String(r + 1), P ? 17 : 17, C.muted, true);
    t.moveTo([TL - (P ? 0.28 : 0.32), rowY(r), 0]);
    return t;
  });
  const rowBgs = ROWS.map((_, r) => {
    const bg = new M.Rectangle({ width: TW - 0.06, height: RH - 0.05, color: ROW_COL[r], strokeWidth: 0 });
    bg.setFill(ROW_COL[r], 0.07); bg.moveTo([TX, rowY(r), -0.005]);
    return bg;
  });
  const rowCells = ROWS.map((vals, r) => vals.map((val, c) => {
    const t = T(val, P ? 20 : 18, ROW_COL[r], true, c < 2);
    t.moveTo([COL_X[c], rowY(r), 0]);
    return t;
  }));

  // 0: flat table appears
  await until(S(0));
  await play(new M.Create(frame, { runTime: 1.1 }), new M.FadeIn(hdrGroup), new M.Create(gridLines, { runTime: 1.0 }),
    ...say('ONE FLAT SALES TABLE'));

  // 1: six rows
  await until(S(1));
  await play(
    new M.LaggedStart(rowNums.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.0 }),
    new M.LaggedStart(rowBgs.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.0 }),
    ...say('6 ROWS'), ...fbox(['sales table', ['rows = 6', C.cyan]]));

  // 2-7: read each of the six rows aloud
  const rowPills = [
    ['ORDER 101 · LINE 1', C.cyan],
    ['ORDER 101 · LINE 2', C.cyan],
    ['ORDER 102 · LINE 1', C.pink],
    ['ORDER 103 · LINE 1', C.cyan],
    ['ORDER 103 · LINE 2', C.cyan],
    ['ORDER 104 · LINE 1', C.pink],
  ];
  for (let r = 0; r < 6; r++) {
    await until(S(2 + r));
    await play(
      new M.LaggedStart(rowCells[r].map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.8 }),
      ...say(rowPills[r][0], rowPills[r][1]));
  }

  // 8: manager asks how many orders; someone counts 6 rows
  await until(S(8));
  await play(
    new M.LaggedStart(rowNums.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('HOW MANY ORDERS?', C.amber),
    ...fbox(['count the rows:', ['6 rows → "6 orders"?', C.pink]], C.amber));

  // 9: we know there were 4 orders — what does 1 row stand for?
  const ord4Data = [['101', C.cyan], ['102', C.pink], ['103', C.cyan], ['104', C.pink]];
  const ord4Title = T('4 REAL ORDERS', 15, C.amber, true, true);
  ord4Title.moveTo([AUX[0], AUX[1] + (P ? 0.58 : 0.72), 0]);
  const ord4Chips = ord4Data.map(([code, col], k) => {
    const ch = chip(code, col, P ? 1.45 : 1.65, 0.54, 18);
    if (P) ch.moveTo([AUX[0] + (k - 1.5) * 1.68, AUX[1] - 0.12, 0]);
    else ch.moveTo([AUX[0] + (k % 2 === 0 ? -0.98 : 0.98), AUX[1] + (k < 2 ? 0.14 : -0.52), 0]);
    return ch;
  });
  const ordBadges4 = new M.VGroup(ord4Title, ...ord4Chips);
  await until(S(9));
  await play(new M.FadeIn(ordBadges4), ...say('6 ROWS, ONLY 4 ORDERS', C.amber),
    ...fbox(['rows   = 6', ['orders = 4', C.amber], ['what is 1 row?', C.violet]], C.violet));

  // 10: order 101 fills two rows, one for each book
  const hl101 = rowBox(0, 1, C.amber, 0.08);
  await until(S(10));
  await play(new M.FadeOut(ordBadges4), new M.Create(hl101),
    new M.Indicate(rowCells[0][3], { color: C.amber }), new M.Indicate(rowCells[1][3], { color: C.amber }),
    ...say('ORDER 101 FILLS 2 ROWS', C.amber),
    ...fbox(['order 101:', '  row 1 → B1', '  row 2 → B2'], C.amber));

  // 11: one row is not one order; one row is one book inside one order
  const hlRow0 = rowBox(0, 0, C.violet, 0.10);
  await until(S(11));
  await play(new M.FadeOut(hl101), new M.Create(hlRow0),
    ...say('1 ROW = 1 BOOK IN 1 ORDER', C.violet),
    ...fbox([['1 row ≠ 1 order', C.pink], ['1 row = 1 book', C.green], ['        in 1 order', C.green]], C.violet));

  // 12: we call this an order line
  await until(S(12));
  await play(new M.Indicate(hlRow0, { color: C.green, runTime: 0.75 }), ...say('AN ORDER LINE', C.green));

  // 13: what one row stands for is called the grain
  await until(S(13));
  await play(...say('GRAIN = WHAT 1 ROW MEANS', C.violet),
    ...fbox([['grain', C.violet], '= what one row', '  stands for'], C.violet));

  // 14: grain of our table is one order line
  await until(S(14));
  await play(new M.Indicate(hlRow0, { color: C.green }), ...say('GRAIN = ONE ORDER LINE', C.green),
    ...fbox([['our grain:', C.violet], ['one order line', C.green]], C.green));

  // 15: like a shop receipt
  const rcW = P ? 5.6 : 4.0, rcH = 2.05;
  const rcBg = new M.RoundedRectangle({ width: rcW, height: rcH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  rcBg.setFill(C.card, 0.96); rcBg.moveTo(AUX);
  const rcTitle = T('SHOP RECEIPT  #101', 15, C.amber, true, true); rcTitle.moveTo([AUX[0], AUX[1] + 0.70, 0]);
  const rcRule = new M.DashedLine({ start: [AUX[0] - rcW / 2 + 0.25, AUX[1] + 0.44, 0], end: [AUX[0] + rcW / 2 - 0.25, AUX[1] + 0.44, 0], color: C.line });
  const rcHL = new M.RoundedRectangle({ width: rcW - 0.42, height: 0.40, cornerRadius: 0.08, color: C.green, strokeWidth: 2 });
  rcHL.setFill(C.green, 0.14); rcHL.moveTo([AUX[0], AUX[1] + 0.14, 0]);
  const rcL1 = T('1.  B1   ×2   $10', 16, C.green, true, true); rcL1.moveTo([AUX[0], AUX[1] + 0.14, 0]);
  const rcL2 = T('2.  B2   ×1   $20', 16, C.ink, true); rcL2.moveTo([AUX[0], AUX[1] - 0.30, 0]);
  const rcFoot = T('1 line = 1 item', 15, C.green, true, true); rcFoot.moveTo([AUX[0], AUX[1] - 0.72, 0]);
  const receipt = new M.VGroup(rcBg, rcTitle, rcRule, rcHL, rcL1, rcL2, rcFoot);
  await until(S(15));
  await play(new M.FadeIn(receipt), ...say('LIKE A SHOP RECEIPT', C.amber));

  // 16: second question: point at one row, and only one
  const hlRow2 = rowBox(2, 2, C.violet, 0.10);
  const qBg = new M.RoundedRectangle({ width: P ? 5.6 : 3.9, height: 1.25, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  qBg.setFill(C.card, 0.95); qBg.moveTo(AUX);
  const qT1 = T('HOW TO POINT AT', 15, C.muted, true, true); qT1.moveTo([AUX[0], AUX[1] + 0.24, 0]);
  const qT2 = T('EXACTLY ONE ROW?', 18, C.violet, true, true); qT2.moveTo([AUX[0], AUX[1] - 0.20, 0]);
  const qCard = new M.VGroup(qBg, qT1, qT2);
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(receipt, hlRow0)), new M.Create(hlRow2), new M.FadeIn(qCard),
    ...say('POINT AT EXACTLY 1 ROW?', C.violet),
    ...fbox(['second question:', ['pick out 1 row', C.cyan], ['and only 1', C.amber]], C.violet));

  // 17: try the order number alone
  const ordColBox = colBox(0, 0, C.amber, 0.08);
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(hlRow2, qCard)), new M.Create(ordColBox, { runTime: 0.75 }),
    ...say('TRY: ORDER ALONE', C.amber), ...fbox(['test: Order'], C.amber));

  // 18: 101 points at two rows; 103 points at two rows — fails
  const dup101 = new M.VGroup(cellBox(0, 0, 0, C.pink, 0.16), cellBox(1, 0, 0, C.pink, 0.16));
  const dup103 = new M.VGroup(cellBox(3, 0, 0, C.pink, 0.16), cellBox(4, 0, 0, C.pink, 0.16));
  await until(S(18));
  await play(new M.Create(dup101), ...fbox(['test: Order', ['101 → 2 rows ✗', C.pink]], C.pink));
  await until(S(18) + 2.7);
  await play(new M.Create(dup103), ...say('ORDER REPEATS ✗', C.pink),
    ...fbox(['test: Order', ['101 → 2 rows ✗', C.pink], ['103 → 2 rows ✗', C.pink], ['does not work', C.pink]], C.pink));

  // 19: try the book alone
  const bookColBox = colBox(3, 3, C.amber, 0.08);
  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(ordColBox, dup101, dup103)), new M.Create(bookColBox, { runTime: 0.7 }),
    ...say('TRY: BOOK ALONE', C.amber), ...fbox(['test: Book'], C.amber));

  // 20: B2 appears in two rows; B3 appears in two rows — fails
  const dupB2 = new M.VGroup(cellBox(1, 3, 3, C.pink, 0.16), cellBox(3, 3, 3, C.pink, 0.16));
  const dupB3 = new M.VGroup(cellBox(2, 3, 3, C.pink, 0.16), cellBox(4, 3, 3, C.pink, 0.16));
  await until(S(20));
  await play(new M.Create(dupB2), ...fbox(['test: Book', ['B2 → 2 rows ✗', C.pink]], C.pink));
  await until(S(20) + 2.4);
  await play(new M.Create(dupB3), ...say('BOOK REPEATS ✗', C.pink),
    ...fbox(['test: Book', ['B2 → 2 rows ✗', C.pink], ['B3 → 2 rows ✗', C.pink], ['does not work', C.pink]], C.pink));

  // 21: try two fields together: order and line
  const keyColBox = colBox(0, 1, C.green, 0.07);
  await until(S(21));
  await play(new M.FadeOut(new M.VGroup(bookColBox, dupB2, dupB3)), new M.Create(keyColBox),
    ...say('TRY: ORDER + LINE', C.green), ...fbox(['test:', ['(Order, Line)', C.green]], C.green));

  // 22-23: read all six (Order, Line) pairs aloud
  const pairCells = ROWS.map((_, r) => cellBox(r, 0, 1, C.green, 0.12));
  const pairBadges = ROWS.map((vals, r) => {
    const ch = chip(`(${vals[0]}, ${vals[1]})`, C.green, P ? 2.05 : 1.88, P ? 0.56 : 0.50, P ? 16 : 16);
    if (P) {
      const col = r % 3, row = Math.floor(r / 3);
      ch.moveTo([AUX[0] + (col - 1) * 2.25, AUX[1] + (0.5 - row) * 0.72, 0]);
    } else {
      const col = r % 2, row = Math.floor(r / 2);
      ch.moveTo([AUX[0] + (col === 0 ? -1.02 : 1.02), AUX[1] + (1 - row) * 0.64, 0]);
    }
    return ch;
  });

  await until(S(22));
  await play(
    new M.LaggedStart([0, 1, 2].map(r => new M.Create(pairCells[r])), { lagRatio: 0.45, runTime: 2.3 }),
    new M.LaggedStart([0, 1, 2].map(r => new M.FadeIn(pairBadges[r])), { lagRatio: 0.45, runTime: 2.3 }));

  await until(S(23));
  await play(
    new M.LaggedStart([3, 4, 5].map(r => new M.Create(pairCells[r])), { lagRatio: 0.45, runTime: 2.5 }),
    new M.LaggedStart([3, 4, 5].map(r => new M.FadeIn(pairBadges[r])), { lagRatio: 0.45, runTime: 2.5 }));

  // 24: six rows, six different pairs
  await until(S(24));
  await play(
    new M.LaggedStart(pairBadges.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.1, runTime: 1.5 }),
    ...say('6 ROWS · 6 DIFFERENT PAIRS ✓', C.green),
    ...fbox(['rows  = 6', ['pairs = 6 (no repeat)', C.green]], C.green));

  // 25: fields that pick out exactly one row are called a key
  await until(S(25));
  await play(...say('KEY = PICKS OUT 1 ROW', C.green),
    ...fbox([['key', C.green], '= fields that pick', '  out exactly 1 row'], C.green));

  // 26: our key is order and line together
  await until(S(26));
  await play(new M.Indicate(keyColBox, { color: C.amber }), ...say('KEY = (ORDER, LINE)', C.green),
    ...fbox([['our key:', C.green], ['(Order, Line)', C.amber]], C.green));

  // 27: Order and Book are unique only by luck
  const lkW = P ? 6.2 : 4.05, lkH = 1.98;
  const lkBg = new M.RoundedRectangle({ width: lkW, height: lkH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  lkBg.setFill(C.card, 0.96); lkBg.moveTo(AUX);
  const lkT = T('SAME BOOK ON 2 LINES?', 15, C.amber, true, true); lkT.moveTo([AUX[0], AUX[1] + 0.66, 0]);
  const lk1 = T('105  |  line 1  |  B1', 16, C.ink, true); lk1.moveTo([AUX[0], AUX[1] + 0.18, 0]);
  const lk2 = T('105  |  line 2  |  B1', 16, C.ink, true); lk2.moveTo([AUX[0], AUX[1] - 0.24, 0]);
  const lkBad = T('(105, B1) repeats ✗', 15, C.pink, true, true); lkBad.moveTo([AUX[0], AUX[1] - 0.68, 0]);
  const luckCard = new M.VGroup(lkBg, lkT, lk1, lk2, lkBad);
  await until(S(27));
  await play(new M.FadeOut(new M.VGroup(...pairBadges)), new M.FadeIn(luckCard),
    ...say('ORDER + BOOK: ONLY BY LUCK', C.amber),
    ...fbox(['(Order, Book):', ['could repeat ✗', C.pink], ['use (Order, Line)', C.green]], C.amber));

  // 28: key is like a seat in a theatre (row letter + seat number)
  const thW = P ? 5.8 : 4.05, thH = 2.12;
  const thBg = new M.RoundedRectangle({ width: thW, height: thH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  thBg.setFill(C.card, 0.96); thBg.moveTo(AUX);
  const thParts = [thBg];
  const gx0 = AUX[0] - 0.68, gy0 = AUX[1] + 0.42, sdx = 0.56, sdy = 0.42;
  for (let c = 0; c < 4; c++) {
    const ch = T(String(c + 1), 15, c === 2 ? C.amber : C.muted, true, c === 2);
    ch.moveTo([gx0 + c * sdx, gy0 + 0.36, 0]); thParts.push(ch);
  }
  ['A', 'B', 'C'].forEach((rl, r) => {
    const lt = T(rl, 15, r === 1 ? C.amber : C.muted, true, r === 1);
    lt.moveTo([gx0 - 0.50, gy0 - r * sdy, 0]); thParts.push(lt);
    for (let c = 0; c < 4; c++) {
      const hit = r === 1 && c === 2;
      const inBand = r === 1 || c === 2;
      const sq = new M.RoundedRectangle({ width: 0.42, height: 0.32, cornerRadius: 0.06,
        color: hit ? C.green : (inBand ? C.amber : C.line), strokeWidth: hit ? 2.5 : 1.5 });
      sq.setFill(hit ? C.green : (inBand ? C.amber : C.bg), hit ? 0.85 : (inBand ? 0.16 : 0.7));
      sq.moveTo([gx0 + c * sdx, gy0 - r * sdy, 0]);
      thParts.push(sq);
    }
  });
  const thCap = T('Row B + Seat 3 → 1 seat', 15, C.green, true, true);
  thCap.moveTo([AUX[0], AUX[1] - 0.78, 0]); thParts.push(thCap);
  const theatre = new M.VGroup(...thParts);
  await until(S(28));
  await play(new M.FadeOut(luckCard), new M.FadeIn(theatre),
    ...say('LIKE A THEATRE SEAT', C.amber),
    ...fbox(['theatre seat:', ['Row B + Seat 3', C.green], '→ 1 exact seat'], C.amber));

  // 29: key must be unique — no two rows share it
  await until(S(29));
  await play(new M.FadeOut(theatre),
    new M.LaggedStart(pairCells.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.1, runTime: 1.5 }),
    ...say('UNIQUE = NO TWO ROWS SHARE IT', C.green),
    ...fbox([['key must be unique', C.green], 'no two rows share it'], C.green));

  // 30: to check a key, count rows then count different keys
  await until(S(30));
  await play(...say('CHECK: ROWS = DISTINCT KEYS', C.cyan),
    ...fbox([['key check:', C.cyan], 'count(rows)', ['= count(distinct keys)', C.amber]]));

  // 31: six rows and six different keys — check passes
  await until(S(31));
  await play(new M.Indicate(keyColBox, { color: C.green }),
    ...say('6 = 6 · CHECK PASSES ✓', C.green),
    ...fbox(['rows          = 6', 'distinct keys = 6', ['6 = 6  ✓ PASS', C.green]], C.green));

  // 32: why does this matter? every later step depends on it
  await until(S(32));
  await play(new M.FadeOut(new M.VGroup(...pairCells)),
    ...say('EVERY LATER STEP DEPENDS ON IT', C.violet),
    ...fbox(['why it matters:', '1. counting right', '2. matching tables'], C.violet));

  // 33: count orders by counting each order number only once: 101, 102, 103, 104 -> 4
  const ordChips = [
    ['#1 · 101', C.cyan],
    ['#2 · 102', C.pink],
    ['#3 · 103', C.cyan],
    ['#4 · 104', C.pink],
  ].map(([txt, col], k) => {
    const ch = chip(txt, col, P ? 1.62 : 1.88, 0.56, P ? 15 : 16);
    if (P) ch.moveTo([AUX[0] + (k - 1.5) * 1.78, AUX[1], 0]);
    else ch.moveTo([AUX[0] + (k % 2 === 0 ? -1.02 : 1.02), AUX[1] + (k < 2 ? 0.36 : -0.36), 0]);
    return ch;
  });
  await until(S(33));
  await play(...say('COUNT EACH ORDER ONCE', C.amber),
    ...fbox(['to count orders:', 'count each order #', ['only once', C.amber]], C.amber));
  await until(S(33) + 5.2);
  await play(
    new M.LaggedStart(ordChips.map(ch => new M.FadeIn(ch)), { lagRatio: 0.45, runTime: 3.1 }),
    new M.LaggedStart([0, 2, 3, 5].map(r => new M.Indicate(rowCells[r][0], { color: C.amber })), { lagRatio: 0.45, runTime: 3.1 }));
  await until(S(33) + 8.9);
  await play(...say('4 DISTINCT ORDERS ✓', C.green),
    ...fbox(['101, 102, 103, 104', ['orders = 4  ✓', C.green]], C.green));

  // 34: when combining tables, the key tells us how rows match
  const catW = P ? 6.0 : 4.0, catH = 2.02;
  const catBg = new M.RoundedRectangle({ width: catW, height: catH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  catBg.setFill(C.card, 0.96); catBg.moveTo(AUX);
  const catHdr = T('CATALOG  (key: Book)', 15, C.amber, true, true); catHdr.moveTo([AUX[0], AUX[1] + 0.68, 0]);
  const cat1 = T('B1   Garden Guide', 15, C.amber, true); cat1.moveTo([AUX[0], AUX[1] + 0.22, 0]);
  const cat2 = T('B2   Star Atlas', 15, C.amber, true); cat2.moveTo([AUX[0], AUX[1] - 0.20, 0]);
  const cat3 = T('B3   Easy Soups', 15, C.amber, true); cat3.moveTo([AUX[0], AUX[1] - 0.62, 0]);
  const catCard = new M.VGroup(catBg, catHdr, cat1, cat2, cat3);
  const bookKeyBox = colBox(3, 3, C.amber, 0.08);
  const catArrow = new M.Arrow({
    start: P ? [COL_X[3], T_BOT - 0.04, 0] : [TR + 0.06, AUX[1], 0],
    end: P ? [COL_X[3], AUX[1] + catH / 2 + 0.04, 0] : [AUX[0] - catW / 2 - 0.04, AUX[1], 0],
    color: C.amber, strokeWidth: 2.5
  });
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...ordChips)), new M.Create(bookKeyBox), new M.FadeIn(catCard), new M.Create(catArrow),
    ...say('KEYS MATCH ROWS ACROSS TABLES', C.amber),
    ...fbox(['combine tables:', ['key matches rows', C.amber]], C.amber));

  // 35: common trap: thinking the order number is the key
  const trapColBox = colBox(0, 0, C.pink, 0.10);
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(keyColBox, bookKeyBox, catCard, catArrow)), new M.Create(trapColBox),
    ...say('TRAP: ORDER IS NOT THE KEY', C.pink),
    ...fbox([['common trap:', C.pink], 'Order ≠ key'], C.pink));

  // 36: count of orders comes out too big: six instead of four
  const trW = P ? 6.0 : 4.0, trH = 1.85;
  const trBg = new M.RoundedRectangle({ width: trW, height: trH, cornerRadius: 0.16, color: C.pink, strokeWidth: 2 });
  trBg.setFill(C.card, 0.96); trBg.moveTo(AUX);
  const barMax = P ? 3.2 : 2.1, barL = AUX[0] - trW / 2 + 0.28;
  const bar6 = new M.RoundedRectangle({ width: barMax, height: 0.42, cornerRadius: 0.08, color: C.pink, strokeWidth: 2 });
  bar6.setFill(C.pink, 0.65); bar6.moveTo([barL + barMax / 2, AUX[1] + 0.34, 0]);
  const bar4W = barMax * 4 / 6;
  const bar4 = new M.RoundedRectangle({ width: bar4W, height: 0.42, cornerRadius: 0.08, color: C.green, strokeWidth: 2 });
  bar4.setFill(C.green, 0.65); bar4.moveTo([barL + bar4W / 2, AUX[1] - 0.34, 0]);
  const trL6 = T('6 rows ✗', 15, C.pink, true, true); trL6.moveTo([barL + barMax + 0.72, AUX[1] + 0.34, 0]);
  const trL4 = T('4 orders ✓', 15, C.green, true, true); trL4.moveTo([barL + bar4W + 0.84, AUX[1] - 0.34, 0]);
  const trapCard = new M.VGroup(trBg, bar6, bar4, trL6, trL4);
  await until(S(36));
  await play(new M.FadeIn(trapCard),
    new M.LaggedStart(rowNums.map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('6 INSTEAD OF 4', C.pink),
    ...fbox([['rows   = 6  ✗', C.pink], ['orders = 4  ✓', C.green]], C.pink));

  // 37: before any analysis, say the grain out loud and test the key
  const keyColBox2 = colBox(0, 1, C.green, 0.07);
  await until(S(37));
  await play(new M.FadeOut(new M.VGroup(trapColBox, trapCard)), new M.Create(keyColBox2),
    ...say('SAY THE GRAIN · TEST THE KEY', C.cyan),
    ...fbox([['before analysis:', C.cyan], ['1. say the grain', C.violet], ['2. test the key', C.green]]));

  // 38: next lesson preview: pick rows and columns a question needs
  const selBoxes = [0, 1, 3, 4].map(r => cellBox(r, 3, 4, C.violet, 0.14));
  await until(S(38));
  await play(new M.LaggedStart(selBoxes.map(b => new M.Create(b)), { lagRatio: 0.14, runTime: 1.3 }),
    ...say('NEXT: PICK ROWS & COLUMNS', C.violet),
    ...fbox(['next lesson:', 'pick the rows &', 'columns you need'], C.violet));

  // 39: one-sentence recap
  const hlGrainEnd = rowBox(0, 0, C.violet, 0.09);
  await until(S(39));
  await play(new M.FadeOut(new M.VGroup(...selBoxes)), new M.Create(hlGrainEnd),
    new M.Indicate(keyColBox2, { color: C.amber }),
    ...say('GRAIN = 1 ROW · KEY = PICKS 1 ROW', C.amber),
    ...fbox([['grain:', C.violet], '  what 1 row means', ['key:', C.green], '  picks out 1 row'], C.amber));
}
