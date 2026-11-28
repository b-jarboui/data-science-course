// lesson 2.2.9
// Simpson's paradox: an overall pattern can reverse when data
// are separated into groups.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the exact shared chapter data:
// Weekday mornings: (8, 40), (10, 38), (12, 36).
// Weekend hours:    (20, 70), (22, 68), (24, 66).
//
// Pearson correlation:
// All six hours together: approximately +0.93.
// Weekday mornings alone: -1.
// Weekend hours alone:    -1.
//
// Trend lines are descriptive guides, not additional observations.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const WEEKDAY = [
    [8, 40],
    [10, 38],
    [12, 36]
  ];

  const WEEKEND = [
    [20, 70],
    [22, 68],
    [24, 66]
  ];

  const DATA = [
    ...WEEKDAY,
    ...WEEKEND
  ];

  const WD = C.amber;
  const WE = C.pink || '#F472B6';

  const ALL = C.cyan;
  const POS = C.green;
  const NEG = C.violet;

  function pearson(data) {
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

  const R_ALL = pearson(DATA);
  const R_WEEKDAY = pearson(WEEKDAY);
  const R_WEEKEND = pearson(WEEKEND);

  function signed(n, digits = 2) {
    if (n > 0) return `+${n.toFixed(digits)}`;
    if (n < 0) return `−${Math.abs(n).toFixed(digits)}`;
    return '0';
  }

  // ------------------------------------------------------------
  // Laptop and phone layouts.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.20;

  const PILL = P
    ? [0, 2.30, 0]
    : [CX, 1.94, 0];

  const BOXP = P
    ? [0, 3.50, 0]
    : [4.45, -0.15, 0];

  const XL = P ? -3.00 : -5.80;
  const XR = P ? 3.30 : 1.65;

  const YB = P ? -4.05 : -2.05;
  const YT = P ? 1.20 : 1.15;

  const XMAX = 30;
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

  function dashed(a, b, color = C.muted, width = 2) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function outline(p, w, h, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
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

  function indicateAll(objects, color, duration = 1.35) {
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

  function tag(s, p, color = ALL, size = 16) {
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
  // Introductory bicycle and thermometer icons.
  // ------------------------------------------------------------

  function bike(cx, cy, scale = 1, color = ALL) {
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
        3.5
      )
    );

    const crank = new M.Circle({
      radius: 0.11 * scale,
      color,
      strokeWidth: 2
    });

    crank.moveTo(p(0.05, -0.20));

    return new M.VGroup(
      ...wheels,
      ...frame,
      crank
    );
  }

  function thermometer(cx, cy, color = WD) {
    const tube = new M.RoundedRectangle({
      width: 0.38,
      height: 1.85,
      cornerRadius: 0.17,
      color: C.muted,
      strokeWidth: 2
    });

    tube.setFill(C.card, 0.95);
    tube.moveTo([cx, cy + 0.15, 0]);

    const fill = new M.Rectangle({
      width: 0.16,
      height: 1.20,
      color,
      strokeWidth: 1
    });

    fill.setFill(color, 0.95);
    fill.moveTo([cx, cy + 0.02, 0]);

    const bulb = new M.Circle({
      radius: 0.28,
      color,
      strokeWidth: 2
    });

    bulb.setFill(color, 0.90);
    bulb.moveTo([cx, cy - 0.76, 0]);

    const ticks = Array.from(
      { length: 5 },
      (_, k) => {
        const y = cy - 0.35 + k * 0.30;

        return line(
          [cx + 0.22, y, 0],
          [cx + 0.38, y, 0],
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

  const introY = P ? -0.55 : -0.35;

  const bicycle = bike(
    CX - 1.25,
    introY,
    P ? 1.15 : 1.10
  );

  const thermometerIcon = thermometer(
    CX + 1.70,
    introY + 0.15,
    WD
  );

  const introNote = textAt(
    'Temperature and bike rentals',
    P ? 21 : 20,
    C.ink,
    [
      CX,
      introY - 1.55,
      0
    ]
  );

  // ------------------------------------------------------------
  // 0: introduce the practical question.
  // ------------------------------------------------------------

  await until(S(0));
  await play(
    new M.FadeIn(bicycle),
    new M.FadeIn(thermometerIcon),
    new M.FadeIn(introNote),

    ...say('HOW DO RENTALS CHANGE WITH TEMPERATURE?'),

    ...fbox([
      ['bike station', C.muted],
      ['temperature', WD],
      ['number of rentals', ALL]
    ])
  );

  // ------------------------------------------------------------
  // 1: six recorded hours from two kinds of days.
  //
  // Keep all six record cards neutral at first.
  // Their group identities are revealed later.
  // ------------------------------------------------------------

  function recordCard(k) {
    const col = k % 3;
    const row = Math.floor(k / 3);

    const x = CX + (col - 1) * (
      P ? 1.65 : 1.75
    );

    const y = P
      ? 0.45 - row * 1.60
      : 0.50 - row * 1.40;

    const r = new M.RoundedRectangle({
      width: P ? 1.38 : 1.45,
      height: 1.05,
      cornerRadius: 0.13,
      color: ALL,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);

    const hour = textAt(
      `Hour ${k + 1}`,
      P ? 16 : 16,
      C.muted,
      [x, y + 0.24, 0],
      true
    );

    const d = new M.Dot({
      point: [x, y - 0.16, 0],
      radius: 0.10,
      color: ALL
    });

    d.setFill(ALL, 1);

    return new M.VGroup(r, hour, d);
  }

  const records = DATA.map(
    (_, k) => recordCard(k)
  );

  const recordsNote = textAt(
    'Six hours · two kinds of days',
    P ? 20 : 19,
    C.muted,
    [
      CX,
      P ? -2.15 : -1.80,
      0
    ]
  );

  await until(S(1));
  await play(
    ...fadeAll([
      bicycle,
      thermometerIcon,
      introNote
    ]),

    new M.LaggedStart(
      records.map(r => new M.FadeIn(r)),
      {
        lagRatio: 0.12,
        runTime: 1.35
      }
    ),

    new M.FadeIn(recordsNote),

    ...say('SIX RECORDED HOURS'),

    ...fbox([
      ['6 observations', ALL],
      ['2 kinds of days', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // Scatterplot construction.
  // Use one fixed scale throughout the lesson.
  // ------------------------------------------------------------

  const XTICKS = [0, 5, 10, 15, 20, 25, 30];
  const YTICKS = [20, 40, 60, 80];

  const gridLines = [];

  XTICKS.filter(n => n > 0).forEach(n => {
    gridLines.push(line(
      xy(n, 0),
      xy(n, YMAX),
      C.card,
      1.4
    ));
  });

  for (let n = 10; n <= YMAX; n += 10) {
    gridLines.push(line(
      xy(0, n),
      xy(XMAX, n),
      C.card,
      n % 20 === 0 ? 1.5 : 1
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
      P ? 17 : 16,
      C.muted,
      [X(n), YB - 0.28, 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const xTitle = textAt(
    'Temperature (°C)',
    P ? 20 : 19,
    C.ink,
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

  const yTicks = YTICKS.map(n => {
    const mark = line(
      [XL - 0.075, Y(n), 0],
      [XL + 0.075, Y(n), 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(n),
      P ? 17 : 17,
      C.muted,
      [XL - 0.36, Y(n), 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const yTitle = textAt(
    'Bikes rented',
    P ? 20 : 19,
    C.ink,
    [
      XL + 0.95,
      YT + 0.31,
      0
    ]
  );

  const yRuler = new M.VGroup(
    ...yTicks,
    yTitle
  );

  const plotBase = [
    grid,
    xAxis,
    yAxis,
    xRuler,
    yRuler
  ];

  // ------------------------------------------------------------
  // 2: show the two rulers.
  // ------------------------------------------------------------

  await until(S(2));
  await play(
    ...fadeAll([
      ...records,
      recordsNote
    ]),

    new M.FadeIn(grid),
    new M.Create(xAxis),
    new M.Create(yAxis),
    new M.FadeIn(xRuler),
    new M.FadeIn(yRuler),

    ...say('TEMPERATURE ACROSS, RENTALS UP'),

    ...fbox([
      ['across: temperature °C', C.ink],
      ['up: bikes rented', ALL],
      ['one dot per hour', C.muted]
    ])
  );

  // ------------------------------------------------------------
  // Glowing data marks.
  //
  // The same six dot objects are retained throughout.
  // Recolouring never changes their recorded coordinates.
  // ------------------------------------------------------------

  function glowingDot(p, color = ALL, opacity = 1) {
    const halo = new M.Dot({
      point: p,
      radius: P ? 0.17 : 0.16,
      color
    });

    halo.setFill(color, 0.16 * opacity);

    const middle = new M.Dot({
      point: p,
      radius: P ? 0.115 : 0.105,
      color
    });

    middle.setFill(color, 0.36 * opacity);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.075 : 0.075,
      color
    });

    core.setFill(color, opacity);

    return new M.VGroup(
      halo,
      middle,
      core
    );
  }

  const dots = DATA.map(
    ([x, y]) => glowingDot(xy(x, y))
  );

  const weekdayDots = dots.slice(0, 3);
  const weekendDots = dots.slice(3, 6);

  function recolourDot(k, color, opacity = 1) {
    return new M.Transform(
      dots[k],
      glowingDot(
        xy(...DATA[k]),
        color,
        opacity
      )
    );
  }

  function recolourGroup(indices, color, opacity = 1) {
    return indices.map(k =>
      recolourDot(k, color, opacity)
    );
  }

  function ringAt(p, color = WD, radius = 0.20) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function dotRing(k, color = WD) {
    return ringAt(
      xy(...DATA[k]),
      color
    );
  }

  let activeGuides = [];

  function clearGuides() {
    const a = fadeAll(activeGuides);
    activeGuides = [];
    return a;
  }

  function observationGuides(k) {
    const [x, y] = DATA[k];

    const horizontal = dashed(
      xy(0, y),
      xy(x, y),
      ALL
    );

    const vertical = dashed(
      xy(x, 0),
      xy(x, y),
      ALL
    );

    const label = textAt(
      String(y),
      P ? 19 : 18,
      ALL,
      [
        X(x),
        Y(y) + 0.32,
        0
      ],
      true
    );

    activeGuides = [
      horizontal,
      vertical,
      label
    ];

    return [
      new M.Create(horizontal),
      new M.Create(vertical),
      new M.FadeIn(label)
    ];
  }

  function placeObservation(k) {
    const [x, y] = DATA[k];

    return [
      ...clearGuides(),

      new M.FadeIn(dots[k]),

      ...observationGuides(k),

      new M.Flash(
        dots[k].submobjects[2],
        { color: ALL }
      ),

      ...say(`${x} °C → ${y} RENTALS`),

      ...fbox([
        [`hour ${k + 1}`, C.muted],
        [`temperature = ${x} °C`, C.ink],
        [`rentals = ${y}`, ALL]
      ])
    ];
  }

  // ------------------------------------------------------------
  // 3-8: place the six observations.
  //
  // All dots initially share the same colour so the learner
  // first sees the combined pattern.
  // ------------------------------------------------------------

  await until(S(3));
  await play(...placeObservation(0));

  await until(S(4));
  await play(...placeObservation(1));

  await until(S(5));
  await play(...placeObservation(2));

  await until(S(6));
  await play(...placeObservation(3));

  await until(S(7));
  await play(...placeObservation(4));

  await until(S(8));
  await play(...placeObservation(5));

  // ------------------------------------------------------------
  // 9: look at all six observations together.
  // ------------------------------------------------------------

  await until(S(9));
  await play(
    ...clearGuides(),

    indicateAll(dots, ALL, 1.30),

    ...say('LOOK AT ALL SIX DOTS'),

    ...fbox([
      ['6 observed hours', ALL],
      ['one combined picture', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // Group outline helpers.
  // The outlines are constructed directly from coordinates.
  // No existing visible objects are grouped together.
  // ------------------------------------------------------------

  function groupBounds(data, color, padX = 0.24, padY = 0.25) {
    const xs = data.map(([x, y]) => X(x));
    const ys = data.map(([x, y]) => Y(y));

    const left = Math.min(...xs) - padX;
    const right = Math.max(...xs) + padX;

    const bottom = Math.min(...ys) - padY;
    const top = Math.max(...ys) + padY;

    return outline(
      [
        (left + right) / 2,
        (bottom + top) / 2,
        0
      ],
      right - left,
      top - bottom,
      color
    );
  }

  const leftCluster = groupBounds(
    WEEKDAY,
    ALL
  );

  const rightCluster = groupBounds(
    WEEKEND,
    ALL
  );

  const lowerTag = tag(
    'LOWER RENTALS',
    [
      X(10),
      Y(30),
      0
    ],
    ALL,
    15
  );

  const higherTag = tag(
    'HIGHER RENTALS',
    [
      X(22),
      Y(58),
      0
    ],
    ALL,
    15
  );

  // ------------------------------------------------------------
  // 10: compare the left-hand and right-hand clusters.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    new M.Create(leftCluster),
    new M.Create(rightCluster),

    new M.FadeIn(lowerTag),
    new M.FadeIn(higherTag),

    ...say('LEFT: FEWER RENTALS · RIGHT: MORE RENTALS'),

    ...fbox([
      ['cooler hours: 36–40', ALL],
      ['warmer hours: 66–70', ALL],
      ['higher counts on the right', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // Overall straight-line guide.
  //
  // Compute the least-squares line from the six original pairs.
  // It is dashed because it describes the pattern; it does not
  // connect observations through time.
  // ------------------------------------------------------------

  const meanX = DATA.reduce(
    (sum, [x, y]) => sum + x,
    0
  ) / DATA.length;

  const meanY = DATA.reduce(
    (sum, [x, y]) => sum + y,
    0
  ) / DATA.length;

  const slope = DATA.reduce(
    (sum, [x, y]) =>
      sum + (x - meanX) * (y - meanY),
    0
  ) / DATA.reduce(
    (sum, [x, y]) =>
      sum + (x - meanX) ** 2,
    0
  );

  const fittedY = x =>
    meanY + slope * (x - meanX);

  function overallTrend() {
    return dashed(
      xy(5, fittedY(5)),
      xy(27, fittedY(27)),
      ALL,
      3
    );
  }

  const combinedLine = overallTrend();

  const overallRiseTag = tag(
    'OVERALL: RISING',
    [
      X(21.5),
      Y(22),
      0
    ],
    POS,
    P ? 17 : 16
  );

  // ------------------------------------------------------------
  // 11: the combined pattern rises.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...fadeAll([
      leftCluster,
      rightCluster,
      lowerTag,
      higherTag
    ]),

    new M.Create(combinedLine),
    new M.FadeIn(overallRiseTag),

    ...say('ALL SIX TOGETHER: A RISING PATTERN', POS),

    ...fbox([
      ['warmer hours', C.ink],
      ['tend to have more rentals', POS],
      ['overall association', ALL]
    ], POS)
  );

  // ------------------------------------------------------------
  // 12: keep every observation in its original position.
  // ------------------------------------------------------------

  const fixedTag = tag(
    'SAME SIX POSITIONS',
    [
      X(15),
      Y(9),
      0
    ],
    C.muted,
    15
  );

  await until(S(12));
  await play(
    new M.FadeOut(combinedLine),
    new M.FadeOut(overallRiseTag),

    new M.FadeIn(fixedTag),

    ...say('KEEP EVERY DOT IN THE SAME PLACE'),

    ...fbox([
      ['same temperatures', C.ink],
      ['same rental counts', C.ink],
      ['reveal the two groups', ALL]
    ])
  );

  // ------------------------------------------------------------
  // Group legend.
  // ------------------------------------------------------------

  function legendItem(s, color, p, size = 16) {
    const txt = T(s, size, color);

    const marker = new M.Dot({
      point: [
        p[0] - txt.getWidth() / 2 - 0.15,
        p[1],
        0
      ],
      radius: 0.075,
      color
    });

    marker.setFill(color, 1);

    txt.moveTo([
      p[0] + 0.08,
      p[1],
      0
    ]);

    return new M.VGroup(
      marker,
      txt
    );
  }

  const weekdayLegend = legendItem(
    'Weekday morning',
    WD,
    [
      CX - (P ? 1.60 : 1.80),
      P ? -5.10 : -2.93,
      0
    ],
    P ? 15 : 14
  );

  const weekendLegend = legendItem(
    'Weekend',
    WE,
    [
      CX + (P ? 1.65 : 1.80),
      P ? -5.10 : -2.93,
      0
    ],
    P ? 15 : 14
  );

  const weekdayTag = tag(
    'WEEKDAY MORNING',
    [
      X(10),
      Y(19),
      0
    ],
    WD,
    P ? 15 : 15
  );

  const weekendTag = tag(
    'WEEKEND',
    [
      X(22),
      Y(54),
      0
    ],
    WE,
    P ? 16 : 16
  );

  // ------------------------------------------------------------
  // 13: colour the three weekday observations amber.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    new M.FadeOut(fixedTag),

    ...recolourGroup(
      [0, 1, 2],
      WD
    ),

    new M.FadeIn(weekdayLegend),
    new M.FadeIn(weekdayTag),

    ...say('AMBER: WEEKDAY MORNING HOURS', WD),

    ...fbox([
      ['weekday mornings', WD],
      ['8 °C  → 40 rentals', WD],
      ['10 °C → 38 rentals', WD],
      ['12 °C → 36 rentals', WD]
    ], WD)
  );

  // ------------------------------------------------------------
  // 14: colour the three weekend observations pink.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...recolourGroup(
      [3, 4, 5],
      WE
    ),

    new M.FadeIn(weekendLegend),
    new M.FadeIn(weekendTag),

    ...say('PINK: WEEKEND HOURS', WE),

    ...fbox([
      ['weekend hours', WE],
      ['20 °C → 70 rentals', WE],
      ['22 °C → 68 rentals', WE],
      ['24 °C → 66 rentals', WE]
    ], WE)
  );

  // ------------------------------------------------------------
  // 15: isolate the weekday group.
  // The weekend marks remain faintly visible in their original
  // positions to preserve the fixed visual comparison.
  // ------------------------------------------------------------

  const weekdayFocus = groupBounds(
    WEEKDAY,
    WD,
    0.30,
    0.32
  );

  await until(S(15));
  await play(
    ...recolourGroup(
      [3, 4, 5],
      WE,
      0.13
    ),

    new M.FadeOut(weekendTag),
    new M.Create(weekdayFocus),

    ...say('LOOK ONLY AT THE AMBER DOTS', WD),

    ...fbox([
      ['weekday mornings only', WD],
      ['3 observations', C.ink]
    ], WD)
  );

  // ------------------------------------------------------------
  // Within-group trend and endpoint helpers.
  //
  // Each within-group line extends only between the first
  // and last observed temperatures of that group.
  // ------------------------------------------------------------

  function weekdayTrend() {
    return line(
      xy(8, 40),
      xy(12, 36),
      WD,
      3.5
    );
  }

  function weekendTrend() {
    return line(
      xy(20, 70),
      xy(24, 66),
      WE,
      3.5
    );
  }

  function endpointLabels(
    firstIndex,
    lastIndex,
    color
  ) {
    const [x1, y1] = DATA[firstIndex];
    const [x2, y2] = DATA[lastIndex];

    const firstLabel = textAt(
      String(y1),
      P ? 18 : 18,
      color,
      [
        X(x1) - 0.15,
        Y(y1) + 0.37,
        0
      ],
      true
    );

    const lastLabel = textAt(
      String(y2),
      P ? 18 : 18,
      color,
      [
        X(x2) + 0.15,
        Y(y2) - 0.34,
        0
      ],
      true
    );

    return [
      firstLabel,
      lastLabel
    ];
  }

  function changeGuides(
    firstIndex,
    lastIndex,
    color
  ) {
    const [x1, y1] = DATA[firstIndex];
    const [x2, y2] = DATA[lastIndex];

    const horizontal = dashed(
      xy(x1, y1),
      xy(x2, y1),
      color,
      2
    );

    const vertical = line(
      xy(x2, y1),
      xy(x2, y2),
      color,
      3.5
    );

    const label = textAt(
      '−4',
      P ? 18 : 18,
      color,
      [
        X(x2) + 0.39,
        (Y(y1) + Y(y2)) / 2,
        0
      ],
      true
    );

    return [
      horizontal,
      vertical,
      label
    ];
  }

  const weekdayLine = weekdayTrend();

  const weekdayEnds = endpointLabels(
    0,
    2,
    WD
  );

  const weekdayChange = changeGuides(
    0,
    2,
    WD
  );

  // ------------------------------------------------------------
  // 16: weekday rentals fall as temperature rises.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    new M.FadeOut(weekdayFocus),

    new M.Create(weekdayLine),

    ...revealAll(weekdayEnds),
    ...revealAll(weekdayChange),

    ...say('WEEKDAY: 40 → 36 RENTALS', WD),

    ...fbox([
      ['temperature: 8 → 12 °C', C.ink],
      ['rentals: 40 → 36', WD],
      ['change: −4 rentals', NEG],
      ['a falling pattern', WD]
    ], WD)
  );

  // ------------------------------------------------------------
  // 17: isolate the weekend group.
  // ------------------------------------------------------------

  const weekendFocus = groupBounds(
    WEEKEND,
    WE,
    0.30,
    0.32
  );

  await until(S(17));
  await play(
    ...fadeAll([
      weekdayLine,
      ...weekdayEnds,
      ...weekdayChange,
      weekdayTag
    ]),

    ...recolourGroup(
      [0, 1, 2],
      WD,
      0.13
    ),

    ...recolourGroup(
      [3, 4, 5],
      WE,
      1
    ),

    new M.FadeIn(weekendTag),
    new M.Create(weekendFocus),

    ...say('LOOK ONLY AT THE PINK DOTS', WE),

    ...fbox([
      ['weekend hours only', WE],
      ['3 observations', C.ink]
    ], WE)
  );

  // ------------------------------------------------------------
  // 18: weekend rentals also fall as temperature rises.
  // ------------------------------------------------------------

  const weekendLine = weekendTrend();

  const weekendEnds = endpointLabels(
    3,
    5,
    WE
  );

  const weekendChange = changeGuides(
    3,
    5,
    WE
  );

  await until(S(18));
  await play(
    new M.FadeOut(weekendFocus),

    new M.Create(weekendLine),

    ...revealAll(weekendEnds),
    ...revealAll(weekendChange),

    ...say('WEEKEND: 70 → 66 RENTALS', WE),

    ...fbox([
      ['temperature: 20 → 24 °C', C.ink],
      ['rentals: 70 → 66', WE],
      ['change: −4 rentals', NEG],
      ['a falling pattern', WE]
    ], WE)
  );

  // ------------------------------------------------------------
  // 19: show both groups and their falling patterns together.
  // ------------------------------------------------------------

  const weekdayLine2 = weekdayTrend();

  const weekdayDown = tag(
    'FALLING',
    [
      X(10),
      Y(46),
      0
    ],
    WD,
    15
  );

  const weekendDown = tag(
    'FALLING',
    [
      X(22),
      Y(77),
      0
    ],
    WE,
    15
  );

  await until(S(19));
  await play(
    ...fadeAll([
      ...weekendEnds,
      ...weekendChange
    ]),

    ...recolourGroup(
      [0, 1, 2],
      WD,
      1
    ),

    new M.FadeIn(weekdayTag),

    new M.Create(weekdayLine2),

    new M.FadeIn(weekdayDown),
    new M.FadeIn(weekendDown),

    ...say('BOTH GROUPS SLOPE DOWN', NEG),

    ...fbox([
      ['weekday: falling', WD],
      ['weekend: falling', WE],
      ['same direction in both groups', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 20: compare the different starting levels.
  //
  // Weekday mean: temperature = 10, rentals = 38.
  // Weekend mean: temperature = 22, rentals = 68.
  //
  // The group-centre markers are hollow diamonds, not extra
  // observed hours.
  // ------------------------------------------------------------

  function diamondAt(x, y, color, size = 0.15) {
    const p = xy(x, y);

    const a = [
      p[0],
      p[1] + size,
      0
    ];

    const b = [
      p[0] + size,
      p[1],
      0
    ];

    const c = [
      p[0],
      p[1] - size,
      0
    ];

    const d = [
      p[0] - size,
      p[1],
      0
    ];

    return new M.VGroup(
      line(a, b, color, 3),
      line(b, c, color, 3),
      line(c, d, color, 3),
      line(d, a, color, 3)
    );
  }

  const weekdayCentre = diamondAt(
    10,
    38,
    WD,
    0.20
  );

  const weekendCentre = diamondAt(
    22,
    68,
    WE,
    0.20
  );

  const centreHorizontal = dashed(
    xy(10, 38),
    xy(22, 38),
    C.ink
  );

  const centreVertical = dashed(
    xy(22, 38),
    xy(22, 68),
    C.ink
  );

  const warmerLabel = textAt(
    'Warmer →',
    P ? 17 : 16,
    C.ink,
    [
      (X(10) + X(22)) / 2,
      Y(38) - 0.31,
      0
    ]
  );

  const busierLabel = textAt(
    'Busier',
    P ? 17 : 16,
    C.ink,
    [
      X(22) + 0.65,
      (Y(38) + Y(68)) / 2,
      0
    ]
  );

  await until(S(20));
  await play(
    new M.FadeOut(weekdayDown),
    new M.FadeOut(weekendDown),
    new M.FadeOut(weekendTag),

    new M.FadeIn(weekdayCentre),
    new M.FadeIn(weekendCentre),

    new M.Create(centreHorizontal),
    new M.Create(centreVertical),

    new M.FadeIn(warmerLabel),
    new M.FadeIn(busierLabel),

    ...say('WEEKENDS ARE BOTH WARMER AND BUSIER', WE),

    ...fbox([
      ['weekday means: 10 °C, 38', WD],
      ['weekend means: 22 °C, 68', WE],
      ['different starting levels', C.ink]
    ], WE)
  );

  // ------------------------------------------------------------
  // 21-22: show how group membership aligns with temperature.
  //
  // The shaded regions cover the ranges occupied by the
  // observed groups, not all possible weekday/weekend hours.
  // ------------------------------------------------------------

  function temperatureRegion(a, b, color) {
    const left = X(a);
    const right = X(b);

    const r = new M.Rectangle({
      width: right - left,
      height: YT - YB,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.055);

    r.moveTo([
      (left + right) / 2,
      (YT + YB) / 2,
      0
    ]);

    return r;
  }

  const coldRegion = temperatureRegion(
    7,
    13,
    WD
  );

  const warmRegion = temperatureRegion(
    19,
    25,
    WE
  );

  const coldRegionTag = tag(
    '8–12 °C',
    [
      X(10),
      Y(10),
      0
    ],
    WD,
    17
  );

  const warmRegionTag = tag(
    '20–24 °C',
    [
      X(22),
      Y(10),
      0
    ],
    WE,
    17
  );

  await until(S(21));
  await play(
    ...fadeAll([
      weekdayCentre,
      weekendCentre,
      centreHorizontal,
      centreVertical,
      warmerLabel,
      busierLabel,
      weekdayTag
    ]),

    new M.FadeIn(coldRegion),
    new M.FadeIn(coldRegionTag),

    indicateAll(
      weekdayDots,
      WD,
      1.20
    ),

    ...say('ALL THREE WEEKDAY DOTS ARE ON THE COLD SIDE', WD),

    ...fbox([
      ['observed weekday mornings', WD],
      ['8 °C, 10 °C, 12 °C', WD],
      ['cooler group', C.ink]
    ], WD)
  );

  await until(S(22));
  await play(
    new M.FadeIn(warmRegion),
    new M.FadeIn(warmRegionTag),

    indicateAll(
      weekendDots,
      WE,
      1.20
    ),

    ...say('ALL THREE WEEKEND DOTS ARE ON THE WARM SIDE', WE),

    ...fbox([
      ['observed weekend hours', WE],
      ['20 °C, 22 °C, 24 °C', WE],
      ['warmer group', C.ink]
    ], WE)
  );

  // ------------------------------------------------------------
  // 23: reveal Simpson's paradox.
  //
  // Keep the two falling group lines visible while restoring
  // the rising combined line.
  // ------------------------------------------------------------

  const reversalLine = overallTrend();

  const reversalUpTag = tag(
    'TOGETHER: RISING',
    [
      X(20.5),
      Y(23),
      0
    ],
    ALL,
    P ? 16 : 16
  );

  const reversalWDTag = tag(
    'FALLING',
    [
      X(10),
      Y(47),
      0
    ],
    WD,
    15
  );

  const reversalWETag = tag(
    'FALLING',
    [
      X(22),
      Y(77),
      0
    ],
    WE,
    15
  );

  await until(S(23));
  await play(
    ...fadeAll([
      coldRegion,
      warmRegion,
      coldRegionTag,
      warmRegionTag
    ]),

    new M.Create(reversalLine),

    new M.FadeIn(reversalUpTag),
    new M.FadeIn(reversalWDTag),
    new M.FadeIn(reversalWETag),

    ...say("SIMPSON'S PARADOX", POS),

    ...fbox([
      ["SIMPSON'S PARADOX", POS],
      ['together: rising', ALL],
      ['weekday: falling', WD],
      ['weekend: falling', WE]
    ], POS)
  );

  // ------------------------------------------------------------
  // 24: add numbers to describe the three patterns.
  //
  // Transition to three comparison panels.
  // Every panel uses the same axis ranges:
  // temperature 0–30 °C, rentals 0–80.
  //
  // This prevents changes in scale from creating a misleading
  // impression of the reversal.
  // ------------------------------------------------------------

  const mainChartObjects = [
    ...plotBase,
    ...dots,
    weekdayLegend,
    weekendLegend,
    weekdayLine2,
    weekendLine,
    reversalLine,
    reversalUpTag,
    reversalWDTag,
    reversalWETag
  ];

  const PANEL_W = P ? 6.35 : 2.36;
  const PANEL_H = P ? 1.62 : 2.78;

  const panelCenters = P
    ? [
        [0, 0.77, 0],
        [0, -1.08, 0],
        [0, -2.93, 0]
      ]
    : [
        [CX - 2.52, -0.28, 0],
        [CX, -0.28, 0],
        [CX + 2.52, -0.28, 0]
      ];

  function comparisonPanel(
    center,
    title,
    data,
    color,
    lineMode
  ) {
    const cx = center[0];
    const cy = center[1];

    const frame = new M.RoundedRectangle({
      width: PANEL_W,
      height: PANEL_H,
      cornerRadius: 0.15,
      color,
      strokeWidth: 1.8
    });

    frame.setFill(C.card, 0.94);
    frame.moveTo(center);

    let left;
    let right;
    let bottom;
    let top;
    let resultP;
    let titleP;

    if (P) {
      left = cx - 2.72;
      right = cx + 0.60;

      bottom = cy - 0.54;
      top = cy + 0.46;

      titleP = [
        cx + 1.82,
        cy + 0.37,
        0
      ];

      resultP = [
        cx + 1.82,
        cy - 0.10,
        0
      ];
    } else {
      left = cx - 0.90;
      right = cx + 1.00;

      bottom = cy - 0.72;
      top = cy + 0.70;

      titleP = [
        cx,
        cy + 1.09,
        0
      ];

      resultP = [
        cx,
        cy - 1.10,
        0
      ];
    }

    const sx = n =>
      left + n / XMAX * (right - left);

    const sy = n =>
      bottom + n / YMAX * (top - bottom);

    const sp = (x, y) => [
      sx(x),
      sy(y),
      0
    ];

    const panelGrid = [];

    [10, 20, 30].forEach(x => {
      panelGrid.push(line(
        sp(x, 0),
        sp(x, 80),
        C.muted,
        0.5
      ));
    });

    [20, 40, 60, 80].forEach(y => {
      panelGrid.push(line(
        sp(0, y),
        sp(30, y),
        C.muted,
        0.5
      ));
    });

    const xa = line(
      sp(0, 0),
      sp(30, 0),
      C.muted,
      1.5
    );

    const ya = line(
      sp(0, 0),
      sp(0, 80),
      C.muted,
      1.5
    );

    const axisLabels = [
      textAt(
        '0',
        P ? 15 : 14,
        C.muted,
        [left, bottom - 0.17, 0],
        true
      ),

      textAt(
        '30',
        P ? 15 : 14,
        C.muted,
        [right, bottom - 0.17, 0],
        true
      ),

      textAt(
        '80',
        P ? 15 : 14,
        C.muted,
        [left - 0.2, top, 0],
        true
      )
    ];

    const heading = textAt(
      title,
      P ? 17 : 15,
      color,
      titleP
    );

    const marks = data.map(([x, y]) => {
      const pointColor =
        lineMode === 'overall'
          ? ALL
          : color;

      const halo = new M.Dot({
        point: sp(x, y),
        radius: P ? 0.10 : 0.095,
        color: pointColor
      });

      halo.setFill(pointColor, 0.20);

      const core = new M.Dot({
        point: sp(x, y),
        radius: P ? 0.058 : 0.056,
        color: pointColor
      });

      core.setFill(pointColor, 1);

      return new M.VGroup(halo, core);
    });

    const trend =
      lineMode === 'overall'
        ? dashed(
            sp(5, fittedY(5)),
            sp(27, fittedY(27)),
            color,
            2
          )
        : line(
            sp(...data[0]),
            sp(...data[data.length - 1]),
            color,
            2.5
          );

    const group = new M.VGroup(
      frame,
      ...panelGrid,
      xa,
      ya,
      ...axisLabels,
      heading,
      trend,
      ...marks
    );

    const result = value =>
      tag(
        value,
        resultP,
        color,
        P ? 19 : 17
      );

    const highlight = () =>
      outline(
        center,
        PANEL_W + 0.10,
        PANEL_H + 0.10,
        color
      );

    return {
      group,
      marks,
      trend,
      result,
      highlight
    };
  }

  const overallPanel = comparisonPanel(
    panelCenters[0],
    'ALL SIX HOURS',
    DATA,
    ALL,
    'overall'
  );

  const weekdayPanel = comparisonPanel(
    panelCenters[1],
    'WEEKDAY',
    WEEKDAY,
    WD,
    'weekday'
  );

  const weekendPanel = comparisonPanel(
    panelCenters[2],
    'WEEKEND',
    WEEKEND,
    WE,
    'weekend'
  );

  const panels = [
    overallPanel,
    weekdayPanel,
    weekendPanel
  ];

  const commonScaleNote = textAt(
    'Same axes in all three pictures',
    P ? 17 : 16,
    C.muted,
    [
      CX,
      P ? -4.10 : -2.02,
      0
    ]
  );

  const commonUnitsNote = textAt(
    'Across: °C    Up: bikes rented',
    P ? 16 : 15,
    C.muted,
    [
      CX,
      P ? -4.46 : -2.37,
      0
    ]
  );

  await until(S(24));
  await play(
    ...fadeAll(mainChartObjects),

    new M.LaggedStart(
      panels.map(p =>
        new M.FadeIn(p.group)
      ),
      {
        lagRatio: 0.20,
        runTime: 1.65
      }
    ),

    new M.FadeIn(commonScaleNote),
    new M.FadeIn(commonUnitsNote),

    ...say('ONE NUMBER FOR EACH PICTURE'),

    ...fbox([
      ['all six hours', ALL],
      ['weekday mornings', WD],
      ['weekend hours', WE],
      ['compare their correlations', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // 25: recall what Pearson correlation measures.
  // ------------------------------------------------------------

  const pearsonDefinition = tag(
    'PEARSON r: −1 TO +1',
    [
      CX,
      P ? -5.02 : -2.76,
      0
    ],
    POS,
    P ? 17 : 16
  );

  await until(S(25));
  await play(
    new M.FadeIn(pearsonDefinition),

    ...say('PEARSON: STRAIGHT-LINE DIRECTION AND STRENGTH', POS),

    ...fbox([
      ['Pearson correlation, r', POS],
      ['+1: perfect rising line', ALL],
      ['−1: perfect falling line', NEG],
      ['0: no linear association', C.muted]
    ], POS)
  );

  // ------------------------------------------------------------
  // 26: select all six pairs for the first calculation.
  // ------------------------------------------------------------

  const overallPanelFocus =
    overallPanel.highlight();

  await until(S(26));
  await play(
    new M.Create(overallPanelFocus),

    indicateAll(
      overallPanel.marks,
      ALL,
      1.25
    ),

    ...say('FIRST: USE ALL SIX PAIRS', ALL),

    ...fbox([
      ['all observations together', ALL],
      ['sample size = 6', C.ink],
      ['calculate Pearson r', POS]
    ])
  );

  // ------------------------------------------------------------
  // 27: the combined correlation is approximately +0.93.
  // ------------------------------------------------------------

  const overallResult = overallPanel.result(
    `r ≈ ${signed(R_ALL, 2)}`
  );

  await until(S(27));
  await play(
    new M.FadeIn(overallResult),

    ...say('ALL SIX: r ≈ +0.93', ALL),

    ...fbox([
      ['all six pairs', ALL],
      [`r ≈ ${signed(R_ALL, 2)}`, POS],
      ['strong positive association', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 28: use the three weekday pairs only.
  // ------------------------------------------------------------

  const weekdayPanelFocus =
    weekdayPanel.highlight();

  await until(S(28));
  await play(
    new M.FadeOut(overallPanelFocus),

    new M.Create(weekdayPanelFocus),

    indicateAll(
      weekdayPanel.marks,
      WD,
      1.15
    ),

    ...say('NEXT: ONLY THE THREE WEEKDAY PAIRS', WD),

    ...fbox([
      ['(8, 40)', WD],
      ['(10, 38)', WD],
      ['(12, 36)', WD],
      ['calculate Pearson again', C.ink]
    ], WD)
  );

  // ------------------------------------------------------------
  // 29: weekday correlation is exactly -1.
  // ------------------------------------------------------------

  const weekdayResult = weekdayPanel.result(
    `r = ${signed(R_WEEKDAY, 0)}`
  );

  await until(S(29));
  await play(
    new M.FadeIn(weekdayResult),

    new M.Indicate(weekdayPanel.trend, {
      color: WD
    }),

    ...say('WEEKDAY: r = −1', WD),

    ...fbox([
      ['weekday mornings', WD],
      ['r = −1 exactly', NEG],
      ['perfect falling straight line', WD]
    ], WD)
  );

  // ------------------------------------------------------------
  // 30: weekend correlation is also exactly -1.
  // ------------------------------------------------------------

  const weekendPanelFocus =
    weekendPanel.highlight();

  const weekendResult = weekendPanel.result(
    `r = ${signed(R_WEEKEND, 0)}`
  );

  await until(S(30));
  await play(
    new M.FadeOut(weekdayPanelFocus),

    new M.Create(weekendPanelFocus),

    new M.FadeIn(weekendResult),

    new M.Indicate(weekendPanel.trend, {
      color: WE
    }),

    ...say('WEEKEND: r = −1 AGAIN', WE),

    ...fbox([
      ['all six: +0.93', ALL],
      ['weekday: −1', WD],
      ['weekend: −1', WE],
      ['the direction reverses', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 31: use the check when data mix groups with
  // different starting levels.
  // ------------------------------------------------------------

  const allResults = [
    overallResult,
    weekdayResult,
    weekendResult
  ];

  await until(S(31));
  await play(
    new M.FadeOut(weekendPanelFocus),

    indicateAll(
      allResults,
      POS,
      1.65
    ),

    ...say('CHECK FOR GROUPS WITH DIFFERENT STARTING LEVELS', POS),

    ...fbox([
      ['1. look at all observations', ALL],
      ['2. identify meaningful groups', C.ink],
      ['3. compare within each group', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 32: return to the original chart.
  //
  // Practical implication: compare hours of the same kind
  // before making a staffing decision.
  // ------------------------------------------------------------

  const panelObjects = [
    ...panels.map(p => p.group),
    ...allResults,
    commonScaleNote,
    commonUnitsNote,
    pearsonDefinition
  ];

  const practicalWeekdayLine = weekdayTrend();
  const practicalWeekendLine = weekendTrend();

  const practicalWDBox = groupBounds(
    WEEKDAY,
    WD,
    0.29,
    0.30
  );

  const practicalWEBox = groupBounds(
    WEEKEND,
    WE,
    0.29,
    0.30
  );

  const practicalWDTag = tag(
    'WEEKDAY MORNING',
    [
      X(10),
      Y(27),
      0
    ],
    WD,
    15
  );

  const practicalWETag = tag(
    'WEEKEND',
    [
      X(22),
      Y(57),
      0
    ],
    WE,
    16
  );

  await until(S(32));
  await play(
    ...fadeAll(panelObjects),

    ...revealAll(plotBase),

    ...revealAll(dots),

    new M.FadeIn(weekdayLegend),
    new M.FadeIn(weekendLegend),

    new M.Create(practicalWeekdayLine),
    new M.Create(practicalWeekendLine),

    new M.Create(practicalWDBox),
    new M.Create(practicalWEBox),

    new M.FadeIn(practicalWDTag),
    new M.FadeIn(practicalWETag),

    ...say('COMPARE HOURS OF THE SAME KIND', POS),

    ...fbox([
      ['planning bike availability', C.muted],
      ['weekday with weekday', WD],
      ['weekend with weekend', WE],
      ['compare like with like', POS]
    ], POS)
  );

  // ------------------------------------------------------------
  // 33: common trap — correlation is not proof of causation.
  //
  // Restore the combined trend, but explicitly mark the causal
  // conclusion as unsupported.
  // ------------------------------------------------------------

  const trapLine = overallTrend();

  const trapQuestion = tag(
    'MORE HEAT = MORE RIDERS?',
    [
      X(16),
      Y(19),
      0
    ],
    NEG,
    P ? 16 : 15
  );

  await until(S(33));
  await play(
    ...fadeAll([
      practicalWDBox,
      practicalWEBox,
      practicalWeekdayLine,
      practicalWeekendLine,
      practicalWDTag,
      practicalWETag
    ]),

    new M.Create(trapLine),
    new M.FadeIn(trapQuestion),

    ...say('COMMON TRAP: ASSOCIATION IS NOT PROOF', NEG),

    ...fbox([
      ['overall r ≈ +0.93', ALL],
      ['does heat cause more rentals?', C.ink],
      ['this does not prove it', NEG],
      ['the groups differ', C.muted]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 34: the observed groups differ in day type and time context.
  //
  // Do not invent a specific time of day for the weekend
  // observations. The source only identifies them as weekend
  // hours.
  // ------------------------------------------------------------

  const contextWDTag = tag(
    'WEEKDAY MORNING',
    [
      X(10),
      Y(27),
      0
    ],
    WD,
    15
  );

  const contextWETag = tag(
    'WEEKEND HOURS',
    [
      X(22),
      Y(56),
      0
    ],
    WE,
    15
  );

  const contextWDBox = groupBounds(
    WEEKDAY,
    WD,
    0.28,
    0.29
  );

  const contextWEBox = groupBounds(
    WEEKEND,
    WE,
    0.28,
    0.29
  );

  await until(S(34));
  await play(
    new M.FadeOut(trapLine),
    new M.FadeOut(trapQuestion),

    new M.Create(contextWDBox),
    new M.Create(contextWEBox),

    new M.FadeIn(contextWDTag),
    new M.FadeIn(contextWETag),

    ...say('TEMPERATURE IS NOT THE ONLY DIFFERENCE', NEG),

    ...fbox([
      ['weekday morning hours', WD],
      ['weekend hours', WE],
      ['different day and time contexts', C.ink],
      ['not a controlled comparison', NEG]
    ], NEG)
  );

  // ------------------------------------------------------------
  // 35: final definition.
  //
  // Leave the six observations in their original positions.
  // Show the rising combined guide and both falling group
  // guides at the same time.
  // ------------------------------------------------------------

  const finalOverallLine = overallTrend();
  const finalWeekdayLine = weekdayTrend();
  const finalWeekendLine = weekendTrend();

  const finalOverallTag = tag(
    `ALL: r ≈ ${signed(R_ALL, 2)}`,
    [
      X(21),
      Y(20),
      0
    ],
    ALL,
    P ? 18 : 17
  );

  const finalWeekdayTag = tag(
    'WEEKDAY: r = −1',
    [
      X(6),
      Y(53),
      0
    ],
    WD,
    P ? 15 : 15
  );

  const finalWeekendTag = tag(
    'WEEKEND: r = −1',
    [
      X(22),
      Y(77),
      0
    ],
    WE,
    P ? 15 : 15
  );

  const finalCheckTag = tag(
    'CHECK THE WHOLE AND EACH GROUP',
    [
      X(15),
      Y(8),
      0
    ],
    POS,
    P ? 15 : 15
  );

  await until(S(35));
  await play(
    ...fadeAll([
      contextWDBox,
      contextWEBox,
      contextWDTag,
      contextWETag
    ]),

    new M.Create(finalOverallLine),

    new M.Create(finalWeekdayLine),
    new M.Create(finalWeekendLine),

    new M.FadeIn(finalOverallTag),
    new M.FadeIn(finalWeekdayTag),
    new M.FadeIn(finalWeekendTag),

    new M.FadeIn(finalCheckTag),

    ...say("SIMPSON'S PARADOX: THE PATTERN REVERSES", POS),

    ...fbox([
      ["SIMPSON'S PARADOX", POS],
      ['all together: rising', ALL],
      ['weekday: falling', WD],
      ['weekend: falling', WE],
      ['compare whole and groups', C.ink]
    ], POS)
  );
}
