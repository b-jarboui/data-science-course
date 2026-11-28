// lesson 14.2.3
// Soft assignment: keeping track of uncertainty about group membership.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Fixed normal vibration readings: 2, 3, 4, 6, 7, 8 mm/s.
// Gaussian centers: 2 and 8.
// Standard deviations: 2 and 2.
// Mixture weights: 0.5 and 0.5.
//
// Reading C at vibration 4:
//   Slow membership ≈ 81.76%.
//   Fast membership ≈ 18.24%.
//
// New reading G at vibration 5:
//   Slow membership = 50%.
//   Fast membership = 50%.
//
// All calculations retain full numerical precision.
// The six original readings never change position.
// The Try it controls illustrate the separate interactive simulation.
// Browser rendering has not been verified against the engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  // ================================================================

  const DATA = [
    { id: 'A', x: 2, temperature: 20, mode: 'slow' },
    { id: 'B', x: 3, temperature: 21, mode: 'slow' },
    { id: 'C', x: 4, temperature: 22, mode: 'slow' },
    { id: 'D', x: 6, temperature: 22, mode: 'fast' },
    { id: 'E', x: 7, temperature: 23, mode: 'fast' },
    { id: 'F', x: 8, temperature: 24, mode: 'fast' }
  ];

  const G = {
    id: 'G',
    x: 5,
    temperature: 22,
    mode: 'unknown'
  };

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  const BLUE_FILL = '#223D60';
  const ORANGE_FILL = '#603D25';

  const MODEL = {
    mu1: 2,
    mu2: 8,
    sigma1: 2,
    sigma2: 2,
    w1: 0.5,
    w2: 0.5
  };

  // ================================================================
  // EXACT GAUSSIAN AND MEMBERSHIP CALCULATIONS
  //
  // Weighted density:
  //
  //   q1(x) = w1 * g1(x)
  //   q2(x) = w2 * g2(x)
  //
  // Combined density:
  //
  //   p(x) = q1(x) + q2(x)
  //
  // Membership probabilities:
  //
  //   r1(x) = q1(x) / p(x)
  //   r2(x) = q2(x) / p(x)
  //
  // The probabilities sum to 1.
  //
  // These are conditional probabilities under the assumed model.
  // They are not guaranteed to identify the true operating mode.
  // ================================================================

  function gaussian(x, mu, sigma) {
    const z = (x - mu) / sigma;

    return (
      Math.exp(-0.5 * z * z) /
      (sigma * Math.sqrt(2 * Math.PI))
    );
  }

  function weightedBlue(x) {
    return MODEL.w1 * gaussian(
      x,
      MODEL.mu1,
      MODEL.sigma1
    );
  }

  function weightedOrange(x) {
    return MODEL.w2 * gaussian(
      x,
      MODEL.mu2,
      MODEL.sigma2
    );
  }

  function mixture(x) {
    return (
      weightedBlue(x) +
      weightedOrange(x)
    );
  }

  function membership(x) {
    const blue = weightedBlue(x);
    const orange = weightedOrange(x);
    const total = blue + orange;

    return {
      x,
      blue,
      orange,
      total,
      slow: blue / total,
      fast: orange / total
    };
  }

  function fmt(value, digits = 6) {
    return value.toFixed(digits);
  }

  function percent(value, digits = 2) {
    return `${(100 * value).toFixed(digits)}%`;
  }

  const AT4 = membership(4);
  const AT5 = membership(5);
  const AT2 = membership(2);
  const AT6 = membership(6);

  // Checked values at vibration 4:
  //
  // Blue contribution:   0.060493
  // Orange contribution: 0.013498
  // Combined density:   0.073990
  //
  // Slow membership: 81.76%
  // Fast membership: 18.24%
  //
  // Checked values at vibration 5:
  //
  // Blue contribution:   0.032379
  // Orange contribution: 0.032379
  // Combined density:   0.064759
  //
  // Slow membership: 50%
  // Fast membership: 50%
  //
  // Checked Try it examples:
  //
  // x = 2:
  //   Slow ≈ 98.90%
  //   Fast ≈ 1.10%
  //
  // x = 6:
  //   Slow ≈ 18.24%
  //   Fast ≈ 81.76%
  //
  // Displayed rounded density contributions need not add
  // exactly to the displayed rounded total.
  // Every total and probability is calculated before rounding.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Laptop: 14.22 × 8.
  //
  // Phone: formula box above the main picture.
  // Laptop: formula box beside the main picture.
  //
  // Keep one fixed density scale throughout this lesson.
  //
  // The vertical density scale is enlarged relative to the
  // previous lesson because only weighted curves are needed.
  //
  // Reserve space below the graph for the membership bar.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.45, -0.30, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = -6;
  const XMAX = 16;

  const XLEFT = P ? -3.17 : -6.15;
  const XRIGHT = P ? 3.17 : 1.35;

  const BASE = P ? -3.60 : -1.75;
  const YTOP = P ? 1.50 : 1.30;

  const MAX_DENSITY = 0.12;

  function px(x) {
    return (
      XLEFT +
      (x - XMIN) / (XMAX - XMIN) *
      (XRIGHT - XLEFT)
    );
  }

  function py(y) {
    return (
      BASE +
      y / MAX_DENSITY *
      (YTOP - BASE)
    );
  }

  function gp(x, y = 0) {
    return point(px(x), py(y));
  }

  // ================================================================
  // BASIC VISUAL HELPERS
  // ================================================================

  function textAt(
    s,
    p,
    size,
    color = C.ink,
    mono = false
  ) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function lineAt(
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

  function dashedAt(
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

  function rectAt(
    p,
    width,
    height,
    color,
    opacity = 0.08,
    strokeWidth = 1.5
  ) {
    const r = new M.R.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  // Use the standard engine RoundedRectangle constructor.
  // This helper is used throughout the scene.

  function roundedAt(
    p,
    width,
    height,
    color,
    opacity = 0.08,
    strokeWidth = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function blockAt(
    p,
    width,
    height,
    color,
    opacity = 0.85,
    strokeWidth = 1.2
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function circleAt(
    p,
    radius,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    c.setFill(color, opacity);
    c.moveTo(p);

    return c;
  }

  function fittedPill(
    s,
    color,
    size,
    p,
    maxw
  ) {
    const g = pill(s, color, size);

    if (g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
    }

    g.moveTo(p);

    return g;
  }

  function lag(
    animations,
    runTime = 1.1,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      animations,
      { lagRatio, runTime }
    );
  }

  function fadeAll(objects) {
    return objects.map(obj =>
      new M.FadeOut(obj)
    );
  }

  // ================================================================
  // FORMULA / EXPLANATION BOX
  //
  // lines = ['text' | ['text', color]]
  //
  // Only one formula box is visible at a time.
  // Leading spaces indent monospace rows.
  // ================================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 23;
    const lh = P ? 0.34 : 0.46;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

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
      rows.length * lh + 0.34;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
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

    const maxw = P ? FW - 1.0 : 4.9;
    const maxh = P ? 1.95 : 3.45;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const a = [];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;
    a.push(new M.FadeIn(g));

    return a;
  }

  // ================================================================
  // WORKSHOP MACHINE
  //
  // Reuse the same dark housing, cyan flywheel and
  // vibration marks as the previous two lessons.
  // ================================================================

  const MACHINE_Y = P ? -1.30 : -0.40;
  const MK = P ? 1.45 : 1;

  function makeMachine() {
    const x = CX;
    const y = MACHINE_Y;

    const housing = roundedAt(
      point(x, y),
      3.15,
      2.10,
      C.muted,
      0.15,
      2
    );

    const top = roundedAt(
      point(x, y + 1.12),
      2.65,
      0.20,
      C.cyan,
      0.30
    );

    const foot1 = roundedAt(
      point(x - 1.02, y - 1.20),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const foot2 = roundedAt(
      point(x + 1.02, y - 1.20),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const wc = point(
      x - 0.57,
      y + 0.04
    );

    const wheel = circleAt(
      wc,
      0.70,
      C.cyan,
      0.06,
      3
    );

    const spokes = [];

    for (let i = 0; i < 4; i++) {
      const angle =
        Math.PI / 4 + i * Math.PI / 2;

      spokes.push(
        lineAt(
          wc,
          point(
            wc[0] + 0.59 * Math.cos(angle),
            wc[1] + 0.59 * Math.sin(angle)
          ),
          C.cyan,
          2.5
        )
      );
    }

    const hub = circleAt(
      wc,
      0.16,
      C.cyan,
      0.9
    );

    const vents = [];

    for (let i = 0; i < 4; i++) {
      vents.push(
        lineAt(
          point(
            x + 0.48,
            y + 0.43 - i * 0.23
          ),
          point(
            x + 1.13,
            y + 0.43 - i * 0.23
          ),
          C.muted,
          2
        )
      );
    }

    const light = new M.Dot({
      point: point(x + 1.12, y + 0.76),
      radius: 0.075,
      color: C.green
    });

    const shake = [];

    [-1, 1].forEach(side => {
      const xx = x + side * 1.75;

      for (let j = 0; j < 2; j++) {
        const yy =
          y + 0.62 - j * 0.88;

        const a = point(xx, yy);

        const b = point(
          xx + side * 0.15,
          yy - 0.14
        );

        const c = point(
          xx,
          yy - 0.28
        );

        shake.push(
          lineAt(a, b, C.amber, 2.2),
          lineAt(b, c, C.amber, 2.2)
        );
      }
    });

    const floor = lineAt(
      point(x - 2.14, y - 1.37),
      point(x + 2.14, y - 1.37),
      C.muted,
      2
    );

    const mg = new M.VGroup(
      floor,
      housing,
      top,
      foot1,
      foot2,
      wheel,
      ...spokes,
      hub,
      ...vents,
      light,
      ...shake
    );
    if (MK !== 1) mg.scale(MK);
    return mg;
  }

  const machine = makeMachine();

  const readingCard = fittedPill(
    'Vibration: 4 mm/s',
    C.amber,
    P ? 20 : 18,
    point(CX, MACHINE_Y + 1.68 * MK),
    3.35
  );

  const slowQuestion = fittedPill(
    'Slow?',
    BLUE,
    P ? 19 : 17,
    point(
      CX - 1.25,
      MACHINE_Y - 1.82 * MK
    ),
    2.10
  );

  const fastQuestion = fittedPill(
    'Fast?',
    ORANGE,
    P ? 19 : 17,
    point(
      CX + 1.25,
      MACHINE_Y - 1.82 * MK
    ),
    2.10
  );

  // ================================================================
  // FIXED GRAPH AXES
  //
  // Horizontal: vibration in mm/s.
  // Vertical: weighted density.
  //
  // Gaussian tails extend beyond the viewing window.
  // Negative positions are mathematical support, not
  // additional observed vibration readings.
  // ================================================================

  function makeXAxis() {
    const parts = [
      lineAt(
        gp(XMIN),
        gp(XMAX),
        C.muted,
        2.4
      )
    ];

    const ticks = [
      -6, -4, -2, 0,
      2, 3, 4, 5, 6, 7, 8,
      10, 12, 14, 16
    ];

    ticks.forEach(value => {
      const x = px(value);

      parts.push(
        lineAt(
          point(x, BASE - 0.045),
          point(x, BASE + 0.045),
          C.muted,
          1.2
        ),

        textAt(
          String(value).replace('-', '−'),
          point(
            x,
            BASE - (P ? 0.22 : 0.17)
          ),
          P ? 16 : 15,
          C.muted,
          true
        )
      );
    });

    parts.push(
      textAt(
        'Vibration (mm/s)',
        point(
          CX,
          BASE - (P ? 0.55 : 0.43)
        ),
        P ? 20 : 18,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  function makeYAxis() {
    const parts = [
      lineAt(
        gp(XMIN),
        gp(XMIN, MAX_DENSITY),
        C.muted,
        2
      )
    ];

    const ticks = [
      0,
      0.025,
      0.05,
      0.075,
      0.10
    ];

    ticks.forEach(value => {
      const y = py(value);

      if (value > 0) {
        parts.push(
          lineAt(
            point(XLEFT, y),
            point(XRIGHT, y),
            '#293648',
            0.8
          )
        );
      }

      parts.push(
        lineAt(
          point(XLEFT - 0.045, y),
          point(XLEFT + 0.045, y),
          C.muted,
          1.2
        ),

        textAt(
          String(value),
          point(
            XLEFT - (P ? 0.34 : 0.36),
            y
          ),
          P ? 16 : 15,
          C.muted,
          true
        )
      );
    });

    parts.push(
      textAt(
        'Density',
        point(
          XLEFT + 0.53,
          YTOP + 0.15
        ),
        P ? 18 : 16,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const xAxis = makeXAxis();
  const yAxis = makeYAxis();

  // ================================================================
  // FIXED READING MARKERS
  //
  // A–F remain neutral white because their operating modes
  // are hidden from the method.
  //
  // G is a new reading with an unknown operating mode.
  // It is represented by a purple diamond.
  //
  // No hard assignment is made from a membership probability.
  // ================================================================

  function makeReading(d) {
    const p = gp(d.x);

    const halo = new M.Dot({
      point: p,
      radius: 0.145,
      color: C.ink
    });

    halo.setFill(C.ink, 0.13);

    const dot = new M.Dot({
      point: p,
      radius: 0.075,
      color: C.ink
    });

    const label = textAt(
      d.id,
      point(
        p[0],
        BASE + 0.19
      ),
      P ? 16 : 15,
      C.ink,
      true
    );

    return new M.VGroup(
      halo,
      dot,
      label
    );
  }

  const readings = Object.fromEntries(
    DATA.map(d => [
      d.id,
      makeReading(d)
    ])
  );

  function diamondAt(
    p,
    color,
    radius = 0.10
  ) {
    const corners = [
      point(p[0], p[1] + radius),
      point(p[0] + radius, p[1]),
      point(p[0], p[1] - radius),
      point(p[0] - radius, p[1])
    ];

    const halo = new M.Dot({
      point: p,
      radius: radius * 1.65,
      color
    });

    halo.setFill(color, 0.14);

    const edges = corners.map((a, i) =>
      lineAt(
        a,
        corners[(i + 1) % 4],
        color,
        2.5
      )
    );

    return new M.VGroup(
      halo,
      ...edges
    );
  }

  function makeNewReading(d) {
    const marker = diamondAt(
      gp(d.x),
      PURPLE,
      0.10
    );

    const label = textAt(
      d.id,
      point(
        px(d.x),
        BASE + 0.21
      ),
      P ? 16 : 15,
      PURPLE,
      true
    );

    return new M.VGroup(
      marker,
      label
    );
  }

  const readingG = makeNewReading(G);

  let readingGVisible = false;

  function revealG() {
    if (readingGVisible) {
      return [];
    }

    readingGVisible = true;

    return [
      new M.FadeIn(readingG)
    ];
  }

  function hideG() {
    if (!readingGVisible) {
      return [];
    }

    readingGVisible = false;

    return [
      new M.FadeOut(readingG)
    ];
  }

  // ================================================================
  // TRANSLUCENT WEIGHTED GAUSSIAN CURVES
  //
  // Both curves are already weighted by 0.5.
  //
  // Numerical calculations use the mathematical Gaussian
  // function, not the sampled visual representation.
  //
  // Dense vertical strips create a subdued filled appearance.
  // ================================================================

  const SAMPLE_COUNT = 120;
  const FILL_COUNT = 105;

  const CURVE_X = Array.from(
    { length: SAMPLE_COUNT + 1 },
    (_, i) =>
      XMIN +
      i / SAMPLE_COUNT *
      (XMAX - XMIN)
  );

  function makeCurve(
    fn,
    color,
    options = {}
  ) {
    const {
      filled = true,
      fillColor = '#253D48',
      width = 2.9,
      glow = false
    } = options;

    const objects = [];

    if (filled) {
      for (let i = 0; i <= FILL_COUNT; i++) {
        const x =
          XMIN +
          i / FILL_COUNT *
          (XMAX - XMIN);

        const height = Math.max(
          fn(x),
          1e-7
        );

        objects.push(
          lineAt(
            gp(x),
            gp(x, height),
            fillColor,
            P ? 2.0 : 1.8
          )
        );
      }
    }

    if (glow) {
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const x1 = CURVE_X[i];
        const x2 = CURVE_X[i + 1];

        objects.push(
          lineAt(
            gp(x1, fn(x1)),
            gp(x2, fn(x2)),
            '#245562',
            width + 2.5
          )
        );
      }
    }

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const x1 = CURVE_X[i];
      const x2 = CURVE_X[i + 1];

      objects.push(
        lineAt(
          gp(x1, fn(x1)),
          gp(x2, fn(x2)),
          color,
          width
        )
      );
    }

    return new M.VGroup(...objects);
  }

  const blueCurve = makeCurve(
    weightedBlue,
    BLUE,
    {
      filled: true,
      fillColor: BLUE_FILL
    }
  );

  const orangeCurve = makeCurve(
    weightedOrange,
    ORANGE,
    {
      filled: true,
      fillColor: ORANGE_FILL
    }
  );

  const mixtureCurve = makeCurve(
    mixture,
    C.cyan,
    {
      filled: false,
      width: 3.5,
      glow: true
    }
  );

  // ================================================================
  // COMPONENT LABELS
  //
  // Label curve identity directly.
  // Colors alone are not used to identify the modes.
  // ================================================================

  const blueLabel = fittedPill(
    'Slow mode',
    BLUE,
    P ? 16 : 14,
    point(
      px(MODEL.mu1) - (P ? 1.05 : 1.15),
      py(weightedBlue(MODEL.mu1)) - 0.05
    ),
    1.75
  );

  const orangeLabel = fittedPill(
    'Fast mode',
    ORANGE,
    P ? 16 : 14,
    point(
      px(MODEL.mu2) + (P ? 1.05 : 1.15),
      py(weightedOrange(MODEL.mu2)) - 0.05
    ),
    1.75
  );

  const centerGuides = [
    dashedAt(
      gp(MODEL.mu1),
      gp(
        MODEL.mu1,
        weightedBlue(MODEL.mu1)
      ),
      BLUE
    ),

    dashedAt(
      gp(MODEL.mu2),
      gp(
        MODEL.mu2,
        weightedOrange(MODEL.mu2)
      ),
      ORANGE
    )
  ];

  const modelTag = fittedPill(
    'Spread 2 each · Weight 0.5 each',
    C.cyan,
    P ? 16 : 15,

    P
      ? point(CX, -4.70)
      : point(4.45, 1.25),

    P ? 5.20 : 3.70
  );

  let modelTagVisible = false;

  function revealModelTag() {
    if (modelTagVisible) {
      return [];
    }

    modelTagVisible = true;

    return [
      new M.FadeIn(modelTag)
    ];
  }

  function hideModelTag() {
    if (!modelTagVisible) {
      return [];
    }

    modelTagVisible = false;

    return [
      new M.FadeOut(modelTag)
    ];
  }

  // ================================================================
  // GRAPH VISIBILITY
  //
  // The cake analogy temporarily replaces the graph.
  // Objects are removed individually, without wrapping
  // already-visible objects into a new VGroup.
  // ================================================================

  function hideComponentGraph() {
    return [
      new M.FadeOut(xAxis),
      new M.FadeOut(yAxis),

      ...fadeAll(
        Object.values(readings)
      ),

      new M.FadeOut(blueCurve),
      new M.FadeOut(orangeCurve),

      new M.FadeOut(blueLabel),
      new M.FadeOut(orangeLabel),

      ...hideModelTag()
    ];
  }

  function revealComponentGraph() {
    return [
      new M.FadeIn(xAxis),
      new M.FadeIn(yAxis),

      ...Object.values(readings).map(obj =>
        new M.FadeIn(obj)
      ),

      new M.FadeIn(blueCurve),
      new M.FadeIn(orangeCurve),

      new M.FadeIn(blueLabel),
      new M.FadeIn(orangeLabel)
    ];
  }

  let mixtureVisible = false;

  function revealMixture() {
    if (mixtureVisible) {
      return [];
    }

    mixtureVisible = true;

    return [
      new M.FadeIn(mixtureCurve)
    ];
  }

  function hideMixture() {
    if (!mixtureVisible) {
      return [];
    }

    mixtureVisible = false;

    return [
      new M.FadeOut(mixtureCurve)
    ];
  }

  // ================================================================
  // ACTIVE READING PROBE
  //
  // Amber outline: the selected observed reading.
  //
  // A vertical guide passes through both weighted curves
  // at the exact selected vibration value.
  //
  // Blue and orange dots mark the two actual heights.
  //
  // In Try it, the moving marker is a hypothetical probe.
  // It does not move any recorded observation.
  // ================================================================

  let probeNow = null;

  function makeProbe(
    x,
    options = {}
  ) {
    const {
      label = `x = ${x}`,
      hypothetical = false,
      showBlue = true,
      showOrange = true,
      showTotal = false
    } = options;

    const r = membership(x);
    const base = gp(x);

    const guideTop = gp(
      x,
      Math.min(
        MAX_DENSITY,
        Math.max(
          r.blue,
          r.orange,
          showTotal ? r.total : 0
        ) + 0.016
      )
    );

    const guide = dashedAt(
      base,
      guideTop,
      C.amber
    );

    const ring = circleAt(
      base,
      0.145,
      C.amber,
      0,
      2.2
    );

    const tag = fittedPill(
      label,
      hypothetical ? PURPLE : C.amber,
      P ? 16 : 15,
      point(
        px(x) + (
          0
        ),
        guideTop[1] + 0.25
      ),
      2.0
    );

    const objects = [
      guide,
      ring,
      tag
    ];

    if (hypothetical) {
      objects.push(
        diamondAt(
          base,
          PURPLE,
          0.09
        )
      );
    }

    function heightPoint(height, color) {
      const p = gp(x, height);

      const halo = new M.Dot({
        point: p,
        radius: 0.15,
        color
      });

      halo.setFill(color, 0.15);

      const dot = new M.Dot({
        point: p,
        radius: 0.065,
        color
      });

      objects.push(halo, dot);
    }

    if (
      showBlue &&
      showOrange &&
      Math.abs(r.blue - r.orange) < 1e-12
    ) {
      // The two weighted heights coincide.
      // Use a shared marker rather than displacing either
      // point away from its correct coordinate.

      const p = gp(x, r.blue);

      objects.push(
        circleAt(
          p,
          0.105,
          BLUE,
          0,
          2.5
        ),

        new M.Dot({
          point: p,
          radius: 0.060,
          color: ORANGE
        })
      );

    } else {
      if (showBlue) {
        heightPoint(
          r.blue,
          BLUE
        );
      }

      if (showOrange) {
        heightPoint(
          r.orange,
          ORANGE
        );
      }
    }

    if (showTotal) {
      heightPoint(
        r.total,
        C.cyan
      );
    }

    return new M.VGroup(...objects);
  }

  function setProbe(
    x,
    options = {}
  ) {
    const next = makeProbe(
      x,
      options
    );

    const a = [];

    if (probeNow) {
      a.push(
        new M.FadeOut(probeNow)
      );
    }

    probeNow = next;

    a.push(
      new M.FadeIn(probeNow)
    );

    return a;
  }

  function moveProbe(
    x,
    options = {}
  ) {
    const next = makeProbe(
      x,
      options
    );

    if (!probeNow) {
      probeNow = next;

      return [
        new M.FadeIn(probeNow)
      ];
    }

    const old = probeNow;
    probeNow = next;

    return [
      new M.FadeOut(old),
      new M.FadeIn(next)
    ];
  }

  function clearProbe() {
    if (!probeNow) {
      return [];
    }

    const old = probeNow;
    probeNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // TEMPORARY DENSITY MEASUREMENTS
  //
  // Blue and orange vertical measures show weighted density
  // contributions, not membership probabilities.
  //
  // Their heights are measured using the density axis.
  // ================================================================

  let measurementNow = null;

  function makeHeightMeasure(
    x,
    value,
    color,
    label,
    side = -1
  ) {
    const bottom = gp(x);
    const top = gp(x, value);

    const main = lineAt(
      bottom,
      top,
      color,
      5
    );

    const guide = dashedAt(
      point(XLEFT, top[1]),
      top,
      color
    );

    const dot = new M.Dot({
      point: top,
      radius: 0.07,
      color
    });

    const labelPos = point(
      top[0] + side * 1.12,
      top[1] + 0.30
    );

    const labelObj = fittedPill(
      label,
      color,
      P ? 16 : 15,
      labelPos,
      1.90
    );

    const leader = lineAt(
      top,
      point(
        labelPos[0],
        labelPos[1] - 0.12
      ),
      color,
      1.4
    );

    return new M.VGroup(
      guide,
      main,
      dot,
      leader,
      labelObj
    );
  }

  function setMeasurement(obj) {
    const a = [];

    if (measurementNow) {
      a.push(
        new M.FadeOut(measurementNow)
      );
    }

    measurementNow = obj;

    a.push(
      new M.FadeIn(obj)
    );

    return a;
  }

  function clearMeasurement() {
    if (!measurementNow) {
      return [];
    }

    const old = measurementNow;
    measurementNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // STACKED DENSITY BLOCKS
  //
  // The blue block has height q1(x).
  // The orange block has height q2(x).
  //
  // Stack the orange block above the blue block.
  //
  // The combined stack height is exactly the mixture density.
  //
  // Neither block is normalized until the membership
  // calculation begins.
  // ================================================================

  function makeDensityStack(
    x,
    options = {}
  ) {
    const {
      labels = true,
      highlight = null
    } = options;

    const r = membership(x);

    const y0 = py(0);
    const y1 = py(r.blue);
    const y2 = py(r.total);

    const blueHeight = y1 - y0;
    const orangeHeight = y2 - y1;

    const width = P ? 0.25 : 0.21;

    const blue = blockAt(
      point(
        px(x),
        (y0 + y1) / 2
      ),
      width,
      blueHeight,
      BLUE,
      highlight === 'orange' ? 0.35 : 0.90
    );

    const orange = blockAt(
      point(
        px(x),
        (y1 + y2) / 2
      ),
      width,
      orangeHeight,
      ORANGE,
      highlight === 'blue' ? 0.35 : 0.90
    );

    const top = gp(x, r.total);

    const halo = new M.Dot({
      point: top,
      radius: 0.15,
      color: C.cyan
    });

    halo.setFill(C.cyan, 0.16);

    const topDot = new M.Dot({
      point: top,
      radius: 0.075,
      color: C.cyan
    });

    const tick1 = lineAt(
      point(px(x) - 0.17, y1),
      point(px(x) + 0.17, y1),
      C.ink,
      1.4
    );

    const tick2 = lineAt(
      point(px(x) - 0.17, y2),
      point(px(x) + 0.17, y2),
      C.cyan,
      2
    );

    const objects = [
      blue,
      orange,
      tick1,
      tick2,
      halo,
      topDot
    ];

    if (labels) {
      const blueMid =
        (y0 + y1) / 2;

      const orangeMid =
        (y1 + y2) / 2;

      const bluePos = point(
        px(x) - 1.13,
        blueMid
      );

      const orangePos = point(
        px(x) + 1.13,
        orangeMid + 0.20
      );

      objects.push(
        lineAt(
          point(
            px(x) - width / 2,
            blueMid
          ),
          point(
            bluePos[0] + 0.53,
            bluePos[1]
          ),
          BLUE,
          1.4
        ),

        fittedPill(
          fmt(r.blue),
          BLUE,
          P ? 16 : 15,
          bluePos,
          1.25
        ),

        lineAt(
          point(
            px(x) + width / 2,
            orangeMid
          ),
          point(
            orangePos[0] - 0.53,
            orangePos[1]
          ),
          ORANGE,
          1.4
        ),

        fittedPill(
          fmt(r.orange),
          ORANGE,
          P ? 16 : 15,
          orangePos,
          1.25
        ),

        fittedPill(
          `Total ≈ ${fmt(r.total)}`,
          C.cyan,
          P ? 16 : 15,
          point(
            px(x),
            y2 + 0.36
          ),
          2.40
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ================================================================
  // CAKE-SHARING ANALOGY
  //
  // This is a conceptual illustration, not additional
  // machine data or an early membership calculation.
  //
  // One rectangular cake is divided into two unequal pieces.
  // The pieces have the same height, so their widths encode
  // their shares of the whole cake.
  //
  // Illustrative shares: 3/4 and 1/4.
  // ================================================================

  function personAt(p, color) {
    const head = circleAt(
      point(
        p[0],
        p[1] + 0.40
      ),
      0.20,
      color,
      0.92,
      1.2
    );

    const body = new M.Arc({
      radius: 0.38,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.86);

    body.moveTo(
      point(
        p[0],
        p[1] - 0.04
      )
    );

    return new M.VGroup(
      head,
      body
    );
  }

  const CAKE_Y = P ? -0.72 : -0.57;
  const CAKE_W = 3.60;
  const CAKE_H = 0.60;

  const cakePeople = [
    personAt(
      point(
        CX - 1.40,
        CAKE_Y + 1.05
      ),
      BLUE
    ),

    personAt(
      point(
        CX + 1.40,
        CAKE_Y + 1.05
      ),
      ORANGE
    )
  ];

  function makeCakePiece(
    x,
    y,
    width,
    color
  ) {
    const body = blockAt(
      point(x, y),
      width,
      CAKE_H,
      '#B98A5A',
      0.92
    );

    const icing = blockAt(
      point(
        x,
        y + CAKE_H / 2 + 0.075
      ),
      width,
      0.15,
      color,
      0.95
    );

    const filling = lineAt(
      point(
        x - width / 2 + 0.04,
        y
      ),
      point(
        x + width / 2 - 0.04,
        y
      ),
      '#FDE68A',
      3
    );

    return new M.VGroup(
      body,
      icing,
      filling
    );
  }

  const largeCakeW =
    CAKE_W * 0.75;

  const smallCakeW =
    CAKE_W * 0.25;

  const cakeLeft = CX - CAKE_W / 2;

  const largeCake = makeCakePiece(
    cakeLeft + largeCakeW / 2,
    CAKE_Y,
    largeCakeW,
    BLUE
  );

  const smallCake = makeCakePiece(
    cakeLeft + largeCakeW + smallCakeW / 2,
    CAKE_Y,
    smallCakeW,
    ORANGE
  );

  const cakeWholeTag = fittedPill(
    'One whole cake',
    C.cyan,
    P ? 18 : 16,
    point(
      CX,
      CAKE_Y - 0.78
    ),
    2.50
  );

  const largeShareTag = fittedPill(
    'Larger share',
    BLUE,
    P ? 17 : 15,
    point(
      CX - 1.15,
      CAKE_Y - 0.78
    ),
    2.35
  );

  const smallShareTag = fittedPill(
    'Smaller share',
    ORANGE,
    P ? 17 : 15,
    point(
      CX + 1.40,
      CAKE_Y - 0.78
    ),
    2.35
  );

  // ================================================================
  // MEMBERSHIP PROBABILITY BAR
  //
  // One full bar represents 100% of the model's membership
  // probability for the selected reading.
  //
  // Blue width   = total width × slow membership.
  // Orange width = total width × fast membership.
  //
  // The bar has constant total width for every reading.
  //
  // Very small shares remain at their correct width.
  // Their labels move outside the bar instead of making
  // the displayed probability segment artificially wider.
  // ================================================================

  const SHARE_CX = CX;

  const SHARE_W = P
    ? 5.30
    : 4.95;

  const SHARE_H = P
    ? 0.44
    : 0.32;

  const SHARE_Y = P
    ? -5.10
    : -3.00;

  function makeMembershipBar(
    r,
    options = {}
  ) {
    const {
      digits = 0,
      heading = true
    } = options;

    const left =
      SHARE_CX - SHARE_W / 2;

    const blueW =
      SHARE_W * r.slow;

    const orangeW =
      SHARE_W * r.fast;

    const blueX =
      left + blueW / 2;

    const orangeX =
      left + blueW + orangeW / 2;

    const blue = blockAt(
      point(blueX, SHARE_Y),
      blueW,
      SHARE_H,
      BLUE,
      0.92
    );

    const orange = blockAt(
      point(orangeX, SHARE_Y),
      orangeW,
      SHARE_H,
      ORANGE,
      0.92
    );

    const outline = blockAt(
      point(SHARE_CX, SHARE_Y),
      SHARE_W,
      SHARE_H,
      C.ink,
      0,
      1.4
    );

    const splitX = left + blueW;

    const split = lineAt(
      point(
        splitX,
        SHARE_Y - SHARE_H / 2
      ),
      point(
        splitX,
        SHARE_Y + SHARE_H / 2
      ),
      C.ink,
      1.7
    );

    const objects = [
      blue,
      orange,
      outline,
      split
    ];

    // Keep labels separate from segment geometry.
    // The percentages are always computed from full precision.

    const slowText =
      `Slow ${percent(r.slow, digits)}`;

    const fastText =
      `Fast ${percent(r.fast, digits)}`;

    const slowLabel = textAt(
      slowText,
      point(
        SHARE_CX - SHARE_W / 4,
        SHARE_Y - (
          P ? 0.41 : 0.33
        )
      ),
      P ? 17 : 15,
      BLUE,
      true
    );

    const fastLabel = textAt(
      fastText,
      point(
        SHARE_CX + SHARE_W / 4,
        SHARE_Y - (
          P ? 0.41 : 0.33
        )
      ),
      P ? 17 : 15,
      ORANGE,
      true
    );

    objects.push(
      slowLabel,
      fastLabel
    );

    if (heading) {
      objects.push(
        textAt(
          'Membership probabilities · 100%',
          point(
            SHARE_CX,
            SHARE_Y + (
              P ? 0.42 : 0.30
            )
          ),
          P ? 17 : 16,
          C.ink
        )
      );
    }

    return new M.VGroup(...objects);
  }

  let membershipBar = null;

  function setMembershipBar(
    r,
    options = {}
  ) {
    const next = makeMembershipBar(
      r,
      options
    );

    if (!membershipBar) {
      membershipBar = next;

      return [
        new M.FadeIn(membershipBar)
      ];
    }

    return [
      new M.Transform(
        membershipBar,
        next,
        { runTime: 1.05 }
      )
    ];
  }

  function clearMembershipBar() {
    if (!membershipBar) {
      return [];
    }

    const old = membershipBar;
    membershipBar = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // UNCERTAINTY CALLOUTS
  //
  // A high membership probability is not proof.
  // The model assumptions affect both calculated shares.
  // ================================================================

  const uncertaintyTag = fittedPill(
    'Model-based estimate',
    C.amber,
    P ? 16 : 14,

    P
      ? point(CX, -6.25)
      : point(4.45, -2.30),

    P ? 3.6 : 3.35
  );

  let uncertaintyVisible = false;

  function revealUncertainty() {
    if (uncertaintyVisible) {
      return [];
    }

    uncertaintyVisible = true;

    return [
      new M.FadeIn(uncertaintyTag)
    ];
  }

  function hideUncertainty() {
    if (!uncertaintyVisible) {
      return [];
    }

    uncertaintyVisible = false;

    return [
      new M.FadeOut(uncertaintyTag)
    ];
  }

  // ================================================================
  // TRY IT: MOVING READING CONTROL
  //
  // Animated illustration of the separate interactive activity.
  //
  // The probe is hypothetical.
  // Observations A–F and the recorded position of G never move.
  //
  // As the probe changes position, recalculate the two
  // Gaussian contributions and their membership probabilities.
  // ================================================================

  let sliderNow = null;

  const SLIDER_CX = P ? 0 : 4.45;
  const SLIDER_Y = P ? -6.35 : -2.35;
  const SLIDER_W = P ? 5.2 : 3.8;

  const SLIDER_MIN = 0;
  const SLIDER_MAX = 10;

  function sliderX(x) {
    return (
      SLIDER_CX - SLIDER_W / 2 +
      (x - SLIDER_MIN) /
      (SLIDER_MAX - SLIDER_MIN) *
      SLIDER_W
    );
  }

  function makeSlider(x) {
    const left =
      SLIDER_CX - SLIDER_W / 2;

    const right =
      SLIDER_CX + SLIDER_W / 2;

    const track = lineAt(
      point(left, SLIDER_Y),
      point(right, SLIDER_Y),
      C.muted,
      4
    );

    const midTick = lineAt(
      point(
        sliderX(5),
        SLIDER_Y - 0.07
      ),
      point(
        sliderX(5),
        SLIDER_Y + 0.07
      ),
      C.ink,
      1.2
    );

    const knob = diamondAt(
      point(
        sliderX(x),
        SLIDER_Y
      ),
      PURPLE,
      0.09
    );

    const title = textAt(
      `Try it · Vibration = ${x}`,
      point(
        SLIDER_CX,
        SLIDER_Y + 0.28
      ),
      P ? 16 : 15,
      PURPLE,
      true
    );

    const minLabel = textAt(
      '0',
      point(
        left,
        SLIDER_Y - 0.24
      ),
      P ? 16 : 14,
      C.muted,
      true
    );

    const maxLabel = textAt(
      '10',
      point(
        right,
        SLIDER_Y - 0.24
      ),
      P ? 16 : 14,
      C.muted,
      true
    );

    return new M.VGroup(
      track,
      midTick,
      knob,
      title,
      minLabel,
      maxLabel
    );
  }

  function setSlider(x) {
    const next = makeSlider(x);

    if (!sliderNow) {
      sliderNow = next;

      return [
        new M.FadeIn(sliderNow)
      ];
    }

    return [
      new M.Transform(
        sliderNow,
        next,
        { runTime: 1.0 }
      )
    ];
  }

  function clearSlider() {
    if (!sliderNow) {
      return [];
    }

    const old = sliderNow;
    sliderNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function moveTryIt(x) {
    const r = membership(x);

    return [
      ...moveProbe(
        x,
        {
          label: `Probe ${x}`,
          hypothetical: true,
          showTotal: true
        }
      ),

      ...setMembershipBar(
        r,
        { digits: 2 }
      ),

      ...setSlider(x)
    ];
  }

  const newDataButton = fittedPill(
    'New data',
    C.violet,
    P ? 18 : 16,

    P
      ? point(CX, -6.25)
      : point(4.45, -2.30),

    2.15
  );

  // ================================================================
  // 0 — CHECKING THE WORKSHOP MACHINE
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),

    ...say('CHECKING THE WORKSHOP MACHINE'),

    ...fbox([
      'One workshop machine',
      'Two possible operating modes'
    ])
  );

  // ================================================================
  // 1 — RECEIVE A VIBRATION READING OF FOUR
  //
  // The operating mode is not supplied to the method.
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(readingCard),

    ...say('VIBRATION = 4 mm/s', C.amber),

    ...fbox([
      'Observed vibration = 4',
      ['Operating mode: unknown to the model', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 2 — WAS THE MACHINE RUNNING SLOWLY OR QUICKLY?
  // ================================================================

  await until(S(2));
  await play(
    new M.FadeIn(slowQuestion),
    new M.FadeIn(fastQuestion),

    ...say('SLOW MODE OR FAST MODE?', C.amber),

    ...fbox([
      ['Slow mode?', BLUE],
      ['Fast mode?', ORANGE],
      'Both are possible'
    ], C.amber)
  );

  // ================================================================
  // 3 — BRING BACK THE SIX NORMAL VIBRATION READINGS
  // ================================================================

  await until(S(3));
  await play(
    new M.FadeOut(machine),
    new M.FadeOut(readingCard),

    new M.FadeOut(slowQuestion),
    new M.FadeOut(fastQuestion),

    new M.FadeIn(xAxis),

    ...say('6 NORMAL VIBRATION READINGS'),

    ...fbox([
      'Previous normal readings',
      ['Recorded mode labels hidden', C.muted]
    ])
  );

  // ================================================================
  // 4–9 — REVEAL THE SIX FIXED READINGS
  //
  // Short animations match the short narration beats.
  // ================================================================

  // 4 — Two.

  await until(S(4));
  await play(
    new M.FadeIn(
      readings.A,
      { runTime: 0.20 }
    )
  );

  // 5 — Three.

  await until(S(5));
  await play(
    new M.FadeIn(
      readings.B,
      { runTime: 0.20 }
    )
  );

  // 6 — Four.

  await until(S(6));
  await play(
    new M.FadeIn(
      readings.C,
      { runTime: 0.20 }
    )
  );

  // 7 — Six.

  await until(S(7));
  await play(
    new M.FadeIn(
      readings.D,
      { runTime: 0.20 }
    )
  );

  // 8 — Seven.

  await until(S(8));
  await play(
    new M.FadeIn(
      readings.E,
      { runTime: 0.20 }
    )
  );

  // 9 — And eight.

  await until(S(9));
  await play(
    new M.FadeIn(
      readings.F,
      { runTime: 0.20 }
    )
  );

  // ================================================================
  // 10 — RESTORE THE TWO BELL-SHAPED CURVES
  //
  // These are the weighted curves from lesson 14.2.2.
  // ================================================================

  await until(S(10));
  await play(
    new M.FadeIn(yAxis),

    new M.FadeIn(blueCurve),
    new M.FadeIn(orangeCurve),

    new M.FadeIn(blueLabel),
    new M.FadeIn(orangeLabel),

    ...say('BRING BACK THE TWO CURVES'),

    ...fbox([
      ['Blue: possible slow mode', BLUE],
      ['Orange: possible fast mode', ORANGE],
      'Weighted Gaussian densities'
    ])
  );

  // ================================================================
  // 11 — CENTERS AT TWO AND EIGHT
  // ================================================================

  await until(S(11));
  await play(
    ...centerGuides.map(obj =>
      new M.Create(obj)
    ),

    ...say('CENTERS: 2 AND 8'),

    ...fbox([
      ['Blue center = 2', BLUE],
      ['Orange center = 8', ORANGE],
      'The same starting model'
    ])
  );

  // ================================================================
  // 12 — EQUAL SPREADS AND EQUAL MIXTURE WEIGHTS
  //
  // Both standard deviations = 2.
  // Both mixture weights = 0.5.
  // ================================================================

  await until(S(12));
  await play(
    ...fadeAll(centerGuides),

    ...revealModelTag(),

    ...say('SAME SPREAD · HALF THE MIXTURE EACH'),

    ...fbox([
      ['Standard deviations: 2 and 2', C.ink],
      ['Blue weight = 0.5', BLUE],
      ['Orange weight = 0.5', ORANGE]
    ])
  );

  // ================================================================
  // 13 — HIGHLIGHT READING C AT VIBRATION FOUR
  //
  // The vertical guide passes through both weighted curves.
  // ================================================================

  await until(S(13));
  await play(
    ...setProbe(
      4,
      {
        label: 'C: x = 4'
      }
    ),

    new M.Indicate(
      readings.C,
      { color: C.amber }
    ),

    ...say('LOOK AT READING C: VIBRATION 4', C.amber),

    ...fbox([
      'Reading C',
      'Vibration = 4',
      ['Compare both curve heights here', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 14 — THE BLUE CURVE IS HIGHER AT FOUR
  // ================================================================

  await until(S(14));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blue,
        BLUE,
        'Higher blue curve',
        -1
      )
    ),

    ...say('BLUE IS HIGHER HERE', BLUE),

    ...fbox([
      ['Blue weighted height', BLUE],
      'is greater than',
      ['orange weighted height', ORANGE]
    ], BLUE)
  );

  // ================================================================
  // 15 — THE SLOW MODE IS MORE LIKELY UNDER THE MODEL
  //
  // This is not yet a hard assignment.
  // ================================================================

  await until(S(15));
  await play(
    new M.Indicate(
      blueLabel,
      { color: BLUE }
    ),

    ...say('SLOW MODE APPEARS MORE LIKELY', BLUE),

    ...fbox([
      'According to these curves:',
      ['Slow is more likely', BLUE],
      'But not necessarily certain'
    ], BLUE)
  );

  // ================================================================
  // 16 — THE ORANGE CURVE ALSO HAS SOME HEIGHT
  // ================================================================

  await until(S(16));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.orange,
        ORANGE,
        'Positive height',
        1
      )
    ),

    ...say('ORANGE ALSO HAS SOME HEIGHT', ORANGE),

    ...fbox([
      ['Orange contribution > 0', ORANGE],
      'The fast mode also contributes'
    ], ORANGE)
  );

  // ================================================================
  // 17 — THE FAST MODE REMAINS POSSIBLE
  // ================================================================

  await until(S(17));
  await play(
    new M.Indicate(
      orangeLabel,
      { color: ORANGE }
    ),

    ...say('FAST IS STILL A POSSIBILITY', ORANGE),

    ...fbox([
      ['Slow: more likely', BLUE],
      ['Fast: still possible', ORANGE],
      'Keep both possibilities'
    ])
  );

  // ================================================================
  // 18 — CAKE-SHARING ANALOGY
  //
  // Temporarily replace the graph with the cake picture.
  // ================================================================

  await until(S(18));
  await play(
    ...clearMeasurement(),
    ...clearProbe(),

    ...hideComponentGraph(),

    new M.FadeIn(cakePeople[0]),
    new M.FadeIn(cakePeople[1]),

    new M.FadeIn(largeCake),
    new M.FadeIn(smallCake),

    new M.FadeIn(cakeWholeTag),

    ...say('IMAGINE SHARING ONE CAKE'),

    ...fbox([
      'One whole cake',
      'Two people',
      ['One receives a larger piece', BLUE]
    ])
  );

  // ================================================================
  // 19 — GIVE EACH PERSON THEIR OWN SHARE
  //
  // Separate the two pieces without changing their sizes.
  // ================================================================

  await until(S(19));
  await play(
    new M.FadeOut(cakeWholeTag),

    new M.Transform(
      largeCake,

      makeCakePiece(
        CX - 1.15,
        CAKE_Y,
        largeCakeW,
        BLUE
      ),

      { runTime: 0.9 }
    ),

    new M.Transform(
      smallCake,

      makeCakePiece(
        CX + 1.40,
        CAKE_Y,
        smallCakeW,
        ORANGE
      ),

      { runTime: 0.9 }
    ),

    new M.FadeIn(largeShareTag),
    new M.FadeIn(smallShareTag),

    ...say('EACH PERSON RECEIVES A SHARE'),

    ...fbox([
      ['A larger share', BLUE],
      ['A smaller share', ORANGE],
      'Together: one whole cake'
    ])
  );

  // ================================================================
  // 20 — APPLY THE SAME IDEA TO THE TWO MODES
  // ================================================================

  await until(S(20));
  await play(
    ...fadeAll(cakePeople),

    new M.FadeOut(largeCake),
    new M.FadeOut(smallCake),

    new M.FadeOut(largeShareTag),
    new M.FadeOut(smallShareTag),

    ...revealComponentGraph(),

    ...setProbe(
      4,
      {
        label: 'C: x = 4'
      }
    ),

    ...say('SHARE OUR BELIEF BETWEEN THE MODES'),

    ...fbox([
      ['Slow mode receives a share', BLUE],
      ['Fast mode receives a share', ORANGE],
      'Both describe the same reading'
    ])
  );

  // ================================================================
  // 21 — KEEP BOTH SHARES INSTEAD OF CHOOSING ONE MODE
  //
  // The numerical membership calculation comes later.
  // ================================================================

  await until(S(21));
  await play(
    new M.Indicate(
      blueLabel,
      { color: BLUE }
    ),

    new M.Indicate(
      orangeLabel,
      { color: ORANGE }
    ),

    ...say('KEEP BOTH POSSIBILITIES'),

    ...fbox([
      'Do not force a single answer',
      ['Give slow a share of belief', BLUE],
      ['Give fast a share of belief', ORANGE]
    ])
  );

  // ================================================================
  // 22 — NAME SOFT ASSIGNMENT
  // ================================================================

  await until(S(22));
  await play(
    ...say('THIS IS SOFT ASSIGNMENT'),

    ...fbox([
      ['Soft assignment', C.cyan],
      'Keep a membership share',
      'for each possible group'
    ])
  );

  // ================================================================
  // 23 — CALCULATE THE SHARES FOR READING FOUR
  // ================================================================

  await until(S(23));
  await play(
    new M.Indicate(
      readings.C,
      { color: C.amber }
    ),

    ...say('FIND THE TWO SHARES AT 4', C.amber),

    ...fbox([
      'Reading C: x = 4',
      'First find both contributions',
      ['Then compare their shares', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 24 — USE THE BLUE CURVE AFTER APPLYING ITS WEIGHT
  //
  // Do not multiply the already-weighted curve by 0.5 again.
  // ================================================================

  await until(S(24));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blue,
        BLUE,
        'Weighted blue',
        -1
      )
    ),

    ...say('USE THE WEIGHTED BLUE DENSITY', BLUE),

    ...fbox([
      'Blue Gaussian height × 0.5',
      [
        `≈ ${fmt(gaussian(4, 2, 2))} × 0.5`,
        BLUE
      ],
      'Use its weighted contribution'
    ], BLUE)
  );

  // ================================================================
  // 25 — WEIGHTED BLUE CONTRIBUTION ≈ 0.0605
  // ================================================================

  await until(S(25));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blue,
        BLUE,
        fmt(AT4.blue),
        -1
      )
    ),

    ...say('BLUE CONTRIBUTION ≈ 0.0605', BLUE),

    ...fbox([
      ['Slow-mode contribution', BLUE],
      [
        `≈ ${fmt(AT4.blue)}`,
        BLUE
      ],
      'This is a density height'
    ], BLUE)
  );

  // ================================================================
  // 26 — WEIGHTED ORANGE CONTRIBUTION ≈ 0.0135
  // ================================================================

  await until(S(26));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.orange,
        ORANGE,
        fmt(AT4.orange),
        1
      )
    ),

    ...say('ORANGE CONTRIBUTION ≈ 0.0135', ORANGE),

    ...fbox([
      [
        `Blue ≈ ${fmt(AT4.blue)}`,
        BLUE
      ],
      [
        `Orange ≈ ${fmt(AT4.orange)}`,
        ORANGE
      ],
      'Both are weighted densities'
    ], ORANGE)
  );

  // ================================================================
  // 27 — DRAW THE TWO CONTRIBUTIONS AS STACKED BLOCKS
  //
  // First show both contributions at the same baseline.
  // Then move the orange block onto the blue block.
  //
  // Every block retains its actual density height.
  // ================================================================

  const STACK_W = P ? 0.25 : 0.21;

  const BLUE_H4 =
    py(AT4.blue) - BASE;

  const ORANGE_H4 =
    py(AT4.orange) - BASE;

  const separateBlue = blockAt(
    point(
      px(4) - 0.30,
      BASE + BLUE_H4 / 2
    ),
    STACK_W,
    BLUE_H4,
    BLUE,
    0.90
  );

  const separateOrange = blockAt(
    point(
      px(4) + 0.30,
      BASE + ORANGE_H4 / 2
    ),
    STACK_W,
    ORANGE_H4,
    ORANGE,
    0.90
  );

  await until(S(27));
  await play(
    ...clearMeasurement(),
    ...clearProbe(),

    new M.FadeIn(separateBlue),
    new M.FadeIn(separateOrange),

    ...say('TWO CONTRIBUTIONS AS BLOCKS'),

    ...fbox([
      ['Blue block: slow density', BLUE],
      ['Orange block: fast density', ORANGE],
      'Stack the two heights'
    ])
  );

  await play(
    new M.Transform(
      separateBlue,

      blockAt(
        point(
          px(4),
          BASE + BLUE_H4 / 2
        ),
        STACK_W,
        BLUE_H4,
        BLUE,
        0.90
      ),

      { runTime: 0.75 }
    )
  );

  await play(
    new M.Transform(
      separateOrange,

      blockAt(
        point(
          px(4),
          BASE + BLUE_H4 + ORANGE_H4 / 2
        ),
        STACK_W,
        ORANGE_H4,
        ORANGE,
        0.90
      ),

      { runTime: 0.85 }
    )
  );

  // ================================================================
  // 28 — COMBINED HEIGHT ≈ 0.074
  //
  // The complete stack reaches the mixture density.
  // ================================================================

  await until(S(28));
  await play(
    new M.FadeOut(separateBlue),
    new M.FadeOut(separateOrange),

    ...revealMixture(),

    ...setMeasurement(
      makeDensityStack(4)
    ),

    ...say('COMBINED HEIGHT ≈ 0.074'),

    ...fbox([
      [
        `Blue ≈ ${fmt(AT4.blue)}`,
        BLUE
      ],
      [
        `+ orange ≈ ${fmt(AT4.orange)}`,
        ORANGE
      ],
      [
        `Total ≈ ${fmt(AT4.total)}`,
        C.cyan
      ],
      ['Calculated before rounding', C.muted]
    ])
  );

  // ================================================================
  // 29 — WHAT SHARE OF THE TOTAL BELONGS TO EACH MODE?
  //
  // Normalize by the entire combined height.
  // ================================================================

  await until(S(29));
  await play(
    new M.Indicate(
      measurementNow,
      { color: C.amber }
    ),

    ...say('WHAT SHARE BELONGS TO EACH MODE?', C.amber),

    ...fbox([
      'The combined height is the whole',
      ['Blue: what fraction?', BLUE],
      ['Orange: what fraction?', ORANGE]
    ], C.amber)
  );

  // ================================================================
  // 30 — DIVIDE BLUE CONTRIBUTION BY COMBINED HEIGHT
  // ================================================================

  await until(S(30));
  await play(
    ...setMeasurement(
      makeDensityStack(
        4,
        {
          highlight: 'blue'
        }
      )
    ),

    ...say('SLOW SHARE = BLUE ÷ TOTAL', BLUE),

    ...fbox([
      ['Slow membership =', BLUE],
      'blue contribution ÷ combined density',
      `≈ ${fmt(AT4.blue)} ÷ ${fmt(AT4.total)}`
    ], BLUE)
  );

  // ================================================================
  // 31 — SLOW MEMBERSHIP ≈ 82%
  //
  // Full-precision result ≈ 81.76%.
  // ================================================================

  await until(S(31));
  await play(
    ...say('SLOW MEMBERSHIP ≈ 82%', BLUE),

    ...fbox([
      'Slow membership',
      [
        `≈ ${fmt(AT4.slow, 4)}`,
        BLUE
      ],
      [
        `≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      ['About 82%', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 32 — DIVIDE ORANGE CONTRIBUTION BY THE SAME TOTAL
  // ================================================================

  await until(S(32));
  await play(
    ...setMeasurement(
      makeDensityStack(
        4,
        {
          highlight: 'orange'
        }
      )
    ),

    ...say('FAST SHARE = ORANGE ÷ TOTAL', ORANGE),

    ...fbox([
      ['Fast membership =', ORANGE],
      'orange contribution ÷ combined density',
      `≈ ${fmt(AT4.orange)} ÷ ${fmt(AT4.total)}`
    ], ORANGE)
  );

  // ================================================================
  // 33 — FAST MEMBERSHIP ≈ 18%
  //
  // Full-precision result ≈ 18.24%.
  // ================================================================

  await until(S(33));
  await play(
    ...say('FAST MEMBERSHIP ≈ 18%', ORANGE),

    ...fbox([
      'Fast membership',
      [
        `≈ ${fmt(AT4.fast, 4)}`,
        ORANGE
      ],
      [
        `≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      ['About 18%', ORANGE]
    ], ORANGE)
  );

  // ================================================================
  // 34 — SHOW BOTH SHARES AS PIECES OF ONE WHOLE BAR
  //
  // Use the exact probability values for segment widths.
  // Display the rounded percentages from the narration.
  // ================================================================

  await until(S(34));
  await play(
    ...setMeasurement(
      makeDensityStack(4)
    ),

    ...setMembershipBar(
      AT4,
      { digits: 0 }
    ),

    ...say('ONE WHOLE BAR · TWO SHARES'),

    ...fbox([
      [
        `Slow ≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      'Both shares belong to reading C'
    ])
  );

  // ================================================================
  // 35 — 82% + 18% = 100%
  // ================================================================

  await until(S(35));
  await play(
    new M.Indicate(
      membershipBar,
      { color: C.green }
    ),

    ...say('82% + 18% = 100%', C.green),

    ...fbox([
      '81.76% + 18.24%',
      ['= 100%', C.green],
      'All membership shares sum to 1'
    ], C.green)
  );

  // ================================================================
  // 36 — NAME MEMBERSHIP PROBABILITY
  // ================================================================

  await until(S(36));
  await play(
    ...clearMeasurement(),

    ...setProbe(
      4,
      {
        label: 'C: x = 4',
        showTotal: true
      }
    ),

    ...say('EACH SHARE = MEMBERSHIP PROBABILITY'),

    ...fbox([
      ['Membership probability', C.cyan],
      'One mode’s share of our belief',
      'about the observed reading'
    ])
  );

  // ================================================================
  // 37 — LIKELIHOOD ACCORDING TO THE MODEL
  //
  // Emphasize that the model has not observed the true
  // operating mode for reading C.
  // ================================================================

  await until(S(37));
  await play(
    ...revealUncertainty(),

    ...setMembershipBar(
      AT4,
      { digits: 2 }
    ),

    ...say('HOW LIKELY, ACCORDING TO THE MODEL'),

    ...fbox([
      [
        `Slow membership ≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      [
        `Fast membership ≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      ['Conditional on our model', C.amber]
    ])
  );

  // ================================================================
  // 38 — NAME POSTERIOR PROBABILITIES
  //
  // Before observing the reading:
  //   mixture weights = 50%, 50%.
  //
  // After observing vibration 4:
  //   posterior memberships = 81.76%, 18.24%.
  //
  // Distinguish prior mixture weights from posterior
  // membership probabilities.
  // ================================================================

  await until(S(38));
  await play(
    ...say('AFTER SEEING THE READING = POSTERIOR'),

    ...fbox([
      ['Before seeing x: 50% and 50%', C.muted],
      'After observing x = 4:',
      [
        `Slow ≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      ['Posterior probabilities', C.cyan]
    ])
  );

  // ================================================================
  // 39 — MOVE OUR ATTENTION TO NEW READING G AT FIVE
  //
  // G is a new observation, not a moved version of C.
  // Keep C at its original recorded position.
  //
  // Move only the active selection and reveal G's
  // purple diamond at vibration 5.
  // ================================================================

  await until(S(39));
  await play(
    ...hideUncertainty(),

    ...revealG(),

    ...moveProbe(
      5,
      {
        label: 'G: x = 5',
        showTotal: true
      }
    ),

    ...clearMembershipBar(),

    ...say('NEW READING G: VIBRATION 5', PURPLE),

    ...fbox([
      ['G = 5 mm/s', PURPLE],
      'A new reading',
      'Operating mode unknown'
    ], PURPLE)
  );

  // ================================================================
  // 40 — BOTH WEIGHTED CURVES HAVE THE SAME HEIGHT
  //
  // The curves have equal spreads and equal weights.
  // Vibration 5 lies exactly halfway between their centers.
  // ================================================================

  await until(S(40));
  await play(
    new M.Indicate(
      probeNow,
      { color: C.amber }
    ),

    ...say('AT 5, BOTH HEIGHTS ARE EQUAL'),

    ...fbox([
      '5 is midway between 2 and 8',
      [
        `Blue ≈ ${fmt(AT5.blue)}`,
        BLUE
      ],
      [
        `Orange ≈ ${fmt(AT5.orange)}`,
        ORANGE
      ]
    ])
  );

  // ================================================================
  // 41 — EACH CONTRIBUTES THE SAME AMOUNT
  //
  // Both stacked blocks now have exactly equal height.
  // ================================================================

  await until(S(41));
  await play(
    ...clearProbe(),

    ...setMeasurement(
      makeDensityStack(5)
    ),

    ...say('TWO EQUAL CONTRIBUTIONS'),

    ...fbox([
      [
        `Blue ≈ ${fmt(AT5.blue)}`,
        BLUE
      ],
      [
        `Orange ≈ ${fmt(AT5.orange)}`,
        ORANGE
      ],
      [
        `Combined ≈ ${fmt(AT5.total)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 42 — EACH MODE RECEIVES FIFTY PERCENT
  // ================================================================

  await until(S(42));
  await play(
    ...setMembershipBar(
      AT5,
      { digits: 0 }
    ),

    ...say('50% SLOW · 50% FAST'),

    ...fbox([
      'Equal contribution ÷ total',
      ['Slow = 50%', BLUE],
      ['Fast = 50%', ORANGE],
      ['Total = 100%', C.green]
    ])
  );

  // ================================================================
  // 43 — THE MODEL CANNOT FAVOR EITHER MODE
  // ================================================================

  await until(S(43));
  await play(
    new M.Indicate(
      membershipBar,
      { color: PURPLE }
    ),

    ...say('NEITHER MODE IS FAVORED', PURPLE),

    ...fbox([
      'Both membership probabilities are equal',
      ['Slow = fast = 0.5', PURPLE],
      'Keep the uncertainty'
    ], PURPLE)
  );

  // ================================================================
  // 44 — INTRODUCE THE GENERAL CALCULATION
  // ================================================================

  await until(S(44));
  await play(
    ...say('WRITE THE GENERAL RULE'),

    ...fbox([
      'One mode’s contribution',
      'Compared with the combined density',
      ['A share of the total', C.cyan]
    ])
  );

  // ================================================================
  // 45 — MEMBERSHIP PROBABILITY FORMULA
  //
  // Membership probability =
  //
  //   weighted density of one mode
  //   ----------------------------
  //   combined density of all modes
  //
  // The same denominator is used for both modes.
  // ================================================================

  await until(S(45));
  await play(
    ...say('MEMBERSHIP = WEIGHTED DENSITY ÷ TOTAL DENSITY'),

    ...fbox([
      ['Membership probability =', C.cyan],
      '   weighted density of one mode',
      '   ────────────────────────────',
      '   combined density of all modes',
      ['Use the same total for each mode', C.amber]
    ])
  );

  // ================================================================
  // 46 — SOFT ASSIGNMENT IS USEFUL WHEN GROUPS OVERLAP
  //
  // Return to the observed reading C for comparison.
  // Reading G remains at its original position.
  // ================================================================

  await until(S(46));
  await play(
    ...clearMeasurement(),

    ...setProbe(
      4,
      {
        label: 'C: x = 4',
        showTotal: true
      }
    ),

    ...setMembershipBar(
      AT4,
      { digits: 2 }
    ),

    ...say('OVERLAPPING GROUPS? KEEP THE UNCERTAINTY'),

    ...fbox([
      'Both curves contribute at 4',
      ['Slow is favored', BLUE],
      ['Fast remains possible', ORANGE],
      'No forced hard assignment'
    ])
  );

  // ================================================================
  // 47 — A LARGE PROBABILITY DOES NOT GUARANTEE THE TRUE MODE
  //
  // Use amber to highlight the caution.
  // Do not recolor C as a confirmed slow-mode observation.
  // ================================================================

  await until(S(47));
  await play(
    ...revealUncertainty(),

    new M.Indicate(
      membershipBar,
      { color: C.amber }
    ),

    ...say('HIGH PROBABILITY DOES NOT MEAN CERTAINTY', C.amber),

    ...fbox([
      ['81.76% is not a guarantee', C.amber],
      'The actual mode may be different',
      'A model can be mistaken'
    ], C.amber)
  );

  // ================================================================
  // 48 — PROBABILITIES DEPEND ON THE QUALITY OF THE MODEL
  //
  // Keep the required centers, spreads and weights fixed.
  // Highlight these assumptions rather than inventing
  // a different fitted model.
  // ================================================================

  await until(S(48));
  await play(
    ...revealModelTag(),

    ...say('THE SHARES DEPEND ON OUR MODEL', C.amber),

    ...fbox([
      'Assumed centers: 2 and 8',
      'Assumed spreads: 2 and 2',
      'Assumed weights: 0.5 and 0.5',
      ['Do these describe real behavior?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 49 — TRY IT: DRAG THE READING ALONG THE LINE
  //
  // Switch from examining recorded observations to
  // moving a hypothetical probe.
  //
  // Hide G's separate marker during this demonstration.
  // Its actual recorded vibration remains 5.
  // ================================================================

  await until(S(49));
  await play(
    ...hideUncertainty(),
    ...hideModelTag(),
    ...hideG(),

    ...setProbe(
      4,
      {
        label: 'Probe 4',
        hypothetical: true,
        showTotal: true
      }
    ),

    ...setSlider(4),

    ...say('TRY IT: DRAG THE READING'),

    ...fbox([
      'Move the hypothetical reading',
      ['Watch both membership shares', C.cyan],
      'The recorded data stay fixed'
    ])
  );

  await play(
    ...moveTryIt(7),

    ...fbox([
      'Example probe: vibration 7',
      [
        `Slow ≈ ${percent(membership(7).slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(membership(7).fast, 2)}`,
        ORANGE
      ]
    ])
  );

  // ================================================================
  // 50 — FIND A READING WITH EXACTLY 50% MEMBERSHIP EACH
  //
  // The midpoint at vibration 5 gives equal contributions.
  // ================================================================

  await until(S(50));
  await play(
    ...moveTryIt(5),

    ...say('FIND EXACTLY 50% FOR EACH MODE'),

    ...fbox([
      'Try vibration 5',
      ['Slow = 50%', BLUE],
      ['Fast = 50%', ORANGE],
      ['Equal membership shares', C.green]
    ], C.green)
  );

  // ================================================================
  // 51 — FIND A READING WITH SLOW MEMBERSHIP ABOVE 90%
  //
  // At vibration 2:
  //
  // Slow membership ≈ 98.90%.
  // Fast membership ≈ 1.10%.
  //
  // The orange segment remains small but nonzero.
  // ================================================================

  await until(S(51));
  await play(
    ...moveTryIt(2),

    ...say('FIND SLOW MEMBERSHIP ABOVE 90%', BLUE),

    ...fbox([
      'Try vibration 2',
      [
        `Slow ≈ ${percent(AT2.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT2.fast, 2)}`,
        ORANGE
      ],
      ['98.90% > 90%', C.green]
    ], BLUE)
  );

  // ================================================================
  // 52 — PREDICT THE CHANGE FROM FOUR TO SIX
  //
  // First restore the probe to 4.
  // Display the starting membership shares and prediction
  // question before revealing the result.
  //
  // At 4:
  // Slow ≈ 81.76%, fast ≈ 18.24%.
  //
  // At 6:
  // Slow ≈ 18.24%, fast ≈ 81.76%.
  //
  // Sequential plays allow the learner to see the
  // membership bar change as the probe moves right.
  // ================================================================

  await until(S(52));
  await play(
    ...moveTryIt(4),

    ...say('PREDICT: MOVE FROM 4 TO 6', C.amber),

    ...fbox([
      'Start at vibration 4',
      [
        `Slow ≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      ['Which share will grow?', C.amber]
    ], C.amber)
  );

  await until(S(52) + 2.5);
  await play(
    ...moveTryIt(6),

    ...say('TEST: THE FAST SHARE GROWS', ORANGE),

    ...fbox([
      'Now at vibration 6',
      [
        `Slow ≈ ${percent(AT6.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT6.fast, 2)}`,
        ORANGE
      ],
      ['Fast membership increases', C.green]
    ], ORANGE)
  );

  // ================================================================
  // 53 — PRESS NEW DATA IN THE SEPARATE TRY IT ACTIVITY
  //
  // Do not replace the chapter's fixed readings with
  // invented observations.
  //
  // The New data button is an animated illustration.
  // Actual data generation belongs to the simulation.
  // ================================================================

  await until(S(53));
  await play(
    ...clearSlider(),

    new M.FadeIn(newDataButton),

    ...say('NEW DATA · EXPLORE NEW MEMBERSHIP SHARES', C.violet),

    ...fbox([
      ['Press New data in Try it', C.violet],
      'Explore a fresh collection of readings',
      'Compare a new pair of curves'
    ], C.violet)
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Restore the original worked example:
  //
  // Reading C at vibration 4.
  //
  // Gaussian centers: 2 and 8.
  // Standard deviations: 2 and 2.
  // Mixture weights: 0.5 and 0.5.
  //
  // Slow membership ≈ 81.76%.
  // Fast membership ≈ 18.24%.
  //
  // Preserve the original observations and the distinct
  // new reading G.
  //
  // Soft assignment keeps all membership possibilities
  // instead of hiding uncertainty through a hard decision.
  // ================================================================

  await until(S(54));
  await play(
    new M.FadeOut(newDataButton),

    ...revealG(),

    ...setProbe(
      4,
      {
        label: 'C: x = 4',
        showTotal: true
      }
    ),

    ...setMembershipBar(
      AT4,
      { digits: 2 }
    ),

    ...revealUncertainty(),

    ...say('SOFT ASSIGNMENT KEEPS THE UNCERTAINTY', C.green),

    ...fbox([
      ['Membership = weighted density ÷ total', C.cyan],
      [
        `Slow ≈ ${percent(AT4.slow, 2)}`,
        BLUE
      ],
      [
        `Fast ≈ ${percent(AT4.fast, 2)}`,
        ORANGE
      ],
      ['Together = 100%', C.green],
      'Keep both possibilities'
    ], C.green)
  );
}
