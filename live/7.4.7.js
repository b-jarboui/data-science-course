// lesson 7.4.7
// Optional stopping: repeated looks give false alarms more chances.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact shared chapter results:
//  1 look:   5% false-alarm rate
//  2 looks:  8% false-alarm rate
//  5 looks: 14% false-alarm rate
// 10 looks: 19% false-alarm rate
//
// All tests reuse the weights collected so far.
// The individual p-values used in the animated example are
// illustrative, not additional measured results.
// The false-alarm rates are the supplied example rates, not
// rates calculated by assuming independent tests.
//
// All 38 narration beats (0–37) are included.
// Browser playback and rendering have not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Exact shared chapter data.
  // ------------------------------------------------------------

  const TARGET = 30;
  const ALPHA = 0.05;
  const DAYS = 5;

  const LOOK_COUNTS = [1, 2, 5, 10];
  const ALARM_RATES = [5, 8, 14, 19];

  const WEEKS = 100;

  const RATE_RATIO =
    ALARM_RATES[2] / ALARM_RATES[0];

  const MORNING = C.amber;
  const AFTERNOON = C.green;
  const NIGHT = C.violet;

  const DATA = C.cyan;
  const GOOD = C.green;
  const WARN = C.amber;
  const ALARM = '#FB7185';

  // Illustrative cumulative p-values.
  //
  // Example week A:
  // Day 1: no alarm.
  // Day 2: alarm, so the daily testing procedure stops.
  // A hypothetical later result is shown separately.
  //
  // Example week B:
  // No alarm during the first three looks.

  const WEEK_A = [0.12, 0.03];
  const WEEK_A_HYPOTHETICAL = 0.09;

  const WEEK_B = [0.12, 0.08, 0.07];

  // ------------------------------------------------------------
  // Laptop and phone layouts.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.60;

  // Phone: pill under the title, picture in the middle, formula card at the bottom.
  const PILL = P
    ? [0, 3.70, 0]
    : [CX, 2.02, 0];

  const BOXP = P
    ? [0, -6.05, 0]
    : [4.30, -0.30, 0];

  const MAIN_W = P ? 6.70 : 7.40;

  const say = (s, color = DATA) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Common drawing helpers.
  // ------------------------------------------------------------

  function textAt(
    s,
    size,
    color,
    p,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    t.moveTo(p);

    return t;
  }

  function line(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dashed(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rectangle(
    p,
    width,
    height,
    color,
    fill,
    opacity = 1,
    cornerRadius = 0.12,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius,
      color,
      strokeWidth
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function panel(
    p,
    width,
    height,
    color = DATA
  ) {
    return rectangle(
      p,
      width,
      height,
      color,
      C.card,
      0.96,
      0.15,
      1.7
    );
  }

  function outline(
    p,
    width,
    height,
    color = WARN
  ) {
    return rectangle(
      p,
      width,
      height,
      color,
      color,
      0,
      0.12,
      2.5
    );
  }

  function tag(
    s,
    p,
    color = DATA,
    size = 17
  ) {
    const t = pill(s, color, size);

    t.moveTo(p);

    return t;
  }

  function fadeAll(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
  }

  function revealAll(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeIn(o));
  }

  function stagger(
    objects,
    duration = 1.20
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      {
        lagRatio: 0.12,
        runTime: duration
      }
    );
  }

  function indicateAll(
    objects,
    color = GOOD,
    duration = 1.20
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

  function arrow(
    a,
    b,
    color = DATA,
    width = 2.5,
    headSize = 0.14
  ) {
    const angle = Math.atan2(
      b[1] - a[1],
      b[0] - a[0]
    );

    const left = [
      b[0] - headSize *
        Math.cos(angle - Math.PI / 5),
      b[1] - headSize *
        Math.sin(angle - Math.PI / 5),
      0
    ];

    const right = [
      b[0] - headSize *
        Math.cos(angle + Math.PI / 5),
      b[1] - headSize *
        Math.sin(angle + Math.PI / 5),
      0
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, left, color, width),
      line(b, right, color, width)
    );
  }

  function glowingDot(
    p,
    color = DATA,
    radius = 0.085
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.30,
      color,
      strokeWidth: 0
    });

    halo.setFill(color, 0.15);

    const middle = new M.Dot({
      point: p,
      radius: radius * 1.48,
      color,
      strokeWidth: 0
    });

    middle.setFill(color, 0.35);

    const core = new M.Dot({
      point: p,
      radius,
      color,
      strokeWidth: 0
    });

    core.setFill(color, 1);

    return new M.VGroup(
      halo,
      middle,
      core
    );
  }

  function checkMark(
    p,
    color = GOOD,
    size = 0.12
  ) {
    return new M.VGroup(
      line(
        [
          p[0] - size,
          p[1],
          0
        ],
        [
          p[0] - size * 0.28,
          p[1] - size * 0.76,
          0
        ],
        color,
        3
      ),

      line(
        [
          p[0] - size * 0.28,
          p[1] - size * 0.76,
          0
        ],
        [
          p[0] + size,
          p[1] + size,
          0
        ],
        color,
        3
      )
    );
  }

  // ------------------------------------------------------------
  // Information and formula box.
  // Follows the approved reference lesson's structure.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = DATA) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
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

    const wd =
      Math.max(...widths) + 0.70;

    const ht =
      rows.length * lh + 0.40;

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
      BOXP[1] + ht / 2 - 0.20 - lh / 2;

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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P ? FW - 1.20 : 4.00;
    const maxh = P ? 1.90 : 2.65;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const a = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // Cookie and weighing-scale icons.
  // ------------------------------------------------------------

  function cookie(
    cx,
    cy,
    radius = 0.38,
    color = MORNING
  ) {
    const halo = new M.Dot({
      point: [cx, cy, 0],
      radius: radius * 1.38,
      color,
      strokeWidth: 0
    });

    halo.setFill(color, 0.12);

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    body.setFill(color, 0.55);
    body.moveTo([cx, cy, 0]);

    const chips = [
      [-0.35, 0.37],
      [0.32, 0.40],
      [0.04, 0.03],
      [-0.48, -0.26],
      [0.42, -0.22],
      [0.02, -0.54]
    ].map(([x, y]) => {
      const d = new M.Dot({
        point: [
          cx + x * radius,
          cy + y * radius,
          0
        ],
        radius: radius * 0.105,
        color: C.card,
        strokeWidth: 0
      });

      d.setFill(C.card, 1);

      return d;
    });

    return new M.VGroup(
      halo,
      body,
      ...chips
    );
  }

  function weighingScale(cx, cy) {
    const base = rectangle(
      [cx, cy - 0.28, 0],
      2.06,
      0.72,
      DATA,
      C.card,
      0.98,
      0.13,
      2
    );

    const plate = rectangle(
      [cx, cy + 0.18, 0],
      2.35,
      0.16,
      C.muted,
      C.muted,
      0.85,
      0.04,
      1
    );

    const display = panel(
      [cx, cy - 0.28, 0],
      1.36,
      0.40,
      DATA
    );

    const weight = textAt(
      `${TARGET} g`,
      23,
      DATA,
      [cx, cy - 0.28, 0],
      true
    );

    const biscuit = cookie(
      cx,
      cy + 0.55,
      0.31,
      MORNING
    );

    return new M.VGroup(
      base,
      plate,
      display,
      weight,
      biscuit
    );
  }

  // ------------------------------------------------------------
  // 0. You help check whether cookie weights differ between
  // two bakery shifts.
  //
  // Use morning and night as the two comparison shifts.
  // No new measured cookie weights are invented.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.65 : -0.32;

  const morningCookie = cookie(
    CX - 2.30,
    INTRO_Y + 0.35,
    0.55,
    MORNING
  );

  const nightCookie = cookie(
    CX + 2.30,
    INTRO_Y + 0.35,
    0.55,
    NIGHT
  );

  const scaleIcon = weighingScale(
    CX,
    INTRO_Y
  );

  const morningLabel = textAt(
    'Morning',
    20,
    MORNING,
    [
      CX - 2.30,
      INTRO_Y - 0.57,
      0
    ]
  );

  const nightLabel = textAt(
    'Night',
    20,
    NIGHT,
    [
      CX + 2.30,
      INTRO_Y - 0.57,
      0
    ]
  );

  const introNote = textAt(
    'Do the mean weights differ?',
    P ? 22 : 21,
    C.ink,
    [
      CX,
      INTRO_Y - 1.35,
      0
    ]
  );

  const introObjects = [
    morningCookie,
    nightCookie,
    scaleIcon,
    morningLabel,
    nightLabel,
    introNote
  ];

  await until(S(0));
  await play(
    ...revealAll(introObjects),
    ...say('COMPARE TWO BAKERY SHIFTS'),
    ...fbox([
      ['cookie target: 30 g', C.muted],
      ['morning shift', MORNING],
      ['night shift', NIGHT],
      ['compare mean weights', DATA]
    ])
  );

  // ------------------------------------------------------------
  // 1–3. Introduce the two competing testing plans.
  // ------------------------------------------------------------

  const PLAN_W = P ? 6.20 : 6.90;
  const PLAN_H = P ? 1.20 : 0.94;

  const PLAN_Y1 = P ? 0.60 : 0.64;
  const PLAN_Y2 = P ? -1.04 : -0.66;

  function planCard(
    y,
    title,
    subtitle,
    color
  ) {
    const r = panel(
      [CX, y, 0],
      PLAN_W,
      PLAN_H,
      color
    );

    const heading = textAt(
      title,
      P ? 22 : 21,
      color,
      [
        CX,
        y + 0.20,
        0
      ]
    );

    const explanation = textAt(
      subtitle,
      P ? 17 : 16,
      C.ink,
      [
        CX,
        y - 0.24,
        0
      ]
    );

    return new M.VGroup(
      r,
      heading,
      explanation
    );
  }

  const fixedPlanCard = planCard(
    PLAN_Y1,
    'End-of-week plan',
    'One test after the final day',
    GOOD
  );

  const dailyPlanCard = planCard(
    PLAN_Y2,
    'Daily plan',
    'Test each day; stop at the first alarm',
    WARN
  );

  // 1. The team plans to test once, at the end of the week.

  await until(S(1));
  await play(
    ...fadeAll(introObjects),
    new M.FadeIn(fixedPlanCard),
    ...say('PLAN A: TEST ONCE AT THE END', GOOD),
    ...fbox([
      ['collect the week’s weights'],
      ['choose the test date first'],
      ['one planned test', GOOD]
    ], GOOD)
  );

  // 2. A supervisor wants to test each day and stop as soon
  // as the result looks strong.

  await until(S(2));
  await play(
    new M.FadeIn(dailyPlanCard),
    ...say('PLAN B: TEST DAILY AND STOP EARLY', WARN),
    ...fbox([
      ['look at the data each day'],
      ['test the accumulated weights'],
      ['stop at the first small p', WARN]
    ], WARN)
  );

  // 3. Does that change how often the team gets a false alarm?

  const questionTag = tag(
    'SAME FALSE-ALARM RATE?',
    [
      CX,
      P ? -2.65 : -2.03,
      0
    ],
    WARN,
    20
  );

  await until(S(3));
  await play(
    new M.FadeIn(questionTag),
    ...say('DOES THE TESTING PLAN CHANGE THE RISK?', WARN),
    ...fbox([
      ['one chance to test', GOOD],
      ['several chances to test', WARN],
      ['same cutoff'],
      ['same false-alarm rate?']
    ], WARN)
  );

  // ------------------------------------------------------------
  // Five-day timeline.
  //
  // Each day contributes fresh morning and night weights.
  // The small dots are symbolic records, not exact counts
  // or invented weight measurements.
  // ------------------------------------------------------------

  const DAY_SP = P ? 1.22 : 1.34;
  const DAY_W = P ? 1.07 : 1.18;
  const DAY_H = P ? 1.25 : 1.10;

  const DAY_Y = P ? 0.52 : 0.64;

  const dayX = k =>
    CX + (k - 2) * DAY_SP;

  function dayBox(
    k,
    active = true
  ) {
    const cx = dayX(k);
    const cy = DAY_Y;

    const color =
      active ? DATA : C.muted;

    const r = panel(
      [cx, cy, 0],
      DAY_W,
      DAY_H,
      color
    );

    const heading = textAt(
      `Day ${k + 1}`,
      P ? 16 : 16,
      color,
      [
        cx,
        cy + DAY_H / 2 - 0.23,
        0
      ],
      true
    );

    const marks = [];

    [MORNING, NIGHT].forEach(
      (shiftColor, row) => {
        for (let col = 0; col < 3; col++) {
          const d = new M.Dot({
            point: [
              cx + (col - 1) * 0.22,
              cy + 0.04 - row * 0.25,
              0
            ],
            radius: 0.065,
            color: shiftColor,
            strokeWidth: 0
          });

          d.setFill(
            shiftColor,
            active ? 0.95 : 0.18
          );

          marks.push(d);
        }
      }
    );

    return new M.VGroup(
      r,
      heading,
      ...marks
    );
  }

  const dayBoxes = Array.from(
    { length: DAYS },
    (_, k) => dayBox(k)
  );

  const dayBoxNote = textAt(
    'Each box adds fresh weights',
    P ? 17 : 16,
    C.muted,
    [
      CX,
      DAY_Y + DAY_H / 2 + 0.34,
      0
    ]
  );

  const morningKey = textAt(
    'Morning',
    P ? 15 : 14,
    MORNING,
    [
      CX - 0.85,
      P ? -4.52 : -2.66,
      0
    ]
  );

  const nightKey = textAt(
    'Night',
    P ? 15 : 14,
    NIGHT,
    [
      CX + 0.85,
      P ? -4.52 : -2.66,
      0
    ]
  );

  const FIXED_Y = P ? -1.22 : -0.62;
  const DAILY_Y = P ? -2.80 : -1.74;

  function testMark(
    k,
    y,
    color = GOOD
  ) {
    const cx = dayX(k);

    const ring = new M.Circle({
      radius: P ? 0.145 : 0.125,
      color,
      strokeWidth: 2.5
    });

    ring.setFill(color, 0.22);
    ring.moveTo([cx, y, 0]);

    const label = textAt(
      'T',
      P ? 16 : 14,
      color,
      [cx, y, 0],
      true
    );

    return new M.VGroup(
      ring,
      label
    );
  }

  function testConnector(
    k,
    y,
    color = C.muted
  ) {
    return dashed(
      [
        dayX(k),
        DAY_Y - DAY_H / 2 - 0.06,
        0
      ],
      [
        dayX(k),
        y + 0.20,
        0
      ],
      color
    );
  }

  const fixedMark = testMark(
    4,
    FIXED_Y,
    GOOD
  );

  const fixedConnector = testConnector(
    4,
    FIXED_Y,
    GOOD
  );

  const fixedRowLabel = textAt(
    'End-of-week plan: 1 test',
    P ? 18 : 17,
    GOOD,
    [
      CX,
      FIXED_Y - 0.40,
      0
    ]
  );

  const dailyMarks = Array.from(
    { length: DAYS },
    (_, k) => testMark(
      k,
      DAILY_Y,
      WARN
    )
  );

  const dailyRowLabel = textAt(
    'Daily plan: up to 5 tests',
    P ? 18 : 17,
    WARN,
    [
      CX,
      DAILY_Y - 0.40,
      0
    ]
  );

  // 4. Draw five boxes, one for each day we collect fresh weights.

  await until(S(4));
  await play(
    ...fadeAll([
      fixedPlanCard,
      dailyPlanCard,
      questionTag
    ]),
    stagger(dayBoxes, 1.40),
    new M.FadeIn(dayBoxNote),
    new M.FadeIn(morningKey),
    new M.FadeIn(nightKey),
    ...say('FIVE DAYS OF FRESH WEIGHTS'),
    ...fbox([
      ['day 1, 2, 3, 4, 5', DATA],
      ['morning weights', MORNING],
      ['night weights', NIGHT],
      ['keep collecting']
    ])
  );

  // 5. For an end-of-week test, there is just one test mark,
  // under the last box.

  await until(S(5));
  await play(
    new M.Create(fixedConnector),
    new M.FadeIn(fixedMark),
    new M.FadeIn(fixedRowLabel),
    ...say('ONE TEST UNDER THE LAST DAY', GOOD),
    ...fbox([
      ['end-of-week plan', GOOD],
      ['collect on all five days'],
      ['test once, on day 5']
    ], GOOD)
  );

  // 6. For the daily plan, put a test mark under every box.

  await until(S(6));
  await play(
    stagger(dailyMarks, 1.40),
    new M.FadeIn(dailyRowLabel),
    ...say('DAILY PLAN: A TEST MARK FOR EVERY DAY', WARN),
    ...fbox([
      ['day 1: test'],
      ['day 2: test again'],
      ['continue if no alarm'],
      ['up to 5 looks', WARN]
    ], WARN)
  );

  // ------------------------------------------------------------
  // Cumulative-data outline.
  // ------------------------------------------------------------

  function cumulativeOutline(
    count,
    color = DATA
  ) {
    const left =
      dayX(0) - DAY_W / 2 - 0.06;

    const right =
      dayX(count - 1) + DAY_W / 2 + 0.06;

    return outline(
      [
        (left + right) / 2,
        DAY_Y,
        0
      ],
      right - left,
      DAY_H + 0.12,
      color
    );
  }

  const firstThreeOutline =
    cumulativeOutline(3, DATA);

  const cumulativeExampleArrow = arrow(
    [
      dayX(2),
      DAY_Y - DAY_H / 2 - 0.11,
      0
    ],
    [
      dayX(2),
      DAILY_Y + 0.22,
      0
    ],
    DATA,
    2.5,
    0.12
  );

  // 7. Each test uses all the weights collected so far that week.

  await until(S(7));
  await play(
    new M.Create(firstThreeOutline),
    new M.Create(cumulativeExampleArrow),
    new M.Indicate(dailyMarks[2], {
      color: DATA
    }),
    ...say('EACH LOOK USES ALL THE DATA SO FAR'),
    ...fbox([
      ['day 1: use day 1'],
      ['day 2: use days 1–2'],
      ['day 3: use days 1–3', DATA],
      ['keep the earlier weights']
    ])
  );

  // ------------------------------------------------------------
  // 8–9. Explain equal population means and false alarms.
  //
  // The two mean markers are placed at the same value.
  // This represents the assumed no-difference situation.
  // It is not a result calculated from new observations.
  // ------------------------------------------------------------

  const GRAMS_LEFT = CX - 2.45;
  const GRAMS_RIGHT = CX + 2.45;

  const GRAMS_Y = P ? -2.35 : -1.65;

  const GX = n =>
    GRAMS_LEFT +
    (n - 26) / 8 *
    (GRAMS_RIGHT - GRAMS_LEFT);

  const gramsRuler = new M.VGroup(
    line(
      [GRAMS_LEFT, GRAMS_Y, 0],
      [GRAMS_RIGHT, GRAMS_Y, 0],
      C.muted,
      2.5
    ),

    ...[26, 28, 30, 32, 34].flatMap(n => [
      line(
        [GX(n), GRAMS_Y - 0.08, 0],
        [GX(n), GRAMS_Y + 0.08, 0],
        C.muted,
        2
      ),

      textAt(
        String(n),
        17,
        C.muted,
        [
          GX(n),
          GRAMS_Y - 0.29,
          0
        ],
        true
      )
    ]),

    textAt(
      'Mean weight (grams)',
      P ? 18 : 17,
      C.ink,
      [
        CX,
        GRAMS_Y - 0.68,
        0
      ]
    )
  );

  const MEAN_Y1 =
    P ? 0.57 : 0.72;

  const MEAN_Y2 =
    P ? -0.72 : -0.50;

  const meanRows = [
    {
      label: 'Morning mean',
      y: MEAN_Y1,
      color: MORNING
    },
    {
      label: 'Night mean',
      y: MEAN_Y2,
      color: NIGHT
    }
  ].map(row =>
    new M.VGroup(
      line(
        [GRAMS_LEFT, row.y, 0],
        [GRAMS_RIGHT, row.y, 0],
        C.muted,
        1.7
      ),

      glowingDot(
        [GX(TARGET), row.y, 0],
        row.color,
        0.12
      ),

      textAt(
        row.label,
        P ? 18 : 17,
        row.color,
        [
          CX - 1.45,
          row.y + 0.38,
          0
        ]
      ),

      textAt(
        '30 g',
        20,
        row.color,
        [
          GX(TARGET),
          row.y + 0.40,
          0
        ],
        true
      )
    )
  );

  const equalMeanGuide = dashed(
    [GX(TARGET), GRAMS_Y, 0],
    [GX(TARGET), MEAN_Y1 + 0.17, 0],
    GOOD,
    2.5
  );

  const equalMeanTag = tag(
    'ASSUME EQUAL TRUE MEANS',
    [
      CX,
      P ? -3.65 : -2.72,
      0
    ],
    GOOD,
    P ? 17 : 15
  );

  const timelineObjects = [
    ...dayBoxes,
    dayBoxNote,
    morningKey,
    nightKey,
    fixedMark,
    fixedConnector,
    fixedRowLabel,
    ...dailyMarks,
    dailyRowLabel,
    firstThreeOutline,
    cumulativeExampleArrow
  ];

  // 8. Suppose the shifts truly have the same average weight.

  await until(S(8));
  await play(
    ...fadeAll(timelineObjects),
    new M.FadeIn(gramsRuler),
    ...revealAll(meanRows),
    new M.Create(equalMeanGuide),
    new M.FadeIn(equalMeanTag),
    ...say('SUPPOSE THE TRUE MEANS ARE EQUAL', GOOD),
    ...fbox([
      ['morning mean = night mean', GOOD],
      ['true difference = 0'],
      ['assume no real difference']
    ], GOOD)
  );

  // 9. An alarm that says they differ would then be a false alarm.

  const falseAlarmBadge = tag(
    'FALSE ALARM',
    [
      CX + 1.90,
      P ? -1.58 : -1.13,
      0
    ],
    ALARM,
    19
  );

  await until(S(9));
  await play(
    new M.FadeIn(falseAlarmBadge),
    ...say('FALSE ALARM: FLAG A DIFFERENCE THAT IS NOT THERE', ALARM),
    ...fbox([
      ['true means: equal', GOOD],
      ['test says: different', ALARM],
      ['that is a false alarm', ALARM]
    ], ALARM)
  );

  // ------------------------------------------------------------
  // 10. Each test mark is another chance for an alarm.
  // ------------------------------------------------------------

  const chanceMarks = Array.from(
    { length: DAYS },
    (_, k) =>
      testMark(k, P ? -0.80 : -0.25, WARN)
  );

  const chanceDayLabels = Array.from(
    { length: DAYS },
    (_, k) =>
      textAt(
        `Day ${k + 1}`,
        P ? 17 : 16,
        C.muted,
        [
          dayX(k),
          P ? -1.20 : -0.64,
          0
        ]
      )
  );

  const chanceNote = textAt(
    'Each look is another opportunity',
    P ? 20 : 19,
    C.ink,
    [
      CX,
      P ? -2.10 : -1.40,
      0
    ]
  );

  await until(S(10));
  await play(
    ...fadeAll([
      gramsRuler,
      ...meanRows,
      equalMeanGuide,
      equalMeanTag,
      falseAlarmBadge
    ]),
    stagger(chanceMarks),
    ...revealAll(chanceDayLabels),
    new M.FadeIn(chanceNote),
    ...say('EVERY LOOK GIVES ANOTHER CHANCE FOR AN ALARM', WARN),
    ...fbox([
      ['one look: one opportunity'],
      ['five looks: more opportunities'],
      ['not necessarily independent', WARN]
    ], WARN)
  );

  // ------------------------------------------------------------
  // Notebook analogy.
  //
  // Every page represents one day's new records.
  // Reusing earlier pages is the central point of the analogy.
  // ------------------------------------------------------------

  const PAGE_Y = P ? 0.20 : 0.30;
  const PAGE_W = P ? 1.05 : 1.16;
  const PAGE_H = P ? 1.74 : 1.47;

  function notebookPage(
    k,
    color = DATA
  ) {
    const x = dayX(k);
    const y = PAGE_Y;

    const frame = rectangle(
      [x, y, 0],
      PAGE_W,
      PAGE_H,
      color,
      C.card,
      1,
      0.08,
      2
    );

    const heading = textAt(
      `Day ${k + 1}`,
      P ? 16 : 15,
      color,
      [
        x,
        y + PAGE_H / 2 - 0.25,
        0
      ]
    );

    const records = [];

    for (let j = 0; j < 6; j++) {
      const ly =
        y + 0.30 - j *
        (P ? 0.17 : 0.14);

      const shiftColor =
        j < 3 ? MORNING : NIGHT;

      records.push(
        glowingDot(
          [x - 0.31, ly, 0],
          shiftColor,
          0.025
        ),

        line(
          [x - 0.18, ly, 0],
          [x + 0.32, ly, 0],
          C.muted,
          1.4
        )
      );
    }

    return new M.VGroup(
      frame,
      heading,
      ...records
    );
  }

  const notebookPages = Array.from(
    { length: DAYS },
    (_, k) => notebookPage(k)
  );

  const notebookTitle = textAt(
    'One new page every day',
    P ? 20 : 19,
    DATA,
    [
      CX,
      PAGE_Y + PAGE_H / 2 + 0.33,
      0
    ]
  );

  // 11. Picture a notebook where each day adds a new page of weights.

  await until(S(11));
  await play(
    ...fadeAll([
      ...chanceMarks,
      ...chanceDayLabels,
      chanceNote
    ]),
    new M.FadeIn(notebookTitle),
    stagger(notebookPages, 1.60),
    ...say('EACH DAY ADDS A PAGE TO THE NOTEBOOK'),
    ...fbox([
      ['page 1: first day’s weights'],
      ['page 2: new weights'],
      ['page 3: more new weights'],
      ['keep every earlier page', DATA]
    ])
  );

  const notebookReadFrame = outline(
    [
      (dayX(0) + dayX(2)) / 2,
      PAGE_Y,
      0
    ],
    dayX(2) - dayX(0) + PAGE_W + 0.12,
    PAGE_H + 0.15,
    GOOD
  );

  const notebookReadArrow = arrow(
    [
      dayX(1),
      PAGE_Y - PAGE_H / 2 - 0.10,
      0
    ],
    [
      dayX(1),
      P ? -1.65 : -1.22,
      0
    ],
    GOOD,
    2.5,
    0.15
  );

  const notebookReadTag = tag(
    'DAY 3 TEST: PAGES 1, 2 AND 3',
    [
      CX,
      P ? -2.08 : -1.75,
      0
    ],
    GOOD,
    P ? 18 : 17
  );

  // 12. At each test, read every page collected so far.

  await until(S(12));
  await play(
    new M.Create(notebookReadFrame),
    new M.Create(notebookReadArrow),
    new M.FadeIn(notebookReadTag),
    ...say('READ EVERY PAGE COLLECTED SO FAR', GOOD),
    ...fbox([
      ['day 3 test', GOOD],
      ['read page 1'],
      ['read page 2'],
      ['read page 3'],
      ['combine all three']
    ], GOOD)
  );

  // ------------------------------------------------------------
  // Cumulative daily testing demonstration.
  //
  // Keep the day's data cards above a p-value ruler.
  // The p-value ruler uses a zoomed 0–0.20 range.
  //
  // The threshold is at precisely 0.05.
  // Alarm condition: p < 0.05, not p <= 0.05.
  // ------------------------------------------------------------

  const TEST_DAY_Y = P ? 0.75 : 0.82;
  const TEST_DAY_H = P ? 0.94 : 0.71;

  function testDayCard(
    k,
    active
  ) {
    const color =
      active ? DATA : C.muted;

    const x = dayX(k);

    const frame = panel(
      [x, TEST_DAY_Y, 0],
      DAY_W,
      TEST_DAY_H,
      color
    );

    const title = textAt(
      `Day ${k + 1}`,
      P ? 15 : 14,
      color,
      [
        x,
        TEST_DAY_Y +
          (P ? 0.27 : 0.20),
        0
      ]
    );

    const dots = [];

    for (let row = 0; row < 2; row++) {
      const c =
        row === 0 ? MORNING : NIGHT;

      for (let col = 0; col < 3; col++) {
        const d = new M.Dot({
          point: [
            x + (col - 1) * 0.20,
            TEST_DAY_Y -
              0.04 -
              row * 0.17,
            0
          ],
          radius: 0.048,
          color: c,
          strokeWidth: 0
        });

        d.setFill(
          c,
          active ? 1 : 0.15
        );

        dots.push(d);
      }
    }

    return new M.VGroup(
      frame,
      title,
      ...dots
    );
  }

  const testDays = Array.from(
    { length: DAYS },
    (_, k) =>
      testDayCard(k, k === 0)
  );

  let activeDays = 1;

  function setActiveDays(count) {
    const a = [];

    for (let k = 0; k < DAYS; k++) {
      if (
        (k < activeDays) !==
        (k < count)
      ) {
        a.push(
          new M.Transform(
            testDays[k],
            testDayCard(k, k < count)
          )
        );
      }
    }

    activeDays = count;

    return a;
  }

  function collectedFrame(
    count,
    color = DATA
  ) {
    const left =
      dayX(0) - DAY_W / 2 - 0.065;

    const right =
      dayX(count - 1) + DAY_W / 2 + 0.065;

    return outline(
      [
        (left + right) / 2,
        TEST_DAY_Y,
        0
      ],
      right - left,
      TEST_DAY_H + 0.13,
      color
    );
  }

  let currentCollectedFrame =
    collectedFrame(1);

  function collectedFrameAnimations(count) {
    return [
      new M.Transform(
        currentCollectedFrame,
        collectedFrame(count)
      )
    ];
  }

  const PV_LEFT = CX - (P ? 2.90 : 3.05);
  const PV_RIGHT = CX + (P ? 2.90 : 3.05);

  const PV_Y = P ? -2.08 : -1.23;
  const PV_MAX = 0.20;

  const PX = p =>
    PV_LEFT +
    p / PV_MAX *
    (PV_RIGHT - PV_LEFT);

  const pPoint = (p, y = PV_Y) => [
    PX(p),
    y,
    0
  ];

  const pAxis = line(
    pPoint(0),
    pPoint(PV_MAX),
    C.muted,
    3
  );

  const pTicks = [
    0, 0.05, 0.10, 0.15, 0.20
  ].map(p =>
    new M.VGroup(
      line(
        [PX(p), PV_Y - 0.085, 0],
        [PX(p), PV_Y + 0.085, 0],
        C.muted,
        2
      ),

      textAt(
        p.toFixed(2),
        P ? 17 : 16,
        C.muted,
        [
          PX(p),
          PV_Y - 0.29,
          0
        ],
        true
      )
    )
  );

  const pAxisTitle = textAt(
    'p-value',
    P ? 20 : 18,
    C.ink,
    [
      CX,
      PV_Y - 0.66,
      0
    ]
  );

  const pScaleNote = textAt(
    'Zoomed scale: 0–0.20',
    P ? 15 : 13,
    C.muted,
    [
      CX,
      PV_Y - 0.98,
      0
    ]
  );

  const pRuler = new M.VGroup(
    pAxis,
    ...pTicks,
    pAxisTitle,
    pScaleNote
  );

  const cutoffLine = dashed(
    [
      PX(ALPHA),
      PV_Y - 0.12,
      0
    ],
    [
      PX(ALPHA),
      PV_Y + (P ? 1.22 : 0.86),
      0
    ],
    WARN,
    3
  );

  const alarmRegion = rectangle(
    [
      (PX(0) + PX(ALPHA)) / 2,
      PV_Y + 0.30,
      0
    ],
    PX(ALPHA) - PX(0),
    0.60,
    ALARM,
    ALARM,
    0.13,
    0.03,
    1
  );

  const cutoffTag = tag(
    '0.05 CUTOFF',
    [
      PX(ALPHA),
      PV_Y +
        (P ? 1.48 : 1.08),
      0
    ],
    WARN,
    P ? 16 : 15
  );

  const alarmSideLabel = textAt(
    'Alarm',
    P ? 16 : 15,
    ALARM,
    [
      (PX(0) + PX(ALPHA)) / 2,
      PV_Y + 0.73,
      0
    ]
  );

  const waitSideLabel = textAt(
    'No alarm yet',
    P ? 17 : 16,
    GOOD,
    [
      (PX(ALPHA) + PX(PV_MAX)) / 2,
      PV_Y + 0.73,
      0
    ]
  );

  const pThresholdObjects = [
    alarmRegion,
    cutoffLine,
    cutoffTag,
    alarmSideLabel,
    waitSideLabel
  ];

  const exampleTitle = textAt(
    'Illustrative week A',
    P ? 18 : 17,
    C.muted,
    [
      CX,
      TEST_DAY_Y +
        TEST_DAY_H / 2 +
        0.34,
      0
    ]
  );

  const assumedEqualTag = tag(
    'TRUE MEANS ARE EQUAL',
    [
      CX,
      P ? -4.35 : -3.17,
      0
    ],
    GOOD,
    P ? 16 : 15
  );

  function pMarker(
    value,
    color,
    label = null,
    hollow = false
  ) {
    const p = pPoint(
      value,
      PV_Y + 0.10
    );

    let dot;

    if (hollow) {
      dot = new M.Circle({
        radius: 0.105,
        color,
        strokeWidth: 2.5
      });

      dot.setFill(color, 0);
      dot.moveTo(p);
    } else {
      dot = glowingDot(
        p,
        color,
        0.105
      );
    }

    const lab = textAt(
      label || `p = ${value.toFixed(2)}`,
      P ? 19 : 17,
      color,
      [
        PX(value),
        PV_Y + 0.40,
        0
      ],
      true
    );

    return new M.VGroup(
      dot,
      lab
    );
  }

  let pNow = null;

  function updateP(value, color) {
    const next = pMarker(
      value,
      color
    );

    const a = [];

    if (pNow) {
      a.push(
        new M.FadeOut(pNow)
      );
    }

    a.push(
      new M.FadeIn(next)
    );

    pNow = next;

    return a;
  }

  let statusNow = null;

  function statusAnimations(
    s,
    color = GOOD
  ) {
    const next = tag(
      s,
      [
        CX,
        P ? -3.68 : -2.62,
        0
      ],
      color,
      P ? 19 : 17
    );

    const a = [];

    if (statusNow) {
      a.push(
        new M.FadeOut(statusNow)
      );
    }

    a.push(
      new M.FadeIn(next)
    );

    statusNow = next;

    return a;
  }

  // 13. Start on the first day with just the first box of weights.

  await until(S(13));
  await play(
    ...fadeAll([
      ...notebookPages,
      notebookTitle,
      notebookReadFrame,
      notebookReadArrow,
      notebookReadTag
    ]),
    ...revealAll(testDays),
    new M.Create(currentCollectedFrame),
    new M.FadeIn(exampleTitle),
    ...say('DAY 1: USE ONLY THE FIRST BOX'),
    ...fbox([
      ['day 1 weights', DATA],
      ['compare the shifts'],
      ['first test']
    ])
  );

  // 14. Assume equal means and that the test conditions hold.

  await until(S(14));
  await play(
    new M.FadeIn(assumedEqualTag),
    ...say('ASSUME EQUAL MEANS AND VALID TEST CONDITIONS', GOOD),
    ...fbox([
      ['true mean difference = 0', GOOD],
      ['test conditions hold'],
      ['the no-difference assumption']
    ], GOOD)
  );

  // ------------------------------------------------------------
  // 15. A p-value is the chance of getting a result at least
  // as extreme as the one we saw.
  //
  // The null assumption remains visible.
  // A small schematic tail picture illustrates extremeness
  // without claiming a particular test-statistic distribution.
  // ------------------------------------------------------------

  const TAIL_Y = P ? -1.75 : -0.93;
  const TAIL_LEFT = CX - 2.15;
  const TAIL_RIGHT = CX + 2.15;

  function schematicNullPicture() {
    const counts = [
      1, 2, 4, 7, 11, 15, 18,
      20,
      18, 15, 11, 7, 4, 2, 1
    ];

    const sp =
      (TAIL_RIGHT - TAIL_LEFT) /
      counts.length;

    const maxHeight =
      P ? 1.32 : 0.87;

    const base = line(
      [TAIL_LEFT, TAIL_Y, 0],
      [TAIL_RIGHT, TAIL_Y, 0],
      C.muted,
      2
    );

    const bars = counts.map((n, k) => {
      const h =
        n / 20 * maxHeight;

      const isTail =
        k <= 1 || k >= counts.length - 2;

      const color =
        isTail ? WARN : DATA;

      const r = new M.Rectangle({
        width: sp * 0.83,
        height: h,
        color,
        strokeWidth: 1
      });

      r.setFill(
        color,
        isTail ? 0.90 : 0.45
      );

      r.moveTo([
        TAIL_LEFT + (k + 0.5) * sp,
        TAIL_Y + h / 2,
        0
      ]);

      return r;
    });

    const label = textAt(
      'Possible results if the means are equal',
      P ? 17 : 15,
      C.ink,
      [
        CX,
        TAIL_Y - 0.32,
        0
      ]
    );

    const tailLeft = textAt(
      'Extreme',
      P ? 15 : 14,
      WARN,
      [
        TAIL_LEFT + 0.29,
        TAIL_Y + maxHeight * 0.46,
        0
      ]
    );

    const tailRight = textAt(
      'Extreme',
      P ? 15 : 14,
      WARN,
      [
        TAIL_RIGHT - 0.29,
        TAIL_Y + maxHeight * 0.46,
        0
      ]
    );

    const note = textAt(
      'Schematic illustration',
      P ? 14 : 12,
      C.muted,
      [
        CX,
        TAIL_Y - 0.64,
        0
      ]
    );

    return new M.VGroup(
      base,
      ...bars,
      label,
      tailLeft,
      tailRight,
      note
    );
  }

  const nullPicture =
    schematicNullPicture();

  await until(S(15));
  await play(
    new M.FadeIn(nullPicture),
    ...say('P-VALUE: CHANCE OF A RESULT AT LEAST AS EXTREME'),
    ...fbox([
      ['assuming equal true means'],
      ['and valid test conditions'],
      ['chance of a test result'],
      ['at least as extreme', DATA]
    ])
  );

  // 16. A p-value below 0.05 triggers the alarm in this plan.

  await until(S(16));
  await play(
    new M.FadeOut(nullPicture),
    new M.FadeIn(pRuler),
    new M.FadeIn(alarmRegion),
    new M.Create(cutoffLine),
    ...revealAll([
      cutoffTag,
      alarmSideLabel,
      waitSideLabel
    ]),
    ...say('ALARM RULE: p < 0.05', WARN),
    ...fbox([
      ['p < 0.05: alarm', ALARM],
      ['p ≥ 0.05: no alarm yet', GOOD],
      ['same cutoff at every look']
    ], WARN)
  );

  // 17. If the first day's p-value reaches the line or stays
  // above it, the supervisor waits.

  await until(S(17));
  await play(
    ...updateP(WEEK_A[0], GOOD),
    ...statusAnimations('WAIT FOR MORE DATA', GOOD),
    ...say('DAY 1: p = 0.12 · KEEP COLLECTING', GOOD),
    ...fbox([
      ['illustrative p = 0.12'],
      ['0.12 ≥ 0.05', GOOD],
      ['no alarm on day 1'],
      ['wait for the next day']
    ], GOOD)
  );

  // 18. On day two, add the second box of weights to the first.

  await until(S(18));
  await play(
    ...setActiveDays(2),
    ...collectedFrameAnimations(2),
    new M.Indicate(testDays[0], {
      color: DATA
    }),
    ...say('DAY 2: KEEP DAY 1 AND ADD DAY 2'),
    ...fbox([
      ['earlier day 1 weights'],
      ['fresh day 2 weights', DATA],
      ['combine the two boxes']
    ])
  );

  // 19. Test again with both boxes.

  const testAgainArrow = arrow(
    [
      (dayX(0) + dayX(1)) / 2,
      TEST_DAY_Y - TEST_DAY_H / 2 - 0.13,
      0
    ],
    [
      CX,
      P ? -0.38 : -0.12,
      0
    ],
    DATA,
    2.5,
    0.14
  );

  await until(S(19));
  await play(
    new M.Create(testAgainArrow),
    ...statusAnimations('TEST DAYS 1 + 2', DATA),
    ...say('TEST BOTH BOXES TOGETHER'),
    ...fbox([
      ['second test'],
      ['uses day 1 again'],
      ['plus new day 2 weights', DATA]
    ])
  );

  // ------------------------------------------------------------
  // Alarm record.
  //
  // Once an alarm occurs, the week's tally remains flagged.
  // Later hypothetical results cannot undo that event.
  // ------------------------------------------------------------

  function alarmStamp(
    p,
    heading = 'ALARM',
    subtitle = 'Week flagged'
  ) {
    const frame = rectangle(
      p,
      P ? 2.55 : 2.40,
      P ? 0.80 : 0.65,
      ALARM,
      ALARM,
      0.12,
      0.10,
      2.4
    );

    const title = textAt(
      heading,
      P ? 20 : 18,
      ALARM,
      [
        p[0],
        p[1] + 0.13,
        0
      ]
    );

    const lab = textAt(
      subtitle,
      P ? 15 : 14,
      ALARM,
      [
        p[0],
        p[1] - 0.18,
        0
      ]
    );

    return new M.VGroup(
      frame,
      title,
      lab
    );
  }

  const STOP_Y = P ? -0.42 : -0.04;

  const weekAStamp = alarmStamp(
    [
      CX + 1.77,
      STOP_Y,
      0
    ],
    'STOP',
    'Week A: alarm'
  );

  // 20. If the p-value now falls below the line,
  // stop and mark this week as an alarm.

  await until(S(20));
  await play(
    new M.FadeOut(testAgainArrow),
    ...updateP(WEEK_A[1], ALARM),
    ...statusAnimations('STOP: p < 0.05', ALARM),
    new M.FadeIn(weekAStamp),
    ...say('DAY 2: p = 0.03 · STOP AND FLAG THE WEEK', ALARM),
    ...fbox([
      ['illustrative p = 0.03'],
      ['0.03 < 0.05', ALARM],
      ['stop testing this week'],
      ['record one false alarm', ALARM]
    ], ALARM)
  );

  // ------------------------------------------------------------
  // 21–22. A different illustrative week has not stopped.
  //
  // Week B:
  // day 1: p = 0.12
  // day 2: p = 0.08
  // day 3: p = 0.07
  //
  // A new week is explicitly identified to avoid suggesting
  // that week A continued after its stopping rule was met.
  // ------------------------------------------------------------

  const weekBTitle = textAt(
    'Illustrative week B',
    P ? 18 : 17,
    C.muted,
    [
      CX,
      TEST_DAY_Y +
        TEST_DAY_H / 2 +
        0.34,
      0
    ]
  );

  const weekARecord = tag(
    'WEEK A: ALARM RECORDED',
    [
      CX + 1.65,
      STOP_Y,
      0
    ],
    ALARM,
    P ? 14 : 13
  );

  const weekBHistory = textAt(
    'Day 1: 0.12    Day 2: 0.08',
    P ? 16 : 15,
    C.muted,
    [
      CX - 0.65,
      P ? -0.34 : -0.04,
      0
    ],
    true
  );

  // 21. On a week with no alarm yet, add the third box on day three.

  await until(S(21));
  await play(
    new M.FadeOut(weekAStamp),
    new M.FadeOut(exampleTitle),
    new M.FadeIn(weekBTitle),
    new M.FadeIn(weekARecord),
    new M.FadeIn(weekBHistory),
    ...setActiveDays(3),
    ...collectedFrameAnimations(3),
    ...updateP(WEEK_B[1], GOOD),
    ...statusAnimations('WEEK B: NO ALARM YET', GOOD),
    ...say('ANOTHER WEEK: KEEP COLLECTING ON DAY 3', GOOD),
    ...fbox([
      ['week B: no earlier alarm'],
      ['day 1 p = 0.12'],
      ['day 2 p = 0.08'],
      ['add the third box', DATA]
    ], GOOD)
  );

  // 22. Test all the weights so far again and use the same line.

  await until(S(22));
  await play(
    ...updateP(WEEK_B[2], GOOD),
    new M.Indicate(cutoffTag, {
      color: WARN
    }),
    ...statusAnimations('DAY 3: NO ALARM YET', GOOD),
    ...say('TEST DAYS 1–3 WITH THE SAME 0.05 CUTOFF'),
    ...fbox([
      ['day 1 + day 2 + day 3'],
      ['illustrative p = 0.07'],
      ['0.07 ≥ 0.05', GOOD],
      ['continue collecting']
    ], GOOD)
  );

  // ------------------------------------------------------------
  // 23. Keep the alarm mark for any week that stops,
  // even if a later test would give a different result.
  //
  // Return to week A.
  // Show a later hypothetical p-value using a hollow marker.
  // No actual extra test is performed after the stop.
  // ------------------------------------------------------------

  const stoppedWeekTitle = textAt(
    'Week A: stopped on day 2',
    P ? 18 : 17,
    ALARM,
    [
      CX,
      TEST_DAY_Y +
        TEST_DAY_H / 2 +
        0.34,
      0
    ]
  );

  const hypotheticalMarker = pMarker(
    WEEK_A_HYPOTHETICAL,
    C.muted,
    '0.09',
    true
  );

  const hypotheticalLabel = textAt(
    'Hypothetical later result',
    P ? 15 : 14,
    C.muted,
    [
      PX(WEEK_A_HYPOTHETICAL) + (P ? 0.70 : 0.55),
      PV_Y + (P ? 1.16 : 0.73),
      0
    ]
  );

  const permanentAlarmStamp = alarmStamp(
    [
      CX + 1.77,
      STOP_Y,
      0
    ],
    'ALARM KEPT',
    'Week A remains flagged'
  );

  await until(S(23));
  await play(
    ...fadeAll([
      weekBTitle,
      weekBHistory,
      weekARecord
    ]),
    new M.FadeIn(stoppedWeekTitle),
    ...setActiveDays(2),
    ...collectedFrameAnimations(2),
    ...updateP(WEEK_A[1], ALARM),
    new M.FadeIn(hypotheticalMarker),
    new M.FadeIn(hypotheticalLabel),
    ...(P ? [] : [new M.FadeOut(waitSideLabel)]),
    new M.FadeIn(permanentAlarmStamp),
    ...statusAnimations('ONCE FLAGGED, COUNT THE WEEK', ALARM),
    ...say('A LATER RESULT DOES NOT ERASE THE ALARM', ALARM),
    ...fbox([
      ['day 2: p = 0.03', ALARM],
      ['week already stopped'],
      ['later p = 0.09, if tested'],
      ['the original alarm still counts']
    ], ALARM)
  );

  // 24. Stopping as soon as a result meets the rule is called
  // optional stopping.

  await until(S(24));
  await play(
    new M.Indicate(permanentAlarmStamp, {
      color: ALARM
    }),
    ...say('OPTIONAL STOPPING', WARN),
    ...fbox([
      ['OPTIONAL STOPPING', WARN],
      ['check the accumulating data'],
      ['stop when the result'],
      ['meets the chosen rule']
    ], WARN)
  );

  // ------------------------------------------------------------
  // 25–26. Compare the plans over many weeks.
  //
  // Every week in this comparison has equal true shift means.
  // Count weeks with any alarm, not the total number of
  // individual tests that cross the cutoff.
  // ------------------------------------------------------------

  const dailyDemoObjects = [
    ...testDays,
    currentCollectedFrame,
    stoppedWeekTitle,
    assumedEqualTag,
    pRuler,
    ...pThresholdObjects,
    pNow,
    statusNow,
    hypotheticalMarker,
    hypotheticalLabel,
    permanentAlarmStamp
  ];

  const repeatedWeeksTitle = textAt(
    'Repeat the experiment over many weeks',
    P ? 21 : 20,
    C.ink,
    [
      CX,
      P ? 1.36 : 1.40,
      0
    ]
  );

  function weekIcon(
    cx,
    cy,
    index,
    flagged = false
  ) {
    const color =
      flagged ? ALARM : DATA;

    const w = P ? 1.12 : 1.18;
    const h = P ? 0.80 : 0.68;

    const frame = panel(
      [cx, cy, 0],
      w,
      h,
      color
    );

    const title = textAt(
      `W${index}`,
      P ? 16 : 15,
      color,
      [
        cx,
        cy + 0.19,
        0
      ],
      true
    );

    const days = Array.from(
      { length: 5 },
      (_, k) =>
        rectangle(
          [
            cx + (k - 2) * 0.16,
            cy - 0.12,
            0
          ],
          0.11,
          0.17,
          color,
          color,
          0.80,
          0.02,
          1
        )
    );

    return new M.VGroup(
      frame,
      title,
      ...days
    );
  }

  const repeatedWeekIcons = [];

  for (let k = 0; k < 15; k++) {
    const col = k % 5;
    const row = Math.floor(k / 5);

    repeatedWeekIcons.push(
      weekIcon(
        CX +
          (col - 2) *
          (P ? 1.25 : 1.35),

        (P ? 0.45 : 0.66) -
          row * (P ? 1.05 : 0.88),

        k + 1
      )
    );
  }

  const nullWeeksTag = tag(
    'EQUAL TRUE MEANS IN EVERY WEEK',
    [
      CX,
      P ? -3.02 : -2.19,
      0
    ],
    GOOD,
    P ? 17 : 15
  );

  // 25. Now compare the plans over many weeks when the shifts
  // really have the same average.

  await until(S(25));
  await play(
    ...fadeAll(dailyDemoObjects),
    new M.FadeIn(repeatedWeeksTitle),
    stagger(repeatedWeekIcons, 1.80),
    new M.FadeIn(nullWeeksTag),
    ...say('MANY WEEKS WITH NO TRUE DIFFERENCE', GOOD),
    ...fbox([
      ['repeat the testing plan'],
      ['the true means stay equal'],
      ['every alarm is false', ALARM],
      ['compare the weekly rates']
    ], GOOD)
  );

  // ------------------------------------------------------------
  // Tally legend.
  //
  // Each small square represents one week.
  // Highlighted squares represent weeks with at least one alarm.
  //
  // The tally counts are schematic expected frequencies
  // matching the supplied example rates.
  // ------------------------------------------------------------

  function tallyToken(
    p,
    flagged,
    size = 0.10
  ) {
    const color =
      flagged ? ALARM : DATA;

    const r = new M.Rectangle({
      width: size,
      height: size,
      color,
      strokeWidth: flagged ? 1.3 : 0.7
    });

    r.setFill(
      color,
      flagged ? 0.98 : 0.20
    );

    r.moveTo(p);

    return r;
  }

  const tallyKeyNormal = new M.VGroup(
    tallyToken(
      [
        CX - 2.50,
        P ? -1.10 : -0.65,
        0
      ],
      false,
      0.25
    ),

    textAt(
      'No alarm',
      P ? 20 : 19,
      DATA,
      [
        CX - 1.30,
        P ? -1.10 : -0.65,
        0
      ]
    )
  );

  const tallyKeyFlag = new M.VGroup(
    tallyToken(
      [
        CX + 0.50,
        P ? -1.10 : -0.65,
        0
      ],
      true,
      0.25
    ),

    textAt(
      'Any alarm',
      P ? 20 : 19,
      ALARM,
      [
        CX + 1.65,
        P ? -1.10 : -0.65,
        0
      ]
    )
  );

  const tallyInstruction = textAt(
    'Count each flagged week only once',
    P ? 20 : 19,
    C.ink,
    [
      CX,
      P ? -2.12 : -1.45,
      0
    ]
  );

  // 26. Draw a tally of weeks with at least one alarm for each plan.

  await until(S(26));
  await play(
    ...fadeAll([
      ...repeatedWeekIcons,
      repeatedWeeksTitle,
      nullWeeksTag
    ]),
    new M.FadeIn(tallyKeyNormal),
    new M.FadeIn(tallyKeyFlag),
    new M.FadeIn(tallyInstruction),
    ...say('TALLY WEEKS WITH AT LEAST ONE ALARM'),
    ...fbox([
      ['one square = one week'],
      ['any alarm = flagged week', ALARM],
      ['count that week once']
    ])
  );

  // ------------------------------------------------------------
  // Four tally cards.
  //
  // Each card contains exactly 100 squares.
  //
  // Phone: four stacked cards.
  // Laptop: a two-by-two layout.
  //
  // The highlighted counts use the exact supplied rates:
  // 5, 8, 14 and 19 per 100 weeks.
  // ------------------------------------------------------------

  const CARD_W = P ? 6.45 : 3.52;
  const CARD_H = P ? 1.17 : 1.38;

  const CARD_POSITIONS = P
    ? [
        [CX, 0.84, 0],
        [CX, -0.52, 0],
        [CX, -1.88, 0],
        [CX, -3.24, 0]
      ]
    : [
        [CX - 1.87, 0.58, 0],
        [CX + 1.87, 0.58, 0],
        [CX - 1.87, -1.03, 0],
        [CX + 1.87, -1.03, 0]
      ];

  const TALLY_COLS = 20;
  const TALLY_ROWS = 5;

  const TOKEN_STEP = P ? 0.137 : 0.105;
  const TOKEN_SIZE = P ? 0.106 : 0.080;

  function tallyCard(k) {
    const looks = LOOK_COUNTS[k];
    const alarms = ALARM_RATES[k];

    const [cx, cy] =
      CARD_POSITIONS[k];

    const color =
      looks === 1 ? GOOD : WARN;

    const frame = panel(
      [cx, cy, 0],
      CARD_W,
      CARD_H,
      color
    );

    const title = textAt(
      looks === 1
        ? '1 look'
        : `${looks} looks`,
      P ? 19 : 18,
      color,
      P
        ? [cx - 2.30, cy + 0.26, 0]
        : [cx - 0.91, cy + 0.45, 0],
      true
    );

    const gridX =
      P ? cx - 0.28 : cx - 0.44;

    const gridY =
      P ? cy : cy - 0.08;

    const tokens = [];

    for (let j = 0; j < WEEKS; j++) {
      const row =
        Math.floor(j / TALLY_COLS);

      const col =
        j % TALLY_COLS;

      tokens.push(
        tallyToken(
          [
            gridX +
              (col - 9.5) * TOKEN_STEP,

            gridY +
              (2 - row) * TOKEN_STEP,

            0
          ],
          j < alarms,
          TOKEN_SIZE
        )
      );
    }

    const result = textAt(
      `${alarms}%`,
      P ? 27 : 25,
      ALARM,
      P
        ? [cx + 2.30, cy + 0.15, 0]
        : [cx + 1.11, cy - 0.01, 0],
      true
    );

    const perHundred = textAt(
      `${alarms} / 100`,
      P ? 16 : 14,
      C.muted,
      P
        ? [cx + 2.30, cy - 0.24, 0]
        : [cx + 1.11, cy - 0.39, 0],
      true
    );

    return new M.VGroup(
      frame,
      title,
      ...tokens,
      result,
      perHundred
    );
  }

  const tallyCards = LOOK_COUNTS.map(
    (_, k) => tallyCard(k)
  );

  const tallyTitle = textAt(
    'Weeks with at least one false alarm',
    P ? 19 : 18,
    C.ink,
    [
      CX,
      P ? 1.67 : 1.45,
      0
    ]
  );

  const tallyNote = textAt(
    'Expected counts per 100 weeks · example rates',
    P ? 15 : 14,
    C.muted,
    [
      CX,
      P ? -4.18 : -2.16,
      0
    ]
  );

  const tallyAlarmKey = new M.VGroup(
    tallyToken(
      [
        CX - 1.60,
        P ? -4.66 : -2.63,
        0
      ],
      true,
      0.14
    ),

    textAt(
      'Week with an alarm',
      P ? 16 : 15,
      ALARM,
      [
        CX + 0.28,
        P ? -4.66 : -2.63,
        0
      ]
    )
  );

  // 27. With just the test planned for the end,
  // expect about five alarms per hundred weeks.

  await until(S(27));
  await play(
    ...fadeAll([
      tallyKeyNormal,
      tallyKeyFlag,
      tallyInstruction
    ]),
    new M.FadeIn(tallyTitle),
    new M.FadeIn(tallyCards[0]),
    new M.FadeIn(tallyNote),
    new M.FadeIn(tallyAlarmKey),
    ...say('ONE PLANNED LOOK: ABOUT 5 FALSE ALARMS PER 100'),
    ...fbox([
      ['1 planned test', GOOD],
      ['about 5 flagged weeks', ALARM],
      ['out of 100 weeks'],
      ['false-alarm rate ≈ 5%']
    ], GOOD)
  );

  // 28. In our example, two looks give about eight alarms
  // per hundred weeks.

  await until(S(28));
  await play(
    new M.FadeIn(tallyCards[1]),
    ...say('TWO LOOKS: ABOUT 8 PER 100', WARN),
    ...fbox([
      ['1 look:  5%', GOOD],
      ['2 looks: 8%', WARN],
      ['about 8 flagged weeks', ALARM],
      ['out of 100']
    ], WARN)
  );

  // 29. Five daily looks give about fourteen per hundred weeks.

  await until(S(29));
  await play(
    new M.FadeIn(tallyCards[2]),
    ...say('FIVE DAILY LOOKS: ABOUT 14 PER 100', WARN),
    ...fbox([
      ['1 look:   5%', GOOD],
      ['2 looks:  8%', WARN],
      ['5 looks: 14%', ALARM],
      ['more false alarms']
    ], WARN)
  );

  // 30. With ten planned chances to look in this example,
  // there are about nineteen alarms per hundred weeks.

  await until(S(30));
  await play(
    new M.FadeIn(tallyCards[3]),
    ...say('TEN LOOKS: ABOUT 19 PER 100', WARN),
    ...fbox([
      ['1 look:    5%', GOOD],
      ['2 looks:   8%', WARN],
      ['5 looks:  14%', ALARM],
      ['10 looks: 19%', ALARM]
    ], WARN)
  );

  // ------------------------------------------------------------
  // 31–32. Calculate the repeated-example false-alarm rate.
  //
  // The numerator counts weeks with at least one alarm.
  // The denominator counts all weeks tested.
  // ------------------------------------------------------------

  const tallyObjects = [
    ...tallyCards,
    tallyTitle,
    tallyNote,
    tallyAlarmKey
  ];

  function fractionPicture(
    numerator,
    denominator,
    result,
    title
  ) {
    const cx = CX;
    const cy = P ? -0.62 : -0.35;

    const w = P ? 6.15 : 6.75;
    const h = P ? 3.35 : 2.65;

    const frame = panel(
      [cx, cy, 0],
      w,
      h,
      DATA
    );

    const heading = textAt(
      title,
      P ? 20 : 19,
      DATA,
      [
        cx,
        cy + h / 2 - 0.32,
        0
      ]
    );

    const top = textAt(
      numerator,
      P ? 25 : 24,
      ALARM,
      [
        cx,
        cy + (P ? 0.70 : 0.53),
        0
      ],
      true
    );

    const bottom = textAt(
      denominator,
      P ? 25 : 24,
      DATA,
      [
        cx,
        cy - (P ? 0.23 : 0.17),
        0
      ],
      true
    );

    const dividerWidth = Math.min(
      w - 0.65,
      Math.max(
        top.getWidth(),
        bottom.getWidth()
      ) + 0.42
    );

    const divider = line(
      [
        cx - dividerWidth / 2,
        cy + (P ? 0.23 : 0.18),
        0
      ],
      [
        cx + dividerWidth / 2,
        cy + (P ? 0.23 : 0.18),
        0
      ],
      C.ink,
      3
    );

    const resultText = textAt(
      result,
      P ? 28 : 26,
      GOOD,
      [
        cx,
        cy - (P ? 1.10 : 0.83),
        0
      ],
      true
    );

    return new M.VGroup(
      frame,
      heading,
      top,
      divider,
      bottom,
      resultText
    );
  }

  const wordFraction = fractionPicture(
    'Weeks with any alarm',
    'All weeks tested',
    '= Alarm rate',
    'Count the chance'
  );

  // 31. Here is how to count the chance in the repeated example.

  await until(S(31));
  await play(
    ...fadeAll(tallyObjects),
    new M.FadeIn(wordFraction),
    ...say('COUNT THE FLAGGED WEEKS, NOT THE TESTS'),
    ...fbox([
      ['numerator:', ALARM],
      ['  weeks with any alarm'],
      ['denominator:', DATA],
      ['  all weeks tested']
    ])
  );

  const numericFraction = fractionPicture(
    '14 flagged weeks',
    '100 weeks tested',
    '= 0.14 = 14%',
    'Five-look example'
  );

  // 32. Divide the number of weeks with any alarm
  // by the number of weeks tested.

  await until(S(32));
  await play(
    new M.FadeOut(wordFraction),
    new M.FadeIn(numericFraction),
    ...say('14 FLAGGED WEEKS ÷ 100 WEEKS = 14%', GOOD),
    ...fbox([
      ['false-alarm rate ='],
      ['weeks with any alarm', ALARM],
      ['÷ all weeks tested', DATA],
      ['14 ÷ 100 = 0.14', GOOD]
    ], GOOD)
  );

  // ------------------------------------------------------------
  // Common-scale false-alarm bars.
  //
  // The bars begin at zero and use a fixed 0–20% scale.
  // Bar lengths are proportional to the exact supplied rates.
  // ------------------------------------------------------------

  const BAR_LEFT = P
    ? CX - 1.70
    : CX - 1.88;

  const BAR_RIGHT = P
    ? CX + 2.68
    : CX + 2.75;

  const BAR_MAX = 20;

  const BAR_TOP = P ? 0.85 : 0.85;
  const BAR_STEP = P ? 1.00 : 0.66;

  const BAR_H = P ? 0.53 : 0.35;

  const BX = n =>
    BAR_LEFT +
    n / BAR_MAX *
    (BAR_RIGHT - BAR_LEFT);

  const BY = k =>
    BAR_TOP - k * BAR_STEP;

  const BAR_AXIS_Y = P ? -2.94 : -1.64;

  const barAxis = new M.VGroup(
    line(
      [BAR_LEFT, BAR_AXIS_Y, 0],
      [BAR_RIGHT, BAR_AXIS_Y, 0],
      C.muted,
      2.5
    ),

    ...[0, 5, 10, 15, 20].flatMap(n => [
      line(
        [BX(n), BAR_AXIS_Y - 0.07, 0],
        [BX(n), BAR_AXIS_Y + 0.07, 0],
        C.muted,
        1.8
      ),

      textAt(
        `${n}%`,
        P ? 16 : 15,
        C.muted,
        [
          BX(n),
          BAR_AXIS_Y - 0.28,
          0
        ],
        true
      )
    ]),

    textAt(
      'Weeks with a false alarm',
      P ? 19 : 17,
      C.ink,
      [
        (BAR_LEFT + BAR_RIGHT) / 2,
        BAR_AXIS_Y - 0.67,
        0
      ]
    )
  );

  const barGrid = new M.VGroup(
    ...[5, 10, 15, 20].map(n =>
      line(
        [
          BX(n),
          BAR_AXIS_Y,
          0
        ],
        [
          BX(n),
          BAR_TOP + BAR_H / 2 + 0.12,
          0
        ],
        C.card,
        1.4
      )
    )
  );

  function rateBar(k) {
    const value = ALARM_RATES[k];
    const looks = LOOK_COUNTS[k];

    const y = BY(k);
    const width = BX(value) - BX(0);

    const color =
      looks === 1 ? GOOD : ALARM;

    const halo = new M.Rectangle({
      width,
      height: BAR_H + 0.12,
      color,
      strokeWidth: 0
    });

    halo.setFill(color, 0.13);

    halo.moveTo([
      BAR_LEFT + width / 2,
      y,
      0
    ]);

    const body = new M.Rectangle({
      width,
      height: BAR_H,
      color,
      strokeWidth: 1.5
    });

    body.setFill(color, 0.82);

    body.moveTo([
      BAR_LEFT + width / 2,
      y,
      0
    ]);

    const name = textAt(
      looks === 1
        ? '1 look'
        : `${looks} looks`,
      P ? 18 : 17,
      C.ink,
      [
        BAR_LEFT - 0.86,
        y,
        0
      ],
      true
    );

    const result = textAt(
      `${value}%`,
      P ? 19 : 18,
      color,
      [
        BX(value) + 0.34,
        y,
        0
      ],
      true
    );

    return new M.VGroup(
      halo,
      body,
      name,
      result
    );
  }

  const rateBars = LOOK_COUNTS.map(
    (_, k) => rateBar(k)
  );

  const oneLookFocus = outline(
    [
      (BAR_LEFT + BX(5)) / 2,
      BY(0),
      0
    ],
    BX(5) - BAR_LEFT + 0.14,
    BAR_H + 0.18,
    GOOD
  );

  const fiveLookFocus = outline(
    [
      (BAR_LEFT + BX(14)) / 2,
      BY(2),
      0
    ],
    BX(14) - BAR_LEFT + 0.14,
    BAR_H + 0.18,
    ALARM
  );

  const ratioTag = tag(
    `${RATE_RATIO.toFixed(1)}× THE ORIGINAL RATE`,
    [
      CX,
      P ? -4.37 : -2.67,
      0
    ],
    WARN,
    P ? 20 : 18
  );

  // 33. The five-look plan raises the false-alarm rate
  // to nearly three times the planned rate.

  await until(S(33));
  await play(
    new M.FadeOut(numericFraction),
    new M.FadeIn(barGrid),
    new M.FadeIn(barAxis),
    stagger(rateBars, 1.40),
    new M.Create(oneLookFocus),
    new M.Create(fiveLookFocus),
    new M.FadeIn(ratioTag),
    ...say('14% IS NEARLY THREE TIMES 5%', WARN),
    ...fbox([
      ['one look: 5%', GOOD],
      ['five looks: 14%', ALARM],
      ['14 ÷ 5 = 2.8', WARN],
      ['nearly three times as high']
    ], WARN)
  );

  // ------------------------------------------------------------
  // 34. Plan your test date in advance if you want to use
  // the usual cutoff for one test.
  // ------------------------------------------------------------

  const barObjects = [
    barAxis,
    barGrid,
    ...rateBars,
    oneLookFocus,
    fiveLookFocus,
    ratioTag
  ];

  const fixedCalendar = Array.from(
    { length: DAYS },
    (_, k) => dayBox(k)
  );

  const fixedCalendarTitle = textAt(
    'Choose the test date before collecting data',
    P ? 19 : 18,
    C.ink,
    [
      CX,
      DAY_Y + DAY_H / 2 + 0.39,
      0
    ]
  );

  const plannedDateOutline = outline(
    [
      dayX(4),
      DAY_Y,
      0
    ],
    DAY_W + 0.16,
    DAY_H + 0.16,
    GOOD
  );

  const plannedDateArrow = arrow(
    [
      dayX(4),
      DAY_Y - DAY_H / 2 - 0.11,
      0
    ],
    [
      dayX(4),
      P ? -1.14 : -0.72,
      0
    ],
    GOOD,
    3,
    0.14
  );

  const plannedTestBadge = tag(
    'ONE PLANNED TEST',
    [
      CX,
      P ? -1.75 : -1.27,
      0
    ],
    GOOD,
    20
  );

  const plannedDateNote = textAt(
    'Do not move the test date because of the results',
    P ? 17 : 16,
    C.muted,
    [
      CX,
      P ? -2.62 : -2.08,
      0
    ]
  );

  const fixedCalendarObjects = [
    ...fixedCalendar,
    fixedCalendarTitle,
    plannedDateOutline,
    plannedDateArrow,
    plannedTestBadge,
    plannedDateNote
  ];

  await until(S(34));
  await play(
    ...fadeAll(barObjects),
    stagger(fixedCalendar),
    new M.FadeIn(fixedCalendarTitle),
    new M.Create(plannedDateOutline),
    new M.Create(plannedDateArrow),
    new M.FadeIn(plannedTestBadge),
    new M.FadeIn(plannedDateNote),
    ...say('CHOOSE THE TEST DATE IN ADVANCE', GOOD),
    ...fbox([
      ['for the ordinary one-test rule:'],
      ['choose the test date first', GOOD],
      ['collect the planned data'],
      ['test once at 0.05']
    ], GOOD)
  );

  // ------------------------------------------------------------
  // 35–36. Common trap: treating the cumulative looks as
  // independent tests.
  //
  // Visualize nested datasets.
  //
  // Look 1 contains day 1.
  // Look 2 contains days 1 and 2.
  // Look 3 contains days 1, 2 and 3.
  // Look 4 contains days 1 through 4.
  // Look 5 contains days 1 through 5.
  //
  // These are repeated uses of the SAME records.
  // ------------------------------------------------------------

  const NESTED_X0 =
    CX - (P ? 1.44 : 1.55);

  const NESTED_SP =
    P ? 0.82 : 0.90;

  const NESTED_TOP =
    P ? 0.90 : 0.93;

  const NESTED_STEP =
    P ? 0.82 : 0.58;

  const NX = k =>
    NESTED_X0 + k * NESTED_SP;

  const NY = k =>
    NESTED_TOP - k * NESTED_STEP;

  const NESTED_W =
    P ? 0.69 : 0.76;

  const NESTED_H =
    P ? 0.55 : 0.39;

  function nestedDataBox(
    day,
    look,
    active = true
  ) {
    const reused = day < look;

    const color =
      active
        ? reused ? DATA : GOOD
        : C.muted;

    const frame = rectangle(
      [
        NX(day),
        NY(look),
        0
      ],
      NESTED_W,
      NESTED_H,
      color,
      color,
      active ? 0.25 : 0.04,
      0.06,
      active ? 1.8 : 0.8
    );

    const label = textAt(
      active ? `D${day + 1}` : '–',
      P ? 16 : 15,
      color,
      [
        NX(day),
        NY(look),
        0
      ],
      true
    );

    return new M.VGroup(
      frame,
      label
    );
  }

  const nestedRows = [];

  for (let look = 0; look < DAYS; look++) {
    const label = textAt(
      `Look ${look + 1}`,
      P ? 17 : 16,
      C.ink,
      [
        NESTED_X0 - 1.13,
        NY(look),
        0
      ],
      true
    );

    const boxes = Array.from(
      { length: DAYS },
      (_, day) =>
        nestedDataBox(
          day,
          look,
          day <= look
        )
    );

    nestedRows.push(
      new M.VGroup(
        label,
        ...boxes
      )
    );
  }

  const nestedTitle = textAt(
    'Which weights does each test use?',
    P ? 20 : 19,
    C.ink,
    [
      CX,
      P ? 1.66 : 1.48,
      0
    ]
  );

  const reusedKey = textAt(
    'Blue: reused weights',
    P ? 17 : 15,
    DATA,
    [
      CX - 1.38,
      P ? -3.12 : -2.02,
      0
    ]
  );

  const freshKey = textAt(
    'Green: new weights',
    P ? 17 : 15,
    GOOD,
    [
      CX + 1.58,
      P ? -3.12 : -2.02,
      0
    ]
  );

  const wrongIndependenceTag = tag(
    'UNRELATED DATA?',
    [
      CX,
      P ? -3.95 : -2.64,
      0
    ],
    WARN,
    18
  );

  // 35. A common trap is to treat each look as a fresh test
  // with unrelated data.

  await until(S(35));
  await play(
    ...fadeAll(fixedCalendarObjects),
    new M.FadeIn(nestedTitle),
    stagger(nestedRows, 1.65),
    new M.FadeIn(reusedKey),
    new M.FadeIn(freshKey),
    new M.FadeIn(wrongIndependenceTag),
    ...say('COMMON TRAP: ASSUMING THE LOOKS ARE INDEPENDENT', WARN),
    ...fbox([
      ['new test does not mean'],
      ['an entirely new dataset'],
      ['earlier weights are reused', DATA],
      ['the tests are related', WARN]
    ], WARN)
  );

  // ------------------------------------------------------------
  // Highlight the repeated day-one records and the growing
  // set of data used by later looks.
  // ------------------------------------------------------------

  const firstDayReuseFrame = outline(
    [
      NX(0),
      (NY(0) + NY(4)) / 2,
      0
    ],
    NESTED_W + 0.15,
    NY(0) - NY(4) + NESTED_H + 0.15,
    DATA
  );

  const fifthLookFrame = outline(
    [
      (NX(0) + NX(4)) / 2,
      NY(4),
      0
    ],
    NX(4) - NX(0) + NESTED_W + 0.14,
    NESTED_H + 0.14,
    GOOD
  );

  const dependenceTag = tag(
    'ALARM RATES DEPEND ON THE SCHEDULE',
    [
      CX,
      P ? -4.10 : -2.65,
      0
    ],
    WARN,
    P ? 16 : 15
  );

  // 36. The later tests reuse earlier weights,
  // so the alarm rates depend on the schedule.

  await until(S(36));
  await play(
    new M.FadeOut(wrongIndependenceTag),
    new M.Create(firstDayReuseFrame),
    new M.Create(fifthLookFrame),
    new M.FadeIn(dependenceTag),
    ...say('THE LATER LOOKS REUSE THE EARLIER WEIGHTS', DATA),
    ...fbox([
      ['look 1: day 1'],
      ['look 5: days 1–5'],
      ['shared data link the tests'],
      ['rates depend on the schedule', WARN]
    ], WARN)
  );

  // ------------------------------------------------------------
  // 37. Stopping at the first small p-value gives false alarms
  // more chances than testing once as planned.
  //
  // Final picture:
  // All four supplied false-alarm rates on one common scale.
  // Highlight the planned one-look and daily five-look plans.
  // ------------------------------------------------------------

  const finalBarAxis = new M.VGroup(
    line(
      [BAR_LEFT, BAR_AXIS_Y, 0],
      [BAR_RIGHT, BAR_AXIS_Y, 0],
      C.muted,
      2.5
    ),

    ...[0, 5, 10, 15, 20].flatMap(n => [
      line(
        [BX(n), BAR_AXIS_Y - 0.07, 0],
        [BX(n), BAR_AXIS_Y + 0.07, 0],
        C.muted,
        1.8
      ),

      textAt(
        `${n}%`,
        P ? 16 : 15,
        C.muted,
        [
          BX(n),
          BAR_AXIS_Y - 0.28,
          0
        ],
        true
      )
    ]),

    textAt(
      'False-alarm rate across weeks',
      P ? 18 : 17,
      C.ink,
      [
        (BAR_LEFT + BAR_RIGHT) / 2,
        BAR_AXIS_Y - 0.67,
        0
      ]
    )
  );

  const finalBars = LOOK_COUNTS.map(
    (_, k) => rateBar(k)
  );

  const finalGrid = new M.VGroup(
    ...[5, 10, 15, 20].map(n =>
      line(
        [
          BX(n),
          BAR_AXIS_Y,
          0
        ],
        [
          BX(n),
          BAR_TOP + BAR_H / 2 + 0.12,
          0
        ],
        C.card,
        1.4
      )
    )
  );

  const finalRatioTag = tag(
    '5 LOOKS: 2.8× THE FALSE-ALARM RATE',
    [
      CX,
      P ? -4.36 : -2.60,
      0
    ],
    WARN,
    P ? 17 : 16
  );

  const finalExampleNote = textAt(
    'Example rates for these cumulative testing schedules',
    P ? 15 : 13,
    C.muted,
    [
      CX,
      P ? -4.90 : 1.43,
      0
    ]
  );

  const nestedObjects = [
    ...nestedRows,
    nestedTitle,
    reusedKey,
    freshKey,
    firstDayReuseFrame,
    fifthLookFrame,
    dependenceTag
  ];

  await until(S(37));
  await play(
    ...fadeAll(nestedObjects),
    new M.FadeIn(finalGrid),
    new M.FadeIn(finalBarAxis),
    stagger(finalBars, 1.40),
    new M.FadeIn(finalRatioTag),
    new M.FadeIn(finalExampleNote),
    ...say('MORE LOOKS GIVE FALSE ALARMS MORE CHANCES', WARN),
    ...fbox([
      ['OPTIONAL STOPPING', WARN],
      ['1 planned look: 5%', GOOD],
      ['5 daily looks: 14%', ALARM],
      ['nearly 3 times as high'],
      ['plan the test in advance', GOOD]
    ], WARN)
  );
}
