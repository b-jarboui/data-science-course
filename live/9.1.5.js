// lesson 9.1.5
// Transpose: turn feature columns into rows and calculate feature totals.
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
  // Original design matrix:
  //
  //       Area  Age
  //   A     3    14
  //   B     6     2
  //   C     9    14
  //
  // Transpose:
  //
  //          A    B    C
  //   Area   3    6    9
  //   Age   14    2   14
  //
  // Multiply the transpose by the column of ones:
  //
  //   [  3   6   9 ]   [ 1 ]   [ 18 ]
  //   [ 14   2  14 ] × [ 1 ] = [ 30 ]
  //                    [ 1 ]
  //
  // Area total = 18 chunks = 180 square metres.
  // Age total  = 30 years.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const AREA_VALUES = DATA.map(d => d.area);
  const AGE_VALUES = DATA.map(d => d.age);

  const AREA_TOTAL = AREA_VALUES.reduce(
    (sum, n) => sum + n,
    0
  );

  const AGE_TOTAL = AGE_VALUES.reduce(
    (sum, n) => sum + n,
    0
  );

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const WEIGHT = C.violet;
  const RESULT = C.green;
  const GRID = '#293548';

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22
  // Safe content: -5.5 <= y <= 4.3
  //
  // Laptop: 14.22 x 8
  // Safe content: -3.0 <= y <= 2.3
  //
  // During the transpose:
  // Laptop: original table left, destination table right.
  // Phone: original table above, destination table below.
  //
  // During multiplication:
  // Laptop: calculation left, formula box right.
  // Phone: calculation above, formula box below.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 4.02, 0]
    : [0, 2.02, 0];

  const BOXP = P
    ? [0, -3.18, 0]
    : [3.98, -0.37, 0];

  const BOX_MAX = P
    ? FW - 1.1
    : 5.25;

  const SOURCE_X = P ? 0.25 : -3.55;
  const SOURCE_Y = P ? 2.05 : -0.10;

  const TARGET_X = P ? 0.42 : 3.20;
  const TARGET_Y = P ? -1.35 : -0.10;

  const WORK_X = P ? -1.40 : -4.38;
  const WORK_Y = P ? 1.18 : -0.05;

  const WEIGHT_X = P ? 1.05 : -1.62;
  const OUTPUT_X = P ? 2.87 : 0.43;

  const TIMES_X = P ? 0.29 : -2.42;
  const EQUALS_X = P ? 1.97 : -0.58;

  const DIM_Y = WORK_Y - 1.62;

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
    duration = 1.2,
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

  function numberAt(
    n,
    p,
    color,
    size = 29
  ) {
    return textAt(
      String(n),
      size,
      color,
      p,
      true,
      0.88
    );
  }

  // ------------------------------------------------------------
  // Matrix brackets
  //
  // Draw directly from coordinates.
  // Never wrap already-visible entries in a new VGroup.
  // ------------------------------------------------------------

  function matrixBrackets(
    left,
    right,
    top,
    bottom,
    color = C.ink
  ) {
    const hook = 0.15;

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
  // Rows are strings or [text, color] pairs.
  // Formula boxes appear after the visual steps.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21;
    const lh = P ? 0.40 : 0.43;

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

    const animations = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

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
  // Opening picture
  //
  // Show the apartment measurements as physical quantities
  // before introducing the matrix.
  //
  // Cyan tiles: floor-area chunks.
  // Pink bars: years of building age.
  // ------------------------------------------------------------

  const INTRO_X = P
    ? [-2.30, 0, 2.30]
    : [-3.55, 0, 3.55];

  const INTRO_Y = P ? 1.25 : -0.20;

  const INTRO_W = P ? 2.08 : 3.00;
  const INTRO_H = P ? 2.90 : 2.70;

  const introFrames = [];
  const introHeaders = [];
  const introAreaGroups = [];
  const introAgeGroups = [];

  DATA.forEach((d, i) => {
    const x = INTRO_X[i];

    const frame = rectAt(
      [x, INTRO_Y, 0],
      INTRO_W,
      INTRO_H,
      C.muted,
      C.card,
      0.96,
      1.7
    );

    introFrames.push(frame);

    introHeaders.push(
      textAt(
        `APT ${d.id}`,
        P ? 21 : 23,
        C.ink,
        [
          x,
          INTRO_Y + 1.02,
          0
        ],
        true,
        INTRO_W - 0.25
      )
    );

    const tilePitch = P ? 0.18 : 0.24;
    const tileSize = tilePitch * 0.82;

    const tiles = [];

    for (let k = 0; k < d.area; k++) {
      const r = new M.Rectangle({
        width: tileSize,
        height: tileSize * 1.7,
        color: AREA,
        strokeWidth: 1
      });

      r.setFill(AREA, 0.76);

      r.moveTo([
        x + (k - (d.area - 1) / 2) * tilePitch,
        INTRO_Y + 0.35,
        0
      ]);

      tiles.push(r);
    }

    const areaLabel = textAt(
      `${d.area} chunks`,
      P ? 18 : 19,
      AREA,
      [
        x,
        INTRO_Y - 0.02,
        0
      ],
      true,
      INTRO_W - 0.24
    );

    introAreaGroups.push(
      new M.VGroup(
        ...tiles,
        areaLabel
      )
    );

    const ageMaxWidth = INTRO_W - 0.40;
    const ageWidth = ageMaxWidth * d.age / 14;

    const ageBack = new M.Rectangle({
      width: ageMaxWidth,
      height: 0.20,
      color: GRID,
      strokeWidth: 1
    });

    ageBack.setFill(GRID, 0.85);

    ageBack.moveTo([
      x,
      INTRO_Y - 0.52,
      0
    ]);

    const ageBar = new M.Rectangle({
      width: ageWidth,
      height: 0.20,
      color: AGE,
      strokeWidth: 1
    });

    ageBar.setFill(AGE, 0.78);

    ageBar.moveTo([
      x - ageMaxWidth / 2 + ageWidth / 2,
      INTRO_Y - 0.52,
      0
    ]);

    const ageLabel = textAt(
      `${d.age} years`,
      P ? 18 : 19,
      AGE,
      [
        x,
        INTRO_Y - 0.91,
        0
      ],
      true,
      INTRO_W - 0.24
    );

    introAgeGroups.push(
      new M.VGroup(
        ageBack,
        ageBar,
        ageLabel
      )
    );
  });

  const introUnit = textAt(
    '1 area chunk = 10 m²',
    P ? 17 : 18,
    C.muted,
    [
      0,
      INTRO_Y - INTRO_H / 2 - 0.37,
      0
    ],
    false
  );

  const introParts = [
    ...introFrames,
    ...introHeaders,
    ...introAreaGroups,
    ...introAgeGroups,
    introUnit
  ];

  // ============================================================
  // 0-1: Ask for the totals of two features
  // ============================================================

  // 0. Suppose your roommate asks how much floor area
  //    the three listings have altogether.
  await until(S(0));

  await play(
    reveal(
      [
        ...introFrames,
        ...introHeaders
      ],
      1.0,
      0.08
    ),
    reveal(
      introAreaGroups,
      1.5,
      0.20
    ),
    new M.FadeIn(introUnit),
    ...say('HOW MUCH FLOOR AREA ALTOGETHER?', AREA)
  );

  // 1. Can the same table also give you their total
  //    building age?
  await until(S(1));

  await play(
    reveal(
      introAgeGroups,
      1.4,
      0.20
    ),
    ...say('WHAT IS THE TOTAL BUILDING AGE?', AGE)
  );

  // ------------------------------------------------------------
  // Original design matrix
  //
  // Apartment rows: A, B, C.
  // Feature columns: area, age.
  //
  // Keep all numeric entries independent so that they can
  // travel into their transposed positions.
  // ------------------------------------------------------------

  const SOURCE_PITCH = P ? 1.40 : 1.45;
  const SOURCE_ROW_GAP = P ? 0.65 : 0.77;

  const SOURCE_AREA_X = SOURCE_X - SOURCE_PITCH / 2;
  const SOURCE_AGE_X = SOURCE_X + SOURCE_PITCH / 2;

  const SOURCE_LABEL_X = SOURCE_X - 1.77;

  const sourceRowY = i =>
    SOURCE_Y + (1 - i) * SOURCE_ROW_GAP;

  const SOURCE_HEADER_Y = SOURCE_Y
    + SOURCE_ROW_GAP
    + 0.67;

  const SOURCE_TOP = sourceRowY(0) + 0.36;
  const SOURCE_BOTTOM = sourceRowY(2) - 0.36;

  const SOURCE_LEFT = SOURCE_AREA_X - 0.54;
  const SOURCE_RIGHT = SOURCE_AGE_X + 0.54;

  const sourceBracket = matrixBrackets(
    SOURCE_LEFT,
    SOURCE_RIGHT,
    SOURCE_TOP,
    SOURCE_BOTTOM
  );

  const sourceHeaders = [
    textAt(
      'APT',
      17,
      C.muted,
      [
        SOURCE_LABEL_X,
        SOURCE_HEADER_Y,
        0
      ],
      true
    ),

    textAt(
      'AREA',
      19,
      AREA,
      [
        SOURCE_AREA_X,
        SOURCE_HEADER_Y,
        0
      ],
      true,
      1.15
    ),

    textAt(
      'AGE',
      19,
      AGE,
      [
        SOURCE_AGE_X,
        SOURCE_HEADER_Y,
        0
      ],
      true,
      1.15
    )
  ];

  const sourceLabels = DATA.map((d, i) =>
    textAt(
      d.id,
      23,
      C.ink,
      [
        SOURCE_LABEL_X,
        sourceRowY(i),
        0
      ],
      true
    )
  );

  const areaEntries = AREA_VALUES.map((v, i) =>
    numberAt(
      v,
      [
        SOURCE_AREA_X,
        sourceRowY(i),
        0
      ],
      AREA
    )
  );

  const ageEntries = AGE_VALUES.map((v, i) =>
    numberAt(
      v,
      [
        SOURCE_AGE_X,
        sourceRowY(i),
        0
      ],
      AGE
    )
  );

  const sourceDim = tagAt(
    '3 ROWS × 2 COLS',
    C.muted,
    [
      SOURCE_X,
      SOURCE_BOTTOM - 0.39,
      0
    ],
    15,
    3.10
  );

  const sourceShell = [
    sourceBracket,
    ...sourceHeaders,
    ...sourceLabels,
    sourceDim
  ];

  // ============================================================
  // 2-4: Bring back the original apartment table
  // ============================================================

  // 2. Bring back the rows for A, B, and C.
  await until(S(2));

  await play(
    ...fadeAll(introParts),
    new M.Create(sourceBracket),
    reveal(
      [
        ...sourceHeaders,
        ...sourceLabels,
        sourceDim
      ],
      1.25,
      0.10
    ),
    ...say('ONE ROW PER APARTMENT')
  );

  // 3. Their area column reads three, six, and nine.
  await until(S(3));

  await play(
    reveal(
      areaEntries,
      1.35,
      0.25
    ),
    new M.Indicate(
      sourceHeaders[1],
      { color: AREA }
    ),
    ...say('AREA COLUMN: 3, 6, 9', AREA)
  );

  // 4. Their age column reads fourteen, two, and fourteen.
  await until(S(4));

  await play(
    reveal(
      ageEntries,
      1.35,
      0.25
    ),
    new M.Indicate(
      sourceHeaders[2],
      { color: AGE }
    ),
    ...say('AGE COLUMN: 14, 2, 14', AGE)
  );

  // ------------------------------------------------------------
  // Transposed table geometry
  //
  // Feature rows: area, age.
  // Apartment columns: A, B, C.
  //
  // Each original entry keeps its apartment identity.
  // ------------------------------------------------------------

  function transposeLayout(
    cx,
    cy,
    pitch,
    rowGap
  ) {
    const colX = i =>
      cx + (i - 1) * pitch;

    const rowY = i =>
      cy + (0.5 - i) * rowGap;

    const cell = (r, c) => [
      colX(c),
      rowY(r),
      0
    ];

    const left = colX(0) - 0.46;
    const right = colX(2) + 0.46;

    const top = rowY(0) + 0.36;
    const bottom = rowY(1) - 0.36;

    return {
      cx,
      cy,
      colX,
      rowY,
      cell,
      left,
      right,
      top,
      bottom,
      headerY: top + 0.37,
      labelX: left - 0.50,
      rowGap,
      pitch
    };
  }

  const TARGET = transposeLayout(
    TARGET_X,
    TARGET_Y,
    P ? 1.08 : 1.12,
    P ? 0.82 : 0.84
  );

  const WORK = transposeLayout(
    WORK_X,
    WORK_Y,
    P ? 0.86 : 0.92,
    P ? 0.92 : 0.92
  );

  const targetBracket = matrixBrackets(
    TARGET.left,
    TARGET.right,
    TARGET.top,
    TARGET.bottom
  );

  const targetHeaders = DATA.map((d, i) =>
    textAt(
      d.id,
      22,
      C.ink,
      [
        TARGET.colX(i),
        TARGET.headerY,
        0
      ],
      true
    )
  );

  const targetRowLabels = [
    textAt(
      'AREA',
      18,
      AREA,
      [
        TARGET.labelX,
        TARGET.rowY(0),
        0
      ],
      true,
      0.9
    ),

    textAt(
      'AGE',
      18,
      AGE,
      [
        TARGET.labelX,
        TARGET.rowY(1),
        0
      ],
      true,
      0.9
    )
  ];

  const targetCaption = tagAt(
    'NEW TABLE',
    C.violet,
    [
      TARGET.cx,
      TARGET.bottom - 0.40,
      0
    ],
    15,
    2.70
  );

  const liftOffset = 0.12;

  const sourceAreaStrip = outline(
    [
      SOURCE_AREA_X,
      SOURCE_Y + liftOffset,
      0
    ],
    0.96,
    SOURCE_TOP - SOURCE_BOTTOM + 0.06,
    AREA
  );

  function transposeEntry(
    entry,
    value,
    row,
    col,
    color,
    layout = TARGET,
    pathArc = 0.25
  ) {
    return new M.Transform(
      entry,
      numberAt(
        value,
        layout.cell(row, col),
        color
      ),
      { pathArc }
    );
  }

  function columnHighlight(
    layout,
    col,
    color = C.amber
  ) {
    return outline(
      [
        layout.colX(col),
        layout.cy,
        0
      ],
      layout.pitch - 0.12,
      layout.top - layout.bottom + 0.06,
      color
    );
  }

  function rowHighlight(
    layout,
    row,
    color = C.amber
  ) {
    return outline(
      [
        layout.cx,
        layout.rowY(row),
        0
      ],
      layout.right - layout.left + 0.12,
      layout.rowGap - 0.14,
      color
    );
  }

  // ============================================================
  // 5-8: Turn each column into a row
  // ============================================================

  // 5. Picture lifting the area column off the page
  //    like a strip of paper.
  await until(S(5));

  await play(
    new M.Create(sourceAreaStrip),
    ...areaEntries.map((entry, i) =>
      new M.Transform(
        entry,
        numberAt(
          AREA_VALUES[i],
          [
            SOURCE_AREA_X,
            sourceRowY(i) + liftOffset,
            0
          ],
          AREA
        )
      )
    ),
    ...say('LIFT THE AREA COLUMN', AREA)
  );

  // 6. Lay that strip across a fresh table so A comes first.
  await until(S(6));

  await play(
    new M.FadeOut(sourceAreaStrip),
    new M.Create(targetBracket),
    new M.FadeIn(targetCaption),
    new M.FadeIn(targetRowLabels[0]),
    new M.FadeIn(targetHeaders[0]),
    transposeEntry(
      areaEntries[0],
      AREA_VALUES[0],
      0,
      0,
      AREA
    ),
    new M.Indicate(
      sourceLabels[0],
      { color: AREA }
    ),
    ...say('AREA STRIP: A GOES FIRST', AREA)
  );

  // 7. B goes next and C goes last.
  await until(S(7));

  await play(
    new M.LaggedStart(
      [
        new M.LaggedStart(
          [
            new M.FadeIn(targetHeaders[1]),
            transposeEntry(
              areaEntries[1],
              AREA_VALUES[1],
              0,
              1,
              AREA
            )
          ],
          {
            lagRatio: 0.05
          }
        ),

        new M.LaggedStart(
          [
            new M.FadeIn(targetHeaders[2]),
            transposeEntry(
              areaEntries[2],
              AREA_VALUES[2],
              0,
              2,
              AREA
            )
          ],
          {
            lagRatio: 0.05
          }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.55
      }
    ),
    ...say('KEEP THE ORDER: A, B, C', AREA)
  );

  // 8. Now lay the age strip underneath it in the same order.
  await until(S(8));

  await play(
    ...fadeAll(sourceShell),
    new M.FadeIn(targetRowLabels[1]),
    new M.LaggedStart(
      ageEntries.map((entry, i) =>
        transposeEntry(
          entry,
          AGE_VALUES[i],
          1,
          i,
          AGE,
          TARGET,
          -0.30
        )
      ),
      {
        lagRatio: 0.23,
        runTime: 1.8
      }
    ),
    ...say('AGE STRIP: SAME A, B, C ORDER', AGE)
  );

  // ------------------------------------------------------------
  // Apartment columns in the transposed table
  // ------------------------------------------------------------

  const targetAOutline = columnHighlight(
    TARGET,
    0,
    C.amber
  );

  const targetBOutline = columnHighlight(
    TARGET,
    1,
    C.amber
  );

  const targetCOutline = columnHighlight(
    TARGET,
    2,
    C.amber
  );

  // ============================================================
  // 9-11: Each apartment now has its own column
  // ============================================================

  // 9. In the fresh table, A has three in the top row
  //    and fourteen directly below.
  await until(S(9));

  await play(
    new M.Create(targetAOutline),
    new M.LaggedStart(
      [
        new M.Indicate(
          areaEntries[0],
          { color: AREA }
        ),
        new M.Indicate(
          ageEntries[0],
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 1.5
      }
    ),
    ...say('A: 3 ON TOP, 14 BELOW')
  );

  // 10. Those two numbers now make a column for A.
  await until(S(10));

  await play(
    new M.Indicate(
      targetHeaders[0],
      { color: C.amber }
    ),
    new M.Indicate(
      targetAOutline,
      { color: C.amber }
    ),
    ...say('A NOW HAS ITS OWN COLUMN', C.amber)
  );

  // 11. B and C each have their own columns too.
  await until(S(11));

  await play(
    new M.Create(targetBOutline),
    new M.Create(targetCOutline),
    new M.Indicate(
      targetHeaders[1],
      { color: C.amber }
    ),
    new M.Indicate(
      targetHeaders[2],
      { color: C.amber }
    ),
    ...say('ONE COLUMN PER APARTMENT', C.amber)
  );

  // ------------------------------------------------------------
  // Move the transposed table into its calculation layout.
  //
  // Every visible object moves independently.
  // No live entry is reparented or wrapped in a new group.
  // ------------------------------------------------------------

  function moveTransposeToWork() {
    const animations = [
      new M.Transform(
        targetBracket,
        matrixBrackets(
          WORK.left,
          WORK.right,
          WORK.top,
          WORK.bottom
        )
      )
    ];

    targetHeaders.forEach((header, i) => {
      animations.push(
        new M.Transform(
          header,
          textAt(
            DATA[i].id,
            21,
            C.ink,
            [
              WORK.colX(i),
              WORK.headerY,
              0
            ],
            true
          )
        )
      );
    });

    targetRowLabels.forEach((label, i) => {
      const color = i === 0 ? AREA : AGE;

      animations.push(
        new M.Transform(
          label,
          textAt(
            i === 0 ? 'AREA' : 'AGE',
            18,
            color,
            [
              WORK.labelX,
              WORK.rowY(i),
              0
            ],
            true,
            0.9
          )
        )
      );
    });

    areaEntries.forEach((entry, i) => {
      animations.push(
        transposeEntry(
          entry,
          AREA_VALUES[i],
          0,
          i,
          AREA,
          WORK,
          0
        )
      );
    });

    ageEntries.forEach((entry, i) => {
      animations.push(
        transposeEntry(
          entry,
          AGE_VALUES[i],
          1,
          i,
          AGE,
          WORK,
          0
        )
      );
    });

    return animations;
  }

  const transposeDim = tagAt(
    '2 × 3',
    C.violet,
    [
      WORK.cx,
      DIM_Y,
      0
    ],
    18,
    2.50
  );

  // ============================================================
  // 12-15: Name the transpose and explain the changed shape
  // ============================================================

  // 12. The matrix is our rectangular table of numbers.
  await until(S(12));

  await play(
    ...fadeAll([
      targetAOutline,
      targetBOutline,
      targetCOutline,
      targetCaption
    ]),
    ...moveTransposeToWork(),
    ...say('MATRIX = RECTANGULAR TABLE', C.violet)
  );

  // 13. Turning every column into a row in its original
  //     order is called taking the transpose.
  await until(S(13));

  await play(
    new M.LaggedStart(
      [
        ...areaEntries.map(
          entry => new M.Indicate(
            entry,
            { color: AREA }
          )
        ),
        ...ageEntries.map(
          entry => new M.Indicate(
            entry,
            { color: AGE }
          )
        )
      ],
      {
        lagRatio: 0.16,
        runTime: 2.0
      }
    ),
    ...fbox(
      [
        ['TRANSPOSE', C.violet],
        ['Old columns become new rows', C.ink],
        ['Keep their original order', C.amber]
      ],
      C.violet
    ),
    ...say('TRANSPOSE = COLUMNS BECOME ROWS', C.violet)
  );

  // 14. The old table had three apartment rows
  //     and two feature columns.
  await until(S(14));

  await play(
    ...fbox(
      [
        ['ORIGINAL MATRIX', C.muted],
        ['3 apartment rows', C.ink],
        ['2 feature columns', C.ink],
        ['Original shape: 3 × 2', AREA]
      ],
      AREA
    ),
    ...say('BEFORE: 3 ROWS × 2 COLUMNS', AREA)
  );

  // 15. The transpose has two feature rows
  //     and three apartment columns.
  await until(S(15));

  await play(
    new M.FadeIn(transposeDim),
    ...indicateAll(
      targetHeaders,
      C.violet
    ),
    ...indicateAll(
      targetRowLabels,
      C.violet
    ),
    ...fbox(
      [
        ['TRANSPOSED MATRIX', C.violet],
        ['2 feature rows', C.ink],
        ['3 apartment columns', C.ink],
        ['3 × 2 becomes 2 × 3', C.amber]
      ],
      C.violet
    ),
    ...say('AFTER: 2 ROWS × 3 COLUMNS', C.violet)
  );

  // ------------------------------------------------------------
  // The column of ones
  //
  // Each one belongs to an apartment.
  // One means include that apartment exactly once.
  // ------------------------------------------------------------

  const ONE_GAP = P ? 0.62 : 0.64;

  const oneY = i =>
    WORK_Y + (1 - i) * ONE_GAP;

  const ONE_HALF = P ? 0.35 : 0.39;

  const oneHeader = textAt(
    'COUNT',
    18,
    WEIGHT,
    [
      WEIGHT_X,
      WORK.headerY,
      0
    ],
    true,
    1.10
  );

  const oneBracket = matrixBrackets(
    WEIGHT_X - ONE_HALF,
    WEIGHT_X + ONE_HALF,
    oneY(0) + 0.29,
    oneY(2) - 0.29,
    WEIGHT
  );

  const ones = DATA.map((d, i) =>
    numberAt(
      1,
      [
        WEIGHT_X,
        oneY(i),
        0
      ],
      WEIGHT,
      26
    )
  );

  const oneLabels = DATA.map((d, i) =>
    textAt(
      d.id,
      18,
      C.ink,
      [
        WEIGHT_X + ONE_HALF + 0.20,
        oneY(i),
        0
      ],
      true
    )
  );

  const oneDim = tagAt(
    '3 × 1',
    WEIGHT,
    [
      WEIGHT_X,
      DIM_Y,
      0
    ],
    18,
    1.18
  );

  const timesSign = textAt(
    '×',
    25,
    C.ink,
    [
      TIMES_X,
      WORK_Y,
      0
    ],
    true
  );

  const countParts = [
    oneHeader,
    oneBracket,
    ...ones,
    ...oneLabels,
    oneDim,
    timesSign
  ];

  // ============================================================
  // 16-17: Count every apartment once
  // ============================================================

  // 16. Now imagine you want each apartment counted once
  //     in each total.
  await until(S(16));

  await play(
    ...clearBox(),
    new M.LaggedStart(
      targetHeaders.map(header =>
        new M.Indicate(
          header,
          { color: WEIGHT }
        )
      ),
      {
        lagRatio: 0.28,
        runTime: 1.5
      }
    ),
    ...say('COUNT EACH APARTMENT ONCE', WEIGHT)
  );

  // 17. Put a one for A, a one for B,
  //     and a one for C in a column.
  await until(S(17));

  await play(
    new M.FadeIn(oneHeader),
    new M.Create(oneBracket),
    new M.FadeIn(timesSign),
    new M.FadeIn(oneDim),
    new M.LaggedStart(
      DATA.map((d, i) =>
        new M.LaggedStart(
          [
            new M.FadeIn(ones[i]),
            new M.FadeIn(oneLabels[i])
          ],
          {
            lagRatio: 0.05
          }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 1.9
      }
    ),
    ...say('A: 1 • B: 1 • C: 1', WEIGHT)
  );

  // ------------------------------------------------------------
  // Moving row spotlight
  // ------------------------------------------------------------

  let spotNow = null;

  function spotlight(row, color = C.amber) {
    const next = rowHighlight(
      WORK,
      row,
      color
    );

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
  // Pair matching
  //
  // Match an entry in a transpose row with the one belonging
  // to the same apartment.
  //
  // All outlines are constructed from coordinates.
  // ------------------------------------------------------------

  let pairNow = null;

  function makePair(
    row,
    col,
    color
  ) {
    const entryBox = outline(
      WORK.cell(row, col),
      WORK.pitch - 0.14,
      0.66,
      color
    );

    const oneBox = outline(
      [
        WEIGHT_X,
        oneY(col),
        0
      ],
      0.56,
      0.49,
      color
    );

    return new M.VGroup(
      entryBox,
      oneBox
    );
  }

  function matchPair(row, col) {
    const color = row === 0 ? AREA : AGE;

    const next = makePair(
      row,
      col,
      color
    );

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
  // 18-20: Match the first row with the column of ones
  // ============================================================

  // 18. Take the first row of the transpose.
  await until(S(18));

  await play(
    ...spotlight(0, AREA),
    new M.Indicate(
      targetRowLabels[0],
      { color: AREA }
    ),
    ...say('FIRST ROW: FLOOR AREA', AREA)
  );

  // 19. Match the area for A to the one marked A.
  await until(S(19));

  await play(
    ...matchPair(0, 0),
    new M.Indicate(
      targetHeaders[0],
      { color: AREA }
    ),
    new M.Indicate(
      oneLabels[0],
      { color: AREA }
    ),
    ...say('MATCH A WITH A', AREA)
  );

  // 20. Make the same match for B and for C.
  await until(S(20));

  const pairB = makePair(0, 1, AREA);
  const pairC = makePair(0, 2, AREA);

  const bothPairs = new M.VGroup(
    pairB,
    pairC
  );

  await play(
    ...clearPair(),
    new M.FadeIn(bothPairs),
    new M.LaggedStart(
      [
        new M.Indicate(
          targetHeaders[1],
          { color: AREA }
        ),
        new M.Indicate(
          oneLabels[1],
          { color: AREA }
        ),
        new M.Indicate(
          targetHeaders[2],
          { color: AREA }
        ),
        new M.Indicate(
          oneLabels[2],
          { color: AREA }
        )
      ],
      {
        lagRatio: 0.14,
        runTime: 1.45
      }
    ),
    ...say('MATCH B WITH B, C WITH C', AREA)
  );

  // ------------------------------------------------------------
  // Output column
  //
  // The first result is an area total.
  // The second result is an age total.
  //
  // Preserve the feature colors and different units.
  // ------------------------------------------------------------

  const OUTPUT_HALF = P ? 0.40 : 0.43;

  const outputHeader = textAt(
    'TOTALS',
    18,
    RESULT,
    [
      OUTPUT_X,
      WORK.headerY,
      0
    ],
    true,
    1.17
  );

  const outputBracket = matrixBrackets(
    OUTPUT_X - OUTPUT_HALF,
    OUTPUT_X + OUTPUT_HALF,
    WORK.top,
    WORK.bottom,
    RESULT
  );

  const equalsSign = textAt(
    '=',
    25,
    C.ink,
    [
      EQUALS_X,
      WORK_Y,
      0
    ],
    true
  );

  const areaResult = numberAt(
    AREA_TOTAL,
    [
      OUTPUT_X,
      WORK.rowY(0),
      0
    ],
    AREA,
    29
  );

  const ageResult = numberAt(
    AGE_TOTAL,
    [
      OUTPUT_X,
      WORK.rowY(1),
      0
    ],
    AGE,
    29
  );

  const outputDim = tagAt(
    '2 × 1',
    RESULT,
    [
      OUTPUT_X,
      DIM_Y,
      0
    ],
    18,
    1.15
  );

  const outputParts = [
    outputHeader,
    outputBracket,
    equalsSign,
    areaResult,
    ageResult,
    outputDim
  ];

  const outputAreaOutline = outline(
    [
      OUTPUT_X,
      WORK.rowY(0),
      0
    ],
    0.72,
    0.68,
    AREA
  );

  const outputAgeOutline = outline(
    [
      OUTPUT_X,
      WORK.rowY(1),
      0
    ],
    0.72,
    0.68,
    AGE
  );

  // ============================================================
  // 21-24: Calculate the total floor area
  // ============================================================

  // 21. Three times one gives three.
  await until(S(21));

  await play(
    new M.FadeOut(bothPairs),
    ...matchPair(0, 0),
    ...fbox(
      [
        ['AREA TOTAL', AREA],
        ['A: 3 × 1 = 3', AREA]
      ],
      AREA
    ),
    ...say('A: 3 × 1 = 3', AREA)
  );

  // 22. Six times one gives six.
  await until(S(22));

  await play(
    ...matchPair(0, 1),
    ...fbox(
      [
        ['AREA TOTAL', AREA],
        ['A: 3 × 1 = 3', AREA],
        ['B: 6 × 1 = 6', AREA]
      ],
      AREA
    ),
    ...say('B: 6 × 1 = 6', AREA)
  );

  // 23. Nine times one gives nine.
  await until(S(23));

  await play(
    ...matchPair(0, 2),
    ...fbox(
      [
        ['AREA TOTAL', AREA],
        ['A: 3 × 1 = 3', AREA],
        ['B: 6 × 1 = 6', AREA],
        ['C: 9 × 1 = 9', AREA]
      ],
      AREA
    ),
    ...say('C: 9 × 1 = 9', AREA)
  );

  // 24. Together these give eighteen area chunks.
  await until(S(24));

  await play(
    ...clearPair(),
    new M.FadeIn(outputHeader),
    new M.Create(outputBracket),
    new M.FadeIn(equalsSign),
    new M.FadeIn(areaResult),
    new M.Create(outputAreaOutline),
    ...fbox(
      [
        ['TOTAL FLOOR AREA', AREA],
        ['3 × 1 + 6 × 1 + 9 × 1', C.ink],
        ['= 3 + 6 + 9', AREA],
        ['= 18 area chunks', RESULT]
      ],
      AREA
    ),
    ...say('TOTAL AREA = 18 CHUNKS', AREA)
  );

  // ============================================================
  // 25-29: Calculate the total building age
  // ============================================================

  // 25. Move down to the age row.
  await until(S(25));

  await play(
    new M.FadeOut(outputAreaOutline),
    ...spotlight(1, AGE),
    ...fbox(
      [
        ['NEXT: BUILDING AGE', AGE],
        ['Use the same three ones', WEIGHT]
      ],
      AGE
    ),
    ...say('SECOND ROW: BUILDING AGE', AGE)
  );

  // 26. Fourteen times one gives fourteen.
  await until(S(26));

  await play(
    ...matchPair(1, 0),
    ...fbox(
      [
        ['AGE TOTAL', AGE],
        ['A: 14 × 1 = 14', AGE]
      ],
      AGE
    ),
    ...say('A: 14 × 1 = 14', AGE)
  );

  // 27. Two times one gives two.
  await until(S(27));

  await play(
    ...matchPair(1, 1),
    ...fbox(
      [
        ['AGE TOTAL', AGE],
        ['A: 14 × 1 = 14', AGE],
        ['B:  2 × 1 = 2', AGE]
      ],
      AGE
    ),
    ...say('B: 2 × 1 = 2', AGE)
  );

  // 28. The last fourteen times one gives fourteen.
  await until(S(28));

  await play(
    ...matchPair(1, 2),
    ...fbox(
      [
        ['AGE TOTAL', AGE],
        ['A: 14 × 1 = 14', AGE],
        ['B:  2 × 1 = 2', AGE],
        ['C: 14 × 1 = 14', AGE]
      ],
      AGE
    ),
    ...say('C: 14 × 1 = 14', AGE)
  );

  // 29. Together these give thirty years of building age.
  await until(S(29));

  await play(
    ...clearPair(),
    new M.FadeIn(ageResult),
    new M.Create(outputAgeOutline),
    ...fbox(
      [
        ['TOTAL BUILDING AGE', AGE],
        ['14 × 1 + 2 × 1 + 14 × 1', C.ink],
        ['= 14 + 2 + 14', AGE],
        ['= 30 years', RESULT]
      ],
      AGE
    ),
    ...say('TOTAL AGE = 30 YEARS', AGE)
  );

  // ============================================================
  // 30-34: Recognize the dot products and write the rule
  // ============================================================

  // 30. In each row we used a dot product,
  //     multiplying matching entries and adding the results.
  await until(S(30));

  await play(
    ...clearSpotlight(),
    new M.FadeOut(outputAgeOutline),
    new M.LaggedStart(
      [
        new M.Indicate(
          targetRowLabels[0],
          { color: AREA }
        ),
        new M.Indicate(
          areaResult,
          { color: AREA }
        ),
        new M.Indicate(
          targetRowLabels[1],
          { color: AGE }
        ),
        new M.Indicate(
          ageResult,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    ),
    ...fbox(
      [
        ['ONE DOT PRODUCT PER ROW', C.violet],
        ['(3, 6, 9) · (1, 1, 1)', AREA],
        ['= 18 area chunks', AREA],
        ['(14, 2, 14) · (1, 1, 1)', AGE],
        ['= 30 years', AGE]
      ],
      C.violet
    ),
    ...say('MATCH, MULTIPLY, ADD', C.violet)
  );

  // 31. Each one keeps its apartment's contribution
  //     at its original size.
  await until(S(31));

  await play(
    new M.LaggedStart(
      ones.map(one =>
        new M.Indicate(
          one,
          { color: WEIGHT }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 1.5
      }
    ),
    ...fbox(
      [
        ['Multiply by one', WEIGHT],
        ['3 × 1 = 3', AREA],
        ['14 × 1 = 14', AGE],
        ['The measurement stays the same', C.ink]
      ],
      WEIGHT
    ),
    ...say('× 1 KEEPS THE ORIGINAL AMOUNT', WEIGHT)
  );

  // 32. In one line, the transpose times the column of ones
  //     equals the column of feature totals.
  await until(S(32));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          targetBracket,
          { color: C.violet }
        ),
        new M.Indicate(
          oneBracket,
          { color: WEIGHT }
        ),
        new M.Indicate(
          outputBracket,
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 2.1
      }
    ),
    ...fbox(
      [
        ['Transpose × column of ones', C.ink],
        ['= column of feature totals', RESULT],
        ['Area total = 18 chunks', AREA],
        ['Age total  = 30 years', AGE]
      ],
      RESULT
    ),
    ...say('TRANSPOSE × ONES = FEATURE TOTALS', RESULT)
  );

  // 33. The result has two rows and one column.
  await until(S(33));

  await play(
    new M.FadeIn(outputDim),
    ...fbox(
      [
        ['Transpose:     2 × 3', C.violet],
        ['Ones column:   3 × 1', WEIGHT],
        ['Result shape:  2 × 1', RESULT]
      ],
      RESULT
    ),
    new M.Indicate(
      outputBracket,
      { color: RESULT }
    ),
    ...say('RESULT: 2 ROWS × 1 COLUMN', RESULT)
  );

  // 34. Read the area total on top
  //     and the age total underneath.
  await until(S(34));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          areaResult,
          { color: AREA }
        ),
        new M.Indicate(
          ageResult,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.45,
        runTime: 1.5
      }
    ),
    ...fbox(
      [
        ['TOP: AREA TOTAL', AREA],
        ['18 chunks = 180 m²', AREA],
        ['BOTTOM: AGE TOTAL', AGE],
        ['30 years', AGE]
      ],
      RESULT
    ),
    ...say('AREA ON TOP, AGE UNDERNEATH')
  );

  // ============================================================
  // 35: Explain why the transpose is useful
  // ============================================================

  // 35. Use the transpose when the entries you need
  //     to combine sit down a column.
  await until(S(35));

  await play(
    new M.LaggedStart(
      [
        ...areaEntries.map(entry =>
          new M.Indicate(
            entry,
            { color: AREA }
          )
        ),
        ...ageEntries.map(entry =>
          new M.Indicate(
            entry,
            { color: AGE }
          )
        )
      ],
      {
        lagRatio: 0.18,
        runTime: 1.8
      }
    ),
    ...fbox(
      [
        ['Before: values down a column', C.muted],
        ['After: values across a row', C.violet],
        ['Now use a row calculation', RESULT]
      ],
      C.violet
    ),
    ...say('TURN A COLUMN INTO A CALCULATION ROW', C.violet)
  );

  // ------------------------------------------------------------
  // Common mistake: reversing the order of a column
  //
  // Correct area row:
  //   A = 3, B = 6, C = 9
  //
  // Incorrect area row under unchanged headers:
  //   9, 6, 3
  //
  // The total happens to remain 18 when all weights are one,
  // but the apartment identities have become incorrect.
  // ------------------------------------------------------------

  const wrongOrderOutline = rowHighlight(
    WORK,
    0,
    C.amber
  );

  const wrongAOrigin = textAt(
    'from C',
    13,
    C.amber,
    [
      WORK.colX(0),
      WORK.rowY(0) - 0.31,
      0
    ],
    false,
    0.74
  );

  const wrongCOrigin = textAt(
    'from A',
    13,
    C.amber,
    [
      WORK.colX(2),
      WORK.rowY(0) - 0.31,
      0
    ],
    false,
    0.74
  );

  // ============================================================
  // 36-37: Preserve the order and apartment identity
  // ============================================================

  // 36. Watch out for reversing the order
  //     when you lay down a column.
  await until(S(36));

  await play(
    new M.Create(wrongOrderOutline),

    new M.Transform(
      areaEntries[0],
      numberAt(
        AREA_VALUES[0],
        WORK.cell(0, 2),
        AREA
      ),
      { pathArc: 0.60 }
    ),

    new M.Transform(
      areaEntries[2],
      numberAt(
        AREA_VALUES[2],
        WORK.cell(0, 0),
        AREA
      ),
      { pathArc: 0.60 }
    ),

    new M.FadeIn(wrongAOrigin),
    new M.FadeIn(wrongCOrigin),

    ...fbox(
      [
        ['WATCH OUT: REVERSED ORDER', C.amber],
        ['Headers: A, B, C', C.ink],
        ['Wrong:   9, 6, 3', C.amber],
        ['Same total here, wrong listings', C.muted]
      ],
      C.amber
    ),
    ...say('DO NOT REVERSE THE STRIP', C.amber)
  );

  // 37. Keep apartment A's label with the first entry
  //     in each strip.
  await until(S(37));

  await play(
    new M.FadeOut(wrongOrderOutline),
    new M.FadeOut(wrongAOrigin),
    new M.FadeOut(wrongCOrigin),

    new M.Transform(
      areaEntries[0],
      numberAt(
        AREA_VALUES[0],
        WORK.cell(0, 0),
        AREA
      ),
      { pathArc: -0.60 }
    ),

    new M.Transform(
      areaEntries[2],
      numberAt(
        AREA_VALUES[2],
        WORK.cell(0, 2),
        AREA
      ),
      { pathArc: -0.60 }
    ),

    new M.Indicate(
      targetHeaders[0],
      { color: RESULT }
    ),

    ...fbox(
      [
        ['CORRECT ORDER', RESULT],
        ['Apartments: A,  B,  C', C.ink],
        ['Area:       3,  6,  9', AREA],
        ['Age:       14,  2, 14', AGE]
      ],
      RESULT
    ),
    ...say('KEEP EACH VALUE WITH ITS APARTMENT', RESULT)
  );

  // ------------------------------------------------------------
  // Try it preview
  //
  // Use visual prompts for the existing interactive exercise.
  // Do not introduce another data set into the narration.
  // ------------------------------------------------------------

  const tryAreaStrip = outline(
    [
      WORK.cx,
      WORK.rowY(0),
      0
    ],
    WORK.right - WORK.left + 0.12,
    0.76,
    AREA
  );

  const tryOnesOutline = outline(
    [
      WEIGHT_X,
      WORK_Y,
      0
    ],
    ONE_HALF * 2 + 0.15,
    oneY(0) - oneY(2) + 0.68,
    WEIGHT
  );

  const tryTotalsOutline = outline(
    [
      OUTPUT_X,
      WORK_Y,
      0
    ],
    OUTPUT_HALF * 2 + 0.14,
    WORK.top - WORK.bottom + 0.10,
    RESULT
  );

  // ============================================================
  // 38-40: Visual prompts for Try it
  // ============================================================

  // 38. In Try it, move the area strip into its new row.
  await until(S(38));

  await play(
    new M.Create(tryAreaStrip),
    new M.LaggedStart(
      areaEntries.map(entry =>
        new M.Indicate(
          entry,
          { color: AREA }
        )
      ),
      {
        lagRatio: 0.24,
        runTime: 1.4
      }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Move the area strip', AREA],
        ['Into the first feature row', C.ink],
        ['Keep A, B, C in order', C.muted]
      ],
      RESULT
    ),
    ...say('TRY IT: MOVE THE AREA STRIP', AREA)
  );

  // 39. Then put the column of ones in place
  //     and check both totals.
  await until(S(39));

  await play(
    new M.FadeOut(tryAreaStrip),
    new M.Create(tryOnesOutline),
    new M.Create(tryTotalsOutline),
    new M.LaggedStart(
      [
        new M.Indicate(
          oneBracket,
          { color: WEIGHT }
        ),
        new M.Indicate(
          areaResult,
          { color: AREA }
        ),
        new M.Indicate(
          ageResult,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.27,
        runTime: 1.5
      }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Place the column of ones', WEIGHT],
        ['Check area total: 18', AREA],
        ['Check age total:  30', AGE]
      ],
      RESULT
    ),
    ...say('TRY IT: CHECK BOTH TOTALS', RESULT)
  );

  // 40. Tap New data to try the swap
  //     with different listing values.
  await until(S(40));

  await play(
    new M.FadeOut(tryOnesOutline),
    new M.FadeOut(tryTotalsOutline),
    new M.Indicate(
      targetBracket,
      { color: C.violet }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Tap New data', C.ink],
        ['Transpose the fresh table', C.violet],
        ['Calculate the new totals', RESULT]
      ],
      RESULT
    ),
    ...say('NEW DATA: TRY ANOTHER TRANSPOSE', RESULT)
  );

  // ============================================================
  // 41: Final takeaway
  // ============================================================

  // 41. The transpose swaps rows and columns so our row
  //     calculation can add across apartments for each feature.
  await until(S(41));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          targetBracket,
          { color: C.violet }
        ),
        new M.Indicate(
          oneBracket,
          { color: WEIGHT }
        ),
        new M.Indicate(
          areaResult,
          { color: AREA }
        ),
        new M.Indicate(
          ageResult,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.25,
        runTime: 2.3
      }
    ),

    ...fbox(
      [
        ['TRANSPOSE', C.violet],
        ['Swap rows and columns', C.ink],
        ['Keep the entry order', C.amber],
        ['Transpose × ones = totals', RESULT],
        ['Area: 18 chunks', AREA],
        ['Age:  30 years', AGE]
      ],
      RESULT
    ),

    ...say('SWAP ROWS AND COLUMNS, THEN ADD', RESULT)
  );
}
