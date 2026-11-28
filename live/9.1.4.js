// lesson 9.1.4
// Matrix multiplication: apply one scoring rule to every apartment.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved engine contract; browser runtime verification is pending.
// Try it beats provide visual prompts for the separate interactive exercise.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  //
  // Area: units of 10 square metres.
  // Age: years since the building was built.
  // Rent: monthly asking rent in dollars.
  //
  // Design matrix:
  //     [ 3  14 ]
  // X = [ 6   2 ]
  //     [ 9  14 ]
  //
  // Weight matrix:
  //     [  2 ]
  // w = [ -1 ]
  //
  // Score matrix:
  //      [ -8 ]
  // Xw = [ 10 ]
  //      [  4 ]
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const WA = 2;
  const WG = -1;

  const SCORES = DATA.map(
    d => d.area * WA + d.age * WG
  );

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const RENT = C.amber;
  const WEIGHT = C.violet;
  const RESULT = C.green;
  const GRID = '#293548';

  const signed = n => n < 0
    ? `−${Math.abs(n)}`
    : String(n);

  const dollars = n => '$' + String(n).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22
  // Safe content: -5.5 <= y <= 4.3
  //
  // Laptop: 14.22 x 8
  // Safe content: -3.0 <= y <= 2.3
  //
  // Laptop:
  // Design matrix, weights and scores on the left.
  // Formula box on the right.
  //
  // Phone:
  // Matrix calculation across the middle.
  // Formula box below.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 4.02, 0]
    : [0, 2.03, 0];

  const BOXP = P
    ? [0, -3.68, 0]
    : [3.92, -0.37, 0];

  const BOX_MAX = P
    ? FW - 1.1
    : 5.35;

  const ROW_TOP = P ? 1.20 : 0.66;
  const ROW_GAP = P ? 1.20 : 0.98;

  const rowY = i => ROW_TOP - i * ROW_GAP;

  const MID_Y = rowY(1);

  const HEADER_Y = P ? 2.28 : 1.49;
  const DIM_Y = P ? -2.12 : -2.12;

  const LABEL_X = P ? -3.12 : -6.12;
  const AREA_X = P ? -2.06 : -5.02;
  const AGE_X = P ? -0.80 : -3.78;
  const RENT_X = P ? 0.48 : -2.54;

  const INPUT_LEFT = AREA_X - 0.59;
  const INPUT_RIGHT = AGE_X + 0.59;

  const INPUT_TOP = rowY(0) + 0.43;
  const INPUT_BOTTOM = rowY(2) - 0.43;

  const WEIGHT_X = P ? 0.90 : -1.60;
  const OUTPUT_X = P ? 2.67 : 0.43;

  const TIMES_X = P ? 0.04 : -2.61;
  const EQUALS_X = P ? 1.79 : -0.59;

  const W_AREA_Y = MID_Y + ROW_GAP * 0.50;
  const W_AGE_Y = MID_Y - ROW_GAP * 0.50;

  const W_HALF = P ? 0.45 : 0.46;

  const W_TOP = W_AREA_Y + 0.43;
  const W_BOTTOM = W_AGE_Y - 0.43;

  const OUTPUT_HALF = P ? 0.55 : 0.49;

  const WARN_WEIGHT_X = P ? 2.68 : -0.34;
  const WARN_TIMES_X = P ? 1.74 : -1.33;

  const say = (s, c = C.cyan) => showA(
    s,
    c,
    PILL
  );

  // ------------------------------------------------------------
  // Common visual helpers
  // ------------------------------------------------------------

  function textAt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);
    return t;
  }

  function rectAt(
    p,
    w,
    h,
    color,
    fill = C.card,
    opacity = 0.95,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function outline(
    p,
    w,
    h,
    color = C.amber
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2.4
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function lineBetween(
    start,
    end,
    color,
    strokeWidth = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth
    });
  }

  function tagAt(
    s,
    color,
    p,
    size = 17,
    maxw = null
  ) {
    const g = pill(s, color, size);

    if (maxw !== null && g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
    }

    g.moveTo(p);

    return g;
  }

  function fadeAll(objects) {
    return objects.map(
      o => new M.FadeOut(o)
    );
  }

  function reveal(
    objects,
    duration = 1.1,
    lag = 0.15
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      {
        lagRatio: lag,
        runTime: duration
      }
    );
  }

  function indicateAll(objects, color) {
    return objects.map(
      o => new M.Indicate(o, { color })
    );
  }

  // ------------------------------------------------------------
  // Matrix brackets
  //
  // Construct brackets directly from coordinates.
  // Never wrap already-visible matrix entries in a new group.
  // ------------------------------------------------------------

  function matrixBrackets(
    left,
    right,
    top,
    bottom,
    color = C.muted
  ) {
    const hook = P ? 0.15 : 0.16;

    return new M.VGroup(
      lineBetween(
        [left + hook, top, 0],
        [left, top, 0],
        color,
        2.5
      ),
      lineBetween(
        [left, top, 0],
        [left, bottom, 0],
        color,
        2.5
      ),
      lineBetween(
        [left, bottom, 0],
        [left + hook, bottom, 0],
        color,
        2.5
      ),
      lineBetween(
        [right - hook, top, 0],
        [right, top, 0],
        color,
        2.5
      ),
      lineBetween(
        [right, top, 0],
        [right, bottom, 0],
        color,
        2.5
      ),
      lineBetween(
        [right, bottom, 0],
        [right - hook, bottom, 0],
        color,
        2.5
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // The visual matching and multiplication steps introduce
  // each calculation before it becomes a compact formula.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 21;
    const lh = P ? 0.39 : 0.43;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(s, size, c, true);

      if (t.getWidth() > BOX_MAX - 0.60) {
        t.scale(
          (BOX_MAX - 0.60) / t.getWidth()
        );
      }

      return t;
    });

    const wd = Math.min(
      BOX_MAX,
      Math.max(
        ...texts.map(t => t.getWidth())
      ) + 0.60
    );

    const ht = rows.length * lh + 0.28;

    const r = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.30;

    const top = BOXP[1]
      + ht / 2
      - 0.14
      - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const animations = boxNow
      ? [new M.LaggedStart(
          [new M.FadeOut(boxNow), new M.FadeIn(g)],
          { lagRatio: 1, runTime: 1.0 }
        )]
      : [new M.FadeIn(g)];

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Listing cards
  //
  // Each card begins with all three original measurements.
  // Card parts remain separate so the numbers can move into
  // matrix positions without regrouping live objects.
  // ------------------------------------------------------------

  const CARD_LEFT = LABEL_X - 0.47;
  const CARD_RIGHT = RENT_X + 0.75;

  const CARD_CX = (
    CARD_LEFT + CARD_RIGHT
  ) / 2;

  const CARD_W = CARD_RIGHT - CARD_LEFT;

  const CARD_H = P ? 0.88 : 0.76;

  function makeCard(
    i,
    offsetX = 0,
    offsetY = 0,
    k = 1
  ) {
    const d = DATA[i];
    const y = rowY(i) + offsetY;
    const cx = CARD_CX + offsetX;
    const X = x0 => cx + (x0 - CARD_CX) * k;

    const frame = rectAt(
      [cx, y, 0],
      CARD_W * k,
      CARD_H * k,
      C.muted,
      C.card,
      0.96,
      1.6
    );

    const label = textAt(`APT ${d.id}`, (P ? 17 : 16) * k, C.ink,
      [X(LABEL_X), y, 0], true, 0.82 * k);

    const area = textAt(`Area ${d.area}`, (P ? 18 : 17) * k, AREA,
      [X(AREA_X), y, 0], true, 1.09 * k);

    const age = textAt(`Age ${d.age}`, (P ? 18 : 17) * k, AGE,
      [X(AGE_X), y, 0], true, 1.09 * k);

    const rent = textAt(`Rent ${dollars(d.rent)}`, (P ? 16 : 15) * k, RENT,
      [X(RENT_X), y, 0], true, 1.32 * k);

    return {
      frame,
      label,
      area,
      age,
      rent,
      parts: [frame, label, area, age, rent]
    };
  }

  const introDX = P ? 1.25 : 4.00;
  const introDY = P ? 0.82 : 0.25;

  const cardA = makeCard(0);

  const introB = makeCard(
    1,
    introDX,
    introDY,
    P ? 1.4 : 1.5
  );

  const cardB = makeCard(1);

  const cardC = makeCard(2);

  const cards = [
    cardA,
    cardB,
    cardC
  ];

  const introBScore = tagAt(
    'B: 10 POINTS',
    RESULT,
    [
      CARD_CX + introDX,
      rowY(1) + introDY - (P ? 1.05 : 0.95),
      0
    ],
    22,
    4.5
  );

  const introRule = textAt(
    'More space, fewer years',
    P ? 19 : 22,
    C.muted,
    [
      CARD_CX + introDX,
      rowY(1) + introDY + (P ? 1.05 : 0.95),
      0
    ],
    false,
    P ? 6.25 : 6.0
  );

  // ============================================================
  // 0-3: From one scored listing to three stacked cards
  // ============================================================

  // 0. We found a score for apartment B using its area
  //    and building age.
  await until(S(0));

  await play(
    reveal(introB.parts, 1.25, 0.10),
    new M.FadeIn(introBScore),
    new M.FadeIn(introRule),
    ...say('B SCORES 10 POINTS', RESULT)
  );

  // 1. How can we score every apartment with the same rule?
  await until(S(1));

  await play(
    new M.Indicate(
      introBScore,
      { color: C.amber }
    ),
    ...say('ONE RULE FOR EVERY APARTMENT?', C.amber)
  );

  // 2. Slide the three cards into a stack with A at the top.
  await until(S(2));

  await play(
    new M.FadeOut(introBScore),
    new M.FadeOut(introRule),
    ...introB.parts.map(o => new M.FadeOut(o)),
    reveal(cardA.parts, 1.0, 0.08),
    reveal(cardB.parts, 1.0, 0.08),
    ...say('A GOES AT THE TOP')
  );

  // 3. Put B next and C at the bottom.
  await until(S(3));

  await play(
    reveal(cardC.parts, 1.0, 0.08),
    new M.Indicate(
      cardB.label,
      { color: AREA }
    ),
    ...say('A, THEN B, THEN C')
  );

  // ------------------------------------------------------------
  // Design matrix
  //
  // The original card measurements become matrix entries.
  // Rows remain in apartment order A, B, C.
  // Columns remain in feature order area, age.
  // ------------------------------------------------------------

  const areaHeader = textAt(
    'AREA',
    P ? 19 : 18,
    AREA,
    [AREA_X, HEADER_Y, 0],
    true,
    1.12
  );

  const ageHeader = textAt(
    'AGE',
    P ? 19 : 18,
    AGE,
    [AGE_X, HEADER_Y, 0],
    true,
    1.12
  );

  const apartmentHeader = textAt(
    'APT',
    P ? 16 : 15,
    C.muted,
    [LABEL_X, HEADER_Y, 0],
    true,
    0.78
  );

  const headers = [
    apartmentHeader,
    areaHeader,
    ageHeader
  ];

  function entryAt(
    value,
    x,
    y,
    color
  ) {
    return textAt(
      signed(value),
      P ? 29 : 28,
      color,
      [x, y, 0],
      true,
      1.02
    );
  }

  const inputBracket = matrixBrackets(
    INPUT_LEFT,
    INPUT_RIGHT,
    INPUT_TOP,
    INPUT_BOTTOM,
    C.ink
  );

  let inputDim = tagAt(
    '3 ROWS × 2 COLS',
    AREA,
    [
      (AREA_X + AGE_X) / 2,
      DIM_Y,
      0
    ],
    P ? 15 : 14,
    2.50
  );

  function columnOutline(x, color) {
    return outline(
      [
        x,
        MID_Y,
        0
      ],
      P ? 0.98 : 0.94,
      INPUT_TOP - INPUT_BOTTOM + 0.06,
      color
    );
  }

  const areaColumnOutline = columnOutline(
    AREA_X,
    AREA
  );

  const ageColumnOutline = columnOutline(
    AGE_X,
    AGE
  );

  function rowOutline(
    i,
    color = C.amber,
    right = INPUT_RIGHT
  ) {
    const left = INPUT_LEFT - 0.08;

    return outline(
      [
        (left + right + 0.08) / 2,
        rowY(i),
        0
      ],
      right - left + 0.08,
      P ? 0.84 : 0.73,
      color
    );
  }

  const exampleRow = rowOutline(
    1,
    C.amber
  );

  // ============================================================
  // 4-10: Rows, columns and the design matrix
  // ============================================================

  // 4. Line up the area numbers in one column
  //    and the ages in the next.
  await until(S(4));

  const matrixMoves = [];

  cards.forEach((card, i) => {
    const d = DATA[i];

    matrixMoves.push(
      new M.FadeOut(card.frame),
      new M.FadeOut(card.rent),
      new M.Transform(
        card.label,
        textAt(
          d.id,
          P ? 22 : 21,
          C.ink,
          [
            LABEL_X,
            rowY(i),
            0
          ],
          true
        )
      ),
      new M.Transform(
        card.area,
        entryAt(
          d.area,
          AREA_X,
          rowY(i),
          AREA
        )
      ),
      new M.Transform(
        card.age,
        entryAt(
          d.age,
          AGE_X,
          rowY(i),
          AGE
        )
      )
    );
  });

  await play(
    ...matrixMoves,
    reveal(headers, 1.1, 0.15),
    ...say('LINE UP MATCHING MEASUREMENTS')
  );

  // 5. A column runs down the table.
  await until(S(5));

  await play(
    new M.Create(areaColumnOutline),
    new M.Create(ageColumnOutline),
    ...say('COLUMN = DOWN THE TABLE', AREA)
  );

  // 6. A row runs across it and holds one apartment's numbers.
  await until(S(6));

  await play(
    new M.FadeOut(areaColumnOutline),
    new M.FadeOut(ageColumnOutline),
    new M.Create(exampleRow),
    new M.Indicate(
      cardB.label,
      { color: C.amber }
    ),
    ...say('ROW = ACROSS ONE APARTMENT', C.amber)
  );

  // 7. Each measurement used in the score is called a feature.
  await until(S(7));

  await play(
    new M.FadeOut(exampleRow),
    new M.Indicate(
      areaHeader,
      { color: AREA }
    ),
    new M.Indicate(
      ageHeader,
      { color: AGE }
    ),
    ...say('FEATURES: AREA AND AGE', C.green)
  );

  // 8. A rectangular table of numbers is called a matrix.
  await until(S(8));

  await play(
    new M.Create(inputBracket),
    ...say('MATRIX = RECTANGULAR TABLE', C.violet)
  );

  // 9. This particular table of apartments and their features
  //    is our design matrix.
  await until(S(9));

  await play(
    ...fbox(
      [
        ['DESIGN MATRIX', AREA],
        ['Rows: apartments', C.ink],
        ['Columns: features', C.ink]
      ],
      AREA
    ),
    new M.Indicate(
      inputBracket,
      { color: AREA }
    ),
    ...say('DESIGN MATRIX = OUR MEASUREMENTS')
  );

  // 10. It has three rows and two columns.
  await until(S(10));

  await play(
    new M.FadeIn(inputDim),
    ...fbox(
      [
        ['3 apartment rows', C.ink],
        ['2 feature columns', C.ink],
        ['Shape: 3 × 2', AREA]
      ],
      AREA
    ),
    ...say('3 ROWS × 2 COLUMNS')
  );

  // ------------------------------------------------------------
  // Weight matrix
  //
  // The weight column follows the feature order:
  // top: area weight = 2
  // bottom: age weight = -1
  // ------------------------------------------------------------

  const weightHeader = textAt(
    'WEIGHTS',
    P ? 16 : 15,
    WEIGHT,
    [
      WEIGHT_X,
      HEADER_Y,
      0
    ],
    true,
    P ? 1.40 : 1.50
  );

  const weightBracket = matrixBrackets(
    WEIGHT_X - W_HALF,
    WEIGHT_X + W_HALF,
    W_TOP,
    W_BOTTOM,
    WEIGHT
  );

  const weightArea = entryAt(
    WA,
    WEIGHT_X,
    W_AREA_Y,
    AREA
  );

  const weightAge = entryAt(
    WG,
    WEIGHT_X,
    W_AGE_Y,
    AGE
  );

  let weightDim = tagAt(
    '2 × 1',
    WEIGHT,
    [
      WEIGHT_X,
      DIM_Y,
      0
    ],
    P ? 15 : 14,
    1.24
  );

  const timesSign = textAt(
    '×',
    28,
    C.ink,
    [
      TIMES_X,
      MID_Y,
      0
    ],
    true
  );

  const weightParts = [
    weightHeader,
    weightBracket,
    weightArea,
    weightAge,
    weightDim
  ];

  // ============================================================
  // 11-15: The two-row, one-column weight matrix
  // ============================================================

  // 11. Now place the two weights in a single vertical column.
  await until(S(11));

  await play(
    ...clearBox(),
    new M.FadeIn(weightHeader),
    new M.Create(weightBracket),
    ...say('PUT THE WEIGHTS IN ONE COLUMN', WEIGHT)
  );

  // 12. The area weight of two goes on top.
  await until(S(12));

  await play(
    new M.FadeIn(weightArea),
    new M.Indicate(
      areaHeader,
      { color: AREA }
    ),
    ...say('TOP: AREA WEIGHT = 2', AREA)
  );

  // 13. The age weight of negative one goes beneath it.
  await until(S(13));

  await play(
    new M.FadeIn(weightAge),
    new M.Indicate(
      ageHeader,
      { color: AGE }
    ),
    ...say('BOTTOM: AGE WEIGHT = −1', AGE)
  );

  // 14. That column is itself a matrix with two rows
  //     and one column.
  await until(S(14));

  await play(
    new M.FadeIn(weightDim),
    ...fbox(
      [
        ['WEIGHT MATRIX', WEIGHT],
        ['2 rows', C.ink],
        ['1 column', C.ink],
        ['Shape: 2 × 1', WEIGHT]
      ],
      WEIGHT
    ),
    ...say('WEIGHT MATRIX: 2 × 1', WEIGHT)
  );

  // 15. Its two rows match the two columns of
  //     apartment features.
  await until(S(15));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          areaHeader,
          { color: AREA }
        ),
        new M.Indicate(
          weightArea,
          { color: AREA }
        ),
        new M.Indicate(
          ageHeader,
          { color: AGE }
        ),
        new M.Indicate(
          weightAge,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 2.1
      }
    ),
    ...fbox(
      [
        ['AREA → 2', AREA],
        ['AGE  → −1', AGE],
        ['One weight per feature', C.ink]
      ],
      C.violet
    ),
    ...say('MATCH THE FEATURES TO THE WEIGHTS')
  );

  // ------------------------------------------------------------
  // Moving row spotlight
  //
  // Coordinate-based outlines avoid reparenting matrix entries.
  // One spotlight travels down the input rows.
  // ------------------------------------------------------------

  let spotNow = null;

  function spotlight(i, color = C.amber) {
    const next = rowOutline(i, color);

    if (!spotNow) {
      spotNow = next;

      return [
        new M.Create(spotNow)
      ];
    }

    return [
      new M.Transform(
        spotNow,
        next
      )
    ];
  }

  function clearSpotlight() {
    if (!spotNow) return [];

    const old = spotNow;
    spotNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Matching-pair highlights
  //
  // The input entry and its corresponding weight glow in
  // the same feature color.
  // ------------------------------------------------------------

  let pairNow = null;

  function pairOutline(
    i,
    feature
  ) {
    const isArea = feature === 0;

    const x = isArea
      ? AREA_X
      : AGE_X;

    const wy = isArea
      ? W_AREA_Y
      : W_AGE_Y;

    const color = isArea
      ? AREA
      : AGE;

    const inputCell = outline(
      [
        x,
        rowY(i),
        0
      ],
      P ? 0.76 : 0.73,
      P ? 0.66 : 0.61,
      color
    );

    const weightCell = outline(
      [
        WEIGHT_X,
        wy,
        0
      ],
      P ? 0.70 : 0.71,
      P ? 0.67 : 0.62,
      color
    );

    return new M.VGroup(
      inputCell,
      weightCell
    );
  }

  function matchPair(i, feature) {
    const next = pairOutline(i, feature);

    const animations = [
      new M.FadeIn(next)
    ];

    if (pairNow) {
      animations.push(
        new M.FadeOut(pairNow)
      );
    }

    pairNow = next;

    return animations;
  }

  function clearPair() {
    if (!pairNow) return [];

    const old = pairNow;
    pairNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ============================================================
  // 16-19: Show how a row matches the weight column
  // ============================================================

  // 16. Imagine a spotlight sliding down the apartment table,
  //     one row at a time.
  await until(S(16));

  await play(
    ...clearBox(),
    ...spotlight(0),
    new M.LaggedStart(
      cards.map(card =>
        new M.Indicate(
          card.label,
          { color: C.amber }
        )
      ),
      {
        lagRatio: 0.35,
        runTime: 1.7
      }
    ),
    ...say('ONE APARTMENT ROW AT A TIME', C.amber)
  );

  // 17. At each stop, light up the area in the row
  //     and the area weight at the top.
  await until(S(17));

  await play(
    ...matchPair(0, 0),
    new M.Indicate(
      cardA.area,
      { color: AREA }
    ),
    new M.Indicate(
      weightArea,
      { color: AREA }
    ),
    ...say('MATCH AREA WITH AREA WEIGHT', AREA)
  );

  // 18. Next, light up the age in the row
  //     and the age weight at the bottom.
  await until(S(18));

  await play(
    ...matchPair(0, 1),
    new M.Indicate(
      cardA.age,
      { color: AGE }
    ),
    new M.Indicate(
      weightAge,
      { color: AGE }
    ),
    ...say('MATCH AGE WITH AGE WEIGHT', AGE)
  );

  // 19. Multiply each pair and add the results,
  //     just like our dot product.
  await until(S(19));

  await play(
    ...clearPair(),
    new M.FadeIn(timesSign),
    ...fbox(
      [
        ['DOT PRODUCT', WEIGHT],
        ['Area × 2', AREA],
        ['Age × (−1)', AGE],
        ['Add the two contributions', C.amber]
      ],
      WEIGHT
    ),
    ...say('MULTIPLY MATCHING PAIRS, THEN ADD', WEIGHT)
  );

  // ------------------------------------------------------------
  // Score matrix
  //
  // Each apartment gets one score in its own row.
  // The output column is revealed as scores are calculated.
  // ------------------------------------------------------------

  function makeOutput() {
    const header = textAt(
      'SCORES',
      P ? 16 : 15,
      RESULT,
      [
        OUTPUT_X,
        HEADER_Y,
        0
      ],
      true,
      P ? 1.40 : 1.26
    );

    const bracket = matrixBrackets(
      OUTPUT_X - OUTPUT_HALF,
      OUTPUT_X + OUTPUT_HALF,
      INPUT_TOP,
      INPUT_BOTTOM,
      RESULT
    );

    const equals = textAt(
      '=',
      27,
      C.ink,
      [
        EQUALS_X,
        MID_Y,
        0
      ],
      true
    );

    const values = SCORES.map((v, i) =>
      entryAt(
        v,
        OUTPUT_X,
        rowY(i),
        RESULT
      )
    );

    const dim = tagAt(
      '3 × 1',
      RESULT,
      [
        OUTPUT_X,
        DIM_Y,
        0
      ],
      P ? 15 : 14,
      1.25
    );

    return {
      header,
      bracket,
      equals,
      values,
      dim,
      shell: [
        header,
        bracket,
        equals
      ],
      parts: [
        header,
        bracket,
        equals,
        ...values,
        dim
      ]
    };
  }

  let output = makeOutput();

  function scoreOutline(
    i,
    color = RESULT
  ) {
    return outline(
      [
        OUTPUT_X,
        rowY(i),
        0
      ],
      P ? 0.85 : 0.77,
      P ? 0.72 : 0.64,
      color
    );
  }

  // ============================================================
  // 20-24: First row — apartment A
  // ============================================================

  // 20. Start with A.
  await until(S(20));

  await play(
    ...fbox(
      [
        ['APARTMENT A', C.amber],
        ['Area: 3', AREA],
        ['Age: 14', AGE]
      ],
      C.amber
    ),
    ...say('START WITH A', C.amber)
  );

  // 21. Three area chunks times two gives six points.
  await until(S(21));

  await play(
    ...matchPair(0, 0),
    new M.Indicate(
      cardA.area,
      { color: AREA }
    ),
    new M.Indicate(
      weightArea,
      { color: AREA }
    ),
    ...fbox(
      [
        ['Apartment A', C.ink],
        ['3 × 2 = 6', AREA],
        ['Area contribution: +6', AREA]
      ],
      AREA
    ),
    ...say('A: 3 × 2 = 6', AREA)
  );

  // 22. Fourteen years times negative one
  //     takes away fourteen.
  await until(S(22));

  await play(
    ...matchPair(0, 1),
    new M.Indicate(
      cardA.age,
      { color: AGE }
    ),
    new M.Indicate(
      weightAge,
      { color: AGE }
    ),
    ...fbox(
      [
        ['Apartment A', C.ink],
        ['3 × 2 = 6', AREA],
        ['14 × (−1) = −14', AGE]
      ],
      C.violet
    ),
    ...say('A: 14 × (−1) = −14', AGE)
  );

  // 23. Six minus fourteen gives negative eight.
  await until(S(23));

  await play(
    ...clearPair(),
    ...fbox(
      [
        ['Apartment A', C.ink],
        ['Area points:   6', AREA],
        ['Age points:  −14', AGE],
        ['6 − 14 = −8', RESULT]
      ],
      RESULT
    ),
    ...say('A SCORES −8 POINTS', RESULT)
  );

  // 24. Write that score in the first row of a new column.
  await until(S(24));

  const resultAOutline = scoreOutline(0);

  await play(
    new M.FadeIn(output.header),
    new M.Create(output.bracket),
    new M.FadeIn(output.equals),
    new M.FadeIn(output.values[0]),
    new M.Create(resultAOutline),
    ...say('WRITE −8 IN THE FIRST ROW', RESULT)
  );

  // ============================================================
  // 25-28: Second row — apartment B
  // ============================================================

  // 25. Move the spotlight to B.
  await until(S(25));

  await play(
    new M.FadeOut(resultAOutline),
    ...spotlight(1),
    ...fbox(
      [
        ['APARTMENT B', C.amber],
        ['Area: 6', AREA],
        ['Age: 2', AGE]
      ],
      C.amber
    ),
    ...say('NEXT: APARTMENT B', C.amber)
  );

  // 26. Six times two gives twelve.
  await until(S(26));

  await play(
    ...matchPair(1, 0),
    ...fbox(
      [
        ['Apartment B', C.ink],
        ['6 × 2 = 12', AREA]
      ],
      AREA
    ),
    ...say('B: 6 × 2 = 12', AREA)
  );

  // 27. Two times negative one takes away two.
  await until(S(27));

  await play(
    ...matchPair(1, 1),
    new M.Indicate(
      cardB.age,
      { color: AGE }
    ),
    new M.Indicate(
      weightAge,
      { color: AGE }
    ),
    ...fbox(
      [
        ['Apartment B', C.ink],
        ['6 × 2 = 12', AREA],
        ['2 × (−1) = −2', AGE]
      ],
      C.violet
    ),
    ...say('B: 2 × (−1) = −2', AGE)
  );

  // 28. Twelve minus two gives ten for the second row.
  await until(S(28));

  const resultBOutline = scoreOutline(1);

  await play(
    ...clearPair(),
    new M.FadeIn(output.values[1]),
    new M.Create(resultBOutline),
    ...fbox(
      [
        ['Apartment B', C.ink],
        ['Area points: 12', AREA],
        ['Age points:  −2', AGE],
        ['12 − 2 = 10', RESULT]
      ],
      RESULT
    ),
    ...say('B SCORES 10 POINTS', RESULT)
  );

  // ============================================================
  // 29-32: Third row — apartment C
  // ============================================================

  // 29. Move the spotlight to C.
  await until(S(29));

  await play(
    new M.FadeOut(resultBOutline),
    ...spotlight(2),
    ...fbox(
      [
        ['APARTMENT C', C.amber],
        ['Area: 9', AREA],
        ['Age: 14', AGE]
      ],
      C.amber
    ),
    ...say('NEXT: APARTMENT C', C.amber)
  );

  // 30. Nine times two gives eighteen.
  await until(S(30));

  await play(
    ...matchPair(2, 0),
    ...fbox(
      [
        ['Apartment C', C.ink],
        ['9 × 2 = 18', AREA]
      ],
      AREA
    ),
    ...say('C: 9 × 2 = 18', AREA)
  );

  // 31. Fourteen times negative one takes away fourteen.
  await until(S(31));

  await play(
    ...matchPair(2, 1),
    new M.Indicate(
      cardC.age,
      { color: AGE }
    ),
    new M.Indicate(
      weightAge,
      { color: AGE }
    ),
    ...fbox(
      [
        ['Apartment C', C.ink],
        ['9 × 2 = 18', AREA],
        ['14 × (−1) = −14', AGE]
      ],
      C.violet
    ),
    ...say('C: 14 × (−1) = −14', AGE)
  );

  // 32. Eighteen minus fourteen gives four for the third row.
  await until(S(32));

  const resultCOutline = scoreOutline(2);

  await play(
    ...clearPair(),
    new M.FadeIn(output.values[2]),
    new M.Create(resultCOutline),
    ...fbox(
      [
        ['Apartment C', C.ink],
        ['Area points:  18', AREA],
        ['Age points:  −14', AGE],
        ['18 − 14 = 4', RESULT]
      ],
      RESULT
    ),
    ...say('C SCORES 4 POINTS', RESULT)
  );

  // ============================================================
  // 33-38: Name the operation and explain its shape
  // ============================================================

  // 33. Doing these dot products by matching rows with
  //     columns is called matrix multiplication.
  await until(S(33));

  await play(
    new M.FadeOut(resultCOutline),
    ...clearSpotlight(),
    new M.LaggedStart(
      output.values.map(v =>
        new M.Indicate(
          v,
          { color: RESULT }
        )
      ),
      {
        lagRatio: 0.24,
        runTime: 1.9
      }
    ),
    ...fbox(
      [
        ['MATRIX MULTIPLICATION', RESULT],
        ['A row × weights → −8', C.ink],
        ['B row × weights → 10', C.ink],
        ['C row × weights →  4', C.ink]
      ],
      RESULT
    ),
    ...say('MATRIX MULTIPLICATION', RESULT)
  );

  // ------------------------------------------------------------
  // Choose one output entry.
  //
  // Its row identifies the apartment row.
  // Its column identifies the weight column.
  // ------------------------------------------------------------

  const wholeWeightOutline = outline(
    [
      WEIGHT_X,
      MID_Y,
      0
    ],
    2 * W_HALF + 0.19,
    W_TOP - W_BOTTOM + 0.15,
    WEIGHT
  );

  const chosenOutput = scoreOutline(
    1,
    C.amber
  );

  // 34. For any answer entry, find the input row and
  //     weight column in that entry's position.
  await until(S(34));

  await play(
    ...spotlight(1),
    new M.Create(wholeWeightOutline),
    new M.Create(chosenOutput),
    ...fbox(
      [
        ['Choose answer: row 2, col 1', C.amber],
        ['Input row 2: apartment B', AREA],
        ['Weight column 1', WEIGHT]
      ],
      C.amber
    ),
    ...say('ANSWER POSITION → ROW AND COLUMN', C.amber)
  );

  // 35. The answer entry equals the dot product
  //     of that row and column.
  await until(S(35));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          cardB.area,
          { color: AREA }
        ),
        new M.Indicate(
          weightArea,
          { color: AREA }
        ),
        new M.Indicate(
          cardB.age,
          { color: AGE }
        ),
        new M.Indicate(
          weightAge,
          { color: AGE }
        ),
        new M.Indicate(
          output.values[1],
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.18,
        runTime: 2.0
      }
    ),
    ...fbox(
      [
        ['Answer entry (row 2, col 1)', C.ink],
        ['= (6, 2) · (2, −1)', WEIGHT],
        ['= 6 × 2 + 2 × (−1)', C.amber],
        ['= 10', RESULT]
      ],
      RESULT
    ),
    ...say('ONE ANSWER = ONE DOT PRODUCT', RESULT)
  );

  // 36. Our weight matrix has one column,
  //     so each apartment gets one answer.
  await until(S(36));

  await play(
    ...clearSpotlight(),
    new M.FadeOut(chosenOutput),
    new M.Indicate(
      weightDim,
      { color: WEIGHT }
    ),
    ...fbox(
      [
        ['One weight column', WEIGHT],
        ['One score per apartment', RESULT],
        ['Three apartments → three scores', C.ink]
      ],
      RESULT
    ),
    ...say('ONE WEIGHT COLUMN, ONE SCORE EACH', RESULT)
  );

  // 37. The answer matrix has three rows and one column.
  await until(S(37));

  await play(
    new M.FadeOut(wholeWeightOutline),
    new M.FadeIn(output.dim),
    ...fbox(
      [
        ['Design matrix:  3 × 2', AREA],
        ['Weight matrix:  2 × 1', WEIGHT],
        ['Answer matrix:  3 × 1', RESULT]
      ],
      RESULT
    ),
    ...say('ANSWER MATRIX: 3 × 1', RESULT)
  );

  // 38. Use matrix multiplication to apply the same
  //     scoring rule to a whole table.
  await until(S(38));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          inputBracket,
          { color: AREA }
        ),
        new M.Indicate(
          weightBracket,
          { color: WEIGHT }
        ),
        new M.Indicate(
          output.bracket,
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.9
      }
    ),
    ...fbox(
      [
        ['One table of listings', AREA],
        ['× one scoring rule', WEIGHT],
        ['= all apartment scores', RESULT]
      ],
      RESULT
    ),
    ...say('ONE RULE APPLIED TO THE WHOLE TABLE', RESULT)
  );

  // ------------------------------------------------------------
  // Common trap: retaining the rent column
  //
  // The feature matrix temporarily becomes 3 × 3.
  // The weight matrix remains 2 × 1.
  //
  // No rent weight is invented.
  // No invalid score matrix is displayed.
  // ------------------------------------------------------------

  const rentHeader = textAt(
    'RENT ($)',
    P ? 16 : 15,
    RENT,
    [
      RENT_X,
      HEADER_Y,
      0
    ],
    true,
    1.18
  );

  const rentValues = DATA.map((d, i) =>
    textAt(
      String(d.rent).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ','
      ),
      P ? 21 : 20,
      RENT,
      [
        RENT_X,
        rowY(i),
        0
      ],
      true,
      1.08
    )
  );

  const warnInputRight = RENT_X + 0.66;

  const expandedBracket = matrixBrackets(
    INPUT_LEFT,
    warnInputRight,
    INPUT_TOP,
    INPUT_BOTTOM,
    C.ink
  );

  const expandedDim = tagAt(
    '3 ROWS × 3 COLS',
    C.amber,
    [
      (AREA_X + RENT_X) / 2,
      DIM_Y,
      0
    ],
    P ? 15 : 14,
    3.20
  );

  const movedWeightHeader = textAt(
    'WEIGHTS',
    P ? 16 : 15,
    WEIGHT,
    [
      WARN_WEIGHT_X,
      HEADER_Y,
      0
    ],
    true,
    P ? 1.40 : 1.50
  );

  const movedWeightBracket = matrixBrackets(
    WARN_WEIGHT_X - W_HALF,
    WARN_WEIGHT_X + W_HALF,
    W_TOP,
    W_BOTTOM,
    WEIGHT
  );

  const movedWeightDim = tagAt(
    '2 × 1',
    WEIGHT,
    [
      WARN_WEIGHT_X,
      DIM_Y,
      0
    ],
    P ? 15 : 14,
    1.24
  );

  const movedTimes = textAt(
    '×',
    28,
    C.amber,
    [
      WARN_TIMES_X,
      MID_Y,
      0
    ],
    true
  );

  const rentColumnWarning = outline(
    [
      RENT_X,
      MID_Y,
      0
    ],
    P ? 1.18 : 1.15,
    INPUT_TOP - INPUT_BOTTOM + 0.05,
    C.amber
  );

  const mismatchTag = tagAt(
    '3 FEATURES ≠ 2 WEIGHTS',
    C.amber,
    [
      P ? 0 : -2.95,
      P ? -2.70 : -2.67,
      0
    ],
    P ? 16 : 15,
    P ? 6.30 : 6.20
  );

  // ============================================================
  // 39-41: The number of features must match the weights
  // ============================================================

  // 39. A common trap is leaving the rent column
  //     in the design matrix.
  await until(S(39));

  await play(
    ...fadeAll(output.parts),
    new M.Transform(
      inputBracket,
      expandedBracket
    ),
    new M.FadeOut(inputDim),
    new M.FadeIn(expandedDim),
    new M.Transform(
      weightHeader,
      movedWeightHeader
    ),
    new M.Transform(
      weightBracket,
      movedWeightBracket
    ),
    new M.Transform(
      weightArea,
      entryAt(
        WA,
        WARN_WEIGHT_X,
        W_AREA_Y,
        AREA
      )
    ),
    new M.Transform(
      weightAge,
      entryAt(
        WG,
        WARN_WEIGHT_X,
        W_AGE_Y,
        AGE
      )
    ),
    new M.FadeOut(weightDim),
    new M.FadeIn(movedWeightDim),
    new M.Transform(
      timesSign,
      movedTimes
    ),
    new M.FadeIn(rentHeader),
    reveal(rentValues, 1.0, 0.15),
    ...fbox(
      [
        ['WATCH OUT', C.amber],
        ['Rent was added to the table', RENT],
        ['But the weights did not change', WEIGHT]
      ],
      C.amber
    ),
    ...say('WATCH OUT: EXTRA RENT COLUMN', C.amber)
  );

  // 40. Now the apartment row would have three entries
  //     to match to just two weights.
  await until(S(40));

  const warningRow = rowOutline(
    1,
    C.amber,
    warnInputRight
  );

  await play(
    new M.Create(warningRow),
    new M.Create(rentColumnWarning),
    new M.FadeIn(mismatchTag),
    ...fbox(
      [
        ['B has 3 feature entries', C.amber],
        ['Area: 6', AREA],
        ['Age: 2', AGE],
        ['Rent: 1100, no weight', RENT],
        ['Cannot multiply: 3 ≠ 2', C.amber]
      ],
      C.amber
    ),
    ...say('3 FEATURES, ONLY 2 WEIGHTS', C.amber)
  );

  // 41. Each feature in a row needs its own matching
  //     weight in the column.
  await until(S(41));

  output = makeOutput();

  await play(
    new M.FadeOut(warningRow),
    new M.FadeOut(rentColumnWarning),
    new M.FadeOut(mismatchTag),
    new M.FadeOut(rentHeader),
    ...fadeAll(rentValues),
    new M.Transform(
      inputBracket,
      matrixBrackets(
        INPUT_LEFT,
        INPUT_RIGHT,
        INPUT_TOP,
        INPUT_BOTTOM,
        C.ink
      )
    ),
    new M.FadeOut(expandedDim),
    new M.FadeIn(inputDim = tagAt(
        '3 ROWS × 2 COLS',
        AREA,
        [
          (AREA_X + AGE_X) / 2,
          DIM_Y,
          0
        ],
        P ? 15 : 14,
        2.50
      )
    ),
    new M.Transform(
      weightHeader,
      textAt(
        'WEIGHTS',
        P ? 16 : 15,
        WEIGHT,
        [
          WEIGHT_X,
          HEADER_Y,
          0
        ],
        true,
        P ? 1.40 : 1.50
      )
    ),
    new M.Transform(
      weightBracket,
      matrixBrackets(
        WEIGHT_X - W_HALF,
        WEIGHT_X + W_HALF,
        W_TOP,
        W_BOTTOM,
        WEIGHT
      )
    ),
    new M.Transform(
      weightArea,
      entryAt(
        WA,
        WEIGHT_X,
        W_AREA_Y,
        AREA
      )
    ),
    new M.Transform(
      weightAge,
      entryAt(
        WG,
        WEIGHT_X,
        W_AGE_Y,
        AGE
      )
    ),
    new M.FadeOut(movedWeightDim),
    new M.FadeIn(weightDim = tagAt(
        '2 × 1',
        WEIGHT,
        [
          WEIGHT_X,
          DIM_Y,
          0
        ],
        P ? 15 : 14,
        1.24
      )
    ),
    new M.Transform(
      timesSign,
      textAt(
        '×',
        28,
        C.ink,
        [
          TIMES_X,
          MID_Y,
          0
        ],
        true
      )
    ),
    reveal(output.parts, 1.35, 0.08),
    ...fbox(
      [
        ['Use only the scored features', C.ink],
        ['2 feature columns', AREA],
        ['2 weight rows', WEIGHT],
        ['2 matches 2', RESULT]
      ],
      RESULT
    ),
    ...say('ONE MATCHING WEIGHT PER FEATURE', RESULT)
  );

  // ------------------------------------------------------------
  // Dimension compatibility picture
  //
  // (3 × 2) × (2 × 1) → (3 × 1)
  //
  // The inside dimensions must match.
  // The outside dimensions describe the output shape.
  // This notation describes matrix sizes, not scalar
  // multiplication of the dimension numbers.
  // ------------------------------------------------------------

  // ============================================================
  // 42-44: Visual prompts for Try it
  // ============================================================

  // 42. In Try it, place the two weights
  //     and check the first score.
  await until(S(42));

  await play(
    ...spotlight(0),
    new M.LaggedStart(
      [
        new M.Indicate(
          weightArea,
          { color: AREA }
        ),
        new M.Indicate(
          weightAge,
          { color: AGE }
        ),
        new M.Indicate(
          output.values[0],
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.6
      }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Area weight: 2', AREA],
        ['Age weight: −1', AGE],
        ['Check the first score', C.ink]
      ],
      RESULT
    ),
    ...say('TRY IT: PLACE BOTH WEIGHTS', RESULT)
  );

  // 43. Then predict which two scores move by the same
  //     amount when you change the age weight.
  await until(S(43));

  await play(
    ...clearSpotlight(),
    new M.LaggedStart(
      [
        new M.Indicate(
          ageHeader,
          { color: AGE }
        ),
        new M.Indicate(
          cardA.age,
          { color: AGE }
        ),
        new M.Indicate(
          cardB.age,
          { color: AGE }
        ),
        new M.Indicate(
          cardC.age,
          { color: AGE }
        ),
        new M.Indicate(
          weightAge,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.22,
        runTime: 2.0
      }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Change the age weight', AGE],
        ['Which ages are equal?', AGE],
        ['Which scores change equally?', C.amber]
      ],
      C.amber
    ),
    ...say('TRY IT: CHANGE THE AGE WEIGHT', AGE)
  );

  // 44. Tap New data to score a fresh set of apartments.
  await until(S(44));

  await play(
    new M.Indicate(
      inputBracket,
      { color: AREA }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Tap New data', C.ink],
        ['Fresh apartment measurements', AREA],
        ['Apply the same scoring rule', WEIGHT]
      ],
      RESULT
    ),
    ...say('NEW DATA: SCORE OTHER LISTINGS', RESULT)
  );

  // ============================================================
  // 45: Final takeaway
  // ============================================================

  // 45. Matrix multiplication applies one rule to every
  //     apartment by matching each row with the weight column.
  await until(S(45));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          cardA.label,
          { color: C.amber }
        ),
        new M.Indicate(
          output.values[0],
          { color: RESULT }
        ),
        new M.Indicate(
          cardB.label,
          { color: C.amber }
        ),
        new M.Indicate(
          output.values[1],
          { color: RESULT }
        ),
        new M.Indicate(
          cardC.label,
          { color: C.amber }
        ),
        new M.Indicate(
          output.values[2],
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.24,
        runTime: 2.7
      }
    ),
    ...fbox(
      [
        ['MATRIX MULTIPLICATION', RESULT],
        ['Design matrix × weight matrix', C.ink],
        ['= score matrix', RESULT],
        ['Shapes: (3 × 2) × (2 × 1)', C.violet],
        ['Result shape: 3 × 1', RESULT]
      ],
      RESULT
    ),
    ...say('MATCH EACH ROW WITH THE COLUMN', RESULT)
  );
}
