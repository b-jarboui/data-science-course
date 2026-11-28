// lesson 2.2.8
// Spearman rank correlation: comparing the order of two measurements.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the exact shared chapter data:
// Temperature: 0, 5, 10, 15, 20, 25, 30 °C
// Rentals:     2, 10, 30, 45, 52, 55, 56
//
// Pearson correlation on the original measurements ≈ 0.95.
// Spearman rank correlation = 1 exactly.
//
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
    [0, 2],
    [5, 10],
    [10, 30],
    [15, 45],
    [20, 52],
    [25, 55],
    [30, 56]
  ];

  const COUNT = DATA.length;

  const TEMPS = DATA.map(([x, y]) => x);
  const RENTALS = DATA.map(([x, y]) => y);

  // Letters identify the same observed hour in both ordered lists.
  // They are identifiers, not times of day.
  const IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  // No tied values occur in this dataset.
  function ranks(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    return values.map(v => sorted.indexOf(v) + 1);
  }

  const RX = ranks(TEMPS);
  const RY = ranks(RENTALS);

  const RANK_DATA = DATA.map(
    (_, k) => [RX[k], RY[k]]
  );

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

  const PEARSON = correlation(DATA);
  const SPEARMAN = correlation(RANK_DATA);

  const XC = C.amber;
  const YC = C.cyan;
  const RC = C.green;
  const WARN = C.violet;

  // ------------------------------------------------------------
  // Laptop and phone layouts.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.20;

  const PILL = P
    ? [0, 2.35, 0]
    : [CX, 1.92, 0];

  const BOXP = P
    ? [0, 3.48, 0]
    : [4.45, -0.15, 0];

  const XL = P ? -3.00 : -5.80;
  const XR = P ? 3.30 : 1.65;

  const YB = P ? -4.05 : -2.05;
  const YT = P ? 1.25 : 1.13;

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

  function tag(s, p, color = RC, size = 16) {
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
  //
  // Original chart:
  //   x = temperature
  //   y = bike rentals
  //
  // Rank chart:
  //   x = temperature rank
  //   y = rental rank
  // ------------------------------------------------------------

  function makePlot({
    xmax,
    ymax,
    xticks,
    yticks,
    xtitle,
    ytitle,
    xcolor = XC,
    ycolor = YC
  }) {
    const X = n =>
      XL + n / xmax * (XR - XL);

    const Y = n =>
      YB + n / ymax * (YT - YB);

    const xy = (x, y) => [
      X(x),
      Y(y),
      0
    ];

    const gridLines = [];

    xticks.filter(n => n > 0).forEach(n => {
      gridLines.push(line(
        xy(n, 0),
        xy(n, ymax),
        C.card,
        1.5
      ));
    });

    yticks.filter(n => n > 0).forEach(n => {
      gridLines.push(line(
        xy(0, n),
        xy(xmax, n),
        C.card,
        1.5
      ));
    });

    const grid = new M.VGroup(...gridLines);

    const xAxis = line(
      xy(0, 0),
      xy(xmax, 0),
      C.muted,
      3
    );

    const yAxis = line(
      xy(0, 0),
      xy(0, ymax),
      C.muted,
      3
    );

    const xTicks = xticks.map(n => {
      const mark = line(
        [X(n), YB - 0.075, 0],
        [X(n), YB + 0.075, 0],
        C.muted,
        2
      );

      const label = textAt(
        String(n),
        P ? 17 : 16,
        C.muted,
        [X(n), YB - 0.28, 0],
        true
      );

      return new M.VGroup(mark, label);
    });

    const yTicks = yticks.map(n => {
      const mark = line(
        [XL - 0.075, Y(n), 0],
        [XL + 0.075, Y(n), 0],
        C.muted,
        2
      );

      const label = textAt(
        String(n),
        P ? 17 : 16,
        C.muted,
        [XL - 0.36, Y(n), 0],
        true
      );

      return new M.VGroup(mark, label);
    });

    const xTitle = textAt(
      xtitle,
      P ? 19 : 18,
      xcolor,
      [
        (XL + XR) / 2,
        YB - 0.70,
        0
      ]
    );

    const yTitle = textAt(
      ytitle,
      P ? 19 : 18,
      ycolor,
      [
        XL + 1.05,
        YT + 0.31,
        0
      ]
    );

    const xRuler = new M.VGroup(
      ...xTicks,
      xTitle
    );

    const yRuler = new M.VGroup(
      ...yTicks,
      yTitle
    );

    return {
      X,
      Y,
      xy,
      grid,
      xAxis,
      yAxis,
      xRuler,
      yRuler,

      objects: [
        grid,
        xAxis,
        yAxis,
        xRuler,
        yRuler
      ]
    };
  }

  const original = makePlot({
    xmax: 32,
    ymax: 65,
    xticks: [0, 5, 10, 15, 20, 25, 30],
    yticks: [10, 20, 30, 40, 50, 60],
    xtitle: 'Temperature (°C)',
    ytitle: 'Bikes rented'
  });

  const ranked = makePlot({
    xmax: 8,
    ymax: 8,
    xticks: [1, 2, 3, 4, 5, 6, 7],
    yticks: [1, 2, 3, 4, 5, 6, 7],
    xtitle: 'Temperature rank',
    ytitle: 'Rental rank'
  });

  // ------------------------------------------------------------
  // Glowing dots.
  // Each dot represents the same hour in both charts.
  // ------------------------------------------------------------

  function glowingDot(p, color = YC) {
    const halo = new M.Dot({
      point: p,
      radius: P ? 0.22 : 0.20,
      color
    });

    halo.setFill(color, 0.14);

    const middle = new M.Dot({
      point: p,
      radius: P ? 0.135 : 0.13,
      color
    });

    middle.setFill(color, 0.35);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.085 : 0.08,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(
      halo,
      middle,
      core
    );
  }

  const originalDots = DATA.map(
    ([x, y]) => glowingDot(original.xy(x, y))
  );

  const rankDots = RANK_DATA.map(
    ([x, y]) => glowingDot(ranked.xy(x, y))
  );

  function ringAt(
    p,
    color = XC,
    radius = 0.23
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);

    return r;
  }

  function originalRing(k, color = XC) {
    return ringAt(
      original.xy(...DATA[k]),
      color
    );
  }

  function rankRing(k, color = RC) {
    return ringAt(
      ranked.xy(...RANK_DATA[k]),
      color
    );
  }

  // ------------------------------------------------------------
  // 0-2: introduce the question and the original scatterplot.
  // ------------------------------------------------------------

  function thermometer(cx, cy, color, level) {
    const tube = new M.RoundedRectangle({
      width: 0.36,
      height: 1.80,
      cornerRadius: 0.17,
      color: C.muted,
      strokeWidth: 2
    });

    tube.setFill(C.card, 0.95);
    tube.moveTo([cx, cy + 0.15, 0]);

    const bulb = new M.Circle({
      radius: 0.28,
      color,
      strokeWidth: 2
    });

    bulb.setFill(color, 0.85);
    bulb.moveTo([cx, cy - 0.80, 0]);

    const fillHeight = 1.45 * level;

    const fill = new M.Rectangle({
      width: 0.16,
      height: fillHeight,
      color,
      strokeWidth: 1
    });

    fill.setFill(color, 0.95);

    fill.moveTo([
      cx,
      cy - 0.58 + fillHeight / 2,
      0
    ]);

    const ticks = Array.from(
      { length: 5 },
      (_, k) => {
        const y = cy - 0.40 + k * 0.30;

        return line(
          [cx + 0.22, y, 0],
          [cx + 0.37, y, 0],
          C.muted,
          2
        );
      }
    );

    return new M.VGroup(
      tube,
      fill,
      bulb,
      ...ticks
    );
  }

  function bike(cx, cy, scale = 1, color = YC) {
    const p = (x, y) => [
      cx + x * scale,
      cy + y * scale,
      0
    ];

    const wheels = [-0.85, 0.85].map(x => {
      const w = new M.Circle({
        radius: 0.47 * scale,
        color,
        strokeWidth: 3
      });

      w.moveTo(p(x, -0.20));

      return w;
    });

    const frame = [
      [-0.85, -0.20, -0.35, 0.54],
      [-0.35, 0.54, 0.05, -0.20],
      [0.05, -0.20, -0.85, -0.20],
      [-0.35, 0.54, 0.57, 0.54],
      [0.57, 0.54, 0.05, -0.20],
      [0.57, 0.54, 0.85, -0.20],
      [0.57, 0.54, 0.45, 0.90],
      [0.45, 0.90, 0.78, 0.90],
      [-0.35, 0.54, -0.47, 0.77],
      [-0.68, 0.77, -0.26, 0.77]
    ].map(([x1, y1, x2, y2]) =>
      line(
        p(x1, y1),
        p(x2, y2),
        color,
        3
      )
    );

    return new M.VGroup(...wheels, ...frame);
  }

  const introY = P ? -1.30 : -0.35;

  const coolThermometer = thermometer(
    CX - 2.25,
    introY,
    YC,
    0.25
  );

  const warmThermometer = thermometer(
    CX + 2.25,
    introY,
    XC,
    0.95
  );

  const bicycle = bike(
    CX,
    introY - 0.12,
    P ? 0.95 : 0.90
  );

  const coolLabel = textAt(
    'COOLER',
    17,
    YC,
    [CX - 2.25, introY - 1.35, 0]
  );

  const warmLabel = textAt(
    'WARMER',
    17,
    XC,
    [CX + 2.25, introY - 1.35, 0]
  );

  const introObjects = [
    coolThermometer,
    warmThermometer,
    bicycle,
    coolLabel,
    warmLabel
  ];

  if (P) {
    [coolThermometer, warmThermometer].forEach(o => o.scale(1.35));
    bicycle.scale(1.2);
    coolThermometer.shift([-0.75, 0, 0]);
    warmThermometer.shift([0.75, 0, 0]);
    coolLabel.moveTo([CX - 3.0, introY - 1.9, 0]);
    warmLabel.moveTo([CX + 3.0, introY - 1.9, 0]);
  }

  await until(S(0));
  await play(
    ...revealAll(introObjects),

    ...say('COOLER AND WARMER HOURS'),

    ...fbox([
      ['bike station', C.muted],
      ['temperature', XC],
      ['bike rentals', YC]
    ])
  );

  await until(S(1));
  await play(
    new M.Indicate(warmThermometer, {
      color: XC
    }),

    ...say('DO RENTALS KEEP RISING?', XC),

    ...fbox([
      ['temperature keeps rising', XC],
      ['rentals may rise more slowly', YC],
      ['does the order still agree?', RC]
    ], XC)
  );

  await until(S(2));
  await play(
    ...fadeAll(introObjects),

    ...revealAll(original.objects),

    ...say('ONE DOT = ONE HOUR'),

    ...fbox([
      ['across: temperature', XC],
      ['up: bikes rented', YC],
      ['one pair per observation', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // 3-9: place all seven original observations.
  //
  // Keep only the current numerical label visible.
  // Earlier observations remain on the chart.
  // ------------------------------------------------------------

  let activeOriginalLabel = null;

  function originalPointLabel(k) {
    const [x, y] = DATA[k];

    const px =
      original.X(x) +
      (x >= 25 ? -0.38 : x === 0 ? 0.48 : 0);

    const py =
      original.Y(y) +
      (y >= 50 ? -0.36 : 0.36);

    return textAt(
      `${y}`,
      P ? 18 : 18,
      YC,
      [px, py, 0],
      true
    );
  }

  function placeOriginal(k) {
    const a = [];

    if (activeOriginalLabel) {
      a.push(
        new M.FadeOut(activeOriginalLabel)
      );
    }

    const [x, y] = DATA[k];

    activeOriginalLabel = originalPointLabel(k);

    a.push(
      new M.FadeIn(originalDots[k]),

      new M.FadeIn(activeOriginalLabel),

      new M.Flash(
        originalDots[k].submobjects[2],
        { color: YC }
      ),

      ...say(`${x} °C → ${y} RENTALS`),

      ...fbox([
        [`HOUR ${IDS[k]}`, C.muted],
        [`${x} °C`, XC],
        [`${y} bikes rented`, YC]
      ])
    );

    return a;
  }

  await until(S(3));
  await play(...placeOriginal(0));

  await until(S(4));
  await play(...placeOriginal(1));

  await until(S(5));
  await play(...placeOriginal(2));

  await until(S(6));
  await play(...placeOriginal(3));

  await until(S(7));
  await play(...placeOriginal(4));

  await until(S(8));
  await play(...placeOriginal(5));

  await until(S(9));
  await play(...placeOriginal(6));

  // ------------------------------------------------------------
  // 10: reveal the rising but flattening pattern.
  //
  // The original observations are not joined by a straight line.
  // The shape is visible from the dots themselves.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    new M.FadeOut(activeOriginalLabel),

    indicateAll(
      originalDots,
      RC,
      1.55
    ),

    ...say('THE DOTS RISE, THEN FLATTEN', RC),

    ...fbox([
      ['cooler hours: large rises', XC],
      ['warmer hours: small rises', YC],
      ['still rising throughout', RC]
    ], RC)
  );

  activeOriginalLabel = null;

  // ------------------------------------------------------------
  // Jump helpers.
  //
  // The horizontal dashed guide and vertical coloured segment
  // show the change between two observed rental counts.
  // These are measurement guides, not extra observations.
  // ------------------------------------------------------------

  function jumpObjects(k1, k2, color = XC) {
    const [x1, y1] = DATA[k1];
    const [x2, y2] = DATA[k2];

    const horizontal = dashed(
      original.xy(x1, y1),
      original.xy(x2, y1),
      color
    );

    const vertical = line(
      original.xy(x2, y1),
      original.xy(x2, y2),
      color,
      4
    );

    const ring1 = originalRing(k1, color);
    const ring2 = originalRing(k2, color);

    const amount = y2 - y1;

    const label = textAt(
      `+${amount}`,
      P ? 19 : 18,
      color,
      [
        original.X(x2) +
          (k2 === COUNT - 1 ? -0.38 : 0.38),

        amount <= 2
          ? original.Y(y1) - 0.42
          : (
              original.Y(y1) +
              original.Y(y2)
            ) / 2,

        0
      ],
      true
    );

    return [
      horizontal,
      vertical,
      ring1,
      ring2,
      label
    ];
  }

  const earlyJump = jumpObjects(
    1,
    2,
    XC
  );

  const lateJump = jumpObjects(
    5,
    6,
    RC
  );

  // ------------------------------------------------------------
  // 11-12: compare one large rise with one very small rise.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...revealAll(earlyJump),

    ...say('EARLY JUMP: 10 TO 30 RENTALS', XC),

    ...fbox([
      ['5 °C → 10 °C', XC],
      ['10 → 30 rentals', YC],
      ['increase = 20 bikes', XC]
    ], XC)
  );

  await until(S(12));
  await play(
    ...revealAll(lateJump),

    ...say('LATE JUMP: ONLY ONE EXTRA RENTAL', RC),

    ...fbox([
      ['25 °C → 30 °C', XC],
      ['55 → 56 rentals', YC],
      ['increase = 1 bike', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 13-15: replace measurements with two ordered lists.
  //
  // Each row carries the same hour identifier in both lists.
  // No rank is displayed until its narration beat.
  // ------------------------------------------------------------

  const LIST_SP = P ? 3.20 : 3.65;

  const TEMP_CX = CX - LIST_SP / 2;
  const RENT_CX = CX + LIST_SP / 2;

  const ROW_W = P ? 2.58 : 2.95;
  const ROW_H = P ? 0.57 : 0.39;

  const ROW_STEP = P ? 0.70 : 0.46;
  const FIRST_ROW_Y = P ? 0.90 : 0.68;

  const rowY = k =>
    FIRST_ROW_Y - k * ROW_STEP;

  const HEADER_Y = P ? 1.72 : 1.46;

  function listHeader(
    title,
    subtitle,
    cx,
    color
  ) {
    const a = textAt(
      title,
      P ? 20 : 19,
      color,
      [cx, HEADER_Y, 0]
    );

    const b = textAt(
      subtitle,
      P ? 14 : 13,
      C.muted,
      [
        cx,
        HEADER_Y - 0.32,
        0
      ]
    );

    return new M.VGroup(a, b);
  }

  const tempHeader = listHeader(
    'TEMPERATURE',
    'Coldest → warmest',
    TEMP_CX,
    XC
  );

  const rentalHeader = listHeader(
    'RENTALS',
    'Fewest → most',
    RENT_CX,
    YC
  );

  function listRow(k, type) {
    const temp = type === 'temp';

    const cx = temp
      ? TEMP_CX
      : RENT_CX;

    const color = temp ? XC : YC;
    const y = rowY(k);

    const value = temp
      ? `${TEMPS[k]} °C`
      : `${RENTALS[k]} bikes`;

    const r = new M.RoundedRectangle({
      width: ROW_W,
      height: ROW_H,
      cornerRadius: 0.08,
      color,
      strokeWidth: 1.2
    });

    r.setFill(C.card, 0.92);
    r.moveTo([cx, y, 0]);

    const id = textAt(
      IDS[k],
      P ? 17 : 15,
      C.muted,
      [
        cx - ROW_W / 2 + 0.27,
        y,
        0
      ],
      true
    );

    const val = textAt(
      value,
      P ? 18 : 16,
      color,
      [cx - 0.04, y, 0],
      true
    );

    return new M.VGroup(
      r,
      id,
      val
    );
  }

  const tempOrder = DATA.map(
    (_, k) => k
  ).sort(
    (a, b) => TEMPS[a] - TEMPS[b]
  );

  const rentalOrder = DATA.map(
    (_, k) => k
  ).sort(
    (a, b) => RENTALS[a] - RENTALS[b]
  );

  // These orders happen to be identical in this dataset.
  const tempRows = tempOrder.map(k =>
    listRow(k, 'temp')
  );

  const rentalRows = rentalOrder.map(k =>
    listRow(k, 'rentals')
  );

  const emptyListNote = textAt(
    'Two ways to order the same hours',
    P ? 18 : 17,
    C.muted,
    [
      CX,
      P ? -0.75 : -0.35,
      0
    ]
  );

  const listBottomNote = textAt(
    'A–G identify the same seven hours',
    P ? 16 : 15,
    C.muted,
    [
      CX,
      rowY(6) - (P ? 0.65 : 0.44),
      0
    ]
  );

  await until(S(13));
  await play(
    ...fadeAll([
      ...original.objects,
      ...originalDots,
      ...earlyJump,
      ...lateJump
    ]),

    new M.FadeIn(tempHeader),
    new M.FadeIn(rentalHeader),
    new M.FadeIn(emptyListNote),

    ...say('THINK OF TWO ORDERED LISTS', RC),

    ...fbox([
      ['same seven hours', C.ink],
      ['one temperature list', XC],
      ['one rentals list', YC]
    ], RC)
  );

  await until(S(14));
  await play(
    new M.FadeOut(emptyListNote),

    new M.LaggedStart(
      tempRows.map(
        r => new M.FadeIn(r)
      ),
      {
        lagRatio: 0.11,
        runTime: 1.65
      }
    ),

    ...say('ORDER BY TEMPERATURE', XC),

    ...fbox([
      ['coldest first', XC],
      ['0, 5, 10, 15', C.ink],
      ['20, 25, 30', C.ink],
      ['warmest last', XC]
    ], XC)
  );

  await until(S(15));
  await play(
    new M.LaggedStart(
      rentalRows.map(
        r => new M.FadeIn(r)
      ),
      {
        lagRatio: 0.11,
        runTime: 1.65
      }
    ),

    new M.FadeIn(listBottomNote),

    ...say('ORDER BY RENTAL COUNT'),

    ...fbox([
      ['fewest first', YC],
      ['2, 10, 30, 45', C.ink],
      ['52, 55, 56', C.ink],
      ['most last', YC]
    ])
  );

  // ------------------------------------------------------------
  // Rank badges and matching-row helpers.
  // ------------------------------------------------------------

  function rankBadge(k, type) {
    const temp = type === 'temp';

    const cx = temp
      ? TEMP_CX
      : RENT_CX;

    const rank = temp
      ? RX[k]
      : RY[k];

    const x =
      cx + ROW_W / 2 - 0.29;

    const y = rowY(rank - 1);

    const circle = new M.Circle({
      radius: P ? 0.17 : 0.14,
      color: RC,
      strokeWidth: 1.5
    });

    circle.setFill(RC, 0.20);
    circle.moveTo([x, y, 0]);

    const value = textAt(
      String(rank),
      P ? 17 : 14,
      RC,
      [x, y, 0],
      true
    );

    return new M.VGroup(
      circle,
      value
    );
  }

  const tempRanks = DATA.map(
    (_, k) => rankBadge(k, 'temp')
  );

  const rentalRanks = DATA.map(
    (_, k) => rankBadge(k, 'rentals')
  );

  function singleRowOutline(k, type) {
    const temp = type === 'temp';

    const cx = temp
      ? TEMP_CX
      : RENT_CX;

    const rank = temp
      ? RX[k]
      : RY[k];

    return outline(
      [
        cx,
        rowY(rank - 1),
        0
      ],
      ROW_W + 0.10,
      ROW_H + 0.08,
      RC
    );
  }

  function matchingRowOutline(k) {
    return outline(
      [
        CX,
        rowY(RX[k] - 1),
        0
      ],
      LIST_SP + ROW_W + 0.10,
      ROW_H + 0.08,
      RC
    );
  }

  // ------------------------------------------------------------
  // 16-17: the coldest hour is first on both lists.
  // ------------------------------------------------------------

  const firstTempHighlight = singleRowOutline(
    0,
    'temp'
  );

  await until(S(16));
  await play(
    new M.Create(firstTempHighlight),

    new M.FadeIn(tempRanks[0]),

    ...say('0 °C COMES FIRST', XC),

    ...fbox([
      ['hour A', C.muted],
      ['temperature = 0 °C', XC],
      ['temperature place = 1', RC]
    ], RC)
  );

  const firstPairHighlight = matchingRowOutline(0);

  await until(S(17));
  await play(
    new M.FadeOut(firstTempHighlight),

    new M.Create(firstPairHighlight),

    new M.FadeIn(rentalRanks[0]),

    ...say('TWO RENTALS ALSO COMES FIRST'),

    ...fbox([
      ['same hour A', C.muted],
      ['temperature place = 1', XC],
      ['rental place      = 1', YC],
      ['matching places', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 18-19: the next two hours also have matching positions.
  // ------------------------------------------------------------

  const secondPairHighlight = matchingRowOutline(1);

  await until(S(18));
  await play(
    new M.FadeOut(firstPairHighlight),

    new M.Create(secondPairHighlight),

    new M.FadeIn(tempRanks[1]),
    new M.FadeIn(rentalRanks[1]),

    ...say('5 °C: SECOND ON BOTH LISTS', RC),

    ...fbox([
      ['hour B', C.muted],
      ['5 °C → place 2', XC],
      ['10 bikes → place 2', YC]
    ], RC)
  );

  const thirdPairHighlight = matchingRowOutline(2);

  await until(S(19));
  await play(
    new M.FadeOut(secondPairHighlight),

    new M.Create(thirdPairHighlight),

    new M.FadeIn(tempRanks[2]),
    new M.FadeIn(rentalRanks[2]),

    ...say('10 °C: THIRD ON BOTH LISTS', RC),

    ...fbox([
      ['hour C', C.muted],
      ['10 °C → place 3', XC],
      ['30 bikes → place 3', YC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 20: complete the rankings through seventh place.
  // ------------------------------------------------------------

  const remainingRankAnimations = [];

  for (let k = 3; k < COUNT; k++) {
    remainingRankAnimations.push(
      new M.LaggedStart(
        [
          new M.FadeIn(tempRanks[k]),
          new M.FadeIn(rentalRanks[k])
        ],
        {
          lagRatio: 0.05,
          runTime: 0.55
        }
      )
    );
  }

  const seventhPairHighlight = matchingRowOutline(6);

  await until(S(20));
  await play(
    new M.FadeOut(thirdPairHighlight),

    new M.LaggedStart(
      remainingRankAnimations,
      {
        lagRatio: 0.30,
        runTime: 2.20
      }
    ),

    new M.Create(seventhPairHighlight),

    ...say('30 °C: SEVENTH ON BOTH LISTS', RC),

    ...fbox([
      ['hour G', C.muted],
      ['30 °C → place 7', XC],
      ['56 bikes → place 7', YC],
      ['all seven places match', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 21: introduce the term rank.
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    new M.FadeOut(seventhPairHighlight),

    indicateAll(
      tempRanks,
      RC,
      1.25
    ),

    indicateAll(
      rentalRanks,
      RC,
      1.25
    ),

    ...say('RANK = PLACE IN AN ORDERED LIST', RC),

    ...fbox([
      ['RANK', RC],
      ['1 = first', C.ink],
      ['2 = second', C.ink],
      ['and so on', C.muted]
    ], RC)
  );

  // ------------------------------------------------------------
  // 22: keep the paired observations together.
  //
  // Connect each hour in the temperature list to that same
  // hour in the rentals list.
  //
  // Because the ranks match, every connection is horizontal.
  // ------------------------------------------------------------

  const matchLines = DATA.map((_, k) =>
    line(
      [
        TEMP_CX + ROW_W / 2 + 0.04,
        rowY(RX[k] - 1),
        0
      ],
      [
        RENT_CX - ROW_W / 2 - 0.04,
        rowY(RY[k] - 1),
        0
      ],
      RC,
      3
    )
  );

  const matchTag = tag(
    'SAME HOUR, TWO RANKS',
    [
      CX,
      P ? -4.55 : -2.57,
      0
    ],
    RC,
    P ? 16 : 15
  );

  await until(S(22));
  await play(
    new M.LaggedStart(
      matchLines.map(
        l => new M.Create(l)
      ),
      {
        lagRatio: 0.13,
        runTime: 1.65
      }
    ),

    new M.FadeIn(matchTag),

    ...say('MATCH THE RANKS OF THE SAME HOUR', RC),

    ...fbox([
      ['A: (1, 1)', RC],
      ['B: (2, 2)', RC],
      ['...'],
      ['G: (7, 7)', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 23: draw a new scatterplot using the paired ranks.
  //
  // The new coordinates are:
  // (1,1), (2,2), (3,3), (4,4),
  // (5,5), (6,6), (7,7).
  // ------------------------------------------------------------

  const listObjects = [
    tempHeader,
    rentalHeader,
    ...tempRows,
    ...rentalRows,
    ...tempRanks,
    ...rentalRanks,
    ...matchLines,
    matchTag,
    listBottomNote
  ];

  await until(S(23));
  await play(
    ...fadeAll(listObjects),

    ...revealAll(ranked.objects),

    new M.LaggedStart(
      rankDots.map(
        d => new M.FadeIn(d)
      ),
      {
        lagRatio: 0.15,
        runTime: 1.85
      }
    ),

    ...say('DRAW A NEW DOT FOR EACH PAIR OF RANKS', RC),

    ...fbox([
      ['across: temperature rank', XC],
      ['up: rental rank', YC],
      ['same seven hours', C.ink]
    ], RC)
  );

  // ------------------------------------------------------------
  // Rank-chart coordinate guides.
  // ------------------------------------------------------------

  function rankGuides(k, color = RC) {
    const [rx, ry] = RANK_DATA[k];

    const horizontal = dashed(
      ranked.xy(0, ry),
      ranked.xy(rx, ry),
      YC
    );

    const vertical = dashed(
      ranked.xy(rx, 0),
      ranked.xy(rx, ry),
      XC
    );

    const ring = rankRing(k, color);

    const label = tag(
      `(${rx}, ${ry})`,
      [
        ranked.X(rx) +
          (rx >= 6 ? -0.45 : 0.72),

        ranked.Y(ry) +
          (ry >= 6 ? -0.39 : -0.14),

        0
      ],
      color,
      16
    );

    return [
      horizontal,
      vertical,
      ring,
      label
    ];
  }

  // ------------------------------------------------------------
  // 24-25: read the first and last pairs of ranks.
  // ------------------------------------------------------------

  const firstRankGuides = rankGuides(0);

  await until(S(24));
  await play(
    ...revealAll(firstRankGuides),

    ...say('COLDEST HOUR: RANK 1 ACROSS, RANK 1 UP', RC),

    ...fbox([
      ['hour A', C.muted],
      ['original: (0, 2)', C.ink],
      ['ranks: (1, 1)', RC]
    ], RC)
  );

  const lastRankGuides = rankGuides(6);

  await until(S(25));
  await play(
    ...fadeAll(firstRankGuides),

    ...revealAll(lastRankGuides),

    ...say('WARMEST HOUR: RANK 7 ACROSS, RANK 7 UP', RC),

    ...fbox([
      ['hour G', C.muted],
      ['original: (30, 56)', C.ink],
      ['ranks: (7, 7)', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 26: the ranked dots form a perfect straight line.
  //
  // The straight line is a visual guide through the rank pairs,
  // not a line chart through time.
  // ------------------------------------------------------------

  const rankLine = line(
    ranked.xy(1, 1),
    ranked.xy(7, 7),
    RC,
    2.5
  );

  const rankLineTag = tag(
    'MATCHING RANKS',
    [
      ranked.X(5.65),
      ranked.Y(1.30),
      0
    ],
    RC,
    P ? 16 : 15
  );

  await until(S(26));
  await play(
    ...fadeAll(lastRankGuides),

    new M.Create(rankLine),

    new M.FadeIn(rankLineTag),

    indicateAll(
      rankDots,
      RC,
      1.40
    ),

    ...say('ALL THE RANK DOTS FORM A STRAIGHT LINE', RC),

    ...fbox([
      ['1 matches 1', RC],
      ['2 matches 2', RC],
      ['...'],
      ['7 matches 7', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 27-29: apply Pearson correlation to the ranks.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    new M.Indicate(rankLine, {
      color: RC
    }),

    ...say('USE PEARSON CORRELATION ON THE RANKS', RC),

    ...fbox([
      ['Pearson correlation', C.ink],
      ['measures straight lines', C.muted],
      ['apply it to rank pairs', RC]
    ], RC)
  );

  const perfectResult = tag(
    `r = +${SPEARMAN.toFixed(0)}`,
    [
      ranked.X(5.65),
      ranked.Y(2.45),
      0
    ],
    RC,
    25
  );

  await until(S(28));
  await play(
    new M.FadeIn(perfectResult),

    ...say('THE RESULT IS EXACTLY +1', RC),

    ...fbox([
      ['perfect rising line', RC],
      ['Pearson of the ranks', C.ink],
      ['= +1 exactly', RC]
    ], RC)
  );

  await until(S(29));
  await play(
    new M.Indicate(perfectResult, {
      color: RC
    }),

    ...say('SPEARMAN RANK CORRELATION', RC),

    ...fbox([
      ['SPEARMAN', RC],
      ['compares the ranks', C.ink],
      ['rank correlation = +1', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 30-31: the formula in words.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    ...say('THE RULE IN TWO STEPS', RC),

    ...fbox([
      ['STEP 1: replace by ranks', XC],
      ['STEP 2: use Pearson', RC]
    ], RC)
  );

  await until(S(31));
  await play(
    ...say('SPEARMAN = PEARSON OF THE RANKS', RC),

    ...fbox([
      ['Spearman correlation', RC],
      ['= Pearson correlation', C.ink],
      ['  of the two rank lists', XC],
      ['= +1 for these hours', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 32: compare with Pearson on the original measurements.
  // ------------------------------------------------------------

  const rankChartObjects = [
    ...ranked.objects,
    ...rankDots,
    rankLine,
    rankLineTag,
    perfectResult
  ];

  const originalPearsonTag = tag(
    `PEARSON ≈ ${PEARSON.toFixed(2)}`,
    [
      original.X(22),
      original.Y(10),
      0
    ],
    XC,
    P ? 18 : 17
  );

  const originalSpearmanTag = tag(
    'SPEARMAN = +1',
    [
      original.X(22),
      original.Y(3),
      0
    ],
    RC,
    P ? 18 : 17
  );

  await until(S(32));
  await play(
    ...fadeAll(rankChartObjects),

    ...revealAll(original.objects),
    ...revealAll(originalDots),

    new M.FadeIn(originalPearsonTag),
    new M.FadeIn(originalSpearmanTag),

    ...say('ORIGINAL DOTS: PEARSON ≈ 0.95', XC),

    ...fbox([
      [
        `Pearson ≈ ${PEARSON.toFixed(2)}`,
        XC
      ],
      ['original measurements', C.muted],
      ['Spearman = +1', RC],
      ['ordered ranks', C.muted]
    ], RC)
  );

  // ------------------------------------------------------------
  // 33: a small rise preserves the order just as well
  // as a large rise.
  // ------------------------------------------------------------

  const earlyJump2 = jumpObjects(
    1,
    2,
    XC
  );

  const lateJump2 = jumpObjects(
    5,
    6,
    RC
  );

  await until(S(33));
  await play(
    new M.FadeOut(originalPearsonTag),
    new M.FadeOut(originalSpearmanTag),

    ...revealAll(earlyJump2),
    ...revealAll(lateJump2),

    ...say('BIG RISE OR SMALL RISE: SAME ORDER', RC),

    ...fbox([
      ['10 → 30: +20 bikes', XC],
      ['55 → 56: +1 bike', YC],
      ['both rise', RC],
      ['both move up one rank', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 34: use ranks to see a steady rising or falling tendency.
  //
  // Return to the rank chart for the actual rising example.
  // The falling case is described in words rather than
  // inventing new bike-station observations.
  // ------------------------------------------------------------

  const finalRankLine = line(
    ranked.xy(1, 1),
    ranked.xy(7, 7),
    RC,
    2.5
  );

  const rankDirectionTag = tag(
    'ORDER PRESERVED',
    [
      ranked.X(5.50),
      ranked.Y(1.40),
      0
    ],
    RC,
    17
  );

  const rankResultAgain = tag(
    'SPEARMAN = +1',
    [
      ranked.X(5.50),
      ranked.Y(2.55),
      0
    ],
    RC,
    19
  );

  await until(S(34));
  await play(
    ...fadeAll([
      ...original.objects,
      ...originalDots,
      ...earlyJump2,
      ...lateJump2
    ]),

    ...revealAll(ranked.objects),
    ...revealAll(rankDots),

    new M.Create(finalRankLine),

    new M.FadeIn(rankDirectionTag),
    new M.FadeIn(rankResultAgain),

    ...say('USE RANKS TO SEE WHICH WAY THE ORDER GOES', RC),

    ...fbox([
      ['same order: positive', RC],
      ['opposite order: negative', WARN],
      ['our hours: same order', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 35: perfect rank agreement does not imply equal jumps.
  //
  // Highlight two adjacent pairs of ranks. Both move from
  // one place to the next, even though their original rental
  // differences were 20 and 1 respectively.
  // ------------------------------------------------------------

  function rankStep(k1, k2, color = XC) {
    const [x1, y1] = RANK_DATA[k1];
    const [x2, y2] = RANK_DATA[k2];

    const h = line(
      ranked.xy(x1, y1),
      ranked.xy(x2, y1),
      color,
      3
    );

    const v = line(
      ranked.xy(x2, y1),
      ranked.xy(x2, y2),
      color,
      3
    );

    const label = textAt(
      '+1 rank',
      P ? 16 : 15,
      color,
      [
        (
          ranked.X(x1) +
          ranked.X(x2)
        ) / 2,

        ranked.Y(y1) - 0.30,

        0
      ]
    );

    return [
      h,
      v,
      label
    ];
  }

  const earlyRankStep = rankStep(
    1,
    2,
    XC
  );

  const lateRankStep = rankStep(
    5,
    6,
    YC
  );

  await until(S(35));
  await play(
    ...revealAll(earlyRankStep),
    ...revealAll(lateRankStep),

    ...say('COMMON TRAP: +1 DOES NOT MEAN EQUAL JUMPS', WARN),

    ...fbox([
      ['rank 2 → rank 3', XC],
      ['rank 6 → rank 7', YC],
      ['one rank step each', RC],
      ['not equal rental increases', WARN]
    ], WARN)
  );

  // ------------------------------------------------------------
  // 36: return to the original measurements.
  // The unequal rental jumps become visible again.
  // ------------------------------------------------------------

  const earlyJump3 = jumpObjects(
    1,
    2,
    XC
  );

  const lateJump3 = jumpObjects(
    5,
    6,
    RC
  );

  await until(S(36));
  await play(
    ...fadeAll([
      ...ranked.objects,
      ...rankDots,
      finalRankLine,
      rankDirectionTag,
      rankResultAgain,
      ...earlyRankStep,
      ...lateRankStep
    ]),

    ...revealAll(original.objects),
    ...revealAll(originalDots),

    ...revealAll(earlyJump3),
    ...revealAll(lateJump3),

    ...say('THE ORIGINAL JUMPS ARE VERY DIFFERENT', XC),

    ...fbox([
      ['early rise = 20 bikes', XC],
      ['late rise  = 1 bike', YC],
      ['20 is not 1', WARN],
      ['but the order still agrees', RC]
    ], RC)
  );

  // ------------------------------------------------------------
  // 37: final definition.
  //
  // Leave the original curved scatterplot visible.
  // Add the two correlation results for comparison.
  // ------------------------------------------------------------

  const finalPearsonTag = tag(
    `PEARSON ≈ ${PEARSON.toFixed(2)}`,
    [
      original.X(22),
      original.Y(12),
      0
    ],
    XC,
    P ? 18 : 17
  );

  const finalSpearmanTag = tag(
    'SPEARMAN = +1',
    [
      original.X(22),
      original.Y(4),
      0
    ],
    RC,
    P ? 19 : 18
  );

  await until(S(37));
  await play(
    ...fadeAll([
      ...earlyJump3,
      ...lateJump3
    ]),

    new M.FadeIn(finalPearsonTag),
    new M.FadeIn(finalSpearmanTag),

    indicateAll(
      originalDots,
      RC,
      1.70
    ),

    ...say('SPEARMAN COMPARES ORDER, EVEN ON A CURVE', RC),

    ...fbox([
      ['SPEARMAN CORRELATION', RC],
      ['replace values with ranks', XC],
      ['apply Pearson to the ranks', C.ink],
      ['captures a steady curved rise', YC],
      ['our rank correlation = +1', RC]
    ], RC)
  );
}
