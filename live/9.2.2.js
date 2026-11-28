// lesson 9.2.2
// Derivatives — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: middle rent fixed at 10.
// Uses the drawing and animation API from the approved reference.
// Browser rendering and playback have not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const STEPS = [-1, 0, 1];
  const RENTS = [9, 11, 13];
  const MIDDLE = 10;

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';
  const COLORS = [C.cyan, C.ink, PINK];

  const loss = s => 3 + 2 * (s - 2) ** 2;

  const derivative = s => 4 * (s - 2);

  const prediction = (s, m = MIDDLE) =>
    STEPS.map(x => m + s * x);

  const misses = (s, m = MIDDLE) =>
    prediction(s, m).map((v, k) => v - RENTS[k]);

  const squares = (s, m = MIDDLE) =>
    misses(s, m).map(v => v * v);

  const averageChange = h => 2 * h - 8;

  const tangentValue = (s, x) =>
    loss(s) + derivative(s) * (x - s);

  const fmt = (n, places = 4) => {
    const v = Number(n.toFixed(places));
    return String(v).replace('-', '−');
  };

  const signed = (n, places = 4) =>
    n > 0 ? `+${fmt(n, places)}` : fmt(n, places);

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
    ? [0, 2.15, 0]
    : [CX, 1.93, 0];

  const BOXP = P
    ? [0, 3.35, 0]
    : [4.25, -0.25, 0];

  const GX0 = CX - 2.65;
  const GX1 = CX + 2.65;

  const GY0 = P ? -4.0 : -2.20;
  const GY1 = P ? 1.15 : 1.10;

  const BOX_MAX = P ? FW - 1.2 : 4.15;

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
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(a, b, color = C.muted, width = 2) {
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
      cornerRadius: 0.16,
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
    const outer = new M.Dot({
      point: p,
      radius: radius * 2.65,
      color
    });

    outer.setFill(color, 0.10);

    const inner = new M.Dot({
      point: p,
      radius: radius * 1.70,
      color
    });

    inner.setFill(color, 0.22);

    const core = dot(p, color, radius);

    return new M.VGroup(
      outer,
      inner,
      core
    );
  }

  function ring(
    p,
    color = GOLD,
    radius = 0.18
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

  // Arrow constructed from reference-supported Line objects.

  function arrow(
    a,
    b,
    color = GOLD,
    width = 3,
    head = 0.12
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.0001) {
      return ring(a, color, 0.10);
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
      a.push(new M.FadeOut(boxNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    boxNow = g;
    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21;
    const lh = P ? 0.35 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
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

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = rounded(
      wd,
      ht,
      BOXP,
      color
    );

    const left = BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

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

    const g = new M.VGroup(r, ...texts);

    // Respect both width and vertical bounds on phones.

    const maxh = P ? 1.65 : 3.65;

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
  // PICTURE AND OVERLAY MANAGEMENT
  // ------------------------------------------------------------

  // Groups are constructed before appearing on screen.
  // Existing scene objects are never wrapped in a new VGroup.

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

  // ------------------------------------------------------------
  // GRAPH COORDINATES AND AXES
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
        P ? 17 : 16,
        C.ink,
        [X(v), GY0 - 0.25, 0],
        true
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
        P ? 16 : 15,
        C.muted,
        [GX0 - 0.40, Y(v), 0],
        true,
        0.72
      ));
    });

    items.push(line(
      [GX0, GY0, 0],
      [GX1 + 0.12, GY0, 0],
      C.muted,
      2.4
    ));

    items.push(line(
      [GX0, GY0, 0],
      [GX0, GY1 + 0.09, 0],
      C.muted,
      2.4
    ));

    items.push(txt(
      ylabel,
      19,
      C.muted,
      [CX, GY1 + 0.30, 0],
      false,
      GX1 - GX0
    ));

    items.push(txt(
      xlabel,
      18,
      C.muted,
      [CX, GY0 - 0.60, 0]
    ));

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

  // A glowing sampled curve.
  // The curve is made of ordinary Line objects, avoiding
  // dependencies on additional plotting APIs.

  function curveParts(
    G,
    fn,
    a,
    b,
    color = C.cyan,
    n = 56
  ) {
    const halo = [];
    const core = [];

    for (let i = 0; i < n; i++) {
      const x0 = a + (b - a) * i / n;
      const x1 = a + (b - a) * (i + 1) / n;

      const y0 = fn(x0);
      const y1 = fn(x1);

      halo.push(line(
        G.p(x0, y0),
        G.p(x1, y1),
        C.card,
        7
      ));

      core.push(line(
        G.p(x0, y0),
        G.p(x1, y1),
        color,
        2.8
      ));
    }

    return [...halo, ...core];
  }

  // ------------------------------------------------------------
  // FULL LOSS GRAPH
  // ------------------------------------------------------------

  function fullLossGraph() {
    const G = graph({
      xmin: -0.15,
      xmax: 4.15,
      ymin: 0,
      ymax: 12.5,
      xticks: [0, 1, 2, 3, 4],
      yticks: [0, 3, 5, 8, 11],
      xlabel: 'step price',
      ylabel: 'loss'
    });

    const items = [
      ...G.items,
      ...curveParts(G, loss, 0, 4)
    ];

    for (let s = 0; s <= 4; s++) {
      items.push(
        glowDot(
          G.p(s, loss(s)),
          C.cyan,
          0.085
        )
      );
    }

    G.g = new M.VGroup(...items);

    return G;
  }

  // ------------------------------------------------------------
  // MAGNIFIED LOSS GRAPH
  // ------------------------------------------------------------

  // Use real axis values when magnifying.
  // No artificial change to the underlying loss function.

  function zoomLossGraph(h) {
    const drop = 11 - loss(h);

    const xmin = -0.16 * h;
    const xmax = 1.25 * h;

    const ymin = 11 - drop * 1.35;
    const ymax = 11 + drop * 0.25;

    const G = graph({
      xmin,
      xmax,
      ymin,
      ymax,
      xticks: [0, h / 2, h],
      yticks: [
        Number(loss(h).toFixed(4)),
        Number(
          ((11 + loss(h)) / 2).toFixed(4)
        ),
        11
      ],
      xlabel: 'step price (zoomed)',
      ylabel: 'loss (zoomed)'
    });

    const items = [
      ...G.items,
      ...curveParts(
        G,
        loss,
        0,
        xmax,
        C.cyan,
        48
      )
    ];

    G.g = new M.VGroup(...items);

    return G;
  }

  // ------------------------------------------------------------
  // SECANT, GAP AND TANGENT HELPERS
  // ------------------------------------------------------------

  function secantSegment(
    G,
    h,
    color = GOLD,
    width = 4
  ) {
    return line(
      G.p(0, 11),
      G.p(h, loss(h)),
      color,
      width
    );
  }

  function endpoints(G, h) {
    return new M.VGroup(
      glowDot(G.p(0, 11), GOLD, 0.105),
      glowDot(G.p(h, loss(h)), C.green, 0.10)
    );
  }

  function gapMarks(
    G,
    h,
    withChord = true,
    withRun = true,
    withRise = true
  ) {
    const a = G.p(0, 11);
    const b = G.p(h, loss(h));
    const corner = G.p(h, 11);

    const items = [];

    if (withChord) {
      items.push(
        secantSegment(G, h, GOLD, 3.5)
      );
    }

    if (withRun) {
      items.push(
        arrow(a, corner, GOLD, 2.8)
      );

      items.push(txt(
        `+${fmt(h)}`,
        18,
        GOLD,
        [
          (a[0] + corner[0]) / 2,
          a[1] + 0.32,
          0
        ],
        true
      ));
    }

    if (withRise) {
      items.push(
        arrow(
          corner,
          b,
          C.violet,
          3
        )
      );

      const rightSpace = GX1 - b[0];
      const side = rightSpace > 0.65 ? 1 : -1;

      items.push(txt(
        fmt(loss(h) - 11),
        18,
        C.violet,
        [
          b[0] + side * 0.43,
          (corner[1] + b[1]) / 2,
          0
        ],
        true,
        0.85
      ));
    }

    items.push(
      glowDot(a, GOLD, 0.095),
      glowDot(b, C.green, 0.095)
    );

    return new M.VGroup(...items);
  }

  // An extended secant makes the turning motion visible even
  // when the moving point is almost on top of the fixed point.

  function extendedSecant(G, h) {
    const rate = averageChange(h);

    const left = Math.max(
      G.xmin + 0.02,
      -0.12
    );

    const right = Math.min(
      G.xmax - 0.02,
      1.12
    );

    const straightY = x =>
      11 + rate * x;

    return new M.VGroup(
      line(
        G.p(left, straightY(left)),
        G.p(right, straightY(right)),
        GOLD,
        3.6
      ),

      glowDot(
        G.p(0, 11),
        GOLD,
        0.11
      ),

      glowDot(
        G.p(h, loss(h)),
        C.green,
        0.085
      )
    );
  }

  function tangentLine(
    G,
    s,
    left = null,
    right = null,
    color = GOLD,
    width = 4
  ) {
    let a = left === null
      ? Math.max(G.xmin, s - 0.65)
      : left;

    let b = right === null
      ? Math.min(G.xmax, s + 0.65)
      : right;

    const m = derivative(s);

    // Clip to the displayed vertical range.

    if (Math.abs(m) > 0.000001) {
      const xAtYmin =
        s + (G.ymin - loss(s)) / m;

      const xAtYmax =
        s + (G.ymax - loss(s)) / m;

      a = Math.max(
        a,
        Math.min(xAtYmin, xAtYmax)
      );

      b = Math.min(
        b,
        Math.max(xAtYmin, xAtYmax)
      );
    }

    return line(
      G.p(a, tangentValue(s, a)),
      G.p(b, tangentValue(s, b)),
      color,
      width
    );
  }

  function tangentMarks(
    G,
    s,
    left = null,
    right = null
  ) {
    return new M.VGroup(
      tangentLine(
        G,
        s,
        left,
        right,
        GOLD,
        4
      ),

      glowDot(
        G.p(s, loss(s)),
        GOLD,
        0.12
      )
    );
  }

  // ------------------------------------------------------------
  // RENT PICTURE FOR THE HALF-STEP CALCULATION
  // ------------------------------------------------------------

  function rentGraph(s) {
    const G = graph({
      xmin: -1.50,
      xmax: 1.50,
      ymin: 8,
      ymax: 14,
      xticks: [-1, 0, 1],
      yticks: [9, 10, 11, 12, 13],
      xlabel: 'size step',
      ylabel: 'rent (hundreds of dollars)'
    });

    const guesses = prediction(s);
    const items = [...G.items];

    items.push(line(
      G.p(-1.2, MIDDLE - 1.2 * s),
      G.p(1.2, MIDDLE + 1.2 * s),
      GOLD,
      4
    ));

    STEPS.forEach((x, k) => {
      items.push(glowDot(
        G.p(x, RENTS[k]),
        COLORS[k],
        0.105
      ));

      items.push(txt(
        String(RENTS[k]),
        18,
        COLORS[k],
        [
          G.X(x) - (Math.abs(guesses[k] - RENTS[k]) < 1 && guesses[k] > RENTS[k] ? 0 : 0.29),
          G.Y(RENTS[k]) + (Math.abs(guesses[k] - RENTS[k]) < 1 && guesses[k] > RENTS[k] ? -0.30 : 0.15),
          0
        ],
        true
      ));

      items.push(
        dot(
          G.p(x, guesses[k]),
          GOLD,
          0.075
        )
      );

      items.push(txt(
        fmt(guesses[k]),
        18,
        GOLD,
        [
          G.X(x) + 0.34,
          G.Y(guesses[k]) + (guesses[k] > RENTS[k] ? 0.31 : -0.31),
          0
        ],
        true
      ));
    });

    G.g = new M.VGroup(...items);

    return G;
  }

  function rentMissMarks(G, s) {
    const vals = prediction(s);
    const errs = misses(s);

    const items = [];

    STEPS.forEach((x, k) => {
      const a = G.p(x, RENTS[k]);
      const b = G.p(x, vals[k]);

      items.push(
        arrow(a, b, C.violet, 3.0)
      );

      items.push(txt(
        signed(errs[k]),
        18,
        C.violet,
        [
          G.X(x) + (Math.abs(errs[k]) < 1 ? -0.56 : 0.38),
          (a[1] + b[1]) / 2,
          0
        ],
        true
      ));
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 0 — Recall the U-shaped loss.
  // ------------------------------------------------------------

  let G = fullLossGraph();

  await until(S(0));

  await play(
    ...putPicture(G.g),
    ...say('RECALL THE U-SHAPED LOSS')
  );

  // ------------------------------------------------------------
  // 1 — Middle rent fixed at 10; starting loss is 11.
  // ------------------------------------------------------------

  const startingMarks = new M.VGroup(
    dash(
      G.p(0, 0),
      G.p(0, 11),
      GOLD,
      2
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.12
    ),

    txt(
      '11',
      21,
      GOLD,
      [
        G.X(0) + 0.37,
        G.Y(11) + 0.17,
        0
      ],
      true
    )
  );

  await until(S(1));

  await play(
    ...putMarks(startingMarks),
    ...fbox([
      ['middle rent = 10', C.muted],
      'step price  = 0',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('START: STEP PRICE 0, LOSS 11', GOLD)
  );

  // ------------------------------------------------------------
  // 2 — Recall the average change from zero to one.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...putMarks(gapMarks(G, 1)),
    ...fbox([
      'input: 0 → 1',
      'loss: 11 → 5',
      '(5 − 11) ÷ 1',
      ['average change = −6', GOLD]
    ], GOLD),
    ...say('AVERAGE CHANGE FROM 0 TO 1 = −6', GOLD)
  );

  // ------------------------------------------------------------
  // 3 — We want the steepness at the starting point itself.
  // ------------------------------------------------------------

  const hereMarks = new M.VGroup(
    glowDot(
      G.p(0, 11),
      GOLD,
      0.13
    ),

    ring(
      G.p(0, 11),
      GOLD,
      0.29
    ),

    txt(
      'right here',
      19,
      GOLD,
      [
        G.X(0) + 0.96,
        G.Y(11) - 0.18,
        0
      ]
    )
  );

  await until(S(3));

  await play(
    ...putMarks(hereMarks),
    ...fbox([
      'not the whole stretch',
      ['steepness at 0?', GOLD]
    ], GOLD),
    ...say('HOW STEEP IS IT RIGHT HERE?', GOLD)
  );

  // ------------------------------------------------------------
  // 4 — Bring the second point closer.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...putMarks(extendedSecant(G, 1)),
    ...clearBox(),
    ...say('BRING THE SECOND POINT CLOSER', C.green)
  );

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.5),
      { runTime: 0.65 }
    )
  );

  // ------------------------------------------------------------
  // 5 — The gap is now one half.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...putMarks(
      gapMarks(
        G,
        0.5,
        true,
        true,
        false
      )
    ),
    ...fbox([
      'first input  = 0',
      'second input = 0.5',
      ['gap = 0.5', GOLD]
    ], GOLD),
    ...say('GAP = ONE HALF', GOLD)
  );

  // ------------------------------------------------------------
  // 6 — Return to the rent picture.
  // Guesses: 9.5, 10, 10.5.
  // ------------------------------------------------------------

  const R = rentGraph(0.5);

  await until(S(6));

  await play(
    ...clearMarks(),
    ...putPicture(R.g),
    ...fbox([
      'middle rent = 10',
      'step price  = 0.5',
      ['guesses:', GOLD],
      '9.5, 10, 10.5'
    ], GOLD),
    ...say('STEP PRICE 0.5: NEW GUESSES', GOLD)
  );

  // ------------------------------------------------------------
  // 7 — Draw the signed misses.
  // +0.5, −1, −2.5.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...putMarks(rentMissMarks(R, 0.5)),
    ...fbox([
      ['9.5 − 9   = +0.5', COLORS[0]],
      ['10 − 11   = −1', COLORS[1]],
      ['10.5 − 13 = −2.5', COLORS[2]]
    ], C.violet),
    ...say('MISS = GUESS − REAL RENT', C.violet)
  );

  // ------------------------------------------------------------
  // 8 — Square the misses and add.
  // 0.25 + 1 + 6.25 = 7.5.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...fbox([
      '0.5² = 0.25',
      '(−1)² = 1',
      '(−2.5)² = 6.25',
      ['loss = 7.5', GOLD]
    ], GOLD),
    ...say('SQUARE AND ADD: LOSS = 7.5', GOLD)
  );

  // ------------------------------------------------------------
  // 9 — Return to the loss curve.
  // Loss change: 7.5 − 11 = −3.5.
  // ------------------------------------------------------------

  G = fullLossGraph();

  await until(S(9));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      'old loss = 11',
      'new loss = 7.5',
      ['7.5 − 11 = −3.5', C.violet]
    ], C.violet),
    ...say('LOSS DROPS BY 3.5', C.violet)
  );

  await play(
    ...putMarks(
      gapMarks(G, 0.5, true, false, true)
    )
  );

  // ------------------------------------------------------------
  // 10 — Divide by the half-unit input gap.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...putMarks(gapMarks(G, 0.5)),
    ...fbox([
      ['loss change = −3.5', C.violet],
      ['input gap   = 0.5', GOLD],
      ['−3.5 ÷ 0.5 = −7', C.green]
    ], C.green),
    ...say('−3.5 FOR HALF A STEP', C.green)
  );

  // ------------------------------------------------------------
  // 11 — Shorter gap: average change is −7.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    new M.Indicate(
      marksNow,
      { color: GOLD }
    ),
    ...fbox([
      'gap 1   → −6',
      ['gap 0.5 → −7', GOLD],
      ['shorter gap', C.muted]
    ], GOLD),
    ...say('AVERAGE CHANGE = −7', GOLD)
  );

  // ------------------------------------------------------------
  // 12 — Shrink the gap to one tenth.
  // Magnify the region near step price zero.
  // ------------------------------------------------------------

  G = zoomLossGraph(0.1);

  await until(S(12));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      ['gap = 0.1', GOLD],
      'loss(0)   = 11',
      ['loss(0.1) = 10.22', C.green]
    ], GOLD),
    ...say('ZOOM IN: GAP = 0.1', GOLD)
  );

  await play(
    ...putMarks(
      gapMarks(G, 0.1, true, true, false)
    )
  );

  // ------------------------------------------------------------
  // 13 — Loss change −0.78; average change −7.8.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...putMarks(gapMarks(G, 0.1)),
    ...fbox([
      '10.22 − 11',
      ['= −0.78', C.violet],
      '−0.78 ÷ 0.1',
      ['= −7.8', GOLD]
    ], GOLD),
    ...say('AVERAGE CHANGE = −7.8', GOLD)
  );

  // ------------------------------------------------------------
  // 14 — Shrink again to one hundredth.
  // Exact loss = 10.9202.
  // Exact change = −0.0798.
  // ------------------------------------------------------------

  G = zoomLossGraph(0.01);

  await until(S(14));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      ['gap = 0.01', GOLD],
      'loss = 10.9202',
      '−0.0798 ÷ 0.01',
      ['= −7.98', C.green]
    ], C.green),
    ...say('ZOOM CLOSER: GAP = 0.01', GOLD)
  );

  await play(
    ...putMarks(gapMarks(G, 0.01))
  );

  // ------------------------------------------------------------
  // 15 — Compare the readings as the gap shrinks.
  // ------------------------------------------------------------

  function convergencePicture(highlightLast = false) {
    const rowH = P ? 0.96 : 0.58;
    const startY = P ? 0.66 : 0.60;

    const left = CX - 1.76;
    const right = CX + 1.60;

    const items = [];

    items.push(txt(
      'INPUT GAP',
      17,
      C.muted,
      [left, startY + rowH * 0.72, 0],
      true
    ));

    items.push(txt(
      'AVERAGE CHANGE',
      17,
      C.muted,
      [right, startY + rowH * 0.72, 0],
      true,
      2.65
    ));

    const gaps = [1, 0.5, 0.1, 0.01];
    const rates = [-6, -7, -7.8, -7.98];

    gaps.forEach((h, k) => {
      const y = startY - k * rowH;

      const borderColor =
        k === 3 ? GOLD : C.muted;

      const row = rounded(
        5.55,
        rowH * 0.87,
        [CX, y, 0],
        borderColor,
        0.90
      );

      items.push(row);

      items.push(txt(
        fmt(h),
        23,
        GOLD,
        [left, y, 0],
        true
      ));

      items.push(txt(
        '→',
        20,
        C.muted,
        [CX, y, 0]
      ));

      items.push(txt(
        fmt(rates[k]),
        25,
        k === 3 ? GOLD : C.cyan,
        [right, y, 0],
        true
      ));
    });

    if (highlightLast) {
      const y = startY - 4 * rowH;

      items.push(txt(
        '↓',
        25,
        GOLD,
        [right, y + rowH * 0.50, 0]
      ));

      items.push(txt(
        'approaches',
        18,
        C.muted,
        [left, y, 0]
      ));

      items.push(txt(
        '−8',
        30,
        GOLD,
        [right, y, 0],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  await until(S(15));

  await play(
    ...clearMarks(),
    ...putPicture(convergencePicture()),
    ...fbox([
      'gap gets smaller',
      '1 → 0.5 → 0.1 → 0.01',
      ['−6 → −7 → −7.8 → −7.98', GOLD]
    ], GOLD),
    ...say('SHRINK THE GAP, WATCH THE READING')
  );

  // ------------------------------------------------------------
  // 16 — The readings approach minus eight.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...putPicture(convergencePicture(true)),
    ...fbox([
      'gap approaches 0',
      ['average change', C.cyan],
      ['approaches −8', GOLD]
    ], GOLD),
    ...say('THE READINGS SETTLE ON −8', GOLD)
  );

  // ------------------------------------------------------------
  // 17 — Name the straight path: secant line.
  // ------------------------------------------------------------

  G = fullLossGraph();

  await until(S(17));

  await play(
    ...putPicture(G.g),
    ...putMarks(extendedSecant(G, 1)),
    ...fbox([
      ['SECANT LINE', GOLD],
      'straight line through',
      'two points on a curve'
    ], GOLD),
    ...say('TWO POINTS: A SECANT LINE', GOLD)
  );

  // ------------------------------------------------------------
  // 18 — Animate the second dot moving toward the first.
  // The extended secant turns toward the tangent.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...say('WATCH THE SECANT TURN', C.green),
    ...fbox([
      'gap: 1 → 0.5',
      ['average change: −7', GOLD]
    ], GOLD),
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.5),
      { runTime: 0.90 }
    )
  );

  await until(S(18) + 1.75);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.1),
      { runTime: 0.95 }
    ),
    ...fbox([
      'gap: 0.1',
      ['average change: −7.8', GOLD]
    ], GOLD)
  );

  await until(S(18) + 3.50);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.01),
      { runTime: 0.95 }
    ),
    ...fbox([
      'gap: 0.01',
      ['average change: −7.98', GOLD]
    ], GOLD)
  );

  await until(S(18) + 5.0);

  await play(
    ...putMarks(
      tangentMarks(G, 0, -0.12, 1.12)
    ),
    ...fbox([
      'gap tends to 0',
      ['steepness tends to −8', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 19 — Name the touching line: tangent.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    new M.Indicate(
      marksNow,
      { color: GOLD }
    ),
    ...fbox([
      ['TANGENT LINE', GOLD],
      'matches the curve',
      'at the chosen point'
    ], GOLD),
    ...say('ONE POINT: A TANGENT LINE', GOLD)
  );

  // ------------------------------------------------------------
  // 20 — The tangent slope is the derivative.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...fbox([
      ['DERIVATIVE', GOLD],
      'slope of the tangent',
      'at step price 0',
      ['= −8', GOLD]
    ], GOLD),
    ...say('DERIVATIVE AT 0 = −8', GOLD)
  );

  // ------------------------------------------------------------
  // 21 — A derivative is steepness at one point.
  // ------------------------------------------------------------

  const pointFocus = new M.VGroup(
    tangentLine(
      G,
      0,
      -0.12,
      0.75,
      GOLD,
      4
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.13
    ),

    ring(
      G.p(0, 11),
      GOLD,
      0.25
    ),

    txt(
      'one point',
      18,
      GOLD,
      [
        G.X(0) + 0.83,
        G.Y(11) + 0.13,
        0
      ]
    )
  );

  await until(S(21));

  await play(
    ...putMarks(pointFocus),
    ...fbox([
      'average change:',
      'steepness over a gap',
      ['derivative:', GOLD],
      ['steepness at one point', GOLD]
    ], GOLD),
    ...say('STEEPNESS AT ONE SINGLE POINT', GOLD)
  );

  // ------------------------------------------------------------
  // 22 — Interpret minus eight.
  // A tiny move right produces a larger move down.
  // ------------------------------------------------------------

  G = zoomLossGraph(0.1);

  function localDirectionMarks(G, h) {
    const a = G.p(0, 11);
    const corner = G.p(h, 11);
    const b = G.p(
      h,
      tangentValue(0, h)
    );

    return new M.VGroup(
      tangentLine(
        G,
        0,
        0,
        G.xmax,
        GOLD,
        3.8
      ),

      glowDot(a, GOLD, 0.11),

      arrow(
        a,
        corner,
        GOLD,
        3
      ),

      arrow(
        corner,
        b,
        C.violet,
        3.2
      ),

      txt(
        'input grows',
        17,
        GOLD,
        [
          (a[0] + corner[0]) / 2,
          a[1] - 0.25,
          0
        ]
      ),

      txt(
        'loss falls',
        17,
        C.violet,
        [
          corner[0] - 0.73,
          (corner[1] + b[1]) / 2,
          0
        ],
        false,
        1.3
      )
    );
  }

  await until(S(22));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(localDirectionMarks(G, 0.1)),
    ...fbox([
      ['negative derivative', C.violet],
      'move right → go downhill',
      ['derivative = −8', GOLD]
    ], GOLD),
    ...say('NEGATIVE MEANS DOWNHILL', C.violet)
  );

  await until(S(22) + 5.5);

  await play(
    ...fbox([
      ['tiny input increase', GOLD],
      ['loss falls about', C.violet],
      ['8 times as much', C.violet]
    ], C.violet),
    ...say('NEAR 0: ABOUT 8 TIMES AS MUCH', C.violet)
  );

  // ------------------------------------------------------------
  // 23 — Example: a hundredth of an input unit.
  // Approximate loss change −0.08.
  // Actual loss change −0.0798.
  // ------------------------------------------------------------

  G = zoomLossGraph(0.01);

  const actualTinyChange = new M.VGroup(
    tangentLine(
      G,
      0,
      0,
      G.xmax,
      GOLD,
      3.5
    ),

    ...[
      arrow(
        G.p(0, 11),
        G.p(0.01, 11),
        GOLD,
        3
      ),

      arrow(
        G.p(0.01, 11),
        G.p(0.01, loss(0.01)),
        C.violet,
        3
      )
    ],

    glowDot(
      G.p(0, 11),
      GOLD,
      0.105
    ),

    glowDot(
      G.p(0.01, loss(0.01)),
      C.green,
      0.105
    ),

    txt(
      '+0.01',
      18,
      GOLD,
      [
        (G.X(0) + G.X(0.01)) / 2,
        G.Y(11) - 0.24,
        0
      ],
      true
    ),

    txt(
      '≈ −0.08',
      18,
      C.violet,
      [
        G.X(0.01) - 0.68,
        (G.Y(11) + G.Y(loss(0.01))) / 2,
        0
      ],
      true
    )
  );

  await until(S(23));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(actualTinyChange),
    ...fbox([
      'input change = +0.01',
      ['−8 × 0.01 = −0.08', GOLD],
      'actual: −0.0798',
      ['almost the same', C.green]
    ], C.green),
    ...say('A TINY MOVE: +0.01 → ABOUT −0.08')
  );

  // ------------------------------------------------------------
  // 24 — Repeat the process elsewhere on the curve.
  // ------------------------------------------------------------

  G = fullLossGraph();

  await until(S(24));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(
      tangentMarks(G, 0, -0.12, 0.75)
    ),
    ...clearBox(),
    ...say('WE CAN DO THIS AT ANY POINT')
  );

  // ------------------------------------------------------------
  // 25 — Derivative at one: minus four.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...putMarks(tangentMarks(G, 1)),
    ...fbox([
      'step price = 1',
      'loss = 5',
      ['derivative = −4', GOLD],
      ['downhill, but gentler', C.violet]
    ], GOLD),
    ...say('AT 1: DERIVATIVE = −4', GOLD)
  );

  // ------------------------------------------------------------
  // 26 — Derivative at two: zero.
  // ------------------------------------------------------------

  const bottomTangent = new M.VGroup(
    tangentLine(
      G,
      2,
      1.15,
      2.85,
      GOLD,
      4
    ),

    glowDot(
      G.p(2, 3),
      GOLD,
      0.13
    ),

    txt(
      'flat',
      19,
      C.green,
      [
        G.X(2),
        G.Y(3) - 0.36,
        0
      ]
    )
  );

  await until(S(26));

  await play(
    ...putMarks(bottomTangent),
    ...fbox([
      'step price = 2',
      'loss = 3',
      ['derivative = 0', GOLD],
      ['horizontal tangent', C.green]
    ], C.green),
    ...say('AT THE BOTTOM: DERIVATIVE = 0', C.green)
  );

  // ------------------------------------------------------------
  // 27 — Derivative at three: plus four.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...putMarks(tangentMarks(G, 3)),
    ...fbox([
      'step price = 3',
      'loss = 5',
      ['derivative = +4', GOLD],
      ['uphill', C.green]
    ], GOLD),
    ...say('AT 3: DERIVATIVE = +4', C.green)
  );

  // ------------------------------------------------------------
  // 28 — Compare the four tangent slopes.
  // They rise by four per unit of step price.
  // Derivative = 4 × (step price − 2).
  // ------------------------------------------------------------

  function fourTangents(G) {
    const items = [];

    const positions = [
      {
        s: 0,
        left: -0.10,
        right: 0.45,
        dx: 0.48,
        dy: -0.05
      },
      {
        s: 1,
        left: 0.64,
        right: 1.36,
        dx: -0.30,
        dy: -0.38
      },
      {
        s: 2,
        left: 1.65,
        right: 2.35,
        dx: 0,
        dy: -0.35
      },
      {
        s: 3,
        left: 2.64,
        right: 3.36,
        dx: 0.31,
        dy: -0.38
      }
    ];

    positions.forEach(q => {
      const rate = derivative(q.s);

      items.push(
        tangentLine(
          G,
          q.s,
          q.left,
          q.right,
          GOLD,
          3.5
        )
      );

      items.push(
        glowDot(
          G.p(q.s, loss(q.s)),
          GOLD,
          0.09
        )
      );

      items.push(txt(
        signed(rate),
        20,
        GOLD,
        [
          G.X(q.s) + q.dx,
          G.Y(loss(q.s)) + q.dy,
          0
        ],
        true
      ));
    });

    return new M.VGroup(...items);
  }

  await until(S(28));

  await play(
    ...putMarks(fourTangents(G)),
    ...fbox([
      'step price: 0  1  2  3',
      ['derivative: −8 −4 0 +4', GOLD]
    ], GOLD),
    ...say('THE TANGENTS GET STEEPER AS WE MOVE RIGHT')
  );

  await until(S(28) + 4.3);

  await play(
    ...fbox([
      ['−8 → −4 → 0 → +4', GOLD],
      ['    +4   +4   +4', C.green],
      'same increase each time'
    ], C.green),
    ...say('THE DERIVATIVE GROWS BY 4 EACH STEP', C.green)
  );

  await until(S(28) + 8.4);

  await play(
    ...fbox([
      ['DERIVATIVE RULE', GOLD],
      '4 × (step price − 2)'
    ], GOLD),
    ...say('DERIVATIVE = 4 × (STEP PRICE − 2)', GOLD)
  );

  // ------------------------------------------------------------
  // 29 — Check the derivative rule at zero.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...putMarks(
      tangentMarks(G, 0, -0.12, 0.75)
    ),
    ...fbox([
      'step price = 0',
      '4 × (0 − 2)',
      '4 × (−2)',
      ['= −8', GOLD]
    ], GOLD),
    ...say('CHECK AT ZERO: −8', GOLD)
  );

  // ------------------------------------------------------------
  // 30 — General definition.
  // Derivative = limiting average change as the input gap
  // approaches zero.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...putMarks(
      extendedSecant(G, 0.1)
    ),
    ...fbox([
      ['DERIVATIVE', GOLD],
      'average change as',
      'the input gap',
      ['approaches 0', C.green]
    ], GOLD),
    ...say('SHRINK THE GAP TOWARD ZERO', GOLD)
  );

  await until(S(30) + 3.0);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.01),
      { runTime: 1.1 }
    )
  );

  // ------------------------------------------------------------
  // 31 — Zoom until the curve looks straight.
  // ------------------------------------------------------------

  G = zoomLossGraph(0.01);

  const zoomTangent = new M.VGroup(
    tangentLine(
      G,
      0,
      0,
      G.xmax,
      GOLD,
      3.0
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.11
    )
  );

  await until(S(31));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(zoomTangent),
    ...fbox([
      'zoom in',
      'curve looks straight',
      ['read its steepness', GOLD]
    ], GOLD),
    ...say('ZOOM IN, THEN READ THE STEEPNESS', GOLD)
  );

  // ------------------------------------------------------------
  // 32 — Sign gives direction; magnitude gives steepness.
  // ------------------------------------------------------------

  G = fullLossGraph();

  const directionComparison = new M.VGroup(
    tangentLine(
      G,
      0,
      -0.10,
      0.55,
      C.violet,
      3.6
    ),

    arrow(
      G.p(0, 11),
      G.p(0.45, tangentValue(0, 0.45)),
      C.violet,
      3.4
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.10
    ),

    txt(
      '−8',
      20,
      C.violet,
      [
        G.X(0) + 0.20,
        G.Y(9.5) - 0.20,
        0
      ],
      true
    ),

    tangentLine(
      G,
      3,
      2.55,
      3.45,
      C.green,
      3.6
    ),

    arrow(
      G.p(3, 5),
      G.p(3.43, tangentValue(3, 3.43)),
      C.green,
      3.4
    ),

    glowDot(
      G.p(3, 5),
      GOLD,
      0.10
    ),

    txt(
      '+4',
      20,
      C.green,
      [
        G.X(3) + 0.55,
        G.Y(5) - 0.10,
        0
      ],
      true
    )
  );

  await until(S(32));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(directionComparison),
    ...fbox([
      ['SIGN = DIRECTION', C.cyan],
      '− downhill, + uphill',
      ['SIZE = STEEPNESS', GOLD],
      '8 is steeper than 4'
    ], C.cyan),
    ...say('WHICH WAY? HOW STEEP RIGHT HERE?')
  );

  // ------------------------------------------------------------
  // 33 — Zero derivative marks a flat spot.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...putMarks(
      tangentMarks(G, 2, 1.2, 2.8)
    ),
    ...fbox([
      'step price = 2',
      ['derivative = 0', GOLD],
      ['flat spot', C.green]
    ], C.green),
    ...say('ZERO DERIVATIVE = FLAT SPOT', C.green)
  );

  // ------------------------------------------------------------
  // 34 — Trap: the derivative is local.
  // ------------------------------------------------------------

  function localWarning(G) {
    const a = G.p(0, 11);

    return new M.VGroup(
      ring(
        a,
        GOLD,
        0.33
      ),

      glowDot(
        a,
        GOLD,
        0.12
      ),

      tangentLine(
        G,
        0,
        -0.10,
        0.29,
        GOLD,
        4
      ),

      txt(
        'near here',
        18,
        GOLD,
        [
          a[0] + 0.92,
          a[1] + 0.03,
          0
        ]
      )
    );
  }

  await until(S(34));

  await play(
    ...putMarks(localWarning(G)),
    ...fbox([
      ['TRAP', GOLD],
      'the derivative is',
      ['a local reading', GOLD]
    ], GOLD),
    ...say('TRUE NEAR THE CHOSEN POINT', GOLD)
  );

  // ------------------------------------------------------------
  // 35 — Extend the tangent too far.
  // Incorrect prediction at one: 11 − 8 = 3.
  // ------------------------------------------------------------

  function predictedLossMarks(G) {
    const p0 = G.p(0, 11);
    const p1 = G.p(1, 3);

    return new M.VGroup(
      tangentLine(
        G,
        0,
        -0.10,
        1.0,
        GOLD,
        4
      ),

      glowDot(
        p0,
        GOLD,
        0.11
      ),

      ring(
        p1,
        GOLD,
        0.15
      ),

      dash(
        G.p(1, 0),
        p1,
        GOLD,
        1.8
      ),

      txt(
        'predicted 3',
        17,
        GOLD,
        [
          p1[0] + 0.75,
          p1[1] - 0.18,
          0
        ],
        false,
        1.60
      )
    );
  }

  await until(S(35));

  await play(
    ...putMarks(predictedLossMarks(G)),
    ...fbox([
      'derivative at 0 = −8',
      'try moving a whole 1',
      '11 + (−8 × 1)',
      ['predicted loss = 3', GOLD]
    ], GOLD),
    ...say('WHAT IF WE TRUST −8 ALL THE WAY?', GOLD)
  );

  // ------------------------------------------------------------
  // 36 — Actual loss at one is five, not three.
  // The curve bends away from the tangent.
  // ------------------------------------------------------------

  const actualVsPredicted = new M.VGroup(
    tangentLine(
      G,
      0,
      -0.10,
      1,
      GOLD,
      3.5
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.105
    ),

    ring(
      G.p(1, 3),
      GOLD,
      0.15
    ),

    glowDot(
      G.p(1, 5),
      C.green,
      0.12
    ),

    arrow(
      G.p(1, 3),
      G.p(1, 5),
      C.violet,
      3.0
    ),

    txt(
      'real: 5',
      18,
      C.green,
      [
        G.X(1) + 0.61,
        G.Y(5) + 0.20,
        0
      ],
      false,
      1.40
    ),

    txt(
      'predicted: 3',
      17,
      GOLD,
      [
        G.X(1) + 0.78,
        G.Y(3) - 0.18,
        0
      ],
      false,
      1.65
    )
  );

  await until(S(36));

  await play(
    ...putMarks(actualVsPredicted),
    ...fbox([
      ['tangent predicts 3', GOLD],
      ['actual loss is 5', C.green],
      ['difference = 2', C.violet],
      'the curve bends'
    ], C.violet),
    ...say('REAL LOSS = 5, NOT 3', C.green)
  );

  // ------------------------------------------------------------
  // 37 — Local reading, not a promise for long moves.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    new M.Indicate(
      marksNow,
      { color: C.violet }
    ),
    ...fbox([
      ['DERIVATIVE', GOLD],
      'good for tiny moves',
      'not a promise',
      'for long moves'
    ], GOLD),
    ...say('LOCAL STEEPNESS, NOT A LONG-RANGE PROMISE', GOLD)
  );

  // ------------------------------------------------------------
  // 38 — Try it preview.
  // The actual slider belongs to the Try it interface.
  // Preview the second dot approaching the fixed point.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...putMarks(
      extendedSecant(G, 1)
    ),
    ...fbox([
      ['TRY IT', GOLD],
      'slide the second dot',
      ['gap = 1', C.green],
      'average change = −6'
    ], GOLD),
    ...say('SLIDE THE SECOND DOT CLOSER', C.green)
  );

  await until(S(38) + 1.5);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.5),
      { runTime: 0.75 }
    ),
    ...fbox([
      ['gap = 0.5', C.green],
      'average change = −7'
    ], GOLD)
  );

  await until(S(38) + 2.9);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.1),
      { runTime: 0.75 }
    ),
    ...fbox([
      ['gap = 0.1', C.green],
      'average change = −7.8'
    ], GOLD)
  );

  await until(S(38) + 4.25);

  await play(
    new M.Transform(
      marksNow,
      extendedSecant(G, 0.01),
      { runTime: 0.65 }
    ),
    ...fbox([
      ['gap = 0.01', C.green],
      'average change = −7.98',
      ['approaches −8', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 39 — Challenge: find the point where derivative is zero.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...clearMarks(),
    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'where is the',
      ['derivative = 0?', C.green],
      'look for a flat tangent'
    ], GOLD),
    ...say('FIND THE FLAT TANGENT', C.green)
  );

  // ------------------------------------------------------------
  // 40 — Recap.
  // Average change over a shrinking gap becomes the
  // derivative: the steepness at one point.
  // ------------------------------------------------------------

  const recapMarks = new M.VGroup(
    line(
      G.p(0, 11),
      G.p(1, 5),
      C.muted,
      2.6
    ),

    dot(
      G.p(1, 5),
      C.muted,
      0.075
    ),

    line(
      G.p(0, 11),
      G.p(0.5, loss(0.5)),
      C.green,
      3.0
    ),

    dot(
      G.p(0.5, loss(0.5)),
      C.green,
      0.075
    ),

    tangentLine(
      G,
      0,
      -0.10,
      1.12,
      GOLD,
      4.0
    ),

    glowDot(
      G.p(0, 11),
      GOLD,
      0.13
    ),

    txt(
      '−8',
      23,
      GOLD,
      [
        G.X(0.61) + 0.15,
        G.Y(tangentValue(0, 0.61)) + 0.38,
        0
      ],
      true
    )
  );

  await until(S(40));

  await play(
    ...putMarks(recapMarks),
    ...fbox([
      ['DERIVATIVE', GOLD],
      'steepness at one point',
      'found by shrinking',
      ['the average-change gap', C.cyan]
    ], GOLD),
    ...say('DERIVATIVE = STEEPNESS AT ONE POINT', GOLD)
  );

  await until(E(40));
}
