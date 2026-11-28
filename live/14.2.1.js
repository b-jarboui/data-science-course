// lesson 14.2.1
// Bandwidth selection: choosing how much detail to show.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Fixed normal vibration readings: 2, 3, 4, 6, 7, 8 mm/s.
// Every triangular hill has area 1/6.
// Total area under the combined density is always 1.
//
// The three narrated bandwidths are exactly 0.5, 2 and 6.
// Reading positions remain fixed while hill widths and heights change.
//
// Try it controls are animated illustrations of the separate simulation.
// This scene does not implement the interactive simulation itself.
// Browser rendering has not been verified against the actual engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  //
  // A–F are previous readings from normal machine operation.
  // Their operating modes are known to the technician.
  //
  // The density calculation uses only vibration readings.
  // Operating-mode labels are hidden until the narrated comparison.
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
  const N = VALUES.length;

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';
  const HILL_COLOR = '#64748B';

  const NARROW = 0.5;
  const MIDDLE = 2;
  const WIDE = 6;

  // ================================================================
  // EXACT TRIANGULAR DENSITY CALCULATIONS
  //
  // Each triangular hill:
  //
  //   full width = 2h
  //   height     = 1 / (N × h)
  //   area       = width × height / 2
  //              = 1 / N
  //
  // Individual contribution:
  //
  //   max(0, 1 - |x - reading| / h) / (N × h)
  //
  // Combined density:
  //
  //   Sum the six individual contributions.
  //
  // No rounding is performed during calculations.
  // ================================================================

  function hillHeight(h) {
    return 1 / (N * h);
  }

  function hillArea(h) {
    return (
      (2 * h) * hillHeight(h) / 2
    );
  }

  function contribution(x, reading, h) {
    return (
      Math.max(
        0,
        1 - Math.abs(x - reading) / h
      ) / (N * h)
    );
  }

  function density(x, h, readings = VALUES) {
    return readings.reduce(
      (sum, reading) =>
        sum + contribution(x, reading, h),
      0
    );
  }

  function fmt(value, digits = 2) {
    return String(
      Number(value.toFixed(digits))
    );
  }

  const NARROW_HEIGHT = density(2, NARROW);

  const LEFT_PEAK = density(3, MIDDLE);
  const RIGHT_PEAK = density(7, MIDDLE);
  const VALLEY = density(5, MIDDLE);

  const FLAT_TOP = density(5, WIDE);

  // Expected checked values:
  //
  // h = 0.5:
  //   Six separate peaks.
  //   Each peak has height 1/3.
  //
  // h = 2:
  //   Peak at 3 = 1/6.
  //   Peak at 7 = 1/6.
  //   Valley at 5 = 1/12.
  //
  // h = 6:
  //   Flat top from x = 4 to x = 6.
  //   Height = 1/9.
  //
  // Total density area = 6 × 1/6 = 1.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone:  8 × 14.22
  //         content y = -5.5 to 4.3
  //
  // Laptop: 14.22 × 8
  //         content y = -3.0 to 2.3
  //
  // Phone: formula box above the main picture.
  // Laptop: formula box beside the main picture.
  //
  // Use a fixed horizontal domain from -4 to 14.
  // This contains every triangle even at bandwidth 6:
  //
  // Leftmost support  = 2 - 6 = -4
  // Rightmost support = 8 + 6 = 14
  //
  // The axis never rescales as bandwidth changes.
  // This keeps both reading positions and density heights comparable.
  //
  // Negative horizontal positions show mathematical kernel support,
  // not additional measured vibration readings.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.45, -0.30, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = -4;
  const XMAX = 14;

  const XLEFT = P ? -3.25 : -6.55;
  const XRIGHT = P ? 3.25 : 1.25;

  const BASE = P ? -4.95 : -2.70;
  const YTOP = P ? 1.50 : 1.20;

  const MAX_DENSITY = 0.36;

  const XUNIT =
    (XRIGHT - XLEFT) / (XMAX - XMIN);

  const YUNIT =
    (YTOP - BASE) / MAX_DENSITY;

  function px(x) {
    return XLEFT +
      (x - XMIN) * XUNIT;
  }

  function py(value) {
    return BASE + value * YUNIT;
  }

  function graphPoint(x, value = 0) {
    return point(
      px(x),
      py(value)
    );
  }

  function readingPoint(value) {
    return graphPoint(value, 0);
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
    runTime = 1.0,
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

  // ================================================================
  // FORMULA / EXPLANATION BOX
  //
  // Only one explanation box is visible at a time.
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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P
      ? FW - 1.2
      : 4.9;

    const maxh = P
      ? 1.40
      : 2.65;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // ================================================================
  // WORKSHOP MACHINE
  //
  // A simple machine with a flywheel.
  // Its housing shakes slightly during the vibration demonstration.
  // The machine picture is removed before introducing the readings.
  // ================================================================

  const MACHINE_Y = P
    ? -1.45
    : -0.40;
  const MK = P ? 1.5 : 1;

  function makeMachine(offsetX = 0, wheelAngle = 0) {
    const mx = CX + offsetX;
    const my = MACHINE_Y;

    const housing = rectAt(
      point(mx, my),
      3.20,
      2.20,
      C.muted,
      0.15,
      2
    );

    const top = rectAt(
      point(mx, my + 1.17),
      2.65,
      0.20,
      C.cyan,
      0.30,
      1.5
    );

    const foot1 = rectAt(
      point(mx - 1.05, my - 1.25),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const foot2 = rectAt(
      point(mx + 1.05, my - 1.25),
      0.55,
      0.30,
      C.muted,
      0.70
    );

    const wheel = circleAt(
      point(mx - 0.60, my + 0.10),
      0.71,
      C.cyan,
      0.06,
      3
    );

    const hub = circleAt(
      point(mx - 0.60, my + 0.10),
      0.16,
      C.cyan,
      0.85,
      1.5
    );

    const spokes = [];

    for (let i = 0; i < 4; i++) {
      const a =
        wheelAngle + i * Math.PI / 2;

      spokes.push(
        lineAt(
          point(
            mx - 0.60,
            my + 0.10
          ),
          point(
            mx - 0.60 + 0.60 * Math.cos(a),
            my + 0.10 + 0.60 * Math.sin(a)
          ),
          C.cyan,
          2.5
        )
      );
    }

    const vents = [];

    for (let i = 0; i < 4; i++) {
      vents.push(
        lineAt(
          point(
            mx + 0.50,
            my + 0.48 - i * 0.23
          ),
          point(
            mx + 1.14,
            my + 0.48 - i * 0.23
          ),
          C.muted,
          2
        )
      );
    }

    const light = new M.Dot({
      point: point(
        mx + 1.17,
        my + 0.78
      ),
      radius: 0.075,
      color: C.green
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
      light
    );
    if (MK !== 1) mg.scale(MK);
    return mg;
  }

  const machine = makeMachine();

  const floor = lineAt(
    point(CX - 2.15 * MK, MACHINE_Y - 1.43 * MK),
    point(CX + 2.15 * MK, MACHINE_Y - 1.43 * MK),
    C.muted,
    2.5
  );

  const slowTag = fittedPill(
    'Slow mode',
    BLUE,
    18,
    point(CX - 1.25 * MK, MACHINE_Y + 1.80 * MK),
    2.20
  );

  const fastTag = fittedPill(
    'Fast mode',
    ORANGE,
    18,
    point(CX + 1.25 * MK, MACHINE_Y + 1.80 * MK),
    2.20
  );

  function vibrationMarks() {
    const objects = [];

    [-1, 1].forEach(side => {
      const x = CX + side * 1.78 * MK;

      for (let j = 0; j < 2; j++) {
        const y =
          MACHINE_Y + (0.65 - j * 0.95) * MK;

        const a = point(x, y);

        const b = point(
          x + side * 0.17,
          y - 0.17
        );

        const c = point(
          x,
          y - 0.34
        );

        objects.push(
          lineAt(a, b, C.amber, 2.5),
          lineAt(b, c, C.amber, 2.5)
        );
      }
    });

    return new M.VGroup(...objects);
  }

  const shakeMarks = vibrationMarks();

  // ================================================================
  // HORIZONTAL READING LINE
  //
  // Reading values are measured in mm/s.
  // The same axis is used for all three bandwidths.
  // ================================================================

  function makeXAxis() {
    const parts = [];

    parts.push(
      lineAt(
        graphPoint(XMIN),
        graphPoint(XMAX),
        C.muted,
        2.4
      )
    );

    const ticks = [
      -4, -2, 0,
      2, 3, 4, 5, 6, 7, 8,
      10, 12, 14
    ];

    ticks.forEach(value => {
      const x = px(value);

      parts.push(
        lineAt(
          point(x, BASE - 0.055),
          point(x, BASE + 0.055),
          C.muted,
          1.3
        ),

        textAt(
          String(value).replace('-', '−'),
          point(
            x,
            BASE - (P ? 0.23 : 0.20)
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
          (XLEFT + XRIGHT) / 2,
          BASE - (P ? 0.59 : 0.53)
        ),
        P ? 20 : 19,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const xAxis = makeXAxis();

  // ================================================================
  // VERTICAL DENSITY SCALE
  //
  // The density scale remains fixed throughout.
  // Use exact fractions for the key narrated heights.
  // ================================================================

  function makeYAxis() {
    const parts = [];

    parts.push(
      lineAt(
        graphPoint(XMIN, 0),
        graphPoint(XMIN, MAX_DENSITY),
        C.muted,
        2
      )
    );

    const ticks = [
      { value: 0, label: '0' },
      { value: 1 / 12, label: '1/12' },
      { value: 1 / 6, label: '1/6' },
      { value: 1 / 3, label: '1/3' }
    ];

    ticks.forEach(({ value, label }) => {
      const y = py(value);

      if (value > 0) {
        parts.push(
          lineAt(
            point(XLEFT, y),
            point(XRIGHT, y),
            '#293648',
            0.9
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
          label,
          point(
            XLEFT - (P ? 0.30 : 0.36),
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
          XLEFT + 0.57,
          YTOP + 0.16
        ),
        P ? 18 : 16,
        C.ink
      )
    );

    return new M.VGroup(...parts);
  }

  const yAxis = makeYAxis();

  // ================================================================
  // READING MARKERS
  //
  // Hidden operating mode: neutral white circle.
  // Slow mode: glowing blue circle.
  // Fast mode: glowing orange square.
  //
  // Keep the original letters visible.
  // Marker positions never move during bandwidth changes.
  // ================================================================

  const readings = {};
  const readingStates = {};

  function makeReading(
    d,
    state = 'hidden'
  ) {
    const p = readingPoint(d.x);

    const color = state === 'slow'
      ? BLUE
      : state === 'fast'
        ? ORANGE
        : C.ink;

    const r = P ? 0.080 : 0.075;

    const halo = new M.Dot({
      point: p,
      radius: r * 2.0,
      color
    });

    halo.setFill(color, 0.13);

    let marker;

    if (state === 'fast') {
      marker = new M.Rectangle({
        width: r * 1.80,
        height: r * 1.80,
        color,
        strokeWidth: 1.2
      });

      marker.setFill(color, 1);
      marker.moveTo(p);

    } else {
      marker = new M.Dot({
        point: p,
        radius: r,
        color
      });
    }

    const label = textAt(
      d.id,
      point(
        p[0],
        BASE + (P ? 0.23 : 0.19)
      ),
      P ? 16 : 15,
      color,
      true
    );

    return new M.VGroup(
      halo,
      marker,
      label
    );
  }

  DATA.forEach(d => {
    readings[d.id] =
      makeReading(d);

    readingStates[d.id] = 'hidden';
  });

  function changeReadingState(id, state) {
    if (readingStates[id] === state) {
      return [];
    }

    const d = DATA.find(
      reading => reading.id === id
    );

    const old = readings[id];
    const next = makeReading(d, state);

    readings[id] = next;
    readingStates[id] = state;

    return [
      new M.FadeOut(old),
      new M.FadeIn(next)
    ];
  }

  function revealOperatingModes() {
    return DATA.flatMap(d =>
      changeReadingState(
        d.id,
        d.mode
      )
    );
  }

  function hideOperatingModes() {
    return DATA.flatMap(d =>
      changeReadingState(
        d.id,
        'hidden'
      )
    );
  }

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

  // ================================================================
  // GATHERING OUTLINES
  //
  // Initial visual inspection of the six dots.
  // These outlines do not enter the density calculation.
  // ================================================================

  function makeGathering(
    values,
    color
  ) {
    const left = px(
      Math.min(...values)
    ) - 0.17;

    const right = px(
      Math.max(...values)
    ) + 0.17;

    return rectAt(
      point(
        (left + right) / 2,
        BASE + 0.09
      ),
      right - left,
      0.56,
      color,
      0.035,
      1.7
    );
  }

  const leftGathering = makeGathering(
    [2, 3, 4],
    C.cyan
  );

  const rightGathering = makeGathering(
    [6, 7, 8],
    C.cyan
  );

  // ================================================================
  // TRIANGULAR HILLS
  //
  // Exact endpoints:
  //
  //   left  = reading - h
  //   peak  = reading, height 1/(6h)
  //   right = reading + h
  //
  // Use thin interior strokes to suggest sand.
  // The number of interior strokes is fixed so a hill can
  // transform smoothly between narrow and wide shapes.
  //
  // Every hill retains area 1/6.
  // ================================================================

  const HILL_STRIP_COUNT = 25;

  function makeHill(
    reading,
    h,
    color = HILL_COLOR,
    emphasized = false
  ) {
    const peakHeight = hillHeight(h);

    const left = graphPoint(
      reading - h,
      0
    );

    const top = graphPoint(
      reading,
      peakHeight
    );

    const right = graphPoint(
      reading + h,
      0
    );

    const fill = [];

    const fillColor = emphasized
      ? (
          color === BLUE
            ? '#284768'
            : color === ORANGE
              ? '#63452D'
              : '#385A65'
        )
      : '#283848';

    for (
      let i = 1;
      i <= HILL_STRIP_COUNT;
      i++
    ) {
      const fraction =
        i / (HILL_STRIP_COUNT + 1);

      const x =
        reading - h + fraction * 2 * h;

      const height =
        contribution(x, reading, h);

      fill.push(
        lineAt(
          graphPoint(x, 0),
          graphPoint(x, height),
          fillColor,
          emphasized ? 2 : 1
        )
      );
    }

    const rising = lineAt(
      left,
      top,
      color,
      emphasized ? 2.8 : 1.7
    );

    const falling = lineAt(
      top,
      right,
      color,
      emphasized ? 2.8 : 1.7
    );

    const baseLine = lineAt(
      left,
      right,
      color,
      1
    );

    return new M.VGroup(
      ...fill,
      rising,
      falling,
      baseLine
    );
  }

  const hills = {};

  let currentBandwidth = MIDDLE;

  function revealHills(
    h,
    color = HILL_COLOR
  ) {
    currentBandwidth = h;

    const a = [];

    VALUES.forEach(value => {
      if (!hills[value]) {
        const obj =
          makeHill(
            value,
            h,
            color
          );

        hills[value] = {
          obj,
          h,
          color,
          emphasized: false
        };

        a.push(
          new M.FadeIn(obj)
        );
      }
    });

    return a.length
      ? [lag(a, 1.4, 0.10)]
      : [];
  }

  function updateHills(
    h,
    options = {}
  ) {
    const {
      leftColor = HILL_COLOR,
      rightColor = HILL_COLOR,
      emphasized = false,
      runTime = 1.15
    } = options;

    currentBandwidth = h;

    const a = [];

    VALUES.forEach(value => {
      const color = value < 5
        ? leftColor
        : rightColor;

      const next = makeHill(
        value,
        h,
        color,
        emphasized
      );

      if (!hills[value]) {
        hills[value] = {
          obj: next,
          h,
          color,
          emphasized
        };

        a.push(new M.FadeIn(next));

      } else {
        const old = hills[value];

        a.push(
          new M.Transform(
            old.obj,
            next,
            { runTime }
          )
        );

        old.h = h;
        old.color = color;
        old.emphasized = emphasized;
      }
    });

    return a;
  }

  function clearHills() {
    const a = Object.values(hills).map(h =>
      new M.FadeOut(h.obj)
    );

    Object.keys(hills).forEach(key => {
      delete hills[key];
    });

    return a;
  }

  function focusHills(
    values,
    color
  ) {
    const animations = values
      .filter(v => hills[v])
      .map(v =>
        new M.Indicate(
          hills[v].obj,
          { color }
        )
      );

    return animations.length
      ? [lag(animations, 1.2, 0.10)]
      : [];
  }

  // ================================================================
  // SINGLE-HILL DEMONSTRATION
  //
  // Isolate the hill over reading 3.
  // Its width changes from 1 unit to 4 units.
  // Its height decreases from 1/3 to 1/12.
  // Its area remains exactly 1/6.
  // ================================================================

  let sampleHill = null;

  function setSampleHill(h) {
    const next = makeHill(
      3,
      h,
      C.cyan,
      true
    );

    if (!sampleHill) {
      sampleHill = next;

      return [
        new M.FadeIn(sampleHill)
      ];
    }

    return [
      new M.Transform(
        sampleHill,
        next,
        { runTime: 1.15 }
      )
    ];
  }

  function clearSampleHill() {
    if (!sampleHill) {
      return [];
    }

    const old = sampleHill;
    sampleHill = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // EXACT COMBINED DENSITY CURVE
  //
  // A sum of triangular hills is piecewise linear.
  //
  // Its slope can change only at a triangle's:
  //
  //   left endpoint,
  //   center,
  //   right endpoint.
  //
  // Use the union of breakpoints for all three narrated
  // bandwidths. Every curve therefore has the same number
  // of segments, permitting smooth transforms without
  // changing the fixed graph scale.
  //
  // Every displayed curve is exact between its breakpoints.
  // ================================================================

  const CURVE_X = Array.from(
    new Set([
      XMIN,
      XMAX,

      ...[NARROW, MIDDLE, WIDE].flatMap(h =>
        VALUES.flatMap(v => [
          v - h,
          v,
          v + h
        ])
      )
    ])
  )
    .filter(x =>
      x >= XMIN && x <= XMAX
    )
    .sort((a, b) => a - b);

  function makeDensityCurve(
    h,
    color = C.cyan,
    subset = VALUES,
    width = 3.4
  ) {
    const glow = [];
    const main = [];

    for (
      let i = 0;
      i < CURVE_X.length - 1;
      i++
    ) {
      const x1 = CURVE_X[i];
      const x2 = CURVE_X[i + 1];

      const p = graphPoint(
        x1,
        density(x1, h, subset)
      );

      const q = graphPoint(
        x2,
        density(x2, h, subset)
      );

      const glowColor = color === BLUE
        ? '#284768'
        : color === ORANGE
          ? '#63452D'
          : color === C.amber
            ? '#625029'
            : '#245562';

      glow.push(
        lineAt(
          p,
          q,
          glowColor,
          width + 3
        )
      );

      main.push(
        lineAt(
          p,
          q,
          color,
          width
        )
      );
    }

    return new M.VGroup(
      ...glow,
      ...main
    );
  }

  let combinedCurve = null;

  function setDensity(
    h,
    color = C.cyan,
    runTime = 1.2
  ) {
    const next = makeDensityCurve(
      h,
      color
    );

    if (!combinedCurve) {
      combinedCurve = next;

      return [
        new M.FadeIn(combinedCurve)
      ];
    }

    return [
      new M.Transform(
        combinedCurve,
        next,
        { runTime }
      )
    ];
  }

  function clearDensity() {
    if (!combinedCurve) {
      return [];
    }

    const old = combinedCurve;
    combinedCurve = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // STACKED HEIGHTS AT A SELECTED HORIZONTAL POSITION
  //
  // These segments show exactly how individual hill heights
  // add to produce the combined density.
  //
  // Segment lengths are proportional to their actual density
  // contributions. Contributions of zero are omitted.
  // ================================================================

  let stackNow = null;

  function makeHeightStack(
    x,
    h,
    subset = VALUES,
    color = C.amber
  ) {
    const objects = [];

    let running = 0;

    subset.forEach((reading, index) => {
      const height =
        contribution(
          x,
          reading,
          h
        );

      if (height <= 1e-12) {
        return;
      }

      const segmentColor =
        index % 2 === 0
          ? color
          : C.ink;

      const start =
        graphPoint(x, running);

      const end =
        graphPoint(
          x,
          running + height
        );

      objects.push(
        lineAt(
          start,
          end,
          segmentColor,
          6
        ),

        lineAt(
          point(
            start[0] - 0.065,
            start[1]
          ),
          point(
            start[0] + 0.065,
            start[1]
          ),
          C.ink,
          1.5
        )
      );

      running += height;
    });

    objects.push(
      lineAt(
        point(
          px(x) - 0.085,
          py(running)
        ),
        point(
          px(x) + 0.085,
          py(running)
        ),
        C.ink,
        1.5
      )
    );

    return new M.VGroup(...objects);
  }

  function setHeightStack(
    x,
    h,
    subset = VALUES,
    color = C.amber
  ) {
    const next = makeHeightStack(
      x,
      h,
      subset,
      color
    );

    const a = [
      new M.FadeIn(next)
    ];

    if (stackNow) {
      a.push(
        new M.FadeOut(stackNow)
      );
    }

    stackNow = next;

    return a;
  }

  function clearHeightStack() {
    if (!stackNow) {
      return [];
    }

    const old = stackNow;
    stackNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // PEAK AND VALLEY MARKERS
  //
  // Place markers at their exact calculated density heights.
  // Labels display exact fractions where appropriate.
  // ================================================================

  let annotations = [];

  function makePeakMarker(
    x,
    h,
    options = {}
  ) {
    const {
      color = C.amber,
      label = '',
      radius = P ? 0.070 : 0.060,
      shiftX = 0,
      shiftY = P ? 0.34 : 0.28,
      withGuide = false
    } = options;

    const value = density(x, h);
    const p = graphPoint(x, value);

    const halo = new M.Dot({
      point: p,
      radius: radius * 2.25,
      color
    });

    halo.setFill(color, 0.15);

    const dot = new M.Dot({
      point: p,
      radius,
      color
    });

    const objects = [
      halo,
      dot
    ];

    if (withGuide) {
      objects.unshift(
        new M.DashedLine({
          start: graphPoint(x, 0),
          end: p,
          color
        })
      );
    }

    if (label) {
      const tag = fittedPill(
        label,
        color,
        P ? 17 : 16,
        point(
          p[0] + shiftX,
          p[1] + shiftY
        ),
        P ? 1.65 : 1.55
      );

      objects.push(tag);
    }

    return new M.VGroup(...objects);
  }

  function clearAnnotations() {
    const a = annotations.map(obj =>
      new M.FadeOut(obj)
    );

    annotations = [];

    return a;
  }

  function addAnnotation(obj) {
    annotations.push(obj);

    return [
      new M.FadeIn(obj)
    ];
  }

  function showNarrowPeaks() {
    const a = clearAnnotations();

    VALUES.forEach(value => {
      annotations.push(
        makePeakMarker(
          value,
          NARROW,
          {
            color: C.amber
          }
        )
      );
    });

    const tag = fittedPill(
      '6 peaks · height 1/3',
      C.amber,
      P ? 16 : 15,
      point(
        CX,
        py(1 / 3) + 0.38
      ),
      3.20
    );

    annotations.push(tag);

    a.push(
      lag(
        annotations.map(obj =>
          new M.FadeIn(obj)
        ),
        1.2,
        0.08
      )
    );

    return a;
  }

  function showMiddleFeatures() {
    const a = clearAnnotations();

    const features = [
      makePeakMarker(
        3,
        MIDDLE,
        {
          color: BLUE,
          label: '1/6',
          withGuide: true,
          shiftX: -0.20,
          shiftY: 0.38
        }
      ),

      makePeakMarker(
        7,
        MIDDLE,
        {
          color: ORANGE,
          label: '1/6',
          withGuide: true,
          shiftX: 0.20,
          shiftY: 0.38
        }
      ),

      makePeakMarker(
        5,
        MIDDLE,
        {
          color: C.amber,
          label: '1/12',
          withGuide: true,
          shiftY: 0.34
        }
      )
    ];

    annotations.push(
      ...features
    );

    a.push(
      ...features.map(obj =>
        new M.FadeIn(obj)
      )
    );

    return a;
  }

  function makeFlatTopMarker() {
    const y = py(FLAT_TOP);

    const left = graphPoint(
      4,
      FLAT_TOP
    );

    const right = graphPoint(
      6,
      FLAT_TOP
    );

    const line = lineAt(
      left,
      right,
      C.amber,
      5
    );

    const leftDot = new M.Dot({
      point: left,
      radius: 0.065,
      color: C.amber
    });

    const rightDot = new M.Dot({
      point: right,
      radius: 0.065,
      color: C.amber
    });

    const tag = fittedPill(
      'Flat top: 1/9',
      C.amber,
      P ? 17 : 16,
      point(
        px(5),
        y + 0.42
      ),
      2.20
    );

    const leftGuide = new M.DashedLine({
      start: graphPoint(4),
      end: left,
      color: C.amber
    });

    const rightGuide = new M.DashedLine({
      start: graphPoint(6),
      end: right,
      color: C.amber
    });

    return new M.VGroup(
      leftGuide,
      rightGuide,
      line,
      leftDot,
      rightDot,
      tag
    );
  }

  // ================================================================
  // BANDWIDTH STATUS TAG
  // ================================================================

  const BANDWIDTH_POS = P
    ? point(0, -6.05)
    : point(4.3, 1.18);

  let bandwidthTag = null;

  function setBandwidthTag(
    h,
    color = C.cyan
  ) {
    const next = fittedPill(
      `Bandwidth = ${fmt(h)}`,
      color,
      P ? 18 : 16,
      BANDWIDTH_POS,
      P ? 3.50 : 3.30
    );

    const a = [
      new M.FadeIn(next)
    ];

    if (bandwidthTag) {
      a.push(
        new M.FadeOut(bandwidthTag)
      );
    }

    bandwidthTag = next;

    return a;
  }

  function clearBandwidthTag() {
    if (!bandwidthTag) {
      return [];
    }

    const old = bandwidthTag;
    bandwidthTag = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // WIDTH / BANDWIDTH MEASUREMENT GUIDES
  //
  // For the hill centered at reading 3 with h = 2:
  //
  // Left endpoint  = 1
  // Center         = 3
  // Right endpoint = 5
  //
  // Full width = 4
  // Bandwidth  = 2
  // ================================================================

  let widthGuide = null;

  function makeWidthGuide(
    reading,
    h,
    fullWidth = false
  ) {
    const left = px(reading - h);
    const center = px(reading);
    const right = px(reading + h);

    const y = py(
      hillHeight(h)
    ) + (P ? 0.62 : 0.50);

    const x1 = fullWidth
      ? left
      : center;

    const x2 = right;

    const objects = [
      lineAt(
        point(x1, y),
        point(x2, y),
        C.amber,
        2.5
      ),

      lineAt(
        point(x1, y - 0.10),
        point(x1, y + 0.10),
        C.amber,
        2
      ),

      lineAt(
        point(x2, y - 0.10),
        point(x2, y + 0.10),
        C.amber,
        2
      )
    ];

    const guideStartHeight =
      fullWidth
        ? BASE
        : py(hillHeight(h));

    objects.push(
      new M.DashedLine({
        start: point(
          x1,
          guideStartHeight
        ),
        end: point(x1, y - 0.10),
        color: C.amber
      }),

      new M.DashedLine({
        start: point(x2, BASE),
        end: point(x2, y - 0.10),
        color: C.amber
      })
    );

    const label = fittedPill(
      fullWidth
        ? `Full width = ${fmt(2 * h)}`
        : `Bandwidth = ${fmt(h)}`,

      C.amber,
      P ? 17 : 15,

      point(
        (x1 + x2) / 2,
        y + 0.30
      ),

      2.65
    );

    objects.push(label);

    return new M.VGroup(...objects);
  }

  function setWidthGuide(
    reading,
    h,
    fullWidth = false
  ) {
    const next = makeWidthGuide(
      reading,
      h,
      fullWidth
    );

    const a = [
      new M.FadeIn(next)
    ];

    if (widthGuide) {
      a.push(
        new M.FadeOut(widthGuide)
      );
    }

    widthGuide = next;

    return a;
  }

  function clearWidthGuide() {
    if (!widthGuide) {
      return [];
    }

    const old = widthGuide;
    widthGuide = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ================================================================
  // OPERATING MODE LABELS
  //
  // Introduce these only once the density picture has revealed
  // the two gatherings.
  //
  // The known mode labels were not used to construct the density.
  // ================================================================

  let modeLabels = [];

  function showModeLabels() {
    const slow = fittedPill(
      'Slow mode',
      BLUE,
      P ? 17 : 15,
      point(
        px(3) - 0.28,
        py(LEFT_PEAK) + 0.86
      ),
      P ? 1.80 : 1.65
    );

    const fast = fittedPill(
      'Fast mode',
      ORANGE,
      P ? 17 : 15,
      point(
        px(7) + 0.28,
        py(RIGHT_PEAK) + 0.86
      ),
      P ? 1.80 : 1.65
    );

    modeLabels = [
      slow,
      fast
    ];

    return modeLabels.map(obj =>
      new M.FadeIn(obj)
    );
  }

  function clearModeLabels() {
    const a = modeLabels.map(obj =>
      new M.FadeOut(obj)
    );

    modeLabels = [];

    return a;
  }

  // ================================================================
  // TRY IT SLIDER ILLUSTRATION
  //
  // This is a visual demonstration of the separate interactive
  // activity mentioned by the narration.
  //
  // No pointer events or interactive simulation API are assumed.
  // The slider knob moves in sync with the narrated bandwidth.
  // ================================================================

  const SLIDER_CX = P ? 0 : 4.3;
  const SLIDER_Y = P ? -6.30 : -2.02;
  const SLIDER_W = P ? 4.75 : 3.35;

  const SLIDER_MIN = 0.5;
  const SLIDER_MAX = 6;

  const sliderX = h =>
    SLIDER_CX - SLIDER_W / 2 +
    (
      (h - SLIDER_MIN) /
      (SLIDER_MAX - SLIDER_MIN)
    ) * SLIDER_W;

  function makeSliderTrack() {
    const left =
      SLIDER_CX - SLIDER_W / 2;

    const right =
      SLIDER_CX + SLIDER_W / 2;

    const track = lineAt(
      point(left, SLIDER_Y),
      point(right, SLIDER_Y),
      C.muted,
      5
    );

    const minLabel = textAt(
      '0.5',
      point(left, SLIDER_Y - 0.24),
      P ? 16 : 15,
      C.muted,
      true
    );

    const maxLabel = textAt(
      '6',
      point(right, SLIDER_Y - 0.24),
      P ? 16 : 15,
      C.muted,
      true
    );

    const middleTick = lineAt(
      point(
        sliderX(MIDDLE),
        SLIDER_Y - 0.07
      ),
      point(
        sliderX(MIDDLE),
        SLIDER_Y + 0.07
      ),
      C.ink,
      1.5
    );

    const label = textAt(
      'Try it · Bandwidth',
      point(
        SLIDER_CX,
        SLIDER_Y + 0.36
      ),
      P ? 17 : 15,
      C.ink
    );

    return new M.VGroup(
      track,
      minLabel,
      maxLabel,
      middleTick,
      label
    );
  }

  function makeSliderKnob(h) {
    const p = point(
      sliderX(h),
      SLIDER_Y
    );

    const halo = circleAt(
      p,
      0.19,
      C.cyan,
      0.15,
      1.2
    );

    const dot = new M.Dot({
      point: p,
      radius: 0.11,
      color: C.cyan
    });

    return new M.VGroup(
      halo,
      dot
    );
  }

  let sliderTrack = null;
  let sliderKnob = null;

  function setSlider(h) {
    const next = makeSliderKnob(h);

    if (!sliderTrack) {
      sliderTrack =
        makeSliderTrack();

      sliderKnob = next;

      return [
        new M.FadeIn(sliderTrack),
        new M.FadeIn(sliderKnob)
      ];
    }

    return [
      new M.Transform(
        sliderKnob,
        next,
        { runTime: 1.1 }
      )
    ];
  }

  function clearSlider() {
    const a = [];

    if (sliderTrack) {
      a.push(
        new M.FadeOut(sliderTrack)
      );

      sliderTrack = null;
    }

    if (sliderKnob) {
      a.push(
        new M.FadeOut(sliderKnob)
      );

      sliderKnob = null;
    }

    return a;
  }

  const newDataButton = fittedPill(
    'New data',
    C.violet,
    P ? 18 : 16,

    P
      ? point(0, -6.15)
      : point(4.3, -2.13),

    2.10
  );

  // ================================================================
  // 0 — WORKSHOP MACHINE: SLOW AND FAST OPERATING MODES
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),
    new M.Create(floor),

    new M.FadeIn(slowTag),
    new M.FadeIn(fastTag),

    ...say('ONE MACHINE · TWO OPERATING MODES'),

    ...fbox([
      ['Slow operation', BLUE],
      ['Fast operation', ORANGE],
      'Same workshop machine'
    ])
  );

  // ================================================================
  // 1 — THE MACHINE SHAKES WHILE RUNNING
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(shakeMarks),

    new M.Transform(
      machine,
      makeMachine(-0.09, Math.PI / 4),
      { runTime: 0.30 }
    ),

    ...say('THE MACHINE SHAKES', C.amber)
  );

  await play(
    new M.Transform(
      machine,
      makeMachine(0.09, Math.PI / 2),
      { runTime: 0.25 }
    )
  );

  await play(
    new M.Transform(
      machine,
      makeMachine(0, Math.PI),
      { runTime: 0.25 }
    )
  );

  // ================================================================
  // 2 — DEFINE VIBRATION
  // ================================================================

  await until(S(2));
  await play(
    new M.Indicate(
      shakeMarks,
      { color: C.amber }
    ),

    ...say('SHAKING = VIBRATION'),

    ...fbox([
      ['Vibration', C.cyan],
      'How the machine shakes'
    ])
  );

  // ================================================================
  // 3 — CAN THE READINGS REVEAL THE TWO OPERATING MODES?
  // ================================================================

  await until(S(3));
  await play(
    new M.Indicate(
      slowTag,
      { color: BLUE }
    ),

    new M.Indicate(
      fastTag,
      { color: ORANGE }
    ),

    ...say('CAN THE READINGS REVEAL BOTH MODES?', C.amber),

    ...fbox([
      'Use recorded vibration readings',
      ['Discover possible gatherings', C.amber],
      'Without using the mode labels'
    ], C.amber)
  );

  // ================================================================
  // 4 — PLACE SIX READINGS ON A LINE
  // ================================================================

  await until(S(4));
  await play(
    new M.FadeOut(machine),
    new M.FadeOut(floor),
    new M.FadeOut(shakeMarks),

    new M.FadeOut(slowTag),
    new M.FadeOut(fastTag),

    new M.FadeIn(xAxis),

    ...say('6 VIBRATION READINGS'),

    ...fbox([
      'Previous normal readings',
      ['One dot per reading', C.cyan]
    ])
  );

  // ================================================================
  // 5 — READING A: 2
  //
  // Short narration beats use short animations.
  // ================================================================

  await until(S(5));
  await play(
    new M.FadeIn(
      readings.A,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 6 — READING B: 3
  // ================================================================

  await until(S(6));
  await play(
    new M.FadeIn(
      readings.B,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 7 — READING C: 4
  // ================================================================

  await until(S(7));
  await play(
    new M.FadeIn(
      readings.C,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 8 — READING D: 6
  // ================================================================

  await until(S(8));
  await play(
    new M.FadeIn(
      readings.D,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 9 — READING E: 7
  // ================================================================

  await until(S(9));
  await play(
    new M.FadeIn(
      readings.E,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 10 — READING F: 8
  // ================================================================

  await until(S(10));
  await play(
    new M.FadeIn(
      readings.F,
      { runTime: 0.22 }
    )
  );

  // ================================================================
  // 11 — EACH DOT IS A VIBRATION READING IN MM/S
  // ================================================================

  await until(S(11));
  await play(
    focusReadings(
      'ABCDEF',
      C.cyan
    ),

    ...say('ONE DOT = ONE VIBRATION READING'),

    ...fbox([
      '2, 3, 4, 6, 7, 8',
      ['Millimeters per second', C.cyan],
      ['Unit: mm/s', C.muted]
    ])
  );

  // ================================================================
  // 12 — SOME DOTS APPEAR TO GATHER TOGETHER
  // ================================================================

  await until(S(12));
  await play(
    new M.Create(leftGathering),
    new M.Create(rightGathering),

    ...say('THE DOTS SEEM TO GATHER'),

    ...fbox([
      ['2, 3, 4', C.cyan],
      ['6, 7, 8', C.cyan],
      'Two possible gatherings'
    ])
  );

  // ================================================================
  // 13 — TURN SEPARATE DOTS INTO A CONTINUOUS PICTURE
  // ================================================================

  await until(S(13));
  await play(
    new M.FadeOut(leftGathering),
    new M.FadeOut(rightGathering),

    ...say('FROM SEPARATE DOTS TO ONE PICTURE', C.violet),

    ...fbox([
      'Six separate readings',
      ['Can we reveal the gatherings?', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 14 — PLACE A LITTLE TRIANGULAR HILL OVER EACH DOT
  //
  // Initial demonstration uses bandwidth 2.
  // The formal bandwidth comparisons begin at beat 24.
  // ================================================================

  await until(S(14));
  await play(
    ...revealHills(
      MIDDLE,
      C.cyan
    ),

    ...say('ONE LITTLE HILL OVER EACH DOT'),

    ...fbox([
      'Imagine little piles of sand',
      ['Each reading gets one hill', C.cyan]
    ])
  );

  // ================================================================
  // 15 — EVERY HILL HAS THE SAME AREA
  //
  // Each represents one of the six readings.
  // Normalise the total area to one.
  // ================================================================

  await until(S(15));
  await play(
    ...focusHills(
      VALUES,
      C.amber
    ),

    ...say('EQUAL AMOUNTS OF SAND', C.amber),

    ...fbox([
      '6 readings → 6 equal hills',
      ['Area of each hill = 1/6', C.amber],
      'Total area = 1'
    ], C.amber)
  );

  // ================================================================
  // 16 — A HILL CAN BE NARROW OR WIDE
  //
  // Isolate the triangle over reading 3.
  // Use the same vertical density scale.
  // ================================================================

  await until(S(16));
  await play(
    ...clearHills(),

    new M.FadeIn(yAxis),

    ...setSampleHill(NARROW),

    ...say('A HILL CAN BE NARROW OR WIDE'),

    ...fbox([
      'One reading at 3',
      ['Narrow triangle', C.cyan],
      'Same amount of sand'
    ])
  );

  // ================================================================
  // 17 — SPREADING A HILL WIDER MAKES IT LOWER
  //
  // h = 0.5:
  // width = 1, height = 1/3.
  //
  // h = 2:
  // width = 4, height = 1/12.
  // ================================================================

  await until(S(17));
  await play(
    ...setSampleHill(MIDDLE),

    ...say('WIDER HILL → LOWER HEIGHT'),

    ...fbox([
      'Full width: 1 → 4',
      'Height: 1/3 → 1/12',
      ['Wider, but lower', C.cyan]
    ])
  );

  // ================================================================
  // 18 — THE AMOUNT OF SAND STAYS THE SAME
  // ================================================================

  await until(S(18));
  await play(
    new M.Indicate(
      sampleHill,
      { color: C.amber }
    ),

    ...say('THE AREA STAYS THE SAME', C.amber),

    ...fbox([
      'Narrow area: 1 × 1/3 ÷ 2',
      'Wide area:   4 × 1/12 ÷ 2',
      ['Both areas = 1/6', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 19 — ADD THE HILL HEIGHTS WHEREVER THEY OVERLAP
  //
  // At x = 3 and h = 2:
  //
  // Reading 2 contributes 1/24.
  // Reading 3 contributes 1/12.
  // Reading 4 contributes 1/24.
  //
  // Combined height = 1/6.
  // ================================================================

  await until(S(19));
  await play(
    ...clearSampleHill(),

    ...revealHills(MIDDLE),

    ...setHeightStack(
      3,
      MIDDLE,
      VALUES,
      C.amber
    ),

    ...say('ADD THE HEIGHTS AT THE SAME POSITION'),

    ...fbox([
      'At vibration = 3',
      '1/24 + 1/12 + 1/24',
      ['Combined height = 1/6', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 20 — THE HILLS MAKE ONE CONTINUOUS PICTURE
  // ================================================================

  await until(S(20));
  await play(
    ...setDensity(MIDDLE),

    ...say('ONE CONTINUOUS PICTURE'),

    ...fbox([
      'Add contributions everywhere',
      ['Six hills → one curve', C.cyan],
      'All original readings stay fixed'
    ])
  );

  // ================================================================
  // 21 — DEFINE DENSITY
  // ================================================================

  await until(S(21));
  await play(
    ...clearHeightStack(),

    new M.Indicate(
      combinedCurve,
      { color: C.cyan }
    ),

    ...say('COMBINED HEIGHT = DENSITY'),

    ...fbox([
      ['Density', C.cyan],
      'Height of the combined curve',
      'At a chosen vibration value'
    ])
  );

  // ================================================================
  // 22 — HIGHER DENSITY MEANS GREATER CONCENTRATION
  // ================================================================

  await until(S(22));
  await play(
    ...showMiddleFeatures(),

    ...say('HIGHER DENSITY = MORE CONCENTRATED READINGS'),

    ...fbox([
      'At 3: density = 1/6',
      'At 5: density = 1/12',
      ['The result depends on our hills', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 23 — WHAT HAPPENS WHEN WE CHANGE THE HILL WIDTH?
  // ================================================================

  await until(S(23));
  await play(
    ...clearAnnotations(),

    ...say('WHAT IF WE CHANGE THE WIDTH?', C.violet),

    ...fbox([
      'Keep the readings fixed',
      'Keep the hill areas equal',
      ['Change only the hill width', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 24 — BANDWIDTH 0.5
  //
  // Each triangle reaches half a unit on either side.
  // Full width = 1.
  // Peak height = 1/3.
  // ================================================================

  await until(S(24));
  await play(
    ...updateHills(NARROW),

    ...setDensity(
      NARROW,
      C.cyan
    ),

    ...setBandwidthTag(
      NARROW,
      C.amber
    ),

    ...say('HALF A UNIT TO EACH SIDE', C.amber),

    ...fbox([
      ['Half-width = 0.5', C.amber],
      'Full width = 1',
      'Each peak height = 1/3'
    ], C.amber)
  );

  // ================================================================
  // 25 — SIX SEPARATE PEAKS
  // ================================================================

  await until(S(25));
  await play(
    ...showNarrowPeaks(),

    ...say('6 SEPARATE PEAKS', C.amber),

    ...fbox([
      'Peaks at 2, 3, 4, 6, 7, 8',
      ['One peak per reading', C.amber],
      'Each height = 1/3'
    ], C.amber)
  );

  // ================================================================
  // 26 — THE PICTURE APPEARS TO SHOW SIX GROUPS
  // ================================================================

  await until(S(26));
  await play(
    focusReadings(
      'ABCDEF',
      C.amber
    ),

    ...say('DO WE REALLY HAVE SIX GROUPS?', C.amber),

    ...fbox([
      '6 readings',
      '6 separate peaks',
      ['6 operating modes?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 27 — NARROW HILLS MAY SHOW INDIVIDUAL READINGS
  // ================================================================

  await until(S(27));
  await play(
    ...say('PEAKS MAY BE INDIVIDUAL READINGS', C.amber),

    ...fbox([
      'Very narrow hills',
      'Very detailed picture',
      ['May exaggerate small differences', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 28 — BANDWIDTH 2
  //
  // Each hill extends two units to either side.
  // Full width = 4.
  // Individual height = 1/12.
  // ================================================================

  await until(S(28));
  await play(
    ...clearAnnotations(),

    ...updateHills(MIDDLE),

    ...setDensity(
      MIDDLE,
      C.cyan
    ),

    ...setBandwidthTag(
      MIDDLE
    ),

    ...say('NOW TWO UNITS TO EACH SIDE'),

    ...fbox([
      ['Half-width = 2', C.cyan],
      'Full width = 4',
      'Individual hill height = 1/12'
    ])
  );

  // ================================================================
  // 29 — THE HILLS OVER 2, 3 AND 4 OVERLAP
  //
  // Highlight the three component hills.
  // Their positions and areas do not change.
  // ================================================================

  await until(S(29));
  await play(
    ...updateHills(
      MIDDLE,
      {
        leftColor: BLUE,
        rightColor: HILL_COLOR,
        emphasized: true
      }
    ),

    ...say('HILLS AT 2, 3 AND 4 OVERLAP', BLUE),

    ...fbox([
      ['Readings: 2, 3, 4', BLUE],
      'Their triangular hills overlap',
      'Add their heights'
    ], BLUE)
  );

  // ================================================================
  // 30 — COMBINED PEAK AT 3
  //
  // 1/24 + 1/12 + 1/24 = 1/6.
  //
  // The combined peak is taller than any individual
  // bandwidth-2 hill.
  // ================================================================

  await until(S(30));
  await play(
    ...setHeightStack(
      3,
      MIDDLE,
      [2, 3, 4],
      BLUE
    ),

    ...addAnnotation(
      makePeakMarker(
        3,
        MIDDLE,
        {
          color: BLUE,
          label: '1/6',
          shiftY: 0.38
        }
      )
    ),

    ...say('ONE COMBINED PEAK AT 3', BLUE),

    ...fbox([
      '1/24 + 1/12 + 1/24',
      ['Density at 3 = 1/6', BLUE],
      'Taller than one little hill'
    ], BLUE)
  );

  // ================================================================
  // 31 — THE HILLS OVER 6, 7 AND 8 ALSO OVERLAP
  // ================================================================

  await until(S(31));
  await play(
    ...clearHeightStack(),

    ...updateHills(
      MIDDLE,
      {
        leftColor: HILL_COLOR,
        rightColor: ORANGE,
        emphasized: true
      }
    ),

    ...say('HILLS AT 6, 7 AND 8 OVERLAP', ORANGE),

    ...fbox([
      ['Readings: 6, 7, 8', ORANGE],
      'Their triangular hills overlap',
      'Add their heights'
    ], ORANGE)
  );

  // ================================================================
  // 32 — COMBINED PEAK AT 7
  // ================================================================

  await until(S(32));
  await play(
    ...setHeightStack(
      7,
      MIDDLE,
      [6, 7, 8],
      ORANGE
    ),

    ...addAnnotation(
      makePeakMarker(
        7,
        MIDDLE,
        {
          color: ORANGE,
          label: '1/6',
          shiftY: 0.38
        }
      )
    ),

    ...say('ANOTHER COMBINED PEAK AT 7', ORANGE),

    ...fbox([
      '1/24 + 1/12 + 1/24',
      ['Density at 7 = 1/6', ORANGE],
      'The second combined peak'
    ], ORANGE)
  );

  // ================================================================
  // 33 — LOWER DENSITY AT 5 BETWEEN THE PEAKS
  //
  // Only hills at 4 and 6 contribute a positive height.
  // Contributions from the hills at 3 and 7 are zero
  // because x = 5 lies on their boundaries.
  //
  // Density = 1/24 + 1/24 = 1/12.
  // ================================================================

  await until(S(33));
  await play(
    ...clearHeightStack(),

    ...updateHills(
      MIDDLE,
      {
        leftColor: BLUE,
        rightColor: ORANGE
      }
    ),

    ...addAnnotation(
      makePeakMarker(
        5,
        MIDDLE,
        {
          color: C.amber,
          label: '1/12',
          withGuide: true,
          shiftY: 0.34
        }
      )
    ),

    ...say('A LOWER HEIGHT AT 5', C.amber),

    ...fbox([
      'Between the two peaks',
      '1/24 + 1/24 = 1/12',
      ['Density at 5 = 1/12', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 34 — THE TWO GATHERINGS MATCH THE OPERATING MODES
  //
  // Reveal the known operating modes after constructing
  // the density from unlabelled readings.
  // ================================================================

  await until(S(34));
  await play(
    ...revealOperatingModes(),

    ...showModeLabels(),

    ...say('TWO PEAKS · TWO OPERATING MODES', C.green),

    ...fbox([
      ['Slow: 2, 3, 4', BLUE],
      ['Fast: 6, 7, 8', ORANGE],
      ['Bandwidth 2 reveals both', C.green]
    ], C.green)
  );

  // ================================================================
  // 35 — BANDWIDTH 6
  //
  // Each triangle extends six units to either side.
  // Full width = 12.
  // Individual peak height = 1/36.
  //
  // Restore neutral markers to emphasize that the model
  // uses reading values, not recorded operating modes.
  // ================================================================

  await until(S(35));
  await play(
    ...clearAnnotations(),
    ...clearModeLabels(),

    ...hideOperatingModes(),

    ...updateHills(
      WIDE,
      {
        leftColor: HILL_COLOR,
        rightColor: HILL_COLOR
      }
    ),

    ...setDensity(
      WIDE,
      C.cyan,
      1.5
    ),

    ...setBandwidthTag(
      WIDE,
      C.amber
    ),

    ...say('SIX UNITS TO EACH SIDE', C.amber),

    ...fbox([
      ['Half-width = 6', C.amber],
      'Full width = 12',
      'Individual hill height = 1/36'
    ], C.amber)
  );

  // ================================================================
  // 36 — HEAVY OVERLAP HIDES THE TWO PEAKS
  // ================================================================

  await until(S(36));
  await play(
    new M.Indicate(
      combinedCurve,
      { color: C.amber }
    ),

    ...say('TOO MUCH OVERLAP', C.amber),

    ...fbox([
      'The hills overlap heavily',
      ['The two peaks disappear', C.amber],
      'The readings have not moved'
    ], C.amber)
  );

  // ================================================================
  // 37 — ONE BROAD HILL WITH A FLAT TOP
  //
  // The flat top extends from 4 to 6.
  // Its exact height is 1/9.
  // ================================================================

  await until(S(37));
  await play(
    ...addAnnotation(
      makeFlatTopMarker()
    ),

    ...say('ONE BROAD, FLAT-TOPPED HILL', C.amber),

    ...fbox([
      'Flat top: vibration 4 to 6',
      ['Density = 1/9', C.amber],
      'Two operating modes are hidden'
    ], C.amber)
  );

  // ================================================================
  // 38 — DEFINE BANDWIDTH
  //
  // Isolate the bandwidth-2 triangle over reading 3.
  // Bandwidth is the distance from its center to either end.
  // ================================================================

  await until(S(38));
  await play(
    ...clearAnnotations(),

    ...clearHills(),
    ...clearDensity(),

    ...setSampleHill(MIDDLE),

    ...setBandwidthTag(
      MIDDLE
    ),

    ...setWidthGuide(
      3,
      MIDDLE,
      false
    ),

    ...say('CENTER TO EITHER END = BANDWIDTH', C.amber),

    ...fbox([
      ['Bandwidth', C.amber],
      'Distance from the hill center',
      'To either endpoint'
    ], C.amber)
  );

  // ================================================================
  // 39 — INTRODUCE THE SHORT FORMULA
  // ================================================================

  await until(S(39));
  await play(
    ...say('WRITE THE BANDWIDTH RULE'),

    ...fbox([
      'Full width',
      'Half-width',
      ['How are they related?', C.cyan]
    ])
  );

  // ================================================================
  // 40 — BANDWIDTH = FULL WIDTH DIVIDED BY TWO
  // ================================================================

  await until(S(40));
  await play(
    ...setWidthGuide(
      3,
      MIDDLE,
      true
    ),

    ...say('BANDWIDTH = FULL WIDTH ÷ 2'),

    ...fbox([
      ['Bandwidth =', C.cyan],
      'Full width ÷ 2'
    ])
  );

  // ================================================================
  // 41 — THE MIDDLE HILL HAS FULL WIDTH 4
  //
  // Center = 3.
  // Left endpoint = 1.
  // Right endpoint = 5.
  // ================================================================

  await until(S(41));
  await play(
    new M.Indicate(
      widthGuide,
      { color: C.amber }
    ),

    ...say('THE MIDDLE HILL IS 4 UNITS WIDE', C.amber),

    ...fbox([
      'Left end  = 1',
      'Right end = 5',
      ['Full width = 5 − 1 = 4', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 42 — 4 DIVIDED BY 2 = BANDWIDTH 2
  // ================================================================

  await until(S(42));
  await play(
    ...setWidthGuide(
      3,
      MIDDLE,
      false
    ),

    ...say('4 ÷ 2 = 2', C.green),

    ...fbox([
      'Bandwidth = full width ÷ 2',
      '          = 4 ÷ 2',
      ['          = 2', C.green]
    ], C.green)
  );

  // ================================================================
  // 43 — BANDWIDTH CONTROLS THE AMOUNT OF DETAIL
  //
  // Restore the full density picture with bandwidth 2.
  // ================================================================

  await until(S(43));
  await play(
    ...clearWidthGuide(),
    ...clearSampleHill(),

    ...revealHills(MIDDLE),

    ...setDensity(MIDDLE),

    ...say('BANDWIDTH CONTROLS THE DETAIL'),

    ...fbox([
      'Narrow hills → more detail',
      'Wide hills → less detail',
      ['Choose a useful balance', C.cyan]
    ])
  );

  // ================================================================
  // 44 — EXPLORE GATHERINGS AND POSSIBLE GROUPS
  // ================================================================

  await until(S(44));
  await play(
    ...showMiddleFeatures(),

    ...say('LOOK FOR GATHERINGS AND SEPARATE PEAKS'),

    ...fbox([
      'Peaks show concentrations',
      'Lower areas separate them',
      ['Explore possible groups', C.cyan]
    ])
  );

  // ================================================================
  // 45 — NARROW BANDWIDTH CAN EXAGGERATE ACCIDENTAL DIFFERENCES
  // ================================================================

  await until(S(45));
  await play(
    ...clearAnnotations(),

    ...updateHills(NARROW),

    ...setDensity(NARROW),

    ...setBandwidthTag(
      NARROW,
      C.amber
    ),

    ...showNarrowPeaks(),

    ...say('TOO NARROW: TOO MUCH DETAIL', C.amber),

    ...fbox([
      ['Bandwidth = 0.5', C.amber],
      'Six individual peaks',
      'Small differences look important'
    ], C.amber)
  );

  // ================================================================
  // 46 — WIDE BANDWIDTH CAN HIDE IMPORTANT DIFFERENCES
  // ================================================================

  await until(S(46));
  await play(
    ...clearAnnotations(),

    ...updateHills(WIDE),

    ...setDensity(WIDE),

    ...setBandwidthTag(
      WIDE,
      C.amber
    ),

    ...addAnnotation(
      makeFlatTopMarker()
    ),

    ...say('TOO WIDE: IMPORTANT DETAIL IS LOST', C.amber),

    ...fbox([
      ['Bandwidth = 6', C.amber],
      'One broad, flat top',
      'Two genuine modes are hidden'
    ], C.amber)
  );

  // ================================================================
  // 47 — BANDWIDTH 2 IS USEFUL FOR THIS EXAMPLE
  // ================================================================

  await until(S(47));
  await play(
    ...updateHills(
      MIDDLE,
      {
        leftColor: BLUE,
        rightColor: ORANGE
      }
    ),

    ...setDensity(
      MIDDLE,
      C.cyan
    ),

    ...setBandwidthTag(
      MIDDLE,
      C.green
    ),

    ...showMiddleFeatures(),

    ...revealOperatingModes(),

    ...showModeLabels(),

    ...say('HERE, BANDWIDTH 2 REVEALS BOTH MODES', C.green),

    ...fbox([
      ['Bandwidth = 2', C.green],
      ['Slow gathering: 2, 3, 4', BLUE],
      ['Fast gathering: 6, 7, 8', ORANGE],
      'Two useful peaks'
    ], C.green)
  );

  // ================================================================
  // 48 — DIFFERENT DATA MAY NEED A DIFFERENT BANDWIDTH
  //
  // Do not claim that bandwidth 2 is universally optimal.
  // Keep the narrated six readings unchanged.
  // ================================================================

  await until(S(48));
  await play(
    ...clearModeLabels(),

    ...hideOperatingModes(),

    ...say('DIFFERENT DATA MAY NEED A DIFFERENT WIDTH', C.amber),

    ...fbox([
      'Bandwidth 2 works well here',
      ['Not a universal best choice', C.amber],
      'Explore the shape of each dataset'
    ], C.amber)
  );

  // ================================================================
  // 49 — TRY IT: MOVE THE BANDWIDTH SLIDER
  //
  // Illustrated slider demonstration.
  // The six reading markers and both axes stay fixed.
  // ================================================================

  await until(S(49));
  await play(
    ...clearAnnotations(),

    ...clearBandwidthTag(),

    ...setSlider(MIDDLE),

    ...say('TRY IT: MOVE THE BANDWIDTH SLIDER'),

    ...fbox([
      'Move the slider',
      'Watch the hills change',
      ['The readings stay still', C.cyan]
    ])
  );

  // ================================================================
  // 50 — FIND A BANDWIDTH WITH SIX SEPARATE PEAKS
  // ================================================================

  await until(S(50));
  await play(
    ...setSlider(NARROW),

    ...updateHills(NARROW),

    ...setDensity(NARROW),

    ...showNarrowPeaks(),

    ...say('FIRST: FIND SIX SEPARATE PEAKS', C.amber),

    ...fbox([
      ['Try bandwidth 0.5', C.amber],
      'Count the peaks',
      'One per reading'
    ], C.amber)
  );

  // ================================================================
  // 51 — FIND TWO PEAKS, THEN SPREAD THE HILLS UNTIL THEY MERGE
  //
  // Two sequential plays within this narration beat.
  // First show bandwidth 2.
  // Then show bandwidth 6.
  //
  // Never run two play() calls concurrently.
  // ================================================================

  await until(S(51));
  await play(
    ...setSlider(MIDDLE),

    ...updateHills(MIDDLE),

    ...setDensity(MIDDLE),

    ...showMiddleFeatures(),

    ...say('NEXT: FIND TWO PEAKS'),

    ...fbox([
      ['Bandwidth = 2', C.cyan],
      'Two separate peaks'
    ])
  );

  await play(
    ...clearAnnotations(),

    ...setSlider(WIDE),

    ...updateHills(
      WIDE,
      { runTime: 1.5 }
    ),

    ...setDensity(
      WIDE,
      C.cyan,
      1.5
    ),

    ...addAnnotation(
      makeFlatTopMarker()
    ),

    ...fbox([
      ['Bandwidth = 6', C.amber],
      'The peaks merge',
      'One broad density picture'
    ], C.amber)
  );

  // ================================================================
  // 52 — TRY NEW DATA IN THE SEPARATE INTERACTIVE ACTIVITY
  //
  // Illustrate the New data control.
  //
  // Do not invent replacement readings inside the fixed
  // narrated dataset. New data generation belongs to the
  // separate Try it simulation.
  // ================================================================

  await until(S(52));
  await play(
    ...clearSlider(),

    new M.FadeIn(newDataButton),

    ...say('NEW DATA · EXPLORE AGAIN', C.violet),

    ...fbox([
      ['Press New data in Try it', C.violet],
      'Explore different bandwidths',
      'Find a useful amount of detail'
    ], C.violet)
  );

  // ================================================================
  // 53 — FINAL TAKEAWAY
  //
  // Restore the six fixed readings and bandwidth 2.
  //
  // Peak at 3 = 1/6.
  // Peak at 7 = 1/6.
  // Valley at 5 = 1/12.
  //
  // Bandwidth controls how much detail appears in the
  // continuous density picture.
  //
  // Preserve the exact reading coordinates, the equal
  // triangular hill areas and the common density scale.
  // ================================================================

  await until(S(53));
  await play(
    new M.FadeOut(newDataButton),

    ...updateHills(
      MIDDLE,
      {
        leftColor: BLUE,
        rightColor: ORANGE
      }
    ),

    ...setDensity(MIDDLE),

    ...setBandwidthTag(
      MIDDLE,
      C.green
    ),

    ...showMiddleFeatures(),

    ...revealOperatingModes(),

    ...showModeLabels(),

    ...say('BANDWIDTH CONTROLS THE DETAIL YOU SEE', C.green),

    ...fbox([
      'Bandwidth = full width ÷ 2',
      ['Too narrow: too much detail', C.amber],
      ['Too wide: hidden differences', C.amber],
      ['Here, 2 reveals both modes', C.green]
    ], C.green)
  );
}
