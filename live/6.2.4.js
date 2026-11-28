// lesson 6.2.4
// One-sample t interval — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed shared chapter data and checked simulation results.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [23, 25, 26, 26, 27, 28, 29, 30, 30, 31, 32, 33, 34, 34, 35, 37];

  const N = 16;
  const SUM = 480;
  const MEAN = 30;
  const SD = 4;
  const SE = 1;
  const DF = 15;

  const NORMAL_CRITICAL = 1.96;
  const T_CRITICAL = 2.13;

  const NORMAL_MARGIN = 1.96;
  const T_MARGIN = 2.13;

  const NORMAL_LO = 28.04;
  const NORMAL_HI = 31.96;

  const T_LO = 27.87;
  const T_HI = 32.13;

  const NORMAL_WIDTH = 3.92;
  const T_WIDTH = 4.26;

  const NORMAL_COVERAGE = 93.5;
  const T_COVERAGE = 95.1;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Approved responsive layout.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.25, 0] : [4.3, -0.3, 0];

  const W = P ? FW - 1.7 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -2.85 : -1.85;
  const NETY = P ? -0.55 : -0.35;

  const BELLBASE = P ? -3.15 : -1.85;
  const BELLHEIGHT = P ? 3.8 : 2.55;

  const realX = v => LEFT + (v - 22) / 16 * W;
  const closeX = v => LEFT + (v - 26) / 8 * W;
  const zX = z => LEFT + (z + 5) / 10 * W;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
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

  function outline(x, y, w, h, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
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

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

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
    const maxh = P ? 2.3 : 3.6;
    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // Number line with labelled ticks.
  function axis(xmap, values, y, unit = 'minutes') {
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
          String(v),
          P ? 17 : 15,
          C.muted,
          [xmap(v), y - 0.26, 0],
          true
        )
      );
    });

    parts.push(txt(
      unit,
      P ? 17 : 15,
      C.muted,
      [CX, y - 0.58, 0]
    ));

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

  // Horizontal interval ("net") with capped endpoints.
  function net(xmap, m, r, y, color = C.cyan, cap = 0.13) {
    const lo = xmap(m - r);
    const hi = xmap(m + r);

    return new M.VGroup(
      ln(lo, y, hi, y, color, 5),

      ln(
        lo, y - cap,
        lo, y + cap,
        color, 2
      ),

      ln(
        hi, y - cap,
        hi, y + cap,
        color, 2
      )
    );
  }

  // One arm of a net.
  function halfNet(xmap, start, end, y, color = C.cyan) {
    return new M.VGroup(
      ln(
        xmap(start), y,
        xmap(end), y,
        color, 5
      ),

      ln(
        xmap(end), y - 0.15,
        xmap(end), y + 0.15,
        color, 2
      )
    );
  }

  // Horizontal measurement bracket.
  function bracket(x1, x2, y, color = C.muted, cap = 0.09) {
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

  // Keep only one active main picture.
  // Every incoming group contains fresh objects only.
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

  // Sami's sixteen observed deliveries.
  // Duplicate observations stack vertically on the minutes line.
  function samplePicture({
    showMean = true,
    showSpread = false,
    showInterval = false,
    highlightOutside = false,
    title = '16 actual deliveries'
  } = {}) {
    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        AY
      ),

      txt(
        title,
        P ? 22 : 20,
        C.ink,
        [CX, P ? 1.05 : 1.05, 0]
      )
    ];

    if (showInterval) {
      const x1 = realX(T_LO);
      const x2 = realX(T_HI);

      const h = P ? 1.42 : 1.10;

      parts.push(rect(
        x2 - x1,
        h,
        (x1 + x2) / 2,
        AY + h / 2,
        C.violet,
        0.10,
        1
      ));
    }

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i).filter(x => x === v).length;

      const outside = v < T_LO || v > T_HI;

      const color = highlightOutside && outside
        ? GOLD
        : C.cyan;

      parts.push(glowDot(
        realX(v),
        AY + 0.23 + repeat * 0.30,
        color,
        P ? 0.085 : 0.095
      ));
    });

    if (showMean) {
      const y = P ? -0.72 : -0.42;

      parts.push(
        glowDot(
          realX(MEAN),
          y,
          C.violet,
          0.12
        ),

        txt(
          'mean = 30',
          P ? 20 : 18,
          C.violet,
          [realX(MEAN), y + 0.38, 0],
          true
        )
      );
    }

    if (showSpread) {
      const y = AY + (P ? 1.12 : 0.96);

      parts.push(
        net(
          realX,
          MEAN,
          SD,
          y,
          GOLD,
          0.11
        ),

        txt(
          'standard deviation = 4',
          P ? 18 : 16,
          GOLD,
          [CX, y + 0.30, 0]
        )
      );
    }

    if (showInterval) {
      const y = P ? -0.70 : -0.40;

      parts.push(
        net(
          realX,
          MEAN,
          T_MARGIN,
          y,
          C.violet,
          0.15
        ),

        glowDot(
          realX(MEAN),
          y,
          C.violet,
          0.10
        ),

        txt(
          '27.87',
          P ? 18 : 16,
          C.violet,
          [realX(T_LO), y + 0.35, 0],
          true
        ),

        txt(
          '32.13',
          P ? 18 : 16,
          C.violet,
          [realX(T_HI), y + 0.35, 0],
          true
        ),

        txt(
          'Interval for the mean',
          P ? 19 : 17,
          C.violet,
          [CX, y + 0.78, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // A simple courier and customer's question.
  function courierPicture() {
    const y = P ? -0.80 : -0.72;

    const road = ln(
      CX - 2.65, y - 1.10,
      CX + 2.65, y - 1.10,
      C.muted, 4
    );

    const stops = [-2.4, 0, 2.4].map((dx, i) =>
      glowDot(
        CX + dx,
        y - 1.10,
        i === 1 ? C.cyan : C.muted,
        0.09
      )
    );

    const head = new M.Circle({
      radius: 0.23,
      color: C.ink
    });

    head.setFill(C.ink, 1);
    head.moveTo([CX - 0.36, y + 0.47, 0]);

    const body = new M.Arc({
      radius: 0.43,
      startAngle: 0,
      angle: Math.PI,
      color: C.ink
    });

    body.setFill(C.ink, 1);
    body.moveTo([CX - 0.36, y - 0.10, 0]);

    const parcel = new M.RoundedRectangle({
      width: 0.67,
      height: 0.57,
      cornerRadius: 0.06,
      color: GOLD,
      strokeWidth: 2
    });

    parcel.setFill(GOLD, 0.24);
    parcel.moveTo([CX + 0.39, y - 0.03, 0]);

    const tape = ln(
      CX + 0.39, y - 0.30,
      CX + 0.39, y + 0.24,
      GOLD, 2
    );

    return new M.VGroup(
      road,
      ...stops,
      head,
      body,
      parcel,
      tape,

      txt(
        'Sami',
        P ? 24 : 22,
        C.ink,
        [CX, y + 0.98, 0]
      ),

      txt(
        'How long, on average?',
        P ? 23 : 21,
        GOLD,
        [CX, y + 1.59, 0]
      )
    );
  }

  // Picture of the interval recipe, before calculating the margin.
  // The dashed arms are schematic, not calculated endpoints.
  function recipePicture(highlightCutoff = false) {
    const y = NETY;
    const base = P ? -2.70 : -1.90;

    const color = highlightCutoff ? C.violet : C.cyan;

    const left = closeX(28);
    const center = closeX(30);
    const right = closeX(32);

    const parts = [
      axis(closeX, [26, 28, 30, 32, 34], base),

      new M.DashedLine({
        start: [left, y, 0],
        end: [center, y, 0],
        color
      }),

      new M.DashedLine({
        start: [center, y, 0],
        end: [right, y, 0],
        color
      }),

      ln(left, y - 0.14, left, y + 0.14, color, 2),
      ln(right, y - 0.14, right, y + 0.14, color, 2),

      glowDot(center, y, C.violet, 0.12),

      txt(
        'estimate',
        P ? 20 : 18,
        C.violet,
        [center, y + 0.48, 0]
      ),

      txt(
        '− margin',
        P ? 18 : 16,
        color,
        [(left + center) / 2, y - 0.40, 0]
      ),

      txt(
        '+ margin',
        P ? 18 : 16,
        color,
        [(center + right) / 2, y - 0.40, 0]
      )
    ];

    if (highlightCutoff) {
      parts.push(
        txt(
          'Change the critical value',
          P ? 21 : 19,
          C.violet,
          [CX, y + 1.05, 0]
        ),

        txt(
          'Normal → t',
          P ? 21 : 19,
          C.violet,
          [CX, y - 0.97, 0],
          true
        )
      );
    } else {
      parts.push(txt(
        'Estimate ± margin',
        P ? 22 : 20,
        C.ink,
        [CX, y + 1.10, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Sixteen dots in a four-by-four square.
  // Shows why the square root of sixteen is four.
  function squareOfSixteen(showDimensions = true) {
    const pitch = P ? 0.66 : 0.53;
    const cy = P ? -0.92 : -0.52;
    const parts = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = CX + (col - 1.5) * pitch;
        const y = cy + (1.5 - row) * pitch;

        const b = new M.RoundedRectangle({
          width: pitch * 0.84,
          height: pitch * 0.84,
          cornerRadius: 0.07,
          color: C.cyan,
          strokeWidth: 1.5
        });

        b.setFill(C.cyan, 0.17);
        b.moveTo([x, y, 0]);

        parts.push(
          b,
          glowDot(x, y, C.cyan, P ? 0.075 : 0.060)
        );
      }
    }

    parts.push(txt(
      '16 deliveries',
      P ? 23 : 21,
      C.ink,
      [CX, cy + 2 * pitch + 0.40, 0]
    ));

    if (showDimensions) {
      const edge = 2 * pitch;

      parts.push(
        bracket(
          CX - edge,
          CX + edge,
          cy - edge - 0.15,
          C.green
        ),

        txt(
          '4',
          24,
          C.green,
          [CX, cy - edge - 0.44, 0],
          true
        ),

        ln(
          CX - edge - 0.18, cy - edge,
          CX - edge - 0.18, cy + edge,
          C.green, 3
        ),

        txt(
          '4',
          24,
          C.green,
          [CX - edge - 0.46, cy, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Compare the spread of single deliveries with the estimated
  // spread of sample means, using the same horizontal scale.
  function spreadComparison() {
    const upperY = P ? 0.25 : 0.28;
    const lowerY = P ? -1.65 : -1.05;
    const base = P ? -3.40 : -2.22;

    return new M.VGroup(
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      ),

      net(
        realX,
        MEAN,
        SD,
        upperY,
        C.cyan,
        0.15
      ),

      glowDot(
        realX(MEAN),
        upperY,
        C.cyan,
        0.085
      ),

      txt(
        'Spread of deliveries',
        P ? 21 : 19,
        C.cyan,
        [CX, upperY + 0.43, 0]
      ),

      txt(
        '4 minutes',
        P ? 22 : 20,
        C.cyan,
        [CX, upperY - 0.42, 0],
        true
      ),

      net(
        realX,
        MEAN,
        SE,
        lowerY,
        C.violet,
        0.15
      ),

      glowDot(
        realX(MEAN),
        lowerY,
        C.violet,
        0.085
      ),

      txt(
        'Estimated spread of means',
        P ? 20 : 18,
        C.violet,
        [CX, lowerY + 0.43, 0]
      ),

      txt(
        '1 minute',
        P ? 22 : 20,
        C.violet,
        [CX, lowerY - 0.42, 0],
        true
      )
    );
  }

  // Degrees of freedom: sixteen values with one mean constraint.
  function freedomPicture() {
    const dx = P ? 1.12 : 1.00;
    const dy = P ? 0.73 : 0.59;

    const top = P ? 0.65 : 0.65;
    const bottom = top - 3 * dy;

    const parts = [];

    D1.forEach((v, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const x = CX + (col - 1.5) * dx;
      const y = top - row * dy;

      const last = i === N - 1;
      const color = last ? GOLD : C.green;

      const card = new M.RoundedRectangle({
        width: dx * 0.85,
        height: dy * 0.80,
        cornerRadius: 0.09,
        color,
        strokeWidth: last ? 2.5 : 1.5
      });

      card.setFill(
        last ? GOLD : C.card,
        last ? 0.18 : 0.95
      );

      card.moveTo([x, y, 0]);

      parts.push(
        new M.VGroup(
          card,
          txt(
            String(v),
            P ? 24 : 21,
            color,
            [x, y, 0],
            true
          )
        )
      );
    });

    parts.push(
      txt(
        '16 observations',
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.61, 0]
      ),

      txt(
        'One mean constraint',
        P ? 19 : 17,
        GOLD,
        [CX, bottom - 0.54, 0]
      ),

      txt(
        '15 degrees of freedom',
        P ? 23 : 21,
        C.green,
        [CX, bottom - 0.96, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Student's t curve with fifteen degrees of freedom.
  //
  // Density is expressed relative to the standard normal peak,
  // preserving the actual relative height and tail thickness.
  // ---------------------------------------------------------------

  function gammaHalfInteger(x) {
    let value = 1;

    while (x > 1 + 1e-9) {
      x -= 1;
      value *= x;
    }

    if (Math.abs(x - 0.5) < 1e-9) {
      value *= Math.sqrt(Math.PI);
    }

    return value;
  }

  function tDensity(df) {
    const coefficient =
      gammaHalfInteger((df + 1) / 2) /
      (
        Math.sqrt(df * Math.PI) *
        gammaHalfInteger(df / 2)
      );

    const relativeScale = coefficient * Math.sqrt(2 * Math.PI);

    return z =>
      relativeScale *
      Math.pow(1 + z * z / df, -(df + 1) / 2);
  }

  const T15 = tDensity(DF);

  function curve(density, color, strokeWidth = 3) {
    const parts = [];
    const steps = 100;

    for (let i = 0; i < steps; i++) {
      const a = -5 + i * 10 / steps;
      const b = -5 + (i + 1) * 10 / steps;

      parts.push(ln(
        zX(a),
        BELLBASE + BELLHEIGHT * density(a),

        zX(b),
        BELLBASE + BELLHEIGHT * density(b),

        color,
        strokeWidth
      ));
    }

    return new M.VGroup(...parts);
  }

  // Shaded area beneath a curve, using narrow vertical strips.
  function curveArea(density, a, b, color, opacity = 0.36) {
    const parts = [];

    const steps = Math.max(
      8,
      Math.round((b - a) * 14)
    );

    const step = (b - a) / steps;

    for (let i = 0; i < steps; i++) {
      const z = a + (i + 0.5) * step;
      const h = BELLHEIGHT * density(z);

      const w =
        zX(z + step / 2) -
        zX(z - step / 2);

      parts.push(rect(
        w + 0.008,
        Math.max(0.0001, h),
        zX(z),
        BELLBASE + h / 2,
        color,
        opacity,
        0
      ));
    }

    return new M.VGroup(...parts);
  }

  // Central 95% of Student's t distribution with 15 df.
  function tCurvePicture({
    title = 'Student’s t: 15 degrees of freedom',
    showCutoff = true
  } = {}) {
    const parts = [
      curveArea(
        T15,
        -5,
        -T_CRITICAL,
        MISS,
        0.40
      ),

      curveArea(
        T15,
        -T_CRITICAL,
        T_CRITICAL,
        C.green,
        0.34
      ),

      curveArea(
        T15,
        T_CRITICAL,
        5,
        MISS,
        0.40
      ),

      axis(
        zX,
        [-5, -4, -2, 0, 2, 4, 5],
        BELLBASE,
        'standard-error units'
      ),

      ln(
        zX(0), BELLBASE,
        zX(0), BELLBASE + BELLHEIGHT * T15(0),
        GOLD, 1.8
      ),

      curve(T15, C.violet, 3.2),

      txt(
        title,
        P ? 21 : 18,
        C.ink,
        [
          CX,
          BELLBASE + BELLHEIGHT + 0.43,
          0
        ]
      ),

      txt(
        '95%',
        P ? 38 : 32,
        C.green,
        [
          CX,
          BELLBASE + BELLHEIGHT * 0.48,
          0
        ],
        true
      )
    ];

    [-T_CRITICAL, T_CRITICAL].forEach(z => {
      parts.push(new M.DashedLine({
        start: [zX(z), BELLBASE, 0],
        end: [
          zX(z),
          BELLBASE + BELLHEIGHT * T15(z) + 0.20,
          0
        ],
        color: C.green
      }));
    });

    if (showCutoff) {
      parts.push(
        txt(
          '−2.13',
          P ? 18 : 16,
          C.green,
          [
            zX(-T_CRITICAL) - 0.15,
            BELLBASE + 0.30,
            0
          ],
          true
        ),

        txt(
          '+2.13',
          P ? 18 : 16,
          C.green,
          [
            zX(T_CRITICAL) + 0.15,
            BELLBASE + 0.30,
            0
          ],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Show the margin as one arm reaching 2.13 minutes from 30.
  function marginPicture() {
    const y = P ? -0.50 : -0.32;
    const base = P ? -2.80 : -1.95;

    return new M.VGroup(
      axis(
        closeX,
        [26, 28, 30, 32, 34],
        base
      ),

      halfNet(
        closeX,
        MEAN,
        T_HI,
        y,
        GOLD
      ),

      glowDot(
        closeX(MEAN),
        y,
        C.violet,
        0.12
      ),

      txt(
        'Margin of error',
        P ? 22 : 20,
        GOLD,
        [CX, y + 1.08, 0]
      ),

      txt(
        '2.13 minutes',
        P ? 21 : 19,
        GOLD,
        [
          (closeX(MEAN) + closeX(T_HI)) / 2,
          y + 0.39,
          0
        ],
        true
      ),

      txt(
        '30',
        P ? 22 : 20,
        C.violet,
        [closeX(MEAN), y - 0.39, 0],
        true
      ),

      txt(
        '2.13 × 1',
        P ? 22 : 20,
        C.ink,
        [CX, y - 1.03, 0],
        true
      )
    );
  }

  // Build the actual one-sample t interval in stages.
  // No gold truth line: Sami's actual true mean remains unknown.
  function intervalPicture({
    stage = 3,
    rounded = false,
    showTitle = true,
    showLevel = false,
    showRecipe = false
  } = {}) {
    const y = NETY;
    const base = P ? -2.80 : -2.00;

    const color = C.violet;

    const parts = [
      axis(
        closeX,
        [26, 28, 30, 32, 34],
        base
      )
    ];

    if (showTitle) {
      parts.push(txt(
        showLevel
          ? '95% confidence interval'
          : 'One-sample t interval',
        P ? 23 : 21,
        color,
        [CX, y + 1.27, 0]
      ));
    }

    if (stage >= 1) {
      parts.push(
        halfNet(
          closeX,
          MEAN,
          T_LO,
          y,
          color
        ),

        txt(
          rounded ? '27.9' : '27.87',
          P ? 24 : 22,
          color,
          [closeX(T_LO), y - 0.40, 0],
          true
        )
      );

      if (showRecipe) {
        parts.push(txt(
          '−2.13',
          P ? 18 : 16,
          GOLD,
          [
            (closeX(T_LO) + closeX(MEAN)) / 2,
            y + 0.33,
            0
          ],
          true
        ));
      }
    }

    if (stage >= 2) {
      parts.push(
        halfNet(
          closeX,
          MEAN,
          T_HI,
          y,
          color
        ),

        txt(
          rounded ? '32.1' : '32.13',
          P ? 24 : 22,
          color,
          [closeX(T_HI), y - 0.40, 0],
          true
        )
      );

      if (showRecipe) {
        parts.push(txt(
          '+2.13',
          P ? 18 : 16,
          GOLD,
          [
            (closeX(T_HI) + closeX(MEAN)) / 2,
            y + 0.33,
            0
          ],
          true
        ));
      }
    }

    parts.push(
      glowDot(
        closeX(MEAN),
        y,
        C.violet,
        0.13
      ),

      txt(
        'estimate = 30',
        P ? 20 : 18,
        C.violet,
        [closeX(MEAN), y + 0.68, 0],
        true
      )
    );

    if (stage >= 3) {
      parts.push(txt(
        rounded
          ? 'About 27.9 to 32.1 minutes'
          : '27.87 to 32.13 minutes',
        P ? 21 : 19,
        C.green,
        [CX, y - 1.00, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Compare the actual normal and t intervals on identical scales.
  function compareNets({
    showNormal = true,
    showWidths = false,
    showExtra = false
  } = {}) {
    const upperY = P ? 0.33 : 0.45;
    const lowerY = P ? -1.60 : -1.05;
    const base = P ? -3.55 : -2.27;

    const parts = [
      axis(
        closeX,
        [26, 28, 30, 32, 34],
        base
      ),

      net(
        closeX,
        MEAN,
        T_MARGIN,
        upperY,
        C.violet,
        0.16
      ),

      glowDot(
        closeX(MEAN),
        upperY,
        C.violet,
        0.085
      ),

      txt(
        'One-sample t interval',
        P ? 21 : 19,
        C.violet,
        [CX, upperY + 0.57, 0]
      ),

      txt(
        '27.87',
        P ? 18 : 16,
        C.violet,
        [closeX(T_LO), upperY - 0.34, 0],
        true
      ),

      txt(
        '32.13',
        P ? 18 : 16,
        C.violet,
        [closeX(T_HI), upperY - 0.34, 0],
        true
      )
    ];

    if (showNormal) {
      parts.push(
        net(
          closeX,
          MEAN,
          NORMAL_MARGIN,
          lowerY,
          C.cyan,
          0.16
        ),

        glowDot(
          closeX(MEAN),
          lowerY,
          C.cyan,
          0.085
        ),

        txt(
          'Normal interval',
          P ? 21 : 19,
          C.cyan,
          [CX, lowerY + 0.57, 0]
        ),

        txt(
          '28.04',
          P ? 18 : 16,
          C.cyan,
          [closeX(NORMAL_LO), lowerY - 0.34, 0],
          true
        ),

        txt(
          '31.96',
          P ? 18 : 16,
          C.cyan,
          [closeX(NORMAL_HI), lowerY - 0.34, 0],
          true
        )
      );
    }

    if (showWidths) {
      parts.push(
        txt(
          'Width: 4.26 min',
          P ? 18 : 16,
          C.violet,
          [CX, upperY - 0.39, 0],
          true
        ),

        txt(
          'Width: 3.92 min',
          P ? 18 : 16,
          C.cyan,
          [CX, lowerY - 0.39, 0],
          true
        )
      );
    }

    if (showExtra) {
      parts.push(
        ln(
          closeX(T_LO), upperY,
          closeX(NORMAL_LO), upperY,
          GOLD, 7
        ),

        ln(
          closeX(NORMAL_HI), upperY,
          closeX(T_HI), upperY,
          GOLD, 7
        ),

        new M.DashedLine({
          start: [closeX(NORMAL_LO), lowerY + 0.18, 0],
          end: [closeX(NORMAL_LO), upperY - 0.18, 0],
          color: C.muted
        }),

        new M.DashedLine({
          start: [closeX(NORMAL_HI), lowerY + 0.18, 0],
          end: [closeX(NORMAL_HI), upperY - 0.18, 0],
          color: C.muted
        }),

        txt(
          '+0.34 min total width',
          P ? 17 : 15,
          GOLD,
          [CX, P ? -2.55 : -1.78, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Coverage simulation pictures.
  // ---------------------------------------------------------------

  // Representative interval throws for the known-truth simulation.
  // Schematic rows are used to explain the experiment, not presented
  // as the raw 10,000-sample simulation results.
  function simulationPicture() {
    const means = [29.1, 29.8, 33.2, 30.6, 31.5, 30.9, 30.3, 31.7];

    const x = v => LEFT + (v - 26) / 10 * W;

    const top = P ? 0.80 : 0.80;
    const pitch = P ? 0.54 : 0.36;
    const bottom = top - (means.length - 1) * pitch;
    const base = bottom - 0.48;

    const parts = [
      axis(
        x,
        [26, 28, 30, 32, 34, 36],
        base
      ),

      ln(
        x(30), base,
        x(30), top + 0.19,
        GOLD, 3
      ),

      txt(
        'TRUE MEAN = 30',
        P ? 18 : 16,
        GOLD,
        [x(30), top + 0.44, 0],
        true
      )
    ];

    means.forEach((m, i) => {
      const y = top - i * pitch;
      const ok = Math.abs(m - 30) <= 2.13;
      const color = ok ? C.green : MISS;

      parts.push(
        net(
          x,
          m,
          2.13,
          y,
          color,
          P ? 0.10 : 0.07
        ),

        glowDot(
          x(m),
          y,
          color,
          P ? 0.067 : 0.048
        )
      );
    });

    parts.push(txt(
      'Illustrative interval throws',
      P ? 16 : 14,
      C.muted,
      [CX, base - 0.96, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Hundred-net pictogram for rounded coverage.
  // The exact checked simulation percentage is displayed separately.
  function hundredNets(caught, exactRate, title, color = C.violet) {
    const cols = 10;
    const rows = 10;

    const dx = W / cols;
    const dy = P ? 0.43 : 0.26;
    const top = P ? 0.76 : 0.70;

    const parts = [];

    for (let col = 0; col < cols; col++) {
      const x = LEFT + (col + 0.5) * dx;

      parts.push(ln(
        x, top - (rows - 1) * dy - 0.10,
        x, top + 0.10,
        GOLD, 1.7
      ));
    }

    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = LEFT + (col + 0.5) * dx;
      const y = top - row * dy;

      const rank = (i * 37 + 11) % 100;
      const ok = rank < caught;

      const side = i % 2 === 0 ? -1 : 1;

      const half = dx * 0.23;

      const offset = ok
        ? side * half * (0.10 + (i % 5) * 0.15)
        : side * half * 1.36;

      const center = x + offset;
      const netColor = ok ? C.green : MISS;
      const cap = P ? 0.05 : 0.038;

      parts.push(new M.VGroup(
        ln(
          center - half, y,
          center + half, y,
          netColor, 3
        ),

        ln(
          center - half, y - cap,
          center - half, y + cap,
          netColor, 1
        ),

        ln(
          center + half, y - cap,
          center + half, y + cap,
          netColor, 1
        ),

        new M.Dot({
          point: [center, y, 0],
          radius: P ? 0.025 : 0.020,
          color: netColor
        })
      ));
    }

    parts.push(
      txt(
        title,
        P ? 22 : 20,
        color,
        [CX, top + 0.59, 0]
      ),

      txt(
        `${exactRate.toFixed(1)}% coverage`,
        P ? 24 : 22,
        C.green,
        [CX, top - 9 * dy - 0.43, 0],
        true
      ),

      txt(
        '100 representative nets',
        P ? 16 : 14,
        C.muted,
        [CX, top - 9 * dy - 0.81, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Actual checked coverage rates from 10,000 simulated samples.
  // The bars use a full zero-to-one-hundred-percent scale.
  function coverageComparison() {
    const w = W - 0.35;
    const left = CX - w / 2;

    const upperY = P ? 0.25 : 0.32;
    const lowerY = P ? -1.72 : -1.28;

    const h = P ? 0.43 : 0.34;

    const parts = [];

    const rows = [
      {
        y: upperY,
        rate: T_COVERAGE,
        name: 'One-sample t interval',
        color: C.violet
      },
      {
        y: lowerY,
        rate: NORMAL_COVERAGE,
        name: 'Normal interval',
        color: C.cyan
      }
    ];

    rows.forEach(({ y, rate, name, color }) => {
      const goodW = w * rate / 100;
      const badW = w - goodW;

      parts.push(
        rect(
          w,
          h,
          CX,
          y,
          C.muted,
          0.15,
          1
        ),

        rect(
          goodW,
          h,
          left + goodW / 2,
          y,
          C.green,
          0.86,
          0
        ),

        rect(
          badW,
          h,
          left + goodW + badW / 2,
          y,
          MISS,
          0.86,
          0
        ),

        txt(
          name,
          P ? 21 : 19,
          color,
          [CX, y + 0.50, 0]
        ),

        txt(
          `${rate.toFixed(1)}%`,
          P ? 28 : 25,
          color,
          [CX, y - 0.48, 0],
          true
        )
      );
    });

    const targetX = left + w * 0.95;

    parts.push(
      new M.DashedLine({
        start: [targetX, lowerY - h / 2 - 0.14, 0],
        end: [targetX, upperY + h / 2 + 0.14, 0],
        color: GOLD
      }),

      txt(
        '95% target',
        P ? 16 : 14,
        GOLD,
        [targetX - 0.42, upperY + 0.98, 0]
      ),

      txt(
        '10,000 simulated samples',
        P ? 18 : 16,
        C.muted,
        [CX, lowerY - 0.98, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // One group of data, followed by a t critical value.
  function oneSamplePicture() {
    const parts = [];

    const pitchX = P ? 0.54 : 0.46;
    const pitchY = P ? 0.43 : 0.36;

    const cy = P ? 0.20 : 0.28;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        parts.push(glowDot(
          CX + (col - 3.5) * pitchX,
          cy - row * pitchY,
          C.cyan,
          P ? 0.08 : 0.07
        ));
      }
    }

    const groupW = 8 * pitchX + 0.25;
    const groupH = 2 * pitchY + 0.18;

    parts.push(
      outline(
        CX,
        cy - pitchY / 2,
        groupW,
        groupH,
        C.cyan
      ),

      txt(
        'ONE SAMPLE',
        P ? 21 : 19,
        C.cyan,
        [CX, cy + 0.70, 0],
        true
      )
    );

    const base = P ? -3.45 : -2.35;
    const h = P ? 1.30 : 0.95;

    const xmap = z => CX + z * W / 12;

    parts.push(ln(
      xmap(-5), base,
      xmap(5), base,
      C.muted, 1.5
    ));

    const steps = 64;

    for (let i = 0; i < steps; i++) {
      const a = -5 + i * 10 / steps;
      const b = -5 + (i + 1) * 10 / steps;

      parts.push(ln(
        xmap(a), base + h * T15(a),
        xmap(b), base + h * T15(b),
        C.violet, 3
      ));
    }

    parts.push(
      new M.DashedLine({
        start: [xmap(T_CRITICAL), base, 0],
        end: [
          xmap(T_CRITICAL),
          base + h * T15(T_CRITICAL) + 0.20,
          0
        ],
        color: GOLD
      }),

      txt(
        't CURVE',
        P ? 20 : 18,
        C.violet,
        [CX, base + h + 0.30, 0],
        true
      ),

      txt(
        '2.13',
        P ? 20 : 18,
        GOLD,
        [xmap(T_CRITICAL) + 0.22, base - 0.30, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Formula displayed using text and a genuine fraction bar.
  // All parts are positioned independently before grouping.
  function formulaPicture(highlight = 'all') {
    const y = P ? -0.52 : -0.40;

    const parts = [];

    const meanText = txt(
      'mean',
      P ? 27 : 25,
      C.violet,
      [CX - 1.94, y, 0],
      true
    );

    const plusMinus = txt(
      '±',
      P ? 30 : 28,
      C.ink,
      [CX - 0.88, y, 0],
      true
    );

    const tText = txt(
      't',
      P ? 30 : 28,
      GOLD,
      [CX - 0.24, y, 0],
      true
    );

    const times = txt(
      '×',
      P ? 25 : 23,
      C.ink,
      [CX + 0.28, y, 0],
      true
    );

    const numerator = txt(
      'standard deviation',
      P ? 18 : 16,
      C.cyan,
      [CX + 1.70, y + 0.35, 0]
    );

    const denominator = txt(
      '√n',
      P ? 26 : 24,
      C.green,
      [CX + 1.70, y - 0.35, 0],
      true
    );

    const fracW = Math.max(
      numerator.getWidth(),
      denominator.getWidth()
    ) + 0.25;

    const fracLine = ln(
      CX + 1.70 - fracW / 2,
      y,
      CX + 1.70 + fracW / 2,
      y,
      C.ink,
      2
    );

    const expression = new M.VGroup(
      meanText,
      plusMinus,
      tText,
      times,
      numerator,
      denominator,
      fracLine
    );

    const maxw = W - 0.25;
    const ew = expression.getWidth();

    // phone: the parts are already placed around CX; a group moveTo shifted them off the left edge
    if (!P) {
      if (ew > maxw) expression.scale(maxw / ew);
      expression.moveTo([CX, y, 0]);
    }

    parts.push(
      expression,

      txt(
        'ONE-SAMPLE t INTERVAL',
        P ? 22 : 20,
        C.violet,
        [CX, y + 1.20, 0],
        true
      )
    );

    if (highlight === 'symbols') {
      parts.push(
        txt(
          'n = number of observations',
          P ? 19 : 17,
          C.green,
          [CX, y - 0.92, 0]
        ),

        txt(
          't = critical value from t curve',
          P ? 19 : 17,
          GOLD,
          [CX, y - 1.38, 0]
        )
      );
    }

    if (highlight === 'numeric') {
      parts.push(
        txt(
          '30 ± 2.13 × 4 / √16',
          P ? 23 : 21,
          C.ink,
          [CX, y - 0.97, 0],
          true
        ),

        txt(
          '= 30 ± 2.13',
          P ? 23 : 21,
          C.violet,
          [CX, y - 1.44, 0],
          true
        )
      );
    }

    if (highlight === 'se') {
      parts.push(
        txt(
          'standard deviation ÷ √n',
          P ? 19 : 17,
          C.cyan,
          [CX, y - 0.94, 0]
        ),

        txt(
          '= standard error',
          P ? 22 : 20,
          C.green,
          [CX, y - 1.38, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Real sample observations compared with the interval for their mean.
  // This makes the distinction between a mean and a single delivery visible.
  function meanVersusDeliveryPicture(highlightOutside = false) {
    const upperY = P ? 0.40 : 0.43;
    const lowerY = P ? -1.66 : -1.18;
    const base = P ? -3.35 : -2.25;

    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      ),

      net(
        realX,
        MEAN,
        T_MARGIN,
        upperY,
        C.violet,
        0.16
      ),

      glowDot(
        realX(MEAN),
        upperY,
        C.violet,
        0.11
      ),

      txt(
        'Range for the mean',
        P ? 22 : 20,
        C.violet,
        [CX, upperY + 0.57, 0]
      ),

      txt(
        '27.87 to 32.13',
        P ? 18 : 16,
        C.violet,
        [CX, upperY - 0.38, 0],
        true
      ),

      txt(
        'Individual deliveries',
        P ? 22 : 20,
        C.cyan,
        [CX, lowerY + 0.65, 0]
      )
    ];

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i).filter(x => x === v).length;

      const outside = v < T_LO || v > T_HI;

      parts.push(glowDot(
        realX(v),
        lowerY + repeat * 0.25,
        highlightOutside && outside ? GOLD : C.cyan,
        P ? 0.085 : 0.075
      ));
    });

    parts.push(
      txt(
        '23',
        P ? 19 : 17,
        GOLD,
        [realX(23), lowerY - 0.32, 0],
        true
      ),

      txt(
        '37',
        P ? 19 : 17,
        GOLD,
        [realX(37), lowerY - 0.32, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Independence assumption.
  // This is a schematic requirement, not proof about Sami's data.
  function independencePicture() {
    const cols = 4;
    const rows = 4;

    const dx = P ? 1.12 : 0.97;
    const dy = P ? 0.70 : 0.55;

    const top = P ? 0.65 : 0.65;

    const parts = [];

    for (let i = 0; i < N; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CX + (col - 1.5) * dx;
      const y = top - row * dy;

      const ring = new M.Circle({
        radius: P ? 0.25 : 0.21,
        color: C.muted,
        strokeWidth: 1.5
      });

      ring.setFill(C.card, 0.85);
      ring.moveTo([x, y, 0]);

      parts.push(
        ring,
        glowDot(x, y, C.cyan, P ? 0.085 : 0.07)
      );
    }

    parts.push(
      txt(
        'Independent observations',
        P ? 23 : 21,
        C.green,
        [CX, top + 0.62, 0]
      ),

      txt(
        'One draw does not affect another',
        P ? 18 : 16,
        C.ink,
        [CX, top - (rows - 1) * dy - 0.70, 0]
      ),

      txt(
        'An assumption to check',
        P ? 17 : 15,
        GOLD,
        [CX, top - (rows - 1) * dy - 1.12, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Schematic shape comparison:
  // reasonably balanced data versus strongly right-skewed data.
  function shapeAssumptionPicture() {
    const balanced = [
      1, 2, 4, 7, 9, 7, 4, 2, 1
    ];

    const skewed = [
      9, 8, 6, 4, 3, 2, 1, 1, 1
    ];

    const rows = [
      {
        counts: balanced,
        base: P ? -0.28 : -0.32,
        color: C.green,
        title: 'Reasonably balanced'
      },
      {
        counts: skewed,
        base: P ? -3.65 : -2.56,
        color: GOLD,
        title: 'Strongly lopsided'
      }
    ];

    const dx = W / 11;
    const pitch = P ? 0.18 : 0.105;

    const parts = [];

    rows.forEach(({ counts, base, color, title }) => {
      parts.push(
        ln(
          CX - 4.7 * dx, base,
          CX + 4.7 * dx, base,
          C.muted, 2
        ),

        txt(
          title,
          P ? 21 : 19,
          color,
          [
            CX,
            base + 9 * pitch + 0.40,
            0
          ]
        )
      );

      counts.forEach((count, col) => {
        const x = CX + (col - 4) * dx;

        for (let j = 0; j < count; j++) {
          parts.push(rect(
            dx * 0.76,
            pitch * 0.77,
            x,
            base + (j + 0.5) * pitch,
            color,
            0.78,
            1
          ));
        }
      });
    });

    parts.push(txt(
      'Illustrative distribution shapes',
      P ? 16 : 14,
      C.muted,
      [CX, P ? -4.18 : -2.84, 0]
    ));

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // 0: Sami's customer asks about the average delivery time.
  // ---------------------------------------------------------------

  const courier = courierPicture();

  await until(S(0));
  await play(
    ...picture(courier),
    ...say('HOW LONG DOES A DELIVERY TAKE?', GOLD),
    ...fbox([
      'Customer’s question:',
      ['How long on average?', GOLD],
      'One stable route'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 1: Sixteen delivery times, mean thirty minutes.
  // ---------------------------------------------------------------

  const observed = samplePicture({
    showMean: true
  });

  await until(S(1));
  await play(
    ...picture(observed),
    ...say('16 DELIVERIES · MEAN = 30 MINUTES'),
    ...fbox([
      'count = 16',
      'sum   = 480',
      ['mean  = 30 minutes', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 2: Build a net with approximately 95% coverage.
  // ---------------------------------------------------------------

  const goal = recipePicture(false);

  await until(S(2));
  await play(
    ...picture(goal),
    ...say('GOAL: A RELIABLE 95% INTERVAL', C.green),
    ...fbox([
      ['estimate = 30', C.violet],
      'Choose the margin',
      ['Catch truth 95 in 100', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 3: Keep the same basic recipe.
  // Estimate plus or minus a margin.
  // ---------------------------------------------------------------

  await until(S(3));
  await play(
    ...say('KEEP THE SAME RECIPE'),
    ...fbox([
      ['estimate', C.violet],
      '±',
      ['margin of error', GOLD]
    ])
  );

  // ---------------------------------------------------------------
  // 4: Only the critical value changes.
  // ---------------------------------------------------------------

  const changedCutoff = recipePicture(true);

  await until(S(4));
  await play(
    ...picture(changedCutoff),
    ...say('ONLY THE CUT-OFF CHANGES', C.violet),
    ...fbox([
      'Same estimate',
      'Same standard error',
      ['Normal cut-off → t', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 5: Step one — the estimate is 30 minutes.
  // ---------------------------------------------------------------

  const estimateOnly = intervalPicture({
    stage: 0,
    showTitle: false
  });

  await until(S(5));
  await play(
    ...picture(estimateOnly),
    ...say('STEP 1: FIND THE ESTIMATE', C.violet),
    ...fbox([
      'estimate = mean',
      '480 ÷ 16',
      ['= 30 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 6: Step two — standard deviation four,
  // and square root of sixteen also four.
  // ---------------------------------------------------------------

  const observedSpread = samplePicture({
    showMean: false,
    showSpread: true,
    title: 'Spread of individual deliveries'
  });

  await until(S(6));
  await play(
    ...picture(observedSpread),
    ...say('STEP 2: FIND THE STANDARD ERROR', GOLD),
    ...fbox([
      'sample SD = 4',
      'sample size = 16',
      ['SE = 4 ÷ √16', GOLD]
    ], GOLD)
  );

  await until(S(6) + 3.1);

  const square16 = squareOfSixteen(true);

  await play(
    ...picture(square16),
    ...fbox([
      '4 × 4 = 16',
      ['√16 = 4', C.green],
      'SE = 4 ÷ 4'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 7: Standard error = 4 ÷ 4 = 1 minute.
  // ---------------------------------------------------------------

  const spreads = spreadComparison();

  await until(S(7));
  await play(
    ...picture(spreads),
    ...say('STANDARD ERROR = 1 MINUTE', C.green),
    ...fbox([
      'SE = 4 ÷ √16',
      '   = 4 ÷ 4',
      ['   = 1 minute', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 8: Step three — sixteen minus one gives fifteen df.
  // ---------------------------------------------------------------

  const freedom = freedomPicture();

  await until(S(8));
  await play(
    ...picture(freedom),
    ...say('STEP 3: DEGREES OF FREEDOM', GOLD),
    ...fbox([
      'df = n − 1',
      '   = 16 − 1',
      ['   = 15', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 9: Step four — the t critical value is 2.13.
  // ---------------------------------------------------------------

  const criticalCurve = tCurvePicture();

  await until(S(9));
  await play(
    ...picture(criticalCurve),
    ...say('STEP 4: t CUT-OFF = 2.13', C.violet),
    ...fbox([
      't curve: 15 df',
      'Middle = 95%',
      ['critical value = 2.13', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 10: Step five — margin = 2.13 × 1 = 2.13 minutes.
  // ---------------------------------------------------------------

  const margin = marginPicture();

  await until(S(10));
  await play(
    ...picture(margin),
    ...say('STEP 5: FIND THE MARGIN', GOLD),
    ...fbox([
      'margin = t × SE',
      '       = 2.13 × 1',
      ['       = 2.13 min', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 11: Step six — throw the net.
  // ---------------------------------------------------------------

  const ready = intervalPicture({
    stage: 0
  });

  await until(S(11));
  await play(
    ...picture(ready),
    ...say('STEP 6: THROW THE NET', C.violet),
    ...fbox([
      ['Start at 30', C.violet],
      'Reach 2.13 minutes',
      'in each direction.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 12: Lower endpoint = 30 − 2.13 = 27.87.
  // ---------------------------------------------------------------

  const lower = intervalPicture({
    stage: 1,
    showRecipe: true
  });

  await until(S(12));
  await play(
    ...picture(lower),
    ...say('LOWER END = 27.87 MINUTES', C.violet),
    ...fbox([
      '30 − 2.13',
      ['= 27.87 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 13: Upper endpoint = 30 + 2.13 = 32.13.
  // ---------------------------------------------------------------

  const upper = intervalPicture({
    stage: 2,
    showRecipe: true
  });

  await until(S(13));
  await play(
    ...picture(upper),
    ...say('UPPER END = 32.13 MINUTES', C.violet),
    ...fbox([
      '30 + 2.13',
      ['= 32.13 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 14: The completed interval is about 27.9 to 32.1 minutes.
  // ---------------------------------------------------------------

  const completed = intervalPicture({
    stage: 3,
    rounded: true,
    showLevel: true
  });

  await until(S(14));
  await play(
    ...picture(completed),
    ...say('95% INTERVAL: ABOUT 27.9 TO 32.1', C.green),
    ...fbox([
      ['27.87 to 32.13', C.violet],
      'approximately',
      ['27.9 to 32.1 minutes', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 15: Put the new t net next to the previous normal net.
  // ---------------------------------------------------------------

  const compareStart = compareNets({
    showNormal: false
  });

  await until(S(15));
  await play(
    ...picture(compareStart),
    ...say('COMPARE WITH THE NORMAL NET'),
    ...fbox([
      ['t interval', C.violet],
      '30 ± 2.13',
      'Compare the widths.'
    ])
  );

  // ---------------------------------------------------------------
  // 16: Normal interval = 28.04 to 31.96.
  // ---------------------------------------------------------------

  const compareBoth = compareNets({
    showNormal: true
  });

  await until(S(16));
  await play(
    ...picture(compareBoth),
    ...say('NORMAL: ABOUT 28 TO 32 MINUTES', C.cyan),
    ...fbox([
      ['Normal: 28.04–31.96', C.cyan],
      ['t:      27.87–32.13', C.violet],
      'Same centre: 30'
    ])
  );

  // ---------------------------------------------------------------
  // 17: The t interval has width 4.26 instead of 3.92.
  // ---------------------------------------------------------------

  const compareWidths = compareNets({
    showNormal: true,
    showWidths: true
  });

  await until(S(17));
  await play(
    ...picture(compareWidths),
    ...say('THE t NET IS A LITTLE WIDER', C.violet),
    ...fbox([
      ['Normal width = 3.92', C.cyan],
      ['t width      = 4.26', C.violet],
      'About 3.9 versus 4.3'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 18: Extra width pays for estimating the spread.
  // ---------------------------------------------------------------

  const extraWidth = compareNets({
    showNormal: true,
    showWidths: true,
    showExtra: true
  });

  await until(S(18));
  await play(
    ...picture(extraWidth),
    ...say('EXTRA WIDTH PAYS FOR GUESSING THE SPREAD', GOLD),
    ...fbox([
      '4.26 − 3.92 = 0.34',
      ['Extra width: 0.34 min', GOLD],
      'Accounts for uncertainty'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 19: Test the method in a known-truth simulation.
  // ---------------------------------------------------------------

  const simulation = simulationPicture();

  await until(S(19));
  await play(
    ...picture(simulation),
    ...say('DOES IT WORK? TEST THE COVERAGE'),
    ...fbox([
      ['Simulation truth = 30', GOLD],
      '16 deliveries per sample',
      'Estimate spread each time'
    ])
  );

  // ---------------------------------------------------------------
  // 20: Checked result: the t intervals cover about 95.1%.
  // ---------------------------------------------------------------

  const tGrid = hundredNets(
    95,
    T_COVERAGE,
    'One-sample t intervals',
    C.violet
  );

  await until(S(20));
  await play(
    ...picture(tGrid),
    ...say('t INTERVALS: ABOUT 95 IN 100 CATCH', C.green),
    ...fbox([
      '10,000 simulated samples',
      ['t coverage ≈ 95.1%', C.green],
      'Target = 95%'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 21: Normal intervals cover only about 93.5%.
  // ---------------------------------------------------------------

  const coverage = coverageComparison();

  await until(S(21));
  await play(
    ...picture(coverage),
    ...say('NORMAL INTERVALS: ONLY ABOUT 93.5%', GOLD),
    ...fbox([
      ['t      ≈ 95.1%', C.violet],
      ['Normal ≈ 93.5%', C.cyan],
      'Target = 95%'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 22: Name the one-sample t interval.
  // ---------------------------------------------------------------

  const namedInterval = intervalPicture({
    stage: 3,
    rounded: true,
    showLevel: true
  });

  await until(S(22));
  await play(
    ...picture(namedInterval),
    ...say('ONE-SAMPLE t INTERVAL', C.violet),
    ...fbox([
      ['one-sample t interval', C.violet],
      'A confidence interval',
      'for one population mean'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 23: One sample of observations and a t critical value.
  // ---------------------------------------------------------------

  const oneSample = oneSamplePicture();

  await until(S(23));
  await play(
    ...picture(oneSample),
    ...say('ONE SAMPLE · ONE t CUT-OFF', C.violet),
    ...fbox([
      ['One sample', C.cyan],
      'One group of data',
      ['t', C.violet],
      'Cut-off from t curve'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 24: Introduce the general formula.
  // ---------------------------------------------------------------

  const generalFormula = formulaPicture('all');

  await until(S(24));
  await play(
    ...picture(generalFormula),
    ...say('THE FORMULA'),
    ...fbox([
      ['estimate ± margin', C.violet],
      'margin = t × SE'
    ])
  );

  // ---------------------------------------------------------------
  // 25: Explain the symbols n and t.
  // ---------------------------------------------------------------

  const formulaSymbols = formulaPicture('symbols');

  await until(S(25));
  await play(
    ...picture(formulaSymbols),
    ...say('n = SAMPLE SIZE · t = CRITICAL VALUE', GOLD),
    ...fbox([
      ['n = sample size', C.green],
      ['t = t cut-off', GOLD],
      'Here: n = 16',
      '      t = 2.13'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 26: Mean ± t × standard deviation / square root of n.
  // ---------------------------------------------------------------

  const formulaNumeric = formulaPicture('numeric');

  await until(S(26));
  await play(
    ...picture(formulaNumeric),
    ...say('MEAN ± t × STANDARD DEVIATION ÷ √n'),
    ...fbox([
      'mean ± t × SD / √n',
      '30 ± 2.13 × 4 / √16',
      ['30 ± 2.13', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 27: Read the formula using the standard error.
  // ---------------------------------------------------------------

  const formulaSE = formulaPicture('se');

  await until(S(27));
  await play(
    ...picture(formulaSE),
    ...say('MEAN ± t CUT-OFF × STANDARD ERROR', C.green),
    ...fbox([
      'SE = SD ÷ √n',
      ['mean ± t × SE', C.violet],
      '30 ± 2.13 × 1'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 28: Sami can report an estimated average of 30 minutes.
  // ---------------------------------------------------------------

  const customerMean = intervalPicture({
    stage: 0,
    showTitle: false
  });

  await until(S(28));
  await play(
    ...picture(customerMean),
    ...say('“THE AVERAGE IS ABOUT 30 MINUTES”', C.violet),
    ...fbox([
      'Sami’s answer:',
      ['Estimated average', C.violet],
      ['30 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 29: Report the 95% confidence interval as well.
  // ---------------------------------------------------------------

  const customerInterval = intervalPicture({
    stage: 3,
    rounded: true,
    showLevel: true
  });

  await until(S(29));
  await play(
    ...picture(customerInterval),
    ...say('“95% INTERVAL: ABOUT 28 TO 32 MINUTES”', C.green),
    ...fbox([
      ['Average ≈ 30 minutes', C.violet],
      '95% confidence interval',
      ['≈ 28 to 32 minutes', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 30: The interval communicates uncertainty about the mean,
  // even with a relatively small sample.
  // ---------------------------------------------------------------

  await until(S(30));
  await play(
    ...say('AN HONEST RANGE FOR THE MEAN', C.green),
    ...fbox([
      'Only 16 observations',
      'One estimated mean',
      ['A range for uncertainty', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 31: Introduce the common trap.
  // ---------------------------------------------------------------

  const trapPicture = new M.VGroup(
    txt(
      'AVERAGE OR ONE DELIVERY?',
      P ? 26 : 23,
      GOLD,
      [CX, P ? 0.35 : 0.25, 0],
      true
    ),

    txt(
      'These are different questions.',
      P ? 21 : 19,
      C.ink,
      [CX, P ? -0.49 : -0.49, 0]
    ),

    net(
      closeX,
      MEAN,
      T_MARGIN,
      P ? -1.65 : -1.36,
      C.violet,
      0.16
    ),

    glowDot(
      closeX(MEAN),
      P ? -1.65 : -1.36,
      C.violet,
      0.12
    )
  );

  await until(S(31));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'An interval for a mean',
      'is not an interval',
      'for one delivery.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 32: The interval describes the true average,
  // not the time of an individual delivery.
  // ---------------------------------------------------------------

  const distinction = meanVersusDeliveryPicture(false);

  await until(S(32));
  await play(
    ...picture(distinction),
    ...say('THIS INTERVAL IS FOR THE AVERAGE', C.violet),
    ...fbox([
      ['Target: true mean', C.violet],
      'Not the time of',
      'one individual delivery'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 33: Individual deliveries vary much more, from 23 to 37.
  // ---------------------------------------------------------------

  const outsideDots = meanVersusDeliveryPicture(true);

  await until(S(33));
  await play(
    ...picture(outsideDots),
    ...say('SINGLE DELIVERIES VARY MUCH MORE', GOLD),
    ...fbox([
      ['Mean interval:', C.violet],
      '27.87 to 32.13',
      ['Observed deliveries:', GOLD],
      '23 to 37 minutes'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 34: Do not promise an individual parcel will arrive in 28–32 min.
  // ---------------------------------------------------------------

  const promiseWarning = pill(
    'NOT A DELIVERY-TIME PROMISE',
    MISS,
    P ? 17 : 15
  );

  promiseWarning.moveTo([
    CX,
    P ? -4.50 : -2.78,
    0
  ]);

  await until(S(34));
  await play(
    new M.FadeIn(promiseWarning),
    ...say('DO NOT PROMISE 28–32 MINUTES FOR ONE PARCEL', MISS),
    ...fbox([
      ['Incorrect promise:', MISS],
      '“Your parcel will arrive',
      'between 28 and 32.”',
      ['Not what this net means', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 35: Assumption one — independent observations.
  // ---------------------------------------------------------------

  const independent = independencePicture();

  await until(S(35));
  await play(
    new M.FadeOut(promiseWarning),
    ...picture(independent),
    ...say('ASSUMPTION 1: INDEPENDENT DELIVERIES', GOLD),
    ...fbox([
      'Observations should',
      'be independent.',
      ['One does not affect', GOLD],
      ['another.', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 36: Assumption two — with a small sample,
  // the distribution should not be strongly skewed.
  // ---------------------------------------------------------------

  const shapes = shapeAssumptionPicture();

  await until(S(36));
  await play(
    ...picture(shapes),
    ...say('ASSUMPTION 2: NO STRONGLY LOPSIDED SHAPE', GOLD),
    ...fbox([
      'Small sample?',
      'Avoid strong skewness',
      ['and extreme outliers.', GOLD],
      'Check the data shape.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 37: Next lesson — intervals for a proportion.
  // ---------------------------------------------------------------

  const proportionPreview = [];

  const previewDX = P ? 0.62 : 0.54;
  const previewDY = P ? 0.57 : 0.43;

  const previewTop = P ? 0.45 : 0.42;

  for (let i = 0; i < N; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);

    const x = CX + (col - 1.5) * previewDX;
    const y = previewTop - row * previewDY;

    proportionPreview.push(glowDot(
      x,
      y,
      D1[i] <= 35 ? C.green : MISS,
      P ? 0.14 : 0.105
    ));
  }

  const nextPicture = new M.VGroup(
    ...proportionPreview,

    txt(
      'ON TIME OR LATE?',
      P ? 24 : 22,
      C.ink,
      [CX, previewTop + 0.75, 0],
      true
    ),

    txt(
      'From averages to shares',
      P ? 21 : 19,
      C.cyan,
      [CX, previewTop - 3 * previewDY - 0.67, 0]
    )
  );

  await until(S(37));
  await play(
    ...picture(nextPicture),
    ...say('NEXT: AN INTERVAL FOR A PROPORTION'),
    ...fbox([
      'Not a mean this time.',
      'A yes-or-no result.',
      ['What share is on time?', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 38: Final one-sentence summary.
  // Keep the actual t interval visible until narration ends.
  // ---------------------------------------------------------------

  const finalInterval = intervalPicture({
    stage: 3,
    rounded: true,
    showLevel: true,
    showRecipe: true
  });

  await until(S(38));
  await play(
    ...picture(finalInterval),
    ...say('ONE-SAMPLE t INTERVAL = MEAN ± t × SE', C.green),
    ...fbox([
      ['mean ± t × SE', C.violet],
      '30 ± 2.13 × 1',
      ['27.87 to 32.13', C.violet],
      ['95% confidence level', C.green]
    ], C.green)
  );
}
