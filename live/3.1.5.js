// 3.1.5 SQL selection: picking rows and columns.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Shared January sales table (chapters/3.1.md)
  const HEADERS = ['order', 'line', 'store', 'book', 'copies', 'price'];
  const SALES = [
    ['101', '1', 'North', 'B1', '2', '10'],
    ['101', '2', 'North', 'B2', '1', '20'],
    ['102', '1', 'South', 'B3', '1', '15'],
    ['103', '1', 'North', 'B2', '1', '20'],
    ['103', '2', 'North', 'B3', '2', '15'],
    ['104', '1', 'South', 'B4', '1', '25'],
  ];
  const NORTH_IDX = [0, 1, 3, 4];
  const SOUTH_IDX = [2, 5];
  const RESULT_ROWS = [
    ['B1', '2'],
    ['B2', '1'],
    ['B2', '1'],
    ['B3', '2'],
  ];
  const CATALOG_ROWS = [
    ['B1', 'Garden Guide'],
    ['B2', 'Star Atlas'],
    ['B3', 'Easy Soups'],
  ];

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]) & laptop (14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 2.08, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const COL_W = P ? [1.14, 0.92, 1.34, 1.04, 1.30, 1.14] : [1.22, 0.96, 1.44, 1.12, 1.36, 1.18];
  const TBL_TOP = P ? 1.45 : 1.35;
  const TBL_RH = P ? 0.64 : 0.54;
  const CELL_FS = P ? 15 : 17;

  // Formula / SQL box (one at a time)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.3;
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

  // Table builders (each cell placed with moveTo before grouping)
  function fitText(text, size, color, maxW, mono = true, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    return t;
  }

  function makeCell(text, x, y, w, h, border, fill, fillOp, textColor, fs, bold = false) {
    const r = new M.Rectangle({ width: w, height: h, color: border, strokeWidth: 1.5 });
    r.setFill(fill, fillOp); r.moveTo([x, y, 0]);
    const t = fitText(text, fs, textColor, w - 0.14, true, bold);
    t.moveTo([x, y, 0]);
    return { r, t, g: new M.VGroup(r, t), x, y, w, h };
  }

  function makeTable({ title, titleColor = C.cyan, headers, rows, cx, topY, colW, rh, fs, rowStyle }) {
    const totalW = colW.reduce((a, b) => a + b, 0);
    const xLeft = cx - totalW / 2;
    const colX = [];
    let cur = xLeft;
    for (const w of colW) { colX.push(cur + w / 2); cur += w; }
    const hdrY = topY - rh / 2;
    const hdrs = headers.map((h, c) =>
      makeCell(h, colX[c], hdrY, colW[c], rh, C.muted, C.card, 0.96, C.ink, fs, true));
    const grid = rows.map((row, r) => {
      const y = topY - (r + 1.5) * rh;
      const st = rowStyle(row, r);
      return row.map((val, c) =>
        makeCell(val, colX[c], y, colW[c], rh, st.border, st.fill, st.fillOp, st.text, fs, false));
    });
    const label = title ? T(title, P ? 15 : 17, titleColor, true, true) : null;
    if (label) label.moveTo([xLeft + label.getWidth() / 2 + 0.04, topY + 0.21, 0]);
    const totalH = (rows.length + 1) * rh;
    const bottomY = topY - totalH;
    const allMobs = [...(label ? [label] : []), ...hdrs.map(c => c.g), ...grid.flat().map(c => c.g)];
    return { label, hdrs, grid, colX, colW, xLeft, totalW, topY, bottomY, totalH, rh, cx, allMobs };
  }

  const salesRowStyle = row => row[2] === 'North'
    ? { border: C.cyan, fill: C.cyan, fillOp: 0.13, text: C.ink }
    : { border: C.pink, fill: C.pink, fillOp: 0.12, text: C.pink };

  function makeSalesTable(cx = CX, topY = TBL_TOP, colW = COL_W, rh = TBL_RH, fs = CELL_FS) {
    return makeTable({ title: 'sales', titleColor: C.cyan, headers: HEADERS, rows: SALES, cx, topY, colW, rh, fs, rowStyle: salesRowStyle });
  }

  function makeBox(x, y, w, h, color, strokeWidth = 3, fill = C.bg, fillOp = 0) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.12, Math.min(w, h) / 3), color, strokeWidth });
    r.setFill(fill, fillOp); r.moveTo([x, y, 0]);
    return r;
  }

  // 0: North shop manager has one question
  const introW = P ? 6.5 : 6.4, introH = P ? 3.5 : 2.8, introY = P ? -0.55 : -0.35;
  const introCard = makeBox(CX, introY, introW, introH, C.cyan, 2.5, C.card, 0.95);
  const awning = Array.from({ length: 6 }, (_, k) => {
    const sw = (introW - 0.5) / 6;
    const sx = CX - (introW - 0.5) / 2 + (k + 0.5) * sw;
    const b = new M.Rectangle({ width: sw - 0.04, height: 0.28, color: C.cyan, strokeWidth: 1.5 });
    b.setFill(k % 2 === 0 ? C.cyan : C.bg, k % 2 === 0 ? 0.8 : 0.9);
    b.moveTo([sx, introY + introH / 2 - 0.32, 0]);
    return b;
  });
  const shopName = T('NORTH SHOP', P ? 30 : 32, C.cyan, true, true);
  shopName.moveTo([CX, introY + 0.45, 0]);
  const shopSub = T('January sales', P ? 20 : 21, C.muted, false, false);
  shopSub.moveTo([CX, introY - 0.05, 0]);
  const q1 = T(P ? '“What did my shop sell' : '“What did my shop sell in January?”', P ? 22 : 23, C.amber, false, true);
  q1.moveTo([CX, introY - (P ? 0.68 : 0.72), 0]);
  const introParts = [introCard, ...awning, shopName, shopSub, q1];
  if (P) {
    const q2 = T('in January?”', 22, C.amber, false, true);
    q2.moveTo([CX, introY - 1.12, 0]);
    introParts.push(q2);
  }
  const introGroup = new M.VGroup(...introParts);

  await until(S(0));
  await play(new M.FadeIn(introGroup, { runTime: 1.0 }), ...say('NORTH SHOP · JANUARY', C.cyan));

  // 1: Sales table again: six rows, six columns
  const tbl1 = makeSalesTable();
  await until(S(1));
  await play(
    new M.FadeOut(introGroup, { runTime: 0.5 }),
    new M.FadeIn(tbl1.label, { runTime: 0.5 }),
    new M.LaggedStart(tbl1.hdrs.map(c => new M.FadeIn(c.g, { runTime: 0.35 })), { lagRatio: 0.08, runTime: 0.7 }),
    new M.LaggedStart(tbl1.grid.map(row => new M.LaggedStart(row.map(c => new M.FadeIn(c.g, { runTime: 0.3 })), { lagRatio: 0.04 })), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('SALES TABLE: 6 ROWS × 6 COLUMNS', C.cyan)
  );

  // 2: The columns are: order, line, store, book, copies, and price
  await until(S(2));
  await play(
    new M.LaggedStart(tbl1.hdrs.map(c => new M.Indicate(c.g, { color: C.amber, runTime: 0.7 })), { lagRatio: 0.72, runTime: 4.3 }),
    ...say('6 COLUMNS', C.amber)
  );

  // 3: Manager does not need all of this
  const allBox = makeBox(tbl1.cx, tbl1.topY - tbl1.totalH / 2, tbl1.totalW + 0.16, tbl1.totalH + 0.16, C.muted, 2);
  await until(S(3));
  await play(
    new M.Create(allBox, { runTime: 0.8 }),
    ...fbox(['question:', ['North shop only', C.cyan], ['which books & how many?', C.amber]], C.cyan),
    ...say('KEEP ONLY WHAT WE NEED', C.amber)
  );

  // 4: First, the rows. Question is about North only.
  const storeBox = makeBox(tbl1.colX[2], tbl1.topY - tbl1.totalH / 2, tbl1.colW[2] + 0.08, tbl1.totalH + 0.12, C.amber, 3);
  await until(S(4));
  await play(
    new M.FadeOut(allBox, { runTime: 0.4 }),
    new M.Create(storeBox, { runTime: 0.8 }),
    ...fbox(['step 1: check the rows', ["store = 'North' ?", C.cyan]], C.cyan),
    ...say('STEP 1: CHECK THE ROWS', C.cyan)
  );

  // 5: Light up every row where store is North
  await until(S(5));
  SOUTH_IDX.forEach(r => tbl1.grid[r].forEach(c => c.r.setFill(C.card, 0.35)));
  await play(...say('LIGHT UP ROWS WHERE STORE = NORTH', C.cyan));

  // 6: Order 101 line 1; Order 101 line 2
  const rowHLs = {};
  const makeRowHL = r => makeBox(tbl1.cx, tbl1.grid[r][0].y, tbl1.totalW + 0.08, tbl1.rh + 0.04, C.cyan, 3);
  await until(S(6));
  tbl1.grid[0].forEach(c => c.r.setFill(C.cyan, 0.32));
  rowHLs[0] = makeRowHL(0);
  await play(
    new M.Create(rowHLs[0], { runTime: 0.6 }),
    new M.Flash(tbl1.grid[0][2].r, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['North rows:', ['101 · line 1  ✓', C.cyan]], C.cyan)
  );
  await until(S(6) + 1.85);
  tbl1.grid[1].forEach(c => c.r.setFill(C.cyan, 0.32));
  rowHLs[1] = makeRowHL(1);
  await play(
    new M.Create(rowHLs[1], { runTime: 0.6 }),
    new M.Flash(tbl1.grid[1][2].r, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['North rows:', '101 · line 1  ✓', ['101 · line 2  ✓', C.cyan]], C.cyan)
  );

  // 7: Order 103 line 1; Order 103 line 2
  await until(S(7));
  tbl1.grid[3].forEach(c => c.r.setFill(C.cyan, 0.32));
  rowHLs[3] = makeRowHL(3);
  await play(
    new M.Create(rowHLs[3], { runTime: 0.6 }),
    new M.Flash(tbl1.grid[3][2].r, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['North rows:', '101 · 1,  101 · 2  ✓', ['103 · line 1  ✓', C.cyan]], C.cyan)
  );
  await until(S(7) + 2.05);
  tbl1.grid[4].forEach(c => c.r.setFill(C.cyan, 0.32));
  rowHLs[4] = makeRowHL(4);
  await play(
    new M.Create(rowHLs[4], { runTime: 0.6 }),
    new M.Flash(tbl1.grid[4][2].r, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['North rows (4):', '101·1, 101·2  ✓', ['103·1, 103·2  ✓', C.cyan]], C.cyan)
  );

  // 8: Four rows glow. Two South rows fade away.
  await until(S(8));
  await play(
    new M.FadeOut(storeBox, { runTime: 0.5 }),
    ...SOUTH_IDX.flatMap(r => tbl1.grid[r].map(c => new M.FadeOut(c.g, { runTime: 0.9 }))),
    ...say('4 NORTH ROWS GLOW · 2 SOUTH FADE', C.cyan)
  );

  // 9: Filtering
  await until(S(9));
  await play(
    ...fbox([['FILTERING', C.green], 'keep rows that pass', ['4 of 6 rows kept', C.cyan]], C.green),
    ...say('FILTERING = KEEP ROWS THAT PASS', C.green)
  );

  // 10: Second, the columns: which books, and how many
  const colHLBook = makeBox(tbl1.colX[3], tbl1.topY - tbl1.totalH / 2, tbl1.colW[3] + 0.06, tbl1.totalH + 0.1, C.amber, 3);
  const colHLCopies = makeBox(tbl1.colX[4], tbl1.topY - tbl1.totalH / 2, tbl1.colW[4] + 0.06, tbl1.totalH + 0.1, C.amber, 3);
  await until(S(10));
  await play(
    new M.Create(colHLBook, { runTime: 0.7 }),
    new M.Create(colHLCopies, { runTime: 0.7 }),
    ...fbox(['step 2: columns', ['book   (which books)', C.amber], ['copies (how many)', C.amber]], C.amber),
    ...say('STEP 2: PICK THE COLUMNS', C.amber)
  );

  // 11: Keep two columns: book and copies. Other four fade away.
  const DROP_COLS = [0, 1, 2, 5];
  await until(S(11));
  await play(
    ...NORTH_IDX.map(r => new M.FadeOut(rowHLs[r], { runTime: 0.5 })),
    ...DROP_COLS.map(c => new M.FadeOut(tbl1.hdrs[c].g, { runTime: 0.9 })),
    ...NORTH_IDX.flatMap(r => DROP_COLS.map(c => new M.FadeOut(tbl1.grid[r][c].g, { runTime: 0.9 }))),
    ...say('KEEP BOOK & COPIES · DROP 4 COLS', C.amber)
  );

  // 12: What is left is a small table: four rows, two columns
  const res1 = makeTable({
    title: 'North sales', titleColor: C.cyan,
    headers: ['book', 'copies'], rows: RESULT_ROWS,
    cx: CX, topY: P ? 1.20 : 1.10,
    colW: P ? [2.4, 2.4] : [2.1, 2.1], rh: P ? 0.70 : 0.60, fs: P ? 19 : 20,
    rowStyle: () => ({ border: C.cyan, fill: C.cyan, fillOp: 0.16, text: C.ink })
  });
  await until(S(12));
  await play(
    new M.FadeOut(tbl1.label, { runTime: 0.4 }),
    new M.FadeOut(colHLBook, { runTime: 0.4 }),
    new M.FadeOut(colHLCopies, { runTime: 0.4 }),
    ...[3, 4].map(c => new M.FadeOut(tbl1.hdrs[c].g, { runTime: 0.4 })),
    ...NORTH_IDX.flatMap(r => [3, 4].map(c => new M.FadeOut(tbl1.grid[r][c].g, { runTime: 0.4 }))),
    ...res1.allMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })),
    ...fbox(['result table:', ['4 rows', C.cyan], ['2 columns', C.amber]], C.cyan),
    ...say('SMALL TABLE: 4 ROWS × 2 COLUMNS', C.cyan)
  );

  // 13: B1 2 copies, B2 1 copy, B2 1 copy, B3 2 copies
  const readLines = [
    ['North copies:', ['B1 → 2', C.cyan]],
    ['North copies:', 'B1 → 2', ['B2 → 1', C.cyan]],
    ['North copies:', 'B1 → 2,  B2 → 1', ['B2 → 1', C.cyan]],
    ['North copies:', 'B1 → 2,  B2 → 1', ['B2 → 1,  B3 → 2', C.cyan]],
  ];
  for (let i = 0; i < 4; i++) {
    await until(S(13) + i * 1.6);
    res1.grid[i].forEach(c => c.r.setFill(C.amber, 0.3));
    await play(
      ...res1.grid[i].map(c => new M.Indicate(c.g, { color: C.amber, runTime: 0.65 })),
      ...fbox(readLines[i], C.cyan)
    );
    res1.grid[i].forEach(c => c.r.setFill(C.cyan, 0.16));
  }

  // 14: 2 + 1 + 1 + 2 = 6 copies sold in North
  await until(S(14));
  res1.grid.forEach(row => row[1].r.setFill(C.green, 0.3));
  await play(
    new M.LaggedStart(res1.grid.map(row => new M.Indicate(row[1].g, { color: C.green, runTime: 0.6 })), { lagRatio: 0.18, runTime: 1.5 }),
    ...fbox(['total in North:', '2 + 1 + 1 + 2', ['= 6 copies', C.green]], C.green),
    ...say('6 COPIES SOLD IN NORTH', C.green)
  );

  // 15: Now let's ask a computer to do this for us
  const tbl2 = makeSalesTable();
  await until(S(15));
  await play(
    ...res1.allMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...tbl2.allMobs.map(m => new M.FadeIn(m, { runTime: 0.7 })),
    ...fbox(['same question,', ['ask a computer', C.violet]], C.violet),
    ...say('ASK A COMPUTER TO DO THIS', C.violet)
  );

  // 16: Tables like ours often live in a database (stores many tables)
  const dbPadX = 0.24, dbExtraBottom = P ? 0.92 : 0.56;
  const dbH = tbl2.totalH + 0.50 + dbExtraBottom;
  const dbY = tbl2.topY + 0.34 - dbH / 2;
  const dbBox = makeBox(tbl2.cx, dbY, tbl2.totalW + dbPadX * 2, dbH, C.violet, 2);
  const chipY = tbl2.bottomY - (P ? 0.50 : 0.34);
  const chipH = P ? 0.44 : 0.34;
  const chipCatalog = makeCell('catalog', tbl2.cx - 1.45, chipY, 2.2, chipH, C.amber, C.card, 0.9, C.amber, P ? 15 : 15, true);
  const chipOrders = makeCell('orders', tbl2.cx + 1.45, chipY, 2.2, chipH, C.violet, C.card, 0.9, C.violet, P ? 15 : 15, true);
  const dbTag = T('DATABASE', P ? 14 : 15, C.violet, true, true);
  dbTag.moveTo([tbl2.cx + tbl2.totalW / 2 - dbTag.getWidth() / 2, tbl2.topY + 0.21, 0]);
  const dbExtra = [dbBox, dbTag, chipCatalog.g, chipOrders.g];

  await until(S(16));
  await play(
    new M.Create(dbBox, { runTime: 0.8 }),
    new M.FadeIn(dbTag, { runTime: 0.6 }),
    new M.FadeIn(chipCatalog.g, { runTime: 0.7 }),
    new M.FadeIn(chipOrders.g, { runTime: 0.7 }),
    ...fbox([['DATABASE', C.violet], 'stores many tables', 'sales, catalog, ...'], C.violet),
    ...say('DATABASE = STORES MANY TABLES', C.violet)
  );

  // 17: We talk to it in a language called SQL
  await until(S(17));
  await play(
    ...fbox([['SQL', C.cyan], '"sequel" or "S-Q-L"', 'language for databases'], C.cyan),
    ...say('SQL  (“SEQUEL” OR “S-Q-L”)', C.cyan)
  );

  // 18: Most common language for asking a database questions
  await until(S(18));
  await play(
    ...dbExtra.map(m => new M.FadeOut(m, { runTime: 0.6 })),
    ...say('MOST COMMON DATABASE LANGUAGE', C.cyan)
  );

  // 19: Here is our question, written in SQL, one word at a time
  await until(S(19));
  await play(
    ...fbox([['our question in SQL:', C.muted], ['...', C.cyan]], C.cyan),
    ...say('WRITTEN IN SQL, ONE LINE AT A TIME', C.cyan)
  );

  // 20: SELECT book, copies — which columns to keep
  const sqlColBook = makeBox(tbl2.colX[3], tbl2.topY - tbl2.totalH / 2, tbl2.colW[3] + 0.06, tbl2.totalH + 0.1, C.amber, 3);
  const sqlColCopies = makeBox(tbl2.colX[4], tbl2.topY - tbl2.totalH / 2, tbl2.colW[4] + 0.06, tbl2.totalH + 0.1, C.amber, 3);
  await until(S(20));
  await play(
    new M.Create(sqlColBook, { runTime: 0.7 }),
    new M.Create(sqlColCopies, { runTime: 0.7 }),
    ...fbox([['SELECT book, copies', C.amber]], C.amber),
    ...say('SELECT = WHICH COLUMNS TO KEEP', C.amber)
  );

  // 21: FROM sales — which table to look in
  const sqlTblBox = makeBox(tbl2.cx, tbl2.topY - tbl2.totalH / 2, tbl2.totalW + 0.14, tbl2.totalH + 0.14, C.cyan, 3);
  await until(S(21));
  await play(
    new M.Create(sqlTblBox, { runTime: 0.7 }),
    new M.Indicate(tbl2.label, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan]], C.cyan),
    ...say('FROM = WHICH TABLE', C.cyan)
  );

  // 22: WHERE store = 'North' — which rows to keep; quote marks show text
  await until(S(22));
  SOUTH_IDX.forEach(r => tbl2.grid[r].forEach(c => c.r.setFill(C.card, 0.3)));
  NORTH_IDX.forEach(r => tbl2.grid[r].forEach(c => c.r.setFill(C.cyan, 0.30)));
  await play(
    new M.FadeOut(sqlTblBox, { runTime: 0.45 }),
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan], ["WHERE  store = 'North'", C.green]], C.green),
    ...say("WHERE = WHICH ROWS", C.green)
  );
  await until(S(22) + 3.4);
  await play(
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan], ["WHERE  store = 'North'", C.green], ["  'North' in quotes = text", C.violet]], C.green)
  );

  // 23: Read the whole line in everyday words
  const keptCells = NORTH_IDX.flatMap(r => [tbl2.grid[r][3].g, tbl2.grid[r][4].g]);
  await until(S(23));
  await play(
    new M.LaggedStart(keptCells.map(g => new M.Indicate(g, { color: C.amber, runTime: 0.65 })), { lagRatio: 0.14, runTime: 2.2 }),
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan], ["WHERE  store = 'North'", C.green]], C.cyan),
    ...say('SHOW BOOK & COPIES · FROM SALES · WHERE NORTH', C.cyan)
  );

  // 24: In short: SELECT picks columns, WHERE picks rows
  await until(S(24));
  await play(
    ...fbox([['SELECT → columns', C.amber], ['WHERE  → rows', C.green]], C.amber),
    ...say('SELECT = COLUMNS  ·  WHERE = ROWS', C.amber)
  );

  // 25: Cook analogy — cupboard vs recipe
  const cupItems = ['order', 'line', 'store', 'price'];
  const recItems = ['book', 'copies'];
  const cupMobs = [];
  if (P) {
    const cupBox = makeBox(0, 0.25, 6.6, 2.05, C.muted, 2, C.card, 0.9);
    const cupLbl = T('CUPBOARD (stays inside)', 16, C.muted, true, true); cupLbl.moveTo([0, 1.0, 0]);
    cupMobs.push(cupBox, cupLbl);
    cupItems.forEach((s, i) => {
      const tx = (i % 2 === 0 ? -1.45 : 1.45), ty = i < 2 ? 0.42 : -0.25;
      cupMobs.push(makeCell(s, tx, ty, 2.3, 0.52, C.muted, C.bg, 0.9, C.muted, 16).g);
    });
    const arr = new M.Arrow({ start: [0, -0.88, 0], end: [0, -1.55, 0], color: C.amber, strokeWidth: 3 });
    const recBox = makeBox(0, -2.55, 6.6, 1.75, C.amber, 2.5, C.card, 0.95);
    const recLbl = T('RECIPE (what we need)', 16, C.amber, true, true); recLbl.moveTo([0, -1.96, 0]);
    cupMobs.push(arr, recBox, recLbl);
    recItems.forEach((s, i) => {
      cupMobs.push(makeCell(s, i === 0 ? -1.45 : 1.45, -2.72, 2.3, 0.62, C.amber, C.amber, 0.22, C.ink, 18, true).g);
    });
  } else {
    const cupBox = makeBox(CX - 1.85, -0.35, 3.3, 3.1, C.muted, 2, C.card, 0.9);
    const cupLbl = T('CUPBOARD', 16, C.muted, true, true); cupLbl.moveTo([CX - 1.85, 0.92, 0]);
    cupMobs.push(cupBox, cupLbl);
    cupItems.forEach((s, i) => {
      cupMobs.push(makeCell(s, CX - 1.85, 0.38 - i * 0.62, 2.4, 0.48, C.muted, C.bg, 0.9, C.muted, 16).g);
    });
    const arr = new M.Arrow({ start: [CX - 0.05, -0.35, 0], end: [CX + 0.72, -0.35, 0], color: C.amber, strokeWidth: 3 });
    const recBox = makeBox(CX + 2.15, -0.35, 2.65, 2.3, C.amber, 2.5, C.card, 0.95);
    const recLbl = T('RECIPE', 16, C.amber, true, true); recLbl.moveTo([CX + 2.15, 0.50, 0]);
    cupMobs.push(arr, recBox, recLbl);
    recItems.forEach((s, i) => {
      cupMobs.push(makeCell(s, CX + 2.15, -0.15 - i * 0.72, 2.0, 0.54, C.amber, C.amber, 0.22, C.ink, 17, true).g);
    });
  }

  await until(S(25));
  await play(
    new M.FadeOut(sqlColBook, { runTime: 0.4 }),
    new M.FadeOut(sqlColCopies, { runTime: 0.4 }),
    ...tbl2.allMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...cupMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })),
    ...say('TAKE ONLY WHAT THE RECIPE NEEDS', C.violet)
  );

  // 26: Nothing is deleted. Full table stays safe; we only get a result.
  const tblSafe = P
    ? makeSalesTable(0, 1.40, COL_W, 0.45, 14)
    : makeSalesTable(CX, TBL_TOP, COL_W, TBL_RH, CELL_FS);
  const safeBorder = makeBox(tblSafe.cx, tblSafe.topY - tblSafe.totalH / 2, tblSafe.totalW + 0.14, tblSafe.totalH + 0.14, C.green, 2.5);
  const safeTag = T('full table stays safe (6×6)', P ? 15 : 16, C.green, true, true);
  safeTag.moveTo([tblSafe.cx, tblSafe.bottomY - (P ? 0.26 : 0.30), 0]);

  const resSafe = P
    ? makeTable({
        title: 'result (4×2)', titleColor: C.cyan, headers: ['book', 'copies'], rows: RESULT_ROWS,
        cx: 0, topY: -2.65, colW: [2.2, 2.2], rh: 0.46, fs: 15,
        rowStyle: () => ({ border: C.cyan, fill: C.cyan, fillOp: 0.18, text: C.ink })
      })
    : makeTable({
        title: 'result (4×2)', titleColor: C.cyan, headers: ['book', 'copies'], rows: RESULT_ROWS,
        cx: 4.4, topY: 1.05, colW: [1.65, 1.65], rh: 0.52, fs: 17,
        rowStyle: () => ({ border: C.cyan, fill: C.cyan, fillOp: 0.18, text: C.ink })
      });
  const copyArrow = P
    ? new M.Arrow({ start: [0, tblSafe.bottomY - 0.48, 0], end: [0, -2.28, 0], color: C.green, strokeWidth: 3 })
    : new M.Arrow({ start: [tblSafe.xLeft + tblSafe.totalW + 0.25, -0.35, 0], end: [resSafe.xLeft - 0.25, -0.35, 0], color: C.green, strokeWidth: 3 });
  const safeMobs = [...tblSafe.allMobs, safeBorder, safeTag, copyArrow, ...resSafe.allMobs];

  await until(S(26));
  await play(
    ...cupMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...(P ? fbox([['NOTHING DELETED', C.green], 'database stays 6 × 6'], C.green) : hideBox()),
    ...safeMobs.map(m => new M.FadeIn(m, { runTime: 0.85 })),
    ...say('NOTHING DELETED · ONLY A RESULT', C.green)
  );

  // 27: Why useful? Real tables have millions of rows and hundreds of columns.
  const gCols = 10, gRows = 7;
  const gCW = P ? 0.62 : 0.64, gCH = P ? 0.50 : 0.44;
  const gTopY = P ? 0.95 : 1.05;
  const gX0 = CX - (gCols * gCW) / 2;
  const bigCells = [];
  for (let r = 0; r < gRows; r++) {
    for (let c = 0; c < gCols; c++) {
      const b = new M.Rectangle({ width: gCW - 0.06, height: gCH - 0.06, color: C.line, strokeWidth: 1 });
      b.setFill(C.muted, 0.18);
      b.moveTo([gX0 + (c + 0.5) * gCW, gTopY - (r + 0.5) * gCH, 0]);
      bigCells.push({ b, r, c });
    }
  }
  const bigColLbl = T('100+ columns →', P ? 17 : 18, C.violet, true, true);
  bigColLbl.moveTo([CX, gTopY + 0.32, 0]);
  const bigRowLbl = T('1,000,000+ rows ↓', P ? 17 : 18, C.violet, true, true);
  bigRowLbl.moveTo([CX, gTopY - gRows * gCH - 0.34, 0]);
  const bigMobs = [...bigCells.map(x => x.b), bigColLbl, bigRowLbl];

  await until(S(27));
  await play(
    ...safeMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    new M.LaggedStart(bigCells.map(x => new M.FadeIn(x.b, { runTime: 0.3 })), { lagRatio: 0.015, runTime: 1.2 }),
    new M.FadeIn(bigColLbl, { runTime: 0.6 }),
    new M.FadeIn(bigRowLbl, { runTime: 0.6 }),
    ...fbox(['real tables:', ['1,000,000+ rows', C.violet], ['100+ columns', C.violet]], C.violet),
    ...say('MILLIONS OF ROWS · HUNDREDS OF COLS', C.violet)
  );

  // 28: Selecting first keeps the work small, fast, focused
  const patchCells = bigCells.filter(x => x.r >= 1 && x.r <= 3 && x.c >= 2 && x.c <= 3);
  const patchX = gX0 + 3 * gCW;
  const patchY = gTopY - 2.5 * gCH;
  const patchBox = makeBox(patchX, patchY, 2 * gCW + 0.08, 3 * gCH + 0.08, C.cyan, 3);
  await until(S(28));
  bigCells.forEach(x => x.b.setFill(C.card, 0.25));
  patchCells.forEach(x => { x.b.setFill(C.cyan, 0.72); x.b.setColor(C.cyan); });
  await play(
    new M.Create(patchBox, { runTime: 0.7 }),
    ...fbox(['select first:', ['small & fast', C.green], ['focused on question', C.cyan]], C.green),
    ...say('SMALL · FAST · FOCUSED', C.green)
  );

  // 29: Easier to read and to check
  await until(S(29));
  await play(
    new M.Indicate(patchBox, { color: C.green, runTime: 1.0 }),
    ...say('EASIER TO READ AND TO CHECK', C.green)
  );

  // 30: Common trap — write north with a small n
  const tbl3 = makeSalesTable();
  await until(S(30));
  await play(
    new M.FadeOut(patchBox, { runTime: 0.4 }),
    ...bigMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...tbl3.allMobs.map(m => new M.FadeIn(m, { runTime: 0.7 })),
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan], ["WHERE  store = 'north'", C.pink]], C.pink),
    ...say("COMMON TRAP: LOWERCASE 'north'", C.pink)
  );

  // 31: WHERE store equals north, small n
  const trapStoreBox = makeBox(tbl3.colX[2], tbl3.topY - tbl3.totalH / 2, tbl3.colW[2] + 0.08, tbl3.totalH + 0.12, C.pink, 3);
  await until(S(31));
  await play(
    new M.Create(trapStoreBox, { runTime: 0.7 }),
    new M.LaggedStart(tbl3.grid.map(row => new M.Indicate(row[2].g, { color: C.pink, runTime: 0.5 })), { lagRatio: 0.12, runTime: 1.2 }),
    ...say("WHERE store = 'north'  (SMALL n)", C.pink)
  );

  // 32: The answer: zero rows. Nothing at all.
  function makeEmptyResult(subtitle, subColor = C.muted) {
    const ew = P ? 2.5 : 2.2, eh = P ? 0.66 : 0.58, topY = P ? 0.95 : 0.85;
    const h1 = makeCell('book', CX - ew / 2, topY - eh / 2, ew, eh, C.muted, C.card, 0.95, C.ink, P ? 18 : 19, true);
    const h2 = makeCell('copies', CX + ew / 2, topY - eh / 2, ew, eh, C.muted, C.card, 0.95, C.ink, P ? 18 : 19, true);
    const emptyBox = new M.Rectangle({ width: ew * 2, height: eh * 2.1, color: C.muted, strokeWidth: 1.5 });
    emptyBox.setFill(C.card, 0.35); emptyBox.moveTo([CX, topY - eh - eh * 1.05, 0]);
    const midY = topY - eh - eh * 1.05;
    const parts = subtitle.split(' — ');
    const lines = parts.length > 1 ? [parts[0] + ' —', parts.slice(1).join(' — ')] : [subtitle];
    const lh = P ? 0.42 : 0.38;
    const txts = lines.map((s, i) => {
      const t = T(s, P ? 18 : 19, subColor, true, true);
      t.moveTo([CX, midY + ((lines.length - 1) / 2 - i) * lh, 0]);
      return t;
    });
    return [h1.g, h2.g, emptyBox, ...txts];
  }
  const empty1 = makeEmptyResult('(0 rows — nothing)', C.pink);
  await until(S(32));
  await play(
    new M.FadeOut(trapStoreBox, { runTime: 0.4 }),
    ...tbl3.allMobs.map(m => new M.FadeOut(m, { runTime: 0.55 })),
    ...empty1.map(m => new M.FadeIn(m, { runTime: 0.7 })),
    ...fbox([["WHERE store = 'north'", C.pink], ['result: 0 rows', C.pink]], C.pink),
    ...say('ANSWER: ZERO ROWS', C.pink)
  );

  // 33: 'North' with capital N and 'north' with small n are different words
  const cmpW = P ? 2.5 : 2.3, cmpH = P ? 0.85 : 0.78, cmpDX = P ? 1.85 : 1.75;
  const r1Y = P ? 0.35 : 0.45;
  const cardCap = makeCell("'North'", CX - cmpDX, r1Y, cmpW, cmpH, C.cyan, C.cyan, 0.18, C.cyan, P ? 24 : 25, true);
  const neq1 = T('≠', P ? 34 : 36, C.pink, true, true); neq1.moveTo([CX, r1Y, 0]);
  const cardLow = makeCell("'north'", CX + cmpDX, r1Y, cmpW, cmpH, C.pink, C.pink, 0.18, C.pink, P ? 24 : 25, true);
  const subCap = T('capital N (in data)', P ? 14 : 15, C.cyan); subCap.moveTo([CX - cmpDX, r1Y - cmpH / 2 - 0.28, 0]);
  const subLow = T('small n (in query)', P ? 14 : 15, C.pink); subLow.moveTo([CX + cmpDX, r1Y - cmpH / 2 - 0.28, 0]);
  const cmp1 = [cardCap.g, neq1, cardLow.g, subCap, subLow];

  await until(S(33));
  await play(
    ...empty1.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...cmp1.map(m => new M.FadeIn(m, { runTime: 0.75 })),
    ...fbox(["in data:  'North'", ["in query: 'north'", C.pink], ['different words!', C.pink]], C.pink),
    ...say("'North'  ≠  'north'", C.pink)
  );

  // 34: A hidden space after North would break it too
  const r2Y = P ? -1.35 : -1.15;
  const cardClean = makeCell("'North'", CX - cmpDX, r2Y, cmpW, cmpH, C.cyan, C.cyan, 0.18, C.cyan, P ? 24 : 25, true);
  const neq2 = T('≠', P ? 34 : 36, C.pink, true, true); neq2.moveTo([CX, r2Y, 0]);
  const cardSpace = makeCell("'North␣'", CX + cmpDX, r2Y, cmpW, cmpH, C.pink, C.pink, 0.18, C.pink, P ? 24 : 25, true);
  const subSpace = T('hidden space at end', P ? 14 : 15, C.pink); subSpace.moveTo([CX + cmpDX, r2Y - cmpH / 2 - 0.28, 0]);
  const cmp2 = [cardClean.g, neq2, cardSpace.g, subSpace];

  await until(S(34));
  await play(
    ...cmp2.map(m => new M.FadeIn(m, { runTime: 0.7 })),
    ...fbox(["in data:    'North'", ["with space: 'North␣'", C.pink], ['also 0 rows!', C.pink]], C.pink),
    ...say('A HIDDEN SPACE BREAKS IT TOO', C.pink)
  );

  // 35: No error appears. Empty table looks like "no sales".
  const empty2 = makeEmptyResult('(empty — looks like “no sales”)', C.muted);
  const warnPill = pill('NO ERROR APPEARS', C.pink, P ? 16 : 17);
  warnPill.moveTo([CX, P ? -1.85 : -1.65, 0]);
  const empty2All = [...empty2, warnPill];

  await until(S(35));
  await play(
    ...[...cmp1, ...cmp2].map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...empty2All.map(m => new M.FadeIn(m, { runTime: 0.75 })),
    ...fbox(['no error message!', ['empty table ≠ no sales', C.pink]], C.pink),
    ...say('NO ERROR · JUST AN EMPTY TABLE', C.pink)
  );

  // 36: Check the exact spelling in the data -> 4 rows return!
  const fixedTbl = makeTable({
    title: "store = 'North'  ✓", titleColor: C.green,
    headers: ['book', 'copies'], rows: RESULT_ROWS,
    cx: CX, topY: P ? 1.20 : 1.10,
    colW: P ? [2.4, 2.4] : [2.1, 2.1], rh: P ? 0.68 : 0.58, fs: P ? 19 : 20,
    rowStyle: () => ({ border: C.green, fill: C.green, fillOp: 0.16, text: C.ink })
  });
  await until(S(36));
  await play(
    ...empty2All.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...fixedTbl.allMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })),
    ...fbox([["WHERE store = 'North'", C.green], ['exact match → 4 rows ✓', C.green]], C.green),
    ...say('CHECK THE EXACT SPELLING IN DATA', C.green)
  );

  // 37: Next, bring in a second table: book catalog, and combine with sales
  const prevSales = P
    ? makeTable({
        title: 'sales (North)', titleColor: C.cyan, headers: ['book', 'copies'], rows: RESULT_ROWS,
        cx: 0, topY: 1.30, colW: [1.9, 1.9], rh: 0.45, fs: 15,
        rowStyle: () => ({ border: C.cyan, fill: C.cyan, fillOp: 0.15, text: C.ink })
      })
    : makeTable({
        title: 'sales', titleColor: C.cyan, headers: ['book', 'copies'], rows: RESULT_ROWS,
        cx: -4.25, topY: 1.05, colW: [1.25, 1.35], rh: 0.54, fs: 16,
        rowStyle: () => ({ border: C.cyan, fill: C.cyan, fillOp: 0.15, text: C.ink })
      });
  const plusSign = T('+', P ? 32 : 36, C.amber, true, true);
  plusSign.moveTo(P ? [0, -1.32, 0] : [-2.35, -0.25, 0]);
  const prevCatalog = P
    ? makeTable({
        title: 'catalog', titleColor: C.amber, headers: ['book', 'title'], rows: CATALOG_ROWS,
        cx: 0, topY: -1.80, colW: [1.5, 4.1], rh: 0.50, fs: 15,
        rowStyle: () => ({ border: C.amber, fill: C.amber, fillOp: 0.15, text: C.ink })
      })
    : makeTable({
        title: 'catalog', titleColor: C.amber, headers: ['book', 'title'], rows: CATALOG_ROWS,
        cx: -0.10, topY: 1.05, colW: [1.05, 2.40], rh: 0.54, fs: 16,
        rowStyle: () => ({ border: C.amber, fill: C.amber, fillOp: 0.15, text: C.ink })
      });
  const prevMobs = [...prevSales.allMobs, plusSign, ...prevCatalog.allMobs];

  await until(S(37));
  await play(
    ...fixedTbl.allMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    ...prevMobs.map(m => new M.FadeIn(m, { runTime: 0.85 })),
    ...fbox(['next lesson:', ['sales + catalog', C.amber], ['combine on book', C.cyan]], C.amber),
    ...say('NEXT: COMBINE WITH BOOK CATALOG', C.amber)
  );

  // 38: One-sentence recap
  const recapSpec = [
    { key: 'SELECT', desc: 'keeps the columns you need', color: C.amber },
    { key: 'WHERE', desc: 'keeps the rows you need', color: C.green },
    { key: "'North'", desc: 'text must match exactly', color: C.pink },
  ];
  const cardW = P ? 6.8 : 6.7, cardH = P ? 1.0 : 0.82, gapY = P ? 1.28 : 1.04;
  const startY = P ? 0.65 : 0.78;
  const recapCards = recapSpec.map((item, i) => {
    const y = startY - i * gapY;
    const r = makeBox(CX, y, cardW, cardH, item.color, 2.5, C.card, 0.95);
    const k = T(item.key, P ? 21 : 22, item.color, true, true);
    k.moveTo([CX - cardW / 2 + 1.05, y, 0]);
    const d = fitText(item.desc, P ? 19 : 20, C.ink, cardW - 2.35, false, false);
    d.moveTo([CX - cardW / 2 + 2.05 + d.getWidth() / 2, y, 0]);
    return new M.VGroup(r, k, d);
  });

  await until(S(38));
  await play(
    ...prevMobs.map(m => new M.FadeOut(m, { runTime: 0.45 })),
    new M.LaggedStart(recapCards.map(c => new M.FadeIn(c, { runTime: 0.7 })), { lagRatio: 0.35, runTime: 2.1 }),
    ...fbox([['SELECT book, copies', C.amber], ['FROM   sales', C.cyan], ["WHERE  store = 'North'", C.green]], C.cyan),
    ...say('SELECT · WHERE · EXACT TEXT', C.cyan)
  );
}
