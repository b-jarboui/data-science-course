// lesson 9.2.8
// Curvature and convexity — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: apartment rent and squared-miss loss.
//
// Browser rendering and playback have not been tested against
// the actual engine. Try it is presented as an animated preview.
//
// Mathematical clarification:
// The chapter's quadratic is strictly convex and has one unique
// minimum. General convex functions can have multiple equally
// low minimum points. Convexity guarantees that a local minimum
// is also global, not necessarily that the minimum is unique.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const STEPS = [-1, 0, 1];
  const RENTS = [9, 11, 13];
  const AREAS = [40, 50, 60];

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';
  const GREEN = C.green || '#4ADE80';
  const VIOLET = C.violet || '#A78BFA';

  const COLORS = [
    C.cyan,
    C.ink,
    PINK
  ];

  const MIDDLE = 10;
  const START = [0, 10];
  const MINIMUM = [2, 11];

  // The familiar one-input loss function.
  // Middle rent is held at 10.

  const loss = s =>
    3 + 2 * (s - 2) ** 2;

  const derivative = s =>
    4 * (s - 2);

  const curvature = s => 4;

  // Full two-input loss function.

  const fullLoss = (s, m) =>
    2 * (s - 2) ** 2 +
    3 * (m - 11) ** 2;

  const gradient = (s, m) => [
    4 * (s - 2),
    6 * (m - 11)
  ];

  const prediction = (s, m) =>
    STEPS.map(x => m + s * x);

  const misses = (s, m) =>
    prediction(s, m).map(
      (v, k) => v - RENTS[k]
    );

  const squaredMisses = (s, m) =>
    misses(s, m).map(v => v * v);

  const SAMPLE_PRICES = [
    0, 1, 2, 3, 4
  ];

  const SAMPLE_LOSSES =
    SAMPLE_PRICES.map(loss);

  const SAMPLE_SLOPES =
    SAMPLE_PRICES.map(derivative);

  // Checked facts:
  //
  // Step price:  0,  1,  2,  3,  4
  // Loss:       11,  5,  3,  5, 11
  // Derivative: −8, −4,  0, +4, +8
  //
  // Change in derivative per unit of step price = +4.
  // Second derivative = 4 everywhere.
  //
  // Full loss:
  // Curvature along step price = 4.
  // Curvature along middle rent = 6.
  //
  // Unique minimum of the one-input curve:
  // step price = 2, loss = 3.
  //
  // Unique minimum of the full two-input loss:
  // step price = 2, middle rent = 11, loss = 0.

  const fmt = (n, places = 4) =>
    String(Number(n.toFixed(places)))
      .replace('-', '−');

  const signed = (n, places = 4) =>
    n > 0
      ? `+${fmt(n, places)}`
      : fmt(n, places);

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  // Phone: 8 × 14.22.
  // Keep content between y = −5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Keep content between y = −3.0 and 2.3.

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.60, 0]
    : [4.1, -0.3, 0];

  const BOX_MAX = P
    ? FW - 1.2
    : 5.6;

  const GX0 = CX - 2.65;
  const GX1 = CX + 2.65;

  const GY0 = P ? -4.0 : -2.10;
  const GY1 = P ? 1.20 : 1.05;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // DRAWING HELPERS
  // ------------------------------------------------------------

  function txt(
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

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(p);

    return t;
  }

  function line(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(
    w,
    h,
    p,
    color,
    opacity = 0,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
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
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function dot(
    p,
    color = C.cyan,
    radius = 0.10
  ) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function glowDot(
    p,
    color = C.cyan,
    radius = 0.105
  ) {
    const outer = dot(
      p,
      color,
      radius * 2.65
    );

    outer.setFill(color, 0.10);

    const inner = dot(
      p,
      color,
      radius * 1.70
    );

    inner.setFill(color, 0.22);

    return new M.VGroup(
      outer,
      inner,
      dot(p, color, radius)
    );
  }

  function ring(
    p,
    color = GOLD,
    radius = 0.19
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function arrow(
    a,
    b,
    color = GOLD,
    width = 3,
    head = 0.14
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.hypot(dx, dy);

    if (len < 0.00001) {
      return ring(a, color, 0.065);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(
      head,
      len * 0.40
    );

    const q1 = [
      b[0] - ux * h - uy * h * 0.60,
      b[1] - uy * h + ux * h * 0.60,
      0
    ];

    const q2 = [
      b[0] - ux * h + uy * h * 0.60,
      b[1] - uy * h - ux * h * 0.60,
      0
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, q1, color, width),
      line(b, q2, color, width)
    );
  }

  // ------------------------------------------------------------
  // FORMULA BOX
  // ------------------------------------------------------------

  let boxNow = null;

  function swapBox(g) {
    const a = [];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    if (g) {
      a.push(
        new M.FadeIn(g)
      );
    }

    boxNow = g;

    return a;
  }

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 22 : 21;
    const lh = P ? 0.35 : 0.42;

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

    const wd =
      Math.max(...widths) + 0.70;

    const ht =
      rows.length * lh + 0.32;

    const r = rounded(
      wd,
      ht,
      BOXP,
      color
    );

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 -
      0.16 - lh / 2;

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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxh = P ? 1.40 : 3.65;

    const scale = Math.min(
      1,
      BOX_MAX / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    return swapBox(g);
  }

  function clearBox() {
    return swapBox(null);
  }

  // ------------------------------------------------------------
  // PICTURE MANAGEMENT
  // ------------------------------------------------------------

  // Keep the picture and temporary marks separate.
  // Never group objects that are already on screen.
  // Every animation batch uses one awaited play().

  let pictureNow = null;
  let marksNow = null;

  function putPicture(g) {
    const a = [];

    if (pictureNow) {
      a.push(new M.FadeOut(pictureNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    pictureNow = g;

    return a;
  }

  function putMarks(g) {
    const a = [];

    if (marksNow) {
      a.push(new M.FadeOut(marksNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    marksNow = g;

    return a;
  }

  function clearMarks() {
    return putMarks(null);
  }

  function picture(g, marks = null) {
    return [
      ...putPicture(g),
      ...putMarks(marks)
    ];
  }

  // ------------------------------------------------------------
  // GENERAL GRAPH
  // ------------------------------------------------------------

  function graph({
    xmin,
    xmax,
    ymin,
    ymax,
    xticks,
    yticks,
    xlabel,
    ylabel
  }) {
    const X = x =>
      GX0 +
      (x - xmin) / (xmax - xmin) *
      (GX1 - GX0);

    const Y = y =>
      GY0 +
      (y - ymin) / (ymax - ymin) *
      (GY1 - GY0);

    const p = (x, y) => [
      X(x),
      Y(y),
      0
    ];

    const items = [];

    xticks.forEach(v => {
      items.push(line(
        [X(v), GY0, 0],
        [X(v), GY1, 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        fmt(v),
        16,
        C.ink,
        [X(v), GY0 - 0.25, 0],
        true,
        0.85
      ));
    });

    yticks.forEach(v => {
      items.push(line(
        [GX0, Y(v), 0],
        [GX1, Y(v), 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        fmt(v),
        16,
        C.muted,
        [GX0 - 0.33, Y(v), 0],
        true,
        0.70
      ));
    });

    items.push(
      line(
        [GX0, GY0, 0],
        [GX1 + 0.08, GY0, 0],
        C.muted,
        2.4
      ),

      line(
        [GX0, GY0, 0],
        [GX0, GY1 + 0.08, 0],
        C.muted,
        2.4
      ),

      txt(
        xlabel,
        18,
        C.muted,
        [CX, GY0 - 0.60, 0],
        false,
        5.30
      ),

      txt(
        ylabel,
        18,
        C.muted,
        [CX, GY1 + 0.30, 0],
        false,
        5.30
      )
    );

    return {
      X,
      Y,
      p,
      items,
      xmin,
      xmax,
      ymin,
      ymax
    };
  }

  function curveParts(
    G,
    fn,
    from,
    to,
    color = C.cyan,
    n = 88
  ) {
    const halo = [];
    const core = [];

    for (let k = 0; k < n; k++) {
      const a =
        from + (to - from) * k / n;

      const b =
        from + (to - from) *
        (k + 1) / n;

      const ya = fn(a);
      const yb = fn(b);

      if (
        ya < G.ymin ||
        ya > G.ymax ||
        yb < G.ymin ||
        yb > G.ymax
      ) {
        continue;
      }

      halo.push(line(
        G.p(a, ya),
        G.p(b, yb),
        C.card,
        7
      ));

      core.push(line(
        G.p(a, ya),
        G.p(b, yb),
        color,
        3.1
      ));
    }

    return [
      ...halo,
      ...core
    ];
  }

  // ------------------------------------------------------------
  // FAMILIAR LOSS CURVE
  // ------------------------------------------------------------

  function lossGraph(
    showPoints = true,
    showValues = false
  ) {
    const G = graph({
      xmin: -0.20,
      xmax: 4.20,
      ymin: 0,
      ymax: 13,
      xticks: [0, 1, 2, 3, 4],
      yticks: [0, 3, 5, 8, 11],
      xlabel: 'step price',
      ylabel: 'loss'
    });

    const items = [
      ...G.items,

      ...curveParts(
        G,
        loss,
        G.xmin,
        G.xmax
      )
    ];

    if (showPoints) {
      SAMPLE_PRICES.forEach(s => {
        const q = G.p(
          s,
          loss(s)
        );

        items.push(glowDot(
          q,
          C.cyan,
          0.085
        ));

        if (showValues) {
          items.push(txt(
            String(loss(s)),
            20,
            C.cyan,
            [
              q[0],
              q[1] + 0.29,
              0
            ],
            true
          ));
        }
      });
    }

    G.fn = loss;

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  function lp(G, s) {
    return G.p(
      s,
      loss(s)
    );
  }

  // ------------------------------------------------------------
  // TANGENT LINES
  // ------------------------------------------------------------

  function tangent(
    G,
    x,
    fn,
    slope,
    halfWidth = 0.40,
    color = GOLD,
    width = 3.8
  ) {
    const y = fn(x);

    let a = Math.max(
      G.xmin,
      x - halfWidth
    );

    let b = Math.min(
      G.xmax,
      x + halfWidth
    );

    if (
      Math.abs(slope) >
      0.000001
    ) {
      const xa =
        x + (G.ymin - y) / slope;

      const xb =
        x + (G.ymax - y) / slope;

      a = Math.max(
        a,
        Math.min(xa, xb)
      );

      b = Math.min(
        b,
        Math.max(xa, xb)
      );
    }

    if (b <= a) {
      return ring(
        G.p(x, y),
        color,
        0.12
      );
    }

    return line(
      G.p(
        a,
        y + slope * (a - x)
      ),

      G.p(
        b,
        y + slope * (b - x)
      ),

      color,
      width
    );
  }

  function slopeMarks(
    G,
    indices = [0, 1, 2, 3, 4],
    active = null
  ) {
    const items = [];

    indices.forEach(s => {
      const slope = derivative(s);

      const p = lp(
        G,
        s
      );

      const c =
        s === active
          ? GOLD
          : s === 2
            ? GREEN
            : GOLD;

      items.push(tangent(
        G,
        s,
        loss,
        slope,
        0.34,
        c,
        s === active ? 4.6 : 3.1
      ));

      items.push(glowDot(
        p,
        c,
        s === active
          ? 0.115
          : 0.075
      ));

      const dx =
        s === 0
          ? 0.22
          : s === 4
            ? -0.22
            : 0;

      items.push(txt(
        signed(slope),
        20,
        c,
        [
          p[0] + dx,
          p[1] + 0.34,
          0
        ],
        true,
        0.80
      ));
    });

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // SLOPE SEQUENCE
  // ------------------------------------------------------------

  function slopeSequence(
    showChanges = false,
    active = null
  ) {
    const cy = P
      ? -0.80
      : -0.38;

    const pitch = 1.10;

    const xs = SAMPLE_PRICES.map(
      k => CX + (k - 2) * pitch
    );

    const items = [];

    items.push(txt(
      'STEP PRICE',
      17,
      C.muted,
      [
        CX,
        cy + 1.52,
        0
      ],
      true
    ));

    SAMPLE_PRICES.forEach((s, k) => {
      const x = xs[k];

      const c =
        s === 2
          ? GREEN
          : GOLD;

      items.push(txt(
        String(s),
        19,
        C.ink,
        [
          x,
          cy + 0.95,
          0
        ],
        true
      ));

      items.push(rounded(
        0.88,
        0.77,
        [
          x,
          cy,
          0
        ],
        k === active
          ? C.cyan
          : c
      ));

      items.push(txt(
        signed(derivative(s)),
        25,
        c,
        [
          x,
          cy,
          0
        ],
        true,
        0.72
      ));

      items.push(arrow(
        [
          x,
          cy + 0.72,
          0
        ],
        [
          x,
          cy + 0.43,
          0
        ],
        C.muted,
        1.8
      ));
    });

    if (showChanges) {
      for (let k = 0; k < 4; k++) {
        const a = xs[k];
        const b = xs[k + 1];

        const y =
          cy - 0.80;

        items.push(
          line(
            [
              a,
              cy - 0.42,
              0
            ],
            [
              a,
              y,
              0
            ],
            C.cyan,
            1.8
          ),

          arrow(
            [a, y, 0],
            [b, y, 0],
            C.cyan,
            2.6
          ),

          txt(
            '+4',
            18,
            C.cyan,
            [
              (a + b) / 2,
              y - 0.25,
              0
            ],
            true
          )
        );
      }

      items.push(txt(
        'same increase in slope every time',
        18,
        GREEN,
        [
          CX,
          cy - 1.57,
          0
        ],
        false,
        5.25
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // GRAPH OF THE DERIVATIVE
  // ------------------------------------------------------------

  function derivativeGraph(
    showPoints = true
  ) {
    const G = graph({
      xmin: -0.20,
      xmax: 4.20,
      ymin: -10,
      ymax: 10,
      xticks: [0, 1, 2, 3, 4],
      yticks: [-8, -4, 0, 4, 8],
      xlabel: 'step price',
      ylabel: 'slope of the loss curve'
    });

    const items = [
      ...G.items
    ];

    items.push(line(
      G.p(G.xmin, 0),
      G.p(G.xmax, 0),
      C.ink,
      2.0
    ));

    items.push(line(
      G.p(
        G.xmin,
        derivative(G.xmin)
      ),

      G.p(
        G.xmax,
        derivative(G.xmax)
      ),

      GOLD,
      3.9
    ));

    if (showPoints) {
      SAMPLE_PRICES.forEach(s => {
        const p = G.p(
          s,
          derivative(s)
        );

        const color =
          s === 2
            ? GREEN
            : GOLD;

        items.push(glowDot(
          p,
          color,
          0.09
        ));

        items.push(txt(
          signed(derivative(s)),
          18,
          color,
          [
            p[0] +
              (s === 4 ? -0.23 : 0.17),
            p[1] + 0.26,
            0
          ],
          true,
          0.75
        ));
      });
    }

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  function slopeChangeTriangle(
    G,
    s = 1
  ) {
    const a = G.p(
      s,
      derivative(s)
    );

    const b = G.p(
      s + 1,
      derivative(s)
    );

    const d = G.p(
      s + 1,
      derivative(s + 1)
    );

    return new M.VGroup(
      arrow(
        a,
        b,
        C.cyan,
        3.4
      ),

      arrow(
        b,
        d,
        GREEN,
        3.6
      ),

      glowDot(
        a,
        GOLD,
        0.09
      ),

      glowDot(
        d,
        GOLD,
        0.09
      ),

      txt(
        '+1',
        20,
        C.cyan,
        [
          (a[0] + b[0]) / 2,
          a[1] - 0.27,
          0
        ],
        true
      ),

      txt(
        '+4',
        20,
        GREEN,
        [
          b[0] + 0.32,
          (b[1] + d[1]) / 2,
          0
        ],
        true
      )
    );
  }

  function derivativeSignMarks(G) {
    const p = G.p(2, 0);

    return new M.VGroup(
      line(
        G.p(0, derivative(0)),
        p,
        C.cyan,
        5
      ),

      line(
        p,
        G.p(4, derivative(4)),
        PINK,
        5
      ),

      glowDot(
        p,
        GREEN,
        0.13
      ),

      ring(
        p,
        GREEN,
        0.22
      ),

      txt(
        'negative',
        18,
        C.cyan,
        [
          G.X(0.75),
          G.Y(-1.8),
          0
        ],
        false,
        1.70
      ),

      txt(
        'positive',
        18,
        PINK,
        [
          G.X(3.25),
          G.Y(1.8),
          0
        ],
        false,
        1.70
      ),

      txt(
        'zero',
        18,
        GREEN,
        [
          p[0] + 0.38,
          p[1] - 0.30,
          0
        ]
      )
    );
  }

  // ------------------------------------------------------------
  // GRAPH OF THE SECOND DERIVATIVE
  // ------------------------------------------------------------

  function curvatureGraph() {
    const G = graph({
      xmin: -0.20,
      xmax: 4.20,
      ymin: 0,
      ymax: 6,
      xticks: [0, 1, 2, 3, 4],
      yticks: [0, 2, 4, 6],
      xlabel: 'step price',
      ylabel: 'curvature'
    });

    const items = [
      ...G.items
    ];

    items.push(line(
      G.p(G.xmin, 4),
      G.p(G.xmax, 4),
      GREEN,
      4.1
    ));

    SAMPLE_PRICES.forEach(s => {
      items.push(glowDot(
        G.p(s, 4),
        GREEN,
        0.09
      ));

      items.push(txt(
        '4',
        20,
        GREEN,
        [
          G.X(s),
          G.Y(4) + 0.29,
          0
        ],
        true
      ));
    });

    items.push(txt(
      'positive everywhere',
      19,
      GREEN,
      [
        CX,
        G.Y(1.6),
        0
      ]
    ));

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  // ------------------------------------------------------------
  // POSITIVE CURVATURE: BENDING UPWARD
  // ------------------------------------------------------------

  function bowlMarks(G) {
    const items = [];

    const samples = [
      0.45,
      1.15,
      2,
      2.85,
      3.55
    ];

    samples.forEach(s => {
      items.push(tangent(
        G,
        s,
        loss,
        derivative(s),
        0.28,
        GOLD,
        3.4
      ));
    });

    items.push(
      arrow(
        G.p(0.45, loss(0.45) + 0.80),
        G.p(0.95, loss(0.95) + 0.80),
        C.cyan,
        3.0
      ),

      arrow(
        G.p(3.05, loss(3.05) + 0.80),
        G.p(3.55, loss(3.55) + 0.80),
        C.cyan,
        3.0
      ),

      glowDot(
        lp(G, 2),
        GREEN,
        0.115
      ),

      txt(
        'bends upward',
        19,
        GREEN,
        [
          CX,
          G.Y(1.30),
          0
        ],
        false,
        2.80
      )
    );

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // THE STRING TEST
  // ------------------------------------------------------------

  // A convex function lies on or below every chord.
  //
  // For the chapter's quadratic and endpoints a, b:
  //
  // chord(x) − loss(x)
  //     = 2 × (x − a) × (b − x).
  //
  // This quantity is nonnegative when a <= x <= b.
  // It is positive for distinct endpoints and interior x.
  //
  // The shading is made from vertical Line objects, avoiding
  // dependencies on polygon or filled-region APIs.

  function chordValue(
    fn,
    a,
    b,
    x
  ) {
    if (Math.abs(b - a) < 0.000001) {
      return fn(a);
    }

    return (
      fn(a) +
      (fn(b) - fn(a)) *
      (x - a) / (b - a)
    );
  }

  function stringMarks(
    G,
    a,
    b,
    options = {}
  ) {
    const {
      fn = loss,
      showShade = true,
      showLabels = true,
      showGap = false,
      showString = true,
      testFailure = false
    } = options;

    if (a > b) {
      [a, b] = [b, a];
    }

    const A = G.p(
      a,
      fn(a)
    );

    const B = G.p(
      b,
      fn(b)
    );

    const items = [];

    if (
      showShade &&
      Math.abs(b - a) > 0.0001
    ) {
      const n = 42;

      for (let k = 1; k < n; k++) {
        const x =
          a + (b - a) * k / n;

        const yc =
          chordValue(
            fn,
            a,
            b,
            x
          );

        const yf = fn(x);

        const gap = yc - yf;

        if (Math.abs(gap) < 0.001) {
          continue;
        }

        items.push(line(
          G.p(x, yf),
          G.p(x, yc),
          gap >= 0
            ? '#285B65'
            : '#793E60',
          1.9
        ));
      }
    }

    if (showString) {
      items.push(line(
        A,
        B,
        testFailure ? PINK : GOLD,
        4.4
      ));
    }

    items.push(
      glowDot(
        A,
        GOLD,
        0.12
      ),

      glowDot(
        B,
        GOLD,
        0.12
      )
    );

    if (showLabels) {
      const pA = [
        Math.max(GX0 + 0.82, A[0] - 0.30),
        A[1] + 0.52,
        0
      ];
      const pB = [
        Math.min(GX1 - 0.82, B[0] + 0.30),
        B[1] + 0.52,
        0
      ];
      items.push(
        rounded(1.62, 0.40, pA, GOLD),
        txt(
          `(${fmt(a, 2)}, ${fmt(fn(a), 2)})`,
          17,
          GOLD,
          pA,
          true,
          1.50
        ),

        rounded(1.62, 0.40, pB, GOLD),
        txt(
          `(${fmt(b, 2)}, ${fmt(fn(b), 2)})`,
          17,
          GOLD,
          pB,
          true,
          1.50
        )
      );
    }

    if (showGap) {
      const x =
        (a + b) / 2;

      const yc =
        chordValue(
          fn,
          a,
          b,
          x
        );

      const yf = fn(x);

      const p = G.p(
        x,
        yf
      );

      const q = G.p(
        x,
        yc
      );

      const c =
        yc >= yf
          ? GREEN
          : PINK;

      items.push(
        arrow(
          q,
          p,
          c,
          3.2
        ),

        glowDot(
          p,
          c,
          0.095
        ),

        txt(
          yc >= yf
            ? 'curve below string'
            : 'curve above string',
          17,
          c,
          [
            CX,
            (p[1] + q[1]) / 2,
            0
          ],
          false,
          2.85
        )
      );
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // GLOBAL MINIMUM
  // ------------------------------------------------------------

  function minimumMarks(
    G,
    showAllComparison = false
  ) {
    const p = lp(
      G,
      2
    );

    const items = [
      glowDot(
        p,
        GREEN,
        0.13
      ),

      ring(
        p,
        GREEN,
        0.22
      ),

      tangent(
        G,
        2,
        loss,
        0,
        0.52,
        GOLD,
        4.0
      ),

      dash(
        G.p(2, 0),
        p,
        GREEN,
        1.8
      ),

      txt(
        'slope = 0',
        19,
        GOLD,
        [
          p[0],
          p[1] + 0.42,
          0
        ],
        true
      ),

      txt(
        'loss = 3',
        19,
        GREEN,
        [
          p[0],
          p[1] - 0.32,
          0
        ],
        true
      )
    ];

    if (showAllComparison) {
      items.push(dash(
        G.p(G.xmin, 3),
        G.p(G.xmax, 3),
        GREEN,
        1.9
      ));

      for (const s of [
        0.3,
        0.9,
        3.1,
        3.7
      ]) {
        items.push(arrow(
          G.p(s, loss(s)),
          G.p(s, 3),
          C.muted,
          2.3
        ));
      }
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // GRADIENT DESCENT FROM EITHER SIDE
  // ------------------------------------------------------------

  const SAFE_RATE = 0.10;

  function descentHistory(
    start,
    rate = SAFE_RATE,
    count = 12,
    fn = loss,
    dfn = derivative
  ) {
    const result = [];

    let s = start;

    for (let k = 0; k <= count; k++) {
      result.push({
        k,
        s,
        loss: fn(s),
        slope: dfn(s)
      });

      s -= rate * dfn(s);
    }

    return result;
  }

  const LEFT_WALK =
    descentHistory(0);

  const RIGHT_WALK =
    descentHistory(4);

  function walkParts(
    G,
    H,
    upto,
    color = GOLD
  ) {
    const items = [];

    for (let k = 1; k <= upto; k++) {
      const a = G.p(
        H[k - 1].s,
        H[k - 1].loss
      );

      const b = G.p(
        H[k].s,
        H[k].loss
      );

      items.push(line(
        a,
        b,
        color,
        2.6
      ));

      items.push(dot(
        a,
        color,
        k < 4 ? 0.055 : 0.035
      ));
    }

    const q = H[upto];

    items.push(glowDot(
      G.p(q.s, q.loss),
      color,
      0.105
    ));

    return items;
  }

  function twoWalks(
    G,
    upto = 12
  ) {
    return new M.VGroup(
      ...walkParts(
        G,
        LEFT_WALK,
        upto,
        GOLD
      ),

      ...walkParts(
        G,
        RIGHT_WALK,
        upto,
        GOLD
      ),

      glowDot(
        lp(G, 2),
        GREEN,
        0.085
      )
    );
  }

  // ------------------------------------------------------------
  // FULL TWO-INPUT LOSS MAP
  // ------------------------------------------------------------

  // Equal physical scale for the two axes.
  // This preserves the actual elliptic contour geometry.

  const MAP = {
    smin: -1.25,
    smax: 5.25,
    mmin: 8.40,
    mmax: 13.60,
    unit: P ? 0.80 : 0.52,
    cy: P ? -1.30 : -0.48
  };

  function mp(s, m) {
    return [
      CX +
        (s - 2) * MAP.unit,

      MAP.cy +
        (m - 11) * MAP.unit,

      0
    ];
  }

  const MX0 = mp(
    MAP.smin,
    11
  )[0];

  const MX1 = mp(
    MAP.smax,
    11
  )[0];

  const MY0 = mp(
    2,
    MAP.mmin
  )[1];

  const MY1 = mp(
    2,
    MAP.mmax
  )[1];

  function inMap(s, m) {
    return (
      s >= MAP.smin &&
      s <= MAP.smax &&
      m >= MAP.mmin &&
      m <= MAP.mmax
    );
  }

  const HEAT = [
    '#101B2D',
    '#142943',
    '#193D5A',
    '#205473',
    '#286F89',
    '#3696A8',
    '#58C4C8',
    '#91E9DE'
  ];

  function heatColor(v) {
    const k = Math.max(
      0,
      Math.min(
        HEAT.length - 1,
        Math.floor(v / 4)
      )
    );

    return HEAT[k];
  }

  function heatParts() {
    const nx = 22;
    const ny = 18;

    const ds =
      (MAP.smax - MAP.smin) / nx;

    const dm =
      (MAP.mmax - MAP.mmin) / ny;

    const items = [];

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const s =
          MAP.smin +
          (i + 0.5) * ds;

        const m =
          MAP.mmin +
          (j + 0.5) * dm;

        items.push(rect(
          ds * MAP.unit * 1.012,
          dm * MAP.unit * 1.012,
          mp(s, m),
          heatColor(fullLoss(s, m)),
          0.90,
          0
        ));
      }
    }

    return items;
  }

  function mapAxes() {
    const items = [];

    for (let s = -1; s <= 5; s++) {
      const a = mp(
        s,
        MAP.mmin
      );

      const b = mp(
        s,
        MAP.mmax
      );

      items.push(line(
        a,
        b,
        '#426078',
        0.65
      ));

      items.push(txt(
        fmt(s),
        16,
        C.ink,
        [
          a[0],
          MY0 - 0.25,
          0
        ],
        true
      ));
    }

    for (let m = 9; m <= 13; m++) {
      const a = mp(
        MAP.smin,
        m
      );

      const b = mp(
        MAP.smax,
        m
      );

      items.push(line(
        a,
        b,
        '#426078',
        0.65
      ));

      items.push(txt(
        String(m),
        16,
        C.ink,
        [
          MX0 - 0.32,
          a[1],
          0
        ],
        true
      ));
    }

    items.push(
      line(
        [MX0, MY0, 0],
        [MX1, MY0, 0],
        C.muted,
        2.3
      ),

      line(
        [MX0, MY0, 0],
        [MX0, MY1, 0],
        C.muted,
        2.3
      ),

      line(
        [MX0, MY1, 0],
        [MX1, MY1, 0],
        C.muted,
        1.2
      ),

      line(
        [MX1, MY0, 0],
        [MX1, MY1, 0],
        C.muted,
        1.2
      ),

      txt(
        'step price',
        18,
        C.muted,
        [
          CX,
          MY0 - 0.58,
          0
        ]
      ),

      txt(
        'middle rent',
        18,
        C.muted,
        [
          CX,
          MY1 + 0.30,
          0
        ]
      )
    );

    return items;
  }

  // Exact ellipse for loss k:
  //
  // s = 2  + sqrt(k / 2) cos(theta)
  // m = 11 + sqrt(k / 3) sin(theta)

  function contourParts(
    level,
    color = '#70B8C5',
    width = 1.6,
    n = 72
  ) {
    const rs =
      Math.sqrt(level / 2);

    const rm =
      Math.sqrt(level / 3);

    const items = [];

    for (let k = 0; k < n; k++) {
      const a =
        2 * Math.PI * k / n;

      const b =
        2 * Math.PI * (k + 1) / n;

      const s0 =
        2 + rs * Math.cos(a);

      const m0 =
        11 + rm * Math.sin(a);

      const s1 =
        2 + rs * Math.cos(b);

      const m1 =
        11 + rm * Math.sin(b);

      if (
        inMap(s0, m0) &&
        inMap(s1, m1)
      ) {
        items.push(line(
          mp(s0, m0),
          mp(s1, m1),
          color,
          width
        ));
      }
    }

    return items;
  }

  function contourLabel(
    level,
    angle
  ) {
    const s =
      2 +
      Math.sqrt(level / 2) *
      Math.cos(angle);

    const m =
      11 +
      Math.sqrt(level / 3) *
      Math.sin(angle);

    if (!inMap(s, m)) {
      return [];
    }

    const p = mp(s, m);

    const t = txt(
      fmt(level),
      15,
      C.ink,
      p,
      true
    );

    const r = rounded(
      Math.max(
        0.32,
        t.getWidth() + 0.14
      ),
      0.25,
      p,
      C.muted
    );

    return [
      new M.VGroup(r, t)
    ];
  }

  function mapPicture(
    showMinimum = true
  ) {
    const items = [
      ...heatParts(),
      ...mapAxes()
    ];

    [1, 3, 6, 8, 11, 16, 24]
      .forEach(level => {
        items.push(...contourParts(
          level,
          level === 11
            ? '#9CDDDC'
            : '#70B8C5',
          level === 11 ? 2.1 : 1.5
        ));
      });

    items.push(
      ...contourLabel(3, 3.55),
      ...contourLabel(8, 1.60),
      ...contourLabel(11, -0.55),
      ...contourLabel(16, 2.40)
    );

    if (showMinimum) {
      items.push(glowDot(
        mp(2, 11),
        GREEN,
        0.10
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  function mapMinimumMarks() {
    const p = mp(2, 11);

    return new M.VGroup(
      dash(
        mp(2, MAP.mmin),
        p,
        GREEN,
        1.8
      ),

      dash(
        mp(MAP.smin, 11),
        p,
        GREEN,
        1.8
      ),

      glowDot(
        p,
        GREEN,
        0.14
      ),

      ring(
        p,
        GREEN,
        0.23
      ),

      rounded(
        1.30,
        0.80,
        [
          p[0] + 0.98,
          p[1] + 0.02,
          0
        ],
        GREEN
      ),

      txt(
        '(2, 11)',
        19,
        GREEN,
        [
          p[0] + 0.98,
          p[1] + 0.20,
          0
        ],
        true
      ),

      txt(
        'loss 0',
        19,
        GREEN,
        [
          p[0] + 0.98,
          p[1] - 0.17,
          0
        ],
        true
      )
    );
  }

  // ------------------------------------------------------------
  // EQUAL DISTANCES IN TWO DIRECTIONS
  // ------------------------------------------------------------

  // Starting at the full minimum:
  //
  // Move step price by +1:
  // (2, 11) -> (3, 11), loss = 2.
  //
  // Move middle rent by +1:
  // (2, 11) -> (2, 12), loss = 3.
  //
  // Both moves have equal length, but the middle-rent
  // direction rises faster.

  function directionComparisonMarks(
    reveal = 2
  ) {
    const a = mp(
      2,
      11
    );

    const b = mp(
      3,
      11
    );

    const d = mp(
      2,
      12
    );

    const items = [
      glowDot(
        a,
        GREEN,
        0.12
      )
    ];

    if (reveal >= 1) {
      items.push(
        arrow(
          a,
          b,
          C.cyan,
          3.9
        ),

        glowDot(
          b,
          C.cyan,
          0.11
        ),

        txt(
          '+1',
          19,
          C.cyan,
          [
            (a[0] + b[0]) / 2,
            a[1] - 0.26,
            0
          ],
          true
        ),

        txt(
          'loss 2',
          17,
          C.cyan,
          [
            b[0] + 0.50,
            b[1] - 0.28,
            0
          ],
          true
        )
      );
    }

    if (reveal >= 2) {
      items.push(
        arrow(
          a,
          d,
          VIOLET,
          3.9
        ),

        glowDot(
          d,
          VIOLET,
          0.11
        ),

        txt(
          '+1',
          19,
          VIOLET,
          [
            a[0] - 0.33,
            (a[1] + d[1]) / 2,
            0
          ],
          true
        ),

        txt(
          'loss 3',
          17,
          VIOLET,
          [
            d[0] + 0.52,
            d[1] + 0.22,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // RENT GRAPH
  // ------------------------------------------------------------

  function rentGraph(
    s,
    m,
    old = null,
    showChanges = false
  ) {
    const G = graph({
      xmin: -1.50,
      xmax: 1.50,
      ymin: 7,
      ymax: 16,
      xticks: [-1, 0, 1],
      yticks: [8, 10, 12, 14, 16],
      xlabel: 'size step',
      ylabel: 'rent (hundreds of dollars)'
    });

    const items = [
      ...G.items
    ];

    if (old !== null) {
      items.push(dash(
        G.p(
          -1.12,
          old[1] - old[0] * 1.12
        ),

        G.p(
          1.12,
          old[1] + old[0] * 1.12
        ),

        C.muted,
        2.4
      ));
    }

    items.push(line(
      G.p(
        -1.12,
        m - s * 1.12
      ),

      G.p(
        1.12,
        m + s * 1.12
      ),

      GOLD,
      4.4
    ));

    const guesses =
      prediction(s, m);

    STEPS.forEach((x, k) => {
      const a = G.p(
        x,
        RENTS[k]
      );

      const b = G.p(
        x,
        guesses[k]
      );

      items.push(glowDot(
        a,
        COLORS[k],
        0.11
      ));

      items.push(txt(
        String(RENTS[k]),
        18,
        COLORS[k],
        [
          a[0] - 0.32,
          a[1] + 0.14,
          0
        ],
        true
      ));

      items.push(dot(
        b,
        GOLD,
        0.075
      ));

      if (showChanges && old !== null) {
        const previous =
          old[1] + old[0] * x;

        const change =
          guesses[k] - previous;

        if (Math.abs(change) > 0.0001) {
          items.push(arrow(
            G.p(x, previous),
            b,
            VIOLET,
            3.3
          ));

          items.push(txt(
            signed(change),
            20,
            VIOLET,
            [
              b[0] + 0.38,
              (
                G.Y(previous) +
                b[1]
              ) / 2,
              0
            ],
            true
          ));
        } else {
          items.push(ring(
            b,
            GREEN,
            0.17
          ));

          items.push(txt(
            '0',
            20,
            GREEN,
            [
              b[0] + 0.32,
              b[1] - 0.23,
              0
            ],
            true
          ));
        }
      }
    });

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  // ------------------------------------------------------------
  // COMPARE THE EFFECT ON ALL THREE GUESSES
  // ------------------------------------------------------------

  function guessChangePicture(
    mode = 'middle'
  ) {
    const cy = P
      ? -0.65
      : -0.35;

    const xs = [
      CX - 1.76,
      CX,
      CX + 1.76
    ];

    const names = [
      'SMALL',
      'MIDDLE',
      'LARGE'
    ];

    const old =
      prediction(2, 11);

    const next =
      mode === 'middle'
        ? prediction(2, 12)
        : prediction(3, 11);

    const items = [];

    for (let k = 0; k < 3; k++) {
      const x = xs[k];

      const change =
        next[k] - old[k];

      const c = COLORS[k];

      items.push(rounded(
        1.55,
        P ? 2.92 : 2.55,
        [
          x,
          cy,
          0
        ],
        c
      ));

      items.push(txt(
        names[k],
        16,
        c,
        [
          x,
          cy + 0.99,
          0
        ],
        true,
        1.32
      ));

      items.push(txt(
        String(old[k]),
        24,
        C.ink,
        [
          x,
          cy + 0.36,
          0
        ],
        true
      ));

      items.push(txt(
        signed(change),
        22,
        change === 0
          ? GREEN
          : GOLD,
        [
          x,
          cy - 0.14,
          0
        ],
        true
      ));

      items.push(line(
        [
          x - 0.48,
          cy - 0.41,
          0
        ],
        [
          x + 0.48,
          cy - 0.41,
          0
        ],
        C.muted,
        1.8
      ));

      items.push(txt(
        String(next[k]),
        25,
        c,
        [
          x,
          cy - 0.80,
          0
        ],
        true
      ));
    }

    items.push(txt(
      mode === 'middle'
        ? 'all three guesses move'
        : 'middle guess stays fixed',
      19,
      mode === 'middle'
        ? VIOLET
        : GREEN,
      [
        CX,
        P ? -2.75 : -2.10,
        0
      ],
      false,
      5.25
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // COMPARE THE TWO BOWL CROSS-SECTIONS
  // ------------------------------------------------------------

  // Both directions pass through the true minimum.
  //
  // Let d be displacement from the optimum:
  //
  // Along step price: loss = 2d².
  // Along middle rent: loss = 3d².
  //
  // The two curves share identical graph axes.

  const stepSlice = d =>
    2 * d ** 2;

  const middleSlice = d =>
    3 * d ** 2;

  function slicesGraph(
    reveal = 2
  ) {
    const G = graph({
      xmin: -1.55,
      xmax: 1.55,
      ymin: 0,
      ymax: 8,
      xticks: [-1, 0, 1],
      yticks: [0, 2, 4, 6, 8],
      xlabel: 'distance from the minimum',
      ylabel: 'loss'
    });

    const items = [
      ...G.items,

      ...curveParts(
        G,
        stepSlice,
        G.xmin,
        G.xmax,
        C.cyan,
        70
      )
    ];

    if (reveal >= 2) {
      items.push(...curveParts(
        G,
        middleSlice,
        G.xmin,
        G.xmax,
        VIOLET,
        70
      ));
    }

    items.push(glowDot(
      G.p(0, 0),
      GREEN,
      0.11
    ));

    items.push(txt(
      'step price',
      17,
      C.cyan,
      [
        G.X(-1.04),
        G.Y(2.6),
        0
      ],
      false,
      1.60
    ));

    if (reveal >= 2) {
      items.push(txt(
        'middle rent',
        17,
        VIOLET,
        [
          G.X(0.95),
          G.Y(4.9),
          0
        ],
        false,
        1.60
      ));
    }

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  function sliceComparisonMarks(G) {
    const a = G.p(
      1,
      stepSlice(1)
    );

    const b = G.p(
      1,
      middleSlice(1)
    );

    return new M.VGroup(
      dash(
        G.p(1, 0),
        b,
        C.muted,
        1.8
      ),

      glowDot(
        a,
        C.cyan,
        0.105
      ),

      glowDot(
        b,
        VIOLET,
        0.105
      ),

      txt(
        '2',
        22,
        C.cyan,
        [
          a[0] + 0.35,
          a[1] - 0.12,
          0
        ],
        true
      ),

      txt(
        '3',
        22,
        VIOLET,
        [
          b[0] + 0.35,
          b[1] + 0.12,
          0
        ],
        true
      ),

      txt(
        'same move: +1',
        18,
        GOLD,
        [
          G.X(0.60),
          G.Y(0.60),
          0
        ],
        true,
        2.30
      )
    );
  }

  // ------------------------------------------------------------
  // COMPARE CURVATURES 4 AND 6
  // ------------------------------------------------------------

  function curvatureComparison() {
    const cy = P
      ? -0.65
      : -0.38;

    const rows = [
      {
        name: 'STEP PRICE',
        value: 4,
        color: C.cyan
      },
      {
        name: 'MIDDLE RENT',
        value: 6,
        color: VIOLET
      }
    ];

    const items = [];

    const x0 = CX - 2.20;

    const maxW = 3.80;

    rows.forEach((q, k) => {
      const y =
        cy + 0.76 -
        k * 1.52;

      items.push(txt(
        q.name,
        19,
        q.color,
        [
          CX,
          y + 0.49,
          0
        ],
        true
      ));

      items.push(rect(
        maxW,
        0.43,
        [
          x0 + maxW / 2,
          y,
          0
        ],
        C.muted,
        0.12,
        1
      ));

      const w =
        maxW * q.value / 6;

      items.push(rect(
        w,
        0.43,
        [
          x0 + w / 2,
          y,
          0
        ],
        q.color,
        0.84,
        1.5
      ));

      items.push(txt(
        String(q.value),
        28,
        q.color,
        [
          x0 + maxW + 0.42,
          y,
          0
        ],
        true
      ));

      items.push(txt(
        `slope grows by ${q.value} per unit`,
        16,
        C.muted,
        [
          CX,
          y - 0.42,
          0
        ],
        false,
        5.10
      ));
    });

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // OVAL CONTOURS
  // ------------------------------------------------------------

  // At loss 6:
  //
  // Horizontal radius = sqrt(6 / 2) = sqrt(3).
  // Vertical radius   = sqrt(6 / 3) = sqrt(2).
  //
  // The bowl is wider along step price and narrower along
  // middle rent. The coordinate scales are equal.

  function ovalMarks(
    level = 6
  ) {
    const rs =
      Math.sqrt(level / 2);

    const rm =
      Math.sqrt(level / 3);

    const p = mp(2, 11);

    const a = mp(
      2 - rs,
      11
    );

    const b = mp(
      2 + rs,
      11
    );

    const c = mp(
      2,
      11 - rm
    );

    const d = mp(
      2,
      11 + rm
    );

    return new M.VGroup(
      ...contourParts(
        level,
        GOLD,
        3.6,
        96
      ),

      arrow(
        p,
        a,
        C.cyan,
        3.1
      ),

      arrow(
        p,
        b,
        C.cyan,
        3.1
      ),

      arrow(
        p,
        c,
        VIOLET,
        3.1
      ),

      arrow(
        p,
        d,
        VIOLET,
        3.1
      ),

      glowDot(
        p,
        GREEN,
        0.105
      ),

      txt(
        'wider',
        17,
        C.cyan,
        [
          b[0] + 0.36,
          b[1] + 0.26,
          0
        ]
      ),

      txt(
        'narrower',
        17,
        VIOLET,
        [
          d[0] + 0.61,
          d[1] + 0.19,
          0
        ],
        false,
        1.40
      )
    );
  }

  // ------------------------------------------------------------
  // FUNCTION → DERIVATIVE → SECOND DERIVATIVE
  // ------------------------------------------------------------

  function derivativeChain(
    active = 2
  ) {
    const cy = P
      ? -0.80
      : -0.32;

    const labels = [
      'LOSS',
      'SLOPE',
      'CURVATURE'
    ];

    const values = [
      '3 + 2(s − 2)²',
      '4(s − 2)',
      '4'
    ];

    const notes = [
      'original function',
      'first derivative',
      'second derivative'
    ];

    const colors = [
      C.cyan,
      GOLD,
      GREEN
    ];

    const items = [];

    const positions = [];

    for (let k = 0; k < 3; k++) {
      positions.push(
        P
          ? [
              CX,
              0.63 - k * 1.65,
              0
            ]
          : [
              CX + (k - 1) * 1.90,
              cy,
              0
            ]
      );
    }

    const w = P ? 4.75 : 1.70;
    const h = P ? 1.15 : 2.35;

    positions.forEach((p, k) => {
      const c =
        k <= active
          ? colors[k]
          : C.muted;

      items.push(rounded(
        w,
        h,
        p,
        c
      ));

      if (P) {
        items.push(txt(
          labels[k],
          17,
          c,
          [
            p[0] - 1.15,
            p[1] + 0.22,
            0
          ],
          true,
          2.05
        ));

        items.push(txt(
          k <= active
            ? values[k]
            : '?',
          23,
          c,
          [
            p[0] + 1.02,
            p[1] + 0.04,
            0
          ],
          true,
          2.24
        ));

        items.push(txt(
          notes[k],
          15,
          C.muted,
          [
            p[0] - 1.10,
            p[1] - 0.23,
            0
          ],
          false,
          2.15
        ));
      } else {
        items.push(txt(
          labels[k],
          16,
          c,
          [
            p[0],
            p[1] + 0.76,
            0
          ],
          true,
          w - 0.16
        ));

        items.push(txt(
          k <= active
            ? values[k]
            : '?',
          23,
          c,
          [
            p[0],
            p[1] + 0.08,
            0
          ],
          true,
          w - 0.16
        ));

        items.push(txt(
          notes[k],
          14,
          C.muted,
          [
            p[0],
            p[1] - 0.77,
            0
          ],
          false,
          w - 0.18
        ));
      }
    });

    for (let k = 0; k < 2; k++) {
      const a = positions[k];
      const b = positions[k + 1];

      const c =
        k < active
          ? GOLD
          : C.muted;

      if (P) {
        items.push(arrow(
          [
            a[0],
            a[1] - h / 2 - 0.03,
            0
          ],
          [
            b[0],
            b[1] + h / 2 + 0.03,
            0
          ],
          c,
          3.0
        ));

        items.push(txt(
          'differentiate',
          16,
          c,
          [
            CX + 1.08,
            (a[1] + b[1]) / 2,
            0
          ],
          false,
          1.80
        ));
      } else {
        items.push(arrow(
          [
            a[0] + w / 2 + 0.015,
            a[1],
            0
          ],
          [
            b[0] - w / 2 - 0.015,
            b[1],
            0
          ],
          c,
          2.2,
          0.07
        ));
      }
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // SLOPE VERSUS CURVATURE
  // ------------------------------------------------------------

  function slopeCurvaturePicture() {
    const cy = P
      ? -0.75
      : -0.35;

    const xs = [
      CX - 1.45,
      CX + 1.45
    ];

    const w = 2.65;
    const h = P ? 3.10 : 2.80;

    const items = [];

    for (let k = 0; k < 2; k++) {
      items.push(rounded(
        w,
        h,
        [
          xs[k],
          cy,
          0
        ],
        k === 0
          ? GOLD
          : GREEN
      ));
    }

    items.push(
      txt(
        'SLOPE',
        20,
        GOLD,
        [
          xs[0],
          cy + h / 2 - 0.33,
          0
        ],
        true
      ),

      txt(
        'CURVATURE',
        19,
        GREEN,
        [
          xs[1],
          cy + h / 2 - 0.33,
          0
        ],
        true
      )
    );

    const ax = xs[0];

    items.push(arrow(
      [
        ax - 0.78,
        cy + 0.48,
        0
      ],
      [
        ax + 0.78,
        cy - 0.48,
        0
      ],
      GOLD,
      4.0
    ));

    const bx = xs[1];

    const f = x =>
      cy - 0.28 + 0.85 * x * x;

    for (let k = 0; k < 32; k++) {
      const a =
        -0.85 + 1.70 * k / 32;

      const b =
        -0.85 + 1.70 * (k + 1) / 32;

      items.push(line(
        [bx + a, f(a), 0],
        [bx + b, f(b), 0],
        GREEN,
        3.5
      ));
    }

    items.push(
      txt(
        'which way is down?',
        17,
        GOLD,
        [
          xs[0],
          cy - h / 2 + 0.36,
          0
        ],
        false,
        w - 0.24
      ),

      txt(
        'how is slope changing?',
        17,
        GREEN,
        [
          xs[1],
          cy - h / 2 + 0.36,
          0
        ],
        false,
        w - 0.24
      )
    );

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // CURVATURE IN EVERY DIRECTION
  // ------------------------------------------------------------

  // For a unit direction u = (cos(theta), sin(theta)):
  //
  // directional curvature
  //     = 4 cos²(theta) + 6 sin²(theta).
  //
  // It is always between 4 and 6, hence always positive.

  function directionalCurvatureMarks(
    active = null
  ) {
    const p = mp(2, 11);

    const items = [
      glowDot(
        p,
        GREEN,
        0.115
      )
    ];

    const directions = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      3 * Math.PI / 4,
      Math.PI,
      5 * Math.PI / 4,
      3 * Math.PI / 2,
      7 * Math.PI / 4
    ];

    const radius = 1.22;

    directions.forEach((a, k) => {
      const x =
        Math.cos(a);

      const y =
        Math.sin(a);

      const v =
        4 * x * x +
        6 * y * y;

      const q = mp(
        2 + radius * x,
        11 + radius * y
      );

      const c =
        active === null ||
        active === k
          ? GREEN
          : C.muted;

      items.push(arrow(
        p,
        q,
        c,
        active === k ? 4.0 : 2.8
      ));

      if (
        active === null ||
        active === k
      ) {
        items.push(txt(
          fmt(v, 1),
          18,
          c,
          [
            q[0] + x * 0.24,
            q[1] + y * 0.24,
            0
          ],
          true
        ));
      }
    });

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // MANY-KNOB MODEL
  // ------------------------------------------------------------

  function modelPicture(
    large = false
  ) {
    const cy = P
      ? -0.65
      : -0.38;

    const w = 5.45;
    const h = P ? 3.80 : 2.85;

    const items = [
      rounded(
        w,
        h,
        [
          CX,
          cy,
          0
        ],
        C.muted
      ),

      txt(
        large
          ? 'LARGE NONLINEAR MODEL'
          : 'STRAIGHT-LINE MODEL',
        20,
        C.ink,
        [
          CX,
          cy + h / 2 - 0.31,
          0
        ],
        true,
        w - 0.25
      )
    ];

    if (!large) {
      const xs = [
        CX - 1.20,
        CX + 1.20
      ];

      const labels = [
        'step price',
        'middle rent'
      ];

      const colors = [
        C.cyan,
        VIOLET
      ];

      for (let k = 0; k < 2; k++) {
        const p = [
          xs[k],
          cy + 0.10,
          0
        ];

        const r = new M.Circle({
          radius: 0.53,
          color: colors[k],
          strokeWidth: 2.6
        });

        r.setFill(C.card, 1);
        r.moveTo(p);

        items.push(r);

        items.push(line(
          p,
          [
            p[0] + 0.32,
            p[1] + 0.24,
            0
          ],
          colors[k],
          3.7
        ));

        items.push(txt(
          labels[k],
          18,
          colors[k],
          [
            xs[k],
            cy - 0.77,
            0
          ],
          false,
          2.30
        ));
      }
    } else {
      const cols = 5;
      const rows = 3;

      const pos = (
        row,
        col
      ) => [
        CX + (col - 2) * 0.93,
        cy + 0.59 -
          row * (P ? 0.85 : 0.64),
        0
      ];

      for (
        let col = 0;
        col < cols - 1;
        col++
      ) {
        for (
          let row = 0;
          row < rows;
          row++
        ) {
          for (
            let nextRow = 0;
            nextRow < rows;
            nextRow++
          ) {
            items.push(line(
              pos(row, col),
              pos(nextRow, col + 1),
              '#314B61',
              0.95
            ));
          }
        }
      }

      for (
        let col = 0;
        col < cols;
        col++
      ) {
        for (
          let row = 0;
          row < rows;
          row++
        ) {
          const p = pos(
            row,
            col
          );

          const r = new M.Circle({
            radius: 0.18,
            color: C.cyan,
            strokeWidth: 1.6
          });

          r.setFill(C.card, 1);
          r.moveTo(p);

          items.push(r);

          const a =
            (row + col) * 0.82;

          items.push(line(
            p,
            [
              p[0] +
                0.13 * Math.cos(a),

              p[1] +
                0.13 * Math.sin(a),

              0
            ],
            GOLD,
            2.1
          ));
        }
      }

      items.push(txt(
        'many connected adjustable numbers',
        16,
        C.muted,
        [
          CX,
          cy - h / 2 + 0.23,
          0
        ],
        false,
        w - 0.30
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // ILLUSTRATIVE NON-CONVEX LOSS
  // ------------------------------------------------------------

  // This is a separate illustrative loss function.
  // It is NOT the apartment-rent loss.
  //
  // f(x) = 0.45(x² − 3.24)² + 0.8x + 2.5
  //
  // Its derivative:
  // f'(x) = 1.8x(x² − 3.24) + 0.8
  //
  // It has two local minima with different loss values,
  // separated by a local maximum.
  //
  // The minima and descent path are calculated from the
  // actual illustrative function.

  const bumpyLoss = x =>
    0.45 * (x * x - 3.24) ** 2 +
    0.8 * x +
    2.5;

  const bumpySlope = x =>
    1.8 * x * (x * x - 3.24) +
    0.8;

  function bisectRoot(
    fn,
    a,
    b,
    iterations = 60
  ) {
    let fa = fn(a);
    let fb = fn(b);

    if (fa === 0) return a;
    if (fb === 0) return b;

    if (fa * fb > 0) {
      throw new Error(
        'Root must be bracketed'
      );
    }

    for (
      let k = 0;
      k < iterations;
      k++
    ) {
      const c =
        (a + b) / 2;

      const fc = fn(c);

      if (fa * fc <= 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }

    return (a + b) / 2;
  }

  const DEEP_DIP = bisectRoot(
    bumpySlope,
    -2.0,
    -1.4
  );

  const SHALLOW_DIP = bisectRoot(
    bumpySlope,
    1.4,
    2.0
  );

  const HUMP = bisectRoot(
    bumpySlope,
    0,
    0.5
  );

  const BUMPY_WALK = descentHistory(
    2.30,
    0.06,
    16,
    bumpyLoss,
    bumpySlope
  );

  function bumpyGraph(
    showPoints = false
  ) {
    const G = graph({
      xmin: -2.50,
      xmax: 2.50,
      ymin: 0,
      ymax: 9,
      xticks: [-2, -1, 0, 1, 2],
      yticks: [0, 2, 4, 6, 8],
      xlabel: 'model setting',
      ylabel: 'another loss function'
    });

    const items = [
      ...G.items,

      ...curveParts(
        G,
        bumpyLoss,
        G.xmin,
        G.xmax,
        C.cyan,
        130
      )
    ];

    if (showPoints) {
      items.push(
        glowDot(
          G.p(
            DEEP_DIP,
            bumpyLoss(DEEP_DIP)
          ),
          GREEN,
          0.10
        ),

        glowDot(
          G.p(
            SHALLOW_DIP,
            bumpyLoss(SHALLOW_DIP)
          ),
          GOLD,
          0.10
        )
      );
    }

    G.fn = bumpyLoss;

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  // ------------------------------------------------------------
  // TWO FLAT MINIMA
  // ------------------------------------------------------------

  function twoDipMarks(
    G,
    showTangents = true,
    showLabels = true
  ) {
    const a = G.p(
      DEEP_DIP,
      bumpyLoss(DEEP_DIP)
    );

    const b = G.p(
      SHALLOW_DIP,
      bumpyLoss(SHALLOW_DIP)
    );

    const items = [
      glowDot(
        a,
        GREEN,
        0.115
      ),

      glowDot(
        b,
        GOLD,
        0.115
      )
    ];

    if (showTangents) {
      items.push(
        tangent(
          G,
          DEEP_DIP,
          bumpyLoss,
          0,
          0.40,
          GREEN,
          4.0
        ),

        tangent(
          G,
          SHALLOW_DIP,
          bumpyLoss,
          0,
          0.40,
          GOLD,
          4.0
        )
      );

      items.push(
        txt(
          'slope 0',
          18,
          GREEN,
          [
            a[0] + 0.22,
            a[1] + 0.35,
            0
          ],
          true,
          1.50
        ),

        txt(
          'slope 0',
          18,
          GOLD,
          [
            b[0] - 0.20,
            b[1] + 0.35,
            0
          ],
          true,
          1.50
        )
      );
    }

    if (showLabels) {
      items.push(
        txt(
          'deep dip',
          17,
          GREEN,
          [
            a[0] + 0.24,
            a[1] - 0.34,
            0
          ],
          false,
          1.70
        ),

        txt(
          'shallow dip',
          17,
          GOLD,
          [
            b[0] - 0.24,
            b[1] - 0.34,
            0
          ],
          false,
          1.85
        )
      );
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // DESCENT INTO THE WRONG DIP
  // ------------------------------------------------------------

  function trappedWalkMarks(
    G,
    upto = 16,
    showStop = false
  ) {
    const items = [
      ...walkParts(
        G,
        BUMPY_WALK,
        upto,
        GOLD
      )
    ];

    const a = G.p(
      DEEP_DIP,
      bumpyLoss(DEEP_DIP)
    );

    const b = G.p(
      SHALLOW_DIP,
      bumpyLoss(SHALLOW_DIP)
    );

    items.push(glowDot(
      a,
      GREEN,
      0.09
    ));

    if (showStop) {
      items.push(
        ring(
          b,
          GOLD,
          0.23
        ),

        tangent(
          G,
          SHALLOW_DIP,
          bumpyLoss,
          0,
          0.40,
          GOLD,
          3.7
        ),

        txt(
          'stops here',
          18,
          GOLD,
          [
            b[0] - 0.35,
            b[1] + 0.42,
            0
          ],
          false,
          1.70
        ),

        txt(
          'lower loss exists',
          17,
          GREEN,
          [
            a[0] + 0.56,
            a[1] + 0.36,
            0
          ],
          false,
          2.10
        )
      );
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // LOCAL MINIMUM VERSUS GLOBAL MINIMUM
  // ------------------------------------------------------------

  function localGlobalMarks(G) {
    const a = G.p(
      DEEP_DIP,
      bumpyLoss(DEEP_DIP)
    );

    const b = G.p(
      SHALLOW_DIP,
      bumpyLoss(SHALLOW_DIP)
    );

    const items = [
      glowDot(
        a,
        GREEN,
        0.13
      ),

      glowDot(
        b,
        GOLD,
        0.13
      ),

      ring(
        a,
        GREEN,
        0.21
      ),

      ring(
        b,
        GOLD,
        0.21
      ),

      dash(
        a,
        [
          b[0],
          a[1],
          0
        ],
        GREEN,
        1.9
      ),

      arrow(
        [
          b[0],
          b[1] - 0.12,
          0
        ],
        [
          b[0],
          a[1] + 0.06,
          0
        ],
        PINK,
        3.0
      ),

      txt(
        'GLOBAL',
        18,
        GREEN,
        [
          a[0] + 0.32,
          a[1] + 0.36,
          0
        ],
        true
      ),

      txt(
        'LOCAL',
        18,
        GOLD,
        [
          b[0] - 0.28,
          b[1] + 0.36,
          0
        ],
        true
      ),

      txt(
        'lower loss',
        17,
        GREEN,
        [
          CX,
          a[1] - 0.29,
          0
        ]
      )
    ];

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // A ZERO SLOPE DOES NOT GUARANTEE A MINIMUM
  // ------------------------------------------------------------

  function stationaryMarks(G) {
    const states = [
      {
        x: DEEP_DIP,
        color: GREEN
      },
      {
        x: HUMP,
        color: PINK
      },
      {
        x: SHALLOW_DIP,
        color: GOLD
      }
    ];

    const items = [];

    states.forEach(q => {
      const p = G.p(
        q.x,
        bumpyLoss(q.x)
      );

      items.push(
        glowDot(
          p,
          q.color,
          0.11
        ),

        tangent(
          G,
          q.x,
          bumpyLoss,
          0,
          0.33,
          q.color,
          3.5
        ),

        txt(
          '0',
          20,
          q.color,
          [
            p[0],
            p[1] + 0.30,
            0
          ],
          true
        )
      );
    });

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // TRY IT PREVIEW CONTROL
  // ------------------------------------------------------------

  // These are drawn controls, not interactive DOM elements.
  // The live animation previews the requested exercise
  // without inventing an unsupported input-handler API.

  function stringControl(
    a,
    b,
    convexMode = true
  ) {
    const y = P
      ? -4.95
      : -2.78;

    const items = [];

    const x0 = CX - 2.42;
    const x1 = CX + 0.80;

    const min =
      convexMode ? 0 : -2.5;

    const max =
      convexMode ? 4 : 2.5;

    const X = x =>
      x0 +
      (x - min) / (max - min) *
      (x1 - x0);

    items.push(line(
      [x0, y, 0],
      [x1, y, 0],
      C.muted,
      3.4
    ));

    items.push(
      glowDot(
        [X(a), y, 0],
        GOLD,
        0.09
      ),

      glowDot(
        [X(b), y, 0],
        GOLD,
        0.09
      ),

      txt(
        `A ${fmt(a, 2)}`,
        15,
        GOLD,
        [
          X(a),
          y + 0.24,
          0
        ],
        true
      ),

      txt(
        `B ${fmt(b, 2)}`,
        15,
        GOLD,
        [
          X(b),
          y + 0.24,
          0
        ],
        true
      )
    );

    const p = [
      CX + 1.78,
      y,
      0
    ];

    items.push(
      rounded(
        1.57,
        0.40,
        p,
        C.cyan
      ),

      txt(
        convexMode
          ? 'CONVEX'
          : 'TWO DIPS',
        15,
        C.cyan,
        p,
        true,
        1.38
      )
    );

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // 0 — When gradient descent stops at a flat spot,
  // how do we know it is the lowest point?
  // ------------------------------------------------------------

  let G = bumpyGraph(false);

  await until(S(0));

  await play(
    ...picture(
      G.g,
      twoDipMarks(
        G,
        true,
        false
      )
    ),
    ...say(
      'FLAT GROUND: IS IT THE LOWEST POINT?',
      GOLD
    )
  );

  await until(S(0) + 3.0);

  await play(
    ...putMarks(
      twoDipMarks(
        G,
        true,
        true
      )
    ),
    ...fbox([
      'both dips are flat',
      ['but one is lower', GREEN],
      'how can we tell?'
    ], GOLD),
    ...say(
      'A SMALL DIP OR THE TRUE BOTTOM?',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 1 — Look closely at the familiar U.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  await until(S(1));

  await play(
    ...picture(G.g),
    ...clearBox(),
    ...say(
      'LOOK CLOSELY AT OUR U'
    )
  );

  // ------------------------------------------------------------
  // 2 — Middle rent stays at 10.
  // Loss values: 11, 5, 3, 5, 11.
  // ------------------------------------------------------------

  G = lossGraph(
    true,
    true
  );

  await until(S(2));

  await play(
    ...picture(G.g),
    ...fbox([
      ['middle rent = 10', C.muted],
      'step price: 0, 1, 2, 3, 4',
      ['loss: 11, 5, 3, 5, 11', C.cyan]
    ]),
    ...say(
      'THE SAME FIVE LOSS VALUES'
    )
  );

  // ------------------------------------------------------------
  // 3 — Read the slope of the U at each step price,
  // using the derivative rule.
  // ------------------------------------------------------------

  G = lossGraph(
    true,
    false
  );

  await until(S(3));

  await play(
    ...picture(
      G.g,
      slopeMarks(
        G,
        [0],
        0
      )
    ),
    ...fbox([
      'derivative rule',
      ['4 × (step price − 2)', GOLD]
    ], GOLD),
    ...say(
      'NOW READ THE SLOPE AT EACH POINT',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 4 — Slopes:
  // At 0: −8.
  // At 1: −4.
  // At 2: 0.
  // At 3: +4.
  // At 4: +8.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...putMarks(
      slopeMarks(
        G,
        [0],
        0
      )
    ),
    ...fbox([
      'step price = 0',
      '4 × (0 − 2)',
      ['slope = −8', GOLD]
    ], GOLD)
  );

  await until(S(4) + 1.55);

  await play(
    ...putMarks(
      slopeMarks(
        G,
        [0, 1],
        1
      )
    ),
    ...fbox([
      'step price = 1',
      '4 × (1 − 2)',
      ['slope = −4', GOLD]
    ], GOLD)
  );

  await until(S(4) + 3.10);

  await play(
    ...putMarks(
      slopeMarks(
        G,
        [0, 1, 2],
        2
      )
    ),
    ...fbox([
      'step price = 2',
      '4 × (2 − 2)',
      ['slope = 0', GREEN]
    ], GREEN)
  );

  await until(S(4) + 4.65);

  await play(
    ...putMarks(
      slopeMarks(
        G,
        [0, 1, 2, 3],
        3
      )
    ),
    ...fbox([
      'step price = 3',
      '4 × (3 − 2)',
      ['slope = +4', GOLD]
    ], GOLD)
  );

  await until(S(4) + 6.20);

  await play(
    ...putMarks(
      slopeMarks(
        G,
        [0, 1, 2, 3, 4],
        4
      )
    ),
    ...fbox([
      'step price = 4',
      '4 × (4 − 2)',
      ['slope = +8', GOLD]
    ], GOLD),
    ...say(
      'FIVE POINTS, FIVE SLOPE READINGS',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 5 — Look at how the slope changes as we move right.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...picture(
      slopeSequence(false)
    ),
    ...fbox([
      'move one step to the right',
      ['watch the slope itself', GOLD]
    ], GOLD),
    ...say(
      'HOW IS THE SLOPE CHANGING?',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 6 — −8, −4, 0, 4, 8.
  // The slope grows by four every time.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...putPicture(
      slopeSequence(true)
    ),
    ...fbox([
      '−8 → −4 → 0 → 4 → 8',
      ['+4 every time', GREEN]
    ], GREEN),
    ...say(
      'THE SLOPE INCREASES BY FOUR EACH TIME',
      GREEN
    )
  );

  await until(S(6) + 2.55);

  G = derivativeGraph(true);

  await play(
    ...picture(
      G.g,
      slopeChangeTriangle(
        G,
        1
      )
    ),
    ...fbox([
      ['step price change = +1', C.cyan],
      ['slope change = +4', GREEN]
    ], GREEN),
    ...say(
      'THE SLOPE ITSELF FORMS A RISING LINE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 7 — Steep downhill, then flat, then steep uphill.
  // ------------------------------------------------------------

  G = lossGraph(
    true,
    false
  );

  await until(S(7));

  await play(
    ...picture(
      G.g,
      slopeMarks(
        G,
        [0, 2, 4]
      )
    ),
    ...fbox([
      ['negative: downhill', C.cyan],
      ['zero: flat', GREEN],
      ['positive: uphill', PINK]
    ], GOLD),
    ...say(
      'DOWNHILL, FLAT, THEN UPHILL',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 8 — Name the rate of change of the slope:
  // curvature.
  // ------------------------------------------------------------

  G = derivativeGraph(true);

  await until(S(8));

  await play(
    ...picture(
      G.g,
      slopeChangeTriangle(
        G,
        1
      )
    ),
    ...fbox([
      ['CURVATURE', GREEN],
      'how fast the slope',
      'itself changes'
    ], GREEN),
    ...say(
      'CHANGE IN SLOPE IS CURVATURE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 9 — Slope increases by four per unit.
  // Curvature = 4, everywhere, positive.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...putMarks(
      slopeChangeTriangle(
        G,
        0
      )
    ),
    ...fbox([
      'curvature = change in slope',
      '          ÷ change in price',
      '          = 4 ÷ 1',
      ['          = 4', GREEN]
    ], GREEN),
    ...say(
      'FOUR MORE SLOPE UNITS FOR EACH PRICE UNIT',
      GREEN
    )
  );

  await until(S(9) + 2.60);

  await play(
    ...putMarks(
      slopeChangeTriangle(
        G,
        2
      )
    ),
    ...fbox([
      'another part of the curve',
      'same change: +4',
      ['curvature = 4', GREEN]
    ], GREEN)
  );

  await until(S(9) + 5.0);

  await play(
    ...putMarks(
      slopeChangeTriangle(
        G,
        3
      )
    ),
    ...say(
      'SAME CURVATURE AT EVERY POINT',
      GREEN
    )
  );

  await until(S(9) + 7.40);

  G = curvatureGraph();

  await play(
    ...picture(G.g),
    ...fbox([
      ['curvature = 4', GREEN],
      'constant everywhere',
      ['positive everywhere', GREEN]
    ], GREEN),
    ...say(
      'CURVATURE IS POSITIVE EVERYWHERE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 10 — Positive curvature bends upward,
  // like the inside of a bowl.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  await until(S(10));

  await play(
    ...picture(
      G.g,
      bowlMarks(G)
    ),
    ...fbox([
      ['positive curvature', GREEN],
      'slope increases to the right',
      'curve bends upward'
    ], GREEN),
    ...say(
      'POSITIVE CURVATURE MAKES A BOWL',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 11 — Pick any two points and stretch a straight
  // string between them.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...putMarks(
      stringMarks(
        G,
        0.6,
        3.2,
        {
          showShade: false,
          showString: false
        }
      )
    ),
    ...fbox([
      'pick two points',
      ['join them with a straight line', GOLD]
    ], GOLD),
    ...say(
      'PICK ANY TWO POINTS',
      GOLD
    )
  );

  await until(S(11) + 2.50);

  await play(
    ...putMarks(
      stringMarks(
        G,
        0.6,
        3.2,
        {
          showShade: false,
          showString: true
        }
      )
    ),
    ...say(
      'STRETCH A STRAIGHT STRING BETWEEN THEM',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 12 — Step prices 0 and 4 both have loss 11.
  // The string lies flat at height 11.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...putMarks(
      stringMarks(
        G,
        0,
        4,
        {
          showShade: false,
          showLabels: true
        }
      )
    ),
    ...fbox([
      'left point:  (0, 11)',
      'right point: (4, 11)',
      ['string height = 11', GOLD]
    ], GOLD),
    ...say(
      'THE STRING IS FLAT AT HEIGHT ELEVEN',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 13 — Under the string, the curve dips to loss 3,
  // at step price 2.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...putMarks(
      stringMarks(
        G,
        0,
        4,
        {
          showShade: true,
          showGap: true
        }
      )
    ),
    ...fbox([
      ['string at middle = 11', GOLD],
      ['curve at middle = 3', C.cyan],
      ['curve lies below the string', GREEN]
    ], GREEN),
    ...say(
      'THE CURVE DIPS BELOW THE STRING',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 14 — Other pairs also pass the string test.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...putMarks(
      stringMarks(
        G,
        0,
        2,
        {
          showShade: true
        }
      )
    ),
    ...fbox([
      'try another pair',
      ['string stays above the curve', GREEN]
    ], GREEN),
    ...say(
      'TRY DIFFERENT ENDPOINTS',
      GOLD
    )
  );

  await until(S(14) + 1.40);

  await play(
    ...putMarks(
      stringMarks(
        G,
        1,
        4,
        {
          showShade: true
        }
      )
    )
  );

  await until(S(14) + 2.80);

  await play(
    ...putMarks(
      stringMarks(
        G,
        2.2,
        3.8,
        {
          showShade: true
        }
      )
    ),
    ...say(
      'EVERY STRING STAYS ON OR ABOVE THE CURVE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 15 — Name this property: convexity.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...putMarks(
      stringMarks(
        G,
        0.5,
        3.6,
        {
          showShade: true,
          showGap: true
        }
      )
    ),
    ...fbox([
      ['CONVEX', GOLD],
      'every straight string',
      'lies on or above the curve'
    ], GOLD),
    ...say(
      'THIS IS A CONVEX CURVE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 16 — Our strictly convex U has exactly one bottom.
  //
  // General convexity guarantees that local minima are
  // global, but does not require a unique minimum.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...putMarks(
      minimumMarks(
        G,
        false
      )
    ),
    ...fbox([
      'our U curves upward strictly',
      ['one unique bottom', GREEN],
      'no other local minimum'
    ], GREEN),
    ...say(
      'OUR CONVEX BOWL HAS ONE BOTTOM',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 17 — Slope rises steadily from negative to positive.
  // It crosses zero once, at step price 2.
  // ------------------------------------------------------------

  G = derivativeGraph(true);

  await until(S(17));

  await play(
    ...picture(
      G.g,
      derivativeSignMarks(G)
    ),
    ...fbox([
      ['before 2: slope < 0', C.cyan],
      ['at 2: slope = 0', GREEN],
      ['after 2: slope > 0', PINK]
    ], GOLD),
    ...say(
      'THE SLOPE CROSSES ZERO ONLY ONCE',
      GREEN
    )
  );

  await until(S(17) + 3.70);

  G = lossGraph(
    false,
    false
  );

  await play(
    ...picture(
      G.g,
      minimumMarks(G)
    ),
    ...fbox([
      'derivative = 4 × (s − 2)',
      '4 × (s − 2) = 0',
      ['s = 2', GREEN]
    ], GREEN),
    ...say(
      'ONE FLAT SPOT AT STEP PRICE TWO',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 18 — That single flat spot is the global minimum.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...putMarks(
      minimumMarks(
        G,
        true
      )
    ),
    ...fbox([
      ['GLOBAL MINIMUM', GREEN],
      'step price = 2',
      'loss = 3',
      'lowest on the whole curve'
    ], GREEN),
    ...say(
      'THIS IS THE GLOBAL MINIMUM',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 19 — Global means lowest anywhere,
  // not merely lowest nearby.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...putMarks(
      minimumMarks(
        G,
        true
      )
    ),
    ...fbox([
      ['GLOBAL', GREEN],
      'lowest anywhere',
      'not just lowest nearby'
    ], GREEN),
    ...say(
      'NO OTHER POINT HAS A LOWER LOSS',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 20 — On this convex curve, gradient descent cannot
  // stop at a non-global minimum.
  //
  // Use a suitable learning rate.
  // Convexity alone does not prevent oversized updates.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...putMarks(
      twoWalks(
        G,
        3
      )
    ),
    ...fbox([
      'start from either side',
      'learning rate = 0.1',
      ['both walks approach the bottom', GREEN]
    ], GREEN),
    ...say(
      'BOTH DOWNHILL WALKS HEAD TO THE SAME BOTTOM',
      GREEN
    )
  );

  await until(S(20) + 1.70);

  await play(
    ...putMarks(
      twoWalks(
        G,
        12
      )
    ),
    ...fbox([
      'if descent reaches zero slope',
      ['it has found a global minimum', GREEN],
      'use a suitable learning rate'
    ], GREEN)
  );

  // ------------------------------------------------------------
  // 21 — Free both knobs again.
  // The full loss map is also a bowl.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...picture(
      mapPicture()
    ),
    ...fbox([
      ['step price can move', C.cyan],
      ['middle rent can move', VIOLET],
      'one two-dimensional bowl'
    ]),
    ...say(
      'FREE BOTH ADJUSTABLE NUMBERS AGAIN'
    )
  );

  // ------------------------------------------------------------
  // 22 — Only bottom:
  // step price 2, middle rent 11, loss 0.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...putMarks(
      mapMinimumMarks()
    ),
    ...fbox([
      'step price = 2',
      'middle rent = 11',
      ['loss = 0', GREEN]
    ], GREEN),
    ...say(
      'THE FULL BOWL HAS ONE TRUE BOTTOM',
      GREEN
    )
  );

  await until(S(22) + 2.60);

  let R = rentGraph(
    2,
    11
  );

  await play(
    ...picture(R.g),
    ...fbox([
      'guesses: 9, 11, 13',
      'misses:  0, 0, 0',
      ['loss = 0', GREEN]
    ], GREEN),
    ...say(
      'THE PERFECT RENT LINE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 23 — The walls are not equally steep.
  //
  // Increasing middle rent by 1 changes every prediction.
  // Increasing step price by 1 leaves the middle unchanged.
  // Therefore loss rises faster along middle rent.
  // ------------------------------------------------------------

  await until(S(23));

  R = rentGraph(
    2,
    12,
    [2, 11],
    true
  );

  await play(
    ...picture(R.g),
    ...fbox([
      'middle rent: 11 → 12',
      ['changes: +1, +1, +1', VIOLET],
      'all three guesses move'
    ], VIOLET),
    ...say(
      'RAISING MIDDLE RENT MOVES EVERY GUESS',
      VIOLET
    )
  );

  await until(S(23) + 2.65);

  await play(
    ...picture(
      guessChangePicture('middle')
    ),
    ...fbox([
      'new misses: +1, +1, +1',
      'loss = 1 + 1 + 1',
      ['= 3', VIOLET]
    ], VIOLET)
  );

  await until(S(23) + 4.80);

  R = rentGraph(
    3,
    11,
    [2, 11],
    true
  );

  await play(
    ...picture(R.g),
    ...fbox([
      'step price: 2 → 3',
      ['changes: −1, 0, +1', C.cyan],
      'middle guess stays fixed'
    ]),
    ...say(
      'CHANGING STEP PRICE DOES NOT MOVE THE MIDDLE'
    )
  );

  await until(S(23) + 7.0);

  await play(
    ...picture(
      guessChangePicture('step')
    ),
    ...fbox([
      'new misses: −1, 0, +1',
      'loss = 1 + 0 + 1',
      ['= 2', C.cyan]
    ])
  );

  await until(S(23) + 8.85);

  G = slicesGraph(2);

  await play(
    ...picture(
      G.g,
      sliceComparisonMarks(G)
    ),
    ...fbox([
      'same distance from optimum',
      ['step price: loss 2', C.cyan],
      ['middle rent: loss 3', VIOLET]
    ], GOLD),
    ...say(
      'LOSS CLIMBS FASTER ALONG MIDDLE RENT',
      VIOLET
    )
  );

  // ------------------------------------------------------------
  // 24 — Middle-rent curvature = 6.
  // Step-price curvature = 4.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...picture(
      curvatureComparison()
    ),
    ...fbox([
      ['middle rent: 6', VIOLET],
      ['step price: 4', C.cyan],
      'different wall steepness'
    ], GOLD),
    ...say(
      'CURVATURE SIX VERSUS FOUR',
      GOLD
    )
  );

  await until(S(24) + 2.65);

  G = slicesGraph(2);

  await play(
    ...picture(
      G.g,
      sliceComparisonMarks(G)
    ),
    ...fbox([
      ['middle-rent slice: 3d²', VIOLET],
      ['step-price slice: 2d²', C.cyan],
      'd = distance from optimum'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 25 — Contour rings are ovals, not circles.
  // Wider along step price, narrower along middle rent.
  // Still one bowl with one bottom.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...picture(
      mapPicture(),
      ovalMarks(6)
    ),
    ...fbox([
      ['wider: step price', C.cyan],
      ['narrower: middle rent', VIOLET],
      'oval contour rings'
    ], GOLD),
    ...say(
      'THE BOWL IS STRETCHED INTO OVALS',
      GOLD
    )
  );

  await until(S(25) + 3.05);

  await play(
    ...putMarks(
      mapMinimumMarks()
    ),
    ...fbox([
      'different curvatures',
      'same single bowl',
      ['one global minimum', GREEN]
    ], GREEN),
    ...say(
      'STILL ONLY ONE BOTTOM',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 26 — Curvature is the derivative of the derivative.
  // Also called the second derivative.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...picture(
      derivativeChain(0)
    ),
    ...fbox([
      'loss = 3 + 2(s − 2)²'
    ]),
    ...say(
      'START WITH THE LOSS FUNCTION'
    )
  );

  await until(S(26) + 1.80);

  await play(
    ...putPicture(
      derivativeChain(1)
    ),
    ...fbox([
      'first derivative',
      ['= 4(s − 2)', GOLD]
    ], GOLD),
    ...say(
      'FIRST DERIVATIVE: THE SLOPE',
      GOLD
    )
  );

  await until(S(26) + 3.60);

  await play(
    ...putPicture(
      derivativeChain(2)
    ),
    ...fbox([
      ['SECOND DERIVATIVE', GREEN],
      'derivative of 4(s − 2)',
      ['= 4', GREEN]
    ], GREEN),
    ...say(
      'SECOND DERIVATIVE: THE CURVATURE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 27 — Slope tells which way is down.
  // Curvature tells how the slope changes.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...picture(
      slopeCurvaturePicture()
    ),
    ...fbox([
      ['slope: which way is down?', GOLD],
      ['curvature: how is slope', GREEN],
      ['changing?', GREEN]
    ], GOLD),
    ...say(
      'SLOPE AND CURVATURE ANSWER DIFFERENT QUESTIONS',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 28 — For a smooth loss on a convex domain,
  // nonnegative curvature in every direction means convexity.
  //
  // Our full quadratic has strictly positive curvature
  // in every nonzero direction.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...picture(
      mapPicture(),
      directionalCurvatureMarks()
    ),
    ...fbox([
      'CONVEX LOSS',
      'curvature never negative',
      ['in every direction', GREEN]
    ], GREEN),
    ...say(
      'CHECK CURVATURE IN EVERY DIRECTION',
      GREEN
    )
  );

  await until(S(28) + 2.50);

  await play(
    ...putMarks(
      directionalCurvatureMarks(1)
    ),
    ...fbox([
      'our bowl',
      'directional curvature',
      ['always between 4 and 6', GREEN]
    ], GREEN),
    ...say(
      'EVERY DIRECTION CURVES UPWARD',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 29 — On a convex differentiable loss, any stationary
  // point is a global minimum.
  //
  // Reaching flat ground is the condition; convergence
  // also requires a suitable optimization method.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  await until(S(29));

  await play(
    ...picture(
      G.g,
      twoWalks(
        G,
        4
      )
    ),
    ...fbox([
      'convex loss',
      'walk downhill',
      'approach zero slope'
    ], GOLD),
    ...say(
      'CONVEXITY MAKES THE FLAT SPOT TRUSTWORTHY',
      GREEN
    )
  );

  await until(S(29) + 3.10);

  await play(
    ...putMarks(
      minimumMarks(
        G,
        true
      )
    ),
    ...fbox([
      'when slope reaches zero',
      ['global minimum found', GREEN],
      'no worse local minimum'
    ], GREEN),
    ...say(
      'FLAT GROUND MEANS THE BEST LOSS',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 30 — Straight-line models with squared-error loss
  // have convex loss functions.
  //
  // A unique solution requires sufficient independent
  // information in the data, as our example has.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...picture(
      modelPicture(false)
    ),
    ...fbox([
      'straight-line model',
      'scored by squared misses',
      ['convex loss', GREEN]
    ], GREEN),
    ...say(
      'SQUARED-MISS LINE FITTING HAS CONVEX LOSS',
      GREEN
    )
  );

  await until(S(30) + 3.30);

  await play(
    ...picture(
      mapPicture(),
      mapMinimumMarks()
    ),
    ...fbox([
      'our three apartments',
      'unique best-fit line',
      ['no competing local minima', GREEN]
    ], GREEN),
    ...say(
      'THAT IS WHY FITTING THIS LINE IS RELIABLE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 31 — Trap:
  // Many large modern models have non-convex loss functions.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...picture(
      modelPicture(true)
    ),
    ...fbox([
      ['TRAP', PINK],
      'large nonlinear models',
      'many linked operations',
      'loss may not be convex'
    ], PINK),
    ...say(
      'LARGE MODELS NEED NOT HAVE CONVEX LOSSES',
      PINK
    )
  );

  await until(S(31) + 3.80);

  G = bumpyGraph(false);

  await play(
    ...picture(G.g),
    ...fbox([
      'another loss function',
      ['not one simple bowl', PINK]
    ], PINK),
    ...say(
      'THE LOSS LANDSCAPE CAN BE BUMPY',
      PINK
    )
  );

  // ------------------------------------------------------------
  // 32 — Picture two dips:
  // one shallow and one deep.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...putMarks(
      twoDipMarks(
        G,
        false,
        true
      )
    ),
    ...fbox([
      ['deep dip', GREEN],
      ['shallow dip', GOLD],
      'different loss values'
    ], GOLD),
    ...say(
      'TWO DIPS AT DIFFERENT HEIGHTS',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 33 — Each dip has a flat bottom.
  // Both have slope zero.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...putMarks(
      twoDipMarks(
        G,
        true,
        true
      )
    ),
    ...fbox([
      'deep dip: slope = 0',
      'shallow dip: slope = 0',
      ['both are flat', GOLD]
    ], GOLD),
    ...say(
      'TWO DIFFERENT FLAT BOTTOMS',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 34 — Descent can stop in the shallow dip and
  // never reach the deeper one.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...putMarks(
      trappedWalkMarks(
        G,
        0,
        false
      )
    ),
    ...fbox([
      'start on the right-hand wall',
      'take downhill updates'
    ], GOLD),
    ...say(
      'START ON THE SHALLOW-DIP SIDE',
      GOLD
    )
  );

  await until(S(34) + 1.45);

  await play(
    ...putMarks(
      trappedWalkMarks(
        G,
        3,
        false
      )
    )
  );

  await until(S(34) + 2.85);

  await play(
    ...putMarks(
      trappedWalkMarks(
        G,
        16,
        true
      )
    ),
    ...fbox([
      'gradient approaches zero',
      'walk settles in shallow dip',
      ['a lower loss still exists', GREEN]
    ], GOLD),
    ...say(
      'DESCENT CAN GET STUCK IN THE HIGHER DIP',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 35 — Local minimum:
  // lowest nearby, but not lowest overall.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...putMarks(
      localGlobalMarks(G)
    ),
    ...fbox([
      ['LOCAL MINIMUM', GOLD],
      'lowest nearby',
      ['GLOBAL MINIMUM', GREEN],
      'lowest anywhere'
    ], GOLD),
    ...say(
      'LOCAL IS NOT ALWAYS GLOBAL',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 36 — A slope of zero only means stationary ground.
  // Convexity guarantees a stationary point is globally
  // minimizing.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...putMarks(
      stationaryMarks(G)
    ),
    ...fbox([
      'slope = 0 means flat',
      'could be a dip or a peak',
      ['not necessarily best', PINK]
    ], PINK),
    ...say(
      'ZERO SLOPE ALONE IS NOT ENOUGH',
      PINK
    )
  );

  await until(S(36) + 2.90);

  G = lossGraph(
    false,
    false
  );

  await play(
    ...picture(
      G.g,
      minimumMarks(
        G,
        true
      )
    ),
    ...fbox([
      'convexity + zero slope',
      ['global minimum', GREEN]
    ], GREEN),
    ...say(
      'CONVEXITY MAKES FLAT GROUND A GLOBAL MINIMUM',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 37 — Try it preview:
  // drag two points and check whether the string remains
  // on or above the curve.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  let control = stringControl(
    0.2,
    3.8,
    true
  );

  await until(S(37));

  await play(
    ...picture(
      G.g,
      stringMarks(
        G,
        0.2,
        3.8,
        {
          showShade: true,
          showLabels: false
        }
      )
    ),
    new M.FadeIn(control),
    ...fbox([
      ['TRY IT', GOLD],
      'move both endpoints',
      ['does the string stay above?', GREEN]
    ], GOLD),
    ...say(
      'DRAG TWO POINTS AND TEST THE STRING',
      GOLD
    )
  );

  await until(S(37) + 1.45);

  let nextControl = stringControl(
    0.8,
    2.7,
    true
  );

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),
    ...putMarks(
      stringMarks(
        G,
        0.8,
        2.7,
        {
          showShade: true,
          showLabels: false
        }
      )
    )
  );

  control = nextControl;

  await until(S(37) + 2.90);

  nextControl = stringControl(
    1.9,
    3.9,
    true
  );

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),
    ...putMarks(
      stringMarks(
        G,
        1.9,
        3.9,
        {
          showShade: true,
          showLabels: false
        }
      )
    ),
    ...fbox([
      'different endpoints',
      ['string still stays above', GREEN]
    ], GREEN),
    ...say(
      'OUR BOWL PASSES EVERY STRING TEST',
      GREEN
    )
  );

  control = nextControl;

  // ------------------------------------------------------------
  // 38 — Switch to the two-dip curve.
  // Find a starting point where descent reaches the wrong dip.
  //
  // Preview the failed string test, then leave the descent
  // starting-point challenge to the learner.
  // ------------------------------------------------------------

  G = bumpyGraph(false);

  await until(S(38));

  await play(
    new M.FadeOut(control),
    ...picture(
      G.g,
      stringMarks(
        G,
        DEEP_DIP,
        SHALLOW_DIP,
        {
          fn: bumpyLoss,
          showShade: true,
          showLabels: false,
          testFailure: true
        }
      )
    ),
    ...fbox([
      'two-dip curve',
      ['curve rises above string', PINK],
      'not convex'
    ], PINK),
    ...say(
      'THE TWO-DIP CURVE FAILS THE STRING TEST',
      PINK
    )
  );

  await until(S(38) + 2.50);

  const challengeMarks = new M.VGroup(
    txt(
      '?',
      32,
      GOLD,
      [
        G.X(-1.10),
        G.Y(7.4),
        0
      ]
    ),

    txt(
      '?',
      32,
      GOLD,
      [
        G.X(1.10),
        G.Y(7.4),
        0
      ]
    )
  );

  await play(
    ...putMarks(challengeMarks),
    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'choose a starting point',
      'can descent stop',
      ['in the higher dip?', PINK]
    ], GOLD),
    ...say(
      'FIND A START THAT LEADS TO THE WRONG DIP',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 39 — Recap:
  //
  // Curvature measures the change in slope.
  // Convexity means every chord lies on or above the curve.
  // Convex minima are global.
  // Our strictly convex quadratic has one unique minimum.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...picture(
      derivativeChain(2)
    ),
    ...fbox([
      ['CURVATURE', GREEN],
      'change in slope',
      'second derivative',
      ['our U: curvature = 4', GREEN]
    ], GREEN),
    ...say(
      'CURVATURE MEASURES HOW THE SLOPE CHANGES',
      GREEN
    )
  );

  await until(S(39) + 2.60);

  G = lossGraph(
    false,
    false
  );

  await play(
    ...picture(
      G.g,
      stringMarks(
        G,
        0,
        4,
        {
          showShade: true,
          showGap: true,
          showLabels: false
        }
      )
    ),
    ...fbox([
      ['CONVEXITY', GOLD],
      'every string lies',
      ['on or above the curve', GREEN]
    ], GOLD),
    ...say(
      'CONVEX LOSS PASSES THE STRING TEST',
      GOLD
    )
  );

  await until(S(39) + 5.15);

  await play(
    ...picture(
      mapPicture(),
      mapMinimumMarks()
    ),
    ...fbox([
      'our strictly convex bowl',
      ['one global minimum', GREEN],
      'step price 2, middle rent 11',
      ['loss = 0', GREEN]
    ], GREEN),
    ...say(
      'ONE BOWL, ONE TRUE BOTTOM',
      GREEN
    )
  );

  await until(E(39));
}
