// lesson 13.1.6
// Linear discriminant analysis: learning a straight decision boundary.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data and fitted population variances.
// All calculations use unrounded values internally.
// Try it beats preview the separate interactive activity.
// Preview datasets are chosen to retain equal class priors and vertical
// boundaries while demonstrating changes in centres and shared spread.
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
  const SHARED = C.cyan;

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

  // Phone frame: 8 x 14.22.
  // Content bounds: y = -5.5 to 4.3.
  //
  // Laptop frame: 14.22 x 8.
  // Content bounds: y = -3.0 to 2.3.
  //
  // Equal horizontal and vertical grid spacing is essential
  // for the circular spread and distance demonstrations.

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

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const QX = NEW_FRUIT.weight / 50;
  const QY = NEW_FRUIT.hue;

  const weightUnits = grams => grams / 50;

  const colorOf = label =>
    label === 'plum' ? PLUM : APPLE;

  const coordinates = d => [
    weightUnits(d.weight),
    d.hue
  ];

  const positionOf = d =>
    xy(...coordinates(d));

  const sum = values =>
    values.reduce((a, b) => a + b, 0);

  function fmt(n, places = 3) {
    const v = Number(n.toFixed(places));

    return v < 0
      ? '−' + String(Math.abs(v))
      : String(v);
  }

  function squaredDistance(a, b) {
    return (
      (a[0] - b[0]) ** 2 +
      (a[1] - b[1]) ** 2
    );
  }

  // ============================================================
  // LDA CALCULATIONS
  // ============================================================

  // Fitted covariance convention used in this lesson:
  //
  // Individual group:
  // divide within-group sums by the group size.
  //
  // Shared covariance:
  // divide pooled within-group sums by all eight fruits.
  //
  // This deliberately uses the fitted population convention,
  // rather than the sample covariance denominator n - 1.

  function groupStatistics(group) {
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

    return {
      n,
      group,
      mean: [meanX, meanY],
      deviations,

      ssX,
      ssY,
      ssXY,

      varianceX: ssX / n,
      varianceY: ssY / n,
      covariance: ssXY / n,

      maxRadius: Math.max(
        ...deviations.map(
          d => Math.sqrt(d.dx2 + d.dy2)
        )
      )
    };
  }

  function fitLDA(data) {
    const groups = NAMES.map(label =>
      groupStatistics(
        data.filter(d => d.label === label)
      )
    );

    const n = data.length;

    const priors = groups.map(
      g => g.n / n
    );

    const vx = sum(
      groups.map(g => g.ssX)
    ) / n;

    const vy = sum(
      groups.map(g => g.ssY)
    ) / n;

    const cov = sum(
      groups.map(g => g.ssXY)
    ) / n;

    const determinant =
      vx * vy - cov * cov;

    // The exact lesson dataset and both narrated preview
    // datasets have positive-definite shared covariance.
    // Do not silently regularise or alter the fitted values.

    if (determinant <= 1e-12) {
      throw new Error(
        'LDA requires a nonsingular shared covariance matrix.'
      );
    }

    const inverse = [
      [
        vy / determinant,
        -cov / determinant
      ],
      [
        -cov / determinant,
        vx / determinant
      ]
    ];

    const means = groups.map(
      g => g.mean
    );

    function multiplyInverse(v) {
      return [
        inverse[0][0] * v[0] +
        inverse[0][1] * v[1],

        inverse[1][0] * v[0] +
        inverse[1][1] * v[1]
      ];
    }

    function quadratic(v) {
      const iv = multiplyInverse(v);

      return (
        v[0] * iv[0] +
        v[1] * iv[1]
      );
    }

    function adjustedDistance(q, i) {
      return quadratic([
        q[0] - means[i][0],
        q[1] - means[i][1]
      ]);
    }

    function discriminant(q, i) {
      const m = means[i];
      const im = multiplyInverse(m);

      return (
        q[0] * im[0] +
        q[1] * im[1] -
        0.5 * quadratic(m) +
        Math.log(priors[i])
      );
    }

    // Boundary:
    //
    // scoreApple - scorePlum = 0
    //
    // normal[0] * x + normal[1] * y = offset

    const normal = multiplyInverse([
      means[1][0] - means[0][0],
      means[1][1] - means[0][1]
    ]);

    const offset =
      0.5 * (
        quadratic(means[1]) -
        quadratic(means[0])
      ) -
      Math.log(priors[1] / priors[0]);

    function predict(q) {
      const scores = [
        discriminant(q, 0),
        discriminant(q, 1)
      ];

      const difference =
        scores[1] - scores[0];

      const winner =
        Math.abs(difference) < 1e-10
          ? -1
          : difference > 0 ? 1 : 0;

      return {
        scores,
        winner,

        squared: means.map(
          m => squaredDistance(q, m)
        ),

        adjusted: [
          adjustedDistance(q, 0),
          adjustedDistance(q, 1)
        ]
      };
    }

    return {
      data,
      groups,
      priors,
      means,
      vx,
      vy,
      cov,
      inverse,
      normal,
      offset,
      predict
    };
  }

  const ORIGINAL = fitLDA(DATA);

  const PLUM_STATS = ORIGINAL.groups[0];
  const APPLE_STATS = ORIGINAL.groups[1];

  const PLUM_CENTRE = ORIGINAL.means[0];
  const APPLE_CENTRE = ORIGINAL.means[1];

  const ORIGINAL_RESULT = ORIGINAL.predict([
    QX,
    QY
  ]);

  const SHARED_VARIANCE = ORIGINAL.vx;

  const BOUNDARY_X =
    ORIGINAL.offset / ORIGINAL.normal[0];

  // Checked original results:
  //
  // Plum centre = (2, 3)
  // Apple centre = (6, 3)
  //
  // Plum:
  // horizontal squared deviations = [1, 1, 0, 0]
  // vertical squared deviations   = [0, 0, 1, 1]
  // variance in each direction    = 0.5
  // covariance                    = 0
  //
  // Apple:
  // horizontal squared deviations = [4, 4, 0, 0]
  // vertical squared deviations   = [0, 0, 4, 4]
  // variance in each direction    = 2
  // covariance                    = 0
  //
  // Shared variance = (2 + 8)/8 = 1.25
  //
  // Shared covariance matrix:
  //
  // [ 1.25   0    ]
  // [ 0      1.25 ]
  //
  // Equal priors = 1/2 each.
  //
  // Boundary = x = 4 = 200 grams.
  //
  // Unknown fruit = (3, 4)
  // Squared distances = 2 and 10
  // Adjusted distances = 1.6 and 8
  // Prediction = plum.

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

  function dashed(start, end, color = C.muted) {
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
      width: w,
      height: h,
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

  function tag(s, color, p, size = 17) {
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
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
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
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
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

    const left = BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

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

    const g = new M.VGroup(r, ...texts);

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

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function fruit(label, p, r = FR) {
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

  function unknown(p, r = FR * 1.20) {
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
  // INTRODUCTORY FRUIT SORTER
  // ============================================================

  function sorterIntro() {
    const y = P ? -1.10 : -0.50;

    const parts = [];

    const belt = rounded(
      5.60,
      0.44,
      [CX, y + 0.85, 0],
      C.muted,
      0.90
    );

    parts.push(belt);

    for (let i = 0; i < 11; i++) {
      const x = CX + (i - 5) * 0.47;

      const roller = new M.Circle({
        radius: 0.10,
        color: C.muted,
        strokeWidth: 1.5
      });

      roller.setFill(C.card, 1);
      roller.moveTo([x, y + 0.85, 0]);

      parts.push(roller);
    }

    parts.push(
      unknown(
        [CX, y + 1.18, 0],
        FR * 1.65
      )
    );

    parts.push(
      rounded(
        2.35,
        0.66,
        [CX, y, 0],
        C.cyan,
        0.95
      )
    );

    parts.push(
      text(
        'FRUIT SORTER',
        19,
        C.cyan,
        [CX, y, 0],
        true
      )
    );

    for (let i = 0; i < 2; i++) {
      const x = CX + (i === 0 ? -1.55 : 1.55);

      const color = COLORS[i];

      const basketY = y - 1.42;

      parts.push(
        line(
          [CX + (i === 0 ? -0.55 : 0.55), y - 0.34, 0],
          [x, basketY + 0.42, 0],
          color,
          2
        )
      );

      parts.push(
        rounded(
          2.18,
          0.82,
          [x, basketY, 0],
          color,
          0.85
        )
      );

      parts.push(
        text(
          NAMES[i].toUpperCase() + 'S',
          18,
          color,
          [x, basketY, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const introduction = sorterIntro();

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

    HUE.forEach((c, i) => {
      parts.push(
        rect(
          sw,
          U * 0.98,
          [sx, Y(i + 1), 0],
          c,
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

  const graph = graphParts();

  let points = plotPoints(DATA);

  function horizontalMeasure(
    x1,
    x2,
    y,
    label,
    color = C.cyan
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

      text(
        label,
        P ? 15 : 13,
        color,
        [(a + b) / 2, yy + 0.19, 0],
        true
      )
    );
  }

  function verticalMeasure(
    x,
    y1,
    y2,
    label,
    color = C.green
  ) {
    const xx = X(x);
    const a = Y(y1);
    const b = Y(y2);

    return new M.VGroup(
      line(
        [xx, a, 0],
        [xx, b, 0],
        color,
        2.4
      ),

      line(
        [xx - 0.06, a, 0],
        [xx + 0.06, a, 0],
        color,
        1.8
      ),

      line(
        [xx - 0.06, b, 0],
        [xx + 0.06, b, 0],
        color,
        1.8
      ),

      text(
        label,
        P ? 15 : 13,
        color,
        [xx + 0.20, (a + b) / 2, 0],
        true
      )
    );
  }

  // ============================================================
  // GROUP CENTRES AND SPREAD
  // ============================================================

  function centreCross(
    centre,
    color,
    scale = 1
  ) {
    const p = xy(...centre);

    const r = FR * 1.55 * scale;

    const halo = new M.Dot({
      point: p,
      radius: r * 1.60,
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

  function centreLabel(centre, i) {
    return tag(
      `${fmt(centre[0] * 50)} g, hue ${fmt(centre[1])}`,
      COLORS[i],
      [
        X(centre[0]),
        Y(Math.min(centre[1] + (i === 0 ? 2.2 : 3.3), 6.6)),
        0
      ],
      P ? 16 : 13
    );
  }

  function centreLocator(centre, i) {
    const p = xy(...centre);

    const c = ring(
      p,
      COLORS[i],
      FR * 1.45
    );

    const horizontal = dashed(
      xy(centre[0], 0),
      p,
      COLORS[i]
    );

    const vertical = dashed(
      xy(0, centre[1]),
      p,
      COLORS[i]
    );

    return new M.VGroup(
      horizontal,
      vertical,
      c
    );
  }

  let centres = ORIGINAL.means.map(
    (m, i) => centreCross(m, COLORS[i])
  );

  let centreLabels = ORIGINAL.means.map(
    (m, i) => centreLabel(m, i)
  );

  function spreadCircle(
    centre,
    radius,
    color,
    fill = 0.05
  ) {
    const c = new M.Circle({
      radius: Math.max(0.02, radius * U),
      color,
      strokeWidth: 2
    });

    c.setFill(color, fill);
    c.moveTo(xy(...centre));

    return c;
  }

  // The enclosing circles illustrate observed spread.
  // Their radii of 1 and 2 are not the fitted standard deviations.

  function observedCircles(model) {
    return model.groups.map((g, i) =>
      spreadCircle(
        g.mean,
        g.maxRadius,
        COLORS[i],
        0.045
      )
    );
  }

  // A covariance contour at one adjusted-distance unit:
  //
  // (z - mean)^T covariance^-1 (z - mean) = 1.
  //
  // For the original circular covariance, its radius is
  // sqrt(1.25), not 1.25.
  //
  // Use line segments to construct the ellipse, avoiding
  // additional geometry APIs outside the supplied reference.

  function ellipseContour(
    centre,
    vx,
    vy,
    covariance,
    color,
    stroke = 2.3
  ) {
    const angle =
      0.5 * Math.atan2(
        2 * covariance,
        vx - vy
      );

    const trace = vx + vy;

    const discriminant = Math.sqrt(
      (vx - vy) ** 2 +
      4 * covariance * covariance
    );

    const eigen1 =
      Math.max(
        0.000001,
        (trace + discriminant) / 2
      );

    const eigen2 =
      Math.max(
        0.000001,
        (trace - discriminant) / 2
      );

    const a = Math.sqrt(eigen1);
    const b = Math.sqrt(eigen2);

    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    const N = 48;

    const contour = [];

    function point(t) {
      const ex = a * Math.cos(t);
      const ey = b * Math.sin(t);

      return xy(
        centre[0] + ex * ca - ey * sa,
        centre[1] + ex * sa + ey * ca
      );
    }

    for (let i = 0; i < N; i++) {
      contour.push(
        line(
          point(2 * Math.PI * i / N),
          point(2 * Math.PI * (i + 1) / N),
          color,
          stroke
        )
      );
    }

    return new M.VGroup(...contour);
  }

  function sharedContours(model) {
    return model.means.map(m =>
      ellipseContour(
        m,
        model.vx,
        model.vy,
        model.cov,
        SHARED
      )
    );
  }

  let spreadNow = [];

  function spreadCaption(s, color = SHARED) {
    return tag(
      s,
      color,
      [
        CX,
        P ? -4.95 : Y(7.9),
        0
      ],
      P ? 16 : 13
    );
  }

  let spreadNote = null;

  // ============================================================
  // LEARNED DECISION BOUNDARY
  // ============================================================

  function boundaryEndpoints(model) {
    const [a, b] = model.normal;
    const c = model.offset;

    const candidates = [];

    function add(x, y) {
      if (
        x >= -1e-9 &&
        x <= XMAX + 1e-9 &&
        y >= -1e-9 &&
        y <= YMAX + 1e-9
      ) {
        const p = [
          Math.max(0, Math.min(XMAX, x)),
          Math.max(0, Math.min(YMAX, y))
        ];

        if (!candidates.some(q =>
          Math.abs(q[0] - p[0]) < 1e-8 &&
          Math.abs(q[1] - p[1]) < 1e-8
        )) {
          candidates.push(p);
        }
      }
    }

    if (Math.abs(a) > 1e-12) {
      add(c / a, 0);
      add((c - b * YMAX) / a, YMAX);
    }

    if (Math.abs(b) > 1e-12) {
      add(0, c / b);
      add(XMAX, (c - a * XMAX) / b);
    }

    if (candidates.length < 2) {
      throw new Error(
        'Decision boundary does not cross the plotting frame.'
      );
    }

    let best = [
      candidates[0],
      candidates[1]
    ];

    let longest = squaredDistance(
      best[0],
      best[1]
    );

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const length = squaredDistance(
          candidates[i],
          candidates[j]
        );

        if (length > longest) {
          longest = length;
          best = [
            candidates[i],
            candidates[j]
          ];
        }
      }
    }

    return best;
  }

  function boundaryShape(model) {
    const [a, b] =
      boundaryEndpoints(model);

    return line(
      xy(...a),
      xy(...b),
      GOLD,
      3.3
    );
  }

  function boundaryTag(model) {
    const [a, b] = model.normal;

    const vertical =
      Math.abs(b) < 1e-10;

    const x = vertical
      ? model.offset / a
      : (model.offset - b * YMAX) / a;

    const xx = Math.max(
      0.8,
      Math.min(XMAX - 0.8, x)
    );

    const label = vertical
      ? `${fmt(x * 50)} g`
      : 'LDA boundary';

    return tag(
      label,
      GOLD,
      [X(xx), YT + 0.24, 0],
      P ? 16 : 14
    );
  }

  // The narrated datasets deliberately retain vertical
  // boundaries. The two rectangular shaded regions are
  // therefore exact, rather than approximate pixel strips.

  function decisionRegions(model) {
    const [a, b] = model.normal;

    if (
      Math.abs(b) > 1e-10 ||
      Math.abs(a) < 1e-12
    ) {
      throw new Error(
        'This narrated region helper expects a vertical boundary.'
      );
    }

    const boundary = Math.max(
      0,
      Math.min(
        XMAX,
        model.offset / a
      )
    );

    const xx = X(boundary);

    const height = YT - YB;
    const cy = (YT + YB) / 2;

    const leftColor = a > 0
      ? PLUM : APPLE;

    const rightColor = a > 0
      ? APPLE : PLUM;

    return new M.VGroup(
      rect(
        Math.max(0.001, xx - XL),
        height,
        [(XL + xx) / 2, cy, 0],
        leftColor,
        0.12,
        0
      ),

      rect(
        Math.max(0.001, XR - xx),
        height,
        [(xx + XR) / 2, cy, 0],
        rightColor,
        0.11,
        0
      )
    );
  }

  function regionTags(model) {
    const boundary =
      model.offset / model.normal[0];

    return [
      tag(
        'PLUM',
        PLUM,
        [X(boundary / 2), Y(7.25), 0],
        P ? 16 : 14
      ),

      tag(
        'APPLE',
        APPLE,
        [
          X((boundary + XMAX) / 2),
          Y(7.25),
          0
        ],
        P ? 16 : 14
      )
    ];
  }

  let boundary = null;
  let boundaryLabel = null;
  let shading = null;
  let regionLabels = [];

  function boundaryObjects(model) {
    boundary = boundaryShape(model);
    boundaryLabel = boundaryTag(model);
    shading = decisionRegions(model);
    regionLabels = regionTags(model);
  }

  function removeBoundary() {
    const animations = remove([
      boundary,
      boundaryLabel,
      shading,
      ...regionLabels
    ]);

    boundary = null;
    boundaryLabel = null;
    shading = null;
    regionLabels = [];

    return animations;
  }

  // ============================================================
  // VARIANCE DEMONSTRATION
  // ============================================================

  // Each deviation is measured relative to its own group centre.
  // Horizontal deviation guides terminate on the centre's
  // vertical line. Vertical deviation guides terminate on the
  // centre's horizontal line.

  function deviationGuides(
    stats,
    axis,
    color
  ) {
    const [mx, my] = stats.mean;

    return stats.group.map(d => {
      const [x, y] = coordinates(d);

      const value = axis === 'x'
        ? Math.abs(x - mx)
        : Math.abs(y - my);

      const start = xy(x, y);

      const end = axis === 'x'
        ? xy(mx, y)
        : xy(x, my);

      if (value < 1e-12) {
        return ring(
          start,
          color,
          FR * 1.65
        );
      }

      return line(
        start,
        end,
        color,
        2.8
      );
    });
  }

  const TILE_SP = P ? 1.02 : 0.76;

  const TILE_Y = Y(7.65);

  function varianceTile(
    id,
    value,
    i,
    color,
    squared = false
  ) {
    const x =
      (XL + XR) / 2 +
      (i - 1.5) * TILE_SP;

    const w = TILE_SP * 0.88;

    const h = P ? 0.70 : 0.56;

    const body = rounded(
      w,
      h,
      [x, TILE_Y, 0],
      color,
      0.96
    );

    const name = text(
      id,
      P ? 16 : 12,
      color,
      [x, TILE_Y + h * 0.25, 0],
      true
    );

    const label = fittedText(
      squared
        ? `${fmt(value)}² = ${fmt(value * value)}`
        : fmt(value),
      P ? 18 : 14,
      C.ink,
      [x, TILE_Y - h * 0.18, 0],
      w - 0.10,
      true
    );

    return new M.VGroup(
      body,
      name,
      label
    );
  }

  function varianceTiles(
    stats,
    axis,
    color,
    squared = false
  ) {
    return stats.deviations.map((d, i) =>
      varianceTile(
        d.id,
        Math.abs(
          axis === 'x' ? d.dx : d.dy
        ),
        i,
        color,
        squared
      )
    );
  }

  let guidesNow = [];
  let tilesNow = [];

  function clearVarianceVisuals() {
    const animations = [
      ...remove(guidesNow),
      ...remove(tilesNow)
    ];

    guidesNow = [];
    tilesNow = [];

    return animations;
  }

  function showVarianceVisuals(
    stats,
    axis,
    color,
    squared = false
  ) {
    const old = clearVarianceVisuals();

    guidesNow = deviationGuides(
      stats,
      axis,
      color
    );

    tilesNow = varianceTiles(
      stats,
      axis,
      color,
      squared
    );

    return [
      ...old,
      reveal(guidesNow, 1.0, 0.12),
      reveal(tilesNow, 1.0, 0.12)
    ];
  }

  function squareTiles(
    stats,
    axis,
    color
  ) {
    const targets = varianceTiles(
      stats,
      axis,
      color,
      true
    );

    return tilesNow.map((t, i) =>
      new M.Transform(
        t,
        targets[i],
        { runTime: 0.85 }
      )
    );
  }

  function varianceResult(
    i,
    axis,
    value
  ) {
    const color = COLORS[i];

    const x = i === 0
      ? X(2)
      : X(6);

    return tag(
      `${axis} variance = ${fmt(value)}`,
      color,
      [x, Y(6.25), 0],
      P ? 14 : 12
    );
  }

  // ============================================================
  // COVARIANCE AND SHARED SPREAD MATRIX
  // ============================================================

  function covarianceAxes(model) {
    const parts = [];

    model.means.forEach((m, i) => {
      const color = COLORS[i];

      parts.push(
        dashed(
          xy(m[0] - 1.2, m[1]),
          xy(m[0] + 1.2, m[1]),
          color
        )
      );

      parts.push(
        dashed(
          xy(m[0], m[1] - 1.2),
          xy(m[0], m[1] + 1.2),
          color
        )
      );
    });

    return parts;
  }

  function covarianceTiles() {
    const parts = [];

    const values = [
      'dx × dy',
      '1 × 0',
      '0 × 1',
      '= 0'
    ];

    values.forEach((s, i) => {
      const x =
        (XL + XR) / 2 +
        (i - 1.5) * TILE_SP;

      const w = TILE_SP * 0.88;

      const body = rounded(
        w,
        P ? 0.58 : 0.48,
        [x, TILE_Y, 0],
        GOLD,
        0.96
      );

      const t = fittedText(
        s,
        P ? 16 : 14,
        GOLD,
        [x, TILE_Y, 0],
        w - 0.08,
        true
      );

      parts.push(
        new M.VGroup(body, t)
      );
    });

    return parts;
  }

  function matrixBox(model) {
    return fbox([
      ['SHARED COVARIANCE', SHARED],
      [
        `[ ${fmt(model.vx)}    ${fmt(model.cov)} ]`,
        C.ink
      ],
      [
        `[ ${fmt(model.cov)}    ${fmt(model.vy)} ]`,
        C.ink
      ],
      ['one matrix for both groups', SHARED]
    ], SHARED);
  }

  // ============================================================
  // UNKNOWN FRUIT DISTANCE DEMONSTRATIONS
  // ============================================================

  let query = null;

  function distanceTriangle(
    centre,
    q,
    color
  ) {
    const [mx, my] = centre;
    const [qx, qy] = q;

    const start = xy(mx, my);
    const corner = xy(qx, my);
    const end = xy(qx, qy);

    const dx = Math.abs(qx - mx);
    const dy = Math.abs(qy - my);

    const parts = [];

    if (dx > 1e-12) {
      parts.push(
        line(
          start,
          corner,
          C.cyan,
          2.7
        )
      );

      parts.push(
        text(
          fmt(dx),
          P ? 17 : 14,
          C.cyan,
          [
            (start[0] + corner[0]) / 2,
            start[1] - 0.22,
            0
          ],
          true
        )
      );
    }

    if (dy > 1e-12) {
      parts.push(
        line(
          corner,
          end,
          C.green,
          2.7
        )
      );

      parts.push(
        text(
          fmt(dy),
          P ? 17 : 14,
          C.green,
          [
            end[0] + (qx >= mx ? 0.22 : -0.22),
            (corner[1] + end[1]) / 2,
            0
          ],
          true
        )
      );
    }

    if (dx > 1e-12 && dy > 1e-12) {
      const cornerSize = U * 0.17;

      const sx = mx < qx ? -1 : 1;
      const sy = qy > my ? 1 : -1;

      parts.push(
        new M.VGroup(
          line(
            [
              corner[0] + sx * cornerSize,
              corner[1],
              0
            ],
            [
              corner[0] + sx * cornerSize,
              corner[1] + sy * cornerSize,
              0
            ],
            C.muted,
            1.3
          ),

          line(
            [
              corner[0] + sx * cornerSize,
              corner[1] + sy * cornerSize,
              0
            ],
            [
              corner[0],
              corner[1] + sy * cornerSize,
              0
            ],
            C.muted,
            1.3
          )
        )
      );
    }

    if (squaredDistance(centre, q) > 1e-12) {
      parts.push(
        dashed(
          start,
          end,
          color
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function centreConnector(
    centre,
    q,
    color
  ) {
    if (squaredDistance(centre, q) < 1e-12) {
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
      2.2
    );
  }

  function distanceConnectors(model, q) {
    return model.means.map((m, i) =>
      centreConnector(
        m,
        q,
        COLORS[i]
      )
    );
  }

  function predictionBox(
    model,
    q,
    title = 'ADJUSTED DISTANCES'
  ) {
    const r = model.predict(q);

    const color = r.winner < 0
      ? GOLD
      : COLORS[r.winner];

    return fbox([
      [title, C.cyan],
      [
        `plum  = ${fmt(r.adjusted[0], 3)}`,
        PLUM
      ],
      [
        `apple = ${fmt(r.adjusted[1], 3)}`,
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

  const DISTANCE_Y = Y(7.75);

  function distanceBars(result) {
    const max = Math.max(
      ...result.adjusted,
      1
    );

    const w = (XR - XL) * 0.62;

    const x0 =
      (XL + XR) / 2 - w / 2;

    const parts = [];

    result.adjusted.forEach((v, i) => {
      const y =
        DISTANCE_Y - i * (P ? 0.52 : 0.40);

      const color = COLORS[i];

      const width = w * v / max;

      const track = rect(
        w,
        P ? 0.15 : 0.12,
        [x0 + w / 2, y, 0],
        C.muted,
        0.12,
        1
      );

      const bar = rect(
        Math.max(0.001, width),
        P ? 0.15 : 0.12,
        [x0 + width / 2, y, 0],
        color,
        0.90,
        0
      );

      const name = text(
        NAMES[i],
        P ? 15 : 13,
        color,
        [x0 - 0.42, y, 0]
      );

      const value = text(
        fmt(v, 3),
        P ? 17 : 14,
        color,
        [x0 + w + 0.39, y, 0],
        true
      );

      parts.push(
        new M.VGroup(
          track,
          bar,
          name,
          value
        )
      );
    });

    return parts;
  }

  let queryGuides = [];
  let distanceBarsNow = [];

  // ============================================================
  // TRY IT PREVIEW HELPERS
  // ============================================================

  // These are deterministic narrated demonstrations.
  // The engine interface provided in the brief does not
  // expose the separate exercise's actual pointer handlers.
  //
  // The original DATA is never mutated.
  // All centre, covariance, boundary and prediction values
  // are recalculated from each preview dataset.

  let activeModel = ORIGINAL;

  function modelBox(
    model,
    title = 'REFITTED LDA'
  ) {
    const boundary =
      model.offset / model.normal[0];

    return fbox([
      [title, C.cyan],

      [
        `centres: ${fmt(model.means[0][0])}, ${fmt(model.means[1][0])}`,
        C.ink
      ],

      [
        `shared var: ${fmt(model.vx)}, ${fmt(model.vy)}`,
        SHARED
      ],

      [
        `boundary: ${fmt(boundary * 50)} g`,
        GOLD
      ]
    ], GOLD);
  }

  function refitAnimations(model) {
    const nextPoints = plotPoints(
      model.data
    );

    const nextCentres = model.means.map(
      (m, i) => centreCross(m, COLORS[i])
    );

    const nextLabels = model.means.map(
      (m, i) => centreLabel(m, i)
    );

    const nextContours =
      sharedContours(model);

    const animations = [];

    points.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextPoints[i],
          { runTime: 1.2 }
        )
      );
    });

    centres.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextCentres[i],
          { runTime: 1.2 }
        )
      );
    });

    centreLabels.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextLabels[i],
          { runTime: 1.2 }
        )
      );
    });

    spreadNow.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextContours[i],
          { runTime: 1.2 }
        )
      );
    });

    animations.push(
      new M.Transform(
        boundary,
        boundaryShape(model),
        { runTime: 1.2 }
      ),

      new M.Transform(
        boundaryLabel,
        boundaryTag(model),
        { runTime: 1.2 }
      ),

      new M.Transform(
        shading,
        decisionRegions(model),
        { runTime: 1.2 }
      )
    );

    const nextRegionLabels =
      regionTags(model);

    regionLabels.forEach((p, i) => {
      animations.push(
        new M.Transform(
          p,
          nextRegionLabels[i],
          { runTime: 1.2 }
        )
      );
    });

    activeModel = model;

    return animations;
  }

  function moveQueryAnimations(model, q) {
    const nextGuides =
      distanceConnectors(model, q);

    const animations = [
      ...remove(queryGuides),

      new M.Transform(
        query,
        unknown(xy(...q)),
        { runTime: 1.15 }
      ),

      reveal(
        nextGuides,
        0.90,
        0.10
      ),

      ...predictionBox(model, q)
    ];

    queryGuides = nextGuides;

    return animations;
  }

  // ============================================================
  // BEATS 0–4: LEARN A DIVIDING LINE FROM DATA
  // ============================================================

  // 0. Imagine the fruit sorter finding its own dividing line.

  await until(S(0));

  await play(
    new M.FadeIn(introduction),

    ...fbox([
      ['FRUIT SORTER', C.cyan],
      ['can it find its own', C.ink],
      ['dividing line?', GOLD]
    ], GOLD),

    ...say('LET THE MACHINE FIND ITS OWN LINE', GOLD)
  );

  // 1. Could we learn the line from known measurements?

  await until(S(1));

  await play(
    ...fbox([
      ['instead of choosing a line', C.ink],
      ['by hand, learn it from', C.ink],
      ['the known fruit measurements', C.cyan]
    ]),

    ...say('LEARN THE BOUNDARY FROM DATA')
  );

  // 2. Four plums and four apples on the familiar drawing.

  await until(S(2));

  await play(
    new M.FadeOut(introduction),

    ...clearBox(),

    reveal(graph, 0.9, 0.08),
    reveal(points, 1.45, 0.08),

    ...say('4 PLUMS AND 4 APPLES')
  );

  // 3. Weight increases horizontally and hue vertically.

  await until(S(3));

  await play(
    ...fbox([
      ['weight increases →', C.cyan],
      ['hue increases ↑', C.green]
    ]),

    ...say('WEIGHT →     HUE ↑')
  );

  // 4. One horizontal space = 50 grams.
  // One vertical space = one hue step.

  const weightUnit = horizontalMeasure(
    0,
    1,
    6.5,
    '50 g',
    C.cyan
  );

  const hueUnit = verticalMeasure(
    0.55,
    4.5,
    5.5,
    '1',
    C.green
  );

  await until(S(4));

  await play(
    new M.FadeIn(weightUnit),

    new M.FadeIn(hueUnit),

    ...fbox([
      ['horizontal space = 50 g', C.cyan],
      ['vertical space = 1 hue step', C.green],
      ['equal grid lengths', C.ink]
    ]),

    ...say('ONE SPACE: 50 g OR ONE HUE STEP')
  );

  // ============================================================
  // BEATS 5–10: FIND THE TWO GROUP CENTRES
  // ============================================================

  // 5. Look at the four purple plum circles.

  await until(S(5));

  await play(
    new M.FadeOut(weightUnit),
    new M.FadeOut(hueUnit),

    new M.LaggedStart(
      points.slice(0, 4).map(p =>
        new M.Indicate(
          p,
          { color: PLUM }
        )
      ),
      {
        lagRatio: 0.18,
        runTime: 1.65
      }
    ),

    ...say('LOOK AT THE FOUR PLUMS', PLUM)
  );

  // 6. Plums gather around 100 grams, hue 3.

  const plumLocator = centreLocator(
    PLUM_CENTRE,
    0
  );

  await until(S(6));

  await play(
    new M.FadeIn(plumLocator),

    ...fbox([
      ['PLUM CENTRE', PLUM],
      ['weight = 100 g', C.ink],
      ['hue = 3', C.ink],
      ['grid position = (2, 3)', GOLD]
    ], PLUM),

    ...say('PLUMS GATHER AROUND (100 g, 3)', PLUM)
  );

  // 7. Apples gather around 300 grams, hue 3.

  const appleLocator = centreLocator(
    APPLE_CENTRE,
    1
  );

  await until(S(7));

  await play(
    new M.FadeOut(plumLocator),

    new M.LaggedStart(
      points.slice(4).map(p =>
        new M.Indicate(
          p,
          { color: APPLE }
        )
      ),
      {
        lagRatio: 0.17,
        runTime: 1.55
      }
    ),

    new M.FadeIn(appleLocator),

    ...fbox([
      ['APPLE CENTRE', APPLE],
      ['weight = 300 g', C.ink],
      ['hue = 3', C.ink],
      ['grid position = (6, 3)', GOLD]
    ], APPLE),

    ...say('APPLES GATHER AROUND (300 g, 3)', APPLE)
  );

  // 8. Mark both centres with glowing crosses.

  await until(S(8));

  await play(
    new M.FadeOut(appleLocator),

    reveal(centres, 1.0, 0.20),

    reveal(centreLabels, 0.85, 0.15),

    ...say('MARK THE TWO CENTRES', GOLD)
  );

  // 9. Find the spots using mean weight and mean hue.

  await until(S(9));

  await play(
    ...fbox([
      ['PLUM MEANS', PLUM],
      ['(50 + 150 + 100 + 100)/4', C.ink],
      ['= 100 grams', PLUM],
      ['(3 + 3 + 2 + 4)/4 = 3', GOLD]
    ], PLUM),

    ...say('CENTRE = MEAN WEIGHT AND MEAN HUE')
  );

  await play(
    ...fbox([
      ['APPLE MEANS', APPLE],
      ['(200 + 400 + 300 + 300)/4', C.ink],
      ['= 300 grams', APPLE],
      ['(3 + 3 + 1 + 5)/4 = 3', GOLD]
    ], APPLE)
  );

  // 10. Each cross represents the centre of its group.

  await until(S(10));

  await play(
    new M.Indicate(
      centres[0],
      { color: PLUM }
    ),

    new M.Indicate(
      centres[1],
      { color: APPLE }
    ),

    ...fbox([
      ['GROUP CENTRES', C.cyan],
      ['plum:  (2, 3)', PLUM],
      ['apple: (6, 3)', APPLE]
    ]),

    ...say('EACH CROSS IS A GROUP CENTRE')
  );

  // ============================================================
  // BEATS 11–15: OBSERVED SPREAD
  // ============================================================

  // 11. Imagine a circle growing outward from each centre.

  spreadNow = ORIGINAL.means.map(
    (m, i) => spreadCircle(
      m,
      0.12,
      COLORS[i],
      0.045
    )
  );

  await until(S(11));

  await play(
    ...remove(centreLabels),

    reveal(spreadNow, 1.0, 0.10),

    ...fbox([
      ['grow a circle', C.ink],
      ['outwards from each centre', C.ink],
      ['until it reaches the fruits', GOLD]
    ], GOLD),

    ...say('HOW FAR DO THE FRUITS SPREAD?')
  );

  // 12. Plum circle reaches all four plums at radius 1.

  const plumRadius = horizontalMeasure(
    2,
    3,
    3,
    '1',
    PLUM
  );

  await until(S(12));

  await play(
    new M.Transform(
      spreadNow[0],
      spreadCircle(
        PLUM_CENTRE,
        PLUM_STATS.maxRadius,
        PLUM,
        0.045
      ),
      { runTime: 1.65 }
    ),

    new M.FadeIn(plumRadius),

    ...fbox([
      ['PLUM ENCLOSING CIRCLE', PLUM],
      ['radius = 1 grid space', C.ink],
      ['reaches all 4 plums', PLUM]
    ], PLUM),

    ...say('PLUMS: ONE GRID SPACE', PLUM)
  );

  // 13. Apple circle needs radius 2.

  const appleRadius = horizontalMeasure(
    6,
    8,
    3,
    '2',
    APPLE
  );

  await until(S(13));

  await play(
    new M.Transform(
      spreadNow[1],
      spreadCircle(
        APPLE_CENTRE,
        APPLE_STATS.maxRadius,
        APPLE,
        0.045
      ),
      { runTime: 1.8 }
    ),

    new M.FadeIn(appleRadius),

    ...fbox([
      ['APPLE ENCLOSING CIRCLE', APPLE],
      ['radius = 2 grid spaces', C.ink],
      ['reaches all 4 apples', APPLE]
    ], APPLE),

    ...say('APPLES: TWO GRID SPACES', APPLE)
  );

  // 14. Apples are more spread out.

  await until(S(14));

  await play(
    ...fbox([
      ['plum radius = 1', PLUM],
      ['apple radius = 2', APPLE],
      ['apples are more spread out', GOLD]
    ], GOLD),

    ...say('APPLES ARE MORE SPREAD OUT', GOLD)
  );

  // 15. The amount measurements differ from a centre is spread.

  await until(S(15));

  await play(
    ...fbox([
      ['SPREAD', C.cyan],
      ['how much measurements', C.ink],
      ['differ from their centre', C.ink]
    ]),

    ...say('SPREAD = HOW FAR FROM THE CENTRE')
  );

  // ============================================================
  // BEATS 16–21: THE LDA IDEA AND DECISION BOUNDARY
  // ============================================================

  // 16. Imagine both types sharing one overall spread pattern.
  //
  // Replace the observed enclosing circles with the exact
  // fitted shared-covariance contours.
  //
  // The derivation of these contours comes later.

  const equalContours =
    sharedContours(ORIGINAL);

  spreadNote = spreadCaption(
    'ONE SHARED SPREAD PATTERN',
    SHARED
  );

  await until(S(16));

  await play(
    new M.FadeOut(plumRadius),
    new M.FadeOut(appleRadius),

    ...remove(spreadNow),

    reveal(equalContours, 1.35, 0.12),

    new M.FadeIn(spreadNote),

    ...fbox([
      ['LDA ASSUMPTION', SHARED],
      ['use the same overall', C.ink],
      ['spread for both groups', SHARED]
    ]),

    ...say('ASSUME A SHARED PATTERN OF SPREAD')
  );

  spreadNow = equalContours;

  // 17. Equal priors and equal circular spread:
  // neither group wins at equal distances.

  const midpoint = [
    (
      PLUM_CENTRE[0] +
      APPLE_CENTRE[0]
    ) / 2,
    (
      PLUM_CENTRE[1] +
      APPLE_CENTRE[1]
    ) / 2
  ];

  const midpointDot = new M.Dot({
    point: xy(...midpoint),
    radius: FR * 0.75,
    color: GOLD
  });

  const equalDistanceMarks = [
    horizontalMeasure(
      2,
      4,
      3,
      '2',
      PLUM
    ),

    horizontalMeasure(
      4,
      6,
      3,
      '2',
      APPLE
    )
  ];

  await until(S(17));

  await play(
    new M.FadeIn(midpointDot),

    reveal(
      equalDistanceMarks,
      1.15,
      0.18
    ),

    ...fbox([
      ['equal priors: 1/2 each', C.ink],
      ['same circular spread', SHARED],
      ['equal distances', GOLD],
      ['neither group has an advantage', C.ink]
    ], GOLD),

    ...say('EQUAL DISTANCES: NEITHER GROUP WINS', GOLD)
  );

  // 18. Draw the line halfway between the centres.
  // The learned line is at x = 4, or 200 grams.

  boundaryObjects(ORIGINAL);

  await until(S(18));

  await play(
    new M.Create(
      boundary,
      { runTime: 1.5 }
    ),

    new M.FadeIn(boundaryLabel),

    new M.FadeOut(midpointDot),
    ...remove([spreadNote]),

    ...remove(equalDistanceMarks),

    ...fbox([
      ['centre weights: 100 g, 300 g', C.ink],
      ['halfway = (100 + 300)/2', C.ink],
      ['boundary = 200 grams', GOLD]
    ], GOLD),

    ...say('LEARNED BOUNDARY = 200 g', GOLD)
  );

  spreadNote = null;

  // 19. Left is nearer the plum centre.
  // Right is nearer the apple centre.

  await until(S(19));

  await play(
    new M.FadeIn(shading),

    reveal(
      regionLabels,
      1.1,
      0.20
    ),

    ...fbox([
      ['left: nearer plum centre', PLUM],
      ['right: nearer apple centre', APPLE],
      ['line: equal distances', GOLD]
    ]),

    ...say('LEFT → PLUM    RIGHT → APPLE')
  );

  // Notice:
  // The original apple A1 lies exactly on this learned line.
  // Equal prior probabilities and equal adjusted distances
  // give a tie there. LDA is not claimed to classify every
  // original training example correctly.

  // 20. The approach is linear discriminant analysis, LDA.

  await until(S(20));

  await play(
    new M.Indicate(
      boundary,
      { color: GOLD }
    ),

    ...fbox([
      ['LINEAR DISCRIMINANT', C.cyan],
      ['ANALYSIS', C.cyan],
      ['LDA', GOLD]
    ]),

    ...say('LINEAR DISCRIMINANT ANALYSIS')
  );

  // 21. Linear means straight.
  // Discriminant means distinguishing groups.

  await until(S(21));

  await play(
    ...fbox([
      ['linear = straight', GOLD],
      ['discriminant = distinguish', C.ink],
      ['one group from another', C.ink]
    ]),

    ...say('LDA: DISTINGUISH GROUPS WITH A LINE')
  );

  // ============================================================
  // BEATS 22–28: PLUM HORIZONTAL VARIANCE
  // ============================================================

  // 22. How does the machine calculate shared spread?

  await until(S(22));

  await play(
    ...removeBoundary(),

    ...remove(spreadNow),

    ...fbox([
      ['HOW DO WE MEASURE SPREAD?', GOLD],
      ['look at deviations', C.ink],
      ['from each group centre', C.ink]
    ], GOLD),

    ...say('HOW DO WE CALCULATE SHARED SPREAD?', GOLD)
  );

  spreadNow = [];
  spreadNote = null;

  // 23. Horizontal distances of the plums from their centre.

  guidesNow = deviationGuides(
    PLUM_STATS,
    'x',
    PLUM
  );

  await until(S(23));

  await play(
    reveal(guidesNow, 1.10, 0.12),

    ...fbox([
      ['PLUMS', PLUM],
      ['centre x = 2', C.ink],
      ['measure each horizontal', C.ink],
      ['distance from the centre', GOLD]
    ], PLUM),

    ...say('PLUM HORIZONTAL DEVIATIONS', PLUM)
  );

  // 24. Distances are 1, 1, 0, 0.

  tilesNow = varianceTiles(
    PLUM_STATS,
    'x',
    PLUM
  );

  await until(S(24));

  await play(
    reveal(
      tilesNow,
      1.25,
      0.18
    ),

    ...fbox([
      ['P1: |1 − 2| = 1', PLUM],
      ['P2: |3 − 2| = 1', PLUM],
      ['P3: |2 − 2| = 0', PLUM],
      ['P4: |2 − 2| = 0', PLUM]
    ], PLUM),

    ...say('DISTANCES: 1, 1, 0, 0', PLUM)
  );

  // 25. Square each distance.

  await until(S(25));

  await play(
    ...squareTiles(
      PLUM_STATS,
      'x',
      PLUM
    ),

    ...fbox([
      ['square each distance', C.ink],
      ['1², 1², 0², 0²', GOLD],
      ['= 1, 1, 0, 0', PLUM]
    ], PLUM),

    ...say('SQUARE EACH DISTANCE')
  );

  // 26. Add the squared distances.

  await until(S(26));

  await play(
    ...fbox([
      ['1 + 1 + 0 + 0', C.ink],
      [`= ${fmt(PLUM_STATS.ssX)}`, GOLD],
      ['sum of squared deviations', C.muted]
    ], PLUM),

    ...say('SUM OF SQUARES = 2', GOLD)
  );

  // 27. Divide by the four plums.

  let varianceNotes = [
    varianceResult(
      0,
      'x',
      PLUM_STATS.varianceX
    )
  ];

  await until(S(27));

  await play(
    new M.FadeIn(varianceNotes[0]),

    ...fbox([
      ['sum of squares = 2', C.ink],
      ['number of plums = 4', C.ink],
      ['2 ÷ 4 = 0.5', PLUM]
    ], PLUM),

    ...say('2 ÷ 4 = 0.5', PLUM)
  );

  // 28. This fitted spread measurement is variance.

  await until(S(28));

  await play(
    ...fbox([
      ['VARIANCE', C.cyan],
      ['mean squared deviation', C.ink],
      ['from the group centre', C.ink],
      ['plum horizontal = 0.5', PLUM]
    ], PLUM),

    ...say('VARIANCE = MEAN SQUARED DEVIATION')
  );

  // ============================================================
  // BEATS 29–32: VERTICAL AND APPLE VARIANCES
  // ============================================================

  // 29. Plum vertical variance is also 0.5.
  // Vertical squared deviations = [0, 0, 1, 1].

  const plumYNote = varianceResult(
    0,
    'y',
    PLUM_STATS.varianceY
  );

  await until(S(29));

  await play(
    ...remove(varianceNotes),

    ...showVarianceVisuals(
      PLUM_STATS,
      'y',
      PLUM,
      true
    ),

    new M.FadeIn(plumYNote),

    ...fbox([
      ['PLUM: VERTICAL VARIANCE', PLUM],
      ['0² + 0² + 1² + 1² = 2', C.ink],
      ['2 ÷ 4 = 0.5', PLUM]
    ], PLUM),

    ...say('PLUM VERTICAL VARIANCE = 0.5', PLUM)
  );

  varianceNotes = [plumYNote];

  // 30. Apple horizontal distances are 2, 2, 0, 0.

  await until(S(30));

  await play(
    ...remove(varianceNotes),

    ...showVarianceVisuals(
      APPLE_STATS,
      'x',
      APPLE
    ),

    ...fbox([
      ['APPLE: CENTRE x = 6', APPLE],
      ['|4 − 6| = 2', C.ink],
      ['|8 − 6| = 2', C.ink],
      ['remaining distances = 0, 0', C.ink]
    ], APPLE),

    ...say('APPLE DISTANCES: 2, 2, 0, 0', APPLE)
  );

  varianceNotes = [];

  // 31. Square and add to get 8.
  // Divide by four to obtain variance 2.

  const appleXNote = varianceResult(
    1,
    'x',
    APPLE_STATS.varianceX
  );

  await until(S(31));

  await play(
    ...squareTiles(
      APPLE_STATS,
      'x',
      APPLE
    ),

    ...fbox([
      ['2² + 2² + 0² + 0²', C.ink],
      ['= 4 + 4 + 0 + 0', C.ink],
      ['= 8', GOLD]
    ], APPLE),

    ...say('APPLE SUM OF SQUARES = 8', APPLE)
  );

  await play(
    new M.FadeIn(appleXNote),

    ...fbox([
      ['sum of squares = 8', C.ink],
      ['number of apples = 4', C.ink],
      ['8 ÷ 4 = 2', APPLE]
    ], APPLE),

    ...say('APPLE HORIZONTAL VARIANCE = 2', APPLE)
  );

  varianceNotes = [appleXNote];

  // 32. Apple vertical variance is also two.

  const appleYNote = varianceResult(
    1,
    'y',
    APPLE_STATS.varianceY
  );

  await until(S(32));

  await play(
    ...remove(varianceNotes),

    ...showVarianceVisuals(
      APPLE_STATS,
      'y',
      APPLE,
      true
    ),

    new M.FadeIn(appleYNote),

    ...fbox([
      ['APPLE: VERTICAL VARIANCE', APPLE],
      ['0² + 0² + 2² + 2² = 8', C.ink],
      ['8 ÷ 4 = 2', APPLE]
    ], APPLE),

    ...say('APPLE VERTICAL VARIANCE = 2', APPLE)
  );

  varianceNotes = [appleYNote];

  // ============================================================
  // BEATS 33–35: POOL THE WITHIN-GROUP VARIANCES
  // ============================================================

  function pooledCard(
    i,
    axis,
    stats
  ) {
    const color = COLORS[i];

    const x = X(i === 0 ? 2 : 6);
    const y = Y(7.3);

    const w = P ? 2.05 : 1.48;
    const h = P ? 0.88 : 0.68;

    const ss = axis === 'x'
      ? stats.ssX
      : stats.ssY;

    const body = rounded(
      w,
      h,
      [x, y, 0],
      color,
      0.96
    );

    const name = fittedText(
      NAMES[i].toUpperCase(),
      P ? 16 : 14,
      color,
      [x, y + h * 0.25, 0],
      w - 0.16,
      true
    );

    const detail = fittedText(
      `sum = ${fmt(ss)}`,
      P ? 21 : 17,
      color,
      [x, y - h * 0.17, 0],
      w - 0.16,
      true
    );

    return new M.VGroup(
      body,
      name,
      detail
    );
  }

  let pooledCards = [
    pooledCard(
      0,
      'x',
      PLUM_STATS
    ),

    pooledCard(
      1,
      'x',
      APPLE_STATS
    )
  ];

  const pooledPlus = text(
    '+',
    P ? 25 : 21,
    GOLD,
    [X(4), Y(7.3), 0],
    true
  );

  // 33. Combine the squared deviations from both groups.
  // Do not calculate deviations from a single grand centre.

  await until(S(33));

  await play(
    ...clearVarianceVisuals(),

    ...remove(varianceNotes),

    reveal(
      pooledCards,
      1.0,
      0.15
    ),

    new M.FadeIn(pooledPlus),

    ...fbox([
      ['POOL WITHIN-GROUP SQUARES', SHARED],
      ['plum horizontal sum = 2', PLUM],
      ['apple horizontal sum = 8', APPLE],
      ['combine the two sums', GOLD]
    ], SHARED),

    ...say('COMBINE THE WITHIN-GROUP SQUARES')
  );

  varianceNotes = [];

  // 34. Two plus eight gives ten.
  // Divide by all eight fruits to obtain 1.25.

  await until(S(34));

  await play(
    ...fbox([
      ['shared horizontal variance', SHARED],
      ['= (2 + 8)/(4 + 4)', C.ink],
      ['= 10 ÷ 8', C.ink],
      ['= 1.25', SHARED]
    ], SHARED),

    ...say('SHARED HORIZONTAL VARIANCE = 1.25')
  );

  // 35. Repeat vertically: the shared variance is 1.25.

  await until(S(35));

  await play(
    ...pooledCards.map((card, i) =>
      new M.Transform(
        card,
        pooledCard(
          i,
          'y',
          ORIGINAL.groups[i]
        ),
        { runTime: 0.8 }
      )
    ),

    ...fbox([
      ['shared vertical variance', SHARED],
      ['= (2 + 8)/8', C.ink],
      ['= 10 ÷ 8', C.ink],
      ['= 1.25', SHARED]
    ], SHARED),

    ...say('SHARED VERTICAL VARIANCE = 1.25')
  );

  // ============================================================
  // BEATS 36–38: COVARIANCE AND THE SHARED MATRIX
  // ============================================================

  const covGuides =
    covarianceAxes(ORIGINAL);

  // 36. Do weight and hue tend to move together?

  await until(S(36));

  await play(
    ...remove(pooledCards),
    new M.FadeOut(pooledPlus),

    reveal(
      covGuides,
      1.1,
      0.10
    ),

    ...fbox([
      ['ONE MORE QUESTION', GOLD],
      ['when weight differs', C.cyan],
      ['does hue also tend to differ?', C.green]
    ], GOLD),

    ...say('DO WEIGHT AND HUE MOVE TOGETHER?', GOLD)
  );

  // 37. Covariance is zero.
  // Each known fruit differs along just one direction.

  const covTiles = covarianceTiles();

  await until(S(37));

  await play(
    reveal(
      covTiles,
      1.2,
      0.15
    ),

    ...fbox([
      ['COVARIANCE', C.cyan],
      ['mean of dx × dy', C.ink],
      ['every fruit has dx = 0 or dy = 0', C.ink],
      ['all products = 0', GOLD]
    ], GOLD),

    ...say('COVARIANCE = 0', GOLD)
  );

  await play(
    ...fbox([
      ['plum covariance = 0', PLUM],
      ['apple covariance = 0', APPLE],
      ['shared covariance = 0', SHARED],
      ['no diagonal preference', C.ink]
    ], SHARED)
  );

  // 38. Equal fitted variance in both directions.
  // The shared covariance is circular.

  spreadNow = sharedContours(
    ORIGINAL
  );

  spreadNote = spreadCaption(
    'SHARED CIRCULAR SPREAD',
    SHARED
  );

  await until(S(38));

  await play(
    ...remove(covGuides),
    ...remove(covTiles),

    reveal(
      spreadNow,
      1.25,
      0.15
    ),

    new M.FadeIn(spreadNote),

    ...matrixBox(ORIGINAL),

    ...say('EQUAL SPREAD IN BOTH DIRECTIONS')
  );

  // ============================================================
  // BEATS 39–43: DISTANCES OF THE UNKNOWN FRUIT
  // ============================================================

  // 39. Unknown fruit: 150 grams and hue 4.

  query = unknown(
    xy(QX, QY)
  );

  await until(S(39));

  await play(
    new M.FadeOut(spreadNote),

    new M.FadeIn(query),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['weight = 150 g', C.cyan],
      ['hue = 4', C.green],
      ['grid position = (3, 4)', GOLD]
    ]),

    ...say('NEW FRUIT: 150 g, HUE 4', WHITE)
  );

  spreadNote = null;

  // 40. One grid space right and one above the plum centre.

  let triangleNow = distanceTriangle(
    PLUM_CENTRE,
    [QX, QY],
    PLUM
  );

  await until(S(40));

  await play(
    new M.FadeIn(triangleNow),

    ...fbox([
      ['FROM PLUM CENTRE (2, 3)', PLUM],
      ['horizontal difference = 1', C.cyan],
      ['vertical difference = 1', C.green]
    ], PLUM),

    ...say('PLUM: ONE RIGHT, ONE UP', PLUM)
  );

  // 41. Squared distance is 1 + 1 = 2.

  await until(S(41));

  await play(
    ...fbox([
      ['PLUM SQUARED DISTANCE', PLUM],
      ['1² + 1²', C.ink],
      ['= 1 + 1', C.ink],
      [`= ${fmt(ORIGINAL_RESULT.squared[0])}`, PLUM]
    ], PLUM),

    ...say('PLUM SQUARED DISTANCE = 2', PLUM)
  );

  // 42. Three spaces left and one above the apple centre.

  const appleTriangle = distanceTriangle(
    APPLE_CENTRE,
    [QX, QY],
    APPLE
  );

  await until(S(42));

  await play(
    new M.FadeOut(triangleNow),

    new M.FadeIn(appleTriangle),

    ...fbox([
      ['FROM APPLE CENTRE (6, 3)', APPLE],
      ['horizontal difference = −3', C.cyan],
      ['vertical difference = 1', C.green]
    ], APPLE),

    ...say('APPLE: THREE LEFT, ONE UP', APPLE)
  );

  triangleNow = appleTriangle;

  // 43. Squared distance is 9 + 1 = 10.

  await until(S(43));

  await play(
    ...fbox([
      ['APPLE SQUARED DISTANCE', APPLE],
      ['(−3)² + 1²', C.ink],
      ['= 9 + 1', C.ink],
      [`= ${fmt(ORIGINAL_RESULT.squared[1])}`, APPLE]
    ], APPLE),

    ...say('APPLE SQUARED DISTANCE = 10', APPLE)
  );

  // ============================================================
  // BEATS 44–46: ADJUST DISTANCES AND PREDICT
  // ============================================================

  // 44. Divide both squared distances by shared variance 1.25.

  queryGuides = distanceConnectors(
    ORIGINAL,
    [QX, QY]
  );

  distanceBarsNow = distanceBars(
    ORIGINAL_RESULT
  );

  await until(S(44));

  await play(
    new M.FadeOut(triangleNow),

    reveal(
      queryGuides,
      0.95,
      0.12
    ),

    reveal(
      distanceBarsNow,
      1.1,
      0.18
    ),

    ...fbox([
      ['DIVIDE BY SHARED VARIANCE', SHARED],
      ['shared variance = 1.25', C.ink],
      ['plum:  2/1.25 = 1.6', PLUM],
      ['apple: 10/1.25 = 8', APPLE]
    ], SHARED),

    ...say('ADJUSTED DISTANCES: 1.6 AND 8')
  );

  // 45. Plum has the smaller adjusted distance.
  // With equal priors, it receives the predicted label.

  await until(S(45));

  await play(
    new M.Indicate(
      distanceBarsNow[0],
      { color: PLUM }
    ),

    new M.Indicate(
      centres[0],
      { color: PLUM }
    ),

    ...fbox([
      ['plum adjusted distance = 1.6', PLUM],
      ['apple adjusted distance = 8', APPLE],
      ['smaller distance wins', C.ink],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('PREDICTION: PLUM', PLUM)
  );

  // 46. For equal circular spreads:
  // adjusted distance = squared distance / shared variance.

  await until(S(46));

  await play(
    ...fbox([
      ['FOR OUR CIRCULAR SPREADS', SHARED],
      ['adjusted distance', C.ink],
      ['= squared distance', GOLD],
      ['  ÷ shared variance', SHARED]
    ], SHARED),

    ...say('ADJUSTED DISTANCE = DISTANCE² ÷ VARIANCE')
  );

  await play(
    ...fbox([
      ['adjusted distance', C.ink],
      ['= (dx² + dy²) / 1.25', GOLD],
      ['same denominator for both', SHARED],
      ['compare the adjusted results', C.ink]
    ], SHARED)
  );

  // ============================================================
  // BEAT 47: OTHER SHARED SPREAD SHAPES
  // ============================================================

  // 47. LDA also uses covariance when spread has other shapes.
  //
  // The following tilted ellipse is a hypothetical conceptual
  // illustration, not a refit of the original fruit dataset.

  const exampleCentre = [4.25, 6.65];

  const tiltedContour = ellipseContour(
    exampleCentre,
    1.65,
    0.85,
    0.85,
    GOLD,
    2.4
  );

  const tiltedLabel = text(
    'Illustration: correlated spread',
    P ? 15 : 13,
    GOLD,
    [
      X(exampleCentre[0]),
      Y(8.15),
      0
    ]
  );

  const exampleLongAxis = dashed(
    xy(3.30, 6.05),
    xy(5.20, 7.25),
    GOLD
  );

  await until(S(47));

  await play(
    ...remove(distanceBarsNow),

    ...remove(queryGuides),

    new M.FadeIn(tiltedContour),
    new M.FadeIn(tiltedLabel),
    new M.Create(exampleLongAxis),

    ...fbox([
      ['OTHER SPREAD SHAPES', GOLD],
      ['covariance can tilt the spread', C.ink],
      ['LDA uses the shared matrix', SHARED],
      ['to adjust distances', C.ink]
    ], GOLD),

    ...say('COVARIANCE CAN CHANGE THE DISTANCE MEASURE', GOLD)
  );

  distanceBarsNow = [];
  queryGuides = [];

  // ============================================================
  // BEATS 48–49: USEFULNESS AND LIMITATION
  // ============================================================

  // 48. LDA learns a straight boundary using group centres
  // and their shared spread.

  boundaryObjects(ORIGINAL);

  centreLabels = ORIGINAL.means.map(
    (m, i) => centreLabel(m, i)
  );

  await until(S(48));

  await play(
    new M.FadeOut(tiltedContour),
    new M.FadeOut(tiltedLabel),
    new M.FadeOut(exampleLongAxis),

    new M.FadeIn(shading),

    new M.Create(
      boundary,
      { runTime: 1.2 }
    ),

    new M.FadeIn(boundaryLabel),

    reveal(
      regionLabels,
      1.0,
      0.12
    ),

    reveal(
      centreLabels,
      0.9,
      0.10
    ),

    ...fbox([
      ['LDA LEARNS FROM DATA', C.cyan],
      ['group centres', C.ink],
      ['starting probabilities', C.ink],
      ['one shared spread matrix', SHARED]
    ]),

    ...say('LEARN A STRAIGHT DECISION BOUNDARY')
  );

  // 49. A shared pattern can hide real differences in spread.

  const actualSpread = observedCircles(
    ORIGINAL
  );

  await until(S(49));

  await play(
    ...remove(spreadNow),

    reveal(
      actualSpread,
      1.25,
      0.15
    ),

    ...fbox([
      ['IMPORTANT LIMITATION', GOLD],
      ['plum variance = 0.5', PLUM],
      ['apple variance = 2', APPLE],
      ['shared variance hides differences', GOLD]
    ], GOLD),

    ...say('ONE SHARED SPREAD CAN HIDE DIFFERENCES', GOLD)
  );

  spreadNow = actualSpread;

  // ============================================================
  // BEATS 50–53: TRY IT PREVIEW
  // ============================================================

  // 50. Drag known fruits and watch their centres,
  // shared spread and boundary update together.
  //
  // Hypothetical exercise change:
  // move P1 from 50 grams to 75 grams.
  //
  // This preserves the hue means and zero covariance,
  // while changing the fitted plum centre and x variance.
  //
  // The original DATA remains unchanged.

  const DRAGGED = DATA.map(d =>
    d.id === 'P1'
      ? { ...d, weight: 75 }
      : { ...d }
  );

  const DRAGGED_MODEL =
    fitLDA(DRAGGED);

  const tryContours =
    sharedContours(ORIGINAL);

  await until(S(50));

  await play(
    ...remove(spreadNow),

    reveal(
      tryContours,
      0.85,
      0.10
    ),

    ...modelBox(
      ORIGINAL,
      'ORIGINAL FIT'
    ),

    ...say('TRY IT: DRAG THE KNOWN FRUITS', C.green)
  );

  spreadNow = tryContours;

  await play(
    ...refitAnimations(
      DRAGGED_MODEL
    ),

    ...modelBox(
      DRAGGED_MODEL,
      'REFIT AFTER MOVING P1'
    )
  );

  await play(
    ...refitAnimations(
      ORIGINAL
    ),

    ...modelBox(
      ORIGINAL,
      'RESET: ORIGINAL DATA'
    )
  );

  // 51. Place the unknown fruit at 150 grams, hue 4,
  // and check its predicted label.
  //
  // The exact original fitted model is restored before
  // checking the original lesson query.

  const startingGuides =
    distanceConnectors(
      ORIGINAL,
      [QX, QY]
    );

  await until(S(51));

  await play(
    new M.Transform(
      query,
      unknown(xy(QX, QY)),
      { runTime: 0.95 }
    ),

    reveal(
      startingGuides,
      1.0,
      0.12
    ),

    ...predictionBox(
      ORIGINAL,
      [QX, QY],
      '150 g, HUE 4'
    ),

    ...say('TRY IT: CHECK THE ORIGINAL FRUIT', C.green)
  );

  queryGuides = startingGuides;

  await play(
    new M.Indicate(
      centres[0],
      { color: PLUM }
    ),

    ...fbox([
      ['unknown: (3, 4)', WHITE],
      ['plum  = 1.6', PLUM],
      ['apple = 8', APPLE],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM)
  );

  // 52. Move the fruit until both adjusted distances are equal.
  //
  // At (4, 4):
  //
  // Plum squared distance = 2² + 1² = 5.
  // Apple squared distance = (−2)² + 1² = 5.
  //
  // Both adjusted distances = 5/1.25 = 4.

  const TIE_QUERY = [
    BOUNDARY_X,
    QY
  ];

  const tieResult = ORIGINAL.predict(
    TIE_QUERY
  );

  const tieRing = ring(
    xy(...TIE_QUERY),
    GOLD,
    FR * 2.15
  );

  await until(S(52));

  await play(
    ...moveQueryAnimations(
      ORIGINAL,
      TIE_QUERY
    ),

    new M.FadeIn(tieRing),

    ...say('TRY IT: MAKE BOTH DISTANCES EQUAL', C.green)
  );

  await play(
    ...fbox([
      ['ON THE LEARNED BOUNDARY', GOLD],
      [`plum  = ${fmt(tieResult.adjusted[0])}`, PLUM],
      [`apple = ${fmt(tieResult.adjusted[1])}`, APPLE],
      ['equal scores: tie', GOLD]
    ], GOLD)
  );

  // 53. New data: fresh fruit groups.
  //
  // This hypothetical dataset preserves four fruits per class.
  // Both hue means remain 3, with zero covariance.
  //
  // Plum centre:
  // x = 2.5, y = 3.
  //
  // Apple centre:
  // x = 5, y = 3.
  //
  // Shared x variance = 1.25.
  // Shared y variance = 0.8125.
  //
  // Learned boundary = 3.75 grid units = 187.5 grams.
  //
  // The fitted contours now have unequal horizontal and
  // vertical radii, while the boundary remains straight.

  const FRESH = [
    { id: 'P1', label: 'plum',  weight: 75,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 175, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 125, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 125, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 150, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 350, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 250, hue: 1.5, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 250, hue: 4.5, firmness: 2 }
  ];

  const FRESH_MODEL = fitLDA(
    FRESH
  );

  await until(S(53));

  await play(
    new M.FadeOut(tieRing),

    ...remove(queryGuides),

    ...refitAnimations(
      FRESH_MODEL
    ),

    ...modelBox(
      FRESH_MODEL,
      'NEW DATA: REFITTED MODEL'
    ),

    ...say('TRY IT: PRESS NEW DATA', C.green)
  );

  queryGuides = [];

  await play(
    ...moveQueryAnimations(
      FRESH_MODEL,
      [QX, QY]
    )
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE THE EXACT ORIGINAL LESSON
  // ============================================================

  // Restore the original eight fruits, exact group centres,
  // equal priors, shared covariance and 200-gram boundary.
  //
  // Restore the unknown fruit to (3, 4).
  // Its predicted label is plum.

  const recapGuides =
    distanceConnectors(
      ORIGINAL,
      [QX, QY]
    );

  await until(S(54));

  await play(
    ...remove(queryGuides),

    ...refitAnimations(
      ORIGINAL
    ),

    new M.Transform(
      query,
      unknown(xy(QX, QY)),
      { runTime: 1.1 }
    ),

    reveal(
      recapGuides,
      1.0,
      0.12
    ),

    ...fbox([
      ['LINEAR DISCRIMINANT ANALYSIS', C.cyan],
      ['1. learn group centres', C.ink],
      ['2. estimate starting probabilities', C.ink],
      ['3. fit one shared spread', SHARED]
    ]),

    ...say('LDA: LEARN FROM KNOWN FRUIT GROUPS')
  );

  queryGuides = recapGuides;

  await play(
    new M.Indicate(
      boundary,
      {
        color: GOLD,
        runTime: 1.15
      }
    ),

    ...fbox([
      ['shared variance = 1.25', SHARED],
      ['equal priors = 1/2 each', C.ink],
      ['learned boundary = 200 g', GOLD],
      ['PREDICTION: PLUM', PLUM]
    ], GOLD),

    ...say('CENTRES + PRIORS + SHARED SPREAD')
  );

  await play(
    new M.Indicate(
      centres[0],
      {
        color: PLUM,
        runTime: 0.85
      }
    ),

    new M.Indicate(
      centres[1],
      {
        color: APPLE,
        runTime: 0.85
      }
    ),

    ...say('LDA LEARNS A STRAIGHT DECISION BOUNDARY', C.green)
  );
}
