// lesson 5.2.9
// Quantile–quantile plots — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API.
// The Machine A and faulty-batch observations are the fixed chapter data.
// Additional diagnostic patterns and simulated samples are illustrative.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;

  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const MAXW = P ? FW - 1.2 : 6.0;

  // ------------------------------------------------------------
  // Fixed chapter data
  // ------------------------------------------------------------

  const MU = 500;
  const SIGMA = 2;

  const GOOD = [
    497, 499, 500, 501, 503
  ];

  const BAD = [
    498, 499, 499, 500, 506
  ];

  const PROBS = [
    0.10, 0.30, 0.50, 0.70, 0.90
  ];

  const Z = [
    -1.28, -0.52, 0, 0.52, 1.28
  ];

  const EXPECTED = [
    497.4, 499.0, 500.0, 501.0, 502.6
  ];

  // Boundaries of five equal-probability slices.
  // The first and last slices extend into the infinite tails.
  const CUTS = [
    -Infinity,
    -0.8416212336,
    -0.2533471031,
    0.2533471031,
    0.8416212336,
    Infinity
  ];

  const SLICE_COLORS = [
    C.cyan,
    C.violet,
    C.green,
    C.violet,
    C.cyan
  ];

  const pt = (x, y) => [x, y, 0];

  // ------------------------------------------------------------
  // Shared drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, x, y,
    size = 20,
    color = C.ink,
    mono = false
  ) {
    const t = T(s, P && size < 18 ? 18 : size, color, mono);
    t.moveTo(pt(x, y));

    return t;
  }

  function fitText(
    s, x, y,
    size = 20,
    color = C.ink,
    maxw = MAXW,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth: sw
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
    x, y, w, h,
    color,
    opacity = 0.2,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.001),
      height: Math.max(h, 0.001),
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function rounded(
    x, y, w, h,
    color,
    opacity = 0.10
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    radius = 0.1,
    color = C.cyan,
    opacity = 1
  ) {
    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, opacity);

    return d;
  }

  function glow(
    x, y,
    radius = 0.1,
    color = C.cyan
  ) {
    return new M.VGroup(
      dot(x, y, radius * 2.1, color, 0.16),
      dot(x, y, radius, color, 1)
    );
  }

  function tag(
    s, x, y,
    color = C.cyan,
    size = 17,
    maxw = MAXW
  ) {
    const p = pill(s, color, size);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo(pt(x, y));

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    sw = 3
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.15;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),

      line(
        x2, y2,
        x2 - h * Math.cos(a - 0.55),
        y2 - h * Math.sin(a - 0.55),
        color, sw
      ),

      line(
        x2, y2,
        x2 - h * Math.cos(a + 0.55),
        y2 - h * Math.sin(a + 0.55),
        color, sw
      )
    );
  }

  function bracket(
    x1, x2, y,
    label,
    color = C.amber,
    above = false
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 2),

      line(
        x1, y - 0.08,
        x1, y + 0.08,
        color, 2
      ),

      line(
        x2, y - 0.08,
        x2, y + 0.08,
        color, 2
      ),

      txt(
        label,
        (x1 + x2) / 2,
        y + (above ? 0.25 : -0.27),
        17, color
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved reference styling and placement
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    if (!lines) {
      const a = boxNow
        ? [new M.FadeOut(boxNow)]
        : [];

      boxNow = null;

      return a;
    }

    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.36;

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
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.9 : 3.4;

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

  // ------------------------------------------------------------
  // Picture management
  //
  // Objects are grouped only before they appear on screen.
  // All play() calls are awaited sequentially.
  // ------------------------------------------------------------

  let picture = [];
  let overlays = [];

  function clearOverlays() {
    const a = overlays.map(
      o => new M.FadeOut(o)
    );

    overlays = [];

    return a;
  }

  function clearPicture() {
    const a = [
      ...clearOverlays(),

      ...picture.map(
        o => new M.FadeOut(o)
      )
    ];

    picture = [];

    return a;
  }

  function replacePicture(...objects) {
    const a = clearPicture();

    picture = objects;

    return [
      ...a,

      ...objects.map(
        o => new M.FadeIn(o)
      )
    ];
  }

  function replaceOverlay(...objects) {
    const a = clearOverlays();

    overlays = objects;

    return [
      ...a,

      ...objects.map(
        o => new M.FadeIn(o)
      )
    ];
  }

  // ------------------------------------------------------------
  // Rice-bag icons and weighing scale
  // ------------------------------------------------------------

  function riceBag(
    x, y,
    weight = null,
    color = C.cyan,
    scale = 1
  ) {
    const w = 0.78 * scale;
    const h = 1.03 * scale;

    const body = rounded(
      x, y,
      w, h,
      color,
      0.12
    );

    const seal = line(
      x - w * 0.39,
      y + h * 0.36,
      x + w * 0.39,
      y + h * 0.36,
      C.green, 3
    );

    const bottom = line(
      x - w * 0.38,
      y - h * 0.36,
      x + w * 0.38,
      y - h * 0.36,
      C.muted, 2
    );

    const label = fitText(
      '500 g',
      x, y + 0.03 * scale,
      17, C.ink,
      w * 0.81,
      true
    );

    const objects = [
      body,
      seal,
      bottom,
      label
    ];

    if (weight !== null) {
      objects.push(
        txt(
          `${weight} g`,
          x,
          y - h / 2 - 0.35,
          P ? 17 : 18,
          color,
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function scaleIcon(x, y, value) {
    const body = rounded(
      x, y,
      2.15, 0.80,
      C.muted, 0.15
    );

    const platform = rect(
      x, y + 0.46,
      2.42, 0.15,
      C.muted, 0.30
    );

    const screen = rounded(
      x, y + 0.02,
      1.37, 0.41,
      C.cyan, 0.13
    );

    return new M.VGroup(
      body,
      platform,
      screen,

      txt(
        value,
        x, y + 0.02,
        21, C.cyan, true
      )
    );
  }

  function weighingPicture() {
    const y = P ? -2.6 : -0.78;

    return new M.VGroup(
      scaleIcon(CX, y, '500 g'),

      riceBag(
        CX,
        y + 1.19,
        null,
        C.cyan,
        1.12
      ),

      txt(
        'Weigh five bags from Machine A',
        CX, y + 2.02,
        21, C.ink
      ),

      ...[-2.35, -1.30, 1.30, 2.35].map(dx =>
        riceBag(
          CX + dx,
          y - 0.83,
          null,
          C.cyan,
          0.75
        )
      ),

      txt(
        'Five actual measurements',
        CX, y - 1.55,
        17, C.muted
      )
    );
  }

  function sortedBags(
    values,
    color = C.cyan,
    title = 'Sorted from light to heavy'
  ) {
    const y = P ? -2.4 : -0.48;
    const dx = 1.07;

    const objects = [
      fitText(
        title,
        CX, y + 1.48,
        22, C.ink
      )
    ];

    for (let i = 0; i < values.length; i++) {
      const x = CX + (i - 2) * dx;

      const c =
        values[i] === 506
          ? C.amber
          : color;

      objects.push(
        riceBag(
          x, y,
          values[i],
          c,
          0.91
        ),

        txt(
          `#${i + 1}`,
          x, y + 0.77,
          16, C.muted, true
        )
      );
    }

    objects.push(
      arrow(
        CX - 2.38, y - 1.43,
        CX + 2.38, y - 1.43,
        C.muted, 2
      ),

      txt(
        'Lightest',
        CX - 1.75, y - 1.75,
        17, C.muted
      ),

      txt(
        'Heaviest',
        CX + 1.75, y - 1.75,
        17, C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Normal density graph
  //
  // Internal coordinates are standard-normal z-scores.
  // Labels can show either z-scores or equivalent grams.
  // The five slices have equal probability, not equal width.
  // ------------------------------------------------------------

  const NX = CX - 2.76;
  const NY = P ? -3.85 : -2.12;

  const NW = P
    ? Math.min(5.70, FW - 1.65)
    : 5.80;

  const NH = P ? 4.40 : 2.78;

  const ZMIN = -3.8;
  const ZMAX = 3.8;
  const NMAX = 0.46;

  function normalPDF(z) {
    return Math.exp(-0.5 * z * z) /
      Math.sqrt(2 * Math.PI);
  }

  const nx = z =>
    NX + (z - ZMIN) / (ZMAX - ZMIN) * NW;

  const ny = d =>
    NY + d / NMAX * NH;

  function normalAxes(
    standard = false,
    title = null
  ) {
    const ticks = standard
      ? [
          [-3, '−3'],
          [-2, '−2'],
          [-1, '−1'],
          [0, '0'],
          [1, '1'],
          [2, '2'],
          [3, '3']
        ]
      : [
          [-3, '494'],
          [-2, '496'],
          [-1, '498'],
          [0, '500'],
          [1, '502'],
          [2, '504'],
          [3, '506']
        ];

    const objects = [
      line(
        nx(ZMIN), NY,
        nx(ZMAX), NY,
        C.muted, 3
      ),

      line(
        nx(ZMIN), NY,
        nx(ZMIN), NY + NH,
        C.muted, 2
      ),

      fitText(
        title || (
          standard
            ? 'The standard normal bell'
            : 'Machine A: normal fill weights'
        ),
        CX, NY + NH + 0.43,
        22, C.ink
      ),

      txt(
        standard
          ? 'Standard deviation steps (z)'
          : 'Fill weight in grams',
        CX, NY - 0.65,
        17, C.muted
      ),

      txt(
        'density',
        nx(ZMIN) + 0.37,
        NY + NH - 0.04,
        15, C.muted
      )
    ];

    ticks.forEach(([z, label]) => {
      objects.push(
        line(
          nx(z), NY - 0.07,
          nx(z), NY + 0.07,
          C.muted, 2
        ),

        txt(
          label,
          nx(z), NY - 0.29,
          16, C.muted, true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function normalCurve(
    a = ZMIN,
    b = ZMAX,
    color = C.cyan,
    n = 120,
    sw = 4
  ) {
    const segments = [];

    for (let i = 0; i < n; i++) {
      const z1 = a + (b - a) * i / n;
      const z2 = a + (b - a) * (i + 1) / n;

      segments.push(
        line(
          nx(z1), ny(normalPDF(z1)),
          nx(z2), ny(normalPDF(z2)),
          color, sw
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function normalArea(
    a, b,
    color = C.amber,
    opacity = 0.40
  ) {
    // The visible graph clips only the negligible far tails.
    a = Math.max(a, ZMIN);
    b = Math.min(b, ZMAX);

    const strips = [];

    const n = Math.max(
      8,
      Math.ceil(
        (b - a) / (ZMAX - ZMIN) * 150
      )
    );

    const dz = (b - a) / n;

    for (let i = 0; i < n; i++) {
      const left = a + i * dz;
      const right = left + dz;
      const mid = (left + right) / 2;

      const h = ny(normalPDF(mid)) - NY;

      if (h <= 0.001) continue;

      strips.push(
        rect(
          (nx(left) + nx(right)) / 2,
          NY + h / 2,
          nx(right) - nx(left) + 0.001,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...strips);
  }

  function meanGuide() {
    return new M.VGroup(
      dashed(
        nx(0), NY,
        nx(0), ny(normalPDF(0)),
        C.green
      ),

      glow(
        nx(0), ny(normalPDF(0)),
        0.075, C.green
      ),

      txt(
        'Mean = 500 g',
        nx(0),
        ny(normalPDF(0)) + 0.28,
        18, C.green
      )
    );
  }

  function normalModelPicture() {
    return new M.VGroup(
      normalAxes(false),
      normalArea(
        ZMIN, ZMAX,
        C.cyan, 0.15
      ),
      normalCurve(),
      meanGuide()
    );
  }

  // ------------------------------------------------------------
  // 0 — recall the normal bell for Machine A
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...replacePicture(normalModelPicture()),

    ...say('MACHINE A: THE NORMAL BELL'),

    ...fbox([
      'Normal model',
      ['Mean = 500 g', C.green],
      'Standard deviation = 2 g'
    ])
  );

  // ------------------------------------------------------------
  // 1 — was the normal law a good choice?
  // ------------------------------------------------------------

  const question1 = tag(
    'DOES IT FIT?',
    nx(2.15),
    NY + NH * 0.58,
    C.amber,
    19,
    2.25
  );

  await until(S(1));

  await play(
    ...replaceOverlay(question1),

    ...say('DO OUR REAL BAGS FOLLOW THE BELL?', C.amber),

    ...fbox([
      "Manager's question",
      'Compare actual weights',
      ['with the normal model', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 2 — take five bags and weigh them
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...replacePicture(weighingPicture()),

    ...say('WEIGH FIVE BAGS'),

    ...fbox([
      'Machine A',
      ['5 actual bags', C.cyan],
      'Measure their fill weights'
    ])
  );

  // ------------------------------------------------------------
  // 3 — reveal the sorted real measurements
  // ------------------------------------------------------------

  await until(S(3));

  const bagY3 = P ? -2.4 : -0.48;

  const bagRow3 = [];

  const order3 = txt(
    'Sorted from light to heavy',
    CX, bagY3 + 1.45,
    22, C.ink
  );

  const arrow3 = arrow(
    CX - 2.38, bagY3 - 1.43,
    CX + 2.38, bagY3 - 1.43,
    C.muted, 2
  );

  await play(
    ...replacePicture(
      order3,
      arrow3
    ),

    ...say('SORT THE ACTUAL WEIGHTS'),

    ...fbox([
      'Observed weights',
      'Lightest → heaviest'
    ])
  );

  for (let i = 0; i < GOOD.length; i++) {
    const bag = riceBag(
      CX + (i - 2) * 1.07,
      bagY3,
      GOOD[i],
      C.cyan,
      0.91
    );

    bagRow3.push(bag);
    picture.push(bag);

    await play(
      new M.FadeIn(
        bag,
        { runTime: 0.55 }
      ),

      ...fbox([
        'Observed weights',
        [
          GOOD.slice(0, i + 1).join(', '),
          C.cyan
        ],
        'grams'
      ])
    );
  }

  // ------------------------------------------------------------
  // 4 — ask where five typical bags would sit under the bell
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...replacePicture(
      normalAxes(
        false,
        'Where would the bell place five bags?'
      ),
      normalCurve()
    ),

    ...say('ASK THE BELL FOR FIVE POSITIONS', C.violet),

    ...fbox([
      'Five real measurements',
      'Five theoretical positions',
      ['Compare the two sets', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Five equal-area slices
  // ------------------------------------------------------------

  function sliceBoundaries() {
    return new M.VGroup(
      ...CUTS.slice(1, -1).map(z =>
        dashed(
          nx(z), NY,
          nx(z), ny(normalPDF(z)),
          C.ink
        )
      )
    );
  }

  function sliceAreas(
    opacity = 0.38
  ) {
    return Array.from(
      { length: 5 },
      (_, i) =>
        normalArea(
          CUTS[i],
          CUTS[i + 1],
          SLICE_COLORS[i],
          opacity
        )
    );
  }

  function sliceLabels() {
    const positions = [
      -1.55,
      -0.54,
      0,
      0.54,
      1.55
    ];

    return new M.VGroup(
      ...positions.map((z, i) =>
        fitText(
          '20%',
          nx(z),
          NY + NH * (
            i === 0 || i === 4
              ? 0.13
              : 0.25
          ),
          15,
          C.ink,
          i === 0 || i === 4
            ? 0.55
            : NW * 0.064,
          true
        )
      )
    );
  }

  function fiveSlicePicture(
    showLabels = true
  ) {
    const objects = [
      normalAxes(
        false,
        'Five slices of equal area'
      ),

      ...sliceAreas(),

      normalCurve(),

      sliceBoundaries()
    ];

    if (showLabels) {
      objects.push(sliceLabels());
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // 5 — cut the bell into five equal-area slices
  // ------------------------------------------------------------

  await until(S(5));

  const axes5 = normalAxes(
    false,
    'Five slices of equal area'
  );

  const fills5 = sliceAreas();

  const boundaries5 = sliceBoundaries();

  const curve5 = normalCurve();

  await play(
    ...clearPicture(),

    new M.FadeIn(axes5),

    new M.FadeIn(curve5),

    new M.FadeIn(boundaries5),

    new M.LaggedStart(
      fills5.map(
        a => new M.FadeIn(a)
      ),
      {
        lagRatio: 0.50,
        runTime: 3.3
      }
    ),

    ...say('FIVE SLICES — EQUAL AREA'),

    ...fbox([
      'Normal: mean 500 g',
      'SD = 2 g',
      ['Split into 5 equal areas', C.cyan]
    ])
  );

  picture = [
    axes5,
    curve5,
    boundaries5,
    ...fills5
  ];

  // ------------------------------------------------------------
  // 6 — each slice holds one fifth
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...replaceOverlay(sliceLabels()),

    ...say('EACH SLICE HOLDS 20%', C.green),

    ...fbox([
      'Total area = 1',
      '1 ÷ 5 = 0.2',
      ['Each slice = 20%', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Quantile markers
  //
  // The middle of each slice means the middle by probability,
  // not the midpoint of the slice's horizontal width.
  // ------------------------------------------------------------

  function quantileMarker(
    i,
    options = {}
  ) {
    const z = Z[i];

    const color =
      options.color || C.amber;

    const top = ny(normalPDF(z));

    const objects = [
      dashed(
        nx(z), NY,
        nx(z), top,
        color
      ),

      glow(
        nx(z), top,
        0.070,
        color
      )
    ];

    if (options.percent) {
      const labelY =
        top + (
          i % 2 === 0
            ? 0.27
            : 0.49
        );

      objects.push(
        txt(
          `${Math.round(PROBS[i] * 100)}%`,
          nx(z),
          labelY,
          15,
          color,
          true
        )
      );
    }

    if (options.weight) {
      objects.push(
        txt(
          EXPECTED[i].toFixed(1),
          nx(z),
          NY + (
            i % 2 === 0
              ? 0.23
              : 0.48
          ),
          15,
          color,
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function quantileMarkers(
    percent = true
  ) {
    return new M.VGroup(
      ...Z.map((_, i) =>
        quantileMarker(
          i,
          {
            percent,
            color: C.amber
          }
        )
      )
    );
  }

  // ------------------------------------------------------------
  // 7 — put a mark halfway through the probability of each slice
  // ------------------------------------------------------------

  await until(S(7));

  const marks7 = Z.map((_, i) =>
    quantileMarker(
      i,
      {
        percent: false,
        color: C.amber
      }
    )
  );

  await play(
    ...clearOverlays(),

    new M.LaggedStart(
      marks7.map(
        m => new M.FadeIn(m)
      ),
      {
        lagRatio: 0.42,
        runTime: 3.6
      }
    ),

    ...say('ONE MARK IN THE MIDDLE OF EACH SLICE', C.amber),

    ...fbox([
      'Five equal-area slices',
      'One probability midpoint',
      ['in each slice', C.amber]
    ], C.amber)
  );

  overlays = marks7;

  // ------------------------------------------------------------
  // 8 — first mark: ten percent of the area to its left
  // ------------------------------------------------------------

  await until(S(8));

  const tenPercent8 = new M.VGroup(
    dashed(
      nx(Z[0]), NY,
      nx(Z[0]), ny(normalPDF(Z[0])),
      C.amber
    ),

    glow(
      nx(Z[0]),
      ny(normalPDF(Z[0])),
      0.09,
      C.amber
    ),

    txt(
      '10% point',
      nx(Z[0]) - 0.47,
      ny(normalPDF(Z[0])) + 0.37,
      18, C.amber
    ),

    txt(
      '10% of all area',
      nx(-2.22),
      NY + NH * 0.34,
      16, C.amber
    ),

    arrow(
      nx(-2.15),
      NY + NH * 0.26,
      nx(-1.63),
      ny(normalPDF(-1.63)) - 0.05,
      C.amber, 2
    )
  );

  await play(
    ...replacePicture(
      normalAxes(
        false,
        'The first probability midpoint'
      ),

      normalArea(
        -Infinity,
        -1.2815515655,
        C.amber,
        0.55
      ),

      normalArea(
        -1.2815515655,
        CUTS[1],
        C.cyan,
        0.18
      ),

      normalCurve(),

      dashed(
        nx(CUTS[1]), NY,
        nx(CUTS[1]),
        ny(normalPDF(CUTS[1])),
        C.muted
      )
    ),

    ...replaceOverlay(tenPercent8),

    ...say('FIRST MARK: THE 10% POINT', C.amber),

    ...fbox([
      'First slice = 20%',
      'Half of that slice = 10%',
      ['10% of area lies to its left', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 9 — all five probability points
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...replacePicture(
      fiveSlicePicture(false)
    ),

    ...replaceOverlay(
      quantileMarkers(true)
    ),

    ...say('10%, 30%, 50%, 70%, 90%', C.amber),

    ...fbox([
      'Five probability points',
      ['0.10, 0.30, 0.50', C.amber],
      ['0.70, 0.90', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 10 — name the idea: a quantile
  // ------------------------------------------------------------

  function quantileDefinition(
    index = 1
  ) {
    const z = Z[index];
    const p = PROBS[index];

    const objects = [
      normalAxes(
        false,
        'A quantile is an area-based position'
      ),

      normalArea(
        -Infinity,
        z,
        C.amber,
        0.43
      ),

      normalCurve(),

      dashed(
        nx(z), NY,
        nx(z), ny(normalPDF(z)),
        C.amber
      ),

      glow(
        nx(z),
        ny(normalPDF(z)),
        0.085,
        C.amber
      ),

      txt(
        `${Math.round(p * 100)}%`,
        nx(-1.45),
        NY + NH * 0.23,
        21, C.amber, true
      ),

      tag(
        'QUANTILE',
        nx(2.45),
        NY + NH * 0.84,
        C.violet,
        18,
        2.2
      ),

      arrow(
        nx(1.45),
        NY + NH * 0.80,
        nx(z) + 0.07,
        ny(normalPDF(z)) + 0.02,
        C.violet, 2
      )
    ];

    return new M.VGroup(...objects);
  }

  await until(S(10));

  await play(
    ...replacePicture(
      quantileDefinition(1)
    ),

    ...say('A FIXED AREA POINT = A QUANTILE', C.violet),

    ...fbox([
      'Quantile',
      'A position on the line',
      ['A fixed share lies below it', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 11 — quantile and percentile are the same idea
  // ------------------------------------------------------------

  const percentile11 = new M.VGroup(
    tag(
      '30th PERCENTILE',
      nx(2.45),
      NY + NH * 0.56,
      C.green,
      17,
      2.45
    ),

    txt(
      '= 0.30 quantile',
      nx(2.45),
      NY + NH * 0.42,
      17, C.green
    )
  );

  await until(S(11));

  await play(
    ...replaceOverlay(percentile11),

    ...say('QUANTILE = THE PERCENTILE IDEA', C.green),

    ...fbox([
      '30th percentile',
      '= 0.30 quantile',
      ['30% of values lie below', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 12 — read the quantiles from the standard normal curve
  // ------------------------------------------------------------

  function standardQuantiles() {
    const objects = [
      normalAxes(
        true,
        'Read positions from the standard bell'
      ),

      normalCurve()
    ];

    Z.forEach((z, i) => {
      objects.push(
        quantileMarker(
          i,
          {
            percent: true,
            color: C.amber
          }
        )
      );
    });

    return new M.VGroup(...objects);
  }

  await until(S(12));

  await play(
    ...replacePicture(
      standardQuantiles()
    ),

    ...say('READ THE STANDARD NORMAL CURVE'),

    ...fbox([
      'Standard normal',
      'Mean = 0',
      'Standard deviation = 1',
      ['Read the five z-scores', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 13 — convert the 10% z-score back into grams
  // ------------------------------------------------------------

  await until(S(13));

  const firstZ13 = new M.VGroup(
    normalAxes(
      true,
      'The 10% point on the standard bell'
    ),

    normalArea(
      -Infinity,
      -1.2815515655,
      C.amber,
      0.43
    ),

    normalCurve(),

    dashed(
      nx(Z[0]), NY,
      nx(Z[0]), ny(normalPDF(Z[0])),
      C.amber
    ),

    glow(
      nx(Z[0]),
      ny(normalPDF(Z[0])),
      0.09,
      C.amber
    ),

    txt(
      'z = −1.28',
      nx(Z[0]) - 0.28,
      ny(normalPDF(Z[0])) + 0.36,
      18, C.amber, true
    ),

    bracket(
      nx(Z[0]),
      nx(0),
      NY + NH * 0.08,
      '1.28 steps',
      C.amber,
      true
    )
  );

  await play(
    ...replacePicture(firstZ13),

    ...say('10% POINT: z ≈ −1.28', C.amber),

    ...fbox([
      '10% point',
      ['z ≈ −1.28', C.amber],
      '1 step = 2 grams'
    ], C.amber)
  );

  await until(S(13) + 3.6);

  await play(
    ...say('1.28 STEPS × 2 GRAMS', C.amber),

    ...fbox([
      'Distance below mean',
      '1.28 × 2 = 2.56 g',
      ['500 − 2.56', C.amber]
    ], C.amber)
  );

  const converted13 = new M.VGroup(
    normalAxes(
      false,
      'Convert back to fill weight'
    ),

    normalArea(
      -Infinity,
      -1.2815515655,
      C.amber,
      0.38
    ),

    normalCurve(),

    dashed(
      nx(Z[0]), NY,
      nx(Z[0]), ny(normalPDF(Z[0])),
      C.amber
    ),

    glow(
      nx(Z[0]),
      ny(normalPDF(Z[0])),
      0.09,
      C.amber
    ),

    tag(
      '497.4 g',
      nx(Z[0]) - 0.39,
      ny(normalPDF(Z[0])) + 0.45,
      C.amber,
      19,
      1.65
    ),

    bracket(
      nx(Z[0]),
      nx(0),
      NY + NH * 0.08,
      '2.56 g below mean',
      C.amber,
      true
    )
  );

  await until(S(13) + 7.0);

  await play(
    ...replacePicture(converted13),

    ...say('THE FIRST MARK IS 497.4 GRAMS', C.amber),

    ...fbox([
      'weight = mean + z × SD',
      '= 500 + (−1.28 × 2)',
      '= 497.44 g',
      ['≈ 497.4 g', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Table helper
  // ------------------------------------------------------------

  function dataTable(
    columns,
    rows,
    options = {}
  ) {
    const top =
      options.top !== undefined
        ? options.top
        : P ? 0.72 : 1.00;

    const dy =
      options.dy !== undefined
        ? options.dy
        : P ? 0.66 : 0.46;

    const width =
      options.width || (
        P ? 5.95 : 5.95
      );

    const left = CX - width / 2;

    const fractions =
      options.fractions ||
      columns.map(
        () => 1 / columns.length
      );

    const widths = fractions.map(
      f => f * width
    );

    const centers = [];

    let current = left;

    widths.forEach(w => {
      centers.push(current + w / 2);
      current += w;
    });

    const bottom =
      top - rows.length * dy - 0.31;

    const objects = [
      rounded(
        CX,
        (top + 0.37 + bottom) / 2,
        width,
        top + 0.37 - bottom,
        C.muted,
        0.04
      ),

      rect(
        CX, top,
        width - 0.05,
        dy * 0.91,
        C.muted,
        0.17,
        0
      )
    ];

    columns.forEach((col, j) => {
      objects.push(
        fitText(
          col,
          centers[j],
          top,
          17, C.ink,
          widths[j] - 0.18
        )
      );
    });

    const rowGroups = [];

    rows.forEach((row, i) => {
      const yy = top - (i + 1) * dy;

      const rowObjects = [
        line(
          left + 0.10,
          yy + dy / 2,
          left + width - 0.10,
          yy + dy / 2,
          C.muted,
          1
        )
      ];

      row.forEach((value, j) => {
        const color = options.colors
          ? options.colors[j] || C.ink
          : C.ink;

        const c =
          options.highlightLast &&
          i === rows.length - 1 &&
          j === row.length - 1
            ? C.amber
            : color;

        rowObjects.push(
          fitText(
            String(value),
            centers[j],
            yy,
            P ? 19 : 18,
            c,
            widths[j] - 0.17,
            true
          )
        );
      });

      rowGroups.push(
        new M.VGroup(...rowObjects)
      );
    });

    return {
      frame: new M.VGroup(...objects),
      rows: rowGroups,
      centers,
      top,
      dy,
      width
    };
  }

  // ------------------------------------------------------------
  // 14 — compute the five theoretical positions
  // ------------------------------------------------------------

  await until(S(14));

  const theoretical14 = dataTable(
    [
      'Area below',
      'z-score',
      'Weight (g)'
    ],

    EXPECTED.map((v, i) => [
      `${Math.round(PROBS[i] * 100)}%`,

      Z[i] === 0
        ? '0.00'
        : Z[i].toFixed(2).replace('-', '−'),

      v.toFixed(1)
    ]),

    {
      fractions: [0.32, 0.31, 0.37],
      colors: [C.amber, C.violet, C.green]
    }
  );

  await play(
    ...replacePicture(
      theoretical14.frame
    ),

    ...say('THE FIVE THEORETICAL MARKS', C.green),

    ...fbox([
      'weight = 500 + z × 2',
      ['Convert all five marks', C.green]
    ], C.green)
  );

  picture.push(...theoretical14.rows);

  await play(
    new M.LaggedStart(
      theoretical14.rows.map(
        r => new M.FadeIn(r)
      ),
      {
        lagRatio: 0.52,
        runTime: 4.6
      }
    ),

    ...fbox([
      'Expected positions (g)',
      ['497.4, 499.0, 500.0', C.green],
      ['501.0, 502.6', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 15 — pair the sorted real values with the theoretical marks
  // ------------------------------------------------------------

  function pairingTable(
    observed,
    faulty = false
  ) {
    return dataTable(
      [
        'Rank',
        'Bell predicts',
        'Real bag'
      ],

      observed.map((v, i) => [
        String(i + 1),
        EXPECTED[i].toFixed(1),
        v.toFixed(0)
      ]),

      {
        fractions: [0.20, 0.41, 0.39],
        colors: [
          C.muted,
          C.green,
          faulty ? C.violet : C.cyan
        ],
        highlightLast: faulty
      }
    );
  }

  await until(S(15));

  const paired15 = pairingTable(GOOD);

  await play(
    ...replacePicture(
      paired15.frame,
      ...paired15.rows
    ),

    ...say('PAIR THE VALUES IN SORTED ORDER'),

    ...fbox([
      'Lightest ↔ first mark',
      'Next ↔ second mark',
      ['Continue in rank order', C.cyan]
    ])
  );

  const pairOutline15 = rounded(
    CX,
    paired15.top - paired15.dy,
    paired15.width - 0.12,
    paired15.dy * 0.87,
    C.amber,
    0.05
  );

  await play(
    ...replaceOverlay(pairOutline15)
  );

  for (let i = 1; i < 5; i++) {
    const yy =
      paired15.top -
      (i + 1) * paired15.dy;

    const target = rounded(
      CX, yy,
      paired15.width - 0.12,
      paired15.dy * 0.87,
      C.amber,
      0.05
    );

    await play(
      new M.Transform(
        pairOutline15,
        target,
        { runTime: 0.48 }
      )
    );
  }

  // ------------------------------------------------------------
  // Q-Q graph
  //
  // Both axes use the same numeric range and physical scale,
  // so observed = theoretical is a true 45-degree diagonal.
  // The range includes the faulty batch's 506 g observation.
  // ------------------------------------------------------------

  const QMIN = 496;
  const QMAX = 507;

  const QS = P
    ? Math.min(4.95, FW - 2.25)
    : 2.8;

  const QX = CX - QS / 2 + (P ? 0.3 : 0);
  const QY = P ? -4.20 : -1.95;

  const qx = v =>
    QX + (v - QMIN) / (QMAX - QMIN) * QS;

  const qy = v =>
    QY + (v - QMIN) / (QMAX - QMIN) * QS;

  const QQ_R = P ? 0.086 : 0.067;

  function qqAxes(
    title = 'Predicted weights versus real weights'
  ) {
    const objects = [
      line(
        qx(QMIN), QY,
        qx(QMAX), QY,
        C.muted, 3
      ),

      line(
        QX, qy(QMIN),
        QX, qy(QMAX),
        C.muted, 3
      ),

      fitText(
        title,
        CX, QY + QS + 0.48,
        P ? 21 : 20,
        C.ink
      ),

      txt(
        'Bell predicts (g) →',
        CX,
        QY - 0.98,
        17, C.green
      ),

      txt(
        '↑ Real bag (g)',
        QX + 0.57,
        QY + QS + 0.13,
        16, C.cyan
      )
    ];

    for (const v of [496, 498, 500, 502, 504, 506]) {
      objects.push(
        line(
          qx(v), QY - 0.055,
          qx(v), QY + 0.055,
          C.muted, 1.5
        ),

        line(
          QX - 0.055, qy(v),
          QX + 0.055, qy(v),
          C.muted, 1.5
        ),

        txt(
          String(v),
          qx(v), QY - 0.28,
          P ? 18 : 16,
          C.muted, true
        ),

        txt(
          String(v),
          QX - 0.38, qy(v),
          P ? 18 : 16,
          C.muted, true
        )
      );

      if (v !== 496) {
        objects.push(
          line(
            qx(v), QY,
            qx(v), qy(QMAX),
            C.muted, 0.65
          ),

          line(
            QX, qy(v),
            qx(QMAX), qy(v),
            C.muted, 0.65
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function qqDiagonal(
    color = C.green
  ) {
    return line(
      qx(QMIN), qy(QMIN),
      qx(QMAX), qy(QMAX),
      color,
      3
    );
  }

  function qqDot(
    i,
    observed = GOOD,
    color = C.cyan
  ) {
    return glow(
      qx(EXPECTED[i]),
      qy(observed[i]),
      QQ_R,
      color
    );
  }

  function coordinateGuides(
    i,
    observed = GOOD,
    color = C.amber
  ) {
    const expected = EXPECTED[i];
    const actual = observed[i];

    const xx = qx(expected);
    const yy = qy(actual);

    const objects = [
      dashed(
        xx, QY,
        xx, yy,
        C.green
      ),

      dashed(
        QX, yy,
        xx, yy,
        color
      ),

      rounded(
        xx,
        QY - 0.64,
        P ? 0.95 : 0.8,
        0.34,
        C.green,
        0.92
      ),

      txt(
        expected.toFixed(1),
        xx,
        QY - 0.64,
        P ? 18 : 16,
        C.bg,
        true
      ),

      rounded(
        QX - (P ? 1.0 : 0.98),
        yy,
        P ? 0.72 : 0.62,
        0.34,
        color,
        0.92
      ),

      txt(
        String(actual),
        QX - (P ? 1.0 : 0.98),
        yy,
        P ? 18 : 16,
        C.bg,
        true
      )
    ];

    return new M.VGroup(...objects);
  }

  function completeQQ(
    observed = GOOD,
    options = {}
  ) {
    const color =
      options.color || C.cyan;

    const objects = [
      qqAxes(
        options.title ||
        'A quantile–quantile plot'
      )
    ];

    if (options.diagonal !== false) {
      objects.push(qqDiagonal());
    }

    observed.forEach((_, i) => {
      objects.push(
        qqDot(
          i,
          observed,
          options.highlightLast && i === 4
            ? C.amber
            : color
        )
      );
    });

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // 16 — draw across = predicted, up = observed
  // ------------------------------------------------------------

  await until(S(16));

  const qqAxes16 = qqAxes();

  const across16 = arrow(
    qx(496.7),
    QY + 0.16,
    qx(500.5),
    QY + 0.16,
    C.green, 3
  );

  const up16 = arrow(
    QX + 0.12,
    qy(496.7),
    QX + 0.12,
    qy(500.5),
    C.cyan, 3
  );

  await play(
    ...replacePicture(qqAxes16),

    ...replaceOverlay(
      across16,
      up16
    ),

    ...say('ACROSS: PREDICTED     UP: OBSERVED'),

    ...fbox([
      ['Across = bell predicts', C.green],
      ['Up = real bag weight', C.cyan],
      'Each pair becomes one dot'
    ])
  );

  // ------------------------------------------------------------
  // 17–21 — plot the five pairs one by one
  // ------------------------------------------------------------

  const qqPoints = [];

  // 17 — first pair: (497.4, 497)

  await until(S(17));

  const point17 = qqDot(0);

  qqPoints.push(point17);
  picture.push(point17);

  await play(
    ...replaceOverlay(
      coordinateGuides(0)
    ),

    new M.FadeIn(point17),

    ...say('FIRST PAIR: (497.4, 497)'),

    ...fbox([
      'Pair 1',
      ['Across: 497.4 g', C.green],
      ['Up:     497 g', C.cyan]
    ])
  );

  // 18 — second pair: (499.0, 499)

  await until(S(18));

  const point18 = qqDot(1);

  qqPoints.push(point18);
  picture.push(point18);

  await play(
    ...replaceOverlay(
      coordinateGuides(1)
    ),

    new M.FadeIn(point18),

    ...say('SECOND PAIR: (499, 499)'),

    ...fbox([
      'Pair 2',
      ['Across: 499.0 g', C.green],
      ['Up:     499 g', C.cyan]
    ])
  );

  // 19 — third pair: (500.0, 500)

  await until(S(19));

  const point19 = qqDot(2);

  qqPoints.push(point19);
  picture.push(point19);

  await play(
    ...replaceOverlay(
      coordinateGuides(2)
    ),

    new M.FadeIn(point19),

    ...say('THIRD PAIR: (500, 500)'),

    ...fbox([
      'Pair 3',
      ['Across: 500.0 g', C.green],
      ['Up:     500 g', C.cyan]
    ])
  );

  // 20 — fourth pair: (501.0, 501)

  await until(S(20));

  const point20 = qqDot(3);

  qqPoints.push(point20);
  picture.push(point20);

  await play(
    ...replaceOverlay(
      coordinateGuides(3)
    ),

    new M.FadeIn(point20),

    ...say('FOURTH PAIR: (501, 501)'),

    ...fbox([
      'Pair 4',
      ['Across: 501.0 g', C.green],
      ['Up:     501 g', C.cyan]
    ])
  );

  // 21 — fifth pair: (502.6, 503)

  await until(S(21));

  const point21 = qqDot(4);

  qqPoints.push(point21);
  picture.push(point21);

  await play(
    ...replaceOverlay(
      coordinateGuides(4)
    ),

    new M.FadeIn(point21),

    ...say('FIFTH PAIR: (502.6, 503)'),

    ...fbox([
      'Pair 5',
      ['Across: 502.6 g', C.green],
      ['Up:     503 g', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 22 — draw the reference line y = x
  // ------------------------------------------------------------

  await until(S(22));

  const diagonal22 = qqDiagonal();

  picture.push(diagonal22);

  const diagonalLabel22 = new M.VGroup(
    txt(
      'Up = across',
      qx(498.7),
      qy(505.2),
      17, C.green
    ),

    arrow(
      qx(499.7),
      qy(504.7),
      qx(502.3),
      qy(502.3) + 0.06,
      C.green, 2
    )
  );

  await play(
    ...replaceOverlay(diagonalLabel22),

    new M.Create(diagonal22),

    ...say('DRAW THE LINE WHERE UP = ACROSS', C.green),

    ...fbox([
      'Reference line',
      ['Observed = theoretical', C.green],
      'Exact agreement'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 23 — all five dots are close to the line
  // ------------------------------------------------------------

  function goodResiduals() {
    const objects = [];

    GOOD.forEach((actual, i) => {
      const expected = EXPECTED[i];

      if (
        Math.abs(actual - expected) < 0.001
      ) {
        return;
      }

      objects.push(
        line(
          qx(expected),
          qy(expected),
          qx(expected),
          qy(actual),
          C.amber,
          4
        )
      );
    });

    objects.push(
      tag(
        'CLOSE TO THE LINE',
        qx(499.7),
        qy(505.0),
        C.green,
        16,
        2.55
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(23));

  await play(
    ...replaceOverlay(
      goodResiduals()
    ),

    new M.LaggedStart(
      qqPoints.map(
        d => new M.Indicate(
          d,
          { color: C.green }
        )
      ),
      {
        lagRatio: 0.20,
        runTime: 2.1
      }
    ),

    ...say('ALL FIVE DOTS ARE CLOSE', C.green),

    ...fbox([
      'Predicted ≈ observed',
      ['The normal model looks fine', C.green],
      'For these five bags'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 24 — name the quantile–quantile plot
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...replacePicture(
      completeQQ(
        GOOD,
        {
          title: 'Quantile–quantile plot'
        }
      )
    ),

    ...replaceOverlay(
      tag(
        'Q-Q PLOT',
        qx(499.4),
        qy(505.0),
        C.violet,
        20,
        2.1
      )
    ),

    ...say('QUANTILE–QUANTILE PLOT', C.violet),

    ...fbox([
      'Q-Q = quantile–quantile',
      ['Across: law quantiles', C.green],
      ['Up: data quantiles', C.cyan],
      'Compare like with like'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 25 — introduce the faulty batch
  // ------------------------------------------------------------

  await until(S(25));

  const faulty25 = sortedBags(
    BAD,
    C.violet,
    'A faulty batch: five sorted weights'
  );

  await play(
    ...replacePicture(faulty25),

    ...say('NOW LOOK AT A FAULTY BATCH', C.amber),

    ...fbox([
      'New observed weights',
      ['498, 499, 499', C.violet],
      ['500, 506', C.amber],
      'grams'
    ], C.amber)
  );

  await until(S(25) + 4.8);

  const badY25 = P ? -2.4 : -0.48;

  const heaviest25 = rounded(
    CX + 2 * 1.07,
    badY25 - 0.15,
    1.04,
    1.68,
    C.amber,
    0.05
  );

  await play(
    ...replaceOverlay(heaviest25),

    ...fbox([
      'Four ordinary-looking bags',
      ['One bag weighs 506 g', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 26 — pair the faulty observations with the same five marks
  // ------------------------------------------------------------

  await until(S(26));

  const badPairs26 = pairingTable(
    BAD,
    true
  );

  await play(
    ...replacePicture(
      badPairs26.frame,
      ...badPairs26.rows
    ),

    ...say('SAME THEORETICAL MARKS — NEW DATA'),

    ...fbox([
      'Keep the same bell',
      'Keep the same five marks',
      ['Change only real weights', C.violet]
    ], C.violet)
  );

  await until(S(26) + 1.3);

  const badAxes26 = qqAxes(
    'Faulty batch versus the same bell'
  );

  const badDiagonal26 = qqDiagonal();

  const badPoints26 = BAD.map((_, i) =>
    qqDot(
      i,
      BAD,
      i === 4 ? C.amber : C.violet
    )
  );

  // Start the final dot at its former observed position,
  // then reveal the new 506 g value during beat 27.

  const lastDot26 = qqDot(
    4,
    GOOD,
    C.muted
  );

  const firstFour26 =
    badPoints26.slice(0, 4);

  await play(
    ...clearPicture(),

    new M.FadeIn(badAxes26),

    new M.Create(badDiagonal26),

    new M.LaggedStart(
      firstFour26.map(
        d => new M.FadeIn(d)
      ),
      {
        lagRatio: 0.12,
        runTime: 0.85
      }
    ),

    new M.FadeIn(lastDot26)
  );

  picture = [
    badAxes26,
    badDiagonal26,
    ...firstFour26,
    lastDot26
  ];

  // ------------------------------------------------------------
  // 27 — the last point jumps above the reference line
  // ------------------------------------------------------------

  await until(S(27));

  const jump27 = arrow(
    qx(EXPECTED[4]) + 0.14,
    qy(GOOD[4]),
    qx(EXPECTED[4]) + 0.14,
    qy(BAD[4]),
    C.amber,
    3
  );

  const jumpLabel27 = txt(
    '506 g',
    qx(EXPECTED[4]) + 0.45,
    qy(BAD[4]) + 0.12,
    17, C.amber, true
  );

  await play(
    new M.Transform(
      lastDot26,
      badPoints26[4],
      { runTime: 1.2 }
    ),

    ...replaceOverlay(
      jump27,
      jumpLabel27
    ),

    ...say('THE LAST DOT JUMPS UP', C.amber),

    ...fbox([
      'First four: near the line',
      ['Last pair: (502.6, 506)', C.amber],
      'A large upward departure'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 28 — heaviest bag exceeds what the bell predicts
  // ------------------------------------------------------------

  await until(S(28));

  const discrepancy28 = new M.VGroup(
    dashed(
      qx(EXPECTED[4]),
      QY,
      qx(EXPECTED[4]),
      qy(BAD[4]),
      C.green
    ),

    dashed(
      QX,
      qy(BAD[4]),
      qx(EXPECTED[4]),
      qy(BAD[4]),
      C.amber
    ),

    glow(
      qx(EXPECTED[4]),
      qy(EXPECTED[4]),
      0.055,
      C.green
    ),

    arrow(
      qx(EXPECTED[4]) + 0.17,
      qy(EXPECTED[4]) + 0.02,
      qx(EXPECTED[4]) + 0.17,
      qy(BAD[4]) - 0.02,
      C.amber, 3
    ),

    txt(
      '+3.4 g',
      qx(EXPECTED[4]) - 0.55,
      (
        qy(EXPECTED[4]) +
        3 * qy(BAD[4])
      ) / 4,
      17, C.amber, true
    ),

    rounded(
      QX - (P ? 1.0 : 0.98),
      qy(506.0),
      P ? 0.72 : 0.62,
      0.34,
      C.amber,
      0.92
    ),

    txt(
      '506',
      QX - (P ? 1.0 : 0.98),
      qy(506.0),
      P ? 18 : 16,
      C.bg, true
    )
  );

  await play(
    ...replaceOverlay(
      discrepancy28
    ),

    ...say('HEAVIER THAN THE BELL EXPECTS', C.amber),

    ...fbox([
      'Bell predicts: 502.6 g',
      'Actual weight: 506 g',
      ['Difference = +3.4 g', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 29 — upward bend at the right end suggests a long right tail
  // ------------------------------------------------------------

  function qqConnected(
    observed,
    color = C.violet
  ) {
    return new M.VGroup(
      ...observed.slice(1).map((v, i) =>
        line(
          qx(EXPECTED[i]),
          qy(observed[i]),
          qx(EXPECTED[i + 1]),
          qy(v),
          color,
          2.5
        )
      )
    );
  }

  const rightBend29 = new M.VGroup(
    qqConnected(
      BAD,
      C.violet
    ),

    rounded(
      qx(EXPECTED[4]),
      (
        qy(EXPECTED[4]) +
        qy(BAD[4])
      ) / 2,
      0.45,
      qy(BAD[4]) -
        qy(EXPECTED[4]) + 0.28,
      C.amber,
      0.025
    ),

    txt(
      'Right-end bend',
      qx(499.2),
      qy(505.0),
      17, C.amber
    ),

    arrow(
      qx(500.1),
      qy(504.7),
      qx(EXPECTED[4]) - 0.06,
      qy(505.1),
      C.amber, 2
    )
  );

  await until(S(29));

  await play(
    ...replaceOverlay(rightBend29),

    ...say('UPWARD RIGHT BEND: LONG RIGHT TAIL', C.amber),

    ...fbox([
      'Right-end departure',
      'A heavier upper tail',
      ['Normal fit looks poor here', C.amber],
      'Check with more observations'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 30 — short version
  // ------------------------------------------------------------

  function methodCards() {
    const y = P ? -2.4 : -0.55;

    const xs = [
      CX - 1.85,
      CX,
      CX + 1.85
    ];

    const colors = [
      C.cyan,
      C.green,
      C.violet
    ];

    const labels = [
      'SORT',
      'PAIR',
      'PLOT'
    ];

    const subtitles = [
      'Real values',
      'Law marks',
      'Check line'
    ];

    const objects = [
      txt(
        'Three steps',
        CX, y + 1.42,
        23, C.ink
      )
    ];

    for (let i = 0; i < 3; i++) {
      objects.push(
        rounded(
          xs[i], y,
          1.58, 1.60,
          colors[i],
          0.10
        ),

        txt(
          String(i + 1),
          xs[i], y + 0.38,
          24, colors[i], true
        ),

        txt(
          labels[i],
          xs[i], y - 0.06,
          19, colors[i]
        ),

        fitText(
          subtitles[i],
          xs[i], y - 0.45,
          16, C.ink,
          1.40
        )
      );

      if (i < 2) {
        objects.push(
          arrow(
            xs[i] + 0.82,
            y,
            xs[i + 1] - 0.82,
            y,
            C.amber, 2
          )
        );
      }
    }

    objects.push(
      tag(
        'LOOK FOR A STRAIGHT LINE',
        CX, y - 1.47,
        C.green, 18
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(30));

  await play(
    ...replacePicture(methodCards()),

    ...say('THE SHORT VERSION'),

    ...fbox([
      '1. Sort',
      '2. Pair',
      ['3. Plot and inspect', C.green]
    ])
  );

  // ------------------------------------------------------------
  // 31 — sort, pair, plot and check the line
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...say('SORT → PAIR → PLOT'),

    ...fbox([
      'Sort the observed values',
      'Pair with law quantiles',
      'Plot each pair',
      ['Look for a straight line', C.green]
    ])
  );

  await until(S(31) + 3.3);

  await play(
    ...replacePicture(
      completeQQ(
        GOOD,
        {
          title: 'Near the reference line'
        }
      )
    ),

    ...say('CLOSE TO THE LINE: A GOOD SIGN', C.green),

    ...fbox([
      'Across: theoretical',
      'Up: observed',
      ['Near the line → plausible fit', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 32 — everyday interpretation: compare actual and predicted bags
  // ------------------------------------------------------------

  function bagComparison() {
    const top = P ? -0.6 : 0.42;
    const bottom = P ? -3.0 : -1.48;

    const dx = 1.07;

    const objects = [
      txt(
        'The bell predicts',
        CX, top + 0.74,
        20, C.green
      ),

      txt(
        'What the bags really weigh',
        CX, bottom - 0.83,
        19, C.cyan
      )
    ];

    for (let i = 0; i < 5; i++) {
      const x = CX + (i - 2) * dx;

      objects.push(
        rounded(
          x, top,
          0.93, 0.60,
          C.green,
          0.13
        ),

        txt(
          EXPECTED[i].toFixed(1),
          x, top,
          17, C.green, true
        ),

        rounded(
          x, bottom,
          0.93, 0.60,
          C.cyan,
          0.13
        ),

        txt(
          String(GOOD[i]),
          x, bottom,
          17, C.cyan, true
        ),

        arrow(
          x,
          top - 0.36,
          x,
          bottom + 0.36,
          C.muted,
          2
        )
      );

      const difference =
        GOOD[i] - EXPECTED[i];

      const differenceLabel =
        Math.abs(difference) < 0.001
          ? '0'
          : (
              difference > 0
                ? '+'
                : '−'
            ) + Math.abs(difference).toFixed(1);

      objects.push(
        txt(
          differenceLabel,
          x + 0.19,
          (top + bottom) / 2,
          15,
          Math.abs(difference) < 0.001
            ? C.green
            : C.amber,
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  await until(S(32));

  await play(
    ...replacePicture(bagComparison()),

    ...say('DO REAL AND PREDICTED VALUES AGREE?', C.green),

    ...fbox([
      'Match the bags by rank',
      'Compare their weights',
      ['Small differences here', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 33 — check a proposed probability model before using it
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...replacePicture(
      completeQQ(
        GOOD,
        {
          title: 'Check the model against the data'
        }
      )
    ),

    ...say('CHECK A LAW BEFORE USING IT', C.green),

    ...fbox([
      'Choose a probability law',
      'Compare with actual data',
      ['Check its fit first', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 34 — Q-Q plots work with any theoretical probability law
  // ------------------------------------------------------------

  function miniCurve(
    pdf,
    x0, y0,
    w, h,
    xmin, xmax, ymax,
    color
  ) {
    const objects = [];

    const n = 65;

    for (let i = 0; i < n; i++) {
      const a =
        xmin + (xmax - xmin) * i / n;

      const b =
        xmin + (xmax - xmin) * (i + 1) / n;

      objects.push(
        line(
          x0 + w * i / n,
          y0 + h * pdf(a) / ymax,
          x0 + w * (i + 1) / n,
          y0 + h * pdf(b) / ymax,
          color, 3
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function modelApplications() {
    const top = P ? 0.00 : -0.35;

    const w = 1.58;
    const h = P ? 1.35 : 1.18;

    const centers = [
      CX - 1.88,
      CX,
      CX + 1.88
    ];

    const configs = [
      {
        name: 'Normal',
        pdf: normalPDF,
        xmin: -3.5,
        xmax: 3.5,
        ymax: 0.45,
        color: C.cyan
      },

      {
        name: 'Exponential',
        pdf: t => Math.exp(-t),
        xmin: 0,
        xmax: 5,
        ymax: 1.10,
        color: C.green
      },

      {
        name: 'Lognormal',

        pdf: t => {
          if (t <= 0) return 0;

          const s = Math.log(2);
          const z = Math.log(t) / s;

          return normalPDF(z) / (t * s);
        },

        xmin: 0,
        xmax: 5.5,
        ymax: 0.82,
        color: C.violet
      }
    ];

    const objects = [
      txt(
        'Choose the law to test',
        CX,
        top + h + 0.35,
        21, C.ink
      )
    ];

    configs.forEach((cfg, i) => {
      const left = centers[i] - w / 2;

      objects.push(
        line(
          left, top,
          left + w, top,
          C.muted, 2
        ),

        miniCurve(
          cfg.pdf,
          left, top,
          w, h,
          cfg.xmin,
          cfg.xmax,
          cfg.ymax,
          cfg.color
        ),

        fitText(
          cfg.name,
          centers[i],
          top - 0.32,
          17,
          cfg.color,
          1.80
        ),

        arrow(
          centers[i],
          top - 0.57,
          centers[i],
          top - 1.07,
          C.muted,
          2
        )
      );
    });

    objects.push(
      fitText(
        "Use each law's own quantiles",
        CX,
        top - 1.38,
        19, C.ink
      ),

      tag(
        'PAIR WITH THE SORTED DATA',
        CX,
        top - 1.93,
        C.green,
        17
      )
    );

    return new M.VGroup(...objects);
  }

  await until(S(34));

  await play(
    ...replacePicture(modelApplications()),

    ...say('Q-Q PLOTS WORK FOR MANY LAWS'),

    ...fbox([
      'Normal',
      'Exponential',
      'Lognormal',
      ['Use the chosen law’s quantiles', C.green]
    ])
  );

  // ------------------------------------------------------------
  // 35 — diagnostic patterns
  //
  // These are schematic examples, not measured factory data.
  // Heavy tails: left end below line, right end above line.
  // Light tails: left end above line, right end below line.
  // ------------------------------------------------------------

  function miniQQ(
    centerX,
    bottomY,
    size,
    mode,
    title,
    color,
    n = 13
  ) {
    const left = centerX - size / 2;

    const x = u =>
      left + u * size;

    const y = u =>
      bottomY + u * size;

    const objects = [
      line(
        x(0), y(0),
        x(1), y(0),
        C.muted, 2
      ),

      line(
        x(0), y(0),
        x(0), y(1),
        C.muted, 2
      ),

      line(
        x(0), y(0),
        x(1), y(1),
        C.green, 2
      ),

      fitText(
        title,
        centerX,
        bottomY + size + 0.28,
        17,
        color,
        size + 0.35
      ),

      txt(
        'Theoretical →',
        centerX,
        bottomY - 0.26,
        14, C.muted
      )
    ];

    const locations = [];

    for (let i = 0; i < n; i++) {
      const u =
        0.14 + 0.72 * i / (n - 1);

      const d = u - 0.5;

      let v = u;

      if (mode === 'heavy') {
        v = u + 2.55 * d * d * d;
      }

      if (mode === 'light') {
        v = u - 2.55 * d * d * d;
      }

      if (mode === 'wiggle') {
        v = u +
          0.014 * Math.sin(2.7 * i + 0.5) +
          0.006 * Math.cos(1.2 * i);
      }

      if (mode === 'right') {
        v =
          u - 0.008 +
          0.13 * Math.pow(
            Math.max(0, (u - 0.45) / 0.41),
            2.4
          );
      }

      locations.push([u, v]);

      objects.push(
        dot(
          x(u),
          y(v),
          P ? 0.043 : 0.038,
          color
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function tailPatterns() {
    const size = P ? 2.45 : 2.08;

    const y = P ? -3.2 : -1.90;

    const left = CX - 1.52;
    const right = CX + 1.52;

    return new M.VGroup(
      txt(
        'Two systematic tail patterns',
        CX,
        y + size + 0.79,
        21, C.ink
      ),

      miniQQ(
        left,
        y,
        size,
        'heavy',
        'Heavier tails',
        C.amber
      ),

      miniQQ(
        right,
        y,
        size,
        'light',
        'Lighter tails',
        C.violet
      ),

      txt(
        'Both ends depart systematically',
        CX,
        y - 0.70,
        17, C.muted
      )
    );
  }

  await until(S(35));

  await play(
    ...replacePicture(
      completeQQ(
        BAD,
        {
          title: 'A departure at one end',
          color: C.violet,
          highlightLast: true
        }
      ),

      qqConnected(BAD, C.amber)
    ),

    ...say('A BEND AT ONE END: A MISSED TAIL', C.amber),

    ...fbox([
      'Upper end bends upward',
      ['Upper tail is too heavy', C.amber],
      'Relative to the chosen law'
    ], C.amber)
  );

  await until(S(35) + 3.5);

  await play(
    ...replacePicture(tailPatterns()),

    ...say('S-SHAPES: BOTH TAILS DIFFER', C.violet),

    ...fbox([
      ['Heavier tails:', C.amber],
      'Left below, right above',
      ['Lighter tails:', C.violet],
      'Left above, right below'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 36 — five bags naturally produce small random deviations
  // ------------------------------------------------------------

  await until(S(36));

  const smallWiggle36 = new M.VGroup(
    line(
      qx(EXPECTED[0]),
      qy(EXPECTED[0]),
      qx(EXPECTED[0]),
      qy(GOOD[0]),
      C.amber, 5
    ),

    line(
      qx(EXPECTED[4]),
      qy(EXPECTED[4]),
      qx(EXPECTED[4]),
      qy(GOOD[4]),
      C.amber, 5
    ),

    txt(
      'Small random deviations',
      qx(499.5),
      qy(505.0),
      17, C.amber
    ),

    arrow(
      qx(499.7),
      qy(504.5),
      qx(EXPECTED[4]) - 0.05,
      qy(GOOD[4]) + 0.10,
      C.amber, 2
    )
  );

  await play(
    ...replacePicture(
      completeQQ(
        GOOD,
        {
          title: 'Only five observations'
        }
      )
    ),

    ...replaceOverlay(smallWiggle36),

    ...say('TRAP: SMALL WIGGLES ARE NORMAL', C.amber),

    ...fbox([
      'Sample size = 5',
      'Random variation is expected',
      ['Not every dot must touch', C.amber],
      'the reference line'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 37 — distinguish random wobble from a systematic pattern
  // ------------------------------------------------------------

  function wobbleComparison() {
    const size = P ? 2.45 : 2.08;

    const y = P ? -3.2 : -1.90;

    const left = CX - 1.52;
    const right = CX + 1.52;

    return new M.VGroup(
      txt(
        'Wiggle or systematic bend?',
        CX,
        y + size + 0.79,
        21, C.ink
      ),

      miniQQ(
        left,
        y,
        size,
        'wiggle',
        'Small wiggles',
        C.cyan,
        21
      ),

      miniQQ(
        right,
        y,
        size,
        'right',
        'Steady bend',
        C.amber,
        21
      ),

      txt(
        'Illustrative larger samples',
        CX,
        y - 0.66,
        16, C.muted
      )
    );
  }

  await until(S(37));

  await play(
    ...replacePicture(wobbleComparison()),

    ...say('LOOK FOR A CLEAR, STEADY PATTERN', C.green),

    ...fbox([
      'Do not reject for a wiggle',
      'Look for systematic bends',
      ['Use more data when possible', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 38 — preview simulation
  //
  // Fixed seed ensures repeatable playback.
  // Generate actual normal random samples for the preview.
  // ------------------------------------------------------------

  let seed = 529;

  function uniform() {
    seed = (
      Math.imul(1664525, seed) +
      1013904223
    ) >>> 0;

    return (
      seed + 0.5
    ) / 4294967296;
  }

  function simulatedNormal() {
    const u1 = uniform();
    const u2 = uniform();

    return Math.sqrt(
      -2 * Math.log(u1)
    ) * Math.cos(
      2 * Math.PI * u2
    );
  }

  const previewSamples = Array.from(
    { length: 3 },
    () =>
      Array.from(
        { length: 15 },
        () => MU + SIGMA * simulatedNormal()
      )
  );

  function simulationRows() {
    const top = P ? 0.30 : 0.55;

    const dy = P ? 1.45 : 1.03;

    const left = CX - 2.65;
    const right = CX + 2.65;

    const allValues = previewSamples.flat();

    const low = Math.min(
      492,
      ...allValues
    );

    const high = Math.max(
      508,
      ...allValues
    );

    const map = v =>
      left +
      (v - low) /
      (high - low) *
      (right - left);

    const objects = [];

    const sampleColors = [
      C.cyan,
      C.green,
      C.violet
    ];

    for (let i = 0; i < 3; i++) {
      const yy = top - i * dy;

      const color = sampleColors[i];

      const rowObjects = [
        line(
          left, yy,
          right, yy,
          C.muted, 2
        ),

        txt(
          `Simulated sample ${i + 1}`,
          CX, yy + 0.53,
          18, color
        )
      ];

      const seen = {};

      previewSamples[i].forEach(v => {
        const bin = Math.floor(v * 2);

        const index = seen[bin] || 0;

        seen[bin] = index + 1;

        rowObjects.push(
          glow(
            map(v),
            yy + 0.13 + index * 0.12,
            0.047,
            color
          )
        );
      });

      rowObjects.push(
        txt(
          '500',
          map(500),
          yy - 0.26,
          15, C.muted, true
        )
      );

      objects.push(
        new M.VGroup(...rowObjects)
      );
    }

    return objects;
  }

  await until(S(38));

  const simRows38 = simulationRows();

  await play(
    ...clearPicture(),

    new M.LaggedStart(
      simRows38.map(
        r => new M.FadeIn(r)
      ),
      {
        lagRatio: 0.55,
        runTime: 3.2
      }
    ),

    ...say('NEXT: GENERATE DATA FROM THESE LAWS', C.violet),

    ...fbox([
      'Choose a probability model',
      'Generate random samples',
      'Repeat many times',
      ['Next chapter: simulation', C.violet]
    ], C.violet)
  );

  picture = simRows38;

  // ------------------------------------------------------------
  // 39 — final one-sentence recap
  // ------------------------------------------------------------

  await until(S(39));

  const finalAxes = qqAxes(
    'The quantile–quantile plot'
  );

  const finalDiagonal = qqDiagonal();

  const finalPoints = GOOD.map((_, i) =>
    qqDot(
      i,
      GOOD,
      C.cyan
    )
  );

  const finalGood = tag(
    'CLOSE TO THE LINE',
    qx(499.5),
    qy(505.2),
    C.green,
    16,
    2.50
  );

  await play(
    ...replacePicture(
      finalAxes,
      finalDiagonal,
      ...finalPoints,
      finalGood
    ),

    ...say('Q-Q: SORTED DATA AGAINST LAW QUANTILES', C.green),

    ...fbox([
      'Sort the actual data',
      ['Across: law quantiles', C.green],
      ['Up: observed quantiles', C.cyan],
      'Near the line → plausible fit'
    ], C.green)
  );

  await until(S(39) + 2.4);

  await play(
    new M.LaggedStart(
      finalPoints.map(
        d => new M.Indicate(
          d,
          { color: C.cyan }
        )
      ),
      {
        lagRatio: 0.16,
        runTime: 1.35
      }
    ),

    ...say('PAIR EACH SORTED VALUE WITH ITS MARK')
  );

  await until(S(39) + 4.7);

  await play(
    new M.Indicate(
      finalDiagonal,
      { color: C.green }
    ),

    new M.Indicate(
      finalGood,
      { color: C.green }
    ),

    ...say('NEAR A STRAIGHT LINE: THE LAW LOOKS RIGHT', C.green),

    ...fbox([
      'Q-Q plot',
      'Compare data with a law',
      ['Near line → good sign', C.green],
      ['Steady bend → investigate', C.amber]
    ], C.green)
  );
}
