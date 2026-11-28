// 3.1.1 File schemas: plain text CSV -> schema & types -> parsing -> numbers you can trust.
// Beat i = sentence i (0-based, 0..43). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const HEADER = ['order', 'line', 'store', 'book', 'copies', 'price'];
  const ROWS = [
    ['101', '1', 'North', 'B1', '2', '$10.00'],
    ['101', '2', 'North', 'B2', '1', '$20.00'],
    ['102', '1', 'South', 'B3', '1', '$15.00'],
    ['103', '1', 'North', 'B2', '1', '$20.00'],
    ['103', '2', 'North', 'B3', '2', '$15.00'],
    ['104', '1', 'South', 'B4', '1', '$25.00'],
  ];
  const RAW_LINES = [HEADER.join(','), ...ROWS.map(r => r.join(','))];

  const PILL = P ? [0, 3.75, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, -5.0, 0] : [4.45, -0.45, 0];
  const LCX = P ? 0 : -2.2;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function fitW(m, maxW) {
    const w = m.getWidth();
    if (w > maxW && w > 0) m.scale(maxW / w);
    return m;
  }

  // Formula / status box (one at a time, never overlapping data)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20, lh = P ? 0.48 : 0.40;
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
    const maxw = P ? FW - 0.9 : 4.2, maxh = P ? 2.0 : 2.6;
    const scf = Math.min(1, maxw / wd, maxh / ht);
    if (scf < 1) g.scale(scf);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Helper: clean geometric arrow built from Lines
  function makeArrow(start, end, color = C.muted, sw = 3, head = 0.22) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const tip = [end[0], end[1], 0];
    const b1 = [end[0] - ux * head + px * head * 0.55, end[1] - uy * head + py * head * 0.55, 0];
    const b2 = [end[0] - ux * head - px * head * 0.55, end[1] - uy * head - py * head * 0.55, 0];
    return new M.VGroup(
      new M.Line({ start, end: tip, color, strokeWidth: sw }),
      new M.Line({ start: b1, end: tip, color, strokeWidth: sw }),
      new M.Line({ start: b2, end: tip, color, strokeWidth: sw })
    );
  }

  // Helper: card with centered text
  function makeCard(text, x, y, w, h, color, opts = {}) {
    const { fill = C.card, fillOp = 0.92, size = 20, textColor = color, mono = true, bold = true, stroke = 2 } = opts;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: stroke });
    r.setFill(fill, fillOp); r.moveTo([x, y, 0]);
    const lbl = fitW(T(text, size, textColor, mono, bold), w - 0.2);
    lbl.moveTo([x, y, 0]);
    return { g: new M.VGroup(r, lbl), r, lbl };
  }

  // Helper: shopfront icon
  function makeShop(name, color, x, y) {
    const bw = P ? 3.4 : 2.8, bh = P ? 2.3 : 1.35;
    const wall = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.12, color, strokeWidth: 2.5 });
    wall.setFill(C.card, 0.94); wall.moveTo([x, y, 0]);
    const awning = new M.RoundedRectangle({ width: bw + 0.22, height: 0.34, cornerRadius: 0.08, color, strokeWidth: 2 });
    awning.setFill(color, 0.25); awning.moveTo([x, y + bh / 2 + 0.14, 0]);
    const door = new M.Rectangle({ width: 0.36, height: 0.48, color, strokeWidth: 1.5 });
    door.setFill(color, 0.22); door.moveTo([x, y - bh / 2 + 0.26, 0]);
    const lbl = T(name, P ? 28 : 24, color, false, true); lbl.moveTo([x, y + (P ? 0.35 : 0.18), 0]);
    return new M.VGroup(wall, awning, door, lbl);
  }

  // --- ACT 1: Two shops, four orders, the owner's question, the sales file (0-4) ---

  const shopX = P ? 1.85 : 2.8, shopY = P ? 0.15 : 0.25;
  const northShop = P ? makeShop('North', C.cyan, -1.9, 1.5) : makeShop('North', C.cyan, -shopX, shopY);
  const southShop = P ? makeShop('South', C.pink, -1.9, -2.4) : makeShop('South', C.pink, shopX, shopY);

  // 0: Imagine a small bookstore with two shops, called North and South.
  await until(S(0));
  await play(
    new M.LaggedStart([new M.FadeIn(northShop), new M.FadeIn(southShop)], { lagRatio: 0.35, runTime: 1.5 }),
    ...say('TWO BOOKSTORE SHOPS')
  );

  // 1: In January, the shops sold books in four orders.
  const orderSpecs = P ? [
    ['Order 101', C.cyan, 1.95, 2.1],
    ['Order 103', C.cyan, 1.95, 0.9],
    ['Order 102', C.pink, 1.95, -1.8],
    ['Order 104', C.pink, 1.95, -3.0],
  ] : [
    ['Order 101', C.cyan, -shopX, -1.15],
    ['Order 103', C.cyan, -shopX, -2.05],
    ['Order 102', C.pink, shopX, -1.15],
    ['Order 104', C.pink, shopX, -2.05],
  ];
  const orderCards = orderSpecs.map(([txt, col, x, y]) =>
    makeCard(txt, x, y, P ? 3.1 : 2.4, P ? 0.9 : 0.64, col, { size: P ? 22 : 19, fillOp: 0.9 }).g
  );
  await until(S(1));
  await play(
    new M.LaggedStart(orderCards.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.5 }),
    ...say('JANUARY: 4 ORDERS', C.amber)
  );

  // 2: The owner asks you a simple question: how much money did we make?
  const qBadge = makeCard('$ ?', 0, P ? -5.2 : -0.8, P ? 2.4 : 1.7, P ? 1.15 : 0.95, C.amber, { size: P ? 36 : 30, fillOp: 0.95 }).g;
  await until(S(2));
  await play(
    new M.FadeIn(qBadge),
    new M.LaggedStart(orderCards.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.14, runTime: 1.6 }),
    ...say('HOW MUCH MONEY DID WE MAKE?', C.amber)
  );

  // 3: The answers sit in a file of sales, sent to you by the shop's cash register.
  const regX = P ? 0 : -3.1, regY = P ? 1.4 : -0.4;
  const regBody = new M.RoundedRectangle({ width: P ? 2.8 : 2.9, height: P ? 1.5 : 1.6, cornerRadius: 0.14, color: C.muted, strokeWidth: 2.5 });
  regBody.setFill(C.card, 0.95); regBody.moveTo([regX, regY, 0]);
  const regScr = new M.RoundedRectangle({ width: P ? 2.1 : 2.2, height: 0.45, cornerRadius: 0.08, color: C.green, strokeWidth: 1.5 });
  regScr.setFill(C.bg, 0.95); regScr.moveTo([regX, regY + 0.35, 0]);
  const regTxt = T('REGISTER', P ? 16 : 17, C.green, true, true); regTxt.moveTo([regX, regY + 0.35, 0]);
  const regKeys = [0, 1, 2, 3].map(k => {
    const r = new M.Rectangle({ width: 0.36, height: 0.24, color: C.muted, strokeWidth: 1 });
    r.setFill(C.grid, 0.9); r.moveTo([regX + (k - 1.5) * 0.5, regY - 0.3, 0]);
    return r;
  });
  const regGroup = new M.VGroup(regBody, regScr, regTxt, ...regKeys);

  const fileX = P ? 0 : 3.1, fileY = P ? -3.4 : -0.4;
  const fileCard = new M.RoundedRectangle({ width: P ? 2.8 : 2.9, height: P ? 1.7 : 1.9, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  fileCard.setFill(C.card, 0.95); fileCard.moveTo([fileX, fileY, 0]);
  const fileTitle = T('sales file', P ? 19 : 20, C.cyan, true, true); fileTitle.moveTo([fileX, fileY + 0.48, 0]);
  const fileLines = [0, 1, 2, 3].map(k =>
    new M.Line({ start: [fileX - 0.95, fileY + 0.08 - k * 0.24, 0], end: [fileX + 0.95, fileY + 0.08 - k * 0.24, 0], color: C.muted, strokeWidth: 2 })
  );
  const fileIcon = new M.VGroup(fileCard, fileTitle, ...fileLines);

  const sendArrow = P
    ? makeArrow([0, regY - 0.95, 0], [0, fileY + 1.05, 0], C.amber, 3)
    : makeArrow([regX + 1.7, regY, 0], [fileX - 1.7, fileY, 0], C.amber, 3);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(northShop, southShop, ...orderCards, qBadge), { runTime: 0.6 }),
    new M.FadeIn(regGroup, { runTime: 0.9 }),
    new M.Create(sendArrow, { runTime: 0.9 }),
    new M.FadeIn(fileIcon, { runTime: 1.1 }),
    ...say('SALES FILE FROM THE REGISTER')
  );

  // 4: Let's open that file and look at it, exactly as it arrives.
  const pageW = P ? 7.3 : 9.4, pageH = P ? 7.4 : 4.0, pageY = P ? -1.2 : -0.6;
  const openPage = new M.RoundedRectangle({ width: pageW, height: pageH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2 });
  openPage.setFill(C.card, 0.96); openPage.moveTo([0, pageY, 0]);
  const pageBar = new M.Line({
    start: [-pageW / 2 + 0.2, pageY + pageH / 2 - 0.52, 0],
    end: [pageW / 2 - 0.2, pageY + pageH / 2 - 0.52, 0],
    color: C.line, strokeWidth: 2
  });
  const pageTitle = T('sales file  (plain text)', P ? 16 : 18, C.muted, true);
  pageTitle.moveTo([0, pageY + pageH / 2 - 0.26, 0]);
  const openPageGroup = new M.VGroup(openPage, pageBar, pageTitle);

  const rawPitch = P ? 0.92 : 0.46;
  const rawTopY = pageY + pageH / 2 - (P ? 1.15 : 0.85);
  const rawTexts = RAW_LINES.map((line, idx) => {
    const t = fitW(T(line, P ? 21 : 21, C.ink, true), pageW - 0.7);
    t.moveTo([-pageW / 2 + 0.35 + t.getWidth() / 2, rawTopY - idx * rawPitch, 0]);
    return t;
  });
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(regGroup, sendArrow, fileIcon), { runTime: 0.7 }),
    new M.FadeIn(openPageGroup, { runTime: 0.9 }),
    new M.LaggedStart(rawTexts.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('OPENING THE FILE AS IT ARRIVES')
  );

  // --- ACT 2: Plain text -> first line -> fields -> columns -> CSV -> header (5-12) ---

  // 5: It is a page of plain text. Each line is one row of a table.
  await until(S(5));
  await play(
    new M.LaggedStart(rawTexts.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('PLAIN TEXT: ONE LINE = ONE ROW')
  );

  // 6: Here is the first data line, piece by piece.
  const line1Box = new M.RoundedRectangle({ width: pageW - 0.45, height: rawPitch * 0.92, cornerRadius: 0.1, color: C.cyan, strokeWidth: 2.5 });
  line1Box.moveTo([0, rawTopY - rawPitch, 0]);
  await until(S(6));
  await play(new M.Create(line1Box, { runTime: 0.9 }), ...say('FIRST DATA LINE'));

  // Table geometry (shared by beats 7..13)
  const colW = P ? [1.05, 0.78, 1.30, 0.95, 1.15, 1.65] : [1.55, 1.15, 1.95, 1.40, 1.65, 2.30];
  const colGap = P ? 0.08 : 0.12;
  const totalTW = colW.reduce((a, b) => a + b, 0) + colGap * 5;
  const colX = [];
  let cxCursor = -totalTW / 2;
  for (let c = 0; c < 6; c++) {
    colX.push(cxCursor + colW[c] / 2);
    cxCursor += colW[c] + colGap;
  }
  const RH = P ? 0.95 : 0.50;
  const headerY = P ? 2.6 : 1.12;
  const rowY = r => headerY - (r + 1) * RH;

  // 7: One oh one, comma, one, comma, North, comma, B one, comma, two, comma, dollar ten point zero zero.
  const tokStrs = ['101', ',', '1', ',', 'North', ',', 'B1', ',', '2', ',', '$10.00'];
  const tokSize = P ? 27 : 30;
  const tokObjs = tokStrs.map(s => T(s, tokSize, s === ',' ? C.amber : C.ink, true, true));
  const tokGap = P ? 0.06 : 0.11;
  const tokTotal = tokObjs.reduce((acc, t) => acc + t.getWidth(), 0) + tokGap * (tokObjs.length - 1);
  const tokScale = Math.min(1, (FW - 0.8) / tokTotal);
  let tx = -(tokTotal * tokScale) / 2;
  tokObjs.forEach(t => {
    if (tokScale < 1) t.scale(tokScale);
    const w = t.getWidth();
    t.moveTo([tx + w / 2, P ? -0.6 : rowY(0), 0]);
    tx += w + tokGap * tokScale;
  });

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(openPageGroup, ...rawTexts, line1Box), { runTime: 0.6 }),
    ...say('FIRST LINE: PIECE BY PIECE')
  );
  await play(new M.LaggedStart(tokObjs.map(t => new M.FadeIn(t)), { lagRatio: 0.65, runTime: 6.2 }));

  // 8: The commas cut the line into pieces. Each piece is called a field.
  const commas = tokObjs.filter((_, i) => i % 2 === 1);
  const cutLines = commas.map(cm => {
    const [x, y] = cm.getCenter();
    return new M.DashedLine({ start: [x, y - 0.38, 0], end: [x, y + 0.38, 0], color: C.amber });
  });

  // Build glowing table cells for all 6 data rows
  const cellRects = []; // [r][c]
  const cellTexts = []; // [r][c]
  const rowGroups = []; // [r]
  for (let r = 0; r < ROWS.length; r++) {
    const isNorth = ROWS[r][2] === 'North';
    const col = isNorth ? C.cyan : C.pink;
    const rRects = [], rTexts = [], parts = [];
    for (let c = 0; c < 6; c++) {
      const box = new M.RoundedRectangle({ width: colW[c], height: RH - 0.08, cornerRadius: 0.08, color: col, strokeWidth: 1.8 });
      box.setFill(col, 0.12); box.moveTo([colX[c], rowY(r), 0]);
      const txt = fitW(T(ROWS[r][c], P ? 18 : 19, C.ink, true), colW[c] - 0.16);
      txt.moveTo([colX[c], rowY(r), 0]);
      rRects.push(box); rTexts.push(txt);
      parts.push(box, txt);
    }
    cellRects.push(rRects);
    cellTexts.push(rTexts);
    rowGroups.push(new M.VGroup(...parts));
  }

  await until(S(8));
  await play(
    new M.LaggedStart(cutLines.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 0.7 }),
    ...say('COMMAS CUT THE LINE INTO FIELDS', C.amber)
  );
  await play(
    new M.FadeOut(new M.VGroup(...tokObjs, ...cutLines), { runTime: 0.6 }),
    new M.FadeIn(rowGroups[0], { runTime: 0.8 })
  );

  // 9: The fields line up, one under another, and form the columns of the table.
  await until(S(9));
  await play(
    new M.LaggedStart(rowGroups.slice(1).map(g => new M.FadeIn(g)), { lagRatio: 0.2, runTime: 1.9 }),
    ...say('FIELDS LINE UP INTO COLUMNS')
  );

  // 10: A file built this way is called a CSV file. CSV means comma-separated values.
  const csvNote = pill(P ? 'North = cyan · South = pink' : 'North = cyan   ·   South = pink', C.muted, P ? 17 : 16);
  csvNote.moveTo([0, rowY(5) - (P ? 1.0 : 0.62), 0]);
  await until(S(10));
  await play(
    new M.FadeIn(csvNote, { runTime: 0.8 }),
    new M.LaggedStart(rowGroups.map(g => new M.Indicate(g, { color: C.green })), { lagRatio: 0.12, runTime: 2.0 }),
    ...say('CSV = COMMA-SEPARATED VALUES', C.green)
  );

  // 11: The very top line gives a name to each column: order, line, store, book, copies, and price. It is called the header.
  const headerCells = HEADER.map((name, c) => {
    const box = new M.RoundedRectangle({ width: colW[c], height: RH - 0.06, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
    box.setFill(C.amber, 0.18); box.moveTo([colX[c], headerY, 0]);
    const txt = fitW(T(name, P ? 17 : 18, C.amber, true, true), colW[c] - 0.14);
    txt.moveTo([colX[c], headerY, 0]);
    return new M.VGroup(box, txt);
  });
  await until(S(11));
  await play(
    new M.LaggedStart(headerCells.map(hc => new M.FadeIn(hc)), { lagRatio: 0.45, runTime: 4.6 }),
    ...say('TOP LINE = THE HEADER', C.amber)
  );

  // 12: So this row says: order one oh one, its first line, North shop, book B one, two copies, at ten dollars each.
  const colWalkBoxes = HEADER.map((_, c) => {
    const b = new M.RoundedRectangle({ width: colW[c] + 0.06, height: RH * 2 + 0.04, cornerRadius: 0.1, color: C.amber, strokeWidth: 2.5 });
    b.moveTo([colX[c], (headerY + rowY(0)) / 2, 0]);
    return b;
  });
  await until(S(12));
  await play(
    new M.LaggedStart(colWalkBoxes.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.65, runTime: 5.5 }),
    ...say('ROW 1: ORDER 101 · NORTH · B1 · 2 · $10', C.cyan)
  );

  // --- ACT 3: The catch — plain text cannot be added (13-18) ---

  // 13: Now here is the catch. To the computer, the whole file is just letters and signs.
  const priceFocus = new M.RoundedRectangle({ width: colW[5] + 0.12, height: RH + 0.06, cornerRadius: 0.1, color: C.pink, strokeWidth: 3 });
  priceFocus.moveTo([colX[5], rowY(0), 0]);
  await until(S(13));
  for (let r = 0; r < ROWS.length; r++) {
    for (let c = 0; c < 6; c++) {
      cellRects[r][c].setFill(C.card, 0.85);
      cellRects[r][c].setColor(C.muted);
    }
  }
  await play(
    new M.FadeOut(new M.VGroup(csvNote, ...colWalkBoxes), { runTime: 0.6 }),
    new M.Create(priceFocus, { runTime: 0.9 }),
    ...say('TO THE COMPUTER: ONLY LETTERS & SIGNS', C.pink)
  );

  // 14: It does not know that ten is a number. It sees a dollar sign, a one, a zero, a dot, and two more zeros.
  const chars = ['$', '1', '0', '.', '0', '0'];
  const charKind = ['sign', 'char', 'char', 'dot', 'char', 'char'];
  const tw14 = P ? 0.95 : 1.32, tg14 = P ? 0.14 : 0.22;
  const tileY14 = P ? -1.0 : -0.35;
  const charTiles14 = chars.map((ch, idx) => {
    const x = (idx - 2.5) * (tw14 + tg14);
    const box = new M.RoundedRectangle({ width: tw14, height: tw14 * 1.15, cornerRadius: 0.14, color: idx === 0 || idx === 3 ? C.amber : C.pink, strokeWidth: 2.5 });
    box.setFill(C.card, 0.95); box.moveTo([x, tileY14, 0]);
    const txt = T(ch, P ? 34 : 44, C.ink, true, true); txt.moveTo([x, tileY14, 0]);
    const sub = T(charKind[idx], P ? 14 : 16, C.muted, true); sub.moveTo([x, tileY14 - tw14 * 0.82, 0]);
    return new M.VGroup(box, txt, sub);
  });

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...headerCells, ...rowGroups, priceFocus), { runTime: 0.6 }),
    ...say('SIX CHARACTERS, NOT A NUMBER', C.pink)
  );
  await play(new M.LaggedStart(charTiles14.map(t => new M.FadeIn(t)), { lagRatio: 0.5, runTime: 4.5 }));

  // 15: Let's watch what happens if we try to add two prices while they are still text.
  const addY = P ? -0.9 : -0.35;
  const cardW = P ? 2.1 : 2.3, cardH = P ? 1.15 : 1.25;
  const card10 = makeCard('"10"', LCX - (P ? 1.65 : 1.85), addY, cardW, cardH, C.pink, { size: 32, textColor: C.ink }).g;
  const card20 = makeCard('"20"', LCX + (P ? 1.65 : 1.85), addY, cardW, cardH, C.pink, { size: 32, textColor: C.ink }).g;
  const tagTxt1 = T('text', 16, C.pink, true); tagTxt1.moveTo([LCX - (P ? 1.65 : 1.85), addY - cardH / 2 - 0.3, 0]);
  const tagTxt2 = T('text', 16, C.pink, true); tagTxt2.moveTo([LCX + (P ? 1.65 : 1.85), addY - cardH / 2 - 0.3, 0]);
  const plusTxt = T('+', 36, C.amber, true, true); plusTxt.moveTo([LCX, addY, 0]);

  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(...charTiles14), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(card10, card20, tagTxt1, tagTxt2, plusTxt), { runTime: 0.9 }),
    ...say('TRY ADDING TWO PRICES AS TEXT', C.amber)
  );

  // 16: Ten dollars and twenty dollars should make thirty.
  await until(S(16));
  await play(
    ...fbox([['expected:', C.muted], ['10 + 20 = 30', C.green]], C.green),
    ...say('SHOULD MAKE 30 DOLLARS', C.green)
  );

  // 17: But text cannot be added. Many programs glue the two pieces side by side.
  const gluedL = makeCard('10', LCX - cardW * 0.44, addY, cardW * 0.88, cardH, C.pink, { size: 34, textColor: C.ink }).g;
  const gluedR = makeCard('20', LCX + cardW * 0.44, addY, cardW * 0.88, cardH, C.pink, { size: 34, textColor: C.ink }).g;
  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(card10, card20, plusTxt, tagTxt1, tagTxt2), { runTime: 0.6 }),
    new M.FadeIn(gluedL, { shift: [0.6, 0, 0], runTime: 0.9 }),
    new M.FadeIn(gluedR, { shift: [-0.6, 0, 0], runTime: 0.9 }),
    ...say('TEXT GETS GLUED SIDE BY SIDE', C.pink)
  );

  // 18: We get the text one, zero, two, zero. That is not thirty. It is not a price at all.
  const glued1020 = makeCard('"1020"', LCX, addY, cardW * 1.85, cardH + 0.1, C.pink, { size: 38, textColor: C.pink, fillOp: 0.95 }).g;
  const not30 = pill('≠ 30  (NOT A PRICE)', C.pink, P ? 17 : 18);
  not30.moveTo([LCX, addY - cardH / 2 - 0.65, 0]);
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(gluedL, gluedR), { runTime: 0.5 }),
    new M.FadeIn(glued1020, { runTime: 0.8 }),
    new M.FadeIn(not30, { runTime: 0.8 }),
    ...fbox([['as text:', C.muted], ['"10" + "20" = "1020"', C.pink], ['not 30!', C.pink]], C.pink),
    ...say('"1020" IS NOT 30 — NOT A PRICE', C.pink)
  );

  // --- ACT 4: Types & Schema (19-26) ---

  const schemaDefs = [
    { col: 'order', type: 'whole number', color: C.cyan, sample: '101' },
    { col: 'line', type: 'whole number', color: C.cyan, sample: '1' },
    { col: 'store', type: 'text', color: C.violet, sample: 'North' },
    { col: 'book', type: 'text', color: C.violet, sample: 'B1' },
    { col: 'copies', type: 'whole number', color: C.cyan, sample: '2' },
    { col: 'price', type: 'decimal number', color: C.amber, sample: '$10.00' },
  ];
  const sStep = P ? 1.1 : 0.60;
  const sTopY = P ? 2.1 : 0.95;
  const sRowY = i => sTopY - i * sStep;
  const sH = P ? 0.82 : 0.48;
  const colBX = P ? -2.8 : -3.55, colBW = P ? 1.75 : 2.1;
  const typBX = P ? 0.1 : 0.15, typBW = P ? 2.8 : 3.7;
  const smpBX = P ? 2.4 : 3.35, smpBW = P ? 1.45 : 1.9;

  const sColCards = [];
  const sArrows = [];
  const sQMarks = [];
  const sTypeCards = [];
  const sSamples = [];

  schemaDefs.forEach((d, i) => {
    const y = sRowY(i);
    sColCards.push(makeCard(d.col, colBX, y, colBW, sH, C.ink, { size: P ? 19 : 19, fillOp: 0.9 }).g);
    sArrows.push(makeArrow([colBX + colBW / 2 + 0.06, y, 0], [typBX - typBW / 2 - 0.06, y, 0], C.muted, 2, 0.12));
    sQMarks.push(makeCard('?', typBX, y, typBW, sH, C.muted, { size: P ? 20 : 20, fillOp: 0.6 }).g);
    sTypeCards.push(makeCard(d.type, typBX, y, typBW, sH, d.color, { size: P ? 19 : 19, fill: C.card, fillOp: 0.95 }).g);
    sSamples.push(makeCard(d.sample, smpBX, y, smpBW, sH, C.muted, { size: P ? 18 : 17, textColor: C.ink, fillOp: 0.7 }).g);
  });

  // 19: So, before any adding, we must tell the computer what kind of thing each column holds.
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(glued1020, not30), { runTime: 0.6 }),
    ...clearBox(),
    new M.LaggedStart(schemaDefs.map((_, i) => new M.FadeIn(new M.VGroup(sColCards[i], sArrows[i], sQMarks[i], sSamples[i]))), { lagRatio: 0.1, runTime: 1.5 }),
    ...say('TELL THE COMPUTER EACH COLUMN’S KIND')
  );

  // 20: That kind is called a type. (Short beat: 1.59s!)
  const typeHead = T('TYPE', P ? 19 : 17, C.violet, true, true);
  typeHead.moveTo([typBX, sTopY + (P ? 0.72 : 0.42), 0]);
  await until(S(20));
  await play(new M.FadeIn(typeHead, { runTime: 0.7 }), ...say('THAT KIND = A TYPE', C.violet));

  // 21: Here are the types we need. Order: a whole number. Line: a whole number.
  await until(S(21));
  await play(
    new M.FadeOut(sQMarks[0], { runTime: 0.5 }), new M.FadeIn(sTypeCards[0], { runTime: 0.7 }),
    new M.FadeOut(sQMarks[1], { runTime: 0.5 }), new M.FadeIn(sTypeCards[1], { runTime: 0.7 }),
    ...say('ORDER & LINE → WHOLE NUMBER', C.cyan)
  );

  // 22: Store: text. Book: text, because B one is a label, not an amount.
  await until(S(22));
  await play(
    new M.FadeOut(sQMarks[2], { runTime: 0.5 }), new M.FadeIn(sTypeCards[2], { runTime: 0.7 }),
    new M.FadeOut(sQMarks[3], { runTime: 0.5 }), new M.FadeIn(sTypeCards[3], { runTime: 0.7 }),
    new M.Indicate(sSamples[3], { color: C.violet, runTime: 1.2 }),
    ...say('STORE & BOOK → TEXT (LABELS)', C.violet)
  );

  // 23: Copies: a whole number. Price: a decimal number, a number that may have a part after the dot.
  await until(S(23));
  await play(
    new M.FadeOut(sQMarks[4], { runTime: 0.5 }), new M.FadeIn(sTypeCards[4], { runTime: 0.7 }),
    new M.FadeOut(sQMarks[5], { runTime: 0.5 }), new M.FadeIn(sTypeCards[5], { runTime: 0.7 }),
    new M.Indicate(sSamples[5], { color: C.amber, runTime: 1.4 }),
    ...say('COPIES → WHOLE  ·  PRICE → DECIMAL', C.amber)
  );

  // 24: This list of columns, each with its type, is called a schema.
  const sfW = P ? 7.7 : 9.8, sfH = P ? 5 * sStep + sH + 0.35 : 3.95;
  const sfY = (sRowY(0) + sRowY(5)) / 2;
  const schemaFrame = new M.RoundedRectangle({ width: sfW, height: sfH, cornerRadius: 0.2, color: C.violet, strokeWidth: 3 });
  schemaFrame.moveTo([P ? 0 : -0.1, sfY, 0]);
  const schemaName = pill('SCHEMA', C.violet, P ? 22 : 20);
  schemaName.moveTo([0, sfY - sfH / 2 - (P ? 0.55 : 0.4), 0]);
  await until(S(24));
  await play(
    new M.Create(schemaFrame, { runTime: 1.1 }),
    new M.FadeIn(schemaName, { runTime: 0.8 }),
    ...say('SCHEMA = COLUMNS + THEIR TYPES', C.violet)
  );

  // 25: We write the schema down before reading the file. Then the tool checks every row against it.
  const checkX = P ? 3.55 : 4.7;
  const checks = schemaDefs.map((_, i) => {
    const t = T('✓', P ? 20 : 22, C.green, true, true);
    t.moveTo([checkX, sRowY(i), 0]);
    return t;
  });
  await until(S(25));
  await play(
    new M.LaggedStart(checks.map(ck => new M.FadeIn(ck)), { lagRatio: 0.16, runTime: 1.8 }),
    ...say('WRITE SCHEMA FIRST → CHECK EVERY ROW', C.green)
  );

  // 26: A schema is like the labels on the drawers of a cupboard. Each drawer says what may go inside.
  const cupCols = P ? 2 : 3, cupRows = P ? 3 : 2;
  const drW = P ? 3.3 : 3.0, drH = P ? 1.7 : 1.35, drGap = 0.24;
  const cupW = cupCols * drW + (cupCols + 1) * drGap + 0.2;
  const cupH = cupRows * drH + (cupRows + 1) * drGap + 0.2;
  const cupY = P ? -0.9 : -0.45;
  const cupOuter = new M.RoundedRectangle({ width: cupW, height: cupH, cornerRadius: 0.18, color: C.muted, strokeWidth: 2.5 });
  cupOuter.setFill(C.card, 0.92); cupOuter.moveTo([0, cupY, 0]);
  const drawers = schemaDefs.map((d, i) => {
    const c = i % cupCols, r = Math.floor(i / cupCols);
    const x = (c - (cupCols - 1) / 2) * (drW + drGap);
    const y = cupY + ((cupRows - 1) / 2 - r) * (drH + drGap);
    const front = new M.RoundedRectangle({ width: drW, height: drH, cornerRadius: 0.1, color: d.color, strokeWidth: 2 });
    front.setFill(C.bg, 0.9); front.moveTo([x, y, 0]);
    const plate = new M.RoundedRectangle({ width: drW - 0.4, height: 0.56, cornerRadius: 0.06, color: d.color, strokeWidth: 1.4 });
    plate.setFill(d.color, 0.16); plate.moveTo([x, y + 0.22, 0]);
    const lbl = fitW(T(`${d.col}: ${d.type.replace(' number', '')}`, P ? 18 : 16, d.color, true, true), drW - 0.55);
    lbl.moveTo([x, y + 0.22, 0]);
    const handle = new M.Line({ start: [x - 0.35, y - 0.35, 0], end: [x + 0.35, y - 0.35, 0], color: C.muted, strokeWidth: 4 });
    return new M.VGroup(front, plate, lbl, handle);
  });

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(...sColCards, ...sArrows, ...sTypeCards, ...sSamples, typeHead, schemaFrame, schemaName, ...checks), { runTime: 0.6 }),
    new M.FadeIn(cupOuter, { runTime: 0.7 }),
    new M.LaggedStart(drawers.map(dr => new M.FadeIn(dr)), { lagRatio: 0.12, runTime: 1.5 }),
    ...say('LIKE LABELS ON CUPBOARD DRAWERS', C.violet)
  );

  // --- ACT 5: Parsing "$10.00" -> 10, adding as numbers, 3-step pipeline (27-35) ---

  // 27: Now let's turn the text price into a real number, one step at a time.
  const pY = P ? -1.6 : -0.45;
  const pTileW = P ? 0.90 : 0.96, pTileG = 0.12;
  const pTileX = idx => LCX + (idx - 2.5) * (pTileW + pTileG);
  const pStartBox = makeCard('"$10.00"', LCX, pY, P ? 3.4 : 3.6, 1.1, C.pink, { size: 30, textColor: C.ink }).g;
  const pStartSub = T('text from the file', 16, C.muted, true); pStartSub.moveTo([LCX, pY - 0.85, 0]);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(cupOuter, ...drawers), { runTime: 0.6 }),
    new M.FadeIn(pStartBox, { runTime: 0.8 }),
    new M.FadeIn(pStartSub, { runTime: 0.8 }),
    ...say('TURN TEXT PRICE INTO A NUMBER')
  );

  // 28: Step one: take the text, dollar ten point zero zero.
  const pChars = ['$', '1', '0', '.', '0', '0'];
  const pTiles = pChars.map((ch, idx) => {
    const col = idx === 0 ? C.amber : C.pink;
    const r = new M.RoundedRectangle({ width: pTileW, height: pTileW * 1.15, cornerRadius: 0.12, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([pTileX(idx), pY, 0]);
    const t = T(ch, P ? 30 : 34, C.ink, true, true); t.moveTo([pTileX(idx), pY, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(pStartBox, pStartSub), { runTime: 0.5 }),
    new M.LaggedStart(pTiles.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.0 }),
    ...fbox([['step 1: start with text', C.muted], ['"$10.00"', C.pink]], C.pink),
    ...say('STEP 1: TAKE "$10.00"', C.pink)
  );

  // 29: Step two: remove the dollar sign. Now we have ten point zero zero.
  const cleanTiles = ['1', '0', '.', '0', '0'].map((ch, idx) => {
    const x = LCX + (idx - 2) * (pTileW + pTileG);
    const r = new M.RoundedRectangle({ width: pTileW, height: pTileW * 1.15, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, pY, 0]);
    const t = T(ch, P ? 30 : 34, C.amber, true, true); t.moveTo([x, pY, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(29));
  await play(
    new M.FadeOut(pTiles[0], { shift: [0, 0.8, 0], runTime: 0.9 }),
    new M.FadeOut(new M.VGroup(...pTiles.slice(1)), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...cleanTiles), { runTime: 0.9 }),
    ...fbox([['step 1: "$10.00"', C.muted], ['step 2: remove "$"', C.amber], ['"10.00"', C.amber]], C.amber),
    ...say('STEP 2: REMOVE THE "$"', C.amber)
  );

  // 30: Step three: read it as a decimal number. It becomes the number ten.
  const num10 = makeCard('10', LCX, pY, P ? 2.4 : 2.6, 1.35, C.green, { size: 42, fill: C.green, fillOp: 0.16 }).g;
  const num10Sub = T('decimal number', 17, C.green, true); num10Sub.moveTo([LCX, pY - 1.0, 0]);
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...cleanTiles), { runTime: 0.5 }),
    new M.FadeIn(num10, { runTime: 0.8 }),
    new M.FadeIn(num10Sub, { runTime: 0.8 }),
    new M.Flash(num10, { color: C.green, flashRadius: 0.9, runTime: 0.8 }),
    ...fbox([['step 1: "$10.00"', C.muted], ['step 2: "10.00"', C.muted], ['step 3: 10 (number)', C.green]], C.green),
    ...say('STEP 3: READ AS DECIMAL → 10', C.green)
  );

  // 31: This turning of text into a typed value is called parsing.
  const parseTag = pill('"$10.00"  →  10', C.green, P ? 17 : 18);
  parseTag.moveTo([LCX, pY + 1.15, 0]);
  await until(S(31));
  await play(
    new M.FadeIn(parseTag, { runTime: 0.8 }),
    new M.Indicate(num10, { color: C.green, runTime: 1.0 }),
    ...say('PARSING = TEXT → TYPED VALUE', C.green)
  );

  // 32: Let's try the addition again, now with numbers.
  const nAddY = P ? -1.0 : -0.15;
  const nChipW = P ? 1.55 : 1.7, nChipH = 1.0;
  const n10 = makeCard('10', LCX - (P ? 2.1 : 2.5), nAddY, nChipW, nChipH, C.green, { size: 32, fill: C.green, fillOp: 0.15 }).g;
  const nPlus = T('+', 34, C.cyan, true, true); nPlus.moveTo([LCX - (P ? 1.05 : 1.25), nAddY, 0]);
  const n20 = makeCard('20', LCX, nAddY, nChipW, nChipH, C.green, { size: 32, fill: C.green, fillOp: 0.15 }).g;
  const barY = nAddY - 1.35;
  const unitBar = P ? 0.16 : 0.21;
  const bar10 = new M.Rectangle({ width: 10 * unitBar, height: 0.42, color: C.cyan, strokeWidth: 2 });
  bar10.setFill(C.cyan, 0.72); bar10.moveTo([LCX - 10 * unitBar, barY, 0]);
  const bar20 = new M.Rectangle({ width: 20 * unitBar, height: 0.42, color: C.green, strokeWidth: 2 });
  bar20.setFill(C.green, 0.72); bar20.moveTo([LCX + 5 * unitBar, barY, 0]);
  const barLbl10 = T('10', 18, C.cyan, true); barLbl10.moveTo([LCX - 10 * unitBar, barY - 0.42, 0]);
  const barLbl20 = T('20', 18, C.green, true); barLbl20.moveTo([LCX + 5 * unitBar, barY - 0.42, 0]);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(num10, num10Sub, parseTag), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(n10, nPlus, n20, bar10, bar20, barLbl10, barLbl20), { runTime: 0.9 }),
    ...fbox([['now as numbers:', C.muted], ['10 + 20 = ?', C.cyan]], C.cyan),
    ...say('TRY ADDING AGAIN — AS NUMBERS')
  );

  // 33: Ten plus twenty makes thirty. That is the right answer.
  const nEq = T('=', 34, C.amber, true, true); nEq.moveTo([LCX + (P ? 1.05 : 1.25), nAddY, 0]);
  const n30 = makeCard('30', LCX + (P ? 2.1 : 2.5), nAddY, nChipW, nChipH, C.amber, { size: 34, fill: C.amber, fillOp: 0.2 }).g;
  const barSumLbl = T('total = 30  ✓', 18, C.amber, true, true); barSumLbl.moveTo([LCX, barY + 0.48, 0]);
  await until(S(33));
  await play(
    new M.FadeIn(new M.VGroup(nEq, n30, barSumLbl), { runTime: 0.8 }),
    new M.Flash(n30, { color: C.amber, flashRadius: 0.8, runTime: 0.8 }),
    ...fbox([['as numbers:', C.muted], ['10 + 20 = 30  ✓', C.green]], C.green),
    ...say('10 + 20 = 30  ✓', C.green)
  );

  // 34: In short: schema first, then parse, then calculate.
  const pipeDefs = [
    { num: '1. SCHEMA', desc: 'say what each column holds', color: C.violet },
    { num: '2. PARSE', desc: 'convert the text', color: C.cyan },
    { num: '3. CALCULATE', desc: 'only then do the maths', color: C.green },
  ];
  const pipePos = P
    ? [[0, 1.6, 0], [0, -1.0, 0], [0, -3.6, 0]]
    : [[-4.2, -0.35, 0], [0, -0.35, 0], [4.2, -0.35, 0]];
  const pipeW = P ? 6.4 : 3.35, pipeH = P ? 1.8 : 1.9;
  const pipeCards = pipeDefs.map((d, i) => {
    const [x, y] = pipePos[i];
    const r = new M.RoundedRectangle({ width: pipeW, height: pipeH, cornerRadius: 0.16, color: d.color, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = fitW(T(d.num, P ? 26 : 24, d.color, true, true), pipeW - 0.35);
    t.moveTo([x, y + (P ? 0.35 : 0.32), 0]);
    return new M.VGroup(r, t);
  });
  const pipeArrows = [0, 1].map(i => P
    ? makeArrow([0, pipePos[i][1] - pipeH / 2 - 0.08, 0], [0, pipePos[i + 1][1] + pipeH / 2 + 0.08, 0], C.amber, 3)
    : makeArrow([pipePos[i][0] + pipeW / 2 + 0.12, -0.35, 0], [pipePos[i + 1][0] - pipeW / 2 - 0.12, -0.35, 0], C.amber, 3)
  );

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(n10, nPlus, n20, nEq, n30, bar10, bar20, barLbl10, barLbl20, barSumLbl), { runTime: 0.5 }),
    ...clearBox(),
    new M.LaggedStart([
      new M.FadeIn(pipeCards[0]), new M.Create(pipeArrows[0]),
      new M.FadeIn(pipeCards[1]), new M.Create(pipeArrows[1]),
      new M.FadeIn(pipeCards[2])
    ], { lagRatio: 0.3, runTime: 2.2 }),
    ...say('SCHEMA → PARSE → CALCULATE', C.amber)
  );

  // 35: In everyday words: say what each column holds, convert the text, and only then do the maths.
  const pipeDescs = pipeDefs.map((d, i) => {
    const [x, y] = pipePos[i];
    const t = fitW(T(d.desc, P ? 20 : 16, C.ink, false), pipeW - 0.35);
    t.moveTo([x, y - (P ? 0.4 : 0.35), 0]);
    return t;
  });
  await until(S(35));
  await play(
    new M.LaggedStart(pipeDescs.map(t => new M.FadeIn(t)), { lagRatio: 0.6, runTime: 3.4 }),
    ...say('NAME TYPES → CONVERT → DO MATHS', C.green)
  );

  // --- ACT 6: Where it helps, Common trap, Next lesson, Recap (36-43) ---

  // 36: A schema is useful every time data arrive from outside: a file, a form, or another computer.
  const srcNames = ['a file', 'a form', 'another computer'];
  const srcPos = P
    ? [[-2.45, 1.7, 0], [0, 1.7, 0], [2.45, 1.7, 0]]
    : [[-4.7, 0.75, 0], [-4.7, -0.45, 0], [-4.7, -1.65, 0]];
  const srcW = P ? 2.3 : 3.0, srcH = P ? 1.0 : 0.82;
  const srcCards = srcNames.map((nm, i) =>
    makeCard(nm, srcPos[i][0], srcPos[i][1], srcW, srcH, C.cyan, { size: P ? 18 : 18, mono: false }).g
  );
  const gatePos = P ? [0, -0.8, 0] : [-0.2, -0.45, 0];
  const gateCard = makeCard('SCHEMA', gatePos[0], gatePos[1], P ? 2.8 : 2.6, P ? 1.05 : 1.4, C.violet, { size: 24, fill: C.violet, fillOp: 0.2 }).g;
  const srcArrows = srcPos.map(([x, y]) => P
    ? makeArrow([x, y - srcH / 2 - 0.08, 0], [gatePos[0] + (x * 0.25), gatePos[1] + 0.6, 0], C.muted, 2.2)
    : makeArrow([x + srcW / 2 + 0.12, y, 0], [gatePos[0] - 1.42, gatePos[1] + (y + 0.45) * 0.35, 0], C.muted, 2.2)
  );

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...pipeCards, ...pipeArrows, ...pipeDescs), { runTime: 0.6 }),
    new M.LaggedStart([...srcCards.map(c => new M.FadeIn(c)), ...srcArrows.map(a => new M.Create(a)), new M.FadeIn(gateCard)], { lagRatio: 0.2, runTime: 2.6 }),
    ...say('USEFUL FOR ANY OUTSIDE DATA')
  );

  // 37: It catches problems early, before they hide inside a total.
  const totPos = P ? [0, -3.9, 0] : [4.3, -0.45, 0];
  const totCard = makeCard('CLEAN TOTAL', totPos[0], totPos[1], P ? 3.2 : 2.9, P ? 0.95 : 1.2, C.green, { size: 20, fill: C.green, fillOp: 0.16 }).g;
  const gateOut = P
    ? makeArrow([gatePos[0], gatePos[1] - 0.6, 0], [totPos[0], totPos[1] + 0.56, 0], C.green, 3)
    : makeArrow([gatePos[0] + 1.4, gatePos[1], 0], [totPos[0] - 1.55, totPos[1], 0], C.green, 3);
  const badPos = P ? [2.5, -2.35, 0] : [-0.2, -2.15, 0];
  const badStop = makeCard('! CAUGHT', badPos[0], badPos[1], P ? 2.1 : 2.4, 0.72, C.pink, { size: 17, fill: C.pink, fillOp: 0.2 }).g;

  await until(S(37));
  await play(
    new M.Create(gateOut, { runTime: 0.7 }),
    new M.FadeIn(totCard, { runTime: 0.8 }),
    new M.FadeIn(badStop, { runTime: 0.8 }),
    new M.Indicate(gateCard, { color: C.amber, runTime: 1.0 }),
    ...say('CATCHES PROBLEMS BEFORE THE TOTAL', C.amber)
  );

  // 38: Here is a common trap. Some values will not parse.
  const tRowY = i => (P ? 1.9 : 0.75) - i * (P ? 1.4 : 0.82);
  const tRawX = LCX - (P ? 1.4 : 1.7), tResX = LCX + (P ? 1.65 : 1.85);
  const tRawW = P ? 3.2 : 3.4, tResW = P ? 2.5 : 2.7, tH = P ? 0.95 : 0.62;
  const okRow1 = new M.VGroup(
    makeCard('"$10.00"', tRawX, tRowY(0), tRawW, tH, C.cyan, { size: 18 }).g,
    makeArrow([tRawX + tRawW / 2 + 0.1, tRowY(0), 0], [tResX - tResW / 2 - 0.1, tRowY(0), 0], C.muted, 2, 0.14),
    makeCard('10  ✓', tResX, tRowY(0), tResW, tH, C.green, { size: 19, fill: C.green, fillOp: 0.16 }).g
  );
  const okRow2 = new M.VGroup(
    makeCard('"$20.00"', tRawX, tRowY(1), tRawW, tH, C.cyan, { size: 18 }).g,
    makeArrow([tRawX + tRawW / 2 + 0.1, tRowY(1), 0], [tResX - tResW / 2 - 0.1, tRowY(1), 0], C.muted, 2, 0.14),
    makeCard('20  ✓', tResX, tRowY(1), tResW, tH, C.green, { size: 19, fill: C.green, fillOp: 0.16 }).g
  );
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(...srcCards, ...srcArrows, gateCard, gateOut, totCard, badStop), { runTime: 0.6 }),
    new M.FadeIn(okRow1, { runTime: 0.7 }),
    new M.FadeIn(okRow2, { runTime: 0.7 }),
    ...say('COMMON TRAP: VALUES THAT WON’T PARSE', C.pink)
  );

  // 39: A price typed as "ten dollars", or left empty, cannot become a number.
  const badCell1 = makeCard('"ten dollars"', tRawX, tRowY(2), tRawW, tH, C.pink, { size: 17, textColor: C.ink }).g;
  const badArr1 = makeArrow([tRawX + tRawW / 2 + 0.1, tRowY(2), 0], [tResX - tResW / 2 - 0.1, tRowY(2), 0], C.pink, 2, 0.14);
  const badRes1 = makeCard('✗ FAIL', tResX, tRowY(2), tResW, tH, C.pink, { size: 19, fill: C.pink, fillOp: 0.2 }).g;

  // Empty cell glows grey and empty per chapter 3.1 style
  const emptyRect = new M.RoundedRectangle({ width: tRawW, height: tH, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  emptyRect.setFill(C.muted, 0.18); emptyRect.moveTo([tRawX, tRowY(3), 0]);
  const emptyHint = T('(empty)', 15, C.muted, true); emptyHint.moveTo([tRawX, tRowY(3), 0]);
  const badCell2 = new M.VGroup(emptyRect, emptyHint);
  const badArr2 = makeArrow([tRawX + tRawW / 2 + 0.1, tRowY(3), 0], [tResX - tResW / 2 - 0.1, tRowY(3), 0], C.pink, 2, 0.14);
  const badRes2 = makeCard('✗ FAIL', tResX, tRowY(3), tResW, tH, C.pink, { size: 19, fill: C.pink, fillOp: 0.2 }).g;

  const badRow1 = new M.VGroup(badCell1, badArr1, badRes1);
  const badRow2 = new M.VGroup(badCell2, badArr2, badRes2);

  await until(S(39));
  await play(
    new M.LaggedStart([new M.FadeIn(badRow1), new M.FadeIn(badRow2)], { lagRatio: 0.45, runTime: 1.8 }),
    ...say('"ten dollars" OR EMPTY ≠ NUMBER', C.pink)
  );

  // 40: A good tool flags that row. It must not quietly turn it into zero.
  const flag1 = makeCard('FLAG !', tResX, tRowY(2), tResW, tH, C.amber, { size: 19, fill: C.amber, fillOp: 0.22 }).g;
  const flag2 = makeCard('FLAG !', tResX, tRowY(3), tResW, tH, C.amber, { size: 19, fill: C.amber, fillOp: 0.22 }).g;
  await until(S(40));
  await play(
    new M.FadeIn(flag1, { runTime: 0.6 }),
    new M.FadeIn(flag2, { runTime: 0.6 }),
    ...fbox([['good tool:', C.muted], ['flag bad rows', C.amber], ['never silent 0!', C.pink]], C.pink),
    ...say('FLAG BAD ROWS — NEVER SILENT ZERO', C.pink)
  );

  // 41: So always count how many values failed to parse, and look at them.
  await until(S(41));
  await play(
    new M.Indicate(flag1, { color: C.amber, runTime: 1.0 }),
    new M.Indicate(flag2, { color: C.amber, runTime: 1.0 }),
    ...fbox([['parse report', C.muted], ['parsed ok: 2', C.green], ['failed:    2  ← check', C.pink]], C.amber),
    ...say('COUNT PARSE FAILURES & INSPECT', C.amber)
  );

  // 42: Next, we will meet data that do not arrive as a flat table at all.
  const flatX = P ? 0 : -3.4, flatY = P ? 0.25 : -0.45;
  const flatBox = new M.RoundedRectangle({ width: P ? 4.4 : 3.6, height: P ? 1.5 : 2.1, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  flatBox.setFill(C.card, 0.7); flatBox.moveTo([flatX, flatY, 0]);
  const flatLbl = T('flat table', 18, C.muted, true); flatLbl.moveTo([flatX, flatY + (P ? 0.42 : 0.72), 0]);
  const flatRows = [0, 1, 2].map(k =>
    new M.Line({ start: [flatX - 1.3, flatY - 0.05 - k * 0.28, 0], end: [flatX + 1.3, flatY - 0.05 - k * 0.28, 0], color: C.muted, strokeWidth: 2 })
  );
  const flatGroup = new M.VGroup(flatBox, flatLbl, ...flatRows);

  const nestX = P ? 0 : 2.6, nestY = P ? -2.65 : -0.45;
  const nestW = P ? 5.6 : 4.8, nestH = P ? 2.5 : 2.6;
  const nestOuter = new M.RoundedRectangle({ width: nestW, height: nestH, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
  nestOuter.setFill(C.card, 0.95); nestOuter.moveTo([nestX, nestY, 0]);
  const nestHead = T('order 103 · North', P ? 18 : 20, C.violet, true, true); nestHead.moveTo([nestX, nestY + nestH / 2 - 0.42, 0]);
  const item1 = makeCard('B2 · 1 copy · $20', nestX, nestY + 0.05, nestW - 0.7, 0.62, C.cyan, { size: 16 }).g;
  const item2 = makeCard('B3 · 2 copies · $15', nestX, nestY - 0.72, nestW - 0.7, 0.62, C.cyan, { size: 16 }).g;
  const nestGroup = new M.VGroup(nestOuter, nestHead, item1, item2);
  const nextArr = P
    ? makeArrow([0, flatY - 0.9, 0], [0, nestY + nestH / 2 + 0.14, 0], C.violet, 3)
    : makeArrow([flatX + 2.0, flatY, 0], [nestX - nestW / 2 - 0.18, nestY, 0], C.violet, 3);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(okRow1, okRow2, badRow1, badRow2, flag1, flag2), { runTime: 0.6 }),
    ...clearBox(),
    new M.FadeIn(flatGroup, { runTime: 0.8 }),
    new M.Create(nextArr, { runTime: 0.8 }),
    new M.FadeIn(nestGroup, { runTime: 1.0 }),
    ...say('NEXT: DATA THAT AREN’T A FLAT TABLE', C.violet)
  );

  // 43: In one sentence: a schema tells the computer what each column holds, so text becomes numbers you can trust.
  const finY = P ? -0.35 : -0.15;
  const finW = P ? 3.6 : 2.9, finH = P ? 1.25 : 1.25;
  const fP = P ? [[0, 2.2], [0, -0.1], [0, -2.4]] : [[-4.2, finY], [0, finY], [4.2, finY]];
  const fin1 = makeCard('"$10.00"', fP[0][0], fP[0][1], finW, finH, C.pink, { size: P ? 30 : 26, textColor: C.ink }).g;
  const fin2 = makeCard('SCHEMA', fP[1][0], fP[1][1], P ? 3.6 : 2.9, finH, C.violet, { size: P ? 30 : 26, fill: C.card, fillOp: 0.95 }).g;
  const fin3 = makeCard('10  ✓', fP[2][0], fP[2][1], finW, finH, C.green, { size: P ? 32 : 28, fill: C.card, fillOp: 0.95 }).g;
  const finA1 = P ? makeArrow([0, 1.5, 0], [0, 0.6, 0], C.amber, 3, 0.18) : makeArrow([-2.6, finY, 0], [-1.6, finY, 0], C.amber, 3, 0.18);
  const finA2 = P ? makeArrow([0, -0.8, 0], [0, -1.7, 0], C.green, 3, 0.18) : makeArrow([1.6, finY, 0], [2.6, finY, 0], C.green, 3, 0.18);
  const finBanner = P
    ? makeCard('schema → parse → numbers you can trust', 0, -4.5, 7.4, 1.0, C.green, { size: 20, fill: C.card, fillOp: 0.95 }).g
    : makeCard('schema  →  parse  →  numbers you can trust', 0, finY - 1.55, 9.6, 0.88, C.green, { size: 22, fill: C.green, fillOp: 0.12 }).g;

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(flatGroup, nextArr, nestGroup), { runTime: 0.6 }),
    new M.LaggedStart([new M.FadeIn(fin1), new M.Create(finA1), new M.FadeIn(fin2), new M.Create(finA2), new M.FadeIn(fin3)], { lagRatio: 0.2, runTime: 1.8 }),
    new M.FadeIn(finBanner, { runTime: 1.2 }),
    ...say('SCHEMA → PARSE → NUMBERS YOU CAN TRUST', C.green)
  );
}
