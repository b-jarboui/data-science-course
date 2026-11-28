// lesson 11.2.11
// Seasonal ARIMA: predict the yearly gain and add it to last year's matching count.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// All 36 sentence beats (0–35) follow the supplied narration.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  // Week:       1   2   3   4   5   6   7   8
  // This year: 20  24  20  23  24  29  35  33
  // Last year: 18  21  19  21  22  26  32  30
  //
  // Yearly gains through week 6:
  // +2, +3, +1, +2, +2, +3.
  //
  // Seasonal differencing: step back 52 weeks.
  //
  // Model's usual yearly gain = 2 rooms.
  // Latest yearly gain = 3 rooms.
  // Latest gain minus usual gain = 1 room.
  //
  // Next gain = 2 + 0.5 × (3 - 2)
  //           = 2 + 0.5
  //           = 2.5 rooms.
  //
  // Christmas forecast = 32 + 2.5 = 34.5.
  // Christmas actual = 35.
  // Forecast error = 35 - 34.5 = 0.5.
  //
  // Christmas actual is revealed ONLY at beat 31.
  // New Year's actual remains hidden throughout.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];
  const LAST = [18, 21, 19, 21, 22, 26, 32, 30];

  const KNOWN = DATA.slice(0, 6);

  const GAINS = KNOWN.map(
    (value, i) => value - LAST[i]
  );

  const SEASON = 52;
  const USUAL_GAIN = 2;
  const WEIGHT = 0.5;

  const LAST_GAIN = GAINS[5];
  const GAIN_GAP = LAST_GAIN - USUAL_GAIN;
  const ADJUSTMENT = WEIGHT * GAIN_GAP;

  const NEXT_GAIN = USUAL_GAIN + ADJUSTMENT;
  const FORECAST = LAST[6] + NEXT_GAIN;

  const ERROR = DATA[6] - FORECAST;

  // ------------------------------------------------------------
  // Colour meanings.
  //
  // Cyan: this year's known room counts.
  // Pink: last year's room counts.
  // Green: yearly gains and predicted gains.
  // Violet: seasonal matching and differencing.
  // Amber: forecasts.
  // White: newly revealed Christmas actual.
  // Red: forecast error, downward gains and warnings.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const PINK = C.pink || '#F28BB9';
  const GREEN = C.green;
  const VIOLET = C.violet;
  const AMBER = C.amber;
  const RED = C.red || '#FF526F';
  const WHITE = '#F0F4FA';

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Keep content between y = -3.0 and 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.3, 0];

  const TITLE_Y = P ? 1.43 : 1.31;

  const AX0 = CX - 3.05;
  const AX1 = CX + 3.12;

  const AY0 = P ? -4.10 : -2.05;
  const AY1 = P ? 1.13 : 1.00;

  const STEP = (AX1 - AX0 - 0.65) / 7;

  const X = week =>
    AX0 + 0.35 + (week - 1) * STEP;

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
    const halo = dot(
      p,
      color,
      radius * 1.9,
      0.17
    );

    return new M.VGroup(
      halo,
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
  // Never regroup objects that are already on screen.
  // All groups below are created before display.
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
  // Same construction as the approved reference.
  // Short lines keep the card legible on phones.
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
  // Compare last Christmas's 32 occupied rooms with
  // this year's unknown Christmas occupancy.
  //
  // Forty tiles represent the hotel's capacity.
  // Do not reveal this year's holiday count.
  // ------------------------------------------------------------

  function openingPicture(compareAutumn = false) {
    const objects = [];

    const xs = [
      CX - 1.65,
      CX + 1.65
    ];

    const y = P ? -0.70 : -0.55;

    objects.push(
      txt(
        'CHRISTMAS STAFFING',
        20,
        AMBER,
        [CX, TITLE_Y, 0]
      )
    );

    xs.forEach((x, i) => {
      const color = i === 0 ? PINK : AMBER;

      objects.push(
        rounded(
          2.65,
          2.45,
          [x, y, 0],
          color,
          0.025
        ),
        txt(
          i === 0 ? 'Last Christmas' : 'This Christmas',
          15,
          color,
          [x, y + 1.53, 0]
        )
      );

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
          const k = row * 5 + col;

          const occupied = i === 0 && k < 32;

          objects.push(
            rounded(
              0.36,
              0.20,
              [
                x + (col - 2) * 0.43,
                y + (3.5 - row) * 0.27,
                0
              ],
              occupied ? PINK : C.muted,
              occupied ? 0.83 : 0.08
            )
          );
        }
      }

      objects.push(
        tag(
          i === 0 ? '32 ROOMS' : '? ROOMS',
          color,
          [x, y - 1.59, 0],
          17
        )
      );
    });

    objects.push(
      arrow(
        [xs[0] + 1.36, y, 0],
        [xs[1] - 1.36, y, 0],
        VIOLET,
        3
      )
    );

    if (compareAutumn) {
      objects.push(
        tag(
          'COMPARE THE AUTUMN WEEKS',
          GREEN,
          [
            CX,
            P ? -3.45 : -2.70,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Hotel chart.
  //
  // Horizontal axis: weeks 1–8.
  // Vertical axis: occupied rooms, 0–40.
  //
  // Cyan: this year's known observations.
  // Dimmer pink: last year's matching observations.
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
      const y = Y(v);

      objects.push(
        ln(
          [AX0 - 0.06, y, 0],
          [AX0 + 0.06, y, 0],
          C.muted,
          1.2
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
      const color = week >= 7 ? AMBER : C.muted;

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
        [AX0 + 0.30, AY1 + 0.15, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.23, AY0 - 0.63, 0]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [X(7), AY0 - 0.58, 0]
      ),
      txt(
        'New Year',
        11,
        AMBER,
        [X(8), AY0 - 0.58, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function yearSeries(values, color, labels, historical) {
    const objects = [];

    for (let i = 1; i < values.length; i++) {
      objects.push(
        ln(
          pt(i, values[i - 1]),
          pt(i + 1, values[i]),
          color,
          historical ? 1.5 : 2.8
        )
      );
    }

    values.forEach((value, i) => {
      const p = pt(i + 1, value);

      objects.push(
        historical
          ? dot(p, color, 0.068, 0.60)
          : glow(p, color, 0.085)
      );

      if (labels) {
        objects.push(
          txt(
            String(value),
            historical ? 13 : 15,
            color,
            [
              // Week 7 last-year label sits right of its dot,
              // clear of the forecast drop line.
              p[0] + (historical && i === 6 ? 0.25 : 0),
              p[1] + (historical ? -0.22 : 0.24),
              0
            ],
            true
          )
        );
      }
    });

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

  function chartLegend(last = true, forecast = false, actual = false) {
    const items = [['This year', CYAN, false]];

    if (last) items.push(['Last year', PINK, false]);
    if (forecast) items.push(['Forecast', AMBER, true]);
    if (actual) items.push(['Actual', WHITE, false]);

    const objects = [];

    const spacing =
      items.length === 4 ? 1.52 :
      items.length === 3 ? 1.90 : 2.30;

    const y = P ? 1.73 : 1.43;

    items.forEach(([name, color, dashed], i) => {
      const x =
        CX + (i - (items.length - 1) / 2) * spacing;

      const t = T(name, 12, color);

      const width = t.getWidth() + 0.39;
      const left = x - width / 2;

      objects.push(
        dashed
          ? dash(
              [left, y, 0],
              [left + 0.28, y, 0],
              color
            )
          : ln(
              [left, y, 0],
              [left + 0.28, y, 0],
              color,
              2.8
            )
      );

      t.moveTo([
        left + 0.39 + t.getWidth() / 2,
        y,
        0
      ]);

      objects.push(t);
    });

    return new M.VGroup(...objects);
  }

  function hiddenHolidays(weeks = [7, 8]) {
    const objects = [];

    weeks.forEach(week => {
      const top = AY1 - 0.08;
      const bottom = AY0 + 0.09;

      objects.push(
        rounded(
          STEP * 0.77,
          top - bottom,
          [
            X(week),
            (top + bottom) / 2,
            0
          ],
          C.muted,
          0.025
        ),
        tag(
          '?',
          AMBER,
          [X(week), AY0 + 0.43, 0],
          16
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function chart(withLast = true, hidden = [7, 8]) {
    const a = [
      ...clearScene(),
      ...put('axes', axes()),
      ...put('now', nowDivider())
    ];

    if (withLast) {
      a.push(
        ...put(
          'lastYear',
          yearSeries(LAST, PINK, true, true)
        )
      );
    }

    a.push(
      ...put(
        'thisYear',
        yearSeries(KNOWN, CYAN, true, false)
      ),
      ...put(
        'legend',
        chartLegend(withLast)
      )
    );

    if (hidden.length) {
      a.push(
        ...put('hidden', hiddenHolidays(hidden))
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Vertical matching-week gain bars.
  //
  // Each bar begins at last year's count and ends
  // at this year's matching count.
  //
  // These bars measure a difference between years,
  // not a change between consecutive autumn weeks.
  // ------------------------------------------------------------

  function chartGainBar(week) {
    const older = LAST[week - 1];
    const newer = KNOWN[week - 1];

    const gain = newer - older;

    const low = Y(Math.min(older, newer));
    const high = Y(Math.max(older, newer));

    return rect(
      STEP * 0.43,
      Math.max(0.015, high - low),
      [
        X(week),
        (low + high) / 2,
        0
      ],
      gain >= 0 ? GREEN : RED,
      0.87
    );
  }

  function chartGainLabel(week) {
    return tag(
      signed(GAINS[week - 1]),
      GREEN,
      [
        // One row above the highest known dot (29),
        // clear of every dot and line.
        X(week),
        Y(Math.max(...KNOWN)) + 0.62,
        0
      ],
      P ? 15 : 13
    );
  }

  function pairFocus(week) {
    return new M.VGroup(
      ring(
        pt(week, LAST[week - 1]),
        PINK,
        0.145
      ),
      ring(
        pt(week, KNOWN[week - 1]),
        CYAN,
        0.145
      )
    );
  }

  function revealGain(week) {
    return [
      ...put(
        'gainBar' + week,
        chartGainBar(week)
      ),
      ...put(
        'gainLabel' + week,
        chartGainLabel(week)
      )
    ];
  }

  // ------------------------------------------------------------
  // Separate yearly-gain chart.
  //
  // The zero line means this year's count equals
  // last year's matching count.
  //
  // This chart has its own gain scale, distinct from
  // the hotel's occupied-room scale.
  // ------------------------------------------------------------

  const GX0 = CX - 2.73;
  const GX1 = CX + 2.74;

  const GZERO = P ? -2.75 : -1.52;
  const GSCALE = P ? 0.96 : 0.68;

  const GX = week =>
    GX0 + 0.35 +
    (week - 1) / 6 * (GX1 - GX0 - 0.58);

  const GY = gain =>
    GZERO + gain * GSCALE;

  const gp = (week, gain) =>
    [GX(week), GY(gain), 0];

  function gainAxes() {
    const objects = [
      txt(
        'YEARLY GAINS',
        19,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [GX0, GY(-1), 0],
        [GX0, GY(3.5), 0],
        C.muted,
        1.6
      ),
      ln(
        [GX0, GZERO, 0],
        [GX1, GZERO, 0],
        WHITE,
        2.1
      )
    ];

    [-1, 0, 1, 2, 3].forEach(v => {
      objects.push(
        ln(
          [GX0 - 0.06, GY(v), 0],
          [GX0 + 0.06, GY(v), 0],
          C.muted,
          1.2
        ),
        txt(
          signed(v),
          14,
          C.muted,
          [GX0 - 0.29, GY(v), 0],
          true
        )
      );

      if (v !== 0) {
        objects.push(
          dash(
            [GX0 + 0.08, GY(v), 0],
            [GX1, GY(v), 0],
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
          [GX(week), GZERO - 0.27, 0],
          true
        )
      );
    }

    objects.push(
      txt(
        'rooms more or fewer than last year',
        13,
        C.muted,
        [
          CX,
          GY(-1) - 0.37,
          0
        ]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [GX(7), GZERO - 0.59, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function rowGainBar(week, value, color = GREEN, opacity = 0.88) {
    const end = GY(value);

    return rect(
      0.48,
      Math.max(0.015, Math.abs(end - GZERO)),
      [
        GX(week),
        (GZERO + end) / 2,
        0
      ],
      color,
      opacity
    );
  }

  function rowGainLabel(week, value, color = GREEN) {
    return txt(
      signed(value),
      17,
      color,
      [
        GX(week),
        GY(value) + (value >= 0 ? 0.22 : -0.23),
        0
      ],
      true
    );
  }

  function usualGainGuide() {
    return new M.VGroup(
      dash(
        [GX0 + 0.05, GY(USUAL_GAIN), 0],
        [GX1, GY(USUAL_GAIN), 0],
        WHITE
      ),
      tag(
        P ? 'USUAL' : 'USUAL +2',
        WHITE,
        [
          GX(3) + 0.05,
          GY(USUAL_GAIN) + 0.27,
          0
        ],
        P ? 15 : 12
      )
    );
  }

  function gainChart(withGuide = false) {
    const a = [
      ...clearScene(),
      ...put('gainAxes', gainAxes())
    ];

    GAINS.forEach((value, i) => {
      const week = i + 1;

      a.push(
        ...put(
          'gainBar' + week,
          rowGainBar(week, value)
        ),
        ...put(
          'gainLabel' + week,
          rowGainLabel(week, value)
        )
      );
    });

    a.push(
      ...put(
        'nextUnknown',
        tag(
          '?',
          AMBER,
          [
            GX(7),
            GZERO + 0.36,
            0
          ],
          17
        )
      )
    );

    if (withGuide) {
      a.push(
        ...put('usualGain', usualGainGuide())
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Hypothetical negative yearly gain.
  //
  // This is explicitly illustrative, not a new
  // observation from the hotel.
  //
  // Example: one fewer room than last year.
  // Gain = -1.
  // ------------------------------------------------------------

  function negativeGainPicture() {
    const objects = [];

    const y = P ? -0.65 : -0.35;

    const scale = P ? 1.10 : 0.79;

    const x1 = CX - 1.52;
    const x2 = CX + 1.52;

    objects.push(
      txt(
        'A YEARLY GAIN CAN BE NEGATIVE',
        19,
        RED,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [CX - 2.65, y, 0],
        [CX + 2.65, y, 0],
        WHITE,
        2
      ),
      txt(
        '0',
        16,
        WHITE,
        [CX - 2.89, y, 0],
        true
      ),
      rect(
        0.87,
        scale,
        [x1, y + scale / 2, 0],
        GREEN,
        0.88
      ),
      rect(
        0.87,
        scale,
        [x2, y - scale / 2, 0],
        RED,
        0.88
      ),
      txt(
        '+1',
        23,
        GREEN,
        [x1, y + scale + 0.32, 0],
        true
      ),
      txt(
        '−1',
        23,
        RED,
        [x2, y - scale - 0.30, 0],
        true
      ),
      txt(
        'More than last year',
        15,
        GREEN,
        [x1, y - 0.45, 0]
      ),
      txt(
        'Fewer than last year',
        15,
        RED,
        [x2, y + 0.45, 0]
      ),
      tag(
        'ILLUSTRATIVE EXAMPLE',
        C.muted,
        [
          CX,
          P ? -3.55 : -2.57,
          0
        ],
        13
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Calendar distance picture.
  //
  // Seasonal differencing matches a week to the
  // corresponding week 52 weeks earlier.
  //
  // The two rows are a schematic calendar, not a
  // literal display of all 104 weekly observations.
  // ------------------------------------------------------------

  function seasonalCalendar(stage = 0) {
    const objects = [];

    const upper = P ? 0.35 : 0.36;
    const lower = P ? -2.20 : -1.45;

    const xs = Array.from(
      { length: 6 },
      (_, i) => CX + (i - 2.5) * 0.94
    );

    const values = ['1', '2', '3', '…', '51', '52'];

    objects.push(
      txt(
        stage >= 1
          ? 'SEASONAL DIFFERENCING'
          : 'MATCH THE SAME PART OF EACH YEAR',
        18,
        VIOLET,
        [CX, TITLE_Y, 0]
      ),
      txt(
        'This year',
        16,
        CYAN,
        [CX, upper + 0.72, 0]
      ),
      txt(
        'Last year',
        16,
        PINK,
        [CX, lower - 0.71, 0]
      )
    );

    values.forEach((label, i) => {
      objects.push(
        rounded(
          0.76,
          0.73,
          [xs[i], upper, 0],
          CYAN,
          0.055
        ),
        rounded(
          0.76,
          0.73,
          [xs[i], lower, 0],
          PINK,
          0.055
        ),
        txt(
          label,
          17,
          CYAN,
          [xs[i], upper, 0],
          true
        ),
        txt(
          label,
          17,
          PINK,
          [xs[i], lower, 0],
          true
        )
      );
    });

    const k = 1;

    objects.push(
      rounded(
        0.90,
        0.87,
        [xs[k], upper, 0],
        CYAN,
        0
      ),
      rounded(
        0.90,
        0.87,
        [xs[k], lower, 0],
        PINK,
        0
      ),
      arrow(
        [xs[k], upper - 0.45, 0],
        [xs[k], lower + 0.45, 0],
        VIOLET,
        3.6
      ),
      tag(
        '52 WEEKS BACK',
        VIOLET,
        [
          CX + 0.72,
          (upper + lower) / 2,
          0
        ],
        16
      )
    );

    if (stage >= 1) {
      objects.push(
        tag(
          'SUBTRACT MATCHING COUNTS',
          GREEN,
          [
            CX,
            lower - (P ? 1.22 : 1.20),
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Compare regular and seasonal differencing.
  //
  // Regular:
  // Week 6 this year minus week 5 this year = +5.
  //
  // Seasonal:
  // Week 6 this year minus week 6 last year = +3.
  //
  // The same known value, 29, is used in both.
  // ------------------------------------------------------------

  function differencingComparison(seasonalFocus = false) {
    const objects = [];

    const upper = P ? 0.35 : 0.39;
    const lower = P ? -2.05 : -1.57;

    const left = CX - 1.54;
    const right = CX + 1.54;

    objects.push(
      txt(
        'WHICH EARLIER COUNT DO WE SUBTRACT?',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    function pair(y, oldLabel, oldValue, newValue, result, color, active) {
      const bright = active ? color : C.muted;

      objects.push(
        rounded(
          1.55,
          0.99,
          [left, y, 0],
          bright,
          active ? 0.07 : 0.025
        ),
        rounded(
          1.55,
          0.99,
          [right, y, 0],
          bright,
          active ? 0.07 : 0.025
        ),
        txt(
          oldLabel,
          12,
          bright,
          [left, y + 0.29, 0]
        ),
        txt(
          String(oldValue),
          24,
          bright,
          [left, y - 0.13, 0],
          true
        ),
        txt(
          'This year W6',
          12,
          bright,
          [right, y + 0.29, 0]
        ),
        txt(
          String(newValue),
          24,
          bright,
          [right, y - 0.13, 0],
          true
        ),
        arrow(
          [right - 0.83, y, 0],
          [left + 0.83, y, 0],
          bright,
          2.8
        ),
        tag(
          signed(result),
          bright,
          [CX, y - 0.58, 0],
          14
        )
      );
    }

    objects.push(
      txt(
        'Regular: one week back',
        15,
        seasonalFocus ? C.muted : CYAN,
        [CX, upper + 0.76, 0]
      ),
      txt(
        'Seasonal: 52 weeks back',
        15,
        seasonalFocus ? VIOLET : C.muted,
        [CX, lower + 0.77, 0]
      )
    );

    pair(
      upper,
      'This year W5',
      24,
      29,
      5,
      CYAN,
      !seasonalFocus
    );

    pair(
      lower,
      'Last year W6',
      26,
      29,
      3,
      VIOLET,
      seasonalFocus
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Magnified gain adjustment.
  //
  // Usual yearly gain = 2.
  // Latest yearly gain = 3.
  //
  // The midpoint between these is 2.5.
  //
  // One full unit of gain is divided into two equal
  // half-room blocks.
  // ------------------------------------------------------------

  const GL0 = CX - 2.45;
  const GL1 = CX + 2.45;

  const GLY = P ? -1.45 : -0.60;

  const gainLineX = v =>
    GL0 + (v - 1) / 3 * (GL1 - GL0);

  function adjustmentScale(stage = 0) {
    const objects = [];

    const x2 = gainLineX(2);
    const x25 = gainLineX(2.5);
    const x3 = gainLineX(3);

    objects.push(
      txt(
        'PREDICT THE NEXT YEARLY GAIN',
        19,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [GL0, GLY, 0],
        [GL1, GLY, 0],
        C.muted,
        2.7
      )
    );

    for (let j = 0; j <= 6; j++) {
      const v = 1 + j / 2;
      const x = gainLineX(v);

      objects.push(
        ln(
          [x, GLY - 0.07, 0],
          [x, GLY + 0.07, 0],
          C.muted,
          1.4
        ),
        txt(
          fmt(v),
          15,
          C.muted,
          [x, GLY - 0.29, 0],
          true
        )
      );
    }

    objects.push(
      glow([x2, GLY, 0], WHITE, 0.11),
      glow([x3, GLY, 0], GREEN, 0.11),
      tag(
        'USUAL 2',
        WHITE,
        [x2 - 0.20, GLY + 0.78, 0],
        14
      ),
      tag(
        'LATEST 3',
        GREEN,
        [x3 + 0.27, GLY + 0.78, 0],
        14
      ),
      dash(
        [x2, GLY + 0.12, 0],
        [x2, GLY + 0.53, 0],
        WHITE
      ),
      dash(
        [x3, GLY + 0.12, 0],
        [x3, GLY + 0.53, 0],
        GREEN
      ),
      ln(
        [x2, GLY + 0.39, 0],
        [x3, GLY + 0.39, 0],
        VIOLET,
        2.7
      ),
      txt(
        'gap = 1',
        16,
        VIOLET,
        [
          (x2 + x3) / 2,
          GLY + 1.23,
          0
        ]
      )
    );

    if (stage >= 1) {
      const cellWidth = (x3 - x2) / 2;

      objects.push(
        rect(
          cellWidth * 0.94,
          0.32,
          [
            (x2 + x25) / 2,
            GLY - 0.82,
            0
          ],
          GREEN,
          0.94
        ),
        rect(
          cellWidth * 0.94,
          0.32,
          [
            (x25 + x3) / 2,
            GLY - 0.82,
            0
          ],
          GREEN,
          0.15
        ),
        txt(
          '0.5',
          15,
          GREEN,
          [
            (x2 + x25) / 2,
            GLY - 1.14,
            0
          ],
          true
        ),
        txt(
          '0.5',
          15,
          C.muted,
          [
            (x25 + x3) / 2,
            GLY - 1.14,
            0
          ],
          true
        ),
        ring(
          [x25, GLY, 0],
          AMBER,
          0.15
        ),
        arrow(
          [x2, GLY + 0.20, 0],
          [x25, GLY + 0.20, 0],
          GREEN,
          3.4
        )
      );
    }

    if (stage >= 2) {
      objects.push(
        tag(
          'PREDICTED GAIN = 2.5',
          AMBER,
          [
            CX,
            GLY - 1.64,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function gainMarker(value) {
    return glow(
      [gainLineX(value), GLY, 0],
      AMBER,
      0.12
    );
  }

  // ------------------------------------------------------------
  // Predicted gain in the separate gain chart.
  //
  // Show two full green room blocks and one half
  // block in the Christmas column.
  // ------------------------------------------------------------

  function predictedGainStack() {
    const objects = [];

    const x = GX(7);
    const bw = 0.48;

    for (let j = 0; j < 2; j++) {
      objects.push(
        rect(
          bw,
          GSCALE * 0.84,
          [x, GY(j + 0.5), 0],
          GREEN,
          0.89
        )
      );
    }

    objects.push(
      rect(
        bw,
        GSCALE * 0.5 * 0.84,
        [x, GY(2.25), 0],
        AMBER,
        0.96
      ),
      ring(
        gp(7, NEXT_GAIN),
        AMBER,
        0.12
      ),
      txt(
        '+2.5',
        17,
        AMBER,
        [
          x,
          GY(NEXT_GAIN) + 0.26,
          0
        ],
        true
      )
    );

    return new M.VGroup(...objects);
  }

  function latestGainGap() {
    const x = GX(6) + 0.27;

    return new M.VGroup(
      arrow(
        [x, GY(USUAL_GAIN), 0],
        [x, GY(LAST_GAIN), 0],
        VIOLET,
        3
      ),
      txt(
        '+1',
        15,
        VIOLET,
        [
          x + 0.17,
          GY(2.5),
          0
        ],
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Magnified Christmas reconstruction.
  //
  // Start at last Christmas's known 32 rooms.
  //
  // Add:
  //   2 full room blocks;
  //   1 half-room block.
  //
  // This is a numerical forecast, not a physically
  // divided hotel room.
  // ------------------------------------------------------------

  const CB = P ? -3.45 : -2.10;
  const CT = P ? 0.85 : 0.88;

  const CY = rooms =>
    CB + (rooms - 31) / 5 * (CT - CB);

  const STACK_X = CX - 0.42;

  function christmasBlock(start, amount, color) {
    return rect(
      1.0,
      amount * (CY(32) - CY(31)) * 0.85,
      [
        STACK_X,
        CY(start + amount / 2),
        0
      ],
      color,
      0.93
    );
  }

  function christmasAddBack(stage = 0) {
    const objects = [];

    const axisX = CX - 2.13;

    objects.push(
      txt(
        'ADD THE GAIN TO LAST CHRISTMAS',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [axisX, CY(31), 0],
        [axisX, CY(36), 0],
        C.muted,
        1.6
      )
    );

    for (let v = 31; v <= 36; v++) {
      objects.push(
        ln(
          [axisX - 0.06, CY(v), 0],
          [axisX + 0.06, CY(v), 0],
          C.muted,
          1.2
        ),
        txt(
          String(v),
          15,
          C.muted,
          [
            axisX - 0.29,
            CY(v),
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
        [axisX, CY(36) + 0.23, 0]
      ),
      dash(
        [axisX + 0.10, CY(32), 0],
        [CX + 2.57, CY(32), 0],
        PINK
      ),
      glow(
        [STACK_X, CY(32), 0],
        PINK,
        0.11
      ),
      tag(
        'LAST CHRISTMAS 32',
        PINK,
        [
          CX + 1.35,
          CY(32) - 0.36,
          0
        ],
        14
      )
    );

    if (stage >= 1) {
      objects.push(
        christmasBlock(32, 1, GREEN),
        christmasBlock(33, 1, GREEN)
      );
    }

    if (stage >= 2) {
      objects.push(
        christmasBlock(34, 0.5, AMBER),
        arrow(
          [CX + 0.36, CY(32), 0],
          [CX + 0.36, CY(34.5), 0],
          GREEN,
          3.4
        ),
        txt(
          '+2.5 rooms',
          18,
          GREEN,
          [
            CX + 1.40,
            CY(33.25),
            0
          ]
        ),
        dash(
          [axisX + 0.10, CY(34.5), 0],
          [CX + 2.52, CY(34.5), 0],
          AMBER
        ),
        ring(
          [STACK_X, CY(34.5), 0],
          AMBER,
          0.14
        ),
        tag(
          '34.5 ROOMS',
          AMBER,
          [
            CX + 1.23,
            CY(34.5) + 0.34,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Forecast rule picture.
  //
  // First model the yearly gain.
  // Then recover the forecast of the original count.
  //
  // The seasonal difference is a difference between
  // observations 52 weeks apart.
  //
  // No separate seasonal ARIMA order is invented.
  // ------------------------------------------------------------

  function rulePicture(stage = 0) {
    const objects = [];

    const upper = P ? 0.12 : 0.40;
    const lower = P ? -2.18 : -1.45;

    objects.push(
      txt(
        stage >= 1
          ? 'SEASONAL ARIMA'
          : 'PREDICT THE YEARLY GAIN',
        20,
        VIOLET,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        5.45,
        1.34,
        [CX, upper, 0],
        GREEN,
        0.055
      ),
      txt(
        '1. MODEL THE SEASONAL DIFFERENCE',
        14,
        GREEN,
        [CX, upper + 0.41, 0]
      ),
      txt(
        '2 + ½ × (3 − 2)',
        22,
        C.ink,
        [CX - 0.35, upper - 0.15, 0],
        true
      ),
      txt(
        '= 2.5',
        22,
        GREEN,
        [CX + 1.82, upper - 0.15, 0],
        true
      )
    );

    if (stage >= 1) {
      objects.push(
        arrow(
          [CX, upper - 0.70, 0],
          [CX, lower + 0.70, 0],
          VIOLET,
          3
        ),
        rounded(
          5.45,
          1.34,
          [CX, lower, 0],
          AMBER,
          0.055
        ),
        txt(
          '2. ADD TO LAST YEAR’S MATCHING COUNT',
          14,
          AMBER,
          [CX, lower + 0.41, 0]
        ),
        txt(
          '32 + 2.5 = 34.5',
          24,
          AMBER,
          [CX, lower - 0.13, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Holiday forecast on the original hotel chart.
  //
  // Begin at last year's matching Christmas count,
  // not at this year's week-six count.
  //
  // The pink dot at 32 and amber ring at 34.5
  // are separated by a green yearly-gain bar.
  // ------------------------------------------------------------

  function christmasForecastPoint() {
    return new M.VGroup(
      dash(
        pt(6, KNOWN[5]),
        pt(7, FORECAST),
        AMBER
      ),
      dash(
        [X(7), AY0 + 0.04, 0],
        [X(7), Y(FORECAST) - 0.13, 0],
        AMBER
      ),
      ring(
        pt(7, FORECAST),
        AMBER,
        0.145
      ),
      dot(
        pt(7, FORECAST),
        AMBER,
        0.047
      )
    );
  }

  function forecastGainBar(actualShown = false) {
    const low = Y(LAST[6]);
    const high = Y(FORECAST);

    if (actualShown) {
      // Final view: the +2.5 is in the formula card;
      // keep the week-7 column clear.
      return rect(
        STEP * 0.39,
        high - low,
        [X(7), (low + high) / 2, 0],
        GREEN,
        0.78
      );
    }

    return new M.VGroup(
      rect(
        STEP * 0.39,
        high - low,
        [
          X(7),
          (low + high) / 2,
          0
        ],
        GREEN,
        0.78
      ),
      txt(
        '+2.5',
        14,
        GREEN,
        [
          X(7) - 0.43,
          (low + high) / 2,
          0
        ],
        true
      )
    );
  }

  function forecastLabel(actualShown = false) {
    return tag(
      '34.5',
      AMBER,
      [
        X(7) + (actualShown ? 0.52 : 0),
        Y(FORECAST) + (actualShown ? 0 : 0.32),
        0
      ],
      14
    );
  }

  function christmasActual() {
    // Invoke only at or after beat 31.

    const value = DATA[6];

    return new M.VGroup(
      ln(
        pt(6, KNOWN[5]),
        pt(7, value),
        WHITE,
        2.2
      ),
      glow(
        pt(7, value),
        WHITE,
        0.105
      ),
      txt(
        '35',
        17,
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

  function forecastChart(actual = false) {
    const a = [
      ...chart(true, actual ? [] : [8]),
      ...put(
        'forecastGain',
        forecastGainBar(actual)
      ),
      ...put(
        'forecast',
        christmasForecastPoint()
      ),
      ...put(
        'forecastLabel',
        forecastLabel(actual)
      ),
      ...put(
        'legend',
        chartLegend(true, true, actual)
      )
    ];

    if (actual) {
      a.push(
        ...put(
          'actual',
          christmasActual()
        )
      );
    }

    return a;
  }

  // ------------------------------------------------------------
  // Magnify the half-room forecast error.
  //
  // On the original 0–40 chart, 34.5 and 35 sit
  // very close together. Use an explicit local
  // scale to make their separation visible.
  //
  // Local scale: 32 to 36 occupied rooms.
  // ------------------------------------------------------------

  function errorCloseUp() {
    const objects = [];

    const bottom = P ? -3.45 : -2.11;
    const top = P ? 0.80 : 0.85;

    const yy = value =>
      bottom + (value - 32) / 4 * (top - bottom);

    const x = CX - 0.65;
    const axisX = CX - 2.07;

    objects.push(
      txt(
        'CHECK THE CHRISTMAS FORECAST',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [axisX, yy(32), 0],
        [axisX, yy(36), 0],
        C.muted,
        1.7
      )
    );

    for (let j = 0; j <= 8; j++) {
      const value = 32 + j / 2;
      const major = j % 2 === 0;

      objects.push(
        ln(
          [axisX - 0.06, yy(value), 0],
          [axisX + 0.06, yy(value), 0],
          C.muted,
          1.2
        )
      );

      if (major || value === FORECAST) {
        objects.push(
          txt(
            fmt(value),
            14,
            C.muted,
            [
              axisX - 0.32,
              yy(value),
              0
            ],
            true
          )
        );
      }
    }

    objects.push(
      dash(
        [axisX + 0.10, yy(FORECAST), 0],
        [CX + 2.56, yy(FORECAST), 0],
        AMBER
      ),
      dash(
        [axisX + 0.10, yy(DATA[6]), 0],
        [CX + 2.56, yy(DATA[6]), 0],
        WHITE
      ),
      ring(
        [x, yy(FORECAST), 0],
        AMBER,
        0.15
      ),
      glow(
        [x, yy(DATA[6]), 0],
        WHITE,
        0.105
      ),
      txt(
        'Forecast 34.5',
        16,
        AMBER,
        [
          CX + 1.35,
          yy(FORECAST) - 0.29,
          0
        ]
      ),
      txt(
        'Actual 35',
        16,
        WHITE,
        [
          CX + 1.35,
          yy(DATA[6]) + 0.27,
          0
        ]
      )
    );

    const bx = CX + 0.27;

    objects.push(
      ln(
        [bx, yy(FORECAST), 0],
        [bx, yy(DATA[6]), 0],
        RED,
        3.1
      ),
      ln(
        [bx - 0.08, yy(FORECAST), 0],
        [bx + 0.08, yy(FORECAST), 0],
        RED,
        2
      ),
      ln(
        [bx - 0.08, yy(DATA[6]), 0],
        [bx + 0.08, yy(DATA[6]), 0],
        RED,
        2
      ),
      tag(
        '0.5',
        RED,
        [
          bx + 0.50,
          yy(34.75),
          0
        ],
        15
      ),
      tag(
        'HALF A ROOM LOW',
        RED,
        [
          CX,
          P ? -4.04 : -2.60,
          0
        ],
        17
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Seasonal matching and moving-holiday warning.
  //
  // These calendar tiles are schematic.
  //
  // Show how matching a numbered week can fail when
  // the relevant holiday occupies a different week.
  // Do not imply that Christmas itself changes date.
  // ------------------------------------------------------------

  function holidayMatchingPicture(moved = false, corrected = false) {
    const objects = [];

    const xs = [
      CX - 1.90,
      CX,
      CX + 1.90
    ];

    const upper = P ? 0.19 : 0.38;
    const lower = P ? -2.20 : -1.62;

    const topHoliday = moved ? 2 : 1;
    const bottomHoliday = 1;

    const title = moved
      ? 'A HOLIDAY CAN FALL IN A DIFFERENT WEEK'
      : 'MATCH THE SAME POINT IN THE SEASON';

    objects.push(
      txt(
        title,
        17,
        moved && !corrected ? RED : GREEN,
        [CX, TITLE_Y, 0]
      ),
      txt(
        'This year',
        15,
        CYAN,
        [CX - 2.26, upper + 0.82, 0]
      ),
      txt(
        'Last year',
        15,
        PINK,
        [CX - 2.26, lower - 0.82, 0]
      )
    );

    for (let i = 0; i < 3; i++) {
      const x = xs[i];

      const a = i === topHoliday;
      const b = i === bottomHoliday;

      const topColor = a ? AMBER : CYAN;
      const bottomColor = b ? AMBER : PINK;

      objects.push(
        rounded(
          1.56,
          1.08,
          [x, upper, 0],
          topColor,
          a ? 0.14 : 0.035
        ),
        rounded(
          1.56,
          1.08,
          [x, lower, 0],
          bottomColor,
          b ? 0.14 : 0.035
        ),
        txt(
          'Week ' + (i + 6),
          13,
          topColor,
          [x, upper + 0.29, 0]
        ),
        txt(
          'Week ' + (i + 6),
          13,
          bottomColor,
          [x, lower + 0.29, 0]
        ),
        txt(
          a ? 'HOLIDAY' : 'Ordinary',
          14,
          topColor,
          [x, upper - 0.15, 0]
        ),
        txt(
          b ? 'HOLIDAY' : 'Ordinary',
          14,
          bottomColor,
          [x, lower - 0.15, 0]
        )
      );
    }

    const target = corrected
      ? topHoliday
      : bottomHoliday;

    const color =
      moved && !corrected ? RED : GREEN;

    objects.push(
      arrow(
        [xs[bottomHoliday], lower + 0.56, 0],
        [xs[target], upper - 0.56, 0],
        color,
        3.4
      ),
      tag(
        moved
          ? corrected
            ? 'MATCH THE HOLIDAY'
            : 'WRONG MATCH'
          : 'MATCHING SEASON',
        color,
        [
          moved && corrected
            ? CX - 1.10
            : CX + 1.47,
          (upper + lower) / 2,
          0
        ],
        12
      )
    );

    if (moved && !corrected) {
      const my = (upper + lower) / 2;

      objects.push(
        ln(
          [CX - 0.18, my - 0.18, 0],
          [CX + 0.18, my + 0.18, 0],
          RED,
          3.6
        ),
        ln(
          [CX - 0.18, my + 0.18, 0],
          [CX + 0.18, my - 0.18, 0],
          RED,
          3.6
        )
      );
    }

    objects.push(
      txt(
        moved
          ? 'Illustrative moving-holiday calendar'
          : 'Illustrative matching weeks',
        12,
        C.muted,
        [
          CX,
          lower - (P ? 1.18 : 1.05),
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0–4: begin with matching weeks from the two years.
  // ============================================================

  // 0. Last Christmas is a useful starting point.

  await until(S(0));
  await play(
    ...picture(openingPicture(false)),
    ...say('START WITH LAST CHRISTMAS', PINK),
    ...fbox([
      ['last Christmas = 32 rooms', PINK],
      ['this Christmas = ?', AMBER]
    ], PINK)
  );

  // 1. Use the autumn weeks to estimate this year's gain.

  await until(S(1));
  await play(
    ...put('picture', openingPicture(true)),
    ...say('IS THE HOTEL BUSIER THIS YEAR?', GREEN),
    ...fbox([
      'compare matching autumn weeks',
      ['estimate the yearly gain', GREEN]
    ], GREEN)
  );

  // 2. Draw this year's cyan dots through week six.

  await until(S(2));
  await play(
    ...chart(false, []),
    ...say('THIS YEAR: SIX KNOWN COUNTS'),
    ...fbox([
      ['20, 24, 20, 23, 24, 29', CYAN],
      'now: end of week 6'
    ])
  );

  // 3. Align last year's matching pink dots.

  await until(S(3));
  await play(
    ...put(
      'lastYear',
      yearSeries(LAST, PINK, true, true)
    ),
    ...put(
      'legend',
      chartLegend(true)
    ),
    ...say('MATCH LAST YEAR’S WEEKS', PINK),
    ...fbox([
      ['this year: cyan', CYAN],
      ['last year: pink', PINK],
      'same week positions'
    ], VIOLET)
  );

  // 4. Leave this year's holiday observations hidden.

  await until(S(4));
  await play(
    ...put('hidden', hiddenHolidays([7, 8])),
    ...say('KEEP THIS YEAR’S HOLIDAY COUNTS HIDDEN', AMBER),
    ...fbox([
      ['Christmas = ?', AMBER],
      ['New Year = ?', AMBER]
    ], AMBER)
  );

  // ============================================================
  // 5–11: measure all six yearly gains.
  // ============================================================

  // 5. Week one: 20 versus 18.

  await until(S(5));
  await play(
    ...put('focus', pairFocus(1)),
    ...say('WEEK 1: TWO MORE ROOMS', GREEN),
    ...fbox([
      ['this year = 20', CYAN],
      ['last year = 18', PINK],
      ['20 − 18 = +2', GREEN]
    ], GREEN)
  );

  // 6. Draw the upright two-room gain bar.

  await until(S(6));
  await play(
    ...revealGain(1),
    ...say('DRAW A BAR FOR THE TWO EXTRA ROOMS', GREEN),
    ...fbox([
      'bar starts at 18',
      'bar ends at 20',
      ['gain = +2 rooms', GREEN]
    ], GREEN)
  );

  // 7. Week two: 24 − 21 = 3.

  await until(S(7));
  await play(
    ...put('focus', pairFocus(2)),
    ...revealGain(2),
    ...say('WEEK 2: GAIN OF THREE ROOMS', GREEN),
    ...fbox([
      ['24 − 21 = +3', GREEN]
    ], GREEN)
  );

  // 8. Week three: 20 − 19 = 1.

  await until(S(8));
  await play(
    ...put('focus', pairFocus(3)),
    ...revealGain(3),
    ...say('WEEK 3: GAIN OF ONE ROOM', GREEN),
    ...fbox([
      ['20 − 19 = +1', GREEN]
    ], GREEN)
  );

  // 9. Week four: 23 − 21 = 2.

  await until(S(9));
  await play(
    ...put('focus', pairFocus(4)),
    ...revealGain(4),
    ...say('WEEK 4: GAIN OF TWO ROOMS', GREEN),
    ...fbox([
      ['23 − 21 = +2', GREEN]
    ], GREEN)
  );

  // 10. Week five: 24 − 22 = 2.

  await until(S(10));
  await play(
    ...put('focus', pairFocus(5)),
    ...revealGain(5),
    ...say('WEEK 5: ANOTHER TWO-ROOM GAIN', GREEN),
    ...fbox([
      ['24 − 22 = +2', GREEN]
    ], GREEN)
  );

  // 11. Week six: 29 − 26 = 3.

  await until(S(11));
  await play(
    ...put('focus', pairFocus(6)),
    ...revealGain(6),
    ...say('WEEK 6: GAIN OF THREE ROOMS', GREEN),
    ...fbox([
      ['29 − 26 = +3', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 12–16: seasonal differencing.
  // ============================================================

  // 12. Move the six gain bars onto their own zero line.
  //
  // Keep the original bars as independent scene objects.
  // Transform their positions and dimensions into the
  // new gain chart's coordinates.

  await until(S(12));

  const transfer = [];

  for (let week = 1; week <= 6; week++) {
    transfer.push(
      new M.Transform(
        visible['gainBar' + week],
        rowGainBar(week, GAINS[week - 1]),
        {
          pathArc: -0.35,
          runTime: 0.85
        }
      )
    );
  }

  const oldLabels = Array.from(
    { length: 6 },
    (_, i) => 'gainLabel' + (i + 1)
  );

  await play(
    ...remove(
      'axes',
      'thisYear',
      'lastYear',
      'now',
      'legend',
      'hidden',
      'focus',
      ...oldLabels
    ),
    ...put('gainAxes', gainAxes()),
    new M.LaggedStart(
      transfer,
      {
        lagRatio: 0.09,
        runTime: 1.55
      }
    ),
    ...say('MOVE THE GAINS ONTO THEIR OWN AXIS', GREEN),
    ...fbox([
      ['yearly gains', GREEN],
      '+2, +3, +1, +2, +2, +3'
    ], GREEN)
  );

  await until(S(12) + 1.65);

  const rowLabels = [];

  GAINS.forEach((value, i) => {
    rowLabels.push(
      ...put(
        'gainLabel' + (i + 1),
        rowGainLabel(i + 1, value)
      )
    );
  });

  await play(...rowLabels);

  // 13. Define a yearly gain.

  await until(S(13));
  await play(
    ...say('GAIN = THIS YEAR MINUS LAST YEAR', GREEN),
    ...fbox([
      ['yearly gain =', GREEN],
      'this year’s count',
      '− matching count last year'
    ], GREEN)
  );

  // 14. A negative gain points downward.

  await until(S(14));
  await play(
    ...picture(negativeGainPicture()),
    ...say('FEWER ROOMS THAN LAST YEAR: NEGATIVE GAIN', RED),
    ...fbox([
      'below last year’s count',
      ['gain is negative', RED]
    ], RED)
  );

  // 15. The seasonal step back is 52 weeks.

  await until(S(15));
  await play(
    ...picture(seasonalCalendar(0)),
    ...say('STEP BACK 52 WEEKS', VIOLET),
    ...fbox([
      ['season length = 52 weeks', VIOLET],
      'match the corresponding week'
    ], VIOLET)
  );

  // 16. Name seasonal differencing.

  await until(S(16));
  await play(
    ...put('picture', seasonalCalendar(1)),
    ...say('SEASONAL DIFFERENCING', VIOLET),
    ...fbox([
      ['seasonal difference =', VIOLET],
      'count now − count 52 weeks back'
    ], VIOLET)
  );

  // ============================================================
  // 17–18: contrast regular and seasonal differencing.
  // ============================================================

  // 17. Regular differencing steps back one week.

  await until(S(17));
  await play(
    ...picture(differencingComparison(false)),
    ...say('REGULAR DIFFERENCING: ONE WEEK BACK', CYAN),
    ...fbox([
      ['regular change', CYAN],
      '29 − 24 = +5'
    ])
  );

  // 18. This model predicts the yearly gap for next week.

  await until(S(18));
  await play(
    ...put('picture', differencingComparison(true)),
    ...say('NOW PREDICT THE YEARLY GAP', GREEN),
    ...fbox([
      ['seasonal difference', VIOLET],
      '29 − 26 = +3',
      ['predict the next gain', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 19–25: predict the next yearly gain.
  //
  // Usual gain = 2.
  // Latest gain = 3.
  // Half the gap = 0.5.
  // Predicted gain = 2.5.
  // ============================================================

  // 19. Draw the two-room guide across the gains.

  await until(S(19));
  await play(
    ...gainChart(false),
    ...put('usualGain', usualGainGuide()),
    ...say('DRAW A GUIDE AT TWO ROOMS', WHITE),
    ...fbox([
      ['guide = +2 rooms', WHITE]
    ])
  );

  // 20. The model's usual yearly gain is two rooms.
  //
  // Use the supplied model parameter.
  // Do not calculate it as the mean of the six
  // displayed gains.

  await until(S(20));
  await play(
    ...indicate('usualGain', WHITE),
    ...say('USUAL YEARLY GAIN = TWO ROOMS', WHITE),
    ...fbox([
      ['model’s usual gain = 2', WHITE],
      'learned from past records'
    ])
  );

  // 21. The latest gain is three, one above the guide.

  await until(S(21));
  await play(
    ...put(
      'latestFocus',
      rounded(
        0.65,
        GSCALE * 3 + 0.15,
        [
          GX(6),
          GY(1.5),
          0
        ],
        AMBER,
        0
      )
    ),
    ...put('latestGap', latestGainGap()),
    ...say('LATEST GAIN 3: ONE ABOVE USUAL', VIOLET),
    ...fbox([
      ['latest gain = 3', GREEN],
      ['usual gain = 2', WHITE],
      ['gap = 3 − 2 = 1', VIOLET]
    ], VIOLET)
  );

  // 22. Start at two and move halfway toward three.

  await until(S(22));
  await play(
    ...picture(adjustmentScale(0)),
    ...put('marker', gainMarker(2)),
    ...say('START AT TWO AND MOVE HALFWAY', GREEN),
    ...fbox([
      'start at the usual gain',
      ['move toward the latest gain', GREEN]
    ], GREEN)
  );

  await until(S(22) + 1.45);

  await play(
    ...put('picture', adjustmentScale(1)),
    new M.Transform(
      visible.marker,
      gainMarker(2.5),
      { runTime: 0.90 }
    )
  );

  // 23. Half of the one-room gap is half a room.

  await until(S(23));
  await play(
    ...indicate('marker', AMBER),
    ...say('HALF OF ONE ROOM = 0.5', GREEN),
    ...fbox([
      '3 − 2 = 1',
      ['½ × 1 = 0.5', GREEN]
    ], GREEN)
  );

  // 24. Add this adjustment to the usual gain.

  await until(S(24));
  await play(
    ...put('picture', adjustmentScale(2)),
    ...say('ADD HALF A ROOM TO THE USUAL TWO', GREEN),
    ...fbox([
      ['usual gain = 2', WHITE],
      ['adjustment = 0.5', GREEN],
      ['2 + 0.5 = 2.5', AMBER]
    ], AMBER)
  );

  // 25. Christmas's predicted yearly gain is 2.5.

  await until(S(25));
  await play(
    ...gainChart(true),
    ...remove('nextUnknown'),
    ...put(
      'predictedGain',
      predictedGainStack()
    ),
    ...say('CHRISTMAS: EXPECT 2.5 MORE ROOMS THAN LAST YEAR', AMBER),
    ...fbox([
      ['predicted gain = +2.5', AMBER],
      'compared with last Christmas'
    ], AMBER)
  );

  // ============================================================
  // 26–27: recover the Christmas room-count forecast.
  //
  // Last Christmas = 32.
  // Predicted yearly gain = 2.5.
  // This Christmas forecast = 34.5.
  // ============================================================

  // 26. Return to last year's Christmas dot at 32.

  await until(S(26));
  await play(
    ...chart(true, [7, 8]),
    ...put(
      'lastChristmasFocus',
      new M.VGroup(
        ring(
          pt(7, LAST[6]),
          PINK,
          0.18
        ),
        tag(
          '32 LAST YEAR',
          PINK,
          [
            X(7) - 0.57,
            Y(LAST[6]) - 0.58,
            0
          ],
          13
        )
      )
    ),
    ...say('LAST CHRISTMAS: 32 ROOMS', PINK),
    ...fbox([
      ['matching count = 32', PINK],
      ['predicted gain = +2.5', GREEN]
    ], PINK)
  );

  // 27. Add the two-and-a-half-room gain.
  //
  // First show the blocks on a magnified local scale,
  // then place the forecast on the original chart.

  await until(S(27));
  await play(
    ...picture(christmasAddBack(1)),
    ...say('ADD THE EXPECTED GAIN TO 32', GREEN),
    ...fbox([
      '32 + 2.5',
      ['= 34.5 rooms', AMBER]
    ], AMBER)
  );

  await until(S(27) + 0.85);

  await play(
    ...put(
      'picture',
      christmasAddBack(2)
    )
  );

  await until(S(27) + 2.05);

  await play(
    ...forecastChart(false),
    ...say('CHRISTMAS FORECAST = 34.5 ROOMS', AMBER)
  );

  // ============================================================
  // 28–30: state the two rules and name the method.
  // ============================================================

  // 28. Next gain equals usual gain plus half the
  // gap between the latest gain and the usual gain.

  await until(S(28));
  await play(
    ...picture(rulePicture(0)),
    ...say('NEXT GAIN = USUAL GAIN + HALF THE GAP', GREEN),
    ...fbox([
      ['next gain = usual gain', GREEN],
      '+ ½ × (last gain − usual gain)'
    ], GREEN)
  );

  await until(S(28) + 3.10);

  await play(
    ...fbox([
      '2 + ½ × (3 − 2)',
      ['= 2 + 0.5 = 2.5', GREEN]
    ], GREEN)
  );

  // 29. Seasonal ARIMA uses differences a season apart.

  await until(S(29));
  await play(
    ...picture(seasonalCalendar(1)),
    ...say('SEASONAL ARIMA: DIFFERENCE ONE SEASON APART', VIOLET),
    ...fbox([
      ['SEASONAL ARIMA', VIOLET],
      'model differences',
      '52 weeks apart'
    ], VIOLET)
  );

  // 30. Recover the room forecast by adding the
  // predicted gain to last year's matching count.

  await until(S(30));
  await play(
    ...picture(rulePicture(1)),
    ...say('LAST YEAR’S MATCHING COUNT + PREDICTED GAIN', AMBER),
    ...fbox([
      ['room forecast =', AMBER],
      'last year’s matching count',
      '+ predicted yearly gain'
    ], AMBER)
  );

  await until(S(30) + 2.55);

  await play(
    ...forecastChart(false),
    ...fbox([
      ['32 + 2.5 = 34.5', AMBER],
      'forecast made at week 6'
    ], AMBER)
  );

  // ============================================================
  // 31–32: reveal and check the Christmas observation.
  // ============================================================

  // 31. First reveal of the real Christmas count: 35.

  await until(S(31));
  await play(
    ...put(
      'actual',
      christmasActual()
    ),
    ...put(
      'forecastLabel',
      forecastLabel(true)
    ),
    ...put(
      'legend',
      chartLegend(true, true, true)
    ),
    ...say('CHRISTMAS ACTUAL: 35 ROOMS', WHITE),
    ...fbox([
      ['forecast = 34.5', AMBER],
      ['actual = 35', WHITE]
    ])
  );

  // 32. The forecast is half a room too low.
  //
  // Magnify the difference because 0.5 is small
  // on the original 0–40 room-count scale.

  await until(S(32));
  await play(
    ...picture(errorCloseUp()),
    ...say('35 − 34.5 = 0.5 ROOM LOW', RED),
    ...fbox([
      'error = real − forecast',
      ['35 − 34.5 = 0.5', RED]
    ], RED)
  );

  // ============================================================
  // 33–35: when to use the model, its trap, and recap.
  // ============================================================

  // 33. Use seasonal ARIMA when matching points in
  // consecutive seasons provide useful comparisons.

  await until(S(33));
  await play(
    ...picture(holidayMatchingPicture(false)),
    ...say('USE WHEN MATCHING SEASONS GIVE A USEFUL GUIDE', GREEN),
    ...fbox([
      ['USE SEASONAL ARIMA', GREEN],
      'when matching seasonal counts',
      'help predict the next count'
    ], GREEN)
  );

  // 34. Trap: a moving holiday may fall in a different
  // numbered week this year.
  //
  // A simple calendar-date match can then compare
  // a holiday week with an ordinary week.

  await until(S(34));
  await play(
    ...put(
      'picture',
      holidayMatchingPicture(true, false)
    ),
    ...say('TRAP: THE HOLIDAY MAY MOVE TO ANOTHER WEEK', RED),
    ...fbox([
      ['same numbered week', RED],
      'may not mean the same holiday',
      'check the seasonal alignment'
    ], RED)
  );

  await until(S(34) + 2.05);

  await play(
    ...put(
      'picture',
      holidayMatchingPicture(true, true)
    ),
    ...say('MATCH THE RELEVANT SEASONAL EVENT', GREEN)
  );

  // 35. Final recap.
  //
  // Seasonal ARIMA predicts the difference from the
  // matching week last year, then adds that difference
  // back to the matching historical count.
  //
  // The original Christmas forecast is 34.5.
  // The actual is 35, so the error is 0.5.
  //
  // New Year's actual has not been revealed.

  await until(S(35));
  await play(
    ...picture(rulePicture(1)),
    ...say('PREDICT THE YEARLY GAP, THEN ADD IT BACK', GREEN),
    ...fbox([
      ['predicted gain = 2.5', GREEN],
      ['last Christmas = 32', PINK],
      ['forecast = 34.5', AMBER]
    ], GREEN)
  );

  await until(S(35) + 2.35);

  await play(
    ...forecastChart(true),
    ...say('SEASONAL ARIMA: 34.5 ROOMS FOR CHRISTMAS', AMBER),
    ...fbox([
      ['32 + 2.5 = 34.5', AMBER],
      ['actual = 35', WHITE],
      ['error = 0.5 room', GREEN]
    ], GREEN)
  );

  await until(E(35));
}
