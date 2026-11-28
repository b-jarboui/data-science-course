// lesson 13.1.7
// Quadratic discriminant analysis: giving each group its own spread.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data and unrounded calculations.
// Mounds are projected 3D density meshes built from Line primitives.
// Decision regions are shaded using calculated horizontal slices.
// Try it beats preview the separate interactive activity.
// Preview datasets retain circular covariance for clear demonstrations.
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

  const COLORS = [PLUM, APPLE];
  const NAMES = ['plum', 'apple'];

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // Phone content bounds: y = -5.5 to 4.3.
  // Laptop content bounds: y = -3.0 to 2.3.
  //
  // Equal grid lengths ensure that circular covariance
  // appears circular, rather than stretched on screen.

  const U = P ? 0.60 : 0.42;

  const XMAX = 8.5;
  const YMAX = 8.5;

  const XL = P ? -2.55 : CX - 4.25 * U;
  const YB = P ? -3.95 : -2.40;

  const XR = XL + XMAX * U;
  const YT = YB + YMAX * U;

  const X = x => XL + x * U;
  const Y = y => YB + y * U;

  const xy = (x, y) => [X(x), Y(y), 0];

  const FR = P ? 0.135 : 0.105;

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

  // The chapter's original unknown fruit remains unchanged.
  // This lesson explicitly introduces two comparison fruits
  // with equal weight and different hues.

  const ORIGINAL_UNKNOWN = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const QUERY_1 = [3.5, 3];
  const QUERY_2 = [3.5, 5];

  const weightUnits = grams => grams / 50;

  const coordinates = d => [
    weightUnits(d.weight),
    d.hue
  ];

  const positionOf = d =>
    xy(...coordinates(d));

  const colorOf = label =>
    label === 'plum' ? PLUM : APPLE;

  const sum = values =>
    values.reduce((a, b) => a + b, 0);

  function fmt(n, places = 2) {
    const v = Number(n.toFixed(places));

    return v < 0
      ? '−' + String(Math.abs(v))
      : String(v);
  }

  function fixed(n, places = 2) {
    const v = Math.abs(n).toFixed(places);

    return n < 0
      ? '−' + v
      : v;
  }

  function signed(n, places = 2) {
    return n < 0
      ? '−' + Math.abs(n).toFixed(places)
      : '+' + n.toFixed(places);
  }

  function squaredDistance(a, b) {
    return (
      (a[0] - b[0]) ** 2 +
      (a[1] - b[1]) ** 2
    );
  }

  // ============================================================
  // FITTED GROUP STATISTICS
  // ============================================================

  // As in the LDA lesson, fitted variances divide by
  // the number of fruits, not the number minus one.

  function groupStatistics(data, label) {
    const group = data.filter(
      d => d.label === label
    );

    const n = group.length;

    const xs = group.map(
      d => weightUnits(d.weight)
    );

    const ys = group.map(
      d => d.hue
    );

    const meanX = sum(xs) / n;
    const meanY = sum(ys) / n;

    const deviations = group.map((d, i) => {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;

      return {
        id: d.id,
        dx,
        dy,
        dx2: dx * dx,
        dy2: dy * dy,
        product: dx * dy
      };
    });

    const ssX = sum(
      deviations.map(d => d.dx2)
    );

    const ssY = sum(
      deviations.map(d => d.dy2)
    );

    const ssXY = sum(
      deviations.map(d => d.product)
    );

    const vx = ssX / n;
    const vy = ssY / n;
    const cov = ssXY / n;

    const determinant =
      vx * vy - cov * cov;

    if (determinant <= 1e-12) {
      throw new Error(
        'QDA requires a nonsingular covariance matrix for each group.'
      );
    }

    return {
      label,
      group,
      n,

      mean: [
        meanX,
        meanY
      ],

      deviations,

      ssX,
      ssY,
      ssXY,

      vx,
      vy,
      cov,
      determinant,

      covariance: [
        [vx, cov],
        [cov, vy]
      ],

      inverse: [
        [
          vy / determinant,
          -cov / determinant
        ],
        [
          -cov / determinant,
          vx / determinant
        ]
      ],

      maxRadius: Math.max(
        ...deviations.map(
          d => Math.sqrt(d.dx2 + d.dy2)
        )
      )
    };
  }

  // ============================================================
  // QDA CALCULATIONS
  // ============================================================

  // General two-dimensional Gaussian QDA:
  //
  // score_i =
  //     log(prior_i)
  //   - 1/2 log(det(covariance_i))
  //   - 1/2 adjustedDistance_i
  //
  // Common terms may be dropped without changing the winner.
  //
  // For the equal-prior circular groups in this lesson:
  //
  // score_i =
  //   -log(variance_i)
  //   - squaredDistance_i / (2 * variance_i)
  //
  // Exponentiating that score gives a scaled density height.
  //
  // In the original example:
  //
  // plum height  = 2 exp(-dP²)
  // apple height = 0.5 exp(-dA²/4)
  //
  // Both integrate to the same volume, 2π, over the full
  // measurement plane. The displayed meshes show a finite
  // window of those theoretical mounds.

  function fitQDA(data) {
    const groups = NAMES.map(label =>
      groupStatistics(data, label)
    );

    const priors = groups.map(
      g => g.n / data.length
    );

    const means = groups.map(
      g => g.mean
    );

    // Drop the common log(1/2) term for the two
    // equally common classes in the narrated example.

    const commonPrior = Math.log(0.5);

    function adjustedDistance(q, i) {
      const g = groups[i];

      const dx = q[0] - g.mean[0];
      const dy = q[1] - g.mean[1];

      return (
        dx * (
          g.inverse[0][0] * dx +
          g.inverse[0][1] * dy
        ) +

        dy * (
          g.inverse[1][0] * dx +
          g.inverse[1][1] * dy
        )
      );
    }

    function startingScore(i) {
      const g = groups[i];

      return (
        Math.log(priors[i]) -
        commonPrior -
        0.5 * Math.log(g.determinant)
      );
    }

    function score(q, i) {
      return (
        startingScore(i) -
        0.5 * adjustedDistance(q, i)
      );
    }

    function height(q, i) {
      return Math.exp(
        score(q, i)
      );
    }

    function predict(q) {
      const scores = [
        score(q, 0),
        score(q, 1)
      ];

      const heights = [
        Math.exp(scores[0]),
        Math.exp(scores[1])
      ];

      const difference =
        scores[0] - scores[1];

      const winner =
        Math.abs(difference) < 1e-10
          ? -1
          : difference > 0 ? 0 : 1;

      return {
        q,

        squared: means.map(m =>
          squaredDistance(q, m)
        ),

        distances: means.map(m =>
          Math.sqrt(
            squaredDistance(q, m)
          )
        ),

        adjusted: [
          adjustedDistance(q, 0),
          adjustedDistance(q, 1)
        ],

        startingScores: [
          startingScore(0),
          startingScore(1)
        ],

        scores,
        heights,
        winner
      };
    }

    return {
      data,
      groups,
      priors,
      means,
      adjustedDistance,
      startingScore,
      score,
      height,
      predict
    };
  }

  const ORIGINAL = fitQDA(DATA);

  const PLUM_STATS = ORIGINAL.groups[0];
  const APPLE_STATS = ORIGINAL.groups[1];

  const PLUM_CENTRE = ORIGINAL.means[0];
  const APPLE_CENTRE = ORIGINAL.means[1];

  const RESULT_1 = ORIGINAL.predict(
    QUERY_1
  );

  const RESULT_2 = ORIGINAL.predict(
    QUERY_2
  );

  const RESULT_MIDDLE = ORIGINAL.predict(
    [4, 3]
  );

  // Checked original results:
  //
  // Plum centre:  (2, 3)
  // Apple centre: (6, 3)
  //
  // Plum covariance:
  // [0.5  0  ]
  // [0    0.5]
  //
  // Apple covariance:
  // [2  0]
  // [0  2]
  //
  // Standard deviations:
  // plum  = sqrt(0.5)
  // apple = sqrt(2)
  //
  // Ratio = sqrt(2) / sqrt(0.5) = 2.
  //
  // Starting scores:
  // plum  = ln(2)
  // apple = -ln(2)
  //
  // At (3.5, 3):
  // plum squared distance  = 2.25
  // apple squared distance = 6.25
  // plum score  ≈ -1.56
  // apple score ≈ -2.26
  // winner = plum
  //
  // At (3.5, 5):
  // plum squared distance  = 6.25
  // apple squared distance = 10.25
  // plum score  ≈ -5.56
  // apple score ≈ -3.26
  // winner = apple
  //
  // At (4, 3):
  // plum score  ≈ -3.31
  // apple score ≈ -1.69
  // winner = apple.

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
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
    const t = pill(s, color, size);
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
      strokeWidth: 2
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
  }

  function dot(
    p,
    color,
    radius = 0.045
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

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21;
    const lh = P ? 0.33 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
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

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

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
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P ? FW - 0.9 : 4.0;
    const maxh = P ? 1.36 : 3.8;

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

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
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
    const outer = new M.Dot({
      point: p,
      radius: r * 1.85,
      color: WHITE
    });

    outer.setFill(WHITE, 0.08);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.40,
      color: WHITE
    });

    inner.setFill(WHITE, 0.15);

    const side = r * Math.sqrt(2);

    const body = new M.Rectangle({
      width: side,
      height: side,
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 1);
    body.rotate(Math.PI / 4);
    body.moveTo(p);

    return new M.VGroup(
      outer,
      inner,
      body
    );
  }

  function plotPoints(data = DATA) {
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

  function introduction() {
    const y = P ? -1.0 : -0.45;

    const w = P ? 2.35 : 2.20;

    const parts = [
      unknown(
        [CX, y + 1.60, 0],
        FR * 1.80
      ),

      rounded(
        w,
        0.70,
        [CX - 1.40, y, 0],
        PLUM,
        0.94
      ),

      rounded(
        w,
        0.70,
        [CX + 1.40, y, 0],
        APPLE,
        0.94
      ),

      fruit(
        'plum',
        [CX - 2.12, y, 0],
        FR * 1.15
      ),

      fruit(
        'apple',
        [CX + 0.68, y, 0],
        FR * 1.15
      ),

      text(
        'PLUM?',
        21,
        PLUM,
        [CX - 1.22, y, 0],
        true
      ),

      text(
        'APPLE?',
        21,
        APPLE,
        [CX + 1.58, y, 0],
        true
      ),

      line(
        [CX - 0.12, y + 1.28, 0],
        [CX - 1.40, y + 0.37, 0],
        PLUM,
        2
      ),

      line(
        [CX + 0.12, y + 1.28, 0],
        [CX + 1.40, y + 0.37, 0],
        APPLE,
        2
      )
    ];

    return new M.VGroup(...parts);
  }

  const intro = introduction();

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

    return new M.VGroup(...parts);
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
          P ? 14 : 12,
          C.muted,
          [X(x), YB - 0.18, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        P ? 18 : 16,
        C.ink,
        [(XL + XR) / 2, YB - 0.43, 0]
      )
    );

    return new M.VGroup(...parts);
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
          P ? 15 : 13,
          C.muted,
          [XL - 0.20, Y(y), 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Hue ↑',
        P ? 17 : 15,
        C.ink,
        [XL - 0.37, YT + 0.19, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalStrip() {
    const sx = XL - 0.65;
    const sw = P ? 0.23 : 0.20;

    const parts = [];

    HUE.forEach((color, i) => {
      parts.push(
        rect(
          sw,
          U * 0.98,
          [sx, Y(i + 1), 0],
          color,
          1,
          0
        )
      );
    });

    parts.push(
      text(
        'green',
        P ? 12 : 11,
        HUE[7],
        [sx, Y(8) + U * 0.72, 0]
      )
    );

    parts.push(
      text(
        'red',
        P ? 12 : 11,
        HUE[0],
        [sx, Y(1) - U * 0.72, 0]
      )
    );

    return new M.VGroup(...parts);
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

  let points = plotPoints();

  // ============================================================
  // CENTRES AND OBSERVED SPREAD
  // ============================================================

  function centreCross(
    centre,
    color
  ) {
    const p = xy(...centre);

    const r = FR * 1.50;

    const halo = new M.Dot({
      point: p,
      radius: r * 1.55,
      color
    });

    halo.setFill(color, 0.12);

    const glowA = line(
      [p[0] - r, p[1], 0],
      [p[0] + r, p[1], 0],
      color,
      7
    );

    const glowB = line(
      [p[0], p[1] - r, 0],
      [p[0], p[1] + r, 0],
      color,
      7
    );

    const a = line(
      [p[0] - r, p[1], 0],
      [p[0] + r, p[1], 0],
      WHITE,
      2
    );

    const b = line(
      [p[0], p[1] - r, 0],
      [p[0], p[1] + r, 0],
      WHITE,
      2
    );

    return new M.VGroup(
      halo,
      glowA,
      glowB,
      a,
      b
    );
  }

  function centreLabel(
    centre,
    i
  ) {
    return tag(
      `${fmt(centre[0] * 50)} g, hue ${fmt(centre[1])}`,
      COLORS[i],
      [
        X(centre[0]),
        Y(Math.min(centre[1] + (i === 0 ? 2.2 : 3.4), 6.6)),
        0
      ],
      P ? 16 : 13
    );
  }

  function spreadCircle(
    centre,
    radius,
    color,
    opacity = 0.045
  ) {
    const c = new M.Circle({
      radius: radius * U,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo(xy(...centre));

    return c;
  }

  function observedSpread(model) {
    return model.groups.map((g, i) =>
      spreadCircle(
        g.mean,
        g.maxRadius,
        COLORS[i]
      )
    );
  }

  // These are one-standard-deviation covariance contours,
  // not circles enclosing every known fruit.

  function covarianceContour(
    group,
    color
  ) {
    const angle =
      0.5 * Math.atan2(
        2 * group.cov,
        group.vx - group.vy
      );

    const delta = Math.sqrt(
      (group.vx - group.vy) ** 2 +
      4 * group.cov ** 2
    );

    const major = Math.sqrt(
      (group.vx + group.vy + delta) / 2
    );

    const minor = Math.sqrt(
      (group.vx + group.vy - delta) / 2
    );

    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    const segments = [];

    function point(t) {
      const ex = major * Math.cos(t);
      const ey = minor * Math.sin(t);

      return xy(
        group.mean[0] + ex * ca - ey * sa,
        group.mean[1] + ex * sa + ey * ca
      );
    }

    const N = 60;

    for (let i = 0; i < N; i++) {
      segments.push(
        line(
          point(2 * Math.PI * i / N),
          point(2 * Math.PI * (i + 1) / N),
          color,
          2.1
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function fittedContours(model) {
    return model.groups.map((g, i) =>
      covarianceContour(
        g,
        COLORS[i]
      )
    );
  }

  let centres = ORIGINAL.means.map(
    (m, i) => centreCross(m, COLORS[i])
  );

  let centreLabels = ORIGINAL.means.map(
    (m, i) => centreLabel(m, i)
  );

  let contours = [];

  function pooledVariance(model) {
    const n = model.data.length;

    return {
      vx: sum(
        model.groups.map(g => g.ssX)
      ) / n,

      vy: sum(
        model.groups.map(g => g.ssY)
      ) / n,

      cov: sum(
        model.groups.map(g => g.ssXY)
      ) / n
    };
  }

  const SHARED = pooledVariance(
    ORIGINAL
  );

  // ============================================================
  // PROJECTED THREE-DIMENSIONAL DENSITY MOUNDS
  // ============================================================

  // Both surfaces use exactly the same horizontal,
  // depth and vertical scales.
  //
  // This is an oblique projection of:
  //
  // z = exp(QDA score).
  //
  // It preserves the comparison of mound heights.
  // A narrower mound has a taller peak, while a wider
  // mound falls more gradually.

  const MX = P ? 0.57 : 0.50;
  const MDX = P ? 0.135 : 0.115;
  const MDY = P ? 0.235 : 0.190;

  const MZ = P ? 1.42 : 0.92;

  const MB = P ? -3.18 : -2.03;

  function project(
    x,
    y,
    z = 0
  ) {
    return [
      CX +
      (x - 4.25) * MX +
      (y - 3) * MDX,

      MB +
      y * MDY +
      z * MZ,

      0
    ];
  }

  function moundFloor() {
    const parts = [];

    for (let x = 0; x <= 8; x++) {
      parts.push(
        line(
          project(x, 0),
          project(x, 6),
          C.muted,
          0.65
        )
      );
    }

    for (let y = 0; y <= 6; y++) {
      parts.push(
        line(
          project(0, y),
          project(8.5, y),
          C.muted,
          0.65
        )
      );
    }

    parts.push(
      line(
        project(0, 0),
        project(8.5, 0),
        C.ink,
        2
      )
    );

    parts.push(
      line(
        project(0, 0),
        project(0, 6),
        C.ink,
        2
      )
    );

    parts.push(
      text(
        'Weight (grams) →',
        P ? 17 : 15,
        C.ink,
        [
          CX,
          MB - 0.38,
          0
        ]
      )
    );

    for (const x of [0, 2, 4, 6, 8]) {
      const p = project(x, 0);

      parts.push(
        text(
          String(x * 50),
          P ? 13 : 11,
          C.muted,
          [
            p[0],
            p[1] - 0.16,
            0
          ],
          true
        )
      );
    }

    const hp = project(0, 6);

    parts.push(
      text(
        'Hue ↗',
        P ? 16 : 14,
        C.ink,
        [
          hp[0] - 0.24,
          hp[1] + 0.24,
          0
        ]
      )
    );

    const heightBase = project(0, 0);

    const heightTop = [
      heightBase[0],
      heightBase[1] + 2.10 * MZ,
      0
    ];

    parts.push(
      line(
        heightBase,
        heightTop,
        C.muted,
        1.8
      )
    );

    parts.push(
      text(
        'Height ↑',
        P ? 15 : 13,
        C.muted,
        [
          heightTop[0] - 0.04,
          heightTop[1] + 0.20,
          0
        ]
      )
    );

    const note = fittedText(
      'FITTED DENSITY MOUNDS',
      P ? 19 : 17,
      C.ink,
      [CX, 1.28, 0],
      P ? 6.4 : 5.9,
      true
    );

    parts.push(note);

    return new M.VGroup(...parts);
  }

  function moundSurface(
    model,
    i
  ) {
    const g = model.groups[i];
    const color = COLORS[i];

    const parts = [];

    const angle =
      0.5 * Math.atan2(
        2 * g.cov,
        g.vx - g.vy
      );

    const delta = Math.sqrt(
      (g.vx - g.vy) ** 2 +
      4 * g.cov ** 2
    );

    const a = Math.sqrt(
      (g.vx + g.vy + delta) / 2
    );

    const b = Math.sqrt(
      (g.vx + g.vy - delta) / 2
    );

    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    function surfacePoint(r, theta) {
      const ex =
        a * r * Math.cos(theta);

      const ey =
        b * r * Math.sin(theta);

      const x =
        g.mean[0] +
        ex * ca -
        ey * sa;

      const y =
        g.mean[1] +
        ex * sa +
        ey * ca;

      const h = model.height(
        [x, y],
        i
      );

      return project(
        x,
        y,
        h
      );
    }

    // Draw horizontal density contours as projected rings.
    // Every ring has a constant adjusted-distance value.

    const radii = [
      0.35,
      0.70,
      1.05,
      1.40,
      1.75,
      2.10,
      2.50,
      2.90
    ];

    const RING_STEPS = 36;

    radii.forEach(r => {
      for (let j = 0; j < RING_STEPS; j++) {
        const t1 =
          2 * Math.PI * j / RING_STEPS;

        const t2 =
          2 * Math.PI *
          (j + 1) / RING_STEPS;

        parts.push(
          line(
            surfacePoint(r, t1),
            surfacePoint(r, t2),
            color,
            r <= 1.4 ? 1.75 : 1.10
          )
        );
      }
    });

    // Add radial meridians to show the smooth mound shape.

    const SPOKES = 16;
    const RADIAL_STEPS = 18;

    for (let j = 0; j < SPOKES; j++) {
      const theta =
        2 * Math.PI * j / SPOKES;

      for (let k = 0; k < RADIAL_STEPS; k++) {
        const r1 =
          2.90 * k / RADIAL_STEPS;

        const r2 =
          2.90 * (k + 1) / RADIAL_STEPS;

        parts.push(
          line(
            surfacePoint(r1, theta),
            surfacePoint(r2, theta),
            color,
            1.05
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function moundPeak(
    model,
    i
  ) {
    const m = model.means[i];

    const h = model.height(
      m,
      i
    );

    const top = project(
      m[0],
      m[1],
      h
    );

    const bottom = project(
      m[0],
      m[1],
      0
    );

    return new M.VGroup(
      dashed(
        bottom,
        top,
        WHITE
      ),

      dot(
        top,
        WHITE,
        P ? 0.055 : 0.045
      ),

      tag(
        `${NAMES[i]} peak`,
        COLORS[i],
        [
          top[0],
          top[1] + 0.30,
          0
        ],
        P ? 16 : 13
      )
    );
  }

  function projectedFruits(
    model
  ) {
    return model.data.map(d => {
      const [x, y] = coordinates(d);

      return fruit(
        d.label,
        project(x, y, 0),
        FR * 0.72
      );
    });
  }

  function moundWidthGuide(
    model,
    i
  ) {
    const g = model.groups[i];

    const sigma = Math.sqrt(g.vx);

    const a = project(
      g.mean[0] - sigma,
      g.mean[1],
      0
    );

    const b = project(
      g.mean[0] + sigma,
      g.mean[1],
      0
    );

    const y =
      (a[1] + b[1]) / 2 - 0.12;

    const color = COLORS[i];

    return new M.VGroup(
      line(
        [a[0], y, 0],
        [b[0], y, 0],
        color,
        2.5
      ),

      line(
        [a[0], y - 0.06, 0],
        [a[0], y + 0.06, 0],
        color,
        1.8
      ),

      line(
        [b[0], y - 0.06, 0],
        [b[0], y + 0.06, 0],
        color,
        1.8
      ),

      text(
        `2σ = ${fmt(2 * sigma)}`,
        P ? 15 : 13,
        color,
        [
          (a[0] + b[0]) / 2,
          y - 0.19,
          0
        ],
        true
      )
    );
  }

  function moundProbe(
    model,
    q
  ) {
    const result =
      model.predict(q);

    const base = project(
      q[0],
      q[1],
      0
    );

    const p0 = project(
      q[0],
      q[1],
      result.heights[0]
    );

    const p1 = project(
      q[0],
      q[1],
      result.heights[1]
    );

    const height = Math.max(
      result.heights[0],
      result.heights[1]
    );

    const top = project(
      q[0],
      q[1],
      height
    );

    const parts = [
      dashed(
        base,
        [
          top[0],
          top[1] + 0.22,
          0
        ],
        WHITE
      ),

      dot(
        p0,
        PLUM,
        P ? 0.075 : 0.055
      ),

      dot(
        p1,
        APPLE,
        P ? 0.075 : 0.055
      ),

      unknown(
        base,
        FR * 0.95
      )
    ];

    const labelY0 = p0[1] + 0.17;
    const labelY1 = p1[1] + 0.17;

    parts.push(
      line(
        p0,
        [
          p0[0] - 0.45,
          labelY0,
          0
        ],
        PLUM,
        1.8
      ),

      line(
        p1,
        [
          p1[0] + 0.45,
          labelY1,
          0
        ],
        APPLE,
        1.8
      ),

      text(
        'plum',
        15,
        PLUM,
        [
          p0[0] - 0.71,
          labelY0,
          0
        ]
      ),

      text(
        'apple',
        15,
        APPLE,
        [
          p1[0] + 0.74,
          labelY1,
          0
        ]
      )
    );

    return new M.VGroup(...parts);
  }

  let floorNow = null;
  let moundsNow = [];
  let peaksNow = [];
  let floorFruits = [];
  let widthGuides = [];
  let probeNow = null;

  // ============================================================
  // DISTANCE VISUALS
  // ============================================================

  function centreConnector(
    centre,
    q,
    color
  ) {
    if (
      squaredDistance(
        centre,
        q
      ) < 1e-12
    ) {
      return ring(
        xy(...centre),
        color,
        FR * 2
      );
    }

    return line(
      xy(...centre),
      xy(...q),
      color,
      2.6
    );
  }

  function horizontalDistance(
    centre,
    q,
    color
  ) {
    const a = xy(...centre);
    const b = xy(...q);

    const y =
      a[1] - (P ? 0.33 : 0.25);

    const value = Math.abs(
      q[0] - centre[0]
    );

    return new M.VGroup(
      line(
        [a[0], y, 0],
        [b[0], y, 0],
        color,
        2.4
      ),

      line(
        [a[0], y - 0.07, 0],
        [a[0], y + 0.07, 0],
        color,
        1.8
      ),

      line(
        [b[0], y - 0.07, 0],
        [b[0], y + 0.07, 0],
        color,
        1.8
      ),

      text(
        fmt(value),
        P ? 18 : 15,
        color,
        [
          (a[0] + b[0]) / 2,
          y - 0.18,
          0
        ],
        true
      )
    );
  }

  function distanceTriangle(
    centre,
    q,
    color
  ) {
    const a = xy(...centre);
    const b = xy(q[0], centre[1]);
    const c = xy(...q);

    const dx = Math.abs(
      q[0] - centre[0]
    );

    const dy = Math.abs(
      q[1] - centre[1]
    );

    const parts = [];

    if (dx > 1e-12) {
      parts.push(
        line(
          a,
          b,
          C.cyan,
          2.2
        ),

        text(
          fmt(dx),
          P ? 17 : 14,
          C.cyan,
          [
            (a[0] + b[0]) / 2,
            a[1] - 0.20,
            0
          ],
          true
        )
      );
    }

    if (dy > 1e-12) {
      parts.push(
        line(
          b,
          c,
          C.green,
          2.2
        ),

        text(
          fmt(dy),
          P ? 17 : 14,
          C.green,
          [
            b[0] + (
              q[0] >= centre[0]
                ? 0.22
                : -0.22
            ),
            (b[1] + c[1]) / 2,
            0
          ],
          true
        )
      );
    }

    if (
      squaredDistance(
        centre,
        q
      ) > 1e-12
    ) {
      parts.push(
        dashed(
          a,
          c,
          color
        )
      );
    }

    return new M.VGroup(...parts);
  }

  let query = null;
  let distanceGuides = [];

  // ============================================================
  // SCORE CARDS AND DENSITY HEIGHT BARS
  // ============================================================

  const SCORE_Y = Y(7.48);

  const SCORE_W = P ? 2.10 : 1.50;
  const SCORE_H = P ? 0.88 : 0.69;

  function scoreCard(
    i,
    value,
    label = 'LOG SCORE'
  ) {
    const x = X(
      i === 0 ? 2.0 : 6.4
    );

    const color = COLORS[i];

    const body = rounded(
      SCORE_W,
      SCORE_H,
      [x, SCORE_Y, 0],
      color,
      0.96
    );

    const name = fittedText(
      `${NAMES[i].toUpperCase()} ${label}`,
      P ? 15 : 12,
      color,
      [
        x,
        SCORE_Y + SCORE_H * 0.25,
        0
      ],
      SCORE_W - 0.12,
      true
    );

    const v = text(
      value === null
        ? '?'
        : signed(value),
      P ? 25 : 21,
      color,
      [
        x,
        SCORE_Y - SCORE_H * 0.16,
        0
      ],
      true
    );

    return new M.VGroup(
      body,
      name,
      v
    );
  }

  function scorePair(
    values,
    label = 'LOG SCORE'
  ) {
    return values.map((v, i) =>
      scoreCard(
        i,
        v,
        label
      )
    );
  }

  function predictionBox(
    model,
    q,
    title = 'COMPARE LOG SCORES'
  ) {
    const r = model.predict(q);

    const color =
      r.winner < 0
        ? GOLD
        : COLORS[r.winner];

    return fbox([
      [title, C.cyan],

      [
        `plum  ≈ ${signed(r.scores[0])}`,
        PLUM
      ],

      [
        `apple ≈ ${signed(r.scores[1])}`,
        APPLE
      ],

      [
        r.winner < 0
          ? 'equal scores: boundary'
          : `prediction: ${NAMES[r.winner]}`,
        color
      ]
    ], color);
  }

  // For each comparison, the two bars use one common height
  // scale. The maximum and actual scaled heights are stated.
  // Heights are not probabilities and need not sum to one.

  function heightComparison(
    model,
    q
  ) {
    const result = model.predict(q);

    const values = result.heights;

    const max = Math.max(
      ...values,
      1e-15
    );

    const w = (XR - XL) * 0.52;

    const x0 =
      (XL + XR) / 2 -
      w / 2;

    const top = Y(7.85);

    const parts = [];

    values.forEach((v, i) => {
      const y =
        top -
        i * (P ? 0.48 : 0.36);

      const color = COLORS[i];

      const width =
        w * v / max;

      parts.push(
        rect(
          w,
          P ? 0.15 : 0.11,
          [
            x0 + w / 2,
            y,
            0
          ],
          C.muted,
          0.10,
          1
        ),

        rect(
          width,
          P ? 0.15 : 0.11,
          [
            x0 + width / 2,
            y,
            0
          ],
          color,
          0.90,
          0
        ),

        text(
          NAMES[i],
          P ? 15 : 12,
          color,
          [
            x0 - 0.45,
            y,
            0
          ]
        ),

        text(
          v.toFixed(4),
          P ? 14 : 12,
          color,
          [
            x0 + w + 0.48,
            y,
            0
          ],
          true
        )
      );
    });

    parts.push(
      text(
        'Scaled density heights',
        P ? 14 : 12,
        C.muted,
        [
          (XL + XR) / 2,
          top + 0.25,
          0
        ]
      )
    );

    return new M.VGroup(...parts);
  }

  let scoresNow = [];
  let heightBarsNow = null;

  // ============================================================
  // EXACT CIRCULAR QDA BOUNDARY
  // ============================================================

  // The narrated groups have circular covariance.
  //
  // Let:
  //
  // sP = plum variance
  // sA = apple variance
  //
  // F(x, y) = scorePlum - scoreApple
  //
  // F(x, y) =
  //     A(x² + y²)
  //   + Bx
  //   + Cy
  //   + D
  //
  // A nonzero quadratic coefficient gives a circle
  // when a real equal-score boundary exists.
  //
  // Equal circular variances cancel the quadratic term,
  // leaving a straight line.

  function circularCoefficients(model) {
    const p = model.groups[0];
    const a = model.groups[1];

    for (const g of model.groups) {
      if (
        Math.abs(g.vx - g.vy) > 1e-10 ||
        Math.abs(g.cov) > 1e-10
      ) {
        throw new Error(
          'This narrated boundary helper requires circular covariance.'
        );
      }
    }

    const vp = p.vx;
    const va = a.vx;

    const A =
      -1 / (2 * vp) +
      1 / (2 * va);

    const B =
      p.mean[0] / vp -
      a.mean[0] / va;

    const CC =
      p.mean[1] / vp -
      a.mean[1] / va;

    const D =
      Math.log(
        model.priors[0] /
        model.priors[1]
      ) +

      Math.log(va / vp) -

      (
        p.mean[0] ** 2 +
        p.mean[1] ** 2
      ) / (2 * vp) +

      (
        a.mean[0] ** 2 +
        a.mean[1] ** 2
      ) / (2 * va);

    return {
      A,
      B,
      C: CC,
      D
    };
  }

  function boundaryGeometry(model) {
    const k =
      circularCoefficients(model);

    if (
      Math.abs(k.A) < 1e-12
    ) {
      return {
        type: 'line',
        ...k
      };
    }

    const cx =
      -k.B / (2 * k.A);

    const cy =
      -k.C / (2 * k.A);

    const radiusSquared =
      cx * cx +
      cy * cy -
      k.D / k.A;

    if (radiusSquared < 0) {
      return {
        type: 'none',
        ...k
      };
    }

    return {
      type: 'circle',
      centre: [cx, cy],
      radius: Math.sqrt(
        radiusSquared
      ),
      ...k
    };
  }

  const ORIGINAL_BOUNDARY =
    boundaryGeometry(ORIGINAL);

  // Original exact circle:
  //
  // scorePlum - scoreApple =
  // ln(4) - dP² + dA²/4.
  //
  // Its centre is (2/3, 3).
  //
  // radius² = 64/9 + (4/3)ln(4).
  //
  // radius ≈ 2.993.
  //
  // Part of this mathematical circle lies to the left
  // of the physical weight plotting range.
  // Only the part within the plotting frame is drawn.

  // ============================================================
  // CLIP BOUNDARY SEGMENTS TO THE DRAWING
  // ============================================================

  function clipSegment(
    a,
    b
  ) {
    const dx =
      b[0] - a[0];

    const dy =
      b[1] - a[1];

    let t0 = 0;
    let t1 = 1;

    const p = [
      -dx,
      dx,
      -dy,
      dy
    ];

    const q = [
      a[0],
      XMAX - a[0],
      a[1],
      YMAX - a[1]
    ];

    for (let i = 0; i < 4; i++) {
      if (
        Math.abs(p[i]) < 1e-12
      ) {
        if (q[i] < 0) {
          return null;
        }

      } else {
        const r = q[i] / p[i];

        if (p[i] < 0) {
          if (r > t1) {
            return null;
          }

          t0 = Math.max(t0, r);

        } else {
          if (r < t0) {
            return null;
          }

          t1 = Math.min(t1, r);
        }
      }
    }

    const start = [
      a[0] + t0 * dx,
      a[1] + t0 * dy
    ];

    const end = [
      a[0] + t1 * dx,
      a[1] + t1 * dy
    ];

    if (
      squaredDistance(
        start,
        end
      ) < 1e-14
    ) {
      return null;
    }

    return [
      start,
      end
    ];
  }

  function boundaryShape(model) {
    const geometry =
      boundaryGeometry(model);

    const parts = [];

    if (geometry.type === 'circle') {
      const [cx, cy] =
        geometry.centre;

      const radius =
        geometry.radius;

      const N = 180;

      function point(t) {
        return [
          cx + radius * Math.cos(t),
          cy + radius * Math.sin(t)
        ];
      }

      for (let i = 0; i < N; i++) {
        const a = point(
          2 * Math.PI * i / N
        );

        const b = point(
          2 * Math.PI *
          (i + 1) / N
        );

        const clipped =
          clipSegment(a, b);

        if (clipped) {
          parts.push(
            line(
              xy(...clipped[0]),
              xy(...clipped[1]),
              GOLD,
              3.2
            )
          );
        }
      }

    } else if (
      geometry.type === 'line'
    ) {
      const {
        B,
        C: CC,
        D
      } = geometry;

      let a;
      let b;

      if (
        Math.abs(B) >=
        Math.abs(CC)
      ) {
        a = [
          -D / B,
          0
        ];

        b = [
          -(CC * YMAX + D) / B,
          YMAX
        ];

      } else {
        a = [
          0,
          -D / CC
        ];

        b = [
          XMAX,
          -(B * XMAX + D) / CC
        ];
      }

      const clipped =
        clipSegment(a, b);

      if (clipped) {
        parts.push(
          line(
            xy(...clipped[0]),
            xy(...clipped[1]),
            GOLD,
            3.2
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // SHADED DECISION REGIONS
  // ============================================================

  // Use horizontal slices of the exact score equality.
  // Each slice is split at its calculated boundary roots.
  //
  // The colour of every interval is determined by an actual
  // QDA prediction at its midpoint.
  //
  // This avoids manually drawing a guessed curved boundary.
  // The fine horizontal slices approximate the fill visually;
  // the gold boundary itself follows the calculated curve.

  function horizontalRoots(
    model,
    y
  ) {
    const {
      A,
      B,
      C: CC,
      D
    } = circularCoefficients(
      model
    );

    const constant =
      A * y * y +
      CC * y +
      D;

    if (
      Math.abs(A) < 1e-12
    ) {
      if (
        Math.abs(B) < 1e-12
      ) {
        return [];
      }

      return [
        -constant / B
      ];
    }

    const discriminant =
      B * B -
      4 * A * constant;

    if (discriminant < 0) {
      return [];
    }

    const root =
      Math.sqrt(discriminant);

    return [
      (-B - root) / (2 * A),
      (-B + root) / (2 * A)
    ].sort(
      (a, b) => a - b
    );
  }

  function decisionRegions(model) {
    const ROWS = 76;

    const dy =
      YMAX / ROWS;

    const parts = [];

    for (let j = 0; j < ROWS; j++) {
      const y =
        (j + 0.5) * dy;

      const roots = horizontalRoots(
        model,
        y
      ).filter(
        x => x > 0 && x < XMAX
      );

      const edges = [
        0,
        ...roots,
        XMAX
      ];

      for (
        let i = 0;
        i < edges.length - 1;
        i++
      ) {
        const a = edges[i];
        const b = edges[i + 1];

        if (b - a < 1e-8) {
          continue;
        }

        const middle =
          (a + b) / 2;

        const result =
          model.predict(
            [middle, y]
          );

        const color =
          result.winner < 0
            ? GOLD
            : COLORS[result.winner];

        parts.push(
          rect(
            (b - a) * U,

            // A tiny overlap avoids visible seams.
            dy * U * 1.015,

            xy(middle, y),

            color,

            0.115,

            0
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function boundaryCaption(model) {
    const geometry =
      boundaryGeometry(model);

    let s = '';

    if (geometry.type === 'circle') {
      s = 'CURVED DECISION BOUNDARY';

    } else if (
      geometry.type === 'line'
    ) {
      s = 'STRAIGHT DECISION BOUNDARY';

    } else {
      s = 'NO EQUAL-SCORE CURVE';
    }

    return tag(
      s,
      GOLD,
      [
        CX,
        P ? -4.95 : Y(6.3),
        0
      ],
      P ? 16 : 13
    );
  }

  function regionLabels(model) {
    return model.means.map(
      (centre, i) => {
        const q = [
          centre[0],
          centre[1] + 0.85
        ];

        return tag(
          NAMES[i].toUpperCase(),
          COLORS[i],
          xy(...q),
          P ? 16 : 12
        );
      }
    );
  }

  let shadingNow = null;
  let boundaryNow = null;
  let boundaryNote = null;
  let regionNotes = [];

  // ============================================================
  // TRY IT PREVIEW HELPERS
  // ============================================================

  // All narrated exercise examples use recalculated statistics.
  // Original DATA is never mutated.
  //
  // The supplied scene interface does not expose pointer events,
  // so these are deterministic previews of the separate exercise.

  let activeModel = ORIGINAL;

  let activeQuery = QUERY_1.slice();

  function modelBox(
    model,
    title = 'FITTED QDA'
  ) {
    const p = model.groups[0];
    const a = model.groups[1];

    const geometry =
      boundaryGeometry(model);

    return fbox([
      [title, C.cyan],

      [
        `plum variance = ${fmt(p.vx)}`,
        PLUM
      ],

      [
        `apple variance = ${fmt(a.vx)}`,
        APPLE
      ],

      [
        `boundary: ${geometry.type}`,
        GOLD
      ]
    ], GOLD);
  }

  function tryBox(
    model,
    q,
    title = null
  ) {
    const r = model.predict(q);

    const color =
      r.winner < 0
        ? GOLD
        : COLORS[r.winner];

    return fbox([
      [
        title ||
        `${fmt(q[0] * 50)} g, hue ${fmt(q[1])}`,
        C.cyan
      ],

      [
        `P: h=${r.heights[0].toFixed(4)}  s=${fixed(r.scores[0])}`,
        PLUM
      ],

      [
        `A: h=${r.heights[1].toFixed(4)}  s=${fixed(r.scores[1])}`,
        APPLE
      ],

      [
        r.winner < 0
          ? 'equal scores: boundary'
          : `prediction: ${NAMES[r.winner]}`,
        color
      ]
    ], color);
  }

  function moveQueryAnimations(
    model,
    q,
    title = null
  ) {
    const result =
      model.predict(q);

    const nextBars =
      heightComparison(model, q);

    const nextGuides =
      model.means.map((m, i) =>
        centreConnector(
          m,
          q,
          COLORS[i]
        )
      );

    const animations = [
      ...remove(distanceGuides),

      new M.Transform(
        query,
        unknown(xy(...q)),
        {
          runTime: 1.15
        }
      ),

      reveal(
        nextGuides,
        0.90,
        0.10
      )
    ];

    if (heightBarsNow) {
      animations.push(
        new M.Transform(
          heightBarsNow,
          nextBars,
          {
            runTime: 1.10
          }
        )
      );

    } else {
      heightBarsNow = nextBars;

      animations.push(
        new M.FadeIn(
          heightBarsNow
        )
      );
    }

    animations.push(
      ...tryBox(
        model,
        q,
        title
      )
    );

    distanceGuides = nextGuides;

    activeQuery = q.slice();

    return animations;
  }

  function refitAnimations(
    model,
    q
  ) {
    const nextPoints =
      plotPoints(model.data);

    const nextCentres =
      model.means.map((m, i) =>
        centreCross(
          m,
          COLORS[i]
        )
      );

    const nextContours =
      fittedContours(model);

    const nextShading =
      decisionRegions(model);

    const nextBoundary =
      boundaryShape(model);

    const nextCaption =
      boundaryCaption(model);

    const nextRegions =
      regionLabels(model);

    const nextHeightBars =
      heightComparison(model, q);

    const nextGuides =
      model.means.map((m, i) =>
        centreConnector(
          m,
          q,
          COLORS[i]
        )
      );

    const animations = [];

    points.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextPoints[i],
          {
            runTime: 1.20
          }
        )
      );
    });

    centres.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextCentres[i],
          {
            runTime: 1.20
          }
        )
      );
    });

    contours.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextContours[i],
          {
            runTime: 1.20
          }
        )
      );
    });

    // The circle and line have different segment counts.
    // Fade between the correctly calculated boundaries,
    // rather than morphing incompatible geometry.

    animations.push(
      ...remove([
        shadingNow,
        boundaryNow,
        boundaryNote,
        ...regionNotes,
        ...distanceGuides
      ]),

      new M.FadeIn(nextShading),

      new M.FadeIn(nextBoundary),

      new M.FadeIn(nextCaption),

      reveal(
        nextRegions,
        0.90,
        0.10
      ),

      reveal(
        nextGuides,
        0.90,
        0.10
      ),

      new M.Transform(
        query,
        unknown(xy(...q)),
        {
          runTime: 1.10
        }
      )
    );

    if (heightBarsNow) {
      animations.push(
        new M.Transform(
          heightBarsNow,
          nextHeightBars,
          {
            runTime: 1.10
          }
        )
      );

    } else {
      heightBarsNow =
        nextHeightBars;

      animations.push(
        new M.FadeIn(
          heightBarsNow
        )
      );
    }

    shadingNow = nextShading;
    boundaryNow = nextBoundary;
    boundaryNote = nextCaption;
    regionNotes = nextRegions;
    distanceGuides = nextGuides;

    activeModel = model;
    activeQuery = q.slice();

    return animations;
  }

  // ============================================================
  // BEATS 0–4: RETURN TO THE TWO FRUIT GROUPS
  // ============================================================

  // 0. The sorter decides between plum and apple.

  await until(S(0));

  await play(
    new M.FadeIn(intro),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['plum or apple?', GOLD]
    ], GOLD),

    ...say('PLUM OR APPLE?', GOLD)
  );

  // 1. Should it always choose the closest centre?

  await until(S(1));

  await play(
    ...fbox([
      ['choose the closest centre?', C.ink],
      ['is that always best?', GOLD]
    ], GOLD),

    ...say('DOES THE CLOSEST CENTRE ALWAYS WIN?', GOLD)
  );

  // 2. Return to the original eight labelled fruits.

  await until(S(2));

  await play(
    new M.FadeOut(intro),

    ...clearBox(),

    reveal(graph, 0.90, 0.08),

    reveal(points, 1.35, 0.08),

    ...say('4 PLUMS AND 4 APPLES')
  );

  // 3. Plum centre: 100 grams, hue 3.

  await until(S(3));

  await play(
    new M.FadeIn(centres[0]),

    new M.FadeIn(centreLabels[0]),

    ...fbox([
      ['PLUM CENTRE', PLUM],
      ['mean weight = 100 g', C.ink],
      ['mean hue = 3', C.ink],
      ['grid position = (2, 3)', GOLD]
    ], PLUM),

    ...say('PLUM CENTRE: (100 g, 3)', PLUM)
  );

  // 4. Apple centre: 300 grams, hue 3.

  await until(S(4));

  await play(
    new M.FadeIn(centres[1]),

    new M.FadeIn(centreLabels[1]),

    ...fbox([
      ['APPLE CENTRE', APPLE],
      ['mean weight = 300 g', C.ink],
      ['mean hue = 3', C.ink],
      ['grid position = (6, 3)', GOLD]
    ], APPLE),

    ...say('APPLE CENTRE: (300 g, 3)', APPLE)
  );

  // ============================================================
  // BEATS 5–8: DIFFERENT GROUP SPREADS
  // ============================================================

  const observed = observedSpread(
    ORIGINAL
  );

  // 5. Plums gather tightly around their centre.

  await until(S(5));

  await play(
    new M.FadeIn(observed[0]),

    new M.LaggedStart(
      points.slice(0, 4).map(p =>
        new M.Indicate(
          p,
          {
            color: PLUM
          }
        )
      ),
      {
        lagRatio: 0.15,
        runTime: 1.45
      }
    ),

    ...fbox([
      ['PLUMS', PLUM],
      ['tightly grouped', C.ink],
      ['enclosing radius = 1', GOLD]
    ], PLUM),

    ...say('PLUMS GATHER TIGHTLY', PLUM)
  );

  // 6. Apples occupy a larger area.

  await until(S(6));

  await play(
    new M.FadeIn(observed[1]),

    ...fbox([
      ['APPLES', APPLE],
      ['more widely spread', C.ink],
      ['enclosing radius = 2', GOLD]
    ], APPLE),

    ...say('APPLES ARE MORE SPREAD OUT', APPLE)
  );

  contours = observed;

  // 7. LDA gave both groups the same pattern of spread.

  const sharedContours =
    ORIGINAL.means.map(m =>
      spreadCircle(
        m,
        Math.sqrt(SHARED.vx),
        C.cyan,
        0.055
      )
    );

  await until(S(7));

  await play(
    ...remove(contours),

    reveal(
      sharedContours,
      1.20,
      0.15
    ),

    ...fbox([
      ['PREVIOUS LESSON: LDA', C.cyan],
      ['one shared covariance', C.ink],
      ['shared variance = 1.25', GOLD]
    ]),

    ...say('LDA: ONE SHARED SPREAD')
  );

  contours =
    sharedContours;

  // 8. Let each group keep its own spread pattern.

  const separateContours =
    fittedContours(ORIGINAL);

  await until(S(8));

  await play(
    ...remove(contours),

    reveal(
      separateContours,
      1.20,
      0.15
    ),

    ...fbox([
      ['THIS TIME', GOLD],
      ['one spread for plums', PLUM],
      ['another spread for apples', APPLE]
    ], GOLD),

    ...say('GIVE EACH GROUP ITS OWN SPREAD', GOLD)
  );

  contours =
    separateContours;

  // ============================================================
  // BEATS 9–14: BUILD THE DENSITY MOUNDS
  // ============================================================

  floorNow = moundFloor();

  moundsNow = [
    moundSurface(
      ORIGINAL,
      0
    ),

    moundSurface(
      ORIGINAL,
      1
    )
  ];

  peaksNow = [
    moundPeak(
      ORIGINAL,
      0
    ),

    moundPeak(
      ORIGINAL,
      1
    )
  ];

  floorFruits =
    projectedFruits(ORIGINAL);

  // 9. Imagine building a smooth mound above each group.

  await until(S(9));

  await play(
    ...remove(graph),
    ...remove(points),
    ...remove(centres),
    ...remove(centreLabels),
    ...remove(contours),

    new M.FadeIn(floorNow),

    reveal(
      floorFruits,
      0.90,
      0.06
    ),

    reveal(
      moundsNow,
      1.70,
      0.15
    ),

    ...fbox([
      ['FITTED DENSITY MOUNDS', C.cyan],
      ['one mound for each label', C.ink],
      ['same measurement axes', C.muted]
    ]),

    ...say('A SMOOTH MOUND FOR EACH FRUIT TYPE')
  );

  // 10. Highest at the centre, lower farther away.

  await until(S(10));

  await play(
    reveal(
      peaksNow,
      1.10,
      0.20
    ),

    ...fbox([
      ['highest at the centre', GOLD],
      ['height decreases', C.ink],
      ['as distance increases', C.ink]
    ], GOLD),

    ...say('HIGHEST AT THE CENTRE', GOLD)
  );

  // 11. Height shows how typical measurements are.

  await until(S(11));

  await play(
    ...fbox([
      ['MOUND HEIGHT', C.cyan],
      ['how typical the measurements', C.ink],
      ['are for this fruit type', C.ink],
      ['density, not probability', C.muted]
    ]),

    ...say('HEIGHT SHOWS HOW TYPICAL THE MEASUREMENTS ARE')
  );

  // 12. Plum mound is narrow and tall.

  await until(S(12));

  await play(
    new M.Indicate(
      peaksNow[0],
      {
        color: PLUM
      }
    ),

    ...fbox([
      ['PLUM MOUND', PLUM],
      ['small spread', C.ink],
      ['narrow and tall', PLUM],
      ['scaled peak height = 2', GOLD]
    ], PLUM),

    ...say('PLUM: NARROW AND TALL', PLUM)
  );

  // 13. Apple mound is wider and shorter.

  await until(S(13));

  await play(
    new M.Indicate(
      peaksNow[1],
      {
        color: APPLE
      }
    ),

    ...fbox([
      ['APPLE MOUND', APPLE],
      ['larger spread', C.ink],
      ['wider and shorter', APPLE],
      ['scaled peak height = 0.5', GOLD]
    ], APPLE),

    ...say('APPLE: WIDER AND SHORTER', APPLE)
  );

  // 14. Equal starting probabilities mean equal total volume.
  //
  // Both Gaussian densities integrate to one.
  // Multiplying by equal priors gives equal weighted volume.
  // Our common visual scaling preserves that equality.

  const priorTags = [
    tag(
      'PRIOR = 1/2',
      PLUM,
      [
        CX - 1.45,
        P ? -4.25 : -2.72,
        0
      ],
      P ? 17 : 15
    ),

    tag(
      'PRIOR = 1/2',
      APPLE,
      [
        CX + 1.45,
        P ? -4.25 : -2.72,
        0
      ],
      P ? 17 : 15
    )
  ];

  await until(S(14));

  await play(
    reveal(
      priorTags,
      1.10,
      0.15
    ),

    ...fbox([
      ['EQUAL STARTING PROBABILITIES', C.cyan],
      ['plum: 4/8 = 1/2', PLUM],
      ['apple: 4/8 = 1/2', APPLE],
      ['equal total mound volumes', GOLD]
    ], GOLD),

    ...say('DIFFERENT SHAPES, EQUAL TOTAL VOLUME', GOLD)
  );

  // ============================================================
  // BEATS 15–19: COMPARE THE HEIGHTS
  // ============================================================

  // Use (4, 3) as a temporary illustration.
  // The specific 175-gram fruit is introduced later.

  const DEMO_QUERY = [4, 3];

  const DEMO_RESULT =
    ORIGINAL.predict(DEMO_QUERY);

  const projectedQuery =
    unknown(
      project(
        DEMO_QUERY[0],
        DEMO_QUERY[1]
      ),
      FR * 0.95
    );

  // 15. Place a new fruit beneath both mounds.

  await until(S(15));

  await play(
    ...remove(priorTags),

    new M.FadeIn(
      projectedQuery
    ),

    ...fbox([
      ['ONE NEW FRUIT', WHITE],
      ['one measurement position', C.ink],
      ['two fitted mound heights', GOLD]
    ]),

    ...say('PLACE A FRUIT BELOW BOTH MOUNDS', WHITE)
  );

  // 16. Compare the heights directly above the fruit.

  probeNow = moundProbe(
    ORIGINAL,
    DEMO_QUERY
  );

  await until(S(16));

  await play(
    new M.FadeOut(
      projectedQuery
    ),

    new M.FadeIn(
      probeNow
    ),

    ...fbox([
      ['COMPARE AT THE SAME POSITION', C.cyan],
      [
        `plum height ≈ ${DEMO_RESULT.heights[0].toFixed(4)}`,
        PLUM
      ],
      [
        `apple height ≈ ${DEMO_RESULT.heights[1].toFixed(4)}`,
        APPLE
      ],
      ['not just distance to a centre', C.muted]
    ]),

    ...say('COMPARE THE TWO HEIGHTS ABOVE THE FRUIT')
  );

  // 17. The higher mound wins.

  await until(S(17));

  await play(
    new M.Indicate(
      probeNow,
      {
        color: APPLE
      }
    ),

    ...fbox([
      ['AT 200 g, HUE 3', C.ink],
      ['apple mound is higher', APPLE],
      ['PREDICTION: APPLE', APPLE]
    ], APPLE),

    ...say('THE HIGHER MOUND WINS', APPLE)
  );

  // 18. Quadratic discriminant analysis, or QDA.

  await until(S(18));

  await play(
    ...fbox([
      ['QUADRATIC DISCRIMINANT', C.cyan],
      ['ANALYSIS', C.cyan],
      ['QDA', GOLD]
    ]),

    ...say('QUADRATIC DISCRIMINANT ANALYSIS')
  );

  // 19. Squared measurements can produce curved boundaries.

  await until(S(19));

  await play(
    ...fbox([
      ['quadratic: involves squares', GOLD],
      ['discriminant: separates groups', C.ink],
      ['the boundary can be curved', C.ink]
    ], GOLD),

    ...say('QUADRATIC CALCULATIONS CAN PRODUCE CURVES', GOLD)
  );

  // ============================================================
  // BEATS 20–25: CALCULATE THE FITTED SPREADS
  // ============================================================

  // 20. How does the sorter build these mounds?

  graph = graphParts();

  points = plotPoints();

  centres = ORIGINAL.means.map(
    (m, i) =>
      centreCross(
        m,
        COLORS[i]
      )
  );

  centreLabels = ORIGINAL.means.map(
    (m, i) =>
      centreLabel(
        m,
        i
      )
  );

  contours =
    fittedContours(ORIGINAL);

  await until(S(20));

  await play(
    new M.FadeOut(floorNow),

    ...remove(moundsNow),
    ...remove(peaksNow),
    ...remove(floorFruits),

    new M.FadeOut(probeNow),

    reveal(graph, 0.85, 0.05),

    reveal(points, 1.0, 0.05),

    reveal(centres, 0.85, 0.10),

    reveal(contours, 0.95, 0.10),

    ...fbox([
      ['BUILD FROM KNOWN EXAMPLES', C.cyan],
      ['calculate each group’s centre', C.ink],
      ['calculate its own covariance', GOLD]
    ]),

    ...say('BUILD THE MOUNDS FROM THE FRUIT DATA')
  );

  probeNow = null;

  // 21. Variance averages squared deviations.

  await until(S(21));

  await play(
    ...fbox([
      ['VARIANCE', C.cyan],
      ['sum of squared deviations', C.ink],
      ['÷ number of fruits', GOLD]
    ]),

    ...say('VARIANCE = MEAN SQUARED DEVIATION')
  );

  // 22. Plum variance is 0.5 in both directions.

  const plumVarianceTag = tag(
    'VARIANCE = 0.5',
    PLUM,
    [
      X(2),
      Y(6.50),
      0
    ],
    P ? 15 : 12
  );

  await until(S(22));

  await play(
    new M.FadeIn(
      plumVarianceTag
    ),

    ...fbox([
      ['PLUM VARIANCE', PLUM],
      ['horizontal: (1+1+0+0)/4', C.ink],
      ['vertical:   (0+0+1+1)/4', C.ink],
      ['both = 0.5', PLUM]
    ], PLUM),

    ...say('PLUM VARIANCE = 0.5 IN BOTH DIRECTIONS', PLUM)
  );

  // 23. Apple variance is 2 in both directions.

  const appleVarianceTag = tag(
    'VARIANCE = 2',
    APPLE,
    [
      X(6),
      Y(6.50),
      0
    ],
    P ? 15 : 12
  );

  await until(S(23));

  await play(
    new M.FadeIn(
      appleVarianceTag
    ),

    ...fbox([
      ['APPLE VARIANCE', APPLE],
      ['horizontal: (4+4+0+0)/4', C.ink],
      ['vertical:   (0+0+4+4)/4', C.ink],
      ['both = 2', APPLE]
    ], APPLE),

    ...say('APPLE VARIANCE = 2 IN BOTH DIRECTIONS', APPLE)
  );

  // 24. Zero covariance means neither mound needs a tilt.

  const covarianceGuides =
    ORIGINAL.groups.flatMap((g, i) => {
      const [x, y] = g.mean;

      const r = g.maxRadius;

      return [
        dashed(
          xy(x - r, y),
          xy(x + r, y),
          COLORS[i]
        ),

        dashed(
          xy(x, y - r),
          xy(x, y + r),
          COLORS[i]
        )
      ];
    });

  await until(S(24));

  await play(
    reveal(
      covarianceGuides,
      1.10,
      0.10
    ),

    ...fbox([
      ['COVARIANCE', C.cyan],
      ['average of dx × dy', C.ink],
      ['every product is zero here', GOLD],
      ['neither spread has a tilt', C.ink]
    ]),

    ...say('COVARIANCE = 0 FOR BOTH GROUPS')
  );

  await play(
    ...fbox([
      ['PLUM:  [ 0.5   0   ]', PLUM],
      ['       [ 0     0.5 ]', PLUM],
      ['APPLE: [ 2     0   ]', APPLE],
      ['       [ 0     2   ]', APPLE]
    ])
  );

  // 25. Apple mound is twice as wide in each direction.
  //
  // Width scales with standard deviation, not variance.

  const sigmaP =
    Math.sqrt(PLUM_STATS.vx);

  const sigmaA =
    Math.sqrt(APPLE_STATS.vx);

  const sigmaRatio =
    sigmaA / sigmaP;

  await until(S(25));

  await play(
    ...remove(covarianceGuides),

    ...fbox([
      ['WIDTH USES STANDARD DEVIATION', C.cyan],
      [
        `plum:  √0.5 ≈ ${fmt(sigmaP)}`,
        PLUM
      ],
      [
        `apple: √2   ≈ ${fmt(sigmaA)}`,
        APPLE
      ],
      [
        `apple width = ${fmt(sigmaRatio)} × plum width`,
        GOLD
      ]
    ], GOLD),

    ...say('APPLE MOUND IS TWICE AS WIDE', GOLD)
  );

  // ============================================================
  // BEATS 26–31: FIRST 175-GRAM FRUIT
  // ============================================================

  query = unknown(
    xy(...QUERY_1)
  );

  const weightGuide = dashed(
    xy(QUERY_1[0], 0),
    xy(...QUERY_1),
    WHITE
  );

  const hueGuide = dashed(
    xy(0, QUERY_1[1]),
    xy(...QUERY_1),
    WHITE
  );

  // 26. Fruit weighs 175 grams and has hue 3.

  await until(S(26));

  await play(
    new M.FadeOut(
      plumVarianceTag
    ),

    new M.FadeOut(
      appleVarianceTag
    ),

    new M.Create(weightGuide),

    new M.Create(hueGuide),

    new M.FadeIn(query),

    ...fbox([
      ['NEW FRUIT', WHITE],
      ['weight = 175 grams', C.cyan],
      ['hue = 3', C.green],
      ['grid position = (3.5, 3)', GOLD]
    ]),

    ...say('175 g, HUE 3', WHITE)
  );

  // 27. It is between the centres and closer to plum.

  const firstConnectors =
    ORIGINAL.means.map((m, i) =>
      centreConnector(
        m,
        QUERY_1,
        COLORS[i]
      )
    );

  await until(S(27));

  await play(
    new M.FadeOut(weightGuide),

    new M.FadeOut(hueGuide),

    reveal(
      firstConnectors,
      1.10,
      0.12
    ),

    ...fbox([
      ['plum centre: x = 2', PLUM],
      ['new fruit: x = 3.5', WHITE],
      ['apple centre: x = 6', APPLE],
      ['closer to plum centre', GOLD]
    ], GOLD),

    ...say('BETWEEN THE TWO CENTRES')
  );

  distanceGuides =
    firstConnectors;

  // 28. Plum distance is 1.5 grid spaces.

  const plumDistance =
    horizontalDistance(
      PLUM_CENTRE,
      QUERY_1,
      PLUM
    );

  await until(S(28));

  await play(
    new M.FadeIn(
      plumDistance
    ),

    ...fbox([
      ['PLUM DISTANCE', PLUM],
      ['3.5 − 2', C.ink],
      ['= 1.5 grid spaces', PLUM]
    ], PLUM),

    ...say('PLUM DISTANCE = 1.5', PLUM)
  );

  // 29. Plum squared distance is 2.25.

  await until(S(29));

  await play(
    ...fbox([
      ['PLUM SQUARED DISTANCE', PLUM],
      ['1.5 × 1.5', C.ink],
      [
        `= ${fmt(RESULT_1.squared[0])}`,
        PLUM
      ]
    ], PLUM),

    ...say('PLUM DISTANCE² = 2.25', PLUM)
  );

  // 30. Apple distance is 2.5 grid spaces.

  const appleDistance =
    horizontalDistance(
      APPLE_CENTRE,
      QUERY_1,
      APPLE
    );

  await until(S(30));

  await play(
    new M.FadeIn(
      appleDistance
    ),

    ...fbox([
      ['APPLE DISTANCE', APPLE],
      ['6 − 3.5', C.ink],
      ['= 2.5 grid spaces', APPLE]
    ], APPLE),

    ...say('APPLE DISTANCE = 2.5', APPLE)
  );

  // 31. Apple squared distance is 6.25.

  await until(S(31));

  await play(
    ...fbox([
      ['APPLE SQUARED DISTANCE', APPLE],
      ['2.5 × 2.5', C.ink],
      [
        `= ${fmt(RESULT_1.squared[1])}`,
        APPLE
      ]
    ], APPLE),

    ...say('APPLE DISTANCE² = 6.25', APPLE)
  );

  // ============================================================
  // BEATS 32–35: LOGARITHMIC SCORES
  // ============================================================

  // 32. Use logarithms to compare mound heights.

  await until(S(32));

  await play(
    new M.FadeOut(
      plumDistance
    ),

    new M.FadeOut(
      appleDistance
    ),

    ...fbox([
      ['LOGARITHM', C.cyan],
      ['turn a positive mound height', C.ink],
      ['into a comparison score', GOLD]
    ]),

    ...say('USE LOGARITHMS TO COMPARE HEIGHTS')
  );

  // 33. Logarithms preserve the order of positive numbers.

  const logOrder = new M.VGroup(
    rounded(
      P ? 4.60 : 3.35,
      P ? 0.93 : 0.70,
      [
        (XL + XR) / 2,
        Y(7.48),
        0
      ],
      C.cyan,
      0.97
    ),

    text(
      '0.5 < 1 < 2',
      P ? 20 : 17,
      C.ink,
      [
        (XL + XR) / 2,
        Y(7.48) + 0.20,
        0
      ],
      true
    ),

    text(
      '−0.69 < 0 < +0.69',
      P ? 19 : 15,
      GOLD,
      [
        (XL + XR) / 2,
        Y(7.48) - 0.19,
        0
      ],
      true
    )
  );

  await until(S(33));

  await play(
    new M.FadeIn(logOrder),

    ...fbox([
      ['POSITIVE HEIGHTS', C.ink],
      ['0.5 < 1 < 2', C.cyan],
      ['LOGARITHMS KEEP THE ORDER', GOLD],
      ['−0.69 < 0 < +0.69', GOLD]
    ]),

    ...say('LOGARITHMS KEEP THE SAME ORDER')
  );

  // 34. Narrow plum mound starts at ln(2) ≈ +0.69.

  scoresNow = scorePair([
    ORIGINAL.startingScore(0),
    null
  ], 'START');

  await until(S(34));

  await play(
    new M.FadeOut(logOrder),

    new M.FadeIn(
      scoresNow[0]
    ),

    ...fbox([
      ['PLUM STARTING SCORE', PLUM],
      ['−ln(0.5)', C.ink],
      ['= ln(2)', C.ink],
      [
        `≈ ${signed(ORIGINAL.startingScore(0))}`,
        PLUM
      ]
    ], PLUM),

    ...say('PLUM STARTS AT +0.69', PLUM)
  );

  // 35. Wider apple mound starts at -ln(2) ≈ -0.69.

  scoresNow[1] =
    scoreCard(
      1,
      ORIGINAL.startingScore(1),
      'START'
    );

  await until(S(35));

  await play(
    new M.FadeIn(
      scoresNow[1]
    ),

    ...fbox([
      ['APPLE STARTING SCORE', APPLE],
      ['−ln(2)', C.ink],
      [
        `≈ ${signed(ORIGINAL.startingScore(1))}`,
        APPLE
      ],
      ['a lower starting height', C.muted]
    ], APPLE),

    ...say('APPLE STARTS AT −0.69', APPLE)
  );

  // ============================================================
  // BEATS 36–40: CALCULATE FIRST FRUIT SCORES
  // ============================================================

  // 36. Plum subtracts its squared distance of 2.25.
  //
  // The variance is 0.5.
  // Twice the variance is 1.

  await until(S(36));

  await play(
    ...fbox([
      ['PLUM VARIANCE = 0.5', PLUM],
      ['2 × 0.5 = 1', C.ink],
      ['score = ln(2) − 2.25/1', C.ink],
      ['subtract 2.25', GOLD]
    ], PLUM),

    ...say('PLUM: SUBTRACT ITS SQUARED DISTANCE', PLUM)
  );

  // 37. Plum score is approximately -1.56.

  await until(S(37));

  await play(
    new M.Transform(
      scoresNow[0],

      scoreCard(
        0,
        RESULT_1.scores[0]
      ),

      {
        runTime: 0.85
      }
    ),

    ...fbox([
      ['PLUM SCORE', PLUM],
      ['ln(2) − 2.25', C.ink],
      [
        `≈ ${fixed(RESULT_1.scores[0])}`,
        PLUM
      ]
    ], PLUM),

    ...say('PLUM SCORE ≈ −1.56', PLUM)
  );

  // 38. Apple divides its squared distance by four.
  //
  // The wider mound has variance 2.
  // Twice the variance is 4.

  await until(S(38));

  await play(
    ...fbox([
      ['APPLE VARIANCE = 2', APPLE],
      ['2 × 2 = 4', C.ink],
      ['6.25 ÷ 4 = 1.5625', GOLD],
      ['a smaller distance penalty', C.muted]
    ], APPLE),

    ...say('APPLE: DIVIDE DISTANCE² BY 4', APPLE)
  );

  // 39. Subtract from the apple starting score.

  await until(S(39));

  await play(
    new M.Transform(
      scoresNow[1],

      scoreCard(
        1,
        RESULT_1.scores[1]
      ),

      {
        runTime: 0.95
      }
    ),

    ...fbox([
      ['APPLE SCORE', APPLE],
      ['−ln(2) − 6.25/4', C.ink],
      ['= −ln(2) − 1.5625', C.ink],
      [
        `≈ ${fixed(RESULT_1.scores[1])}`,
        APPLE
      ]
    ], APPLE),

    ...say('APPLE SCORE ≈ −2.26', APPLE)
  );

  // 40. Plum has the higher score.
  // -1.56 is greater than -2.26.

  const firstPrediction = tag(
    'PREDICTION: PLUM',
    PLUM,
    [
      CX,
      P ? -4.95 : Y(6.15),
      0
    ],
    P ? 17 : 14
  );

  await until(S(40));

  await play(
    new M.Indicate(
      scoresNow[0],
      {
        color: PLUM
      }
    ),

    new M.FadeIn(
      firstPrediction
    ),

    ...fbox([
      ['−1.56 > −2.26', GOLD],
      ['plum has the higher score', PLUM],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('PREDICTION: PLUM', PLUM)
  );

  // ============================================================
  // BEATS 41–44: SAME WEIGHT, DIFFERENT HUE
  // ============================================================

  // 41. Move upward by two hue steps.
  // Weight remains exactly 175 grams.

  const upwardGuide = line(
    xy(...QUERY_1),
    xy(...QUERY_2),
    WHITE,
    2.8
  );

  const upwardLabel = text(
    '+2 hue',
    P ? 16 : 14,
    WHITE,
    [
      X(3.5) + 0.40,
      Y(4),
      0
    ],
    true
  );

  await until(S(41));

  await play(
    new M.FadeOut(
      firstPrediction
    ),

    ...remove(distanceGuides),

    new M.Create(
      upwardGuide
    ),

    new M.FadeIn(
      upwardLabel
    ),

    new M.Transform(
      query,
      unknown(
        xy(...QUERY_2)
      ),
      {
        runTime: 1.35
      }
    ),

    ...fbox([
      ['SAME WEIGHT: 175 g', C.cyan],
      ['hue: 3 → 5', C.green],
      ['grid position: (3.5, 5)', WHITE]
    ]),

    ...say('SAME WEIGHT, TWO HUE STEPS UP')
  );

  distanceGuides = [];

  // 42. Plum score falls to about -5.56.
  //
  // dP² = 1.5² + 2² = 6.25.

  const secondPlumTriangle =
    distanceTriangle(
      PLUM_CENTRE,
      QUERY_2,
      PLUM
    );

  await until(S(42));

  await play(
    new M.FadeOut(
      upwardGuide
    ),

    new M.FadeOut(
      upwardLabel
    ),

    new M.FadeIn(
      secondPlumTriangle
    ),

    new M.Transform(
      scoresNow[0],

      scoreCard(
        0,
        RESULT_2.scores[0]
      ),

      {
        runTime: 1.0
      }
    ),

    ...fbox([
      ['PLUM: 1.5² + 2² = 6.25', PLUM],
      ['score = ln(2) − 6.25', C.ink],
      [
        `≈ ${fixed(RESULT_2.scores[0])}`,
        PLUM
      ]
    ], PLUM),

    ...say('PLUM SCORE FALLS TO −5.56', PLUM)
  );

  // 43. Apple score falls more slowly.
  //
  // dA² = 2.5² + 2² = 10.25.
  //
  // The added squared distance is 4 for both groups.
  // Plum loses 4 score units.
  // Apple loses only 4/4 = 1 score unit.

  const secondAppleTriangle =
    distanceTriangle(
      APPLE_CENTRE,
      QUERY_2,
      APPLE
    );

  await until(S(43));

  await play(
    new M.FadeOut(
      secondPlumTriangle
    ),

    new M.FadeIn(
      secondAppleTriangle
    ),

    new M.Transform(
      scoresNow[1],

      scoreCard(
        1,
        RESULT_2.scores[1]
      ),

      {
        runTime: 1.0
      }
    ),

    ...fbox([
      ['APPLE: 2.5² + 2² = 10.25', APPLE],
      ['score = −ln(2) − 10.25/4', C.ink],
      [
        `≈ ${fixed(RESULT_2.scores[1])}`,
        APPLE
      ]
    ], APPLE),

    ...say('APPLE SCORE FALLS MORE SLOWLY', APPLE)
  );

  // 44. Apple now wins even though its centre is farther away.

  const secondConnectors =
    ORIGINAL.means.map((m, i) =>
      centreConnector(
        m,
        QUERY_2,
        COLORS[i]
      )
    );

  const secondPrediction = tag(
    'PREDICTION: APPLE',
    APPLE,
    [
      CX,
      P ? -4.95 : Y(6.10),
      0
    ],
    P ? 17 : 14
  );

  await until(S(44));

  await play(
    new M.FadeOut(
      secondAppleTriangle
    ),

    reveal(
      secondConnectors,
      0.95,
      0.12
    ),

    new M.FadeIn(
      secondPrediction
    ),

    new M.Indicate(
      scoresNow[1],
      {
        color: APPLE
      }
    ),

    ...fbox([
      ['−3.26 > −5.56', GOLD],
      [
        `centre distances: ${fmt(RESULT_2.distances[0])}, ${fmt(RESULT_2.distances[1])}`,
        C.ink
      ],
      ['apple centre is still farther', C.muted],
      ['PREDICTION: APPLE', APPLE]
    ], APPLE),

    ...say('APPLE WINS DESPITE ITS FARTHER CENTRE', APPLE)
  );

  distanceGuides =
    secondConnectors;

  // ============================================================
  // BEATS 45–46: REVEAL THE CURVED DECISION BOUNDARY
  // ============================================================

  shadingNow =
    decisionRegions(ORIGINAL);

  regionNotes =
    regionLabels(ORIGINAL);

  // 45. Colour each position according to the higher mound.

  await until(S(45));

  await play(
    new M.FadeOut(
      secondPrediction
    ),

    ...remove(scoresNow),

    ...remove(distanceGuides),

    new M.FadeIn(
      shadingNow,
      {
        runTime: 1.7
      }
    ),

    reveal(
      regionNotes,
      0.90,
      0.12
    ),

    ...fbox([
      ['COLOUR EVERY POSITION', C.cyan],
      ['purple: plum score is higher', PLUM],
      ['orange: apple score is higher', APPLE]
    ]),

    ...say('COLOUR THE REGION WHERE EACH MOUND WINS')
  );

  scoresNow = [];
  distanceGuides = [];

  // 46. Equal heights form a curved boundary.
  // In this example the complete mathematical curve is a circle.

  boundaryNow =
    boundaryShape(ORIGINAL);

  boundaryNote =
    boundaryCaption(ORIGINAL);

  const comparisonFruit1 =
    unknown(
      xy(...QUERY_1),
      FR * 1.05
    );

  const sameWeightGuide =
    dashed(
      xy(...QUERY_1),
      xy(...QUERY_2),
      WHITE
    );

  await until(S(46));

  await play(
    new M.FadeIn(
      boundaryNow,
      {
        runTime: 1.40
      }
    ),

    new M.FadeIn(
      boundaryNote
    ),

    new M.FadeIn(
      comparisonFruit1
    ),

    new M.Create(
      sameWeightGuide
    ),

    ...fbox([
      ['EQUAL HEIGHTS', GOLD],
      ['plum score = apple score', C.ink],
      ['a circular decision boundary', GOLD],
      ['shown inside the drawing', C.muted]
    ], GOLD),

    ...say('EQUAL HEIGHTS FORM A CURVED BOUNDARY', GOLD)
  );

  await play(
    ...fbox([
      ['BOTH FRUITS WEIGH 175 g', C.ink],
      ['hue 3 → plum', PLUM],
      ['hue 5 → apple', APPLE],
      ['same weight, different labels', GOLD]
    ], GOLD)
  );

  // ============================================================
  // BEAT 47: GENERAL FORMULA FOR CIRCULAR MOUNDS
  // ============================================================

  // 47. For circular covariance and equal priors:
  //
  // score = -ln(variance)
  //       - squared distance/(2 * variance).
  //
  // This simplified expression is specific to the
  // two-dimensional circular example.

  await until(S(47));

  await play(
    ...fbox([
      ['FOR OUR CIRCULAR MOUNDS', C.cyan],
      ['score = −ln(variance)', GOLD],
      ['      − distance²', C.ink],
      ['        ÷ (2 × variance)', C.ink]
    ], GOLD),

    ...say('QDA SCORE: STARTING HEIGHT MINUS DISTANCE PENALTY')
  );

  await until(S(47) + 4.0);

  await play(
    ...fbox([
      ['PLUM: variance = 0.5', PLUM],
      ['score = ln(2) − dP²', PLUM],
      ['APPLE: variance = 2', APPLE],
      ['score = −ln(2) − dA²/4', APPLE]
    ])
  );

  await until(S(47) + 8.0);

  await play(
    ...fbox([
      ['NARROW MOUND', PLUM],
      ['higher start, faster fall', C.ink],
      ['WIDE MOUND', APPLE],
      ['lower start, slower fall', C.ink]
    ], GOLD)
  );

  // ============================================================
  // BEATS 48–49: USEFULNESS AND LIMITATION
  // ============================================================

  // 48. QDA accommodates different amounts or directions of spread.

  await until(S(48));

  await play(
    new M.FadeOut(
      comparisonFruit1
    ),

    new M.FadeOut(
      sameWeightGuide
    ),

    ...fbox([
      ['QDA ALLOWS EACH GROUP ITS OWN', C.cyan],
      ['amount of spread', C.ink],
      ['direction of spread', C.ink],
      ['and covariance matrix', GOLD]
    ]),

    ...say('DIFFERENT GROUPS CAN HAVE DIFFERENT SPREADS')
  );

  // 49. Very few examples can lead to poor spread estimates.

  await until(S(49));

  await play(
    new M.LaggedStart(
      points.map((p, i) =>
        new M.Indicate(
          p,
          {
            color: i < 4
              ? PLUM
              : APPLE,

            runTime: 0.60
          }
        )
      ),
      {
        lagRatio: 0.10,
        runTime: 1.70
      }
    ),

    ...fbox([
      ['IMPORTANT LIMITATION', GOLD],
      ['each group needs enough data', C.ink],
      ['few examples can produce', C.ink],
      ['poor covariance estimates', GOLD]
    ], GOLD),

    ...say('FEW EXAMPLES CAN GIVE POOR SPREAD ESTIMATES', GOLD)
  );

  // ============================================================
  // BEATS 50–52: TRY IT — MOVE THE UNKNOWN FRUIT
  // ============================================================

  // 50. Drag the fruit and watch the heights, scores
  // and predicted label update.

  activeModel = ORIGINAL;
  activeQuery = QUERY_2.slice();

  heightBarsNow =
    heightComparison(
      ORIGINAL,
      QUERY_2
    );

  distanceGuides =
    ORIGINAL.means.map((m, i) =>
      centreConnector(
        m,
        QUERY_2,
        COLORS[i]
      )
    );

  await until(S(50));

  await play(
    new M.FadeIn(
      heightBarsNow
    ),

    reveal(
      distanceGuides,
      0.90,
      0.10
    ),

    ...tryBox(
      ORIGINAL,
      QUERY_2,
      'DRAG THE UNKNOWN FRUIT'
    ),

    ...say('TRY IT: DRAG THE UNKNOWN FRUIT', C.green)
  );

  // Preview another position without changing any known fruit.

  await play(
    ...moveQueryAnimations(
      ORIGINAL,
      [4, 3],
      '200 g, HUE 3'
    )
  );

  // 51. Place it at 175 grams, hue 3 to make plum win.

  await until(S(51));

  await play(
    ...moveQueryAnimations(
      ORIGINAL,
      QUERY_1,
      '175 g, HUE 3'
    ),

    ...say('TRY IT: 175 g, HUE 3', C.green)
  );

  await play(
    ...fbox([
      ['CHECK YOUR RESULT', C.green],
      ['plum score ≈ −1.56', PLUM],
      ['apple score ≈ −2.26', APPLE],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM)
  );

  // 52. Keep its weight unchanged and move up until apple wins.

  await until(S(52));

  await play(
    ...moveQueryAnimations(
      ORIGINAL,
      QUERY_2,
      '175 g, HUE 5'
    ),

    ...say('TRY IT: MOVE UP WITHOUT CHANGING WEIGHT', C.green)
  );

  await play(
    ...fbox([
      ['WEIGHT STILL = 175 g', C.ink],
      ['plum score ≈ −5.56', PLUM],
      ['apple score ≈ −3.26', APPLE],
      ['PREDICTION: APPLE', APPLE]
    ], APPLE)
  );

  // ============================================================
  // BEAT 53: EQUAL SPREADS AND NEW DATA
  // ============================================================

  // Make the two groups have the same spread.
  //
  // This explicitly requested Try it modification changes
  // the apple training positions around their original centre.
  //
  // Plum variance remains 0.5.
  // Apple variance becomes 0.5.
  //
  // Centres remain (2, 3) and (6, 3).
  // Priors remain 1/2 each.
  //
  // The quadratic terms cancel exactly.
  // The boundary becomes x = 4, or 200 grams.

  const EQUAL_DATA = DATA.map(d => {
    if (d.id === 'A1') {
      return {
        ...d,
        weight: 250
      };
    }

    if (d.id === 'A2') {
      return {
        ...d,
        weight: 350
      };
    }

    if (d.id === 'A3') {
      return {
        ...d,
        hue: 2
      };
    }

    if (d.id === 'A4') {
      return {
        ...d,
        hue: 4
      };
    }

    return {
      ...d
    };
  });

  const EQUAL_MODEL =
    fitQDA(EQUAL_DATA);

  // Fresh hypothetical fruit groups.
  // Four plums and four apples are retained.
  //
  // Plum centre moves to (3, 3).
  // Plum covariance remains 0.5 I.
  //
  // Apple centre remains (6, 3).
  // Apple covariance remains 2 I.
  //
  // The new curved boundary is recalculated, not guessed.

  const FRESH_DATA = [
    { id: 'P1', label: 'plum',  weight: 100, hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 200, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 150, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 150, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 }
  ];

  const FRESH_MODEL =
    fitQDA(FRESH_DATA);

  await until(S(53));

  await play(
    ...refitAnimations(
      EQUAL_MODEL,
      QUERY_2
    ),

    ...modelBox(
      EQUAL_MODEL,
      'EQUAL GROUP SPREADS'
    ),

    ...say('TRY IT: MAKE THE TWO SPREADS EQUAL', C.green)
  );

  await play(
    ...fbox([
      ['BOTH VARIANCES = 0.5', C.ink],
      ['quadratic terms cancel', GOLD],
      ['straight boundary = 200 g', GOLD]
    ], GOLD),

    new M.Indicate(
      boundaryNow,
      {
        color: GOLD
      }
    )
  );

  await until(S(53) + 3.5);

  await play(
    ...refitAnimations(
      FRESH_MODEL,
      QUERY_2
    ),

    ...modelBox(
      FRESH_MODEL,
      'NEW DATA: REFITTED QDA'
    ),

    ...say('TRY IT: PRESS NEW DATA', C.green)
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE THE EXACT ORIGINAL EXAMPLE
  // ============================================================

  // Restore the original eight fruits and their original
  // means, priors and separate covariance matrices.
  //
  // The two original 175-gram comparison positions
  // demonstrate why the curved boundary is useful.

  await until(S(54));

  await play(
    ...refitAnimations(
      ORIGINAL,
      QUERY_1
    ),

    ...fbox([
      ['QUADRATIC DISCRIMINANT ANALYSIS', C.cyan],
      ['learn each group’s centre', C.ink],
      ['learn each group’s prior', C.ink],
      ['learn each group’s own spread', GOLD]
    ]),

    ...say('QDA: EACH GROUP GETS ITS OWN SPREAD')
  );

  const recapFirstFruit =
    unknown(
      xy(...QUERY_1),
      FR * 1.05
    );

  const recapGuide =
    dashed(
      xy(...QUERY_1),
      xy(...QUERY_2),
      WHITE
    );

  await play(
    ...moveQueryAnimations(
      ORIGINAL,
      QUERY_2
    ),

    new M.FadeIn(
      recapFirstFruit
    ),

    new M.Create(
      recapGuide
    )
  );

  await play(
    ...fbox([
      ['SAME WEIGHT: 175 g', C.ink],
      ['hue 3: plum wins', PLUM],
      ['hue 5: apple wins', APPLE],
      ['a curved boundary can help', GOLD]
    ], GOLD),

    new M.Indicate(
      boundaryNow,
      {
        color: GOLD,
        runTime: 1.10
      }
    ),

    ...say('QDA ALLOWS CURVED DECISION BOUNDARIES', C.green)
  );
}
