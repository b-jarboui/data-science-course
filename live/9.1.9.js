// lesson 9.1.9
// Singular value decomposition: split a centered table into ranked patterns.
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
  // Mean area = 6
  // Mean age  = 10
  //
  // Centered design matrix X:
  //
  //         Area  Age
  //    A     -3    4
  //    B      0   -8
  //    C      3    4
  //
  // The columns are orthogonal:
  // (-3 × 4) + (0 × -8) + (3 × 4) = 0
  //
  // Squared column lengths:
  // Area = 9 + 0 + 9 = 18
  // Age  = 16 + 64 + 16 = 96
  //
  // Singular values in decreasing order:
  // sigma1 = sqrt(96)
  // sigma2 = sqrt(18)
  //
  // Feature-side unit vectors:
  // v1 = (0, 1), age direction
  // v2 = (1, 0), area direction
  //
  // Apartment-side unit vectors:
  // u1 = (4, -8, 4) / sqrt(96)
  // u2 = (-3, 0, 3) / sqrt(18)
  //
  // Reconstruction:
  //
  // X = sigma1 * u1 * transpose(v1)
  //   + sigma2 * u2 * transpose(v2)
  //
  //         [ 0   4 ]   [ -3  0 ]
  //     X = [ 0  -8 ] + [  0  0 ]
  //         [ 0   4 ]   [  3  0 ]
  //
  // Keeping only the first pattern leaves squared error 18.
  // This special example has orthogonal feature columns.
  // General SVD patterns need not coincide with feature columns.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const MEAN_AREA = 6;
  const MEAN_AGE = 10;

  const X = DATA.map(d => [
    d.area - MEAN_AREA,
    d.age - MEAN_AGE
  ]);

  const AREA_COLUMN = X.map(r => r[0]);
  const AGE_COLUMN = X.map(r => r[1]);

  const AGE_SHEET = X.map(r => [
    0,
    r[1]
  ]);

  const AREA_SHEET = X.map(r => [
    r[0],
    0
  ]);

  const RAW = DATA.map(d => [
    d.area,
    d.age
  ]);

  const PRODUCTS = X.map(
    r => r[0] * r[1]
  );

  const AREA_SQUARES = AREA_COLUMN.map(
    n => n * n
  );

  const AGE_SQUARES = AGE_COLUMN.map(
    n => n * n
  );

  const sum = a => a.reduce(
    (total, n) => total + n,
    0
  );

  const AREA_SQ = sum(AREA_SQUARES);
  const AGE_SQ = sum(AGE_SQUARES);

  const SIGMA1 = Math.sqrt(AGE_SQ);
  const SIGMA2 = Math.sqrt(AREA_SQ);

  const U1 = AGE_COLUMN.map(
    n => n / SIGMA1
  );

  const U2 = AREA_COLUMN.map(
    n => n / SIGMA2
  );

  const V1 = [0, 1];
  const V2 = [1, 0];

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';

  const STRENGTH = C.amber;
  const PATTERN = C.violet;
  const RESULT = C.green;
  const WARN = C.amber;

  const GRID = '#293548';
  const GLASS = '#52647D';

  const signed = n =>
    typeof n === 'number' && n < 0
      ? `−${Math.abs(n)}`
      : String(n);

  const dollars = n =>
    '$' + String(n).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ','
    );

  const fmt = n => {
    if (Math.abs(n) < 0.000001) return '0';

    return signed(
      Number(n.toFixed(3))
    );
  };

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
  //   Main picture on the left.
  //   Formula or explanation on the right.
  //
  // Phone:
  //   Main picture above.
  //   Formula or explanation below.
  //
  // Keep one main grid or table on screen at a time.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.42;
  const CY = P ? 0.75 : -0.12;

  const PILL = P
    ? [0, 4.02, 0]
    : [0, 2.04, 0];

  const PANEL_X = P ? 0 : 3.52;
  const PANEL_Y = P ? -3.53 : -0.38;

  const BOXP = [
    PANEL_X,
    PANEL_Y,
    0
  ];

  const BOX_MAX = P
    ? FW - 1.12
    : 6.15;

  const CARD_Y = P ? 3.10 : -2.64;

  const TABLE_W = P ? 5.65 : 5.45;
  const TABLE_H = P ? 3.65 : 3.35;

  const ROW_GAP = P ? 0.79 : 0.73;
  const ROW_TOP = CY + 0.49;

  const rowY = i =>
    ROW_TOP - i * ROW_GAP;

  const LABEL_X = CX - 2.07;
  const AREA_X = CX - 0.70;
  const AGE_X = CX + 1.17;

  const HEADER_Y = CY + 1.18;

  const TABLE_LEFT = CX - TABLE_W / 2;
  const TABLE_RIGHT = CX + TABLE_W / 2;

  const TABLE_TOP = CY + TABLE_H / 2;
  const TABLE_BOTTOM = CY - TABLE_H / 2;

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
    const t = T(
      String(s),
      size,
      color,
      mono
    );

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
      cornerRadius: 0.09,
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
    const g = pill(
      s,
      color,
      size
    );

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
      objects.map(
        o => new M.FadeIn(o)
      ),
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
      o => new M.Indicate(
        o,
        { color }
      )
    );
  }

  // ------------------------------------------------------------
  // Coordinate-based arrow
  //
  // Construct each arrow before displaying it.
  // No regrouping of objects already on screen.
  // ------------------------------------------------------------

  function arrowBetween(
    start,
    end,
    color,
    strokeWidth = 4,
    headLength = 0.15
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const length = Math.hypot(
      dx,
      dy
    );

    if (length < 0.000001) {
      return new M.VGroup(
        dotAt(start, color, 0.075)
      );
    }

    const ux = dx / length;
    const uy = dy / length;

    const hl = Math.min(
      headLength,
      length * 0.35
    );

    const hx = end[0] - ux * hl;
    const hy = end[1] - uy * hl;

    const hw = hl * 0.47;

    return new M.VGroup(
      lineBetween(
        start,
        end,
        color,
        strokeWidth
      ),

      lineBetween(
        end,
        [
          hx - uy * hw,
          hy + ux * hw,
          0
        ],
        color,
        strokeWidth
      ),

      lineBetween(
        end,
        [
          hx + uy * hw,
          hy - ux * hw,
          0
        ],
        color,
        strokeWidth
      )
    );
  }

  // ------------------------------------------------------------
  // Secondary panel management
  //
  // Show only one formula box or visual explanation at a time.
  // Every new group is assembled before it is displayed.
  // ------------------------------------------------------------

  let panelNow = [];

  function replacePanel(
    objects,
    duration = 0.95,
    lag = 0.10
  ) {
    const animations = [
      ...fadeAll(panelNow)
    ];

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

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // Keep the mathematics short and introduce the visual
  // pattern before writing its symbolic rule.
  // ------------------------------------------------------------

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 19 : 21;
    const lh = P ? 0.36 : 0.41;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(
        s,
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

    const wd = Math.min(
      BOX_MAX,
      Math.max(
        ...texts.map(t => t.getWidth())
      ) + 0.60
    );

    const ht = rows.length * lh + 0.28;

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
      - 0.14
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
      0.80
    );
  }

  // ------------------------------------------------------------
  // Persistent original apartment cards
  //
  // Rent remains on the listing cards.
  // Only area and age enter the centered matrix and SVD.
  // ------------------------------------------------------------

  const CARD_W = P ? 2.12 : 1.92;
  const CARD_GAP = P ? 0.13 : 0.12;
  const CARD_H = P ? 0.72 : 0.59;

  const CARD_CX = P ? 0 : CX;

  function listingCard(d, i) {
    const x = CARD_CX
      + (i - 1) * (CARD_W + CARD_GAP);

    const frame = rectAt(
      [x, CARD_Y, 0],
      CARD_W,
      CARD_H,
      C.muted,
      C.card,
      0.95,
      1.4
    );

    const apartment = textAt(
      d.id,
      P ? 19 : 17,
      C.ink,
      [
        x - CARD_W * 0.33,
        CARD_Y + 0.13,
        0
      ],
      true
    );

    const rent = textAt(
      dollars(d.rent),
      P ? 15 : 14,
      C.amber,
      [
        x + CARD_W * 0.13,
        CARD_Y + 0.13,
        0
      ],
      true,
      CARD_W * 0.54
    );

    const area = textAt(
      `${d.area} chunks`,
      P ? 15 : 13,
      AREA,
      [
        x - CARD_W * 0.22,
        CARD_Y - 0.13,
        0
      ],
      true,
      CARD_W * 0.44
    );

    const age = textAt(
      `${d.age} yr`,
      P ? 15 : 13,
      AGE,
      [
        x + CARD_W * 0.26,
        CARD_Y - 0.13,
        0
      ],
      true,
      CARD_W * 0.36
    );

    return new M.VGroup(
      frame,
      apartment,
      rent,
      area,
      age
    );
  }

  const listingCards = DATA.map(
    listingCard
  );

  // ------------------------------------------------------------
  // Opening centered apartment map
  //
  // Use equal horizontal and vertical grid scales.
  // Apartment points appear at their exact centered positions.
  // ------------------------------------------------------------

  const MAP_STEP = P ? 0.28 : 0.235;

  const MAP_CY = P ? 1.10 : 0.26;

  const mapXY = (x, y) => [
    CX + x * MAP_STEP,
    MAP_CY + y * MAP_STEP,
    0
  ];

  const MAP_XMIN = -7;
  const MAP_XMAX = 7;
  const MAP_YMIN = -9;
  const MAP_YMAX = 6;

  const openingGridLines = [];

  for (
    let x = MAP_XMIN;
    x <= MAP_XMAX;
    x++
  ) {
    if (x === 0) continue;

    openingGridLines.push(
      lineBetween(
        mapXY(x, MAP_YMIN),
        mapXY(x, MAP_YMAX),
        GRID,
        0.9
      )
    );
  }

  for (
    let y = MAP_YMIN;
    y <= MAP_YMAX;
    y++
  ) {
    if (y === 0) continue;

    openingGridLines.push(
      lineBetween(
        mapXY(MAP_XMIN, y),
        mapXY(MAP_XMAX, y),
        GRID,
        0.9
      )
    );
  }

  const openingGrid = new M.VGroup(
    ...openingGridLines
  );

  const openingXAxis = lineBetween(
    mapXY(MAP_XMIN, 0),
    mapXY(MAP_XMAX, 0),
    AREA,
    2.5
  );

  const openingYAxis = lineBetween(
    mapXY(0, MAP_YMIN),
    mapXY(0, MAP_YMAX),
    AGE,
    2.5
  );

  const openingOrigin = dotAt(
    mapXY(0, 0),
    RESULT,
    0.085
  );

  const openingOriginLabel = textAt(
    '0',
    15,
    RESULT,
    [
      mapXY(0, 0)[0] - 0.17,
      mapXY(0, 0)[1] - 0.20,
      0
    ],
    true
  );

  const openingAreaTitle = textAt(
    'Area difference',
    P ? 17 : 16,
    AREA,
    [
      CX + 1.0,
      mapXY(0, MAP_YMIN)[1] - 0.23,
      0
    ],
    false,
    2.65
  );

  const openingAgeTitle = textAt(
    'Age difference',
    P ? 17 : 16,
    AGE,
    [
      CX - 0.96,
      mapXY(0, MAP_YMAX)[1] + 0.17,
      0
    ],
    false,
    2.65
  );

  function apartmentPoint(row, i) {
    const p = mapXY(
      row[0],
      row[1]
    );

    const halo = new M.Dot({
      point: p,
      radius: 0.15,
      color: AREA
    });

    halo.setFill(AREA, 0.18);

    const d = dotAt(
      p,
      C.ink,
      0.075
    );

    const label = tagAt(
      DATA[i].id,
      AREA,
      [
        p[0] + (i === 0 ? -0.27 : 0.27),
        p[1] + 0.22,
        0
      ],
      P ? 16 : 15
    );

    return new M.VGroup(
      halo,
      d,
      label
    );
  }

  const openingPoints = X.map(
    apartmentPoint
  );

  const openingParts = [
    openingGrid,
    openingXAxis,
    openingYAxis,
    openingOrigin,
    openingOriginLabel,
    openingAreaTitle,
    openingAgeTitle,
    ...openingPoints
  ];

  // ------------------------------------------------------------
  // Main picture management
  //
  // The main picture can be:
  //   - the apartment map
  //   - one matrix or transparent pattern sheet
  //   - the feature direction grid
  //   - a strength comparison
  //   - one normalized apartment-side column
  //
  // Never place multiple competing tables on screen.
  // ------------------------------------------------------------

  let mainNow = [];

  function replaceMain(
    objects,
    duration = 1.05,
    lag = 0.08
  ) {
    const animations = [
      ...fadeAll(mainNow)
    ];

    if (objects.length) {
      animations.push(
        reveal(
          objects,
          duration,
          lag
        )
      );
    }

    mainNow = objects.slice();

    return animations;
  }

  // ------------------------------------------------------------
  // Matrix table
  //
  // All six values remain separate objects so each entry
  // can transform independently.
  //
  // The apartment labels always remain in A, B, C order.
  // ------------------------------------------------------------

  function cellPosition(i, j) {
    return [
      j === 0 ? AREA_X : AGE_X,
      rowY(i),
      0
    ];
  }

  function cellText(
    value,
    i,
    j,
    options = {}
  ) {
    const inactive = (
      options.muteZero === true
      && value === 0
    );

    const color = inactive
      ? C.muted
      : j === 0
        ? AREA
        : AGE;

    const size = options.size
      || (P ? 30 : 29);

    return textAt(
      signed(value),
      size,
      color,
      cellPosition(i, j),
      true,
      1.62
    );
  }

  function makeTable(
    values,
    options = {}
  ) {
    const title = options.title
      || 'CENTERED TABLE';

    const headers = options.headers
      || ['AREA', 'AGE'];

    const frameColor = options.color
      || C.muted;

    const frame = rectAt(
      [CX, CY, 0],
      TABLE_W,
      TABLE_H,
      frameColor,
      C.card,
      options.glass ? 0.78 : 0.96,
      options.glass ? 2.4 : 1.8
    );

    const titleText = textAt(
      title,
      P ? 20 : 21,
      frameColor === C.muted
        ? C.ink
        : frameColor,
      [
        CX,
        TABLE_TOP - 0.24,
        0
      ],
      true,
      TABLE_W - 0.45
    );

    const apartmentHeader = textAt(
      'APT',
      16,
      C.muted,
      [
        LABEL_X,
        HEADER_Y,
        0
      ],
      true,
      0.82
    );

    const featureHeaders = [
      textAt(
        headers[0],
        P ? 17 : 18,
        AREA,
        [
          AREA_X,
          HEADER_Y,
          0
        ],
        true,
        1.65
      ),

      textAt(
        headers[1],
        P ? 17 : 18,
        AGE,
        [
          AGE_X,
          HEADER_Y,
          0
        ],
        true,
        1.65
      )
    ];

    const labels = DATA.map((d, i) =>
      textAt(
        d.id,
        P ? 23 : 24,
        C.ink,
        [
          LABEL_X,
          rowY(i),
          0
        ],
        true
      )
    );

    const dividers = [
      lineBetween(
        [
          TABLE_LEFT + 0.23,
          HEADER_Y - 0.34,
          0
        ],
        [
          TABLE_RIGHT - 0.23,
          HEADER_Y - 0.34,
          0
        ],
        GRID,
        1.5
      )
    ];

    for (let i = 0; i < 2; i++) {
      const y = (
        rowY(i) + rowY(i + 1)
      ) / 2;

      dividers.push(
        lineBetween(
          [
            TABLE_LEFT + 0.24,
            y,
            0
          ],
          [
            TABLE_RIGHT - 0.24,
            y,
            0
          ],
          GRID,
          1.15
        )
      );
    }

    const cells = values.map((row, i) =>
      row.map((value, j) =>
        cellText(
          value,
          i,
          j,
          options
        )
      )
    );

    const parts = [
      frame,
      titleText,
      apartmentHeader,
      ...featureHeaders,
      ...labels,
      ...dividers,
      ...cells.flat()
    ];

    return {
      frame,
      titleText,
      featureHeaders,
      labels,
      cells,
      values: values.map(r => r.slice()),
      parts
    };
  }

  let table = null;

  function showTable(
    values,
    options = {},
    duration = 1.10
  ) {
    const next = makeTable(
      values,
      options
    );

    table = next;

    return replaceMain(
      next.parts,
      duration,
      0.055
    );
  }

  function updateCells(
    values,
    options = {}
  ) {
    const animations = [];

    values.forEach((row, i) => {
      row.forEach((value, j) => {
        if (
          options.columns
          && !options.columns.includes(j)
        ) {
          return;
        }

        animations.push(
          new M.Transform(
            table.cells[i][j],
            cellText(
              value,
              i,
              j,
              options
            )
          )
        );

        table.values[i][j] = value;
      });
    });

    return animations;
  }

  function updateTitle(
    s,
    color = C.ink
  ) {
    return new M.Transform(
      table.titleText,
      textAt(
        s,
        P ? 20 : 21,
        color,
        [
          CX,
          TABLE_TOP - 0.24,
          0
        ],
        true,
        TABLE_W - 0.45
      )
    );
  }

  function updateHeader(
    col,
    s
  ) {
    return new M.Transform(
      table.featureHeaders[col],
      textAt(
        s,
        P ? 17 : 18,
        col === 0 ? AREA : AGE,
        [
          col === 0 ? AREA_X : AGE_X,
          HEADER_Y,
          0
        ],
        true,
        1.65
      )
    );
  }

  // ------------------------------------------------------------
  // Table highlights
  //
  // Draw outline boxes directly from coordinates.
  // Do not create new groups from visible table cells.
  // ------------------------------------------------------------

  let marksNow = [];

  function mark(objects) {
    const animations = [
      ...fadeAll(marksNow),
      ...objects.map(
        o => new M.Create(o)
      )
    ];

    marksNow = objects.slice();

    return animations;
  }

  function clearMarks() {
    const animations = fadeAll(
      marksNow
    );

    marksNow = [];

    return animations;
  }

  function columnOutline(
    col,
    color
  ) {
    return outline(
      [
        col === 0 ? AREA_X : AGE_X,
        rowY(1),
        0
      ],
      1.66,
      2 * ROW_GAP + 0.67,
      color
    );
  }

  function rowOutline(
    i,
    color = WARN
  ) {
    const left = AREA_X - 0.76;
    const right = AGE_X + 0.76;

    return outline(
      [
        (left + right) / 2,
        rowY(i),
        0
      ],
      right - left,
      ROW_GAP - 0.10,
      color
    );
  }

  function cellOutline(
    i,
    j,
    color
  ) {
    return outline(
      cellPosition(i, j),
      1.60,
      ROW_GAP - 0.12,
      color
    );
  }

  // ============================================================
  // 0-5: Recover the centered apartment table
  // ============================================================

  // 0. Could one pattern give you a quick sketch of how
  //    the apartments differ in area and age?
  await until(S(0));

  await play(
    ...replaceMain(
      openingParts,
      1.45,
      0.10
    ),


    ...fbox(
      [
        ['ONE PATTERN?', PATTERN],
        ['A quick sketch of the listings.', C.ink],
        ['How much detail could we keep?', STRENGTH]
      ],
      PATTERN
    ),

    ...say('COULD ONE PATTERN DESCRIBE THE LISTINGS?', PATTERN)
  );

  // 1. Bring up the table with one row per apartment.
  await until(S(1));

  await play(
    ...showTable(
      RAW,
      {
        title: 'APARTMENT MEASUREMENTS',
        headers: [
          'AREA',
          'AGE'
        ]
      }
    ),

    ...clearPanel(),

    ...say('ONE ROW PER APARTMENT')
  );

  // 2. Now show each area and age as its difference
  //    from the average for that feature.
  await until(S(2));

  await play(
    ...updateCells(X),

    updateTitle(
      'DIFFERENCES FROM THE MEAN',
      RESULT
    ),

    ...fbox(
      [
        ['CENTER THE MEASUREMENTS', RESULT],
        ['Area: subtract 6', AREA],
        ['Age: subtract 10', AGE],
        ['A: (3 − 6, 14 − 10)', C.ink],
        ['   = (−3, 4)', RESULT]
      ],
      RESULT
    ),

    ...say('SUBTRACT EACH FEATURE AVERAGE', RESULT)
  );

  // 3. This is our centered table.
  await until(S(3));

  await play(
    updateTitle(
      'CENTERED TABLE',
      RESULT
    ),

    new M.Indicate(
      table.frame,
      { color: RESULT }
    ),

    ...say('CENTERED TABLE', RESULT)
  );

  // 4. The area column reads negative three, zero, and three.
  await until(S(4));

  await play(
    ...mark([
      columnOutline(
        0,
        AREA
      )
    ]),

    new M.LaggedStart(
      table.cells.map(row =>
        new M.Indicate(
          row[0],
          { color: AREA }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 1.60
      }
    ),

    ...fbox(
      [
        ['CENTERED AREA COLUMN', AREA],
        ['A: −3', AREA],
        ['B:  0', AREA],
        ['C:  3', AREA]
      ],
      AREA
    ),

    ...say('AREA: −3, 0, 3', AREA)
  );

  // 5. The age column reads four, negative eight, and four.
  await until(S(5));

  await play(
    ...mark([
      columnOutline(
        1,
        AGE
      )
    ]),

    new M.LaggedStart(
      table.cells.map(row =>
        new M.Indicate(
          row[1],
          { color: AGE }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 1.60
      }
    ),

    ...fbox(
      [
        ['CENTERED AGE COLUMN', AGE],
        ['A:  4', AGE],
        ['B: −8', AGE],
        ['C:  4', AGE]
      ],
      AGE
    ),

    ...say('AGE: 4, −8, 4', AGE)
  );

  // ------------------------------------------------------------
  // Transparent-sheet illustration
  //
  // A coordinate-based glass backing is placed behind the
  // table to suggest two clear sheets.
  //
  // Show the age and area sheets sequentially rather than
  // crowding the screen with multiple tables.
  // ------------------------------------------------------------

  function sheetBacking(
    color,
    offsetX,
    offsetY
  ) {
    return rectAt(
      [
        CX + offsetX,
        CY + offsetY,
        0
      ],
      TABLE_W,
      TABLE_H,
      color,
      color,
      0.035,
      1.8
    );
  }

  const glassBacking1 = sheetBacking(
    AGE,
    -0.13,
    0.13
  );

  const glassBacking2 = sheetBacking(
    AREA,
    0.13,
    -0.13
  );

  // ============================================================
  // 6-9: Split the table into two transparent pattern sheets
  // ============================================================

  // 6. Imagine the table printed on two clear sheets.
  await until(S(6));

  await play(
    ...clearMarks(),

    new M.Create(glassBacking1),
    new M.Create(glassBacking2),

    ...fbox(
      [
        ['TWO CLEAR SHEETS', PATTERN],
        ['One sheet for age.', AGE],
        ['One sheet for area.', AREA],
        ['Their matching spots can be added.', C.ink]
      ],
      PATTERN
    ),

    ...say('SPLIT THE TABLE INTO TWO SHEETS', PATTERN)
  );

  // 7. One sheet keeps the age column and puts zeros
  //    in the area column.
  await until(S(7));

  await play(
    new M.FadeOut(glassBacking1),
    new M.FadeOut(glassBacking2),

    ...showTable(
      AGE_SHEET,
      {
        title: 'AGE PATTERN SHEET',
        color: AGE,
        glass: true,
        muteZero: true
      }
    ),

    ...fbox(
      [
        ['KEEP AGE ONLY', AGE],
        ['Area entries become zero.', AREA],
        ['Age entries stay unchanged.', AGE]
      ],
      AGE
    ),

    ...say('SHEET 1: AGE ONLY', AGE)
  );

  // 8. The other keeps the area column and puts zeros
  //    in the age column.
  await until(S(8));

  await play(
    ...showTable(
      AREA_SHEET,
      {
        title: 'AREA PATTERN SHEET',
        color: AREA,
        glass: true,
        muteZero: true
      }
    ),

    ...fbox(
      [
        ['KEEP AREA ONLY', AREA],
        ['Area entries stay unchanged.', AREA],
        ['Age entries become zero.', AGE]
      ],
      AREA
    ),

    ...say('SHEET 2: AREA ONLY', AREA)
  );

  // ------------------------------------------------------------
  // Entrywise addition
  //
  // Display matching additions inside a single table.
  //
  // Age sheet + area sheet:
  //
  // A: 0 + (-3),  4 + 0
  // B: 0 + 0,    -8 + 0
  // C: 0 + 3,     4 + 0
  // ------------------------------------------------------------

  const ADDITION_CELLS = DATA.map((d, i) => [
    `0 + (${signed(AREA_COLUMN[i])})`,
    `${signed(AGE_COLUMN[i])} + 0`
  ]);

  // 9. Add the matching spots on the two sheets
  //    to get our table back.
  await until(S(9));

  await play(
    ...updateCells(
      ADDITION_CELLS,
      { size: 20 }
    ),

    updateTitle(
      'ADD MATCHING SPOTS',
      RESULT
    ),

    ...fbox(
      [
        ['AGE SHEET + AREA SHEET', RESULT],
        ['Add area to area.', AREA],
        ['Add age to age.', AGE],
        ['Recover every original entry.', RESULT]
      ],
      RESULT
    ),

    ...say('ADD THE MATCHING SPOTS', RESULT)
  );

  await play(
    ...updateCells(X),

    updateTitle(
      'CENTERED TABLE',
      RESULT
    )
  );

  // ------------------------------------------------------------
  // Feature-direction grid
  //
  // This is a local coordinate grid, enlarged around zero.
  // A horizontal and a vertical step have the same length.
  //
  // v1 = (0, 1), age direction.
  // v2 = (1, 0), area direction.
  // ------------------------------------------------------------

  const DIR_STEP = P ? 1.15 : 1.02;

  const DIR_CY = CY - 0.12;

  const dirXY = (x, y) => [
    CX + x * DIR_STEP,
    DIR_CY + y * DIR_STEP,
    0
  ];

  const DIR_ZERO = dirXY(
    0,
    0
  );

  const directionGridLines = [];

  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue;

    directionGridLines.push(
      lineBetween(
        dirXY(k, -2),
        dirXY(k, 2),
        GRID,
        1
      )
    );

    directionGridLines.push(
      lineBetween(
        dirXY(-2, k),
        dirXY(2, k),
        GRID,
        1
      )
    );
  }

  const directionGrid = new M.VGroup(
    ...directionGridLines
  );

  const directionXAxis = lineBetween(
    dirXY(-2, 0),
    dirXY(2, 0),
    AREA,
    2.3
  );

  const directionYAxis = lineBetween(
    dirXY(0, -2),
    dirXY(0, 2),
    AGE,
    2.3
  );

  const directionOrigin = dotAt(
    DIR_ZERO,
    RESULT,
    0.075
  );

  const directionZeroLabel = textAt(
    '0',
    15,
    RESULT,
    [
      DIR_ZERO[0] - 0.19,
      DIR_ZERO[1] - 0.20,
      0
    ],
    true
  );

  const directionAreaTitle = textAt(
    'Area direction',
    P ? 17 : 16,
    AREA,
    [
      CX,
      dirXY(0, -2)[1] - 0.26,
      0
    ],
    false,
    3.65
  );

  const directionAgeTitle = textAt(
    'Age direction',
    P ? 17 : 16,
    AGE,
    [
      CX - 0.88,
      dirXY(0, 2)[1] + 0.22,
      0
    ],
    false,
    2.85
  );

  const directionTicks = [];

  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue;

    directionTicks.push(
      textAt(
        signed(k),
        16,
        AREA,
        [
          dirXY(k, 0)[0],
          dirXY(k, 0)[1] - 0.18,
          0
        ],
        true
      )
    );

    directionTicks.push(
      textAt(
        signed(k),
        16,
        AGE,
        [
          dirXY(0, k)[0] - 0.20,
          dirXY(0, k)[1],
          0
        ],
        true
      )
    );
  }

  const directionGridParts = [
    directionGrid,
    directionXAxis,
    directionYAxis,
    directionOrigin,
    directionZeroLabel,
    directionAreaTitle,
    directionAgeTitle,
    ...directionTicks
  ];

  const ageDirectionArrow = arrowBetween(
    DIR_ZERO,
    dirXY(0, 1),
    AGE,
    5.0,
    0.17
  );

  const ageDirectionLabel = tagAt(
    '(0, 1)',
    AGE,
    [
      dirXY(0, 1)[0] + 0.62,
      dirXY(0, 1)[1] + 0.12,
      0
    ],
    17,
    1.52
  );

  const ageLengthLabel = tagAt(
    'LENGTH 1',
    AGE,
    [
      DIR_ZERO[0] - 0.67,
      dirXY(0, 0.5)[1] - 0.03,
      0
    ],
    16,
    1.60
  );

  const areaDirectionArrow = arrowBetween(
    DIR_ZERO,
    dirXY(1, 0),
    AREA,
    5.0,
    0.17
  );

  const areaDirectionLabel = tagAt(
    '(1, 0)',
    AREA,
    [
      dirXY(1, 0)[0] + 0.62,
      dirXY(1, 0)[1] + 0.30,
      0
    ],
    17,
    1.52
  );

  const areaLengthLabel = tagAt(
    'LENGTH 1',
    AREA,
    [
      dirXY(0.5, 0)[0] + 0.10,
      DIR_ZERO[1] - 0.47,
      0
    ],
    16,
    1.60
  );

  const cornerSize = 0.25;

  const rightAngle = new M.VGroup(
    lineBetween(
      dirXY(
        cornerSize,
        0
      ),
      dirXY(
        cornerSize,
        cornerSize
      ),
      RESULT,
      2.8
    ),

    lineBetween(
      dirXY(
        cornerSize,
        cornerSize
      ),
      dirXY(
        0,
        cornerSize
      ),
      RESULT,
      2.8
    )
  );

  const rightAngleLabel = tagAt(
    '90°',
    RESULT,
    [
      dirXY(0.58, 0.60)[0] + 0.24,
      dirXY(0.58, 0.60)[1] + 0.10,
      0
    ],
    16,
    1.00
  );

  // ============================================================
  // 10-14: Two perpendicular feature directions
  // ============================================================

  // 10. Each sheet tracks changes along one direction
  //     on the feature grid.
  await until(S(10));

  await play(
    ...replaceMain(
      directionGridParts,
      1.20,
      0.06
    ),

    ...fbox(
      [
        ['FEATURE-SIDE DIRECTIONS', PATTERN],
        ['Age sheet: vertical changes.', AGE],
        ['Area sheet: horizontal changes.', AREA]
      ],
      PATTERN
    ),

    ...say('ONE FEATURE DIRECTION PER SHEET', PATTERN)
  );

  // 11. The age direction is the arrow zero across
  //     and one up, of length one.
  await until(S(11));

  await play(
    new M.Create(ageDirectionArrow),
    new M.FadeIn(ageDirectionLabel),
    new M.FadeIn(ageLengthLabel),

    ...fbox(
      [
        ['AGE DIRECTION', AGE],
        ['0 across, 1 up', C.ink],
        ['v₁ = (0, 1)', AGE],
        ['Length = 1', RESULT]
      ],
      AGE
    ),

    ...say('AGE DIRECTION = (0, 1)', AGE)
  );

  mainNow.push(
    ageDirectionArrow,
    ageDirectionLabel,
    ageLengthLabel
  );

  // 12. The area direction is the arrow one across
  //     and zero up, also of length one.
  await until(S(12));

  await play(
    new M.Create(areaDirectionArrow),
    new M.FadeIn(areaDirectionLabel),
    new M.FadeIn(areaLengthLabel),

    ...fbox(
      [
        ['AREA DIRECTION', AREA],
        ['1 across, 0 up', C.ink],
        ['v₂ = (1, 0)', AREA],
        ['Length = 1', RESULT]
      ],
      AREA
    ),

    ...say('AREA DIRECTION = (1, 0)', AREA)
  );

  mainNow.push(
    areaDirectionArrow,
    areaDirectionLabel,
    areaLengthLabel
  );

  // 13. Those directions meet at a square corner.
  await until(S(13));

  await play(
    new M.Create(rightAngle),
    new M.FadeIn(rightAngleLabel),

    new M.Indicate(
      ageDirectionArrow,
      { color: AGE }
    ),

    new M.Indicate(
      areaDirectionArrow,
      { color: AREA }
    ),

    ...say('THE DIRECTIONS MEET AT 90°', RESULT)
  );

  mainNow.push(
    rightAngle,
    rightAngleLabel
  );

  // 14. We call directions that meet at a square corner
  //     orthogonal.
  await until(S(14));

  await play(
    new M.Indicate(
      rightAngle,
      { color: RESULT }
    ),

    ...fbox(
      [
        ['ORTHOGONAL DIRECTIONS', RESULT],
        ['Meet at a square corner.', C.ink],
        ['Their dot product is zero.', RESULT],
        ['(0, 1) · (1, 0) = 0', PATTERN]
      ],
      RESULT
    ),

    ...say('ORTHOGONAL = PERPENDICULAR', RESULT)
  );

  // ============================================================
  // 15-17: Look at the apartment-side columns
  // ============================================================

  // 15. Now look down the columns instead of across the rows.
  await until(S(15));

  await play(
    ...showTable(
      X,
      {
        title: 'LOOK DOWN THE COLUMNS'
      }
    ),

    ...clearPanel(),

    ...mark([
      columnOutline(0, AREA),
      columnOutline(1, AGE)
    ]),

    ...say('LOOK DOWN EACH FEATURE COLUMN')
  );

  // 16. In each column, the first number belongs to A,
  //     the next to B, and the last to C.
  await until(S(16));

  await play(
    ...clearMarks(),

    new M.LaggedStart(
      table.labels.map(label =>
        new M.Indicate(
          label,
          { color: PATTERN }
        )
      ),
      {
        lagRatio: 0.32,
        runTime: 1.50
      }
    ),

    ...fbox(
      [
        ['APARTMENT-SIDE LISTS', PATTERN],
        ['First number: A', C.ink],
        ['Second number: B', C.ink],
        ['Third number: C', C.ink]
      ],
      PATTERN
    ),

    ...say('BOTH LISTS FOLLOW A, B, C', PATTERN)
  );

  // 17. Those two lists are orthogonal too,
  //     which we can check with a dot product.
  await until(S(17));

  await play(
    ...mark([
      columnOutline(0, AREA),
      columnOutline(1, AGE)
    ]),

    ...fbox(
      [
        ['CHECK THE COLUMN DIRECTIONS', RESULT],
        ['Area list: (−3, 0, 3)', AREA],
        ['Age list: (4, −8, 4)', AGE],
        ['Match, multiply, add.', PATTERN]
      ],
      RESULT
    ),

    ...say('CHECK ORTHOGONALITY WITH A DOT PRODUCT', RESULT)
  );

  // ------------------------------------------------------------
  // Dot-product ledger
  //
  // Visualize negative and positive contributions as signed
  // blocks on opposite sides of a zero line.
  //
  // A contributes -12.
  // B contributes   0.
  // C contributes +12.
  // ------------------------------------------------------------

  const LEDGER_W = P ? 6.25 : 5.90;
  const LEDGER_H = P ? 2.50 : 2.70;

  function dotLedger(
    count,
    showTotal = false
  ) {
    const frame = rectAt(
      BOXP,
      LEDGER_W,
      LEDGER_H,
      PATTERN,
      C.card,
      0.97
    );

    const title = textAt(
      'MATCHING PRODUCTS',
      P ? 18 : 20,
      PATTERN,
      [
        PANEL_X,
        PANEL_Y + LEDGER_H / 2 - 0.26,
        0
      ],
      true,
      LEDGER_W - 0.40
    );

    const centerX = PANEL_X + 0.57;
    const scale = P ? 0.13 : 0.115;

    const axisTop = PANEL_Y + 0.60;
    const axisBottom = PANEL_Y - 0.68;

    const zeroAxis = lineBetween(
      [
        centerX,
        axisBottom,
        0
      ],
      [
        centerX,
        axisTop,
        0
      ],
      C.muted,
      1.7
    );

    const zeroLabel = textAt(
      '0',
      P ? 15 : 13,
      C.muted,
      [
        centerX,
        axisBottom - 0.17,
        0
      ],
      true
    );

    const parts = [
      frame,
      title,
      zeroAxis,
      zeroLabel
    ];

    for (let i = 0; i < 3; i++) {
      const y = PANEL_Y + 0.43 - i * 0.45;

      parts.push(
        textAt(
          DATA[i].id,
          16,
          C.ink,
          [
            PANEL_X - LEDGER_W / 2 + 0.35,
            y,
            0
          ],
          true
        )
      );

      if (i >= count) continue;

      const n = PRODUCTS[i];

      const color = n < 0
        ? AGE
        : n > 0
          ? AREA
          : C.muted;

      const productLabel = textAt(
        signed(n),
        17,
        color,
        [
          PANEL_X - LEDGER_W / 2 + 0.94,
          y,
          0
        ],
        true,
        0.70
      );

      parts.push(productLabel);

      if (n === 0) {
        parts.push(
          dotAt(
            [centerX, y, 0],
            C.muted,
            0.065
          )
        );
      } else {
        const bar = new M.Rectangle({
          width: Math.abs(n) * scale,
          height: 0.27,
          color,
          strokeWidth: 1.4
        });

        bar.setFill(color, 0.70);

        bar.moveTo([
          centerX + n * scale / 2,
          y,
          0
        ]);

        parts.push(bar);
      }
    }

    const footer = textAt(
      showTotal
        ? '−12 + 0 + 12 = 0'
        : 'Multiply matching entries.',
      showTotal ? 20 : 16,
      showTotal ? RESULT : C.muted,
      [
        PANEL_X,
        PANEL_Y - LEDGER_H / 2 + 0.24,
        0
      ],
      true,
      LEDGER_W - 0.45
    );

    parts.push(footer);

    return [
      new M.VGroup(...parts)
    ];
  }

  // ============================================================
  // 18-21: Verify the apartment columns are orthogonal
  // ============================================================

  // 18. Multiply the A entries to get negative twelve.
  await until(S(18));

  await play(
    ...mark([
      rowOutline(0, PATTERN)
    ]),

    ...replacePanel(
      dotLedger(1),
      1.05
    ),

    new M.Indicate(
      table.cells[0][0],
      { color: AREA }
    ),

    new M.Indicate(
      table.cells[0][1],
      { color: AGE }
    ),

    ...say('A: (−3) × 4 = −12', PATTERN)
  );

  // 19. Multiply the B entries to get zero.
  await until(S(19));

  await play(
    ...mark([
      rowOutline(1, PATTERN)
    ]),

    ...replacePanel(
      dotLedger(2),
      0.90
    ),

    ...say('B: 0 × (−8) = 0', PATTERN)
  );

  // 20. Multiply the C entries to get twelve.
  await until(S(20));

  await play(
    ...mark([
      rowOutline(2, PATTERN)
    ]),

    ...replacePanel(
      dotLedger(3),
      0.90
    ),

    ...say('C: 3 × 4 = 12', PATTERN)
  );

  // 21. These add to zero,
  //     the dot product that signals a square corner.
  await until(S(21));

  await play(
    ...clearMarks(),

    ...replacePanel(
      dotLedger(3, true),
      1.0
    ),

    new M.Indicate(
      table.frame,
      { color: RESULT }
    ),

    ...say('−12 + 0 + 12 = 0: ORTHOGONAL', RESULT)
  );

  // ============================================================
  // 22-24: How strong is each pattern?
  // ============================================================

  // 22. Which pattern is stronger on the scales we chose?
  await until(S(22));

  await play(
    ...mark([
      columnOutline(0, AREA),
      columnOutline(1, AGE)
    ]),

    ...fbox(
      [
        ['COMPARE PATTERN STRENGTH', STRENGTH],
        ['Measure each column’s length.', C.ink],
        ['Use the current feature units.', C.muted]
      ],
      STRENGTH
    ),

    ...say('WHICH COLUMN HAS THE GREATER LENGTH?', STRENGTH)
  );

  // 23. To measure a column’s length,
  //     first square its entries and add them.
  await until(S(23));

  await play(
    ...clearMarks(),

    ...fbox(
      [
        ['MEASURE A COLUMN', STRENGTH],
        ['1. Square every entry.', C.ink],
        ['2. Add the squares.', C.ink],
        ['3. Find the square root.', RESULT]
      ],
      STRENGTH
    ),

    ...say('SQUARE THE ENTRIES, THEN ADD', STRENGTH)
  );

  // ------------------------------------------------------------
  // Squaring picture
  //
  // Use a real three-by-three square of tiles.
  // The length of -3 is three units, and its square is +9.
  // ------------------------------------------------------------

  function squarePicture(
    n,
    color
  ) {
    const count = Math.abs(n);

    const frame = rectAt(
      BOXP,
      P ? 6.15 : 5.80,
      P ? 2.65 : 2.75,
      color,
      C.card,
      0.97
    );

    const title = textAt(
      'MULTIPLY A NUMBER BY ITSELF',
      P ? 17 : 19,
      color,
      [
        PANEL_X,
        PANEL_Y + 1.08,
        0
      ],
      true,
      5.30
    );

    const unit = 0.40;

    const squareX = PANEL_X - 1.18;
    const squareY = PANEL_Y - 0.03;

    const tiles = [];

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const r = new M.Rectangle({
          width: unit * 0.88,
          height: unit * 0.88,
          color,
          strokeWidth: 1.2
        });

        r.setFill(
          color,
          0.65
        );

        r.moveTo([
          squareX + (
            j - (count - 1) / 2
          ) * unit,

          squareY + (
            (count - 1) / 2 - i
          ) * unit,

          0
        ]);

        tiles.push(r);
      }
    }

    const edgeLabel = textAt(
      String(count),
      17,
      color,
      [
        squareX,
        squareY + count * unit / 2 + 0.17,
        0
      ],
      true
    );

    const calculation = textAt(
      `(${signed(n)})² = ${n * n}`,
      P ? 22 : 24,
      color,
      [
        PANEL_X + 1.02,
        PANEL_Y + 0.14,
        0
      ],
      true,
      2.60
    );

    const explanation = textAt(
      `${n * n} tiles`,
      18,
      RESULT,
      [
        PANEL_X + 1.02,
        PANEL_Y - 0.36,
        0
      ],
      true,
      2.60
    );

    return [
      frame,
      title,
      ...tiles,
      edgeLabel,
      calculation,
      explanation
    ];
  }

  // 24. To square a number means to multiply it by itself.
  await until(S(24));

  await play(
    ...mark([
      cellOutline(0, 0, AREA)
    ]),

    ...replacePanel(
      squarePicture(-3, AREA),
      1.45,
      0.055
    ),

    ...say('SQUARE = MULTIPLY BY ITSELF', AREA)
  );

  // ------------------------------------------------------------
  // Squared-entry table
  //
  // Keep the original column on the other side until its
  // own squaring beat arrives.
  // ------------------------------------------------------------

  const AREA_FIRST_SQUARES = DATA.map((d, i) => [
    AREA_SQUARES[i],
    AGE_COLUMN[i]
  ]);

  const ALL_SQUARES = DATA.map((d, i) => [
    AREA_SQUARES[i],
    AGE_SQUARES[i]
  ]);

  // ============================================================
  // 25-28: Calculate both squared column lengths
  // ============================================================

  // 25. The area squares are nine, zero, and nine.
  await until(S(25));

  await play(
    ...mark([
      columnOutline(0, AREA)
    ]),

    ...updateCells(
      AREA_FIRST_SQUARES,
      {
        columns: [0]
      }
    ),

    updateHeader(
      0,
      'AREA²'
    ),

    updateTitle(
      'SQUARING THE ENTRIES',
      STRENGTH
    ),

    ...fbox(
      [
        ['AREA SQUARES', AREA],
        ['(−3)² = 9', AREA],
        ['0² = 0', AREA],
        ['3² = 9', AREA]
      ],
      AREA
    ),

    ...say('AREA SQUARES: 9, 0, 9', AREA)
  );

  // 26. Add them to get eighteen.
  await until(S(26));

  await play(
    ...fbox(
      [
        ['SQUARED AREA LENGTH', AREA],
        ['9 + 0 + 9 = 18', STRENGTH]
      ],
      AREA
    ),

    ...say('AREA SQUARED LENGTH = 18', AREA)
  );

  // 27. The age squares are sixteen, sixty-four, and sixteen.
  await until(S(27));

  await play(
    ...mark([
      columnOutline(1, AGE)
    ]),

    ...updateCells(
      ALL_SQUARES,
      {
        columns: [1]
      }
    ),

    updateHeader(
      1,
      'AGE²'
    ),

    ...fbox(
      [
        ['AGE SQUARES', AGE],
        ['4² = 16', AGE],
        ['(−8)² = 64', AGE],
        ['4² = 16', AGE]
      ],
      AGE
    ),

    ...say('AGE SQUARES: 16, 64, 16', AGE)
  );

  // 28. Add them to get ninety-six.
  await until(S(28));

  await play(
    ...fbox(
      [
        ['SQUARED COLUMN LENGTHS', STRENGTH],
        ['Area: 9 + 0 + 9 = 18', AREA],
        ['Age: 16 + 64 + 16 = 96', AGE]
      ],
      STRENGTH
    ),

    ...say('AGE SQUARED LENGTH = 96', AGE)
  );

  // ------------------------------------------------------------
  // Pattern strength comparison
  //
  // Bar lengths represent square roots, not squared lengths.
  //
  // Age strength  = sqrt(96) ≈ 9.798
  // Area strength = sqrt(18) ≈ 4.243
  //
  // Both bars use the same scale.
  // ------------------------------------------------------------

  function strengthPicture(
    ranked = false,
    singleSquareMetres = false
  ) {
    const areaLength = singleSquareMetres
      ? SIGMA2 * 10
      : SIGMA2;

    const ageLength = SIGMA1;

    const entries = [
      {
        name: 'AREA',
        value: areaLength,
        exact: singleSquareMetres
          ? '√1800'
          : '√18',
        color: AREA
      },

      {
        name: 'AGE',
        value: ageLength,
        exact: '√96',
        color: AGE
      }
    ];

    if (ranked) {
      entries.sort(
        (a, b) => b.value - a.value
      );
    }

    const maxValue = Math.max(
      ...entries.map(d => d.value)
    );

    const frame = rectAt(
      [CX, CY, 0],
      TABLE_W,
      P ? 3.25 : 3.05,
      STRENGTH,
      C.card,
      0.96
    );

    const heading = textAt(
      singleSquareMetres
        ? 'STRENGTH IN NEW AREA UNITS'
        : ranked
          ? 'PATTERNS RANKED BY STRENGTH'
          : 'COMPARE COLUMN LENGTHS',
      P ? 19 : 20,
      STRENGTH,
      [
        CX,
        CY + 1.26,
        0
      ],
      true,
      TABLE_W - 0.40
    );

    const left = CX - 2.10;

    const maxBarWidth = 3.78;

    const bars = entries.map((d, i) => {
      const y = CY + 0.42 - i * 1.10;

      const label = textAt(
        ranked
          ? `${i + 1}. ${d.name}`
          : d.name,
        18,
        d.color,
        [
          left + 0.62,
          y + 0.30,
          0
        ],
        true,
        1.55
      );

      const background = new M.Rectangle({
        width: maxBarWidth,
        height: 0.30,
        color: GRID,
        strokeWidth: 1
      });

      background.setFill(
        GRID,
        0.85
      );

      background.moveTo([
        left + maxBarWidth / 2,
        y - 0.08,
        0
      ]);

      const width = (
        d.value / maxValue
      ) * maxBarWidth;

      const bar = new M.Rectangle({
        width,
        height: 0.30,
        color: d.color,
        strokeWidth: 1.5
      });

      bar.setFill(
        d.color,
        0.79
      );

      bar.moveTo([
        left + width / 2,
        y - 0.08,
        0
      ]);

      const value = textAt(
        `${d.exact} ≈ ${d.value.toFixed(2)}`,
        17,
        d.color,
        [
          CX + 1.15,
          y + 0.30,
          0
        ],
        true,
        2.20
      );

      return new M.VGroup(
        label,
        background,
        bar,
        value
      );
    });

    const footer = textAt(
      'Same bar scale for both.',
      16,
      C.muted,
      [
        CX,
        CY - 1.32,
        0
      ],
      false,
      TABLE_W - 0.45
    );

    return {
      bars,
      parts: [
        frame,
        heading,
        ...bars,
        footer
      ]
    };
  }

  // ============================================================
  // 29-31: Take square roots and rank the patterns
  // ============================================================

  // 29. The square root asks what length, times itself,
  //     gives the total.
  await until(S(29));

  await play(
    ...clearMarks(),

    ...fbox(
      [
        ['SQUARE ROOT = FIND THE LENGTH', STRENGTH],
        ['√18 × √18 = 18', AREA],
        ['√96 × √96 = 96', AGE],
        ['Length = √(sum of squares)', RESULT]
      ],
      STRENGTH
    ),

    ...say('SQUARE ROOT: FROM SQUARE TOTAL TO LENGTH', STRENGTH)
  );

  const strengths = strengthPicture(
    false
  );

  // 30. The square root of ninety-six is larger
  //     than the square root of eighteen.
  await until(S(30));

  await play(
    ...replaceMain(
      strengths.parts,
      1.35,
      0.15
    ),

    ...fbox(
      [
        ['COMPARE THE LENGTHS', STRENGTH],
        ['Age: √96 ≈ 9.80', AGE],
        ['Area: √18 ≈ 4.24', AREA],
        ['√96 > √18', RESULT]
      ],
      STRENGTH
    ),

    ...say('√96 IS LARGER THAN √18', STRENGTH)
  );

  const rankedStrengths = strengthPicture(
    true
  );

  // 31. So age comes first and area comes second
  //     on this grid.
  await until(S(31));

  await play(
    ...replaceMain(
      rankedStrengths.parts,
      1.20,
      0.15
    ),

    ...fbox(
      [
        ['RANK THE PATTERNS', STRENGTH],
        ['1. Age: √96', AGE],
        ['2. Area: √18', AREA],
        ['Ranking uses our chosen units.', C.muted]
      ],
      STRENGTH
    ),

    ...say('FIRST AGE, SECOND AREA', STRENGTH)
  );

  // ------------------------------------------------------------
  // Apartment-side column visualization
  //
  // Display one feature's apartment-side list at a time.
  //
  // Each value has a signed bar sharing a central zero line.
  // A, B and C always remain in their original row order.
  //
  // Normalization divides all entries by the same positive
  // length. This preserves the list's direction.
  // ------------------------------------------------------------

  function columnPicture(
    values,
    color,
    title,
    options = {}
  ) {
    const frame = rectAt(
      [CX, CY, 0],
      TABLE_W,
      TABLE_H,
      color,
      C.card,
      0.97
    );

    const heading = textAt(
      title,
      P ? 19 : 20,
      color,
      [
        CX,
        TABLE_TOP - 0.28,
        0
      ],
      true,
      TABLE_W - 0.40
    );

    const zeroX = CX + 0.45;

    const maxValue = options.scaleMax
      || Math.max(
        1,
        ...values.map(n => Math.abs(n))
      );

    const maxWidth = 1.63;

    const zeroAxis = lineBetween(
      [
        zeroX,
        rowY(0) + 0.35,
        0
      ],
      [
        zeroX,
        rowY(2) - 0.35,
        0
      ],
      C.muted,
      1.5
    );

    const labels = [];

    const valueLabels = [];
    const bars = [];

    for (let i = 0; i < 3; i++) {
      const value = values[i];
      const y = rowY(i);

      labels.push(
        textAt(
          DATA[i].id,
          22,
          C.ink,
          [
            CX - 2.31,
            y,
            0
          ],
          true
        )
      );

      const display = options.exact
        ? options.exact[i]
        : fmt(value);

      valueLabels.push(
        textAt(
          display,
          P ? 19 : 20,
          color,
          [
            CX - 1.52,
            y,
            0
          ],
          true,
          1.32
        )
      );

      if (Math.abs(value) < 0.000001) {
        bars.push(
          dotAt(
            [zeroX, y, 0],
            C.muted,
            0.065
          )
        );
      } else {
        const width = Math.abs(value)
          / maxValue
          * maxWidth;

        const bar = new M.Rectangle({
          width,
          height: 0.30,
          color,
          strokeWidth: 1.4
        });

        bar.setFill(
          color,
          0.76
        );

        bar.moveTo([
          zeroX
            + Math.sign(value) * width / 2,
          y,
          0
        ]);

        bars.push(bar);
      }
    }

    const footer = textAt(
      options.footer || 'Apartment order: A, B, C',
      P ? 16 : 17,
      options.footerColor || C.muted,
      [
        CX,
        TABLE_BOTTOM + 0.26,
        0
      ],
      true,
      TABLE_W - 0.48
    );

    return {
      frame,
      heading,
      labels,
      valueLabels,
      bars,
      footer,
      parts: [
        frame,
        heading,
        zeroAxis,
        ...labels,
        ...valueLabels,
        ...bars,
        footer
      ]
    };
  }

  // Exact normalized column entries.
  //
  // Do not use rounded decimal approximations to reconstruct
  // the original table.
  // ------------------------------------------------------------

  const U1_EXACT = [
    '4/√96',
    '−8/√96',
    '4/√96'
  ];

  const U2_EXACT = [
    '−3/√18',
    '0',
    '3/√18'
  ];

  const originalAgeList = columnPicture(
    AGE_COLUMN,
    AGE,
    'AGE APARTMENT LIST',
    {
      scaleMax: 8,
      exact: [
        '4',
        '−8',
        '4'
      ],
      footer: 'Length = √96',
      footerColor: STRENGTH
    }
  );

  const unitAgeList = columnPicture(
    U1,
    AGE,
    'NORMALIZED AGE LIST',
    {
      scaleMax: 8,
      exact: U1_EXACT,
      footer: 'Divide every entry by √96',
      footerColor: AGE
    }
  );

  // ============================================================
  // 32-35: Normalize the two apartment-side lists
  // ============================================================

  // 32. Scale the age list down by dividing each entry
  //     by its length.
  await until(S(32));

  await play(
    ...replaceMain(
      originalAgeList.parts,
      1.0,
      0.07
    ),

    ...fbox(
      [
        ['NORMALIZE THE AGE LIST', AGE],
        ['Original: (4, −8, 4)', AGE],
        ['Divide each entry by √96.', STRENGTH]
      ],
      AGE
    ),

    ...say('DIVIDE THE AGE LIST BY √96', AGE)
  );

  await play(
    ...originalAgeList.valueLabels.map((entry, i) =>
      new M.Transform(
        entry,
        unitAgeList.valueLabels[i]
      )
    ),

    ...originalAgeList.bars.map((bar, i) =>
      new M.Transform(
        bar,
        unitAgeList.bars[i]
      )
    ),

    new M.Transform(
      originalAgeList.heading,
      unitAgeList.heading
    ),

    new M.Transform(
      originalAgeList.footer,
      unitAgeList.footer
    )
  );

  // 33. The new list still shows A, B, and C in order.
  await until(S(33));

  await play(
    new M.LaggedStart(
      originalAgeList.labels.map(label =>
        new M.Indicate(
          label,
          { color: AGE }
        )
      ),
      {
        lagRatio: 0.32,
        runTime: 1.40
      }
    ),

    ...fbox(
      [
        ['AGE UNIT DIRECTION', AGE],
        ['A:  4 / √96', AGE],
        ['B: −8 / √96', AGE],
        ['C:  4 / √96', AGE],
        ['Same apartment order.', C.ink]
      ],
      AGE
    ),

    ...say('SAME A, B, C ORDER', AGE)
  );

  // 34. Its length is now one.
  await until(S(34));

  await play(
    new M.Transform(
      originalAgeList.footer,
      textAt(
        'NEW LENGTH = 1',
        18,
        RESULT,
        [
          CX,
          TABLE_BOTTOM + 0.26,
          0
        ],
        true,
        TABLE_W - 0.45
      )
    ),

    ...fbox(
      [
        ['Length = √96 ÷ √96', AGE],
        ['       = 1', RESULT]
      ],
      RESULT
    ),

    ...say('UNIT AGE LIST: LENGTH ONE', RESULT)
  );

  const unitAreaList = columnPicture(
    U2,
    AREA,
    'NORMALIZED AREA LIST',
    {
      scaleMax: 1,
      exact: U2_EXACT,
      footer: 'NEW LENGTH = 1',
      footerColor: RESULT
    }
  );

  // 35. Do the same for the area list.
  await until(S(35));

  await play(
    ...replaceMain(
      unitAreaList.parts,
      0.85,
      0.055
    ),

    ...fbox(
      [
        ['AREA UNIT DIRECTION', AREA],
        ['(−3, 0, 3) ÷ √18', AREA],
        ['Length = √18 ÷ √18 = 1', RESULT]
      ],
      AREA
    ),

    ...say('DIVIDE AREA BY √18', AREA)
  );

  // ------------------------------------------------------------
  // Pattern component cards
  //
  // Each pattern has three ingredients:
  //
  //   Feature-side direction, length one.
  //   Apartment-side direction, length one.
  //   Strength, a nonnegative singular value.
  //
  // Show both ranked patterns as compact cards, not as
  // competing data tables.
  // ------------------------------------------------------------

  function patternCard(
    rank,
    feature,
    apartmentList,
    strength,
    color,
    y
  ) {
    const w = TABLE_W;
    const h = P ? 1.69 : 1.54;

    const frame = rectAt(
      [CX, y, 0],
      w,
      h,
      color,
      C.card,
      0.97
    );

    const rankTag = tagAt(
      `${rank}`,
      STRENGTH,
      [
        CX - w / 2 + 0.33,
        y + h / 2 - 0.28,
        0
      ],
      16,
      0.65
    );

    const title = textAt(
      rank === 1
        ? 'AGE PATTERN'
        : 'AREA PATTERN',
      19,
      color,
      [
        CX - 0.68,
        y + h / 2 - 0.29,
        0
      ],
      true,
      2.85
    );

    const strengthTag = tagAt(
      strength,
      STRENGTH,
      [
        CX + w / 2 - 0.72,
        y + h / 2 - 0.29,
        0
      ],
      18,
      1.15
    );

    const featureLabel = textAt(
      `Feature direction: ${feature}`,
      P ? 17 : 18,
      color,
      [
        CX,
        y + 0.03,
        0
      ],
      true,
      w - 0.40
    );

    const apartmentLabel = textAt(
      `A, B, C: ${apartmentList}`,
      P ? 17 : 18,
      color,
      [
        CX,
        y - 0.38,
        0
      ],
      true,
      w - 0.40
    );

    const unitNote = textAt(
      'Direction length: 1',
      P ? 15 : 14,
      C.muted,
      [
        CX,
        y - h / 2 + 0.13,
        0
      ],
      false,
      w - 0.35
    );

    return {
      frame,
      strengthTag,
      parts: new M.VGroup(
        frame,
        rankTag,
        title,
        strengthTag,
        featureLabel,
        apartmentLabel,
        unitNote
      )
    };
  }

  function patternCards() {
    const offset = P ? 0.91 : 0.84;

    const first = patternCard(
      1,
      '(0, 1)',
      '(4, −8, 4)/√96',
      '√96',
      AGE,
      CY + offset
    );

    const second = patternCard(
      2,
      '(1, 0)',
      '(−3, 0, 3)/√18',
      '√18',
      AREA,
      CY - offset
    );

    return {
      first,
      second,
      parts: [
        first.parts,
        second.parts
      ]
    };
  }

  let patterns = patternCards();

  // ============================================================
  // 36-38: Name the decomposition and its singular values
  // ============================================================

  // 36. Now each sheet has a feature direction,
  //     an apartment-side direction, and a strength.
  await until(S(36));

  await play(
    ...replaceMain(
      patterns.parts,
      1.50,
      0.25
    ),

    ...fbox(
      [
        ['THREE INGREDIENTS PER PATTERN', PATTERN],
        ['Feature-side unit direction', C.ink],
        ['Apartment-side unit direction', C.ink],
        ['Strength', STRENGTH]
      ],
      PATTERN
    ),

    ...say('TWO DIRECTIONS AND ONE STRENGTH', PATTERN)
  );

  // 37. Splitting a table into ranked patterns like these
  //     is called singular value decomposition.
  await until(S(37));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          patterns.first.parts,
          { color: AGE }
        ),

        new M.Indicate(
          patterns.second.parts,
          { color: AREA }
        )
      ],
      {
        lagRatio: 0.40,
        runTime: 1.65
      }
    ),

    ...fbox(
      [
        ['SINGULAR VALUE DECOMPOSITION', PATTERN],
        ['SVD', RESULT],
        ['Split a table into ranked patterns.', C.ink],
        ['The patterns have separate directions.', C.ink]
      ],
      PATTERN
    ),

    ...say('SINGULAR VALUE DECOMPOSITION', PATTERN)
  );

  // 38. The lengths we used as strengths
  //     are called singular values.
  await until(S(38));

  await play(
    new M.Indicate(
      patterns.first.parts,
      { color: STRENGTH }
    ),

    new M.Indicate(
      patterns.second.parts,
      { color: STRENGTH }
    ),

    ...fbox(
      [
        ['SINGULAR VALUES', STRENGTH],
        ['1st strength = √96', AGE],
        ['2nd strength = √18', AREA],
        ['Largest strength comes first.', RESULT]
      ],
      STRENGTH
    ),

    ...say('SINGULAR VALUES = PATTERN STRENGTHS', STRENGTH)
  );

  // ------------------------------------------------------------
  // Rebuild the age apartment-side column.
  //
  // Multiply every normalized entry by its singular value:
  //
  // (4 / sqrt(96)) * sqrt(96) = 4
  // (-8 / sqrt(96)) * sqrt(96) = -8
  // (4 / sqrt(96)) * sqrt(96) = 4
  //
  // Use exact values rather than rounded decimals.
  // ------------------------------------------------------------

  const ageRebuild = columnPicture(
    U1,
    AGE,
    'REBUILD THE AGE LIST',
    {
      scaleMax: 8,
      exact: U1_EXACT,
      footer: 'Multiply by √96',
      footerColor: STRENGTH
    }
  );

  const ageRestored = columnPicture(
    AGE_COLUMN,
    AGE,
    'RESTORED AGE LIST',
    {
      scaleMax: 8,
      exact: [
        '4',
        '−8',
        '4'
      ],
      footer: 'Original length = √96',
      footerColor: STRENGTH
    }
  );

  // ============================================================
  // 39-44: Reconstruct the original table
  // ============================================================

  // 39. To rebuild a sheet, multiply its length-one
  //     apartment list by its strength.
  await until(S(39));

  await play(
    ...replaceMain(
      ageRebuild.parts,
      1.0,
      0.06
    ),

    ...fbox(
      [
        ['RESTORE THE AGE LIST', AGE],
        ['Unit list = (4, −8, 4)/√96', AGE],
        ['Strength = √96', STRENGTH],
        ['Multiply the unit list by √96.', RESULT]
      ],
      AGE
    ),

    ...say('UNIT APARTMENT LIST × STRENGTH', STRENGTH)
  );

  await play(
    ...ageRebuild.valueLabels.map((entry, i) =>
      new M.Transform(
        entry,
        ageRestored.valueLabels[i]
      )
    ),

    ...ageRebuild.bars.map((bar, i) =>
      new M.Transform(
        bar,
        ageRestored.bars[i]
      )
    ),

    new M.Transform(
      ageRebuild.heading,
      ageRestored.heading
    ),

    new M.Transform(
      ageRebuild.footer,
      ageRestored.footer
    )
  );

  // ------------------------------------------------------------
  // Outer-product picture
  //
  // An apartment-side restored number multiplies both steps
  // of the feature direction.
  //
  // Age direction = (0, 1).
  //
  // For apartment A:
  // 4 × (0, 1) = (0, 4)
  // ------------------------------------------------------------

  function outerProductPicture(
    value,
    featureDirection,
    color,
    apartmentId
  ) {
    const w = P ? 6.20 : 5.85;
    const h = P ? 2.60 : 2.85;

    const frame = rectAt(
      BOXP,
      w,
      h,
      color,
      C.card,
      0.97
    );

    const heading = textAt(
      `PLACE APARTMENT ${apartmentId}'S VALUE`,
      18,
      color,
      [
        PANEL_X,
        PANEL_Y + h / 2 - 0.27,
        0
      ],
      true,
      w - 0.45
    );

    const leftX = PANEL_X - 1.94;
    const midX = PANEL_X - 0.50;
    const rightX = PANEL_X + 1.58;

    const y = PANEL_Y + 0.11;

    const numberFrame = rectAt(
      [leftX, y, 0],
      0.82,
      0.80,
      color,
      color,
      0.10
    );

    const number = textAt(
      signed(value),
      27,
      color,
      [leftX, y, 0],
      true
    );

    const times = textAt(
      '×',
      25,
      C.ink,
      [
        leftX + 0.62,
        y,
        0
      ],
      true
    );

    const direction = textAt(
      `(${featureDirection[0]}, ${featureDirection[1]})`,
      24,
      color,
      [
        midX + 0.10,
        y,
        0
      ],
      true,
      1.42
    );

    const equals = textAt(
      '=',
      24,
      C.ink,
      [
        PANEL_X + 0.44,
        y,
        0
      ],
      true
    );

    const outArea = value
      * featureDirection[0];

    const outAge = value
      * featureDirection[1];

    const areaCell = rectAt(
      [
        rightX - 0.49,
        y,
        0
      ],
      0.87,
      0.80,
      AREA,
      AREA,
      0.10
    );

    const ageCell = rectAt(
      [
        rightX + 0.49,
        y,
        0
      ],
      0.87,
      0.80,
      AGE,
      AGE,
      0.10
    );

    const areaValue = textAt(
      signed(outArea),
      25,
      outArea === 0
        ? C.muted
        : AREA,
      [
        rightX - 0.49,
        y,
        0
      ],
      true
    );

    const ageValue = textAt(
      signed(outAge),
      25,
      outAge === 0
        ? C.muted
        : AGE,
      [
        rightX + 0.49,
        y,
        0
      ],
      true
    );

    const areaHeader = textAt(
      'AREA',
      P ? 15 : 13,
      AREA,
      [
        rightX - 0.49,
        y + 0.57,
        0
      ],
      true,
      0.81
    );

    const ageHeader = textAt(
      'AGE',
      P ? 15 : 13,
      AGE,
      [
        rightX + 0.49,
        y + 0.57,
        0
      ],
      true,
      0.81
    );

    const footer = textAt(
      `(${signed(value)} × ${featureDirection[0]}, ${signed(value)} × ${featureDirection[1]})`,
      18,
      color,
      [
        PANEL_X,
        PANEL_Y - h / 2 + 0.35,
        0
      ],
      true,
      w - 0.40
    );

    return [
      frame,
      heading,
      numberFrame,
      number,
      times,
      direction,
      equals,
      areaCell,
      ageCell,
      areaValue,
      ageValue,
      areaHeader,
      ageHeader,
      footer
    ];
  }

  // 40. For each apartment, multiply its restored number
  //     by the two steps of the feature direction.
  await until(S(40));

  await play(
    ...replacePanel(
      outerProductPicture(
        4,
        V1,
        AGE,
        'A'
      ),
      1.45,
      0.065
    ),

    new M.Indicate(
      ageRebuild.valueLabels[0],
      { color: AGE }
    ),

    ...say('RESTORED NUMBER × FEATURE DIRECTION', PATTERN)
  );

  // 41. The age direction puts zero into the area spot
  //     and the restored number into the age spot.
  await until(S(41));

  await play(
    ...showTable(
      [
        [0, 4],
        ['?', '?'],
        ['?', '?']
      ],
      {
        title: 'REBUILD THE AGE SHEET',
        color: AGE,
        glass: true,
        muteZero: true
      }
    ),

    ...mark([
      rowOutline(0, AGE)
    ]),

    ...fbox(
      [
        ['AGE DIRECTION = (0, 1)', AGE],
        ['A: 4 × (0, 1)', C.ink],
        ['Area: 4 × 0 = 0', AREA],
        ['Age:  4 × 1 = 4', AGE]
      ],
      AGE
    ),

    ...say('AGE DIRECTION FILLS THE AGE SPOT', AGE)
  );

  // 42. For the first sheet, the age column is back
  //     to four, negative eight, and four.
  await until(S(42));

  await play(
    ...clearMarks(),

    ...updateCells(
      AGE_SHEET,
      {
        muteZero: true
      }
    ),

    updateTitle(
      'RESTORED AGE SHEET',
      AGE
    ),

    ...mark([
      columnOutline(1, AGE)
    ]),

    ...fbox(
      [
        ['PATTERN 1 RESTORED', AGE],
        ['A: 4 × (0, 1) = (0, 4)', AGE],
        ['B: −8 × (0, 1) = (0, −8)', AGE],
        ['C: 4 × (0, 1) = (0, 4)', AGE]
      ],
      AGE
    ),

    ...say('AGE SHEET: 4, −8, 4', AGE)
  );

  // 43. For the area direction, only the area spot
  //     gets the restored number.
  await until(S(43));

  await play(
    ...clearMarks(),

    ...showTable(
      AREA_SHEET,
      {
        title: 'RESTORED AREA SHEET',
        color: AREA,
        glass: true,
        muteZero: true
      }
    ),

    ...fbox(
      [
        ['PATTERN 2 RESTORED', AREA],
        ['Unit list × √18 = (−3, 0, 3)', AREA],
        ['Feature direction = (1, 0)', AREA],
        ['A: −3 × (1, 0) = (−3, 0)', C.ink],
        ['Only the area spot is filled.', RESULT]
      ],
      AREA
    ),

    ...say('AREA DIRECTION FILLS THE AREA SPOT', AREA)
  );

  // 44. The short rule says the centered table equals
  //     the sum of the restored pattern tables.
  await until(S(44));

  await play(
    ...updateCells(
      ADDITION_CELLS,
      {
        size: 20
      }
    ),

    updateTitle(
      'ADD THE RESTORED PATTERNS',
      RESULT
    ),

    ...fbox(
      [
        ['REBUILD THE CENTERED TABLE', RESULT],
        ['X = age pattern + area pattern', C.ink],
        ['Table = age sheet + area sheet', PATTERN],
        ['Strength = singular value', STRENGTH],
        ['u = apartment direction', C.ink],
        ['v = feature direction', C.ink]
      ],
      RESULT
    ),

    ...say('CENTERED TABLE = SUM OF PATTERNS', RESULT)
  );

  await play(
    ...updateCells(X),

    updateTitle(
      'EXACTLY REBUILT TABLE X',
      RESULT
    )
  );

  // ------------------------------------------------------------
  // Low-rank approximation
  //
  // Keep only the strongest pattern:
  //
  //           [ 0   4 ]
  // X_rank1 = [ 0  -8 ]
  //           [ 0   4 ]
  //
  // This leaves out the area differences entirely.
  //
  // The omitted matrix is the area sheet:
  //
  //         [ -3  0 ]
  // Error = [  0  0 ]
  //         [  3  0 ]
  //
  // Total squared reconstruction error = 18.
  // ------------------------------------------------------------

  const approximationPatterns = patternCards();

  const keepTag = tagAt(
    'KEEP',
    RESULT,
    [
      CX + 1.62,
      CY + (P ? 0.91 : 0.84) - 0.56,
      0
    ],
    15,
    1.00
  );

  const omitTag = tagAt(
    'OMIT',
    WARN,
    [
      CX + 1.62,
      CY - (P ? 0.91 : 0.84) - 0.56,
      0
    ],
    15,
    1.00
  );

  // ============================================================
  // 45-47: Keep the strongest pattern for a smaller sketch
  // ============================================================

  // 45. Use the split to make a smaller sketch
  //     by keeping the strongest pattern.
  await until(S(45));

  await play(
    ...replaceMain(
      [
        ...approximationPatterns.parts,
        keepTag,
        omitTag
      ],
      1.20,
      0.12
    ),

    ...fbox(
      [
        ['KEEP ONE PATTERN', RESULT],
        ['First: age, strength √96', AGE],
        ['Leave out: area, strength √18', AREA],
        ['A smaller sketch of the table.', C.ink]
      ],
      RESULT
    ),

    ...say('KEEP ONLY THE STRONGEST PATTERN', RESULT)
  );

  // 46. Keeping the age sheet here leaves out
  //     the whole area column.
  await until(S(46));

  await play(
    ...showTable(
      AGE_SHEET,
      {
        title: 'ONE-PATTERN APPROXIMATION',
        color: AGE,
        muteZero: true
      }
    ),

    ...mark([
      columnOutline(0, WARN)
    ]),

    ...fbox(
      [
        ['KEEP THE AGE SHEET', AGE],
        ['Age differences are preserved.', AGE],
        ['Area differences become zero.', AREA],
        ['The reconstruction is approximate.', WARN]
      ],
      WARN
    ),

    ...say('KEEP AGE, LOSE AREA DIFFERENCES', WARN)
  );

  // 47. The omitted column has squared length eighteen.
  await until(S(47));

  await play(
    ...clearMarks(),

    ...showTable(
      AREA_SHEET,
      {
        title: 'OMITTED INFORMATION',
        color: WARN,
        muteZero: true
      }
    ),

    ...mark([
      columnOutline(0, AREA)
    ]),

    ...fbox(
      [
        ['OMITTED AREA COLUMN', AREA],
        ['(−3, 0, 3)', AREA],
        ['Squared error:', WARN],
        ['(−3)² + 0² + 3² = 18', STRENGTH]
      ],
      WARN
    ),

    ...say('OMITTED SQUARED LENGTH = 18', WARN)
  );

  // ------------------------------------------------------------
  // Common trap: pattern strength is not feature importance.
  //
  // SVD ranks variation measured in the supplied units.
  // It does not know the renter's preferences or the
  // usefulness of a feature for predicting rent.
  // ------------------------------------------------------------

  const warningStrengths = strengthPicture(
    true
  );

  // ============================================================
  // 48-49: Explain why units matter
  // ============================================================

  // 48. Watch out for treating age as more important
  //     just because its pattern is stronger here.
  await until(S(48));

  await play(
    ...clearMarks(),

    ...replaceMain(
      warningStrengths.parts,
      1.0,
      0.10
    ),

    ...fbox(
      [
        ['WATCH OUT', WARN],
        ['Stronger pattern ≠ more important.', C.ink],
        ['Strength measures variation.', STRENGTH],
        ['It does not measure renter preference.', C.muted]
      ],
      WARN
    ),

    ...say('PATTERN STRENGTH IS NOT IMPORTANCE', WARN)
  );

  // ------------------------------------------------------------
  // Unit-change demonstration
  //
  // Original centered area counts use 10 m² chunks.
  //
  // (-3, 0, 3) chunks
  // becomes
  // (-30, 0, 30) square metres.
  //
  // New squared area length:
  // 900 + 0 + 900 = 1800
  //
  // New area strength:
  // sqrt(1800) ≈ 42.43
  //
  // Age strength stays sqrt(96) ≈ 9.80.
  //
  // This is a unit-conversion illustration only.
  // The shared chapter data are not replaced.
  // ------------------------------------------------------------

  const changedUnitStrengths = strengthPicture(
    true,
    true
  );

  // 49. Counting area in different units can change
  //     which strength is larger.
  await until(S(49));

  await play(
    ...replaceMain(
      changedUnitStrengths.parts,
      1.25,
      0.12
    ),

    ...fbox(
      [
        ['SAME APARTMENTS, NEW AREA UNITS', WARN],
        ['Area chunks: (−3, 0, 3)', AREA],
        ['Single m²: (−30, 0, 30)', AREA],
        ['Area strength: √1800 ≈ 42.43', AREA],
        ['Age strength: √96 ≈ 9.80', AGE],
        ['The ranking can change.', WARN]
      ],
      WARN
    ),

    ...say('CHANGE THE UNITS, CHANGE THE STRENGTHS', WARN)
  );

  // ------------------------------------------------------------
  // Try it preview
  //
  // Restore the original chapter units and exact centered
  // table for the exercise prompts.
  //
  // The actual interactive controls belong to Try it.
  // No unrelated data set is introduced during narration.
  // ------------------------------------------------------------

  // ============================================================
  // 50-52: Visual prompts for Try it
  // ============================================================

  // 50. In Try it, rebuild the table from both sheets.
  await until(S(50));

  await play(
    ...showTable(
      X,
      {
        title: 'TRY IT: REBUILD THE TABLE',
        color: RESULT
      }
    ),

    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Restore the age sheet.', AGE],
        ['Restore the area sheet.', AREA],
        ['Add the matching spots.', C.ink],
        ['Check every original entry.', RESULT]
      ],
      RESULT
    ),

    ...say('TRY IT: REBUILD FROM BOTH SHEETS', RESULT)
  );

  // 51. Then predict which column disappears
  //     when you turn off the area sheet.
  await until(S(51));

  await play(
    new M.Indicate(
      table.frame,
      { color: PATTERN }
    ),

    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Turn off the area sheet.', AREA],
        ['Which column becomes zero?', WARN],
        ['Which column stays unchanged?', C.ink]
      ],
      PATTERN
    ),

    ...say('TRY IT: TURN OFF THE AREA PATTERN', PATTERN)
  );

  // 52. Tap New data to split a fresh centered table.
  await until(S(52));

  await play(
    new M.LaggedStart(
      table.labels.map(label =>
        new M.Indicate(
          label,
          { color: RESULT }
        )
      ),
      {
        lagRatio: 0.23,
        runTime: 1.45
      }
    ),

    ...fbox(
      [
        ['TRY IT', RESULT],
        ['Tap New data.', C.ink],
        ['Find the new centered table.', PATTERN],
        ['Compare its ranked patterns.', STRENGTH],
        ['Try a one-pattern sketch.', RESULT]
      ],
      RESULT
    ),

    ...say('NEW DATA: SPLIT A FRESH TABLE', RESULT)
  );

  // ------------------------------------------------------------
  // Final pattern comparison
  //
  // Return to the actual ranked patterns:
  //
  // 1. Age direction, strength sqrt(96).
  // 2. Area direction, strength sqrt(18).
  //
  // Both patterns reconstruct the table exactly.
  // Keeping only the first gives a smaller approximation.
  // ------------------------------------------------------------

  const finalPatterns = patternCards();

  // ============================================================
  // 53: Final takeaway
  // ============================================================

  // 53. Singular value decomposition ranks separate
  //     directions so you can rebuild a table or keep
  //     its strongest patterns.
  await until(S(53));

  await play(
    ...replaceMain(
      finalPatterns.parts,
      1.35,
      0.25
    ),

    ...fbox(
      [
        ['SINGULAR VALUE DECOMPOSITION', PATTERN],
        ['Rank 1: age, √96', AGE],
        ['Rank 2: area, √18', AREA],
        ['Table = age sheet + area sheet', C.ink],
        ['Keep both → exact reconstruction', RESULT],
        ['Keep strongest → smaller sketch', STRENGTH]
      ],
      RESULT
    ),

    ...say('SVD: SPLIT, RANK, REBUILD OR SIMPLIFY', RESULT)
  );
}
