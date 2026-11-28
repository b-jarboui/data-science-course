// lesson 1.1.8
// Reading a formula: the adding-up sign.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const PRICES = [3, 4, 5, 4, 4, 3];
  const TOTAL = 23;

  // ---------- Layout ----------
  const TX = P ? 0 : -3.9;
  const HY = P ? 3.05 : 1.15;
  const RH = P ? 0.6 : 0.5;
  const CW = P ? 4.8 : 3.9;
  const COLS = P ? [-1.6, 0, 1.6] : [-1.25, 0, 1.25];

  const PILLP = P ? [0, 4.05, 0] : [2.6, 1.85, 0];
  const FX = P ? [0, -3.0, 0] : [2.6, 0.25, 0];
  const BOXP = P ? [0, -5.1, 0] : [2.6, -1.85, 0];
  const BOXW = P ? FW - 1.2 : 5.6;

  const say = (s, color = C.cyan) => showA(s, color, PILLP);

  const pt = (x, y) => [x, y, 0];

  const textAt = (s, x, y, size = 20, color = C.ink, bold = true) => {
    const t = T(s, size, color, bold);
    t.moveTo(pt(x, y));
    return t;
  };

  const makeLine = (x1, y1, x2, y2, color = C.muted, width = 2) =>
    new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth: width,
    });

  // ---------- Formula box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 23;
    const lh = P ? 0.42 : 0.42;

    const rows = lines.map(v => Array.isArray(v) ? v : [v, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));

    const cw = T("0000000000", size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2,
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo(pt(
        left + indent + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    if (wd > BOXW) g.scale(BOXW / wd);

    const animations = [new M.FadeIn(g)];

    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = g;
    return animations;
  }

  // ---------- Indexed letters ----------
  // A Text's width includes a transparent margin of 0.2 * fontSize on each side.
  const measure = document.createElement('canvas').getContext('2d');
  const sidePad = (label, text, size) => {
    measure.font = `${size}pt Consolas, "Liberation Mono", monospace`;
    const units = label.getWidth() / (measure.measureText(text).width + 0.4 * size);
    return 0.2 * size * units;
  };

  function pairWidth(baseChar, indexChar, size) {
    const base = T(baseChar, size, C.ink, true);
    const isz = Math.round(size * 0.58);
    const index = T(indexChar, isz, C.ink, true);
    return base.getWidth() + index.getWidth() + 0.04 -
      sidePad(base, baseChar, size) - sidePad(index, indexChar, isz);
  }

  function indexedPair(baseChar, indexChar, size, color, cx, cy) {
    const base = T(baseChar, size, color, true);
    const isz = Math.round(size * 0.58);
    const index = T(indexChar, isz, color, true);
    // Ink-to-ink gap of 0.04, as in the video.
    const gap = 0.04 - sidePad(base, baseChar, size) - sidePad(index, indexChar, isz);

    const totalWidth = base.getWidth() + index.getWidth() + gap;
    const startX = cx - totalWidth / 2;

    base.moveTo(pt(
      startX + base.getWidth() / 2,
      cy
    ));

    index.moveTo(pt(
      startX + base.getWidth() + gap + index.getWidth() / 2,
      cy - size * 0.0045
    ));

    return {
      base,
      index,
      group: new M.VGroup(base, index),
    };
  }

  function indexedEquation(indexChar, amount, size = 60) {
    const pair = indexedPair(
      "x",
      indexChar,
      size,
      C.violet,
      0,
      0
    );

    const equal = T("=", Math.round(size * 0.58), C.ink, true);
    const value = T(` ${amount} dollars`, Math.round(size * 0.46), C.amber, true);

    const gap = 0.2;
    const totalWidth =
      pair.group.getWidth() +
      equal.getWidth() +
      value.getWidth() +
      gap * 2;

    const startX = FX[0] - totalWidth / 2;

    pair.group.moveTo(pt(
      startX + pair.group.getWidth() / 2,
      FX[1]
    ));

    equal.moveTo(pt(
      startX + pair.group.getWidth() + gap + equal.getWidth() / 2,
      FX[1]
    ));

    value.moveTo(pt(
      startX + pair.group.getWidth() + gap +
      equal.getWidth() + gap + value.getWidth() / 2,
      FX[1]
    ));

    return new M.VGroup(pair.group, equal, value);
  }

  // ---------- Table ----------
  const ry = k => HY - 0.6 - k * RH;

  const card = new M.RoundedRectangle({
    width: CW,
    height: RH * 6 + 0.95,
    cornerRadius: 0.16,
    color: C.grid,
    strokeWidth: 2,
  });

  card.setFill(C.card, 0.9);
  card.moveTo(pt(TX, HY - 0.6 - 2.5 * RH + 0.22));

  const hdrO = textAt(
    "order",
    TX + COLS[0],
    HY,
    P ? 25 : 20,
    C.cyan
  );

  const hdrN = textAt(
    "name",
    TX + COLS[1],
    HY,
    P ? 25 : 20,
    C.violet
  );

  const hdrP = textAt(
    "price ($)",
    TX + COLS[2],
    HY,
    P ? 25 : 20,
    C.amber
  );

  const hline = makeLine(
    TX - CW / 2 + 0.15,
    HY - 0.25,
    TX + CW / 2 - 0.15,
    HY - 0.25,
    C.cyan,
    2
  );

  const onum = PRICES.map((v, k) =>
    textAt(
      String(k + 1),
      TX + COLS[0],
      ry(k),
      P ? 27 : 26,
      C.cyan
    )
  );

  const pval = PRICES.map((v, k) =>
    textAt(
      String(v),
      TX + COLS[2],
      ry(k),
      P ? 29 : 28,
      C.amber
    )
  );

  const xnames = PRICES.map((v, k) =>
    indexedPair(
      "x",
      String(k + 1),
      P ? 32 : 32,
      C.violet,
      TX + COLS[1],
      ry(k)
    )
  );

  const hiAt = (k, color = C.amber) => {
    const r = new M.Rectangle({
      width: CW - 0.2,
      height: RH * 0.92,
      color,
      strokeWidth: 0,
    });

    r.setFill(color, 0.16);
    r.moveTo(pt(TX, ry(k)));
    return r;
  };

  // ---------- Pointer ----------
  const ptrX = TX - CW / 2 - 0.28;

  let ptr = new M.Dot({
    point: pt(ptrX, ry(0)),
    radius: 0.13,
    color: C.green,
  });

  const ptrLabel = textAt("i", ptrX - 0.22, ry(0), 19, C.green);

  const ptrAt = k => pt(ptrX, ry(k));

  // ---------- Sigma formula ----------
  const sigX = FX[0] - 0.65;
  const sigY = FX[1];

  const sig = textAt(
    "Σ",
    sigX,
    sigY,
    P ? 112 : 108,
    C.cyan
  );

  const rightPair = indexedPair(
    "x",
    "i",
    P ? 62 : 60,
    C.violet,
    sigX + 1.35,
    sigY
  );

  let topLimit = textAt(
    "6",
    sigX,
    sigY + 1.05,
    30,
    C.amber
  );

  const bot = textAt(
    "i = 1",
    sigX,
    sigY - 1.05,
    28,
    C.green
  );

  // ==========================================================
  // 0-5: THE CAFÉ, SIX ORDERS, AND PRICES
  // ==========================================================

  // 0. Imagine you run a café.
  // a café cup in the formula area (empty there until step one)
  const kc = P ? 1.3 : 1.2;
  const cupB = new M.RoundedRectangle({ width: 1.0 * kc, height: 1.0 * kc, cornerRadius: 0.1, color: C.amber, strokeWidth: 3 });
  cupB.setFill(C.amber, 0.16);
  cupB.moveTo(pt(FX[0], FX[1]));
  const cupH = new M.Arc({ radius: 0.27 * kc, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  cupH.moveTo(pt(FX[0] + 0.56 * kc, FX[1] + 0.02));
  const steam = [-0.22, 0, 0.22].map(dx => makeLine(FX[0] + dx * kc, FX[1] + 0.62 * kc, FX[0] + (dx + 0.04) * kc, FX[1] + 1.0 * kc, C.muted, 2.5));
  const cupL = textAt("café", FX[0], FX[1] - 0.5 * kc - 0.35, 20, C.muted);
  const cupPic = new M.VGroup(cupB, cupH, ...steam, cupL);

  await until(S(0));

  await play(
    new M.FadeIn(cupPic),
    ...say("A SMALL CAFE, 8:00 TO 9:00")
  );

  // 1. Six orders.
  await until(S(1));

  await play(
    new M.FadeIn(card),
    new M.FadeIn(hdrO),
    new M.Create(hline),
    new M.LaggedStart(
      onum.map(o => new M.FadeIn(o)),
      { lagRatio: 0.15, runTime: 1.4 }
    ),
    ...say("6 ORDERS")
  );

  // 2. Each order has a price.
  await until(S(2));

  await play(
    new M.FadeIn(hdrP),
    ...say("EACH ORDER HAS A PRICE, IN DOLLARS", C.amber)
  );

  // 3. The question.
  await until(S(3));

  await play(
    ...say("HOW MUCH MONEY CAME IN?", C.amber)
  );

  // 4. Revenue.
  await until(S(4));

  await play(
    ...say("REVENUE = MONEY FROM SALES", C.green)
  );

  // 5. Introduce the six prices.
  await until(S(5));

  await play(
    new M.Indicate(hdrP, { color: C.amber }),
    ...say("SIX PRICES, ALL IN DOLLARS", C.amber)
  );

  // ==========================================================
  // 6-11: REVEAL THE SIX PRICES
  // ==========================================================

  for (let k = 0; k < 6; k++) {
    await until(S(6 + k));

    await play(
      new M.FadeIn(pval[k]),
      new M.Flash(pval[k], { color: C.amber }),
      ...say(`ORDER ${k + 1}: ${PRICES[k]} DOLLARS`, C.amber)
    );
  }

  // ==========================================================
  // 12-19: ADD THE PRICES BY HAND
  // ==========================================================

  // 12. Start the running total.
  await until(S(12));

  await play(
    ...fbox([
      "total so far",
      ["0", C.amber],
    ]),
    ...say("ADD THE PRICES, ONE AT A TIME", C.amber)
  );

  let bar = hiAt(0);

  // 13. Start with 3, then add 4.
  await until(S(13));

  await play(
    new M.FadeIn(bar),
    ...fbox([
      "total so far",
      ["3", C.amber],
    ])
  );

  await play(
    new M.Transform(bar, hiAt(1)),
    ...fbox([
      "total so far",
      ["3 + 4 = 7", C.amber],
    ])
  );

  // 14. Add five.
  await until(S(14));

  await play(
    new M.Transform(bar, hiAt(2)),
    ...fbox([
      "total so far",
      ["7 + 5 = 12", C.amber],
    ])
  );

  // 15. Add four.
  await until(S(15));

  await play(
    new M.Transform(bar, hiAt(3)),
    ...fbox([
      "total so far",
      ["12 + 4 = 16", C.amber],
    ])
  );

  // 16. Add another four.
  await until(S(16));

  await play(
    new M.Transform(bar, hiAt(4)),
    ...fbox([
      "total so far",
      ["16 + 4 = 20", C.amber],
    ])
  );

  // 17. Add the final three.
  await until(S(17));

  await play(
    new M.Transform(bar, hiAt(5)),
    ...fbox([
      "total so far",
      ["20 + 3 = 23", C.amber],
    ])
  );

  // 18. Name the sum.
  await until(S(18));

  await play(
    new M.FadeOut(bar),
    ...fbox([
      "3 + 4 + 5 + 4 + 4 + 3",
      ["sum = 23", C.amber],
    ], C.amber),
    ...say("SUM = ANSWER OF ADDING UP", C.amber)
  );

  // 19. Revenue is 23 dollars.
  await until(S(19));

  await play(
    ...fbox([
      "sum = 23 dollars",
      ["= the revenue", C.green],
    ], C.green),
    ...say("REVENUE = $23", C.green)
  );

  // ==========================================================
  // 20-22: WHY WE NEED A SHORT FORMULA
  // ==========================================================

  // 20. Six hundred orders.
  await until(S(20));

  await play(
    ...fbox([
      "3 + 4 + 5 + 4 + 4 + 3 +",
      "4 + 3 + 5 + 4 + 3 + 4 +",
      "5 + 3 + 4 + 4 + 5 + 3 +",
      ["... 600 prices ...", C.muted],
    ], C.muted),
    new M.FadeOut(cupPic),
    ...say("600 ORDERS: PAGES OF PLUS SIGNS", C.pink)
  );

  // 21. Define a formula.
  await until(S(21));

  await play(
    ...say("FORMULA = A SHORT RULE WITH SIGNS", C.cyan)
  );

  // 22. Two small steps.
  await until(S(22));

  await play(
    ...fbox([
      ["step 1: the name x", C.violet],
      ["step 2: the adding-up sign", C.cyan],
    ], C.violet),
    ...say("TWO SMALL STEPS", C.violet)
  );

  // ==========================================================
  // 23-28: STEP ONE - X NAMES A PRICE
  // ==========================================================

  // 23. X stands for a price.
  await until(S(23));

  await play(
    new M.FadeIn(hdrN),
    ...say("STEP 1: X = A PRICE", C.violet)
  );

  // 24. Add a small lowered order number.
  const flyIndex = textAt(
    "1",
    TX + COLS[0],
    ry(0),
    P ? 26 : 25,
    C.violet
  );

  await until(S(24));

  await play(
    new M.FadeIn(xnames[0].base),
    new M.FadeIn(flyIndex),
    new M.Indicate(onum[0], { color: C.violet }),
    ...say("SMALL NUMBER PICKS ONE PRICE", C.violet)
  );

  await play(
    new M.Transform(
      flyIndex,
      xnames[0].index
    )
  );

  // 25. x1 means three dollars.
  const big1 = indexedEquation("1", "3");

  await until(S(25));

  await play(
    new M.FadeOut(boxNow),
    new M.FadeIn(big1),
    new M.Indicate(onum[0], { color: C.violet }),
    ...say("X ONE = 3 DOLLARS", C.violet)
  );
  boxNow = null;

  // 26. x2 means four dollars.
  const big2 = indexedEquation("2", "4");

  await until(S(26));

  await play(
    new M.FadeOut(big1),
    new M.FadeIn(big2),
    new M.FadeIn(xnames[1].group),
    ...say("X TWO = 4 DOLLARS", C.violet)
  );

  // 27. Continue through order six.
  const big6 = indexedEquation("6", "3");

  await until(S(27));

  await play(
    new M.FadeOut(big2),
    new M.FadeIn(big6),
    new M.LaggedStart(
      xnames.slice(2).map(x => new M.FadeIn(x.group)),
      { lagRatio: 0.25, runTime: 1.6 }
    ),
    ...say("DOWN TO X SIX = 3 DOLLARS", C.violet)
  );

  // 28. It is a name, not multiplication.
  const notx = textAt(
    "x × 6",
    FX[0],
    FX[1] - 1.0,
    38,
    C.pink
  );

  const cross1 = makeLine(
    FX[0] + 1.05,
    FX[1] - 1.2,
    FX[0] + 1.45,
    FX[1] - 0.8,
    C.pink,
    5
  );

  const cross2 = makeLine(
    FX[0] + 1.05,
    FX[1] - 0.8,
    FX[0] + 1.45,
    FX[1] - 1.2,
    C.pink,
    5
  );

  await until(S(28));

  await play(
    new M.FadeIn(notx),
    new M.Create(cross1),
    new M.Create(cross2),
    ...say("A NAME, NOT A MULTIPLICATION", C.pink)
  );

  // ==========================================================
  // 29-36: THE COUNTER I
  // ==========================================================

  // 29. One name for any order.
  await until(S(29));

  await play(
    new M.FadeOut(notx),
    new M.FadeOut(cross1),
    new M.FadeOut(cross2),
    new M.FadeOut(big6),
    ...say("ONE NAME FOR ANY ORDER", C.violet)
  );

  // 30. Replace the small number with i.
  const bigi = indexedPair(
    "x",
    "i",
    64,
    C.violet,
    FX[0],
    FX[1]
  );

  await until(S(30));

  await play(
    new M.FadeIn(bigi.group),
    new M.Indicate(bigi.index, { color: C.green }),
    ...say("X I: THE SMALL LETTER I", C.violet)
  );

  // 31. The counter points at a row.
  ptr = new M.Dot({
    point: ptrAt(0),
    radius: 0.13,
    color: C.green,
  });

  const ptrLabel2 = textAt(
    "i",
    ptrX - 0.22,
    ry(0),
    19,
    C.green
  );

  await until(S(31));

  await play(
    new M.FadeIn(ptr),
    new M.FadeIn(ptrLabel2),
    new M.Indicate(onum[0], { color: C.green }),
    ...say("i = THE COUNTER", C.green)
  );

  // 32. Move down the list one order at a time.
  await until(S(32));

  for (let k = 1; k < 6; k++) {
    await play(
      new M.Transform(
        ptr,
        new M.Dot({
          point: ptrAt(k),
          radius: 0.13,
          color: C.green,
        })
      ),
      new M.Transform(
        ptrLabel2,
        textAt("i", ptrX - 0.22, ry(k), 19, C.green)
      ),
      new M.Indicate(onum[k], { color: C.green })
    );
  }

  // Return to the first row for the next examples.
  await play(
    new M.Transform(
      ptr,
      new M.Dot({
        point: ptrAt(0),
        radius: 0.13,
        color: C.green,
      })
    ),
    new M.Transform(
      ptrLabel2,
      textAt("i", ptrX - 0.22, ry(0), 19, C.green)
    )
  );

  // 33-35. Read xi for three different counter positions.
  function reading(iValue) {
    const price = PRICES[iValue - 1];
    const ps = P ? 46 : 48;
    const vs = P ? 21 : 25;
    const tail = `= ${price} dollars`;

    // Lay the four parts left to right (each built in place) so the
    // lowered numbers stay readable.
    const widths = [
      pairWidth("x", "i", ps),
      T("=", 30, C.ink, true).getWidth(),
      pairWidth("x", String(iValue), ps),
      T(tail, vs, C.amber, true).getWidth(),
    ];
    const gap = 0.12;
    const total = widths.reduce((s, w) => s + w, 0) + gap * 3;
    const cx = [];
    let x = FX[0] - total / 2;
    widths.forEach(w => { cx.push(x + w / 2); x += w + gap; });

    // Build each pair at the origin and move its group (as indexedEquation does):
    // a pair built in place and then nested in the VGroup below lands at twice its offset.
    const pairAt = (indexChar, x) => {
      const pair = indexedPair("x", indexChar, ps, C.violet, 0, 0);
      const [gx, gy] = pair.group.getCenter();
      pair.group.moveTo(pt(x + gx, FX[1] + gy));
      return pair;
    };

    const pair1 = pairAt("i", cx[0]);
    const equals1 = textAt("=", cx[1], FX[1], 30, C.ink);
    const pair2 = pairAt(String(iValue), cx[2]);
    const equals2 = textAt(tail, cx[3], FX[1], vs, C.amber);

    return new M.VGroup(pair1.group, equals1, pair2.group, equals2);
  }

  const read1 = reading(1);
  const read3 = reading(3);
  const read6 = reading(6);

  // 33. Counter at one.
  await until(S(33));

  await play(
    new M.FadeOut(bigi.group),
    new M.FadeIn(read1),
    new M.Indicate(onum[0], { color: C.green }),
    new M.Indicate(pval[0], { color: C.amber }),
    ...say("COUNTER AT 1: PRICE IS 3", C.green)
  );

  // 34. Counter at three.
  await until(S(34));

  await play(
    new M.FadeOut(read1),
    new M.FadeIn(read3),
    new M.Transform(
      ptr,
      new M.Dot({
        point: ptrAt(2),
        radius: 0.13,
        color: C.green,
      })
    ),
    new M.Transform(
      ptrLabel2,
      textAt("i", ptrX - 0.22, ry(2), 19, C.green)
    ),
    new M.Indicate(pval[2], { color: C.amber }),
    ...say("COUNTER AT 3: PRICE IS 5", C.green)
  );

  // 35. Counter at six.
  await until(S(35));

  await play(
    new M.FadeOut(read3),
    new M.FadeIn(read6),
    new M.Transform(
      ptr,
      new M.Dot({
        point: ptrAt(5),
        radius: 0.13,
        color: C.green,
      })
    ),
    new M.Transform(
      ptrLabel2,
      textAt("i", ptrX - 0.22, ry(5), 19, C.green)
    ),
    new M.Indicate(pval[5], { color: C.amber }),
    ...say("COUNTER AT 6: PRICE IS 3", C.green)
  );

  // 36. Define xi.
  const bigi2 = indexedPair(
    "x",
    "i",
    64,
    C.violet,
    FX[0],
    FX[1]
  );

  await until(S(36));

  await play(
    new M.FadeOut(read6),
    new M.FadeIn(bigi2.group),
    ...say("X I = PRICE THE COUNTER POINTS AT", C.violet)
  );

  // ==========================================================
  // 37-43: STEP TWO - SIGMA
  // ==========================================================

  // 37. Reveal the sigma sign.
  await until(S(37));

  await play(
    new M.FadeOut(bigi2.group),
    new M.FadeIn(sig),
    ...say("STEP 2: THE SIGN", C.cyan)
  );

  // 38. Sigma means add up.
  await until(S(38));

  await play(
    new M.Indicate(sig, { color: C.cyan }),
    ...say("SIGMA = ADD UP", C.cyan)
  );

  // 39. Read the small parts.
  await until(S(39));

  await play(
    ...say("READ THE SMALL PARTS", C.cyan)
  );

  // 40. Below the sign: i equals one.
  await until(S(40));

  await play(
    new M.FadeIn(bot),
    new M.Indicate(bot, { color: C.green }),
    ...say("BELOW: START THE COUNTER AT 1", C.green)
  );

  await play(
    new M.Indicate(bot, { color: C.green }),
    new M.Indicate(onum[0], { color: C.green })
  );

  // 41. Above the sign: six.
  await until(S(41));

  await play(
    new M.FadeIn(topLimit),
    new M.Indicate(topLimit, { color: C.amber }),
    ...say("ABOVE: LAST ORDER IS 6", C.amber)
  );

  await play(
    new M.Indicate(onum[5], { color: C.amber })
  );

  // 42. Right of the sign: xi.
  await until(S(42));

  await play(
    new M.FadeIn(rightPair.group),
    new M.Indicate(rightPair.group, { color: C.violet }),
    ...say("RIGHT: WHAT WE ADD - THE PRICE", C.violet)
  );

  await play(
    new M.Indicate(hdrN, { color: C.violet })
  );

  // 43. Read the whole expression in everyday words.
  await until(S(43));

  await play(
    ...say("ADD THE PRICES OF ORDERS 1 TO 6", C.amber)
  );

  // ==========================================================
  // 44-52: FOLLOW THE FORMULA
  // ==========================================================

  // 44. Start the running total.
  await until(S(44));

  await play(
    ...fbox([
      "total so far",
      ["0", C.amber],
    ], C.green),
    ...say("FOLLOW IT", C.green)
  );

  let runningTotal = 0;

  let runningBar = hiAt(0, C.green);

  // 45-50. Follow the counter through all six prices.
  for (let k = 0; k < 6; k++) {
    await until(S(45 + k));

    const previousTotal = runningTotal;
    runningTotal += PRICES[k];

    const equationText = previousTotal
      ? `${previousTotal} + ${PRICES[k]} = ${runningTotal}`
      : `${runningTotal}`;

    const counterText = `counter ${k + 1}: x${k + 1} = ${PRICES[k]}`;

    const newPointer = new M.Dot({
      point: ptrAt(k),
      radius: 0.13,
      color: C.green,
    });

    const newPointerLabel = textAt(
      "i",
      ptrX - 0.22,
      ry(k),
      19,
      C.green
    );

    const animations = [
      new M.Transform(ptr, newPointer),
      new M.Transform(ptrLabel2, newPointerLabel),
      ...fbox([
        [counterText, C.green],
        [equationText, C.amber],
      ], C.green),
      new M.Indicate(pval[k], { color: C.amber }),
    ];

    if (k === 0) {
      animations.push(new M.FadeIn(runningBar));
    } else {
      animations.push(
        new M.Transform(runningBar, hiAt(k, C.green))
      );
    }

    await play(...animations);
  }

  // 51. The top number is six, so stop.
  await until(S(51));

  await play(
    new M.Indicate(topLimit, { color: C.amber }),
    new M.Indicate(onum[5], { color: C.amber }),
    ...say("6 WAS ON TOP: STOP", C.amber)
  );

  // 52. Same answer as adding by hand.
  const eq23 = textAt(
    "= 23",
    sigX + 2.7,
    sigY,
    42,
    C.amber
  );

  await until(S(52));

  await play(
    new M.FadeOut(runningBar),
    new M.FadeIn(eq23),
    ...fbox([
      "by hand: 23",
      ["by the sign: 23", C.amber],
    ], C.amber),
    ...say("SAME AS BY HAND", C.green)
  );

  // ==========================================================
  // 53-55: WHAT SIGMA IS FOR
  // ==========================================================

  // 53. A long sum in one short line.
  await until(S(53));

  await play(
    new M.Indicate(sig, { color: C.cyan }),
    new M.Indicate(rightPair.group, { color: C.cyan }),
    new M.Indicate(eq23, { color: C.cyan }),
    ...say("A LONG SUM IN ONE SHORT LINE", C.cyan)
  );

  // 54. Six hundred orders: change only the upper limit.
  const top600 = textAt(
    "600",
    sigX,
    sigY + 1.05,
    30,
    C.amber
  );

  await until(S(54));

  await play(
    new M.FadeOut(eq23),
    new M.FadeOut(topLimit),
    new M.FadeIn(top600),
    ...fbox([
      "600 orders:",
      ["only the top changes", C.amber],
    ], C.amber),
    ...say("6 -> 600", C.amber)
  );

  topLimit = top600;

  // 55. Many formulas start with sigma.
  const top6Again = textAt(
    "6",
    sigX,
    sigY + 1.05,
    30,
    C.amber
  );

  await until(S(55));

  await play(
    new M.FadeOut(topLimit),
    new M.FadeIn(top6Again),
    new M.FadeOut(boxNow),
    ...say("MANY FORMULAS START WITH THIS SIGN", C.cyan)
  );

  topLimit = top6Again;
  boxNow = null;

  // ==========================================================
  // 56-59: THE TRAP - ADDING ORDER NUMBERS
  // ==========================================================

  // 56. Order numbers are numbers too.
  await until(S(56));

  await play(
    new M.LaggedStart(
      onum.map(o => new M.Indicate(o, { color: C.pink })),
      { lagRatio: 0.12, runTime: 1.4 }
    ),
    ...say("TRAP: ORDER NUMBERS ARE NUMBERS TOO", C.pink)
  );

  // 57. Incorrectly adding the order numbers gives 21.
  onum.forEach(o => o.setColor(C.pink));

  await until(S(57));

  await play(
    ...fbox([
      ["1+2+3+4+5+6 = 21", C.pink],
      ["adds the counters: wrong", C.muted],
    ], C.pink),
    ...say("ADDING THE COUNTERS IS WRONG", C.pink)
  );

  // 58. Compare the wrong total with the real prices.
  onum.forEach(o => o.setColor(C.cyan));

  await until(S(58));

  await play(
    ...fbox([
      ["1+2+3+4+5+6 = 21", C.pink],
      ["3+4+5+4+4+3 = 23", C.amber],
    ], C.amber),
    new M.LaggedStart(
      pval.map(v => new M.Indicate(v, { color: C.amber })),
      { lagRatio: 0.12, runTime: 1.5 }
    ),
    ...say("REVENUE IS 23, NOT 21", C.amber)
  );

  // 59. Add what stands to the right of sigma.
  await until(S(59));

  await play(
    new M.Indicate(rightPair.group, { color: C.violet }),
    ...say("ADD WHAT STANDS ON THE RIGHT", C.violet)
  );

  // ==========================================================
  // 60-62: RECAP AND NEXT LESSON
  // ==========================================================

  // 60. Sigma means add up.
  await until(S(60));

  await play(
    new M.FadeOut(boxNow),
    new M.Indicate(sig, { color: C.cyan }),
    ...say("SIGMA = ADD UP", C.cyan)
  );

  boxNow = null;

  // 61. Highlight the three parts of the expression.
  await until(S(61));

  await play(
    new M.Indicate(rightPair.group, { color: C.violet })
  );

  await play(
    new M.Indicate(bot, { color: C.green })
  );

  await play(
    new M.Indicate(topLimit, { color: C.amber })
  );

  // 62. Preview the next lesson.
  await until(S(62));

  await play(
    ...say("NEXT: ORDERS PER HOUR", C.muted)
  );
}
