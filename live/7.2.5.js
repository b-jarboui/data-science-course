// lesson 7.2.5
// Chi-square distributions: square the standard scores and add them.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // PHONE STAGE: on the phone the picture is enlarged and moved down into the
  // middle of the frame; the pill sits under the title and the formula card at
  // the bottom. Each new picture object is mapped once, when it first appears
  // (FadeIn / Create / Transform target). Cards are marked so they are skipped.
  const M0 = L.M;
  const SK = 1.14, SY0 = 1.6, SY1 = 3.3;
  const hasStaged = m => !!m && (m.__st || (m.submobjects || []).some(hasStaged));
  const markStaged = m => { m.__st = true; (m.submobjects || []).forEach(markStaged); };
  function stage(m) {
    if (!P || !m || m.__st) return m;
    if (hasStaged(m)) { (m.submobjects || []).forEach(stage); m.__st = true; return m; }
    m.scale(SK, { aboutPoint: [0, SY0, 0] });
    const c = m.getCenter();
    m.moveTo([c[0], c[1] + SY1 - SY0, c[2]]);
    markStaged(m);
    return m;
  }
  const M = !P ? M0 : {
    ...M0,
    FadeIn: class extends M0.FadeIn { constructor(m, o) { super(stage(m), o); } },
    Create: class extends M0.Create { constructor(m, o) { super(stage(m), o); } },
    Transform: class extends M0.Transform { constructor(a, b, o) { super(a, stage(b), o); } }
  };

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Healthy battery population:
  // true mean = 20 hours, true standard deviation = 2 hours.
  //
  // Three independent battery readings: 22, 16, 21.
  // Standard scores: +1, -2, +0.5.
  // Squared scores: 1, 4, 0.25.
  // Chi-square statistic: 5.25.
  // Degrees of freedom: 3.
  // Expected value of chi-square(3): 3.
  // Upper-tail probability at 5.25 ≈ 0.15.
  // Upper five-percent cutoff ≈ 7.81.
  // ------------------------------------------------------------

  const HOURS = [22, 16, 21];

  const MU = 20;
  const SIGMA = 2;

  const Z = HOURS.map(v => (v - MU) / SIGMA);
  const Z2 = Z.map(v => v * v);

  const CHI = Z2.reduce((s, v) => s + v, 0);
  const DF = Z.length;

  const EXPECTED = DF;
  const CRIT = 7.814728;
  const PVALUE = 0.1544;

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const VIOLET = C.violet;
  const GREEN = C.green;

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22, content between y = -5.5 and 4.3.
  // Laptop: 14.22 × 8, content between y = -3.0 and 2.3.
  // Formula box above the picture on phone, right on laptop.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, -6.55, 0]  // phone: bottom edge of the card
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const say = (s, color = BLUE) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Based on the approved arithmetic-mean lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = BLUE) {
    const big4 = P && lines.length >= 4;
    const size = P ? (big4 ? 20 : 22) : 21;
    const lh = P ? (big4 ? 0.39 : 0.44) : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const maxw = P ? FW - 1.2 : 4.0;
    const factor = Math.min(1, maxw / wd);

    const pos = [
      BOXP[0],
      P ? BOXP[1] + ht * factor / 2 : BOXP[1],
      0
    ];

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pos);

    const left = pos[0] - wd / 2 + 0.35;
    const top = pos[1] + ht / 2 - 0.2 - lh / 2;

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

    if (factor < 1) {
      g.scale(factor);
      g.moveTo(pos);
    }

    markStaged(g);
    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const animations = [new M.FadeOut(boxNow)];

    boxNow = null;

    return animations;
  }

  // ------------------------------------------------------------
  // VISUAL HELPERS
  // ------------------------------------------------------------

  const pt = (x, y) => [x, y, 0];

  function txt(
    s, x, y,
    color = C.ink,
    size = 20,
    mono = false,
    maxw = W
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function tag(
    s, x, y,
    color = BLUE,
    size = 17,
    maxw = W
  ) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0.8,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function outline(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    color = BLUE,
    radius = 0.13
  ) {
    const halo = new M.Dot({
      point: pt(x, y),
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function arrow(
    x1, y1, x2, y2,
    color = GOLD,
    head = 0.15,
    sw = 2.5
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(
        x1, y1,
        x2, y2,
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a - Math.PI / 5),
        y2 - head * Math.sin(a - Math.PI / 5),
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a + Math.PI / 5),
        y2 - head * Math.sin(a + Math.PI / 5),
        color, sw
      )
    );
  }

  function bracket(
    x1, x2, y,
    color = GOLD,
    cap = 0.12
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),

      line(
        x1, y - cap,
        x1, y + cap,
        color, 2
      ),

      line(
        x2, y - cap,
        x2, y + cap,
        color, 2
      )
    );
  }

  function vBracket(
    x, y1, y2,
    color = GOLD,
    cap = 0.12
  ) {
    return new M.VGroup(
      line(x, y1, x, y2, color, 3),

      line(
        x - cap, y1,
        x + cap, y1,
        color, 2
      ),

      line(
        x - cap, y2,
        x + cap, y2,
        color, 2
      )
    );
  }

  const signed = v =>
    v < 0
      ? `−${Math.abs(v)}`
      : v > 0
        ? `+${v}`
        : '0';

  // Track only top-level objects currently on screen.
  // Never regroup already-visible objects to highlight them.

  let picture = [];

  function add(...objects) {
    picture.push(...objects);

    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    const active = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !active.includes(o)
    );

    return active.map(o => new M.FadeOut(o));
  }

  function replace(...objects) {
    const animations = picture.map(
      o => new M.FadeOut(o)
    );

    picture = objects.slice();

    return [
      ...animations,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // BATTERY ICON
  // ------------------------------------------------------------

  function battery(
    x, y,
    color = BLUE,
    width = 0.72,
    height = 1.25
  ) {
    const shell = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.11,
      color,
      strokeWidth: 2
    });

    shell.setFill(C.card, 0.85);
    shell.moveTo(pt(x, y));

    const cap = rect(
      x,
      y + height / 2 + 0.06,
      width * 0.36,
      0.12,
      color, 1
    );

    const glow = rect(
      x, y,
      width - 0.08,
      height - 0.10,
      color, 0.14, 0
    );

    const fill = rect(
      x, y,
      width - 0.16,
      height - 0.18,
      color, 0.84, 0
    );

    return new M.VGroup(
      shell,
      cap,
      glow,
      fill
    );
  }

  // ------------------------------------------------------------
  // PROBABILITY DENSITIES
  //
  // These curves are mathematical reference curves.
  // The histogram later in the lesson uses actual simulated
  // independent standard-normal scores.
  // ------------------------------------------------------------

  function gamma(z) {
    const coefficients = [
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9.984369578019572e-6,
      1.5056327351493116e-7
    ];

    if (z < 0.5) {
      return Math.PI /
        (
          Math.sin(Math.PI * z) *
          gamma(1 - z)
        );
    }

    z -= 1;

    let x = 0.9999999999998099;

    for (let k = 0; k < coefficients.length; k++) {
      x += coefficients[k] / (z + k + 1);
    }

    const t =
      z + coefficients.length - 0.5;

    return Math.sqrt(2 * Math.PI) *
      Math.pow(t, z + 0.5) *
      Math.exp(-t) *
      x;
  }

  function normalPDF(x, mean = 0, sd = 1) {
    const z = (x - mean) / sd;

    return Math.exp(-z * z / 2) /
      (sd * Math.sqrt(2 * Math.PI));
  }

  function chiPDF(x, df = DF) {
    if (x <= 0) return 0;

    const a = df / 2;

    return Math.pow(x, a - 1) *
      Math.exp(-x / 2) /
      (Math.pow(2, a) * gamma(a));
  }

  function sampledCurve(
    xmap,
    ymap,
    lo,
    hi,
    color = BLUE,
    strokeWidth = 3,
    samples = 120
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const a = lo + (hi - lo) * k / samples;
      const b = lo + (hi - lo) * (k + 1) / samples;

      parts.push(
        line(
          xmap(a), ymap(a),
          xmap(b), ymap(b),
          color, strokeWidth
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0: FROM COMPARING MEANS TO COMPARING SPREADS
  // ------------------------------------------------------------

  const introY = P ? -0.3 : 0.24;
  const introLowerY = P ? -3.3 : -1.57;

  function meanComparisonPicture(y) {
    const parts = [
      line(
        CX - 2.75, y - 0.30,
        CX + 2.75, y - 0.30,
        C.muted, 2
      )
    ];

    const leftCenter = CX - 1.38;
    const rightCenter = CX + 1.38;

    [-0.45, -0.15, 0.15, 0.45].forEach(v => {
      parts.push(
        dot(leftCenter + v, y, BLUE, 0.10),
        dot(rightCenter + v, y, GOLD, 0.10)
      );
    });

    parts.push(
      arrow(
        leftCenter,
        y + 0.43,
        rightCenter,
        y + 0.43,
        GREEN
      ),

      txt(
        'COMPARE MEANS',
        CX,
        y + 0.84,
        GREEN, 18
      )
    );

    return new M.VGroup(...parts);
  }

  function spreadComparisonPicture(y) {
    const parts = [
      line(
        CX - 2.75, y - 0.32,
        CX + 2.75, y - 0.32,
        C.muted, 2
      )
    ];

    [-0.49, -0.16, 0.16, 0.49].forEach(v => {
      parts.push(
        dot(
          CX - 1.4 + v,
          y,
          BLUE, 0.105
        )
      );
    });

    [-1.08, -0.36, 0.36, 1.08].forEach(v => {
      parts.push(
        dot(
          CX + 1.4 + v,
          y,
          C.pink || '#f472b6',
          0.105
        )
      );
    });

    parts.push(
      bracket(
        CX - 1.89,
        CX - 0.91,
        y + 0.38,
        BLUE, 0.08
      ),

      bracket(
        CX + 0.32,
        CX + 2.48,
        y + 0.38,
        C.pink || '#f472b6',
        0.08
      ),

      txt(
        'COMPARE SPREADS',
        CX,
        y + 0.82,
        VIOLET, 18
      )
    );

    return new M.VGroup(...parts);
  }

  const introMeans =
    meanComparisonPicture(introY);

  const introSpreads =
    spreadComparisonPicture(introLowerY);

  await until(S(0));
  await play(
    ...add(introMeans, introSpreads),
    ...(P ? fbox([
      'so far: compare means',
      ['soon: compare spreads', VIOLET],
      ['and many means at once', VIOLET]
    ], VIOLET) : []),
    ...say('FROM MEANS TO SPREADS')
  );

  // ------------------------------------------------------------
  // 1: TWO NEW REFERENCE CURVES
  //
  // Introduce their silhouettes without teaching F yet.
  // The chi-square curve is highlighted.
  // ------------------------------------------------------------

  const previewY = P ? -1.4 : -0.75;

  function miniReference(
    x, y,
    color,
    fn,
    label
  ) {
    const width = 2.70;
    const x0 = x - width / 2;
    const base = y - 0.67;

    const xx = v => x0 + v / 12 * width;
    const yy = v => base + fn(v) * 1.30;

    return new M.VGroup(
      outline(
        x, y,
        2.98, 2.45,
        color, 0.035
      ),

      line(
        x0, base,
        x0 + width, base,
        C.muted, 1.5
      ),

      sampledCurve(
        xx, yy,
        0, 12,
        color, 2.5, 55
      ),

      txt(
        label,
        x,
        y + 0.87,
        color, 16,
        false, 2.70
      )
    );
  }

  // F(3, 3) preview: exact density up to plotting scale.
  function fPreview(x) {
    if (x <= 0) return 0;

    return (
      gamma(3) /
      (gamma(1.5) * gamma(1.5))
    ) *
      Math.sqrt(x) /
      Math.pow(1 + x, 3);
  }

  const firstReference = miniReference(
    CX - 1.65,
    previewY,
    BLUE,
    v => chiPDF(v, 3) * 4.0,
    'CHI-SQUARE'
  );

  const secondReference = miniReference(
    CX + 1.65,
    previewY,
    C.muted,
    v => fPreview(v) * 1.7,
    'F CURVE: NEXT'
  );

  const buildFirst = tag(
    'BUILD THIS ONE FIRST',
    CX - 1.65,
    previewY - 1.60,
    BLUE, 16,
    2.95
  );

  await until(S(1));
  await play(
    ...replace(
      firstReference,
      secondReference,
      buildFirst
    ),
    ...fbox([
      'new reference curves',
      ['chi-square', BLUE],
      ['F: next lesson', C.muted]
    ]),
    ...say('BUILD A NEW REFERENCE CURVE')
  );

  // ------------------------------------------------------------
  // 2: THE FACTORY KNOWS ITS HEALTHY BATTERIES
  // ------------------------------------------------------------

  const healthyY = P ? -1.5 : -0.45;

  const healthyBattery = battery(
    CX,
    healthyY,
    BLUE,
    1.13, 1.86
  );

  const healthyTag = tag(
    'HEALTHY BATTERY',
    CX,
    healthyY - 1.45,
    GREEN, 19
  );

  const healthyKnown = txt(
    'FACTORY KNOWS THE TRUE MEAN AND SPREAD',
    CX,
    healthyY + 1.48,
    C.muted, 16
  );

  await until(S(2));
  await play(
    ...replace(
      healthyBattery,
      healthyTag,
      healthyKnown
    ),
    ...(P ? fbox([
      'imagine a factory',
      ['that knows its healthy', GREEN],
      ['batteries well', GREEN]
    ], GREEN) : clearBox()),
    ...say('IMAGINE A WELL-UNDERSTOOD FACTORY BATCH')
  );

  // ------------------------------------------------------------
  // HOURS NUMBER LINE
  // Healthy battery hours range is shown from 12 to 28.
  // Two-hour tick spacing = one true standard deviation.
  // ------------------------------------------------------------

  const HMIN = 12;
  const HMAX = 28;

  const HW = P ? 6.50 : 6.65;

  const HY = P ? -2.80 : -1.62;

  const hx = v =>
    CX - HW / 2 +
    (v - HMIN) / (HMAX - HMIN) * HW;

  function hoursAxis() {
    const parts = [
      line(
        hx(HMIN), HY,
        hx(HMAX), HY,
        C.muted, 3
      )
    ];

    for (let v = HMIN; v <= HMAX; v += 2) {
      const color =
        v === MU ? GOLD : C.muted;

      parts.push(
        line(
          hx(v), HY - 0.07,
          hx(v), HY + 0.07,
          color, 1.8
        ),

        txt(
          String(v),
          hx(v),
          HY - 0.30,
          color, 16, true,
          0.56
        )
      );
    }

    parts.push(
      txt(
        'battery life in hours',
        CX,
        HY - 0.72,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function healthyMeanMarker() {
    return new M.VGroup(
      dashed(
        hx(MU), HY + 0.10,
        hx(MU), HY + 1.15,
        GOLD
      ),

      tag(
        'TRUE MEAN: 20',
        hx(MU),
        HY + 1.50,
        GOLD, 16
      )
    );
  }

  function healthySpreadMarker() {
    return new M.VGroup(
      bracket(
        hx(MU),
        hx(MU + SIGMA),
        HY + 0.43,
        GREEN,
        0.09
      ),

      txt(
        '2 hours',
        (hx(MU) + hx(MU + SIGMA)) / 2 + 0.22,
        HY + 0.74,
        GREEN, 17, true
      )
    );
  }

  // ------------------------------------------------------------
  // 3: TRUE MEAN = 20, TRUE SPREAD = 2
  // ------------------------------------------------------------

  const healthyAxis = hoursAxis();

  const healthyMean = healthyMeanMarker();
  const healthySpread = healthySpreadMarker();

  await until(S(3));
  await play(
    ...replace(
      healthyAxis,
      healthyMean,
      healthySpread
    ),
    ...fbox([
      ['true mean = 20 hours', GOLD],
      ['true SD = 2 hours', GREEN]
    ]),
    ...say('HEALTHY BATTERIES: 20 HOURS, SPREAD 2')
  );

  // ------------------------------------------------------------
  // 4: ASSUME A BELL-SHAPED POPULATION
  // ------------------------------------------------------------

  const HEALTH_SCALE = P ? 16.8 : 12.2;

  const healthyCurveY = v =>
    HY + normalPDF(v, MU, SIGMA) * HEALTH_SCALE;

  const healthyBell = sampledCurve(
    hx,
    healthyCurveY,
    HMIN,
    HMAX,
    BLUE,
    3.2,
    120
  );

  const bellCenter = dashed(
    hx(MU),
    HY,
    hx(MU),
    healthyCurveY(MU),
    GOLD
  );

  const bellTag = tag(
    'NORMAL POPULATION',
    CX,
    P ? 1.28 : 1.33,
    BLUE, 16
  );

  await until(S(4));
  await play(
    ...remove(healthyMean, healthySpread),
    ...add(
      healthyBell,
      bellCenter,
      bellTag
    ),
    ...fbox([
      'healthy battery hours',
      ['assumed bell-shaped', BLUE],
      'mean 20; SD 2'
    ]),
    ...say('ASSUME A NORMAL, BELL-SHAPED POPULATION')
  );

  // ------------------------------------------------------------
  // 5: THREE ACTUAL BATTERY READINGS
  // 22, 16, 21.
  // ------------------------------------------------------------

  function readingMarker(v, k) {
    const y = HY + 0.18;

    // Separate labels vertically where 21 and 22 are adjacent.
    const labelY = k === 0
      ? HY + 0.93
      : HY + 0.50;

    const labelX = k === 0
      ? hx(v) + 0.18
      : hx(v) - (k === 2 ? 0.12 : 0);

    return new M.VGroup(
      dot(
        hx(v),
        y,
        BLUE, 0.12
      ),

      line(
        hx(v), y + 0.14,
        labelX, labelY - 0.16,
        BLUE, 1.2
      ),

      txt(
        `${v}`,
        labelX,
        labelY,
        BLUE, 19, true
      )
    );
  }

  const measuredDots = HOURS.map(
    (v, k) => readingMarker(v, k)
  );

  await until(S(5));

  picture.push(...measuredDots);

  await play(
    new M.LaggedStart(
      measuredDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.26,
        runTime: 1.7
      }
    ),
    ...fbox([
      'three measured batteries',
      ['22, 16, 21 hours', BLUE]
    ]),
    ...say('THREE READINGS: 22, 16, 21 HOURS')
  );

  // ------------------------------------------------------------
  // STANDARD SCORE PICTURE
  //
  // Upper axis: actual hours.
  // Lower axis: standard scores.
  // Both axes are aligned so 20 hours corresponds to z = 0,
  // and every two-hour step corresponds to one standard score.
  // ------------------------------------------------------------

  const SCORE_TOP = P ? 0.07 : 0.53;
  const SCORE_BOTTOM = P ? -2.38 : -1.49;

  const SW = P ? 6.30 : 6.50;

  const sx = z =>
    CX + z / 4 * SW / 2;

  const shx = h =>
    sx((h - MU) / SIGMA);

  function scoreAxes() {
    const parts = [
      line(
        sx(-4), SCORE_TOP,
        sx(4), SCORE_TOP,
        C.muted, 2.5
      ),

      line(
        sx(-4), SCORE_BOTTOM,
        sx(4), SCORE_BOTTOM,
        C.muted, 2.5
      ),

      dashed(
        sx(0), SCORE_BOTTOM + 0.10,
        sx(0), SCORE_TOP - 0.11,
        GOLD
      )
    ];

    for (let v = -4; v <= 4; v++) {
      const color =
        v === 0 ? GOLD : C.muted;

      parts.push(
        line(
          sx(v), SCORE_TOP - 0.07,
          sx(v), SCORE_TOP + 0.07,
          color
        ),

        txt(
          String(MU + SIGMA * v),
          sx(v),
          SCORE_TOP - 0.28,
          color, 15, true,
          0.53
        ),

        line(
          sx(v), SCORE_BOTTOM - 0.07,
          sx(v), SCORE_BOTTOM + 0.07,
          color
        ),

        txt(
          signed(v),
          sx(v),
          SCORE_BOTTOM - 0.29,
          color, 15, true,
          0.58
        )
      );
    }

    parts.push(
      txt(
        'HOURS',
        CX,
        SCORE_TOP + 0.95,
        C.muted, 16
      ),

      txt(
        'STANDARD SCORES',
        CX,
        SCORE_BOTTOM - 0.75,
        GREEN, 17
      )
    );

    return new M.VGroup(...parts);
  }

  function rawScoreDot(k) {
    const v = HOURS[k];

    return dot(
      shx(v),
      SCORE_TOP + 0.25,
      BLUE,
      0.11
    );
  }

  function standardizedDot(k) {
    return dot(
      sx(Z[k]),
      SCORE_BOTTOM + 0.18,
      GREEN,
      0.115
    );
  }

  function scoreConnector(k) {
    const x = sx(Z[k]);

    return dashed(
      x,
      SCORE_TOP - 0.48,
      x,
      SCORE_BOTTOM + 0.38,
      VIOLET
    );
  }

  function scoreBadge(k) {
    const x = sx(Z[k]);

    let offset = 0;

    if (k === 0) offset = 0.27;
    if (k === 2) offset = -0.30;

    const y = k === 2
      ? SCORE_BOTTOM + 0.96
      : SCORE_BOTTOM + 0.48;

    return tag(
      signed(Z[k]),
      x + offset,
      y,
      GREEN, 16,
      0.90
    );
  }

  // ------------------------------------------------------------
  // 6: DISTANCE FROM 20, COUNTED IN TWO-HOUR STEPS
  // ------------------------------------------------------------

  const standardizedAxes = scoreAxes();

  const rawDots = HOURS.map(
    (_, k) => rawScoreDot(k)
  );

  const stepSize = bracket(
    sx(0), sx(1),
    SCORE_TOP + 0.58,
    GOLD,
    0.075
  );

  const stepLabel = txt(
    '2 h = 1 step',
    CX + 1.90,
    SCORE_TOP + 0.59,
    GOLD, 16,
    true, 2.05
  );

  await until(S(6));
  await play(
    ...replace(
      standardizedAxes,
      ...rawDots,
      stepSize,
      stepLabel
    ),
    ...fbox([
      'standard score',
      '= (hours − 20) ÷ 2',
      ['distance in spreads', GREEN]
    ], GREEN),
    ...say('COUNT DISTANCE IN TWO-HOUR STEPS', GREEN)
  );

  // ------------------------------------------------------------
  // 7: 22 HOURS GIVES A STANDARD SCORE OF +1
  // ------------------------------------------------------------

  const connectorOne = scoreConnector(0);
  const zDotOne = standardizedDot(0);
  const zBadgeOne = scoreBadge(0);

  const firstGap = arrow(
    sx(0),
    SCORE_TOP + 0.53,
    sx(1),
    SCORE_TOP + 0.53,
    GOLD,
    0.12
  );

  await until(S(7));
  await play(
    ...remove(stepSize, stepLabel),
    ...add(
      firstGap,
      connectorOne,
      zDotOne,
      zBadgeOne
    ),
    new M.Indicate(rawDots[0], {
      color: GOLD
    }),
    ...fbox([
      '22 − 20 = +2 hours',
      '+2 ÷ 2',
      ['z = +1', GREEN]
    ], GREEN),
    ...say('22 HOURS: ONE SPREAD ABOVE', GREEN)
  );

  // ------------------------------------------------------------
  // 8: 16 HOURS GIVES A STANDARD SCORE OF -2
  // ------------------------------------------------------------

  const connectorTwo = scoreConnector(1);
  const zDotTwo = standardizedDot(1);
  const zBadgeTwo = scoreBadge(1);

  const secondGap = arrow(
    sx(0),
    SCORE_TOP + 0.53,
    sx(-2),
    SCORE_TOP + 0.53,
    GOLD,
    0.13
  );

  await until(S(8));
  await play(
    ...remove(firstGap),
    ...add(
      secondGap,
      connectorTwo,
      zDotTwo,
      zBadgeTwo
    ),
    new M.Indicate(rawDots[1], {
      color: GOLD
    }),
    ...fbox([
      '16 − 20 = −4 hours',
      '−4 ÷ 2',
      ['z = −2', GREEN]
    ], GREEN),
    ...say('16 HOURS: TWO SPREADS BELOW', GREEN)
  );

  // ------------------------------------------------------------
  // 9: 21 HOURS GIVES A STANDARD SCORE OF +0.5
  // ------------------------------------------------------------

  const connectorThree = scoreConnector(2);
  const zDotThree = standardizedDot(2);
  const zBadgeThree = scoreBadge(2);

  const thirdGap = arrow(
    sx(0),
    SCORE_TOP + 0.53,
    sx(0.5),
    SCORE_TOP + 0.53,
    GOLD,
    0.085
  );

  await until(S(9));
  await play(
    ...remove(secondGap),
    ...add(
      thirdGap,
      connectorThree,
      zDotThree,
      zBadgeThree
    ),
    ...fbox([
      '21 − 20 = +1 hour',
      '+1 ÷ 2',
      ['z = +0.5', GREEN]
    ], GREEN),
    ...say('21 HOURS: HALF A SPREAD ABOVE', GREEN)
  );

  // ------------------------------------------------------------
  // 10: ONE NUMBER FOR ALL THREE DISTANCES
  // ------------------------------------------------------------

  const TILEY = P ? -0.15 : -0.26;
  const TILESP = P ? 1.87 : 1.91;

  const tileX = k =>
    CX + (k - 1) * TILESP;

  function scoreTile(
    k,
    color = BLUE
  ) {
    const x = tileX(k);

    return new M.VGroup(
      outline(
        x,
        TILEY,
        1.62, 1.54,
        color, 0.075
      ),

      txt(
        `${HOURS[k]} h`,
        x,
        TILEY + 0.44,
        C.muted, 16, true
      ),

      txt(
        signed(Z[k]),
        x,
        TILEY - 0.06,
        color, 29, true,
        1.44
      ),

      txt(
        `battery ${k + 1}`,
        x,
        TILEY - 0.51,
        C.muted, 14
      )
    );
  }

  const scoreTiles = Z.map(
    (_, k) => scoreTile(k)
  );

  const totalQuestion = tag(
    'ONE NUMBER FOR ALL THREE?',
    CX,
    TILEY - 1.55,
    VIOLET, 18
  );

  await until(S(10));
  await play(
    ...replace(
      ...scoreTiles,
      totalQuestion
    ),
    ...fbox([
      'standard scores',
      '+1, −2, +0.5',
      ['how far off altogether?', VIOLET]
    ], VIOLET),
    ...say('COMBINE THE THREE DISTANCES', VIOLET)
  );

  // ------------------------------------------------------------
  // 11: WHY SIMPLE ADDITION FAILS
  //
  // Signed scores cancel:
  // +1 - 2 + 0.5 = -0.5.
  //
  // The total looks small even though the individual
  // distances are not all small.
  // ------------------------------------------------------------

  const cancelY = P ? -0.25 : -0.32;

  const cancelScale = 1.22;

  const cancelAxis = line(
    CX - 2.95,
    cancelY,
    CX + 2.95,
    cancelY,
    C.muted, 2
  );

  const cancelZero = dashed(
    CX,
    cancelY - 1.00,
    CX,
    cancelY + 1.19,
    C.muted
  );

  const cancelZeroLabel = txt(
    '0',
    CX,
    cancelY - 1.28,
    C.muted, 17, true
  );

  const signedArrowOne = arrow(
    CX,
    cancelY + 0.72,
    CX + cancelScale,
    cancelY + 0.72,
    GREEN
  );

  const signedArrowTwo = arrow(
    CX + cancelScale,
    cancelY + 0.14,
    CX - cancelScale,
    cancelY + 0.14,
    GOLD
  );

  const signedArrowThree = arrow(
    CX - cancelScale,
    cancelY - 0.49,
    CX - 0.5 * cancelScale,
    cancelY - 0.49,
    GREEN,
    0.12
  );

  const signedArrowLabels = [
    txt(
      '+1',
      CX + cancelScale / 2,
      cancelY + 1.03,
      GREEN, 18, true
    ),

    txt(
      '−2',
      CX,
      cancelY + 0.39,
      GOLD, 18, true
    ),

    txt(
      '+0.5',
      CX - 0.75 * cancelScale,
      cancelY - 0.77,
      GREEN, 17, true
    )
  ];

  const cancellationResult = tag(
    'TOTAL = −0.5',
    CX,
    P ? -2.61 : -2.08,
    GOLD, 19
  );

  await until(S(11));
  await play(
    ...replace(
      cancelAxis,
      cancelZero,
      cancelZeroLabel,
      signedArrowOne,
      signedArrowTwo,
      signedArrowThree,
      ...signedArrowLabels,
      cancellationResult
    ),
    ...fbox([
      '+1 − 2 + 0.5 = −0.5',
      ['signs cancel out', GOLD],
      'distances get hidden'
    ], GOLD),
    ...say('PLUS AND MINUS CANCEL EACH OTHER', GOLD)
  );

  // ------------------------------------------------------------
  // 12: SQUARING MAKES EVERY DISTANCE NONNEGATIVE
  //
  // Draw genuine square areas:
  // side 1   → area 1
  // side 2   → area 4
  // side 0.5 → area 0.25
  //
  // All squares use the same geometric scale.
  // ------------------------------------------------------------

  const SQ_BASE = P ? -2.46 : -1.77;

  const SQ_UNIT = P ? 0.87 : 0.82;

  const SQ_SP = P ? 1.96 : 2.0;

  const squareX = k =>
    CX + (k - 1) * SQ_SP;

  const SQ_HEADER = P ? 0.90 : 1.13;

  function squareHeader(k) {
    const s = signed(Z[k]);

    return new M.VGroup(
      txt(
        `(${s})²`,
        squareX(k),
        SQ_HEADER,
        BLUE, 22, true,
        1.80
      ),

      txt(
        '× itself',
        squareX(k),
        SQ_HEADER - 0.40,
        C.muted, 16
      )
    );
  }

  function squareArea(k) {
    const z = Math.abs(Z[k]);
    const side = SQ_UNIT * z;

    const x = squareX(k);
    const y = SQ_BASE + side / 2;

    const parts = [
      rect(
        x,
        y,
        side,
        side,
        VIOLET,
        0.76,
        2
      )
    ];

    // Show the four unit squares inside the area for z = -2.
    if (z === 2) {
      parts.push(
        line(
          x,
          SQ_BASE,
          x,
          SQ_BASE + side,
          C.card, 2
        ),

        line(
          x - side / 2,
          SQ_BASE + side / 2,
          x + side / 2,
          SQ_BASE + side / 2,
          C.card, 2
        )
      );
    }

    parts.push(
      txt(
        `${Z2[k]}`,
        x,
        SQ_BASE - 0.36,
        VIOLET, 23, true,
        1.70
      ),

      txt(
        `${z} × ${z}`,
        x,
        SQ_BASE + side + 0.25,
        C.muted, 15, true,
        1.80
      )
    );

    return new M.VGroup(...parts);
  }

  const sqHeaders = Z.map(
    (_, k) => squareHeader(k)
  );

  const squareFloor = line(
    CX - 3.00,
    SQ_BASE,
    CX + 3.00,
    SQ_BASE,
    C.muted, 2
  );

  const squareQuestion = tag(
    'SQUARE EACH SCORE',
    CX,
    P ? -3.66 : -2.63,
    VIOLET, 17
  );

  await until(S(12));
  await play(
    ...replace(
      ...sqHeaders,
      squareFloor,
      squareQuestion
    ),
    ...fbox([
      'square = number × itself',
      'negative × negative',
      ['gives a positive result', VIOLET]
    ], VIOLET),
    ...say('SQUARED DISTANCES CANNOT BE NEGATIVE', VIOLET)
  );

  // ------------------------------------------------------------
  // 13: ONE SQUARED IS ONE
  // ------------------------------------------------------------

  const areaOne = squareArea(0);

  await until(S(13));
  await play(
    ...add(areaOne),
    ...fbox([
      '(+1) × (+1)',
      ['= 1', VIOLET]
    ], VIOLET),
    ...say('1² = 1', VIOLET)
  );

  // ------------------------------------------------------------
  // 14: MINUS TWO SQUARED IS FOUR
  // ------------------------------------------------------------

  const areaTwo = squareArea(1);

  await until(S(14));
  await play(
    ...add(areaTwo),
    ...fbox([
      '(−2) × (−2)',
      ['= 4', VIOLET]
    ], VIOLET),
    ...say('(−2)² = 4', VIOLET)
  );

  // ------------------------------------------------------------
  // 15: ONE HALF SQUARED IS ONE QUARTER
  // ------------------------------------------------------------

  const areaThree = squareArea(2);

  await until(S(15));
  await play(
    ...add(areaThree),
    ...fbox([
      '0.5 × 0.5',
      ['= 0.25', VIOLET]
    ], VIOLET),
    ...say('0.5² = 0.25', VIOLET)
  );

  // ------------------------------------------------------------
  // 16: TURN THE THREE SQUARED VALUES INTO BLOCKS
  //
  // Equal block widths.
  // Block heights proportional to squared scores.
  // Each unit of height represents one squared standard score.
  // ------------------------------------------------------------

  const BLOCK_BASE = P ? -3.62 : -2.02;

  const BLOCK_UNIT = P ? 0.77 : 0.60;

  const BLOCK_W = P ? 0.94 : 0.87;

  const blockX = k =>
    CX + (k - 1) * 1.92;

  const blockColors = [
    BLUE,
    VIOLET,
    GOLD
  ];

  const blockParts = Z2.map((v, k) =>
    rect(
      blockX(k),
      BLOCK_BASE + v * BLOCK_UNIT / 2,
      BLOCK_W,
      v * BLOCK_UNIT,
      blockColors[k],
      0.82,
      1.5
    )
  );

  const blockLabels = Z2.map((v, k) =>
    txt(
      String(v),
      blockX(k),
      BLOCK_BASE + v * BLOCK_UNIT + 0.30,
      blockColors[k],
      20, true
    )
  );

  const blockIds = Z.map((_, k) =>
    txt(
      `B${k + 1}`,
      blockX(k),
      BLOCK_BASE - 0.31,
      C.muted, 16, true
    )
  );

  const blockFloor = line(
    CX - 2.85,
    BLOCK_BASE,
    CX + 2.85,
    BLOCK_BASE,
    C.muted, 2
  );

  const blockKey = txt(
    'HEIGHT = SQUARED SCORE',
    CX,
    BLOCK_BASE - 0.75,
    C.muted, 16
  );

  await until(S(16));
  await play(
    ...replace(
      ...blockParts,
      ...blockLabels,
      ...blockIds,
      blockFloor,
      blockKey
    ),
    ...fbox([
      'three squared pieces',
      ['1, 4, 0.25', VIOLET],
      'ready to add'
    ], VIOLET),
    ...say('MAKE ONE BLOCK FOR EACH SQUARED SCORE', VIOLET)
  );

  // ------------------------------------------------------------
  // 17: STACK THE BLOCKS — TOTAL = 5.25
  //
  // Move the existing blocks into a single stack.
  // Preserve each block's exact height.
  // ------------------------------------------------------------

  const stackX = CX - 0.82;

  let runningHeight = 0;

  const stackTargets = Z2.map((v, k) => {
    const h = v * BLOCK_UNIT;

    const target = rect(
      stackX,
      BLOCK_BASE + runningHeight + h / 2,
      BLOCK_W,
      h,
      blockColors[k],
      0.85,
      1.5
    );

    runningHeight += h;

    return target;
  });

  let labelHeight = 0;

  const stackLabels = Z2.map((v, k) => {
    const h = v * BLOCK_UNIT;

    const y =
      BLOCK_BASE + labelHeight + h / 2;

    labelHeight += h;

    return txt(
      String(v),
      stackX + BLOCK_W / 2 + 0.51,
      y,
      blockColors[k],
      19, true
    );
  });

  const stackTop =
    BLOCK_BASE + CHI * BLOCK_UNIT;

  const totalBracket = vBracket(
    stackX - BLOCK_W / 2 - 0.30,
    BLOCK_BASE,
    stackTop,
    GREEN,
    0.11
  );

  const stackTotal = tag(
    '5.25',
    CX + 1.68,
    (BLOCK_BASE + stackTop) / 2,
    GREEN, 25
  );

  const stackEquation = txt(
    '1 + 4 + 0.25 = 5.25',
    CX,
    BLOCK_BASE - 0.77,
    GREEN, 20, true
  );

  await until(S(17));
  await play(
    ...remove(
      ...blockLabels,
      ...blockIds,
      blockKey
    ),

    new M.LaggedStart(
      blockParts.map((b, k) =>
        new M.Transform(
          b,
          stackTargets[k],
          {
            pathArc: k === 1 ? 0 : -0.55
          }
        )
      ),
      {
        lagRatio: 0.25,
        runTime: 1.75
      }
    ),

    ...add(
      ...stackLabels,
      totalBracket,
      stackTotal,
      stackEquation
    ),

    ...fbox([
      'sum of squared scores',
      '1 + 4 + 0.25',
      ['= 5.25', GREEN]
    ], GREEN),

    ...say('ADD THE THREE PIECES: 5.25', GREEN)
  );

  // ------------------------------------------------------------
  // 18: IS 5.25 LARGE?
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(stackTotal, {
      color: GOLD
    }),
    ...fbox([
      'observed total = 5.25',
      ['large or ordinary?', GOLD],
      'ask chance'
    ], GOLD),
    ...say('IS 5.25 A LOT?', GOLD)
  );

  // ------------------------------------------------------------
  // DETERMINISTIC SIMULATION
  //
  // Generate actual independent standard-normal scores
  // using a seeded PRNG and the Box-Muller transform.
  //
  // Every simulated trial:
  // 1. Generate three independent N(0,1) scores.
  // 2. Square each score.
  // 3. Add the three squares.
  //
  // A fixed seed makes playback reproducible when seeking.
  // The simulated values are illustrative, not additional
  // measured battery data.
  // ------------------------------------------------------------

  let rngState = 721005;

  function random() {
    rngState = (
      Math.imul(1664525, rngState) +
      1013904223
    ) >>> 0;

    return (rngState + 0.5) / 4294967296;
  }

  function randomNormal() {
    const u1 = Math.max(1e-12, random());
    const u2 = random();

    return Math.sqrt(-2 * Math.log(u1)) *
      Math.cos(2 * Math.PI * u2);
  }

  function simulateTrial(df = 3) {
    const scores = Array.from(
      { length: df },
      () => randomNormal()
    );

    const squares = scores.map(z => z * z);

    return {
      scores,
      squares,
      total: squares.reduce((s, v) => s + v, 0)
    };
  }

  const SIM_N = 6000;

  const trials = Array.from(
    { length: SIM_N },
    () => simulateTrial(DF)
  );

  // ------------------------------------------------------------
  // 19: REPEAT THREE HEALTHY BATTERIES MANY TIMES
  //
  // Show actual generated example trials.
  // Under the assumed healthy population,
  // a score z corresponds to 20 + 2z hours.
  // ------------------------------------------------------------

  const SIM_TOP = P ? 0.63 : 0.92;
  const SIM_CARD_Y = P ? -0.84 : -0.32;
  const SIM_RESULT_Y = P ? -2.98 : -1.94;

  const simX = k =>
    CX + (k - 1) * 1.88;

  function simulationFrame(trial, trialNumber) {
    const parts = [
      tag(
        `SIMULATED TEST ${trialNumber}`,
        CX,
        SIM_TOP,
        BLUE, 17
      )
    ];

    for (let k = 0; k < DF; k++) {
      const x = simX(k);

      parts.push(
        outline(
          x,
          SIM_CARD_Y,
          1.63, 1.92,
          BLUE, 0.055
        ),

        txt(
          `B${k + 1}`,
          x,
          SIM_CARD_Y + 0.64,
          C.muted, 15, true
        ),

        txt(
          `z = ${signed(
            Number(trial.scores[k].toFixed(2))
          )}`,
          x,
          SIM_CARD_Y + 0.21,
          BLUE, 17, true,
          1.48
        ),

        txt(
          'square ↓',
          x,
          SIM_CARD_Y - 0.15,
          C.muted, 14
        ),

        txt(
          trial.squares[k].toFixed(2),
          x,
          SIM_CARD_Y - 0.57,
          VIOLET, 22, true,
          1.48
        )
      );
    }

    parts.push(
      tag(
        `TOTAL ≈ ${trial.total.toFixed(2)}`,
        CX,
        SIM_RESULT_Y,
        GREEN, 22
      )
    );

    return parts;
  }

  await until(S(19));
  await play(
    ...replace(
      ...simulationFrame(trials[0], 1)
    ),
    ...fbox([
      'pretend healthy batteries',
      'three independent scores',
      ['square and add', VIOLET]
    ], VIOLET),
    ...say('LET THE COMPUTER REPEAT THE TEST')
  );

  await until(S(19) + 2.2);
  await play(
    ...replace(
      ...simulationFrame(trials[1], 2)
    )
  );

  await until(S(19) + 4.3);
  await play(
    ...replace(
      ...simulationFrame(trials[2], 3)
    ),
    ...fbox([
      'repeat thousands of times',
      'new random scores each time',
      ['save every total', GREEN]
    ], GREEN)
  );

  // ------------------------------------------------------------
  // HISTOGRAM AND CHI-SQUARE REFERENCE CURVE
  //
  // The histogram uses probability density:
  // count / (number of trials × bin width).
  //
  // The smooth curve is the exact chi-square(3) density.
  // Histogram and curve therefore use the same vertical scale.
  //
  // Display range: 0 to 18.
  // Values beyond 18 are counted as overflow, not folded
  // into the final bin.
  // ------------------------------------------------------------

  const XMIN = 0;
  const XMAX = 18;

  const CW = P ? 6.05 : 6.35;

  // Leave a little room left of zero to show impossibility
  // of negative chi-square values.
  const CLEFT = CX - CW / 2 + 0.12;

  const CY = P ? -3.70 : -1.91;

  const DENSITY_SCALE = P ? 16.0 : 11.35;

  const cx = v =>
    CLEFT + v / XMAX * CW;

  const cy = (v, df = DF) =>
    CY + chiPDF(v, df) * DENSITY_SCALE;

  const BIN_W = 0.75;

  const BIN_N = Math.round(
    XMAX / BIN_W
  );

  function chiAxis() {
    const parts = [
      line(
        cx(-1.2), CY,
        cx(XMAX), CY,
        C.muted, 2.7
      ),

      line(
        cx(0), CY,
        cx(0),
        CY + (P ? 4.40 : 3.12),
        C.muted, 1.8
      )
    ];

    for (let v = 0; v <= XMAX; v += 3) {
      parts.push(
        line(
          cx(v), CY - 0.08,
          cx(v), CY + 0.08,
          C.muted, 1.5
        ),

        txt(
          String(v),
          cx(v),
          CY - 0.31,
          C.muted, 16, true,
          0.69
        )
      );
    }

    parts.push(
      txt(
        'total of squared scores',
        CX,
        CY - 0.77,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function histogramCounts(n) {
    const counts = Array(BIN_N).fill(0);

    let overflow = 0;

    for (let k = 0; k < n; k++) {
      const v = trials[k].total;

      const i = Math.floor(v / BIN_W);

      if (i >= 0 && i < BIN_N) {
        counts[i]++;
      } else if (i >= BIN_N) {
        overflow++;
      }
    }

    return { counts, overflow };
  }

  function histogramBar(k, count, n) {
    const density =
      count / (n * BIN_W);

    const height = Math.max(
      0.002,
      Math.min(density * DENSITY_SCALE, P ? 4.2 : 2.9)
    );

    const center =
      (k + 0.5) * BIN_W;

    return rect(
      cx(center),
      CY + height / 2,
      Math.max(
        0.025,
        cx(BIN_W) - cx(0) - 0.022
      ),
      height,
      BLUE,
      count > 0 ? 0.65 : 0,
      count > 0 ? 0.7 : 0
    );
  }

  function histCounter(n) {
    return tag(
      `${n.toLocaleString('en-US')} SIMULATED TESTS`,
      CX,
      P ? 1.27 : 1.32,
      BLUE, 16
    );
  }

  const histogramAxis = chiAxis();

  const initialN = 60;

  const initialCounts =
    histogramCounts(initialN);

  const histogramBars =
    initialCounts.counts.map((count, k) =>
      histogramBar(k, count, initialN)
    );

  let counterNow = histCounter(initialN);

  function growHistogram(n, duration = 0.8) {
    const data = histogramCounts(n);

    const targetBars = data.counts.map(
      (count, k) => histogramBar(k, count, n)
    );

    const nextCounter = histCounter(n);

    const animations = [
      ...remove(counterNow),

      ...histogramBars.map((b, k) =>
        new M.Transform(
          b,
          targetBars[k],
          { runTime: duration }
        )
      ),

      ...add(nextCounter)
    ];

    counterNow = nextCounter;

    return animations;
  }

  // ------------------------------------------------------------
  // 20: EACH TOTAL DROPS INTO A GROWING HISTOGRAM
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...replace(
      histogramAxis,
      ...histogramBars,
      counterNow
    ),
    ...fbox([
      'one total per test',
      'group totals into bins',
      ['a growing histogram', BLUE]
    ]),
    ...say('EVERY TOTAL ADDS TO THE HISTOGRAM')
  );

  // ------------------------------------------------------------
  // 21: NO TOTAL CAN BE NEGATIVE
  //
  // Mark the zero boundary.
  // Explicitly show that the negative side is empty.
  // ------------------------------------------------------------

  const zeroBoundary = dashed(
    cx(0),
    CY,
    cx(0),
    CY + (P ? 4.35 : 3.06),
    GOLD
  );

  const noNegativeCross = new M.VGroup(
    line(
      cx(-0.95), CY + 0.22,
      cx(-0.22), CY + 0.49,
      GOLD, 2.5
    ),

    line(
      cx(-0.95), CY + 0.49,
      cx(-0.22), CY + 0.22,
      GOLD, 2.5
    )
  );

  const zeroLabel = txt(
    'STARTS AT 0',
    cx(0) + 0.65,
    CY + (P ? 4.03 : 2.93),
    GOLD, 16,
    false, 1.85
  );

  await until(S(21));
  await play(
    ...growHistogram(700, 1.0),
    ...add(
      zeroBoundary,
      noNegativeCross,
      zeroLabel
    ),
    ...fbox([
      'squared scores ≥ 0',
      'their total ≥ 0',
      ['no negative totals', GOLD]
    ], GOLD),
    ...say('NOTHING CAN LAND LEFT OF ZERO', GOLD)
  );

  await until(S(21) + 2.2);
  await play(
    ...growHistogram(2500, 0.9)
  );

  // ------------------------------------------------------------
  // 22: MOST TOTALS ARE SMALL; LONG RIGHT TAIL
  // ------------------------------------------------------------

  const mainCurve = sampledCurve(
    cx,
    v => cy(v, DF),
    XMIN,
    XMAX,
    BLUE,
    3.4,
    130
  );

  const longTailArrow = arrow(
    cx(7.2),
    CY + 0.70,
    cx(16.8),
    CY + 0.70,
    GOLD,
    0.16
  );

  const tailText = txt(
    'LONG RIGHT TAIL',
    cx(12.0),
    CY + 1.02,
    GOLD, 16
  );

  const fullHist = histogramCounts(SIM_N);

  const overflowText = txt(
    `${fullHist.overflow} of 6,000 totals above 18`,
    CX,
    CY - 1.11,
    C.muted, 15
  );

  await until(S(22));
  await play(
    ...growHistogram(SIM_N, 0.9),
    ...remove(
      noNegativeCross,
      zeroLabel
    ),
    ...add(
      mainCurve,
      longTailArrow,
      tailText,
      overflowText
    ),
    ...fbox([
      'many small totals',
      'some very large totals',
      ['skewed to the right', GOLD]
    ], GOLD),
    ...say('SMALL TOTALS, LONG RIGHT TAIL', GOLD)
  );

  // ------------------------------------------------------------
  // 23: THE EXPECTED TOTAL IS THREE
  //
  // The curve's mean is 3, not its mode.
  // Each independent standard-normal score has
  // expected squared value equal to one.
  // ------------------------------------------------------------

  const expectedLine = dashed(
    cx(EXPECTED),
    CY,
    cx(EXPECTED),
    cy(EXPECTED) + 0.48,
    GREEN
  );

  const expectedLabel = tag(
    'MEAN = 3',
    cx(EXPECTED) + 1.6,
    cy(EXPECTED) + 0.4,
    GREEN, 17,
    2.10
  );

  const oneEach = txt(
    '1 + 1 + 1 = 3',
    cx(11),
    CY + 1.04,
    GREEN, 20, true
  );

  await until(S(23));
  await play(
    ...remove(
      longTailArrow,
      tailText
    ),
    ...add(
      expectedLine,
      expectedLabel,
      oneEach
    ),
    ...fbox([
      'one expected unit',
      'per squared score',
      ['average total = 3', GREEN]
    ], GREEN),
    ...say('AVERAGE TOTAL: ONE PER SQUARED PIECE', GREEN)
  );

  // ------------------------------------------------------------
  // 24: NAME THE CHI-SQUARE DISTRIBUTION
  //
  // Fade the histogram away, leaving its mathematical
  // reference curve in the same position.
  // ------------------------------------------------------------

  const chiName = tag(
    'χ² DISTRIBUTION',
    CX,
    P ? 1.28 : 1.1,
    BLUE, 22
  );

  const pronunciation = txt(
    'χ is called chi, pronounced “kai”',
    cx(11.0),
    CY + 1.14,
    C.muted, 16,
    false, 3.18
  );

  await until(S(24));
  await play(
    ...remove(
      ...histogramBars,
      counterNow,
      overflowText,
      oneEach
    ),
    ...add(
      chiName,
      pronunciation
    ),
    ...fbox([
      ['chi-square distribution', BLUE],
      'χ = Greek letter chi',
      'pronounced “kai”'
    ]),
    ...say('THIS SHAPE IS THE CHI-SQUARE DISTRIBUTION')
  );

  // ------------------------------------------------------------
  // 25: THREE DEGREES OF FREEDOM
  //
  // For independent true standard-normal scores,
  // the number of squared pieces is the df.
  // ------------------------------------------------------------

  const dfTilesY = CY + 0.67;

  const dfTiles = Array.from(
    { length: DF },
    (_, k) => {
      const x =
        cx(11.5) + (k - 1) * 0.75;

      return new M.VGroup(
        rect(
          x, dfTilesY,
          0.61, 0.61,
          VIOLET, 0.70
        ),

        txt(
          `z${k + 1}²`,
          x, dfTilesY,
          C.ink, 16, true,
          0.53
        )
      );
    }
  );

  const dfTag = tag(
    '3 PIECES → 3 df',
    cx(11.5),
    CY + 1.46,
    VIOLET, 17,
    3.00
  );

  await until(S(25));
  await play(
    ...remove(pronunciation),
    ...add(
      ...dfTiles,
      dfTag
    ),
    ...fbox([
      'degrees of freedom',
      'number of squared pieces',
      ['df = 3', VIOLET]
    ], VIOLET),
    ...say('THREE SQUARED PIECES, THREE DEGREES OF FREEDOM', VIOLET)
  );

  // ------------------------------------------------------------
  // 26: MORE DEGREES OF FREEDOM CHANGE THE SHAPE
  //
  // Compare actual chi-square(3) and chi-square(8) curves.
  // Both use the same horizontal and density scales.
  //
  // Their means are 3 and 8 respectively.
  // The larger-df curve is more symmetric, not exactly normal.
  // ------------------------------------------------------------

  const MORE_DF = 8;

  const moreCurve = sampledCurve(
    cx,
    v => cy(v, MORE_DF),
    XMIN,
    XMAX,
    VIOLET,
    3.4,
    130
  );

  const oldCurveLabel = tag(
    'df = 3',
    cx(2.0) + 0.30,
    CY + (P ? 4.10 : 2.91),
    BLUE, 16,
    1.65
  );

  const moreCurveLabel = tag(
    'df = 8',
    cx(9.2),
    cy(8, MORE_DF) + 0.53,
    VIOLET, 16,
    1.80
  );

  const moreMeanLine = dashed(
    cx(MORE_DF),
    CY,
    cx(MORE_DF),
    cy(MORE_DF, MORE_DF),
    VIOLET
  );

  const shiftArrow = arrow(
    cx(3.0),
    CY + 0.24,
    cx(8.0),
    CY + 0.24,
    GREEN,
    0.13
  );

  await until(S(26));
  await play(
    ...remove(
      ...dfTiles,
      dfTag,
      expectedLine,
      expectedLabel
    ),
    ...add(
      moreCurve,
      oldCurveLabel,
      moreCurveLabel,
      moreMeanLine,
      shiftArrow
    ),
    ...fbox([
      'more squared pieces',
      'hump moves right',
      ['shape becomes more even', VIOLET]
    ], VIOLET),
    ...say('MORE df: FARTHER RIGHT, MORE SYMMETRIC', VIOLET)
  );

  // ------------------------------------------------------------
  // AREA UNDER A CHI-SQUARE CURVE
  //
  // Use narrow rectangles to approximate the tail area.
  // Their heights follow the exact chi-square density.
  // Numerical probabilities refer to the full infinite tail,
  // not just the visible portion ending at x = 18.
  // ------------------------------------------------------------

  function tailArea(
    cutoff,
    df = DF,
    color = VIOLET,
    opacity = 0.52,
    samples = 100
  ) {
    const parts = [];

    const step =
      (XMAX - cutoff) / samples;

    for (let k = 0; k < samples; k++) {
      const a = cutoff + k * step;
      const b = a + step;

      const mid = (a + b) / 2;

      const height = Math.max(
        0.001,
        chiPDF(mid, df) * DENSITY_SCALE
      );

      parts.push(
        rect(
          cx(mid),
          CY + height / 2,
          cx(b) - cx(a) + 0.001,
          height,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function chiBoundary(
    value,
    color,
    height = 1.50
  ) {
    return dashed(
      cx(value),
      CY,
      cx(value),
      CY + height,
      color
    );
  }

  // ------------------------------------------------------------
  // 27: OBSERVED TOTAL = 5.25
  // RIGHT-TAIL PROBABILITY ≈ 15%
  // ------------------------------------------------------------

  const observedShade = tailArea(
    CHI,
    DF,
    VIOLET,
    0.68
  );

  const observedBoundary = chiBoundary(
    CHI,
    GOLD,
    P ? 2.30 : 1.65
  );

  const observedDot = dot(
    cx(CHI),
    CY,
    GOLD,
    0.115
  );

  const observedLabel = tag(
    '5.25',
    cx(CHI),
    CY + (P ? 2.62 : 1.94),
    GOLD, 20,
    1.55
  );

  const pLabel = tag(
    '≈ 15%',
    cx(11.3),
    CY + 1.37,
    VIOLET, 23
  );

  const pArrow = arrow(
    cx(11.3),
    CY + 1.08,
    cx(7.7),
    cy(7.7) - 0.05,
    VIOLET,
    0.13
  );

  await until(S(27));
  await play(
    ...remove(
      moreCurve,
      oldCurveLabel,
      moreCurveLabel,
      moreMeanLine,
      shiftArrow
    ),
    ...add(
      observedShade,
      observedBoundary,
      observedDot,
      observedLabel,
      pLabel,
      pArrow
    ),
    ...fbox([
      'χ² = 5.25; df = 3',
      'P(total ≥ 5.25)',
      ['≈ 0.15 = 15%', VIOLET]
    ], VIOLET),
    ...say('ABOUT 15% OF TOTALS ARE THIS BIG OR BIGGER', VIOLET)
  );

  // ------------------------------------------------------------
  // 28: FIVE-PERCENT UPPER CUTOFF = 7.81
  //
  // Keep the observed value visible and mark the
  // five-percent cutoff farther to the right.
  // ------------------------------------------------------------

  const criticalShade = tailArea(
    CRIT,
    DF,
    GOLD,
    0.72
  );

  const criticalBoundary = chiBoundary(
    CRIT,
    GOLD,
    P ? 1.65 : 1.16
  );

  const criticalLabel = tag(
    '7.81',
    cx(CRIT) + 0.14,
    CY + (P ? 1.94 : 1.44),
    GOLD, 19,
    1.58
  );

  const criticalPercent = tag(
    '5% TAIL',
    cx(13.3),
    CY + 0.91,
    GOLD, 18,
    2.00
  );

  const criticalArrow = arrow(
    cx(13.3),
    CY + 0.62,
    cx(9.4),
    cy(9.4) - 0.04,
    GOLD,
    0.13
  );

  await until(S(28));
  await play(
    ...remove(
      observedShade,
      pLabel,
      pArrow
    ),
    ...add(
      criticalShade,
      criticalBoundary,
      criticalLabel,
      criticalPercent,
      criticalArrow
    ),
    ...fbox([
      'upper 5% cutoff',
      ['χ² ≈ 7.81', GOLD],
      'observed 5.25 is below it'
    ], GOLD),
    ...say('ONLY 5% GO BEYOND ABOUT 7.8', GOLD)
  );

  // ------------------------------------------------------------
  // 29: OUR THREE BATTERIES LOOK ORDINARY
  //
  // Do not claim the batteries are proven healthy.
  // This observed total is compatible with the model.
  // ------------------------------------------------------------

  const ordinaryTag = tag(
    'NOT UNUSUAL',
    cx(13.4),
    CY + (P ? 2.75 : 2.15),
    GREEN, 19
  );

  await until(S(29));
  await play(
    ...add(ordinaryTag),
    new M.Indicate(observedDot, {
      color: GREEN
    }),
    ...fbox([
      '5.25 < 7.81',
      'p ≈ 15% > 5%',
      ['not unusually large', GREEN]
    ], GREEN),
    ...say('COMPATIBLE WITH A HEALTHY BATCH', GREEN)
  );

  // ------------------------------------------------------------
  // 30: THE FORMULA
  //
  // Chi-square = sum of squared standard scores.
  // Show the actual three pieces before the symbolic formula.
  // ------------------------------------------------------------

  const FORM_Y = P ? -0.38 : -0.19;
  const FORM_SP = P ? 1.82 : 1.88;

  function formulaTile(k) {
    const x =
      CX + (k - 1) * FORM_SP;

    return new M.VGroup(
      outline(
        x,
        FORM_Y,
        1.58, 1.48,
        VIOLET, 0.085
      ),

      txt(
        `(${signed(Z[k])})²`,
        x,
        FORM_Y + 0.34,
        BLUE, 19, true,
        1.40
      ),

      txt(
        '↓',
        x,
        FORM_Y - 0.04,
        C.muted, 16
      ),

      txt(
        String(Z2[k]),
        x,
        FORM_Y - 0.40,
        VIOLET, 23, true
      )
    );
  }

  const formulaTiles = Z.map(
    (_, k) => formulaTile(k)
  );

  const formulaPlusOne = txt(
    '+',
    CX - FORM_SP / 2,
    FORM_Y,
    GOLD, 22, true,
    0.31
  );

  const formulaPlusTwo = txt(
    '+',
    CX + FORM_SP / 2,
    FORM_Y,
    GOLD, 22, true,
    0.31
  );

  const formulaTotal = tag(
    'χ² = 5.25',
    CX,
    FORM_Y - 1.55,
    GREEN, 24
  );

  await until(S(30));
  await play(
    ...replace(
      ...formulaTiles,
      formulaPlusOne,
      formulaPlusTwo,
      formulaTotal
    ),
    ...fbox([
      'χ² = Σ z²',
      'Σ means add them all',
      '1² + (−2)² + 0.5²',
      ['= 5.25', GREEN]
    ], VIOLET),
    ...say('CHI-SQUARE = SUM OF SQUARED SCORES', VIOLET)
  );

  // ------------------------------------------------------------
  // 31: IN WORDS — DISTANCE, SQUARE, ADD
  // ------------------------------------------------------------

  const processTop = P ? 0.85 : 1.04;
  const processMiddle = P ? -1.20 : -0.50;
  const processBottom = P ? -3.23 : -2.03;

  function processRow(
    y,
    label,
    values,
    color
  ) {
    const parts = [
      txt(
        label,
        CX,
        y + 0.41,
        color, 16
      )
    ];

    values.forEach((v, k) => {
      const x =
        CX + (k - (values.length - 1) / 2) * 1.61;

      parts.push(
        outline(
          x,
          y - 0.13,
          values.length === 1 ? 3.60 : 1.36,
          0.61,
          color, 0.08
        ),

        txt(
          String(v),
          x,
          y - 0.13,
          color, 21, true,
          values.length === 1 ? 3.35 : 1.22
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const processScores = processRow(
    processTop,
    'DISTANCE IN SPREADS',
    Z.map(signed),
    BLUE
  );

  const processSquares = processRow(
    processMiddle,
    'SQUARE EACH DISTANCE',
    Z2,
    VIOLET
  );

  const processSum = processRow(
    processBottom,
    'ADD ALL THE PIECES',
    ['5.25'],
    GREEN
  );

  const processArrowOne = arrow(
    CX,
    processTop - 0.49,
    CX,
    processMiddle + 0.65,
    GOLD,
    0.10
  );

  const processArrowTwo = arrow(
    CX,
    processMiddle - 0.49,
    CX,
    processBottom + 0.65,
    GOLD,
    0.10
  );

  await until(S(31));
  await play(
    ...replace(
      processScores,
      processSquares,
      processSum,
      processArrowOne,
      processArrowTwo
    ),
    ...fbox([
      'measure in spreads',
      ['square each distance', VIOLET],
      ['add the squares', GREEN]
    ]),
    ...say('DISTANCE → SQUARE → ADD', GREEN)
  );

  // ------------------------------------------------------------
  // 32: WHAT IS THE CHI-SQUARE CURVE FOR?
  //
  // Return to the observed total on the reference curve.
  // A chi-square reference applies to sums of squared
  // independent standard-normal scores.
  // ------------------------------------------------------------

  function simpleChiPicture(
    cutoff = CHI,
    withTail = true
  ) {
    const parts = [
      chiAxis()
    ];

    if (withTail) {
      parts.push(
        tailArea(
          cutoff,
          DF,
          VIOLET,
          0.60
        )
      );
    }

    parts.push(
      sampledCurve(
        cx,
        v => cy(v, DF),
        XMIN,
        XMAX,
        BLUE,
        3.3,
        130
      ),

      chiBoundary(
        cutoff,
        GOLD,
        P ? 2.10 : 1.46
      ),

      dot(
        cx(cutoff),
        CY,
        GOLD,
        0.11
      ),

      tag(
        cutoff.toFixed(2),
        cx(cutoff),
        CY + (P ? 2.42 : 1.74),
        GOLD, 19,
        1.54
      ),

      tag(
        'χ², df = 3',
        CX,
        P ? 1.28 : 1.33,
        BLUE, 18
      )
    );

    return parts;
  }

  const usePicture = simpleChiPicture(
    CHI, true
  );

  const useQuestion = txt(
    'HOW UNUSUAL IS THE TOTAL?',
    cx(12.0),
    CY + 1.03,
    GREEN, 16,
    false, 3.18
  );

  await until(S(32));
  await play(
    ...replace(
      ...usePicture,
      useQuestion
    ),
    ...fbox([
      'reference for totals',
      'of squared independent',
      ['standard-normal scores', BLUE]
    ]),
    ...say('ASK CHANCE ABOUT A SUM OF SQUARED DISTANCES')
  );

  // ------------------------------------------------------------
  // 33: WHY CHI-SQUARE DESCRIBES A SAMPLE VARIANCE
  //
  // Recall the four batch-A batteries from previous lessons.
  // A = [15, 17, 17, 19], sample mean = 17.
  // Squared deviations sum = 8.
  // Sample variance = 8/3.
  //
  // For independent normal observations:
  //
  // (n - 1) × sample variance / true variance
  // follows chi-square with n - 1 degrees of freedom.
  //
  // Unlike the opening example with a known mean,
  // estimating the mean uses one degree of freedom.
  // ------------------------------------------------------------

  const A = [15, 17, 17, 19];

  const AMEAN =
    A.reduce((s, v) => s + v, 0) / A.length;

  const ADEV =
    A.map(v => v - AMEAN);

  const ASQ =
    ADEV.map(v => v * v);

  const ASS =
    ASQ.reduce((s, v) => s + v, 0);

  const ADF = A.length - 1;

  const AVAR = ASS / ADF;

  const VY = P ? 0.16 : 0.48;
  const VMIN = 14;
  const VMAX = 20;

  const vx = v =>
    CX - 2.90 +
    (v - VMIN) / (VMAX - VMIN) * 5.80;

  function varianceSamplePicture() {
    const parts = [
      line(
        vx(VMIN), VY,
        vx(VMAX), VY,
        C.muted, 2.5
      ),

      dashed(
        vx(AMEAN), VY - 0.09,
        vx(AMEAN), VY + 0.78,
        GREEN
      )
    ];

    for (let v = VMIN; v <= VMAX; v++) {
      parts.push(
        line(
          vx(v), VY - 0.07,
          vx(v), VY + 0.07,
          C.muted
        ),

        txt(
          String(v),
          vx(v),
          VY - 0.29,
          v === AMEAN ? GREEN : C.muted,
          16, true
        )
      );
    }

    A.forEach((v, k) => {
      const repeats = A
        .slice(0, k)
        .filter(n => n === v)
        .length;

      parts.push(
        dot(
          vx(v),
          VY + 0.22 + repeats * 0.30,
          BLUE, 0.10
        )
      );
    });

    parts.push(
      tag(
        'BATCH A: MEAN 17',
        CX,
        VY + 0.96,
        BLUE, 16
      )
    );

    return parts;
  }

  const varianceSample =
    varianceSamplePicture();

  const varianceTilesY = P ? -1.60 : -0.79;

  const varianceTiles = ASQ.map(
    (v, k) => {
      const x =
        CX + (k - 1.5) * 1.36;

      return new M.VGroup(
        outline(
          x,
          varianceTilesY,
          1.18, 0.79,
          VIOLET, 0.08
        ),

        txt(
          `(${signed(ADEV[k])})²`,
          x,
          varianceTilesY + 0.19,
          C.muted, 14, true,
          1.06
        ),

        txt(
          String(v),
          x,
          varianceTilesY - 0.15,
          VIOLET, 21, true
        )
      );
    }
  );

  const varianceTotal = txt(
    '4 + 0 + 0 + 4 = 8',
    CX,
    P ? -2.40 : -1.43,
    VIOLET, 20, true
  );

  const varianceResult = tag(
    'VARIANCE = 8/3 ≈ 2.67',
    CX,
    P ? -3.17 : -2.08,
    GREEN, 17
  );

  await until(S(33));
  await play(
    ...replace(
      ...varianceSample,
      ...varianceTiles,
      varianceTotal,
      varianceResult
    ),
    ...fbox([
      'variance uses squares',
      '(n−1) × sample variance',
      '÷ true variance',
      ['follows χ², df = n−1', VIOLET]
    ], VIOLET),
    ...say('CHI-SQUARE ALSO DESCRIBES VARIANCE WOBBLE', VIOLET)
  );

  // ------------------------------------------------------------
  // 34: THE ASSUMPTIONS
  //
  // Three essential conditions for the simple
  // sum-of-squared-standard-scores construction:
  //
  // 1. Independent scores.
  // 2. Normally distributed scores.
  // 3. True standard scores: mean 0, variance 1.
  //
  // Show the three conditions one at a time.
  // ------------------------------------------------------------

  const CHECK_TOP = P ? 0.86 : 1.09;
  const CHECK_STEP = P ? 1.53 : 1.24;

  function assumptionCard(
    k,
    title,
    subtitle,
    iconType
  ) {
    const y =
      CHECK_TOP - k * CHECK_STEP;

    const cardWidth = P ? 6.18 : 6.30;
    const cardHeight = P ? 1.17 : 1.05;

    const iconX = CX - 2.22;

    const parts = [
      outline(
        CX,
        y,
        cardWidth,
        cardHeight,
        GREEN, 0.045
      ),

      txt(
        title,
        CX + 0.57,
        y + 0.22,
        GREEN, 17,
        false, 4.10
      ),

      txt(
        subtitle,
        CX + 0.57,
        y - 0.21,
        C.muted, 15,
        false, 4.12
      )
    ];

    if (iconType === 'independent') {
      parts.push(
        battery(
          iconX - 0.29,
          y,
          BLUE,
          0.33, 0.53
        ),

        battery(
          iconX + 0.29,
          y,
          BLUE,
          0.33, 0.53
        )
      );
    }

    if (iconType === 'normal') {
      const xx = v =>
        iconX + v * 0.25;

      const yy = v =>
        y - 0.32 +
        normalPDF(v) * 1.40;

      parts.push(
        line(
          xx(-2.5), y - 0.32,
          xx(2.5), y - 0.32,
          C.muted, 1
        ),

        sampledCurve(
          xx,
          yy,
          -2.5,
          2.5,
          BLUE, 2, 30
        )
      );
    }

    if (iconType === 'standard') {
      parts.push(
        txt(
          'z',
          iconX,
          y + 0.08,
          VIOLET, 28, true
        ),

        txt(
          '0, 1',
          iconX,
          y - 0.30,
          C.muted, 13, true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const assumptionOne = assumptionCard(
    0,
    'INDEPENDENT',
    'one battery does not affect another',
    'independent'
  );

  const assumptionTwo = assumptionCard(
    1,
    'BELL-SHAPED',
    'normally distributed readings',
    'normal'
  );

  const assumptionThree = assumptionCard(
    2,
    'TRUE STANDARD SCORES',
    'correct population mean and spread',
    'standard'
  );

  await until(S(34));
  await play(
    ...replace(assumptionOne),
    ...fbox([
      'check the conditions',
      ['independent scores', GREEN]
    ], GREEN),
    ...say('TRAP: CHECK THE ASSUMPTIONS', GOLD)
  );

  await until(S(34) + 3.2);
  await play(
    ...add(assumptionTwo),
    ...fbox([
      ['independent scores', GREEN],
      ['normal population', GREEN]
    ], GREEN)
  );

  await until(S(34) + 5.8);
  await play(
    ...add(assumptionThree),
    ...fbox([
      ['independent', GREEN],
      ['normally distributed', GREEN],
      ['true standard scores', GREEN]
    ], GREEN),
    ...say('INDEPENDENT, NORMAL, CORRECTLY STANDARDIZED', GREEN)
  );

  // ------------------------------------------------------------
  // 35: INCORRECT STANDARDIZATION BREAKS THE REFERENCE MODEL
  //
  // Illustrative incorrect assumptions:
  // true mean = 20, true SD = 2.
  //
  // Wrong mean: 18.
  // Wrong SD: 1.
  //
  // Keep the measured hours unchanged.
  // These are deliberate errors, not new factory data.
  // ------------------------------------------------------------

  const WRONG_MU = 18;
  const WRONG_SIGMA = 1;

  const wrongMeanScores = HOURS.map(
    v => (v - WRONG_MU) / SIGMA
  );

  const wrongSpreadScores = HOURS.map(
    v => (v - MU) / WRONG_SIGMA
  );

  const wrongMeanTotal =
    wrongMeanScores.reduce(
      (s, v) => s + v * v,
      0
    );

  const wrongSpreadTotal =
    wrongSpreadScores.reduce(
      (s, v) => s + v * v,
      0
    );

  const errorTop = P ? 0.86 : 1.05;
  const errorMid = P ? -1.01 : -0.43;
  const errorBottom = P ? -2.88 : -1.91;

  function errorRow(
    y,
    color,
    heading,
    detail
  ) {
    return new M.VGroup(
      outline(
        CX,
        y,
        6.15, 1.14,
        color, 0.065
      ),

      txt(
        heading,
        CX,
        y + 0.26,
        color, 17,
        false, 5.80
      ),

      txt(
        detail,
        CX,
        y - 0.21,
        color, 18, true,
        5.78
      )
    );
  }

  const correctStandardization = errorRow(
    errorTop,
    GREEN,
    'CORRECT: MEAN 20, SD 2',
    '+1, −2, +0.5 → 5.25'
  );

  const wrongMeanRow = errorRow(
    errorMid,
    GOLD,
    'WRONG MEAN: 18 INSTEAD OF 20',
    `${wrongMeanScores.map(signed).join(', ')} → ${wrongMeanTotal}`
  );

  const wrongSpreadRow = errorRow(
    errorBottom,
    GOLD,
    'WRONG SD: 1 INSTEAD OF 2',
    `${wrongSpreadScores.map(signed).join(', ')} → ${wrongSpreadTotal}`
  );

  await until(S(35));
  await play(
    ...replace(
      correctStandardization,
      wrongMeanRow,
      wrongSpreadRow
    ),
    ...fbox([
      'wrong population inputs',
      'scores no longer standard',
      ['ordinary χ² model fails', GOLD]
    ], GOLD),
    ...say('WRONG MEAN OR SPREAD: WRONG REFERENCE CURVE', GOLD)
  );

  // ------------------------------------------------------------
  // 36: ONE-SENTENCE SUMMARY
  //
  // Three independent standard-normal scores.
  // Square the scores.
  // Add them.
  // Their total follows chi-square with three df.
  //
  // Final picture reconnects the three exact measured
  // scores, their total, and the reference curve.
  // ------------------------------------------------------------

  const FINAL_X0 = CX - 2.95;
  const FINAL_X1 = CX + 2.95;

  const FINAL_Y = P ? -4.03 : -2.14;

  const FINAL_SCALE = P ? 11.6 : 6.7;

  const fx = v =>
    FINAL_X0 +
    v / XMAX *
    (FINAL_X1 - FINAL_X0);

  const fy = v =>
    FINAL_Y +
    chiPDF(v, DF) * FINAL_SCALE;

  const finalAxisParts = [
    line(
      fx(0), FINAL_Y,
      fx(XMAX), FINAL_Y,
      C.muted, 2.4
    )
  ];

  for (let v = 0; v <= XMAX; v += 3) {
    finalAxisParts.push(
      line(
        fx(v), FINAL_Y - 0.065,
        fx(v), FINAL_Y + 0.065,
        C.muted, 1.4
      ),

      txt(
        String(v),
        fx(v),
        FINAL_Y - 0.29,
        C.muted, 15, true
      )
    );
  }

  const finalAxis = new M.VGroup(
    ...finalAxisParts
  );

  const finalCurve = sampledCurve(
    fx,
    fy,
    0,
    XMAX,
    BLUE,
    3.1,
    120
  );

  const finalObserved = new M.VGroup(
    dashed(
      fx(CHI),
      FINAL_Y,
      fx(CHI),
      fy(CHI) + 0.38,
      GOLD
    ),

    dot(
      fx(CHI),
      FINAL_Y,
      GOLD, 0.10
    ),

    tag(
      '5.25',
      fx(CHI) + 0.24,
      fy(CHI) + 0.61,
      GOLD, 17,
      1.35
    )
  );

  const finalScoresY = P ? 0.93 : 1.10;

  const finalTiles = Z.map((v, k) => {
    const x =
      CX + (k - 1) * 1.82;

    return new M.VGroup(
      outline(
        x,
        finalScoresY,
        1.54, 0.65,
        VIOLET, 0.10
      ),

      txt(
        `(${signed(v)})²`,
        x,
        finalScoresY,
        VIOLET, 19, true,
        1.39
      )
    );
  });

  const finalPlusOne = txt(
    '+',
    CX - 0.91,
    finalScoresY,
    GOLD, 20, true,
    0.28
  );

  const finalPlusTwo = txt(
    '+',
    CX + 0.91,
    finalScoresY,
    GOLD, 20, true,
    0.28
  );

  const finalEquationY =
    P ? -0.03 : 0.27;

  const finalEquation = txt(
    '1 + 4 + 0.25 = 5.25',
    CX,
    finalEquationY,
    GREEN, 21, true
  );

  const finalDF = tag(
    '3 PIECES → 3 df',
    fx(12.1),
    FINAL_Y + (P ? 1.60 : 1.07),
    VIOLET, 16,
    2.65
  );

  const finalTitle = txt(
    'CHI-SQUARE REFERENCE CURVE',
    CX,
    FINAL_Y - 0.73,
    BLUE, 16
  );

  await until(S(36));
  await play(
    ...replace(
      finalAxis,
      finalCurve,
      finalObserved,
      ...finalTiles,
      finalPlusOne,
      finalPlusTwo,
      finalEquation,
      finalDF,
      finalTitle
    ),
    ...fbox([
      'independent scores',
      ['χ² = sum of squares', VIOLET],
      ['df = number of pieces', BLUE],
      ['our total = 5.25', GREEN]
    ], VIOLET),
    ...say('SQUARE INDEPENDENT STANDARD SCORES. ADD THEM.', GREEN)
  );

  await until(E(36));

  // All sentence beats 0–36 are included.
  // Shared chapter data are unchanged.
  // Histogram samples are genuinely simulated using a fixed seed.
  // The exact reference curve is drawn from the chi-square density.
  // The df = 8 comparison and wrong-standardization examples
  // are explicitly illustrative teaching choices.
  // Numerical tail probabilities include the full infinite tail.
  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and narration synchronization have not
  // been runtime-tested against the actual engine installation.
}
