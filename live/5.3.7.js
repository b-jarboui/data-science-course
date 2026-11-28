// lesson 5.3.7
// Central limit theorem — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared model:
//   Delay:       0, 10, 20, 30 minutes
//   Probability: 0.4, 0.3, 0.2, 0.1
//   True mean = 10 minutes
//   Population variance = 100
//   Population SD = 10 minutes
//
// Sampling distributions are calculated directly by convolution
// of the exact parcel probabilities, rather than inventing
// simulated histogram counts.
//
// For n = 25:
//   Standard error = 2 minutes
//   P(6 <= batch mean <= 14) approximately 0.965
//   P(batch mean > 14) approximately 0.020
//
// The normal curve is shown as an approximation, not an exact
// description of the discrete sampling distribution.
// Illustrative parcel batches are labelled as examples.
//
// Browser rendering has not been tested against the live engine.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];

  const TRUE_MEAN = 10;
  const TRUE_SD = 10;
  const VARIANCE = 100;

  const BATCH_SIZE = 25;
  const SE = TRUE_SD / Math.sqrt(BATCH_SIZE);

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const RED = DC[3];
  const TEAL = DC[0];

  const delayColor = d => DC[d / 10];

  const fmt = v => Number(v.toFixed(3)).toString();

  const normalPDF = z =>
    Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

  const standardize = x =>
    (x - TRUE_MEAN) / SE;

  // ------------------------------------------------------------
  // Exact sampling distributions
  //
  // Each parcel contributes 0, 1, 2 or 3 units of ten minutes.
  // Repeated convolution gives the distribution of their sum.
  // Dividing the total by n gives the batch-mean distribution.
  // ------------------------------------------------------------

  const cache = new Map();

  function exactDistribution(n) {
    if (cache.has(n)) {
      return cache.get(n);
    }

    let probabilities = [1];

    for (let i = 0; i < n; i++) {
      const next = Array(
        probabilities.length + 3
      ).fill(0);

      for (let k = 0; k < probabilities.length; k++) {
        for (let j = 0; j < 4; j++) {
          next[k + j] +=
            probabilities[k] * PROB[j];
        }
      }

      probabilities = next;
    }

    const result = probabilities.map((p, k) => ({
      value: 10 * k / n,
      p
    }));

    cache.set(n, result);

    return result;
  }

  const DIST1 = exactDistribution(1);
  const DIST4 = exactDistribution(4);
  const DIST25 = exactDistribution(25);
  const DIST100 = exactDistribution(100);

  const EXACT_CENTRAL = DIST25.reduce(
    (sum, item) =>
      sum + (
        item.value >= 6 && item.value <= 14
          ? item.p
          : 0
      ),
    0
  );

  const EXACT_UPPER = DIST25.reduce(
    (sum, item) =>
      sum + (item.value > 14 ? item.p : 0),
    0
  );

  const NORMAL_CENTRAL = 0.9544997361;
  const NORMAL_UPPER = 0.02275013195;

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.5, 0]
    : [4.3, -0.3, 0];

  const MAX_W = P ? FW - 1.2 : 7.1;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false, maxw = MAX_W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted, sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
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

  function rect(
    w, h, x, y,
    color,
    opacity = 0.15,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function rounded(
    w, h, x, y, color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function outline(
    w, h, x, y,
    color = C.amber
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.13;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),
      line(
        x2, y2,
        x2 - r * Math.cos(a - 0.55),
        y2 - r * Math.sin(a - 0.55),
        color, 2.5
      ),
      line(
        x2, y2,
        x2 - r * Math.cos(a + 0.55),
        y2 - r * Math.sin(a + 0.55),
        color, 2.5
      )
    );
  }

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.085
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.15,
      color
    });

    halo.setFill(color, 0.17);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(
    s, color, x, y,
    size = 17
  ) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAX_W) {
      p.scale(MAX_W / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    value, x, y, color,
    w = 1.05,
    h = 0.64
  ) {
    return new M.VGroup(
      rounded(
        w, h, x, y,
        color, color, 0.09
      ),
      txt(
        value,
        P ? 19 : 21,
        color,
        x, y,
        true,
        w - 0.12
      )
    );
  }

  function parcel(
    x, y, color,
    size = 0.65
  ) {
    return new M.VGroup(
      rect(
        size,
        size * 0.78,
        x, y,
        color, 0.16
      ),
      rect(
        size * 0.16,
        size * 0.78,
        x, y,
        color, 0.48, 1
      ),
      line(
        x - size / 2,
        y + size * 0.13,
        x + size / 2,
        y + size * 0.13,
        color, 1
      ),
      rect(
        size * 0.22,
        size * 0.16,
        x + size * 0.27,
        y - size * 0.20,
        color, 0.65, 1
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Never wrap objects already on screen in a new VGroup.
  // Helpers return animations. Only beats call play().
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);

    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function remove(...objects) {
    const present = objects.filter(
      o => visible.includes(o)
    );

    visible = visible.filter(
      o => !present.includes(o)
    );

    return present.map(
      o => new M.FadeOut(o)
    );
  }

  function swap(objects) {
    const old = visible.slice();

    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(
    objects,
    runTime = 1.4,
    lagRatio = 0.12
  ) {
    visible.push(...objects);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved course style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.35 : 0.42;

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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (
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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.40 : 3.50;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Distribution plots
  //
  // Common horizontal scale: delay or mean from 0 to 30.
  // Heights are normalised separately when comparing shapes.
  // ------------------------------------------------------------

  const HX0 = CX - (P ? 2.82 : 2.93);
  const HX1 = CX + (P ? 2.82 : 2.93);

  const HW = HX1 - HX0;

  const HBASE = P ? -3.15 : -1.88;
  const HHEIGHT = P ? 3.55 : 2.35;

  const hx = v => HX0 + v / 30 * HW;

  const HTITLE = P ? 1.43 : 1.23;

  function numberAxis(
    x0 = HX0,
    x1 = HX1,
    base = HBASE,
    min = 0,
    max = 30,
    ticks = [0, 5, 10, 15, 20, 25, 30],
    axisTitle = 'minutes'
  ) {
    const xx = v =>
      x0 + (v - min) / (max - min) * (x1 - x0);

    const parts = [
      line(
        x0 - 0.14, base,
        x1 + 0.14, base,
        C.muted, 2.4
      )
    ];

    ticks.forEach(v => {
      parts.push(
        line(
          xx(v), base - 0.065,
          xx(v), base + 0.065,
          C.muted, 1.4
        ),
        txt(
          v,
          P ? 15 : 16,
          v === 10 ? C.green : C.muted,
          xx(v),
          base - 0.25,
          true
        )
      );
    });

    if (axisTitle) {
      parts.push(
        txt(
          axisTitle,
          P ? 17 : 16,
          C.muted,
          (x0 + x1) / 2,
          base - 0.57
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function distBars(
    n,
    base = HBASE,
    height = HHEIGHT,
    x0 = HX0,
    x1 = HX1,
    color = C.cyan,
    colorFor = null
  ) {
    const data = exactDistribution(n);

    const peak = Math.max(
      ...data.map(item => item.p)
    );

    const spacing =
      (x1 - x0) * (10 / n) / 30;

    const width = n === 1
      ? (P ? 0.78 : 0.80)
      : spacing * 0.91;

    const xx = v =>
      x0 + v / 30 * (x1 - x0);

    const parts = [];

    data.forEach((item, k) => {
      if (item.p / peak < 0.0005) return;

      const h = height * item.p / peak;

      const c = colorFor
        ? colorFor(item.value)
        : n === 1
          ? DC[k]
          : color;

      parts.push(
        rect(
          width, h,
          xx(item.value),
          base + h / 2,
          c, 0.78,
          n > 20 ? 0.5 : 1.5
        )
      );
    });

    return parts;
  }

  function distPlot(
    n,
    color = C.cyan,
    title = null,
    withMean = true
  ) {
    const parts = [
      numberAxis(
        HX0, HX1, HBASE,
        0, 30,
        [0, 5, 10, 15, 20, 25, 30],
        n === 1
          ? 'single parcel delay (minutes)'
          : 'batch mean (minutes)'
      ),
      txt(
        title || (
          n === 1
            ? 'SINGLE PARCEL DELAYS'
            : `BATCH SIZE = ${n}`
        ),
        P ? 22 : 23,
        color,
        CX, HTITLE,
        true
      ),
      ...distBars(n, HBASE, HHEIGHT, HX0, HX1, color)
    ];

    if (withMean) {
      parts.push(
        dashed(
          hx(10), HBASE,
          hx(10), HBASE + HHEIGHT + 0.13,
          C.green
        )
      );
    }

    return parts;
  }

  // ------------------------------------------------------------
  // Normal-curve helpers
  //
  // Construct a smooth curve from short line segments.
  // All pieces are grouped before being added to the scene.
  // ------------------------------------------------------------

  function bellCurve(
    xx,
    yy,
    min,
    max,
    mean,
    sd,
    color = C.violet,
    steps = 100,
    sw = 3
  ) {
    const parts = [];

    for (let k = 0; k < steps; k++) {
      const a = min + (max - min) * k / steps;
      const b = min + (max - min) * (k + 1) / steps;

      const fa = Math.exp(
        -0.5 * ((a - mean) / sd) ** 2
      );

      const fb = Math.exp(
        -0.5 * ((b - mean) / sd) ** 2
      );

      parts.push(
        line(
          xx(a), yy(fa),
          xx(b), yy(fb),
          color, sw
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bellFill(
    xx,
    base,
    height,
    min,
    max,
    mean,
    sd,
    from,
    to,
    color,
    opacity = 0.36
  ) {
    const parts = [];

    const steps = 140;
    const dx = (max - min) / steps;

    for (let k = 0; k < steps; k++) {
      const lo = min + k * dx;
      const hi = lo + dx;

      const a = Math.max(lo, from);
      const b = Math.min(hi, to);

      if (b <= a) continue;

      const v = (a + b) / 2;

      const h =
        height * Math.exp(
          -0.5 * ((v - mean) / sd) ** 2
        );

      if (h < 0.001) continue;

      parts.push(
        rect(
          Math.abs(xx(b) - xx(a)) + 0.001,
          h,
          (xx(a) + xx(b)) / 2,
          base + h / 2,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 0–2: Recall the skewed distribution of single parcels.
  // ============================================================

  const initialAxis = numberAxis(
    HX0, HX1, HBASE,
    0, 30,
    [0, 10, 20, 30],
    'single parcel delay (minutes)'
  );

  const initialBars = distBars(1);

  const initialTitle = txt(
    'OUR PARCEL DELAY MODEL',
    P ? 22 : 23,
    C.ink,
    CX, HTITLE,
    true
  );

  const initialProbLabels = PROB.map((p, k) =>
    txt(
      p.toFixed(1),
      P ? 19 : 21,
      DC[k],
      hx(D[k]),
      HBASE + HHEIGHT * p / 0.4 + 0.24,
      true
    )
  );

  await until(S(0));
  await play(
    ...add(initialAxis, initialTitle),
    stagger(initialBars, 1.10, 0.14),
    ...add(...initialProbLabels),
    ...say('SINGLE PARCEL DELAYS')
  );

  // 1: Tallest at zero, progressively shorter towards thirty.

  const tallestFrame = outline(
    P ? 0.98 : 1.00,
    HHEIGHT + 0.14,
    hx(0),
    HBASE + HHEIGHT / 2,
    TEAL
  );

  const fallingArrow = arrow(
    hx(0) + 0.48,
    HBASE + HHEIGHT * 0.94,
    hx(30) - 0.10,
    HBASE + HHEIGHT * 0.35,
    C.amber
  );

  await until(S(1));
  await play(
    ...add(tallestFrame, fallingArrow),
    ...say('TALLEST AT ZERO. SHORTER TOWARDS THIRTY.', TEAL),
    ...fbox([
      ['0 min    0.4', DC[0]],
      ['10 min   0.3', DC[1]],
      ['20 min   0.2', DC[2]],
      ['30 min   0.1', DC[3]]
    ])
  );

  // 2: Introduce the term skewed.

  const tailArrow = arrow(
    hx(16),
    HBASE + HHEIGHT * 0.91,
    hx(29),
    HBASE + HHEIGHT * 0.33,
    C.amber
  );

  const tailLabel = txt(
    'LONG RIGHT TAIL',
    P ? 17 : 18,
    C.amber,
    hx(22),
    HBASE + HHEIGHT * 0.93 + 0.27,
    true
  );

  const skewTag = tag(
    'RIGHT-SKEWED',
    C.violet,
    CX,
    P ? -4.52 : -2.72,
    19
  );

  await until(S(2));
  await play(
    ...remove(tallestFrame, fallingArrow),
    ...add(tailArrow, tailLabel, skewTag),
    ...say('LOPSIDED WITH A LONG RIGHT TAIL', C.violet),
    ...fbox([
      ['skewed', C.violet],
      'not symmetric',
      'a longer tail on one side'
    ], C.violet)
  );

  // ============================================================
  // 3: The depot's new question.
  // How likely is a batch mean above fourteen minutes?
  // ============================================================

  const QUESTION_Y = P ? -0.32 : -0.42;

  const questionCard = rounded(
    P ? 5.95 : 6.20,
    P ? 3.70 : 3.45,
    CX, QUESTION_Y,
    C.amber
  );

  const questionTitle = txt(
    'ONE BATCH OF 25 PARCELS',
    P ? 21 : 23,
    C.cyan,
    CX,
    QUESTION_Y + 1.40,
    true
  );

  const questionParcels = Array.from(
    { length: 25 },
    (_, k) => {
      const col = k % 5;
      const row = Math.floor(k / 5);

      return parcel(
        CX + (col - 2) * 0.47,
        QUESTION_Y + 0.41 +
          (2 - row) * 0.34,
        C.cyan,
        0.31
      );
    }
  );

  const questionMean = txt(
    'Batch mean > 14 minutes?',
    P ? 24 : 26,
    C.amber,
    CX,
    QUESTION_Y - 0.95,
    false,
    5.60
  );

  const questionChance = txt(
    'Chance = ?',
    27,
    C.amber,
    CX,
    QUESTION_Y - 1.42,
    true
  );

  await until(S(3));
  await play(
    ...swap([
      questionCard,
      questionTitle,
      questionMean,
      questionChance
    ]),
    stagger(questionParcels, 1.8, 0.07),
    ...say('CHANCE THAT A BATCH MEAN EXCEEDS 14?', C.amber),
    ...fbox([
      'batch size = 25',
      ['event: mean > 14', C.amber],
      'chance = ?'
    ], C.amber)
  );

  // ============================================================
  // 4: Watch the sampling distribution change with batch size.
  // ============================================================

  const shapeSizes = [1, 4, 25];

  const sizeCardsY = P ? 0.32 : 0.22;
  const sizeCardsSP = P ? 1.92 : 2.04;

  const sizeCards = shapeSizes.map((n, k) =>
    new M.VGroup(
      rounded(
        P ? 1.73 : 1.84,
        1.48,
        CX + (k - 1) * sizeCardsSP,
        sizeCardsY,
        [C.amber, C.cyan, C.violet][k]
      ),
      txt(
        'BATCH SIZE',
        14, C.muted,
        CX + (k - 1) * sizeCardsSP,
        sizeCardsY + 0.36,
        true,
        1.52
      ),
      txt(
        n,
        35,
        [C.amber, C.cyan, C.violet][k],
        CX + (k - 1) * sizeCardsSP,
        sizeCardsY - 0.15,
        true
      )
    )
  );

  const sizeArrows = [0, 1].map(k =>
    arrow(
      CX + (k - 1) * sizeCardsSP + 0.86,
      sizeCardsY,
      CX + k * sizeCardsSP - 0.86,
      sizeCardsY,
      C.muted
    )
  );

  const changingNote = txt(
    'Same model. Larger batches.',
    P ? 21 : 22,
    C.ink,
    CX,
    P ? -1.47 : -1.36
  );

  await until(S(4));
  await play(
    ...swap([changingNote]),
    stagger(sizeCards, 1.5, 0.25),
    ...add(...sizeArrows),
    ...say('WATCH THE SHAPE AS THE BATCHES GROW'),
    ...fbox([
      'same parcel model',
      'change only batch size',
      ['1 → 4 → 25', C.cyan]
    ])
  );

  // ============================================================
  // 5–7: Compare the exact sampling distributions.
  // ============================================================

  const plot1 = distPlot(
    1,
    C.amber,
    'BATCH SIZE = 1',
    false
  );

  await until(S(5));
  await play(
    ...swap(plot1),
    ...say('n = 1: THE ORIGINAL SKEWED BARS', C.amber),
    ...fbox([
      'batch size = 1',
      'mean = one parcel delay',
      ['SD = 10', C.amber]
    ], C.amber)
  );

  // 6: Batch means of four are less skewed.

  const plot4 = distPlot(
    4,
    C.cyan,
    'BATCH SIZE = 4'
  );

  const peak4 = glowDot(
    hx(10),
    HBASE + HHEIGHT + 0.08,
    C.cyan,
    0.075
  );

  const peak4Label = tag(
    'PEAK NEAR 10',
    C.cyan,
    hx(10) + 0.80,
    HBASE + HHEIGHT + 0.37,
    15
  );

  await until(S(6));
  await play(
    ...swap([
      ...plot4,
      peak4,
      peak4Label
    ]),
    ...say('n = 4: FULLER IN THE MIDDLE'),
    ...fbox([
      'batch size = 4',
      ['centre = 10', C.green],
      'SE = 5',
      'still a little skewed'
    ])
  );

  // 7: Batch means of twenty-five are nearly symmetric.

  const plot25 = distPlot(
    25,
    C.violet,
    'BATCH SIZE = 25'
  );

  const peak25Label = tag(
    'PEAK AT 10',
    C.green,
    hx(10),
    HBASE + HHEIGHT + 0.36,
    15
  );

  await until(S(7));
  await play(
    ...swap([
      ...plot25,
      peak25Label
    ]),
    ...say('n = 25: NEARLY EVEN ON BOTH SIDES', C.violet),
    ...fbox([
      'batch size = 25',
      ['centre = 10', C.green],
      ['SE = 2', C.amber],
      'nearly symmetric'
    ], C.violet)
  );

  // ============================================================
  // 8: Overlay the normal approximation.
  // ============================================================

  const peak25Probability = Math.max(
    ...DIST25.map(item => item.p)
  );

  // For a discrete distribution, the normal density is multiplied
  // by the spacing between adjacent possible means, 10/25 = 0.4.
  const normalPeakScale =
    HHEIGHT *
    (normalPDF(0) / SE) *
    (10 / BATCH_SIZE) /
    peak25Probability;

  const overlayBell = bellCurve(
    hx,
    f => HBASE + normalPeakScale * f,
    0, 30,
    TRUE_MEAN,
    SE,
    C.amber,
    120,
    3.2
  );

  const normalOverlayLabel = tag(
    'NORMAL CURVE',
    C.amber,
    CX + 1.85,
    P ? -0.37 : -0.18,
    16
  );

  const overlayPointer = arrow(
    CX + 1.05,
    P ? -0.63 : -0.42,
    hx(13),
    HBASE +
      normalPeakScale *
      Math.exp(-0.5 * 1.5 ** 2),
    C.amber
  );

  await until(S(8));
  await play(
    ...add(
      overlayBell,
      normalOverlayLabel,
      overlayPointer
    ),
    ...say('THE PILE LOOKS LIKE A NORMAL BELL', C.amber),
    ...fbox([
      ['bars: exact batch means', C.violet],
      ['curve: normal approximation', C.amber],
      'almost the same shape'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Compact side-by-side or stacked comparison.
  // ------------------------------------------------------------

  function shapePanel(
    n,
    center,
    base,
    width,
    height,
    title,
    color,
    normalOverlay = false
  ) {
    const x0 = center - width / 2;
    const x1 = center + width / 2;

    const xx = v =>
      x0 + v / 30 * width;

    const parts = [
      line(
        x0 - 0.08, base,
        x1 + 0.08, base,
        C.muted, 1.8
      ),
      ...distBars(
        n,
        base,
        height,
        x0,
        x1,
        color
      ),
      txt(
        title,
        P ? 18 : 19,
        color,
        center,
        base + height + 0.35,
        true,
        width + 0.50
      )
    ];

    [0, 10, 20, 30].forEach(v => {
      parts.push(
        txt(
          v,
          14,
          v === 10 ? C.green : C.muted,
          xx(v),
          base - 0.23,
          true
        )
      );
    });

    if (normalOverlay) {
      const sd = TRUE_SD / Math.sqrt(n);

      const peak = Math.max(
        ...exactDistribution(n).map(item => item.p)
      );

      const peakH =
        height *
        normalPDF(0) / sd *
        (10 / n) / peak;

      parts.push(
        bellCurve(
          xx,
          f => base + peakH * f,
          0, 30,
          10, sd,
          C.amber,
          100,
          2.2
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 9: Start with skewed data; get bell-shaped means.
  // ============================================================

  const compareTop = shapePanel(
    1,
    CX,
    P ? -0.50 : -0.20,
    P ? 5.25 : 5.35,
    P ? 1.22 : 0.94,
    'SINGLE PARCELS',
    C.amber
  );

  const compareBottom = shapePanel(
    25,
    CX,
    P ? -3.62 : -2.48,
    P ? 5.25 : 5.35,
    P ? 1.55 : 1.12,
    'MEANS OF 25 PARCELS',
    C.violet,
    true
  );

  const compareArrow = arrow(
    CX + 2.52,
    P ? -1.10 : -0.74,
    CX + 2.52,
    P ? -2.03 : -1.28,
    C.green
  );

  const compareNote = txt(
    'Same minutes scale · heights scaled separately',
    13,
    C.muted,
    CX,
    P ? -4.37 : -2.91
  );

  await until(S(9));
  await play(
    ...swap([
      compareTop,
      compareBottom,
      compareArrow,
      compareNote
    ]),
    ...say('SKEWED VALUES → BELL-SHAPED MEANS', C.violet),
    ...fbox([
      'single values: skewed',
      ['averages: nearly normal', C.violet]
    ], C.violet)
  );

  // ============================================================
  // 10–11: Explain why the tails of the means become thin.
  // ============================================================

  const MIXED25 = [
    0, 10, 20, 0, 30,
    10, 0, 10, 20, 0,
    0, 20, 10, 0, 10,
    30, 0, 20, 10, 0,
    10, 20, 0, 10, 0
  ];

  const mixedTotal = MIXED25.reduce(
    (sum, d) => sum + d,
    0
  );

  function parcelGrid(
    values,
    center,
    y,
    pitch = 0.44,
    size = 0.30
  ) {
    return values.map((d, k) =>
      parcel(
        center + (k % 5 - 2) * pitch,
        y + (2 - Math.floor(k / 5)) * pitch,
        delayColor(d),
        size
      )
    );
  }

  const mixedGridY = P ? -0.23 : -0.22;

  const mixedGrid = parcelGrid(
    MIXED25,
    CX,
    mixedGridY,
    P ? 0.52 : 0.45,
    P ? 0.38 : 0.33
  );

  const mixedTitle = txt(
    'A MIX OF HIGH AND LOW DELAYS',
    P ? 20 : 21,
    C.cyan,
    CX,
    P ? 1.43 : 1.12,
    true
  );

  const mixedMean = tag(
    `EXAMPLE MEAN = ${fmt(mixedTotal / 25)} MIN`,
    C.green,
    CX,
    P ? -2.52 : -1.98,
    18
  );

  const mixedExampleNote = txt(
    'Illustrative batch of 25',
    P ? 18 : 16,
    C.muted,
    CX,
    P ? -3.24 : -2.60
  );

  await until(S(10));
  await play(
    ...swap([
      mixedTitle,
      mixedExampleNote
    ]),
    stagger(mixedGrid, 1.6, 0.07),
    ...add(mixedMean),
    ...say('EACH MEAN MIXES MANY DELAYS'),
    ...fbox([
      'some delays are high',
      'some delays are low',
      ['averaging mixes them', C.green]
    ], C.green)
  );

  // 11: Very high or low means require unusually extreme batches.

  const LOW25 = [
    0, 0, 0, 0, 0,
    0, 0, 10, 0, 0,
    0, 0, 0, 0, 10,
    0, 0, 0, 0, 0,
    0, 0, 0, 10, 0
  ];

  const HIGH25 = [
    30, 30, 20, 30, 30,
    20, 30, 30, 20, 30,
    30, 20, 30, 30, 30,
    20, 30, 30, 30, 20,
    30, 30, 20, 30, 30
  ];

  const extremeXs = [
    CX - 1.58,
    CX + 1.58
  ];

  const extremeY = P ? -0.20 : -0.22;

  function extremeCard(values, k, title, color) {
    const x = extremeXs[k];

    const mean =
      values.reduce((sum, d) => sum + d, 0) / 25;

    return new M.VGroup(
      rounded(
        2.82,
        P ? 3.02 : 2.72,
        x, extremeY,
        color
      ),
      txt(
        title,
        P ? 18 : 19,
        color,
        x,
        extremeY + (P ? 1.16 : 1.02),
        true,
        2.58
      ),
      ...parcelGrid(
        values,
        x,
        extremeY + 0.08,
        P ? 0.36 : 0.31,
        P ? 0.25 : 0.23
      ),
      txt(
        `mean = ${fmt(mean)}`,
        P ? 20 : 21,
        color,
        x,
        extremeY - (P ? 1.10 : 1.00),
        true,
        2.58
      )
    );
  }

  const lowCard = extremeCard(
    LOW25, 0,
    'VERY LOW MEAN',
    TEAL
  );

  const highCard = extremeCard(
    HIGH25, 1,
    'VERY HIGH MEAN',
    RED
  );

  const extremesNote = txt(
    'Illustrative extreme batches',
    16, C.muted,
    CX,
    P ? -2.56 : -2.13
  );

  await until(S(11));
  await play(
    ...swap([
      lowCard,
      highCard,
      extremesNote
    ]),
    ...say('EXTREME MEANS NEED MANY EXTREME VALUES', C.amber),
    ...fbox([
      'very low mean:',
      ['many on-time parcels', TEAL],
      'very high mean:',
      ['many late parcels', RED]
    ], C.amber)
  );

  const thinTailPlot = distPlot(
    25,
    C.violet,
    'EXTREME MEANS ARE UNCOMMON'
  );

  const thinTailFrames = [
    outline(
      hx(6) - hx(0),
      HHEIGHT * 0.50,
      (hx(0) + hx(6)) / 2,
      HBASE + HHEIGHT * 0.25,
      C.amber
    ),
    outline(
      hx(30) - hx(14),
      HHEIGHT * 0.50,
      (hx(14) + hx(30)) / 2,
      HBASE + HHEIGHT * 0.25,
      C.amber
    )
  ];

  await until(S(11) + 5.4);
  await play(
    ...swap([
      ...thinTailPlot,
      ...thinTailFrames
    ]),
    ...say('BOTH TAILS STAY THIN', C.amber),
    ...fbox([
      'extreme averages are rare',
      ['thin left tail', C.amber],
      ['thin right tail', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 12: Name the central limit theorem.
  // ============================================================

  const theoremName = new M.VGroup(
    txt(
      'CENTRAL LIMIT',
      P ? 32 : 34,
      C.violet,
      CX,
      P ? 0.92 : 0.77,
      true
    ),
    txt(
      'THEOREM',
      P ? 33 : 35,
      C.violet,
      CX,
      P ? 0.24 : 0.08,
      true
    ),
    txt(
      'A mathematical statement that has been proven',
      P ? 19 : 20,
      C.ink,
      CX,
      P ? -2.30 : -1.91,
      false
    )
  );

  const theoremBell = bellCurve(
    v => CX + v * 0.78,
    f => (P ? -1.47 : -1.20) + f * 0.93,
    -3.5, 3.5,
    0, 1,
    C.amber,
    80,
    3
  );

  await until(S(12));
  await play(
    ...swap([
      theoremName,
      theoremBell
    ]),
    ...say('CENTRAL LIMIT THEOREM', C.violet),
    ...fbox([
      ['CLT', C.violet],
      'central limit theorem',
      'a proven mathematical result'
    ], C.violet)
  );

  // ============================================================
  // 13: State the theorem in plain words.
  // ============================================================

  const theoremStepsY = P
    ? [0.85, -0.73, -2.31]
    : [0.76, -0.62, -2.00];

  function theoremStep(title, detail, k, color) {
    const y = theoremStepsY[k];

    return new M.VGroup(
      rounded(
        P ? 5.85 : 6.10,
        P ? 1.04 : 0.89,
        CX, y,
        color
      ),
      txt(
        title,
        P ? 21 : 22,
        color,
        CX,
        y + 0.19,
        true
      ),
      txt(
        detail,
        P ? 17 : 18,
        C.ink,
        CX,
        y - 0.21
      )
    );
  }

  const theoremSteps = [
    theoremStep(
      'INDEPENDENT VALUES',
      'All from the same model',
      0,
      C.cyan
    ),
    theoremStep(
      'AVERAGE MANY VALUES',
      'One mean per batch',
      1,
      C.violet
    ),
    theoremStep(
      'NEARLY NORMAL MEANS',
      'When the batch is sufficiently large',
      2,
      C.green
    )
  ];

  const theoremArrows = [0, 1].map(k =>
    arrow(
      CX,
      theoremStepsY[k] - 0.55,
      CX,
      theoremStepsY[k + 1] + 0.55,
      C.muted
    )
  );

  await until(S(13));
  await play(
    ...swap([]),
    stagger(theoremSteps, 2.1, 0.27),
    ...add(...theoremArrows),
    ...say('MEANS OF MANY INDEPENDENT VALUES', C.green),
    ...fbox([
      'same model',
      'independent values',
      ['many values per mean', C.cyan],
      ['approximately normal', C.green]
    ], C.green)
  );

  // ============================================================
  // 14: Different single-value shapes can lead to normal means.
  // ============================================================

  const illustrativeShapes = [
    [0.40, 0.30, 0.20, 0.10],
    [0.25, 0.25, 0.25, 0.25],
    [0.45, 0.05, 0.05, 0.45]
  ];

  function tinyBars(
    values,
    center,
    base,
    width,
    height,
    color
  ) {
    const max = Math.max(...values);
    const pitch = width / values.length;

    return new M.VGroup(
      line(
        center - width / 2,
        base,
        center + width / 2,
        base,
        C.muted, 1.5
      ),
      ...values.map((v, k) => {
        const h = v / max * height;

        return rect(
          pitch * 0.76,
          h,
          center - width / 2 +
            (k + 0.5) * pitch,
          base + h / 2,
          color,
          0.72,
          1
        );
      })
    );
  }

  const SHAPE_XS = [
    CX - 2.02,
    CX,
    CX + 2.02
  ];

  const SHAPE_BASE = P ? 0.14 : 0.12;
  const SHAPE_HEIGHT = P ? 0.92 : 0.78;

  const originalShapes = illustrativeShapes.map(
    (values, k) =>
      tinyBars(
        values,
        SHAPE_XS[k],
        SHAPE_BASE,
        1.60,
        SHAPE_HEIGHT,
        [C.cyan, C.amber, C.violet][k]
      )
  );

  const originalShapeLabels = [
    'SKEWED',
    'UNIFORM',
    'TWO PEAKS'
  ].map((s, k) =>
    txt(
      s,
      14, C.muted,
      SHAPE_XS[k],
      SHAPE_BASE - 0.29,
      true,
      1.80
    )
  );

  const shapeFlowY = P ? -0.91 : -0.66;

  const shapeFlowArrows = SHAPE_XS.map(x =>
    arrow(
      x,
      SHAPE_BASE - 0.53,
      x,
      shapeFlowY - 0.25,
      C.green
    )
  );

  const standardizedBells = SHAPE_XS.map(x =>
    bellCurve(
      z => x + z * 0.23,
      f => (P ? -2.51 : -1.96) + f * 1.00,
      -3.5, 3.5,
      0, 1,
      C.green,
      60,
      2.5
    )
  );

  const finiteNote = tag(
    'IF THE SINGLE-VALUE SPREAD IS FINITE',
    C.amber,
    CX,
    P ? -3.62 : -2.62,
    16
  );

  await until(S(14));
  await play(
    ...swap([
      ...originalShapes,
      ...originalShapeLabels,
      ...shapeFlowArrows,
      ...standardizedBells,
      finiteNote
    ]),
    ...say('MANY DIFFERENT SHAPES CAN LEAD TO BELLS', C.violet),
    ...fbox([
      'single values:',
      'many possible shapes',
      ['condition: finite spread', C.amber]
    ], C.violet)
  );

  // ============================================================
  // 15: Finite spread.
  // ============================================================

  const finitePlot = distPlot(
    1,
    C.amber,
    'OUR DEPOT HAS FINITE SPREAD'
  );

  const finiteSpreadTag = tag(
    'SD = 10 MINUTES',
    C.amber,
    CX,
    P ? -4.45 : -2.72,
    19
  );

  await until(S(15));
  await play(
    ...swap([
      ...finitePlot,
      finiteSpreadTag
    ]),
    ...say('FINITE = NOT INFINITELY LARGE', C.amber),
    ...fbox([
      'our parcel model:',
      'variance = 100',
      ['SD = √100 = 10', C.amber],
      'finite'
    ], C.amber)
  );

  // ============================================================
  // 16: More values per mean gives a closer normal approximation.
  //
  // Compare standardized distributions on the same z scale.
  // This separates the change of shape from the change of spread.
  // ------------------------------------------------------------

  function standardizedPanel(
    n,
    base,
    height,
    title,
    color
  ) {
    const minZ = -3.6;
    const maxZ = 3.6;

    const width = P ? 5.00 : 5.10;

    const xx = z =>
      CX - width / 2 +
      (z - minZ) / (maxZ - minZ) * width;

    const sd = TRUE_SD / Math.sqrt(n);
    const dz = (10 / n) / sd;

    const parts = [
      line(
        xx(minZ), base,
        xx(maxZ), base,
        C.muted, 1.5
      )
    ];

    exactDistribution(n).forEach(item => {
      const z =
        (item.value - TRUE_MEAN) / sd;

      if (z < minZ || z > maxZ) return;

      const h =
        height *
        (item.p / dz) /
        normalPDF(0);

      if (h < 0.001) return;

      parts.push(
        rect(
          width * dz / (maxZ - minZ) * 0.90,
          h,
          xx(z),
          base + h / 2,
          color, 0.64, 0.6
        )
      );
    });

    parts.push(
      bellCurve(
        xx,
        f => base + height * f,
        minZ, maxZ,
        0, 1,
        C.amber,
        90,
        2
      ),
      txt(
        title,
        P ? 17 : 18,
        color,
        CX - 2.60,
        base + height * 0.75,
        true,
        1.20
      )
    );

    return new M.VGroup(...parts);
  }

  const convergenceBases = P
    ? [0.03, -1.65, -3.33]
    : [0.35, -0.88, -2.11];

  const convergenceHeight = P ? 0.94 : 0.65;

  const convergencePanels = [
    standardizedPanel(
      4,
      convergenceBases[0],
      convergenceHeight,
      'n = 4',
      C.cyan
    ),
    standardizedPanel(
      25,
      convergenceBases[1],
      convergenceHeight,
      'n = 25',
      C.violet
    ),
    standardizedPanel(
      100,
      convergenceBases[2],
      convergenceHeight,
      'n = 100',
      C.green
    )
  ];

  const convergenceNote = txt(
    'Compared on the same standardized scale',
    15,
    C.muted,
    CX,
    P ? -4.13 : -2.73
  );

  await until(S(16));
  await play(
    ...swap([convergenceNote]),
    stagger(convergencePanels, 1.65, 0.20),
    ...say('LARGER BATCHES APPROACH THE BELL', C.green),
    ...fbox([
      'n = 4',
      'n = 25',
      ['n = 100: closer', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Standardization picture
  //
  // The minutes axis is 2–18, centred at 10.
  // Every two minutes corresponds to one standard error.
  // ------------------------------------------------------------

  const BX0 = CX - (P ? 2.92 : 2.99);
  const BX1 = CX + (P ? 2.92 : 2.99);

  const BMIN = 2;
  const BMAX = 18;

  const BBASE = P ? -2.93 : -1.80;
  const BHEIGHT = P ? 3.36 : 2.39;

  const bx = v =>
    BX0 + (v - BMIN) / (BMAX - BMIN) * (BX1 - BX0);

  const by = v =>
    BBASE + BHEIGHT *
      Math.exp(-0.5 * ((v - 10) / 2) ** 2);

  const ZROW = P ? -4.85 : -3.25;
  const SE_ROW = P ? -3.95 : -2.42;

  function minutesAxis() {
    return numberAxis(
      BX0, BX1, BBASE,
      BMIN, BMAX,
      [2, 4, 6, 8, 10, 12, 14, 16, 18],
      P ? 'batch mean (minutes)' : ''
    );
  }

  function zAxis() {
    const parts = [
      line(
        BX0, ZROW,
        BX1, ZROW,
        C.violet, 2
      )
    ];

    for (let z = -4; z <= 4; z++) {
      const x = bx(10 + z * 2);

      parts.push(
        line(
          x, ZROW - 0.06,
          x, ZROW + 0.06,
          C.violet, 1.5
        ),
        txt(
          z > 0 ? `+${z}` : z,
          P ? 15 : 16,
          C.violet,
          x,
          ZROW - 0.24,
          true
        )
      );
    }

    if (P) {
      parts.push(
        txt(
          'z · distance in standard errors',
          16, C.violet,
          CX,
          ZROW - 0.63
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function mainBell() {
    return bellCurve(
      bx,
      f => BBASE + BHEIGHT * f,
      BMIN, BMAX,
      10, 2,
      C.violet,
      120,
      3.1
    );
  }

  function bellCentre() {
    return dashed(
      bx(10), BBASE,
      bx(10), by(10) + 0.15,
      C.green
    );
  }

  function bellTitle(s = 'BATCH MEANS OF 25') {
    return txt(
      s,
      P ? 21 : 22,
      C.violet,
      CX,
      P ? 1.43 : 1.30,
      true
    );
  }

  function bellScene(
    title = 'BATCH MEANS OF 25',
    includeZ = false
  ) {
    const parts = [
      minutesAxis(),
      mainBell(),
      bellCentre(),
      bellTitle(title)
    ];

    if (includeZ) {
      parts.push(zAxis());
    }

    return parts;
  }

  function meanValueMarker(
    value,
    color = C.amber,
    label = true
  ) {
    const parts = [
      dashed(
        bx(value), BBASE,
        bx(value), by(value),
        color
      ),
      glowDot(
        bx(value), by(value),
        color, 0.08
      ),
      glowDot(
        bx(value), BBASE,
        color, 0.065
      )
    ];

    if (label) {
      parts.push(
        txt(
          value,
          21, color,
          bx(value),
          by(value) + 0.30,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function distanceBracket(
    a, b,
    y,
    text,
    color = C.amber
  ) {
    const x1 = bx(a);
    const x2 = bx(b);

    return new M.VGroup(
      line(
        x1, y,
        x2, y,
        color, 2.8
      ),
      line(
        x1, y - 0.10,
        x1, y + 0.10,
        color, 2
      ),
      line(
        x2, y - 0.10,
        x2, y + 0.10,
        color, 2
      ),
      txt(
        text,
        P ? 18 : 19,
        color,
        (x1 + x2) / 2,
        y < BBASE ? y - 0.26 : y + 0.25,
        true
      )
    );
  }

  function standardErrorSteps(
    from,
    to,
    y,
    color = C.amber
  ) {
    const direction = Math.sign(to - from);
    const count = Math.round(Math.abs(to - from) / SE);

    const parts = [];

    for (let k = 0; k < count; k++) {
      const a = from + direction * k * SE;
      const b = a + direction * SE;

      parts.push(
        arrow(
          bx(a) + direction * 0.04,
          y,
          bx(b) - direction * 0.04,
          y,
          color
        ),
        txt(
          direction > 0 ? '+1 SE' : '−1 SE',
          16,
          color,
          (bx(a) + bx(b)) / 2,
          y - 0.25,
          true,
          Math.abs(bx(b) - bx(a)) - 0.03
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 17–19: Standardize a batch mean.
  // ============================================================

  const standardizePlot = bellScene(
    'USE THE NORMAL BELL'
  );

  await until(S(17));
  await play(
    ...swap(standardizePlot),
    ...say('NOW WE CAN USE THE BELL', C.violet),
    ...fbox([
      'first:',
      ['standardize the batch mean', C.violet]
    ], C.violet)
  );

  // 18: Measure distance in units of standard error.

  const initialZAxis = zAxis();

  const unitBracket = distanceBracket(
    10, 12,
    SE_ROW,
    '1 SE',
    C.amber
  );

  await until(S(18));
  await play(
    ...add(initialZAxis, unitBracket),
    ...say('DISTANCE FROM CENTRE, COUNTED IN SEs', C.amber),
    ...fbox([
      'standardize:',
      'distance from centre',
      ['measured in SEs', C.amber]
    ], C.amber)
  );

  // 19: Centre ten, standard error two.

  const centreLabel = tag(
    'CENTRE = 10',
    C.green,
    bx(10),
    by(10) + 0.35,
    16
  );

  const twoMinuteBracket = distanceBracket(
    10, 12,
    SE_ROW,
    '2 min',
    C.amber
  );

  const oneSELabel = txt(
    '1 SE = 2 minutes',
    P ? 18 : 19,
    C.amber,
    CX + 1.59,
    P ? 0.75 : 0.85,
    true,
    2.95
  );

  await until(S(19));
  await play(
    ...remove(unitBracket),
    ...add(
      centreLabel,
      twoMinuteBracket,
      oneSELabel
    ),
    ...say('CENTRE = 10. STANDARD ERROR = 2.', C.green),
    ...fbox([
      'batch size = 25',
      ['true mean = 10', C.green],
      ['SE = 10 ÷ √25 = 2', C.amber]
    ], C.green)
  );

  // ============================================================
  // 20–21: Standardize fourteen.
  // ============================================================

  const marker14 = meanValueMarker(
    14, C.amber
  );

  const distance14 = distanceBracket(
    10, 14,
    SE_ROW,
    '4 minutes',
    C.amber
  );

  await until(S(20));
  await play(
    ...remove(
      twoMinuteBracket,
      oneSELabel
    ),
    ...add(marker14, distance14),
    ...say('14 − 10 = 4 MINUTES', C.amber),
    ...fbox([
      ['batch mean = 14', C.amber],
      'true mean = 10',
      ['distance = 14 − 10 = 4', C.amber]
    ], C.amber)
  );

  // 21: Four minutes is two standard errors.

  const steps14 = standardErrorSteps(
    10, 14,
    SE_ROW,
    C.amber
  );

  const z14Tag = tag(
    'z = +2',
    C.amber,
    bx(14) + 0.35,
    P ? 0.70 : 0.87,
    21
  );

  await until(S(21));
  await play(
    ...remove(distance14),
    ...add(steps14, z14Tag),
    ...say('4 ÷ 2 = 2 STANDARD ERRORS', C.amber),
    ...fbox([
      'z = (14 − 10) ÷ 2',
      '  = 4 ÷ 2',
      ['  = +2', C.amber],
      'two SEs above centre'
    ], C.amber)
  );

  // ============================================================
  // 22: Standardize six.
  // ============================================================

  const marker6 = meanValueMarker(
    6, C.cyan
  );

  const distance6 = distanceBracket(
    6, 10,
    SE_ROW,
    '4 minutes',
    C.cyan
  );

  const steps6 = standardErrorSteps(
    10, 6,
    SE_ROW,
    C.cyan
  );

  const z6Tag = tag(
    'z = −2',
    C.cyan,
    bx(6) - 0.35,
    P ? 0.70 : 0.87,
    21
  );

  await until(S(22));
  await play(
    ...remove(
      marker14,
      distance14,
      steps14,
      z14Tag
    ),
    ...add(marker6, distance6),
    ...say('6 − 10 = −4 MINUTES', C.cyan),
    ...fbox([
      ['batch mean = 6', C.cyan],
      'true mean = 10',
      ['distance = 6 − 10 = −4', C.cyan]
    ], C.cyan)
  );

  await until(S(22) + 3.0);
  await play(
    ...remove(distance6),
    ...add(steps6, z6Tag),
    ...say('−4 ÷ 2 = −2 STANDARD ERRORS', C.cyan),
    ...fbox([
      'z = (6 − 10) ÷ 2',
      '  = −4 ÷ 2',
      ['  = −2', C.cyan],
      'two SEs below centre'
    ], C.cyan)
  );

  // ============================================================
  // 23: Standardize ten.
  // ============================================================

  const marker10 = meanValueMarker(
    10,
    C.green,
    false
  );

  const z10Tag = tag(
    'z = 0',
    C.green,
    bx(10),
    P ? -0.43 : -0.30,
    22
  );

  await until(S(23));
  await play(
    ...remove(
      marker6,
      distance6,
      steps6,
      z6Tag
    ),
    ...add(marker10, z10Tag),
    ...say('10 IS RIGHT ON THE CENTRE', C.green),
    ...fbox([
      'z = (10 − 10) ÷ 2',
      '  = 0 ÷ 2',
      ['  = 0', C.green]
    ], C.green)
  );

  // ============================================================
  // 24–26: The standardization formula.
  // ============================================================

  const formulaHeading = txt(
    'STANDARDIZED VALUE',
    P ? 24 : 26,
    C.violet,
    CX,
    P ? 1.43 : 1.25,
    true
  );

  const formulaY = P ? -0.46 : -0.40;

  const zSymbol = txt(
    'z =',
    40,
    C.violet,
    CX - 2.36,
    formulaY,
    true
  );

  const formulaFrame = outline(
    P ? 6.05 : 6.25,
    P ? 2.16 : 2.05,
    CX,
    formulaY,
    C.violet
  );

  await until(S(24));
  await play(
    ...swap([
      formulaHeading,
      formulaFrame,
      zSymbol
    ]),
    ...say('CALL THE STANDARDIZED VALUE z', C.violet),
    ...fbox([
      ['z', C.violet],
      'standardized value'
    ], C.violet)
  );

  // 25: z = (batch mean − true mean) / SE.

  const zNumerator = txt(
    'batch mean − true mean',
    P ? 22 : 23,
    C.amber,
    CX + 0.62,
    formulaY + 0.47,
    false,
    4.18
  );

  const zFractionLine = line(
    CX - 1.54,
    formulaY,
    CX + 2.78,
    formulaY,
    C.ink, 3
  );

  const zDenominator = txt(
    'standard error',
    P ? 23 : 24,
    C.green,
    CX + 0.62,
    formulaY - 0.47,
    false,
    4.18
  );

  await until(S(25));
  await play(
    ...add(
      zNumerator,
      zFractionLine,
      zDenominator
    ),
    ...say('z = (BATCH MEAN − TRUE MEAN) ÷ SE', C.violet),
    ...fbox([
      ['z = (X̄ − mean) / SE', C.violet],
      'distance ÷ standard error'
    ], C.violet)
  );

  // 26: Read the meaning of z.

  const zSummaryY = P ? -2.80 : -2.25;

  const zSummary = [
    [6, '−2', C.cyan],
    [10, '0', C.green],
    [14, '+2', C.amber]
  ].map(([value, z, color], k) => {
    const x = CX + (k - 1) * 1.91;

    return new M.VGroup(
      rounded(
        1.72, 0.92,
        x, zSummaryY,
        color
      ),
      txt(
        `${value} min`,
        16, C.ink,
        x,
        zSummaryY + 0.22,
        true
      ),
      txt(
        `z = ${z}`,
        22, color,
        x,
        zSummaryY - 0.19,
        true
      )
    );
  });

  await until(S(26));
  await play(
    stagger(zSummary, 1.3, 0.21),
    ...say('HOW MANY STANDARD ERRORS FROM THE CENTRE?', C.violet),
    ...fbox([
      ['negative z: below', C.cyan],
      ['zero: at the centre', C.green],
      ['positive z: above', C.amber]
    ], C.violet)
  );

  // ============================================================
  // 27: The normal rule — about 95% within two standard errors.
  // ============================================================

  const centralFill = bellFill(
    bx,
    BBASE,
    BHEIGHT,
    BMIN, BMAX,
    10, 2,
    6, 14,
    C.green,
    0.38
  );

  const lowerTailFill = bellFill(
    bx,
    BBASE,
    BHEIGHT,
    BMIN, BMAX,
    10, 2,
    BMIN, 6,
    C.amber,
    0.42
  );

  const upperTailFill = bellFill(
    bx,
    BBASE,
    BHEIGHT,
    BMIN, BMAX,
    10, 2,
    14, BMAX,
    C.amber,
    0.42
  );

  const centralPlot = bellScene(
    'THE NORMAL 95% RULE',
    true
  );

  const centralBoundaries = [
    dashed(
      bx(6), BBASE,
      bx(6), by(6) + 0.25,
      C.green
    ),
    dashed(
      bx(14), BBASE,
      bx(14), by(14) + 0.25,
      C.green
    )
  ];

  const central95 = txt(
    '≈ 95%',
    P ? 36 : 38,
    C.green,
    bx(10),
    BBASE + BHEIGHT * 0.55,
    true
  );

  const central95Note = txt(
    'within 2 SEs',
    17, C.ink,
    bx(10),
    BBASE + BHEIGHT * 0.35
  );

  const leftTailLabel = txt(
    '≈ 2.5%',
    P ? 16 : 17,
    C.amber,
    bx(4),
    BBASE + 0.52,
    true
  );

  const rightTailLabel = txt(
    '≈ 2.5%',
    P ? 16 : 17,
    C.amber,
    bx(16),
    BBASE + 0.52,
    true
  );

  await until(S(27));
  await play(
    ...swap([
      centralFill,
      lowerTailFill,
      upperTailFill,
      ...centralPlot,
      ...centralBoundaries,
      central95,
      central95Note,
      leftTailLabel,
      rightTailLabel
    ]),
    ...say('ABOUT 95 IN 100 ARE WITHIN TWO SEs', C.green),
    ...fbox([
      'normal approximation:',
      ['−2 ≤ z ≤ +2', C.violet],
      ['chance ≈ 0.95', C.green]
    ], C.green)
  );

  // ============================================================
  // 28: Convert back to minutes: six to fourteen.
  // ============================================================

  const sixLabel = tag(
    '6 MIN',
    C.cyan,
    bx(6),
    BBASE + 0.88,
    16
  );

  const fourteenLabel = tag(
    '14 MIN',
    C.amber,
    bx(14),
    BBASE + 0.88,
    16
  );

  const intervalBracket = distanceBracket(
    6, 14,
    SE_ROW,
    '6 to 14 minutes',
    C.green
  );

  await until(S(28));
  await play(
    ...remove(central95Note),
    ...add(
      intervalBracket
    ),
    ...say('ABOUT 95 IN 100 MEANS FALL BETWEEN 6 AND 14', C.green),
    ...fbox([
      '10 − 2 × 2 = 6',
      '10 + 2 × 2 = 14',
      ['chance ≈ 95%', C.green]
    ], C.green)
  );

  // ============================================================
  // 29: Check against the exact depot distribution.
  // ============================================================

  function exactCentralPlot() {
    const data = DIST25;

    const peak = Math.max(
      ...data.map(item => item.p)
    );

    const bars = [];

    const width =
      (BX1 - BX0) *
      (10 / BATCH_SIZE) /
      (BMAX - BMIN) *
      0.92;

    data.forEach(item => {
      if (
        item.value < BMIN ||
        item.value > BMAX
      ) return;

      const h = BHEIGHT * item.p / peak;

      if (h < 0.002) return;

      const inside =
        item.value >= 6 &&
        item.value <= 14;

      const color = inside
        ? C.green
        : C.amber;

      bars.push(
        rect(
          width,
          h,
          bx(item.value),
          BBASE + h / 2,
          color,
          inside ? 0.76 : 0.84,
          0.6
        )
      );
    });

    const normalScale =
      BHEIGHT *
      normalPDF(0) / SE *
      (10 / BATCH_SIZE) / peak;

    return [
      minutesAxis(),
      zAxis(),
      ...bars,
      bellCurve(
        bx,
        f => BBASE + normalScale * f,
        BMIN, BMAX,
        10, 2,
        C.violet,
        120,
        2.8
      ),
      bellCentre(),
      bellTitle('EXACT DEPOT CHANCES'),
      dashed(
        bx(6), BBASE,
        bx(6), BBASE + BHEIGHT * 0.35,
        C.green
      ),
      dashed(
        bx(14), BBASE,
        bx(14), BBASE + BHEIGHT * 0.35,
        C.green
      )
    ];
  }

  const exactPlot = exactCentralPlot();

  const exactPercent = tag(
    'EXACT ≈ 96.5%',
    C.green,
    bx(10),
    BBASE + BHEIGHT * 0.55,
    20
  );

  await until(S(29));
  await play(
    ...swap([
      ...exactPlot,
      exactPercent
    ]),
    ...say('EXACT MODEL: ABOUT 96 OR 97 IN 100', C.green),
    ...fbox([
      'exact depot probability:',
      ['P(6 ≤ mean ≤ 14)', C.violet],
      [`≈ ${EXACT_CENTRAL.toFixed(3)}`, C.green],
      'about 96.5%'
    ], C.green)
  );

  // ============================================================
  // 30: Compare exact and approximate answers.
  // ============================================================

  const MATCH_W = P ? 5.45 : 5.65;
  const MATCH_X0 = CX - MATCH_W / 2;

  const matchYs = P
    ? [0.36, -1.46]
    : [0.43, -1.10];

  function percentBar(
    percent,
    label,
    display,
    y,
    color
  ) {
    const w = MATCH_W * percent;

    return new M.VGroup(
      txt(
        label,
        P ? 20 : 21,
        color,
        CX - 1.26,
        y + 0.50,
        true,
        3.0
      ),
      txt(
        display,
        P ? 24 : 26,
        color,
        CX + 1.92,
        y + 0.50,
        true
      ),
      rect(
        MATCH_W,
        0.53,
        CX, y,
        C.muted, 0.05, 1.5
      ),
      rect(
        w,
        0.53,
        MATCH_X0 + w / 2,
        y,
        color, 0.78, 1
      )
    );
  }

  const exactMatchBar = percentBar(
    EXACT_CENTRAL,
    'EXACT MODEL',
    '96.5%',
    matchYs[0],
    C.green
  );

  const normalMatchBar = percentBar(
    0.95,
    'NORMAL RULE',
    '95%',
    matchYs[1],
    C.violet
  );

  const closeTag = tag(
    'VERY CLOSE',
    C.green,
    CX,
    P ? -3.04 : -2.36,
    22
  );

  await until(S(30));
  await play(
    ...swap([
      exactMatchBar,
      normalMatchBar,
      closeTag
    ]),
    ...say('THE BELL GIVES A CLOSE APPROXIMATION', C.green),
    ...fbox([
      ['exact ≈ 96.5%', C.green],
      ['normal rule ≈ 95%', C.violet],
      'close, not identical'
    ], C.green)
  );

  // ============================================================
  // 31: Answer the original question.
  // P(batch mean > 14) is about 0.020.
  // ============================================================

  const answerFill = bellFill(
    bx,
    BBASE,
    BHEIGHT,
    BMIN, BMAX,
    10, 2,
    14, BMAX,
    RED,
    0.68
  );

  const answerBell = bellScene(
    'CHANCE OF MEAN ABOVE 14',
    true
  );

  const upperBoundary = dashed(
    bx(14),
    BBASE,
    bx(14),
    by(14) + 0.62,
    RED
  );

  const upperArrow = arrow(
    bx(16.4),
    BBASE + BHEIGHT * 0.56,
    bx(15),
    by(15) + 0.045,
    RED
  );

  const upperNormalLabel = txt(
    'NORMAL: ≈ 2.5%',
    P ? 17 : 18,
    RED,
    bx(15.4),
    BBASE + BHEIGHT * 0.65,
    true,
    2.60
  );

  await until(S(31));
  await play(
    ...swap([
      answerFill,
      ...answerBell,
      upperBoundary,
      upperArrow,
      upperNormalLabel
    ]),
    ...say('ABOVE 14: ONLY THE THIN RIGHT TAIL', RED),
    ...fbox([
      'mean > 14',
      'z > 2',
      ['normal rule ≈ 2.5%', RED]
    ], RED)
  );

  const exactUpperLabel = tag(
    'EXACT: ABOUT 2 IN 100',
    C.green,
    CX,
    P ? 0.80 : 0.92,
    19
  );

  await until(S(31) + 2.8);
  await play(
    ...add(exactUpperLabel),
    ...say('ANSWER: ABOUT TWO BATCHES IN A HUNDRED', C.green),
    ...fbox([
      'exact depot model:',
      ['P(mean > 14)', RED],
      [`≈ ${EXACT_UPPER.toFixed(3)}`, C.green],
      'about 2 in 100'
    ], C.green)
  );

  // ============================================================
  // 32: One well-known curve can help answer many questions.
  // ============================================================

  const useCurveY = P ? -0.50 : -0.45;

  const useCurve = bellCurve(
    z => CX + z * 0.78,
    f => useCurveY - 0.90 + f * 1.95,
    -3.6, 3.6,
    0, 1,
    C.violet,
    100,
    3
  );

  const useAxis = line(
    CX - 2.96,
    useCurveY - 0.90,
    CX + 2.96,
    useCurveY - 0.90,
    C.muted, 2
  );

  const useHeading = txt(
    'ONE WELL-KNOWN CURVE',
    P ? 22 : 24,
    C.violet,
    CX,
    P ? 1.43 : 1.26,
    true
  );

  const useLabels = [
    'How unusual?',
    'Within a range?',
    'Above a limit?'
  ].map((s, k) =>
    tag(
      s,
      [C.cyan, C.green, C.amber][k],
      CX + (k - 1) * 1.93,
      P ? -2.30 : -2.00,
      14
    )
  );

  await until(S(32));
  await play(
    ...swap([
      useHeading,
      useAxis,
      useCurve,
      ...useLabels
    ]),
    ...say('USE ONE CURVE FOR MANY KINDS OF MEANS', C.violet),
    ...fbox([
      'approximate chances',
      'for batch means',
      ['using the normal curve', C.violet]
    ], C.violet)
  );

  // ============================================================
  // 33: Delays, incomes and waiting times.
  //
  // Illustrative right-skewed shapes for the latter two examples.
  // These are not empirical income or waiting-time datasets.
  // ============================================================

  const applications = [
    {
      title: 'DELAYS',
      values: [0.4, 0.3, 0.2, 0.1],
      color: C.cyan
    },
    {
      title: 'INCOMES',
      values: [0.12, 0.45, 0.22, 0.11, 0.06, 0.04],
      color: C.amber
    },
    {
      title: 'WAITING TIMES',
      values: [0.41, 0.26, 0.16, 0.09, 0.05, 0.03],
      color: C.violet
    }
  ];

  const appXs = [
    CX - 2.00,
    CX,
    CX + 2.00
  ];

  const appBase = P ? 0.10 : 0.11;

  const applicationCards = applications.map((item, k) =>
    new M.VGroup(
      txt(
        item.title,
        P ? 16 : 17,
        item.color,
        appXs[k],
        P ? 1.43 : 1.18,
        true,
        1.85
      ),
      tinyBars(
        item.values,
        appXs[k],
        appBase,
        1.65,
        P ? 0.88 : 0.70,
        item.color
      ),
      arrow(
        appXs[k],
        appBase - 0.22,
        appXs[k],
        P ? -0.99 : -0.70,
        C.green
      ),
      bellCurve(
        z => appXs[k] + z * 0.23,
        f => (P ? -2.35 : -1.97) + f * 0.94,
        -3.5, 3.5,
        0, 1,
        C.green,
        70,
        2.4
      )
    )
  );

  const applicationNote = txt(
    'Illustrative shapes · independent samples with finite spread',
    14,
    C.muted,
    CX,
    P ? -3.48 : -2.68
  );

  await until(S(33));
  await play(
    ...swap([applicationNote]),
    stagger(applicationCards, 1.9, 0.24),
    ...say('LOPSIDED DATA CAN HAVE BELL-SHAPED MEANS', C.green),
    ...fbox([
      'delays',
      'incomes',
      'waiting times',
      ['large-batch means', C.green]
    ], C.green)
  );

  // ============================================================
  // 34: Preview the next unit — uncertainty about a mean.
  // ============================================================

  const previewFill = bellFill(
    bx,
    BBASE,
    BHEIGHT,
    BMIN, BMAX,
    10, 2,
    6, 14,
    C.green,
    0.35
  );

  const previewPlot = bellScene(
    'HOW SURE ARE WE ABOUT A MEAN?'
  );

  const previewObserved = meanValueMarker(
    12,
    C.amber,
    false
  );

  const previewNote = tag(
    'NEXT UNIT: UNCERTAINTY ABOUT MEANS',
    C.violet,
    CX,
    P ? -4.46 : -2.76,
    16
  );

  await until(S(34));
  await play(
    ...swap([
      previewFill,
      ...previewPlot,
      previewObserved,
      previewNote
    ]),
    ...say('NEXT: HOW SURE CAN WE BE ABOUT A MEAN?', C.violet),
    ...fbox([
      'sampling distributions',
      'standard errors',
      ['normal approximation', C.violet],
      'help measure uncertainty'
    ], C.violet)
  );

  // ============================================================
  // 35–37: Common trap — confusing values with means.
  // ============================================================

  const trapValuePanel = shapePanel(
    1,
    CX,
    P ? -0.24 : -0.17,
    P ? 5.12 : 5.22,
    P ? 1.05 : 0.82,
    'SINGLE VALUES',
    C.amber
  );

  const trapMeanPanel = shapePanel(
    25,
    CX,
    P ? -3.52 : -2.35,
    P ? 5.12 : 5.22,
    P ? 1.35 : 1.02,
    'BATCH MEANS',
    C.violet,
    true
  );

  const trapSingleTag = tag(
    'STAY SKEWED',
    RED,
    P ? CX + 1.79 : CX + 2.15,
    P ? -1.02 : 1.04,
    16
  );

  const trapMeanTag = tag(
    'APPROACH A BELL',
    C.green,
    P ? CX : CX + 2.35,
    P ? -4.36 : -0.95,
    16
  );

  await until(S(35));
  await play(
    ...swap([
      trapValuePanel,
      trapMeanPanel,
      trapSingleTag,
      trapMeanTag
    ]),
    ...say('TRAP: THE THEOREM IS ABOUT MEANS', RED),
    ...fbox([
      ['not single values', RED],
      ['but batch means', C.green],
      'do not confuse the two'
    ], RED)
  );

  // 36: Even collecting many single parcels preserves the skew.

  const collectionSizes = [100, 1000, 10000];

  const collectionYs = P
    ? [0.48, -1.06, -2.60]
    : [0.54, -0.66, -1.86];

  function singleCollection(n, k) {
    const y = collectionYs[k];

    const chartX = CX + 1.08;

    return new M.VGroup(
      txt(
        n.toLocaleString('en-US'),
        P ? 21 : 22,
        C.ink,
        CX - 1.99,
        y + 0.18,
        true,
        2.10
      ),
      txt(
        'single parcels',
        14,
        C.muted,
        CX - 1.99,
        y - 0.17,
        false,
        2.10
      ),
      tinyBars(
        PROB,
        chartX,
        y - 0.34,
        3.42,
        P ? 0.90 : 0.70,
        C.cyan
      )
    );
  }

  const singleCollections = collectionSizes.map(
    (n, k) => singleCollection(n, k)
  );

  const collectionsCaption = txt(
    'Underlying probability shape — unchanged',
    15,
    C.muted,
    CX,
    P ? -4.04 : -2.64
  );

  await until(S(36));
  await play(
    ...swap([collectionsCaption]),
    stagger(singleCollections, 2.2, 0.27),
    ...say('MORE SINGLE PARCELS DO NOT REMOVE SKEW', RED),
    ...fbox([
      'collect more single delays',
      'same underlying model',
      ['0 min stays most likely', TEAL]
    ], C.amber)
  );

  // 37: Only the distribution of means approaches a bell.
  // Four parcels per batch still gives noticeable skew.

  const trap4Panel = shapePanel(
    4,
    CX,
    P ? -0.40 : -0.19,
    P ? 5.22 : 5.32,
    P ? 1.30 : 0.94,
    'MEANS OF 4',
    C.cyan
  );

  const trap25Panel = shapePanel(
    25,
    CX,
    P ? -3.65 : -2.49,
    P ? 5.22 : 5.32,
    P ? 1.45 : 1.10,
    'MEANS OF 25',
    C.violet,
    true
  );

  const trap4Note = tag(
    'STILL A LITTLE SKEWED',
    C.amber,
    CX + 0.73,
    P ? -1.18 : -0.86,
    14
  );

  const trap25Note = tag(
    'CLOSER TO NORMAL',
    C.green,
    CX,
    P ? -4.46 : -2.86,
    15
  );

  await until(S(37));
  await play(
    ...swap([
      trap4Panel,
      trap25Panel,
      trap4Note,
      trap25Note
    ]),
    ...say('SMALL BATCHES MAY STILL BE SKEWED', C.amber),
    ...fbox([
      ['n = 4: some skew remains', C.cyan],
      ['n = 25: closer to a bell', C.violet],
      'the required size depends',
      'on the original model'
    ], C.violet)
  );

  // ============================================================
  // 38: Final one-picture summary.
  //
  // Keep the original skewed bars and the approximately normal
  // distribution of large-batch means together.
  // ============================================================

  const finalSingle = shapePanel(
    1,
    CX,
    P ? -0.36 : -0.17,
    P ? 5.25 : 5.35,
    P ? 1.17 : 0.90,
    'SINGLE VALUES: SKEWED',
    C.amber
  );

  const finalMeans = shapePanel(
    25,
    CX,
    P ? -3.63 : -2.46,
    P ? 5.25 : 5.35,
    P ? 1.40 : 1.08,
    'BATCH MEANS: NEARLY NORMAL',
    C.violet,
    true
  );

  const finalArrow = arrow(
    CX + 2.70,
    P ? -0.95 : -0.67,
    CX + 2.70,
    P ? -2.16 : -1.23,
    C.green
  );

  const finalAverageTag = tag(
    'AVERAGE MANY INDEPENDENT VALUES',
    C.green,
    CX,
    P ? -1.40 : -0.92,
    15
  );

  const finalCondition = txt(
    'Same model · independent values · finite spread',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.55 : -3.30
  );

  const finalConclusion = tag(
    'CENTRAL LIMIT THEOREM',
    C.violet,
    CX,
    -5.10,
    18
  );

  await until(S(38));
  await play(
    ...swap([
      finalSingle,
      finalMeans,
      finalArrow,
      finalAverageTag,
      finalCondition
    ]),
    ...say('MEANS OF MANY INDEPENDENT VALUES FORM A BELL', C.violet),
    ...fbox([
      ['central limit theorem', C.violet],
      'independent values',
      'same model',
      ['finite spread', C.amber]
    ], C.violet)
  );

  await until(S(38) + 2.5);
  await play(
    new M.Indicate(
      finalMeans,
      { color: C.green }
    ),
    ...(P ? add(finalConclusion) : []),
    ...say('THE ORIGINAL VALUES NEED NOT BE BELL-SHAPED', C.green),
    ...fbox([
      'single values may be skewed',
      ['large-batch means', C.cyan],
      ['approach a normal shape', C.green],
      'after standardization'
    ], C.green)
  );

  await until(S(38) + 4.8);
  await play(
    ...say('CENTRAL LIMIT THEOREM', C.violet),
    ...fbox([
      ['centre = true mean', C.green],
      ['SE = SD / √n', C.amber],
      ['z = (X̄ − mean) / SE', C.violet],
      'approximately normal'
    ], C.violet)
  );

  await until(E(38));
}
