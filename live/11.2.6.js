// lesson 11.2.6
// Holt–Winters: level + trend + seasonal extra.
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
  // Last year: 18  21  19  21  22  26  32  30
  //
  // End of week 6:
  // Holt level = 27.
  // Holt trend = 2 rooms per week.
  //
  // Seasonal extras learned from earlier records:
  // Ordinary autumn weeks = 0.
  // Christmas = +4.
  // New Year = +2.
  //
  // Christmas forecast = 27 + 2 + 4 = 33.
  // New Year forecast = 27 + 2 + 2 + 2 = 33.
  //
  // Christmas actual = 35. Error = 2.
  // New Year actual = 33. Error = 0.
  //
  // Update Christmas seasonal extra:
  // New reading = 35 - 29 = 6.
  // Old extra = 4.
  // Seasonal smoothing weight = 1/2.
  // Updated extra = 4 + 0.5 × (6 - 4) = 5.
  //
  // The original New Year forecast remains unchanged
  // when the Christmas observation arrives.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];
  const LAST = [18, 21, 19, 21, 22, 26, 32, 30];

  const LEVEL_4 = 23;
  const TREND_4 = 1;

  const EXPECTED_5 = 24;
  const LEVEL_5 = 24;
  const TREND_5 = 1;

  const EXPECTED_6 = 25;
  const LEVEL_6 = 27;
  const TREND_6 = 2;

  const EXTRA_7 = 4;
  const EXTRA_8 = 2;

  const SEASONAL_WEIGHT = 0.5;

  const BASE_7 = LEVEL_6 + TREND_6;
  const BASE_8 = LEVEL_6 + 2 * TREND_6;

  const FORECAST_7 = BASE_7 + EXTRA_7;
  const FORECAST_8 = BASE_8 + EXTRA_8;

  const CHRISTMAS_READING = DATA[6] - BASE_7;

  const NEW_EXTRA_7 =
    EXTRA_7 +
    SEASONAL_WEIGHT * (CHRISTMAS_READING - EXTRA_7);

  const DESEASONALIZED_7 = DATA[6] - EXTRA_7;

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const PINK = C.pink || '#F28BB9';
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';

  // Colour meanings:
  //
  // Cyan: observed room counts.
  // Green: running level.
  // Violet: trend and underlying staircase.
  // Pink: seasonal extra room blocks.
  // Amber: forecasts.
  // White: newly revealed holiday observations.

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22.
  // Laptop: 14.22 x 8.
  //
  // Keep important content clear of captions and controls.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.60, 0]
    : [4.30, -0.30, 0];

  const AX0 = CX - (P ? 3.08 : 3.12);
  const AX1 = CX + (P ? 3.30 : 3.12);

  const AY0 = P ? -4.12 : -2.12;
  const AY1 = P ? 1.32 : 1.02;

  const DATA_LEFT = AX0 + 0.34;
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
    opacity = 0.80,
    strokeWidth = 1.2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth
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
      0.15,
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
  // Never regroup objects already on screen.
  // All groups are assembled before being displayed.
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
  //
  // Same basic construction as the approved lesson.
  // Lines can carry individual colours.
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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.40;

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

    const maxw =
      P ? FW - 1.20 : 4.05;

    const maxh =
      P ? 1.30 : 4.35;

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
      a.push(outA(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [outA(boxNow)];
    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // Hotel chart.
  //
  // Horizontal axis: weeks 1–8.
  // Vertical axis: occupied rooms, 0–40.
  //
  // Do not display this year's holiday observations
  // until the appropriate reveal beats.
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
        [AX0 + 0.32, AY1 + 0.12, 0]
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
    seasonal = false,
    actual = false
  ) {
    const items = [
      ['Count', CYAN, 'solid']
    ];

    if (level) {
      items.push(
        ['Level', GREEN, 'solid']
      );
    }

    if (seasonal) {
      items.push(
        ['Extra', PINK, 'block']
      );
    }

    if (forecast) {
      items.push(
        ['Forecast', AMBER, 'dashed']
      );
    }

    if (actual) {
      items.push(
        ['Actual', WHITE, 'solid']
      );
    }

    const objects = [];

    const spacing =
      items.length >= 5
        ? 1.25
        : items.length === 4
          ? 1.52
          : items.length === 3
            ? 1.95
            : 2.35;

    const y =
      P ? 1.75 : 1.43;

    items.forEach(([name, color, style], i) => {
      const x =
        CX +
        (i - (items.length - 1) / 2) *
        spacing;

      const t = T(
        name,
        items.length >= 5 ? 11 : 13,
        color
      );

      const totalWidth =
        t.getWidth() + 0.38;

      const left =
        x - totalWidth / 2;

      let mark;

      if (style === 'dashed') {
        mark = dash(
          [left, y, 0],
          [left + 0.27, y, 0],
          color
        );
      } else if (style === 'block') {
        mark = rect(
          0.25,
          0.14,
          [left + 0.125, y, 0],
          color,
          0.9
        );
      } else {
        mark = ln(
          [left, y, 0],
          [left + 0.27, y, 0],
          color,
          3
        );
      }

      t.moveTo([
        left + 0.38 + t.getWidth() / 2,
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
              Y(DATA[week - 1]) + 0.24,
              0
            ],
            true
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function nowDivider(week) {
    const x =
      (X(week) + X(week + 1)) / 2;

    return new M.VGroup(
      dash(
        [x, AY0 + 0.04, 0],
        [x, AY1 - 0.06, 0],
        C.muted
      ),
      txt(
        'NOW',
        11,
        C.muted,
        [x, AY1 + 0.12, 0]
      )
    );
  }

  function hiddenWeeks(first) {
    const objects = [];

    for (let week = first; week <= 8; week++) {
      const top = AY1 - 0.12;
      const bottom = AY0 + 0.10;

      const r = new M.RoundedRectangle({
        width: STEP * 0.76,
        height: top - bottom,
        cornerRadius: 0.09,
        color: C.muted,
        strokeWidth: 0.8
      });

      r.setFill(C.card, 0.17);

      r.moveTo([
        X(week),
        (top + bottom) / 2,
        0
      ]);

      objects.push(
        r,
        tag(
          '?',
          C.muted,
          [
            X(week),
            AY0 + 0.40,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Running level marker.
  //
  // A green diamond distinguishes the running level
  // from a filled cyan observation.
  // ------------------------------------------------------------

  function diamond(p, color = GREEN, radius = 0.16) {
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
        2.6
      ),
      ln(
        [x + radius, y, 0],
        [x, y - radius, 0],
        color,
        2.6
      ),
      ln(
        [x, y - radius, 0],
        [x - radius, y, 0],
        color,
        2.6
      ),
      ln(
        [x - radius, y, 0],
        [x, y + radius, 0],
        color,
        2.6
      )
    );
  }

  function levelMarker(week, value) {
    return diamond(
      pt(week, value),
      GREEN
    );
  }

  function levelLabel(week, value) {
    return tag(
      fmt(value),
      GREEN,
      [
        X(week),
        Y(value) - 0.35,
        0
      ],
      14
    );
  }

  function moveLevel(week, value, time = 0.85) {
    const target = levelMarker(
      week,
      value
    );

    if (!visible.levelMarker) {
      return [
        ...put(
          'levelMarker',
          target
        ),
        ...put(
          'levelLabel',
          levelLabel(week, value)
        )
      ];
    }

    return [
      new M.Transform(
        visible.levelMarker,
        target,
        { runTime: time }
      ),
      ...put(
        'levelLabel',
        levelLabel(week, value)
      )
    ];
  }

  function trendNote(value) {
    return tag(
      `TREND: +${fmt(value)} / WEEK`,
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
  // Staircase geometry.
  //
  // A horizontal tread is one week.
  // A vertical riser is the change in rooms.
  // ------------------------------------------------------------

  function stairStep(
    fromWeek,
    fromValue,
    toWeek,
    toValue,
    color = VIOLET,
    dashed = false,
    width = 3
  ) {
    const a = pt(
      fromWeek,
      fromValue
    );

    const corner = [
      X(toWeek),
      Y(fromValue),
      0
    ];

    const b = pt(
      toWeek,
      toValue
    );

    const makeLine = dashed
      ? (p0, p1) =>
          dash(p0, p1, color)
      : (p0, p1) =>
          ln(p0, p1, color, width);

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

  function completedLevelTrail(n) {
    const objects = [
      dot(
        pt(4, LEVEL_4),
        GREEN,
        0.05
      )
    ];

    if (n >= 5) {
      objects.push(
        stairStep(
          4,
          LEVEL_4,
          5,
          LEVEL_5,
          GREEN,
          false,
          2.4
        ),
        dot(
          pt(5, LEVEL_5),
          GREEN,
          0.05
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
          2.4
        ),
        dot(
          pt(6, LEVEL_6),
          GREEN,
          0.05
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function expectedPicture(
    week,
    oldLevel,
    expected
  ) {
    return new M.VGroup(
      stairStep(
        week - 1,
        oldLevel,
        week,
        expected,
        AMBER,
        true
      ),
      ring(
        pt(week, expected),
        AMBER,
        0.18
      ),
      tag(
        'EXPECT ' + fmt(expected),
        AMBER,
        [
          X(week),
          Y(expected) - 1.02,
          0
        ],
        13
      )
    );
  }

  function gapBracket(
    week,
    from,
    to,
    color = AMBER,
    side = 1,
    text = null
  ) {
    const x =
      X(week) + side * 0.22;

    const low = Y(Math.min(from, to));
    const high = Y(Math.max(from, to));

    const gap = Math.abs(to - from);

    if (gap < 0.001) {
      return tag(
        text || 'ZERO GAP',
        color,
        [
          X(week),
          Y(to) + 0.50,
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
        [x - 0.065, low, 0],
        [x + 0.065, low, 0],
        color,
        2
      ),
      ln(
        [x - 0.065, high, 0],
        [x + 0.065, high, 0],
        color,
        2
      ),
      txt(
        text === null ? fmt(gap) : text,
        15,
        color,
        [
          x + side * 0.18,
          (low + high) / 2,
          0
        ],
        true
      )
    );
  }

  function halfwayLevelPicture() {
    const x = X(6) - 0.23;

    return new M.VGroup(
      arrow(
        [x, Y(EXPECTED_6), 0],
        [x, Y(LEVEL_6), 0],
        GREEN,
        3.4
      ),
      dash(
        [x, Y(LEVEL_6), 0],
        [x, Y(DATA[5]), 0],
        AMBER
      ),
      ln(
        [x - 0.07, Y(LEVEL_6), 0],
        [x + 0.07, Y(LEVEL_6), 0],
        GREEN,
        2
      )
    );
  }

  // ------------------------------------------------------------
  // Chart and picture transitions.
  // ------------------------------------------------------------

  function clearChart() {
    return remove(
      'axes',
      'series',
      'legend',
      'now',
      'hidden',
      'levelMarker',
      'levelLabel',
      'levelTrail',
      'trendNote',
      'expected',
      'gap',
      'halfway',
      'base7',
      'base8',
      'baseLabel7',
      'baseLabel8',
      'blocks7',
      'blocks8',
      'extraLabel7',
      'extraLabel8',
      'forecast7',
      'forecast8',
      'forecastLabel7',
      'forecastLabel8',
      'actual7',
      'actual8',
      'error7',
      'error8',
      'parked',
      'reading',
      'chartFocus'
    );
  }

  function clearPictures() {
    return remove(
      'intro',
      'concept',
      'calendar',
      'seasonalDiagram',
      'comparison',
      'updateScale',
      'extraMarker',
      'extraMarkerLabel',
      'extraArrow',
      'extraGap',
      'levelUpdate',
      'trap'
    );
  }

  function drawChart(n, level = false) {
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
        legend(level)
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
        'now',
        nowDivider(week)
      ),
      ...put(
        'hidden',
        hiddenWeeks(week + 1)
      )
    ];
  }

  function finalBaseChart() {
    return [
      ...drawChart(6, true),
      ...put(
        'levelTrail',
        completedLevelTrail(6)
      ),
      ...put(
        'levelMarker',
        levelMarker(6, LEVEL_6)
      ),
      ...put(
        'levelLabel',
        levelLabel(6, LEVEL_6)
      ),
      ...put(
        'trendNote',
        trendNote(TREND_6)
      )
    ];
  }

  // ------------------------------------------------------------
  // Underlying Holt staircase.
  //
  // Start at level 27.
  // Add two rooms per week.
  //
  // These violet steps do not yet include the
  // seasonal extras.
  // ------------------------------------------------------------

  function baseStep(week) {
    const previous =
      week === 7 ? LEVEL_6 : BASE_7;

    const value =
      week === 7 ? BASE_7 : BASE_8;

    const p = pt(week, value);

    const a = stairStep(
      week - 1,
      previous,
      week,
      value,
      VIOLET,
      false,
      3.1
    );

    const riserX = X(week) - 0.14;

    return new M.VGroup(
      a,
      ring(p, VIOLET, 0.11),
      txt(
        '+2',
        13,
        VIOLET,
        [
          riserX,
          Y(previous) - 0.18,
          0
        ],
        true
      )
    );
  }

  function baseLabel(week) {
    const value =
      week === 7 ? BASE_7 : BASE_8;

    return tag(
      fmt(value),
      VIOLET,
      [
        X(week),
        Y(value) - 0.36,
        0
      ],
      14
    );
  }

  function drawBothBaseSteps() {
    return [
      ...put(
        'base7',
        baseStep(7)
      ),
      ...put(
        'base8',
        baseStep(8)
      ),
      ...put(
        'baseLabel7',
        baseLabel(7)
      ),
      ...put(
        'baseLabel8',
        baseLabel(8)
      )
    ];
  }

  // ------------------------------------------------------------
  // Seasonal room blocks on the hotel graph.
  //
  // One block represents one additional room.
  //
  // Each block occupies exactly one room's vertical
  // distance on the 0–40 room axis.
  //
  // Christmas stack: 29 to 33.
  // New Year stack: 31 to 33.
  // ------------------------------------------------------------

  const ROOM_PITCH =
    Y(1) - Y(0);

  const CHART_BLOCK_W =
    Math.min(
      STEP * 0.58,
      0.48
    );

  function chartRoomBlock(
    week,
    base,
    index,
    color = PINK,
    opacity = 0.88
  ) {
    return rect(
      CHART_BLOCK_W,
      ROOM_PITCH * 0.82,
      [
        X(week),
        Y(base + index + 0.5),
        0
      ],
      color,
      opacity,
      1.1
    );
  }

  function chartExtraStack(
    week,
    base,
    count,
    color = PINK
  ) {
    const objects = [];

    for (let j = 0; j < count; j++) {
      objects.push(
        chartRoomBlock(
          week,
          base,
          j,
          color
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // Reveal each room block individually, bottom to top.
  // The tracked group is new and has never been displayed.

  function growChartExtra(
    key,
    week,
    base,
    count
  ) {
    const a = [];

    if (visible[key]) {
      a.push(
        outA(visible[key])
      );
    }

    const group = chartExtraStack(
      week,
      base,
      count
    );

    visible[key] = group;

    a.push(
      new M.FadeIn(group, {
        runTime: 0.75
      })
    );

    return a;
  }

  function extraLabel(week, count) {
    const base =
      week === 7 ? BASE_7 : BASE_8;

    const side =
      week === 7 ? -1 : 1;

    return txt(
      '+' + fmt(count),
      15,
      PINK,
      [
        X(week) + side * 0.42,
        Y(base + count / 2),
        0
      ],
      true
    );
  }

  // ------------------------------------------------------------
  // Forecast points.
  //
  // The forecast sits at the top of the seasonal stack,
  // not on the underlying trend staircase.
  // ------------------------------------------------------------

  function forecastPoint(week, value) {
    const p = pt(week, value);

    return new M.VGroup(
      ring(
        p,
        AMBER,
        0.15
      ),
      dot(
        p,
        AMBER,
        0.052
      )
    );
  }

  function forecastPicture(week, value) {
    const objects = [
      forecastPoint(
        week,
        value
      ),
      dash(
        [
          X(week),
          AY0 + 0.04,
          0
        ],
        [
          X(week),
          Y(week === 7 ? BASE_7 : BASE_8) - 0.58,
          0
        ],
        AMBER
      )
    ];

    if (week === 7) {
      objects.push(
        dash(
          pt(6, LEVEL_6),
          pt(7, value),
          AMBER
        )
      );
    } else {
      objects.push(
        dash(
          pt(7, FORECAST_7),
          pt(8, value),
          AMBER
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function forecastLabel(week, value) {
    return tag(
      fmt(value),
      AMBER,
      [
        X(week),
        Y(value) + 0.33,
        0
      ],
      15
    );
  }

  function drawHolidayForecast(week) {
    const value =
      week === 7
        ? FORECAST_7
        : FORECAST_8;

    return [
      ...put(
        'forecast' + week,
        forecastPicture(
          week,
          value
        )
      ),
      ...put(
        'forecastLabel' + week,
        forecastLabel(
          week,
          value
        )
      )
    ];
  }

  function actualPicture(week) {
    const value = DATA[week - 1];

    return new M.VGroup(
      ln(
        pt(
          week - 1,
          DATA[week - 2]
        ),
        pt(week, value),
        WHITE,
        2.1
      ),
      glowingDot(
        pt(week, value),
        WHITE,
        0.105,
        0.24
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

  function finalForecastChart(
    christmasActual = false,
    newYearActual = false
  ) {
    const a = [
      ...finalBaseChart(),
      ...drawBothBaseSteps(),
      ...put(
        'blocks7',
        chartExtraStack(
          7,
          BASE_7,
          EXTRA_7
        )
      ),
      ...put(
        'blocks8',
        chartExtraStack(
          8,
          BASE_8,
          EXTRA_8
        )
      ),
      ...put(
        'extraLabel7',
        extraLabel(7, EXTRA_7)
      ),
      ...put(
        'extraLabel8',
        extraLabel(8, EXTRA_8)
      ),
      ...drawHolidayForecast(7),
      ...drawHolidayForecast(8)
    ];

    if (christmasActual) {
      a.push(
        ...remove('forecastLabel7'),
        ...put(
          'actual7',
          actualPicture(7)
        )
      );
    }

    if (newYearActual) {
      a.push(
        ...remove('forecastLabel8'),
        ...put(
          'actual8',
          actualPicture(8)
        )
      );
    }

    // Replace the initial chart legend once.
    // Do not retain multiple competing legends.

    a.push(
      ...put(
        'legend',
        legend(
          true,
          true,
          true,
          christmasActual || newYearActual
        )
      )
    );

    return a;
  }

  // ------------------------------------------------------------
  // Magnified staircase and seasonal blocks.
  //
  // This diagram uses a local room scale.
  // It makes the holiday blocks easier to see than
  // on the full 0–40 chart.
  //
  // Violet stairs represent the underlying trend.
  // Pink blocks represent seasonal additions.
  // ------------------------------------------------------------

  const DX0 = CX - 2.45;
  const DX1 = CX;
  const DX2 = CX + 2.45;

  const DBASE = P ? -3.20 : -2.02;

  const DSCALE = P ? 0.46 : 0.32;

  const diagramY = rooms =>
    DBASE + (rooms - 25) * DSCALE;

  function diagramBlock(
    x,
    base,
    j,
    color = PINK,
    opacity = 0.85
  ) {
    return rect(
      0.95,
      DSCALE * 0.83,
      [
        x,
        diagramY(base + j + 0.5),
        0
      ],
      color,
      opacity,
      1.3
    );
  }

  function seasonalDiagram(
    christmas = null,
    newYear = null,
    totals = false,
    unknown = false
  ) {
    const objects = [];

    objects.push(
      txt(
        'TREND STAIRS + SEASONAL BLOCKS',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.45 : 1.38,
          0
        ]
      )
    );

    // A clearly labelled local vertical scale.

    const scaleX = CX - 3.05;

    objects.push(
      ln(
        [scaleX, diagramY(25), 0],
        [scaleX, diagramY(34), 0],
        C.muted,
        1.4
      )
    );

    [26, 28, 30, 32, 34].forEach(v => {
      objects.push(
        ln(
          [scaleX - 0.045, diagramY(v), 0],
          [scaleX + 0.045, diagramY(v), 0],
          C.muted,
          1
        ),
        txt(
          String(v),
          12,
          C.muted,
          [
            scaleX - 0.23,
            diagramY(v),
            0
          ],
          true
        )
      );
    });

    // Level 27 and the two equal trend steps.

    objects.push(
      ln(
        [DX0, diagramY(27), 0],
        [DX1, diagramY(27), 0],
        VIOLET,
        4
      ),
      ln(
        [DX1, diagramY(27), 0],
        [DX1, diagramY(29), 0],
        VIOLET,
        4
      ),
      ln(
        [DX1, diagramY(29), 0],
        [DX2, diagramY(29), 0],
        VIOLET,
        4
      ),
      ln(
        [DX2, diagramY(29), 0],
        [DX2, diagramY(31), 0],
        VIOLET,
        4
      ),
      ln(
        [DX2, diagramY(31), 0],
        [DX2 + 0.48, diagramY(31), 0],
        VIOLET,
        4
      ),
      diamond(
        [DX0, diagramY(27), 0],
        GREEN,
        0.17
      )
    );

    objects.push(
      txt(
        '27',
        17,
        GREEN,
        [
          DX0,
          diagramY(27) - 0.32,
          0
        ],
        true
      ),
      txt(
        '29',
        17,
        VIOLET,
        [
          DX1,
          diagramY(29) - 0.30,
          0
        ],
        true
      ),
      txt(
        '31',
        17,
        VIOLET,
        [
          DX2,
          diagramY(31) - 0.30,
          0
        ],
        true
      ),
      txt(
        'Week 6',
        15,
        GREEN,
        [
          DX0,
          DBASE - 0.46,
          0
        ]
      ),
      txt(
        'Christmas',
        15,
        AMBER,
        [
          DX1,
          DBASE - 0.46,
          0
        ]
      ),
      txt(
        'New Year',
        15,
        AMBER,
        [
          DX2,
          DBASE - 0.46,
          0
        ]
      )
    );

    // Treads and risers each represent the same
    // one-week and two-room increments.

    objects.push(
      tag(
        '+2',
        VIOLET,
        [
          (DX0 + DX1) / 2,
          diagramY(27) + 0.30,
          0
        ],
        14
      ),
      tag(
        '+2',
        VIOLET,
        [
          (DX1 + DX2) / 2,
          diagramY(29) + 0.30,
          0
        ],
        14
      )
    );

    if (unknown) {
      objects.push(
        tag(
          '+ ?',
          PINK,
          [
            DX1,
            diagramY(29) + 0.52,
            0
          ],
          16
        ),
        tag(
          '+ ?',
          PINK,
          [
            DX2,
            diagramY(31) + 0.52,
            0
          ],
          16
        )
      );
    }

    if (christmas !== null) {
      for (let j = 0; j < christmas; j++) {
        objects.push(
          diagramBlock(
            DX1,
            29,
            j
          )
        );
      }

      objects.push(
        txt(
          '+' + christmas,
          18,
          PINK,
          [
            DX1 - 0.75,
            diagramY(29 + christmas / 2),
            0
          ],
          true
        )
      );
    }

    if (newYear !== null) {
      for (let j = 0; j < newYear; j++) {
        objects.push(
          diagramBlock(
            DX2,
            31,
            j
          )
        );
      }

      objects.push(
        txt(
          '+' + newYear,
          18,
          PINK,
          [
            DX2 - 0.75,
            diagramY(31 + newYear / 2),
            0
          ],
          true
        )
      );
    }

    if (totals && christmas !== null) {
      objects.push(
        tag(
          fmt(29 + christmas),
          AMBER,
          [
            DX1,
            diagramY(29 + christmas) + 0.30,
            0
          ],
          15
        )
      );
    }

    if (totals && newYear !== null) {
      objects.push(
        tag(
          fmt(31 + newYear),
          AMBER,
          [
            DX2,
            diagramY(31 + newYear) + 0.30,
            0
          ],
          15
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Seasonal calendar.
  //
  // Earlier records give an extra of:
  // zero for ordinary weeks,
  // four for Christmas,
  // two for New Year.
  //
  // This is a schematic picture of the learned seasonal
  // component, not a new set of historical observations.
  // ------------------------------------------------------------

  function seasonalCalendar() {
    const objects = [];

    const base = P ? -2.90 : -1.70;
    const spacing = P ? 0.76 : 0.75;

    const blockW = 0.46;
    const blockH = P ? 0.47 : 0.37;

    const values = [
      0, 0, 0, 0, 0, 0, 4, 2
    ];

    const xx = i =>
      CX + (i - 3.5) * spacing;

    objects.push(
      txt(
        'SEASONAL EXTRAS FROM EARLIER RECORDS',
        P ? 17 : 16,
        PINK,
        [
          CX,
          P ? 1.40 : 1.30,
          0
        ]
      ),
      ln(
        [xx(0) - 0.30, base, 0],
        [xx(7) + 0.30, base, 0],
        C.muted,
        2
      )
    );

    values.forEach((n, i) => {
      for (let j = 0; j < n; j++) {
        objects.push(
          rect(
            blockW,
            blockH * 0.85,
            [
              xx(i),
              base + (j + 0.5) * blockH,
              0
            ],
            PINK,
            0.88
          )
        );
      }

      objects.push(
        txt(
          n === 0 ? '0' : '+' + n,
          17,
          n === 0 ? C.muted : PINK,
          [
            xx(i),
            base + n * blockH + 0.27,
            0
          ],
          true
        ),
        txt(
          'W' + (i + 1),
          13,
          C.muted,
          [
            xx(i),
            base - 0.28,
            0
          ],
          true
        )
      );
    });

    const ordinaryLeft =
      xx(0) - 0.29;

    const ordinaryRight =
      xx(5) + 0.29;

    const bracketY =
      base - 0.61;

    objects.push(
      ln(
        [ordinaryLeft, bracketY, 0],
        [ordinaryRight, bracketY, 0],
        C.muted,
        1.4
      ),
      txt(
        'ordinary autumn weeks',
        14,
        C.muted,
        [
          (ordinaryLeft + ordinaryRight) / 2,
          bracketY - 0.25,
          0
        ]
      ),
      txt(
        'Xmas',
        12,
        PINK,
        [
          xx(6),
          base - 0.65,
          0
        ]
      ),
      txt(
        'NY',
        12,
        PINK,
        [
          xx(7),
          base - 0.65,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Three-component conceptual picture.
  //
  // Level: the current height.
  // Trend: the rise per week.
  // Seasonality: blocks on the matching step.
  // ------------------------------------------------------------

  function threeComponents() {
    const objects = [];

    const base =
      P ? -3.10 : -2.05;

    const centers = [
      CX - 2.05,
      CX,
      CX + 2.05
    ];

    const titleY =
      P ? 1.15 : 1.30;

    objects.push(
      txt(
        'THREE PARTS OF ONE FORECAST',
        19,
        C.ink,
        [CX, titleY, 0]
      )
    );

    const colors = [
      GREEN,
      VIOLET,
      PINK
    ];

    const titles = [
      'LEVEL',
      'TREND',
      'SEASONAL'
    ];

    centers.forEach((x, i) => {
      const r = new M.RoundedRectangle({
        width: 1.76,
        height: P ? 2.75 : 2.42,
        cornerRadius: 0.15,
        color: colors[i],
        strokeWidth: 1.7
      });

      r.setFill(C.card, 0.70);

      r.moveTo([
        x,
        base + (P ? 1.55 : 1.37),
        0
      ]);

      objects.push(
        r,
        txt(
          titles[i],
          15,
          colors[i],
          [
            x,
            base + (P ? 2.57 : 2.26),
            0
          ]
        )
      );
    });

    // Level icon.

    objects.push(
      ln(
        [centers[0] - 0.48, base + 0.50, 0],
        [centers[0] + 0.48, base + 0.50, 0],
        C.muted,
        1.6
      ),
      arrow(
        [centers[0], base + 0.50, 0],
        [centers[0], base + 1.78, 0],
        GREEN,
        3.0
      ),
      diamond(
        [centers[0], base + 1.78, 0],
        GREEN,
        0.16
      ),
      txt(
        '27',
        19,
        GREEN,
        [
          centers[0],
          base + 0.23,
          0
        ],
        true
      )
    );

    // Trend icon.

    const tx = centers[1];

    objects.push(
      ln(
        [tx - 0.57, base + 0.65, 0],
        [tx, base + 0.65, 0],
        VIOLET,
        3.5
      ),
      ln(
        [tx, base + 0.65, 0],
        [tx, base + 1.18, 0],
        VIOLET,
        3.5
      ),
      ln(
        [tx, base + 1.18, 0],
        [tx + 0.56, base + 1.18, 0],
        VIOLET,
        3.5
      ),
      ln(
        [tx + 0.56, base + 1.18, 0],
        [tx + 0.56, base + 1.71, 0],
        VIOLET,
        3.5
      ),
      txt(
        '+2 / week',
        14,
        VIOLET,
        [
          tx,
          base + 0.23,
          0
        ]
      )
    );

    // Seasonal icon.

    const sx = centers[2];

    for (let j = 0; j < 4; j++) {
      objects.push(
        rect(
          0.80,
          0.22,
          [
            sx,
            base + 0.57 + j * 0.28,
            0
          ],
          PINK,
          0.90
        )
      );
    }

    objects.push(
      txt(
        'extra',
        15,
        PINK,
        [
          sx,
          base + 0.23,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Compare old Christmas extra and new reading.
  //
  // One block = one room.
  //
  // Old extra: 4.
  // New reading: 6.
  // Updated extra: 5.
  //
  // The new reading remains six during the update.
  // Only the estimate changes.
  // ------------------------------------------------------------

  const COMP_BASE =
    P ? -3.30 : -2.16;

  const COMP_PITCH =
    P ? 0.56 : 0.42;

  const COMP_W = 0.92;

  const COMP_LEFT =
    CX - 1.60;

  const COMP_RIGHT =
    CX + 1.60;

  function comparisonBlock(
    x,
    j,
    color,
    opacity = 0.86
  ) {
    return rect(
      COMP_W,
      COMP_PITCH * 0.84,
      [
        x,
        COMP_BASE +
          (j + 0.5) * COMP_PITCH,
        0
      ],
      color,
      opacity
    );
  }

  function comparisonTop(n) {
    return COMP_BASE +
      n * COMP_PITCH;
  }

  function comparisonPicture(
    estimate,
    reading = 6,
    stage = 0
  ) {
    const objects = [];

    objects.push(
      txt(
        stage >= 2
          ? 'UPDATED CHRISTMAS EXTRA'
          : 'LEARN FROM THIS CHRISTMAS',
        19,
        C.ink,
        [
          CX,
          P ? 1.48 : 1.32,
          0
        ]
      ),
      ln(
        [
          COMP_LEFT - 0.65,
          COMP_BASE,
          0
        ],
        [
          COMP_RIGHT + 0.65,
          COMP_BASE,
          0
        ],
        C.muted,
        2
      )
    );

    for (let j = 0; j < estimate; j++) {
      const color =
        j >= EXTRA_7
          ? GREEN
          : PINK;

      objects.push(
        comparisonBlock(
          COMP_LEFT,
          j,
          color
        )
      );
    }

    for (let j = 0; j < reading; j++) {
      objects.push(
        comparisonBlock(
          COMP_RIGHT,
          j,
          WHITE,
          0.78
        )
      );
    }

    objects.push(
      txt(
        String(estimate),
        22,
        stage >= 2 ? GREEN : PINK,
        [
          COMP_LEFT,
          comparisonTop(estimate) + 0.29,
          0
        ],
        true
      ),
      txt(
        String(reading),
        22,
        WHITE,
        [
          COMP_RIGHT,
          comparisonTop(reading) + 0.29,
          0
        ],
        true
      ),
      txt(
        stage >= 2
          ? 'New extra'
          : 'Old extra',
        17,
        stage >= 2 ? GREEN : PINK,
        [
          COMP_LEFT,
          COMP_BASE - 0.32,
          0
        ]
      ),
      txt(
        'New reading',
        17,
        WHITE,
        [
          COMP_RIGHT,
          COMP_BASE - 0.32,
          0
        ]
      )
    );

    if (stage >= 1) {
      const gap = reading - estimate;

      const gx =
        COMP_LEFT + 0.80;

      const low =
        comparisonTop(estimate);

      const high =
        comparisonTop(reading);

      objects.push(
        dash(
          [
            COMP_LEFT + COMP_W / 2,
            low,
            0
          ],
          [
            COMP_RIGHT - COMP_W / 2,
            low,
            0
          ],
          C.muted
        ),
        ln(
          [gx, low, 0],
          [gx, high, 0],
          stage >= 2 ? GREEN : AMBER,
          2.8
        ),
        ln(
          [gx - 0.08, low, 0],
          [gx + 0.08, low, 0],
          stage >= 2 ? GREEN : AMBER,
          2
        ),
        ln(
          [gx - 0.08, high, 0],
          [gx + 0.08, high, 0],
          stage >= 2 ? GREEN : AMBER,
          2
        ),
        txt(
          String(gap),
          18,
          stage >= 2 ? GREEN : AMBER,
          [
            gx + 0.26,
            (low + high) / 2,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Seasonal update number line.
  //
  // Starting estimate 4.
  // New reading 6.
  // Move halfway: 4 → 5.
  //
  // Unlike the hotel graph, this axis measures only
  // the extra number of rooms.
  // ------------------------------------------------------------

  const SL0 = CX - 2.55;
  const SL1 = CX + 2.55;

  const SLY =
    P ? -1.25 : -0.62;

  const SX = value =>
    SL0 + value / 8 * (SL1 - SL0);

  function updateScale() {
    const objects = [];

    objects.push(
      txt(
        'UPDATE THE CHRISTMAS EXTRA',
        20,
        PINK,
        [
          CX,
          P ? 1.35 : 1.30,
          0
        ]
      ),
      ln(
        [SL0, SLY, 0],
        [SL1, SLY, 0],
        C.muted,
        2.5
      )
    );

    for (let v = 0; v <= 8; v++) {
      objects.push(
        ln(
          [SX(v), SLY - 0.07, 0],
          [SX(v), SLY + 0.07, 0],
          C.muted,
          1.4
        ),
        txt(
          String(v),
          16,
          C.muted,
          [
            SX(v),
            SLY - 0.28,
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        'extra rooms',
        15,
        C.muted,
        [
          CX,
          SLY - 0.73,
          0
        ]
      ),
      glowingDot(
        [
          SX(CHRISTMAS_READING),
          SLY,
          0
        ],
        WHITE,
        0.12,
        0.19
      ),
      tag(
        'NEW READING',
        WHITE,
        [
          SX(CHRISTMAS_READING) + 0.43,
          SLY + 0.78,
          0
        ],
        13
      ),
      dash(
        [
          SX(CHRISTMAS_READING),
          SLY + 0.13,
          0
        ],
        [
          SX(CHRISTMAS_READING),
          SLY + 0.54,
          0
        ],
        WHITE
      ),
      ring(
        [SX(EXTRA_7), SLY, 0],
        PINK,
        0.11
      ),
      tag(
        'OLD EXTRA',
        PINK,
        [
          SX(EXTRA_7) - 0.43,
          SLY + 0.78,
          0
        ],
        13
      )
    );

    return new M.VGroup(...objects);
  }

  function extraMarker(value) {
    return diamond(
      [SX(value), SLY, 0],
      GREEN,
      0.17
    );
  }

  function extraMarkerLabel(value) {
    return tag(
      fmt(value),
      GREEN,
      [
        SX(value),
        SLY - 1.16,
        0
      ],
      18
    );
  }

  function extraUpdateArrow() {
    return new M.VGroup(
      arrow(
        [
          SX(EXTRA_7),
          SLY + 0.27,
          0
        ],
        [
          SX(NEW_EXTRA_7),
          SLY + 0.27,
          0
        ],
        GREEN,
        3.5
      ),
      txt(
        '+1',
        16,
        GREEN,
        [
          (
            SX(EXTRA_7) +
            SX(NEW_EXTRA_7)
          ) / 2,
          SLY + 0.49,
          0
        ],
        true
      )
    );
  }

  function extraGapPicture() {
    const y = SLY + 1.42;

    return new M.VGroup(
      ln(
        [SX(EXTRA_7), y, 0],
        [SX(CHRISTMAS_READING), y, 0],
        AMBER,
        2
      ),
      txt(
        'before: 2',
        14,
        AMBER,
        [
          (
            SX(EXTRA_7) +
            SX(CHRISTMAS_READING)
          ) / 2,
          y + 0.23,
          0
        ]
      ),
      ln(
        [
          SX(NEW_EXTRA_7),
          y - 0.36,
          0
        ],
        [
          SX(CHRISTMAS_READING),
          y - 0.36,
          0
        ],
        GREEN,
        3
      ),
      txt(
        'after: 1',
        14,
        GREEN,
        [
          (
            SX(NEW_EXTRA_7) +
            SX(CHRISTMAS_READING)
          ) / 2 + 0.58,
          y - 0.60,
          0
        ]
      )
    );
  }

  // ------------------------------------------------------------
  // Remove the OLD seasonal extra before updating level.
  //
  // Christmas observation: 35.
  // Old seasonal extra: 4.
  // Deseasonalized observation: 31.
  //
  // Use the old seasonal extra, not the newly updated
  // extra of five.
  //
  // This illustrates the input to the level update.
  // It does not replace the stored New Year forecast.
  // ------------------------------------------------------------

  function deseasonalizePicture(stage = 0) {
    const objects = [];

    const bottom =
      P ? -3.15 : -2.08;

    const pitch =
      P ? 0.43 : 0.30;

    const yy = value =>
      bottom + (value - 27) * pitch;

    const left =
      CX - 1.36;

    const right =
      CX + 1.43;

    const titleY =
      P ? 1.38 : 1.30;

    objects.push(
      txt(
        'REMOVE THE OLD SEASONAL EXTRA',
        18,
        GREEN,
        [CX, titleY, 0]
      ),
      ln(
        [
          left - 0.82,
          yy(27),
          0
        ],
        [
          left - 0.82,
          yy(35),
          0
        ],
        C.muted,
        1.5
      )
    );

    [27, 29, 31, 33, 35].forEach(v => {
      objects.push(
        txt(
          String(v),
          14,
          C.muted,
          [
            left - 1.13,
            yy(v),
            0
          ],
          true
        ),
        ln(
          [
            left - 0.88,
            yy(v),
            0
          ],
          [
            left - 0.75,
            yy(v),
            0
          ],
          C.muted,
          1
        )
      );
    });

    // Show the observed count as a local column
    // between 27 and 35.

    objects.push(
      rect(
        0.88,
        yy(31) - yy(27),
        [
          left,
          (yy(31) + yy(27)) / 2,
          0
        ],
        CYAN,
        0.75
      ),
      glowingDot(
        [left, yy(35), 0],
        WHITE,
        0.12,
        0.18
      ),
      txt(
        '35 real',
        16,
        WHITE,
        [
          left,
          yy(35) + 0.28,
          0
        ]
      )
    );

    for (let j = 0; j < 4; j++) {
      const x =
        stage === 0
          ? left
          : right + 0.75;

      const y =
        stage === 0
          ? yy(31 + j + 0.5)
          : yy(28 + j + 0.5);

      objects.push(
        rect(
          0.88,
          pitch * 0.83,
          [x, y, 0],
          PINK,
          0.86
        )
      );
    }

    if (stage === 0) {
      objects.push(
        txt(
          'old extra: 4',
          17,
          PINK,
          [
            right,
            yy(33),
            0
          ]
        ),
        arrow(
          [
            left + 0.62,
            yy(33),
            0
          ],
          [
            right - 0.50,
            yy(33),
            0
          ],
          PINK,
          3.0
        )
      );
    } else {
      objects.push(
        dash(
          [left, yy(31), 0],
          [right, yy(31), 0],
          GREEN
        ),
        diamond(
          [
            left,
            yy(31),
            0
          ],
          GREEN,
          0.16
        ),
        tag(
          '31',
          GREEN,
          [
            right - 0.45,
            yy(31) + 0.35,
            0
          ],
          18
        ),
        txt(
          'old 4 removed',
          14,
          PINK,
          [
            right + 0.75,
            yy(28) - 0.32,
            0
          ]
        )
      );
    }

    objects.push(
      txt(
        'input to level update',
        15,
        GREEN,
        [
          CX,
          bottom - 0.45,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Schematic trap picture.
  //
  // A one-off event is not automatically a recurring
  // seasonal pattern.
  //
  // These bars are illustrative and do not represent
  // additional measured hotel data.
  // ------------------------------------------------------------

  function trapPicture() {
    const objects = [];

    const base =
      P ? -3.18 : -2.10;

    const pitch =
      P ? 0.49 : 0.38;

    const xs = [
      CX - 2.00,
      CX,
      CX + 2.00
    ];

    const normalExtra = 4;
    const oneOffExtra = 2;

    objects.push(
      txt(
        'A ONE-OFF EVENT IS NOT A SEASON',
        19,
        RED,
        [
          CX,
          P ? 1.35 : 1.32,
          0
        ]
      ),
      ln(
        [xs[0] - 0.65, base, 0],
        [xs[2] + 0.65, base, 0],
        C.muted,
        2
      )
    );

    xs.forEach((x, i) => {
      for (let j = 0; j < normalExtra; j++) {
        const color =
          i === 2 ? C.muted : PINK;

        objects.push(
          rect(
            0.84,
            pitch * 0.84,
            [
              x,
              base + (j + 0.5) * pitch,
              0
            ],
            color,
            i === 2 ? 0.18 : 0.86
          )
        );
      }

      objects.push(
        txt(
          [
            'Earlier',
            'This year',
            'Next year'
          ][i],
          15,
          i === 2 ? C.muted : C.ink,
          [
            x,
            base - 0.31,
            0
          ]
        )
      );
    });

    // A hypothetical unusual event this year only.

    for (let j = 0; j < oneOffExtra; j++) {
      objects.push(
        rect(
          0.84,
          pitch * 0.84,
          [
            xs[1],
            base +
              (normalExtra + j + 0.5) *
              pitch,
            0
          ],
          RED,
          0.86
        )
      );
    }

    objects.push(
      tag(
        'ONE-OFF',
        RED,
        [
          xs[1],
          base +
            (normalExtra + oneOffExtra) *
              pitch +
            0.32,
          0
        ],
        14
      ),
      tag(
        '?',
        AMBER,
        [
          xs[2],
          base +
            normalExtra * pitch +
            0.35,
          0
        ],
        19
      ),
      txt(
        'illustrative pattern',
        12,
        C.muted,
        [
          CX,
          base - 0.71,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0–2: the holiday staffing problem.
  // ============================================================

  // 0. How many people should work the holiday shifts?

  await until(S(0));
  await play(
    ...put(
      'intro',
      new M.VGroup(
        tag(
          'HOLIDAY STAFFING',
          AMBER,
          [
            CX,
            P ? 0.75 : 0.73,
            0
          ],
          25
        ),
        tag(
          'CHRISTMAS: ? ROOMS',
          PINK,
          [
            CX,
            P ? -0.25 : -0.10,
            0
          ],
          20
        ),
        tag(
          'NEW YEAR: ? ROOMS',
          PINK,
          [
            CX,
            P ? -1.20 : -0.93,
            0
          ],
          20
        ),
        txt(
          'Use room forecasts to plan shifts',
          16,
          C.muted,
          [
            CX,
            P ? -2.20 : -1.77,
            0
          ]
        )
      )
    ),
    ...say('PLAN THE TWO HOLIDAY SHIFTS', AMBER),
    ...fbox([
      ['HOTEL: 40 ROOMS', CYAN],
      'Christmas and New Year',
      'need staffing forecasts'
    ], AMBER)
  );

  // 1. Six cyan Saturday room counts.

  await until(S(1));
  await play(
    ...drawChart(6),
    ...say('SIX KNOWN SATURDAY COUNTS'),
    ...fbox([
      ['KNOWN WEEKS 1–6', CYAN],
      '20, 24, 20, 23, 24, 29',
      'now: end of week 6'
    ])
  );

  // 2. Hide both holiday counts.

  await until(S(2));
  await play(
    ...put(
      'hidden',
      hiddenWeeks(7)
    ),
    ...say('KEEP BOTH HOLIDAY DOTS HIDDEN', AMBER),
    ...fbox([
      ['Christmas = ?', AMBER],
      ['New Year  = ?', AMBER],
      'make forecasts first'
    ], AMBER)
  );

  // ============================================================
  // 3–10: replay the latest Holt updates.
  //
  // Week 5: expected 24, actual 24.
  // Level 24, trend 1.
  //
  // Week 6: expected 25, actual 29.
  // Level 27, trend 2.
  // ============================================================

  // 3. Return to the end of week four.

  await until(S(3));
  await play(
    ...drawChart(4, true),
    ...put(
      'hidden',
      hiddenWeeks(5)
    ),
    ...put(
      'levelMarker',
      levelMarker(4, LEVEL_4)
    ),
    ...put(
      'levelLabel',
      levelLabel(4, LEVEL_4)
    ),
    ...put(
      'levelTrail',
      completedLevelTrail(4)
    ),
    ...put(
      'trendNote',
      trendNote(TREND_4)
    ),
    ...say('REPLAY THE LAST TWO HOLT UPDATES', VIOLET),
    ...fbox([
      ['END OF WEEK 4', CYAN],
      ['level = 23', GREEN],
      ['trend = +1 / week', VIOLET]
    ], VIOLET)
  );

  // 4. Week five expected 24 and actual 24.

  await until(S(4));
  await play(
    ...put(
      'expected',
      expectedPicture(
        5,
        LEVEL_4,
        EXPECTED_5
      )
    ),
    ...moveLevel(
      5,
      EXPECTED_5,
      0.75
    ),
    ...say('WEEK 5: EXPECT 24', AMBER),
    ...fbox([
      ['level = 23', GREEN],
      ['trend = +1', VIOLET],
      ['23 + 1 = 24', AMBER]
    ], AMBER)
  );

  await until(S(4) + 1.35);
  await play(
    ...revealWeek(5),
    ...say('WEEK 5 ACTUAL: ALSO 24', CYAN),
    ...fbox([
      ['expected = 24', AMBER],
      ['actual   = 24', CYAN],
      ['gap = 0', GREEN]
    ], GREEN)
  );

  // 5. Zero error means new level 24.

  await until(S(5));
  await play(
    ...remove('expected'),
    ...put(
      'levelTrail',
      completedLevelTrail(5)
    ),
    ...put(
      'gap',
      gapBracket(
        5,
        EXPECTED_5,
        DATA[4],
        GREEN,
        1,
        'ZERO GAP'
      )
    ),
    ...say('NO GAP: KEEP THE LEVEL AT 24', GREEN),
    ...fbox([
      '24 + half of 0',
      ['new level = 24', GREEN]
    ], GREEN)
  );

  // 6. Trend remains one room per week.

  await until(S(6));
  await play(
    ...remove('gap'),
    new M.Indicate(
      visible.trendNote,
      { color: VIOLET }
    ),
    ...say('TREND STAYS AT ONE ROOM PER WEEK', VIOLET),
    ...fbox([
      'latest rise = 24 − 23 = 1',
      ['trend stays at +1', VIOLET]
    ], VIOLET)
  );

  // 7. Week six expected 25 but actual 29.

  await until(S(7));
  await play(
    ...put(
      'expected',
      expectedPicture(
        6,
        LEVEL_5,
        EXPECTED_6
      )
    ),
    ...moveLevel(
      6,
      EXPECTED_6,
      0.75
    ),
    ...say('WEEK 6: EXPECT 25', AMBER),
    ...fbox([
      ['level = 24', GREEN],
      ['trend = +1', VIOLET],
      ['expected = 25', AMBER]
    ], AMBER)
  );

  await until(S(7) + 1.35);
  await play(
    ...revealWeek(6),
    ...say('WEEK 6 ACTUAL: 29', CYAN),
    ...fbox([
      ['expected = 25', AMBER],
      ['actual   = 29', CYAN]
    ])
  );

  // 8. Actual is four rooms above the forecast.

  await until(S(8));
  await play(
    ...put(
      'gap',
      gapBracket(
        6,
        EXPECTED_6,
        DATA[5],
        AMBER
      )
    ),
    ...say('REAL COUNT IS 4 ABOVE THE GUESS', AMBER),
    ...fbox([
      'actual − expected',
      ['29 − 25 = 4', AMBER]
    ], AMBER)
  );

  // 9. Move halfway upward.
  // New level = 27; remaining gap = 2.

  await until(S(9));
  await play(
    ...remove('gap'),
    ...put(
      'halfway',
      halfwayLevelPicture()
    ),
    ...moveLevel(
      6,
      LEVEL_6,
      0.95
    ),
    ...say('MOVE HALFWAY TOWARD THE DOT', GREEN),
    ...fbox([
      '25 + half of 4',
      ['new level = 27', GREEN],
      'remaining gap = 2'
    ], GREEN)
  );

  await until(S(9) + 1.50);
  await play(
    ...put(
      'gap',
      gapBracket(
        6,
        LEVEL_6,
        DATA[5],
        GREEN
      )
    )
  );

  // 10. Final level 27, trend 2.

  await until(S(10));
  await play(
    ...remove(
      'expected',
      'gap',
      'halfway'
    ),
    ...put(
      'levelTrail',
      completedLevelTrail(6)
    ),
    ...put(
      'trendNote',
      trendNote(TREND_6)
    ),
    ...say('AFTER WEEK 6: LEVEL 27, TREND 2', GREEN),
    ...fbox([
      ['level = 27', GREEN],
      'rise = 27 − 24 = 3',
      ['trend = halfway(1, 3) = 2', VIOLET]
    ], GREEN)
  );

  // ============================================================
  // 11–13: draw Holt's underlying forecast staircase.
  // ============================================================

  // 11. Start at 27 and rise two rooms per step.

  await until(S(11));
  await play(
    ...remove('hidden'),
    ...put(
      'base7',
      baseStep(7)
    ),
    ...say('START AT 27, ADD 2 EACH WEEK', VIOLET),
    ...fbox([
      ['current level = 27', GREEN],
      ['each step = +2 rooms', VIOLET]
    ], VIOLET)
  );

  await until(S(11) + 1.55);
  await play(
    ...put(
      'base8',
      baseStep(8)
    )
  );

  // 12. First step reaches 29 for Christmas.

  await until(S(12));
  await play(
    ...put(
      'baseLabel7',
      baseLabel(7)
    ),
    new M.Indicate(
      visible.base7,
      { color: VIOLET }
    ),
    ...say('CHRISTMAS STEP REACHES 29', VIOLET),
    ...fbox([
      ['27 + 2 = 29', VIOLET],
      'underlying Christmas level'
    ], VIOLET)
  );

  // 13. Second step reaches 31 for New Year.

  await until(S(13));
  await play(
    ...put(
      'baseLabel8',
      baseLabel(8)
    ),
    new M.Indicate(
      visible.base8,
      { color: VIOLET }
    ),
    ...say('NEW YEAR STEP REACHES 31', VIOLET),
    ...fbox([
      ['27 + 2 + 2 = 31', VIOLET],
      'underlying New Year level'
    ], VIOLET)
  );

  // ============================================================
  // 14–20: introduce the seasonal extra.
  // ============================================================

  // 14. Picture a stack of room blocks on each holiday step.

  await until(S(14));
  await play(
    ...clearChart(),
    ...put(
      'seasonalDiagram',
      seasonalDiagram(
        null,
        null,
        false,
        true
      )
    ),
    ...say('ADD ROOM BLOCKS ON TOP OF THE STAIRS', PINK),
    ...fbox([
      ['stairs = level + trend', VIOLET],
      ['blocks = holiday extras', PINK],
      'one block = one room'
    ], PINK)
  );

  // 15. The blocks represent the usual extra holiday rooms.

  await until(S(15));
  await play(
    ...say('BLOCKS REPRESENT USUALLY EXTRA HOLIDAY ROOMS', PINK),
    ...fbox([
      'ordinary trend',
      ['+ extra holiday demand', PINK],
      '= holiday forecast'
    ], PINK)
  );

  // 16. Name the recurring bump.

  await until(S(16));
  await play(
    ...say('SEASONAL EXTRA = A BUMP THAT RETURNS', PINK),
    ...fbox([
      ['SEASONAL EXTRA', PINK],
      'an extra count that',
      'tends to return each season'
    ], PINK)
  );

  // 17. Earlier records give Christmas four extra rooms.

  await until(S(17));
  await play(
    ...put(
      'seasonalDiagram',
      seasonalDiagram(
        EXTRA_7,
        null,
        false,
        false
      )
    ),
    ...say('CHRISTMAS EXTRA = 4 ROOMS', PINK),
    ...fbox([
      ['from earlier records', C.muted],
      ['Christmas extra = +4', PINK],
      'four extra room blocks'
    ], PINK)
  );

  // 18. Earlier records give New Year two extra rooms.

  await until(S(18));
  await play(
    ...put(
      'seasonalDiagram',
      seasonalDiagram(
        EXTRA_7,
        EXTRA_8,
        false,
        false
      )
    ),
    ...say('NEW YEAR EXTRA = 2 ROOMS', PINK),
    ...fbox([
      ['Christmas = +4', PINK],
      ['New Year  = +2', PINK]
    ], PINK)
  );

  // 19. Ordinary autumn weeks have zero seasonal extra.

  await until(S(19));
  await play(
    ...remove('seasonalDiagram'),
    ...put(
      'calendar',
      seasonalCalendar()
    ),
    ...say('ORDINARY AUTUMN WEEKS: EXTRA ZERO', PINK),
    ...fbox([
      'weeks 1–6: 0 extra',
      ['Christmas: +4', PINK],
      ['New Year:  +2', PINK]
    ], PINK)
  );

  // 20. Name Holt–Winters.

  await until(S(20));
  await play(
    ...remove('calendar'),
    ...put(
      'concept',
      threeComponents()
    ),
    ...say('HOLT–WINTERS: LEVEL + TREND + SEASONAL EXTRA', GREEN),
    ...fbox([
      ['HOLT–WINTERS', GREEN],
      ['level + trend', VIOLET],
      ['+ seasonal extra', PINK]
    ], GREEN)
  );

  // ============================================================
  // 21–25: construct the holiday forecasts.
  //
  // Christmas = 27 + 2 + 4 = 33.
  // New Year = 27 + 2 × 2 + 2 = 33.
  // ============================================================

  // 21. Put four Christmas blocks on top of 29.

  await until(S(21));
  await play(
    ...finalBaseChart(),
    ...drawBothBaseSteps(),
    ...say('PUT FOUR BLOCKS ON TOP OF 29', PINK),
    ...fbox([
      ['Christmas staircase = 29', VIOLET],
      ['seasonal extra = +4', PINK]
    ], PINK)
  );

  await until(S(21) + 0.75);

  await play(
    ...growChartExtra(
      'blocks7',
      7,
      BASE_7,
      EXTRA_7
    ),
    ...put(
      'extraLabel7',
      extraLabel(
        7,
        EXTRA_7
      )
    )
  );

  // 22. Christmas forecast reaches 33.

  await until(S(22));
  await play(
    ...drawHolidayForecast(7),
    ...put(
      'legend',
      legend(
        true,
        true,
        true
      )
    ),
    ...say('CHRISTMAS FORECAST = 33 ROOMS', AMBER),
    ...fbox([
      ['29 + 4 = 33', AMBER],
      ['Christmas forecast', AMBER]
    ], AMBER)
  );

  // 23. Put two New Year blocks on top of 31.

  await until(S(23));
  await play(
    ...growChartExtra(
      'blocks8',
      8,
      BASE_8,
      EXTRA_8
    ),
    ...put(
      'extraLabel8',
      extraLabel(
        8,
        EXTRA_8
      )
    ),
    ...say('PUT TWO BLOCKS ON TOP OF 31', PINK),
    ...fbox([
      ['New Year staircase = 31', VIOLET],
      ['seasonal extra = +2', PINK]
    ], PINK)
  );

  // 24. New Year forecast is also 33.

  await until(S(24));
  await play(
    ...drawHolidayForecast(8),
    ...say('NEW YEAR FORECAST ALSO = 33', AMBER),
    ...fbox([
      ['Christmas: 29 + 4 = 33', AMBER],
      ['New Year:  31 + 2 = 33', AMBER]
    ], AMBER)
  );

  // Both forecasts have the same height.
  // Their time positions differ by one week.

  await until(S(24) + 2.0);
  await play(
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
        runTime: 1.5
      }
    )
  );

  // 25. State the forecast formula in words.

  await until(S(25));
  await play(
    ...say('FORECAST = LEVEL + TREND × WEEKS + EXTRA', AMBER),
    ...fbox([
      ['FORECAST =', AMBER],
      ['level + trend × weeks ahead', GREEN],
      ['+ matching seasonal extra', PINK]
    ], AMBER)
  );

  await until(S(25) + 2.8);
  await play(
    ...fbox([
      ['Christmas:', AMBER],
      '27 + 2 × 1 + 4 = 33',
      ['New Year: 27 + 2 × 2 + 2 = 33', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 26–28: reveal Christmas and preserve the original
  // New Year forecast.
  // ============================================================

  // 26. First reveal of Christmas actual, 35.

  await until(S(26));
  await play(
    ...remove('forecastLabel7'),
    ...put(
      'actual7',
      actualPicture(7)
    ),
    ...put(
      'legend',
      legend(
        true,
        true,
        true,
        true
      )
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 33', AMBER],
      ['actual   = 35', WHITE]
    ])
  );

  // 27. Christmas forecast is two rooms low.

  await until(S(27));
  await play(
    ...put(
      'error7',
      gapBracket(
        7,
        FORECAST_7,
        DATA[6],
        RED,
        -1,
        '2'
      )
    ),
    ...say('CHRISTMAS FORECAST WAS 2 ROOMS LOW', RED),
    ...fbox([
      'error = actual − forecast',
      ['35 − 33 = 2', RED]
    ], RED)
  );

  // 28. Put the original New Year forecast aside.

  await until(S(28));
  await play(
    ...remove(
      'forecast8',
      'forecastLabel8',
      'blocks8',
      'extraLabel8',
      'base8',
      'baseLabel8',
      'error7'
    ),
    ...put(
      'parked',
      tag(
        'NEW YEAR: 33 SAVED',
        AMBER,
        [
          CX + 0.55,
          AY0 + 0.96,
          0
        ],
        14
      )
    ),
    ...say('SAVE THE ORIGINAL NEW YEAR FORECAST', AMBER),
    ...fbox([
      ['New Year forecast = 33', AMBER],
      'made at end of week 6',
      'keep it for the later check'
    ], AMBER)
  );

  // ============================================================
  // 29–32: obtain a new reading of the seasonal extra.
  //
  // Christmas actual = 35.
  // Christmas trend staircase = 29.
  //
  // New reading of seasonal extra:
  // 35 - 29 = 6.
  //
  // Do not confuse this six-room reading with
  // the two-room forecast error.
  // ============================================================

  // 29. Use the Christmas observation to update its extra.

  await until(S(29));
  await play(
    ...remove(
      'forecast7',
      'blocks7',
      'extraLabel7'
    ),
    ...say('UPDATE THE CHRISTMAS SEASONAL EXTRA', PINK),
    ...fbox([
      ['old Christmas extra = 4', PINK],
      'what does this year’s',
      'Christmas tell us?'
    ], PINK)
  );

  // 30. The staircase reached 29 before adding extras.

  await until(S(30));
  await play(
    ...put(
      'chartFocus',
      ring(
        pt(7, BASE_7),
        VIOLET,
        0.20
      )
    ),
    new M.Indicate(
      visible.baseLabel7,
      { color: VIOLET }
    ),
    ...say('WITHOUT HOLIDAY BLOCKS: 29 ROOMS', VIOLET),
    ...fbox([
      ['level + trend = 29', VIOLET],
      'before seasonal additions'
    ], VIOLET)
  );

  // 31. Actual is six above the underlying staircase.

  await until(S(31));
  await play(
    ...remove('chartFocus'),
    ...put(
      'reading',
      gapBracket(
        7,
        BASE_7,
        DATA[6],
        PINK,
        -1,
        '6'
      )
    ),
    ...say('THE REAL DOT IS 6 ABOVE THE STAIRCASE', PINK),
    ...fbox([
      ['actual = 35', WHITE],
      ['staircase = 29', VIOLET],
      ['35 − 29 = 6', PINK]
    ], PINK)
  );

  // 32. Six is a new reading of the Christmas extra.

  await until(S(32));
  await play(
    ...clearChart(),
    ...put(
      'comparison',
      comparisonPicture(
        EXTRA_7,
        CHRISTMAS_READING,
        0
      )
    ),
    ...say('NEW READING OF THE CHRISTMAS EXTRA = 6', PINK),
    ...fbox([
      ['new reading = 6', WHITE],
      ['old estimate = 4', PINK],
      'update rather than replace'
    ], PINK)
  );

  // ============================================================
  // 33–37: smooth the Christmas seasonal extra.
  //
  // Old extra = 4.
  // New reading = 6.
  // Gap = 2.
  // Half the gap = 1.
  // Updated extra = 5.
  // ============================================================

  // 33. Compare the old extra of four with the new reading six.

  await until(S(33));
  await play(
    ...put(
      'comparison',
      comparisonPicture(
        EXTRA_7,
        CHRISTMAS_READING,
        1
      )
    ),
    ...say('COMPARE OLD EXTRA 4 WITH NEW READING 6', PINK),
    ...fbox([
      ['old extra = 4', PINK],
      ['new reading = 6', WHITE],
      ['gap = 6 − 4 = 2', AMBER]
    ], AMBER)
  );

  // 34. Move halfway from four toward six.

  await until(S(34));
  await play(
    ...remove('comparison'),
    ...put(
      'updateScale',
      updateScale()
    ),
    ...put(
      'extraMarker',
      extraMarker(EXTRA_7)
    ),
    ...say('MOVE HALFWAY TOWARD SIX', GREEN),
    ...fbox([
      'gap = 2 rooms',
      ['half the gap = 1 room', GREEN]
    ], GREEN)
  );

  await until(S(34) + 1.25);

  await play(
    new M.Transform(
      visible.extraMarker,
      extraMarker(NEW_EXTRA_7),
      { runTime: 0.95 }
    ),
    ...put(
      'extraArrow',
      extraUpdateArrow()
    ),
    ...fbox([
      'old extra = 4',
      ['move +1 room', GREEN],
      '4 + 1'
    ], GREEN)
  );

  // 35. The new Christmas extra is five.

  await until(S(35));
  await play(
    ...put(
      'extraMarkerLabel',
      extraMarkerLabel(
        NEW_EXTRA_7
      )
    ),
    ...say('NEW CHRISTMAS EXTRA = 5', GREEN),
    ...fbox([
      ['4 + 1 = 5', GREEN],
      'save this seasonal extra',
      'for the next Christmas'
    ], GREEN)
  );

  // 36. The update halves the gap to the new reading.

  await until(S(36));
  await play(
    ...remove(
      'updateScale',
      'extraMarker',
      'extraMarkerLabel',
      'extraArrow'
    ),
    ...put(
      'comparison',
      comparisonPicture(
        NEW_EXTRA_7,
        CHRISTMAS_READING,
        2
      )
    ),
    ...say('THE GAP SHRINKS FROM 2 ROOMS TO 1', GREEN),
    ...fbox([
      ['before: 6 − 4 = 2', AMBER],
      ['after:  6 − 5 = 1', GREEN]
    ], GREEN)
  );

  // 37. State the seasonal update rule in words.

  await until(S(37));
  await play(
    ...say('NEW EXTRA IS HALFWAY BETWEEN OLD EXTRA AND NEW READING', GREEN),
    ...fbox([
      ['NEW SEASONAL EXTRA =', PINK],
      'halfway between old extra',
      'and gap above staircase'
    ], PINK)
  );

  await until(S(37) + 2.25);
  await play(
    ...fbox([
      'new extra = 4 + ½ × (6 − 4)',
      ['= 4 + 1 = 5', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 38–39: the level and trend also keep updating.
  //
  // Remove the OLD Christmas extra before updating
  // the underlying level.
  //
  // 35 - 4 = 31.
  //
  // This does not alter the already stored forecast
  // for New Year.
  // ============================================================

  // 38. All three components continue learning.

  await until(S(38));
  await play(
    ...clearPictures(),
    ...put(
      'concept',
      threeComponents()
    ),
    ...say('LEVEL AND TREND KEEP UPDATING TOO', GREEN),
    ...fbox([
      ['level: update', GREEN],
      ['trend: update', VIOLET],
      ['seasonal extra: update', PINK]
    ], GREEN)
  );

  // 39. Remove the old Christmas extra from the real count.

  await until(S(39));
  await play(
    ...remove('concept'),
    ...put(
      'levelUpdate',
      deseasonalizePicture(0)
    ),
    ...say('FIRST REMOVE THE OLD CHRISTMAS EXTRA', GREEN),
    ...fbox([
      ['real count = 35', WHITE],
      ['old extra = 4', PINK],
      'remove the seasonal effect'
    ], GREEN)
  );

  await until(S(39) + 1.70);

  await play(
    ...put(
      'levelUpdate',
      deseasonalizePicture(1)
    ),
    ...fbox([
      '35 − 4',
      ['= 31 for the level update', GREEN],
      'use old 4, not new 5'
    ], GREEN)
  );

  // ============================================================
  // 40–41: reveal the New Year observation.
  //
  // Restore the original forecasts made at week six.
  // Do not substitute a new forecast based on Christmas.
  // ============================================================

  // 40. First reveal of New Year actual, 33.

  await until(S(40));
  await play(
    ...finalForecastChart(
      true,
      false
    ),
    ...say('RETURN TO THE SAVED NEW YEAR FORECAST', AMBER),
    ...fbox([
      ['original forecast = 33', AMBER],
      'made at the end of week 6'
    ], AMBER)
  );

  await until(S(40) + 1.35);

  await play(
    ...remove('forecastLabel8'),
    ...put(
      'actual8',
      actualPicture(8)
    ),
    ...say('NEW YEAR ACTUAL: 33 ROOMS', WHITE),
    ...fbox([
      ['forecast = 33', AMBER],
      ['actual   = 33', WHITE]
    ])
  );

  // 41. Actual matches the original New Year forecast.

  await until(S(41));
  await play(
    ...put(
      'error8',
      gapBracket(
        8,
        FORECAST_8,
        DATA[7],
        GREEN,
        -1,
        'MATCH'
      )
    ),
    new M.Indicate(
      visible.actual8,
      { color: GREEN }
    ),
    ...say('NEW YEAR: THE FORECAST MATCHES', GREEN),
    ...fbox([
      ['Christmas: 35 − 33 = 2', AMBER],
      ['New Year:  33 − 33 = 0', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 42–44: when to use Holt–Winters, its trap,
  // and the final recap.
  // ============================================================

  // 42. Use this method for a steady direction
  // and a recurring seasonal bump.

  await until(S(42));
  await play(
    ...remove('error8'),
    ...say('USE WHEN A TREND AND A SEASONAL BUMP BOTH EXIST', GREEN),
    ...fbox([
      ['trend: a steady direction', VIOLET],
      ['seasonality: a returning bump', PINK],
      'forecast with both'
    ], GREEN),
    new M.LaggedStart(
      [
        new M.Indicate(
          visible.base7,
          { color: VIOLET }
        ),
        new M.Indicate(
          visible.blocks7,
          { color: PINK }
        ),
        new M.Indicate(
          visible.blocks8,
          { color: PINK }
        )
      ],
      {
        lagRatio: 0.24,
        runTime: 1.8
      }
    )
  );

  // 43. Trap: one unusual Christmas event need not recur.

  await until(S(43));
  await play(
    ...clearChart(),
    ...put(
      'trap',
      trapPicture()
    ),
    ...say('TRAP: TREATING A ONE-OFF EVENT AS SEASONAL', RED),
    ...fbox([
      ['ONE-OFF EVENT ≠ SEASON', RED],
      'an unusual Christmas',
      'may not repeat next year'
    ], RED)
  );

  // 44. Final recap.
  //
  // Holt–Winters combines:
  // a running level,
  // a running trend,
  // and a matching seasonal extra.
  //
  // Seasonal extras can change as new seasonal
  // observations arrive.

  await until(S(44));
  await play(
    ...clearPictures(),
    ...put(
      'seasonalDiagram',
      seasonalDiagram(
        EXTRA_7,
        EXTRA_8,
        true,
        false
      )
    ),
    ...say('HOLT–WINTERS: STEP FORWARD, THEN ADD THE SEASONAL EXTRA', GREEN),
    ...fbox([
      ['HOLT–WINTERS', GREEN],
      ['level + trend × weeks ahead', VIOLET],
      ['+ matching seasonal extra', PINK]
    ], GREEN)
  );

  await until(S(44) + 2.70);

  await play(
    ...say('THE SEASONAL EXTRA CAN LEARN AND CHANGE', PINK),
    ...fbox([
      ['Christmas forecast: 33', AMBER],
      ['New Year forecast: 33', AMBER],
      ['next Christmas extra: 4 → 5', GREEN]
    ], GREEN)
  );

  await until(E(44));
}
