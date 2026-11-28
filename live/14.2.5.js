// lesson 14.2.5
// Kernel density estimation: building a continuous density picture.
// Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
//
// Fixed normal vibration readings: 2, 3, 4, 6, 7, 8 mm/s.
// Main demonstration bandwidth: 2.
// Every triangular kernel has area 1/6 and maximum height 1/12.
//
// At vibration 3:
//   A contributes 1/24.
//   B contributes 1/12.
//   C contributes 1/24.
//   D, E and F contribute zero.
//   Estimated density = 1/6.
//
// At vibration 5:
//   C and D each contribute 1/24.
//   All other contributions are zero.
//   Estimated density = 1/12.
//
// The combined density has total area 1.
// Operating-mode labels remain hidden from the method.
//
// Try it controls are animated illustrations of the separate activity.
// Temporary reading movements are explicitly marked as an experiment.
// The original chapter dataset is restored at the end.
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
  const IDS = DATA.map(d => d.id);
  const N = DATA.length;

  const BANDWIDTH = 2;
  const NARROW = 0.5;
  const WIDE = 6;

  const BLUE = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';

  // Individual kernels use neutral colors.
  // Blue and orange do not imply learned mode membership.

  const KERNEL_COLOR = '#7895AA';
  const KERNEL_FILL = '#263746';

  const STACK_COLORS = [
    '#60A5FA',
    '#67E8F9',
    '#A78BFA',
    '#FB923C',
    '#86EFAC',
    '#FDE68A'
  ];

  // ================================================================
  // EXACT TRIANGULAR KERNEL DENSITY CALCULATIONS
  //
  // Each kernel has:
  //
  //   center = observed reading
  //   full width = 2h
  //   maximum height = 1 / (Nh)
  //
  // Area = (2h × 1/(Nh)) / 2 = 1/N.
  //
  // Individual contribution at position x:
  //
  //   max(0, 1 - |x - reading| / h) / (Nh)
  //
  // Estimated density:
  //
  //   sum of all individual kernel contributions.
  //
  // Full numerical precision is retained internally.
  // ================================================================

  function kernelHeight(h) {
    return 1 / (N * h);
  }

  function kernelArea(h) {
    return 0.5 * (2 * h) * kernelHeight(h);
  }

  function contribution(x, reading, h = BANDWIDTH) {
    return (
      Math.max(
        0,
        1 - Math.abs(x - reading) / h
      ) / (N * h)
    );
  }

  function density(
    x,
    h = BANDWIDTH,
    values = VALUES
  ) {
    return values.reduce(
      (total, reading) =>
        total + contribution(x, reading, h),
      0
    );
  }

  function contributionsAt(
    x,
    h = BANDWIDTH,
    values = VALUES
  ) {
    return values.map((reading, i) => ({
      id: IDS[i],
      reading,
      value: contribution(x, reading, h)
    }));
  }

  function fmt(value, digits = 4) {
    return value.toFixed(digits);
  }

  // Display exact simple fractions when available.

  function gcd(a, b) {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }

    return Math.abs(a);
  }

  function fraction(value) {
    if (Math.abs(value) < 1e-12) {
      return '0';
    }

    for (let d = 1; d <= 144; d++) {
      const n = Math.round(value * d);

      if (Math.abs(value - n / d) < 1e-10) {
        const g = gcd(n, d);

        return d / g === 1
          ? String(n / g)
          : `${n / g}/${d / g}`;
      }
    }

    return `≈ ${fmt(value)}`;
  }

  const AT3 = contributionsAt(3);
  const AT5 = contributionsAt(5);

  const DENSITY_3 = density(3);
  const DENSITY_5 = density(5);

  // Checked values:
  //
  // AT3 = [1/24, 1/12, 1/24, 0, 0, 0]
  // AT5 = [0, 0, 1/24, 1/24, 0, 0]
  //
  // Density at 3 = 0.166666...
  // Density at 5 = 0.083333...
  //
  // Density at 3 / density at 5 = 2.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone: formula above the picture.
  // Laptop: formula beside the picture.
  //
  // Fixed horizontal domain -4 to 14 contains all six
  // triangular kernels even at bandwidth 6.
  //
  // The negative part of the horizontal axis represents
  // mathematical kernel support, not measured negative vibration.
  //
  // A fixed vertical scale makes bandwidth comparisons honest.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.62, 0]
    : [4.45, -0.30, 0];

  const STATUS_POS = P
    ? [0, -6.00, 0]
    : [4.45, 1.24, 0];

  const CONTROL_POS = P
    ? [0, -6.62, 0]
    : [4.45, -2.18, 0];

  const point = (x, y) => [x, y, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const XMIN = -4;
  const XMAX = 14;

  const XLEFT = P ? -3.15 : -6.35;
  const XRIGHT = P ? 3.15 : 1.25;

  const BASE = P ? -4.90 : -2.60;
  const YTOP = P ? 1.50 : 1.20;

  const MAX_DENSITY = 0.36;

  const XUNIT =
    (XRIGHT - XLEFT) / (XMAX - XMIN);

  const YUNIT =
    (YTOP - BASE) / MAX_DENSITY;

  const px = x =>
    XLEFT + (x - XMIN) * XUNIT;

  const py = y =>
    BASE + y * YUNIT;

  const gp = (x, y = 0) =>
    point(px(x), py(y));

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
    strokeWidth = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth
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
    lagRatio = 0.1
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
  // One formula box is visible at a time.
  // Long expressions are split across short, readable lines.
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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.34;

    const bg = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);

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
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(bg, ...texts);

    const maxw = P ? FW - 1.0 : 4.9;
    const maxh = P ? 1.95 : 3.10;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    animations.push(
      new M.FadeIn(g)
    );

    return animations;
  }

  // ================================================================
  // INDEPENDENT TEMPORARY VISUAL LAYERS
  //
  // Each named layer owns a separate object.
  // Replacing a layer does not regroup visible objects.
  //
  // This keeps the formula box, probe, measurements, status,
  // annotations and simulated controls independently removable.
  // ================================================================

  const layers = {};

  function replaceLayer(key, next) {
    const animations = [];

    if (layers[key]) {
      animations.push(
        new M.FadeOut(layers[key])
      );

      delete layers[key];
    }

    if (next) {
      layers[key] = next;

      animations.push(
        new M.FadeIn(next)
      );
    }

    return animations;
  }

  function clearLayer(key) {
    return replaceLayer(key, null);
  }

  function clearLayers(...keys) {
    return keys.flatMap(clearLayer);
  }

  function status(s, color = C.cyan) {
    return replaceLayer(
      'status',

      fittedPill(
        s,
        color,
        P ? 16 : 14,
        STATUS_POS,
        P ? 6.1 : 3.8
      )
    );
  }

  // ================================================================
  // WORKSHOP MACHINE INTRODUCTION
  // ================================================================

  function makeMachine() {
    const x = CX;
    const y = P ? -1.45 : -0.40;

    const housing = roundedAt(
      point(x, y),
      3.15,
      2.10,
      C.muted,
      0.15,
      2
    );

    const cap = roundedAt(
      point(x, y + 1.12),
      2.65,
      0.20,
      C.cyan,
      0.30
    );

    const wheelCenter =
      point(x - 0.57, y + 0.04);

    const wheel = circleAt(
      wheelCenter,
      0.70,
      C.cyan,
      0.06,
      3
    );

    const spokes = [];

    for (let i = 0; i < 4; i++) {
      const a =
        Math.PI / 4 + i * Math.PI / 2;

      spokes.push(
        lineAt(
          wheelCenter,

          point(
            wheelCenter[0] + 0.59 * Math.cos(a),
            wheelCenter[1] + 0.59 * Math.sin(a)
          ),

          C.cyan,
          2.5
        )
      );
    }

    const hub = circleAt(
      wheelCenter,
      0.16,
      C.cyan,
      0.90
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

    const feet = [-1, 1].map(side =>
      roundedAt(
        point(
          x + side * 1.02,
          y - 1.20
        ),
        0.55,
        0.30,
        C.muted,
        0.70
      )
    );

    const floor = lineAt(
      point(x - 2.14, y - 1.37),
      point(x + 2.14, y - 1.37),
      C.muted,
      2
    );

    const light = new M.Dot({
      point: point(x + 1.12, y + 0.76),
      radius: 0.075,
      color: C.green
    });

    const shakes = [];

    [-1, 1].forEach(side => {
      const xx = x + side * 1.75;

      for (let j = 0; j < 2; j++) {
        const yy = y + 0.60 - j * 0.88;

        const a = point(xx, yy);

        const b = point(
          xx + side * 0.15,
          yy - 0.14
        );

        const c = point(xx, yy - 0.28);

        shakes.push(
          lineAt(a, b, C.amber, 2),
          lineAt(b, c, C.amber, 2)
        );
      }
    });

    const mg = new M.VGroup(
      floor,
      housing,
      cap,
      ...feet,
      wheel,
      ...spokes,
      hub,
      ...vents,
      light,
      ...shakes
    );
    if (P) mg.scale(1.45);
    return mg;
  }

  const machine = makeMachine();

  const introTag = fittedPill(
    '6 readings · Number of groups unknown',
    C.amber,
    P ? 17 : 15,

    point(
      CX,
      P ? -4.20 : -2.24
    ),

    5.15
  );

  // ================================================================
  // FIXED HORIZONTAL AND VERTICAL AXES
  // ================================================================

  function makeXAxis() {
    const objects = [
      lineAt(
        gp(XMIN),
        gp(XMAX),
        C.muted,
        2.4
      )
    ];

    const ticks = [
      -4, -2, 0,
      2, 3, 4, 5, 6, 7, 8,
      10, 12, 14
    ];

    ticks.forEach(x => {
      objects.push(
        lineAt(
          point(px(x), BASE - 0.045),
          point(px(x), BASE + 0.045),
          C.muted,
          1.2
        ),

        textAt(
          String(x).replace('-', '−'),

          point(
            px(x),
            BASE - (P ? 0.23 : 0.18)
          ),

          P ? 16 : 15,
          C.muted,
          true
        )
      );
    });

    objects.push(
      textAt(
        'Vibration (mm/s)',

        point(
          (XLEFT + XRIGHT) / 2,
          BASE - (P ? 0.57 : 0.47)
        ),

        P ? 20 : 19,
        C.ink
      )
    );

    return new M.VGroup(...objects);
  }

  function makeYAxis() {
    const objects = [
      lineAt(
        gp(XMIN, 0),
        gp(XMIN, MAX_DENSITY),
        C.muted,
        2
      )
    ];

    const ticks = [
      { v: 0, s: '0' },
      { v: 1 / 24, s: '1/24' },
      { v: 1 / 12, s: '1/12' },
      { v: 1 / 6, s: '1/6' },
      { v: 1 / 4, s: '1/4' },
      { v: 1 / 3, s: '1/3' }
    ];

    ticks.forEach(({ v, s }) => {
      const y = py(v);

      if (v > 0) {
        objects.push(
          lineAt(
            point(XLEFT, y),
            point(XRIGHT, y),
            '#293648',
            0.8
          )
        );
      }

      objects.push(
        lineAt(
          point(XLEFT - 0.04, y),
          point(XLEFT + 0.04, y),
          C.muted,
          1
        ),

        textAt(
          s,

          point(
            XLEFT - 0.32,
            y
          ),

          P ? 16 : 14,
          C.muted,
          true
        )
      );
    });

    objects.push(
      textAt(
        'Density',

        point(
          XLEFT + 0.48,
          YTOP + 0.16
        ),

        P ? 17 : 15,
        C.ink
      )
    );

    return new M.VGroup(...objects);
  }

  const xAxis = makeXAxis();
  const yAxis = makeYAxis();

  // ================================================================
  // SIX OBSERVED READING MARKERS
  //
  // All markers are neutral white because the operating
  // mode labels are hidden.
  //
  // Reading letters remain visible.
  // ================================================================

  function makeReading(
    id,
    x,
    experimental = false
  ) {
    const color =
      experimental ? PURPLE : C.ink;

    const p = gp(x);

    const halo = new M.Dot({
      point: p,
      radius: 0.145,
      color
    });

    halo.setFill(color, 0.14);

    const dot = new M.Dot({
      point: p,
      radius: 0.075,
      color
    });

    const label = textAt(
      id,

      point(
        p[0],
        BASE + 0.19
      ),

      P ? 16 : 15,
      color,
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
      makeReading(d.id, d.x)
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
  // EQUAL PORTIONS OF SAND
  //
  // Each little rectangular sand portion represents area 1/6.
  // The six portions are identical in size.
  //
  // These are conceptual tokens, not measured density bars.
  // ================================================================

  function makeSandPortion(x) {
    const p = point(
      px(x),
      BASE + 0.63
    );

    const w = 0.23;
    const h = 0.30;

    const body = blockAt(
      p,
      w,
      h,
      '#D6B675',
      0.87
    );

    const grains = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        grains.push(
          new M.Dot({
            point: point(
              p[0] - 0.05 + col * 0.10,
              p[1] - 0.08 + row * 0.08
            ),

            radius: 0.018,
            color: '#FDE68A'
          })
        );
      }
    }

    return new M.VGroup(
      body,
      ...grains
    );
  }

  const sandPortions =
    VALUES.map(makeSandPortion);

  // ================================================================
  // TRIANGULAR KERNELS
  //
  // Exact geometric endpoints:
  //
  //   (reading - h, 0)
  //   (reading, 1/(Nh))
  //   (reading + h, 0)
  //
  // Interior strokes provide a translucent sand-like appearance.
  // The number of strokes remains constant between transforms.
  // ================================================================

  const HILL_STRIPS = 17;

  function makeKernel(
    reading,
    h,
    color = KERNEL_COLOR,
    emphasized = false
  ) {
    const left = gp(
      reading - h,
      0
    );

    const peak = gp(
      reading,
      kernelHeight(h)
    );

    const right = gp(
      reading + h,
      0
    );

    const objects = [];

    for (
      let i = 1;
      i <= HILL_STRIPS;
      i++
    ) {
      const t =
        i / (HILL_STRIPS + 1);

      const x =
        reading - h + 2 * h * t;

      const height =
        contribution(x, reading, h);

      objects.push(
        lineAt(
          gp(x),
          gp(x, height),

          emphasized
            ? '#34515B'
            : KERNEL_FILL,

          emphasized ? 2.2 : 1.3
        )
      );
    }

    objects.push(
      lineAt(
        left,
        peak,
        color,
        emphasized ? 3.1 : 1.7
      ),

      lineAt(
        peak,
        right,
        color,
        emphasized ? 3.1 : 1.7
      ),

      lineAt(
        left,
        right,
        color,
        0.9
      )
    );

    return new M.VGroup(...objects);
  }

  const hills = {};

  let activeValues = VALUES.slice();
  let activeBandwidth = BANDWIDTH;

  function revealHills(
    h = BANDWIDTH,
    values = VALUES
  ) {
    activeBandwidth = h;
    activeValues = values.slice();

    const animations = [];

    values.forEach((x, i) => {
      const id = IDS[i];

      hills[id] = makeKernel(
        x,
        h
      );

      animations.push(
        new M.FadeIn(hills[id])
      );
    });

    return [
      lag(animations, 1.6, 0.12)
    ];
  }

  function updateHills(
    h = activeBandwidth,
    values = activeValues,
    selected = '',
    runTime = 0.9
  ) {
    activeBandwidth = h;
    activeValues = values.slice();

    return values.map((x, i) => {
      const id = IDS[i];

      const emphasize =
        selected.includes(id);

      const target = makeKernel(
        x,
        h,

        emphasize
          ? C.amber
          : KERNEL_COLOR,

        emphasize
      );

      return new M.Transform(
        hills[id],
        target,
        { runTime }
      );
    });
  }

  function focusHills(
    ids,
    color = C.amber
  ) {
    return lag(
      Array.from(ids).map(id =>
        new M.Indicate(
          hills[id],
          { color }
        )
      ),

      1.0,
      0.12
    );
  }

  // ================================================================
  // BANDWIDTH / WIDTH GUIDES
  //
  // Use the kernel centered at reading B, vibration 3.
  //
  // Bandwidth = 2.
  // Left end = 1.
  // Right end = 5.
  // Full width = 4.
  // ================================================================

  function makeWidthGuide(
    reading,
    h,
    fullWidth = false
  ) {
    const left = px(reading - h);
    const center = px(reading);
    const right = px(reading + h);

    const y =
      py(kernelHeight(h)) + 0.54;

    const a = fullWidth
      ? left
      : center;

    const b = right;

    const objects = [
      lineAt(
        point(a, y),
        point(b, y),
        C.amber,
        2.6
      ),

      lineAt(
        point(a, y - 0.09),
        point(a, y + 0.09),
        C.amber,
        2
      ),

      lineAt(
        point(b, y - 0.09),
        point(b, y + 0.09),
        C.amber,
        2
      ),

      dashedAt(
        point(
          a,
          fullWidth
            ? BASE
            : py(kernelHeight(h))
        ),

        point(a, y - 0.09),
        C.amber
      ),

      dashedAt(
        point(b, BASE),
        point(b, y - 0.09),
        C.amber
      )
    ];

    objects.push(
      fittedPill(
        fullWidth
          ? `Width = ${2 * h}`
          : `Bandwidth = ${h}`,

        C.amber,
        P ? 16 : 14,

        point(
          (a + b) / 2,
          y + 0.28
        ),

        2.45
      )
    );

    return new M.VGroup(...objects);
  }

  function makeBothHalfWidths(
    reading,
    h
  ) {
    const y =
      py(kernelHeight(h)) + 0.49;

    const x1 = px(reading - h);
    const x2 = px(reading);
    const x3 = px(reading + h);

    const parts = [
      lineAt(
        point(x1, y),
        point(x2, y),
        C.amber,
        2.5
      ),

      lineAt(
        point(x2, y),
        point(x3, y),
        C.amber,
        2.5
      )
    ];

    [x1, x2, x3].forEach(x => {
      parts.push(
        lineAt(
          point(x, y - 0.09),
          point(x, y + 0.09),
          C.amber,
          2
        )
      );
    });

    parts.push(
      textAt(
        String(h),

        point(
          (x1 + x2) / 2,
          y + 0.19
        ),

        P ? 16 : 15,
        C.amber,
        true
      ),

      textAt(
        String(h),

        point(
          (x2 + x3) / 2,
          y + 0.19
        ),

        P ? 16 : 15,
        C.amber,
        true
      ),

      dashedAt(
        gp(reading - h),
        point(x1, y - 0.09),
        C.amber
      ),

      dashedAt(
        gp(reading + h),
        point(x3, y - 0.09),
        C.amber
      )
    );

    return new M.VGroup(...parts);
  }

  // ================================================================
  // EXACT COMBINED DENSITY CURVE
  //
  // The sum of triangular kernels is piecewise linear.
  //
  // All slope changes occur at kernel centers or endpoints.
  // Construct the curve using those exact breakpoints.
  //
  // A common sample grid is included to maintain stable
  // topology during the narrated bandwidth transformations.
  // ================================================================

  const EXPERIMENT_VALUES = [
    2.25,
    2.75,
    4,
    6,
    7,
    8
  ];

  const ALL_CURVE_X = Array.from(
    new Set([
      XMIN,
      XMAX,

      ...Array.from(
        { length: 145 },
        (_, i) => XMIN + i / 8
      ),

      ...[
        VALUES,
        EXPERIMENT_VALUES,

        // Intermediate reading positions in Try it.
        [2.25, 3, 4, 6, 7, 8]
      ].flatMap(values =>
        [NARROW, BANDWIDTH, WIDE].flatMap(h =>
          values.flatMap(v => [
            v - h,
            v,
            v + h
          ])
        )
      )
    ])
  )
    .filter(x =>
      x >= XMIN && x <= XMAX
    )
    .sort((a, b) => a - b);

  function makeDensityCurve(
    h,
    values = VALUES,
    color = C.cyan
  ) {
    const glow = [];
    const main = [];

    for (
      let i = 0;
      i < ALL_CURVE_X.length - 1;
      i++
    ) {
      const x1 = ALL_CURVE_X[i];
      const x2 = ALL_CURVE_X[i + 1];

      const p = gp(
        x1,
        density(x1, h, values)
      );

      const q = gp(
        x2,
        density(x2, h, values)
      );

      glow.push(
        lineAt(
          p,
          q,
          '#245562',
          6
        )
      );

      main.push(
        lineAt(
          p,
          q,
          color,
          3.2
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
    h = activeBandwidth,
    values = activeValues,
    runTime = 1.0
  ) {
    const target =
      makeDensityCurve(h, values);

    if (!combinedCurve) {
      combinedCurve = target;

      return [
        new M.FadeIn(combinedCurve)
      ];
    }

    return [
      new M.Transform(
        combinedCurve,
        target,
        { runTime }
      )
    ];
  }

  // ================================================================
  // COMBINED DENSITY AREA
  //
  // The shaded region is a visual representation of the
  // area under the combined curve.
  //
  // The area itself is calculated exactly by integrating
  // its piecewise-linear segments using trapezoids.
  // ================================================================

  function exactArea(
    h,
    values = VALUES
  ) {
    const knots = Array.from(
      new Set(
        values.flatMap(v => [
          v - h,
          v,
          v + h
        ])
      )
    ).sort((a, b) => a - b);

    let area = 0;

    for (
      let i = 0;
      i < knots.length - 1;
      i++
    ) {
      const a = knots[i];
      const b = knots[i + 1];

      area +=
        (b - a) *
        (
          density(a, h, values) +
          density(b, h, values)
        ) / 2;
    }

    return area;
  }

  function makeAreaShading(
    h,
    values = VALUES
  ) {
    const objects = [];

    for (let i = 0; i <= 160; i++) {
      const x =
        XMIN +
        i / 160 *
        (XMAX - XMIN);

      const height =
        density(x, h, values);

      if (height > 1e-12) {
        objects.push(
          lineAt(
            gp(x),
            gp(x, height),
            '#315C66',
            2.1
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  // ================================================================
  // ACTIVE VERTICAL PROBE
  //
  // The line passes through every kernel at one selected
  // vibration value.
  //
  // No reading positions change when the probe moves.
  // ================================================================

  function makeProbe(
    x,
    h = activeBandwidth,
    values = activeValues,
    options = {}
  ) {
    const {
      showTotal = false,
      label = true
    } = options;

    const total = density(
      x,
      h,
      values
    );

    const highestIndividual =
      Math.max(
        ...values.map(v =>
          contribution(x, v, h)
        )
      );

    const height = Math.min(
      MAX_DENSITY,

      Math.max(
        0.12,
        highestIndividual + 0.035,
        total + 0.03
      )
    );

    const p = gp(x);

    const top = gp(
      x,
      height
    );

    const guide = dashedAt(
      p,
      top,
      C.amber
    );

    const ring = circleAt(
      p,
      0.13,
      C.amber,
      0,
      2.1
    );

    const objects = [
      guide,
      ring
    ];

    if (label) {
      objects.push(
        fittedPill(
          `x = ${Number(x.toFixed(2))}`,

          C.amber,
          P ? 16 : 15,

          point(
            top[0],
            top[1] + 0.24
          ),

          1.50
        )
      );
    }

    if (showTotal) {
      const q = gp(x, total);

      const halo = new M.Dot({
        point: q,
        radius: 0.14,
        color: C.cyan
      });

      halo.setFill(C.cyan, 0.17);

      const dot = new M.Dot({
        point: q,
        radius: 0.07,
        color: C.cyan
      });

      objects.push(halo, dot);
    }

    return new M.VGroup(...objects);
  }

  function setProbe(
    x,
    options = {}
  ) {
    return replaceLayer(
      'probe',

      makeProbe(
        x,
        activeBandwidth,
        activeValues,
        options
      )
    );
  }

  // ================================================================
  // INDIVIDUAL KERNEL CONTRIBUTION MEASURE
  //
  // Draw the vertical height from zero to a particular
  // kernel's contribution at the chosen position.
  //
  // A and C coincide at height 1/24 when x = 3.
  // They are measured separately in consecutive narration beats.
  // ================================================================

  function makeContributionMeasure(
    id,
    x,
    h = BANDWIDTH,
    values = VALUES
  ) {
    const index = IDS.indexOf(id);
    const reading = values[index];

    const value =
      contribution(x, reading, h);

    const color =
      STACK_COLORS[index];

    const bottom = gp(x);
    const top = gp(x, value);

    const objects = [];

    if (value > 1e-12) {
      objects.push(
        lineAt(
          bottom,
          top,
          color,
          5
        ),

        dashedAt(
          point(XLEFT, top[1]),
          top,
          color
        ),

        new M.Dot({
          point: top,
          radius: 0.065,
          color
        })
      );

    } else {
      objects.push(
        circleAt(
          bottom,
          0.10,
          color,
          0,
          2
        )
      );
    }

    const side =
      index % 2 === 0 ? -1 : 1;

    const labelPos = point(
      top[0] + side * 1.15,
      top[1] + 0.29
    );

    objects.push(
      lineAt(
        top,

        point(
          labelPos[0],
          labelPos[1] - 0.10
        ),

        color,
        1.4
      ),

      fittedPill(
        `${id}: ${fraction(value)}`,

        color,
        P ? 16 : 15,
        labelPos,
        1.65
      )
    );

    return new M.VGroup(...objects);
  }

  function measureContribution(
    id,
    x
  ) {
    return replaceLayer(
      'measure',

      makeContributionMeasure(
        id,
        x,
        activeBandwidth,
        activeValues
      )
    );
  }

  // ================================================================
  // STACKED CONTRIBUTION BLOCKS
  //
  // Block heights are exact density contributions.
  //
  // At vibration 3:
  //
  // A = 1/24
  // B = 2/24
  // C = 1/24
  //
  // At vibration 5:
  //
  // C = 1/24
  // D = 1/24
  //
  // Zero contributions do not produce blocks.
  // ================================================================

  const STACK_W = P ? 0.31 : 0.27;

  function makeContributionBlocks(
    x,
    options = {}
  ) {
    const {
      h = activeBandwidth,
      values = activeValues,
      separated = false,
      splitUnits = false,
      totalLabel = false
    } = options;

    const rows = contributionsAt(
      x,
      h,
      values
    ).filter(row =>
      row.value > 1e-12
    );

    const objects = [];

    let running = 0;

    rows.forEach((row, i) => {
      const color =
        STACK_COLORS[
          IDS.indexOf(row.id)
        ];

      const start =
        separated ? 0 : running;

      const xpos = separated
        ? px(x) +
          (i - (rows.length - 1) / 2) * 0.57
        : px(x);

      let units = 1;

      if (
        splitUnits &&
        Math.abs(
          row.value * 24 -
          Math.round(row.value * 24)
        ) < 1e-10
      ) {
        units = Math.max(
          1,
          Math.round(row.value * 24)
        );
      }

      const piece =
        row.value / units;

      for (let j = 0; j < units; j++) {
        const lower =
          start + j * piece;

        const upper =
          lower + piece;

        const y0 = py(lower);
        const y1 = py(upper);

        objects.push(
          blockAt(
            point(
              xpos,
              (y0 + y1) / 2
            ),

            STACK_W,
            y1 - y0,
            color,
            0.92,
            1.2
          )
        );

        objects.push(
          textAt(
            row.id,

            point(
              xpos,
              (y0 + y1) / 2
            ),

            P ? 16 : 14,
            '#0F172A',
            true
          )
        );
      }

      if (separated) {
        objects.push(
          textAt(
            fraction(row.value),

            point(
              xpos,
              py(row.value) + 0.19
            ),

            P ? 16 : 14,
            color,
            true
          )
        );
      }

      running += row.value;
    });

    if (!separated) {
      const top = gp(x, running);

      objects.push(
        lineAt(
          point(
            top[0] - STACK_W / 2 - 0.04,
            top[1]
          ),

          point(
            top[0] + STACK_W / 2 + 0.04,
            top[1]
          ),

          C.ink,
          2
        )
      );

      if (totalLabel) {
        objects.push(
          fittedPill(
            `Total = ${fraction(running)}`,

            C.cyan,
            P ? 16 : 14,

            point(
              top[0],
              top[1] + 0.32
            ),

            2.20
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function setStack(
    x,
    options = {}
  ) {
    return replaceLayer(
      'stack',

      makeContributionBlocks(
        x,
        options
      )
    );
  }

  // ================================================================
  // ANIMATE SEPARATE BLOCKS INTO ONE STACK
  //
  // Each original contribution retains its height.
  // Only its horizontal and vertical positions change.
  //
  // Use separate visible objects for each contribution.
  // Never wrap them into a new visible VGroup.
  // ================================================================

  let movableBlocks = [];

  function revealSeparateBlocks(x) {
    const rows = contributionsAt(x)
      .filter(row => row.value > 1e-12);

    movableBlocks = rows.map((row, i) => {
      const index = IDS.indexOf(row.id);

      const color =
        STACK_COLORS[index];

      const xx =
        px(x) +
        (i - (rows.length - 1) / 2) * 0.62;

      const h =
        row.value * YUNIT;

      const center = point(
        xx,
        BASE + h / 2
      );

      const rect = blockAt(
        center,
        STACK_W,
        h,
        color,
        0.92
      );

      const label = textAt(
        row.id,
        center,
        P ? 16 : 14,
        '#0F172A',
        true
      );

      return {
        row,
        color,
        obj: new M.VGroup(rect, label)
      };
    });

    return movableBlocks.map(item =>
      new M.FadeIn(item.obj)
    );
  }

  function stackMovableBlocks(x) {
    const animations = [];

    let running = 0;

    movableBlocks.forEach(item => {
      const h =
        item.row.value * YUNIT;

      const center = point(
        px(x),
        py(running) + h / 2
      );

      const target = new M.VGroup(
        blockAt(
          center,
          STACK_W,
          h,
          item.color,
          0.92
        ),

        textAt(
          item.row.id,
          center,
          P ? 16 : 14,
          '#0F172A',
          true
        )
      );

      animations.push(
        new M.Transform(
          item.obj,
          target,

          {
            runTime: 0.65,
            pathArc: 0.35
          }
        )
      );

      running += item.row.value;
    });

    return [
      lag(
        animations,
        1.2,
        0.20
      )
    ];
  }

  function clearMovableBlocks() {
    const animations =
      movableBlocks.map(item =>
        new M.FadeOut(item.obj)
      );

    movableBlocks = [];

    return animations;
  }

  // ================================================================
  // COMPARISON MARKERS
  //
  // Show the exact peak at x = 3 and the valley at x = 5.
  // Both vertical guides start at the same zero baseline.
  //
  // Their heights are directly comparable.
  // ================================================================

  function makeDensityMarker(
    x,
    h = activeBandwidth,
    values = activeValues,
    color = C.cyan,
    label = null,
    offsetX = 0
  ) {
    const value =
      density(x, h, values);

    const top =
      gp(x, value);

    const guide = dashedAt(
      gp(x),
      top,
      color
    );

    const halo = new M.Dot({
      point: top,
      radius: 0.14,
      color
    });

    halo.setFill(color, 0.15);

    const dot = new M.Dot({
      point: top,
      radius: 0.065,
      color
    });

    const tag = fittedPill(
      label ||
        `${x}: ${fraction(value)}`,

      color,
      P ? 16 : 15,

      point(
        top[0] + offsetX,
        top[1] + 0.30
      ),

      1.70
    );

    return new M.VGroup(
      guide,
      halo,
      dot,
      tag
    );
  }

  function makePeakValleyComparison() {
    return new M.VGroup(
      makeDensityMarker(
        3,
        BANDWIDTH,
        VALUES,
        C.cyan,
        '3: 1/6',
        -0.14
      ),

      makeDensityMarker(
        5,
        BANDWIDTH,
        VALUES,
        C.amber,
        '5: 1/12',
        0.15
      )
    );
  }

  function makeTwoPeaks() {
    return new M.VGroup(
      makeDensityMarker(
        3,
        BANDWIDTH,
        VALUES,
        C.cyan,
        'Peak: 1/6',
        -0.24
      ),

      makeDensityMarker(
        5,
        BANDWIDTH,
        VALUES,
        C.amber,
        'Valley: 1/12'
      ),

      makeDensityMarker(
        7,
        BANDWIDTH,
        VALUES,
        C.cyan,
        'Peak: 1/6',
        0.24
      )
    );
  }

  function makeNarrowPeakMarkers() {
    const objects = [];

    VALUES.forEach(x => {
      const p = gp(
        x,
        density(x, NARROW)
      );

      objects.push(
        new M.Dot({
          point: p,
          radius: 0.055,
          color: C.amber
        })
      );
    });

    objects.push(
      fittedPill(
        '6 separate peaks',

        C.amber,
        P ? 16 : 14,

        point(
          CX,
          py(1 / 3) + 0.30
        ),

        2.75
      )
    );

    return new M.VGroup(...objects);
  }

  function makeWideFlatTop() {
    const height =
      density(5, WIDE);

    const left = gp(4, height);
    const right = gp(6, height);

    return new M.VGroup(
      dashedAt(
        gp(4),
        left,
        C.amber
      ),

      dashedAt(
        gp(6),
        right,
        C.amber
      ),

      lineAt(
        left,
        right,
        C.amber,
        4.5
      ),

      new M.Dot({
        point: left,
        radius: 0.055,
        color: C.amber
      }),

      new M.Dot({
        point: right,
        radius: 0.055,
        color: C.amber
      }),

      fittedPill(
        'Flat top: 1/9',

        C.amber,
        P ? 16 : 15,

        point(
          px(5),
          py(height) + 0.33
        ),

        2.10
      )
    );
  }

  // ================================================================
  // FORMULA BOX FOR THE MOVING PROBE
  //
  // Every displayed contribution is calculated using
  // the current reading positions and bandwidth.
  //
  // The labels identify individual readings, not groups.
  // ================================================================

  function probeFormula(
    x,
    h = activeBandwidth,
    values = activeValues
  ) {
    const rows =
      contributionsAt(
        x,
        h,
        values
      );

    const v = i =>
      fraction(rows[i].value);

    return fbox([
      [
        `At vibration ${Number(x.toFixed(2))}`,
        C.amber
      ],

      `A: ${v(0)}    B: ${v(1)}`,

      `C: ${v(2)}    D: ${v(3)}`,

      `E: ${v(4)}    F: ${v(5)}`,

      [
        `Total = ${fraction(density(x, h, values))}`,
        C.cyan
      ]
    ]);
  }

  // ================================================================
  // TRY IT SLIDER ILLUSTRATIONS
  //
  // The actual pointer-interactive controls belong to
  // the separate lesson simulation.
  // ================================================================

  function makeSlider(
    title,
    value,
    min,
    max,
    color = C.cyan
  ) {
    const center = CONTROL_POS;

    const width = P ? 5.2 : 3.8;

    const left = center[0] - width / 2;
    const right = center[0] + width / 2;

    const y = center[1];

    const t = Math.max(
      0,

      Math.min(
        1,
        (value - min) / (max - min)
      )
    );

    const knobX =
      left + t * width;

    const track = lineAt(
      point(left, y),
      point(right, y),
      C.muted,
      4
    );

    const halo = circleAt(
      point(knobX, y),
      0.145,
      color,
      0.14,
      1.2
    );

    const knob = new M.Dot({
      point: point(knobX, y),
      radius: 0.085,
      color
    });

    const label = textAt(
      `${title}: ${Number(value.toFixed(2))}`,

      point(
        center[0],
        y + 0.24
      ),

      P ? 16 : 15,
      color,
      true
    );

    const minText = textAt(
      String(min),
      point(left, y - 0.19),
      P ? 16 : 14,
      C.muted,
      true
    );

    const maxText = textAt(
      String(max),
      point(right, y - 0.19),
      P ? 16 : 14,
      C.muted,
      true
    );

    return new M.VGroup(
      track,
      halo,
      knob,
      label,
      minText,
      maxText
    );
  }

  function probeSlider(x) {
    return replaceLayer(
      'control',

      makeSlider(
        'Probe',
        x,
        0,
        10,
        C.amber
      )
    );
  }

  function bandwidthSlider(h) {
    return replaceLayer(
      'control',

      makeSlider(
        'Bandwidth',
        h,
        0.5,
        6,
        C.cyan
      )
    );
  }

  function tryProbe(x) {
    return [
      ...setProbe(
        x,
        { showTotal: true }
      ),

      ...setStack(
        x,
        { totalLabel: false }
      ),

      ...probeSlider(x),

      ...probeFormula(x)
    ];
  }

  // ================================================================
  // TEMPORARY READING MOVEMENT EXPERIMENT
  //
  // The original dataset remains unchanged.
  //
  // Copy A and B into an explicitly marked Try it example.
  //
  // Original:
  //   A = 2
  //   B = 3
  //
  // Experimental:
  //   A = 2.25
  //   B = 2.75
  //
  // The distance between these readings decreases
  // from 1 to 0.5.
  //
  // Each kernel retains area 1/6.
  //
  // Restore the fixed chapter values after the experiment.
  // ================================================================

  function moveExperimentalReading(
    id,
    x,
    runTime = 0.75
  ) {
    const index = IDS.indexOf(id);

    const values =
      activeValues.slice();

    values[index] = x;

    return [
      new M.Transform(
        readings[id],

        makeReading(
          id,
          x,
          true
        ),

        { runTime }
      ),

      ...updateHills(
        activeBandwidth,
        values,
        'AB',
        runTime
      ),

      ...setDensity(
        activeBandwidth,
        values,
        runTime
      )
    ];
  }

  function restoreOriginalReadings(
    h = BANDWIDTH,
    runTime = 0.8
  ) {
    const animations = DATA.map(d =>
      new M.Transform(
        readings[d.id],

        makeReading(
          d.id,
          d.x
        ),

        { runTime }
      )
    );

    animations.push(
      ...updateHills(
        h,
        VALUES,
        '',
        runTime
      ),

      ...setDensity(
        h,
        VALUES,
        runTime
      )
    );

    return animations;
  }

  // ================================================================
  // 0 — UNDERSTAND WHICH VIBRATION READINGS ARE COMMON
  // ================================================================

  await until(S(0));
  await play(
    new M.FadeIn(machine),

    ...say('WHICH VIBRATION READINGS ARE COMMON?'),

    ...fbox([
      'Observe the workshop machine',
      'Look at its recorded vibrations',
      ['Discover common readings', C.cyan]
    ])
  );

  // ================================================================
  // 1 — SIX READINGS; DO NOT CHOOSE THE NUMBER OF GROUPS
  // ================================================================

  await until(S(1));
  await play(
    new M.FadeIn(introTag),

    ...say('NO NEED TO CHOOSE THE NUMBER OF GROUPS', C.amber),

    ...fbox([
      '6 collected readings',
      'Number of groups not specified',
      ['Let the density picture reveal patterns', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 2 — PLACE THE SIX NORMAL READINGS ON A LINE
  // ================================================================

  await until(S(2));
  await play(
    new M.FadeOut(machine),
    new M.FadeOut(introTag),

    new M.FadeIn(xAxis),

    ...say('THE SAME SIX NORMAL READINGS'),

    ...fbox([
      'Vibration in mm/s',
      'One dot for each observation',
      ['Mode labels hidden', C.muted]
    ])
  );

  // ================================================================
  // 3–8 — REVEAL THE SIX FIXED OBSERVATIONS
  //
  // Short animations for the short spoken number beats.
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
  // 9 — DOTS DO NOT DESCRIBE THE SPACES BETWEEN THEM
  // ================================================================

  const emptyGap = roundedAt(
    point(
      px(5),
      BASE + 0.08
    ),

    XUNIT * 1.30,
    0.57,

    C.amber,
    0.025,
    1.8
  );

  await until(S(9));
  await play(
    ...replaceLayer(
      'annotation',
      emptyGap
    ),

    ...say('WHAT ABOUT THE SPACE BETWEEN READINGS?', C.amber),

    ...fbox([
      'Each dot records one observation',
      'No observation at vibration 5',
      ['What might happen between the dots?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 10 — BUILD A CONTINUOUS PICTURE
  // ================================================================

  await until(S(10));
  await play(
    ...clearLayer('annotation'),

    ...say('FROM SEPARATE DOTS TO A CONTINUOUS PICTURE'),

    ...fbox([
      'We want a continuous picture',
      'Not only isolated observations',
      ['Show where readings tend to gather', C.cyan]
    ])
  );

  // ================================================================
  // 11 — ONE EQUAL PORTION OF SAND PER DOT
  // ================================================================

  await until(S(11));
  await play(
    lag(
      sandPortions.map(obj =>
        new M.FadeIn(obj)
      ),

      1.45,
      0.12
    ),

    ...say('ONE EQUAL PORTION OF SAND PER READING'),

    ...fbox([
      '6 readings',
      '6 equal portions of sand',
      ['Each reading contributes equally', C.cyan]
    ])
  );

  // ================================================================
  // 12 — SPREAD EACH PORTION INTO A TRIANGULAR HILL
  //
  // Every hill is centered at its own observation.
  // ================================================================

  await until(S(12));
  await play(
    ...fadeAll(sandPortions),

    new M.FadeIn(yAxis),

    ...revealHills(BANDWIDTH),

    ...say('ONE TRIANGULAR HILL PER DOT'),

    ...fbox([
      'Spread each portion into a hill',
      'The peak sits over its reading',
      ['6 dots → 6 little hills', C.cyan]
    ])
  );

  // ================================================================
  // 13 — ALL SIX HILLS CONTAIN ALL OUR SAND
  // ================================================================

  await until(S(13));
  await play(
    focusHills('ABCDEF', C.cyan),

    ...say('ALL THE SAND IS STILL HERE'),

    ...fbox([
      'Each reading keeps its portion',
      'No sand is added or removed',
      ['All six hills together', C.cyan]
    ])
  );

  // ================================================================
  // 14 — TOTAL AREA 1; EACH HILL HAS AREA 1/6
  //
  // The six kernels contain equal probability mass.
  // Area is not the same as maximum height.
  // ================================================================

  function makeEqualAreaBar() {
    const width = P ? 5.25 : 3.35;
    const h = 0.27;

    const p = STATUS_POS;

    const left =
      p[0] - width / 2;

    const objects = [];

    for (let i = 0; i < N; i++) {
      const w = width / N;

      const center = point(
        left + (i + 0.5) * w,
        p[1]
      );

      objects.push(
        blockAt(
          center,
          w - 0.015,
          h,
          C.cyan,
          0.76
        ),

        textAt(
          '1/6',
          center,
          P ? 16 : 14,
          '#0F172A',
          true
        )
      );
    }

    objects.push(
      textAt(
        'Total area = 1',

        point(
          p[0],
          p[1] + 0.29
        ),

        P ? 16 : 14,
        C.ink
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(14));
  await play(
    ...replaceLayer(
      'status',
      makeEqualAreaBar()
    ),

    ...say('TOTAL AREA 1 · EACH HILL 1/6'),

    ...fbox([
      '6 equal portions',
      '1 ÷ 6 = 1/6 each',
      ['6 × 1/6 = 1', C.green]
    ], C.green)
  );

  // ================================================================
  // 15 — USE BANDWIDTH TWO
  // ================================================================

  await until(S(15));
  await play(
    ...status('Bandwidth = 2'),

    ...updateHills(
      BANDWIDTH,
      VALUES,
      'B'
    ),

    ...replaceLayer(
      'width',

      makeWidthGuide(
        3,
        BANDWIDTH
      )
    ),

    ...say('USE BANDWIDTH 2'),

    ...fbox([
      ['Bandwidth = 2', C.cyan],
      'Same bandwidth for all six hills',
      'Same area for every hill'
    ])
  );

  // ================================================================
  // 16 — TWO UNITS TO EACH SIDE
  //
  // The kernel centered at 3 reaches from 1 to 5.
  // ================================================================

  await until(S(16));
  await play(
    ...replaceLayer(
      'width',

      makeBothHalfWidths(
        3,
        BANDWIDTH
      )
    ),

    ...say('2 UNITS LEFT · 2 UNITS RIGHT', C.amber),

    ...fbox([
      'Example: kernel B',
      'Center = 3',
      'Left end = 1',
      ['Right end = 5', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 17 — FULL WIDTH FOUR
  // ================================================================

  await until(S(17));
  await play(
    ...replaceLayer(
      'width',

      makeWidthGuide(
        3,
        BANDWIDTH,
        true
      )
    ),

    ...say('FULL WIDTH = 4', C.amber),

    ...fbox([
      'Full width = 2 × bandwidth',
      '           = 2 × 2',
      ['           = 4 units', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 18 — AREA 1/6 AND MAXIMUM HEIGHT 1/12
  //
  // Triangle area = full width × height ÷ 2.
  //
  // 4 × (1/12) ÷ 2 = 1/6.
  // ================================================================

  const maximumHeightGuide =
    new M.VGroup(
      lineAt(
        gp(3),
        gp(3, kernelHeight(BANDWIDTH)),
        C.amber,
        4
      ),

      dashedAt(
        gp(XMIN, kernelHeight(BANDWIDTH)),
        gp(3, kernelHeight(BANDWIDTH)),
        C.amber
      ),

      fittedPill(
        'Height = 1/12',

        C.amber,
        P ? 16 : 15,

        point(
          px(3) + 1.00,
          py(kernelHeight(BANDWIDTH)) + 0.20
        ),

        1.95
      )
    );

  await until(S(18));
  await play(
    ...clearLayer('width'),

    ...replaceLayer(
      'measure',
      maximumHeightGuide
    ),

    ...say('AREA 1/6 · HEIGHT 1/12'),

    ...fbox([
      'Triangle area = width × height ÷ 2',
      '4 × 1/12 ÷ 2',
      ['= 1/6', C.green],
      ['Maximum height = 1/12', C.amber]
    ])
  );

  // ================================================================
  // 19 — NAME THE LITTLE HILLS KERNELS
  // ================================================================

  await until(S(19));
  await play(
    ...clearLayer('measure'),

    ...updateHills(
      BANDWIDTH,
      VALUES
    ),

    ...say('THE LITTLE HILLS ARE CALLED KERNELS'),

    ...fbox([
      ['Kernel', C.cyan],
      'A small density hill',
      'Centered on an observed reading',
      'Here: a triangular shape'
    ])
  );

  // ================================================================
  // 20 — ADD THE HEIGHTS WHERE THE KERNELS OVERLAP
  //
  // Preview a stack at vibration 3.
  // The detailed arithmetic begins at beat 24.
  // ================================================================

  await until(S(20));
  await play(
    ...setProbe(3),

    ...setStack(
      3,
      {
        totalLabel: false
      }
    ),

    ...say('ADD THE HEIGHTS WHERE HILLS OVERLAP'),

    ...fbox([
      'Choose a position on the line',
      'Find each kernel’s height there',
      ['Stack the contributions', C.cyan]
    ])
  );

  // ================================================================
  // 21 — SEVERAL OVERLAPPING HILLS PRODUCE A HIGHER TOTAL
  // ================================================================

  await until(S(21));
  await play(
    ...setDensity(BANDWIDTH),

    new M.Indicate(
      layers.stack,
      { color: C.cyan }
    ),

    ...say('MORE OVERLAP → HIGHER COMBINED HEIGHT'),

    ...fbox([
      'Several kernels contribute',
      'Their heights add together',
      ['The combined height increases', C.cyan]
    ])
  );

  // ================================================================
  // 22 — FEWER CONTRIBUTIONS PRODUCE A LOWER TOTAL
  //
  // Move the probe to vibration 5.
  // This previews the lower part between the peaks.
  // ================================================================

  await until(S(22));
  await play(
    ...setProbe(
      5,
      { showTotal: true }
    ),

    ...setStack(5),

    ...say('FEWER CONTRIBUTIONS → LOWER HEIGHT'),

    ...fbox([
      'Between the two gatherings',
      'Fewer kernels contribute',
      ['Lower combined density', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 23 — INTRODUCE KERNEL DENSITY ESTIMATION
  // ================================================================

  await until(S(23));
  await play(
    ...clearLayers(
      'probe',
      'stack'
    ),

    new M.Indicate(
      combinedCurve,
      { color: C.cyan }
    ),

    ...say('KERNEL DENSITY ESTIMATION'),

    ...fbox([
      ['Kernel density estimation', C.cyan],
      'KDE for short',
      'One kernel per reading',
      'Add their heights'
    ])
  );

  // ================================================================
  // 24 — WORK OUT THE COMBINED HEIGHT AT VIBRATION THREE
  //
  // Hide the earlier preview curve so the result is
  // rebuilt from the individual contributions.
  // ================================================================

  await until(S(24));
  await play(
    new M.FadeOut(combinedCurve),

    focusReadings('B', C.amber),

    ...say('WORK OUT THE DENSITY AT 3', C.amber),

    ...fbox([
      ['Chosen position: x = 3', C.amber],
      'Find the six kernel contributions',
      'Then add them'
    ], C.amber)
  );

  combinedCurve = null;

  // ================================================================
  // 25 — DRAW THE VERTICAL LINE AT THREE
  // ================================================================

  await until(S(25));
  await play(
    ...setProbe(3),

    ...say('DRAW A VERTICAL LINE AT 3'),

    ...fbox([
      'One selected horizontal position',
      ['x = 3', C.amber],
      'Measure every hill at this line'
    ])
  );

  // ================================================================
  // 26 — KERNEL A REACHES THE LINE AT HALF ITS MAXIMUM
  //
  // A is centered at 2.
  // Distance from center to x = 3 is 1.
  // Bandwidth = 2.
  //
  // Remaining height fraction = 1 - 1/2 = 1/2.
  // ================================================================

  await until(S(26));
  await play(
    ...updateHills(
      BANDWIDTH,
      VALUES,
      'A'
    ),

    ...measureContribution('A', 3),

    ...say('KERNEL A: HALF ITS MAXIMUM HEIGHT', BLUE),

    ...fbox([
      'A is centered at 2',
      'Distance to 3 = 1',
      'Halfway to the kernel edge',
      ['Half the maximum height', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 27 — CONTRIBUTION FROM A = 1/24
  // ================================================================

  await until(S(27));
  await play(
    new M.Indicate(
      layers.measure,
      { color: BLUE }
    ),

    ...say('A CONTRIBUTES 1/24', BLUE),

    ...fbox([
      'Maximum height = 1/12',
      'Half of 1/12',
      [
        `A = ${fraction(AT3[0].value)}`,
        BLUE
      ]
    ], BLUE)
  );

  // ================================================================
  // 28 — CONTRIBUTION FROM B = 1/12
  //
  // The selected position is exactly the kernel center.
  // Therefore B contributes its full maximum height.
  // ================================================================

  await until(S(28));
  await play(
    ...updateHills(
      BANDWIDTH,
      VALUES,
      'B'
    ),

    ...measureContribution('B', 3),

    ...say('B CONTRIBUTES ITS FULL HEIGHT: 1/12'),

    ...fbox([
      'B is centered at 3',
      'Distance to 3 = 0',
      [
        `B = ${fraction(AT3[1].value)}`,
        STACK_COLORS[1]
      ]
    ])
  );

  // ================================================================
  // 29 — CONTRIBUTION FROM C = 1/24
  // ================================================================

  await until(S(29));
  await play(
    ...updateHills(
      BANDWIDTH,
      VALUES,
      'C'
    ),

    ...measureContribution('C', 3),

    ...say('C ALSO CONTRIBUTES 1/24', PURPLE),

    ...fbox([
      'C is centered at 4',
      'Distance to 3 = 1',
      'Half its maximum height',
      [
        `C = ${fraction(AT3[2].value)}`,
        PURPLE
      ]
    ], PURPLE)
  );

  // ================================================================
  // 30 — D, E AND F CONTRIBUTE ZERO
  //
  // Their left endpoints are at 4, 5 and 6.
  // None reaches x = 3.
  // ================================================================

  await until(S(30));
  await play(
    ...clearLayer('measure'),

    ...updateHills(
      BANDWIDTH,
      VALUES,
      'DEF'
    ),

    ...say('D, E AND F CONTRIBUTE ZERO', C.muted),

    ...fbox([
      'D begins at 4 → contribution 0',
      'E begins at 5 → contribution 0',
      'F begins at 6 → contribution 0',
      ['None reaches x = 3', C.muted]
    ], C.muted)
  );

  // ================================================================
  // 31 — DRAW THE THREE CONTRIBUTIONS AND STACK THEM
  //
  // Initially display the blocks separately.
  // Then move them into one vertical stack.
  // No block changes height.
  // ================================================================

  await until(S(31));
  await play(
    ...clearLayer('probe'),

    ...updateHills(
      BANDWIDTH,
      VALUES
    ),

    ...revealSeparateBlocks(3),

    ...say('STACK THE THREE CONTRIBUTIONS'),

    ...fbox([
      ['A = 1/24', STACK_COLORS[0]],
      ['B = 1/12', STACK_COLORS[1]],
      ['C = 1/24', STACK_COLORS[2]],
      'Add their heights'
    ])
  );

  await play(
    ...stackMovableBlocks(3)
  );

  // ================================================================
  // 32 — ONE TWELFTH EQUALS TWO TWENTY-FOURTHS
  //
  // Replace the middle B block with two equal 1/24 blocks.
  //
  // Its total height stays exactly the same.
  // ================================================================

  await until(S(32));
  await play(
    ...clearMovableBlocks(),

    ...setStack(
      3,
      {
        splitUnits: true,
        totalLabel: false
      }
    ),

    ...say('1/12 = 2/24'),

    ...fbox([
      'A = 1/24',
      ['B = 2/24', STACK_COLORS[1]],
      'C = 1/24',
      'Four equal small blocks'
    ])
  );

  // ================================================================
  // 33 — FOUR TWENTY-FOURTHS EQUAL ONE SIXTH
  //
  // 1/24 + 2/24 + 1/24 = 4/24 = 1/6.
  // ================================================================

  await until(S(33));
  await play(
    ...setStack(
      3,
      {
        splitUnits: true,
        totalLabel: true
      }
    ),

    ...say('4/24 = 1/6', C.green),

    ...fbox([
      '1/24 + 2/24 + 1/24',
      '= 4/24',
      [
        `= ${fraction(DENSITY_3)}`,
        C.green
      ],
      [
        `Density at 3 ≈ ${fmt(DENSITY_3)}`,
        C.cyan
      ]
    ], C.green)
  );

  // ================================================================
  // 34 — MOVE THE VERTICAL LINE TO VIBRATION FIVE
  // ================================================================

  await until(S(34));
  await play(
    ...clearLayer('stack'),

    ...setProbe(5),

    ...say('NOW MOVE THE LINE TO 5', C.amber),

    ...fbox([
      ['New position: x = 5', C.amber],
      'Same six kernels',
      'Same bandwidth and areas'
    ], C.amber)
  );

  // ================================================================
  // 35 — ONLY C AND D HAVE POSITIVE HEIGHT AT FIVE
  //
  // B and E reach x = 5 at their endpoints,
  // where their kernel heights are exactly zero.
  //
  // A and F do not reach x = 5.
  // ================================================================

  await until(S(35));
  await play(
    ...updateHills(
      BANDWIDTH,
      VALUES,
      'CD'
    ),

    ...say('ONLY C AND D CONTRIBUTE AT 5'),

    ...fbox([
      'C is centered at 4',
      'D is centered at 6',
      'Both are 1 unit from 5',
      ['A, B, E and F contribute 0', C.muted]
    ])
  );

  // ================================================================
  // 36 — EACH CONTRIBUTES ONE TWENTY-FOURTH
  // ================================================================

  await until(S(36));
  await play(
    ...clearLayer('probe'),

    ...setStack(
      5,
      {
        totalLabel: false
      }
    ),

    ...say('C AND D EACH CONTRIBUTE 1/24'),

    ...fbox([
      [
        `C = ${fraction(AT5[2].value)}`,
        STACK_COLORS[2]
      ],

      [
        `D = ${fraction(AT5[3].value)}`,
        STACK_COLORS[3]
      ],

      'Two equal contribution blocks'
    ])
  );

  // ================================================================
  // 37 — TWO TWENTY-FOURTHS EQUAL ONE TWELFTH
  // ================================================================

  await until(S(37));
  await play(
    ...setStack(
      5,
      {
        splitUnits: true,
        totalLabel: true
      }
    ),

    ...say('2/24 = 1/12', C.green),

    ...fbox([
      '1/24 + 1/24',
      '= 2/24',
      [
        `= ${fraction(DENSITY_5)}`,
        C.green
      ],
      [
        `Density at 5 ≈ ${fmt(DENSITY_5)}`,
        C.cyan
      ]
    ], C.green)
  );

  // ================================================================
  // 38 — THE CURVE IS TWICE AS HIGH AT THREE AS AT FIVE
  //
  // Show both exact heights on one common density axis.
  // ================================================================

  await until(S(38));
  await play(
    ...clearLayer('stack'),

    ...updateHills(
      BANDWIDTH,
      VALUES
    ),

    ...setDensity(BANDWIDTH),

    ...replaceLayer(
      'annotation',
      makePeakValleyComparison()
    ),

    ...say('THE HEIGHT AT 3 IS TWICE THE HEIGHT AT 5'),

    ...fbox([
      [
        `At 3: ${fraction(DENSITY_3)}`,
        C.cyan
      ],

      [
        `At 5: ${fraction(DENSITY_5)}`,
        C.amber
      ],

      '(1/6) ÷ (1/12) = 2',

      ['Twice the density height', C.green]
    ], C.green)
  );

  // ================================================================
  // 39 — REPEAT THE ADDITION AT EVERY POSITION
  //
  // Move the evaluation probe along the continuous curve.
  // Every displayed stack uses the exact contributions
  // at its current horizontal position.
  // ================================================================

  await until(S(39));
  await play(
    ...clearLayer('annotation'),

    ...setProbe(
      1,
      { showTotal: true }
    ),

    ...setStack(1),

    ...say('ADD THE HEIGHTS AT EVERY POSITION'),

    ...fbox([
      'Choose a position x',
      'Evaluate all six kernels',
      'Add their contributions',
      ['Repeat along the entire line', C.cyan]
    ])
  );

  for (const x of [2, 3, 5, 7, 9]) {
    const olds = ['probe', 'stack']
      .filter(k => layers[k])
      .map(k => {
        const o = layers[k];
        delete layers[k];
        return new M.FadeOut(o, { runTime: 0.25 });
      });

    if (olds.length) {
      await play(...olds);
    }

    await play(
      ...setProbe(
        x,
        { showTotal: true }
      ),

      ...setStack(x)
    );
  }

  // ================================================================
  // 40 — TOTAL AREA UNDER THE CURVE IS STILL ONE
  //
  // Integration distributes over the sum:
  //
  // Integral of sum of kernels
  // = sum of individual kernel integrals
  // = 6 × 1/6
  // = 1.
  // ================================================================

  await until(S(40));
  await play(
    ...clearLayers(
      'probe',
      'stack'
    ),

    ...replaceLayer(
      'area',

      makeAreaShading(
        BANDWIDTH,
        VALUES
      )
    ),

    ...status(
      'Total density area = 1',
      C.green
    ),

    ...say('THE TOTAL AREA IS STILL ONE', C.green),

    ...fbox([
      'Each kernel has area 1/6',
      'Six kernels contribute',
      [
        `Combined area = ${Number(
          exactArea(BANDWIDTH).toFixed(10)
        )}`,
        C.green
      ],
      'No sand added or removed'
    ], C.green)
  );

  // ================================================================
  // 41 — INTRODUCE THE GENERAL FORMULA
  // ================================================================

  await until(S(41));
  await play(
    ...clearLayer('area'),

    ...status('Bandwidth = 2'),

    ...say('WRITE THE DENSITY CALCULATION'),

    ...fbox([
      'At a chosen position',
      'Find every kernel height',
      ['Add all contributions', C.cyan]
    ])
  );

  // ================================================================
  // 42 — ESTIMATED DENSITY IS THE SUM OF ALL CONTRIBUTIONS
  //
  // This formula uses normalized individual kernels.
  //
  // The factor 1/N is already included in each kernel's
  // height and area, so do not divide the sum by N again.
  // ================================================================

  await until(S(42));
  await play(
    ...setProbe(
      3,
      { showTotal: true }
    ),

    ...setStack(
      3,
      {
        splitUnits: true,
        totalLabel: false
      }
    ),

    ...say('ESTIMATED DENSITY = SUM OF CONTRIBUTIONS'),

    ...fbox([
      ['Estimated density at x =', C.cyan],
      'A(x) + B(x) + C(x)',
      '+ D(x) + E(x) + F(x)',
      'Each kernel has area 1/6'
    ])
  );

  // ================================================================
  // 43 — WHY IT IS CALLED AN ESTIMATE
  //
  // The curve describes possible future observations
  // using the six collected readings.
  //
  // It is not a guarantee of future vibration values.
  // ================================================================

  await until(S(43));
  await play(
    ...clearLayers(
      'probe',
      'stack'
    ),

    ...say('AN ESTIMATE FROM COLLECTED READINGS'),

    ...fbox([
      'Use observations already collected',
      'Estimate future reading patterns',
      ['Not a guarantee of future values', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 44 — UNLIKE GAUSSIAN MIXTURES, NO CHOSEN GROUP COUNT
  //
  // Gaussian mixtures choose a number of components.
  // KDE places one kernel over each observed reading.
  //
  // The six kernels are not six learned operating modes.
  // ================================================================

  await until(S(44));
  await play(
    focusHills('ABCDEF', C.cyan),

    ...say('KDE DOES NOT REQUIRE A CHOSEN GROUP COUNT'),

    ...fbox([
      'Gaussian mixture:',
      'choose a number of components',
      ['KDE: one kernel per reading', C.cyan],
      'Number of peaks can emerge'
    ])
  );

  // ================================================================
  // 45 — DISCOVER GATHERINGS, GAPS AND LESS COMMON REGIONS
  //
  // Bandwidth 2:
  //
  // Peak at 3 = 1/6.
  // Peak at 7 = 1/6.
  // Valley at 5 = 1/12.
  // ================================================================

  await until(S(45));
  await play(
    ...replaceLayer(
      'annotation',
      makeTwoPeaks()
    ),

    ...say('DISCOVER GATHERINGS AND GAPS'),

    ...fbox([
      ['Peaks at 3 and 7', C.cyan],
      ['Lower density at 5', C.amber],
      'Explore where readings gather',
      'And where they are less common'
    ])
  );

  // ================================================================
  // 46 — CHANGING BANDWIDTH CAN CREATE OR HIDE PEAKS
  //
  // Keep all observations fixed.
  //
  // h = 0.5: six separate peaks.
  // h = 6: one broad hill with a flat top.
  //
  // Restore h = 2 before continuing.
  // ================================================================

  await until(S(46));
  await play(
    ...clearLayer('annotation'),

    ...updateHills(
      NARROW,
      VALUES,
      '',
      0.90
    ),

    ...setDensity(
      NARROW,
      VALUES,
      0.90
    ),

    ...status(
      'Bandwidth = 0.5',
      C.amber
    ),

    ...replaceLayer(
      'annotation',
      makeNarrowPeakMarkers()
    ),

    ...say('BANDWIDTH CAN CREATE OR HIDE PEAKS', C.amber),

    ...fbox([
      ['Bandwidth 0.5', C.amber],
      'Six narrow peaks',
      'Same six observations'
    ], C.amber)
  );

  await play(
    ...updateHills(
      WIDE,
      VALUES,
      '',
      0.90
    ),

    ...setDensity(
      WIDE,
      VALUES,
      0.90
    ),

    ...status(
      'Bandwidth = 6',
      C.amber
    ),

    ...replaceLayer(
      'annotation',
      makeWideFlatTop()
    ),

    ...fbox([
      ['Bandwidth 6', C.amber],
      'One broad, flat-topped hill',
      'The observations have not moved'
    ], C.amber)
  );

  // ================================================================
  // 47 — LOW DENSITY DOES NOT NECESSARILY MEAN A FAULT
  //
  // Restore the main bandwidth-2 density estimate.
  //
  // Highlight the valley without claiming it indicates
  // a confirmed machine problem.
  // ================================================================

  await until(S(47));
  await play(
    ...clearLayer('annotation'),

    ...updateHills(
      BANDWIDTH,
      VALUES
    ),

    ...setDensity(
      BANDWIDTH,
      VALUES
    ),

    ...status('Bandwidth = 2'),

    ...replaceLayer(
      'annotation',

      makeDensityMarker(
        5,
        BANDWIDTH,
        VALUES,
        C.amber,
        'Lower density'
      )
    ),

    ...say('LOW DENSITY DOES NOT PROVE A FAULT', C.amber),

    ...fbox([
      'A reading may be less common',
      'Without indicating damage',
      ['Investigate before deciding', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 48 — TRY IT: DRAG THE VERTICAL LINE
  //
  // Show all six contributions in the formula box.
  // Moving the probe does not move the observations.
  // ================================================================

  await until(S(48));
  await play(
    ...clearLayer('annotation'),

    ...tryProbe(2),

    ...say('TRY IT: DRAG THE VERTICAL LINE')
  );

  await play(
    ...tryProbe(4)
  );

  // ================================================================
  // 49 — FIND A POSITION WITH DENSITY EXACTLY ONE SIXTH
  //
  // Vibration 3 is one exact solution.
  // Vibration 7 is another.
  // ================================================================

  await until(S(49));
  await play(
    ...tryProbe(3),

    ...say('FIND DENSITY EXACTLY 1/6', C.green)
  );

  await play(
    ...fbox([
      'At vibration 3',
      '1/24 + 1/12 + 1/24',
      ['= 1/6 exactly', C.green],
      'Vibration 7 also gives 1/6'
    ], C.green)
  );

  // ================================================================
  // 50 — FIND THE LOW POINT BETWEEN THE PEAKS
  //
  // Vibration 5 has density exactly 1/12.
  // ================================================================

  await until(S(50));
  await play(
    ...tryProbe(5),

    ...say('FIND THE VALLEY: 1/12', C.amber)
  );

  await play(
    ...fbox([
      'At vibration 5',
      'C contributes 1/24',
      'D contributes 1/24',
      ['Total = 1/12 exactly', C.green]
    ], C.green)
  );

  // ================================================================
  // 51 — PREDICT WHAT HAPPENS IF TWO READINGS MOVE CLOSER
  //
  // Start a temporary experiment using a copy of the
  // six vibration values.
  //
  // Keep the official chapter data unchanged.
  //
  // A and B will move from 2 and 3 to 2.25 and 2.75.
  // Their separation will decrease from 1 to 0.5.
  //
  // Examine the combined height at x = 2.5.
  // ================================================================

  const originalExperimentHeight =
    density(
      2.5,
      BANDWIDTH,
      VALUES
    );

  const movedExperimentHeight =
    density(
      2.5,
      BANDWIDTH,
      EXPERIMENT_VALUES
    );

  await until(S(51));
  await play(
    ...clearLayers(
      'probe',
      'stack',
      'control'
    ),

    ...status(
      'Try it · Temporary data copy',
      PURPLE
    ),

    ...updateHills(
      BANDWIDTH,
      VALUES,
      'AB'
    ),

    ...setProbe(
      2.5,
      { showTotal: true }
    ),

    ...say('PREDICT: MOVE TWO READINGS CLOSER', C.amber),

    ...fbox([
      'Temporary experiment: A and B',
      'Current separation = 1',
      [
        `At 2.5: ${fmt(originalExperimentHeight)}`,
        C.cyan
      ],
      ['What will happen to their overlap?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 52 — TEST THE PREDICTION, THEN CHANGE THE BANDWIDTH
  //
  // Move A, then B, in separate sequential animations.
  //
  // Original combined density at x = 2.5:
  // 7/48 ≈ 0.1458.
  //
  // Experimental combined density at x = 2.5:
  // 1/6 ≈ 0.1667.
  //
  // The overlap increases.
  //
  // Restore the original observations before the bandwidth
  // slider demonstration.
  // ================================================================

  await until(S(52));
  await play(
    ...clearLayer('probe'),

    ...moveExperimentalReading(
      'A',
      2.25,
      0.65
    ),

    ...say('TEST: BRING THE TWO KERNELS CLOSER', PURPLE)
  );

  await play(
    ...moveExperimentalReading(
      'B',
      2.75,
      0.65
    ),

    ...setProbe(
      2.5,
      { showTotal: true }
    ),

    ...fbox([
      'Temporary positions: 2.25, 2.75',
      'Separation = 0.5',
      [
        `Before: ${fmt(originalExperimentHeight)}`,
        C.muted
      ],
      [
        `After:  ${fmt(movedExperimentHeight)}`,
        C.green
      ],
      'Greater overlap here'
    ], C.green)
  );

  await play(
    ...clearLayer('probe'),

    ...restoreOriginalReadings(
      NARROW,
      0.75
    ),

    ...status(
      'Original readings restored'
    ),

    ...bandwidthSlider(NARROW),

    ...say('NOW EXPLORE DIFFERENT HILL WIDTHS'),

    ...fbox([
      'Original readings restored',
      ['Bandwidth 0.5', C.amber],
      'Narrower hills, more detail'
    ], C.amber)
  );

  await play(
    ...updateHills(
      WIDE,
      VALUES,
      '',
      0.85
    ),

    ...setDensity(
      WIDE,
      VALUES,
      0.85
    ),

    ...bandwidthSlider(WIDE),

    ...fbox([
      ['Bandwidth 6', C.amber],
      'Wider hills, less detail',
      'Each kernel area remains 1/6'
    ], C.amber)
  );

  // ================================================================
  // 53 — NEW DATA IN THE SEPARATE TRY IT ACTIVITY
  //
  // Illustrate the New data control.
  //
  // Fresh data generation belongs to the actual simulation.
  // Do not silently replace the chapter's fixed dataset.
  // ================================================================

  const newDataButton = fittedPill(
    'New data',

    PURPLE,
    P ? 18 : 16,

    CONTROL_POS,

    2.15
  );

  await until(S(53));
  await play(
    ...replaceLayer(
      'control',
      newDataButton
    ),

    ...updateHills(
      BANDWIDTH,
      VALUES
    ),

    ...setDensity(
      BANDWIDTH,
      VALUES
    ),

    ...status('Bandwidth = 2'),

    ...say('NEW DATA · BUILD ANOTHER DENSITY CURVE', PURPLE),

    ...fbox([
      ['Press New data in Try it', PURPLE],
      'Use a fresh collection of readings',
      'Place one kernel over each',
      'Add their heights again'
    ], PURPLE)
  );

  // ================================================================
  // 54 — FINAL TAKEAWAY
  //
  // Restore the fixed chapter example:
  //
  // Readings: 2, 3, 4, 6, 7, 8.
  // Bandwidth: 2.
  // Individual kernel area: 1/6.
  // Individual maximum height: 1/12.
  //
  // Combined peaks:
  //   density at 3 = 1/6
  //   density at 7 = 1/6
  //
  // Combined valley:
  //   density at 5 = 1/12
  //
  // Total combined area = 1.
  //
  // KDE reveals where observations gather without requiring
  // a chosen number of groups.
  // ================================================================

  await until(S(54));
  await play(
    ...clearLayers(
      'control',
      'probe',
      'stack',
      'measure',
      'width',
      'area'
    ),

    ...replaceLayer(
      'annotation',
      makeTwoPeaks()
    ),

    ...status(
      'Bandwidth 2 · Total area 1',
      C.green
    ),

    new M.Indicate(
      combinedCurve,
      { color: C.cyan }
    ),

    ...say(
      'ONE KERNEL PER READING · ADD THEIR HEIGHTS',
      C.green
    ),

    ...fbox([
      ['Kernel density estimation', C.cyan],
      '1. Place one hill over each reading',
      '2. Keep equal kernel areas',
      '3. Add heights at each position',
      ['Reveal where readings gather', C.green]
    ], C.green)
  );
}
