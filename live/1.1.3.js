// lesson 1.1.3
// Categorical or numerical? Names, amounts, and what we can calculate.
// Live manim-web scene. Beat i = narration sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // The chapter's shared café data. Time is intentionally omitted in this lesson.
  const COLS = ['Order', 'Drink', 'Size', 'Price $', 'Wait s', 'Takeaway'];
  const DATA = [
    ['1', 'coffee', 'small', '3', '120', 'yes'],
    ['2', 'tea', 'medium', '4', '90', 'no'],
    ['3', 'coffee', 'large', '5', '150', 'yes'],
    ['4', 'juice', 'medium', '4', '60', 'no'],
    ['5', 'coffee', 'medium', '4', '180', 'yes'],
    ['6', 'tea', 'small', '3', '60', 'no'],
  ];

  const O = 0, DR = 1, SZ = 2, PR = 3, WT = 4, TK = 5;

  const GROUPC = {
    coffee: C.cyan,
    tea: C.green,
    juice: C.violet,
    yes: C.cyan,
    no: C.green,
  };

  // ---------- Layout ----------
  const CW = P
    ? [0.9, 1.3, 1.35, 1.1, 1.1, 1.35]
    : [1.0, 1.35, 1.4, 1.25, 1.2, 1.5];

  const RH = P ? 0.85 : 0.5;
  const FS = P ? 23 : 24;
  const TOP = P ? 2.65 : 1.42;
  const CX = P ? 0 : -2.75;

  const TW = CW.reduce((a, b) => a + b, 0);
  const MIDY = TOP - RH * 3.5;
  const x0 = CX - TW / 2;

  const xs = [];
  let x = x0;

  for (const w of CW) {
    xs.push(x + w / 2);
    x += w;
  }

  const ry = r => TOP - RH * (r + 0.5);

  // Formula box and title positions.
  const PILL = P ? [0, 4.0, 0] : [CX, 1.85, 0];
  const SIDE = P ? [0, -5.65, 0] : [4.35, -0.75, 0];
  const SIDEW = P ? FW - 1.0 : 5.0;

  const TAGY = TOP - RH * 7 - 0.34;

  const say = (s, color = C.cyan) => showA(s, color, PILL);

  function fit(t, maxWidth) {
    if (t.getWidth() > maxWidth) {
      t.scale(maxWidth / t.getWidth());
    }
    return t;
  }

  // ---------- Formula/explanation box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 22;
    const lh = P ? 0.43 : 0.42;

    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() + cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      )
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
    frame.moveTo(SIDE);

    const left = SIDE[0] - wd / 2 + 0.35;
    const top = SIDE[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const group = new M.VGroup(frame, ...texts);

    if (wd > SIDEW) {
      group.scale(SIDEW / wd);
    }

    const animations = [new M.FadeIn(group)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = group;
    return animations;
  }

  // ---------- Highlight helpers ----------
  function rect(width, height, center, color, sw = 3, opacity = 0.07) {
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

  function colbox(c, color = C.cyan, opacity = 0.07) {
    return rect(
      CW[c] - 0.05,
      RH * 7 - 0.04,
      [xs[c], MIDY, 0],
      color,
      3,
      opacity
    );
  }

  function rowbox(r, color = C.cyan) {
    return rect(
      TW - 0.04,
      RH - 0.04,
      [CX, ry(r + 1), 0],
      color,
      3,
      0.07
    );
  }

  function cellbox(r, c, color = C.cyan) {
    return rect(
      CW[c] - 0.1,
      RH - 0.08,
      [xs[c], ry(r + 1), 0],
      color,
      3,
      0.12
    );
  }

  // Only replace the current highlight; all boxes are coordinate-based.
  let currentMarks = [];

  function mark(...next) {
    const animations = [];

    if (currentMarks.length) {
      animations.push(
        new M.FadeOut(new M.VGroup(...currentMarks))
      );
    }

    next.forEach(m => animations.push(new M.Create(m)));
    currentMarks = next;

    return animations;
  }

  function cells(c) {
    return DATA.map(row => values[DATA.indexOf(row)][c]);
  }

  function paint(cs, color) {
    return cs.map(c => new M.Indicate(c, { color }));
  }

  // ---------- Column tags ----------
  const tags = {};

  function settag(c, label, color) {
    const y = TAGY - (c % 2 ? (P ? 0.6 : 0.5) : 0);

    const p = fit(
      pill(label, color, 20),
      P ? 1.9 : 2.15
    );

    const lim = FW / 2 - p.getWidth() / 2 - 0.35;
    const px = Math.max(-lim, Math.min(lim, xs[c]));
    p.moveTo([px, y, 0]);

    const stem = new M.Line({
      start: [xs[c], TOP - RH * 7 - 0.02, 0],
      end: [px, y + 0.15, 0],
      color,
      strokeWidth: 1.5,
    });

    const group = new M.VGroup(stem, p);
    const old = tags[c];
    tags[c] = group;

    const animations = [];

    if (old) animations.push(new M.FadeOut(old));
    animations.push(new M.FadeIn(group));

    return animations;
  }

  // ---------- Table construction ----------
  const card = new M.RoundedRectangle({
    width: TW + 0.24,
    height: RH * 7 + 0.24,
    cornerRadius: 0.16,
    color: C.muted,
    strokeWidth: 1.5,
  });

  card.setFill(C.card, 0.95);
  card.moveTo([CX, MIDY, 0]);

  const hdr = new M.Rectangle({
    width: TW,
    height: RH,
    color: C.cyan,
    strokeWidth: 0,
  });

  hdr.setFill(C.cyan, 0.16);
  hdr.moveTo([CX, ry(0), 0]);

  const hline = new M.Line({
    start: [x0, TOP - RH, 0],
    end: [x0 + TW, TOP - RH, 0],
    color: C.cyan,
    strokeWidth: 2,
  });

  const heads = COLS.map((name, c) => {
    const t = fit(T(name, P ? 20 : 21, C.cyan, true), CW[c] - 0.12);
    t.moveTo([xs[c], ry(0), 0]);
    return t;
  });

  const values = DATA.map((row, r) =>
    row.map((v, c) => {
      const t = fit(
        T(v, FS, C.ink, true),
        CW[c] - 0.12
      );
      t.moveTo([xs[c], ry(r + 1), 0]);
      return t;
    })
  );

  const rows = values.map(row => new M.VGroup(...row));

  const seps = Array.from({ length: 5 }, (_, i) => {
    const r = i + 2;
    return new M.Line({
      start: [x0, TOP - r * RH, 0],
      end: [x0 + TW, TOP - r * RH, 0],
      color: C.muted,
      strokeWidth: 1,
    });
  });

  const vlines = Array.from({ length: 5 }, (_, i) => {
    const c = i + 1;
    const vx = x0 + CW.slice(0, c).reduce((a, b) => a + b, 0);

    return new M.Line({
      start: [vx, TOP + RH / 2, 0],
      end: [vx, TOP - RH * 6.5, 0],
      color: C.muted,
      strokeWidth: 1,
    });
  });

  // ---------- 0-2: cafe, notebook and six orders ----------
  const kk = P ? 1.5 : 1.3;
  const cc0 = [CX, MIDY, 0];
  const cupBody = new M.RoundedRectangle({ width: 1.0 * kk, height: 0.95 * kk, cornerRadius: 0.1, color: C.amber, strokeWidth: 3 });
  cupBody.setFill(C.amber, 0.16);
  cupBody.moveTo(cc0);
  const cupHandle = new M.Arc({ radius: 0.26 * kk, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  cupHandle.moveTo([cc0[0] + 0.56 * kk, cc0[1] + 0.02, 0]);
  const cupSteam = [-0.22, 0, 0.22].map(dx => new M.Line({
    start: [cc0[0] + dx * kk, cc0[1] + 0.6 * kk, 0],
    end: [cc0[0] + (dx + 0.04) * kk, cc0[1] + 1.05 * kk, 0],
    color: C.muted, strokeWidth: 2.5 }));
  const cupLabel = T('café', 22, C.muted);
  cupLabel.moveTo([cc0[0], cc0[1] - 0.48 * kk - 0.4, 0]);
  const cupPic = new M.VGroup(cupBody, cupHandle, ...cupSteam, cupLabel);

  await until(S(0));
  await play(
    new M.FadeIn(card),
    new M.FadeIn(cupPic),
    ...say('A SMALL CAFE', C.cyan)
  );

  await until(S(1));
  await play(
    new M.FadeOut(cupPic),
    new M.FadeIn(hdr),
    new M.Create(hline),
    new M.LaggedStart(
      heads.map(h => new M.FadeIn(h)),
      { lagRatio: 0.1, runTime: 1.2 }
    ),
    ...say('THE NOTEBOOK', C.cyan)
  );

  await until(S(2));
  await play(
    new M.Create(new M.VGroup(...seps)),
    new M.Create(new M.VGroup(...vlines)),
    new M.LaggedStart(
      rows.map(r => new M.FadeIn(r)),
      { lagRatio: 0.3, runTime: 2.2 }
    ),
    ...say('6 ORDERS: 8:00 TO 9:00', C.cyan)
  );

  // ---------- 3-5: two questions ----------
  await until(S(3));
  await play(
    ...say('TWO QUESTIONS', C.amber)
  );

  await until(S(4));
  await play(
    ...fbox([
      ['Q1  how much money?', C.amber],
    ], C.amber)
  );

  await until(S(5));
  await play(
    ...fbox([
      ['Q1  how much money?', C.amber],
      ['Q2  which drink sells best?', C.pink],
    ], C.amber)
  );

  // ---------- 6-9: row, column, value ----------
  await until(S(6));
  await play(
    ...mark(rowbox(0)),
    ...say('ROW = ONE ORDER', C.cyan)
  );

  await until(S(7));
  await play(
    ...mark(colbox(DR)),
    ...say('COLUMN = ONE THING ABOUT EVERY ORDER', C.cyan)
  );

  await until(S(8));
  await play(
    ...mark(
      cellbox(1, DR),
      cellbox(1, PR)
    ),
    ...say('VALUE = ONE ENTRY', C.amber)
  );

  await until(S(9));
  await play(
    ...mark(),
    ...say('WHICH COLUMNS CAN ANSWER?', C.violet)
  );

  // ---------- 10-13: price, add it up ----------
  const pc = cells(PR);

  await until(S(10));
  await play(
    ...mark(colbox(PR, C.amber)),
    ...say('PRICE, IN DOLLARS', C.amber),
    new M.LaggedStart(
      pc.map(c => new M.Indicate(c, { color: C.amber })),
      { lagRatio: 0.35, runTime: 2.8 }
    )
  );

  await until(S(11));
  await play(
    ...fbox([
      ['3 + 4 + 5 = 12', C.amber],
    ], C.amber),
    ...say('FIRST THREE PRICES: 12 DOLLARS', C.amber)
  );

  await until(S(12));
  await play(
    ...fbox([
      ['3 + 4 + 5 = 12', C.ink],
      ['12 + 4 + 4 + 3 = 23', C.amber],
    ], C.amber),
    ...paint(pc.slice(3), C.amber)
  );

  await until(S(13));
  await play(
    ...fbox([
      ['3 + 4 + 5 = 12', C.ink],
      ['12 + 4 + 4 + 3 = 23', C.ink],
      ['total = 23 dollars', C.green],
    ], C.green),
    ...say('Q1 ANSWERED: 23 DOLLARS', C.green)
  );

  // ---------- 14-17: wait, longest, shortest and the gap ----------
  const wc = cells(WT);

  await until(S(14));
  await play(
    ...mark(colbox(WT)),
    ...fbox([['wait = how long', C.cyan], ['the customer waited,', C.ink], ['in seconds', C.ink]], C.cyan),
    ...say('WAIT, IN SECONDS', C.cyan)
  );

  await until(S(15));
  await play(
    ...mark(
      cellbox(4, WT, C.amber),
      cellbox(3, WT, C.green),
      cellbox(5, WT, C.green)
    ),
    ...say('LONGEST 180: SHORTEST 60', C.amber)
  );

  await until(S(16));
  await play(
    ...fbox([
      ['180 - 60 = 120', C.amber],
    ], C.amber)
  );

  await until(S(17));
  await play(
    ...fbox([
      ['180 - 60 = 120', C.ink],
      ['gap = 120 seconds', C.green],
    ], C.green),
    ...say('A GAP THAT MEANS SOMETHING', C.green)
  );

  // ---------- 18-22: drink, names and counting ----------
  const dc = cells(DR);

  await until(S(18));
  await play(
    ...mark(colbox(DR, C.pink)),
    ...say('DRINK: THE SECOND QUESTION', C.pink)
  );

  await until(S(19));
  await play(
    ...fbox([
      ['coffee + tea = ?', C.pink],
    ], C.pink)
  );

  await until(S(20));
  await play(
    ...say('NAMES, NOT AMOUNTS', C.pink)
  );

  await until(S(21));
  await play(
    ...paint(dc.filter((_, r) => DATA[r][DR] === 'coffee'), C.cyan),
    ...paint(dc.filter((_, r) => DATA[r][DR] === 'tea'), C.green),
    ...paint(dc.filter((_, r) => DATA[r][DR] === 'juice'), C.violet),
    ...say('COUNT EACH GROUP', C.green)
  );

  await until(S(22));
  await play(
    ...fbox([
      ['coffee   3', C.cyan],
      ['tea      2', C.green],
      ['juice    1', C.violet],
    ], C.green),
    ...say('Q2 ANSWERED: COFFEE SELLS BEST', C.green)
  );

  // ---------- 23-29: two kinds of columns ----------
  await until(S(23));
  await play(
    ...mark(),
    ...settag(DR, 'NAMES', C.pink),
    ...settag(PR, 'AMOUNTS', C.amber),
    ...settag(WT, 'AMOUNTS', C.amber),
    ...say('TWO KINDS: NAMES AND AMOUNTS', C.violet)
  );

  await until(S(24));
  await play(
    ...mark(colbox(DR, C.pink)),
    ...say('EACH DRINK PUTS ITS ORDER IN A GROUP', C.pink)
  );

  await until(S(25));
  await play(
    ...fbox([
      ['category = a group', C.pink],
      ['coffee · tea · juice', C.pink],
    ], C.pink),
    ...say('CATEGORY = A GROUP', C.pink)
  );

  await until(S(26));
  await play(
    ...say('VARIABLE = A COLUMN OF VALUES', C.cyan)
  );

  await until(S(27));
  await play(
    ...settag(DR, 'CATEGORICAL', C.pink),
    ...say('COLUMN OF NAMES = CATEGORICAL', C.pink)
  );

  await until(S(28));
  await play(
    ...paint(dc, C.ink),
    ...mark(
      colbox(PR, C.amber),
      colbox(WT, C.amber)
    ),
    ...fbox([
      ['price: how many dollars', C.amber],
      ['wait: how many seconds', C.amber],
    ], C.amber),
    ...say('AMOUNTS: DOLLARS AND SECONDS', C.amber)
  );

  await until(S(29));
  await play(
    ...settag(PR, 'NUMERICAL', C.amber),
    ...settag(WT, 'NUMERICAL', C.amber),
    ...say('COLUMN OF AMOUNTS = NUMERICAL', C.amber)
  );

  // ---------- 30-36: takeaway and size ----------
  await until(S(30));
  await play(
    ...mark(
      colbox(TK, C.muted),
      colbox(SZ, C.muted),
      colbox(O, C.muted)
    ),
    ...settag(TK, '?', C.muted),
    ...settag(SZ, '?', C.muted),
    ...settag(O, '?', C.muted),
    ...say('3 COLUMNS LEFT', C.muted)
  );

  const tc = cells(TK);

  await until(S(31));
  await play(
    ...mark(colbox(TK, C.pink)),
    ...say('TAKEAWAY: YES OR NO', C.pink)
  );

  await until(S(32));
  await play(
    ...paint(tc.filter((_, r) => DATA[r][TK] === 'yes'), C.cyan),
    ...paint(tc.filter((_, r) => DATA[r][TK] === 'no'), C.green),
    ...fbox([
      ['yes   3', C.cyan],
      ['no    3', C.green],
    ], C.pink),
    ...settag(TK, 'CATEGORICAL', C.pink)
  );

  const sizeCells = cells(SZ);

  await until(S(33));
  await play(
    ...paint(tc, C.ink),
    ...mark(colbox(SZ, C.pink)),
    ...fbox([
      ['small    2', C.ink],
      ['medium   3', C.ink],
      ['large    1', C.ink],
    ], C.pink),
    ...say('SIZE: SMALL, MEDIUM, LARGE', C.pink)
  );

  await until(S(34));
  await play(
    ...fbox([
      ['small + large = ?', C.pink],
    ], C.pink),
    ...settag(SZ, 'CATEGORICAL', C.pink),
    ...say('NAMES FOR GROUPS', C.pink)
  );

  await until(S(35));
  await play(
    ...fbox([
      ['small → medium → large', C.ink],
      ['how much bigger? no amount', C.pink],
    ], C.violet),
    ...say('A LINE-UP, BUT NO AMOUNT', C.violet)
  );

  await until(S(36));
  await play(
    ...say('FOR NOW: GROUPS · NEXT: A CLOSER LOOK', C.muted)
  );

  // ---------- 37-42: the trap of order numbers ----------
  const oc = cells(O);

  await until(S(37));
  await play(
    ...mark(colbox(O, C.pink)),
    ...say('A TRAP: THE ORDER NUMBER', C.pink),
    new M.LaggedStart(
      oc.map(c => new M.Indicate(c, { color: C.pink })),
      { lagRatio: 0.2, runTime: 1.5 }
    )
  );

  await until(S(38));
  await play(
    ...fbox([
      ['1 + 2 + 3 + 4 + 5 + 6', C.ink],
      ['= 21', C.amber],
    ], C.amber)
  );

  await until(S(39));
  await play(
    ...fbox([
      ['1 + 2 + 3 + 4 + 5 + 6', C.ink],
      ['= 21 what?', C.pink],
    ], C.pink),
    ...say('21 WHAT? IT MEANS NOTHING', C.pink)
  );

  await until(S(40));
  await play(
    ...say('NAME TAGS, LIKE A TICKET NUMBER', C.pink),
    new M.LaggedStart(
      oc.map(c => new M.Indicate(c, { color: C.pink })),
      { lagRatio: 0.2, runTime: 1.6 }
    )
  );

  await until(S(41));
  await play(
    ...fbox([
      ['ticket 6 = a later turn', C.ink],
      ['not more coffee, not more money', C.pink],
    ], C.pink),
    ...say('BIGGER NUMBER = LATER TURN', C.pink)
  );

  await until(S(42));
  await play(
    ...settag(O, 'NAME TAG', C.pink),
    ...say('NUMBERS ARE NOT ALWAYS AMOUNTS', C.amber)
  );

  // ---------- 43-47: the test for any column ----------
  await until(S(43));
  await play(
    ...paint(oc, C.ink),
    ...mark(),
    ...say('A TEST FOR ANY COLUMN', C.green)
  );

  const question = [
    'does each value measure',
    'how much of something?',
  ];

  await until(S(44));
  await play(
    ...fbox(question, C.green)
  );

  await until(S(45));
  await play(
    ...fbox([
      ...question,
      ['yes → NUMERICAL', C.amber],
    ], C.green)
  );

  await until(S(46));
  await play(
    ...fbox([
      ...question,
      ['yes → NUMERICAL', C.amber],
      ['names a group → CATEGORICAL', C.pink],
    ], C.green)
  );

  await until(S(47));
  await play(
    ...mark(
      colbox(PR, C.green),
      colbox(O, C.pink)
    ),
    ...say('PRICE: YES · ORDER NUMBER: NO', C.green)
  );

  // ---------- 48-51: why it matters and recap ----------
  await until(S(48));
  await play(
    ...mark(),
    ...say('WHY IT MATTERS', C.violet)
  );

  await until(S(49));
  await play(
    ...mark(colbox(PR, C.amber)),
    ...fbox([
      ['money? → a total', C.amber],
      ['numerical: price', C.ink],
    ], C.amber)
  );

  await until(S(50));
  await play(
    ...mark(
      colbox(PR, C.amber),
      colbox(DR, C.pink)
    ),
    ...fbox([
      ['money? → a total', C.amber],
      ['  numerical: price', C.ink],
      ['best drink? → counts', C.pink],
      ['  categorical: drink', C.ink],
    ], C.violet)
  );

  await until(S(51));
  await play(
    ...mark(),
    ...say('NAMES: COUNT · AMOUNTS: ADD', C.green)
  );
}
