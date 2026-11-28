// lesson 11.2.7
// Autoregressive models: use pieces of earlier gaps from the usual count.
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
  // Long-run usual count = 22 rooms.
  // This is the supplied average across two years of
  // records, not an average of only the displayed weeks.
  //
  // AR(2) model fitted using the hotel's past records:
  //
  // forecast =
  //   22
  //   + 1/2 × (last week - 22)
  //   + 1/4 × (two weeks ago - 22)
  //
  // Week 6 gap = 29 - 22 = 7.
  // Week 5 gap = 24 - 22 = 2.
  //
  // Contributions:
  //   1/2 × 7 = 3.5
  //   1/4 × 2 = 0.5
  //
  // Christmas forecast = 22 + 3.5 + 0.5 = 26.
  // Christmas actual = 35.
  // Forecast error = 35 - 26 = 9.
  //
  // Christmas must remain hidden until sentence 32.
  // New Year's actual count remains hidden throughout.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];
  const LAST = [18, 21, 19, 21, 22, 26, 32, 30];

  const USUAL = 22;

  const WEIGHT_1 = 0.5;
  const WEIGHT_2 = 0.25;

  const GAP_1 = DATA[5] - USUAL;
  const GAP_2 = DATA[4] - USUAL;

  const PART_1 = WEIGHT_1 * GAP_1;
  const PART_2 = WEIGHT_2 * GAP_2;

  const FORECAST = USUAL + PART_1 + PART_2;

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const PINK = C.pink || '#F28BB9';
  const WHITE = '#F0F4FA';
  const RED = C.red || '#FF526F';

  // Colour meanings:
  //
  // Cyan: known room counts.
  // Muted white: usual count.
  // Green: latest gap and its weighted contribution.
  // Violet: two-week-old gap and its weighted contribution.
  // Amber: forecast.
  // White: revealed actual Christmas count.
  // Red: forecast error or a downward contribution.

  const LAG_1 = GREEN;
  const LAG_2 = VIOLET;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 x 8.
  // Content between y = -3.0 and 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.3, 0];

  const AX0 = CX - (P ? 3.05 : 3.15);
  const AX1 = CX + (P ? 3.30 : 3.15);

  const AY0 = P ? -4.20 : -2.12;
  const AY1 = P ? 1.30 : 1.02;

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

  function glow(
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
    opacity = 0.80,
    strokeWidth = 1.2
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
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
    opacity = 0.04
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth: 1.7
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
      return dot(b, color, 0.04);
    }

    const ux = dx / length;
    const uy = dy / length;

    const head = Math.min(
      0.14,
      length * 0.36
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
  // All groups are constructed before display.
  // Never regroup objects that are already on screen.
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
  // Lines may be:
  //   'text'
  //   ['text', color]
  //
  // Leading spaces provide indentation.
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
      P ? 1.30 : 4.30;

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
  // Cyan: known observations.
  // Pink: last year, when shown.
  // Dashed amber: forecast.
  // White: revealed Christmas count.
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
        [AX0 + 0.26, AY0 - 0.63, 0]
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

  function observedSeries(n = 6, labels = false) {
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
          CYAN,
          3
        )
      );
    }

    for (let week = 1; week <= n; week++) {
      objects.push(
        glow(
          pt(
            week,
            DATA[week - 1]
          ),
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

  function previousYearSeries() {
    const objects = [];

    for (let week = 2; week <= 8; week++) {
      objects.push(
        ln(
          pt(
            week - 1,
            LAST[week - 2]
          ),
          pt(
            week,
            LAST[week - 1]
          ),
          PINK,
          1.9
        )
      );
    }

    for (let week = 1; week <= 8; week++) {
      const d = dot(
        pt(week, LAST[week - 1]),
        PINK,
        0.066
      );

      d.setFill(PINK, 0.65);

      objects.push(d);
    }

    return new M.VGroup(...objects);
  }

  function chartLegend(
    historical = false,
    forecast = false,
    actual = false
  ) {
    const items = [
      ['This year', CYAN, false]
    ];

    if (historical) {
      items.push(
        ['Last year', PINK, false]
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

    const y = P ? 1.76 : 1.43;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX +
        (i - (items.length - 1) / 2) *
        spacing;

      const t = T(name, 12, color);

      const totalWidth =
        t.getWidth() + 0.39;

      const left =
        x - totalWidth / 2;

      const mark = dashed
        ? dash(
            [left, y, 0],
            [left + 0.28, y, 0],
            color
          )
        : ln(
            [left, y, 0],
            [left + 0.28, y, 0],
            color,
            3
          );

      t.moveTo([
        left + 0.39 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(mark, t);
    });

    return new M.VGroup(...objects);
  }

  function nowDivider() {
    const x =
      (X(6) + X(7)) / 2;

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

  function hiddenHolidays(weeks = [7, 8]) {
    const objects = [];

    weeks.forEach(week => {
      const bottom = AY0 + 0.09;
      const top = AY1 - 0.10;

      const r = rounded(
        STEP * 0.78,
        top - bottom,
        [
          X(week),
          (top + bottom) / 2,
          0
        ],
        C.muted,
        0.10
      );

      objects.push(
        r,
        tag(
          '?',
          AMBER,
          [
            X(week),
            AY0 + 0.43,
            0
          ],
          16
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function clearChart() {
    return remove(
      'axes',
      'series',
      'lastYear',
      'legend',
      'now',
      'hidden',
      'usual',
      'focus5',
      'focus6',
      'label5',
      'label6',
      'gap5',
      'gap6',
      'gapLabel5',
      'gapLabel6',
      'lagArrows',
      'weightLabels',
      'forecast',
      'forecastLabel',
      'actual',
      'error',
      'carryover',
      'holidayFocus',
      'negativeChart'
    );
  }

  function clearPictures() {
    return remove(
      'intro',
      'usualPicture',
      'pieces',
      'halfFocus',
      'quarterFocus',
      'combineFrame',
      'combinedPieces',
      'sumLabel',
      'build',
      'negative',
      'modelPicture',
      'calendar'
    );
  }

  function drawChart(
    withUsual = false,
    withGaps = false,
    hide = true
  ) {
    const a = [
      ...clearPictures(),
      ...clearChart(),
      ...put('axes', axes()),
      ...put(
        'series',
        observedSeries(6, false)
      ),
      ...put(
        'legend',
        chartLegend()
      ),
      ...put(
        'now',
        nowDivider()
      )
    ];

    if (hide) {
      a.push(
        ...put(
          'hidden',
          hiddenHolidays([7, 8])
        )
      );
    }

    if (withUsual) {
      a.push(
        ...put(
          'usual',
          usualGuide()
        )
      );
    }

    if (withGaps) {
      a.push(
        ...drawGap(5, LAG_2),
        ...drawGap(6, LAG_1),
        ...drawGapLabel(5, LAG_2),
        ...drawGapLabel(6, LAG_1)
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Long-run average and usual-count guide.
  //
  // The line is fixed at the supplied usual count of 22.
  // Do not recompute it from the displayed eight-week
  // extracts, which are not the complete two-year record.
  // ------------------------------------------------------------

  function usualGuide() {
    return new M.VGroup(
      dash(
        [AX0 + 0.03, Y(USUAL), 0],
        [AX1, Y(USUAL), 0],
        WHITE
      ),
      tag(
        'USUAL 22',
        WHITE,
        [
          X(1.5),
          Y(USUAL) - (P ? 0.78 : 0.66),
          0
        ],
        14
      )
    );
  }

  // Picture of equal sharing across the historical record.
  // These are equal-sized abstract week slots, not invented
  // historical room counts.

  function historicalAveragePicture() {
    const objects = [];

    const base = P ? -3.60 : -2.15;
    const left = CX - 2.20;
    const right = CX + 2.20;

    const y1 = base + 2.18;
    const y2 = base + 1.18;

    objects.push(
      txt(
        'TWO YEARS OF WEEKLY RECORDS',
        19,
        C.ink,
        [
          CX,
          P ? 1.43 : 1.27,
          0
        ]
      )
    );

    const drawSlots = (y, color) => {
      const n = 10;
      const dx = (right - left) / (n - 1);

      for (let j = 0; j < n; j++) {
        objects.push(
          rect(
            0.28,
            0.35,
            [left + j * dx, y, 0],
            color,
            0.48
          )
        );
      }

      objects.push(
        txt(
          '…',
          19,
          color,
          [right + 0.39, y, 0]
        )
      );
    };

    drawSlots(y1, PINK);
    drawSlots(y2, CYAN);

    objects.push(
      txt(
        'Earlier year',
        15,
        PINK,
        [CX, y1 + 0.42, 0]
      ),
      txt(
        'Other year',
        15,
        CYAN,
        [CX, y2 + 0.42, 0]
      ),
      arrow(
        [CX, y2 - 0.26, 0],
        [CX, base + 0.38, 0],
        GREEN,
        3
      ),
      tag(
        '22 ROOMS',
        GREEN,
        [
          CX,
          base + 0.12,
          0
        ],
        19
      ),
      txt(
        'one equal share per week',
        14,
        C.muted,
        [
          CX,
          base - 0.43,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Gaps from the usual count.
  //
  // Week 6: 29 - 22 = +7.
  // Week 5: 24 - 22 = +2.
  //
  // The bars start at 22, not at zero.
  // A bar's height represents the gap from usual.
  // ------------------------------------------------------------

  const GAP_BAR_W = STEP * 0.40;

  function chartGapBar(
    week,
    value,
    color,
    opacity = 0.78
  ) {
    const low = Y(Math.min(value, USUAL));
    const high = Y(Math.max(value, USUAL));

    if (Math.abs(value - USUAL) < 1e-9) {
      return ln(
        [
          X(week) - GAP_BAR_W / 2,
          Y(USUAL),
          0
        ],
        [
          X(week) + GAP_BAR_W / 2,
          Y(USUAL),
          0
        ],
        color,
        2.2
      );
    }

    return rect(
      GAP_BAR_W,
      high - low,
      [
        X(week),
        (low + high) / 2,
        0
      ],
      color,
      opacity,
      1.4
    );
  }

  function gapLabel(
    week,
    value,
    color,
    side = 1
  ) {
    const difference = value - USUAL;

    // Sit just under the usual line, below the bar,
    // clear of the data line and the forecast ring.
    return tag(
      signed(difference),
      color,
      [
        X(week),
        Y(USUAL) - 0.30,
        0
      ],
      14
    );
  }

  function drawGap(week, color) {
    return put(
      'gap' + week,
      chartGapBar(
        week,
        DATA[week - 1],
        color
      )
    );
  }

  function drawGapLabel(week, color) {
    return put(
      'gapLabel' + week,
      gapLabel(
        week,
        DATA[week - 1],
        color,
        week === 5 ? -1 : 1
      )
    );
  }

  function highlightCount(week, color = CYAN) {
    return [
      ...put(
        'focus' + week,
        ring(
          pt(week, DATA[week - 1]),
          color,
          0.21
        )
      ),
      ...put(
        'label' + week,
        txt(
          String(DATA[week - 1]),
          18,
          CYAN,
          [
            X(week),
            Y(DATA[week - 1]) + 0.31,
            0
          ],
          true
        )
      )
    ];
  }

  // ------------------------------------------------------------
  // Lags.
  //
  // Christmas is week 7.
  // One step back reaches week 6: lag 1.
  // Two steps back reaches week 5: lag 2.
  //
  // The horizontal lengths of the arrows are accurate:
  // the lag-2 arrow is twice the lag-1 arrow.
  // ------------------------------------------------------------

  function lagPicture(stage = 0) {
    const objects = [];

    const y1 = AY0 + 0.92;
    const y2 = AY0 + 0.35;

    objects.push(
      txt(
        'COUNT BACK FROM CHRISTMAS',
        P ? 15 : 13,
        C.muted,
        [
          (AX0 + X(5)) / 2 - (P ? 0.10 : 0),
          (y1 + y2) / 2,
          0
        ]
      )
    );

    if (stage >= 1) {
      objects.push(
        arrow(
          [X(7), y1, 0],
          [X(6), y1, 0],
          LAG_1,
          3.1
        ),
        txt(
          '1',
          15,
          LAG_1,
          [
            (X(6) + X(7)) / 2,
            y1 + 0.23,
            0
          ],
          true
        ),
        dot(
          [X(6), y1, 0],
          LAG_1,
          0.045
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        arrow(
          [X(7), y2, 0],
          [X(5), y2, 0],
          LAG_2,
          3.1
        ),
        ln(
          [X(6), y2 - 0.08, 0],
          [X(6), y2 + 0.08, 0],
          LAG_2,
          1.8
        ),
        txt(
          '2',
          15,
          LAG_2,
          [
            (X(5) + X(7)) / 2,
            y2 + 0.22,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function weightLabels() {
    return new M.VGroup(
      tag(
        '¼',
        LAG_2,
        [
          X(5),
          Y(DATA[4]) + 0.63,
          0
        ],
        17
      ),
      tag(
        '½',
        LAG_1,
        [
          X(6),
          Y(DATA[5]) + 0.63,
          0
        ],
        17
      )
    );
  }

  // ------------------------------------------------------------
  // Magnified gap bars.
  //
  // The original chart uses a 0–40 room scale.
  // This local picture magnifies the gaps and divides
  // them into half-room pieces.
  //
  // Week 6:
  //   7 rooms = 14 half-room pieces.
  //   Take 7 pieces = 3.5 rooms.
  //
  // Week 5:
  //   2 rooms = 4 half-room pieces.
  //   Take 1 piece = 0.5 room.
  //
  // Combined:
  //   8 half-room pieces = 4 rooms.
  //
  // Half-room pieces represent numerical contributions,
  // not physically divided hotel rooms.
  // ------------------------------------------------------------

  const PART_X1 = CX - 1.85;
  const PART_X2 = CX;
  const PART_X3 = CX + 1.88;

  const PART_BASE = P ? -3.75 : -2.15;
  const PART_PITCH = P ? 0.63 : 0.43;

  const HALF_PITCH = PART_PITCH / 2;
  const PART_W = 0.84;

  const partY = rooms =>
    PART_BASE + rooms * PART_PITCH;

  function halfPiece(
    x,
    index,
    color,
    opacity = 0.90
  ) {
    return rect(
      PART_W,
      HALF_PITCH * 0.83,
      [
        x,
        PART_BASE +
          (index + 0.5) *
          HALF_PITCH,
        0
      ],
      color,
      opacity,
      1
    );
  }

  function fullRoomPiece(
    x,
    index,
    color,
    opacity = 0.86
  ) {
    return rect(
      PART_W,
      PART_PITCH * 0.85,
      [
        x,
        PART_BASE +
          (index + 0.5) *
          PART_PITCH,
        0
      ],
      color,
      opacity,
      1.1
    );
  }

  function partStack(
    x,
    total,
    selected,
    color,
    split = false
  ) {
    const objects = [];

    if (!split) {
      for (let j = 0; j < total; j++) {
        objects.push(
          fullRoomPiece(
            x,
            j,
            color,
            0.78
          )
        );
      }
    } else {
      const n = Math.round(total * 2);
      const keep = Math.round(selected * 2);

      for (let j = 0; j < n; j++) {
        const chosen =
          selected >= 0 &&
          j < keep;

        const opacity =
          selected < 0
            ? 0.78
            : chosen
              ? 0.96
              : 0.14;

        objects.push(
          halfPiece(
            x,
            j,
            color,
            opacity
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function pieceOutline(
    x,
    amount,
    color
  ) {
    const bottom = PART_BASE - 0.045;
    const top = partY(amount) + 0.045;

    return rounded(
      PART_W + 0.17,
      top - bottom,
      [
        x,
        (bottom + top) / 2,
        0
      ],
      color,
      0.02
    );
  }

  function piecePicture(stage = 0) {
    const objects = [];

    const title =
      stage >= 4
        ? 'BUILD THE EXTRA ABOVE USUAL'
        : stage >= 1
          ? 'TAKE PIECES OF THE EARLIER GAPS'
          : 'TWO GAPS ABOVE THE USUAL COUNT';

    objects.push(
      txt(
        title,
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.58 : 1.43,
          0
        ]
      ),
      ln(
        [CX - 2.55, PART_BASE, 0],
        [CX + 2.55, PART_BASE, 0],
        C.muted,
        1.8
      )
    );

    // Scale of the gap picture.
    // Zero here means zero rooms above the usual count.

    const sx = CX - 2.83;

    objects.push(
      ln(
        [sx, partY(0), 0],
        [sx, partY(7), 0],
        C.muted,
        1.3
      )
    );

    [0, 2, 4, 6, 7].forEach(v => {
      objects.push(
        ln(
          [sx - 0.055, partY(v), 0],
          [sx + 0.055, partY(v), 0],
          C.muted,
          1.1
        ),
        txt(
          String(v),
          13,
          C.muted,
          [sx - 0.25, partY(v), 0],
          true
        )
      );
    });

    objects.push(
      txt(
        'gap',
        12,
        C.muted,
        [
          sx,
          partY(7) + 0.28,
          0
        ]
      )
    );

    // Latest gap: seven rooms.

    objects.push(
      partStack(
        PART_X1,
        GAP_1,
        stage >= 2 ? PART_1 : -1,
        LAG_1,
        stage >= 2
      )
    );

    // Two-week-old gap: two rooms.

    objects.push(
      partStack(
        PART_X2,
        GAP_2,
        stage >= 3 ? PART_2 : -1,
        LAG_2,
        stage >= 3
      )
    );

    objects.push(
      txt(
        '7',
        18,
        LAG_1,
        [
          PART_X1,
          partY(GAP_1) + 0.28,
          0
        ],
        true
      ),
      txt(
        '2',
        18,
        LAG_2,
        [
          PART_X2,
          partY(GAP_2) + 0.28,
          0
        ],
        true
      ),
      txt(
        'Week 6',
        15,
        LAG_1,
        [
          PART_X1,
          PART_BASE - 0.30,
          0
        ]
      ),
      txt(
        'Week 5',
        15,
        LAG_2,
        [
          PART_X2,
          PART_BASE - 0.30,
          0
        ]
      ),
      txt(
        'Combined',
        15,
        AMBER,
        [
          PART_X3,
          PART_BASE - 0.30,
          0
        ]
      )
    );

    if (stage >= 1) {
      objects.push(
        tag(
          'LARGER SHARE',
          LAG_1,
          [
            PART_X1,
            PART_BASE - 0.77,
            0
          ],
          12
        ),
        tag(
          'SMALLER SHARE',
          LAG_2,
          [
            PART_X2,
            PART_BASE - 0.77,
            0
          ],
          12
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        pieceOutline(
          PART_X1,
          PART_1,
          LAG_1
        ),
        txt(
          '½',
          20,
          LAG_1,
          [
            PART_X1 + 0.70,
            partY(PART_1 / 2),
            0
          ],
          true
        )
      );
    }

    if (stage >= 3) {
      objects.push(
        pieceOutline(
          PART_X2,
          PART_2,
          LAG_2
        ),
        txt(
          '¼',
          20,
          LAG_2,
          [
            PART_X2 + 0.68,
            partY(0.75),
            0
          ],
          true
        )
      );
    }

    if (stage >= 4) {
      objects.push(
        rounded(
          PART_W + 0.18,
          partY(4) - PART_BASE + 0.10,
          [
            PART_X3,
            (partY(4) + PART_BASE) / 2,
            0
          ],
          AMBER,
          0.025
        )
      );
    } else {
      objects.push(
        tag(
          '?',
          AMBER,
          [
            PART_X3,
            PART_BASE + 0.42,
            0
          ],
          19
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Animated copies of selected half-room pieces.
  //
  // The source gaps remain visible as the known data.
  // Only their selected contributions are copied.
  //
  // Seven green half-room pieces plus one violet
  // half-room piece build a four-room contribution.
  // ------------------------------------------------------------

  let contributionCopies = [];

  function clearContributionCopies() {
    const a = contributionCopies.map(item =>
      outA(item.obj)
    );

    contributionCopies = [];

    return a;
  }

  function makeContributionCopies() {
    const a = [];

    for (let j = 0; j < 7; j++) {
      const b = halfPiece(
        PART_X1,
        j,
        LAG_1,
        0.96
      );

      contributionCopies.push({
        obj: b,
        target: j,
        color: LAG_1
      });

      a.push(
        inA(b, 0.20)
      );
    }

    const q = halfPiece(
      PART_X2,
      0,
      LAG_2,
      0.96
    );

    contributionCopies.push({
      obj: q,
      target: 7,
      color: LAG_2
    });

    a.push(
      inA(q, 0.20)
    );

    return a;
  }

  function moveContributionCopies() {
    return new M.LaggedStart(
      contributionCopies.map(item =>
        new M.Transform(
          item.obj,
          halfPiece(
            PART_X3,
            item.target,
            item.color,
            0.96
          ),
          {
            pathArc: -0.45,
            runTime: 0.65
          }
        )
      ),
      {
        lagRatio: 0.10,
        runTime: 1.60
      }
    );
  }

  // ------------------------------------------------------------
  // Half-share close-up.
  //
  // Fourteen half-room blocks form seven rooms.
  // Mark seven selected pieces and seven unselected.
  // Both groups have exactly the same size.
  // ------------------------------------------------------------

  function halfSharePicture() {
    const objects = [];

    const base = P ? -3.40 : -2.06;
    const h = P ? 0.43 : 0.30;

    const xLeft = CX - 1.15;
    const xRight = CX + 1.15;

    objects.push(
      txt(
        'HALF OF THE SEVEN-ROOM GAP',
        19,
        LAG_1,
        [
          CX,
          P ? 1.30 : 1.25,
          0
        ]
      ),
      ln(
        [CX - 2.15, base, 0],
        [CX + 2.15, base, 0],
        C.muted,
        1.8
      )
    );

    for (let j = 0; j < 7; j++) {
      objects.push(
        rect(
          1.20,
          h * 0.84,
          [
            xLeft,
            base + (j + 0.5) * h,
            0
          ],
          LAG_1,
          0.95
        ),
        rect(
          1.20,
          h * 0.84,
          [
            xRight,
            base + (j + 0.5) * h,
            0
          ],
          LAG_1,
          0.18
        )
      );
    }

    objects.push(
      tag(
        'TAKE THIS HALF',
        LAG_1,
        [
          xLeft,
          base + 7 * h + 0.37,
          0
        ],
        14
      ),
      txt(
        'Other half',
        15,
        C.muted,
        [
          xRight,
          base + 7 * h + 0.37,
          0
        ]
      ),
      txt(
        '3.5',
        23,
        LAG_1,
        [
          xLeft,
          base - 0.38,
          0
        ],
        true
      ),
      txt(
        '3.5',
        23,
        C.muted,
        [
          xRight,
          base - 0.38,
          0
        ],
        true
      ),
      txt(
        'each small piece = half a room',
        14,
        C.muted,
        [
          CX,
          base - 0.86,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Quarter-share close-up.
  //
  // Two whole room blocks are divided into four
  // equal pieces.
  //
  // Each piece represents 0.5 room.
  // Take one of the four pieces.
  // ------------------------------------------------------------

  function quarterSharePicture(stage = 0) {
    const objects = [];

    const y = P ? -0.72 : -0.54;

    const w = 1.18;
    const h = P ? 0.64 : 0.54;

    const x1 = CX - 2.06;
    const x2 = CX + 1.28;

    objects.push(
      txt(
        'ONE QUARTER OF A TWO-ROOM GAP',
        P ? 18 : 17,
        LAG_2,
        [
          CX,
          P ? 1.35 : 1.24,
          0
        ]
      )
    );

    for (let i = 0; i < 2; i++) {
      objects.push(
        rect(
          w,
          h * 0.92,
          [
            x1,
            y + (i - 0.5) * h,
            0
          ],
          LAG_2,
          0.85
        )
      );
    }

    objects.push(
      txt(
        '2 rooms',
        17,
        LAG_2,
        [x1, y - 1.02, 0]
      ),
      arrow(
        [
          x1 + 0.82,
          y,
          0
        ],
        [
          x2 - 0.83,
          y,
          0
        ],
        C.muted,
        3
      )
    );

    if (stage >= 1) {
      for (let i = 0; i < 4; i++) {
        const py =
          y + (i - 1.5) * h / 2;

        const selected = i === 0;

        objects.push(
          rect(
            w,
            h * 0.43,
            [x2, py, 0],
            LAG_2,
            selected ? 0.97 : 0.24
          ),
          txt(
            '½',
            16,
            selected ? WHITE : C.muted,
            [
              x2 + 0.83,
              py,
              0
            ],
            true
          )
        );
      }

      objects.push(
        tag(
          'TAKE 1 OF 4',
          LAG_2,
          [
            x2,
            y + h + 0.43,
            0
          ],
          14
        ),
        txt(
          '0.5 room',
          20,
          LAG_2,
          [
            x2,
            y - 1.02,
            0
          ]
        )
      );
    } else {
      objects.push(
        tag(
          'DIVIDE BY 4',
          LAG_2,
          [
            x2,
            y,
            0
          ],
          15
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Build the forecast from the usual count.
  //
  // Start at 22.
  // Add 3.5 from lag 1.
  // Add 0.5 from lag 2.
  //
  // Top of first contribution = 25.5.
  // Top of second contribution = 26.
  //
  // This is a magnified local scale, clearly labelled
  // with occupied-room counts.
  // ------------------------------------------------------------

  const BUILD_BASE = P ? -3.40 : -2.12;
  const BUILD_SCALE = P ? 0.66 : 0.48;

  const BUILD_X = CX + 0.60;
  const BUILD_W = 1.10;

  const BY = rooms =>
    BUILD_BASE +
    (rooms - 21) *
    BUILD_SCALE;

  function buildPiece(index, color) {
    return rect(
      BUILD_W,
      BUILD_SCALE * 0.43,
      [
        BUILD_X,
        BY(
          USUAL +
          (index + 0.5) / 2
        ),
        0
      ],
      color,
      0.92
    );
  }

  function buildForecastPicture(stage = 0) {
    const objects = [];

    const sx = CX - 1.82;

    objects.push(
      txt(
        'START FROM THE USUAL COUNT',
        19,
        C.ink,
        [
          CX,
          P ? 1.47 : 1.36,
          0
        ]
      ),
      ln(
        [sx, BY(21), 0],
        [sx, BY(27), 0],
        C.muted,
        1.8
      )
    );

    for (let v = 21; v <= 27; v++) {
      objects.push(
        ln(
          [sx - 0.065, BY(v), 0],
          [sx + 0.065, BY(v), 0],
          C.muted,
          1.3
        ),
        txt(
          String(v),
          15,
          C.muted,
          [
            sx - 0.31,
            BY(v),
            0
          ],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        13,
        C.muted,
        [
          sx,
          BY(27) + 0.24,
          0
        ]
      ),
      dash(
        [sx + 0.10, BY(USUAL), 0],
        [CX + 2.60, BY(USUAL), 0],
        WHITE
      ),
      tag(
        'USUAL 22',
        WHITE,
        [
          CX + 1.62,
          BY(USUAL) - 0.30,
          0
        ],
        14
      )
    );

    if (stage >= 1) {
      for (let j = 0; j < 7; j++) {
        objects.push(
          buildPiece(j, LAG_1)
        );
      }

      objects.push(
        txt(
          '+3.5',
          19,
          LAG_1,
          [
            BUILD_X + 1.05,
            BY(USUAL + PART_1 / 2),
            0
          ],
          true
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        buildPiece(7, LAG_2),
        txt(
          '+0.5',
          17,
          LAG_2,
          [
            BUILD_X + 1.07,
            BY(25.75),
            0
          ],
          true
        )
      );
    }

    if (stage >= 3) {
      objects.push(
        dash(
          [
            sx + 0.08,
            BY(FORECAST),
            0
          ],
          [
            BUILD_X + 0.80,
            BY(FORECAST),
            0
          ],
          AMBER
        ),
        ring(
          [
            BUILD_X,
            BY(FORECAST),
            0
          ],
          AMBER,
          0.15
        ),
        tag(
          '26 ROOMS',
          AMBER,
          [
            BUILD_X,
            BY(FORECAST) + 0.36,
            0
          ],
          18
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Negative gap picture.
  //
  // Use the actual observed quiet week 3:
  //
  // 20 - 22 = -2.
  //
  // If this were the latest week, its half-weighted
  // contribution would be -1.
  //
  // This is an illustration of the sign rule,
  // not a replacement of the Christmas calculation.
  // ------------------------------------------------------------

  function negativeGapPicture(stage = 0) {
    const objects = [];

    const baseY = P ? -0.75 : -0.42;

    const scale = P ? 0.75 : 0.56;

    const x1 = CX - 1.35;
    const x2 = CX + 1.35;

    const yy = v =>
      baseY + (v - USUAL) * scale;

    objects.push(
      txt(
        'BELOW USUAL MEANS A NEGATIVE GAP',
        P ? 18 : 17,
        RED,
        [
          CX,
          P ? 1.40 : 1.35,
          0
        ]
      ),
      dash(
        [CX - 2.65, yy(USUAL), 0],
        [CX + 2.65, yy(USUAL), 0],
        WHITE
      ),
      tag(
        'USUAL 22',
        WHITE,
        [
          CX,
          yy(USUAL) + 0.35,
          0
        ],
        15
      ),
      glow(
        [x1, yy(20), 0],
        CYAN,
        0.12,
        0.18
      )
    );

    // Downward bar from 22 to 20.

    for (let j = 0; j < 2; j++) {
      objects.push(
        rect(
          0.82,
          scale * 0.83,
          [
            x1,
            yy(USUAL - j - 0.5),
            0
          ],
          RED,
          0.80
        )
      );
    }

    objects.push(
      arrow(
        [
          x1 - 0.65,
          yy(USUAL),
          0
        ],
        [
          x1 - 0.65,
          yy(20),
          0
        ],
        RED,
        3
      ),
      txt(
        '−2',
        18,
        RED,
        [
          x1 - 0.98,
          yy(21),
          0
        ],
        true
      ),
      txt(
        'quiet count: 20',
        15,
        CYAN,
        [
          x1,
          yy(20) - 0.36,
          0
        ]
      )
    );

    if (stage >= 1) {
      objects.push(
        rect(
          0.82,
          scale * 0.83,
          [
            x2,
            yy(21.5),
            0
          ],
          RED,
          0.95
        ),
        rect(
          0.82,
          scale * 0.83,
          [
            x2,
            yy(20.5),
            0
          ],
          RED,
          0.13
        ),
        rounded(
          0.98,
          scale + 0.08,
          [
            x2,
            yy(21.5),
            0
          ],
          RED,
          0.02
        ),
        arrow(
          [
            x1 + 0.57,
            yy(21.5),
            0
          ],
          [
            x2 - 0.58,
            yy(21.5),
            0
          ],
          LAG_1,
          2.8
        ),
        tag(
          'TAKE HALF',
          LAG_1,
          [
            CX,
            yy(21.5) + 0.34,
            0
          ],
          13
        ),
        tag(
          '−1 ROOM',
          RED,
          [
            x2,
            yy(20) - 0.36,
            0
          ],
          16
        ),
        txt(
          'a smaller forecast',
          14,
          RED,
          [
            x2,
            yy(20) - 0.76,
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Model concept picture.
  //
  // Earlier counts -> pieces of gaps -> next count.
  //
  // This picture is used to name autoregression.
  // No new data or fitted coefficients are invented.
  // ------------------------------------------------------------

  function modelPicture(stage = 0) {
    const objects = [];

    const y = P ? -0.90 : -0.55;

    const positions = [
      CX - 2.05,
      CX,
      CX + 2.05
    ];

    const labels = [
      'WEEK 5',
      'WEEK 6',
      'WEEK 7'
    ];

    const values = [
      '24',
      '29',
      '?'
    ];

    const colors = [
      LAG_2,
      LAG_1,
      AMBER
    ];

    objects.push(
      txt(
        stage === 0
          ? 'USE THE PAST TO GUESS THE NEXT COUNT'
          : 'AUTOREGRESSIVE MODEL',
        P ? 18 : 17,
        C.ink,
        [
          CX,
          P ? 1.36 : 1.28,
          0
        ]
      )
    );

    positions.forEach((x, i) => {
      objects.push(
        rounded(
          1.55,
          1.72,
          [x, y, 0],
          colors[i],
          0.055
        ),
        txt(
          labels[i],
          14,
          colors[i],
          [x, y + 0.57, 0]
        ),
        txt(
          values[i],
          27,
          i === 2 ? AMBER : CYAN,
          [x, y - 0.02, 0],
          true
        ),
        txt(
          i === 0
            ? 'lag 2'
            : i === 1
              ? 'lag 1'
              : 'forecast',
          13,
          colors[i],
          [x, y - 0.58, 0]
        )
      );
    });

    objects.push(
      arrow(
        [
          positions[1] + 0.80,
          y,
          0
        ],
        [
          positions[2] - 0.81,
          y,
          0
        ],
        LAG_1,
        3
      )
    );

    // Route the lag-2 connection above the week-6 card.
    // It links week 5 directly to the forecast.

    const routeY = y + 1.20;

    objects.push(
      ln(
        [
          positions[0],
          y + 0.86,
          0
        ],
        [
          positions[0],
          routeY,
          0
        ],
        LAG_2,
        2.5
      ),
      ln(
        [
          positions[0],
          routeY,
          0
        ],
        [
          positions[2],
          routeY,
          0
        ],
        LAG_2,
        2.5
      ),
      arrow(
        [
          positions[2],
          routeY,
          0
        ],
        [
          positions[2],
          y + 0.87,
          0
        ],
        LAG_2,
        2.5
      )
    );

    if (stage >= 2) {
      objects.push(
        tag(
          'AR(2)',
          GREEN,
          [
            CX,
            y - 1.38,
            0
          ],
          22
        ),
        txt(
          'two earlier counts',
          15,
          GREEN,
          [
            CX,
            y - 1.86,
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Forecast and actual.
  //
  // The model predicts 26 rooms.
  // No Christmas actual is drawn until beat 32.
  // ------------------------------------------------------------

  function forecastPicture() {
    const p = pt(7, FORECAST);

    return new M.VGroup(
      dash(
        pt(6, DATA[5]),
        p,
        AMBER
      ),
      dash(
        [
          X(7),
          AY0 + 0.04,
          0
        ],
        [
          X(7),
          Y(FORECAST) - 0.16,
          0
        ],
        AMBER
      ),
      ring(p, AMBER, 0.16),
      dot(p, AMBER, 0.055)
    );
  }

  function forecastLabel() {
    return tag(
      '26',
      AMBER,
      [
        X(7),
        Y(FORECAST) - 0.35,
        0
      ],
      16
    );
  }

  function actualPicture() {
    const value = DATA[6];

    return new M.VGroup(
      ln(
        pt(6, DATA[5]),
        pt(7, value),
        WHITE,
        2.2
      ),
      glow(
        pt(7, value),
        WHITE,
        0.105,
        0.24
      ),
      txt(
        String(value),
        18,
        WHITE,
        [
          X(7),
          Y(value) + 0.28,
          0
        ],
        true
      )
    );
  }

  function errorPicture() {
    const low = Y(FORECAST);
    const high = Y(DATA[6]);

    const x = X(7) + 0.22;

    return new M.VGroup(
      ln(
        [x, low, 0],
        [x, high, 0],
        RED,
        3
      ),
      ln(
        [x - 0.065, low, 0],
        [x + 0.065, low, 0],
        RED,
        2
      ),
      ln(
        [x - 0.065, high, 0],
        [x + 0.065, high, 0],
        RED,
        2
      ),
      txt(
        '9',
        18,
        RED,
        [
          x + 0.17,
          (low + high) / 2,
          0
        ],
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Carryover picture.
  //
  // A busy observation may carry information about
  // the next week.
  //
  // The latest positive gaps contribute to a positive
  // forecast gap, but the rule pulls back toward 22.
  // ------------------------------------------------------------

  function carryoverPicture() {
    const objects = [];

    const base = AY0 + 0.48;

    objects.push(
      arrow(
        [
          X(5),
          base,
          0
        ],
        [
          X(7),
          base,
          0
        ],
        LAG_2,
        2.4
      ),
      arrow(
        [
          X(6),
          base + 0.53,
          0
        ],
        [
          X(7),
          base + 0.53,
          0
        ],
        LAG_1,
        3.4
      ),
      txt(
        'earlier gaps carry over',
        13,
        C.muted,
        [
          CX,
          base + 0.26,
          0
        ]
      ),
      rect(
        GAP_BAR_W,
        Y(FORECAST) - Y(USUAL),
        [
          X(7),
          (
            Y(FORECAST) +
            Y(USUAL)
          ) / 2,
          0
        ],
        AMBER,
        0.65
      ),
      tag(
        '+4',
        AMBER,
        [
          X(7) + 0.38,
          Y(USUAL + 2),
          0
        ],
        13
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Holiday calendar cue.
  //
  // The AR model contains no Christmas indicator.
  // The visual highlights the known calendar date,
  // not an additional predictor fitted to this model.
  // ------------------------------------------------------------

  function calendarPicture() {
    const x = X(7);

    const y = AY0 + 0.97;

    const objects = [];

    const shell = new M.RoundedRectangle({
      width: 0.78,
      height: 0.80,
      cornerRadius: 0.08,
      color: PINK,
      strokeWidth: 2
    });

    shell.setFill(C.card, 0.95);
    shell.moveTo([x, y, 0]);

    objects.push(
      shell,
      rect(
        0.76,
        0.21,
        [x, y + 0.29, 0],
        PINK,
        0.95
      ),
      txt(
        'XMAS',
        11,
        C.card,
        [x, y + 0.29, 0]
      ),
      txt(
        '7',
        23,
        WHITE,
        [x, y - 0.11, 0],
        true
      ),
      arrow(
        [
          x,
          y + 0.48,
          0
        ],
        [
          x,
          Y(FORECAST) - 0.28,
          0
        ],
        PINK,
        2.1
      )
    );

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0–4: establish the usual room count.
  // ============================================================

  // 0. Would the busy Saturday carry over into Christmas?

  await until(S(0));
  await play(
    ...put(
      'intro',
      new M.VGroup(
        tag(
          'BUSY SATURDAY',
          CYAN,
          [
            CX,
            P ? 0.72 : 0.72,
            0
          ],
          23
        ),
        arrow(
          [
            CX,
            P ? 0.25 : 0.22,
            0
          ],
          [
            CX,
            P ? -0.64 : -0.48,
            0
          ],
          AMBER,
          3
        ),
        tag(
          'BUSY CHRISTMAS?',
          AMBER,
          [
            CX,
            P ? -1.10 : -0.94,
            0
          ],
          22
        )
      )
    ),
    ...say('WILL A BUSY WEEK CARRY OVER?', AMBER),
    ...fbox([
      ['HOTEL: 40 ROOMS', CYAN],
      'will recent counts help',
      'predict Christmas?'
    ], AMBER)
  );

  // 1. Show the six known cyan observations.
  // Keep Christmas and New Year hidden.

  await until(S(1));
  await play(
    ...drawChart(
      false,
      false,
      true
    ),
    ...say('SIX KNOWN COUNTS — CHRISTMAS HIDDEN'),
    ...fbox([
      ['weeks 1–6', CYAN],
      '20, 24, 20, 23, 24, 29',
      ['Christmas = ?', AMBER]
    ])
  );

  // 2. Draw the guide at 22 rooms.

  await until(S(2));
  await play(
    ...put(
      'usual',
      usualGuide()
    ),
    ...say('DRAW A GUIDE AT 22 ROOMS', WHITE),
    ...fbox([
      ['guide = 22 rooms', WHITE],
      'compare each count',
      'with this line'
    ])
  );

  // 3. Twenty-two is the long-run average across
  // two years of records.
  //
  // Use the supplied long-run average.
  // Do not imply that the displayed extracts alone
  // have an average of 22.

  await until(S(3));
  await play(
    ...clearChart(),
    ...put(
      'usualPicture',
      historicalAveragePicture()
    ),
    ...say('22 = THE AVERAGE ACROSS TWO YEARS', GREEN),
    ...fbox([
      'all recorded weeks',
      'share equally in the mean',
      ['long-run average = 22', GREEN]
    ], GREEN)
  );

  // 4. Call the line the usual count.

  await until(S(4));
  await play(
    ...drawChart(
      true,
      false,
      true
    ),
    ...say('USE 22 AS THE USUAL COUNT', WHITE),
    ...fbox([
      ['USUAL COUNT = 22', WHITE],
      'a reference point',
      'for busy and quiet weeks'
    ])
  );

  // ============================================================
  // 5–9: draw the two recent gaps.
  // ============================================================

  // 5. Week six had 29 rooms.

  await until(S(5));
  await play(
    ...highlightCount(
      6,
      LAG_1
    ),
    ...say('WEEK 6: 29 ROOMS'),
    ...fbox([
      ['week 6 = 29', CYAN],
      ['usual  = 22', WHITE]
    ])
  );

  // 6. Week five had 24 rooms.

  await until(S(6));
  await play(
    ...highlightCount(
      5,
      LAG_2
    ),
    ...say('WEEK 5: 24 ROOMS'),
    ...fbox([
      ['week 6 = 29', LAG_1],
      ['week 5 = 24', LAG_2],
      ['usual  = 22', WHITE]
    ])
  );

  // 7. Draw upright bars from the usual guide
  // to the two recent observations.

  await until(S(7));

  const gap6Bar = chartGapBar(
    6,
    DATA[5],
    LAG_1
  );

  const gap5Bar = chartGapBar(
    5,
    DATA[4],
    LAG_2
  );

  visible.gap6 = gap6Bar;
  visible.gap5 = gap5Bar;

  await play(
    new M.LaggedStart(
      [
        inA(gap6Bar, 0.55),
        inA(gap5Bar, 0.55)
      ],
      {
        lagRatio: 0.35,
        runTime: 1.20
      }
    ),
    ...say('DRAW BARS FROM THE USUAL COUNT', GREEN),
    ...fbox([
      'each bar starts at 22',
      'and reaches its dot',
      ['bar height = gap', GREEN]
    ], GREEN)
  );

  // 8. The latest bar is seven rooms high.

  await until(S(8));
  await play(
    ...drawGapLabel(
      6,
      LAG_1
    ),
    new M.Indicate(
      visible.gap6,
      { color: LAG_1 }
    ),
    ...say('LATEST GAP: 7 ROOMS ABOVE USUAL', LAG_1),
    ...fbox([
      'week 6 gap',
      ['29 − 22 = +7', LAG_1]
    ], LAG_1)
  );

  // 9. The previous bar is two rooms high.

  await until(S(9));
  await play(
    ...drawGapLabel(
      5,
      LAG_2
    ),
    new M.Indicate(
      visible.gap5,
      { color: LAG_2 }
    ),
    ...say('EARLIER GAP: 2 ROOMS ABOVE USUAL', LAG_2),
    ...fbox([
      ['week 6: 29 − 22 = 7', LAG_1],
      ['week 5: 24 − 22 = 2', LAG_2]
    ], LAG_2)
  );

  // ============================================================
  // 10–11: build a forecast using pieces of the gaps.
  // ============================================================

  // 10. Picture taking a piece of each bar.

  await until(S(10));
  await play(
    ...clearChart(),
    ...put(
      'pieces',
      piecePicture(0)
    ),
    ...say('TAKE A PIECE OF EACH GAP', AMBER),
    ...fbox([
      ['latest gap = 7', LAG_1],
      ['earlier gap = 2', LAG_2],
      'take pieces of both'
    ], AMBER)
  );

  // 11. Give the latest week a larger share.

  await until(S(11));
  await play(
    ...put(
      'pieces',
      piecePicture(1)
    ),
    ...say('GIVE THE LATEST WEEK MORE SAY', LAG_1),
    ...fbox([
      ['week 6: larger share', LAG_1],
      ['week 5: smaller share', LAG_2]
    ], LAG_1)
  );

  // ============================================================
  // 12–17: lags and the name AR(2).
  // ============================================================

  // 12. The number of weeks back is called the lag.

  await until(S(12));
  await play(
    ...drawChart(
      true,
      true,
      true
    ),
    ...put(
      'lagArrows',
      lagPicture(0)
    ),
    ...say('LAG = HOW MANY WEEKS BACK', VIOLET),
    ...fbox([
      ['LAG', VIOLET],
      'the number of weeks',
      'we step backward'
    ], VIOLET)
  );

  // 13. Week six is one lag back from Christmas.

  await until(S(13));
  await play(
    ...put(
      'lagArrows',
      lagPicture(1)
    ),
    new M.Indicate(
      visible.gap6,
      { color: LAG_1 }
    ),
    ...say('LAG 1: WEEK 6', LAG_1),
    ...fbox([
      'Christmas = week 7',
      ['7 − 1 = 6', LAG_1],
      'latest known week'
    ], LAG_1)
  );

  // 14. Week five is two lags back.

  await until(S(14));
  await play(
    ...put(
      'lagArrows',
      lagPicture(2)
    ),
    new M.Indicate(
      visible.gap5,
      { color: LAG_2 }
    ),
    ...say('LAG 2: WEEK 5', LAG_2),
    ...fbox([
      ['lag 1 = week 6', LAG_1],
      ['lag 2 = week 5', LAG_2],
      'count back from week 7'
    ], LAG_2)
  );

  // 15. A model is a rule for using known information
  // to make a guess.

  await until(S(15));
  await play(
    ...clearChart(),
    ...put(
      'modelPicture',
      modelPicture(0)
    ),
    ...say('MODEL = A RULE FOR MAKING A GUESS', CYAN),
    ...fbox([
      ['MODEL', CYAN],
      'known earlier counts',
      ['→ next count estimate', AMBER]
    ])
  );

  // 16. A rule that uses earlier counts to predict
  // a new count is autoregressive.

  await until(S(16));
  await play(
    ...put(
      'modelPicture',
      modelPicture(1)
    ),
    ...say('AUTOREGRESSIVE MODEL', GREEN),
    ...fbox([
      ['AUTOREGRESSIVE', GREEN],
      'predict a new count',
      'using its earlier counts'
    ], GREEN)
  );

  // 17. Two lags give the name AR(2).

  await until(S(17));
  await play(
    ...put(
      'modelPicture',
      modelPicture(2)
    ),
    ...say('TWO LAGS: AR(2)', GREEN),
    ...fbox([
      ['AR(2)', GREEN],
      ['lag 1: latest count', LAG_1],
      ['lag 2: previous count', LAG_2]
    ], GREEN)
  );

  // ============================================================
  // 18–19: introduce the fitted weights.
  // ============================================================

  // 18. The hotel used past counts to choose the shares.

  await until(S(18));
  await play(
    ...drawChart(
      true,
      true,
      true
    ),
    ...put(
      'weightLabels',
      weightLabels()
    ),
    ...say('CHOOSE THE SHARES USING PAST RECORDS', GREEN),
    ...fbox([
      'weights fitted from',
      'two years of records',
      ['latest ½, earlier ¼', GREEN]
    ], GREEN)
  );

  // 19. A weight determines how much of a gap to use.

  await until(S(19));
  await play(
    ...clearChart(),
    ...put(
      'pieces',
      piecePicture(1)
    ),
    ...say('WEIGHT = HOW MUCH OF A GAP TO USE', GREEN),
    ...fbox([
      ['lag 1 weight = ½', LAG_1],
      ['lag 2 weight = ¼', LAG_2],
      'multiply each gap by its weight'
    ], GREEN)
  );

  // ============================================================
  // 20–26: construct the Christmas forecast.
  //
  // 22 + 0.5 × 7 + 0.25 × 2
  // = 22 + 3.5 + 0.5
  // = 26.
  // ============================================================

  // 20. Start at the usual count of 22.

  await until(S(20));
  await play(
    ...remove('pieces'),
    ...put(
      'build',
      buildForecastPicture(0)
    ),
    ...say('START FROM THE USUAL 22 ROOMS', WHITE),
    ...fbox([
      ['starting count = 22', WHITE],
      'now add pieces',
      'of the two recent gaps'
    ])
  );

  // 21. Take half of week six's seven-room gap.

  await until(S(21));
  await play(
    ...remove('build'),
    ...put(
      'pieces',
      piecePicture(2)
    ),
    ...say('TAKE HALF OF THE LATEST SEVEN-ROOM GAP', LAG_1),
    ...fbox([
      ['week 6 gap = 7', LAG_1],
      ['take one half', LAG_1],
      '7 ÷ 2'
    ], LAG_1)
  );

  // 22. Half of seven is 3.5 rooms.

  await until(S(22));
  await play(
    ...remove('pieces'),
    ...put(
      'halfFocus',
      halfSharePicture()
    ),
    ...say('HALF OF 7 = 3.5 ROOMS', LAG_1),
    ...fbox([
      '½ × 7',
      ['= 3.5 rooms', LAG_1],
      'latest contribution'
    ], LAG_1)
  );

  // 23. Take a quarter of week five's two-room gap.

  await until(S(23));
  await play(
    ...remove('halfFocus'),
    ...put(
      'quarterFocus',
      quarterSharePicture(0)
    ),
    ...say('TAKE A QUARTER OF THE EARLIER GAP', LAG_2),
    ...fbox([
      ['week 5 gap = 2', LAG_2],
      ['weight = ¼', LAG_2],
      'split 2 into 4 shares'
    ], LAG_2)
  );

  // 24. Split the two-room bar into four equal
  // half-room pieces.

  await until(S(24));
  await play(
    ...put(
      'quarterFocus',
      quarterSharePicture(1)
    ),
    ...say('2 DIVIDED INTO 4 PIECES = 0.5 EACH', LAG_2),
    ...fbox([
      '2 ÷ 4',
      ['= 0.5 room', LAG_2],
      'earlier contribution'
    ], LAG_2)
  );

  // 25. Combine the two weighted pieces.
  //
  // Seven green half-room pieces contribute 3.5.
  // One violet half-room piece contributes 0.5.
  //
  // They form a new stack of eight half-room pieces.

  await until(S(25));
  await play(
    ...remove('quarterFocus'),
    ...put(
      'pieces',
      piecePicture(4)
    ),
    ...makeContributionCopies(),
    ...say('COMBINE THE TWO WEIGHTED PIECES', GREEN),
    ...fbox([
      ['latest piece = 3.5', LAG_1],
      ['earlier piece = 0.5', LAG_2],
      ['3.5 + 0.5 = 4', GREEN]
    ], GREEN)
  );

  await until(S(25) + 0.65);
  await play(
    moveContributionCopies(),
    ...put(
      'sumLabel',
      tag(
        '+4 ROOMS',
        AMBER,
        [
          PART_X3,
          partY(4) + 0.38,
          0
        ],
        15
      )
    )
  );

  // 26. Add the four-room contribution to 22.

  await until(S(26));
  await play(
    ...clearContributionCopies(),
    ...remove(
      'pieces',
      'sumLabel'
    ),
    ...put(
      'build',
      buildForecastPicture(3)
    ),
    ...say('CHRISTMAS FORECAST = 26 ROOMS', AMBER),
    ...fbox([
      ['usual count = 22', WHITE],
      ['extra = 3.5 + 0.5 = 4', GREEN],
      ['22 + 4 = 26', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 27–28: state the rule in words.
  // ============================================================

  // 27. Start with the usual count.

  await until(S(27));
  await play(
    ...put(
      'build',
      buildForecastPicture(0)
    ),
    ...say('FIRST: START WITH THE USUAL COUNT', WHITE),
    ...fbox([
      ['FORECAST RULE', GREEN],
      'start at the usual count',
      ['22 rooms', WHITE]
    ], GREEN)
  );

  // 28. Add half the latest gap and a quarter of
  // the gap from two weeks ago.

  await until(S(28));
  await play(
    ...put(
      'build',
      buildForecastPicture(3)
    ),
    ...say('ADD HALF THE LATEST GAP AND A QUARTER OF THE EARLIER GAP', GREEN),
    ...fbox([
      ['forecast = usual count', WHITE],
      ['+ ½ × latest gap', LAG_1],
      ['+ ¼ × earlier gap', LAG_2]
    ], GREEN)
  );

  // ============================================================
  // 29–30: negative gaps reduce a forecast.
  //
  // Illustrate with the observed quiet count of 20.
  // Its gap from 22 is -2.
  //
  // If it had the latest-week weight of one half,
  // its contribution would be -1.
  // ============================================================

  // 29. A dot below the guide makes a downward bar.

  await until(S(29));
  await play(
    ...remove('build'),
    ...put(
      'negative',
      negativeGapPicture(0)
    ),
    ...say('BELOW THE GUIDE: A DOWNWARD GAP', RED),
    ...fbox([
      ['example: quiet count 20', CYAN],
      'usual count = 22',
      ['20 − 22 = −2', RED]
    ], RED)
  );

  // 30. A weighted piece of a negative gap
  // lowers the forecast.

  await until(S(30));
  await play(
    ...put(
      'negative',
      negativeGapPicture(1)
    ),
    ...say('A DOWNWARD PIECE LOWERS THE FORECAST', RED),
    ...fbox([
      'if this were the latest gap:',
      ['½ × (−2) = −1', RED],
      'subtract 1 from the guess'
    ], RED)
  );

  // ============================================================
  // 31–33: make the forecast and reveal Christmas.
  // ============================================================

  // 31. Draw the amber forecast at 26.
  //
  // Return to the full 0–40 chart.
  // Do not show the actual Christmas count yet.

  await until(S(31));
  await play(
    ...drawChart(
      true,
      true,
      false
    ),
    ...put(
      'hidden',
      hiddenHolidays([8])
    ),
    ...put(
      'forecast',
      forecastPicture()
    ),
    ...put(
      'forecastLabel',
      forecastLabel()
    ),
    ...put(
      'legend',
      chartLegend(
        false,
        true,
        false
      )
    ),
    ...say('DRAW THE FORECAST AT 26', AMBER),
    ...fbox([
      ['AR(2) CHRISTMAS FORECAST', AMBER],
      '22 + ½ × 7 + ¼ × 2',
      ['= 26 rooms', AMBER]
    ], AMBER)
  );

  // 32. First reveal of the white Christmas dot at 35.

  await until(S(32));
  await play(
    ...put(
      'actual',
      actualPicture()
    ),
    ...put(
      'legend',
      chartLegend(
        false,
        true,
        true
      )
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 26', AMBER],
      ['real count = 35', WHITE],
      'compare the two'
    ])
  );

  // 33. Forecast error is nine rooms.

  await until(S(33));
  await play(
    ...put(
      'error',
      errorPicture()
    ),
    ...say('35 − 26 = 9 ROOMS LOW', RED),
    ...fbox([
      'error = real − forecast',
      ['35 − 26 = 9', RED],
      ['forecast 9 rooms too low', RED]
    ], RED)
  );

  // ============================================================
  // 34–36: usefulness, limitation and recap.
  // ============================================================

  // 34. Use autoregression when busy or quiet weeks
  // tend to carry over into nearby weeks.

  await until(S(34));
  await play(
    ...remove(
      'error',
      'gapLabel5',
      'gapLabel6'
    ),
    ...put(
      'carryover',
      carryoverPicture()
    ),
    ...say('USE WHEN BUSY OR QUIET WEEKS CARRY OVER', GREEN),
    ...fbox([
      ['USE AUTOREGRESSION', GREEN],
      'when recent counts help',
      'predict nearby weeks'
    ], GREEN)
  );

  // 35. Trap: recent counts are not enough to predict
  // a known holiday jump.
  //
  // The model has no calendar indicator.
  // It cannot distinguish a Christmas forecast from
  // an ordinary forecast using the same previous counts.

  await until(S(35));
  await play(
    ...remove('carryover'),
    ...put(
      'calendar',
      calendarPicture()
    ),
    ...put(
      'error',
      errorPicture()
    ),
    ...put(
      'holidayFocus',
      ring(
        pt(7, DATA[6]),
        RED,
        0.22
      )
    ),
    ...say('TRAP: RECENT COUNTS DO NOT KNOW THE HOLIDAY CALENDAR', RED),
    ...fbox([
      ['THE TRAP', RED],
      'Christmas is expected',
      'but AR(2) has no holiday rule'
    ], RED)
  );

  // 36. Final recap.
  //
  // Autoregression uses pieces of earlier gaps
  // from the usual count to predict the next count.
  //
  // For this fitted AR(2) rule:
  //
  // usual count + half the latest gap
  //             + quarter the earlier gap.
  //
  // The weights here are fitted coefficients for
  // this particular hotel model. They are not
  // compulsory weights for every AR(2) model.

  await until(S(36));
  await play(
    ...clearChart(),
    ...clearPictures(),
    ...put(
      'build',
      buildForecastPicture(3)
    ),
    ...say('AUTOREGRESSION: PIECES OF EARLIER GAPS', GREEN),
    ...fbox([
      ['AUTOREGRESSIVE FORECAST', GREEN],
      'usual count + weighted',
      'pieces of earlier gaps'
    ], GREEN)
  );

  await until(S(36) + 2.65);
  await play(
    ...say('22 + 3.5 + 0.5 = 26 ROOMS', AMBER),
    ...fbox([
      ['AR(2): TWO LAGS', GREEN],
      '22 + ½ × 7 + ¼ × 2',
      ['forecast = 26 rooms', AMBER]
    ], GREEN),
    new M.Indicate(
      visible.build,
      { color: AMBER }
    )
  );

  await until(E(36));
}
