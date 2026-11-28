// lesson 11.2.3
// Moving average: give the latest few weeks an equal say.
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
  // Week 3: a storm closed the road.
  // Week 7: Christmas.
  // Week 8: New Year.
  //
  // Four-week trailing moving averages:
  //
  // Weeks 1–4:
  // (20 + 24 + 20 + 23) / 4 = 87 / 4 = 21.75
  // Forecast week 5 = 21.75. Actual = 24. Error = 2.25.
  //
  // Weeks 2–5:
  // (24 + 20 + 23 + 24) / 4 = 91 / 4 = 22.75
  // Forecast week 6 = 22.75. Actual = 29. Error = 6.25.
  //
  // Weeks 3–6:
  // (20 + 23 + 24 + 29) / 4 = 96 / 4 = 24
  // Forecast week 7 = 24. Actual = 35. Error = 11.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const WINDOW_SIZE = 4;

  const FORECAST_5 = 21.75;
  const FORECAST_6 = 22.75;
  const FORECAST_7 = 24;

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';

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
  const AY1 = P ? 1.10 : 1.08;

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

  // ------------------------------------------------------------
  // Independent scene object management.
  //
  // Do not regroup objects already on screen.
  // ------------------------------------------------------------

  const visible = Object.create(null);

  function put(key, obj) {
    const a = [];

    if (visible[key]) {
      a.push(outA(visible[key]));
    }

    visible[key] = obj;

    if (obj) {
      a.push(inA(obj));
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

  // ------------------------------------------------------------
  // Formula box.
  // Same structure as the approved reference lesson.
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
      T(s.trimStart(), size, c, true)
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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

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
  // Vertical axis: rooms 0–40.
  //
  // Cyan: known counts.
  // Amber dashed: forecasts.
  // White: newly revealed actual counts.
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
    forecast = false,
    actual = false
  ) {
    const items = [
      ['Known count', CYAN, false]
    ];

    if (forecast) {
      items.push(
        ['Forecast', AMBER, true]
      );
    }

    if (actual) {
      items.push(
        ['Real count', WHITE, false]
      );
    }

    const objects = [];
    const spacing = 2.05;
    const y = P ? AY0 - 1.02 : 1.45;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX + (i - (items.length - 1) / 2) * spacing;

      const t = T(name, P ? 15 : 13, color);

      const width =
        t.getWidth() + 0.42;

      const left = x - width / 2;

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

  function observedSeries(n, labels = false) {
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
          0.16
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
              Y(DATA[week - 1]) + 0.23,
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
    const x = (X(week) + X(week + 1)) / 2;

    return new M.VGroup(
      dash(
        [x, AY0 + 0.03, 0],
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

  function hiddenWeeks(weeks) {
    const objects = [];

    weeks.forEach(week => {
      const top = AY1 - 0.12;
      const bottom = AY0 + 0.10;

      const r = new M.RoundedRectangle({
        width: STEP * 0.81,
        height: top - bottom,
        cornerRadius: 0.10,
        color: C.muted,
        strokeWidth: 1
      });

      r.setFill(C.card, 0.25);

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
            (top + bottom) / 2,
            0
          ],
          16
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function stormMarker() {
    const p = pt(3, DATA[2]);

    const lightning = new M.VGroup(
      ln(
        [p[0] - 0.02, p[1] + 0.67, 0],
        [p[0] - 0.16, p[1] + 0.46, 0],
        AMBER,
        3
      ),
      ln(
        [p[0] - 0.16, p[1] + 0.46, 0],
        [p[0] + 0.06, p[1] + 0.46, 0],
        AMBER,
        3
      ),
      ln(
        [p[0] + 0.06, p[1] + 0.46, 0],
        [p[0] - 0.06, p[1] + 0.27, 0],
        AMBER,
        3
      )
    );

    return new M.VGroup(
      ring(p, AMBER, 0.21),
      lightning,
      tag(
        'STORM',
        AMBER,
        [p[0], p[1] - 0.40, 0],
        13
      )
    );
  }

  // ------------------------------------------------------------
  // Trailing window.
  //
  // A frame always contains exactly four consecutive weeks.
  // It slides one week right after the next count arrives.
  // ------------------------------------------------------------

  function windowFrame(first, last, color = VIOLET) {
    const left = X(first) - STEP * 0.45;
    const right = X(last) + STEP * 0.45;

    const top = AY1 - 0.14;
    const bottom = AY0 + 0.12;

    const r = new M.RoundedRectangle({
      width: right - left,
      height: top - bottom,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2.3
    });

    r.setFill(color, 0.035);

    r.moveTo([
      (left + right) / 2,
      (top + bottom) / 2,
      0
    ]);

    return r;
  }

  function windowLabel(first, last) {
    return tag(
      `WEEKS ${first}–${last}`,
      VIOLET,
      [
        (X(first) + X(last)) / 2,
        AY0 + 0.40,
        0
      ],
      14
    );
  }

  function drawWindow(first, last) {
    return [
      ...put(
        'window',
        windowFrame(first, last)
      ),
      ...put(
        'windowLabel',
        windowLabel(first, last)
      )
    ];
  }

  function slideWindow(first, last) {
    if (!visible.window) {
      return drawWindow(first, last);
    }

    return [
      new M.Transform(
        visible.window,
        windowFrame(first, last),
        { runTime: 0.85 }
      ),
      ...put(
        'windowLabel',
        windowLabel(first, last)
      )
    ];
  }

  function leavingMarker(week) {
    const p = pt(
      week,
      DATA[week - 1]
    );

    return new M.VGroup(
      ring(p, RED, 0.24),
      dash(
        [p[0], p[1] - 0.12, 0],
        [p[0], p[1] - 0.48, 0],
        RED
      ),
      tag(
        'OUT',
        RED,
        [p[0], p[1] - 0.67, 0],
        13
      )
    );
  }

  function enteringMarker(week) {
    const p = pt(
      week,
      DATA[week - 1]
    );

    return new M.VGroup(
      ring(p, GREEN, 0.24),
      tag(
        'IN',
        GREEN,
        [p[0], p[1] + 0.40, 0],
        13
      )
    );
  }

  // ------------------------------------------------------------
  // Forecast and actual count visuals.
  // ------------------------------------------------------------

  function forecastPicture(week, value) {
    const p = pt(week, value);

    const start = [
      X(week - 1),
      Y(value),
      0
    ];

    return new M.VGroup(
      dash(start, p, AMBER),
      dash(
        [X(week), AY0 + 0.04, 0],
        [X(week), Y(value) - 0.16, 0],
        AMBER
      ),
      ring(p, AMBER, 0.16),
      dot(p, AMBER, 0.05)
    );
  }

  function forecastLabel(
    week,
    value,
    offset = -0.35
  ) {
    return tag(
      fmt(value),
      AMBER,
      [
        X(week),
        Y(value) + offset,
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

  function errorBracket(
    week,
    forecast,
    actual,
    color = RED
  ) {
    const x = X(week) + 0.19;
    const low = Y(Math.min(forecast, actual));
    const high = Y(Math.max(forecast, actual));

    return new M.VGroup(
      ln(
        [x, low, 0],
        [x, high, 0],
        color,
        2.7
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
      tag(
        fmt(actual - forecast),
        color,
        [
          x + 0.50,
          Math.min((low + high) / 2, high - 0.36),
          0
        ],
        15
      )
    );
  }

  function drawForecast(week, value) {
    return [
      ...put(
        'forecast',
        forecastPicture(week, value)
      ),
      ...put(
        'forecastLabel',
        forecastLabel(week, value)
      ),
      ...put(
        'legend',
        chartLegend(true, false)
      )
    ];
  }

  function drawActual(week, forecast) {
    return [
      ...put(
        'actual',
        actualPicture(week)
      ),
      ...put(
        'error',
        errorBracket(
          week,
          forecast,
          DATA[week - 1]
        )
      ),
      ...put(
        'legend',
        chartLegend(true, true)
      )
    ];
  }

  // ------------------------------------------------------------
  // Room-block stacks.
  //
  // One complete block represents one occupied room.
  //
  // Internally, every room has four quarter-units.
  // This permits exact fractional sharing without changing
  // the total number of rooms.
  //
  // A piece with units = 4 is one complete room block.
  // A piece with units = 1 is one quarter of a room block.
  //
  // The room blocks are a picture of the arithmetic.
  // No real hotel room is divided.
  // ------------------------------------------------------------

  const STACK_SP = P ? 1.43 : 1.50;
  const BW = P ? 0.77 : 0.76;

  const PITCH = P ? 0.137 : 0.104;

  const BASE = P ? -3.42 : -2.16;

  const colx = k =>
    CX + (k - 1.5) * STACK_SP;

  const stackY = rooms =>
    BASE + rooms * PITCH;

  const stacks = [
    [],
    [],
    [],
    []
  ];

  let stackWeeks = [1, 2, 3, 4];

  let looseBlocks = [];

  function piecePosition(
    k,
    startUnits,
    units
  ) {
    return [
      colx(k),
      BASE +
        (
          startUnits / 4 +
          units / 8
        ) * PITCH,
      0
    ];
  }

  function piece(
    k,
    startUnits,
    units = 4,
    color = CYAN
  ) {
    const height =
      PITCH * units / 4 * 0.84;

    const b = new M.Rectangle({
      width: BW,
      height,
      color,
      strokeWidth: units === 4 ? 1 : 0.65
    });

    b.setFill(color, 0.84);

    b.moveTo(
      piecePosition(
        k,
        startUnits,
        units
      )
    );

    return b;
  }

  function stackUnits(k) {
    return stacks[k].reduce(
      (sum, part) => sum + part.units,
      0
    );
  }

  function stackValue(k) {
    return stackUnits(k) / 4;
  }

  function totalUnits() {
    return stacks.reduce(
      (sum, _, k) =>
        sum + stackUnits(k),
      0
    );
  }

  function stackFloor(weeks) {
    const objects = [
      ln(
        [colx(0) - 0.58, BASE, 0],
        [colx(3) + 0.58, BASE, 0],
        C.muted,
        2
      )
    ];

    weeks.forEach((week, k) => {
      objects.push(
        txt(
          `W${week}`,
          16,
          C.muted,
          [
            colx(k),
            BASE - 0.29,
            0
          ],
          true
        )
      );
    });

    objects.push(
      txt(
        '1 block = 1 room',
        15,
        C.muted,
        [
          CX,
          BASE - 0.67,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  function makeStack(
    k,
    rooms,
    color = CYAN
  ) {
    const targetUnits =
      Math.round(rooms * 4);

    const whole =
      Math.floor(targetUnits / 4);

    const remainder =
      targetUnits % 4;

    const created = [];

    for (let j = 0; j < whole; j++) {
      const b = piece(
        k,
        j * 4,
        4,
        color
      );

      const item = {
        obj: b,
        units: 4,
        color
      };

      stacks[k].push(item);
      created.push(b);
    }

    if (remainder > 0) {
      const b = piece(
        k,
        whole * 4,
        remainder,
        color
      );

      const item = {
        obj: b,
        units: remainder,
        color
      };

      stacks[k].push(item);
      created.push(b);
    }

    return created;
  }

  function revealStack(
    k,
    rooms,
    color = CYAN
  ) {
    const objects = makeStack(
      k,
      rooms,
      color
    );

    return new M.LaggedStart(
      objects.map(b =>
        inA(b, 0.24)
      ),
      {
        lagRatio: 0.035,
        runTime: 0.95
      }
    );
  }

  function stackLabels(
    color = CYAN,
    onlyNonempty = true
  ) {
    const objects = [];

    for (let k = 0; k < 4; k++) {
      const rooms = stackValue(k);

      if (
        onlyNonempty &&
        rooms === 0
      ) {
        continue;
      }

      objects.push(
        txt(
          fmt(rooms),
          P ? 19 : 18,
          color,
          [
            colx(k),
            stackY(rooms) + 0.25,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function refreshStackLabels(color = CYAN) {
    return put(
      'stackLabels',
      stackLabels(color)
    );
  }

  function clearStacks() {
    const a = [];

    stacks.forEach(st => {
      st.forEach(part => {
        a.push(
          outA(part.obj, 0.35)
        );
      });

      st.length = 0;
    });

    looseBlocks.forEach(part => {
      a.push(outA(part.obj));
    });

    looseBlocks = [];

    a.push(
      ...remove(
        'stackFloor',
        'stackLabels',
        'stackLevel',
        'stackTitle',
        'stackFocus',
        'quarterNote',
        'extraRoomNote'
      )
    );

    return a;
  }

  function clearChart() {
    return remove(
      'axes',
      'series',
      'legend',
      'now',
      'hidden',
      'storm',
      'window',
      'windowLabel',
      'forecast',
      'forecastLabel',
      'actual',
      'error',
      'leaving',
      'entering',
      'weightTags',
      'latestGap',
      'chartFocus'
    );
  }

  function drawChart(
    n,
    labels = true,
    hide = []
  ) {
    const a = [
      ...clearStacks(),
      ...clearChart(),
      ...put('axes', axes()),
      ...put(
        'series',
        observedSeries(n, labels)
      ),
      ...put(
        'legend',
        chartLegend()
      ),
      ...put(
        'now',
        nowDivider(n)
      )
    ];

    if (hide.length) {
      a.push(
        ...put(
          'hidden',
          hiddenWeeks(hide)
        )
      );
    }

    return a;
  }

  function updateKnownSeries(n) {
    return [
      ...put(
        'series',
        observedSeries(n, true)
      ),
      ...put(
        'now',
        nowDivider(n)
      )
    ];
  }

  function openStackView(
    weeks,
    values = null,
    color = CYAN
  ) {
    const a = [
      ...clearChart(),
      ...clearStacks()
    ];

    stackWeeks = weeks.slice();

    a.push(
      ...put(
        'stackFloor',
        stackFloor(stackWeeks)
      )
    );

    if (values) {
      values.forEach((v, k) => {
        a.push(
          revealStack(k, v, color)
        );
      });

      a.push(
        ...refreshStackLabels(color)
      );
    }

    return a;
  }

  function equalLevel(value, color = AMBER) {
    const y = stackY(value);

    return new M.VGroup(
      dash(
        [colx(0) - 0.55, y, 0],
        [colx(3) + 0.55, y, 0],
        color
      ),
      tag(
        'EQUAL HEIGHT',
        color,
        [CX, y + 0.66, 0],
        14
      )
    );
  }

  function stackOutline(k, color = AMBER) {
    const height =
      stackValue(k) * PITCH + 0.13;

    const r = new M.RoundedRectangle({
      width: BW + 0.20,
      height,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.025);

    r.moveTo([
      colx(k),
      BASE + height / 2,
      0
    ]);

    return r;
  }

  function stackRangeOutline(
    first,
    last,
    color = AMBER
  ) {
    const left = colx(first) - BW / 2 - 0.16;
    const right = colx(last) + BW / 2 + 0.16;

    const top =
      Math.max(
        ...Array.from(
          { length: last - first + 1 },
          (_, i) => stackValue(first + i)
        )
      ) * PITCH + BASE + 0.12;

    const bottom = BASE - 0.08;

    const r = new M.RoundedRectangle({
      width: right - left,
      height: top - bottom,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.02);

    r.moveTo([
      (left + right) / 2,
      (top + bottom) / 2,
      0
    ]);

    return r;
  }

  // ------------------------------------------------------------
  // Move an existing top block or fractional piece.
  //
  // The same object is transformed into its new location.
  // No piece is lost or duplicated.
  // ------------------------------------------------------------

  function moveTop(
    from,
    to,
    color = AMBER,
    arc = -0.65
  ) {
    const item = stacks[from].pop();

    if (!item) {
      throw new Error(
        'Cannot move from an empty room stack'
      );
    }

    const startUnits = stackUnits(to);

    const target = piece(
      to,
      startUnits,
      item.units,
      color
    );

    item.color = color;

    stacks[to].push(item);

    return new M.Transform(
      item.obj,
      target,
      {
        pathArc: arc,
        runTime: 0.70
      }
    );
  }

  // Split one complete block into four quarter pieces.
  // The original block disappears; its four quarters
  // occupy exactly the same room-height range.

  function splitTopWhole(k) {
    const item = stacks[k].pop();

    if (!item || item.units !== 4) {
      throw new Error(
        'Expected a complete room block'
      );
    }

    const start = stackUnits(k);

    const a = [
      outA(item.obj, 0.30)
    ];

    for (let q = 0; q < 4; q++) {
      const b = piece(
        k,
        start + q,
        1,
        VIOLET
      );

      stacks[k].push({
        obj: b,
        units: 1,
        color: VIOLET
      });

      a.push(
        inA(b, 0.35)
      );
    }

    return a;
  }

  // Split the upper n whole blocks into quarters.
  // Remove the whole blocks first, then replace their
  // occupied height with individual quarter pieces.

  function splitTopN(k, n) {
    const old = [];

    for (let i = 0; i < n; i++) {
      const part = stacks[k].pop();

      if (!part || part.units !== 4) {
        throw new Error(
          'Expected whole room blocks'
        );
      }

      old.push(part);
    }

    const start = stackUnits(k);

    const a = old.map(part =>
      outA(part.obj, 0.30)
    );

    for (let q = 0; q < n * 4; q++) {
      const b = piece(
        k,
        start + q,
        1,
        VIOLET
      );

      stacks[k].push({
        obj: b,
        units: 1,
        color: VIOLET
      });

      a.push(
        inA(b, 0.35)
      );
    }

    return a;
  }

  // A magnified single block beside four quarter pieces.
  // This is a visual key, not part of the stack total.

  function quarterNote() {
    const y = P ? 0.60 : 0.70;
    const x = CX;

    const big = new M.Rectangle({
      width: 0.65,
      height: 0.34,
      color: CYAN,
      strokeWidth: 1.5
    });

    big.setFill(CYAN, 0.80);
    big.moveTo([x - 1.25, y, 0]);

    const objects = [
      big,
      txt(
        '=',
        22,
        C.ink,
        [x - 0.55, y, 0]
      )
    ];

    for (let q = 0; q < 4; q++) {
      const r = new M.Rectangle({
        width: 0.65,
        height: 0.078,
        color: VIOLET,
        strokeWidth: 1
      });

      r.setFill(VIOLET, 0.85);

      r.moveTo([
        x + 0.12,
        y - 0.135 + q * 0.09,
        0
      ]);

      objects.push(r);
    }

    objects.push(
      txt(
        '4 quarters',
        15,
        VIOLET,
        [x + 1.30, y, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Four extra rooms after sliding the window from
  // weeks 1–4 to weeks 2–5.
  //
  // The old total was 87.
  // Remove 20, add 24: the new total is 91.
  // Four extra blocks are shared one per stack.
  // ------------------------------------------------------------

  function prepareExtraRooms() {
    const a = [];

    for (let k = 0; k < 4; k++) {
      const y = stackY(stackValue(k)) + 0.62;

      const b = new M.Rectangle({
        width: BW,
        height: PITCH * 0.84,
        color: GREEN,
        strokeWidth: 1.5
      });

      b.setFill(GREEN, 0.95);

      b.moveTo([
        colx(k),
        y,
        0
      ]);

      looseBlocks.push({
        obj: b,
        units: 4,
        color: GREEN,
        destination: k
      });

      a.push(
        inA(b)
      );
    }

    return a;
  }

  function distributeExtraRooms() {
    const a = [];

    looseBlocks.forEach(part => {
      const k = part.destination;

      const target = piece(
        k,
        stackUnits(k),
        4,
        GREEN
      );

      stacks[k].push({
        obj: part.obj,
        units: 4,
        color: GREEN
      });

      a.push(
        new M.Transform(
          part.obj,
          target,
          {
            pathArc: -0.15,
            runTime: 0.80
          }
        )
      );
    });

    looseBlocks = [];

    return a;
  }

  // ------------------------------------------------------------
  // Equal-weight visual for the final four-week window.
  //
  // Each of the four weeks contributes exactly 1/4
  // of its count to the moving average.
  // ------------------------------------------------------------

  function weightTags(first) {
    const objects = [];

    for (
      let week = first;
      week < first + 4;
      week++
    ) {
      objects.push(
        tag(
          '¼',
          GREEN,
          [
            X(week),
            AY0 + 1.02,
            0
          ],
          16
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function latestGapPicture() {
    const x = X(6) - 0.19;

    return new M.VGroup(
      dash(
        [X(3), Y(FORECAST_7), 0],
        [X(7), Y(FORECAST_7), 0],
        AMBER
      ),
      ln(
        [x, Y(FORECAST_7), 0],
        [x, Y(DATA[5]), 0],
        RED,
        3
      ),
      tag(
        '5 BELOW',
        RED,
        [
          x - 0.55,
          (
            Y(FORECAST_7) +
            Y(DATA[5])
          ) / 2,
          0
        ],
        13
      )
    );
  }

  // ============================================================
  // 0–7: the storm and the forecasting problem.
  // ============================================================

  // 0. A storm closed the road in week three.

  await until(S(0));
  await play(
    ...drawChart(6, false),
    ...put(
      'storm',
      stormMarker()
    ),
    ...say('WEEK 3: THE ROAD WAS CLOSED', AMBER),
    ...fbox([
      ['HOTEL RECORD', CYAN],
      'week 2 = 24 rooms',
      ['week 3 = 20 rooms', AMBER],
      'storm closed the road'
    ], AMBER)
  );

  // 1. Need a staffing guess for Christmas.

  await until(S(1));
  await play(
    ...put(
      'hidden',
      hiddenWeeks([7, 8])
    ),
    ...say('HOW MANY ROOMS FOR CHRISTMAS?', AMBER),
    ...fbox([
      'end of week 6',
      ['Christmas is next', AMBER],
      '',
      'how many rooms',
      'should we expect?'
    ], AMBER)
  );

  // 2. Should a quiet Saturday still have much say?

  await until(S(2));
  await play(
    new M.Indicate(
      visible.storm,
      { color: AMBER }
    ),
    ...say('SHOULD ONE QUIET WEEK DOMINATE THE GUESS?', AMBER),
    ...fbox([
      ['week 3 = 20', AMBER],
      'one unusual Saturday',
      '',
      'can we soften',
      'its effect?'
    ], AMBER)
  );

  // 3. This year's cyan dots.

  await until(S(3));
  await play(
    ...remove('storm'),
    ...put(
      'series',
      observedSeries(6, true)
    ),
    ...say('CYAN DOTS = THIS YEAR’S COUNTS')
  );

  // 4. Each dot represents Saturday's occupied rooms.

  await until(S(4));
  await play(
    ...say('ONE DOT = ONE SATURDAY COUNT'),
    ...fbox([
      ['week 1 = 20', CYAN],
      ['week 2 = 24', CYAN],
      ['week 3 = 20', CYAN],
      '...',
      'occupied rooms'
    ])
  );

  // 5. End of week six.

  await until(S(5));
  await play(
    new M.Indicate(
      visible.now,
      { color: CYAN }
    ),
    ...say('NOW: END OF WEEK 6')
  );

  // 6. Keep Christmas hidden.

  await until(S(6));
  await play(
    ...say('DO NOT REVEAL CHRISTMAS YET', AMBER),
    ...fbox([
      ['KNOWN', CYAN],
      'weeks 1 to 6',
      '',
      ['UNKNOWN', AMBER],
      'Christmas count'
    ], AMBER)
  );

  // 7. Cover weeks five and six while replaying
  // the earlier forecasts.

  await until(S(7));
  await play(
    ...put(
      'series',
      observedSeries(4, true)
    ),
    ...put(
      'now',
      nowDivider(4)
    ),
    ...put(
      'hidden',
      hiddenWeeks([5, 6, 7, 8])
    ),
    ...say('REPLAY THE VIEW FROM WEEK 4', VIOLET),
    ...fbox([
      ['PRETEND IT IS WEEK 4', VIOLET],
      'we know weeks 1–4',
      '',
      'later weeks',
      'are still hidden'
    ], VIOLET)
  );

  // ============================================================
  // 8–14: first trailing window becomes four stacks.
  // ============================================================

  // 8. Frame the first four dots.

  await until(S(8));
  await play(
    ...drawWindow(1, 4),
    ...say('FRAME THE FIRST FOUR WEEKS', VIOLET),
    ...fbox([
      ['WEEKS 1–4', VIOLET],
      '20, 24, 20, 23',
      'four known counts'
    ], VIOLET)
  );

  // 9. Make a stack for each week.

  await until(S(9));
  await play(
    ...openStackView(
      [1, 2, 3, 4]
    ),
    ...say('TURN EACH WEEK INTO A STACK OF ROOMS'),
    ...fbox([
      'four weeks',
      'four stacks',
      '',
      ['one block = one room', CYAN]
    ])
  );

  // 10. Week one: twenty rooms.

  await until(S(10));

  const firstStack = revealStack(0, 20);

  await play(
    firstStack,
    ...refreshStackLabels(),
    ...say('WEEK 1: 20 ROOMS'),
    ...fbox([
      'week 1',
      ['20 blocks', CYAN]
    ])
  );

  // 11. Week two: twenty-four rooms.

  await until(S(11));

  const secondStack = revealStack(1, 24);

  await play(
    secondStack,
    ...refreshStackLabels(),
    ...say('WEEK 2: 24 ROOMS'),
    ...fbox([
      'week 1 = 20',
      ['week 2 = 24', CYAN]
    ])
  );

  // 12. Week three: twenty rooms, during the storm.

  await until(S(12));

  const thirdStack = revealStack(2, 20);

  await play(
    thirdStack,
    ...refreshStackLabels(),
    ...put(
      'stackFocus',
      stackOutline(2, AMBER)
    ),
    ...say('WEEK 3: 20 ROOMS — STORM WEEK', AMBER),
    ...fbox([
      'week 1 = 20',
      'week 2 = 24',
      ['week 3 = 20', AMBER],
      ['storm week', AMBER]
    ], AMBER)
  );

  // 13. Week four: twenty-three rooms.

  await until(S(13));

  const fourthStack = revealStack(3, 23);

  await play(
    fourthStack,
    ...remove('stackFocus'),
    ...refreshStackLabels(),
    ...say('WEEK 4: 23 ROOMS'),
    ...fbox([
      'week 1 = 20',
      'week 2 = 24',
      'week 3 = 20',
      ['week 4 = 23', CYAN]
    ])
  );

  // 14. Each block stands for one room.

  await until(S(14));
  await play(
    ...say('ONE BLOCK = ONE ROOM'),
    ...fbox([
      'these blocks represent',
      'the room counts',
      '',
      ['1 block = 1 room', CYAN]
    ])
  );

  // ============================================================
  // 15–18: physically share the room blocks.
  //
  // Initial stacks:
  // 20, 24, 20, 23.
  //
  // First move two complete blocks:
  // 21, 23, 21, 22.
  //
  // Then split donor blocks into quarter pieces.
  //
  // Five quarters leave the second stack.
  // One quarter leaves the fourth stack.
  //
  // Three quarters go to the first stack.
  // Three quarters go to the third stack.
  //
  // Final stacks:
  // 21.75, 21.75, 21.75, 21.75.
  // ============================================================

  // 15. Begin sharing from the taller stacks.

  await until(S(15));
  await play(
    ...remove('stackLabels'),
    ...say('MOVE BLOCKS FROM TALL TO SHORT', AMBER),
    ...fbox([
      '20, 24, 20, 23',
      '',
      ['move blocks', AMBER],
      'from taller stacks',
      'to shorter stacks'
    ], AMBER),
    new M.LaggedStart(
      [
        moveTop(1, 0, AMBER, -0.80),
        moveTop(3, 2, AMBER, -0.80)
      ],
      {
        lagRatio: 0.35,
        runTime: 1.60
      }
    )
  );

  // 16. Split blocks to make the sharing exact.

  await until(S(16));

  const splitA = splitTopN(1, 2);
  const splitB = splitTopWhole(3);

  await play(
    ...splitA,
    ...splitB,
    ...put(
      'quarterNote',
      quarterNote()
    ),
    ...say('A BLOCK CAN BE SPLIT INTO QUARTERS', VIOLET),
    ...fbox([
      ['1 block = 4 quarters', VIOLET],
      '',
      'we can share',
      'fractional amounts',
      'in this picture'
    ], VIOLET)
  );

  await until(S(16) + 1.05);

  const quarterMoves = [
    moveTop(1, 0, VIOLET, -0.75),
    moveTop(1, 0, VIOLET, -0.75),
    moveTop(1, 0, VIOLET, -0.75),
    moveTop(1, 2, VIOLET, 0.75),
    moveTop(1, 2, VIOLET, 0.75),
    moveTop(3, 2, VIOLET, -0.75)
  ];

  await play(
    ...remove('quarterNote'),
    new M.LaggedStart(
      quarterMoves,
      {
        lagRatio: 0.12,
        runTime: 1.65
      }
    )
  );

  // 17. Four equal shares.

  await until(S(17));
  await play(
    ...put(
      'stackLevel',
      equalLevel(21.75)
    ),
    ...refreshStackLabels(AMBER),
    ...say('FOUR STACKS: THE SAME HEIGHT', AMBER),
    ...fbox([
      'same total of rooms',
      '',
      'four equal shares',
      'no rooms lost',
      'no rooms added'
    ], AMBER)
  );

  // 18. The fair share is the average.

  await until(S(18));
  await play(
    new M.Indicate(
      visible.stackLabels,
      { color: GREEN }
    ),
    ...say('AVERAGE = THE FAIR SHARE', GREEN),
    ...fbox([
      ['AVERAGE', GREEN],
      '',
      'one equal share',
      'of the total',
      '',
      'for these four weeks'
    ], GREEN)
  );

  // ============================================================
  // 19–24: first moving-average forecast.
  // ============================================================

  // 19. Name the trailing window.

  await until(S(19));
  await play(
    ...say('TRAILING WINDOW = LATEST KNOWN WEEKS', VIOLET),
    ...fbox([
      ['TRAILING WINDOW', VIOLET],
      'weeks 1, 2, 3, 4',
      '',
      'the latest four weeks',
      'known at that moment'
    ], VIOLET)
  );

  // 20. A forecast is made before the count arrives.

  await until(S(20));
  await play(
    ...say('FORECAST = A GUESS BEFORE THE COUNT ARRIVES', AMBER),
    ...fbox([
      ['FORECAST', AMBER],
      'use known counts',
      '',
      'to guess',
      'the next unknown count'
    ], AMBER)
  );

  // 21. The four stacks contain 87 rooms.

  await until(S(21));
  await play(
    ...say('TOTAL INSIDE THE WINDOW = 87 ROOMS'),
    ...fbox([
      '20 + 24 + 20 + 23',
      ['= 87 rooms', CYAN],
      '',
      'the total is unchanged'
    ])
  );

  // 22. Equal share = 21.75.

  await until(S(22));
  await play(
    ...say('87 SHARED BETWEEN 4 = 21.75', AMBER),
    ...fbox([
      'total = 87',
      'weeks = 4',
      '',
      ['87 ÷ 4 = 21.75', AMBER],
      ['21¾ rooms each', AMBER]
    ], AMBER),
    new M.Indicate(
      visible.stackLevel,
      { color: AMBER }
    )
  );

  // 23. Forecast week five using 21.75.

  await until(S(23));
  await play(
    ...drawChart(4, true, [6, 7, 8]),
    ...drawWindow(1, 4),
    ...drawForecast(5, FORECAST_5),
    ...say('WEEK 5 FORECAST = 21.75', AMBER),
    ...fbox([
      ['weeks 1–4', VIOLET],
      'average = 21.75',
      '',
      ['week 5 forecast', AMBER],
      ['21.75 rooms', AMBER]
    ], AMBER)
  );

  // 24. Reveal week five: 24 rooms.
  // Error = 24 - 21.75 = 2.25.

  await until(S(24));
  await play(
    ...drawActual(5, FORECAST_5),
    ...say('WEEK 5: FORECAST WAS 2.25 ROOMS LOW', RED),
    ...fbox([
      ['real count = 24', WHITE],
      ['forecast = 21.75', AMBER],
      '',
      '24 − 21.75',
      ['= 2.25 rooms low', RED]
    ], RED)
  );

  // ============================================================
  // 25–31: slide the window one week forward.
  //
  // Remove week 1: 20.
  // Add week 5: 24.
  //
  // Old total = 87.
  // New total = 91.
  // Gain = 4.
  // New average = 21.75 + 1 = 22.75.
  // ============================================================

  // 25. Slide the trailing window right by one week.

  await until(S(25));
  await play(
    ...remove(
      'forecast',
      'forecastLabel',
      'actual',
      'error'
    ),
    ...updateKnownSeries(5),
    ...put(
      'legend',
      chartLegend()
    ),
    ...slideWindow(2, 5),
    ...say('SLIDE THE FRAME ONE WEEK RIGHT', VIOLET),
    ...fbox([
      'old window: weeks 1–4',
      ['new window: weeks 2–5', VIOLET],
      '',
      'still four weeks'
    ], VIOLET)
  );

  // 26. Week one leaves.

  await until(S(26));
  await play(
    ...put(
      'leaving',
      leavingMarker(1)
    ),
    ...say('WEEK 1 LEAVES: REMOVE 20', RED),
    ...fbox([
      ['OUT: week 1', RED],
      '20 rooms leave',
      '',
      '87 − 20 = 67'
    ], RED)
  );

  // 27. Week five enters.

  await until(S(27));
  await play(
    ...put(
      'entering',
      enteringMarker(5)
    ),
    ...say('WEEK 5 ENTERS: ADD 24', GREEN),
    ...fbox([
      ['OUT: 20', RED],
      ['IN:  24', GREEN],
      '',
      '67 + 24 = 91'
    ], GREEN)
  );

  // 28. The average moves with the frame.

  await until(S(28));
  await play(
    ...remove(
      'leaving',
      'entering'
    ),
    new M.Indicate(
      visible.window,
      { color: VIOLET }
    ),
    ...say('MOVING AVERAGE = FAIR SHARE IN A SLIDING FRAME', GREEN),
    ...fbox([
      ['MOVING AVERAGE', GREEN],
      '',
      'the frame moves',
      'the counts change',
      'the average updates'
    ], GREEN)
  );

  // 29. Replacing 20 with 24 adds four rooms.
  //
  // Return to the previously equalized picture.
  // Four additional room blocks appear above it.

  await until(S(29));

  const oldEqual = openStackView(
    [2, 3, 4, 5],
    [
      21.75,
      21.75,
      21.75,
      21.75
    ],
    CYAN
  );

  const extraRooms = prepareExtraRooms();

  await play(
    ...oldEqual,
    ...extraRooms,
    ...put(
      'extraRoomNote',
      tag(
        '+4 ROOMS TO SHARE',
        GREEN,
        [
          CX,
          stackY(21.75) + 1.00,
          0
        ],
        14
      )
    ),
    ...say('REPLACING 20 WITH 24 ADDS 4 ROOMS', GREEN),
    ...fbox([
      'old total = 87',
      ['remove 20', RED],
      ['add 24', GREEN],
      '',
      ['24 − 20 = +4', GREEN],
      'new total = 91'
    ], GREEN)
  );

  // 30. Share the extra four rooms.
  // One new block goes to each stack.

  await until(S(30));

  const extraMoves = distributeExtraRooms();

  await play(
    ...remove(
      'stackLabels',
      'extraRoomNote'
    ),
    new M.LaggedStart(
      extraMoves,
      {
        lagRatio: 0.20,
        runTime: 1.65
      }
    ),
    ...say('4 EXTRA ROOMS: ONE MORE PER STACK', GREEN),
    ...fbox([
      ['4 extra rooms', GREEN],
      '4 equal stacks',
      '',
      ['4 ÷ 4 = 1', GREEN],
      'add 1 to each share'
    ], GREEN)
  );

  // 31. New fair share = 22.75.

  await until(S(31));
  await play(
    ...refreshStackLabels(AMBER),
    ...put(
      'stackLevel',
      equalLevel(22.75)
    ),
    ...say('NEW MOVING AVERAGE = 22.75', AMBER),
    ...fbox([
      'old average = 21.75',
      ['add 1 room', GREEN],
      ['new average = 22.75', AMBER],
      '',
      '91 ÷ 4 = 22.75'
    ], AMBER)
  );

  // ============================================================
  // 32–33: second forecast and reveal.
  // ============================================================

  // 32. Forecast week six at 22.75.

  await until(S(32));
  await play(
    ...drawChart(5, true, [7, 8]),
    ...drawWindow(2, 5),
    ...drawForecast(6, FORECAST_6),
    ...say('WEEK 6 FORECAST = 22.75', AMBER),
    ...fbox([
      ['weeks 2–5', VIOLET],
      'average = 22.75',
      '',
      ['forecast week 6', AMBER],
      ['22.75 rooms', AMBER]
    ], AMBER)
  );

  // 33. Reveal week six: 29.
  // Error = 29 - 22.75 = 6.25.

  await until(S(33));
  await play(
    ...drawActual(6, FORECAST_6),
    ...say('WEEK 6: FORECAST WAS 6.25 ROOMS LOW', RED),
    ...fbox([
      ['real count = 29', WHITE],
      ['forecast = 22.75', AMBER],
      '',
      '29 − 22.75',
      ['= 6.25 rooms low', RED]
    ], RED)
  );

  // ============================================================
  // 34–37: slide to the latest four weeks.
  //
  // Remove week 2: 24.
  // Add week 6: 29.
  //
  // Window now contains:
  // Week 3: 20
  // Week 4: 23
  // Week 5: 24
  // Week 6: 29
  // ============================================================

  // 34. Slide again and remove week two.

  await until(S(34));
  await play(
    ...remove(
      'forecast',
      'forecastLabel',
      'actual',
      'error'
    ),
    ...updateKnownSeries(6),
    ...put(
      'legend',
      chartLegend()
    ),
    ...slideWindow(3, 6),
    ...put(
      'leaving',
      leavingMarker(2)
    ),
    ...say('SLIDE AGAIN: WEEK 2 LEAVES', VIOLET),
    ...fbox([
      'old window: weeks 2–5',
      ['remove week 2', RED],
      ['24 rooms leave', RED],
      '',
      'new window: weeks 3–6'
    ], VIOLET)
  );

  // 35. Add week six's 29 rooms.

  await until(S(35));
  await play(
    ...put(
      'entering',
      enteringMarker(6)
    ),
    ...say('WEEK 6 ENTERS: ADD 29', GREEN),
    ...fbox([
      ['OUT: 24', RED],
      ['IN:  29', GREEN],
      '',
      '29 − 24 = 5 more rooms'
    ], GREEN)
  );

  // 36. The window holds weeks three through six.

  await until(S(36));
  await play(
    ...remove(
      'leaving',
      'entering'
    ),
    new M.Indicate(
      visible.window,
      { color: VIOLET }
    ),
    ...say('THE LATEST FOUR WEEKS: 3, 4, 5, 6', VIOLET),
    ...fbox([
      ['WEEKS 3–6', VIOLET],
      'week 3 = 20',
      'week 4 = 23',
      'week 5 = 24',
      'week 6 = 29'
    ], VIOLET)
  );

  // 37. Draw the new stacks side by side.

  await until(S(37));
  await play(
    ...openStackView(
      [3, 4, 5, 6],
      [20, 23, 24, 29]
    ),
    ...say('FOUR NEW ROOM-BLOCK STACKS'),
    ...fbox([
      ['LATEST WINDOW', VIOLET],
      '20, 23, 24, 29',
      '',
      'find their total'
    ])
  );

  // ============================================================
  // 38–42: find the final moving average.
  //
  // 20 + 23 = 43.
  // 43 + 24 = 67.
  // 67 + 29 = 96.
  // 96 / 4 = 24.
  // ============================================================

  // 38. Twenty plus twenty-three equals forty-three.

  await until(S(38));
  await play(
    ...put(
      'stackFocus',
      stackRangeOutline(
        0,
        1,
        AMBER
      )
    ),
    ...say('20 + 23 = 43', AMBER),
    ...fbox([
      'running total',
      '',
      ['20 + 23 = 43', AMBER]
    ], AMBER)
  );

  // 39. Add twenty-four to get sixty-seven.

  await until(S(39));
  await play(
    ...put(
      'stackFocus',
      stackRangeOutline(
        0,
        2,
        AMBER
      )
    ),
    ...say('43 + 24 = 67', AMBER),
    ...fbox([
      '20 + 23 = 43',
      ['43 + 24 = 67', AMBER]
    ], AMBER)
  );

  // 40. Add twenty-nine to get ninety-six.

  await until(S(40));
  await play(
    ...put(
      'stackFocus',
      stackRangeOutline(
        0,
        3,
        AMBER
      )
    ),
    ...say('67 + 29 = 96 ROOMS', AMBER),
    ...fbox([
      '20 + 23 = 43',
      '43 + 24 = 67',
      ['67 + 29 = 96', AMBER],
      '',
      ['total = 96', AMBER]
    ], AMBER)
  );

  // 41. Share 96 rooms equally.
  //
  // Starting stacks:
  // 20, 23, 24, 29.
  //
  // Transfer four complete blocks from the last
  // stack to the first stack.
  //
  // Transfer one complete block from the last
  // stack to the second stack.
  //
  // Result: 24, 24, 24, 24.

  await until(S(41));

  const finalShare = [];

  for (let j = 0; j < 4; j++) {
    finalShare.push(
      moveTop(
        3,
        0,
        AMBER,
        -0.75
      )
    );
  }

  finalShare.push(
    moveTop(
      3,
      1,
      AMBER,
      -0.70
    )
  );

  await play(
    ...remove(
      'stackFocus',
      'stackLabels'
    ),
    ...say('SHARE 96 EQUALLY BETWEEN 4 STACKS', GREEN),
    ...fbox([
      'total = 96',
      'number of weeks = 4',
      '',
      ['96 ÷ 4', GREEN]
    ], GREEN),
    new M.LaggedStart(
      finalShare,
      {
        lagRatio: 0.17,
        runTime: 1.95
      }
    )
  );

  // 42. Every stack now contains twenty-four rooms.

  await until(S(42));
  await play(
    ...refreshStackLabels(AMBER),
    ...put(
      'stackLevel',
      equalLevel(24)
    ),
    ...say('MOVING AVERAGE = 24 ROOMS', AMBER),
    ...fbox([
      'total = 96',
      'weeks = 4',
      '',
      ['96 ÷ 4 = 24', AMBER],
      ['24 rooms each', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 43–46: make the Christmas forecast and state the rule.
  // ============================================================

  // 43. Draw the Christmas forecast at twenty-four.

  await until(S(43));
  await play(
    ...drawChart(6, true, [8]),
    ...drawWindow(3, 6),
    ...drawForecast(7, FORECAST_7),
    ...say('CHRISTMAS FORECAST = 24 ROOMS', AMBER),
    ...fbox([
      ['CHRISTMAS FORECAST', AMBER],
      '',
      '20 + 23 + 24 + 29',
      '          = 96',
      ['96 ÷ 4 = 24', AMBER]
    ], AMBER)
  );

  // 44. Formula in words.

  await until(S(44));
  await play(
    ...say('ADD THE WINDOW COUNTS, THEN DIVIDE', CYAN),
    ...fbox([
      ['MOVING AVERAGE', GREEN],
      '',
      'forecast =',
      '  total inside window',
      '  ÷ number of weeks',
      '',
      ['96 ÷ 4 = 24', AMBER]
    ])
  );

  // 45. Each week contributes one quarter.

  await until(S(45));
  await play(
    ...put(
      'weightTags',
      weightTags(3)
    ),
    ...say('EACH OF THE FOUR WEEKS GETS ONE QUARTER', GREEN),
    ...fbox([
      ['EQUAL WEIGHTS', GREEN],
      '',
      'week 3: ¼',
      'week 4: ¼',
      'week 5: ¼',
      'week 6: ¼',
      ['total weight = 1', GREEN]
    ], GREEN)
  );

  // 46. A brief dip affects only part of the forecast.

  await until(S(46));
  await play(
    ...put(
      'storm',
      stormMarker()
    ),
    ...say('ONE BRIEF DIP GETS ONLY PART OF THE SAY', AMBER),
    ...fbox([
      ['storm week = 20', AMBER],
      '',
      'it supplies only ¼',
      'of this forecast',
      '',
      'the other three weeks',
      'supply the rest'
    ], GREEN)
  );

  // ============================================================
  // 47–49: reveal the Christmas count.
  //
  // Actual = 35.
  // Forecast = 24.
  // Error = 35 - 24 = 11.
  // ============================================================

  // 47. Only now reveal the actual Christmas count.

  await until(S(47));
  await play(
    ...remove(
      'storm',
      'weightTags'
    ),
    ...put(
      'actual',
      actualPicture(7)
    ),
    ...put(
      'legend',
      chartLegend(true, true)
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['Christmas forecast', AMBER],
      ['24 rooms', AMBER],
      '',
      ['Christmas actual', WHITE],
      ['35 rooms', WHITE]
    ])
  );

  // 48. Forecast error = real count minus forecast.

  await until(S(48));
  await play(
    ...put(
      'error',
      errorBracket(
        7,
        FORECAST_7,
        DATA[6]
      )
    ),
    ...say('ERROR = REAL COUNT MINUS FORECAST', RED),
    ...fbox([
      'forecast error =',
      ['  real count', WHITE],
      ['  − forecast', AMBER],
      '',
      '35 − 24'
    ], RED)
  );

  // 49. Error = eleven rooms.

  await until(S(49));
  await play(
    ...say('35 − 24 = 11 ROOMS LOW', RED),
    ...fbox([
      ['real = 35', WHITE],
      ['forecast = 24', AMBER],
      '',
      ['35 − 24 = 11', RED],
      ['11 rooms too low', RED]
    ], RED)
  );

  // ============================================================
  // 50–52: the limitation and final recap.
  // ============================================================

  // 50. The trap appears when the hotel keeps
  // getting busier.

  await until(S(50));
  await play(
    ...remove('windowLabel'),
    ...say('TRAP: THE HOTEL IS GETTING BUSIER', RED),
    ...fbox([
      ['THE TRAP', RED],
      '',
      'room counts are rising',
      'but the forecast',
      'still averages',
      'older, quieter weeks'
    ], RED)
  );

  // 51. Older counts hold the forecast below
  // even the latest known count.
  //
  // Latest known week = 29.
  // Moving average = 24.
  // The average is already five rooms below week six.

  await until(S(51));
  await play(
    ...remove('error'),
    ...put(
      'latestGap',
      latestGapPicture()
    ),
    ...say('OLDER COUNTS CAN HOLD THE FORECAST DOWN', RED),
    ...fbox([
      ['latest count = 29', CYAN],
      ['moving average = 24', AMBER],
      '',
      ['already 5 rooms lower', RED],
      'older weeks pull',
      'the average back'
    ], RED)
  );

  // 52. Final recap.
  //
  // The moving average gives equal weight to
  // the latest few observations.
  //
  // It softens temporary swings,
  // but can lag behind a rising or falling series.

  await until(S(52));
  await play(
    ...remove('latestGap'),
    ...put(
      'weightTags',
      weightTags(3)
    ),
    ...say('LATEST FEW WEEKS: AN EQUAL SAY', GREEN),
    ...fbox([
      ['MOVING AVERAGE', GREEN],
      '',
      '1. Keep the latest weeks',
      '2. Add their counts',
      '3. Share equally',
      '',
      ['forecast = 24 rooms', AMBER]
    ], GREEN)
  );

  await until(S(52) + 3.0);

  await play(
    ...remove('weightTags'),
    ...say('SOFTENS BRIEF SWINGS, BUT CAN LAG BEHIND', GREEN),
    ...fbox([
      ['MOVING AVERAGE', GREEN],
      '',
      ['equal weight', GREEN],
      'for each recent week',
      '',
      ['softens brief swings', CYAN],
      ['can lag behind growth', RED]
    ], GREEN)
  );

  await until(E(52));
}
