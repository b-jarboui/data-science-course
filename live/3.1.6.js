// 3.1.6 Joins: sales rows pick up title and kind from the catalog through the book code (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  // shared data (chapters/3.1.md)
  const SALES = [[101, 'B1', 20], [101, 'B2', 20], [102, 'B3', 15], [103, 'B2', 20], [103, 'B3', 30], [104, 'B4', 25]];
  const CAT = [['B1', 'Garden Guide', 'gardening'], ['B2', 'Star Atlas', 'science'], ['B3', 'Easy Soups', 'cooking']];
  const catRow = code => CAT.findIndex(c => c[0] === code);

  // layout: laptop = sales left, catalog right; phone = catalog on top, its title/kind columns above the sales ones
  const RH = P ? 0.62 : 0.42, SZ = P ? 18 : 17, HS = P ? 16 : 15;
  const SW = P ? [0.95, 0.85, 1.1, 2.55, 1.95] : [0.85, 0.75, 0.95, 2.0, 1.5];   // order, book, amount, title, kind
  const SX0 = P ? -3.45 : -6.0, STOP = P ? -1.75 : 1.25;
  const CW = [SW[1], SW[3], SW[4]];                                          // book, title, kind
  const CX0 = P ? SX0 + SW[0] + SW[1] + SW[2] - SW[1] : 1.0, CTOP = P ? 1.45 : 1.25;
  const edge = (x0, ws, i) => x0 + ws.slice(0, i).reduce((a, b) => a + b, 0);
  const sx = i => edge(SX0, SW, i) + SW[i] / 2, cx = j => edge(CX0, CW, j) + CW[j] / 2;
  const sy = r => STOP - RH / 2 - r * RH, cy = r => CTOP - RH / 2 - r * RH;   // r = 0 is the header
  const PILL = P ? [0, 2.15, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.4, 0] : [3.15, -1.75, 0];
  const GLUE = P ? [0, -0.8, 0] : [-0.8, 0, 0];                              // glued cells arrive from the catalog side
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // one table cell: kind 'h' header, 'm' mono value, 't' words
  function cell(x, y, w, s, color, kind = 'm') {
    const head = kind === 'h';
    const r = new M.Rectangle({ width: w, height: RH, color, strokeWidth: 1.5 });
    r.setFill(color, head ? 0.22 : 0.08); r.moveTo([x, y, 0]);
    const parts = [r];
    if (s !== '') {
      const t = T(String(s), head ? HS : SZ, color, kind === 'm', head);
      const mw = w - 0.16; if (t.getWidth() > mw) t.scale(mw / t.getWidth());
      t.moveTo([x, y, 0]); parts.push(t);
    }
    return new M.VGroup(...parts);
  }
  const salesRow = r => SALES[r].map((v, i) => cell(sx(i), sy(r + 1), SW[i], i === 2 ? '$' + v : v, C.cyan, 'm'));
  const glued = r => { const k = catRow(SALES[r][1]); return [cell(sx(3), sy(r + 1), SW[3], CAT[k][1], C.amber, 't'), cell(sx(4), sy(r + 1), SW[4], CAT[k][2], C.amber, 't')]; };
  const emptyRow = () => [3, 4].map(i => cell(sx(i), sy(6), SW[i], '', C.muted));
  const nullRow = () => [3, 4].map(i => { const t = T('NULL', SZ, C.muted, true); t.moveTo([sx(i), sy(6), 0]); return t; });
  const lab = (s, color, x0, y) => { const t = T(s, P ? 16 : 17, color, false, true); t.moveTo([x0 + t.getWidth() / 2, y, 0]); return t; };
  const outline = (x0, x1, y, color) => { const r = new M.Rectangle({ width: x1 - x0 + 0.1, height: RH + 0.08, color, strokeWidth: 3.5 }); r.moveTo([(x0 + x1) / 2, y, 0]); return r; };
  const colBox = (x, w, top, rows) => { const r = new M.Rectangle({ width: w + 0.1, height: rows * RH + 0.1, color: C.violet, strokeWidth: 3 }); r.moveTo([x, top - rows * RH / 2, 0]); return r; };
  const cursorAt = r => outline(SX0, edge(SX0, SW, 3), sy(r + 1), C.ink);
  const catAt = j => outline(CX0, edge(CX0, CW, 3), cy(j + 1), C.green);
  const mark = (r, s, color) => { const t = T(s, 20, color, false, true); t.moveTo([SX0 - 0.3, sy(r + 1), 0]); return t; };
  const CNT = [(SX0 + edge(SX0, SW, 3)) / 2, sy(6) - RH / 2 - 0.4, 0];
  const counter = (s, color) => { const t = T(s, P ? 20 : 18, color, true, true); t.moveTo(CNT); return t; };

  // 0 the owner's question
  const BY = P ? -1.6 : -0.3, BK = P ? 2.0 : 1;
  const books = [-1, 0, 1].map(k => {
    const r = new M.Rectangle({ width: P ? 1.5 : 0.6, height: P ? 2.3 : 0.85, color: C.amber, strokeWidth: 2 }); r.setFill(C.amber, 0.15); r.moveTo([k * BK, BY, 0]);
    const q = T('?', P ? 48 : 26, C.amber, false, true); q.moveTo([k * BK, BY, 0]);
    return new M.VGroup(r, q);
  });
  await until(S(0)); await play(new M.LaggedStart(books.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.2 }), ...say('WHICH KINDS OF BOOKS SELL BEST?', C.amber));

  // 1 the sales table: codes only
  const sLabel = lab('sales', C.cyan, SX0, STOP + 0.24);
  const sHead = ['order', 'book', 'amount'].map((s, i) => cell(sx(i), sy(0), SW[i], s, C.cyan, 'h'));
  const sCells = SALES.map((_, r) => salesRow(r));
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...books)), new M.FadeIn(sLabel),
    new M.LaggedStart([...sHead, ...sCells.flat()].map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.6 }), ...say('THE SALES TABLE'));
  await until(S(1) + 2.0); await play(new M.LaggedStart([sCells[0][1], sCells[1][1]].map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.4, runTime: 1.2 }), ...say('BOOK CODES: B1, B2, …'));
  await until(S(1) + 4.0); await play(...say('NO TITLES · NO KINDS', C.muted));

  // 2-3 the catalog
  const cLabel = lab('catalog', C.amber, CX0, CTOP + 0.24);
  const cHead = ['book', 'title', 'kind'].map((s, j) => cell(cx(j), cy(0), CW[j], s, C.amber, 'h'));
  await until(S(2)); await play(new M.FadeIn(cLabel), new M.LaggedStart(cHead.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.0 }), ...say('A SECOND TABLE: THE CATALOG', C.amber));
  await until(S(3)); await play(new M.LaggedStart(cHead.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.2, runTime: 1.0 }), ...say('ONE ROW = ONE BOOK', C.amber));

  // 4-6 one catalog row per sentence
  const cRows = CAT.map((row, j) => row.map((v, i) => cell(cx(i), cy(j + 1), CW[i], v, C.amber, i ? 't' : 'm')));
  for (let j = 0; j < 3; j++) {
    await until(S(4 + j));
    await play(new M.LaggedStart(cRows[j].map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.0 }), new M.Flash(cRows[j][0], { color: C.amber, flashRadius: 0.45 }),
      ...say(`${CAT[j][0]}: ${CAT[j][1].toUpperCase()} · ${CAT[j][2].toUpperCase()}`, C.amber));
  }

  // 7 no B4 in the catalog
  const ghost = T('no B4 row', SZ, C.muted); ghost.moveTo([cx(1), cy(4), 0]);
  await until(S(7)); await play(new M.FadeIn(ghost), new M.Indicate(sCells[5][1], { color: C.pink }), ...say('B4: NEW BOOK, NOT IN THE CATALOG', C.muted));

  // 8 the shared column
  let keys = [colBox(sx(1), SW[1], STOP, 7), colBox(cx(0), CW[0], CTOP, 4)];
  await until(S(8)); await play(new M.FadeOut(ghost), ...keys.map(k => new M.Create(k)), ...say('SHARED COLUMN: BOOK', C.violet));

  // 9-11 first row: look up, found, glue
  const cursor = cursorAt(0);
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(...keys)), new M.Create(cursor), ...say('SALES ROW 1: B1'));
  const catOut = catAt(0);
  await until(S(10)); await play(new M.Indicate(cHead[0], { color: C.green }), ...say('LOOK FOR B1 IN THE CATALOG', C.green));
  await until(S(10) + 1.9); await play(new M.Create(catOut), new M.Flash(cRows[0][0], { color: C.green, flashRadius: 0.45 }), ...say('FOUND: GARDEN GUIDE · GARDENING', C.green));
  const gHead = ['title', 'kind'].map((s, i) => cell(sx(3 + i), sy(0), SW[3 + i], s, C.amber, 'h'));
  const glue = [glued(0)];
  await until(S(11)); await play(...gHead.map(c => new M.FadeIn(c)), ...glue[0].map(c => new M.FadeIn(c, { shift: GLUE })), ...say('GLUE TITLE + KIND TO THE ROW', C.green));

  // 12-15 the next four rows
  for (const [b, r] of [[12, 1], [13, 2], [14, 3], [15, 4]]) {
    const k = catRow(SALES[r][1]);
    glue.push(glued(r));
    await until(S(b));
    if (b === 12) {
      await play(new M.Transform(cursor, cursorAt(r)), ...say(`SALES ROW ${r + 1}: ${SALES[r][1]}`));
      await until(S(b) + 1.3); await play(new M.Transform(catOut, catAt(k)), new M.Flash(cRows[k][0], { color: C.green, flashRadius: 0.45 }), ...say('FOUND: STAR ATLAS · SCIENCE', C.green));
      await until(S(b) + 3.2);
    } else {
      await play(new M.Transform(cursor, cursorAt(r)), new M.Transform(catOut, catAt(k)), ...say(`ROW ${r + 1}: ${SALES[r][1]} → ${CAT[k][1].toUpperCase()}`, C.green));
      await until(S(b) + 1.1);
    }
    await play(...glue[r].map(c => new M.FadeIn(c, { shift: GLUE, runTime: 0.8 })));
  }

  // 16 a catalog row is used more than once
  const tags = CAT.map((c, j) => {
    const n = SALES.filter(s => s[1] === c[0]).length;
    const t = T(`used ${n}×`, P ? 17 : 16, C.amber, true);
    if (P) t.moveTo([CX0 - 0.2 - t.getWidth() / 2, cy(j + 1), 0]);
    else t.moveTo([edge(CX0, CW, 3) + 0.15 + t.getWidth() / 2, cy(j + 1), 0]);
    return t;
  });
  await until(S(16)); await play(new M.FadeOut(catOut), new M.LaggedStart(tags.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say('ONE CATALOG ROW, MANY SALES', C.amber));
  await until(S(16) + 2.0); await play(new M.LaggedStart([1, 3, 2, 4].map(r => new M.Indicate(glue[r][0], { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }), ...say('EACH SALE LOOKS IT UP', C.amber));

  // 17-19 the last row: no match
  await until(S(17)); await play(new M.Transform(cursor, cursorAt(5)), ...say('LAST SALES ROW: B4'));
  await until(S(18)); await play(new M.LaggedStart(cRows.map(r => new M.Indicate(r[0], { color: C.pink })), { lagRatio: 0.3, runTime: 1.4 }), ...say('NO B4 IN THE CATALOG', C.muted));
  const q = T('?', 26, C.pink, false, true); q.moveTo([(sx(3) + sx(4)) / 2, sy(6), 0]);
  await until(S(19)); await play(new M.FadeIn(q), ...say('WHAT HAPPENS TO THIS SALE?', C.pink));

  // 20-22 the names
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(...tags, q, cursor)), ...say('MATCH ON A SHARED COLUMN = JOIN', C.green));
  keys = [colBox(sx(1), SW[1], STOP, 7), colBox(cx(0), CW[0], CTOP, 4)];
  await until(S(21)); await play(...keys.map(k => new M.Create(k)), ...say('JOIN KEY = THE BOOK CODE', C.violet));
  await until(S(22)); await play(new M.LaggedStart([...sCells.map(r => r[1]), ...cRows.map(r => r[0])].map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.12, runTime: 1.8 }),
    ...say('NAME TAG → GUEST LIST', C.muted));

  // 23-25 choice one: inner join
  await until(S(23)); await play(new M.FadeOut(new M.VGroup(...keys)), new M.LaggedStart(sCells[5].map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('MATCH MISSING: TWO CHOICES', C.amber));
  const marks = [0, 1, 2, 3, 4].map(r => mark(r, '✓', C.green)), xMark = mark(5, '✗', C.pink);
  await until(S(24)); await play(new M.LaggedStart([...marks, xMark].map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime: 1.2 }), ...say('INNER JOIN: ONLY MATCHED ROWS', C.pink));
  let count = counter('rows: 5', C.pink);
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(...sCells[5], xMark), { shift: [0, -0.2, 0] }), new M.FadeIn(count), ...say('B4 SALE GONE → 5 ROWS', C.pink));

  // 26-29 choice two: left join
  const leftTag = T('= left table', P ? 15 : 16, C.cyan); leftTag.moveTo([SX0 + sLabel.getWidth() + 0.1 + leftTag.getWidth() / 2, STOP + 0.24, 0]);
  await until(S(26)); await play(new M.FadeIn(leftTag), new M.Indicate(sLabel, { color: C.cyan }), ...say('NAMED FIRST = LEFT TABLE'));
  sCells[5] = salesRow(5);
  const m6 = mark(5, '✓', C.green); marks.push(m6);
  let next = counter('rows: 6', C.green);
  await until(S(27)); await play(new M.LaggedStart(sCells[5].map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.0 }), new M.FadeIn(m6), new M.FadeOut(count), new M.FadeIn(next),
    ...say('LEFT JOIN: EVERY LEFT ROW STAYS', C.green));
  count = next;
  let eCells = emptyRow();
  await until(S(28)); await play(...eCells.map(c => new M.FadeIn(c)), ...say('NO MATCH → EMPTY TITLE + KIND', C.muted));
  let nulls = nullRow();
  await until(S(29)); await play(...say('EMPTY CELL = MISSING VALUE', C.muted));
  await until(S(29) + 2.8); await play(...nulls.map(t => new M.FadeIn(t)), new M.Flash(eCells[0], { color: C.muted, flashRadius: 0.5 }), ...say('IN SQL: NULL = NO VALUE', C.muted));

  // 30-32 predict the row count
  await until(S(30)); await play(new M.FadeOut(new M.VGroup(...marks)), new M.LaggedStart(cRows.map(r => new M.Indicate(r[0], { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('PREDICT: EACH BOOK ONCE IN THE CATALOG', C.amber));
  await until(S(31)); await play(new M.FadeOut(count), ...fbox(['rows in  = 6', ['rows out = 6', C.green]], C.green), ...say('6 ROWS IN → 6 ROWS OUT', C.green));
  await until(S(32)); await play(...fbox(['rows out = 6', ['  5 with a title', C.amber], ['  1 empty title', C.muted]], C.green),
    new M.LaggedStart([...glue.map(g => new M.Indicate(g[0], { color: C.amber })), new M.Indicate(eCells[0], { color: C.muted })], { lagRatio: 0.2, runTime: 1.8 }));

  // 33-36 the money
  await until(S(33)); await play(...fbox(['sales total', '20+20+15+20+30+25', ['= $130', C.amber]], C.amber),
    new M.LaggedStart(sCells.map(r => new M.Indicate(r[2], { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('NOW THE MONEY', C.amber));
  await until(S(34)); await play(...fbox(['left join: 6 rows', ['total = $130', C.green]], C.green), new M.Indicate(sCells[5][2], { color: C.green }), ...say('LEFT JOIN KEEPS $130', C.green));
  await until(S(35)); await play(...fbox(['inner join: 5 rows', ['loses B4: $25', C.pink]], C.pink), new M.Indicate(sCells[5][2], { color: C.pink }),
    new M.Flash(sCells[5][2], { color: C.pink, flashRadius: 0.5 }), ...say('INNER JOIN LOSES THE $25 SALE', C.pink));
  await until(S(36)); await play(...fbox(['inner join total', '130 − 25', ['= $105', C.pink]], C.pink), ...say('$130 − $25 = $105', C.pink));

  // 37 every sale has its kind
  await until(S(37)); await play(...boxOff(), new M.LaggedStart(glue.map(g => new M.Indicate(g[1], { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('EVERY SALE NOW HAS ITS KIND', C.green));
  await until(S(37) + 3.6); await play(...say('TOTALS PER KIND: A LATER LESSON', C.muted));

  // 38-39 SQL and everyday words
  await until(S(38)); await play(...fbox(['FROM sales', 'LEFT JOIN catalog', ['ON sales.book = catalog.book', C.violet]], C.cyan),
    new M.LaggedStart([sLabel, cLabel].map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.5, runTime: 1.2 }), ...say('IN SQL'));
  await until(S(39)); await play(new M.LaggedStart(glue.flat().map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.08, runTime: 2.0 }),
    ...say('KEEP EVERY SALE + ADD DETAILS WHERE CODES MATCH', C.green));

  // 40-41 what it is for
  const tw = SW.reduce((a, b) => a + b, 0);
  const joinBox = new M.Rectangle({ width: tw + 0.16, height: 7 * RH + 0.16, color: C.cyan, strokeWidth: 3 });
  joinBox.moveTo([SX0 + tw / 2, STOP - 7 * RH / 2, 0]);
  await until(S(40)); await play(...boxOff(), new M.Create(joinBox), ...say('TWO SOURCES → ONE TABLE'));
  await until(S(41)); await play(new M.FadeOut(joinBox), new M.LaggedStart([...sCells[5], ...eCells].map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('EVERY MAIN ROW MUST STAY → LEFT JOIN', C.green));

  // 42-44 the trap
  count = counter('rows: 6 → 5', C.pink);
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(...sCells[5], ...eCells, ...nulls), { shift: [0, -0.2, 0] }), new M.FadeIn(count),
    ...say('TRAP: INNER JOIN DROPS ROWS QUIETLY', C.pink));
  await until(S(43)); await play(...fbox(['sales total', '$130 → $105', ['$25 gone, no warning', C.pink]], C.pink), ...say('THE TOTAL SHRINKS · NOBODY NOTICES', C.pink));
  sCells[5] = salesRow(5); eCells = emptyRow(); nulls = nullRow();
  await until(S(44)); await play(new M.FadeOut(count), new M.LaggedStart([...sCells[5], ...eCells, ...nulls].map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox(['rows before = 6', 'rows after  = 6', ['empty cells = 2', C.muted]], C.amber), ...say('COUNT ROWS BEFORE + AFTER · CHECK EMPTY CELLS', C.amber));
  await until(S(44) + 3.2); await play(new M.LaggedStart(eCells.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.3, runTime: 1.0 }));

  // 45 next lesson
  await until(S(45)); await play(...boxOff(), new M.LaggedStart(cRows[1].map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('NEXT: THE SAME KEY TWICE IN THE CATALOG', C.violet));

  // 46 recap
  await until(S(46)); await play(new M.LaggedStart(glue.map(g => new M.Indicate(g[0], { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }), ...say('A JOIN ADDS DETAILS BY MATCHING A KEY', C.green));
  await until(S(46) + 3.4); await play(new M.LaggedStart([...sCells[5], ...eCells].map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('A LEFT JOIN KEEPS EVERY MAIN ROW', C.green));
}
