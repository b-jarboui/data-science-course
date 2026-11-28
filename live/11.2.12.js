// lesson 11.2.12
// Dynamic regression: combine known predictors with a rule for predicting errors.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// All 45 sentence beats (0–44) follow the supplied narration.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, P, FW, C, S, E,
    T, pill, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  // Week:       1   2   3   4   5   6   7   8
  // This year: 20  24  20  23  24  29  35  33
  // Last year: 18  21  19  21  22  26  32  30
  //
  // Regression guess:
  //
  //   18 + week number + 6 × holiday switch.
  //
  // Holiday switch:
  //   Weeks 1–6: 0.
  //   Weeks 7–8: 1.
  //
  // Regression guesses:
  //   19, 20, 21, 22, 23, 24, 31, 32.
  //
  // Known regression errors:
  //   +1, +4, −1, +1, +1, +5.
  //
  // Error rule:
  //   next regression error = 0.6 × latest regression error.
  //
  // Christmas:
  //   starting height = 18
  //   week contribution = 7
  //   holiday contribution = 6
  //   regression guess = 18 + 7 + 6 = 31
  //   predicted regression error = 0.6 × 5 = 3
  //   full forecast = 31 + 3 = 34.
  //
  // Christmas actual = 35.
  // Full forecast error = 35 − 34 = 1.
  //
  // IMPORTANT:
  // Regression error and full forecast error are different.
  // Christmas actual is revealed ONLY at beat 40.
  // New Year's actual remains hidden throughout.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const KNOWN = DATA.slice(0, 6);

  const START = 18;
  const WEEK_WEIGHT = 1;
  const HOLIDAY_WEIGHT = 6;
  const ERROR_WEIGHT = 0.6;

  const holiday = week =>
    week === 7 || week === 8 ? 1 : 0;

  const staircase = week =>
    START + WEEK_WEIGHT * week;

  const regression = week =>
    staircase(week) + HOLIDAY_WEIGHT * holiday(week);

  const ERRORS = KNOWN.map(
    (value, i) => value - regression(i + 1)
  );

  const LAST_ERROR = ERRORS[5];
  const NEXT_ERROR = ERROR_WEIGHT * LAST_ERROR;

  const CHRISTMAS_BASE = staircase(7);
  const CHRISTMAS_REGRESSION = regression(7);
  const FORECAST = CHRISTMAS_REGRESSION + NEXT_ERROR;

  const FINAL_ERROR = DATA[6] - FORECAST;

  // ------------------------------------------------------------
  // Colour meanings.
  //
  // Cyan: known room counts.
  // Violet: starting height and week-number staircase.
  // Pink: holiday blocks and holiday switch.
  // Green: positive regression errors and their carryover.
  // Red: negative regression errors and warnings.
  // Amber: full forecast.
  // White: actual Christmas observation.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const VIOLET = C.violet;
  const PINK = C.pink || '#F28BB9';
  const GREEN = C.green;
  const AMBER = C.amber;
  const RED = C.red || '#FF526F';
  const WHITE = '#F0F4FA';

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content between y = -3.0 and 2.3.
  //
  // Preserve the approved reference lesson's pill
  // and formula-card positions.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.3, 0];

  const TITLE_Y = P ? 1.40 : 1.30;

  const AX0 = CX - 3.05;
  const AX1 = CX + 3.15;

  const AY0 = P ? -4.05 : -2.02;
  const AY1 = P ? 1.15 : 1.02;

  const STEP = (AX1 - AX0 - 0.65) / 8;

  // Include a position immediately before week one.
  // That is the regression starting height of 18.

  const X = week =>
    AX0 + 0.32 + week * STEP;

  const Y = rooms =>
    AY0 + rooms / 40 * (AY1 - AY0);

  const pt = (week, rooms) =>
    [X(week), Y(rooms), 0];

  const say = (s, color = CYAN) =>
    showA(s, color, PILL);

  const fmt = v =>
    String(Math.round(v * 100) / 100);

  const signed = v =>
    v > 0
      ? '+' + fmt(v)
      : v < 0
        ? '−' + fmt(-v)
        : '0';

  // ------------------------------------------------------------
  // Basic visual primitives.
  // ------------------------------------------------------------

  function txt(s, size, color, p, mono = false) {
    const t = T(String(s), size, color, mono);
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

  function dot(p, color, radius = 0.085, opacity = 1) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, opacity);
    return d;
  }

  function glow(p, color, radius = 0.085) {
    return new M.VGroup(
      dot(p, color, radius * 1.9, 0.17),
      dot(p, color, radius)
    );
  }

  function ring(p, color, radius = 0.16) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.2
    });

    r.setFill(color, 0);
    r.moveTo(p);
    return r;
  }

  function rect(w, h, p, color, opacity = 0.84) {
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

  function rounded(w, h, p, color, opacity = 0.035) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 1.8
    });

    r.setFill(color, opacity);
    r.moveTo(p);
    return r;
  }

  function tag(s, color, p, size = 15) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function arrow(a, b, color, width = 2.8) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.001) {
      return dot(b, color, 0.045);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.14, len * 0.35);
    const w = h * 0.65;

    return new M.VGroup(
      ln(a, b, color, width),
      ln(
        [
          b[0] - ux * h - uy * w,
          b[1] - uy * h + ux * w,
          0
        ],
        b,
        color,
        width
      ),
      ln(
        [
          b[0] - ux * h + uy * w,
          b[1] - uy * h - ux * w,
          0
        ],
        b,
        color,
        width
      )
    );
  }

  const fadeIn = (obj, time = 0.45) =>
    new M.FadeIn(obj, { runTime: time });

  const fadeOut = (obj, time = 0.35) =>
    new M.FadeOut(obj, { runTime: time });

  // ------------------------------------------------------------
  // Independent object management.
  //
  // Construct all groups before they appear.
  // Never regroup objects already on screen.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(fadeOut(visible[key]));
    }

    if (obj) {
      visible[key] = obj;
      a.push(fadeIn(obj));
    } else {
      delete visible[key];
    }

    return a;
  }

  function remove(...keys) {
    const a = [];

    for (const key of keys) {
      if (!visible[key]) continue;

      a.push(fadeOut(visible[key]));
      delete visible[key];
    }

    return a;
  }

  function clearScene() {
    return remove(...Object.keys(visible));
  }

  function picture(obj) {
    return [
      ...clearScene(),
      ...put('picture', obj)
    ];
  }

  function indicate(key, color = AMBER) {
    return visible[key]
      ? [new M.Indicate(visible[key], { color })]
      : [];
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Lines may be strings or [string, colour] pairs.
  // Leading spaces indent continuation lines.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = CYAN) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart() || ' ', size, c, true)
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

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.20 - lh / 2;

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

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.20 : 4.0;
    const maxh = P ? 1.30 : 4.30;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [fadeIn(g)];

    if (boxNow) {
      a.push(fadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  // ------------------------------------------------------------
  // Opening picture.
  //
  // Christmas's date is known before its occupancy.
  // The calendar and last week's observed count can
  // therefore contribute different information.
  // ------------------------------------------------------------

  function openingPicture(both = false) {
    const objects = [];

    const y = P ? -0.80 : -0.45;

    const left = CX - 1.60;
    const right = CX + 1.60;

    objects.push(
      txt(
        'PLAN THE CHRISTMAS SHIFT',
        20,
        AMBER,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        2.45,
        2.10,
        [left, y, 0],
        PINK,
        0.06
      ),
      rect(
        2.40,
        0.47,
        [left, y + 0.78, 0],
        PINK,
        0.90
      ),
      txt(
        'CALENDAR',
        15,
        C.card,
        [left, y + 0.78, 0]
      ),
      txt(
        'CHRISTMAS',
        16,
        PINK,
        [left, y + 0.16, 0]
      ),
      txt(
        'WEEK 7',
        26,
        PINK,
        [left, y - 0.39, 0],
        true
      ),
      tag(
        'KNOWN IN ADVANCE',
        GREEN,
        [left, y - 1.40, 0],
        12
      ),
      rounded(
        2.45,
        2.10,
        [right, y, 0],
        both ? CYAN : AMBER,
        0.05
      ),
      txt(
        both ? 'LAST SATURDAY' : 'ROOMS FILLED',
        15,
        both ? CYAN : AMBER,
        [right, y + 0.67, 0]
      ),
      txt(
        both ? '29' : '?',
        36,
        both ? CYAN : AMBER,
        [right, y - 0.05, 0],
        true
      ),
      txt(
        both ? 'week 6 count' : 'not yet known',
        14,
        C.muted,
        [right, y - 0.70, 0]
      )
    );

    if (both) {
      objects.push(
        txt(
          '+',
          26,
          WHITE,
          [CX, y, 0]
        ),
        arrow(
          [CX, y - 1.03, 0],
          [CX, y - 1.77, 0],
          AMBER,
          3
        ),
        tag(
          'CHRISTMAS FORECAST?',
          AMBER,
          [CX, y - 2.03, 0],
          15
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Original hotel chart.
  //
  // Horizontal axis: week number.
  // Vertical axis: occupied rooms, 0–40.
  //
  // Week zero is included only to locate the
  // starting height of the regression staircase.
  //
  // The cyan series contains only the six known counts.
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
        1.8
      )
    ];

    [0, 10, 20, 30, 40].forEach(v => {
      objects.push(
        ln(
          [AX0 - 0.06, Y(v), 0],
          [AX0 + 0.06, Y(v), 0],
          C.muted,
          1.2
        ),
        txt(
          v,
          14,
          C.muted,
          [AX0 - 0.27, Y(v), 0],
          true
        )
      );
    });

    for (let week = 0; week <= 8; week++) {
      const color = week >= 7 ? AMBER : C.muted;

      objects.push(
        ln(
          [X(week), AY0 - 0.05, 0],
          [X(week), AY0 + 0.05, 0],
          color,
          1.3
        ),
        txt(
          week,
          14,
          color,
          [X(week), AY0 - 0.24, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        13,
        C.muted,
        [AX0 + 0.28, AY1 + 0.15, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.24, AY0 - 0.62, 0]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [X(7) - 0.06, AY0 - 0.60, 0]
      ),
      txt(
        'New Year',
        11,
        AMBER,
        [X(8), AY0 - 0.60, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function observedSeries() {
    const objects = [];

    for (let week = 2; week <= 6; week++) {
      objects.push(
        ln(
          pt(week - 1, KNOWN[week - 2]),
          pt(week, KNOWN[week - 1]),
          CYAN,
          2.8
        )
      );
    }

    KNOWN.forEach((value, i) => {
      const week = i + 1;

      objects.push(
        glow(pt(week, value), CYAN),
        txt(
          value,
          15,
          CYAN,
          [X(week), Y(value) + 0.24, 0],
          true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function nowDivider() {
    const x = (X(6) + X(7)) / 2;

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
        [x, AY1 + 0.15, 0]
      )
    );
  }

  function hiddenHolidays(weeks = [7, 8]) {
    const objects = [];

    weeks.forEach(week => {
      const top = AY1 - 0.10;
      const bottom = AY0 + 0.08;

      objects.push(
        rounded(
          STEP * 0.77,
          top - bottom,
          [X(week), (top + bottom) / 2, 0],
          C.muted,
          0.025
        ),
        tag(
          '?',
          AMBER,
          [X(week), AY0 + 0.40, 0],
          15
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function legend(items) {
    const objects = [];

    const gap =
      items.length >= 5 ? 1.24 :
      items.length === 4 ? 1.50 :
      items.length === 3 ? 1.90 : 2.30;

    const y = P ? 1.73 : 1.43;

    items.forEach(([name, color, style], i) => {
      const x =
        CX + (i - (items.length - 1) / 2) * gap;

      const t = T(
        name,
        items.length >= 5 ? 10 : 12,
        color
      );

      const width = t.getWidth() + 0.39;
      const left = x - width / 2;

      if (style === 'dashed') {
        objects.push(
          dash(
            [left, y, 0],
            [left + 0.28, y, 0],
            color
          )
        );
      } else if (style === 'block') {
        objects.push(
          rect(
            0.24,
            0.14,
            [left + 0.12, y, 0],
            color,
            0.90
          )
        );
      } else {
        objects.push(
          ln(
            [left, y, 0],
            [left + 0.28, y, 0],
            color,
            3
          )
        );
      }

      t.moveTo([
        left + 0.39 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(t);
    });

    return new M.VGroup(...objects);
  }

  const COUNT_KEY = ['Count', CYAN, 'solid'];
  const STAIR_KEY = ['Week', VIOLET, 'solid'];
  const HOLIDAY_KEY = ['Holiday', PINK, 'block'];
  const ERROR_KEY = ['Gap', GREEN, 'block'];
  const FORECAST_KEY = ['Forecast', AMBER, 'dashed'];
  const ACTUAL_KEY = ['Actual', WHITE, 'solid'];

  function chart(hidden = [7, 8], keys = [COUNT_KEY]) {
    const a = [
      ...clearScene(),
      ...put('axes', axes()),
      ...put('series', observedSeries()),
      ...put('now', nowDivider()),
      ...put('legend', legend(keys))
    ];

    if (hidden.length) {
      a.push(
        ...put('hidden', hiddenHolidays(hidden))
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Regression staircase.
  //
  // Initial height at week zero: 18.
  // Each additional week raises the first guess by one.
  //
  // Week 1: 19.
  // Week 2: 20.
  // Week 3: 21.
  // Week 4: 22.
  // Week 5: 23.
  // Week 6: 24.
  // Week 7: 25 before holiday adjustment.
  // Week 8: 26 before holiday adjustment.
  // ------------------------------------------------------------

  function startingHeight(showLabel = true) {
    const objects = [
      glow(pt(0, START), VIOLET, 0.095)
    ];

    if (showLabel) {
      objects.push(
        tag(
          '18',
          VIOLET,
          [X(0), Y(START) - 0.38, 0],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function stairStep(week, label = false) {
    const previous = staircase(week - 1);
    const current = staircase(week);

    const a = pt(week - 1, previous);
    const corner = [X(week), Y(previous), 0];
    const b = pt(week, current);

    const objects = [
      ln(a, corner, VIOLET, 3.0),
      ln(corner, b, VIOLET, 3.0),
      dot(b, VIOLET, 0.055)
    ];

    if (label) {
      objects.push(
        txt(
          fmt(current),
          14,
          VIOLET,
          [X(week), Y(current) - 0.24, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function stairs(n = 8, labels = true) {
    const objects = [startingHeight(true)];

    for (let week = 1; week <= n; week++) {
      objects.push(stairStep(week, labels));
    }

    return new M.VGroup(...objects);
  }

  function firstGuessGuide() {
    return new M.VGroup(
      dash(
        [AX0 + 0.03, Y(START), 0],
        [AX1, Y(START), 0],
        VIOLET
      ),
      txt(
        'starting height',
        14,
        VIOLET,
        [CX, Y(START) - 0.35, 0]
      )
    );
  }

  // ------------------------------------------------------------
  // Holiday blocks.
  //
  // Each holiday receives exactly six additional rooms.
  // The base staircase is unchanged.
  //
  // Christmas: 25 + 6 = 31.
  // New Year: 26 + 6 = 32.
  //
  // The second value is a regression guess, not the
  // full dynamic-regression forecast for New Year.
  // ------------------------------------------------------------

  const ROOM_PITCH = Y(1) - Y(0);
  const CHART_BLOCK_W = STEP * 0.52;

  function chartBlock(week, base, index, color) {
    return rect(
      CHART_BLOCK_W,
      ROOM_PITCH * 0.82,
      [X(week), Y(base + index + 0.5), 0],
      color,
      0.90
    );
  }

  function holidayStack(week, label = true) {
    const base = staircase(week);
    const objects = [];

    for (let j = 0; j < 6; j++) {
      objects.push(chartBlock(week, base, j, PINK));
    }

    if (label) {
      objects.push(
        txt(
          '+6',
          15,
          PINK,
          [
            // Right of the stack: clear of the NOW line.
            X(week) + 0.33,
            Y(base + 3),
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Magnified staircase picture.
  //
  // Use a clearly marked local room scale to make
  // one-room steps and six-room holiday blocks visible.
  //
  // The supplied original counts remain unchanged.
  // ------------------------------------------------------------

  function stairCloseUp(stage = 0) {
    const objects = [];

    const left = CX - 2.35;
    const right = CX + 2.35;

    const bottom = P ? -3.45 : -2.08;
    const top = P ? 0.80 : 0.90;

    const yy = value =>
      bottom + (value - 18) / 15 * (top - bottom);

    const xx = week =>
      left + week / 8 * (right - left);

    objects.push(
      txt(
        stage >= 3
          ? 'ADD THE HOLIDAY BUMP'
          : 'ONE EXTRA ROOM FOR EACH WEEK',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [left - 0.42, bottom, 0],
        [left - 0.42, top, 0],
        C.muted,
        1.5
      )
    );

    [18, 21, 24, 27, 30, 33].forEach(v => {
      objects.push(
        txt(
          v,
          13,
          C.muted,
          [left - 0.66, yy(v), 0],
          true
        ),
        ln(
          [left - 0.47, yy(v), 0],
          [left - 0.36, yy(v), 0],
          C.muted,
          1.1
        )
      );
    });

    objects.push(
      glow([xx(0), yy(18), 0], VIOLET, 0.09),
      txt(
        '18',
        15,
        VIOLET,
        [xx(0), yy(18) + 0.25, 0],
        true
      )
    );

    const n =
      stage === 0 ? 0 :
      stage === 1 ? 1 : 8;

    for (let week = 1; week <= n; week++) {
      const previous = staircase(week - 1);
      const value = staircase(week);

      objects.push(
        ln(
          [xx(week - 1), yy(previous), 0],
          [xx(week), yy(previous), 0],
          VIOLET,
          3
        ),
        ln(
          [xx(week), yy(previous), 0],
          [xx(week), yy(value), 0],
          VIOLET,
          3
        ),
        txt(
          value,
          13,
          VIOLET,
          [xx(week), yy(value) - 0.20, 0],
          true
        )
      );
    }

    if (stage === 1) {
      objects.push(
        tag(
          '+1',
          VIOLET,
          [xx(1) + 0.45, yy(19) + 0.43, 0],
          16
        )
      );
    }

    for (let week = 0; week <= 8; week++) {
      objects.push(
        txt(
          week,
          13,
          week >= 7 ? AMBER : C.muted,
          [xx(week), bottom - 0.34, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'week number',
        13,
        C.muted,
        [CX, bottom - 0.67, 0]
      )
    );

    if (stage >= 3) {
      const h = yy(19) - yy(18);

      [7, 8].forEach(week => {
        for (let j = 0; j < 6; j++) {
          objects.push(
            rect(
              0.39,
              h * 0.84,
              [
                xx(week),
                yy(staircase(week) + j + 0.5),
                0
              ],
              PINK,
              0.92
            )
          );
        }

        objects.push(
          tag(
            fmt(regression(week)),
            PINK,
            [
              xx(week),
              yy(regression(week)) + 0.28,
              0
            ],
            13
          )
        );
      });

      objects.push(
        txt(
          '6 extra rooms on each holiday',
          15,
          PINK,
          [CX - 0.55, yy(30), 0]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Holiday switch.
  //
  // OFF = 0: no holiday blocks.
  // ON  = 1: six holiday blocks.
  //
  // The switch is a known calendar fact, not
  // a room count inferred after observing the week.
  // ------------------------------------------------------------

  function switchIcon(x, y, on, color = PINK) {
    const w = 1.24;
    const h = 0.49;

    return new M.VGroup(
      rounded(
        w,
        h,
        [x, y, 0],
        on ? color : C.muted,
        on ? 0.24 : 0.05
      ),
      dot(
        [x + (on ? 0.35 : -0.35), y, 0],
        on ? color : C.muted,
        0.18
      )
    );
  }

  function switchPicture(stage = 0) {
    const objects = [];

    const x1 = CX - 1.60;
    const x2 = CX + 1.60;

    const y = P ? -0.35 : -0.10;
    const base = P ? -3.10 : -2.10;
    const pitch = P ? 0.31 : 0.25;

    objects.push(
      txt(
        'THE HOLIDAY SWITCH',
        21,
        PINK,
        [CX, TITLE_Y, 0]
      )
    );

    [
      [x1, false, 'Ordinary week'],
      [x2, true, 'Holiday week']
    ].forEach(([x, on, name]) => {
      const active =
        stage === 0 ||
        (stage === 1 && !on) ||
        (stage >= 2 && on);

      const color =
        active
          ? on ? PINK : WHITE
          : C.muted;

      objects.push(
        txt(
          name,
          17,
          color,
          [x, y + 0.79, 0]
        ),
        switchIcon(x, y + 0.17, on),
        txt(
          on ? '1' : '0',
          25,
          color,
          [x, y - 0.43, 0],
          true
        ),
        ln(
          [x - 0.65, base, 0],
          [x + 0.65, base, 0],
          C.muted,
          1.6
        )
      );

      if (on) {
        for (let j = 0; j < 6; j++) {
          objects.push(
            rect(
              0.76,
              pitch * 0.82,
              [x, base + (j + 0.5) * pitch, 0],
              PINK,
              active ? 0.93 : 0.24
            )
          );
        }
      }

      objects.push(
        txt(
          on ? '+6 rooms' : '+0 rooms',
          17,
          color,
          [x, base - 0.33, 0]
        )
      );
    });

    if (stage >= 2) {
      objects.push(
        tag(
          'CHRISTMAS AND NEW YEAR',
          PINK,
          [CX, base - 0.83, 0],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Calendar strip of the actual predictor values.
  //
  // Weeks 1–6: holiday = 0.
  // Weeks 7–8: holiday = 1.
  // ------------------------------------------------------------

  function calendarStrip() {
    const objects = [];

    const y = P ? -0.70 : -0.45;
    const spacing = 0.73;

    objects.push(
      txt(
        'KNOWN CALENDAR INFORMATION',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      txt(
        'Week number',
        15,
        VIOLET,
        [CX, y + 1.16, 0]
      ),
      txt(
        'Holiday switch',
        15,
        PINK,
        [CX, y - 0.54, 0]
      )
    );

    for (let week = 1; week <= 8; week++) {
      const x =
        CX + (week - 4.5) * spacing;

      const on = holiday(week) === 1;
      const color = on ? PINK : C.muted;

      objects.push(
        rounded(
          0.60,
          0.61,
          [x, y + 0.48, 0],
          VIOLET,
          0.055
        ),
        txt(
          week,
          20,
          VIOLET,
          [x, y + 0.48, 0],
          true
        ),
        rounded(
          0.60,
          0.64,
          [x, y - 1.17, 0],
          color,
          on ? 0.14 : 0.025
        ),
        txt(
          holiday(week),
          21,
          color,
          [x, y - 1.17, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'ordinary',
        13,
        C.muted,
        [CX - 0.73, y - 1.77, 0]
      ),
      txt(
        'Xmas',
        12,
        PINK,
        [CX + 2.5 * spacing, y - 1.77, 0]
      ),
      txt(
        'NY',
        12,
        PINK,
        [CX + 3.5 * spacing, y - 1.77, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Predictor and regression picture.
  //
  // Two known inputs enter the regression rule:
  //
  //   week number;
  //   holiday switch.
  //
  // Their contributions join the fixed starting
  // height of 18 rooms.
  // ------------------------------------------------------------

  function predictorsPicture(stage = 0) {
    const objects = [];

    const yTop = P ? 0.15 : 0.38;
    const yBottom = P ? -2.15 : -1.40;

    const x1 = CX - 1.55;
    const x2 = CX + 1.55;

    objects.push(
      txt(
        stage >= 2
          ? 'REGRESSION'
          : 'FACTS WE KNOW BEFORE THE GUESS',
        20,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    [
      [x1, 'WEEK NUMBER', '7', VIOLET],
      [x2, 'HOLIDAY SWITCH', '1', PINK]
    ].forEach(([x, label, value, color]) => {
      objects.push(
        rounded(
          2.55,
          1.30,
          [x, yTop, 0],
          color,
          0.055
        ),
        txt(
          label,
          14,
          color,
          [x, yTop + 0.36, 0]
        ),
        txt(
          value,
          26,
          color,
          [x, yTop - 0.13, 0],
          true
        ),
        arrow(
          [x, yTop - 0.69, 0],
          [
            CX + (x < CX ? -0.75 : 0.75),
            yBottom + 0.58,
            0
          ],
          color,
          2.8
        )
      );
    });

    objects.push(
      rounded(
        4.90,
        1.12,
        [CX, yBottom, 0],
        stage >= 2 ? GREEN : AMBER,
        0.06
      ),
      txt(
        stage >= 2 ? 'REGRESSION GUESS' : 'ROOM GUESS',
        16,
        stage >= 2 ? GREEN : AMBER,
        [CX, yBottom + 0.27, 0]
      ),
      txt(
        stage >= 2 ? '18 + week + 6 × holiday' : '? rooms',
        stage >= 2 ? 20 : 23,
        WHITE,
        [CX, yBottom - 0.16, 0],
        true
      )
    );

    if (stage >= 1) {
      objects.push(
        tag(
          'TWO PREDICTORS',
          GREEN,
          [CX, yBottom - 0.86, 0],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Regression errors on the hotel chart.
  //
  // Regression error = actual − regression guess.
  //
  // These are NOT differences from the long-run
  // usual count of 22.
  //
  // Each bar begins at the regression staircase.
  // Its endpoint is the observed room count.
  // ------------------------------------------------------------

  function chartErrorBar(week) {
    const predicted = regression(week);
    const observed = KNOWN[week - 1];
    const error = observed - predicted;

    return rect(
      STEP * 0.42,
      Math.abs(Y(observed) - Y(predicted)),
      [
        X(week),
        (Y(observed) + Y(predicted)) / 2,
        0
      ],
      error >= 0 ? GREEN : RED,
      0.87
    );
  }

  function chartErrorLabel(week) {
    const error = ERRORS[week - 1];

    return tag(
      signed(error),
      error >= 0 ? GREEN : RED,
      [
        X(week),
        Math.min(
          Y(KNOWN[week - 1]),
          Y(regression(week))
        ) - 0.62,
        0
      ],
      13
    );
  }

  function chartErrorBracket(week, showLabel = true) {
    const expected = regression(week);
    const actual = KNOWN[week - 1];
    const error = actual - expected;

    const low = Y(Math.min(expected, actual));
    const high = Y(Math.max(expected, actual));

    const color = error >= 0 ? GREEN : RED;
    const x = X(week) + 0.22;

    const objects = [
      ln([x, low, 0], [x, high, 0], color, 3.1),
      ln([x - 0.06, low, 0], [x + 0.06, low, 0], color, 2),
      ln([x - 0.06, high, 0], [x + 0.06, high, 0], color, 2)
    ];

    if (showLabel) {
      objects.push(
        txt(
          signed(error),
          16,
          color,
          [x + 0.18, (low + high) / 2, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function regressionFocus(week) {
    return ring(
      pt(week, regression(week)),
      VIOLET,
      0.145
    );
  }

  // ------------------------------------------------------------
  // Magnified week-six regression error.
  //
  // First guess = 24.
  // Actual = 29.
  // Gap = 5.
  //
  // A separate local scale makes the five individual
  // room blocks easy to see.
  // ------------------------------------------------------------

  function errorCloseUp(stage = 0) {
    const objects = [];

    const bottom = P ? -3.35 : -2.10;
    const top = P ? 0.85 : 0.90;

    const yy = value =>
      bottom + (value - 23) / 7 * (top - bottom);

    const axisX = CX - 2.02;
    const stackX = CX - 0.42;

    objects.push(
      txt(
        'WEEK SIX: MEASURE THE GAP',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [axisX, yy(23), 0],
        [axisX, yy(30), 0],
        C.muted,
        1.5
      )
    );

    for (let v = 23; v <= 30; v++) {
      objects.push(
        ln(
          [axisX - 0.06, yy(v), 0],
          [axisX + 0.06, yy(v), 0],
          C.muted,
          1.2
        ),
        txt(
          v,
          14,
          C.muted,
          [axisX - 0.29, yy(v), 0],
          true
        )
      );
    }

    objects.push(
      dash(
        [axisX + 0.10, yy(24), 0],
        [CX + 2.55, yy(24), 0],
        VIOLET
      ),
      tag(
        'FIRST GUESS 24',
        VIOLET,
        [CX + 1.27, yy(24) - 0.32, 0],
        14
      ),
      ring([stackX, yy(24), 0], VIOLET, 0.13),
      dash(
        [axisX + 0.10, yy(29), 0],
        [CX + 2.55, yy(29), 0],
        CYAN
      ),
      glow([stackX, yy(29), 0], CYAN, 0.11),
      tag(
        'REAL 29',
        CYAN,
        [CX + 1.27, yy(29) + 0.30, 0],
        15
      )
    );

    if (stage >= 1) {
      const pitch = yy(25) - yy(24);

      for (let j = 0; j < 5; j++) {
        objects.push(
          rect(
            0.98,
            pitch * 0.84,
            [stackX, yy(24 + j + 0.5), 0],
            GREEN,
            0.91
          )
        );
      }

      objects.push(
        arrow(
          [CX + 0.35, yy(24), 0],
          [CX + 0.35, yy(29), 0],
          GREEN,
          3.4
        ),
        txt(
          '+5',
          22,
          GREEN,
          [CX + 0.94, yy(26.5), 0],
          true
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        tag(
          'REGRESSION ERROR',
          GREEN,
          [
            CX + 1.37,
            yy(26.5) - 0.55,
            0
          ],
          12
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Independent regression-error chart.
  //
  // Error values:
  // +1, +4, −1, +1, +1, +5.
  //
  // The zero line now represents the regression guess.
  // Positive errors rise above zero.
  // Negative errors extend below zero.
  // ------------------------------------------------------------

  const EX0 = CX - 2.74;
  const EX1 = CX + 2.72;

  const EZERO = P ? -2.35 : -1.30;
  const ESCALE = P ? 0.59 : 0.41;

  const EX = week =>
    EX0 + 0.38 +
    (week - 1) / 6 * (EX1 - EX0 - 0.63);

  const EY = value =>
    EZERO + value * ESCALE;

  function errorAxes() {
    const objects = [
      txt(
        'REGRESSION ERRORS',
        20,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [EX0, EY(-1.5), 0],
        [EX0, EY(5.5), 0],
        C.muted,
        1.6
      ),
      ln(
        [EX0, EZERO, 0],
        [EX1, EZERO, 0],
        WHITE,
        2.2
      )
    ];

    [-1, 0, 1, 2, 3, 4, 5].forEach(v => {
      objects.push(
        txt(
          signed(v),
          13,
          C.muted,
          [EX0 - 0.29, EY(v), 0],
          true
        ),
        ln(
          [EX0 - 0.05, EY(v), 0],
          [EX0 + 0.05, EY(v), 0],
          C.muted,
          1.1
        )
      );

      if (v !== 0) {
        objects.push(
          dash(
            [EX0 + 0.07, EY(v), 0],
            [EX1, EY(v), 0],
            C.muted
          )
        );
      }
    });

    for (let week = 1; week <= 7; week++) {
      objects.push(
        txt(
          'W' + week,
          14,
          week === 7 ? AMBER : C.muted,
          [EX(week), EY(-1.5) - 0.23, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'real minus regression guess',
        13,
        C.muted,
        [CX, EY(-1.5) - 0.65, 0]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [EX(7), EY(-1.5) - 0.48, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function errorBar(
    week,
    value,
    color = value >= 0 ? GREEN : RED,
    opacity = 0.88
  ) {
    return rect(
      0.48,
      Math.max(0.015, Math.abs(value) * ESCALE),
      [
        EX(week),
        (EZERO + EY(value)) / 2,
        0
      ],
      color,
      opacity
    );
  }

  function errorLabel(
    week,
    value,
    color = value >= 0 ? GREEN : RED
  ) {
    return txt(
      signed(value),
      17,
      color,
      [
        EX(week),
        EY(value) + (value >= 0 ? 0.23 : -0.22),
        0
      ],
      true
    );
  }

  function errorFocus(week) {
    const value = ERRORS[week - 1];

    return rounded(
      0.66,
      Math.abs(value) * ESCALE + 0.14,
      [
        EX(week),
        (EZERO + EY(value)) / 2,
        0
      ],
      AMBER,
      0
    );
  }

  function errorsChart(labels = 6) {
    const a = [
      ...clearScene(),
      ...put('errorAxes', errorAxes())
    ];

    ERRORS.forEach((value, i) => {
      const week = i + 1;

      a.push(
        ...put(
          'errorBar' + week,
          errorBar(week, value)
        )
      );

      if (week <= labels) {
        a.push(
          ...put(
            'errorLabel' + week,
            errorLabel(week, value)
          )
        );
      }
    });

    return a;
  }

  // ------------------------------------------------------------
  // Carry six tenths of the latest error forward.
  //
  // Five rooms = ten half-room pieces.
  // Select six of those ten pieces.
  //
  // Six × 0.5 room = 3 rooms.
  //
  // Selected pieces are copied, not removed from
  // the original observed regression error.
  // ------------------------------------------------------------

  const SHARE_BASE = P ? -3.35 : -2.10;
  const SHARE_PITCH = P ? 0.70 : 0.48;

  const SHARE_L = CX - 1.65;
  const SHARE_R = CX + 1.65;

  function sharePiece(x, j, amount, color, opacity = 0.90) {
    return rect(
      0.98,
      SHARE_PITCH * amount * 0.84,
      [
        x,
        SHARE_BASE +
          (j + 0.5) * amount * SHARE_PITCH,
        0
      ],
      color,
      opacity
    );
  }

  function sharePicture(stage = 0) {
    const objects = [];

    objects.push(
      txt(
        'CARRY PART OF THE ERROR FORWARD',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [CX - 2.50, SHARE_BASE, 0],
        [CX + 2.50, SHARE_BASE, 0],
        C.muted,
        1.8
      ),
      txt(
        'Week 6 error',
        16,
        GREEN,
        [SHARE_L, SHARE_BASE - 0.35, 0]
      ),
      txt(
        'Predicted next error',
        15,
        AMBER,
        [SHARE_R, SHARE_BASE - 0.35, 0]
      ),
      txt(
        '+5',
        22,
        GREEN,
        [
          SHARE_L,
          SHARE_BASE + 5 * SHARE_PITCH + 0.27,
          0
        ],
        true
      )
    );

    if (stage === 0) {
      for (let j = 0; j < 5; j++) {
        objects.push(
          sharePiece(SHARE_L, j, 1, GREEN)
        );
      }
    } else {
      for (let j = 0; j < 10; j++) {
        objects.push(
          sharePiece(
            SHARE_L,
            j,
            0.5,
            GREEN,
            j < 6 ? 0.95 : 0.15
          )
        );
      }

      objects.push(
        rounded(
          1.14,
          3 * SHARE_PITCH + 0.10,
          [
            SHARE_L,
            SHARE_BASE + 1.5 * SHARE_PITCH,
            0
          ],
          WHITE,
          0
        ),
        arrow(
          [
            SHARE_L + 0.65,
            SHARE_BASE + 1.5 * SHARE_PITCH,
            0
          ],
          [
            SHARE_R - 0.65,
            SHARE_BASE + 1.5 * SHARE_PITCH,
            0
          ],
          GREEN,
          3
        ),
        tag(
          '6 OF 10',
          VIOLET,
          [
            CX,
            SHARE_BASE + 1.5 * SHARE_PITCH + 0.38,
            0
          ],
          14
        ),
        txt(
          'Each small piece = half a room',
          13,
          C.muted,
          [CX, SHARE_BASE - 0.80, 0]
        )
      );
    }

    if (stage >= 2) {
      for (let j = 0; j < 6; j++) {
        objects.push(
          sharePiece(SHARE_R, j, 0.5, GREEN, 0.96)
        );
      }

      objects.push(
        tag(
          '+3',
          GREEN,
          [
            SHARE_R,
            SHARE_BASE + 3 * SHARE_PITCH + 0.36,
            0
          ],
          20
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function makeShareCopies() {
    const a = [];

    for (let j = 0; j < 6; j++) {
      const b =
        sharePiece(SHARE_L, j, 0.5, GREEN, 0.97);

      visible['shareCopy' + j] = b;
      a.push(fadeIn(b, 0.20));
    }

    return a;
  }

  function moveShareCopies() {
    const a = [];

    for (let j = 0; j < 6; j++) {
      a.push(
        new M.Transform(
          visible['shareCopy' + j],
          sharePiece(
            SHARE_R,
            j,
            0.5,
            GREEN,
            0.97
          ),
          {
            pathArc: -0.40,
            runTime: 0.65
          }
        )
      );
    }

    return new M.LaggedStart(
      a,
      {
        lagRatio: 0.13,
        runTime: 1.30
      }
    );
  }

  // ------------------------------------------------------------
  // Autocorrelated regression errors.
  //
  // The fitted 0.6 coefficient is supplied by the lesson.
  // Do not claim that the six displayed errors alone
  // establish this coefficient or prove autocorrelation.
  //
  // Illustrate how a positive gap contributes a
  // smaller positive predicted gap next week.
  // ------------------------------------------------------------

  function errorCarryoverPicture() {
    const objects = [];

    const base = P ? -3.10 : -2.04;
    const pitch = P ? 0.69 : 0.48;

    const left = CX - 1.65;
    const right = CX + 1.65;

    objects.push(
      txt(
        'AUTOCORRELATED ERRORS',
        20,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [CX - 2.60, base, 0],
        [CX + 2.60, base, 0],
        WHITE,
        1.8
      ),
      txt(
        '0',
        14,
        WHITE,
        [CX - 2.86, base, 0],
        true
      )
    );

    [
      [left, 5, 'Latest error'],
      [right, 3, 'Predicted error']
    ].forEach(([x, value, label]) => {
      for (let j = 0; j < value; j++) {
        objects.push(
          rect(
            0.90,
            pitch * 0.84,
            [x, base + (j + 0.5) * pitch, 0],
            GREEN,
            0.91
          )
        );
      }

      objects.push(
        txt(
          signed(value),
          22,
          GREEN,
          [x, base + value * pitch + 0.29, 0],
          true
        ),
        txt(
          label,
          15,
          C.ink,
          [x, base - 0.35, 0]
        )
      );
    });

    objects.push(
      arrow(
        [left + 0.57, base + 3.2 * pitch, 0],
        [right - 0.57, base + 2.0 * pitch, 0],
        VIOLET,
        3.2
      ),
      tag(
        '× 0.6',
        VIOLET,
        [CX, base + 3.2 * pitch + 0.32, 0],
        16
      ),
      txt(
        'One week later',
        14,
        C.muted,
        [CX, base - 0.83, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Dynamic regression concept picture.
  //
  // Two components produce the full forecast:
  //
  // 1. A regression guess based on known predictors.
  // 2. A predicted regression error based on earlier gaps.
  //
  // The second component is not a second holiday bump.
  // ------------------------------------------------------------

  function dynamicPicture(numbered = false) {
    const objects = [];

    const x1 = CX - 1.55;
    const x2 = CX + 1.55;

    const yTop = P ? -0.02 : 0.30;
    const yBottom = P ? -2.40 : -1.54;

    objects.push(
      txt(
        'DYNAMIC REGRESSION',
        22,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        2.70,
        1.63,
        [x1, yTop, 0],
        VIOLET,
        0.06
      ),
      txt(
        'KNOWN PREDICTORS',
        14,
        VIOLET,
        [x1, yTop + 0.53, 0]
      ),
      txt(
        numbered ? '31' : 'Week + holiday',
        numbered ? 31 : 18,
        VIOLET,
        [x1, yTop + 0.02, 0],
        numbered
      ),
      txt(
        'regression guess',
        14,
        C.muted,
        [x1, yTop - 0.55, 0]
      ),
      rounded(
        2.70,
        1.63,
        [x2, yTop, 0],
        GREEN,
        0.06
      ),
      txt(
        'EARLIER ERRORS',
        14,
        GREEN,
        [x2, yTop + 0.53, 0]
      ),
      txt(
        numbered ? '+3' : 'Carryover rule',
        numbered ? 31 : 18,
        GREEN,
        [x2, yTop + 0.02, 0],
        numbered
      ),
      txt(
        'predicted gap',
        14,
        C.muted,
        [x2, yTop - 0.55, 0]
      ),
      arrow(
        [x1, yTop - 0.86, 0],
        [CX - 0.75, yBottom + 0.63, 0],
        VIOLET,
        3
      ),
      arrow(
        [x2, yTop - 0.86, 0],
        [CX + 0.75, yBottom + 0.63, 0],
        GREEN,
        3
      ),
      txt(
        '+',
        25,
        WHITE,
        [CX, (yTop + yBottom) / 2, 0]
      ),
      rounded(
        4.65,
        1.15,
        [CX, yBottom, 0],
        AMBER,
        0.065
      ),
      txt(
        'FULL FORECAST',
        16,
        AMBER,
        [CX, yBottom + 0.28, 0]
      ),
      txt(
        numbered ? '31 + 3 = 34' : 'Both pieces together',
        numbered ? 25 : 18,
        AMBER,
        [CX, yBottom - 0.15, 0],
        numbered
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Magnified Christmas forecast construction.
  //
  // Starting height: 18.
  // Week contribution: 7 rooms.
  // Holiday contribution: 6 rooms.
  // Error carryover: 3 rooms.
  //
  // Levels:
  // 18 → 25 → 31 → 34.
  //
  // The actual Christmas count is not included.
  // ------------------------------------------------------------

  const BUILD_BOTTOM = P ? -3.60 : -2.11;
  const BUILD_TOP = P ? 0.75 : 0.85;

  const BY = rooms =>
    BUILD_BOTTOM +
    (rooms - 18) / 17 *
    (BUILD_TOP - BUILD_BOTTOM);

  const BUILD_X = CX - 0.50;
  const BUILD_W = 1.0;

  function buildBlock(start, index, color) {
    const h = BY(19) - BY(18);

    return rect(
      BUILD_W,
      h * 0.82,
      [
        BUILD_X,
        BY(start + index + 0.5),
        0
      ],
      color,
      0.93
    );
  }

  function buildChristmas(stage = 0) {
    const objects = [];

    const axisX = CX - 2.18;

    objects.push(
      txt(
        'BUILD THE CHRISTMAS FORECAST',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [axisX, BY(18), 0],
        [axisX, BY(35), 0],
        C.muted,
        1.6
      )
    );

    [18, 20, 25, 30, 31, 34, 35].forEach(v => {
      // Keep the labels at 30 and 31, and at 34 and 35,
      // from colliding on the smaller landscape chart.

      const major = [18, 20, 25, 31, 34].includes(v);

      objects.push(
        ln(
          [axisX - 0.05, BY(v), 0],
          [axisX + 0.05, BY(v), 0],
          C.muted,
          1.1
        )
      );

      if (major) {
        objects.push(
          txt(
            v,
            14,
            C.muted,
            [axisX - 0.30, BY(v), 0],
            true
          )
        );
      }
    });

    objects.push(
      dash(
        [axisX + 0.10, BY(18), 0],
        [CX + 2.60, BY(18), 0],
        VIOLET
      ),
      glow([BUILD_X, BY(18), 0], VIOLET, 0.08),
      txt(
        'Start 18',
        15,
        VIOLET,
        [CX + 1.27, BY(18) - 0.28, 0]
      )
    );

    if (stage >= 1) {
      for (let j = 0; j < 7; j++) {
        objects.push(buildBlock(18, j, VIOLET));
      }

      objects.push(
        txt(
          '+7 week number',
          15,
          VIOLET,
          [CX + 1.31, BY(21.5), 0]
        ),
        dash(
          [axisX + 0.10, BY(25), 0],
          [BUILD_X + 0.63, BY(25), 0],
          VIOLET
        )
      );

      if (stage === 1) {
        objects.push(
          tag(
            '25 ROOMS',
            VIOLET,
            [BUILD_X, BY(25) + 0.34, 0],
            16
          )
        );
      }
    }

    if (stage >= 2) {
      for (let j = 0; j < 6; j++) {
        objects.push(buildBlock(25, j, PINK));
      }

      objects.push(
        txt(
          '+6 holiday',
          15,
          PINK,
          [CX + 1.32, BY(28), 0]
        ),
        dash(
          [axisX + 0.10, BY(31), 0],
          [BUILD_X + 0.65, BY(31), 0],
          PINK
        ),
        ring([BUILD_X, BY(31), 0], PINK, 0.10)
      );

      if (stage === 2) {
        objects.push(
          tag(
            'REGRESSION 31',
            PINK,
            [BUILD_X, BY(31) + 0.35, 0],
            15
          )
        );
      } else {
        objects.push(
          txt(
            '31 first guess',
            13,
            PINK,
            [CX + 1.37, BY(31) - 0.15, 0]
          )
        );
      }
    }

    if (stage >= 3) {
      for (let j = 0; j < 3; j++) {
        objects.push(buildBlock(31, j, GREEN));
      }

      objects.push(
        txt(
          '+3 error',
          15,
          GREEN,
          [CX + 1.34, BY(32.5), 0]
        ),
        dash(
          [axisX + 0.10, BY(34), 0],
          [BUILD_X + 0.70, BY(34), 0],
          AMBER
        ),
        ring([BUILD_X, BY(34), 0], AMBER, 0.13),
        tag(
          '34 ROOMS',
          AMBER,
          [CX + 1.27, BY(34) + 0.30, 0],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Two-stage forecast rule.
  //
  // Regression guess:
  //   18 + week + 6 × holiday switch.
  //
  // Full forecast:
  //   regression guess
  //   + 0.6 × latest regression error.
  // ------------------------------------------------------------

  function rulePicture(stage = 0) {
    const objects = [];

    const upper = P ? 0.10 : 0.34;
    const lower = P ? -2.25 : -1.47;

    objects.push(
      txt(
        'TWO PARTS OF THE FULL FORECAST',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        5.50,
        1.42,
        [CX, upper, 0],
        VIOLET,
        0.055
      ),
      txt(
        'REGRESSION GUESS',
        15,
        VIOLET,
        [CX, upper + 0.42, 0]
      ),
      txt(
        stage === 0
          ? '18 + week number'
          : '18 + week + 6 × holiday',
        21,
        stage === 0 ? VIOLET : PINK,
        [CX, upper - 0.05, 0],
        true
      )
    );

    if (stage >= 1) {
      objects.push(
        txt(
          'Christmas: 18 + 7 + 6 = 31',
          15,
          PINK,
          [CX, upper - 0.42, 0],
          true
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        arrow(
          [CX, upper - 0.75, 0],
          [CX, lower + 0.78, 0],
          GREEN,
          3
        ),
        rounded(
          5.50,
          1.50,
          [CX, lower, 0],
          AMBER,
          0.055
        ),
        txt(
          'ADD THE PREDICTED ERROR',
          15,
          GREEN,
          [CX, lower + 0.45, 0]
        ),
        txt(
          '31 + 0.6 × 5',
          22,
          WHITE,
          [CX, lower - 0.01, 0],
          true
        ),
        txt(
          '= 34 rooms',
          20,
          AMBER,
          [CX, lower - 0.44, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Christmas forecast on the original hotel chart.
  //
  // Violet: underlying week-number staircase.
  // Pink: the six-room holiday contribution.
  // Green: the three-room predicted regression error.
  // Amber: the completed forecast at 34.
  //
  // Do not draw the actual until beat 40.
  // ------------------------------------------------------------

  function predictedErrorStack(label = true) {
    const objects = [];

    for (let j = 0; j < NEXT_ERROR; j++) {
      objects.push(
        chartBlock(
          7,
          CHRISTMAS_REGRESSION,
          j,
          GREEN
        )
      );
    }

    if (label) objects.push(
      txt(
        '+3',
        15,
        GREEN,
        [
          X(7) - 0.34,
          Y(CHRISTMAS_REGRESSION + NEXT_ERROR / 2),
          0
        ],
        true
      )
    );

    return new M.VGroup(...objects);
  }

  function forecastPoint(actualShown = false) {
    const objects = [
      dash(
        pt(6, KNOWN[5]),
        pt(7, FORECAST),
        AMBER
      ),
      dash(
        [X(7), AY0 + 0.04, 0],
        [X(7), Y(FORECAST) - 0.15, 0],
        AMBER
      ),
      ring(pt(7, FORECAST), AMBER, 0.145)
    ];

    objects.push(
      tag(
        '34',
        AMBER,
        [
          X(7) + (actualShown ? 0.48 : 0),
          Y(FORECAST) + (actualShown ? -0.28 : 0.34),
          0
        ],
        15
      )
    );

    return new M.VGroup(...objects);
  }

  function actualChristmas() {
    // Invoke only at or after beat 40.

    const value = DATA[6];

    return new M.VGroup(
      ln(
        pt(6, KNOWN[5]),
        pt(7, value),
        WHITE,
        2.2
      ),
      glow(pt(7, value), WHITE, 0.095),
      txt(
        value,
        18,
        WHITE,
        [X(7), Y(value) + 0.30, 0],
        true
      )
    );
  }

  function forecastChart(actual = false) {
    const keys = actual
      ? [COUNT_KEY, STAIR_KEY, FORECAST_KEY, ACTUAL_KEY]
      : [COUNT_KEY, STAIR_KEY, HOLIDAY_KEY, ERROR_KEY, FORECAST_KEY];

    const a = [
      ...chart([8], keys),
      ...put('stairs', stairs(7, false)),
      // Unlabelled stacks (legend + card name them);
      // once the actual is shown, the stacks go so the
      // 34 ring and the 35 dot stand clear.
      ...(actual ? put('hidden', null) : []),
      ...put('holiday7', actual ? null : holidayStack(7, false)),
      ...put('errorCarry', actual ? null : predictedErrorStack(false)),
      ...put('forecast', forecastPoint(actual))
    ];

    if (actual) {
      a.push(
        ...put('actual', actualChristmas())
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Magnify the full forecast error.
  //
  // Regression guess = 31.
  // Predicted regression error = 3.
  // Full forecast = 34.
  // Real = 35.
  //
  // Full forecast error = 1, not 4.
  //
  // The four-room gap from 31 to 35 is the realised
  // regression error. Three rooms of that gap were
  // already predicted by the carryover rule.
  // ------------------------------------------------------------

  function finalErrorPicture() {
    const objects = [];

    const bottom = P ? -3.40 : -2.10;
    const top = P ? 0.78 : 0.87;

    const yy = value =>
      bottom + (value - 30) / 6 * (top - bottom);

    const axisX = CX - 2.12;
    const stackX = CX - 0.45;

    objects.push(
      txt(
        'CHECK THE FULL FORECAST',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [axisX, yy(30), 0],
        [axisX, yy(36), 0],
        C.muted,
        1.6
      )
    );

    for (let v = 30; v <= 36; v++) {
      objects.push(
        ln(
          [axisX - 0.06, yy(v), 0],
          [axisX + 0.06, yy(v), 0],
          C.muted,
          1.2
        ),
        txt(
          v,
          15,
          C.muted,
          [axisX - 0.29, yy(v), 0],
          true
        )
      );
    }

    objects.push(
      dash(
        [axisX + 0.10, yy(31), 0],
        [CX + 2.55, yy(31), 0],
        PINK
      ),
      txt(
        'Regression 31',
        15,
        PINK,
        [CX + 1.37, yy(31) - 0.30, 0]
      )
    );

    for (let j = 0; j < 3; j++) {
      objects.push(
        rect(
          0.93,
          (yy(32) - yy(31)) * 0.84,
          [stackX, yy(31 + j + 0.5), 0],
          GREEN,
          0.91
        )
      );
    }

    objects.push(
      txt(
        'Predicted +3',
        15,
        GREEN,
        [CX + 1.36, yy(32.35), 0]
      ),
      dash(
        [axisX + 0.10, yy(34), 0],
        [CX + 2.55, yy(34), 0],
        AMBER
      ),
      ring([stackX, yy(34), 0], AMBER, 0.13),
      txt(
        'Forecast 34',
        16,
        AMBER,
        [CX + 1.33, yy(34) - 0.24, 0]
      ),
      glow([stackX, yy(35), 0], WHITE, 0.11),
      dash(
        [axisX + 0.10, yy(35), 0],
        [CX + 2.55, yy(35), 0],
        WHITE
      ),
      txt(
        'Actual 35',
        16,
        WHITE,
        [CX + 1.33, yy(35) + 0.24, 0]
      )
    );

    const bx = CX + 0.30;

    objects.push(
      ln(
        [bx, yy(34), 0],
        [bx, yy(35), 0],
        RED,
        3.2
      ),
      ln(
        [bx - 0.07, yy(34), 0],
        [bx + 0.07, yy(34), 0],
        RED,
        2
      ),
      ln(
        [bx - 0.07, yy(35), 0],
        [bx + 0.07, yy(35), 0],
        RED,
        2
      ),
      tag(
        '1',
        RED,
        [bx + 0.45, yy(34.5), 0],
        16
      ),
      tag(
        'FULL FORECAST: ONE ROOM LOW',
        GREEN,
        [
          CX,
          bottom - 0.45,
          0
        ],
        14
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Warning: one large error is not enough evidence.
  //
  // Illustrate two hypothetical error patterns:
  //
  // A recurring positive relationship.
  // An isolated large gap without continuing effect.
  //
  // These are schematic patterns, not additional
  // observations from the hotel.
  // ------------------------------------------------------------

  function trapPicture() {
    const objects = [];

    const panels = [
      {
        x: CX - 1.48,
        values: [2, 3, 2, 3, 2],
        color: GREEN,
        label: 'Recurring pattern'
      },
      {
        x: CX + 1.48,
        values: [0, 0, 5, 0, 0],
        color: RED,
        label: 'Isolated event'
      }
    ];

    const base = P ? -2.65 : -1.70;
    const pitch = P ? 0.62 : 0.43;

    objects.push(
      txt(
        'ONE LARGE GAP IS NOT A PATTERN',
        19,
        RED,
        [CX, TITLE_Y, 0]
      )
    );

    panels.forEach(panel => {
      const { x, values, color, label } = panel;

      objects.push(
        rounded(
          2.70,
          pitch * 5.6 + 0.32,
          [
            x,
            base + pitch * 2.6,
            0
          ],
          color,
          0.025
        ),
        ln(
          [x - 1.13, base, 0],
          [x + 1.13, base, 0],
          WHITE,
          1.5
        ),
        txt(
          label,
          14,
          color,
          [x, base - 0.39, 0]
        )
      );

      values.forEach((value, i) => {
        const bx = x + (i - 2) * 0.42;

        if (value > 0) {
          objects.push(
            rect(
              0.31,
              value * pitch,
              [bx, base + value * pitch / 2, 0],
              color,
              0.86
            )
          );
        } else {
          objects.push(
            dot([bx, base, 0], C.muted, 0.045)
          );
        }
      });
    });

    objects.push(
      tag(
        'CHECK PAST ERRORS FOR EVIDENCE',
        AMBER,
        [CX, base - 0.94, 0],
        13
      ),
      txt(
        'Illustrative patterns — not hotel observations',
        12,
        C.muted,
        [CX, base - 1.33, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0–3: establish what is known before Christmas.
  // ============================================================

  // 0. You know which Saturday is Christmas before
  // you know how many rooms will fill.

  await until(S(0));
  await play(
    ...picture(openingPicture(false)),
    ...say('THE CALENDAR IS ALREADY KNOWN', PINK),
    ...fbox([
      ['Christmas = week 7', PINK],
      ['occupied rooms = ?', AMBER]
    ], PINK)
  );

  // 1. Can the calendar and last week's count both
  // help you plan the shift?

  await until(S(1));
  await play(
    ...put('picture', openingPicture(true)),
    ...say('USE THE CALENDAR AND THE RECENT COUNT', GREEN),
    ...fbox([
      ['calendar information', PINK],
      ['latest room count', CYAN],
      'combine both for the guess'
    ], GREEN)
  );

  // 2. Look at the cyan room counts through week six.

  await until(S(2));
  await play(
    ...chart([]),
    ...say('SIX KNOWN SATURDAY COUNTS'),
    ...fbox([
      ['weeks 1–6', CYAN],
      '20, 24, 20, 23, 24, 29'
    ])
  );

  // 3. Keep the Christmas dot hidden until the
  // forecast is ready.

  await until(S(3));
  await play(
    ...put('hidden', hiddenHolidays([7, 8])),
    ...say('KEEP THE HOLIDAY ACTUALS HIDDEN', AMBER),
    ...fbox([
      ['now = end of week 6', CYAN],
      ['Christmas = ?', AMBER],
      'make the forecast first'
    ], AMBER)
  );

  // ============================================================
  // 4–8: construct the regression staircase.
  // ============================================================

  // 4. Draw a staircase for a first guess.

  await until(S(4));
  await play(
    ...put(
      'stairPreview',
      new M.VGroup(
        startingHeight(false),
        stairStep(1, false),
        stairStep(2, false),
        stairStep(3, false)
      )
    ),
    ...put(
      'legend',
      legend([COUNT_KEY, STAIR_KEY])
    ),
    ...say('A STAIRCASE FOR THE FIRST GUESS', VIOLET),
    ...fbox([
      ['first guess', VIOLET],
      'a simple rising staircase'
    ], VIOLET)
  );

  // 5. Mark eighteen rooms as the starting height
  // just before week one.

  await until(S(5));
  await play(
    ...remove('stairPreview'),
    ...put('start', startingHeight(true)),
    ...put('guide', firstGuessGuide()),
    ...say('START AT 18 BEFORE WEEK ONE', VIOLET),
    ...fbox([
      ['starting height = 18', VIOLET],
      'before the first week'
    ], VIOLET)
  );

  // 6. Step up one room from eighteen to nineteen
  // for the week-one guess.

  await until(S(6));
  await play(
    ...remove('guide'),
    ...put('step1', stairStep(1, true)),
    ...say('WEEK ONE: STEP UP TO 19', VIOLET),
    ...fbox([
      '18 + 1',
      ['= 19 rooms', VIOLET]
    ], VIOLET)
  );

  // 7. Add one room for each step in the week number.

  await until(S(7));

  const stepAnimations = [];

  for (let week = 2; week <= 8; week++) {
    const obj = stairStep(week, true);

    visible['step' + week] = obj;

    stepAnimations.push(fadeIn(obj, 0.32));
  }

  await play(
    new M.LaggedStart(
      stepAnimations,
      {
        lagRatio: 0.12,
        runTime: 1.45
      }
    ),
    ...say('ONE MORE ROOM FOR EACH WEEK', VIOLET),
    ...fbox([
      ['staircase = 18 + week', VIOLET],
      'each step adds one room'
    ], VIOLET)
  );

  // 8. Put six extra room blocks on each holiday step.

  await until(S(8));
  await play(
    ...remove('hidden'),
    ...put('holiday7', holidayStack(7)),
    ...put('holiday8', holidayStack(8)),
    ...put(
      'legend',
      legend([COUNT_KEY, STAIR_KEY, HOLIDAY_KEY])
    ),
    ...say('ADD SIX EXTRA ROOMS ON EACH HOLIDAY', PINK),
    ...fbox([
      ['Christmas: 25 + 6 = 31', PINK],
      ['New Year: 26 + 6 = 32', PINK],
      'regression guesses only'
    ], PINK)
  );

  // ============================================================
  // 9–14: predictors and regression.
  // ============================================================

  // 9. Use a little switch for the holiday bump.

  await until(S(9));
  await play(
    ...picture(switchPicture(0)),
    ...say('USE A HOLIDAY SWITCH', PINK),
    ...fbox([
      ['holiday switch', PINK],
      'OFF or ON'
    ], PINK)
  );

  // 10. The switch is zero on an ordinary week.

  await until(S(10));
  await play(
    ...put('picture', switchPicture(1)),
    ...say('ORDINARY WEEK: SWITCH = 0', WHITE),
    ...fbox([
      ['holiday = 0', WHITE],
      ['6 × 0 = 0 extra rooms', VIOLET]
    ])
  );

  // 11. It's one for the Christmas and New Year weeks.

  await until(S(11));
  await play(
    ...put('picture', switchPicture(2)),
    ...say('HOLIDAY WEEK: SWITCH = 1', PINK),
    ...fbox([
      ['holiday = 1', PINK],
      ['6 × 1 = 6 extra rooms', PINK]
    ], PINK)
  );

  // 12. A fact a rule uses to make a guess
  // is called a predictor.

  await until(S(12));
  await play(
    ...picture(predictorsPicture(0)),
    ...say('PREDICTOR = A FACT USED TO MAKE A GUESS', GREEN),
    ...fbox([
      ['PREDICTOR', GREEN],
      'a fact the rule uses',
      'to make its guess'
    ], GREEN)
  );

  // 13. Here the week number and holiday switch
  // are the predictors.

  await until(S(13));
  await play(
    ...picture(calendarStrip()),
    ...say('TWO PREDICTORS: WEEK AND HOLIDAY', GREEN),
    ...fbox([
      ['week number', VIOLET],
      ['holiday switch', PINK],
      'both known in advance'
    ], GREEN)
  );

  // 14. A rule that ties a room guess to those
  // facts is called regression.

  await until(S(14));
  await play(
    ...picture(predictorsPicture(2)),
    ...say('REGRESSION LINKS THE GUESS TO THE FACTS', GREEN),
    ...fbox([
      ['REGRESSION', GREEN],
      '18 + week number',
      '+ 6 × holiday switch'
    ], GREEN)
  );

  // ============================================================
  // 15–19: measure the week-six regression error.
  // ============================================================

  // 15. In week six the staircase reaches
  // twenty-four rooms.

  await until(S(15));
  await play(
    ...chart(
      [7, 8],
      [COUNT_KEY, STAIR_KEY]
    ),
    ...put('stairs', stairs(6, true)),
    ...put('focus', regressionFocus(6)),
    ...say('WEEK SIX FIRST GUESS = 24', VIOLET),
    ...fbox([
      '18 + 6 + 6 × 0',
      ['= 24 rooms', VIOLET]
    ], VIOLET)
  );

  // 16. The cyan dot shows twenty-nine.

  await until(S(16));
  await play(
    ...put(
      'actualFocus',
      ring(pt(6, KNOWN[5]), CYAN, 0.19)
    ),
    ...say('WEEK SIX REAL COUNT = 29', CYAN),
    ...fbox([
      ['first guess = 24', VIOLET],
      ['real count = 29', CYAN]
    ])
  );

  // 17. Draw a bar for the five rooms above
  // the first guess.

  await until(S(17));
  await play(
    ...put('error6', chartErrorBar(6)),
    ...put('bracket', chartErrorBracket(6, true)),
    ...say('FIVE ROOMS ABOVE THE FIRST GUESS', GREEN),
    ...fbox([
      'bar starts at 24',
      'bar ends at 29',
      ['gap = +5', GREEN]
    ], GREEN)
  );

  // 18. Subtract the first guess from the real count.

  await until(S(18));
  await play(
    ...picture(errorCloseUp(1)),
    ...say('REAL COUNT MINUS FIRST GUESS', GREEN),
    ...fbox([
      '29 − 24',
      ['= +5 rooms', GREEN]
    ], GREEN)
  );

  // 19. That gap above or below the first guess
  // is called the regression error.

  await until(S(19));
  await play(
    ...put('picture', errorCloseUp(2)),
    ...say('THIS GAP IS THE REGRESSION ERROR', GREEN),
    ...fbox([
      ['regression error =', GREEN],
      'real count − regression guess'
    ], GREEN)
  );

  // ============================================================
  // 20–26: inspect the six regression errors.
  // ============================================================

  // 20. Look at the bars in order for all six weeks.

  await until(S(20));
  await play(
    ...errorsChart(0),
    ...say('PUT ALL SIX ERRORS IN WEEK ORDER', GREEN),
    ...fbox([
      ['zero = first guess was right', WHITE],
      ['above = positive error', GREEN],
      ['below = negative error', RED]
    ], GREEN)
  );

  // 21. Week one's real count was one room
  // above the staircase.

  await until(S(21));
  await play(
    ...put(
      'errorLabel1',
      errorLabel(1, ERRORS[0])
    ),
    ...put('focus', errorFocus(1)),
    ...say('WEEK ONE: +1', GREEN),
    ...fbox([
      '20 − 19',
      ['= +1 room', GREEN]
    ], GREEN)
  );

  // 22. Week two was four above.

  await until(S(22));
  await play(
    ...put(
      'errorLabel2',
      errorLabel(2, ERRORS[1])
    ),
    ...put('focus', errorFocus(2)),
    ...say('WEEK TWO: +4', GREEN),
    ...fbox([
      ['24 − 20 = +4', GREEN]
    ], GREEN)
  );

  // 23. Week three was one below.

  await until(S(23));
  await play(
    ...put(
      'errorLabel3',
      errorLabel(3, ERRORS[2])
    ),
    ...put('focus', errorFocus(3)),
    ...say('WEEK THREE: −1', RED),
    ...fbox([
      ['20 − 21 = −1', RED]
    ], RED)
  );

  // 24. Week four was one above.

  await until(S(24));
  await play(
    ...put(
      'errorLabel4',
      errorLabel(4, ERRORS[3])
    ),
    ...put('focus', errorFocus(4)),
    ...say('WEEK FOUR: +1', GREEN),
    ...fbox([
      ['23 − 22 = +1', GREEN]
    ], GREEN)
  );

  // 25. Week five was one above.

  await until(S(25));
  await play(
    ...put(
      'errorLabel5',
      errorLabel(5, ERRORS[4])
    ),
    ...put('focus', errorFocus(5)),
    ...say('WEEK FIVE: +1', GREEN),
    ...fbox([
      ['24 − 23 = +1', GREEN]
    ], GREEN)
  );

  // 26. Week six was five above.

  await until(S(26));
  await play(
    ...put(
      'errorLabel6',
      errorLabel(6, ERRORS[5])
    ),
    ...put('focus', errorFocus(6)),
    ...say('WEEK SIX: +5', GREEN),
    ...fbox([
      ['29 − 24 = +5', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 27–30: predict errors and name dynamic regression.
  // ============================================================

  // 27. The hotel's rule uses six tenths of the
  // latest regression error to predict the next one.

  await until(S(27));
  await play(
    ...picture(sharePicture(0)),
    ...say('KEEP SIX TENTHS OF THE LATEST ERROR', GREEN),
    ...fbox([
      ['latest regression error = 5', GREEN],
      ['carryover weight = 0.6', VIOLET]
    ], GREEN)
  );

  await until(S(27) + 1.45);
  await play(
    ...put('picture', sharePicture(1)),
    ...makeShareCopies()
  );

  await until(S(27) + 2.65);
  await play(
    moveShareCopies()
  );

  // 28. In this model, a gap above the staircase
  // leads to a smaller predicted gap above it.

  await until(S(28));
  await play(
    ...picture(errorCarryoverPicture()),
    ...say('A POSITIVE GAP PREDICTS A SMALLER POSITIVE GAP', GREEN),
    ...fbox([
      ['latest error = +5', GREEN],
      'keep six tenths',
      ['next predicted error = +3', GREEN]
    ], GREEN)
  );

  // 29. Errors that tend to go together across weeks
  // are called autocorrelated.

  await until(S(29));
  await play(
    ...indicate('picture', GREEN),
    ...say('ERRORS THAT GO TOGETHER ARE AUTOCORRELATED', GREEN),
    ...fbox([
      ['AUTOCORRELATED ERRORS', GREEN],
      'earlier errors help predict',
      'later errors'
    ], GREEN)
  );

  // 30. Using predictors and a rule for how errors
  // carry over is called dynamic regression.

  await until(S(30));
  await play(
    ...picture(dynamicPicture(false)),
    ...say('DYNAMIC REGRESSION', GREEN),
    ...fbox([
      ['known predictors', VIOLET],
      ['+ predicted error carryover', GREEN],
      ['= dynamic regression', AMBER]
    ], GREEN)
  );

  // ============================================================
  // 31–36: construct the Christmas forecast.
  // ============================================================

  // 31. Start the Christmas forecast with
  // the regression guess.

  await until(S(31));
  await play(
    ...picture(buildChristmas(0)),
    ...say('START WITH THE REGRESSION GUESS', VIOLET),
    ...fbox([
      ['starting height = 18', VIOLET],
      'add the known predictors',
      'before predicting the gap'
    ], VIOLET)
  );

  // 32. Eighteen plus seven for the week number
  // makes twenty-five.

  await until(S(32));
  await play(
    ...put('picture', buildChristmas(1)),
    ...say('18 + 7 = 25 ROOMS', VIOLET),
    ...fbox([
      ['starting height = 18', VIOLET],
      ['week number = 7', VIOLET],
      ['18 + 7 = 25', VIOLET]
    ], VIOLET)
  );

  // 33. Switch on the holiday blocks to reach
  // thirty-one rooms.

  await until(S(33));
  await play(
    ...put('picture', buildChristmas(2)),
    ...say('SWITCH ON SIX EXTRA HOLIDAY ROOMS', PINK),
    ...fbox([
      ['holiday switch = 1', PINK],
      '25 + 6 × 1',
      ['regression guess = 31', PINK]
    ], PINK)
  );

  // 34. Now predict the Christmas regression error
  // from last week's five-room error.

  await until(S(34));
  await play(
    ...picture(sharePicture(0)),
    ...say('NOW PREDICT THE REMAINING GAP', GREEN),
    ...fbox([
      ['latest regression error = 5', GREEN],
      ['carry forward 0.6 of it', VIOLET]
    ], GREEN)
  );

  await until(S(34) + 1.60);
  await play(
    ...put('picture', sharePicture(1)),
    ...makeShareCopies()
  );

  // 35. Six tenths of five is three rooms.

  await until(S(35));
  await play(
    moveShareCopies(),
    ...say('0.6 × 5 = 3 ROOMS', GREEN),
    ...fbox([
      'six half-room pieces',
      ['= 3 rooms', GREEN]
    ], GREEN)
  );

  // 36. Together the two pieces give a forecast
  // of thirty-four.

  await until(S(36));
  await play(
    ...picture(buildChristmas(3)),
    ...say('31 + 3 = 34 ROOMS', AMBER),
    ...fbox([
      ['regression guess = 31', PINK],
      ['predicted gap = 3', GREEN],
      ['full forecast = 34', AMBER]
    ], AMBER)
  );

  await until(S(36) + 1.70);
  await play(
    ...forecastChart(false)
  );

  // ============================================================
  // 37–39: state the full forecasting rule in words.
  // ============================================================

  // 37. In words, the regression guess starts at
  // eighteen plus the week number.

  await until(S(37));
  await play(
    ...picture(rulePicture(0)),
    ...say('FIRST: 18 PLUS THE WEEK NUMBER', VIOLET),
    ...fbox([
      ['starting height = 18', VIOLET],
      '+ week number',
      ['Christmas: 18 + 7 = 25', VIOLET]
    ], VIOLET)
  );

  // 38. Add six times the holiday switch to get
  // the complete regression guess.

  await until(S(38));
  await play(
    ...put('picture', rulePicture(1)),
    ...say('ADD SIX TIMES THE HOLIDAY SWITCH', PINK),
    ...fbox([
      'regression guess =',
      ['18 + week number', VIOLET],
      ['+ 6 × holiday switch', PINK]
    ], PINK)
  );

  // 39. The full forecast equals that guess plus
  // six tenths of last week's regression error.

  await until(S(39));
  await play(
    ...put('picture', rulePicture(2)),
    ...say('FULL FORECAST = GUESS + PREDICTED GAP', AMBER),
    ...fbox([
      ['full forecast = regression guess', AMBER],
      ['+ 0.6 × last regression error', GREEN],
      ['31 + 3 = 34', AMBER]
    ], AMBER)
  );

  await until(S(39) + 2.50);
  await play(
    ...forecastChart(false)
  );

  // ============================================================
  // 40–41: reveal and evaluate the Christmas forecast.
  // ============================================================

  // 40. Reveal the real Christmas dot at thirty-five.
  //
  // This is the first reveal of the actual count.
  // New Year's actual is still hidden.

  await until(S(40));
  await play(
    // Clear the week-7 stacks and the week-8 box so the
    // 34 ring, its badge and the 35 dot stand apart.
    ...put('holiday7', null),
    ...put('errorCarry', null),
    ...put('hidden', null),
    ...put('actual', actualChristmas()),
    ...put('forecast', forecastPoint(true)),
    ...put(
      'legend',
      legend([
        COUNT_KEY,
        STAIR_KEY,
        FORECAST_KEY,
        ACTUAL_KEY
      ])
    ),
    ...say('CHRISTMAS ACTUAL = 35 ROOMS', WHITE),
    ...fbox([
      ['full forecast = 34', AMBER],
      ['real count = 35', WHITE]
    ])
  );

  // 41. Thirty-five minus thirty-four gives an error
  // of one room for the full forecast.

  await until(S(41));
  await play(
    ...picture(finalErrorPicture()),
    ...say('35 − 34 = ONE ROOM LOW', GREEN),
    ...fbox([
      'full forecast error',
      ['35 − 34 = 1', GREEN],
      'one room too low'
    ], GREEN)
  );

  // ============================================================
  // 42–44: usefulness, trap and final recap.
  // ============================================================

  // 42. Use dynamic regression when both the calendar
  // and last week's gap tell you something useful.

  await until(S(42));
  await play(
    ...picture(dynamicPicture(true)),
    ...say('USE WHEN BOTH SOURCES ADD INFORMATION', GREEN),
    ...fbox([
      ['calendar: predictable demand', PINK],
      ['recent errors: useful carryover', GREEN],
      'combine the two'
    ], GREEN)
  );

  // 43. A single large gap can tempt you to carry
  // it forward without evidence of a pattern.

  await until(S(43));
  await play(
    ...picture(trapPicture()),
    ...say('TRAP: CARRYING FORWARD A ONE-OFF GAP', RED),
    ...fbox([
      ['one large error ≠ a pattern', RED],
      'check the earlier errors',
      'before fitting a carryover rule'
    ], RED)
  );

  // 44. Dynamic regression uses facts you know
  // in advance and a rule for predicting the
  // remaining gap.
  //
  // Final recap:
  // regression guess = 18 + 7 + 6 = 31.
  // predicted regression error = 0.6 × 5 = 3.
  // full forecast = 34.
  // actual = 35.
  // full forecast error = 1.

  await until(S(44));
  await play(
    ...picture(dynamicPicture(true)),
    ...say('KNOWN FACTS + A RULE FOR THE REMAINING GAP', GREEN),
    ...fbox([
      ['DYNAMIC REGRESSION', GREEN],
      ['regression guess = 31', PINK],
      ['predicted error = 3', GREEN]
    ], GREEN)
  );

  await until(S(44) + 2.50);
  await play(
    ...forecastChart(true),
    ...say('34 FORECAST — 35 ACTUAL — ERROR 1', AMBER),
    ...fbox([
      ['18 + 7 + 6 + 0.6 × 5', CYAN],
      ['forecast = 34 rooms', AMBER],
      ['35 − 34 = 1 room', GREEN]
    ], GREEN)
  );

  await until(E(44));
}
