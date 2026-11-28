// lesson 6.2.5
// Proportion intervals — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed shared chapter data and checked interval results.
// The binomial picture illustrates the shape near the 100% boundary.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [
    23, 25, 26, 26, 27, 28, 29, 30,
    30, 31, 32, 33, 34, 34, 35, 37
  ];

  const N = 16;
  const DEADLINE = 35;

  const ON_TIME = 15;
  const LATE = 1;

  const PHAT = ON_TIME / N;
  const QHAT = 1 - PHAT;

  const Z = 1.96;
  const SE = Math.sqrt(PHAT * QHAT / N);
  const MARGIN = Z * SE;

  // Checked Wald interval.
  const WALD_LO = PHAT - MARGIN;
  const WALD_HI = PHAT + MARGIN;

  // Checked Wilson interval.
  const Z2 = Z * Z;
  const DENOM = 1 + Z2 / N;

  const WILSON_CENTER =
    (PHAT + Z2 / (2 * N)) / DENOM;

  const WILSON_HALF =
    Z * Math.sqrt(
      PHAT * QHAT / N + Z2 / (4 * N * N)
    ) / DENOM;

  const WILSON_LO = WILSON_CENTER - WILSON_HALF;
  const WILSON_HI = WILSON_CENTER + WILSON_HALF;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Approved responsive layout.
  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.57, 0]
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.7 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -2.85 : -1.85;
  const NETY = P ? -0.60 : -0.40;

  const realX = v => LEFT + (v - 22) / 16 * W;

  // Percentage scales.
  const fullX = p => LEFT + p / 110 * W;
  const zoomX = p => LEFT + (p - 40) / 70 * W;
  const edgeX = p => LEFT + (p - 70) / 40 * W;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fade = xs => xs.map(x => new M.FadeOut(x));

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  }

  // Place a text so that its right edge ends at x.
  function leftOf(t, x) {
    const c = t.getCenter();
    t.moveTo([x - t.getWidth() / 2, c[1], 0]);
    return t;
  }

  function ln(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  function rect(w, h, x, y, color, opacity = 0.85, strokeWidth = 1) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  // Outline boxes are drawn directly from coordinates.
  function outline(x, y, w, h, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.moveTo([x, y, 0]);

    return r;
  }

  // Formula box, following the approved reference lesson.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

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

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 2.0 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // Number line with labelled ticks.
  function axis(xmap, values, y, unit = 'minutes', percent = false) {
    const parts = [
      ln(
        xmap(values[0]), y,
        xmap(values[values.length - 1]), y,
        C.muted, 3
      )
    ];

    values.forEach(v => {
      parts.push(
        ln(
          xmap(v), y - 0.07,
          xmap(v), y + 0.07,
          C.muted, 2
        ),

        txt(
          percent ? `${v}%` : String(v),
          P ? 16 : 14,
          C.muted,
          [xmap(v), y - 0.26, 0],
          true
        )
      );
    });

    if (unit) {
      parts.push(txt(
        unit,
        P ? 17 : 15,
        C.muted,
        [CX, y - 0.59, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Glowing data dots.
  function glowDot(x, y, color = C.cyan, radius = 0.10) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2,
      color
    });

    halo.setFill(color, 0.15);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  // Horizontal interval ("net") with endpoint caps.
  function net(xmap, lo, hi, y, color = C.cyan, cap = 0.13) {
    return new M.VGroup(
      ln(
        xmap(lo), y,
        xmap(hi), y,
        color, 5
      ),

      ln(
        xmap(lo), y - cap,
        xmap(lo), y + cap,
        color, 2
      ),

      ln(
        xmap(hi), y - cap,
        xmap(hi), y + cap,
        color, 2
      )
    );
  }

  function bracket(x1, x2, y, color = C.muted, cap = 0.08) {
    return new M.VGroup(
      ln(x1, y, x2, y, color, 2),

      ln(
        x1, y - cap,
        x1, y + cap,
        color, 2
      ),

      ln(
        x2, y - cap,
        x2, y + cap,
        color, 2
      )
    );
  }

  // One active main picture.
  // Incoming groups contain only fresh objects.
  let pictureNow = null;

  function picture(next) {
    const a = [];

    if (pictureNow) a.push(new M.FadeOut(pictureNow));

    if (next) a.push(new M.FadeIn(next));

    pictureNow = next;

    return a;
  }

  // ---------------------------------------------------------------
  // Reusable pictures.
  // ---------------------------------------------------------------

  // Sami's sixteen observed delivery times.
  // Duplicate observations stack vertically.
  function deliveryPicture({
    showDeadline = true,
    classify = 0,
    showCount = false
  } = {}) {
    const y = AY;
    const parts = [
      axis(realX, [22, 26, 30, 34, 38], y)
    ];

    const titleY = P ? 1.05 : 1.08;

    parts.push(txt(
      '16 observed deliveries',
      P ? 23 : 21,
      C.ink,
      [CX, titleY, 0]
    ));

    if (showDeadline) {
      const x = realX(DEADLINE);
      const top = P ? 0.05 : 0.10;

      if (classify >= 1) {
        parts.push(rect(
          x - LEFT,
          top - y,
          (LEFT + x) / 2,
          (top + y) / 2,
          C.green,
          0.055,
          0
        ));
      }

      if (classify >= 2) {
        parts.push(rect(
          RIGHT - x,
          top - y,
          (RIGHT + x) / 2,
          (top + y) / 2,
          MISS,
          0.055,
          0
        ));
      }

      parts.push(
        ln(x, y, x, top, GOLD, 3),

        txt(
          '35 min',
          P ? 19 : 17,
          GOLD,
          [x, top + 0.30, 0],
          true
        ),

        txt(
          'deadline',
          P ? 16 : 14,
          GOLD,
          [x, top - 0.28, 0]
        )
      );
    }

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i)
        .filter(x => x === v).length;

      let color = C.cyan;

      if (classify >= 1 && v <= DEADLINE) {
        color = C.green;
      }

      if (classify >= 2 && v > DEADLINE) {
        color = MISS;
      }

      parts.push(glowDot(
        realX(v),
        y + 0.24 + repeat * 0.31,
        color,
        P ? 0.085 : 0.095
      ));
    });

    if (classify >= 1) {
      parts.push(txt(
        '15 on time',
        P ? 23 : 21,
        C.green,
        [CX - 0.85, y + 1.23, 0]
      ));
    }

    if (classify >= 2) {
      parts.push(
        txt(
          '1 late',
          P ? 18 : 16,
          MISS,
          [realX(37), y + 0.92, 0]
        ),

        txt(
          '37',
          P ? 17 : 15,
          MISS,
          [realX(37), y + 0.57, 0],
          true
        )
      );
    }

    if (showCount) {
      parts.push(txt(
        '15 of 16 delivered on time',
        P ? 21 : 19,
        C.green,
        [CX, P ? -4.20 : -2.72, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // A simple parcel icon for the opening promise.
  function parcelPicture() {
    const y = P ? -0.82 : -0.60;

    const parcel = new M.RoundedRectangle({
      width: 1.85,
      height: 1.60,
      cornerRadius: 0.12,
      color: GOLD,
      strokeWidth: 2.5
    });

    parcel.setFill(GOLD, 0.20);
    parcel.moveTo([CX, y, 0]);

    const tape = rect(
      0.32,
      1.60,
      CX,
      y,
      GOLD,
      0.65,
      0
    );

    const clockX = CX + 1.32;
    const clockY = y + 0.86;

    const clock = new M.Circle({
      radius: 0.54,
      color: C.cyan,
      strokeWidth: 2.5
    });

    clock.setFill(C.card, 1);
    clock.moveTo([clockX, clockY, 0]);

    const hand1 = ln(
      clockX, clockY,
      clockX, clockY + 0.29,
      C.cyan, 3
    );

    const hand2 = ln(
      clockX, clockY,
      clockX + 0.24, clockY - 0.15,
      C.cyan, 3
    );

    return new M.VGroup(
      parcel,
      tape,
      clock,
      hand1,
      hand2,

      txt(
        'THE DELIVERY PROMISE',
        P ? 22 : 20,
        C.ink,
        [CX, y + 1.85, 0],
        true
      ),

      txt(
        'Within 35 minutes',
        P ? 27 : 24,
        GOLD,
        [CX, y - 1.38, 0]
      )
    );
  }

  // Sixteen yes-or-no observations, arranged as a four-by-four grid.
  // Optionally append four pretend observations for the Wilson analogy.
  function proportionPicture({
    pretend = false,
    showRate = false,
    showLabels = true,
    unknownTruth = false
  } = {}) {
    const total = pretend ? 20 : 16;

    const dx = P ? 0.76 : 0.66;
    const dy = P ? 0.73 : 0.51;

    const cols = 4;
    const rows = total / cols;

    const top = P ? 0.72 : 0.72;

    const parts = [];

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CX + (col - 1.5) * dx;
      const y = top - row * dy;

      const isPretend = i >= N;

      const onTime = i < N
        ? D1[i] <= DEADLINE
        : i < N + 2;

      const color = onTime ? C.green : MISS;

      if (isPretend) {
        const r = new M.RoundedRectangle({
          width: dx * 0.82,
          height: dy * 0.78,
          cornerRadius: 0.08,
          color: C.violet,
          strokeWidth: 1.5
        });

        r.setFill(C.violet, 0.07);
        r.moveTo([x, y, 0]);

        parts.push(r);
      }

      parts.push(glowDot(
        x,
        y,
        color,
        P ? 0.14 : 0.105
      ));

      parts.push(txt(
        onTime ? '✓' : '×',
        P ? 18 : 15,
        C.ink,
        [x, y, 0],
        true
      ));
    }

    parts.push(txt(
      pretend ? '16 real + 4 pretend' : '16 real deliveries',
      P ? 22 : 20,
      C.ink,
      [CX, top + 0.62, 0]
    ));

    if (pretend) {
      const extraY = top - 4 * dy;

      parts.push(
        outline(
          CX,
          extraY,
          4 * dx + 0.15,
          dy + 0.10,
          C.violet
        ),

        txt(
          'pretend',
          P ? 16 : 14,
          C.violet,
          [CX + 2.65 * dx, extraY, 0]
        )
      );
    }

    const bottom = top - (rows - 1) * dy;
    const labOff = pretend ? dy / 2 + 0.42 : 0.51;

    if (showLabels) {
      parts.push(
        txt(
          pretend ? '17 on time' : '15 on time',
          P ? 21 : 18,
          C.green,
          [CX - 1.02, bottom - labOff, 0]
        ),

        txt(
          pretend ? '3 late' : '1 late',
          P ? 21 : 18,
          MISS,
          [CX + 1.20, bottom - labOff, 0]
        )
      );
    }

    if (showRate) {
      parts.push(txt(
        pretend ? '17 ÷ 20 = 85%' : '15 ÷ 16 ≈ 94%',
        P ? 27 : 24,
        C.green,
        [CX, bottom - 1.00, 0],
        true
      ));
    }

    if (unknownTruth) {
      parts.push(txt(
        'True route proportion = ?',
        P ? 22 : 20,
        GOLD,
        [CX, bottom - 1.09, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // A proportion bar split into sixteen equal pieces.
  // The green share is 15/16 and the red share is 1/16.
  function sharePicture(showPercent = false) {
    const y = P ? -0.35 : -0.38;
    const h = P ? 0.66 : 0.53;

    const w = W - 0.30;
    const left = CX - w / 2;

    const cellW = w / N;

    const parts = [];

    for (let i = 0; i < N; i++) {
      parts.push(rect(
        cellW - 0.025,
        h,
        left + (i + 0.5) * cellW,
        y,
        i < ON_TIME ? C.green : MISS,
        0.85,
        0
      ));
    }

    parts.push(
      bracket(
        left,
        left + ON_TIME * cellW,
        y + h / 2 + 0.23,
        C.green
      ),

      txt(
        '15 on time',
        P ? 22 : 20,
        C.green,
        [
          left + ON_TIME * cellW / 2,
          y + h / 2 + 0.57,
          0
        ]
      ),

      txt(
        '1 late',
        P ? 17 : 15,
        MISS,
        [
          left + 15.5 * cellW - 0.15,
          y - h / 2 - 0.37,
          0
        ]
      ),

      txt(
        '16 deliveries in total',
        P ? 21 : 19,
        C.ink,
        [CX, y - 1.03, 0]
      )
    );

    if (showPercent) {
      parts.push(
        txt(
          '93.75%',
          P ? 38 : 33,
          C.green,
          [CX, y + 1.48, 0],
          true
        ),

        txt(
          '≈ 94% on time',
          P ? 23 : 21,
          C.green,
          [CX, y - 1.72, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // A real proportion estimate on a percentage line.
  // No true proportion is shown: it remains unknown.
  function estimatePicture(showArms = false) {
    const y = NETY;
    const base = P ? -2.85 : -1.95;

    const x = fullX(PHAT * 100);

    const parts = [
      axis(
        fullX,
        [0, 20, 40, 60, 80, 100, 110],
        base,
        'on-time proportion',
        true
      ),

      glowDot(
        x,
        y,
        C.violet,
        0.13
      ),

      txt(
        '93.75%',
        P ? 22 : 20,
        C.violet,
        [x - 0.20, y + 0.46, 0],
        true
      ),

      txt(
        'sample estimate',
        P ? 18 : 16,
        C.violet,
        [x - 0.30, y + 0.88, 0]
      ),

      txt(
        'True proportion = ?',
        P ? 22 : 20,
        GOLD,
        [CX, y - 0.85, 0]
      )
    ];

    if (showArms) {
      parts.push(
        new M.DashedLine({
          start: [fullX(82), y, 0],
          end: [x, y, 0],
          color: C.cyan
        }),

        new M.DashedLine({
          start: [x, y, 0],
          end: [fullX(106), y, 0],
          color: C.cyan
        }),

        txt(
          'How far each way?',
          P ? 20 : 18,
          C.cyan,
          [CX, y + 1.46, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // The two observed shares used in the proportion SE formula.
  function standardErrorPicture(stage = 0) {
    const barY = P ? 0.26 : 0.35;

    const w = W - 0.40;
    const left = CX - w / 2;

    const greenW = w * PHAT;
    const redW = w * QHAT;

    const parts = [
      rect(
        greenW,
        0.48,
        left + greenW / 2,
        barY,
        C.green,
        0.83,
        0
      ),

      rect(
        redW,
        0.48,
        left + greenW + redW / 2,
        barY,
        MISS,
        0.83,
        0
      ),

      txt(
        'On-time share',
        P ? 21 : 19,
        C.green,
        [CX - 0.45, barY + 0.65, 0]
      ),

      txt(
        '0.9375',
        P ? 23 : 21,
        C.green,
        [CX - 0.45, barY - 0.47, 0],
        true
      ),

      leftOf(txt(
        'Late share',
        P ? 20 : 17,
        MISS,
        [0, barY + 0.65, 0]
      ), RIGHT - 0.15),

      leftOf(txt(
        '0.0625',
        P ? 21 : 18,
        MISS,
        [0, barY - 0.47, 0],
        true
      ), RIGHT - 0.15)
    ];

    if (stage >= 1) {
      const y = P ? -1.62 : -1.10;

      const expression = txt(
        '0.9375 × 0.0625 ÷ 16',
        P ? 23 : 21,
        C.ink,
        [CX, y, 0],
        true
      );

      const label = txt(
        'Then take the square root',
        P ? 20 : 18,
        GOLD,
        [CX, y - 0.52, 0]
      );

      parts.push(expression, label);
    }

    if (stage >= 2) {
      parts.push(txt(
        'SE ≈ 0.06 = 6 percentage points',
        P ? 20 : 18,
        C.violet,
        [CX, P ? -3.20 : -2.28, 0],
        true
      ));
    }

    return new M.VGroup(...parts);
  }

  // The 100% boundary.
  // Used to show that the Wald interval leaves the possible domain.
  function wall(xmap, bottom, top, showForbidden = true) {
    const x = xmap(100);
    const parts = [];

    if (showForbidden) {
      parts.push(rect(
        RIGHT - x,
        top - bottom,
        (RIGHT + x) / 2,
        (top + bottom) / 2,
        MISS,
        0.10,
        0
      ));

      const hatchCount = P ? 10 : 8;

      for (let i = 0; i < hatchCount; i++) {
        const y = bottom +
          (i + 0.5) / hatchCount * (top - bottom);

        const endY = Math.min(top, y + 0.34);

        parts.push(ln(
          x + 0.04,
          y,
          RIGHT - 0.04,
          endY,
          MISS,
          0.8
        ));
      }
    }

    parts.push(
      ln(x, bottom, x, top, GOLD, 3),

      txt(
        '100%',
        P ? 19 : 17,
        GOLD,
        [x, top + 0.30, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Wald interval, constructed in stages.
  // Exact calculated endpoints: approximately 81.9% and 105.6%.
  function waldPicture({
    stage = 2,
    showWall = false,
    showError = false,
    showName = false
  } = {}) {
    const y = NETY;
    const base = P ? -2.85 : -1.95;

    const lo = WALD_LO * 100;
    const hi = WALD_HI * 100;
    const mid = PHAT * 100;

    const parts = [
      axis(
        edgeX,
        [70, 80, 90, 100, 110],
        base,
        'on-time proportion',
        true
      )
    ];

    if (showWall) {
      parts.push(wall(
        edgeX,
        base,
        P ? 0.65 : 0.82,
        true
      ));
    }

    if (stage >= 1) {
      parts.push(
        net(
          edgeX,
          lo,
          mid,
          y,
          C.cyan,
          0.13
        ),

        txt(
          '−11.9 pts',
          P ? 17 : 15,
          C.cyan,
          [(edgeX(lo) + edgeX(mid)) / 2, y + 0.34, 0],
          true
        ),

        txt(
          '81.9%',
          P ? 21 : 19,
          C.cyan,
          [edgeX(lo), y - 0.42, 0],
          true
        )
      );
    }

    if (stage >= 2) {
      const color = showError ? MISS : C.cyan;

      parts.push(
        net(
          edgeX,
          mid,
          hi,
          y,
          color,
          0.13
        ),

        txt(
          '+11.9 pts',
          P ? 17 : 15,
          color,
          [(edgeX(mid) + edgeX(hi)) / 2, y + 0.34, 0],
          true
        ),

        txt(
          '105.6%',
          P ? 21 : 19,
          color,
          [edgeX(hi), y - 0.42, 0],
          true
        )
      );
    }

    parts.push(
      glowDot(
        edgeX(mid),
        y,
        C.violet,
        0.12
      ),

      txt(
        '93.75%',
        P ? 22 : 20,
        C.violet,
        [edgeX(mid), y + 0.83, 0],
        true
      )
    );

    if (showError) {
      parts.push(
        ln(
          edgeX(100), y,
          edgeX(hi), y,
          MISS, 7
        ),

        txt(
          'IMPOSSIBLE',
          P ? 20 : 18,
          MISS,
          [CX, y - 1.04, 0],
          true
        )
      );
    }

    if (showName) {
      parts.push(txt(
        'Wald interval',
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.13 : 1.14, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Binomial probability for k on-time deliveries in n trials.
  function binomialProbability(n, k, p) {
    let choose = 1;

    for (let i = 1; i <= k; i++) {
      choose *= (n - i + 1) / i;
    }

    return choose *
      Math.pow(p, k) *
      Math.pow(1 - p, n - k);
  }

  // Show the pile of possible proportions near 100%.
  // This is the exact binomial model for an illustrative true rate
  // of 93.75%, not a claim about Sami's unknown true rate.
  function skewedPilePicture() {
    const x = p => LEFT + (p - 50) / 60 * W;

    const base = P ? -3.40 : -2.12;
    const height = P ? 3.65 : 2.55;

    const modelP = PHAT;

    const probs = Array.from(
      { length: N + 1 },
      (_, k) => binomialProbability(N, k, modelP)
    );

    const maxProb = Math.max(...probs);

    const parts = [
      axis(
        x,
        [50, 60, 70, 80, 90, 100, 110],
        base,
        'possible sample proportions',
        true
      ),

      wall(
        x,
        base,
        base + height + 0.07,
        true
      )
    ];

    for (let k = 8; k <= N; k++) {
      const value = k / N * 100;
      const prob = probs[k];

      const h = Math.max(
        0.001,
        prob / maxProb * height
      );

      const bw = W * 0.065;

      parts.push(rect(
        bw,
        h,
        x(value),
        base + h / 2,
        C.cyan,
        0.80,
        1
      ));
    }

    // Dashed vertical line marks 15 of 16.
    parts.push(new M.DashedLine({
      start: [x(93.75), base, 0],
      end: [x(93.75), base + height + 0.07, 0],
      color: C.violet
    }));

    parts.push(
      txt(
        'Possible shares near 100%',
        P ? 22 : 20,
        C.ink,
        [CX, base + height + 0.48, 0]
      ),

      txt(
        'Longer tail to the left',
        P ? 18 : 16,
        C.cyan,
        [x(72), base + height * 0.42, 0]
      ),

      txt(
        'Cannot go',
        P ? 15 : 13,
        MISS,
        [x(105), base + height * 0.65, 0]
      ),

      txt(
        'past 100%',
        P ? 15 : 13,
        MISS,
        [x(105), base + height * 0.65 - 0.32, 0]
      ),

      txt(
        'Illustrative binomial model',
        P ? 15 : 13,
        C.muted,
        [CX, base - 0.98, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Flip the question:
  // Instead of a fixed net around the observed estimate,
  // test each possible true proportion using its own standard error.
  function flippedQuestionPicture() {
    const y1 = P ? 0.22 : 0.25;
    const y2 = P ? -1.62 : -1.12;

    const base = P ? -3.35 : -2.20;

    const x = zoomX;

    const obs = PHAT * 100;

    const parts = [
      axis(
        x,
        [40, 50, 60, 70, 80, 90, 100, 110],
        base,
        'percentage scale',
        true
      ),

      net(
        x,
        WALD_LO * 100,
        WALD_HI * 100,
        y1,
        C.muted,
        0.13
      ),

      glowDot(
        x(obs),
        y1,
        C.violet,
        0.11
      ),

      txt(
        'Old question',
        P ? 22 : 20,
        C.muted,
        [CX, y1 + 0.56, 0]
      ),

      txt(
        'How far from our estimate?',
        P ? 18 : 16,
        C.muted,
        [CX, y1 - 0.41, 0]
      ),

      glowDot(
        x(obs),
        y2,
        C.violet,
        0.11
      ),

      glowDot(
        x(72),
        y2,
        GOLD,
        0.10
      ),

      ln(
        x(72), y2,
        x(obs), y2,
        C.cyan, 3
      ),

      txt(
        'New question',
        P ? 22 : 20,
        C.cyan,
        [CX, y2 + 0.57, 0]
      ),

      txt(
        'Would this candidate explain 15/16?',
        P ? 18 : 16,
        C.cyan,
        [CX, y2 - 0.42, 0]
      ),

      txt(
        'candidate',
        P ? 16 : 14,
        GOLD,
        [x(72), y2 + 0.26, 0]
      )
    ];

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Wilson score-test picture.
  //
  // For a candidate true proportion p:
  //
  // SE(p) = sqrt(p(1-p)/n)
  //
  // Keep p when:
  // abs(observed proportion - p) <= 1.96 * SE(p)
  //
  // The acceptance band is drawn on the scale of possible observed
  // proportions, and visually clipped at 0% and 100%.
  // ---------------------------------------------------------------

  function candidateStats(p) {
    const se = Math.sqrt(p * (1 - p) / N);

    const reach = Z * se;

    const error = Math.abs(PHAT - p);

    const score = error / se;

    return {
      p,
      se,
      reach,
      error,
      score,
      lo: p - reach,
      hi: p + reach,
      keep: score <= Z
    };
  }

  function candidatePicture(p, reveal = true) {
    const stat = candidateStats(p);

    const y = P ? -0.70 : -0.55;
    const base = P ? -3.15 : -2.15;

    const obs = PHAT * 100;
    const candidate = p * 100;

    const x = zoomX;

    const lo = Math.max(0, stat.lo * 100);
    const hi = Math.min(100, stat.hi * 100);

    const bandColor = reveal
      ? stat.keep ? C.green : MISS
      : C.cyan;

    const parts = [
      axis(
        x,
        [40, 50, 60, 70, 80, 90, 100, 110],
        base,
        'possible observed proportions',
        true
      ),

      wall(
        x,
        base,
        P ? 0.84 : 0.95,
        true
      ),

      rect(
        x(hi) - x(lo),
        P ? 0.69 : 0.53,
        (x(lo) + x(hi)) / 2,
        y,
        C.cyan,
        0.12,
        1
      ),

      net(
        x,
        lo,
        hi,
        y,
        C.cyan,
        0.16
      ),

      ln(
        x(candidate),
        y - 0.30,
        x(candidate),
        y + 0.74,
        GOLD,
        2.7
      ),

      glowDot(
        x(candidate),
        y,
        GOLD,
        0.085
      ),

      glowDot(
        x(obs),
        y,
        C.violet,
        0.125
      ),

      txt(
        `Try true rate = ${candidate.toFixed(0)}%`,
        P ? 24 : 22,
        GOLD,
        [CX, P ? 1.30 : 1.30, 0],
        true
      ),

      txt(
        'Expected range of observations',
        P ? 19 : 17,
        C.cyan,
        [CX, y + 0.96, 0]
      ),

      leftOf(txt(
        'Observed: 93.75%',
        P ? 19 : 17,
        C.violet,
        [0, P ? y - 0.62 : y - 0.55, 0],
        true
      ), x(obs) + 0.10),

      leftOf(txt(
        `Candidate: ${candidate.toFixed(0)}%`,
        P ? 17 : 15,
        GOLD,
        [0, y + 0.52, 0],
        true
      ), x(candidate) - 0.14)
    ];

    if (reveal) {
      parts.push(
        txt(
          stat.keep ? 'KEEP' : 'REJECT',
          P ? 29 : 25,
          bandColor,
          [CX, P ? -2.00 : -1.62, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Four tested candidate rates with a visual decision.
  function candidateSummary(showSE = false) {
    const items = [0.98, 0.99, 0.72, 0.70];

    const top = P ? 0.80 : 0.91;
    const pitch = P ? 0.99 : 0.71;

    const parts = [
      txt(
        showSE
          ? 'Each rate uses its own SE'
          : 'Which candidates survive?',
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.57, 0]
      )
    ];

    items.forEach((p, i) => {
      const stat = candidateStats(p);

      const y = top - i * pitch;

      const color = stat.keep ? C.green : MISS;

      const card = new M.RoundedRectangle({
        width: W - 0.35,
        height: pitch * 0.80,
        cornerRadius: 0.09,
        color,
        strokeWidth: 1.5
      });

      card.setFill(color, 0.055);
      card.moveTo([CX, y, 0]);

      parts.push(
        card,

        txt(
          `${Math.round(p * 100)}%`,
          P ? 24 : 21,
          GOLD,
          [CX - W * 0.34, y, 0],
          true
        ),

        txt(
          showSE
            ? `SE ${(stat.se * 100).toFixed(2)} pts`
            : `${stat.score.toFixed(2)} SE away`,
          P ? 17 : 15,
          C.ink,
          [CX - 0.05, y, 0],
          true
        ),

        txt(
          stat.keep ? 'KEEP' : 'REJECT',
          P ? 19 : 17,
          color,
          [CX + W * 0.32, y, 0],
          true
        )
      );
    });

    parts.push(txt(
      showSE
        ? 'Different candidates, different rulers'
        : 'Keep if distance is at most 1.96 SE',
      P ? 18 : 16,
      C.muted,
      [CX, top - 3 * pitch - 0.66, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Show a sweep of candidate rates.
  // The accepted region is calculated using each candidate's own SE.
  function acceptedRatesPicture(showInterval = true) {
    const x = p => LEFT + (p - 60) / 40 * W;

    const y = P ? -0.42 : -0.28;
    const base = P ? -2.78 : -1.97;

    const parts = [
      axis(
        x,
        [60, 70, 80, 90, 100],
        base,
        'candidate true on-time rates',
        true
      ),

      txt(
        'Test all candidate rates',
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.15 : 1.13, 0]
      )
    ];

    for (let rate = 60; rate <= 100; rate++) {
      const p = rate / 100;

      let keep = false;

      if (p > 0 && p < 1) {
        keep = candidateStats(p).keep;
      } else {
        keep = PHAT === p;
      }

      parts.push(glowDot(
        x(rate),
        y,
        keep ? C.green : MISS,
        P ? 0.055 : 0.045
      ));
    }

    const a = WILSON_LO * 100;
    const b = WILSON_HI * 100;

    if (showInterval) {
      const intervalY = y + 0.55;

      parts.push(
        net(
          x,
          a,
          b,
          intervalY,
          C.green,
          0.14
        ),

        txt(
          '71.7%',
          P ? 21 : 19,
          C.green,
          [x(a), intervalY + 0.34, 0],
          true
        ),

        txt(
          '98.9%',
          P ? 21 : 19,
          C.green,
          [x(b) - 0.08, intervalY + 0.34, 0],
          true
        ),

        txt(
          'All kept rates form one interval',
          P ? 20 : 18,
          C.green,
          [CX, y - 0.74, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Wilson interval on a legal 0–100% percentage scale.
  // The sample proportion and the interval centre are distinguished.
  function wilsonPicture({
    showCenter = false,
    rounded = false,
    showTitle = true
  } = {}) {
    const x = edgeX;

    const y = NETY;
    const base = P ? -2.88 : -1.98;

    const lo = WILSON_LO * 100;
    const hi = WILSON_HI * 100;
    const center = WILSON_CENTER * 100;

    const parts = [
      axis(
        x,
        [70, 80, 90, 100, 110],
        base,
        'on-time proportion',
        true
      ),

      wall(
        x,
        base,
        P ? 0.71 : 0.79,
        true
      ),

      net(
        x,
        lo,
        hi,
        y,
        C.green,
        0.17
      ),

      txt(
        rounded ? '≈72%' : '71.7%',
        P ? 24 : 21,
        C.green,
        [x(lo) + 0.05, y - 0.40, 0],
        true
      ),

      txt(
        rounded ? '≈99%' : '98.9%',
        P ? 24 : 21,
        C.green,
        [x(hi) - 0.12, y - 0.40, 0],
        true
      ),

      glowDot(
        x(PHAT * 100),
        y,
        C.violet,
        0.105
      ),

      txt(
        'estimate',
        P ? 16 : 14,
        C.violet,
        [x(PHAT * 100), y + 0.35, 0]
      ),

      txt(
        '93.75%',
        P ? 19 : 17,
        C.violet,
        [x(PHAT * 100), y + 0.66, 0],
        true
      )
    ];

    if (showTitle) {
      parts.push(txt(
        '95% Wilson interval',
        P ? 24 : 22,
        C.green,
        [CX, P ? 1.20 : 1.20, 0]
      ));
    }

    if (showCenter) {
      parts.push(
        glowDot(
          x(center),
          y,
          GOLD,
          0.105
        ),

        txt(
          'centre',
          P ? 17 : 15,
          GOLD,
          [x(center), y + 0.35, 0]
        ),

        txt(
          '85.3%',
          P ? 19 : 17,
          GOLD,
          [x(center), y + 0.66, 0],
          true
        ),

        bracket(
          x(center),
          x(PHAT * 100),
          y - 0.94,
          GOLD
        ),

        txt(
          'Pulled away from the wall',
          P ? 18 : 16,
          GOLD,
          [CX, y - 1.28, 0]
        )
      );
    } else {
      parts.push(txt(
        'A range for the true on-time share',
        P ? 20 : 18,
        C.ink,
        [CX, y - 1.04, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Compare the Wald and Wilson intervals on the same percentage scale.
  function compareIntervals({
    showCenter = false,
    highlightInvalid = true
  } = {}) {
    const x = edgeX;

    const upperY = P ? 0.32 : 0.44;
    const lowerY = P ? -1.63 : -1.11;

    const base = P ? -3.55 : -2.30;

    const parts = [
      axis(
        x,
        [70, 80, 90, 100, 110],
        base,
        'on-time proportion',
        true
      ),

      wall(
        x,
        base,
        upperY + 0.19,
        true
      ),

      net(
        x,
        WALD_LO * 100,
        WALD_HI * 100,
        upperY,
        C.cyan,
        0.14
      ),

      glowDot(
        x(PHAT * 100),
        upperY,
        C.violet,
        0.09
      ),

      txt(
        'Wald: simple interval',
        P ? 21 : 19,
        C.cyan,
        [CX, upperY + 0.59, 0]
      ),

      txt(
        '81.9%',
        P ? 18 : 16,
        C.cyan,
        [x(WALD_LO * 100), upperY - 0.36, 0],
        true
      ),

      txt(
        '105.6%',
        P ? 18 : 16,
        highlightInvalid ? MISS : C.cyan,
        [x(WALD_HI * 100) - 0.08, upperY - 0.36, 0],
        true
      ),

      net(
        x,
        WILSON_LO * 100,
        WILSON_HI * 100,
        lowerY,
        C.green,
        0.14
      ),

      glowDot(
        x(PHAT * 100),
        lowerY,
        C.violet,
        0.09
      ),

      txt(
        'Wilson: stays inside the limits',
        P ? 21 : 19,
        C.green,
        [CX, lowerY + 0.57, 0]
      ),

      txt(
        '71.7%',
        P ? 18 : 16,
        C.green,
        [x(WILSON_LO * 100), lowerY - 0.36, 0],
        true
      ),

      txt(
        '98.9%',
        P ? 18 : 16,
        C.green,
        [x(WILSON_HI * 100), lowerY - 0.36, 0],
        true
      )
    ];

    if (highlightInvalid) {
      parts.push(ln(
        x(100),
        upperY,
        x(WALD_HI * 100),
        upperY,
        MISS,
        7
      ));
    }

    if (showCenter) {
      parts.push(
        glowDot(
          x(WILSON_CENTER * 100),
          lowerY,
          GOLD,
          0.10
        ),

        txt(
          '85.3%',
          P ? 17 : 15,
          GOLD,
          [x(WILSON_CENTER * 100), lowerY - 0.37, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Wilson formula displayed as a genuine fraction.
  //
  // [p̂ + z²/(2n) ± z sqrt(p̂(1-p̂)/n + z²/(4n²))]
  // ------------------------------------------------------
  //                      1 + z²/n
  //
  // Formula components are positioned before grouping.
  // ---------------------------------------------------------------

  function wilsonFormulaPicture() {
    const y = P ? -0.65 : -0.50;

    const num1 = T(
      'p̂ + z²/(2n)',
      P ? 25 : 23,
      C.violet,
      true
    );

    const num2 = T(
      '± z√(p̂(1−p̂)/n + z²/(4n²))',
      P ? 21 : 19,
      C.cyan,
      true
    );

    const denominator = T(
      '1 + z²/n',
      P ? 25 : 23,
      C.ink,
      true
    );

    const fracW = Math.max(
      num1.getWidth(),
      num2.getWidth(),
      denominator.getWidth()
    ) + 0.35;

    num1.moveTo([CX, y + 0.85, 0]);
    num2.moveTo([CX, y + 0.37, 0]);
    denominator.moveTo([CX, y - 0.44, 0]);

    const fracLine = ln(
      CX - fracW / 2,
      y,
      CX + fracW / 2,
      y,
      C.ink,
      2
    );

    const expression = new M.VGroup(
      num1,
      num2,
      denominator,
      fracLine
    );

    const maxw = W - 0.20;

    if (expression.getWidth() > maxw) {
      expression.scale(maxw / expression.getWidth());
    }

    expression.moveTo([CX, y, 0]);

    return new M.VGroup(
      expression,

      txt(
        'WILSON INTERVAL',
        P ? 24 : 22,
        C.green,
        [CX, P ? 1.16 : 1.17, 0],
        true
      ),

      txt(
        'p̂ = observed proportion',
        P ? 19 : 17,
        C.violet,
        [CX, y - 1.18, 0]
      ),

      txt(
        'n = sample size',
        P ? 19 : 17,
        C.ink,
        [CX, y - 1.60, 0]
      ),

      txt(
        'z = 1.96 for 95% confidence',
        P ? 19 : 17,
        GOLD,
        [CX, y - 2.02, 0]
      )
    );
  }

  // The Wilson method expressed as a distance test,
  // rather than the full algebraic interval formula.
  function scoreRulePicture() {
    const y = P ? -0.45 : -0.40;

    const num = T(
      '|observed − candidate|',
      P ? 24 : 22,
      C.violet,
      true
    );

    const den = T(
      'candidate’s own SE',
      P ? 24 : 22,
      C.cyan,
      true
    );

    const fracW = Math.max(
      num.getWidth(),
      den.getWidth()
    ) + 0.30;

    num.moveTo([CX - 0.65, y + 0.38, 0]);
    den.moveTo([CX - 0.65, y - 0.38, 0]);

    const frac = new M.VGroup(
      num,
      den,

      ln(
        CX - 0.65 - fracW / 2,
        y,
        CX - 0.65 + fracW / 2,
        y,
        C.ink,
        2
      )
    );

    const result = T(
      '≤ 1.96',
      P ? 27 : 25,
      C.green,
      true
    );

    result.moveTo([
      CX - 0.65 + fracW / 2 + result.getWidth() / 2 + 0.20,
      y,
      0
    ]);

    const expression = new M.VGroup(frac, result);

    if (expression.getWidth() > W - 0.20) {
      expression.scale(
        (W - 0.20) / expression.getWidth()
      );
    }

    expression.moveTo([CX, y, 0]);

    return new M.VGroup(
      expression,

      txt(
        'KEEP THE CANDIDATE IF...',
        P ? 22 : 20,
        C.green,
        [CX, y + 1.30, 0],
        true
      ),

      txt(
        'Observed result is not too far away',
        P ? 21 : 19,
        C.ink,
        [CX, y - 1.06, 0]
      ),

      txt(
        'Distance measured in its own SE',
        P ? 18 : 16,
        C.muted,
        [CX, y - 1.53, 0]
      )
    );
  }

  // General yes-or-no applications.
  // Icons are simple labels and representative binary outcomes.
  function applicationsPicture() {
    const items = [
      ['ON TIME', 'Late'],
      ['CLICKED', 'Not clicked'],
      ['PASSED', 'Not passed'],
      ['VOTED', 'Did not vote']
    ];

    const top = P ? 0.83 : 0.91;
    const pitch = P ? 1.02 : 0.74;

    const parts = [];

    items.forEach(([yes, no], i) => {
      const y = top - i * pitch;

      const card = new M.RoundedRectangle({
        width: W - 0.35,
        height: pitch * 0.80,
        cornerRadius: 0.10,
        color: C.muted,
        strokeWidth: 1.5
      });

      card.setFill(C.card, 0.90);
      card.moveTo([CX, y, 0]);

      const yesX = CX - W * 0.35;
      const noX = CX + W * 0.08;

      parts.push(
        card,

        glowDot(
          yesX,
          y,
          C.green,
          P ? 0.11 : 0.085
        ),

        txt(
          '✓',
          P ? 16 : 14,
          C.ink,
          [yesX, y, 0],
          true
        ),

        txt(
          yes,
          P ? 18 : 16,
          C.green,
          [CX - W * 0.17, y, 0],
          true
        ),

        glowDot(
          noX,
          y,
          MISS,
          P ? 0.11 : 0.085
        ),

        txt(
          '×',
          P ? 16 : 14,
          C.ink,
          [noX, y, 0],
          true
        ),

        txt(
          no,
          P ? 18 : 16,
          C.ink,
          [CX + W * 0.29, y, 0]
        )
      );
    });

    parts.push(txt(
      'Any yes-or-no result',
      P ? 21 : 19,
      C.cyan,
      [CX, top - 3 * pitch - 0.67, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Illustrate that Wilson intervals respect both boundaries.
  // Example proportions are explicitly illustrative.
  function legalBoundsPicture() {
    const examples = [
      {
        p: 1 / 16,
        n: 16,
        label: '1 of 16'
      },
      {
        p: 8 / 16,
        n: 16,
        label: '8 of 16'
      },
      {
        p: 15 / 16,
        n: 16,
        label: '15 of 16'
      }
    ];

    const x = p => LEFT + p / 100 * W;

    const top = P ? 0.72 : 0.80;
    const pitch = P ? 1.35 : 0.91;

    const base = P ? -3.45 : -2.25;

    const parts = [
      axis(
        x,
        [0, 20, 40, 60, 80, 100],
        base,
        'legal proportion range',
        true
      ),

      ln(
        x(0), base,
        x(0), top + 0.38,
        GOLD, 3
      ),

      ln(
        x(100), base,
        x(100), top + 0.38,
        GOLD, 3
      )
    ];

    examples.forEach(({ p, n, label }, i) => {
      const den = 1 + Z2 / n;

      const center =
        (p + Z2 / (2 * n)) / den;

      const half =
        Z * Math.sqrt(
          p * (1 - p) / n +
          Z2 / (4 * n * n)
        ) / den;

      const lo = Math.max(0, center - half) * 100;
      const hi = Math.min(1, center + half) * 100;

      const y = top - i * pitch;

      parts.push(
        net(
          x,
          lo,
          hi,
          y,
          C.green,
          0.13
        ),

        glowDot(
          x(p * 100),
          y,
          C.violet,
          P ? 0.085 : 0.065
        ),

        txt(
          label,
          P ? 18 : 16,
          C.ink,
          [
            Math.max(
              LEFT + 0.65,
              Math.min(RIGHT - 0.65, x(p * 100))
            ),
            y + 0.36,
            0
          ],
          true
        )
      );
    });

    parts.push(txt(
      'All intervals stay within 0–100%',
      P ? 19 : 17,
      C.green,
      [CX, base - 0.98, 0]
    ));

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // 0: Sami's company promises every delivery within 35 minutes.
  // ---------------------------------------------------------------

  const promise = parcelPicture();

  await until(S(0));
  await play(
    ...picture(promise),
    ...say('EVERY DELIVERY WITHIN 35 MINUTES', GOLD),
    ...fbox([
      'Company promise',
      ['35 minutes or less', GOLD],
      'Did we keep it?'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 1: Mark 35 on Sami's line of sixteen deliveries.
  // ---------------------------------------------------------------

  const deadlinePicture = deliveryPicture({
    showDeadline: true,
    classify: 0
  });

  await until(S(1));
  await play(
    ...picture(deadlinePicture),
    ...say('MARK THE 35-MINUTE DEADLINE', GOLD),
    ...fbox([
      '16 observed deliveries',
      ['deadline = 35', GOLD],
      'On time if ≤ 35'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 2: Fifteen dots are at thirty-five or less.
  // ---------------------------------------------------------------

  const onTimePicture = deliveryPicture({
    showDeadline: true,
    classify: 1
  });

  await until(S(2));
  await play(
    ...picture(onTimePicture),
    ...say('15 DELIVERIES WERE ON TIME', C.green),
    ...fbox([
      ['Time ≤ 35 minutes', C.green],
      '15 observations',
      ['ON TIME', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 3: One dot, at thirty-seven minutes, is late.
  // ---------------------------------------------------------------

  const latePicture = deliveryPicture({
    showDeadline: true,
    classify: 2
  });

  await until(S(3));
  await play(
    ...picture(latePicture),
    ...say('ONE DELIVERY WAS LATE', MISS),
    ...fbox([
      '37 > 35',
      ['1 late delivery', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 4: Fifteen out of sixteen were on time.
  // ---------------------------------------------------------------

  const countPicture = proportionPicture({
    showRate: false
  });

  await until(S(4));
  await play(
    ...picture(countPicture),
    ...say('15 OUT OF 16 ON TIME', C.green),
    ...fbox([
      ['on time = 15', C.green],
      ['late    = 1', MISS],
      'total   = 16'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 5: Fifteen divided by sixteen is approximately 94%.
  // ---------------------------------------------------------------

  const share = sharePicture(true);

  await until(S(5));
  await play(
    ...picture(share),
    ...say('15 ÷ 16 ≈ 94%', C.green),
    ...fbox([
      '15 ÷ 16',
      '= 0.9375',
      ['≈ 0.94', C.green],
      ['≈ 94%', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 6: A share of a group is called a proportion.
  // ---------------------------------------------------------------

  await until(S(6));
  await play(
    ...say('PROPORTION = A SHARE OF A GROUP', C.green),
    ...fbox([
      ['proportion', C.green],
      'Number with the result',
      '÷ total number'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 7: The true route proportion is unknown.
  // Sixteen deliveries are only a sample.
  // ---------------------------------------------------------------

  const unknown = proportionPicture({
    showRate: false,
    unknownTruth: true
  });

  await until(S(7));
  await play(
    ...picture(unknown),
    ...say('THE TRUE ON-TIME SHARE IS UNKNOWN', GOLD),
    ...fbox([
      ['Sample proportion = 94%', C.violet],
      ['True proportion = ?', GOLD],
      'Only 16 deliveries'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 8: Build an interval for the unknown proportion.
  // ---------------------------------------------------------------

  const estimateOnly = estimatePicture(false);

  await until(S(8));
  await play(
    ...picture(estimateOnly),
    ...say('LET’S BUILD A NET'),
    ...fbox([
      ['estimate = 93.75%', C.violet],
      'Find a sensible range'
    ])
  );

  // ---------------------------------------------------------------
  // 9: The simple recipe: estimate ± about two standard errors.
  // ---------------------------------------------------------------

  const simpleRecipe = estimatePicture(true);

  await until(S(9));
  await play(
    ...picture(simpleRecipe),
    ...say('ESTIMATE ± ABOUT 2 STANDARD ERRORS'),
    ...fbox([
      ['estimate ± margin', C.violet],
      'margin = 1.96 × SE',
      'First find the SE.'
    ])
  );

  // ---------------------------------------------------------------
  // 10: For a proportion, the SE comes from the proportion itself.
  // ---------------------------------------------------------------

  const twoShares = standardErrorPicture(0);

  await until(S(10));
  await play(
    ...picture(twoShares),
    ...say('THE STANDARD ERROR COMES FROM THE SHARE', C.violet),
    ...fbox([
      ['on-time share = 0.9375', C.green],
      ['late share = 0.0625', MISS],
      'sample size = 16'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 11: Multiply the shares, divide by n, take the square root.
  // ---------------------------------------------------------------

  const seFormula = standardErrorPicture(1);

  await until(S(11));
  await play(
    ...picture(seFormula),
    ...say('MULTIPLY · DIVIDE · SQUARE ROOT', GOLD),
    ...fbox([
      'SE = √(p̂ × (1−p̂) / n)',
      '   = √(0.9375 × 0.0625',
      '        ÷ 16)'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 12: Standard error ≈ 0.06, or six percentage points.
  // ---------------------------------------------------------------

  const seResult = standardErrorPicture(2);

  await until(S(12));
  await play(
    ...picture(seResult),
    ...say('STANDARD ERROR ≈ 6 PERCENTAGE POINTS', C.violet),
    ...fbox([
      `SE = ${SE.toFixed(4)}`,
      ['   ≈ 0.06', C.violet],
      ['   ≈ 6 percentage pts', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 13: 1.96 times six points is about twelve points.
  // ---------------------------------------------------------------

  const marginY = P ? -0.53 : -0.39;
  const marginBase = P ? -2.80 : -1.95;

  const marginStart = PHAT * 100;
  const marginEnd = WALD_HI * 100;

  const marginPicture = new M.VGroup(
    axis(
      edgeX,
      [70, 80, 90, 100, 110],
      marginBase,
      'percentage scale',
      true
    ),

    net(
      edgeX,
      marginStart,
      marginEnd,
      marginY,
      GOLD,
      0.15
    ),

    glowDot(
      edgeX(marginStart),
      marginY,
      C.violet,
      0.11
    ),

    txt(
      '93.75%',
      P ? 21 : 19,
      C.violet,
      [edgeX(marginStart) - 0.15, marginY - 0.43, 0],
      true
    ),

    txt(
      'About 12 percentage points',
      P ? 21 : 19,
      GOLD,
      [CX, marginY + 0.69, 0]
    )
  );

  await until(S(13));
  await play(
    ...picture(marginPicture),
    ...say('MARGIN OF ERROR ≈ 12 POINTS', GOLD),
    ...fbox([
      'margin = 1.96 × SE',
      `       = ${(MARGIN * 100).toFixed(1)} pts`,
      ['       ≈ 12 points', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 14: The simple interval runs from about 82% to 106%.
  // ---------------------------------------------------------------

  const simpleInterval = waldPicture({
    stage: 2
  });

  await until(S(14));
  await play(
    ...picture(simpleInterval),
    ...say('SIMPLE NET: ABOUT 82% TO 106%'),
    ...fbox([
      '93.75% ± 11.9 pts',
      ['lower ≈ 81.9%', C.cyan],
      ['upper ≈ 105.6%', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 15: A proportion above 100% is impossible.
  // ---------------------------------------------------------------

  const impossibleInterval = waldPicture({
    stage: 2,
    showWall: true,
    showError: true
  });

  await until(S(15));
  await play(
    ...picture(impossibleInterval),
    ...say('106% ON TIME? IMPOSSIBLE!', MISS),
    ...fbox([
      ['Maximum share = 100%', GOLD],
      ['105.6% is impossible', MISS],
      'The net crossed the wall.'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 16: Name the Wald interval.
  // It can break near zero and one hundred percent.
  // ---------------------------------------------------------------

  const namedWald = waldPicture({
    stage: 2,
    showWall: true,
    showError: true,
    showName: true
  });

  await until(S(16));
  await play(
    ...picture(namedWald),
    ...say('THE WALD INTERVAL CAN BREAK AT THE EDGES', MISS),
    ...fbox([
      ['Wald interval', C.cyan],
      'Simple symmetric net',
      ['Problem near 0% or 100%', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 17: Near the wall, possible proportions are not symmetric.
  // ---------------------------------------------------------------

  const skewed = skewedPilePicture();

  await until(S(17));
  await play(
    ...picture(skewed),
    ...say('THE PILE IS SQUASHED AGAINST 100%', GOLD),
    ...fbox([
      'Possible sample shares',
      'cannot exceed 100%.',
      ['Not a symmetric bell', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 18: A better method flips the question.
  // ---------------------------------------------------------------

  const flipped = flippedQuestionPicture();

  await until(S(18));
  await play(
    ...picture(flipped),
    ...say('FLIP THE QUESTION', C.violet),
    ...fbox([
      'Instead of starting',
      'from our estimate...',
      ['Start with a candidate.', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 19: Which true rates make fifteen out of sixteen unsurprising?
  // ---------------------------------------------------------------

  await until(S(19));
  await play(
    ...say('WHICH TRUE RATES EXPLAIN 15 OUT OF 16?', C.violet),
    ...fbox([
      'Try a possible true rate.',
      'Would 15 out of 16',
      'be unsurprising?',
      ['If yes: keep the rate.', C.green]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 20: Candidate true rate = 98%.
  // Observed 93.75% is within 1.96 of its own standard errors.
  // ---------------------------------------------------------------

  const candidate98 = candidatePicture(0.98, true);
  const stat98 = candidateStats(0.98);

  await until(S(20));
  await play(
    ...picture(candidate98),
    ...say('TRY 98%: KEEP IT', C.green),
    ...fbox([
      'candidate = 98%',
      `SE ≈ ${(stat98.se * 100).toFixed(2)} pts`,
      `distance = ${stat98.score.toFixed(2)} SE`,
      ['Below 1.96: KEEP', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 21: Candidate true rate = 99%.
  // One late delivery in sixteen is too surprising under this test.
  // ---------------------------------------------------------------

  const candidate99 = candidatePicture(0.99, true);
  const stat99 = candidateStats(0.99);

  await until(S(21));
  await play(
    ...picture(candidate99),
    ...say('TRY 99%: REJECT IT', MISS),
    ...fbox([
      'candidate = 99%',
      `SE ≈ ${(stat99.se * 100).toFixed(2)} pts`,
      `distance = ${stat99.score.toFixed(2)} SE`,
      ['Above 1.96: REJECT', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 22: Candidate true rate = 72%.
  // Fifteen of sixteen is high, but inside the acceptance band.
  // ---------------------------------------------------------------

  const candidate72 = candidatePicture(0.72, true);
  const stat72 = candidateStats(0.72);

  await until(S(22));
  await play(
    ...picture(candidate72),
    ...say('TRY 72%: KEEP IT', C.green),
    ...fbox([
      'candidate = 72%',
      `SE ≈ ${(stat72.se * 100).toFixed(2)} pts`,
      `distance = ${stat72.score.toFixed(2)} SE`,
      ['Below 1.96: KEEP', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 23: Candidate true rate = 70%.
  // The observed result is too far from this candidate.
  // ---------------------------------------------------------------

  const candidate70 = candidatePicture(0.70, true);
  const stat70 = candidateStats(0.70);

  await until(S(23));
  await play(
    ...picture(candidate70),
    ...say('TRY 70%: REJECT IT', MISS),
    ...fbox([
      'candidate = 70%',
      `SE ≈ ${(stat70.se * 100).toFixed(2)} pts`,
      `distance = ${stat70.score.toFixed(2)} SE`,
      ['Above 1.96: REJECT', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 24: Every candidate uses its own standard error.
  // ---------------------------------------------------------------

  const differentSEs = candidateSummary(true);

  await until(S(24));
  await play(
    ...picture(differentSEs),
    ...say('EACH CANDIDATE GETS ITS OWN RULER', GOLD),
    ...fbox([
      'For candidate p:',
      ['SE(p) = √(p(1−p)/n)', GOLD],
      'Not the sample’s SE.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 25: All accepted rates form the Wilson interval.
  // ---------------------------------------------------------------

  const accepted = acceptedRatesPicture(true);

  await until(S(25));
  await play(
    ...picture(accepted),
    ...say('KEEP EVERY RATE FROM ABOUT 72% TO 99%', C.green),
    ...fbox([
      ['Lower end = 71.7%', C.green],
      ['Upper end = 98.9%', C.green],
      'All accepted candidates'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 26: Name the Wilson interval.
  // ---------------------------------------------------------------

  const namedWilson = wilsonPicture({
    rounded: false
  });

  await until(S(26));
  await play(
    ...picture(namedWilson),
    ...say('THE WILSON INTERVAL', C.green),
    ...fbox([
      ['Wilson interval', C.green],
      '95% confidence level',
      ['71.7% to 98.9%', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 27: The Wilson interval centre is about 85.3%.
  // The centre is pulled away from the 100% boundary.
  // ---------------------------------------------------------------

  const shiftedCenter = wilsonPicture({
    showCenter: true
  });

  await until(S(27));
  await play(
    ...picture(shiftedCenter),
    ...say('THE CENTRE MOVES AWAY FROM THE WALL', GOLD),
    ...fbox([
      ['estimate = 93.75%', C.violet],
      ['Wilson centre = 85.3%', GOLD],
      'Pulled towards the middle'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 28: A handy approximation:
  // add two pretend on-time and two pretend late deliveries.
  // ---------------------------------------------------------------

  const originalGrid = proportionPicture({
    pretend: false,
    showRate: false
  });

  await until(S(28));
  await play(
    ...picture(originalGrid),
    ...say('A HANDY PICTURE: ADD FOUR PRETEND VALUES', C.violet),
    ...fbox([
      'Start: 15 of 16',
      ['Add 2 on time', C.green],
      ['Add 2 late', MISS],
      'A close approximation'
    ], C.violet)
  );

  await until(S(28) + 2.5);

  const pretendGrid = proportionPicture({
    pretend: true,
    showRate: false
  });

  await play(
    ...picture(pretendGrid),
    ...fbox([
      '15 + 2 = 17 on time',
      '1 + 2 = 3 late',
      ['New total = 20', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 29: Seventeen out of twenty equals eighty-five percent.
  // This illustrates the Wilson centre, not the exact Wilson formula.
  // ---------------------------------------------------------------

  const pretendResult = proportionPicture({
    pretend: true,
    showRate: true
  });

  await until(S(29));
  await play(
    ...picture(pretendResult),
    ...say('17 ÷ 20 = 85%', C.green),
    ...fbox([
      ['17 ÷ 20 = 85%', C.green],
      'Wilson centre = 85.3%',
      'Close, not identical.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 30: Display the full Wilson formula.
  // It is not necessary to narrate every mathematical symbol.
  // ---------------------------------------------------------------

  const formula = wilsonFormulaPicture();

  await until(S(30));
  await play(
    ...picture(formula),
    ...say('THE WILSON FORMULA'),
    ...fbox([
      'p̂ = 0.9375',
      'n = 16',
      'z = 1.96',
      ['Result: 71.7%–98.9%', C.green]
    ])
  );

  // ---------------------------------------------------------------
  // 31: In words, find the standard error for each candidate rate.
  // ---------------------------------------------------------------

  const candidateRulers = candidateSummary(true);

  await until(S(31));
  await play(
    ...picture(candidateRulers),
    ...say('STEP 1: FIND EACH CANDIDATE’S OWN SE', GOLD),
    ...fbox([
      'Try a candidate p.',
      'Use that candidate’s',
      ['SE = √(p(1−p)/16)', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 32: Keep candidates within 1.96 of their own standard errors.
  // ---------------------------------------------------------------

  const scoreRule = scoreRulePicture();

  await until(S(32));
  await play(
    ...picture(scoreRule),
    ...say('STEP 2: KEEP IF WITHIN 1.96 SE', C.green),
    ...fbox([
      'Compare observed result',
      'with the candidate.',
      ['Distance ≤ 1.96 SE?', C.green],
      ['Yes: keep it.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 33: Wilson intervals work for yes-or-no shares.
  // ---------------------------------------------------------------

  const applications = applicationsPicture();

  await until(S(33));
  await play(
    ...picture(applications),
    ...say('ANY YES-OR-NO SHARE'),
    ...fbox([
      'On time or late',
      'Clicked or not',
      'Passed or not',
      'Voted or not'
    ])
  );

  // ---------------------------------------------------------------
  // 34: Wilson intervals never spill outside zero to one hundred percent.
  // ---------------------------------------------------------------

  const legalIntervals = legalBoundsPicture();

  await until(S(34));
  await play(
    ...picture(legalIntervals),
    ...say('WILSON STAYS INSIDE 0% TO 100%', C.green),
    ...fbox([
      ['Minimum = 0%', GOLD],
      ['Maximum = 100%', GOLD],
      ['Wilson respects both.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 35: Common trap.
  // ---------------------------------------------------------------

  const trapPicture = new M.VGroup(
    txt(
      'A NET PAST 100%?',
      P ? 30 : 27,
      MISS,
      [CX, P ? 0.45 : 0.40, 0],
      true
    ),

    txt(
      'Something has gone wrong.',
      P ? 22 : 20,
      C.ink,
      [CX, P ? -0.30 : -0.32, 0]
    ),

    txt(
      '105.6%',
      P ? 42 : 36,
      MISS,
      [CX, P ? -1.55 : -1.45, 0],
      true
    )
  );

  await until(S(35));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'A symmetric net is',
      'not always sensible.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 36: Avoid the simple Wald interval near the boundaries
  // or when the sample is small.
  // ---------------------------------------------------------------

  const comparison = compareIntervals({
    highlightInvalid: true
  });

  await until(S(36));
  await play(
    ...picture(comparison),
    ...say('SMALL SAMPLE OR EXTREME SHARE? USE WILSON', GOLD),
    ...fbox([
      'Avoid simple Wald when:',
      ['Share near 0% or 100%', GOLD],
      ['Sample size is small', GOLD],
      ['Prefer Wilson.', C.green]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 37: Do not report ninety-four percent alone.
  // With only sixteen deliveries, include the uncertainty.
  // ---------------------------------------------------------------

  const honestAnswer = wilsonPicture({
    rounded: true
  });

  await until(S(37));
  await play(
    ...picture(honestAnswer),
    ...say('REPORT THE RANGE, NOT JUST 94%', C.green),
    ...fbox([
      ['Estimate ≈ 94%', C.violet],
      '95% Wilson interval',
      ['≈ 72% to 99%', C.green],
      'Only 16 observations'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 38: Next lesson — build intervals by resampling.
  // Preview the bootstrap without introducing its full method.
  // ---------------------------------------------------------------

  const previewParts = [];

  const previewDX = P ? 0.84 : 0.74;
  const previewDY = P ? 0.70 : 0.53;

  const previewTop = P ? 0.48 : 0.55;

  D1.forEach((v, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);

    const x = CX + (col - 1.5) * previewDX;
    const y = previewTop - row * previewDY;

    const card = new M.RoundedRectangle({
      width: previewDX * 0.84,
      height: previewDY * 0.81,
      cornerRadius: 0.08,
      color: C.cyan,
      strokeWidth: 1.5
    });

    card.setFill(C.card, 0.95);
    card.moveTo([x, y, 0]);

    previewParts.push(
      card,

      txt(
        String(v),
        P ? 22 : 19,
        C.cyan,
        [x, y, 0],
        true
      )
    );
  });

  const bootstrapPreview = new M.VGroup(
    ...previewParts,

    txt(
      'Use the data we already have',
      P ? 22 : 20,
      C.ink,
      [CX, previewTop + 0.75, 0]
    ),

    txt(
      'NEXT: RESAMPLING',
      P ? 22 : 20,
      C.violet,
      [
        CX,
        previewTop - 3 * previewDY - 0.68,
        0
      ],
      true
    )
  );

  await until(S(38));
  await play(
    ...picture(bootstrapPreview),
    ...say('NEXT: BUILD NETS BY RESAMPLING'),
    ...fbox([
      'No interval formula?',
      'Let the data help us.',
      ['Next: the bootstrap', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 39: Final one-sentence summary.
  // A Wilson interval keeps every candidate rate that would
  // make the observed result unsurprising under the score test.
  // Keep the accepted range visible until narration ends.
  // ---------------------------------------------------------------

  const finalWilson = acceptedRatesPicture(true);

  await until(S(39));
  await play(
    ...picture(finalWilson),
    ...say('WILSON = KEEP EVERY UNSURPRISING RATE', C.green),
    ...fbox([
      ['Wilson interval', C.green],
      'Keep compatible rates.',
      'Use each rate’s own SE.',
      ['≈ 72% to 99%', C.green]
    ], C.green)
  );
}
