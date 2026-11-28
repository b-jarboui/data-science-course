// lesson 5.3.6
// Standard error — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared model: independent parcel delays of 0, 10, 20, 30 minutes,
// with probabilities 0.4, 0.3, 0.2, 0.1.
// Population mean = 10 minutes. Population SD = 10 minutes.
//
// Simulation counts verified using NumPy default_rng:
//   Seed 10, n = 4:   SD = 4.990610558839469 (previous lesson).
//   Seed 1,  n = 4:   SD = 4.986842688515449.
//   Seed 1,  n = 25:  SD = 2.0134920511390155.
//   Seed 1,  n = 100: SD = 1.0384349329640254.
//
// Each seed-1 simulation starts from a fresh generator.
// Each contains exactly 1,000 independent batches.
// Histograms for n = 25 and n = 100 use one-minute bins.
// Comparison pictures use independently scaled heights and a
// common horizontal scale, so their horizontal spreads can be compared.
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

  const TRUE_MEAN = 10;
  const TRUE_SD = 10;
  const VARIANCE = 100;

  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];

  const SIZES = [1, 4, 25, 100, 400];

  const SE = n => TRUE_SD / Math.sqrt(n);

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const NC = [
    C.amber,
    C.cyan,
    C.violet,
    C.green,
    DC[0]
  ];

  const delayColor = d => DC[d / 10];

  const fmt = v => Number(v.toFixed(2)).toString();

  const VALUES4 = Array.from(
    { length: 13 },
    (_, k) => k * 2.5
  );

  // Previous lesson: seed 10, 1,000 batches of four.
  const PREVIOUS4 = [
    22, 81, 140, 180, 197, 154, 117,
    57, 35, 13, 4, 0, 0
  ];

  // Current lesson: seed 1, 1,000 batches of four.
  const COUNTS4 = [
    28, 82, 136, 185, 182, 162, 111,
    72, 29, 11, 2, 0, 0
  ];

  // Counts in one-minute bins centred on integer minutes.
  // Bin k covers [k - 0.5, k + 0.5).
  const COUNTS25 = [
    0, 0, 0, 0, 2, 3, 40, 60,
    151, 144, 236, 138, 126, 48,
    38, 10, 3, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  const COUNTS100 = [
    0, 0, 0, 0, 0, 0, 0, 2,
    63, 228, 384, 235, 77, 9,
    2, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  const INTEGER_VALUES = Array.from(
    { length: 31 },
    (_, k) => k
  );

  const MODELS = {
    1: {
      values: D,
      counts: PROB,
      spread: 10,
      color: NC[0],
      label: 'Single parcels',
      binWidth: 2.5,
      simulated: false
    },

    4: {
      values: VALUES4,
      counts: COUNTS4,
      spread: 4.99,
      color: NC[1],
      label: 'Batches of four',
      binWidth: 2.1,
      simulated: true
    },

    25: {
      values: INTEGER_VALUES,
      counts: COUNTS25,
      spread: 2.01,
      color: NC[2],
      label: 'Batches of twenty-five',
      binWidth: 0.90,
      simulated: true
    },

    100: {
      values: INTEGER_VALUES,
      counts: COUNTS100,
      spread: 1.04,
      color: NC[3],
      label: 'Batches of one hundred',
      binWidth: 0.90,
      simulated: true
    }
  };

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

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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

  function rect(
    w, h, x, y, color,
    opacity = 0.15, sw = 2
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
    fill = C.card, opacity = 0.95
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

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(x1, y1, x2, y2, color = C.muted) {
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
    radius = 0.09,
    opacity = 0.17
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.15,
      color
    });

    halo.setFill(color, opacity);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAX_W) {
      p.scale(MAX_W / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    value, x, y,
    color = C.cyan,
    w = 1.05,
    h = 0.64
  ) {
    return new M.VGroup(
      rounded(w, h, x, y, color, color, 0.09),
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

  function parcel(x, y, color, size = 0.65) {
    return new M.VGroup(
      rect(
        size, size * 0.78,
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
        x - size / 2, y + size * 0.13,
        x + size / 2, y + size * 0.13,
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

  function delayParcel(d, x, y, size = 0.65) {
    return new M.VGroup(
      parcel(x, y, delayColor(d), size),
      txt(
        `${d} min`,
        P ? 16 : 18,
        delayColor(d),
        x, y - size * 0.79,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Groups are assembled only before their objects enter the scene.
  // Helpers return animations. Only the beat code calls play().
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);

    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    const present = objects.filter(o => visible.includes(o));

    visible = visible.filter(o => !present.includes(o));

    return present.map(o => new M.FadeOut(o));
  }

  function swap(objects) {
    const old = visible.slice();
    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(objects, runTime = 1.4, lagRatio = 0.12) {
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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

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
  // Distribution drawing helpers
  //
  // All full-size plots share the horizontal domain 0–30 minutes.
  // Heights are independently scaled for readability.
  // The one-SE bracket measures horizontal spread, not total range.
  // ------------------------------------------------------------

  const HX0 = CX - (P ? 2.85 : 3.03);
  const HX1 = CX + (P ? 2.85 : 3.03);

  const HW = HX1 - HX0;

  const HBASE = P ? -3.10 : -1.64;
  const HHEIGHT = P ? 3.65 : 2.22;

  const hx = v => HX0 + v / 30 * HW;

  const HTITLE = P ? 1.45 : 1.20;
  const HSPREAD = P ? -4.14 : -2.55;

  function numberAxis(
    base = HBASE,
    x0 = HX0,
    x1 = HX1,
    label = 'minutes'
  ) {
    const xx = v => x0 + v / 30 * (x1 - x0);

    const parts = [
      line(
        x0 - 0.18, base,
        x1 + 0.18, base,
        C.muted, 2.4
      )
    ];

    [0, 5, 10, 15, 20, 25, 30].forEach(v => {
      parts.push(
        line(
          xx(v), base - 0.07,
          xx(v), base + 0.07,
          C.muted, 1.4
        ),
        txt(
          v,
          P ? 14 : 16,
          v === 10 ? C.green : C.muted,
          xx(v),
          base - 0.26,
          true
        )
      );
    });

    if (label) {
      parts.push(
        txt(
          label,
          15,
          C.muted,
          (x0 + x1) / 2,
          base - 0.57
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function spreadBracket(
    centerValue,
    spread,
    y,
    xx = hx,
    color = C.amber,
    label = null,
    labelSize = 16
  ) {
    const a = xx(centerValue - spread);
    const b = xx(centerValue);
    const c = xx(centerValue + spread);

    const parts = [
      line(a, y, c, y, color, 3),
      line(a, y - 0.10, a, y + 0.10, color, 2),
      line(b, y - 0.13, b, y + 0.13, C.green, 2),
      line(c, y - 0.10, c, y + 0.10, color, 2)
    ];

    if (label) {
      parts.push(
        txt(
          label,
          labelSize,
          color,
          (a + c) / 2,
          y - 0.34,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function histogramBars(
    n,
    base = HBASE,
    height = HHEIGHT,
    x0 = HX0,
    x1 = HX1
  ) {
    const model = MODELS[n];
    const peak = Math.max(...model.counts);

    const xx = v =>
      x0 + v / 30 * (x1 - x0);

    const barWidth =
      (x1 - x0) * model.binWidth / 30;

    const parts = [];

    model.values.forEach((v, k) => {
      const count = model.counts[k];

      if (count <= 0) return;

      const h = height * count / peak;

      const color =
        n === 1 ? DC[k] : model.color;

      parts.push(
        new M.VGroup(
          rect(
            barWidth + 0.045,
            h + 0.025,
            xx(v), base + h / 2,
            color, 0.06, 1
          ),
          rect(
            barWidth,
            h,
            xx(v), base + h / 2,
            color, 0.76, 1.2
          )
        )
      );
    });

    return parts;
  }

  function meanGuide(
    base = HBASE,
    height = HHEIGHT,
    xx = hx
  ) {
    return new M.DashedLine({
      start: [xx(TRUE_MEAN), base, 0],
      end: [
        xx(TRUE_MEAN),
        base + height + 0.25,
        0
      ],
      color: C.green
    });
  }

  function distributionTitle(n) {
    return txt(
      n === 1
        ? 'SINGLE PARCEL DELAYS'
        : `BATCH SIZE = ${n}`,
      P ? 22 : 23,
      MODELS[n].color,
      CX, HTITLE,
      true
    );
  }

  function distributionCaption(n) {
    return txt(
      n === 1
        ? 'Exact model probabilities'
        : '1,000 simulated batch means',
      P ? 16 : 17,
      C.muted,
      CX,
      P ? -0.20 + HHEIGHT - 3.0 : -2.22,
      false
    );
  }

  function distribution(n, showSpread = true) {
    const model = MODELS[n];

    const parts = [
      numberAxis(
        HBASE,
        HX0,
        HX1,
        n === 1
          ? 'parcel delay (minutes)'
          : 'batch mean (minutes)'
      ),
      distributionTitle(n),
      ...histogramBars(n),
      meanGuide(),
      tag(
        'MEAN = 10',
        C.green,
        HX1 - 0.75,
        HBASE + HHEIGHT - 0.05,
        15
      )
    ];

    if (showSpread) {
      parts.push(
        spreadBracket(
          TRUE_MEAN,
          SE(n),
          HSPREAD,
          hx,
          C.amber,
          `1 SD = ${fmt(SE(n))} min`,
          17
        )
      );
    }

    return parts;
  }

  // ============================================================
  // 0: Recall the previous lesson's pile of batch means.
  // ============================================================

  const RECAP_BASE = P ? -3.10 : -1.64;

  const RECAP_DOT_COLS = 5;
  const RECAP_DX = HW / 12 * 0.17;
  const RECAP_DY = HHEIGHT / 40;

  const recapPiles = PREVIOUS4.map((count, k) => {
    const parts = [];

    for (let j = 0; j < count; j++) {
      const col = j % RECAP_DOT_COLS;
      const row = Math.floor(j / RECAP_DOT_COLS);

      const dot = new M.Dot({
        point: [
          hx(VALUES4[k]) + (col - 2) * RECAP_DX,
          RECAP_BASE + (row + 0.65) * RECAP_DY,
          0
        ],
        radius: Math.min(
          RECAP_DX * 0.42,
          RECAP_DY * 0.42
        ),
        color: C.cyan
      });

      dot.setFill(C.cyan, 0.94);
      parts.push(dot);
    }

    return parts.length > 0
      ? new M.VGroup(...parts)
      : null;
  }).filter(Boolean);

  const recapAxis = numberAxis(
    RECAP_BASE,
    HX0, HX1,
    'batch mean (minutes)'
  );

  const recapTitle = txt(
    '1,000 BATCHES OF FOUR',
    P ? 22 : 23,
    C.cyan,
    CX, HTITLE,
    true
  );

  const recapSpread = spreadBracket(
    10,
    5,
    HSPREAD,
    hx,
    C.amber,
    'SD ≈ 5 minutes'
  );

  const recapCenter = meanGuide();

  await until(S(0));
  await play(
    ...add(recapAxis, recapTitle, recapCenter),
    stagger(recapPiles, 1.65, 0.11),
    ...add(recapSpread),
    ...say('LAST TIME: BATCHES OF FOUR'),
    ...fbox([
      '1,000 batches',
      '4 parcels per batch',
      ['spread ≈ 5 minutes', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 1: What happens when the batch size increases?
  // ============================================================

  const questionY = P ? -0.32 : -0.42;

  const questionLeftX = CX - 1.58;
  const questionRightX = CX + 1.58;

  function batchIconCard(
    n, x, y, color, title
  ) {
    const w = P ? 2.70 : 2.85;
    const h = P ? 2.80 : 2.60;

    const parts = [
      rounded(w, h, x, y, color),
      txt(
        title,
        18, color,
        x, y + h / 2 - 0.35,
        true,
        w - 0.18
      )
    ];

    const cols = n === 4 ? 2 : 5;
    const rows = Math.ceil(n / cols);
    const pitch = n === 4 ? 0.66 : 0.38;
    const size = n === 4 ? 0.45 : 0.28;

    for (let k = 0; k < n; k++) {
      parts.push(
        parcel(
          x + (k % cols - (cols - 1) / 2) * pitch,
          y + 0.06 +
            ((rows - 1) / 2 - Math.floor(k / cols)) * pitch,
          color,
          size
        )
      );
    }

    parts.push(
      txt(
        `n = ${n}`,
        23, color,
        x, y - h / 2 + 0.34,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const questionSmall = batchIconCard(
    4, questionLeftX, questionY,
    C.cyan, 'SMALL BATCH'
  );

  const questionLarge = batchIconCard(
    25, questionRightX, questionY,
    C.violet, 'LARGER BATCH'
  );

  const questionArrow = arrow(
    CX - 0.14,
    questionY,
    CX + 0.14,
    questionY,
    C.amber
  );

  const questionNote = tag(
    'HOW MUCH DOES THE SPREAD SHRINK?',
    C.amber,
    CX,
    P ? -2.77 : -2.30,
    17
  );

  await until(S(1));
  await play(
    ...swap([
      questionSmall,
      questionLarge,
      questionArrow,
      questionNote
    ]),
    ...say('WHAT IF WE CHECK MORE PARCELS?', C.amber),
    ...fbox([
      'bigger batch',
      ['narrower pile?', C.amber],
      'by how much?'
    ], C.amber)
  );

  // ============================================================
  // 2–3: Single parcel delays have SD = 10 minutes.
  // ============================================================

  const singleAxis = numberAxis(
    HBASE,
    HX0, HX1,
    'parcel delay (minutes)'
  );

  const singleBars = histogramBars(1);

  const singleTitle = distributionTitle(1);

  const singleProbLabels = PROB.map((p, k) => {
    const h = HHEIGHT * p / 0.4;

    return txt(
      p.toFixed(1),
      P ? 18 : 20,
      DC[k],
      hx(D[k]),
      HBASE + h + 0.24,
      true
    );
  });

  const singleTruth = meanGuide(HBASE, HHEIGHT * 0.75 - 0.25);

  // 2: Start with single parcels.
  await until(S(2));
  await play(
    ...swap([
      singleAxis,
      singleTitle,
      singleTruth
    ]),
    stagger(singleBars, 1.5, 0.18),
    ...add(...singleProbLabels),
    ...say('SINGLE PARCELS: SD = 10 MINUTES', C.amber),
    ...fbox([
      ['true mean = 10', C.green],
      'variance = 100',
      ['SD = √100 = 10', C.amber]
    ], C.amber)
  );

  // 3: SD measures a typical distance from the mean.
  const singleSpread = spreadBracket(
    10,
    10,
    HSPREAD,
    hx,
    C.amber,
    'SD = 10 minutes'
  );

  const singleMeanTag = tag(
    'MEAN = 10',
    C.green,
    HX1 - 0.75,
    HBASE + HHEIGHT - 0.05,
    15
  );

  const distanceArrowsY = HBASE + 0.34;

  const distanceArrows = new M.VGroup(
    arrow(
      hx(10) - 0.12,
      distanceArrowsY,
      hx(0) + 0.12,
      distanceArrowsY,
      C.amber
    ),
    arrow(
      hx(10) + 0.12,
      distanceArrowsY,
      hx(20) - 0.12,
      distanceArrowsY,
      C.amber
    )
  );

  await until(S(3));
  await play(
    ...add(
      singleSpread,
      singleMeanTag,
      distanceArrows
    ),
    ...say('SD = TYPICAL DISTANCE FROM THE MEAN', C.amber),
    ...fbox([
      ['centre = 10 minutes', C.green],
      ['typical distance = 10', C.amber],
      'for individual parcels'
    ], C.amber)
  );

  // ============================================================
  // 4: Batches of four have spread about five.
  // ============================================================

  const fourPlot = distribution(4);

  await until(S(4));
  await play(
    ...swap(fourPlot),
    ...say('BATCH SIZE 4: SPREAD ABOUT 5', NC[1]),
    ...fbox([
      '1,000 batches of 4',
      ['simulated SD = 4.99', NC[1]],
      ['model SD = 5', C.amber]
    ], NC[1])
  );

  // ============================================================
  // 5: Batches of twenty-five have spread about two.
  // ============================================================

  const twentyFiveIconY = P ? -0.42 : -0.43;

  const twentyFiveIcons = Array.from(
    { length: 25 },
    (_, k) => {
      const col = k % 5;
      const row = Math.floor(k / 5);

      return parcel(
        CX + (col - 2) * 0.68,
        twentyFiveIconY + (2 - row) * 0.52,
        NC[2], 0.45
      );
    }
  );

  const twentyFiveRows = Array.from(
    { length: 5 },
    (_, r) =>
      new M.VGroup(
        ...twentyFiveIcons.slice(r * 5, r * 5 + 5)
      )
  );

  const twentyFiveTitle = tag(
    '25 PARCELS PER BATCH',
    NC[2],
    CX,
    P ? 1.34 : 1.13,
    18
  );

  const twentyFiveNote = txt(
    'Repeat this batch 1,000 times',
    20, C.ink,
    CX,
    P ? -2.56 : -2.30
  );

  await until(S(5));
  await play(
    ...swap([twentyFiveTitle, twentyFiveNote]),
    stagger(twentyFiveRows, 1.3, 0.14),
    ...say('NOW USE 25 PARCELS PER BATCH', NC[2]),
    ...fbox([
      ['seed = 1', C.amber],
      'batch size = 25',
      '1,000 batches',
      '25,000 parcel draws'
    ], NC[2])
  );

  const twentyFivePlot = distribution(25);

  await until(S(5) + 3.2);
  await play(
    ...swap(twentyFivePlot),
    ...say('THE PILE SHRINKS TO ABOUT 2 MINUTES', NC[2]),
    ...fbox([
      '1,000 batches of 25',
      ['simulated SD = 2.01', NC[2]],
      ['model SD = 2', C.amber]
    ], NC[2])
  );

  // ============================================================
  // 6: Batches of one hundred have spread about one.
  // ============================================================

  const hundredIconY = P ? -0.72 : -0.47;

  const hundredIcons = Array.from(
    { length: 100 },
    (_, k) =>
      rect(
        P ? 0.30 : 0.29,
        P ? 0.25 : 0.18,
        CX + (k % 10 - 4.5) * 0.40,
        hundredIconY +
          (4.5 - Math.floor(k / 10)) *
          (P ? 0.33 : 0.25),
        NC[3],
        0.55,
        1
      )
  );

  const hundredIconRows = Array.from(
    { length: 10 },
    (_, r) =>
      new M.VGroup(
        ...hundredIcons.slice(r * 10, r * 10 + 10)
      )
  );

  const hundredIconTitle = tag(
    '100 PARCELS PER BATCH',
    NC[3],
    CX,
    P ? 1.37 : 1.10,
    18
  );

  await until(S(6));
  await play(
    ...swap([hundredIconTitle]),
    stagger(hundredIconRows, 0.95, 0.08),
    ...say('NOW USE 100 PARCELS PER BATCH', NC[3]),
    ...fbox([
      ['seed = 1', C.amber],
      'batch size = 100',
      '1,000 batches',
      '100,000 parcel draws'
    ], NC[3])
  );

  const hundredPlot = distribution(100);

  await until(S(6) + 2.0);
  await play(
    ...swap(hundredPlot),
    ...say('THE PILE SHRINKS TO ABOUT 1 MINUTE', NC[3]),
    ...fbox([
      '1,000 batches of 100',
      ['simulated SD = 1.04', NC[3]],
      ['model SD = 1', C.amber]
    ], NC[3])
  );

  // ------------------------------------------------------------
  // Stacked comparison distributions
  //
  // All four share the same horizontal scale.
  // Heights are normalised separately to emphasize width.
  // Each orange bracket covers mean ± one theoretical SD/SE.
  // ------------------------------------------------------------

  const COMP_X0 = CX - (P ? 1.92 : 2.00);
  const COMP_X1 = CX + (P ? 2.78 : 2.94);

  const compX = v =>
    COMP_X0 + v / 30 * (COMP_X1 - COMP_X0);

  const COMP_BASES = P
    ? [0.18, -1.03, -2.24, -3.45]
    : [0.53, -0.36, -1.25, -2.14];

  const COMP_HEIGHT = P ? 0.74 : 0.52;

  const COMP_LABEL_X = CX - (P ? 2.66 : 2.80);

  function comparisonRow(n, k) {
    const base = COMP_BASES[k];
    const model = MODELS[n];

    const parts = [
      line(
        COMP_X0 - 0.07, base,
        COMP_X1 + 0.07, base,
        C.muted, 1.7
      ),
      ...histogramBars(
        n,
        base,
        COMP_HEIGHT,
        COMP_X0,
        COMP_X1
      ),
      txt(
        `n = ${n}`,
        P ? 17 : 18,
        model.color,
        COMP_LABEL_X,
        base + COMP_HEIGHT * 0.70,
        true,
        1.50
      ),
      txt(
        `SD ${fmt(SE(n))}`,
        P ? 17 : 16,
        C.amber,
        COMP_LABEL_X,
        base + COMP_HEIGHT * 0.10,
        true,
        1.50
      ),
      spreadBracket(
        10,
        SE(n),
        base - 0.13,
        compX,
        C.amber
      )
    ];

    return new M.VGroup(...parts);
  }

  function comparisonAxis() {
    const base =
      COMP_BASES[3] - (P ? 0.58 : 0.42);

    const parts = [];

    [0, 10, 20, 30].forEach(v => {
      parts.push(
        txt(
          v,
          16,
          v === 10 ? C.green : C.muted,
          compX(v),
          base,
          true
        )
      );
    });

    parts.push(
      txt(
        'Same minutes scale · heights scaled separately',
        P ? 15 : 15,
        C.muted,
        CX,
        P ? -4.85 : -2.88
      )
    );

    return new M.VGroup(...parts);
  }

  function comparisonCenter() {
    return new M.DashedLine({
      start: [
        compX(10),
        COMP_BASES[3] - 0.16,
        0
      ],
      end: [
        compX(10),
        COMP_BASES[0] + COMP_HEIGHT + 0.12,
        0
      ],
      color: C.green
    });
  }

  // ============================================================
  // 7: Line up all four distributions.
  // ============================================================

  const comparisonRows = [1, 4, 25, 100].map(
    (n, k) => comparisonRow(n, k)
  );

  const compAxis = comparisonAxis();
  const compCenter = comparisonCenter();

  await until(S(7));
  await play(
    ...swap([compAxis]),
    stagger(comparisonRows, 2.35, 0.28),
    ...add(compCenter),
    ...say('BIGGER BATCHES. NARROWER PILES.', C.green),
    ...fbox([
      ['n = 1      SD = 10', NC[0]],
      ['n = 4      SD = 5', NC[1]],
      ['n = 25     SD = 2', NC[2]],
      ['n = 100    SD = 1', NC[3]]
    ], C.green)
  );

  // ============================================================
  // 8–9: Name the standard error.
  // ============================================================

  const seNameY = P ? 1.35 : 1.30;

  const seName = txt(
    'STANDARD ERROR',
    P ? 24 : 26,
    C.violet,
    CX,
    seNameY,
    true
  );

  // 8: The width of the pile has a name.
  await until(S(8));
  await play(
    ...add(seName),
    ...say('THIS SPREAD IS THE STANDARD ERROR', C.violet),
    ...fbox([
      ['standard error', C.violet],
      'spread of batch means'
    ], C.violet)
  );

  // 9: The standard error is the SD of batch means.
  const selectedComparison = outline(
    P ? 6.30 : 6.60,
    P ? 1.07 : 0.80,
    CX + 0.03,
    COMP_BASES[1] + COMP_HEIGHT * 0.34,
    C.violet
  );

  await until(S(9));
  await play(
    ...add(selectedComparison),
    new M.Indicate(comparisonRows[1], {
      color: C.violet
    }),
    ...say('SE = STANDARD DEVIATION OF THE MEANS', C.violet),
    ...fbox([
      'batch size = 4',
      ['standard error = 5', C.violet],
      'typical error of',
      'one batch mean'
    ], C.violet)
  );

  // ============================================================
  // 10–16: Discover the square-root pattern.
  // ============================================================

  const PAT_W = P ? 5.85 : 6.15;
  const PAT_H = P ? 0.93 : 0.77;

  const patternYs = P
    ? [0.84, -0.55, -1.94, -3.33]
    : [0.69, -0.35, -1.39, -2.43];

  const PX_SIZE = CX - 2.12;
  const PX_ROOT = CX;
  const PX_ERROR = CX + 2.10;

  const patternHeadY = P ? 1.55 : 1.36;

  const patternHeader = new M.VGroup(
    txt(
      'BATCH SIZE',
      15, C.muted,
      PX_SIZE, patternHeadY,
      true, 1.70
    ),
    txt(
      'SQUARE',
      15, C.muted,
      PX_ROOT, patternHeadY,
      true, 1.50
    ),
    txt(
      'ERROR',
      15, C.muted,
      PX_ERROR, patternHeadY,
      true, 1.50
    )
  );

  function patternRow(
    n,
    k,
    rootLabel = '?',
    errorLabel = null
  ) {
    const y = patternYs[k];
    const color = NC[k];

    return new M.VGroup(
      rounded(
        PAT_W, PAT_H,
        CX, y,
        color,
        color, 0.06
      ),
      txt(
        n,
        P ? 25 : 26,
        color,
        PX_SIZE, y,
        true
      ),
      txt(
        rootLabel,
        P ? 21 : 22,
        rootLabel === '?' ? C.muted : C.violet,
        PX_ROOT, y,
        true, 1.92
      ),
      txt(
        errorLabel === null
          ? fmt(SE(n))
          : errorLabel,
        P ? 25 : 26,
        C.amber,
        PX_ERROR, y,
        true, 1.70
      )
    );
  }

  let patternObjects = [
    patternRow(1, 0, '1 × 1'),
    patternRow(4, 1),
    patternRow(25, 2),
    patternRow(100, 3)
  ];

  function patternFrame(k) {
    return outline(
      PAT_W + 0.13,
      PAT_H + 0.13,
      CX, patternYs[k],
      C.amber
    );
  }

  let patternActive = null;

  function selectPattern(k) {
    const a = patternActive
      ? remove(patternActive)
      : [];

    patternActive = patternFrame(k);

    return [
      ...a,
      ...add(patternActive)
    ];
  }

  function revealSquare(k, n, square) {
    const old = patternObjects[k];
    const next = patternRow(n, k, square);

    patternObjects[k] = next;

    return [
      ...remove(old),
      ...add(next)
    ];
  }

  // 10: Look for a pattern in the numbers.
  await until(S(10));
  await play(
    ...visible.splice(0).map(o => new M.FadeOut(o, { runTime: 0.25 })),
    ...clearBox(),
    ...add(
      patternHeader,
      ...patternObjects
    ),
    ...say('FIND THE PATTERN', C.amber)
  );

  // 11: From one parcel to four, the error halves.
  await until(S(11));
  await play(
    ...selectPattern(1),
    ...say('1 → 4 PARCELS: ERROR HALVES', NC[1]),
    ...fbox([
      'batch size: 1 → 4',
      'error: 10 → 5',
      ['error divided by 2', C.amber]
    ], NC[1])
  );

  // 12: Four is two times two.
  await until(S(12));
  await play(
    ...revealSquare(1, 4, '2 × 2'),
    ...say('4 = 2 × 2', C.violet),
    ...fbox([
      ['4 = 2 × 2', C.violet],
      '10 ÷ 2 = 5'
    ], C.violet)
  );

  // 13: From one to twenty-five, divide the error by five.
  await until(S(13));
  await play(
    ...selectPattern(2),
    ...say('1 → 25 PARCELS: ERROR DIVIDED BY 5', NC[2]),
    ...fbox([
      'batch size: 1 → 25',
      'error: 10 → 2',
      ['error divided by 5', C.amber]
    ], NC[2])
  );

  // 14: Twenty-five is five times five.
  await until(S(14));
  await play(
    ...revealSquare(2, 25, '5 × 5'),
    ...say('25 = 5 × 5', C.violet),
    ...fbox([
      ['25 = 5 × 5', C.violet],
      '10 ÷ 5 = 2'
    ], C.violet)
  );

  // 15: From one to one hundred, divide the error by ten.
  await until(S(15));
  await play(
    ...selectPattern(3),
    ...say('1 → 100 PARCELS: ERROR DIVIDED BY 10', NC[3]),
    ...fbox([
      'batch size: 1 → 100',
      'error: 10 → 1',
      ['error divided by 10', C.amber]
    ], NC[3])
  );

  // 16: One hundred is ten times ten.
  await until(S(16));
  await play(
    ...revealSquare(3, 100, '10 × 10'),
    ...say('100 = 10 × 10', C.violet),
    ...fbox([
      ['100 = 10 × 10', C.violet],
      '10 ÷ 10 = 1'
    ], C.violet)
  );

  // ============================================================
  // 17–18: Explain square roots visually.
  //
  // A square of 25 tiles has five tiles on each side.
  // Its square root is therefore five.
  // ============================================================

  const ROOT_CY = P ? -0.68 : -0.42;

  const ROOT_TILE = P ? 0.44 : 0.34;
  const ROOT_GAP = P ? 0.07 : 0.06;

  function squareTiles(
    side,
    x,
    y,
    tile,
    gap,
    color = C.violet
  ) {
    const pitch = tile + gap;

    const parts = [];

    for (let row = 0; row < side; row++) {
      for (let col = 0; col < side; col++) {
        parts.push(
          rect(
            tile,
            tile,
            x + (col - (side - 1) / 2) * pitch,
            y + ((side - 1) / 2 - row) * pitch,
            color, 0.67, 1.2
          )
        );
      }
    }

    return parts;
  }

  const rootTiles25 = squareTiles(
    5,
    CX,
    ROOT_CY,
    ROOT_TILE,
    ROOT_GAP
  );

  const rootTileRows = Array.from(
    { length: 5 },
    (_, r) =>
      new M.VGroup(
        ...rootTiles25.slice(r * 5, r * 5 + 5)
      )
  );

  const rootSquareW = 5 * ROOT_TILE + 4 * ROOT_GAP;

  const rootSquareFrame = outline(
    rootSquareW + 0.11,
    rootSquareW + 0.11,
    CX, ROOT_CY,
    C.violet
  );

  const rootTopY = ROOT_CY + rootSquareW / 2 + 0.31;

  const rootTopBracket = new M.VGroup(
    line(
      CX - rootSquareW / 2, rootTopY,
      CX + rootSquareW / 2, rootTopY,
      C.amber, 2.5
    ),
    line(
      CX - rootSquareW / 2, rootTopY - 0.09,
      CX - rootSquareW / 2, rootTopY + 0.09,
      C.amber, 2
    ),
    line(
      CX + rootSquareW / 2, rootTopY - 0.09,
      CX + rootSquareW / 2, rootTopY + 0.09,
      C.amber, 2
    ),
    txt(
      '5',
      24, C.amber,
      CX, rootTopY + 0.26,
      true
    )
  );

  const rootSideX = CX - rootSquareW / 2 - 0.33;

  const rootSideBracket = new M.VGroup(
    line(
      rootSideX,
      ROOT_CY - rootSquareW / 2,
      rootSideX,
      ROOT_CY + rootSquareW / 2,
      C.amber, 2.5
    ),
    line(
      rootSideX - 0.09,
      ROOT_CY - rootSquareW / 2,
      rootSideX + 0.09,
      ROOT_CY - rootSquareW / 2,
      C.amber, 2
    ),
    line(
      rootSideX - 0.09,
      ROOT_CY + rootSquareW / 2,
      rootSideX + 0.09,
      ROOT_CY + rootSquareW / 2,
      C.amber, 2
    ),
    txt(
      '5',
      24, C.amber,
      rootSideX - 0.27,
      ROOT_CY,
      true
    )
  );

  const rootResult25 = tag(
    '√25 = 5',
    C.violet,
    CX,
    P ? -2.90 : -2.11,
    23
  );

  // 17: The square root is the side length of the square.
  await until(S(17));
  await play(
    ...swap([]),
    stagger(rootTileRows, 1.3, 0.16),
    ...add(
      rootSquareFrame,
      rootTopBracket,
      rootSideBracket
    ),
    ...say('SQUARE ROOT = THE NUMBER MULTIPLIED BY ITSELF', C.violet),
    ...fbox([
      '25 tiles in a square',
      '5 tiles on each side',
      ['5 × 5 = 25', C.amber]
    ], C.violet)
  );

  await until(S(17) + 2.1);
  await play(
    ...add(rootResult25),
    ...fbox([
      '5 × 5 = 25',
      ['√25 = 5', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Three equally scaled tile squares.
  // The 10 x 10 square is physically larger than the 5 x 5 square.
  // ------------------------------------------------------------

  const squareCenters = P
    ? [
        [CX - 2.10, 0.10],
        [CX + 0.45, 0.10],
        [CX, -2.60]
      ]
    : [
        [CX - 2.25, -0.27],
        [CX - 0.50, -0.27],
        [CX + 1.78, -0.27]
      ];

  const SQUARE_TILE = P ? 0.25 : 0.19;
  const SQUARE_GAP = P ? 0.035 : 0.025;

  function rootSquareCard(side, k) {
    const [x, y] = squareCenters[k];

    const w =
      side * SQUARE_TILE +
      (side - 1) * SQUARE_GAP;

    const color = NC[k + 1];

    const labelY =
      y - w / 2 - (P ? 0.43 : 0.40);

    return new M.VGroup(
      ...squareTiles(
        side,
        x, y,
        SQUARE_TILE,
        SQUARE_GAP,
        color
      ),
      txt(
        `${side} × ${side}`,
        P ? 17 : 18,
        color,
        x,
        y + w / 2 + 0.25,
        true
      ),
      txt(
        `√${side * side} = ${side}`,
        P ? 21 : 23,
        C.violet,
        x, labelY,
        true
      )
    );
  }

  const rootCards = [2, 5, 10].map(
    (side, k) => rootSquareCard(side, k)
  );

  // 18: Square roots of 4, 25 and 100.
  await until(S(18));
  await play(
    ...swap([]),
    stagger(rootCards, 2.15, 0.30),
    ...say('√4 = 2 · √25 = 5 · √100 = 10', C.violet),
    ...fbox([
      ['√4   = 2', NC[1]],
      ['√25  = 5', NC[2]],
      ['√100 = 10', NC[3]]
    ], C.violet)
  );

  // ============================================================
  // 19–20: Divide the single-value spread by the square root.
  // ============================================================

  const DIVIDE_Y = P ? -0.45 : -0.40;

  const divideTitle = txt(
    'SPREAD OF SINGLE PARCELS',
    P ? 21 : 23,
    C.amber,
    CX,
    DIVIDE_Y + 1.28,
    true
  );

  const divideNumerator = txt(
    '10',
    46, C.amber,
    CX,
    DIVIDE_Y + 0.51,
    true
  );

  const divideFractionLine = line(
    CX - 2.20,
    DIVIDE_Y,
    CX + 2.20,
    DIVIDE_Y,
    C.ink, 3.0
  );

  const divideDenominator = txt(
    '√batch size',
    P ? 27 : 29,
    C.violet,
    CX,
    DIVIDE_Y - 0.51,
    true
  );

  const divideResult = tag(
    'STANDARD ERROR',
    C.green,
    CX,
    P ? -2.53 : -2.05,
    21
  );

  // 19: The rule in words.
  await until(S(19));
  await play(
    ...swap([
      divideTitle,
      divideNumerator,
      divideFractionLine,
      divideDenominator,
      divideResult
    ]),
    ...say('DIVIDE BY THE SQUARE ROOT OF BATCH SIZE', C.green),
    ...fbox([
      ['single-value SD = 10', C.amber],
      ['divide by √batch size', C.violet],
      ['= standard error', C.green]
    ], C.green)
  );

  // 20: Check the rule against all three simulated piles.
  const CHECK_W = P ? 5.93 : 6.15;
  const CHECK_H = P ? 1.04 : 0.88;

  const checkYs = P
    ? [0.84, -0.87, -2.58]
    : [0.72, -0.68, -2.08];

  function calculationRow(n, k) {
    const color = NC[k + 1];
    const y = checkYs[k];

    const root = Math.sqrt(n);

    return new M.VGroup(
      rounded(
        CHECK_W, CHECK_H,
        CX, y,
        color
      ),
      txt(
        `n = ${n}`,
        P ? 18 : 19,
        color,
        CX - 2.04, y + 0.17,
        true,
        1.65
      ),
      txt(
        `√${n} = ${root}`,
        P ? 16 : 17,
        C.violet,
        CX - 2.04, y - 0.21,
        true,
        1.65
      ),
      txt(
        `10 ÷ ${root}`,
        P ? 23 : 25,
        C.ink,
        CX + 0.09, y,
        true,
        2.30
      ),
      txt(
        `= ${fmt(SE(n))}`,
        P ? 26 : 27,
        C.green,
        CX + 2.04, y,
        true,
        1.63
      )
    );
  }

  const calculationRows = [4, 25, 100].map(
    (n, k) => calculationRow(n, k)
  );

  const matchTag = tag(
    'MATCHES ALL THREE PILES',
    C.green,
    CX,
    P ? -3.85 : -2.81,
    16
  );

  await until(S(20));
  await play(
    ...swap([]),
    ...add(calculationRows[0]),
    ...say('10 ÷ 2 = 5', NC[1]),
    ...fbox([
      'n = 4',
      '10 ÷ √4',
      ['= 5', NC[1]]
    ], NC[1])
  );

  await until(S(20) + 2.1);
  await play(
    ...add(calculationRows[1]),
    ...say('10 ÷ 5 = 2', NC[2]),
    ...fbox([
      'n = 25',
      '10 ÷ √25',
      ['= 2', NC[2]]
    ], NC[2])
  );

  await until(S(20) + 4.2);
  await play(
    ...add(calculationRows[2]),
    ...say('10 ÷ 10 = 1', NC[3]),
    ...fbox([
      'n = 100',
      '10 ÷ √100',
      ['= 1', NC[3]]
    ], NC[3])
  );

  await until(S(20) + 6.2);
  await play(
    ...add(matchTag),
    ...say('THE RULE MATCHES EVERY PILE', C.green),
    ...fbox([
      'predicted: 5, 2, 1',
      'simulated:',
      ['4.99, 2.01, 1.04', C.green]
    ], C.green)
  );

  // ============================================================
  // 21: The rule requires independent parcel delays.
  // ============================================================

  const independentExample = [20, 0, 10, 30];

  const IND_Y = P ? -0.16 : -0.30;
  const IND_SP = P ? 1.48 : 1.57;

  const indParcels = independentExample.map((d, k) =>
    delayParcel(
      d,
      CX + (k - 1.5) * IND_SP,
      IND_Y,
      0.76
    )
  );

  const indFrames = independentExample.map((d, k) =>
    outline(
      1.24,
      1.47,
      CX + (k - 1.5) * IND_SP,
      IND_Y - 0.19,
      C.muted
    )
  );

  const independentHeading = txt(
    'EACH PARCEL GETS ITS OWN DRAW',
    P ? 20 : 22,
    C.cyan,
    CX,
    P ? 1.19 : 1.10,
    true
  );

  const independenceTag = tag(
    'NO PARCEL CHANGES ANOTHER',
    C.green,
    CX,
    P ? -2.53 : -2.17,
    18
  );

  await until(S(21));
  await play(
    ...swap([
      independentHeading,
      ...indFrames,
      independenceTag
    ]),
    stagger(indParcels, 1.5, 0.18),
    ...say('THIS RULE NEEDS INDEPENDENT PARCELS', C.green),
    ...fbox([
      'same parcel model',
      'independent delays',
      ['no effect on each other', C.green]
    ], C.green)
  );

  // ============================================================
  // 22–24: Why does the error shrink?
  //
  // Visualise signed deviations from the true mean.
  // These illustrative batches demonstrate partial cancellation.
  // They do not claim that every batch cancels exactly.
  // ============================================================

  const DEV_VALUES4 = [30, 0, 20, 0];

  const DEV_VALUES16 = [
    30, 0, 20, 0,
    10, 20, 0, 10,
    0, 10, 20, 0,
    30, 0, 10, 10
  ];

  const DEV_BASE = P ? -0.72 : -0.56;
  const DEV_SCALE = P ? 0.086 : 0.057;

  function deviationPicture(values, label) {
    const n = values.length;

    const width = P ? 5.65 : 6.10;
    const pitch = width / n;

    const w = pitch * 0.69;

    const parts = [
      line(
        CX - width / 2 - 0.12,
        DEV_BASE,
        CX + width / 2 + 0.12,
        DEV_BASE,
        C.green, 2.5
      ),
      txt(
        label,
        P ? 21 : 22,
        C.ink,
        CX,
        P ? 1.33 : 1.21,
        true
      )
    ];

    values.forEach((d, k) => {
      const delta = d - TRUE_MEAN;
      const x =
        CX - width / 2 + (k + 0.5) * pitch;

      const color =
        delta > 0 ? C.amber :
        delta < 0 ? C.cyan : C.green;

      const h = Math.abs(delta) * DEV_SCALE;

      if (delta === 0) {
        parts.push(
          glowDot(
            x, DEV_BASE,
            color, n > 8 ? 0.045 : 0.075
          )
        );
      } else {
        parts.push(
          rect(
            w,
            h,
            x,
            DEV_BASE + Math.sign(delta) * h / 2,
            color, 0.77, 1.2
          )
        );
      }

      if (n <= 4) {
        parts.push(
          txt(
            delta > 0 ? `+${delta}` : delta,
            P ? 20 : 21,
            color,
            x,
            delta >= 0
              ? DEV_BASE + h + 0.25
              : DEV_BASE - h - 0.25,
            true
          )
        );
      }
    });

    parts.push(
      txt(
        'Above and below the true mean of 10',
        16, C.muted,
        CX,
        P ? -2.22 : -1.72
      )
    );

    return new M.VGroup(...parts);
  }

  const deviation4 = deviationPicture(
    DEV_VALUES4,
    'FOUR PARCELS'
  );

  const partialCancel4 = tag(
    '+20 − 10 + 10 − 10 = +10',
    C.amber,
    CX,
    P ? -3.28 : -2.32,
    19
  );

  // 22: High and low deviations partly cancel.
  await until(S(22));
  await play(
    ...swap([deviation4]),
    ...say('HIGH AND LOW DELAYS PARTLY CANCEL'),
    ...fbox([
      ['above the mean: +20, +10', C.amber],
      ['below the mean: −10, −10', C.cyan],
      'some differences cancel'
    ])
  );

  await until(S(22) + 2.0);
  await play(
    ...add(partialCancel4),
    ...fbox([
      'net difference = +10',
      'divide by 4',
      ['mean error = +2.5', C.amber]
    ], C.amber)
  );

  // 23: More parcels provide more opportunities for cancellation.
  const deviation16 = deviationPicture(
    DEV_VALUES16,
    'SIXTEEN PARCELS'
  );

  const devTotal16 = DEV_VALUES16.reduce(
    (sum, d) => sum + d - TRUE_MEAN,
    0
  );

  const devAvg16 = devTotal16 / DEV_VALUES16.length;

  const partialCancel16 = tag(
    `MEAN ERROR = ${devAvg16 > 0 ? '+' : ''}${fmt(devAvg16)}`,
    C.green,
    CX,
    P ? -3.28 : -2.32,
    19
  );

  await until(S(23));
  await play(
    ...swap([
      deviation16,
      partialCancel16
    ]),
    ...say('MORE VALUES, MORE PARTIAL CANCELLING', C.green),
    ...fbox([
      'illustrative larger batch',
      `net difference = ${devTotal16}`,
      [`mean error = ${fmt(devAvg16)}`, C.green]
    ], C.green)
  );

  // 24: Cancellation is partial, not perfect.
  // The spread shrinks by root n, not by n.
  const WRONG_Y = P ? 0.20 : 0.30;
  const RIGHT_Y = P ? -1.75 : -1.46;

  function ruleCard(
    heading,
    equation,
    detail,
    y,
    color
  ) {
    return new M.VGroup(
      rounded(
        P ? 5.75 : 6.05,
        P ? 1.58 : 1.43,
        CX, y,
        color
      ),
      txt(
        heading,
        17, color,
        CX, y + 0.49,
        true
      ),
      txt(
        equation,
        P ? 29 : 30,
        color,
        CX, y,
        true
      ),
      txt(
        detail,
        16, C.ink,
        CX, y - 0.48
      )
    );
  }

  const wrongRule = ruleCard(
    'WRONG: DIVIDE BY THE WHOLE BATCH',
    '10 ÷ 100 = 0.1',
    'Would predict too much precision',
    WRONG_Y,
    DC[3]
  );

  const wrongCross = line(
    CX - 2.25,
    WRONG_Y - 0.18,
    CX + 2.25,
    WRONG_Y + 0.18,
    DC[3], 3
  );

  const correctRule = ruleCard(
    'RIGHT: DIVIDE BY THE SQUARE ROOT',
    '10 ÷ √100 = 1',
    'Matches the model',
    RIGHT_Y,
    C.green
  );

  await until(S(24));
  await play(
    ...swap([
      wrongRule,
      wrongCross,
      correctRule
    ]),
    ...say('CANCELLING IS PARTIAL, NOT PERFECT', C.amber),
    ...fbox([
      ['not SD ÷ n', DC[3]],
      ['but SD ÷ √n', C.green],
      'for independent values'
    ], C.green)
  );

  // ============================================================
  // 25–28: The formal one-line rule.
  // ============================================================

  const FORM_Y = P ? -0.42 : -0.36;

  function standardErrorFormula(y = FORM_Y) {
    const parts = [
      txt(
        'SE =',
        P ? 38 : 40,
        C.green,
        CX - 1.78,
        y,
        true
      ),
      txt(
        'SD',
        P ? 38 : 40,
        C.amber,
        CX + 1.02,
        y + 0.51,
        true
      ),
      line(
        CX - 0.17, y,
        CX + 2.21, y,
        C.ink, 3.0
      ),
      txt(
        '√n',
        P ? 39 : 41,
        C.violet,
        CX + 1.02,
        y - 0.51,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const formulaHeading = txt(
    'THE STANDARD ERROR RULE',
    P ? 23 : 25,
    C.violet,
    CX,
    P ? 1.34 : 1.18,
    true
  );

  const formulaFrame = outline(
    P ? 5.75 : 6.0,
    P ? 2.03 : 1.93,
    CX, FORM_Y,
    C.violet
  );

  const formulaWords = txt(
    'error = single spread ÷ √(batch size)',
    P ? 19 : 21,
    C.ink,
    CX, FORM_Y,
    false,
    P ? 5.2 : 5.5
  );

  // 25: The short version, in one line.
  await until(S(25));
  await play(
    ...swap([
      formulaHeading,
      formulaFrame,
      formulaWords
    ]),
    ...say('THE SHORT VERSION', C.violet),
    ...clearBox()
  );

  // 26: SE equals SD divided by the square root of n.
  const mainFormula = standardErrorFormula();

  await until(S(26));
  await play(
    ...remove(formulaWords),
    ...add(mainFormula),
    ...say('SE = SD ÷ √n', C.green),
    ...fbox([
      ['SE = SD / √n', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 27: Explain each symbol.
  // ------------------------------------------------------------

  const SYMBOL_Y = P ? -2.38 : -1.75;
  const SYMBOL_SP = P ? 1.90 : 1.98;
  const SYMBOL_W = P ? 1.70 : 1.82;

  function symbolCard(symbol, meaning, value, k, color) {
    const x = CX + (k - 1) * SYMBOL_SP;

    const h = P ? 1.53 : 1.28;

    return new M.VGroup(
      rounded(
        SYMBOL_W, h,
        x, SYMBOL_Y,
        color
      ),
      txt(
        symbol,
        P ? 26 : 28,
        color,
        x,
        SYMBOL_Y + h * 0.28,
        true
      ),
      txt(
        meaning,
        P ? 15 : 16,
        C.ink,
        x,
        SYMBOL_Y - 0.04,
        false,
        SYMBOL_W - 0.13
      ),
      txt(
        value,
        15, color,
        x,
        SYMBOL_Y - h * 0.31,
        true,
        SYMBOL_W - 0.13
      )
    );
  }

  const symbolSE = symbolCard(
    'SE',
    'standard error',
    'spread of means',
    0,
    C.green
  );

  const symbolSD = symbolCard(
    'SD',
    'single-value spread',
    'here: 10 min',
    1,
    C.amber
  );

  const symbolN = symbolCard(
    'n',
    'batch size',
    'parcel count',
    2,
    C.violet
  );

  // Move the formula higher to make space for the symbol cards.
  const symbolFormulaY = P ? 0.25 : 0.45;

  const symbolFormula = standardErrorFormula(
    symbolFormulaY
  );

  await until(S(27));
  await play(
    ...swap([symbolFormula]),
    ...add(symbolSE),
    ...say('SE = STANDARD ERROR', C.green),
    ...fbox([
      ['SE', C.green],
      'standard deviation',
      'of the batch means'
    ], C.green)
  );

  await until(S(27) + 2.3);
  await play(
    ...add(symbolSD),
    ...say('SD = SPREAD OF SINGLE VALUES', C.amber),
    ...fbox([
      ['SD', C.amber],
      'standard deviation',
      'of individual delays',
      ['here: 10 minutes', C.amber]
    ], C.amber)
  );

  await until(S(27) + 5.4);
  await play(
    ...add(symbolN),
    ...say('n = BATCH SIZE', C.violet),
    ...fbox([
      ['n', C.violet],
      'number of parcels',
      'in each batch'
    ], C.violet)
  );

  // 28: Read the formula in ordinary words.
  await until(S(28));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(symbolSE, { color: C.green }),
        new M.Indicate(symbolSD, { color: C.amber }),
        new M.Indicate(symbolN, { color: C.violet })
      ],
      { lagRatio: 0.33, runTime: 2.2 }
    ),
    ...say('THE TYPICAL ERROR OF ONE BATCH MEAN', C.green),
    ...fbox([
      ['typical error of a mean', C.green],
      '= spread of single values',
      ['  ÷ √(batch size)', C.violet]
    ], C.green)
  );

  // ============================================================
  // 29–30: Use standard error before collecting data.
  // ============================================================

  const PLAN_W = P ? 5.85 : 6.05;
  const PLAN_H = P ? 1.00 : 0.87;

  const PLAN_Y = P
    ? [0.82, -0.78, -2.38]
    : [0.71, -0.70, -2.08];

  function planningRow(n, k) {
    const y = PLAN_Y[k];
    const color = NC[k + 1];

    return new M.VGroup(
      rounded(
        PLAN_W, PLAN_H,
        CX, y,
        color
      ),
      txt(
        `${n} parcels`,
        P ? 22 : 24,
        color,
        CX - 1.45,
        y,
        true, 2.55
      ),
      txt(
        `SE = ${fmt(SE(n))} min`,
        P ? 22 : 24,
        C.green,
        CX + 1.36,
        y,
        true, 2.70
      )
    );
  }

  const planningRows = [4, 25, 100].map(
    (n, k) => planningRow(n, k)
  );

  const planningNote = tag(
    'PREDICT PRECISION BEFORE COLLECTING DATA',
    C.green,
    CX,
    P ? -3.72 : -2.81,
    16
  );

  // 29: Choose a batch size using the precision required.
  await until(S(29));
  await play(
    ...swap([]),
    stagger(planningRows, 1.8, 0.24),
    ...add(planningNote),
    ...say('PLAN HOW PRECISE YOUR MEAN WILL BE', C.green),
    ...fbox([
      'before collecting data:',
      'choose a batch size',
      ['predict its standard error', C.green]
    ], C.green)
  );

  // 30: With 100 parcels, the typical error is about one minute.
  const precisionPlot = distribution(100, false);

  const precisionLeft = hx(9);
  const precisionRight = hx(11);

  const precisionBand = rect(
    precisionRight - precisionLeft,
    HHEIGHT + 0.10,
    (precisionLeft + precisionRight) / 2,
    HBASE + (HHEIGHT + 0.10) / 2,
    C.green, 0.15, 1.5
  );

  const precisionBoundaries = [
    new M.DashedLine({
      start: [precisionLeft, HBASE, 0],
      end: [
        precisionLeft,
        HBASE + HHEIGHT + 0.10,
        0
      ],
      color: C.amber
    }),
    new M.DashedLine({
      start: [precisionRight, HBASE, 0],
      end: [
        precisionRight,
        HBASE + HHEIGHT + 0.10,
        0
      ],
      color: C.amber
    })
  ];

  const precisionBracket = spreadBracket(
    10,
    1,
    HSPREAD,
    hx,
    C.amber,
    'SE = 1 minute'
  );

  const precisionRangeTag = tag(
    '9 TO 11 MINUTES',
    C.green,
    CX,
    P ? -4.88 : -2.82,
    17
  );

  await until(S(30));
  await play(
    ...swap([
      precisionBand,
      ...precisionPlot,
      ...precisionBoundaries,
      precisionBracket
    ]),
    ...say('100 PARCELS: TYPICAL ERROR ABOUT 1 MINUTE', C.green),
    ...fbox([
      'n = 100',
      'SE = 10 ÷ 10',
      ['SE = 1 minute', C.green],
      'true mean = 10'
    ], C.green)
  );

  await until(S(30) + 2.5);
  await play(
    ...add(precisionRangeTag),
    ...fbox([
      ['10 ± 1 minute', C.green],
      'rough guide to spread',
      'not a guaranteed range'
    ], C.green)
  );

  // ============================================================
  // 31–34: Common trap — diminishing returns.
  //
  // Four times the work halves the standard error.
  // Another halving requires another fourfold increase.
  // ============================================================

  const WORK_W = P ? 5.25 : 5.50;
  const WORK_X0 = CX - WORK_W / 2;

  const WORK_Y = P
    ? [0.85, -1.05, -2.95]
    : [0.77, -0.70, -2.15];

  function workRow(n, k, maxN = 400) {
    const y = WORK_Y[k];
    const color = NC[k + 2];

    const barH = P ? 0.32 : 0.25;
    const w = WORK_W * n / maxN;

    return new M.VGroup(
      txt(
        `${n} parcels`,
        P ? 20 : 22,
        color,
        CX - 1.56,
        y + 0.39,
        true
      ),
      txt(
        `SE = ${fmt(SE(n))}`,
        P ? 22 : 24,
        C.green,
        CX + 1.64,
        y + 0.39,
        true
      ),
      rect(
        WORK_W,
        barH,
        CX, y - 0.04,
        C.muted, 0.035, 1
      ),
      rect(
        w,
        barH,
        WORK_X0 + w / 2,
        y - 0.04,
        color, 0.80, 1
      )
    );
  }

  function workMultiplier(y, label = '×4 PARCELS · ÷2 ERROR') {
    return new M.VGroup(
      arrow(
        CX,
        y + 0.17,
        CX,
        y - 0.17,
        C.amber
      ),
      (() => {
        const t = txt(label, 17, C.amber, 0, y, true, P ? 3.3 : 3.4);
        t.moveTo([CX + 0.30 + t.getWidth() / 2, y, 0]);
        return t;
      })()
    );
  }

  const work25 = workRow(25, 0);
  const work100 = workRow(100, 1);
  const work400 = workRow(400, 2);

  const multiplier1 = workMultiplier(
    (WORK_Y[0] + WORK_Y[1]) / 2 - 0.05
  );

  const multiplier2 = workMultiplier(
    (WORK_Y[1] + WORK_Y[2]) / 2 - 0.05
  );

  // 31: Bigger batches do not pay off evenly.
  const workQuestion = tag(
    'TWICE THE PRECISION?',
    C.amber,
    CX,
    P ? -2.52 : -2.13,
    20
  );

  await until(S(31));
  await play(
    ...swap([
      work25,
      workQuestion
    ]),
    ...say('TRAP: 4× PARCELS IS NOT 4× LESS ERROR', DC[3]),
    ...fbox([
      'start with 25 parcels',
      'SE = 2 minutes',
      ['how to halve the error?', C.amber]
    ], C.amber)
  );

  // 32: From 25 to 100 is four times the work.
  await until(S(32));
  await play(
    ...remove(workQuestion),
    ...add(multiplier1, work100),
    ...say('4 TIMES THE WORK ONLY HALVES THE ERROR', C.amber),
    ...fbox([
      '25 × 4 = 100 parcels',
      'SE: 2 → 1',
      ['4× work, ½ error', C.amber]
    ], C.amber)
  );

  // 33: Halve again, from one to one-half.
  await until(S(33));
  await play(
    ...add(multiplier2, work400),
    ...say('TO HALVE IT AGAIN, USE 400 PARCELS', C.green),
    ...fbox([
      '100 × 4 = 400',
      '√400 = 20',
      ['10 ÷ 20 = 0.5', C.green]
    ], C.green)
  );

  // 34: Every halving costs four times as many parcels.
  const workRuleTag = tag(
    'EACH HALVING COSTS FOUR TIMES THE WORK',
    C.amber,
    CX,
    P ? -4.10 : -2.81,
    15
  );

  await until(S(34));
  await play(
    ...add(workRuleTag),
    new M.LaggedStart(
      [
        new M.Indicate(multiplier1, {
          color: C.amber
        }),
        new M.Indicate(multiplier2, {
          color: C.amber
        })
      ],
      { lagRatio: 0.25, runTime: 1.25 }
    ),
    ...say('EVERY HALVING NEEDS FOUR TIMES AS MANY PARCELS', C.amber),
    ...fbox([
      ['SE ÷ 2', C.green],
      ['requires n × 4', C.amber],
      'because √4 = 2'
    ], C.amber)
  );

  // ============================================================
  // 35: Final one-picture summary.
  //
  // Keep the formula and three progressively narrower
  // distributions visible together.
  // ============================================================

  const FINAL_X0 = CX - (P ? 1.90 : 1.95);
  const FINAL_X1 = CX + (P ? 2.85 : 2.94);

  const finalX = v =>
    FINAL_X0 + v / 30 * (FINAL_X1 - FINAL_X0);

  const FINAL_BASES = P
    ? [-0.42, -1.82, -3.22]
    : [-0.26, -1.19, -2.12];

  const FINAL_H = P ? 0.80 : 0.53;

  const FINAL_LABEL_X = CX - (P ? 2.65 : 2.72);

  function finalDistributionRow(n, k) {
    const base = FINAL_BASES[k];

    const color = MODELS[n].color;

    return new M.VGroup(
      line(
        FINAL_X0 - 0.09,
        base,
        FINAL_X1 + 0.09,
        base,
        C.muted, 1.8
      ),
      ...histogramBars(
        n,
        base,
        FINAL_H,
        FINAL_X0,
        FINAL_X1
      ),
      txt(
        `n = ${n}`,
        P ? 19 : 18,
        color,
        FINAL_LABEL_X,
        base + FINAL_H * 0.76,
        true,
        1.50
      ),
      txt(
        `SE ${fmt(SE(n))}`,
        P ? 19 : 18,
        C.amber,
        FINAL_LABEL_X,
        base + FINAL_H * 0.12,
        true,
        1.50
      ),
      spreadBracket(
        10,
        SE(n),
        base - 0.15,
        finalX,
        C.amber
      )
    );
  }

  const finalRows = [4, 25, 100].map(
    (n, k) => finalDistributionRow(n, k)
  );

  const finalFormulaY = P ? 1.13 : 1.12;

  const finalFormula = new M.VGroup(
    rounded(
      P ? 4.75 : 5.25,
      P ? 0.77 : 0.64,
      CX, finalFormulaY,
      C.violet
    ),
    txt(
      'SE = SD / √n',
      P ? 30 : 31,
      C.green,
      CX, finalFormulaY,
      true
    )
  );

  const finalCenter = new M.DashedLine({
    start: [
      finalX(10),
      FINAL_BASES[2] - 0.15,
      0
    ],
    end: [
      finalX(10),
      FINAL_BASES[0] + FINAL_H + 0.07,
      0
    ],
    color: C.green
  });

  const finalAxis = new M.VGroup(
    ...[0, 10, 20, 30].map(v =>
      txt(
        v,
        16,
        v === 10 ? C.green : C.muted,
        finalX(v),
        FINAL_BASES[2] - 0.40,
        true
      )
    ),
    txt(
      'Batch mean (minutes)',
      16, C.muted,
      (FINAL_X0 + FINAL_X1) / 2,
      FINAL_BASES[2] - 0.70
    )
  );

  const finalHeightNote = txt(
    'Same horizontal scale · heights scaled separately',
    15, C.muted,
    CX,
    P ? -4.55 : -3.40
  );

  const finalTag = tag(
    'BIGGER BATCHES GIVE MORE PRECISE MEANS',
    C.green,
    CX,
    -5.05,
    16
  );

  await until(S(35));
  await play(
    ...swap([
      finalFormula,
      finalAxis
    ]),
    stagger(finalRows, 1.8, 0.24),
    ...add(finalCenter),
    ...say('STANDARD ERROR = SPREAD OF BATCH MEANS', C.violet),
    ...fbox([
      ['standard error', C.violet],
      'spread of batch means',
      ['SE = SD / √n', C.green]
    ], C.violet)
  );

  await until(S(35) + 2.4);
  await play(
    ...add(finalHeightNote),
    new M.Indicate(finalFormula, {
      color: C.green
    }),
    ...say('SINGLE-PARCEL SPREAD ÷ √(BATCH SIZE)', C.green),
    ...fbox([
      ['SD = 10 minutes', C.amber],
      'n = 4    → SE = 5',
      'n = 25   → SE = 2',
      ['n = 100  → SE = 1', C.green]
    ], C.green)
  );

  await until(S(35) + 4.6);
  await play(
    ...(P ? add(finalTag) : []),
    ...say('BIGGER BATCHES. MORE PRECISE MEANS.', C.green),
    ...fbox([
      ['SE = SD / √n', C.green],
      'independent values',
      ['4× batch size → ½ error', C.amber]
    ], C.green)
  );

  await until(E(35));
}
