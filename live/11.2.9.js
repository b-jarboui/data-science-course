// lesson 11.2.9
// Partial autocorrelation: measure the link left after allowing for intervening weeks.
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
  // Long-run usual count = 22 rooms.
  //
  // The hotel's fitted AR(2) model:
  //
  // forecast =
  //   22
  //   + 1/2 × (last week - 22)
  //   + 1/4 × (two weeks ago - 22).
  //
  // The model-implied autocorrelations are:
  //
  // Lag 1: 2/3  = 0.666666...
  // Lag 2: 7/12 = 0.583333...
  // Lag 3: 11/24 = 0.458333...
  //
  // The portion of the lag-2 correlation explained
  // through the intervening week:
  //
  // (2/3) × (2/3) = 4/9.
  //
  // Remaining standardized covariance:
  //
  // 7/12 - 4/9 = 5/36.
  //
  // Residual variance, as a share of original variance:
  //
  // 1 - 4/9 = 5/9.
  //
  // Partial autocorrelation at lag 2:
  //
  // (5/36) / (5/9) = 1/4 = 0.25.
  //
  // Partial autocorrelation at lag 3 = 0.
  //
  // The correlations are properties of the fitted model.
  // They are not estimates calculated using only the six
  // displayed hotel observations.
  //
  // No Christmas or New Year actuals are revealed.
  // ------------------------------------------------------------

  const DATA = [20, 24, 20, 23, 24, 29, 35, 33];

  const USUAL = 22;
  const PHI1 = 0.5;
  const PHI2 = 0.25;

  const RHO1 = PHI1 / (1 - PHI2);
  const RHO2 = PHI1 * RHO1 + PHI2;
  const RHO3 = PHI1 * RHO2 + PHI2 * RHO1;

  const PRODUCT = RHO1 * RHO1;
  const LEFTOVER = RHO2 - PRODUCT;
  const VARIANCE_LEFT = 1 - PRODUCT;

  const PACF2 = LEFTOVER / VARIANCE_LEFT;
  const PACF3 = 0;

  // ------------------------------------------------------------
  // Colours.
  //
  // Cyan: original observations and full correlations.
  // Violet: links involving intervening weeks.
  // Pink: portion explained through the middle week.
  // Green: remaining gaps and partial correlations.
  // Amber: the link being investigated.
  // Red: warnings and negative correlations.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const GREEN = C.green;
  const VIOLET = C.violet;
  const PINK = C.pink || '#F28BB9';
  const RED = C.red || '#FF526F';
  const WHITE = '#F0F4FA';

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 × 14.22.
  // Content: y = -5.5 to 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content: y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.60, 0]
    : [4.30, -0.30, 0];

  const TITLE_Y = P ? 1.45 : 1.35;
  const CARD_Y = P ? -1.10 : -0.75;
  const BOTTOM = P ? -4.25 : -2.15;

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

  function ring(p, color, radius = 0.15) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.2
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
    opacity = 0.83
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
    opacity = 0.04
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

  function tag(s, color, p, size = 15) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function arrow(a, b, color, width = 2.7) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.001) {
      return dot(b, color, 0.04);
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

  function fmt(v, digits = 2) {
    return v.toFixed(digits);
  }

  function signed(v, digits = 2) {
    const n = Math.abs(v).toFixed(digits);

    if (v > 1e-8) return '+' + n;
    if (v < -1e-8) return '−' + n;

    return '0';
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
  // Groups are assembled before display.
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

    for (const key of keys) {
      if (!visible[key]) continue;

      a.push(outA(visible[key]));
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
  // Lines may be strings or [string, colour] pairs.
  // Leading spaces indent continuation lines.
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

    const g = new M.VGroup(r, ...texts);

    const maxw = P
      ? FW - 1.20
      : 4.05;

    const maxh = P
      ? 1.30
      : 4.30;

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

  // ------------------------------------------------------------
  // Opening hotel chart.
  //
  // Use the known room counts through week six.
  // Week seven and week eight have no actual dots.
  // ------------------------------------------------------------

  const AX0 = CX - 3.05;
  const AX1 = CX + 3.12;

  const AY0 = P ? -4.10 : -2.08;
  const AY1 = P ? 1.10 : 1.00;

  const X = week =>
    AX0 + 0.35 +
    (week - 1) / 7 * (
      AX1 - AX0 - 0.65
    );

  const Y = value =>
    AY0 + value / 40 * (AY1 - AY0);

  const pt = (week, value) =>
    [X(week), Y(value), 0];

  function hotelChart(stage = 0) {
    const objects = [
      ln(
        [AX0, AY0, 0],
        [AX1, AY0, 0],
        C.muted,
        2.3
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
          13,
          C.muted,
          [AX0 - 0.27, Y(v), 0],
          true
        )
      );
    });

    for (let w = 1; w <= 8; w++) {
      objects.push(
        txt(
          String(w),
          15,
          w >= 7 ? AMBER : C.muted,
          [X(w), AY0 - 0.25, 0],
          true
        )
      );
    }

    for (let w = 2; w <= 6; w++) {
      objects.push(
        ln(
          pt(w - 1, DATA[w - 2]),
          pt(w, DATA[w - 1]),
          CYAN,
          3
        )
      );
    }

    for (let w = 1; w <= 6; w++) {
      objects.push(
        glow(
          pt(w, DATA[w - 1]),
          CYAN,
          0.085
        ),
        txt(
          String(DATA[w - 1]),
          15,
          CYAN,
          [
            X(w),
            Y(DATA[w - 1]) + 0.23,
            0
          ],
          true
        )
      );
    }

    const nowX = (X(6) + X(7)) / 2;

    objects.push(
      dash(
        [nowX, AY0 + 0.05, 0],
        [nowX, AY1 - 0.05, 0],
        C.muted
      ),
      txt(
        'NOW',
        12,
        C.muted,
        [nowX, AY1 + 0.17, 0]
      ),
      txt(
        'rooms',
        13,
        C.muted,
        [AX0 + 0.30, AY1 + 0.17, 0]
      ),
      txt(
        'week',
        13,
        C.muted,
        [AX0 + 0.30, AY0 - 0.62, 0]
      ),
      txt(
        'Christmas',
        11,
        AMBER,
        [X(7), AY0 - 0.62, 0]
      ),
      txt(
        'New Year',
        11,
        AMBER,
        [X(8), AY0 - 0.62, 0]
      ),
      tag(
        '?',
        AMBER,
        [X(7), Y(25), 0],
        18
      ),
      tag(
        '?',
        AMBER,
        [X(8), Y(25), 0],
        18
      )
    );

    if (stage >= 1) {
      objects.push(
        ring(
          pt(6, DATA[5]),
          VIOLET,
          0.19
        ),
        ring(
          pt(5, DATA[4]),
          GREEN,
          0.19
        ),
        arrow(
          [X(7), AY0 + 0.65, 0],
          [X(6), AY0 + 0.65, 0],
          VIOLET
        ),
        arrow(
          [X(7), AY0 + 0.22, 0],
          [X(5), AY0 + 0.22, 0],
          GREEN
        ),
        txt(
          '1',
          14,
          VIOLET,
          [
            (X(7) + X(6)) / 2,
            AY0 + 0.87,
            0
          ],
          true
        ),
        txt(
          '2',
          14,
          GREEN,
          [
            (X(7) + X(5)) / 2,
            AY0 + 0.43,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Three room-count cards.
  //
  // Use observed weeks 4, 5 and 6 as an example.
  //
  // Week 4 = 23 rooms.
  // Week 5 = 24 rooms.
  // Week 6 = 29 rooms.
  //
  // The picture is a diagram of which variables to
  // compare. The line labels are model correlations,
  // not correlations calculated from these three values.
  // ------------------------------------------------------------

  const CARD_W = 1.55;
  const CARD_H = 1.70;

  const CARD_X = [
    CX - 2.10,
    CX,
    CX + 2.10
  ];

  function countCard(
    x,
    y,
    title,
    value,
    color = CYAN,
    subtitle = ''
  ) {
    return new M.VGroup(
      rounded(
        CARD_W,
        CARD_H,
        [x, y, 0],
        color,
        0.06
      ),
      txt(
        title,
        14,
        color,
        [x, y + 0.56, 0]
      ),
      txt(
        String(value),
        29,
        color,
        [x, y + 0.02, 0],
        true
      ),
      txt(
        subtitle || 'rooms',
        13,
        C.muted,
        [x, y - 0.55, 0]
      )
    );
  }

  function threeCards() {
    const labels = [
      'WEEK 4',
      'WEEK 5',
      'WEEK 6'
    ];

    const subs = [
      'two back',
      'one back',
      'this week'
    ];

    const objects = CARD_X.map((x, i) =>
      countCard(
        x,
        CARD_Y,
        labels[i],
        DATA[i + 3],
        CYAN,
        subs[i]
      )
    );

    objects.push(
      txt(
        'One example of three consecutive weeks',
        P ? 16 : 14,
        C.muted,
        [
          CX,
          CARD_Y - 1.26,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  function neighborLinks(
    labels = false,
    strong = false
  ) {
    const objects = [];

    for (let i = 0; i < 2; i++) {
      const a = [
        CARD_X[i] + CARD_W / 2,
        CARD_Y,
        0
      ];

      const b = [
        CARD_X[i + 1] - CARD_W / 2,
        CARD_Y,
        0
      ];

      objects.push(
        ln(
          a,
          b,
          VIOLET,
          strong ? 4.5 : 3
        )
      );

      if (labels) {
        objects.push(
          tag(
            '2/3',
            VIOLET,
            [
              (a[0] + b[0]) / 2,
              CARD_Y + 0.42,
              0
            ],
            13
          )
        );
      }
    }

    return new M.VGroup(...objects);
  }

  function outsideLink(
    label = '?',
    color = AMBER,
    dashed = false
  ) {
    const left = CARD_X[0];
    const right = CARD_X[2];

    const cardTop = CARD_Y + CARD_H / 2;
    const routeY = cardTop + 0.65;

    const make = dashed
      ? (a, b) => dash(a, b, color)
      : (a, b) => ln(a, b, color, 3);

    return new M.VGroup(
      make(
        [left, cardTop, 0],
        [left, routeY, 0]
      ),
      make(
        [left, routeY, 0],
        [right, routeY, 0]
      ),
      make(
        [right, routeY, 0],
        [right, cardTop, 0]
      ),
      tag(
        label,
        color,
        [CX, routeY + 0.28, 0],
        14
      )
    );
  }

  function middleOutline() {
    return rounded(
      CARD_W + 0.20,
      CARD_H + 0.20,
      [CARD_X[1], CARD_Y, 0],
      VIOLET,
      0
    );
  }

  function throughMiddle() {
    const y = CARD_Y - 1.80;

    return new M.VGroup(
      arrow(
        [CARD_X[0], y, 0],
        [CARD_X[1] - 0.12, y, 0],
        PINK,
        3.6
      ),
      arrow(
        [CARD_X[1] + 0.12, y, 0],
        [CARD_X[2], y, 0],
        PINK,
        3.6
      ),
      glow(
        [CARD_X[1], y, 0],
        PINK,
        0.09
      ),
      txt(
        'Possibly linked through the middle',
        14,
        PINK,
        [CX, y - 0.30, 0]
      )
    );
  }

  function cardDiagram(
    neighbors = true,
    outside = true,
    numbers = false,
    middle = false
  ) {
    const objects = [threeCards()];

    if (neighbors) {
      objects.push(
        neighborLinks(numbers, middle)
      );
    }

    if (outside) {
      objects.push(
        outsideLink(
          numbers ? 'FULL LINK ≈ 0.58' : '?',
          AMBER,
          middle
        )
      );
    }

    if (middle) {
      objects.push(
        middleOutline()
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Repeated sets of three consecutive weeks.
  //
  // These are genuine examples from the visible chapter data.
  // An ellipsis represents the remaining historical record.
  //
  // The supplied model correlations describe many weeks.
  // They are not computed from this small display.
  // ------------------------------------------------------------

  function tripletRows(showGaps = false) {
    const objects = [];

    const rows = [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 6]
    ];

    const colXs = [
      CX - 2.15,
      CX,
      CX + 2.15
    ];

    const top = P ? 0.85 : 0.90;
    const dy = P ? 0.87 : 0.65;

    objects.push(
      txt(
        showGaps
          ? 'COMPARE PAIRS OF LEFTOVER GAPS'
          : 'REPEAT THE COMPARISON ACROSS MANY WEEKS',
        P ? 17 : 16,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    const heads = showGaps
      ? ['Earlier gap', 'Allow for', 'Later gap']
      : ['Two back', 'Middle', 'This week'];

    colXs.forEach((x, i) => {
      objects.push(
        txt(
          heads[i],
          14,
          showGaps && i !== 1
            ? GREEN
            : i === 1
              ? VIOLET
              : CYAN,
          [x, top, 0]
        )
      );
    });

    rows.forEach((weeks, r) => {
      const y = top - (r + 1) * dy;

      const values = weeks.map(
        w => DATA[w - 1]
      );

      // A standardized stationary AR model has the same
      // lag-one regression slope in both directions.
      //
      // With mean 22 and correlation 2/3:
      //
      // outside prediction =
      // 22 + (2/3) × (middle count - 22).
      //
      // These numeric gap examples use that model rule.

      const predicted =
        USUAL + RHO1 * (
          values[1] - USUAL
        );

      const leftGap =
        values[0] - predicted;

      const rightGap =
        values[2] - predicted;

      let cells;

      if (showGaps) {
        cells = [
          signed(leftGap),
          String(values[1]),
          signed(rightGap)
        ];
      } else {
        cells = values.map(String);
      }

      cells.forEach((s, i) => {
        const color =
          showGaps && i !== 1
            ? GREEN
            : i === 1
              ? VIOLET
              : CYAN;

        objects.push(
          rounded(
            1.58,
            dy * 0.78,
            [colXs[i], y, 0],
            color,
            0.045
          ),
          txt(
            s,
            18,
            color,
            [colXs[i], y, 0],
            true
          )
        );
      });
    });

    const finalY = top - 5 * dy;

    objects.push(
      txt(
        '⋮                  ⋮                  ⋮',
        20,
        C.muted,
        [CX, finalY + 0.17, 0]
      ),
      txt(
        'Examples shown; model uses the wider record',
        P ? 15 : 12,
        C.muted,
        [CX, finalY - 0.25, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Correlation picture.
  //
  // Schematic point clouds illustrate positive,
  // negative and near-zero straight-line relationships.
  //
  // These points are not measured hotel observations.
  // ------------------------------------------------------------

  const CLOUDS = {
    positive: [
      [-0.85, -0.71],
      [-0.70, -0.43],
      [-0.45, -0.56],
      [-0.30, -0.12],
      [-0.08, 0.11],
      [0.05, -0.18],
      [0.28, 0.24],
      [0.48, 0.16],
      [0.68, 0.72],
      [0.84, 0.61]
    ],

    negative: [
      [-0.85, 0.71],
      [-0.70, 0.43],
      [-0.45, 0.56],
      [-0.30, 0.12],
      [-0.08, -0.11],
      [0.05, 0.18],
      [0.28, -0.24],
      [0.48, -0.16],
      [0.68, -0.72],
      [0.84, -0.61]
    ],

    zero: [
      [-0.83, 0.50],
      [-0.72, -0.43],
      [-0.42, 0.04],
      [-0.22, 0.72],
      [-0.15, -0.67],
      [0.15, 0.63],
      [0.22, -0.72],
      [0.42, -0.04],
      [0.72, 0.43],
      [0.83, -0.50]
    ]
  };

  function scatter(
    centerX,
    centerY,
    mode,
    size,
    color
  ) {
    const h = size / 2;
    const objects = [
      rounded(
        size + 0.10,
        size + 0.10,
        [centerX, centerY, 0],
        color,
        0.02
      ),
      ln(
        [centerX - h, centerY, 0],
        [centerX + h, centerY, 0],
        C.muted,
        1
      ),
      ln(
        [centerX, centerY - h, 0],
        [centerX, centerY + h, 0],
        C.muted,
        1
      )
    ];

    CLOUDS[mode].forEach(([u, v]) => {
      objects.push(
        glow(
          [
            centerX + u * h * 0.90,
            centerY + v * h * 0.90,
            0
          ],
          color,
          size > 3 ? 0.09 : 0.055,
          0.12
        )
      );
    });

    return new M.VGroup(...objects);
  }

  function positiveCorrelationPicture() {
    const y = P ? -1.10 : -0.58;
    const size = P ? 3.55 : 2.65;

    return new M.VGroup(
      txt(
        'BUSY WEEKS TEND TO GO WITH BUSY WEEKS',
        17,
        CYAN,
        [CX, TITLE_Y, 0]
      ),
      scatter(
        CX,
        y,
        'positive',
        size,
        CYAN
      ),
      txt(
        'Earlier count: low → high',
        14,
        C.muted,
        [
          CX,
          y - size / 2 - 0.38,
          0
        ]
      ),
      txt(
        'High',
        13,
        CYAN,
        [
          CX - size / 2 - 0.42,
          y + size / 2 - 0.12,
          0
        ]
      ),
      txt(
        'Low',
        13,
        C.muted,
        [
          CX - size / 2 - 0.42,
          y - size / 2 + 0.10,
          0
        ]
      ),
      txt(
        'Later count',
        13,
        C.muted,
        [
          CX - size / 2 - 0.64,
          y,
          0
        ]
      ),
      txt(
        'Schematic illustration',
        12,
        C.muted,
        [
          CX,
          y - size / 2 - 0.76,
          0
        ]
      )
    );
  }

  // ------------------------------------------------------------
  // Correlation scale from -1 to +1.
  //
  // The small point clouds explain the direction
  // and strength of a straight-line relationship.
  // ------------------------------------------------------------

  const SCALE_LEFT = CX - 2.65;
  const SCALE_RIGHT = CX + 2.65;

  const SCALE_Y = P ? -2.58 : -1.58;

  const corrX = v =>
    SCALE_LEFT +
    (v + 1) / 2 *
    (SCALE_RIGHT - SCALE_LEFT);

  function correlationScale(stage = 0) {
    const objects = [];

    const sy = P ? -0.70 : -0.25;
    const size = P ? 1.65 : 1.48;

    objects.push(
      txt(
        stage >= 1
          ? 'CORRELATION'
          : 'HOW CLOSELY DO COUNTS GO TOGETHER?',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    const positions = [
      CX - 1.92,
      CX,
      CX + 1.92
    ];

    const modes = [
      'negative',
      'zero',
      'positive'
    ];

    const colors = [
      RED,
      stage >= 2 ? GREEN : C.muted,
      CYAN
    ];

    positions.forEach((x, i) => {
      objects.push(
        scatter(
          x,
          sy,
          modes[i],
          size,
          colors[i]
        ),
        txt(
          [
            'Opposite',
            'Little linear link',
            'Together'
          ][i],
          i === 1 ? 12 : 14,
          colors[i],
          [
            x,
            sy + size / 2 + 0.34,
            0
          ]
        )
      );
    });

    objects.push(
      ln(
        [SCALE_LEFT, SCALE_Y, 0],
        [SCALE_RIGHT, SCALE_Y, 0],
        C.muted,
        3
      )
    );

    [-1, -0.5, 0, 0.5, 1].forEach(v => {
      objects.push(
        ln(
          [corrX(v), SCALE_Y - 0.08, 0],
          [corrX(v), SCALE_Y + 0.08, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v).replace('-', '−'),
          15,
          v === 0 && stage >= 2
            ? GREEN
            : C.muted,
          [
            corrX(v),
            SCALE_Y - 0.28,
            0
          ],
          true
        )
      );
    });

    if (stage >= 2) {
      objects.push(
        glow(
          [corrX(0), SCALE_Y, 0],
          GREEN,
          0.11
        ),
        ring(
          [positions[1], sy, 0],
          GREEN,
          size * 0.58
        ),
        tag(
          'NEAR ZERO',
          GREEN,
          [
            CX,
            SCALE_Y - 0.66,
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Autocorrelation lag picture.
  //
  // Use actual weeks 3, 4, 5 and 6.
  // This week is week six.
  //
  // The arrows show distance in time, not causation.
  // ------------------------------------------------------------

  function lagCards(stage = 0) {
    const objects = [];

    const weeks = [3, 4, 5, 6];

    const xs = weeks.map(
      (_, i) => CX + (i - 1.5) * 1.40
    );

    const y = P ? -0.40 : -0.13;

    objects.push(
      txt(
        'COMPARE THE HOTEL WITH ITS OWN PAST',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    weeks.forEach((w, i) => {
      objects.push(
        rounded(
          1.18,
          1.34,
          [xs[i], y, 0],
          CYAN,
          0.06
        ),
        txt(
          `W${w}`,
          15,
          CYAN,
          [xs[i], y + 0.40, 0]
        ),
        txt(
          String(DATA[w - 1]),
          24,
          CYAN,
          [xs[i], y - 0.05, 0],
          true
        )
      );
    });

    objects.push(
      tag(
        'THIS WEEK',
        WHITE,
        [xs[3], y + 1.03, 0],
        12
      )
    );

    if (stage >= 1) {
      [1, 2, 3].forEach(k => {
        const yy =
          y - 0.94 -
          (k - 1) * (P ? 0.56 : 0.45);

        objects.push(
          arrow(
            [xs[3], yy, 0],
            [xs[3 - k], yy, 0],
            VIOLET,
            2.8
          ),
          txt(
            `lag ${k}`,
            14,
            VIOLET,
            [
              (xs[3] + xs[3 - k]) / 2,
              yy + 0.19,
              0
            ]
          )
        );
      });
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // ACF and PACF stem plots.
  //
  // Vertical axis is correlation, from -1 to +1.
  //
  // ACF values:
  // lag 1 = 0.67
  // lag 2 = 0.58
  // lag 3 = 0.46
  //
  // PACF values:
  // lag 1 = 0.67
  // lag 2 = 0.25
  // lag 3 = 0
  //
  // All heights use the exact model-implied values.
  // Display labels are rounded to two decimal places.
  // ------------------------------------------------------------

  const ACF_VALUES = [RHO1, RHO2, RHO3];
  const PACF_VALUES = [RHO1, PACF2, PACF3];

  const AL = CX - 2.64;
  const AR = CX + 2.64;

  const AB = P ? -3.90 : -2.12;
  const AT = P ? 0.95 : 0.95;

  const acfY = v =>
    AB + (v + 1) / 2 * (AT - AB);

  const acfX = k =>
    AL + k / 4 * (AR - AL);

  function correlationAxes(title = 'AUTOCORRELATION') {
    const objects = [
      txt(
        title,
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      ln(
        [AL, AB, 0],
        [AL, AT, 0],
        C.muted,
        1.8
      ),
      ln(
        [AL, acfY(0), 0],
        [AR, acfY(0), 0],
        C.muted,
        2.2
      )
    ];

    [-1, -0.5, 0, 0.5, 1].forEach(v => {
      objects.push(
        ln(
          [AL - 0.06, acfY(v), 0],
          [AL + 0.06, acfY(v), 0],
          C.muted,
          1.3
        ),
        txt(
          String(v).replace('-', '−'),
          14,
          C.muted,
          [AL - 0.32, acfY(v), 0],
          true
        )
      );

      if (v !== 0) {
        objects.push(
          dash(
            [AL + 0.09, acfY(v), 0],
            [AR, acfY(v), 0],
            C.muted
          )
        );
      }
    });

    [1, 2, 3].forEach(k => {
      objects.push(
        txt(
          String(k),
          16,
          C.muted,
          [acfX(k), AB - 0.25, 0],
          true
        )
      );
    });

    objects.push(
      txt(
        'lag (weeks back)',
        15,
        C.muted,
        [CX, AB - 0.64, 0]
      )
    );

    return new M.VGroup(...objects);
  }

  function correlationStem(
    k,
    value,
    color = CYAN,
    offset = 0,
    label = null
  ) {
    const x = acfX(k) + offset;
    const y0 = acfY(0);
    const y1 = acfY(value);

    const objects = [];

    if (Math.abs(value) > 1e-9) {
      objects.push(
        rect(
          0.34,
          Math.abs(y1 - y0),
          [x, (y0 + y1) / 2, 0],
          color,
          0.87
        )
      );
    }

    objects.push(
      glow(
        [x, y1, 0],
        color,
        0.075
      ),
      txt(
        label === null ? fmt(value) : label,
        16,
        color,
        [
          x,
          y1 + (value >= 0 ? 0.24 : -0.24),
          0
        ],
        true
      )
    );

    return new M.VGroup(...objects);
  }

  function acfPicture(n = 3) {
    const objects = [
      correlationAxes('AUTOCORRELATION')
    ];

    for (let k = 1; k <= n; k++) {
      objects.push(
        correlationStem(
          k,
          ACF_VALUES[k - 1],
          CYAN
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // Compact side-by-side stems.
  // The common vertical scale permits direct comparison.

  function acfPacfPicture(stage = 0) {
    const objects = [
      correlationAxes(
        'FULL LINK AND PARTIAL LINK'
      )
    ];

    for (let k = 1; k <= 3; k++) {
      objects.push(
        correlationStem(
          k,
          ACF_VALUES[k - 1],
          CYAN,
          -0.22
        )
      );

      if (k <= 2 || stage >= 1) {
        objects.push(
          correlationStem(
            k,
            PACF_VALUES[k - 1],
            GREEN,
            0.22
          )
        );
      }
    }

    const ly = P ? 1.10 : 1.04;

    objects.push(
      rect(
        0.18,
        0.15,
        [CX - 1.70, ly, 0],
        CYAN,
        0.90
      ),
      txt(
        'ACF',
        13,
        CYAN,
        [CX - 1.24, ly, 0]
      ),
      rect(
        0.18,
        0.15,
        [CX + 0.83, ly, 0],
        GREEN,
        0.90
      ),
      txt(
        'PACF',
        13,
        GREEN,
        [CX + 1.35, ly, 0]
      )
    );

    if (stage >= 2) {
      objects.push(
        ring(
          [
            acfX(3) + 0.22,
            acfY(0),
            0
          ],
          GREEN,
          0.18
        ),
        tag(
          'NO EXTRA LINEAR LINK',
          GREEN,
          [
            CX + 0.40,
            acfY(-0.56),
            0
          ],
          13
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Predict both outside counts from the middle count.
  //
  // Example: weeks 4, 5 and 6.
  //
  // Middle count = 24.
  //
  // Using the model's mean and lag-one slope:
  //
  // prediction =
  // 22 + (2/3) × (24 - 22)
  // = 23.333...
  //
  // Earlier gap:
  // 23 - 23.333... = -0.333...
  //
  // Later gap:
  // 29 - 23.333... = 5.666...
  //
  // This is an illustration of residualizing both
  // outside variables. It is not an operational
  // forecast using future information.
  // ------------------------------------------------------------

  const MID_VALUE = DATA[4];

  const OUTSIDE_PRED =
    USUAL +
    RHO1 * (MID_VALUE - USUAL);

  const LEFT_GAP =
    DATA[3] - OUTSIDE_PRED;

  const RIGHT_GAP =
    DATA[5] - OUTSIDE_PRED;

  function predictionPicture(stage = 0) {
    const objects = [];

    const midY = P ? 0.30 : 0.25;
    const sideY = P ? -2.35 : -1.45;

    const leftX = CX - 1.85;
    const rightX = CX + 1.85;

    objects.push(
      txt(
        'USE THE MIDDLE COUNT TO PREDICT BOTH SIDES',
        P ? 17 : 16,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        2.00,
        1.15,
        [CX, midY, 0],
        VIOLET,
        0.08
      ),
      txt(
        'WEEK 5',
        14,
        VIOLET,
        [CX, midY + 0.32, 0]
      ),
      txt(
        '24 rooms',
        21,
        VIOLET,
        [CX, midY - 0.13, 0],
        true
      ),
      arrow(
        [CX - 0.65, midY - 0.59, 0],
        [leftX, sideY + 0.78, 0],
        VIOLET,
        3
      ),
      arrow(
        [CX + 0.65, midY - 0.59, 0],
        [rightX, sideY + 0.78, 0],
        VIOLET,
        3
      )
    );

    [
      {
        x: leftX,
        title: 'WEEK 4',
        real: DATA[3],
        gap: LEFT_GAP
      },
      {
        x: rightX,
        title: 'WEEK 6',
        real: DATA[5],
        gap: RIGHT_GAP
      }
    ].forEach(item => {
      objects.push(
        rounded(
          2.65,
          1.55,
          [item.x, sideY, 0],
          stage >= 1 ? GREEN : CYAN,
          0.045
        ),
        txt(
          item.title,
          14,
          CYAN,
          [
            item.x,
            sideY + 0.49,
            0
          ]
        ),
        txt(
          'Real: ' + item.real,
          17,
          WHITE,
          [
            item.x,
            sideY + 0.10,
            0
          ],
          true
        ),
        txt(
          'Pred: ' + fmt(OUTSIDE_PRED),
          16,
          VIOLET,
          [
            item.x,
            sideY - 0.26,
            0
          ],
          true
        )
      );

      if (stage >= 1) {
        objects.push(
          tag(
            signed(item.gap),
            GREEN,
            [
              item.x,
              sideY - 1.04,
              0
            ],
            18
          )
        );
      }
    });

    if (stage >= 1) {
      objects.push(
        txt(
          'Keep real minus predicted',
          14,
          GREEN,
          [
            CX,
            sideY - 1.49,
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Leftover-gap comparison.
  //
  // A pair of residual variables replaces the original
  // pair of outside room counts.
  //
  // The illustrated point cloud is schematic.
  // It is not a newly estimated correlation from
  // the chapter's six known observations.
  // ------------------------------------------------------------

  function residualCorrelationPicture(
    label = 'PARTIAL AUTOCORRELATION'
  ) {
    const objects = [];

    const y = P ? -1.23 : -0.66;
    const size = P ? 3.45 : 2.65;

    objects.push(
      txt(
        label,
        19,
        GREEN,
        [CX, TITLE_Y, 0]
      ),
      rounded(
        size + 0.14,
        size + 0.14,
        [CX, y, 0],
        GREEN,
        0.02
      ),
      ln(
        [CX - size / 2, y, 0],
        [CX + size / 2, y, 0],
        C.muted,
        1.3
      ),
      ln(
        [CX, y - size / 2, 0],
        [CX, y + size / 2, 0],
        C.muted,
        1.3
      )
    );

    // Illustrative weak positive relationship.
    // Coordinates do not represent observed hotel residuals.

    const sample = [
      [-0.82, -0.40],
      [-0.72, 0.38],
      [-0.48, -0.57],
      [-0.28, 0.16],
      [-0.10, 0.68],
      [0.10, -0.48],
      [0.32, 0.54],
      [0.48, -0.31],
      [0.67, 0.14],
      [0.83, 0.63]
    ];

    sample.forEach(([u, v]) => {
      objects.push(
        glow(
          [
            CX + u * size * 0.45,
            y + v * size * 0.45,
            0
          ],
          GREEN,
          0.085
        )
      );
    });

    objects.push(
      txt(
        'Earlier leftover gap',
        14,
        GREEN,
        [
          CX,
          y - size / 2 - 0.32,
          0
        ]
      ),
      txt(
        'Later gap',
        13,
        GREEN,
        [
          CX - size / 2 - 0.58,
          y,
          0
        ]
      ),
      txt(
        'Schematic gap pairs',
        12,
        C.muted,
        [
          CX,
          y - size / 2 - 0.67,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Multiply the neighboring links.
  //
  // Represent 2/3 × 2/3 as a 3 × 3 square.
  //
  // Select two of its three columns.
  // Select two of its three rows.
  //
  // Four of the nine equal cells satisfy both selections.
  // The area represents the product 4/9.
  //
  // It is an arithmetic representation of the product,
  // not a collection of hotel observations.
  // ------------------------------------------------------------

  function productGrid(stage = 0) {
    const objects = [];

    const cell = P ? 0.93 : 0.73;

    const gx = CX - 0.68;
    const gy = P ? -1.35 : -0.68;

    objects.push(
      txt(
        'MULTIPLY THE TWO NEIGHBORING LINKS',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const first = col < 2;
        const second = row < 2;

        const both = first && second;

        let color = C.muted;
        let opacity = 0.10;

        if (stage === 0 && first) {
          color = VIOLET;
          opacity = 0.78;
        }

        if (stage >= 1) {
          if (both) {
            color = PINK;
            opacity = 0.93;
          } else if (first || second) {
            color = VIOLET;
            opacity = 0.28;
          }
        }

        const x = gx + (col - 1) * cell;
        const y = gy + (1 - row) * cell;

        objects.push(
          rect(
            cell * 0.92,
            cell * 0.92,
            [x, y, 0],
            color,
            opacity
          )
        );

        if (stage >= 1 && both) {
          objects.push(
            txt(
              '1/9',
              14,
              WHITE,
              [x, y, 0],
              true
            )
          );
        }
      }
    }

    objects.push(
      ln(
        [gx - 1.46 * cell, gy + 1.76 * cell, 0],
        [gx + 0.46 * cell, gy + 1.76 * cell, 0],
        VIOLET,
        3
      ),
      txt(
        '2/3',
        17,
        VIOLET,
        [
          gx - cell / 2,
          gy + 2.04 * cell,
          0
        ],
        true
      )
    );

    if (stage >= 1) {
      const x = gx - 1.80 * cell;

      objects.push(
        ln(
          [x, gy + 1.46 * cell, 0],
          [x, gy - 0.46 * cell, 0],
          VIOLET,
          3
        ),
        txt(
          '2/3',
          17,
          VIOLET,
          [
            x - 0.35,
            gy + cell / 2,
            0
          ],
          true
        ),
        tag(
          '4 OF 9',
          PINK,
          [
            CX + 1.80,
            gy + 0.33,
            0
          ],
          17
        ),
        txt(
          '≈ 0.44',
          18,
          PINK,
          [
            CX + 1.80,
            gy - 0.23,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Arithmetic strip for the two-week link.
  //
  // One complete strip represents correlation 1.
  //
  // Full lag-2 correlation = 7/12.
  // Explained-through-middle product = 4/9.
  // Leftover standardized covariance = 5/36.
  //
  // The coloured pieces have exact proportional widths.
  // ------------------------------------------------------------

  const STRIP_W = P ? 5.65 : 5.25;
  const STRIP_H = P ? 0.60 : 0.51;

  const STRIP_LEFT = CX - STRIP_W / 2;

  const stripX = f =>
    STRIP_LEFT + STRIP_W * f;

  const LINK_Y = P ? -0.58 : 0.12;

  function stripPart(
    start,
    amount,
    y,
    color,
    opacity = 0.90
  ) {
    return rect(
      STRIP_W * amount,
      STRIP_H,
      [
        stripX(start + amount / 2),
        y,
        0
      ],
      color,
      opacity
    );
  }

  function stripShell(y) {
    return rounded(
      STRIP_W,
      STRIP_H,
      [CX, y, 0],
      C.muted,
      0.025
    );
  }

  function stripTicks(y) {
    return new M.VGroup(
      txt(
        '0',
        14,
        C.muted,
        [stripX(0), y - 0.42, 0],
        true
      ),
      txt(
        '1',
        14,
        C.muted,
        [stripX(1), y - 0.42, 0],
        true
      )
    );
  }

  function fullLinkStrip() {
    return new M.VGroup(
      stripShell(LINK_Y),
      stripPart(
        0,
        RHO2,
        LINK_Y,
        CYAN
      ),
      txt(
        'Full two-week link',
        16,
        CYAN,
        [
          CX,
          LINK_Y + 0.68,
          0
        ]
      ),
      txt(
        '≈ 0.58',
        20,
        WHITE,
        [
          stripX(RHO2 / 2),
          LINK_Y,
          0
        ],
        true
      ),
      stripTicks(LINK_Y)
    );
  }

  function subtractedLinkStrip(
    showResult = false
  ) {
    const objects = [
      stripShell(LINK_Y),
      stripPart(
        0,
        PRODUCT,
        LINK_Y,
        PINK,
        0.82
      ),
      stripPart(
        PRODUCT,
        LEFTOVER,
        LINK_Y,
        GREEN,
        0.97
      ),
      txt(
        'Full two-week link ≈ 0.58',
        16,
        CYAN,
        [
          CX,
          LINK_Y + 0.68,
          0
        ]
      ),
      txt(
        '0.44',
        17,
        WHITE,
        [
          stripX(PRODUCT / 2),
          LINK_Y,
          0
        ],
        true
      ),
      stripTicks(LINK_Y)
    ];

    const px = stripX(PRODUCT / 2);

    objects.push(
      arrow(
        [px, LINK_Y - 0.38, 0],
        [px, LINK_Y - 1.02, 0],
        PINK
      ),
      txt(
        'Remove middle product',
        14,
        PINK,
        [
          px + 0.18,
          LINK_Y - 1.31,
          0
        ]
      )
    );

    if (showResult) {
      const rx =
        stripX(PRODUCT + LEFTOVER / 2);

      objects.push(
        rounded(
          STRIP_W * LEFTOVER + 0.10,
          STRIP_H + 0.11,
          [rx, LINK_Y, 0],
          WHITE,
          0
        ),
        ln(
          [rx, LINK_Y - 0.36, 0],
          [rx, LINK_Y - 0.72, 0],
          GREEN,
          2
        ),
        ln(
          [rx, LINK_Y - 0.72, 0],
          [
            CX + 1.55,
            LINK_Y - 0.72,
            0
          ],
          GREEN,
          2
        ),
        tag(
          '≈ 0.14 LEFT',
          GREEN,
          [
            CX + 1.65,
            LINK_Y - 1.10,
            0
          ],
          15
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Variance remaining after allowing for the middle.
  //
  // In standardized units, the original variance is 1.
  //
  // The middle count explains (2/3)^2 = 4/9 of the
  // variance on each side.
  //
  // Both residual variances are therefore 5/9.
  //
  // Important:
  // 0.56 is the remaining VARIANCE share, not the
  // remaining standard deviation.
  //
  // Standard deviations shrink by sqrt(5/9).
  // Their product gives the denominator 5/9.
  // ------------------------------------------------------------

  function variancePicture(stage = 0) {
    const objects = [];

    const top = P ? 0.02 : 0.40;
    const lower = P ? -2.03 : -1.18;

    objects.push(
      txt(
        'ALLOWING FOR THE MIDDLE REDUCES VARIANCE',
        P ? 17 : 16,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    [
      ['Earlier outside count', top],
      ['Later outside count', lower]
    ].forEach(([label, y], i) => {
      objects.push(
        txt(
          label,
          16,
          CYAN,
          [CX, y + 0.61, 0]
        ),
        stripShell(y)
      );

      const reduced =
        stage >= 1 || i === 0;

      if (reduced) {
        objects.push(
          stripPart(
            0,
            PRODUCT,
            y,
            PINK,
            0.35
          ),
          stripPart(
            PRODUCT,
            VARIANCE_LEFT,
            y,
            GREEN,
            0.94
          ),
          txt(
            'removed',
            P ? 15 : 14,
            WHITE,
            [
              stripX(PRODUCT / 2),
              y,
              0
            ]
          ),
          txt(
            stage >= 2
              ? '5/9 ≈ 0.56'
              : 'leftover variance',
            15,
            C.bg,
            [
              stripX(
                PRODUCT + VARIANCE_LEFT / 2
              ),
              y,
              0
            ],
            stage >= 2
          )
        );
      } else {
        objects.push(
          stripPart(
            0,
            1,
            y,
            CYAN,
            0.77
          ),
          txt(
            'original variance = 1',
            16,
            WHITE,
            [CX, y, 0]
          )
        );
      }

      objects.push(stripTicks(y));
    });

    if (stage >= 2) {
      objects.push(
        tag(
          'SAME SHARE ON BOTH SIDES',
          GREEN,
          [
            CX,
            lower - 0.95,
            0
          ],
          14
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Rescale the leftover covariance.
  //
  // Before rescaling:
  //
  // numerator = 5/36
  // denominator = 5/9
  //
  // Draw the numerator on an original scale of one.
  //
  // Then make the remaining variance share the new
  // comparison unit.
  //
  // Since both residual variance shares are the same,
  // the denominator is:
  //
  // sqrt(5/9) × sqrt(5/9) = 5/9.
  //
  // After rescaling, the green bar occupies one
  // quarter of the new unit.
  // ------------------------------------------------------------

  const RES_Y = P ? -0.85 : -0.35;
  const RES_TOP = P ? 0.75 : 0.88;

  function rescalePicture(stage = 0) {
    const objects = [];

    objects.push(
      txt(
        'COMPARE ON THE CORRELATION SCALE',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      txt(
        'Original unit = 1',
        15,
        C.muted,
        [
          CX,
          RES_TOP + 0.27,
          0
        ]
      ),
      stripShell(RES_TOP - 0.28),
      stripPart(
        0,
        VARIANCE_LEFT,
        RES_TOP - 0.28,
        VIOLET,
        0.82
      ),
      txt(
        '0.56',
        17,
        WHITE,
        [
          stripX(VARIANCE_LEFT / 2),
          RES_TOP - 0.28,
          0
        ],
        true
      )
    );

    if (stage === 0) {
      objects.push(
        stripShell(RES_Y),
        stripPart(
          0,
          LEFTOVER,
          RES_Y,
          GREEN,
          0.96
        ),
        txt(
          'Remaining covariance ≈ 0.14',
          16,
          GREEN,
          [
            CX,
            RES_Y + 0.59,
            0
          ]
        ),
        txt(
          '0',
          14,
          C.muted,
          [
            stripX(0),
            RES_Y - 0.42,
            0
          ],
          true
        ),
        txt(
          '1',
          14,
          C.muted,
          [
            stripX(1),
            RES_Y - 0.42,
            0
          ],
          true
        )
      );
    }

    if (stage >= 1) {
      objects.push(
        arrow(
          [
            stripX(VARIANCE_LEFT),
            RES_TOP - 0.64,
            0
          ],
          [
            stripX(1),
            RES_Y + 0.36,
            0
          ],
          VIOLET,
          2.5
        ),
        stripShell(RES_Y),
        txt(
          'New comparison unit = 0.56',
          15,
          VIOLET,
          [
            CX,
            RES_Y + 0.60,
            0
          ]
        )
      );

      // Four equal sections of the new unit.

      for (let j = 1; j < 4; j++) {
        objects.push(
          ln(
            [
              stripX(j / 4),
              RES_Y - STRIP_H / 2,
              0
            ],
            [
              stripX(j / 4),
              RES_Y + STRIP_H / 2,
              0
            ],
            C.muted,
            1.3
          )
        );
      }

      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        objects.push(
          txt(
            String(v),
            14,
            v === 0.25 ? GREEN : C.muted,
            [
              stripX(v),
              RES_Y - 0.42,
              0
            ],
            true
          )
        );
      });
    }

    if (stage >= 2) {
      objects.push(
        stripPart(
          0,
          PACF2,
          RES_Y,
          GREEN,
          0.95
        ),
        txt(
          '¼',
          21,
          C.bg,
          [
            stripX(PACF2 / 2),
            RES_Y,
            0
          ],
          true
        ),
        tag(
          'PARTIAL LINK = 0.25',
          GREEN,
          [
            CX,
            RES_Y - 1.05,
            0
          ],
          18
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Two-stage rule picture.
  //
  // Step 1: subtract the product.
  // Step 2: divide by the remaining variance share.
  // ------------------------------------------------------------

  function rulePicture(stage = 0) {
    const objects = [];

    const y1 = P ? 0.15 : 0.38;
    const y2 = P ? -2.15 : -1.38;

    objects.push(
      txt(
        'REMOVE THE MIDDLE LINK, THEN RESCALE',
        18,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      stripShell(y1),
      stripPart(
        0,
        PRODUCT,
        y1,
        PINK,
        0.35
      ),
      stripPart(
        PRODUCT,
        LEFTOVER,
        y1,
        GREEN,
        0.95
      ),
      txt(
        '0.44 removed',
        15,
        PINK,
        [
          stripX(PRODUCT / 2),
          y1 + 0.49,
          0
        ]
      ),
      txt(
        '0.14 left',
        P ? 17 : 15,
        GREEN,
        [
          stripX(PRODUCT + LEFTOVER / 2) + 0.70,
          y1 - 0.47,
          0
        ]
      )
    );

    if (stage >= 1) {
      objects.push(
        arrow(
          [CX, y1 - 0.65, 0],
          [CX, y2 + 0.55, 0],
          VIOLET,
          3
        ),
        tag(
          'DIVIDE BY 0.56',
          VIOLET,
          [
            CX + 1.35,
            (y1 + y2) / 2,
            0
          ],
          13
        ),
        stripShell(y2),
        stripPart(
          0,
          PACF2,
          y2,
          GREEN,
          0.95
        ),
        txt(
          '¼',
          21,
          C.bg,
          [
            stripX(PACF2 / 2),
            y2,
            0
          ],
          true
        ),
        txt(
          '0.25 of the new unit',
          P ? 17 : 15,
          GREEN,
          [
            CX,
            y2 - 0.57,
            0
          ]
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Match partial autocorrelation to the AR coefficient.
  //
  // In this AR(2) model, the lag-two partial
  // autocorrelation equals the final AR coefficient.
  //
  // Do not imply that every partial autocorrelation
  // equals every AR coefficient.
  //
  // In particular, lag-one PACF = 2/3 here, while the
  // lag-one coefficient in AR(2) is 1/2.
  // ------------------------------------------------------------

  function coefficientMatch() {
    const objects = [];

    const xs = [
      CX - 1.55,
      CX + 1.55
    ];

    const y = P ? -0.88 : -0.48;

    [
      ['LAG-2 PACF', GREEN],
      ['AR(2) WEIGHT', VIOLET]
    ].forEach(([label, color], i) => {
      objects.push(
        rounded(
          2.35,
          2.08,
          [xs[i], y, 0],
          color,
          0.055
        ),
        txt(
          label,
          15,
          color,
          [xs[i], y + 0.71, 0]
        ),
        txt(
          '0.25',
          31,
          color,
          [xs[i], y + 0.12, 0],
          true
        )
      );

      // One of four equally sized blocks.

      for (let j = 0; j < 4; j++) {
        objects.push(
          rect(
            0.39,
            0.36,
            [
              xs[i] + (j - 1.5) * 0.45,
              y - 0.62,
              0
            ],
            color,
            j === 0 ? 0.96 : 0.13
          )
        );
      }
    });

    objects.push(
      txt(
        '=',
        27,
        WHITE,
        [CX, y, 0]
      ),
      txt(
        'Same value in this two-lag model',
        15,
        GREEN,
        [
          CX,
          y - 1.46,
          0
        ]
      )
    );

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Four-card picture for lag three.
  //
  // Observed weeks 3, 4, 5 and 6:
  //
  // 20, 23, 24, 29.
  //
  // Compare the outside weeks while allowing for
  // BOTH intervening weeks.
  //
  // Full lag-3 autocorrelation = 11/24 ≈ 0.46.
  // Partial autocorrelation at lag 3 = 0.
  // ------------------------------------------------------------

  const FOUR_X = [
    CX - 2.10,
    CX - 0.70,
    CX + 0.70,
    CX + 2.10
  ];

  const FOUR_Y = P ? -1.15 : -0.70;

  const FOUR_W = 1.15;
  const FOUR_H = 1.50;

  function fourCardPicture(stage = 0) {
    const objects = [];

    objects.push(
      txt(
        'THREE WEEKS BACK',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    for (let i = 0; i < 3; i++) {
      objects.push(
        ln(
          [
            FOUR_X[i] + FOUR_W / 2,
            FOUR_Y,
            0
          ],
          [
            FOUR_X[i + 1] - FOUR_W / 2,
            FOUR_Y,
            0
          ],
          VIOLET,
          2.7
        )
      );
    }

    [3, 4, 5, 6].forEach((w, i) => {
      const middle = i === 1 || i === 2;

      const color = middle
        ? VIOLET
        : stage >= 2
          ? GREEN
          : CYAN;

      objects.push(
        rounded(
          FOUR_W,
          FOUR_H,
          [FOUR_X[i], FOUR_Y, 0],
          color,
          0.055
        ),
        txt(
          `W${w}`,
          14,
          color,
          [
            FOUR_X[i],
            FOUR_Y + 0.45,
            0
          ]
        ),
        txt(
          String(DATA[w - 1]),
          24,
          color,
          [
            FOUR_X[i],
            FOUR_Y - 0.03,
            0
          ],
          true
        ),
        txt(
          middle
            ? 'middle'
            : i === 0
              ? '3 back'
              : 'now',
          12,
          color,
          [
            FOUR_X[i],
            FOUR_Y - 0.51,
            0
          ]
        )
      );
    });

    const top = FOUR_Y + FOUR_H / 2;
    const routeY = top + 0.65;

    const outerColor =
      stage >= 2 ? C.muted : AMBER;

    const make = stage >= 2
      ? (a, b) => dash(a, b, outerColor)
      : (a, b) => ln(a, b, outerColor, 3);

    objects.push(
      make(
        [FOUR_X[0], top, 0],
        [FOUR_X[0], routeY, 0]
      ),
      make(
        [FOUR_X[0], routeY, 0],
        [FOUR_X[3], routeY, 0]
      ),
      make(
        [FOUR_X[3], routeY, 0],
        [FOUR_X[3], top, 0]
      ),
      tag(
        stage === 0
          ? 'TEST THIS LINK'
          : stage === 1
            ? 'FULL LINK ≈ 0.46'
            : 'PARTIAL LINK = 0',
        stage >= 2 ? GREEN : AMBER,
        [
          CX,
          routeY + 0.29,
          0
        ],
        14
      )
    );

    if (stage >= 2) {
      objects.push(
        rounded(
          FOUR_X[2] - FOUR_X[1] +
            FOUR_W + 0.18,
          FOUR_H + 0.22,
          [CX, FOUR_Y, 0],
          VIOLET,
          0
        ),
        tag(
          'ALLOW FOR BOTH',
          VIOLET,
          [
            CX,
            FOUR_Y - 1.05,
            0
          ],
          13
        ),
        tag(
          'LEFTOVER GAP',
          GREEN,
          [
            FOUR_X[0],
            FOUR_Y - 1.63,
            0
          ],
          12
        ),
        tag(
          'LEFTOVER GAP',
          GREEN,
          [
            FOUR_X[3],
            FOUR_Y - 1.63,
            0
          ],
          12
        )
      );

      // Deliberately broken connection between gaps.

      const by = FOUR_Y - 2.10;

      objects.push(
        ln(
          [FOUR_X[0], by, 0],
          [CX - 0.27, by, 0],
          GREEN,
          2.5
        ),
        ln(
          [CX + 0.27, by, 0],
          [FOUR_X[3], by, 0],
          GREEN,
          2.5
        ),
        txt(
          '0',
          21,
          GREEN,
          [CX, by, 0],
          true
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // Lag-three leftover-gap picture.
  //
  // The two middle weeks have been used to predict
  // both outside counts.
  //
  // The remaining linear correlation is zero in
  // this model.
  //
  // Schematic point cloud: zero covariance by symmetry.
  // Zero correlation is not a general claim of
  // statistical independence.
  // ------------------------------------------------------------

  function zeroPartialPicture() {
    const y = P ? -1.18 : -0.62;
    const size = P ? 3.40 : 2.65;

    return new M.VGroup(
      txt(
        'LAG 3: AFTER BOTH MIDDLE WEEKS',
        19,
        C.ink,
        [CX, TITLE_Y, 0]
      ),
      scatter(
        CX,
        y,
        'zero',
        size,
        GREEN
      ),
      txt(
        'Earlier leftover gap',
        14,
        GREEN,
        [
          CX,
          y - size / 2 - 0.32,
          0
        ]
      ),
      txt(
        'Later gap',
        13,
        GREEN,
        [
          CX - size / 2 - 0.56,
          y,
          0
        ]
      ),
      tag(
        'PARTIAL CORRELATION = 0',
        GREEN,
        [
          CX,
          y - size / 2 - 0.76,
          0
        ],
        15
      )
    );
  }

  // ------------------------------------------------------------
  // AR(2) selection picture.
  //
  // Keep lag one and lag two.
  // No additional lag-three term is needed for
  // the supplied fitted AR(2) model.
  // ------------------------------------------------------------

  function lagSelectionPicture(warning = false) {
    const objects = [];

    const y = P ? -0.68 : -0.43;

    const xs = [
      CX - 2.0,
      CX,
      CX + 2.0
    ];

    objects.push(
      txt(
        warning
          ? 'CHECK THE PARTIAL LINK FIRST'
          : 'WHICH LAGS ADD INFORMATION?',
        19,
        warning ? RED : C.ink,
        [CX, TITLE_Y, 0]
      )
    );

    for (let i = 0; i < 3; i++) {
      const k = i + 1;

      const color =
        k <= 2 ? GREEN : C.muted;

      objects.push(
        rounded(
          1.72,
          2.16,
          [xs[i], y, 0],
          color,
          0.045
        ),
        txt(
          `LAG ${k}`,
          15,
          color,
          [
            xs[i],
            y + 0.74,
            0
          ]
        ),
        txt(
          fmt(PACF_VALUES[i]),
          26,
          color,
          [
            xs[i],
            y + 0.15,
            0
          ],
          true
        ),
        txt(
          k <= 2 ? 'KEEP' : 'NO EXTRA',
          14,
          color,
          [
            xs[i],
            y - 0.65,
            0
          ]
        )
      );
    }

    if (warning) {
      objects.push(
        rounded(
          1.91,
          2.35,
          [xs[2], y, 0],
          RED,
          0
        ),
        tag(
          'FULL LINK: 0.46',
          AMBER,
          [
            xs[2],
            y - 1.52,
            0
          ],
          12
        ),
        txt(
          'A positive full link is not enough',
          15,
          RED,
          [
            CX,
            y - 2.02,
            0
          ]
        )
      );
    } else {
      objects.push(
        tag(
          'AR(2): TWO PAST COUNTS',
          GREEN,
          [
            CX,
            y - 1.57,
            0
          ],
          17
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0–1: introduce the lag-selection problem.
  // ============================================================

  // 0. Choose how many earlier Saturdays to use.

  await until(S(0));
  await play(
    ...picture(
      hotelChart(0)
    ),
    ...say(
      'HOW MANY PAST SATURDAYS SHOULD WE USE?',
      AMBER
    ),
    ...fbox([
      ['HOTEL: 40 ROOMS', CYAN],
      'choose useful earlier counts',
      'before making the next guess'
    ], AMBER)
  );

  // 1. Could two weeks back add information
  // after last week is already known?

  await until(S(1));
  await play(
    ...put(
      'picture',
      hotelChart(1)
    ),
    ...say(
      'DOES TWO WEEKS BACK TELL US ANYTHING EXTRA?',
      AMBER
    ),
    ...fbox([
      ['one week back', VIOLET],
      ['two weeks back', GREEN],
      'is the second link useful?'
    ], AMBER)
  );

  // ============================================================
  // 2–7: construct the three-card picture.
  // ============================================================

  // 2. Three room-count cards, with this week at right.

  await until(S(2));

  const cards = threeCards();

  await play(
    ...clearScene(),
    ...put('cards', cards),
    ...say(
      'THREE CONSECUTIVE WEEKS'
    ),
    ...fbox([
      'earlier → middle → this week',
      ['23       24       29', CYAN]
    ])
  );

  // 3. Join the neighboring pairs.

  await until(S(3));
  await play(
    ...put(
      'neighbors',
      neighborLinks(false)
    ),
    ...say(
      'JOIN THE NEIGHBORING WEEKS',
      VIOLET
    ),
    ...fbox([
      ['week 4 — week 5', VIOLET],
      ['week 5 — week 6', VIOLET]
    ], VIOLET)
  );

  // 4. Add the link between the outside cards.

  await until(S(4));
  await play(
    ...put(
      'outside',
      outsideLink(
        'LINK TO TEST',
        AMBER
      )
    ),
    ...say(
      'TEST THE TWO-WEEK LINK',
      AMBER
    ),
    ...fbox([
      ['week 4 — week 6', AMBER],
      'two weeks apart'
    ], AMBER)
  );

  // 5. Could the middle explain the outside link?

  await until(S(5));
  await play(
    ...put(
      'middle',
      middleOutline()
    ),
    ...put(
      'outside',
      outsideLink(
        'EXTRA LINK?',
        AMBER,
        true
      )
    ),
    ...put(
      'neighbors',
      neighborLinks(
        false,
        true
      )
    ),
    ...put(
      'through',
      throughMiddle()
    ),
    ...say(
      'COULD THE MIDDLE WEEK EXPLAIN THE LINK?',
      VIOLET
    ),
    ...fbox([
      'first ↔ middle ↔ last',
      ['is anything left over?', GREEN]
    ], VIOLET)
  );

  // 6. The cards identify the weeks being compared.

  await until(S(6));
  await play(
    ...remove(
      'through',
      'middle'
    ),
    ...indicate(
      'cards',
      CYAN
    ),
    ...say(
      'THE CARDS SHOW WHICH WEEKS TO COMPARE'
    ),
    ...fbox([
      'three cards identify',
      'one set of weeks'
    ])
  );

  // 7. The links describe comparisons across many weeks.

  await until(S(7));
  await play(
    ...picture(
      tripletRows(false)
    ),
    ...say(
      'THE MODEL COMPARES MANY SETS OF WEEKS',
      CYAN
    ),
    ...fbox([
      'not just three room counts',
      ['links describe the wider record', CYAN]
    ])
  );

  // ============================================================
  // 8–13: correlation, autocorrelation and lag.
  // ============================================================

  // 8. Positive link: busy weeks go with busy weeks.

  await until(S(8));
  await play(
    ...picture(
      positiveCorrelationPicture()
    ),
    ...say(
      'POSITIVE LINK: BUSY GOES WITH BUSY',
      CYAN
    ),
    ...fbox([
      'higher earlier count',
      ['tends to accompany a higher count', CYAN]
    ])
  );

  // 9. Introduce the -1 to +1 scale.

  await until(S(9));
  await play(
    ...picture(
      correlationScale(0)
    ),
    ...say(
      'MEASURE THE LINK FROM −1 TO +1',
      WHITE
    ),
    ...fbox([
      ['−1: opposite direction', RED],
      ' 0: little straight-line link',
      ['+1: same direction', CYAN]
    ])
  );

  // 10. Name correlation.

  await until(S(10));
  await play(
    ...put(
      'picture',
      correlationScale(1)
    ),
    ...say(
      'CORRELATION',
      GREEN
    ),
    ...fbox([
      ['CORRELATION', GREEN],
      'strength and direction',
      'of a straight-line link'
    ], GREEN)
  );

  // 11. Near-zero correlation.

  await until(S(11));
  await play(
    ...put(
      'picture',
      correlationScale(2)
    ),
    ...say(
      'NEAR ZERO: LITTLE STRAIGHT-LINE LINK',
      GREEN
    ),
    ...fbox([
      ['correlation near 0', GREEN],
      'little linear association'
    ], GREEN)
  );

  // 12. The same hotel's counts at different times.

  await until(S(12));
  await play(
    ...picture(
      lagCards(0)
    ),
    ...say(
      'AUTOCORRELATION: A SERIES WITH ITS OWN PAST',
      CYAN
    ),
    ...fbox([
      ['AUTOCORRELATION', CYAN],
      'correlation between counts',
      'at different times'
    ])
  );

  // 13. A lag counts the weeks stepped back.

  await until(S(13));
  await play(
    ...put(
      'picture',
      lagCards(1)
    ),
    ...say(
      'LAG = NUMBER OF WEEKS BACK',
      VIOLET
    ),
    ...fbox([
      ['lag 1 = one week back', VIOLET],
      ['lag 2 = two weeks back', VIOLET],
      ['lag 3 = three weeks back', VIOLET]
    ], VIOLET)
  );

  // ============================================================
  // 14–16: the three model autocorrelations.
  // ============================================================

  // 14. Lag-one autocorrelation is about 0.67.

  await until(S(14));
  await play(
    ...clearScene(),
    ...put(
      'acfAxes',
      correlationAxes()
    ),
    ...put(
      'acf1',
      correlationStem(
        1,
        RHO1,
        CYAN
      )
    ),
    ...say(
      'LAG 1: AUTOCORRELATION ≈ 0.67',
      CYAN
    ),
    ...fbox([
      'one week back',
      ['correlation = 2/3 ≈ 0.67', CYAN]
    ])
  );

  // 15. Lag-two autocorrelation is about 0.58.

  await until(S(15));
  await play(
    ...put(
      'acf2',
      correlationStem(
        2,
        RHO2,
        CYAN
      )
    ),
    ...say(
      'LAG 2: AUTOCORRELATION ≈ 0.58',
      CYAN
    ),
    ...fbox([
      ['lag 1 ≈ 0.67', CYAN],
      ['lag 2 ≈ 0.58', CYAN]
    ])
  );

  // 16. Lag-three autocorrelation is about 0.46.

  await until(S(16));
  await play(
    ...put(
      'acf3',
      correlationStem(
        3,
        RHO3,
        CYAN
      )
    ),
    ...say(
      'LAG 3: AUTOCORRELATION ≈ 0.46',
      CYAN
    ),
    ...fbox([
      ['lag 1 ≈ 0.67', CYAN],
      ['lag 2 ≈ 0.58', CYAN],
      ['lag 3 ≈ 0.46', CYAN]
    ])
  );

  // ============================================================
  // 17–21: introduce partial autocorrelation through
  // leftover gaps.
  // ============================================================

  // 17. What remains after allowing for last week?

  await until(S(17));
  await play(
    ...picture(
      cardDiagram(
        true,
        true,
        true,
        true
      )
    ),
    ...say(
      'HOW MUCH OF THE TWO-WEEK LINK REMAINS?',
      AMBER
    ),
    ...fbox([
      ['full two-week link ≈ 0.58', AMBER],
      'first allow for last week'
    ], AMBER)
  );

  // 18. Use the middle count to predict both outside counts.

  await until(S(18));
  await play(
    ...picture(
      predictionPicture(0)
    ),
    ...say(
      'PREDICT EACH OUTSIDE COUNT FROM THE MIDDLE',
      VIOLET
    ),
    ...fbox([
      'use a straight-line rule',
      'on each side',
      ['middle count = 24', VIOLET]
    ], VIOLET)
  );

  // 19. Keep real minus predicted on both outside cards.

  await until(S(19));
  await play(
    ...put(
      'picture',
      predictionPicture(1)
    ),
    ...say(
      'KEEP EACH OUTSIDE COUNT’S LEFTOVER GAP',
      GREEN
    ),
    ...fbox([
      ['gap = real − predicted', GREEN],
      'earlier: 23 − 23.33 ≈ −0.33',
      'later: 29 − 23.33 ≈ +5.67'
    ], GREEN)
  );

  // 20. Compare these residual pairs across many triplets.

  await until(S(20));
  await play(
    ...picture(
      tripletRows(true)
    ),
    ...say(
      'COMPARE PAIRS OF GAPS ACROSS MANY WEEKS',
      GREEN
    ),
    ...fbox([
      'repeat for many triplets',
      ['compare the two leftover gaps', GREEN]
    ], GREEN)
  );

  // 21. Name partial autocorrelation at lag two.

  await until(S(21));
  await play(
    ...picture(
      residualCorrelationPicture()
    ),
    ...say(
      'PARTIAL AUTOCORRELATION AT LAG 2',
      GREEN
    ),
    ...fbox([
      ['PARTIAL AUTOCORRELATION', GREEN],
      'correlation of the gaps',
      'after allowing for the middle'
    ], GREEN)
  );

  // ============================================================
  // 22–26: subtract the neighboring-link product.
  // ============================================================

  // 22. Show the model's three correlations.

  await until(S(22));
  await play(
    ...picture(
      cardDiagram(
        true,
        true,
        true,
        false
      )
    ),
    ...say(
      'NOW USE THE MODEL’S LINK VALUES',
      CYAN
    ),
    ...fbox([
      ['full two-week link ≈ 0.58', AMBER],
      ['neighboring links = 2/3', VIOLET]
    ])
  );

  // 23. Both neighboring links are two thirds.

  await until(S(23));
  await play(
    ...put(
      'picture',
      cardDiagram(
        true,
        true,
        true,
        true
      )
    ),
    ...say(
      'BOTH NEIGHBORING LINKS ARE TWO THIRDS',
      VIOLET
    ),
    ...fbox([
      ['first ↔ middle = 2/3', VIOLET],
      ['middle ↔ last  = 2/3', VIOLET]
    ], VIOLET)
  );

  // 24. Multiply two thirds by two thirds.
  //
  // Highlight four of nine equal cells.

  await until(S(24));
  await play(
    ...picture(
      productGrid(0)
    ),
    ...say(
      'MULTIPLY THE NEIGHBORING LINKS',
      PINK
    ),
    ...fbox([
      '2/3 × 2/3',
      ['= 4/9 ≈ 0.44', PINK]
    ], PINK)
  );

  await until(S(24) + 1.30);
  await play(
    ...put(
      'picture',
      productGrid(1)
    )
  );

  // 25. Subtract that product from the full link.

  await until(S(25));
  await play(
    ...picture(
      fullLinkStrip()
    ),
    ...say(
      'SUBTRACT THE LINK THROUGH THE MIDDLE',
      PINK
    ),
    ...fbox([
      ['full link ≈ 0.58', CYAN],
      ['middle product ≈ 0.44', PINK],
      'subtract the product'
    ], PINK)
  );

  await until(S(25) + 1.30);
  await play(
    ...put(
      'picture',
      subtractedLinkStrip(false)
    )
  );

  // 26. The leftover standardized covariance is about 0.14.

  await until(S(26));
  await play(
    ...put(
      'picture',
      subtractedLinkStrip(true)
    ),
    ...say(
      'ABOUT 0.14 REMAINS BEFORE RESCALING',
      GREEN
    ),
    ...fbox([
      '0.58 − 0.44',
      ['≈ 0.14', GREEN],
      'not yet a residual correlation'
    ], GREEN)
  );

  // ============================================================
  // 27–31: adjust the scale.
  //
  // Removing the middle's linear contribution changes
  // the variance of both outside variables.
  //
  // Use residual variance shares of 5/9.
  // ============================================================

  // 27. The leftover gaps vary less than the original counts.

  await until(S(27));
  await play(
    ...picture(
      variancePicture(0)
    ),
    ...say(
      'THE LEFTOVER GAPS HAVE LESS VARIANCE',
      VIOLET
    ),
    ...fbox([
      'original standardized variance = 1',
      'remove the part explained',
      'by the middle week'
    ], VIOLET)
  );

  // 28. The same share is removed from both sides.

  await until(S(28));
  await play(
    ...put(
      'picture',
      variancePicture(1)
    ),
    ...say(
      'BOTH SIDES LOSE THE SAME VARIANCE SHARE',
      VIOLET
    ),
    ...fbox([
      'same neighboring correlation',
      ['same removed share: 4/9', PINK]
    ], VIOLET)
  );

  // 29. Remaining share = 1 - 4/9 = 5/9.

  await until(S(29));
  await play(
    ...put(
      'picture',
      variancePicture(2)
    ),
    ...say(
      'REMAINING VARIANCE SHARE ≈ 0.56',
      GREEN
    ),
    ...fbox([
      '1 − 4/9 = 5/9',
      ['≈ 0.56 on each side', GREEN]
    ], GREEN)
  );

  // 30. Divide by the remaining share.
  //
  // Equal residual variances mean that the product
  // of their standard deviations is also 5/9.

  await until(S(30));
  await play(
    ...picture(
      rescalePicture(0)
    ),
    ...say(
      'RESCALE THE LEFTOVER LINK',
      VIOLET
    ),
    ...fbox([
      ['leftover covariance ≈ 0.14', GREEN],
      ['comparison unit ≈ 0.56', VIOLET],
      'divide the first by the second'
    ], VIOLET)
  );

  await until(S(30) + 1.25);
  await play(
    ...put(
      'picture',
      rescalePicture(1)
    ),
    ...put(
      'scaledPiece',
      stripPart(
        0,
        LEFTOVER,
        RES_Y,
        GREEN,
        0.95
      )
    )
  );

  // Stretch the remaining covariance onto the
  // new correlation scale.

  await until(S(30) + 2.05);
  await play(
    new M.Transform(
      visible.scaledPiece,
      stripPart(
        0,
        PACF2,
        RES_Y,
        GREEN,
        0.95
      ),
      {
        runTime: 0.80
      }
    )
  );

  // 31. 0.14 divided by 0.56 is about a quarter.

  await until(S(31));
  await play(
    ...picture(
      rescalePicture(2)
    ),
    ...say(
      'PARTIAL AUTOCORRELATION = ONE QUARTER',
      GREEN
    ),
    ...fbox([
      '0.14 ÷ 0.56',
      ['≈ 0.25', GREEN],
      ['lag-2 partial autocorrelation', GREEN]
    ], GREEN)
  );

  // ============================================================
  // 32–34: summarize the rule and match the AR weight.
  // ============================================================

  // 32. Subtract the product of the neighboring links.

  await until(S(32));
  await play(
    ...picture(
      rulePicture(0)
    ),
    ...say(
      'FIRST: SUBTRACT THE NEIGHBORING-LINK PRODUCT',
      GREEN
    ),
    ...fbox([
      'full two-week link',
      ['− product of neighboring links', PINK]
    ], GREEN)
  );

  // 33. Divide by one minus that product.

  await until(S(33));
  await play(
    ...put(
      'picture',
      rulePicture(1)
    ),
    ...say(
      'THEN DIVIDE BY ONE MINUS THAT PRODUCT',
      GREEN
    ),
    ...fbox([
      'partial = (full − product)',
      '          ÷ (1 − product)',
      ['= 0.25', GREEN]
    ], GREEN)
  );

  // 34. This matches the lag-two weight in the AR(2) model.

  await until(S(34));
  await play(
    ...picture(
      coefficientMatch()
    ),
    ...say(
      'THE QUARTER MATCHES THE AR(2) LAG-2 WEIGHT',
      GREEN
    ),
    ...fbox([
      ['lag-2 PACF = 0.25', GREEN],
      ['lag-2 AR weight = 0.25', VIOLET],
      'same value in this model'
    ], GREEN)
  );

  // ============================================================
  // 35–38: test the next lag.
  // ============================================================

  // 35. Try three weeks back.
  // Allow for both intervening weeks.

  await until(S(35));
  await play(
    ...picture(
      fourCardPicture(0)
    ),
    ...say(
      'TRY LAG 3 WITH TWO MIDDLE WEEKS',
      VIOLET
    ),
    ...fbox([
      'compare week 3 with week 6',
      ['allow for weeks 4 and 5', VIOLET]
    ], VIOLET)
  );

  // 36. The original three-week link is positive.

  await until(S(36));
  await play(
    ...put(
      'picture',
      fourCardPicture(1)
    ),
    ...say(
      'THE FULL THREE-WEEK LINK IS POSITIVE',
      AMBER
    ),
    ...fbox([
      ['lag-3 autocorrelation ≈ 0.46', AMBER],
      'before allowing for the middle'
    ], AMBER)
  );

  // 37. After allowing for both middle weeks,
  // the remaining linear correlation is zero.

  await until(S(37));
  await play(
    ...put(
      'picture',
      fourCardPicture(2)
    ),
    ...say(
      'AFTER BOTH MIDDLE WEEKS: ZERO PARTIAL LINK',
      GREEN
    ),
    ...fbox([
      ['full lag-3 link ≈ 0.46', AMBER],
      ['partial lag-3 link = 0', GREEN]
    ], GREEN)
  );

  await until(S(37) + 2.00);
  await play(
    ...picture(
      zeroPartialPicture()
    )
  );

  // 38. Two earlier counts are sufficient in this model.

  await until(S(38));
  await play(
    ...picture(
      lagSelectionPicture(false)
    ),
    ...say(
      'TWO PAST COUNTS ARE ENOUGH HERE',
      GREEN
    ),
    ...fbox([
      ['lag 1: partial ≈ 0.67', GREEN],
      ['lag 2: partial = 0.25', GREEN],
      'lag 3: partial = 0'
    ], GREEN)
  );

  // ============================================================
  // 39–40: the trap and final recap.
  // ============================================================

  // 39. Do not add another lag solely because the
  // unadjusted autocorrelation is positive.

  await until(S(39));
  await play(
    ...picture(
      acfPacfPicture(2)
    ),
    ...say(
      'TRAP: A STRONG FULL LINK MAY ADD NOTHING',
      RED
    ),
    ...fbox([
      ['lag 3: full link ≈ 0.46', CYAN],
      ['lag 3: partial link = 0', GREEN],
      'check the middle weeks first'
    ], RED)
  );

  // 40. Final definition.
  //
  // Partial autocorrelation measures the linear link
  // at a chosen lag after allowing for the intervening
  // observations.
  //
  // For the supplied AR(2) model:
  //
  // ACF:  0.67, 0.58, 0.46
  // PACF: 0.67, 0.25, 0
  //
  // The partial correlation cuts off after lag two.
  // The ordinary autocorrelation can remain positive
  // at later lags.

  await until(S(40));
  await play(
    ...say(
      'PARTIAL AUTOCORRELATION: THE LINK LEFT AFTER THE MIDDLE',
      GREEN
    ),
    ...fbox([
      ['PARTIAL AUTOCORRELATION', GREEN],
      'compare the leftover gaps',
      'after allowing for intervening weeks'
    ], GREEN)
  );

  await until(S(40) + 2.40);
  await play(
    ...picture(
      lagSelectionPicture(false)
    ),
    ...say(
      'TWO USEFUL LAGS: AR(2)',
      GREEN
    ),
    ...fbox([
      ['lag 2: 0.14 ÷ 0.56 = 0.25', GREEN],
      ['lag 3: partial link = 0', GREEN],
      'two past counts are enough here'
    ], GREEN)
  );

  await until(E(40));
}
