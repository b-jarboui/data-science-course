// lesson 4.3.5
// Expected transformations: change each value first, then weight by chance.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback not runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data.
  const VALUES = [0, 2, 4];
  const PROBS = [0.25, 0.50, 0.25];
  const FRACTIONS = ['1/4', '1/2', '1/4'];

  const SQUARE = [0, 4, 16];
  const DOUBLE = [0, 4, 8];
  const PLUSONE = [1, 3, 5];

  const SQUARE_WEIGHTED = [0, 2, 4];
  const DOUBLE_WEIGHTED = [0, 2, 2];

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';

  const COL = [GREY, BLUE, BLUE, GOLD];
  const PAYCOL = [GREY, BLUE, GOLD];
  const NAMES = ['GREY', 'EITHER BLUE', 'GOLD'];

  // Laptop + phone layout, consistent with preceding lessons.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const BASE = P ? -4.2 : -2.35;
  const SP = P ? 2.08 : 2.10;
  const MAINY = P ? -0.70 : -0.45;

  const colx = k => CX + (k - 1) * SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o, { runTime: 0.55 }));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o, { runTime: 0.55 }));

  // Track the live picture without regrouping objects on screen.
  let live = [];

  function replacePicture(...objects) {
    const next = objects.flat(Infinity).filter(Boolean);

    const animations = [
      ...fade(live),
      ...appear(next)
    ];

    live = next;
    return animations;
  }

  function addPicture(...objects) {
    const next = objects.flat(Infinity).filter(Boolean);
    live.push(...next);
    return appear(next);
  }

  function removePicture(...objects) {
    const gone = objects.flat(Infinity).filter(Boolean);
    live = live.filter(o => !gone.includes(o));
    return fade(gone);
  }

  // ----------------------------------------------------------
  // Shared drawing helpers.
  // ----------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);
    return t;
  }

  function line(a, b, color = C.muted, sw = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function rect(w, h, x, y, color, opacity = 0.12, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(r, x, y, color, opacity = 0, sw = 2) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);
    const maxw = P ? FW - 1.1 : 6.5;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  function arrow(a, b, color = C.cyan, sw = 3, tip = 0.15) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);

    const ux = dx / d;
    const uy = dy / d;

    const p1 = [
      b[0] - ux * tip - uy * tip * 0.55,
      b[1] - uy * tip + ux * tip * 0.55,
      0
    ];

    const p2 = [
      b[0] - ux * tip + uy * tip * 0.55,
      b[1] - uy * tip - ux * tip * 0.55,
      0
    ];

    return new M.VGroup(
      line(a, b, color, sw),
      line(b, p1, color, sw),
      line(b, p2, color, sw)
    );
  }

  // ----------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ----------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T(
      '0000000000',
      size,
      C.ink,
      true
    ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
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
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.9 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(g, { runTime: 0.55 })
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow, { runTime: 0.55 })
      );
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow, { runTime: 0.55 })
    ];

    boxNow = null;
    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.19) {
    const glow = circle(
      r * 1.45,
      x,
      y,
      GOLD,
      0.11,
      0
    );

    const face = circle(
      r,
      x,
      y,
      GOLD,
      0.88,
      2
    );

    const rim = circle(
      r * 0.73,
      x,
      y,
      '#FFF0B3',
      0,
      1
    );

    const mark = line(
      [x, y - r * 0.35, 0],
      [x, y + r * 0.35, 0],
      '#FFF0B3',
      2
    );

    return new M.VGroup(
      glow,
      face,
      rim,
      mark
    );
  }

  function coinGrid(
    n,
    x,
    y,
    cols = Math.max(1, Math.ceil(Math.sqrt(n))),
    r = 0.15,
    pitch = r * 2.65
  ) {
    if (n === 0) {
      return txt(
        '0',
        29,
        C.muted,
        x,
        y,
        true
      );
    }

    const rows = Math.ceil(n / cols);

    return new M.VGroup(
      ...Array.from({ length: n }, (_, j) => {
        const row = Math.floor(j / cols);
        const col = j % cols;

        const rowCount = Math.min(
          cols,
          n - row * cols
        );

        return coin(
          x + (col - (rowCount - 1) / 2) * pitch,
          y + ((rows - 1) / 2 - row) * pitch,
          r
        );
      })
    );
  }

  function coinRow(n, x, y, r = 0.17) {
    return coinGrid(
      n,
      x,
      y,
      Math.max(1, n),
      r,
      r * 2.65
    );
  }

  // ----------------------------------------------------------
  // Spinner: four equal quarters.
  //
  // Grey:     upper right
  // Blue one: upper left
  // Blue two: lower left
  // Gold:     lower right
  //
  // The spinner and its chances never change in this lesson.
  // Only the payout rule changes.
  // ----------------------------------------------------------

  function polar(cx, cy, r, a) {
    return [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
      0
    ];
  }

  function sector(k, cx, cy, r) {
    const start = k * Math.PI / 2;
    const end = start + Math.PI / 2;

    const points = [[cx, cy, 0]];

    for (let j = 0; j <= 32; j++) {
      points.push(
        polar(
          cx,
          cy,
          r,
          start + (end - start) * j / 32
        )
      );
    }

    const s = new M.Polygon({
      vertices: points,
      color: C.card,
      strokeWidth: 2
    });

    s.setFill(COL[k], 0.87);
    return s;
  }

  function wheel(cx, cy, r, a = Math.PI / 12) {
    const slices = COL.map((_, k) =>
      sector(k, cx, cy, r)
    );

    const rim = circle(
      r + 0.015,
      cx,
      cy,
      C.ink,
      0,
      2.5
    );

    const needle = arrow(
      polar(cx, cy, r * 0.03, a),
      polar(cx, cy, r * 0.87, a),
      C.ink,
      4,
      r * 0.17
    );

    const hub = circle(
      r * 0.075,
      cx,
      cy,
      C.ink,
      1,
      1
    );

    return new M.VGroup(
      ...slices,
      rim,
      needle,
      hub
    );
  }

  // ----------------------------------------------------------
  // 0. The booth tries a new prize: the square prize.
  // ----------------------------------------------------------

  const introWheel = wheel(
    CX,
    P ? -0.10 : -0.15,
    P ? 1.38 : 1.22
  );

  const prizeSign = tag(
    'SQUARE PRIZE',
    C.violet,
    CX,
    P ? -2.22 : -1.94,
    22
  );

  const prizeCoins = coinGrid(
    4,
    CX,
    P ? -3.36 : -2.58,
    4,
    0.16
  );

  await until(S(0));
  await play(
    ...replacePicture(
      introWheel,
      prizeSign,
      prizeCoins
    ),
    ...say('A NEW PRIZE AT THE BOOTH', C.violet)
  );

  // ----------------------------------------------------------
  // 1. The square prize pays the payout times itself.
  //
  // Picture first: a row of coins becomes a square array.
  // Use the blue payout of two as the simple example.
  // ----------------------------------------------------------

  const demoY = P ? -0.60 : -0.45;
  const demoDX = P ? 1.72 : 1.80;

  const demoLeft = coinRow(
    2,
    CX - demoDX,
    demoY,
    0.24
  );

  const demoRight = coinGrid(
    4,
    CX + demoDX,
    demoY,
    2,
    0.24,
    0.64
  );

  const demoLeftLabel = txt(
    'old payout',
    18,
    C.cyan,
    CX - demoDX,
    demoY + 1.05
  );

  const demoRightLabel = txt(
    'square prize',
    18,
    C.violet,
    CX + demoDX,
    demoY + 1.05
  );

  const demoArrow = arrow(
    [CX - 0.80, demoY, 0],
    [CX + 0.80, demoY, 0],
    C.violet,
    3,
    0.20
  );

  const demoRule = tag(
    'TIMES ITSELF',
    C.violet,
    CX,
    demoY - 1.38,
    18
  );

  await until(S(1));
  await play(
    ...replacePicture(
      demoLeft,
      demoRight,
      demoLeftLabel,
      demoRightLabel,
      demoArrow,
      demoRule
    ),
    ...say('PAYOUT × ITSELF', C.violet),
    ...fbox([
      'new payout',
      '= old payout × itself'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // Square-prize cards.
  //
  // Each card has the old payout at the top.
  // A downward arrow applies the square rule.
  // The new payout is drawn as an actual square of coins.
  // ----------------------------------------------------------

  const SQW = P ? 1.91 : 1.94;
  const SQH = P ? 4.20 : 3.72;
  const SQY = P ? -0.96 : -0.62;

  function squareCard(k) {
    const x = colx(k);
    const v = VALUES[k];
    const color = PAYCOL[k];

    const frame = rect(
      SQW,
      SQH,
      x,
      SQY,
      color,
      0.075
    );

    const heading = txt(
      NAMES[k],
      15,
      color,
      x,
      SQY + SQH / 2 - 0.24,
      false,
      SQW - 0.20
    );

    const old = coinRow(
      v,
      x,
      SQY + SQH * 0.30,
      v === 4 ? 0.12 : 0.16
    );

    const oldLabel = txt(
      `${v} tokens`,
      16,
      C.cyan,
      x,
      SQY + SQH * 0.175,
      true
    );

    const rule = arrow(
      [
        x,
        SQY + SQH * 0.11,
        0
      ],
      [
        x,
        SQY + SQH * 0.015,
        0
      ],
      C.violet,
      2.5,
      0.12
    );

    const product = txt(
      `${v} × ${v}`,
      18,
      C.violet,
      x,
      SQY - SQH * 0.04,
      true
    );

    // coins sit in their own band, clear of the product above and the result below
    const reward = coinGrid(
      SQUARE[k],
      x,
      SQY - SQH * 0.255,
      Math.max(1, v),
      v === 4 ? 0.10 : 0.14,
      v === 4 ? 0.25 : 0.33
    );

    const result = txt(
      `= ${SQUARE[k]}`,
      21,
      GOLD,
      x,
      SQY - SQH / 2 + 0.20,
      true
    );

    return {
      frame: new M.VGroup(
        frame,
        heading,
        old,
        oldLabel
      ),

      transformed: new M.VGroup(
        rule,
        product,
        reward,
        result
      )
    };
  }

  const squareCards = VALUES.map((_, k) =>
    squareCard(k)
  );

  // ----------------------------------------------------------
  // 2. Grey: zero times zero is zero.
  // ----------------------------------------------------------

  await until(S(2));
  await play(
    ...replacePicture(
      squareCards.map(c => c.frame),
      squareCards[0].transformed
    ),
    ...say('GREY: ZERO STAYS ZERO', GREY),
    ...fbox([
      ['0 × 0 = 0', GREY]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 3. Blue: two times two is four.
  // ----------------------------------------------------------

  await until(S(3));
  await play(
    ...addPicture(squareCards[1].transformed),
    ...say('BLUE: TWO BECOMES FOUR', BLUE),
    ...fbox([
      '0 × 0 = 0',
      ['2 × 2 = 4', BLUE]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 4. Gold: four times four is sixteen.
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    ...addPicture(squareCards[2].transformed),
    new M.Indicate(squareCards[2].transformed, {
      color: GOLD,
      runTime: 1.1
    }),
    ...say('GOLD: FOUR BECOMES SIXTEEN', GOLD),
    ...fbox([
      '0 × 0 = 0',
      '2 × 2 = 4',
      ['4 × 4 = 16', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 5. Multiplying a number by itself is called squaring.
  // ----------------------------------------------------------

  const squareName = tag(
    'SQUARING = NUMBER × ITSELF',
    C.violet,
    CX,
    P ? -3.77 : -2.80,
    16
  );

  await until(S(5));
  await play(
    ...addPicture(squareName),
    new M.LaggedStart(
      squareCards.map(c =>
        new M.Indicate(c.transformed, {
          color: C.violet
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.7
      }
    ),
    ...say('THIS IS CALLED SQUARING', C.violet),
    ...fbox([
      ['X² = X × X', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 6. What does the square prize pay on average?
  // ----------------------------------------------------------

  const questionCard = rect(
    P ? 5.65 : 5.85,
    P ? 3.05 : 2.65,
    CX,
    MAINY,
    C.amber,
    0.07
  );

  const questionHeading = txt(
    'SQUARE PRIZE',
    21,
    C.violet,
    CX,
    MAINY + 0.91
  );

  const questionValues = txt(
    '0   ·   4   ·   16',
    27,
    GOLD,
    CX,
    MAINY + 0.20,
    true
  );

  const questionMark = txt(
    '?',
    49,
    C.amber,
    CX,
    MAINY - 0.58,
    true
  );

  const questionLabel = txt(
    'long-run average',
    18,
    C.muted,
    CX,
    MAINY - 1.10
  );

  await until(S(6));
  await play(
    ...replacePicture(
      questionCard,
      questionHeading,
      questionValues,
      questionMark,
      questionLabel
    ),
    ...say('WHAT IS THE NEW AVERAGE?', C.amber),
    ...fbox([
      'square prize',
      ['expected payout = ?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 7. A tempting guess:
  // old average = 2
  // square of old average = 4
  //
  // Present four only as an unverified guess.
  // ----------------------------------------------------------

  const guessDX = P ? 1.70 : 1.75;
  const guessY = MAINY;

  const oldMeanCard = new M.VGroup(
    rect(
      2.70,
      2.15,
      CX - guessDX,
      guessY,
      C.cyan,
      0.10
    ),
    txt(
      'OLD MEAN',
      17,
      C.cyan,
      CX - guessDX,
      guessY + 0.70
    ),
    coinRow(
      2,
      CX - guessDX,
      guessY,
      0.22
    ),
    txt(
      '2 tokens',
      20,
      C.ink,
      CX - guessDX,
      guessY - 0.72,
      true
    )
  );

  const guessCard = new M.VGroup(
    rect(
      2.70,
      2.15,
      CX + guessDX,
      guessY,
      C.amber,
      0.10
    ),
    txt(
      'GUESS',
      17,
      C.amber,
      CX + guessDX,
      guessY + 0.70
    ),
    coinGrid(
      4,
      CX + guessDX,
      guessY,
      2,
      0.18,
      0.45
    ),
    txt(
      '4 tokens?',
      20,
      C.amber,
      CX + guessDX,
      guessY - 0.72,
      true
    )
  );

  const guessArrow = arrow(
    [CX - 0.32, guessY, 0],
    [CX + 0.32, guessY, 0],
    C.violet,
    3,
    0.14
  );

  const guessRule = txt(
    'square',
    15,
    C.violet,
    CX,
    guessY + 0.30
  );

  await until(S(7));
  await play(
    ...replacePicture(
      oldMeanCard,
      guessCard,
      guessArrow,
      guessRule
    ),
    ...say('A TEMPTING GUESS: 2² = 4?', C.amber),
    ...fbox([
      'old mean = 2',
      ['2 × 2 = 4 ?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 8. Check the guess step by step.
  // ----------------------------------------------------------

  await until(S(8));
  await play(
    ...say('LET’S CHECK THE GUESS', C.green)
  );

  // ----------------------------------------------------------
  // 9. The spinner and its chances do not change.
  // ----------------------------------------------------------

  const sameWheelY = P ? -0.25 : -0.20;
  const sameWheelR = P ? 1.47 : 1.33;

  const sameWheel = wheel(
    CX,
    sameWheelY,
    sameWheelR
  );

  const wheelChances = COL.map((_, k) => {
    const a = Math.PI / 4 + k * Math.PI / 2;

    const p = polar(
      CX,
      sameWheelY,
      sameWheelR * 0.60,
      a
    );

    return txt(
      '1/4',
      P ? 22 : 20,
      '#FFFFFF',
      p[0],
      p[1],
      true
    );
  });

  const unchangedTag = tag(
    'SAME SPINNER',
    C.green,
    CX,
    P ? -2.43 : -2.03,
    19
  );

  await until(S(9));
  await play(
    ...replacePicture(
      sameWheel,
      wheelChances,
      unchangedTag
    ),
    ...say('THE CHANCES DO NOT CHANGE', C.green),
    ...fbox([
      'same 4 equal slices',
      ['same 1/4 each', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 10. The payout chances remain 1/4, 1/2, 1/4.
  //
  // Show four equal pieces of chance grouped into three piles.
  // ----------------------------------------------------------

  const chanceY = P ? -0.95 : -0.65;
  const chanceBase = P ? -2.25 : -1.57;
  const chanceW = P ? 0.88 : 0.83;
  const chanceH = P ? 1.16 : 0.83;

  function chanceBlock(k, j) {
    const x = colx(k);
    const y = chanceBase + (j + 0.5) * chanceH;

    const glow = new M.Rectangle({
      width: chanceW + 0.18,
      height: chanceH + 0.02,
      color: C.cyan,
      strokeWidth: 0
    });

    glow.setFill(C.cyan, 0.09);
    glow.moveTo([x, y, 0]);

    const b = new M.Rectangle({
      width: chanceW,
      height: chanceH - 0.04,
      color: C.cyan,
      strokeWidth: 2
    });

    b.setFill(C.cyan, 0.75);
    b.moveTo([x, y, 0]);

    const q = txt(
      '1/4',
      19,
      C.ink,
      x,
      y,
      true
    );

    return new M.VGroup(
      glow,
      b,
      q
    );
  }

  const chanceBlocks = [
    chanceBlock(0, 0),
    chanceBlock(1, 0),
    chanceBlock(1, 1),
    chanceBlock(2, 0)
  ];

  const chanceFloor = line(
    [CX - 3.05, chanceBase, 0],
    [CX + 3.05, chanceBase, 0],
    C.muted,
    2
  );

  const chanceLabels = FRACTIONS.map((f, k) =>
    txt(
      f,
      23,
      C.cyan,
      colx(k),
      chanceBase +
        chanceH * (k === 1 ? 2 : 1) +
        0.30,
      true
    )
  );

  const chanceNames = NAMES.map((s, k) =>
    txt(
      s,
      15,
      PAYCOL[k],
      colx(k),
      chanceBase - 0.34,
      false,
      1.9
    )
  );

  await until(S(10));
  await play(
    ...replacePicture(
      chanceFloor,
      chanceBlocks,
      chanceLabels,
      chanceNames
    ),
    ...say('SAME CHANCES: 1/4 · 1/2 · 1/4'),
    ...fbox([
      'grey: 1/4',
      'blue: 1/2',
      'gold: 1/4'
    ])
  );

  // ----------------------------------------------------------
  // Weighted-payout cards.
  //
  // Picture of each transformed prize at the top.
  // Its unchanged chance below.
  // A separate result appears when multiplication is narrated.
  // ----------------------------------------------------------

  const WEIGHTW = P ? 1.92 : 1.94;
  const WEIGHTH = P ? 4.22 : 3.74;
  const WEIGHTY = P ? -0.87 : -0.57;

  function weightedCard(k, values, color = C.violet) {
    const x = colx(k);
    const v = values[k];

    const frame = rect(
      WEIGHTW,
      WEIGHTH,
      x,
      WEIGHTY,
      PAYCOL[k],
      0.07
    );

    const heading = txt(
      NAMES[k],
      15,
      PAYCOL[k],
      x,
      WEIGHTY + WEIGHTH / 2 - 0.23,
      false,
      WEIGHTW - 0.15
    );

    const reward = coinGrid(
      v,
      x,
      WEIGHTY + WEIGHTH * 0.24,
      v === 16 ? 4 : Math.max(1, Math.min(v, 4)),
      v >= 8 ? 0.108 : 0.13,
      v >= 8 ? 0.275 : 0.33
    );

    const payout = txt(
      `${v} tokens`,
      18,
      color,
      x,
      WEIGHTY + WEIGHTH * 0.055,
      true
    );

    const times = txt(
      '×',
      22,
      C.muted,
      x,
      WEIGHTY - WEIGHTH * 0.055,
      true
    );

    const chance = txt(
      FRACTIONS[k],
      25,
      C.cyan,
      x,
      WEIGHTY - WEIGHTH * 0.17,
      true
    );

    const separator = line(
      [
        x - WEIGHTW * 0.36,
        WEIGHTY - WEIGHTH * 0.28,
        0
      ],
      [
        x + WEIGHTW * 0.36,
        WEIGHTY - WEIGHTH * 0.28,
        0
      ],
      C.muted,
      1.5
    );

    const result = txt(
      String(v * PROBS[k]),
      32,
      GOLD,
      x,
      WEIGHTY - WEIGHTH * 0.39,
      true
    );

    return {
      base: new M.VGroup(
        frame,
        heading,
        reward,
        payout,
        times,
        chance,
        separator
      ),

      result
    };
  }

  const squareWeights = VALUES.map((_, k) =>
    weightedCard(k, SQUARE, C.violet)
  );

  // ----------------------------------------------------------
  // 11. Only the payouts change: 0, 4, 16.
  // ----------------------------------------------------------

  await until(S(11));
  await play(
    ...replacePicture(
      squareWeights.map(c => c.base)
    ),
    ...say('ONLY THE PAYOUTS CHANGE', C.violet),
    ...fbox([
      ['new payouts: 0, 4, 16', C.violet],
      'same chances as before'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 12. Zero times a quarter is zero.
  // ----------------------------------------------------------

  await until(S(12));
  await play(
    ...addPicture(squareWeights[0].result),
    new M.Indicate(squareWeights[0].base, {
      color: GREY,
      runTime: 0.65
    }),
    ...say('0 × 1/4 = 0', GREY),
    ...fbox([
      ['0 × 1/4 = 0', GOLD]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 13. Four times a half is two.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    ...addPicture(squareWeights[1].result),
    new M.Indicate(squareWeights[1].base, {
      color: BLUE,
      runTime: 0.55
    }),
    ...say('4 × 1/2 = 2', BLUE),
    ...fbox([
      '0 × 1/4 = 0',
      ['4 × 1/2 = 2', GOLD]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 14. Sixteen times a quarter is four.
  // ----------------------------------------------------------

  await until(S(14));
  await play(
    ...addPicture(squareWeights[2].result),
    new M.Indicate(squareWeights[2].base, {
      color: GOLD,
      runTime: 0.65
    }),
    ...say('16 × 1/4 = 4', GOLD),
    ...fbox([
      '0 × 1/4 = 0',
      '4 × 1/2 = 2',
      ['16 × 1/4 = 4', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 15. Add the weighted results: zero plus two plus four.
  // ----------------------------------------------------------

  const squareTotal = tag(
    '0 + 2 + 4 = 6',
    GOLD,
    CX,
    P ? -3.47 : -2.69,
    20
  );

  await until(S(15));
  await play(
    ...addPicture(squareTotal),
    new M.LaggedStart(
      squareWeights.map(c =>
        new M.Indicate(c.result, {
          color: GOLD
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    ...say('ADD THE WEIGHTED PAYOUTS', C.amber),
    ...fbox([
      '0 + 2 + 4',
      ['= 6 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 16. The correct expected value is six, not four.
  // ----------------------------------------------------------

  const resultY = P ? -0.62 : -0.42;
  const resultDX = P ? 1.65 : 1.70;

  function resultCard(x, title, n, color, note) {
    const w = P ? 2.95 : 2.98;
    const h = P ? 3.10 : 2.70;

    const r = rect(
      w,
      h,
      x,
      resultY,
      color,
      0.075
    );

    const titleText = txt(
      title,
      17,
      color,
      x,
      resultY + h / 2 - 0.32,
      false,
      w - 0.20
    );

    const reward = coinGrid(
      n,
      x,
      resultY + 0.12,
      n === 6 ? 3 : 2,
      0.21,
      0.52
    );

    const amount = txt(
      `${n} tokens`,
      25,
      color,
      x,
      resultY - 0.70,
      true
    );

    const footer = txt(
      note,
      16,
      C.muted,
      x,
      resultY - h / 2 + 0.24,
      false,
      w - 0.20
    );

    return new M.VGroup(
      r,
      titleText,
      reward,
      amount,
      footer
    );
  }

  const actualResult = resultCard(
    CX - resultDX,
    'CORRECT MEAN',
    6,
    C.green,
    'square each payout'
  );

  const wrongResult = resultCard(
    CX + resultDX,
    'WRONG GUESS',
    4,
    C.amber,
    'square the old mean'
  );

  const notEqual = txt(
    '≠',
    31,
    C.amber,
    CX,
    resultY,
    true
  );

  await until(S(16));
  await play(
    ...replacePicture(
      actualResult,
      wrongResult,
      notEqual
    ),
    ...say('THE NEW MEAN IS SIX, NOT FOUR', C.green),
    ...fbox([
      ['correct: 6 tokens', C.green],
      ['guess: 4 tokens', C.amber]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 17. Why is the guess wrong? Look at gold.
  // ----------------------------------------------------------

  const goldDemoY = P ? -0.65 : -0.45;
  const goldDemoDX = P ? 1.72 : 1.80;

  const originalGold = coinGrid(
    4,
    CX - goldDemoDX,
    goldDemoY,
    4,
    0.21,
    0.53
  );

  const originalGoldFrame = outline(
    2.65,
    P ? 2.70 : 2.35,
    CX - goldDemoDX,
    goldDemoY,
    GOLD
  );

  const originalGoldTitle = txt(
    'OLD GOLD PAYOUT',
    16,
    GOLD,
    CX - goldDemoDX,
    goldDemoY + 0.99,
    false,
    2.45
  );

  const originalGoldLabel = txt(
    '4 tokens',
    23,
    GOLD,
    CX - goldDemoDX,
    goldDemoY - 0.93,
    true
  );

  const waitingGoldFrame = outline(
    2.75,
    P ? 2.70 : 2.35,
    CX + goldDemoDX,
    goldDemoY,
    C.violet
  );

  const waitingGoldTitle = txt(
    'SQUARE PRIZE',
    17,
    C.violet,
    CX + goldDemoDX,
    goldDemoY + 0.99
  );

  const goldQuestion = txt(
    '?',
    38,
    C.violet,
    CX + goldDemoDX,
    goldDemoY,
    true
  );

  await until(S(17));
  await play(
    ...replacePicture(
      originalGold,
      originalGoldFrame,
      originalGoldTitle,
      originalGoldLabel,
      waitingGoldFrame,
      waitingGoldTitle,
      goldQuestion
    ),
    ...say('WHY? LOOK AT THE BIG GOLD PRIZE', GOLD),
    ...fbox([
      'gold originally pays',
      ['4 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 18. Squaring makes the big payout much bigger.
  // Four becomes sixteen.
  //
  // Keep the original four coins visible.
  // Build the transformed 4 × 4 square row by row.
  // ----------------------------------------------------------

  const goldSquareRows = [];

  for (let row = 0; row < 4; row++) {
    const y =
      goldDemoY + (1.5 - row) * 0.40;

    goldSquareRows.push(
      coinRow(
        4,
        CX + goldDemoDX,
        y,
        0.15
      )
    );
  }

  const newGoldLabel = txt(
    '16 tokens',
    23,
    GOLD,
    CX + goldDemoDX,
    goldDemoY - 0.93,
    true
  );

  const squareArrow = arrow(
    [
      CX - 0.33,
      goldDemoY,
      0
    ],
    [
      CX + 0.33,
      goldDemoY,
      0
    ],
    C.violet,
    3,
    0.14
  );

  const squareArrowLabel = txt(
    '× 4',
    17,
    C.violet,
    CX,
    goldDemoY + 0.32,
    true
  );

  await until(S(18));

  live.push(...goldSquareRows);

  await play(
    ...removePicture(goldQuestion),
    new M.LaggedStart(
      goldSquareRows.map(r =>
        new M.FadeIn(r)
      ),
      {
        lagRatio: 0.28,
        runTime: 2.1
      }
    ),
    ...addPicture(
      newGoldLabel,
      squareArrow,
      squareArrowLabel
    ),
    ...say('SQUARING AMPLIFIES THE BIG VALUES', GOLD),
    ...fbox([
      '4 × 4',
      ['= 16 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 19. That one big prize pulls the average up.
  //
  // Show the weighted contributions:
  // old mean:    0 + 1 + 1 = 2
  // square mean: 0 + 2 + 4 = 6
  //
  // Use equal-size token units so the growth is visible.
  // ----------------------------------------------------------

  const contributionX = [
    CX - 1.57,
    CX,
    CX + 1.57
  ];

  const contributionTop = P ? 0.45 : 0.55;
  const contributionBottom = P ? -1.95 : -1.6;

  function contributionRow(values, y, color, title) {
    const parts = [
      txt(
        title,
        18,
        color,
        CX,
        y + 0.78
      )
    ];

    // bigger coins (4 coins as a 2 x 2 block) and big value labels
    values.forEach((v, k) => {
      parts.push(
        coinGrid(
          v,
          contributionX[k],
          y,
          v === 4 ? 2 : Math.max(1, v),
          0.19,
          0.48
        )
      );

      parts.push(
        txt(
          String(v),
          26,
          GOLD,
          contributionX[k],
          y - 0.78,
          true
        )
      );
    });

    return parts;
  }

  const oldContributions = contributionRow(
    [0, 1, 1],
    contributionTop,
    C.cyan,
    'ORIGINAL WEIGHTED PAYOUTS'
  );

  const newContributions = contributionRow(
    [0, 2, 4],
    contributionBottom,
    C.violet,
    'SQUARED WEIGHTED PAYOUTS'
  );

  const goldContributionFrame = outline(
    1.36,
    1.6,
    contributionX[2],
    contributionBottom - 0.25,
    GOLD
  );

  const meanRise = tag(
    'MEAN: 2 → 6',
    C.green,
    CX,
    P ? -3.6 : -2.95,
    20
  );

  await until(S(19));
  await play(
    ...replacePicture(
      oldContributions,
      newContributions,
      goldContributionFrame,
      meanRise
    ),
    ...say('THE BIG PRIZE PULLS THE MEAN UP', GOLD),
    ...fbox([
      'old: 0 + 1 + 1 = 2',
      ['new: 0 + 2 + 4 = 6', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // Transformation pipeline.
  //
  // Original payout → rule → new payout.
  // Chances are shown separately and remain unchanged.
  // ----------------------------------------------------------

  const PIPEY = P ? -0.65 : -0.48;
  const PIPELX = CX - 2.05;
  const PIPERX = CX + 2.05;
  const PIPESP = P ? 1.03 : 0.82;

  const pipeRowY = k =>
    PIPEY + (1 - k) * PIPESP;

  function numberNode(v, x, y, color, w = 1.32) {
    const r = rect(
      w,
      P ? 0.77 : 0.63,
      x,
      y,
      color,
      0.12
    );

    const t = txt(
      String(v),
      27,
      color,
      x,
      y,
      true
    );

    return new M.VGroup(r, t);
  }

  function makePipeline(values, ruleText) {
    const headingY =
      pipeRowY(0) + (P ? 0.67 : 0.56);

    const oldHeading = txt(
      'OLD PAYOUT',
      16,
      C.cyan,
      PIPELX,
      headingY
    );

    const newHeading = txt(
      'NEW PAYOUT',
      16,
      C.violet,
      PIPERX,
      headingY
    );

    const ruleHeading = txt(
      ruleText,
      19,
      C.violet,
      CX,
      headingY,
      true
    );

    const left = VALUES.map((v, k) =>
      numberNode(
        v,
        PIPELX,
        pipeRowY(k),
        C.cyan
      )
    );

    const right = values.map((v, k) =>
      numberNode(
        v,
        PIPERX,
        pipeRowY(k),
        C.violet
      )
    );

    const links = VALUES.map((_, k) =>
      arrow(
        [
          PIPELX + 0.78,
          pipeRowY(k),
          0
        ],
        [
          PIPERX - 0.78,
          pipeRowY(k),
          0
        ],
        PAYCOL[k],
        3,
        0.15
      )
    );

    const middleLabels = FRACTIONS.map((f, k) =>
      txt(
        f,
        16,
        C.muted,
        CX,
        pipeRowY(k) - 0.27,
        true
      )
    );

    return {
      oldHeading,
      newHeading,
      ruleHeading,
      left,
      right,
      links,
      middleLabels
    };
  }

  const pipeParts = p => [
    p.oldHeading,
    p.newHeading,
    p.ruleHeading,
    ...p.left,
    ...p.right,
    ...p.links,
    ...p.middleLabels
  ];

  let pipeline = makePipeline(
    SQUARE,
    'x × x'
  );

  // ----------------------------------------------------------
  // 20. Changing a payout with a rule is a transformation.
  // ----------------------------------------------------------

  await until(S(20));
  await play(
    ...replacePicture(pipeParts(pipeline)),
    ...say('CHANGING A VALUE = TRANSFORMATION', C.violet),
    ...fbox([
      ['transformation', C.violet],
      'old value → new value'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 21. To find the new mean, change each payout first.
  // ----------------------------------------------------------

  const transformOutline = outline(
    1.65,
    2 * PIPESP + (P ? 1.02 : 0.85),
    PIPERX,
    PIPEY,
    C.violet
  );

  const stepOne = tag(
    'STEP 1: CHANGE EACH VALUE',
    C.violet,
    CX,
    P ? -3.05 : -2.26,
    17
  );

  await until(S(21));
  await play(
    ...addPicture(transformOutline, stepOne),
    new M.LaggedStart(
      pipeline.right.map(n =>
        new M.Indicate(n, {
          color: C.violet
        })
      ),
      {
        lagRatio: 0.22,
        runTime: 2.1
      }
    ),
    ...say('STEP 1: CHANGE EACH PAYOUT', C.violet),
    ...fbox([
      '0 → 0',
      '2 → 4',
      ['4 → 16', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 22. Then weight by the chances and add, as before.
  // ----------------------------------------------------------

  function weightedEquationRow(k, values, y) {
    const x0 = CX - 2.25;
    const x1 = CX;
    const x2 = CX + 2.25;

    const value = numberNode(
      values[k],
      x0,
      y,
      C.violet,
      1.34
    );

    const probability = numberNode(
      FRACTIONS[k],
      x1,
      y,
      C.cyan,
      1.34
    );

    const contribution = numberNode(
      values[k] * PROBS[k],
      x2,
      y,
      GOLD,
      1.34
    );

    const times = txt(
      '×',
      22,
      C.muted,
      CX - 1.13,
      y,
      true
    );

    const equals = txt(
      '=',
      22,
      C.muted,
      CX + 1.13,
      y,
      true
    );

    return new M.VGroup(
      value,
      probability,
      contribution,
      times,
      equals
    );
  }

  const weightedEquationRows = SQUARE.map((_, k) =>
    weightedEquationRow(
      k,
      SQUARE,
      pipeRowY(k)
    )
  );

  const weightHeadings = [
    txt(
      'NEW VALUE',
      15,
      C.violet,
      CX - 2.25,
      pipeRowY(0) + 0.64
    ),
    txt(
      'CHANCE',
      15,
      C.cyan,
      CX,
      pipeRowY(0) + 0.64
    ),
    txt(
      'WEIGHTED',
      15,
      GOLD,
      CX + 2.25,
      pipeRowY(0) + 0.64
    )
  ];

  const stepTwo = tag(
    'STEP 2: WEIGHT AND ADD',
    C.green,
    CX,
    P ? -3.07 : -2.28,
    17
  );

  await until(S(22));
  await play(
    ...replacePicture(
      weightedEquationRows,
      weightHeadings,
      stepTwo
    ),
    ...say('STEP 2: WEIGHT BY CHANCE AND ADD', C.green),
    ...fbox([
      '0 × 1/4 + 4 × 1/2',
      '        + 16 × 1/4',
      ['= 6', GOLD]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 23. The short version, in one line.
  // ----------------------------------------------------------

  await until(S(23));
  await play(
    ...say('THE SHORT VERSION'),
    ...fbox([
      'order matters'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 24. X squared means X times X.
  // ----------------------------------------------------------

  const notationY = P ? -0.47 : -0.40;

  const notationFrame = rect(
    P ? 5.80 : 6.00,
    P ? 2.95 : 2.55,
    CX,
    notationY,
    C.violet,
    0.075
  );

  const notationTitle = txt(
    'THE SQUARE PRIZE',
    20,
    C.violet,
    CX,
    notationY + 0.85
  );

  const notationMain = txt(
    'X² = X × X',
    P ? 38 : 36,
    C.violet,
    CX,
    notationY,
    true,
    5.30
  );

  const notationCaption = txt(
    'Multiply the payout by itself',
    18,
    C.ink,
    CX,
    notationY - 0.87,
    false,
    5.35
  );

  await until(S(24));
  await play(
    ...replacePicture(
      notationFrame,
      notationTitle,
      notationMain,
      notationCaption
    ),
    ...say('X SQUARED = X TIMES X', C.violet),
    ...fbox([
      ['X² = X × X', C.violet],
      'square prize'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // Side-by-side comparison of two different calculation orders.
  //
  // Left:  square each payout, then take the mean.
  // Right: take the mean, then square that one number.
  // ----------------------------------------------------------

  const CMPDX = P ? 1.68 : 1.71;
  const CMPW = P ? 3.04 : 3.06;
  const CMPH = P ? 4.40 : 3.78;
  const CMPY = P ? -0.88 : -0.62;

  function orderCard(x, correct) {
    const color = correct ? C.green : C.amber;

    const frame = rect(
      CMPW,
      CMPH,
      x,
      CMPY,
      color,
      0.07
    );

    const heading = txt(
      correct ? 'SQUARE FIRST' : 'MEAN FIRST',
      17,
      color,
      x,
      CMPY + CMPH / 2 - 0.28,
      false,
      CMPW - 0.24
    );

    const original = txt(
      '0, 2, 4',
      22,
      C.cyan,
      x,
      CMPY + CMPH * 0.28,
      true
    );

    const firstArrow = arrow(
      [
        x,
        CMPY + CMPH * 0.20,
        0
      ],
      [
        x,
        CMPY + CMPH * 0.085,
        0
      ],
      C.violet,
      2,
      0.12
    );

    const firstStep = txt(
      correct ? 'square' : 'mean',
      15,
      C.violet,
      x + 0.62,
      CMPY + CMPH * 0.145
    );

    const intermediate = txt(
      correct ? '0, 4, 16' : '2',
      23,
      C.violet,
      x,
      CMPY + CMPH * 0.025,
      true
    );

    const secondArrow = arrow(
      [
        x,
        CMPY - CMPH * 0.055,
        0
      ],
      [
        x,
        CMPY - CMPH * 0.17,
        0
      ],
      color,
      2,
      0.12
    );

    const secondStep = txt(
      correct ? 'mean' : 'square',
      15,
      color,
      x + 0.62,
      CMPY - CMPH * 0.11
    );

    const result = txt(
      correct ? '6' : '4',
      36,
      color,
      x,
      CMPY - CMPH * 0.24,
      true
    );

    const formula = txt(
      correct ? 'E[X²] = 6' : '(E[X])² = 4',
      21,
      color,
      x,
      CMPY - CMPH / 2 + 0.27,
      true,
      CMPW - 0.23
    );

    return new M.VGroup(
      frame,
      heading,
      original,
      firstArrow,
      firstStep,
      intermediate,
      secondArrow,
      secondStep,
      result,
      formula
    );
  }

  const squareFirstCard = orderCard(
    CX - CMPDX,
    true
  );

  const meanFirstCard = orderCard(
    CX + CMPDX,
    false
  );

  // ----------------------------------------------------------
  // 25. E[X²] = 6.
  // Square first, then take expected value.
  // ----------------------------------------------------------

  await until(S(25));
  await play(
    ...replacePicture(squareFirstCard),
    ...say('SQUARE FIRST, THEN TAKE THE MEAN', C.green),
    ...fbox([
      ['E[X²] = 6', C.green],
      'square each value',
      'then take its mean'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 26. (E[X])² = 4.
  // Take expected value first, then square.
  // ----------------------------------------------------------

  await until(S(26));
  await play(
    ...addPicture(meanFirstCard),
    ...say('MEAN FIRST, THEN SQUARE', C.amber),
    ...fbox([
      ['(E[X])² = 4', C.amber],
      'mean = 2',
      'then square: 2² = 4'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 27. The mean of the squares differs from
  // the square of the mean. The order matters.
  // ----------------------------------------------------------

  const orderNotEqual = txt(
    '≠',
    26,
    C.amber,
    CX,
    CMPY - CMPH * 0.24,
    true
  );

  const orderWarning = tag(
    'THE ORDER MATTERS',
    C.amber,
    CX,
    P ? -3.57 : -2.76,
    17
  );

  await until(S(27));
  await play(
    ...addPicture(orderNotEqual, orderWarning),
    new M.Indicate(squareFirstCard, {
      color: C.green,
      runTime: 1.1
    }),
    new M.Indicate(meanFirstCard, {
      color: C.amber,
      runTime: 1.1
    }),
    ...say('MEAN OF SQUARES ≠ SQUARE OF MEAN', C.amber),
    ...fbox([
      ['E[X²] = 6', C.green],
      ['(E[X])² = 4', C.amber],
      '6 ≠ 4'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 28. A gentler rule: the double prize.
  //
  // The new rule is 2X.
  // Each payout gets an identical copy of itself.
  // ----------------------------------------------------------

  const doubleDemoY = P ? -0.56 : -0.43;

  const doubleOriginal = coinRow(
    2,
    CX - 1.78,
    doubleDemoY,
    0.23
  );

  const doubleCopyTop = coinRow(
    2,
    CX + 1.78,
    doubleDemoY + 0.30,
    0.21
  );

  const doubleCopyBottom = coinRow(
    2,
    CX + 1.78,
    doubleDemoY - 0.30,
    0.21
  );

  const doubleOriginalLabel = txt(
    'old payout',
    18,
    C.cyan,
    CX - 1.78,
    doubleDemoY + 1.02
  );

  const doubleNewLabel = txt(
    'double prize',
    18,
    C.green,
    CX + 1.78,
    doubleDemoY + 1.02
  );

  const doubleDemoArrow = arrow(
    [
      CX - 0.80,
      doubleDemoY,
      0
    ],
    [
      CX + 0.80,
      doubleDemoY,
      0
    ],
    C.green,
    3,
    0.20
  );

  const doubleDemoTag = tag(
    'MAKE TWO COPIES',
    C.green,
    CX,
    doubleDemoY - 1.34,
    18
  );

  await until(S(28));
  await play(
    ...replacePicture(
      doubleOriginal,
      doubleCopyTop,
      doubleCopyBottom,
      doubleOriginalLabel,
      doubleNewLabel,
      doubleDemoArrow,
      doubleDemoTag
    ),
    ...say('NEW RULE: THE DOUBLE PRIZE', C.green),
    ...fbox([
      ['double prize = 2X', C.green],
      'twice every payout'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 29. Payouts become zero, four and eight.
  // ----------------------------------------------------------

  pipeline = makePipeline(
    DOUBLE,
    '2 × x'
  );

  await until(S(29));
  await play(
    ...replacePicture(pipeParts(pipeline)),
    ...say('DOUBLE PAYOUTS: 0, 4, 8', C.green),
    ...fbox([
      '0 × 2 = 0',
      '2 × 2 = 4',
      ['4 × 2 = 8', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 30. Weight each doubled payout by its unchanged chance.
  //
  // 0 × 1/4 = 0
  // 4 × 1/2 = 2
  // 8 × 1/4 = 2
  // ----------------------------------------------------------

  const doubleWeights = VALUES.map((_, k) =>
    weightedCard(k, DOUBLE, C.green)
  );

  await until(S(30));
  await play(
    ...replacePicture(
      doubleWeights.map(c => c.base)
    ),
    ...say('SAME CHANCES, DOUBLED PAYOUTS', C.green),
    ...fbox([
      ['0 × 1/4 = 0', GOLD],
      '4 × 1/2 = 2',
      '8 × 1/4 = 2'
    ], C.green)
  );

  live.push(
    ...doubleWeights.map(c => c.result)
  );

  await play(
    new M.LaggedStart(
      doubleWeights.map(c =>
        new M.FadeIn(c.result)
      ),
      {
        lagRatio: 0.55,
        runTime: 3.0
      }
    )
  );

  // ----------------------------------------------------------
  // 31. Zero plus two plus two makes four.
  // ----------------------------------------------------------

  const doubleTotal = tag(
    '0 + 2 + 2 = 4',
    GOLD,
    CX,
    P ? -3.47 : -2.69,
    20
  );

  await until(S(31));
  await play(
    ...addPicture(doubleTotal),
    ...say('THE DOUBLE PRIZE AVERAGES FOUR', C.green),
    ...fbox([
      '0 + 2 + 2',
      ['= 4 tokens', GOLD]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 32. Two times the old mean is also four.
  // This time the shortcut works.
  // ----------------------------------------------------------

  const shortcutY = P ? -0.65 : -0.45;
  const shortcutDX = P ? 1.67 : 1.70;

  function shortcutCard(x, heading, note, color) {
    const w = P ? 3.00 : 3.03;
    const h = P ? 3.20 : 2.70;

    const frame = rect(
      w,
      h,
      x,
      shortcutY,
      color,
      0.08
    );

    const title = txt(
      heading,
      16,
      color,
      x,
      shortcutY + h / 2 - 0.30,
      false,
      w - 0.20
    );

    const reward = coinGrid(
      4,
      x,
      shortcutY + 0.10,
      2,
      0.22,
      0.55
    );

    const value = txt(
      '4 tokens',
      24,
      GOLD,
      x,
      shortcutY - 0.71,
      true
    );

    const footer = txt(
      note,
      17,
      color,
      x,
      shortcutY - h / 2 + 0.25,
      false,
      w - 0.20
    );

    return new M.VGroup(
      frame,
      title,
      reward,
      value,
      footer
    );
  }

  const fullDouble = shortcutCard(
    CX - shortcutDX,
    'DOUBLE VALUES FIRST',
    '0 + 2 + 2 = 4',
    C.green
  );

  const directDouble = shortcutCard(
    CX + shortcutDX,
    'DOUBLE MEAN FIRST',
    '2 × 2 = 4',
    C.green
  );

  const shortcutEquals = txt(
    '=',
    27,
    C.green,
    CX,
    shortcutY,
    true
  );

  const shortcutWorks = tag(
    'THE SHORTCUT WORKS',
    C.green,
    CX,
    P ? -3.02 : -2.27,
    18
  );

  await until(S(32));
  await play(
    ...replacePicture(
      fullDouble,
      directDouble,
      shortcutEquals,
      shortcutWorks
    ),
    ...say('DOUBLING THE MEAN ALSO WORKS', C.green),
    ...fbox([
      'E[2X] = 2E[X]',
      ['= 2 × 2 = 4', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 33. Doubling or adding the same amount to each value
  // is a straight-line change.
  // ----------------------------------------------------------

  const linearY = P ? -0.65 : -0.43;
  const linearDX = P ? 1.68 : 1.71;

  function linearRuleCard(
    x,
    title,
    rule,
    values,
    color
  ) {
    const w = P ? 3.02 : 3.05;
    const h = P ? 3.65 : 3.03;

    const frame = rect(
      w,
      h,
      x,
      linearY,
      color,
      0.08
    );

    const titleText = txt(
      title,
      17,
      color,
      x,
      linearY + h / 2 - 0.30,
      false,
      w - 0.20
    );

    const ruleText = txt(
      rule,
      23,
      color,
      x,
      linearY + h * 0.20,
      true
    );

    const oldValues = txt(
      '0, 2, 4',
      21,
      C.cyan,
      x,
      linearY - h * 0.005,
      true
    );

    const down = arrow(
      [
        x,
        linearY - h * 0.075,
        0
      ],
      [
        x,
        linearY - h * 0.20,
        0
      ],
      color,
      2.5,
      0.13
    );

    const newValues = txt(
      values.join(', '),
      23,
      color,
      x,
      linearY - h * 0.32,
      true
    );

    return new M.VGroup(
      frame,
      titleText,
      ruleText,
      oldValues,
      down,
      newValues
    );
  }

  const doubleRuleCard = linearRuleCard(
    CX - linearDX,
    'DOUBLE EVERY PAYOUT',
    '2X',
    DOUBLE,
    C.green
  );

  const addRuleCard = linearRuleCard(
    CX + linearDX,
    'ADD ONE TO EVERY PAYOUT',
    'X + 1',
    PLUSONE,
    C.green
  );

  await until(S(33));
  await play(
    ...replacePicture(
      doubleRuleCard,
      addRuleCard
    ),
    ...say('STRAIGHT-LINE CHANGES', C.green),
    ...fbox([
      'multiply by a constant',
      'or add a constant',
      ['straight-line rule', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 34. Draw the rules on a graph.
  //
  // Horizontal axis: original payout.
  // Vertical axis: transformed payout.
  //
  // y = 2x and y = x + 1 are straight lines.
  // y = x² bends.
  //
  // The curves show the transformation rules, not probabilities.
  // ----------------------------------------------------------

  const GRAPHW = P ? 5.15 : 5.25;
  const GRAPHH = P ? 4.80 : 3.20;

  const GRAPHLEFT = CX - GRAPHW / 2 + 0.12;
  const GRAPHBASE = P ? -3.47 : -2.12;

  const gx = v =>
    GRAPHLEFT + v / 4 * GRAPHW;

  const gy = v =>
    GRAPHBASE + v / 16 * GRAPHH;

  const graphPoint = (x, y) => [
    gx(x),
    gy(y),
    0
  ];

  function makeTransformAxes() {
    const axisX = line(
      graphPoint(0, 0),
      [gx(4) + 0.16, GRAPHBASE, 0],
      C.muted,
      2
    );

    const axisY = line(
      graphPoint(0, 0),
      [GRAPHLEFT, gy(16) + 0.11, 0],
      C.muted,
      2
    );

    const ticksX = [0, 1, 2, 3, 4].map(v =>
      new M.VGroup(
        line(
          [gx(v), GRAPHBASE - 0.05, 0],
          [gx(v), GRAPHBASE + 0.05, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          16,
          C.muted,
          gx(v),
          GRAPHBASE - 0.24,
          true
        )
      )
    );

    const ticksY = [0, 4, 8, 12, 16].map(v =>
      new M.VGroup(
        line(
          [GRAPHLEFT - 0.05, gy(v), 0],
          [GRAPHLEFT + 0.05, gy(v), 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          16,
          C.muted,
          GRAPHLEFT - 0.25,
          gy(v),
          true
        )
      )
    );

    const guides = [4, 8, 12, 16].map(v =>
      dashed(
        graphPoint(0, v),
        graphPoint(4, v),
        C.muted
      )
    );

    const xLabel = txt(
      'old payout',
      16,
      C.muted,
      CX,
      GRAPHBASE - 0.66
    );

    const yLabel = txt(
      'new payout',
      16,
      C.muted,
      CX,
      gy(16) + 0.36
    );

    return [
      axisX,
      axisY,
      ...ticksX,
      ...ticksY,
      ...guides,
      xLabel,
      yLabel
    ];
  }

  function graphDot(x, y, color) {
    return new M.VGroup(
      circle(
        0.13,
        gx(x),
        gy(y),
        color,
        0.10,
        0
      ),
      circle(
        0.073,
        gx(x),
        gy(y),
        color,
        1,
        1
      )
    );
  }

  function ruleGraph(fn, color, straight = false) {
    const paths = [];

    if (straight) {
      paths.push(
        line(
          graphPoint(0, fn(0)),
          graphPoint(4, fn(4)),
          color,
          3.8
        )
      );
    } else {
      const n = 64;

      for (let k = 0; k < n; k++) {
        const a = 4 * k / n;
        const b = 4 * (k + 1) / n;

        paths.push(
          line(
            graphPoint(a, fn(a)),
            graphPoint(b, fn(b)),
            color,
            3.8
          )
        );
      }
    }

    const dots = VALUES.map(v =>
      graphDot(v, fn(v), color)
    );

    return {
      path: new M.VGroup(...paths),
      dots
    };
  }

  let graphAxes = makeTransformAxes();

  let doubleGraph = ruleGraph(
    x => 2 * x,
    C.green,
    true
  );

  let plusGraph = ruleGraph(
    x => x + 1,
    C.cyan,
    true
  );

  let squareGraph = ruleGraph(
    x => x * x,
    C.violet,
    false
  );

  const doubleGraphLabel = txt(
    '2x',
    P ? 24 : 20,
    C.green,
    gx(3.55),
    gy(8) + 0.23,
    true
  );

  // below the guide line at 4, clear of the line itself
  const plusGraphLabel = txt(
    'x + 1',
    P ? 24 : 20,
    C.cyan,
    gx(3.55),
    (gy(0) + gy(4)) / 2 + 0.05,
    true
  );

  const squareGraphLabel = txt(
    'x²',
    P ? 24 : 20,
    C.violet,
    gx(3.20),
    gy(14),
    true
  );

  await until(S(34));
  await play(
    ...replacePicture(graphAxes),
    ...say('STRAIGHT RULES MAKE STRAIGHT LINES', C.green),
    ...fbox([
      ['2x: straight line', C.green],
      ['x + 1: straight line', C.cyan],
      'mean shortcut works'
    ], C.green)
  );

  live.push(
    doubleGraph.path,
    plusGraph.path,
    ...doubleGraph.dots,
    ...plusGraph.dots,
    doubleGraphLabel,
    plusGraphLabel
  );

  await play(
    new M.Create(doubleGraph.path, {
      runTime: 1.1
    }),
    new M.Create(plusGraph.path, {
      runTime: 1.1
    }),
    ...appear(
      doubleGraph.dots,
      plusGraph.dots,
      doubleGraphLabel,
      plusGraphLabel
    )
  );

  await until(S(34) + 3.15);

  live.push(
    squareGraph.path,
    ...squareGraph.dots,
    squareGraphLabel
  );

  await play(
    new M.Create(squareGraph.path, {
      runTime: 1.3
    }),
    ...appear(
      squareGraph.dots,
      squareGraphLabel
    ),
    ...fbox([
      ['straight: shortcut works', C.green],
      ['square: the rule bends', C.violet]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 35. Adding one token to every payout moves
  // the mean from two to three.
  //
  // A probability picture: all probability bars
  // move exactly one unit to the right.
  // Their heights do not change.
  // ----------------------------------------------------------

  const SHIFTBASE = P ? -3.15 : -2.07;
  const SHIFTW = P ? 5.95 : 6.05;
  const SHIFTQH = P ? 1.50 : 1.06;
  const SHIFTBW = P ? 0.68 : 0.65;

  const shiftX = v =>
    CX - SHIFTW / 2 + 0.40 +
    v / 5 * (SHIFTW - 0.80);

  function makeShiftAxis() {
    const axis = line(
      [CX - SHIFTW / 2, SHIFTBASE, 0],
      [CX + SHIFTW / 2, SHIFTBASE, 0],
      C.muted,
      2
    );

    const ticks = [0, 1, 2, 3, 4, 5].map(v =>
      new M.VGroup(
        line(
          [shiftX(v), SHIFTBASE - 0.06, 0],
          [shiftX(v), SHIFTBASE + 0.06, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          17,
          C.muted,
          shiftX(v),
          SHIFTBASE - 0.28,
          true
        )
      )
    );

    const unit = txt(
      'payout (tokens)',
      16,
      C.muted,
      CX,
      SHIFTBASE - 0.70
    );

    return [
      axis,
      ...ticks,
      unit
    ];
  }

  function shiftBar(v, p, f, color = C.cyan) {
    const x = shiftX(v);
    const h = p * 4 * SHIFTQH;

    const glow = new M.Rectangle({
      width: SHIFTBW + 0.18,
      height: h + 0.03,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.09);
    glow.moveTo([
      x,
      SHIFTBASE + h / 2,
      0
    ]);

    const body = new M.Rectangle({
      width: SHIFTBW,
      height: h,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.74);
    body.moveTo([
      x,
      SHIFTBASE + h / 2,
      0
    ]);

    const label = txt(
      f,
      19,
      color,
      x,
      SHIFTBASE + h + 0.25,
      true
    );

    return new M.VGroup(
      glow,
      body,
      label
    );
  }

  function shiftMeanMarker(v, color) {
    const x = shiftX(v);

    const guide = dashed(
      [x, SHIFTBASE + 0.05, 0],
      [x, SHIFTBASE + 2 * SHIFTQH + 0.08, 0],
      color
    );

    const label = tag(
      `MEAN = ${v}`,
      color,
      x,
      P ? 1.16 : 1.13,
      16
    );

    return new M.VGroup(
      guide,
      label
    );
  }

  const shiftAxis = makeShiftAxis();

  const shiftBars = VALUES.map((v, k) =>
    shiftBar(
      v,
      PROBS[k],
      FRACTIONS[k]
    )
  );

  const meanMarker = shiftMeanMarker(
    2,
    C.amber
  );

  await until(S(35));
  await play(
    ...replacePicture(
      shiftAxis,
      shiftBars,
      meanMarker
    ),
    ...say('ADD ONE TO EVERY PAYOUT', C.green),
    ...fbox([
      'old mean = 2',
      ['new mean = 2 + 1', C.green]
    ], C.green)
  );

  await play(
    ...shiftBars.map((b, k) =>
      new M.Transform(
        b,
        shiftBar(
          PLUSONE[k],
          PROBS[k],
          FRACTIONS[k],
          C.cyan
        ),
        {
          runTime: 1.25
        }
      )
    ),
    new M.Transform(
      meanMarker,
      shiftMeanMarker(3, C.green),
      {
        runTime: 1.25
      }
    ),
    ...fbox([
      ['E[X + 1] = E[X] + 1', C.green],
      ['= 2 + 1 = 3', GOLD]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 36. Applications: prizes, costs and scores.
  // All can be defined by rules applied to random variables.
  // ----------------------------------------------------------

  const USEY = P ? -0.67 : -0.42;
  const USEW = P ? 1.92 : 1.95;
  const USEH = P ? 3.06 : 2.55;

  function useCard(k, title, rule, color, picture) {
    const x = colx(k);

    const frame = rect(
      USEW,
      USEH,
      x,
      USEY,
      color,
      0.08
    );

    const heading = txt(
      title,
      17,
      color,
      x,
      USEY + USEH / 2 - 0.30,
      false,
      USEW - 0.18
    );

    const ruleText = txt(
      rule,
      17,
      C.ink,
      x,
      USEY - USEH / 2 + 0.32,
      false,
      USEW - 0.18
    );

    return new M.VGroup(
      frame,
      heading,
      picture,
      ruleText
    );
  }

  const prizeIcon = coinGrid(
    4,
    colx(0),
    USEY,
    2,
    0.19,
    0.48
  );

  const costIcon = new M.VGroup(
    coin(
      colx(1) - 0.24,
      USEY,
      0.22
    ),
    coin(
      colx(1) + 0.26,
      USEY,
      0.22
    ),
    txt(
      '+ fee',
      16,
      C.violet,
      colx(1),
      USEY - 0.58
    )
  );

  const scoreSheet = rect(
    0.78,
    1.02,
    colx(2),
    USEY,
    C.green,
    0.13
  );

  const scoreLines = [
    -0.24,
    0,
    0.24
  ].map(d =>
    line(
      [
        colx(2) - 0.24,
        USEY + d,
        0
      ],
      [
        colx(2) + 0.24,
        USEY + d,
        0
      ],
      C.green,
      2
    )
  );

  const scoreIcon = new M.VGroup(
    scoreSheet,
    ...scoreLines
  );

  const useCards = [
    useCard(
      0,
      'PRIZES',
      'change the reward',
      GOLD,
      prizeIcon
    ),
    useCard(
      1,
      'COSTS',
      'add a fixed fee',
      C.violet,
      costIcon
    ),
    useCard(
      2,
      'SCORES',
      'rescale points',
      C.green,
      scoreIcon
    )
  ];

  await until(S(36));
  await play(
    ...replacePicture(useCards),
    ...say('RULES CHANGE REAL-WORLD VALUES'),
    ...fbox([
      'prizes',
      'costs',
      'scores',
      ['transform a variable', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 37. Know when to reuse the mean and when to recompute.
  // ----------------------------------------------------------

  const decisionY = P ? -0.64 : -0.43;
  const decisionDX = P ? 1.66 : 1.70;

  function decisionCard(
    x,
    heading,
    rule,
    result,
    color
  ) {
    const w = P ? 3.00 : 3.06;
    const h = P ? 3.35 : 2.80;

    const frame = rect(
      w,
      h,
      x,
      decisionY,
      color,
      0.08
    );

    const title = txt(
      heading,
      17,
      color,
      x,
      decisionY + h / 2 - 0.33,
      false,
      w - 0.20
    );

    const formula = txt(
      rule,
      28,
      color,
      x,
      decisionY + 0.28,
      true,
      w - 0.20
    );

    const down = arrow(
      [
        x,
        decisionY - 0.08,
        0
      ],
      [
        x,
        decisionY - 0.53,
        0
      ],
      color,
      2.5,
      0.13
    );

    const note = txt(
      result,
      18,
      C.ink,
      x,
      decisionY - h / 2 + 0.37,
      false,
      w - 0.20
    );

    return new M.VGroup(
      frame,
      title,
      formula,
      down,
      note
    );
  }

  const linearDecision = decisionCard(
    CX - decisionDX,
    'STRAIGHT-LINE RULE',
    'aX + b',
    'reuse the old mean',
    C.green
  );

  const curvedDecision = decisionCard(
    CX + decisionDX,
    'CURVED RULE',
    'X²',
    'recompute by value',
    C.violet
  );

  await until(S(37));
  await play(
    ...replacePicture(
      linearDecision,
      curvedDecision
    ),
    ...say('KNOW WHEN THE SHORTCUT WORKS', C.green),
    ...fbox([
      ['E[aX + b] = aE[X] + b', C.green],
      'for straight-line changes'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 38. Common trap:
  // Squares and other nonlinear rules generally do not
  // let us transform the mean directly.
  //
  // Return to the transformation graph.
  // ----------------------------------------------------------

  graphAxes = makeTransformAxes();

  squareGraph = ruleGraph(
    x => x * x,
    C.violet,
    false
  );

  // Old mean: x = 2.
  // Square of old mean: y = 4.
  const oldMeanGuideX = dashed(
    graphPoint(2, 0),
    graphPoint(2, 4),
    C.amber
  );

  const oldMeanGuideY = dashed(
    graphPoint(0, 4),
    graphPoint(2, 4),
    C.amber
  );

  const wrongMeanPoint = graphDot(
    2,
    4,
    C.amber
  );

  // Correct mean of transformed payouts: y = 6.
  // This horizontal guide is an average of transformed values,
  // not another point evaluated on the square rule at x = 2.
  const correctMeanGuide = dashed(
    graphPoint(0, 6),
    graphPoint(4, 6),
    C.green
  );

  const wrongMeanText = txt(
    'square of mean: 4',
    P ? 20 : 17,
    C.amber,
    gx(2.9),
    gy(4) - 0.27,
    false,
    2.90
  );

  const correctMeanText = txt(
    'mean of squares: 6',
    P ? 20 : 17,
    C.green,
    gx(1.42),
    gy(6) + 0.26,
    false,
    2.95
  );

  const curveText = txt(
    'x²',
    22,
    C.violet,
    gx(3.25),
    gy(14),
    true
  );

  await until(S(38));
  await play(
    ...replacePicture(
      graphAxes,
      squareGraph.path,
      squareGraph.dots,
      oldMeanGuideX,
      oldMeanGuideY,
      wrongMeanPoint,
      correctMeanGuide,
      wrongMeanText,
      correctMeanText,
      curveText
    ),
    ...say('TRAP: A CURVED RULE NEEDS CARE', C.amber),
    ...fbox([
      ['E[X²] ≠ (E[X])²', C.amber],
      'here: 6 ≠ 4'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 39. Changing the mean directly gives the wrong answer.
  // Change each value first.
  //
  // Return to the correct calculation order.
  // ----------------------------------------------------------

  const finalStepY = P ? -0.62 : -0.42;

  const stageGap = P ? 2.10 : 2.10;
  const stageW = P ? 1.88 : 1.91;
  const stageH = P ? 3.22 : 2.70;

  function workflowCard(
    k,
    title,
    values,
    color,
    subtitle
  ) {
    const x = CX + (k - 1) * stageGap;

    const frame = rect(
      stageW,
      stageH,
      x,
      finalStepY,
      color,
      0.075
    );

    const heading = txt(
      title,
      16,
      color,
      x,
      finalStepY + stageH / 2 - 0.29,
      false,
      stageW - 0.17
    );

    const rows = values.map((s, j) =>
      txt(
        s,
        23,
        color,
        x,
        finalStepY +
          (1 - j) * (P ? 0.58 : 0.49),
        true
      )
    );

    const footer = txt(
      subtitle,
      15,
      C.muted,
      x,
      finalStepY - stageH / 2 + 0.25,
      false,
      stageW - 0.19
    );

    return new M.VGroup(
      frame,
      heading,
      ...rows,
      footer
    );
  }

  const workflowCards = [
    workflowCard(
      0,
      'OLD PAYOUTS',
      ['0', '2', '4'],
      C.cyan,
      'start here'
    ),
    workflowCard(
      1,
      'SQUARE FIRST',
      ['0', '4', '16'],
      C.violet,
      'change every value'
    ),
    workflowCard(
      2,
      'WEIGHT NEXT',
      ['0', '2', '4'],
      GOLD,
      'multiply by chance'
    )
  ];

  const workflowTotal = tag(
    'THEN ADD: 0 + 2 + 4 = 6',
    C.green,
    CX,
    P ? -3.08 : -2.32,
    18
  );

  await until(S(39));
  await play(
    ...replacePicture(
      workflowCards,
      workflowTotal
    ),
    ...say('CHANGE EACH VALUE FIRST', C.green),
    ...fbox([
      'square each payout',
      'weight by its chance',
      ['then add: 6', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 40. Notice the gap: six minus four is two.
  //
  // Visualise six token units beside four.
  // The two unmatched units are the numerical gap.
  // ----------------------------------------------------------

  const GAPBASE = P ? -3.00 : -2.05;
  const GAPSTEP = P ? 0.52 : 0.43;
  const GAPX1 = CX - 1.45;
  const GAPX2 = CX + 1.45;

  function gapToken(x, j) {
    return coin(
      x,
      GAPBASE + (j + 0.5) * GAPSTEP,
      P ? 0.18 : 0.16
    );
  }

  const stackSix = Array.from(
    { length: 6 },
    (_, j) => gapToken(GAPX1, j)
  );

  const stackFour = Array.from(
    { length: 4 },
    (_, j) => gapToken(GAPX2, j)
  );

  const gapFloor = line(
    [CX - 2.75, GAPBASE, 0],
    [CX + 2.75, GAPBASE, 0],
    C.muted,
    2
  );

  const gapSixLabel = txt(
    'E[X²] = 6',
    20,
    C.green,
    GAPX1,
    GAPBASE + 6 * GAPSTEP + 0.30,
    true
  );

  const gapFourLabel = txt(
    '(E[X])² = 4',
    19,
    C.amber,
    GAPX2,
    GAPBASE + 4 * GAPSTEP + 0.30,
    true
  );

  const gapOutline = outline(
    P ? 0.66 : 0.60,
    2 * GAPSTEP + 0.06,
    GAPX1,
    GAPBASE + 5 * GAPSTEP,
    C.violet
  );

  const gapGuide = dashed(
    [
      GAPX1 + 0.43,
      GAPBASE + 4 * GAPSTEP,
      0
    ],
    [
      GAPX2 - 0.30,
      GAPBASE + 4 * GAPSTEP,
      0
    ],
    C.muted
  );

  const gapArrow = arrow(
    [
      GAPX1 + 0.44,
      GAPBASE + 5 * GAPSTEP,
      0
    ],
    [
      CX + 0.15,
      GAPBASE + 5 * GAPSTEP,
      0
    ],
    C.violet,
    2.5,
    0.14
  );

  const gapLabel = tag(
    'GAP = 2',
    C.violet,
    CX + 0.83,
    GAPBASE + 5 * GAPSTEP,
    17
  );

  await until(S(40));
  await play(
    ...replacePicture(
      gapFloor,
      stackSix,
      stackFour,
      gapSixLabel,
      gapFourLabel,
      gapOutline,
      gapGuide,
      gapArrow,
      gapLabel
    ),
    ...say('NOTICE THE GAP: SIX MINUS FOUR', C.violet),
    ...fbox([
      'E[X²] - (E[X])²',
      '= 6 - 4',
      ['= 2', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 41. Preview the next lesson: the gap measures spread.
  //
  // Return to the original distribution.
  // Show the original payouts around their expected value, 2.
  // Do not change the original probability data.
  // ----------------------------------------------------------

  const SPREADBASE = P ? -3.15 : -2.10;
  const SPREADW = P ? 5.85 : 6.10;
  const SPREADQH = P ? 1.42 : 1.03;
  const SPREADBW = P ? 0.82 : 0.76;

  const spreadX = v =>
    CX - SPREADW / 2 + 0.66 +
    v / 4 * (SPREADW - 1.32);

  function spreadBar(v, p, label) {
    const x = spreadX(v);
    const h = 4 * SPREADQH * p;

    const glow = new M.Rectangle({
      width: SPREADBW + 0.20,
      height: h + 0.04,
      color: C.cyan,
      strokeWidth: 0
    });

    glow.setFill(C.cyan, 0.10);
    glow.moveTo([
      x,
      SPREADBASE + h / 2,
      0
    ]);

    const body = new M.Rectangle({
      width: SPREADBW,
      height: h,
      color: C.cyan,
      strokeWidth: 2
    });

    body.setFill(C.cyan, 0.74);
    body.moveTo([
      x,
      SPREADBASE + h / 2,
      0
    ]);

    const t = txt(
      label,
      21,
      C.cyan,
      x,
      SPREADBASE + h + 0.28,
      true
    );

    return new M.VGroup(
      glow,
      body,
      t
    );
  }

  const spreadAxis = line(
    [
      CX - SPREADW / 2,
      SPREADBASE,
      0
    ],
    [
      CX + SPREADW / 2,
      SPREADBASE,
      0
    ],
    C.muted,
    2
  );

  const spreadTicks = [0, 1, 2, 3, 4].map(v =>
    new M.VGroup(
      line(
        [
          spreadX(v),
          SPREADBASE - 0.06,
          0
        ],
        [
          spreadX(v),
          SPREADBASE + 0.06,
          0
        ],
        C.muted,
        1.5
      ),
      txt(
        String(v),
        18,
        VALUES.includes(v) ? C.ink : C.muted,
        spreadX(v),
        SPREADBASE - 0.27,
        true
      )
    )
  );

  const spreadUnit = txt(
    'original payout X (tokens)',
    16,
    C.muted,
    CX,
    SPREADBASE - 0.68
  );

  const spreadBars = VALUES.map((v, k) =>
    spreadBar(
      v,
      PROBS[k],
      FRACTIONS[k]
    )
  );

  const spreadMean = dashed(
    [
      spreadX(2),
      SPREADBASE,
      0
    ],
    [
      spreadX(2),
      SPREADBASE + 2 * SPREADQH + 0.12,
      0
    ],
    C.amber
  );

  const spreadMeanLabel = tag(
    'MEAN = 2',
    C.amber,
    CX,
    P ? 1.17 : 1.15,
    16
  );

  const spreadArrowY = P ? 0.47 : 0.68;

  const spreadLeft = arrow(
    [
      spreadX(2) - 0.15,
      spreadArrowY,
      0
    ],
    [
      spreadX(0),
      spreadArrowY,
      0
    ],
    C.violet,
    2.5,
    0.14
  );

  const spreadRight = arrow(
    [
      spreadX(2) + 0.15,
      spreadArrowY,
      0
    ],
    [
      spreadX(4),
      spreadArrowY,
      0
    ],
    C.violet,
    2.5,
    0.14
  );

  const spreadCaption = txt(
    'spread around the mean',
    16,
    C.violet,
    CX,
    spreadArrowY - 0.30
  );

  await until(S(41));
  await play(
    ...replacePicture(
      spreadAxis,
      spreadTicks,
      spreadUnit,
      spreadBars,
      spreadMean,
      spreadMeanLabel,
      spreadLeft,
      spreadRight,
      spreadCaption
    ),
    ...say('NEXT: THE GAP MEASURES SPREAD', C.violet),
    ...fbox([
      '6 - 4 = 2',
      ['next: variance', C.violet],
      'spread around the mean'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 42. Final definition.
  //
  // To find the expected value of a changed payout:
  // change each value first, weight by the chances, and add.
  //
  // Finish with the original square-prize example.
  // ----------------------------------------------------------

  const FINALY = P ? -0.72 : -0.46;
  const FINALW = P ? 6.35 : 6.40;

  const FCW = FINALW / 4;
  const FRH = P ? 0.95 : 0.76;

  const finalX = k =>
    CX + (k - 1.5) * FCW;

  const finalHeaderY = P ? 1.05 : 0.95;

  const finalRowY = k =>
    finalHeaderY - (k + 1) * FRH;

  function finalCell(s, x, y, color, header = false) {
    const frame = new M.Rectangle({
      width: FCW - 0.055,
      height: FRH - 0.055,
      color,
      strokeWidth: header ? 2 : 1.5
    });

    frame.setFill(
      header ? color : C.card,
      header ? 0.16 : 0.90
    );

    frame.moveTo([x, y, 0]);

    const label = txt(
      s,
      header ? 15 : 23,
      color,
      x,
      y,
      !header,
      FCW - 0.18
    );

    return new M.VGroup(
      frame,
      label
    );
  }

  const finalHeadings = [
    finalCell(
      'OLD',
      finalX(0),
      finalHeaderY,
      C.cyan,
      true
    ),
    finalCell(
      'SQUARE',
      finalX(1),
      finalHeaderY,
      C.violet,
      true
    ),
    finalCell(
      'CHANCE',
      finalX(2),
      finalHeaderY,
      C.cyan,
      true
    ),
    finalCell(
      'WEIGHTED',
      finalX(3),
      finalHeaderY,
      GOLD,
      true
    )
  ];

  const finalRows = VALUES.map((v, k) => [
    finalCell(
      String(v),
      finalX(0),
      finalRowY(k),
      C.cyan
    ),
    finalCell(
      String(SQUARE[k]),
      finalX(1),
      finalRowY(k),
      C.violet
    ),
    finalCell(
      FRACTIONS[k],
      finalX(2),
      finalRowY(k),
      C.cyan
    ),
    finalCell(
      String(SQUARE_WEIGHTED[k]),
      finalX(3),
      finalRowY(k),
      GOLD
    )
  ]);

  const finalSum = tag(
    'EXPECTED SQUARE PRIZE = 6',
    C.green,
    CX,
    P ? -3.04 : -2.17,
    17
  );

  const finalFooter = txt(
    'Change → weight → add',
    18,
    C.green,
    CX,
    P ? -3.67 : -2.75
  );

  await until(S(42));
  await play(
    ...replacePicture(
      finalHeadings,
      finalRows,
      finalSum,
      finalFooter
    ),
    ...say('CHANGE EACH VALUE, THEN WEIGHT AND ADD', C.green),
    ...fbox([
      ['E[g(X)] = Σ g(x) × P(X = x)', C.green],
      '0 × 1/4 + 4 × 1/2',
      '        + 16 × 1/4',
      ['= 6 tokens', GOLD]
    ], C.green)
  );

  const finalSquareOutline = outline(
    FCW + 0.07,
    3 * FRH + 0.08,
    finalX(1),
    finalRowY(1),
    C.violet
  );

  const finalWeightedOutline = outline(
    FCW + 0.07,
    3 * FRH + 0.08,
    finalX(3),
    finalRowY(1),
    GOLD
  );

  await until(S(42) + 2.45);

  live.push(finalSquareOutline);

  await play(
    new M.Create(finalSquareOutline, {
      runTime: 0.65
    }),
    ...say('FIRST: CHANGE EACH VALUE', C.violet)
  );

  await until(S(42) + 4.70);

  live.push(finalWeightedOutline);

  await play(
    new M.Create(finalWeightedOutline, {
      runTime: 0.65
    }),
    new M.Indicate(finalSum, {
      color: C.green,
      runTime: 0.85
    }),
    ...say('THEN: WEIGHT BY CHANCE AND ADD', C.green),
    ...fbox([
      'change each value',
      'multiply by its chance',
      ['add the results', C.green]
    ], C.green)
  );

  await until(E(42));
}
