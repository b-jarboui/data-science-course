// lesson 11.2.5
// Holt's method: keep a running level and a running trend.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  // Week:       1   2   3   4   5   6   7   8
  // This year: 20  24  20  23  24  29  35  33
  //
  // Holt's method:
  // Level weight = 1/2.
  // Trend weight = 1/2.
  //
  // Initialize at week 4:
  // Level = 23.
  // Trend = (23 - 20) / 3 = 1.
  //
  // Week 5:
  // Expected = 23 + 1 = 24.
  // Actual = 24.
  // Error = 0.
  // New level = 24 + 0.5 × 0 = 24.
  // Latest rise in level = 24 - 23 = 1.
  // New trend = 1 + 0.5 × (1 - 1) = 1.
  //
  // Week 6:
  // Expected = 24 + 1 = 25.
  // Actual = 29.
  // Error = 4.
  // New level = 25 + 0.5 × 4 = 27.
  // Latest rise in level = 27 - 24 = 3.
  // New trend = 1 + 0.5 × (3 - 1) = 2.
  //
  // Christmas forecast = 27 + 2 = 29.
  // New Year forecast = 27 + 2 × 2 = 31.
  //
  // Christmas actual = 35. Error = 6.
  // New Year actual = 33. Error = 2.
  //
  // Both holiday forecasts are made at the end of week 6.
  // Neither is updated using the later holiday observations.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const ALPHA = 0.5;
  const BETA = 0.5;

  const INITIAL_LEVEL = DATA[3];
  const INITIAL_TREND = (DATA[3] - DATA[0]) / 3;

  const EXPECTED_5 = INITIAL_LEVEL + INITIAL_TREND;
  const ERROR_5 = DATA[4] - EXPECTED_5;

  const LEVEL_5 =
    EXPECTED_5 + ALPHA * ERROR_5;

  const RISE_5 =
    LEVEL_5 - INITIAL_LEVEL;

  const TREND_5 =
    INITIAL_TREND +
    BETA * (RISE_5 - INITIAL_TREND);

  const EXPECTED_6 =
    LEVEL_5 + TREND_5;

  const ERROR_6 =
    DATA[5] - EXPECTED_6;

  const LEVEL_6 =
    EXPECTED_6 + ALPHA * ERROR_6;

  const RISE_6 =
    LEVEL_6 - LEVEL_5;

  const TREND_6 =
    TREND_5 + BETA * (RISE_6 - TREND_5);

  const FORECAST_7 =
    LEVEL_6 + TREND_6;

  const FORECAST_8 =
    LEVEL_6 + 2 * TREND_6;

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';

  // Green represents level.
  // Violet represents trend.
  // Amber represents an expectation or forecast.

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 x 8.
  // Keep content between y = -3.0 and 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;

  const PILL = P
    ? [0, -4.85, 0]
    : [CX, 1.95, 0];

  const BOXP = P
    ? [0, 3.10, 0]
    : [4.25, -0.25, 0];

  const AX0 = CX - (P ? 3.10 : 3.15);
  const AX1 = CX + (P ? 3.30 : 3.15);

  const AY0 = P ? -3.35 : -2.05;
  const AY1 = P ? 1.08 : 1.08;

  const DATA_LEFT = AX0 + 0.35;
  const DATA_RIGHT = AX1 - 0.30;

  const STEP =
    (DATA_RIGHT - DATA_LEFT) / 7;

  const X = week =>
    DATA_LEFT + (week - 1) * STEP;

  const Y = rooms =>
    AY0 + rooms / 40 * (AY1 - AY0);

  const pt = (week, rooms) =>
    [X(week), Y(rooms), 0];

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Basic visual primitives.
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

    return new M.VGroup(
      halo,
      dot(p, color, radius)
    );
  }

  function ring(p, color, radius = 0.17) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.3
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function rect(
    w,
    h,
    p,
    color,
    opacity = 0.75
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1.2
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 16) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function inA(obj, time = 0.50) {
    return new M.FadeIn(obj, {
      runTime: time
    });
  }

  function outA(obj, time = 0.40) {
    return new M.FadeOut(obj, {
      runTime: time
    });
  }

  function fmt(v) {
    return String(
      Math.round(v * 100) / 100
    );
  }

  function signed(v) {
    if (v > 0) return '+' + fmt(v);
    if (v < 0) return '−' + fmt(-v);
    return '0';
  }

  function arrow(a, b, color, width = 2.8) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length =
      Math.sqrt(dx * dx + dy * dy);

    if (length < 0.001) {
      return dot(b, color, 0.045);
    }

    const ux = dx / length;
    const uy = dy / length;

    const head = Math.min(
      0.14,
      length * 0.35
    );

    const side = head * 0.65;

    return new M.VGroup(
      ln(a, b, color, width),
      ln(
        [
          b[0] - ux * head - uy * side,
          b[1] - uy * head + ux * side,
          0
        ],
        b,
        color,
        width
      ),
      ln(
        [
          b[0] - ux * head + uy * side,
          b[1] - uy * head - ux * side,
          0
        ],
        b,
        color,
        width
      )
    );
  }

  // ------------------------------------------------------------
  // Independent scene object management.
  //
  // Never regroup already-visible objects.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(
        outA(visible[key])
      );
    }

    visible[key] = obj;

    if (obj) {
      a.push(
        inA(obj)
      );
    }

    return a;
  }

  function remove(...keys) {
    const a = [];

    keys.forEach(key => {
      if (!visible[key]) return;

      a.push(
        outA(visible[key])
      );

      delete visible[key];
    });

    return a;
  }

  // ------------------------------------------------------------
  // Formula box.
  // Same structure as the approved reference lesson.
  //
  // Lines may be:
  //   'text'
  //   ['text', color]
  //
  // Leading spaces provide indentation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = CYAN) {
    const size = P ? 22 : 21;
    const lh = P ? 0.43 : 0.41;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(
        s.trimStart() || ' ',
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
      : 4.10;

    const maxh = P
      ? 2.20
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

    const a = [inA(g)];

    if (boxNow) {
      a.push(
        outA(boxNow)
      );
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      outA(boxNow)
    ];

    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // Hotel chart.
  //
  // Horizontal axis: weeks 1–8.
  // Vertical axis: rooms 0–40.
  //
  // Cyan dots: observed room counts.
  // Green marker: running level.
  // Violet steps: trend.
  // Dashed amber steps: forecasts.
  // White dots: revealed holiday actuals.
  // ------------------------------------------------------------

  function axes() {
    const objects = [
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
    ];

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
    });

    for (let week = 1; week <= 8; week++) {
      const color =
        week >= 7 ? AMBER : C.muted;

      objects.push(
        ln(
          [X(week), AY0 - 0.06, 0],
          [X(week), AY0 + 0.06, 0],
          color,
          1.4
        ),
        txt(
          String(week),
          15,
          color,
          [X(week), AY0 - 0.25, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        14,
        C.muted,
        [AX0 + 0.32, AY1 + 0.13, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.30, AY0 - 0.62, 0]
      ),
      txt(
        'Christmas',
        P ? 12 : 11,
        AMBER,
        [X(7), AY0 - 0.62, 0]
      ),
      txt(
        'New Year',
        P ? 12 : 11,
        AMBER,
        [X(8), AY0 - 0.62, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function legend(
    level = false,
    forecast = false,
    actual = false
  ) {
    const items = [
      ['Count', CYAN, false]
    ];

    if (level) {
      items.push(
        ['Level', GREEN, false]
      );
    }

    if (forecast) {
      items.push(
        ['Forecast', AMBER, true]
      );
    }

    if (actual) {
      items.push(
        ['Actual', WHITE, false]
      );
    }

    const objects = [];

    const spacing =
      items.length === 4
        ? 1.48
        : items.length === 3
          ? 1.90
          : 2.35;

    const y = P ? 1.48 : 1.45;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX +
        (i - (items.length - 1) / 2) *
        spacing;

      const t = T(
        name,
        13,
        color
      );

      const totalWidth =
        t.getWidth() + 0.42;

      const left =
        x - totalWidth / 2;

      const mark = dashed
        ? dash(
            [left, y, 0],
            [left + 0.31, y, 0],
            color
          )
        : ln(
            [left, y, 0],
            [left + 0.31, y, 0],
            color,
            3
          );

      t.moveTo([
        left + 0.42 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(mark, t);
    });

    return new M.VGroup(...objects);
  }

  function observedSeries(n, labels = true) {
    const objects = [];

    for (let week = 2; week <= n; week++) {
      objects.push(
        ln(
          pt(week - 1, DATA[week - 2]),
          pt(week, DATA[week - 1]),
          CYAN,
          3
        )
      );
    }

    for (let week = 1; week <= n; week++) {
      objects.push(
        glowingDot(
          pt(week, DATA[week - 1]),
          CYAN,
          0.085,
          0.17
        )
      );

      if (labels) {
        objects.push(
          txt(
            String(DATA[week - 1]),
            15,
            CYAN,
            [
              X(week),
              Y(DATA[week - 1]) + 0.25,
              0
            ],
            true
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function hiddenWeeks(first) {
    const objects = [];

    for (let week = first; week <= 8; week++) {
      const top = AY1 - 0.12;
      const bottom = AY0 + 0.10;

      const cover = new M.RoundedRectangle({
        width: STEP * 0.76,
        height: top - bottom,
        cornerRadius: 0.09,
        color: C.muted,
        strokeWidth: 1
      });

      cover.setFill(C.card, 0.15);

      cover.moveTo([
        X(week),
        (top + bottom) / 2,
        0
      ]);

      objects.push(
        cover,
        tag(
          '?',
          C.muted,
          [
            X(week),
            AY0 + 0.39,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function nowDivider(week) {
    const x =
      (X(week) + X(week + 1)) / 2;

    return new M.VGroup(
      dash(
        [x, AY0 + 0.04, 0],
        [x, AY1 - 0.08, 0],
        C.muted
      ),
      txt(
        'NOW',
        12,
        C.muted,
        [x, AY1 + 0.12, 0]
      )
    );
  }

  function clearChart() {
    return remove(
      'axes',
      'series',
      'legend',
      'hidden',
      'now',
      'marker',
      'markerLabel',
      'levelTrail',
      'initialRise',
      'initialSteps',
      'intervals',
      'focus',
      'expected',
      'expectedLabel',
      'error',
      'halfway',
      'rise',
      'trendNote',
      'forecast7',
      'forecast8',
      'forecastLabel7',
      'forecastLabel8',
      'actual7',
      'actual8',
      'error7',
      'error8',
      'forecastFocus'
    );
  }

  function clearPictures() {
    return remove(
      'intro',
      'concept',
      'trendLine',
      'trendMidpoint',
      'trendMove',
      'trendResult',
      'updatePicture'
    );
  }

  function drawChart(n, withLevel = false) {
    return [
      ...clearPictures(),
      ...clearChart(),
      ...put('axes', axes()),
      ...put(
        'series',
        observedSeries(n)
      ),
      ...put(
        'legend',
        legend(withLevel)
      ),
      ...put(
        'now',
        nowDivider(n)
      )
    ];
  }

  function revealWeek(week) {
    return [
      ...put(
        'series',
        observedSeries(week)
      ),
      ...put(
        'hidden',
        hiddenWeeks(week + 1)
      ),
      ...put(
        'now',
        nowDivider(week)
      )
    ];
  }

  // ------------------------------------------------------------
  // Running level marker.
  //
  // A green diamond distinguishes the estimated level
  // from an observed cyan dot.
  //
  // During an update, the working marker first moves
  // to the expected count, then adjusts toward the
  // newly observed count.
  // ------------------------------------------------------------

  function diamondAt(p, color = GREEN, radius = 0.15) {
    const x = p[0];
    const y = p[1];

    const halo = new M.Dot({
      point: p,
      radius: radius * 1.65,
      color
    });

    halo.setFill(color, 0.13);

    return new M.VGroup(
      halo,
      ln(
        [x, y + radius, 0],
        [x + radius, y, 0],
        color,
        2.8
      ),
      ln(
        [x + radius, y, 0],
        [x, y - radius, 0],
        color,
        2.8
      ),
      ln(
        [x, y - radius, 0],
        [x - radius, y, 0],
        color,
        2.8
      ),
      ln(
        [x - radius, y, 0],
        [x, y + radius, 0],
        color,
        2.8
      )
    );
  }

  function levelMarker(week, value) {
    return diamondAt(
      pt(week, value),
      GREEN,
      0.16
    );
  }

  function levelLabel(week, value, prefix = '') {
    return tag(
      prefix + fmt(value),
      GREEN,
      [
        X(week),
        Y(value) - 0.36,
        0
      ],
      14
    );
  }

  function moveMarker(
    week,
    value,
    time = 0.85,
    prefix = ''
  ) {
    if (!visible.marker) {
      return [
        ...put(
          'marker',
          levelMarker(week, value)
        ),
        ...put(
          'markerLabel',
          levelLabel(week, value, prefix)
        )
      ];
    }

    return [
      new M.Transform(
        visible.marker,
        levelMarker(week, value),
        {
          runTime: time
        }
      ),
      ...put(
        'markerLabel',
        levelLabel(week, value, prefix)
      )
    ];
  }

  // ------------------------------------------------------------
  // Staircase geometry.
  //
  // Each horizontal tread represents one week.
  // Each vertical rise represents the estimated
  // change in occupied rooms over that week.
  // ------------------------------------------------------------

  function stairStep(
    fromWeek,
    fromValue,
    toWeek,
    toValue,
    color = VIOLET,
    dashed = false,
    width = 3.0
  ) {
    const a = pt(fromWeek, fromValue);

    const corner = [
      X(toWeek),
      Y(fromValue),
      0
    ];

    const b = pt(toWeek, toValue);

    const makeLine = dashed
      ? (p0, p1) => dash(p0, p1, color)
      : (p0, p1) => ln(p0, p1, color, width);

    const objects = [
      makeLine(a, corner)
    ];

    if (Math.abs(toValue - fromValue) > 0.001) {
      objects.push(
        makeLine(corner, b)
      );
    }

    return new M.VGroup(...objects);
  }

  // A magnified conceptual staircase, separate from
  // the hotel graph.
  //
  // The step heights are schematic, so a one-room
  // rise remains visible even on a small phone.

  function conceptStaircase(stage = 0) {
    const objects = [];

    const startX = CX - 2.55;
    const dx = 1.52;

    const startY = P ? -2.70 : -1.55;
    const dy = P ? 0.82 : 0.65;

    const x = i =>
      startX + i * dx;

    const y = i =>
      startY + i * dy;

    objects.push(
      txt(
        'A RUNNING ESTIMATE',
        19,
        C.ink,
        [
          CX,
          P ? 1.15 : 1.35,
          0
        ]
      )
    );

    for (let i = 0; i < 3; i++) {
      objects.push(
        ln(
          [x(i), y(i), 0],
          [x(i + 1), y(i), 0],
          VIOLET,
          4
        ),
        ln(
          [x(i + 1), y(i), 0],
          [x(i + 1), y(i + 1), 0],
          VIOLET,
          4
        )
      );
    }

    objects.push(
      ln(
        [x(3), y(3), 0],
        [x(3) + 0.65, y(3), 0],
        VIOLET,
        4
      ),
      diamondAt(
        [x(2), y(2), 0],
        GREEN,
        0.19
      )
    );

    if (stage >= 1) {
      const baseY = startY - 0.25;
      const gx = x(2) - 0.45;

      objects.push(
        ln(
          [startX - 0.15, baseY, 0],
          [x(3) + 0.55, baseY, 0],
          C.muted,
          1.5
        ),
        dash(
          [x(2), y(2), 0],
          [gx, y(2), 0],
          GREEN
        ),
        arrow(
          [gx, baseY, 0],
          [gx, y(2), 0],
          GREEN,
          3
        ),
        tag(
          'LEVEL',
          GREEN,
          [
            gx - 0.58,
            (baseY + y(2)) / 2,
            0
          ],
          15
        )
      );
    }

    if (stage >= 2) {
      const gx = x(3) + 0.25;

      objects.push(
        arrow(
          [gx, y(2), 0],
          [gx, y(3), 0],
          VIOLET,
          3.5
        ),
        tag(
          'TREND',
          VIOLET,
          [
            x(3) - 0.63,
            y(3) + 0.36,
            0
          ],
          15
        ),
        txt(
          'one week',
          14,
          C.muted,
          [
            (x(1) + x(2)) / 2,
            y(1) - 0.28,
            0
          ]
        )
      );
    }

    if (stage >= 3) {
      objects.push(
        tag(
          'HEIGHT + STEP',
          CYAN,
          [
            CX,
            P ? -3.65 : -2.47,
            0
          ],
          16
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Initialize Holt's method from weeks 1–4.
  //
  // The three intervals between week 1 and week 4
  // contain a total rise of three rooms.
  // Equal rise per interval = one room.
  // ------------------------------------------------------------

  function focusDot(week, color = AMBER) {
    return ring(
      pt(week, DATA[week - 1]),
      color,
      0.22
    );
  }

  function intervalPicture() {
    const objects = [];

    const y = AY0 + 0.48;

    for (let week = 1; week < 4; week++) {
      const left = X(week) + 0.045;
      const right = X(week + 1) - 0.045;

      objects.push(
        ln(
          [left, y, 0],
          [right, y, 0],
          VIOLET,
          2.5
        ),
        ln(
          [left, y - 0.07, 0],
          [left, y + 0.07, 0],
          VIOLET,
          1.8
        ),
        ln(
          [right, y - 0.07, 0],
          [right, y + 0.07, 0],
          VIOLET,
          1.8
        ),
        txt(
          String(week),
          13,
          VIOLET,
          [
            (left + right) / 2,
            y + 0.20,
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        '3 week-to-week intervals',
        14,
        VIOLET,
        [
          (X(1) + X(4)) / 2,
          y + 0.48,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  function initialRisePicture() {
    const x = X(4) + 0.24;
    const low = Y(DATA[0]);
    const high = Y(DATA[3]);

    return new M.VGroup(
      dash(
        pt(1, DATA[0]),
        [x, low, 0],
        VIOLET
      ),
      dash(
        pt(4, DATA[3]),
        [x, high, 0],
        VIOLET
      ),
      arrow(
        [x, low, 0],
        [x, high, 0],
        VIOLET,
        3
      ),
      tag(
        '+3',
        VIOLET,
        [
          x + 0.38,
          (low + high) / 2,
          0
        ],
        14
      )
    );
  }

  function initialStairs() {
    const objects = [];

    for (let week = 1; week < 4; week++) {
      const fromValue =
        DATA[0] + (week - 1) * INITIAL_TREND;

      const toValue =
        fromValue + INITIAL_TREND;

      objects.push(
        stairStep(
          week,
          fromValue,
          week + 1,
          toValue,
          VIOLET,
          false,
          3
        )
      );

      objects.push(
        txt(
          '+1',
          12,
          VIOLET,
          [
            (X(week) + X(week + 1)) / 2,
            Y(fromValue) - 0.23,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function levelTrail(n) {
    const objects = [];

    if (n >= 4) {
      objects.push(
        dot(
          pt(4, INITIAL_LEVEL),
          GREEN,
          0.055
        )
      );
    }

    if (n >= 5) {
      objects.push(
        stairStep(
          4,
          INITIAL_LEVEL,
          5,
          LEVEL_5,
          GREEN,
          false,
          2.7
        ),
        dot(
          pt(5, LEVEL_5),
          GREEN,
          0.055
        )
      );
    }

    if (n >= 6) {
      objects.push(
        stairStep(
          5,
          LEVEL_5,
          6,
          LEVEL_6,
          GREEN,
          false,
          2.7
        ),
        dot(
          pt(6, LEVEL_6),
          GREEN,
          0.055
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function trendNote(value) {
    return tag(
      `TREND: ${fmt(value)} ROOM${value === 1 ? '' : 'S'}/WEEK`,
      VIOLET,
      [
        (X(1) + X(4)) / 2,
        AY0 + 0.44,
        0
      ],
      14
    );
  }

  // ------------------------------------------------------------
  // Expected count before an update.
  //
  // Expected = previous level + previous trend.
  // Draw the next step in dashed amber.
  // ------------------------------------------------------------

  function expectedPicture(
    week,
    oldLevel,
    trend
  ) {
    const expected = oldLevel + trend;
    const p = pt(week, expected);

    return new M.VGroup(
      stairStep(
        week - 1,
        oldLevel,
        week,
        expected,
        AMBER,
        true
      ),
      ring(p, AMBER, 0.19),
      dot(p, AMBER, 0.046)
    );
  }

  function expectedLabel(
    week,
    value
  ) {
    return tag(
      'EXPECT ' + fmt(value),
      AMBER,
      [
        X(week),
        Y(value) - 1.02,
        0
      ],
      13
    );
  }

  function drawExpected(
    week,
    oldLevel,
    trend
  ) {
    const value = oldLevel + trend;

    return [
      ...remove(
        'hidden',
        'error',
        'halfway',
        'rise',
        'focus',
        'markerLabel'
      ),
      ...put(
        'hidden',
        hiddenWeeks(week + 1)
      ),
      ...put(
        'expected',
        expectedPicture(
          week,
          oldLevel,
          trend
        )
      ),
      ...put(
        'expectedLabel',
        expectedLabel(
          week,
          value
        )
      ),
      ...moveMarker(
        week,
        value,
        0.85
      ),
      ...put(
        'legend',
        legend(true, true)
      )
    ];
  }

  // ------------------------------------------------------------
  // Gap and adjustment visuals.
  //
  // Amber: error before the update.
  // Green: halfway adjustment.
  // Red: remaining forecast error, where relevant.
  // ------------------------------------------------------------

  function verticalGap(
    week,
    lowValue,
    highValue,
    color = AMBER,
    side = 1,
    label = null
  ) {
    const x =
      X(week) + side * 0.20;

    const y1 = Y(lowValue);
    const y2 = Y(highValue);

    const low = Math.min(y1, y2);
    const high = Math.max(y1, y2);

    const gap =
      Math.abs(highValue - lowValue);

    if (gap < 0.001) {
      return tag(
        label || '0 GAP',
        color,
        [
          X(week),
          Y(highValue) + 0.54,
          0
        ],
        13
      );
    }

    return new M.VGroup(
      ln(
        [x, low, 0],
        [x, high, 0],
        color,
        3
      ),
      ln(
        [x - 0.06, low, 0],
        [x + 0.06, low, 0],
        color,
        2
      ),
      ln(
        [x - 0.06, high, 0],
        [x + 0.06, high, 0],
        color,
        2
      ),
      txt(
        label === null
          ? fmt(gap)
          : label,
        14,
        color,
        [
          x + side * 0.19,
          (low + high) / 2,
          0
        ],
        true
      )
    );
  }

  function halfwayPicture(
    week,
    expected,
    actual,
    updated
  ) {
    const x = X(week) - 0.25;

    const start = [
      x,
      Y(expected),
      0
    ];

    const middle = [
      x,
      Y(updated),
      0
    ];

    const end = [
      x,
      Y(actual),
      0
    ];

    return new M.VGroup(
      arrow(
        start,
        middle,
        GREEN,
        3.5
      ),
      dash(
        middle,
        end,
        AMBER
      ),
      ln(
        [
          x - 0.085,
          Y(updated),
          0
        ],
        [
          x + 0.085,
          Y(updated),
          0
        ],
        GREEN,
        2
      )
    );
  }

  function levelRisePicture(
    fromWeek,
    oldLevel,
    toWeek,
    newLevel
  ) {
    const x = X(toWeek) - 0.26;

    const low = Y(oldLevel);
    const high = Y(newLevel);

    const objects = [
      dash(
        pt(fromWeek, oldLevel),
        [x, low, 0],
        GREEN
      ),
      arrow(
        [x, low, 0],
        [x, high, 0],
        VIOLET,
        3.2
      ),
      tag(
        signed(newLevel - oldLevel),
        VIOLET,
        [
          x - 0.50,
          Math.min(low, high) - 0.30,
          0
        ],
        13
      )
    ];

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Magnified level-update picture.
  //
  // Values 25, 27 and 29 are shown on a local scale.
  // This makes the halfway adjustment easy to see.
  // The vertical scale is explicitly a room-count scale.
  // ------------------------------------------------------------

  function updatePicture(stage = 0) {
    const objects = [];

    const base = P ? -3.05 : -2.15;
    const height = P ? 3.75 : 2.85;

    const x = CX - 1.35;

    const yy = v =>
      base + (v - 24) / 6 * height;

    objects.push(
      txt(
        'UPDATE THE LEVEL',
        20,
        GREEN,
        [
          CX,
          P ? 1.10 : 1.30,
          0
        ]
      ),
      ln(
        [x, yy(24), 0],
        [x, yy(30), 0],
        C.muted,
        2
      )
    );

    for (let v = 24; v <= 30; v++) {
      objects.push(
        ln(
          [x - 0.08, yy(v), 0],
          [x + 0.08, yy(v), 0],
          C.muted,
          1.4
        ),
        txt(
          String(v),
          16,
          C.muted,
          [x - 0.35, yy(v), 0],
          true
        )
      );
    }

    objects.push(
      ring(
        [x, yy(EXPECTED_6), 0],
        AMBER,
        0.14
      ),
      txt(
        'expected 25',
        16,
        AMBER,
        [CX + 0.23, yy(EXPECTED_6), 0]
      ),
      glowingDot(
        [x, yy(DATA[5]), 0],
        CYAN,
        0.11,
        0.18
      ),
      txt(
        'actual 29',
        16,
        CYAN,
        [CX + 0.23, yy(DATA[5]), 0]
      )
    );

    const gx = CX + 1.72;

    objects.push(
      ln(
        [gx, yy(EXPECTED_6), 0],
        [gx, yy(DATA[5]), 0],
        AMBER,
        3
      ),
      ln(
        [gx - 0.10, yy(EXPECTED_6), 0],
        [gx + 0.10, yy(EXPECTED_6), 0],
        AMBER,
        2
      ),
      ln(
        [gx - 0.10, yy(DATA[5]), 0],
        [gx + 0.10, yy(DATA[5]), 0],
        AMBER,
        2
      ),
      tag(
        '4 ROOMS',
        AMBER,
        [
          gx + 0.62,
          (yy(EXPECTED_6) + yy(DATA[5])) / 2,
          0
        ],
        13
      )
    );

    if (stage >= 1) {
      objects.push(
        arrow(
          [x - 0.65, yy(EXPECTED_6), 0],
          [x - 0.65, yy(LEVEL_6), 0],
          GREEN,
          4
        ),
        diamondAt(
          [x, yy(LEVEL_6), 0],
          GREEN,
          0.17
        ),
        txt(
          'new level 27',
          16,
          GREEN,
          [CX + 0.30, yy(LEVEL_6), 0]
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        tag(
          '+2 MOVED',
          GREEN,
          [
            CX - 1.70,
            (yy(EXPECTED_6) + yy(LEVEL_6)) / 2,
            0
          ],
          13
        ),
        dash(
          [x, yy(LEVEL_6), 0],
          [gx, yy(LEVEL_6), 0],
          GREEN
        )
      );
    }

    if (stage >= 3) {
      objects.push(
        tag(
          '2 REMAIN',
          VIOLET,
          [
            CX + 0.65,
            (yy(LEVEL_6) + yy(DATA[5])) / 2,
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Trend update number line.
  //
  // Old trend = 1 room per week.
  // Latest rise in level = 3 rooms per week.
  //
  // Adjust halfway:
  // 1 + 0.5 × (3 - 1) = 2.
  //
  // The line represents changes in rooms per week,
  // not occupied-room counts.
  // ------------------------------------------------------------

  const TL0 = CX - 2.60;
  const TL1 = CX + 2.60;

  const TLY = P ? -1.25 : -0.55;

  const trendX = value =>
    TL0 + value / 4 * (TL1 - TL0);

  function trendLine() {
    const objects = [
      txt(
        'UPDATE THE TREND',
        20,
        VIOLET,
        [
          CX,
          P ? 1.05 : 1.25,
          0
        ]
      ),
      ln(
        [TL0, TLY, 0],
        [TL1, TLY, 0],
        C.muted,
        2.5
      )
    ];

    for (let v = 0; v <= 4; v++) {
      objects.push(
        ln(
          [trendX(v), TLY - 0.075, 0],
          [trendX(v), TLY + 0.075, 0],
          C.muted,
          1.4
        ),
        txt(
          String(v),
          17,
          C.muted,
          [
            trendX(v),
            TLY - 0.32,
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms per week',
        15,
        C.muted,
        [
          CX,
          TLY - 0.79,
          0
        ]
      ),
      glowingDot(
        [trendX(TREND_5), TLY, 0],
        VIOLET,
        0.13,
        0.18
      ),
      glowingDot(
        [trendX(RISE_6), TLY, 0],
        CYAN,
        0.13,
        0.18
      ),
      tag(
        'OLD TREND',
        VIOLET,
        [
          trendX(TREND_5),
          TLY + 0.60,
          0
        ],
        14
      ),
      tag(
        'LATEST RISE',
        CYAN,
        [
          trendX(RISE_6),
          TLY + 0.60,
          0
        ],
        14
      ),
      dash(
        [
          trendX(TREND_5),
          TLY + 0.22,
          0
        ],
        [
          trendX(RISE_6),
          TLY + 0.22,
          0
        ],
        C.muted
      )
    );

    return new M.VGroup(...objects);
  }

  function trendMidpoint() {
    const x = trendX(TREND_6);

    return new M.VGroup(
      ring(
        [x, TLY, 0],
        GREEN,
        0.18
      ),
      dash(
        [x, TLY + 0.17, 0],
        [x, TLY + 0.91, 0],
        GREEN
      ),
      tag(
        'HALFWAY',
        GREEN,
        [
          x,
          TLY + 1.10,
          0
        ],
        14
      ),
      ln(
        [
          trendX(TREND_5),
          TLY - 0.60,
          0
        ],
        [
          trendX(TREND_6),
          TLY - 0.60,
          0
        ],
        GREEN,
        2.7
      ),
      ln(
        [
          trendX(TREND_6),
          TLY - 0.60,
          0
        ],
        [
          trendX(RISE_6),
          TLY - 0.60,
          0
        ],
        GREEN,
        2.7
      )
    );
  }

  function trendMoveArrow() {
    return arrow(
      [
        trendX(TREND_5) + 0.13,
        TLY + 0.29,
        0
      ],
      [
        trendX(TREND_6) - 0.05,
        TLY + 0.29,
        0
      ],
      VIOLET,
      3.8
    );
  }

  function trendResult() {
    return new M.VGroup(
      glowingDot(
        [
          trendX(TREND_6),
          TLY,
          0
        ],
        GREEN,
        0.14,
        0.19
      ),
      tag(
        'NEW TREND = 2',
        GREEN,
        [
          CX,
          TLY - 1.32,
          0
        ],
        16
      )
    );
  }

  // ------------------------------------------------------------
  // Final holiday forecasts.
  //
  // Week 6 level = 27.
  // Trend = +2 rooms per week.
  //
  // One step reaches 29 for Christmas.
  // Two steps reach 31 for New Year.
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
        0.05
      )
    );
  }

  function forecastStep(
    fromWeek,
    fromValue,
    toWeek,
    toValue
  ) {
    return new M.VGroup(
      stairStep(
        fromWeek,
        fromValue,
        toWeek,
        toValue,
        AMBER,
        true
      ),
      forecastPoint(
        toWeek,
        toValue
      ),
      dash(
        [X(toWeek), AY0 + 0.04, 0],
        [X(toWeek), Y(toValue) - 0.17, 0],
        AMBER
      )
    );
  }

  function forecastLabel(
    week,
    value
  ) {
    return tag(
      fmt(value),
      AMBER,
      [
        X(week),
        Y(value) - 0.35,
        0
      ],
      15
    );
  }

  function actualPicture(week) {
    const value = DATA[week - 1];

    return new M.VGroup(
      ln(
        pt(week - 1, DATA[week - 2]),
        pt(week, value),
        WHITE,
        2.2
      ),
      glowingDot(
        pt(week, value),
        WHITE,
        0.105,
        0.22
      ),
      txt(
        String(value),
        17,
        WHITE,
        [
          X(week),
          Y(value) + 0.27,
          0
        ],
        true
      )
    );
  }

  function forecastError(
    week,
    forecast,
    actual,
    side = 1
  ) {
    return verticalGap(
      week,
      forecast,
      actual,
      RED,
      side,
      fmt(actual - forecast)
    );
  }

  function finalChart() {
    return [
      ...drawChart(6, true),
      ...put(
        'levelTrail',
        levelTrail(6)
      ),
      ...put(
        'marker',
        levelMarker(6, LEVEL_6)
      ),
      ...put(
        'markerLabel',
        levelLabel(6, LEVEL_6)
      ),
      ...put(
        'trendNote',
        trendNote(TREND_6)
      )
    ];
  }

  // ============================================================
  // 0–3: the forecasting problem.
  // ============================================================

  // 0. The hotel needs staffing guesses for both holidays.

  await until(S(0));
  await play(
    ...put(
      'intro',
      new M.VGroup(
        tag(
          'HOLIDAY STAFFING',
          AMBER,
          [CX, 0.65, 0],
          25
        ),
        tag(
          'CHRISTMAS: ?',
          AMBER,
          [CX, -0.15, 0],
          21
        ),
        tag(
          'NEW YEAR: ?',
          AMBER,
          [CX, -0.85, 0],
          21
        )
      )
    ),
    ...say('TWO HOLIDAYS, TWO FORECASTS', AMBER),
    ...fbox([
      ['HOTEL', CYAN],
      '40 rooms available',
      'end of week 6',
      '',
      ['Christmas: ?', AMBER],
      ['New Year:  ?', AMBER]
    ], AMBER)
  );

  // 1. A flat forecast cannot represent a rising trend.
  //
  // Recall the previous lesson's level of 26.

  await until(S(1));
  await play(
    ...drawChart(6),
    ...put(
      'forecastFocus',
      new M.VGroup(
        dash(
          pt(6, 26),
          pt(8, 26),
          AMBER
        ),
        forecastPoint(7, 26),
        forecastPoint(8, 26),
        forecastLabel(8, 26)
      )
    ),
    ...put(
      'legend',
      legend(false, true)
    ),
    ...say('A FLAT FORECAST CANNOT SHOW THE RISE', AMBER),
    ...fbox([
      ['PREVIOUS METHOD', AMBER],
      'last level = 26',
      'flat forecast',
      '',
      'what if the hotel',
      'keeps getting busier?'
    ], AMBER)
  );

  // 2. Show the first four cyan dots.

  await until(S(2));
  await play(
    ...drawChart(4),
    ...say('START WITH THE FIRST FOUR WEEKS'),
    ...fbox([
      ['WEEKS 1–4', CYAN],
      '20, 24, 20, 23',
      '',
      'start with these counts'
    ])
  );

  // 3. Cover all later counts while replaying
  // the earlier forecasts.

  await until(S(3));
  await play(
    ...put(
      'hidden',
      hiddenWeeks(5)
    ),
    ...say('REPLAY THE VIEW FROM WEEK 4', VIOLET),
    ...fbox([
      ['KNOWN', CYAN],
      'weeks 1–4',
      '',
      ['HIDDEN', AMBER],
      'weeks 5–8'
    ], VIOLET)
  );

  // ============================================================
  // 4–9: introduce level and trend using a staircase.
  // ============================================================

  // 4. Imagine a marker on a staircase.

  await until(S(4));
  await play(
    ...clearChart(),
    ...put(
      'concept',
      conceptStaircase(0)
    ),
    ...say('IMAGINE A MARKER ON A STAIRCASE', VIOLET),
    ...fbox([
      'a running marker',
      'on a staircase',
      '',
      'height and step size'
    ], VIOLET)
  );

  // 5. Its height shows where the hotel stands now.

  await until(S(5));
  await play(
    ...put(
      'concept',
      conceptStaircase(1)
    ),
    ...say('THE MARKER’S HEIGHT SHOWS WHERE WE STAND', GREEN),
    ...fbox([
      ['marker height', GREEN],
      '',
      'current estimate',
      'of occupied rooms'
    ], GREEN)
  );

  // 6. Name the running level.

  await until(S(6));
  await play(
    ...say('LEVEL = THE RUNNING ESTIMATE OF ROOMS', GREEN),
    ...fbox([
      ['LEVEL', GREEN],
      '',
      'our current estimate',
      'of the room count',
      '',
      'the marker’s height'
    ], GREEN)
  );

  // 7. Each stair shows a one-week change.

  await until(S(7));
  await play(
    ...put(
      'concept',
      conceptStaircase(2)
    ),
    ...say('EACH STEP = THE ESTIMATED WEEKLY CHANGE', VIOLET),
    ...fbox([
      'one horizontal step',
      '= one week',
      '',
      ['vertical rise', VIOLET],
      '= change in rooms'
    ], VIOLET)
  );

  // 8. Name the trend.

  await until(S(8));
  await play(
    ...say('TREND = THE ESTIMATED CHANGE PER WEEK', VIOLET),
    ...fbox([
      ['TREND', VIOLET],
      '',
      'how much the estimate',
      'rises or falls',
      'in one week'
    ], VIOLET)
  );

  // 9. Keeping both a level and a trend
  // is called Holt's method.

  await until(S(9));
  await play(
    ...put(
      'concept',
      conceptStaircase(3)
    ),
    ...say('HOLT’S METHOD = LEVEL + TREND', CYAN),
    ...fbox([
      ['HOLT’S METHOD', CYAN],
      '',
      ['level = height', GREEN],
      ['trend = step size', VIOLET],
      '',
      'update both over time'
    ])
  );

  // ============================================================
  // 10–16: initialize the staircase.
  //
  // First count = 20.
  // Fourth count = 23.
  // Rise = 3 rooms across 3 intervals.
  // Starting trend = 1 room per week.
  // Starting level = 23.
  // ============================================================

  // 10. Build the staircase using the first four weeks.

  await until(S(10));
  await play(
    ...drawChart(4),
    ...put(
      'hidden',
      hiddenWeeks(5)
    ),
    ...say('BUILD THE STARTING STAIRCASE', VIOLET),
    ...fbox([
      ['FIRST FOUR WEEKS', CYAN],
      '20, 24, 20, 23',
      '',
      'find a starting level',
      'and starting trend'
    ], VIOLET)
  );

  // 11. Week one had twenty rooms.

  await until(S(11));
  await play(
    ...put(
      'focus',
      focusDot(1, CYAN)
    ),
    ...say('WEEK 1: 20 ROOMS'),
    ...fbox([
      'first count',
      ['week 1 = 20', CYAN]
    ])
  );

  // 12. Week four had twenty-three rooms.

  await until(S(12));
  await play(
    ...put(
      'focus',
      new M.VGroup(
        focusDot(1, CYAN),
        focusDot(4, GREEN)
      )
    ),
    ...say('WEEK 4: 23 ROOMS', GREEN),
    ...fbox([
      'week 1 = 20',
      ['week 4 = 23', GREEN]
    ], GREEN)
  );

  // 13. Three spaces between the first and fourth weeks.

  await until(S(13));
  await play(
    ...put(
      'intervals',
      intervalPicture()
    ),
    ...say('THREE SPACES BETWEEN FOUR WEEKLY DOTS', VIOLET),
    ...fbox([
      'week 1 → week 2',
      'week 2 → week 3',
      'week 3 → week 4',
      '',
      ['3 intervals', VIOLET]
    ], VIOLET)
  );

  // 14. The overall rise is three rooms.

  await until(S(14));
  await play(
    ...put(
      'initialRise',
      initialRisePicture()
    ),
    ...say('OVER THOSE 3 SPACES, THE COUNT ROSE BY 3', VIOLET),
    ...fbox([
      'first count = 20',
      'last count  = 23',
      '',
      ['23 − 20 = 3', VIOLET],
      'total rise'
    ], VIOLET)
  );

  // 15. Share the rise equally across the three intervals.

  await until(S(15));
  await play(
    ...remove(
      'focus',
      'initialRise'
    ),
    ...put(
      'initialSteps',
      initialStairs()
    ),
    ...say('SHARE THE RISE: ONE ROOM PER WEEK', VIOLET),
    ...fbox([
      'total rise = 3',
      'week intervals = 3',
      '',
      ['3 ÷ 3 = 1', VIOLET],
      ['starting trend = +1', VIOLET]
    ], VIOLET)
  );

  // 16. Initialize level = 23 and trend = 1.

  await until(S(16));
  await play(
    ...remove('intervals'),
    ...put(
      'marker',
      levelMarker(
        4,
        INITIAL_LEVEL
      )
    ),
    ...put(
      'markerLabel',
      levelLabel(
        4,
        INITIAL_LEVEL
      )
    ),
    ...put(
      'levelTrail',
      levelTrail(4)
    ),
    ...put(
      'trendNote',
      trendNote(INITIAL_TREND)
    ),
    ...put(
      'legend',
      legend(true)
    ),
    ...say('START: LEVEL 23, TREND 1', GREEN),
    ...fbox([
      ['AT WEEK 4', CYAN],
      '',
      ['level = 23 rooms', GREEN],
      ['trend = +1 room/week', VIOLET],
      '',
      'ready for week 5'
    ], GREEN)
  );

  // ============================================================
  // 17–22: first Holt update.
  //
  // Expected week 5 = 23 + 1 = 24.
  // Actual = 24.
  // Error = 0.
  // New level = 24.
  // Latest level rise = 1.
  // New trend = 1.
  // ============================================================

  // 17. Step forward once to expect twenty-four.

  await until(S(17));
  await play(
    ...drawExpected(
      5,
      INITIAL_LEVEL,
      INITIAL_TREND
    ),
    ...say('ONE STEP FORWARD: EXPECT 24', AMBER),
    ...fbox([
      ['previous level = 23', GREEN],
      ['trend = +1', VIOLET],
      '',
      ['23 + 1 = 24', AMBER],
      ['expected week 5', AMBER]
    ], AMBER)
  );

  // 18. Week five arrives at twenty-four.

  await until(S(18));
  await play(
    ...revealWeek(5),
    ...say('WEEK 5 ACTUAL: 24 ROOMS'),
    ...fbox([
      ['expected = 24', AMBER],
      ['actual   = 24', CYAN],
      '',
      'the two points match'
    ])
  );

  // 19. The forecast error is zero.

  await until(S(19));
  await play(
    ...put(
      'error',
      verticalGap(
        5,
        EXPECTED_5,
        DATA[4],
        GREEN,
        1,
        'ZERO GAP'
      )
    ),
    ...say('24 − 24 = ZERO ERROR', GREEN),
    ...fbox([
      'error = actual − expected',
      '',
      '24 − 24',
      ['= 0', GREEN]
    ], GREEN)
  );

  // 20. Keep the expected level of twenty-four.

  await until(S(20));
  await play(
    ...remove(
      'expected',
      'expectedLabel',
      'error'
    ),
    ...put(
      'levelTrail',
      levelTrail(5)
    ),
    ...put(
      'markerLabel',
      levelLabel(
        5,
        LEVEL_5
      )
    ),
    ...put(
      'legend',
      legend(true)
    ),
    ...say('NO GAP TO ADJUST: KEEP LEVEL 24', GREEN),
    ...fbox([
      'expected = 24',
      'half the error = 0',
      '',
      ['new level = 24', GREEN]
    ], GREEN)
  );

  // 21. The level rose by one room.

  await until(S(21));
  await play(
    ...put(
      'rise',
      levelRisePicture(
        4,
        INITIAL_LEVEL,
        5,
        LEVEL_5
      )
    ),
    ...say('THE LEVEL ROSE FROM 23 TO 24', VIOLET),
    ...fbox([
      ['old level = 23', GREEN],
      ['new level = 24', GREEN],
      '',
      ['24 − 23 = 1', VIOLET],
      'latest rise in level'
    ], VIOLET)
  );

  // 22. Old trend 1 and latest rise 1
  // give a new trend of 1.

  await until(S(22));
  await play(
    ...remove('rise'),
    new M.Indicate(
      visible.trendNote,
      { color: VIOLET }
    ),
    ...say('OLD TREND 1, NEW RISE 1: KEEP TREND 1', VIOLET),
    ...fbox([
      ['old trend = 1', VIOLET],
      ['latest rise = 1', GREEN],
      '',
      'halfway between them:',
      ['new trend = 1', VIOLET]
    ], VIOLET)
  );

  // ============================================================
  // 23–28: second Holt level update.
  //
  // Expected week 6 = 24 + 1 = 25.
  // Actual = 29.
  // Error = 4.
  //
  // New level = 25 + half of 4 = 27.
  // Remaining gap = 2.
  // ============================================================

  // 23. Step forward to expect twenty-five.

  await until(S(23));
  await play(
    ...remove('initialSteps'),
    ...drawExpected(
      6,
      LEVEL_5,
      TREND_5
    ),
    ...say('ONE MORE STEP: EXPECT 25', AMBER),
    ...fbox([
      ['previous level = 24', GREEN],
      ['trend = +1', VIOLET],
      '',
      ['24 + 1 = 25', AMBER],
      ['expected week 6', AMBER]
    ], AMBER)
  );

  // 24. Week six actually has twenty-nine rooms.

  await until(S(24));
  await play(
    ...revealWeek(6),
    ...say('WEEK 6 ACTUAL: 29 ROOMS'),
    ...fbox([
      ['expected = 25', AMBER],
      ['actual   = 29', CYAN],
      '',
      'the new dot is higher'
    ])
  );

  // 25. The forecast was four rooms low.

  await until(S(25));
  await play(
    ...put(
      'error',
      verticalGap(
        6,
        EXPECTED_6,
        DATA[5],
        AMBER
      )
    ),
    ...say('THE GUESS WAS 4 ROOMS LOW', AMBER),
    ...fbox([
      'actual − expected',
      ['29 − 25 = 4', AMBER]
    ], AMBER)
  );

  // 26. Move the new level halfway between 25 and 29.
  //
  // First show the actual marker move on the hotel graph,
  // then magnify the local adjustment.

  await until(S(26));
  await play(
    ...remove(
      'error',
      'expectedLabel'
    ),
    ...put(
      'halfway',
      halfwayPicture(
        6,
        EXPECTED_6,
        DATA[5],
        LEVEL_6
      )
    ),
    ...moveMarker(
      6,
      LEVEL_6,
      0.95
    ),
    ...say('MOVE HALFWAY FROM 25 TOWARD 29', GREEN),
    ...fbox([
      'expected = 25',
      'gap = +4',
      ['half the gap = +2', GREEN],
      '',
      '25 + 2'
    ], GREEN)
  );

  await until(S(26) + 1.50);

  await play(
    ...clearChart(),
    ...put(
      'updatePicture',
      updatePicture(1)
    )
  );

  // 27. The new level is twenty-seven.

  await until(S(27));
  await play(
    ...put(
      'updatePicture',
      updatePicture(2)
    ),
    ...say('NEW LEVEL = 27 ROOMS', GREEN),
    ...fbox([
      '25 + ½ × 4',
      ['= 27', GREEN],
      ['new level', GREEN]
    ], GREEN)
  );

  // 28. The remaining gap is two rooms.

  await until(S(28));
  await play(
    ...put(
      'updatePicture',
      updatePicture(3)
    ),
    ...say('THE LEVEL IS STILL 2 ROOMS BELOW THE DOT', GREEN),
    ...fbox([
      ['actual = 29', CYAN],
      ['new level = 27', GREEN],
      '',
      '29 − 27 = 2',
      'half the gap remains'
    ], GREEN)
  );

  // ============================================================
  // 29–33: update the trend.
  //
  // Previous level = 24.
  // New level = 27.
  // Latest rise = 3.
  //
  // Old trend = 1.
  // Halfway between 1 and 3 = 2.
  // New trend = 2 rooms per week.
  // ============================================================

  // 29. Compare the new level with the last level of 24.
  //
  // Use the completed levels, not the two observed counts
  // and not the difference from the expected count.

  await until(S(29));
  await play(
    ...drawChart(6, true),
    ...put(
      'hidden',
      hiddenWeeks(7)
    ),
    ...put(
      'levelTrail',
      levelTrail(6)
    ),
    ...put(
      'marker',
      levelMarker(6, LEVEL_6)
    ),
    ...put(
      'markerLabel',
      levelLabel(6, LEVEL_6)
    ),
    ...put(
      'focus',
      new M.VGroup(
        ring(
          pt(5, LEVEL_5),
          GREEN,
          0.17
        ),
        tag(
          '24',
          GREEN,
          [
            X(5),
            Y(LEVEL_5) - 0.36,
            0
          ],
          14
        )
      )
    ),
    ...say('COMPARE THE NEW LEVEL WITH THE LAST LEVEL', GREEN),
    ...fbox([
      ['week 5 level = 24', GREEN],
      ['week 6 level = 27', GREEN],
      '',
      'compare the levels,',
      'not the original dots'
    ], GREEN)
  );

  // 30. The level rose by three rooms.

  await until(S(30));
  await play(
    ...put(
      'rise',
      levelRisePicture(
        5,
        LEVEL_5,
        6,
        LEVEL_6
      )
    ),
    ...say('27 − 24 = A RISE OF 3 ROOMS', VIOLET),
    ...fbox([
      'new level = 27',
      'old level = 24',
      '',
      ['latest rise = 3', VIOLET]
    ], VIOLET)
  );

  // 31. Put the old trend and latest rise
  // on a number line.

  await until(S(31));
  await play(
    ...clearChart(),
    ...put(
      'trendLine',
      trendLine()
    ),
    ...say('OLD TREND 1, LATEST RISE 3', VIOLET),
    ...fbox([
      ['old trend = 1', VIOLET],
      ['latest rise = 3', CYAN],
      '',
      'adjust the old trend',
      'toward the latest rise'
    ], VIOLET)
  );

  // 32. Mark the halfway point.

  await until(S(32));
  await play(
    ...put(
      'trendMidpoint',
      trendMidpoint()
    ),
    ...say('FIND THE POINT HALFWAY BETWEEN 1 AND 3', GREEN),
    ...fbox([
      'gap = 3 − 1',
      'gap = 2',
      ['half the gap = 1', GREEN]
    ], GREEN)
  );

  // 33. The new trend is two rooms per week.

  await until(S(33));
  await play(
    ...put(
      'trendMove',
      trendMoveArrow()
    ),
    ...put(
      'trendResult',
      trendResult()
    ),
    ...say('NEW TREND = 2 ROOMS PER WEEK', VIOLET),
    ...fbox([
      'old trend = 1',
      'half the gap = 1',
      '',
      ['1 + 1 = 2', VIOLET],
      ['2 rooms per week', VIOLET]
    ], VIOLET)
  );

  // ============================================================
  // 34–36: state the two update rules.
  //
  // Level:
  // expected + half the gap to the actual count.
  //
  // Trend:
  // old trend + half the gap to the latest rise in level.
  // ============================================================

  // 34. The level update formula.

  await until(S(34));
  await play(
    ...clearPictures(),
    ...put(
      'updatePicture',
      updatePicture(3)
    ),
    ...say('LEVEL: ADJUST HALFWAY TOWARD THE REAL COUNT', GREEN),
    ...fbox([
      ['NEW LEVEL =', GREEN],
      '  expected count',
      '  + half ×',
      '    (real − expected)',
      '',
      ['25 + ½ × (29 − 25)', AMBER],
      ['= 27', GREEN]
    ], GREEN)
  );

  // 35. The trend update formula.

  await until(S(35));
  await play(
    ...clearPictures(),
    ...put(
      'trendLine',
      trendLine()
    ),
    ...put(
      'trendMidpoint',
      trendMidpoint()
    ),
    ...put(
      'trendResult',
      trendResult()
    ),
    ...say('TREND: ADJUST HALFWAY TOWARD THE LATEST RISE', VIOLET),
    ...fbox([
      ['NEW TREND =', VIOLET],
      '  old trend',
      '  + half ×',
      '    (rise − old trend)',
      '',
      ['1 + ½ × (3 − 1)', CYAN],
      ['= 2', VIOLET]
    ], VIOLET)
  );

  // 36. Both quantities adjust partway.

  await until(S(36));
  await play(
    ...clearPictures(),
    ...put(
      'concept',
      conceptStaircase(3)
    ),
    ...say('TWO HALFWAY UPDATES: LEVEL AND TREND', CYAN),
    ...fbox([
      ['AFTER WEEK 6', CYAN],
      '',
      ['level = 27', GREEN],
      ['trend = +2', VIOLET],
      '',
      'both adjust gradually'
    ])
  );

  // ============================================================
  // 37–39: make the holiday forecasts.
  //
  // Starting level = 27.
  // Trend = 2.
  //
  // Christmas: 27 + 2 = 29.
  // New Year: 27 + 2 + 2 = 31.
  // ============================================================

  // 37. One step forward reaches twenty-nine.

  await until(S(37));
  await play(
    ...finalChart(),
    ...put(
      'forecast7',
      forecastStep(
        6,
        LEVEL_6,
        7,
        FORECAST_7
      )
    ),
    ...put(
      'forecastLabel7',
      forecastLabel(
        7,
        FORECAST_7
      )
    ),
    ...say('ONE STEP: CHRISTMAS FORECAST = 29', AMBER),
    ...fbox([
      ['level = 27', GREEN],
      ['trend = +2', VIOLET],
      '',
      ['27 + 2 = 29', AMBER],
      ['Christmas forecast', AMBER]
    ], AMBER)
  );

  // 38. Take a second equal step to thirty-one.

  await until(S(38));
  await play(
    ...put(
      'forecast8',
      forecastStep(
        7,
        FORECAST_7,
        8,
        FORECAST_8
      )
    ),
    ...put(
      'forecastLabel8',
      forecastLabel(
        8,
        FORECAST_8
      )
    ),
    ...put(
      'legend',
      legend(true, true)
    ),
    ...say('TWO STEPS: NEW YEAR FORECAST = 31', AMBER),
    ...fbox([
      ['start at 27', GREEN],
      ['add 2 each week', VIOLET],
      '',
      ['27 + 2 + 2 = 31', AMBER],
      ['New Year forecast', AMBER]
    ], AMBER)
  );

  // 39. Forecast formula in words.

  await until(S(39));
  await play(
    ...say('FORECAST = LEVEL + TREND × WEEKS AHEAD', AMBER),
    ...fbox([
      ['FORECAST =', AMBER],
      ['  level', GREEN],
      ['  + trend', VIOLET],
      '    × weeks ahead',
      '',
      ['1 week:  27 + 2 = 29', AMBER],
      ['2 weeks: 27 + 4 = 31', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 40–43: reveal the actual holiday counts.
  //
  // Christmas actual = 35.
  // Forecast = 29.
  // Error = 6.
  //
  // New Year actual = 33.
  // Forecast = 31.
  // Error = 2.
  //
  // These are both comparisons against the original
  // forecasts made at the end of week six.
  // ============================================================

  // 40. Only now reveal the real Christmas count.

  await until(S(40));
  await play(
    ...put(
      'actual7',
      actualPicture(7)
    ),
    ...put(
      'legend',
      legend(
        true,
        true,
        true
      )
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['CHRISTMAS', WHITE],
      '',
      ['forecast = 29', AMBER],
      ['actual   = 35', WHITE]
    ])
  );

  // 41. Christmas error = six rooms.

  await until(S(41));
  await play(
    ...put(
      'error7',
      forecastError(
        7,
        FORECAST_7,
        DATA[6],
        -1
      )
    ),
    ...say('CHRISTMAS FORECAST WAS 6 ROOMS LOW', RED),
    ...fbox([
      'error = actual − forecast',
      '',
      ['35 − 29 = 6', RED],
      ['6 rooms too low', RED]
    ], RED)
  );

  // 42. Only now reveal the real New Year count.

  await until(S(42));
  await play(
    ...put(
      'actual8',
      actualPicture(8)
    ),
    ...say('NEW YEAR ACTUAL: 33 ROOMS', WHITE),
    ...fbox([
      ['NEW YEAR', WHITE],
      '',
      ['forecast = 31', AMBER],
      ['actual   = 33', WHITE],
      '',
      'original week 6 forecast'
    ])
  );

  // 43. New Year error = two rooms.

  await until(S(43));
  await play(
    ...put(
      'error8',
      forecastError(
        8,
        FORECAST_8,
        DATA[7],
        1
      )
    ),
    ...say('NEW YEAR FORECAST WAS 2 ROOMS LOW', RED),
    ...fbox([
      ['CHRISTMAS', WHITE],
      ['35 − 29 = 6 low', RED],
      '',
      ['NEW YEAR', WHITE],
      ['33 − 31 = 2 low', RED]
    ], RED)
  );

  // ============================================================
  // 44–46: when to use Holt's method, its limitation,
  // and the final recap.
  // ============================================================

  // 44. Use Holt's method for a steadily rising
  // or falling room count.

  await until(S(44));
  await play(
    ...remove(
      'error7',
      'error8'
    ),
    ...say('USE WHEN COUNTS TEND TO RISE OR FALL STEADILY', GREEN),
    ...fbox([
      ['USE HOLT’S METHOD', GREEN],
      '',
      'when counts have',
      'a fairly steady direction',
      '',
      ['level: where we are', GREEN],
      ['trend: where we’re going', VIOLET]
    ], GREEN),
    new M.Indicate(
      visible.trendNote,
      { color: VIOLET }
    )
  );

  // 45. The trap: a constant forecast step cannot
  // automatically represent a holiday jump.
  //
  // Draw the original Christmas error again.
  // The trend remains +2 per week, even though the
  // holiday actual is six above the forecast.

  await until(S(45));
  await play(
    ...put(
      'error7',
      forecastError(
        7,
        FORECAST_7,
        DATA[6],
        -1
      )
    ),
    ...put(
      'forecastFocus',
      ring(
        pt(7, DATA[6]),
        RED,
        0.23
      )
    ),
    ...say('TRAP: SAME STEP, EVEN WHEN CHRISTMAS JUMPS', RED),
    ...fbox([
      ['THE TRAP', RED],
      '',
      ['trend = +2 each week', VIOLET],
      'no separate holiday rule',
      '',
      ['Christmas: 6 too low', RED]
    ], RED)
  );

  // 46. Final recap.
  //
  // Holt's method takes one trend step per week
  // from the latest level.
  //
  // It captures a direction, unlike a flat forecast,
  // but does not contain a seasonal component.

  await until(S(46));
  await play(
    ...remove(
      'forecastFocus'
    ),
    ...say('HOLT: ONE TREND STEP PER WEEK FROM THE LEVEL', GREEN),
    ...fbox([
      ['HOLT’S METHOD', CYAN],
      '',
      ['latest level = 27', GREEN],
      ['trend = +2 per week', VIOLET],
      '',
      ['Christmas = 29', AMBER],
      ['New Year  = 31', AMBER]
    ]),
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
        lagRatio: 0.30,
        runTime: 1.65
      }
    )
  );

  await until(S(46) + 2.65);

  await play(
    ...say('UPDATE THE HEIGHT, UPDATE THE STEP, THEN STEP AHEAD', GREEN),
    ...fbox([
      ['HOLT’S METHOD', CYAN],
      '',
      ['level = current height', GREEN],
      ['trend = weekly step', VIOLET],
      '',
      ['forecast =', AMBER],
      'level + trend × weeks ahead'
    ])
  );

  await until(E(46));
}
