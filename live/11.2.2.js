// lesson 11.2.2
// Seasonal naive forecast: copy the matching week from last season.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  //
  // Week:       1   2   3   4   5   6   7   8
  // This year: 20  24  20  23  24  29  35  33
  // Last year: 18  21  19  21  22  26  32  30
  //
  // Week 7 = Christmas.
  // Week 8 = New Year.
  //
  // Current time: end of week 6.
  // Real values for weeks 7 and 8 must remain hidden
  // until their respective reveal beats.
  // ------------------------------------------------------------

  const THIS = [20, 24, 20, 23, 24, 29, 35, 33];
  const LAST = [18, 21, 19, 21, 22, 26, 32, 30];

  const NAIVE = 29;
  const CHRISTMAS_FORECAST = 32;
  const NEW_YEAR_FORECAST = 30;

  const GAINS = [2, 3, 1, 2, 2, 3];

  const CYAN = C.cyan;
  const PINK = C.pink || '#F28BB9';
  const AMBER = C.amber;
  const WHITE = '#F0F4FA';
  const GREEN = C.green;
  const RED = C.red || '#FF526F';

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: 8 x 14.22
  // Laptop: 14.22 x 8
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;

  const PILL = P
    ? [0, -4.85, 0]
    : [CX, 1.95, 0];

  const BOXP = P
    ? [0, 2.75, 0]
    : [4.25, -0.25, 0];

  const AX0 = CX - (P ? 3.10 : 3.15);
  const AX1 = CX + (P ? 3.30 : 3.15);

  const AY0 = P ? -3.35 : -2.05;
  const AY1 = P ? 1.15 : 1.12;

  const DATA_LEFT = AX0 + 0.35;
  const DATA_RIGHT = AX1 - 0.30;

  const STEP = (DATA_RIGHT - DATA_LEFT) / 7;

  const X = week =>
    DATA_LEFT + (week - 1) * STEP;

  const Y = rooms =>
    AY0 + rooms / 40 * (AY1 - AY0);

  const pt = (week, rooms) =>
    [X(week), Y(rooms), 0];

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Basic visual primitives
  // ------------------------------------------------------------

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  }

  function ln(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(a, b, color = AMBER) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function dot(p, color, radius = 0.10) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);
    return d;
  }

  function glowingDot(
    p,
    color,
    radius = 0.10,
    opacity = 0.16
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 1.85,
      color
    });

    halo.setFill(color, opacity);

    const centre = dot(
      p,
      color,
      radius
    );

    return new M.VGroup(
      halo,
      centre
    );
  }

  function ring(p, color, radius = 0.17) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 16) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  // ------------------------------------------------------------
  // Scene object management.
  //
  // Objects are created independently and tracked by key.
  // No already-visible objects are regrouped.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(
        new M.FadeOut(visible[key])
      );
    }

    visible[key] = obj;

    if (obj) {
      a.push(
        new M.FadeIn(obj)
      );
    }

    return a;
  }

  function remove(...keys) {
    const a = [];

    keys.forEach(key => {
      if (visible[key]) {
        a.push(
          new M.FadeOut(visible[key])
        );

        delete visible[key];
      }
    });

    return a;
  }

  // ------------------------------------------------------------
  // Formula box
  // Same construction as the approved reference lesson.
  //
  // Lines can be:
  //   'text'
  //   ['text', color]
  //
  // Leading spaces indicate indentation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = CYAN) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(
        s.trimStart(),
        size,
        c,
        true
      )
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

    const wd =
      Math.max(...widths) + 0.7;

    const ht =
      rows.length * lh + 0.4;

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
      BOXP[1] + ht / 2 - 0.2 - lh / 2;

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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P
      ? FW - 1.15
      : 4.05;

    const maxh = P
      ? 2.85
      : 4.10;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

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

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow)
    ];

    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // Hotel chart.
  //
  // Horizontal axis: weeks 1 through 8.
  // Vertical axis: occupied rooms, 0 through 40.
  //
  // Cyan: this year's observed counts.
  // Pink: last year's observed counts.
  // Dashed amber: forecast.
  // White: this year's revealed holiday counts.
  // ------------------------------------------------------------

  function axes() {
    const objects = [];

    objects.push(
      ln(
        [AX0, AY0, 0],
        [AX1, AY0, 0],
        C.muted,
        2.5
      ),
      ln(
        [AX0, AY0, 0],
        [AX0, AY1, 0],
        C.muted,
        2
      )
    );

    [0, 10, 20, 30, 40].forEach(v => {
      const y = Y(v);

      objects.push(
        ln(
          [AX0 - 0.055, y, 0],
          [AX0 + 0.055, y, 0],
          C.muted,
          1.3
        ),
        txt(
          String(v),
          14,
          C.muted,
          [AX0 - 0.28, y, 0],
          true
        )
      );

      if (v > 0) {
        const guide = ln(
          [AX0, y, 0],
          [AX1, y, 0],
          C.muted,
          0.65
        );

        guide.setStroke(
          C.muted,
          0.65,
          0.22
        );

        objects.push(guide);
      }
    });

    for (let week = 1; week <= 8; week++) {
      const x = X(week);

      const color = week >= 7
        ? AMBER
        : C.muted;

      objects.push(
        ln(
          [x, AY0 - 0.06, 0],
          [x, AY0 + 0.06, 0],
          color,
          1.4
        ),
        txt(
          String(week),
          15,
          color,
          [x, AY0 - 0.25, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        13,
        C.muted,
        [AX0 + 0.31, AY1 + 0.12, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.22, AY0 - 0.62, 0]
      ),
      txt(
        'Christmas',
        P ? 12 : 11,
        AMBER,
        [X(7), AY0 - 0.60, 0]
      ),
      txt(
        'New Year',
        P ? 12 : 11,
        AMBER,
        [X(8), AY0 - 0.60, 0]
      )
    );

    return new M.VGroup(
      ...objects
    );
  }

  // Divide the known weeks from the future holiday weeks.

  function nowDivider() {
    const x =
      (X(6) + X(7)) / 2;

    const guide = dash(
      [x, AY0 + 0.03, 0],
      [x, AY1 - 0.05, 0],
      C.muted
    );

    const label = txt(
      'NOW',
      12,
      C.muted,
      [x, AY1 + 0.13, 0]
    );

    return new M.VGroup(
      guide,
      label
    );
  }

  // Colour legend is rebuilt from fresh objects when
  // new kinds of information become visible.

  function legend(items) {
    const objects = [];
    const n = items.length;

    const spacing = n === 4
      ? 1.53
      : n === 3
        ? 1.85
        : 2.45;

    const y = P ? AY0 - 1.02 : 1.49;

    items.forEach(([name, color, style], i) => {
      const x =
        CX + (i - (n - 1) / 2) * (P ? spacing * 1.15 : spacing);

      const label = T(
        name,
        P ? 15 : 12,
        color
      );

      const markWidth = 0.31;
      const totalWidth =
        markWidth + 0.12 + label.getWidth();

      const start =
        x - totalWidth / 2;

      const mark = style === 'dashed'
        ? dash(
            [start, y, 0],
            [start + markWidth, y, 0],
            color
          )
        : ln(
            [start, y, 0],
            [start + markWidth, y, 0],
            color,
            2.8
          );

      label.moveTo([
        start +
          markWidth +
          0.12 +
          label.getWidth() / 2,
        y,
        0
      ]);

      objects.push(mark, label);
    });

    return new M.VGroup(
      ...objects
    );
  }

  const THIS_LEGEND = [
    'This year',
    CYAN,
    'solid'
  ];

  const LAST_LEGEND = [
    'Last year',
    PINK,
    'solid'
  ];

  const FORECAST_LEGEND = [
    'Forecast',
    AMBER,
    'dashed'
  ];

  const ACTUAL_LEGEND = [
    'Revealed',
    WHITE,
    'solid'
  ];

  // ------------------------------------------------------------
  // Observed data series.
  //
  // This year's first six points can be shown immediately.
  // Last year's points are revealed one at a time,
  // following sentences 5 through 12.
  // ------------------------------------------------------------

  function thisYearSeries(n = 6) {
    const objects = [];

    for (let week = 2; week <= n; week++) {
      objects.push(
        ln(
          pt(week - 1, THIS[week - 2]),
          pt(week, THIS[week - 1]),
          CYAN,
          3.0
        )
      );
    }

    for (let week = 1; week <= n; week++) {
      objects.push(
        glowingDot(
          pt(week, THIS[week - 1]),
          CYAN,
          0.085,
          0.14
        )
      );
    }

    return new M.VGroup(
      ...objects
    );
  }

  function lastYearPoint(week) {
    const p = pt(
      week,
      LAST[week - 1]
    );

    const objects = [];

    if (week > 1) {
      const segment = ln(
        pt(
          week - 1,
          LAST[week - 2]
        ),
        p,
        PINK,
        2.4
      );

      objects.push(segment);
    }

    const d = dot(
      p,
      PINK,
      0.073
    );

    d.setFill(PINK, 0.82);

    objects.push(d);

    return new M.VGroup(
      ...objects
    );
  }

  function lastYearLabel(week) {
    return txt(
      String(LAST[week - 1]),
      15,
      PINK,
      [
        X(week),
        Y(LAST[week - 1]) - 0.24,
        0
      ],
      true
    );
  }

  function thisYearLabel(
    week,
    color = CYAN,
    above = true
  ) {
    return txt(
      String(THIS[week - 1]),
      16,
      color,
      [
        X(week),
        Y(THIS[week - 1]) +
          (above ? 0.25 : -0.25),
        0
      ],
      true
    );
  }

  function revealLastYear(week, showLabel = true) {
    const a = [
      ...put(
        'last' + week,
        lastYearPoint(week)
      )
    ];

    if (showLabel) {
      a.push(
        ...put(
          'lastLabel' + week,
          lastYearLabel(week)
        )
      );
    }

    return a;
  }

  function clearLastLabels() {
    return remove(
      ...Array.from(
        { length: 8 },
        (_, i) => 'lastLabel' + (i + 1)
      )
    );
  }

  // ------------------------------------------------------------
  // Forecast visuals
  // ------------------------------------------------------------

  function forecastPoint(week, value) {
    const p = pt(week, value);

    return new M.VGroup(
      ring(
        p,
        AMBER,
        0.16
      ),
      dot(
        p,
        AMBER,
        0.055
      )
    );
  }

  function forecastGuide(
    week,
    value,
    fromWeek,
    fromValue
  ) {
    const objects = [];

    objects.push(
      dash(
        pt(fromWeek, fromValue),
        pt(week, value),
        AMBER
      )
    );

    objects.push(
      dash(
        [X(week), AY0 + 0.04, 0],
        [
          X(week),
          Y(value) - 0.17,
          0
        ],
        AMBER
      )
    );

    objects.push(
      forecastPoint(
        week,
        value
      )
    );

    return new M.VGroup(
      ...objects
    );
  }

  function forecastLabel(
    week,
    value,
    offsetY = 0.30
  ) {
    return tag(
      String(value),
      AMBER,
      [
        X(week),
        Y(value) + offsetY,
        0
      ],
      15
    );
  }

  function naiveForecast(showLabel = true) {
    const objects = [
      dash(
        pt(6, THIS[5]),
        pt(7, NAIVE),
        AMBER
      ),
      forecastPoint(7, NAIVE)
    ];

    if (showLabel) {
      objects.push(
        tag(
          '29',
          AMBER,
          [
            X(7),
            Y(NAIVE) - 0.32,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(
      ...objects
    );
  }

  // Seasonal forecast at week 7 is copied from
  // last year's week 7, not this year's week 6.

  function christmasForecast() {
    return forecastGuide(
      7,
      CHRISTMAS_FORECAST,
      6,
      THIS[5]
    );
  }

  function newYearForecast() {
    return forecastGuide(
      8,
      NEW_YEAR_FORECAST,
      7,
      CHRISTMAS_FORECAST
    );
  }

  function seasonalCopyMarker(week) {
    const value = LAST[week - 1];
    const p = pt(week, value);

    const outer = ring(
      p,
      AMBER,
      0.28
    );

    const label = tag(
      'COPY 32',
      AMBER,
      [
        X(week),
        Y(value) + 0.44,
        0
      ],
      13
    );

    return new M.VGroup(
      outer,
      label
    );
  }

  function removeForecasts() {
    return remove(
      'naive',
      'forecast7',
      'forecast8',
      'forecastLabel7',
      'forecastLabel8',
      'copyMarker'
    );
  }

  // ------------------------------------------------------------
  // Holiday reveals and forecast errors.
  //
  // The white dots are not created on screen until
  // the narration explicitly reveals each real count.
  // ------------------------------------------------------------

  function actualPoint(week) {
    const value = THIS[week - 1];

    const p = pt(
      week,
      value
    );

    const objects = [];

    objects.push(
      ln(
        pt(
          week - 1,
          THIS[week - 2]
        ),
        p,
        WHITE,
        2.1
      )
    );

    objects.push(
      glowingDot(
        p,
        WHITE,
        0.10,
        0.23
      )
    );

    objects.push(
      txt(
        String(value),
        16,
        WHITE,
        [
          X(week),
          Y(value) + 0.27,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      ...objects
    );
  }

  function errorBracket(
    week,
    forecast,
    actual,
    color = GREEN,
    side = 1,
    showNumber = true
  ) {
    const x =
      X(week) + side * 0.19;

    const y1 = Y(forecast);
    const y2 = Y(actual);

    const lower = Math.min(y1, y2);
    const upper = Math.max(y1, y2);

    const objects = [
      ln(
        [x, lower, 0],
        [x, upper, 0],
        color,
        2.8
      ),
      ln(
        [x - 0.065, lower, 0],
        [x + 0.065, lower, 0],
        color,
        2
      ),
      ln(
        [x - 0.065, upper, 0],
        [x + 0.065, upper, 0],
        color,
        2
      )
    ];

    if (showNumber) {
      objects.push(
        txt(
          String(actual - forecast),
          15,
          color,
          [
            x + side * 0.15,
            (lower + upper) / 2,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(
      ...objects
    );
  }

  // ------------------------------------------------------------
  // Seasonality visual:
  // last year's Christmas jump from 26 to 32 rooms.
  // ------------------------------------------------------------

  function christmasJump() {
    const p6 = pt(6, LAST[5]);
    const p7 = pt(7, LAST[6]);

    const corner = [
      X(7),
      Y(LAST[5]),
      0
    ];

    const objects = [
      dash(
        p6,
        corner,
        PINK
      ),
      ln(
        corner,
        p7,
        PINK,
        4
      ),
      ln(
        [
          X(7) - 0.10,
          Y(LAST[6]) - 0.14,
          0
        ],
        p7,
        PINK,
        3
      ),
      ln(
        [
          X(7) + 0.10,
          Y(LAST[6]) - 0.14,
          0
        ],
        p7,
        PINK,
        3
      ),
      tag(
        '+6',
        PINK,
        [
          X(7) - 0.32,
          (
            Y(LAST[5]) +
            Y(LAST[6])
          ) / 2,
          0
        ],
        14
      )
    ];

    return new M.VGroup(
      ...objects
    );
  }

  function holidayPattern() {
    const objects = [];

    [7, 8].forEach(week => {
      objects.push(
        ring(
          pt(
            week,
            LAST[week - 1]
          ),
          PINK,
          0.20
        )
      );
    });

    const label = tag(
      'HOLIDAY PATTERN',
      PINK,
      [
        CX + 0.72,
        AY0 + 0.45,
        0
      ],
      15
    );

    objects.push(label);

    return new M.VGroup(
      ...objects
    );
  }

  // ------------------------------------------------------------
  // Year-to-year growth visual
  //
  // Vertical lines connect each last-year dot to
  // the matching this-year dot.
  //
  // The differences are +2, +3, +1, +2, +2, +3.
  // ------------------------------------------------------------

  function gainMarker(week) {
    const oldValue = LAST[week - 1];
    const newValue = THIS[week - 1];

    const gain = newValue - oldValue;

    const x = X(week);
    const low = Y(oldValue);
    const high = Y(newValue);

    const objects = [];

    objects.push(
      ln(
        [x, low, 0],
        [x, high, 0],
        GREEN,
        4
      )
    );

    objects.push(
      ring(
        pt(week, oldValue),
        PINK,
        0.095
      ),
      ring(
        pt(week, newValue),
        CYAN,
        0.12
      )
    );

    const label = tag(
      '+' + gain,
      GREEN,
      [
        x,
        high + 0.34,
        0
      ],
      14
    );

    objects.push(label);

    return new M.VGroup(
      ...objects
    );
  }

  function clearGains() {
    return remove(
      'gain1',
      'gain2',
      'gain3',
      'gain4',
      'gain5',
      'gain6'
    );
  }

  function growthOutline() {
    const xs = [
      X(1) - 0.28,
      X(6) + 0.27
    ];

    const low =
      Y(Math.min(...LAST.slice(0, 6))) - 0.24;

    const high =
      Y(Math.max(...THIS.slice(0, 6))) + 0.60;

    const r = new M.RoundedRectangle({
      width: xs[1] - xs[0],
      height: high - low,
      cornerRadius: 0.14,
      color: GREEN,
      strokeWidth: 2
    });

    r.setFill(GREEN, 0.025);

    r.moveTo([
      (xs[0] + xs[1]) / 2,
      (high + low) / 2,
      0
    ]);

    return r;
  }

  // ============================================================
  // 0–4: the forecasting problem.
  // ============================================================

  // 0. End of week six.
  // The hotel needs enough staff for the holidays.

  await until(S(0));
  await play(
    ...put(
      'axes',
      axes()
    ),
    ...put(
      'thisYear',
      thisYearSeries(6)
    ),
    ...put(
      'now',
      nowDivider()
    ),
    ...put(
      'legend',
      legend([
        THIS_LEGEND
      ])
    ),
    ...put(
      'week6Label',
      thisYearLabel(6)
    ),
    ...say('END OF WEEK 6: PLAN FOR THE HOLIDAYS'),
    ...fbox([
      ['HOTEL', CYAN],
      '40 rooms available',
      'week 6: 29 occupied',
      '',
      ['Christmas: ?', AMBER],
      ['New Year:  ?', AMBER]
    ])
  );

  // 1. Ordinary naive forecast.
  // Copy week six: 29 rooms for Christmas.

  await until(S(1));
  await play(
    ...put(
      'naive',
      naiveForecast()
    ),
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        FORECAST_LEGEND
      ])
    ),
    ...say('COPY THE LAST COUNT: 29 ROOMS', AMBER),
    ...fbox([
      ['NAIVE FORECAST', AMBER],
      'last week = 29',
      '       ↓ copy',
      ['Christmas = 29', AMBER]
    ], AMBER)
  );

  // 2. Could last Christmas be a better starting point?

  await until(S(2));
  await play(
    ...remove('naive'),
    ...say('WHAT ABOUT LAST CHRISTMAS?', PINK),
    ...fbox([
      ['another idea', PINK],
      'instead of last week,',
      'look at the matching',
      'week last year'
    ], PINK)
  );

  // 3. Align the two years on the same week axis.
  // Last year's values will appear in the next beats.

  await until(S(3));
  await play(
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        LAST_LEGEND
      ])
    ),
    ...say('LINE UP THE SAME WEEKS IN BOTH YEARS', PINK),
    ...fbox([
      ['cyan = this year', CYAN],
      ['pink = last year', PINK],
      '',
      'week 1 matches week 1',
      'week 2 matches week 2',
      'and so on'
    ], PINK)
  );

  // 4. Keep this year's actual holiday counts hidden.

  function hiddenHolidayLabels() {
    return new M.VGroup(
      tag(
        '?',
        C.muted,
        [
          X(7),
          AY0 + 0.42,
          0
        ],
        17
      ),
      tag(
        '?',
        C.muted,
        [
          X(8),
          AY0 + 0.42,
          0
        ],
        17
      )
    );
  }

  await until(S(4));
  await play(
    ...put(
      'hiddenHolidays',
      hiddenHolidayLabels()
    ),
    ...say('KEEP THIS YEAR’S HOLIDAY COUNTS HIDDEN', AMBER),
    ...fbox([
      ['KNOWN', CYAN],
      'weeks 1 to 6',
      '',
      ['NOT YET KNOWN', AMBER],
      'weeks 7 and 8'
    ], AMBER)
  );

  // ============================================================
  // 5–12: reveal last year's eight weekly counts.
  // ============================================================

  // 5. Last year, week 1: 18.

  await until(S(5));
  await play(
    ...revealLastYear(1),
    ...say('LAST YEAR: WEEK 1', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 1',
      ['18 rooms', PINK]
    ], PINK)
  );

  // 6. Week 2: 21.

  await until(S(6));
  await play(
    ...revealLastYear(2),
    ...say('WEEK 2: 21 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 1 = 18',
      ['week 2 = 21', PINK]
    ], PINK)
  );

  // 7. Week 3: 19.

  await until(S(7));
  await play(
    ...revealLastYear(3),
    ...say('WEEK 3: 19 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 2 = 21',
      ['week 3 = 19', PINK]
    ], PINK)
  );

  // 8. Week 4: 21.

  await until(S(8));
  await play(
    ...revealLastYear(4),
    ...say('WEEK 4: 21 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 3 = 19',
      ['week 4 = 21', PINK]
    ], PINK)
  );

  // 9. Week 5: 22.

  await until(S(9));
  await play(
    ...revealLastYear(5),
    ...say('WEEK 5: 22 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 4 = 21',
      ['week 5 = 22', PINK]
    ], PINK)
  );

  // 10. Week 6: 26.

  await until(S(10));
  await play(
    ...revealLastYear(6),
    ...say('WEEK 6: 26 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR', PINK],
      'week 5 = 22',
      ['week 6 = 26', PINK]
    ], PINK)
  );

  // 11. Last Christmas: 32.

  await until(S(11));
  await play(
    ...revealLastYear(7),
    ...say('LAST CHRISTMAS: 32 ROOMS', PINK),
    ...fbox([
      ['LAST CHRISTMAS', PINK],
      'week 7',
      ['32 occupied rooms', PINK]
    ], PINK)
  );

  // 12. Last New Year: 30.

  await until(S(12));
  await play(
    ...revealLastYear(8),
    ...say('LAST NEW YEAR: 30 ROOMS', PINK),
    ...fbox([
      ['LAST YEAR’S HOLIDAYS', PINK],
      ['Christmas = 32', PINK],
      ['New Year  = 30', PINK]
    ], PINK)
  );

  // ============================================================
  // 13–15: see the repeating pattern before naming the rule.
  // ============================================================

  // 13. Last year's Christmas jump: 26 to 32.

  await until(S(13));
  await play(
    ...put(
      'christmasJump',
      christmasJump()
    ),
    ...say('LAST CHRISTMAS: A JUMP OF 6 ROOMS', PINK),
    ...fbox([
      'last year',
      'week 6    = 26',
      'Christmas = 32',
      ['32 − 26 = 6', PINK],
      ['6 extra rooms', PINK]
    ], PINK)
  );

  // 14. A regularly repeating pattern is seasonality.

  await until(S(14));
  await play(
    ...remove('christmasJump'),
    ...put(
      'holidayPattern',
      holidayPattern()
    ),
    ...say('SEASONALITY = A REPEATING PATTERN', PINK),
    ...fbox([
      ['SEASONALITY', PINK],
      'a pattern that returns',
      'at regular times',
      '',
      'for example:',
      'the Christmas rush'
    ], PINK)
  );

  // 15. Copy the corresponding week from last year.

  await until(S(15));
  await play(
    ...remove('holidayPattern', 'lastLabel7'),
    ...put(
      'copyMarker',
      seasonalCopyMarker(7)
    ),
    ...say('COPY THE MATCHING WEEK LAST YEAR', AMBER),
    ...fbox([
      ['new forecasting rule', AMBER],
      'same holiday',
      'same week',
      'last year'
    ], AMBER)
  );

  // ============================================================
  // 16–20: seasonal naive forecasts.
  //
  // Christmas forecast = 32.
  // New Year forecast = 30.
  // ============================================================

  // 16. Forecast Christmas by copying 32.

  await until(S(16));
  await play(
    ...remove(
      'copyMarker',
      'lastLabel7'
    ),
    ...put(
      'forecast7',
      christmasForecast()
    ),
    ...put(
      'forecastLabel7',
      forecastLabel(7, 32)
    ),
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        LAST_LEGEND,
        FORECAST_LEGEND
      ])
    ),
    ...say('COPY LAST CHRISTMAS: FORECAST 32', AMBER),
    ...fbox([
      ['last Christmas', PINK],
      ['32 rooms', PINK],
      '     ↓ copy',
      ['this Christmas', AMBER],
      ['forecast = 32', AMBER]
    ], AMBER)
  );

  // 17. Forecast New Year by copying 30.

  await until(S(17));
  await play(
    ...remove('lastLabel8'),
    ...put(
      'forecast8',
      newYearForecast()
    ),
    ...put(
      'forecastLabel8',
      forecastLabel(8, 30, 0.30)
    ),
    ...say('COPY LAST NEW YEAR: FORECAST 30', AMBER),
    ...fbox([
      ['last New Year', PINK],
      ['30 rooms', PINK],
      '     ↓ copy',
      ['this New Year', AMBER],
      ['forecast = 30', AMBER]
    ], AMBER)
  );

  // 18. Name the method: seasonal naive.

  await until(S(18));
  await play(
    ...say('SEASONAL NAIVE FORECAST', GREEN),
    ...fbox([
      ['SEASONAL NAIVE', GREEN],
      '',
      ['Christmas = 32', AMBER],
      ['New Year  = 30', AMBER],
      '',
      'copy the matching week'
    ], GREEN)
  );

  // 19. Both naive methods copy a known count.

  await until(S(19));
  await play(
    ...say('BOTH RULES COPY A KNOWN COUNT', GREEN),
    ...fbox([
      ['NAIVE', CYAN],
      'copy the latest count',
      '',
      ['SEASONAL NAIVE', PINK],
      'copy the matching',
      'seasonal count'
    ], GREEN),
    new M.Indicate(
      visible.forecast7,
      { color: AMBER }
    ),
    new M.Indicate(
      visible.forecast8,
      { color: AMBER }
    )
  );

  // 20. The seasonal rule steps back 52 weeks.
  //
  // The two years share the same x-axis positions.
  // A vertical year-to-year arrow illustrates the
  // seasonal lag without treating it as a one-week lag.

  function seasonalLagPicture() {
    const yTop = AY0 + 0.95;
    const yBottom = AY0 + 0.33;

    const x = CX;

    const objects = [
      txt(
        'THIS CHRISTMAS',
        14,
        AMBER,
        [
          x + 1.43,
          yTop,
          0
        ]
      ),
      txt(
        'LAST CHRISTMAS',
        14,
        PINK,
        [
          x + 1.43,
          yBottom,
          0
        ]
      ),
      ln(
        [x - 0.35, yTop, 0],
        [x - 0.35, yBottom, 0],
        PINK,
        2.6
      ),
      ln(
        [
          x - 0.46,
          yBottom + 0.13,
          0
        ],
        [x - 0.35, yBottom, 0],
        PINK,
        2
      ),
      ln(
        [
          x - 0.24,
          yBottom + 0.13,
          0
        ],
        [x - 0.35, yBottom, 0],
        PINK,
        2
      ),
      tag(
        '52 WEEKS BACK',
        PINK,
        [
          x - 1.55,
          (yTop + yBottom) / 2,
          0
        ],
        14
      )
    ];

    return new M.VGroup(
      ...objects
    );
  }

  await until(S(20));
  await play(
    ...remove('hiddenHolidays'),
    ...put(
      'seasonalLag',
      seasonalLagPicture()
    ),
    ...say('STEP BACK ONE FULL YEAR: 52 WEEKS', PINK),
    ...fbox([
      ['season length', PINK],
      '1 year = 52 weeks',
      '',
      'forecast week',
      '     ↓ back 52 weeks',
      ['matching old count', PINK]
    ], PINK)
  );

  // ============================================================
  // 21–25: reveal the actual holiday counts.
  // Compare the forecast errors.
  // ============================================================

  // 21. Reveal Christmas actual: 35.

  await until(S(21));
  await play(
    ...remove(
      'seasonalLag',
      'forecastLabel7'
    ),
    ...put(
      'actual7',
      actualPoint(7)
    ),
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        LAST_LEGEND,
        FORECAST_LEGEND,
        ACTUAL_LEGEND
      ])
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 32', AMBER],
      ['real count = 35', WHITE],
      '',
      'how far off',
      'was the forecast?'
    ])
  );

  // 22. Christmas seasonal-naive error = 35 − 32 = 3.

  await until(S(22));
  await play(
    ...remove('forecastLabel8'),
    ...put(
      'error7',
      errorBracket(
        7,
        CHRISTMAS_FORECAST,
        THIS[6],
        GREEN,
        1
      )
    ),
    ...say('CHRISTMAS ERROR: 3 ROOMS LOW', GREEN),
    ...fbox([
      ['real     = 35', WHITE],
      ['forecast = 32', AMBER],
      '',
      'error = real − forecast',
      ['35 − 32 = 3', GREEN]
    ], GREEN)
  );

  // 23. The ordinary naive forecast was 6 rooms low.
  // Show both errors on the same Christmas point.

  await until(S(23));
  await play(
    ...put(
      'naive',
      naiveForecast(true)
    ),
    ...put(
      'naiveError',
      errorBracket(
        7,
        NAIVE,
        THIS[6],
        RED,
        -1
      )
    ),
    ...say('SEASONAL NAIVE: ERROR 3 INSTEAD OF 6', GREEN),
    ...fbox([
      ['CHRISTMAS', WHITE],
      '',
      'naive:',
      ['35 − 29 = 6', RED],
      'seasonal naive:',
      ['35 − 32 = 3', GREEN]
    ], GREEN)
  );

  // 24. Reveal New Year actual: 33.

  await until(S(24));
  await play(
    ...remove(
      'naive',
      'naiveError',
      'forecastLabel8'
    ),
    ...put(
      'actual8',
      actualPoint(8)
    ),
    ...say('NEW YEAR ACTUAL: 33 ROOMS', WHITE),
    ...fbox([
      ['NEW YEAR', WHITE],
      ['forecast = 30', AMBER],
      ['real count = 33', WHITE]
    ])
  );

  // 25. New Year error = 33 − 30 = 3.

  await until(S(25));
  await play(
    ...put(
      'error8',
      errorBracket(
        8,
        NEW_YEAR_FORECAST,
        THIS[7],
        GREEN,
        -1
      )
    ),
    ...say('NEW YEAR ERROR: ALSO 3 ROOMS LOW', GREEN),
    ...fbox([
      ['NEW YEAR', WHITE],
      ['real     = 33', WHITE],
      ['forecast = 30', AMBER],
      '',
      ['33 − 30 = 3', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 26–28: formula and benchmark.
  // ============================================================

  // 26. State the formula in words.

  await until(S(26));
  await play(
    ...say('FORECAST = THE MATCHING COUNT ONE SEASON AGO', AMBER),
    ...fbox([
      ['SEASONAL NAIVE', GREEN],
      '',
      ['forecast =', AMBER],
      '  count from the',
      '  matching week',
      '  one season ago'
    ], AMBER)
  );

  // 27. Use the method as a benchmark.

  await until(S(27));
  await play(
    ...say('BENCHMARK = A SIMPLE RULE TO COMPARE AGAINST', GREEN),
    ...fbox([
      ['BENCHMARK', GREEN],
      'a simple forecast',
      'to compare with',
      'other forecasting rules',
      '',
      ['Christmas error: 3', AMBER]
    ], GREEN)
  );

  // 28. Useful when busy and quiet weeks recur.

  await until(S(28));
  await play(
    ...put(
      'holidayPattern',
      holidayPattern()
    ),
    ...say('USEFUL WHEN BUSY AND QUIET WEEKS REPEAT', PINK),
    ...fbox([
      ['use seasonal naive', GREEN],
      'when the timing',
      'of busy and quiet',
      'periods tends to repeat',
      '',
      ['same seasonal pattern', PINK]
    ], GREEN)
  );

  // ============================================================
  // 29–37: compare the two years before Christmas.
  //
  // This year's counts are higher in every week.
  //
  // Differences:
  // +2, +3, +1, +2, +2, +3.
  // ============================================================

  // 29. Return to the six weeks before Christmas.

  await until(S(29));
  await play(
    ...removeForecasts(),
    ...remove(
      'actual7',
      'actual8',
      'error7',
      'error8',
      'holidayPattern',
      'last7',
      'last8',
      'week6Label'
    ),
    ...clearLastLabels(),
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        LAST_LEGEND
      ])
    ),
    ...say('COMPARE THE WEEKS BEFORE CHRISTMAS'),
    ...fbox([
      'same six weeks',
      '',
      ['this year', CYAN],
      ['last year', PINK],
      '',
      'is anything changing?'
    ])
  );

  // 30. Subtract last year from this year.

  await until(S(30));
  await play(
    ...say('THIS YEAR MINUS LAST YEAR', GREEN),
    ...fbox([
      ['yearly difference', GREEN],
      '',
      ['this year’s count', CYAN],
      ['− last year’s count', PINK],
      ['= change in rooms', GREEN]
    ], GREEN)
  );

  // 31. Week 1: 20 − 18 = +2.

  await until(S(31));
  await play(
    ...put(
      'gain1',
      gainMarker(1)
    ),
    ...say('WEEK 1: UP 2 ROOMS', GREEN),
    ...fbox([
      'week 1',
      ['this year = 20', CYAN],
      ['last year = 18', PINK],
      ['20 − 18 = +2', GREEN]
    ], GREEN)
  );

  // 32. Week 2: 24 − 21 = +3.

  await until(S(32));
  await play(
    ...put(
      'gain2',
      gainMarker(2)
    ),
    ...say('WEEK 2: UP 3 ROOMS', GREEN),
    ...fbox([
      'week 2',
      ['this year = 24', CYAN],
      ['last year = 21', PINK],
      ['24 − 21 = +3', GREEN]
    ], GREEN)
  );

  // 33. Week 3: 20 − 19 = +1.

  await until(S(33));
  await play(
    ...put(
      'gain3',
      gainMarker(3)
    ),
    ...say('WEEK 3: UP 1 ROOM', GREEN),
    ...fbox([
      'week 3',
      ['this year = 20', CYAN],
      ['last year = 19', PINK],
      ['20 − 19 = +1', GREEN]
    ], GREEN)
  );

  // 34. Week 4: 23 − 21 = +2.

  await until(S(34));
  await play(
    ...put(
      'gain4',
      gainMarker(4)
    ),
    ...say('WEEK 4: UP 2 ROOMS', GREEN),
    ...fbox([
      'week 4',
      ['this year = 23', CYAN],
      ['last year = 21', PINK],
      ['23 − 21 = +2', GREEN]
    ], GREEN)
  );

  // 35. Week 5: 24 − 22 = +2.

  await until(S(35));
  await play(
    ...put(
      'gain5',
      gainMarker(5)
    ),
    ...say('WEEK 5: UP 2 ROOMS', GREEN),
    ...fbox([
      'week 5',
      ['this year = 24', CYAN],
      ['last year = 22', PINK],
      ['24 − 22 = +2', GREEN]
    ], GREEN)
  );

  // 36. Week 6: 29 − 26 = +3.

  await until(S(36));
  await play(
    ...put(
      'gain6',
      gainMarker(6)
    ),
    ...say('WEEK 6: UP 3 ROOMS', GREEN),
    ...fbox([
      'week 6',
      ['this year = 29', CYAN],
      ['last year = 26', PINK],
      ['29 − 26 = +3', GREEN]
    ], GREEN)
  );

  // 37. This year is busier in every observed week.

  await until(S(37));
  await play(
    ...put(
      'growthOutline',
      growthOutline()
    ),
    new M.LaggedStart(
      [1, 2, 3, 4, 5, 6].map(week =>
        new M.Indicate(
          visible['gain' + week],
          { color: GREEN }
        )
      ),
      {
        lagRatio: 0.12,
        runTime: 1.8
      }
    ),
    ...say('EVERY WEEK IS BUSIER THAN LAST YEAR', GREEN),
    ...fbox([
      ['YEARLY CHANGES', GREEN],
      'week:  1  2  3  4  5  6',
      ['gain: +2 +3 +1 +2 +2 +3', GREEN],
      '',
      'all six are positive',
      ['the hotel is busier', CYAN]
    ], GREEN)
  );

  // ============================================================
  // 38–40: limitation and final recap.
  // ============================================================

  // 38. The trap: seasonal naive ignores growth.

  await until(S(38));
  await play(
    ...remove('growthOutline'),
    ...say('TRAP: COPYING LAST YEAR IGNORES GROWTH', RED),
    ...fbox([
      ['THE TRAP', RED],
      'the seasonal pattern',
      'may still repeat',
      '',
      'but the hotel',
      ['is getting busier', CYAN]
    ], RED)
  );

  // 39. Restore both holiday forecasts and actual counts.
  //
  // Christmas: 35 − 32 = 3.
  // New Year:  33 − 30 = 3.

  await until(S(39));
  await play(
    ...clearGains(),
    ...revealLastYear(7, false),
    ...revealLastYear(8, false),
    ...put(
      'forecast7',
      christmasForecast()
    ),
    ...put(
      'forecast8',
      newYearForecast()
    ),
    ...put(
      'actual7',
      actualPoint(7)
    ),
    ...put(
      'actual8',
      actualPoint(8)
    ),
    ...put(
      'error7',
      errorBracket(
        7,
        CHRISTMAS_FORECAST,
        THIS[6],
        RED,
        1
      )
    ),
    ...put(
      'error8',
      errorBracket(
        8,
        NEW_YEAR_FORECAST,
        THIS[7],
        RED,
        -1
      )
    ),
    ...put(
      'legend',
      legend([
        THIS_LEGEND,
        LAST_LEGEND,
        FORECAST_LEGEND,
        ACTUAL_LEGEND
      ])
    ),
    ...say('BOTH HOLIDAY FORECASTS ARE 3 ROOMS LOW', RED),
    ...fbox([
      ['CHRISTMAS', WHITE],
      ['35 − 32 = 3 low', RED],
      '',
      ['NEW YEAR', WHITE],
      ['33 − 30 = 3 low', RED],
      '',
      'growth was ignored'
    ], RED)
  );

  // 40. Final recap.
  //
  // Seasonal naive captures repeating seasonal timing.
  // It does not adjust for year-to-year growth.

  await until(S(40));
  await play(
    ...say('SEASONAL NAIVE COPIES THE MATCHING WEEK', GREEN),
    ...fbox([
      ['SEASONAL NAIVE', GREEN],
      'copy the matching week',
      'from one season ago',
      '',
      ['Christmas: 32 rooms', AMBER],
      ['New Year:  30 rooms', AMBER]
    ], GREEN),
    new M.LaggedStart(
      [
        new M.Indicate(
          visible.forecast7,
          { color: AMBER }
        ),
        new M.Indicate(
          visible.forecast8,
          { color: AMBER }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 1.8
      }
    )
  );

  await until(S(40) + 2.65);
  await play(
    ...say('USE THE REPEATING PATTERN, BUT WATCH FOR GROWTH', GREEN),
    ...fbox([
      ['SEASONAL NAIVE', GREEN],
      '',
      ['captures seasonality', PINK],
      ['ignores growth', RED],
      '',
      'a useful simple',
      ['forecast benchmark', AMBER]
    ], GREEN)
  );

  await until(E(40));
}
