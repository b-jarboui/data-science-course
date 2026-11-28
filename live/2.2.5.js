// lesson 2.2.5
// Heatmaps: using colour to see patterns across days and hours.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Data note: the shared chapter specifies weekday rush peaks at
// 08:00 and 18:00, and a broad weekend peak around 12:00–16:00,
// reaching approximately 45 rentals.
// Exact weekly means and individual Monday samples are not supplied.
// The illustrative values below preserve the specified patterns.
// The missing Sunday record is also an illustrative example.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data and illustrative weekly means.
  const DAYS = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  ];

  const HOURS = Array.from(
    { length: 17 },
    (_, k) => k + 6
  );

  // The supplied weekday profile, reused as an illustrative
  // mean profile rather than claimed as observed weekly means.
  const WEEKDAY = [
    5, 25, 60, 35, 15, 15, 20, 18, 15,
    18, 30, 55, 65, 35, 20, 10, 5
  ];

  // Illustrative weekend profiles.
  // Broad midday peaks, with a maximum of approximately 45.
  const SATURDAY = [
    4, 7, 12, 18, 25, 34, 40, 44, 45,
    44, 40, 33, 25, 18, 12, 7, 4
  ];

  const SUNDAY = [
    3, 6, 10, 16, 23, 32, 39, 43, 45,
    43, 39, 31, 24, 17, 11, 6, null
  ];

  const DATA = [
    WEEKDAY.slice(),
    WEEKDAY.slice(),
    WEEKDAY.slice(),
    WEEKDAY.slice(),
    WEEKDAY.slice(),
    SATURDAY,
    SUNDAY
  ];

  // Illustrative Monday 08:00 samples.
  // Their mean matches the Monday 08:00 heatmap cell.
  const MONDAY_SAMPLES = [55, 60, 65];

  const SAMPLE_SUM = MONDAY_SAMPLES.reduce(
    (a, b) => a + b,
    0
  );

  const SAMPLE_MEAN =
    SAMPLE_SUM / MONDAY_SAMPLES.length;

  const MAX = 65;

  // Chapter colours.
  const WEEKDAY_COLOR = C.amber;
  const WEEKEND_COLOR = C.pink || '#F472B6';

  // One colour scale for every heatmap cell.
  const LOW = '#102537';
  const HIGH = '#38E8FF';
  const EMPTY = '#0B1420';

  // Laptop and phone layouts.
  const CX = P ? 0 : -2.15;

  const PILL = P
    ? [0, 2.40, 0]
    : [CX, 2.07, 0];

  const BOXP = P
    ? [0, 3.48, 0]
    : [4.45, -0.15, 0];

  const DX = P ? 0.355 : 0.435;
  const DY = P ? 0.605 : 0.435;

  const CW = DX * 0.91;
  const CH = DY * 0.88;

  const FIRST_X = P ? -2.65 : -5.65;
  const FIRST_Y = P ? 1.05 : 0.92;

  const X = h => FIRST_X + (h - 6) * DX;
  const Y = d => FIRST_Y - d * DY;

  const pos = (d, h) => [
    X(h),
    Y(d),
    0
  ];

  const GRID_LEFT = X(6) - CW / 2;
  const GRID_RIGHT = X(22) + CW / 2;
  const GRID_TOP = Y(0) + CH / 2;
  const GRID_BOTTOM = Y(6) - CH / 2;

  const GRID_CX = (GRID_LEFT + GRID_RIGHT) / 2;

  const GRID_CY = (GRID_TOP + GRID_BOTTOM) / 2;

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

  function outline(p, w, h, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.08,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);
    return r;
  }

  function fadeAll(objects) {
    return objects.map(o => new M.FadeOut(o));
  }

  function indicateAll(objects, color, duration = 1.30) {
    return new M.LaggedStart(
      objects.map(o =>
        new M.Indicate(o, { color })
      ),
      {
        lagRatio: 0.08,
        runTime: duration
      }
    );
  }

  // Information and formula box.
  // Matches the approved reference lesson's structure.
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

    const charWidth =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      charWidth * (
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
      const ind = charWidth * (
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

    const maxw = P ? FW - 1.10 : 3.85;
    const maxh = P ? 1.40 : 2.50;

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

  // Continuous colour interpolation.
  // Zero is a dark coloured tile.
  // Missing data is a separate, unfilled tile.
  function mixHex(a, b, t) {
    const aa = a.replace('#', '');
    const bb = b.replace('#', '');

    const parts = [0, 2, 4].map(i => {
      const av = parseInt(aa.slice(i, i + 2), 16);
      const bv = parseInt(bb.slice(i, i + 2), 16);

      const v = Math.round(av + (bv - av) * t);

      return v.toString(16).padStart(2, '0');
    });

    return `#${parts.join('')}`;
  }

  function shade(value) {
    if (value === null) return EMPTY;

    const fraction = Math.max(
      0,
      Math.min(1, value / MAX)
    );

    return mixHex(LOW, HIGH, fraction);
  }

  function cellValue(d, h) {
    return DATA[d][h - 6];
  }

  // Bicycle icon.
  function bike(cx, cy, scale = 1, color = C.cyan) {
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

  // Weekly calendar icon.
  function calendar(cx, cy, scale = 1) {
    const w = 2.05 * scale;
    const h = 1.65 * scale;

    const frame = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color: C.amber,
      strokeWidth: 2
    });

    frame.setFill(C.card, 0.95);
    frame.moveTo([cx, cy, 0]);

    const header = new M.Rectangle({
      width: w * 0.95,
      height: 0.33 * scale,
      color: C.amber,
      strokeWidth: 1
    });

    header.setFill(C.amber, 0.75);

    header.moveTo([
      cx,
      cy + h / 2 - 0.20 * scale,
      0
    ]);

    const binding = [-0.58, 0.58].map(x =>
      line(
        [
          cx + x * scale,
          cy + h / 2 - 0.05 * scale,
          0
        ],
        [
          cx + x * scale,
          cy + h / 2 + 0.15 * scale,
          0
        ],
        C.ink,
        4
      )
    );

    const tiles = Array.from(
      { length: 7 },
      (_, k) => {
        const col = k < 4 ? k : k - 4;
        const row = k < 4 ? 0 : 1;
        const count = row === 0 ? 4 : 3;

        const color = k < 5
          ? WEEKDAY_COLOR
          : WEEKEND_COLOR;

        const r = new M.Rectangle({
          width: 0.33 * scale,
          height: 0.29 * scale,
          color,
          strokeWidth: 1
        });

        r.setFill(color, 0.45);

        r.moveTo([
          cx + (col - (count - 1) / 2) * 0.41 * scale,
          cy + (0.08 - row * 0.40) * scale,
          0
        ]);

        return r;
      }
    );

    return new M.VGroup(
      frame,
      header,
      ...binding,
      ...tiles
    );
  }

  // 0-1: introduce the practical question.
  const introY = P ? -0.50 : -0.40;

  const bicycle = bike(
    CX - 1.40,
    introY,
    P ? 1.05 : 1.00
  );

  const calendarIcon = calendar(
    CX + 1.65,
    introY + 0.12,
    P ? 1.05 : 1.00
  );

  const introLabel = textAt(
    'ONE WEEK AT THE BIKE STATION',
    P ? 21 : 20,
    C.ink,
    [CX, introY - 1.55, 0]
  );

  await until(S(0));
  await play(
    new M.FadeIn(bicycle),
    new M.FadeIn(calendarIcon),
    new M.FadeIn(introLabel),
    ...say('FIND THE BUSY HOURS OF THE WEEK')
  );

  await until(S(1));
  await play(
    new M.Indicate(calendarIcon, {
      color: C.amber
    }),
    ...say('WHEN SHOULD WE BRING EXTRA BIKES?', C.amber),
    ...fbox([
      ['7 days', C.ink],
      ['many hourly records', C.ink],
      ['where are the busy times?', C.amber]
    ], C.amber)
  );

  // Heatmap cells.
  // Each square is its own mobject.
  // No visible cells are subsequently wrapped in a VGroup.
  function makeCell(d, h, value = null, filled = false) {
    const r = new M.Rectangle({
      width: CW,
      height: CH,
      color: filled && value !== null
        ? shade(value)
        : C.muted,
      strokeWidth: filled ? 1 : 1.2
    });

    if (filled && value !== null) {
      r.setFill(shade(value), 1);
    } else {
      r.setFill(EMPTY, 0.55);
    }

    r.moveTo(pos(d, h));

    return r;
  }

  const cells = DAYS.map((_, d) =>
    HOURS.map(h => makeCell(d, h))
  );

  const filled = DAYS.map(() =>
    HOURS.map(() => false)
  );

  function cell(d, h) {
    return cells[d][h - 6];
  }

  function fillCell(d, h) {
    const k = h - 6;
    const value = DATA[d][k];

    if (value === null || filled[d][k]) {
      return [];
    }

    filled[d][k] = true;

    return [
      new M.Transform(
        cells[d][k],
        makeCell(d, h, value, true)
      )
    ];
  }

  function rowOutline(d, color = C.amber) {
    return outline(
      [GRID_CX, Y(d), 0],
      GRID_RIGHT - GRID_LEFT + 0.08,
      CH + 0.10,
      color
    );
  }

  function columnOutline(
    h,
    firstDay = 0,
    lastDay = 6,
    color = C.amber
  ) {
    return outline(
      [
        X(h),
        (Y(firstDay) + Y(lastDay)) / 2,
        0
      ],
      CW + 0.10,
      Math.abs(Y(firstDay) - Y(lastDay)) + CH + 0.10,
      color
    );
  }

  function cellOutline(d, h, color = C.amber) {
    return outline(
      pos(d, h),
      CW + 0.11,
      CH + 0.11,
      color
    );
  }

  const dayLabels = DAYS.map((day, d) =>
    textAt(
      day,
      P ? 16 : 16,
      d < 5 ? WEEKDAY_COLOR : WEEKEND_COLOR,
      [
        GRID_LEFT - (P ? 0.46 : 0.49),
        Y(d),
        0
      ],
      true
    )
  );

  const hourLabels = HOURS.map(h =>
    textAt(
      String(h).padStart(2, '0'),
      P ? 12 : 13,
      C.muted,
      [
        X(h),
        GRID_TOP + (
          P
            ? (h % 2 === 0 ? 0.19 : 0.39)
            : 0.23
        ),
        0
      ],
      true
    )
  );

  const timeTitle = textAt(
    'Hour of day',
    P ? 18 : 17,
    C.ink,
    [
      GRID_CX,
      GRID_TOP + (P ? 0.68 : 0.47),
      0
    ]
  );

  // Persistent label distinguishes illustrative values from records.
  const dataNote = textAt(
    'Illustrative weekly means',
    P ? 14 : 13,
    C.muted,
    P
      ? [GRID_CX, GRID_BOTTOM - 0.28, 0]
      : [GRID_RIGHT + 0.05, -2.42, 0]
  );

  // 2: records of individual hours.
  const recordY = P ? -0.55 : -0.40;

  const recordTiles = [6, 7, 8, 9, 10].map((h, k) => {
    const x = CX + (k - 2) * (P ? 1.04 : 1.12);

    const r = new M.RoundedRectangle({
      width: P ? 0.94 : 1.00,
      height: 1.10,
      cornerRadius: 0.12,
      color: C.cyan,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.90);
    r.moveTo([x, recordY, 0]);

    const hour = textAt(
      `${String(h).padStart(2, '0')}:00`,
      P ? 15 : 16,
      C.ink,
      [x, recordY + 0.27, 0],
      true
    );

    const d = new M.Dot({
      point: [x, recordY - 0.20, 0],
      radius: 0.09,
      color: C.cyan
    });

    d.setFill(C.cyan, 1);

    return new M.VGroup(r, hour, d);
  });

  const recordNote = textAt(
    'One count for each recorded hour',
    P ? 19 : 18,
    C.muted,
    [CX, recordY - 0.91, 0]
  );

  await until(S(2));
  await play(
    ...fadeAll([
      bicycle,
      calendarIcon,
      introLabel
    ]),

    new M.LaggedStart(
      recordTiles.map(r => new M.FadeIn(r)),
      {
        lagRatio: 0.12,
        runTime: 1.35
      }
    ),

    new M.FadeIn(recordNote),

    ...say('ONE RENTAL COUNT PER HOUR'),

    ...fbox([
      ['day', WEEKDAY_COLOR],
      ['hour', C.cyan],
      ['number of rentals', C.ink]
    ])
  );

  // 3: draw Monday's empty row.
  await until(S(3));
  await play(
    ...fadeAll([
      ...recordTiles,
      recordNote
    ]),

    new M.FadeIn(dayLabels[0]),

    new M.LaggedStart(
      cells[0].map(r => new M.FadeIn(r)),
      {
        lagRatio: 0.07,
        runTime: 1.50
      }
    ),

    ...say('START WITH MONDAY', WEEKDAY_COLOR),

    ...fbox([
      ['Monday', WEEKDAY_COLOR],
      ['one row of empty squares', C.ink]
    ], WEEKDAY_COLOR)
  );

  // 4: put the hours above the squares.
  await until(S(4));
  await play(
    new M.LaggedStart(
      hourLabels.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.06,
        runTime: 1.35
      }
    ),

    new M.FadeIn(timeTitle),

    ...say('EARLY → LATE'),

    ...fbox([
      ['each square = one hour', C.cyan],
      ['06:00 → 22:00', C.ink]
    ])
  );

  // 5: add the other six days.
  const remainingRows = DAYS.slice(1).map(
    (_, k) => {
      const d = k + 1;

      return new M.LaggedStart(
        [
          new M.FadeIn(dayLabels[d]),
          ...cells[d].map(r => new M.FadeIn(r))
        ],
        {
          lagRatio: 0.025,
          runTime: 0.80
        }
      );
    }
  );

  await until(S(5));
  await play(
    new M.LaggedStart(
      remainingRows,
      {
        lagRatio: 0.19,
        runTime: 2.00
      }
    ),

    new M.FadeIn(dataNote),

    ...say('SEVEN ROWS: MONDAY TO SUNDAY'),

    ...fbox([
      ['7 days', C.ink],
      ['17 hours per day', C.cyan],
      ['one square per day + hour', C.green]
    ], C.green)
  );

  // 6: across a row means moving through one day.
  const mondayRow = rowOutline(0, WEEKDAY_COLOR);

  await until(S(6));
  await play(
    new M.Create(mondayRow),

    indicateAll(
      cells[0],
      WEEKDAY_COLOR,
      1.45
    ),

    ...say('ACROSS A ROW: ONE DAY THROUGH TIME', WEEKDAY_COLOR),

    ...fbox([
      ['Monday', WEEKDAY_COLOR],
      ['06:00 → 22:00', C.cyan]
    ], WEEKDAY_COLOR)
  );

  // 7: down a column compares the same hour.
  const eightColumn = columnOutline(
    8,
    0,
    6,
    C.cyan
  );

  await until(S(7));
  await play(
    new M.FadeOut(mondayRow),
    new M.Create(eightColumn),

    indicateAll(
      DAYS.map((_, d) => cell(d, 8)),
      C.cyan,
      1.40
    ),

    ...say('DOWN A COLUMN: THE SAME HOUR'),

    ...fbox([
      ['08:00', C.cyan],
      ['Mon to Sun', C.ink],
      ['compare different days', C.green]
    ], C.green)
  );

  // 8: each cell stores one number.
  const mon8Outline = cellOutline(
    0,
    8,
    C.amber
  );

  await until(S(8));
  await play(
    new M.FadeOut(eightColumn),
    new M.Create(mon8Outline),

    ...say('EACH SQUARE HOLDS ONE NUMBER', C.amber),

    ...fbox([
      ['Monday', WEEKDAY_COLOR],
      ['08:00', C.cyan],
      ['mean rental count = ?', C.amber]
    ], C.amber)
  );

  // 9-12: calculate an illustrative Monday 08:00 mean.
  // Use the free lower part of the screen for a small example
  // on phone, and the information box on laptop.

  function sampleCard(k, n) {
    const x = P
      ? (k - 1) * 1.65
      : 4.45 + (k - 1) * 1.08;

    const y = P ? -3.92 : -1.76;

    const width = P ? 1.40 : 0.96;
    const height = P ? 0.91 : 0.80;

    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.10,
      color: C.amber,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.98);
    r.moveTo([x, y, 0]);

    const lab = textAt(
      `Mon ${k + 1}`,
      P ? 14 : 13,
      C.muted,
      [x, y + 0.19, 0],
      true
    );

    const val = textAt(
      String(n),
      P ? 23 : 21,
      C.amber,
      [x, y - 0.16, 0],
      true
    );

    return new M.VGroup(r, lab, val);
  }

  const sampleCards = MONDAY_SAMPLES.map(
    (n, k) => sampleCard(k, n)
  );

  const sampleNote = textAt(
    'Example counts at 08:00',
    P ? 15 : 13,
    C.muted,
    [
      P ? 0 : 4.45,
      P ? -4.57 : -2.38,
      0
    ]
  );

  await until(S(9));
  await play(
    new M.LaggedStart(
      sampleCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.18,
        runTime: 1.40
      }
    ),

    new M.FadeIn(sampleNote),

    ...say('GATHER COUNTS FROM THE SAME HOUR', C.amber),

    ...fbox([
      ['Monday at 08:00', C.amber],
      ['illustrative counts', C.muted],
      ['55, 60, 65', C.ink]
    ], C.amber)
  );

  await until(S(10));
  await play(
    ...fbox([
      ['add the counts', C.amber],
      [`55 + 60 + 65 = ${SAMPLE_SUM}`, C.ink]
    ], C.amber),

    ...say('STEP 1: ADD', C.amber)
  );

  await until(S(11));
  await play(
    ...fbox([
      [`total = ${SAMPLE_SUM}`, C.ink],
      ['Mondays = 3', C.muted],
      ['180 ÷ 3', C.green]
    ], C.green),

    ...say('STEP 2: DIVIDE BY HOW MANY', C.green)
  );

  const equalSamples = [
    sampleCard(0, SAMPLE_MEAN),
    sampleCard(1, SAMPLE_MEAN),
    sampleCard(2, SAMPLE_MEAN)
  ];

  await until(S(12));
  await play(
    new M.LaggedStart(
      sampleCards.map((card, k) =>
        new M.Transform(card, equalSamples[k])
      ),
      {
        lagRatio: 0.13,
        runTime: 1.40
      }
    ),

    ...say('MEAN = THE FAIR SHARE', C.green),

    ...fbox([
      ['sum   = 180', C.ink],
      ['count = 3', C.muted],
      ['180 ÷ 3 = 60', C.green],
      ['mean = 60 rentals', C.green]
    ], C.green)
  );

  // 13: colour the Monday 08:00 cell according to its mean.
  const mon8Number = textAt(
    '60',
    P ? 15 : 15,
    '#08131F',
    pos(0, 8),
    true
  );

  await until(S(13));
  await play(
    ...fadeAll([
      ...sampleCards,
      sampleNote
    ]),

    ...fillCell(0, 8),

    new M.FadeIn(mon8Number),

    ...say('60 RENTALS → A BRIGHT TILE'),

    ...fbox([
      ['Monday 08:00', C.amber],
      ['mean = 60', C.green],
      ['colour represents 60', C.cyan]
    ])
  );

  // 14-15: low values are dark; high values are bright.
  const lowOutline = cellOutline(
    0,
    6,
    C.amber
  );

  await until(S(14));
  await play(
    new M.FadeOut(mon8Outline),
    new M.FadeOut(mon8Number),

    ...fillCell(0, 6),

    new M.Create(lowOutline),

    ...say('LOW COUNT = DARK SHADE'),

    ...fbox([
      ['Monday 06:00', C.muted],
      ['5 rentals', C.ink],
      ['dark shade', C.cyan]
    ])
  );

  const highOutline = cellOutline(
    0,
    18,
    C.amber
  );

  await until(S(15));
  await play(
    new M.FadeOut(lowOutline),

    ...fillCell(0, 18),

    new M.Create(highOutline),

    ...say('HIGH COUNT = BRIGHT SHADE'),

    ...fbox([
      ['Monday 18:00', C.muted],
      ['65 rentals', C.ink],
      ['bright shade', C.cyan]
    ])
  );

  // 16: reveal the rest of the recorded-value tiles.
  // Missing data stays blank.
  function fillRow(d) {
    const animations = HOURS.flatMap(
      h => fillCell(d, h)
    );

    return new M.LaggedStart(
      animations,
      {
        lagRatio: 0.025,
        runTime: 1.00
      }
    );
  }

  await until(S(16));

  const fillRows = DAYS.map(
    (_, d) => fillRow(d)
  );

  await play(
    new M.FadeOut(highOutline),

    new M.LaggedStart(
      fillRows,
      {
        lagRatio: 0.17,
        runTime: 2.65
      }
    ),

    ...say('BUSIER HOURS GLOW MORE BRIGHTLY'),

    ...fbox([
      ['one tile = one mean', C.ink],
      ['low → dark', C.muted],
      ['high → bright', C.cyan]
    ])
  );

  // 17-20: construct a common colour key.
  const KEY_VALUES = [0, 15, 30, 45, 65];

  const KEY_Y = P ? -4.00 : -2.42;

  const KEY_SW = P ? 0.70 : 0.72;
  const KEY_SH = P ? 0.29 : 0.23;
  const KEY_SP = P ? 0.83 : 0.86;

  const keyX = k =>
    GRID_CX + (k - 2.5) * KEY_SP;

  function keyTile(value, k) {
    const x = keyX(k);

    const r = new M.Rectangle({
      width: KEY_SW,
      height: KEY_SH,
      color: value === null
        ? C.muted
        : shade(value),
      strokeWidth: 1.5
    });

    if (value === null) {
      r.setFill(EMPTY, 0.55);
    } else {
      r.setFill(shade(value), 1);
    }

    r.moveTo([x, KEY_Y, 0]);

    const lab = textAt(
      value === null ? 'blank' : String(value),
      P ? 15 : 14,
      C.muted,
      [x, KEY_Y - 0.26, 0],
      true
    );

    return new M.VGroup(r, lab);
  }

  const keyTiles = KEY_VALUES.map(
    (n, k) => keyTile(n, k)
  );

  const keyTitle = textAt(
    'Mean bikes rented',
    P ? 17 : 15,
    C.ink,
    [
      GRID_CX,
      KEY_Y + (P ? 0.40 : 0.28),
      0
    ]
  );

  await until(S(17));
  await play(
    new M.FadeIn(keyTitle),

    new M.LaggedStart(
      keyTiles.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.13,
        runTime: 1.35
      }
    ),

    ...say('MATCH THE SHADE TO A NUMBER'),

    ...fbox([
      ['dark = fewer rentals', C.muted],
      ['bright = more rentals', C.cyan],
      ['read the scale', C.ink]
    ])
  );

  const keyOutline = outline(
    [
      (keyX(0) + keyX(4)) / 2,
      KEY_Y - 0.08,
      0
    ],
    keyX(4) - keyX(0) + KEY_SW + 0.13,
    P ? 0.78 : 0.66,
    C.green
  );

  await until(S(18));
  await play(
    new M.Create(keyOutline),

    ...say('THIS STRIP IS THE COLOR KEY', C.green),

    ...fbox([
      ['COLOR KEY', C.green],
      ['connects colours to values', C.ink]
    ], C.green)
  );

  // 19: one colour key applies to the whole heatmap.
  const gridOutline = outline(
    [GRID_CX, GRID_CY, 0],
    GRID_RIGHT - GRID_LEFT + 0.13,
    GRID_TOP - GRID_BOTTOM + 0.13,
    C.green
  );

  await until(S(19));
  await play(
    new M.FadeOut(keyOutline),
    new M.Create(gridOutline),

    ...say('ONE COLOR KEY FOR EVERY SQUARE', C.green),

    ...fbox([
      ['same value', C.ink],
      ['same shade', C.cyan],
      ['any day, any hour', C.green]
    ], C.green)
  );

  // 20: missing data is not zero.
  // Sunday 22:00 is deliberately blank as an illustrative example.
  const missingKey = keyTile(null, 5);

  const missingOutline = cellOutline(
    6,
    22,
    C.violet
  );

  const missingNote = textAt(
    'Blank = no record',
    P ? 15 : 13,
    C.violet,
    [
      GRID_CX,
      KEY_Y - (P ? 0.70 : 0.51),
      0
    ]
  );

  await until(S(20));
  await play(
    new M.FadeOut(gridOutline),

    new M.Create(missingOutline),

    new M.FadeIn(missingKey),
    new M.FadeIn(missingNote),

    ...say('BLANK MEANS NO RECORD', C.violet),

    ...fbox([
      ['example: Sun 22:00', C.muted],
      ['blank = no recorded value', C.violet],
      ['not the same as zero', C.ink]
    ], C.violet)
  );

  // 21-22: read Monday at 08:00 using its row and column.
  const readRow = rowOutline(
    0,
    WEEKDAY_COLOR
  );

  const readCol = columnOutline(
    8,
    0,
    6,
    C.cyan
  );

  const readCell = cellOutline(
    0,
    8,
    C.green
  );

  const readDay = dayLabels[0];
  const readHour = hourLabels[2];

  await until(S(21));
  await play(
    new M.FadeOut(missingOutline),

    new M.Indicate(readDay, {
      color: WEEKDAY_COLOR
    }),

    new M.Indicate(readHour, {
      color: C.cyan
    }),

    new M.Create(readRow),
    new M.Create(readCol),

    ...say('FIND MONDAY AND 08:00'),

    ...fbox([
      ['row    = Monday', WEEKDAY_COLOR],
      ['column = 08:00', C.cyan]
    ])
  );

  const readNumber = textAt(
    String(cellValue(0, 8)),
    P ? 15 : 15,
    '#08131F',
    pos(0, 8),
    true
  );

  await until(S(22));
  await play(
    new M.Create(readCell),
    new M.FadeIn(readNumber),

    ...say('READ THE SQUARE WHERE THEY MEET', C.green),

    ...fbox([
      ['Monday at 08:00', C.ink],
      ['mean = 60 rentals', C.green]
    ], C.green)
  );

  // 23: follow a weekday row from morning to evening.
  const weekdayRow = rowOutline(
    2,
    WEEKDAY_COLOR
  );

  await until(S(23));
  await play(
    ...fadeAll([
      readRow,
      readCol,
      readCell,
      readNumber
    ]),

    new M.Create(weekdayRow),

    ...say('FOLLOW ONE WEEKDAY →', WEEKDAY_COLOR),

    ...fbox([
      ['Wednesday', WEEKDAY_COLOR],
      ['early morning to night', C.ink]
    ], WEEKDAY_COLOR)
  );

  // 24: bright morning rush cell.
  const morningCell = cellOutline(
    2,
    8,
    C.amber
  );

  await until(S(24));
  await play(
    new M.Create(morningCell),

    ...say('08:00: A BRIGHT MORNING SQUARE', C.amber),

    ...fbox([
      ['08:00', C.amber],
      ['morning rush', C.ink],
      ['high rental count', C.cyan]
    ], C.amber)
  );

  // 25: bright evening rush cell.
  const eveningCell = cellOutline(
    2,
    18,
    C.amber
  );

  await until(S(25));
  await play(
    new M.Create(eveningCell),

    ...say('18:00: A BRIGHT EVENING SQUARE', C.amber),

    ...fbox([
      ['08:00: morning rush', C.amber],
      ['18:00: evening rush', C.amber],
      ['two busy times', C.green]
    ], C.green)
  );

  // 26: turn attention from the row to the rush-hour columns.
  const morningBand = columnOutline(
    8,
    0,
    4,
    C.amber
  );

  const eveningBand = columnOutline(
    18,
    0,
    4,
    C.amber
  );

  await until(S(26));
  await play(
    ...fadeAll([
      weekdayRow,
      morningCell,
      eveningCell
    ]),

    new M.Create(morningBand),
    new M.Create(eveningBand),

    ...say('LOOK DOWN THE TWO COLUMNS', C.amber)
  );

  // 27: the two bright weekday bands.
  const morningCells = Array.from(
    { length: 5 },
    (_, d) => cell(d, 8)
  );

  const eveningCells = Array.from(
    { length: 5 },
    (_, d) => cell(d, 18)
  );

  await until(S(27));
  await play(
    indicateAll(
      morningCells,
      C.amber,
      1.50
    ),

    indicateAll(
      eveningCells,
      C.amber,
      1.50
    ),

    ...say('TWO BRIGHT BANDS ACROSS WEEKDAYS', C.amber),

    ...fbox([
      ['Monday to Friday', WEEKDAY_COLOR],
      ['08:00 and 18:00', C.cyan],
      ['repeated rush-hour pattern', C.green]
    ], C.green)
  );

  // 28: the weekend pattern is different.
  const weekendLeft = X(12) - CW / 2;
  const weekendRight = X(16) + CW / 2;

  const weekendTop = Y(5) + CH / 2;
  const weekendBottom = Y(6) - CH / 2;

  const weekendBand = outline(
    [
      (weekendLeft + weekendRight) / 2,
      (weekendTop + weekendBottom) / 2,
      0
    ],
    weekendRight - weekendLeft + 0.12,
    weekendTop - weekendBottom + 0.12,
    WEEKEND_COLOR
  );

  const weekendCells = [5, 6].flatMap(d =>
    [12, 13, 14, 15, 16].map(h =>
      cell(d, h)
    )
  );

  await until(S(28));
  await play(
    new M.FadeOut(morningBand),
    new M.FadeOut(eveningBand),

    new M.Create(weekendBand),

    indicateAll(
      weekendCells,
      WEEKEND_COLOR,
      1.75
    ),

    ...say('WEEKENDS: A WIDER MIDDAY GLOW', WEEKEND_COLOR),

    ...fbox([
      ['Saturday + Sunday', WEEKEND_COLOR],
      ['around 12:00–16:00', C.cyan],
      ['one broad busy period', C.ink]
    ], WEEKEND_COLOR)
  );

  // 29: weekend peak is approximately 45 rentals.
  const saturdayPeak = cellOutline(
    5,
    14,
    C.green
  );

  const sundayPeak = cellOutline(
    6,
    14,
    C.green
  );

  const weekendNumberLabels = [5, 6].map(d =>
    textAt(
      String(cellValue(d, 14)),
      P ? 15 : 15,
      '#08131F',
      pos(d, 14),
      true
    )
  );

  await until(S(29));
  await play(
    new M.Create(saturdayPeak),
    new M.Create(sundayPeak),

    ...weekendNumberLabels.map(
      t => new M.FadeIn(t)
    ),

    new M.Indicate(keyTiles[3], {
      color: C.green
    }),

    ...say('WEEKEND MAXIMUM: ABOUT 45', WEEKEND_COLOR),

    ...fbox([
      ['brightest weekend tiles', WEEKEND_COLOR],
      ['about 45 rentals', C.cyan],
      ['read the same color key', C.green]
    ], C.green)
  );

  // 30: introduce the term heatmap.
  await until(S(30));
  await play(
    ...fadeAll([
      weekendBand,
      saturdayPeak,
      sundayPeak,
      ...weekendNumberLabels
    ]),

    ...say('THIS PICTURE IS A HEATMAP', C.green),

    ...fbox([
      ['HEATMAP', C.green],
      ['a grid of numbers', C.ink],
      ['shown using colour', C.cyan]
    ], C.green)
  );

  // 31-32: the drawing rule in words.
  await until(S(31));
  await play(
    ...say('THE RULE IN THREE PARTS', C.green),

    ...fbox([
      ['row', WEEKDAY_COLOR],
      ['column', C.cyan],
      ['colour', C.green]
    ], C.green)
  );

  const ruleRow = rowOutline(
    0,
    WEEKDAY_COLOR
  );

  const ruleColumn = columnOutline(
    8,
    0,
    6,
    C.cyan
  );

  const ruleCell = cellOutline(
    0,
    8,
    C.green
  );

  await until(S(32));
  await play(
    new M.Create(ruleRow),
    new M.Create(ruleColumn),
    new M.Create(ruleCell),

    ...say('ROW + COLUMN + COLOR', C.green),

    ...fbox([
      ['row    = day', WEEKDAY_COLOR],
      ['column = hour', C.cyan],
      ['colour = mean count', C.green]
    ], C.green)
  );

  // 33: identify busy and quiet times in one view.
  const busyMorning = columnOutline(
    8,
    0,
    4,
    C.green
  );

  const busyEvening = columnOutline(
    18,
    0,
    4,
    C.green
  );

  const quietMorning = columnOutline(
    6,
    0,
    6,
    C.muted
  );

  await until(S(33));
  await play(
    ...fadeAll([
      ruleRow,
      ruleColumn,
      ruleCell
    ]),

    new M.Create(busyMorning),
    new M.Create(busyEvening),
    new M.Create(quietMorning),

    ...say('BUSY AND QUIET TIMES IN ONE VIEW', C.green),

    ...fbox([
      ['busy = bright', C.cyan],
      ['quiet = dark', C.muted],
      ['spot the weekly pattern', C.green]
    ], C.green)
  );

  // 34-36: similar colours need not mean identical counts.
  // Compare Monday 08:00 = 60 with Monday 17:00 = 55.
  const closeA = cellOutline(
    0,
    8,
    C.amber
  );

  const closeB = cellOutline(
    0,
    17,
    C.amber
  );

  // Enlarged swatches show how similar these two shades are.
  function compareSwatch(value, index) {
    const x = P
      ? (index - 0.5) * 1.18
      : 4.45 + (index - 0.5) * 1.15;

    const y = P ? -5.00 : -1.95;

    const r = new M.Rectangle({
      width: 0.95,
      height: P ? 0.47 : 0.55,
      color: shade(value),
      strokeWidth: 1
    });

    r.setFill(shade(value), 1);
    r.moveTo([x, y, 0]);

    return r;
  }

  const closeValues = [
    cellValue(0, 8),
    cellValue(0, 17)
  ];

  const closeSwatches = closeValues.map(
    (v, k) => compareSwatch(v, k)
  );

  await until(S(34));
  await play(
    ...fadeAll([
      busyMorning,
      busyEvening,
      quietMorning
    ]),

    new M.Create(closeA),
    new M.Create(closeB),

    ...say('COMMON TRAP: READING EXACT COUNTS FROM COLOR', C.violet),

    ...fbox([
      ['compare two bright tiles', C.ink],
      ['are their values equal?', C.violet]
    ], C.violet)
  );

  // Keep the phone swatches within its safe content area.
  const swatchNumbers = closeValues.map(
    (value, k) => {
      const x = P
        ? (k - 0.5) * 1.18
        : 4.45 + (k - 0.5) * 1.15;

      return textAt(
        String(value),
        P ? 20 : 21,
        '#08131F',
        [x, P ? -5.00 : -1.95, 0],
        true
      );
    }
  );

  await until(S(35));
  await play(
    ...closeSwatches.map(
      s => new M.FadeIn(s)
    ),

    ...say('CLOSE COUNTS CAN LOOK ALMOST THE SAME', C.violet),

    ...fbox([
      ['similar shades', C.cyan],
      ['not necessarily equal', C.violet]
    ], C.violet)
  );

  const exactNumbers = [
    textAt(
      String(closeValues[0]),
      P ? 15 : 15,
      '#08131F',
      pos(0, 8),
      true
    ),

    textAt(
      String(closeValues[1]),
      P ? 15 : 15,
      '#08131F',
      pos(0, 17),
      true
    )
  ];

  await until(S(36));
  await play(
    ...swatchNumbers.map(
      t => new M.FadeIn(t)
    ),

    ...exactNumbers.map(
      t => new M.FadeIn(t)
    ),

    ...say('USE THE UNDERLYING NUMBERS FOR EXACT VALUES', C.green),

    ...fbox([
      ['08:00 = 60 rentals', C.cyan],
      ['17:00 = 55 rentals', C.cyan],
      ['difference = 5', C.amber]
    ], C.green)
  );

  // 37: final definition.
  // Leave the complete heatmap and colour key visible.
  const finalMorningBand = columnOutline(
    8,
    0,
    4,
    C.amber
  );

  const finalEveningBand = columnOutline(
    18,
    0,
    4,
    C.amber
  );

  const finalWeekendBand = outline(
    [
      (weekendLeft + weekendRight) / 2,
      (weekendTop + weekendBottom) / 2,
      0
    ],
    weekendRight - weekendLeft + 0.12,
    weekendTop - weekendBottom + 0.12,
    WEEKEND_COLOR
  );

  await until(S(37));
  await play(
    ...fadeAll([
      closeA,
      closeB,
      ...closeSwatches,
      ...swatchNumbers,
      ...exactNumbers
    ]),

    new M.Create(finalMorningBand),
    new M.Create(finalEveningBand),
    new M.Create(finalWeekendBand),

    ...say('HEATMAP: TURN NUMBERS INTO COLORS', C.green),

    ...fbox([
      ['HEATMAP', C.green],
      ['row = day', WEEKDAY_COLOR],
      ['column = hour', C.cyan],
      ['colour = mean count', C.green],
      ['see patterns at a glance', C.ink]
    ], C.green)
  );
}
