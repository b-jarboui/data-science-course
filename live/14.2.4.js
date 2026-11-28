// lesson 14.2.4
// Expectation–maximization: learning through repeated soft assignment.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Fixed normal vibration readings: 2, 3, 4, 6, 7, 8 mm/s.
// Starting Gaussian centers: 2 and 8.
// Both standard deviations remain fixed at 2.
// Both mixture weights remain fixed at 0.5.
//
// Every EM iteration is calculated using full numerical precision.
// The loss is the negative sum of natural logarithms of mixture densities.
// Known operating-mode labels remain hidden throughout the fitting process.
//
// Try it controls illustrate the separate interactive simulation.
// Browser rendering has not been verified against the actual engine runtime.

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

  // Only vibration values enter the fitting calculations.
  // The recorded operating modes are not used.

  const VALUES = DATA.map(d => d.x);
  const N = VALUES.length;

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  const BLUE_FILL = '#223D60';
  const ORANGE_FILL = '#603D25';

  const SIGMA = 2;
  const WEIGHT_BLUE = 0.5;
  const WEIGHT_ORANGE = 0.5;

  const START_BLUE = 2;
  const START_ORANGE = 8;

  const TARGET_LOSS = 13.12;

  // ================================================================
  // EXACT GAUSSIAN CALCULATIONS
  //
  // Gaussian density:
  //
  // g(x; mu, sigma) =
  //   exp(-0.5 * ((x - mu) / sigma)^2)
  //   / (sigma * sqrt(2*pi))
  //
  // Both standard deviations and mixture weights remain fixed.
  // Only the centers are updated in this simplified EM example.
  // ================================================================

  function gaussian(x, mu) {
    const z = (x - mu) / SIGMA;

    return Math.exp(-0.5 * z * z) /
      (SIGMA * Math.sqrt(2 * Math.PI));
  }

  function weightedBlue(x, muBlue) {
    return WEIGHT_BLUE * gaussian(
      x,
      muBlue
    );
  }

  function weightedOrange(x, muOrange) {
    return WEIGHT_ORANGE * gaussian(
      x,
      muOrange
    );
  }

  function mixtureDensity(
    x,
    muBlue,
    muOrange
  ) {
    return (
      weightedBlue(x, muBlue) +
      weightedOrange(x, muOrange)
    );
  }

  function sum(values) {
    return values.reduce(
      (a, b) => a + b,
      0
    );
  }

  function fmt(value, digits = 2) {
    return value.toFixed(digits);
  }

  function signed(value, digits = 2) {
    const rounded = value.toFixed(digits);

    if (
      Number(rounded) === 0
    ) {
      return Number(0).toFixed(digits);
    }

    return value > 0
      ? `+${rounded}`
      : rounded.replace('-', '−');
  }

  function pct(value, digits = 0) {
    return `${(100 * value).toFixed(digits)}%`;
  }

  // ================================================================
  // EXPECTATION STEP
  //
  // Calculate every reading's membership shares using
  // the OLD center positions.
  //
  // rBlue + rOrange = 1 for every reading.
  //
  // These are soft assignments, not hard group labels.
  // ================================================================

  function expectation(muBlue, muOrange) {
    return DATA.map(d => {
      const blue = weightedBlue(
        d.x,
        muBlue
      );

      const orange = weightedOrange(
        d.x,
        muOrange
      );

      const total = blue + orange;

      const rBlue = blue / total;
      const rOrange = orange / total;

      return {
        id: d.id,
        x: d.x,

        densityBlue: blue,
        densityOrange: orange,
        densityTotal: total,

        rBlue,
        rOrange,

        weightedReadingBlue:
          d.x * rBlue,

        weightedReadingOrange:
          d.x * rOrange
      };
    });
  }

  // ================================================================
  // MAXIMIZATION STEP
  //
  // Update each center using its membership-weighted mean.
  //
  // New center =
  //   sum(reading * membership)
  //   / sum(membership)
  //
  // The same expectation-step memberships are used for
  // both center updates.
  //
  // Do not recompute memberships halfway through the M-step.
  // ================================================================

  function maximization(rows) {
    const totalWeightBlue = sum(
      rows.map(r => r.rBlue)
    );

    const totalWeightOrange = sum(
      rows.map(r => r.rOrange)
    );

    const weightedTotalBlue = sum(
      rows.map(r =>
        r.weightedReadingBlue
      )
    );

    const weightedTotalOrange = sum(
      rows.map(r =>
        r.weightedReadingOrange
      )
    );

    const muBlue =
      weightedTotalBlue /
      totalWeightBlue;

    const muOrange =
      weightedTotalOrange /
      totalWeightOrange;

    return {
      totalWeightBlue,
      totalWeightOrange,

      weightedTotalBlue,
      weightedTotalOrange,

      muBlue,
      muOrange
    };
  }

  // ================================================================
  // LOSS
  //
  // Loss = -sum(log(p(x)))
  //
  // The logarithm is the natural logarithm.
  //
  // Lower mixture densities produce larger penalties.
  // Smaller total loss indicates a better fit according
  // to this measure.
  // ================================================================

  function penalties(muBlue, muOrange) {
    return DATA.map(d => {
      const density =
        mixtureDensity(
          d.x,
          muBlue,
          muOrange
        );

      return {
        id: d.id,
        x: d.x,
        density,
        penalty: -Math.log(density)
      };
    });
  }

  function loss(muBlue, muOrange) {
    return sum(
      penalties(muBlue, muOrange)
        .map(r => r.penalty)
    );
  }

  function makeState(
    iteration,
    muBlue,
    muOrange
  ) {
    return {
      iteration,
      muBlue,
      muOrange,

      loss: loss(
        muBlue,
        muOrange
      )
    };
  }

  function emStep(state) {
    const rows = expectation(
      state.muBlue,
      state.muOrange
    );

    const update =
      maximization(rows);

    const next = makeState(
      state.iteration + 1,
      update.muBlue,
      update.muOrange
    );

    return {
      old: state,

      rows,

      totalWeightBlue:
        update.totalWeightBlue,

      totalWeightOrange:
        update.totalWeightOrange,

      weightedTotalBlue:
        update.weightedTotalBlue,

      weightedTotalOrange:
        update.weightedTotalOrange,

      changeBlue:
        next.muBlue - state.muBlue,

      changeOrange:
        next.muOrange - state.muOrange,

      lossReduction:
        state.loss - next.loss,

      next
    };
  }

  // ================================================================
  // PRECALCULATE THE FIXED NARRATED EM RUN
  //
  // Calculations are performed with full precision.
  //
  // State 0:
  //   Centers 2 and 8
  //   Loss 14.5593
  //
  // Iteration 1:
  //   Weighted totals 9.6205 and 20.3795
  //   Centers 3.2068 and 6.7932
  //   Loss 13.2399
  //
  // Iteration 2:
  //   Weighted totals 10.5317 and 19.4683
  //   Centers 3.5106 and 6.4894
  //   Loss 13.1396
  //
  // Iteration 3:
  //   Weighted totals 10.9603 and 19.0397
  //   Centers 3.6534 and 6.3466
  //   Loss 13.1158
  //
  // Convergence:
  //   Centers approximately 3.8967 and 6.1033
  //   Loss approximately 13.1019
  // ================================================================

  const INITIAL_STATE = makeState(
    0,
    START_BLUE,
    START_ORANGE
  );

  const STATES = [INITIAL_STATE];
  const STEPS = [];

  const FINAL_ITERATION = 40;

  for (
    let i = 0;
    i < FINAL_ITERATION;
    i++
  ) {
    const step = emStep(
      STATES[i]
    );

    STEPS.push(step);
    STATES.push(step.next);
  }

  const STEP1 = STEPS[0];
  const STEP2 = STEPS[1];
  const STEP3 = STEPS[2];

  const FINAL_STATE =
    STATES[FINAL_ITERATION];

  const FINAL_MEMBERSHIPS =
    expectation(
      FINAL_STATE.muBlue,
      FINAL_STATE.muOrange
    );

  const SAME_CENTER_START =
    makeState(0, 5, 5);

  const SAME_CENTER_STEP =
    emStep(SAME_CENTER_START);

  const SAME_CENTER_HISTORY = [
    SAME_CENTER_START,
    SAME_CENTER_STEP.next
  ];

  for (let i = 1; i < 5; i++) {
    SAME_CENTER_HISTORY.push(
      emStep(
        SAME_CENTER_HISTORY[i]
      ).next
    );
  }

  // Find the first iteration whose full-precision loss
  // is strictly below the narrated target.

  const FIRST_BELOW_TARGET =
    STATES.findIndex(
      state => state.loss < TARGET_LOSS
    );

  // Expected: iteration 3.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 x 14.22
  //         content y = -5.5 to 4.3
  //
  // Laptop: 14.22 x 8
  //         content y = -3.0 to 2.3
  //
  // Phone:
  //   Formula box
  //   Narration pill
  //   Gaussian curves
  //   Membership shares
  //   Growing loss chart
  //
  // Laptop:
  //   Gaussian curves and membership shares on the left.
  //   Formula box and loss chart on the right.
  //
  // All original readings retain their screen coordinates.
  // Only Gaussian curves and center diamonds move.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.45, 0.55, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = -2;
  const XMAX = 12;

  const XLEFT = P ? -3.12 : -6.25;
  const XRIGHT = P ? 3.12 : 1.05;

  const BASE = P ? -2.20 : -0.75;
  const YTOP = P ? 1.55 : 1.25;

  const MAX_DENSITY = 0.19;

  function px(x) {
    return XLEFT +
      (x - XMIN) /
      (XMAX - XMIN) *
      (XRIGHT - XLEFT);
  }

  function py(y) {
    return BASE +
      y / MAX_DENSITY *
      (YTOP - BASE);
  }

  function gp(x, y = 0) {
    return point(
      px(x),
      py(y)
    );
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
    const t = T(
      s,
      size,
      color,
      mono
    );

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
    strokeWidth = 1
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
    const g = pill(
      s,
      color,
      size
    );

    if (g.getWidth() > maxw) {
      g.scale(
        maxw / g.getWidth()
      );
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
      {
        lagRatio,
        runTime
      }
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
  // One formula box at a time.
  // Leading spaces indent monospace rows.
  // ================================================================

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 21 : 22;
    const lh = P ? 0.34 : 0.43;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) =>
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
      BOXP[1] + ht / 2 -
      0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent +
          t.getWidth() / 2,

        top - i * lh,

        0
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw =
      P ? FW - 1.0 : 5.0;

    const maxh =
      P ? 1.95 : 2.85;

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

    a.push(
      new M.FadeIn(g)
    );

    return a;
  }

  // ================================================================
  // WORKSHOP MACHINE
  //
  // Reuse the dark housing and cyan flywheel from
  // the preceding Gaussian-mixture lessons.
  // ================================================================

  function makeMachine() {
    const x = CX;
    const y = P ? -1.45 : -0.40;

    const housing = rectAt(
      point(x, y),
      3.15,
      2.10,
      C.muted,
      0.15,
      2
    );

    const cap = rectAt(
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
      const a =
        Math.PI / 4 +
        i * Math.PI / 2;

      spokes.push(
        lineAt(
          wc,
          point(
            wc[0] +
              0.59 * Math.cos(a),

            wc[1] +
              0.59 * Math.sin(a)
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
      point: point(
        x + 1.12,
        y + 0.76
      ),
      radius: 0.075,
      color: C.green
    });

    const shake = [];

    [-1, 1].forEach(side => {
      const xx =
        x + side * 1.75;

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
          lineAt(a, b, C.amber, 2),
          lineAt(b, c, C.amber, 2)
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
      cap,
      foot1,
      foot2,
      wheel,
      ...spokes,
      hub,
      ...vents,
      light,
      ...shake
    );
    if (P) mg.scale(1.45);
    return mg;
  }

  const machine = makeMachine();
  // Phone: a smaller copy of the machine stays in the lower part
  // while the readings are placed (the readings come from it).
  const machineLow = makeMachine();
  if (P) {
    machineLow.scale(0.62);
    machineLow.moveTo(point(0, -5.25));
  }

  const machineSlow = fittedPill(
    'Slow mode',
    BLUE,
    18,
    point(
      CX - 1.25,
      P ? 1.20 : 1.32
    ),
    2.20
  );

  const machineFast = fittedPill(
    'Fast mode',
    ORANGE,
    18,
    point(
      CX + 1.25,
      P ? 1.20 : 1.32
    ),
    2.20
  );

  const introDataTag = fittedPill(
    '6 readings · Mode labels hidden',
    C.amber,
    P ? 18 : 16,
    point(
      CX,
      P ? -3.35 : -2.28
    ),
    4.35
  );

  // ================================================================
  // FIXED GRAPH AXES
  //
  // Horizontal: vibration in mm/s.
  // Vertical: density.
  //
  // Gaussian tails extend beyond the finite viewing window.
  // Negative positions indicate mathematical curve support,
  // not additional recorded vibration readings.
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

    for (
      let x = XMIN;
      x <= XMAX;
      x++
    ) {
      parts.push(
        lineAt(
          point(px(x), BASE - 0.035),
          point(px(x), BASE + 0.035),
          C.muted,
          1.1
        ),

        textAt(
          String(x).replace('-', '−'),
          point(
            px(x),
            BASE - 0.2
          ),
          P ? 15 : 15,
          C.muted,
          true
        )
      );
    }

    parts.push(
      textAt(
        'Vibration (mm/s)',
        point(
          CX,
          BASE - 0.47
        ),
        P ? 18 : 17,
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
        1.8
      )
    ];

    [0.05, 0.10, 0.15].forEach(v => {
      const y = py(v);

      parts.push(
        lineAt(
          point(XLEFT, y),
          point(XRIGHT, y),
          '#293648',
          0.8
        ),

        lineAt(
          point(XLEFT - 0.035, y),
          point(XLEFT + 0.035, y),
          C.muted,
          1.1
        ),

        textAt(
          v.toFixed(2),
          point(
            XLEFT - 0.32,
            y
          ),
          P ? 15 : 14,
          C.muted,
          true
        )
      );
    });

    parts.push(
      textAt(
        'Density',
        point(
          XLEFT + 0.47,
          YTOP + 0.14
        ),
        P ? 16 : 15,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const xAxis = makeXAxis();
  const yAxis = makeYAxis();

  // ================================================================
  // FIXED NEUTRAL READING MARKERS
  //
  // The recorded modes remain hidden.
  // Do not color any whole reading blue or orange.
  //
  // Membership colors are displayed in separate divided bars.
  // ================================================================

  function makeReading(d) {
    const p = gp(d.x);

    const halo = new M.Dot({
      point: p,
      radius: 0.145,
      color: C.ink
    });

    halo.setFill(C.ink, 0.14);

    const dot = new M.Dot({
      point: p,
      radius: 0.075,
      color: C.ink
    });

    const label = textAt(
      d.id,
      point(
        p[0],
        BASE + 0.2
      ),
      P ? 15 : 15,
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
      1.0,
      0.10
    );
  }

  // ================================================================
  // TRANSLUCENT GAUSSIAN CURVES
  //
  // Every curve uses the same fixed sample positions.
  // This preserves topology during transformations.
  //
  // The numerical calculations are independent of
  // these sampled visual representations.
  //
  // Blue and orange represent weighted components.
  // Cyan represents their combined mixture.
  // ================================================================

  const SAMPLES = 84;
  const FILL_SAMPLES = 42;

  const CURVE_X = Array.from(
    { length: SAMPLES + 1 },

    (_, i) =>
      XMIN +
      i / SAMPLES *
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
      width = 2.7,
      glow = false
    } = options;

    const parts = [];

    if (filled) {
      for (
        let i = 0;
        i <= FILL_SAMPLES;
        i++
      ) {
        const x =
          XMIN +
          i / FILL_SAMPLES *
          (XMAX - XMIN);

        const h = Math.max(
          fn(x),
          1e-7
        );

        parts.push(
          lineAt(
            gp(x),
            gp(x, h),
            fillColor,
            2.1
          )
        );
      }
    }

    if (glow) {
      for (
        let i = 0;
        i < SAMPLES;
        i++
      ) {
        const a = CURVE_X[i];
        const b = CURVE_X[i + 1];

        parts.push(
          lineAt(
            gp(a, fn(a)),
            gp(b, fn(b)),
            '#245562',
            width + 2.5
          )
        );
      }
    }

    for (
      let i = 0;
      i < SAMPLES;
      i++
    ) {
      const a = CURVE_X[i];
      const b = CURVE_X[i + 1];

      parts.push(
        lineAt(
          gp(a, fn(a)),
          gp(b, fn(b)),
          color,
          width
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function makeBlueCurve(state) {
    return makeCurve(
      x => weightedBlue(
        x,
        state.muBlue
      ),

      BLUE,

      {
        filled: true,
        fillColor: BLUE_FILL
      }
    );
  }

  function makeOrangeCurve(state) {
    return makeCurve(
      x => weightedOrange(
        x,
        state.muOrange
      ),

      ORANGE,

      {
        filled: true,
        fillColor: ORANGE_FILL
      }
    );
  }

  function makeMixtureCurve(state) {
    return makeCurve(
      x => mixtureDensity(
        x,
        state.muBlue,
        state.muOrange
      ),

      C.cyan,

      {
        filled: false,
        glow: true,
        width: 3.5
      }
    );
  }

  let currentState =
    INITIAL_STATE;

  let blueCurve = null;
  let orangeCurve = null;
  let mixtureCurve = null;

  function revealCurves() {
    blueCurve =
      makeBlueCurve(currentState);

    orangeCurve =
      makeOrangeCurve(currentState);

    return [
      new M.FadeIn(blueCurve),
      new M.FadeIn(orangeCurve)
    ];
  }

  function revealMixture() {
    if (mixtureCurve) {
      return [];
    }

    mixtureCurve =
      makeMixtureCurve(currentState);

    return [
      new M.FadeIn(mixtureCurve)
    ];
  }

  // ================================================================
  // MOVING CENTER DIAMONDS
  //
  // The diamonds are model parameters, not observations.
  //
  // Their horizontal positions correspond exactly to
  // the current center values.
  //
  // Identical centers share the same horizontal coordinate.
  // Their labels are separated to preserve readability.
  // ================================================================

  function diamondAt(
    p,
    color,
    r = 0.095
  ) {
    const corners = [
      point(p[0], p[1] + r),
      point(p[0] + r, p[1]),
      point(p[0], p[1] - r),
      point(p[0] - r, p[1])
    ];

    const halo = new M.Dot({
      point: p,
      radius: r * 1.8,
      color
    });

    halo.setFill(color, 0.14);

    const edges = corners.map(
      (a, i) =>
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

  function makeCenter(
    mu,
    color,
    name,
    side
  ) {
    const h =
      WEIGHT_BLUE *
      gaussian(mu, mu);

    const p = gp(mu, h);

    const marker = diamondAt(
      p,
      color
    );

    const guide = dashedAt(
      gp(mu, 0),
      p,
      color
    );

    const labelY =
      py(Math.max(
        h,
        mixtureDensity(
          mu,
          currentState.muBlue,
          currentState.muOrange
        )
      )) + 0.32;

    const labelPos = point(
      p[0] + side * 0.46,
      labelY
    );

    const label = fittedPill(
      `${name} ${fmt(mu)}`,
      color,
      P ? 16 : 15,
      labelPos,
      1.9
    );

    const leader = lineAt(
      point(p[0], p[1] + 0.09),
      point(
        labelPos[0],
        labelPos[1] - 0.12
      ),
      color,
      1.2
    );

    return new M.VGroup(
      guide,
      marker,
      leader,
      label
    );
  }

  let blueCenter = null;
  let orangeCenter = null;

  function revealCenters() {
    blueCenter = makeCenter(
      currentState.muBlue,
      BLUE,
      'Blue',
      -1
    );

    orangeCenter = makeCenter(
      currentState.muOrange,
      ORANGE,
      'Orange',
      1
    );

    return [
      new M.FadeIn(blueCenter),
      new M.FadeIn(orangeCenter)
    ];
  }

  // ================================================================
  // FIXED MODEL SETTINGS
  //
  // Keep the simplified nature of the fit explicit.
  //
  // Both spreads = 2.
  // Both weights = 0.5.
  // Only the center positions are learned.
  // ================================================================

  const parameterTag = fittedPill(
    'Spread = 2 each · Weight = 0.5 each',
    C.muted,
    P ? 16 : 15,
    point(
      CX,
      P ? -3.10 : -1.55
    ),
    P ? 5.95 : 5.65
  );

  let parameterVisible = false;

  function revealParameters() {
    if (parameterVisible) {
      return [];
    }

    parameterVisible = true;

    return [
      new M.FadeIn(parameterTag)
    ];
  }

  // ================================================================
  // MODEL TRANSFORMATION
  //
  // Move both component curves and both center markers.
  //
  // Recalculate the combined mixture using the target
  // state, without moving any of the six observations.
  // ================================================================

  function moveModel(
    state,
    runTime = 1.0
  ) {
    const a = [];

    currentState = state;

    if (blueCurve) {
      a.push(
        new M.Transform(
          blueCurve,
          makeBlueCurve(state),
          { runTime }
        )
      );
    }

    if (orangeCurve) {
      a.push(
        new M.Transform(
          orangeCurve,
          makeOrangeCurve(state),
          { runTime }
        )
      );
    }

    if (mixtureCurve) {
      a.push(
        new M.Transform(
          mixtureCurve,
          makeMixtureCurve(state),
          { runTime }
        )
      );
    }

    if (blueCenter) {
      a.push(
        new M.Transform(
          blueCenter,

          makeCenter(
            state.muBlue,
            BLUE,
            'Blue',
            -1
          ),

          { runTime }
        )
      );
    }

    if (orangeCenter) {
      a.push(
        new M.Transform(
          orangeCenter,

          makeCenter(
            state.muOrange,
            ORANGE,
            'Orange',
            1
          ),

          { runTime }
        )
      );
    }

    return a;
  }

  // ================================================================
  // MEMBERSHIP SHARE PANEL
  //
  // Each reading has one full bar representing weight 1.
  //
  // Blue fraction = rBlue.
  // Orange fraction = rOrange.
  //
  // The six bars retain the same total width.
  //
  // A small share is represented by its exact width.
  // Do not enlarge small shares just to fit a label.
  //
  // The panel can show:
  //   shares,
  //   weighted readings,
  //   or the total membership weight.
  // ================================================================

  const PANEL_CX = CX;

  const PANEL_TOP =
    P ? -3.50 : -1.92;

  const PANEL_BAR_Y =
    P ? -4.10 : -2.55;

  const PANEL_SP =
    P ? 0.94 : 0.91;

  const PANEL_BAR_W =
    P ? 0.79 : 0.77;

  const PANEL_BAR_H =
    P ? 0.23 : 0.22;

  const panelX = i =>
    PANEL_CX +
    (i - 2.5) * PANEL_SP;

  function makeMembershipPanel(
    rows,
    options = {}
  ) {
    const {
      mode = 'shares',
      active = null,
      color = C.cyan,
      numbers = true,
      title = 'Each reading shares weight 1'
    } = options;

    const objects = [];

    const heading = textAt(
      title,

      point(
        PANEL_CX,
        PANEL_TOP
      ),

      P ? 17 : 16,

      color
    );

    objects.push(heading);

    rows.forEach((row, i) => {
      const x = panelX(i);

      const blueW =
        PANEL_BAR_W * row.rBlue;

      const orangeW =
        PANEL_BAR_W * row.rOrange;

      const left =
        x - PANEL_BAR_W / 2;

      const selected =
        !active || active === row.id;

      const blue = blockAt(
        point(
          left + blueW / 2,
          PANEL_BAR_Y
        ),

        blueW,
        PANEL_BAR_H,

        BLUE,

        selected ? 0.90 : 0.35
      );

      const orange = blockAt(
        point(
          left + blueW +
            orangeW / 2,

          PANEL_BAR_Y
        ),

        orangeW,
        PANEL_BAR_H,

        ORANGE,

        selected ? 0.90 : 0.35
      );

      const outline = blockAt(
        point(
          x,
          PANEL_BAR_Y
        ),

        PANEL_BAR_W,
        PANEL_BAR_H,

        C.ink,
        0,
        1
      );

      const label = textAt(
        `${row.id}: ${row.x}`,

        point(
          x,
          PANEL_BAR_Y + 0.28
        ),

        P ? 16 : 15,

        C.ink,
        true
      );

      objects.push(
        blue,
        orange,
        outline,
        label
      );

      if (numbers) {
        let upper;
        let lower;

        if (mode === 'weighted') {
          upper = fmt(
            row.weightedReadingBlue
          );

          lower = fmt(
            row.weightedReadingOrange
          );

        } else if (mode === 'decimal') {
          upper = fmt(
            row.rBlue,
            4
          );

          lower = fmt(
            row.rOrange,
            4
          );

        } else {
          upper = pct(row.rBlue);
          lower = pct(row.rOrange);
        }

        objects.push(
          textAt(
            upper,

            point(
              x,
              PANEL_BAR_Y - 0.29
            ),

            P ? 16 : 14,

            BLUE,
            true
          ),

          textAt(
            lower,

            point(
              x,
              PANEL_BAR_Y - 0.54
            ),

            P ? 16 : 14,

            ORANGE,
            true
          )
        );
      }

      if (active === row.id) {
        const r = rectAt(
          point(
            x,
            PANEL_BAR_Y - 0.10
          ),

          PANEL_BAR_W + 0.11,
          numbers ? 1.20 : 0.80,

          C.amber,
          0,
          2
        );

        objects.push(r);
      }
    });

    return new M.VGroup(...objects);
  }

  let panelNow = null;

  function replacePanel(next) {
    const a = [];

    if (panelNow) {
      a.push(
        new M.FadeOut(panelNow)
      );
    }

    panelNow = next;

    if (panelNow) {
      a.push(
        new M.FadeIn(panelNow)
      );
    }

    return a;
  }

  function showShares(
    rows,
    options = {}
  ) {
    return replacePanel(
      makeMembershipPanel(
        rows,
        options
      )
    );
  }

  function clearPanel() {
    return replacePanel(null);
  }

  // ================================================================
  // MEMBERSHIP TOTALS PICTURE
  //
  // Each mode receives a total weight of exactly 3
  // in this symmetric example.
  //
  // These are fractional membership totals, not a hard
  // count of three confirmed readings per mode.
  // ================================================================

  function makeTotalWeightsPanel(
    blueTotal,
    orangeTotal
  ) {
    const y = PANEL_BAR_Y;

    const left = PANEL_CX - 1.50;
    const right = PANEL_CX + 1.50;

    const objects = [];

    objects.push(
      textAt(
        'Sum the six membership weights',

        point(
          PANEL_CX,
          PANEL_TOP
        ),

        P ? 16 : 14,
        C.ink
      )
    );

    [
      {
        x: left,
        color: BLUE,
        value: blueTotal,
        label: 'Blue total'
      },

      {
        x: right,
        color: ORANGE,
        value: orangeTotal,
        label: 'Orange total'
      }
    ].forEach(item => {
      const bg = rectAt(
        point(item.x, y - 0.07),
        2.60,
        0.75,
        item.color,
        0.08,
        1.6
      );

      const title = textAt(
        item.label,

        point(
          item.x,
          y + 0.14
        ),

        P ? 16 : 15,
        item.color
      );

      const value = textAt(
        fmt(item.value, 2),

        point(
          item.x,
          y - 0.22
        ),

        P ? 24 : 22,
        item.color,
        true
      );

      objects.push(
        bg,
        title,
        value
      );
    });

    return new M.VGroup(...objects);
  }

  function showWeightTotals(step) {
    return replacePanel(
      makeTotalWeightsPanel(
        step.totalWeightBlue,
        step.totalWeightOrange
      )
    );
  }

  // ================================================================
  // TEMPORARY ANNOTATIONS
  //
  // Annotations are independent objects.
  // Existing visible reading markers are never regrouped.
  // ================================================================

  let notes = [];

  function clearNotes() {
    const a = fadeAll(notes);

    notes = [];

    return a;
  }

  function setNotes(objects) {
    const a = clearNotes();

    notes = objects.slice();

    a.push(
      ...notes.map(obj =>
        new M.FadeIn(obj)
      )
    );

    return a;
  }

  function selectedReading(id) {
    const d = DATA.find(
      row => row.id === id
    );

    return circleAt(
      gp(d.x),
      0.14,
      C.amber,
      0,
      2.2
    );
  }

  // ================================================================
  // MEMBERSHIP INFLUENCE LINES
  //
  // Thick connection = larger membership share.
  //
  // These are explanatory links between readings
  // and Gaussian centers.
  //
  // They are not hard assignments or Euclidean distances.
  // ================================================================

  function makeInfluenceLines(
    rows,
    state,
    component
  ) {
    const color =
      component === 'blue'
        ? BLUE
        : ORANGE;

    const mu =
      component === 'blue'
        ? state.muBlue
        : state.muOrange;

    const target = gp(
      mu,
      WEIGHT_BLUE *
        gaussian(mu, mu)
    );

    const parts = [];

    rows.forEach(r => {
      const share =
        component === 'blue'
          ? r.rBlue
          : r.rOrange;

      const from = gp(
        r.x,
        0.006
      );

      parts.push(
        lineAt(
          from,
          target,
          color,
          0.7 + 3.2 * share
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ================================================================
  // CENTER MOVEMENT ARROWS
  //
  // Arrow endpoints use the actual old and new center positions.
  //
  // During the introductory preview, the arrows suggest
  // the M-step without actually changing the model.
  // ================================================================

  function makeArrow(
    start,
    end,
    color,
    label = null
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const len = Math.hypot(dx, dy);

    if (len < 1e-9) {
      const marker = circleAt(
        start,
        0.065,
        color,
        0.30,
        1.7
      );

      return new M.VGroup(marker);
    }

    const ux = dx / len;
    const uy = dy / len;

    const head =
      Math.min(0.11, len * 0.45);

    const wing = head * 0.55;

    const a = point(
      end[0] - ux * head -
        uy * wing,

      end[1] - uy * head +
        ux * wing
    );

    const b = point(
      end[0] - ux * head +
        uy * wing,

      end[1] - uy * head -
        ux * wing
    );

    const objects = [
      lineAt(
        start,
        end,
        color,
        2.8
      ),

      lineAt(
        end,
        a,
        color,
        2.8
      ),

      lineAt(
        end,
        b,
        color,
        2.8
      )
    ];

    if (label) {
      objects.push(
        fittedPill(
          label,
          color,
          P ? 16 : 14,

          point(
            (start[0] + end[0]) / 2,

            (start[1] + end[1]) / 2 -
              0.18
          ),

          1.30
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function makeMovementNotes(
    step,
    labels = true
  ) {
    const y = BASE + 0.41;

    return [
      makeArrow(
        point(
          px(step.old.muBlue),
          y
        ),

        point(
          px(step.next.muBlue),
          y
        ),

        BLUE,

        labels
          ? signed(step.changeBlue)
          : null
      ),

      makeArrow(
        point(
          px(step.old.muOrange),
          y
        ),

        point(
          px(step.next.muOrange),
          y
        ),

        ORANGE,

        labels
          ? signed(step.changeOrange)
          : null
      )
    ];
  }

  // ================================================================
  // LOSS PENALTY PICTURE
  //
  // First inspect the mixture density at each observed reading.
  //
  // Then convert each density into a penalty:
  //
  // -ln(density)
  //
  // A lower density creates a larger penalty.
  // The sum of all six penalties is the loss.
  // ================================================================

  function makeDensityProbes(state) {
    return DATA.map(d => {
      const density = mixtureDensity(
        d.x,
        state.muBlue,
        state.muOrange
      );

      const top = gp(
        d.x,
        density
      );

      const guide = dashedAt(
        gp(d.x),
        top,
        C.amber
      );

      const dot = new M.Dot({
        point: top,
        radius: 0.055,
        color: C.amber
      });

      return new M.VGroup(
        guide,
        dot
      );
    });
  }

  function makePenaltyPanel(state) {
    const rows = penalties(
      state.muBlue,
      state.muOrange
    );

    const maxPenalty = Math.max(
      3,
      ...rows.map(r => r.penalty)
    );

    const bottom =
      PANEL_BAR_Y - 0.40;

    const maxHeight = 0.66;

    const objects = [];

    objects.push(
      textAt(
        'Penalty at each reading',

        point(
          PANEL_CX,
          PANEL_TOP
        ),

        P ? 16 : 14,
        C.amber
      )
    );

    rows.forEach((r, i) => {
      const x = panelX(i);

      const h =
        r.penalty /
        maxPenalty *
        maxHeight;

      const bar = blockAt(
        point(
          x,
          bottom + h / 2
        ),

        PANEL_BAR_W * 0.73,
        h,

        C.amber,
        0.78
      );

      const label = textAt(
        `${r.id}: ${r.x}`,

        point(
          x,
          bottom - 0.16
        ),

        P ? 16 : 14,
        C.muted,
        true
      );

      const value = textAt(
        fmt(r.penalty),

        point(
          x,
          bottom + h + 0.14
        ),

        P ? 16 : 14,
        C.amber,
        true
      );

      objects.push(
        bar,
        label,
        value
      );
    });

    return new M.VGroup(...objects);
  }

  // ================================================================
  // GROWING LOSS CHART
  //
  // The plotted values are actual losses calculated
  // after each complete EM iteration.
  //
  // State 0 is the starting model.
  //
  // The y-axis remains fixed.
  // The iteration axis expands as the run grows,
  // making the first few updates easy to inspect.
  //
  // Every actual intermediate iteration is retained,
  // even when later animation updates are accelerated.
  // ================================================================

  const LOSS_X0 =
    P ? -2.70 : 2.95;

  const LOSS_X1 =
    P ? 3.10 : 6.70;

  const LOSS_Y0 =
    P ? -6.65 : -3.40;

  const LOSS_Y1 =
    P ? -5.30 : -1.50;

  const LOSS_MIN = 13.0;
  const LOSS_MAX = 14.8;

  function lossY(value) {
    return LOSS_Y0 +
      (value - LOSS_MIN) /
      (LOSS_MAX - LOSS_MIN) *
      (LOSS_Y1 - LOSS_Y0);
  }

  function makeLossChart(
    history,
    options = {}
  ) {
    const {
      target = null,
      color = C.green,
      title = 'Learning loss'
    } = options;

    const latest =
      history[history.length - 1];

    const maxIteration = Math.max(
      3,
      latest.iteration
    );

    const lx = i =>
      LOSS_X0 +
      i / maxIteration *
      (LOSS_X1 - LOSS_X0);

    const objects = [];

    const heading = fittedPill(
      `${title} · Iteration ${latest.iteration}`,

      color,

      P ? 16 : 15,

      point(
        (LOSS_X0 + LOSS_X1) / 2,
        LOSS_Y1 + 0.27
      ),

      P ? 5.65 : 3.85
    );

    objects.push(heading);

    objects.push(
      lineAt(
        point(LOSS_X0, LOSS_Y0),
        point(LOSS_X1, LOSS_Y0),
        C.muted,
        1.7
      ),

      lineAt(
        point(LOSS_X0, LOSS_Y0),
        point(LOSS_X0, LOSS_Y1),
        C.muted,
        1.7
      )
    );

    [13, 13.5, 14, 14.5].forEach(v => {
      const y = lossY(v);

      objects.push(
        lineAt(
          point(LOSS_X0, y),
          point(LOSS_X1, y),
          '#293648',
          0.8
        ),

        textAt(
          v.toFixed(1),

          point(
            LOSS_X0 - 0.34,
            y
          ),

          P ? 15 : 14,
          C.muted,
          true
        )
      );
    });

    const tickValues =
      maxIteration <= 6

        ? Array.from(
            { length: maxIteration + 1 },
            (_, i) => i
          )

        : Array.from(
            new Set([
              0,
              Math.round(maxIteration / 4),
              Math.round(maxIteration / 2),
              Math.round(
                3 * maxIteration / 4
              ),
              maxIteration
            ])
          );

    tickValues.forEach(i => {
      const x = lx(i);

      objects.push(
        lineAt(
          point(x, LOSS_Y0 - 0.035),
          point(x, LOSS_Y0 + 0.035),
          C.muted,
          1
        ),

        textAt(
          String(i),

          point(
            x,
            LOSS_Y0 - 0.2
          ),

          P ? 15 : 14,
          C.muted,
          true
        )
      );
    });

    if (target !== null) {
      const y = lossY(target);

      objects.push(
        dashedAt(
          point(LOSS_X0, y),
          point(LOSS_X1, y),
          C.amber
        ),

        fittedPill(
          `Target ${fmt(target)}`,

          C.amber,

          P ? 15 : 14,

          point(
            LOSS_X1 - 0.55,
            y + 0.16
          ),

          1.30
        )
      );
    }

    for (
      let i = 1;
      i < history.length;
      i++
    ) {
      const old = history[i - 1];
      const next = history[i];

      objects.push(
        lineAt(
          point(
            lx(old.iteration),
            lossY(old.loss)
          ),

          point(
            lx(next.iteration),
            lossY(next.loss)
          ),

          color,
          2.7
        )
      );
    }

    history.forEach(state => {
      objects.push(
        new M.Dot({
          point: point(
            lx(state.iteration),
            lossY(state.loss)
          ),

          radius:
            history.length > 15
              ? 0.025
              : 0.042,

          color
        })
      );
    });

    const latestP = point(
      lx(latest.iteration),
      lossY(latest.loss)
    );

    const halo = new M.Dot({
      point: latestP,
      radius: 0.11,
      color
    });

    halo.setFill(color, 0.16);

    const marker = new M.Dot({
      point: latestP,
      radius: 0.058,
      color
    });

    const labelX = Math.max(
      LOSS_X0 + 0.48,

      Math.min(
        LOSS_X1 - 0.48,
        latestP[0]
      )
    );

    const labelY = Math.min(
      LOSS_Y1 - 0.12,
      latestP[1] + 0.22
    );

    const tag = fittedPill(
      fmt(latest.loss, 4),

      color,

      P ? 16 : 15,

      point(
        labelX,
        labelY
      ),

      1.35
    );

    objects.push(
      halo,
      marker,
      tag
    );

    return new M.VGroup(...objects);
  }

  let lossChart = null;

  let activeHistory = [
    INITIAL_STATE
  ];

  let targetVisible = false;

  function showLoss(
    history,
    options = {}
  ) {
    activeHistory = history.slice();

    const next = makeLossChart(
      activeHistory,

      {
        target:
          targetVisible
            ? TARGET_LOSS
            : null,

        ...options
      }
    );

    const a = [];

    if (lossChart) {
      a.push(
        new M.FadeOut(lossChart)
      );
    }

    lossChart = next;

    a.push(
      new M.FadeIn(lossChart)
    );

    return a;
  }

  // ================================================================
  // COMPLETE ITERATION VISUAL UPDATE
  //
  // Apply the already calculated state.
  // Then display the loss after that complete update.
  //
  // Membership bars may show:
  //   the shares used to produce the current update, or
  //   newly recalculated shares for the current centers.
  //
  // The panel title distinguishes these two cases.
  // ================================================================

  function applyIteration(
    index,
    options = {}
  ) {
    const {
      runTime = 1.0,
      refreshShares = false,
      movements = true
    } = options;

    const step =
      STEPS[index - 1];

    const next =
      STATES[index];

    const a = clearNotes();

    a.push(
      ...moveModel(
        next,
        runTime
      ),

      ...showLoss(
        STATES.slice(0, index + 1)
      )
    );

    if (refreshShares) {
      a.push(
        ...showShares(
          expectation(
            next.muBlue,
            next.muOrange
          ),

          {
            title:
              'Fresh shares after center update'
          }
        )
      );
    }

    if (movements) {
      a.push(
        ...setNotes(
          makeMovementNotes(step)
        )
      );
    }

    return a;
  }

  function resetModel(
    state = INITIAL_STATE,
    options = {}
  ) {
    const {
      target = false,
      title = 'Starting loss'
    } = options;

    targetVisible = target;

    return [
      ...clearNotes(),

      ...moveModel(
        state,
        0.85
      ),

      ...showShares(
        expectation(
          state.muBlue,
          state.muOrange
        ),

        {
          title:
            'Membership shares at starting centers'
        }
      ),

      ...showLoss(
        [state],
        { title }
      )
    ];
  }

  // ================================================================
  // TRY IT CONTROL PANEL
  //
  // Animated illustrations of the separate simulation.
  //
  // These are not actual pointer-interactive controls.
  // No additional data values are invented in this lesson.
  // ================================================================

  function makeControls(
    status = 'Paused',
    speed = 1
  ) {
    const y = PANEL_BAR_Y;

    const controls = [
      {
        s: 'Step',
        color: BLUE,
        x: CX - 2.14
      },

      {
        s: 'Play',
        color: C.green,
        x: CX - 0.72
      },

      {
        s: 'Pause',
        color: C.amber,
        x: CX + 0.72
      },

      {
        s: 'Reset',
        color: PURPLE,
        x: CX + 2.14
      }
    ];

    const objects = controls.map(item =>
      fittedPill(
        item.s,
        item.color,
        P ? 16 : 15,

        point(
          item.x,
          y + 0.12
        ),

        1.25
      )
    );

    const statusTag = textAt(
      status,

      point(
        CX,
        PANEL_TOP
      ),

      P ? 16 : 15,
      C.ink
    );

    objects.push(statusTag);

    const trackY = y - 0.40;
    const trackW = 3.10;

    const x0 =
      CX - trackW / 2;

    const x1 =
      CX + trackW / 2;

    const fraction =
      Math.max(
        0,
        Math.min(
          1,
          (speed - 1) / 3
        )
      );

    objects.push(
      lineAt(
        point(x0, trackY),
        point(x1, trackY),
        C.muted,
        3.5
      ),

      new M.Dot({
        point: point(
          x0 + fraction * trackW,
          trackY
        ),

        radius: 0.075,
        color: C.cyan
      }),

      textAt(
        `Speed ${speed}×`,

        point(
          CX,
          trackY - 0.18
        ),

        P ? 16 : 14,
        C.cyan,
        true
      )
    );

    return new M.VGroup(...objects);
  }

  function showControls(
    status,
    speed = 1
  ) {
    return replacePanel(
      makeControls(
        status,
        speed
      )
    );
  }

  function makeNewDataPanel() {
    const button = fittedPill(
      'New data',

      PURPLE,

      P ? 18 : 16,

      point(
        CX,
        PANEL_BAR_Y
      ),

      2.25
    );

    const label = textAt(
      'Experiment with starting centers',

      point(
        CX,
        PANEL_TOP
      ),

      P ? 16 : 14,
      C.ink
    );

    return new M.VGroup(
      label,
      button
    );
  }

  // ================================================================
  // 0 — DISCOVER THE MACHINE'S TWO OPERATING MODES
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),

    new M.FadeIn(machineSlow),
    new M.FadeIn(machineFast),

    ...say('DISCOVER TWO OPERATING MODES'),

    ...fbox([
      ['Slow operation', BLUE],
      ['Fast operation', ORANGE],
      'Learn how the machine behaves'
    ])
  );

  // ================================================================
  // 1 — SIX READINGS WITHOUT RECORDED MODE LABELS
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(introDataTag),

    ...say('6 READINGS · MODE LABELS HIDDEN', C.amber),

    ...fbox([
      'Six normal vibration readings',
      'Operating modes hidden',
      ['Learn from the vibration values', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 2 — PLACE THE READINGS ON A LINE
  // ================================================================

  await until(S(2));
  await play(
    new M.FadeOut(machine),

    new M.FadeOut(machineSlow),
    new M.FadeOut(machineFast),

    ...(P ? [new M.FadeIn(machineLow)] : []),

    new M.FadeIn(xAxis),

    ...say('PLACE THE READINGS ON A LINE'),

    ...fbox([
      'Horizontal position = vibration',
      ['Unit: mm/s', C.cyan]
    ])
  );

  // ================================================================
  // 3–8 — REVEAL THE SIX FIXED READINGS
  // ================================================================

  // 3 — Two.

  await until(S(3));
  await play(
    new M.FadeIn(
      readings.A,
      { runTime: 0.20 }
    )
  );

  // 4 — Three.

  await until(S(4));
  await play(
    new M.FadeIn(
      readings.B,
      { runTime: 0.20 }
    )
  );

  // 5 — Four.

  await until(S(5));
  await play(
    new M.FadeIn(
      readings.C,
      { runTime: 0.20 }
    )
  );

  // 6 — Six.

  await until(S(6));
  await play(
    new M.FadeIn(
      readings.D,
      { runTime: 0.20 }
    )
  );

  // 7 — Seven.

  await until(S(7));
  await play(
    new M.FadeIn(
      readings.E,
      { runTime: 0.20 }
    )
  );

  // 8 — And eight.

  await until(S(8));
  await play(
    new M.FadeIn(
      readings.F,
      { runTime: 0.20 }
    )
  );

  // ================================================================
  // 9 — FIND GOOD POSITIONS FOR TWO BELL-SHAPED CURVES
  // ================================================================

  await until(S(9));
  await play(
    new M.FadeOut(introDataTag),

    ...(P ? [new M.FadeOut(machineLow)] : []),
    new M.FadeIn(yAxis),

    focusReadings(
      'ABCDEF',
      C.cyan
    ),

    ...say('WHERE SHOULD THE TWO CURVES GO?', C.amber),

    ...fbox([
      'Two Gaussian curves',
      'Six observed readings',
      ['Find useful center positions', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 10 — START WITH CENTERS 2 AND 8
  // ================================================================

  await until(S(10));
  await play(
    ...revealCurves(),

    ...revealCenters(),

    ...say('STARTING CENTERS: 2 AND 8'),

    ...fbox([
      ['Blue center = 2', BLUE],
      ['Orange center = 8', ORANGE],
      'Starting guesses'
    ])
  );

  // ================================================================
  // 11 — FIX BOTH SPREADS AND BOTH MIXTURE WEIGHTS
  //
  // Standard deviations: 2 and 2.
  // Mixture weights: 0.5 and 0.5.
  // ================================================================

  await until(S(11));
  await play(
    ...revealParameters(),

    ...say('KEEP SPREADS AND SHARES FIXED'),

    ...fbox([
      'Standard deviations: 2 and 2',
      ['Blue weight = 0.5', BLUE],
      ['Orange weight = 0.5', ORANGE],
      ['Learn only the centers', C.cyan]
    ])
  );

  // ================================================================
  // 12 — EACH READING CAN SHARE ITS WEIGHT
  //
  // Preview the divided bars without displaying
  // the numerical membership probabilities yet.
  // ================================================================

  await until(S(12));
  await play(
    ...showShares(
      STEP1.rows,

      {
        numbers: false,

        title:
          'Each reading shares weight 1'
      }
    ),

    ...say('SHARE EACH READING BETWEEN BOTH CURVES'),

    ...fbox([
      'Each reading has total weight 1',
      ['Part goes to blue', BLUE],
      ['Part goes to orange', ORANGE]
    ])
  );

  // ================================================================
  // 13 — MORE BLUE WEIGHT MEANS MORE BLUE INFLUENCE
  //
  // Thicker influence lines represent larger blue shares.
  // These lines do not assign readings to only one group.
  // ================================================================

  await until(S(13));
  await play(
    ...setNotes([
      makeInfluenceLines(
        STEP1.rows,
        INITIAL_STATE,
        'blue'
      )
    ]),

    ...say('MORE BLUE WEIGHT → MORE BLUE INFLUENCE', BLUE),

    ...fbox([
      'A larger membership share',
      'Gives the reading more influence',
      ['Over the blue center', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 14 — MOVE CENTERS TOWARD THEIR WEIGHTED READINGS
  //
  // Preview the directions of movement.
  //
  // This is an explanatory preview only.
  // The first numerical update occurs at beat 34.
  // ================================================================

  await until(S(14));
  await play(
    ...setNotes(
      makeMovementNotes(
        STEP1,
        false
      )
    ),

    ...say('CENTERS MOVE TOWARD THEIR WEIGHTED READINGS'),

    ...fbox([
      ['Blue moves toward its influences', BLUE],
      ['Orange moves toward its influences', ORANGE],
      'Preview of a center update'
    ])
  );

  // ================================================================
  // 15 — RECALCULATE SHARES AFTER A CENTER UPDATE
  //
  // Preview the effect on the divided weight bars.
  // Do not yet commit the illustrated center movement.
  // ================================================================

  await until(S(15));
  await play(
    ...clearNotes(),

    ...showShares(
      STEP2.rows,

      {
        numbers: false,
        title:
          'Preview: shares after moving centers'
      }
    ),

    ...say('AFTER MOVING, ESTIMATE THE SHARES AGAIN'),

    ...fbox([
      'Different center positions',
      'Produce different memberships',
      ['Recalculate the shares', C.cyan]
    ])
  );

  // ================================================================
  // 16 — REPEAT BOTH STEPS
  //
  // Return to the original starting memberships.
  // Introduce the repeating learning cycle.
  // ================================================================

  await until(S(16));
  await play(
    ...showShares(
      STEP1.rows,

      {
        numbers: false,

        title:
          'Return to the starting example'
      }
    ),

    ...say('SHARE → MOVE → SHARE → MOVE'),

    ...fbox([
      ['1. Estimate membership shares', BLUE],
      ['2. Update center positions', ORANGE],
      ['Repeat', C.green]
    ], C.green)
  );

  // ================================================================
  // 17 — NAME EXPECTATION–MAXIMIZATION
  // ================================================================

  await until(S(17));
  await play(
    ...say('EXPECTATION–MAXIMIZATION (EM)'),

    ...fbox([
      ['Expectation–maximization', C.cyan],
      'EM for short',
      'Repeated estimation and updating'
    ])
  );

  // ================================================================
  // 18 — ONE COMPLETE ROUND = ONE ITERATION
  // ================================================================

  await until(S(18));
  await play(
    ...say('ONE COMPLETE ROUND = ONE ITERATION'),

    ...fbox([
      ['One iteration:', C.cyan],
      'Estimate all memberships',
      'Update both centers',
      'Then begin the next round'
    ])
  );

  // ================================================================
  // 19 — WE NEED A MEASURE OF MODEL FIT
  //
  // Reveal the combined cyan mixture density.
  // ================================================================

  await until(S(19));
  await play(
    ...clearPanel(),

    ...revealMixture(),

    ...say('HOW WELL DOES THE MODEL DESCRIBE THE DATA?', C.amber),

    ...fbox([
      'Use the combined density',
      'At each observed reading',
      ['Find a numerical measure of fit', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 20 — LOW DENSITY HEIGHTS RECEIVE LARGER PENALTIES
  //
  // The six guides terminate on the exact mixture density.
  // ================================================================

  await until(S(20));
  await play(
    ...setNotes(
      makeDensityProbes(
        INITIAL_STATE
      )
    ),

    ...say('LOWER DENSITY → LARGER PENALTY', C.amber),

    ...fbox([
      'Look at each observed reading',
      'Density = combined curve height',
      ['Penalty = −ln(density)', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 21 — ADD ALL SIX PENALTIES TO GET THE LOSS
  // ================================================================

  await until(S(21));
  await play(
    ...replacePanel(
      makePenaltyPanel(
        INITIAL_STATE
      )
    ),

    ...say('ADD THE PENALTIES = LOSS', C.amber),

    ...fbox([
      ['Loss', C.amber],
      'Add all six penalties',
      'Loss = −sum of ln(density)',
      'Use the natural logarithm'
    ], C.amber)
  );

  // ================================================================
  // 22 — SMALLER LOSS MEANS BETTER FIT BY THIS MEASURE
  // ================================================================

  await until(S(22));
  await play(
    new M.Indicate(
      panelNow,
      { color: C.green }
    ),

    ...say('SMALLER LOSS = BETTER FIT', C.green),

    ...fbox([
      'A smaller penalty total',
      'Means the model describes',
      'the observed readings better',
      ['According to this measure', C.green]
    ], C.green)
  );

  // ================================================================
  // 23 — STARTING LOSS ≈ 14.56
  //
  // Actual starting loss = 14.559300617...
  // ================================================================

  await until(S(23));
  await play(
    ...clearNotes(),

    ...clearPanel(),

    ...showLoss([
      INITIAL_STATE
    ]),

    ...say('STARTING LOSS ≈ 14.56', C.amber),

    ...fbox([
      'Iteration 0',
      'Centers: 2 and 8',
      [
        `Loss = ${fmt(INITIAL_STATE.loss, 4)}`,
        C.amber
      ]
    ], C.amber)
  );

  // ================================================================
  // 24 — ITERATION 1: CALCULATE ALL MEMBERSHIP SHARES
  //
  // Old centers: 2 and 8.
  //
  // Blue memberships:
  // 0.9890, 0.9526, 0.8176,
  // 0.1824, 0.0474, 0.0110.
  //
  // Orange memberships are the complementary shares.
  // ================================================================

  await until(S(24));
  await play(
    ...showShares(
      STEP1.rows,

      {
        mode: 'decimal',

        title:
          'Iteration 1 · Membership shares'
      }
    ),

    ...say('ITERATION 1: ESTIMATE MEMBERSHIPS'),

    ...fbox([
      ['Blue and orange shares', C.cyan],
      'Use centers 2 and 8',
      'Membership = contribution ÷ total'
    ])
  );

  // ================================================================
  // 25 — READING A AT TWO GIVES ABOUT 99% TO BLUE
  // ================================================================

  const A_FIRST = STEP1.rows[0];

  await until(S(25));
  await play(
    ...setNotes([
      selectedReading('A')
    ]),

    ...showShares(
      STEP1.rows,

      {
        active: 'A',

        title:
          'Reading A gives most weight to blue'
      }
    ),

    ...say('READING 2: ABOUT 99% BLUE', BLUE),

    ...fbox([
      'Reading A = 2',
      [
        `Blue share ≈ ${fmt(A_FIRST.rBlue, 4)}`,
        BLUE
      ],
      [
        `Orange share ≈ ${fmt(A_FIRST.rOrange, 4)}`,
        ORANGE
      ]
    ], BLUE)
  );

  // ================================================================
  // 26 — MULTIPLY READING TWO BY ITS BLUE SHARE
  // ================================================================

  await until(S(26));
  await play(
    ...say('MULTIPLY READING BY MEMBERSHIP', BLUE),

    ...fbox([
      'Weighted reading =',
      'reading × membership',
      ['2 × approximately 0.99', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 27 — WEIGHTED READING ≈ 1.98
  //
  // Use full precision before rounding.
  // ================================================================

  await until(S(27));
  await play(
    ...showShares(
      STEP1.rows,

      {
        mode: 'weighted',
        active: 'A',

        title:
          'Weighted reading = value × share'
      }
    ),

    ...say('2 × 0.99 ≈ 1.98', BLUE),

    ...fbox([
      `2 × ${fmt(A_FIRST.rBlue, 4)}`,
      [
        `≈ ${fmt(A_FIRST.weightedReadingBlue, 4)}`,
        BLUE
      ],
      ['Weighted reading ≈ 1.98', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 28 — REPEAT FOR ALL SIX READINGS
  // ================================================================

  await until(S(28));
  await play(
    ...clearNotes(),

    ...showShares(
      STEP1.rows,

      {
        mode: 'weighted',

        title:
          'All six weighted readings'
      }
    ),

    focusReadings(
      'ABCDEF',
      BLUE
    ),

    ...say('MULTIPLY EVERY READING BY ITS BLUE SHARE', BLUE),

    ...fbox([
      '2 × its blue share',
      '3 × its blue share',
      '4 × its blue share',
      'And the same for 6, 7, 8'
    ], BLUE)
  );

  // ================================================================
  // 29 — SUM BLUE WEIGHTED READINGS ≈ 9.62
  //
  // Exact weighted total ≈ 9.620476...
  // ================================================================

  await until(S(29));
  await play(
    new M.Indicate(
      panelNow,
      { color: BLUE }
    ),

    ...say('BLUE WEIGHTED TOTAL ≈ 9.62', BLUE),

    ...fbox([
      'Add the six blue weighted readings',
      [
        `Weighted total = ${fmt(STEP1.weightedTotalBlue, 4)}`,
        BLUE
      ],
      ['Approximately 9.62', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 30 — TOTAL BLUE MEMBERSHIP WEIGHT = 3
  //
  // This is a sum of fractional memberships.
  // It is not a hard count of three assigned readings.
  // ================================================================

  await until(S(30));
  await play(
    ...showWeightTotals(STEP1),

    ...say('TOTAL BLUE MEMBERSHIP WEIGHT = 3', BLUE),

    ...fbox([
      'Add the six blue membership shares',
      [
        `Total membership weight = ${fmt(STEP1.totalWeightBlue, 2)}`,
        BLUE
      ],
      'Not a hard count of readings'
    ], BLUE)
  );

  // ================================================================
  // 31 — DIVIDE WEIGHTED TOTAL BY MEMBERSHIP WEIGHT
  // ================================================================

  await until(S(31));
  await play(
    ...say('NEW CENTER = WEIGHTED TOTAL ÷ TOTAL WEIGHT'),

    ...fbox([
      ['New blue center =', BLUE],
      'sum of weighted readings',
      '────────────────────────',
      'sum of membership weights'
    ], BLUE)
  );

  // ================================================================
  // 32 — NEW BLUE CENTER ≈ 3.21
  //
  // Compute the new position without moving the model yet.
  // Both centers will be updated together at beat 34.
  // ================================================================

  await until(S(32));
  await play(
    ...setNotes([
      makeMovementNotes(
        STEP1,
        false
      )[0]
    ]),

    ...say('9.62 ÷ 3 ≈ 3.21', BLUE),

    ...fbox([
      'New blue center',
      `${fmt(STEP1.weightedTotalBlue, 4)} ÷ 3`,
      [
        `= ${fmt(STEP1.next.muBlue, 4)}`,
        BLUE
      ],
      ['Approximately 3.21', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 33 — NEW ORANGE CENTER ≈ 6.79
  //
  // Orange weighted total ≈ 20.3795.
  // Orange total membership weight = 3.
  //
  // Use the memberships from the same expectation step.
  // ================================================================

  await until(S(33));
  await play(
    ...setNotes([
      makeMovementNotes(
        STEP1,
        false
      )[1]
    ]),

    ...showShares(
      STEP1.rows,

      {
        mode: 'weighted',

        title:
          'Repeat using orange membership shares',

        color: ORANGE
      }
    ),

    ...say('ORANGE WEIGHTED MEAN ≈ 6.79', ORANGE),

    ...fbox([
      [
        `Weighted total = ${fmt(STEP1.weightedTotalOrange, 4)}`,
        ORANGE
      ],
      'Total weight = 3',
      `${fmt(STEP1.weightedTotalOrange, 4)} ÷ 3`,
      [
        `New center = ${fmt(STEP1.next.muOrange, 4)}`,
        ORANGE
      ]
    ], ORANGE)
  );

  // ================================================================
  // 34 — COMPLETE ITERATION 1
  //
  // Blue center: 2 → 3.2068.
  // Orange center: 8 → 6.7932.
  //
  // Both move inward by approximately 1.2068.
  //
  // Loss: 14.5593 → 13.2399.
  // ================================================================

  await until(S(34));
  await play(
    ...applyIteration(
      1,

      {
        runTime: 1.5,
        movements: true
      }
    ),

    ...say('ITERATION 1 COMPLETE · LOSS 13.24', C.green),

    ...fbox([
      [
        `Blue: 2 → ${fmt(STEP1.next.muBlue, 4)}`,
        BLUE
      ],
      [
        `Orange: 8 → ${fmt(STEP1.next.muOrange, 4)}`,
        ORANGE
      ],
      `Each moves ≈ ${fmt(Math.abs(STEP1.changeBlue))}`,
      [
        `Loss = ${fmt(STEP1.next.loss, 4)}`,
        C.green
      ]
    ], C.green)
  );

  // ================================================================
  // 35 — ITERATION 2: CALCULATE FRESH MEMBERSHIPS
  //
  // Use the newly learned centers.
  //
  // Blue memberships:
  // 0.9364, 0.8573, 0.7102,
  // 0.2898, 0.1427, 0.0636.
  // ================================================================

  await until(S(35));
  await play(
    ...clearNotes(),

    ...showShares(
      STEP2.rows,

      {
        mode: 'decimal',

        title:
          'Iteration 2 · Fresh memberships'
      }
    ),

    ...say('ITERATION 2: RECALCULATE THE SHARES'),

    ...fbox([
      'Use the new centers',
      [
        `Blue = ${fmt(STEP2.old.muBlue, 4)}`,
        BLUE
      ],
      [
        `Orange = ${fmt(STEP2.old.muOrange, 4)}`,
        ORANGE
      ],
      'Calculate fresh memberships'
    ])
  );

  // ================================================================
  // 36 — NEW WEIGHTED TOTALS
  //
  // Blue ≈ 10.5317.
  // Orange ≈ 19.4683.
  // ================================================================

  await until(S(36));
  await play(
    ...showShares(
      STEP2.rows,

      {
        mode: 'weighted',

        title:
          'Iteration 2 · Weighted readings'
      }
    ),

    ...say('NEW WEIGHTED TOTALS'),

    ...fbox([
      [
        `Blue total = ${fmt(STEP2.weightedTotalBlue, 4)}`,
        BLUE
      ],
      [
        `Orange total = ${fmt(STEP2.weightedTotalOrange, 4)}`,
        ORANGE
      ],
      'Approximately 10.53 and 19.47'
    ])
  );

  // ================================================================
  // 37 — DIVIDE BY THREE TO FIND THE NEXT CENTERS
  //
  // Blue ≈ 3.5106.
  // Orange ≈ 6.4894.
  // ================================================================

  await until(S(37));
  await play(
    ...showWeightTotals(STEP2),

    ...setNotes(
      makeMovementNotes(
        STEP2,
        false
      )
    ),

    ...say('NEW CENTERS: 3.51 AND 6.49'),

    ...fbox([
      [
        `${fmt(STEP2.weightedTotalBlue, 4)} ÷ 3`,
        BLUE
      ],
      [
        `Blue = ${fmt(STEP2.next.muBlue, 4)}`,
        BLUE
      ],
      [
        `${fmt(STEP2.weightedTotalOrange, 4)} ÷ 3`,
        ORANGE
      ],
      [
        `Orange = ${fmt(STEP2.next.muOrange, 4)}`,
        ORANGE
      ]
    ])
  );

  // ================================================================
  // 38 — COMPLETE ITERATION 2
  //
  // Both centers move inward by approximately 0.3037.
  // Loss decreases to 13.1396.
  // ================================================================

  await until(S(38));
  await play(
    ...applyIteration(
      2,

      {
        runTime: 1.3,
        movements: true
      }
    ),

    ...say('ITERATION 2 COMPLETE · LOSS 13.14', C.green),

    ...fbox([
      [
        `Blue movement ${signed(STEP2.changeBlue, 4)}`,
        BLUE
      ],
      [
        `Orange movement ${signed(STEP2.changeOrange, 4)}`,
        ORANGE
      ],
      'Each moves about 0.30',
      [
        `Loss = ${fmt(STEP2.next.loss, 4)}`,
        C.green
      ]
    ], C.green)
  );

  // ================================================================
  // 39 — ITERATION 3: FRESH SHARES AND WEIGHTED TOTALS
  //
  // Blue memberships:
  // 0.9033, 0.8160, 0.6780,
  // 0.3220, 0.1840, 0.0967.
  //
  // Weighted totals:
  // Blue ≈ 10.9603.
  // Orange ≈ 19.0397.
  // ================================================================

  await until(S(39));
  await play(
    ...clearNotes(),

    ...showShares(
      STEP3.rows,

      {
        mode: 'decimal',

        title:
          'Iteration 3 · Fresh memberships'
      }
    ),

    ...say('ITERATION 3: ESTIMATE AGAIN'),

    ...fbox([
      'Use centers 3.51 and 6.49',
      'Calculate fresh memberships'
    ])
  );

  await play(
    ...showShares(
      STEP3.rows,

      {
        mode: 'weighted',

        title:
          'Iteration 3 · Weighted readings'
      }
    ),

    ...fbox([
      [
        `Blue total = ${fmt(STEP3.weightedTotalBlue, 4)}`,
        BLUE
      ],
      [
        `Orange total = ${fmt(STEP3.weightedTotalOrange, 4)}`,
        ORANGE
      ],
      'Approximately 10.96 and 19.04'
    ])
  );

  // ================================================================
  // 40 — DIVIDE EACH WEIGHTED TOTAL BY THREE
  //
  // Blue center ≈ 3.6534.
  // Orange center ≈ 6.3466.
  // ================================================================

  await until(S(40));
  await play(
    ...showWeightTotals(STEP3),

    ...setNotes(
      makeMovementNotes(
        STEP3,
        false
      )
    ),

    ...say('NEW CENTERS: 3.65 AND 6.35'),

    ...fbox([
      [
        `${fmt(STEP3.weightedTotalBlue, 4)} ÷ 3`,
        BLUE
      ],
      [
        `Blue = ${fmt(STEP3.next.muBlue, 4)}`,
        BLUE
      ],
      [
        `${fmt(STEP3.weightedTotalOrange, 4)} ÷ 3`,
        ORANGE
      ],
      [
        `Orange = ${fmt(STEP3.next.muOrange, 4)}`,
        ORANGE
      ]
    ])
  );

  // ================================================================
  // 41 — COMPLETE ITERATION 3
  //
  // Both centers move inward by approximately 0.1429.
  // Loss decreases to 13.1158.
  // ================================================================

  await until(S(41));
  await play(
    ...applyIteration(
      3,

      {
        runTime: 1.2,
        movements: true
      }
    ),

    ...say('ITERATION 3 COMPLETE · LOSS 13.12', C.green),

    ...fbox([
      [
        `Blue movement ${signed(STEP3.changeBlue, 4)}`,
        BLUE
      ],
      [
        `Orange movement ${signed(STEP3.changeOrange, 4)}`,
        ORANGE
      ],
      'Each moves about 0.14',
      [
        `Loss = ${fmt(STEP3.next.loss, 4)}`,
        C.green
      ]
    ], C.green)
  );

  // ================================================================
  // 42 — ACCELERATE THE REMAINING ITERATIONS
  //
  // Every intermediate EM iteration is calculated.
  //
  // Render increasingly spaced checkpoints to compress
  // the remaining learning process into this narration beat.
  //
  // The loss chart includes every intermediate state,
  // not just the displayed checkpoints.
  //
  // Each play is awaited before the next play begins.
  // ================================================================

  await until(S(42));

  const FAST_CHECKPOINTS = [
    4,
    5,
    6,
    8,
    12,
    20,
    30,
    40
  ];

  for (
    let j = 0;
    j < FAST_CHECKPOINTS.length;
    j++
  ) {
    const i = FAST_CHECKPOINTS[j];
    const state = STATES[i];

    const a = applyIteration(
      i,

      {
        runTime: Math.max(
          0.12,
          0.38 - j * 0.035
        ),

        movements: false,
        refreshShares: true
      }
    );

    if (j === 0) {
      a.push(
        ...say(
          'SPEED UP: SMALLER AND SMALLER CHANGES',
          C.green
        )
      );
    }

    a.push(
      ...fbox([
        [
          `Iteration ${state.iteration}`,
          C.cyan
        ],
        [
          `Blue center = ${fmt(state.muBlue, 4)}`,
          BLUE
        ],
        [
          `Orange center = ${fmt(state.muOrange, 4)}`,
          ORANGE
        ],
        [
          `Loss = ${fmt(state.loss, 4)}`,
          C.green
        ]
      ], C.green)
    );

    await play(...a);
  }

  // ================================================================
  // 43 — CENTERS AND LOSS SETTLE
  //
  // The fixed-spread model converges near:
  //
  // Blue center 3.8967.
  // Orange center 6.1033.
  // Loss 13.1019.
  //
  // This is a converged solution of the simplified model,
  // not proof of the machine's true operating-mode centers.
  // ================================================================

  await until(S(43));
  await play(
    new M.Indicate(
      blueCenter,
      { color: BLUE }
    ),

    new M.Indicate(
      orangeCenter,
      { color: ORANGE }
    ),

    new M.Indicate(
      lossChart,
      { color: C.green }
    ),

    ...say('CENTERS SETTLE NEAR 3.90 AND 6.10', C.green),

    ...fbox([
      [
        `Blue = ${fmt(FINAL_STATE.muBlue, 4)}`,
        BLUE
      ],
      [
        `Orange = ${fmt(FINAL_STATE.muOrange, 4)}`,
        ORANGE
      ],
      [
        `Loss = ${fmt(FINAL_STATE.loss, 4)}`,
        C.green
      ],
      'Changes are now very small'
    ], C.green)
  );

  // ================================================================
  // 44 — NAME THE EXPECTATION STEP
  //
  // E-step: estimate membership probabilities using
  // the current model.
  // ================================================================

  await until(S(44));
  await play(
    ...showShares(
      FINAL_MEMBERSHIPS,

      {
        title:
          'Expectation step · Estimate memberships',

        color: BLUE
      }
    ),

    ...say('EXPECTATION STEP: ESTIMATE MEMBERSHIPS', BLUE),

    ...fbox([
      ['E-step = expectation', BLUE],
      'Use the current Gaussian curves',
      'Estimate every reading’s shares',
      'Keep both possible memberships'
    ], BLUE)
  );

  // ================================================================
  // 45 — NAME THE MAXIMIZATION STEP
  //
  // M-step: update the model parameters using the memberships.
  //
  // This simplified fit updates only the two centers.
  // Full Gaussian-mixture EM may also update standard
  // deviations and mixture weights.
  // ================================================================

  const FINAL_UPDATE =
    emStep(FINAL_STATE);

  await until(S(45));
  await play(
    ...showShares(
      FINAL_MEMBERSHIPS,

      {
        mode: 'weighted',

        title:
          'Maximization step · Weighted readings',

        color: ORANGE
      }
    ),

    new M.Indicate(
      blueCenter,
      { color: BLUE }
    ),

    new M.Indicate(
      orangeCenter,
      { color: ORANGE }
    ),

    ...say('MAXIMIZATION STEP: IMPROVE THE MODEL', ORANGE),

    ...fbox([
      ['M-step = maximization', ORANGE],
      'Use the membership-weighted means',
      'Update both centers',
      'This example fixes spreads and weights'
    ], ORANGE)
  );

  // ================================================================
  // 46 — GENERAL CENTER-UPDATE FORMULA
  //
  // New center =
  //
  // sum of weighted readings
  // ------------------------
  // sum of membership weights
  // ================================================================

  await until(S(46));
  await play(
    ...showWeightTotals(
      FINAL_UPDATE
    ),

    ...say('NEW CENTER = WEIGHTED MEAN'),

    ...fbox([
      ['New center =', C.cyan],
      '  sum of weighted readings',
      '  ─────────────────────────',
      '  sum of membership weights',
      'Weighted reading = x × membership'
    ])
  );

  // ================================================================
  // 47 — USEFUL FOR LEARNING ABOUT OVERLAPPING GROUPS
  //
  // The observed operating-mode labels were never used.
  // The six readings retain neutral markers.
  // ================================================================

  await until(S(47));
  await play(
    ...showShares(
      FINAL_MEMBERSHIPS,

      {
        title:
          'Learned model · Soft memberships'
      }
    ),

    ...say('LEARN ABOUT OVERLAPPING GROUPS'),

    ...fbox([
      'Operating-mode labels hidden',
      'Readings can influence both curves',
      ['Learn the curve positions', C.green],
      'Retain uncertainty about membership'
    ], C.green)
  );

  // ================================================================
  // 48 — FAILURE CASE: BOTH CENTERS START AT FIVE
  //
  // With identical centers, spreads and mixture weights,
  // both components are identical.
  //
  // Every reading has memberships 0.5 and 0.5.
  //
  // Weighted total for each component = 15.
  // Total membership weight = 3.
  //
  // Both updated centers = 15 / 3 = 5.
  //
  // The symmetry prevents the centers from separating.
  // ================================================================

  await until(S(48));
  await play(
    ...resetModel(
      SAME_CENTER_START,

      {
        title:
          'Identical-center start'
      }
    ),

    ...say('WHAT IF BOTH CENTERS START AT 5?', C.amber),

    ...fbox([
      'Both starting centers = 5',
      'Every reading: 50% and 50%',
      ['Both weighted totals = 15', C.amber],
      'Both total weights = 3'
    ], C.amber)
  );

  await play(
    ...moveModel(
      SAME_CENTER_STEP.next,
      0.6
    ),

    ...showLoss(
      SAME_CENTER_HISTORY,

      {
        title:
          'No center movement',

        color: C.amber
      }
    ),

    ...fbox([
      'New blue center = 15 ÷ 3 = 5',
      'New orange center = 15 ÷ 3 = 5',
      ['Both movements = 0', C.amber],
      'Identical starting guesses stay identical'
    ], C.amber)
  );

  // ================================================================
  // 49 — TRY IT: PRESS STEP TO SEE ONE ITERATION
  //
  // Restore the exact starting example.
  //
  // Show:
  //   old centers,
  //   memberships,
  //   weighted totals,
  //   movements,
  //   new centers,
  //   and loss.
  // ================================================================

  await until(S(49));
  await play(
    ...resetModel(
      INITIAL_STATE
    ),

    ...say('TRY IT: PRESS STEP'),

    ...fbox([
      'Old centers: 2 and 8',
      [
        `Old loss = ${fmt(INITIAL_STATE.loss, 4)}`,
        C.muted
      ],
      'First estimate the memberships',
      ['Step = one complete iteration', C.cyan]
    ])
  );

  await play(
    ...showShares(
      STEP1.rows,

      {
        mode: 'weighted',

        title:
          'Step · Membership-weighted readings'
      }
    ),

    ...fbox([
      [
        `Blue total = ${fmt(STEP1.weightedTotalBlue, 4)}`,
        BLUE
      ],
      [
        `Orange total = ${fmt(STEP1.weightedTotalOrange, 4)}`,
        ORANGE
      ],
      'Divide both by 3'
    ])
  );

  await play(
    ...applyIteration(
      1,

      {
        runTime: 0.9,
        movements: true
      }
    ),

    ...fbox([
      [
        `Blue: 2 → ${fmt(STEP1.next.muBlue)}`,
        BLUE
      ],
      [
        `Orange: 8 → ${fmt(STEP1.next.muOrange)}`,
        ORANGE
      ],
      'Movements: +1.21 and −1.21',
      [
        `New loss = ${fmt(STEP1.next.loss, 4)}`,
        C.green
      ]
    ], C.green)
  );

  // ================================================================
  // 50 — PLAY, PAUSE AND THE SPEED SLIDER
  //
  // Animate representative control states.
  // Advance the actual EM history while the model is playing.
  // Leave the model unchanged while paused.
  // ================================================================

  await until(S(50));
  await play(
    ...clearNotes(),

    ...showControls(
      'Playing',
      1
    ),

    ...say('PLAY · PAUSE · CHANGE SPEED'),

    ...fbox([
      'Play: repeat iterations',
      'Pause: stop at the current model',
      'Speed: change animation speed',
      ['Watch the loss chart grow', C.green]
    ])
  );

  await play(
    ...applyIteration(
      2,

      {
        runTime: 0.55,
        movements: false
      }
    )
  );

  await play(
    ...showControls(
      'Playing faster',
      4
    )
  );

  await play(
    ...applyIteration(
      6,

      {
        runTime: 0.35,
        movements: false
      }
    )
  );

  await play(
    ...showControls(
      'Paused at iteration 6',
      4
    ),

    ...fbox([
      'Iteration counter = 6',
      [
        `Current loss = ${fmt(STATES[6].loss, 4)}`,
        C.green
      ],
      ['Pause keeps this model unchanged', C.amber]
    ])
  );

  // ================================================================
  // 51 — RESET AND BRING LOSS BELOW 13.12
  //
  // Use unrounded losses for the strict comparison.
  //
  // Iteration 1: 13.2399 > 13.12.
  // Iteration 2: 13.1396 > 13.12.
  // Iteration 3: 13.1158 < 13.12.
  //
  // The first successful iteration is 3.
  //
  // The displayed rounded value 13.12 alone cannot
  // distinguish whether the strict target has been met.
  // Show four decimal places here.
  // ================================================================

  await until(S(51));
  await play(
    ...resetModel(
      INITIAL_STATE,

      {
        target: true
      }
    ),

    ...say('CHALLENGE: LOSS BELOW 13.12', C.amber),

    ...fbox([
      'Reset to centers 2 and 8',
      ['Target: loss < 13.12', C.amber],
      'How many iterations are needed?'
    ], C.amber)
  );

  for (
    let i = 1;
    i <= FIRST_BELOW_TARGET;
    i++
  ) {
    const state = STATES[i];

    const achieved =
      state.loss < TARGET_LOSS;

    await play(
      ...applyIteration(
        i,

        {
          runTime: 0.70,
          movements: false,
          refreshShares: true
        }
      ),

      ...fbox([
        `Iteration ${i}`,

        [
          `Loss = ${fmt(state.loss, 4)}`,

          achieved
            ? C.green
            : C.amber
        ],

        [
          achieved
            ? '13.1158 < 13.12'
            : 'Target not yet reached',

          achieved
            ? C.green
            : C.amber
        ],

        achieved
          ? 'First success: 3 iterations'
          : 'Continue learning'
      ],

      achieved
        ? C.green
        : C.amber)
    );
  }

  // ================================================================
  // 52 — PREDICT WHAT HAPPENS WITH BOTH STARTING CENTERS AT FIVE
  //
  // Give the learner a moment to make a prediction.
  // Then illustrate Play using five actual EM iterations.
  //
  // Both centers remain at 5 throughout.
  // Every membership remains 0.5.
  // The loss remains unchanged.
  // ================================================================

  await until(S(52));
  await play(
    ...resetModel(
      SAME_CENTER_START,

      {
        target: false,

        title:
          'Both centers start at 5'
      }
    ),

    ...say('PREDICT: WILL IDENTICAL CENTERS SEPARATE?', C.amber),

    ...fbox([
      'Blue starting center = 5',
      'Orange starting center = 5',
      ['Will the curves separate?', C.amber]
    ], C.amber)
  );

  await until(S(52) + 2.2);
  await play(
    ...showControls(
      'Playing identical-center example',
      2
    )
  );

  await play(
    ...moveModel(
      SAME_CENTER_HISTORY[2],
      0.55
    ),

    ...showLoss(
      SAME_CENTER_HISTORY.slice(0, 3),

      {
        color: C.amber,

        title:
          'Identical-center run'
      }
    )
  );

  await play(
    ...moveModel(
      SAME_CENTER_HISTORY[5],
      0.55
    ),

    ...showLoss(
      SAME_CENTER_HISTORY,

      {
        color: C.amber,

        title:
          'Identical-center run'
      }
    ),

    ...showShares(
      expectation(5, 5),

      {
        title:
          'Every reading stays 50% / 50%'
      }
    ),

    ...fbox([
      ['Both centers remain at 5', C.amber],
      'Every membership stays equal',
      'No center movement',
      'Starting guesses matter'
    ], C.amber)
  );

  // ================================================================
  // 53 — NEW DATA AND DIFFERENT STARTING GUESSES
  //
  // Illustrate the New data control.
  //
  // The chapter's fixed six readings remain unchanged.
  // Actual fresh-data generation belongs to Try it.
  //
  // Preview a different asymmetric pair of starting
  // positions using the same fixed observations.
  //
  // This is a separate illustrative starting model,
  // not a replacement for the narrated EM run.
  // ================================================================

  const ALTERNATIVE_START =
    makeState(0, 1.5, 7.5);

  await until(S(53));
  await play(
    ...replacePanel(
      makeNewDataPanel()
    ),

    ...say('NEW DATA · TRY DIFFERENT STARTING GUESSES', PURPLE),

    ...fbox([
      ['Press New data in Try it', PURPLE],
      'Experiment with starting positions',
      'Compare the learning behavior'
    ], PURPLE)
  );

  await play(
    ...moveModel(
      ALTERNATIVE_START,
      1.0
    ),

    ...showLoss(
      [ALTERNATIVE_START],

      {
        title:
          'Alternative starting model',

        color: PURPLE
      }
    ),

    ...fbox([
      'Illustrative starting guesses',
      ['Blue = 1.5', BLUE],
      ['Orange = 7.5', ORANGE],
      'Different starts may help or hinder learning'
    ], PURPLE)
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Restore the converged fixed chapter example.
  //
  // Centers approximately 3.8967 and 6.1033.
  // Loss approximately 13.1019.
  //
  // All six original readings remain fixed.
  // Both spreads and both mixture weights remain fixed.
  //
  // EM:
  //   1. Estimate membership shares.
  //   2. Improve the model using those shares.
  //   3. Repeat until changes become sufficiently small.
  //
  // A small loss does not by itself prove that the learned
  // components correspond to the true physical operating modes.
  // ================================================================

  await until(S(54));
  await play(
    ...clearNotes(),

    ...moveModel(
      FINAL_STATE,
      1.25
    ),

    ...showLoss(
      STATES,

      {
        title:
          'Completed EM run',

        color: C.green
      }
    ),

    ...showShares(
      FINAL_MEMBERSHIPS,

      {
        title:
          'Final model · Soft memberships'
      }
    ),

    ...say('EM: SHARE READINGS · IMPROVE CURVES · REPEAT', C.green),

    ...fbox([
      ['E-step: estimate membership', BLUE],
      ['M-step: update the model', ORANGE],
      [
        `Centers ≈ ${fmt(FINAL_STATE.muBlue)} and ${fmt(FINAL_STATE.muOrange)}`,
        C.cyan
      ],
      [
        `Final loss ≈ ${fmt(FINAL_STATE.loss, 4)}`,
        C.green
      ],
      'Learn overlapping groups through repetition'
    ], C.green)
  );
}
