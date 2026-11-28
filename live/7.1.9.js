// lesson 7.1.9
// Equivalence testing: showing that a difference is small enough.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter data:
//   Target = 500 g.
//   Known individual bottle SD = 4 g.
//   Equivalence tolerance = ±3 g, fixed before collecting data.
//   Lower bound = 497 g.
//   Upper bound = 503 g.
//
// After repair:
//   n = 16; observed mean = 500.5 g; SE = 1 g.
//
// Equivalence hypotheses:
//   H₀: mean ≤ 497 OR mean ≥ 503.
//   H₁: 497 < mean < 503.
//
// Two one-sided tests (TOST):
//   Lower test: z = (500.5 - 497) / 1 = +3.5.
//               One-sided p ≈ 0.0002.
//   Upper test: z = (500.5 - 503) / 1 = -2.5.
//               One-sided p ≈ 0.006.
//   Both p-values < 0.05: equivalence demonstrated.
//
// Equivalent confidence-interval method:
//   90% CI = mean ± 1.6448536 × SE.
//   n = 16: approximately [498.86, 502.14].
//   Entire interval inside [497, 503]: equivalence demonstrated.
//
// Trap:
//   n = 4; same observed mean = 500.5 g; SE = 2 g.
//   Ordinary two-sided test against 500 g:
//      z = 0.25; p ≈ 0.80.
//   90% CI ≈ [497.21, 503.79].
//   Interval extends beyond 503: equivalence not demonstrated.
//
// Equivalence is a statistical conclusion at the chosen
// significance level, not absolute proof of the true mean.
// The tolerance bounds apply to the long-run mean, not to
// every individual bottle.
//
// Bottle fill differences are exaggerated for visibility.
// All numerical axes and confidence-interval lengths are
// proportional. Confidence intervals retain full precision
// internally, with rounded values used for display.
//
// Browser rendering and narration synchronization have not been
// runtime-tested against site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Approved responsive layout.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.62, 0] : [4.3, -0.3, 0];

  const BASE = P ? -3.40 : -1.85;
  const CY = P ? -1.15 : -0.45;
  const W = P ? 6.55 : 7.05;

  const GOLD = C.amber;
  const RED = C.red || '#ff647c';

  const TARGET = 500;
  const SD = 4;

  const TOL = 3;
  const LOWER = TARGET - TOL;
  const UPPER = TARGET + TOL;

  const ALPHA = 0.05;
  const MEAN = 500.5;

  const N16 = 16;
  const N4 = 4;

  const SE16 = SD / Math.sqrt(N16);
  const SE4 = SD / Math.sqrt(N4);

  const Q90 = 1.6448536269514722;

  const Z_LOWER = (MEAN - LOWER) / SE16;
  const Z_UPPER = (MEAN - UPPER) / SE16;

  const Z_ORDINARY = (MEAN - TARGET) / SE4;

  const P_LOWER = 0.000232629079;
  const P_UPPER = 0.006209665326;
  const P_ORDINARY = 0.802587348634;

  const CI16 = [
    MEAN - Q90 * SE16,
    MEAN + Q90 * SE16
  ];

  const CI4 = [
    MEAN - Q90 * SE4,
    MEAN + Q90 * SE4
  ];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const signed = v =>
    v > 0 ? `+${v}` : String(v);

  const group = (...items) =>
    new M.VGroup(...items);

  // ------------------------------------------------------------
  // Primitive drawing helpers.
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function rect(
    x, y, w, h,
    color = C.cyan,
    fill = C.card,
    opacity = 0.95,
    radius = 0.15
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function block(
    x, y, w, h,
    color,
    opacity = 0.85
  ) {
    const r = new M.Rectangle({
      width: Math.max(0.001, w),
      height: Math.max(0.001, h),
      color,
      strokeWidth: 0
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.cyan,
    sw = 3
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    const h = Math.min(
      0.15,
      Math.hypot(x2 - x1, y2 - y1) * 0.4
    );

    const d = Math.PI / 6;

    return group(
      line(x1, y1, x2, y2, color, sw),

      line(
        x2, y2,
        x2 - h * Math.cos(a - d),
        y2 - h * Math.sin(a - d),
        color, sw
      ),

      line(
        x2, y2,
        x2 - h * Math.cos(a + d),
        y2 - h * Math.sin(a + d),
        color, sw
      )
    );
  }

  function dot(
    x, y,
    color = C.cyan,
    radius = 0.095,
    opacity = 1
  ) {
    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.095
  ) {
    return group(
      dot(x, y, color, radius * 2.1, 0.14),
      dot(x, y, color, radius, 1)
    );
  }

  function tag(
    s, color,
    x, y,
    maxw = W
  ) {
    const p = pill(s, color);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function heading(s, color = C.ink) {
    return txt(
      s,
      P ? 23 : 22,
      color,
      CX,
      P ? 1.05 : 1.12
    );
  }

  function bracket(
    x1, x2, y,
    label,
    color = GOLD,
    above = true,
    maxw = null
  ) {
    return group(
      line(x1, y, x2, y, color, 3),

      line(
        x1, y - 0.09,
        x1, y + 0.09,
        color, 2
      ),

      line(
        x2, y - 0.09,
        x2, y + 0.09,
        color, 2
      ),

      txt(
        label,
        18,
        color,
        (x1 + x2) / 2,
        y + (above ? 0.28 : -0.28),
        true,
        maxw || Math.max(
          1.20,
          Math.abs(x2 - x1) + 0.25
        )
      )
    );
  }

  function checkMark(
    x, y,
    s = 1,
    color = C.green
  ) {
    return group(
      line(
        x - 0.26 * s,
        y,
        x - 0.06 * s,
        y - 0.20 * s,
        color, 4
      ),

      line(
        x - 0.06 * s,
        y - 0.20 * s,
        x + 0.31 * s,
        y + 0.28 * s,
        color, 4
      )
    );
  }

  function crossMark(
    x, y,
    s = 1,
    color = RED
  ) {
    return group(
      line(
        x - 0.21 * s,
        y - 0.21 * s,
        x + 0.21 * s,
        y + 0.21 * s,
        color, 4
      ),

      line(
        x - 0.21 * s,
        y + 0.21 * s,
        x + 0.21 * s,
        y - 0.21 * s,
        color, 4
      )
    );
  }

  // ------------------------------------------------------------
  // Scene layers.
  // All groups are assembled before being shown.
  // No already-visible objects are regrouped.
  // Helpers return animations for a single awaited play().
  // ------------------------------------------------------------

  const layers = new Map();

  function put(key, obj) {
    const a = [];

    if (layers.has(key)) {
      a.push(new M.FadeOut(layers.get(key)));
    }

    layers.set(key, obj);
    a.push(new M.FadeIn(obj));

    return a;
  }

  function drop(...keys) {
    const a = [];

    for (const key of keys) {
      if (!layers.has(key)) continue;

      a.push(new M.FadeOut(layers.get(key)));
      layers.delete(key);
    }

    return a;
  }

  function clear() {
    const a = Array.from(layers.values()).map(
      obj => new M.FadeOut(obj)
    );

    layers.clear();

    return a;
  }

  function scene(entries) {
    const a = clear();

    for (const [key, obj] of entries) {
      layers.set(key, obj);
      a.push(new M.FadeIn(obj));
    }

    return a;
  }

  function indicate(key, color = GOLD) {
    if (!layers.has(key)) return [];

    return [
      new M.Indicate(
        layers.get(key),
        { color }
      )
    ];
  }

  // ------------------------------------------------------------
  // Formula box: approved reference style.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(
      l => Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) => T(s.trimStart(), size, c, true)
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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.2 - lh / 2;

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

    const g = group(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.85 : 3.5;

    const factor = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (factor < 1) {
      g.scale(factor);
    }

    g.moveTo(BOXP);

    return put('formula', g);
  }

  // ------------------------------------------------------------
  // Shared glowing juice bottle and weighing scale.
  // ------------------------------------------------------------

  function bottle(
    x, y,
    s = 1,
    fill = 0.72,
    label = '',
    color = C.cyan
  ) {
    const w = 0.56 * s;
    const h = 1.12 * s;

    const halo = rect(
      x, y,
      w + 0.12 * s,
      h + 0.10 * s,
      color, color, 0.07,
      0.13 * s
    );

    const body = rect(
      x, y,
      w, h,
      color, C.card, 0.30,
      0.10 * s
    );

    const innerH = h - 0.12 * s;
    const juiceH = innerH * fill;

    const juice = new M.RoundedRectangle({
      width: w - 0.10 * s,
      height: juiceH,
      cornerRadius: 0.06 * s,
      color,
      strokeWidth: 1
    });

    juice.setFill(color, 0.65);

    juice.moveTo([
      x,
      y - innerH / 2 + juiceH / 2,
      0
    ]);

    const neck = rect(
      x,
      y + h / 2 + 0.065 * s,
      0.25 * s,
      0.15 * s,
      color, C.card, 0.90,
      0.035 * s
    );

    const cap = rect(
      x,
      y + h / 2 + 0.19 * s,
      0.34 * s,
      0.12 * s,
      color, color, 0.95,
      0.025 * s
    );

    const parts = [
      halo, body, juice, neck, cap
    ];

    if (label) {
      parts.push(
        block(
          x,
          y - 0.06 * s,
          0.48 * s,
          0.24 * s,
          C.card, 0.95
        ),

        txt(
          label,
          Math.max(9, 13 * s),
          C.ink,
          x,
          y - 0.06 * s,
          true,
          0.40 * s
        )
      );
    }

    return group(...parts);
  }

  function scale(
    x, y,
    s = 1,
    display = '? g'
  ) {
    return group(
      rect(
        x, y,
        1.55 * s, 0.72 * s,
        C.cyan, C.card, 0.95,
        0.12 * s
      ),

      rect(
        x,
        y + 0.44 * s,
        1.85 * s, 0.15 * s,
        C.muted, C.card, 1,
        0.05 * s
      ),

      rect(
        x,
        y,
        1.12 * s,
        0.36 * s,
        C.muted, C.card, 1,
        0.06 * s
      ),

      txt(
        display,
        19 * s,
        GOLD,
        x, y,
        true,
        1.00 * s
      )
    );
  }

  function tray(
    x, y,
    count = 16,
    cols = 4,
    s = 1,
    color = C.cyan
  ) {
    const rows = Math.ceil(count / cols);

    const dx = 0.52 * s;
    const dy = 0.51 * s;

    const w = cols * dx + 0.37 * s;
    const h = rows * dy + 0.31 * s;

    const parts = [
      rect(
        x, y,
        w, h,
        color, C.card, 0.85,
        0.12 * s
      )
    ];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      parts.push(
        bottle(
          x + (col - (cols - 1) / 2) * dx,

          y +
            ((rows - 1) / 2 - row) * dy -
            0.04 * s,

          0.32 * s,
          0.65 + ((i * 7 + 2) % 5) * 0.035,
          '',
          color
        )
      );
    }

    parts.push(
      txt(
        `${count} BOTTLES`,
        Math.max(13, 18 * s),
        color,
        x,
        y + h / 2 + 0.28,
        true,
        w + 0.55
      )
    );

    return group(...parts);
  }

  function person(
    x, y,
    s = 1,
    color = C.cyan
  ) {
    const head = new M.Circle({
      radius: 0.24 * s,
      color: C.ink
    });

    head.setFill(C.ink, 0.90);

    head.moveTo([
      x,
      y + 0.36 * s,
      0
    ]);

    const body = new M.Arc({
      radius: 0.45 * s,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);

    body.moveTo([
      x,
      y - 0.22 * s,
      0
    ]);

    return group(head, body);
  }

  // ------------------------------------------------------------
  // Opening: the repaired filling machine.
  // Its true mean is not yet known.
  // ------------------------------------------------------------

  function repairedMachine() {
    const x = CX;
    const y = P ? -0.70 : -0.30;

    const tx = x - 1.85;
    const beltY = y - 1.50;
    const by = beltY + 0.64;

    const parts = [
      rect(
        tx,
        y + 0.72,
        1.50,
        0.90,
        C.cyan, C.card, 0.95
      ),

      txt(
        'JUICE',
        19, C.cyan,
        tx,
        y + 0.72,
        true
      ),

      rect(
        tx,
        y + 0.05,
        0.24,
        0.40,
        C.muted, C.card, 1,
        0.04
      ),

      line(
        tx,
        y - 0.15,
        tx,
        y - 0.30,
        C.cyan,
        5
      ),

      line(
        tx - 1.0,
        y + 0.76,
        tx - 1.0,
        beltY,
        C.muted,
        4
      ),

      line(
        tx - 1.0,
        y + 0.76,
        tx - 0.78,
        y + 0.76,
        C.muted,
        4
      ),

      rect(
        x,
        beltY,
        6.10,
        0.22,
        C.muted, C.card, 1,
        0.06
      )
    ];

    for (let i = 0; i < 4; i++) {
      parts.push(
        bottle(
          tx + i * 1.25,
          by,
          0.82,
          [0.71, 0.76, 0.68, 0.73][i],
          '500 g'
        )
      );
    }

    for (let i = 0; i < 9; i++) {
      parts.push(
        dot(
          x - 2.68 + i * 0.67,
          beltY,
          C.muted,
          0.055,
          0.45
        )
      );
    }

    parts.push(
      checkMark(
        x + 1.28,
        y + 0.84,
        1.1
      ),

      txt(
        'REPAIR COMPLETE',
        19, C.green,
        x + 1.25,
        y + 0.33,
        true,
        3.15
      ),

      txt(
        'True mean: still to be checked',
        17, GOLD,
        x,
        beltY - 0.44,
        false,
        W
      )
    );

    return group(...parts);
  }

  function managerQuestion() {
    const y = CY;

    return group(
      person(
        CX - 2.30,
        y + 0.20,
        1.15
      ),

      txt(
        'MANAGER',
        17, C.cyan,
        CX - 2.30,
        y - 0.78,
        true
      ),

      rect(
        CX + 0.95,
        y + 0.35,
        4.10,
        1.85,
        C.green, C.card, 0.95
      ),

      txt(
        'Back on target?',
        26, C.green,
        CX + 0.95,
        y + 0.72,
        false,
        3.75
      ),

      txt(
        'Close enough is fine.',
        21, C.ink,
        CX + 0.95,
        y + 0.04,
        false,
        3.75
      ),

      txt(
        'We need evidence of a sufficiently small drift.',
        18, C.muted,
        CX,
        y - 1.58,
        false,
        W
      )
    );
  }

  // ------------------------------------------------------------
  // Common gram axis for the equivalence problem.
  //
  // This exact horizontal scale is reused for the tolerance
  // zone, distances from the bounds, and both confidence
  // intervals.
  // ------------------------------------------------------------

  const GLO = 495;
  const GHI = 505;

  const GW = P ? 6.35 : 6.80;

  const gx = v =>
    CX - GW / 2 +
    (v - GLO) / (GHI - GLO) * GW;

  function gramAxis(
    y = BASE,
    showMinor = true
  ) {
    const parts = [
      line(
        gx(GLO), y,
        gx(GHI), y,
        C.muted, 2.5
      )
    ];

    for (let v = GLO; v <= GHI; v++) {
      const major = (
        v === LOWER ||
        v === TARGET ||
        v === UPPER
      );

      if (!major && !showMinor) continue;

      const color =
        v === TARGET
          ? GOLD
          : (
              v === LOWER || v === UPPER
                ? C.green
                : C.muted
            );

      parts.push(
        line(
          gx(v), y - 0.075,
          gx(v), y + 0.075,
          color,
          major ? 2.5 : 1.5
        ),

        txt(
          (major || !P) ? String(v) : ' ',
          P ? 18 : (major ? 17 : 14),
          color,
          gx(v),
          y - 0.30,
          true
        )
      );
    }

    parts.push(
      txt(
        'Long-run mean fill (grams)',
        17, C.muted,
        CX,
        y - 0.75
      )
    );

    return group(...parts);
  }

  function toleranceBackground(
    y = BASE,
    h = 2.30,
    mode = 'safe'
  ) {
    const lowW = gx(LOWER) - gx(GLO);
    const safeW = gx(UPPER) - gx(LOWER);
    const highW = gx(GHI) - gx(UPPER);

    const safeActive = mode === 'safe' ||
      mode === 'alternative';

    const outsideActive = mode === 'null';

    return group(
      block(
        gx(GLO) + lowW / 2,
        y + h / 2,
        lowW,
        h,
        RED,
        outsideActive ? 0.27 : 0.07
      ),

      block(
        gx(LOWER) + safeW / 2,
        y + h / 2,
        safeW,
        h,
        C.green,
        safeActive ? 0.21 : 0.08
      ),

      block(
        gx(UPPER) + highW / 2,
        y + h / 2,
        highW,
        h,
        RED,
        outsideActive ? 0.27 : 0.07
      )
    );
  }

  function toleranceLines(
    y = BASE,
    h = 2.30,
    showLabels = true
  ) {
    const parts = [
      line(
        gx(TARGET), y,
        gx(TARGET), y + h,
        GOLD, 3
      ),

      dashed(
        gx(LOWER), y,
        gx(LOWER), y + h,
        C.green
      ),

      dashed(
        gx(UPPER), y,
        gx(UPPER), y + h,
        C.green
      )
    ];

    if (showLabels) {
      parts.push(
        txt(
          '497 g',
          19, C.green,
          gx(LOWER),
          y + h + 0.25,
          true
        ),

        txt(
          '500 g',
          19, GOLD,
          gx(TARGET),
          y + h + 0.25,
          true
        ),

        txt(
          '503 g',
          19, C.green,
          gx(UPPER),
          y + h + 0.25,
          true
        )
      );
    }

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Safe-zone picture.
  //
  // The interval is fixed before looking at the sample.
  // Boundary values themselves are part of the equivalence
  // null; the alternative requires the mean to be strictly
  // between the two bounds.
  // ------------------------------------------------------------

  function safeZone(
    mode = 'safe',
    showTolerance = false,
    showMean = false
  ) {
    const y = BASE;

    const h = P ? 2.65 : 2.15;

    const parts = [
      toleranceBackground(y, h, mode),
      gramAxis(y),
      toleranceLines(y, h, true)
    ];

    const ly = y + h * 0.42;

    parts.push(
      txt(
        'TOO LOW',
        16, RED,
        (gx(GLO) + gx(LOWER)) / 2,
        ly,
        true,
        gx(LOWER) - gx(GLO) - 0.08
      ),

      txt(
        'TOO HIGH',
        16, RED,
        (gx(UPPER) + gx(GHI)) / 2,
        ly,
        true,
        gx(GHI) - gx(UPPER) - 0.08
      ),

      tag(
        'SAFE ZONE',
        C.green,
        CX,
        y + h * 0.72,
        3.10
      )
    );

    if (showTolerance) {
      const by = y + h * 0.19;

      parts.push(
        bracket(
          gx(LOWER),
          gx(TARGET),
          by,
          '3 g',
          GOLD
        ),

        bracket(
          gx(TARGET),
          gx(UPPER),
          by,
          '3 g',
          GOLD
        )
      );
    }

    if (mode === 'null') {
      parts.push(
        heading(
          'H₀: outside the safe zone',
          RED
        ),

        arrow(
          gx(LOWER) - 0.05,
          y + h * 0.60,
          gx(GLO) + 0.08,
          y + h * 0.60,
          RED, 3.5
        ),

        arrow(
          gx(UPPER) + 0.05,
          y + h * 0.60,
          gx(GHI) - 0.08,
          y + h * 0.60,
          RED, 3.5
        )
      );
    } else if (mode === 'alternative') {
      parts.push(
        heading(
          'H₁: inside the safe zone',
          C.green
        ),

        arrow(
          gx(LOWER) + 0.07,
          y + h * 0.40,
          gx(TARGET) - 0.08,
          y + h * 0.40,
          C.green, 3
        ),

        arrow(
          gx(UPPER) - 0.07,
          y + h * 0.40,
          gx(TARGET) + 0.08,
          y + h * 0.40,
          C.green, 3
        )
      );
    }

    if (showMean) {
      parts.push(
        glowDot(
          gx(MEAN),
          y + 0.06,
          C.cyan,
          0.11
        ),

        line(
          gx(MEAN),
          y + 0.06,
          gx(MEAN),
          y + h * 0.36,
          C.cyan, 3
        ),

        tag(
          '500.5 g',
          C.cyan,
          gx(MEAN) + 0.50,
          y + h * 0.52,
          2.05
        )
      );
    }

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Before any weighing: agree the tolerance.
  // ------------------------------------------------------------

  function advanceAgreement() {
    const x = CX;
    const y = CY;

    const w = P ? 6.35 : 6.65;
    const h = P ? 3.90 : 3.50;

    return group(
      rect(
        x, y,
        w, h,
        GOLD, C.card, 0.95
      ),

      txt(
        'AGREE BEFORE WEIGHING',
        23, GOLD,
        x,
        y + h / 2 - 0.40,
        true,
        w - 0.40
      ),

      txt(
        '500 g',
        38, GOLD,
        x,
        y + 0.58,
        true
      ),

      arrow(
        x - 0.22,
        y - 0.13,
        x - 2.10,
        y - 0.13,
        C.green, 3.5
      ),

      arrow(
        x + 0.22,
        y - 0.13,
        x + 2.10,
        y - 0.13,
        C.green, 3.5
      ),

      txt(
        '−3 g',
        25, C.green,
        x - 1.40,
        y - 0.54,
        true
      ),

      txt(
        '+3 g',
        25, C.green,
        x + 1.40,
        y - 0.54,
        true
      ),

      txt(
        'Close enough for our purpose',
        20, C.ink,
        x,
        y - h / 2 + 0.31,
        false,
        w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // Ordinary hypothesis test versus equivalence test.
  // ------------------------------------------------------------

  function ordinaryQuestion() {
    const x = CX;
    const y = CY;

    const w = P ? 6.35 : 6.65;
    const h = P ? 3.80 : 3.45;

    return group(
      rect(
        x, y,
        w, h,
        C.violet, C.card, 0.95
      ),

      txt(
        'ORDINARY TEST',
        24, C.violet,
        x,
        y + h / 2 - 0.38,
        true
      ),

      txt(
        'H₀: mean = 500 g',
        23, GOLD,
        x,
        y + 0.67,
        true
      ),

      txt(
        'H₁: mean ≠ 500 g',
        23, C.violet,
        x,
        y + 0.10,
        true
      ),

      line(
        x - w / 2 + 0.34,
        y - 0.30,
        x + w / 2 - 0.34,
        y - 0.30,
        C.muted, 1.5
      ),

      txt(
        'Can find evidence of drift.',
        20, C.green,
        x,
        y - 0.72,
        false,
        w - 0.45
      ),

      txt(
        'Cannot establish equivalence.',
        20, RED,
        x,
        y - h / 2 + 0.32,
        false,
        w - 0.45
      )
    );
  }

  function flippedStories() {
    const x = CX;
    const y = CY;

    const w = P ? 3.10 : 3.25;
    const h = P ? 3.65 : 3.30;

    const dx = P ? 1.72 : 1.81;

    const x1 = x - dx;
    const x2 = x + dx;

    return group(
      rect(
        x1, y,
        w, h,
        RED, C.card, 0.95
      ),

      rect(
        x2, y,
        w, h,
        C.green, C.card, 0.95
      ),

      txt(
        'NEW NULL',
        20, RED,
        x1,
        y + h / 2 - 0.34,
        true,
        w - 0.25
      ),

      txt(
        'H₀',
        34, RED,
        x1,
        y + 0.52,
        true
      ),

      txt(
        'Not close enough',
        21, RED,
        x1,
        y - 0.22,
        false,
        w - 0.25
      ),

      txt(
        'Outside the bounds',
        17, C.muted,
        x1,
        y - h / 2 + 0.31,
        false,
        w - 0.25
      ),

      txt(
        'NEW ALTERNATIVE',
        18, C.green,
        x2,
        y + h / 2 - 0.34,
        true,
        w - 0.25
      ),

      txt(
        'H₁',
        34, C.green,
        x2,
        y + 0.52,
        true
      ),

      txt(
        'Close enough',
        22, C.green,
        x2,
        y - 0.22,
        false,
        w - 0.25
      ),

      txt(
        'Inside the bounds',
        17, C.muted,
        x2,
        y - h / 2 + 0.31,
        false,
        w - 0.25
      )
    );
  }

  function rejectOutsidePicture() {
    const x = CX;
    const y = CY;

    const w = P ? 6.35 : 6.70;
    const h = P ? 3.90 : 3.45;

    return group(
      rect(
        x, y,
        w, h,
        C.green, C.card, 0.95
      ),

      txt(
        'WHAT MUST THE DATA DO?',
        22, C.ink,
        x,
        y + h / 2 - 0.40,
        true,
        w - 0.40
      ),

      txt(
        'H₀: outside the zone',
        23, RED,
        x,
        y + 0.60,
        true,
        w - 0.45
      ),

      arrow(
        x,
        y + 0.22,
        x,
        y - 0.28,
        C.green,
        3.5
      ),

      tag(
        'REJECT H₀',
        C.green,
        x,
        y - 0.57
      ),

      txt(
        'Evidence that the mean is inside',
        20, C.green,
        x,
        y - h / 2 + 0.34,
        false,
        w - 0.45
      )
    );
  }

  // ------------------------------------------------------------
  // Repaired-machine sample.
  // The observed 500.5 g is a sample mean.
  // ------------------------------------------------------------

  function inspectionPicture(
    n = 16,
    display = '500.5 g'
  ) {
    const y = CY;

    const tx = CX - 1.75;
    const sx = CX + 1.75;

    const cols = n === 4 ? 2 : 4;
    const s = n === 4 ? 1.23 : 0.95;

    const trayW =
      cols * 0.52 * s + 0.37 * s;

    return group(
      tray(
        tx,
        y + 0.12,
        n,
        cols,
        s
      ),

      arrow(
        tx + trayW / 2 + 0.10,
        y + 0.12,
        sx - 1.10,
        y + 0.12,
        C.cyan, 3
      ),

      scale(
        sx,
        y - 0.25,
        1.02,
        display
      ),

      bottle(
        sx,
        y + 0.80,
        0.83,
        0.75,
        '500 g'
      ),

      txt(
        'Batch mean',
        18, C.muted,
        sx,
        y - 0.91
      ),

      tag(
        'AFTER THE REPAIR',
        C.cyan,
        CX,
        y - 1.77
      )
    );
  }

  // ------------------------------------------------------------
  // Standard-error ruler for the repaired-machine sample.
  // ------------------------------------------------------------

  function sePicture(n = 16) {
    const se = SD / Math.sqrt(n);

    const y = P ? CY : CY - 0.55;

    const w = P ? 5.85 : 6.20;
    const left = CX - w / 2;

    const gxLocal = v =>
      left + v / SD * w;

    const parts = [
      heading(
        `STANDARD ERROR WITH ${n} BOTTLES`,
        C.cyan
      ),

      rect(
        CX,
        y + 0.35,
        w,
        0.65,
        GOLD, GOLD, 0.14,
        0.04
      ),

      bracket(
        gxLocal(0),
        gxLocal(SD),
        y + 1.05,
        'Bottle SD = 4 g',
        GOLD
      ),

      block(
        gxLocal(se / 2),
        y - 0.83,
        w * se / SD,
        0.60,
        C.cyan,
        0.85
      ),

      txt(
        `${se} g`,
        22, C.cyan,
        gxLocal(se / 2),
        y - 1.42,
        true,
        1.60
      ),

      txt(
        'One standard error',
        19, C.cyan,
        CX + 0.70,
        y - 0.83,
        false,
        3.80
      )
    ];

    for (let i = 1; i < 4; i++) {
      parts.push(
        line(
          gxLocal(i),
          y + 0.025,
          gxLocal(i),
          y + 0.675,
          GOLD, 1.5
        )
      );
    }

    parts.push(
      txt(
        `SE = 4 ÷ √${n} = ${se} g`,
        21, C.cyan,
        CX,
        y - 1.94,
        true,
        W
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Split the outside null into two one-sided components.
  //
  // Lower test:
  //   H₀L: mean ≤ 497
  //   H₁L: mean > 497
  //
  // Upper test:
  //   H₀U: mean ≥ 503
  //   H₁U: mean < 503
  //
  // Both components must be rejected.
  // ------------------------------------------------------------

  function twoTestsPicture(
    lowerPassed = false,
    upperPassed = false
  ) {
    const x = CX;
    const y = CY;

    const w = P ? 3.08 : 3.25;
    const h = P ? 3.70 : 3.35;

    const dx = P ? 1.72 : 1.81;

    const parts = [];

    const tests = [
      {
        x: x - dx,
        title: 'TEST ONE',
        question: 'Above 497?',
        nullText: 'H₀: mean ≤ 497',
        altText: 'H₁: mean > 497',
        passed: lowerPassed,
        direction: 1,
        p: '0.0002'
      },

      {
        x: x + dx,
        title: 'TEST TWO',
        question: 'Below 503?',
        nullText: 'H₀: mean ≥ 503',
        altText: 'H₁: mean < 503',
        passed: upperPassed,
        direction: -1,
        p: '0.006'
      }
    ];

    tests.forEach(t => {
      const color =
        t.passed ? C.green : C.violet;

      parts.push(
        rect(
          t.x, y,
          w, h,
          color, C.card, 0.95
        ),

        txt(
          t.title,
          19, color,
          t.x,
          y + h / 2 - 0.30,
          true,
          w - 0.25
        ),

        txt(
          t.question,
          23, C.ink,
          t.x,
          y + 0.72,
          false,
          w - 0.25
        ),

        arrow(
          t.x - t.direction * 0.72,
          y + 0.14,
          t.x + t.direction * 0.72,
          y + 0.14,
          color,
          3.5
        ),

        txt(
          t.nullText,
          16, RED,
          t.x,
          y - 0.43,
          true,
          w - 0.25
        ),

        txt(
          t.altText,
          16, C.green,
          t.x,
          y - 0.84,
          true,
          w - 0.25
        )
      );

      if (t.passed) {
        parts.push(
          checkMark(
            t.x - 0.97,
            y - h / 2 + 0.31,
            0.65
          ),

          txt(
            `p ≈ ${t.p}`,
            18, C.green,
            t.x + 0.24,
            y - h / 2 + 0.31,
            true,
            w - 0.80
          )
        );
      } else {
        parts.push(
          txt(
            'ONE-SIDED',
            16, C.muted,
            t.x,
            y - h / 2 + 0.31,
            true,
            w - 0.25
          )
        );
      }
    });

    parts.push(
      txt(
        lowerPassed && upperPassed
          ? 'Both tests passed'
          : 'Both tests must reject their nulls',
        20,
        lowerPassed && upperPassed
          ? C.green
          : GOLD,
        CX,
        y - h / 2 - 0.43,
        false,
        W
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Distance from one tolerance bound to the observed mean.
  //
  // stage 0: identify the edge and test direction.
  // stage 1: show the distance in grams.
  // stage 2: show standard-error steps.
  //
  // The upper test's signed z is negative because the
  // observation is below the upper reference value.
  // ------------------------------------------------------------

  function edgeDistance(
    side = 'lower',
    stage = 0
  ) {
    const lower = side === 'lower';

    const edge = lower ? LOWER : UPPER;
    const distance = Math.abs(MEAN - edge);

    const z = (MEAN - edge) / SE16;

    const y = BASE;
    const h = P ? 2.60 : 2.15;

    const parts = [
      toleranceBackground(
        y, h, 'safe'
      ),

      gramAxis(y, true),

      toleranceLines(
        y, h, false
      ),

      line(
        gx(edge),
        y,
        gx(edge),
        y + h,
        GOLD,
        4
      ),

      tag(
        lower
          ? 'LOWER EDGE: 497'
          : 'UPPER EDGE: 503',
        GOLD,
        gx(edge),
        y - 1.2,
        2.70
      ),

      glowDot(
        gx(MEAN),
        y + 0.07,
        C.cyan,
        0.105
      ),

      line(
        gx(MEAN),
        y + 0.07,
        gx(MEAN),
        y + h * 0.83,
        C.cyan,
        3
      ),

      txt(
        '500.5 g',
        20, C.cyan,
        gx(MEAN),
        y + h * 0.92,
        true,
        1.80
      )
    ];

    if (stage === 0) {
      const direction = lower ? 1 : -1;

      parts.push(
        arrow(
          gx(edge) + direction * 0.07,
          y + h * 0.43,
          gx(edge + direction * 2.1),
          y + h * 0.43,
          C.green,
          3.8
        ),

        txt(
          lower
            ? 'Must be above'
            : 'Must be below',
          19, C.green,
          gx(edge + direction * 1.05),
          y + h * 0.43 + 0.30,
          false,
          2.30
        )
      );
    }

    if (stage === 1) {
      parts.push(
        bracket(
          gx(Math.min(edge, MEAN)),
          gx(Math.max(edge, MEAN)),
          y + h * 0.42,
          `${distance} g`,
          C.violet
        )
      );
    }

    if (stage >= 2) {
      const direction = lower ? 1 : -1;

      const full = Math.floor(distance);
      const stepCount = Math.ceil(distance);

      const sy = y + h * 0.43;

      for (let i = 0; i < stepCount; i++) {
        const a = edge + direction * i;

        const b = edge + direction *
          Math.min(i + 1, distance);

        parts.push(
          arrow(
            gx(a) + direction * 0.015,
            sy,
            gx(b) - direction * 0.015,
            sy,
            C.violet,
            2.7
          ),

          txt(
            i < full ? '1' : '½',
            17, C.violet,
            (gx(a) + gx(b)) / 2,
            sy + 0.28,
            true
          )
        );
      }

      parts.push(
        tag(
          `z = ${signed(z)}`,
          C.violet,
          (gx(edge) + gx(MEAN)) / 2,
          y + h * 0.17,
          2.20
        )
      );
    }

    parts.push(
      heading(
        lower
          ? 'Test one: reference = 497 g'
          : 'Test two: reference = 503 g',
        lower ? C.cyan : C.violet
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Common standardized normal-curve helpers.
  // ------------------------------------------------------------

  const ZLO = -4.5;
  const ZHI = 4.5;

  const ZW = P ? 6.55 : 7.05;
  const ZH = P ? 2.65 : 2.10;

  const zx = z =>
    CX - ZW / 2 +
    (z - ZLO) / (ZHI - ZLO) * ZW;

  const density = z =>
    Math.exp(-0.5 * z * z);

  function normalArea(
    lo, hi,
    color,
    opacity = 0.15
  ) {
    const parts = [];

    const count = Math.max(
      10,
      Math.ceil((hi - lo) * 18)
    );

    const step = (hi - lo) / count;

    for (let i = 0; i < count; i++) {
      const a = lo + i * step;
      const b = a + step;
      const mid = (a + b) / 2;

      const h = ZH * density(mid);

      parts.push(
        block(
          zx(mid),
          BASE + h / 2,
          (zx(b) - zx(a)) * 1.005,
          h,
          color,
          opacity
        )
      );
    }

    return group(...parts);
  }

  function normalOutline(
    color = C.cyan
  ) {
    const parts = [];
    const count = 110;

    for (let i = 0; i < count; i++) {
      const a =
        ZLO + (ZHI - ZLO) * i / count;

      const b =
        ZLO + (ZHI - ZLO) * (i + 1) / count;

      parts.push(
        line(
          zx(a),
          BASE + ZH * density(a),

          zx(b),
          BASE + ZH * density(b),

          color,
          2.8
        )
      );
    }

    return group(...parts);
  }

  function normalAxis(
    label = 'z: standard errors from the reference'
  ) {
    const parts = [
      line(
        zx(ZLO), BASE,
        zx(ZHI), BASE,
        C.muted, 2.5
      )
    ];

    for (let z = -4; z <= 4; z++) {
      parts.push(
        line(
          zx(z),
          BASE - 0.075,
          zx(z),
          BASE + 0.075,
          C.muted
        ),

        txt(
          signed(z),
          16,
          z === 0 ? GOLD : C.muted,
          zx(z),
          BASE - 0.28,
          true
        )
      );
    }

    parts.push(
      txt(
        label,
        17, C.muted,
        CX,
        BASE - 0.72,
        false,
        ZW
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // One-sided p-value graph.
  //
  // The reference is the boundary of the corresponding
  // composite null. This gives its least-favourable p-value.
  //
  // Lower test: shade Z ≥ +3.5.
  // Upper test: shade Z ≤ -2.5.
  // ------------------------------------------------------------

  function oneSidedGraph(
    side = 'lower'
  ) {
    const lower = side === 'lower';

    const z = lower
      ? Z_LOWER
      : Z_UPPER;

    const edge = lower
      ? LOWER
      : UPPER;

    const pLabel = lower
      ? '0.0002'
      : '0.006';

    const tailLo = lower ? z : ZLO;
    const tailHi = lower ? ZHI : z;

    const markerX = zx(z);

    const markerTop =
      BASE + ZH * 0.58;

    const labelX = lower
      ? zx(2.68)
      : zx(-2.80);

    const tailMid = lower
      ? 3.70
      : -2.82;

    const labelY =
      BASE + ZH * 0.35;

    return group(
      normalArea(
        ZLO, ZHI,
        C.cyan, 0.13
      ),

      normalArea(
        tailLo, tailHi,
        C.violet, 0.96
      ),

      normalOutline(),
      normalAxis(),

      line(
        zx(0), BASE,
        zx(0), BASE + ZH + 0.07,
        GOLD, 3
      ),

      txt(
        `Reference mean = ${edge} g`,
        17, GOLD,
        CX,
        BASE + ZH + 0.34,
        true
      ),

      dashed(
        markerX, BASE,
        markerX, markerTop,
        C.violet
      ),

      glowDot(
        markerX,
        BASE + ZH * density(z),
        C.violet,
        0.085
      ),

      tag(
        `z = ${signed(z)}`,
        C.violet,
        labelX,
        markerTop + 0.27,
        2.10
      ),

      tag(
        `p ≈ ${pLabel}`,
        C.violet,
        labelX,
        labelY,
        2.15
      ),

      arrow(
        labelX,
        labelY - 0.22,
        zx(tailMid),
        BASE + ZH * density(tailMid) * 0.40,
        C.violet,
        2.3
      ),

      heading(
        lower
          ? 'Right-sided test: above 497?'
          : 'Left-sided test: below 503?',
        C.violet
      )
    );
  }

  // ------------------------------------------------------------
  // Both one-sided p-values compared with alpha.
  // Both bars use the same probability scale.
  // ------------------------------------------------------------

  function bothPValues() {
    const w = P ? 6.05 : 6.40;
    const left = CX - w / 2;

    const max = 0.06;

    const px = p =>
      left + p / max * w;

    const y1 = P ? -0.30 : 0.13;
    const y2 = P ? -2.12 : -1.35;

    const parts = [];

    [
      {
        y: y1,
        label: 'LOWER TEST',
        p: P_LOWER,
        text: 'p ≈ 0.0002'
      },

      {
        y: y2,
        label: 'UPPER TEST',
        p: P_UPPER,
        text: 'p ≈ 0.006'
      }
    ].forEach(t => {
      const bw = w * t.p / max;

      parts.push(
        txt(
          t.label,
          18, C.violet,
          CX - 1.53,
          t.y + 0.66,
          true,
          2.90
        ),

        txt(
          t.text,
          21, C.green,
          CX + 1.67,
          t.y + 0.66,
          true,
          2.90
        ),

        rect(
          CX,
          t.y,
          w, 0.43,
          C.muted, C.card, 0.95,
          0.04
        ),

        block(
          left + bw / 2,
          t.y,
          bw,
          0.40,
          C.violet,
          0.95
        ),

        line(
          px(ALPHA),
          t.y - 0.31,
          px(ALPHA),
          t.y + 0.31,
          GOLD,
          3
        ),

        checkMark(
          CX + 2.75,
          t.y - 0.48,
          0.65
        ),

        txt(
          'Reject this null',
          17, C.green,
          CX,
          t.y - 0.50
        )
      );
    });

    parts.push(
      txt(
        '0',
        15, C.muted,
        left,
        y2 - 0.95,
        true
      ),

      txt(
        'α = 0.05',
        17, GOLD,
        px(ALPHA) - 0.10,
        y2 - 0.95,
        true
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Equivalence conclusion.
  // ------------------------------------------------------------

  function equivalenceDecision(
    named = false
  ) {
    const y = BASE;
    const h = P ? 2.55 : 2.12;

    const parts = [
      toleranceBackground(
        y, h, 'safe'
      ),

      toleranceLines(
        y, h, true
      ),

      gramAxis(y, false),

      arrow(
        gx(LOWER) + 0.06,
        y + h * 0.22,
        gx(TARGET) - 0.12,
        y + h * 0.22,
        C.green,
        3.5
      ),

      arrow(
        gx(UPPER) - 0.06,
        y + h * 0.22,
        gx(TARGET) + 0.12,
        y + h * 0.22,
        C.green,
        3.5
      ),

      checkMark(
        gx(LOWER) - 0.08,
        y + h * 0.66,
        0.8
      ),

      checkMark(
        gx(UPPER) + 0.08,
        y + h * 0.66,
        0.8
      ),

      tag(
        'EQUIVALENCE SHOWN',
        C.green,
        CX,
        y + h * 0.70,
        3.55
      ),

      tag(
        '497 < true mean < 503',
        C.green,
        CX,
        y + h * 0.47,
        3.55
      ),

      heading(
        named
          ? 'TOST: two one-sided tests'
          : 'Evidence that the mean is within tolerance',
        C.green
      )
    ];

    return group(...parts);
  }

  // ------------------------------------------------------------
  // TOST definition card.
  // ------------------------------------------------------------

  function tostCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 4.20 : 3.65;

    return group(
      rect(
        x, y,
        w, h,
        C.green, C.card, 0.95
      ),

      txt(
        'EQUIVALENCE TEST',
        26, C.green,
        x,
        y + h / 2 - 0.39,
        true,
        w - 0.40
      ),

      txt(
        'TOST',
        42, C.green,
        x,
        y + 0.69,
        true
      ),

      txt(
        'Two One-Sided Tests',
        23, C.ink,
        x,
        y + 0.10
      ),

      line(
        x - w / 2 + 0.35,
        y - 0.30,
        x + w / 2 - 0.35,
        y - 0.30,
        C.muted, 1.5
      ),

      checkMark(
        x - 2.40,
        y - 0.72,
        0.65
      ),

      txt(
        'Reject “too low”',
        20, C.green,
        x + 0.10,
        y - 0.72,
        false,
        w - 1.65
      ),

      checkMark(
        x - 2.40,
        y - 1.23,
        0.65
      ),

      txt(
        'Reject “too high”',
        20, C.green,
        x + 0.10,
        y - 1.23,
        false,
        w - 1.65
      )
    );
  }

  // ------------------------------------------------------------
  // Confidence interval primitive.
  //
  // Draw the interval using its exact computed endpoints.
  // End caps distinguish an interval from a directional arrow.
  //
  // Outside portions can be coloured red without changing the
  // interval's geometry.
  // ------------------------------------------------------------

  function intervalLine(
    ci,
    y,
    color = C.cyan,
    showValues = true,
    highlightOutside = false
  ) {
    const a = ci[0];
    const b = ci[1];

    const parts = [];

    if (!highlightOutside) {
      parts.push(
        line(
          gx(a), y,
          gx(b), y,
          color, 6
        )
      );
    } else {
      const insideLo = Math.max(a, LOWER);
      const insideHi = Math.min(b, UPPER);

      if (a < LOWER) {
        parts.push(
          line(
            gx(a), y,
            gx(Math.min(b, LOWER)), y,
            RED, 6
          )
        );
      }

      if (insideHi > insideLo) {
        parts.push(
          line(
            gx(insideLo), y,
            gx(insideHi), y,
            color, 6
          )
        );
      }

      if (b > UPPER) {
        parts.push(
          line(
            gx(Math.max(a, UPPER)), y,
            gx(b), y,
            RED, 6
          )
        );
      }
    }

    const leftColor =
      highlightOutside && a < LOWER
        ? RED
        : color;

    const rightColor =
      highlightOutside && b > UPPER
        ? RED
        : color;

    parts.push(
      line(
        gx(a), y - 0.17,
        gx(a), y + 0.17,
        leftColor, 3.5
      ),

      line(
        gx(b), y - 0.17,
        gx(b), y + 0.17,
        rightColor, 3.5
      ),

      glowDot(
        gx(MEAN),
        y,
        C.cyan,
        0.105
      )
    );

    if (showValues) {
      parts.push(
        txt(
          a.toFixed(2),
          18, leftColor,
          gx(a) + (Math.abs(a - LOWER) < 0.6 ? Math.sign(a - LOWER || 1) * 0.42 : 0),
          y - 0.35,
          true,
          1.20
        ),

        txt(
          b.toFixed(2),
          18, rightColor,
          gx(b) + (Math.abs(b - UPPER) < 0.6 ? Math.sign(b - UPPER || -1) * 0.42 : 0),
          y - 0.35,
          true,
          1.20
        )
      );
    }

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Single confidence-interval picture.
  //
  // stage 0: observed mean only.
  // stage 1: interval around observed mean.
  // stage 2: numerical margin and endpoints.
  // stage 3: equivalence decision.
  // ------------------------------------------------------------

  function confidencePicture(
    n = 16,
    stage = 2
  ) {
    const se = SD / Math.sqrt(n);

    const ci = n === 16
      ? CI16
      : CI4;

    const equivalent =
      ci[0] > LOWER &&
      ci[1] < UPPER;

    const y = BASE;
    const h = P ? 2.60 : 2.15;

    const iy = y + h * 0.46;

    const parts = [
      toleranceBackground(
        y, h, 'safe'
      ),

      toleranceLines(
        y, h, true
      ),

      gramAxis(y, true),

      txt(
        `${n} BOTTLES — 90% CONFIDENCE INTERVAL`,
        19, C.cyan,
        CX,
        P ? 1.02 : 1.13,
        true,
        W
      ),

      glowDot(
        gx(MEAN),
        iy,
        C.cyan,
        0.11
      ),

      tag(
        'Mean 500.5 g',
        C.cyan,
        gx(MEAN),
        iy + 0.51,
        2.70
      )
    ];

    if (stage >= 1) {
      const color =
        stage >= 3 && equivalent
          ? C.green
          : C.cyan;

      parts.push(
        intervalLine(
          ci,
          iy,
          color,
          stage >= 2,
          stage >= 3
        )
      );
    }

    if (stage === 2 && n === 16) {
      parts.push(
        bracket(
          gx(ci[0]),
          gx(MEAN),
          iy + 0.93,
          '1.645 g',
          C.violet,
          true,
          1.70
        ),

        bracket(
          gx(MEAN),
          gx(ci[1]),
          iy + 0.93,
          '1.645 g',
          C.violet,
          true,
          1.70
        )
      );
    }

    if (stage >= 3) {
      if (equivalent) {
        parts.push(
          tag(
            'ENTIRE INTERVAL INSIDE',
            C.green,
            CX,
            y + h * 0.13,
            4.25
          )
        );
      } else {
        const outsideMid =
          (UPPER + ci[1]) / 2;

        parts.push(
          arrow(
            gx(outsideMid),
            iy + 0.79,
            gx(outsideMid),
            iy + 0.11,
            RED,
            3
          ),

          txt(
            'Outside!',
            19, RED,
            gx(outsideMid) + 0.6,
            iy + 0.78,
            false,
            1.10
          ),

          tag(
            'EQUIVALENCE NOT SHOWN',
            RED,
            CX,
            y + h * 0.13,
            4.50
          )
        );
      }
    }

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Why use a 90% confidence interval?
  //
  // Two one-sided tests, each with alpha = 0.05,
  // correspond to a central 90% confidence interval.
  //
  // This is not a Bonferroni adjustment. The overall TOST
  // rejects only when both component tests reject.
  // ------------------------------------------------------------

  function confidenceLevelGraph() {
    const h = ZH;

    return group(
      normalArea(
        ZLO, -Q90,
        C.violet, 0.90
      ),

      normalArea(
        -Q90, Q90,
        C.green, 0.62
      ),

      normalArea(
        Q90, ZHI,
        C.violet, 0.90
      ),

      normalOutline(),

      normalAxis(
        'Standard normal confidence multiplier'
      ),

      dashed(
        zx(-Q90),
        BASE,
        zx(-Q90),
        BASE + h * 0.80,
        GOLD
      ),

      dashed(
        zx(Q90),
        BASE,
        zx(Q90),
        BASE + h * 0.80,
        GOLD
      ),

      txt(
        '−1.645',
        17, GOLD,
        zx(-Q90),
        BASE + h * 0.80 + 0.26,
        true
      ),

      txt(
        '+1.645',
        17, GOLD,
        zx(Q90),
        BASE + h * 0.80 + 0.26,
        true
      ),

      txt(
        '90%',
        35, C.green,
        CX,
        BASE + h * 0.56,
        true
      ),

      tag(
        '5%',
        C.violet,
        zx(-3.05),
        BASE + h * 0.40,
        1.30
      ),

      tag(
        '5%',
        C.violet,
        zx(3.05),
        BASE + h * 0.40,
        1.30
      ),

      arrow(
        zx(-3.05),
        BASE + h * 0.40 - 0.23,
        zx(-2.05),
        BASE + h * density(-2.05) * 0.43,
        C.violet,
        2.2
      ),

      arrow(
        zx(3.05),
        BASE + h * 0.40 - 0.23,
        zx(2.05),
        BASE + h * density(2.05) * 0.43,
        C.violet,
        2.2
      ),

      heading(
        '5% + 90% + 5% = 100%',
        GOLD
      )
    );
  }

  // ------------------------------------------------------------
  // Compare confidence intervals for 16 and 4 bottles.
  //
  // Identical observed means.
  // Identical pre-agreed tolerance bounds.
  // Different standard errors and interval widths.
  // ------------------------------------------------------------

  function intervalComparison() {
    const y = BASE;
    const h = P ? 3.50 : 2.75;

    const y16 = y + h * 0.71;
    const y4 = y + h * 0.30;

    return group(
      toleranceBackground(
        y, h, 'safe'
      ),

      toleranceLines(
        y, h, false
      ),

      gramAxis(y, false),

      txt(
        '497',
        17, C.green,
        gx(LOWER),
        y + h + 0.22,
        true
      ),

      txt(
        '503',
        17, C.green,
        gx(UPPER),
        y + h + 0.22,
        true
      ),

      txt(
        '16 BOTTLES — SE = 1 g',
        17, C.green,
        CX,
        y16 + 0.43,
        true,
        4.80
      ),

      intervalLine(
        CI16,
        y16,
        C.green,
        true,
        true
      ),

      txt(
        '4 BOTTLES — SE = 2 g',
        17, RED,
        CX,
        y4 + 0.43,
        true,
        4.80
      ),

      intervalLine(
        CI4,
        y4,
        C.cyan,
        true,
        true
      ),

      checkMark(
        gx(GHI) - 0.22,
        y16,
        0.65
      ),

      crossMark(
        gx(GHI) - 0.22,
        y4,
        0.65
      )
    );
  }

  // ------------------------------------------------------------
  // Practical applications.
  // Equivalence means an acceptably small difference according
  // to agreed bounds, not a perfectly identical outcome.
  // ------------------------------------------------------------

  function applicationIcon(
    type,
    x, y,
    color
  ) {
    if (type === 'repair') {
      return group(
        rect(
          x, y,
          1.25, 0.85,
          color, C.card, 0.95
        ),

        checkMark(
          x, y,
          0.80,
          color
        )
      );
    }

    if (type === 'supplier') {
      return group(
        rect(
          x - 0.38,
          y,
          0.65, 0.70,
          color, color, 0.18,
          0.05
        ),

        rect(
          x + 0.38,
          y,
          0.65, 0.70,
          color, color, 0.18,
          0.05
        ),

        txt(
          'A',
          22, color,
          x - 0.38,
          y,
          true
        ),

        txt(
          'B',
          22, color,
          x + 0.38,
          y,
          true
        )
      );
    }

    const c = new M.Circle({
      radius: 0.43,
      color,
      strokeWidth: 3
    });

    c.setFill(color, 0.18);
    c.moveTo([x, y, 0]);

    return group(
      c,

      txt(
        '$',
        28, color,
        x, y,
        true
      ),

      arrow(
        x + 0.64,
        y + 0.30,
        x + 0.64,
        y - 0.32,
        C.green,
        3
      )
    );
  }

  function applicationsPicture() {
    const y = CY + 0.12;

    const w = P ? 2.00 : 2.12;
    const h = P ? 2.90 : 2.65;

    const dx = P ? 2.17 : 2.28;

    const cases = [
      ['REPAIR', 'repair', C.cyan],
      ['NEW SUPPLIER', 'supplier', C.violet],
      ['CHEAPER PART', 'cost', GOLD]
    ];

    const parts = [];

    cases.forEach(([label, type, color], i) => {
      const x = CX + (i - 1) * dx;

      parts.push(
        rect(
          x, y,
          w, h,
          color, C.card, 0.95
        ),

        txt(
          label,
          16, color,
          x,
          y + h / 2 - 0.32,
          true,
          w - 0.15
        ),

        applicationIcon(
          type,
          x,
          y + 0.16,
          color
        ),

        txt(
          'Close enough?',
          17, C.ink,
          x,
          y - 0.71,
          false,
          w - 0.15
        )
      );
    });

    parts.push(
      txt(
        'Show there is no meaningful difference.',
        21, C.green,
        CX,
        y - h / 2 - 0.47,
        false,
        W
      )
    );

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Trap: a smaller sample.
  // Show the two actual sample counts.
  // ------------------------------------------------------------

  function smallerSamplePicture() {
    const y = CY;

    return group(
      tray(
        CX - 1.72,
        y + 0.14,
        16,
        4,
        0.87,
        C.cyan
      ),

      tray(
        CX + 1.72,
        y + 0.14,
        4,
        2,
        1.08,
        C.violet
      ),

      arrow(
        CX - 0.46,
        y + 0.14,
        CX + 0.66,
        y + 0.14,
        GOLD,
        3.5
      ),

      txt(
        'Original sample',
        18, C.cyan,
        CX - 1.72,
        y - 1.25
      ),

      txt(
        'Much less data',
        18, C.violet,
        CX + 1.72,
        y - 1.25
      ),

      tag(
        'WHAT IF WE HAD ONLY FOUR?',
        RED,
        CX,
        y - 1.99
      )
    );
  }

  // ------------------------------------------------------------
  // Ordinary two-sided test for the four-bottle sample.
  //
  // Null reference = 500 g.
  // Observed mean = 500.5 g.
  // SE = 2 g.
  // z = +0.25.
  //
  // p is the area outside [-0.25, +0.25].
  // ------------------------------------------------------------

  function ordinarySmallSampleGraph() {
    const z = Z_ORDINARY;

    return group(
      normalArea(
        ZLO, -z,
        C.violet, 0.75
      ),

      normalArea(
        -z, z,
        C.cyan, 0.12
      ),

      normalArea(
        z, ZHI,
        C.violet, 0.75
      ),

      normalOutline(),
      normalAxis(),

      line(
        zx(0),
        BASE,
        zx(0),
        BASE + ZH + 0.06,
        GOLD, 3
      ),

      txt(
        'H₀: mean = 500 g',
        17, GOLD,
        CX,
        BASE + ZH + 0.34,
        true
      ),

      dashed(
        zx(-z),
        BASE,
        zx(-z),
        BASE + ZH,
        C.violet
      ),

      dashed(
        zx(z),
        BASE,
        zx(z),
        BASE + ZH,
        C.violet
      ),

      glowDot(
        zx(z),
        BASE + ZH * density(z),
        C.cyan,
        0.09
      ),

      txt(
        '−0.25',
        17, C.violet,
        zx(-0.90),
        BASE + 0.25,
        true
      ),

      txt(
        '+0.25',
        17, C.violet,
        zx(0.90),
        BASE + 0.25,
        true
      ),

      tag(
        'p ≈ 0.80',
        C.violet,
        zx(2.65),
        BASE + ZH * 0.64,
        2.30
      ),

      heading(
        'Ordinary test: no evidence of drift',
        C.cyan
      )
    );
  }

  // ------------------------------------------------------------
  // Mistaken interpretation of a large p-value.
  // ------------------------------------------------------------

  function falseConclusionCard() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 4.00 : 3.55;

    return group(
      rect(
        x, y,
        w, h,
        RED, C.card, 0.95
      ),

      txt(
        'THE COMMON TRAP',
        23, RED,
        x,
        y + h / 2 - 0.39,
        true
      ),

      txt(
        'p ≈ 0.80',
        30, C.cyan,
        x,
        y + 0.74,
        true
      ),

      txt(
        '“No evidence of drift.”',
        21, C.ink,
        x,
        y + 0.13
      ),

      txt(
        'Therefore...',
        18, C.muted,
        x,
        y - 0.36
      ),

      txt(
        '“The machine is fine.”',
        23, RED,
        x,
        y - 0.83
      ),

      line(
        x - 2.05,
        y - 0.96,
        x + 2.05,
        y - 0.70,
        RED,
        3.5
      ),

      txt(
        'That conclusion does not follow.',
        18, GOLD,
        x,
        y - h / 2 + 0.28,
        false,
        w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // No evidence of a difference versus evidence of equivalence.
  // ------------------------------------------------------------

  function evidenceDistinction() {
    const x = CX;
    const y = CY;

    const w = P ? 6.40 : 6.75;
    const h = P ? 4.10 : 3.65;

    return group(
      rect(
        x, y,
        w, h,
        GOLD, C.card, 0.95
      ),

      txt(
        'NO EVIDENCE OF DRIFT',
        23, C.cyan,
        x,
        y + 1.03,
        true,
        w - 0.40
      ),

      txt(
        'The ordinary test did not detect one.',
        18, C.muted,
        x,
        y + 0.50,
        false,
        w - 0.40
      ),

      txt(
        '≠',
        43, RED,
        x,
        y - 0.02,
        true
      ),

      txt(
        'EVIDENCE OF NO MEANINGFUL DRIFT',
        21, C.green,
        x,
        y - 0.61,
        true,
        w - 0.40
      ),

      txt(
        'The data establish equivalence.',
        18, C.muted,
        x,
        y - 1.13,
        false,
        w - 0.40
      )
    );
  }

  // ------------------------------------------------------------
  // Equivalence-testing workflow.
  // ------------------------------------------------------------

  function workflowPicture() {
    const w = P ? 6.30 : 6.65;
    const h = P ? 0.82 : 0.66;

    const gap = P ? 1.13 : 0.92;
    const top = P ? 0.73 : 1.00;

    const rows = [
      ['1', 'Fix meaningful tolerance bounds', GOLD],
      ['2', 'Collect the planned sample', C.cyan],
      ['3', 'Reject “too low”', C.green],
      ['4', 'Reject “too high”', C.green]
    ];

    const parts = [];

    rows.forEach(([number, label, color], i) => {
      const y = top - i * gap;

      parts.push(
        rect(
          CX, y,
          w, h,
          color, C.card, 0.95
        ),

        glowDot(
          CX - w / 2 + 0.40,
          y,
          color,
          0.12
        ),

        txt(
          number,
          15, C.ink,
          CX - w / 2 + 0.40,
          y,
          true
        ),

        txt(
          label,
          20, color,
          CX + 0.24,
          y,
          false,
          w - 1.30
        )
      );

      if (i < rows.length - 1) {
        parts.push(
          arrow(
            CX,
            y - h / 2 - 0.015,
            CX,
            y - gap + h / 2 + 0.015,
            C.muted,
            2
          )
        );
      }
    });

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Chapter recap: connect the concepts without introducing
  // numerical material from the next chapter.
  // ------------------------------------------------------------

  function chapterRecap() {
    const w = P ? 6.35 : 6.65;
    const h = P ? 0.70 : 0.56;

    const top = P ? 0.94 : 1.14;
    const gap = P ? 0.83 : 0.67;

    const rows = [
      ['HYPOTHESES', 'State the competing claims', GOLD],
      ['z AND p', 'Measure statistical evidence', C.cyan],
      ['ERRORS', 'False alarms and missed drifts', RED],
      ['POWER', 'Plan enough data', C.green],
      ['EFFECT SIZE', 'Measure how big', C.violet],
      ['EQUIVALENCE', 'Show close enough', C.green]
    ];

    const parts = [];

    rows.forEach(([name, meaning, color], i) => {
      const y = top - i * gap;

      parts.push(
        rect(
          CX,
          y,
          w, h,
          color, C.card, 0.93,
          0.075
        ),

        txt(
          name,
          15, color,
          CX - w / 2 + 1.25,
          y,
          true,
          2.30
        ),

        txt(
          meaning,
          17, C.ink,
          CX + 1.13,
          y,
          false,
          w - 2.65
        )
      );
    });

    return group(...parts);
  }

  // ------------------------------------------------------------
  // Final visual: both sides rejected and the confidence
  // interval entirely within the agreed tolerance bounds.
  // ------------------------------------------------------------

  function finalRecap() {
    const y = BASE;
    const h = P ? 2.65 : 2.12;

    const iy = y + h * 0.48;

    return group(
      toleranceBackground(
        y, h, 'safe'
      ),

      toleranceLines(
        y, h, true
      ),

      gramAxis(
        y,
        false
      ),

      intervalLine(
        CI16,
        iy,
        C.green,
        true,
        true
      ),

      checkMark(
        (gx(GLO) + gx(LOWER)) / 2,
        iy - 0.05,
        0.78
      ),

      checkMark(
        (gx(GHI) + gx(UPPER)) / 2,
        iy - 0.05,
        0.78
      ),

      txt(
        'Too low',
        P ? 17 : 16, C.green,
        (gx(GLO) + gx(LOWER)) / 2,
        iy + 0.86,
        false,
        1.25
      ),

      txt(
        'rejected',
        P ? 17 : 16, C.green,
        (gx(GLO) + gx(LOWER)) / 2,
        iy + 0.56,
        false,
        1.25
      ),

      txt(
        'Too high',
        P ? 17 : 16, C.green,
        (gx(GHI) + gx(UPPER)) / 2,
        iy + 0.86,
        false,
        1.25
      ),

      txt(
        'rejected',
        P ? 17 : 16, C.green,
        (gx(GHI) + gx(UPPER)) / 2,
        iy + 0.56,
        false,
        1.25
      ),

      tag(
        'EQUIVALENCE SHOWN',
        C.green,
        CX,
        y + h * 0.12,
        3.80
      ),

      heading(
        'The mean is within the agreed bounds',
        C.green
      )
    );
  }

  // ============================================================
  // 0. The machine was repaired.
  // The manager wants evidence that it is back on target.
  // ============================================================

  await until(S(0));
  await play(
    ...scene([
      ['machine', repairedMachine()]
    ]),

    ...fbox([
      'After the repair',
      ['Target = 500 g', GOLD],
      'Is the machine back on target?'
    ], GOLD),

    ...say('THE MACHINE HAS BEEN REPAIRED', C.green)
  );

  // ============================================================
  // 1. Exact equality is not required.
  // Close enough is acceptable.
  // ============================================================

  await until(S(1));
  await play(
    ...scene([
      ['manager', managerQuestion()]
    ]),

    ...fbox([
      'Not necessarily exactly 500 g.',
      ['Close enough is fine.', C.green],
      'But how close?'
    ], C.green),

    ...say('WE WANT CLOSE ENOUGH, NOT EXACTLY 500 g', C.green)
  );

  // ============================================================
  // 2. Before weighing any bottles, agree on ±3 g.
  // ============================================================

  await until(S(2));
  await play(
    ...scene([
      ['agreement', advanceAgreement()]
    ]),

    ...fbox([
      ['Choose BEFORE weighing', GOLD],
      'Target = 500 g',
      ['Tolerance = ±3 g', C.green]
    ], GOLD),

    ...say('AGREE IN ADVANCE: THREE GRAMS EITHER WAY', GOLD)
  );

  // ============================================================
  // 3. The safe zone is from 497 to 503 grams.
  // ============================================================

  await until(S(3));
  await play(
    ...scene([
      [
        'zone',
        safeZone(
          'safe',
          true,
          false
        )
      ]
    ]),

    ...fbox([
      'Lower edge = 500 − 3',
      ['= 497 g', C.green],
      'Upper edge = 500 + 3',
      ['= 503 g', C.green]
    ], C.green),

    ...say('THE SAFE ZONE RUNS FROM 497 TO 503 g', C.green)
  );

  // ============================================================
  // 4. Name the two edges: tolerance bounds.
  // ============================================================

  await until(S(4));
  await play(
    ...indicate(
      'zone',
      GOLD
    ),

    ...fbox([
      ['Tolerance bounds', GOLD],
      'Lower = 497 g',
      'Upper = 503 g',
      ['Fixed before seeing data', C.green]
    ], GOLD),

    ...say('TOLERANCE BOUNDS ARE FIXED IN ADVANCE', GOLD)
  );

  // ============================================================
  // 5. An ordinary test cannot establish equivalence merely
  // by failing to reject its equality null.
  // ============================================================

  await until(S(5));
  await play(
    ...scene([
      ['ordinary', ordinaryQuestion()]
    ]),

    ...fbox([
      'Ordinary test:',
      'H₀: mean = 500 g',
      'Can find evidence of drift.',
      ['Cannot show equivalence.', RED]
    ], RED),

    ...say('AN ORDINARY TEST CANNOT ESTABLISH NO MEANINGFUL DRIFT', RED)
  );

  // ============================================================
  // 6. Flip the stories.
  // ============================================================

  await until(S(6));
  await play(
    ...scene([
      ['stories', flippedStories()]
    ]),

    ...say('FLIP THE STORIES', GOLD)
  );

  // ============================================================
  // 7. The equivalence null says the mean is outside the
  // acceptable region, including its boundaries.
  // ============================================================

  await until(S(7));
  await play(
    ...scene([
      [
        'zone',
        safeZone(
          'null',
          false,
          false
        )
      ]
    ]),

    ...fbox([
      ['New H₀: not equivalent', RED],
      'mean ≤ 497 g',
      'OR',
      'mean ≥ 503 g'
    ], RED),

    ...say('NEW NULL: OUTSIDE THE SAFE ZONE', RED)
  );

  // ============================================================
  // 8. The equivalence alternative says the true mean is
  // strictly within the tolerance bounds.
  // ============================================================

  await until(S(8));
  await play(
    ...put(
      'zone',
      safeZone(
        'alternative',
        false,
        false
      )
    ),

    ...fbox([
      ['New H₁: equivalent', C.green],
      'mean > 497 g',
      'AND mean < 503 g',
      ['497 < mean < 503', C.green]
    ], C.green),

    ...say('NEW ALTERNATIVE: INSIDE THE SAFE ZONE', C.green)
  );

  // ============================================================
  // 9. To establish equivalence, reject the new null.
  // ============================================================

  await until(S(9));
  await play(
    ...scene([
      ['decision', rejectOutsidePicture()]
    ]),

    ...fbox([
      'Start with the new null.',
      'Require evidence against it.',
      ['Reject H₀ → equivalence', C.green]
    ], C.green),

    ...say('WE MUST REJECT THE NEW NULL', C.green)
  );

  // ============================================================
  // 10. Weigh 16 bottles after repair.
  // Observed batch mean = 500.5 g.
  // ============================================================

  await until(S(10));
  await play(
    ...scene([
      [
        'inspection',
        inspectionPicture(
          16,
          '500.5 g'
        )
      ]
    ]),

    ...fbox([
      'New sample after repair',
      ['n = 16 bottles', C.cyan],
      ['Batch mean = 500.5 g', C.cyan]
    ]),

    ...say('16 BOTTLES GIVE A MEAN OF 500.5 g')
  );

  // ============================================================
  // 11. Known SD remains 4 g, so SE remains 1 g.
  // ============================================================

  await until(S(11));
  await play(
    ...scene([
      ['se', sePicture(16)]
    ]),

    ...fbox([
      'SE = SD ÷ √n',
      '= 4 ÷ √16',
      '= 4 ÷ 4',
      ['= 1 g', C.cyan]
    ]),

    ...say('STANDARD ERROR IS STILL ONE GRAM')
  );

  // ============================================================
  // 12. Outside means too low OR too high.
  // Therefore perform two one-sided tests.
  // ============================================================

  await until(S(12));
  await play(
    ...scene([
      [
        'tests',
        twoTestsPicture(
          false,
          false
        )
      ]
    ]),

    ...fbox([
      'Outside = too low OR too high',
      'Test 1: rule out too low.',
      'Test 2: rule out too high.',
      ['Both must reject.', GOLD]
    ], GOLD),

    ...say('RUN TWO ONE-SIDED TESTS', C.violet)
  );

  // ============================================================
  // 13. Test one: is the mean above 497 g?
  // ============================================================

  await until(S(13));
  await play(
    ...scene([
      [
        'distance',
        edgeDistance(
          'lower',
          0
        )
      ]
    ]),

    ...fbox([
      ['TEST ONE', C.cyan],
      'Reference = 497 g',
      ['H₀: mean ≤ 497', RED],
      ['H₁: mean > 497', C.green]
    ]),

    ...say('TEST ONE: IS THE MEAN ABOVE 497 g?')
  );

  // ============================================================
  // 14. Distance from the lower bound to the sample mean.
  // 500.5 - 497 = 3.5 g.
  // ============================================================

  await until(S(14));
  await play(
    ...put(
      'distance',
      edgeDistance(
        'lower',
        1
      )
    ),

    ...fbox([
      'Distance from lower edge',
      '= 500.5 − 497',
      ['= +3.5 g', C.violet]
    ], C.violet),

    ...say('THREE AND A HALF GRAMS ABOVE THE LOWER EDGE', C.violet)
  );

  // ============================================================
  // 15. With SE = 1 g, the distance is 3.5 steps.
  // z = +3.5.
  // ============================================================

  await until(S(15));
  await play(
    ...put(
      'distance',
      edgeDistance(
        'lower',
        2
      )
    ),

    ...fbox([
      'z = (500.5 − 497) ÷ 1',
      '= 3.5 ÷ 1',
      ['= +3.5', C.violet]
    ], C.violet),

    ...say('LOWER TEST: z = +3.5', C.violet)
  );

  // ============================================================
  // 16. Right-sided p-value ≈ 0.0002.
  // Reject the lower component of the null.
  // ============================================================

  await until(S(16));
  await play(
    ...scene([
      [
        'normal',
        oneSidedGraph('lower')
      ]
    ]),

    ...fbox([
      'Right-sided p-value',
      'P(Z ≥ +3.5)',
      ['≈ 0.0002', C.violet],
      ['0.0002 < 0.05', C.green],
      'Reject the lower null.'
    ], C.green),

    ...say('LOWER TEST: p ≈ 0.0002 — VERY SMALL', C.green)
  );

  // ============================================================
  // 17. Test two: is the mean below 503 g?
  // ============================================================

  await until(S(17));
  await play(
    ...scene([
      [
        'distance',
        edgeDistance(
          'upper',
          0
        )
      ]
    ]),

    ...fbox([
      ['TEST TWO', C.violet],
      'Reference = 503 g',
      ['H₀: mean ≥ 503', RED],
      ['H₁: mean < 503', C.green]
    ], C.violet),

    ...say('TEST TWO: IS THE MEAN BELOW 503 g?', C.violet)
  );

  // ============================================================
  // 18. Distance between 500.5 and the upper edge is 2.5 g.
  // ============================================================

  await until(S(18));
  await play(
    ...put(
      'distance',
      edgeDistance(
        'upper',
        1
      )
    ),

    ...fbox([
      'Distance to upper edge',
      '= 503 − 500.5',
      ['= 2.5 g', C.violet]
    ], C.violet),

    ...say('TWO AND A HALF GRAMS FROM THE UPPER EDGE', C.violet)
  );

  // ============================================================
  // 19. The sample mean is below the reference.
  // Therefore the standardized departure has a negative sign.
  // ============================================================

  await until(S(19));
  await play(
    ...put(
      'distance',
      edgeDistance(
        'upper',
        2
      )
    ),

    ...fbox([
      'Observed mean − reference',
      '= 500.5 − 503',
      ['= −2.5 g', C.violet],
      'Below means negative.'
    ], C.violet),

    ...say('BELOW THE UPPER EDGE: USE A MINUS SIGN', C.violet)
  );

  // ============================================================
  // 20. z = -2.5; left-sided p ≈ 0.006.
  // ============================================================

  await until(S(20));
  await play(
    ...scene([
      [
        'normal',
        oneSidedGraph('upper')
      ]
    ]),

    ...fbox([
      'z = (500.5 − 503) ÷ 1',
      ['= −2.5', C.violet],
      'p = P(Z ≤ −2.5)',
      ['≈ 0.006', C.violet],
      ['Reject the upper null.', C.green]
    ], C.green),

    ...say('UPPER TEST: z = −2.5, p ≈ 0.006', C.green)
  );

  // ============================================================
  // 21. Both p-values are less than 0.05.
  // Both component null hypotheses are rejected.
  // ============================================================

  await until(S(21));
  await play(
    ...scene([
      ['pvalues', bothPValues()]
    ]),

    ...fbox([
      ['Lower p ≈ 0.0002 < 0.05', C.green],
      ['Upper p ≈ 0.006 < 0.05', C.green],
      'Both component nulls rejected.'
    ], C.green),

    ...say('BOTH p-VALUES ARE BELOW FIVE PERCENT', C.green)
  );

  // ============================================================
  // 22. Conclusion: evidence that the long-run mean is
  // within three grams of the target.
  // ============================================================

  await until(S(22));
  await play(
    ...scene([
      [
        'conclusion',
        equivalenceDecision(false)
      ]
    ]),

    ...fbox([
      ['Reject “too low”', C.green],
      ['Reject “too high”', C.green],
      '497 < true mean < 503',
      ['Equivalence demonstrated', C.green]
    ], C.green),

    ...say('THE MACHINE IS WITHIN THE AGREED TOLERANCE', C.green)
  );

  // ============================================================
  // 23. Name the method: equivalence test, or TOST.
  // ============================================================

  await until(S(23));
  await play(
    ...scene([
      ['tost', tostCard()]
    ]),

    ...fbox([
      ['Equivalence test', C.green],
      'TOST',
      'Two One-Sided Tests',
      'Both must reject.'
    ], C.green),

    ...say('TOST: TWO ONE-SIDED TESTS', C.green)
  );

  // ============================================================
  // 24. Introduce the confidence-interval picture.
  // ============================================================

  await until(S(24));
  await play(
    ...scene([
      [
        'confidence',
        confidencePicture(
          16,
          0
        )
      ]
    ]),

    ...say('ANOTHER PICTURE GIVES THE SAME ANSWER')
  );

  // ============================================================
  // 25. Draw a 90% confidence interval around the sample mean.
  // ============================================================

  await until(S(25));
  await play(
    ...put(
      'confidence',
      confidencePicture(
        16,
        1
      )
    ),

    ...fbox([
      ['90% confidence interval', C.cyan],
      'Centred on the sample mean',
      'Mean = 500.5 g'
    ]),

    ...say('DRAW A 90% CONFIDENCE INTERVAL')
  );

  // ============================================================
  // 26. Mean ± 1.645 standard errors.
  // SE = 1 g, so the margin is approximately 1.645 g.
  // ============================================================

  await until(S(26));
  await play(
    ...put(
      'confidence',
      confidencePicture(
        16,
        2
      )
    ),

    ...fbox([
      '90% CI = mean ± 1.645 × SE',
      '= 500.5 ± 1.645 × 1',
      ['= 500.5 ± 1.645 g', C.cyan]
    ]),

    ...say('500.5 PLUS OR MINUS 1.645 STANDARD ERRORS')
  );

  // ============================================================
  // 27. Calculate the interval endpoints.
  // Full-precision normal quantile gives the specified
  // rounded interval [498.86, 502.14].
  // ============================================================

  await until(S(27));
  await play(
    ...indicate(
      'confidence',
      C.cyan
    ),

    ...fbox([
      'Lower end ≈ 498.86 g',
      'Upper end ≈ 502.14 g',
      ['90% CI:', C.cyan],
      ['[498.86, 502.14]', C.cyan]
    ]),

    ...say('THE INTERVAL RUNS FROM ABOUT 498.9 TO 502.1 g')
  );

  // ============================================================
  // 28. Why 90%?
  // Each one-sided component uses a 5% tail.
  // The central confidence level is 1 - 2 × 0.05 = 0.90.
  // ============================================================

  await until(S(28));
  await play(
    ...scene([
      [
        'confidenceLevel',
        confidenceLevelGraph()
      ]
    ]),

    ...fbox([
      'Left tail = 5%',
      'Right tail = 5%',
      '100% − 5% − 5%',
      ['= 90% in the middle', C.green]
    ], GOLD),

    ...say('FIVE PLUS FIVE LEAVES NINETY PERCENT', GOLD)
  );

  // ============================================================
  // 29. Entire confidence interval inside the tolerance zone.
  // The confidence-interval method agrees with TOST.
  // ============================================================

  await until(S(29));
  await play(
    ...scene([
      [
        'confidence',
        confidencePicture(
          16,
          3
        )
      ]
    ]),

    ...fbox([
      '497 < 498.86',
      '502.14 < 503',
      ['Entire 90% CI inside', C.green],
      ['Equivalence shown', C.green]
    ], C.green),

    ...say('THE WHOLE INTERVAL FITS INSIDE THE SAFE ZONE', C.green)
  );

  // ============================================================
  // 30. Practical applications:
  // repair, new supplier, or cheaper part.
  // ============================================================

  await until(S(30));
  await play(
    ...scene([
      ['applications', applicationsPicture()]
    ]),

    ...fbox([
      'After a change:',
      'Repair, supplier, cheaper part.',
      'Is the difference small enough?',
      ['Test equivalence.', C.green]
    ], C.green),

    ...say('SHOW THAT A CHANGE MADE NO MEANINGFUL DIFFERENCE', C.green)
  );

  // ============================================================
  // 31. Trap: suppose only four bottles were weighed.
  // ============================================================

  await until(S(31));
  await play(
    ...scene([
      ['smallerSample', smallerSamplePicture()]
    ]),

    ...fbox([
      ['COMMON TRAP', RED],
      'Instead of 16 bottles,',
      ['suppose n = 4.', C.violet]
    ], RED),

    ...say('TRAP: WHAT IF WE WEIGHED ONLY FOUR BOTTLES?', RED)
  );

  // ============================================================
  // 32. Standard error with four bottles.
  // sqrt(4) = 2, so SE = 4 / 2 = 2 g.
  // ============================================================

  await until(S(32));
  await play(
    ...scene([
      ['se', sePicture(4)]
    ]),

    ...fbox([
      '√4 = 2',
      'SE = 4 ÷ √4',
      '= 4 ÷ 2',
      ['= 2 g', C.violet]
    ], C.violet),

    ...say('FOUR BOTTLES: STANDARD ERROR = TWO GRAMS', C.violet)
  );

  // ============================================================
  // 33. Same observed mean: 500.5 g.
  // Ordinary two-sided test against 500:
  // z = 0.25; p ≈ 0.80.
  // ============================================================

  await until(S(33));
  await play(
    ...scene([
      [
        'ordinarySmallSample',
        ordinarySmallSampleGraph()
      ]
    ]),

    ...fbox([
      'Ordinary test against 500 g',
      'z = (500.5 − 500) ÷ 2',
      ['= +0.25', C.violet],
      ['Two-sided p ≈ 0.80', C.violet],
      'Do not reject H₀.'
    ], C.violet),

    ...say('SAME MEAN, BUT ORDINARY p ≈ 0.80', C.violet)
  );

  // ============================================================
  // 34. Incorrect conclusion:
  // no evidence of drift therefore machine is fine.
  // ============================================================

  await until(S(34));
  await play(
    ...scene([
      ['trap', falseConclusionCard()]
    ]),

    ...fbox([
      'No evidence of drift',
      ['does NOT establish', RED],
      'that the machine is fine.'
    ], RED),

    ...say('NO EVIDENCE OF DRIFT DOES NOT PROVE EQUIVALENCE', RED)
  );

  // ============================================================
  // 35. With SE = 2 g, the 90% interval is wider:
  // [497.21, 503.79].
  // ============================================================

  await until(S(35));
  await play(
    ...scene([
      [
        'confidence',
        confidencePicture(
          4,
          2
        )
      ]
    ]),

    ...fbox([
      '90% CI = 500.5 ± 1.645 × 2',
      '= 500.5 ± 3.29',
      ['≈ [497.21, 503.79]', C.cyan]
    ]),

    ...say('THE INTERVAL IS NOW ABOUT 497.2 TO 503.8 g')
  );

  // ============================================================
  // 36. The upper confidence limit exceeds 503 g.
  // Equivalence is not demonstrated.
  // ============================================================

  await until(S(36));
  await play(
    ...put(
      'confidence',
      confidencePicture(
        4,
        3
      )
    ),

    ...fbox([
      'Upper tolerance = 503 g',
      ['Upper CI limit = 503.79 g', RED],
      '503.79 > 503',
      ['Equivalence NOT shown', RED]
    ], RED),

    ...say('THE INTERVAL POKES PAST THE UPPER BOUND', RED)
  );

  // ============================================================
  // 37. Too few data to establish equivalence.
  // The two confidence intervals have the same centre, but
  // the four-bottle interval is twice as wide.
  // ============================================================

  await until(S(37));
  await play(
    ...scene([
      [
        'comparison',
        intervalComparison()
      ]
    ]),

    ...fbox([
      'Same mean: 500.5 g',
      '16 bottles: equivalence shown',
      '4 bottles: too uncertain',
      ['No evidence ≠ no effect', RED]
    ], RED),

    ...say('NO EVIDENCE OF A DRIFT IS NOT EVIDENCE OF NO DRIFT', RED)
  );

  // ============================================================
  // 38. General equivalence-testing workflow.
  // Fix bounds first, then reject both components.
  // ============================================================

  await until(S(38));
  await play(
    ...scene([
      ['workflow', workflowPicture()]
    ]),

    ...fbox([
      'Before collecting data:',
      ['Fix the tolerance bounds.', GOLD],
      'Then run both one-sided tests.',
      ['Reject both to show equivalence.', C.green]
    ], C.green),

    ...say('FIX THE BOUNDS FIRST, THEN REJECT BOTH EDGES', C.green)
  );

  // ============================================================
  // 39. Close chapter 7.1.
  // Preview the comparison of means in chapter 7.2.
  // ============================================================

  await until(S(39));
  await play(
    ...scene([
      ['chapterRecap', chapterRecap()]
    ]),

    ...fbox([
      ['Chapter 7.1 complete', C.green],
      'How a test works',
      'From hypotheses to equivalence.',
      ['Next: comparing means', GOLD]
    ], C.green),

    ...say('NEXT CHAPTER: COMPARING MEANS', GOLD)
  );

  // ============================================================
  // 40. Final recap.
  //
  // An equivalence test establishes that the long-run mean
  // is within agreed bounds by rejecting both "too low"
  // and "too high" at the chosen significance level.
  // ============================================================

  await until(S(40));
  await play(
    ...scene([
      ['recap', finalRecap()]
    ]),

    ...fbox([
      ['Equivalence test', C.green],
      'Fix meaningful bounds first.',
      'Reject “too low”.',
      'Reject “too high”.',
      ['90% CI entirely inside', C.green]
    ], C.green),

    ...say('EQUIVALENCE MEANS REJECTING BOTH TOO LOW AND TOO HIGH', C.green)
  );
}
