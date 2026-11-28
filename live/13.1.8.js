// lesson 13.1.8
// Support vector machines: finding the widest separating strip.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data and three specified candidates.
// The candidate search illustrates the geometry and SVM objective;
// it is not a general-purpose SVM training algorithm.
// Try it beats preview the separate interactive activity.
// New data uses a hypothetical apple inside the plum convex hull.
// Written against the supplied engine interface; browser runtime not tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // COURSE COLOURS AND RESPONSIVE LAYOUT
  // ============================================================

  const PLUM = C.violet || '#A78BFA';
  const APPLE = C.orange || '#FB923C';
  const WHITE = '#FFFFFF';
  const GOLD = C.amber;
  const CYAN = C.cyan;
  const GREEN = C.green;
  const RED = '#F87171';

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, 0.55, 0];

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  // Keep horizontal and vertical grid units equal.
  //
  // Phone reserves the lower area for the objective curve.
  // Laptop places the objective curve below the formula box.

  const U = P ? 0.54 : 0.42;

  const XMAX = 8.5;
  const YMAX = 8.5;

  const XL = CX - XMAX * U / 2;
  const YB = P ? -3.25 : -2.40;

  const XR = XL + XMAX * U;
  const YT = YB + YMAX * U;

  const X = x => XL + x * U;
  const Y = y => YB + y * U;

  const xy = (x, y) => [X(x), Y(y), 0];

  const FR = P ? 0.125 : 0.105;

  const HUE = [
    '#EF4444',
    '#F97316',
    '#FB923C',
    '#FBBF24',
    '#FACC15',
    '#A3E635',
    '#65A30D',
    '#22C55E'
  ];

  // ============================================================
  // EXACT SHARED CHAPTER DATA
  // ============================================================

  const DATA = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 150, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 100, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 100, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 }
  ];

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const weightUnits = grams => grams / 50;

  const coordinates = d => [
    weightUnits(d.weight),
    d.hue
  ];

  const positionOf = d =>
    xy(...coordinates(d));

  const colorOf = label =>
    label === 'plum' ? PLUM : APPLE;

  const QX = weightUnits(NEW_FRUIT.weight);
  const QY = NEW_FRUIT.hue;

  const PLUM_SUPPORT = DATA.find(
    d => d.id === 'P2'
  );

  const APPLE_SUPPORT = DATA.find(
    d => d.id === 'A1'
  );

  const PLUM_INDEX = DATA.indexOf(
    PLUM_SUPPORT
  );

  const APPLE_INDEX = DATA.indexOf(
    APPLE_SUPPORT
  );

  const LEFT_GRAMS = Math.max(
    ...DATA
      .filter(d => d.label === 'plum')
      .map(d => d.weight)
  );

  const RIGHT_GRAMS = Math.min(
    ...DATA
      .filter(d => d.label === 'apple')
      .map(d => d.weight)
  );

  const LEFT_X = weightUnits(LEFT_GRAMS);
  const RIGHT_X = weightUnits(RIGHT_GRAMS);

  const OPTIMAL_GRAMS =
    (LEFT_GRAMS + RIGHT_GRAMS) / 2;

  const OPTIMAL_X =
    weightUnits(OPTIMAL_GRAMS);

  // ============================================================
  // CANDIDATE BOUNDARY CALCULATIONS
  // ============================================================

  function fmt(n, places = 4) {
    const v = Number(n.toFixed(places));

    return v < 0
      ? '−' + String(Math.abs(v))
      : String(v);
  }

  function candidate(
    grams,
    data = DATA
  ) {
    const left = Math.max(
      ...data
        .filter(d => d.label === 'plum')
        .map(d => d.weight)
    );

    const right = Math.min(
      ...data
        .filter(d => d.label === 'apple')
        .map(d => d.weight)
    );

    // Use gram differences before converting to grid units.
    // This avoids unnecessary subtraction of decimal weights.

    const leftGapG = grams - left;
    const rightGapG = right - grams;

    const leftGap = leftGapG / 50;
    const rightGap = rightGapG / 50;

    const marginG = Math.min(
      leftGapG,
      rightGapG
    );

    const margin = marginG / 50;

    const valid =
      leftGapG > 0 &&
      rightGapG > 0;

    const weight = valid
      ? 1 / margin
      : Infinity;

    const objective = valid
      ? weight * weight / 2
      : Infinity;

    return {
      grams,
      x: weightUnits(grams),

      leftGapG,
      rightGapG,

      leftGap,
      rightGap,

      marginG,
      margin,

      widthG: valid ? 2 * marginG : 0,
      width: valid ? 2 * margin : 0,

      weight,
      objective,

      valid,

      low: valid
        ? weightUnits(grams - marginG)
        : weightUnits(grams),

      high: valid
        ? weightUnits(grams + marginG)
        : weightUnits(grams)
    };
  }

  const I1 = candidate(160);
  const I2 = candidate(170);
  const I3 = candidate(175);

  const SEARCH = [
    I1,
    I2,
    I3
  ];

  // Checked results:
  //
  // Iteration 1:
  // x = 3.2
  // nearest gaps = 0.2, 0.8
  // margin = 0.2
  // width = 0.4 = 20 grams
  // |w| = 5
  // objective = 12.5
  //
  // Iteration 2:
  // x = 3.4
  // nearest gaps = 0.4, 0.6
  // margin = 0.4
  // width = 0.8 = 40 grams
  // |w| = 2.5
  // objective = 3.125
  //
  // Iteration 3:
  // x = 3.5
  // nearest gaps = 0.5, 0.5
  // margin = 0.5
  // width = 1 = 50 grams
  // |w| = 2
  // objective = 2

  function classificationScore(
    d,
    setting = I3
  ) {
    return setting.weight * (
      weightUnits(d.weight) -
      setting.x
    );
  }

  function prediction(d, setting = I3) {
    const score = classificationScore(
      d,
      setting
    );

    if (Math.abs(score) < 1e-12) {
      return 'boundary';
    }

    return score < 0
      ? 'plum'
      : 'apple';
  }

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(
    s,
    size,
    color,
    p,
    mono = false
  ) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function fittedText(
    s,
    size,
    color,
    p,
    maxw,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function line(
    start,
    end,
    color = C.muted,
    width = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function dashed(
    start,
    end,
    color = C.muted
  ) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function rect(
    w,
    h,
    p,
    color,
    opacity = 0,
    stroke = 2
  ) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.001),
      height: Math.max(h, 0.001),
      color,
      strokeWidth: stroke
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    w,
    h,
    p,
    color,
    opacity = 0.92
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(
    s,
    color,
    p,
    size = 17
  ) {
    const t = pill(
      s,
      color,
      size
    );

    t.moveTo(p);

    return t;
  }

  function reveal(
    objects,
    runTime = 1.0,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(
      objects.map(o =>
        new M.FadeIn(o)
      ),
      {
        lagRatio,
        runTime
      }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o =>
        new M.FadeOut(o)
      );
  }

  function ring(
    p,
    color = GOLD,
    radius = FR * 2.1
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2.2
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
  }

  function dot(
    p,
    color,
    radius = 0.055
  ) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return d;
  }

  // ============================================================
  // ONE FORMULA / INFORMATION BOX
  // ============================================================

  let boxNow = null;

  function fbox(
    lines,
    color = CYAN
  ) {
    const size = P ? 20 : 21;
    const lh = P ? 0.33 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(
        s.trimStart(),
        size,
        c,
        true
      )
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return (
        t.getWidth() +
        cw * indent
      );
    });

    const wd =
      Math.max(...widths) + 0.65;

    const ht =
      rows.length * lh + 0.30;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 -
      0.15 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left +
        indent +
        t.getWidth() / 2,

        top - i * lh,

        0
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P
      ? FW - 0.90
      : 4.00;

    const maxh = P
      ? 1.36
      : 1.65;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    animations.push(
      new M.FadeIn(g)
    );

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

  // ============================================================
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function fruit(
    label,
    p,
    r = FR
  ) {
    const color = colorOf(label);

    const halo = new M.Dot({
      point: p,
      radius: r * 1.65,
      color
    });

    halo.setFill(color, 0.14);

    let body;

    if (label === 'plum') {
      body = new M.Circle({
        radius: r,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.96);
      body.moveTo(p);

    } else {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.96);
      body.moveTo(p);
    }

    return new M.VGroup(
      halo,
      body
    );
  }

  function unknown(
    p,
    r = FR * 1.20
  ) {
    const halo = new M.Dot({
      point: p,
      radius: r * 1.85,
      color: WHITE
    });

    halo.setFill(WHITE, 0.12);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.40,
      color: WHITE
    });

    inner.setFill(WHITE, 0.16);

    const body = new M.Rectangle({
      width: r * Math.sqrt(2),
      height: r * Math.sqrt(2),
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 1);
    body.rotate(Math.PI / 4);
    body.moveTo(p);

    return new M.VGroup(
      halo,
      inner,
      body
    );
  }

  function plotPoints(
    data = DATA
  ) {
    return data.map(d =>
      fruit(
        d.label,
        positionOf(d)
      )
    );
  }

  // ============================================================
  // INTRODUCTORY VISUAL
  // ============================================================

  const INTRO_Y = P ? -0.75 : -0.45;

  function introduction() {
    const parts = [];

    const dx = P ? 1.48 : 1.35;

    const w = P ? 2.40 : 2.25;

    const h = 1.65;

    COLORS_FOR_INTRO:
    for (let i = 0; i < 2; i++) {
      const label = i === 0
        ? 'plum'
        : 'apple';

      const color = colorOf(
        label
      );

      const x = CX +
        (i === 0 ? -dx : dx);

      parts.push(
        rounded(
          w,
          h,
          [x, INTRO_Y, 0],
          color,
          0.94
        )
      );

      parts.push(
        text(
          label.toUpperCase() + 'S',
          19,
          color,
          [x, INTRO_Y + 0.57, 0],
          true
        )
      );

      for (let j = 0; j < 4; j++) {
        const xx =
          x + (
            (j % 2) - 0.5
          ) * 0.62;

        const yy =
          INTRO_Y + 0.13 -
          Math.floor(j / 2) * 0.48;

        parts.push(
          fruit(
            label,
            [xx, yy, 0],
            FR * 1.35
          )
        );
      }
    }

    parts.push(
      text(
        'FRUIT SORTER',
        20,
        C.ink,
        [
          CX,
          INTRO_Y + 1.26,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  const intro = introduction();

  const introLines = [
    -0.17,
    0,
    0.17
  ].map(offset =>
    dashed(
      [
        CX + offset,
        INTRO_Y - 0.83,
        0
      ],

      [
        CX + offset,
        INTRO_Y + 0.83,
        0
      ],

      GOLD
    )
  );

  // ============================================================
  // WEIGHT–HUE DRAWING
  // ============================================================

  function graphGrid() {
    const parts = [];

    for (let x = 1; x <= 8; x++) {
      parts.push(
        line(
          xy(x, 0),
          xy(x, YMAX),
          C.muted,
          0.65
        )
      );
    }

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          xy(0, y),
          xy(XMAX, y),
          C.muted,
          0.65
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  function horizontalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XR, YB, 0],
        C.muted,
        2.5
      )
    ];

    for (let x = 0; x <= 8; x++) {
      parts.push(
        line(
          [X(x), YB - 0.045, 0],
          [X(x), YB + 0.045, 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(x * 50),
          P ? 13 : 12,
          C.muted,
          [
            X(x),
            YB - 0.17,
            0
          ],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        P ? 16 : 15,
        C.ink,
        [
          (XL + XR) / 2,
          YB - 0.40,
          0
        ]
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function verticalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XL, YT, 0],
        C.muted,
        2.5
      )
    ];

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          [XL - 0.045, Y(y), 0],
          [XL + 0.045, Y(y), 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(y),
          P ? 14 : 13,
          C.muted,
          [
            XL - 0.18,
            Y(y),
            0
          ],
          true
        )
      );
    }

    parts.push(
      text(
        'Hue ↑',
        P ? 16 : 15,
        C.ink,
        [
          XL - 0.37,
          YT + 0.18,
          0
        ]
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function verticalStrip() {
    const sx = XL - 0.60;

    const parts = [];

    HUE.forEach((color, i) => {
      parts.push(
        rect(
          P ? 0.22 : 0.19,
          U * 0.98,
          [
            sx,
            Y(i + 1),
            0
          ],
          color,
          1,
          0
        )
      );
    });

    parts.push(
      text(
        'green',
        11,
        HUE[7],
        [
          sx,
          Y(8) + U * 0.72,
          0
        ]
      )
    );

    parts.push(
      text(
        'red',
        11,
        HUE[0],
        [
          sx,
          Y(1) - U * 0.72,
          0
        ]
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function graphParts() {
    return [
      graphGrid(),
      horizontalAxis(),
      verticalAxis(),
      verticalStrip()
    ];
  }

  let graph = graphParts();

  let points = plotPoints(DATA);

  // ============================================================
  // HIGHLIGHT THE TWO CLOSEST OPPOSING FRUITS
  // ============================================================

  const plumRing = ring(
    positionOf(PLUM_SUPPORT),
    PLUM
  );

  const appleRing = ring(
    positionOf(APPLE_SUPPORT),
    APPLE
  );

  const plumSupportLabel = tag(
    'P2: 150 g',
    PLUM,
    [
      X(LEFT_X) - 0.35,
      Y(3) - 0.39,
      0
    ],
    P ? 14 : 12
  );

  const appleSupportLabel = tag(
    'A1: 200 g',
    APPLE,
    [
      X(RIGHT_X) + 0.42,
      Y(3) - 0.39,
      0
    ],
    P ? 14 : 12
  );

  function horizontalMeasure(
    x1,
    x2,
    y,
    label,
    color = GOLD,
    labelOffset = 0.19
  ) {
    const a = X(x1);
    const b = X(x2);

    const yy = Y(y);

    return new M.VGroup(
      line(
        [a, yy, 0],
        [b, yy, 0],
        color,
        2.4
      ),

      line(
        [a, yy - 0.065, 0],
        [a, yy + 0.065, 0],
        color,
        1.8
      ),

      line(
        [b, yy - 0.065, 0],
        [b, yy + 0.065, 0],
        color,
        1.8
      ),

      text(
        label,
        P ? 15 : 13,
        color,
        [
          (a + b) / 2,
          yy + labelOffset,
          0
        ],
        true
      )
    );
  }

  const totalGap = horizontalMeasure(
    LEFT_X,
    RIGHT_X,
    4.65,
    '50 g',
    GOLD
  );

  const sameHueLine = dashed(
    xy(0, 3),
    xy(XMAX, 3),
    CYAN
  );

  const opposingConnector = line(
    positionOf(PLUM_SUPPORT),
    positionOf(APPLE_SUPPORT),
    GOLD,
    2.4
  );

  // ============================================================
  // CANDIDATE LINES, WALKING PATHS AND MARGINS
  // ============================================================

  function verticalBoundary(
    x,
    color = GOLD,
    width = 3
  ) {
    return line(
      xy(x, 0),
      xy(x, YMAX),
      color,
      width
    );
  }

  function boundaryLabel(
    grams
  ) {
    return tag(
      `${fmt(grams)} g`,
      GOLD,
      [
        X(weightUnits(grams)),
        YT + 0.25,
        0
      ],
      P ? 15 : 14
    );
  }

  // The strip refers to measurement points.
  // Fruit-symbol radii are visual markers, not physical sizes.

  function stripShape(
    setting,
    includeRegions = true
  ) {
    const cy = (YT + YB) / 2;
    const h = YT - YB;

    const centre = X(
      setting.x
    );

    const low = X(
      setting.low
    );

    const high = X(
      setting.high
    );

    const parts = [];

    if (includeRegions) {
      parts.push(
        rect(
          centre - XL,
          h,
          [
            (XL + centre) / 2,
            cy,
            0
          ],
          PLUM,
          0.075,
          0
        ),

        rect(
          XR - centre,
          h,
          [
            (centre + XR) / 2,
            cy,
            0
          ],
          APPLE,
          0.075,
          0
        )
      );
    }

    if (setting.valid) {
      parts.push(
        rect(
          high - low,
          h,
          [
            (low + high) / 2,
            cy,
            0
          ],
          CYAN,
          0.23,
          0
        ),

        dashed(
          xy(setting.low, 0),
          xy(setting.low, YMAX),
          CYAN
        ),

        dashed(
          xy(setting.high, 0),
          xy(setting.high, YMAX),
          CYAN
        )
      );
    }

    parts.push(
      verticalBoundary(
        setting.x
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function walkingPath(
    x,
    halfWidth
  ) {
    const w =
      2 * halfWidth * U;

    const cy =
      (YT + YB) / 2;

    const parts = [
      rect(
        w,
        YT - YB,
        [
          X(x),
          cy,
          0
        ],
        CYAN,
        0.23,
        1
      ),

      dashed(
        xy(x - halfWidth, 0),
        xy(x - halfWidth, YMAX),
        CYAN
      ),

      dashed(
        xy(x + halfWidth, 0),
        xy(x + halfWidth, YMAX),
        CYAN
      )
    ];

    // Simple footprints: paired short marks.
    // Their size is proportional to the displayed path width.

    for (let k = 0; k < 5; k++) {
      const yy =
        0.85 + k * 1.36;

      const offset =
        (k % 2 ? 1 : -1) *
        halfWidth * 0.36;

      const footW = Math.min(
        w * 0.29,
        0.09
      );

      parts.push(
        rect(
          footW,
          0.14,
          xy(x + offset, yy),
          WHITE,
          0.72,
          0
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  let boundaryNow = null;
  let boundaryTagNow = null;
  let stripNow = null;

  function clearBoundary() {
    const animations = remove([
      boundaryNow,
      boundaryTagNow,
      stripNow
    ]);

    boundaryNow = null;
    boundaryTagNow = null;
    stripNow = null;

    return animations;
  }

  function showBareBoundary(
    setting
  ) {
    const animations =
      clearBoundary();

    boundaryNow =
      verticalBoundary(setting.x);

    boundaryTagNow =
      boundaryLabel(setting.grams);

    return [
      ...animations,

      new M.Create(
        boundaryNow
      ),

      new M.FadeIn(
        boundaryTagNow
      )
    ];
  }

  function showStrip(
    setting
  ) {
    const nextStrip =
      stripShape(setting);

    const nextLabel =
      boundaryLabel(
        setting.grams
      );

    const animations =
      clearBoundary();

    stripNow = nextStrip;
    boundaryTagNow = nextLabel;

    return [
      ...animations,

      new M.FadeIn(
        stripNow,
        {
          runTime: 0.95
        }
      ),

      new M.FadeIn(
        boundaryTagNow
      )
    ];
  }

  function moveStrip(
    setting,
    runTime = 1.15
  ) {
    if (
      !stripNow ||
      !boundaryTagNow
    ) {
      return showStrip(
        setting
      );
    }

    return [
      new M.Transform(
        stripNow,
        stripShape(setting),
        { runTime }
      ),

      new M.Transform(
        boundaryTagNow,
        boundaryLabel(
          setting.grams
        ),
        { runTime }
      )
    ];
  }

  // ============================================================
  // GAP AND STRIP WIDTH MEASUREMENTS
  // ============================================================

  // Small candidate gaps can be narrower than a text label.
  // Keep measurement labels separated in fixed positions,
  // connected to their exact geometric intervals by leaders.

  function gapMeasurement(
    x1,
    x2,
    label,
    color,
    side
  ) {
    const yy = Y(4.65);

    const a = X(x1);
    const b = X(x2);

    const mid =
      (a + b) / 2;

    const labelX =
      X(3.5) +
      side * (P ? 0.92 : 0.82);

    const labelY =
      Y(5.90);

    return new M.VGroup(
      line(
        [a, yy, 0],
        [b, yy, 0],
        color,
        2.5
      ),

      line(
        [a, yy - 0.06, 0],
        [a, yy + 0.06, 0],
        color,
        1.8
      ),

      line(
        [b, yy - 0.06, 0],
        [b, yy + 0.06, 0],
        color,
        1.8
      ),

      line(
        [mid, yy, 0],
        [
          labelX,
          labelY - 0.14,
          0
        ],
        color,
        1.2
      ),

      tag(
        label,
        color,
        [
          labelX,
          labelY,
          0
        ],
        P ? 15 : 13
      )
    );
  }

  function gapMarks(
    setting,
    units = 'grams'
  ) {
    const leftLabel =
      units === 'grams'
        ? `${fmt(setting.leftGapG)} g`
        : `${fmt(setting.leftGap)} units`;

    const rightLabel =
      units === 'grams'
        ? `${fmt(setting.rightGapG)} g`
        : `${fmt(setting.rightGap)} units`;

    return [
      gapMeasurement(
        LEFT_X,
        setting.x,
        leftLabel,
        PLUM,
        -1
      ),

      gapMeasurement(
        setting.x,
        RIGHT_X,
        rightLabel,
        APPLE,
        1
      )
    ];
  }

  let gapsNow = [];

  function setGaps(
    setting,
    units = 'grams'
  ) {
    const next =
      gapMarks(
        setting,
        units
      );

    const animations =
      remove(gapsNow);

    gapsNow = next;

    return [
      ...animations,

      reveal(
        gapsNow,
        0.85,
        0.12
      )
    ];
  }

  function clearGaps() {
    const animations =
      remove(gapsNow);

    gapsNow = [];

    return animations;
  }

  function stripWidthMark(
    setting
  ) {
    const a = X(
      setting.low
    );

    const b = X(
      setting.high
    );

    const yy = Y(7.10);

    const labelY = Y(7.85);

    const mid = (a + b) / 2;

    return new M.VGroup(
      line(
        [a, yy, 0],
        [b, yy, 0],
        GOLD,
        2.6
      ),

      line(
        [a, yy - 0.065, 0],
        [a, yy + 0.065, 0],
        GOLD,
        2
      ),

      line(
        [b, yy - 0.065, 0],
        [b, yy + 0.065, 0],
        GOLD,
        2
      ),

      line(
        [mid, yy, 0],
        [mid, labelY - 0.16, 0],
        GOLD,
        1.2
      ),

      tag(
        `WIDTH = ${fmt(setting.widthG)} g`,
        GOLD,
        [mid, labelY, 0],
        P ? 15 : 13
      )
    );
  }

  let widthNow = null;

  function setWidth(
    setting
  ) {
    const next =
      stripWidthMark(setting);

    const animations =
      remove([widthNow]);

    widthNow = next;

    return [
      ...animations,

      new M.FadeIn(
        widthNow
      )
    ];
  }

  function clearWidth() {
    const animations =
      remove([widthNow]);

    widthNow = null;

    return animations;
  }

  function marginMeasure(
    setting,
    side = -1
  ) {
    const start =
      side < 0
        ? setting.low
        : setting.x;

    const end =
      side < 0
        ? setting.x
        : setting.high;

    return horizontalMeasure(
      start,
      end,
      1.65,
      'm',
      CYAN,
      -0.19
    );
  }

  // ============================================================
  // ITERATION COUNTER AND SEARCH STATE
  // ============================================================

  function iterationTag(
    iteration,
    s = null
  ) {
    return tag(
      s || `ITERATION ${iteration}`,
      CYAN,
      [
        XR - 0.80,
        YT + 0.23,
        0
      ],
      P ? 16 : 13
    );
  }

  let iterationNow = null;

  function setIteration(
    iteration,
    s = null
  ) {
    const next =
      iterationTag(
        iteration,
        s
      );

    const animations =
      remove([iterationNow]);

    iterationNow = next;

    return [
      ...animations,

      new M.FadeIn(
        iterationNow
      )
    ];
  }

  function clearIteration() {
    const animations =
      remove([iterationNow]);

    iterationNow = null;

    return animations;
  }

  function searchBox(
    setting,
    iteration,
    includeObjective = false
  ) {
    return fbox([
      [
        `ITERATION ${iteration}: ${fmt(setting.grams)} g`,
        CYAN
      ],

      [
        `gaps: ${fmt(setting.leftGap)} and ${fmt(setting.rightGap)}`,
        C.ink
      ],

      [
        `margin = ${fmt(setting.margin)} units`,
        CYAN
      ],

      [
        includeObjective
          ? `objective = ${fmt(setting.objective)}`
          : `strip width = ${fmt(setting.widthG)} g`,
        GOLD
      ]
    ], GOLD);
  }

  // ============================================================
  // GROWING OBJECTIVE CURVE
  // ============================================================

  // A fixed vertical scale is used for all three iterations.
  // No artificial fourth iteration or invented optimisation
  // result is appended to the curve.

  const CHART = P
    ? {
        x0: -2.45,
        x1: 2.65,
        y0: -6.30,
        y1: -5.30
      }
    : {
        x0: 2.75,
        x1: 6.05,
        y0: -3.10,
        y1: -1.85
      };

  const OBJECTIVE_MAX = 14;

  function chartX(i) {
    return (
      CHART.x0 +
      0.34 +
      i / 3 * (
        CHART.x1 -
        CHART.x0 -
        0.52
      )
    );
  }

  function chartY(value) {
    return (
      CHART.y0 +
      value / OBJECTIVE_MAX *
      (
        CHART.y1 -
        CHART.y0
      )
    );
  }

  function objectiveAxes() {
    const parts = [];

    const centerX =
      (CHART.x0 + CHART.x1) / 2;

    parts.push(
      text(
        'OBJECTIVE ↓',
        P ? 15 : 14,
        CYAN,
        [
          centerX,
          CHART.y1 + 0.24,
          0
        ],
        true
      )
    );

    parts.push(
      line(
        [
          CHART.x0,
          CHART.y0,
          0
        ],

        [
          CHART.x1,
          CHART.y0,
          0
        ],

        C.muted,
        1.6
      )
    );

    parts.push(
      line(
        [
          CHART.x0,
          CHART.y0,
          0
        ],

        [
          CHART.x0,
          CHART.y1,
          0
        ],

        C.muted,
        1.6
      )
    );

    for (const v of [0, 5, 10]) {
      const yy =
        chartY(v);

      parts.push(
        line(
          [
            CHART.x0,
            yy,
            0
          ],

          [
            CHART.x1,
            yy,
            0
          ],

          C.muted,
          0.65
        )
      );

      parts.push(
        text(
          String(v),
          P ? 12 : 11,
          C.muted,
          [
            CHART.x0 - 0.21,
            yy,
            0
          ],
          true
        )
      );
    }

    for (let i = 0; i < 3; i++) {
      const xx =
        chartX(i);

      parts.push(
        line(
          [
            xx,
            CHART.y0 - 0.035,
            0
          ],

          [
            xx,
            CHART.y0 + 0.035,
            0
          ],

          C.muted,
          1
        )
      );

      parts.push(
        text(
          String(i + 1),
          P ? 13 : 12,
          C.muted,
          [
            xx,
            CHART.y0 - 0.17,
            0
          ],
          true
        )
      );
    }

    parts.push(
      text(
        'Iteration →',
        P ? 13 : 12,
        C.muted,
        [
          CHART.x1 - 0.38,
          CHART.y0 - 0.17,
          0
        ]
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  let chartAxes = null;
  let chartPoints = [];
  let chartSegments = [];
  let chartHistory = [];

  function startObjectiveChart() {
    if (chartAxes) {
      return [];
    }

    chartAxes =
      objectiveAxes();

    return [
      new M.FadeIn(
        chartAxes
      )
    ];
  }

  function appendObjective(
    setting
  ) {
    if (!setting.valid) {
      return [];
    }

    const i =
      chartHistory.length;

    if (i >= 3) {
      return [];
    }

    const p = [
      chartX(i),
      chartY(setting.objective),
      0
    ];

    const color =
      Math.abs(
        setting.objective - 2
      ) < 1e-10
        ? GREEN
        : GOLD;

    const marker = new M.VGroup(
      dot(
        p,
        color,
        P ? 0.075 : 0.060
      ),

      text(
        fmt(setting.objective),
        P ? 15 : 13,
        color,
        [
          p[0] + (
            i === 0 ? 0.30 : 0.12
          ),

          p[1] + 0.16,

          0
        ],
        true
      )
    );

    const animations = [];

    if (i > 0) {
      const previous =
        chartHistory[i - 1];

      const segment = line(
        [
          chartX(i - 1),
          chartY(previous.objective),
          0
        ],

        p,

        CYAN,

        2.4
      );

      chartSegments.push(
        segment
      );

      animations.push(
        new M.Create(
          segment
        )
      );
    }

    chartHistory.push(
      setting
    );

    chartPoints.push(
      marker
    );

    animations.push(
      new M.FadeIn(
        marker
      )
    );

    return animations;
  }

  function clearObjectiveHistory() {
    const animations = [
      ...remove(chartPoints),
      ...remove(chartSegments)
    ];

    chartPoints = [];
    chartSegments = [];
    chartHistory = [];

    return animations;
  }

  function clearObjectiveChart() {
    const animations = [
      ...clearObjectiveHistory(),
      ...remove([chartAxes])
    ];

    chartAxes = null;

    return animations;
  }

  // ============================================================
  // TILTED BOUNDARY GEOMETRY
  // ============================================================

  // For any straight separating line with unit normal n,
  // the distance projected between the two support points
  // cannot exceed their Euclidean separation, which is 1.
  //
  // Therefore no separator can have margin greater than 0.5.
  //
  // A small illustrative tilt through the midpoint gives:
  //
  // margin = 0.5 cos(theta)
  //
  // For the chosen small tilt, P2 and A1 remain the
  // nearest fruits on their respective sides.

  function tiltedExample(
    theta
  ) {
    const center = [
      OPTIMAL_X,
      3
    ];

    const normal = [
      Math.cos(theta),
      Math.sin(theta)
    ];

    const nDotCenter =
      normal[0] * center[0] +
      normal[1] * center[1];

    function signedDistance(d) {
      const p = coordinates(d);

      return (
        normal[0] * p[0] +
        normal[1] * p[1] -
        nDotCenter
      );
    }

    const signedMargins =
      DATA.map(d => {
        const sign =
          d.label === 'plum'
            ? -1
            : 1;

        return sign *
          signedDistance(d);
      });

    const margin =
      Math.min(...signedMargins);

    function xAt(y, offset = 0) {
      return (
        nDotCenter +
        offset -
        normal[1] * y
      ) / normal[0];
    }

    const parts = [
      line(
        xy(xAt(0), 0),
        xy(xAt(YMAX), YMAX),
        GOLD,
        3.0
      ),

      dashed(
        xy(
          xAt(0, -margin),
          0
        ),

        xy(
          xAt(YMAX, -margin),
          YMAX
        ),

        CYAN
      ),

      dashed(
        xy(
          xAt(0, margin),
          0
        ),

        xy(
          xAt(YMAX, margin),
          YMAX
        ),

        CYAN
      )
    ];

    for (const d of [
      PLUM_SUPPORT,
      APPLE_SUPPORT
    ]) {
      const p =
        coordinates(d);

      const sd =
        signedDistance(d);

      const foot = [
        p[0] - sd * normal[0],
        p[1] - sd * normal[1]
      ];

      parts.push(
        line(
          xy(...p),
          xy(...foot),
          colorOf(d.label),
          2.5
        ),

        dot(
          xy(...foot),
          WHITE,
          0.035
        )
      );
    }

    parts.push(
      tag(
        `margin ≈ ${fmt(margin, 3)}`,
        GOLD,
        [
          X(4.8),
          Y(7.40),
          0
        ],
        P ? 15 : 13
      )
    );

    return {
      margin,

      group:
        new M.VGroup(
          ...parts
        )
    };
  }

  // ============================================================
  // SUPPORT VECTOR HIGHLIGHTS
  // ============================================================

  function supportHighlights() {
    return [
      ring(
        positionOf(PLUM_SUPPORT),
        GOLD,
        FR * 2.10
      ),

      ring(
        positionOf(APPLE_SUPPORT),
        GOLD,
        FR * 2.10
      )
    ];
  }

  function supportLabels() {
    return [
      tag(
        'SUPPORT P2',
        PLUM,
        [
          X(LEFT_X) - 0.68,
          Y(4.60),
          0
        ],
        P ? 14 : 12
      ),

      tag(
        'SUPPORT A1',
        APPLE,
        [
          X(RIGHT_X) + 0.68,
          Y(4.60),
          0
        ],
        P ? 14 : 12
      )
    ];
  }

  let supportNow = [];
  let supportTagsNow = [];

  function showSupports() {
    const animations = [
      ...remove(supportNow),
      ...remove(supportTagsNow)
    ];

    supportNow =
      supportHighlights();

    supportTagsNow =
      supportLabels();

    return [
      ...animations,

      reveal(
        supportNow,
        0.9,
        0.15
      ),

      reveal(
        supportTagsNow,
        0.9,
        0.15
      )
    ];
  }

  function clearSupports() {
    const animations = [
      ...remove(supportNow),
      ...remove(supportTagsNow)
    ];

    supportNow = [];
    supportTagsNow = [];

    return animations;
  }

  // ============================================================
  // ANIMATED TRY IT CONTROL PREVIEWS
  // ============================================================

  // These illustrate the controls mentioned in the narration.
  // They do not intercept browser pointer events or override
  // the engine's actual playback controls.

  const CONTROL_Y =
    P ? -4.40 : -0.80;
  const CTRL_X = P ? 0 : 4.3;

  function controlButton(
    label,
    x,
    active = false,
    width = 0.93
  ) {
    const color =
      active ? CYAN : C.muted;

    const body = rounded(
      width,
      0.32,
      [x, CONTROL_Y, 0],
      color,
      0.96
    );

    const title = fittedText(
      label,
      P ? 15 : 12,
      active ? WHITE : C.ink,
      [
        x,
        CONTROL_Y,
        0
      ],
      width - 0.12,
      true
    );

    return new M.VGroup(
      body,
      title
    );
  }

  function playbackControls(
    active = 'STEP',
    speed = 1
  ) {
    const buttons = [
      'STEP',
      'PLAY',
      'PAUSE',
      'RESET'
    ];

    const pitch =
      P ? 0.92 : 0.81;

    const parts = buttons.map(
      (label, i) =>
        controlButton(
          label,

          CTRL_X +
          (i - 1.5) * pitch,

          active === label,

          pitch * 0.91
        )
    );

    const sliderY =
      CONTROL_Y - 0.43;

    const sliderX0 =
      CTRL_X - 0.94;

    const sliderX1 =
      CTRL_X + 0.94;

    const fraction =
      (speed - 0.5) / 1.5;

    const knobX =
      sliderX0 +
      fraction *
      (
        sliderX1 -
        sliderX0
      );

    parts.push(
      text(
        'Speed',
        P ? 15 : 12,
        C.muted,
        [
          sliderX0 - 0.43,
          sliderY,
          0
        ]
      ),

      line(
        [
          sliderX0,
          sliderY,
          0
        ],

        [
          sliderX1,
          sliderY,
          0
        ],

        C.muted,
        2.8
      ),

      dot(
        [
          knobX,
          sliderY,
          0
        ],

        CYAN,

        0.075
      ),

      text(
        `${fmt(speed)}×`,
        P ? 14 : 12,
        CYAN,
        [
          sliderX1 + 0.30,
          sliderY,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  let controlsNow = null;

  function setControls(
    active,
    speed = 1
  ) {
    const next =
      playbackControls(
        active,
        speed
      );

    const animations =
      remove([controlsNow]);

    controlsNow = next;

    return [
      ...animations,

      new M.FadeIn(
        controlsNow
      )
    ];
  }

  function clearControls() {
    const animations =
      remove([controlsNow]);

    controlsNow = null;

    return animations;
  }

  function previewStep(
    setting,
    iteration
  ) {
    return [
      ...moveStrip(
        setting,
        0.95
      ),

      ...setIteration(
        iteration
      ),

      ...appendObjective(
        setting
      ),

      ...searchBox(
        setting,
        iteration,
        true
      )
    ];
  }

  // ============================================================
  // BEATS 0–2: WHICH SEPARATING LINE SHOULD WE CHOOSE?
  // ============================================================

  // 0. Our fruit sorter needs to separate plums and apples.

  await until(S(0));

  await play(
    new M.FadeIn(intro),

    ...fbox([
      ['FRUIT SORTER', CYAN],
      ['separate plums from apples', C.ink],
      ['using a straight line', GOLD]
    ]),

    ...say('SEPARATE PLUMS FROM APPLES')
  );

  // 1. Several different lines can separate the fruits.

  await until(S(1));

  await play(
    reveal(
      introLines,
      1.25,
      0.20
    ),

    ...fbox([
      ['MORE THAN ONE LINE', GOLD],
      ['can separate the same groups', C.ink],
      ['which one is best?', GOLD]
    ], GOLD),

    ...say('SEVERAL LINES CAN WORK', GOLD)
  );

  // 2. Which line should the machine choose?

  await until(S(2));

  await play(
    ...say(
      'WHICH LINE IS BEST?',
      GOLD
    )
  );

  // ============================================================
  // BEATS 3–7: FIND THE EMPTY SPACE
  // ============================================================

  // 3. Four plums and four apples on the familiar drawing.

  await until(S(3));

  await play(
    new M.FadeOut(intro),

    ...remove(introLines),

    ...clearBox(),

    reveal(
      graph,
      0.85,
      0.06
    ),

    reveal(
      points,
      1.30,
      0.07
    ),

    ...say('4 PLUMS AND 4 APPLES')
  );

  // 4. The heaviest plum weighs 150 grams.

  await until(S(4));

  await play(
    new M.Create(plumRing),

    new M.FadeIn(
      plumSupportLabel
    ),

    new M.Indicate(
      points[PLUM_INDEX],
      {
        color: PLUM
      }
    ),

    ...fbox([
      ['HEAVIEST PLUM: P2', PLUM],
      ['weight = 150 g', C.ink],
      ['grid x = 3', GOLD]
    ], PLUM),

    ...say('HEAVIEST PLUM = 150 g', PLUM)
  );

  // 5. The lightest apple weighs 200 grams.

  await until(S(5));

  await play(
    new M.Create(appleRing),

    new M.FadeIn(
      appleSupportLabel
    ),

    new M.Indicate(
      points[APPLE_INDEX],
      {
        color: APPLE
      }
    ),

    ...fbox([
      ['LIGHTEST APPLE: A1', APPLE],
      ['weight = 200 g', C.ink],
      ['grid x = 4', GOLD]
    ], APPLE),

    ...say('LIGHTEST APPLE = 200 g', APPLE)
  );

  // 6. Both fruits have hue 3.

  await until(S(6));

  await play(
    new M.Create(
      sameHueLine
    ),

    ...fbox([
      ['BOTH FRUITS', CYAN],
      ['P2: (3, 3)', PLUM],
      ['A1: (4, 3)', APPLE],
      ['same horizontal grid line', GOLD]
    ]),

    ...say('BOTH HAVE HUE 3')
  );

  // 7. Fifty grams of empty space between them.

  await until(S(7));

  await play(
    new M.Create(
      opposingConnector
    ),

    new M.FadeIn(
      totalGap
    ),

    ...fbox([
      ['EMPTY SPACE BETWEEN FRUITS', CYAN],
      ['200 − 150 = 50 grams', GOLD],
      ['one horizontal grid unit', C.ink]
    ], GOLD),

    ...say('50 g OF EMPTY SPACE', GOLD)
  );

  // ============================================================
  // BEATS 8–14: THE WIDEST WALKING PATH
  // ============================================================

  const narrowPath =
    walkingPath(
      OPTIMAL_X,
      0.15
    );

  const widePath =
    walkingPath(
      OPTIMAL_X,
      0.45
    );

  // 8. Imagine a walking path through the empty space.

  await until(S(8));

  await play(
    new M.FadeOut(
      sameHueLine
    ),

    new M.FadeOut(
      opposingConnector
    ),

    new M.FadeOut(
      totalGap
    ),

    new M.FadeOut(
      plumSupportLabel
    ),

    new M.FadeOut(
      appleSupportLabel
    ),

    new M.FadeIn(
      narrowPath
    ),

    ...fbox([
      ['IMAGINE A WALKING PATH', CYAN],
      ['between the two groups', C.ink],
      ['do not cross a fruit point', GOLD]
    ]),

    ...say('BUILD A PATH BETWEEN THE GROUPS')
  );

  // 9. A narrow path leaves little room for mistakes.

  await until(S(9));

  await play(
    new M.Indicate(
      narrowPath,
      {
        color: GOLD
      }
    ),

    ...fbox([
      ['NARROW PATH', GOLD],
      ['little room to move', C.ink],
      ['before reaching a fruit', C.ink]
    ], GOLD),

    ...say('NARROW PATH: LITTLE ROOM FOR ERROR', GOLD)
  );

  // 10. A wider path gives us more room.

  await until(S(10));

  await play(
    new M.Transform(
      narrowPath,
      widePath,
      {
        runTime: 1.3
      }
    ),

    ...fbox([
      ['WIDER PATH', CYAN],
      ['more room on both sides', C.ink],
      ['greater separation', GREEN]
    ], GREEN),

    ...say('WIDER PATH: MORE ROOM', GREEN)
  );

  // 11. Draw a centre line with equal space on either side.
  // Use an intermediate candidate before maximising the strip.

  const TEACHING_PATH =
    candidate(165);

  await until(S(11));

  await play(
    new M.FadeOut(
      narrowPath
    ),

    ...showStrip(
      TEACHING_PATH
    ),

    ...fbox([
      ['CENTRAL DIVIDING LINE', GOLD],
      ['equal strip width on both sides', CYAN]
    ]),

    ...say('AN EQUAL STRIP ON BOTH SIDES')
  );

  // 12. We want the strip as wide as possible.

  await until(S(12));

  await play(
    ...setWidth(
      TEACHING_PATH
    ),

    ...fbox([
      ['OUR GOAL', GOLD],
      ['make the empty strip', C.ink],
      ['as wide as possible', CYAN]
    ], GOLD),

    ...say('MAXIMISE THE EMPTY STRIP', GOLD)
  );

  // 13. Distance from the line to the nearest fruit = margin.

  const firstMargin =
    marginMeasure(
      TEACHING_PATH,
      -1
    );

  await until(S(13));

  await play(
    new M.FadeIn(
      firstMargin
    ),

    ...fbox([
      ['MARGIN', CYAN],
      ['line to nearest fruit', C.ink],
      ['strip width = 2 × margin', GOLD]
    ]),

    ...say('MARGIN = DISTANCE TO THE NEAREST FRUIT')
  );

  // 14. Name the hard-margin support vector machine.

  await until(S(14));

  await play(
    ...fbox([
      ['HARD-MARGIN SVM', CYAN],
      ['find a separating boundary', C.ink],
      ['with the largest margin', GOLD]
    ], GOLD),

    ...say('HARD-MARGIN SUPPORT VECTOR MACHINE')
  );

  // ============================================================
  // BEATS 15–16: INTRODUCE THE SEARCH
  // ============================================================

  // 15. Demonstrate a small illustrative candidate search.

  await until(S(15));

  await play(
    new M.FadeOut(
      firstMargin
    ),

    ...clearWidth(),

    ...clearBoundary(),

    ...fbox([
      ['ILLUSTRATIVE SEARCH', CYAN],
      ['try a candidate line', C.ink],
      ['measure its margin', C.ink],
      ['move towards a better line', GOLD]
    ]),

    ...say('SEARCH FOR A BETTER BOUNDARY')
  );

  // 16. Each attempt is an iteration.

  await until(S(16));

  await play(
    ...setIteration(
      0,
      'READY TO SEARCH'
    ),

    ...fbox([
      ['ITERATION', CYAN],
      ['one attempt to improve', C.ink],
      ['the current answer', GOLD]
    ]),

    ...say('ITERATION = ONE SEARCH ATTEMPT')
  );

  // ============================================================
  // BEATS 17–21: ITERATION 1
  // ============================================================

  // 17. Place the line at 160 grams.

  await until(S(17));

  await play(
    ...setIteration(1),

    ...showBareBoundary(I1),

    ...fbox([
      ['ITERATION 1', CYAN],
      ['candidate = 160 grams', GOLD],
      ['grid position = 3.2', C.ink]
    ]),

    ...say('ITERATION 1: LINE AT 160 g')
  );

  // 18. Nearest plum is 10 g away, apple 40 g away.

  await until(S(18));

  await play(
    ...setGaps(
      I1,
      'grams'
    ),

    ...fbox([
      ['LINE AT 160 g', GOLD],
      ['left gap: 160 − 150 = 10 g', PLUM],
      ['right gap: 200 − 160 = 40 g', APPLE]
    ], GOLD),

    ...say('GAPS: 10 g LEFT, 40 g RIGHT')
  );

  // 19. Convert the gaps into grid units.

  await until(S(19));

  await play(
    ...setGaps(
      I1,
      'units'
    ),

    ...fbox([
      ['ONE GRID UNIT = 50 g', CYAN],
      ['left: 10/50 = 0.2', PLUM],
      ['right: 40/50 = 0.8', APPLE]
    ]),

    ...say('GAPS IN GRID UNITS: 0.2 AND 0.8')
  );

  // 20. The smaller gap limits the margin to 0.2.

  const margin1 = marginMeasure(
    I1,
    -1
  );

  await until(S(20));

  await play(
    ...showStrip(I1),

    new M.FadeIn(
      margin1
    ),

    ...fbox([
      ['MARGIN = SMALLER GAP', CYAN],
      ['min(0.2, 0.8)', C.ink],
      ['= 0.2 grid units', GOLD]
    ], GOLD),

    ...say('MARGIN = 0.2', GOLD)
  );

  // 21. Equal margins give a total strip width of 20 g.

  await until(S(21));

  await play(
    new M.FadeOut(
      margin1
    ),

    ...setWidth(I1),

    ...searchBox(I1, 1),

    ...say('ITERATION 1: STRIP WIDTH = 20 g', GOLD)
  );

  // ============================================================
  // BEATS 22–25: ITERATION 2
  // ============================================================

  // 22. Move the line ten grams towards the apple.

  const move1 = horizontalMeasure(
    I1.x,
    I2.x,
    7.15,
    '+10 g',
    GOLD
  );

  const previous1 =
    verticalBoundary(
      I1.x,
      C.muted,
      1.6
    );

  await until(S(22));

  await play(
    ...clearWidth(),

    ...clearGaps(),

    ...setIteration(2),

    new M.FadeIn(
      previous1
    ),

    new M.FadeIn(
      move1
    ),

    ...moveStrip(
      I2,
      1.35
    ),

    ...fbox([
      ['ITERATION 2', CYAN],
      ['old line = 160 g', C.muted],
      ['move right by 10 g', GOLD],
      ['new line = 170 g', CYAN]
    ], GOLD),

    ...say('MOVE 10 g TOWARDS THE APPLE', GOLD)
  );

  // 23. The boundary is now at 170 grams.

  await until(S(23));

  await play(
    new M.FadeOut(
      previous1
    ),

    new M.FadeOut(
      move1
    ),

    ...fbox([
      ['160 + 10 = 170 grams', GOLD],
      ['grid position = 3.4', CYAN]
    ]),

    ...say('ITERATION 2: LINE AT 170 g')
  );

  // 24. Nearest gaps are now 20 and 30 grams.

  await until(S(24));

  await play(
    ...setGaps(
      I2,
      'grams'
    ),

    ...fbox([
      ['LINE AT 170 g', GOLD],
      ['left: 170 − 150 = 20 g', PLUM],
      ['right: 200 − 170 = 30 g', APPLE],
      ['gaps: 0.4 and 0.6 units', CYAN]
    ]),

    ...say('NEW GAPS: 20 g AND 30 g')
  );

  // 25. Margin grows to 0.4.
  // Strip width becomes 40 grams.

  await until(S(25));

  await play(
    ...setGaps(
      I2,
      'units'
    ),

    ...setWidth(
      I2
    ),

    ...fbox([
      ['MARGIN: 0.2 → 0.4', CYAN],
      ['width = 2 × 0.4 = 0.8 units', C.ink],
      ['width = 0.8 × 50 = 40 g', GOLD],
      ['twice the first strip width', GREEN]
    ], GREEN),

    ...say('ITERATION 2: STRIP WIDTH = 40 g', GREEN)
  );

  // ============================================================
  // BEATS 26–29: ITERATION 3
  // ============================================================

  // 26. Move the line another five grams towards the apple.

  const move2 = horizontalMeasure(
    I2.x,
    I3.x,
    7.15,
    '+5 g',
    GOLD
  );

  const previous2 =
    verticalBoundary(
      I2.x,
      C.muted,
      1.6
    );

  await until(S(26));

  await play(
    ...clearWidth(),

    ...clearGaps(),

    ...setIteration(3),

    new M.FadeIn(
      previous2
    ),

    new M.FadeIn(
      move2
    ),

    ...moveStrip(
      I3,
      1.35
    ),

    ...fbox([
      ['ITERATION 3', CYAN],
      ['old line = 170 g', C.muted],
      ['move right by 5 g', GOLD],
      ['new line = 175 g', CYAN]
    ], GOLD),

    ...say('MOVE ANOTHER 5 g RIGHT', GOLD)
  );

  // 27. The boundary is now at 175 grams.

  await until(S(27));

  await play(
    new M.FadeOut(
      previous2
    ),

    new M.FadeOut(
      move2
    ),

    ...fbox([
      ['170 + 5 = 175 grams', GOLD],
      ['grid position = 3.5', CYAN]
    ]),

    ...say('ITERATION 3: LINE AT 175 g')
  );

  // 28. Both gaps are 25 grams.

  await until(S(28));

  await play(
    ...setGaps(
      I3,
      'grams'
    ),

    ...fbox([
      ['LEFT: 175 − 150 = 25 g', PLUM],
      ['RIGHT: 200 − 175 = 25 g', APPLE],
      ['both gaps are equal', GOLD]
    ], GOLD),

    ...say('25 g ON BOTH SIDES', GOLD)
  );

  // 29. Margin 0.5, full strip width 50 g.

  await until(S(29));

  await play(
    ...setGaps(
      I3,
      'units'
    ),

    ...setWidth(
      I3
    ),

    ...fbox([
      ['MARGIN = 0.5 GRID UNITS', CYAN],
      ['width = 2 × 0.5 = 1 unit', C.ink],
      ['1 unit = 50 grams', GOLD],
      ['widest possible strip', GREEN]
    ], GREEN),

    ...say('MAXIMUM STRIP WIDTH = 50 g', GREEN)
  );

  // ============================================================
  // BEATS 30–33: WHY THIS BOUNDARY IS BEST
  // ============================================================

  // 30. Moving in either direction decreases the smaller gap.

  const LEFT_TEST =
    candidate(165);

  const RIGHT_TEST =
    candidate(185);

  await until(S(30));

  await play(
    ...clearGaps(),

    ...clearWidth(),

    ...moveStrip(
      LEFT_TEST,
      0.65
    ),

    ...fbox([
      ['MOVE LEFT TO 165 g', GOLD],
      ['left gap = 15 g', PLUM],
      ['right gap = 35 g', APPLE],
      ['margin becomes smaller', RED]
    ], GOLD),

    ...say('MOVE LEFT OR RIGHT: THE MARGIN SHRINKS', GOLD)
  );

  await play(
    ...moveStrip(
      RIGHT_TEST,
      0.80
    ),

    ...fbox([
      ['MOVE RIGHT TO 185 g', GOLD],
      ['left gap = 35 g', PLUM],
      ['right gap = 15 g', APPLE],
      ['margin becomes smaller', RED]
    ], GOLD)
  );

  await play(
    ...moveStrip(
      I3,
      0.65
    ),

    ...fbox([
      ['RETURN TO 175 g', CYAN],
      ['equal gaps of 25 g', C.ink],
      ['largest margin restored', GREEN]
    ], GREEN)
  );

  // 31. Tilting cannot produce a wider separating strip.

  const tilt =
    tiltedExample(0.25);

  await until(S(31));

  await play(
    ...clearBoundary(),

    new M.FadeIn(
      tilt.group
    ),

    ...fbox([
      ['TRY A TILTED LINE', GOLD],
      ['measure perpendicular gaps', C.ink],
      [
        `margin ≈ ${fmt(tilt.margin, 3)}`,
        CYAN
      ],
      ['smaller than 0.5', RED]
    ], GOLD),

    ...say('TILTING CANNOT INCREASE THE MAXIMUM MARGIN', GOLD)
  );

  await until(S(31) + 2.5);

  await play(
    new M.FadeOut(
      tilt.group
    ),

    ...showStrip(
      I3
    ),

    ...fbox([
      ['CLOSEST OPPOSING FRUITS', CYAN],
      ['one grid unit apart', C.ink],
      ['margin cannot exceed half', GOLD],
      ['maximum = 0.5', GREEN]
    ], GREEN)
  );

  // 32. P2 and A1 are the support vectors.

  await until(S(32));

  await play(
    new M.FadeOut(
      plumRing
    ),

    new M.FadeOut(
      appleRing
    ),

    ...showSupports(),

    ...fbox([
      ['SUPPORT VECTORS', CYAN],
      ['P2: plum at (3, 3)', PLUM],
      ['A1: apple at (4, 3)', APPLE],
      ['these determine the best strip', GOLD]
    ], GOLD),

    ...say('P2 AND A1 ARE THE SUPPORT VECTORS', GOLD)
  );

  // 33. A vector is a list of measurements.

  await until(S(33));

  await play(
    ...fbox([
      ['VECTOR = LIST OF MEASUREMENTS', CYAN],
      ['P2: [3, 3]', PLUM],
      ['A1: [4, 3]', APPLE],
      ['[weight units, hue]', C.muted]
    ]),

    ...say('VECTOR = A LIST OF MEASUREMENTS')
  );

  // ============================================================
  // BEATS 34–38: TURN MARGIN INTO WEIGHT MAGNITUDE
  // ============================================================

  // 34. Turn the margin into a quantity to minimise.

  await until(S(34));

  await play(
    ...clearSupports(),

    ...clearIteration(),

    ...fbox([
      ['WIDER MARGIN IS BETTER', CYAN],
      ['can we express this as', C.ink],
      ['a number to make smaller?', GOLD]
    ], GOLD),

    ...say('TURN THE MARGIN INTO A NUMBER TO MINIMISE', GOLD)
  );

  // 35. Weight magnitude is one divided by margin.
  //
  // This is the classifier's weight-vector magnitude,
  // not the physical weight of a fruit.

  await until(S(35));

  await play(
    ...fbox([
      ['WEIGHT MAGNITUDE', CYAN],
      ['|w| = 1 ÷ margin', GOLD],
      ['margin measured in grid units', C.ink],
      ['larger margin → smaller |w|', GREEN]
    ], GOLD),

    ...say('WEIGHT MAGNITUDE = 1 ÷ MARGIN')
  );

  // 36. First margin 0.2 gives weight magnitude 5.

  await until(S(36));

  await play(
    ...moveStrip(I1),

    ...setIteration(1),

    ...fbox([
      ['ITERATION 1', CYAN],
      ['margin = 0.2', C.ink],
      ['|w| = 1/0.2', C.ink],
      ['= 5', GOLD]
    ], GOLD),

    ...say('ITERATION 1: WEIGHT MAGNITUDE = 5')
  );

  // 37. Second margin 0.4 gives 2.5.

  await until(S(37));

  await play(
    ...moveStrip(I2),

    ...setIteration(2),

    ...fbox([
      ['ITERATION 2', CYAN],
      ['margin = 0.4', C.ink],
      ['|w| = 1/0.4', C.ink],
      ['= 2.5', GOLD]
    ], GOLD),

    ...say('ITERATION 2: WEIGHT MAGNITUDE = 2.5')
  );

  // 38. Final margin 0.5 gives 2.

  await until(S(38));

  await play(
    ...moveStrip(I3),

    ...setIteration(3),

    ...fbox([
      ['ITERATION 3', CYAN],
      ['margin = 0.5', C.ink],
      ['|w| = 1/0.5', C.ink],
      ['= 2', GREEN]
    ], GREEN),

    ...say('ITERATION 3: WEIGHT MAGNITUDE = 2', GREEN)
  );

  // ============================================================
  // BEATS 39–44: THE OBJECTIVE AND ITS GROWING CURVE
  // ============================================================

  // 39. Use an objective to compare candidate boundaries.

  await until(S(39));

  await play(
    ...startObjectiveChart(),

    ...fbox([
      ['OBJECTIVE', CYAN],
      ['a cost used to compare', C.ink],
      ['possible separating boundaries', C.ink],
      ['smaller is better', GOLD]
    ], GOLD),

    ...say('OBJECTIVE = THE COST WE WANT TO MINIMISE')
  );

  // 40. Objective = weight magnitude squared divided by two.

  await until(S(40));

  await play(
    ...fbox([
      ['OBJECTIVE FORMULA', CYAN],
      ['J = |w|² / 2', GOLD],
      ['square the weight magnitude', C.ink],
      ['then divide by two', C.ink]
    ], GOLD),

    ...say('OBJECTIVE = WEIGHT MAGNITUDE² ÷ 2')
  );

  // 41. First boundary has objective 12.5.
  // Replay its geometry while adding the first curve point.

  await until(S(41));

  await play(
    ...moveStrip(I1),

    ...setIteration(1),

    ...appendObjective(I1),

    ...fbox([
      ['ITERATION 1: 160 g', CYAN],
      ['|w| = 5', C.ink],
      ['J = 5² / 2 = 25/2', C.ink],
      ['= 12.5', GOLD]
    ], GOLD),

    ...say('OBJECTIVE 1 = 12.5', GOLD)
  );

  // 42. Second objective is 3.125.

  await until(S(42));

  await play(
    ...moveStrip(I2),

    ...setIteration(2),

    ...appendObjective(I2),

    ...fbox([
      ['ITERATION 2: 170 g', CYAN],
      ['|w| = 2.5', C.ink],
      ['J = 2.5² / 2', C.ink],
      ['= 3.125', GOLD]
    ], GOLD),

    ...say('OBJECTIVE 2 = 3.125', GOLD)
  );

  // 43. Final objective is 2.

  await until(S(43));

  await play(
    ...moveStrip(I3),

    ...setIteration(3),

    ...appendObjective(I3),

    ...fbox([
      ['ITERATION 3: 175 g', CYAN],
      ['|w| = 2', C.ink],
      ['J = 2² / 2', C.ink],
      ['= 2: minimum objective', GREEN]
    ], GREEN),

    ...say('OBJECTIVE 3 = 2', GREEN)
  );

  // 44. The objective falls as the strip grows.
  //
  // Keep the curve on its original axis scale.

  const minimumGuide = dashed(
    [
      CHART.x0,
      chartY(2),
      0
    ],

    [
      CHART.x1,
      chartY(2),
      0
    ],

    GREEN
  );

  await until(S(44));

  await play(
    new M.Create(
      minimumGuide
    ),

    new M.Indicate(
      chartPoints[2],
      {
        color: GREEN
      }
    ),

    ...fbox([
      ['SEARCH RESULTS', CYAN],
      ['margin: 0.2 → 0.4 → 0.5', C.ink],
      ['J: 12.5 → 3.125 → 2', GOLD],
      ['widest strip: smallest cost', GREEN]
    ], GREEN),

    ...say('OBJECTIVE FALLS AS THE MARGIN GROWS', GREEN)
  );

  // ============================================================
  // BEATS 45–48: USE THE FITTED BOUNDARY
  // ============================================================

  // 45. Actual SVMs use mathematical optimisation methods.

  await until(S(45));

  await play(
    ...fbox([
      ['OUR THREE-STEP SEARCH', CYAN],
      ['illustrates the objective', C.ink],
      ['actual SVMs use mathematical', C.ink],
      ['optimisation methods', GOLD]
    ]),

    ...say('REAL SVMS USE MATHEMATICAL OPTIMISATION')
  );

  // 46. Unknown fruit weighs 150 grams.
  // Its exact chapter position is (3, 4).

  const query =
    unknown(
      xy(QX, QY)
    );

  const queryWeightGuide =
    dashed(
      xy(QX, 0),
      xy(QX, QY),
      WHITE
    );

  const queryResult =
    prediction(
      NEW_FRUIT,
      I3
    );

  const queryScore =
    classificationScore(
      NEW_FRUIT,
      I3
    );

  await until(S(46));

  await play(
    new M.FadeIn(query),

    new M.Create(
      queryWeightGuide
    ),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['weight = 150 g, hue = 4', C.ink],
      ['150 g < 175 g', GOLD],
      [
        `PREDICTION: ${queryResult.toUpperCase()}`,
        PLUM
      ]
    ], PLUM),

    ...say('150 g IS ON THE PLUM SIDE', PLUM)
  );

  // 47. Useful for finding a separating line with room.

  await until(S(47));

  await play(
    new M.FadeOut(
      queryWeightGuide
    ),

    ...showSupports(),

    ...fbox([
      ['HARD-MARGIN SVM', CYAN],
      ['separates the known groups', C.ink],
      ['maximises the margin', GOLD],
      ['uses the closest examples', GREEN]
    ], GREEN),

    ...say('SEPARATE GROUPS WITH AS MUCH ROOM AS POSSIBLE')
  );

  // 48. Hard margins require perfect separation.
  // Do not modify the original data before the explicitly
  // narrated New data demonstration at beat 53.

  await until(S(48));

  await play(
    ...clearSupports(),

    ...fbox([
      ['IMPORTANT LIMITATION', GOLD],
      ['hard margin requires every', C.ink],
      ['known fruit to be separated', C.ink],
      ['overlap can make this impossible', RED]
    ], RED),

    ...say('HARD MARGINS REQUIRE PERFECT SEPARATION', GOLD)
  );

  // ============================================================
  // BEATS 49–50: TRY IT — STEP AND PLAY
  // ============================================================

  // 49. Press Step to explore one candidate at a time.

  await until(S(49));

  await play(
    new M.FadeOut(query),

    new M.FadeOut(
      minimumGuide
    ),

    ...clearObjectiveHistory(),

    ...moveStrip(
      I1,
      0.85
    ),

    ...setIteration(1),

    ...setControls(
      'STEP',
      1
    ),

    ...appendObjective(I1),

    ...searchBox(
      I1,
      1,
      true
    ),

    ...say('TRY IT: PRESS STEP', GREEN)
  );

  await play(
    ...previewStep(
      I2,
      2
    )
  );

  await play(
    ...previewStep(
      I3,
      3
    )
  );

  // 50. Play, Pause and speed control preview.

  await until(S(50));

  await play(
    ...clearObjectiveHistory(),

    ...setControls(
      'PLAY',
      1
    ),

    ...moveStrip(
      I1,
      0.75
    ),

    ...setIteration(1),

    ...appendObjective(I1),

    ...searchBox(
      I1,
      1,
      true
    ),

    ...say('TRY IT: PLAY, PAUSE AND CHANGE SPEED', GREEN)
  );

  await play(
    ...previewStep(
      I2,
      2
    ),

    ...setControls(
      'PLAY',
      2
    )
  );

  await play(
    ...setControls(
      'PAUSE',
      2
    ),

    ...fbox([
      ['PAUSED AT ITERATION 2', CYAN],
      ['line = 170 g', C.ink],
      ['margin = 0.4', C.ink],
      ['objective = 3.125', GOLD]
    ], GOLD)
  );

  await play(
    ...setControls(
      'PLAY',
      2
    ),

    ...previewStep(
      I3,
      3
    )
  );

  // ============================================================
  // BEATS 51–52: TRY IT — RESET AND ADJUST STEP SIZE
  // ============================================================

  // 51. Reset, predict the direction of movement, and Step.

  await until(S(51));

  await play(
    ...clearObjectiveHistory(),

    ...setControls(
      'RESET',
      1
    ),

    ...moveStrip(
      I1,
      0.8
    ),

    ...setIteration(1),

    ...appendObjective(I1),

    ...fbox([
      ['RESET: ORIGINAL DATA', CYAN],
      ['line = 160 g', C.ink],
      ['left gap = 10 g', PLUM],
      ['right gap = 40 g', APPLE]
    ]),

    ...say('TRY IT: RESET AND PREDICT THE DIRECTION', GREEN)
  );

  await play(
    ...fbox([
      ['PREDICT BEFORE STEPPING', GOLD],
      ['should the line move', C.ink],
      ['left or right?', GOLD]
    ], GOLD)
  );

  await until(S(51) + 2.8);

  await play(
    ...setControls(
      'STEP',
      1
    ),

    ...previewStep(
      I2,
      2
    )
  );

  // 52. Reach objective 2 with fewer moves.
  //
  // A suitable 15-gram move goes directly from the
  // first candidate at 160 g to the optimum at 175 g.
  //
  // This is a controlled candidate-search example,
  // not a universal SVM step-size rule.

  const DIRECT_MOVE_GRAMS =
    OPTIMAL_GRAMS - I1.grams;

  const directMoveLabel = tag(
    `MOVE SIZE = ${fmt(DIRECT_MOVE_GRAMS)} g`,
    GOLD,
    [
      CX,
      Y(7.80),
      0
    ],
    P ? 15 : 13
  );

  await until(S(52));

  await play(
    ...clearObjectiveHistory(),

    ...moveStrip(
      I1,
      0.80
    ),

    ...setIteration(1),

    ...appendObjective(I1),

    new M.FadeIn(
      directMoveLabel
    ),

    ...fbox([
      ['TARGET OBJECTIVE = 2', GREEN],
      ['start at 160 g', C.ink],
      ['choose a 15 g move', GOLD],
      ['how many moves will it take?', CYAN]
    ], GOLD),

    ...say('TRY IT: ADJUST THE SIZE OF EACH MOVE', GREEN)
  );

  await play(
    ...previewStep(
      I3,
      2
    ),

    new M.FadeOut(
      directMoveLabel
    )
  );

  await play(
    ...fbox([
      ['160 + 15 = 175 g', C.ink],
      ['margin = 0.5', CYAN],
      ['objective = 2', GREEN],
      ['target reached in one move', GREEN]
    ], GREEN),

    ...say('TARGET REACHED: OBJECTIVE = 2', GREEN)
  );

  // ============================================================
  // BEAT 53: NEW DATA — NO STRAIGHT SEPARATOR
  // ============================================================

  // Move apple A1 to (2, 3), inside the convex hull of
  // the four original plums.
  //
  // P1 = (1, 3)
  // P2 = (3, 3)
  // P3 = (2, 2)
  // P4 = (2, 4)
  //
  // The hypothetical apple is the average of these four
  // plum positions. Every straight-line score is affine,
  // so if all four plum scores are negative, their average
  // must also be negative.
  //
  // Therefore the apple cannot have a positive score while
  // all four plums remain negative.
  //
  // This proves that no straight separating line exists
  // for the modified example, including tilted lines.

  const OVERLAP_DATA = DATA.map(d =>
    d.id === 'A1'
      ? {
          ...d,
          weight: 100,
          hue: 3
        }
      : {
          ...d
        }
  );

  const overlapApple =
    OVERLAP_DATA.find(
      d => d.id === 'A1'
    );

  const plumHull = [
    [1, 3],
    [2, 2],
    [3, 3],
    [2, 4]
  ];

  const hullOutline =
    new M.VGroup(
      ...plumHull.map((p, i) =>
        line(
          xy(...p),

          xy(
            ...plumHull[
              (i + 1) %
              plumHull.length
            ]
          ),

          PLUM,

          2.4
        )
      )
    );

  const impossibleRing = ring(
    positionOf(overlapApple),
    RED,
    FR * 1.85
  );

  const moveAppleGuide = dashed(
    positionOf(APPLE_SUPPORT),
    positionOf(overlapApple),
    APPLE
  );

  const failureTag = tag(
    'NO STRAIGHT SEPARATOR',
    RED,
    [
      CX,
      Y(7.25),
      0
    ],
    P ? 17 : 15
  );

  await until(S(53));

  await play(
    ...clearControls(),

    ...clearBoundary(),

    ...clearIteration(),

    ...clearObjectiveChart(),

    new M.Create(
      moveAppleGuide
    ),

    new M.Transform(
      points[APPLE_INDEX],

      fruit(
        'apple',
        positionOf(overlapApple)
      ),

      {
        runTime: 1.35
      }
    ),

    ...fbox([
      ['NEW DATA EXAMPLE', CYAN],
      ['move an apple among the plums', APPLE],
      ['apple: 100 g, hue 3', C.ink]
    ]),

    ...say('TRY IT: MOVE AN APPLE AMONG THE PLUMS', GREEN)
  );

  await play(
    new M.FadeOut(
      moveAppleGuide
    ),

    new M.Create(
      hullOutline
    ),

    new M.FadeIn(
      impossibleRing
    ),

    new M.FadeIn(
      failureTag
    ),

    ...fbox([
      ['APPLE INSIDE THE PLUM GROUP', APPLE],
      ['no straight line separates', C.ink],
      ['all the labelled examples', C.ink],
      ['hard-margin fit is infeasible', RED]
    ], RED),

    ...say('NO VALID HARD-MARGIN BOUNDARY', RED)
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE THE ORIGINAL LESSON
  // ============================================================

  // Restore A1 to its exact original position:
  // 200 grams, hue 3.
  //
  // Restore the original optimal separating strip:
  // centre = 175 grams
  // margin = 25 grams on each side
  // full width = 50 grams
  // |w| = 2
  // objective = 2
  //
  // Restore the exact three-candidate objective curve.

  await until(S(54));

  await play(
    new M.FadeOut(
      hullOutline
    ),

    new M.FadeOut(
      impossibleRing
    ),

    new M.FadeOut(
      failureTag
    ),

    new M.Transform(
      points[APPLE_INDEX],

      fruit(
        'apple',
        positionOf(APPLE_SUPPORT)
      ),

      {
        runTime: 1.10
      }
    ),

    ...showStrip(I3),

    ...showSupports(),

    ...setWidth(I3),

    ...fbox([
      ['HARD-MARGIN SVM', CYAN],
      ['best boundary = 175 g', GOLD],
      ['margin = 25 g on each side', CYAN],
      ['widest strip = 50 g', GREEN]
    ], GREEN),

    ...say('FIND THE WIDEST POSSIBLE SEPARATING STRIP')
  );

  await play(
    ...startObjectiveChart(),

    ...appendObjective(I1),

    ...appendObjective(I2),

    ...appendObjective(I3),

    ...fbox([
      ['CLOSEST FRUITS GUIDE THE FIT', CYAN],
      ['P2 and A1: support vectors', GOLD],
      ['maximum margin = 0.5', C.ink],
      ['minimum objective = 2', GREEN]
    ], GREEN),

    ...say('THE CLOSEST EXAMPLES DETERMINE THE BEST BOUNDARY', GOLD)
  );

  await play(
    new M.Indicate(
      supportNow[0],
      {
        color: PLUM,
        runTime: 0.85
      }
    ),

    new M.Indicate(
      supportNow[1],
      {
        color: APPLE,
        runTime: 0.85
      }
    ),

    ...say('SUPPORT VECTORS → MAXIMUM MARGIN', GREEN)
  );
}
