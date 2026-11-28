// lesson 9.1.8
// Eigenvectors and eigenvalues: discover directions preserved by a transformation.
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
  // Centered apartment vectors:
  // A = (-3, 4)
  // B = (0, -8)
  // C = (3, 4)
  //
  // Demonstration transformation:
  //
  //       [ 2  1 ]
  //   H = [ 1  2 ]
  //
  // Test vectors:
  //
  // u = (1,  1) -> (3,  3), eigenvalue 3
  // v = (1, -1) -> (1, -1), eigenvalue 1
  // w = (1,  0) -> (2,  1), not an eigenvector
  //
  // The transformation is a demonstration rule, not a
  // physical change to apartment measurements.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const MEAN_AREA = 6;
  const MEAN_AGE = 10;

  const CENTERED = DATA.map(d => ({
    id: d.id,
    x: d.area - MEAN_AREA,
    y: d.age - MEAN_AGE
  }));

  const H = [
    [2, 1],
    [1, 2]
  ];

  const U = [1, 1];
  const V = [1, -1];
  const W = [1, 0];

  function applyMatrix(v) {
    return [
      H[0][0] * v[0] + H[0][1] * v[1],
      H[1][0] * v[0] + H[1][1] * v[1]
    ];
  }

  const HU = applyMatrix(U);
  const HV = applyMatrix(V);
  const HW = applyMatrix(W);

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';

  const UP = C.green;
  const DOWN = C.violet;
  const RIGHT = C.amber;

  const RULE = C.violet;
  const RESULT = C.green;
  const WARN = C.amber;

  const GRID = '#293548';
  const SHEET = '#52647D';

  const signed = n =>
    n < 0 ? `−${Math.abs(n)}` : String(n);

  const pair = v =>
    `(${signed(v[0])}, ${signed(v[1])})`;

  const dollars = n =>
    '$' + String(n).replace(
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
  //   Grid on the left.
  //   Listing cards, matrix and formula box on the right.
  //
  // Phone:
  //   Grid above.
  //   Listing cards, matrix and formula box below.
  //
  // All coordinate grids use identical horizontal and
  // vertical unit lengths.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.55;
  const CY = P ? 1.05 : -0.38;

  const STEP = P ? 0.59 : 0.50;

  const LIMIT = 4;

  const PANEL_X = P ? 0 : 3.45;

  const PILL = P
    ? [0, 4.03, 0]
    : [0, 2.03, 0];

  const BOXP = P
    ? [0, -4.68, 0]
    : [PANEL_X, -1.67, 0];

  const BOX_MAX = P
    ? FW - 1.05
    : 6.10;

  const MATRIX_X = PANEL_X;
  const MATRIX_Y = P ? -3.28 : 0.24;

  const CARD_Y = P ? -2.10 : 1.37;

  const xy = (x, y) => [
    CX + x * STEP,
    CY + y * STEP,
    0
  ];

  const ZERO = xy(0, 0);

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

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
    color = WARN
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2.3
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

  function dotAt(
    p,
    color,
    radius = 0.075
  ) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return d;
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

  function indicateAll(
    objects,
    color
  ) {
    return objects.map(
      o => new M.Indicate(o, { color })
    );
  }

  // ------------------------------------------------------------
  // Coordinate-based arrows
  //
  // Construct each arrow from a shaft and two arrowhead lines.
  // All components are grouped before appearing on screen.
  // This keeps the implementation independent of specialized
  // arrow constructors.
  // ------------------------------------------------------------

  function arrowBetween(
    start,
    end,
    color,
    strokeWidth = 4,
    headLength = 0.17
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const length = Math.hypot(dx, dy);

    if (length < 0.00001) {
      return new M.VGroup(
        dotAt(start, color, 0.075)
      );
    }

    const ux = dx / length;
    const uy = dy / length;

    const hl = Math.min(
      headLength,
      length * 0.38
    );

    const hx = end[0] - ux * hl;
    const hy = end[1] - uy * hl;

    const hw = hl * 0.48;

    const left = [
      hx - uy * hw,
      hy + ux * hw,
      0
    ];

    const right = [
      hx + uy * hw,
      hy - ux * hw,
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

  function gridArrow(
    x0,
    y0,
    x1,
    y1,
    color,
    strokeWidth = 4,
    headLength = 0.17
  ) {
    return arrowBetween(
      xy(x0, y0),
      xy(x1, y1),
      color,
      strokeWidth,
      headLength
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // One box at a time. The formula follows the visual
  // demonstration rather than replacing it.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 19 : 21;
    const lh = P ? 0.34 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(s, size, c, true);

      if (t.getWidth() > BOX_MAX - 0.58) {
        t.scale(
          (BOX_MAX - 0.58) / t.getWidth()
        );
      }

      return t;
    });

    const wd = Math.min(
      BOX_MAX,
      Math.max(
        ...texts.map(t => t.getWidth())
      ) + 0.58
    );

    const ht = rows.length * lh + 0.26;

    const frame = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.29;

    const top = BOXP[1]
      + ht / 2
      - 0.13
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

    const animations = [
      new M.FadeIn(group)
    ];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = group;

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
  // Compact apartment cards
  //
  // Keep all three original listings visible.
  // Rent stays on each listing card and is not part of the
  // two-dimensional demonstration transformation.
  // ------------------------------------------------------------

  const CARD_W = P ? 2.12 : 1.79;
  const CARD_H = 0.65;
  const CARD_GAP = P ? 0.15 : 0.14;

  function listingCard(d, i) {
    const x = PANEL_X
      + (i - 1) * (CARD_W + CARD_GAP);

    const frame = rectAt(
      [x, CARD_Y, 0],
      CARD_W,
      CARD_H,
      C.muted,
      C.card,
      0.95,
      1.5
    );

    const id = textAt(
      d.id,
      19,
      C.ink,
      [
        x - CARD_W * 0.32,
        CARD_Y + 0.14,
        0
      ],
      true
    );

    const rent = textAt(
      dollars(d.rent),
      14,
      C.amber,
      [
        x + CARD_W * 0.13,
        CARD_Y + 0.14,
        0
      ],
      true,
      CARD_W * 0.52
    );

    const area = textAt(
      `${d.area} chunks`,
      P ? 15 : 13,
      AREA,
      [
        x - CARD_W * 0.23,
        CARD_Y - 0.14,
        0
      ],
      true,
      CARD_W * 0.43
    );

    const age = textAt(
      `${d.age} yr`,
      P ? 15 : 13,
      AGE,
      [
        x + CARD_W * 0.25,
        CARD_Y - 0.14,
        0
      ],
      true,
      CARD_W * 0.38
    );

    return new M.VGroup(
      frame,
      id,
      rent,
      area,
      age
    );
  }

  const listingCards = DATA.map(
    listingCard
  );

  // ------------------------------------------------------------
  // Opening apartment map
  //
  // Use the full centered range first, so the original
  // apartment points remain at their correct positions.
  //
  // Then zoom into the neighborhood around zero for the
  // test-arrow demonstration.
  // ------------------------------------------------------------

  const MAP_STEP = P ? 0.27 : 0.25;

  const MAP_CX = CX;
  const MAP_CY = P ? 1.32 : 0.40;

  const mapXY = (x, y) => [
    MAP_CX + x * MAP_STEP,
    MAP_CY + y * MAP_STEP,
    0
  ];

  const MAP_ZERO = mapXY(0, 0);

  const MAP_XMIN = -6;
  const MAP_XMAX = 6;
  const MAP_YMIN = -9;
  const MAP_YMAX = 6;

  const mapLines = [];

  for (
    let x = MAP_XMIN;
    x <= MAP_XMAX;
    x++
  ) {
    if (x === 0) continue;

    mapLines.push(
      lineBetween(
        mapXY(x, MAP_YMIN),
        mapXY(x, MAP_YMAX),
        GRID,
        1
      )
    );
  }

  for (
    let y = MAP_YMIN;
    y <= MAP_YMAX;
    y++
  ) {
    if (y === 0) continue;

    mapLines.push(
      lineBetween(
        mapXY(MAP_XMIN, y),
        mapXY(MAP_XMAX, y),
        GRID,
        1
      )
    );
  }

  const mapGrid = new M.VGroup(
    ...mapLines
  );

  const mapXAxis = lineBetween(
    mapXY(MAP_XMIN, 0),
    mapXY(MAP_XMAX, 0),
    AREA,
    2.5
  );

  const mapYAxis = lineBetween(
    mapXY(0, MAP_YMIN),
    mapXY(0, MAP_YMAX),
    AGE,
    2.5
  );

  const mapBoundary = outline(
    [
      MAP_CX,
      (
        mapXY(0, MAP_YMAX)[1]
        + mapXY(0, MAP_YMIN)[1]
      ) / 2,
      0
    ],
    (MAP_XMAX - MAP_XMIN) * MAP_STEP + 0.10,
    (MAP_YMAX - MAP_YMIN) * MAP_STEP + 0.10,
    SHEET
  );

  function apartmentPoint(d) {
    const p = mapXY(d.x, d.y);

    const halo = new M.Dot({
      point: p,
      radius: 0.14,
      color: AREA
    });

    halo.setFill(AREA, 0.19);

    const dot = dotAt(
      p,
      C.ink,
      0.075
    );

    const label = tagAt(
      d.id,
      AREA,
      [
        p[0] + (
          d.id === 'A'
            ? -0.22
            : 0.23
        ),
        p[1] + 0.25,
        0
      ],
      P ? 16 : 15
    );

    return new M.VGroup(
      halo,
      dot,
      label
    );
  }

  const apartmentPoints = CENTERED.map(
    apartmentPoint
  );

  const mapAreaTitle = textAt(
    'Area difference',
    16,
    AREA,
    [
      MAP_CX,
      mapXY(0, MAP_YMIN)[1] - 0.34,
      0
    ],
    false,
    3.50
  );

  const mapAgeTitle = textAt(
    'Age difference',
    16,
    AGE,
    [
      MAP_CX - 0.92,
      mapXY(0, MAP_YMAX)[1] + 0.19,
      0
    ],
    false,
    2.15
  );

  const mapOrigin = dotAt(
    MAP_ZERO,
    RESULT,
    0.085
  );

  const mapZeroLabel = tagAt(
    'MEAN = ZERO',
    RESULT,
    [
      MAP_ZERO[0] + 0.72,
      MAP_ZERO[1] - 0.23,
      0
    ],
    14,
    1.62
  );

  const mapParts = [
    mapGrid,
    mapBoundary,
    mapXAxis,
    mapYAxis,
    mapAreaTitle,
    mapAgeTitle,
    ...apartmentPoints,
    mapOrigin,
    mapZeroLabel
  ];

  // ------------------------------------------------------------
  // Enlarged local coordinate grid
  //
  // The enlarged grid uses the same scale in both directions.
  // Only the view changes; the centered origin remains zero.
  //
  // The apartment listing cards stay visible during the zoom.
  // ------------------------------------------------------------

  const gridLines = [];

  for (
    let x = -LIMIT;
    x <= LIMIT;
    x++
  ) {
    if (x === 0) continue;

    gridLines.push(
      lineBetween(
        xy(x, -LIMIT),
        xy(x, LIMIT),
        GRID,
        1
      )
    );
  }

  for (
    let y = -LIMIT;
    y <= LIMIT;
    y++
  ) {
    if (y === 0) continue;

    gridLines.push(
      lineBetween(
        xy(-LIMIT, y),
        xy(LIMIT, y),
        GRID,
        1
      )
    );
  }

  const localGrid = new M.VGroup(
    ...gridLines
  );

  const xAxis = lineBetween(
    xy(-LIMIT, 0),
    xy(LIMIT, 0),
    AREA,
    2.5
  );

  const yAxis = lineBetween(
    xy(0, -LIMIT),
    xy(0, LIMIT),
    AGE,
    2.5
  );

  const ticks = [];

  for (
    let x = -LIMIT;
    x <= LIMIT;
    x++
  ) {
    if (x === 0) continue;

    const p = xy(x, 0);

    ticks.push(
      lineBetween(
        [p[0], p[1] - 0.055, 0],
        [p[0], p[1] + 0.055, 0],
        AREA,
        1.3
      )
    );

    ticks.push(
      textAt(
        signed(x),
        P ? 13 : 12,
        AREA,
        [
          p[0],
          p[1] - 0.17,
          0
        ],
        true
      )
    );
  }

  for (
    let y = -LIMIT;
    y <= LIMIT;
    y++
  ) {
    if (y === 0) continue;

    const p = xy(0, y);

    ticks.push(
      lineBetween(
        [p[0] - 0.055, p[1], 0],
        [p[0] + 0.055, p[1], 0],
        AGE,
        1.3
      )
    );

    ticks.push(
      textAt(
        signed(y),
        P ? 13 : 12,
        AGE,
        [
          p[0] - 0.18,
          p[1],
          0
        ],
        true
      )
    );
  }

  const localTicks = new M.VGroup(
    ...ticks
  );

  const areaTitle = textAt(
    'Area direction',
    P ? 17 : 16,
    AREA,
    [
      CX,
      xy(0, -LIMIT)[1] - 0.26,
      0
    ],
    false,
    4.25
  );

  const ageTitle = textAt(
    'Age direction',
    P ? 17 : 16,
    AGE,
    [
      CX - 1.20,
      xy(0, LIMIT)[1] + 0.16,
      0
    ],
    false,
    2.20
  );

  const originHalo = new M.Dot({
    point: ZERO,
    radius: 0.135,
    color: RESULT
  });

  originHalo.setFill(RESULT, 0.17);

  const originDot = dotAt(
    ZERO,
    RESULT,
    0.065
  );

  const originLabel = textAt(
    '0',
    15,
    RESULT,
    [
      ZERO[0] - 0.13,
      ZERO[1] - 0.19,
      0
    ],
    true
  );

  const localOrigin = new M.VGroup(
    originHalo,
    originDot,
    originLabel
  );

  const localGridParts = [
    localGrid,
    xAxis,
    yAxis,
    localTicks,
    areaTitle,
    ageTitle,
    localOrigin
  ];

  // ------------------------------------------------------------
  // Test arrows
  //
  // u: diagonally up and right.
  // v: diagonally down and right.
  // w: straight right.
  //
  // Arrow tails always remain at the centered origin.
  // ------------------------------------------------------------

  function vectorPicture(
    vector,
    color,
    name,
    offset = [0.18, 0.20]
  ) {
    const p = xy(
      vector[0],
      vector[1]
    );

    const arrow = arrowBetween(
      ZERO,
      p,
      color,
      4.4,
      P ? 0.18 : 0.15
    );

    const tip = dotAt(
      p,
      color,
      0.055
    );

    const label = textAt(
      name,
      P ? 19 : 18,
      color,
      [
        p[0] + offset[0],
        p[1] + offset[1],
        0
      ],
      true
    );

    return new M.VGroup(
      arrow,
      tip,
      label
    );
  }

  const INPUT_OFFSETS = {
    u: [-0.22, 0.27],
    v: [0.36, 0.10],
    w: [0.30, 0.24]
  };

  const OUTPUT_OFFSETS = {
    u: [-0.62, 0.22],
    v: [0.62, 0.10],
    w: [0.62, 0.10]
  };

  const uArrow = vectorPicture(
    U,
    UP,
    'u',
    INPUT_OFFSETS.u
  );

  const vArrow = vectorPicture(
    V,
    DOWN,
    'v',
    INPUT_OFFSETS.v
  );

  const wArrow = vectorPicture(
    W,
    RIGHT,
    'w',
    INPUT_OFFSETS.w
  );

  let activeArrows = [];

  function replaceArrows(
    next,
    duration = 0.95
  ) {
    const animations = fadeAll(
      activeArrows
    );

    if (next.length) {
      animations.push(
        reveal(
          next,
          duration,
          0.16
        )
      );
    }

    activeArrows = next.slice();

    return animations;
  }

  function inputPicture(
    name,
    vector,
    color
  ) {
    return vectorPicture(
      vector,
      color,
      name,
      INPUT_OFFSETS[name]
    );
  }

  function outputPicture(
    name,
    vector,
    color
  ) {
    return vectorPicture(
      vector,
      color,
      `new ${name}`,
      OUTPUT_OFFSETS[name]
    );
  }

  // ------------------------------------------------------------
  // Original supporting lines
  //
  // Extend each starting direction through zero.
  // These faint lines remain fixed while arrows transform.
  // ------------------------------------------------------------

  const upLine = new M.DashedLine({
    start: xy(-LIMIT, -LIMIT),
    end: xy(LIMIT, LIMIT),
    color: UP,
    strokeWidth: 1.6
  });

  const downLine = new M.DashedLine({
    start: xy(-LIMIT, LIMIT),
    end: xy(LIMIT, -LIMIT),
    color: DOWN,
    strokeWidth: 1.6
  });

  const rightLine = new M.DashedLine({
    start: xy(-LIMIT, 0),
    end: xy(LIMIT, 0),
    color: RIGHT,
    strokeWidth: 1.8
  });

  // ------------------------------------------------------------
  // Stretchy-sheet patch
  //
  // A small square mesh centered at zero is transformed by H.
  //
  // Original corners:
  //   (-1,-1), (1,-1), (1,1), (-1,1)
  //
  // Transformed corners:
  //   (-3,-3), (1,-1), (3,3), (-1,1)
  //
  // Every mesh point follows the same matrix rule as the
  // test arrows.
  //
  // The full reference grid remains fixed, so changes in
  // the arrows' coordinates are easy to see.
  // ------------------------------------------------------------

  function sheetPatch(
    transformed = false
  ) {
    const parts = [];

    const convert = (x, y) => {
      const q = transformed
        ? applyMatrix([x, y])
        : [x, y];

      return xy(q[0], q[1]);
    };

    const steps = [
      -1,
      -0.5,
      0,
      0.5,
      1
    ];

    steps.forEach(k => {
      const isEdge = Math.abs(k) === 1;

      parts.push(
        lineBetween(
          convert(k, -1),
          convert(k, 1),
          isEdge ? SHEET : GRID,
          isEdge ? 2.1 : 1.25
        )
      );

      parts.push(
        lineBetween(
          convert(-1, k),
          convert(1, k),
          isEdge ? SHEET : GRID,
          isEdge ? 2.1 : 1.25
        )
      );
    });

    return new M.VGroup(
      ...parts
    );
  }

  const stretchySheet = sheetPatch(
    false
  );

  // ------------------------------------------------------------
  // Original arrow-tip markers
  //
  // The original positions remain visible as small rings
  // while the transformed tips move.
  // ------------------------------------------------------------

  function oldTip(
    vector,
    color
  ) {
    const ring = new M.Circle({
      radius: 0.105,
      color,
      strokeWidth: 2
    });

    ring.setFill(color, 0);
    ring.moveTo(
      xy(vector[0], vector[1])
    );

    return ring;
  }

  const originalUTip = oldTip(U, UP);
  const originalVTip = oldTip(V, DOWN);
  const originalWTip = oldTip(W, RIGHT);

  const originalTips = [
    originalUTip,
    originalVTip,
    originalWTip
  ];

  // ============================================================
  // 0-2: Imagine the apartment grid on a stretchy sheet
  // ============================================================

  // 0. Imagine the apartment grid is printed on a stretchy sheet.
  await until(S(0));

  await play(
    new M.FadeIn(mapGrid),
    new M.Create(mapBoundary),
    new M.Create(mapXAxis),
    new M.Create(mapYAxis),
    reveal(
      apartmentPoints,
      1.10,
      0.20
    ),
    new M.FadeIn(mapAreaTitle),
    new M.FadeIn(mapAgeTitle),
    ...say('IMAGINE A STRETCHY GRID')
  );

  // 1. Which arrows still point along their original line
  //    when we stretch the sheet?
  await until(S(1));

  await play(
    new M.Indicate(
      mapBoundary,
      { color: RULE }
    ),
    ...fbox(
      [
        ['STRETCH THE GRID', RULE],
        ['Which arrow lines stay the same?', C.ink]
      ],
      RULE
    ),
    ...say('WHICH DIRECTIONS STAY THE SAME?', RULE)
  );

  // 2. Put the zero marks back at the average area and age.
  await until(S(2));

  await play(
    new M.FadeIn(mapOrigin),
    new M.FadeIn(mapZeroLabel),
    ...fbox(
      [
        ['CENTERED ORIGIN', RESULT],
        ['Mean area = 6 chunks', AREA],
        ['Mean age = 10 years', AGE]
      ],
      RESULT
    ),
    ...say('ZERO = AVERAGE AREA AND AGE', RESULT)
  );

  // ============================================================
  // 3-6: Introduce the three test arrows
  // ============================================================

  // 3. Draw three test arrows from that starting point.
  await until(S(3));

  await play(
    ...fadeAll(mapParts),
    ...localGridParts.map(
      o => new M.FadeIn(o)
    ),
    ...replaceArrows(
      [uArrow, vArrow, wArrow],
      1.3
    ),
    ...clearBox(),
    ...say('THREE TEST ARROWS FROM ZERO')
  );

  // 4. One points diagonally up and right by one step each.
  await until(S(4));

  await play(
    new M.Indicate(
      uArrow,
      { color: UP }
    ),
    ...fbox(
      [
        ['FIRST TEST ARROW', UP],
        ['1 right, 1 up', C.ink],
        ['u = (1, 1)', UP]
      ],
      UP
    ),
    ...say('UP AND RIGHT: (1, 1)', UP)
  );

  // 5. One points diagonally down and right by one step each.
  await until(S(5));

  await play(
    new M.Indicate(
      vArrow,
      { color: DOWN }
    ),
    ...fbox(
      [
        ['SECOND TEST ARROW', DOWN],
        ['1 right, 1 down', C.ink],
        ['v = (1, −1)', DOWN]
      ],
      DOWN
    ),
    ...say('DOWN AND RIGHT: (1, −1)', DOWN)
  );

  // 6. One goes a single step straight right.
  await until(S(6));

  await play(
    new M.Indicate(
      wArrow,
      { color: RIGHT }
    ),
    ...fbox(
      [
        ['THIRD TEST ARROW', RIGHT],
        ['1 right, 0 up', C.ink],
        ['w = (1, 0)', RIGHT]
      ],
      RIGHT
    ),
    ...say('STRAIGHT RIGHT: (1, 0)', RIGHT)
  );

  // ============================================================
  // 7-10: Transform the arrows and observe their directions
  // ============================================================

  // 7. Now imagine a rule that sends every arrow to a new arrow.
  await until(S(7));

  await play(
    new M.FadeIn(stretchySheet),
    new M.Create(upLine),
    new M.Create(downLine),
    new M.Create(rightLine),
    ...fbox(
      [
        ['ONE RULE FOR EVERY ARROW', RULE],
        ['Input arrow → output arrow', C.ink],
        ['Every tail stays at zero.', RESULT]
      ],
      RULE
    ),
    ...say('ONE RULE CHANGES EVERY ARROW', RULE)
  );

  // 8. Watch the tip of each arrow move while its tail stays at zero.
  await until(S(8));

  await play(
    reveal(
      originalTips,
      0.65,
      0.10
    ),

    new M.Transform(
      stretchySheet,
      sheetPatch(true),
      { runTime: 2.0 }
    ),

    new M.Transform(
      uArrow,
      outputPicture('u', HU, UP),
      { runTime: 2.0 }
    ),

    new M.Transform(
      vArrow,
      outputPicture('v', HV, DOWN),
      { runTime: 2.0 }
    ),

    new M.Transform(
      wArrow,
      outputPicture('w', HW, RIGHT),
      { runTime: 2.0 }
    ),

    ...say('THE TIPS CHANGE, ZERO STAYS FIXED', RULE)
  );

  // 9. Notice how both diagonal arrows stay on the lines
  //    where they began.
  await until(S(9));

  await play(
    new M.FadeOut(stretchySheet),
    ...fadeAll(originalTips),

    new M.LaggedStart(
      [
        new M.Indicate(
          uArrow,
          { color: UP }
        ),
        new M.Indicate(
          vArrow,
          { color: DOWN }
        )
      ],
      {
        lagRatio: 0.40,
        runTime: 1.65
      }
    ),

    ...fbox(
      [
        ['TWO SPECIAL DIRECTIONS', RESULT],
        ['Up-right: same line', UP],
        ['Down-right: same line', DOWN]
      ],
      RESULT
    ),

    ...say('BOTH DIAGONALS KEEP THEIR LINES', RESULT)
  );

  // 10. A rule that turns every input arrow into an output
  //     arrow is called a transformation.
  await until(S(10));

  await play(
    ...fbox(
      [
        ['TRANSFORMATION', RULE],
        ['Input arrow → output arrow', C.ink],
        ['The same rule acts on every input.', C.ink]
      ],
      RULE
    ),
    ...say('TRANSFORMATION = INPUT TO OUTPUT', RULE)
  );

  // ------------------------------------------------------------
  // Transformation matrix
  //
  //       [ 2  1 ]
  //   H = [ 1  2 ]
  //
  // First row computes the output's horizontal coordinate.
  // Second row computes the output's vertical coordinate.
  //
  // Cyan entries belong to the old horizontal coordinate.
  // Pink entries belong to the old vertical coordinate.
  // ------------------------------------------------------------

  const MATRIX_PITCH = P ? 0.88 : 0.94;
  const MATRIX_ROW_GAP = P ? 0.49 : 0.56;

  const MX1 = MATRIX_X - MATRIX_PITCH / 2;
  const MX2 = MATRIX_X + MATRIX_PITCH / 2;

  const MY1 = MATRIX_Y + MATRIX_ROW_GAP / 2;
  const MY2 = MATRIX_Y - MATRIX_ROW_GAP / 2;

  const ML = MX1 - 0.42;
  const MR = MX2 + 0.42;

  const MT = MY1 + 0.24;
  const MB = MY2 - 0.24;

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

  const matrixTitle = textAt(
    'TRANSFORMATION RULE',
    P ? 16 : 18,
    RULE,
    [
      MATRIX_X,
      MT + 0.24,
      0
    ],
    true,
    4.70
  );

  const matrixName = textAt(
    ' ',
    25,
    C.ink,
    [
      ML - 0.47,
      MATRIX_Y,
      0
    ],
    true
  );

  const matrixBracket = matrixBrackets(
    ML,
    MR,
    MT,
    MB,
    RULE
  );

  const matrixEntries = [
    textAt(
      '2',
      27,
      AREA,
      [MX1, MY1, 0],
      true
    ),

    textAt(
      '1',
      27,
      AGE,
      [MX2, MY1, 0],
      true
    ),

    textAt(
      '1',
      27,
      AREA,
      [MX1, MY2, 0],
      true
    ),

    textAt(
      '2',
      27,
      AGE,
      [MX2, MY2, 0],
      true
    )
  ];

  const matrixDim = tagAt(
    '2 × 2',
    RULE,
    [
      MR + 0.70,
      MATRIX_Y,
      0
    ],
    15,
    1.15
  );

  const row1Label = textAt(
    'new x',
    P ? 15 : 14,
    AREA,
    [
      MR + 0.55,
      MY1,
      0
    ],
    true,
    0.95
  );

  const row2Label = textAt(
    'new y',
    P ? 15 : 14,
    AGE,
    [
      MR + 0.55,
      MY2,
      0
    ],
    true,
    0.95
  );

  function matrixRowOutline(
    row,
    color
  ) {
    return outline(
      [
        MATRIX_X,
        row === 0 ? MY1 : MY2,
        0
      ],
      MR - ML - 0.10,
      MATRIX_ROW_GAP * 0.85,
      color
    );
  }

  let matrixSpot = null;

  function markMatrixRow(
    row,
    color
  ) {
    const next = matrixRowOutline(
      row,
      color
    );

    if (!matrixSpot) {
      matrixSpot = next;

      return [
        new M.Create(matrixSpot)
      ];
    }

    return [
      new M.Transform(
        matrixSpot,
        next
      )
    ];
  }

  function clearMatrixMark() {
    if (!matrixSpot) return [];

    const old = matrixSpot;
    matrixSpot = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ============================================================
  // 11-14: Write the transformation as a square matrix
  // ============================================================

  // 11. Write the rule in a matrix, a rectangular table of numbers.
  await until(S(11));

  await play(
    new M.FadeIn(matrixTitle),
    new M.FadeIn(matrixName),
    new M.Create(matrixBracket),
    ...fbox(
      [
        ['WRITE THE RULE AS A MATRIX', RULE],
        ['A rectangular table of numbers.', C.ink]
      ],
      RULE
    ),
    ...say('A MATRIX DESCRIBES THE RULE', RULE)
  );

  // 12. It is square because it has two rows and two columns.
  await until(S(12));

  const matrixShapeOutline = outline(
    [
      MATRIX_X,
      MATRIX_Y,
      0
    ],
    MR - ML + 0.13,
    MT - MB + 0.13,
    RULE
  );

  await play(
    new M.FadeIn(matrixDim),
    new M.Create(matrixShapeOutline),
    ...fbox(
      [
        ['SQUARE MATRIX', RULE],
        ['2 rows, 2 columns', C.ink],
        ['Same number of rows and columns.', RESULT]
      ],
      RULE
    ),
    ...say('SQUARE MATRIX: 2 × 2', RULE)
  );

  // 13. The first row reads two, then one.
  await until(S(13));

  await play(
    new M.FadeOut(matrixShapeOutline),
    reveal(
      matrixEntries.slice(0, 2),
      0.95,
      0.25
    ),
    ...markMatrixRow(0, AREA),
    ...say('FIRST ROW: 2, 1', AREA)
  );

  // 14. The second row reads one, then two.
  await until(S(14));

  await play(
    reveal(
      matrixEntries.slice(2, 4),
      0.95,
      0.25
    ),
    ...markMatrixRow(1, AGE),
    ...say('SECOND ROW: 1, 2', AGE)
  );

  // ------------------------------------------------------------
  // Component demonstration
  //
  // For a generic input (x, y):
  //
  // New x = 2x + y
  // New y = x + 2y
  //
  // Use the grid arrows to illustrate the two independent
  // input components.
  // ------------------------------------------------------------

  const exampleX = gridArrow(
    0, 0,
    1, 0,
    AREA,
    4.0,
    0.12
  );

  const exampleY = gridArrow(
    1, 0,
    1, 1,
    AGE,
    4.0,
    0.12
  );

  const exampleXLabel = tagAt(
    'x',
    AREA,
    [
      xy(0.5, 0)[0],
      xy(0.5, 0)[1] - 0.30,
      0
    ],
    15
  );

  const exampleYLabel = tagAt(
    'y',
    AGE,
    [
      xy(1, 0.5)[0] + 0.24,
      xy(1, 0.5)[1],
      0
    ],
    15
  );

  const componentParts = [
    exampleX,
    exampleY,
    exampleXLabel,
    exampleYLabel
  ];

  // ============================================================
  // 15-19: Each matrix row calculates one new coordinate
  // ============================================================

  // 15. Use the first row to find the new step across.
  await until(S(15));

  const ruleInput = inputPicture(
    'u',
    U,
    UP
  );

  await play(
    ...replaceArrows(
      [ruleInput]
    ),
    new M.FadeOut(matrixDim),
    new M.FadeIn(row1Label),
    new M.FadeIn(row2Label),
    new M.Create(exampleX),
    new M.Create(exampleY),
    new M.FadeIn(exampleXLabel),
    new M.FadeIn(exampleYLabel),
    ...markMatrixRow(0, AREA),
    ...fbox(
      [
        ['FIRST ROW', AREA],
        ['Calculates the new horizontal step.', C.ink]
      ],
      AREA
    ),
    ...say('FIRST ROW → NEW STEP ACROSS', AREA)
  );

  // 16. Double the old step across, then add the old step up.
  await until(S(16));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          matrixEntries[0],
          { color: AREA }
        ),
        new M.Indicate(
          exampleX,
          { color: AREA }
        ),
        new M.Indicate(
          matrixEntries[1],
          { color: AGE }
        ),
        new M.Indicate(
          exampleY,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.24,
        runTime: 1.8
      }
    ),
    ...fbox(
      [
        ['NEW HORIZONTAL STEP', AREA],
        ['2 × old x + old y', C.ink],
        ['New x = 2x + y', AREA]
      ],
      AREA
    ),
    ...say('NEW x = 2x + y', AREA)
  );

  // 17. Use the second row to find the new step up.
  await until(S(17));

  await play(
    ...markMatrixRow(1, AGE),
    new M.Indicate(
      row2Label,
      { color: AGE }
    ),
    ...fbox(
      [
        ['SECOND ROW', AGE],
        ['Calculates the new vertical step.', C.ink]
      ],
      AGE
    ),
    ...say('SECOND ROW → NEW STEP UP', AGE)
  );

  // 18. Keep the old step across and add twice the old step up.
  await until(S(18));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          matrixEntries[2],
          { color: AREA }
        ),
        new M.Indicate(
          exampleX,
          { color: AREA }
        ),
        new M.Indicate(
          matrixEntries[3],
          { color: AGE }
        ),
        new M.Indicate(
          exampleY,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.24,
        runTime: 1.8
      }
    ),
    ...fbox(
      [
        ['NEW VERTICAL STEP', AGE],
        ['Old x + 2 × old y', C.ink],
        ['New y = x + 2y', AGE]
      ],
      AGE
    ),
    ...say('NEW y = x + 2y', AGE)
  );

  // 19. Each new step uses a dot product between one matrix
  //     row and the old arrow's steps.
  await until(S(19));

  await play(
    ...clearMatrixMark(),
    ...fadeAll(componentParts),

    new M.LaggedStart(
      matrixEntries.map(
        entry => new M.Indicate(
          entry,
          { color: RULE }
        )
      ),
      {
        lagRatio: 0.20,
        runTime: 1.7
      }
    ),

    ...fbox(
      [
        ['ONE DOT PRODUCT PER MATRIX ROW', RULE],
        ['(2, 1) · (x, y) = 2x + y', AREA],
        ['(1, 2) · (x, y) = x + 2y', AGE]
      ],
      RULE
    ),
    ...say('EACH NEW COORDINATE IS A DOT PRODUCT', RULE)
  );

  // ------------------------------------------------------------
  // Coordinate step guides
  //
  // Draw the horizontal and vertical legs of a vector.
  // The diagonal arrow itself represents the total vector.
  // ------------------------------------------------------------

  function stepGuides(
    v,
    showLabels = true
  ) {
    const parts = [];

    if (v[0] !== 0) {
      parts.push(
        gridArrow(
          0, 0,
          v[0], 0,
          AREA,
          3.3,
          0.11
        )
      );

      if (showLabels) {
        parts.push(
          tagAt(
            signed(v[0]),
            AREA,
            [
              xy(v[0] / 2, 0)[0],
              CY - 0.32,
              0
            ],
            15
          )
        );
      }
    }

    if (v[1] !== 0) {
      parts.push(
        gridArrow(
          v[0], 0,
          v[0], v[1],
          AGE,
          3.3,
          0.11
        )
      );

      if (showLabels) {
        parts.push(
          tagAt(
            signed(v[1]),
            AGE,
            [
              xy(v[0], v[1] / 2)[0] + 0.29,
              xy(v[0], v[1] / 2)[1],
              0
            ],
            15
          )
        );
      }
    }

    return new M.VGroup(
      ...parts
    );
  }

  // ============================================================
  // 20-24: Transform the up-right arrow
  // ============================================================

  // 20. Try the up and right arrow with steps one and one.
  await until(S(20));

  const uSteps = stepGuides(U);

  await play(
    new M.FadeIn(uSteps),
    new M.Indicate(
      ruleInput,
      { color: UP }
    ),
    ...fbox(
      [
        ['INPUT u = (1, 1)', UP],
        ['Old horizontal step = 1', AREA],
        ['Old vertical step = 1', AGE]
      ],
      UP
    ),
    ...say('TRY u = (1, 1)', UP)
  );

  // 21. The new horizontal step is two times one plus one,
  //     which is three.
  await until(S(21));

  await play(
    ...markMatrixRow(0, AREA),
    ...fbox(
      [
        ['NEW HORIZONTAL STEP', AREA],
        ['2 × 1 + 1 × 1', C.ink],
        ['= 3', AREA]
      ],
      AREA
    ),
    ...say('NEW x = 2 × 1 + 1 = 3', AREA)
  );

  // 22. The new vertical step is one plus two times one,
  //     which is three.
  await until(S(22));

  await play(
    ...markMatrixRow(1, AGE),
    ...fbox(
      [
        ['NEW VERTICAL STEP', AGE],
        ['1 × 1 + 2 × 1', C.ink],
        ['= 3', AGE]
      ],
      AGE
    ),
    ...say('NEW y = 1 + 2 × 1 = 3', AGE)
  );

  // ------------------------------------------------------------
  // Three copies of the original up-right arrow
  //
  // Each copy contributes one step right and one step up.
  // Together they reach (3, 3).
  // ------------------------------------------------------------

  const uGhost = new M.DashedLine({
    start: ZERO,
    end: xy(1, 1),
    color: C.ink,
    strokeWidth: 2.2
  });

  const uOriginalRing = oldTip(
    U,
    UP
  );

  const uNewSteps = stepGuides(HU);

  // 23. So the new arrow takes three right and three up.
  await until(S(23));

  await play(
    ...clearMatrixMark(),

    new M.FadeOut(uSteps),

    new M.FadeIn(uOriginalRing),

    new M.Transform(
      ruleInput,
      outputPicture('u', HU, UP),
      { runTime: 1.6 }
    ),

    new M.FadeIn(uNewSteps),

    ...fbox(
      [
        ['NEW u = (3, 3)', UP],
        ['3 right', AREA],
        ['3 up', AGE]
      ],
      UP
    ),
    ...say('NEW u = (3, 3)', UP)
  );

  const uCopies = [];

  for (let i = 0; i < 3; i++) {
    const arrow = gridArrow(
      i, i,
      i + 1, i + 1,
      UP,
      4.7,
      0.14
    );

    const midpoint = xy(
      i + 0.5,
      i + 0.5
    );

    const label = textAt(
      String(i + 1),
      17,
      UP,
      [
        midpoint[0] - 0.22,
        midpoint[1] + 0.22,
        0
      ],
      true
    );

    uCopies.push(
      new M.VGroup(
        arrow,
        label
      )
    );
  }

  // 24. It points along the same line and has three times
  //     the original length.
  await until(S(24));

  await play(
    new M.FadeOut(uNewSteps),

    new M.LaggedStart(
      uCopies.map(
        copy => new M.FadeIn(copy)
      ),
      {
        lagRatio: 0.34,
        runTime: 1.75
      }
    ),

    ...fbox(
      [
        ['SAME LINE, THREE TIMES AS LONG', UP],
        ['(3, 3) = 3 × (1, 1)', C.ink],
        ['new u = 3 × u', RESULT]
      ],
      UP
    ),
    ...say('SAME LINE • THREE TIMES THE LENGTH', UP)
  );

  // ============================================================
  // 25-28: Transform the down-right arrow
  // ============================================================

  // 25. Now try the down and right arrow whose steps are
  //     one and negative one.
  await until(S(25));

  const vInput = inputPicture(
    'v',
    V,
    DOWN
  );

  const vSteps = stepGuides(V);

  await play(
    new M.FadeOut(uOriginalRing),
    ...fadeAll(uCopies),
    ...replaceArrows(
      [vInput]
    ),
    new M.FadeIn(vSteps),
    ...fbox(
      [
        ['INPUT v = (1, −1)', DOWN],
        ['Old horizontal step = 1', AREA],
        ['Old vertical step = −1', AGE]
      ],
      DOWN
    ),
    ...say('TRY v = (1, −1)', DOWN)
  );

  // 26. The new horizontal step is two minus one, which is one.
  await until(S(26));

  await play(
    ...markMatrixRow(0, AREA),
    ...fbox(
      [
        ['NEW HORIZONTAL STEP', AREA],
        ['2 × 1 + 1 × (−1)', C.ink],
        ['= 2 − 1 = 1', AREA]
      ],
      AREA
    ),
    ...say('NEW x = 2 − 1 = 1', AREA)
  );

  // 27. The new vertical step is one minus two,
  //     which is negative one.
  await until(S(27));

  await play(
    ...markMatrixRow(1, AGE),
    ...fbox(
      [
        ['NEW VERTICAL STEP', AGE],
        ['1 × 1 + 2 × (−1)', C.ink],
        ['= 1 − 2 = −1', AGE]
      ],
      AGE
    ),
    ...say('NEW y = 1 − 2 = −1', AGE)
  );

  // 28. That arrow stays just as it was.
  await until(S(28));

  await play(
    ...clearMatrixMark(),
    new M.FadeOut(vSteps),

    new M.Transform(
      vInput,
      outputPicture(
        'v',
        HV,
        DOWN
      )
    ),

    ...fbox(
      [
        ['NEW v = (1, −1)', DOWN],
        ['Same direction, same length.', C.ink],
        ['new v = 1 × v', RESULT]
      ],
      DOWN
    ),

    ...say('SAME ARROW • NO CHANGE IN LENGTH', DOWN)
  );

  // ------------------------------------------------------------
  // Eigenvector comparison
  //
  // Show both preserved directions together.
  // The straight-right counterexample is considered later.
  // ------------------------------------------------------------

  function multiplierLabel(
    s,
    v,
    color,
    offset
  ) {
    const p = xy(v[0], v[1]);

    return tagAt(
      s,
      color,
      [
        p[0] + offset[0],
        p[1] + offset[1],
        0
      ],
      16,
      1.50
    );
  }

  let eigenU = outputPicture(
    'u',
    HU,
    UP
  );

  let eigenV = outputPicture(
    'v',
    HV,
    DOWN
  );

  const eigenURing = oldTip(
    U,
    UP
  );

  const eigenVStartRing = oldTip(
    V,
    DOWN
  );

  // ============================================================
  // 29-32: Define eigenvectors and eigenvalues
  // ============================================================

  // 29. An eigenvector is a nonzero arrow that a rule
  //     turns into a multiple of itself.
  await until(S(29));

  await play(
    ...replaceArrows(
      [eigenU, eigenV],
      1.25
    ),
    new M.FadeIn(eigenURing),
    new M.FadeIn(eigenVStartRing),
    ...fbox(
      [
        ['EIGENVECTOR', RESULT],
        ['A nonzero vector.', C.ink],
        ['Its output is a multiple of itself.', RESULT]
      ],
      RESULT
    ),
    ...say('EIGENVECTOR = NONZERO, SAME LINE', RESULT)
  );

  // ------------------------------------------------------------
  // Hypothetical negative multiplier
  //
  // This is a separate illustration of the definition.
  // The actual demonstration matrix H has eigenvalues
  // 3 and 1, not -1 or 0.
  // ------------------------------------------------------------

  const negativePreview = vectorPicture(
    U,
    UP,
    'u',
    [-0.20, 0.25]
  );

  const negativeGhost = new M.DashedLine({
    start: ZERO,
    end: xy(1, 1),
    color: UP,
    strokeWidth: 2.5
  });

  const negativeNotice = tagAt(
    'HYPOTHETICAL FACTOR',
    WARN,
    [
      CX,
      xy(0, -LIMIT)[1] + 0.31,
      0
    ],
    14,
    3.40
  );

  // 30. A negative multiplier would point the new arrow
  //     the other way along the same line.
  await until(S(30));

  await play(
    new M.FadeOut(eigenURing),
    new M.FadeOut(eigenVStartRing),

    ...replaceArrows(
      [negativePreview],
      0.60
    ),

    new M.FadeIn(negativeGhost),
    new M.FadeIn(negativeNotice),

    ...fbox(
      [
        ['HYPOTHETICAL MULTIPLIER: −1', WARN],
        ['(1, 1) → (−1, −1)', C.ink],
        ['Same line, reversed direction.', UP]
      ],
      WARN
    ),

    ...say('NEGATIVE FACTOR: REVERSE THE ARROW', WARN)
  );

  await play(
    new M.Transform(
      negativePreview,
      vectorPicture(
        [-1, -1],
        UP,
        '−u',
        [-0.34, -0.23]
      ),
      { runTime: 1.25 }
    )
  );

  // ------------------------------------------------------------
  // Hypothetical zero multiplier
  //
  // The nonzero input is allowed to map to the zero vector.
  // The input itself must still be nonzero to qualify as
  // an eigenvector.
  // ------------------------------------------------------------

  const zeroOutputDot = dotAt(
    ZERO,
    UP,
    0.14
  );

  const zeroOutputLabel = tagAt(
    'OUTPUT = 0',
    UP,
    [
      ZERO[0] + 0.62,
      ZERO[1] + 0.34,
      0
    ],
    15,
    1.65
  );

  // 31. A zero multiplier would put its tip at zero.
  await until(S(31));

  await play(
    new M.Transform(
      negativePreview,
      vectorPicture(
        [0.001, 0.001],
        UP,
        '0',
        [0.14, 0.22]
      ),
      { runTime: 0.8 }
    ),

    ...fbox(
      [
        ['HYPOTHETICAL MULTIPLIER: 0', WARN],
        ['0 × (1, 1) = (0, 0)', C.ink],
        ['The output collapses to zero.', UP]
      ],
      WARN
    ),

    ...say('ZERO FACTOR: TIP RETURNS TO ZERO', WARN)
  );

  await play(
    ...replaceArrows([]),
    new M.FadeIn(zeroOutputDot),
    new M.FadeIn(zeroOutputLabel)
  );

  // 32. The multiplier is called the eigenvalue.
  await until(S(32));

  eigenU = outputPicture(
    'u',
    HU,
    UP
  );

  eigenV = outputPicture(
    'v',
    HV,
    DOWN
  );

  const restoredURing = oldTip(
    U,
    UP
  );

  await play(
    new M.FadeOut(negativeGhost),
    new M.FadeOut(negativeNotice),
    new M.FadeOut(zeroOutputDot),
    new M.FadeOut(zeroOutputLabel),

    ...replaceArrows(
      [eigenU, eigenV],
      0.9
    ),

    new M.FadeIn(restoredURing),

    ...fbox(
      [
        ['EIGENVALUE', RULE],
        ['The multiplier of an eigenvector.', C.ink],
        ['It tells us how the arrow scales.', RESULT]
      ],
      RULE
    ),

    ...say('EIGENVALUE = THE MULTIPLIER', RULE)
  );

  // ============================================================
  // 33-36: The eigenvalues of the actual matrix
  // ============================================================

  const eigenvalue3 = multiplierLabel(
    '× 3',
    HU,
    UP,
    [-0.62, -0.30]
  );

  const eigenvalue1 = multiplierLabel(
    '× 1',
    HV,
    DOWN,
    [0.45, -0.45]
  );

  // 33. Our up and right arrow has eigenvalue three.
  await until(S(33));

  await play(
    new M.FadeIn(eigenvalue3),
    new M.Indicate(
      eigenU,
      { color: UP }
    ),
    ...fbox(
      [
        ['UP-RIGHT EIGENVECTOR', UP],
        ['Rule × (1, 1) = 3 × (1, 1)', C.ink],
        ['Eigenvalue = 3', UP]
      ],
      UP
    ),
    ...say('UP-RIGHT EIGENVALUE = 3', UP)
  );

  // 34. Our down and right arrow has eigenvalue one.
  await until(S(34));

  await play(
    new M.FadeIn(eigenvalue1),
    new M.Indicate(
      eigenV,
      { color: DOWN }
    ),
    ...fbox(
      [
        ['DOWN-RIGHT EIGENVECTOR', DOWN],
        ['Rule × (1, −1) = 1 × (1, −1)', C.ink],
        ['Eigenvalue = 1', DOWN]
      ],
      DOWN
    ),
    ...say('DOWN-RIGHT EIGENVALUE = 1', DOWN)
  );

  // 35. In words, the matrix times an eigenvector equals
  //     the eigenvalue times that same vector.
  await until(S(35));

  await play(
    new M.Indicate(
      matrixBracket,
      { color: RULE }
    ),

    new M.LaggedStart(
      [
        new M.Indicate(
          eigenvalue3,
          { color: UP }
        ),
        new M.Indicate(
          eigenvalue1,
          { color: DOWN }
        )
      ],
      {
        lagRatio: 0.32,
        runTime: 1.7
      }
    ),

    ...fbox(
      [
        ['H × eigenvector = eigenvalue × eigenvector', C.ink],
        ['Matrix × arrow = number × arrow', RULE],
        ['That number is the eigenvalue.', RESULT]
      ],
      RULE
    ),

    ...say('MATRIX × VECTOR = FACTOR × VECTOR', RULE)
  );

  // 36. That gives you directions where you can predict
  //     the result using just one multiplier.
  await until(S(36));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          eigenU,
          { color: UP }
        ),
        new M.Indicate(
          eigenV,
          { color: DOWN }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 1.7
      }
    ),

    ...fbox(
      [
        ['PREDICT THE OUTPUT', RESULT],
        ['Up-right: multiply by 3', UP],
        ['Down-right: multiply by 1', DOWN]
      ],
      RESULT
    ),

    ...say('ONE MULTIPLIER PREDICTS EACH SPECIAL DIRECTION', RESULT)
  );

  // ------------------------------------------------------------
  // Counterexample: straight-right input
  //
  // w = (1, 0)
  // Hw = (2, 1)
  //
  // No scalar multiple of (1, 0) can have a nonzero
  // vertical coordinate.
  // ------------------------------------------------------------

  const straightInput = inputPicture(
    'w',
    W,
    RIGHT
  );

  const straightGhost = new M.DashedLine({
    start: ZERO,
    end: xy(1, 0),
    color: RIGHT,
    strokeWidth: 2.8
  });

  const straightOriginalRing = oldTip(
    W,
    RIGHT
  );

  const straightOutputSteps = stepGuides(
    HW
  );

  const changedLine = new M.DashedLine({
    start: xy(-4, -2),
    end: xy(4, 2),
    color: RIGHT,
    strokeWidth: 1.6
  });

  const changedDirectionTag = tagAt(
    'NEW LINE',
    RIGHT,
    [
      xy(3.1, 1.55)[0],
      xy(3.1, 1.55)[1] + 0.29,
      0
    ],
    14,
    1.45
  );

  const originalDirectionTag = tagAt(
    'OLD LINE',
    C.muted,
    [
      xy(-2.6, 0)[0],
      xy(-2.6, 0)[1] + 0.25,
      0
    ],
    14,
    1.45
  );

  // ============================================================
  // 37-39: Test the arrow that changes its line
  // ============================================================

  // 37. Watch what happens to the arrow that starts straight right.
  await until(S(37));

  await play(
    new M.FadeOut(eigenvalue3),
    new M.FadeOut(eigenvalue1),
    new M.FadeOut(restoredURing),

    ...replaceArrows(
      [straightInput]
    ),

    new M.FadeIn(straightGhost),

    ...fbox(
      [
        ['TEST THE THIRD ARROW', RIGHT],
        ['w = (1, 0)', C.ink],
        ['Does it stay horizontal?', RIGHT]
      ],
      RIGHT
    ),

    ...say('NOW TEST THE STRAIGHT-RIGHT ARROW', RIGHT)
  );

  // 38. It goes from one right and zero up to two right and one up.
  await until(S(38));

  await play(
    new M.FadeIn(straightOriginalRing),

    new M.Transform(
      straightInput,
      outputPicture(
        'w',
        HW,
        RIGHT
      ),
      { runTime: 1.45 }
    ),

    new M.FadeIn(straightOutputSteps),

    ...fbox(
      [
        ['New x = 2 × 1 + 1 × 0 = 2', AREA],
        ['New y = 1 × 1 + 2 × 0 = 1', AGE],
        ['new w = (2, 1)', RIGHT]
      ],
      RIGHT
    ),

    ...say('(1, 0) BECOMES (2, 1)', RIGHT)
  );

  // 39. Its line changes, so this arrow is not an eigenvector.
  await until(S(39));

  await play(
    new M.FadeOut(straightOutputSteps),
    new M.Create(changedLine),
    new M.FadeIn(changedDirectionTag),
    new M.FadeIn(originalDirectionTag),

    ...fbox(
      [
        ['NOT AN EIGENVECTOR', WARN],
        ['Any multiple of (1, 0) has 0 up.', C.ink],
        ['But new w = (2, 1).', RIGHT]
      ],
      WARN
    ),

    ...say('DIFFERENT LINE → NOT AN EIGENVECTOR', WARN)
  );

  // ------------------------------------------------------------
  // Common trap: the zero vector
  //
  // H(0, 0) = (0, 0), but the zero vector does not count
  // as an eigenvector.
  //
  // It has no nonzero direction to test.
  // ------------------------------------------------------------

  const zeroInputHalo = new M.Dot({
    point: ZERO,
    radius: 0.20,
    color: WARN
  });

  zeroInputHalo.setFill(
    WARN,
    0.20
  );

  const zeroInputDot = dotAt(
    ZERO,
    WARN,
    0.095
  );

  const zeroInputLabel = tagAt(
    '(0, 0)',
    WARN,
    [
      ZERO[0] + 0.63,
      ZERO[1] + 0.31,
      0
    ],
    16,
    1.35
  );

  const zeroInputGroup = new M.VGroup(
    zeroInputHalo,
    zeroInputDot,
    zeroInputLabel
  );

  const zeroWarning = tagAt(
    'NO DIRECTION',
    WARN,
    [
      CX,
      xy(0, -LIMIT)[1] + 0.35,
      0
    ],
    17,
    2.60
  );

  // ============================================================
  // 40: The eigenvector itself must be nonzero
  // ============================================================

  // 40. Watch out for choosing the zero arrow,
  //     which has no direction to test.
  await until(S(40));

  await play(
    ...replaceArrows([]),

    new M.FadeOut(straightGhost),
    new M.FadeOut(straightOriginalRing),
    new M.FadeOut(changedLine),
    new M.FadeOut(changedDirectionTag),
    new M.FadeOut(originalDirectionTag),

    new M.FadeIn(zeroInputGroup),
    new M.FadeIn(zeroWarning),

    ...fbox(
      [
        ['WATCH OUT: ZERO INPUT', WARN],
        ['Rule × (0, 0) = (0, 0)', C.ink],
        ['An eigenvector must be nonzero.', RESULT]
      ],
      WARN
    ),

    ...say('THE ZERO VECTOR IS NOT AN EIGENVECTOR', WARN)
  );

  // ------------------------------------------------------------
  // Try it preview
  //
  // Use fresh arrow objects for the exercise prompts.
  // The actual interactive controls belong to Try it.
  // ------------------------------------------------------------

  const tryU = inputPicture(
    'u',
    U,
    UP
  );

  const tryV = inputPicture(
    'v',
    V,
    DOWN
  );

  const tryW = inputPicture(
    'w',
    W,
    RIGHT
  );

  const tryURing = oldTip(
    U,
    UP
  );

  const tryVGuide = new M.DashedLine({
    start: ZERO,
    end: xy(1, -1),
    color: DOWN,
    strokeWidth: 2.6
  });

  const tryUFactor = multiplierLabel(
    '× 3',
    HU,
    UP,
    [-0.63, -0.30]
  );

  const tryVFactor = multiplierLabel(
    '× 1',
    HV,
    DOWN,
    [0.45, -0.45]
  );

  // ============================================================
  // 41-43: Visual prompts for Try it
  // ============================================================

  // 41. In Try it, find the arrow that grows three times as long.
  await until(S(41));

  await play(
    new M.FadeOut(zeroInputGroup),
    new M.FadeOut(zeroWarning),

    ...replaceArrows(
      [tryU, tryV, tryW],
      0.9
    ),

    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Which arrow grows three times as long?', C.ink],
        ['Look for the preserved line.', UP]
      ],
      RESULT
    ),

    ...say('TRY IT: FIND THE FACTOR OF THREE', UP)
  );

  // 42. Then find the arrow that stays put.
  await until(S(42));

  await play(
    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Which arrow stays exactly as it was?', C.ink],
        ['Look for eigenvalue 1.', DOWN]
      ],
      RESULT
    ),

    ...say('TRY IT: FIND THE UNCHANGED ARROW', DOWN)
  );

  // 43. Tap New data to look for directions on a newly stretched grid.
  await until(S(43));

  await play(
    new M.Indicate(
      matrixBracket,
      { color: RULE }
    ),

    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Tap New data.', C.ink],
        ['Find directions preserved by a new rule.', RULE]
      ],
      RESULT
    ),

    ...say('NEW DATA: FIND NEW SPECIAL DIRECTIONS', RULE)
  );

  // ------------------------------------------------------------
  // Final comparison
  //
  // All three original input vectors transform using H.
  //
  // u grows by 3.
  // v stays unchanged.
  // w changes its line.
  //
  // The dashed lines are their original supporting lines.
  // ------------------------------------------------------------

  // ============================================================
  // 44: Final takeaway
  // ============================================================

  // 44. An eigenvector stays on its original line because
  //     the transformation only multiplies that arrow by a number.
  await until(S(44));

  await play(
    new M.FadeIn(tryURing),

    new M.Transform(
      tryU,
      outputPicture(
        'u',
        HU,
        UP
      ),
      { runTime: 1.55 }
    ),

    new M.Transform(
      tryV,
      outputPicture(
        'v',
        HV,
        DOWN
      ),
      { runTime: 1.55 }
    ),

    new M.Transform(
      tryW,
      outputPicture(
        'w',
        HW,
        RIGHT
      ),
      { runTime: 1.55 }
    ),

    new M.FadeIn(tryUFactor),
    new M.FadeIn(tryVFactor),

    ...fbox(
      [
        ['EIGENVECTOR: only multiplied', RESULT],
        ['(1, 1) → 3(1, 1)', UP],
        ['(1, −1) → 1(1, −1)', DOWN],
        ['(1, 0) → (2, 1): different line', RIGHT]
      ],
      RESULT
    ),

    ...say('EIGENVECTORS KEEP THEIR ORIGINAL LINE', RESULT)
  );
}
