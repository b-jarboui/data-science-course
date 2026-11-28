// 3.1.9 Window functions: a running total, row by row (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const ROWS = [[101, 1, 20], [101, 2, 20], [102, 1, 15], [103, 1, 20], [103, 2, 30], [104, 1, 25]];
  const NORTH = [true, true, false, true, true, false];
  const RUN = [20, 40, 55, 75, 105, 130];
  const ORDER0 = [0, 1, 2, 3, 4, 5], DESC = [4, 5, 0, 1, 3, 2], RUN_D = [30, 55, 75, 95, 115, 130];

  // layout: table on the left (laptop) or on top (phone); formula box right (laptop) or below (phone)
  const TX = P ? 0.1 : -2.6, HY = P ? 3.0 : 1.2, RH = P ? 1.0 : 0.62;
  const COLW = P ? [1.2, 0.9, 2.0, 2.9] : [1.3, 1.05, 1.7, 2.6];
  const TW = COLW.reduce((a, b) => a + b, 0), LEFT = TX - TW / 2;
  const colX = c => LEFT + COLW.slice(0, c).reduce((a, b) => a + b, 0) + COLW[c] / 2;
  const rowY = r => HY - (r + 1) * RH;
  const PILL = P ? [0, 3.85, 0] : [TX, 1.85, 0];
  const BOXP = P ? [0, -3.75, 0] : [4.45, -0.3, 0];   // phone: top edge of the box; laptop: its centre
  const SIDE = P ? [0, -5.1, 0] : [4.0, -0.3, 0];
  const CS = P ? 21 : 21, HS = P ? 17 : 18;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = i => cw * (rows[i][0].length - rows[i][0].trimStart().length);
    const widths = texts.map((t, i) => t.getWidth() + ind(i));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([0, 0, 0]);
    const left = -wd / 2 + 0.35, top = ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind(i) + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.9, k = Math.min(1, maxw / wd);
    if (k < 1) g.scale(k);
    g.moveTo(P ? [BOXP[0], BOXP[1] - ht * k / 2, 0] : BOXP);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // table parts, drawn from coordinates
  const cell = (r, c, fill = C.card, op = 0.9) => {
    const b = new M.Rectangle({ width: COLW[c] - 0.06, height: RH - 0.06, color: C.line, strokeWidth: 1.5 });
    b.setFill(fill, op); b.moveTo([colX(c), rowY(r), 0]); return b;
  };
  const txt = (s, r, c, color, size = CS) => { const t = T(String(s), size, color, true); t.moveTo([colX(c), rowY(r), 0]); return t; };
  const HEAD = ['ORDER', 'LINE', 'AMOUNT ($)', 'TOTAL SO FAR'];
  const hCells = HEAD.map((_, c) => cell(-1, c, C.line, 0.9));
  const hText = HEAD.map((s, c) => txt(s, -1, c, c === 3 ? C.amber : C.muted, HS));
  const cells = ROWS.map((_, r) => [0, 1, 2, 3].map(c => cell(r, c)));
  const rowTexts = (order, col = () => [C.ink, C.cyan]) => order.map((k, p) => {
    const [a, b] = col(k);
    return [txt(ROWS[k][0], p, 0, a), txt(ROWS[k][1], p, 1, a), txt(ROWS[k][2], p, 2, b)];
  });
  let rowsNow = rowTexts(ORDER0);
  function swapRows(order, col) {
    const old = rowsNow.flat(); rowsNow = rowTexts(order, col);
    return [new M.FadeOut(new M.VGroup(...old)), new M.LaggedStart(rowsNow.map(r => new M.FadeIn(new M.VGroup(...r))), { lagRatio: 0.15, runTime: 1.2 })];
  }
  let runNow = [];
  function dropRun() { const a = runNow.length ? [new M.FadeOut(new M.VGroup(...runNow))] : []; runNow = []; return a; }
  function putRun(vals, col = () => C.amber, runTime = 1.4) {
    const a = dropRun();
    runNow = vals.map((v, p) => txt(v, p, 3, col(p)));
    a.push(new M.LaggedStart(runNow.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime }));
    return a;
  }
  function head3(s, color = C.amber) { const old = hText[3]; hText[3] = txt(s, -1, 3, color, HS); return [new M.FadeOut(old), new M.FadeIn(hText[3])]; }
  const frameRect = (a, b, color = C.green, sw = 4) => {
    const f = new M.Rectangle({ width: TW + 0.14, height: (b - a + 1) * RH + 0.1, color, strokeWidth: sw });
    f.setFill(C.bg, 0); f.moveTo([TX, (rowY(a) + rowY(b)) / 2, 0]); return f;
  };

  // 0 the question: six January sales, one after another
  const DY = P ? -0.4 : 0.5, GY = P ? -3.4 : -1.5, GX = P ? 1.6 : 1.8;
  const sales = ROWS.map((_, k) => new M.Dot({ point: [(k - 2.5) * (P ? 1.1 : 1.2), DY, 0], radius: P ? 0.22 : 0.16, color: C.cyan }));
  const sTag = T('6 sales in January', 17, C.muted); sTag.moveTo([0, DY - 0.6, 0]);
  await until(S(0));
  await play(new M.LaggedStart(sales.map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 2.4 }), new M.FadeIn(sTag), ...say('HOW DID JANUARY SALES BUILD UP?', C.amber));

  // 1 last lesson: grouping swallowed the sales
  const gbox = (s, color, x) => {
    const r = new M.RoundedRectangle({ width: P ? 2.6 : 2.8, height: 0.9, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, GY, 0]);
    const t = T(s, 22, color, true); t.moveTo([x, GY, 0]);
    return new M.VGroup(r, t);
  };
  const north = gbox('NORTH  90', C.cyan, -GX), south = gbox('SOUTH  40', C.pink, GX);
  await until(S(1)); await play(new M.FadeIn(north), new M.FadeIn(south), ...say('LAST LESSON: GROUPING → TOTALS', C.muted));
  await play(new M.LaggedStart(sales.map((d, k) => new M.Transform(d, new M.Dot({ point: [NORTH[k] ? -GX : GX, GY + 0.32, 0], radius: 0.04, color: NORTH[k] ? C.cyan : C.pink }))), { lagRatio: 0.15, runTime: 1.6 }));
  await until(S(1) + 2.8); await play(new M.FadeOut(new M.VGroup(...sales, sTag)), ...say('EVERY SINGLE SALE DISAPPEARED', C.pink));

  // 2 this time: keep every sale
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(north, south)), ...say('KEEP EVERY SALE + SEE THE TOTAL GROW', C.green));

  // 3 line up the six sales by order, then line
  await until(S(3));
  await play(new M.FadeIn(new M.VGroup(...hCells.slice(0, 3), ...hText.slice(0, 3))), ...say('IN ORDER: BY ORDER, THEN BY LINE'));
  await play(new M.LaggedStart(ROWS.map((_, r) => new M.FadeIn(new M.VGroup(cells[r][0], cells[r][1], cells[r][2], rowsNow[r][0], rowsNow[r][1]))), { lagRatio: 0.25, runTime: 1.8 }));

  // 4 the amounts
  await until(S(4)); await play(...say('THE AMOUNTS, IN DOLLARS'));
  await play(new M.LaggedStart(rowsNow.map(r => new M.FadeIn(r[2])), { lagRatio: 0.7, runTime: 4.4 }));

  // 5 a new column: total so far
  await until(S(5));
  await play(new M.FadeIn(new M.VGroup(hCells[3], hText[3])), new M.LaggedStart(cells.map(r => new M.FadeIn(r[3])), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('NEXT TO EACH SALE: THE TOTAL SO FAR', C.amber), ...fbox(['total so far', ['0', C.amber]], C.amber));

  // 6-11 sale by sale
  let tot = 0;
  for (let k = 0; k < 6; k++) {
    await until(S(6 + k));
    if (k) cells[k - 1][2].setFill(C.card, 0.9);
    cells[k][2].setFill(C.amber, 0.28);
    await play(new M.Indicate(rowsNow[k][2], { color: C.amber }));
    await until(S(6 + k) + 1.5);
    const prev = tot; tot += ROWS[k][2];
    const t = txt(tot, k, 3, C.amber); runNow.push(t);
    await play(new M.FadeIn(t), new M.Flash(t, { color: C.amber }),
      ...fbox(['total so far', [prev ? `${prev} + ${ROWS[k][2]} = ${tot}` : `${tot}`, C.amber]], C.amber));
  }

  // 12 the last number is the January total
  await until(S(12)); cells[5][2].setFill(C.card, 0.9);
  await play(new M.Indicate(runNow[5], { color: C.amber }), new M.Flash(runNow[5], { color: C.amber, flashRadius: 0.5 }),
    ...fbox(['20 + 20 + 15', '+ 20 + 30 + 25', ['= 130', C.amber]], C.amber), ...say('130 = THE FULL JANUARY TOTAL', C.amber));

  // 13 the name
  await until(S(13)); await play(...head3('RUNNING TOTAL'), ...clearBox(), ...say('RUNNING TOTAL', C.green));

  // 14 like a game score
  const sb = new M.RoundedRectangle({ width: 2.4, height: 1.5, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  sb.setFill(C.card, 0.95); sb.moveTo(SIDE);
  const sl = T('SCORE', 16, C.violet, true); sl.moveTo([SIDE[0], SIDE[1] + 0.45, 0]);
  const scoreAt = n => { const t = T(String(n), 34, C.ink, true, true); t.moveTo([SIDE[0], SIDE[1] - 0.15, 0]); return t; };
  let score = scoreAt(0);
  await until(S(14)); await play(new M.FadeIn(new M.VGroup(sb, sl, score), { runTime: 0.6 }), ...say('LIKE A GAME SCORE', C.violet));
  for (let n = 1; n <= 3; n++) {
    const next = scoreAt(n);
    await play(new M.FadeOut(score, { runTime: 0.45 }), new M.FadeIn(next, { runTime: 0.45 }), new M.Flash(next, { color: C.violet, flashRadius: 0.45, runTime: 0.45 }));
    score = next;
  }

  // 15 all six rows still here, one new column
  const counts = ROWS.map((_, r) => { const t = T(String(r + 1), 16, C.violet, true); t.moveTo([LEFT - 0.32, rowY(r), 0]); return t; });
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(sb, sl, score)), new M.LaggedStart(counts.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.6 }), ...say('ALL 6 ROWS ARE STILL HERE', C.violet));
  const colBox = new M.Rectangle({ width: COLW[3] + 0.1, height: 6 * RH + 0.1, color: C.amber, strokeWidth: 3 });
  colBox.setFill(C.bg, 0); colBox.moveTo([colX(3), (rowY(0) + rowY(5)) / 2, 0]);
  await until(S(15) + 2.6); await play(new M.Create(colBox), ...say('PLUS ONE NEW COLUMN BESIDE THEM', C.amber));

  // 16-17 the difference from grouping
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(colBox, ...counts)), ...say('THE BIG DIFFERENCE FROM LAST LESSON', C.violet));
  function mini(cx, cy, keep) {
    const parts = [], pitch = 0.2;
    const bar = (x, y, w, hgt, color) => { const b = new M.Rectangle({ width: w, height: hgt, color, strokeWidth: 1 }); b.setFill(color, 0.8); b.moveTo([x, y, 0]); return b; };
    for (let j = 0; j < 6; j++) parts.push(bar(cx - 0.85, cy + (2.5 - j) * pitch, 0.42, 0.14, C.cyan));
    parts.push(new M.Arrow({ start: [cx - 0.5, cy, 0], end: [cx + 0.15, cy, 0], color: C.muted }));
    if (keep) {
      for (let j = 0; j < 6; j++) {
        parts.push(bar(cx + 0.55, cy + (2.5 - j) * pitch, 0.42, 0.14, C.cyan));
        parts.push(bar(cx + 0.98, cy + (2.5 - j) * pitch, 0.3, 0.14, C.amber));
      }
    } else {
      [[0.25, C.cyan, '90'], [-0.25, C.pink, '40']].forEach(([dy, color, v]) => {
        parts.push(bar(cx + 0.55, cy + dy, 0.42, 0.3, color));
        const t = T(v, 15, color, true); t.moveTo([cx + 1.1, cy + dy, 0]); parts.push(t);
      });
    }
    const lab = T(keep ? 'KEEP EVERY ROW' : 'GROUPING', 16, keep ? C.green : C.muted, true); lab.moveTo([cx, cy + 0.85, 0]);
    parts.push(lab);
    return new M.VGroup(...parts);
  }
  const g1 = mini(...(P ? [-2.0, -5.1] : [4.0, 0.5]), false), g2 = mini(...(P ? [2.0, -5.1] : [4.0, -1.75]), true);
  await until(S(17)); await play(new M.FadeIn(g1), ...say('GROUPING: MANY ROWS FOLD INTO ONE', C.muted));
  await until(S(17) + 3.0); await play(new M.FadeIn(g2), ...say('THIS: EVERY ROW KEPT + A RESULT', C.green));

  // 18-20 for each row, a set of rows: this row and all before it
  const rowMark = frameRect(3, 3, C.amber, 3);
  await until(S(18)); await play(new M.FadeOut(new M.VGroup(g1, g2)), new M.Create(rowMark), ...say('EACH ROW LOOKS AT A SET OF ROWS', C.amber));
  const frame = frameRect(0, 3);
  await until(S(19)); await play(new M.Create(frame), ...say('THIS ROW + ALL THE ROWS BEFORE IT', C.green));
  await until(S(20)); await play(new M.FadeOut(rowMark), new M.Transform(frame, frameRect(0, 0)), new M.Indicate(runNow[0], { color: C.green }), ...say('A FRAME SLIDES DOWN, GROWING', C.green));
  for (let k = 1; k < 6; k++) await play(new M.Transform(frame, frameRect(0, k), { runTime: 0.55 }), new M.Indicate(runNow[k], { color: C.green, runTime: 0.55 }));

  // 21-22 window, window function
  await until(S(21)); await play(new M.Indicate(frame, { color: C.green }), ...say('WINDOW = THE ROWS YOU LOOK THROUGH', C.green));
  await until(S(22)); await play(new M.FadeOut(frame), new M.LaggedStart(runNow.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('WINDOW FUNCTION', C.green));

  // 23-26 the SQL
  await until(S(23)); await play(new M.LaggedStart(rowsNow.map(r => new M.Indicate(r[2], { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['amount = copies × price', ['row 1: 2 × 10 = 20', C.muted]]), ...say('AMOUNT: FROM THE LAST LESSON', C.muted));
  await until(S(24)); await play(...fbox(['SUM(amount)', 'OVER (ORDER BY order, line)']), ...say('IN SQL'));
  await until(S(25)); await play(...fbox(['SUM(amount)', ['  add up the amounts', C.muted], 'OVER (', ['  through a window', C.muted], 'ORDER BY order, line)', ['  rows sorted by order, line', C.muted]]), ...say('IN WORDS'));
  await until(S(26)); await play(...fbox(['SUM(amount)', ['OVER', C.green], '(ORDER BY order, line)'], C.green), ...say('OVER = A WINDOW, EVERY ROW KEPT', C.green));

  // 27-28 more than running totals: number the rows, compare with the one before
  await until(S(27)); await play(...clearBox(), ...say('MORE THAN RUNNING TOTALS', C.violet));
  await until(S(28)); await play(...head3('ROW NUMBER', C.violet), ...putRun([1, 2, 3, 4, 5, 6], () => C.violet), ...say('NUMBER THE ROWS: 1, 2, 3 …', C.violet));
  await until(S(28) + 3.0); await play(...head3('VS. SALE BEFORE', C.violet), ...putRun(['—', '+0', '−5', '+5', '+10', '−5'], () => C.violet), ...say('COMPARE WITH THE SALE BEFORE', C.violet));

  // 29-30 partition by store
  await until(S(29)); await play(...head3('RUNNING TOTAL'), ...dropRun(),
    ...fbox(['SUM(amount) OVER (', ['  PARTITION BY store', C.green], '  ORDER BY order, line)'], C.green), ...say('PARTITION BY: START AGAIN PER GROUP', C.green));
  const LGY = P ? -6.3 : rowY(5) - RH / 2 - 0.35;
  const legN = T('NORTH', 16, C.cyan, true), legS = T('SOUTH', 16, C.pink, true);
  legN.moveTo([TX - 1.1, LGY, 0]); legS.moveTo([TX + 1.1, LGY, 0]);
  const storeCol = k => NORTH[k] ? [C.cyan, C.cyan] : [C.pink, C.pink];
  await until(S(30)); await play(...swapRows(ORDER0, storeCol), new M.FadeIn(new M.VGroup(legN, legS)), ...say('ONE RUNNING TOTAL PER STORE', C.green));
  await play(...putRun([20, 40, 15, 60, 90, 40], p => NORTH[p] ? C.cyan : C.pink, 2.0),
    ...fbox([['North: 20, 40, 60, 90', C.cyan], ['South: 15, 40', C.pink]], C.green));

  // 31 when to use it
  await until(S(31)); await play(...swapRows(ORDER0), new M.FadeOut(new M.VGroup(legN, legS)), ...putRun(RUN), ...clearBox(), ...say('A SUMMARY + EVERY DETAIL ROW', C.green));

  // 32-33 the trap: row order
  await until(S(32)); await play(new M.LaggedStart(rowsNow.flatMap(r => [r[0], r[1]]).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.1, runTime: 1.6 }), ...say('THE TRAP: THE ORDER OF THE ROWS', C.pink));
  await until(S(33)); await play(new M.Indicate(hText[0], { color: C.amber }), new M.Indicate(hText[1], { color: C.amber }),
    ...fbox(['ORDER BY order, line'], C.amber), ...say('A RUNNING TOTAL NEEDS A STATED ORDER', C.amber));

  // 34-35 biggest first
  await until(S(34)); await play(...swapRows(DESC), ...dropRun(), ...clearBox(), ...say('SORTED: BIGGEST → SMALLEST', C.pink));
  await until(S(34) + 3.0); await play(...putRun(RUN_D, () => C.pink, 1.6), ...say('FIRST RUNNING VALUE: 30, NOT 20', C.pink));
  await play(new M.Flash(runNow[0], { color: C.pink, flashRadius: 0.5 }), new M.Indicate(runNow[0], { color: C.pink }));
  await until(S(35)); await play(new M.LaggedStart(runNow.slice(0, 5).map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox([['by order, line:', C.muted], '20 40 55 75 105 130', ['biggest first:', C.muted], ['30 55 75 95 115 130', C.pink]], C.pink),
    ...say('EVERY NUMBER IN BETWEEN CHANGES', C.pink));
  await until(S(35) + 2.8); await play(new M.Indicate(runNow[5], { color: C.green }), new M.Flash(runNow[5], { color: C.green, flashRadius: 0.5 }), ...say('ONLY 130 STAYS THE SAME', C.green));

  // 36 no ORDER BY: the window is the whole table
  const whole = frameRect(0, 5, C.pink);
  await until(S(36)); await play(new M.Create(whole), ...fbox(['SUM(amount) OVER ()', ['no ORDER BY', C.pink]], C.pink), ...say('NO ORDER BY → WINDOW = WHOLE TABLE', C.pink));
  await until(S(36) + 3.4); await play(...putRun([130, 130, 130, 130, 130, 130], () => C.pink, 1.4), ...say('EVERY ROW SHOWS 130', C.pink));

  // 37 always write the ORDER BY
  await until(S(37)); await play(new M.FadeOut(whole), ...swapRows(ORDER0), ...dropRun(),
    ...fbox(['SUM(amount) OVER (', ['  ORDER BY order, line)', C.green]], C.green), ...say('ALWAYS WRITE THE ORDER BY', C.green));
  await until(S(37) + 2.4); await play(...putRun(RUN), ...say('MATCH THE QUESTION: TIME ORDER', C.amber));

  // 38 next lesson
  await until(S(38)); await play(...clearBox(), ...say('NEXT: WIDE → LONG', C.violet));

  // 39 summary: a result for each row from the rows around it, every row kept
  const sweep = frameRect(0, 0);
  await until(S(39)); await play(new M.Create(sweep), new M.Indicate(runNow[0], { color: C.green }), ...say('EACH ROW: A RESULT FROM ROWS AROUND IT', C.green));
  for (let k = 1; k < 6; k++) await play(new M.Transform(sweep, frameRect(0, k), { runTime: 0.5 }), new M.Indicate(runNow[k], { color: C.green, runTime: 0.5 }));
  await until(S(39) + 5.0); await play(new M.FadeOut(sweep), new M.LaggedStart(rowsNow.map(r => new M.Indicate(r[0], { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }), ...say('LIKE A RUNNING TOTAL, EVERY ROW KEPT', C.green));
}
