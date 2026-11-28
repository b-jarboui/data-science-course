// lesson 11.1.8
// Seasonal decomposition.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed shared chapter data.
  // ------------------------------------------------------------

  const WEEKS = [
    [37, 39, 43, 52, 54, 67, 58],
    [44, 44, 52, 56, 63, 75, 65],
    [51, 53, 58, 63, 71, 80, 72],
    [58, 58, 65, 71, 78, 88, 79]
  ];

  const SALES = WEEKS.flat();

  const WEEKLY_AVERAGES = [50, 57, 64, 71];

  const WEEKDAYS = [
    'Mon', 'Tue', 'Wed', 'Thu',
    'Fri', 'Sat', 'Sun'
  ];

  const EFFECTS = [-10, -10, -5, 0, 5, 15, 5];

  const DAYS = Array.from(
    { length: 28 },
    (_, k) => k + 1
  );

  const TREND = DAYS.map(d => 46 + d);

  const SEASONAL = DAYS.map(
    (_, k) => EFFECTS[k % 7]
  );

  const REMAINDER = SALES.map(
    (v, k) => v - TREND[k] - SEASONAL[k]
  );

  const SATURDAYS = [6, 13, 20, 27];

  const SATURDAY_SALES = [67, 75, 80, 88];
  const SATURDAY_TREND = [52, 59, 66, 73];
  const SATURDAY_GAPS = [15, 16, 14, 15];

  const TARGET_DAY = 20;
  const TARGET_SALES = 80;
  const TARGET_TREND = 66;
  const TARGET_SEASONAL = 15;
  const TARGET_FITTED = 81;
  const TARGET_REMAINDER = -1;

  // Colour meanings remain consistent throughout.
  // Cyan: actual sales.
  // Green: trend.
  // Amber: seasonal part.
  // Violet: remainder.

  const AC = C.cyan;
  const TC = C.green;
  const SC = C.amber;
  const RC = C.violet;

  const WEEK_COLORS = [
    C.cyan,
    C.green,
    C.amber,
    C.pink || '#F472B6'
  ];

  const signed = n =>
    n > 0
      ? `+${n}`
      : n < 0
        ? `−${Math.abs(n)}`
        : '0';

  const sum = a =>
    a.reduce((s, v) => s + v, 0);

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Safe content between y=-5.5 and y=4.3.
  //
  // Laptop: 14.22 × 8.
  // Safe content between y=-3.0 and y=2.3.
  //
  // Chart above / formula below on phone.
  // Chart left / formula right on laptop.
  // ------------------------------------------------------------

  const CX = P ? 0.12 : -2.65;

  const PILL = P
    ? [0, 3.75, 0]
    : [0, 1.95, 0];

  const BOXP = P
    ? [0, -4.40, 0]
    : [4.30, -0.35, 0];

  const TITLE_Y = P ? 3.22 : 1.46;

  const XWIDTH = P ? 6.12 : 6.85;
  const XLEFT = CX - XWIDTH / 2;
  const XRIGHT = CX + XWIDTH / 2;

  const YBASE = P ? -2.20 : -2.02;
  const YUNIT = P ? 0.084 : 0.055;

  const x = day =>
    XLEFT + (day - 1) * XWIDTH / 27;

  const y = value =>
    YBASE + (value - 30) * YUNIT;

  const pt = (day, value) =>
    [x(day), y(value), 0];

  const say = (s, color = AC) =>
    showA(s, color, PILL);

  const fadeIn = objects =>
    objects.filter(Boolean).map(
      o => new M.FadeIn(o)
    );

  const fadeOut = objects =>
    objects.filter(Boolean).map(
      o => new M.FadeOut(o)
    );

  function txt(
    s, size, color, position,
    mono = false,
    maxw = FW - 1.1
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(position);

    return t;
  }

  function rect(
    width, height, position,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(position);

    return r;
  }

  function rounded(
    width, height, position,
    color,
    opacity = 0.96
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(position);

    return r;
  }

  function line(
    a, b,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function arrow(
    a, b,
    color = SC,
    strokeWidth = 2.5,
    headSize = 0.15
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    const wing = headSize * 0.48;

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(
        b,
        [
          b[0] - headSize * ux + wing * uy,
          b[1] - headSize * uy - wing * ux,
          0
        ],
        color,
        strokeWidth
      ),
      line(
        b,
        [
          b[0] - headSize * ux - wing * uy,
          b[1] - headSize * uy + wing * ux,
          0
        ],
        color,
        strokeWidth
      )
    );
  }

  function ring(
    position,
    radius,
    color,
    strokeWidth = 2.5
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    r.setFill(color, 0);
    r.moveTo(position);

    return r;
  }

  function glowDot(position, color, radius = 0.075) {
    const halo = new M.Dot({
      point: position,
      radius: radius * 2.0,
      color
    });

    halo.setFill(color, 0.18);

    const d = new M.Dot({
      point: position,
      radius,
      color
    });

    return new M.VGroup(halo, d);
  }

  function tag(
    s, color, position,
    size = 17,
    maxw = FW - 1.1
  ) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(position);

    return t;
  }

  function indicate(
    object,
    color = AC,
    runTime = 0.8
  ) {
    return new M.Indicate(object, {
      color,
      runTime
    });
  }

  function lagIn(objects, runTime = 1.4, lagRatio = 0.08) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function lagCreate(objects, runTime = 1.4, lagRatio = 0.08) {
    return new M.LaggedStart(
      objects.map(o => new M.Create(o)),
      { lagRatio, runTime }
    );
  }

  // Only freshly constructed objects are grouped here.
  // Already-visible objects retain their original identities.

  function polyline(points, color, strokeWidth = 2.2) {
    const parts = [];

    for (let k = 1; k < points.length; k++) {
      parts.push(
        line(
          points[k - 1],
          points[k],
          color,
          strokeWidth
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Formula box following the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = AC, position = BOXP) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.97);
    r.moveTo(position);

    const left =
      position[0] - wd / 2 + 0.35;

    const top =
      position[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.25;
    const maxh = P ? 2.48 : 3.65;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(position);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];

    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // 0–2: The bakery's sales contain a rising trend
  // and a repeating weekly pattern.
  // ------------------------------------------------------------

  const chartParts = [];

  let chartTitle = txt(
    'BAKERY: DAILY LOAVES SOLD',
    P ? 23 : 21,
    AC,
    [CX, TITLE_Y, 0],
    true,
    P ? FW - 1.1 : 7.0
  );

  chartParts.push(chartTitle);

  const chartFloor = line(
    [XLEFT - 0.10, y(30), 0],
    [XRIGHT + 0.10, y(30), 0],
    C.muted,
    2
  );

  chartParts.push(chartFloor);

  for (const v of [30, 40, 50, 60, 70, 80, 90]) {
    chartParts.push(
      line(
        [XLEFT - 0.10, y(v), 0],
        [XRIGHT + 0.10, y(v), 0],
        C.muted,
        0.65
      )
    );

    chartParts.push(
      txt(
        v,
        P ? 16 : 15,
        C.muted,
        [
          XLEFT - 0.34,
          y(v),
          0
        ],
        true,
        0.45
      )
    );
  }

  const weekDividers = [];

  for (let k = 1; k <= 3; k++) {
    const xx =
      (x(k * 7) + x(k * 7 + 1)) / 2;

    weekDividers.push(
      dashed(
        [xx, y(30), 0],
        [xx, y(90), 0],
        C.muted
      )
    );
  }

  chartParts.push(...weekDividers);

  const weekLabels = [];

  for (let k = 0; k < 4; k++) {
    weekLabels.push(
      txt(
        `WEEK ${k + 1}`,
        P ? 16 : 15,
        C.muted,
        [
          x(k * 7 + 4),
          y(30) - 0.30,
          0
        ],
        true,
        XWIDTH / 4 - 0.10
      )
    );
  }

  chartParts.push(...weekLabels);

  const salesPoints = DAYS.map(
    (day, k) => pt(day, SALES[k])
  );

  const salesLine = polyline(
    salesPoints,
    AC,
    2.1
  );

  const salesDots = salesPoints.map(
    p => glowDot(
      p,
      AC,
      P ? 0.045 : 0.05
    )
  );

  const introTrend = line(
    pt(1, TREND[0]),
    pt(28, TREND[27]),
    TC,
    3
  );

  const introTrendTag = tag(
    'SLOW RISE',
    TC,
    [
      x(10),
      y(TREND[9]) - 0.47,
      0
    ],
    15,
    2.30
  );

  const introSatRings = SATURDAYS.map(day =>
    ring(
      pt(day, SALES[day - 1]),
      P ? 0.115 : 0.12,
      SC,
      2.5
    )
  );

  const introSeasonTag = tag(
    'WEEKLY SATURDAY PEAKS',
    SC,
    [
      CX,
      P ? -2.92 : -2.75,
      0
    ],
    P ? 16 : 15,
    P ? 6.3 : 6.8
  );

  await until(S(0));
  await play(
    ...fadeIn(chartParts),
    new M.FadeIn(salesLine),
    lagIn(salesDots, 1.7, 0.035),
    ...say('FOUR WEEKS OF BAKERY SALES', AC)
  );

  await until(S(1));
  await play(
    new M.Create(introTrend),
    new M.FadeIn(introTrendTag),
    lagIn(introSatRings, 1.1, 0.20),
    new M.FadeIn(introSeasonTag),
    ...fbox([
      ['Trend', TC],
      'A slow rise in sales.',
      ['Seasonality', SC],
      'A weekly repeating pattern.'
    ], TC),
    ...say('A SLOW RISE AND A WEEKLY PATTERN', TC)
  );

  await until(S(2));
  await play(
    ...fbox([
      ['One day’s sales', AC],
      'How much is trend?',
      'How much is weekday effect?',
      'What is left over?'
    ], AC),
    ...say('HOW MUCH COMES FROM EACH PART?', AC)
  );

  // ------------------------------------------------------------
  // 3–4: Select Saturday of week three, day 20.
  // Its actual sales were 80 loaves.
  // ------------------------------------------------------------

  const targetRing = ring(
    pt(TARGET_DAY, TARGET_SALES),
    P ? 0.17 : 0.16,
    AC,
    3
  );

  const targetLabel = txt(
    '80',
    25,
    AC,
    [
      x(TARGET_DAY),
      y(TARGET_SALES) + 0.34,
      0
    ],
    true
  );

  const targetGuide = dashed(
    [
      x(TARGET_DAY),
      y(30),
      0
    ],
    pt(TARGET_DAY, TARGET_SALES),
    AC
  );

  const targetDayTag = tag(
    'WEEK 3 SATURDAY',
    AC,
    [
      x(TARGET_DAY),
      P ? -2.91 : -2.75,
      0
    ],
    15,
    2.65
  );

  await until(S(3));
  await play(
    ...fadeOut([
      introTrend,
      introTrendTag,
      ...introSatRings,
      introSeasonTag
    ]),
    new M.Create(targetRing),
    new M.Create(targetGuide),
    new M.FadeIn(targetLabel),
    new M.FadeIn(targetDayTag),
    ...fbox([
      ['Our chosen day', AC],
      'Saturday of week 3',
      ['Actual sales = 80 loaves', AC]
    ], AC),
    ...say('SATURDAY OF WEEK THREE: 80 LOAVES', AC)
  );

  // Receipt metaphor: one total, three component lines.

  function receiptCard() {
    const xx = BOXP[0];
    const yy = BOXP[1];

    const wd = P ? 6.1 : 4.15;
    const ht = P ? 2.35 : 2.55;

    const parts = [
      rounded(wd, ht, BOXP, AC)
    ];

    parts.push(
      txt(
        'SALES RECEIPT',
        20,
        AC,
        [
          xx,
          yy + ht / 2 - 0.25,
          0
        ],
        true
      )
    );

    const rows = [
      ['Trend', TC],
      ['Saturday effect', SC],
      ['Remainder', RC]
    ];

    rows.forEach(([name, color], k) => {
      const ry =
        yy + 0.47 - k * 0.37;

      parts.push(
        txt(
          name,
          P ? 18 : 17,
          color,
          [
            xx - wd * 0.15,
            ry,
            0
          ],
          false,
          wd * 0.67
        )
      );

      parts.push(
        txt(
          '?',
          20,
          color,
          [
            xx + wd * 0.35,
            ry,
            0
          ],
          true
        )
      );
    });

    parts.push(
      line(
        [
          xx - wd / 2 + 0.30,
          yy - 0.51,
          0
        ],
        [
          xx + wd / 2 - 0.30,
          yy - 0.51,
          0
        ],
        C.muted,
        1.5
      )
    );

    parts.push(
      txt(
        'TOTAL = 80',
        24,
        AC,
        [
          xx,
          yy - ht / 2 + 0.27,
          0
        ],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const receipt = receiptCard();

  await until(S(4));
  await play(
    ...clearBox(),
    new M.FadeIn(receipt),
    indicate(targetLabel, AC),
    ...say('SPLIT THE TOTAL LIKE ITEMS ON A BILL', AC)
  );

  // ------------------------------------------------------------
  // 5–9: Part one — trend.
  //
  // Weekly averages are placed at their middle days:
  // day 4 = 50
  // day 11 = 57
  // day 18 = 64
  // day 25 = 71
  //
  // The straight trend line is 46 + day number.
  // ------------------------------------------------------------

  const trendTitle = txt(
    'PART 1: TREND',
    P ? 25 : 22,
    TC,
    [CX, TITLE_Y, 0],
    true
  );

  await until(S(5));
  await play(
    new M.FadeOut(receipt),
    new M.Transform(
      chartTitle,
      trendTitle,
      { runTime: 0.30 }
    ),
    ...say('PART ONE: THE TREND', TC)
  );

  const averageDots = [];
  const averageLabels = [];

  WEEKLY_AVERAGES.forEach((value, k) => {
    const middleDay = k * 7 + 4;

    averageDots.push(
      glowDot(
        pt(middleDay, value),
        TC,
        P ? 0.095 : 0.09
      )
    );

    averageLabels.push(
      txt(
        value,
        21,
        TC,
        [
          x(middleDay),
          y(value) + 0.30,
          0
        ],
        true
      )
    );
  });

  const trendLine = line(
    pt(1, TREND[0]),
    pt(28, TREND[27]),
    TC,
    3.5
  );

  await until(S(6));
  await play(
    ...fadeOut([
      salesLine,
      ...salesDots,
      targetRing,
      targetGuide,
      targetLabel,
      targetDayTag
    ]),
    lagIn(averageDots, 1.25, 0.23),
    ...fadeIn(averageLabels),
    new M.Create(trendLine),
    ...fbox([
      ['Four weekly averages', TC],
      '50 → 57 → 64 → 71',
      'Each week rises by 7.',
      ['Draw a straight line.', TC]
    ], TC),
    ...say('DRAW A LINE THROUGH THE WEEKLY AVERAGES', TC)
  );

  // The 28 daily positions are marked with ticks.
  // Label selected days for readability on a phone.

  const dayTicks = DAYS.map(day =>
    line(
      [x(day), y(30) - 0.055, 0],
      [x(day), y(30) + 0.055, 0],
      C.muted,
      1
    )
  );

  const numberedDays = [
    1, 4, 7, 10, 13,
    16, 19, 22, 25, 28
  ];

  const dayLabels = numberedDays.map(day =>
    txt(
      day,
      P ? 13 : 14,
      C.muted,
      [x(day), y(30) - 0.27, 0],
      true,
      0.40
    )
  );

  const dayAxisLabel = txt(
    'Day number',
    16,
    C.muted,
    [
      CX,
      y(30) - 0.62,
      0
    ]
  );

  const riseA = pt(10, TREND[9]);
  const riseB = pt(11, TREND[10]);

  const riseCorner = [
    riseB[0],
    riseA[1],
    0
  ];

  const riseStep = new M.VGroup(
    line(
      riseA,
      riseCorner,
      SC,
      2.5
    ),
    line(
      riseCorner,
      riseB,
      SC,
      3
    )
  );

  const dailyRiseTag = tag(
    '+1 LOAF PER DAY',
    TC,
    [
      CX,
      y(45),
      0
    ],
    16,
    3.35
  );

  await until(S(7));
  await play(
    ...fadeOut(weekLabels),
    ...fadeIn(dayTicks),
    ...fadeIn(dayLabels),
    new M.FadeIn(dayAxisLabel),
    new M.FadeIn(riseStep),
    new M.FadeIn(dailyRiseTag),
    ...fbox([
      ['Seven days per week', TC],
      'Rise of 7 loaves ÷ 7 days',
      ['= 1 loaf per day', TC],
      'Trend = 46 + day number'
    ], TC),
    ...say('EACH DAY IS ONE LOAF HIGHER', TC)
  );

  const trendTarget = glowDot(
    pt(TARGET_DAY, TARGET_TREND),
    TC,
    P ? 0.11 : 0.105
  );

  const trendTargetLabel = txt(
    '66',
    27,
    TC,
    [
      x(TARGET_DAY),
      y(TARGET_TREND) + 0.32,
      0
    ],
    true
  );

  const trendTargetGuide = dashed(
    [
      x(TARGET_DAY),
      y(30),
      0
    ],
    pt(TARGET_DAY, TARGET_TREND),
    TC
  );

  const day20Tag = tag(
    'DAY 20',
    TC,
    [
      x(TARGET_DAY),
      y(30) - 0.96,
      0
    ],
    15,
    1.70
  );

  await until(S(8));
  await play(
    ...fadeOut([
      riseStep,
      dailyRiseTag
    ]),
    new M.Create(trendTargetGuide),
    new M.FadeIn(trendTarget),
    new M.FadeIn(trendTargetLabel),
    new M.FadeIn(day20Tag),
    ...fbox([
      ['Week 3 Saturday', AC],
      'Day number = 20',
      'Trend = 46 + 20',
      ['= 66 loaves', TC]
    ], TC),
    ...say('DAY 20: TREND = 66 LOAVES', TC)
  );

  const trendOnlyTag = tag(
    'TREND ALONE: 66',
    TC,
    [
      CX,
      P ? 2.28 : 1.04,
      0
    ],
    16,
    3.70
  );

  await until(S(9));
  await play(
    new M.FadeIn(trendOnlyTag),
    indicate(trendTarget, TC),
    ...fbox([
      ['Part 1', TC],
      ['Trend = 66 loaves', TC],
      'Before the weekday effect',
      'or any extra surprises.'
    ], TC),
    ...say('THE TREND ALONE EXPECTS 66 LOAVES', TC)
  );

  // ------------------------------------------------------------
  // 10–14: Part two — the Saturday effect.
  //
  // Compare the four actual Saturdays with the trend
  // at those same dates.
  //
  // 67 − 52 = 15
  // 75 − 59 = 16
  // 80 − 66 = 14
  // 88 − 73 = 15
  //
  // Their average is 15.
  // ------------------------------------------------------------

  const seasonalTitle = txt(
    'PART 2: THE SATURDAY EFFECT',
    P ? 22 : 20,
    SC,
    [CX, TITLE_Y, 0],
    true,
    P ? FW - 1.1 : 7.0
  );

  const satActualDots = SATURDAYS.map(
    (day, k) =>
      glowDot(
        pt(day, SATURDAY_SALES[k]),
        AC,
        P ? 0.085 : 0.08
      )
  );

  const satActualLabels = SATURDAYS.map(
    (day, k) =>
      txt(
        SATURDAY_SALES[k],
        21,
        AC,
        [
          x(day),
          y(SATURDAY_SALES[k]) + 0.28,
          0
        ],
        true
      )
  );

  const satTrendDots = SATURDAYS.map(
    (day, k) =>
      ring(
        pt(day, SATURDAY_TREND[k]),
        P ? 0.075 : 0.08,
        TC,
        2.3
      )
  );

  const satTrendLabels = SATURDAYS.map(
    (day, k) =>
      txt(
        SATURDAY_TREND[k],
        P ? 17 : 18,
        TC,
        [
          x(day),
          y(SATURDAY_TREND[k]) - 0.27,
          0
        ],
        true
      )
  );

  await until(S(10));
  await play(
    ...fadeOut([
      ...averageDots,
      ...averageLabels,
      trendTarget,
      trendTargetLabel,
      trendTargetGuide,
      day20Tag,
      trendOnlyTag
    ]),
    new M.Transform(
      chartTitle,
      seasonalTitle
    ),
    ...fadeIn(satActualDots),
    ...fadeIn(satActualLabels),
    ...fadeIn(satTrendDots),
    ...fadeIn(satTrendLabels),
    ...fbox([
      ['Part 2', SC],
      'Compare each Saturday',
      'with the trend on',
      'that same day.'
    ], SC),
    ...say('PART TWO: THE SATURDAY EFFECT', SC)
  );

  const satGaps = SATURDAYS.map(
    (day, k) =>
      line(
        pt(day, SATURDAY_TREND[k]),
        pt(day, SATURDAY_SALES[k]),
        SC,
        3.5
      )
  );

  const satGapLabels = SATURDAYS.map(
    (day, k) =>
      txt(
        signed(SATURDAY_GAPS[k]),
        P ? 19 : 19,
        SC,
        [
          x(day) + 0.34,
          (
            y(SATURDAY_TREND[k]) +
            y(SATURDAY_SALES[k])
          ) / 2,
          0
        ],
        true,
        0.60
      )
  );

  await until(S(11));
  await play(
    lagCreate(satGaps, 1.45, 0.18),
    ...fbox([
      ['Saturday gap', SC],
      'Actual Saturday sales',
      'minus its trend value.'
    ], SC),
    ...say('MEASURE EACH SATURDAY ABOVE THE TREND', SC)
  );

  await until(S(12));
  await play(
    indicate(satGaps[0], SC),
    new M.FadeIn(satGapLabels[0]),
    ...fbox([
      ['Week 1 Saturday', AC],
      'Actual = 67',
      'Trend  = 52',
      ['67 − 52 = 15', SC]
    ], SC),
    ...say('WEEK ONE: FIFTEEN ABOVE THE TREND', SC)
  );

  await until(S(13));
  await play(
    new M.LaggedStart(
      [1, 2, 3].map(k =>
        new M.LaggedStart(
          [
            new M.FadeIn(satGapLabels[k]),
            new M.Indicate(
              satGaps[k],
              { color: SC }
            )
          ],
          { lagRatio: 0.08 }
        )
      ),
      {
        lagRatio: 0.65,
        runTime: 4.1
      }
    ),
    ...fbox([
      ['Other Saturdays', SC],
      '75 − 59 = 16',
      '80 − 66 = 14',
      '88 − 73 = 15'
    ], SC),
    ...say('SIXTEEN, FOURTEEN, FIFTEEN', SC)
  );

  const saturdayMeanTag = tag(
    'SATURDAY EFFECT = +15',
    SC,
    [
      CX,
      P ? 2.29 : 1.02,
      0
    ],
    17,
    4.30
  );

  await until(S(14));
  await play(
    new M.FadeIn(saturdayMeanTag),
    ...fbox([
      ['Average Saturday gap', SC],
      '15 + 16 + 14 + 15',
      '= 60 loaves',
      ['60 ÷ 4 = 15', SC],
      ['Saturday effect = +15', SC]
    ], SC),
    ...say('AVERAGE THE FOUR GAPS: PLUS FIFTEEN', SC)
  );

  // ------------------------------------------------------------
  // 15–17: Find the weekday effects.
  //
  // Every weekday gets its own average gap from the trend.
  //
  // Mon −10
  // Tue −10
  // Wed −5
  // Thu 0
  // Fri +5
  // Sat +15
  // Sun +5
  //
  // Their sum is zero.
  // ------------------------------------------------------------

  const effectChart = [];

  const EFFECT_CX = CX;
  const EFFECT_SP = P ? 0.89 : 0.98;

  const EFFECT_ZERO = P ? -0.12 : -0.48;
  const EFFECT_UNIT = P ? 0.137 : 0.096;

  const EFFECT_BW = P ? 0.59 : 0.66;

  const ex = k =>
    EFFECT_CX + (k - 3) * EFFECT_SP;

  const ey = n =>
    EFFECT_ZERO + n * EFFECT_UNIT;

  const ELEFT = ex(0) - EFFECT_SP / 2;
  const ERIGHT = ex(6) + EFFECT_SP / 2;

  const effectsTitle = txt(
    'AVERAGE WEEKDAY EFFECTS',
    P ? 23 : 21,
    SC,
    [CX, TITLE_Y, 0],
    true
  );

  effectChart.push(effectsTitle);

  for (const v of [-10, -5, 0, 5, 10, 15]) {
    effectChart.push(
      line(
        [ELEFT, ey(v), 0],
        [ERIGHT, ey(v), 0],
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.6 : 0.65
      )
    );

    effectChart.push(
      txt(
        signed(v),
        P ? 16 : 15,
        C.muted,
        [
          ELEFT - 0.30,
          ey(v),
          0
        ],
        true,
        0.48
      )
    );
  }

  const effectLabels = WEEKDAYS.map(
    (name, k) =>
      txt(
        name,
        P ? 16 : 17,
        k === 5 ? SC : C.muted,
        [
          ex(k),
          ey(-10) - 0.47,
          0
        ],
        true,
        EFFECT_SP - 0.08
      )
  );

  effectChart.push(...effectLabels);

  function effectBar(k) {
    const v = EFFECTS[k];

    if (v === 0) {
      return glowDot(
        [
          ex(k),
          EFFECT_ZERO,
          0
        ],
        SC,
        0.075
      );
    }

    return rect(
      EFFECT_BW,
      Math.abs(v) * EFFECT_UNIT,
      [
        ex(k),
        EFFECT_ZERO + v * EFFECT_UNIT / 2,
        0
      ],
      SC,
      k === 5 ? 0.88 : 0.65,
      2
    );
  }

  const effectBars = EFFECTS.map(
    (_, k) => effectBar(k)
  );

  const effectNumbers = EFFECTS.map(
    (v, k) =>
      txt(
        signed(v),
        P ? 20 : 20,
        SC,
        [
          ex(k),
          ey(v) + (
            v < 0 ? -0.24 : 0.26
          ),
          0
        ],
        true,
        EFFECT_SP - 0.08
      )
  );

  const effectGroups = effectBars.map(
    (b, k) =>
      new M.VGroup(
        b,
        effectNumbers[k]
      )
  );

  function remainingTrendChartParts() {
    return [
      ...chartParts.filter(
        o => !weekLabels.includes(o)
      ),
      ...dayTicks,
      ...dayLabels,
      dayAxisLabel,
      trendLine,
      ...satActualDots,
      ...satActualLabels,
      ...satTrendDots,
      ...satTrendLabels,
      ...satGaps,
      ...satGapLabels,
      saturdayMeanTag
    ];
  }

  await until(S(15));
  await play(
    ...fadeOut(
      remainingTrendChartParts()
    ),
    ...fadeIn(effectChart),
    new M.FadeIn(effectGroups[5]),
    ...fbox([
      ['Do the same for every day', SC],
      'Four Mondays',
      'Four Tuesdays',
      'And so on through Sunday.'
    ], SC),
    ...say('FIND AN AVERAGE GAP FOR EVERY WEEKDAY', SC)
  );

  // The long narration beat reveals the effects in sequence.
  // Bars below zero are negative seasonal effects.
  // Bars above zero are positive seasonal effects.

  await until(S(16));
  await play(
    new M.LaggedStart(
      effectGroups.filter((_, k) => k !== 5).map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.90,
        runTime: 10.4
      }
    ),
    ...fbox([
      ['Weekday effects', SC],
      'Mon −10   Tue −10',
      'Wed  −5   Thu   0',
      'Fri  +5   Sat +15',
      'Sun  +5'
    ], SC),
    ...say('THE SEVEN WEEKDAY EFFECTS', SC)
  );

  const balanceTag = tag(
    '−25 + 25 = 0',
    TC,
    [
      CX,
      P ? -2.92 : -2.68,
      0
    ],
    18,
    4.5
  );

  await until(S(17));
  await play(
    new M.FadeIn(balanceTag),
    ...fbox([
      ['Negative effects', SC],
      '−10 − 10 − 5 = −25',
      ['Positive effects', SC],
      '5 + 15 + 5 = 25',
      ['−25 + 25 = 0', TC]
    ], TC),
    ...say('THE WEEKDAY EFFECTS ADD UP TO ZERO', TC)
  );

  // ------------------------------------------------------------
  // 18–22: Put the selected Saturday together.
  //
  // Trend = 66.
  // Seasonal part = +15.
  // Combined expectation = 81.
  // Actual = 80.
  // Remainder = −1.
  //
  // Use a proportional waterfall picture.
  // ------------------------------------------------------------

  const BUILD_CX = CX;
  const BUILD_BASE = P ? -2.15 : -2.10;
  const BUILD_UNIT = P ? 0.049 : 0.0345;

  const buildY = value =>
    BUILD_BASE + value * BUILD_UNIT;

  const BUILD_SP = P ? 1.60 : 1.80;
  const BUILD_BW = P ? 0.95 : 1.08;

  const b1x = BUILD_CX - BUILD_SP;
  const b2x = BUILD_CX;
  const b3x = BUILD_CX + BUILD_SP;

  const buildParts = [];

  const buildTitle = txt(
    'SATURDAY, WEEK THREE',
    P ? 23 : 21,
    AC,
    [CX, TITLE_Y, 0],
    true
  );

  buildParts.push(buildTitle);

  const buildFloor = line(
    [
      b1x - BUILD_BW / 2 - 0.45,
      BUILD_BASE,
      0
    ],
    [
      b3x + BUILD_BW / 2 + 0.45,
      BUILD_BASE,
      0
    ],
    C.muted,
    2
  );

  buildParts.push(buildFloor);

  for (const v of [0, 20, 40, 60, 80]) {
    buildParts.push(
      txt(
        v,
        P ? 16 : 15,
        C.muted,
        [
          b1x - BUILD_BW / 2 - 0.72,
          buildY(v),
          0
        ],
        true,
        0.40
      )
    );

    if (v > 0) {
      buildParts.push(
        line(
          [
            b1x - BUILD_BW / 2 - 0.45,
            buildY(v),
            0
          ],
          [
            b3x + BUILD_BW / 2 + 0.45,
            buildY(v),
            0
          ],
          C.muted,
          0.65
        )
      );
    }
  }

  const trendBlock = rect(
    BUILD_BW,
    66 * BUILD_UNIT,
    [
      b1x,
      buildY(33),
      0
    ],
    TC,
    0.65,
    2
  );

  const trendBlockNumber = txt(
    '66',
    29,
    TC,
    [
      b1x,
      buildY(66) + 0.27,
      0
    ],
    true
  );

  const trendBlockLabel = txt(
    'TREND',
    16,
    TC,
    [
      b1x,
      BUILD_BASE - 0.33,
      0
    ],
    true,
    BUILD_SP - 0.10
  );

  const trendBlockParts = [
    trendBlock,
    trendBlockNumber,
    trendBlockLabel
  ];

  const seasonBlock = rect(
    BUILD_BW,
    15 * BUILD_UNIT,
    [
      b2x,
      buildY(66 + 7.5),
      0
    ],
    SC,
    0.80,
    2
  );

  const seasonBlockNumber = txt(
    '+15',
    22,
    SC,
    [
      b2x,
      buildY(81) + 0.27,
      0
    ],
    true
  );

  const seasonBlockLabel = txt(
    'WEEKDAY',
    16,
    SC,
    [
      b2x,
      BUILD_BASE - 0.33,
      0
    ],
    true,
    BUILD_SP - 0.10
  );

  const guide66 = dashed(
    [
      b1x + BUILD_BW / 2,
      buildY(66),
      0
    ],
    [
      b2x - BUILD_BW / 2,
      buildY(66),
      0
    ],
    TC
  );

  const fittedBar = rect(
    BUILD_BW,
    81 * BUILD_UNIT,
    [
      b3x,
      buildY(40.5),
      0
    ],
    SC,
    0.20,
    2
  );

  const fittedNumber = txt(
    '81',
    29,
    SC,
    [
      b3x,
      buildY(81) + 0.30,
      0
    ],
    true
  );

  const fittedLabel = txt(
    'EXPECTED',
    16,
    SC,
    [
      b3x,
      BUILD_BASE - 0.33,
      0
    ],
    true,
    BUILD_SP - 0.10
  );

  const guide81 = dashed(
    [
      b2x + BUILD_BW / 2,
      buildY(81),
      0
    ],
    [
      b3x - BUILD_BW / 2,
      buildY(81),
      0
    ],
    SC
  );

  const seasonBlockParts = [
    seasonBlock,
    seasonBlockNumber,
    seasonBlockLabel,
    guide66
  ];

  const fittedParts = [
    fittedBar,
    fittedNumber,
    fittedLabel,
    guide81
  ];

  await until(S(18));
  await play(
    ...fadeOut([
      ...effectChart,
      ...effectGroups,
      balanceTag
    ]),
    ...fadeIn(buildParts),
    new M.LaggedStart(
      [
        new M.LaggedStart(
          fadeIn(trendBlockParts),
          { lagRatio: 0.05 }
        ),
        new M.LaggedStart(
          fadeIn(seasonBlockParts),
          { lagRatio: 0.05 }
        ),
        new M.LaggedStart(
          fadeIn(fittedParts),
          { lagRatio: 0.05 }
        )
      ],
      {
        lagRatio: 0.55,
        runTime: 2.4
      }
    ),
    ...fbox([
      ['Our Saturday', AC],
      ['Trend    = 66', TC],
      ['Saturday = +15', SC],
      ['66 + 15 = 81', SC]
    ], SC),
    ...say('66 PLUS 15 MAKES 81 LOAVES', SC)
  );

  const remainderTitle = txt(
    'PART 3: WHAT IS LEFT OVER?',
    P ? 23 : 21,
    RC,
    [CX, TITLE_Y, 0],
    true
  );

  await until(S(19));
  await play(
    new M.Transform(
      buildTitle,
      remainderTitle
    ),
    ...fbox([
      ['Part 3', RC],
      'Compare expected sales',
      'with actual sales.',
      'What is left over?'
    ], RC),
    ...say('PART THREE: THE REMAINDER', RC)
  );

  // Actual sales bar fills 80 of the expected 81.
  // The remaining one-loaf gap has its true proportional height.

  const actualBar = rect(
    BUILD_BW - 0.09,
    80 * BUILD_UNIT,
    [
      b3x,
      buildY(40),
      0
    ],
    AC,
    0.64,
    2
  );

  const actualTop = line(
    [
      b3x - BUILD_BW / 2 - 0.10,
      buildY(80),
      0
    ],
    [
      b3x + BUILD_BW / 2 + 0.10,
      buildY(80),
      0
    ],
    AC,
    3
  );

  const actualNumber = txt(
    '80',
    29,
    AC,
    [
      b3x,
      buildY(80) - 0.36,
      0
    ],
    true
  );

  const actualBarLabel = tag(
    'ACTUAL: 80',
    AC,
    [
      b3x,
      P ? -2.92 : -2.72,
      0
    ],
    15,
    BUILD_SP + 0.05
  );

  await until(S(20));
  await play(
    new M.FadeIn(actualBar),
    new M.Create(actualTop),
    new M.FadeIn(actualNumber),
    new M.FadeIn(actualBarLabel),
    ...fbox([
      ['Expected = 81', SC],
      ['Actual   = 80', AC],
      'The bakery sold',
      'one loaf less.'
    ], RC),
    ...say('ACTUAL SALES: ONE LESS THAN EXPECTED', AC)
  );

  const remainderCap = rect(
    BUILD_BW,
    BUILD_UNIT,
    [
      b3x,
      buildY(80.5),
      0
    ],
    RC,
    0.90,
    1.5
  );

  // Magnify only the label, not the size of the gap.

  const remainderPointer = arrow(
    [
      b3x + 0.97,
      buildY(81) - 0.51,
      0
    ],
    [
      b3x + BUILD_BW / 2 + 0.06,
      buildY(80.5),
      0
    ],
    RC,
    2,
    0.12
  );

  const remainderNumber = txt(
    '−1',
    25,
    RC,
    [
      b3x + 0.94,
      buildY(81) - 0.71,
      0
    ],
    true
  );

  await until(S(21));
  await play(
    new M.FadeIn(remainderCap),
    new M.FadeIn(remainderPointer),
    new M.FadeIn(remainderNumber),
    ...fbox([
      ['Remainder', RC],
      'Actual − expected',
      ['80 − 81 = −1', RC]
    ], RC),
    ...say('THE REMAINDER IS MINUS ONE', RC)
  );

  const buildLiveParts = [
    ...buildParts,
    ...trendBlockParts,
    ...seasonBlockParts,
    ...fittedParts,
    actualBar,
    actualTop,
    actualNumber,
    actualBarLabel,
    remainderCap,
    remainderPointer,
    remainderNumber
  ];

  // ------------------------------------------------------------
  // A reusable three-component arithmetic picture.
  // ------------------------------------------------------------

  const EQUATION_Y = P ? 0.65 : -0.20;
  const EQUATION_SP = P ? 1.65 : 1.76;
  const EQUATION_W = P ? 1.27 : 1.38;
  const EQUATION_H = P ? 1.57 : 1.45;

  const eqx = k =>
    CX + (k - 1.5) * EQUATION_SP;

  function componentCard(
    k,
    heading,
    value,
    color
  ) {
    const xx = eqx(k);

    const r = rounded(
      EQUATION_W,
      EQUATION_H,
      [
        xx,
        EQUATION_Y,
        0
      ],
      color
    );

    r.setFill(color, 0.12);

    const label = txt(
      heading,
      P ? 15 : 15,
      color,
      [
        xx,
        EQUATION_Y + 0.40,
        0
      ],
      true,
      EQUATION_W - 0.15
    );

    const number = txt(
      value,
      P ? 30 : 29,
      color,
      [
        xx,
        EQUATION_Y - 0.13,
        0
      ],
      true,
      EQUATION_W - 0.17
    );

    return new M.VGroup(
      r,
      label,
      number
    );
  }

  const equationCards = [
    componentCard(0, 'TREND', '66', TC),
    componentCard(1, 'SEASONAL', '15', SC),
    componentCard(2, 'REMAINDER', '−1', RC),
    componentCard(3, 'SALES', '80', AC)
  ];

  const equationOperators = ['+', '+', '='].map(
    (s, k) =>
      txt(
        s,
        P ? 26 : 27,
        C.ink,
        [
          (eqx(k) + eqx(k + 1)) / 2,
          EQUATION_Y,
          0
        ],
        true
      )
  );

  let equationTitle = txt(
    'EVERY LOAF ACCOUNTED FOR',
    P ? 23 : 21,
    AC,
    [CX, TITLE_Y, 0],
    true
  );

  const equationCheck = tag(
    '66 + 15 − 1 = 80',
    TC,
    [
      CX,
      EQUATION_Y - 1.43,
      0
    ],
    P ? 22 : 21
  );

  const equationParts = [
    equationTitle,
    ...equationCards,
    ...equationOperators,
    equationCheck
  ];

  await until(S(22));
  await play(
    ...fadeOut(buildLiveParts),
    new M.FadeIn(equationTitle),
    lagIn(equationCards, 2.0, 0.35),
    ...fadeIn(equationOperators),
    new M.FadeIn(equationCheck),
    ...fbox([
      ['Check the total', TC],
      ['Trend      66', TC],
      ['Seasonal  +15', SC],
      ['Remainder  −1', RC],
      ['Sales      80', AC]
    ], AC),
    ...say('66 PLUS 15 MINUS 1 EQUALS 80', AC)
  );

  // ------------------------------------------------------------
  // 23–25: Name decomposition and explain the remainder.
  // ------------------------------------------------------------

  const decompositionTitle = txt(
    'SEASONAL DECOMPOSITION',
    P ? 24 : 22,
    AC,
    [CX, TITLE_Y, 0],
    true
  );

  await until(S(23));
  await play(
    new M.Transform(
      equationTitle,
      decompositionTitle
    ),
    ...fbox([
      ['Seasonal decomposition', AC],
      'Split a time series',
      'into separate parts.'
    ], AC),
    ...say('THIS IS SEASONAL DECOMPOSITION', AC)
  );

  await until(S(24));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          equationCards[0],
          { color: TC }
        ),
        new M.Indicate(
          equationCards[1],
          { color: SC }
        ),
        new M.Indicate(
          equationCards[2],
          { color: RC }
        )
      ],
      {
        lagRatio: 0.50,
        runTime: 2.6
      }
    ),
    ...fbox([
      ['Trend', TC],
      'The slow-moving level.',
      ['Seasonal part', SC],
      'The repeating pattern.',
      ['Remainder', RC],
      'Everything left over.'
    ], AC),
    ...say('TREND, SEASONAL PART, REMAINDER', AC)
  );

  // Small illustrative causes of a remainder.
  // These are examples of possible explanations,
  // not claimed causes of the actual Saturday remainder.

  const REASON_X = CX;
  const REASON_Y = P ? -1.82 : -2.00;
  const REASON_SP = P ? 1.98 : 2.10;

  function rainIcon(xx, yy) {
    const cloudParts = [];

    const cloudCenters = [
      [-0.25, 0.06, 0.20],
      [0.00, 0.18, 0.28],
      [0.27, 0.05, 0.19]
    ];

    cloudCenters.forEach(
      ([dx, dy, radius]) => {
        const c = new M.Circle({
          radius,
          color: RC
        });

        c.setFill(RC, 0.35);
        c.moveTo([
          xx + dx,
          yy + dy,
          0
        ]);

        cloudParts.push(c);
      }
    );

    for (let k = 0; k < 3; k++) {
      const rx = xx + (k - 1) * 0.24;

      cloudParts.push(
        line(
          [rx + 0.06, yy - 0.19, 0],
          [rx - 0.03, yy - 0.39, 0],
          AC,
          2.5
        )
      );
    }

    return new M.VGroup(...cloudParts);
  }

  function orderIcon(xx, yy) {
    const parts = [];

    for (let k = 0; k < 3; k++) {
      parts.push(
        rect(
          0.35,
          0.38,
          [
            xx + (k - 1) * 0.40,
            yy,
            0
          ],
          SC,
          0.40,
          2
        )
      );

      parts.push(
        line(
          [
            xx + (k - 1) * 0.40,
            yy - 0.17,
            0
          ],
          [
            xx + (k - 1) * 0.40,
            yy + 0.17,
            0
          ],
          SC,
          1
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function chanceIcon(xx, yy) {
    const r = rounded(
      0.61,
      0.61,
      [
        xx,
        yy,
        0
      ],
      RC
    );

    const dots = [
      [-0.16, 0.16],
      [0, 0],
      [0.16, -0.16]
    ].map(([dx, dy]) =>
      new M.Dot({
        point: [
          xx + dx,
          yy + dy,
          0
        ],
        radius: 0.055,
        color: RC
      })
    );

    return new M.VGroup(r, ...dots);
  }

  const reasons = [
    new M.VGroup(
      rainIcon(
        REASON_X - REASON_SP,
        REASON_Y
      ),
      txt(
        'Rainy day',
        15,
        C.muted,
        [
          REASON_X - REASON_SP,
          REASON_Y - 0.62,
          0
        ]
      )
    ),
    new M.VGroup(
      orderIcon(
        REASON_X,
        REASON_Y
      ),
      txt(
        'Big order',
        15,
        C.muted,
        [
          REASON_X,
          REASON_Y - 0.62,
          0
        ]
      )
    ),
    new M.VGroup(
      chanceIcon(
        REASON_X + REASON_SP,
        REASON_Y
      ),
      txt(
        'Chance',
        15,
        C.muted,
        [
          REASON_X + REASON_SP,
          REASON_Y - 0.62,
          0
        ]
      )
    )
  ];

  await until(S(25));
  await play(
    new M.FadeOut(equationCheck),
    lagIn(reasons, 2.4, 0.45),
    indicate(equationCards[2], RC),
    ...fbox([
      ['Remainder', RC],
      'Not explained by trend.',
      'Not explained by season.',
      'Possible causes:',
      'weather, orders, chance.'
    ], RC),
    ...say('THE REMAINDER IS WHAT NEITHER PART EXPLAINS', RC)
  );

  // ------------------------------------------------------------
  // 26–27: Pay-slip analogy.
  //
  // No new bakery data are introduced.
  // The analogy uses labelled components rather than
  // invented monetary amounts.
  // ------------------------------------------------------------

  const PAY_Y = P ? 0.15 : -0.20;
  const PAY_W = P ? 5.55 : 5.65;
  const PAY_H = P ? 4.35 : 3.65;

  const payParts = [];

  const payPanel = rounded(
    PAY_W,
    PAY_H,
    [
      CX,
      PAY_Y,
      0
    ],
    AC
  );

  payParts.push(payPanel);

  const payHeading = txt(
    'PAY SLIP',
    24,
    AC,
    [
      CX,
      PAY_Y + PAY_H / 2 - 0.36,
      0
    ],
    true
  );

  payParts.push(payHeading);

  const payRows = [
    ['Base pay', TC],
    ['Weekend bonus', SC],
    ['Small extras', RC]
  ];

  const payRowParts = [];

  payRows.forEach(([label, color], k) => {
    const yy =
      PAY_Y + (P ? 0.85 : 0.60) -
      k * (P ? 0.72 : 0.60);

    const r = rect(
      PAY_W - 0.70,
      P ? 0.55 : 0.47,
      [
        CX,
        yy,
        0
      ],
      color,
      0.15,
      1.5
    );

    const name = txt(
      label,
      P ? 20 : 19,
      color,
      [
        CX,
        yy,
        0
      ]
    );

    payRowParts.push(
      new M.VGroup(r, name)
    );
  });

  payParts.push(...payRowParts);

  const payRule = line(
    [
      CX - PAY_W / 2 + 0.35,
      PAY_Y - (P ? 1.10 : 0.98),
      0
    ],
    [
      CX + PAY_W / 2 - 0.35,
      PAY_Y - (P ? 1.10 : 0.98),
      0
    ],
    C.ink,
    2
  );

  const payTotal = txt(
    'TOTAL PAY',
    23,
    AC,
    [
      CX,
      PAY_Y - PAY_H / 2 + 0.42,
      0
    ],
    true
  );

  payParts.push(
    payRule,
    payTotal
  );

  await until(S(26));
  await play(
    ...fadeOut([
      ...equationParts.filter(
        o => o !== equationCheck
      ),
      ...reasons
    ]),
    new M.FadeIn(payPanel),
    new M.FadeIn(payHeading),
    lagIn(payRowParts, 2.1, 0.40),
    new M.Create(payRule),
    new M.FadeIn(payTotal),
    ...fbox([
      ['Think of a pay slip', AC],
      ['Base pay', TC],
      ['+ Weekend bonus', SC],
      ['+ Small extras', RC],
      '= Total pay'
    ], AC),
    ...say('BASE PAY PLUS BONUS PLUS EXTRAS', AC)
  );

  const salesReceiptHeading = txt(
    'BAKERY SALES',
    24,
    AC,
    [
      CX,
      PAY_Y + PAY_H / 2 - 0.36,
      0
    ],
    true
  );

  const salesReceiptRows = [
    ['Trend: 66', TC],
    ['Saturday effect: +15', SC],
    ['Remainder: −1', RC]
  ].map(([label, color], k) => {
    const yy =
      PAY_Y + (P ? 0.85 : 0.60) -
      k * (P ? 0.72 : 0.60);

    return new M.VGroup(
      rect(
        PAY_W - 0.70,
        P ? 0.55 : 0.47,
        [
          CX,
          yy,
          0
        ],
        color,
        0.15,
        1.5
      ),
      txt(
        label,
        P ? 20 : 19,
        color,
        [
          CX,
          yy,
          0
        ],
        true,
        PAY_W - 0.90
      )
    );
  });

  const salesReceiptTotal = txt(
    'TOTAL SALES: 80',
    23,
    AC,
    [
      CX,
      PAY_Y - PAY_H / 2 + 0.42,
      0
    ],
    true
  );

  await until(S(27));
  await play(
    new M.Transform(
      payHeading,
      salesReceiptHeading
    ),
    ...payRowParts.map(
      (row, k) =>
        new M.Transform(
          row,
          salesReceiptRows[k]
        )
    ),
    new M.Transform(
      payTotal,
      salesReceiptTotal
    ),
    ...fbox([
      ['Our bakery', AC],
      ['Trend          66', TC],
      ['Weekday effect +15', SC],
      ['Remainder       −1', RC],
      ['Sales           80', AC]
    ], AC),
    ...say('THE THREE PARTS ADD UP TO SALES', AC)
  );

  // ------------------------------------------------------------
  // 28: A trend need not be straight.
  //
  // The left picture represents this bakery's actual
  // straight trend.
  //
  // The right picture is a clearly labelled schematic
  // of a possible curved trend in longer data.
  // ------------------------------------------------------------

  const CURVE_Y = P ? 0.30 : -0.40;
  const CURVE_SP = P ? 3.20 : 3.45;

  const CURVE_W = P ? 2.80 : 3.05;
  const CURVE_H = P ? 2.65 : 2.25;

  function trendExamplePanel(
    xx,
    heading,
    isCurved
  ) {
    const parts = [];

    const panel = rounded(
      CURVE_W,
      CURVE_H,
      [
        xx,
        CURVE_Y,
        0
      ],
      TC
    );

    parts.push(panel);

    const left =
      xx - CURVE_W / 2 + 0.30;

    const right =
      xx + CURVE_W / 2 - 0.26;

    const bottom =
      CURVE_Y - CURVE_H / 2 + 0.48;

    const top =
      CURVE_Y + CURVE_H / 2 - 0.54;

    parts.push(
      line(
        [left, bottom, 0],
        [right, bottom, 0],
        C.muted,
        1.5
      ),
      line(
        [left, bottom, 0],
        [left, top, 0],
        C.muted,
        1.5
      )
    );

    const points = [];

    for (let k = 0; k <= 32; k++) {
      const t = k / 32;

      // Normalised schematic coordinates for the curved case.
      // These are not additional sales observations.

      const v = isCurved
        ? 0.18 +
          0.64 * (
            0.5 -
            0.5 * Math.cos(Math.PI * t)
          )
        : 0.18 + 0.64 * t;

      points.push([
        left + t * (right - left),
        bottom + v * (top - bottom),
        0
      ]);
    }

    parts.push(
      polyline(
        points,
        TC,
        3
      )
    );

    parts.push(
      txt(
        heading,
        P ? 17 : 16,
        TC,
        [
          xx,
          CURVE_Y + CURVE_H / 2 - 0.23,
          0
        ],
        true,
        CURVE_W - 0.16
      )
    );

    parts.push(
      txt(
        isCurved
          ? 'Schematic example'
          : 'Our bakery',
        P ? 15 : 15,
        C.muted,
        [
          xx,
          CURVE_Y - CURVE_H / 2 + 0.20,
          0
        ],
        false,
        CURVE_W - 0.18
      )
    );

    return new M.VGroup(...parts);
  }

  const straightPanel = trendExamplePanel(
    CX - CURVE_SP / 2,
    'STRAIGHT TREND',
    false
  );

  const curvedPanel = trendExamplePanel(
    CX + CURVE_SP / 2,
    'SMOOTH TREND',
    true
  );

  const curveTitle = txt(
    'A TREND CAN ALSO BEND',
    P ? 23 : 21,
    TC,
    [CX, TITLE_Y, 0],
    true
  );

  const curveParts = [
    curveTitle,
    straightPanel,
    curvedPanel
  ];

  await until(S(28));
  await play(
    ...fadeOut(payParts),
    new M.FadeIn(curveTitle),
    new M.FadeIn(straightPanel),
    new M.FadeIn(curvedPanel),
    ...fbox([
      ['Our example', TC],
      'A straight trend line.',
      ['Longer data', TC],
      'A smooth trend may bend',
      'as the level changes.'
    ], TC),
    ...say('A LONGER TREND CAN BE A SMOOTH CURVE', TC)
  );

  // ------------------------------------------------------------
  // 29: The additive decomposition equation.
  // ------------------------------------------------------------

  function wordEquationCard(
    k,
    heading,
    subheading,
    color
  ) {
    const xx = eqx(k);

    const r = rounded(
      EQUATION_W,
      EQUATION_H,
      [
        xx,
        EQUATION_Y,
        0
      ],
      color
    );

    r.setFill(color, 0.12);

    const headingText = txt(
      heading,
      P ? 17 : 17,
      color,
      [
        xx,
        EQUATION_Y + 0.24,
        0
      ],
      true,
      EQUATION_W - 0.13
    );

    const subText = txt(
      subheading,
      P ? 15 : 15,
      C.muted,
      [
        xx,
        EQUATION_Y - 0.29,
        0
      ],
      false,
      EQUATION_W - 0.14
    );

    return new M.VGroup(
      r,
      headingText,
      subText
    );
  }

  const wordCards = [
    wordEquationCard(
      0,
      'TREND',
      'Slow level',
      TC
    ),
    wordEquationCard(
      1,
      'SEASONAL',
      'Repeating',
      SC
    ),
    wordEquationCard(
      2,
      'REMAINDER',
      'Left over',
      RC
    ),
    wordEquationCard(
      3,
      'SALES',
      'Total',
      AC
    )
  ];

  const wordOperators = ['+', '+', '='].map(
    (s, k) =>
      txt(
        s,
        27,
        C.ink,
        [
          (eqx(k) + eqx(k + 1)) / 2,
          EQUATION_Y,
          0
        ],
        true
      )
  );

  const wordTitle = txt(
    'THE ADDITIVE DECOMPOSITION',
    P ? 22 : 21,
    AC,
    [CX, TITLE_Y, 0],
    true
  );

  const wordParts = [
    wordTitle,
    ...wordCards,
    ...wordOperators
  ];

  await until(S(29));
  await play(
    ...fadeOut(curveParts),
    new M.FadeIn(wordTitle),
    lagIn(wordCards, 1.8, 0.25),
    ...fadeIn(wordOperators),
    ...fbox([
      ['Sales =', AC],
      ['Trend', TC],
      ['+ Seasonal part', SC],
      ['+ Remainder', RC]
    ], AC),
    ...say('SALES = TREND + SEASONAL PART + REMAINDER', AC)
  );

  // ------------------------------------------------------------
  // 30–33: Decompose all 28 days.
  //
  // Three aligned panels with the same horizontal time scale.
  //
  // Trend:     46 + day number
  // Seasonal:  weekday effects repeated four times
  // Remainder: actual − trend − seasonal
  //
  // The vertical scales differ and are explicitly labelled.
  // This makes the small remainder visible without
  // pretending its amplitude equals the seasonal amplitude.
  // ------------------------------------------------------------

  const PANEL_CX = CX;

  const PANEL_XLEFT =
    PANEL_CX - (P ? 2.96 : 3.18);

  const PANEL_XRIGHT =
    PANEL_CX + (P ? 2.96 : 3.18);

  const panelX = day =>
    PANEL_XLEFT +
    (day - 1) *
    (PANEL_XRIGHT - PANEL_XLEFT) / 27;

  const PANEL_H = P ? 1.24 : 0.78;

  const PANEL_CENTERS = P
    ? [1.92, 0.04, -1.84]
    : [0.81, -0.53, -1.87];

  const seriesConfigs = [
    {
      name: 'TREND',
      color: TC,
      values: TREND,
      min: 45,
      max: 75,
      ticks: [45, 60, 75]
    },
    {
      name: 'SEASONAL PART',
      color: SC,
      values: SEASONAL,
      min: -15,
      max: 20,
      ticks: [-10, 0, 15]
    },
    {
      name: 'REMAINDER',
      color: RC,
      values: REMAINDER,
      min: -3,
      max: 3,
      ticks: [-2, 0, 2]
    }
  ];

  function panelY(index, value) {
    const config = seriesConfigs[index];

    return PANEL_CENTERS[index] -
      PANEL_H / 2 +
      (
        (value - config.min) /
        (config.max - config.min)
      ) * PANEL_H;
  }

  function makePanel(index) {
    const config = seriesConfigs[index];
    const cy = PANEL_CENTERS[index];

    const axes = [];

    axes.push(
      txt(
        config.name,
        P ? 17 : 16,
        config.color,
        [
          PANEL_CX,
          cy + PANEL_H / 2 + 0.25,
          0
        ],
        true,
        P ? 6.0 : 6.5
      )
    );

    axes.push(
      rect(
        PANEL_XRIGHT - PANEL_XLEFT + 0.12,
        PANEL_H + 0.08,
        [
          PANEL_CX,
          cy,
          0
        ],
        C.muted,
        0,
        1.1
      )
    );

    config.ticks.forEach(v => {
      const yy = panelY(index, v);

      axes.push(
        line(
          [PANEL_XLEFT, yy, 0],
          [PANEL_XRIGHT, yy, 0],
          v === 0 ? C.ink : C.muted,
          v === 0 ? 1.8 : 0.6
        )
      );

      axes.push(
        txt(
          index === 0 ? v : signed(v),
          P ? 16 : 14,
          C.ink,
          [
            PANEL_XLEFT - 0.34,
            yy,
            0
          ],
          true,
          0.58
        )
      );
    });

    for (let k = 1; k <= 3; k++) {
      const xx =
        (
          panelX(k * 7) +
          panelX(k * 7 + 1)
        ) / 2;

      axes.push(
        dashed(
          [
            xx,
            cy - PANEL_H / 2,
            0
          ],
          [
            xx,
            cy + PANEL_H / 2,
            0
          ],
          C.muted
        )
      );
    }

    const points = config.values.map(
      (v, k) => [
        panelX(k + 1),
        panelY(index, v),
        0
      ]
    );

    const curve = polyline(
      points,
      config.color,
      index === 0 ? 3 : 2
    );

    const dots = points.map(
      p => glowDot(
        p,
        config.color,
        P ? 0.034 : 0.032
      )
    );

    return {
      axes,
      points,
      curve,
      dots,
      color: config.color
    };
  }

  const panels = [
    makePanel(0),
    makePanel(1),
    makePanel(2)
  ];

  const panelWeekLabels = [];

  for (let k = 0; k < 4; k++) {
    panelWeekLabels.push(
      txt(
        `W${k + 1}`,
        P ? 16 : 14,
        C.muted,
        [
          panelX(k * 7 + 4),
          PANEL_CENTERS[2] -
            PANEL_H / 2 - 0.24,
          0
        ],
        true
      )
    );
  }

  const panelsDayNote = txt(
    'Same 28 days in every panel',
    P ? 15 : 14,
    C.muted,
    [
      PANEL_CX,
      P ? -3.00 : -2.80,
      0
    ]
  );

  const panelAxes = panels.flatMap(
    p => p.axes
  );

  await until(S(30));
  await play(
    ...fadeOut(wordParts),
    ...fadeIn(panelAxes),
    ...fadeIn(panelWeekLabels),
    new M.FadeIn(panelsDayNote),
    ...fbox([
      ['All 28 days', AC],
      'Draw three aligned lines.',
      ['Trend', TC],
      ['Seasonal part', SC],
      ['Remainder', RC]
    ], AC),
    ...say('DECOMPOSE ALL TWENTY-EIGHT DAYS', AC)
  );

  await until(S(31));
  await play(
    new M.FadeIn(panels[0].curve),
    lagIn(panels[0].dots, 1.0, 0.025),
    ...fbox([
      ['Trend', TC],
      '47, 48, 49, ... , 74',
      'One loaf higher each day.',
      'A calm straight rise.'
    ], TC),
    ...say('THE TREND IS A CALM STRAIGHT RISE', TC)
  );

  await until(S(32));
  await play(
    new M.FadeIn(panels[1].curve),
    lagIn(panels[1].dots, 1.6, 0.04),
    ...fbox([
      ['Seasonal part', SC],
      '−10, −10, −5, 0,',
      '+5, +15, +5',
      'The same seven-day wave',
      'repeated four times.'
    ], SC),
    ...say('THE SAME WEEKLY WAVE REPEATS FOUR TIMES', SC)
  );

  const remainderLimitLines = [
    dashed(
      [
        PANEL_XLEFT,
        panelY(2, 2),
        0
      ],
      [
        PANEL_XRIGHT,
        panelY(2, 2),
        0
      ],
      RC
    ),
    dashed(
      [
        PANEL_XLEFT,
        panelY(2, -2),
        0
      ],
      [
        PANEL_XRIGHT,
        panelY(2, -2),
        0
      ],
      RC
    )
  ];

  await until(S(33));
  await play(
    new M.FadeIn(panels[2].curve),
    lagIn(panels[2].dots, 1.7, 0.04),
    ...fadeIn(remainderLimitLines),
    ...fbox([
      ['Remainder', RC],
      'Actual − trend − seasonal',
      ['Largest positive: +2', RC],
      ['Smallest negative: −2', RC],
      'Small wiggles around zero.'
    ], RC),
    ...say('THE REMAINDER STAYS WITHIN TWO LOAVES OF ZERO', RC)
  );

  // ------------------------------------------------------------
  // 34–36: Each component answers a different question.
  // ------------------------------------------------------------

  function panelOutline(index, color) {
    const r = rounded(
      PANEL_XRIGHT - PANEL_XLEFT + 0.19,
      PANEL_H + 0.15,
      [
        PANEL_CX,
        PANEL_CENTERS[index],
        0
      ],
      color,
      0
    );

    r.setFill(color, 0.035);

    return r;
  }

  const panelHighlights = [
    panelOutline(0, TC),
    panelOutline(1, SC),
    panelOutline(2, RC)
  ];

  await until(S(34));
  await play(
    lagIn(panelHighlights, 1.45, 0.25),
    ...fbox([
      ['Three different questions', AC],
      ['Trend: growing?', TC],
      ['Seasonal: which weekday?', SC],
      ['Remainder: unusual day?', RC]
    ], AC),
    ...say('EACH PART ANSWERS ITS OWN QUESTION', AC)
  );

  const growingTag = tag(
    'IS THE BAKERY GROWING?',
    TC,
    [
      BOXP[0],
      BOXP[1] + (P ? 0.90 : 1.30),
      0
    ],
    P ? 16 : 15,
    P ? 5.60 : 4.0
  );

  const weekdayPlanningTag = tag(
    'HOW MUCH TO BAKE EACH DAY?',
    SC,
    [
      BOXP[0],
      BOXP[1] - (P ? 0.90 : 1.30),
      0
    ],
    P ? 16 : 15,
    P ? 5.60 : 4.0
  );

  const planningPanel = rounded(
    P ? 6.10 : 4.15,
    P ? 2.35 : 3.20,
    BOXP,
    AC
  );

  const planningTrend = txt(
    'Sales are rising steadily.',
    P ? 19 : 18,
    TC,
    [
      BOXP[0],
      BOXP[1] + (P ? 0.37 : 0.71),
      0
    ],
    false,
    P ? 5.7 : 3.80
  );

  const planningSeason = txt(
    'Bake more for Saturdays.',
    P ? 19 : 18,
    SC,
    [
      BOXP[0],
      BOXP[1] - (P ? 0.30 : 0.70),
      0
    ],
    false,
    P ? 5.7 : 3.80
  );

  // Keep the two tags above their associated answers.
  // Reposition before the objects enter the scene.

  growingTag.moveTo([
    BOXP[0],
    BOXP[1] + (P ? 0.83 : 1.25),
    0
  ]);

  weekdayPlanningTag.moveTo([
    BOXP[0],
    BOXP[1] - (P ? 0.08 : 0.18),
    0
  ]);

  planningSeason.moveTo([
    BOXP[0],
    BOXP[1] - (P ? 0.63 : 0.85),
    0
  ]);

  const planningParts = [
    planningPanel,
    growingTag,
    planningTrend,
    weekdayPlanningTag,
    planningSeason
  ];

  await until(S(35));
  await play(
    new M.FadeOut(panelHighlights[2]),
    ...clearBox(),
    new M.FadeIn(planningPanel),
    new M.LaggedStart(
      [
        new M.FadeIn(growingTag),
        new M.Indicate(
          panels[0].curve,
          { color: TC }
        ),
        new M.FadeIn(planningTrend),
        new M.FadeIn(weekdayPlanningTag),
        new M.Indicate(
          panels[1].curve,
          { color: SC }
        ),
        new M.FadeIn(planningSeason)
      ],
      {
        lagRatio: 0.35,
        runTime: 3.6
      }
    ),
    ...say('TREND FOR GROWTH, SEASONALITY FOR DAILY PLANNING', AC)
  );

  // Highlight the largest actual remainders in the supplied data.
  // No large unexplained event is invented.

  const notableDays = DAYS.filter(
    (_, k) => Math.abs(REMAINDER[k]) === 2
  );

  const notableRings = notableDays.map(day =>
    ring(
      [
        panelX(day),
        panelY(
          2,
          REMAINDER[day - 1]
        ),
        0
      ],
      P ? 0.075 : 0.065,
      RC,
      2
    )
  );

  await until(S(36));
  await play(
    ...fadeOut([
      ...planningParts,
      panelHighlights[0],
      panelHighlights[1]
    ]),
    new M.FadeIn(panelHighlights[2]),
    lagIn(notableRings, 1.35, 0.16),
    ...fbox([
      ['Remainder: unusual days', RC],
      'Look for large leftovers.',
      'Ask what happened.',
      'Here even the largest',
      ['is only 2 loaves.', RC]
    ], RC),
    ...say('A LARGE REMAINDER FLAGS A DAY WORTH CHECKING', RC)
  );

  // ------------------------------------------------------------
  // 37–39: Trap — a remainder should not retain the pattern.
  //
  // Use two schematic illustrations:
  // a rising remainder and a repeating remainder.
  //
  // These are deliberately labelled as examples of
  // unsuccessful decomposition, not the bakery's data.
  // ------------------------------------------------------------

  const allPanelCurves = panels.map(
    p => p.curve
  );

  const allPanelDots = panels.flatMap(
    p => p.dots
  );

  const decompositionLiveParts = [
    ...panelAxes,
    ...panelWeekLabels,
    panelsDayNote,
    ...allPanelCurves,
    ...allPanelDots,
    ...remainderLimitLines,
    panelHighlights[2],
    ...notableRings
  ];

  const TRAP_XLEFT =
    CX - (P ? 2.92 : 3.20);

  const TRAP_XRIGHT =
    CX + (P ? 2.92 : 3.20);

  const TRAP_H = P ? 1.46 : 1.14;

  const TRAP_Y1 = P ? 1.05 : 0.36;
  const TRAP_Y2 = P ? -1.43 : -1.57;

  function schematicPanel(
    cy,
    heading,
    kind,
    color
  ) {
    const parts = [];

    const bg = rect(
      TRAP_XRIGHT - TRAP_XLEFT + 0.15,
      TRAP_H + 0.14,
      [
        CX,
        cy,
        0
      ],
      C.muted,
      0,
      1.2
    );

    parts.push(bg);

    const zero = line(
      [
        TRAP_XLEFT,
        cy,
        0
      ],
      [
        TRAP_XRIGHT,
        cy,
        0
      ],
      C.muted,
      1.8
    );

    parts.push(zero);

    parts.push(
      txt(
        '0',
        15,
        C.muted,
        [
          TRAP_XLEFT - 0.23,
          cy,
          0
        ],
        true
      )
    );

    const headingText = txt(
      heading,
      P ? 18 : 17,
      color,
      [
        CX,
        cy + TRAP_H / 2 + 0.29,
        0
      ],
      true,
      P ? 6.2 : 6.8
    );

    parts.push(headingText);

    const points = [];

    for (let k = 0; k < 28; k++) {
      const t = k / 27;

      let v;

      if (kind === 'rise') {
        v = -0.68 + 1.36 * t;
      } else {
        v =
          0.64 *
          Math.sin(
            2 * Math.PI * k / 7
          );
      }

      points.push([
        TRAP_XLEFT +
          t * (
            TRAP_XRIGHT - TRAP_XLEFT
          ),
        cy + v * TRAP_H / 2,
        0
      ]);
    }

    const curve = polyline(
      points,
      color,
      2.5
    );

    const note = txt(
      'Schematic — not bakery observations',
      P ? 14 : 13,
      C.muted,
      [
        CX,
        cy - TRAP_H / 2 - 0.25,
        0
      ],
      false,
      P ? 6.2 : 6.8
    );

    parts.push(note);

    return {
      parts,
      curve
    };
  }

  const risingRemainder = schematicPanel(
    TRAP_Y1,
    'LEFTOVER TREND?',
    'rise',
    TC
  );

  const repeatingRemainder = schematicPanel(
    TRAP_Y2,
    'LEFTOVER WEEKLY PATTERN?',
    'repeat',
    SC
  );

  const trapHeading = txt(
    'TRAP: PATTERNS STILL LEFT OVER',
    P ? 22 : 20,
    RC,
    [CX, TITLE_Y, 0],
    true,
    P ? FW - 1.1 : 7.0
  );

  const trapParts = [
    trapHeading,
    ...risingRemainder.parts,
    ...repeatingRemainder.parts,
    risingRemainder.curve,
    repeatingRemainder.curve
  ];

  await until(S(37));
  await play(
    ...fadeOut(decompositionLiveParts),
    new M.FadeIn(trapHeading),
    ...fadeIn(risingRemainder.parts),
    ...fadeIn(repeatingRemainder.parts),
    new M.FadeIn(risingRemainder.curve),
    new M.FadeIn(repeatingRemainder.curve),
    ...fbox([
      ['Common trap', RC],
      'Trusting the three parts',
      'without checking',
      'what is still left over.'
    ], RC),
    ...say('CHECK THE REMAINDER BEFORE TRUSTING THE SPLIT', RC)
  );

  await until(S(38));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          risingRemainder.curve,
          { color: TC }
        ),
        new M.Indicate(
          repeatingRemainder.curve,
          { color: SC }
        )
      ],
      {
        lagRatio: 0.65,
        runTime: 2.2
      }
    ),
    ...fbox([
      ['Still rising?', TC],
      'Some trend was missed.',
      ['Still repeating?', SC],
      'Some seasonality was missed.',
      ['Improve the split.', RC]
    ], RC),
    ...say('LEFTOVER PATTERNS MEAN THE SPLIT MISSED SOMETHING', RC)
  );

  // Restore the real remainder series.
  // Draw it larger, using its own labelled scale.

  const NOISE_CY = P ? 0.10 : -0.39;
  const NOISE_UNIT = P ? 0.69 : 0.46;

  const noiseX = day =>
    TRAP_XLEFT +
    (day - 1) *
    (TRAP_XRIGHT - TRAP_XLEFT) / 27;

  const noiseY = v =>
    NOISE_CY + v * NOISE_UNIT;

  const noiseParts = [];

  const noiseTitle = txt(
    'CHECK THE ACTUAL REMAINDER',
    P ? 23 : 21,
    RC,
    [CX, TITLE_Y, 0],
    true
  );

  noiseParts.push(noiseTitle);

  for (const v of [-2, -1, 0, 1, 2]) {
    noiseParts.push(
      line(
        [
          TRAP_XLEFT,
          noiseY(v),
          0
        ],
        [
          TRAP_XRIGHT,
          noiseY(v),
          0
        ],
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.4 : 0.65
      )
    );

    noiseParts.push(
      txt(
        signed(v),
        P ? 16 : 16,
        C.muted,
        [
          TRAP_XLEFT - 0.29,
          noiseY(v),
          0
        ],
        true,
        0.45
      )
    );
  }

  for (let k = 1; k <= 3; k++) {
    const xx =
      (
        noiseX(k * 7) +
        noiseX(k * 7 + 1)
      ) / 2;

    noiseParts.push(
      dashed(
        [
          xx,
          noiseY(-2) - 0.1,
          0
        ],
        [
          xx,
          noiseY(2) + 0.1,
          0
        ],
        C.muted
      )
    );
  }

  for (let k = 0; k < 4; k++) {
    noiseParts.push(
      txt(
        `WEEK ${k + 1}`,
        P ? 16 : 15,
        C.muted,
        [
          noiseX(k * 7 + 4),
          noiseY(-2) - 0.41,
          0
        ],
        true,
        1.42
      )
    );
  }

  const noisePoints = REMAINDER.map(
    (v, k) => [
      noiseX(k + 1),
      noiseY(v),
      0
    ]
  );

  const noiseCurve = polyline(
    noisePoints,
    RC,
    2.4
  );

  const noiseDots = noisePoints.map(
    p => glowDot(
      p,
      RC,
      P ? 0.053 : 0.057
    )
  );

  const noiseTag = tag(
    'SMALL WIGGLES AROUND ZERO',
    RC,
    [
      CX,
      P ? -2.72 : -2.30,
      0
    ],
    P ? 17 : 16,
    P ? 6.4 : 6.7
  );

  noiseParts.push(
    noiseCurve,
    ...noiseDots,
    noiseTag
  );

  await until(S(39));
  await play(
    ...fadeOut(trapParts),
    ...fadeIn(noiseParts),
    ...fbox([
      ['A useful remainder', RC],
      'Small wiggles around zero.',
      'No obvious trend.',
      'No obvious repeated wave.',
      'Check for patterns.'
    ], RC),
    ...say('LOOK FOR SMALL, PATTERNLESS WIGGLES', RC)
  );

  // ------------------------------------------------------------
  // 40: Prepare for the forecasting chapter.
  //
  // The observed record ends on day 28.
  // The future is unknown; do not reveal invented sales.
  // ------------------------------------------------------------

  const futureTitle = txt(
    'FROM UNDERSTANDING TO FORECASTING',
    P ? 21 : 19,
    AC,
    [CX, TITLE_Y, 0],
    true,
    P ? FW - 1.1 : 7.0
  );

  const FUT_LEFT = CX - (P ? 2.88 : 3.15);
  const FUT_RIGHT = CX + (P ? 2.95 : 3.25);

  const FUT_BASE = P ? -1.87 : -1.82;
  const FUT_UNIT = P ? 0.065 : 0.043;

  const fx = day =>
    FUT_LEFT +
    (day - 1) *
    (FUT_RIGHT - FUT_LEFT) / 34;

  const fy = v =>
    FUT_BASE + (v - 30) * FUT_UNIT;

  const historyEnd = fx(28);

  const forecastParts = [
    futureTitle,
    line(
      [FUT_LEFT, FUT_BASE, 0],
      [FUT_RIGHT, FUT_BASE, 0],
      C.muted,
      2
    )
  ];

  for (const v of [40, 60, 80, 100]) {
    forecastParts.push(
      line(
        [FUT_LEFT, fy(v), 0],
        [FUT_RIGHT, fy(v), 0],
        C.muted,
        0.6
      )
    );
  }

  const historyPoints = SALES.map(
    (v, k) => [
      fx(k + 1),
      fy(v),
      0
    ]
  );

  const historyCurve = polyline(
    historyPoints,
    AC,
    2
  );

  const historyDots = historyPoints.map(
    p => glowDot(p, AC, 0.039)
  );

  forecastParts.push(
    historyCurve,
    ...historyDots
  );

  const futureDivider = dashed(
    [
      (historyEnd + fx(29)) / 2,
      FUT_BASE,
      0
    ],
    [
      (historyEnd + fx(29)) / 2,
      fy(100),
      0
    ],
    SC
  );

  const futureQuestion = txt(
    '?',
    35,
    SC,
    [
      (fx(29) + fx(35)) / 2,
      fy(76),
      0
    ],
    true
  );

  const futureLabel = txt(
    'FUTURE',
    P ? 14 : 15,
    SC,
    [
      (fx(29) + fx(35)) / 2,
      FUT_BASE - 0.28,
      0
    ],
    true,
    fx(35) - fx(28) - 0.08
  );

  const observedLabel = txt(
    'OBSERVED: DAYS 1–28',
    P ? 16 : 16,
    AC,
    [
      (FUT_LEFT + historyEnd) / 2,
      FUT_BASE - 0.28,
      0
    ],
    true,
    historyEnd - FUT_LEFT - 0.10
  );

  forecastParts.push(
    futureDivider,
    futureQuestion,
    futureLabel,
    observedLabel
  );

  await until(S(40));
  await play(
    ...fadeOut(noiseParts),
    ...fadeIn(forecastParts),
    ...fbox([
      ['Next chapter', AC],
      'Use past information',
      'to forecast future sales.',
      ['Trend', TC],
      ['Seasonal patterns', SC]
    ], AC),
    ...say('NEXT: USE THESE IDEAS TO FORECAST THE FUTURE', AC)
  );

  // ------------------------------------------------------------
  // 41: Final recap.
  //
  // Restore the three aligned component lines.
  // Each is independently readable.
  //
  // Final worked example:
  // 80 = 66 + 15 − 1.
  // ------------------------------------------------------------

  const finalPanels = [
    makePanel(0),
    makePanel(1),
    makePanel(2)
  ];

  const finalAxes = finalPanels.flatMap(
    p => p.axes
  );

  const finalCurves = finalPanels.map(
    p => p.curve
  );

  const finalDots = finalPanels.flatMap(
    p => p.dots
  );

  const finalWeekLabels = [];

  for (let k = 0; k < 4; k++) {
    finalWeekLabels.push(
      txt(
        `W${k + 1}`,
        P ? 16 : 14,
        C.muted,
        [
          panelX(k * 7 + 4),
          PANEL_CENTERS[2] -
            PANEL_H / 2 - 0.24,
          0
        ],
        true
      )
    );
  }

  const finalDay20Markers = [
    ring(
      [
        panelX(20),
        panelY(0, TARGET_TREND),
        0
      ],
      P ? 0.09 : 0.075,
      TC,
      2.3
    ),
    ring(
      [
        panelX(20),
        panelY(1, TARGET_SEASONAL),
        0
      ],
      P ? 0.09 : 0.075,
      SC,
      2.3
    ),
    ring(
      [
        panelX(20),
        panelY(2, TARGET_REMAINDER),
        0
      ],
      P ? 0.09 : 0.075,
      RC,
      2.3
    )
  ];

  const finalDayNote = txt(
    'All three parts use the same dates',
    P ? 15 : 14,
    C.muted,
    [
      CX,
      P ? -3.00 : -2.80,
      0
    ],
    false,
    P ? 6.5 : 6.8
  );

  await until(S(41));
  await play(
    ...fadeOut(forecastParts),
    ...fadeIn(finalAxes),
    ...fadeIn(finalWeekLabels),
    ...fadeIn(finalDots),
    new M.LaggedStart(
      finalCurves.map(
        curve => new M.FadeIn(curve)
      ),
      {
        lagRatio: 0.32,
        runTime: 2.1
      }
    ),
    ...fadeIn(finalDay20Markers),
    new M.FadeIn(finalDayNote),
    ...fbox([
      ['Seasonal decomposition', AC],
      ['Trend         66', TC],
      ['Seasonal     +15', SC],
      ['Remainder     −1', RC],
      ['Sales         80', AC],
      'Read each part on its own.'
    ], AC),
    ...say('SPLIT SALES INTO TREND, SEASONAL PART AND REMAINDER', AC)
  );

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          finalCurves[0],
          { color: TC }
        ),
        new M.Indicate(
          finalCurves[1],
          { color: SC }
        ),
        new M.Indicate(
          finalCurves[2],
          { color: RC }
        )
      ],
      {
        lagRatio: 0.48,
        runTime: Math.min(
          3.2,
          Math.max(
            1.0,
            E(41) - S(41) - 2.5
          )
        )
      }
    )
  );
}
