export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.55, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.7, 0] : [4.35, -0.3, 0];
  const SPC = P ? 0.95 : 1.0;
  const CS = P ? 0.82 : 0.9;
  const CUPY = P ? -0.2 : -0.15;
  const GAP = 0.9;
  const CELL = P ? 0.3 : 0.3;
  const GCELL = CELL;
  const GY = P ? -0.9 : -0.55;
  const UX = P ? -1.65 : -4.45;
  const TX = P ? 1.65 : 2.0;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const cupX = k => CX + (k - 2.5) * SPC;
  const px = (j, gap = 0) =>
    CX + (j - 2.5) * SPC + (j >= 3 ? gap / 2 : -gap / 2);

  const TK = [true, false, true, false, true, false];
  const order = [0, 2, 4, 1, 3, 5];

  function cupAt(x, y, s = 1, filled = false) {
    const color = filled ? C.amber : C.cyan;
    const body = new M.RoundedRectangle({
      width: 0.62 * s,
      height: 0.72 * s,
      cornerRadius: 0.12 * s,
      color,
      strokeWidth: 2
    });
    body.setFill(filled ? C.amber : C.card, filled ? 0.85 : 0.06);
    body.moveTo([0, 0, 0]);

    const lid = new M.Line({
      start: [-0.36 * s, 0.39 * s, 0],
      end: [0.36 * s, 0.39 * s, 0],
      color,
      strokeWidth: 3
    });

    const straw = new M.Line({
      start: [0.12 * s, 0.39 * s, 0],
      end: [0.2 * s, 0.57 * s, 0],
      color: C.muted,
      strokeWidth: 2
    });

    const g = new M.VGroup(body, lid, straw);
    g.moveTo([x, y, 0]);
    return g;
  }

  function squareAt(pos, cell, filled = false) {
    const s = new M.Rectangle({
      width: cell * 0.84,
      height: cell * 0.84,
      color: filled ? C.amber : C.muted,
      strokeWidth: 1
    });
    s.setFill(filled ? C.amber : C.card, filled ? 0.85 : 0.03);
    s.moveTo(pos);
    return s;
  }

  function makeGrid(n, cell, center, filled = 0) {
    const cells = [];
    const positions = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const pos = [
          center[0] + (c - (n - 1) / 2) * cell,
          center[1] + ((n - 1) / 2 - r) * cell,
          0
        ];
        positions.push(pos);
        cells.push(squareAt(pos, cell, r * n + c < filled));
      }
    }

    return {
      cells,
      positions,
      group: new M.VGroup(...cells)
    };
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.43 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
      const ind = cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      );
      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);

    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  let boxNow = null;

  // 0. The six morning orders.
  const wd = P
    ? [1.1, 1.3, 1.9, 2.6]
    : [1.0, 1.1, 1.7, 2.0];

  const rh = P ? 0.9 : 0.52;
  const fs = P ? 23 : 18;
  const head = ['Order', 'Time', 'Drink', 'Takeaway?'];
  const rows = [
    ['1', '8:05', 'coffee', 'yes'],
    ['2', '8:11', 'tea', 'no'],
    ['3', '8:20', 'coffee', 'yes'],
    ['4', '8:26', 'juice', 'no'],
    ['5', '8:40', 'coffee', 'yes'],
    ['6', '8:52', 'tea', 'no']
  ];

  const tw = wd.reduce((a, b) => a + b, 0);
  const x0 = CX - tw / 2;
  const ty0 = P ? 2.6 : 1.4;
  const card = new M.RoundedRectangle({
    width: tw + 0.3,
    height: 7 * rh + 0.2,
    cornerRadius: 0.16,
    color: C.cyan,
    strokeWidth: 2
  });
  card.setFill(C.card, 0.95);
  card.moveTo([CX, ty0 - 3.5 * rh, 0]);

  const hdr = new M.Rectangle({
    width: tw + 0.2,
    height: rh,
    color: C.cyan,
    strokeWidth: 0
  });
  hdr.setFill(C.cyan, 0.16);
  hdr.moveTo([CX, ty0 - 0.5 * rh, 0]);

  const seps = [];
  for (let k = 1; k <= 6; k++) {
    seps.push(new M.Line({
      start: [x0, ty0 - k * rh, 0],
      end: [x0 + tw, ty0 - k * rh, 0],
      color: C.muted,
      strokeWidth: 1
    }));
  }

  const cells = [];
  const allRows = [head, ...rows];

  for (let r = 0; r < allRows.length; r++) {
    let x = x0;
    for (let c = 0; c < 4; c++) {
      const val = allRows[r][c];
      const col = r === 0
        ? C.cyan
        : (c === 3 && val === 'yes' ? C.amber : C.ink);
      const t = T(val, fs + (r === 0 ? 1 : 0), col, r === 0);
      t.moveTo([
        x + wd[c] / 2,
        ty0 - (r + 0.5) * rh,
        0
      ]);
      cells.push(t);
      x += wd[c];
    }
  }

  const table = new M.VGroup(card, hdr, ...seps, ...cells);

  const colX = x0 + wd[0] + wd[1] + wd[2] + wd[3] / 2;
  const colrect = new M.RoundedRectangle({
    width: wd[3] + 0.15,
    height: 7 * rh + 0.14,
    cornerRadius: 0.1,
    color: C.amber,
    strokeWidth: 2
  });
  colrect.moveTo([colX, ty0 - 3.5 * rh, 0]);

  await until(S(0));
  await play(new M.FadeIn(table), ...say('6 MORNING ORDERS'));

  // 1. What takeaway means.
  await until(S(1));
  await play(...say('TAKEAWAY = LEAVES WITH THE DRINK', C.amber));

  // 2. The owner's question.
  await until(S(2));
  await play(...say('HOW MUCH OF OUR BUSINESS IS TAKEAWAY?', C.amber),
    ...fbox(['the owner asks:', ['how much is takeaway?', C.amber]], C.amber));

  // 3. Highlight the last column.
  await until(S(3));
  await play(new M.Create(colrect));

  // 4. Replace the table with six cups.
  const cups = Array.from(
    { length: 6 },
    (_, k) => cupAt(cupX(k), CUPY, CS, false)
  );

  const nums = Array.from({ length: 6 }, (_, k) => {
    const t = T(String(k + 1), P ? 15 : 17, C.muted, true);
    t.moveTo([cupX(k), CUPY + 0.82, 0]);
    return t;
  });

  const labs = TK.map((v, k) => {
    const t = T(v ? 'YES' : 'NO', P ? 16 : 18, v ? C.amber : C.muted, true);
    t.moveTo([cupX(k), CUPY - 0.78, 0]);
    return t;
  });

  await until(S(4));
  await play(
    new M.FadeOut(table),
    new M.FadeOut(colrect),
    ...say('1 CUP = 1 ORDER   ·   FILLED = TAKEAWAY'),
    ...fbox(['1 cup = 1 order', ['filled = takeaway', C.amber]], C.cyan)
  );
  await play(
    new M.LaggedStart(cups.map(c => new M.FadeIn(c)), {
      lagRatio: 0.12,
      runTime: 1.4
    }),
    new M.FadeIn(new M.VGroup(...nums))
  );

  // 5. Orders one, two and three.
  await until(S(5));
  for (const k of [0, 1, 2]) {
    if (TK[k]) {
      await play(
        new M.FadeIn(labs[k]),
        new M.Flash(cups[k].submobjects[0], { color: C.amber })
      );
      cups[k].submobjects[0].setFill(C.amber, 0.85);
      cups[k].submobjects[0].setColor(C.amber);
      cups[k].submobjects[1].setColor(C.amber);
    } else {
      await play(
        new M.FadeIn(labs[k]),
        new M.Indicate(cups[k], { color: C.muted, scaleFactor: 1.05 })
      );
    }
  }

  // 6. Orders four, five and six.
  await until(S(6));
  for (const k of [3, 4, 5]) {
    if (TK[k]) {
      await play(
        new M.FadeIn(labs[k]),
        new M.Flash(cups[k].submobjects[0], { color: C.amber })
      );
      cups[k].submobjects[0].setFill(C.amber, 0.85);
      cups[k].submobjects[0].setColor(C.amber);
      cups[k].submobjects[1].setColor(C.amber);
    } else {
      await play(
        new M.FadeIn(labs[k]),
        new M.Indicate(cups[k], { color: C.muted, scaleFactor: 1.05 })
      );
    }
  }

  // 7. Count the filled cups.
  const countPills = [];
  await until(S(7));

  for (let j = 0; j < 3; j++) {
    const k = [0, 2, 4][j];
    const cp = pill(String(j + 1), C.amber, 18);
    cp.moveTo([cupX(k), CUPY + 0.82, 0]);
    countPills.push(cp);
    await play(
      new M.FadeOut(nums[k]),
      new M.FadeIn(cp)
    );
  }
  await play(...say('3 TAKEAWAY ORDERS', C.amber), ...fbox([['takeaway orders: 3', C.amber]], C.amber));

  // 8. Three compared with different wholes.
  await until(S(8));
  await play(...say('3 OUT OF 6   ≠   3 OUT OF 100', C.violet),
    ...fbox(['3 out of 6', ['≠ 3 out of 100', C.violet]], C.violet));

  // 9. Ask what the number is compared with.
  await until(S(9));
  await play(
    ...say('3, COMPARED WITH WHAT?', C.violet),
    ...fbox([['3, compared', C.violet], ['with what?', C.violet]], C.violet),
    ...countPills.map(p => new M.FadeOut(p)),
    ...[1, 3, 5].map(k => new M.FadeOut(nums[k])),
    ...labs.map(l => new M.FadeOut(l))
  );

  // 10. Compare takeaway with staying.
  const full = [0, 2, 4];
  const empt = [1, 3, 5];

  await until(S(10));
  await play(...say('TAKEAWAY  vs  STAYING', C.cyan),
    ...fbox([['takeaway: 3', C.amber], ['staying:  3', C.cyan]], C.cyan));
  await play(
    ...full.map(k => new M.Indicate(cups[k], {
      color: C.amber,
      scaleFactor: 1.12
    }))
  );
  await play(
    ...empt.map(k => new M.Indicate(cups[k], {
      color: C.cyan,
      scaleFactor: 1.12
    }))
  );

  // 11. Pair each takeaway with one that stays.
  const arcs = [0, 2, 4].map(k => {
    const yb = CUPY + 0.95;
    const ln = (x1, y1, x2, y2) => new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color: C.green, strokeWidth: 3 });
    return new M.VGroup(
      ln(cupX(k), yb, cupX(k + 1), yb),
      ln(cupX(k), yb, cupX(k), yb - 0.18),
      ln(cupX(k + 1), yb, cupX(k + 1), yb - 0.18)
    );
  });

  await until(S(11));
  await play(
    new M.LaggedStart(arcs.map(a => new M.Create(a)), {
      lagRatio: 0.4,
      runTime: 1.6
    }),
    ...say('1 TAKEAWAY FOR EACH 1 THAT STAYS', C.green)
  );

  // 12. Ratio: part compared with another part.
  await until(S(12));
  await play(
    ...say('RATIO = PART WITH PART', C.green),
    ...fbox([
      'ratio: part with part',
      'takeaway : stay',
      ['3 : 3  =  1 : 1', C.amber]
    ], C.green)
  );

  // 13. Switch from part-with-part to part-with-whole.
  await until(S(13));
  await play(
    ...arcs.map(a => new M.FadeOut(a)),
    ...say('NOW: PART WITH WHOLE', C.amber)
  );

  // 14. Show the part and the whole.
  const wholeBox = new M.RoundedRectangle({
    width: 6 * SPC + 0.9,
    height: 1.75,
    cornerRadius: 0.16,
    color: C.cyan,
    strokeWidth: 2
  });
  wholeBox.moveTo([CX, CUPY, 0]);

  const partLabel = T('PART: 3 TAKEAWAY ORDERS', P ? 16 : 18, C.amber, true);
  partLabel.moveTo([CX, CUPY + 1.2, 0]);

  const wholeLabel = T('WHOLE: ALL 6 ORDERS', P ? 16 : 18, C.cyan, true);
  wholeLabel.moveTo([CX, CUPY - 1.2, 0]);

  await until(S(14));
  await play(
    ...full.map(k => new M.Indicate(cups[k], {
      color: C.amber,
      scaleFactor: 1.15
    })),
    new M.FadeIn(partLabel)
  );
  await play(
    new M.Create(wholeBox),
    new M.FadeIn(wholeLabel)
  );

  // 15. Write the fraction.
  await until(S(15));
  await play(
    ...say('FRACTION = PART OVER WHOLE', C.amber),
    ...fbox([
      'fraction = part / whole',
      ['3 = takeaway orders', C.amber],
      ['6 = all orders', C.cyan],
      ['3 / 6', C.amber]
    ], C.amber)
  );

  // 16. Read the fraction.
  await until(S(16));
  await play(...say('“3 OUT OF 6”', C.amber));

  // 17. Slide the filled cups together.
  await until(S(17));
  await play(
    new M.FadeOut(wholeBox),
    new M.FadeOut(partLabel),
    new M.FadeOut(wholeLabel),
    ...say('SLIDE THE FILLED CUPS TOGETHER', C.cyan)
  );

  await play(
    new M.LaggedStart(
      order.map((k, j) =>
        new M.Transform(cups[k], cupAt(px(j), CUPY, CS, TK[k]))
      ),
      { lagRatio: 0.08, runTime: 1.8 }
    )
  );

  // 18. Two equal piles.
  const pileW = 3 * SPC + 0.55;
  const pileXA = CX - 1.5 * SPC - GAP / 2;
  const pileXB = CX + 1.5 * SPC + GAP / 2;

  const pileA = new M.RoundedRectangle({
    width: pileW,
    height: 1.7,
    cornerRadius: 0.14,
    color: C.amber,
    strokeWidth: 2
  });
  pileA.moveTo([pileXA, CUPY, 0]);

  const pileB = new M.RoundedRectangle({
    width: pileW,
    height: 1.7,
    cornerRadius: 0.14,
    color: C.cyan,
    strokeWidth: 2
  });
  pileB.moveTo([pileXB, CUPY, 0]);

  await until(S(18));
  await play(
    new M.LaggedStart(
      order.map((k, j) =>
        new M.Transform(cups[k], cupAt(px(j, GAP), CUPY, CS, TK[k]))
      ),
      { lagRatio: 0.08, runTime: 0.8 }
    )
  );
  await play(
    new M.Create(pileA),
    new M.Create(pileB),
    ...say('2 EQUAL PILES, 3 CUPS EACH', C.cyan)
  );

  // 19. One pile out of two.
  await until(S(19));
  await play(
    new M.Indicate(pileA, { color: C.amber, scaleFactor: 1.05 }),
    ...say('1 PILE OUT OF 2 = ONE HALF', C.amber),
    ...fbox([
      'filled piles: 1',
      'total piles: 2',
      ['1 / 2 = ONE HALF', C.amber]
    ], C.amber)
  );

  // 20. Three out of six equals one out of two.
  await until(S(20));
  await play(
    ...say('SAME AMOUNT', C.amber),
    ...fbox([
      ['3 / 6', C.amber],
      '=',
      ['1 / 2', C.amber]
    ], C.amber)
  );

  // 21. Answer the café owner.
  await until(S(21));
  await play(
    new M.Indicate(pileA, { color: C.green, scaleFactor: 1.08 }),
    ...say('HALF OF THE ORDERS WERE TAKEAWAY', C.green)
  );

  // 22. A bigger whole: one hundred boxes.
  const G = makeGrid(10, CELL, [CX, GY], 0);

  await until(S(22));
  await play(
    ...cups.map(c => new M.FadeOut(c)),
    new M.FadeOut(pileA),
    new M.FadeOut(pileB),
    ...say('SAME HALF, WHOLE = 100 BOXES', C.violet)
  );
  await play(new M.FadeIn(G.group));

  // 23. Fill fifty of the one hundred boxes.
  const c50 = T('50 OUT OF 100', P ? 18 : 20, C.amber, true);
  c50.moveTo([CX, GY - 1.65, 0]);

  await until(S(23));
  await play(
    new M.LaggedStart(
      G.cells.slice(0, 50).map((cell, i) =>
        new M.Transform(cell, squareAt(G.positions[i], CELL, true))
      ),
      { lagRatio: 0.03, runTime: 2.6 }
    ),
    new M.FadeIn(c50)
  );

  // 24. The meaning of percentage.
  await until(S(24));
  await play(...say('PERCENTAGE = HOW MANY OUT OF 100', C.amber));

  // 25. One half is fifty percent.
  await until(S(25));
  await play(
    ...say('ONE HALF = 50%', C.amber),
    ...fbox([
      '1 / 2',
      '= 50 / 100',
      ['= 50%', C.amber]
    ], C.amber)
  );

  // 26. Introduce the bigger café.
  await until(S(26));

  const TQ = [
    [TX - 2.5 * GCELL, GY + 2.5 * GCELL, 0],
    [TX + 2.5 * GCELL, GY + 2.5 * GCELL, 0],
    [TX - 2.5 * GCELL, GY - 2.5 * GCELL, 0],
    [TX + 2.5 * GCELL, GY - 2.5 * GCELL, 0]
  ];

  const cafeGrids = TQ.map(p => makeGrid(5, GCELL, p, 10));

  const ulab = T('US: 3 OF 6', P ? 15 : 17, C.ink, true);
  ulab.moveTo([UX, GY + 1.75, 0]);

  const tlab = T('THEM: 10 OF 25', P ? 15 : 17, C.ink, true);
  tlab.moveTo([TX, GY + 1.75, 0]);

  const hideBox = boxNow ? [new M.FadeOut(boxNow)] : [];

  await play(
    new M.Transform(G.group, makeGrid(10, CELL, [UX, GY], 50).group),
    new M.FadeOut(c50),
    new M.FadeIn(ulab),
    new M.FadeIn(tlab),
    new M.FadeIn(cafeGrids[0].group),
    ...hideBox,
    ...say('A BIGGER CAFÉ: 10 OUT OF 25', C.cyan)
  );
  boxNow = null;

  // 27. Ten is more than three, but the whole is bigger.
  await until(S(27));
  await play(
    new M.LaggedStart(
      cafeGrids[0].cells.slice(0, 10).map(cell =>
        new M.Indicate(cell, { color: C.amber, scaleFactor: 1.15 })
      ),
      { lagRatio: 0.04, runTime: 1.2 }
    ),
    ...say('10 > 3 … BUT THEIR WHOLE IS BIGGER', C.violet)
  );
  await play(
    new M.Indicate(cafeGrids[0].group, {
      color: C.cyan,
      scaleFactor: 1.06
    })
  );

  // 28. Four identical cafés make one hundred orders.
  await until(S(28));
  await play(
    new M.LaggedStart(
      cafeGrids.slice(1).map(g => new M.FadeIn(g.group)),
      { lagRatio: 0.35, runTime: 2.2 }
    ),
    ...say('4 CAFÉS LIKE THEIRS = 100 ORDERS', C.cyan)
  );

  // 29. Count ten takeaways in each café.
  let countTag = null;

  await until(S(29));
  for (let q = 0; q < 4; q++) {
    const text = [
      '10',
      '10 + 10 = 20',
      '20 + 10 = 30',
      '30 + 10 = 40'
    ][q];

    const nt = T(text, P ? 18 : 18, C.amber, true);
    nt.moveTo([TX, GY - 1.95, 0]);

    const animations = [
      new M.LaggedStart(
        cafeGrids[q].cells.slice(0, 10).map(cell =>
          new M.Indicate(cell, {
            color: C.amber,
            scaleFactor: 1.15
          })
        ),
        { lagRatio: 0.035, runTime: 0.65 }
      )
    ];

    if (countTag) animations.push(new M.FadeOut(countTag));
    animations.push(new M.FadeIn(nt));

    await play(...animations);
    countTag = nt;
  }

  // 30. Compare forty percent with fifty percent.
  const p50 = pill('50%', C.amber, P ? 18 : 21);
  p50.moveTo([UX, GY - 1.95, 0]);

  const p40 = pill('40%', C.amber, P ? 18 : 21);
  p40.moveTo([TX, GY - 1.95, 0]);

  await until(S(30));
  await play(
    new M.FadeOut(countTag),
    new M.FadeIn(p50),
    new M.FadeIn(p40),
    ...say('40%  vs  50%', C.amber)
  );
  countTag = null;

  // 31. Our larger percentage comes from only six orders.
  await until(S(31));
  await play(
    new M.Indicate(p50, { color: C.green, scaleFactor: 1.3 }),
    ...say('BUT OURS: ONLY 6 ORDERS', C.violet)
  );

  // 32. Percentages allow comparison using the same whole.
  await until(S(32));
  await play(
    new M.FadeOut(G.group),
    ...cafeGrids.map(g => new M.FadeOut(g.group)),
    new M.FadeOut(ulab),
    new M.FadeOut(tlab),
    new M.FadeOut(p50),
    new M.FadeOut(p40),
    ...say('SAME WHOLE (100) → GROUPS CAN BE COMPARED', C.green)
  );

  // 33. Return to the six cups for the numerical rule.
  const cups2 = Array.from(
    { length: 6 },
    (_, j) => cupAt(px(j, GAP), CUPY, CS, j < 3)
  );

  const pile2A = new M.RoundedRectangle({
    width: pileW,
    height: 1.7,
    cornerRadius: 0.14,
    color: C.amber,
    strokeWidth: 2
  });
  pile2A.moveTo([pileXA, CUPY, 0]);

  const pile2B = new M.RoundedRectangle({
    width: pileW,
    height: 1.7,
    cornerRadius: 0.14,
    color: C.cyan,
    strokeWidth: 2
  });
  pile2B.moveTo([pileXB, CUPY, 0]);

  await until(S(33));
  await play(
    ...say('THE RULE IN NUMBERS', C.cyan),
    new M.LaggedStart(cups2.map(c => new M.FadeIn(c)), {
      lagRatio: 0.08,
      runTime: 1.2
    }),
    new M.Create(pile2A),
    new M.Create(pile2B)
  );

  // 34. The fraction line means divided by.
  await until(S(34));
  await play(
    ...say('THE LINE MEANS “DIVIDED BY”', C.amber),
    ...fbox([
      ['3 / 6', C.amber],
      '= 3 ÷ 6',
      '= 1 / 2'
    ], C.amber)
  );
  await play(
    new M.Indicate(pile2A, {
      color: C.amber,
      scaleFactor: 1.06
    })
  );

  // 35. Multiply by one hundred.
  await until(S(35));
  await play(
    ...say('× 100: COUNT OUT OF 100', C.amber),
    ...fbox([
      '1 / 2',
      '× 100',
      ['= 50', C.amber]
    ], C.amber)
  );

  // 36. The percentage formula.
  await until(S(36));
  await play(
    ...say('PERCENT = PART ÷ WHOLE × 100', C.cyan),
    ...fbox([
      'percent =',
      'part ÷ whole × 100',
      '= 3 ÷ 6 × 100',
      ['= 50%', C.amber]
    ], C.cyan)
  );

  // 37. The trap: a percentage hides the number counted.
  const BY = CUPY - (P ? 1.55 : 1.65);
  const BL = P ? 6.0 : 6.6;

  const bar = new M.RoundedRectangle({
    width: BL,
    height: 0.36,
    cornerRadius: 0.08,
    color: C.muted,
    strokeWidth: 2
  });
  bar.moveTo([CX, BY, 0]);

  function fillbar(p, color = C.amber) {
    const b = new M.Rectangle({
      width: BL * p / 100,
      height: 0.26,
      color,
      strokeWidth: 0
    });
    b.setFill(color, 0.85);
    b.moveTo([
      CX - BL / 2 + BL * p / 200,
      BY,
      0
    ]);
    return b;
  }

  const b0 = T('0', 16, C.muted, true);
  b0.moveTo([CX - BL / 2 - 0.25, BY - 0.48, 0]);

  const b1 = T('100', 16, C.muted, true);
  b1.moveTo([CX + BL / 2 + 0.35, BY - 0.48, 0]);

  let barFill = fillbar(50);
  let barLabel = pill('50%', C.amber, 18);
  barLabel.moveTo([CX, BY - 0.75, 0]);

  await until(S(37));
  await play(
    new M.FadeOut(pile2A),
    new M.FadeOut(pile2B),
    new M.Create(bar),
    new M.FadeIn(b0),
    new M.FadeIn(b1),
    new M.FadeIn(barFill),
    new M.FadeIn(barLabel),
    ...say('THE TRAP: HOW MANY WERE COUNTED?', C.pink)
  );

  // 38. Our fifty percent came from only six orders.
  const sixl = T('ONLY 6 ORDERS', P ? 17 : 19, C.pink, true);
  sixl.moveTo([CX, CUPY + 1.0, 0]);

  await until(S(38));
  await play(
    new M.FadeIn(sixl),
    ...fbox([
      '3 out of 6',
      ['= 50%', C.amber]
    ], C.pink)
  );

  // 39. One customer changes their order.
  await until(S(39));
  await play(
    ...say('ONE CUSTOMER SWITCHES', C.pink),
    new M.Indicate(cups2[3], {
      color: C.pink,
      scaleFactor: 1.25
    })
  );
  await play(
    new M.Transform(
      cups2[3],
      cupAt(px(3, GAP), CUPY, CS, true)
    )
  );

  // 40. Four out of six is approximately sixty-seven percent.
  const barLabel67 = pill('≈ 67%', C.pink, 18);
  barLabel67.moveTo([CX, BY - 0.75, 0]);

  await until(S(40));
  await play(
    new M.Transform(barFill, fillbar(66.7, C.pink)),
    new M.Transform(barLabel, barLabel67),
    ...fbox([
      '4 out of 6',
      '4 ÷ 6 × 100',
      ['≈ 67%', C.pink]
    ], C.pink)
  );

  // 41. One customer moves the percentage from fifty to sixty-seven.
  await until(S(41));
  await play(
    new M.Indicate(barLabel, {
      color: C.pink,
      scaleFactor: 1.3
    }),
    ...say('ONE CUSTOMER: 50% → 67%', C.pink)
  );

  // 42. The important question.
  await until(S(42));
  await play(...say('ASK: OUT OF HOW MANY?', C.amber));

  // 43. Recap: fraction and percentage.
  const barLabel50 = pill('50%', C.amber, 18);
  barLabel50.moveTo([CX, BY - 0.75, 0]);

  await until(S(43));
  await play(
    new M.FadeOut(sixl),
    new M.Transform(
      cups2[3],
      cupAt(px(3, GAP), CUPY, CS, false)
    ),
    new M.Transform(barFill, fillbar(50, C.amber)),
    new M.Transform(barLabel, barLabel50),
    ...say('FRACTION  ·  PERCENT', C.green),
    ...fbox([
      'fraction = part / whole',
      '3 / 6 = 1 / 2',
      'percent = out of 100',
      ['1 / 2 = 50%', C.amber]
    ], C.green)
  );
}
