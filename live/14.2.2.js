// lesson 14.2.2
// Gaussian mixtures: combining overlapping bell-shaped curves.
// Beat i = narration sentence i (0-based).
// Live manim-web scene for site/live/engine.js.
//
// Fixed normal vibration readings: 2, 3, 4, 6, 7, 8 mm/s.
// Initial guessed centers: 2 and 8.
// Initial standard deviations: 2 and 2.
// Initial mixture weights: 0.5 and 0.5.
//
// All density calculations use full numerical precision.
// Operating-mode labels are hidden from the model.
// The Try it controls are animated illustrations of the separate
// interactive activity, not an implementation of that activity.
//
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

  const VALUES = DATA.map(d => d.x);

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  const BLUE_FILL = '#223D60';
  const ORANGE_FILL = '#603D25';

  const INITIAL = {
    mu1: 2,
    mu2: 8,
    sigma1: 2,
    sigma2: 2,
    w1: 0.5,
    w2: 0.5
  };

  // ================================================================
  // EXACT GAUSSIAN AND MIXTURE CALCULATIONS
  //
  // A Gaussian density integrates to 1 across the real line.
  //
  // g(x; mu, sigma) =
  //   exp(-0.5 * ((x - mu) / sigma)^2)
  //   / (sigma * sqrt(2 * pi))
  //
  // Mixture:
  //   p(x) = w1 * g1(x) + w2 * g2(x)
  //
  // Weights are nonnegative and sum to 1.
  //
  // Multiplying a curve by its weight changes its height
  // and area, but does not change its center or spread.
  // ================================================================

  function gaussian(x, mu, sigma) {
    const z = (x - mu) / sigma;

    return (
      Math.exp(-0.5 * z * z) /
      (sigma * Math.sqrt(2 * Math.PI))
    );
  }

  function component1(x, model = INITIAL) {
    return gaussian(
      x,
      model.mu1,
      model.sigma1
    );
  }

  function component2(x, model = INITIAL) {
    return gaussian(
      x,
      model.mu2,
      model.sigma2
    );
  }

  function weighted1(x, model = INITIAL) {
    return model.w1 * component1(x, model);
  }

  function weighted2(x, model = INITIAL) {
    return model.w2 * component2(x, model);
  }

  function mixture(x, model = INITIAL) {
    return (
      weighted1(x, model) +
      weighted2(x, model)
    );
  }

  function fmt(value, digits = 6) {
    return value.toFixed(digits);
  }

  const AT4 = {
    x: 4,
    blue: component1(4),
    orange: component2(4),
    blueWeighted: weighted1(4),
    orangeWeighted: weighted2(4),
    combined: mixture(4)
  };

  const AT5 = {
    x: 5,
    blue: component1(5),
    orange: component2(5),
    blueWeighted: weighted1(5),
    orangeWeighted: weighted2(5),
    combined: mixture(5)
  };

  // Checked values at vibration 4:
  //
  // Unweighted blue:   0.120985
  // Unweighted orange: 0.026995
  // Weighted blue:     0.060493
  // Weighted orange:   0.013498
  // Combined density:  0.073990
  //
  // Checked values at vibration 5:
  //
  // Unweighted blue:   0.064759
  // Unweighted orange: 0.064759
  // Weighted blue:     0.032379
  // Weighted orange:   0.032379
  // Combined density:  0.064759
  //
  // The displayed rounded contributions need not sum exactly
  // to the displayed rounded total. The total is calculated
  // before rounding.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Laptop: 14.22 × 8.
  //
  // Phone: formula box above the main picture.
  // Laptop: formula box beside the main picture.
  //
  // Use a fixed coordinate scale throughout the lesson.
  // Gaussian curves have infinite support, so the graph
  // shows only a finite viewing window.
  //
  // Negative axis values show mathematical curve support,
  // not additional recorded vibration readings.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.3, -0.30, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = -6;
  const XMAX = 16;

  const XLEFT = P ? -3.17 : -6.15;
  const XRIGHT = P ? 3.17 : 1.35;

  const BASE = P ? -3.90 : -2.40;
  const YTOP = P ? 1.60 : 1.25;

  const MAX_DENSITY = 0.24;

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

  function dashedAt(start, end, color) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function rectAt(
    p,
    w,
    h,
    color,
    opacity = 0.08,
    strokeWidth = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
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
  // FORMULA BOX
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

    const maxw = P ? FW - 1.0 : 5.2;
    const maxh = P ? 1.95 : 2.6;

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
      a.push(new M.FadeOut(boxNow));
    }

    a.push(new M.FadeIn(g));
    boxNow = g;

    return a;
  }

  // ================================================================
  // WORKSHOP MACHINE
  //
  // Reuse the visual style of lesson 14.2.1:
  // dark housing, cyan flywheel and small vibration marks.
  // ================================================================

  const MACHINE_Y = P ? -1.45 : -0.40;
  const MK = P ? 1.5 : 1;

  function makeMachine(
    offsetX = 0,
    wheelAngle = 0,
    mode = 'slow'
  ) {
    const x = CX + offsetX;
    const y = MACHINE_Y;

    const modeColor =
      mode === 'fast' ? ORANGE : BLUE;

    const housing = rectAt(
      point(x, y),
      3.15,
      2.10,
      C.muted,
      0.15,
      2
    );

    const top = rectAt(
      point(x, y + 1.12),
      2.65,
      0.20,
      C.cyan,
      0.30
    );

    const foot1 = rectAt(
      point(x - 1.02, y - 1.20),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const foot2 = rectAt(
      point(x + 1.02, y - 1.20),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const wheelCenter =
      point(x - 0.57, y + 0.04);

    const wheel = circleAt(
      wheelCenter,
      0.70,
      modeColor,
      0.06,
      3
    );

    const spokes = [];

    for (let i = 0; i < 4; i++) {
      const angle =
        wheelAngle + i * Math.PI / 2;

      spokes.push(
        lineAt(
          wheelCenter,
          point(
            wheelCenter[0] +
              0.59 * Math.cos(angle),

            wheelCenter[1] +
              0.59 * Math.sin(angle)
          ),
          modeColor,
          2.5
        )
      );
    }

    const hub = circleAt(
      wheelCenter,
      0.16,
      modeColor,
      0.9,
      1.5
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
        const yy = y + 0.62 - j * 0.88;

        const a = point(xx, yy);
        const b = point(
          xx + side * 0.15,
          yy - 0.14
        );
        const c = point(xx, yy - 0.28);

        shake.push(
          lineAt(a, b, modeColor, 2.2),
          lineAt(b, c, modeColor, 2.2)
        );
      }
    });

    const mg = new M.VGroup(
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

  const floor = lineAt(
    point(CX - 2.14 * MK, MACHINE_Y - 1.37 * MK),
    point(CX + 2.14 * MK, MACHINE_Y - 1.37 * MK),
    C.muted,
    2
  );

  const machineSlow = fittedPill(
    'Slow',
    BLUE,
    18,
    point(CX - 1.16 * MK, MACHINE_Y + 1.70 * MK),
    1.85
  );

  const machineFast = fittedPill(
    'Fast',
    ORANGE,
    18,
    point(CX + 1.16 * MK, MACHINE_Y + 1.70 * MK),
    1.85
  );

  // ================================================================
  // FIXED HORIZONTAL AXIS
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
      -6, -4, -2, 0, 2, 4,
      6, 8, 10, 12, 14, 16
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
            BASE - (P ? 0.24 : 0.21)
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
          BASE - (P ? 1.38 : 1.22)
        ),
        P ? 20 : 19,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const xAxis = makeXAxis();

  // ================================================================
  // FIXED DENSITY AXIS
  //
  // Density is a height, not an exact-reading probability.
  // Gaussian tails continue beyond the plotted window.
  // ================================================================

  function makeYAxis() {
    const parts = [
      lineAt(
        gp(XMIN, 0),
        gp(XMIN, MAX_DENSITY),
        C.muted,
        2
      )
    ];

    const ticks = [
      0,
      0.05,
      0.10,
      0.15,
      0.20
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
          value === 0
            ? '0'
            : value.toFixed(2),
          point(
            XLEFT - (P ? 0.31 : 0.35),
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

  const yAxis = makeYAxis();

  // ================================================================
  // SIX FIXED READING MARKERS
  //
  // Operating modes are hidden from the method.
  // Therefore all six readings use neutral white markers.
  //
  // Curve colors represent the two guessed components,
  // not hard assignments of individual readings.
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

  function focusReadings(
    ids,
    color = C.amber
  ) {
    return lag(
      Array.from(ids).map(id =>
        new M.Indicate(
          readings[id],
          { color }
        )
      ),
      0.95,
      0.12
    );
  }

  function gatheringOutline(values, color) {
    const left =
      px(Math.min(...values)) - 0.14;

    const right =
      px(Math.max(...values)) + 0.14;

    return rectAt(
      point(
        (left + right) / 2,
        BASE + 0.08
      ),
      right - left,
      0.49,
      color,
      0.035,
      1.7
    );
  }

  const leftGathering =
    gatheringOutline(
      [2, 3, 4],
      C.cyan
    );

  const rightGathering =
    gatheringOutline(
      [6, 7, 8],
      C.cyan
    );

  // ================================================================
  // GAUSSIAN CURVES
  //
  // Sample each mathematical curve on the same fixed grid.
  //
  // The curves are visually represented by closely spaced
  // line segments. Numerical calculations never use these
  // sampled line segments.
  //
  // Each colored component has a subdued interior fill
  // formed from vertical strips beneath its curve.
  //
  // A cyan outline represents the complete mixture.
  // ================================================================

  const SAMPLE_COUNT = 120;
  const FILL_COUNT = 100;

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

        // A tiny lower bound avoids constructing a zero-length
        // visual segment when a Gaussian tail is extremely small.

        const value = Math.max(
          fn(x),
          1e-7
        );

        objects.push(
          lineAt(
            gp(x, 0),
            gp(x, value),
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
            width + 2.8
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

  function makeBlueCurve(
    model,
    weighted = false
  ) {
    return makeCurve(
      x => weighted
        ? weighted1(x, model)
        : component1(x, model),

      BLUE,

      {
        filled: true,
        fillColor: BLUE_FILL,
        width: 2.9
      }
    );
  }

  function makeOrangeCurve(
    model,
    weighted = false
  ) {
    return makeCurve(
      x => weighted
        ? weighted2(x, model)
        : component2(x, model),

      ORANGE,

      {
        filled: true,
        fillColor: ORANGE_FILL,
        width: 2.9
      }
    );
  }

  function makeMixtureCurve(model) {
    return makeCurve(
      x => mixture(x, model),
      C.cyan,

      {
        filled: false,
        width: 3.7,
        glow: true
      }
    );
  }

  let model = { ...INITIAL };

  let blueCurve = null;
  let orangeCurve = null;
  let mixtureCurve = null;

  let componentsWeighted = false;

  function revealBlue() {
    blueCurve = makeBlueCurve(
      model,
      componentsWeighted
    );

    return [
      new M.FadeIn(blueCurve)
    ];
  }

  function revealOrange() {
    orangeCurve = makeOrangeCurve(
      model,
      componentsWeighted
    );

    return [
      new M.FadeIn(orangeCurve)
    ];
  }

  function setComponentsWeighted(weighted) {
    componentsWeighted = weighted;

    return [
      new M.Transform(
        blueCurve,
        makeBlueCurve(model, weighted),
        { runTime: 1.25 }
      ),

      new M.Transform(
        orangeCurve,
        makeOrangeCurve(model, weighted),
        { runTime: 1.25 }
      )
    ];
  }

  function revealMixture() {
    mixtureCurve =
      makeMixtureCurve(model);

    return [
      new M.FadeIn(mixtureCurve)
    ];
  }

  function hideMixture() {
    if (!mixtureCurve) {
      return [];
    }

    const old = mixtureCurve;
    mixtureCurve = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // MOVING MODEL PARAMETERS
  //
  // Update the guessed model while keeping reading positions,
  // horizontal scale and vertical scale fixed.
  //
  // The complete mixture is always recalculated from the
  // current component parameters.
  // ================================================================

  function updateModel(
    next,
    runTime = 1.15
  ) {
    model = {
      ...model,
      ...next
    };

    const a = [];

    if (blueCurve) {
      a.push(
        new M.Transform(
          blueCurve,
          makeBlueCurve(
            model,
            componentsWeighted
          ),
          { runTime }
        )
      );
    }

    if (orangeCurve) {
      a.push(
        new M.Transform(
          orangeCurve,
          makeOrangeCurve(
            model,
            componentsWeighted
          ),
          { runTime }
        )
      );
    }

    if (mixtureCurve) {
      a.push(
        new M.Transform(
          mixtureCurve,
          makeMixtureCurve(model),
          { runTime }
        )
      );
    }

    if (centersNow) {
      a.push(
        new M.Transform(
          centersNow,
          makeCenters(model),
          { runTime }
        )
      );
    }

    if (parameterTag) {
      a.push(
        new M.Transform(
          parameterTag,
          makeParameterTag(model),
          { runTime }
        )
      );
    }

    if (controlPanel) {
      a.push(
        new M.Transform(
          controlPanel,
          makeControlPanel(model),
          { runTime }
        )
      );
    }

    return a;
  }

  // ================================================================
  // GLOWING CENTER DIAMONDS
  //
  // These represent guessed Gaussian centers.
  // They are not observed vibration readings.
  //
  // Diamonds are placed below the horizontal axis so that
  // they do not obscure the original reading markers.
  // ================================================================

  function diamondAt(p, color, r = 0.11) {
    const corners = [
      point(p[0], p[1] + r),
      point(p[0] + r, p[1]),
      point(p[0], p[1] - r),
      point(p[0] - r, p[1])
    ];

    const halo = new M.Dot({
      point: p,
      radius: r * 1.7,
      color
    });

    halo.setFill(color, 0.12);

    const edges = corners.map((a, i) =>
      lineAt(
        a,
        corners[(i + 1) % 4],
        color,
        2.4
      )
    );

    return new M.VGroup(
      halo,
      ...edges
    );
  }

  function makeSingleCenter(
    mu,
    color,
    side = 0
  ) {
    const y =
      BASE - (P ? 0.62 : 0.55);

    const p = point(px(mu), y);

    const diamond =
      diamondAt(p, color);

    const guide = dashedAt(
      point(px(mu), BASE - 0.12),
      point(px(mu), y + 0.12),
      color
    );

    const label = fittedPill(
      `Center ${Number(mu.toFixed(2))}`,
      color,
      P ? 16 : 15,
      point(
        p[0] + side * 0.55,
        p[1] - 0.32
      ),
      1.45
    );

    return new M.VGroup(
      guide,
      diamond,
      label
    );
  }

  function makeCenters(m) {
    const identical =
      Math.abs(m.mu1 - m.mu2) < 1e-10;

    if (!identical) {
      return new M.VGroup(
        makeSingleCenter(m.mu1, BLUE, -1),
        makeSingleCenter(m.mu2, ORANGE, 1)
      );
    }

    // Coincident centers must occupy the same coordinate.
    // Use one cyan diamond with a shared text label rather
    // than drawing two misleading, displaced centers.

    const y =
      BASE - (P ? 0.62 : 0.55);

    const p = point(px(m.mu1), y);

    const guide = dashedAt(
      point(px(m.mu1), BASE - 0.12),
      point(px(m.mu1), y + 0.12),
      C.cyan
    );

    const diamond =
      diamondAt(p, C.cyan);

    const label = fittedPill(
      `Both centers = ${Number(m.mu1.toFixed(2))}`,
      C.cyan,
      P ? 16 : 15,
      point(p[0], p[1] - 0.32),
      2.15
    );

    return new M.VGroup(
      guide,
      diamond,
      label
    );
  }

  let centersNow = null;

  function revealCenters() {
    centersNow = makeCenters(model);

    return [
      new M.FadeIn(centersNow)
    ];
  }

  function clearCenters() {
    if (!centersNow) {
      return [];
    }

    const old = centersNow;
    centersNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // PARAMETER STATUS TAG
  //
  // Standard deviation and mixture weight are different
  // parameters. Keep their meanings distinct.
  // ================================================================

  let parameterTag = null;

  function makeParameterTag(m) {
    const p = P
      ? point(0, -6.25)
      : point(4.45, 1.30);

    const size = P ? 16 : 17;

    const line1 = textAt(
      `Centers: ${m.mu1} and ${m.mu2}`,
      point(p[0], p[1] + 0.27),
      size,
      C.ink,
      true
    );

    const line2 = textAt(
      `Spreads: ${m.sigma1} and ${m.sigma2}`,
      point(p[0], p[1]),
      size,
      C.muted,
      true
    );

    const line3 = textAt(
      `Weights: ${Math.round(100 * m.w1)}% and ${Math.round(100 * m.w2)}%`,
      point(p[0], p[1] - 0.27),
      size,
      C.cyan,
      true
    );

    const width =
      Math.max(
        line1.getWidth(),
        line2.getWidth(),
        line3.getWidth()
      ) + 0.45;

    const bg = rectAt(
      p,
      width,
      0.98,
      C.cyan,
      0.07,
      1.3
    );

    const g = new M.VGroup(
      bg,
      line1,
      line2,
      line3
    );

    const maxw = P ? 6.6 : 4.6;

    if (g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
      g.moveTo(p);
    }

    return g;
  }

  function revealParameters() {
    parameterTag =
      makeParameterTag(model);

    return [
      new M.FadeIn(parameterTag)
    ];
  }

  function clearParameters() {
    if (!parameterTag) {
      return [];
    }

    const old = parameterTag;
    parameterTag = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // TEMPORARY VISUAL ANNOTATIONS
  // ================================================================

  let notes = [];

  function clearNotes() {
    const a = fadeAll(notes);

    notes = [];

    return a;
  }

  function addNote(obj) {
    notes.push(obj);

    return [
      new M.FadeIn(obj)
    ];
  }

  function replaceNotes(objects) {
    const a = clearNotes();

    notes = objects.slice();

    a.push(
      ...notes.map(obj =>
        new M.FadeIn(obj)
      )
    );

    return a;
  }

  function peakMarker(
    mu,
    height,
    color,
    label = ''
  ) {
    const p = gp(mu, height);

    const halo = new M.Dot({
      point: p,
      radius: 0.16,
      color
    });

    halo.setFill(color, 0.14);

    const dot = new M.Dot({
      point: p,
      radius: 0.075,
      color
    });

    const guide = dashedAt(
      gp(mu, 0),
      p,
      color
    );

    const objects = [
      guide,
      halo,
      dot
    ];

    if (label) {
      objects.push(
        fittedPill(
          label,
          color,
          P ? 16 : 15,
          point(
            p[0],
            p[1] + 0.28
          ),
          1.70
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ================================================================
  // STANDARD DEVIATION GUIDES
  //
  // Show a horizontal interval from the Gaussian center
  // to one standard deviation to the right.
  //
  // A Gaussian has no finite full width or endpoint.
  // Standard deviation is not the distance to a curve edge.
  // ================================================================

  function makeSpreadGuide(
    mu,
    sigma,
    color,
    verticalOffset = 0
  ) {
    const h =
      gaussian(mu, mu, sigma);

    const y =
      py(h * 0.58) + verticalOffset;

    const left = px(mu);
    const right = px(mu + sigma);

    const segment = lineAt(
      point(left, y),
      point(right, y),
      color,
      2.4
    );

    const end1 = lineAt(
      point(left, y - 0.085),
      point(left, y + 0.085),
      color,
      2
    );

    const end2 = lineAt(
      point(right, y - 0.085),
      point(right, y + 0.085),
      color,
      2
    );

    const label = fittedPill(
      `σ = ${sigma}`,
      color,
      P ? 16 : 15,
      point(
        (left + right) / 2,
        y + 0.26
      ),
      1.18
    );

    return new M.VGroup(
      segment,
      end1,
      end2,
      label
    );
  }

  // ================================================================
  // OVERLAP ANNOTATION
  //
  // The two component tails overlap.
  // The highlighted interval is only a visual aid, not
  // a decision boundary or a new learned group.
  // ================================================================

  function makeOverlapNote(
    weighted = false
  ) {
    const left = px(4);
    const right = px(6);

    const height = weighted
      ? mixture(5, model)
      : Math.max(
          component1(4, model),
          component2(6, model)
        );

    const top = py(height) + 0.12;

    const r = rectAt(
      point(
        (left + right) / 2,
        (BASE + top) / 2
      ),
      right - left + 0.20,
      top - BASE,
      C.amber,
      0.025,
      1.7
    );

    const tag = fittedPill(
      'Overlap',
      C.amber,
      P ? 16 : 15,
      point(
        px(5),
        top + 0.25
      ),
      1.50
    );

    return new M.VGroup(
      r,
      tag
    );
  }

  // ================================================================
  // MIXTURE WEIGHT AREA PICTURE
  //
  // Before weighting:
  //   blue component area = 1
  //   orange component area = 1
  //
  // After weighting:
  //   blue component area = 0.5
  //   orange component area = 0.5
  //
  // Total mixture area across the whole real line = 1.
  //
  // A finite viewing window cannot display the infinite tails
  // completely, so area statements refer to the entire curves.
  // ================================================================

  function makeAreaShares(
    w1,
    w2
  ) {
    const x = P ? 0 : 4.45;
    const y = P ? -6.35 : -2.25;

    const width = P ? 5.6 : 4.2;
    const height = 0.38;

    const left = x - width / 2;

    const blueWidth = width * w1;
    const orangeWidth = width * w2;

    const blue = new M.Rectangle({
      width: blueWidth,
      height,
      color: BLUE,
      strokeWidth: 1
    });

    blue.setFill(BLUE, 0.82);

    blue.moveTo(
      point(
        left + blueWidth / 2,
        y
      )
    );

    const orange = new M.Rectangle({
      width: orangeWidth,
      height,
      color: ORANGE,
      strokeWidth: 1
    });

    orange.setFill(ORANGE, 0.82);

    orange.moveTo(
      point(
        left + blueWidth +
          orangeWidth / 2,
        y
      )
    );

    const labels = [
      textAt(
        `${Math.round(w1 * 100)}%`,
        point(
          left + blueWidth / 2,
          y
        ),
        P ? 17 : 16,
        '#0F172A',
        true
      ),

      textAt(
        `${Math.round(w2 * 100)}%`,
        point(
          left + blueWidth +
            orangeWidth / 2,
          y
        ),
        P ? 17 : 16,
        '#0F172A',
        true
      ),

      textAt(
        'Total mixture area = 1',
        point(x, y + 0.42),
        P ? 17 : 16,
        C.ink
      )
    ];

    return new M.VGroup(
      blue,
      orange,
      ...labels
    );
  }

  let areaShares = null;

  function showAreaShares(w1, w2) {
    const next = makeAreaShares(w1, w2);

    const a = [];

    if (areaShares) {
      a.push(
        new M.FadeOut(areaShares)
      );
    }

    areaShares = next;

    a.push(new M.FadeIn(next));

    return a;
  }

  function clearAreaShares() {
    if (!areaShares) {
      return [];
    }

    const old = areaShares;
    areaShares = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // DENSITY MEASUREMENTS AT A SELECTED VIBRATION
  //
  // Draw exact vertical heights on the fixed density axis.
  //
  // Raw component heights, weighted heights and combined
  // density are distinguished throughout the worked example.
  // ================================================================

  let measurementNow = null;

  function makeHeightMeasure(
    x,
    height,
    color,
    label,
    options = {}
  ) {
    const {
      shiftX = 0,
      shiftY = 0.30,
      width = 4,
      guide = true
    } = options;

    const bottom = gp(x, 0);
    const top = gp(x, height);

    const objects = [
      lineAt(
        bottom,
        top,
        color,
        width
      ),

      lineAt(
        point(top[0] - 0.09, top[1]),
        point(top[0] + 0.09, top[1]),
        color,
        2
      ),

      new M.Dot({
        point: top,
        radius: 0.065,
        color
      })
    ];

    if (guide) {
      objects.push(
        dashedAt(
          point(XLEFT, top[1]),
          top,
          color
        )
      );
    }

    if (label) {
      const labelPos = point(
        top[0] + shiftX,
        top[1] + shiftY
      );

      objects.push(
        lineAt(
          top,
          point(
            labelPos[0],
            labelPos[1] - 0.10
          ),
          color,
          1.3
        ),

        fittedPill(
          label,
          color,
          P ? 16 : 15,
          labelPos,
          2.20
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function setMeasurement(obj) {
    const a = [];

    if (measurementNow) {
      a.push(
        new M.FadeOut(measurementNow)
      );
    }

    measurementNow = obj;

    a.push(new M.FadeIn(obj));

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
  // EXACT STACKED MIXTURE CONTRIBUTIONS
  //
  // At any selected x:
  //
  // First blue segment:
  //   from 0 to w1 * g1(x).
  //
  // Second orange segment:
  //   from w1 * g1(x) to the combined density.
  //
  // The top point lies exactly on the mixture curve.
  // ================================================================

  function makeMixtureStack(
    x,
    m = INITIAL,
    withLabels = true
  ) {
    const a = weighted1(x, m);
    const b = weighted2(x, m);
    const total = a + b;

    const bottom = gp(x, 0);
    const middle = gp(x, a);
    const top = gp(x, total);

    const parts = [
      lineAt(
        bottom,
        middle,
        BLUE,
        7
      ),

      lineAt(
        middle,
        top,
        ORANGE,
        7
      ),

      lineAt(
        point(middle[0] - 0.095, middle[1]),
        point(middle[0] + 0.095, middle[1]),
        C.ink,
        1.7
      ),

      lineAt(
        point(top[0] - 0.095, top[1]),
        point(top[0] + 0.095, top[1]),
        C.ink,
        1.7
      )
    ];

    const halo = new M.Dot({
      point: top,
      radius: 0.17,
      color: C.cyan
    });

    halo.setFill(C.cyan, 0.15);

    const dot = new M.Dot({
      point: top,
      radius: 0.08,
      color: C.cyan
    });

    parts.push(halo, dot);

    if (withLabels) {
      const blueMid = (
        bottom[1] + middle[1]
      ) / 2;

      const orangeMid = (
        middle[1] + top[1]
      ) / 2;

      const leftPos = point(
        px(x) - 1.10,
        blueMid
      );

      const rightPos = point(
        px(x) + 1.15,
        orangeMid + 0.22
      );

      parts.push(
        lineAt(
          point(
            px(x) - 0.06,
            blueMid
          ),
          point(
            leftPos[0] + 0.57,
            leftPos[1]
          ),
          BLUE,
          1.3
        ),

        fittedPill(
          fmt(a),
          BLUE,
          P ? 16 : 15,
          leftPos,
          1.30
        ),

        lineAt(
          point(
            px(x) + 0.06,
            orangeMid
          ),
          point(
            rightPos[0] - 0.57,
            rightPos[1]
          ),
          ORANGE,
          1.3
        ),

        fittedPill(
          fmt(b),
          ORANGE,
          P ? 16 : 15,
          rightPos,
          1.30
        ),

        fittedPill(
          `Total ≈ ${fmt(total)}`,
          C.cyan,
          P ? 17 : 16,
          point(
            top[0],
            top[1] + 0.42
          ),
          2.45
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ================================================================
  // RAW CURVE REFERENCES FOR THE WORKED EXAMPLE
  //
  // Briefly show faint outlines of the original unweighted
  // component curves while keeping the weighted curves
  // visible.
  //
  // The faint outlines are explanatory references only.
  // They are not added again to the mixture.
  // ================================================================

  let rawReferences = [];

  function showRawReferences() {
    rawReferences = [
      makeCurve(
        x => component1(x, INITIAL),
        '#4E719E',
        {
          filled: false,
          width: 1.7
        }
      ),

      makeCurve(
        x => component2(x, INITIAL),
        '#9E6941',
        {
          filled: false,
          width: 1.7
        }
      )
    ];

    return rawReferences.map(obj =>
      new M.FadeIn(obj)
    );
  }

  function clearRawReferences() {
    const a = fadeAll(rawReferences);

    rawReferences = [];

    return a;
  }

  // ================================================================
  // TRY IT CONTROLS
  //
  // Animated illustrations of center, spread and weight controls.
  //
  // These are not live pointer-interactive UI elements.
  // The separate lesson simulation handles actual user interaction.
  // ================================================================

  let controlPanel = null;

  function makeControlRow(
    title,
    value,
    min,
    max,
    y,
    color,
    display
  ) {
    const x = P ? 0 : 4.45;
    const width = P ? 5.2 : 3.8;

    const left = x - width / 2;
    const right = x + width / 2;

    const clamped = Math.max(
      0,
      Math.min(
        1,
        (value - min) / (max - min)
      )
    );

    const knobX =
      left + clamped * width;

    const track = lineAt(
      point(left, y),
      point(right, y),
      C.muted,
      4
    );

    const knob = new M.Dot({
      point: point(knobX, y),
      radius: 0.075,
      color
    });

    const label = textAt(
      `${title}: ${display}`,
      point(
        x,
        y + 0.21
      ),
      P ? 16 : 15,
      color,
      true
    );

    return new M.VGroup(
      track,
      knob,
      label
    );
  }

  function makeControlPanel(m) {
    const y = P ? -5.85 : -1.85;

    const rows = [
      makeControlRow(
        'Blue center',
        m.mu1,
        0,
        10,
        y,
        BLUE,
        String(m.mu1)
      ),

      makeControlRow(
        'Blue spread',
        m.sigma1,
        1,
        4,
        y - 0.48,
        BLUE,
        String(m.sigma1)
      ),

      makeControlRow(
        'Blue share',
        m.w1,
        0,
        1,
        y - 0.96,
        C.cyan,
        `${Math.round(m.w1 * 100)}%`
      )
    ];

    return new M.VGroup(...rows);
  }

  function revealControls() {
    controlPanel =
      makeControlPanel(model);

    return [
      new M.FadeIn(controlPanel)
    ];
  }

  function clearControls() {
    if (!controlPanel) {
      return [];
    }

    const old = controlPanel;
    controlPanel = null;

    return [
      new M.FadeOut(old)
    ];
  }

  const newDataButton = fittedPill(
    'New data',
    C.violet,
    P ? 18 : 16,

    P
      ? point(0, -6.2)
      : point(4.45, -2.25),

    2.15
  );

  // ================================================================
  // 0 — BACK IN THE WORKSHOP
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),
    new M.Create(floor),

    ...say('BACK IN THE WORKSHOP'),

    ...fbox([
      'Observe the machine',
      ['Record its vibration', C.cyan]
    ])
  );

  // ================================================================
  // 1 — SOMETIMES SLOW, SOMETIMES FAST
  //
  // Sequential animations illustrate the two speeds.
  // No concurrent play() calls.
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(machineSlow),

    new M.Transform(
      machine,
      makeMachine(
        -0.04,
        Math.PI / 4,
        'slow'
      ),
      { runTime: 0.75 }
    ),

    ...say('SLOW OR FAST'),

    ...fbox([
      ['Slow operation', BLUE],
      'The same machine'
    ], BLUE)
  );

  await play(
    new M.FadeIn(machineFast),

    new M.Transform(
      machine,
      makeMachine(
        0.08,
        Math.PI * 0.75,
        'fast'
      ),
      { runTime: 0.40 }
    ),

    ...fbox([
      ['Slow operation', BLUE],
      ['Fast operation', ORANGE]
    ])
  );

  await play(
    new M.Transform(
      machine,
      makeMachine(
        0,
        Math.PI * 1.25,
        'fast'
      ),
      { runTime: 0.30 }
    )
  );

  // ================================================================
  // 2 — DEFINE OPERATING MODE
  // ================================================================

  await until(S(2));
  await play(
    new M.Indicate(
      machineSlow,
      { color: BLUE }
    ),

    new M.Indicate(
      machineFast,
      { color: ORANGE }
    ),

    ...say('EACH WAY OF RUNNING = AN OPERATING MODE'),

    ...fbox([
      ['Operating mode', C.cyan],
      'A particular way of running',
      ['Slow', BLUE],
      ['Fast', ORANGE]
    ])
  );

  // ================================================================
  // 3 — ONE PICTURE FOR BOTH OPERATING MODES
  // ================================================================

  await until(S(3));
  await play(
    ...say('ONE PICTURE FOR BOTH MODES', C.violet),

    ...fbox([
      'Two possible operating modes',
      ['One combined density picture', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 4 — PLACE SIX NORMAL READINGS ON A LINE
  // ================================================================

  await until(S(4));
  await play(
    new M.FadeOut(machine),
    new M.FadeOut(floor),

    new M.FadeOut(machineSlow),
    new M.FadeOut(machineFast),

    new M.FadeIn(xAxis),

    ...say('6 NORMAL VIBRATION READINGS'),

    ...fbox([
      'Previous normal readings',
      ['Operating-mode labels hidden', C.muted]
    ])
  );

  // ================================================================
  // 5–10 — REVEAL THE SIX FIXED READINGS
  //
  // These very short narration beats use short animations.
  // ================================================================

  // 5 — Two.

  await until(S(5));
  await play(
    new M.FadeIn(
      readings.A,
      { runTime: 0.20 }
    )
  );

  // 6 — Three.

  await until(S(6));
  await play(
    new M.FadeIn(
      readings.B,
      { runTime: 0.20 }
    )
  );

  // 7 — Four.

  await until(S(7));
  await play(
    new M.FadeIn(
      readings.C,
      { runTime: 0.20 }
    )
  );

  // 8 — Six.

  await until(S(8));
  await play(
    new M.FadeIn(
      readings.D,
      { runTime: 0.20 }
    )
  );

  // 9 — Seven.

  await until(S(9));
  await play(
    new M.FadeIn(
      readings.E,
      { runTime: 0.20 }
    )
  );

  // 10 — Eight.

  await until(S(10));
  await play(
    new M.FadeIn(
      readings.F,
      { runTime: 0.20 }
    )
  );

  // ================================================================
  // 11 — TWO GATHERINGS WITH A SMALL GAP
  // ================================================================

  await until(S(11));
  await play(
    new M.Create(leftGathering),
    new M.Create(rightGathering),

    ...say('TWO GATHERINGS OF READINGS'),

    ...fbox([
      '2, 3, 4',
      '6, 7, 8',
      ['A small gap between them', C.cyan]
    ])
  );

  // ================================================================
  // 12 — VIBRATION CAN CHANGE WITHIN THE SAME MODE
  //
  // Do not move the observed readings.
  // Highlight their existing variation.
  // ================================================================

  await until(S(12));
  await play(
    focusReadings('ABC', BLUE),
    focusReadings('DEF', ORANGE),

    ...say('THE SAME MODE CAN HAVE DIFFERENT READINGS'),

    ...fbox([
      'A machine does not always',
      'produce exactly the same reading',
      ['Variation within a mode', C.cyan]
    ])
  );

  // ================================================================
  // 13 — READINGS FROM TWO MODES MAY OVERLAP
  //
  // The observed six readings remain unchanged.
  // The possible ranges of future readings may overlap.
  // ================================================================

  const possibleRangeBlue = rectAt(
    point(
      (px(0) + px(6)) / 2,
      BASE + 0.61
    ),
    px(6) - px(0),
    0.34,
    BLUE,
    0.17,
    1.5
  );

  const possibleRangeOrange = rectAt(
    point(
      (px(4) + px(10)) / 2,
      BASE + 1.04
    ),
    px(10) - px(4),
    0.34,
    ORANGE,
    0.17,
    1.5
  );

  const possibleRangeTag = fittedPill(
    'Possible overlap',
    C.amber,
    P ? 16 : 15,
    point(px(5), BASE + 1.48),
    2.25
  );

  await until(S(13));
  await play(
    new M.FadeOut(leftGathering),
    new M.FadeOut(rightGathering),

    new M.FadeIn(possibleRangeBlue),
    new M.FadeIn(possibleRangeOrange),
    new M.FadeIn(possibleRangeTag),

    ...say('THE TWO MODES MAY OVERLAP', C.amber),

    ...fbox([
      ['Possible slow readings', BLUE],
      ['Possible fast readings', ORANGE],
      'Their ranges may overlap'
    ], C.amber)
  );

  // ================================================================
  // 14 — ONE ROUNDED HILL PER MODE
  //
  // Unlike kernel density estimation, this example uses
  // one component per possible operating mode,
  // not one hill per observed reading.
  // ================================================================

  await until(S(14));
  await play(
    new M.FadeOut(possibleRangeBlue),
    new M.FadeOut(possibleRangeOrange),
    new M.FadeOut(possibleRangeTag),

    new M.FadeIn(yAxis),

    ...say('ONE ROUNDED HILL FOR EACH MODE'),

    ...fbox([
      'Previous lesson:',
      'one hill per reading',
      ['This lesson: one hill per mode', C.cyan]
    ])
  );

  // ================================================================
  // 15 — BLUE HILL WITH CENTER AT 2
  // ================================================================

  await until(S(15));
  await play(
    ...revealBlue(),

    ...addNote(
      peakMarker(
        INITIAL.mu1,
        component1(INITIAL.mu1),
        BLUE,
        'Center 2'
      )
    ),

    ...say('BLUE HILL · CENTER 2', BLUE),

    ...fbox([
      ['First guessed center = 2', BLUE],
      'A rounded blue hill'
    ], BLUE)
  );

  // ================================================================
  // 16 — ORANGE HILL WITH CENTER AT 8
  // ================================================================

  await until(S(16));
  await play(
    ...revealOrange(),

    ...addNote(
      peakMarker(
        INITIAL.mu2,
        component2(INITIAL.mu2),
        ORANGE,
        'Center 8'
      )
    ),

    ...say('ORANGE HILL · CENTER 8', ORANGE),

    ...fbox([
      ['Blue center = 2', BLUE],
      ['Orange center = 8', ORANGE]
    ], ORANGE)
  );

  // ================================================================
  // 17 — CENTERS ARE STARTING GUESSES
  //
  // They are not fitted centers yet.
  // ================================================================

  await until(S(17));
  await play(
    ...clearNotes(),

    ...revealCenters(),

    ...say('STARTING GUESSES, NOT LEARNED CENTERS', C.amber),

    ...fbox([
      ['Guessed blue center = 2', BLUE],
      ['Guessed orange center = 8', ORANGE],
      ['Not learned from the data yet', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 18 — TALLEST AT THE CENTER, LOWER ON BOTH SIDES
  // ================================================================

  const blueShapeNotes = [
    peakMarker(
      2,
      component1(2),
      BLUE
    ),

    peakMarker(
      0,
      component1(0),
      BLUE
    ),

    peakMarker(
      4,
      component1(4),
      BLUE
    )
  ];

  await until(S(18));
  await play(
    ...replaceNotes(blueShapeNotes),

    ...say('TALLEST AT THE CENTER'),

    ...fbox([
      'Highest density at the center',
      'Lower on either side',
      ['A smooth, symmetric shape', C.cyan]
    ])
  );

  // ================================================================
  // 19 — THE SHAPE LOOKS LIKE A BELL
  // ================================================================

  await until(S(19));
  await play(
    ...clearNotes(),

    new M.Indicate(
      blueCurve,
      {
        color: BLUE,
        runTime: 0.7
      }
    ),

    ...say('A BELL-SHAPED CURVE')
  );

  // ================================================================
  // 20 — NAME THE GAUSSIAN CURVE
  // ================================================================

  await until(S(20));
  await play(
    ...say('THIS IS A GAUSSIAN CURVE'),

    ...fbox([
      ['Gaussian curve', C.cyan],
      'A smooth bell-shaped density',
      'Also called a normal curve'
    ])
  );

  // ================================================================
  // 21 — CURVE HEIGHT IS DENSITY
  // ================================================================

  await until(S(21));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        2,
        component1(2),
        BLUE,
        'Density',
        {
          shiftX: -0.74,
          shiftY: 0.26
        }
      )
    ),

    ...say('THE CURVE HEIGHT IS DENSITY'),

    ...fbox([
      ['Density = curve height', C.cyan],
      'Not the probability of',
      'one exact vibration reading'
    ])
  );

  // ================================================================
  // 22 — A PARAMETER CONTROLS HOW WIDELY THE CURVE SPREADS
  //
  // Temporarily illustrate a broader blue curve.
  // The orange curve and all reading positions remain fixed.
  // Restore the required standard deviation of 2 at beat 24.
  // ================================================================

  await until(S(22));
  await play(
    ...clearMeasurement(),

    ...updateModel({
      sigma1: 3
    }),

    ...say('A NUMBER CONTROLS THE SPREAD'),

    ...fbox([
      'Illustration: increase spread',
      ['Wider curve, lower peak', BLUE],
      'The center stays at 2'
    ], BLUE)
  );

  // ================================================================
  // 23 — NAME STANDARD DEVIATION
  // ================================================================

  await until(S(23));
  await play(
    ...addNote(
      makeSpreadGuide(
        model.mu1,
        model.sigma1,
        BLUE
      )
    ),

    ...say('SPREAD = STANDARD DEVIATION'),

    ...fbox([
      ['Standard deviation', C.cyan],
      'Controls the spread',
      'A larger value makes it wider'
    ])
  );

  // ================================================================
  // 24 — GIVE BOTH CURVES STANDARD DEVIATION 2
  // ================================================================

  await until(S(24));
  await play(
    ...clearNotes(),

    ...updateModel({
      sigma1: 2,
      sigma2: 2
    }),

    ...addNote(
      makeSpreadGuide(
        INITIAL.mu1,
        INITIAL.sigma1,
        BLUE
      )
    ),

    ...addNote(
      makeSpreadGuide(
        INITIAL.mu2,
        INITIAL.sigma2,
        ORANGE
      )
    ),

    ...say('BOTH STANDARD DEVIATIONS = 2'),

    ...fbox([
      ['Blue spread = 2', BLUE],
      ['Orange spread = 2', ORANGE],
      'Same spread, different centers'
    ])
  );

  // ================================================================
  // 25 — THE TWO CURVE TAILS OVERLAP
  // ================================================================

  await until(S(25));
  await play(
    ...replaceNotes([
      makeOverlapNote(false)
    ]),

    ...say('THE TAILS OVERLAP', C.amber),

    ...fbox([
      'Both curves have positive height',
      'in the middle region',
      ['The modes may overlap', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 26 — IMAGINE HALF THE READINGS COME FROM EACH MODE
  //
  // These are guessed mixture shares.
  // The model is not yet fitted.
  // ================================================================

  await until(S(26));
  await play(
    ...clearNotes(),

    ...say('ASSUME HALF THE READINGS COME FROM EACH MODE'),

    ...fbox([
      ['Blue mode: 50%', BLUE],
      ['Orange mode: 50%', ORANGE],
      'Equal starting shares'
    ])
  );

  // ================================================================
  // 27 — EACH CURVE SHOULD CONTRIBUTE ONLY ITS OWN SHARE
  // ================================================================

  await until(S(27));
  await play(
    ...say('EACH CURVE CONTRIBUTES ITS OWN SHARE'),

    ...fbox([
      'Before weighting:',
      ['Blue curve area = 1', BLUE],
      ['Orange curve area = 1', ORANGE],
      'We need total mixture area = 1'
    ])
  );

  // ================================================================
  // 28 — REDUCE BOTH HEIGHTS BY HALF
  //
  // Centers and standard deviations remain unchanged.
  // The transformation changes vertical height only.
  // ================================================================

  await until(S(28));
  await play(
    ...setComponentsWeighted(true),

    ...say('HALVE THE HEIGHTS, KEEP THE SPREADS'),

    ...fbox([
      ['Blue height × 0.5', BLUE],
      ['Orange height × 0.5', ORANGE],
      'Centers stay at 2 and 8',
      'Both spreads stay at 2'
    ])
  );

  // ================================================================
  // 29 — EACH WEIGHTED CURVE HAS HALF THE TOTAL AREA
  // ================================================================

  await until(S(29));
  await play(
    ...clearCenters(),

    ...showAreaShares(
      INITIAL.w1,
      INITIAL.w2
    ),

    ...say('HALF THE TOTAL AREA EACH'),

    ...fbox([
      ['Weighted blue area = 0.5', BLUE],
      ['Weighted orange area = 0.5', ORANGE],
      ['Total area = 0.5 + 0.5 = 1', C.green]
    ], C.green)
  );

  // ================================================================
  // 30 — NAME MIXTURE WEIGHT
  // ================================================================

  await until(S(30));
  await play(
    new M.Indicate(
      areaShares,
      { color: C.cyan }
    ),

    ...say('THE SHARE = MIXTURE WEIGHT'),

    ...fbox([
      ['Mixture weight', C.cyan],
      'The share contributed',
      'by one component curve'
    ])
  );

  // ================================================================
  // 31 — BOTH WEIGHTS ARE 50 PERCENT
  // ================================================================

  await until(S(31));
  await play(
    ...say('50% BLUE · 50% ORANGE'),

    ...fbox([
      ['Blue weight = 0.5 = 50%', BLUE],
      ['Orange weight = 0.5 = 50%', ORANGE],
      ['Weights sum to 1', C.green]
    ], C.green)
  );

  // ================================================================
  // 32 — ADD THE WEIGHTED HEIGHTS AT EVERY POSITION
  //
  // Demonstrate at vibration 5 before drawing the mixture.
  //
  // Contributions are equal here because the two curves
  // have equal weights and spreads, and 5 lies midway
  // between the two guessed centers.
  // ================================================================

  await until(S(32));
  await play(
    ...setMeasurement(
      makeMixtureStack(
        5,
        INITIAL,
        true
      )
    ),

    ...say('ADD BOTH WEIGHTED HEIGHTS'),

    ...fbox([
      'At vibration 5:',
      [
        `Blue ≈ ${fmt(AT5.blueWeighted)}`,
        BLUE
      ],
      [
        `Orange ≈ ${fmt(AT5.orangeWeighted)}`,
        ORANGE
      ],
      [
        `Total ≈ ${fmt(AT5.combined)}`,
        C.cyan
      ]
    ])
  );

  // ================================================================
  // 33 — ONE CURVE DESCRIBES BOTH MODES
  // ================================================================

  await until(S(33));
  await play(
    ...clearMeasurement(),

    ...revealMixture(),

    ...say('ONE COMBINED DENSITY CURVE'),

    ...fbox([
      ['Blue contribution', BLUE],
      ['+ orange contribution', ORANGE],
      ['= combined density', C.cyan]
    ])
  );

  // ================================================================
  // 34 — NAME THE GAUSSIAN MIXTURE
  // ================================================================

  await until(S(34));
  await play(
    new M.Indicate(
      mixtureCurve,
      { color: C.cyan }
    ),

    ...say('GAUSSIAN MIXTURE'),

    ...fbox([
      ['Gaussian mixture', C.cyan],
      'A weighted combination',
      'of Gaussian density curves'
    ])
  );

  // ================================================================
  // 35 — EXAMINE THE MIXTURE AT VIBRATION 4
  //
  // Reading C has vibration 4.
  // Its actual position remains fixed.
  //
  // No mode assignment is made in this lesson.
  // ================================================================

  const selected4 = new M.VGroup(
    circleAt(
      gp(4, 0),
      0.15,
      C.amber,
      0,
      2.1
    ),

    fittedPill(
      'x = 4',
      C.amber,
      P ? 16 : 15,
      point(
        px(4),
        BASE - (P ? 0.70 : 0.62)
      ),
      1.20
    )
  );

  await until(S(35));
  await play(
    ...clearAreaShares(),

    ...addNote(selected4),

    ...showRawReferences(),

    new M.Indicate(
      readings.C,
      { color: C.amber }
    ),

    ...say('EXAMINE VIBRATION 4', C.amber),

    ...fbox([
      ['Reading C: vibration = 4', C.amber],
      'Faint curves: before weighting',
      'Bright curves: after weighting'
    ], C.amber)
  );

  // ================================================================
  // 36 — UNWEIGHTED BLUE HEIGHT ≈ 0.121
  //
  // Exact displayed reference:
  // 0.120985
  // ================================================================

  await until(S(36));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blue,
        BLUE,
        fmt(AT4.blue),
        {
          shiftX: -0.90,
          shiftY: 0.26
        }
      )
    ),

    ...say('BLUE HEIGHT BEFORE WEIGHTING ≈ 0.121', BLUE),

    ...fbox([
      ['At vibration 4', C.amber],
      'Blue Gaussian height:',
      [
        `≈ ${fmt(AT4.blue)}`,
        BLUE
      ],
      'Before applying its weight'
    ], BLUE)
  );

  // ================================================================
  // 37 — UNWEIGHTED ORANGE HEIGHT ≈ 0.027
  //
  // Exact displayed reference:
  // 0.026995
  // ================================================================

  await until(S(37));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.orange,
        ORANGE,
        fmt(AT4.orange),
        {
          shiftX: 1.00,
          shiftY: 0.24
        }
      )
    ),

    ...say('ORANGE HEIGHT BEFORE WEIGHTING ≈ 0.027', ORANGE),

    ...fbox([
      [
        `Blue height ≈ ${fmt(AT4.blue)}`,
        BLUE
      ],
      [
        `Orange height ≈ ${fmt(AT4.orange)}`,
        ORANGE
      ],
      'Both are unweighted heights'
    ], ORANGE)
  );

  // ================================================================
  // 38 — TAKE HALF THE BLUE HEIGHT
  // ================================================================

  await until(S(38));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blue,
        BLUE,
        'Original blue height',
        {
          shiftX: -0.98,
          shiftY: 0.27
        }
      )
    ),

    ...say('BLUE CONTRIBUTION = BLUE HEIGHT × 0.5', BLUE),

    ...fbox([
      ['Blue weight = 0.5', BLUE],
      'Take half the original height',
      `≈ ${fmt(AT4.blue)} × 0.5`
    ], BLUE)
  );

  // ================================================================
  // 39 — WEIGHTED BLUE CONTRIBUTION ≈ 0.0605
  //
  // Full-precision calculation rounds to 0.060493.
  // ================================================================

  await until(S(39));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.blueWeighted,
        BLUE,
        fmt(AT4.blueWeighted),
        {
          shiftX: -2.05,
          shiftY: 0.32
        }
      )
    ),

    ...say('BLUE CONTRIBUTION ≈ 0.0605', BLUE),

    ...fbox([
      `≈ ${fmt(AT4.blue)} × 0.5`,
      [
        `≈ ${fmt(AT4.blueWeighted)}`,
        BLUE
      ],
      ['Weighted blue height', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 40 — WEIGHTED ORANGE CONTRIBUTION ≈ 0.0135
  //
  // Full-precision calculation rounds to 0.013498.
  // ================================================================

  await until(S(40));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.orangeWeighted,
        ORANGE,
        fmt(AT4.orangeWeighted),
        {
          shiftX: 1.03,
          shiftY: 0.32
        }
      )
    ),

    ...say('ORANGE CONTRIBUTION ≈ 0.0135', ORANGE),

    ...fbox([
      ['Orange weight = 0.5', ORANGE],
      `≈ ${fmt(AT4.orange)} × 0.5`,
      [
        `≈ ${fmt(AT4.orangeWeighted)}`,
        ORANGE
      ]
    ], ORANGE)
  );

  // ================================================================
  // 41 — ADD THE TWO WEIGHTED CONTRIBUTIONS
  //
  // Blue:   0.060493
  // Orange: 0.013498
  //
  // Combined density: 0.073990
  //
  // Calculate before rounding.
  // ================================================================

  await until(S(41));
  await play(
    ...clearRawReferences(),

    ...setMeasurement(
      makeMixtureStack(
        4,
        INITIAL,
        true
      )
    ),

    ...say('ADD THE CONTRIBUTIONS ≈ 0.074'),

    ...fbox([
      [
        `Blue ≈ ${fmt(AT4.blueWeighted)}`,
        BLUE
      ],
      [
        `Orange ≈ ${fmt(AT4.orangeWeighted)}`,
        ORANGE
      ],
      [
        `Combined ≈ ${fmt(AT4.combined)}`,
        C.cyan
      ],
      ['Calculated before rounding', C.muted]
    ])
  );

  // ================================================================
  // 42 — THE RESULT IS THE MIXTURE HEIGHT AT 4
  //
  // The top of the stacked contributions lies exactly
  // on the cyan combined density curve.
  // ================================================================

  await until(S(42));
  await play(
    ...setMeasurement(
      makeHeightMeasure(
        4,
        AT4.combined,
        C.cyan,
        fmt(AT4.combined),
        {
          shiftX: -0.94,
          shiftY: 0.38
        }
      )
    ),

    ...say('MIXTURE HEIGHT AT VIBRATION 4'),

    ...fbox([
      'At x = 4',
      [
        `Mixture density ≈ ${fmt(AT4.combined)}`,
        C.cyan
      ],
      'A height, not an exact-value probability'
    ])
  );

  // ================================================================
  // 43 — REPEAT THE CALCULATION ALONG THE LINE
  //
  // Show a moving density probe.
  // Each stack uses exact weighted Gaussian contributions.
  //
  // These are evaluation positions along the curve,
  // not additional observed readings.
  // ================================================================

  await until(S(43));
  await play(
    ...clearNotes(),

    ...setMeasurement(
      makeMixtureStack(
        2,
        INITIAL,
        false
      )
    ),

    ...say('REPEAT AT EVERY POSITION'),

    ...fbox([
      'Evaluate both Gaussian heights',
      'Multiply by their weights',
      ['Add the weighted heights', C.cyan]
    ])
  );

  await play(
    ...setMeasurement(
      makeMixtureStack(
        5,
        INITIAL,
        false
      )
    )
  );

  await play(
    ...setMeasurement(
      makeMixtureStack(
        8,
        INITIAL,
        false
      )
    )
  );

  // ================================================================
  // 44 — INTRODUCE THE GENERAL FORMULA
  // ================================================================

  await until(S(44));
  await play(
    ...clearMeasurement(),

    ...say('WRITE THE MIXTURE RULE'),

    ...fbox([
      ['Mixture density', C.cyan],
      'Two curves',
      'Two weights',
      'One combined height'
    ])
  );

  // ================================================================
  // 45 — MIXTURE DENSITY FORMULA
  //
  // p(x) = w1 * g1(x) + w2 * g2(x)
  //
  // For the current example:
  //
  // p(x) = 0.5 * g1(x) + 0.5 * g2(x)
  // ================================================================

  await until(S(45));
  await play(
    ...say('WEIGHT EACH CURVE, THEN ADD'),

    ...fbox([
      ['Mixture density =', C.cyan],
      ['  first height × first weight', BLUE],
      ['+ second height × second weight', ORANGE],
      'p(x) = w1 × g1(x) + w2 × g2(x)'
    ])
  );

  // ================================================================
  // 46 — USEFUL WHEN POSSIBLE GROUPS OVERLAP
  // ================================================================

  await until(S(46));
  await play(
    ...replaceNotes([
      makeOverlapNote(true)
    ]),

    ...say('USEFUL FOR OVERLAPPING GROUPS'),

    ...fbox([
      'Readings may come from',
      'several possible groups',
      ['Their ranges can overlap', C.amber]
    ])
  );

  // ================================================================
  // 47 — ONE PICTURE DESCRIBES ALL THE GROUPS TOGETHER
  // ================================================================

  await until(S(47));
  await play(
    ...clearNotes(),

    new M.Indicate(
      mixtureCurve,
      { color: C.cyan }
    ),

    ...say('ONE PICTURE FOR SEVERAL POSSIBLE GROUPS'),

    ...fbox([
      ['First component', BLUE],
      ['Second component', ORANGE],
      ['One combined density', C.cyan]
    ])
  );

  // ================================================================
  // 48 — DRAWING TWO CURVES DOES NOT PROVE TWO REAL GROUPS EXIST
  //
  // The two components are model assumptions.
  // The original observations are still unlabelled.
  // ================================================================

  await until(S(48));
  await play(
    focusReadings(
      'ABCDEF',
      C.amber
    ),

    ...say('TWO DRAWN CURVES DO NOT PROVE TWO REAL GROUPS', C.amber),

    ...fbox([
      'A Gaussian mixture is a model',
      ['Two components are an assumption', C.amber],
      'Check the data and real situation'
    ], C.amber)
  );

  // ================================================================
  // 49 — TRY IT: CHANGE CENTERS, SPREADS AND SHARES
  //
  // Animate an illustrative change to all three types
  // of parameters.
  //
  // The fixed six readings never move.
  // Weights always sum to 1.
  // ================================================================

  await until(S(49));
  await play(
    ...revealControls(),

    ...say('TRY IT: CHANGE THE MODEL'),

    ...fbox([
      'Move the centers',
      'Change the standard deviations',
      'Adjust the mixture weights',
      ['Watch the combined curve', C.cyan]
    ])
  );

  await play(
    ...updateModel(
      {
        mu1: 3,
        mu2: 7,
        sigma1: 2.7,
        sigma2: 2,
        w1: 0.6,
        w2: 0.4
      },
      1.25
    )
  );

  // ================================================================
  // 50 — MAKE BOTH GAUSSIAN CURVES IDENTICAL
  //
  // Illustrative model:
  //
  // Centers: 5 and 5.
  // Standard deviations: 2 and 2.
  // Weights: 0.5 and 0.5.
  //
  // Because g1(x) = g2(x):
  //
  // 0.5*g1(x) + 0.5*g2(x)
  // = g1(x)
  //
  // The mixture is exactly one Gaussian curve.
  // ================================================================

  const IDENTICAL = {
    mu1: 5,
    mu2: 5,
    sigma1: 2,
    sigma2: 2,
    w1: 0.5,
    w2: 0.5
  };

  await until(S(50));
  await play(
    ...updateModel(
      IDENTICAL,
      1.45
    ),

    ...say('IDENTICAL CURVES PRODUCE ONE BELL'),

    ...fbox([
      ['Both centers = 5', C.cyan],
      'Both standard deviations = 2',
      '0.5 × g(x) + 0.5 × g(x)',
      ['= g(x)', C.green]
    ], C.green)
  );

  // ================================================================
  // 51 — BLUE SHARE 80%, ORANGE SHARE 20%
  //
  // First restore the distinct initial centers and spreads.
  // This makes the effect of changing mixture weights visible.
  //
  // If the curves remained identical, changing their weights
  // would not change the combined density, provided that
  // their weights still summed to 1.
  //
  // The two plays are sequential.
  // ================================================================

  await until(S(51));
  await play(
    ...updateModel(
      {
        ...INITIAL
      },
      0.90
    ),

    ...say('COMPARE UNEQUAL MIXTURE WEIGHTS'),

    ...fbox([
      'Separate the centers again',
      ['Blue center = 2', BLUE],
      ['Orange center = 8', ORANGE]
    ])
  );

  await play(
    ...updateModel(
      {
        w1: 0.8,
        w2: 0.2
      },
      1.25
    ),

    ...fbox([
      ['Blue share = 80%', BLUE],
      ['Orange share = 20%', ORANGE],
      '0.8 + 0.2 = 1',
      'Blue contributes more density'
    ])
  );

  // ================================================================
  // 52 — PRESS NEW DATA IN THE SEPARATE TRY IT ACTIVITY
  //
  // The narrated dataset must remain fixed in this scene.
  // Therefore illustrate the button without inventing new
  // recorded values.
  // ================================================================

  await until(S(52));
  await play(
    ...clearControls(),

    new M.FadeIn(newDataButton),

    ...say('NEW DATA · EXPLORE NEW CURVE POSITIONS', C.violet),

    ...fbox([
      ['Press New data in Try it', C.violet],
      'Explore different center guesses',
      'Try different spreads and shares'
    ], C.violet)
  );

  // ================================================================
  // 53 — PREVIEW SOFT ASSIGNMENT
  //
  // Restore the exact initial model for continuity with
  // lesson 14.2.3:
  //
  // Centers: 2 and 8.
  // Standard deviations: 2 and 2.
  // Weights: 0.5 and 0.5.
  //
  // Reading C at vibration 4 receives contributions
  // from both curves.
  //
  // Do not calculate membership probabilities yet.
  // ================================================================

  await until(S(53));
  await play(
    new M.FadeOut(newDataButton),

    ...updateModel(
      INITIAL,
      1.0
    ),

    ...setMeasurement(
      makeMixtureStack(
        4,
        INITIAL,
        true
      )
    ),

    ...say('NEXT: WHICH MODE MIGHT A READING BELONG TO?', C.violet),

    ...fbox([
      'Reading C: vibration 4',
      [
        `Blue contribution ≈ ${fmt(AT4.blueWeighted)}`,
        BLUE
      ],
      [
        `Orange contribution ≈ ${fmt(AT4.orangeWeighted)}`,
        ORANGE
      ],
      ['Could it belong to either mode?', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Preserve the exact six observations.
  // Restore the required initial model.
  //
  // A Gaussian mixture adds bell-shaped density curves,
  // with each curve contributing its own weighted share.
  // ================================================================

  await until(S(54));
  await play(
    ...clearMeasurement(),
    ...clearNotes(),
    ...clearRawReferences(),

    ...revealParameters(),

    new M.Indicate(
      mixtureCurve,
      { color: C.cyan }
    ),

    ...say('ADD BELL-SHAPED CURVES, EACH WITH ITS OWN SHARE'),

    ...fbox([
      ['Gaussian mixture', C.cyan],
      ['Blue Gaussian × 0.5', BLUE],
      ['+ orange Gaussian × 0.5', ORANGE],
      ['= one combined density', C.green],
      'Several possible overlapping groups'
    ], C.green)
  );
}
