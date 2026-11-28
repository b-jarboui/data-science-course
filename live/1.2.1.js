// lesson 1.2.1
// Frequency tables: turning a list into neat counts.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const WAITS = [3, 1, 4, 2, 3, 6, 2, 3];
  const MINUTES = [1, 2, 3, 4, 5, 6];
  const COUNTS = { 1: 1, 2: 2, 3: 3, 4: 1, 5: 0, 6: 1 };

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.7, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.9, 0] : [4.25, -0.25, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box, following the approved lesson 1.2.4.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 18;
    const lh = P ? 0.40 : 0.36;

    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.2;

    if (wd > maxw) g.scale(maxw / wd);

    const animations = [new M.FadeIn(g)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = g;
    return animations;
  }

  // Table geometry: full-width on phone, left-hand side on laptop.
  const tableX = P ? 0 : -2.65;
  const tableWidth = P ? 6.8 : 5.5;
  const headY = P ? 0.55 : 0.9;
  const pitch = P ? 0.85 : 0.43;
  const colOffset = P ? 2.2 : 1.78;

  const colX = col => tableX + (col - 1) * colOffset;
  const rowY = minute => headY - (minute + 0.12) * pitch;
  const cell = (col, minute) => [colX(col), rowY(minute), 0];

  // ------------------------------------------------------------
  // 0-8: Introduce the café and the original list.
  // ------------------------------------------------------------

  // 0. A quiet morning at the café.
  const cup = new M.VGroup(
    new M.Arc({
      radius: 0.48,
      startAngle: Math.PI,
      angle: Math.PI,
      color: C.cyan
    }),
    new M.Line({
      start: [-0.48, 0, 0],
      end: [0.48, 0, 0],
      color: C.cyan
    }),
    new M.Arc({
      radius: 0.15,
      startAngle: -Math.PI / 2,
      angle: Math.PI,
      color: C.cyan
    }).moveTo([0.62, -0.15, 0]),
    new M.Line({
      start: [-0.65, -0.58, 0],
      end: [0.65, -0.58, 0],
      color: C.muted
    })
  );

  cup.scale(P ? 2.6 : 1.8);
  cup.moveTo([0, P ? -2.3 : -0.2, 0]);

  await until(S(0));
  await play(
    new M.Create(cup),
    ...say('CAFÉ · MORNING SHIFT')
  );

  // Eight people and their recorded waits.
  const people = [];
  const slips = [];

  const personSpacing = P ? 1.5 : 1.1;
  const ps = P ? 1.7 : 1;

  for (let i = 0; i < 8; i++) {
    const x = P ? ((i % 4) - 1.5) * personSpacing : (i - 3.5) * personSpacing;
    const personY = P ? 0.3 - Math.floor(i / 4) * 3.6 : 0.35;

    const head = new M.Circle({
      radius: 0.13 * ps,
      color: C.ink
    });
    head.setFill(C.ink, 1);
    head.moveTo([x, personY + 0.36 * ps, 0]);

    const body = new M.Arc({
      radius: 0.24 * ps,
      startAngle: 0,
      angle: Math.PI,
      color: C.ink
    });
    body.setFill(C.ink, 1);
    body.moveTo([x, personY, 0]);

    people.push(new M.VGroup(head, body));

    const slip = T(String(WAITS[i]), P ? 30 : 25, C.cyan, true);
    slip.moveTo([x, personY - 0.55 * ps, 0]);
    slips.push(slip);
  }

  const queue = new M.VGroup(...people, ...slips);

  // 1. Eight customers.
  await until(S(1));
  await play(
    new M.FadeOut(cup),
    new M.LaggedStart(
      people.map(p => new M.FadeIn(p)),
      { lagRatio: 0.12, runTime: 1.3 }
    ),
    ...say('8 CUSTOMERS · WHOLE MINUTES')
  );

  // 2. The owner's question.
  await until(S(2));
  await play(
    ...say('WHICH WAIT HAPPENED MOST OFTEN?', C.amber)
  );

  // 3. First four recorded waits.
  await until(S(3));
  await play(
    new M.LaggedStart(
      slips.slice(0, 4).map(n => new M.FadeIn(n)),
      { lagRatio: 0.55, runTime: 2.0 }
    ),
    ...say('WAITS IN MINUTES · ARRIVAL ORDER')
  );

  // 4. Last four recorded waits.
  await until(S(4));
  await play(
    new M.LaggedStart(
      slips.slice(4).map(n => new M.FadeIn(n)),
      { lagRatio: 0.55, runTime: 1.8 }
    )
  );

  // 5. Introduce the word data.
  await until(S(5));
  await play(
    ...say('DATA = THE 8 WAITS WE COLLECTED'),
    new M.LaggedStart(
      slips.map(n => new M.Indicate(n, { color: C.cyan })),
      { lagRatio: 0.12, runTime: 1.5 }
    )
  );

  // 6. The original list looks jumbled.
  await until(S(6));
  await play(
    ...say('READ FROM LEFT TO RIGHT', C.muted),
    new M.LaggedStart(
      slips.map(n => new M.Indicate(n, { color: C.amber })),
      { lagRatio: 0.28, runTime: 1.8 }
    )
  );

  // 7. Imagine a much larger list.
  const manyDots = [];

  const manyDX = P ? 0.16 : 0.14;
  const manyDY = P ? 0.3 : 0.12;

  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 40; c++) {
      const d = new M.Dot({
        point: [
          (c - 19.5) * manyDX,
          (P ? -0.5 : 0.0) - (r - 9.5) * manyDY,
          0
        ],
        radius: P ? 0.055 : 0.027,
        color: C.muted
      });
      d.setFill(C.muted, 0.9);
      manyDots.push(d);
    }
  }

  const many = new M.VGroup(...manyDots);

  await until(S(7));
  await play(
    new M.FadeOut(queue),
    new M.FadeIn(many),
    ...say('IMAGINE 800 CUSTOMERS', C.amber)
  );

  // 8. Return to the list and highlight repeated values.
  await until(S(8));
  await play(
    new M.FadeOut(many),
    new M.FadeIn(queue),
    ...say('NOTICE THE REPEATS'),
    new M.LaggedStart(
      [0, 4, 7].map(i => new M.Indicate(slips[i], { color: C.amber })),
      { lagRatio: 0.35, runTime: 1.5 }
    )
  );

  // ------------------------------------------------------------
  // 9-12: Sorting and counting matching values.
  // ------------------------------------------------------------

  // 9. Coins demonstrate sorting by size.
  const cs = P ? 1.4 : 1;
  const sizes = [0.21, 0.34, 0.21, 0.27, 0.34, 0.21];

  const coins = sizes.map((r, i) => {
    const coin = new M.Circle({
      radius: r * cs,
      color: C.amber,
      strokeWidth: 2
    });
    coin.setFill(C.amber, 0.27);
    coin.moveTo([
      (i - 2.5) * (P ? 1.15 : 0.95),
      (P ? -1.2 : 0) + (P ? 0.5 : 0.25) * (-1) ** i,
      0
    ]);
    return coin;
  });

  const uniqueSizes = [...new Set(sizes)].sort((a, b) => a - b);

  const sortCoins = coins.map((coin, i) => {
    const r = sizes[i];
    const group = uniqueSizes.indexOf(r);
    const below = sizes.slice(0, i).filter(v => v === r).length;

    const target = new M.Circle({
      radius: r * cs,
      color: C.amber,
      strokeWidth: 2
    });
    target.setFill(C.amber, 0.27);
    target.moveTo([
      (group - 1) * (P ? 2.1 : 1.65),
      (P ? -3.4 : -0.8) + below * (2 * r * cs + 0.1),
      0
    ]);

    return new M.Transform(coin, target);
  });

  await until(S(9));
  await play(
    new M.FadeOut(queue),
    new M.LaggedStart(
      coins.map(c => new M.FadeIn(c)),
      { lagRatio: 0.12, runTime: 0.8 }
    ),
    ...say('SORT COINS BY SIZE', C.amber)
  );

  await play(
    new M.LaggedStart(
      sortCoins,
      { lagRatio: 0.12, runTime: 1.4 }
    )
  );

  // 10. Group identical waits.
  const present = [1, 2, 3, 4, 6];
  const groupDX = P ? 1.3 : 1.6;
  const gy0 = P ? -1.6 : -0.7, gdy = P ? 1.0 : 0.52, ty = P ? -3.6 : -1.65, ry = P ? -2.8 : -1.22;

  const groupX = v => (present.indexOf(v) - 2) * groupDX;

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...coins)),
    new M.FadeIn(new M.VGroup(...slips)),
    ...say('GROUP MATCHING WAITS')
  );

  const groupMoves = slips.map((n, i) => {
    const v = WAITS[i];
    const below = WAITS.slice(0, i).filter(x => x === v).length;

    const target = T(String(v), P ? 32 : 25, C.cyan, true);
    target.moveTo([
      groupX(v),
      gy0 + below * gdy,
      0
    ]);

    return new M.Transform(n, target);
  });

  await play(
    new M.LaggedStart(
      groupMoves,
      { lagRatio: 0.08, runTime: 1.5 }
    )
  );

  // 11. Count each group: this is its frequency.
  const totals = present.map(v => {
    const t = T(String(COUNTS[v]), P ? 34 : 27, C.amber, true);
    t.moveTo([groupX(v), ty, 0]);
    return t;
  });

  const rule = new M.Line({
    start: [groupX(1) - 0.4, ry, 0],
    end: [groupX(6) + 0.4, ry, 0],
    color: C.muted,
    strokeWidth: 2
  });

  await until(S(11));
  await play(
    new M.Create(rule),
    new M.FadeIn(new M.VGroup(...totals)),
    ...say('GROUP COUNT = FREQUENCY', C.amber)
  );

  // 12. Frequency means how many times something happens.
  await until(S(12));
  await play(
    ...say('FREQUENCY = HOW MANY TIMES IT HAPPENS', C.amber),
    new M.LaggedStart(
      [
        new M.Indicate(slips[0], { color: C.amber }),
        new M.Indicate(slips[4], { color: C.amber }),
        new M.Indicate(slips[7], { color: C.amber }),
        new M.Indicate(totals[present.indexOf(3)], { color: C.amber })
      ],
      { lagRatio: 0.5, runTime: 2.2 }
    )
  );

  // ------------------------------------------------------------
  // 13-16: Build the frequency table.
  // ------------------------------------------------------------

  const headers = ['Minutes', 'Tallies', 'Frequency'].map((name, col) => {
    const t = T(name, P ? 18 : 18, C.muted, true);
    t.moveTo([colX(col), headY, 0]);
    return t;
  });

  const labels = {};
  const counts = {};
  const marks = {};

  for (const v of MINUTES) {
    labels[v] = T(String(v), P ? 28 : 24, C.cyan, true);
    labels[v].moveTo(cell(0, v));

    counts[v] = T(String(COUNTS[v]), P ? 28 : 24, C.amber, true);
    counts[v].moveTo(cell(2, v));

    marks[v] = [];
  }

  const rules = [];

  for (let v = 1; v <= 7; v++) {
    rules.push(new M.Line({
      start: [tableX - tableWidth / 2, rowY(v) + pitch * 0.5, 0],
      end: [tableX + tableWidth / 2, rowY(v) + pitch * 0.5, 0],
      color: C.grid,
      strokeWidth: 1.5
    }));
  }

  // 13. Introduce the table with one example row.
  const groupedSlips = new M.VGroup(...slips);
  const totalGroup = new M.VGroup(...totals);

  await until(S(13));
  await play(
    new M.FadeOut(groupedSlips),
    new M.FadeOut(rule),
    new M.FadeOut(totalGroup),
    new M.FadeIn(headers[0]),
    new M.FadeIn(headers[2]),
    ...rules.map(r => new M.FadeIn(r)),
    ...MINUTES.map(v => new M.FadeIn(labels[v])),
    ...MINUTES.map(v => new M.FadeIn(counts[v])),
    ...say('A FREQUENCY TABLE')
  );

  // 14. Find the shortest and longest waits.
  const source = WAITS.map((v, i) => {
    const t = T(String(v), P ? 24 : 24, C.cyan, true);

    if (P) {
      t.moveTo([(i - 3.5) * 0.8, 1.55, 0]);
    } else {
      t.moveTo([
        4.4 + ((i % 4) - 1.5) * 0.64,
        0.48 - Math.floor(i / 4) * 0.5,
        0
      ]);
    }

    return t;
  });

  const sourceTitle = T('Arrival order · minutes', P ? 16 : 18, C.muted);
  sourceTitle.moveTo(P ? [0, 2.1, 0] : [4.4, 1.15, 0]);

  const sourceGroup = new M.VGroup(...source);

  await until(S(14));
  await play(
    ...rules.map(r => new M.FadeOut(r)),
    ...MINUTES.map(v => new M.FadeOut(labels[v])),
    ...MINUTES.map(v => new M.FadeOut(counts[v])),
    new M.FadeIn(sourceTitle),
    new M.FadeIn(sourceGroup),
    ...say('SHORTEST 1 MIN · LONGEST 6 MIN'),
    new M.Indicate(source[1], { color: C.amber }),
    new M.Indicate(source[5], { color: C.amber })
  );

  // 15. One row for every whole minute from one to six.
  await until(S(15));
  await play(
    new M.LaggedStart(
      rules.map(r => new M.FadeIn(r)),
      { lagRatio: 0.1, runTime: 1.0 }
    ),
    new M.LaggedStart(
      MINUTES.map(v => new M.FadeIn(labels[v])),
      { lagRatio: 0.16, runTime: 1.2 }
    ),
    ...say('ONE ROW FOR EACH WHOLE MINUTE')
  );

  // 16. Introduce the tally column.
  await until(S(16));
  await play(
    new M.FadeIn(headers[1]),
    ...say('ONE CUSTOMER ADDS ONE TALLY')
  );

  // ------------------------------------------------------------
  // 17-21: Add tally marks in the original arrival order.
  // ------------------------------------------------------------

  function rowFrame(v) {
    const frame = new M.RoundedRectangle({
      width: P ? 1.8 : 1.3,
      height: pitch * 0.94,
      cornerRadius: 0.10,
      color: C.amber,
      strokeWidth: 2
    });
    frame.moveTo(cell(1, v));
    return frame;
  }

  let focusFrames = [];

  function addMarks(indices) {
    const rowValues = [...new Set(indices.map(i => WAITS[i]))];
    const nextFrames = rowValues.map(rowFrame);

    const animations = [];

    if (focusFrames.length) {
      animations.push(...focusFrames.map(f => new M.FadeOut(f)));
    }

    focusFrames = nextFrames;

    animations.push(...nextFrames.map(f => new M.FadeIn(f)));

    const tickAnimations = [];

    for (const i of indices) {
      const v = WAITS[i];
      const count = marks[v].length;

      const x = colX(1) - 0.22 + count * 0.22;

      const tick = new M.Line({
        start: [x, rowY(v) - 0.15 * (P ? 1.5 : 1), 0],
        end: [x + 0.055, rowY(v) + 0.15 * (P ? 1.5 : 1), 0],
        color: C.cyan,
        strokeWidth: 4
      });

      marks[v].push(tick);
      tickAnimations.push(new M.TransformFromCopy(source[i], tick));
    }

    animations.push(
      new M.LaggedStart(
        tickAnimations,
        {
          lagRatio: 0.18,
          runTime: Math.max(0.6, indices.length * 0.5)
        }
      )
    );

    return animations;
  }

  // 17. First three-minute wait.
  await until(S(17));
  await play(
    ...addMarks([0]),
    ...say('3 MINUTES · FIRST TALLY')
  );
  source[0].setColor(C.muted);

  // 18. One, four and two minutes.
  await until(S(18));
  await play(
    ...addMarks([1, 2, 3]),
    ...say('ONE TALLY FOR EACH CUSTOMER')
  );
  [1, 2, 3].forEach(i => source[i].setColor(C.muted));

  // 19. Another three-minute wait.
  await until(S(19));
  await play(
    ...addMarks([4]),
    ...say('3 MINUTES · SECOND TALLY')
  );
  source[4].setColor(C.muted);

  // 20. Six minutes and a second two-minute wait.
  await until(S(20));
  await play(
    ...addMarks([5, 6]),
    ...say('6 MINUTES · AND 2 MINUTES AGAIN')
  );
  [5, 6].forEach(i => source[i].setColor(C.muted));

  // 21. Final three-minute wait.
  await until(S(21));
  await play(
    ...addMarks([7]),
    ...say('3 MINUTES · THIRD TALLY')
  );
  source[7].setColor(C.muted);

  // ------------------------------------------------------------
  // 22-29: Convert the tally marks into frequencies.
  // ------------------------------------------------------------

  // 22. Focus on reading the frequency column.
  await until(S(22));
  await play(
    new M.FadeOut(sourceGroup),
    new M.FadeOut(sourceTitle),
    ...focusFrames.map(f => new M.FadeOut(f)),
    new M.Indicate(headers[2], { color: C.amber }),
    ...say('READ THE TALLIES AS COUNTS', C.amber)
  );

  focusFrames = [];

  function focusRows(values) {
    const next = values.map(rowFrame);
    const animations = [];

    if (focusFrames.length) {
      animations.push(...focusFrames.map(f => new M.FadeOut(f)));
    }

    focusFrames = next;
    animations.push(...next.map(f => new M.FadeIn(f)));

    return animations;
  }

  // 23. One-minute row: one customer.
  await until(S(23));
  await play(
    ...focusRows([1]),
    new M.FadeIn(counts[1]),
    new M.Indicate(marks[1][0], { color: C.amber }),
    ...say('1 MINUTE · 1 CUSTOMER', C.amber)
  );

  // 24. Two-minute and three-minute rows.
  await until(S(24));
  await play(
    ...focusRows([2, 3]),
    new M.FadeIn(counts[2]),
    new M.FadeIn(counts[3]),
    new M.LaggedStart(
      [
        ...marks[2].map(m => new M.Indicate(m, { color: C.amber })),
        ...marks[3].map(m => new M.Indicate(m, { color: C.amber }))
      ],
      { lagRatio: 0.12, runTime: 1.4 }
    ),
    ...say('2 MIN · 2 CUSTOMERS   |   3 MIN · 3 CUSTOMERS', C.amber)
  );

  // 25. Four-minute row.
  await until(S(25));
  await play(
    ...focusRows([4]),
    new M.FadeIn(counts[4]),
    new M.Indicate(marks[4][0], { color: C.amber }),
    ...say('4 MINUTES · 1 CUSTOMER', C.amber)
  );

  // 26. Pause at the empty five-minute row.
  await until(S(26));
  await play(
    ...focusRows([5]),
    ...say('5 MINUTES · HOW MANY MARKS?', C.amber)
  );

  // 27. No marks means zero.
  await until(S(27));
  await play(
    new M.FadeIn(counts[5]),
    ...say('NO MARKS = ZERO CUSTOMERS')
  );

  // 28. Keep the optional zero row.
  await until(S(28));
  await play(
    new M.Indicate(labels[5], { color: C.amber }),
    new M.Indicate(counts[5], { color: C.amber }),
    ...say('THE ZERO ROW SHOWS THE GAP', C.amber)
  );

  // 29. Six-minute row.
  await until(S(29));
  await play(
    ...focusRows([6]),
    new M.FadeIn(counts[6]),
    new M.Indicate(marks[6][0], { color: C.amber }),
    ...say('6 MINUTES · 1 CUSTOMER')
  );

  // ------------------------------------------------------------
  // 30-38: Check the total and answer the owner's question.
  // ------------------------------------------------------------

  // 30. Check for missed or double-counted customers.
  await until(S(30));
  await play(
    ...focusFrames.map(f => new M.FadeOut(f)),
    ...say('DID WE COUNT ALL 8 CUSTOMERS?', C.amber),
    ...fbox(['8 customers arrived'], C.amber)
  );

  focusFrames = [];

  // 31. First three frequencies add to six.
  await until(S(31));
  await play(
    ...fbox(['1 + 2 + 3 = 6'], C.amber),
    new M.LaggedStart(
      [1, 2, 3].map(v => new M.Indicate(counts[v], { color: C.amber })),
      { lagRatio: 0.4, runTime: 1.5 }
    )
  );

  // 32. Add the remaining frequencies.
  await until(S(32));
  await play(
    ...fbox(['6 + 1 + 0 + 1 = 8'], C.amber),
    new M.LaggedStart(
      [4, 5, 6].map(v => new M.Indicate(counts[v], { color: C.amber })),
      { lagRatio: 0.4, runTime: 1.5 }
    )
  );

  // 33. Explain the sum.
  await until(S(33));
  await play(
    ...say('SUM = THE RESULT OF ADDING', C.green),
    ...fbox([
      ['Sum of counts = 8', C.green],
      ['Customers     = 8', C.ink]
    ], C.green)
  );

  // 34. Everyone is accounted for.
  await until(S(34));
  await play(
    ...say('ALL 8 ACCOUNTED FOR', C.green)
  );

  // 35. The general rule.
  await until(S(35));
  await play(
    ...fbox([
      ['Sum of frequencies', C.green],
      ['= total customers', C.green]
    ], C.green)
  );

  // 36. Return to the owner's original question.
  await until(S(36));
  await play(
    new M.FadeOut(boxNow),
    new M.Indicate(headers[2], { color: C.amber }),
    ...say('WHICH WAIT HAPPENED MOST?', C.amber)
  );

  boxNow = null;

  // 37. Three minutes has the highest frequency.
  await until(S(37));
  await play(
    ...focusRows([3]),
    ...fbox([
      ['3 minutes', C.amber],
      ['3 of 8 customers', C.ink]
    ], C.amber)
  );

  // 38. Summarise what the table does.
  await until(S(38));
  await play(
    ...focusFrames.map(f => new M.FadeOut(f)),
    ...say('ONE SHIFT · ONE ROW PER WAIT'),
    ...fbox([
      ['8 waits in the list', C.ink],
      ['8 customers counted', C.green]
    ], C.green)
  );

  focusFrames = [];

  // ------------------------------------------------------------
  // 39-45: Compare different-sized groups.
  // ------------------------------------------------------------

  // Group the completed table only for removal and restoration.
  const tableParts = new M.VGroup(
    ...headers,
    ...rules,
    ...Object.values(labels),
    ...Object.values(counts),
    ...Object.values(marks).flat()
  );

  // Comparison layout: side by side on laptop, stacked on phone.
  const panelCenters = P
    ? [[0, 0.7, 0], [0, -3.7, 0]]
    : [[-3.25, -0.2, 0], [3.25, -0.2, 0]];

  function crowd(i, n, chosen) {
    const center = panelCenters[i];
    const cols = n === 8 ? 4 : 10;
    const rows = n / cols;

    const dx = n === 8
      ? (P ? 0.55 : 0.3)
      : (P ? 0.34 : 0.18);

    const dy = n === 8
      ? (P ? 0.5 : 0.25)
      : (P ? 0.3 : 0.17);

    const dots = [];

    for (let j = 0; j < n; j++) {
      const row = Math.floor(j / cols);
      const col = j % cols;

      const color = j < chosen ? C.cyan : C.muted;

      const d = new M.Dot({
        point: [
          center[0] + (col - (cols - 1) / 2) * dx,
          center[1] + ((rows - 1) / 2 - row) * dy,
          0
        ],
        radius: P ? 0.1 : 0.06,
        color
      });

      d.setFill(color, 1);
      dots.push(d);
    }

    const dotsGroup = new M.VGroup(...dots);

    const title = T(
      i === 0 ? 'Our café' : 'Across town',
      P ? 24 : 22,
      C.ink,
      true
    );

    title.moveTo([
      center[0],
      center[1] + (P ? (n === 8 ? 1.1 : 1.9) : 1.05),
      0
    ]);

    const caption = T(
      `${chosen} of ${n} waited 3 min`,
      P ? 20 : 18,
      C.cyan,
      true
    );

    caption.moveTo([
      center[0],
      center[1] - (P ? (n === 8 ? 1.1 : 1.9) : 1.25),
      0
    ]);

    const group = new M.VGroup(title, dotsGroup, caption);

    return {
      group,
      title,
      dots,
      dotsGroup,
      caption
    };
  }

  const ours = crowd(0, 8, 3);
  const theirs = crowd(1, 100, 4);

  // 39. Introduce the comparison.
  await until(S(39));
  await play(
    new M.FadeOut(tableParts),
    new M.FadeOut(boxNow),
    new M.FadeIn(ours.group),
    ...say('COMPARING DIFFERENT-SIZED SHIFTS', C.amber)
  );

  boxNow = null;

  // 40. The café across town has one hundred customers.
  await until(S(40));
  await play(
    new M.FadeIn(theirs.group),
    ...say('ACROSS TOWN · 100 CUSTOMERS', C.amber)
  );

  // 41. Four versus three: compare the actual headcounts.
  await until(S(41));
  await play(
    ...say('3-MINUTE WAITS · 4 ACROSS TOWN, 3 HERE', C.amber),
    new M.LaggedStart(
      [
        ...theirs.dots.slice(0, 4).map(d =>
          new M.Indicate(d, { color: C.amber })
        ),
        ...ours.dots.slice(0, 3).map(d =>
          new M.Indicate(d, { color: C.amber })
        )
      ],
      { lagRatio: 0.1, runTime: 1.5 }
    )
  );

  // Build proportional bars. The filled length represents the share.
  function shareBar(center, fraction) {
    const width = P ? 5.6 : 4.6;
    const height = 0.48;

    const outline = new M.Rectangle({
      width,
      height,
      color: C.muted,
      strokeWidth: 2
    });
    outline.moveTo(center);

    const fillWidth = width * fraction;

    const fill = new M.Rectangle({
      width: fillWidth,
      height: height * 0.82,
      color: C.cyan,
      strokeWidth: 0
    });

    fill.setFill(C.cyan, 0.9);

    fill.moveTo([
      center[0] - width / 2 + fillWidth / 2,
      center[1],
      0
    ]);

    return {
      outline,
      fill,
      group: new M.VGroup(outline, fill)
    };
  }

  const bars = [
    shareBar(panelCenters[0], 3 / 8),
    shareBar(panelCenters[1], 4 / 100)
  ];

  // 42. Compare the shares, not just the counts.
  await until(S(42));
  await play(
    new M.FadeOut(ours.dotsGroup),
    new M.FadeOut(theirs.dotsGroup),
    new M.FadeIn(bars[0].group),
    new M.FadeIn(bars[1].group),
    ...say('WHICH SHARE IS BIGGER?', C.amber)
  );

  // 43. Three of eight is nearly half.
  const mid = bars[0].outline.getCenter();

  const half = new M.DashedLine({
    start: [mid[0], mid[1] - 0.42, 0],
    end: [mid[0], mid[1] + 0.42, 0],
    color: C.amber
  });

  const halfWord = T('half', P ? 20 : 18, C.amber, true);
  halfWord.moveTo([mid[0], mid[1] + 0.58, 0]);

  await until(S(43));
  await play(
    new M.Create(half),
    new M.FadeIn(halfWord),
    ...say('HERE · 3 OF 8', C.amber)
  );

  // 44. Four of one hundred is a tiny handful.
  await until(S(44));
  await play(
    new M.Indicate(bars[1].fill, { color: C.amber }),
    ...say('ACROSS TOWN · 4 OF 100', C.amber)
  );

  // 45. Preview the next lesson.
  await until(S(45));
  await play(
    ...say('NEXT · FROM COUNTS TO SHARES', C.green),
    new M.Indicate(ours.caption, { color: C.green }),
    new M.Indicate(theirs.caption, { color: C.green })
  );

  // ------------------------------------------------------------
  // 46: Final recap.
  // ------------------------------------------------------------

  const comparison = new M.VGroup(
    ours.title,
    ours.caption,
    theirs.title,
    theirs.caption,
    bars[0].group,
    bars[1].group,
    half,
    halfWord
  );

  await until(S(46));
  await play(
    new M.FadeOut(comparison),
    new M.FadeIn(tableParts),
    ...say('FREQUENCY TABLE', C.cyan),
    ...fbox([
      ['Each row: one wait', C.ink],
      ['Frequency: how many', C.amber]
    ], C.cyan)
  );
}
