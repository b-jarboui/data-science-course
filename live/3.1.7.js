// 3.1.7 Join multiplication: when a join makes extra rows.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared data (chapters/3.1.md). The catalog lists B2 twice by mistake.
  const SALES = [
    ['101', 'B1', '2', '20', 'North'],
    ['101', 'B2', '1', '20', 'North'],
    ['102', 'B3', '1', '15', 'South'],
    ['103', 'B2', '1', '20', 'North'],
    ['103', 'B3', '2', '30', 'North'],
    ['104', 'B4', '1', '25', 'South'],
  ];
  const CAT = [['B1', 'Garden Guide'], ['B2', 'Star Atlas (paper)'], ['B3', 'Easy Soups'], ['B2', 'Star Atlas (hard)']];
  const MATCH = [[0], [1, 3], [2], [1, 3], [2], []];
  const JOIN = [], JFROM = [];
  SALES.forEach((s, i) => {
    if (!MATCH[i].length) { JOIN.push([s[0], s[1], s[2], s[3], null]); JFROM.push(i); }
    MATCH[i].forEach(c => { JOIN.push([s[0], s[1], s[2], s[3], CAT[c][1]]); JFROM.push(i); });
  });
  const OUT_OF = [[0], [1, 2], [3], [4, 5], [6], [7]];   // joined rows made by each sales row
  const EXTRA = [2, 5];                                   // the extra (hardcover) copies
  const SALES_H = ['order', 'book', 'copies', 'amount'];
  const OUT_H = [...SALES_H, 'title'];
  const CAT_H = ['book', 'title'];

  // Layout: phone (8 x 14.22, y in [-5.5, 4.3]) & laptop (14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.6;
  const PILL1 = P ? [0, 2.05, 0] : [0, 2.0, 0];
  const PILL2 = P ? [0, 2.05, 0] : [CX, 2.0, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.3, -0.3, 0];
  let pillAt = PILL1;
  const say = (s, c = C.cyan) => showA(s, c, pillAt);

  // stage 1: sales | catalog | joined, all visible together
  const L1 = P
    ? { top: 1.5, rh: 0.4, fs: 14, sal: { cx: -1.9, w: [0.9, 0.75, 1.0, 1.05] }, cat: { cx: 1.925, w: [0.7, 2.95] },
        out: { cx: 0, top: -1.75, w: [0.95, 0.8, 1.05, 1.05, 3.05] } }
    : { top: 1.35, rh: 0.46, fs: 15, sal: { cx: -4.51, w: [0.8, 0.66, 0.9, 0.9] }, cat: { cx: -1.10, w: [0.66, 2.2] },
        out: { cx: 3.41, top: 1.35, w: [0.8, 0.66, 0.9, 0.9, 2.2] } };
  // joined table alone (money, trap)
  const LJ = P ? { cx: 0, top: 1.45, rh: 0.5, fs: 15, w: [1.0, 0.8, 1.05, 1.05, 2.9] }
               : { cx: -3.0, top: 1.35, rh: 0.46, fs: 16, w: [0.95, 0.8, 1.05, 1.05, 2.4] };
  // sales with a matches column (the rule)
  const L4 = P ? { cx: -0.55, top: 1.4, rh: 0.6, fs: 16, w: [1.05, 0.9, 1.15, 1.15, 1.25] }
               : { cx: -2.6, top: 1.3, rh: 0.54, fs: 17, w: [0.95, 0.8, 1.05, 1.05, 1.2] };

  // formula box (one at a time)
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
    const maxw = P ? FW - 0.8 : 4.0;
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

  // table builders (each cell placed with moveTo before it is grouped)
  function fitText(text, size, color, maxW, mono = true, bold = false) {
    const t = T(text, size, color, mono, bold);
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    return t;
  }
  function makeCell(text, x, y, w, h, border, fill, fillOp, color, fs, bold = false) {
    const r = new M.Rectangle({ width: w, height: h, color: border, strokeWidth: 1.5 });
    r.setFill(fill, fillOp); r.moveTo([x, y, 0]);
    const t = text ? fitText(text, fs, color, w - 0.14, true, bold) : null;
    if (t) t.moveTo([x, y, 0]);
    return { r, t, g: t ? new M.VGroup(r, t) : new M.VGroup(r), x, y, w, h };
  }
  function makeTable({ title, titleColor, headers, rows, cx, topY, colW, rh, fs, style }) {
    const totalW = colW.reduce((a, b) => a + b, 0), xLeft = cx - totalW / 2;
    const colX = []; let cur = xLeft;
    for (const w of colW) { colX.push(cur + w / 2); cur += w; }
    const hdrs = headers.map((hd, c) => makeCell(hd, colX[c], topY - rh / 2, colW[c], rh, C.muted, C.card, 0.96, C.ink, fs, true));
    const styles = rows.map((row, r) => row.map((_, c) => style(r, c)));
    const grid = rows.map((row, r) => {
      const y = topY - (r + 1.5) * rh;
      return row.map((v, c) => {
        const st = styles[r][c];
        return v === null
          ? makeCell(null, colX[c], y, colW[c], rh, C.muted, C.muted, 0.1, C.muted, fs)
          : makeCell(v, colX[c], y, colW[c], rh, st.border, st.fill, st.fillOp, st.text, fs);
      });
    });
    const label = T(title, P ? 15 : 16, titleColor, true, true);
    label.moveTo([xLeft + label.getWidth() / 2 + 0.04, topY + 0.21, 0]);
    const totalH = (rows.length + 1) * rh;
    const allMobs = [label, ...hdrs.map(c => c.g), ...grid.flat().map(c => c.g)];
    return { label, hdrs, grid, styles, colX, colW, xLeft, totalW, topY, totalH, rh, cx, allMobs };
  }
  function makeBox(x, y, w, h, color, strokeWidth = 3, fill = C.bg, fillOp = 0) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.12, Math.min(w, h) / 3), color, strokeWidth });
    r.setFill(fill, fillOp); r.moveTo([x, y, 0]);
    return r;
  }
  const rowBox = (tbl, r, color) => makeBox(tbl.cx, tbl.grid[r][0].y, tbl.totalW + 0.1, tbl.rh + 0.06, color, 3);
  const colBoxOf = (tbl, c, color) => makeBox(tbl.colX[c], tbl.topY - tbl.totalH / 2, tbl.colW[c] + 0.08, tbl.totalH + 0.12, color, 3);
  function counter(tbl, n, color = C.ink) {
    const t = T(`rows: ${n}`, P ? 15 : 16, color, true, true);
    // phone: the stage-1 sales table sits right next to the catalog, so its counter goes right after its own title
    const near = P && tbl === sal;
    t.moveTo([near ? tbl.xLeft + tbl.label.getWidth() + 0.4 + t.getWidth() / 2 : tbl.xLeft + tbl.totalW - t.getWidth() / 2 - 0.04, tbl.topY + 0.21, 0]);
    return t;
  }
  const storeStyle = st => st === 'North'
    ? { border: C.cyan, fill: C.cyan, fillOp: 0.13, text: C.ink }
    : { border: C.pink, fill: C.pink, fillOp: 0.12, text: C.pink };
  const salStyle = r => storeStyle(SALES[r][4]);
  const outStyle = r => storeStyle(SALES[JFROM[r]][4]);
  const catStyle = () => ({ border: C.amber, fill: C.amber, fillOp: 0.13, text: C.ink });
  const resetCell = (tbl, r, c) => { const st = tbl.styles[r][c]; tbl.grid[r][c].r.setFill(st.fill, st.fillOp); };
  const makeJoined = () => makeTable({ title: 'joined', titleColor: C.green, headers: OUT_H, rows: JOIN,
    cx: LJ.cx, topY: LJ.top, colW: LJ.w, rh: LJ.rh, fs: LJ.fs, style: outStyle });

  // 0: last time: left join kept six rows, total 130
  const sal = makeTable({ title: 'sales', titleColor: C.cyan, headers: SALES_H, rows: SALES.map(s => s.slice(0, 4)),
    cx: L1.sal.cx, topY: L1.top, colW: L1.sal.w, rh: L1.rh, fs: L1.fs, style: salStyle });
  const cat = makeTable({ title: 'catalog', titleColor: C.amber, headers: CAT_H, rows: CAT,
    cx: L1.cat.cx, topY: L1.top, colW: L1.cat.w, rh: L1.rh, fs: L1.fs, style: catStyle });
  const jt = makeTable({ title: 'joined', titleColor: C.green, headers: OUT_H, rows: JOIN,
    cx: L1.out.cx, topY: L1.out.top, colW: L1.out.w, rh: L1.rh, fs: L1.fs, style: outStyle });
  const salCount = counter(sal, 6);
  const catFirst = [cat.label, ...cat.hdrs.map(c => c.g), ...cat.grid.slice(0, 3).flat().map(c => c.g)];
  await until(S(0));
  await play(
    new M.FadeIn(sal.label), new M.FadeIn(salCount), ...sal.hdrs.map(c => new M.FadeIn(c.g, { runTime: 0.6 })),
    new M.LaggedStart(sal.grid.map(row => new M.LaggedStart(row.map(c => new M.FadeIn(c.g, { runTime: 0.3 })), { lagRatio: 0.05 })), { lagRatio: 0.15, runTime: 1.6 }),
    ...catFirst.map(m => new M.FadeIn(m, { runTime: 0.9 })),
    ...say('LAST TIME: LEFT JOIN KEPT ALL 6 ROWS', C.green));
  await until(S(0) + 3.7);
  await play(new M.LaggedStart(sal.grid.map(row => new M.Indicate(row[3].g, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('TOTAL STAYED $130', C.green));

  // 1: someone updates the catalog
  const catFrame = makeBox(cat.cx, cat.topY - 2 * cat.rh, cat.totalW + 0.16, 4 * cat.rh + 0.16, C.amber, 3);
  await until(S(1));
  await play(new M.Create(catFrame, { runTime: 0.8 }), ...say('SOMEONE UPDATES THE CATALOG', C.amber));

  // 2: a hardcover row is added, with the same code B2
  await until(S(2));
  await play(new M.FadeOut(catFrame, { runTime: 0.4 }),
    ...cat.grid[3].map(c => new M.FadeIn(c.g, { shift: [0, 0.12, 0], runTime: 0.8 })),
    ...say('NEW ROW: STAR ATLAS, HARDCOVER', C.amber));
  await until(S(2) + 2.9);
  cat.grid[3][0].r.setFill(C.violet, 0.45);
  await play(new M.Flash(cat.grid[3][0].r, { color: C.violet }), new M.Indicate(cat.grid[3][0].g, { color: C.violet }),
    ...say('SAME CODE: B2', C.violet));

  // 3: two catalog rows for B2
  await until(S(3));
  cat.grid[1][0].r.setFill(C.violet, 0.45);
  const dupC = [1, 3].map(r => rowBox(cat, r, C.violet));
  await play(...dupC.map(b => new M.Create(b, { runTime: 0.7 })), ...say('2 CATALOG ROWS FOR B2: PAPER + HARD', C.violet));

  // 4: the very same left join again
  let outCount = counter(jt, 0, C.green);
  await until(S(4));
  await play(...dupC.map(b => new M.FadeOut(b, { runTime: 0.4 })), new M.FadeIn(jt.label), new M.FadeIn(outCount),
    ...jt.hdrs.map(c => new M.FadeIn(c.g, { runTime: 0.6 })), ...say('SAME LEFT JOIN, ON BOOK', C.green));

  // scanning helpers: one outline on the sales row, outlines on its catalog matches
  let hlS = null, hlC = [];
  function scanS(r) {
    const a = hlS ? [new M.FadeOut(hlS, { runTime: 0.3 })] : [];
    hlS = r == null ? null : rowBox(sal, r, C.ink);
    if (hlS) a.push(new M.Create(hlS, { runTime: 0.5 }));
    return a;
  }
  function scanC(list) {
    const a = hlC.map(b => new M.FadeOut(b, { runTime: 0.3 }));
    hlC = list.map(r => rowBox(cat, r, C.amber));
    a.push(...hlC.map(b => new M.Create(b, { runTime: 0.5 })));
    return a;
  }
  const rowsIn = rs => rs.flatMap(r => jt.grid[r].map(c => new M.FadeIn(c.g, { shift: [0, 0.1, 0], runTime: 0.6 })));
  function setCount(n) {
    const t = counter(jt, n, C.green);
    const a = [new M.FadeOut(outCount, { runTime: 0.3 }), new M.FadeIn(t, { runTime: 0.4 })];
    outCount = t;
    return a;
  }

  // 5: B1 finds one match, one row out
  await until(S(5));
  await play(...scanS(0), ...scanC([0]), ...say('B1 → 1 MATCH', C.cyan));
  await until(S(5) + 2.6);
  await play(...rowsIn([0]), ...setCount(1), ...say('1 ROW OUT', C.green));

  // 6: B2 looks for B2 in the catalog
  await until(S(6));
  await play(...scanS(1), ...scanC([]),
    new M.LaggedStart(cat.grid.map(row => new M.Indicate(row[0].g, { color: C.amber })), { lagRatio: 0.3, runTime: 2.0 }),
    ...say('LOOK FOR B2 IN THE CATALOG', C.amber));

  // 7: two matches
  await until(S(7));
  await play(...scanC([1, 3]), ...say('2 MATCHES: PAPER + HARD', C.violet));

  // 8: one output row per match: this sale becomes two rows
  await until(S(8));
  await play(...say('1 OUTPUT ROW FOR EVERY MATCH', C.green));
  await until(S(8) + 3.0);
  await play(...rowsIn([1, 2]), ...setCount(3), ...say('1 SALE → 2 ROWS', C.violet));

  // 9: both rows say 101, one copy, 20 dollars
  await until(S(9));
  await play(new M.LaggedStart([1, 2].flatMap(r => [0, 2, 3].map(c => new M.Indicate(jt.grid[r][c].g, { color: C.cyan }))), { lagRatio: 0.25, runTime: 3.0 }),
    ...say('BOTH: ORDER 101 · 1 COPY · $20', C.cyan));

  // 10: B3 finds one match
  await until(S(10));
  await play(...scanS(2), ...scanC([2]), ...say('B3 → 1 MATCH', C.cyan));
  await until(S(10) + 1.8);
  await play(...rowsIn([3]), ...setCount(4), ...say('1 ROW OUT', C.green));

  // 11: the B2 sale of order 103 finds two matches
  await until(S(11));
  await play(...scanS(3), ...scanC([1, 3]), ...say('ORDER 103, B2 → 2 MATCHES', C.violet));
  await until(S(11) + 3.9);
  await play(...rowsIn([4, 5]), ...setCount(6), ...say('2 ROWS OUT', C.violet));

  // 12: the other B3 finds one; B4 finds none but is kept
  await until(S(12));
  await play(...scanS(4), ...scanC([2]), ...say('B3 → 1 MATCH', C.cyan));
  await until(S(12) + 1.4);
  await play(...rowsIn([6]), ...setCount(7));
  await until(S(12) + 2.9);
  await play(...scanS(5), ...scanC([]), ...rowsIn([7]), ...setCount(8), ...say('B4: NO MATCH · KEPT, TITLE EMPTY', C.muted));

  // 13: six in, eight out
  await until(S(13));
  await play(...scanS(null), ...say("LET'S COUNT", C.ink));
  await until(S(13) + 0.9);
  await play(new M.Indicate(salCount, { color: C.cyan }), ...say('6 ROWS WENT IN', C.cyan));
  await until(S(13) + 2.2);
  await play(new M.Indicate(outCount, { color: C.violet }), ...say('6 IN → 8 OUT', C.violet));

  // 14: two sales were copied
  await until(S(14));
  EXTRA.forEach(r => jt.grid[r].forEach((c, k) => { if (k < 4) c.r.setFill(C.violet, 0.35); }));
  const exBoxes = EXTRA.map(r => rowBox(jt, r, C.violet));
  await play(...exBoxes.map(b => new M.Create(b, { runTime: 0.7 })), ...say('2 SALES COPIED · NOBODY BOUGHT THESE', C.violet));

  // 15: join multiplication
  const multi = [1, 3].flatMap(s => [...sal.grid[s], ...OUT_OF[s].flatMap(r => jt.grid[r])])
    .map(c => new M.Indicate(c.g, { color: C.violet, runTime: 0.6 }));
  await until(S(15));
  await play(new M.LaggedStart(multi, { lagRatio: 0.06, runTime: 3.2 }), ...say('JOIN MULTIPLICATION', C.violet));

  // 16: a party guest listed twice: two seats, two meals
  const LIST = P ? [0, 0.35] : [-4.3, -0.4];
  const TAB = P ? [0, -3.2] : [1.4, -1.0];
  const listBox = makeBox(LIST[0], LIST[1], 2.6, 2.7, C.ink, 2, C.card, 0.95);
  const listTitle = T('GUEST LIST', P ? 16 : 17, C.ink, true, true); listTitle.moveTo([LIST[0], LIST[1] + 1.0, 0]);
  const GUESTS = ['Ana', 'Sam', 'Lee', 'Sam'];
  const names = GUESTS.map((g, i) => { const t = T(g, P ? 20 : 21, g === 'Sam' ? C.violet : C.ink, false, true); t.moveTo([LIST[0], LIST[1] + 0.4 - i * 0.5, 0]); return t; });
  const tableTop = makeBox(TAB[0], TAB[1], 5.2, 0.9, C.amber, 2, C.amber, 0.12);
  const SX = [-1.95, -0.65, 0.65, 1.95];
  const seats = SX.map((dx, i) => { const c = new M.Circle({ radius: 0.28, color: i % 2 ? C.violet : C.muted }); c.setFill(i % 2 ? C.violet : C.muted, 0.5); c.moveTo([TAB[0] + dx, TAB[1] + 0.85, 0]); return c; });
  const seatNames = SX.map((dx, i) => { const t = T(GUESTS[i], P ? 16 : 17, i % 2 ? C.violet : C.ink); t.moveTo([TAB[0] + dx, TAB[1] + 1.42, 0]); return t; });
  const plates = SX.map((dx, i) => { const c = new M.Circle({ radius: 0.2, color: i % 2 ? C.violet : C.ink }); c.setFill(i % 2 ? C.violet : C.ink, 0.25); c.moveTo([TAB[0] + dx, TAB[1] + 0.05, 0]); return c; });
  const party = [listBox, listTitle, ...names, tableTop, ...seats, ...seatNames, ...plates];
  const stage1 = [...sal.allMobs, salCount, ...cat.allMobs, ...jt.allMobs, outCount, ...exBoxes];
  await until(S(16));
  pillAt = PILL2;
  await play(new M.FadeOut(new M.VGroup(...stage1), { runTime: 0.6 }),
    new M.LaggedStart(party.map(m => new M.FadeIn(m, { runTime: 0.4 })), { lagRatio: 0.08, runTime: 1.8 }),
    ...say('A NAME TWICE ON THE GUEST LIST', C.violet));
  await until(S(16) + 3.6);
  await play(new M.LaggedStart([1, 3].map(i => new M.Indicate(seats[i], { color: C.violet })), { lagRatio: 0.5, runTime: 1.0 }),
    ...say('TWO SEATS…', C.violet));
  await until(S(16) + 4.9);
  await play(new M.LaggedStart([1, 3].map(i => new M.Indicate(plates[i], { color: C.violet })), { lagRatio: 0.5, runTime: 1.0 }),
    ...say('…AND TWO MEALS', C.violet));

  // 17: add up the money in the joined table
  const jt2 = makeJoined();
  const jt2Count = counter(jt2, 8, C.green);
  const amtBox = colBoxOf(jt2, 3, C.amber);
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(...party), { runTime: 0.5 }),
    ...jt2.allMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })), new M.FadeIn(jt2Count), new M.Create(amtBox, { runTime: 1.0 }),
    ...fbox(['joined amounts:', '20 + 20 + 20 + 15', '+ 20 + 20 + 30 + 25'], C.amber),
    ...say('ADD UP THE MONEY', C.amber));

  // 18: real total 130
  await until(S(18));
  await play(new M.LaggedStart([0, 1, 3, 4, 6, 7].map(r => new M.Indicate(jt2.grid[r][3].g, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['real total (6 sales):', ['130 dollars', C.cyan]], C.cyan),
    ...say('REAL TOTAL: $130', C.cyan));

  // 19: first B2 sale counted twice
  await until(S(19));
  [1, 2].forEach(r => jt2.grid[r][3].r.setFill(C.violet, 0.45));
  await play(...[1, 2].map(r => new M.Indicate(jt2.grid[r][3].g, { color: C.violet })),
    ...fbox(['real total = 130', ['101 B2: 20 counted 2×', C.violet]], C.violet),
    ...say('FIRST B2 SALE: $20 TWICE', C.violet));

  // 20: second B2 sale counted twice
  await until(S(20));
  [4, 5].forEach(r => jt2.grid[r][3].r.setFill(C.violet, 0.45));
  await play(...[4, 5].map(r => new M.Indicate(jt2.grid[r][3].g, { color: C.violet })),
    ...fbox(['real total = 130', '101 B2: 20 counted 2×', ['103 B2: 20 counted 2×', C.violet]], C.violet),
    ...say('SECOND B2 SALE: $20 TWICE', C.violet));

  // 21: 20 + 20 extra = 40 too much
  await until(S(21));
  await play(...EXTRA.map(r => new M.Indicate(jt2.grid[r][3].g, { color: C.violet })),
    ...fbox(['real total = 130', ['extra = 20 + 20 = 40', C.violet]], C.violet),
    ...say('$40 TOO MUCH', C.violet));

  // 22: 130 + 40 = 170
  await until(S(22));
  await play(...fbox(['real total = 130', 'extra      =  40', ['130 + 40   = 170', C.amber]], C.amber),
    ...say('130 + 40 = 170', C.amber));

  // 23: report says 170, shop made 130
  await until(S(23));
  await play(...fbox([['report says: 170', C.violet], ['shop made:   130', C.cyan]], C.violet),
    ...say('REPORT: $170 · SHOP MADE: $130', C.violet));

  // 24: no error message
  await until(S(24));
  [1, 2, 4, 5].forEach(r => resetCell(jt2, r, 3));
  await play(new M.FadeOut(amtBox, { runTime: 0.5 }),
    ...fbox(['error messages: 0', ['170 looks like good news', C.violet]], C.violet),
    ...say('NO ERROR MESSAGE', C.pink));

  // 25: why? remember keys
  const cat3 = makeTable({ title: 'catalog', titleColor: C.amber, headers: CAT_H, rows: CAT,
    cx: CX, topY: P ? 1.3 : 1.2, colW: P ? [1.5, 4.4] : [1.3, 3.4], rh: P ? 0.66 : 0.6, fs: P ? 17 : 18, style: catStyle });
  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(...jt2.allMobs, jt2Count), { runTime: 0.5 }),
    ...cat3.allMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })),
    ...fbox(['key:', ['tells each row apart', C.cyan], ['no value repeats', C.cyan]], C.cyan),
    ...say('WHY? REMEMBER KEYS', C.cyan));

  // 26: grain one row per book; key = book code, unique
  const keyBox = colBoxOf(cat3, 0, C.amber);
  await until(S(26));
  await play(...fbox(['grain: one row per book', ['key: book code', C.amber], ['must be unique', C.amber]], C.amber),
    ...say('GRAIN: 1 ROW PER BOOK', C.amber));
  await until(S(26) + 2.9);
  await play(new M.Create(keyBox, { runTime: 0.8 }), ...say('KEY: BOOK CODE, UNIQUE', C.amber));

  // 27: B2 is not unique
  await until(S(27));
  [1, 3].forEach(r => cat3.grid[r][0].r.setFill(C.violet, 0.45));
  const dup3 = [1, 3].map(r => rowBox(cat3, r, C.violet));
  await play(...dup3.map(b => new M.Create(b, { runTime: 0.7 })),
    ...fbox(['key: book code', ['B2 appears 2 times', C.violet], ['→ not unique', C.violet]], C.violet),
    ...say('B2 IS NOT UNIQUE · THE JOIN BROKE', C.violet));

  // 28: the rule in one line
  const sal4 = makeTable({ title: 'sales', titleColor: C.cyan, headers: [...SALES_H, 'matches'], rows: SALES.map(s => [...s.slice(0, 4), '']),
    cx: L4.cx, topY: L4.top, colW: L4.w, rh: L4.rh, fs: L4.fs,
    style: (r, c) => c === 4 ? { border: C.green, fill: C.green, fillOp: 0.06, text: C.ink } : salStyle(r) });
  const salBase = [sal4.label, ...sal4.hdrs.slice(0, 4).map(c => c.g), ...sal4.grid.flatMap(row => row.slice(0, 4).map(c => c.g))];
  await until(S(28));
  await play(new M.FadeOut(new M.VGroup(...cat3.allMobs, keyBox, ...dup3), { runTime: 0.5 }),
    ...salBase.map(m => new M.FadeIn(m, { runTime: 0.8 })),
    ...fbox(['the rule:', ['rows out = sum of', C.cyan], ["each row's matches", C.cyan]], C.cyan),
    ...say('THE RULE, IN ONE LINE', C.cyan));

  // 29: count each row's matches; no match still counts as one
  const MCOUNT = ['1', '2', '1', '2', '1', '0 → 1'];
  const mt = MCOUNT.map((v, r) => {
    const t = T(v, L4.fs, v === '2' ? C.violet : r === 5 ? C.green : C.ink, true, true);
    t.moveTo([sal4.colX[4], sal4.grid[r][4].y, 0]);
    return t;
  });
  await until(S(29));
  await play(new M.FadeIn(sal4.hdrs[4].g),
    new M.LaggedStart(sal4.grid.map(row => new M.FadeIn(row[4].g, { runTime: 0.3 })), { lagRatio: 0.15, runTime: 1.0 }),
    ...say("COUNT EACH SALES ROW'S MATCHES", C.green));
  await until(S(29) + 2.6);
  await play(new M.FadeIn(mt[5]), new M.Flash(sal4.grid[5][4].r, { color: C.green }),
    ...fbox(['rows out = sum of', "each row's matches", ['no match → counts as 1', C.green]], C.green),
    ...say('NO MATCH STILL COUNTS AS 1', C.green));

  // 30: one, two, one, two, one, and one
  await until(S(30));
  await play(...say('1, 2, 1, 2, 1, 1', C.green));
  await until(S(30) + 1.3);
  await play(new M.LaggedStart([...mt.slice(0, 5).map(t => new M.FadeIn(t, { runTime: 0.35 })), new M.Indicate(mt[5], { color: C.green })], { lagRatio: 0.6, runTime: 2.3 }));

  // 31: 1+2+1+2+1+1 = 8
  await until(S(31));
  await play(new M.LaggedStart(mt.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 2.2 }),
    ...fbox(['rows out = sum of matches', ['1+2+1+2+1+1 = 8', C.amber]], C.amber),
    ...say('6 ROWS IN → 8 ROWS OUT', C.amber));

  // 32: every extra match is an extra copy
  const plus = [1, 3].map(r => {
    const t = T('+1 copy', P ? 15 : 16, C.violet, false, true);
    t.moveTo([sal4.xLeft + sal4.totalW + 0.15 + t.getWidth() / 2, sal4.grid[r][4].y, 0]);
    return t;
  });
  await until(S(32));
  await play(...plus.map(t => new M.FadeIn(t, { shift: [0.15, 0, 0] })), new M.Indicate(mt[1], { color: C.violet }), new M.Indicate(mt[3], { color: C.violet }),
    ...say('EXTRA MATCH = EXTRA COPY', C.violet));

  // 33: three checks
  const cardW = P ? 7.0 : 6.4, cardH = P ? 1.0 : 0.85, gapY = P ? 1.3 : 1.05, y0 = P ? 0.9 : 0.85;
  const CHECKS = ['key is unique in the catalog', 'rows before = rows after', 'total before = total after'];
  const frames = [], ctexts = [];
  CHECKS.forEach((txt, i) => {
    const y = y0 - i * gapY;
    const box = makeBox(CX, y, cardW, cardH, C.green, 2, C.card, 0.95);
    const circ = new M.Circle({ radius: 0.27, color: C.green }); circ.setFill(C.green, 0.15); circ.moveTo([CX - cardW / 2 + 0.5, y, 0]);
    const num = T(String(i + 1), P ? 20 : 21, C.green, true, true); num.moveTo([CX - cardW / 2 + 0.5, y, 0]);
    frames.push(new M.VGroup(box, circ, num));
    const t = fitText(txt, P ? 20 : 21, C.ink, cardW - 1.3, false, true);
    t.moveTo([CX - cardW / 2 + 0.95 + t.getWidth() / 2, y, 0]);
    ctexts.push(t);
  });
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(...sal4.allMobs, ...mt, ...plus), { runTime: 0.5 }), ...hideBox(),
    new M.LaggedStart(frames.map(f => new M.FadeIn(f, { runTime: 0.5 })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('3 CHECKS', C.green));

  // 34: first: key unique in the catalog
  await until(S(34));
  await play(new M.FadeIn(ctexts[0], { shift: [0.15, 0, 0] }), new M.Indicate(frames[0], { color: C.green }),
    ...fbox(['before the join:', 'catalog codes: B1 B2 B3 B2', ['B2 twice → fix first', C.violet]], C.green),
    ...say('1: BEFORE THE JOIN, KEY UNIQUE?', C.green));

  // 35: second: rows before and after
  await until(S(35));
  await play(new M.FadeIn(ctexts[1], { shift: [0.15, 0, 0] }), new M.Indicate(frames[1], { color: C.green }),
    ...fbox(['rows in:  6', ['rows out: 6  ✓', C.green], ['8 out → stop and look', C.violet]], C.green),
    ...say('2: 6 IN SHOULD MEAN 6 OUT', C.green));

  // 36: third: compare totals
  await until(S(36));
  await play(new M.FadeIn(ctexts[2], { shift: [0.15, 0, 0] }), new M.Indicate(frames[2], { color: C.green }),
    ...fbox(['total before: 130', ['total after:  130 ✓', C.green], ['170 → stop and look', C.violet]], C.green),
    ...say('3: A JOIN MUST NOT CHANGE THE MONEY', C.green));

  // 37: two editions? different codes, or one row per book first
  await until(S(37));
  await play(...fbox(['two editions?', ['give each its own code', C.green]], C.green), ...say('THE FIX', C.green));
  await until(S(37) + 3.4);
  await play(...fbox(['two editions?', ['give each its own code', C.green], ['or one row per book first', C.green]], C.green));

  // 38: seconds of work, every total protected
  await until(S(38));
  await play(new M.LaggedStart(frames.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.4, runTime: 1.8 }),
    ...say('SECONDS OF WORK · EVERY TOTAL SAFE', C.green));

  // 39: the trap: extra rows look perfectly normal
  const jt3 = makeJoined();
  const jt3Count = counter(jt3, 8, C.green);
  await until(S(39));
  await play(new M.FadeOut(new M.VGroup(...frames, ...ctexts), { runTime: 0.5 }), ...hideBox(),
    ...jt3.allMobs.map(m => new M.FadeIn(m, { runTime: 0.8 })), new M.FadeIn(jt3Count),
    ...say('EXTRA ROWS LOOK PERFECTLY NORMAL', C.violet));
  await until(S(39) + 2.4);
  await play(new M.LaggedStart(EXTRA.flatMap(r => jt3.grid[r].map(c => new M.Indicate(c.g, { color: C.violet }))), { lagRatio: 0.08, runTime: 1.4 }));

  // 40: next: one total per shop
  await until(S(40));
  await play(...fbox(['next lesson:', ['one total per shop', C.cyan], ['many rows → 1 number', C.cyan]], C.cyan),
    ...say('NEXT: ONE TOTAL FOR EACH SHOP', C.cyan));

  // 41: one-sentence recap
  const recapSpec = [
    { key: 'KEY REPEATS', desc: 'rows get copied: 6 → 8', color: C.violet },
    { key: 'TOTALS GROW', desc: '130 becomes 170 dollars', color: C.amber },
    { key: 'ALWAYS CHECK', desc: 'unique key · row count', color: C.green },
  ];
  const recapCards = recapSpec.map((item, i) => {
    const y = y0 - i * gapY;
    const r = makeBox(CX, y, cardW, cardH, item.color, 2.5, C.card, 0.95);
    const k = fitText(item.key, P ? 19 : 20, item.color, 2.2, true, true);
    k.moveTo([CX - cardW / 2 + 0.25 + k.getWidth() / 2, y, 0]);
    const d = fitText(item.desc, P ? 19 : 20, C.ink, cardW - 2.85, false, false);
    d.moveTo([CX - cardW / 2 + 2.6 + d.getWidth() / 2, y, 0]);
    return new M.VGroup(r, k, d);
  });
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(...jt3.allMobs, jt3Count), { runTime: 0.5 }), ...hideBox(),
    new M.LaggedStart(recapCards.map(c => new M.FadeIn(c, { runTime: 0.7 })), { lagRatio: 0.35, runTime: 2.1 }),
    ...say('KEY REPEATS → ROWS COPIED → TOTALS GROW', C.amber));
}
