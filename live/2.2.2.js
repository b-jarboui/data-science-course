// lesson 2.2.2
// Line charts: joining dots in time order to see rises, falls and peaks.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data: rentals per hour on one weekday.
  const HOURS = [
    6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22
  ];

  const RENTALS = [
    5, 25, 60, 35, 15, 15, 20, 18, 15,
    18, 30, 55, 65, 35, 20, 10, 5
  ];

  // Shared chapter colour: weekday = amber.
  const DATA_COLOR = C.amber;

  // Laptop and phone layouts.
  const CX = P ? 0 : -2.15;
  const PILL = P ? [0, 2.35, 0] : [CX, 1.90, 0];
  const BOXP = P ? [0, 3.50, 0] : [4.55, -0.15, 0];

  const XL = P ? -2.95 : -5.85;
  const XR = P ? 3.35 : 2.05;
  const YB = P ? -3.85 : -2.05;
  const YT = P ? 1.30 : 1.15;

  const X = h => XL + (h - 6) / 16 * (XR - XL);
  const Y = n => YB + n / 70 * (YT - YB);
  const xy = (h, n) => [X(h), Y(n), 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);
    return r;
  }

  function hourName(h) {
    if (h === 12) return '12 noon';
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  }

  // Information box, following the approved reference lesson.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.39 : 0.42;

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
    const maxw = P ? FW - 1.20 : 3.80;

    if (wd > maxw) {
      g.scale(maxw / wd);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  function recordBox(h) {
    return fbox([
      [hourName(h), C.muted],
      [`${RENTALS[h - 6]} bikes rented`, DATA_COLOR]
    ], DATA_COLOR);
  }

  // Bicycle icon.
  // Components are individually positioned before grouping.
  function bike(cx, cy, scale = 1, color = C.cyan) {
    const p = (x, y) => [
      cx + x * scale,
      cy + y * scale,
      0
    ];

    const wheel = x => {
      const w = new M.Circle({
        radius: 0.47 * scale,
        color,
        strokeWidth: 3
      });

      w.moveTo(p(x, -0.20));
      return w;
    };

    const pieces = [
      wheel(-0.85),
      wheel(0.85),

      line(p(-0.85, -0.20), p(-0.35, 0.54), color, 4),
      line(p(-0.35, 0.54), p(0.05, -0.20), color, 4),
      line(p(0.05, -0.20), p(-0.85, -0.20), color, 4),

      line(p(-0.35, 0.54), p(0.57, 0.54), color, 4),
      line(p(0.57, 0.54), p(0.05, -0.20), color, 4),
      line(p(0.57, 0.54), p(0.85, -0.20), color, 4),

      line(p(0.57, 0.54), p(0.45, 0.90), color, 4),
      line(p(0.45, 0.90), p(0.78, 0.90), color, 4),

      line(p(-0.35, 0.54), p(-0.47, 0.77), color, 4),
      line(p(-0.68, 0.77), p(-0.26, 0.77), color, 4)
    ];

    const crank = new M.Circle({
      radius: 0.11 * scale,
      color,
      strokeWidth: 2
    });

    crank.moveTo(p(0.05, -0.20));

    pieces.push(crank);

    return new M.VGroup(...pieces);
  }

  function clock(cx, cy, radius = 0.75, hour = 8) {
    const face = new M.Circle({
      radius,
      color: C.amber,
      strokeWidth: 3
    });

    face.moveTo([cx, cy, 0]);

    const marks = [];

    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6;

      marks.push(line(
        [
          cx + Math.sin(a) * radius * 0.80,
          cy + Math.cos(a) * radius * 0.80,
          0
        ],
        [
          cx + Math.sin(a) * radius * 0.94,
          cy + Math.cos(a) * radius * 0.94,
          0
        ],
        C.muted,
        2
      ));
    }

    const angle = hour / 12 * 2 * Math.PI;

    const hourHand = line(
      [cx, cy, 0],
      [
        cx + Math.sin(angle) * radius * 0.55,
        cy + Math.cos(angle) * radius * 0.55,
        0
      ],
      C.amber,
      4
    );

    const minuteHand = line(
      [cx, cy, 0],
      [cx, cy + radius * 0.72, 0],
      C.ink,
      3
    );

    const center = new M.Dot({
      point: [cx, cy, 0],
      radius: 0.06,
      color: C.amber
    });

    return new M.VGroup(
      face,
      ...marks,
      hourHand,
      minuteHand,
      center
    );
  }

  // 0-1: introduce the practical question.
  const introY = P ? -0.60 : -0.25;

  const bicycle = bike(
    CX - 0.85,
    introY,
    P ? 1.35 : 1.25
  );

  const clockIcon = clock(
    CX + 1.85,
    introY + 0.30,
    0.78,
    8
  );

  const stationLabel = textAt(
    'BIKE STATION',
    23,
    C.ink,
    [CX, introY - 1.50, 0]
  );

  await until(S(0));
  await play(
    new M.FadeIn(bicycle),
    new M.FadeIn(clockIcon),
    new M.FadeIn(stationLabel),
    ...say('WHEN DO WE NEED MORE BIKES?')
  );

  await until(S(1));
  await play(
    new M.Indicate(clockIcon, { color: C.amber }),
    ...say('WHICH HOURS ARE BUSIEST?', C.amber),
    ...fbox([
      ['one weekday', C.muted],
      ['quiet hours?', C.cyan],
      ['busy hours?', C.amber]
    ], C.amber)
  );

  // 2: one record for each of the seventeen hours.
  const REC_W = P ? 1.02 : 0.59;
  const REC_H = P ? 1.05 : 1.10;

  const recPos = k => {
    if (P) {
      const row = Math.floor(k / 6);
      const col = k % 6;
      const count = row === 2 ? 5 : 6;

      return [
        (col - (count - 1) / 2) * 1.12,
        0.75 - row * 1.35,
        0
      ];
    }

    return [
      (k - 8) * 0.68,
      -0.35,
      0
    ];
  };

  function hourCard(h, k) {
    const p = recPos(k);

    const r = new M.RoundedRectangle({
      width: REC_W,
      height: REC_H,
      cornerRadius: 0.09,
      color: DATA_COLOR,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.90);
    r.moveTo(p);

    const time = textAt(
      String(h).padStart(2, '0'),
      P ? 20 : 18,
      DATA_COLOR,
      [p[0], p[1] + 0.22, 0],
      true
    );

    const recorded = new M.Dot({
      point: [p[0], p[1] - 0.22, 0],
      radius: 0.08,
      color: DATA_COLOR
    });

    recorded.setFill(DATA_COLOR, 1);

    return new M.VGroup(r, time, recorded);
  }

  const records = HOURS.map((h, k) => hourCard(h, k));

  const recordNote = textAt(
    'One rental count for each hour',
    P ? 20 : 19,
    C.muted,
    [0, P ? -2.85 : -1.40, 0]
  );

  const fullPill = P ? PILL : [0, 1.90, 0];

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(
      bicycle,
      clockIcon,
      stationLabel,
      boxNow
    )),
    new M.LaggedStart(
      records.map(r => new M.FadeIn(r)),
      { lagRatio: 0.07, runTime: 2.10 }
    ),
    new M.FadeIn(recordNote),
    ...showA(
      '6 AM TO 10 PM: ONE RECORD PER HOUR',
      DATA_COLOR,
      fullPill
    )
  );

  boxNow = null;

  // 3-4: construct the chart, with time on the horizontal axis.
  const xAxis = line(
    xy(6, 0),
    xy(22, 0),
    C.muted,
    3
  );

  const yAxis = line(
    xy(6, 0),
    xy(6, 70),
    C.muted,
    3
  );

  const xTicks = HOURS.map(h => {
    const major = h % 2 === 0;

    const tick = line(
      [X(h), YB - 0.07, 0],
      [X(h), YB + 0.07, 0],
      C.muted,
      major ? 2 : 1.5
    );

    // Stagger alternate labels on narrow phone screens.
    const labelY = P
      ? YB - (major ? 0.27 : 0.49)
      : YB - 0.27;

    const lab = textAt(
      String(h),
      P ? 14 : 15,
      C.muted,
      [X(h), labelY, 0],
      true
    );

    return new M.VGroup(tick, lab);
  });

  const xTitle = textAt(
    'Time of day (hour)',
    P ? 20 : 19,
    C.cyan,
    [
      (XL + XR) / 2,
      YB - (P ? 0.88 : 0.68),
      0
    ]
  );

  const xRuler = new M.VGroup(...xTicks, xTitle);

  const yTicks = Array.from(
    { length: 8 },
    (_, k) => k * 10
  ).map(n => {
    const tick = line(
      [XL - 0.07, Y(n), 0],
      [XL + 0.07, Y(n), 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(n),
      P ? 17 : 18,
      C.muted,
      [XL - 0.36, Y(n), 0],
      true
    );

    return new M.VGroup(tick, lab);
  });

  const yTitle = textAt(
    'Bikes rented',
    P ? 20 : 19,
    DATA_COLOR,
    [XL + 0.95, YT + 0.30, 0]
  );

  const yRuler = new M.VGroup(...yTicks, yTitle);

  const gridLines = [];

  for (let h = 7; h <= 22; h++) {
    gridLines.push(line(
      xy(h, 0),
      xy(h, 70),
      C.card,
      h % 2 === 0 ? 1.5 : 1
    ));
  }

  for (let n = 10; n <= 70; n += 10) {
    gridLines.push(line(
      xy(6, n),
      xy(22, n),
      C.card,
      1.5
    ));
  }

  const grid = new M.VGroup(...gridLines);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(
      ...records,
      recordNote
    )),
    new M.FadeIn(grid),
    new M.Create(xAxis),
    new M.FadeIn(xRuler),
    ...say('EARLIEST → LATEST', C.cyan),
    ...fbox([
      ['across: time', C.cyan],
      ['6 AM → 10 PM', C.ink]
    ])
  );

  await until(S(4));
  await play(
    new M.Create(yAxis),
    new M.FadeIn(yRuler),
    ...say('UP: NUMBER OF BIKES RENTED', DATA_COLOR),
    ...fbox([
      ['across: hour', C.cyan],
      ['up: rental count', DATA_COLOR]
    ], DATA_COLOR)
  );

  // Chart helpers.
  const dots = new Map();
  const segments = new Map();

  function dataDot(h, n, color = DATA_COLOR) {
    const p = xy(h, n);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.17 : 0.16,
      color
    });

    halo.setFill(color, 0.14);

    const middle = new M.Dot({
      point: p,
      radius: P ? 0.115 : 0.11,
      color
    });

    middle.setFill(color, 0.32);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.065 : 0.075,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(halo, middle, core);
  }

  function makeDot(h) {
    const d = dataDot(h, RENTALS[h - 6]);
    dots.set(h, d);
    return d;
  }

  function makeSegment(h1, h2, color = DATA_COLOR) {
    const s = line(
      xy(h1, RENTALS[h1 - 6]),
      xy(h2, RENTALS[h2 - 6]),
      color,
      2.8
    );

    segments.set(h1, s);
    return s;
  }

  function ring(h, color = C.cyan, radius = 0.23) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.moveTo(xy(h, RENTALS[h - 6]));
    return r;
  }

  function countLabel(h, color = DATA_COLOR) {
    const n = RENTALS[h - 6];

    return textAt(
      String(n),
      P ? 18 : 19,
      color,
      [
        X(h) + (h === 22 ? -0.15 : 0),
        Y(n) + 0.32,
        0
      ],
      true
    );
  }

  let activeGuide = [];

  function clearGuide() {
    const a = activeGuide.length
      ? [
        new M.FadeOut(
          new M.VGroup(...activeGuide)
        )
      ]
      : [];

    activeGuide = [];
    return a;
  }

  function guideFor(h) {
    const n = RENTALS[h - 6];
    const p = xy(h, n);

    const vertical = dashed(
      xy(h, 0),
      p,
      C.cyan
    );

    const horizontal = h === 6
      ? null
      : dashed(
        xy(6, n),
        p,
        C.cyan
      );

    const lab = countLabel(h);

    const a = [
      new M.Create(vertical),
      new M.FadeIn(lab)
    ];

    activeGuide = [vertical, lab];

    if (horizontal) {
      activeGuide.push(horizontal);
      a.push(new M.Create(horizontal));
    }

    return a;
  }

  // 5-7: place the first three observations without joining them.
  await until(S(5));

  const dot6 = makeDot(6);

  await play(
    new M.FadeIn(dot6),
    ...guideFor(6),
    new M.Flash(dot6.submobjects[2], {
      color: DATA_COLOR
    }),
    ...say('6 AM: 5 RENTALS', DATA_COLOR),
    ...recordBox(6)
  );

  await until(S(6));

  const dot7 = makeDot(7);

  await play(
    ...clearGuide(),
    new M.FadeIn(dot7),
    ...guideFor(7),
    ...say('7 AM: 25 RENTALS', DATA_COLOR),
    ...recordBox(7)
  );

  await until(S(7));

  const dot8 = makeDot(8);

  await play(
    ...clearGuide(),
    new M.FadeIn(dot8),
    ...guideFor(8),
    ...say('8 AM: 60 RENTALS', DATA_COLOR),
    ...recordBox(8)
  );

  // 8-10: connect the first three dots in time order.
  const seg67 = makeSegment(6, 7);

  await until(S(8));
  await play(
    ...clearGuide(),
    new M.Create(seg67),
    ...say('JOIN 6 AM TO 7 AM'),
    ...fbox([
      ['6 AM → 7 AM', C.cyan],
      ['5 → 25 rentals', DATA_COLOR]
    ])
  );

  const seg78 = makeSegment(7, 8);

  await until(S(9));
  await play(
    new M.Create(seg78),
    ...say('JOIN 7 AM TO 8 AM'),
    ...fbox([
      ['7 AM → 8 AM', C.cyan],
      ['25 → 60 rentals', DATA_COLOR]
    ])
  );

  await until(S(10));
  await play(
    new M.LaggedStart(
      [dot6, dot7, dot8].map(
        d => new M.Indicate(d, {
          color: C.green
        })
      ),
      { lagRatio: 0.22, runTime: 1.65 }
    ),
    ...say('FOLLOW THE CLIMB →', C.green),
    ...fbox([
      ['time moves right', C.cyan],
      ['rentals climb', C.green]
    ], C.green)
  );

  // 11-13: two more points, then connect them.
  await until(S(11));

  const dot9 = makeDot(9);

  await play(
    new M.FadeIn(dot9),
    ...guideFor(9),
    ...say('9 AM: 35 RENTALS', DATA_COLOR),
    ...recordBox(9)
  );

  await until(S(12));

  const dot10 = makeDot(10);

  await play(
    ...clearGuide(),
    new M.FadeIn(dot10),
    ...guideFor(10),
    ...say('10 AM: 15 RENTALS', DATA_COLOR),
    ...recordBox(10)
  );

  const seg89 = makeSegment(8, 9);
  const seg910 = makeSegment(9, 10);

  await until(S(13));
  await play(
    ...clearGuide(),
    new M.LaggedStart(
      [
        new M.Create(seg89),
        new M.Create(seg910)
      ],
      { lagRatio: 0.35, runTime: 1.40 }
    ),
    ...say('JOIN THE DOTS IN TIME ORDER'),
    ...fbox([
      ['8 AM → 9 AM → 10 AM', C.cyan],
      ['60 → 35 → 15', DATA_COLOR]
    ])
  );

  // 14-15: discover the first peak.
  const morningRing = ring(8, C.green, 0.25);

  const morningLabel = textAt(
    '60',
    P ? 19 : 20,
    C.green,
    [X(8), Y(60) + 0.32, 0],
    true
  );

  const morningGuide = dashed(
    xy(8, 0),
    xy(8, 60),
    C.green
  );

  await until(S(14));
  await play(
    new M.Create(morningRing),
    new M.Create(morningGuide),
    new M.FadeIn(morningLabel),
    new M.Indicate(dots.get(7), {
      color: C.cyan
    }),
    new M.Indicate(dots.get(9), {
      color: C.cyan
    }),
    ...say('A HIGH POINT WITH LOWER SIDES', C.green),
    ...fbox([
      ['7 AM: 25', C.muted],
      ['8 AM: 60', C.green],
      ['9 AM: 35', C.muted]
    ], C.green)
  );

  const morningPeak = pill(
    '8 AM PEAK',
    C.green,
    P ? 14 : 16
  );

  morningPeak.moveTo([
    X(8) + (P ? 0.32 : 0.95),
    Y(60) + (P ? 0.65 : 0.35),
    0
  ]);

  await until(S(15));
  await play(
    new M.FadeOut(morningLabel),
    new M.FadeIn(morningPeak),
    ...say('A HIGH POINT IS A PEAK', C.green),
    ...fbox([
      ['PEAK', C.green],
      ['higher than nearby points', C.ink]
    ], C.green)
  );

  // Helpers for the rest of the line chart.
  // Each new observation is followed by a segment from the previous hour.
  function appendHour(h, withGuide = true) {
    const d = makeDot(h);
    const s = makeSegment(h - 1, h);

    const a = [
      ...clearGuide(),

      new M.LaggedStart(
        [
          new M.FadeIn(d),
          new M.Create(s)
        ],
        { lagRatio: 0.25, runTime: 0.95 }
      )
    ];

    if (withGuide) {
      a.push(...guideFor(h));
    }

    return a;
  }

  function appendSeveral(hours, duration = 2.0) {
    const a = clearGuide();
    const sequence = [];

    hours.forEach(h => {
      const d = makeDot(h);
      const s = makeSegment(h - 1, h);

      sequence.push(new M.FadeIn(d));
      sequence.push(new M.Create(s));
    });

    a.push(new M.LaggedStart(
      sequence,
      { lagRatio: 0.38, runTime: duration }
    ));

    return a;
  }

  // 16-18: add the late-morning and afternoon records.
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(
      morningRing,
      morningGuide,
      morningPeak
    )),
    ...appendHour(11),
    ...say('11 AM: 15 RENTALS', DATA_COLOR),
    ...recordBox(11)
  );

  await until(S(17));
  await play(
    ...appendHour(12),
    ...say('NOON: 20 RENTALS', DATA_COLOR),
    ...recordBox(12)
  );

  const middayLabels = [13, 14, 15].map(h =>
    countLabel(h, DATA_COLOR)
  );

  await until(S(18));
  await play(
    ...appendSeveral([13, 14, 15], 2.40),
    new M.LaggedStart(
      middayLabels.map(
        t => new M.FadeIn(t)
      ),
      { lagRatio: 0.38, runTime: 2.40 }
    ),
    ...say('EARLY AFTERNOON: LOW COUNTS', DATA_COLOR),
    ...fbox([
      ['1 PM: 18', DATA_COLOR],
      ['2 PM: 15', DATA_COLOR],
      ['3 PM: 18', DATA_COLOR]
    ], DATA_COLOR)
  );

  // 19: highlight the quiet midday stretch.
  const quietLeft = X(10) - 0.19;
  const quietRight = X(15) + 0.19;
  const quietBottom = Y(15) - 0.24;
  const quietTop = Y(20) + 0.24;

  const quietBox = outline(
    [
      (quietLeft + quietRight) / 2,
      (quietBottom + quietTop) / 2,
      0
    ],
    quietRight - quietLeft,
    quietTop - quietBottom,
    C.cyan
  );

  const quietTag = pill(
    'QUIET HOURS',
    C.cyan,
    P ? 14 : 16
  );

  quietTag.moveTo([
    (X(10) + X(15)) / 2,
    Y(20) + 0.55,
    0
  ]);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...middayLabels)),
    new M.Create(quietBox),
    new M.FadeIn(quietTag),
    ...say('A LOW STRETCH AROUND MIDDAY'),
    ...fbox([
      ['10 AM to 3 PM', C.muted],
      ['15–20 rentals per hour', C.cyan]
    ])
  );

  // 20-23: the evening climb and subsequent fall.
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(
      quietBox,
      quietTag
    )),
    ...appendHour(16),
    ...say('4 PM: 30 RENTALS', DATA_COLOR),
    ...recordBox(16)
  );

  await until(S(21));
  await play(
    ...appendHour(17),
    ...say('5 PM: 55 RENTALS', DATA_COLOR),
    ...recordBox(17)
  );

  await until(S(22));
  await play(
    ...appendHour(18),
    ...say('6 PM: 65 RENTALS', DATA_COLOR),
    ...recordBox(18)
  );

  await until(S(23));
  await play(
    ...appendHour(19),
    ...say('7 PM: 35 RENTALS', DATA_COLOR),
    ...recordBox(19)
  );

  // 24: complete the line chart through 10 PM.
  const eveningLabels = [20, 21, 22].map(h =>
    countLabel(h, DATA_COLOR)
  );

  await until(S(24));
  await play(
    ...appendSeveral([20, 21, 22], 2.40),
    new M.LaggedStart(
      eveningLabels.map(
        t => new M.FadeIn(t)
      ),
      { lagRatio: 0.38, runTime: 2.40 }
    ),
    ...say('RENTALS FALL THROUGH THE EVENING'),
    ...fbox([
      ['8 PM: 20', DATA_COLOR],
      ['9 PM: 10', DATA_COLOR],
      ['10 PM: 5', DATA_COLOR]
    ], DATA_COLOR)
  );

  // 25: discover the evening peak.
  const eveningRing = ring(18, C.green, 0.25);

  const eveningGuide = dashed(
    xy(18, 0),
    xy(18, 65),
    C.green
  );

  const eveningPeak = pill(
    '6 PM PEAK',
    C.green,
    P ? 14 : 16
  );

  eveningPeak.moveTo([
    X(18) - (P ? 0.20 : 0),
    Y(65) + 0.48,
    0
  ]);

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(...eveningLabels)),
    new M.Create(eveningRing),
    new M.Create(eveningGuide),
    new M.FadeIn(eveningPeak),
    ...say('THE SECOND PEAK: 6 PM', C.green),
    ...fbox([
      ['5 PM: 55', C.muted],
      ['6 PM: 65', C.green],
      ['7 PM: 35', C.muted]
    ], C.green)
  );

  // 26: both rush peaks together.
  // Fresh objects are constructed for the morning peak highlight.
  const morningRing2 = ring(8, C.green, 0.25);

  const morningGuide2 = dashed(
    xy(8, 0),
    xy(8, 60),
    C.green
  );

  const morningPeak2 = pill(
    '8 AM PEAK',
    C.green,
    P ? 14 : 16
  );

  morningPeak2.moveTo([
    X(8) + (P ? 0.32 : 0.95),
    Y(60) + (P ? 0.65 : 0.35),
    0
  ]);

  await until(S(26));
  await play(
    new M.Create(morningRing2),
    new M.Create(morningGuide2),
    new M.FadeIn(morningPeak2),
    new M.Indicate(dots.get(18), {
      color: C.green
    }),
    ...say('TWO BUSY PEAKS', C.green),
    ...fbox([
      ['8 AM: 60 rentals', C.green],
      ['6 PM: 65 rentals', C.green],
      ['quiet hours between', C.muted]
    ], C.green)
  );

  // 27: introduce the term line chart.
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(
      morningRing2,
      morningGuide2,
      morningPeak2,
      eveningRing,
      eveningGuide,
      eveningPeak
    )),
    new M.LaggedStart(
      HOURS.slice(0, -1).map(h =>
        new M.Indicate(segments.get(h), {
          color: C.cyan
        })
      ),
      { lagRatio: 0.07, runTime: 2.10 }
    ),
    ...say('THIS IS A LINE CHART', C.green),
    ...fbox([
      ['LINE CHART', C.green],
      ['dots joined in time order', C.ink]
    ], C.green)
  );

  // 28-29: the drawing rule.
  await until(S(28));
  await play(
    new M.Indicate(xRuler, {
      color: C.cyan
    }),
    new M.Indicate(yRuler, {
      color: DATA_COLOR
    }),
    ...say('TIME ACROSS, MEASUREMENT UP'),
    ...fbox([
      ['STEP 1', C.cyan],
      ['time across', C.cyan],
      ['measured number up', DATA_COLOR]
    ])
  );

  await until(S(29));
  await play(
    new M.LaggedStart(
      HOURS.slice(0, -1).map(h =>
        new M.Indicate(segments.get(h), {
          color: C.green
        })
      ),
      { lagRatio: 0.08, runTime: 1.70 }
    ),
    ...say('JOIN EACH DOT TO THE NEXT', C.green),
    ...fbox([
      ['STEP 2', C.green],
      ['join neighbouring dots', C.ink],
      ['follow time order', C.cyan]
    ], C.green)
  );

  // 30: use the observed peaks to plan bike availability.
  const amLeft = X(7) - 0.19;
  const amRight = X(9) + 0.19;

  const pmLeft = X(17) - 0.19;
  const pmRight = X(19) + 0.19;

  const morningWindow = new M.Rectangle({
    width: amRight - amLeft,
    height: Y(70) - Y(0),
    color: C.green,
    strokeWidth: 1.5
  });

  morningWindow.moveTo([
    (amLeft + amRight) / 2,
    (Y(70) + Y(0)) / 2,
    0
  ]);

  const eveningWindow = new M.Rectangle({
    width: pmRight - pmLeft,
    height: Y(70) - Y(0),
    color: C.green,
    strokeWidth: 1.5
  });

  eveningWindow.moveTo([
    (pmLeft + pmRight) / 2,
    (Y(70) + Y(0)) / 2,
    0
  ]);

  const amPlanTag = pill(
    '8 AM',
    C.green,
    P ? 14 : 16
  );

  amPlanTag.moveTo([
    X(8),
    YT + 0.34,
    0
  ]);

  const pmPlanTag = pill(
    '6 PM',
    C.green,
    P ? 14 : 16
  );

  pmPlanTag.moveTo([
    X(18),
    YT + 0.34,
    0
  ]);

  await until(S(30));
  await play(
    new M.Create(morningWindow),
    new M.Create(eveningWindow),
    new M.FadeIn(amPlanTag),
    new M.FadeIn(pmPlanTag),
    ...say('PLAN EXTRA BIKES FOR THE PEAKS', C.green),
    ...fbox([
      ['morning rush: 8 AM', C.green],
      ['evening rush: 6 PM', C.green],
      ['prepare bikes in advance', C.ink]
    ], C.green)
  );

  // 31: the line between dots is not a measurement at every moment.
  const midX = (X(8) + X(9)) / 2;
  const midY = (Y(60) + Y(35)) / 2;

  const unknown = textAt(
    '?',
    P ? 31 : 28,
    C.violet,
    [
      midX + (P ? 0.34 : 0.35),
      midY + 0.12,
      0
    ]
  );

  const betweenPointer = line(
    [midX + 0.23, midY + 0.10, 0],
    [midX + 0.04, midY + 0.02, 0],
    C.violet,
    2
  );

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(
      morningWindow,
      eveningWindow,
      amPlanTag,
      pmPlanTag
    )),
    new M.FadeIn(unknown),
    new M.Create(betweenPointer),
    new M.Indicate(segments.get(8), {
      color: C.violet
    }),
    ...say('THE LINE IS NOT A NEW RECORD', C.violet),
    ...fbox([
      ['between 8 AM and 9 AM', C.muted],
      ['no separate count here', C.violet],
      ['the line joins records', C.ink]
    ], C.violet)
  );

  // 32: one observation represents a whole hour.
  const recordedRing = ring(8, C.amber, 0.24);

  const wholeHourTag = pill(
    'ONE HOURLY COUNT',
    DATA_COLOR,
    P ? 14 : 16
  );

  wholeHourTag.moveTo([
    X(8) + (P ? 0.70 : 1.45),
    Y(60) + (P ? 0.57 : 0.35),
    0
  ]);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(
      unknown,
      betweenPointer
    )),
    new M.Create(recordedRing),
    new M.FadeIn(wholeHourTag),
    ...say('ONE DOT = ONE WHOLE HOUR', DATA_COLOR),
    ...fbox([
      ['8 AM record', C.muted],
      ['60 bikes rented', DATA_COLOR],
      ['count for the whole hour', C.ink]
    ], DATA_COLOR)
  );

  // 33: distinguish the measured dots from the visual connection.
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(
      recordedRing,
      wholeHourTag
    )),
    new M.LaggedStart(
      [
        new M.Indicate(dots.get(8), {
          color: DATA_COLOR
        }),
        new M.Indicate(segments.get(8), {
          color: C.cyan
        }),
        new M.Indicate(dots.get(9), {
          color: DATA_COLOR
        })
      ],
      { lagRatio: 0.28, runTime: 1.85 }
    ),
    ...say('THE LINE GUIDES YOUR EYE'),
    ...fbox([
      ['dot = recorded count', DATA_COLOR],
      ['line = visual connection', C.cyan]
    ])
  );

  // 34: final definition with the complete line chart.
  const finalMorningRing = ring(8, C.green, 0.23);
  const finalEveningRing = ring(18, C.green, 0.23);

  const finalMorningTag = pill(
    '8 AM · 60',
    C.green,
    P ? 14 : 16
  );

  finalMorningTag.moveTo([
    X(8) + (P ? 0.32 : 0.95),
    Y(60) + (P ? 0.65 : 0.35),
    0
  ]);

  const finalEveningTag = pill(
    '6 PM · 65',
    C.green,
    P ? 14 : 16
  );

  finalEveningTag.moveTo([
    X(18) - (P ? 0.20 : 0),
    Y(65) + 0.48,
    0
  ]);

  await until(S(34));
  await play(
    new M.Create(finalMorningRing),
    new M.Create(finalEveningRing),
    new M.FadeIn(finalMorningTag),
    new M.FadeIn(finalEveningTag),
    new M.LaggedStart(
      HOURS.map(h =>
        new M.Indicate(dots.get(h), {
          color: DATA_COLOR
        })
      ),
      { lagRatio: 0.06, runTime: 2.20 }
    ),
    ...say('LINE CHART: SEE RISES AND FALLS', C.green),
    ...fbox([
      ['LINE CHART', C.green],
      ['join dots in time order', C.ink],
      ['see rises, falls and peaks', C.cyan]
    ], C.green)
  );
}
