// lesson 2.2.7
// Pearson correlation: measuring the direction and strength
// of a straight-line pattern on a scale from -1 to +1.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the exact shared chapter data for the six dry afternoon hours.
// Perfect rising, falling, near-zero and curved patterns are
// explicitly labelled as illustrative examples.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const DATA = [
    [10, 20],
    [14, 30],
    [18, 35],
    [22, 45],
    [26, 50],
    [30, 60]
  ];

  const COUNT = DATA.length;

  const MEAN_X = 20;
  const MEAN_Y = 40;

  const DX = DATA.map(([x, y]) => x - MEAN_X);
  const DY = DATA.map(([x, y]) => y - MEAN_Y);

  const SD_X = Math.sqrt(
    DX.reduce((sum, n) => sum + n * n, 0) /
    (COUNT - 1)
  );

  const SD_Y = Math.sqrt(
    DY.reduce((sum, n) => sum + n * n, 0) /
    (COUNT - 1)
  );

  const COVARIANCE = DX.reduce(
    (sum, n, k) => sum + n * DY[k],
    0
  ) / (COUNT - 1);

  const SD_PRODUCT = SD_X * SD_Y;

  const PEARSON = COVARIANCE / SD_PRODUCT;

  const ZX = DX.map(n => n / SD_X);
  const ZY = DY.map(n => n / SD_Y);

  // Shared chapter values:
  //
  // Mean temperature = 20 °C
  // Mean rentals = 40 bikes
  //
  // Sample SD temperature ≈ 7.48 °C
  // Sample SD rentals ≈ 14.49 bikes
  //
  // Sample covariance = 108 °C × bikes
  //
  // Pearson r = 108 / (7.48 × 14.49)
  //           ≈ 0.996

  const XC = C.amber;
  const YC = C.cyan;
  const POS = C.green;
  const NEG = C.violet;
  const ZERO = C.muted;

  // ------------------------------------------------------------
  // Laptop and phone layouts.
  // ------------------------------------------------------------

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

  // Standardized coordinates mapped back to the same
  // physical positions on screen.
  const stepX = z =>
    X(MEAN_X + z * SD_X);

  const stepY = z =>
    Y(MEAN_Y + z * SD_Y);

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

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

  function outline(p, w, h, color = XC) {
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

  function signed(n, digits = null) {
    const value = digits === null
      ? String(Math.abs(n))
      : Math.abs(n).toFixed(digits);

    if (n > 0) return `+${value}`;
    if (n < 0) return `−${value}`;
    return '0';
  }

  function numberTag(s, p, color = XC, size = 16) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  // ------------------------------------------------------------
  // Information and formula box.
  // Follows the approved reference lesson's structure.
  // ------------------------------------------------------------

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
    const maxh = P ? 1.42 : 2.65;

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
  // Same plotting range as lesson 2.2.6.
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

  function makeXRuler() {
    const ticks = XTICKS.map(n => {
      const mark = line(
        [X(n), YB - 0.075, 0],
        [X(n), YB + 0.075, 0],
        C.muted,
        2
      );

      const label = textAt(
        String(n),
        17,
        C.muted,
        [X(n), YB - 0.28, 0],
        true
      );

      return new M.VGroup(mark, label);
    });

    const title = textAt(
      'Temperature (°C)',
      P ? 20 : 19,
      XC,
      [
        (XL + XR) / 2,
        YB - 0.70,
        0
      ]
    );

    return new M.VGroup(
      ...ticks,
      title
    );
  }

  function makeYRuler(multiplier = 1) {
    const ticks = YTICKS.map(n => {
      const mark = line(
        [XL - 0.075, Y(n), 0],
        [XL + 0.075, Y(n), 0],
        C.muted,
        2
      );

      const label = textAt(
        String(n * multiplier),
        17,
        C.muted,
        [XL - 0.36, Y(n), 0],
        true
      );

      return new M.VGroup(mark, label);
    });

    const title = textAt(
      multiplier === 1
        ? 'Bikes rented'
        : 'Wheels counted',
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

  const xRuler = makeXRuler();
  const yRuler = makeYRuler();

  const plotBase = [
    grid,
    xAxis,
    yAxis,
    xRuler,
    yRuler
  ];

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

  // ------------------------------------------------------------
  // Mean lines and markers.
  // ------------------------------------------------------------

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

  const meanXTag = numberTag(
    'MEAN: 20 °C',
    [
      X(MEAN_X) + 0.55,
      YT + 0.32,
      0
    ],
    XC,
    15
  );

  const meanYTag = numberTag(
    'MEAN: 40',
    [
      XR - 0.65,
      Y(MEAN_Y) - 0.29,
      0
    ],
    YC,
    15
  );

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

  // ------------------------------------------------------------
  // 0-3: recall the original six observations.
  // ------------------------------------------------------------

  await until(S(0));
  await play(
    ...revealAll(plotBase),

    new M.LaggedStart(
      dots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.13,
        runTime: 1.55
      }
    ),

    ...say('SIX DRY AFTERNOON HOURS'),

    ...fbox([
      ['bike station', C.muted],
      ['6 recorded hours', YC],
      ['same data as before', C.ink]
    ])
  );

  await until(S(1));
  await play(
    indicateAll(dots, POS, 1.45),

    ...say('THE DOTS RISE TOGETHER', POS),

    ...fbox([
      ['temperature rises', XC],
      ['rentals tend to rise', YC],
      ['positive pattern', POS]
    ], POS)
  );

  // A least-squares reference line for the original data.
  // Its role is only to make the straight-line question visible.
  const regressionSlope = DX.reduce(
    (sum, n, k) => sum + n * DY[k],
    0
  ) / DX.reduce(
    (sum, n) => sum + n * n,
    0
  );

  const predictedY = x =>
    MEAN_Y + regressionSlope * (x - MEAN_X);

  const fitLine = dashed(
    xy(5, predictedY(5)),
    xy(35, predictedY(35)),
    POS
  );

  const fitTag = numberTag(
    'STRAIGHT-LINE GUIDE',
    [X(28), Y(14), 0],
    POS,
    15
  );

  await until(S(2));
  await play(
    new M.Create(fitLine),
    new M.FadeIn(fitTag),

    ...say('HOW CLOSE TO A STRAIGHT LINE?', XC),

    ...fbox([
      ['direction: rising', POS],
      ['strength: how close', XC],
      ['to a straight line?']
    ], XC)
  );

  await until(S(3));
  await play(
    new M.FadeOut(fitLine),
    new M.FadeOut(fitTag),

    new M.Indicate(xRuler, {
      color: XC
    }),

    new M.Indicate(yRuler, {
      color: YC
    }),

    ...say('TWO MEASUREMENTS, TWO DIFFERENT UNITS'),

    ...fbox([
      ['temperature: °C', XC],
      ['rentals: bikes', YC],
      ['one hour per dot', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // 4-6: mark the two means.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    new M.Create(meanXLine),
    new M.FadeIn(meanXTag),

    ...say('MEAN TEMPERATURE = 20 °C', XC),

    ...fbox([
      ['temperature mean', XC],
      ['120 ÷ 6', C.ink],
      ['20 °C', XC]
    ], XC)
  );

  await until(S(5));
  await play(
    new M.Create(meanYLine),
    new M.FadeIn(meanYTag),
    new M.FadeIn(meanCenter),

    ...say('MEAN RENTALS = 40 BIKES'),

    ...fbox([
      ['rental mean', YC],
      ['240 ÷ 6', C.ink],
      ['40 bikes', YC]
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

    ...say('EACH MEAN IS A FAIR SHARE', POS),

    ...fbox([
      ['share each total equally', C.ink],
      ['20 °C per hour', XC],
      ['40 bikes per hour', YC]
    ], POS)
  );

  // ------------------------------------------------------------
  // 7-9: show the warmest hour's two gaps.
  // ------------------------------------------------------------

  const WARM = 5;
  const COLD = 0;

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

  function gapXLabel(k, s) {
    return textAt(
      s,
      P ? 18 : 17,
      XC,
      [
        (X(MEAN_X) + X(DATA[k][0])) / 2,
        Y(MEAN_Y) - 0.31,
        0
      ],
      true
    );
  }

  function gapYLabel(k, s) {
    const right = DATA[k][0] >= MEAN_X;

    return textAt(
      s,
      P ? 18 : 17,
      YC,
      [
        X(DATA[k][0]) +
          (right ? 0.46 : -0.46),
        (Y(MEAN_Y) + Y(DATA[k][1])) / 2,
        0
      ],
      true
    );
  }

  const warmRing = dotRing(WARM, XC);

  const warmH = horizontalGap(WARM);
  const warmV = verticalGap(WARM);

  const warmXLabel = gapXLabel(
    WARM,
    '+10 °C'
  );

  const warmYLabel = gapYLabel(
    WARM,
    '+20'
  );

  const warmRecord = numberTag(
    '30 °C · 60 BIKES',
    [
      X(30) - 0.25,
      Y(60) + 0.43,
      0
    ],
    YC,
    15
  );

  await until(S(7));
  await play(
    new M.Create(warmRing),
    new M.FadeIn(warmRecord),

    new M.Create(warmH),
    new M.FadeIn(warmXLabel),

    ...say('WARMEST HOUR: 10 °C TO THE RIGHT', XC),

    ...fbox([
      ['temperature gap', XC],
      ['30 − 20', C.ink],
      ['= +10 °C', XC]
    ], XC)
  );

  await until(S(8));
  await play(
    new M.Create(warmV),
    new M.FadeIn(warmYLabel),

    ...say('20 BIKES ABOVE THE MEAN'),

    ...fbox([
      ['temperature gap: +10 °C', XC],
      ['rental gap: 60 − 40', C.ink],
      ['= +20 bikes', YC]
    ])
  );

  await until(S(9));
  await play(
    new M.Indicate(warmXLabel, {
      color: XC
    }),

    new M.Indicate(warmYLabel, {
      color: YC
    }),

    ...say('THE TWO GAPS USE DIFFERENT UNITS', XC),

    ...fbox([
      ['10 degrees Celsius', XC],
      ['20 bikes', YC],
      ['different measuring units', C.muted]
    ], XC)
  );

  // ------------------------------------------------------------
  // 10-15: introduce rulers measured in standard deviations.
  //
  // Each ruler has a step size specific to its own variable.
  // The data points themselves never move.
  // ------------------------------------------------------------

  function horizontalStepRuler(
    stepSize,
    unitLabel = null
  ) {
    const y = YB + (P ? 0.75 : 0.43);

    const a = X(MEAN_X);
    const b = X(MEAN_X + stepSize);
    const c = X(MEAN_X + stepSize * 2);
    const d = X(MEAN_X - stepSize);
    const e = X(MEAN_X - stepSize * 2);

    const baseline = line(
      [e, y, 0],
      [c, y, 0],
      XC,
      3
    );

    const marks = [e, d, a, b, c].map(x =>
      line(
        [x, y - 0.09, 0],
        [x, y + 0.09, 0],
        XC,
        2
      )
    );

    const labels = [-2, -1, 0, 1, 2].map(
      (z, k) =>
        textAt(
          signed(z),
          P ? 16 : 15,
          XC,
          [
            [e, d, a, b, c][k],
            y - 0.23,
            0
          ],
          true
        )
    );

    const pieces = [
      baseline,
      ...marks,
      ...labels
    ];

    if (unitLabel) {
      const title = textAt(
        unitLabel,
        P ? 16 : 15,
        XC,
        [(a + b) / 2, y + 0.24, 0]
      );

      pieces.push(title);
    }

    return new M.VGroup(...pieces);
  }

  function verticalStepRuler(
    stepSize,
    unitLabel = null
  ) {
    const x = XL + 0.62;

    const values = [-2, -1, 0, 1, 2];

    const positions = values.map(
      z => Y(MEAN_Y + z * stepSize)
    );

    const baseline = line(
      [x, positions[0], 0],
      [x, positions[4], 0],
      YC,
      3
    );

    const marks = positions.map(y =>
      line(
        [x - 0.09, y, 0],
        [x + 0.09, y, 0],
        YC,
        2
      )
    );

    const labels = values.map((z, k) =>
      textAt(
        signed(z),
        P ? 16 : 15,
        YC,
        [x - 0.27, positions[k], 0],
        true
      )
    );

    const pieces = [
      baseline,
      ...marks,
      ...labels
    ];

    if (unitLabel) {
      const title = textAt(
        unitLabel,
        P ? 16 : 15,
        YC,
        [
          x + 0.68,
          (positions[2] + positions[3]) / 2,
          0
        ]
      );

      pieces.push(title);
    }

    return new M.VGroup(...pieces);
  }

  const stepRulerX = horizontalStepRuler(SD_X);
  const stepRulerY = verticalStepRuler(SD_Y);

  await until(S(10));
  await play(
    new M.FadeOut(warmRecord),

    new M.FadeIn(stepRulerX),
    new M.FadeIn(stepRulerY),

    ...say('MAKE A RULER FOR EACH SET OF VALUES'),

    ...fbox([
      ['temperature gets a ruler', XC],
      ['rentals get a ruler', YC],
      ['both start at their means', C.ink]
    ])
  );

  function horizontalBracket(a, b, y, color) {
    return new M.VGroup(
      line(
        [a, y, 0],
        [b, y, 0],
        color,
        4
      ),
      line(
        [a, y - 0.10, 0],
        [a, y + 0.10, 0],
        color,
        2
      ),
      line(
        [b, y - 0.10, 0],
        [b, y + 0.10, 0],
        color,
        2
      )
    );
  }

  function verticalBracket(a, b, x, color) {
    return new M.VGroup(
      line(
        [x, a, 0],
        [x, b, 0],
        color,
        4
      ),
      line(
        [x - 0.10, a, 0],
        [x + 0.10, a, 0],
        color,
        2
      ),
      line(
        [x - 0.10, b, 0],
        [x + 0.10, b, 0],
        color,
        2
      )
    );
  }

  const xStepBracket = horizontalBracket(
    stepX(0),
    stepX(1),
    YB + (P ? 1.05 : 0.75),
    XC
  );

  const yStepBracket = verticalBracket(
    stepY(0),
    stepY(1),
    XL + 0.90,
    YC
  );

  const oneStepX = textAt(
    '1 step',
    16,
    XC,
    [
      (stepX(0) + stepX(1)) / 2,
      YB + (P ? 1.30 : 0.98),
      0
    ]
  );

  const oneStepY = textAt(
    '1 step',
    16,
    YC,
    [
      XL + 1.40,
      (stepY(0) + stepY(1)) / 2,
      0
    ]
  );

  await until(S(11));
  await play(
    new M.FadeIn(xStepBracket),
    new M.FadeIn(yStepBracket),

    new M.FadeIn(oneStepX),
    new M.FadeIn(oneStepY),

    ...say('ONE STEP = A TYPICAL SIZE OF GAP', POS),

    ...fbox([
      ['one temperature step', XC],
      ['one rental step', YC],
      ['each measures spread', C.ink]
    ], POS)
  );

  await until(S(12));
  await play(
    new M.Indicate(xStepBracket, {
      color: XC
    }),

    new M.Indicate(yStepBracket, {
      color: YC
    }),

    ...say('THE STEP SIZE IS THE STANDARD DEVIATION', POS),

    ...fbox([
      ['STANDARD DEVIATION', POS],
      ['a measure of spread', C.ink],
      ['one standard step', C.muted]
    ], POS)
  );

  const sampleFrame = outline(
    [
      (X(10) + X(30)) / 2,
      (Y(20) + Y(60)) / 2,
      0
    ],
    X(30) - X(10) + 0.50,
    Y(60) - Y(20) + 0.50,
    YC
  );

  await until(S(13));
  await play(
    new M.Create(sampleFrame),

    indicateAll(dots, YC, 1.45),

    ...say('OUR SAMPLE IS THESE SIX HOURS'),

    ...fbox([
      ['sample = small set', YC],
      ['6 dry afternoon hours', C.ink],
      ['sample standard deviations', C.muted]
    ])
  );

  const xStepValue = textAt(
    '7.48 °C',
    P ? 18 : 17,
    XC,
    [
      (stepX(0) + stepX(1)) / 2,
      YB + (P ? 1.30 : 0.98),
      0
    ],
    true
  );

  await until(S(14));
  await play(
    new M.FadeOut(sampleFrame),
    new M.FadeOut(oneStepX),

    new M.FadeIn(xStepValue),

    new M.Indicate(xStepBracket, {
      color: XC
    }),

    ...say('TEMPERATURE STEP ≈ 7.48 °C', XC),

    ...fbox([
      ['temperature', XC],
      ['1 standard deviation', C.ink],
      [`≈ ${SD_X.toFixed(2)} °C`, XC]
    ], XC)
  );

  const yStepValue = textAt(
    '14.49',
    P ? 18 : 17,
    YC,
    [
      XL + 1.42,
      (stepY(0) + stepY(1)) / 2,
      0
    ],
    true
  );

  await until(S(15));
  await play(
    new M.FadeOut(oneStepY),

    new M.FadeIn(yStepValue),

    new M.Indicate(yStepBracket, {
      color: YC
    }),

    ...say('RENTAL STEP ≈ 14.49 BIKES'),

    ...fbox([
      ['rentals', YC],
      ['1 standard deviation', C.ink],
      [`≈ ${SD_Y.toFixed(2)} bikes`, YC]
    ])
  );

  // ------------------------------------------------------------
  // 16-18: express gaps in standard steps.
  //
  // Warmest hour:
  //   10 / 7.48 ≈ +1.34 steps
  //   20 / 14.49 ≈ +1.38 steps
  //
  // Coolest hour:
  //   -1.34 steps across
  //   -1.38 steps up
  // ------------------------------------------------------------

  const warmStepXLabel = gapXLabel(
    WARM,
    `≈ ${signed(ZX[WARM], 2)} steps`
  );

  const warmStepYLabel = textAt(
    signed(ZY[WARM], 2),
    P ? 18 : 17,
    YC,
    [
      X(DATA[WARM][0]) + 0.49,
      (Y(MEAN_Y) + Y(DATA[WARM][1])) / 2,
      0
    ],
    true
  );

  const warmXOneMark = line(
    [
      stepX(1),
      Y(MEAN_Y) - 0.10,
      0
    ],
    [
      stepX(1),
      Y(MEAN_Y) + 0.10,
      0
    ],
    C.ink,
    3
  );

  await until(S(16));
  await play(
    new M.FadeOut(warmXLabel),

    new M.FadeIn(warmStepXLabel),

    new M.Create(warmXOneMark),

    ...say('A LITTLE OVER ONE STEP TO THE RIGHT', XC),

    ...fbox([
      ['temperature gap = 10 °C', XC],
      ['one step ≈ 7.48 °C', C.muted],
      ['10 ÷ 7.48 ≈ 1.34 steps', POS]
    ], POS)
  );

  const warmYOneMark = line(
    [
      X(DATA[WARM][0]) - 0.10,
      stepY(1),
      0
    ],
    [
      X(DATA[WARM][0]) + 0.10,
      stepY(1),
      0
    ],
    C.ink,
    3
  );

  await until(S(17));
  await play(
    new M.FadeOut(warmYLabel),

    new M.FadeIn(warmStepYLabel),

    new M.Create(warmYOneMark),

    ...say('A LITTLE OVER ONE STEP UP'),

    ...fbox([
      ['rental gap = 20 bikes', YC],
      ['one step ≈ 14.49 bikes', C.muted],
      ['20 ÷ 14.49 ≈ 1.38 steps', POS]
    ], POS)
  );

  const coldH = horizontalGap(COLD);
  const coldV = verticalGap(COLD);

  const coldRing = dotRing(COLD, NEG);

  const coldStepXLabel = gapXLabel(
    COLD,
    `≈ ${signed(ZX[COLD], 2)} steps`
  );

  const coldStepYLabel = gapYLabel(
    COLD,
    signed(ZY[COLD], 2)
  );

  await until(S(18));
  await play(
    new M.FadeOut(warmRing),

    new M.Create(coldRing),
    new M.Create(coldH),
    new M.Create(coldV),

    new M.FadeIn(coldStepXLabel),
    new M.FadeIn(coldStepYLabel),

    ...say('COLDEST HOUR: THE SAME STEPS, OPPOSITE WAY', NEG),

    ...fbox([
      ['temperature: −1.34 steps', XC],
      ['rentals: −1.38 steps', YC],
      ['left and down', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 19: replace the original units with standard-step axes.
  //
  // Standardized axes use the mean as zero.
  // Their tick positions are calculated from the exact sample
  // standard deviations, not the rounded display values.
  // ------------------------------------------------------------

  function makeStandardXRuler() {
    const values = [-2, -1, 0, 1, 2];

    const ticks = values.map(z => {
      const x = stepX(z);

      const mark = line(
        [x, YB - 0.075, 0],
        [x, YB + 0.075, 0],
        XC,
        2
      );

      const lab = textAt(
        signed(z),
        17,
        XC,
        [x, YB - 0.28, 0],
        true
      );

      return new M.VGroup(mark, lab);
    });

    const title = textAt(
      'Temperature (standard steps)',
      P ? 18 : 17,
      XC,
      [
        (XL + XR) / 2,
        YB - 0.70,
        0
      ]
    );

    return new M.VGroup(
      ...ticks,
      title
    );
  }

  function makeStandardYRuler() {
    const values = [-2, -1, 0, 1, 2];

    const ticks = values.map(z => {
      const y = stepY(z);

      const mark = line(
        [XL - 0.075, y, 0],
        [XL + 0.075, y, 0],
        YC,
        2
      );

      const lab = textAt(
        signed(z),
        17,
        YC,
        [XL - 0.36, y, 0],
        true
      );

      return new M.VGroup(mark, lab);
    });

    const title = textAt(
      'Rental standard steps',
      P ? 18 : 17,
      YC,
      [
        XL + 1.35,
        YT + 0.31,
        0
      ]
    );

    return new M.VGroup(
      ...ticks,
      title
    );
  }

  // Grid lines follow the standardized rulers.
  const standardGridLines = [];

  [-2, -1, 1, 2].forEach(z => {
    standardGridLines.push(line(
      [stepX(z), YB, 0],
      [stepX(z), YT, 0],
      C.card,
      1.5
    ));

    standardGridLines.push(line(
      [XL, stepY(z), 0],
      [XR, stepY(z), 0],
      C.card,
      1.5
    ));
  });

  const standardGrid = new M.VGroup(
    ...standardGridLines
  );

  const standardXRuler = makeStandardXRuler();
  const standardYRuler = makeStandardYRuler();

  const zeroMeanX = numberTag(
    '0 = MEAN',
    [
      X(MEAN_X) + 0.42,
      YT + 0.32,
      0
    ],
    XC,
    15
  );

  const zeroMeanY = numberTag(
    '0 = MEAN',
    [
      XR - 0.65,
      Y(MEAN_Y) - 0.29,
      0
    ],
    YC,
    15
  );

  await until(S(19));
  await play(
    ...fadeAll([
      warmH,
      warmV,
      warmStepXLabel,
      warmStepYLabel,
      warmXOneMark,
      warmYOneMark,

      coldH,
      coldV,
      coldRing,
      coldStepXLabel,
      coldStepYLabel,

      stepRulerX,
      stepRulerY,
      xStepBracket,
      yStepBracket,
      xStepValue,
      yStepValue,

      grid,
      xRuler,
      yRuler,
      meanXTag,
      meanYTag
    ]),

    ...revealAll([
      standardGrid,
      standardXRuler,
      standardYRuler,
      zeroMeanX,
      zeroMeanY
    ]),

    ...say('BOTH RULERS NOW SPEAK IN STEPS', POS),

    ...fbox([
      ['zero = mean', C.ink],
      ['+1 = one step above', POS],
      ['−1 = one step below', NEG],
      ['no original measurement units', C.muted]
    ], POS)
  );

  // ------------------------------------------------------------
  // 20-22: recall covariance.
  // Restore the original measurement rulers because covariance
  // uses the original, unstandardized deviations.
  // ------------------------------------------------------------

  const standardizedObjects = [
    standardGrid,
    standardXRuler,
    standardYRuler,
    zeroMeanX,
    zeroMeanY
  ];

  const originalUnitObjects = [
    grid,
    xRuler,
    yRuler,
    meanXTag,
    meanYTag
  ];

  const productLabels = [
    numberTag(
      '+200',
      [X(7.5), Y(15), 0],
      POS,
      16
    ),
    numberTag(
      '+60',
      [X(11.8), Y(39), 0],
      POS,
      15
    ),
    numberTag(
      '+10',
      [X(17), Y(25), 0],
      POS,
      15
    ),
    numberTag(
      '+10',
      [X(23), Y(58), 0],
      POS,
      15
    ),
    numberTag(
      '+60',
      [X(28.5), Y(46), 0],
      POS,
      15
    ),
    numberTag(
      '+200',
      [X(33), Y(70), 0],
      POS,
      16
    )
  ];

  await until(S(20));
  await play(
    ...fadeAll(standardizedObjects),

    ...revealAll(originalUnitObjects),

    new M.LaggedStart(
      productLabels.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.65
      }
    ),

    ...say('COVARIANCE COMBINES THE PAIRED GAPS', XC),

    ...fbox([
      ['multiply each pair of gaps', C.ink],
      ['add the six products', XC],
      ['divide by 6 − 1', POS]
    ], XC)
  );

  await until(S(21));
  await play(
    ...fadeAll(productLabels),

    ...say('COVARIANCE DEPENDS ON THE UNITS', NEG),

    ...fbox([
      ['covariance shows direction', POS],
      ['but its size uses the units', NEG],
      ['°C × bikes', C.muted]
    ], NEG)
  );

  const covarianceTag = numberTag(
    'COVARIANCE = 108',
    [
      X(28),
      Y(14),
      0
    ],
    XC,
    18
  );

  await until(S(22));
  await play(
    new M.FadeIn(covarianceTag),

    ...say('OUR SAMPLE COVARIANCE IS 108', XC),

    ...fbox([
      ['sum of products = 540', C.ink],
      ['540 ÷ 5', XC],
      ['covariance = 108', XC]
    ], XC)
  );

  // ------------------------------------------------------------
  // 23-26: normalize covariance by the product of the two
  // standard deviations.
  // ------------------------------------------------------------

  const arithmeticStepX = numberTag(
    '7.48 °C',
    [
      X(11),
      Y(68),
      0
    ],
    XC,
    16
  );

  const arithmeticStepY = numberTag(
    '14.49 BIKES',
    [
      X(28.5),
      Y(68),
      0
    ],
    YC,
    16
  );

  const arithmeticTimes = textAt(
    '×',
    23,
    C.ink,
    [
      X(20),
      Y(68),
      0
    ]
  );

  await until(S(23));
  await play(
    new M.FadeIn(arithmeticStepX),
    new M.FadeIn(arithmeticStepY),
    new M.FadeIn(arithmeticTimes),

    ...say('MULTIPLY THE TWO RULER STEPS', POS),

    ...fbox([
      ['7.48 × 14.49', C.ink],
      ['≈ 108.4', POS],
      ['product of the two spreads', C.muted]
    ], POS)
  );

  const fractionP = [
    X(29),
    Y(14),
    0
  ];

  function fractionCard(
    numerator,
    denominator,
    color = POS
  ) {
    const top = T(
      numerator,
      P ? 23 : 22,
      XC,
      true
    );

    const bottom = T(
      denominator,
      P ? 19 : 18,
      YC,
      true
    );

    const width = Math.max(
      top.getWidth(),
      bottom.getWidth()
    ) + 0.35;

    const maxw = P ? 2.80 : 3.15;

    const scale = Math.min(
      1,
      maxw / width
    );

    const w = width * scale + 0.24;
    const h = 1.03;

    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.98);
    r.moveTo(fractionP);

    if (scale < 1) {
      top.scale(scale);
      bottom.scale(scale);
    }

    top.moveTo([
      fractionP[0],
      fractionP[1] + 0.25,
      0
    ]);

    bottom.moveTo([
      fractionP[0],
      fractionP[1] - 0.25,
      0
    ]);

    const divider = line(
      [
        fractionP[0] - w / 2 + 0.16,
        fractionP[1],
        0
      ],
      [
        fractionP[0] + w / 2 - 0.16,
        fractionP[1],
        0
      ],
      C.ink,
      2
    );

    return new M.VGroup(
      r,
      top,
      divider,
      bottom
    );
  }

  const fraction = fractionCard(
    '108',
    '7.48 × 14.49'
  );

  await until(S(24));
  await play(
    new M.FadeOut(covarianceTag),

    new M.FadeIn(fraction),

    ...say('DIVIDE COVARIANCE BY THAT PRODUCT', POS),

    ...fbox([
      ['covariance = 108', XC],
      ['spread product ≈ 108.4', YC],
      ['108 ÷ 108.4', POS]
    ], POS)
  );

  const pearsonTag = numberTag(
    `r ≈ ${PEARSON.toFixed(3)}`,
    fractionP,
    POS,
    24
  );

  await until(S(25));
  await play(
    new M.FadeOut(fraction),

    new M.FadeIn(pearsonTag),

    ...say('THE RESULT IS ABOUT +0.996', POS),

    ...fbox([
      ['108 ÷ (7.48 × 14.49)', C.ink],
      [`≈ ${PEARSON.toFixed(3)}`, POS],
      ['very close to +1', POS]
    ], POS)
  );

  await until(S(26));
  await play(
    ...fadeAll([
      arithmeticStepX,
      arithmeticStepY,
      arithmeticTimes
    ]),

    new M.Indicate(pearsonTag, {
      color: POS
    }),

    ...say('THIS IS THE PEARSON CORRELATION', POS),

    ...fbox([
      ['PEARSON CORRELATION', POS],
      ['often written as r', C.ink],
      ['r ≈ +0.996', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 27-30: interpretation and formula.
  // ------------------------------------------------------------

  const fitLine2 = dashed(
    xy(5, predictedY(5)),
    xy(35, predictedY(35)),
    POS
  );

  // Short residual lines show the small vertical differences
  // between the observed dots and the straight-line guide.
  const residuals = DATA.map(([x, y]) => {
    const target = predictedY(x);

    return line(
      xy(x, y),
      xy(x, target),
      XC,
      3
    );
  });

  await until(S(27));
  await play(
    new M.Create(fitLine2),

    new M.LaggedStart(
      residuals.map(r =>
        new M.Create(r)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.35
      }
    ),

    ...say('DIRECTION AND STRENGTH OF A STRAIGHT-LINE PATTERN', POS),

    ...fbox([
      ['direction: positive', POS],
      ['strength: very strong', POS],
      ['dots close to a straight line', C.ink]
    ], POS)
  );

  await until(S(28));
  await play(
    ...say('HERE IS THE FORMULA IN WORDS'),

    ...fbox([
      ['Pearson correlation', POS],
      ['covariance', XC],
      ['two standard deviations', YC]
    ], POS)
  );

  await until(S(29));
  await play(
    ...say('COVARIANCE ÷ PRODUCT OF STANDARD DEVIATIONS', POS),

    ...fbox([
      ['Pearson correlation =', POS],
      ['covariance', XC],
      ['÷ (SD of x × SD of y)', YC],
      ['r ≈ +0.996', POS]
    ], POS)
  );

  await until(S(30));
  await play(
    ...say('PRODUCT MEANS MULTIPLY THE TWO STEPS', XC),

    ...fbox([
      ['SD temperature ≈ 7.48', XC],
      ['SD rentals ≈ 14.49', YC],
      ['multiply: 7.48 × 14.49', POS],
      ['then divide 108 by it', C.ink]
    ], POS)
  );

  // ------------------------------------------------------------
  // Correlation scale.
  // Used for the interpretation examples and final recap.
  // ------------------------------------------------------------

  const SCALE_Y = P ? -3.22 : -1.68;

  const SCALE_LEFT = XL + 0.70;
  const SCALE_RIGHT = XR - 0.70;

  const R = r =>
    SCALE_LEFT +
    (r + 1) / 2 *
    (SCALE_RIGHT - SCALE_LEFT);

  function correlationScale() {
    const w = SCALE_RIGHT - SCALE_LEFT + 1.02;
    const h = P ? 1.05 : 0.90;

    const panel = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color: C.muted,
      strokeWidth: 1.5
    });

    panel.setFill(C.card, 0.98);

    panel.moveTo([
      (SCALE_LEFT + SCALE_RIGHT) / 2,
      SCALE_Y,
      0
    ]);

    const baseline = line(
      [SCALE_LEFT, SCALE_Y + 0.05, 0],
      [SCALE_RIGHT, SCALE_Y + 0.05, 0],
      C.muted,
      3
    );

    const negativeHalf = line(
      [R(-1), SCALE_Y + 0.05, 0],
      [R(0), SCALE_Y + 0.05, 0],
      NEG,
      4
    );

    const positiveHalf = line(
      [R(0), SCALE_Y + 0.05, 0],
      [R(1), SCALE_Y + 0.05, 0],
      POS,
      4
    );

    const marks = [-1, -0.5, 0, 0.5, 1].map(r =>
      line(
        [R(r), SCALE_Y - 0.04, 0],
        [R(r), SCALE_Y + 0.14, 0],
        C.ink,
        2
      )
    );

    const labels = [-1, 0, 1].map(r =>
      textAt(
        signed(r),
        P ? 17 : 16,
        r === -1
          ? NEG
          : r === 1
            ? POS
            : C.ink,
        [R(r), SCALE_Y - 0.25, 0],
        true
      )
    );

    return new M.VGroup(
      panel,
      baseline,
      negativeHalf,
      positiveHalf,
      ...marks,
      ...labels
    );
  }

  function scaleMarker(r, color) {
    const p = [
      R(r),
      SCALE_Y + 0.05,
      0
    ];

    const halo = new M.Dot({
      point: p,
      radius: 0.18,
      color
    });

    halo.setFill(color, 0.20);

    const core = new M.Dot({
      point: p,
      radius: 0.085,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(
      halo,
      core
    );
  }

  const rScale = correlationScale();

  let rMarker = scaleMarker(
    PEARSON,
    POS
  );

  // Move to a compact example plot above the correlation scale.
  // This keeps the interpretation scale from covering data.
  const EX_LEFT = XL + 0.45;
  const EX_RIGHT = XR - 0.25;

  const EX_BOTTOM = P ? -2.25 : -0.68;
  const EX_TOP = P ? 1.15 : 1.05;

  const EX = n =>
    EX_LEFT + n / 40 * (EX_RIGHT - EX_LEFT);

  const EY = n =>
    EX_BOTTOM + n / 80 * (EX_TOP - EX_BOTTOM);

  const exy = (x, y) => [
    EX(x),
    EY(y),
    0
  ];

  function exampleDot(x, y, color = YC) {
    const p = exy(x, y);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.17 : 0.14,
      color
    });

    halo.setFill(color, 0.18);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.085 : 0.07,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(halo, core);
  }

  function exampleGrid() {
    const pieces = [];

    for (let x = 10; x <= 40; x += 10) {
      pieces.push(line(
        exy(x, 0),
        exy(x, 80),
        C.card,
        1
      ));
    }

    for (let y = 20; y <= 80; y += 20) {
      pieces.push(line(
        exy(0, y),
        exy(40, y),
        C.card,
        1
      ));
    }

    return new M.VGroup(...pieces);
  }

  const smallGrid = exampleGrid();

  const smallXAxis = line(
    exy(0, 0),
    exy(40, 0),
    C.muted,
    2.5
  );

  const smallYAxis = line(
    exy(0, 0),
    exy(0, 80),
    C.muted,
    2.5
  );

  const smallXTitle = textAt(
    'Temperature →',
    P ? 17 : 15,
    XC,
    [
      (EX_LEFT + EX_RIGHT) / 2,
      EX_BOTTOM - 0.29,
      0
    ]
  );

  const smallYTitle = textAt(
    'Rentals',
    P ? 17 : 15,
    YC,
    [
      EX_LEFT + 0.60,
      EX_TOP + 0.27,
      0
    ]
  );

  const exampleBase = [
    smallGrid,
    smallXAxis,
    smallYAxis,
    smallXTitle,
    smallYTitle
  ];

  const actualSmallDots = DATA.map(
    ([x, y]) => exampleDot(x, y)
  );

  const actualSmallLine = dashed(
    exy(5, predictedY(5)),
    exy(35, predictedY(35)),
    POS
  );

  const actualTag = numberTag(
    'OUR SIX HOURS',
    [
      EX_RIGHT - 1.05,
      EX_TOP + 0.27,
      0
    ],
    YC,
    14
  );

  // ------------------------------------------------------------
  // 31: place the actual Pearson correlation on its scale.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...fadeAll([
      ...plotBase,
      ...meanObjects,
      ...dots,
      fitLine2,
      ...residuals,
      pearsonTag
    ]),

    ...revealAll([
      ...exampleBase,
      ...actualSmallDots,
      actualTag
    ]),

    new M.Create(actualSmallLine),

    new M.FadeIn(rScale),
    new M.FadeIn(rMarker),

    ...say('OUR RESULT IS VERY CLOSE TO +1', POS),

    ...fbox([
      ['our six dry hours', YC],
      ['r ≈ +0.996', POS],
      ['very strong rising pattern', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 32: perfect positive correlation.
  //
  // Illustrative example, not the recorded bike data.
  // Every dot lies exactly on y = 2x.
  // ------------------------------------------------------------

  const PERFECT_POS = [
    [5, 10],
    [11, 22],
    [17, 34],
    [23, 46],
    [29, 58],
    [35, 70]
  ];

  const perfectPosDots = PERFECT_POS.map(
    ([x, y]) => exampleDot(x, y, POS)
  );

  const perfectPosLine = line(
    exy(5, 10),
    exy(35, 70),
    POS,
    2.5
  );

  const exampleTag = numberTag(
    'ILLUSTRATIVE PATTERN',
    [
      EX_RIGHT - 1.25,
      EX_TOP + 0.27,
      0
    ],
    XC,
    14
  );

  function moveCorrelationMarker(r, color) {
    const target = scaleMarker(r, color);

    return new M.Transform(
      rMarker,
      target
    );
  }

  await until(S(32));
  await play(
    ...fadeAll([
      ...actualSmallDots,
      actualSmallLine,
      actualTag
    ]),

    new M.FadeIn(exampleTag),

    new M.Create(perfectPosLine),

    ...revealAll(perfectPosDots),

    moveCorrelationMarker(1, POS),

    ...say('+1: A PERFECT RISING STRAIGHT LINE', POS),

    ...fbox([
      ['r = +1', POS],
      ['every dot lies exactly', C.ink],
      ['on one rising straight line', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 33: perfect negative correlation.
  //
  // Illustrative example: y = 80 - 2x.
  // ------------------------------------------------------------

  const PERFECT_NEG = PERFECT_POS.map(
    ([x, y]) => [x, 80 - y]
  );

  const perfectNegDots = PERFECT_NEG.map(
    ([x, y]) => exampleDot(x, y, NEG)
  );

  const perfectNegLine = line(
    exy(5, 70),
    exy(35, 10),
    NEG,
    2.5
  );

  await until(S(33));
  await play(
    ...fadeAll([
      ...perfectPosDots,
      perfectPosLine
    ]),

    new M.Create(perfectNegLine),

    ...revealAll(perfectNegDots),

    moveCorrelationMarker(-1, NEG),

    ...say('−1: A PERFECT FALLING STRAIGHT LINE', NEG),

    ...fbox([
      ['r = −1', NEG],
      ['every dot lies exactly', C.ink],
      ['on one falling straight line', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // Helper for calculating correlation of illustrative examples.
  // ------------------------------------------------------------

  function correlation(data) {
    const n = data.length;

    const mx = data.reduce(
      (sum, [x, y]) => sum + x,
      0
    ) / n;

    const my = data.reduce(
      (sum, [x, y]) => sum + y,
      0
    ) / n;

    let cross = 0;
    let xx = 0;
    let yy = 0;

    data.forEach(([x, y]) => {
      const dx = x - mx;
      const dy = y - my;

      cross += dx * dy;
      xx += dx * dx;
      yy += dy * dy;
    });

    const denominator = Math.sqrt(xx * yy);

    return denominator === 0
      ? null
      : cross / denominator;
  }

  // ------------------------------------------------------------
  // 34-35: near-zero straight-line association.
  // The illustrative points have no strong linear direction.
  // ------------------------------------------------------------

  const SCATTERED = [
    [5, 35],
    [11, 65],
    [17, 20],
    [23, 55],
    [29, 25],
    [35, 45]
  ];

  const scatteredR = correlation(SCATTERED);

  const scatteredDots = SCATTERED.map(
    ([x, y]) => exampleDot(x, y, YC)
  );

  await until(S(34));
  await play(
    ...fadeAll([
      ...perfectNegDots,
      perfectNegLine
    ]),

    ...revealAll(scatteredDots),

    moveCorrelationMarker(
      scatteredR,
      ZERO
    ),

    ...say('NEAR ZERO: LITTLE STRAIGHT-LINE ASSOCIATION', ZERO),

    ...fbox([
      [`r ≈ ${signed(scatteredR, 2)}`, C.ink],
      ['little straight-line direction', ZERO],
      ['not strongly rising or falling', C.muted]
    ], ZERO)
  );

  await until(S(35));
  await play(
    new M.Indicate(smallXTitle, {
      color: XC
    }),

    new M.Indicate(smallYTitle, {
      color: YC
    }),

    ...say('ASSOCIATION = A PATTERN BETWEEN TWO MEASUREMENTS'),

    ...fbox([
      ['ASSOCIATION', C.green],
      ['a pattern between', C.ink],
      ['two measured things', C.ink]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 36-38: changing units does not change Pearson correlation.
  //
  // Bikes -> wheels:
  //   covariance doubles: 108 -> 216
  //   rental SD doubles: 14.49 -> 28.98
  //   temperature SD stays the same
  //
  // Both parts of the division scale by the same factor.
  // ------------------------------------------------------------

  const wheelCovariance = COVARIANCE * 2;
  const wheelSD = SD_Y * 2;

  const wheelPearson =
    wheelCovariance / (SD_X * wheelSD);

  // Comparison panels for the two calculations.
  const UNIT_CARD_W = P ? 5.75 : 3.35;
  const UNIT_CARD_H = P ? 1.45 : 2.10;

  const bikePanelP = P
    ? [0, 0.35, 0]
    : [CX - 1.85, -0.20, 0];

  const wheelPanelP = P
    ? [0, -1.50, 0]
    : [CX + 1.85, -0.20, 0];

  function unitPanel(
    center,
    title,
    numerator,
    denominator,
    result,
    color
  ) {
    const r = new M.RoundedRectangle({
      width: UNIT_CARD_W,
      height: UNIT_CARD_H,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(center);

    const titleY = P
      ? center[1] + 0.48
      : center[1] + 0.75;

    const numeratorY = P
      ? center[1] + 0.14
      : center[1] + 0.30;

    const denominatorY = P
      ? center[1] - 0.15
      : center[1] - 0.17;

    const resultY = P
      ? center[1] - 0.49
      : center[1] - 0.72;

    const titleText = textAt(
      title,
      P ? 17 : 18,
      color,
      [center[0], titleY, 0]
    );

    const top = textAt(
      numerator,
      P ? 20 : 21,
      XC,
      [center[0], numeratorY, 0],
      true
    );

    const bottom = textAt(
      denominator,
      P ? 18 : 19,
      YC,
      [center[0], denominatorY, 0],
      true
    );

    const fracW = Math.min(
      UNIT_CARD_W - 0.40,
      Math.max(
        top.getWidth(),
        bottom.getWidth()
      ) + 0.22
    );

    const dividerY = (
      numeratorY + denominatorY
    ) / 2;

    const divider = line(
      [
        center[0] - fracW / 2,
        dividerY,
        0
      ],
      [
        center[0] + fracW / 2,
        dividerY,
        0
      ],
      C.ink,
      2
    );

    const resultText = textAt(
      result,
      P ? 20 : 22,
      POS,
      [center[0], resultY, 0],
      true
    );

    return new M.VGroup(
      r,
      titleText,
      top,
      divider,
      bottom,
      resultText
    );
  }

  const bikesPanel = unitPanel(
    bikePanelP,
    'COUNTING BIKES',
    '108',
    '7.48 × 14.49',
    '≈ 0.996',
    YC
  );

  const wheelsPanel = unitPanel(
    wheelPanelP,
    'COUNTING WHEELS',
    '108 × 2',
    '7.48 × (14.49 × 2)',
    'same ratio',
    XC
  );

  const unitChangeTag = numberTag(
    '1 BIKE = 2 WHEELS',
    [
      CX,
      P ? 1.45 : 1.16,
      0
    ],
    XC,
    17
  );

  await until(S(36));
  await play(
    ...fadeAll([
      ...exampleBase,
      ...scatteredDots,
      exampleTag,
      rScale,
      rMarker
    ]),

    new M.FadeIn(unitChangeTag),
    new M.FadeIn(bikesPanel),
    new M.FadeIn(wheelsPanel),

    ...say('BOTH PARTS OF THE DIVISION DOUBLE', XC),

    ...fbox([
      ['covariance: 108 → 216', XC],
      ['rental SD: 14.49 → 28.98', YC],
      ['temperature SD unchanged', C.ink]
    ], XC)
  );

  const wheelsPanelResult = unitPanel(
    wheelPanelP,
    'COUNTING WHEELS',
    String(wheelCovariance),
    `7.48 × ${wheelSD.toFixed(2)}`,
    `≈ ${wheelPearson.toFixed(3)}`,
    POS
  );

  const sameResultTag = numberTag(
    'SAME CORRELATION',
    [
      CX,
      P ? -3.05 : -1.80,
      0
    ],
    POS,
    18
  );

  await until(S(37));
  await play(
    new M.Transform(
      wheelsPanel,
      wheelsPanelResult
    ),

    new M.FadeIn(sameResultTag),

    ...say('THE RESULT STAYS THE SAME', POS),

    ...fbox([
      ['bikes: r ≈ +0.996', YC],
      ['wheels: r ≈ +0.996', XC],
      ['Pearson has no units', POS]
    ], POS)
  );

  const rMarkerActual = scaleMarker(
    PEARSON,
    POS
  );

  await until(S(38));
  await play(
    ...fadeAll([
      bikesPanel,
      wheelsPanel,
      unitChangeTag,
      sameResultTag
    ]),

    ...revealAll([
      ...exampleBase,
      ...actualSmallDots,
      actualTag,
      rScale,
      rMarkerActual
    ]),

    new M.Create(actualSmallLine),

    ...say('COMPARE STRAIGHT-LINE PATTERNS IN DIFFERENT UNITS', POS),

    ...fbox([
      ['covariance depends on units', XC],
      ['Pearson removes those units', POS],
      ['compare straight-line strength', C.ink]
    ], POS)
  );

  rMarker = rMarkerActual;

  // ------------------------------------------------------------
  // 39-40: a small correlation does not mean no pattern.
  //
  // Symmetrical U-shaped illustrative data:
  // The paired horizontal deviations cancel.
  // Pearson r = 0 exactly, despite a clear curved pattern.
  // ------------------------------------------------------------

  const CURVED = [
    [5, 65],
    [10, 40],
    [15, 20],
    [20, 10],
    [25, 20],
    [30, 40],
    [35, 65]
  ];

  const curvedR = correlation(CURVED);

  const curvedDots = CURVED.map(
    ([x, y]) => exampleDot(x, y, YC)
  );

  const zeroQuestion = numberTag(
    'r ≈ 0: NO PATTERN?',
    [
      (EX_LEFT + EX_RIGHT) / 2,
      (EX_BOTTOM + EX_TOP) / 2,
      0
    ],
    NEG,
    18
  );

  const curveExampleTag = numberTag(
    'ILLUSTRATIVE PATTERN',
    [
      EX_RIGHT - 1.25,
      EX_TOP + 0.27,
      0
    ],
    XC,
    14
  );

  await until(S(39));
  await play(
    ...fadeAll([
      ...actualSmallDots,
      actualSmallLine,
      actualTag
    ]),

    new M.FadeIn(curveExampleTag),
    new M.FadeIn(zeroQuestion),

    moveCorrelationMarker(0, ZERO),

    ...say('COMMON TRAP: NEAR ZERO MEANS NO PATTERN', NEG),

    ...fbox([
      ['a small Pearson correlation', ZERO],
      ['does not rule out every pattern', NEG],
      ['it measures straight lines', C.ink]
    ], NEG)
  );

  // The U-shape is shown by dots alone, rather than inventing
  // a continuous set of observations between recorded points.
  await until(S(40));
  await play(
    new M.FadeOut(zeroQuestion),

    new M.LaggedStart(
      curvedDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.12,
        runTime: 1.45
      }
    ),

    moveCorrelationMarker(
      curvedR,
      ZERO
    ),

    ...say('A CURVED PATTERN CAN HAVE r = 0', NEG),

    ...fbox([
      ['illustrative curved pattern', YC],
      ['Pearson r = 0', ZERO],
      ['clear pattern, not a straight line', NEG],
      ['always check the dots', C.green]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 41: final definition.
  //
  // Return to the original six recorded hours.
  // Keep the straight-line guide and correlation scale visible.
  // ------------------------------------------------------------

  const finalDots = DATA.map(
    ([x, y]) => exampleDot(x, y)
  );

  const finalFit = dashed(
    exy(5, predictedY(5)),
    exy(35, predictedY(35)),
    POS
  );

  const finalActualTag = numberTag(
    'OUR SIX DRY HOURS',
    [
      EX_RIGHT - 1.10,
      EX_TOP + 0.27,
      0
    ],
    YC,
    14
  );

  const finalRTag = numberTag(
    'r ≈ +0.996',
    [
      EX_RIGHT - 0.95,
      EX_BOTTOM + 0.39,
      0
    ],
    POS,
    18
  );

  const negativeScaleLabel = textAt(
    'Falling',
    P ? 16 : 14,
    NEG,
    [
      R(-1),
      SCALE_Y - (P ? 0.78 : 0.65),
      0
    ]
  );

  const zeroScaleLabel = textAt(
    'Little linear pattern',
    P ? 15 : 14,
    C.muted,
    [
      R(0),
      SCALE_Y - (P ? 0.78 : 0.65),
      0
    ]
  );

  const positiveScaleLabel = textAt(
    'Rising',
    P ? 16 : 14,
    POS,
    [
      R(1),
      SCALE_Y - (P ? 0.78 : 0.65),
      0
    ]
  );

  await until(S(41));
  await play(
    ...fadeAll([
      ...curvedDots,
      curveExampleTag
    ]),

    new M.Create(finalFit),

    ...revealAll([
      ...finalDots,
      finalActualTag,
      finalRTag,
      negativeScaleLabel,
      zeroScaleLabel,
      positiveScaleLabel
    ]),

    moveCorrelationMarker(
      PEARSON,
      POS
    ),

    ...say('PEARSON CORRELATION: FROM −1 TO +1', POS),

    ...fbox([
      ['PEARSON CORRELATION', POS],
      ['−1: perfect falling line', NEG],
      [' 0: little linear association', ZERO],
      ['+1: perfect rising line', POS],
      ['our data: r ≈ +0.996', YC]
    ], POS)
  );
}
