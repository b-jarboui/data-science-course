// lesson 11.2.8
// Moving-average error model: forecast using short-lived echoes of past surprises.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, P, FW, FH, C, S, E,
    T, pill, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  // Week:       1   2   3   4   5   6   7   8
  // This year: 20  24  20  23  24  29  35  33
  // Last year: 18  21  19  21  22  26  32  30
  //
  // Long-run usual count = 22 rooms.
  //
  // MA(1) model:
  //
  // room count =
  //   usual count
  //   + this week's surprise
  //   + half of last week's surprise.
  //
  // Week 5:
  // Forecast = 22.
  // Actual = 24.
  // Surprise = 24 - 22 = 2.
  //
  // Week 6:
  // Echo from week 5 = 0.5 × 2 = 1.
  // Forecast = 22 + 1 = 23.
  // Actual = 29.
  // Surprise = 29 - 23 = 6.
  //
  // Week 6 decomposition:
  // 22 usual + 1 earlier echo + 6 fresh surprise = 29.
  //
  // Forecasts made at the end of week 6:
  //
  // Christmas:
  // 22 + 0.5 × 6 = 25.
  //
  // New Year:
  // 22 + 0 = 22.
  //
  // The future surprises have expected value zero.
  // This does NOT mean actual future surprises must be zero.
  //
  // The week-six surprise has a direct effect in week six
  // and an echo in week seven, but no effect in week eight.
  //
  // IMPORTANT:
  // Neither actual holiday count is revealed in this lesson.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const USUAL = 22;
  const THETA = 0.5;

  const FORECAST_5 = 22;
  const SURPRISE_5 = DATA[4] - FORECAST_5;

  const ECHO_6 = THETA * SURPRISE_5;
  const FORECAST_6 = USUAL + ECHO_6;

  const SURPRISE_6 = DATA[5] - FORECAST_6;

  const ECHO_7 = THETA * SURPRISE_6;
  const FORECAST_7 = USUAL + ECHO_7;

  const FORECAST_8 = USUAL;

  // ------------------------------------------------------------
  // Colours.
  //
  // Cyan: observed room counts.
  // White: usual count and newly revealed observations.
  // Pink: fresh surprise / innovation.
  // Violet: the echo of an earlier surprise.
  // Amber: forecasts.
  // Green: completed calculations and conclusions.
  // Red: warnings and negative surprises.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const PINK = C.pink || '#F28BB9';
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';

  const SURPRISE = PINK;
  const ECHO = VIOLET;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content between y = -3.0 and 2.3.
  //
  // Formula card and narration pills follow the
  // approved reference lesson's layout.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.60, 0]
    : [4.30, -0.30, 0];

  const AX0 = CX - (P ? 3.10 : 3.15);
  const AX1 = CX + (P ? 3.30 : 3.15);

  const AY0 = P ? -4.15 : -2.10;
  const AY1 = P ? 1.30 : 1.02;

  const DATA_LEFT = AX0 + 0.36;
  const DATA_RIGHT = AX1 - 0.32;

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

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
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

  function dot(p, color, radius = 0.09) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);
    return d;
  }

  function glow(
    p,
    color,
    radius = 0.09,
    opacity = 0.17
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
    width,
    height,
    p,
    color,
    opacity = 0.82
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth: 1.2
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    width,
    height,
    p,
    color,
    opacity = 0.035
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.13,
      color,
      strokeWidth: 1.8
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

    const len = Math.sqrt(
      dx * dx + dy * dy
    );

    if (len < 0.001) {
      return dot(b, color, 0.04);
    }

    const ux = dx / len;
    const uy = dy / len;

    const head = Math.min(
      0.15,
      len * 0.34
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

  function inA(obj, time = 0.48) {
    return new M.FadeIn(obj, {
      runTime: time
    });
  }

  function outA(obj, time = 0.36) {
    return new M.FadeOut(obj, {
      runTime: time
    });
  }

  // ------------------------------------------------------------
  // Scene object management.
  //
  // Every group is assembled before it is displayed.
  // Never regroup objects already on screen.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(outA(visible[key]));
    }

    if (obj) {
      visible[key] = obj;
      a.push(inA(obj));
    } else {
      delete visible[key];
    }

    return a;
  }

  function remove(...keys) {
    const a = [];

    keys.forEach(key => {
      if (!visible[key]) return;

      a.push(outA(visible[key]));
      delete visible[key];
    });

    return a;
  }

  function clearScene() {
    return remove(
      ...Object.keys(visible)
    );
  }

  function indicate(key, color = AMBER) {
    return visible[key]
      ? [
          new M.Indicate(
            visible[key],
            { color }
          )
        ]
      : [];
  }

  function picture(obj) {
    return [
      ...clearScene(),
      ...put('picture', obj)
    ];
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Same construction as the approved reference lesson.
  // Short lines keep the formula readable on phones.
  //
  // Lines may be strings or [string, colour] pairs.
  // Leading spaces provide indentation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = CYAN) {
    const size = P ? 22 : 21;
    const lh = P ? 0.42 : 0.42;

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

    const maxw = P
      ? FW - 1.20
      : 4.05;

    const maxh = P
      ? 1.30
      : 4.15;

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
  // Opening picture.
  //
  // A schematic hotel and a conference event.
  // The room tiles represent the hotel capacity,
  // not observed occupancy.
  //
  // Do not reveal the week-six count here.
  // ------------------------------------------------------------

  function hotelPicture(question = false) {
    const objects = [];

    const hy = P ? -0.60 : -0.35;

    objects.push(
      rounded(
        4.65,
        2.75,
        [CX, hy, 0],
        CYAN,
        0.025
      ),
      txt(
        'HOTEL',
        20,
        CYAN,
        [CX, hy + 1.67, 0]
      )
    );

    // Five rows of eight room tiles = forty rooms.

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const x =
          CX + (col - 3.5) * 0.51;

        const y =
          hy + (2 - row) * 0.44;

        objects.push(
          rounded(
            0.39,
            0.33,
            [x, y, 0],
            C.muted,
            0.13
          )
        );
      }
    }

    objects.push(
      txt(
        '40 rooms available',
        15,
        C.muted,
        [CX, hy - 1.70, 0]
      ),
      tag(
        'WEEK 6: CONFERENCE',
        SURPRISE,
        [CX, hy - 2.25, 0],
        17
      )
    );

    if (question) {
      objects.push(
        tag(
          'WILL ITS EFFECT LAST?',
          AMBER,
          [
            CX,
            P ? 1.55 : 1.47,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Main hotel chart.
  //
  // Horizontal axis: weeks 1–8.
  // Vertical axis: occupied rooms, 0–40.
  // ------------------------------------------------------------

  function axes() {
    const objects = [
      ln(
        [AX0, AY0, 0],
        [AX1, AY0, 0],
        C.muted,
        2.4
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
          [AX0 - 0.27, y, 0],
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
        13,
        C.muted,
        [AX0 + 0.30, AY1 + 0.12, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.24, AY0 - 0.63, 0]
      ),
      txt(
        'Christmas',
        P ? 12 : 11,
        AMBER,
        [X(7), AY0 - 0.63, 0]
      ),
      txt(
        'New Year',
        P ? 12 : 11,
        AMBER,
        [X(8), AY0 - 0.63, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function observedSeries(
    n = 5,
    labels = true,
    lastWhite = false
  ) {
    // Guard against revealing holiday observations.

    n = Math.min(n, 6);

    const objects = [];

    for (let week = 2; week <= n; week++) {
      objects.push(
        ln(
          pt(
            week - 1,
            DATA[week - 2]
          ),
          pt(
            week,
            DATA[week - 1]
          ),
          lastWhite && week === n
            ? WHITE
            : CYAN,
          2.8
        )
      );
    }

    for (let week = 1; week <= n; week++) {
      const color =
        lastWhite && week === n
          ? WHITE
          : CYAN;

      const value = DATA[week - 1];

      objects.push(
        glow(
          pt(week, value),
          color,
          0.087,
          0.18
        )
      );

      if (labels) {
        objects.push(
          txt(
            String(value),
            15,
            color,
            [
              X(week),
              Y(value) + (value < USUAL ? -0.25 : 0.25),
              0
            ],
            true
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function legend(items) {
    const objects = [];

    const spacing =
      items.length === 4
        ? 1.48
        : items.length === 3
          ? 1.90
          : 2.35;

    const y = P ? 1.73 : 1.43;

    items.forEach(([name, color, style], i) => {
      const x =
        CX +
        (i - (items.length - 1) / 2) *
        spacing;

      const t = T(name, 12, color);

      const width =
        t.getWidth() + 0.39;

      const left = x - width / 2;

      let mark;

      if (style === 'dashed') {
        mark = dash(
          [left, y, 0],
          [left + 0.28, y, 0],
          color
        );
      } else if (style === 'block') {
        mark = rect(
          0.25,
          0.15,
          [left + 0.125, y, 0],
          color,
          0.85
        );
      } else {
        mark = ln(
          [left, y, 0],
          [left + 0.28, y, 0],
          color,
          3
        );
      }

      t.moveTo([
        left + 0.39 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(mark, t);
    });

    return new M.VGroup(...objects);
  }

  const COUNT_LEGEND = [
    'Count',
    CYAN,
    'solid'
  ];

  const FORECAST_LEGEND = [
    'Forecast',
    AMBER,
    'dashed'
  ];

  const SURPRISE_LEGEND = [
    'Surprise',
    SURPRISE,
    'block'
  ];

  const ECHO_LEGEND = [
    'Echo',
    ECHO,
    'block'
  ];

  const ACTUAL_LEGEND = [
    'Revealed',
    WHITE,
    'solid'
  ];

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

  function hiddenWeeks(weeks) {
    const objects = [];

    weeks.forEach(week => {
      const bottom = AY0 + 0.10;
      const top = AY1 - 0.12;

      objects.push(
        rounded(
          STEP * 0.76,
          top - bottom,
          [
            X(week),
            (top + bottom) / 2,
            0
          ],
          C.muted,
          0.10
        ),
        tag(
          '?',
          C.muted,
          [
            X(week),
            AY0 + 0.43,
            0
          ],
          15
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function usualGuide() {
    return new M.VGroup(
      dash(
        [AX0 + 0.02, Y(USUAL), 0],
        [AX1, Y(USUAL), 0],
        WHITE
      ),
      tag(
        'USUAL 22',
        WHITE,
        [
          X(1) + 0.42,
          Y(USUAL) - 0.88,
          0
        ],
        15
      )
    );
  }

  function chart(
    known = 5,
    usual = true,
    hidden = [6, 7, 8],
    legendItems = [COUNT_LEGEND]
  ) {
    const a = [
      ...clearScene(),
      ...put('axes', axes()),
      ...put(
        'series',
        observedSeries(known)
      ),
      ...put(
        'now',
        nowDivider(known)
      ),
      ...put(
        'legend',
        legend(legendItems)
      )
    ];

    if (usual) {
      a.push(
        ...put(
          'usual',
          usualGuide()
        )
      );
    }

    if (hidden.length) {
      a.push(
        ...put(
          'hidden',
          hiddenWeeks(hidden)
        )
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Forecast markers.
  //
  // The amber ring is an expected count, not an
  // observation.
  //
  // No function below reads DATA[6] or DATA[7].
  // Both holiday actuals remain hidden.
  // ------------------------------------------------------------

  function forecastPoint(
    week,
    value,
    label = null,
    offset = -0.36
  ) {
    const p = pt(week, value);

    const objects = [
      ring(p, AMBER, 0.16),
      dot(p, AMBER, 0.05)
    ];

    if (label !== false) {
      objects.push(
        tag(
          label === null
            ? fmt(value)
            : label,
          AMBER,
          [
            X(week),
            Y(value) + offset,
            0
          ],
          18
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function forecastSegment(
    fromWeek,
    fromValue,
    week,
    value,
    label = null
  ) {
    return new M.VGroup(
      dash(
        pt(fromWeek, fromValue),
        pt(week, value),
        AMBER
      ),
      forecastPoint(
        week,
        value,
        label,
        week === 6 ? -0.56 : 0.53
      )
    );
  }

  // ------------------------------------------------------------
  // A surprise is the gap from the EXPECTED count.
  //
  // This distinction is central:
  //
  // Week 6 actual - usual = 29 - 22 = 7.
  //
  // But week 6 surprise = 29 - 23 = 6.
  //
  // Do not use the seven-room gap as the innovation.
  // ------------------------------------------------------------

  function bracket(
    week,
    expected,
    actual,
    color = SURPRISE,
    side = 1,
    label = true,
    labelAt = null
  ) {
    const x =
      X(week) + side * 0.22;

    const low =
      Y(Math.min(expected, actual));

    const high =
      Y(Math.max(expected, actual));

    const objects = [];

    if (Math.abs(actual - expected) < 0.001) {
      objects.push(
        tag(
          '0',
          color,
          [x, high + 0.20, 0],
          14
        )
      );
    } else {
      objects.push(
        ln(
          [x, low, 0],
          [x, high, 0],
          color,
          3
        ),
        ln(
          [x - 0.07, low, 0],
          [x + 0.07, low, 0],
          color,
          2
        ),
        ln(
          [x - 0.07, high, 0],
          [x + 0.07, high, 0],
          color,
          2
        )
      );

      if (label) {
        objects.push(
          tag(
            signed(actual - expected),
            color,
            labelAt || [
              x + side * 0.26,
              (low + high) / 2 + 0.08,
              0
            ],
            18
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function gapFill(
    week,
    from,
    to,
    color,
    opacity = 0.76
  ) {
    const lo = Y(Math.min(from, to));
    const hi = Y(Math.max(from, to));

    if (hi - lo < 0.001) {
      return ln(
        [
          X(week) - STEP * 0.20,
          lo,
          0
        ],
        [
          X(week) + STEP * 0.20,
          lo,
          0
        ],
        color,
        2
      );
    }

    return rect(
      STEP * 0.42,
      hi - lo,
      [
        X(week),
        (lo + hi) / 2,
        0
      ],
      color,
      opacity
    );
  }

  function chartBlocks(
    week,
    base,
    count,
    color
  ) {
    const objects = [];

    const pitch = Y(1) - Y(0);
    const width = STEP * 0.48;

    for (let j = 0; j < count; j++) {
      objects.push(
        rect(
          width,
          pitch * 0.83,
          [
            X(week),
            Y(base + j + 0.5),
            0
          ],
          color,
          0.90
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function surprise5Picture(withLabel = true) {
    return new M.VGroup(
      gapFill(
        5,
        FORECAST_5,
        DATA[4],
        SURPRISE,
        0.65
      ),
      bracket(
        5,
        FORECAST_5,
        DATA[4],
        SURPRISE,
        -1,
        withLabel
      )
    );
  }

  function surprise6Picture(withLabel = true, side = 1, labelAt = null) {
    return new M.VGroup(
      gapFill(
        6,
        FORECAST_6,
        DATA[5],
        SURPRISE,
        0.65
      ),
      bracket(
        6,
        FORECAST_6,
        DATA[5],
        SURPRISE,
        side,
        withLabel,
        labelAt
      )
    );
  }

  // ------------------------------------------------------------
  // Show a short echo across one interval.
  //
  // The arrow points from the previous surprise
  // toward the next week's expectation.
  // ------------------------------------------------------------

  function echoArrow(
    fromWeek,
    toWeek,
    label = '½'
  ) {
    const y = AY0 + 0.94;

    const a = [
      X(fromWeek),
      y,
      0
    ];

    const b = [
      X(toWeek),
      y,
      0
    ];

    return new M.VGroup(
      arrow(
        a,
        b,
        ECHO,
        3.2
      ),
      tag(label, ECHO, [b[0], y + 0.31, 0], 18)
    );
  }

  // ------------------------------------------------------------
  // Magnified echo-sharing picture.
  //
  // Old surprise of 2 rooms:
  // Take one of two blocks.
  //
  // Old surprise of 6 rooms:
  // Take three of six blocks.
  //
  // The source surprise remains unchanged.
  // A weighted copy becomes the next week's echo.
  // ------------------------------------------------------------

  const EB = P ? -3.45 : -2.15;
  const EP = P ? 0.67 : 0.46;

  const EL = CX - 1.55;
  const ER = CX + 1.55;

  function echoBlock(
    x,
    j,
    color,
    opacity = 0.88
  ) {
    return rect(
      0.94,
      EP * 0.83,
      [
        x,
        EB + (j + 0.5) * EP,
        0
      ],
      color,
      opacity
    );
  }

  function echoSharing(
    surprise,
    fromWeek,
    toWeek,
    selected = false,
    copied = false
  ) {
    const objects = [];

    const half = surprise / 2;

    objects.push(
      txt(
        'A SHORT ECHO OF THE SURPRISE',
        P ? 18 : 17,
        ECHO,
        [
          CX,
          P ? 1.43 : 1.32,
          0
        ]
      ),
      ln(
        [EL - 0.65, EB, 0],
        [ER + 0.65, EB, 0],
        C.muted,
        1.8
      )
    );

    for (let j = 0; j < surprise; j++) {
      objects.push(
        echoBlock(
          EL,
          j,
          SURPRISE,
          selected && j >= half
            ? 0.20
            : 0.90
        )
      );
    }

    objects.push(
      txt(
        `+${surprise}`,
        21,
        SURPRISE,
        [
          EL,
          EB + surprise * EP + 0.29,
          0
        ],
        true
      ),
      txt(
        `Week ${fromWeek} surprise`,
        15,
        SURPRISE,
        [
          EL,
          EB - 0.35,
          0
        ]
      ),
      txt(
        `Week ${toWeek} echo`,
        15,
        ECHO,
        [
          ER,
          EB - 0.35,
          0
        ]
      ),
      arrow(
        [
          EL + 0.60,
          EB + half * EP / 2,
          0
        ],
        [
          ER - 0.60,
          EB + half * EP / 2,
          0
        ],
        ECHO,
        3.0
      ),
      tag(
        'TAKE HALF',
        ECHO,
        [
          CX,
          EB + half * EP / 2 + 0.37,
          0
        ],
        13
      )
    );

    if (selected) {
      objects.push(
        rounded(
          1.11,
          half * EP + 0.10,
          [
            EL,
            EB + half * EP / 2,
            0
          ],
          WHITE,
          0
        )
      );
    }

    if (copied) {
      for (let j = 0; j < half; j++) {
        objects.push(
          echoBlock(
            ER,
            j,
            ECHO,
            0.95
          )
        );
      }

      objects.push(
        txt(
          `+${fmt(half)}`,
          22,
          ECHO,
          [
            ER,
            EB + half * EP + 0.28,
            0
          ],
          true
        )
      );
    } else {
      objects.push(
        tag(
          '?',
          ECHO,
          [
            ER,
            EB + 0.35,
            0
          ],
          18
        )
      );
    }

    objects.push(
      txt(
        '1 block = 1 room',
        14,
        C.muted,
        [
          CX,
          EB - 0.77,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Animated copies of the selected surprise blocks.
  //
  // Each copy is created independently.
  // The original surprise blocks remain visible.
  // ------------------------------------------------------------

  let echoCopies = [];

  function makeEchoCopies(count) {
    const a = [];

    for (let j = 0; j < count; j++) {
      const obj = echoBlock(
        EL,
        j,
        SURPRISE,
        0.96
      );

      echoCopies.push({
        obj,
        index: j
      });

      visible['echoCopy' + j] = obj;

      a.push(inA(obj, 0.22));
    }

    return a;
  }

  function moveEchoCopies() {
    const moves = echoCopies.map(item =>
      new M.Transform(
        item.obj,
        echoBlock(
          ER,
          item.index,
          ECHO,
          0.96
        ),
        {
          pathArc: -0.55,
          runTime: 0.75
        }
      )
    );

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0.18,
        runTime: 1.15
      }
    );
  }

  function clearEchoCopies() {
    const a = remove(
      ...echoCopies.map(
        item => 'echoCopy' + item.index
      )
    );

    echoCopies = [];

    return a;
  }

  // ------------------------------------------------------------
  // Room-count decomposition picture.
  //
  // The magnified local scale starts at 21, not zero.
  //
  // A white guide marks the usual count of 22.
  //
  // Violet blocks extend the estimate from 22 to 23.
  // Pink blocks extend the real count from 23 to 29.
  //
  // It is essential that the old echo and the fresh
  // surprise occupy separate, non-overlapping portions.
  // ------------------------------------------------------------

  const DB = P ? -3.65 : -2.18;
  const DS = P ? 0.52 : 0.34;

  const DY = rooms =>
    DB + (rooms - 21) * DS;

  const BUILD_X = CX - 0.25;
  const BUILD_W = 1.05;

  function decomposition(
    echo,
    fresh = null,
    totalLabel = true,
    future = false
  ) {
    const objects = [];

    const expected = USUAL + echo;

    const finalCount =
      fresh === null
        ? expected
        : expected + fresh;

    const axisX = CX - 2.05;

    objects.push(
      txt(
        future
          ? 'BUILD THE CHRISTMAS FORECAST'
          : 'BUILD THE ROOM COUNT',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.48 : 1.35,
          0
        ]
      ),
      ln(
        [axisX, DY(21), 0],
        [axisX, DY(30), 0],
        C.muted,
        1.6
      )
    );

    for (let v = 21; v <= 30; v++) {
      objects.push(
        ln(
          [axisX - 0.055, DY(v), 0],
          [axisX + 0.055, DY(v), 0],
          C.muted,
          1.1
        ),
        txt(
          String(v),
          14,
          C.muted,
          [
            axisX - 0.28,
            DY(v),
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        12,
        C.muted,
        [
          axisX,
          DY(30) + 0.25,
          0
        ]
      ),
      dash(
        [axisX + 0.08, DY(USUAL), 0],
        [CX + 2.60, DY(USUAL), 0],
        WHITE
      ),
      tag(
        'USUAL 22',
        WHITE,
        [
          CX + 1.42,
          DY(USUAL) - 0.28,
          0
        ],
        14
      )
    );

    // Earlier surprise's echo.

    for (let j = 0; j < echo; j++) {
      objects.push(
        rect(
          BUILD_W,
          DS * 0.83,
          [
            BUILD_X,
            DY(USUAL + j + 0.5),
            0
          ],
          ECHO,
          0.92
        )
      );
    }

    if (echo > 0) {
      objects.push(
        txt(
          `+${fmt(echo)} echo`,
          17,
          ECHO,
          [
            CX + 1.23,
            DY(USUAL + echo / 2),
            0
          ]
        )
      );
    }

    // Expected value before this week's fresh surprise.

    objects.push(
      dash(
        [
          axisX + 0.08,
          DY(expected),
          0
        ],
        [
          BUILD_X + BUILD_W / 2 + 0.10,
          DY(expected),
          0
        ],
        AMBER
      ),
      ring(
        [
          BUILD_X,
          DY(expected),
          0
        ],
        AMBER,
        0.13
      )
    );

    if (fresh !== null && fresh > 0) {
      for (let j = 0; j < fresh; j++) {
        objects.push(
          rect(
            BUILD_W,
            DS * 0.83,
            [
              BUILD_X,
              DY(expected + j + 0.5),
              0
            ],
            SURPRISE,
            0.90
          )
        );
      }

      objects.push(
        txt(
          `+${fmt(fresh)} fresh`,
          17,
          SURPRISE,
          [
            CX + 1.26,
            DY(expected + fresh / 2),
            0
          ]
        ),
        tag(
          'EXPECTED ' + fmt(expected),
          AMBER,
          [
            CX + 1.55,
            DY(expected) + 0.35,
            0
          ],
          12
        ),
        glow(
          [
            BUILD_X,
            DY(finalCount),
            0
          ],
          WHITE,
          0.11,
          0.21
        )
      );
    }

    if (totalLabel) {
      const color =
        fresh === null
          ? AMBER
          : WHITE;

      objects.push(
        tag(
          fmt(finalCount) + ' ROOMS',
          color,
          [
            BUILD_X,
            DY(finalCount) + 0.34,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Three components of an MA(1) observation.
  //
  // Cards are a conceptual picture before the formula.
  // The numbered version uses the actual week-six
  // decomposition.
  // ------------------------------------------------------------

  function components(
    named = false,
    numbered = false
  ) {
    const objects = [];

    const xs = [
      CX - 2.02,
      CX,
      CX + 2.02
    ];

    const y =
      P ? -0.68 : -0.52;

    const colors = [
      WHITE,
      SURPRISE,
      ECHO
    ];

    const titles = [
      'USUAL',
      'FRESH',
      'OLD ECHO'
    ];

    const values = [
      '22',
      '6',
      '1'
    ];

    objects.push(
      txt(
        named
          ? 'MOVING-AVERAGE ERROR MODEL'
          : 'THREE PARTS OF THE COUNT',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.42 : 1.31,
          0
        ]
      )
    );

    xs.forEach((x, i) => {
      objects.push(
        rounded(
          1.65,
          2.05,
          [x, y, 0],
          colors[i],
          0.05
        ),
        txt(
          titles[i],
          14,
          colors[i],
          [
            x,
            y + 0.70,
            0
          ]
        )
      );

      if (numbered) {
        objects.push(
          txt(
            values[i],
            30,
            colors[i],
            [
              x,
              y + 0.05,
              0
            ],
            true
          )
        );
      } else if (i === 0) {
        objects.push(
          ln(
            [x - 0.55, y - 0.10, 0],
            [x + 0.55, y - 0.10, 0],
            WHITE,
            3.4
          ),
          txt(
            '22',
            23,
            WHITE,
            [
              x,
              y + 0.19,
              0
            ],
            true
          )
        );
      } else if (i === 1) {
        for (let j = 0; j < 3; j++) {
          objects.push(
            rect(
              0.68,
              0.19,
              [
                x,
                y - 0.28 + j * 0.24,
                0
              ],
              SURPRISE,
              0.90
            )
          );
        }
      } else {
        objects.push(
          rect(
            0.68,
            0.24,
            [x, y - 0.03, 0],
            ECHO,
            0.92
          )
        );
      }

      const sub = [
        'baseline',
        'this week',
        '½ × last surprise'
      ][i];

      objects.push(
        txt(
          sub,
          i === 2 ? 11 : 13,
          colors[i],
          [
            x,
            y - 0.66,
            0
          ]
        )
      );
    });

    objects.push(
      txt(
        '+',
        22,
        C.ink,
        [
          (xs[0] + xs[1]) / 2,
          y,
          0
        ]
      ),
      txt(
        '+',
        22,
        C.ink,
        [
          (xs[1] + xs[2]) / 2,
          y,
          0
        ]
      )
    );

    if (named) {
      objects.push(
        tag(
          'MA(1)',
          GREEN,
          [
            CX,
            y - 1.45,
            0
          ],
          22
        ),
        txt(
          'one earlier surprise',
          15,
          GREEN,
          [
            CX,
            y - 1.93,
            0
          ]
        )
      );
    }

    if (numbered) {
      objects.push(
        tag(
          '= 29 ROOMS',
          WHITE,
          [
            CX,
            y - 1.46,
            0
          ],
          19
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Future-surprise picture.
  //
  // The possible upward and downward values are
  // schematic, not actual future room observations.
  //
  // Expected future surprise = zero.
  // Actual future surprise remains unknown.
  // ------------------------------------------------------------

  function futureSurprises(expectedZero = false) {
    const objects = [];

    const y = P ? -0.65 : -0.38;

    const x1 = CX - 1.48;
    const x2 = CX + 1.48;

    const pitch = P ? 0.52 : 0.39;

    objects.push(
      txt(
        'FUTURE SURPRISES ARE UNKNOWN',
        19,
        AMBER,
        [
          CX,
          P ? 1.46 : 1.33,
          0
        ]
      ),
      ln(
        [CX - 2.67, y, 0],
        [CX + 2.67, y, 0],
        WHITE,
        1.8
      ),
      txt(
        '0',
        17,
        WHITE,
        [
          CX - 2.85,
          y,
          0
        ],
        true
      )
    );

    for (let j = 0; j < 2; j++) {
      objects.push(
        rect(
          0.80,
          pitch * 0.83,
          [
            x1,
            y + (j + 0.5) * pitch,
            0
          ],
          SURPRISE,
          expectedZero ? 0.25 : 0.85
        ),
        rect(
          0.80,
          pitch * 0.83,
          [
            x2,
            y - (j + 0.5) * pitch,
            0
          ],
          RED,
          expectedZero ? 0.25 : 0.85
        )
      );
    }

    objects.push(
      txt(
        'could add rooms',
        15,
        SURPRISE,
        [
          x1,
          y + 2 * pitch + 0.29,
          0
        ]
      ),
      txt(
        'could take rooms away',
        15,
        RED,
        [
          x2,
          y - 2 * pitch - 0.30,
          0
        ]
      )
    );

    if (expectedZero) {
      objects.push(
        glow(
          [CX, y, 0],
          GREEN,
          0.14,
          0.22
        ),
        tag(
          'BEST GUESS: 0',
          GREEN,
          [
            CX,
            y - 0.57,
            0
          ],
          18
        ),
        txt(
          'not a promise of no surprise',
          14,
          C.muted,
          [
            CX,
            P ? -3.72 : -2.45,
            0
          ]
        )
      );
    } else {
      objects.push(
        tag(
          '?',
          AMBER,
          [
            CX,
            y - 0.52,
            0
          ],
          19
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Forecast timeline.
  //
  // Known at the end of week six:
  // innovation_6 = +6.
  //
  // Week 7 gets half of this known innovation = +3.
  //
  // Week 8 cannot receive a direct echo from week 6.
  // It would receive half of week 7's innovation,
  // but that innovation is not known yet.
  //
  // The original forecasts remain fixed at week six.
  // ------------------------------------------------------------

  function echoTimeline(stage = 0) {
    const objects = [];

    const xs = [
      CX - 2.02,
      CX,
      CX + 2.02
    ];

    const base = P ? -3.05 : -1.95;
    const pitch = P ? 0.55 : 0.40;

    const labelY =
      P ? 1.44 : 1.33;

    objects.push(
      txt(
        'HOW LONG DOES THE KNOWN ECHO LAST?',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          labelY,
          0
        ]
      ),
      ln(
        [xs[0] - 0.65, base, 0],
        [xs[2] + 0.65, base, 0],
        C.muted,
        1.8
      )
    );

    // Week six's known conference surprise.

    for (let j = 0; j < 6; j++) {
      objects.push(
        rect(
          0.82,
          pitch * 0.83,
          [
            xs[0],
            base + (j + 0.5) * pitch,
            0
          ],
          SURPRISE,
          0.91
        )
      );
    }

    objects.push(
      txt(
        '+6',
        20,
        SURPRISE,
        [
          xs[0],
          base + 6 * pitch + 0.28,
          0
        ],
        true
      ),
      txt(
        'Week 6',
        15,
        SURPRISE,
        [
          xs[0],
          base - 0.35,
          0
        ]
      ),
      txt(
        'Christmas',
        15,
        AMBER,
        [
          xs[1],
          base - 0.35,
          0
        ]
      ),
      txt(
        'New Year',
        15,
        AMBER,
        [
          xs[2],
          base - 0.35,
          0
        ]
      )
    );

    // One-week echo of three rooms.

    for (let j = 0; j < 3; j++) {
      objects.push(
        rect(
          0.82,
          pitch * 0.83,
          [
            xs[1],
            base + (j + 0.5) * pitch,
            0
          ],
          ECHO,
          0.93
        )
      );
    }

    objects.push(
      txt(
        '+3',
        20,
        ECHO,
        [
          xs[1],
          base + 3 * pitch + 0.28,
          0
        ],
        true
      ),
      arrow(
        [
          xs[0] + 0.54,
          base + 1.3 * pitch,
          0
        ],
        [
          xs[1] - 0.54,
          base + 1.3 * pitch,
          0
        ],
        ECHO,
        3.0
      ),
      txt(
        '½',
        17,
        ECHO,
        [
          (xs[0] + xs[1]) / 2,
          base + 1.3 * pitch + 0.27,
          0
        ],
        true
      )
    );

    // Stop the known conference echo after one week.

    const stopX =
      (xs[1] + xs[2]) / 2;

    objects.push(
      ln(
        [
          stopX,
          base + 0.10,
          0
        ],
        [
          stopX,
          base + 3.65 * pitch,
          0
        ],
        RED,
        3
      ),
      txt(
        'STOP',
        13,
        RED,
        [
          stopX,
          base + 3.65 * pitch + 0.24,
          0
        ]
      ),
      ring(
        [xs[2], base, 0],
        ECHO,
        0.13
      ),
      txt(
        '0',
        22,
        ECHO,
        [
          xs[2],
          base + 0.30,
          0
        ],
        true
      )
    );

    if (stage >= 1) {
      const qy =
        P ? 0.83 : 0.77;

      objects.push(
        tag(
          'NEW SURPRISE: ?',
          SURPRISE,
          [
            xs[1] + 0.22,
            qy,
            0
          ],
          13
        ),
        dash(
          [
            xs[1] + 0.75,
            qy - 0.22,
            0
          ],
          [
            xs[2],
            qy - 0.72,
            0
          ],
          SURPRISE
        ),
        txt(
          'not known yet',
          13,
          C.muted,
          [
            xs[2],
            qy - 1.02,
            0
          ]
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        tag(
          'EXPECTED FUTURE SURPRISE = 0',
          GREEN,
          [
            CX,
            base - 0.85,
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Compare the response to one isolated surprise.
  //
  // MA(1):
  // A six-room shock contributes:
  // 6, 3, 0, 0, 0, 0, 0.
  //
  // AR(2), using the preceding lesson's weights:
  //
  // response[h] =
  //   0.5 × response[h - 1]
  //   + 0.25 × response[h - 2].
  //
  // Start with response[0] = 6.
  // Assume no earlier effect and no further shocks.
  //
  // Values:
  // 6, 3, 3, 2.25, 1.875, 1.5, 1.21875.
  //
  // This is an illustrative response to a single shock,
  // not additional observed hotel room counts.
  // ------------------------------------------------------------

  const RESPONSE_MA = [
    6, 3, 0, 0, 0, 0, 0
  ];

  const RESPONSE_AR = [6];

  for (let h = 1; h <= 6; h++) {
    RESPONSE_AR.push(
      0.5 * RESPONSE_AR[h - 1] +
      0.25 * (
        h >= 2
          ? RESPONSE_AR[h - 2]
          : 0
      )
    );
  }

  function responsePicture(compare = false) {
    const objects = [];

    const left = CX - 2.72;
    const right = CX + 2.73;

    const bottom = P ? -3.55 : -2.10;
    const top = P ? 0.85 : 0.65;

    const xx = h =>
      left + 0.27 +
      h / 6 * (
        right - left - 0.52
      );

    const yy = v =>
      bottom +
      v / 6 * (top - bottom);

    objects.push(
      txt(
        compare
          ? 'ONE SHOCK: TWO DIFFERENT ECHOES'
          : 'MA(1): THE ECHO ENDS',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.54 : 1.37,
          0
        ]
      ),
      ln(
        [left, bottom, 0],
        [right, bottom, 0],
        C.muted,
        2
      ),
      ln(
        [left, bottom, 0],
        [left, top, 0],
        C.muted,
        1.5
      )
    );

    [0, 2, 4, 6].forEach(v => {
      objects.push(
        ln(
          [
            left - 0.06,
            yy(v),
            0
          ],
          [
            left + 0.06,
            yy(v),
            0
          ],
          C.muted,
          1.2
        ),
        txt(
          String(v),
          13,
          C.muted,
          [
            left - 0.25,
            yy(v),
            0
          ],
          true
        )
      );
    });

    for (let h = 0; h <= 6; h++) {
      objects.push(
        txt(
          String(h),
          14,
          C.muted,
          [
            xx(h),
            bottom - 0.27,
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        'weeks after the surprise',
        14,
        C.muted,
        [
          CX,
          bottom - 0.63,
          0
        ]
      )
    );

    // MA response: exact zero after one later week.

    for (let h = 1; h <= 6; h++) {
      objects.push(
        ln(
          [
            xx(h - 1),
            yy(RESPONSE_MA[h - 1]),
            0
          ],
          [
            xx(h),
            yy(RESPONSE_MA[h]),
            0
          ],
          ECHO,
          3.2
        )
      );
    }

    RESPONSE_MA.forEach((v, h) => {
      objects.push(
        dot(
          [xx(h), yy(v), 0],
          ECHO,
          0.076
        )
      );

      if (h <= 2) {
        objects.push(
          txt(
            String(v),
            15,
            ECHO,
            [
              xx(h),
              yy(v) + 0.25,
              0
            ],
            true
          )
        );
      }
    });

    objects.push(
      tag(
        'ENDS HERE',
        ECHO,
        [
          xx(2) + 0.45,
          yy(0) + 0.47,
          0
        ],
        13
      )
    );

    if (compare) {
      for (let h = 1; h <= 6; h++) {
        objects.push(
          ln(
            [
              xx(h - 1),
              yy(RESPONSE_AR[h - 1]),
              0
            ],
            [
              xx(h),
              yy(RESPONSE_AR[h]),
              0
            ],
            CYAN,
            2.8
          )
        );
      }

      RESPONSE_AR.forEach((v, h) => {
        objects.push(
          dot(
            [
              xx(h),
              yy(v),
              0
            ],
            CYAN,
            0.067
          )
        );
      });

      objects.push(
        txt(
          'AR(2): fades gradually',
          14,
          CYAN,
          [
            CX + 0.90,
            yy(4.4),
            0
          ]
        ),
        tag(
          'MA(1)',
          ECHO,
          [
            xx(4) + 0.27,
            yy(0) + 0.25,
            0
          ],
          12
        )
      );
    } else {
      objects.push(
        txt(
          'effect of the original surprise',
          13,
          ECHO,
          [
            CX + 0.65,
            yy(4.4),
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Earlier four-week moving average.
  //
  // This is the method from lesson 11.2.3.
  //
  // It uses four raw counts:
  // 20, 23, 24, 29.
  //
  // Their mean is 24.
  //
  // It does not use forecast errors.
  // ------------------------------------------------------------

  function movingAverageWindow() {
    const left =
      X(3) - STEP * 0.44;

    const right =
      X(6) + STEP * 0.44;

    const bottom = AY0 + 0.10;
    const top = AY1 - 0.12;

    const objects = [
      rounded(
        right - left,
        top - bottom,
        [
          (left + right) / 2,
          (top + bottom) / 2,
          0
        ],
        ECHO,
        0.035
      ),
      tag(
        'FOUR-WEEK WINDOW',
        ECHO,
        [
          (left + right) / 2,
          bottom + 0.34,
          0
        ],
        13
      )
    ];

    for (let week = 3; week <= 6; week++) {
      objects.push(
        tag(
          '¼',
          GREEN,
          [
            X(week),
            AY0 + 1.01,
            0
          ],
          16
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function methodContrast(errorModel = false) {
    const objects = [];

    const yTop = P ? 0.96 : 1.03;
    const yBottom = P ? -1.63 : -1.20;

    const counts = [
      20, 23, 24, 29
    ];

    const countXs = counts.map(
      (_, i) => CX + (i - 1.5) * 1.19
    );

    objects.push(
      txt(
        'MOVING AVERAGE OF COUNTS',
        17,
        errorModel ? C.muted : CYAN,
        [
          CX,
          yTop + 0.49,
          0
        ]
      )
    );

    counts.forEach((v, i) => {
      objects.push(
        rounded(
          0.95,
          0.72,
          [
            countXs[i],
            yTop - 0.30,
            0
          ],
          errorModel ? C.muted : CYAN,
          errorModel ? 0.025 : 0.08
        ),
        txt(
          String(v),
          22,
          errorModel ? C.muted : CYAN,
          [
            countXs[i],
            yTop - 0.30,
            0
          ],
          true
        ),
        txt(
          '¼',
          15,
          errorModel ? C.muted : GREEN,
          [
            countXs[i],
            yTop - 0.91,
            0
          ],
          true
        )
      );
    });

    objects.push(
      ln(
        [CX - 2.70, (yTop + yBottom) / 2, 0],
        [CX + 2.70, (yTop + yBottom) / 2, 0],
        C.muted,
        1.3
      ),
      txt(
        'MOVING-AVERAGE ERROR MODEL',
        17,
        errorModel ? SURPRISE : C.muted,
        [
          CX,
          yBottom + 0.47,
          0
        ]
      )
    );

    const e5x = CX - 1.30;
    const e6x = CX + 1.30;

    [
      {
        x: e5x,
        week: 5,
        expression: '24 − 22',
        value: '+2'
      },
      {
        x: e6x,
        week: 6,
        expression: '29 − 23',
        value: '+6'
      }
    ].forEach(item => {
      objects.push(
        rounded(
          2.22,
          1.02,
          [
            item.x,
            yBottom - 0.33,
            0
          ],
          errorModel ? SURPRISE : C.muted,
          errorModel ? 0.06 : 0.015
        ),
        txt(
          `W${item.week}: ${item.expression}`,
          15,
          errorModel ? C.ink : C.muted,
          [
            item.x,
            yBottom - 0.11,
            0
          ],
          true
        ),
        txt(
          item.value,
          22,
          errorModel ? SURPRISE : C.muted,
          [
            item.x,
            yBottom - 0.55,
            0
          ],
          true
        )
      );
    });

    objects.push(
      tag(
        errorModel
          ? 'USE THE SURPRISES'
          : 'NOT THE SAME RULE',
        errorModel ? GREEN : AMBER,
        [
          CX,
          P ? -3.55 : -2.55,
          0
        ],
        15
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Complete holiday forecast chart.
  //
  // Only known observations through week six.
  //
  // Forecast 25 for Christmas.
  // Forecast 22 for New Year.
  //
  // Both actual holiday counts remain unknown.
  // ------------------------------------------------------------

  function holidayForecastChart(
    showNewYear = true,
    showSurprise = true
  ) {
    const a = [
      ...chart(
        6,
        true,
        showNewYear ? [] : [8],
        [
          COUNT_LEGEND,
          SURPRISE_LEGEND,
          ECHO_LEGEND,
          FORECAST_LEGEND
        ]
      ),
      ...put(
        'forecast7',
        forecastSegment(
          6,
          DATA[5],
          7,
          FORECAST_7
        )
      ),
      ...put(
        'echo7',
        chartBlocks(
          7,
          USUAL,
          ECHO_7,
          ECHO
        )
      ),
      ...put(
        'echoArrow7',
        echoArrow(6, 7)
      )
    ];

    if (showSurprise) {
      a.push(
        ...put(
          'forecast6',
          forecastPoint(
            6,
            FORECAST_6,
            '23',
            -0.36
          )
        ),
        ...put(
          'surprise6',
          surprise6Picture(true, -1, [X(6) - 0.60, Y(FORECAST_6) - 0.30, 0])
        )
      );
    }

    if (showNewYear) {
      a.push(
        ...put(
          'forecast8',
          forecastSegment(
            7,
            FORECAST_7,
            8,
            FORECAST_8
          )
        ),
        ...put(
          'zeroEcho',
          tag(
            'NO ECHO',
            ECHO,
            [
              X(8) - 0.22,
              AY0 + 0.44,
              0
            ],
            15
          )
        )
      );
    }

    return a;
  }

  // ============================================================
  // 0–3: the conference and the usual room count.
  // ============================================================

  // 0. A conference filled extra rooms in week six.
  //
  // Introduce the event without revealing the actual
  // number of occupied rooms.

  await until(S(0));
  await play(
    ...picture(
      hotelPicture(false)
    ),
    ...say(
      'WEEK 6: A CONFERENCE',
      SURPRISE
    ),
    ...fbox([
      ['HOTEL: 40 ROOMS', CYAN],
      'a conference brings',
      'extra guests'
    ], SURPRISE)
  );

  // 1. How much should the event influence later weeks?

  await until(S(1));
  await play(
    ...put(
      'picture',
      hotelPicture(true)
    ),
    ...say(
      'HOW LONG SHOULD ONE EVENT COUNT?',
      AMBER
    ),
    ...fbox([
      ['ONE UNUSUAL EVENT', SURPRISE],
      'how much should affect',
      'the next Saturdays?'
    ], AMBER)
  );

  // 2. Show cyan dots through week five.
  // All later dots remain hidden.

  await until(S(2));
  await play(
    ...chart(
      5,
      false,
      [6, 7, 8]
    ),
    ...say(
      'SHOW ONLY WEEKS 1–5'
    ),
    ...fbox([
      ['known counts', CYAN],
      '20, 24, 20, 23, 24',
      ['weeks 6–8 hidden', AMBER]
    ])
  );

  // 3. Draw the usual guide at twenty-two rooms.

  await until(S(3));
  await play(
    ...put(
      'usual',
      usualGuide()
    ),
    ...say(
      'USUAL COUNT = 22 ROOMS',
      WHITE
    ),
    ...fbox([
      'long-run average',
      ['22 occupied rooms', WHITE]
    ])
  );

  // ============================================================
  // 4–7: identify the week-five surprise.
  //
  // Actual = 24.
  // Forecast = 22.
  // Surprise = +2.
  // ============================================================

  // 4. Look at the week-five dot at twenty-four.

  await until(S(4));
  await play(
    ...put(
      'focus5',
      ring(
        pt(5, DATA[4]),
        CYAN,
        0.22
      )
    ),
    ...say(
      'WEEK 5 ACTUAL: 24 ROOMS'
    ),
    ...fbox([
      ['week 5 = 24', CYAN],
      'the observed count'
    ])
  );

  // 5. The earlier forecast for week five was 22.

  await until(S(5));
  await play(
    ...put(
      'forecast5',
      forecastPoint(
        5,
        FORECAST_5,
        '22'
      )
    ),
    ...put(
      'legend',
      legend([
        COUNT_LEGEND,
        FORECAST_LEGEND
      ])
    ),
    ...say(
      'WEEK 5 FORECAST WAS 22',
      AMBER
    ),
    ...fbox([
      ['forecast = 22', AMBER],
      ['actual   = 24', CYAN]
    ], AMBER)
  );

  // 6. The unpredictable portion is two rooms.

  await until(S(6));
  await play(
    ...remove('focus5'),
    ...put(
      'surprise5',
      surprise5Picture(true)
    ),
    ...say(
      'THE GUESS MISSED 2 ROOMS',
      SURPRISE
    ),
    ...fbox([
      'actual − forecast',
      ['24 − 22 = +2', SURPRISE]
    ], SURPRISE)
  );

  // 7. Name this part the surprise or innovation.

  await until(S(7));
  await play(
    ...indicate(
      'surprise5',
      SURPRISE
    ),
    ...say(
      'SURPRISE = INNOVATION',
      SURPRISE
    ),
    ...fbox([
      ['SURPRISE (INNOVATION)', SURPRISE],
      'the part the past',
      'could not predict'
    ], SURPRISE)
  );

  // ============================================================
  // 8–12: use the earlier surprise to predict week six.
  //
  // Week 5 surprise = 2.
  // Half of 2 = 1.
  // Week 6 forecast = 22 + 1 = 23.
  // ============================================================

  // 8. Keep the week-six dot hidden.

  await until(S(8));
  await play(
    ...put(
      'futureFocus',
      rounded(
        STEP * 0.83,
        AY1 - AY0 - 0.25,
        [
          X(6),
          (AY1 + AY0) / 2,
          0
        ],
        AMBER,
        0.025
      )
    ),
    ...say(
      'KEEP WEEK 6 HIDDEN',
      AMBER
    ),
    ...fbox([
      ['known surprise = +2', SURPRISE],
      ['week 6 actual = ?', AMBER],
      'forecast first'
    ], AMBER)
  );

  // 9. Imagine a short echo from week five.

  await until(S(9));
  await play(
    ...picture(
      echoSharing(
        SURPRISE_5,
        5,
        6,
        false,
        false
      )
    ),
    ...say(
      'LET THE EARLIER SURPRISE ECHO',
      ECHO
    ),
    ...fbox([
      ['week 5 surprise = 2', SURPRISE],
      'carry a small piece',
      'into week 6'
    ], ECHO)
  );

  // 10. Half of two gives an echo of one room.
  //
  // Select one of the two original blocks,
  // then move a copy into the week-six column.

  await until(S(10));
  await play(
    ...put(
      'picture',
      echoSharing(
        SURPRISE_5,
        5,
        6,
        true,
        false
      )
    ),
    ...makeEchoCopies(1),
    ...say(
      'HALF OF 2 = 1 ROOM',
      ECHO
    ),
    ...fbox([
      ['earlier surprise = 2', SURPRISE],
      ['½ × 2 = 1 room', ECHO]
    ], ECHO)
  );

  await until(S(10) + 1.0);

  await play(
    moveEchoCopies()
  );

  // 11. Stack that room on the usual count of 22.

  await until(S(11));
  await play(
    ...clearEchoCopies(),
    ...picture(
      decomposition(
        ECHO_6,
        null,
        false
      )
    ),
    ...say(
      'ADD THE ECHO TO THE USUAL COUNT',
      ECHO
    ),
    ...fbox([
      ['usual count = 22', WHITE],
      ['earlier echo = +1', ECHO]
    ], ECHO)
  );

  // 12. The two pieces reach 23 before seeing the dot.

  await until(S(12));
  await play(
    ...chart(
      5,
      true,
      [7, 8],
      [
        COUNT_LEGEND,
        FORECAST_LEGEND,
        ECHO_LEGEND
      ]
    ),
    ...put(
      'forecast5',
      forecastPoint(
        5,
        FORECAST_5,
        '22'
      )
    ),
    ...put(
      'surprise5',
      surprise5Picture(true)
    ),
    ...put(
      'forecast6',
      forecastSegment(
        5,
        DATA[4],
        6,
        FORECAST_6
      )
    ),
    ...put(
      'echo6',
      chartBlocks(
        6,
        USUAL,
        ECHO_6,
        ECHO
      )
    ),
    ...put(
      'echoArrow6',
      echoArrow(5, 6)
    ),
    ...say(
      'WEEK 6 FORECAST = 23',
      AMBER
    ),
    ...fbox([
      ['usual 22 + echo 1', ECHO],
      ['expected = 23', AMBER],
      'actual still hidden'
    ], AMBER)
  );

  // ============================================================
  // 13–16: reveal the week-six observation.
  //
  // Actual = 29.
  // Expected = 23.
  // Fresh surprise = 6.
  // ============================================================

  // 13. Reveal week six at twenty-nine.

  await until(S(13));
  await play(
    ...put(
      'series',
      observedSeries(
        6,
        true,
        true
      )
    ),
    ...put(
      'now',
      nowDivider(6)
    ),
    ...put(
      'legend',
      legend([
        COUNT_LEGEND,
        FORECAST_LEGEND,
        ECHO_LEGEND,
        ACTUAL_LEGEND
      ])
    ),
    ...say(
      'WEEK 6 ACTUAL: 29 ROOMS',
      WHITE
    ),
    ...fbox([
      ['expected = 23', AMBER],
      ['actual   = 29', WHITE]
    ])
  );

  // 14. Draw a bracket from the forecast to the real dot.
  //
  // The bracket begins at 23, NOT at the usual count 22.

  await until(S(14));
  await play(
    ...put(
      'surprise6',
      surprise6Picture(false)
    ),
    ...say(
      'MEASURE THE GAP FROM 23 TO 29',
      SURPRISE
    ),
    ...fbox([
      ['real count = 29', WHITE],
      ['expected   = 23', AMBER],
      'measure this gap'
    ], SURPRISE)
  );

  // 15. Subtract twenty-three from twenty-nine.

  await until(S(15));
  await play(
    ...put(
      'surprise6',
      surprise6Picture(true)
    ),
    ...say(
      '29 − 23 = 6 ROOMS',
      SURPRISE
    ),
    ...fbox([
      'surprise = real − forecast',
      ['29 − 23 = +6', SURPRISE]
    ], SURPRISE)
  );

  // 16. The conference surprise is six rooms.

  await until(S(16));
  await play(
    ...indicate(
      'surprise6',
      SURPRISE
    ),
    ...put(
      'conferenceNote',
      tag(
        'CONFERENCE SURPRISE',
        SURPRISE,
        [
          CX - 0.55,
          AY0 + 1.60,
          0
        ],
        14
      )
    ),
    ...say(
      'WEEK 6 SURPRISE = +6',
      SURPRISE
    ),
    ...fbox([
      ['fresh surprise = 6', SURPRISE],
      'not the whole room count',
      'not the gap from 22'
    ], SURPRISE)
  );

  // ============================================================
  // 17–19: identify the moving-average error model.
  //
  // A count has three parts:
  // the usual count,
  // this week's surprise,
  // and a piece of the previous surprise.
  // ============================================================

  // 17. Introduce the three components visually.

  await until(S(17));
  await play(
    ...picture(
      components(
        false,
        false
      )
    ),
    ...say(
      'USUAL COUNT + FRESH SURPRISE + ECHO',
      GREEN
    ),
    ...fbox([
      ['usual count', WHITE],
      ['+ fresh surprise', SURPRISE],
      ['+ earlier echo', ECHO]
    ], GREEN)
  );

  // 18. Name the moving-average error model.

  await until(S(18));
  await play(
    ...put(
      'picture',
      components(
        false,
        false
      )
    ),
    ...say(
      'MOVING-AVERAGE ERROR MODEL',
      GREEN
    ),
    ...fbox([
      ['MOVING-AVERAGE', GREEN],
      ['ERROR MODEL', GREEN],
      'uses past surprises'
    ], GREEN)
  );

  // 19. MA(1) means one earlier surprise.

  await until(S(19));
  await play(
    ...put(
      'picture',
      components(
        true,
        false
      )
    ),
    ...say(
      'MA(1): ONE EARLIER SURPRISE',
      GREEN
    ),
    ...fbox([
      ['MA(1)', GREEN],
      'one earlier surprise',
      'enters the rule'
    ], GREEN)
  );

  // ============================================================
  // 20–22: state the model and check the arithmetic.
  //
  // Room count =
  // usual + fresh surprise + half of last surprise.
  //
  // Week 6:
  // 22 + 6 + 0.5 × 2 = 29.
  // ============================================================

  // 20. Introduce the rule in words.

  await until(S(20));
  await play(
    ...say(
      'HERE IS THE RULE',
      GREEN
    ),
    ...fbox([
      ['ROOM COUNT =', GREEN],
      'three contributions'
    ], GREEN)
  );

  // 21. State the full rule.
  //
  // The current surprise is an unknown part of the
  // observation, not something already known when
  // making a forecast.

  await until(S(21));
  await play(
    ...put(
      'picture',
      components(
        true,
        false
      )
    ),
    ...say(
      'ADD THE FRESH SURPRISE AND HALF THE LAST ONE',
      GREEN
    ),
    ...fbox([
      ['rooms = usual count', WHITE],
      ['+ this week’s surprise', SURPRISE],
      ['+ ½ × last surprise', ECHO]
    ], GREEN)
  );

  // 22. Check the complete week-six decomposition.

  await until(S(22));
  await play(
    ...put(
      'picture',
      decomposition(
        ECHO_6,
        SURPRISE_6,
        true,
        false
      )
    ),
    ...say(
      '22 + 6 + 1 = 29',
      GREEN
    ),
    ...fbox([
      ['usual 22 + fresh 6', SURPRISE],
      ['+ old echo 1', ECHO],
      ['= 29 rooms', WHITE]
    ], GREEN)
  );

  // ============================================================
  // 23–25: forecast from the end of week six.
  //
  // Future surprises may be positive or negative.
  // Their expected value is zero in this model.
  // ============================================================

  // 23. Return to the current forecasting origin.

  await until(S(23));
  await play(
    ...chart(
      6,
      true,
      [7, 8],
      [
        COUNT_LEGEND,
        FORECAST_LEGEND,
        SURPRISE_LEGEND
      ]
    ),
    ...put(
      'forecast6',
      forecastPoint(
        6,
        FORECAST_6,
        '23'
      )
    ),
    ...put(
      'surprise6',
      surprise6Picture(true)
    ),
    ...say(
      'NOW FORECAST FROM THE END OF WEEK 6',
      AMBER
    ),
    ...fbox([
      ['known surprise = +6', SURPRISE],
      ['Christmas = ?', AMBER],
      ['New Year = ?', AMBER]
    ], AMBER)
  );

  // 24. A future surprise may add or remove rooms.

  await until(S(24));
  await play(
    ...picture(
      futureSurprises(false)
    ),
    ...say(
      'A FUTURE SURPRISE CAN GO EITHER WAY',
      SURPRISE
    ),
    ...fbox([
      ['positive: adds rooms', SURPRISE],
      ['negative: takes rooms', RED],
      'not known in advance'
    ], SURPRISE)
  );

  // 25. Use zero as the best guess for a future surprise.
  //
  // Explicitly distinguish an expected value of zero
  // from a claim that future errors cannot occur.

  await until(S(25));
  await play(
    ...put(
      'picture',
      futureSurprises(true)
    ),
    ...say(
      'BEST GUESS FOR A FUTURE SURPRISE = 0',
      GREEN
    ),
    ...fbox([
      ['expected surprise = 0', GREEN],
      'actual surprise',
      'can still be nonzero'
    ], GREEN)
  );

  // ============================================================
  // 26–28: Christmas forecast.
  //
  // Week 6 innovation = 6.
  // One-week echo = half of 6 = 3.
  // Forecast = 22 + 3 = 25.
  // ============================================================

  // 26. Keep half of the known conference surprise.

  await until(S(26));
  await play(
    ...picture(
      echoSharing(
        SURPRISE_6,
        6,
        7,
        true,
        false
      )
    ),
    ...makeEchoCopies(3),
    ...say(
      'KEEP HALF OF THE CONFERENCE SURPRISE',
      ECHO
    ),
    ...fbox([
      ['week 6 surprise = 6', SURPRISE],
      ['keep one half', ECHO]
    ], ECHO)
  );

  // 27. Half of six is three rooms.
  //
  // Move three selected copies into the next week.

  await until(S(27));
  await play(
    moveEchoCopies(),
    ...say(
      'HALF OF 6 = 3 ROOMS',
      ECHO
    ),
    ...fbox([
      ['½ × 6 = 3', ECHO],
      'Christmas echo'
    ], ECHO)
  );

  // 28. Add those three rooms to 22.
  //
  // The forecast is 25 before any Christmas observation.

  await until(S(28));
  await play(
    ...clearEchoCopies(),
    ...picture(
      decomposition(
        ECHO_7,
        null,
        true,
        true
      )
    ),
    ...say(
      '22 + 3 = 25 FOR CHRISTMAS',
      AMBER
    ),
    ...fbox([
      ['usual 22 + echo 3', ECHO],
      ['Christmas forecast = 25', AMBER]
    ], AMBER)
  );

  await until(S(28) + 2.25);

  await play(
    ...holidayForecastChart(
      false,
      true
    )
  );

  // ============================================================
  // 29–31: the New Year forecast.
  //
  // The known conference shock is two weeks back
  // from New Year.
  //
  // MA(1) has only one lag, so its known echo is gone.
  //
  // The Christmas surprise is not yet observed.
  // Its best forecast is zero.
  // ============================================================

  // 29. Show the conference echo ending after one week.

  await until(S(29));
  await play(
    ...picture(
      echoTimeline(0)
    ),
    ...say(
      'THE CONFERENCE ECHO LASTS ONE WEEK',
      ECHO
    ),
    ...fbox([
      ['week 6 surprise: +6', SURPRISE],
      ['week 7 echo: +3', ECHO],
      ['week 8 echo: 0', GREEN]
    ], ECHO)
  );

  // 30. Christmas's own surprise is still unknown.
  //
  // Keep the distinction between an expired known
  // echo and a new, unobserved surprise.

  await until(S(30));
  await play(
    ...put(
      'picture',
      echoTimeline(1)
    ),
    ...say(
      'CHRISTMAS’S OWN SURPRISE IS STILL UNKNOWN',
      SURPRISE
    ),
    ...fbox([
      ['Christmas surprise = ?', SURPRISE],
      'both forecasts are made',
      'at the end of week 6'
    ], AMBER)
  );

  // 31. No known echo remains for New Year.
  // Forecast the usual 22 rooms.

  await until(S(31));
  await play(
    ...holidayForecastChart(
      true,
      true
    ),
    ...say(
      'NEW YEAR FORECAST = 22 ROOMS',
      AMBER
    ),
    ...fbox([
      ['Christmas: 22 + 3 = 25', AMBER],
      ['New Year: 22 + 0 = 22', AMBER],
      'no known echo remains'
    ], AMBER)
  );

  // ============================================================
  // 32–33: compare MA and AR responses.
  //
  // MA(1) has a finite one-week echo.
  // AR(2) propagates a shock through later counts.
  //
  // Neither response plot reveals additional
  // observations from the hotel.
  // ============================================================

  // 32. Use this rule when a surprise has a finite effect.

  await until(S(32));
  await play(
    ...picture(
      responsePicture(false)
    ),
    ...say(
      'USE WHEN A SURPRISE HAS A FIXED-LENGTH EFFECT',
      ECHO
    ),
    ...fbox([
      ['MA(1) RESPONSE', ECHO],
      '6 → 3 → 0 → 0',
      'one-week echo, then stop'
    ], GREEN)
  );

  // 33. Autoregression can let a shock fade gradually.
  //
  // The cyan curve is the isolated-shock response
  // of the preceding lesson's AR(2) coefficients.
  //
  // It is not a plot of new hotel observations.

  await until(S(33));
  await play(
    ...put(
      'picture',
      responsePicture(true)
    ),
    ...say(
      'AR CAN LET THE EFFECT FADE GRADUALLY',
      CYAN
    ),
    ...fbox([
      ['MA: 6 → 3 → 0', ECHO],
      ['AR: 6 → 3 → 3 → 2.25 → …', CYAN],
      'different shock responses'
    ], GREEN)
  );

  // ============================================================
  // 34–36: avoid confusing the two moving averages.
  //
  // Moving average of observations:
  // average the raw room counts.
  //
  // Moving-average error model:
  // use earlier innovations.
  //
  // Innovations are measured relative to their
  // earlier forecasts, not relative to the usual
  // count alone.
  // ============================================================

  // 34. Recall the four-week moving average.

  await until(S(34));
  await play(
    ...chart(
      6,
      false,
      [7, 8]
    ),
    ...put(
      'window',
      movingAverageWindow()
    ),
    ...say(
      'FOUR-WEEK MOVING AVERAGE: EQUAL SAY',
      CYAN
    ),
    ...fbox([
      ['20 + 23 + 24 + 29 = 96', CYAN],
      '96 ÷ 4',
      ['forecast = 24', AMBER]
    ])
  );

  // 35. The similar name is a trap.

  await until(S(35));
  await play(
    ...picture(
      methodContrast(false)
    ),
    ...say(
      'TRAP: SIMILAR NAME, DIFFERENT INPUTS',
      RED
    ),
    ...fbox([
      ['moving average: counts', CYAN],
      ['MA error model: surprises', SURPRISE],
      'not the same method'
    ], RED)
  );

  // 36. MA uses earlier surprises measured
  // from their earlier forecasts.

  await until(S(36));
  await play(
    ...put(
      'picture',
      methodContrast(true)
    ),
    ...say(
      'USE EARLIER SURPRISES, NOT EARLIER COUNTS',
      SURPRISE
    ),
    ...fbox([
      ['week 5: 24 − 22 = 2', SURPRISE],
      ['week 6: 29 − 23 = 6', SURPRISE],
      'actual minus forecast'
    ], GREEN)
  );

  // ============================================================
  // 37. Final recap.
  //
  // The MA(1) forecast uses the known portion of
  // one earlier surprise.
  //
  // It does not recursively apply half to its own
  // previous echo.
  //
  // Christmas forecast = 25.
  // New Year forecast = 22.
  //
  // Both forecasts originate at the end of week six.
  // Both actual holiday counts remain hidden.
  // ============================================================

  await until(S(37));
  await play(
    ...holidayForecastChart(
      true,
      true
    ),
    ...say(
      'MA(1): RECENT SURPRISES WITH SHORT-LIVED ECHOES',
      GREEN
    ),
    ...fbox([
      ['MA(1) FORECASTS', GREEN],
      ['Christmas = 25 rooms', AMBER],
      ['New Year = 22 rooms', AMBER]
    ], GREEN)
  );

  await until(S(37) + 2.60);

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          visible.surprise6,
          { color: SURPRISE }
        ),
        new M.Indicate(
          visible.echo7,
          { color: ECHO }
        ),
        new M.Indicate(
          visible.forecast8,
          { color: AMBER }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.80
      }
    ),
    ...say(
      'SURPRISE 6 → ECHO 3 → NO ECHO',
      GREEN
    ),
    ...fbox([
      ['surprise: actual − forecast', SURPRISE],
      ['one-week echo: ½ × surprise', ECHO],
      ['then the known effect ends', GREEN]
    ], GREEN)
  );

  await until(E(37));
}
