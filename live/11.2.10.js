// lesson 11.2.10
// ARIMA: predict the next change, then add it back to the room count.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
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
  // Week-to-week differences:
  //
  // Week 2: 24 - 20 = +4.
  // Week 3: 20 - 24 = -4.
  // Week 4: 23 - 20 = +3.
  // Week 5: 24 - 23 = +1.
  // Week 6: 29 - 24 = +5.
  //
  // Fitted rule on the changes:
  //
  // next change = 0.4 × previous change.
  //
  // Christmas:
  // predicted change = 0.4 × 5 = 2.
  // forecast = 29 + 2 = 31.
  //
  // New Year:
  // predicted change = 0.4 × 2 = 0.8.
  // forecast = 31 + 0.8 = 31.8.
  //
  // ARIMA(1,1,0):
  // p = 1: one autoregressive lag.
  // d = 1: difference the original series once.
  // q = 0: no separate lagged-surprise terms.
  //
  // Christmas actual = 35.
  // Forecast error = 35 - 31 = 4.
  //
  // Both forecasts originate at the end of week six.
  // Christmas actual is revealed only at beat 41.
  // New Year's actual remains hidden throughout.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];
  const KNOWN = DATA.slice(0, 6);

  const CHANGES = KNOWN.slice(1).map(
    (value, i) => value - KNOWN[i]
  );

  const PHI = 0.4;

  const CHANGE_6 = CHANGES[4];
  const CHANGE_7 = PHI * CHANGE_6;
  const CHANGE_8 = PHI * CHANGE_7;

  const FORECAST_7 = KNOWN[5] + CHANGE_7;
  const FORECAST_8 = FORECAST_7 + CHANGE_8;

  const ERROR_7 = DATA[6] - FORECAST_7;

  // ------------------------------------------------------------
  // Colour meanings.
  //
  // Cyan: observed room counts.
  // Green: positive changes and fitted predictions of changes.
  // Pink: negative observed changes.
  // Violet: differencing and autoregressive operations.
  // Amber: forecasts of room counts.
  // White: revealed actual Christmas count.
  // Red: forecast errors and warnings.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const AMBER = C.amber;
  const PINK = C.pink || '#F28BB9';
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
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.60, 0]
    : [4.30, -0.30, 0];

  const TITLE_Y = P ? 1.45 : 1.35;

  const AX0 = CX - 3.08;
  const AX1 = CX + 3.18;

  const AY0 = P ? -4.15 : -2.10;
  const AY1 = P ? 1.20 : 1.02;

  const STEP = (AX1 - AX0 - 0.65) / 7;

  const X = week =>
    AX0 + 0.35 + (week - 1) * STEP;

  const Y = count =>
    AY0 + count / 40 * (AY1 - AY0);

  const pt = (week, count) =>
    [X(week), Y(count), 0];

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
  // Visual primitives.
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

  function dot(p, color, radius = 0.085) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);
    return d;
  }

  function glow(p, color, radius = 0.085) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 1.9,
      color
    });

    halo.setFill(color, 0.18);

    return new M.VGroup(
      halo,
      dot(p, color, radius)
    );
  }

  function ring(p, color, radius = 0.17) {
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

  function rounded(
    w,
    h,
    p,
    color,
    opacity = 0.04
  ) {
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

  function arrow(a, b, color, width = 3) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.001) {
      return dot(b, color, 0.04);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.14, len * 0.33);
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
  // Independent scene object management.
  //
  // Every group is constructed before display.
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
      ? [
          new M.Indicate(
            visible[key],
            { color }
          )
        ]
      : [];
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Same structure as the approved reference lesson.
  //
  // Lines may be strings or [string, colour] pairs.
  // Leading spaces provide indentation.
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

    const maxw = P ? FW - 1.20 : 4.05;
    const maxh = P ? 1.30 : 4.20;

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
  // Show the hotel becoming busier without revealing
  // either holiday's actual room count.
  // ------------------------------------------------------------

  function openingPicture(question = false) {
    const objects = [];

    const hy = P ? -0.95 : -0.65;

    objects.push(
      rounded(
        4.75,
        2.65,
        [CX, hy, 0],
        CYAN,
        0.025
      ),
      txt(
        'HOTEL — 40 ROOMS',
        19,
        CYAN,
        [CX, hy + 1.63, 0]
      )
    );

    // Forty room tiles.
    // Occupied tiles represent the latest known count: 29.

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const k = row * 8 + col;

        const occupied = k < KNOWN[5];

        objects.push(
          rounded(
            0.43,
            0.35,
            [
              CX + (col - 3.5) * 0.53,
              hy + (2 - row) * 0.44,
              0
            ],
            occupied ? CYAN : C.muted,
            occupied ? 0.83 : 0.10
          )
        );
      }
    }

    objects.push(
      tag(
        '29 OCCUPIED AT WEEK 6',
        CYAN,
        [CX, hy - 1.65, 0],
        15
      )
    );

    if (question) {
      objects.push(
        tag(
          'CHRISTMAS?    NEW YEAR?',
          AMBER,
          [
            CX,
            P ? -3.45 : -2.65,
            0
          ],
          16
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
  //
  // The actual series is deliberately limited to
  // the first six observations.
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
          String(v),
          14,
          C.muted,
          [AX0 - 0.27, Y(v), 0],
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
          1.3
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
        [AX0 + 0.28, AY1 + 0.15, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.25, AY0 - 0.63, 0]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [X(7), AY0 - 0.63, 0]
      ),
      txt(
        'New Year',
        11,
        AMBER,
        [X(8), AY0 - 0.63, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function observedSeries(labels = true) {
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

    for (let week = 1; week <= 6; week++) {
      const value = KNOWN[week - 1];

      objects.push(
        glow(pt(week, value), CYAN)
      );

      if (labels) {
        objects.push(
          txt(
            String(value),
            15,
            CYAN,
            [
              X(week),
              Y(value) + 0.24,
              0
            ],
            true
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function nowDivider() {
    const x = (X(6) + X(7)) / 2;

    return new M.VGroup(
      dash(
        [x, AY0 + 0.05, 0],
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
      const bottom = AY0 + 0.10;
      const top = AY1 - 0.12;

      objects.push(
        rounded(
          STEP * 0.75,
          top - bottom,
          [
            X(week),
            (top + bottom) / 2,
            0
          ],
          C.muted,
          0.08
        ),
        tag(
          '?',
          AMBER,
          [X(week), AY0 + 0.44, 0],
          15
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function chartLegend(forecast = false, actual = false) {
    const items = [
      ['This year', CYAN, false]
    ];

    if (forecast) {
      items.push(['Forecast', AMBER, true]);
    }

    if (actual) {
      items.push(['Actual', WHITE, false]);
    }

    const objects = [];

    const y = P ? 1.72 : 1.43;
    const gap = items.length === 3 ? 1.85 : 2.35;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX + (i - (items.length - 1) / 2) * gap;

      const t = T(name, 12, color);
      const width = t.getWidth() + 0.40;
      const left = x - width / 2;

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
        left + 0.40 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(mark, t);
    });

    return new M.VGroup(...objects);
  }

  function chart(hidden = [7, 8], forecast = false) {
    const a = [
      ...clearScene(),
      ...put('axes', axes()),
      ...put('series', observedSeries()),
      ...put('now', nowDivider()),
      ...put('legend', chartLegend(forecast))
    ];

    if (hidden.length) {
      a.push(
        ...put('hidden', hiddenHolidays(hidden))
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Week-to-week change arrows.
  //
  // Each arrow joins one observation to the next.
  // Its vertical displacement represents the change.
  //
  // Rise: green.
  // Drop: pink.
  // ------------------------------------------------------------

  function changeColor(value) {
    return value >= 0 ? GREEN : PINK;
  }

  function changeArrow(week, label = false) {
    const previous = KNOWN[week - 2];
    const current = KNOWN[week - 1];

    const change = current - previous;
    const color = changeColor(change);

    const a = pt(week - 1, previous);
    const b = pt(week, current);

    const objects = [
      arrow(a, b, color, 3.8)
    ];

    if (label) {
      objects.push(
        tag(
          signed(change),
          color,
          [
            (a[0] + b[0]) / 2,
            Math.min(a[1], b[1]) - 0.42,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function allChangeArrows(n = 5, labels = true) {
    return new M.VGroup(
      ...Array.from(
        { length: n },
        (_, i) => changeArrow(i + 2, labels)
      )
    );
  }

  function changeTriangle(week, showValue = true) {
    const previous = KNOWN[week - 2];
    const current = KNOWN[week - 1];

    const change = current - previous;
    const color = changeColor(change);

    const start = pt(week - 1, previous);

    const corner = [
      X(week),
      Y(previous),
      0
    ];

    const end = pt(week, current);

    const objects = [
      ring(start, CYAN, 0.15),
      ring(end, CYAN, 0.15),
      dash(start, corner, C.muted),
      arrow(corner, end, color, 4)
    ];

    if (showValue) {
      objects.push(
        tag(
          signed(change),
          color,
          [
            X(week) + 0.36,
            (Y(previous) + Y(current)) / 2,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Put the changes into their own row.
  //
  // Align each change with the week it arrives at.
  //
  // Week 1 has no earlier observation in this extract,
  // so its difference is left blank.
  // ------------------------------------------------------------

  function differenceRow(stage = 0, focus = 0) {
    const objects = [];

    const xs = Array.from(
      { length: 6 },
      (_, i) => CX + (i - 2.5) * 0.94
    );

    const yTop = P ? -0.05 : 0.05;
    const yBottom = P ? -2.05 : -1.55;

    objects.push(
      txt(
        'COUNTS BECOME CHANGES',
        20,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      txt(
        'ROOM COUNTS',
        14,
        CYAN,
        [CX, yTop + 0.88, 0]
      )
    );

    KNOWN.forEach((value, i) => {
      const x = xs[i];

      objects.push(
        txt(
          `W${i + 1}`,
          13,
          C.muted,
          [x, yTop + 0.44, 0],
          true
        ),
        rounded(
          0.78,
          0.64,
          [x, yTop, 0],
          CYAN,
          0.07
        ),
        txt(
          String(value),
          21,
          CYAN,
          [x, yTop, 0],
          true
        )
      );
    });

    objects.push(
      txt(
        'WEEK-TO-WEEK CHANGES',
        15,
        VIOLET,
        [CX, yBottom - 0.55, 0]
      )
    );

    objects.push(
      txt(
        '—',
        19,
        C.muted,
        [xs[0], yBottom, 0],
        true
      )
    );

    CHANGES.forEach((value, i) => {
      const x = xs[i + 1];
      const color = changeColor(value);

      objects.push(
        rounded(
          0.78,
          0.67,
          [x, yBottom, 0],
          color,
          0.08
        ),
        txt(
          signed(value),
          22,
          color,
          [x, yBottom, 0],
          true
        )
      );

      if (stage >= 1) {
        objects.push(
          arrow(
            [
              (xs[i] + xs[i + 1]) / 2,
              yTop - 0.38,
              0
            ],
            [x, yBottom + 0.40, 0],
            C.muted,
            1.5
          )
        );
      }
    });

    if (focus > 0) {
      const i = focus - 1;

      objects.push(
        rounded(
          xs[i + 1] - xs[i] + 0.90,
          0.83,
          [
            (xs[i] + xs[i + 1]) / 2,
            yTop,
            0
          ],
          VIOLET,
          0
        ),
        rounded(
          0.92,
          0.82,
          [xs[i + 1], yBottom, 0],
          changeColor(CHANGES[i]),
          0
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        tag(
          'DIFFERENCE = NEW − PREVIOUS',
          VIOLET,
          [
            CX,
            yBottom - 1.05,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Signed change bars.
  //
  // Unlike the original room-count plot, the zero
  // line now means no change from the previous week.
  //
  // Negative changes extend below zero.
  // Positive changes extend above zero.
  // ------------------------------------------------------------

  function differenceBars(focusLatest = false) {
    const objects = [];

    const left = CX - 2.68;
    const right = CX + 2.68;

    const zeroY = P ? -1.32 : -0.55;
    const scale = P ? 0.43 : 0.29;

    const yy = value => zeroY + value * scale;

    const xx = i =>
      CX + (i - 2) * 1.02;

    objects.push(
      txt(
        'HOW MANY MORE OR FEWER ROOMS?',
        P ? 18 : 17,
        VIOLET,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [left, zeroY, 0],
        [right, zeroY, 0],
        WHITE,
        2
      )
    );

    [-4, -2, 0, 2, 4].forEach(v => {
      objects.push(
        txt(
          signed(v),
          13,
          C.muted,
          [left - 0.30, yy(v), 0],
          true
        )
      );

      if (v !== 0) {
        objects.push(
          dash(
            [left, yy(v), 0],
            [right, yy(v), 0],
            C.muted
          )
        );
      }
    });

    CHANGES.forEach((value, i) => {
      const color = changeColor(value);
      const x = xx(i);

      objects.push(
        rect(
          0.63,
          Math.abs(value) * scale,
          [
            x,
            (zeroY + yy(value)) / 2,
            0
          ],
          color,
          focusLatest && i !== 4 ? 0.26 : 0.87
        ),
        txt(
          signed(value),
          18,
          color,
          [
            x,
            yy(value) + (value >= 0 ? 0.25 : -0.25),
            0
          ],
          true
        ),
        txt(
          `W${i + 2}`,
          14,
          C.muted,
          [
            x,
            yy(-4) - 0.48,
            0
          ],
          true
        )
      );
    });

    if (focusLatest) {
      objects.push(
        rounded(
          0.81,
          5 * scale + 0.18,
          [xx(4), zeroY + 2.5 * scale, 0],
          AMBER,
          0
        ),
        tag(
          'LATEST CHANGE',
          AMBER,
          [
            xx(4) - 0.28,
            yy(5) + 0.58,
            0
          ],
          12
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Take four tenths of a rise.
  //
  // For a five-room rise:
  //
  // Five whole blocks.
  // Split each into two half-room pieces.
  // Ten pieces in total.
  // Keep four pieces = two rooms.
  //
  // For a two-room rise:
  //
  // Two whole blocks.
  // Split each into five pieces.
  // Ten pieces in total.
  // Keep four pieces = 0.8 room.
  //
  // Both diagrams use ten equally sized pieces of
  // the original rise.
  //
  // Their heights are proportional to room changes.
  // ------------------------------------------------------------

  const SHARE_BASE = P ? -3.65 : -2.18;
  const SHARE_SCALE = P ? 0.78 : 0.53;

  const SHARE_LEFT = CX - 1.60;
  const SHARE_RIGHT = CX + 1.65;

  const SHARE_W = 0.96;

  function shareBlock(
    x,
    index,
    amount,
    color,
    opacity = 0.90
  ) {
    return rect(
      SHARE_W,
      amount * SHARE_SCALE * 0.84,
      [
        x,
        SHARE_BASE +
          (index + 0.5) *
          amount *
          SHARE_SCALE,
        0
      ],
      color,
      opacity
    );
  }

  function sharePicture(amount, stage = 0) {
    const objects = [];

    const piece = amount / 10;
    const kept = amount * PHI;

    const sourceColor =
      amount === 5 ? GREEN : VIOLET;

    const top =
      SHARE_BASE + amount * SHARE_SCALE;

    objects.push(
      txt(
        'KEEP FOUR TENTHS OF THE RISE',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [
          SHARE_LEFT - 0.66,
          SHARE_BASE,
          0
        ],
        [
          SHARE_RIGHT + 0.66,
          SHARE_BASE,
          0
        ],
        C.muted,
        1.8
      ),
      txt(
        signed(amount),
        23,
        sourceColor,
        [SHARE_LEFT, top + 0.30, 0],
        true
      ),
      txt(
        amount === 5
          ? 'Known rise'
          : 'Predicted rise',
        15,
        sourceColor,
        [
          SHARE_LEFT,
          SHARE_BASE - 0.34,
          0
        ]
      ),
      txt(
        'Next rise',
        15,
        GREEN,
        [
          SHARE_RIGHT,
          SHARE_BASE - 0.34,
          0
        ]
      )
    );

    if (stage === 0) {
      for (let j = 0; j < amount; j++) {
        objects.push(
          shareBlock(
            SHARE_LEFT,
            j,
            1,
            sourceColor
          )
        );
      }
    } else {
      for (let j = 0; j < 10; j++) {
        const selected = j < 4;

        objects.push(
          shareBlock(
            SHARE_LEFT,
            j,
            piece,
            sourceColor,
            stage >= 2 && !selected ? 0.15 : 0.93
          )
        );
      }

      objects.push(
        txt(
          `1 piece = ${fmt(piece)} room`,
          14,
          C.muted,
          [
            CX,
            SHARE_BASE - 0.80,
            0
          ]
        )
      );
    }

    if (stage >= 2) {
      const keptHeight = kept * SHARE_SCALE;

      objects.push(
        rounded(
          SHARE_W + 0.16,
          keptHeight + 0.10,
          [
            SHARE_LEFT,
            SHARE_BASE + keptHeight / 2,
            0
          ],
          WHITE,
          0
        ),
        arrow(
          [
            SHARE_LEFT + 0.65,
            SHARE_BASE + keptHeight / 2,
            0
          ],
          [
            SHARE_RIGHT - 0.65,
            SHARE_BASE + keptHeight / 2,
            0
          ],
          GREEN,
          3
        ),
        tag(
          '4 OF 10',
          VIOLET,
          [
            CX,
            SHARE_BASE + keptHeight / 2 + 0.43,
            0
          ],
          14
        )
      );
    }

    if (stage >= 3) {
      for (let j = 0; j < 4; j++) {
        objects.push(
          shareBlock(
            SHARE_RIGHT,
            j,
            piece,
            GREEN,
            0.96
          )
        );
      }

      objects.push(
        tag(
          signed(kept),
          GREEN,
          [
            SHARE_RIGHT,
            SHARE_BASE + kept * SHARE_SCALE + 0.36,
            0
          ],
          20
        )
      );
    } else {
      objects.push(
        tag(
          '?',
          AMBER,
          [
            SHARE_RIGHT,
            SHARE_BASE + 0.42,
            0
          ],
          20
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Animated copies of four selected pieces.
  //
  // These objects are created independently before
  // display. The original rise is not destroyed.
  // ------------------------------------------------------------

  function createShareCopies(amount) {
    const a = [];

    const piece = amount / 10;

    const color =
      amount === 5 ? GREEN : VIOLET;

    for (let j = 0; j < 4; j++) {
      const b = shareBlock(
        SHARE_LEFT,
        j,
        piece,
        color,
        0.98
      );

      visible['piece' + j] = b;

      a.push(fadeIn(b, 0.22));
    }

    return a;
  }

  function moveShareCopies(amount) {
    const piece = amount / 10;

    const animations = [];

    for (let j = 0; j < 4; j++) {
      if (!visible['piece' + j]) continue;

      animations.push(
        new M.Transform(
          visible['piece' + j],
          shareBlock(
            SHARE_RIGHT,
            j,
            piece,
            GREEN,
            0.97
          ),
          {
            pathArc: -0.45,
            runTime: 0.65
          }
        )
      );
    }

    return new M.LaggedStart(
      animations,
      {
        lagRatio: 0.16,
        runTime: 1.25
      }
    );
  }

  // ------------------------------------------------------------
  // Fitting picture.
  //
  // The supplied weight is 0.4.
  //
  // Do not estimate a new coefficient from just the
  // five displayed changes.
  //
  // The additional historical record is represented
  // by an ellipsis, rather than invented observations.
  // ------------------------------------------------------------

  function fittingPicture(named = false) {
    const objects = [];

    const top = P ? 0.35 : 0.45;

    objects.push(
      txt(
        named
          ? 'FIT THE RULE USING PAST RECORDS'
          : 'CHOOSE THE SHARE FROM PAST CHANGES',
        18,
        VIOLET,
        [CX, TITLE_Y, 0]
      )
    );

    const values = ['…', '+4', '−4', '+3', '+1', '+5'];

    values.forEach((value, i) => {
      const x = CX + (i - 2.5) * 0.88;

      const color =
        value === '…'
          ? C.muted
          : value.startsWith('−')
            ? PINK
            : GREEN;

      objects.push(
        rounded(
          0.73,
          0.67,
          [x, top, 0],
          color,
          0.06
        ),
        txt(
          value,
          19,
          color,
          [x, top, 0],
          true
        )
      );
    });

    const resultY = P ? -1.80 : -1.30;

    objects.push(
      arrow(
        [CX, top - 0.42, 0],
        [CX, resultY + 0.55, 0],
        VIOLET,
        3
      ),
      rounded(
        2.55,
        1.02,
        [CX, resultY, 0],
        VIOLET,
        0.09
      ),
      txt(
        'FITTED WEIGHT',
        14,
        VIOLET,
        [CX, resultY + 0.25, 0]
      ),
      txt(
        '0.4',
        29,
        GREEN,
        [CX, resultY - 0.15, 0],
        true
      ),
      txt(
        'Learned from the wider historical record',
        13,
        C.muted,
        [CX, resultY - 0.83, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Autoregression on changes, rather than counts.
  //
  // The previous change becomes the input to the rule.
  // The output is the next predicted change.
  // ------------------------------------------------------------

  function autoregressivePicture(
    previous = 5,
    result = null
  ) {
    const objects = [];

    const y = P ? -0.65 : -0.45;

    const xs = [
      CX - 2.0,
      CX,
      CX + 2.0
    ];

    objects.push(
      txt(
        'AUTOREGRESSION ON CHANGES',
        19,
        VIOLET,
        [CX, TITLE_Y, 0]
      )
    );

    const labels = [
      'PREVIOUS',
      'RULE',
      'NEXT'
    ];

    const values = [
      signed(previous),
      '× 0.4',
      result === null ? '?' : signed(result)
    ];

    const colors = [
      GREEN,
      VIOLET,
      AMBER
    ];

    xs.forEach((x, i) => {
      objects.push(
        rounded(
          1.62,
          1.73,
          [x, y, 0],
          colors[i],
          0.07
        ),
        txt(
          labels[i],
          14,
          colors[i],
          [x, y + 0.56, 0]
        ),
        txt(
          values[i],
          25,
          colors[i],
          [x, y, 0],
          true
        ),
        txt(
          i === 1 ? 'fitted share' : 'change',
          13,
          colors[i],
          [x, y - 0.53, 0]
        )
      );
    });

    objects.push(
      arrow(
        [xs[0] + 0.83, y, 0],
        [xs[1] - 0.83, y, 0],
        VIOLET
      ),
      arrow(
        [xs[1] + 0.83, y, 0],
        [xs[2] - 0.83, y, 0],
        GREEN
      ),
      tag(
        'ONE EARLIER CHANGE',
        VIOLET,
        [CX, y - 1.40, 0],
        15
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Forecast staircase.
  //
  // Week 6 known count = 29.
  //
  // Week 7:
  // 29 + 2 = 31.
  //
  // Week 8:
  // 31 + 0.8 = 31.8.
  //
  // Dashed amber lines represent the forecasts.
  //
  // The vertical green arrow shows the predicted
  // change being added back to the room count.
  // ------------------------------------------------------------

  function forecastPoint(week, value) {
    return new M.VGroup(
      ring(pt(week, value), AMBER, 0.16),
      dot(pt(week, value), AMBER, 0.052)
    );
  }

  function forecastStep(week, showLabel = true) {
    const previous =
      week === 7 ? KNOWN[5] : FORECAST_7;

    const value =
      week === 7 ? FORECAST_7 : FORECAST_8;

    const a = pt(week - 1, previous);
    const b = pt(week, value);

    const objects = [
      dash(a, b, AMBER),
      dash(
        [X(week), AY0 + 0.04, 0],
        [X(week), Y(value) - (showLabel ? 0.62 : 0.17), 0],
        AMBER
      ),
      forecastPoint(week, value)
    ];

    if (showLabel) {
      objects.push(
        tag(
          fmt(value),
          AMBER,
          [
            X(week),
            Y(value) - 0.40,
            0
          ],
          15
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function forecastRise(week) {
    const previous =
      week === 7 ? KNOWN[5] : FORECAST_7;

    const next =
      week === 7 ? FORECAST_7 : FORECAST_8;

    const value = next - previous;

    const a = pt(week - 1, previous);

    const corner = [
      X(week),
      Y(previous),
      0
    ];

    const b = pt(week, next);

    const x =
      X(week) + (week === 7 ? -0.22 : 0.22);

    return new M.VGroup(
      dash(a, corner, GREEN),
      arrow(
        [x, Y(previous), 0],
        [x, Y(next), 0],
        GREEN,
        3.5
      ),
      txt(
        signed(value),
        15,
        GREEN,
        [
          (a[0] + b[0]) / 2,
          Math.max(a[1], b[1]) + 0.34,
          0
        ],
        true
      )
    );
  }

  function forecastChart(
    stage = 1,
    showRises = false,
    actual = false,
    error = false
  ) {
    const a = [
      ...chart(stage < 2 ? [8] : [], true),
      ...put('forecast7', forecastStep(7))
    ];

    if (stage >= 2) {
      a.push(
        ...put('forecast8', forecastStep(8))
      );
    }

    if (showRises) {
      a.push(
        ...put('rise7', forecastRise(7))
      );

      if (stage >= 2) {
        a.push(
          ...put('rise8', forecastRise(8))
        );
      }
    }

    if (actual) {
      a.push(
        ...put('actual7', christmasActual()),
        ...put('legend', chartLegend(true, true))
      );
    }

    if (error && actual) {
      a.push(
        ...put('error7', christmasError())
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Magnified add-back picture.
  //
  // This picture uses a local numerical scale.
  //
  // It shows the forecast as a previous count plus
  // a predicted rise.
  //
  // The local axis is explicitly labelled with its
  // actual numerical values.
  // ------------------------------------------------------------

  function addBackPicture(
    previous,
    rise,
    completed = false
  ) {
    const objects = [];

    const minimum = Math.floor(previous) - 1;
    const maximum = Math.ceil(previous + rise) + 1;

    const bottom = P ? -3.55 : -2.08;
    const top = P ? 0.75 : 0.83;

    const yy = value =>
      bottom +
      (value - minimum) /
      (maximum - minimum) *
      (top - bottom);

    const ax = CX - 2.15;
    const bx = CX - 0.45;

    const target = previous + rise;

    objects.push(
      txt(
        'ADD THE PREDICTED RISE BACK',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [ax, bottom, 0],
        [ax, top, 0],
        C.muted,
        1.6
      )
    );

    for (let v = minimum; v <= maximum; v++) {
      objects.push(
        ln(
          [ax - 0.06, yy(v), 0],
          [ax + 0.06, yy(v), 0],
          C.muted,
          1.2
        ),
        txt(
          String(v),
          15,
          C.muted,
          [ax - 0.30, yy(v), 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms',
        12,
        C.muted,
        [ax, top + 0.27, 0]
      ),
      dash(
        [ax + 0.09, yy(previous), 0],
        [CX + 2.58, yy(previous), 0],
        WHITE
      ),
      tag(
        fmt(previous),
        previous === 29 ? CYAN : AMBER,
        [
          CX + 1.48,
          yy(previous) - 0.33,
          0
        ],
        17
      )
    );

    // Ten possible pieces of the previous change.
    // The four retained pieces form the added rise.

    const piece = rise / 4;

    for (let j = 0; j < 4; j++) {
      const value =
        previous + (j + 0.5) * piece;

      objects.push(
        rect(
          1.04,
          (yy(previous + piece) - yy(previous)) * 0.84,
          [bx, yy(value), 0],
          GREEN,
          0.93
        )
      );
    }

    const gx = CX + 0.43;

    objects.push(
      arrow(
        [gx, yy(previous), 0],
        [gx, yy(target), 0],
        GREEN,
        3.4
      ),
      txt(
        signed(rise),
        21,
        GREEN,
        [
          CX + 1.29,
          (yy(previous) + yy(target)) / 2,
          0
        ],
        true
      )
    );

    if (completed) {
      objects.push(
        dash(
          [ax + 0.09, yy(target), 0],
          [CX + 2.50, yy(target), 0],
          AMBER
        ),
        ring(
          [bx, yy(target), 0],
          AMBER,
          0.14
        ),
        tag(
          fmt(target) + ' ROOMS',
          AMBER,
          [
            CX + 1.39,
            yy(target) + 0.35,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Compare the three rises.
  //
  // Week 6 actual change: +5.
  // Christmas predicted change: +2.
  // New Year predicted change: +0.8.
  //
  // Each stack uses the same vertical scale.
  // ------------------------------------------------------------

  function shrinkingRises(showWeights = false) {
    const objects = [];

    const values = [5, 2, 0.8];

    const xs = [
      CX - 1.98,
      CX,
      CX + 1.98
    ];

    const base = P ? -3.40 : -2.10;
    const scale = P ? 0.78 : 0.52;

    const yy = value =>
      base + value * scale;

    objects.push(
      txt(
        'THE PREDICTED RISE GETS SMALLER',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [CX - 2.65, base, 0],
        [CX + 2.65, base, 0],
        C.muted,
        2
      )
    );

    values.forEach((value, i) => {
      const color = i === 0 ? CYAN : GREEN;
      const x = xs[i];

      objects.push(
        rect(
          0.86,
          value * scale,
          [
            x,
            (base + yy(value)) / 2,
            0
          ],
          color,
          0.89
        ),
        txt(
          signed(value),
          22,
          color,
          [x, yy(value) + 0.31, 0],
          true
        ),
        txt(
          ['Week 6', 'Christmas', 'New Year'][i],
          15,
          i === 0 ? CYAN : AMBER,
          [x, base - 0.33, 0]
        ),
        txt(
          i === 0 ? 'observed' : 'predicted',
          12,
          C.muted,
          [x, base - 0.69, 0]
        )
      );
    });

    if (showWeights) {
      for (let i = 0; i < 2; i++) {
        const a = [
          xs[i] + 0.49,
          yy(values[i]) - 0.12,
          0
        ];

        const b = [
          xs[i + 1] - 0.49,
          yy(values[i + 1]) + 0.08,
          0
        ];

        objects.push(
          arrow(a, b, VIOLET, 2.8),
          tag(
            '× 0.4',
            VIOLET,
            [
              (a[0] + b[0]) / 2,
              (a[1] + b[1]) / 2 + 0.29,
              0
            ],
            14
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Fractional forecast.
  //
  // A forecast of 31.8 does not mean that a real hotel
  // room is physically divided.
  //
  // Show 31.8 at exactly eight tenths of the distance
  // from 31 to 32.
  // ------------------------------------------------------------

  function fractionalForecastPicture() {
    const objects = [];

    const left = CX - 2.50;
    const right = CX + 2.50;

    const y = P ? -1.25 : -0.60;

    const xx = value =>
      left + (value - 31) * (right - left);

    objects.push(
      txt(
        'A FORECAST CAN BE BETWEEN WHOLE COUNTS',
        P ? 18 : 17,
        AMBER,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [left, y, 0],
        [right, y, 0],
        C.muted,
        3
      )
    );

    for (let j = 0; j <= 10; j++) {
      const x = xx(31 + j / 10);
      const major = j === 0 || j === 10;

      objects.push(
        ln(
          [x, y - (major ? 0.13 : 0.07), 0],
          [x, y + (major ? 0.13 : 0.07), 0],
          major ? WHITE : C.muted,
          major ? 2.3 : 1.2
        )
      );
    }

    objects.push(
      txt(
        '31',
        24,
        WHITE,
        [left, y - 0.38, 0],
        true
      ),
      txt(
        '32',
        24,
        WHITE,
        [right, y - 0.38, 0],
        true
      ),
      ln(
        [left, y, 0],
        [xx(31.8), y, 0],
        AMBER,
        4
      ),
      glow(
        [xx(31.8), y, 0],
        AMBER,
        0.12
      ),
      dash(
        [xx(31.8), y + 0.13, 0],
        [xx(31.8), y + 0.62, 0],
        AMBER
      ),
      tag(
        '31.8',
        AMBER,
        [xx(31.8), y + 0.87, 0],
        23
      ),
      txt(
        'A numerical guess, not a fraction of a real room',
        14,
        C.muted,
        [CX, y - 1.14, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Two-step forecasting procedure.
  //
  // First predict the change.
  // Then add the change to the previous room count.
  //
  // Use the Christmas example to connect the two
  // operations.
  // ------------------------------------------------------------

  function twoStepPicture(stage = 0) {
    const objects = [];

    const upper = P ? 0.02 : 0.38;
    const lower = P ? -2.28 : -1.47;

    objects.push(
      txt(
        'PREDICT THE CHANGE, THEN ADD IT BACK',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        5.12,
        1.27,
        [CX, upper, 0],
        VIOLET,
        0.05
      ),
      txt(
        '1. PREDICT THE CHANGE',
        15,
        VIOLET,
        [CX, upper + 0.36, 0]
      ),
      txt(
        '5 × 0.4 = 2',
        25,
        GREEN,
        [CX, upper - 0.14, 0],
        true
      )
    );

    if (stage >= 1) {
      objects.push(
        arrow(
          [CX, upper - 0.68, 0],
          [CX, lower + 0.68, 0],
          GREEN,
          3
        ),
        rounded(
          5.12,
          1.27,
          [CX, lower, 0],
          AMBER,
          0.05
        ),
        txt(
          '2. ADD TO THE PREVIOUS COUNT',
          15,
          AMBER,
          [CX, lower + 0.36, 0]
        ),
        txt(
          '29 + 2 = 31',
          25,
          AMBER,
          [CX, lower - 0.14, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // ARIMA family picture.
  //
  // AR: autoregression on the changes.
  // I:  integrated — difference once, then recover
  //     the room-count forecast by adding back.
  // MA: moving-average error terms.
  //
  // This lesson uses ARIMA(1,1,0).
  //
  // Reveal the meanings of p, d and q separately,
  // following the narration.
  // ------------------------------------------------------------

  function arimaPicture(stage = 0) {
    const objects = [];

    const xs = [
      CX - 2.04,
      CX,
      CX + 2.04
    ];

    const y = P ? -0.75 : -0.52;

    const colors = [
      GREEN,
      VIOLET,
      PINK
    ];

    const names = ['AR', 'I', 'MA'];
    const digits = ['1', '1', '0'];

    const meanings = [
      ['One past', 'change'],
      ['Difference', 'once'],
      ['No past', 'surprise terms']
    ];

    objects.push(
      txt(
        stage >= 1
          ? 'ARIMA(1,1,0)'
          : 'THE ARIMA FAMILY',
        26,
        CYAN,
        [CX, TITLE_Y, 0],
        true
      )
    );

    xs.forEach((x, i) => {
      const enabled = stage >= i + 2;

      const color = enabled
        ? colors[i]
        : stage >= 1
          ? C.ink
          : colors[i];

      objects.push(
        rounded(
          1.73,
          2.68,
          [x, y, 0],
          color,
          enabled ? 0.10 : 0.025
        ),
        txt(
          names[i],
          18,
          colors[i],
          [x, y + 0.98, 0],
          true
        ),
        txt(
          stage >= 1 ? digits[i] : '?',
          38,
          color,
          [x, y + 0.24, 0],
          true
        )
      );

      if (enabled) {
        objects.push(
          txt(
            meanings[i][0],
            15,
            colors[i],
            [x, y - 0.53, 0]
          ),
          txt(
            meanings[i][1],
            i === 2 ? 12 : 15,
            colors[i],
            [x, y - 0.88, 0]
          )
        );
      }
    });

    if (stage >= 4) {
      objects.push(
        tag(
          'ONE LAG • ONE DIFFERENCE • ZERO MA TERMS',
          GREEN,
          [
            CX,
            y - 1.80,
            0
          ],
          12
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Compare predicting levels with predicting changes.
  //
  // Both plots use the actual known hotel data.
  // The change plot is not claimed to be stationary
  // merely because we have differenced once.
  //
  // The method is useful when changes are more
  // predictable than the original room counts.
  // ------------------------------------------------------------

  function countChangeComparison() {
    const objects = [];

    const left = CX - 2.60;
    const right = CX + 2.60;

    const upperBottom = P ? -0.55 : -0.25;
    const upperTop = P ? 0.90 : 0.95;

    const lowerBottom = P ? -3.70 : -2.40;
    const lowerTop = P ? -1.55 : -1.05;

    const xx = i =>
      left + 0.25 +
      i / 5 * (right - left - 0.50);

    const yCount = value =>
      upperBottom +
      value / 40 * (upperTop - upperBottom);

    const yChange = value =>
      lowerBottom +
      (value + 5) / 10 *
      (lowerTop - lowerBottom);

    objects.push(
      txt(
        'ROOM COUNTS',
        17,
        CYAN,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [left, upperBottom, 0],
        [right, upperBottom, 0],
        C.muted,
        1.6
      )
    );

    [0, 20, 40].forEach(v => {
      objects.push(
        txt(
          String(v),
          12,
          C.muted,
          [left - 0.28, yCount(v), 0],
          true
        )
      );
    });

    for (let i = 0; i < 6; i++) {
      if (i > 0) {
        objects.push(
          ln(
            [xx(i - 1), yCount(KNOWN[i - 1]), 0],
            [xx(i), yCount(KNOWN[i]), 0],
            CYAN,
            2.6
          )
        );
      }

      objects.push(
        dot(
          [xx(i), yCount(KNOWN[i]), 0],
          CYAN,
          0.065
        )
      );
    }

    objects.push(
      txt(
        'WEEKLY CHANGES',
        17,
        VIOLET,
        [
          CX,
          (upperBottom + lowerTop) / 2,
          0
        ]
      ),
      ln(
        [left, yChange(0), 0],
        [right, yChange(0), 0],
        WHITE,
        1.6
      )
    );

    [-5, 0, 5].forEach(v => {
      objects.push(
        txt(
          signed(v),
          12,
          C.muted,
          [left - 0.28, yChange(v), 0],
          true
        )
      );
    });

    CHANGES.forEach((value, i) => {
      const x = xx(i + 1);

      objects.push(
        rect(
          0.42,
          Math.abs(yChange(value) - yChange(0)),
          [
            x,
            (yChange(value) + yChange(0)) / 2,
            0
          ],
          changeColor(value),
          0.88
        ),
        txt(
          signed(value),
          14,
          changeColor(value),
          [
            x,
            yChange(value) + (value >= 0 ? 0.20 : -0.20),
            0
          ],
          true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Actual Christmas observation.
  //
  // This function must not be invoked before beat 41.
  // New Year's actual count is never displayed.
  // ------------------------------------------------------------

  function christmasActual() {
    const value = DATA[6];

    return new M.VGroup(
      ln(
        pt(6, KNOWN[5]),
        pt(7, value),
        WHITE,
        2.3
      ),
      glow(
        pt(7, value),
        WHITE,
        0.11
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

  function christmasError() {
    const x = X(7) - 0.23;

    const low = Y(FORECAST_7);
    const high = Y(DATA[6]);

    return new M.VGroup(
      ln(
        [x, low, 0],
        [x, high, 0],
        RED,
        3.1
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
      tag(
        fmt(ERROR_7),
        RED,
        [
          x - 0.23,
          high + 0.20,
          0
        ],
        15
      )
    );
  }

  // ------------------------------------------------------------
  // Holiday calendar cue.
  //
  // The calendar is known before the forecast.
  // But this particular ARIMA model has no separate
  // holiday or seasonal predictor.
  // ------------------------------------------------------------

  function holidayCalendar() {
    const x = X(7);
    const y = AY0 + 1.04;

    return new M.VGroup(
      rounded(
        0.83,
        0.87,
        [x, y, 0],
        PINK,
        0.12
      ),
      rect(
        0.80,
        0.22,
        [x, y + 0.31, 0],
        PINK,
        0.94
      ),
      txt(
        'XMAS',
        11,
        C.card,
        [x, y + 0.31, 0]
      ),
      txt(
        '7',
        24,
        WHITE,
        [x, y - 0.10, 0],
        true
      ),
      arrow(
        [x, y + 0.52, 0],
        [x, Y(FORECAST_7) - 0.66, 0],
        PINK,
        2.2
      ),
      txt(
        'not in the rule',
        13,
        PINK,
        [
          x - 0.92,
          y + 0.62,
          0
        ]
      )
    );
  }

  // ============================================================
  // 0–3: introduce the forecasting problem.
  // ============================================================

  // 0. The hotel has become busier as Christmas approaches.

  await until(S(0));
  await play(
    ...picture(openingPicture(false)),
    ...say('THE HOTEL IS GETTING BUSIER'),
    ...fbox([
      ['HOTEL: 40 ROOMS', CYAN],
      'Christmas is approaching',
      ['latest count = 29', CYAN]
    ])
  );

  // 1. Can changes help forecast the next two Saturdays?

  await until(S(1));
  await play(
    ...put('picture', openingPicture(true)),
    ...say('CAN THE CHANGES HELP US FORECAST?', AMBER),
    ...fbox([
      ['Christmas = ?', AMBER],
      ['New Year = ?', AMBER],
      'look at the weekly changes'
    ], AMBER)
  );

  // 2. Show the six known cyan dots.

  await until(S(2));
  await play(
    ...chart([]),
    ...say('SIX KNOWN SATURDAY COUNTS'),
    ...fbox([
      ['weeks 1–6', CYAN],
      '20, 24, 20, 23, 24, 29'
    ])
  );

  // 3. Keep both holiday observations hidden.

  await until(S(3));
  await play(
    ...put('hidden', hiddenHolidays([7, 8])),
    ...say('KEEP BOTH HOLIDAY COUNTS HIDDEN', AMBER),
    ...fbox([
      ['known through week 6', CYAN],
      ['weeks 7 and 8 unknown', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 4–10: turn the original series into change arrows.
  // ============================================================

  // 4. Draw arrows between consecutive observations.

  await until(S(4));
  await play(
    ...put('arrows', allChangeArrows(5, false)),
    ...say('DRAW AN ARROW FROM EACH DOT TO THE NEXT', GREEN),
    ...fbox([
      'each arrow connects',
      'two consecutive counts'
    ], GREEN)
  );

  // 5. The first arrow goes from 20 to 24.

  await until(S(5));
  await play(
    ...put('focus', changeTriangle(2, false)),
    ...say('WEEK 1 TO WEEK 2: 20 → 24'),
    ...fbox([
      ['previous = 20', CYAN],
      ['new = 24', CYAN]
    ])
  );

  // 6. This represents a rise of four rooms.

  await until(S(6));
  await play(
    ...put('focus', changeTriangle(2, true)),
    ...put('labels', allChangeArrows(1, true)),
    ...say('24 − 20 = +4 ROOMS', GREEN),
    ...fbox([
      '24 − 20',
      ['= +4 rooms', GREEN]
    ], GREEN)
  );

  // 7. The storm causes the next count to drop by four.

  await until(S(7));
  await play(
    ...put('focus', changeTriangle(3, true)),
    ...put('labels', allChangeArrows(2, true)),
    ...say('STORM WEEK: A DROP OF 4 ROOMS', PINK),
    ...fbox([
      '20 − 24',
      ['= −4 rooms', PINK]
    ], PINK)
  );

  // 8. The next count rises three.

  await until(S(8));
  await play(
    ...put('focus', changeTriangle(4, false)),
    ...put('labels', allChangeArrows(3, true)),
    ...say('NEXT CHANGE: +3', GREEN),
    ...fbox([
      ['23 − 20 = +3', GREEN]
    ], GREEN)
  );

  // 9. The next count rises one.

  await until(S(9));
  await play(
    ...put('focus', changeTriangle(5, false)),
    ...put('labels', allChangeArrows(4, true)),
    ...say('NEXT CHANGE: +1', GREEN),
    ...fbox([
      ['24 − 23 = +1', GREEN]
    ], GREEN)
  );

  // 10. The last known count rises five.

  await until(S(10));
  await play(
    ...put('focus', changeTriangle(6, false)),
    ...put('labels', allChangeArrows(5, true)),
    ...say('LATEST CHANGE: +5', GREEN),
    ...fbox([
      ['29 − 24 = +5', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 11–14: differencing.
  // ============================================================

  // 11. Put the changes into a separate row in week order.

  await until(S(11));
  await play(
    ...picture(differenceRow(0)),
    ...say('PUT THE CHANGES IN THEIR OWN ROW', VIOLET),
    ...fbox([
      ['weeks 2–6', VIOLET],
      '+4, −4, +3, +1, +5'
    ], VIOLET)
  );

  // 12. For every change, subtract the previous count
  // from the new count.

  await until(S(12));
  await play(
    ...put('picture', differenceRow(1, 1)),
    ...say('CHANGE = NEW COUNT MINUS PREVIOUS COUNT', VIOLET),
    ...fbox([
      'new count − previous count',
      ['24 − 20 = +4', GREEN],
      ['20 − 24 = −4', PINK]
    ], VIOLET)
  );

  // 13. Name differencing.

  await until(S(13));
  await play(
    ...put('picture', differenceRow(2)),
    ...say('DIFFERENCING', VIOLET),
    ...fbox([
      ['DIFFERENCING', VIOLET],
      'turn consecutive counts',
      'into their changes'
    ], VIOLET)
  );

  // 14. The question changes from how many rooms
  // to how many more or fewer rooms.

  await until(S(14));
  await play(
    ...picture(differenceBars(false)),
    ...say('FROM ROOM COUNTS TO ROOM CHANGES', GREEN),
    ...fbox([
      ['before: how many rooms?', CYAN],
      ['now: how many more or fewer?', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 15–22: forecast the next change.
  //
  // Last change = +5.
  // Fitted share = 0.4.
  // Next predicted change = +2.
  // ============================================================

  // 15. Use the latest arrow to guide the next arrow.

  await until(S(15));
  await play(
    ...put('picture', differenceBars(true)),
    ...say('USE THE LATEST CHANGE AS A GUIDE', GREEN),
    ...fbox([
      ['latest change = +5', GREEN],
      'use a share of this rise',
      'to predict the next rise'
    ], GREEN)
  );

  // 16. Draw five room blocks representing the rise.

  await until(S(16));
  await play(
    ...picture(sharePicture(5, 0)),
    ...say('DRAW THE FIVE-ROOM RISE AS A STACK', GREEN),
    ...fbox([
      ['last change = +5 rooms', GREEN],
      'one block = one room'
    ], GREEN)
  );

  // 17. Split five rooms into ten equal pieces.

  await until(S(17));
  await play(
    ...put('picture', sharePicture(5, 1)),
    ...say('SPLIT THE RISE INTO TEN EQUAL PIECES', VIOLET),
    ...fbox([
      '5 rooms ÷ 10 pieces',
      ['= 0.5 room per piece', VIOLET]
    ], VIOLET)
  );

  // 18. Keep four pieces, or four tenths.

  await until(S(18));
  await play(
    ...put('picture', sharePicture(5, 2)),
    ...say('KEEP FOUR OF THE TEN PIECES', GREEN),
    ...fbox([
      ['4/10 = 0.4', VIOLET],
      'keep four tenths',
      'of the previous rise'
    ], GREEN)
  );

  // 19. The share is chosen from past records.

  await until(S(19));
  await play(
    ...picture(fittingPicture(false)),
    ...say('THE HOTEL LEARNS THE SHARE FROM PAST CHANGES', VIOLET),
    ...fbox([
      'use the historical record',
      ['chosen share = 0.4', GREEN]
    ], VIOLET)
  );

  // 20. Choosing the rule's numbers is called fitting.

  await until(S(20));
  await play(
    ...put('picture', fittingPicture(true)),
    ...say('FITTING = CHOOSING THE RULE’S NUMBERS', VIOLET),
    ...fbox([
      ['FITTING THE RULE', VIOLET],
      'choose its numbers',
      'using past records'
    ], VIOLET)
  );

  // 21. Reusing one earlier change is autoregressive,
  // just as reusing earlier counts was autoregressive.

  await until(S(21));
  await play(
    ...picture(autoregressivePicture(5)),
    ...say('AUTOREGRESSION — NOW ON THE CHANGES', GREEN),
    ...fbox([
      ['earlier: reuse room counts', CYAN],
      ['now: reuse earlier changes', GREEN]
    ], GREEN)
  );

  // 22. Four tenths of five rooms gives two rooms.
  //
  // Make four independent copies of the retained
  // half-room pieces and move them into the next column.

  await until(S(22));
  await play(
    ...picture(sharePicture(5, 2)),
    ...createShareCopies(5),
    ...say('0.4 × 5 = A RISE OF 2 ROOMS', GREEN),
    ...fbox([
      '4 pieces × 0.5 room',
      ['= +2 rooms', GREEN]
    ], GREEN)
  );

  await until(S(22) + 0.65);
  await play(
    moveShareCopies(5)
  );

  // ============================================================
  // 23–24: add the predicted change back to the count.
  // ============================================================

  // 23. Add the predicted rise to 29.

  await until(S(23));
  await play(
    ...picture(addBackPicture(29, 2, false)),
    ...say('ADD THE TWO-ROOM RISE TO 29', GREEN),
    ...fbox([
      ['last known count = 29', CYAN],
      ['predicted rise = +2', GREEN],
      '29 + 2'
    ], GREEN)
  );

  // 24. Christmas forecast = 31 rooms.
  //
  // Draw the amber forecast before revealing any actual.

  await until(S(24));
  await play(
    ...forecastChart(1, true),
    ...say('CHRISTMAS FORECAST = 31 ROOMS', AMBER),
    ...fbox([
      ['29 + 2 = 31', AMBER],
      'Christmas forecast'
    ], AMBER)
  );

  // ============================================================
  // 25–29: forecast another week ahead.
  //
  // Remain at the end of week 6.
  //
  // Previous predicted change = +2.
  // Next predicted change = 0.4 × 2 = +0.8.
  // Previous predicted room count = 31.
  // New Year forecast = 31.8.
  // ============================================================

  // 25. Stay at the same forecasting origin.

  await until(S(25));
  await play(
    ...indicate('now', AMBER),
    ...say('STAY AT THE END OF WEEK 6', AMBER),
    ...fbox([
      ['Christmas forecast = 31', AMBER],
      'make New Year forecast now',
      'both actuals still hidden'
    ], AMBER)
  );

  // 26. Use the predicted change of two as the input.

  await until(S(26));
  await play(
    ...picture(autoregressivePicture(2)),
    ...say('USE THE PREDICTED RISE OF 2', VIOLET),
    ...fbox([
      ['previous predicted rise = 2', GREEN],
      'reuse it as the input',
      ['multiply by 0.4', VIOLET]
    ], VIOLET)
  );

  // 27. Four tenths of two gives 0.8.
  //
  // Two rooms split into ten pieces.
  // Each piece represents 0.2 room.
  // Four pieces represent 0.8 room.

  await until(S(27));
  await play(
    ...picture(sharePicture(2, 2)),
    ...createShareCopies(2),
    ...say('0.4 × 2 = 0.8 ROOM', GREEN),
    ...fbox([
      '2 ÷ 10 = 0.2 per piece',
      ['4 × 0.2 = 0.8', GREEN]
    ], GREEN)
  );

  await until(S(27) + 0.65);
  await play(
    moveShareCopies(2)
  );

  // 28. Add 0.8 to the original Christmas forecast of 31.

  await until(S(28));
  await play(
    ...picture(addBackPicture(31, 0.8, false)),
    ...say('ADD 0.8 TO THE CHRISTMAS FORECAST', GREEN),
    ...fbox([
      ['previous forecast = 31', AMBER],
      ['predicted rise = +0.8', GREEN],
      '31 + 0.8'
    ], GREEN)
  );

  // 29. New Year forecast = 31.8 rooms.

  await until(S(29));
  await play(
    ...forecastChart(2, true),
    ...say('NEW YEAR FORECAST = 31.8 ROOMS', AMBER),
    ...fbox([
      ['Christmas: 29 + 2 = 31', AMBER],
      ['New Year: 31 + 0.8 = 31.8', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 30–32: shrinking changes and fractional forecasts.
  // ============================================================

  // 30. Compare five, two and zero point eight.

  await until(S(30));
  await play(
    ...picture(shrinkingRises(false)),
    ...say('COMPARE THE THREE RISES: 5, 2, 0.8', GREEN),
    ...fbox([
      ['week 6: +5 observed', CYAN],
      ['Christmas: +2 predicted', GREEN],
      ['New Year: +0.8 predicted', GREEN]
    ], GREEN)
  );

  // 31. Each step carries a smaller share of the rise.

  await until(S(31));
  await play(
    ...put('picture', shrinkingRises(true)),
    ...say('EACH STEP KEEPS ONLY FOUR TENTHS', VIOLET),
    ...fbox([
      '5 × 0.4 = 2',
      '2 × 0.4 = 0.8',
      ['the rises become smaller', GREEN]
    ], VIOLET)
  );

  // 32. A forecast may be fractional because it is a guess.

  await until(S(32));
  await play(
    ...picture(fractionalForecastPicture()),
    ...say('A GUESS CAN SIT BETWEEN WHOLE ROOM COUNTS', AMBER),
    ...fbox([
      ['forecast = 31.8', AMBER],
      'actual room counts are whole',
      'forecasts need not be'
    ], AMBER)
  );

  // ============================================================
  // 33–34: the two rules in words.
  // ============================================================

  // 33. Next change equals four tenths times the
  // previous change.

  await until(S(33));
  await play(
    ...picture(twoStepPicture(0)),
    ...say('NEXT CHANGE = 0.4 × PREVIOUS CHANGE', VIOLET),
    ...fbox([
      ['next change =', GREEN],
      '  0.4 × previous change',
      ['example: 0.4 × 5 = 2', GREEN]
    ], VIOLET)
  );

  // 34. Next room count equals previous count
  // plus the predicted change.

  await until(S(34));
  await play(
    ...put('picture', twoStepPicture(1)),
    ...say('NEXT COUNT = PREVIOUS COUNT + PREDICTED CHANGE', AMBER),
    ...fbox([
      ['next room count =', AMBER],
      '  previous count',
      '  + predicted change'
    ], AMBER)
  );

  // ============================================================
  // 35–39: name ARIMA(1,1,0).
  // ============================================================

  // 35. Combining differencing with this kind of
  // autoregressive prediction belongs to ARIMA.

  await until(S(35));
  await play(
    ...picture(arimaPicture(0)),
    ...say('DIFFERENCING + AUTOREGRESSION: THE ARIMA FAMILY', CYAN),
    ...fbox([
      ['ARIMA FAMILY', CYAN],
      'model changes',
      'recover room-count forecasts'
    ])
  );

  // 36. Introduce the name ARIMA(1,1,0).

  await until(S(36));
  await play(
    ...put('picture', arimaPicture(1)),
    ...say('ARIMA(1,1,0)', CYAN),
    ...fbox([
      ['ARIMA(1,1,0)', CYAN],
      'three numbers describe',
      'the structure of the rule'
    ])
  );

  // 37. The first one means one past change.

  await until(S(37));
  await play(
    ...put('picture', arimaPicture(2)),
    ...say('FIRST 1: ONE PAST CHANGE', GREEN),
    ...fbox([
      ['AR: p = 1', GREEN],
      'use one earlier change',
      'next = 0.4 × previous'
    ], GREEN)
  );

  // 38. The second one means difference once.

  await until(S(38));
  await play(
    ...put('picture', arimaPicture(3)),
    ...say('SECOND 1: DIFFERENCE ONCE', VIOLET),
    ...fbox([
      ['I: d = 1', VIOLET],
      'counts → first differences',
      'take differences once'
    ], VIOLET)
  );

  // 39. Zero means no separate past-surprise terms.

  await until(S(39));
  await play(
    ...put('picture', arimaPicture(4)),
    ...say('ZERO: NO SEPARATE PAST-SURPRISE TERMS', PINK),
    ...fbox([
      ['MA: q = 0', PINK],
      'no separate lagged',
      'surprise contributions'
    ], PINK)
  );

  // ============================================================
  // 40–42: when to use ARIMA and check Christmas.
  // ============================================================

  // 40. Use when changes are easier to predict
  // than the original counts.

  await until(S(40));
  await play(
    ...picture(countChangeComparison()),
    ...say('USE WHEN THE CHANGES ARE EASIER TO PREDICT', GREEN),
    ...fbox([
      ['original counts', CYAN],
      ['weekly changes', VIOLET],
      'model whichever structure',
      'is easier to predict'
    ], GREEN)
  );

  // 41. First reveal of the Christmas actual.
  //
  // Restore both original forecasts from week six.
  // Do not recalculate the New Year forecast using
  // the newly observed Christmas count.

  await until(S(41));
  await play(
    ...forecastChart(2, false, true, false),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 31', AMBER],
      ['real count = 35', WHITE]
    ])
  );

  // 42. Forecast is four rooms short.

  await until(S(42));
  await play(
    ...put('error7', christmasError()),
    ...say('35 − 31 = 4 ROOMS LOW', RED),
    ...fbox([
      'error = real − forecast',
      ['35 − 31 = 4', RED],
      'forecast falls 4 rooms short'
    ], RED)
  );

  // ============================================================
  // 43–44: limitation and final recap.
  // ============================================================

  // 43. The trap: weekly changes alone do not contain
  // separate information about the holiday calendar.

  await until(S(43));
  await play(
    ...put('calendar', holidayCalendar()),
    ...put(
      'holidayFocus',
      ring(pt(7, DATA[6]), RED, 0.22)
    ),
    ...say('TRAP: WEEKLY CHANGES DO NOT KNOW THE HOLIDAY', RED),
    ...fbox([
      ['THE TRAP', RED],
      'no separate holiday term',
      ['Christmas: 4 rooms low', RED]
    ], RED)
  );

  // 44. Final recap.
  //
  // Predict the next change using the fitted AR rule.
  // Add that change back to the previous count.
  //
  // Repeat using the predicted change when forecasting
  // more than one week ahead.
  //
  // Both forecasts were made at the end of week six.

  await until(S(44));
  await play(
    ...picture(twoStepPicture(1)),
    ...say('ARIMA: PREDICT THE CHANGE, THEN ADD IT BACK', GREEN),
    ...fbox([
      ['ARIMA(1,1,0)', CYAN],
      ['next change = 0.4 × previous', GREEN],
      ['next count = previous + change', AMBER]
    ], GREEN)
  );

  await until(S(44) + 2.20);
  await play(
    ...forecastChart(2, false, true, true),
    ...say('31 FOR CHRISTMAS — 31.8 FOR NEW YEAR', AMBER),
    ...fbox([
      ['Christmas forecast = 31', AMBER],
      ['New Year forecast = 31.8', AMBER],
      ['Christmas error = 4', RED]
    ], GREEN)
  );

  await until(E(44));
}
