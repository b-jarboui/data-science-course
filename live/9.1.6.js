// lesson 9.1.6
// Linear dependence: recognize when a new feature repeats existing information.
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
  // Original area unit = 10 square metres.
  // New area unit      =  5 square metres.
  //
  //          Old area    Age    New area
  //    A         3        14        6
  //    B         6         2       12
  //    C         9        14       18
  //
  // New area = 2 × old area + 0 × age.
  //
  // The two area columns are linearly dependent.
  // The original area and age columns are linearly independent.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const OLD_AREA = DATA.map(d => d.area);
  const AGE_VALUES = DATA.map(d => d.age);
  const NEW_AREA = OLD_AREA.map(n => 2 * n);

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const NEW = C.cyan;
  const MULT = C.violet;
  const RESULT = C.green;
  const WARN = C.amber;
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
  // Laptop:
  // Main apartment table on the left.
  // Tile demonstrations and formula box on the right.
  //
  // Phone:
  // Main apartment table above.
  // Tile demonstrations and formula box below.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 4.02, 0]
    : [0, 2.02, 0];

  const LABEL_X = P ? -3.12 : -6.08;
  const OLD_X = P ? -1.88 : -4.88;

  // Initially the age column occupies the second feature position.
  // It moves right when the new area column is inserted.

  const ORIGINAL_AGE_X = P ? -0.05 : -3.12;
  const NEW_X = ORIGINAL_AGE_X;
  const EXPANDED_AGE_X = P ? 1.83 : -1.36;

  const ROW_TOP = P ? 2.10 : 0.62;
  const ROW_GAP = P ? 0.92 : 0.96;

  const rowY = i => ROW_TOP - i * ROW_GAP;

  const MID_Y = rowY(1);

  const HEADER_Y = P ? 3.15 : 1.47;

  const TABLE_TOP = rowY(0) + 0.36;
  const TABLE_BOTTOM = rowY(2) - 0.36;

  const TABLE_LEFT = OLD_X - 0.66;

  const ORIGINAL_RIGHT = ORIGINAL_AGE_X + 0.66;
  const EXPANDED_RIGHT = EXPANDED_AGE_X + 0.66;

  const DIM_Y = TABLE_BOTTOM - 0.40;

  const PANEL_X = P ? 0 : 3.30;
  const PANEL_Y = P ? -2.62 : -0.43;

  const PANEL_W = P ? 6.65 : 5.80;
  const PANEL_H = P ? 3.40 : 3.45;

  const BOXP = [PANEL_X, PANEL_Y, 0];

  const BOX_MAX = P ? FW - 1.10 : 5.65;

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

  function arrowBetween(
    start,
    end,
    color,
    strokeWidth = 2.5,
    headLength = 0.12
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const length = Math.sqrt(
      dx * dx + dy * dy
    );

    const ux = dx / length;
    const uy = dy / length;

    const hx = end[0] - ux * headLength;
    const hy = end[1] - uy * headLength;

    const halfWidth = headLength * 0.48;

    const left = [
      hx - uy * halfWidth,
      hy + ux * halfWidth,
      0
    ];

    const right = [
      hx + uy * halfWidth,
      hy - ux * halfWidth,
      0
    ];

    return new M.VGroup(
      lineBetween(
        start,
        end,
        color,
        strokeWidth
      ),
      lineBetween(
        end,
        left,
        color,
        strokeWidth
      ),
      lineBetween(
        end,
        right,
        color,
        strokeWidth
      )
    );
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
    duration = 1.15,
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
    x,
    y,
    color = C.ink,
    size = 28
  ) {
    return textAt(
      String(n),
      size,
      color,
      [x, y, 0],
      true,
      1.15
    );
  }

  // ------------------------------------------------------------
  // Panel management
  //
  // Only one demonstration panel or formula box occupies
  // the secondary visual area at a time.
  //
  // Objects are grouped only before they appear on screen.
  // ------------------------------------------------------------

  let panelNow = [];

  function replacePanel(
    objects,
    duration = 1.15,
    lag = 0.10
  ) {
    const animations = fadeAll(panelNow);

    if (objects.length) {
      animations.push(
        reveal(
          objects,
          duration,
          lag
        )
      );
    }

    panelNow = objects.slice();

    return animations;
  }

  function clearPanel() {
    const animations = fadeAll(panelNow);
    panelNow = [];

    return animations;
  }

  function panelFrame(
    color = AREA,
    height = PANEL_H
  ) {
    return rectAt(
      BOXP,
      PANEL_W,
      height,
      color,
      C.card,
      0.97
    );
  }

  function panelTitle(
    s,
    color = C.ink
  ) {
    return textAt(
      s,
      P ? 19 : 20,
      color,
      [
        PANEL_X,
        PANEL_Y + PANEL_H / 2 - 0.30,
        0
      ],
      true,
      PANEL_W - 0.50
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // Uses the same compact, colored formula-box style as
  // the approved reference lesson.
  // ------------------------------------------------------------

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 20 : 21;
    const lh = P ? 0.39 : 0.43;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(
        s.trimStart(),
        size,
        c,
        true
      );

      if (t.getWidth() > BOX_MAX - 0.60) {
        t.scale(
          (BOX_MAX - 0.60) / t.getWidth()
        );
      }

      return t;
    });

    const widths = texts.map(
      t => t.getWidth()
    );

    const wd = Math.min(
      BOX_MAX,
      Math.max(...widths) + 0.60
    );

    const ht = rows.length * lh + 0.30;

    const frame = rectAt(
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
      - 0.15
      - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const group = new M.VGroup(
      frame,
      ...texts
    );

    return replacePanel(
      [group],
      0.85
    );
  }

  // ------------------------------------------------------------
  // Matrix brackets
  //
  // Construct directly from coordinates rather than wrapping
  // already-visible table entries.
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
        2.4
      ),
      lineBetween(
        [left, top, 0],
        [left, bottom, 0],
        color,
        2.4
      ),
      lineBetween(
        [left, bottom, 0],
        [left + hook, bottom, 0],
        color,
        2.4
      ),
      lineBetween(
        [right - hook, top, 0],
        [right, top, 0],
        color,
        2.4
      ),
      lineBetween(
        [right, top, 0],
        [right, bottom, 0],
        color,
        2.4
      ),
      lineBetween(
        [right, bottom, 0],
        [right - hook, bottom, 0],
        color,
        2.4
      )
    );
  }

  // ------------------------------------------------------------
  // Opening picture
  //
  // An apartment website already records floor area.
  // A second area column appears beside the original one.
  // The question is whether it actually adds information.
  // ------------------------------------------------------------

  const INTRO_Y = P ? 0.95 : -0.15;
  const INTRO_W = P ? 6.50 : 8.20;
  const INTRO_H = P ? 3.15 : 3.10;

  const introFrame = rectAt(
    [0, INTRO_Y, 0],
    INTRO_W,
    INTRO_H,
    C.muted,
    C.card,
    0.97
  );

  const introTitle = textAt(
    'APARTMENT LISTINGS',
    P ? 22 : 24,
    C.ink,
    [
      0,
      INTRO_Y + 1.18,
      0
    ],
    true,
    INTRO_W - 0.50
  );

  const introRule = lineBetween(
    [
      -INTRO_W / 2 + 0.25,
      INTRO_Y + 0.85,
      0
    ],
    [
      INTRO_W / 2 - 0.25,
      INTRO_Y + 0.85,
      0
    ],
    GRID,
    1.6
  );

  const INTRO_COL_W = P ? 1.75 : 2.20;

  const INTRO_OLD_X = P ? -1.98 : -2.55;
  const INTRO_AGE_X = 0;
  const INTRO_NEW_X = P ? 1.98 : 2.55;

  function introColumn(
    x,
    heading,
    color,
    isNew = false
  ) {
    const r = rectAt(
      [
        x,
        INTRO_Y - 0.12,
        0
      ],
      INTRO_COL_W,
      1.53,
      color,
      color,
      0.10,
      1.6
    );

    const header = textAt(
      heading,
      P ? 17 : 19,
      color,
      [
        x,
        INTRO_Y + 0.39,
        0
      ],
      true,
      INTRO_COL_W - 0.22
    );

    const entries = [];

    for (let i = 0; i < 3; i++) {
      const y = INTRO_Y
        + 0.04
        - i * 0.29;

      if (isNew) {
        entries.push(
          textAt(
            '?',
            18,
            color,
            [x, y, 0],
            true
          )
        );
      } else {
        const bar = new M.Rectangle({
          width: INTRO_COL_W * (
            0.35 + 0.12 * i
          ),
          height: 0.11,
          color,
          strokeWidth: 1
        });

        bar.setFill(color, 0.65);
        bar.moveTo([x, y, 0]);

        entries.push(bar);
      }
    }

    return new M.VGroup(
      r,
      header,
      ...entries
    );
  }

  const introOld = introColumn(
    INTRO_OLD_X,
    'AREA',
    AREA
  );

  const introAge = introColumn(
    INTRO_AGE_X,
    'AGE',
    AGE
  );

  const introNew = introColumn(
    INTRO_NEW_X,
    'NEW AREA',
    AREA,
    true
  );

  const introNewTag = tagAt(
    'NEW COLUMN',
    WARN,
    [
      INTRO_NEW_X,
      INTRO_Y - 1.12,
      0
    ],
    16,
    INTRO_COL_W
  );

  const introQuestion = tagAt(
    'NEW INFORMATION?',
    WARN,
    [
      0,
      INTRO_Y - INTRO_H / 2 - 0.42,
      0
    ],
    21,
    5.50
  );

  const introParts = [
    introFrame,
    introTitle,
    introRule,
    introOld,
    introAge,
    introNew,
    introNewTag,
    introQuestion
  ];

  // ============================================================
  // 0-1: Does the new column tell us anything new?
  // ============================================================

  // 0. Imagine an apartment website adds another column
  //    for floor area.
  await until(S(0));

  await play(
    new M.FadeIn(introFrame),
    new M.FadeIn(introTitle),
    new M.Create(introRule),
    reveal(
      [
        introOld,
        introAge,
        introNew,
        introNewTag
      ],
      1.8,
      0.25
    ),
    ...say('ANOTHER COLUMN FOR FLOOR AREA')
  );

  // 1. Does that new column tell us anything new
  //    about the three apartments?
  await until(S(1));

  await play(
    new M.FadeIn(introQuestion),
    new M.Indicate(
      introNew,
      { color: WARN }
    ),
    ...say('DO WE LEARN ANYTHING NEW?', WARN)
  );

  // ------------------------------------------------------------
  // Main apartment table
  //
  // All numeric entries remain independent.
  // Headers are grouped before appearing on screen.
  // ------------------------------------------------------------

  function columnHeader(
    title,
    unit,
    x,
    color
  ) {
    const heading = textAt(
      title,
      P ? 18 : 18,
      color,
      [
        x,
        HEADER_Y,
        0
      ],
      true,
      1.60
    );

    const unitLabel = textAt(
      unit,
      P ? 15 : 14,
      color,
      [
        x,
        HEADER_Y - 0.29,
        0
      ],
      false,
      1.60
    );

    return new M.VGroup(
      heading,
      unitLabel
    );
  }

  const apartmentHeader = textAt(
    'APT',
    17,
    C.muted,
    [
      LABEL_X,
      HEADER_Y - 0.10,
      0
    ],
    true,
    0.75
  );

  const oldHeader = columnHeader(
    'OLD AREA',
    '10 m² units',
    OLD_X,
    AREA
  );

  let ageHeader = columnHeader(
    'AGE',
    'years',
    ORIGINAL_AGE_X,
    AGE
  );

  function makeNewHeader() {
    return columnHeader(
      'NEW AREA',
      '5 m² units',
      NEW_X,
      NEW
    );
  }

  const apartmentLabels = DATA.map((d, i) =>
    textAt(
      d.id,
      24,
      C.ink,
      [
        LABEL_X,
        rowY(i),
        0
      ],
      true
    )
  );

  const oldEntries = OLD_AREA.map((v, i) =>
    numberAt(
      v,
      OLD_X,
      rowY(i),
      AREA
    )
  );

  const ageEntries = AGE_VALUES.map((v, i) =>
    numberAt(
      v,
      ORIGINAL_AGE_X,
      rowY(i),
      AGE
    )
  );

  function makeNewEntries() {
    return NEW_AREA.map((v, i) =>
      numberAt(
        v,
        NEW_X,
        rowY(i),
        NEW
      )
    );
  }

  let newHeader = makeNewHeader();
  let newEntries = makeNewEntries();

  const tableBracket = matrixBrackets(
    TABLE_LEFT,
    ORIGINAL_RIGHT,
    TABLE_TOP,
    TABLE_BOTTOM
  );

  function dimensionTag(expanded) {
    const right = expanded
      ? EXPANDED_RIGHT
      : ORIGINAL_RIGHT;

    return tagAt(
      expanded
        ? '3 ROWS × 3 COLS'
        : '3 ROWS × 2 COLS',
      C.muted,
      [
        (TABLE_LEFT + right) / 2,
        DIM_Y,
        0
      ],
      P ? 15 : 14,
      3.15
    );
  }

  let tableDim = dimensionTag(false);

  function swapAgeHeader(x) {
    const old = ageHeader;
    ageHeader = columnHeader('AGE', 'years', x, AGE);
    return [new M.FadeOut(old), new M.FadeIn(ageHeader)];
  }

  function swapDim(expanded) {
    const old = tableDim;
    tableDim = dimensionTag(expanded);
    return [new M.FadeOut(old), new M.FadeIn(tableDim)];
  }

  const tableParts = [
    tableBracket,
    apartmentHeader,
    oldHeader,
    ageHeader,
    ...apartmentLabels,
    ...oldEntries,
    ...ageEntries,
    tableDim
  ];

  // ------------------------------------------------------------
  // Coordinate-based highlights
  // ------------------------------------------------------------

  function columnOutline(
    x,
    color
  ) {
    return outline(
      [
        x,
        MID_Y,
        0
      ],
      P ? 1.30 : 1.25,
      TABLE_TOP - TABLE_BOTTOM + 0.08,
      color
    );
  }

  function cellOutline(
    x,
    i,
    color
  ) {
    return outline(
      [
        x,
        rowY(i),
        0
      ],
      1.14,
      0.66,
      color
    );
  }

  function rowOutline(
    i,
    expanded = false,
    color = WARN
  ) {
    const right = expanded
      ? EXPANDED_RIGHT
      : ORIGINAL_RIGHT;

    return outline(
      [
        (TABLE_LEFT + right) / 2,
        rowY(i),
        0
      ],
      right - TABLE_LEFT + 0.08,
      0.75,
      color
    );
  }

  let markNow = [];

  function mark(objects) {
    const animations = [
      ...fadeAll(markNow),
      ...objects.map(
        o => new M.Create(o)
      )
    ];

    markNow = objects.slice();

    return animations;
  }

  function clearMarks() {
    const animations = fadeAll(markNow);
    markNow = [];

    return animations;
  }

  // ============================================================
  // 2-4: Original features and the new area unit
  // ============================================================

  // 2. Put the old table on screen with its area
  //    and building age columns.
  await until(S(2));

  await play(
    ...fadeAll(introParts),
    reveal(
      tableParts,
      1.5,
      0.08
    ),
    ...say('THE ORIGINAL APARTMENT TABLE')
  );

  // ------------------------------------------------------------
  // Physical floor-area tile helpers
  //
  // The original tile is twice the width of a new tile.
  // Both use cyan because both measure the same feature.
  // ------------------------------------------------------------

  function floorTile(
    p,
    w,
    h,
    opacity = 0.70,
    color = AREA
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function oldUnitPicture() {
    const frame = panelFrame(AREA);

    const title = panelTitle(
      'THE ORIGINAL AREA UNIT',
      AREA
    );

    const tile = floorTile(
      [
        PANEL_X,
        PANEL_Y + 0.22,
        0
      ],
      2.20,
      1.00,
      0.62
    );

    const label = textAt(
      '10 m²',
      29,
      C.ink,
      [
        PANEL_X,
        PANEL_Y + 0.22,
        0
      ],
      true
    );

    const footer = tagAt(
      'ONE OLD AREA CHUNK',
      AREA,
      [
        PANEL_X,
        PANEL_Y - 0.85,
        0
      ],
      17,
      PANEL_W - 0.60
    );

    return [
      frame,
      title,
      tile,
      label,
      footer
    ];
  }

  // 3. The original area column counts floor chunks
  //    of ten square metres.
  await until(S(3));

  await play(
    ...mark([
      columnOutline(OLD_X, AREA)
    ]),
    ...replacePanel(
      oldUnitPicture(),
      1.15
    ),
    new M.Indicate(
      oldHeader,
      { color: AREA }
    ),
    ...say('OLD AREA: 1 CHUNK = 10 m²', AREA)
  );

  function compareUnitsPicture() {
    const frame = panelFrame(AREA);

    const title = panelTitle(
      'TWO WAYS TO COUNT THE FLOOR',
      AREA
    );

    const oldX = PANEL_X - 1.38;
    const newX = PANEL_X + 1.38;
    const y = PANEL_Y + 0.16;

    const oldTile = floorTile(
      [oldX, y, 0],
      1.75,
      0.91,
      0.64
    );

    const smallTile = floorTile(
      [newX, y, 0],
      0.875,
      0.91,
      0.64
    );

    const oldValue = textAt(
      '10 m²',
      22,
      C.ink,
      [oldX, y, 0],
      true
    );

    const newValue = textAt(
      '5 m²',
      20,
      C.ink,
      [newX, y, 0],
      true,
      0.79
    );

    const oldLabel = textAt(
      'OLD CHUNK',
      16,
      AREA,
      [
        oldX,
        y - 0.73,
        0
      ],
      true
    );

    const newLabel = textAt(
      'NEW CHUNK',
      16,
      NEW,
      [
        newX,
        y - 0.73,
        0
      ],
      true
    );

    const note = textAt(
      'Same feature, smaller measuring unit',
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.20,
        0
      ],
      false,
      PANEL_W - 0.50
    );

    return [
      frame,
      title,
      oldTile,
      smallTile,
      oldValue,
      newValue,
      oldLabel,
      newLabel,
      note
    ];
  }

  // 4. Now the website also counts smaller floor chunks
  //    of five square metres.
  await until(S(4));

  await play(
    ...replacePanel(
      compareUnitsPicture(),
      1.40,
      0.12
    ),
    ...say('NEW AREA: 1 CHUNK = 5 m²', AREA)
  );

  // ------------------------------------------------------------
  // Split one physical floor chunk into two equal pieces.
  //
  // Upper tile: one original 10 m² chunk.
  // Lower tiles: two new 5 m² chunks.
  //
  // Both lower tiles together occupy the same floor area.
  // ------------------------------------------------------------

  function splitUnitPicture() {
    const frame = panelFrame(AREA);

    const title = panelTitle(
      'SPLIT ONE OLD CHUNK',
      AREA
    );

    const oldY = PANEL_Y + 0.48;
    const newY = PANEL_Y - 0.63;

    const oldTile = floorTile(
      [
        PANEL_X,
        oldY,
        0
      ],
      2.16,
      0.60,
      0.64
    );

    const oldLabel = textAt(
      '10 m²',
      22,
      C.ink,
      [
        PANEL_X,
        oldY,
        0
      ],
      true
    );

    const dividingLine = new M.DashedLine({
      start: [
        PANEL_X,
        oldY - 0.30,
        0
      ],
      end: [
        PANEL_X,
        oldY + 0.30,
        0
      ],
      color: C.ink,
      strokeWidth: 2.5
    });

    const downArrow = arrowBetween(
      [
        PANEL_X,
        oldY - 0.35,
        0
      ],
      [
        PANEL_X,
        newY + 0.36,
        0
      ],
      MULT,
      2.5,
      0.12
    );

    const halves = [];

    for (let k = 0; k < 2; k++) {
      const x = PANEL_X
        + (k - 0.5) * 1.18;

      const r = floorTile(
        [x, newY, 0],
        1.08,
        0.60,
        0.68
      );

      const label = textAt(
        '5 m²',
        20,
        C.ink,
        [x, newY, 0],
        true,
        0.94
      );

      halves.push(
        new M.VGroup(r, label)
      );
    }

    const footer = tagAt(
      '1 OLD CHUNK → 2 NEW CHUNKS',
      AREA,
      [
        PANEL_X,
        PANEL_Y - 1.26,
        0
      ],
      16,
      PANEL_W - 0.50
    );

    return [
      frame,
      title,
      oldTile,
      oldLabel,
      dividingLine,
      downArrow,
      ...halves,
      footer
    ];
  }

  // ============================================================
  // 5-8: Split each original floor chunk in two
  // ============================================================

  // 5. Imagine splitting each old floor chunk
  //    into two equal pieces.
  await until(S(5));

  await play(
    ...replacePanel(
      splitUnitPicture(),
      1.85,
      0.15
    ),
    ...say('EVERY OLD CHUNK BECOMES TWO', AREA)
  );

  // ------------------------------------------------------------
  // Apartment-specific tile demonstrations
  //
  // Keep the same physical scale for A, B and C.
  // Old chunks appear on the upper row.
  // Each old chunk corresponds to exactly two new chunks.
  // ------------------------------------------------------------

  const TILE_PITCH = P ? 0.54 : 0.49;
  const OLD_TILE_W = TILE_PITCH * 0.84;
  const NEW_TILE_W = OLD_TILE_W / 2;
  const TILE_H = P ? 0.48 : 0.44;

  function splitApartmentPicture(i) {
    const d = DATA[i];

    const frame = panelFrame(AREA);

    const title = panelTitle(
      `APARTMENT ${d.id}`,
      C.ink
    );

    const upperY = PANEL_Y + 0.48;
    const lowerY = PANEL_Y - 0.65;

    const upperLabel = textAt(
      `${d.area} OLD CHUNKS • 10 m² EACH`,
      P ? 16 : 17,
      AREA,
      [
        PANEL_X,
        upperY + 0.46,
        0
      ],
      true,
      PANEL_W - 0.45
    );

    const oldTiles = [];
    const newPairs = [];
    const splitGuides = [];

    for (let k = 0; k < d.area; k++) {
      const x = PANEL_X
        + (k - (d.area - 1) / 2)
        * TILE_PITCH;

      const oldTile = floorTile(
        [
          x,
          upperY,
          0
        ],
        OLD_TILE_W,
        TILE_H,
        0.72
      );

      oldTiles.push(oldTile);

      const guide = lineBetween(
        [
          x,
          upperY - TILE_H / 2,
          0
        ],
        [
          x,
          lowerY + TILE_H / 2,
          0
        ],
        GRID,
        1.2
      );

      splitGuides.push(guide);

      const pairGap = 0.035;
      const pairOffset = (
        NEW_TILE_W + pairGap
      ) / 2;

      const left = floorTile(
        [
          x - pairOffset,
          lowerY,
          0
        ],
        NEW_TILE_W,
        TILE_H,
        0.76
      );

      const right = floorTile(
        [
          x + pairOffset,
          lowerY,
          0
        ],
        NEW_TILE_W,
        TILE_H,
        0.76
      );

      newPairs.push(
        new M.VGroup(left, right)
      );
    }

    const multiplier = tagAt(
      'SPLIT × 2',
      MULT,
      [
        PANEL_X,
        PANEL_Y - 0.08,
        0
      ],
      15,
      1.80
    );

    const lowerLabel = textAt(
      `${2 * d.area} NEW CHUNKS • 5 m² EACH`,
      P ? 16 : 17,
      NEW,
      [
        PANEL_X,
        lowerY - 0.46,
        0
      ],
      true,
      PANEL_W - 0.45
    );

    const physicalArea = textAt(
      `Same floor space: ${10 * d.area} m²`,
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.42,
        0
      ],
      false,
      PANEL_W - 0.50
    );

    const topGroup = new M.VGroup(
      upperLabel,
      ...oldTiles
    );

    const bottomGroup = new M.VGroup(
      ...newPairs,
      lowerLabel
    );

    return [
      frame,
      title,
      topGroup,
      new M.VGroup(...splitGuides),
      multiplier,
      bottomGroup,
      physicalArea
    ];
  }

  // 6. For A, the three old chunks become six new chunks.
  await until(S(6));

  await play(
    ...mark([
      cellOutline(OLD_X, 0, AREA)
    ]),
    ...replacePanel(
      splitApartmentPicture(0),
      1.65,
      0.20
    ),
    new M.Indicate(
      apartmentLabels[0],
      { color: AREA }
    ),
    ...say('A: 3 OLD CHUNKS → 6 NEW CHUNKS', AREA)
  );

  // 7. For B, the six old chunks become twelve new chunks.
  await until(S(7));

  await play(
    ...mark([
      cellOutline(OLD_X, 1, AREA)
    ]),
    ...replacePanel(
      splitApartmentPicture(1),
      1.65,
      0.20
    ),
    new M.Indicate(
      apartmentLabels[1],
      { color: AREA }
    ),
    ...say('B: 6 OLD CHUNKS → 12 NEW CHUNKS', AREA)
  );

  // 8. For C, the nine old chunks become eighteen new chunks.
  await until(S(8));

  await play(
    ...mark([
      cellOutline(OLD_X, 2, AREA)
    ]),
    ...replacePanel(
      splitApartmentPicture(2),
      1.65,
      0.20
    ),
    new M.Indicate(
      apartmentLabels[2],
      { color: AREA }
    ),
    ...say('C: 9 OLD CHUNKS → 18 NEW CHUNKS', AREA)
  );

  // ------------------------------------------------------------
  // Insert the new area column into the apartment table.
  //
  // Original feature order: old area, age.
  // Expanded display order: old area, new area, age.
  //
  // The two area columns are now adjacent for comparison.
  // ------------------------------------------------------------

  function expandTable() {
    return [
      new M.Transform(
        tableBracket,
        matrixBrackets(
          TABLE_LEFT,
          EXPANDED_RIGHT,
          TABLE_TOP,
          TABLE_BOTTOM
        )
      ),

      ...swapAgeHeader(EXPANDED_AGE_X),

      ...ageEntries.map((entry, i) =>
        new M.Transform(
          entry,
          numberAt(
            AGE_VALUES[i],
            EXPANDED_AGE_X,
            rowY(i),
            AGE
          )
        )
      ),

      ...swapDim(true),

      new M.FadeIn(newHeader),

      reveal(
        newEntries,
        1.10,
        0.23
      )
    ];
  }

  function restoreOriginalTable() {
    return [
      new M.FadeOut(newHeader),
      ...fadeAll(newEntries),

      new M.Transform(
        tableBracket,
        matrixBrackets(
          TABLE_LEFT,
          ORIGINAL_RIGHT,
          TABLE_TOP,
          TABLE_BOTTOM
        )
      ),

      ...swapAgeHeader(ORIGINAL_AGE_X),

      ...ageEntries.map((entry, i) =>
        new M.Transform(
          entry,
          numberAt(
            AGE_VALUES[i],
            ORIGINAL_AGE_X,
            rowY(i),
            AGE
          )
        )
      ),

      ...swapDim(false)
    ];
  }

  // ============================================================
  // 9-13: Discover the repeated information
  // ============================================================

  // 9. Put the two area columns side by side.
  await until(S(9));

  await play(
    ...clearPanel(),
    ...clearMarks(),
    ...expandTable(),
    ...say('TWO AREA COLUMNS, SIDE BY SIDE', AREA)
  );

  // ------------------------------------------------------------
  // A visual multiplier diagram.
  //
  // Each row uses the same fixed multiplier, two.
  // A: 3 → 6
  // B: 6 → 12
  // C: 9 → 18
  // ------------------------------------------------------------

  function multiplierPicture() {
    const frame = panelFrame(AREA);

    const title = panelTitle(
      'THE SAME RULE FOR EVERY ROW',
      C.ink
    );

    const leftX = PANEL_X - 1.55;
    const rightX = PANEL_X + 1.55;

    const labels = [
      textAt(
        'OLD',
        16,
        AREA,
        [
          leftX,
          PANEL_Y + 0.87,
          0
        ],
        true
      ),

      textAt(
        'NEW',
        16,
        NEW,
        [
          rightX,
          PANEL_Y + 0.87,
          0
        ],
        true
      )
    ];

    const rows = DATA.map((d, i) => {
      const y = PANEL_Y + 0.36 - i * 0.72;

      const apartment = textAt(
        d.id,
        17,
        C.ink,
        [
          PANEL_X - 2.38,
          y,
          0
        ],
        true
      );

      const oldValue = numberAt(
        d.area,
        leftX,
        y,
        AREA,
        25
      );

      const newValue = numberAt(
        2 * d.area,
        rightX,
        y,
        NEW,
        25
      );

      const arrow = arrowBetween(
        [
          leftX + 0.44,
          y,
          0
        ],
        [
          rightX - 0.44,
          y,
          0
        ],
        MULT,
        2.5,
        0.13
      );

      const multiplier = tagAt(
        '× 2',
        MULT,
        [
          PANEL_X,
          y,
          0
        ],
        17
      );

      return new M.VGroup(
        apartment,
        oldValue,
        arrow,
        multiplier,
        newValue
      );
    });

    const footer = textAt(
      'The multiplier never changes.',
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.37,
        0
      ],
      false,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      ...labels,
      ...rows,
      footer
    ];
  }

  // 10. For each apartment, the same rule goes from
  //     the old amount to the new one.
  await until(S(10));

  await play(
    ...mark([
      columnOutline(OLD_X, AREA),
      columnOutline(NEW_X, NEW)
    ]),
    ...replacePanel(
      multiplierPicture(),
      1.75,
      0.15
    ),
    ...say('SAME RULE FOR A, B AND C', MULT)
  );

  // 11. The new area number always equals twice
  //     the old area number.
  await until(S(11));

  await play(
    ...fbox(
      [
        ['NEW AREA = 2 × OLD AREA', AREA],
        ['A: 2 × 3 = 6', C.ink],
        ['B: 2 × 6 = 12', C.ink],
        ['C: 2 × 9 = 18', C.ink]
      ],
      AREA
    ),
    new M.LaggedStart(
      newEntries.map(entry =>
        new M.Indicate(
          entry,
          { color: AREA }
        )
      ),
      {
        lagRatio: 0.28,
        runTime: 1.6
      }
    ),
    ...say('NEW AREA = TWICE OLD AREA', AREA)
  );

  // ------------------------------------------------------------
  // Cover the new column.
  //
  // The old column remains visible.
  // Its values are sufficient to reconstruct every hidden value.
  // ------------------------------------------------------------

  const coverFrame = rectAt(
    [
      NEW_X,
      MID_Y,
      0
    ],
    P ? 1.40 : 1.36,
    TABLE_TOP - TABLE_BOTTOM + 0.10,
    WARN,
    C.card,
    1,
    2
  );

  const coverQuestions = DATA.map((d, i) =>
    textAt(
      '?',
      27,
      WARN,
      [
        NEW_X,
        rowY(i),
        0
      ],
      true
    )
  );

  const columnCover = new M.VGroup(
    coverFrame,
    ...coverQuestions
  );

  // 12. We could cover the new column and rebuild it
  //     using the old one.
  await until(S(12));

  await play(
    ...clearMarks(),
    new M.FadeIn(columnCover),
    ...fbox(
      [
        ['COVER THE NEW COLUMN', WARN],
        ['Old A: 3 × 2 → 6', AREA],
        ['Old B: 6 × 2 → 12', AREA],
        ['Old C: 9 × 2 → 18', AREA],
        ['Every hidden value is known.', RESULT]
      ],
      WARN
    ),
    ...say('WE CAN REBUILD THE HIDDEN COLUMN', WARN)
  );

  // 13. That makes the new column redundant,
  //     which means it repeats information already present.
  await until(S(13));

  await play(
    new M.FadeOut(columnCover),
    ...mark([
      columnOutline(NEW_X, WARN)
    ]),
    ...fbox(
      [
        ['REDUNDANT', WARN],
        ['Repeats existing information', C.ink],
        ['New area is already determined', AREA],
        ['by the original area column.', AREA]
      ],
      WARN
    ),
    ...say('REDUNDANT = INFORMATION WE ALREADY HAVE', WARN)
  );

  // ============================================================
  // 14-18: Introduce linear combinations
  // ============================================================

  // 14. A linear combination is what you get when you
  //     multiply columns by fixed numbers and add.
  await until(S(14));

  await play(
    ...clearMarks(),
    ...fbox(
      [
        ['LINEAR COMBINATION', MULT],
        ['Multiply whole columns', C.ink],
        ['by fixed numbers.', MULT],
        ['Then add matching rows.', RESULT]
      ],
      MULT
    ),
    ...say('MULTIPLY COLUMNS, THEN ADD', MULT)
  );

  // ------------------------------------------------------------
  // Column trays
  //
  // Each tray contains one whole column.
  // A, B and C remain in their original order.
  // ------------------------------------------------------------

  function columnTray(
    values,
    x,
    y,
    w,
    h,
    color,
    heading,
    options = {}
  ) {
    const opacity = options.opacity === undefined
      ? 0.95
      : options.opacity;

    const frame = rectAt(
      [x, y, 0],
      w,
      h,
      color,
      C.card,
      opacity,
      1.8
    );

    const headingLabel = textAt(
      heading,
      15,
      color,
      [
        x,
        y + h / 2 - 0.24,
        0
      ],
      true,
      w - 0.18
    );

    const divider = lineBetween(
      [
        x - w / 2 + 0.12,
        y + h / 2 - 0.45,
        0
      ],
      [
        x + w / 2 - 0.12,
        y + h / 2 - 0.45,
        0
      ],
      GRID,
      1.2
    );

    const gap = (h - 0.55) / 3;

    const entries = [];

    for (let i = 0; i < 3; i++) {
      const ry = y
        + h / 2
        - 0.55
        - (i + 0.5) * gap;

      if (options.showLabels !== false) {
        entries.push(
          textAt(
            DATA[i].id,
            15,
            C.muted,
            [
              x - w * 0.29,
              ry,
              0
            ],
            true
          )
        );
      }

      const valueX = options.showLabels === false
        ? x
        : x + w * 0.13;

      entries.push(
        textAt(
          String(values[i]),
          23,
          color,
          [
            valueX,
            ry,
            0
          ],
          true,
          w * 0.48
        )
      );
    }

    return new M.VGroup(
      frame,
      headingLabel,
      divider,
      ...entries
    );
  }

  function originalTraysPicture() {
    const frame = panelFrame(MULT);

    const title = panelTitle(
      'ONE TRAY FOR EACH ORIGINAL COLUMN',
      MULT
    );

    const y = PANEL_Y + 0.04;
    const w = P ? 2.05 : 1.90;
    const h = 2.00;

    const areaTray = columnTray(
      OLD_AREA,
      PANEL_X - 1.25,
      y,
      w,
      h,
      AREA,
      'OLD AREA'
    );

    const ageTray = columnTray(
      AGE_VALUES,
      PANEL_X + 1.25,
      y,
      w,
      h,
      AGE,
      'AGE'
    );

    const footer = textAt(
      'Each tray holds an entire column.',
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.30,
        0
      ],
      false,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      areaTray,
      ageTray,
      footer
    ];
  }

  // 15. Picture one tray for the old area column
  //     and one for the age column.
  await until(S(15));

  await play(
    ...mark([
      columnOutline(OLD_X, AREA),
      columnOutline(EXPANDED_AGE_X, AGE)
    ]),
    ...replacePanel(
      originalTraysPicture(),
      1.40,
      0.16
    ),
    ...say('TWO ORIGINAL COLUMN TRAYS')
  );

  // ------------------------------------------------------------
  // Take two copies of old area and zero copies of age.
  //
  // The age contribution is shown explicitly as zeros:
  // 0 × (14, 2, 14) = (0, 0, 0).
  // ------------------------------------------------------------

  function copiedTraysPicture() {
    const frame = panelFrame(MULT);

    const title = panelTitle(
      'TWO AREA COPIES, ZERO AGE COPIES',
      MULT
    );

    const y = PANEL_Y + 0.10;
    const pitch = P ? 1.79 : 1.62;
    const w = P ? 1.40 : 1.25;
    const h = 1.95;

    const x1 = PANEL_X - pitch;
    const x2 = PANEL_X;
    const x3 = PANEL_X + pitch;

    const copy1 = columnTray(
      OLD_AREA,
      x1,
      y,
      w,
      h,
      AREA,
      'AREA 1',
      {
        showLabels: false
      }
    );

    const copy2 = columnTray(
      OLD_AREA,
      x2,
      y,
      w,
      h,
      AREA,
      'AREA 2',
      {
        showLabels: false
      }
    );

    const zeroAge = columnTray(
      [0, 0, 0],
      x3,
      y,
      w,
      h,
      AGE,
      '0 × AGE',
      {
        showLabels: false
      }
    );

    const plus1 = textAt(
      '+',
      23,
      C.ink,
      [
        (x1 + x2) / 2,
        y - 0.08,
        0
      ],
      true
    );

    const plus2 = textAt(
      '+',
      23,
      C.ink,
      [
        (x2 + x3) / 2,
        y - 0.08,
        0
      ],
      true
    );

    const footer = tagAt(
      '2 × AREA + 0 × AGE',
      MULT,
      [
        PANEL_X,
        PANEL_Y - 1.23,
        0
      ],
      16,
      PANEL_W - 0.55
    );

    return [
      frame,
      title,
      copy1,
      plus1,
      copy2,
      plus2,
      zeroAge,
      footer
    ];
  }

  // 16. Take two copies from the area tray
  //     and zero copies from the age tray.
  await until(S(16));

  await play(
    ...replacePanel(
      copiedTraysPicture(),
      1.75,
      0.20
    ),
    new M.Indicate(
      oldHeader,
      { color: AREA }
    ),
    new M.Indicate(
      ageHeader,
      { color: AGE }
    ),
    ...say('2 COPIES OF AREA • 0 COPIES OF AGE', MULT)
  );

  // ------------------------------------------------------------
  // Add across the copied columns, apartment by apartment.
  //
  // Use exactly the same column multipliers for every row.
  // ------------------------------------------------------------

  function additionPicture() {
    const frame = panelFrame(RESULT);

    const title = panelTitle(
      'ADD THE MATCHING APARTMENT ROWS',
      RESULT
    );

    const offsets = [
      -2.40,
      -1.65,
      -0.98,
      -0.31,
      0.36,
      1.03,
      1.68,
      2.37
    ];

    const colors = [
      C.ink,
      AREA,
      C.muted,
      AREA,
      C.muted,
      AGE,
      C.muted,
      RESULT
    ];

    const rows = DATA.map((d, i) => {
      const y = PANEL_Y
        + 0.65
        - i * 0.82;

      const pieces = [
        d.id,
        String(d.area),
        '+',
        String(d.area),
        '+',
        '0',
        '=',
        String(2 * d.area)
      ];

      const rowFrame = rectAt(
        [
          PANEL_X,
          y,
          0
        ],
        PANEL_W - 0.38,
        0.59,
        GRID,
        C.card,
        0.97,
        1
      );

      const labels = pieces.map((s, k) =>
        textAt(
          s,
          k === 7 ? 24 : 21,
          colors[k],
          [
            PANEL_X + offsets[k],
            y,
            0
          ],
          true,
          0.59
        )
      );

      return new M.VGroup(
        rowFrame,
        ...labels
      );
    });

    const footer = textAt(
      'Each row gives its new area count.',
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.40,
        0
      ],
      false,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      ...rows,
      footer
    ];
  }

  // 17. Add across the copies one apartment at a time.
  await until(S(17));

  await play(
    ...clearMarks(),
    ...replacePanel(
      additionPicture(),
      1.45,
      0.25
    ),
    ...say('ADD ACROSS A, THEN B, THEN C', RESULT)
  );

  // 18. So the new column is a linear combination
  //     of the original columns.
  await until(S(18));

  await play(
    ...mark([
      columnOutline(NEW_X, RESULT)
    ]),
    ...fbox(
      [
        ['LINEAR COMBINATION', MULT],
        ['2 × (3, 6, 9)', AREA],
        ['+ 0 × (14, 2, 14)', AGE],
        ['= (6, 12, 18)', RESULT],
        ['This is the new area column.', C.ink]
      ],
      RESULT
    ),
    ...say('NEW AREA IS A LINEAR COMBINATION', RESULT)
  );

  // ============================================================
  // 19-20: Name linear dependence
  // ============================================================

  // 19. When one column can be rebuilt this way from
  //     the others, the columns are linearly dependent.
  await until(S(19));

  await play(
    ...mark([
      columnOutline(OLD_X, AREA),
      columnOutline(NEW_X, WARN)
    ]),
    ...fbox(
      [
        ['LINEARLY DEPENDENT', WARN],
        ['One column can be rebuilt', C.ink],
        ['from the other columns.', C.ink],
        ['New area = 2 × old area', AREA]
      ],
      WARN
    ),
    ...say('LINEAR DEPENDENCE = REBUILDABLE COLUMN', WARN)
  );

  // 20. The same fixed numbers have to work
  //     in every apartment row.
  await until(S(20));

  await play(
    ...clearMarks(),
    new M.LaggedStart(
      [
        new M.Indicate(
          apartmentLabels[0],
          { color: MULT }
        ),
        new M.Indicate(
          apartmentLabels[1],
          { color: MULT }
        ),
        new M.Indicate(
          apartmentLabels[2],
          { color: MULT }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.6
      }
    ),
    ...fbox(
      [
        ['FIXED MULTIPLIERS', MULT],
        ['Old area multiplier: 2', AREA],
        ['Age multiplier:      0', AGE],
        ['Same for A, B and C', RESULT]
      ],
      MULT
    ),
    ...say('THE SAME NUMBERS MUST WORK IN EVERY ROW', MULT)
  );

  // ============================================================
  // 21-26: Check whether the original columns are independent
  // ============================================================

  // 21. Check the area and age columns on their own.
  await until(S(21));

  await play(
    ...clearPanel(),
    ...restoreOriginalTable(),
    ...say('NOW CHECK JUST THE ORIGINAL FEATURES')
  );

  // 22. A and C have the same building age
  //     of fourteen years.
  await until(S(22));

  await play(
    ...mark([
      cellOutline(
        ORIGINAL_AGE_X,
        0,
        AGE
      ),
      cellOutline(
        ORIGINAL_AGE_X,
        2,
        AGE
      )
    ]),
    ...fbox(
      [
        ['COMPARE A AND C', C.ink],
        ['A age = 14 years', AGE],
        ['C age = 14 years', AGE],
        ['Same building age', RESULT]
      ],
      AGE
    ),
    new M.Indicate(
      apartmentLabels[0],
      { color: AGE }
    ),
    new M.Indicate(
      apartmentLabels[2],
      { color: AGE }
    ),
    ...say('A AND C: SAME AGE', AGE)
  );

  // 23. Yet their old area counts are three and nine.
  await until(S(23));

  await play(
    ...mark([
      cellOutline(
        OLD_X,
        0,
        AREA
      ),
      cellOutline(
        OLD_X,
        2,
        AREA
      ),
      cellOutline(
        ORIGINAL_AGE_X,
        0,
        AGE
      ),
      cellOutline(
        ORIGINAL_AGE_X,
        2,
        AGE
      )
    ]),
    ...fbox(
      [
        ['COMPARE A AND C', C.ink],
        ['A: area 3, age 14', AREA],
        ['C: area 9, age 14', AREA],
        ['Different area, same age', WARN]
      ],
      WARN
    ),
    ...say('A AND C: DIFFERENT FLOOR AREAS', AREA)
  );

  // ------------------------------------------------------------
  // Can one fixed multiplier convert old area into age?
  //
  // A would require 14 / 3.
  // C would require 14 / 9.
  //
  // These multipliers are different.
  // ------------------------------------------------------------

  function failedMultiplierPicture() {
    const frame = panelFrame(WARN);

    const title = panelTitle(
      'CAN ONE MULTIPLIER WORK?',
      WARN
    );

    const leftX = PANEL_X - 1.69;
    const rightX = PANEL_X + 1.69;

    const topLabels = [
      textAt(
        'AREA',
        16,
        AREA,
        [
          leftX,
          PANEL_Y + 0.87,
          0
        ],
        true
      ),

      textAt(
        'AGE',
        16,
        AGE,
        [
          rightX,
          PANEL_Y + 0.87,
          0
        ],
        true
      )
    ];

    const indices = [0, 2];

    const rowGroups = indices.map((i, k) => {
      const d = DATA[i];

      const y = PANEL_Y
        + 0.32
        - k * 0.95;

      const label = textAt(
        d.id,
        17,
        C.ink,
        [
          PANEL_X - 2.43,
          y,
          0
        ],
        true
      );

      const oldValue = numberAt(
        d.area,
        leftX,
        y,
        AREA,
        25
      );

      const ageValue = numberAt(
        d.age,
        rightX,
        y,
        AGE,
        25
      );

      const arrow = arrowBetween(
        [
          leftX + 0.43,
          y,
          0
        ],
        [
          rightX - 0.43,
          y,
          0
        ],
        WARN,
        2.2
      );

      const multiplier = tagAt(
        `× (14 ÷ ${d.area})`,
        MULT,
        [
          PANEL_X,
          y,
          0
        ],
        15,
        2.14
      );

      return new M.VGroup(
        label,
        oldValue,
        arrow,
        multiplier,
        ageValue
      );
    });

    const mismatch = tagAt(
      '14 ÷ 3 ≠ 14 ÷ 9',
      WARN,
      [
        PANEL_X,
        PANEL_Y - 1.27,
        0
      ],
      18,
      PANEL_W - 0.50
    );

    return [
      frame,
      title,
      ...topLabels,
      ...rowGroups,
      mismatch
    ];
  }

  // 24. No single multiplier can send both those
  //     area counts to fourteen.
  await until(S(24));

  await play(
    ...replacePanel(
      failedMultiplierPicture(),
      1.55,
      0.16
    ),
    ...say('NO SINGLE AREA MULTIPLIER WORKS', WARN)
  );

  // ------------------------------------------------------------
  // Reverse the attempted rule.
  //
  // Both A and C have the same input age, 14.
  //
  // A fixed multiplier applied to the same input cannot
  // produce two different outputs, 3 and 9.
  // ------------------------------------------------------------

  function reverseMultiplierPicture() {
    const frame = panelFrame(WARN);

    const title = panelTitle(
      'TRY THE OTHER DIRECTION',
      WARN
    );

    const inputX = PANEL_X - 1.72;
    const outputX = PANEL_X + 1.65;

    const inputY = PANEL_Y;

    const outputAY = PANEL_Y + 0.62;
    const outputCY = PANEL_Y - 0.62;

    const inputFrame = rectAt(
      [
        inputX,
        inputY,
        0
      ],
      1.15,
      1.14,
      AGE,
      AGE,
      0.13
    );

    const inputLabel = textAt(
      'AGE',
      15,
      AGE,
      [
        inputX,
        inputY + 0.28,
        0
      ],
      true
    );

    const inputValue = numberAt(
      14,
      inputX,
      inputY - 0.12,
      AGE,
      28
    );

    const outA = rectAt(
      [
        outputX,
        outputAY,
        0
      ],
      1.30,
      0.80,
      AREA,
      AREA,
      0.13
    );

    const outC = rectAt(
      [
        outputX,
        outputCY,
        0
      ],
      1.30,
      0.80,
      AREA,
      AREA,
      0.13
    );

    const labelA = textAt(
      'A: 3',
      24,
      AREA,
      [
        outputX,
        outputAY,
        0
      ],
      true
    );

    const labelC = textAt(
      'C: 9',
      24,
      AREA,
      [
        outputX,
        outputCY,
        0
      ],
      true
    );

    const arrowA = arrowBetween(
      [
        inputX + 0.61,
        inputY + 0.15,
        0
      ],
      [
        outputX - 0.72,
        outputAY,
        0
      ],
      WARN,
      2.4
    );

    const arrowC = arrowBetween(
      [
        inputX + 0.61,
        inputY - 0.15,
        0
      ],
      [
        outputX - 0.72,
        outputCY,
        0
      ],
      WARN,
      2.4
    );

    const multiplierLabel = tagAt(
      'SAME × ?',
      MULT,
      [
        PANEL_X,
        PANEL_Y + 0.95,
        0
      ],
      15,
      2.10
    );

    const impossible = tagAt(
      'SAME INPUT, TWO DIFFERENT OUTPUTS',
      WARN,
      [
        PANEL_X,
        PANEL_Y - 1.28,
        0
      ],
      16,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      inputFrame,
      inputLabel,
      inputValue,
      arrowA,
      arrowC,
      outA,
      outC,
      labelA,
      labelC,
      multiplierLabel,
      impossible
    ];
  }

  // 25. The same age also cannot become two different
  //     area counts under one fixed multiplier.
  await until(S(25));

  await play(
    ...replacePanel(
      reverseMultiplierPicture(),
      1.75,
      0.12
    ),
    ...say('ONE FIXED RULE CANNOT GIVE TWO ANSWERS', WARN)
  );

  // 26. The two original columns therefore contain
  //     different information.
  await until(S(26));

  await play(
    ...mark([
      columnOutline(OLD_X, AREA),
      columnOutline(ORIGINAL_AGE_X, AGE)
    ]),
    ...fbox(
      [
        ['TWO DISTINCT ORIGINAL FEATURES', RESULT],
        ['Area cannot be rebuilt from age.', AREA],
        ['Age cannot be rebuilt from area.', AGE],
        ['These two columns are independent.', RESULT]
      ],
      RESULT
    ),
    ...say('AREA AND AGE GIVE DIFFERENT INFORMATION', RESULT)
  );

  // ============================================================
  // 27-28: Write the short rule and explain its usefulness
  // ============================================================

  // 27. The short rule here is new area equals two times
  //     old area plus zero times age.
  await until(S(27));

  // Use fresh objects for the previously removed new column.

  newHeader = makeNewHeader();
  newEntries = makeNewEntries();

  await play(
    ...clearMarks(),
    ...expandTable(),
    ...fbox(
      [
        ['THE SHORT RULE', MULT],
        ['New area = 2 × old area', AREA],
        ['         + 0 × age', AGE],
        ['(6, 12, 18)', RESULT]
      ],
      RESULT
    ),
    ...say('NEW AREA = 2 × OLD AREA + 0 × AGE', RESULT)
  );

  // 28. Check for linear dependence to spot information
  //     you already have before you score the listings.
  await until(S(28));

  await play(
    ...mark([
      columnOutline(NEW_X, WARN)
    ]),
    new M.Indicate(
      newHeader,
      { color: WARN }
    ),
    ...fbox(
      [
        ['CHECK FOR REPEATED INFORMATION', WARN],
        ['Before scoring the listings:', C.ink],
        ['Keep useful distinct features.', RESULT],
        ['Check for rebuildable columns.', MULT]
      ],
      WARN
    ),
    ...say('CHECK FOR DEPENDENCE BEFORE SCORING', WARN)
  );

  // ------------------------------------------------------------
  // Double-counting illustration
  //
  // Both area columns describe exactly the same floor space.
  // Giving each column its own scoring contribution can
  // unintentionally increase the influence of floor area.
  //
  // No new numerical scoring weights are introduced here.
  // ------------------------------------------------------------

  function doubleCountingPicture(
    emphasize = false
  ) {
    const frame = panelFrame(WARN);

    const title = panelTitle(
      'TWO CONTRIBUTIONS FROM ONE FEATURE',
      WARN
    );

    const featureY = PANEL_Y + 0.75;
    const scoreY = PANEL_Y - 0.55;

    const leftX = PANEL_X - 1.40;
    const rightX = PANEL_X + 1.40;

    const floorFrame = rectAt(
      [
        PANEL_X,
        featureY,
        0
      ],
      2.65,
      0.68,
      AREA,
      AREA,
      0.16
    );

    const floorLabel = textAt(
      'SAME FLOOR SPACE',
      18,
      AREA,
      [
        PANEL_X,
        featureY,
        0
      ],
      true,
      2.42
    );

    const leftArrow = arrowBetween(
      [
        PANEL_X - 0.64,
        featureY - 0.36,
        0
      ],
      [
        leftX,
        scoreY + 0.47,
        0
      ],
      AREA,
      2.6
    );

    const rightArrow = arrowBetween(
      [
        PANEL_X + 0.64,
        featureY - 0.36,
        0
      ],
      [
        rightX,
        scoreY + 0.47,
        0
      ],
      AREA,
      2.6
    );

    function contributionCard(
      x,
      label,
      detail
    ) {
      const r = rectAt(
        [
          x,
          scoreY,
          0
        ],
        P ? 2.42 : 2.30,
        0.83,
        emphasize ? WARN : AREA,
        C.card,
        0.97,
        emphasize ? 2.7 : 1.8
      );

      const heading = textAt(
        label,
        16,
        AREA,
        [
          x,
          scoreY + 0.18,
          0
        ],
        true,
        2.13
      );

      const sub = textAt(
        detail,
        15,
        C.ink,
        [
          x,
          scoreY - 0.16,
          0
        ],
        false,
        2.12
      );

      return new M.VGroup(
        r,
        heading,
        sub
      );
    }

    const oldContribution = contributionCard(
      leftX,
      'OLD AREA',
      'Scoring contribution'
    );

    const newContribution = contributionCard(
      rightX,
      'NEW AREA',
      'Scoring contribution'
    );

    const plus = textAt(
      '+',
      26,
      WARN,
      [
        PANEL_X,
        scoreY,
        0
      ],
      true
    );

    const footer = tagAt(
      emphasize
        ? 'FLOOR AREA IS COUNTED TWICE'
        : 'BOTH DESCRIBE FLOOR AREA',
      WARN,
      [
        PANEL_X,
        PANEL_Y - 1.30,
        0
      ],
      16,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      floorFrame,
      floorLabel,
      leftArrow,
      rightArrow,
      oldContribution,
      plus,
      newContribution,
      footer
    ];
  }

  // ============================================================
  // 29-30: Common trap — double-counting a feature
  // ============================================================

  // 29. Watch out if you give points to both versions
  //     of floor area.
  await until(S(29));

  await play(
    ...mark([
      columnOutline(OLD_X, WARN),
      columnOutline(NEW_X, WARN)
    ]),
    ...replacePanel(
      doubleCountingPicture(false),
      1.35,
      0.12
    ),
    ...say('WATCH OUT: POINTS FOR BOTH AREA COLUMNS', WARN)
  );

  // 30. You would be giving two contributions
  //     to the same feature.
  await until(S(30));

  await play(
    ...replacePanel(
      doubleCountingPicture(true),
      1.25,
      0.09
    ),
    new M.LaggedStart(
      [
        new M.Indicate(
          oldHeader,
          { color: WARN }
        ),
        new M.Indicate(
          newHeader,
          { color: WARN }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 1.4
      }
    ),
    ...say('TWO CONTRIBUTIONS TO THE SAME FEATURE', WARN)
  );

  // ------------------------------------------------------------
  // Try it preview
  //
  // Visual cue for changing an original area count and
  // rebuilding the corresponding new area count.
  //
  // Shared chapter data remain unchanged during narration.
  // The actual editable values belong to the separate exercise.
  // ------------------------------------------------------------

  function tryAreaPicture() {
    const frame = panelFrame(RESULT);

    const title = panelTitle(
      'TRY IT: MATCH THE NEW AREA',
      RESULT
    );

    const y = PANEL_Y + 0.05;

    const leftX = PANEL_X - 1.55;
    const rightX = PANEL_X + 1.55;

    const leftFrame = rectAt(
      [
        leftX,
        y,
        0
      ],
      1.78,
      1.12,
      AREA,
      C.card,
      0.97
    );

    const rightFrame = rectAt(
      [
        rightX,
        y,
        0
      ],
      1.78,
      1.12,
      NEW,
      C.card,
      0.97
    );

    const leftLabel = textAt(
      'OLD AREA',
      15,
      AREA,
      [
        leftX,
        y + 0.32,
        0
      ],
      true,
      1.62
    );

    const rightLabel = textAt(
      'NEW AREA',
      15,
      NEW,
      [
        rightX,
        y + 0.32,
        0
      ],
      true,
      1.62
    );

    const oldValue = numberAt(
      6,
      leftX,
      y - 0.12,
      AREA,
      31
    );

    const newValue = textAt(
      '?',
      31,
      RESULT,
      [
        rightX,
        y - 0.12,
        0
      ],
      true
    );

    const arrow = arrowBetween(
      [
        leftX + 0.94,
        y,
        0
      ],
      [
        rightX - 0.94,
        y,
        0
      ],
      MULT,
      2.7
    );

    const multiplier = tagAt(
      '× 2',
      MULT,
      [
        PANEL_X,
        y,
        0
      ],
      16,
      1.00
    );

    const apartmentLabel = tagAt(
      'APARTMENT B',
      AREA,
      [
        PANEL_X,
        PANEL_Y + 0.80,
        0
      ],
      16
    );

    const footer = textAt(
      'Change the old count. Rebuild the new one.',
      17,
      C.muted,
      [
        PANEL_X,
        PANEL_Y - 1.25,
        0
      ],
      false,
      PANEL_W - 0.45
    );

    return [
      frame,
      title,
      leftFrame,
      rightFrame,
      leftLabel,
      rightLabel,
      oldValue,
      newValue,
      arrow,
      multiplier,
      apartmentLabel,
      footer
    ];
  }

  // ============================================================
  // 31-33: Visual prompts for Try it
  // ============================================================

  // 31. In Try it, change an old area count
  //     and match the new area count to it.
  await until(S(31));

  await play(
    ...mark([
      cellOutline(
        OLD_X,
        1,
        AREA
      ),
      cellOutline(
        NEW_X,
        1,
        RESULT
      )
    ]),
    ...replacePanel(
      tryAreaPicture(),
      1.40,
      0.10
    ),
    ...say('TRY IT: CHANGE OLD AREA, MATCH NEW AREA', RESULT)
  );

  // 32. Then try to find one multiplier that turns both
  //     A's and C's area counts into their ages.
  await until(S(32));

  await play(
    ...mark([
      cellOutline(
        OLD_X,
        0,
        AREA
      ),
      cellOutline(
        OLD_X,
        2,
        AREA
      ),
      cellOutline(
        EXPANDED_AGE_X,
        0,
        AGE
      ),
      cellOutline(
        EXPANDED_AGE_X,
        2,
        AGE
      )
    ]),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['A: 3 × ? = 14', AREA],
        ['C: 9 × ? = 14', AREA],
        ['Can the same multiplier work?', WARN]
      ],
      MULT
    ),
    ...say('TRY IT: FIND ONE MULTIPLIER', MULT)
  );

  // 33. Tap New data to see the two chunk sizes
  //     on fresh listings.
  await until(S(33));

  await play(
    ...clearMarks(),
    new M.Indicate(
      oldHeader,
      { color: AREA }
    ),
    new M.Indicate(
      newHeader,
      { color: NEW }
    ),
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Tap New data', C.ink],
        ['Old unit: 10 m²', AREA],
        ['New unit:  5 m²', AREA],
        ['Compare the fresh columns.', MULT]
      ],
      RESULT
    ),
    ...say('NEW DATA: CHECK THE TWO CHUNK SIZES', RESULT)
  );

  // ============================================================
  // 34: Final takeaway
  // ============================================================

  // 34. Linear dependence means one column can be rebuilt
  //     by multiplying other columns by fixed numbers and adding.
  await until(S(34));

  await play(
    ...mark([
      columnOutline(
        OLD_X,
        AREA
      ),
      columnOutline(
        NEW_X,
        RESULT
      )
    ]),

    new M.LaggedStart(
      [
        new M.Indicate(
          oldEntries[0],
          { color: AREA }
        ),
        new M.Indicate(
          newEntries[0],
          { color: RESULT }
        ),
        new M.Indicate(
          oldEntries[1],
          { color: AREA }
        ),
        new M.Indicate(
          newEntries[1],
          { color: RESULT }
        ),
        new M.Indicate(
          oldEntries[2],
          { color: AREA }
        ),
        new M.Indicate(
          newEntries[2],
          { color: RESULT }
        )
      ],
      {
        lagRatio: 0.22,
        runTime: 2.5
      }
    ),

    ...fbox(
      [
        ['LINEAR DEPENDENCE', MULT],
        ['Rebuild one column from others.', C.ink],
        ['Multiply by fixed numbers.', MULT],
        ['Add matching rows.', RESULT],
        ['New area = 2 × old area', AREA],
        ['         + 0 × age', AGE]
      ],
      RESULT
    ),

    ...say('LINEAR DEPENDENCE: MULTIPLY, ADD, REBUILD', RESULT)
  );
}
