// lesson 1.1.2
// Variables: one thing recorded about every order.
// Live manim-web scene. Beat i = narration sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const HEAD = ['Order', 'Drink', 'Price ($)', 'Wait time (s)'];
  const ROWS = [
    ['1', 'coffee', '3', '120'],
    ['2', 'tea', '4', '90'],
    ['3', 'coffee', '5', '150'],
    ['4', 'juice', '4', '60'],
    ['5', 'coffee', '4', '180'],
    ['6', 'tea', '3', '60'],
  ];
  const WAIT = [120, 90, 150, 60, 180, 60];

  // ---------- Layout ----------
  const CW = P
    ? [1.25, 1.85, 1.7, 2.4]
    : [1.45, 1.95, 1.85, 2.45];

  const TW = CW.reduce((a, b) => a + b, 0);
  const CX = P ? 0 : -2.75;
  const RH = P ? 0.98 : 0.6;
  const TOPY = P ? 2.4 : 1.1;
  const HS = P ? 23 : 21;
  const CS = P ? 29 : 24;

  const BOXP = P ? [0, -5.6, 0] : [4.25, 0.4, 0];
  const BOXW = P ? FW - 1.0 : 5.0;
  const PILL = P ? [0, 4.0, 0] : [CX, 1.85, 0];

  const left = CX - TW / 2;
  const colx = CW.map((_, c) =>
    left + CW.slice(0, c).reduce((a, b) => a + b, 0) + CW[c] / 2
  );
  const rowy = r => TOPY - (r + 1) * RH;

  const say = (s, color = C.cyan, size) =>
    showA(s, color, PILL, size);

  // ---------- Explanation box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);

    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const frame = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);

    const textLeft = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([
        textLeft + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const group = new M.VGroup(frame, ...texts);
    const maxw = P ? FW - 1.2 : BOXW;

    if (wd > maxw) group.scale(maxw / wd);

    const animations = [new M.FadeIn(group)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = group;
    return animations;
  }

  function fit(t, width) {
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    return t;
  }

  // ---------- Table ----------
  const card = new M.RoundedRectangle({
    width: TW + 0.3,
    height: 7 * RH + 0.3,
    cornerRadius: 0.18,
    color: C.muted,
    strokeWidth: 1.5,
  });
  card.setFill(C.card, 0.95);
  card.moveTo([CX, TOPY - 3 * RH, 0]);

  const hbar = new M.Rectangle({
    width: TW,
    height: RH,
    color: C.cyan,
    strokeWidth: 0,
  });
  hbar.setFill(C.cyan, 0.14);
  hbar.moveTo([CX, TOPY, 0]);

  const heads = HEAD.map((h, c) => {
    const t = fit(T(h, HS, C.cyan, true), CW[c] - 0.12);
    t.moveTo([colx[c], TOPY, 0]);
    return t;
  });

  const cells = ROWS.map((row, r) =>
    row.map((v, c) => {
      const t = T(String(v), CS, C.ink, c !== 1);
      fit(t, CW[c] - 0.12);
      t.moveTo([colx[c], rowy(r), 0]);
      return t;
    })
  );

  const rules = Array.from({ length: 6 }, (_, i) => {
    const k = i + 1;
    return new M.Line({
      start: [left, TOPY - (k + 0.5) * RH, 0],
      end: [left + TW, TOPY - (k + 0.5) * RH, 0],
      color: C.muted,
      strokeWidth: 1,
    });
  });

  const vlines = Array.from({ length: 3 }, (_, i) => {
    const c = i + 1;
    const x = left + CW.slice(0, c).reduce((a, b) => a + b, 0);
    return new M.Line({
      start: [x, TOPY + RH / 2, 0],
      end: [x, TOPY - 6.5 * RH, 0],
      color: C.muted,
      strokeWidth: 1,
    });
  });

  const rowGroups = cells.map(row => new M.VGroup(...row));
  const columnCells = c => cells.map(row => row[c]);

  // All highlights are drawn from coordinates.
  function outline(width, height, center, color, sw = 3, opacity = 0.1) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth: sw,
    });
    r.setFill(color, opacity);
    r.moveTo(center);
    return r;
  }

  function colrect(c, color = C.cyan, op = 0.12) {
    return outline(
      CW[c] - 0.06,
      7 * RH - 0.06,
      [colx[c], TOPY - 3 * RH, 0],
      color,
      3,
      op
    );
  }

  function rowrect(r, color = C.amber) {
    return outline(
      TW - 0.06,
      RH - 0.06,
      [CX, rowy(r), 0],
      color,
      3,
      0.12
    );
  }

  function cellrect(r, c, color = C.amber) {
    return outline(
      CW[c] - 0.12,
      RH - 0.1,
      [colx[c], rowy(r), 0],
      color,
      3,
      0.18
    );
  }

  // ---------- Beat 0: introduce the table ----------
  await until(S(0));
  await play(
    new M.FadeIn(card),
    new M.FadeIn(hbar),
    new M.FadeIn(new M.VGroup(...heads)),
    new M.Create(new M.VGroup(...rules)),
    new M.Create(new M.VGroup(...vlines)),
    new M.LaggedStart(
      rowGroups.map(g => new M.FadeIn(g)),
      { lagRatio: 0.15, runTime: 1.6 }
    ),
    ...say('A CAFE TABLE: ROWS AND COLUMNS', C.cyan)
  );

  // ---------- Beat 1: one row is one order ----------
  let rr = rowrect(0, C.cyan);

  await until(S(1));
  await play(
    new M.FadeIn(rr),
    ...say('1 ROW = 1 ORDER', C.cyan)
  );

  for (let r = 1; r < 6; r++) {
    const next = rowrect(r, C.cyan);
    await play(
      new M.FadeOut(rr),
      new M.FadeIn(next)
    );
    rr = next;
  }

  // ---------- Beat 2: the owner's question ----------
  await until(S(2));
  await play(
    new M.FadeOut(rr),
    ...say('LONGEST WAIT? SHORTEST WAIT?', C.amber)
  );

  // ---------- Beat 3: one row contains one wait ----------
  const r1 = rowrect(0, C.amber);
  const c1 = cellrect(0, 3, C.amber);

  await until(S(3));
  await play(
    new M.FadeIn(r1),
    new M.FadeIn(c1),
    new M.Indicate(cells[0][3], { color: C.amber })
  );

  // ---------- Beat 4: a column goes top to bottom ----------
  const wcol = colrect(3, C.cyan);
  const ax = colx[3] + CW[3] / 2 + (P ? 0.12 : 0.25);
  const arrow = new M.VGroup(
    new M.Line({
      start: [ax, TOPY, 0],
      end: [ax, rowy(5), 0],
      color: C.cyan,
      strokeWidth: 4,
    }),
    new M.Line({
      start: [ax - 0.12, rowy(5) + 0.2, 0],
      end: [ax, rowy(5), 0],
      color: C.cyan,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [ax + 0.12, rowy(5) + 0.2, 0],
      end: [ax, rowy(5), 0],
      color: C.cyan,
      strokeWidth: 3,
    })
  );

  await until(S(4));
  await play(
    new M.FadeOut(r1),
    new M.FadeOut(c1),
    new M.Create(wcol),
    new M.Create(arrow),
    ...say('COLUMN: TOP TO BOTTOM', C.cyan)
  );

  // ---------- Beat 5: the heading ----------
  await until(S(5));
  await play(
    new M.FadeOut(arrow),
    new M.Indicate(heads[3], { color: C.amber }),
    ...say('HEADING: WAIT TIME', C.cyan)
  );

  // ---------- Beat 6: prepare to read the values ----------
  let cur = cellrect(0, 3, C.amber);

  await until(S(6));
  await play(
    new M.FadeIn(cur),
    ...fbox(['wait time (s)', ['...', C.muted]]),
    ...say('READ FROM THE TOP', C.cyan)
  );

  // ---------- Beats 7-12: six values ----------
  const got = [];

  for (let r = 0; r < 6; r++) {
    await until(S(7 + r));

    got.push(String(WAIT[r]));

    const next = r ? cellrect(r, 3, C.amber) : cur;
    const moves = r
      ? [new M.FadeOut(cur), new M.FadeIn(next)]
      : [];

    cur = next;

    await play(
      ...moves,
      new M.Indicate(cells[r][3], { color: C.amber }),
      ...fbox([
        ['wait time (s)', C.green],
        [got.join(' '), C.amber],
      ], C.amber)
    );
  }

  // ---------- Beats 13-14: one repeated question, six answers ----------
  await until(S(13));
  await play(
    new M.FadeOut(cur),
    ...say('SAME QUESTION: HOW LONG DID YOU WAIT?', C.amber)
  );

  await until(S(14));
  await play(
    new M.LaggedStart(
      columnCells(3).map(c => new M.Indicate(c, { color: C.amber })),
      { lagRatio: 0.2, runTime: 2.0 }
    ),
    ...say('6 ANSWERS, ONE BELOW THE OTHER', C.cyan)
  );

  // ---------- Beat 15: two answers match ----------
  const sx = new M.VGroup(
    cellrect(3, 3, C.violet),
    cellrect(5, 3, C.violet)
  );

  await until(S(15));
  await play(
    new M.FadeIn(sx),
    ...say('ANSWERS DIFFER: ONLY THE TWO 60s MATCH', C.violet)
  );

  // ---------- Beat 16: a column is a variable ----------
  const gcol = colrect(3, C.green, 0.10);

  await until(S(16));
  await play(
    new M.FadeOut(sx),
    new M.FadeOut(wcol),
    new M.FadeIn(gcol),
    ...say('THIS COLUMN = A VARIABLE', C.green)
  );

  // ---------- Beat 17: definition ----------
  await until(S(17));
  await play(
    ...fbox([
      ['variable: wait time', C.green],
      ['120 90 150 60 180 60', C.ink],
    ], C.green),
    ...say('ONE THING NOTED ABOUT EVERY ORDER', C.green)
  );

  // ---------- Beat 18: why it is called a variable ----------
  await until(S(18));
  await play(
    ...say('VARY = DIFFER FROM ORDER TO ORDER', C.green)
  );

  // ---------- Beat 19: one answer is a value ----------
  const v90 = cellrect(1, 3, C.amber);

  await until(S(19));
  await play(
    new M.FadeIn(v90),
    new M.Indicate(cells[1][3], { color: C.amber }),
    ...say('VALUE = ONE ANSWER', C.amber)
  );

  // ---------- Beat 20: value does not mean money ----------
  await until(S(20));
  await play(
    ...say('VALUE DOES NOT MEAN MONEY', C.muted)
  );

  // ---------- Beat 21: six values, one per order ----------
  await until(S(21));
  await play(
    new M.FadeOut(v90),
    ...fbox([
      ['variable: wait time', C.green],
      ['values: 6, one per order', C.ink],
    ], C.green)
  );

  // ---------- Beat 22: use only the wait time variable ----------
  await until(S(22));
  await play(
    ...say('ANSWER THE OWNER: USE WAIT TIME ONLY', C.amber)
  );

  // ---------- Beat 23: scan the wait time column ----------
  cur = cellrect(0, 3, C.amber);

  await until(S(23));
  await play(
    new M.FadeIn(cur),
    ...say('LOOK DOWN: FIND THE BIGGEST NUMBER', C.amber)
  );

  for (let r = 1; r < 6; r++) {
    const next = cellrect(r, 3, C.amber);
    await play(
      new M.FadeOut(cur),
      new M.FadeIn(next)
    );
    cur = next;
  }

  // ---------- Beat 24: longest wait ----------
  await until(S(24));
  await play(
    new M.Indicate(cells[4][3], { color: C.amber }),
    new M.Indicate(cells[4][0], { color: C.amber }),
    ...fbox([
      ['longest = 180 s', C.amber],
      ['(order 5)', C.ink],
    ], C.amber),
    ...say('LONGEST: 180 SECONDS', C.amber)
  );

  // ---------- Beat 25: shortest wait ----------
  const lo = new M.VGroup(
    cellrect(3, 3, C.cyan),
    cellrect(5, 3, C.cyan)
  );

  await until(S(25));
  await play(
    new M.FadeOut(cur),
    new M.FadeIn(lo),
    new M.Indicate(cells[3][0], { color: C.cyan }),
    new M.Indicate(cells[5][0], { color: C.cyan }),
    ...fbox([
      ['longest = 180 s', C.amber],
      ['  (order 5)', C.ink],
      ['shortest = 60 s', C.cyan],
      ['  (orders 4 and 6)', C.ink],
    ], C.amber),
    ...say('SHORTEST: 60 SECONDS', C.cyan)
  );

  // ---------- Beat 26: no other column needed ----------
  const others = [
    ...columnCells(0),
    ...columnCells(1),
    ...columnCells(2),
    ...heads.slice(0, 3),
  ];

  await until(S(26));
  await play(
    ...say('NO OTHER COLUMN NEEDED', C.muted)
  );
  others.forEach(o => o.setColor(C.muted));

  // ---------- Beat 27: what a variable is for ----------
  await until(S(27));
  await play(
    ...say('ONE FACT, EVERY ORDER, READY TO COMPARE', C.green)
  );

  // ---------- Beat 28: return to the other columns ----------
  await until(S(28));
  await play(
    new M.FadeOut(lo),
    ...say('OTHER COLUMNS: SAME IDEA', C.cyan)
  );

  others.forEach((o, i) => {
    if (i < 6) o.setColor(C.muted);
    else if (i < 12) o.setColor(C.ink);
    else if (i < 18) o.setColor(C.ink);
    else o.setColor(C.cyan);
  });

  cells[4][3].setColor(C.ink);
  cells[3][3].setColor(C.ink);
  cells[5][3].setColor(C.ink);

  // ---------- Beat 29: drink variable ----------
  const dcol = colrect(1, C.violet, 0.10);

  await until(S(29));
  await play(
    new M.FadeIn(dcol),
    ...fbox([
      ['variable: drink', C.violet],
      ['coffee, tea or juice', C.ink],
    ], C.violet),
    ...say('DRINK: ANSWERS ARE WORDS', C.violet)
  );

  // ---------- Beat 30: price variable ----------
  const pcol = colrect(2, C.amber, 0.10);

  await until(S(30));
  await play(
    new M.FadeIn(pcol),
    ...fbox([
      ['variable: price', C.amber],
      ['3, 4 or 5 dollars', C.ink],
    ], C.amber),
    ...say('PRICE: DOLLAR AMOUNTS', C.amber)
  );

  // ---------- Beat 31: three examples of variables ----------
  const gd = colrect(1, C.green, 0.10);
  const gp = colrect(2, C.green, 0.10);

  await until(S(31));
  await play(
    new M.FadeOut(dcol),
    new M.FadeOut(pcol),
    new M.FadeIn(gd),
    new M.FadeIn(gp),
    ...fbox([
      ['3 variables', C.green],
      ['drink, price, wait time', C.ink],
    ], C.green),
    ...say('DRINK, PRICE AND WAIT TIME', C.green)
  );

  // ---------- Beat 32: order number is a label ----------
  const ocol = colrect(0, C.muted, 0.08);

  await until(S(32));
  await play(
    new M.FadeIn(ocol),
    ...say('ORDER NUMBER = ONLY A NAME TAG', C.muted)
  );

  // ---------- Beat 33: introduce the trap ----------
  const tr = rowrect(0, C.pink);

  await until(S(33));
  await play(
    new M.FadeOut(gd),
    new M.FadeOut(gp),
    new M.FadeOut(gcol),
    new M.FadeOut(ocol),
    new M.FadeIn(tr),
    ...say('TRAP: READING ACROSS ONE ROW', C.pink)
  );

  // ---------- Beat 34: two different kinds of number ----------
  const tp = cellrect(0, 2, C.pink);
  const tw = cellrect(0, 3, C.pink);

  await until(S(34));
  await play(
    new M.FadeOut(tr),
    new M.FadeIn(tp),
    new M.FadeIn(tw),
    new M.Indicate(cells[0][2], { color: C.pink }),
    new M.Indicate(cells[0][3], { color: C.pink }),
    ...fbox([
      ['3 dollars', C.pink],
      ['120 seconds', C.pink],
    ], C.pink)
  );

  // ---------- Beat 35: meaningless sum ----------
  await until(S(35));
  await play(
    ...fbox([
      ['3 + 120 = 123', C.pink],
      ['123 ... what?', C.muted],
    ], C.pink),
    ...say('123 WHAT?', C.pink)
  );

  // ---------- Beat 36: dollars and seconds cannot be added ----------
  await until(S(36));
  await play(
    ...fbox([
      ['3 + 120 = 123', C.muted],
      ['dollars + seconds', C.pink],
      ['= means nothing', C.pink],
    ], C.pink),
    ...say('ACROSS A ROW: NO SENSE', C.pink)
  );

  await play(
    new M.Indicate(tp, { color: C.pink }),
    new M.Indicate(tw, { color: C.pink })
  );

  // ---------- Beat 37: compare like with like down columns ----------
  const a1 = colrect(2, C.green, 0.08);
  const a2 = colrect(3, C.green, 0.08);

  await until(S(37));
  await play(
    new M.FadeOut(tp),
    new M.FadeOut(tw),
    new M.FadeIn(a1),
    new M.FadeIn(a2),
    ...fbox([
      ['waits with waits', C.green],
      ['dollars with dollars', C.green],
    ], C.green),
    ...say('DOWN ONE COLUMN: CAN MAKE SENSE', C.green)
  );

  // ---------- Beat 38: next lesson ----------
  await until(S(38));
  await play(
    new M.FadeOut(a1),
    new M.FadeOut(a2),
    ...say('NEXT: WHICH COLUMNS CAN BE ADDED?', C.violet)
  );

  // ---------- Beat 39: recap ----------
  const fin = colrect(3, C.green, 0.12);

  await until(S(39));
  await play(
    new M.FadeIn(fin),
    ...fbox([
      ['variable = one column', C.green],
      ['values = its answers', C.ink],
    ], C.green),
    ...say('VARIABLE = ONE THING, EVERY ROW, ONE COLUMN', C.green)
  );
}
