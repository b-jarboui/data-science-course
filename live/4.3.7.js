// lesson 4.3.7
// Joint and marginal laws: two rounds together, then each round alone.
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

  const SLICE_NAMES = ['GREY', 'BLUE 1', 'BLUE 2', 'GOLD'];
  const SLICE_PAY = [0, 2, 2, 4];

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

  const MARGINS = [4, 8, 4];

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const PINK = C.pink || '#F472B6';

  const COL = [GREY, BLUE, BLUE, GOLD];

  // Round one is always cyan; round two is always pink.
  const XC = C.cyan;
  const YC = PINK;
  const JC = C.violet;

  // Laptop + phone layout, following preceding lessons.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const say = (s, c = XC) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o, { runTime: 0.5 }));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o, { runTime: 0.5 }));

  // Track live objects without regrouping objects already on screen.
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
    const p = pill(s, color, size);
    const limit = maxw || (P ? FW - 1.1 : 6.5);

    if (p.getWidth() > limit) {
      p.scale(limit / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
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
      new M.FadeIn(g, { runTime: 0.5 })
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow, { runTime: 0.5 })
      );
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow, { runTime: 0.5 })
    ];

    boxNow = null;
    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins, consistent with preceding lessons.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.19) {
    const glow = circle(
      r * 1.45,
      x, y,
      GOLD,
      0.11,
      0
    );

    const face = circle(
      r,
      x, y,
      GOLD,
      0.88,
      2
    );

    const rim = circle(
      r * 0.73,
      x, y,
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

    return new M.VGroup(glow, face, rim, mark);
  }

  function coins(n, x, y, r = 0.16) {
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

    const gap = r * 2.65;

    return new M.VGroup(
      ...Array.from({ length: n }, (_, k) =>
        coin(
          x + (k - (n - 1) / 2) * gap,
          y,
          r
        )
      )
    );
  }

  // ----------------------------------------------------------
  // Original spinner.
  //
  // Grey:     upper right
  // Blue one: upper left
  // Blue two: lower left
  // Gold:     lower right
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

  function needle(cx, cy, r, a) {
    return arrow(
      polar(cx, cy, r * 0.03, a),
      polar(cx, cy, r * 0.87, a),
      C.ink,
      4,
      r * 0.17
    );
  }

  function wheelFace(cx, cy, r) {
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

    return new M.VGroup(...slices, rim);
  }

  function wheel(cx, cy, r, a = Math.PI / 12) {
    return new M.VGroup(
      wheelFace(cx, cy, r),
      needle(cx, cy, r, a),
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
  // Opening picture: two rounds of the same game.
  // ----------------------------------------------------------

  const ROUND_DX = P ? 1.66 : 1.72;
  const ROUND_Y = P ? -0.56 : -0.43;
  const ROUND_R = P ? 1.10 : 1.00;

  const RX = [
    CX - ROUND_DX,
    CX + ROUND_DX
  ];

  const ROUND_COL = [XC, YC];

  function roundShell(k) {
    const x = RX[k];
    const color = ROUND_COL[k];

    return new M.VGroup(
      rect(
        P ? 3.03 : 3.08,
        P ? 3.90 : 3.30,
        x,
        ROUND_Y,
        color,
        0.06
      ),

      txt(
        k === 0 ? 'ROUND ONE' : 'ROUND TWO',
        18,
        color,
        x,
        ROUND_Y + (P ? 1.61 : 1.37)
      )
    );
  }

  const roundFrames = [0, 1].map(roundShell);

  const roundFaces = RX.map(x =>
    wheelFace(x, ROUND_Y + 0.18, ROUND_R)
  );

  const pointers = RX.map(x =>
    needle(
      x,
      ROUND_Y + 0.18,
      ROUND_R,
      Math.PI / 12
    )
  );

  const hubs = RX.map(x =>
    circle(
      ROUND_R * 0.075,
      x,
      ROUND_Y + 0.18,
      C.ink,
      1,
      1
    )
  );

  // ----------------------------------------------------------
  // 0. The full game has two rounds.
  // ----------------------------------------------------------

  await until(S(0));
  await play(
    ...replacePicture(
      roundFrames,
      roundFaces,
      pointers,
      hubs
    ),
    ...say('ONE GAME · TWO ROUNDS')
  );

  // ----------------------------------------------------------
  // 1. Spin once, then spin again.
  //
  // Illustrative outcomes:
  // Round one lands on blue one, paying two.
  // Round two lands on gold, paying four.
  // ----------------------------------------------------------

  const firstAngle = 3 * Math.PI / 4;
  const secondAngle = 7 * Math.PI / 4;

  const spinOneReward = coins(
    2,
    RX[0],
    ROUND_Y - (P ? 1.35 : 1.19),
    0.17
  );

  const spinTwoReward = coins(
    4,
    RX[1],
    ROUND_Y - (P ? 1.35 : 1.19),
    0.14
  );

  await until(S(1));
  await play(
    new M.Rotate(pointers[0], {
      angle: 2 * Math.PI +
        firstAngle - Math.PI / 12,
      aboutPoint: [
        RX[0],
        ROUND_Y + 0.18,
        0
      ],
      runTime: 0.95
    }),
    ...say('FIRST SPIN', XC)
  );

  await play(
    ...addPicture(spinOneReward),
    new M.Rotate(pointers[1], {
      angle: 2 * Math.PI +
        secondAngle - Math.PI / 12,
      aboutPoint: [
        RX[1],
        ROUND_Y + 0.18,
        0
      ],
      runTime: 0.95
    }),
    ...say('THEN SPIN AGAIN', YC)
  );

  await play(
    ...addPicture(spinTwoReward)
  );

  // ----------------------------------------------------------
  // 2. Round one pays X; round two pays Y.
  // Both variables can be zero, two or four.
  // ----------------------------------------------------------

  const roundVariables = [
    tag(
      'X = 0, 2 OR 4',
      XC,
      RX[0],
      P ? -3.15 : -2.40,
      17,
      2.95
    ),

    tag(
      'Y = 0, 2 OR 4',
      YC,
      RX[1],
      P ? -3.15 : -2.40,
      17,
      2.95
    )
  ];

  await until(S(2));
  await play(
    ...addPicture(roundVariables),
    ...say('ROUND ONE: X · ROUND TWO: Y'),
    ...fbox([
      ['X = round one payout', XC],
      ['Y = round two payout', YC],
      'each is 0, 2 or 4'
    ], JC)
  );

  // ----------------------------------------------------------
  // 3. One spin does not affect the other.
  //
  // Keep the first pointer fixed and show different
  // illustrative possibilities for the second spin.
  // ----------------------------------------------------------

  const independentNote = tag(
    'FIRST RESULT DOES NOT CHANGE SECOND CHANCES',
    C.green,
    CX,
    P ? -4.02 : -2.92,
    14,
    6.30
  );

  await until(S(3));
  await play(
    ...removePicture(
      spinOneReward,
      spinTwoReward
    ),
    ...addPicture(independentNote),
    new M.Rotate(pointers[1], {
      angle: Math.PI / 2,
      aboutPoint: [
        RX[1],
        ROUND_Y + 0.18,
        0
      ],
      runTime: 1.1
    }),
    ...say('THE TWO SPINS DO NOT AFFECT EACH OTHER', C.green),
    ...fbox([
      'knowing X',
      ['does not change Y’s chances', YC]
    ], C.green)
  );

  await play(
    new M.Rotate(pointers[1], {
      angle: Math.PI,
      aboutPoint: [
        RX[1],
        ROUND_Y + 0.18,
        0
      ],
      runTime: 1.1
    })
  );

  // ----------------------------------------------------------
  // 4. This is independence.
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    ...say('INDEPENDENCE', C.green),
    ...fbox([
      ['independent spins', C.green],
      'neither affects the other'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 5. How likely is each pair of payouts?
  // ----------------------------------------------------------

  const pairQuestion = new M.VGroup(
    rect(
      P ? 5.95 : 6.10,
      P ? 2.85 : 2.55,
      CX,
      -0.45,
      JC,
      0.08
    ),

    txt(
      'ROUND ONE',
      17,
      XC,
      CX - 1.45,
      0.48
    ),

    txt(
      'ROUND TWO',
      17,
      YC,
      CX + 1.45,
      0.48
    ),

    txt(
      'X',
      43,
      XC,
      CX - 1.45,
      -0.20,
      true
    ),

    txt(
      'Y',
      43,
      YC,
      CX + 1.45,
      -0.20,
      true
    ),

    txt(
      ',',
      37,
      JC,
      CX,
      -0.20,
      true
    ),

    txt(
      'Chance of this pair?',
      21,
      C.amber,
      CX,
      -1.38
    )
  );

  await until(S(5));
  await play(
    ...replacePicture(pairQuestion),
    ...say('HOW LIKELY IS EACH PAIR?', C.amber),
    ...fbox([
      'X and Y together',
      ['chance of a pair = ?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Four-by-four slice-pair grid.
  //
  // The two blue slices remain distinct outcomes here.
  // Each cell represents one ordered pair of actual slices.
  // ----------------------------------------------------------

  const GRID = P ? 1.02 : 0.85;

  const GRID_X0 = CX - 1.25 * GRID;
  const GRID_Y0 = P ? -0.30 : 0.12;

  const gridX = j => GRID_X0 + j * GRID;
  const gridY = i => GRID_Y0 - i * GRID;

  function sliceBadge(k, x, y, axisColor, horizontal = false) {
    const w = horizontal ? GRID - 0.045 : GRID * 1.38;
    const h = horizontal ? 0.65 : GRID - 0.045;

    const frame = rect(
      w,
      h,
      x,
      y,
      axisColor,
      0.10,
      1.5
    );

    const marker = circle(
      0.105,
      x,
      y + 0.13,
      COL[k],
      0.95,
      1
    );

    const label = txt(
      ['Grey', 'Blue 1', 'Blue 2', 'Gold'][k],
      16,
      COL[k] === '#3B82F6' ? '#93C5FD' : COL[k],
      x,
      y - 0.16,
      false,
      w - 0.12
    );

    return new M.VGroup(
      frame,
      marker,
      label
    );
  }

  function slicePairCell(i, j, revealChance = false) {
    const x = gridX(j);
    const y = gridY(i);

    const frame = rect(
      GRID - 0.045,
      GRID - 0.045,
      x,
      y,
      JC,
      0.06,
      1.5
    );

    const rr = P ? 0.125 : 0.105;

    const first = circle(
      rr,
      x - GRID * 0.20,
      y + GRID * 0.13,
      COL[i],
      0.92,
      1
    );

    const second = circle(
      rr,
      x + GRID * 0.20,
      y + GRID * 0.13,
      COL[j],
      0.92,
      1
    );

    const label = txt(
      revealChance ? '1/16' : '1 pair',
      P ? 19 : 17,
      C.ink,
      x,
      y - GRID * 0.22,
      false,
      GRID - 0.08
    );

    return new M.VGroup(
      frame,
      first,
      second,
      label
    );
  }

  const sliceRowHeaders = COL.map((_, i) =>
    sliceBadge(
      i,
      GRID_X0 - GRID * 1.24,
      gridY(i),
      XC
    )
  );

  const sliceColHeaders = COL.map((_, j) =>
    sliceBadge(
      j,
      gridX(j),
      GRID_Y0 + GRID * 0.83,
      YC,
      true
    )
  );

  const sliceXHeading = txt(
    'ROUND ONE',
    15,
    XC,
    GRID_X0 - GRID * 1.24,
    GRID_Y0 + GRID * 0.83,
    false,
    GRID * 1.40
  );

  const sliceYHeading = txt(
    'ROUND TWO',
    17,
    YC,
    (gridX(0) + gridX(3)) / 2,
    GRID_Y0 + GRID * 1.45
  );

  const sliceCells = COL.map((_, i) =>
    COL.map((__, j) =>
      slicePairCell(i, j, false)
    )
  );

  const gridCaption = tag(
    'EACH PAIR: 1/16',
    JC,
    CX,
    P ? -4.5 : -3.3,
    17
  );

  // ----------------------------------------------------------
  // 6. Count pairs of slices.
  // ----------------------------------------------------------

  await until(S(6));
  await play(
    ...replacePicture(sliceXHeading),
    ...say('START WITH THE ACTUAL SLICES', JC),
    ...fbox([
      'count slice pairs',
      'before grouping payouts'
    ], JC)
  );

  // ----------------------------------------------------------
  // 7. Four slices in each round.
  // ----------------------------------------------------------

  await until(S(7));

  register(
    sliceRowHeaders,
    sliceColHeaders,
    sliceYHeading
  );

  await play(
    new M.LaggedStart(
      sliceRowHeaders.map(h => new M.FadeIn(h)),
      {
        lagRatio: 0.12,
        runTime: 1.15
      }
    ),
    new M.LaggedStart(
      sliceColHeaders.map(h => new M.FadeIn(h)),
      {
        lagRatio: 0.12,
        runTime: 1.15
      }
    ),
    new M.FadeIn(sliceYHeading),
    ...say('FOUR SLICES IN EACH ROUND'),
    ...fbox([
      ['round one: 4 slices', XC],
      ['round two: 4 slices', YC]
    ], JC)
  );

  // ----------------------------------------------------------
  // 8. Four times four makes sixteen equally likely pairs.
  // ----------------------------------------------------------

  await until(S(8));

  register(sliceCells);

  await play(
    new M.LaggedStart(
      sliceCells.flat().map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.06,
        runTime: 1.8
      }
    ),
    ...say('4 × 4 = 16 EQUALLY LIKELY PAIRS', JC),
    ...fbox([
      '4 × 4',
      ['= 16 slice pairs', JC]
    ], JC)
  );

  // ----------------------------------------------------------
  // 9. Each slice pair has probability 1/16.
  // ----------------------------------------------------------

  await until(S(9));
  register(gridCaption);
  await play(
    new M.FadeIn(gridCaption),
    ...sliceCells.flatMap((row, i) =>
      row.map((cell, j) =>
        new M.Transform(
          cell,
          slicePairCell(i, j, true),
          { runTime: 0.75 }
        )
      )
    ),
    ...say('EACH PAIR HAS CHANCE 1/16', JC),
    ...fbox([
      '1/4 × 1/4',
      ['= 1/16', JC]
    ], JC)
  );

  // ----------------------------------------------------------
  // Three-by-three joint payout table.
  //
  // Rows:    X = 0, 2, 4
  // Columns: Y = 0, 2, 4
  //
  // Every interior cell displays a numerator in sixteenths.
  // The label above the table makes this denominator explicit.
  // Margins will appear to the right and below.
  // ----------------------------------------------------------

  const CW = P ? 1.25 : 1.22;
  const RH = P ? 1.02 : 0.76;

  const JX0 = CX - 1.35;
  const JY0 = P ? -0.23 : 0.18;

  const jx = j => JX0 + j * CW;
  const jy = i => JY0 - i * RH;

  const ROW_X = JX0 - CW * 0.88;
  const COL_Y = JY0 + RH * 0.85;

  const MARGIN_X = jx(2) + CW * 1.14;
  const MARGIN_Y = jy(2) - RH * 1.12;

  function jointFrame(i, j, count = null, color = JC) {
    const x = jx(j);
    const y = jy(i);

    const opacity = count === null
      ? 0.045
      : count === 0
        ? 0.025
        : 0.10 + count * 0.055;

    return rect(
      CW - 0.045,
      RH - 0.045,
      x,
      y,
      count === 0 ? C.muted : color,
      opacity,
      1.5
    );
  }

  function jointNumber(i, j, count) {
    return txt(
      String(count),
      P ? 29 : 27,
      count === 0 ? C.muted : C.ink,
      jx(j),
      jy(i),
      true
    );
  }

  function jointCell(i, j, count) {
    return new M.VGroup(
      jointFrame(i, j, count),
      jointNumber(i, j, count)
    );
  }

  function headerCell(value, x, y, color, w = CW - 0.045) {
    const r = rect(
      w,
      RH * 0.69,
      x,
      y,
      color,
      0.15,
      1.5
    );

    const t = txt(
      String(value),
      22,
      color,
      x,
      y,
      true
    );

    return new M.VGroup(r, t);
  }

  function makeTable(matrix = NORMAL) {
    const rowHeaders = VALUES.map((v, i) =>
      headerCell(
        v,
        ROW_X,
        jy(i),
        XC,
        CW * 0.67
      )
    );

    const colHeaders = VALUES.map((v, j) =>
      headerCell(
        v,
        jx(j),
        COL_Y,
        YC
      )
    );

    const rowTitle = txt(
      'X',
      24,
      XC,
      ROW_X,
      COL_Y,
      true
    );

    const colTitle = txt(
      'Y',
      24,
      YC,
      jx(1),
      COL_Y + RH * 0.61,
      true
    );

    const frames = VALUES.map((_, i) =>
      VALUES.map((__, j) =>
        jointFrame(i, j)
      )
    );

    const entries = matrix.map((row, i) =>
      row.map((n, j) =>
        jointNumber(i, j, n)
      )
    );

    const denominator = txt(
      'All interior entries are in sixteenths',
      16,
      C.muted,
      CX,
      P ? -4.51 : -2.78,
      false,
      6.25
    );

    return {
      rowHeaders,
      colHeaders,
      rowTitle,
      colTitle,
      frames,
      entries,
      denominator,
      matrix
    };
  }

  function tableParts(t) {
    return [
      t.rowHeaders,
      t.colHeaders,
      t.rowTitle,
      t.colTitle,
      t.frames,
      t.entries,
      t.denominator
    ];
  }

  let table = makeTable();

  const revealed = Array.from(
    { length: 3 },
    () => [false, false, false]
  );

  function revealCell(i, j) {
    if (revealed[i][j]) return [];

    revealed[i][j] = true;

    register(table.entries[i][j]);

    return [
      new M.Transform(
        table.frames[i][j],
        jointFrame(
          i,
          j,
          table.matrix[i][j]
        ),
        { runTime: 0.45 }
      ),
      new M.FadeIn(
        table.entries[i][j],
        { runTime: 0.45 }
      )
    ];
  }

  // ----------------------------------------------------------
  // 10. Rows are round-one payouts: zero, two, four.
  // ----------------------------------------------------------

  await until(S(10));
  await play(
    ...replacePicture(
      table.frames,
      table.rowHeaders,
      table.rowTitle
    ),
    ...say('ROWS: ROUND ONE PAYOUT X', XC),
    ...fbox([
      ['rows = X', XC],
      '0, 2, 4 tokens'
    ], XC)
  );

  // ----------------------------------------------------------
  // 11. Columns are round-two payouts: zero, two, four.
  // ----------------------------------------------------------

  await until(S(11));
  await play(
    ...addPicture(
      table.colHeaders,
      table.colTitle
    ),
    ...say('COLUMNS: ROUND TWO PAYOUT Y', YC),
    ...fbox([
      ['columns = Y', YC],
      '0, 2, 4 tokens'
    ], YC)
  );

  // ----------------------------------------------------------
  // 12. Each cell holds the probability of that payout pair.
  // ----------------------------------------------------------

  function cellOutline(i, j, color = C.amber) {
    return outline(
      CW + 0.045,
      RH + 0.045,
      jx(j),
      jy(i),
      color
    );
  }

  let focus = cellOutline(0, 0);

  await until(S(12));

  register(focus);

  await play(
    new M.Create(focus, { runTime: 0.55 }),
    ...addPicture(table.denominator),
    ...say('ONE CELL = ONE PAYOUT PAIR', JC),
    ...fbox([
      ['P(X = x and Y = y)', JC]
    ], JC)
  );

  // ----------------------------------------------------------
  // Small slice-pair chips.
  //
  // These show exactly which distinct slice pairs
  // contribute to a joint payout cell.
  // ----------------------------------------------------------

  const CHIPY = P ? -3.70 : -2.10;
  const CHIPW = P ? 1.33 : 1.34;
  const CHIPH = P ? 0.69 : 0.56;

  function pairChip(i, j, x, y = CHIPY) {
    const frame = rect(
      CHIPW,
      CHIPH,
      x,
      y,
      JC,
      0.09
    );

    const a = circle(
      0.115,
      x - CHIPW * 0.30,
      y + 0.10,
      COL[i],
      0.96,
      1
    );

    const b = circle(
      0.115,
      x + CHIPW * 0.30,
      y + 0.10,
      COL[j],
      0.96,
      1
    );

    const label = txt(
      '1/16',
      16,
      C.ink,
      x,
      y - 0.14,
      true
    );

    return new M.VGroup(
      frame,
      a,
      b,
      label
    );
  }

  function matchingPairs(x, y) {
    const pairs = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (
          SLICE_PAY[i] === x &&
          SLICE_PAY[j] === y
        ) {
          pairs.push([i, j]);
        }
      }
    }

    return pairs.map(([i, j], k) =>
      pairChip(
        i,
        j,
        CX + (k - (pairs.length - 1) / 2) * 1.45
      )
    );
  }

  let pairChips = matchingPairs(0, 0);

  // ----------------------------------------------------------
  // 13. Zero then zero: grey with grey.
  // One slice pair, so 1/16.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    ...addPicture(pairChips),
    new M.Indicate(table.rowHeaders[0], {
      color: XC,
      runTime: 0.7
    }),
    new M.Indicate(table.colHeaders[0], {
      color: YC,
      runTime: 0.7
    }),
    ...say('ZERO THEN ZERO: GREY WITH GREY', GREY),
    ...fbox([
      'grey with grey',
      ['1 pair = 1/16', JC]
    ], JC)
  );

  await play(
    ...revealCell(0, 0)
  );

  // ----------------------------------------------------------
  // 14. Zero then two: grey with either blue.
  // Two slice pairs, so 2/16.
  // ----------------------------------------------------------

  const chips02 = matchingPairs(0, 2);

  await until(S(14));
  await play(
    ...removePicture(pairChips),
    ...addPicture(chips02),
    new M.Transform(
      focus,
      cellOutline(0, 1),
      { runTime: 0.6 }
    ),
    ...say('ZERO THEN TWO: EITHER BLUE', BLUE),
    ...fbox([
      'grey + blue one',
      'grey + blue two',
      ['2 pairs = 2/16', JC]
    ], JC)
  );

  pairChips = chips02;

  await play(
    ...revealCell(0, 1)
  );

  // ----------------------------------------------------------
  // 15. Two then two: either blue with either blue.
  // Four actual slice pairs, so 4/16.
  // ----------------------------------------------------------

  const chips22 = matchingPairs(2, 2);

  await until(S(15));
  await play(
    ...removePicture(pairChips),
    new M.Transform(
      focus,
      cellOutline(1, 1),
      { runTime: 0.65 }
    ),
    new M.Indicate(table.rowHeaders[1], {
      color: XC,
      runTime: 0.85
    }),
    new M.Indicate(table.colHeaders[1], {
      color: YC,
      runTime: 0.85
    }),
    ...say('EITHER BLUE WITH EITHER BLUE', BLUE),
    ...fbox([
      ['2 blue choices for X', XC],
      ['2 blue choices for Y', YC],
      '2 × 2 = 4 pairs'
    ], JC)
  );

  register(chips22);

  await play(
    new M.LaggedStart(
      chips22.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.24,
        runTime: 1.8
      }
    )
  );

  pairChips = chips22;

  await play(
    ...revealCell(1, 1),
    ...fbox([
      '2 × 2 = 4 pairs',
      ['chance = 4/16', JC]
    ], JC)
  );

  // ----------------------------------------------------------
  // 16. Fill every cell in the same way.
  //
  // Keep each row's remaining values hidden until
  // its numbers are read aloud in beats 17, 18 and 19.
  // ----------------------------------------------------------

  await until(S(16));
  await play(
    ...removePicture(
      focus,
      pairChips
    ),
    ...say('COUNT THE MATCHING PAIRS IN EVERY CELL', JC),
    ...fbox([
      'count matching slice pairs',
      ['divide each count by 16', JC]
    ], JC)
  );

  function rowOutline(i, color = C.amber, includeMargin = false) {
    const left = jx(0) - CW / 2 - 0.045;

    const right = includeMargin
      ? MARGIN_X + CW / 2 + 0.045
      : jx(2) + CW / 2 + 0.045;

    return outline(
      right - left,
      RH + 0.045,
      (left + right) / 2,
      jy(i),
      color
    );
  }

  function colOutline(j, color = C.amber, includeMargin = false) {
    const top = jy(0) + RH / 2 + 0.045;

    const bottom = includeMargin
      ? MARGIN_Y - RH * 0.39
      : jy(2) - RH / 2 - 0.045;

    return outline(
      CW + 0.045,
      top - bottom,
      jx(j),
      (top + bottom) / 2,
      color
    );
  }

  let rowFocus = rowOutline(0);

  // ----------------------------------------------------------
  // 17. First row: one, two, one.
  // ----------------------------------------------------------

  await until(S(17));

  register(rowFocus);

  await play(
    new M.FadeIn(rowFocus, { runTime: 0.35 }),
    ...revealCell(0, 2),
    // quick swap so the old pill does not linger as a ghost
    ...say('ROW ZERO: 1, 2, 1', XC).map(a => { a.duration = 0.35; return a; })
  );

  // ----------------------------------------------------------
  // 18. Second row: two, four, two.
  // ----------------------------------------------------------

  await until(S(18));
  await play(
    new M.Transform(
      rowFocus,
      rowOutline(1),
      { runTime: 0.35 }
    ),
    ...revealCell(1, 0),
    ...revealCell(1, 2),
    ...say('ROW TWO: 2, 4, 2', XC)
  );

  // ----------------------------------------------------------
  // 19. Third row: one, two, one.
  // ----------------------------------------------------------

  await until(S(19));
  await play(
    new M.Transform(
      rowFocus,
      rowOutline(2),
      { runTime: 0.35 }
    ),
    ...revealCell(2, 0),
    ...revealCell(2, 1),
    ...revealCell(2, 2),
    ...say('ROW FOUR: 1, 2, 1', XC)
  );

  // ----------------------------------------------------------
  // 20. All nine cells add to sixteen sixteenths, or one.
  // ----------------------------------------------------------

  const tableOutline = outline(
    3 * CW + 0.10,
    3 * RH + 0.10,
    jx(1),
    jy(1),
    C.green
  );

  const totalChance = tag(
    '16/16 = 1',
    C.green,
    CX,
    P ? -3.75 : -2.28,
    20
  );

  await until(S(20));
  await play(
    ...removePicture(rowFocus),
    ...addPicture(
      tableOutline,
      totalChance
    ),
    ...say('ALL JOINT CHANCES ADD TO ONE', C.green),
    ...fbox([
      '1 + 2 + 1',
      '+ 2 + 4 + 2',
      '+ 1 + 2 + 1 = 16',
      ['16/16 = 1', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 21. This is a joint distribution.
  // ----------------------------------------------------------

  await until(S(21));
  await play(
    ...removePicture(tableOutline),
    ...say('JOINT DISTRIBUTION', JC),
    ...fbox([
      ['joint distribution', JC],
      'chance of every payout pair'
    ], JC)
  );

  // ----------------------------------------------------------
  // 22. Joint means both rounds together.
  // ----------------------------------------------------------

  await until(S(22));
  await play(
    new M.Indicate(table.rowTitle, {
      color: XC,
      runTime: 0.7
    }),
    new M.Indicate(table.colTitle, {
      color: YC,
      runTime: 0.7
    }),
    ...say('JOINT = BOTH TOGETHER', JC),
    ...fbox([
      ['X and Y', JC],
      'both rounds together'
    ], JC)
  );

  // ----------------------------------------------------------
  // 23. Suppose we only care about round one.
  // ----------------------------------------------------------

  await until(S(23));
  await play(
    ...removePicture(totalChance),
    new M.Indicate(table.rowTitle, {
      color: XC,
      runTime: 0.7
    }),
    ...say('WHAT IF WE ONLY WANT ROUND ONE?', XC),
    ...fbox([
      ['only X', XC],
      'whatever Y turns out to be'
    ], XC)
  );

  // ----------------------------------------------------------
  // Row and column sums.
  //
  // Marginal cells are displayed as simplified probabilities.
  // Interior entries remain counts in sixteenths.
  // ----------------------------------------------------------

  function rowMargin(i, value = FRACTIONS[i]) {
    const x = MARGIN_X;
    const y = jy(i);

    return new M.VGroup(
      rect(
        CW * 0.91,
        RH - 0.045,
        x,
        y,
        XC,
        0.16,
        2
      ),

      txt(
        value,
        P ? 25 : 23,
        XC,
        x,
        y,
        true,
        CW * 0.76
      )
    );
  }

  function colMargin(j, value = FRACTIONS[j]) {
    const x = jx(j);
    const y = MARGIN_Y;

    return new M.VGroup(
      rect(
        CW - 0.045,
        RH * 0.73,
        x,
        y,
        YC,
        0.16,
        2
      ),

      txt(
        value,
        P ? 25 : 23,
        YC,
        x,
        y,
        true
      )
    );
  }

  function marginHeadingX() {
    return txt(
      'P(X)',
      18,
      XC,
      MARGIN_X,
      COL_Y,
      true,
      CW
    );
  }

  function marginHeadingY() {
    return txt(
      'P(Y)',
      18,
      YC,
      ROW_X,
      MARGIN_Y,
      true,
      CW
    );
  }

  function totalMargin() {
    return new M.VGroup(
      rect(
        CW * 0.91,
        RH * 0.73,
        MARGIN_X,
        MARGIN_Y,
        C.green,
        0.13
      ),

      txt(
        '1',
        23,
        C.green,
        MARGIN_X,
        MARGIN_Y,
        true
      )
    );
  }

  function rowSweep(i) {
    return arrow(
      [
        jx(0) - CW * 0.42,
        jy(i) - RH * 0.36,
        0
      ],
      [
        MARGIN_X - CW * 0.47,
        jy(i) - RH * 0.36,
        0
      ],
      XC,
      2.5,
      0.12
    );
  }

  let rowMargins = [0, 1, 2].map(i =>
    rowMargin(i)
  );

  let colMargins = [0, 1, 2].map(j =>
    colMargin(j)
  );

  let xMarginTitle = marginHeadingX();
  let yMarginTitle = marginHeadingY();
  let grandTotal = totalMargin();

  let sweep = rowSweep(0);

  rowFocus = rowOutline(0, XC);

  // ----------------------------------------------------------
  // 24. Add along each row to sweep Y away.
  // ----------------------------------------------------------

  await until(S(24));

  register(
    rowFocus,
    sweep,
    xMarginTitle
  );

  await play(
    new M.Create(rowFocus, { runTime: 0.6 }),
    new M.Create(sweep, { runTime: 0.8 }),
    new M.FadeIn(xMarginTitle),
    ...say('ADD ACROSS THE ROW', XC),
    ...fbox([
      'keep X fixed',
      'include every Y',
      ['add the row', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 25. Row zero:
  // (1 + 2 + 1)/16 = 4/16 = 1/4.
  // ----------------------------------------------------------

  const rowSum0 = txt(
    '1 + 2 + 1 = 4',
    19,
    XC,
    CX,
    P ? -3.77 : -2.23,
    true
  );

  await until(S(25));
  await play(
    ...addPicture(rowSum0),
    new M.LaggedStart(
      table.entries[0].map(t =>
        new M.Indicate(t, {
          color: XC
        })
      ),
      {
        lagRatio: 0.22,
        runTime: 1.8
      }
    ),
    ...say('ROW ZERO: ADD 1 + 2 + 1', XC),
    ...fbox([
      '(1 + 2 + 1)/16',
      '= 4/16',
      ['= 1/4', XC]
    ], XC)
  );

  await play(
    ...addPicture(rowMargins[0])
  );

  // ----------------------------------------------------------
  // 26. Row two:
  // (2 + 4 + 2)/16 = 8/16 = 1/2.
  // ----------------------------------------------------------

  const rowSum1 = txt(
    '2 + 4 + 2 = 8',
    19,
    XC,
    CX,
    P ? -3.77 : -2.23,
    true
  );

  await until(S(26));
  await play(
    ...removePicture(rowSum0),
    ...addPicture(rowSum1),
    new M.Transform(
      rowFocus,
      rowOutline(1, XC),
      { runTime: 0.55 }
    ),
    new M.Transform(
      sweep,
      rowSweep(1),
      { runTime: 0.55 }
    ),
    new M.LaggedStart(
      table.entries[1].map(t =>
        new M.Indicate(t, {
          color: XC
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.5
      }
    ),
    ...say('ROW TWO: ADD 2 + 4 + 2', XC),
    ...fbox([
      '(2 + 4 + 2)/16',
      '= 8/16',
      ['= 1/2', XC]
    ], XC)
  );

  await play(
    ...addPicture(rowMargins[1])
  );

  // ----------------------------------------------------------
  // 27. Row four:
  // (1 + 2 + 1)/16 = 4/16 = 1/4.
  // ----------------------------------------------------------

  const rowSum2 = txt(
    '1 + 2 + 1 = 4',
    19,
    XC,
    CX,
    P ? -3.77 : -2.23,
    true
  );

  await until(S(27));
  await play(
    ...removePicture(rowSum1),
    ...addPicture(rowSum2),
    new M.Transform(
      rowFocus,
      rowOutline(2, XC),
      { runTime: 0.5 }
    ),
    new M.Transform(
      sweep,
      rowSweep(2),
      { runTime: 0.5 }
    ),
    ...say('ROW FOUR: ANOTHER QUARTER', XC),
    ...fbox([
      '(1 + 2 + 1)/16',
      '= 4/16',
      ['= 1/4', XC]
    ], XC)
  );

  await play(
    ...addPicture(rowMargins[2])
  );

  // ----------------------------------------------------------
  // Marginal probability bars.
  // Same 0–4 line and heights as lesson 4.3.2.
  // ----------------------------------------------------------

  const PMFBASE = P ? -3.45 : -2.10;
  const PMFW = P ? 5.85 : 6.10;
  const PMFQH = P ? 1.48 : 1.08;
  const BARW = P ? 0.82 : 0.76;

  const pmfX = v =>
    CX - PMFW / 2 + 0.63 +
    v / 4 * (PMFW - 1.26);

  function marginalPlot(variable, color) {
    const axis = line(
      [CX - PMFW / 2, PMFBASE, 0],
      [CX + PMFW / 2, PMFBASE, 0],
      C.muted,
      2
    );

    const ticks = [0, 1, 2, 3, 4].map(v =>
      new M.VGroup(
        line(
          [pmfX(v), PMFBASE - 0.06, 0],
          [pmfX(v), PMFBASE + 0.06, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          VALUES.includes(v) ? 19 : 16,
          VALUES.includes(v) ? C.ink : C.muted,
          pmfX(v),
          PMFBASE - 0.28,
          true
        )
      )
    );

    const bars = VALUES.map((v, k) => {
      const h = 4 * PMFQH * PROBS[k];
      const x = pmfX(v);

      const glow = new M.Rectangle({
        width: BARW + 0.20,
        height: h + 0.04,
        color,
        strokeWidth: 0
      });

      glow.setFill(color, 0.10);
      glow.moveTo([x, PMFBASE + h / 2, 0]);

      const body = new M.Rectangle({
        width: BARW,
        height: h,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.75);
      body.moveTo([x, PMFBASE + h / 2, 0]);

      const label = txt(
        FRACTIONS[k],
        22,
        color,
        x,
        PMFBASE + h + 0.29,
        true
      );

      return new M.VGroup(
        glow,
        body,
        label
      );
    });

    const title = txt(
      variable === 'X'
        ? 'ROUND ONE ALONE'
        : 'ROUND TWO ALONE',
      20,
      color,
      CX,
      P ? 1.08 : 1.12
    );

    const unit = txt(
      `${variable} (tokens)`,
      17,
      color,
      CX,
      PMFBASE - 0.70
    );

    return {
      axis,
      ticks,
      bars,
      title,
      unit
    };
  }

  function plotParts(p) {
    return [
      p.axis,
      p.ticks,
      p.bars,
      p.title,
      p.unit
    ];
  }

  const marginalXPlot = marginalPlot('X', XC);

  // ----------------------------------------------------------
  // 28. The original round-one probability bars are back.
  // ----------------------------------------------------------

  await until(S(28));
  await play(
    ...replacePicture(
      plotParts(marginalXPlot)
    ),
    ...say('THE ROUND-ONE BARS ARE BACK', XC),
    ...fbox([
      ['P(X = 0) = 1/4', XC],
      ['P(X = 2) = 1/2', XC],
      ['P(X = 4) = 1/4', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // Build a complete table without changing
  // the individual objects after they are on screen.
  // ----------------------------------------------------------

  function completeTable(matrix, withX = true, withY = true) {
    const t = makeTable(matrix);

    t.frames = matrix.map((row, i) =>
      row.map((n, j) =>
        jointFrame(i, j, n)
      )
    );

    const xm = [0, 1, 2].map(i => rowMargin(i));
    const ym = [0, 1, 2].map(j => colMargin(j));

    const xTitle = marginHeadingX();
    const yTitle = marginHeadingY();
    const total = totalMargin();

    return {
      table: t,
      rowMargins: xm,
      colMargins: ym,
      xTitle,
      yTitle,
      total,
      withX,
      withY
    };
  }

  function fullTableParts(t) {
    return [
      tableParts(t.table),

      ...(t.withX
        ? [t.rowMargins, t.xTitle]
        : []),

      ...(t.withY
        ? [t.colMargins, t.yTitle]
        : []),

      ...(t.withX && t.withY
        ? [t.total]
        : [])
    ];
  }

  let full = completeTable(NORMAL, true, false);

  // ----------------------------------------------------------
  // 29. Write the row sums in the margin.
  // ----------------------------------------------------------

  const marginOutline = outline(
    CW * 1.02,
    3 * RH + 0.09,
    MARGIN_X,
    jy(1),
    XC
  );

  await until(S(29));
  await play(
    ...replacePicture(
      fullTableParts(full),
      marginOutline
    ),
    ...say('PUT THE SUMS AT THE EDGE', XC),
    ...fbox([
      'row sums',
      ['written in the margin', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 30. That is the marginal distribution.
  // ----------------------------------------------------------

  await until(S(30));
  await play(
    new M.Indicate(marginOutline, {
      color: XC,
      runTime: 1.0
    }),
    ...say('MARGINAL DISTRIBUTION', XC),
    ...fbox([
      ['marginal distribution of X', XC],
      'round one on its own'
    ], XC)
  );

  // ----------------------------------------------------------
  // 31. Add down each column for the marginal of Y.
  // The three numbers are again 1/4, 1/2, 1/4.
  // ----------------------------------------------------------

  function colSweep(j) {
    return arrow(
      [
        jx(j) + CW * 0.36,
        jy(0) + RH * 0.38,
        0
      ],
      [
        jx(j) + CW * 0.36,
        MARGIN_Y + RH * 0.40,
        0
      ],
      YC,
      2.5,
      0.12
    );
  }

  const columnSweeps = [0, 1, 2].map(colSweep);

  const yMarginOutline = outline(
    3 * CW + 0.08,
    RH * 0.83,
    jx(1),
    MARGIN_Y,
    YC
  );

  await until(S(31));

  register(
    columnSweeps,
    full.yTitle
  );

  await play(
    ...removePicture(marginOutline),
    new M.LaggedStart(
      columnSweeps.map(a => new M.Create(a)),
      {
        lagRatio: 0.16,
        runTime: 1.35
      }
    ),
    new M.FadeIn(full.yTitle),
    ...say('ADD DOWN THE COLUMNS FOR Y', YC),
    ...fbox([
      '(1 + 2 + 1)/16 = 1/4',
      '(2 + 4 + 2)/16 = 1/2',
      ['(1 + 2 + 1)/16 = 1/4', YC]
    ], YC)
  );

  register(
    full.colMargins,
    full.total,
    yMarginOutline
  );

  await play(
    new M.LaggedStart(
      full.colMargins.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.27,
        runTime: 1.5
      }
    ),
    new M.FadeIn(full.total),
    new M.Create(yMarginOutline, {
      runTime: 0.7
    }),
    ...removePicture(columnSweeps)
  );

  full.withY = true;

  // ----------------------------------------------------------
  // 32. The middle joint cell is 4/16 = 1/4.
  // Its two marginal probabilities are both 1/2.
  // Therefore 1/2 × 1/2 = 1/4.
  // ----------------------------------------------------------

  const middleFocus = cellOutline(
    1,
    1,
    C.amber
  );

  const middleXFocus = outline(
    CW * 1.02,
    RH + 0.05,
    MARGIN_X,
    jy(1),
    XC
  );

  const middleYFocus = outline(
    CW + 0.05,
    RH * 0.83,
    jx(1),
    MARGIN_Y,
    YC
  );

  const middleLinkX = arrow(
    [
      MARGIN_X - CW * 0.48,
      jy(1),
      0
    ],
    [
      jx(1) + CW * 0.51,
      jy(1),
      0
    ],
    XC,
    2.5,
    0.12
  );

  const middleLinkY = arrow(
    [
      jx(1),
      MARGIN_Y + RH * 0.40,
      0
    ],
    [
      jx(1),
      jy(1) - RH * 0.53,
      0
    ],
    YC,
    2.5,
    0.12
  );

  await until(S(32));
  await play(
    ...removePicture(yMarginOutline),
    ...addPicture(
      middleFocus,
      middleXFocus,
      middleYFocus
    ),
    ...say('MIDDLE CELL: HALF TIMES HALF', C.amber),
    ...fbox([
      'P(X = 2 and Y = 2)',
      '= 4/16 = 1/4',
      ['1/2 × 1/2 = 1/4', C.amber]
    ], C.amber)
  );

  register(
    middleLinkX,
    middleLinkY
  );

  await play(
    new M.Create(middleLinkX, {
      runTime: 0.85
    }),
    new M.Create(middleLinkY, {
      runTime: 0.85
    })
  );

  // ----------------------------------------------------------
  // 33. Each normal-game cell is the product of
  // its two marginal probabilities.
  //
  // Show two additional examples after the middle cell.
  // ----------------------------------------------------------

  function productFocus(i, j) {
    return [
      cellOutline(i, j, C.amber),

      outline(
        CW * 1.02,
        RH + 0.05,
        MARGIN_X,
        jy(i),
        XC
      ),

      outline(
        CW + 0.05,
        RH * 0.83,
        jx(j),
        MARGIN_Y,
        YC
      )
    ];
  }

  const product00 = productFocus(0, 0);

  await until(S(33));
  await play(
    ...removePicture(
      middleLinkX,
      middleLinkY
    ),
    new M.Transform(
      middleFocus,
      product00[0],
      { runTime: 0.55 }
    ),
    new M.Transform(
      middleXFocus,
      product00[1],
      { runTime: 0.55 }
    ),
    new M.Transform(
      middleYFocus,
      product00[2],
      { runTime: 0.55 }
    ),
    ...say('INDEPENDENCE: MULTIPLY THE MARGINS', C.green),
    ...fbox([
      'P(X = 0 and Y = 0)',
      '1/4 × 1/4',
      ['= 1/16', C.green]
    ], C.green)
  );

  const product24 = productFocus(1, 2);

  await until(S(33) + 2.0);
  await play(
    new M.Transform(
      middleFocus,
      product24[0],
      { runTime: 0.55 }
    ),
    new M.Transform(
      middleXFocus,
      product24[1],
      { runTime: 0.55 }
    ),
    new M.Transform(
      middleYFocus,
      product24[2],
      { runTime: 0.55 }
    ),
    ...fbox([
      'P(X = 2 and Y = 4)',
      '1/2 × 1/4',
      ['= 2/16', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 34. Statisticians say law instead of distribution.
  // Joint law and marginal law.
  // ----------------------------------------------------------

  const jointRegion = outline(
    3 * CW + 0.09,
    3 * RH + 0.09,
    jx(1),
    jy(1),
    JC
  );

  const xRegion = outline(
    CW * 1.02,
    3 * RH + 0.09,
    MARGIN_X,
    jy(1),
    XC
  );

  const yRegion = outline(
    3 * CW + 0.08,
    RH * 0.83,
    jx(1),
    MARGIN_Y,
    YC
  );

  await until(S(34));
  await play(
    ...removePicture(
      middleFocus,
      middleXFocus,
      middleYFocus
    ),
    ...addPicture(
      jointRegion,
      xRegion,
      yRegion
    ),
    ...say('LAW IS ANOTHER WORD FOR DISTRIBUTION', JC),
    ...fbox([
      ['joint law: X and Y together', JC],
      ['marginal law of X', XC],
      ['marginal law of Y', YC]
    ], JC)
  );

  // ----------------------------------------------------------
  // 35. The short version, in one line.
  // ----------------------------------------------------------

  await until(S(35));
  await play(
    ...removePicture(
      jointRegion,
      xRegion,
      yRegion
    ),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'joint → marginal',
      ['add over the other variable', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 36. P(X = 2) is the sum of the three joint chances:
  // P(X = 2, Y = 0)
  // + P(X = 2, Y = 2)
  // + P(X = 2, Y = 4).
  // ----------------------------------------------------------

  const notationRow = rowOutline(
    1,
    XC,
    true
  );

  const termOutlines = [
    cellOutline(1, 0, C.amber),
    cellOutline(1, 1, C.amber),
    cellOutline(1, 2, C.amber)
  ];

  await until(S(36));

  register(notationRow);

  await play(
    new M.Create(notationRow, {
      runTime: 0.65
    }),
    ...say('FIND P(X = 2) BY ADDING ITS ROW', XC),
    ...fbox([
      ['P(X = 2)', XC],
      '= P(X = 2, Y = 0)',
      '+ P(X = 2, Y = 2)',
      '+ P(X = 2, Y = 4)'
    ], XC)
  );

  register(termOutlines[0]);

  await play(
    new M.Create(termOutlines[0], {
      runTime: 0.55
    }),
    new M.Indicate(full.table.entries[1][0], {
      color: C.amber,
      runTime: 0.65
    })
  );

  await until(S(36) + 2.8);

  register(termOutlines[1]);

  await play(
    new M.Create(termOutlines[1], {
      runTime: 0.55
    }),
    new M.Indicate(full.table.entries[1][1], {
      color: C.amber,
      runTime: 0.65
    })
  );

  await until(S(36) + 4.8);

  register(termOutlines[2]);

  await play(
    new M.Create(termOutlines[2], {
      runTime: 0.55
    }),
    new M.Indicate(full.table.entries[1][2], {
      color: C.amber,
      runTime: 0.65
    }),
    ...fbox([
      'P(X = 2)',
      '= 2/16 + 4/16 + 2/16',
      ['= 8/16 = 1/2', XC]
    ], XC)
  );

  // ----------------------------------------------------------
  // 37. Add across every value of the other round.
  // Show the general rule after the concrete example.
  // ----------------------------------------------------------

  const notationSweep = rowSweep(1);

  await until(S(37));

  register(notationSweep);

  await play(
    ...removePicture(termOutlines),
    new M.Create(notationSweep, {
      runTime: 0.95
    }),
    new M.Indicate(full.rowMargins[1], {
      color: XC,
      runTime: 1.1
    }),
    ...say('KEEP X · ADD OVER EVERY Y', XC),
    ...fbox([
      ['P(X = x)', XC],
      '= Σ P(X = x, Y = y)',
      'sum over every y'
    ], XC)
  );

  // ----------------------------------------------------------
  // 38. The joint table shows how two random variables
  // go together.
  // ----------------------------------------------------------

  const jointHighlight = outline(
    3 * CW + 0.09,
    3 * RH + 0.09,
    jx(1),
    jy(1),
    JC
  );

  await until(S(38));
  await play(
    ...removePicture(
      notationRow,
      notationSweep
    ),
    ...addPicture(jointHighlight),
    ...say('JOINT: HOW TWO VARIABLES GO TOGETHER', JC),
    ...fbox([
      ['joint law', JC],
      'how X and Y occur together'
    ], JC)
  );

  // ----------------------------------------------------------
  // 39. The margins show each variable on its own.
  // ----------------------------------------------------------

  const marginHighlightX = outline(
    CW * 1.02,
    3 * RH + 0.09,
    MARGIN_X,
    jy(1),
    XC
  );

  const marginHighlightY = outline(
    3 * CW + 0.08,
    RH * 0.83,
    jx(1),
    MARGIN_Y,
    YC
  );

  await until(S(39));
  await play(
    ...removePicture(jointHighlight),
    ...addPicture(
      marginHighlightX,
      marginHighlightY
    ),
    ...say('MARGINS: EACH VARIABLE ALONE'),
    ...fbox([
      ['right margin: X alone', XC],
      ['bottom margin: Y alone', YC]
    ], JC)
  );

  // ----------------------------------------------------------
  // 40. Common trap:
  // Marginals do not uniquely determine the joint law.
  // ----------------------------------------------------------

  await until(S(40));
  await play(
    new M.Indicate(marginHighlightX, {
      color: C.amber,
      runTime: 0.9
    }),
    new M.Indicate(marginHighlightY, {
      color: C.amber,
      runTime: 0.9
    }),
    ...say('TRAP: MARGINS DO NOT DETERMINE THE JOINT', C.amber),
    ...fbox([
      'same margins',
      ['can hide different joint laws', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 41. Repeat rule: round two copies round one.
  //
  // Illustrate the three possible paired payouts:
  // (0, 0), (2, 2), (4, 4).
  //
  // This is a hypothetical new game rule, not the
  // independent two-spin game used above.
  // ----------------------------------------------------------

  const REPEAT_XL = CX - 1.72;
  const REPEAT_XR = CX + 1.72;
  const REPEAT_TOP = P ? 0.48 : 0.43;
  const REPEAT_SP = P ? 1.23 : 0.96;

  function repeatNode(v, x, y, color) {
    const r = rect(
      2.05,
      P ? 0.94 : 0.77,
      x,
      y,
      color,
      0.09
    );

    const reward = coins(
      v,
      x - 0.19,
      y,
      v === 4 ? 0.105 : 0.14
    );

    const label = txt(
      String(v),
      23,
      color,
      x + 0.74,
      y,
      true
    );

    return new M.VGroup(
      r,
      reward,
      label
    );
  }

  const repeatXNodes = VALUES.map((v, k) =>
    repeatNode(
      v,
      REPEAT_XL,
      REPEAT_TOP - k * REPEAT_SP,
      XC
    )
  );

  const repeatYNodes = VALUES.map((v, k) =>
    repeatNode(
      v,
      REPEAT_XR,
      REPEAT_TOP - k * REPEAT_SP,
      YC
    )
  );

  const repeatLinks = VALUES.map((_, k) => {
    const y = REPEAT_TOP - k * REPEAT_SP;

    return arrow(
      [REPEAT_XL + 1.10, y, 0],
      [REPEAT_XR - 1.10, y, 0],
      JC,
      3,
      0.16
    );
  });

  const repeatHeads = [
    txt(
      'ROUND ONE: X',
      17,
      XC,
      REPEAT_XL,
      REPEAT_TOP + 0.75
    ),

    txt(
      'ROUND TWO: Y',
      17,
      YC,
      REPEAT_XR,
      REPEAT_TOP + 0.75
    )
  ];

  const repeatRuleTag = tag(
    'REPEAT RULE: Y = X',
    JC,
    CX,
    P ? -3.25 : -2.45,
    20
  );

  await until(S(41));
  await play(
    ...replacePicture(
      repeatHeads,
      repeatXNodes,
      repeatYNodes,
      repeatLinks,
      repeatRuleTag
    ),
    ...say('NEW GAME: ROUND TWO COPIES ROUND ONE', JC),
    ...fbox([
      ['Y = X', JC],
      '0 → 0',
      '2 → 2',
      '4 → 4'
    ], JC)
  );

  // ----------------------------------------------------------
  // 42. Only the diagonal has positive probability.
  //
  // P(0,0) = 4/16
  // P(2,2) = 8/16
  // P(4,4) = 4/16
  //
  // The six off-diagonal entries are revealed next.
  // ----------------------------------------------------------

  const repeatTable = makeTable(REPEAT);

  const repeatDiagonal = [
    jointCell(0, 0, 4),
    jointCell(1, 1, 8),
    jointCell(2, 2, 4)
  ];

  const repeatEmptyFrames = [];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i !== j) {
        repeatEmptyFrames.push({
          i,
          j,
          frame: jointFrame(i, j)
        });
      }
    }
  }

  const diagonalHighlights = [0, 1, 2].map(k =>
    cellOutline(k, k, C.green)
  );

  await until(S(42));
  await play(
    ...replacePicture(
      repeatTable.rowHeaders,
      repeatTable.colHeaders,
      repeatTable.rowTitle,
      repeatTable.colTitle,
      repeatTable.denominator,
      repeatEmptyFrames.map(o => o.frame)
    ),
    ...say('REPEAT RULE: ONLY THE DIAGONAL', JC),
    ...fbox([
      '(0, 0): 4/16',
      '(2, 2): 8/16',
      ['(4, 4): 4/16', JC]
    ], JC)
  );

  register(
    repeatDiagonal,
    diagonalHighlights
  );

  await play(
    new M.LaggedStart(
      repeatDiagonal.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.32,
        runTime: 1.9
      }
    ),
    ...appear(diagonalHighlights)
  );

  // ----------------------------------------------------------
  // 43. All other cells have probability zero.
  // ----------------------------------------------------------

  const offDiagonalZeros = repeatEmptyFrames.map(({ i, j }) =>
    jointNumber(i, j, 0)
  );

  await until(S(43));
  await play(
    ...addPicture(offDiagonalZeros),
    ...repeatEmptyFrames.map(({ i, j, frame }) =>
      new M.Transform(
        frame,
        jointFrame(i, j, 0),
        { runTime: 0.5 }
      )
    ),
    ...say('EVERY OTHER CELL IS ZERO', C.amber),
    ...fbox([
      'different payouts',
      ['impossible under Y = X', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Compact side-by-side comparison tables.
  //
  // Both have the same row and column marginal probabilities.
  // Their interior joint probabilities are different.
  //
  // Interior values are numerators in sixteenths.
  // ----------------------------------------------------------

  const SMALL_DX = P ? 1.75 : 1.75;
  const SMALL_CW = P ? 0.61 : 0.60;
  const SMALL_RH = P ? 0.78 : 0.65;
  const SMALL_TOP = P ? 0.04 : 0.15;

  function miniTable(cx, matrix, name, color) {
    const parts = [];

    const mx = j =>
      cx + (j - 1.5) * SMALL_CW;

    const my = i =>
      SMALL_TOP - i * SMALL_RH;

    const title = txt(
      name,
      17,
      color,
      cx,
      SMALL_TOP + SMALL_RH + 0.75,
      false,
      3.25
    );

    parts.push(title);

    parts.push(
      txt(
        'X',
        16,
        XC,
        mx(0) - SMALL_CW * 0.91,
        SMALL_TOP + SMALL_RH * 0.78,
        true
      )
    );

    parts.push(
      txt(
        'Y',
        16,
        YC,
        mx(1),
        SMALL_TOP + SMALL_RH + 0.34,
        true
      )
    );

    for (let i = 0; i < 3; i++) {
      parts.push(
        txt(
          String(VALUES[i]),
          17,
          XC,
          mx(0) - SMALL_CW * 0.86,
          my(i),
          true
        )
      );

      parts.push(
        txt(
          String(VALUES[i]),
          17,
          YC,
          mx(i),
          SMALL_TOP + SMALL_RH * 0.78,
          true
        )
      );
    }

    const interior = [];
    const marginsX = [];
    const marginsY = [];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const n = matrix[i][j];

        const frame = rect(
          SMALL_CW - 0.025,
          SMALL_RH - 0.035,
          mx(j),
          my(i),
          n === 0 ? C.muted : JC,
          n === 0 ? 0.025 : 0.11 + n * 0.055,
          1.2
        );

        const number = txt(
          String(n),
          22,
          n === 0 ? C.muted : C.ink,
          mx(j),
          my(i),
          true
        );

        const cell = new M.VGroup(
          frame,
          number
        );

        interior.push(cell);
        parts.push(cell);
      }
    }

    for (let k = 0; k < 3; k++) {
      const xMargin = new M.VGroup(
        rect(
          SMALL_CW * 1.08,
          SMALL_RH - 0.035,
          mx(3) + 0.07,
          my(k),
          XC,
          0.18,
          1.4
        ),
        txt(
          FRACTIONS[k],
          16,
          XC,
          mx(3) + 0.07,
          my(k),
          true,
          SMALL_CW * 0.96
        )
      );

      const yMargin = new M.VGroup(
        rect(
          SMALL_CW - 0.025,
          SMALL_RH * 0.72,
          mx(k),
          my(3) - 0.06,
          YC,
          0.18,
          1.4
        ),
        txt(
          FRACTIONS[k],
          16,
          YC,
          mx(k),
          my(3) - 0.06,
          true,
          SMALL_CW * 0.85
        )
      );

      marginsX.push(xMargin);
      marginsY.push(yMargin);

      parts.push(
        xMargin,
        yMargin
      );
    }

    const total = txt(
      '1',
      19,
      C.green,
      mx(3) + 0.07,
      my(3) - 0.06,
      true
    );

    parts.push(total);

    const xEdge = outline(
      SMALL_CW * 1.18,
      SMALL_RH * 3 + 0.06,
      mx(3) + 0.07,
      my(1),
      XC
    );

    const yEdge = outline(
      SMALL_CW * 3 + 0.06,
      SMALL_RH * 0.83,
      mx(1),
      my(3) - 0.06,
      YC
    );

    const jointEdge = outline(
      SMALL_CW * 3 + 0.06,
      SMALL_RH * 3 + 0.06,
      mx(1),
      my(1),
      C.amber
    );

    return {
      group: new M.VGroup(...parts),
      xEdge,
      yEdge,
      jointEdge
    };
  }

  const miniNormal = miniTable(
    CX - SMALL_DX,
    NORMAL,
    'INDEPENDENT',
    C.green
  );

  const miniRepeat = miniTable(
    CX + SMALL_DX,
    REPEAT,
    'REPEAT RULE',
    JC
  );

  const comparisonDenominator = txt(
    'Interior entries: counts out of 16',
    15,
    C.muted,
    CX,
    P ? -3.20 : -2.52,
    false,
    6.3
  );

  const sameMargins = tag(
    'SAME MARGINS · DIFFERENT JOINT LAWS',
    C.amber,
    CX,
    P ? -4.08 : -2.96,
    16,
    6.4
  );

  // ----------------------------------------------------------
  // 44. Same margins, very different joint tables.
  //
  // Independent:
  // [1,2,1], [2,4,2], [1,2,1].
  //
  // Repeat:
  // [4,0,0], [0,8,0], [0,0,4].
  //
  // Every row sum and column sum is 4,8,4 out of 16.
  // ----------------------------------------------------------

  await until(S(44));
  await play(
    ...replacePicture(
      miniNormal.group,
      miniRepeat.group,
      comparisonDenominator,
      sameMargins
    ),
    ...say('SAME MARGINS. A VERY DIFFERENT GAME.', C.amber),
    ...fbox([
      ['X: 1/4, 1/2, 1/4', XC],
      ['Y: 1/4, 1/2, 1/4', YC],
      'in both games'
    ], C.amber)
  );

  register(
    miniNormal.xEdge,
    miniRepeat.xEdge,
    miniNormal.yEdge,
    miniRepeat.yEdge
  );

  await play(
    new M.Create(miniNormal.xEdge, {
      runTime: 0.75
    }),
    new M.Create(miniRepeat.xEdge, {
      runTime: 0.75
    }),
    new M.Create(miniNormal.yEdge, {
      runTime: 0.75
    }),
    new M.Create(miniRepeat.yEdge, {
      runTime: 0.75
    })
  );

  await until(S(44) + 3.1);

  register(
    miniNormal.jointEdge,
    miniRepeat.jointEdge
  );

  await play(
    new M.Create(miniNormal.jointEdge, {
      runTime: 0.85
    }),
    new M.Create(miniRepeat.jointEdge, {
      runTime: 0.85
    }),
    ...fbox([
      'marginal laws agree',
      ['joint laws differ', C.amber],
      'margins alone are not enough'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 45. Preview: add the two rounds together.
  //
  // Illustrative normal-game example:
  // X = 2, Y = 4, T = 6.
  //
  // Keep the total variable name T consistent
  // with the next lesson.
  // ----------------------------------------------------------

  const totalExampleY = P ? -0.40 : -0.30;

  const exampleX = new M.VGroup(
    rect(
      1.78,
      2.08,
      CX - 2.18,
      totalExampleY,
      XC,
      0.09
    ),

    txt(
      'X = 2',
      23,
      XC,
      CX - 2.18,
      totalExampleY + 0.65,
      true
    ),

    coins(
      2,
      CX - 2.18,
      totalExampleY - 0.08,
      0.18
    ),

    txt(
      'round one',
      15,
      XC,
      CX - 2.18,
      totalExampleY - 0.72
    )
  );

  const exampleY = new M.VGroup(
    rect(
      1.78,
      2.08,
      CX,
      totalExampleY,
      YC,
      0.09
    ),

    txt(
      'Y = 4',
      23,
      YC,
      CX,
      totalExampleY + 0.65,
      true
    ),

    coins(
      4,
      CX,
      totalExampleY - 0.08,
      0.125
    ),

    txt(
      'round two',
      15,
      YC,
      CX,
      totalExampleY - 0.72
    )
  );

  const sixCoins = new M.VGroup(
    coins(
      3,
      CX + 2.18,
      totalExampleY + 0.10,
      0.15
    ),

    coins(
      3,
      CX + 2.18,
      totalExampleY - 0.33,
      0.15
    )
  );

  const exampleTotal = new M.VGroup(
    rect(
      1.78,
      2.08,
      CX + 2.18,
      totalExampleY,
      GOLD,
      0.09
    ),

    txt(
      'T = 6',
      23,
      GOLD,
      CX + 2.18,
      totalExampleY + 0.65,
      true
    ),

    sixCoins,

    txt(
      'total',
      15,
      GOLD,
      CX + 2.18,
      totalExampleY - 0.72
    )
  );

  const plusSign = txt(
    '+',
    25,
    C.ink,
    CX - 1.09,
    totalExampleY,
    true
  );

  const equalsSign = txt(
    '=',
    25,
    C.ink,
    CX + 1.09,
    totalExampleY,
    true
  );

  const totalRule = tag(
    'T = X + Y',
    GOLD,
    CX,
    P ? -2.69 : -2.13,
    22
  );

  await until(S(45));
  await play(
    ...replacePicture(
      exampleX,
      exampleY,
      exampleTotal,
      plusSign,
      equalsSign,
      totalRule
    ),
    ...say('NEXT: ADD THE TWO ROUNDS', GOLD),
    ...fbox([
      ['T = X + Y', GOLD],
      'two-round total',
      'example: 2 + 4 = 6'
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 46. Final definition.
  //
  // The joint table gives the chance of every pair.
  // Row sums give X alone.
  // Column sums give Y alone.
  //
  // End with the original independent game.
  // ----------------------------------------------------------

  full = completeTable(
    NORMAL,
    true,
    true
  );

  const finalJointRegion = outline(
    3 * CW + 0.09,
    3 * RH + 0.09,
    jx(1),
    jy(1),
    JC
  );

  const finalXRegion = outline(
    CW * 1.02,
    3 * RH + 0.09,
    MARGIN_X,
    jy(1),
    XC
  );

  const finalYRegion = outline(
    3 * CW + 0.08,
    RH * 0.83,
    jx(1),
    MARGIN_Y,
    YC
  );

  await until(S(46));

  register();

  await play(
    ...replacePicture(
      fullTableParts(full),
      finalJointRegion
    ),
    ...say('JOINT LAW: THE CHANCE OF EVERY PAIR', JC),
    ...fbox([
      ['joint: X and Y together', JC],
      'every pair has a chance'
    ], JC)
  );

  await until(S(46) + 2.1);

  register(
    finalXRegion,
    finalYRegion
  );

  await play(
    new M.Create(finalXRegion, {
      runTime: 0.75
    }),
    new M.Create(finalYRegion, {
      runTime: 0.75
    }),
    ...say('MARGINAL LAWS: EACH ROUND ALONE', XC),
    ...fbox([
      ['joint: every pair', JC],
      ['row sums: X alone', XC],
      ['column sums: Y alone', YC]
    ], JC)
  );

  await until(S(46) + 4.3);
  await play(
    new M.Indicate(full.total, {
      color: C.green,
      runTime: 0.8
    }),
    ...say('JOINT = TOGETHER · MARGINAL = ALONE', C.green)
  );

  await until(E(46));
}
