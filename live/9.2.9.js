// lesson 9.2.9
// Integrals — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: apartment rent, middle rent fixed at 10.
//
// Browser rendering and playback have not been tested against
// the actual engine. The Try it sequences are animated previews,
// without unsupported browser input handlers.

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
  const START = 0;
  const END = 2;

  const loss = s =>
    3 + 2 * (s - 2) ** 2;

  const slope = s =>
    4 * (s - 2);

  const prediction = s =>
    STEPS.map(x => MIDDLE + s * x);

  const misses = s =>
    prediction(s).map(
      (v, k) => v - RENTS[k]
    );

  const squares = s =>
    misses(s).map(v => v * v);

  const exactChange = (a, b) =>
    loss(b) - loss(a);

  // ------------------------------------------------------------
  // RIEMANN SUMS
  // ------------------------------------------------------------

  // The narration uses the slope at the START of each piece.
  //
  // For a piece from a to b:
  //
  // width = b − a
  // height = slope(a)
  // signed contribution = height × width
  //
  // A negative slope gives a negative contribution.
  // A positive slope gives a positive contribution.

  function makePieces(
    start,
    end,
    width,
    sample = 'left'
  ) {
    if (
      width <= 0 ||
      end < start
    ) {
      throw new Error(
        'Invalid integral interval or piece width'
      );
    }

    const result = [];

    const count = Math.ceil(
      (end - start) / width - 1e-10
    );

    for (let k = 0; k < count; k++) {
      const a =
        start + k * width;

      const b = Math.min(
        end,
        start + (k + 1) * width
      );

      const w = b - a;

      if (w <= 1e-10) {
        continue;
      }

      const x =
        sample === 'midpoint'
          ? (a + b) / 2
          : sample === 'right'
            ? b
            : a;

      const h = slope(x);

      result.push({
        k,
        a,
        b,
        width: w,
        sample: x,
        height: h,
        contribution: h * w
      });
    }

    return result;
  }

  function pieceTotal(pieces) {
    return pieces.reduce(
      (sum, q) =>
        sum + q.contribution,
      0
    );
  }

  const HALF = makePieces(
    0,
    2,
    0.5
  );

  const TENTH = makePieces(
    0,
    2,
    0.1
  );

  const HUNDREDTH = makePieces(
    0,
    2,
    0.01
  );

  const MIDPOINT = makePieces(
    0,
    2,
    0.5,
    'midpoint'
  );

  // Checked chapter results:
  //
  // Width 0.5:
  // slopes        = −8, −6, −4, −2
  // contributions = −4, −3, −2, −1
  // total         = −10
  //
  // Width 0.1:
  // 20 pieces, total = −8.4
  //
  // Width 0.01:
  // 200 pieces, total = −8.04
  //
  // Midpoint sampling with width 0.5:
  // slopes        = −7, −5, −3, −1
  // contributions = −3.5, −2.5, −1.5, −0.5
  // total         = −8 exactly for this linear slope.
  //
  // Exact integral from 0 to 2:
  // −8.
  //
  // Exact integral from 2 to 4:
  // +8.
  //
  // Exact integral from 0 to 4:
  // −8 + 8 = 0.
  //
  // Total absolute change from 0 to 4:
  // 8 + 8 = 16.
  //
  // The signed integral is the net change, not the
  // total absolute change.

  const fmt = (n, places = 4) => {
    const rounded = Number(
      n.toFixed(places)
    );

    return String(
      Object.is(rounded, -0)
        ? 0
        : rounded
    ).replace('-', '−');
  };

  const signed = (n, places = 4) => {
    const rounded = Number(
      n.toFixed(places)
    );

    return rounded > 0
      ? `+${fmt(rounded, places)}`
      : fmt(rounded, places);
  };

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

  const GY0 = P ? -4.0 : -2.08;
  const GY1 = P ? 1.18 : 1.04;

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

    r.setFill(
      color,
      opacity
    );

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

    r.setFill(
      C.card,
      opacity
    );

    r.moveTo(p);

    return r;
  }

  function circle(
    p,
    radius,
    color,
    opacity = 0,
    width = 2
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: width
    });

    r.setFill(
      color,
      opacity
    );

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

    outer.setFill(
      color,
      0.10
    );

    const inner = dot(
      p,
      color,
      radius * 1.70
    );

    inner.setFill(
      color,
      0.22
    );

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
    return circle(
      p,
      radius,
      color,
      0,
      2.5
    );
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

    const len = Math.hypot(
      dx,
      dy
    );

    if (len < 0.00001) {
      return ring(
        a,
        color,
        0.065
      );
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

  function bracket(
    a,
    b,
    label,
    color = GOLD,
    labelOffset = 0.23
  ) {
    const horizontal =
      Math.abs(b[0] - a[0]) >=
      Math.abs(b[1] - a[1]);

    const dx =
      horizontal ? 0 : 0.09;

    const dy =
      horizontal ? 0.09 : 0;

    const midpoint = [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      0
    ];

    const labelPoint = [
      midpoint[0] +
        (horizontal ? 0 : -labelOffset),

      midpoint[1] +
        (horizontal ? labelOffset : 0),

      0
    ];

    return new M.VGroup(
      line(a, b, color, 2.1),

      line(
        [a[0] - dx, a[1] - dy, 0],
        [a[0] + dx, a[1] + dy, 0],
        color,
        2.1
      ),

      line(
        [b[0] - dx, b[1] - dy, 0],
        [b[0] + dx, b[1] + dy, 0],
        color,
        2.1
      ),

      txt(
        label,
        18,
        color,
        labelPoint,
        true,
        2.25
      )
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

  // Main picture and temporary overlays stay separate.
  // Every VGroup is created from fresh objects.
  // No VGroup.shift or regrouping of on-screen objects.
  // All calls to play() are sequential and awaited.

  let pictureNow = null;
  let marksNow = null;

  function putPicture(g) {
    const a = [];

    if (pictureNow) {
      a.push(
        new M.FadeOut(pictureNow)
      );
    }

    if (g) {
      a.push(
        new M.FadeIn(g)
      );
    }

    pictureNow = g;

    return a;
  }

  function putMarks(g) {
    const a = [];

    if (marksNow) {
      a.push(
        new M.FadeOut(marksNow)
      );
    }

    if (g) {
      a.push(
        new M.FadeIn(g)
      );
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
    ylabel,
    zeroLine = false
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
        v === 0
          ? C.ink
          : C.muted,
        [GX0 - 0.32, Y(v), 0],
        true,
        0.70
      ));
    });

    items.push(
      line(
        [GX0, GY0, 0],
        [GX1 + 0.08, GY0, 0],
        C.muted,
        2.2
      ),

      line(
        [GX0, GY0, 0],
        [GX0, GY1 + 0.08, 0],
        C.muted,
        2.2
      ),

      txt(
        xlabel,
        18,
        C.muted,
        [CX, GY0 - 0.61, 0],
        false,
        5.30
      ),

      txt(
        ylabel,
        18,
        C.muted,
        [CX, GY1 + 0.29, 0],
        false,
        5.30
      )
    );

    if (
      zeroLine &&
      ymin <= 0 &&
      ymax >= 0
    ) {
      items.push(line(
        [GX0, Y(0), 0],
        [GX1, Y(0), 0],
        C.ink,
        2.6
      ));
    }

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
        '#22475A',
        6.5
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
  // SPEEDOMETER INTRODUCTION
  // ------------------------------------------------------------

  function speedometer(
    center,
    speed = 60,
    radius = 1.15
  ) {
    const items = [];

    items.push(circle(
      center,
      radius,
      C.cyan,
      0.06,
      2.8
    ));

    items.push(circle(
      center,
      radius * 0.89,
      C.muted,
      0,
      1.3
    ));

    const angle = v =>
      Math.PI * 1.20 -
      Math.PI * 1.40 * v / 120;

    const polar = (r, a) => [
      center[0] + r * Math.cos(a),
      center[1] + r * Math.sin(a),
      0
    ];

    for (let v = 0; v <= 120; v += 10) {
      const a = angle(v);

      const major =
        v % 30 === 0;

      items.push(line(
        polar(
          radius *
          (major ? 0.73 : 0.80),
          a
        ),

        polar(
          radius * 0.87,
          a
        ),

        major
          ? C.ink
          : C.muted,

        major ? 2.5 : 1.4
      ));

      if (major) {
        items.push(txt(
          String(v),
          15,
          C.ink,
          polar(
            radius * 0.58,
            a
          ),
          true,
          0.48
        ));
      }
    }

    items.push(arrow(
      center,
      polar(
        radius * 0.72,
        angle(speed)
      ),
      GOLD,
      3.7,
      0.10
    ));

    items.push(glowDot(
      center,
      GOLD,
      0.075
    ));

    items.push(txt(
      `${speed}`,
      32,
      GOLD,
      [
        center[0],
        center[1] - radius * 0.40,
        0
      ],
      true
    ));

    items.push(txt(
      'km/h',
      16,
      C.muted,
      [
        center[0],
        center[1] - radius * 0.66,
        0
      ],
      true
    ));

    return new M.VGroup(
      ...items
    );
  }

  function carIcon(
    p,
    scale = 1,
    color = GOLD
  ) {
    const q = (x, y) => [
      p[0] + scale * x,
      p[1] + scale * y,
      0
    ];

    const items = [];

    items.push(rect(
      0.92 * scale,
      0.30 * scale,
      q(0, 0),
      color,
      0.34,
      2.1
    ));

    items.push(
      line(
        q(-0.34, 0.15),
        q(-0.15, 0.36),
        color,
        2.5
      ),

      line(
        q(-0.15, 0.36),
        q(0.21, 0.36),
        color,
        2.5
      ),

      line(
        q(0.21, 0.36),
        q(0.39, 0.15),
        color,
        2.5
      )
    );

    items.push(
      circle(
        q(-0.29, -0.19),
        0.105 * scale,
        C.ink,
        1,
        1.5
      ),

      circle(
        q(0.29, -0.19),
        0.105 * scale,
        C.ink,
        1,
        1.5
      )
    );

    items.push(
      dot(
        q(0.46, 0.04),
        C.ink,
        0.055 * scale
      )
    );

    return new M.VGroup(
      ...items
    );
  }

  function roadPicture(
    speed = 60,
    progress = 0.20
  ) {
    const cy = P
      ? -0.75
      : -0.38;

    const roadY = P
      ? -3.20
      : -1.78;

    const left = CX - 2.55;
    const right = CX + 2.55;

    const items = [];

    items.push(rect(
      5.10,
      0.64,
      [
        CX,
        roadY,
        0
      ],
      C.muted,
      0.14,
      1.5
    ));

    for (let k = 0; k < 8; k++) {
      const x =
        left + 0.32 + k * 0.63;

      items.push(line(
        [x - 0.16, roadY, 0],
        [x + 0.16, roadY, 0],
        C.muted,
        1.9
      ));
    }

    items.push(carIcon(
      [
        left +
          0.50 +
          (right - left - 1) *
          progress,

        roadY + 0.10,

        0
      ],
      0.83
    ));

    items.push(speedometer(
      [
        CX,
        cy + (P ? 0.45 : 0.34),
        0
      ],
      speed,
      P ? 1.32 : 1.10
    ));

    items.push(txt(
      'distance travelled: ?',
      19,
      C.muted,
      [
        CX,
        roadY - 0.52,
        0
      ],
      true,
      5.15
    ));

    // Faint strips suggest that the distant view is obscured.

    for (let k = 0; k < 3; k++) {
      const y =
        cy + 0.75 -
        k * 0.35;

      items.push(line(
        [
          CX - 2.60,
          y,
          0
        ],
        [
          CX - 1.58,
          y,
          0
        ],
        '#35465C',
        5.0
      ));

      items.push(line(
        [
          CX + 1.58,
          y,
          0
        ],
        [
          CX + 2.60,
          y,
          0
        ],
        '#35465C',
        5.0
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // ADD SPEED × TIME
  // ------------------------------------------------------------

  // Illustrative car trip, independent of the rent example.
  //
  // Three one-minute intervals:
  //
  // 30 km/h × 1/60 h = 0.5 km
  // 60 km/h × 1/60 h = 1 km
  // 90 km/h × 1/60 h = 1.5 km
  //
  // Total distance = 3 km.

  function speedTimePicture(
    reveal = 3,
    showTotal = true
  ) {
    const speeds = [30, 60, 90];

    const base = P
      ? -3.10
      : -1.92;

    const maxH = P
      ? 3.75
      : 2.50;

    const bw = 1.35;

    const items = [];

    items.push(line(
      [
        CX - 2.55,
        base,
        0
      ],
      [
        CX + 2.55,
        base,
        0
      ],
      C.ink,
      2.3
    ));

    speeds.forEach((v, k) => {
      const x =
        CX + (k - 1) * bw;

      const h =
        maxH * v / 90;

      const c =
        k < reveal
          ? C.cyan
          : C.muted;

      items.push(rect(
        bw - 0.025,
        h,
        [
          x,
          base + h / 2,
          0
        ],
        c,
        k < reveal ? 0.53 : 0.10,
        1.5
      ));

      items.push(txt(
        `${v} km/h`,
        17,
        c,
        [
          x,
          base + h + 0.24,
          0
        ],
        true,
        bw - 0.07
      ));

      items.push(txt(
        '1 min',
        16,
        C.muted,
        [
          x,
          base - 0.25,
          0
        ],
        true
      ));

      if (k < reveal) {
        items.push(txt(
          `${fmt(v / 60)} km`,
          21,
          GOLD,
          [
            x,
            base + h / 2,
            0
          ],
          true,
          bw - 0.10
        ));
      }
    });

    if (showTotal) {
      items.push(txt(
        '0.5 + 1 + 1.5 = 3 km',
        22,
        GREEN,
        [
          CX,
          base - 0.70,
          0
        ],
        true,
        5.20
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // FROM LOSS TO SLOPE, AND BACK
  // ------------------------------------------------------------

  function transformationPicture(
    reverse = false
  ) {
    const cy = P
      ? -0.65
      : -0.36;

    const xs = [
      CX - 1.45,
      CX + 1.45
    ];

    const w = 2.65;
    const h = P ? 3.35 : 2.85;

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
          ? C.cyan
          : GOLD
      ));
    }

    items.push(txt(
      'LOSS',
      20,
      C.cyan,
      [
        xs[0],
        cy + h / 2 - 0.32,
        0
      ],
      true
    ));

    items.push(txt(
      'SLOPE',
      20,
      GOLD,
      [
        xs[1],
        cy + h / 2 - 0.32,
        0
      ],
      true
    ));

    const U = t => [
      xs[0] + t * 0.94,
      cy - 0.55 + 1.20 * t * t,
      0
    ];

    for (let k = 0; k < 40; k++) {
      const a =
        -1 + 2 * k / 40;

      const b =
        -1 + 2 * (k + 1) / 40;

      items.push(line(
        U(a),
        U(b),
        C.cyan,
        3.1
      ));
    }

    items.push(line(
      [
        xs[1] - 0.94,
        cy - 0.67,
        0
      ],
      [
        xs[1] + 0.94,
        cy + 0.67,
        0
      ],
      GOLD,
      3.6
    ));

    items.push(line(
      [
        xs[1] - 1.02,
        cy,
        0
      ],
      [
        xs[1] + 1.02,
        cy,
        0
      ],
      C.muted,
      1.3
    ));

    const y =
      cy - h / 2 - 0.31;

    const a = [
      xs[0] + 0.44,
      y,
      0
    ];

    const b = [
      xs[1] - 0.44,
      y,
      0
    ];

    items.push(
      reverse
        ? arrow(b, a, GOLD, 3.3)
        : arrow(a, b, GOLD, 3.3)
    );

    items.push(txt(
      reverse
        ? 'recover the change'
        : 'take the derivative',
      18,
      GOLD,
      [
        CX,
        y - 0.34,
        0
      ],
      false,
      5.15
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // RENT-VERSUS-SIZE GRAPH
  // ------------------------------------------------------------

  function rentGraph(
    s = 0,
    showOld = false
  ) {
    const G = graph({
      xmin: -1.5,
      xmax: 1.5,
      ymin: 7,
      ymax: 15,
      xticks: [-1, 0, 1],
      yticks: [8, 10, 12, 14],
      xlabel: 'size step',
      ylabel: 'rent (hundreds of dollars)'
    });

    const items = [
      ...G.items
    ];

    if (showOld) {
      items.push(dash(
        G.p(-1.16, 10),
        G.p(1.16, 10),
        C.muted,
        2.1
      ));
    }

    items.push(line(
      G.p(
        -1.16,
        MIDDLE - s * 1.16
      ),

      G.p(
        1.16,
        MIDDLE + s * 1.16
      ),

      GOLD,
      4.3
    ));

    const guesses =
      prediction(s);

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
        19,
        COLORS[k],
        [
          a[0] - 0.32,
          a[1] + 0.17,
          0
        ],
        true
      ));

      items.push(dot(
        b,
        GOLD,
        0.075
      ));

      items.push(txt(
        fmt(guesses[k]),
        17,
        GOLD,
        [
          b[0] + 0.35,
          b[1] - 0.22,
          0
        ],
        true
      ));
    });

    items.push(rounded(
      2.95,
      0.40,
      [GX0 + 1.62, GY1 - 0.18, 0],
      GOLD
    ));

    items.push(txt(
      'middle rent fixed at 10',
      16,
      GOLD,
      [
        GX0 + 1.62,
        GY1 - 0.18,
        0
      ],
      true,
      2.75
    ));

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  // ------------------------------------------------------------
  // LOSS CURVE
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
        G.xmax,
        C.cyan,
        90
      )
    ];

    if (showPoints) {
      for (let s = 0; s <= 4; s++) {
        const p = G.p(
          s,
          loss(s)
        );

        items.push(glowDot(
          p,
          C.cyan,
          0.085
        ));

        if (showValues) {
          items.push(txt(
            fmt(loss(s)),
            19,
            C.cyan,
            [
              p[0],
              p[1] + 0.28,
              0
            ],
            true
          ));
        }
      }
    }

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  function lossWalkMarks(
    G,
    end = 2,
    showChange = false
  ) {
    const items = [];

    const n = 48;

    for (let k = 0; k < n; k++) {
      const a =
        end * k / n;

      const b =
        end * (k + 1) / n;

      items.push(line(
        G.p(a, loss(a)),
        G.p(b, loss(b)),
        GOLD,
        4.2
      ));
    }

    const a = G.p(
      0,
      loss(0)
    );

    const b = G.p(
      end,
      loss(end)
    );

    items.push(
      glowDot(
        a,
        GOLD,
        0.12
      ),

      glowDot(
        b,
        GREEN,
        0.12
      ),

      dash(
        G.p(0, 0),
        a,
        GOLD,
        1.6
      ),

      dash(
        G.p(end, 0),
        b,
        GREEN,
        1.6
      )
    );

    items.push(txt(
      `start: ${fmt(loss(0))}`,
      18,
      GOLD,
      [
        a[0] + 0.55,
        a[1] + 0.25,
        0
      ],
      true,
      1.65
    ));

    items.push(txt(
      `end: ${fmt(loss(end))}`,
      18,
      GREEN,
      [
        b[0] +
          (end >= 3.5 ? -0.55 : 0.58),
        b[1] + 0.28,
        0
      ],
      true,
      1.65
    ));

    if (
      showChange &&
      Math.abs(
        exactChange(0, end)
      ) > 0.0001
    ) {
      const x =
        Math.min(
          G.xmax - 0.30,
          end + 0.72
        );

      items.push(
        dash(
          a,
          G.p(x, loss(0)),
          C.muted,
          1.7
        ),

        dash(
          b,
          G.p(x, loss(end)),
          C.muted,
          1.7
        ),

        arrow(
          G.p(x, loss(0)),
          G.p(x, loss(end)),
          VIOLET,
          3.6
        ),

        txt(
          signed(
            exactChange(0, end)
          ),
          23,
          VIOLET,
          [
            G.X(x) + 0.30,
            (
              G.Y(loss(0)) +
              G.Y(loss(end))
            ) / 2,
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
  // THE LOSS IS HIDDEN
  // ------------------------------------------------------------

  function hiddenLossPicture() {
    const cy = P
      ? -0.70
      : -0.36;

    const w = 5.35;

    const items = [
      rounded(
        w,
        P ? 3.65 : 2.90,
        [CX, cy, 0],
        C.muted
      ),

      txt(
        'LOSS VALUES HIDDEN',
        20,
        C.muted,
        [
          CX,
          cy + (P ? 1.42 : 1.08),
          0
        ],
        true,
        w - 0.30
      )
    ];

    const a = [
      CX - 1.55,
      cy + 0.22,
      0
    ];

    const b = [
      CX + 1.55,
      cy + 0.22,
      0
    ];

    items.push(
      rounded(
        1.72,
        1.02,
        a,
        C.muted
      ),

      rounded(
        1.72,
        1.02,
        b,
        C.muted
      ),

      txt(
        '?',
        36,
        C.ink,
        a
      ),

      txt(
        '?',
        36,
        C.ink,
        b
      ),

      arrow(
        [
          a[0] + 0.89,
          a[1],
          0
        ],
        [
          b[0] - 0.89,
          b[1],
          0
        ],
        GOLD,
        3.0
      )
    );

    items.push(
      txt(
        'step price 0',
        16,
        C.muted,
        [
          a[0],
          a[1] - 0.78,
          0
        ],
        true
      ),

      txt(
        'step price 2',
        16,
        C.muted,
        [
          b[0],
          b[1] - 0.78,
          0
        ],
        true
      )
    );

    items.push(txt(
      'only the slope rule is known',
      19,
      GOLD,
      [
        CX,
        cy - (P ? 1.40 : 1.06),
        0
      ],
      false,
      w - 0.30
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // SLOPE GRAPH
  // ------------------------------------------------------------

  // This is NOT the loss curve.
  //
  // Horizontal axis: step price.
  // Vertical axis: slope of the loss.
  //
  // On the interval 0 to 2, the slope is negative.
  // On the interval 2 to 4, the slope is positive.

  function slopeGraph(
    full = false,
    drawSlope = true,
    showEndpoints = false
  ) {
    const G = graph({
      xmin: full ? -0.20 : -0.10,
      xmax: full ? 4.20 : 2.10,

      ymin: -9,
      ymax: full ? 9 : 1.6,

      xticks: full
        ? [0, 1, 2, 3, 4]
        : [0, 0.5, 1, 1.5, 2],

      yticks: full
        ? [-8, -4, 0, 4, 8]
        : [-8, -6, -4, -2, 0],

      xlabel: 'step price',
      ylabel: 'slope of the loss',
      zeroLine: true
    });

    const items = [
      ...G.items
    ];

    if (drawSlope) {
      const end =
        full ? 4 : 2;

      items.push(
        line(
          G.p(0, -8),
          G.p(end, slope(end)),
          '#59492E',
          7
        ),

        line(
          G.p(0, -8),
          G.p(end, slope(end)),
          GOLD,
          3.8
        )
      );

      if (showEndpoints) {
        items.push(
          glowDot(
            G.p(0, -8),
            GOLD,
            0.11
          ),

          glowDot(
            G.p(2, 0),
            GREEN,
            0.11
          )
        );

        items.push(txt(
          '−8',
          21,
          GOLD,
          [
            G.X(0) + 0.48,
            G.Y(-8) - 0.02,
            0
          ],
          true
        ));

        items.push(txt(
          '0',
          21,
          GREEN,
          [
            G.X(2) + 0.30,
            G.Y(0) - 0.08,
            0
          ],
          true
        ));

        if (full) {
          items.push(
            glowDot(
              G.p(4, 8),
              GOLD,
              0.11
            ),

            txt(
              '+8',
              21,
              GOLD,
              [
                G.X(4) - 0.30,
                G.Y(8) - 0.23,
                0
              ],
              true
            )
          );
        }
      }
    }

    G.full = full;

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  function zeroLine(G) {
    return line(
      G.p(G.xmin, 0),
      G.p(G.xmax, 0),
      C.ink,
      2.8
    );
  }

  function slopeLine(
    G,
    start = 0,
    end = 2,
    color = GOLD,
    width = 3.8
  ) {
    return line(
      G.p(start, slope(start)),
      G.p(end, slope(end)),
      color,
      width
    );
  }

  // ------------------------------------------------------------
  // PARTITION THE INTERVAL
  // ------------------------------------------------------------

  function partitionMarks(
    G,
    width = 0.5,
    end = 2
  ) {
    const pieces = makePieces(
      0,
      end,
      width
    );

    const items = [];

    pieces.forEach((q, k) => {
      const a = G.p(
        q.a,
        0
      );

      const b = G.p(
        q.b,
        0
      );

      items.push(line(
        [
          a[0],
          a[1] - 0.10,
          0
        ],
        [
          a[0],
          a[1] + 0.10,
          0
        ],
        C.cyan,
        2.5
      ));

      items.push(line(
        [
          a[0] + 0.025,
          a[1] + 0.15,
          0
        ],
        [
          b[0] - 0.025,
          b[1] + 0.15,
          0
        ],
        k % 2 === 0
          ? C.cyan
          : VIOLET,
        4.0
      ));

      if (pieces.length <= 5) {
        items.push(txt(
          fmt(q.width),
          18,
          C.cyan,
          [
            (a[0] + b[0]) / 2,
            a[1] + 0.38,
            0
          ],
          true
        ));
      }
    });

    const p = G.p(
      end,
      0
    );

    items.push(line(
      [
        p[0],
        p[1] - 0.10,
        0
      ],
      [
        p[0],
        p[1] + 0.10,
        0
      ],
      C.cyan,
      2.5
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // ONE PIECE: WIDTH × SLOPE
  // ------------------------------------------------------------

  // Each bar extends from zero to its signed slope height.
  //
  // Negative bars hang down from zero.
  // Positive bars rise upward from zero.
  //
  // A bar's unsigned geometric area is:
  // abs(height) × width.
  //
  // The accumulated change uses:
  // height × width.

  function pieceBar(
    G,
    q,
    color,
    opacity = 0.52,
    border = true
  ) {
    const w =
      Math.abs(
        G.X(q.b) - G.X(q.a)
      );

    const h =
      Math.abs(
        G.Y(q.height) - G.Y(0)
      );

    if (h < 0.000001) {
      return line(
        G.p(q.a, 0),
        G.p(q.b, 0),
        color,
        1.6
      );
    }

    const sw =
      border
        ? w < 0.06
          ? 0.35
          : 1.5
        : 0;

    return rect(
      w,
      h,
      [
        (G.X(q.a) + G.X(q.b)) / 2,
        (G.Y(0) + G.Y(q.height)) / 2,
        0
      ],
      color,
      opacity,
      sw
    );
  }

  function activePieceMarks(
    G,
    pieces,
    active,
    showPrevious = true,
    showContribution = true
  ) {
    const items = [];

    for (
      let k = 0;
      k <= active;
      k++
    ) {
      if (
        k < active &&
        !showPrevious
      ) {
        continue;
      }

      const q = pieces[k];

      items.push(pieceBar(
        G,
        q,
        k === active
          ? GOLD
          : C.cyan,
        k === active
          ? 0.57
          : 0.26,
        true
      ));

      if (
        showContribution &&
        k < active
      ) {
        items.push(txt(
          fmt(q.contribution),
          20,
          C.ink,
          [
            (
              G.X(q.a) +
              G.X(q.b)
            ) / 2,

            (
              G.Y(0) +
              G.Y(q.height)
            ) / 2,

            0
          ],
          true,
          Math.abs(
            G.X(q.b) -
            G.X(q.a)
          ) - 0.10
        ));
      }
    }

    items.push(
      zeroLine(G),
      slopeLine(G)
    );

    const q = pieces[active];

    const a = G.p(
      q.a,
      q.height
    );

    const b = G.p(
      q.b,
      q.height
    );

    items.push(
      glowDot(
        a,
        GOLD,
        0.11
      ),

      line(
        a,
        b,
        GOLD,
        3.2
      ),

      dash(
        G.p(q.a, 0),
        a,
        GOLD,
        1.8
      )
    );

    items.push(bracket(
      [
        G.X(q.a),
        G.Y(0) + 0.16,
        0
      ],

      [
        G.X(q.b),
        G.Y(0) + 0.16,
        0
      ],

      fmt(q.width),
      C.cyan,
      0.22
    ));

    if (showContribution) {
      items.push(txt(
        fmt(q.contribution),
        29,
        C.ink,
        [
          (
            G.X(q.a) +
            G.X(q.b)
          ) / 2,

          (
            G.Y(0) +
            G.Y(q.height)
          ) / 2,

          0
        ],
        true,
        Math.abs(
          G.X(q.b) -
          G.X(q.a)
        ) - 0.14
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // A SINGLE RECTANGLE, ENLARGED
  // ------------------------------------------------------------

  function pieceGeometry(
    height = -8,
    width = 0.5,
    reveal = 2
  ) {
    const cy = P
      ? -0.75
      : -0.35;

    const x0 = CX - 0.95;
    const x1 = CX + 0.95;

    const zeroY =
      cy + (P ? 1.30 : 1.10);

    const bottomY =
      cy - (P ? 1.55 : 1.18);

    const color =
      height < 0
        ? C.cyan
        : GREEN;

    const items = [];

    items.push(line(
      [
        CX - 2.55,
        zeroY,
        0
      ],
      [
        CX + 2.55,
        zeroY,
        0
      ],
      C.ink,
      2.6
    ));

    items.push(txt(
      '0',
      19,
      C.ink,
      [
        CX - 2.72,
        zeroY,
        0
      ],
      true
    ));

    items.push(rect(
      x1 - x0,
      zeroY - bottomY,
      [
        CX,
        (zeroY + bottomY) / 2,
        0
      ],
      color,
      0.50,
      2.3
    ));

    items.push(bracket(
      [
        x0,
        bottomY - 0.20,
        0
      ],

      [
        x1,
        bottomY - 0.20,
        0
      ],

      `width ${fmt(width)}`,
      C.cyan,
      -0.28
    ));

    if (reveal >= 1) {
      items.push(arrow(
        [
          x0 - 0.43,
          zeroY,
          0
        ],

        [
          x0 - 0.43,
          bottomY,
          0
        ],

        GOLD,
        3.2
      ));

      items.push(txt(
        `slope ${fmt(height)}`,
        18,
        GOLD,
        [
          x0 - 0.89,
          (zeroY + bottomY) / 2,
          0
        ],
        true,
        1.48
      ));
    }

    if (reveal >= 2) {
      items.push(txt(
        fmt(height * width),
        36,
        C.ink,
        [
          CX,
          (zeroY + bottomY) / 2,
          0
        ],
        true
      ));

      items.push(txt(
        'change in loss',
        17,
        color,
        [
          CX,
          (zeroY + bottomY) / 2 - 0.48,
          0
        ],
        false,
        1.65
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // ALL BARS
  // ------------------------------------------------------------

  function allBars(
    G,
    pieces,
    options = {}
  ) {
    const {
      showLabels = false,
      showTotal = false,
      highlight = null,
      end = 2,
      opacity = 0.48
    } = options;

    const items = [];

    pieces.forEach((q, k) => {
      const color =
        highlight === k
          ? GOLD
          : q.height < 0
            ? C.cyan
            : GREEN;

      items.push(pieceBar(
        G,
        q,
        color,
        opacity,
        pieces.length <= 40
      ));

      if (
        showLabels &&
        pieces.length <= 8
      ) {
        const bw = Math.abs(
          G.X(q.b) -
          G.X(q.a)
        );

        items.push(txt(
          signed(q.contribution),
          23,
          C.ink,
          [
            (
              G.X(q.a) +
              G.X(q.b)
            ) / 2,

            (
              G.Y(0) +
              G.Y(q.height)
            ) / 2,

            0
          ],
          true,
          bw - 0.08
        ));
      }
    });

    items.push(
      zeroLine(G),
      slopeLine(
        G,
        0,
        end
      )
    );

    if (showTotal) {
      const y =
        GY0 - 0.98;

      if (P) {
        items.push(txt(
          `total = ${fmt(pieceTotal(pieces))}`,
          23,
          GOLD,
          [
            CX,
            y,
            0
          ],
          true,
          5.15
        ));
      }
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // ADD THE FOUR CONTRIBUTIONS
  // ------------------------------------------------------------

  function sumPicture(
    revealTotal = false
  ) {
    const cy = P
      ? -0.70
      : -0.34;

    const xs = [
      CX - 2.04,
      CX - 0.68,
      CX + 0.68,
      CX + 2.04
    ];

    const items = [];

    const width = 0.93;

    HALF.forEach((q, k) => {
      items.push(rounded(
        width,
        1.30,
        [
          xs[k],
          cy + 0.40,
          0
        ],
        C.cyan
      ));

      items.push(txt(
        `PIECE ${k + 1}`,
        14,
        C.muted,
        [
          xs[k],
          cy + 0.79,
          0
        ],
        true,
        width - 0.10
      ));

      items.push(txt(
        fmt(q.contribution),
        30,
        C.cyan,
        [
          xs[k],
          cy + 0.26,
          0
        ],
        true
      ));
    });

    for (let k = 0; k < 3; k++) {
      items.push(txt(
        '+',
        23,
        GOLD,
        [
          (
            xs[k] +
            xs[k + 1]
          ) / 2,
          cy + 0.39,
          0
        ]
      ));
    }

    if (revealTotal) {
      items.push(arrow(
        [
          CX,
          cy - 0.34,
          0
        ],
        [
          CX,
          cy - 0.82,
          0
        ],
        GOLD,
        3.0
      ));

      items.push(rounded(
        3.25,
        0.88,
        [
          CX,
          cy - 1.43,
          0
        ],
        GOLD
      ));

      items.push(txt(
        'TOTAL = −10',
        27,
        GOLD,
        [
          CX,
          cy - 1.43,
          0
        ],
        true,
        2.90
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // OVERCOUNT FROM LEFT-ENDPOINT SAMPLING
  // ------------------------------------------------------------

  // The slope rises across every piece.
  // A left-endpoint bar is more negative than the true slope
  // throughout the interior of that piece.
  //
  // The excess lies between:
  // the flat bottom of the bar and the rising slope line.
  //
  // Each half-width excess triangle has:
  // width = 0.5
  // height = 2
  // unsigned area = 0.5
  //
  // Four excess triangles = 2.
  //
  // Thus:
  // approximate total = −10
  // exact total       = −8.

  function overcountMarks(
    G,
    pieces = HALF,
    active = null
  ) {
    const items = [];

    pieces.forEach((q, k) => {
      items.push(pieceBar(
        G,
        q,
        C.cyan,
        0.28,
        true
      ));

      if (
        active !== null &&
        active !== k
      ) {
        return;
      }

      const n =
        pieces.length <= 5
          ? 15
          : 5;

      for (let j = 1; j < n; j++) {
        const x =
          q.a +
          q.width * j / n;

        const actual =
          slope(x);

        const h =
          q.height;

        items.push(line(
          G.p(x, h),
          G.p(x, actual),
          PINK,
          3.3
        ));
      }

      items.push(line(
        G.p(q.a, q.height),
        G.p(q.b, q.height),
        PINK,
        2.7
      ));

      items.push(line(
        G.p(q.b, q.height),
        G.p(q.b, slope(q.b)),
        PINK,
        2.7
      ));
    });

    items.push(
      zeroLine(G),
      slopeLine(G)
    );

    if (active !== null) {
      const q =
        pieces[active];

      const x =
        q.a + q.width * 0.75;

      const y =
        (
          q.height +
          slope(x)
        ) / 2;

      const start = [
        Math.min(
          GX1 - 0.40,
          G.X(x) + 0.75
        ),

        G.Y(y) + 0.45,

        0
      ];

      items.push(arrow(
        start,
        G.p(x, y),
        PINK,
        2.9
      ));

      items.push(txt(
        'extra area',
        17,
        PINK,
        [
          start[0],
          start[1] + 0.20,
          0
        ],
        false,
        1.55
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // MAGNIFIED SINGLE-PIECE ERROR
  // ------------------------------------------------------------

  function zoomPieceError() {
    const G = graph({
      xmin: -0.035,
      xmax: 0.55,
      ymin: -8.5,
      ymax: -5.3,
      xticks: [0, 0.25, 0.5],
      yticks: [-8, -7, -6],
      xlabel: 'first piece (zoomed)',
      ylabel: 'slope'
    });

    const items = [
      ...G.items
    ];

    const n = 45;

    for (let k = 0; k < n; k++) {
      const x =
        0.5 * (k + 0.5) / n;

      items.push(line(
        G.p(x, -8),
        G.p(x, slope(x)),
        PINK,
        3.0
      ));
    }

    items.push(
      line(
        G.p(0, -8),
        G.p(0.5, -8),
        C.cyan,
        4.0
      ),

      line(
        G.p(0, -8),
        G.p(0.5, -6),
        GOLD,
        4.0
      ),

      line(
        G.p(0.5, -8),
        G.p(0.5, -6),
        PINK,
        3.0
      )
    );

    items.push(
      glowDot(
        G.p(0, -8),
        GOLD,
        0.10
      ),

      glowDot(
        G.p(0.5, -6),
        GOLD,
        0.10
      )
    );

    items.push(txt(
      'bar uses −8 throughout',
      18,
      C.cyan,
      [
        CX,
        G.Y(-8) - 0.18,
        0
      ],
      false,
      4.80
    ));

    items.push(txt(
      'actual slope rises',
      18,
      GOLD,
      [
        CX - 0.30,
        G.Y(-6.0) + 0.32,
        0
      ],
      false,
      3.60
    ));

    items.push(txt(
      'overcount',
      22,
      PINK,
      [
        G.X(0.35),
        G.Y(-7.50),
        0
      ],
      false,
      2.0
    ));

    G.g = new M.VGroup(
      ...items
    );

    return G;
  }

  // ------------------------------------------------------------
  // CONVERGENCE OF THE SUMS
  // ------------------------------------------------------------

  function convergencePicture(
    reveal = 3,
    showLimit = false
  ) {
    const cy = P
      ? 0.45
      : 0.56;

    const rowH = P
      ? 0.92
      : 0.64;

    const widths = [
      0.5,
      0.1,
      0.01
    ];

    const sets = [
      HALF,
      TENTH,
      HUNDREDTH
    ];

    const items = [];

    const xs = [
      CX - 1.74,
      CX,
      CX + 1.74
    ];

    const headers = [
      'WIDTH',
      'PIECES',
      'TOTAL'
    ];

    headers.forEach((v, k) => {
      items.push(txt(
        v,
        16,
        C.muted,
        [
          xs[k],
          cy + rowH * 0.67,
          0
        ],
        true,
        1.55
      ));
    });

    for (let k = 0; k < reveal; k++) {
      const y =
        cy - k * rowH;

      const color =
        k === reveal - 1
          ? GOLD
          : C.cyan;

      items.push(rounded(
        5.50,
        rowH * 0.85,
        [
          CX,
          y,
          0
        ],
        color
      ));

      const values = [
        fmt(widths[k]),
        String(sets[k].length),
        fmt(pieceTotal(sets[k]))
      ];

      values.forEach((v, j) => {
        items.push(txt(
          v,
          24,
          j === 2
            ? color
            : C.ink,
          [
            xs[j],
            y,
            0
          ],
          true,
          1.53
        ));
      });
    }

    if (showLimit) {
      const y =
        cy - 3 * rowH - 0.34;

      items.push(arrow(
        [
          CX,
          y + 0.70,
          0
        ],
        [
          CX,
          y + 0.35,
          0
        ],
        GREEN,
        3.2
      ));

      items.push(rounded(
        5.15,
        0.67,
        [
          CX,
          y - 0.08,
          0
        ],
        GREEN
      ));

      items.push(txt(
        'LIMIT = −8',
        26,
        GREEN,
        [
          CX,
          y - 0.08,
          0
        ],
        true,
        4.85
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // THE EXACT SIGNED AREA
  // ------------------------------------------------------------

  // The slope is linear, so the exact regions are triangles.
  //
  // The shading uses thin rectangular strips sampled at their
  // midpoints as a visual rendering technique.
  //
  // The boundary is the exact slope line, and the numerical
  // area is computed analytically, not from pixel shading.

  function exactAreaParts(
    G,
    start,
    end,
    color,
    opacity = 0.54
  ) {
    if (end <= start) {
      return [];
    }

    const n = Math.max(
      24,
      Math.round(
        48 * (end - start)
      )
    );

    const width =
      (end - start) / n;

    const pieces = makePieces(
      start,
      end,
      width,
      'midpoint'
    );

    const items = [];

    pieces.forEach(q => {
      items.push(pieceBar(
        G,
        q,
        color,
        opacity,
        false
      ));
    });

    return items;
  }

  function triangleMarks(
    G,
    options = {}
  ) {
    const {
      start = 0,
      end = 2,
      dimensions = false,
      showArea = true,
      color = C.cyan,
      showSign = true
    } = options;

    const items = [
      ...exactAreaParts(
        G,
        start,
        end,
        color
      )
    ];

    items.push(
      zeroLine(G),

      slopeLine(
        G,
        start,
        end
      )
    );

    const a = G.p(
      start,
      slope(start)
    );

    const b = G.p(
      end,
      slope(end)
    );

    items.push(
      glowDot(
        a,
        GOLD,
        0.09
      ),

      glowDot(
        b,
        GOLD,
        0.09
      )
    );

    if (dimensions) {
      const baseY =
        G.Y(0) + 0.16;

      items.push(bracket(
        [
          G.X(start),
          baseY,
          0
        ],

        [
          G.X(end),
          baseY,
          0
        ],

        fmt(end - start),
        GOLD,
        0.24
      ));

      if (start === 0 && end === 2) {
        const x =
          G.X(start) + 0.18;

        items.push(arrow(
          [
            x,
            G.Y(0) - 0.07,
            0
          ],

          [
            x,
            G.Y(-8) + 0.07,
            0
          ],

          C.ink,
          2.6
        ));

        items.push(txt(
          '8',
          22,
          C.ink,
          [
            x + 0.23,
            (
              G.Y(0) +
              G.Y(-8)
            ) / 2,
            0
          ],
          true
        ));
      }

      if (start === 2 && end === 4) {
        const x =
          G.X(end) - 0.18;

        items.push(arrow(
          [
            x,
            G.Y(0) + 0.07,
            0
          ],

          [
            x,
            G.Y(8) - 0.07,
            0
          ],

          C.ink,
          2.6
        ));

        items.push(txt(
          '8',
          22,
          C.ink,
          [
            x - 0.24,
            (
              G.Y(0) +
              G.Y(8)
            ) / 2,
            0
          ],
          true
        ));
      }
    }

    if (showArea) {
      const total =
        exactChange(start, end);

      const centerX =
        start === 0 &&
        end === 2
          ? 0.67
          : start === 2 &&
            end === 4
            ? 3.33
            : (start + end) / 2;

      const centerY =
        start === 0 &&
        end === 2
          ? -2.35
          : start === 2 &&
            end === 4
            ? 2.35
            : slope(centerX) * 0.50;

      items.push(txt(
        showSign
          ? signed(total)
          : fmt(Math.abs(total)),
        35,
        C.ink,
        G.p(
          centerX,
          centerY
        ),
        true,
        1.50
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // TRIANGLE AREA FORMULA
  // ------------------------------------------------------------

  // A geometric construction independent of graph aspect ratio.
  //
  // Rectangle: base 2 × height 8.
  // Triangle: half the rectangle.
  //
  // This is an enlarged illustrative geometry picture.

  function triangleGeometry(
    reveal = 2
  ) {
    const cy = P
      ? -0.70
      : -0.38;

    const w = 3.50;

    const h = P
      ? 3.50
      : 2.35;

    const left =
      CX - w / 2;

    const right =
      CX + w / 2;

    const top =
      cy + h / 2;

    const bottom =
      cy - h / 2;

    const A = [
      left,
      top,
      0
    ];

    const B = [
      right,
      top,
      0
    ];

    const D = [
      left,
      bottom,
      0
    ];

    const items = [];

    items.push(rect(
      w,
      h,
      [
        CX,
        cy,
        0
      ],
      C.muted,
      0.10,
      2.0
    ));

    const n = 65;

    for (let k = 0; k < n; k++) {
      const t =
        (k + 0.5) / n;

      const x =
        left + t * w;

      const y =
        bottom + t * h;

      items.push(line(
        [x, y, 0],
        [x, top, 0],
        '#337C91',
        3.0
      ));
    }

    items.push(
      line(A, B, C.ink, 2.7),
      line(A, D, C.ink, 2.7),
      line(D, B, GOLD, 3.8)
    );

    items.push(bracket(
      [
        left,
        top + 0.14,
        0
      ],

      [
        right,
        top + 0.14,
        0
      ],

      '2',
      GOLD,
      0.22
    ));

    items.push(bracket(
      [
        left - 0.16,
        bottom,
        0
      ],

      [
        left - 0.16,
        top,
        0
      ],

      '8',
      GOLD,
      0.25
    ));

    if (reveal >= 1) {
      items.push(txt(
        'half',
        23,
        C.ink,
        [
          left + w * 0.32,
          top - h * 0.30,
          0
        ],
        false
      ));

      items.push(txt(
        '2 × 8 = 16',
        18,
        C.muted,
        [
          left + w * 0.68,
          bottom + h * 0.23,
          0
        ],
        true,
        w * 0.62
      ));
    }

    if (reveal >= 2) {
      items.push(txt(
        'area = 8',
        26,
        GREEN,
        [
          left + w * 0.32,
          top - h * 0.48,
          0
        ],
        true,
        2.25
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // CHECK THE ORIGINAL LOSS VALUES
  // ------------------------------------------------------------

  function lossCheckPicture(
    reveal = 2,
    showDifference = false
  ) {
    const base = P
      ? -3.30
      : -2.02;

    const maxH = P
      ? 4.05
      : 2.64;

    const xs = [
      CX - 1.22,
      CX + 1.22
    ];

    const vals = [
      loss(0),
      loss(2)
    ];

    const cols = [
      GOLD,
      GREEN
    ];

    const items = [];

    items.push(line(
      [
        CX - 2.55,
        base,
        0
      ],
      [
        CX + 2.55,
        base,
        0
      ],
      C.ink,
      2.3
    ));

    for (let k = 0; k < reveal; k++) {
      const h =
        maxH * vals[k] / 11;

      items.push(rect(
        1.32,
        h,
        [
          xs[k],
          base + h / 2,
          0
        ],
        cols[k],
        0.65,
        2.0
      ));

      items.push(txt(
        String(vals[k]),
        29,
        cols[k],
        [
          xs[k],
          base + h + 0.27,
          0
        ],
        true
      ));

      items.push(txt(
        `step price ${k * 2}`,
        17,
        cols[k],
        [
          xs[k],
          base - 0.29,
          0
        ],
        true,
        2.20
      ));
    }

    if (showDifference) {
      const a = [
        CX + 0.17,
        base + maxH,
        0
      ];

      const b = [
        CX + 0.17,
        base + maxH * 3 / 11,
        0
      ];

      items.push(
        dash(
          [
            xs[0] + 0.69,
            a[1],
            0
          ],
          a,
          C.muted,
          1.6
        ),

        dash(
          b,
          [
            xs[1] - 0.68,
            b[1],
            0
          ],
          C.muted,
          1.6
        ),

        arrow(
          a,
          b,
          VIOLET,
          3.7
        ),

        txt(
          '−8',
          27,
          VIOLET,
          [
            a[0] + 0.39,
            (a[1] + b[1]) / 2,
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
  // TWO WAYS TO GET THE SAME ANSWER
  // ------------------------------------------------------------

  function equalityPicture(
    reveal = 2
  ) {
    const cy = P
      ? -0.65
      : -0.38;

    const xs = [
      CX - 1.47,
      CX + 1.47
    ];

    const w = 2.58;
    const h = P ? 3.15 : 2.65;

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
          ? C.cyan
          : GREEN
      ));
    }

    items.push(txt(
      'FROM SLOPE',
      18,
      C.cyan,
      [
        xs[0],
        cy + h / 2 - 0.30,
        0
      ],
      true,
      w - 0.20
    ));

    items.push(txt(
      'FROM LOSS',
      18,
      GREEN,
      [
        xs[1],
        cy + h / 2 - 0.30,
        0
      ],
      true,
      w - 0.20
    ));

    const x0 =
      xs[0] - 0.83;

    const x1 =
      xs[0] + 0.83;

    const top =
      cy + 0.40;

    const bottom =
      cy - 0.51;

    for (let k = 0; k < 30; k++) {
      const t =
        (k + 0.5) / 30;

      const x =
        x0 + t * (x1 - x0);

      items.push(line(
        [
          x,
          bottom +
            t * (top - bottom),
          0
        ],

        [
          x,
          top,
          0
        ],

        C.cyan,
        3.0
      ));
    }

    items.push(
      line(
        [x0, top, 0],
        [x1, top, 0],
        C.ink,
        2.0
      ),

      line(
        [x0, bottom, 0],
        [x1, top, 0],
        GOLD,
        2.8
      )
    );

    items.push(txt(
      '3 − 11',
      27,
      GREEN,
      [
        xs[1],
        cy + 0.02,
        0
      ],
      true,
      w - 0.20
    ));

    if (reveal >= 1) {
      items.push(txt(
        '−8',
        30,
        C.cyan,
        [
          xs[0],
          cy - h / 2 + 0.38,
          0
        ],
        true
      ));
    }

    if (reveal >= 2) {
      items.push(txt(
        '−8',
        30,
        GREEN,
        [
          xs[1],
          cy - h / 2 + 0.38,
          0
        ],
        true
      ));

      items.push(txt(
        '=',
        25,
        GOLD,
        [
          CX,
          cy,
          0
        ]
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // INTEGRAL NOTATION
  // ------------------------------------------------------------

  // Keep the visual meaning primary:
  //
  // integral sign = add up continuously
  // slope         = rate being accumulated
  // ds            = tiny step-price width
  // lower limit   = start
  // upper limit   = end

  function integralNotation(
    reveal = 3
  ) {
    const cy = P
      ? -0.55
      : -0.25;

    const items = [];

    const p = [
      CX - 1.55,
      cy + 0.27,
      0
    ];

    items.push(txt(
      '∫',
      P ? 66 : 62,
      GOLD,
      p
    ));

    items.push(txt(
      '2',
      20,
      GREEN,
      [
        p[0] + 0.35,
        p[1] + 0.70,
        0
      ],
      true
    ));

    items.push(txt(
      '0',
      20,
      GREEN,
      [
        p[0] - 0.12,
        p[1] - 0.68,
        0
      ],
      true
    ));

    items.push(txt(
      'slope(s)',
      29,
      C.cyan,
      [
        CX + 0.15,
        cy + 0.27,
        0
      ],
      true,
      2.50
    ));

    items.push(txt(
      'ds',
      27,
      VIOLET,
      [
        CX + 2.05,
        cy + 0.27,
        0
      ],
      true
    ));

    if (reveal >= 1) {
      items.push(txt(
        'add up',
        18,
        GOLD,
        [
          p[0],
          cy - 1.05,
          0
        ],
        false
      ));

      items.push(txt(
        'the rate',
        18,
        C.cyan,
        [
          CX + 0.15,
          cy - 1.05,
          0
        ],
        false
      ));

      items.push(txt(
        'tiny width',
        18,
        VIOLET,
        [
          CX + 2.05,
          cy - 1.05,
          0
        ],
        false,
        1.50
      ));
    }

    if (reveal >= 2) {
      items.push(txt(
        'start 0, end 2',
        18,
        GREEN,
        [
          CX,
          cy + 1.25,
          0
        ],
        true,
        5.20
      ));
    }

    if (reveal >= 3) {
      items.push(txt(
        '= −8',
        32,
        GREEN,
        [
          CX,
          cy - 1.78,
          0
        ],
        true
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // FUNDAMENTAL THEOREM PICTURE
  // ------------------------------------------------------------

  function theoremPicture() {
    const cy = P
      ? -0.75
      : -0.38;

    const p0 = [
      CX,
      cy + (P ? 1.20 : 0.86),
      0
    ];

    const p1 = [
      CX,
      cy - (P ? 1.40 : 1.05),
      0
    ];

    const items = [
      rounded(
        4.55,
        0.91,
        p0,
        C.cyan
      ),

      rounded(
        4.55,
        0.91,
        p1,
        GOLD
      ),

      txt(
        'LOSS FUNCTION',
        21,
        C.cyan,
        p0,
        true,
        4.20
      ),

      txt(
        'SLOPE FUNCTION',
        21,
        GOLD,
        p1,
        true,
        4.20
      )
    ];

    const downX =
      CX - 1.10;

    const upX =
      CX + 1.10;

    items.push(
      arrow(
        [
          downX,
          p0[1] - 0.48,
          0
        ],

        [
          downX,
          p1[1] + 0.48,
          0
        ],

        GOLD,
        3.3
      ),

      arrow(
        [
          upX,
          p1[1] + 0.48,
          0
        ],

        [
          upX,
          p0[1] - 0.48,
          0
        ],

        GREEN,
        3.3
      )
    );

    items.push(
      txt(
        'differentiate',
        17,
        GOLD,
        [
          downX - 0.79,
          cy - 0.08,
          0
        ],
        false,
        1.55
      ),

      txt(
        'integrate',
        17,
        GREEN,
        [
          upX + 0.78,
          cy - 0.08,
          0
        ],
        false,
        1.55
      ),

      txt(
        'recover change in loss',
        17,
        GREEN,
        [
          CX,
          p1[1] - 0.79,
          0
        ],
        false,
        5.10
      )
    );

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // GENERAL START-TO-END RULE
  // ------------------------------------------------------------

  function fundamentalFormulaPicture() {
    const cy = P
      ? -0.65
      : -0.38;

    const items = [];

    items.push(rounded(
      5.40,
      1.20,
      [
        CX,
        cy + 0.83,
        0
      ],
      C.cyan
    ));

    items.push(txt(
      '∫ slope(s) ds',
      32,
      C.cyan,
      [
        CX + 0.27,
        cy + 0.83,
        0
      ],
      true,
      4.0
    ));

    items.push(txt(
      'end',
      19,
      GOLD,
      [
        CX - 2.12,
        cy + 1.17,
        0
      ],
      true
    ));

    items.push(txt(
      'start',
      19,
      GOLD,
      [
        CX - 2.08,
        cy + 0.49,
        0
      ],
      true
    ));

    items.push(txt(
      '=',
      28,
      GOLD,
      [
        CX,
        cy - 0.15,
        0
      ]
    ));

    items.push(rounded(
      5.40,
      0.92,
      [
        CX,
        cy - 1.03,
        0
      ],
      GREEN
    ));

    items.push(txt(
      'loss(end) − loss(start)',
      26,
      GREEN,
      [
        CX,
        cy - 1.03,
        0
      ],
      true,
      5.05
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // MANY LITTLE CHANGES BECOME ONE WHOLE CHANGE
  // ------------------------------------------------------------

  function accumulationPicture() {
    const cy = P
      ? -0.65
      : -0.32;

    const left =
      CX - 2.30;

    const right =
      CX + 2.30;

    const n = 16;

    const items = [];

    for (let k = 0; k < n; k++) {
      const a =
        left + (right - left) * k / n;

      const b =
        left + (right - left) *
        (k + 1) / n;

      const x =
        (a + b) / 2;

      const h =
        0.36 +
        1.22 *
        (1 - k / n);

      items.push(rect(
        b - a - 0.025,
        h,
        [
          x,
          cy + 0.95 - h / 2,
          0
        ],
        C.cyan,
        0.50,
        1.0
      ));
    }

    items.push(txt(
      'many tiny changes',
      19,
      C.cyan,
      [
        CX,
        cy + 1.28,
        0
      ],
      false
    ));

    items.push(arrow(
      [
        CX,
        cy - 0.86,
        0
      ],
      [
        CX,
        cy - 1.27,
        0
      ],
      GOLD,
      3.3
    ));

    items.push(rounded(
      4.40,
      0.78,
      [
        CX,
        cy - 1.79,
        0
      ],
      GOLD
    ));

    items.push(txt(
      'THE WHOLE CHANGE',
      21,
      GOLD,
      [
        CX,
        cy - 1.79,
        0
      ],
      true,
      4.10
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // RATE INTO TOTAL
  // ------------------------------------------------------------

  function rateTotalPicture(
    mode = 'general'
  ) {
    const cy = P
      ? -0.70
      : -0.36;

    const xs = [
      CX - 1.48,
      CX + 1.48
    ];

    let leftTitle;
    let rightTitle;
    let leftDetail;
    let rightDetail;

    if (mode === 'speed') {
      leftTitle = 'SPEED';
      rightTitle = 'DISTANCE';
      leftDetail = 'km per hour';
      rightDetail = 'total km';
    } else if (mode === 'rain') {
      leftTitle = 'RAIN RATE';
      rightTitle = 'TOTAL RAIN';
      leftDetail = 'mm per hour';
      rightDetail = 'total mm';
    } else if (mode === 'probability') {
      leftTitle = 'DENSITY';
      rightTitle = 'PROBABILITY';
      leftDetail = 'curve height';
      rightDetail = 'area';
    } else {
      leftTitle = 'RATE';
      rightTitle = 'TOTAL';
      leftDetail = 'per unit';
      rightDetail = 'accumulated';
    }

    const items = [];

    for (let k = 0; k < 2; k++) {
      const c =
        k === 0
          ? C.cyan
          : GREEN;

      items.push(rounded(
        2.60,
        1.65,
        [
          xs[k],
          cy,
          0
        ],
        c
      ));

      items.push(txt(
        k === 0
          ? leftTitle
          : rightTitle,
        19,
        c,
        [
          xs[k],
          cy + 0.31,
          0
        ],
        true,
        2.35
      ));

      items.push(txt(
        k === 0
          ? leftDetail
          : rightDetail,
        18,
        C.ink,
        [
          xs[k],
          cy - 0.32,
          0
        ],
        false,
        2.30
      ));
    }

    items.push(arrow(
      [
        CX - 0.15,
        cy,
        0
      ],
      [
        CX + 0.15,
        cy,
        0
      ],
      GOLD,
      2.6,
      0.09
    ));

    items.push(txt(
      'INTEGRATE',
      21,
      GOLD,
      [
        CX,
        cy - 1.23,
        0
      ],
      true,
      5.20
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // RAINFALL EXAMPLE
  // ------------------------------------------------------------

  // Illustrative rates during three one-hour intervals.
  // 2 + 4 + 1 = 7 mm total rainfall.

  function rainfallPicture() {
    const G = graph({
      xmin: 0,
      xmax: 3,
      ymin: 0,
      ymax: 5,
      xticks: [0, 1, 2, 3],
      yticks: [0, 1, 2, 3, 4, 5],
      xlabel: 'time (hours)',
      ylabel: 'rain rate (mm/hour)'
    });

    const values = [
      2, 4, 1
    ];

    const items = [
      ...G.items
    ];

    values.forEach((v, k) => {
      const a = k;
      const b = k + 1;

      const w =
        G.X(b) - G.X(a);

      const h =
        G.Y(v) - G.Y(0);

      items.push(rect(
        w - 0.025,
        h,
        [
          (G.X(a) + G.X(b)) / 2,
          (G.Y(0) + G.Y(v)) / 2,
          0
        ],
        C.cyan,
        0.55,
        1.6
      ));

      items.push(txt(
        `${v} mm`,
        21,
        C.ink,
        G.p(
          k + 0.5,
          v / 2
        ),
        true,
        w - 0.12
      ));
    });

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // PROBABILITY DENSITY EXAMPLE
  // ------------------------------------------------------------

  // Simple triangular probability density:
  //
  // p(x) = 1 − |x|  for −1 <= x <= 1.
  // p(x) = 0 otherwise.
  //
  // Total area = 1.
  //
  // Area from −0.5 to +0.5 = 0.75.
  //
  // This avoids relying on an approximate bell-curve
  // probability while illustrating the same principle.

  const density = x =>
    Math.max(
      0,
      1 - Math.abs(x)
    );

  function probabilityPicture() {
    const G = graph({
      xmin: -1.20,
      xmax: 1.20,
      ymin: 0,
      ymax: 1.20,
      xticks: [-1, -0.5, 0, 0.5, 1],
      yticks: [0, 0.5, 1],
      xlabel: 'possible value',
      ylabel: 'probability density'
    });

    const items = [
      ...G.items
    ];

    const n = 60;

    for (let k = 0; k < n; k++) {
      const a =
        -0.5 + k / n;

      const b =
        -0.5 + (k + 1) / n;

      const x =
        (a + b) / 2;

      const h =
        density(x);

      items.push(rect(
        G.X(b) - G.X(a),
        G.Y(h) - G.Y(0),
        [
          G.X(x),
          (G.Y(0) + G.Y(h)) / 2,
          0
        ],
        GREEN,
        0.56,
        0
      ));
    }

    items.push(
      line(
        G.p(-1.2, 0),
        G.p(-1, 0),
        C.cyan,
        3.5
      ),

      line(
        G.p(-1, 0),
        G.p(0, 1),
        C.cyan,
        3.5
      ),

      line(
        G.p(0, 1),
        G.p(1, 0),
        C.cyan,
        3.5
      ),

      line(
        G.p(1, 0),
        G.p(1.2, 0),
        C.cyan,
        3.5
      ),

      dash(
        G.p(-0.5, 0),
        G.p(-0.5, 0.5),
        GREEN,
        1.8
      ),

      dash(
        G.p(0.5, 0),
        G.p(0.5, 0.5),
        GREEN,
        1.8
      )
    );

    items.push(txt(
      '75%',
      31,
      C.ink,
      G.p(0, 0.30),
      true
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // POSITIVE AND NEGATIVE AREAS
  // ------------------------------------------------------------

  function signedAreaMarks(
    G,
    options = {}
  ) {
    const {
      negative = true,
      positive = true,
      showValues = true,
      showDimensions = false
    } = options;

    const items = [];

    if (negative) {
      items.push(
        ...exactAreaParts(
          G,
          0,
          2,
          C.cyan,
          0.58
        )
      );
    }

    if (positive) {
      items.push(
        ...exactAreaParts(
          G,
          2,
          4,
          GREEN,
          0.58
        )
      );
    }

    items.push(
      zeroLine(G),
      slopeLine(
        G,
        0,
        4
      )
    );

    if (showValues) {
      if (negative) {
        items.push(txt(
          '−8',
          31,
          C.ink,
          G.p(
            0.67,
            -2.45
          ),
          true
        ));
      }

      if (positive) {
        items.push(txt(
          '+8',
          31,
          C.ink,
          G.p(
            3.33,
            2.45
          ),
          true
        ));
      }
    }

    items.push(
      glowDot(
        G.p(0, -8),
        GOLD,
        0.10
      ),

      glowDot(
        G.p(2, 0),
        GOLD,
        0.10
      ),

      glowDot(
        G.p(4, 8),
        GOLD,
        0.10
      )
    );

    if (showDimensions) {
      items.push(bracket(
        [
          G.X(2),
          G.Y(0) - 0.16,
          0
        ],

        [
          G.X(4),
          G.Y(0) - 0.16,
          0
        ],

        '2',
        GREEN,
        -0.23
      ));

      items.push(arrow(
        [
          G.X(4) - 0.10,
          G.Y(0) + 0.05,
          0
        ],

        [
          G.X(4) - 0.10,
          G.Y(8) - 0.05,
          0
        ],

        GREEN,
        2.7
      ));

      items.push(txt(
        '8',
        20,
        GREEN,
        [
          G.X(4) - 0.39,
          G.Y(4),
          0
        ],
        true
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // CANCELLATION
  // ------------------------------------------------------------

  function cancellationPicture(
    cancelled = false
  ) {
    const cy = P
      ? -0.55
      : -0.28;

    const items = [];

    const unit = P
      ? 0.41
      : 0.37;

    const xs = [
      CX - 1.45,
      CX + 1.45
    ];

    const colors = [
      C.cyan,
      GREEN
    ];

    const signs = [
      '−8',
      '+8'
    ];

    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 8; j++) {
        const col = j % 2;

        const row =
          Math.floor(j / 2);

        items.push(rect(
          unit * 0.94,
          unit * 0.94,
          [
            xs[k] +
              (col - 0.5) * unit,

            cy +
              (1.5 - row) * unit,

            0
          ],
          colors[k],
          cancelled ? 0.10 : 0.72,
          1.4
        ));
      }

      items.push(txt(
        signs[k],
        30,
        colors[k],
        [
          xs[k],
          cy + 4 * unit / 2 + 0.38,
          0
        ],
        true
      ));
    }

    items.push(txt(
      '+',
      30,
      GOLD,
      [
        CX,
        cy,
        0
      ]
    ));

    if (cancelled) {
      for (let k = 0; k < 2; k++) {
        items.push(line(
          [
            xs[k] - 0.57,
            cy + 0.88,
            0
          ],

          [
            xs[k] + 0.57,
            cy - 0.88,
            0
          ],

          C.muted,
          2.5
        ));
      }

      items.push(rounded(
        3.35,
        0.78,
        [
          CX,
          cy - 1.55,
          0
        ],
        GOLD
      ));

      items.push(txt(
        'NET = 0',
        30,
        GOLD,
        [
          CX,
          cy - 1.55,
          0
        ],
        true
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // NET CHANGE VERSUS TOTAL MOVEMENT
  // ------------------------------------------------------------

  function roundTripMarks(
    G,
    showNet = true
  ) {
    const items = [];

    const n = 45;

    for (let k = 0; k < n; k++) {
      const a =
        2 * k / n;

      const b =
        2 * (k + 1) / n;

      items.push(line(
        G.p(a, loss(a)),
        G.p(b, loss(b)),
        C.cyan,
        4.1
      ));

      const c =
        2 + 2 * k / n;

      const d =
        2 + 2 * (k + 1) / n;

      items.push(line(
        G.p(c, loss(c)),
        G.p(d, loss(d)),
        GREEN,
        4.1
      ));
    }

    items.push(
      glowDot(
        G.p(0, 11),
        GOLD,
        0.12
      ),

      glowDot(
        G.p(2, 3),
        GOLD,
        0.12
      ),

      glowDot(
        G.p(4, 11),
        GOLD,
        0.12
      )
    );

    items.push(
      txt(
        '11',
        20,
        GOLD,
        [
          G.X(0) + 0.22,
          G.Y(11) + 0.26,
          0
        ],
        true
      ),

      txt(
        '3',
        20,
        GOLD,
        [
          G.X(2),
          G.Y(3) - 0.30,
          0
        ],
        true
      ),

      txt(
        '11',
        20,
        GOLD,
        [
          G.X(4) - 0.22,
          G.Y(11) + 0.26,
          0
        ],
        true
      )
    );

    items.push(
      arrow(
        G.p(0.60, loss(0.60)),
        G.p(1.05, loss(1.05)),
        C.cyan,
        3.7
      ),

      arrow(
        G.p(2.95, loss(2.95)),
        G.p(3.40, loss(3.40)),
        GREEN,
        3.7
      )
    );

    items.push(
      txt(
        '−8',
        24,
        C.cyan,
        [
          G.X(0.80),
          G.Y(7.20),
          0
        ],
        true
      ),

      txt(
        '+8',
        24,
        GREEN,
        [
          G.X(3.20),
          G.Y(7.20),
          0
        ],
        true
      )
    );

    if (showNet) {
      items.push(dash(
        G.p(0, 11),
        G.p(4, 11),
        GOLD,
        2.3
      ));

      items.push(txt(
        'same start and end',
        18,
        GOLD,
        [
          CX,
          G.Y(11) - 0.31,
          0
        ],
        false,
        3.55
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // NET CHANGE COMPARISON
  // ------------------------------------------------------------

  function netVersusMovement() {
    const cy = P
      ? -0.68
      : -0.36;

    const xs = [
      CX - 1.45,
      CX + 1.45
    ];

    const w = 2.65;
    const h = P ? 3.20 : 2.80;

    const items = [];

    for (let k = 0; k < 2; k++) {
      const c =
        k === 0
          ? GOLD
          : C.cyan;

      items.push(rounded(
        w,
        h,
        [
          xs[k],
          cy,
          0
        ],
        c
      ));

      items.push(txt(
        k === 0
          ? 'NET CHANGE'
          : 'TOTAL MOVEMENT',
        17,
        c,
        [
          xs[k],
          cy + h / 2 - 0.34,
          0
        ],
        true,
        w - 0.20
      ));

      items.push(txt(
        k === 0
          ? '−8 + 8'
          : '8 + 8',
        23,
        C.ink,
        [
          xs[k],
          cy + 0.34,
          0
        ],
        true,
        w - 0.25
      ));

      items.push(txt(
        '=',
        23,
        C.muted,
        [
          xs[k],
          cy - 0.17,
          0
        ]
      ));

      items.push(txt(
        k === 0
          ? '0'
          : '16',
        37,
        c,
        [
          xs[k],
          cy - 0.76,
          0
        ],
        true
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // TRY IT: PIECE WIDTH CONTROL
  // ------------------------------------------------------------

  // Drawn control only. No invented browser input API.
  //
  // Slider positions are logarithmic so widths 0.01,
  // 0.1 and 0.5 remain easy to distinguish.

  function widthControl(
    width,
    count
  ) {
    const y = P
      ? -5.02
      : -2.72;

    const left =
      CX - 2.45;

    const right =
      CX + 0.65;

    const minLog =
      Math.log10(0.01);

    const maxLog =
      Math.log10(0.5);

    const X = v =>
      left +
      (
        Math.log10(v) -
        minLog
      ) /
      (maxLog - minLog) *
      (right - left);

    const x =
      X(width);

    const items = [];

    items.push(line(
      [left, y, 0],
      [right, y, 0],
      C.muted,
      3.4
    ));

    if (x > left + 0.0001) {
      items.push(line(
        [left, y, 0],
        [x, y, 0],
        GOLD,
        4.3
      ));
    }

    items.push(glowDot(
      [x, y, 0],
      GOLD,
      0.095
    ));

    items.push(txt(
      `width ${fmt(width)}`,
      16,
      GOLD,
      [
        (left + right) / 2,
        y + 0.26,
        0
      ],
      true,
      2.80
    ));

    items.push(rounded(
      1.76,
      0.43,
      [
        CX + 1.69,
        y,
        0
      ],
      C.cyan
    ));

    items.push(txt(
      `${count} pieces`,
      15,
      C.cyan,
      [
        CX + 1.69,
        y,
        0
      ],
      true,
      1.55
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // TRY IT: MOVE THE ENDPOINT
  // ------------------------------------------------------------

  function endpointArea(
    G,
    end,
    showTotal = true
  ) {
    const items = [];

    if (end > 0) {
      items.push(
        ...exactAreaParts(
          G,
          0,
          Math.min(end, 2),
          C.cyan,
          0.52
        )
      );
    }

    if (end > 2) {
      items.push(
        ...exactAreaParts(
          G,
          2,
          end,
          GREEN,
          0.52
        )
      );
    }

    items.push(
      zeroLine(G),

      slopeLine(
        G,
        0,
        4
      )
    );

    items.push(dash(
      G.p(end, G.ymin),
      G.p(end, G.ymax),
      GOLD,
      1.8
    ));

    items.push(glowDot(
      G.p(
        end,
        slope(end)
      ),
      GOLD,
      0.115
    ));

    if (showTotal) {
      const p =
        G.p(end, slope(end));

      items.push(txt(
        `end = ${fmt(end)}`,
        18,
        GOLD,
        [
          Math.max(
            GX0 + 0.80,
            Math.min(
              GX1 - 0.80,
              p[0]
            )
          ),

          Math.min(
            GY1 - 0.18,
            p[1] + 0.27
          ),

          0
        ],
        true,
        1.60
      ));
    }

    return new M.VGroup(
      ...items
    );
  }

  function endpointControl(
    end
  ) {
    const y = P
      ? -5.02
      : -2.72;

    const left =
      CX - 2.45;

    const right =
      CX + 2.45;

    const x =
      left +
      (right - left) * end / 4;

    const items = [];

    items.push(line(
      [
        left,
        y,
        0
      ],

      [
        right,
        y,
        0
      ],

      C.muted,
      3.5
    ));

    if (x > left + 0.0001) {
      items.push(line(
        [
          left,
          y,
          0
        ],

        [
          x,
          y,
          0
        ],

        GOLD,
        4.5
      ));
    }

    items.push(glowDot(
      [x, y, 0],
      GOLD,
      0.095
    ));

    items.push(txt(
      `end point = ${fmt(end)}`,
      16,
      GOLD,
      [
        CX,
        y + 0.26,
        0
      ],
      true,
      4.30
    ));

    return new M.VGroup(
      ...items
    );
  }

  // ------------------------------------------------------------
  // 0 — Imagine a car trip where you cannot see
  // the road signs. You only see the speedometer.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...putPicture(
      roadPicture(
        60,
        0.15
      )
    ),
    ...say(
      'YOU CAN SEE THE SPEED, NOT THE DISTANCE',
      GOLD
    )
  );

  await until(S(0) + 2.50);

  await play(
    ...putPicture(
      roadPicture(
        90,
        0.65
      )
    ),
    ...fbox([
      'speed is known',
      ['distance is unknown', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 1 — Add speed times time, a little piece at a time.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...putPicture(
      speedTimePicture(
        1,
        false
      )
    ),
    ...fbox([
      'distance = speed × time',
      'for each short interval'
    ]),
    ...say(
      'ADD UP SPEED TIMES TIME'
    )
  );

  await until(S(1) + 2.15);

  await play(
    ...putPicture(
      speedTimePicture(
        3,
        true
      )
    ),
    ...fbox([
      '0.5 + 1 + 1.5',
      ['= 3 kilometres', GREEN]
    ], GREEN),
    ...say(
      'LITTLE DISTANCES ADD TO THE WHOLE TRIP',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 2 — We can do the same with our loss.
  // ------------------------------------------------------------

  let G = lossGraph(
    true,
    false
  );

  await until(S(2));

  await play(
    ...picture(G.g),
    ...clearBox(),
    ...say(
      'DO THE SAME WITH OUR LOSS'
    )
  );

  // ------------------------------------------------------------
  // 3 — Previously: loss → slope.
  // Now: slope → change in loss.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...picture(
      transformationPicture(false)
    ),
    ...fbox([
      'so far',
      ['loss → slope', GOLD],
      'take the derivative'
    ], GOLD),
    ...say(
      'WE WENT FROM LOSS TO SLOPE',
      GOLD
    )
  );

  await until(S(3) + 3.45);

  await play(
    ...putPicture(
      transformationPicture(true)
    ),
    ...fbox([
      'now go the other way',
      ['slope → change in loss', GREEN]
    ], GREEN),
    ...say(
      'NOW RECOVER THE CHANGE IN LOSS',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 4 — Middle rent stays at ten.
  // Walk the step price from zero to two.
  // ------------------------------------------------------------

  let R = rentGraph(
    0,
    false
  );

  await until(S(4));

  await play(
    ...picture(R.g),
    ...fbox([
      ['middle rent = 10', GOLD],
      'step price: 0 → 2'
    ], GOLD),
    ...say(
      'KEEP THE MIDDLE RENT FIXED'
    )
  );

  await until(S(4) + 1.75);

  R = rentGraph(
    2,
    true
  );

  await play(
    ...putPicture(R.g),
    ...say(
      'WALK THE STEP PRICE FROM ZERO TO TWO',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 5 — Hide the actual loss values.
  // Only the slope rule is known:
  // 4 × (step price − 2).
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...picture(
      hiddenLossPicture()
    ),
    ...fbox([
      'pretend loss is hidden',
      ['slope = 4 × (step price − 2)', GOLD]
    ], GOLD),
    ...say(
      'ONLY THE SLOPE RULE IS KNOWN',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 6 — Draw the slope on its own graph:
  // step price across, slope vertically.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    false,
    false
  );

  await until(S(6));

  await play(
    ...picture(G.g),
    ...fbox([
      ['across: step price', C.cyan],
      ['vertical: slope', GOLD],
      'not the loss itself'
    ], GOLD),
    ...say(
      'DRAW THE SLOPE ON ITS OWN GRAPH'
    )
  );

  // ------------------------------------------------------------
  // 7 — The slope is a straight line:
  // −8 at zero, rising to 0 at two.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...putMarks(
      new M.VGroup(
        glowDot(
          G.p(0, -8),
          GOLD,
          0.12
        ),

        txt(
          '−8',
          22,
          GOLD,
          [
            G.X(0) + 0.50,
            G.Y(-8) - 0.02,
            0
          ],
          true
        )
      )
    ),
    ...fbox([
      'at step price 0',
      '4 × (0 − 2)',
      ['= −8', GOLD]
    ], GOLD),
    ...say(
      'STARTING SLOPE IS MINUS EIGHT',
      GOLD
    )
  );

  await until(S(7) + 3.0);

  G = slopeGraph(
    false,
    true,
    true
  );

  await play(
    ...picture(G.g),
    ...fbox([
      'at step price 2',
      '4 × (2 − 2)',
      ['= 0', GREEN]
    ], GREEN),
    ...say(
      'THE SLOPE RISES TO ZERO',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 8 — Cut the walk into four pieces,
  // each one half wide.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...putMarks(
      partitionMarks(
        G,
        0.5
      )
    ),
    ...fbox([
      'total width = 2',
      '4 equal pieces',
      ['piece width = 0.5', C.cyan]
    ]),
    ...say(
      'CUT THE WALK INTO FOUR EQUAL PIECES'
    )
  );

  // ------------------------------------------------------------
  // 9 — Slope means change in loss per unit
  // of step price.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...putMarks(
      activePieceMarks(
        G,
        HALF,
        0,
        false,
        false
      )
    ),
    ...fbox([
      'slope tells us',
      'change in loss',
      ['per unit of step price', GOLD]
    ], GOLD),
    ...say(
      'SLOPE IS A RATE OF CHANGE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 10 — Over a short piece:
  // change in loss ≈ slope × width.
  // With width 0.5, approximately half the slope.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...picture(
      pieceGeometry(
        -8,
        0.5,
        1
      )
    ),
    ...fbox([
      'over a short piece',
      ['change ≈ slope × width', GOLD]
    ], GOLD),
    ...say(
      'MULTIPLY THE RATE BY THE PIECE WIDTH',
      GOLD
    )
  );

  await until(S(10) + 3.50);

  await play(
    ...putPicture(
      pieceGeometry(
        -8,
        0.5,
        2
      )
    ),
    ...fbox([
      'width = 0.5',
      ['change ≈ half the slope', C.cyan],
      'use the slope at the start'
    ]),
    ...say(
      'HALF A UNIT GIVES HALF THE STARTING SLOPE'
    )
  );

  // ------------------------------------------------------------
  // 11 — First piece:
  // slope −8 × 0.5 = −4.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(11));

  await play(
    ...picture(
      G.g,
      activePieceMarks(
        G,
        HALF,
        0
      )
    ),
    ...fbox([
      ['PIECE 1', GOLD],
      'from 0 to 0.5',
      '−8 × 0.5',
      ['= −4', C.cyan]
    ], GOLD),
    ...say(
      'FIRST PIECE: MINUS FOUR',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 12 — Second piece:
  // slope −6 × 0.5 = −3.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...putMarks(
      activePieceMarks(
        G,
        HALF,
        1
      )
    ),
    ...fbox([
      ['PIECE 2', GOLD],
      'from 0.5 to 1',
      '−6 × 0.5',
      ['= −3', C.cyan]
    ], GOLD),
    ...say(
      'SECOND PIECE: MINUS THREE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 13 — Third piece:
  // slope −4 × 0.5 = −2.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...putMarks(
      activePieceMarks(
        G,
        HALF,
        2
      )
    ),
    ...fbox([
      ['PIECE 3', GOLD],
      'from 1 to 1.5',
      '−4 × 0.5',
      ['= −2', C.cyan]
    ], GOLD),
    ...say(
      'THIRD PIECE: MINUS TWO',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 14 — Fourth piece:
  // slope −2 × 0.5 = −1.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...putMarks(
      activePieceMarks(
        G,
        HALF,
        3
      )
    ),
    ...fbox([
      ['PIECE 4', GOLD],
      'from 1.5 to 2',
      '−2 × 0.5',
      ['= −1', C.cyan]
    ], GOLD),
    ...say(
      'FOURTH PIECE: MINUS ONE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 15 — Add all four contributions:
  // −4 − 3 − 2 − 1 = −10.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...picture(
      sumPicture(false)
    ),
    ...fbox([
      'add the little changes',
      '−4 − 3 − 2 − 1'
    ], GOLD),
    ...say(
      'ADD ALL FOUR CONTRIBUTIONS',
      GOLD
    )
  );

  await until(S(15) + 3.0);

  await play(
    ...putPicture(
      sumPicture(true)
    ),
    ...fbox([
      '−4 − 3 − 2 − 1',
      ['= −10', GOLD],
      'approximate change in loss'
    ], GOLD),
    ...say(
      'OUR FIRST ESTIMATE IS MINUS TEN',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 16 — Each piece is a bar.
  // Height is slope; width is piece width.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(16));

  await play(
    ...picture(
      G.g,
      allBars(
        G,
        HALF,
        {
          showLabels: true
        }
      )
    ),
    ...fbox([
      'each piece is a bar',
      ['height = slope', GOLD],
      ['width = 0.5', C.cyan]
    ], GOLD),
    ...say(
      'EVERY PIECE IS A RECTANGLE'
    )
  );

  await until(S(16) + 3.30);

  await play(
    ...putMarks(
      activePieceMarks(
        G,
        HALF,
        1,
        true,
        true
      )
    ),
    ...fbox([
      'height × width',
      '−6 × 0.5',
      ['signed contribution = −3', GOLD]
    ], GOLD),
    ...say(
      'HEIGHT TIMES WIDTH GIVES THE CONTRIBUTION',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 17 — Total is the signed area of the bars.
  // Negative because the bars hang below zero.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...putMarks(
      allBars(
        G,
        HALF,
        {
          showLabels: true,
          showTotal: true
        }
      )
    ),
    ...fbox([
      'all bars are below zero',
      ['signed areas are negative', C.cyan],
      ['total = −10', GOLD]
    ], GOLD),
    ...say(
      'AREA BELOW ZERO COUNTS AS NEGATIVE',
      C.cyan
    )
  );

  // ------------------------------------------------------------
  // 18 — The bars hang deeper than the actual slope line.
  // The slope rises inside each piece.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...putMarks(
      overcountMarks(
        G,
        HALF,
        0
      )
    ),
    ...fbox([
      'start-of-piece slope',
      'stays fixed across the bar',
      ['actual slope keeps rising', GOLD]
    ], GOLD),
    ...say(
      'THE SLOPE DOES NOT STAY CONSTANT',
      GOLD
    )
  );

  await until(S(18) + 3.50);

  let Z = zoomPieceError();

  await play(
    ...picture(Z.g),
    ...fbox([
      'bar height stays at −8',
      'actual slope: −8 → −6',
      ['extra negative area', PINK]
    ], PINK),
    ...say(
      'THE BAR HANGS TOO DEEP',
      PINK
    )
  );

  // ------------------------------------------------------------
  // 19 — Minus ten counts a little too much.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(19));

  await play(
    ...picture(
      G.g,
      overcountMarks(
        G,
        HALF
      )
    ),
    ...fbox([
      'estimate = −10',
      ['too much negative area', PINK]
    ], PINK),
    ...say(
      'MINUS TEN IS TOO NEGATIVE',
      PINK
    )
  );

  // ------------------------------------------------------------
  // 20 — Use thinner pieces, width 0.1.
  // Twenty pieces, total −8.4.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...putMarks(
      allBars(
        G,
        TENTH,
        {
          showTotal: true
        }
      )
    ),
    ...fbox([
      'piece width = 0.1',
      '20 thinner pieces',
      ['total = −8.4', GOLD]
    ], GOLD),
    ...say(
      'THINNER PIECES GIVE A BETTER ESTIMATE',
      GOLD
    )
  );

  await until(S(20) + 3.15);

  await play(
    ...putMarks(
      overcountMarks(
        G,
        TENTH
      )
    ),
    ...fbox([
      'smaller extra triangles',
      'less overcount',
      ['−8.4 is closer', GREEN]
    ], GREEN)
  );

  // ------------------------------------------------------------
  // 21 — Width 0.01.
  // Two hundred pieces, total −8.04.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...putMarks(
      allBars(
        G,
        HUNDREDTH,
        {
          showTotal: true,
          opacity: 0.54
        }
      )
    ),
    ...fbox([
      'piece width = 0.01',
      '200 very thin pieces',
      ['total = −8.04', GOLD]
    ], GOLD),
    ...say(
      'ONE HUNDREDTH WIDE: MINUS 8.04',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 22 — The totals settle on one number: minus eight.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...picture(
      convergencePicture(
        3,
        true
      )
    ),
    ...fbox([
      '−10 → −8.4 → −8.04',
      ['approaches −8', GREEN]
    ], GREEN),
    ...say(
      'THE TOTALS SETTLE ON MINUS EIGHT',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 23 — The bars fill the triangle more and more exactly.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(23));

  await play(
    ...picture(
      G.g,
      allBars(
        G,
        HALF
      )
    ),
    ...fbox([
      'width = 0.5',
      'rough staircase'
    ]),
    ...say(
      'WATCH THE STAIRCASE BECOME A TRIANGLE'
    )
  );

  await until(S(23) + 1.55);

  await play(
    ...putMarks(
      allBars(
        G,
        TENTH
      )
    ),
    ...fbox([
      'width = 0.1',
      'closer to the slope line'
    ])
  );

  await until(S(23) + 3.10);

  await play(
    ...putMarks(
      allBars(
        G,
        HUNDREDTH
      )
    ),
    ...fbox([
      'width = 0.01',
      'almost exact'
    ])
  );

  await until(S(23) + 4.65);

  await play(
    ...putMarks(
      triangleMarks(
        G,
        {
          dimensions: false,
          showArea: false
        }
      )
    ),
    ...fbox([
      'as width approaches zero',
      ['the exact triangle remains', GREEN]
    ], GREEN),
    ...say(
      'THE LIMIT IS THE EXACT SIGNED AREA',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 24 — Triangle width = 2, depth = 8.
  // Area = 1/2 × 2 × 8 = 8.
  // Below zero, so signed area = −8.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...putMarks(
      triangleMarks(
        G,
        {
          dimensions: true,
          showArea: false
        }
      )
    ),
    ...fbox([
      ['base = 2', GOLD],
      ['depth = 8', C.cyan]
    ], GOLD),
    ...say(
      'THE TRIANGLE IS TWO WIDE AND EIGHT DEEP',
      GOLD
    )
  );

  await until(S(24) + 2.65);

  await play(
    ...picture(
      triangleGeometry(2)
    ),
    ...fbox([
      'triangle area',
      '= 1/2 × 2 × 8',
      ['= 8', GREEN]
    ], GREEN),
    ...say(
      'HALF THE BASE TIMES THE HEIGHT',
      GOLD
    )
  );

  await until(S(24) + 5.45);

  G = slopeGraph(
    false,
    true,
    false
  );

  await play(
    ...picture(
      G.g,
      triangleMarks(
        G,
        {
          dimensions: true,
          showArea: true,
          showSign: true
        }
      )
    ),
    ...fbox([
      'geometric area = 8',
      'below the zero line',
      ['signed area = −8', GREEN]
    ], GREEN),
    ...say(
      'BELOW ZERO: THE EXACT CHANGE IS MINUS EIGHT',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 25 — Peek at the actual loss to check.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  await until(S(25));

  await play(
    ...picture(G.g),
    ...clearBox(),
    ...say(
      'NOW CHECK THE ORIGINAL LOSS CURVE'
    )
  );

  // ------------------------------------------------------------
  // 26 — At step price zero, loss is 11.
  // At step price two, loss is 3.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...putMarks(
      new M.VGroup(
        glowDot(
          G.p(0, 11),
          GOLD,
          0.13
        ),

        dash(
          G.p(0, 0),
          G.p(0, 11),
          GOLD,
          1.8
        ),

        txt(
          '11',
          24,
          GOLD,
          [
            G.X(0) + 0.32,
            G.Y(11) + 0.26,
            0
          ],
          true
        )
      )
    ),
    ...fbox([
      'step price = 0',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say(
      'STARTING LOSS IS ELEVEN',
      GOLD
    )
  );

  await until(S(26) + 2.50);

  await play(
    ...putMarks(
      lossWalkMarks(
        G,
        2,
        false
      )
    ),
    ...fbox([
      'loss at 0 = 11',
      ['loss at 2 = 3', GREEN]
    ], GREEN),
    ...say(
      'ENDING LOSS IS THREE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 27 — Three minus eleven is minus eight.
  // It matches the accumulated slope.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...picture(
      equalityPicture(2)
    ),
    ...fbox([
      'change in loss = 3 − 11',
      ['= −8', GREEN],
      'exactly matches the area'
    ], GREEN),
    ...say(
      'BOTH METHODS GIVE MINUS EIGHT',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 28 — Adding slope times width over thinner and
  // thinner pieces is called an integral.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(28));

  await play(
    ...picture(
      G.g,
      allBars(
        G,
        HUNDREDTH
      )
    ),
    ...fbox([
      ['INTEGRAL', GOLD],
      'add slope × width',
      'over thinner pieces'
    ], GOLD),
    ...say(
      'THIS ACCUMULATION IS AN INTEGRAL',
      GOLD
    )
  );

  await until(S(28) + 2.40);

  await play(
    ...putMarks(
      triangleMarks(
        G,
        {
          showArea: true
        }
      )
    ),
    ...fbox([
      'integral = exact limit',
      ['of the little contributions', GREEN]
    ], GREEN)
  );

  // ------------------------------------------------------------
  // 29 — The integral of the slope from zero to two
  // equals the total change in loss.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...picture(
      integralNotation(3)
    ),
    ...fbox([
      'integral from 0 to 2',
      ['= −8', GOLD],
      ['total change in loss', GREEN]
    ], GOLD),
    ...say(
      'INTEGRATE THE SLOPE TO GET THE CHANGE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 30 — The link is the fundamental theorem of calculus.
  // Calculus is the mathematics of change.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...picture(
      theoremPicture()
    ),
    ...fbox([
      ['FUNDAMENTAL THEOREM', GOLD],
      ['OF CALCULUS', GOLD],
      'links slopes and totals'
    ], GOLD),
    ...say(
      'THE FUNDAMENTAL THEOREM OF CALCULUS',
      GOLD
    )
  );

  await until(S(30) + 4.0);

  await play(
    ...fbox([
      'derivative gives the rate',
      'integral gives the change',
      ['calculus: maths of change', GREEN]
    ], GREEN),
    ...say(
      'CALCULUS IS THE MATHS OF CHANGE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 31 — Formula:
  //
  // Integral of slope from start to end
  // = loss(end) − loss(start).
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...picture(
      fundamentalFormulaPicture()
    ),
    ...fbox([
      ['GENERAL RULE', GOLD],
      'integral of slope',
      'from start to end',
      ['= loss(end) − loss(start)', GREEN]
    ], GOLD),
    ...say(
      'ACCUMULATED SLOPE EQUALS END MINUS START',
      GOLD
    )
  );

  await until(S(31) + 3.35);

  await play(
    ...fbox([
      'our example',
      'integral from 0 to 2',
      '= loss(2) − loss(0)',
      ['= 3 − 11 = −8', GREEN]
    ], GREEN)
  );

  // ------------------------------------------------------------
  // 32 — Add every little change and get
  // the whole change.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...picture(
      accumulationPicture()
    ),
    ...fbox([
      'every tiny contribution',
      'added together',
      ['gives the whole change', GOLD]
    ], GOLD),
    ...say(
      'LITTLE CHANGES ADD UP TO THE WHOLE CHANGE',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 33 — Whenever you know a rate,
  // integration turns it into a total.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...picture(
      rateTotalPicture('general')
    ),
    ...fbox([
      ['RATE', C.cyan],
      'multiply by tiny widths',
      'add them up',
      ['TOTAL', GREEN]
    ], GOLD),
    ...say(
      'AN INTEGRAL TURNS A RATE INTO A TOTAL',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 34 — Applications:
  // speed into distance;
  // rain per hour into total rain;
  // probability density into probability.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...picture(
      speedTimePicture(
        3,
        true
      )
    ),
    ...fbox([
      ['speed × time', C.cyan],
      ['= distance travelled', GREEN]
    ], GREEN),
    ...say(
      'SPEED INTO DISTANCE'
    )
  );

  await until(S(34) + 2.65);

  await play(
    ...putPicture(
      rainfallPicture()
    ),
    ...fbox([
      'rain per hour × hours',
      '2 + 4 + 1',
      ['= 7 mm total rain', GREEN]
    ], GREEN),
    ...say(
      'RAIN RATE INTO TOTAL RAIN'
    )
  );

  await until(S(34) + 5.70);

  await play(
    ...putPicture(
      probabilityPicture()
    ),
    ...fbox([
      'probability density',
      'area over an interval',
      ['= probability', GREEN],
      'example: 0.75 = 75%'
    ], GREEN),
    ...say(
      'AREA UNDER A DENSITY GIVES A CHANCE',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 35 — Trap:
  // Area below the zero line counts as negative.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(35));

  await play(
    ...picture(
      G.g,
      triangleMarks(
        G,
        {
          showArea: true,
          showSign: true
        }
      )
    ),
    ...fbox([
      ['TRAP', PINK],
      'area is unsigned geometry',
      'integrals use signed area',
      ['below zero: negative', C.cyan]
    ], PINK),
    ...say(
      'DO NOT FORGET THE NEGATIVE SIGN',
      PINK
    )
  );

  // ------------------------------------------------------------
  // 36 — Walk from two to four.
  // The slope is positive.
  // The new triangle has signed area +8.
  // ------------------------------------------------------------

  G = slopeGraph(
    true,
    true,
    false
  );

  await until(S(36));

  await play(
    ...picture(
      G.g,
      signedAreaMarks(
        G,
        {
          negative: false,
          positive: true,
          showValues: false,
          showDimensions: true
        }
      )
    ),
    ...fbox([
      'step price: 2 → 4',
      ['slope: 0 → +8', GREEN],
      'positive area'
    ], GREEN),
    ...say(
      'PAST TWO, THE SLOPE IS POSITIVE',
      GREEN
    )
  );

  await until(S(36) + 3.0);

  await play(
    ...putMarks(
      signedAreaMarks(
        G,
        {
          negative: false,
          positive: true,
          showValues: true,
          showDimensions: true
        }
      )
    ),
    ...fbox([
      'triangle area',
      '= 1/2 × 2 × 8',
      ['= +8', GREEN]
    ], GREEN),
    ...say(
      'THE SECOND TRIANGLE ADDS PLUS EIGHT',
      GREEN
    )
  );

  // ------------------------------------------------------------
  // 37 — From zero to four:
  // −8 + 8 = 0.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...putMarks(
      signedAreaMarks(
        G,
        {
          negative: true,
          positive: true,
          showValues: true
        }
      )
    ),
    ...fbox([
      ['from 0 to 2: −8', C.cyan],
      ['from 2 to 4: +8', GREEN],
      ['total = 0', GOLD]
    ], GOLD),
    ...say(
      'THE NEGATIVE AND POSITIVE AREAS CANCEL',
      GOLD
    )
  );

  await until(S(37) + 2.15);

  await play(
    ...picture(
      cancellationPicture(true)
    ),
    ...fbox([
      '−8 + 8',
      ['= 0', GOLD],
      'net change'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 38 — The loss changed along the way.
  // It returned to its starting value, eleven.
  // ------------------------------------------------------------

  G = lossGraph(
    false,
    false
  );

  await until(S(38));

  await play(
    ...picture(
      G.g,
      roundTripMarks(
        G,
        true
      )
    ),
    ...fbox([
      'loss: 11 → 3 → 11',
      'went down, then up',
      ['ending loss = starting loss', GOLD]
    ], GOLD),
    ...say(
      'THE LOSS MOVED BUT RETURNED TO ELEVEN',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 39 — Integral gives start-to-end change.
  // It does not give total absolute movement.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...picture(
      netVersusMovement()
    ),
    ...fbox([
      ['integral: net change = 0', GOLD],
      ['total absolute change = 16', C.cyan],
      'different quantities'
    ], GOLD),
    ...say(
      'NET CHANGE IS NOT TOTAL MOVEMENT',
      GOLD
    )
  );

  // ------------------------------------------------------------
  // 40 — Try it preview:
  // drag the piece width and watch the bars fill
  // the triangle more accurately.
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  let control = widthControl(
    0.5,
    HALF.length
  );

  await until(S(40));

  await play(
    ...picture(
      G.g,
      allBars(
        G,
        HALF
      )
    ),

    new M.FadeIn(control),

    ...fbox([
      ['TRY IT', GOLD],
      'width = 0.5',
      ['estimate = −10', C.cyan]
    ], GOLD),

    ...say(
      'DRAG THE PIECE WIDTH',
      GOLD
    )
  );

  await until(S(40) + 1.35);

  let nextControl = widthControl(
    0.1,
    TENTH.length
  );

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),

    ...putMarks(
      allBars(
        G,
        TENTH
      )
    ),

    ...fbox([
      'width = 0.1',
      ['estimate = −8.4', GOLD]
    ], GOLD)
  );

  control = nextControl;

  await until(S(40) + 2.65);

  nextControl = widthControl(
    0.01,
    HUNDREDTH.length
  );

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),

    ...putMarks(
      allBars(
        G,
        HUNDREDTH
      )
    ),

    ...fbox([
      'width = 0.01',
      ['estimate = −8.04', GREEN]
    ], GREEN),

    ...say(
      'THINNER BARS FILL THE TRIANGLE',
      GREEN
    )
  );

  control = nextControl;

  // ------------------------------------------------------------
  // 41 — Move the endpoint until the total change is zero.
  //
  // Preview intermediate endpoints without selecting
  // the final nontrivial answer for the learner.
  //
  // Exact change at end = 2.5:
  // loss(2.5) − loss(0) = 3.5 − 11 = −7.5.
  //
  // Exact change at end = 3.5:
  // loss(3.5) − loss(0) = 7.5 − 11 = −3.5.
  // ------------------------------------------------------------

  G = slopeGraph(
    true,
    true,
    false
  );

  nextControl = endpointControl(
    2.5
  );

  await until(S(41));

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),

    ...picture(
      G.g,
      endpointArea(
        G,
        2.5
      )
    ),

    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'keep the start at 0',
      'end = 2.5',
      ['change = −7.5', C.cyan]
    ], GOLD),

    ...say(
      'NOW MOVE THE END POINT',
      GOLD
    )
  );

  control = nextControl;

  await until(S(41) + 1.80);

  nextControl = endpointControl(
    3.5
  );

  await play(
    new M.FadeOut(control),
    new M.FadeIn(nextControl),

    ...putMarks(
      endpointArea(
        G,
        3.5
      )
    ),

    ...fbox([
      'end = 3.5',
      'change = −3.5',
      ['find a nonzero end', GOLD],
      ['where total change = 0', GREEN]
    ], GOLD),

    ...say(
      'WHERE DO THE SIGNED AREAS CANCEL?',
      GOLD
    )
  );

  control = nextControl;

  // ------------------------------------------------------------
  // 42 — Recap:
  //
  // An integral accumulates slope times tiny widths.
  // It gives the total signed change from start to end.
  //
  // For our apartment loss:
  // integral of slope from 0 to 2
  // = −8
  // = loss(2) − loss(0).
  // ------------------------------------------------------------

  G = slopeGraph(
    false,
    true,
    false
  );

  await until(S(42));

  await play(
    new M.FadeOut(control),

    ...picture(
      G.g,
      allBars(
        G,
        HUNDREDTH
      )
    ),

    ...fbox([
      ['INTEGRAL', GOLD],
      'add slope × tiny width',
      'over the whole interval'
    ], GOLD),

    ...say(
      'INTEGRALS ADD UP TINY CHANGES',
      GOLD
    )
  );

  await until(S(42) + 2.05);

  await play(
    ...putMarks(
      triangleMarks(
        G,
        {
          dimensions: true,
          showArea: true
        }
      )
    ),

    ...fbox([
      'exact signed area',
      'from 0 to 2',
      ['= −8', GREEN]
    ], GREEN),

    ...say(
      'THE EXACT AREA GIVES THE WHOLE CHANGE',
      GREEN
    )
  );

  await until(S(42) + 4.20);

  await play(
    ...picture(
      equalityPicture(2)
    ),

    ...fbox([
      ['FUNDAMENTAL THEOREM', GOLD],
      'integral of slope',
      '= loss(end) − loss(start)',
      ['3 − 11 = −8', GREEN]
    ], GOLD),

    ...say(
      'FROM RATES OF CHANGE TO TOTAL CHANGE',
      GREEN
    )
  );

  await until(E(42));
}
