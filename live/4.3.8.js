// lesson 4.3.8
// Linearity of expectation: the expected total is the sum of expected parts.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback not runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ----------------------------------------------------------
  // Shared chapter data.
  // ----------------------------------------------------------

  const VALUES = [0, 2, 4];
  const PROBS = [1 / 4, 1 / 2, 1 / 4];
  const FRACTIONS = ['1/4', '1/2', '1/4'];

  const NORMAL = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];

  const REPEAT = [
    [4, 0, 0],
    [0, 8, 0],
    [0, 0, 4]
  ];

  const TOTALS = [0, 2, 4, 6, 8];
  const TOTAL_COUNTS = [1, 4, 6, 4, 1];
  const TOTAL_PRODUCTS = [0, 8, 24, 24, 8];

  const REPEAT_TOTALS = [0, 4, 8];
  const REPEAT_PROBS = [1 / 4, 1 / 2, 1 / 4];
  const REPEAT_PRODUCTS = [0, 2, 2];

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const PINK = C.pink || '#F472B6';

  const XC = C.cyan;
  const YC = PINK;
  const TC = GOLD;

  const COL = [GREY, BLUE, BLUE, GOLD];

  // Consistent colours for grouping joint cells by their total.
  const TOTAL_COLORS = [
    GREY,
    XC,
    GOLD,
    C.violet,
    YC
  ];

  // Laptop + phone layout, consistent with preceding lessons.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const BASE = P ? -4.2 : -2.35;
  const MAINY = P ? -0.65 : -0.40;

  const say = (s, c = XC) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o, { runTime: 0.45 }));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o, { runTime: 0.45 }));

  // Keep track of live objects without regrouping them.
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

  function register(...objects) {
    live.push(
      ...objects.flat(Infinity).filter(Boolean)
    );
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
      cornerRadius: 0.12,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function outline(w, h, x, y, color = C.amber) {
    return rect(w, h, x, y, color, 0, 2.5);
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

  function tag(s, color, x, y, size = 17, maxw = null) {
    const limit = maxw || (P ? FW - 1.1 : 6.5);

    const label = txt(
      s,
      size,
      color,
      x,
      y,
      false,
      limit - 0.30
    );

    const r = rect(
      label.getWidth() + 0.32,
      P ? 0.43 : 0.36,
      x,
      y,
      color,
      0.13,
      1.5
    );

    return new M.VGroup(r, label);
  }

  function arrow(a, b, color = XC, sw = 3, tip = 0.15) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);

    if (d < 0.0001) {
      return circle(0.07, a[0], a[1], color, 1);
    }

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

  function fbox(lines, color = XC) {
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

    const maxw = P ? FW - 1.2 : 5.0;
    const maxh = P ? 1.9 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(g, { runTime: 0.45 })
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow, { runTime: 0.45 })
      );
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow, { runTime: 0.45 })
    ];

    boxNow = null;
    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins, consistent with preceding lessons.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.18) {
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
        26,
        C.muted,
        x,
        y,
        true
      );
    }

    const rows = Math.ceil(n / cols);

    return new M.VGroup(
      ...Array.from({ length: n }, (_, k) => {
        const row = Math.floor(k / cols);
        const col = k % cols;
        const rowCount = Math.min(cols, n - row * cols);

        return coin(
          x + (col - (rowCount - 1) / 2) * pitch,
          y + ((rows - 1) / 2 - row) * pitch,
          r
        );
      })
    );
  }

  function coins(n, x, y, r = 0.16) {
    return coinGrid(
      n,
      x,
      y,
      Math.max(1, n),
      r
    );
  }

  // ----------------------------------------------------------
  // Original four-slice spinner.
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
    return new M.VGroup(
      ...COL.map((_, k) => sector(k, cx, cy, r)),

      circle(
        r + 0.015,
        cx,
        cy,
        C.ink,
        0,
        2.5
      ),

      arrow(
        polar(cx, cy, r * 0.03, a),
        polar(cx, cy, r * 0.87, a),
        C.ink,
        4,
        r * 0.17
      ),

      circle(
        r * 0.075,
        cx,
        cy,
        C.ink,
        1,
        1
      )
    );
  }

  // ----------------------------------------------------------
  // Opening picture: the two rounds of the full game.
  // ----------------------------------------------------------

  const ROUND_DX = P ? 1.67 : 1.71;
  const ROUND_Y = P ? -0.56 : -0.42;
  const ROUND_R = P ? 0.99 : 0.88;

  function roundCard(x, heading, variable, color, angle) {
    const w = P ? 3.03 : 3.08;
    const h = P ? 3.55 : 3.05;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        ROUND_Y,
        color,
        0.07
      ),

      txt(
        heading,
        18,
        color,
        x,
        ROUND_Y + h / 2 - 0.30
      ),

      wheel(
        x,
        ROUND_Y + 0.06,
        ROUND_R,
        angle
      ),

      txt(
        variable,
        26,
        color,
        x,
        ROUND_Y - h / 2 + 0.30,
        true
      )
    );
  }

  const openingX = roundCard(
    CX - ROUND_DX,
    'ROUND ONE',
    'X',
    XC,
    3 * Math.PI / 4
  );

  const openingY = roundCard(
    CX + ROUND_DX,
    'ROUND TWO',
    'Y',
    YC,
    7 * Math.PI / 4
  );

  const openingQuestion = tag(
    'EXPECTED TOTAL?',
    C.amber,
    CX,
    P ? -3.06 : -2.30,
    20
  );

  // ----------------------------------------------------------
  // 0. A player plays both rounds and asks:
  // What total should I expect?
  // ----------------------------------------------------------

  await until(S(0));
  await play(
    ...replacePicture(
      openingX,
      openingY,
      openingQuestion
    ),
    ...say('WHAT TOTAL SHOULD WE EXPECT?', C.amber)
  );

  // ----------------------------------------------------------
  // 1. T is the total: X + Y.
  //
  // Illustrative game: round one pays 2, round two pays 4.
  // This particular game has a total of 6.
  // ----------------------------------------------------------

  const EXY = P ? -0.60 : -0.40;
  const EXSP = P ? 2.17 : 2.15;

  function payoutCard(
    x,
    heading,
    value,
    color,
    width = 1.80
  ) {
    return new M.VGroup(
      rect(
        width,
        P ? 2.42 : 2.12,
        x,
        EXY,
        color,
        0.08
      ),

      txt(
        heading,
        17,
        color,
        x,
        EXY + (P ? 0.90 : 0.77),
        false,
        width - 0.15
      ),

      coinGrid(
        value,
        x,
        EXY + 0.03,
        Math.min(Math.max(1, value), 4),
        value >= 4 ? 0.12 : 0.18
      ),

      txt(
        `${value} tokens`,
        19,
        color,
        x,
        EXY - (P ? 0.85 : 0.75),
        true,
        width - 0.18
      )
    );
  }

  const exampleX = payoutCard(
    CX - EXSP,
    'X',
    2,
    XC
  );

  const exampleY = payoutCard(
    CX,
    'Y',
    4,
    YC
  );

  const exampleT = payoutCard(
    CX + EXSP,
    'T',
    6,
    TC
  );

  const examplePlus = txt(
    '+',
    25,
    C.ink,
    CX - EXSP / 2,
    EXY,
    true
  );

  const exampleEquals = txt(
    '=',
    25,
    C.ink,
    CX + EXSP / 2,
    EXY,
    true
  );

  const exampleLabel = tag(
    'EXAMPLE GAME: 2 + 4 = 6',
    TC,
    CX,
    P ? -2.70 : -2.20,
    17
  );

  await until(S(1));
  await play(
    ...replacePicture(
      exampleX,
      exampleY,
      exampleT,
      examplePlus,
      exampleEquals,
      exampleLabel
    ),
    ...say('T = ROUND ONE + ROUND TWO', TC),
    ...fbox([
      ['T = X + Y', TC],
      'example: 2 + 4 = 6'
    ], TC)
  );

  // ----------------------------------------------------------
  // Expected-value cards.
  // ----------------------------------------------------------

  function meanCard(x, variable, color) {
    const y = MAINY;
    const w = P ? 2.98 : 3.02;
    const h = P ? 2.85 : 2.45;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        y,
        color,
        0.08
      ),

      txt(
        variable === 'X' ? 'ROUND ONE' : 'ROUND TWO',
        18,
        color,
        x,
        y + h / 2 - 0.32
      ),

      coins(
        2,
        x,
        y + 0.08,
        0.25
      ),

      txt(
        `E[${variable}] = 2`,
        24,
        color,
        x,
        y - 0.73,
        true
      ),

      txt(
        'tokens on average',
        16,
        C.muted,
        x,
        y - h / 2 + 0.19
      )
    );
  }

  let meanX = meanCard(CX - ROUND_DX, 'X', XC);
  let meanY = meanCard(CX + ROUND_DX, 'Y', YC);

  // ----------------------------------------------------------
  // 2. Each round separately averages two tokens.
  // ----------------------------------------------------------

  await until(S(2));
  await play(
    ...replacePicture(meanX, meanY),
    ...say('EACH ROUND AVERAGES TWO'),
    ...fbox([
      ['E[X] = 2 tokens', XC],
      ['E[Y] = 2 tokens', YC]
    ])
  );

  // ----------------------------------------------------------
  // 3. Guess the total is 2 + 2 = 4.
  // Check it the long way.
  // ----------------------------------------------------------

  const guessTotal = tag(
    'GUESS: 2 + 2 = 4?',
    C.amber,
    CX,
    P ? -2.82 : -2.27,
    21
  );

  await until(S(3));
  await play(
    ...addPicture(guessTotal),
    ...say('GUESS FOUR. CHECK THE LONG WAY.', C.amber),
    ...fbox([
      '2 + 2 = 4',
      ['does the guess work?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Joint table from lesson 4.3.7.
  //
  // Rows = X, columns = Y.
  // Each original entry is a numerator in sixteenths.
  //
  // The total for cell (i,j) is VALUES[i] + VALUES[j].
  // ----------------------------------------------------------

  const CW = P ? 1.45 : 1.48;
  const RH = P ? 1.12 : 0.85;

  const JX0 = CX - CW;
  const JY0 = P ? 0.10 : 0.05;

  const jx = j => JX0 + j * CW;
  const jy = i => JY0 - i * RH;

  const ROW_X = JX0 - CW * 0.91;
  const COL_Y = JY0 + RH * 0.83;

  function jointCell(i, j, matrix, mode = 'chance') {
    const n = matrix[i][j];
    const total = VALUES[i] + VALUES[j];

    const color = mode === 'group'
      ? TOTAL_COLORS[total / 2]
      : C.violet;

    const x = jx(j);
    const y = jy(i);

    const opacity = n === 0
      ? 0.025
      : mode === 'group'
        ? 0.22
        : 0.08 + n * 0.045;

    const frame = rect(
      CW - 0.055,
      RH - 0.05,
      x,
      y,
      n === 0 ? C.muted : color,
      opacity,
      1.8
    );

    if (mode === 'chance') {
      return new M.VGroup(
        frame,
        txt(
          `${n}/16`,
          P ? 24 : 22,
          n === 0 ? C.muted : C.ink,
          x,
          y,
          true,
          CW - 0.16
        )
      );
    }

    return new M.VGroup(
      frame,

      txt(
        `T=${total}`,
        P ? 20 : 18,
        color,
        x,
        y + RH * 0.18,
        true
      ),

      txt(
        `${n}/16`,
        P ? 18 : 16,
        n === 0 ? C.muted : C.ink,
        x,
        y - RH * 0.21,
        true
      )
    );
  }

  function makeJointTable(matrix, mode = 'chance') {
    const cells = matrix.map((row, i) =>
      row.map((_, j) =>
        jointCell(i, j, matrix, mode)
      )
    );

    const rowHeads = VALUES.map((v, i) =>
      new M.VGroup(
        rect(
          CW * 0.62,
          RH - 0.05,
          ROW_X,
          jy(i),
          XC,
          0.12,
          1.5
        ),

        txt(
          String(v),
          23,
          XC,
          ROW_X,
          jy(i),
          true
        )
      )
    );

    const colHeads = VALUES.map((v, j) =>
      new M.VGroup(
        rect(
          CW - 0.055,
          RH * 0.63,
          jx(j),
          COL_Y,
          YC,
          0.12,
          1.5
        ),

        txt(
          String(v),
          23,
          YC,
          jx(j),
          COL_Y,
          true
        )
      )
    );

    const titles = [
      txt(
        'X',
        25,
        XC,
        ROW_X,
        COL_Y,
        true
      ),

      txt(
        'Y',
        25,
        YC,
        jx(1),
        COL_Y + (P ? 0.60 : 0.48),
        true
      )
    ];

    return {
      cells,
      rowHeads,
      colHeads,
      titles
    };
  }

  function jointParts(j) {
    return [
      j.cells,
      j.rowHeads,
      j.colHeads,
      j.titles
    ];
  }

  function cellOutline(i, j, color = C.amber) {
    return outline(
      CW + 0.045,
      RH + 0.04,
      jx(j),
      jy(i),
      color
    );
  }

  let joint = makeJointTable(NORMAL);

  const jointCaption = txt(
    'Normal game: independent spins',
    17,
    C.muted,
    CX,
    P ? -3.72 : -2.53
  );

  // ----------------------------------------------------------
  // 4. Every joint cell produces one total.
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    ...replacePicture(
      jointParts(joint),
      jointCaption
    ),
    ...say('EACH JOINT CELL GIVES ONE TOTAL', TC),
    ...fbox([
      'joint chance: P(X=x, Y=y)',
      ['total: T = x + y', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 5. Zero then two, and two then zero,
  // both produce a total of two.
  // ----------------------------------------------------------

  const totalTwoFocus = [
    cellOutline(0, 1, XC),
    cellOutline(1, 0, XC)
  ];

  const twoPairCaption = tag(
    '0 + 2 = 2     ·     2 + 0 = 2',
    XC,
    CX,
    P ? -3.55 : -2.43,
    17
  );

  await until(S(5));
  await play(
    ...removePicture(jointCaption),
    ...addPicture(
      totalTwoFocus,
      twoPairCaption
    ),
    new M.Transform(
      joint.cells[0][1],
      jointCell(0, 1, NORMAL, 'group'),
      { runTime: 0.65 }
    ),
    new M.Transform(
      joint.cells[1][0],
      jointCell(1, 0, NORMAL, 'group'),
      { runTime: 0.65 }
    ),
    ...say('DIFFERENT PAIRS CAN GIVE THE SAME TOTAL', XC),
    ...fbox([
      '0 + 2 = 2',
      '2 + 0 = 2',
      ['group these chances', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 6. Group cells with the same total.
  //
  // All five possible totals are 0, 2, 4, 6, 8.
  // ----------------------------------------------------------

  const totalLegendY = P ? -3.75 : -2.47;

  const totalLegend = TOTALS.map((v, k) =>
    new M.VGroup(
      rect(
        P ? 1.04 : 1.08,
        0.48,
        CX + (k - 2) * 1.20,
        totalLegendY,
        TOTAL_COLORS[k],
        0.18,
        1.5
      ),

      txt(
        String(v),
        22,
        TOTAL_COLORS[k],
        CX + (k - 2) * 1.20,
        totalLegendY,
        true
      )
    )
  );

  await until(S(6));
  await play(
    ...removePicture(
      totalTwoFocus,
      twoPairCaption
    ),
    ...joint.cells.flatMap((row, i) =>
      row.map((cell, j) =>
        new M.Transform(
          cell,
          jointCell(i, j, NORMAL, 'group'),
          { runTime: 0.80 }
        )
      )
    ),
    ...addPicture(totalLegend),
    ...say('GROUP BY TOTAL: 0, 2, 4, 6, 8', TC),
    ...fbox([
      'same total → same group',
      ['T = 0, 2, 4, 6, 8', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // Total probability plot.
  //
  // One small glowing block represents 1/16 chance.
  // Bar heights use the same scale for both games.
  // ----------------------------------------------------------

  const PMFBASE = P ? -3.54 : -2.02;
  const PMFW = P ? 6.12 : 6.18;
  const PMFH = P ? 3.95 : 2.45;
  const BARW = P ? 0.75 : 0.72;

  const pmfX = v =>
    CX - PMFW / 2 + 0.42 +
    v / 8 * (PMFW - 0.84);

  function makeTotalAxis(title, color = TC) {
    const axis = line(
      [CX - PMFW / 2, PMFBASE, 0],
      [CX + PMFW / 2, PMFBASE, 0],
      C.muted,
      2.5
    );

    const ticks = Array.from(
      { length: 9 },
      (_, v) => new M.VGroup(
        line(
          [pmfX(v), PMFBASE - 0.055, 0],
          [pmfX(v), PMFBASE + 0.055, 0],
          C.muted,
          1.5
        ),

        txt(
          String(v),
          v % 2 === 0 ? 19 : 15,
          v % 2 === 0 ? C.ink : C.muted,
          pmfX(v),
          PMFBASE - 0.26,
          true
        )
      )
    );

    const heading = txt(
      title,
      19,
      color,
      CX,
      P ? 1.14 : 1.14,
      false,
      6.15
    );

    const unit = txt(
      'total T (tokens)',
      16,
      C.muted,
      CX,
      PMFBASE - 0.67
    );

    return [
      axis,
      ticks,
      heading,
      unit
    ];
  }

  function probabilityBlock(x, y, w, h, color) {
    const glow = new M.Rectangle({
      width: w + 0.12,
      height: h + 0.015,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.09);
    glow.moveTo([x, y, 0]);

    const body = new M.Rectangle({
      width: w,
      height: h - 0.025,
      color,
      strokeWidth: 1.5
    });

    body.setFill(color, 0.76);
    body.moveTo([x, y, 0]);

    return new M.VGroup(glow, body);
  }

  function totalBar(
    v,
    count,
    label = `${count}/16`,
    color = TC
  ) {
    const h = PMFH / 8;
    const x = pmfX(v);

    const blocks = Array.from(
      { length: count },
      (_, k) => probabilityBlock(
        x,
        PMFBASE + (k + 0.5) * h,
        BARW,
        h,
        color
      )
    );

    const text = txt(
      label,
      P ? 21 : 19,
      color,
      x,
      PMFBASE + count * h + 0.26,
      true,
      1.05
    );

    return {
      blocks,
      label: text
    };
  }

  function barParts(b) {
    return [
      b.blocks,
      b.label
    ];
  }

  let totalAxis = makeTotalAxis(
    'NORMAL GAME: TOTAL DISTRIBUTION'
  );

  const totalBars = TOTALS.map((v, k) =>
    totalBar(
      v,
      TOTAL_COUNTS[k],
      `${TOTAL_COUNTS[k]}/16`,
      TOTAL_COLORS[k]
    )
  );

  // ----------------------------------------------------------
  // 7. T = 0: one time in sixteen.
  // ----------------------------------------------------------

  await until(S(7));
  await play(
    ...replacePicture(
      totalAxis,
      barParts(totalBars[0])
    ),
    ...say('TOTAL ZERO: 1/16', GREY),
    ...fbox([
      '0 + 0 = 0',
      ['P(T = 0) = 1/16', GREY]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 8. T = 2: four times in sixteen.
  //
  // P(0,2) + P(2,0) = 2/16 + 2/16.
  // ----------------------------------------------------------

  await until(S(8));

  register(barParts(totalBars[1]));

  await play(
    new M.LaggedStart(
      totalBars[1].blocks.map(b =>
        new M.FadeIn(b)
      ),
      {
        lagRatio: 0.16,
        runTime: 1.15
      }
    ),
    new M.FadeIn(totalBars[1].label),
    ...say('TOTAL TWO: 4/16', XC),
    ...fbox([
      '0+2 or 2+0',
      '2/16 + 2/16',
      ['P(T = 2) = 4/16', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 9. T = 4: six times in sixteen.
  //
  // P(0,4) + P(2,2) + P(4,0)
  // = 1/16 + 4/16 + 1/16.
  // ----------------------------------------------------------

  await until(S(9));

  register(barParts(totalBars[2]));

  await play(
    new M.LaggedStart(
      totalBars[2].blocks.map(b =>
        new M.FadeIn(b)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.20
      }
    ),
    new M.FadeIn(totalBars[2].label),
    ...say('TOTAL FOUR: 6/16', TC),
    ...fbox([
      '0+4, 2+2 or 4+0',
      '1/16 + 4/16 + 1/16',
      ['P(T = 4) = 6/16', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 10. T = 6: four times in sixteen.
  // ----------------------------------------------------------

  await until(S(10));

  register(barParts(totalBars[3]));

  await play(
    new M.LaggedStart(
      totalBars[3].blocks.map(b =>
        new M.FadeIn(b)
      ),
      {
        lagRatio: 0.16,
        runTime: 1.10
      }
    ),
    new M.FadeIn(totalBars[3].label),
    ...say('TOTAL SIX: 4/16', C.violet),
    ...fbox([
      '2+4 or 4+2',
      '2/16 + 2/16',
      ['P(T = 6) = 4/16', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 11. T = 8: one time in sixteen.
  // ----------------------------------------------------------

  await until(S(11));
  await play(
    ...addPicture(barParts(totalBars[4])),
    ...say('TOTAL EIGHT: 1/16', YC),
    ...fbox([
      '4 + 4 = 8',
      ['P(T = 8) = 1/16', YC]
    ], YC)
  );

  // ----------------------------------------------------------
  // Weighted-expectation calculation.
  //
  // Use five columns, one per possible total.
  // Numerators are multiplied first, then divided by 16.
  // ----------------------------------------------------------

  const CALCW = P ? 6.50 : 6.48;
  const CALCCW = CALCW / 5;
  const CALCX = k => CX + (k - 2) * CALCCW;

  const CALCY = P ? -0.65 : -0.47;
  const CALCH = P ? 3.96 : 3.23;

  function calculationCard(k) {
    const x = CALCX(k);
    const color = TOTAL_COLORS[k];

    const frame = rect(
      CALCCW - 0.07,
      CALCH,
      x,
      CALCY,
      color,
      0.075,
      1.6
    );

    const total = txt(
      String(TOTALS[k]),
      29,
      color,
      x,
      CALCY + CALCH * 0.34,
      true
    );

    const reward = coinGrid(
      TOTALS[k],
      x,
      CALCY + CALCH * 0.15,
      Math.min(4, Math.max(1, TOTALS[k])),
      0.085,
      0.215
    );

    const times = txt(
      '×',
      22,
      C.muted,
      x,
      CALCY - CALCH * 0.025,
      true
    );

    const count = txt(
      String(TOTAL_COUNTS[k]),
      27,
      XC,
      x,
      CALCY - CALCH * 0.15,
      true
    );

    const separator = line(
      [
        x - CALCCW * 0.34,
        CALCY - CALCH * 0.27,
        0
      ],
      [
        x + CALCCW * 0.34,
        CALCY - CALCH * 0.27,
        0
      ],
      C.muted,
      1.5
    );

    const product = txt(
      String(TOTAL_PRODUCTS[k]),
      30,
      GOLD,
      x,
      CALCY - CALCH * 0.39,
      true
    );

    return {
      base: new M.VGroup(
        frame,
        total,
        reward,
        times,
        count,
        separator
      ),

      product
    };
  }

  const calculationCards = TOTALS.map((_, k) =>
    calculationCard(k)
  );

  const calculationNote = txt(
    'Multiply totals by their counts out of 16',
    17,
    C.muted,
    CX,
    P ? -3.22 : -2.53,
    false,
    6.30
  );

  // ----------------------------------------------------------
  // 12. Multiply every total by its number of sixteenths.
  // ----------------------------------------------------------

  await until(S(12));
  await play(
    ...replacePicture(
      calculationCards.map(c => c.base),
      calculationNote
    ),
    ...say('MULTIPLY EACH TOTAL BY ITS COUNT', TC),
    ...fbox([
      'total × number of sixteenths',
      ['divide by 16 at the end', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 13. 0 × 1 = 0.
  //     2 × 4 = 8.
  //     4 × 6 = 24.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    ...addPicture(calculationCards[0].product),
    new M.Indicate(calculationCards[0].base, {
      color: GREY,
      runTime: 0.65
    }),
    ...say('0 × 1 = 0', GREY),
    ...fbox([
      ['0 × 1 = 0', GOLD]
    ], GREY)
  );

  await until(S(13) + 1.85);
  await play(
    ...addPicture(calculationCards[1].product),
    new M.Indicate(calculationCards[1].base, {
      color: XC,
      runTime: 0.65
    }),
    ...say('2 × 4 = 8', XC),
    ...fbox([
      '0 × 1 = 0',
      ['2 × 4 = 8', GOLD]
    ], XC)
  );

  await until(S(13) + 3.85);
  await play(
    ...addPicture(calculationCards[2].product),
    new M.Indicate(calculationCards[2].base, {
      color: TC,
      runTime: 0.65
    }),
    ...say('4 × 6 = 24', TC),
    ...fbox([
      '0 × 1 = 0',
      '2 × 4 = 8',
      ['4 × 6 = 24', GOLD]
    ], TC)
  );

  // ----------------------------------------------------------
  // 14. 6 × 4 = 24.
  //     8 × 1 = 8.
  // ----------------------------------------------------------

  await until(S(14));
  await play(
    ...addPicture(calculationCards[3].product),
    new M.Indicate(calculationCards[3].base, {
      color: C.violet,
      runTime: 0.65
    }),
    ...say('6 × 4 = 24', C.violet),
    ...fbox([
      ['6 × 4 = 24', GOLD]
    ], C.violet)
  );

  await until(S(14) + 1.65);
  await play(
    ...addPicture(calculationCards[4].product),
    new M.Indicate(calculationCards[4].base, {
      color: YC,
      runTime: 0.65
    }),
    ...say('8 × 1 = 8', YC),
    ...fbox([
      '6 × 4 = 24',
      ['8 × 1 = 8', GOLD]
    ], YC)
  );

  // ----------------------------------------------------------
  // 15. Add the five weighted numerators.
  //
  // 0 + 8 + 24 + 24 + 8 = 64.
  //
  // Picture the contributions as stacks of equal token units.
  // ----------------------------------------------------------

  const CONTRIB_BASE = P ? -3.45 : -2.00;
  const CONTRIB_H = P ? 3.65 : 2.58;

  const contributionStacks = TOTAL_PRODUCTS.map((n, k) => {
    const x = CALCX(k);

    if (n === 0) {
      return txt(
        '0',
        25,
        C.muted,
        x,
        CONTRIB_BASE + 0.25,
        true
      );
    }

    const h = n / 24 * CONTRIB_H;

    const body = new M.Rectangle({
      width: CALCCW * 0.63,
      height: h,
      color: GOLD,
      strokeWidth: 2
    });

    body.setFill(GOLD, 0.67);
    body.moveTo([
      x,
      CONTRIB_BASE + h / 2,
      0
    ]);

    const label = txt(
      String(n),
      25,
      GOLD,
      x,
      CONTRIB_BASE + h + 0.28,
      true
    );

    return new M.VGroup(
      body,
      label
    );
  });

  const contributionFloor = line(
    [CX - CALCW / 2, CONTRIB_BASE, 0],
    [CX + CALCW / 2, CONTRIB_BASE, 0],
    C.muted,
    2
  );

  const contributionLabels = TOTALS.map((v, k) =>
    txt(
      `T=${v}`,
      17,
      TOTAL_COLORS[k],
      CALCX(k),
      CONTRIB_BASE - 0.29,
      true
    )
  );

  const numerator64 = tag(
    'TOTAL NUMERATOR = 64',
    TC,
    CX,
    P ? -4.28 : -2.68,
    19
  );

  await until(S(15));
  await play(
    ...replacePicture(
      contributionFloor,
      contributionLabels,
      contributionStacks
    ),
    ...say('ADD ALL FIVE CONTRIBUTIONS', TC),
    ...fbox([
      '0 + 8 + 24 + 24 + 8',
      ['= 64', TC]
    ], TC)
  );

  await play(
    new M.LaggedStart(
      contributionStacks.map(g =>
        new M.Indicate(g, {
          color: GOLD
        })
      ),
      {
        lagRatio: 0.25,
        runTime: 2.5
      }
    ),
    ...addPicture(numerator64)
  );

  // ----------------------------------------------------------
  // 16. Sixty-four sixteenths is four.
  // ----------------------------------------------------------

  const fractionY = MAINY + 0.12;

  const numerator = txt(
    '64',
    43,
    GOLD,
    CX - 1.42,
    fractionY + 0.65,
    true
  );

  const fractionRule = line(
    [
      CX - 2.15,
      fractionY + 0.15,
      0
    ],
    [
      CX - 0.69,
      fractionY + 0.15,
      0
    ],
    C.ink,
    2.5
  );

  const denominator = txt(
    '16',
    35,
    XC,
    CX - 1.42,
    fractionY - 0.36,
    true
  );

  const divisionEquals = txt(
    '=',
    35,
    C.ink,
    CX,
    fractionY + 0.12,
    true
  );

  const divisionResult = txt(
    '4',
    55,
    C.green,
    CX + 1.45,
    fractionY + 0.12,
    true
  );

  await until(S(16));
  await play(
    ...replacePicture(
      numerator,
      fractionRule,
      denominator,
      divisionEquals,
      divisionResult
    ),
    ...say('64 ÷ 16 = 4', C.green),
    ...fbox([
      '64/16',
      ['= 4 tokens', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 17. The expected total is four tokens.
  // The guess was right.
  // ----------------------------------------------------------

  const correctFour = coinGrid(
    4,
    CX,
    MAINY,
    2,
    0.29,
    0.75
  );

  const correctFourTitle = txt(
    'EXPECTED TOTAL',
    21,
    TC,
    CX,
    MAINY + 1.17
  );

  const correctFourTag = tag(
    'E[T] = 4 TOKENS',
    C.green,
    CX,
    MAINY - 1.40,
    21
  );

  await until(S(17));
  await play(
    ...replacePicture(
      correctFour,
      correctFourTitle,
      correctFourTag
    ),
    ...say('THE GUESS WAS RIGHT: FOUR TOKENS', C.green),
    ...fbox([
      'E[T] = 64/16',
      ['= 4 tokens', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 18. Did that result need independence?
  //
  // Present this as a question, not a mathematical claim.
  // ----------------------------------------------------------

  const independenceQuestion = new M.VGroup(
    rect(
      P ? 5.90 : 6.10,
      P ? 2.90 : 2.53,
      CX,
      MAINY,
      C.amber,
      0.075
    ),

    txt(
      'INDEPENDENCE?',
      24,
      C.amber,
      CX,
      MAINY + 0.72
    ),

    txt(
      'E[X + Y] = 4',
      28,
      GOLD,
      CX,
      MAINY,
      true
    ),

    txt(
      'Does the shortcut need it?',
      19,
      C.ink,
      CX,
      MAINY - 0.83
    )
  );

  await until(S(18));
  await play(
    ...replacePicture(independenceQuestion),
    ...say('DO WE NEED INDEPENDENCE?', C.amber),
    ...fbox([
      'independent game: 4',
      ['what if X and Y are linked?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Repeat rule.
  //
  // Round two copies the payout of the first fair spin.
  // The second payout is not an independent new draw.
  // ----------------------------------------------------------

  const COPY_TOP = P ? 0.35 : 0.34;
  const COPY_SP = P ? 1.16 : 0.92;

  const COPY_L = CX - 1.67;
  const COPY_R = CX + 1.67;

  const copyY = k => COPY_TOP - k * COPY_SP;

  function copyNode(v, x, y, color) {
    return new M.VGroup(
      rect(
        2.04,
        P ? 0.87 : 0.70,
        x,
        y,
        color,
        0.10
      ),

      coins(
        v,
        x - 0.20,
        y,
        v === 4 ? 0.105 : 0.14
      ),

      txt(
        String(v),
        23,
        color,
        x + 0.71,
        y,
        true
      )
    );
  }

  const copyX = VALUES.map((v, k) =>
    copyNode(v, COPY_L, copyY(k), XC)
  );

  const copyYNodes = VALUES.map((v, k) =>
    copyNode(v, COPY_R, copyY(k), YC)
  );

  const copyArrows = VALUES.map((_, k) =>
    arrow(
      [COPY_L + 1.10, copyY(k), 0],
      [COPY_R - 1.10, copyY(k), 0],
      C.violet,
      3,
      0.16
    )
  );

  const copyHeadings = [
    txt(
      'FIRST SPIN: X',
      18,
      XC,
      COPY_L,
      COPY_TOP + 0.72
    ),

    txt(
      'COPIED PAYOUT: Y',
      18,
      YC,
      COPY_R,
      COPY_TOP + 0.72,
      false,
      3.0
    )
  ];

  const copyRule = tag(
    'REPEAT RULE: Y = X',
    C.violet,
    CX,
    P ? -3.08 : -2.36,
    20
  );

  // ----------------------------------------------------------
  // 19. Test the repeat rule: round two always copies X.
  // ----------------------------------------------------------

  await until(S(19));
  await play(
    ...replacePicture(
      copyX,
      copyYNodes,
      copyArrows,
      copyHeadings,
      copyRule
    ),
    ...say('REPEAT RULE: ROUND TWO COPIES ROUND ONE', C.violet),
    ...fbox([
      ['Y = X', C.violet],
      '0 → 0',
      '2 → 2',
      '4 → 4'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 20. The two rounds are tied together.
  // They share the first-spin condition.
  // ----------------------------------------------------------

  const sharedWheelX = CX;
  const sharedWheelY = P ? 0.45 : 0.39;
  const sharedWheelR = P ? 0.87 : 0.70;

  const sharedWheel = wheel(
    sharedWheelX,
    sharedWheelY,
    sharedWheelR,
    3 * Math.PI / 4
  );

  const sharedNodeY = P ? -2.00 : -1.45;

  const sharedNodeX = copyNode(
    2,
    COPY_L,
    sharedNodeY,
    XC
  );

  const sharedNodeY2 = copyNode(
    2,
    COPY_R,
    sharedNodeY,
    YC
  );

  const sharedArrows = [
    arrow(
      [
        CX - 0.39,
        sharedWheelY - sharedWheelR * 0.82,
        0
      ],
      [
        COPY_L,
        sharedNodeY + 0.54,
        0
      ],
      XC,
      3,
      0.16
    ),

    arrow(
      [
        CX + 0.39,
        sharedWheelY - sharedWheelR * 0.82,
        0
      ],
      [
        COPY_R,
        sharedNodeY + 0.54,
        0
      ],
      YC,
      3,
      0.16
    )
  ];

  const sharedLabels = [
    txt(
      'X',
      24,
      XC,
      COPY_L,
      sharedNodeY - 0.66,
      true
    ),

    txt(
      'Y',
      24,
      YC,
      COPY_R,
      sharedNodeY - 0.66,
      true
    )
  ];

  await until(S(20));
  await play(
    ...replacePicture(
      sharedWheel,
      sharedNodeX,
      sharedNodeY2,
      sharedArrows,
      sharedLabels
    ),
    ...say('ONE FIRST SPIN CONTROLS BOTH PAYOUTS', C.violet),
    ...fbox([
      'one shared spin',
      ['X and Y are dependent', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 21. Y still averages two because it copies a fair spin.
  // ----------------------------------------------------------

  meanX = meanCard(
    CX - ROUND_DX,
    'X',
    XC
  );

  meanY = meanCard(
    CX + ROUND_DX,
    'Y',
    YC
  );

  const copiedMeans = tag(
    'DEPENDENT, BUT SAME TWO MEANS',
    C.violet,
    CX,
    P ? -2.85 : -2.28,
    17
  );

  await until(S(21));
  await play(
    ...replacePicture(
      meanX,
      meanY,
      copiedMeans
    ),
    ...say('THE ROUND-TWO MEAN IS STILL TWO', YC),
    ...fbox([
      ['E[X] = 2', XC],
      ['E[Y] = 2', YC],
      'Y copies X'
    ], YC)
  );

  // ----------------------------------------------------------
  // 22. The repeat-rule total is zero, four or eight.
  // ----------------------------------------------------------

  const REP_SP = P ? 2.07 : 2.10;
  const REP_Y = MAINY;

  function repeatTotalCard(k) {
    const x = CX + (k - 1) * REP_SP;
    const v = VALUES[k];
    const total = 2 * v;

    const w = P ? 1.92 : 1.95;
    const h = P ? 3.42 : 2.85;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        REP_Y,
        TC,
        0.08
      ),

      txt(
        `X=${v}`,
        21,
        XC,
        x,
        REP_Y + h * 0.34,
        true
      ),

      txt(
        `Y=${v}`,
        21,
        YC,
        x,
        REP_Y + h * 0.17,
        true
      ),

      line(
        [x - w * 0.34, REP_Y + 0.03, 0],
        [x + w * 0.34, REP_Y + 0.03, 0],
        C.muted,
        1.5
      ),

      coinGrid(
        total,
        x,
        REP_Y - h * 0.14,
        Math.min(4, Math.max(1, total)),
        total === 8 ? 0.125 : 0.15,
        total === 8 ? 0.32 : 0.37
      ),

      txt(
        `T=${total}`,
        25,
        TC,
        x,
        REP_Y - h * 0.38,
        true
      )
    );
  }

  const repeatTotalCards = VALUES.map((_, k) =>
    repeatTotalCard(k)
  );

  await until(S(22));
  await play(
    ...replacePicture(repeatTotalCards),
    ...say('REPEAT TOTALS: 0, 4, 8', TC),
    ...fbox([
      '0 + 0 = 0',
      '2 + 2 = 4',
      ['4 + 4 = 8', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 23. Repeat-rule probabilities: 1/4, 1/2, 1/4.
  //
  // Same vertical scale as the normal total plot.
  // ----------------------------------------------------------

  const repeatAxis = makeTotalAxis(
    'REPEAT RULE: TOTAL DISTRIBUTION'
  );

  const repeatBars = REPEAT_TOTALS.map((v, k) =>
    totalBar(
      v,
      Math.round(REPEAT_PROBS[k] * 16),
      FRACTIONS[k],
      TC
    )
  );

  await until(S(23));
  await play(
    ...replacePicture(
      repeatAxis,
      barParts(repeatBars[0])
    ),
    ...say('TOTAL ZERO: ONE QUARTER', TC),
    ...fbox([
      ['P(T = 0) = 1/4', TC]
    ], TC)
  );

  await until(S(23) + 1.50);
  await play(
    ...addPicture(barParts(repeatBars[1])),
    ...say('TOTAL FOUR: ONE HALF', TC),
    ...fbox([
      'P(T = 0) = 1/4',
      ['P(T = 4) = 1/2', TC]
    ], TC)
  );

  await until(S(23) + 3.20);
  await play(
    ...addPicture(barParts(repeatBars[2])),
    ...say('TOTAL EIGHT: ONE QUARTER', TC),
    ...fbox([
      'P(T = 0) = 1/4',
      'P(T = 4) = 1/2',
      ['P(T = 8) = 1/4', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // Repeat-rule weighted-payout calculation.
  // ----------------------------------------------------------

  const RCW = P ? 1.92 : 1.95;
  const RCH = P ? 3.82 : 3.18;
  const RCY = MAINY;

  function repeatWeightCard(k) {
    const x = CX + (k - 1) * REP_SP;
    const v = REPEAT_TOTALS[k];

    const frame = rect(
      RCW,
      RCH,
      x,
      RCY,
      TC,
      0.075
    );

    const total = txt(
      `T=${v}`,
      24,
      TC,
      x,
      RCY + RCH * 0.37,
      true
    );

    const reward = coinGrid(
      v,
      x,
      RCY + RCH * 0.18,
      Math.min(4, Math.max(1, v)),
      v === 8 ? 0.12 : 0.15,
      v === 8 ? 0.30 : 0.37
    );

    const times = txt(
      '×',
      22,
      C.muted,
      x,
      RCY - RCH * 0.025,
      true
    );

    const chance = txt(
      FRACTIONS[k],
      27,
      XC,
      x,
      RCY - RCH * 0.16,
      true
    );

    const separator = line(
      [
        x - RCW * 0.34,
        RCY - RCH * 0.27,
        0
      ],
      [
        x + RCW * 0.34,
        RCY - RCH * 0.27,
        0
      ],
      C.muted,
      1.5
    );

    const product = txt(
      String(REPEAT_PRODUCTS[k]),
      32,
      C.green,
      x,
      RCY - RCH * 0.39,
      true
    );

    return {
      base: new M.VGroup(
        frame,
        total,
        reward,
        times,
        chance,
        separator
      ),

      product
    };
  }

  const repeatWeights = VALUES.map((_, k) =>
    repeatWeightCard(k)
  );

  // ----------------------------------------------------------
  // 24. 0 × 1/4 = 0.
  //     4 × 1/2 = 2.
  //     8 × 1/4 = 2.
  // ----------------------------------------------------------

  await until(S(24));
  await play(
    ...replacePicture(
      repeatWeights.map(c => c.base),
      repeatWeights[0].product
    ),
    ...say('0 × 1/4 = 0', TC),
    ...fbox([
      ['0 × 1/4 = 0', C.green]
    ], TC)
  );

  await until(S(24) + 1.85);
  await play(
    ...addPicture(repeatWeights[1].product),
    new M.Indicate(repeatWeights[1].base, {
      color: TC,
      runTime: 0.65
    }),
    ...say('4 × 1/2 = 2', TC),
    ...fbox([
      '0 × 1/4 = 0',
      ['4 × 1/2 = 2', C.green]
    ], TC)
  );

  await until(S(24) + 3.65);
  await play(
    ...addPicture(repeatWeights[2].product),
    new M.Indicate(repeatWeights[2].base, {
      color: TC,
      runTime: 0.65
    }),
    ...say('8 × 1/4 = 2', TC),
    ...fbox([
      '0 × 1/4 = 0',
      '4 × 1/2 = 2',
      ['8 × 1/4 = 2', C.green]
    ], TC)
  );

  // ----------------------------------------------------------
  // 25. Zero plus two plus two makes four.
  // Four again, despite dependence.
  // ----------------------------------------------------------

  const repeatResult = tag(
    '0 + 2 + 2 = 4',
    C.green,
    CX,
    P ? -3.14 : -2.40,
    21
  );

  await until(S(25));
  await play(
    ...addPicture(repeatResult),
    new M.LaggedStart(
      repeatWeights.map(c =>
        new M.Indicate(c.product, {
          color: C.green
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.5
      }
    ),
    ...say('FOUR AGAIN, EVEN WITH LINKED ROUNDS', C.green),
    ...fbox([
      'E[T] = 0 + 2 + 2',
      ['= 4 tokens', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // Many-game illustration.
  //
  // Use an idealised eight-game collection of payouts.
  // This is a possible illustrative sample, not a guarantee.
  //
  // Each round contains two zeros, four twos and two fours.
  // Each round therefore contains 16 tokens across 8 games.
  //
  // The averaging identity works for any actual sample;
  // exact sample means need not equal the theoretical means.
  // ----------------------------------------------------------

  const MANY_N = 8;

  const MANY_X = [0, 2, 4, 2, 0, 4, 2, 2];
  const MANY_Y = [4, 2, 0, 2, 2, 0, 4, 2];

  const MANY_TOP = P ? 0.40 : 0.32;
  const MANY_BOTTOM = P ? -1.63 : -1.36;
  const MANY_SP = P ? 0.73 : 0.75;

  function gameX(k) {
    return CX + (k - (MANY_N - 1) / 2) * MANY_SP;
  }

  function gameSlot(k, v, y, color) {
    const x = gameX(k);
    const w = MANY_SP - 0.065;
    const h = P ? 1.26 : 1.00;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        y,
        color,
        0.07,
        1.2
      ),

      txt(
        String(v),
        20,
        color,
        x,
        y + h * 0.32,
        true
      ),

      coinGrid(
        v,
        x,
        y - h * 0.10,
        Math.min(2, Math.max(1, v)),
        0.080,
        0.20
      )
    );
  }

  const manyRoundOne = MANY_X.map((v, k) =>
    gameSlot(k, v, MANY_TOP, XC)
  );

  const manyRoundTwo = MANY_Y.map((v, k) =>
    gameSlot(k, v, MANY_BOTTOM, YC)
  );

  const manyTitles = [
    txt(
      'ROUND ONE PAYOUTS',
      18,
      XC,
      CX,
      MANY_TOP + (P ? 0.91 : 0.75)
    ),

    txt(
      'ROUND TWO PAYOUTS',
      18,
      YC,
      CX,
      MANY_BOTTOM + (P ? 0.91 : 0.75)
    )
  ];

  const gameNumbers = Array.from(
    { length: MANY_N },
    (_, k) => txt(
      String(k + 1),
      15,
      C.muted,
      gameX(k),
      MANY_BOTTOM - (P ? 0.85 : 0.68),
      true
    )
  );

  const illustrativeLabel = txt(
    'Illustrative sample of 8 games',
    15,
    C.muted,
    CX,
    P ? -3.28 : -2.62
  );

  // ----------------------------------------------------------
  // 26. Picture many games and a stack for each round.
  // ----------------------------------------------------------

  await until(S(26));
  await play(
    ...replacePicture(
      manyRoundOne,
      manyRoundTwo,
      manyTitles,
      gameNumbers,
      illustrativeLabel
    ),
    ...say('PICTURE MANY GAMES', TC),
    ...fbox([
      'collect round-one tokens',
      'collect round-two tokens',
      ['keep the piles separate', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // Token-stack picture.
  //
  // Each group has 16 individual gold coins.
  // The group borders identify the round.
  // ----------------------------------------------------------

  const STACK_Y = P ? -0.65 : -0.44;
  const STACK_DX = P ? 1.67 : 1.73;
  const STACK_R = P ? 0.15 : 0.135;
  const STACK_PITCH = P ? 0.39 : 0.35;

  function stack16(x, y) {
    return coinGrid(
      16,
      x,
      y,
      4,
      STACK_R,
      STACK_PITCH
    );
  }

  function stackShell(x, variable, color) {
    return new M.VGroup(
      rect(
        P ? 2.98 : 3.05,
        P ? 3.20 : 2.77,
        x,
        STACK_Y,
        color,
        0.065
      ),

      txt(
        variable === 'X'
          ? 'ROUND ONE'
          : 'ROUND TWO',
        18,
        color,
        x,
        STACK_Y + (P ? 1.30 : 1.12)
      )
    );
  }

  const stackShellX = stackShell(
    CX - STACK_DX,
    'X',
    XC
  );

  const stackShellY = stackShell(
    CX + STACK_DX,
    'Y',
    YC
  );

  const stackX = stack16(
    CX - STACK_DX,
    STACK_Y + 0.08
  );

  const stackY = stack16(
    CX + STACK_DX,
    STACK_Y + 0.08
  );

  const stackCaptionX = txt(
    '16 ÷ 8 = 2',
    22,
    XC,
    CX - STACK_DX,
    STACK_Y - 1.03,
    true
  );

  const stackCaptionY = txt(
    '16 ÷ 8 = 2',
    22,
    YC,
    CX + STACK_DX,
    STACK_Y - 1.03,
    true
  );

  const stackExampleLabel = txt(
    'Example: eight games',
    17,
    C.muted,
    CX,
    P ? -2.85 : -2.30
  );

  // ----------------------------------------------------------
  // 27. Round one averages two tokens per game.
  // ----------------------------------------------------------

  await until(S(27));
  await play(
    ...replacePicture(
      stackShellX,
      stackShellY,
      stackX,
      stackCaptionX,
      stackExampleLabel
    ),
    ...say('ROUND ONE: TWO TOKENS PER GAME', XC),
    ...fbox([
      'example: 16 tokens / 8 games',
      ['E[X] = 2 in the long run', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 28. Round two averages two tokens per game too.
  // ----------------------------------------------------------

  await until(S(28));
  await play(
    ...addPicture(
      stackY,
      stackCaptionY
    ),
    ...say('ROUND TWO: TWO TOKENS PER GAME', YC),
    ...fbox([
      ['E[X] = 2', XC],
      ['E[Y] = 2', YC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 29. Put the two piles together.
  //
  // Transform each existing 16-coin stack into one half
  // of a combined 32-coin pile.
  //
  // No coin is added or removed.
  // ----------------------------------------------------------

  const COMBINED_Y = P ? -0.60 : -0.42;

  const combinedFrame = rect(
    P ? 5.18 : 5.25,
    P ? 3.12 : 2.70,
    CX,
    COMBINED_Y,
    TC,
    0.065
  );

  const combinedXTarget = stack16(
    CX - STACK_PITCH * 2,
    COMBINED_Y + 0.03
  );

  const combinedYTarget = stack16(
    CX + STACK_PITCH * 2,
    COMBINED_Y + 0.03
  );

  const combinedTitle = txt(
    'BOTH ROUNDS TOGETHER',
    19,
    TC,
    CX,
    COMBINED_Y + (P ? 1.27 : 1.08)
  );

  const combinedCount = txt(
    '32 tokens',
    25,
    TC,
    CX,
    COMBINED_Y - (P ? 1.08 : 0.92),
    true
  );

  await until(S(29));
  await play(
    ...removePicture(
      stackShellX,
      stackShellY,
      stackCaptionX,
      stackCaptionY
    ),
    ...addPicture(
      combinedFrame,
      combinedTitle,
      combinedCount
    ),
    new M.Transform(
      stackX,
      combinedXTarget,
      {
        pathArc: -0.25,
        runTime: 1.35
      }
    ),
    new M.Transform(
      stackY,
      combinedYTarget,
      {
        pathArc: 0.25,
        runTime: 1.35
      }
    ),
    ...say('PUT THE PILES TOGETHER', TC),
    ...fbox([
      '16 + 16 = 32',
      ['no token added or lost', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 30. Divide the combined number of tokens by the
  // same number of games.
  //
  // (16 + 16) / 8 = 16/8 + 16/8 = 4.
  //
  // The identity works regardless of how the rounds are linked.
  // ----------------------------------------------------------

  const combinedAverage = tag(
    '32 ÷ 8 = 4 TOKENS PER GAME',
    C.green,
    CX,
    P ? -3.39 : -2.72,
    18
  );

  await until(S(30));
  await play(
    ...addPicture(combinedAverage),
    ...say('AVERAGE TOTAL = TWO PLUS TWO', C.green),
    ...fbox([
      '(16 + 16)/8',
      '= 16/8 + 16/8',
      ['= 2 + 2 = 4', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 31. This is called linearity of expectation.
  // ----------------------------------------------------------

  const linearityTitle = tag(
    'AVERAGES ADD',
    C.green,
    CX,
    P ? 1.45 : 1.31,
    19
  );

  await until(S(31));
  await play(
    ...addPicture(linearityTitle),
    ...say('LINEARITY OF EXPECTATION', C.green),
    ...fbox([
      ['linearity of expectation', C.green],
      'averages add'
    ], C.green)
  );

  // ----------------------------------------------------------
  // Visual addition of expected parts.
  //
  // Left: two expected tokens from X.
  // Middle: two expected tokens from Y.
  // Right: four expected tokens from T.
  // ----------------------------------------------------------

  function expectedPart(x, name, n, color) {
    const y = MAINY;
    const w = 1.84;
    const h = P ? 2.70 : 2.35;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        y,
        color,
        0.08
      ),

      txt(
        name,
        20,
        color,
        x,
        y + h / 2 - 0.31,
        true
      ),

      coinGrid(
        n,
        x,
        y + 0.02,
        2,
        0.20,
        0.52
      ),

      txt(
        `${n} tokens`,
        19,
        color,
        x,
        y - h / 2 + 0.29,
        true
      )
    );
  }

  function makeExpectedPicture() {
    const gap = 2.20;

    const x = expectedPart(
      CX - gap,
      'E[X]',
      2,
      XC
    );

    const y = expectedPart(
      CX,
      'E[Y]',
      2,
      YC
    );

    const t = expectedPart(
      CX + gap,
      'E[T]',
      4,
      TC
    );

    const plus = txt(
      '+',
      25,
      C.ink,
      CX - gap / 2,
      MAINY,
      true
    );

    const equals = txt(
      '=',
      25,
      C.ink,
      CX + gap / 2,
      MAINY,
      true
    );

    return {
      x,
      y,
      t,
      plus,
      equals
    };
  }

  function expectedParts(p) {
    return [
      p.x,
      p.y,
      p.t,
      p.plus,
      p.equals
    ];
  }

  let expectedPicture = makeExpectedPicture();

  const expectedSummary = tag(
    '2 + 2 = 4',
    C.green,
    CX,
    P ? -2.86 : -2.25,
    21
  );

  // ----------------------------------------------------------
  // 32. The expected value of a sum
  // is the sum of the expected values.
  // ----------------------------------------------------------

  await until(S(32));
  await play(
    ...replacePicture(
      expectedParts(expectedPicture),
      expectedSummary
    ),
    ...say('EXPECTED SUM = SUM OF EXPECTED VALUES', C.green),
    ...fbox([
      'expected total',
      ['= sum of expected parts', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 33. The short version, in one line.
  // ----------------------------------------------------------

  await until(S(33));
  await play(
    ...say('THE SHORT VERSION'),
    ...fbox([
      'linearity in symbols'
    ])
  );

  // ----------------------------------------------------------
  // 34. E[X + Y] = E[X] + E[Y].
  // ----------------------------------------------------------

  function expressionBox(s, y, color, size = 27) {
    const label = txt(
      s,
      size,
      color,
      CX,
      y,
      true,
      P ? 5.90 : 6.05
    );

    return new M.VGroup(
      rect(
        Math.min(
          P ? 6.25 : 6.40,
          label.getWidth() + 0.55
        ),
        P ? 0.91 : 0.78,
        CX,
        y,
        color,
        0.10
      ),

      label
    );
  }

  const formulaMain = expressionBox(
    'E[X + Y] = E[X] + E[Y]',
    P ? 0.25 : 0.32,
    C.green,
    P ? 29 : 28
  );

  const formulaSub = expressionBox(
    'E[T] = 2 + 2 = 4',
    P ? -1.20 : -0.88,
    TC,
    28
  );

  await until(S(34));
  await play(
    ...replacePicture(
      formulaMain,
      formulaSub
    ),
    ...say('E[X + Y] = E[X] + E[Y]', C.green),
    ...fbox([
      ['E[X + Y] = E[X] + E[Y]', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 35. Read it in plain language:
  // expected round one plus expected round two.
  // ----------------------------------------------------------

  expectedPicture = makeExpectedPicture();

  const plainLanguage = txt(
    'Add the averages, not the individual chances.',
    17,
    C.muted,
    CX,
    P ? -2.77 : -2.23,
    false,
    6.2
  );

  await until(S(35));
  await play(
    ...replacePicture(
      expectedParts(expectedPicture),
      plainLanguage
    ),
    ...say('ROUND-ONE MEAN + ROUND-TWO MEAN', C.green),
    ...fbox([
      ['E[T] = E[X] + E[Y]', TC],
      '= 2 + 2',
      ['= 4 tokens', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 36. No joint table and no independence are needed.
  // Show both games giving the same expected total.
  // ----------------------------------------------------------

  const GAME_DX = P ? 1.68 : 1.71;
  const GAME_Y = MAINY;

  function smallJointMatrix(matrix, x, y, cellSize) {
    const cells = [];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const n = matrix[i][j];

        const xx = x + (j - 1) * cellSize;
        const yy = y + (1 - i) * cellSize;

        cells.push(
          rect(
            cellSize - 0.025,
            cellSize - 0.025,
            xx,
            yy,
            n === 0 ? C.muted : C.violet,
            n === 0 ? 0.025 : 0.12 + n * 0.055,
            1.2
          )
        );

        cells.push(
          txt(
            String(n),
            19,
            n === 0 ? C.muted : C.ink,
            xx,
            yy,
            true
          )
        );
      }
    }

    return new M.VGroup(...cells);
  }

  function gameMeanCard(
    x,
    title,
    matrix,
    dependenceText
  ) {
    const w = P ? 3.03 : 3.06;
    const h = P ? 3.75 : 3.25;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        GAME_Y,
        C.violet,
        0.075
      ),

      txt(
        title,
        17,
        C.violet,
        x,
        GAME_Y + h / 2 - 0.29
      ),

      txt(
        dependenceText,
        15,
        C.muted,
        x,
        GAME_Y + h / 2 - 0.65
      ),

      smallJointMatrix(
        matrix,
        x,
        GAME_Y + 0.04,
        P ? 0.52 : 0.47
      ),

      txt(
        '2 + 2 = 4',
        24,
        C.green,
        x,
        GAME_Y - h / 2 + 0.34,
        true
      )
    );
  }

  const normalMeanCard = gameMeanCard(
    CX - GAME_DX,
    'NORMAL GAME',
    NORMAL,
    'independent'
  );

  const repeatMeanCard = gameMeanCard(
    CX + GAME_DX,
    'REPEAT RULE',
    REPEAT,
    'dependent'
  );

  const noIndependence = tag(
    'SAME EXPECTED TOTAL',
    C.green,
    CX,
    P ? -3.10 : -2.34,
    19
  );

  await until(S(36));
  await play(
    ...replacePicture(
      normalMeanCard,
      repeatMeanCard,
      noIndependence
    ),
    ...say('NO JOINT TABLE OR INDEPENDENCE NEEDED', C.green),
    ...fbox([
      'independent or dependent',
      ['E[X+Y] = E[X]+E[Y]', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 37. Linearity turns large problems into small ones.
  //
  // Picture a big collection of expected parts,
  // then a single sum.
  // ----------------------------------------------------------

  const puzzleY = P ? -0.42 : -0.32;
  const puzzleValues = ['E[A]', 'E[B]', 'E[C]', 'E[D]'];

  const puzzleCards = puzzleValues.map((s, k) => {
    const x = CX + (k - 1.5) * 1.43;

    return new M.VGroup(
      rect(
        1.23,
        P ? 1.20 : 1.02,
        x,
        puzzleY + 0.53,
        k % 2 === 0 ? XC : YC,
        0.10
      ),

      txt(
        s,
        22,
        k % 2 === 0 ? XC : YC,
        x,
        puzzleY + 0.53,
        true
      )
    );
  });

  const puzzleArrow = arrow(
    [CX, puzzleY - 0.23, 0],
    [CX, puzzleY - 0.83, 0],
    C.green,
    3,
    0.17
  );

  const puzzleTotal = tag(
    'ADD THE EXPECTED PARTS',
    C.green,
    CX,
    puzzleY - 1.27,
    20
  );

  await until(S(37));
  await play(
    ...replacePicture(
      puzzleCards,
      puzzleArrow,
      puzzleTotal
    ),
    ...say('BIG PROBLEM → SMALL PARTS', C.green),
    ...fbox([
      'find the mean of each part',
      ['then add the means', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 38. Ten rounds, or a whole shopping basket.
  //
  // Ten rounds of this same fair payout:
  // expected total = 10 × 2 = 20 tokens.
  //
  // Shopping example is illustrative:
  // expected item costs may be added in the same way.
  // ----------------------------------------------------------

  const TEN_SP = P ? 1.15 : 1.18;

  const tenCards = Array.from(
    { length: 10 },
    (_, k) => {
      const col = k % 5;
      const row = Math.floor(k / 5);

      const x = CX + (col - 2) * TEN_SP;
      const y = MAINY + (0.5 - row) * (P ? 1.35 : 1.13);

      return new M.VGroup(
        rect(
          1.04,
          P ? 1.16 : 0.98,
          x,
          y,
          XC,
          0.08,
          1.4
        ),

        txt(
          `R${k + 1}`,
          14,
          C.muted,
          x,
          y + 0.30,
          true
        ),

        coins(
          2,
          x,
          y - 0.03,
          0.12
        ),

        txt(
          'E=2',
          16,
          XC,
          x,
          y - 0.34,
          true
        )
      );
    }
  );

  const tenTotal = tag(
    '10 × 2 = 20 TOKENS',
    C.green,
    CX,
    P ? -2.88 : -2.22,
    20
  );

  await until(S(38));
  await play(
    ...replacePicture(
      tenCards,
      tenTotal
    ),
    ...say('TEN ROUNDS? ADD TEN EXPECTED PAYOUTS', C.green),
    ...fbox([
      '10 rounds, mean 2 each',
      ['expected total = 20', C.green]
    ], C.green)
  );

  // Shopping-basket illustration.
  function groceryItem(x, y, label, color, shape) {
    const parts = [
      rect(
        1.30,
        1.82,
        x,
        y,
        color,
        0.07
      ),

      txt(
        label,
        16,
        color,
        x,
        y - 0.68
      )
    ];

    if (shape === 'apple') {
      parts.push(
        circle(
          0.33,
          x,
          y + 0.13,
          '#F87171',
          0.85
        ),

        line(
          [x, y + 0.44, 0],
          [x + 0.10, y + 0.63, 0],
          C.green,
          3
        )
      );
    } else if (shape === 'carton') {
      parts.push(
        rect(
          0.54,
          0.80,
          x,
          y + 0.12,
          XC,
          0.25
        )
      );
    } else {
      parts.push(
        rect(
          0.75,
          0.55,
          x,
          y + 0.12,
          GOLD,
          0.45
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const basketItems = [
    groceryItem(
      CX - 1.65,
      MAINY + 0.30,
      'E[cost]',
      XC,
      'apple'
    ),

    groceryItem(
      CX,
      MAINY + 0.30,
      'E[cost]',
      YC,
      'carton'
    ),

    groceryItem(
      CX + 1.65,
      MAINY + 0.30,
      'E[cost]',
      GOLD,
      'bread'
    )
  ];

  const basketOutline = new M.VGroup(
    line(
      [CX - 2.68, MAINY + 0.12, 0],
      [CX - 2.10, MAINY - 1.15, 0],
      C.green,
      3
    ),

    line(
      [CX - 2.10, MAINY - 1.15, 0],
      [CX + 2.10, MAINY - 1.15, 0],
      C.green,
      3
    ),

    line(
      [CX + 2.10, MAINY - 1.15, 0],
      [CX + 2.68, MAINY + 0.12, 0],
      C.green,
      3
    )
  );

  const basketTotal = tag(
    'EXPECTED BASKET COST = SUM OF PARTS',
    C.green,
    CX,
    P ? -2.88 : -2.27,
    16
  );

  await until(S(38) + 2.85);
  await play(
    ...replacePicture(
      basketItems,
      basketOutline,
      basketTotal
    ),
    ...say('SHOPPING BASKET? ADD EXPECTED COSTS', C.green),
    ...fbox([
      'expected basket cost',
      ['= sum of expected item costs', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 39. Common trap: do not stretch the rule too far.
  // ----------------------------------------------------------

  const trapCard = new M.VGroup(
    rect(
      P ? 5.90 : 6.08,
      P ? 2.70 : 2.30,
      CX,
      MAINY,
      C.amber,
      0.075
    ),

    txt(
      'THE RULE HAS A LIMIT',
      22,
      C.amber,
      CX,
      MAINY + 0.78
    ),

    txt(
      'E[X + Y] = E[X] + E[Y]',
      P ? 23 : 22,
      C.green,
      CX,
      MAINY + 0.2,
      true,
      P ? 5.5 : 5.7
    ),

    txt(
      'E[X²] ≠ (E[X])²',
      P ? 23 : 22,
      C.amber,
      CX,
      MAINY - 0.35,
      true
    ),

    txt(
      'works for sums, not for squares',
      19,
      C.ink,
      CX,
      MAINY - 0.88,
      false,
      P ? 5.5 : 5.8
    )
  );

  await until(S(39));
  await play(
    ...replacePicture(trapCard),
    ...say('TRAP: DO NOT STRETCH THE RULE', C.amber),
    ...fbox([
      ['sums: expectations add', C.green],
      ['squares: they do not', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 40. The rule works for sums, not for squaring.
  //
  // Recall lesson 4.3.5:
  // E[X²] = 6
  // (E[X])² = 4.
  // ----------------------------------------------------------

  const RULE_DX = P ? 1.67 : 1.71;
  const RULE_Y = MAINY;

  function ruleComparisonCard(
    x,
    title,
    expression,
    result,
    color
  ) {
    const w = P ? 3.03 : 3.06;
    const h = P ? 3.14 : 2.73;

    return new M.VGroup(
      rect(
        w,
        h,
        x,
        RULE_Y,
        color,
        0.08
      ),

      txt(
        title,
        18,
        color,
        x,
        RULE_Y + h / 2 - 0.32
      ),

      txt(
        expression,
        23,
        color,
        x,
        RULE_Y + 0.26,
        true,
        w - 0.22
      ),

      txt(
        result,
        22,
        color,
        x,
        RULE_Y - 0.47,
        true,
        w - 0.22
      )
    );
  }

  const sumWorks = ruleComparisonCard(
    CX - RULE_DX,
    'SUMS: YES',
    'E[X+Y]',
    '= E[X]+E[Y]',
    C.green
  );

  const squareFails = ruleComparisonCard(
    CX + RULE_DX,
    'SQUARES: NOT IN GENERAL',
    'E[X²] = 6',
    '(E[X])² = 4',
    C.amber
  );

  const squareTrapLabel = tag(
    '6 ≠ 4',
    C.amber,
    CX,
    P ? -2.88 : -2.30,
    20
  );

  await until(S(40));
  await play(
    ...replacePicture(
      sumWorks,
      squareFails,
      squareTrapLabel
    ),
    ...say('SUMS WORK. SQUARES DO NOT GENERALLY WORK.', C.amber),
    ...fbox([
      ['E[X+Y] = E[X]+E[Y]', C.green],
      'but in our example:',
      ['E[X²] ≠ (E[X])²', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Comparison of the normal and repeat total distributions.
  //
  // Both plots use identical horizontal and vertical scales.
  // Both have expected total 4.
  //
  // Normal probabilities:
  // 1/16, 4/16, 6/16, 4/16, 1/16.
  //
  // Repeat probabilities:
  // 4/16, 0, 8/16, 0, 4/16.
  // ----------------------------------------------------------

  const CMP_DX = P ? 1.72 : 1.72;
  const CMP_W = P ? 3.04 : 3.06;

  const CMP_BASE = P ? -2.62 : -1.84;
  const CMP_H = P ? 3.44 : 2.44;

  function comparisonPlot(
    center,
    title,
    counts,
    color
  ) {
    const sx = v =>
      center - CMP_W / 2 + 0.25 +
      v / 8 * (CMP_W - 0.50);

    const axis = line(
      [
        center - CMP_W / 2,
        CMP_BASE,
        0
      ],
      [
        center + CMP_W / 2,
        CMP_BASE,
        0
      ],
      C.muted,
      2
    );

    const ticks = TOTALS.map(v =>
      txt(
        String(v),
        15,
        C.muted,
        sx(v),
        CMP_BASE - 0.25,
        true
      )
    );

    const bars = [];

    counts.forEach((n, k) => {
      if (n === 0) return;

      const h = CMP_H * n / 8;

      const body = new M.Rectangle({
        width: 0.35,
        height: h,
        color,
        strokeWidth: 1.5
      });

      body.setFill(color, 0.72);
      body.moveTo([
        sx(TOTALS[k]),
        CMP_BASE + h / 2,
        0
      ]);

      const label = txt(
        `${n}/16`,
        14,
        color,
        sx(TOTALS[k]),
        CMP_BASE + h + 0.20,
        true,
        0.58
      );

      bars.push(
        new M.VGroup(body, label)
      );
    });

    const guide = dashed(
      [
        sx(4),
        CMP_BASE,
        0
      ],
      [
        sx(4),
        CMP_BASE + CMP_H + 0.05,
        0
      ],
      C.amber
    );

    const heading = txt(
      title,
      17,
      color,
      center,
      CMP_BASE + CMP_H + 0.45,
      false,
      2.90
    );

    const meanTag = tag(
      'MEAN = 4',
      C.amber,
      center,
      CMP_BASE - 0.78,
      15
    );

    return {
      parts: [
        axis,
        ticks,
        bars,
        guide,
        heading,
        meanTag
      ],

      sx,
      meanTag
    };
  }

  function makeTotalComparison() {
    return {
      normal: comparisonPlot(
        CX - CMP_DX,
        'NORMAL GAME',
        TOTAL_COUNTS,
        XC
      ),

      repeat: comparisonPlot(
        CX + CMP_DX,
        'REPEAT RULE',
        [4, 0, 8, 0, 4],
        YC
      )
    };
  }

  let comparison = makeTotalComparison();

  // ----------------------------------------------------------
  // 41. Linearity says nothing about how much
  // the total swings around its average.
  // ----------------------------------------------------------

  const spreadQuestion = tag(
    'SAME MEAN · DIFFERENT SPREAD?',
    C.violet,
    CX,
    P ? -4.05 : -2.86,
    16
  );

  await until(S(41));
  await play(
    ...replacePicture(
      comparison.normal.parts,
      comparison.repeat.parts,
      spreadQuestion
    ),
    ...say('AVERAGE DOES NOT DESCRIBE THE SWING', C.violet),
    ...fbox([
      'both means = 4',
      ['the distributions differ', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 42. Preview lesson 4.3.9:
  // the swing of the total depends on the link.
  //
  // Mark distances from the common expected total.
  // No variance formula is introduced ahead of the narration.
  // ----------------------------------------------------------

  function spreadArrows(plot, vLeft, vRight, color) {
    const y = CMP_BASE - 0.48;

    return [
      arrow(
        [plot.sx(4) - 0.04, y, 0],
        [plot.sx(vLeft), y, 0],
        color,
        2.5,
        0.10
      ),

      arrow(
        [plot.sx(4) + 0.04, y, 0],
        [plot.sx(vRight), y, 0],
        color,
        2.5,
        0.10
      )
    ];
  }

  const repeatSwing = [
    outline(
      0.48,
      CMP_H * 0.50 + 0.49,
      comparison.repeat.sx(0),
      CMP_BASE + CMP_H * 0.25 + 0.11,
      C.violet
    ),

    outline(
      0.48,
      CMP_H * 0.50 + 0.49,
      comparison.repeat.sx(8),
      CMP_BASE + CMP_H * 0.25 + 0.11,
      C.violet
    )
  ];

  await until(S(42));
  await play(
    ...addPicture(repeatSwing),
    new M.Indicate(comparison.normal.meanTag, {
      color: C.amber,
      runTime: 0.8
    }),
    new M.Indicate(comparison.repeat.meanTag, {
      color: C.amber,
      runTime: 0.8
    }),
    ...say('NEXT: THE LINK CHANGES THE SWING', C.violet),
    ...fbox([
      'expectation: link does not matter',
      ['variance: the link matters', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 43. Final definition.
  //
  // The expected total is the sum of the expected parts,
  // linked or not.
  //
  // Finish with the two expected payouts becoming four.
  // ----------------------------------------------------------

  expectedPicture = makeExpectedPicture();

  const finalRule = txt(
    'E[X + Y] = E[X] + E[Y]',
    P ? 28 : 27,
    C.green,
    CX,
    P ? 1.22 : 1.14,
    true,
    6.20
  );

  const finalNote = tag(
    'INDEPENDENT OR DEPENDENT',
    C.green,
    CX,
    P ? -2.96 : -2.24,
    18
  );

  await until(S(43));
  await play(
    ...replacePicture(
      expectedParts(expectedPicture),
      finalRule,
      finalNote
    ),
    ...say('EXPECTED TOTAL = SUM OF EXPECTED PARTS', C.green),
    ...fbox([
      ['E[T] = E[X] + E[Y]', C.green],
      '= 2 + 2',
      ['= 4 tokens', TC]
    ], C.green)
  );

  await until(S(43) + 2.30);
  await play(
    new M.Indicate(expectedPicture.x, {
      color: XC,
      runTime: 0.85
    }),
    new M.Indicate(expectedPicture.y, {
      color: YC,
      runTime: 0.85
    }),
    new M.Indicate(expectedPicture.t, {
      color: TC,
      runTime: 0.85
    }),
    ...say('ADD THE MEANS, LINKED OR NOT', C.green),
    ...fbox([
      ['E[X+Y] = E[X]+E[Y]', C.green],
      'no independence required'
    ], C.green)
  );

  await until(E(43));
}
