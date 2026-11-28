// lesson 11.2.4
// Exponential smoothing: move a running guess toward each new count.
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
  // Exponential smoothing with weight one half:
  //
  // Week 1: start at 20.
  // Week 2: 20 + 0.5 × (24 - 20) = 22.
  // Week 3: 22 + 0.5 × (20 - 22) = 21.
  // Week 4: 21 + 0.5 × (23 - 21) = 22.
  // Week 5: 22 + 0.5 × (24 - 22) = 23.
  // Week 6: 23 + 0.5 × (29 - 23) = 26.
  //
  // Christmas forecast = 26.
  // Christmas actual   = 35.
  // Forecast error     = 9.
  //
  // Final level weights, newest to oldest:
  //
  // Week 6: 1/2
  // Week 5: 1/4
  // Week 4: 1/8
  // Week 3: 1/16
  // Week 2: 1/32
  // Week 1: 1/32
  //
  // The last two weights are equal because week one
  // supplied the starting level.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const LEVELS = [20, 22, 21, 22, 23, 26];

  const ALPHA = 0.5;
  const FORECAST = LEVELS[5];

  const BEFORE = [4, 2, 2, 2, 6];
  const AFTER = [2, 1, 1, 1, 3];

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';
  const PINK = C.pink || '#F28BB9';

  // Distinct colours for the contributions to the level.
  // Ordered newest to oldest.

  const WEIGHT_COLORS = [
    CYAN,
    GREEN,
    AMBER,
    VIOLET,
    PINK,
    '#91A8C9'
  ];

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
    ? [0, 2.85, 0]
    : [4.25, -0.25, 0];

  const AX0 = CX - (P ? 3.10 : 3.15);
  const AX1 = CX + (P ? 3.30 : 3.15);

  const AY0 = P ? -3.35 : -2.05;
  const AY1 = P ? 1.08 : 1.08;

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

  function ring(p, color, radius = 0.18) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.4
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function rect(w, h, p, color, opacity = 0.75) {
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
      Math.round(v * 1000) / 1000
    );
  }

  function signed(v) {
    if (v > 0) return '+' + fmt(v);
    if (v < 0) return '−' + fmt(-v);
    return '0';
  }

  // ------------------------------------------------------------
  // Independent scene object management.
  //
  // Track objects individually.
  // Never regroup objects that are already on screen.
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
      : 4.05;

    const maxh = P
      ? 2.65
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
  // Introductory picture.
  //
  // Compare four equally weighted weeks with a rule
  // that gives newer observations more say.
  //
  // These introductory bars are schematic weights,
  // not actual room counts.
  // ------------------------------------------------------------

  function equalWeightPicture(recent = false) {
    const objects = [];

    const spacing = 1.30;
    const base = P ? -2.80 : -1.80;

    const weights = recent
      ? [1, 2, 4, 8]
      : [4, 4, 4, 4];

    const scale = P ? 0.34 : 0.27;

    const titleY = P ? 0.75 : 1.20;

    objects.push(
      txt(
        recent
          ? 'MORE SAY FOR RECENT WEEKS'
          : 'FOUR WEEKS, EQUAL SAY',
        19,
        recent ? GREEN : VIOLET,
        [CX, titleY, 0]
      ),
      ln(
        [CX - 2.70, base, 0],
        [CX + 2.70, base, 0],
        C.muted,
        2
      )
    );

    weights.forEach((v, i) => {
      const x =
        CX + (i - 1.5) * spacing;

      const h = v * scale;

      const color = recent
        ? i === 3
          ? CYAN
          : GREEN
        : VIOLET;

      objects.push(
        rect(
          0.73,
          h,
          [x, base + h / 2, 0],
          color,
          recent
            ? 0.35 + i * 0.18
            : 0.76
        ),
        txt(
          ['older', '', '', 'newest'][i] || 'week',
          13,
          C.muted,
          [x, base - 0.32, 0]
        )
      );

      if (!recent) {
        objects.push(
          txt(
            '¼',
            19,
            VIOLET,
            [x, base + h + 0.27, 0],
            true
          )
        );
      }
    });

    if (recent) {
      objects.push(
        tag(
          'MORE WEIGHT',
          CYAN,
          [
            CX + 1.5 * spacing,
            base + weights[3] * scale + 0.32,
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Hotel chart.
  //
  // Cyan: observed counts.
  // Green: running level.
  // Amber dashed: forecast.
  // White: revealed Christmas actual.
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

  function chartLegend(
    level = true,
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

    const y = P ? AY0 - 1.02 : 1.45;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX + (
          i - (items.length - 1) / 2
        ) * spacing;

      const t = T(name, P ? 15 : 13, color);

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
          3.0
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

  function hiddenWeeks(weeks) {
    const objects = [];

    weeks.forEach(week => {
      const top = AY1 - 0.08;
      const bottom = AY0 + 0.09;

      const r = new M.RoundedRectangle({
        width: STEP * 0.79,
        height: top - bottom,
        cornerRadius: 0.08,
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
            AY0 + 0.42,
            0
          ],
          14
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function nowDivider(week) {
    const x =
      (X(week) + X(week + 1)) / 2;

    return new M.VGroup(
      dash(
        [x, AY0 + 0.05, 0],
        [x, AY1 - 0.07, 0],
        C.muted
      ),
      txt(
        'NOW',
        12,
        C.muted,
        [x + 0.30, AY1 + 0.12, 0]
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
      'levelMarker',
      'levelLabel',
      'levelTrail',
      'gap',
      'halfway',
      'forecast',
      'forecastLabel',
      'actual',
      'error',
      'forecastExtension',
      'holidayFocus'
    );
  }

  function clearPictures() {
    return remove(
      'intro',
      'gapBars',
      'weights',
      'weightOutline',
      'weightNote',
      'weightFocus'
    );
  }

  function drawChart(
    n,
    completedLevels = 0,
    futureWeeks = []
  ) {
    const a = [
      ...clearPictures(),
      ...clearChart(),
      ...put('axes', axes()),
      ...put(
        'series',
        observedSeries(n)
      ),
      ...put(
        'legend',
        chartLegend(completedLevels > 0)
      ),
      ...put(
        'now',
        nowDivider(n)
      )
    ];

    if (futureWeeks.length) {
      a.push(
        ...put(
          'hidden',
          hiddenWeeks(futureWeeks)
        )
      );
    }

    if (completedLevels > 0) {
      a.push(
        ...put(
          'levelTrail',
          levelTrail(completedLevels)
        ),
        ...put(
          'levelMarker',
          levelMarker(
            completedLevels,
            LEVELS[completedLevels - 1]
          )
        ),
        ...put(
          'levelLabel',
          levelLabel(
            completedLevels,
            LEVELS[completedLevels - 1]
          )
        )
      );
    }

    return a;
  }

  function revealWeek(week) {
    const remaining = [];

    for (
      let w = week + 1;
      w <= 8;
      w++
    ) {
      remaining.push(w);
    }

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
        remaining.length
          ? hiddenWeeks(remaining)
          : null
      )
    ];
  }

  // ------------------------------------------------------------
  // Running level marker.
  //
  // A green outlined diamond distinguishes the level
  // from the filled cyan observation.
  //
  // The marker moves horizontally at the old height
  // before seeing the next count.
  //
  // It then moves halfway vertically toward that count.
  // ------------------------------------------------------------

  function levelMarker(week, value) {
    const p = pt(week, value);

    const x = p[0];
    const y = p[1];

    const radius = 0.17;

    const halo = new M.Dot({
      point: p,
      radius: 0.25,
      color: GREEN
    });

    halo.setFill(GREEN, 0.15);

    const diamond = new M.VGroup(
      ln(
        [x, y + radius, 0],
        [x + radius, y, 0],
        GREEN,
        3
      ),
      ln(
        [x + radius, y, 0],
        [x, y - radius, 0],
        GREEN,
        3
      ),
      ln(
        [x, y - radius, 0],
        [x - radius, y, 0],
        GREEN,
        3
      ),
      ln(
        [x - radius, y, 0],
        [x, y + radius, 0],
        GREEN,
        3
      )
    );

    return new M.VGroup(
      halo,
      diamond
    );
  }

  function levelLabel(week, value) {
    return tag(
      fmt(value),
      GREEN,
      [
        X(week),
        Y(value) - 0.36,
        0
      ],
      15
    );
  }

  function moveLevel(
    week,
    value,
    time = 0.85
  ) {
    if (!visible.levelMarker) {
      return [
        ...put(
          'levelMarker',
          levelMarker(week, value)
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
        levelMarker(week, value),
        {
          runTime: time
        }
      ),
      new M.Transform(
        visible.levelLabel,
        levelLabel(week, value),
        {
          runTime: time
        }
      )
    ];
  }

  // Connect the completed levels with a thinner green
  // line so learners can compare the smoothed series
  // against the original room counts.

  function levelTrail(n) {
    const objects = [];

    for (let week = 2; week <= n; week++) {
      objects.push(
        ln(
          pt(week - 1, LEVELS[week - 2]),
          pt(week, LEVELS[week - 1]),
          GREEN,
          2.2
        )
      );
    }

    for (let week = 1; week <= n; week++) {
      objects.push(
        dot(
          pt(week, LEVELS[week - 1]),
          GREEN,
          0.048
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function completeLevel(week) {
    return put(
      'levelTrail',
      levelTrail(week)
    );
  }

  // ------------------------------------------------------------
  // Gap between the old level and the new count.
  //
  // Before-update gaps are shown in amber.
  // Remaining gaps after the halfway move are green.
  // ------------------------------------------------------------

  function gapBracket(
    week,
    level,
    actual,
    color = AMBER,
    label = null
  ) {
    const x = X(week) + 0.22;

    const y1 = Y(level);
    const y2 = Y(actual);

    const low = Math.min(y1, y2);
    const high = Math.max(y1, y2);

    const gap = Math.abs(actual - level);

    if (gap === 0) {
      return tag(
        '0',
        color,
        [x + 0.20, y1, 0],
        14
      );
    }

    const objects = [
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
      ),
      txt(
        label === null
          ? fmt(gap)
          : label,
        15,
        color,
        [
          x + 0.22,
          (low + high) / 2,
          0
        ],
        true
      )
    ];

    return new M.VGroup(...objects);
  }

  function halfwayPicture(
    week,
    oldLevel,
    actual
  ) {
    const newLevel =
      oldLevel + ALPHA * (
        actual - oldLevel
      );

    const x = X(week) - 0.22;

    const yOld = Y(oldLevel);
    const yNew = Y(newLevel);
    const yActual = Y(actual);

    const objects = [
      ln(
        [x, yOld, 0],
        [x, yNew, 0],
        GREEN,
        4
      ),
      dash(
        [x, yNew, 0],
        [x, yActual, 0],
        AMBER
      ),
      ln(
        [x - 0.10, yNew, 0],
        [x + 0.10, yNew, 0],
        GREEN,
        2.5
      )
    ];

    const direction =
      newLevel >= oldLevel ? 1 : -1;

    objects.push(
      ln(
        [x - 0.075, yNew - direction * 0.11, 0],
        [x, yNew, 0],
        GREEN,
        2
      ),
      ln(
        [x + 0.075, yNew - direction * 0.11, 0],
        [x, yNew, 0],
        GREEN,
        2
      )
    );

    return new M.VGroup(...objects);
  }

  function beginUpdate(week) {
    const oldLevel =
      LEVELS[week - 2];

    return [
      ...remove(
        'gap',
        'halfway'
      ),
      ...revealWeek(week),
      ...moveLevel(
        week,
        oldLevel,
        0.70
      )
    ];
  }

  function finishUpdate(week) {
    const oldLevel =
      LEVELS[week - 2];

    const newLevel =
      LEVELS[week - 1];

    const actual =
      DATA[week - 1];

    return [
      ...remove('gap'),
      ...put(
        'halfway',
        halfwayPicture(
          week,
          oldLevel,
          actual
        )
      ),
      ...moveLevel(
        week,
        newLevel,
        0.95
      ),
      ...completeLevel(week)
    ];
  }

  function remainingGap(week) {
    return [
      ...remove('halfway'),
      ...put(
        'gap',
        gapBracket(
          week,
          LEVELS[week - 1],
          DATA[week - 1],
          GREEN
        )
      )
    ];
  }

  // ------------------------------------------------------------
  // Gap comparison bars.
  //
  // Absolute gaps before updating:
  //   4, 2, 2, 2, 6
  //
  // Absolute gaps after updating:
  //   2, 1, 1, 1, 3
  //
  // Every pair uses the same scale.
  // Each green bar is half its corresponding amber bar.
  // ------------------------------------------------------------

  function gapBars(showAfter = false, highlight = false) {
    const objects = [];

    const base = P ? -3.05 : -2.05;
    const scale = P ? 0.54 : 0.40;

    const spacing = 1.12;
    const bw = 0.33;
    const separation = 0.22;

    const left = CX - 2.76;
    const right = CX + 2.76;

    objects.push(
      txt(
        'GAP AT EACH UPDATE',
        20,
        C.ink,
        [CX, P ? 1.03 : 1.20, 0]
      ),
      ln(
        [left, base, 0],
        [right, base, 0],
        C.muted,
        2
      )
    );

    const legendY =
      P ? 0.48 : 0.90;

    objects.push(
      rect(
        0.24,
        0.18,
        [CX - 1.75, legendY, 0],
        AMBER,
        0.82
      ),
      txt(
        'Before',
        14,
        AMBER,
        [CX - 1.11, legendY, 0]
      )
    );

    if (showAfter) {
      objects.push(
        rect(
          0.24,
          0.18,
          [CX + 0.72, legendY, 0],
          GREEN,
          0.85
        ),
        txt(
          'After',
          14,
          GREEN,
          [CX + 1.30, legendY, 0]
        )
      );
    }

    BEFORE.forEach((v, i) => {
      const x =
        CX + (i - 2) * spacing;

      const bx =
        x - separation;

      const ax =
        x + separation;

      const beforeHeight = v * scale;
      const afterHeight = AFTER[i] * scale;

      objects.push(
        rect(
          bw,
          beforeHeight,
          [
            bx,
            base + beforeHeight / 2,
            0
          ],
          AMBER,
          0.74
        ),
        txt(
          String(v),
          16,
          AMBER,
          [
            bx,
            base + beforeHeight + 0.22,
            0
          ],
          true
        ),
        txt(
          'W' + (i + 2),
          15,
          C.muted,
          [
            x,
            base - 0.28,
            0
          ],
          true
        )
      );

      if (showAfter) {
        objects.push(
          rect(
            bw,
            afterHeight,
            [
              ax,
              base + afterHeight / 2,
              0
            ],
            GREEN,
            0.87
          ),
          txt(
            String(AFTER[i]),
            16,
            GREEN,
            [
              ax,
              base + afterHeight + 0.22,
              0
            ],
            true
          )
        );
      }

      if (showAfter && highlight) {
        objects.push(
          dash(
            [
              bx - bw / 2,
              base + beforeHeight / 2,
              0
            ],
            [
              ax + bw / 2,
              base + afterHeight,
              0
            ],
            WHITE
          )
        );
      }
    });

    if (highlight) {
      objects.push(
        tag(
          'EACH GAP HALVED',
          GREEN,
          [
            CX,
            base - 0.75,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Exponential weights strip.
  //
  // One whole strip represents the entire level.
  //
  // Start with the newest count receiving half.
  // Split the remaining half repeatedly.
  //
  // The final two pieces are each 1/32:
  // one for week two, one for the starting week.
  //
  // All segments have mathematically accurate widths.
  // ------------------------------------------------------------

  const WEIGHTS = [
    {
      week: 6,
      value: 29,
      share: 1 / 2,
      fraction: '1/2',
      glyph: '½',
      contribution: 14.5
    },
    {
      week: 5,
      value: 24,
      share: 1 / 4,
      fraction: '1/4',
      glyph: '¼',
      contribution: 6
    },
    {
      week: 4,
      value: 23,
      share: 1 / 8,
      fraction: '1/8',
      glyph: '⅛',
      contribution: 2.875
    },
    {
      week: 3,
      value: 20,
      share: 1 / 16,
      fraction: '1/16',
      glyph: '1/16',
      contribution: 1.25
    },
    {
      week: 2,
      value: 24,
      share: 1 / 32,
      fraction: '1/32',
      glyph: '1/32',
      contribution: 0.75
    },
    {
      week: 1,
      value: 20,
      share: 1 / 32,
      fraction: '1/32',
      glyph: '1/32',
      contribution: 0.625
    }
  ];

  const STRIP_W = P ? 6.15 : 5.70;
  const STRIP_H = P ? 0.72 : 0.62;

  const STRIP_Y = P ? 0.10 : 0.32;
  const STRIP_LEFT = CX - STRIP_W / 2;

  function stripX(fraction) {
    return STRIP_LEFT + fraction * STRIP_W;
  }

  function stripPiece(
    start,
    share,
    color,
    opacity = 0.84
  ) {
    return rect(
      STRIP_W * share,
      STRIP_H,
      [
        stripX(start + share / 2),
        STRIP_Y,
        0
      ],
      color,
      opacity
    );
  }

  function stripOutline() {
    const r = new M.RoundedRectangle({
      width: STRIP_W + 0.025,
      height: STRIP_H + 0.025,
      cornerRadius: 0.055,
      color: WHITE,
      strokeWidth: 1.7
    });

    r.setFill(WHITE, 0);
    r.moveTo([CX, STRIP_Y, 0]);

    return r;
  }

  // Small ledger below the strip identifies pieces
  // too narrow to hold their own fraction labels.

  function weightLedger(assigned) {
    const objects = [];

    const colGap = P ? 2.92 : 2.70;
    const firstY = STRIP_Y - 0.90;
    const rowGap = P ? 0.64 : 0.53;

    for (let i = 0; i < 6; i++) {
      const col = i < 3 ? 0 : 1;
      const row = i % 3;

      const x =
        CX + (col - 0.5) * colGap;

      const y =
        firstY - row * rowGap;

      const w = WEIGHTS[i];
      const color =
        i < assigned
          ? WEIGHT_COLORS[i]
          : C.muted;

      objects.push(
        rect(
          0.18,
          0.18,
          [x - 0.99, y, 0],
          color,
          i < assigned ? 0.95 : 0.12
        ),
        txt(
          `W${w.week}`,
          15,
          color,
          [x - 0.61, y, 0],
          true
        ),
        txt(
          i < assigned
            ? w.fraction
            : '—',
          16,
          color,
          [x + 0.36, y, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function weightStrip(
    assigned,
    oldLabel = false,
    previewSplit = false
  ) {
    const objects = [];

    objects.push(
      txt(
        'WHAT MAKES UP THE LEVEL AT WEEK 6?',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          STRIP_Y + 1.10,
          0
        ]
      )
    );

    let start = 0;

    for (let i = 0; i < assigned; i++) {
      const w = WEIGHTS[i];
      const color = WEIGHT_COLORS[i];

      objects.push(
        stripPiece(
          start,
          w.share,
          color,
          0.85
        )
      );

      if (w.share >= 1 / 4) {
        objects.push(
          txt(
            w.glyph,
            20,
            C.card,
            [
              stripX(
                start + w.share / 2
              ),
              STRIP_Y,
              0
            ],
            true
          )
        );
      }

      start += w.share;
    }

    const remaining = Math.max(0, 1 - start);

    if (remaining > 1e-9) {
      objects.push(
        stripPiece(
          start,
          remaining,
          C.muted,
          0.23
        )
      );

      if (assigned === 0) {
        objects.push(
          txt(
            'WHOLE LEVEL',
            19,
            WHITE,
            [CX, STRIP_Y, 0]
          )
        );
      } else if (
        oldLabel &&
        remaining >= 1 / 4
      ) {
        objects.push(
          txt(
            'OLD LEVEL',
            15,
            WHITE,
            [
              stripX(
                start + remaining / 2
              ),
              previewSplit
                ? STRIP_Y + STRIP_H / 2 + 0.2
                : STRIP_Y,
              0
            ]
          )
        );
      }

      if (
        previewSplit &&
        remaining > 0
      ) {
        const middle =
          start + remaining / 2;

        objects.push(
          ln(
            [
              stripX(middle),
              STRIP_Y - STRIP_H / 2,
              0
            ],
            [
              stripX(middle),
              STRIP_Y + STRIP_H / 2,
              0
            ],
            WHITE,
            2.6
          )
        );
      }
    }

    objects.push(
      stripOutline(),
      weightLedger(assigned)
    );

    objects.push(
      txt(
        'newest',
        13,
        CYAN,
        [
          STRIP_LEFT + 0.34,
          STRIP_Y + 0.58,
          0
        ]
      ),
      txt(
        'oldest',
        13,
        C.muted,
        [
          STRIP_LEFT + STRIP_W - 0.34,
          STRIP_Y + 0.58,
          0
        ]
      )
    );

    if (assigned === 6) {
      objects.push(
        tag(
          'ALL SHARES ADD TO 1',
          GREEN,
          [
            CX,
            P ? -3.55 : -2.38,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function highlightWeight(index) {
    let start = 0;

    for (let i = 0; i < index; i++) {
      start += WEIGHTS[i].share;
    }

    const w = WEIGHTS[index];
    const color = WEIGHT_COLORS[index];

    const x = stripX(
      start + w.share / 2
    );

    const width =
      STRIP_W * w.share;

    const r = new M.Rectangle({
      width: width + 0.05,
      height: STRIP_H + 0.12,
      color: WHITE,
      strokeWidth: 2.2
    });

    r.setFill(color, 0);
    r.moveTo([x, STRIP_Y, 0]);

    const guide = ln(
      [x, STRIP_Y - STRIP_H / 2 - 0.06, 0],
      [x, STRIP_Y - STRIP_H / 2 - 0.22, 0],
      WHITE,
      1.5
    );

    return new M.VGroup(
      r,
      guide
    );
  }

  function oldHalfOutline() {
    const r = new M.Rectangle({
      width: STRIP_W / 2 + 0.05,
      height: STRIP_H + 0.14,
      color: VIOLET,
      strokeWidth: 2.7
    });

    r.setFill(VIOLET, 0.025);

    r.moveTo([
      stripX(0.75),
      STRIP_Y,
      0
    ]);

    return r;
  }

  function weightPicture(
    assigned,
    index = null,
    oldLabel = false,
    previewSplit = false
  ) {
    const a = [
      ...remove(
        'weightOutline',
        'weightFocus',
        'weightNote'
      ),
      ...put(
        'weights',
        weightStrip(
          assigned,
          oldLabel,
          previewSplit
        )
      )
    ];

    if (index !== null) {
      a.push(
        ...put(
          'weightFocus',
          highlightWeight(index)
        )
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Forecast and actual-count visuals.
  //
  // After the final update, the level is 26.
  // Simple exponential smoothing uses that same
  // level for the next forecast.
  //
  // Without new observations, the future forecast
  // stays flat.
  // ------------------------------------------------------------

  function forecastPicture(
    week,
    value,
    fromWeek = 6
  ) {
    const p = pt(week, value);

    return new M.VGroup(
      dash(
        pt(fromWeek, value),
        p,
        AMBER
      ),
      dash(
        [X(week), AY0 + 0.04, 0],
        [X(week), Y(value) - 0.17, 0],
        AMBER
      ),
      ring(p, AMBER, 0.16),
      dot(p, AMBER, 0.055)
    );
  }

  function forecastLabel(week, value) {
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
        pt(
          week - 1,
          DATA[week - 2]
        ),
        pt(week, value),
        WHITE,
        2.2
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

  function forecastError(
    week,
    forecast,
    actual
  ) {
    const x = X(week) + 0.21;

    const low =
      Y(Math.min(forecast, actual));

    const high =
      Y(Math.max(forecast, actual));

    return new M.VGroup(
      ln(
        [x, low, 0],
        [x, high, 0],
        RED,
        3
      ),
      ln(
        [x - 0.07, low, 0],
        [x + 0.07, low, 0],
        RED,
        2
      ),
      ln(
        [x - 0.07, high, 0],
        [x + 0.07, high, 0],
        RED,
        2
      ),
      txt(
        fmt(actual - forecast),
        17,
        RED,
        [
          x + 0.20,
          (low + high) / 2,
          0
        ],
        true
      )
    );
  }

  function flatExtension() {
    return new M.VGroup(
      dash(
        pt(7, FORECAST),
        pt(8, FORECAST),
        AMBER
      ),
      ring(
        pt(8, FORECAST),
        AMBER,
        0.15
      ),
      dot(
        pt(8, FORECAST),
        AMBER,
        0.05
      ),
      tag(
        '26',
        AMBER,
        [
          X(8),
          Y(FORECAST) - 0.34,
          0
        ],
        14
      ),
      txt(
        'forecast from week 6',
        13,
        AMBER,
        [
          (X(6) + X(8)) / 2,
          AY0 + 0.43,
          0
        ]
      )
    );
  }

  // ============================================================
  // 0–2: introduce the need for unequal weights.
  // ============================================================

  // 0. The hotel needs a Christmas forecast.

  await until(S(0));
  await play(
    ...put(
      'intro',
      new M.VGroup(
        tag(
          'CHRISTMAS',
          AMBER,
          [CX, 0.55, 0],
          26
        ),
        tag(
          'HOW MANY ROOMS?',
          AMBER,
          [CX, -0.18, 0],
          24
        )
      )
    ),
    ...say('MAKE A GUESS FOR CHRISTMAS WEEK', AMBER),
    ...fbox([
      ['HOTEL', CYAN],
      '40 rooms available',
      '',
      'need a room forecast',
      ['Christmas: ?', AMBER]
    ], AMBER)
  );

  // 1. Recall the equal-weight moving average.

  await until(S(1));
  await play(
    ...put(
      'intro',
      equalWeightPicture(false)
    ),
    ...say('MOVING AVERAGE: FOUR EQUAL SHARES', VIOLET),
    ...fbox([
      ['PREVIOUS RULE', VIOLET],
      'four-week window',
      '',
      'each week gets 1/4',
      'of the total say'
    ], VIOLET)
  );

  // 2. Give newer weeks more say.

  await until(S(2));
  await play(
    ...put(
      'intro',
      equalWeightPicture(true)
    ),
    ...say('GIVE RECENT WEEKS MORE SAY', GREEN),
    ...fbox([
      ['NEW IDEA', GREEN],
      '',
      'newer counts:',
      ['more weight', CYAN],
      'older counts:',
      ['less weight', C.muted]
    ], GREEN)
  );

  // ============================================================
  // 3–6: establish the running level.
  // ============================================================

  // 3. Show only week one's observed count.

  await until(S(3));
  await play(
    ...drawChart(
      1,
      0,
      [2, 3, 4, 5, 6, 7, 8]
    ),
    ...say('START WITH WEEK 1: 20 ROOMS'),
    ...fbox([
      ['WEEK 1', CYAN],
      '20 occupied rooms',
      '',
      'later counts',
      'are still hidden'
    ])
  );

  // 4. Keep Christmas hidden.

  await until(S(4));
  await play(
    ...say('KEEP CHRISTMAS HIDDEN', AMBER),
    ...fbox([
      ['KNOWN SO FAR', CYAN],
      'week 1 = 20',
      '',
      ['Christmas = ?', AMBER]
    ], AMBER)
  );

  // 5. Place a level marker on week one's count.

  await until(S(5));
  await play(
    ...put(
      'levelMarker',
      levelMarker(1, 20)
    ),
    ...put(
      'levelLabel',
      levelLabel(1, 20)
    ),
    ...completeLevel(1),
    ...put(
      'legend',
      chartLegend(true)
    ),
    ...say('START THE MARKER AT 20', GREEN),
    ...fbox([
      'first count = 20',
      '',
      ['starting marker = 20', GREEN]
    ], GREEN)
  );

  // 6. Name the level.

  await until(S(6));
  await play(
    new M.Indicate(
      visible.levelMarker,
      { color: GREEN }
    ),
    ...say('LEVEL = OUR RUNNING GUESS', GREEN),
    ...fbox([
      ['LEVEL', GREEN],
      'our estimate of',
      'a typical week',
      '',
      'keep updating it',
      'as new counts arrive'
    ], GREEN)
  );

  // ============================================================
  // 7–11: first update.
  //
  // Old level: 20.
  // New count: 24.
  // Gap: +4.
  // Half the gap: +2.
  // New level: 22.
  // Remaining gap: 2.
  // ============================================================

  // 7. Week two arrives at 24.

  await until(S(7));
  await play(
    ...beginUpdate(2),
    ...say('WEEK 2 ARRIVES: 24 ROOMS'),
    ...fbox([
      ['old level = 20', GREEN],
      ['new count = 24', CYAN],
      '',
      'the new dot is higher'
    ])
  );

  // 8. Error before the move = 4.

  await until(S(8));
  await play(
    ...put(
      'gap',
      gapBracket(
        2,
        20,
        24,
        AMBER
      )
    ),
    ...say('BEFORE THE MOVE: 4 ROOMS LOW', AMBER),
    ...fbox([
      ['actual = 24', CYAN],
      ['old guess = 20', GREEN],
      '',
      ['24 − 20 = +4', AMBER]
    ], AMBER)
  );

  // 9. Move halfway toward the new count.

  await until(S(9));
  await play(
    ...finishUpdate(2),
    ...say('MOVE HALFWAY TOWARD THE NEW DOT', GREEN),
    ...fbox([
      'gap = +4',
      ['take half the gap', GREEN],
      '',
      '4 ÷ 2 = 2'
    ], GREEN)
  );

  // 10. New level = 22.

  await until(S(10));
  await play(
    ...say('MOVE UP 2: NEW LEVEL = 22', GREEN),
    ...fbox([
      'old level = 20',
      ['half the gap = +2', GREEN],
      '',
      ['20 + 2 = 22', GREEN]
    ], GREEN),
    new M.Indicate(
      visible.levelLabel,
      { color: GREEN }
    )
  );

  // 11. Remaining gap = 2.

  await until(S(11));
  await play(
    ...remainingGap(2),
    ...say('AFTER THE MOVE: ONLY 2 ROOMS AWAY', GREEN),
    ...fbox([
      ['before: 4 rooms', AMBER],
      ['after:  2 rooms', GREEN],
      '',
      ['the gap was halved', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 12–16: second update.
  //
  // Old level: 22.
  // New count: 20.
  // Signed gap: -2.
  // Half the gap: -1.
  // New level: 21.
  // Remaining absolute gap: 1.
  // ============================================================

  // 12. Carry the previous level to week three.

  await until(S(12));
  await play(
    ...remove(
      'gap',
      'halfway'
    ),
    ...moveLevel(
      3,
      22,
      0.85
    ),
    ...say('WEEK 3 STARTS WITH THE GUESS OF 22', GREEN),
    ...fbox([
      'previous level = 22',
      '',
      ['next guess = 22', GREEN],
      'new count still hidden'
    ], GREEN)
  );

  // 13. Week three actual is 20.

  await until(S(13));
  await play(
    ...revealWeek(3),
    ...put(
      'gap',
      gapBracket(
        3,
        22,
        20,
        AMBER
      )
    ),
    ...say('ACTUAL IS 20: THE GUESS IS 2 HIGH', AMBER),
    ...fbox([
      ['actual = 20', CYAN],
      ['old level = 22', GREEN],
      '',
      ['20 − 22 = −2', AMBER],
      'move downward'
    ], AMBER)
  );

  // 14. Half of the two-room gap is one room.

  await until(S(14));
  await play(
    ...say('HALF OF 2 ROOMS IS 1 ROOM', GREEN),
    ...fbox([
      'gap = −2',
      '',
      ['half the gap = −1', GREEN],
      'one room downward'
    ], GREEN)
  );

  // 15. Move down one room to 21.

  await until(S(15));
  await play(
    ...finishUpdate(3),
    ...say('MOVE DOWN 1: NEW LEVEL = 21', GREEN),
    ...fbox([
      'old level = 22',
      ['half gap = −1', GREEN],
      '',
      ['22 − 1 = 21', GREEN]
    ], GREEN)
  );

  // 16. Remaining gap = 1.

  await until(S(16));
  await play(
    ...remainingGap(3),
    ...say('AFTER THE MOVE: 1 ROOM AWAY', GREEN),
    ...fbox([
      ['before: 2 rooms', AMBER],
      ['after:  1 room', GREEN],
      '',
      'half the original gap'
    ], GREEN)
  );

  // ============================================================
  // 17–20: third update.
  //
  // Old level: 21.
  // New count: 23.
  // Gap: +2.
  // Half the gap: +1.
  // New level: 22.
  // Remaining gap: 1.
  // ============================================================

  // 17. Carry 21 into week four.

  await until(S(17));
  await play(
    ...remove(
      'gap',
      'halfway'
    ),
    ...moveLevel(
      4,
      21,
      0.80
    ),
    ...say('WEEK 4 STARTS AT 21', GREEN),
    ...fbox([
      'previous level = 21',
      '',
      ['starting guess = 21', GREEN]
    ], GREEN)
  );

  // 18. Week four actual is 23.

  await until(S(18));
  await play(
    ...revealWeek(4),
    ...put(
      'gap',
      gapBracket(
        4,
        21,
        23,
        AMBER
      )
    ),
    ...say('ACTUAL IS 23: THE GUESS IS 2 LOW', AMBER),
    ...fbox([
      ['actual = 23', CYAN],
      ['old level = 21', GREEN],
      '',
      ['23 − 21 = +2', AMBER]
    ], AMBER)
  );

  // 19. Move halfway upward to 22.

  await until(S(19));
  await play(
    ...finishUpdate(4),
    ...say('MOVE UP 1: NEW LEVEL = 22', GREEN),
    ...fbox([
      'old level = 21',
      'gap = +2',
      ['half gap = +1', GREEN],
      '',
      ['21 + 1 = 22', GREEN]
    ], GREEN)
  );

  // 20. Remaining gap is again one room.

  await until(S(20));
  await play(
    ...remainingGap(4),
    ...say('AGAIN, THE GAP IS HALVED', GREEN),
    ...fbox([
      ['before: 2 rooms', AMBER],
      ['after:  1 room', GREEN],
      '',
      'same update rule',
      'at every week'
    ], GREEN)
  );

  // ============================================================
  // 21–23: complete the remaining two updates.
  // ============================================================

  // 21. Move faster through the remaining weeks.

  await until(S(21));
  await play(
    ...remove(
      'gap',
      'halfway'
    ),
    ...say('REPEAT THE SAME HALFWAY RULE', GREEN),
    ...fbox([
      'levels so far',
      '',
      ['20 → 22 → 21 → 22', GREEN],
      '',
      'two more updates'
    ], GREEN)
  );

  // 22. Week five is 24.
  // Old level 22 moves halfway to 23.

  await until(S(22));
  await play(
    ...beginUpdate(5),
    ...say('WEEK 5: 24 PULLS THE LEVEL UP', GREEN),
    ...fbox([
      ['old level = 22', GREEN],
      ['new count = 24', CYAN],
      'gap = +2',
      ['half gap = +1', GREEN],
      ['new level = 23', GREEN]
    ], GREEN)
  );

  await until(S(22) + 1.0);

  await play(
    ...finishUpdate(5)
  );

  // 23. Week six is 29.
  // Old level 23 moves halfway to 26.

  await until(S(23));
  await play(
    ...beginUpdate(6),
    ...say('WEEK 6: 29 PULLS THE LEVEL TO 26', GREEN),
    ...fbox([
      ['old level = 23', GREEN],
      ['new count = 29', CYAN],
      'gap = +6',
      ['half gap = +3', GREEN],
      ['new level = 26', GREEN]
    ], GREEN)
  );

  await until(S(23) + 1.10);

  await play(
    ...finishUpdate(6)
  );

  // ============================================================
  // 24–26: compare every before-and-after gap.
  // ============================================================

  // 24. Draw the gaps before each move.

  await until(S(24));
  await play(
    ...clearChart(),
    ...put(
      'gapBars',
      gapBars(false)
    ),
    ...say('GAPS BEFORE EACH UPDATE', AMBER),
    ...fbox([
      ['BEFORE MOVING', AMBER],
      'week 2: 4',
      'week 3: 2',
      'week 4: 2',
      'week 5: 2',
      'week 6: 6'
    ], AMBER)
  );

  // 25. Add the shorter after-update bars.

  await until(S(25));
  await play(
    ...put(
      'gapBars',
      gapBars(true)
    ),
    ...say('GAPS AFTER EACH UPDATE', GREEN),
    ...fbox([
      'week  before  after',
      ['  2      4      2', GREEN],
      ['  3      2      1', GREEN],
      ['  4      2      1', GREEN],
      ['  5      2      1', GREEN],
      ['  6      6      3', GREEN]
    ], GREEN)
  );

  // 26. Every move halves its own gap.

  await until(S(26));
  await play(
    ...put(
      'gapBars',
      gapBars(true, true)
    ),
    ...say('EVERY UPDATE HALVES ITS OWN GAP', GREEN),
    ...fbox([
      ['4 → 2', GREEN],
      ['2 → 1', GREEN],
      ['6 → 3', GREEN],
      '',
      'big gap or small gap:',
      ['always take half', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 27–36: uncover the hidden weights.
  //
  // The level at week six is made from:
  //
  // 1/2  of week six,
  // 1/4  of week five,
  // 1/8  of week four,
  // 1/16 of week three,
  // 1/32 of week two,
  // 1/32 of week one.
  //
  // Every partition of the strip uses exact proportions.
  // ============================================================

  // 27. Draw the entire level as one strip.

  await until(S(27));
  await play(
    ...remove('gapBars'),
    ...put(
      'weights',
      weightStrip(0)
    ),
    ...say('ONE WHOLE STRIP = THE LEVEL AT WEEK 6', GREEN),
    ...fbox([
      ['FINAL LEVEL = 26', GREEN],
      '',
      'made from pieces',
      'of the six known counts'
    ], GREEN)
  );

  // 28. Half comes from the newest dot.

  await until(S(28));
  await play(
    ...weightPicture(
      1,
      0,
      false
    ),
    ...say('WEEK 6 GETS HALF OF THE WHOLE STRIP', CYAN),
    ...fbox([
      ['newest count = 29', CYAN],
      ['weight = 1/2', CYAN],
      '',
      'half of the final level'
    ], CYAN)
  );

  // 29. The other half is the previous level.

  await until(S(29));
  await play(
    ...weightPicture(
      1,
      null,
      true
    ),
    ...put(
      'weightOutline',
      oldHalfOutline()
    ),
    ...say('THE OTHER HALF COMES FROM THE OLD LEVEL', VIOLET),
    ...fbox([
      ['new count = 29', CYAN],
      ['old level = 23', VIOLET],
      '',
      'half of each',
      ['(29 + 23) ÷ 2 = 26', GREEN]
    ], GREEN)
  );

  // 30. The previous level was itself a mixture.
  // Half of that previous level came from week five.

  await until(S(30));
  await play(
    ...say('THE OLD LEVEL ALSO CONTAINS TWO HALVES', VIOLET),
    ...fbox([
      ['old level at week 5', VIOLET],
      '',
      'half from week 5',
      'half from the level',
      'before week 5'
    ], VIOLET)
  );

  // 31. Split the remaining half into two pieces.

  await until(S(31));
  await play(
    ...weightPicture(
      1,
      null,
      true,
      true
    ),
    ...say('SPLIT THE OLD HALF IN TWO', VIOLET),
    ...fbox([
      'old share = 1/2',
      '',
      'split it equally:',
      ['1/2 ÷ 2 = 1/4', GREEN]
    ], VIOLET)
  );

  // 32. Week five receives one quarter of the whole.

  await until(S(32));
  await play(
    ...weightPicture(
      2,
      1,
      true
    ),
    ...say('WEEK 5 GETS ONE QUARTER', GREEN),
    ...fbox([
      ['week 6: 1/2', WEIGHT_COLORS[0]],
      ['week 5: 1/4', WEIGHT_COLORS[1]],
      '',
      'the remaining quarter',
      'comes from older weeks'
    ], GREEN)
  );

  // 33. Week four receives an eighth.

  await until(S(33));
  await play(
    ...weightPicture(
      3,
      2
    ),
    ...say('WEEK 4 GETS ONE EIGHTH', AMBER),
    ...fbox([
      'half of 1/4',
      ['= 1/8', AMBER],
      '',
      'week 4 weight'
    ], AMBER)
  );

  // 34. Week three receives a sixteenth.

  await until(S(34));
  await play(
    ...weightPicture(
      4,
      3
    ),
    ...say('WEEK 3 GETS ONE SIXTEENTH', VIOLET),
    ...fbox([
      'half of 1/8',
      ['= 1/16', VIOLET],
      '',
      'week 3 weight'
    ], VIOLET)
  );

  // 35. Week two receives a thirty-second.

  await until(S(35));
  await play(
    ...weightPicture(
      5,
      4
    ),
    ...say('WEEK 2 GETS ONE THIRTY-SECOND', PINK),
    ...fbox([
      'half of 1/16',
      ['= 1/32', PINK],
      '',
      'week 2 weight'
    ], PINK)
  );

  // 36. Week one supplies the last thirty-second.
  //
  // Do not halve this final remainder again:
  // week one's count initialized the level.

  await until(S(36));
  await play(
    ...weightPicture(
      6,
      5
    ),
    ...say('WEEK 1 SUPPLIES THE FINAL THIRTY-SECOND'),
    ...fbox([
      ['week 2: 1/32', WEIGHT_COLORS[4]],
      ['week 1: 1/32', WEIGHT_COLORS[5]],
      '',
      'week 1 supplied',
      'the starting level'
    ])
  );

  // ============================================================
  // 37–40: weights and exponential smoothing.
  // ============================================================

  // 37. Name each share a weight.

  await until(S(37));
  await play(
    ...weightPicture(6),
    ...say('WEIGHT = HOW MUCH SAY A COUNT GETS', GREEN),
    ...fbox([
      ['WEIGHT', GREEN],
      'a share of the whole',
      '',
      'bigger share:',
      'more influence',
      'on the final level'
    ], GREEN)
  );

  // 38. Each step backward halves the weight,
  // until only the starting share remains.

  await until(S(38));
  await play(
    new M.Indicate(
      visible.weights,
      { color: CYAN }
    ),
    ...say('STEP BACK: KEEP HALVING THE WEIGHT', GREEN),
    ...fbox([
      ['week 6: 1/2', WEIGHT_COLORS[0]],
      ['week 5: 1/4', WEIGHT_COLORS[1]],
      ['week 4: 1/8', WEIGHT_COLORS[2]],
      ['week 3: 1/16', WEIGHT_COLORS[3]],
      ['week 2: 1/32', WEIGHT_COLORS[4]],
      ['week 1: 1/32', WEIGHT_COLORS[5]]
    ], GREEN)
  );

  // 39. Repeated halving explains "exponential".

  await until(S(39));
  await play(
    ...say('REPEATED HALVING = EXPONENTIAL', GREEN),
    ...fbox([
      ['EXPONENTIAL', GREEN],
      '',
      'weights shrink by',
      'repeated multiplication',
      ['by one half', CYAN],
      '',
      'older counts fade away'
    ], GREEN)
  );

  // 40. Smoothing means softening jumps.

  await until(S(40));
  await play(
    ...drawChart(
      6,
      6,
      [7, 8]
    ),
    ...say('SMOOTHING = SOFTENING SUDDEN JUMPS', GREEN),
    ...fbox([
      ['ROOM COUNTS', CYAN],
      '20, 24, 20, 23, 24, 29',
      '',
      ['RUNNING LEVELS', GREEN],
      '20, 22, 21, 22, 23, 26',
      '',
      'less abrupt movement'
    ], GREEN)
  );

  // ============================================================
  // 41–44: update rule and Christmas forecast.
  // ============================================================

  // 41. Introduce the update rule.

  await until(S(41));
  await play(
    ...say('THE EXPONENTIAL SMOOTHING UPDATE RULE', GREEN),
    ...fbox([
      ['UPDATE RULE', GREEN],
      '',
      'start at the old level',
      'measure the new gap',
      'move halfway'
    ], GREEN)
  );

  // 42. State the full update formula in words.

  await until(S(42));
  await play(
    ...say('NEW LEVEL = OLD LEVEL + HALF THE GAP', GREEN),
    ...fbox([
      ['new level =', GREEN],
      '  old level',
      '  + half ×',
      '    (new count',
      '     − old level)',
      '',
      ['23 + ½ × (29 − 23)', AMBER],
      ['= 26', GREEN]
    ], GREEN)
  );

  // 43. The last level becomes the next forecast.

  await until(S(43));
  await play(
    new M.Indicate(
      visible.levelMarker,
      { color: GREEN }
    ),
    ...say('NEXT FORECAST = THE LAST LEVEL', AMBER),
    ...fbox([
      ['last level = 26', GREEN],
      '',
      'use it as the guess',
      'for the next week',
      '',
      ['forecast = 26', AMBER]
    ], AMBER)
  );

  // 44. Draw the dashed amber Christmas forecast.

  await until(S(44));
  await play(
    ...put(
      'hidden',
      hiddenWeeks([8])
    ),
    ...put(
      'forecast',
      forecastPicture(
        7,
        FORECAST
      )
    ),
    ...put(
      'forecastLabel',
      forecastLabel(
        7,
        FORECAST
      )
    ),
    ...put(
      'legend',
      chartLegend(
        true,
        true,
        false
      )
    ),
    ...say('CHRISTMAS FORECAST = 26 ROOMS', AMBER),
    ...fbox([
      ['EXPONENTIAL SMOOTHING', GREEN],
      '',
      'week 6 level = 26',
      '',
      ['Christmas forecast', AMBER],
      ['26 occupied rooms', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 45–46: reveal and measure the forecast error.
  //
  // Actual Christmas count = 35.
  // Forecast = 26.
  // Error = 35 - 26 = 9.
  // ============================================================

  // 45. Reveal the actual Christmas count for the first time.

  await until(S(45));
  await play(
    ...put(
      'actual',
      actualPicture(7)
    ),
    ...put(
      'legend',
      chartLegend(
        true,
        true,
        true
      )
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 26', AMBER],
      '',
      ['real count = 35', WHITE],
      '',
      'how far off?'
    ])
  );

  // 46. Forecast was nine rooms low.

  await until(S(46));
  await play(
    ...put(
      'error',
      forecastError(
        7,
        FORECAST,
        DATA[6]
      )
    ),
    ...say('35 − 26 = 9 ROOMS LOW', RED),
    ...fbox([
      ['real count = 35', WHITE],
      ['forecast   = 26', AMBER],
      '',
      'error = real − forecast',
      ['35 − 26 = 9', RED]
    ], RED)
  );

  // ============================================================
  // 47–49: when to use the method, its limitation,
  // and the final recap.
  // ============================================================

  // 47. Useful when a typical level changes slowly
  // and the observations contain brief bumps.

  await until(S(47));
  await play(
    ...remove('error'),
    ...say('USE WHEN THE TYPICAL COUNT CHANGES SLOWLY', GREEN),
    ...fbox([
      ['USE THIS RULE WHEN', GREEN],
      '',
      'the typical level',
      'changes gradually',
      '',
      'brief bumps should not',
      'dominate the forecast'
    ], GREEN),
    new M.Indicate(
      visible.levelTrail,
      { color: GREEN }
    )
  );

  // 48. The trap: the level can adjust to rising data,
  // but the future forecast itself is flat.
  //
  // The extension is the forecast made at week six,
  // not a new forecast after seeing Christmas.
  //
  // New Year's actual count remains hidden.

  await until(S(48));
  await play(
    ...remove('hidden'),
    ...put(
      'forecastExtension',
      flatExtension()
    ),
    ...say('TRAP: RISING COUNTS, BUT A FLAT FORECAST', RED),
    ...fbox([
      ['THE TRAP', RED],
      '',
      'counts can keep rising',
      'but the forecast',
      'stays at the last level',
      '',
      ['26 → 26', AMBER]
    ], RED)
  );

  // 49. Final recap.
  //
  // Move the running guess toward each new count.
  // Newer observations receive more weight.
  //
  // The latest level supplies the next forecast.
  // Simple exponential smoothing has no separate
  // trend or seasonal component.

  await until(S(49));
  await play(
    ...say('EXPONENTIAL SMOOTHING: UPDATE THE RUNNING GUESS', GREEN),
    ...fbox([
      ['EXPONENTIAL SMOOTHING', GREEN],
      '',
      'move toward each',
      'new observation',
      '',
      ['newer counts: more say', CYAN],
      ['older counts: less say', C.muted],
      '',
      ['next forecast = 26', AMBER]
    ], GREEN),
    new M.Indicate(
      visible.levelTrail,
      { color: GREEN }
    )
  );

  await until(S(49) + 3.0);

  await play(
    ...remove(
      'forecastExtension'
    ),
    ...say('MOVE HALFWAY, SMOOTH THE JUMPS, USE THE LAST LEVEL', GREEN),
    ...fbox([
      ['HALF-WEIGHT SMOOTHING', GREEN],
      '',
      'old level + half the gap',
      '',
      ['20 → 22 → 21', GREEN],
      ['   → 22 → 23 → 26', GREEN],
      '',
      ['Christmas guess: 26', AMBER]
    ], GREEN)
  );

  await until(E(49));
}
