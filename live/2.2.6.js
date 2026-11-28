// lesson 2.2.6
// Covariance: multiplying paired gaps from the mean.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the exact shared chapter data for the six dry afternoon hours.
// The falling and curved patterns are explicitly labelled illustrations.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data.
  const DATA = [
    [10, 20],
    [14, 30],
    [18, 35],
    [22, 45],
    [26, 50],
    [30, 60]
  ];

  const MEAN_X = 20;
  const MEAN_Y = 40;

  const DX = DATA.map(([x, y]) => x - MEAN_X);
  const DY = DATA.map(([x, y]) => y - MEAN_Y);

  const PRODUCTS = DATA.map(
    (_, k) => DX[k] * DY[k]
  );

  const SUM = PRODUCTS.reduce(
    (a, b) => a + b,
    0
  );

  const COUNT = DATA.length;
  const DIVISOR = COUNT - 1;
  const COVARIANCE = SUM / DIVISOR;

  // Temperature deviations:
  // -10, -6, -2, +2, +6, +10
  //
  // Rental deviations:
  // -20, -10, -5, +5, +10, +20
  //
  // Products:
  // 200, 60, 10, 10, 60, 200
  //
  // Sum = 540
  // Sample covariance = 540 / 5 = 108

  const XC = C.amber;
  const YC = C.cyan;
  const POS = C.green;
  const NEG = C.violet;
  const ZERO = C.muted;

  // Laptop and phone layouts.
  const CX = P ? 0 : -2.20;

  const PILL = P
    ? [0, 2.35, 0]
    : [CX, 1.92, 0];

  const BOXP = P
    ? [0, 3.46, 0]
    : [4.45, -0.15, 0];

  const XL = P ? -3.00 : -5.80;
  const XR = P ? 3.30 : 1.65;

  const YB = P ? -4.05 : -2.05;
  const YT = P ? 1.25 : 1.13;

  const XMAX = 40;
  const YMAX = 80;

  const X = n =>
    XL + n / XMAX * (XR - XL);

  const Y = n =>
    YB + n / YMAX * (YT - YB);

  const xy = (x, y) => [
    X(x),
    Y(y),
    0
  ];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  function signed(n) {
    if (n > 0) return `+${n}`;
    if (n < 0) return `−${Math.abs(n)}`;
    return '0';
  }

  function textAt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: 2
    });
  }

  function outline(p, w, h, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);
    return r;
  }

  function fadeAll(objects) {
    return objects.map(
      o => new M.FadeOut(o)
    );
  }

  function revealAll(objects) {
    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function indicateAll(
    objects,
    color,
    duration = 1.35
  ) {
    return new M.LaggedStart(
      objects.map(o =>
        new M.Indicate(o, { color })
      ),
      {
        lagRatio: 0.12,
        runTime: duration
      }
    );
  }

  // Information and formula box.
  // Follows the approved reference lesson's structure.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20;
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
    const ht = rows.length * lh + 0.35;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.175 - lh / 2;

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

    const maxw = P ? FW - 1.20 : 3.85;
    const maxh = P ? 1.42 : 2.60;

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

  // ------------------------------------------------------------
  // Scatterplot construction.
  // ------------------------------------------------------------

  const XTICKS = [0, 10, 20, 30, 40];
  const YTICKS = [20, 40, 60, 80];

  const gridLines = [];

  for (let x = 5; x <= XMAX; x += 5) {
    gridLines.push(line(
      xy(x, 0),
      xy(x, YMAX),
      C.card,
      x % 10 === 0 ? 1.5 : 1
    ));
  }

  for (let y = 10; y <= YMAX; y += 10) {
    gridLines.push(line(
      xy(0, y),
      xy(XMAX, y),
      C.card,
      y % 20 === 0 ? 1.5 : 1
    ));
  }

  const grid = new M.VGroup(...gridLines);

  const xAxis = line(
    xy(0, 0),
    xy(XMAX, 0),
    C.muted,
    3
  );

  const yAxis = line(
    xy(0, 0),
    xy(0, YMAX),
    C.muted,
    3
  );

  const xTicks = XTICKS.map(n => {
    const mark = line(
      [X(n), YB - 0.075, 0],
      [X(n), YB + 0.075, 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(n),
      P ? 17 : 17,
      C.muted,
      [X(n), YB - 0.28, 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const xTitle = textAt(
    'Temperature (°C)',
    P ? 20 : 19,
    XC,
    [
      (XL + XR) / 2,
      YB - 0.70,
      0
    ]
  );

  const xRuler = new M.VGroup(
    ...xTicks,
    xTitle
  );

  // The same physical positions can later be labelled in wheels.
  function makeYRuler(multiplier = 1) {
    const ticks = YTICKS.map(n => {
      const mark = line(
        [XL - 0.075, Y(n), 0],
        [XL + 0.075, Y(n), 0],
        C.muted,
        2
      );

      const lab = textAt(
        String(n * multiplier),
        P ? 17 : 17,
        C.muted,
        [XL - 0.36, Y(n), 0],
        true
      );

      return new M.VGroup(mark, lab);
    });

    const title = textAt(
      multiplier === 1
        ? 'Bikes rented'
        : 'Wheels rented',
      P ? 19 : 19,
      YC,
      [
        XL + 1.0,
        YT + 0.31,
        0
      ]
    );

    return new M.VGroup(
      ...ticks,
      title
    );
  }

  const yRuler = makeYRuler();

  function glowingDot(x, y, color = YC) {
    const p = xy(x, y);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.23 : 0.21,
      color
    });

    halo.setFill(color, 0.14);

    const middle = new M.Dot({
      point: p,
      radius: P ? 0.15 : 0.14,
      color
    });

    middle.setFill(color, 0.35);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.09 : 0.085,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(
      halo,
      middle,
      core
    );
  }

  const dots = DATA.map(
    ([x, y]) => glowingDot(x, y)
  );

  function ringAt(x, y, color = XC, radius = 0.24) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.moveTo(xy(x, y));

    return r;
  }

  function dotRing(k, color = XC) {
    return ringAt(
      DATA[k][0],
      DATA[k][1],
      color
    );
  }

  const plotBase = [
    grid,
    xAxis,
    yAxis,
    xRuler,
    yRuler
  ];

  // Mean lines.
  const meanXLine = dashed(
    xy(MEAN_X, 0),
    xy(MEAN_X, YMAX),
    XC
  );

  const meanYLine = dashed(
    xy(0, MEAN_Y),
    xy(XMAX, MEAN_Y),
    YC
  );

  const meanXTag = pill(
    'MEAN: 20 °C',
    XC,
    P ? 15 : 15
  );

  meanXTag.moveTo([
    X(MEAN_X) + 0.48,
    YT + 0.32,
    0
  ]);

  function makeMeanYTag(multiplier = 1) {
    const tag = pill(
      multiplier === 1
        ? 'MEAN: 40'
        : 'MEAN: 80',
      YC,
      P ? 15 : 15
    );

    tag.moveTo([
      XR - 0.64,
      Y(MEAN_Y) - 0.29,
      0
    ]);

    return tag;
  }

  const meanYTag = makeMeanYTag();

  const meanCenter = new M.Dot({
    point: xy(MEAN_X, MEAN_Y),
    radius: 0.075,
    color: C.ink
  });

  meanCenter.setFill(C.ink, 1);

  const meanObjects = [
    meanXLine,
    meanYLine,
    meanXTag,
    meanYTag,
    meanCenter
  ];

  const fullPlot = [
    ...plotBase,
    ...meanObjects,
    ...dots
  ];

  // ------------------------------------------------------------
  // 0-3: recall the six dry afternoon hours.
  // ------------------------------------------------------------

  await until(S(0));
  await play(
    ...revealAll(plotBase),

    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.13,
        runTime: 1.65
      }
    ),

    ...say('SIX DRY AFTERNOON HOURS'),

    ...fbox([
      ['bike station', C.muted],
      ['6 recorded hours', YC],
      ['all dry afternoons', C.ink]
    ])
  );

  await until(S(1));
  await play(
    new M.Indicate(dots[0], {
      color: XC
    }),

    new M.Indicate(dots[5], {
      color: XC
    }),

    ...say('WARMER HOURS: MORE OR FEWER RENTALS?', XC),

    ...fbox([
      ['temperature rises', XC],
      ['what happens to rentals?', YC]
    ], XC)
  );

  await until(S(2));
  await play(
    new M.Indicate(xRuler, {
      color: XC
    }),

    new M.Indicate(yRuler, {
      color: YC
    }),

    ...say('ONE DOT = ONE HOUR'),

    ...fbox([
      ['across: temperature', XC],
      ['up: bikes rented', YC],
      ['one pair per dot', C.ink]
    ])
  );

  await until(S(3));
  await play(
    indicateAll(dots, POS, 1.65),

    ...say('BOTTOM LEFT → TOP RIGHT', POS),

    ...fbox([
      ['cooler + quieter', C.muted],
      ['warmer + busier', POS],
      ['a rising pattern', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 4-7: mark the means and divide the plot into four parts.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    new M.Create(meanXLine),
    new M.FadeIn(meanXTag),

    ...say('MEAN TEMPERATURE = 20 °C', XC),

    ...fbox([
      ['temperature values', XC],
      ['total ÷ 6 hours', C.ink],
      ['mean = 20 °C', XC]
    ], XC)
  );

  await until(S(5));
  await play(
    new M.Create(meanYLine),
    new M.FadeIn(meanYTag),
    new M.FadeIn(meanCenter),

    ...say('MEAN RENTALS = 40 BIKES'),

    ...fbox([
      ['rental counts', YC],
      ['total ÷ 6 hours', C.ink],
      ['mean = 40 bikes', YC]
    ])
  );

  await until(S(6));
  await play(
    new M.Indicate(meanXTag, {
      color: XC
    }),

    new M.Indicate(meanYTag, {
      color: YC
    }),

    ...say('MEAN = THE FAIR SHARE', POS),

    ...fbox([
      ['share each total equally', C.ink],
      ['20 °C per hour', XC],
      ['40 bikes per hour', YC]
    ], POS)
  );

  function quadrant(
    left,
    right,
    bottom,
    top,
    color,
    opacity = 0.08
  ) {
    const r = new M.Rectangle({
      width: X(right) - X(left) - 0.04,
      height: Y(top) - Y(bottom) - 0.04,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);

    r.moveTo([
      (X(left) + X(right)) / 2,
      (Y(bottom) + Y(top)) / 2,
      0
    ]);

    return r;
  }

  const quadrantBoxes = [
    quadrant(0, 20, 40, 80, NEG, 0.025),
    quadrant(20, 40, 40, 80, POS, 0.025),
    quadrant(0, 20, 0, 40, POS, 0.025),
    quadrant(20, 40, 0, 40, NEG, 0.025)
  ];

  await until(S(7));
  await play(
    ...revealAll(quadrantBoxes),

    ...say('THE MEAN LINES MAKE FOUR PARTS'),

    ...fbox([
      ['above or below the mean', YC],
      ['left or right of the mean', XC],
      ['four parts', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // 8-10: the observed dots lie in two matching corners.
  // ------------------------------------------------------------

  const topRightBox = outline(
    [
      (X(20) + X(40)) / 2,
      (Y(40) + Y(80)) / 2,
      0
    ],
    X(40) - X(20) - 0.06,
    Y(80) - Y(40) - 0.06,
    POS
  );

  await until(S(8));
  await play(
    ...fadeAll(quadrantBoxes),

    new M.Create(topRightBox),

    indicateAll(
      dots.slice(3),
      POS,
      1.20
    ),

    ...say('WARMER AND BUSIER THAN THE MEAN', POS),

    ...fbox([
      ['temperature > 20 °C', XC],
      ['rentals > 40 bikes', YC],
      ['both above their means', POS]
    ], POS)
  );

  const bottomLeftBox = outline(
    [
      (X(0) + X(20)) / 2,
      (Y(0) + Y(40)) / 2,
      0
    ],
    X(20) - X(0) - 0.06,
    Y(40) - Y(0) - 0.06,
    POS
  );

  await until(S(9));
  await play(
    new M.FadeOut(topRightBox),

    new M.Create(bottomLeftBox),

    indicateAll(
      dots.slice(0, 3),
      POS,
      1.20
    ),

    ...say('COOLER AND QUIETER THAN THE MEAN', POS),

    ...fbox([
      ['temperature < 20 °C', XC],
      ['rentals < 40 bikes', YC],
      ['both below their means', POS]
    ], POS)
  );

  await until(S(10));
  await play(
    new M.FadeOut(bottomLeftBox),

    ...say('CAN ONE NUMBER DESCRIBE THIS PATTERN?', XC),

    ...fbox([
      ['two gaps per dot', C.ink],
      ['do their directions agree?', XC],
      ['combine the gaps', POS]
    ], XC)
  );

  // ------------------------------------------------------------
  // Gap helpers.
  // Horizontal gap starts at the mean intersection.
  // Vertical gap continues to the selected observation.
  // ------------------------------------------------------------

  function horizontalGap(k, color = XC) {
    return line(
      xy(MEAN_X, MEAN_Y),
      xy(DATA[k][0], MEAN_Y),
      color,
      5
    );
  }

  function verticalGap(k, color = YC) {
    return line(
      xy(DATA[k][0], MEAN_Y),
      xy(DATA[k][0], DATA[k][1]),
      color,
      5
    );
  }

  function horizontalGapLabel(
    k,
    label = `${signed(DX[k])} °C`
  ) {
    return textAt(
      label,
      P ? 18 : 17,
      XC,
      [
        (X(MEAN_X) + X(DATA[k][0])) / 2,
        Y(MEAN_Y) - 0.30,
        0
      ],
      true
    );
  }

  function verticalGapLabel(
    k,
    label = `${signed(DY[k])}`
  ) {
    const right = DATA[k][0] >= MEAN_X;

    return textAt(
      label,
      P ? 18 : 17,
      YC,
      [
        X(DATA[k][0]) + (right ? 0.38 : -0.38),
        (Y(MEAN_Y) + Y(DATA[k][1])) / 2,
        0
      ],
      true
    );
  }

  function gapBox(k) {
    const [x, y] = DATA[k];

    return fbox([
      [`${x} °C, ${y} bikes`, C.muted],
      [`temperature: ${signed(DX[k])}`, XC],
      [`rentals:     ${signed(DY[k])}`, YC],
      [
        `(${signed(DX[k])}) × (${signed(DY[k])}) = ${signed(PRODUCTS[k])}`,
        POS
      ]
    ], POS);
  }

  let activeGap = [];

  function clearGap() {
    const a = fadeAll(activeGap);
    activeGap = [];
    return a;
  }

  function makeGap(k, withLabels = false) {
    const h = horizontalGap(k);
    const v = verticalGap(k);
    const r = dotRing(k, XC);

    activeGap = [h, v, r];

    const a = [
      new M.Create(h),
      new M.Create(v),
      new M.Create(r)
    ];

    if (withLabels) {
      const hl = horizontalGapLabel(k);
      const vl = verticalGapLabel(k);

      activeGap.push(hl, vl);

      a.push(
        new M.FadeIn(hl),
        new M.FadeIn(vl)
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // 11-14: measure the warmest hour's two deviations.
  // ------------------------------------------------------------

  const WARM = 5;
  const COLD = 0;

  const warmRing = dotRing(WARM, XC);
  const warmHorizontal = horizontalGap(WARM);
  const warmVertical = verticalGap(WARM);

  const warmXLabel = horizontalGapLabel(
    WARM,
    '10 °C'
  );

  const warmYLabel = verticalGapLabel(
    WARM,
    '20'
  );

  const warmRecord = pill(
    '30 °C · 60 BIKES',
    YC,
    P ? 15 : 15
  );

  warmRecord.moveTo([
    X(30) - 0.27,
    Y(60) + 0.48,
    0
  ]);

  await until(S(11));
  await play(
    new M.Create(warmRing),
    new M.FadeIn(warmRecord),

    ...say('START WITH THE WARMEST HOUR', XC),

    ...fbox([
      ['temperature = 30 °C', XC],
      ['rentals = 60 bikes', YC]
    ], XC)
  );

  await until(S(12));
  await play(
    new M.Create(warmHorizontal),
    new M.FadeIn(warmXLabel),

    ...say('10 °C ABOVE THE MEAN', XC),

    ...fbox([
      ['temperature gap', XC],
      ['30 − 20 = 10 °C', XC]
    ], XC)
  );

  await until(S(13));
  await play(
    new M.Create(warmVertical),
    new M.FadeIn(warmYLabel),

    ...say('20 BIKES ABOVE THE MEAN'),

    ...fbox([
      ['temperature: 30 − 20 = 10', XC],
      ['rentals: 60 − 40 = 20', YC]
    ])
  );

  await until(S(14));
  await play(
    new M.Indicate(warmHorizontal, {
      color: XC
    }),

    new M.Indicate(warmVertical, {
      color: YC
    }),

    ...say('A GAP FROM THE MEAN IS A DEVIATION', POS),

    ...fbox([
      ['DEVIATION', POS],
      ['value − mean', C.ink],
      ['how far, and which way?', C.muted]
    ], POS)
  );

  // ------------------------------------------------------------
  // 15-16: deviations have signs.
  // ------------------------------------------------------------

  const signedWarmX = horizontalGapLabel(WARM);
  const signedWarmY = verticalGapLabel(WARM);

  await until(S(15));
  await play(
    new M.FadeOut(warmXLabel),
    new M.FadeOut(warmYLabel),

    new M.FadeIn(signedWarmX),
    new M.FadeIn(signedWarmY),

    ...say('ABOVE THE MEAN: PLUS SIGN', POS),

    ...fbox([
      ['above the mean = +', POS],
      ['temperature: +10 °C', XC],
      ['rentals: +20 bikes', YC]
    ], POS)
  );

  const negativePreviewX = horizontalGap(
    COLD,
    NEG
  );

  const negativePreviewY = verticalGap(
    COLD,
    NEG
  );

  const negativeSignX = textAt(
    '−',
    26,
    NEG,
    [
      (X(10) + X(20)) / 2,
      Y(40) - 0.29,
      0
    ]
  );

  const negativeSignY = textAt(
    '−',
    26,
    NEG,
    [
      X(10) - 0.31,
      (Y(20) + Y(40)) / 2,
      0
    ]
  );

  await until(S(16));
  await play(
    new M.Create(negativePreviewX),
    new M.Create(negativePreviewY),

    new M.FadeIn(negativeSignX),
    new M.FadeIn(negativeSignY),

    ...say('BELOW THE MEAN: MINUS SIGN', NEG),

    ...fbox([
      ['above the mean = +', POS],
      ['below the mean = −', NEG],
      ['sign shows direction', C.ink]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 17-18: multiply the warmest hour's deviations.
  // The rectangle visualizes the product of the two gap sizes.
  // ------------------------------------------------------------

  function gapRectangle(k, color = POS) {
    const [x, y] = DATA[k];

    const w = Math.abs(
      X(x) - X(MEAN_X)
    );

    const h = Math.abs(
      Y(y) - Y(MEAN_Y)
    );

    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.07);

    r.moveTo([
      (X(x) + X(MEAN_X)) / 2,
      (Y(y) + Y(MEAN_Y)) / 2,
      0
    ]);

    return r;
  }

  const warmProductBox = gapRectangle(
    WARM,
    POS
  );

  await until(S(17));
  await play(
    ...fadeAll([
      negativePreviewX,
      negativePreviewY,
      negativeSignX,
      negativeSignY
    ]),

    new M.Create(warmProductBox),

    ...say('MULTIPLY THE TWO GAPS', XC),

    ...fbox([
      ['temperature gap × rental gap', C.ink],
      ['(+10) × (+20)', XC]
    ], XC)
  );

  const warmProductTag = pill(
    '+200',
    POS,
    20
  );

  warmProductTag.moveTo([
    (X(20) + X(30)) / 2,
    (Y(40) + Y(60)) / 2,
    0
  ]);

  await until(S(18));
  await play(
    new M.FadeIn(warmProductTag),

    ...say('PLUS × PLUS = PLUS', POS),

    ...fbox([
      ['(+10) × (+20)', C.ink],
      ['= +200', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 19-20: repeat for the coolest hour.
  // ------------------------------------------------------------

  const coldHorizontal = horizontalGap(COLD);
  const coldVertical = verticalGap(COLD);

  const coldRing = dotRing(COLD, XC);

  const coldXLabel = horizontalGapLabel(COLD);
  const coldYLabel = verticalGapLabel(COLD);

  const coldProductBox = gapRectangle(
    COLD,
    POS
  );

  const coldProductTag = pill(
    '+200',
    POS,
    20
  );

  coldProductTag.moveTo([
    (X(10) + X(20)) / 2,
    (Y(20) + Y(40)) / 2,
    0
  ]);

  await until(S(19));
  await play(
    ...fadeAll([
      warmRing,
      warmRecord,
      warmHorizontal,
      warmVertical,
      signedWarmX,
      signedWarmY,
      warmProductBox,
      warmProductTag
    ]),

    new M.Create(coldRing),
    new M.Create(coldHorizontal),
    new M.Create(coldVertical),

    new M.FadeIn(coldXLabel),
    new M.FadeIn(coldYLabel),

    ...say('THE COOLEST HOUR: TWO NEGATIVE GAPS', NEG),

    ...fbox([
      ['10 − 20 = −10 °C', XC],
      ['20 − 40 = −20 bikes', YC]
    ], NEG)
  );

  await until(S(20));
  await play(
    new M.Create(coldProductBox),
    new M.FadeIn(coldProductTag),

    ...say('MINUS × MINUS = PLUS', POS),

    ...fbox([
      ['(−10) × (−20)', C.ink],
      ['= +200', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 21-23: the sign depends on the dot's position.
  // ------------------------------------------------------------

  function cornerTag(
    x,
    y,
    s,
    color
  ) {
    const tag = pill(
      s,
      color,
      P ? 15 : 15
    );

    tag.moveTo(xy(x, y));

    return tag;
  }

  const positiveTR = cornerTag(
    34,
    72,
    '+ × + = +',
    POS
  );

  const positiveBL = cornerTag(
    7,
    8,
    '− × − = +',
    POS
  );

  await until(S(21));
  await play(
    ...fadeAll([
      coldRing,
      coldHorizontal,
      coldVertical,
      coldXLabel,
      coldYLabel,
      coldProductBox,
      coldProductTag
    ]),

    new M.FadeIn(positiveTR),
    new M.FadeIn(positiveBL),

    ...say('MATCHING SIGNS GIVE A PLUS RESULT', POS),

    ...fbox([
      ['top right: + × + = +', POS],
      ['bottom left: − × − = +', POS],
      ['both gaps agree', C.ink]
    ], POS)
  );

  const negativeTL = cornerTag(
    7,
    72,
    '− × + = −',
    NEG
  );

  const negativeBR = cornerTag(
    34,
    8,
    '+ × − = −',
    NEG
  );

  // Hollow marker: a hypothetical hour, not recorded data.
  const mixedExample = ringAt(
    10,
    60,
    NEG,
    0.15
  );

  const mixedLabel = textAt(
    'if',
    16,
    NEG,
    [
      X(10),
      Y(60) + 0.32,
      0
    ],
    true
  );

  const mixedH = line(
    xy(20, 40),
    xy(10, 40),
    NEG,
    3
  );

  const mixedV = line(
    xy(10, 40),
    xy(10, 60),
    NEG,
    3
  );

  await until(S(22));
  await play(
    new M.FadeIn(negativeTL),
    new M.FadeIn(negativeBR),

    new M.Create(mixedExample),
    new M.Create(mixedH),
    new M.Create(mixedV),
    new M.FadeIn(mixedLabel),

    ...say('OPPOSITE SIGNS GIVE A MINUS RESULT', NEG),

    ...fbox([
      ['hypothetical hour', C.muted],
      ['one above, one below', NEG],
      ['(−10) × (+20) = −200', NEG]
    ], NEG)
  );

  // Hypothetical points on a mean line.
  const zeroExampleX = ringAt(
    MEAN_X,
    60,
    C.ink,
    0.15
  );

  const zeroExampleY = ringAt(
    30,
    MEAN_Y,
    C.ink,
    0.15
  );

  const zeroTagX = pill(
    '0 × 20 = 0',
    ZERO,
    15
  );

  zeroTagX.moveTo([
    X(MEAN_X),
    Y(60) + 0.36,
    0
  ]);

  const zeroTagY = pill(
    '10 × 0 = 0',
    ZERO,
    15
  );

  zeroTagY.moveTo([
    X(30),
    Y(MEAN_Y) - 0.32,
    0
  ]);

  await until(S(23));
  await play(
    ...fadeAll([
      mixedExample,
      mixedLabel,
      mixedH,
      mixedV
    ]),

    new M.Create(zeroExampleX),
    new M.Create(zeroExampleY),

    new M.FadeIn(zeroTagX),
    new M.FadeIn(zeroTagY),

    ...say('ON A MEAN LINE: ZERO RESULT', ZERO),

    ...fbox([
      ['hypothetical dots', C.muted],
      ['one gap = 0', ZERO],
      ['anything × 0 = 0', C.ink]
    ], ZERO)
  );

  // ------------------------------------------------------------
  // 24-27: calculate the other four observed products.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...fadeAll([
      positiveTR,
      positiveBL,
      negativeTL,
      negativeBR,
      zeroExampleX,
      zeroExampleY,
      zeroTagX,
      zeroTagY
    ]),

    ...makeGap(1, true),

    ...say('14 °C AND 30 RENTALS', XC),

    ...gapBox(1)
  );

  await until(S(25));
  await play(
    ...clearGap(),

    ...makeGap(2, false),

    ...say('18 °C AND 35 RENTALS', XC),

    ...gapBox(2)
  );

  await until(S(26));
  await play(
    ...clearGap(),

    ...makeGap(3, false),

    ...say('22 °C AND 45 RENTALS', XC),

    ...gapBox(3)
  );

  await until(S(27));
  await play(
    ...clearGap(),

    ...makeGap(4, true),

    ...say('26 °C AND 50 RENTALS', XC),

    ...gapBox(4)
  );

  // ------------------------------------------------------------
  // 28-32: move from the scatterplot to the six products.
  // Pair equal products to make the arithmetic visible.
  // ------------------------------------------------------------

  // The matching products are:
  // 200 + 200
  //  60 +  60
  //  10 +  10

  const PAIRS = [
    [0, 5],
    [1, 4],
    [2, 3]
  ];

  const CARD_W = P ? 1.72 : 1.78;
  const CARD_H = P ? 1.00 : 0.90;

  const ROW_Y = r =>
    P
      ? 0.80 - r * 1.70
      : 0.68 - r * 1.25;

  const CARD_X = c =>
    CX + (c === 0 ? -2.15 : -0.10);

  const TOTAL_X = CX + 2.15;

  function productCard(k, row, col) {
    const x = CARD_X(col);
    const y = ROW_Y(row);

    const r = new M.RoundedRectangle({
      width: CARD_W,
      height: CARD_H,
      cornerRadius: 0.13,
      color: POS,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);

    const top = textAt(
      `${DATA[k][0]} °C · ${DATA[k][1]}`,
      P ? 16 : 15,
      C.muted,
      [x, y + 0.24, 0],
      true
    );

    const product = textAt(
      signed(PRODUCTS[k]),
      P ? 26 : 25,
      POS,
      [x, y - 0.15, 0],
      true
    );

    return new M.VGroup(
      r,
      top,
      product
    );
  }

  const productCards = PAIRS.map(
    ([a, b], row) => [
      productCard(a, row, 0),
      productCard(b, row, 1)
    ]
  );

  const allProductCards = productCards.flat();

  const plusSigns = PAIRS.map((_, row) =>
    textAt(
      '+',
      22,
      XC,
      [
        (CARD_X(0) + CARD_X(1)) / 2,
        ROW_Y(row),
        0
      ]
    )
  );

  const equalsSigns = PAIRS.map((_, row) =>
    textAt(
      '=',
      22,
      C.muted,
      [
        CARD_X(1) + 1.11,
        ROW_Y(row),
        0
      ]
    )
  );

  const subtotals = PAIRS.map(
    ([a, b]) => PRODUCTS[a] + PRODUCTS[b]
  );

  function subtotalCard(value, row) {
    const x = TOTAL_X;
    const y = ROW_Y(row);

    const r = new M.RoundedRectangle({
      width: P ? 1.44 : 1.52,
      height: CARD_H,
      cornerRadius: 0.13,
      color: XC,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);

    const t = textAt(
      String(value),
      P ? 25 : 25,
      XC,
      [x, y, 0],
      true
    );

    return new M.VGroup(r, t);
  }

  const subtotalCards = subtotals.map(
    (n, row) => subtotalCard(n, row)
  );

  const arithmeticLabel = textAt(
    'Pair products',
    P ? 19 : 18,
    C.muted,
    [
      CX - 1.10,
      ROW_Y(0) + 0.73,
      0
    ]
  );

  const subtotalLabel = textAt(
    'Subtotals',
    P ? 17 : 17,
    XC,
    [
      TOTAL_X,
      ROW_Y(0) + 0.73,
      0
    ]
  );

  await until(S(28));
  await play(
    ...clearGap(),

    ...fadeAll(fullPlot),

    new M.FadeIn(arithmeticLabel),
    new M.FadeIn(subtotalLabel),

    new M.LaggedStart(
      allProductCards.map(
        c => new M.FadeIn(c)
      ),
      {
        lagRatio: 0.09,
        runTime: 0.95
      }
    ),

    ...revealAll(plusSigns),

    ...say('ADD THE SIX RESULTS', XC),

    ...fbox([
      ['200, 60, 10', POS],
      ['10, 60, 200', POS],
      ['add all six products', XC]
    ], XC)
  );

  await until(S(29));
  await play(
    new M.Indicate(productCards[0][0], {
      color: XC
    }),

    new M.Indicate(productCards[0][1], {
      color: XC
    }),

    new M.FadeIn(equalsSigns[0]),
    new M.FadeIn(subtotalCards[0]),

    ...say('200 + 200 = 400', XC),

    ...fbox([
      ['200 + 200', POS],
      ['= 400', XC]
    ], XC)
  );

  await until(S(30));
  await play(
    new M.Indicate(productCards[1][0], {
      color: XC
    }),

    new M.Indicate(productCards[1][1], {
      color: XC
    }),

    new M.FadeIn(equalsSigns[1]),
    new M.FadeIn(subtotalCards[1]),

    ...say('60 + 60 = 120', XC),

    ...fbox([
      ['60 + 60', POS],
      ['= 120', XC]
    ], XC)
  );

  await until(S(31));
  await play(
    new M.Indicate(productCards[2][0], {
      color: XC
    }),

    new M.Indicate(productCards[2][1], {
      color: XC
    }),

    new M.FadeIn(equalsSigns[2]),
    new M.FadeIn(subtotalCards[2]),

    ...say('10 + 10 = 20', XC),

    ...fbox([
      ['10 + 10', POS],
      ['= 20', XC]
    ], XC)
  );

  const totalTag = pill(
    'SUM = 540',
    XC,
    P ? 23 : 22
  );

  totalTag.moveTo([
    CX,
    P ? -4.35 : -2.58,
    0
  ]);

  await until(S(32));
  await play(
    new M.FadeIn(totalTag),

    ...say('THE SIX PRODUCTS SUM TO 540', XC),

    ...fbox([
      ['400 + 120 + 20', C.ink],
      ['= 540', XC]
    ], XC)
  );

  // ------------------------------------------------------------
  // 33-37: divide by the sample size minus one.
  // ------------------------------------------------------------

  const sampleFrame = outline(
    [
      (CARD_X(0) + CARD_X(1)) / 2,
      (ROW_Y(0) + ROW_Y(2)) / 2,
      0
    ],
    CARD_X(1) - CARD_X(0) + CARD_W + 0.22,
    ROW_Y(0) - ROW_Y(2) + CARD_H + 0.22,
    YC
  );

  await until(S(33));
  await play(
    new M.Create(sampleFrame),

    indicateAll(
      allProductCards,
      YC,
      1.50
    ),

    ...say('A SAMPLE: SIX OF MANY POSSIBLE HOURS'),

    ...fbox([
      ['sample = a small set', YC],
      ['6 observed hours', C.ink],
      ['more hours are possible', C.muted]
    ])
  );

  await until(S(34));
  await play(
    new M.Indicate(sampleFrame, {
      color: POS
    }),

    ...say('NUMBER OF HOURS MINUS ONE', POS),

    ...fbox([
      ['number of hours = 6', YC],
      ['one less = 6 − 1', C.ink],
      ['divisor = 5', POS]
    ], POS)
  );

  const covarianceTag = pill(
    '540 ÷ 5 = 108',
    POS,
    P ? 23 : 22
  );

  covarianceTag.moveTo([
    CX,
    P ? -4.35 : -2.58,
    0
  ]);

  await until(S(35));
  await play(
    new M.FadeOut(sampleFrame),
    new M.FadeOut(totalTag),

    new M.FadeIn(covarianceTag),

    ...say('540 DIVIDED BY 5 = 108', POS),

    ...fbox([
      ['sum = 540', XC],
      ['divisor = 5', C.ink],
      ['540 ÷ 5 = 108', POS]
    ], POS)
  );

  await until(S(36));
  await play(
    new M.Indicate(covarianceTag, {
      color: POS
    }),

    ...say('SAMPLE COVARIANCE = 108', POS),

    ...fbox([
      ['SAMPLE COVARIANCE', POS],
      ['540 ÷ (6 − 1)', C.ink],
      ['= +108', POS]
    ], POS)
  );

  await until(S(37));
  await play(
    indicateAll(
      allProductCards,
      POS,
      1.40
    ),

    ...say('HOW TWO NUMBERS VARY TOGETHER', POS),

    ...fbox([
      ['one product per pair', C.ink],
      ['combine the products', XC],
      ['measure joint variation', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 38-40: the formula in words.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...say('THE RULE IN TWO STEPS'),

    ...fbox([
      ['STEP 1: multiply and add', XC],
      ['STEP 2: divide', POS]
    ])
  );

  await until(S(39));
  await play(
    indicateAll(
      subtotalCards,
      XC,
      1.30
    ),

    ...say('STEP 1: ADD THE PAIRED GAP PRODUCTS', XC),

    ...fbox([
      ['multiply each pair of gaps', C.ink],
      ['add the six products', XC],
      ['sum = 540', XC]
    ], XC)
  );

  await until(S(40));
  await play(
    new M.Indicate(covarianceTag, {
      color: POS
    }),

    ...say('STEP 2: DIVIDE BY COUNT MINUS ONE', POS),

    ...fbox([
      ['sample covariance', POS],
      ['sum of gap products', XC],
      ['÷ (count − 1)', C.ink],
      ['540 ÷ 5 = 108', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 41: restore the original scatterplot.
  // Positive covariance describes a rising tendency.
  // ------------------------------------------------------------

  const arithmeticObjects = [
    arithmeticLabel,
    subtotalLabel,
    ...allProductCards,
    ...plusSigns,
    ...equalsSigns,
    ...subtotalCards,
    covarianceTag
  ];

  const positiveDirection = pill(
    'POSITIVE COVARIANCE',
    POS,
    P ? 16 : 16
  );

  positiveDirection.moveTo([
    X(28),
    Y(15),
    0
  ]);

  await until(S(41));
  await play(
    ...fadeAll(arithmeticObjects),

    ...revealAll(fullPlot),

    new M.FadeIn(positiveDirection),

    ...say('PLUS COVARIANCE: TEND TO RISE TOGETHER', POS),

    ...fbox([
      ['covariance = +108', POS],
      ['temperature rises', XC],
      ['rentals tend to rise', YC]
    ], POS)
  );

  // ------------------------------------------------------------
  // 42: illustrate a negative covariance.
  // These are hypothetical points, not the chapter's observations.
  // Reverse the rental values while retaining the temperatures.
  // Both means remain 20 and 40.
  // ------------------------------------------------------------

  const FALLING = DATA.map(
    ([x, y], k) => [
      x,
      DATA[DATA.length - 1 - k][1]
    ]
  );

  const fallingDots = FALLING.map(
    ([x, y]) => glowingDot(x, y, NEG)
  );

  const fallingCovariance =
    FALLING.reduce(
      (total, [x, y]) =>
        total +
        (x - MEAN_X) * (y - MEAN_Y),
      0
    ) / (FALLING.length - 1);

  const hypotheticalTag = pill(
    'ILLUSTRATIVE PATTERN',
    NEG,
    P ? 15 : 15
  );

  hypotheticalTag.moveTo([
    (XL + XR) / 2,
    YB + 0.38,
    0
  ]);

  const negativeDirection = pill(
    'NEGATIVE COVARIANCE',
    NEG,
    P ? 16 : 16
  );

  negativeDirection.moveTo([
    X(29),
    Y(68),
    0
  ]);

  await until(S(42));
  await play(
    new M.FadeOut(positiveDirection),

    ...fadeAll(dots),

    new M.LaggedStart(
      fallingDots.map(
        d => new M.FadeIn(d)
      ),
      {
        lagRatio: 0.12,
        runTime: 1.45
      }
    ),

    new M.FadeIn(hypotheticalTag),
    new M.FadeIn(negativeDirection),

    ...say('MINUS COVARIANCE: OPPOSITE DIRECTIONS', NEG),

    ...fbox([
      ['illustrative example', C.muted],
      [
        `covariance = ${signed(fallingCovariance)}`,
        NEG
      ],
      ['one rises, the other falls', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 43: positive and negative products can cancel.
  //
  // A hypothetical U-shaped pattern:
  // (10, 60), (15, 20), (25, 20), (30, 60)
  //
  // Means remain 20 and 40.
  //
  // Products:
  // -200, +100, -100, +200
  // Sum = 0
  // Sample covariance = 0
  //
  // The zero covariance does not mean there is no pattern.
  // ------------------------------------------------------------

  const CURVED = [
    [10, 60],
    [15, 20],
    [25, 20],
    [30, 60]
  ];

  const curvedProducts = CURVED.map(
    ([x, y]) =>
      (x - MEAN_X) * (y - MEAN_Y)
  );

  const curvedDots = CURVED.map(
    ([x, y]) => glowingDot(x, y, YC)
  );

  const curvedLabels = CURVED.map(
    ([x, y], k) => {
      const product = curvedProducts[k];

      const tag = pill(
        signed(product),
        product > 0 ? POS : NEG,
        P ? 16 : 16
      );

      tag.moveTo([
        X(x),
        Y(y) + 0.40,
        0
      ]);

      return tag;
    }
  );

  await until(S(43));
  await play(
    new M.FadeOut(negativeDirection),

    ...fadeAll(fallingDots),

    ...revealAll(curvedDots),
    ...revealAll(curvedLabels),

    ...say('PLUS AND MINUS RESULTS CAN CANCEL', NEG),

    ...fbox([
      ['−200 + 100 − 100 + 200', C.ink],
      ['sum = 0', ZERO],
      ['covariance = 0', ZERO],
      ['but the dots form a pattern', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 44: return to the six recorded hours and name the units.
  // ------------------------------------------------------------

  await until(S(44));
  await play(
    ...fadeAll([
      hypotheticalTag,
      ...curvedDots,
      ...curvedLabels
    ]),

    ...revealAll(dots),

    ...say('UNITS: DEGREES CELSIUS TIMES BIKES'),

    ...fbox([
      ['temperature gap: °C', XC],
      ['rental gap: bikes', YC],
      ['covariance: °C × bikes', POS],
      ['108 °C × bikes', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 45-46: changing units changes covariance size.
  // The six observations stay in exactly the same positions.
  // Counting wheels instead of bikes doubles every rental value
  // and every rental deviation.
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...say('COMMON TRAP: COMPARING DIFFERENT UNITS', NEG),

    ...fbox([
      ['covariance depends on units', NEG],
      ['change the measurement unit', C.ink],
      ['the number can change', XC]
    ], NEG)
  );

  const wheelsRuler = makeYRuler(2);
  const wheelsMeanTag = makeMeanYTag(2);

  const wheelGapHorizontal = horizontalGap(WARM);
  const wheelGapVertical = verticalGap(WARM);

  const wheelGapXLabel = horizontalGapLabel(
    WARM,
    '+10 °C'
  );

  const wheelGapYLabel = verticalGapLabel(
    WARM,
    '+40'
  );

  const wheelRing = dotRing(WARM, XC);

  const samePatternTag = pill(
    'SAME SIX HOURS',
    POS,
    P ? 16 : 16
  );

  samePatternTag.moveTo([
    X(12),
    Y(70),
    0
  ]);

  const wheelCovariance =
    DATA.reduce(
      (total, [x, y]) =>
        total +
        (x - MEAN_X) * ((y * 2) - (MEAN_Y * 2)),
      0
    ) / DIVISOR;

  await until(S(46));
  await play(
    new M.FadeOut(yRuler),
    new M.FadeOut(meanYTag),

    new M.FadeIn(wheelsRuler),
    new M.FadeIn(wheelsMeanTag),

    new M.Create(wheelGapHorizontal),
    new M.Create(wheelGapVertical),

    new M.FadeIn(wheelGapXLabel),
    new M.FadeIn(wheelGapYLabel),

    new M.Create(wheelRing),
    new M.FadeIn(samePatternTag),

    ...say('COUNT WHEELS: DOUBLE THE RENTAL GAPS', XC),

    ...fbox([
      ['1 bike = 2 wheels', C.ink],
      ['rental gap: 20 → 40', YC],
      [
        `covariance: 108 → ${wheelCovariance}`,
        XC
      ],
      ['same pattern, new units', POS]
    ], XC)
  );

  // ------------------------------------------------------------
  // 47: final definition.
  // Restore the original bikes scale, leaving the real data and
  // both mean lines visible.
  // ------------------------------------------------------------

  const finalPositiveTR = cornerTag(
    34,
    72,
    '+ × + = +',
    POS
  );

  const finalPositiveBL = cornerTag(
    7,
    8,
    '− × − = +',
    POS
  );

  const finalResult = pill(
    'COVARIANCE = +108',
    POS,
    P ? 18 : 18
  );

  finalResult.moveTo([
    X(28),
    Y(16),
    0
  ]);

  await until(S(47));
  await play(
    ...fadeAll([
      wheelsRuler,
      wheelsMeanTag,
      wheelGapHorizontal,
      wheelGapVertical,
      wheelGapXLabel,
      wheelGapYLabel,
      wheelRing,
      samePatternTag
    ]),

    new M.FadeIn(yRuler),
    new M.FadeIn(meanYTag),

    new M.FadeIn(finalPositiveTR),
    new M.FadeIn(finalPositiveBL),
    new M.FadeIn(finalResult),

    indicateAll(
      dots,
      POS,
      1.80
    ),

    ...say('COVARIANCE: COMBINE THE PAIRED GAPS', POS),

    ...fbox([
      ['SAMPLE COVARIANCE', POS],
      ['sum of paired gap products', XC],
      ['÷ (count − 1)', C.ink],
      ['+108 °C × bikes', POS]
    ], POS)
  );
}
