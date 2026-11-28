// lesson 6.2.7
// Percentile bootstrap intervals — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the fixed shared chapter data and the seed-62 bootstrap.
// Histogram counts verified using NumPy default_rng(62), drawing
// 10,000 resamples of 16 observations with replacement.
//
// The percentile boundaries include ties. Exactly 250 ranked
// observations are trimmed from each end, but some observations
// equal to the boundary values remain in the middle.
//
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ---------------------------------------------------------------
  // Fixed shared chapter data.
  // ---------------------------------------------------------------

  const D1 = [
    23, 25, 26, 26, 27, 28, 29, 30,
    30, 31, 32, 33, 34, 34, 35, 37
  ];

  const RESAMPLE = [
    25, 26, 26, 27, 30, 30, 30, 31,
    31, 33, 33, 34, 34, 34, 35, 35
  ];

  const DRAW = [
    30, 31, 31, 33, 34, 34, 26, 27,
    25, 33, 30, 35, 26, 30, 35, 34
  ];

  const N = 16;

  const ORIGINAL_MEDIAN = 30;
  const RESAMPLE_MEDIAN = 31;

  const B = 10000;
  const TAIL_PERCENT = 2.5;
  const TAIL_COUNT = 250;
  const MIDDLE_COUNT = 9500;

  const PERCENTILE_LO = 27;
  const PERCENTILE_HI = 33;

  const T_LO = 27.87;
  const T_HI = 32.13;

  const MEDIAN_WIDTH = 6;
  const MEAN_WIDTH = 4.26;

  // Actual seed-62 bootstrap median frequencies.
  // Each successive value increases by half a minute.
  // These counts sum to exactly 10,000.

  const MEDIAN_COUNTS = [
    1, 4, 75, 108, 222,
    288, 491, 628, 878, 1146,
    2376,
    1076, 923, 589, 506,
    275, 224, 108, 79, 2, 1
  ];

  const MEDIAN_VALUES = MEDIAN_COUNTS.map(
    (_, i) => 25 + i * 0.5
  );

  const COUNT_AT_30 = 2376;

  // Exact counts used to explain percentile-boundary ties.
  //
  // Below 27: 188 observations.
  // At 27:    222 observations.
  //
  // Above 33: 190 observations.
  // At 33:    224 observations.
  //
  // Thus, the lowest 250 include 62 observations equal to 27.
  // The highest 250 include 60 observations equal to 33.

  const BELOW_LO = 188;
  const AT_LO = 222;
  const LO_TIES_TRIMMED = 62;

  const ABOVE_HI = 190;
  const AT_HI = 224;
  const HI_TIES_TRIMMED = 60;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // ---------------------------------------------------------------
  // Approved responsive layout.
  // ---------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.7 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -2.95 : -1.85;

  const HISTBASE = P ? -3.45 : -1.85;
  const HISTHEIGHT = P ? 3.75 : 2.30;

  const realX = v => LEFT + (v - 22) / 16 * W;
  const histX = v => LEFT + (v - 24.5) / 11 * W;
  const closeX = v => LEFT + (v - 25) / 10 * W;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(s, size, color, pos, mono = false, maxw = W) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

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

  // Outline boxes are drawn directly from coordinates.
  function outline(x, y, w, h, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.moveTo([x, y, 0]);

    return r;
  }

  // ---------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ---------------------------------------------------------------

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
    const maxh = P ? 1.95 : 3.6;

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

  // ---------------------------------------------------------------
  // General visual helpers.
  // ---------------------------------------------------------------

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

    if (unit) {
      parts.push(txt(
        unit,
        P ? 17 : 15,
        C.muted,
        [CX, y - 0.58, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

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

  function bracket(x1, x2, y, color = C.muted, cap = 0.10) {
    return new M.VGroup(
      ln(x1, y, x2, y, color, 3),

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

  function net(xmap, lo, hi, y, color = C.cyan, cap = 0.15) {
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

  function arrow(x1, y1, x2, y2, color = C.cyan, width = 2.5) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.16;
    const d = Math.PI / 6;

    return new M.VGroup(
      ln(x1, y1, x2, y2, color, width),

      ln(
        x2,
        y2,
        x2 - h * Math.cos(a - d),
        y2 - h * Math.sin(a - d),
        color,
        width
      ),

      ln(
        x2,
        y2,
        x2 - h * Math.cos(a + d),
        y2 - h * Math.sin(a + d),
        color,
        width
      )
    );
  }

  function card(
    value,
    x,
    y,
    color = C.cyan,
    w = 0.65,
    h = 0.48,
    fontSize = P ? 21 : 19
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.07,
      color,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);

    const label = txt(
      String(value),
      fontSize,
      color,
      [x, y, 0],
      true,
      w - 0.07
    );

    return new M.VGroup(r, label);
  }

  // Keep one active main picture at a time.
  // Every incoming group contains fresh objects only.
  let pictureNow = null;

  function picture(next) {
    const a = [];

    if (pictureNow) a.push(new M.FadeOut(pictureNow));

    if (next) a.push(new M.FadeIn(next));

    pictureNow = next;

    return a;
  }

  function fadeAll(objects) {
    return objects.map(o => new M.FadeOut(o));
  }

  function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2) {
      return sorted[mid];
    }

    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // ---------------------------------------------------------------
  // Opening picture: original delivery data and the median.
  // ---------------------------------------------------------------

  function deliveryPicture({
    highlightHalves = false,
    highlightMiddle = false,
    showMedian = false,
    showNet = false,
    title = '16 delivery times'
  } = {}) {
    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        AY
      ),

      txt(
        title,
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.12 : 1.10, 0]
      )
    ];

    if (highlightHalves) {
      const split = realX(30);
      const top = AY + (P ? 1.48 : 1.28);

      parts.push(
        rect(
          split - LEFT,
          top - AY,
          (LEFT + split) / 2,
          (top + AY) / 2,
          C.cyan,
          0.055,
          0
        ),

        rect(
          RIGHT - split,
          top - AY,
          (RIGHT + split) / 2,
          (top + AY) / 2,
          C.violet,
          0.055,
          0
        ),

        ln(
          split, AY,
          split, top,
          C.green, 2.5
        ),

        txt(
          'Lower half',
          P ? 20 : 18,
          C.cyan,
          [(LEFT + split) / 2, top + 0.35, 0]
        ),

        txt(
          'Upper half',
          P ? 20 : 18,
          C.violet,
          [(RIGHT + split) / 2, top + 0.35, 0]
        )
      );
    }

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i)
        .filter(u => u === v).length;

      let color = C.cyan;

      if (highlightHalves && i >= 8) {
        color = C.violet;
      }

      if (highlightMiddle && (i === 7 || i === 8)) {
        color = C.green;
      }

      parts.push(glowDot(
        realX(v),
        AY + 0.25 + repeat * 0.32,
        color,
        P ? 0.085 : 0.095
      ));
    });

    if (showMedian) {
      const y = P ? -0.55 : -0.32;

      parts.push(
        glowDot(
          realX(ORIGINAL_MEDIAN),
          y,
          C.violet,
          0.13
        ),

        txt(
          'median = 30',
          P ? 22 : 20,
          C.violet,
          [CX, y + 0.46, 0],
          true
        )
      );

      if (showNet) {
        const x1 = realX(28);
        const x2 = realX(32);

        // Schematic dashed arms. Actual endpoints are not yet known.
        parts.push(
          new M.DashedLine({
            start: [x1, y, 0],
            end: [realX(30), y, 0],
            color: C.violet
          }),

          new M.DashedLine({
            start: [realX(30), y, 0],
            end: [x2, y, 0],
            color: C.violet
          }),

          txt(
            '?',
            P ? 27 : 24,
            C.violet,
            [x1, y - 0.40, 0],
            true
          ),

          txt(
            '?',
            P ? 27 : 24,
            C.violet,
            [x2, y - 0.40, 0],
            true
          ),

          txt(
            'How wide should the net be?',
            P ? 20 : 18,
            C.ink,
            [CX, y - 0.92, 0]
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Sorted cards with the middle two positions highlighted.
  //
  // The first eight and last eight cards occupy separate rows.
  // The eighth and ninth cards are explicitly marked.
  // ---------------------------------------------------------------

  function sortedCardsPicture(values, {
    title = 'Sorted delivery times',
    color = C.cyan,
    highlightMiddle = false,
    showCalculation = false,
    showHalves = false
  } = {}) {
    const sorted = values.slice().sort((a, b) => a - b);

    const dx = Math.min(
      P ? 0.73 : 0.72,
      W / 8.4
    );

    const dy = P ? 1.02 : 0.79;
    const top = P ? 0.38 : 0.53;

    const parts = [];

    sorted.forEach((v, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);

      const x = CX + (col - 3.5) * dx;
      const y = top - row * dy;

      const middle = i === 7 || i === 8;

      const cardColor = highlightMiddle && middle
        ? C.green
        : showHalves && row === 1
          ? C.violet
          : color;

      parts.push(
        card(
          v,
          x,
          y,
          cardColor,
          dx * 0.86,
          P ? 0.52 : 0.43,
          P ? 21 : 19
        ),

        txt(
          String(i + 1),
          P ? 13 : 12,
          highlightMiddle && middle ? C.green : C.muted,
          [x, y + 0.41, 0],
          true
        )
      );

      if (highlightMiddle && middle) {
        parts.push(outline(
          x,
          y,
          dx * 0.96,
          P ? 0.65 : 0.55,
          C.green
        ));
      }
    });

    parts.push(txt(
      title,
      P ? 22 : 20,
      C.ink,
      [CX, top + 0.93, 0]
    ));

    if (showHalves && !highlightMiddle) {
      parts.push(txt(
        '8 lower positions · 8 upper positions',
        P ? 19 : 17,
        C.ink,
        [CX, top - dy - 0.65, 0]
      ));
    }

    if (highlightMiddle) {
      const y = top - dy - (P ? 0.86 : 0.62);

      parts.push(
        txt(
          `8th = ${sorted[7]}`,
          P ? 23 : 21,
          C.green,
          [CX - 1.38, y, 0],
          true
        ),

        txt(
          `9th = ${sorted[8]}`,
          P ? 23 : 21,
          C.green,
          [CX + 1.38, y, 0],
          true
        )
      );

      if (showCalculation) {
        const value = median(sorted);

        parts.push(
          txt(
            `(${sorted[7]} + ${sorted[8]}) ÷ 2`,
            P ? 25 : 23,
            C.ink,
            [CX, y - 0.57, 0],
            true
          ),

          txt(
            `Median = ${value}`,
            P ? 28 : 25,
            C.green,
            [CX, y - 1.06, 0],
            true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Bootstrap reminder: draw sixteen cards with replacement.
  // ---------------------------------------------------------------

  const SOURCE_X = CX - 1.65;
  const DRAW_X = CX + 1.65;

  const CARD_DX = P ? 0.58 : 0.57;
  const CARD_DY = P ? 0.56 : 0.45;

  const CARD_TOP = P ? 0.15 : 0.26;

  function slot(center, i) {
    return [
      center + (i % 4 - 1.5) * CARD_DX,
      CARD_TOP - Math.floor(i / 4) * CARD_DY,
      0
    ];
  }

  function bootstrapDrawPicture(drawn = 16) {
    const parts = [];

    const bottom = CARD_TOP - 3 * CARD_DY;

    parts.push(
      outline(
        SOURCE_X,
        (CARD_TOP + bottom) / 2,
        2.55,
        CARD_TOP - bottom + 0.65,
        C.cyan
      ),

      outline(
        DRAW_X,
        (CARD_TOP + bottom) / 2,
        2.55,
        CARD_TOP - bottom + 0.65,
        C.violet
      ),

      txt(
        'ORIGINAL',
        P ? 19 : 17,
        C.cyan,
        [SOURCE_X, CARD_TOP + 1.02, 0],
        true
      ),

      txt(
        'RESAMPLE',
        P ? 19 : 17,
        C.violet,
        [DRAW_X, CARD_TOP + 1.02, 0],
        true
      ),

      arrow(
        SOURCE_X + 0.70,
        CARD_TOP + 0.58,
        DRAW_X - 0.70,
        CARD_TOP + 0.58,
        C.violet
      ),

      arrow(
        DRAW_X - 0.70,
        bottom - 0.50,
        SOURCE_X + 0.70,
        bottom - 0.50,
        C.green
      )
    );

    for (let i = 0; i < N; i++) {
      const a = slot(SOURCE_X, i);
      const b = slot(DRAW_X, i);

      parts.push(card(
        D1[i],
        a[0],
        a[1],
        C.cyan,
        CARD_DX * 0.84,
        CARD_DY * 0.80,
        P ? 18 : 16
      ));

      if (i < drawn) {
        parts.push(card(
          DRAW[i],
          b[0],
          b[1],
          C.violet,
          CARD_DX * 0.84,
          CARD_DY * 0.80,
          P ? 18 : 16
        ));
      } else {
        const empty = outline(
          b[0],
          b[1],
          CARD_DX * 0.84,
          CARD_DY * 0.80,
          C.muted
        );

        parts.push(empty);
      }
    }

    parts.push(
      txt(
        '16 available',
        P ? 18 : 16,
        C.cyan,
        [SOURCE_X, bottom - 0.94, 0],
        true
      ),

      txt(
        `${drawn} recorded`,
        P ? 18 : 16,
        C.violet,
        [DRAW_X, bottom - 0.94, 0],
        true
      ),

      txt(
        'Return every card before the next draw',
        P ? 19 : 17,
        C.green,
        [CX, bottom - 1.38, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Several illustrative resamples and their medians.
  //
  // The first row is the actual fixed seed-62 example.
  // Additional rows demonstrate the process using valid draws
  // from the same original observations.
  // ---------------------------------------------------------------

  function repeatedResamplesPicture() {
    const examples = [
      RESAMPLE,

      [
        23, 25, 26, 27, 28, 28, 29, 29,
        30, 30, 31, 32, 33, 34, 34, 35
      ],

      [
        25, 26, 27, 28, 29, 30, 30, 31,
        31, 32, 32, 33, 34, 35, 35, 37
      ],

      [
        23, 23, 25, 26, 26, 27, 28, 29,
        29, 30, 31, 32, 33, 34, 35, 37
      ]
    ];

    const top = P ? 0.70 : 0.76;
    const pitch = P ? 0.93 : 0.66;

    const parts = [];

    examples.forEach((values, i) => {
      const y = top - i * pitch;

      parts.push(txt(
        String(i + 1),
        P ? 16 : 14,
        C.muted,
        [LEFT + 0.18, y, 0],
        true
      ));

      for (let j = 0; j < N; j++) {
        const col = j % 8;
        const row = Math.floor(j / 8);

        const x = CX - 1.90 + col * 0.36;
        const yy = y + 0.15 - row * 0.30;

        parts.push(card(
          values[j],
          x,
          yy,
          j === 7 || j === 8 ? C.green : C.violet,
          0.31,
          0.26,
          P ? 13 : 12
        ));
      }

      parts.push(
        arrow(
          CX + 0.88,
          y,
          CX + 1.42,
          y,
          C.muted,
          1.8
        ),

        glowDot(
          CX + 1.68,
          y,
          C.green,
          P ? 0.07 : 0.055
        ),

        txt(
          String(median(values)),
          P ? 23 : 21,
          C.green,
          [CX + 2.25, y, 0],
          true
        )
      );
    });

    parts.push(
      txt(
        'RESAMPLE → MEDIAN',
        P ? 23 : 21,
        C.ink,
        [CX, top + 0.58, 0],
        true
      ),

      txt(
        '⋮',
        P ? 27 : 24,
        C.muted,
        [CX, top - 3 * pitch - 0.42, 0]
      ),

      txt(
        'Repeat 10,000 times',
        P ? 24 : 22,
        C.violet,
        [CX, top - 3 * pitch - 0.88, 0],
        true
      ),

      txt(
        'Illustrative resample rows',
        P ? 16 : 14,
        C.muted,
        [CX, top - 3 * pitch - 1.23, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Histogram of actual seed-62 bootstrap medians.
  //
  // Unlike a continuous curve, the distribution has probability
  // only at whole-minute and half-minute values.
  //
  // Narrow bars leave visible gaps between attainable medians.
  // Each bar's height represents its actual observed frequency.
  // ---------------------------------------------------------------

  const MAX_COUNT = 2500;

  const histH = count =>
    HISTHEIGHT * count / MAX_COUNT;

  function histogramParts({
    title = '10,000 bootstrap medians',
    highlight30 = false,
    showLumps = false,
    trimLower = false,
    trimUpper = false,
    showMiddle = false,
    showCuts = false,
    showPercentiles = false,
    showCounts = false
  } = {}) {
    const baseParts = [];
    const bars = [];
    const extras = [];

    const top = HISTBASE + HISTHEIGHT;

    // Frequency grid.
    [500, 1000, 1500, 2000, 2500].forEach(count => {
      const y = HISTBASE + histH(count);

      baseParts.push(
        ln(
          LEFT,
          y,
          RIGHT,
          y,
          C.muted,
          0.65
        ),

        txt(
          String(count),
          P ? 12 : 11,
          C.muted,
          [LEFT - 0.30, y, 0],
          true,
          0.56
        )
      );
    });

    baseParts.push(
      ln(
        LEFT,
        HISTBASE,
        RIGHT,
        HISTBASE,
        C.muted,
        3
      ),

      ln(
        LEFT,
        HISTBASE,
        LEFT,
        top,
        C.muted,
        2
      ),

      txt(
        'count',
        P ? 15 : 13,
        C.muted,
        [LEFT + 0.28, top + 0.25, 0]
      ),

      txt(
        title,
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.57, 0]
      )
    );

    [25, 27, 29, 30, 31, 33, 35].forEach(v => {
      baseParts.push(
        ln(
          histX(v),
          HISTBASE - 0.07,
          histX(v),
          HISTBASE + 0.07,
          C.muted,
          1.5
        ),

        txt(
          String(v),
          P ? 16 : 14,
          C.muted,
          [histX(v), HISTBASE - 0.26, 0],
          true
        )
      );
    });

    baseParts.push(txt(
      'resample median (minutes)',
      P ? 18 : 16,
      C.muted,
      [CX, HISTBASE - 0.58, 0]
    ));

    const barW =
      (histX(25.5) - histX(25)) *
      (showLumps ? 0.56 : 0.69);

    function segment(x, count, startingCount, color, opacity) {
      if (count <= 0) return;

      const h = Math.max(0.001, histH(count));

      bars.push(rect(
        barW,
        h,
        x,
        HISTBASE + histH(startingCount) + h / 2,
        color,
        opacity,
        0.8
      ));
    }

    MEDIAN_VALUES.forEach((v, i) => {
      const count = MEDIAN_COUNTS[i];
      const x = histX(v);

      let trimmed = 0;

      if (trimLower) {
        if (v < PERCENTILE_LO) {
          trimmed = count;
        }

        if (v === PERCENTILE_LO) {
          trimmed = LO_TIES_TRIMMED;
        }
      }

      if (trimUpper) {
        if (v > PERCENTILE_HI) {
          trimmed = count;
        }

        if (v === PERCENTILE_HI) {
          trimmed = HI_TIES_TRIMMED;
        }
      }

      const retained = count - trimmed;

      let color = C.cyan;
      let opacity = 0.83;

      if (highlight30) {
        color = v === 30 ? C.violet : C.cyan;
        opacity = v === 30 ? 0.95 : 0.38;
      }

      if (showMiddle) {
        color = C.green;
        opacity = 0.86;
      }

      // Boundary bars may contain both retained and trimmed
      // observations because many medians have identical values.
      segment(
        x,
        retained,
        0,
        color,
        opacity
      );

      segment(
        x,
        trimmed,
        retained,
        MISS,
        0.90
      );
    });

    if (highlight30) {
      const barTop = HISTBASE + histH(COUNT_AT_30);

      extras.push(
        txt(
          '2,376',
          P ? 20 : 18,
          C.violet,
          [histX(30), barTop + 0.27, 0],
          true
        ),

        txt(
          '23.76%',
          P ? 24 : 22,
          C.violet,
          [histX(32.65), HISTBASE + HISTHEIGHT * 0.72, 0],
          true
        ),

        txt(
          '≈ 24 in 100',
          P ? 18 : 16,
          C.ink,
          [histX(32.65), HISTBASE + HISTHEIGHT * 0.72 - 0.38, 0]
        )
      );
    }

    if (showLumps) {
      const y = HISTBASE + HISTHEIGHT * 0.66;

      extras.push(
        txt(
          'Separate bars',
          P ? 20 : 18,
          C.violet,
          [histX(27), y, 0]
        ),

        arrow(
          histX(27.6),
          y - 0.21,
          histX(28.25),
          HISTBASE + histH(628) + 0.18,
          C.violet,
          1.8
        )
      );
    }

    if (showCuts) {
      if (trimLower) {
        extras.push(new M.DashedLine({
          start: [
            histX(PERCENTILE_LO),
            HISTBASE,
            0
          ],

          end: [
            histX(PERCENTILE_LO),
            top - 0.05,
            0
          ],

          color: C.green
        }));
      }

      if (trimUpper) {
        extras.push(new M.DashedLine({
          start: [
            histX(PERCENTILE_HI),
            HISTBASE,
            0
          ],

          end: [
            histX(PERCENTILE_HI),
            top - 0.05,
            0
          ],

          color: C.green
        }));
      }
    }

    if (showMiddle) {
      extras.push(
        txt(
          '95%',
          P ? 29 : 26,
          C.green,
          [histX(32.0), top - 0.43, 0],
          true
        ),

        txt(
          'middle',
          P ? 17 : 15,
          C.green,
          [histX(32.0), top - 0.80, 0]
        )
      );
    }

    if (showCounts) {
      if (trimLower) {
        extras.push(
          txt(
            '250',
            P ? 19 : 17,
            MISS,
            [histX(26), HISTBASE + 0.75, 0],
            true
          ),

          txt(
            'lowest',
            P ? 16 : 14,
            MISS,
            [histX(26), HISTBASE + 1.05, 0]
          )
        );
      }

      if (trimUpper) {
        extras.push(
          txt(
            '250',
            P ? 19 : 17,
            MISS,
            [histX(34), HISTBASE + 0.75, 0],
            true
          ),

          txt(
            'highest',
            P ? 16 : 14,
            MISS,
            [histX(34), HISTBASE + 1.05, 0]
          )
        );
      }
    }

    if (showPercentiles) {
      extras.push(
        txt(
          '2.5th',
          P ? 19 : 17,
          C.green,
          [histX(27), HISTBASE - 0.93, 0],
          true
        ),

        txt(
          '97.5th',
          P ? 19 : 17,
          C.green,
          [histX(33), HISTBASE - 0.93, 0],
          true
        )
      );
    }

    return {
      base: new M.VGroup(...baseParts),
      bars,
      extras
    };
  }

  function histogramPicture(options = {}) {
    const h = histogramParts(options);

    return new M.VGroup(
      h.base,
      ...h.bars,
      ...h.extras
    );
  }

  // ---------------------------------------------------------------
  // Why the medians occur at whole and half minutes.
  //
  // Two actual possible middle values determine the median.
  // ---------------------------------------------------------------

  function middlePairPicture({
    a = 30,
    b = 30,
    showResult = true,
    title = 'Average the two middle values'
  } = {}) {
    const y = P ? 0.03 : 0.10;

    const parts = [
      txt(
        title,
        P ? 22 : 20,
        C.ink,
        [CX, y + 1.12, 0]
      ),

      card(
        a,
        CX - 0.85,
        y,
        C.green,
        1.15,
        0.79,
        P ? 30 : 27
      ),

      card(
        b,
        CX + 0.85,
        y,
        C.green,
        1.15,
        0.79,
        P ? 30 : 27
      ),

      txt(
        '8th',
        P ? 18 : 16,
        C.muted,
        [CX - 0.85, y + 0.63, 0],
        true
      ),

      txt(
        '9th',
        P ? 18 : 16,
        C.muted,
        [CX + 0.85, y + 0.63, 0],
        true
      ),

      txt(
        '+',
        P ? 26 : 24,
        C.ink,
        [CX, y, 0],
        true
      )
    ];

    if (showResult) {
      const value = (a + b) / 2;

      parts.push(
        arrow(
          CX,
          y - 0.48,
          CX,
          y - 0.96,
          C.violet
        ),

        txt(
          `(${a} + ${b}) ÷ 2`,
          P ? 27 : 24,
          C.ink,
          [CX, y - 1.27, 0],
          true
        ),

        txt(
          String(value),
          P ? 36 : 32,
          C.violet,
          [CX, y - 1.90, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function halfMinutePicture() {
    const x = v => LEFT + (v - 28.5) / 3 * W;

    const base = P ? -2.55 : -1.72;

    const parts = [
      axis(
        x,
        [29, 29.5, 30, 30.5, 31],
        base,
        'possible median values'
      ),

      txt(
        'Only whole and half minutes',
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.14 : 1.15, 0]
      )
    ];

    const examples = [
      { a: 29, b: 29, result: 29 },
      { a: 29, b: 30, result: 29.5 },
      { a: 30, b: 30, result: 30 },
      { a: 30, b: 31, result: 30.5 },
      { a: 31, b: 31, result: 31 }
    ];

    examples.forEach(({ a, b, result }, i) => {
      const px = x(result);

      parts.push(
        glowDot(
          px,
          base + 0.35,
          Number.isInteger(result) ? C.cyan : C.violet,
          P ? 0.10 : 0.085
        ),

        txt(
          `${a}+${b}`,
          P ? 15 : 13,
          C.ink,
          [px, base + 1.22, 0],
          true,
          W / 6.2
        ),

        ln(
          px - 0.30,
          base + 1.02,
          px + 0.30,
          base + 1.02,
          C.muted,
          1.5
        ),

        txt(
          '2',
          P ? 15 : 13,
          C.ink,
          [px, base + 0.82, 0],
          true
        )
      );
    });

    [29.25, 29.75, 30.25, 30.75].forEach(v => {
      parts.push(txt(
        '×',
        P ? 17 : 15,
        MISS,
        [x(v), base + 0.35, 0],
        true
      ));
    });

    parts.push(
      txt(
        'No quarter-minute medians',
        P ? 20 : 18,
        MISS,
        [CX, P ? -0.45 : -0.15, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Representative grid for the frequency of median = 30.
  //
  // 24 highlighted dots illustrate the rounded 23.76% frequency.
  // They are not presented as the actual first 100 bootstrap draws.
  // ---------------------------------------------------------------

  function thirtyFrequencyPicture() {
    const dx = P ? 0.45 : 0.38;
    const dy = P ? 0.36 : 0.24;

    const top = P ? 0.68 : 0.71;

    const parts = [];

    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);

      const hit = ((i * 37 + 11) % 100) < 24;

      parts.push(glowDot(
        CX + (col - 4.5) * dx,
        top - row * dy,
        hit ? C.violet : C.muted,
        P ? 0.075 : 0.055
      ));
    }

    const bottom = top - 9 * dy;

    parts.push(
      txt(
        'How often is the median exactly 30?',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.55, 0]
      ),

      txt(
        'About 24 in 100',
        P ? 26 : 23,
        C.violet,
        [CX, bottom - 0.47, 0],
        true
      ),

      txt(
        '2,376 of 10,000 = 23.76%',
        P ? 19 : 17,
        C.ink,
        [CX, bottom - 0.88, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // The sorted bootstrap pile as a rank strip.
  //
  // This is a rank representation, not a minutes axis.
  // Its lengths are exactly proportional to the number of medians.
  //
  // First 250 | Middle 9500 | Last 250
  // ---------------------------------------------------------------

  function rankStripPicture({
    trim = false,
    showCounts = false,
    showPercentiles = false,
    showEndpoints = false
  } = {}) {
    const y = P ? -0.22 : -0.29;
    const h = P ? 0.80 : 0.65;

    const w = W - 0.35;
    const left = CX - w / 2;
    const right = CX + w / 2;

    const tailW = w * 0.025;
    const middleW = w * 0.95;

    const parts = [];

    if (trim) {
      parts.push(
        rect(
          tailW,
          h,
          left + tailW / 2,
          y,
          MISS,
          0.95,
          1
        ),

        rect(
          middleW,
          h,
          CX,
          y,
          C.green,
          0.84,
          1
        ),

        rect(
          tailW,
          h,
          right - tailW / 2,
          y,
          MISS,
          0.95,
          1
        )
      );
    } else {
      parts.push(rect(
        w,
        h,
        CX,
        y,
        C.cyan,
        0.75,
        1
      ));
    }

    // Small vertical divisions communicate sorted positions.
    for (let i = 1; i < 40; i++) {
      const x = left + i / 40 * w;

      parts.push(ln(
        x,
        y - h / 2,
        x,
        y + h / 2,
        C.card,
        0.7
      ));
    }

    parts.push(
      txt(
        '10,000 medians in sorted order',
        P ? 23 : 21,
        C.ink,
        [CX, y + (P ? 1.72 : 1.48), 0]
      ),

      txt(
        'Smallest',
        P ? 18 : 16,
        C.muted,
        [left + 0.48, y - h / 2 - 0.40, 0]
      ),

      txt(
        'Largest',
        P ? 18 : 16,
        C.muted,
        [right - 0.48, y - h / 2 - 0.40, 0]
      )
    );

    if (trim) {
      parts.push(
        txt(
          showCounts ? '9,500' : '95%',
          P ? 32 : 29,
          C.ink,
          [CX, y, 0],
          true
        ),

        arrow(
          left + 0.76,
          y + h / 2 + (P ? 0.46 : 0.69),
          left + tailW / 2,
          y + h / 2 + 0.06,
          MISS,
          2
        ),

        arrow(
          right - 0.76,
          y + h / 2 + (P ? 0.46 : 0.69),
          right - tailW / 2,
          y + h / 2 + 0.06,
          MISS,
          2
        ),

        txt(
          showCounts ? '250' : '2.5%',
          P ? 21 : 19,
          MISS,
          [left + 0.87, y + h / 2 + (P ? 0.64 : 0.88), 0],
          true
        ),

        txt(
          showCounts ? '250' : '2.5%',
          P ? 21 : 19,
          MISS,
          [right - 0.87, y + h / 2 + (P ? 0.64 : 0.88), 0],
          true
        )
      );
    }

    if (showPercentiles) {
      parts.push(
        txt(
          '2.5th percentile',
          P ? 18 : 16,
          C.green,
          [CX - 1.62, y - 1.40, 0]
        ),

        txt(
          '97.5th percentile',
          P ? 18 : 16,
          C.green,
          [CX + 1.62, y - 1.40, 0]
        )
      );
    }

    if (showEndpoints) {
      parts.push(
        txt(
          '27 min',
          P ? 27 : 24,
          C.green,
          [CX - 1.62, y - 1.86, 0],
          true
        ),

        txt(
          '33 min',
          P ? 27 : 24,
          C.green,
          [CX + 1.62, y - 1.86, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Count into the sorted pile from either end.
  //
  // Actual seed-62 ranks are used:
  // Ascending rank 250 is 27.
  // Descending rank 250 is 33.
  //
  // The boundary values contain ties, so the count of observations
  // strictly below or above the endpoint is smaller than 250.
  // ---------------------------------------------------------------

  function percentileCountPicture(side = 'lower') {
    const lower = side === 'lower';

    const firstCount = lower ? BELOW_LO : ABOVE_HI;
    const tiedCount = lower ? AT_LO : AT_HI;

    const trimTies = lower
      ? LO_TIES_TRIMMED
      : HI_TIES_TRIMMED;

    const value = lower
      ? PERCENTILE_LO
      : PERCENTILE_HI;

    const remainingTies = tiedCount - trimTies;

    const x0 = LEFT + 0.25;
    const x1 = RIGHT - 0.25;

    const displayCount = firstCount + tiedCount;

    const rankX = rank =>
      x0 + rank / displayCount * (x1 - x0);

    const cutX = rankX(TAIL_COUNT);

    const y = P ? -0.40 : -0.35;
    const h = P ? 0.66 : 0.51;

    const parts = [
      txt(
        lower
          ? 'Count from the smallest median'
          : 'Count from the largest median',
        P ? 22 : 20,
        C.ink,
        [CX, P ? 1.16 : 1.15, 0]
      ),

      rect(
        rankX(firstCount) - x0,
        h,
        (x0 + rankX(firstCount)) / 2,
        y,
        MISS,
        0.88,
        1
      ),

      rect(
        cutX - rankX(firstCount),
        h,
        (cutX + rankX(firstCount)) / 2,
        y,
        MISS,
        0.88,
        1
      ),

      rect(
        x1 - cutX,
        h,
        (cutX + x1) / 2,
        y,
        C.green,
        0.88,
        1
      ),

      ln(
        rankX(firstCount),
        y - h / 2,
        rankX(firstCount),
        y + h / 2,
        C.ink,
        1.5
      ),

      bracket(
        rankX(firstCount),
        x1,
        y + h / 2 + 0.27,
        C.violet,
        0.09
      ),

      txt(
        `${tiedCount} medians equal ${value}`,
        P ? 19 : 17,
        C.violet,
        [(rankX(firstCount) + x1) / 2, y + h / 2 + 0.60, 0]
      ),

      txt(
        String(firstCount),
        P ? 22 : 20,
        C.ink,
        [(x0 + rankX(firstCount)) / 2, y, 0],
        true
      ),

      txt(
        String(trimTies),
        P ? 19 : 17,
        C.ink,
        [(rankX(firstCount) + cutX) / 2, y, 0],
        true
      ),

      txt(
        String(remainingTies),
        P ? 21 : 19,
        C.ink,
        [(cutX + x1) / 2, y, 0],
        true
      ),

      txt(
        lower ? 'Below 27' : 'Above 33',
        P ? 17 : 15,
        MISS,
        [(x0 + rankX(firstCount)) / 2, y - h / 2 - 0.32, 0]
      ),

      txt(
        'Retained ties',
        P ? 17 : 15,
        C.green,
        [(cutX + x1) / 2, y - h / 2 - 0.32, 0]
      ),

      ln(
        cutX,
        y - h / 2 - 0.66,
        cutX,
        y + h / 2 + 0.12,
        C.green,
        3
      ),

      txt(
        `250th = ${value} minutes`,
        P ? 24 : 22,
        C.green,
        [CX, y - 1.42, 0],
        true
      ),

      txt(
        'Ties can straddle the cut.',
        P ? 17 : 15,
        C.muted,
        [CX, y - 1.86, 0]
      )
    ];

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // The actual percentile bootstrap interval for the median.
  //
  // There is no displayed true population median, because it
  // remains unknown.
  // ---------------------------------------------------------------

  function intervalPicture({
    showTitle = true,
    showPercentiles = false,
    approximate = false,
    showWidth = false
  } = {}) {
    const y = P ? -0.42 : -0.35;
    const base = P ? -2.95 : -1.95;

    const parts = [
      axis(
        closeX,
        [25, 27, 29, 30, 31, 33, 35],
        base
      ),

      net(
        closeX,
        PERCENTILE_LO,
        PERCENTILE_HI,
        y,
        C.green,
        0.19
      ),

      glowDot(
        closeX(ORIGINAL_MEDIAN),
        y,
        C.violet,
        0.13
      ),

      txt(
        '27',
        P ? 29 : 26,
        C.green,
        [closeX(PERCENTILE_LO), y - 0.46, 0],
        true
      ),

      txt(
        '33',
        P ? 29 : 26,
        C.green,
        [closeX(PERCENTILE_HI), y - 0.46, 0],
        true
      ),

      txt(
        'median estimate = 30',
        P ? 21 : 19,
        C.violet,
        [CX, y + 0.47, 0],
        true
      )
    ];

    if (showTitle) {
      parts.push(txt(
        '95% percentile bootstrap interval',
        P ? 23 : 21,
        C.green,
        [CX, y + 1.31, 0]
      ));
    }

    if (showPercentiles) {
      parts.push(
        txt(
          '2.5th percentile',
          P ? 17 : 15,
          C.green,
          [closeX(PERCENTILE_LO), y + 0.88, 0]
        ),

        txt(
          '97.5th percentile',
          P ? 17 : 15,
          C.green,
          [closeX(PERCENTILE_HI), y + 0.88, 0]
        )
      );
    }

    parts.push(txt(
      approximate
        ? 'Approximately 27 to 33 minutes'
        : '27 to 33 minutes',
      P ? 24 : 22,
      C.green,
      [CX, y - 1.08, 0]
    ));

    if (showWidth) {
      parts.push(
        bracket(
          closeX(PERCENTILE_LO),
          closeX(PERCENTILE_HI),
          y + 0.86,
          C.green,
          0.09
        ),

        txt(
          'Width = 6 minutes',
          P ? 18 : 16,
          C.green,
          [CX, y + 1.13, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Compare the median percentile interval and the mean t interval.
  //
  // Both are plotted on the same horizontal scale.
  // Median interval: 27–33, width 6.
  // Mean t interval: 27.87–32.13, width 4.26.
  // ---------------------------------------------------------------

  function intervalComparison({
    showMedian = true,
    showWidths = false
  } = {}) {
    const topY = P ? 0.40 : 0.45;
    const bottomY = P ? -1.65 : -1.07;

    const base = P ? -3.55 : -2.22;

    const parts = [
      axis(
        closeX,
        [25, 27, 29, 30, 31, 33, 35],
        base
      )
    ];

    if (showMedian) {
      parts.push(
        net(
          closeX,
          PERCENTILE_LO,
          PERCENTILE_HI,
          topY,
          C.green,
          0.16
        ),

        glowDot(
          closeX(30),
          topY,
          C.violet,
          0.085
        ),

        txt(
          'Median: percentile bootstrap',
          P ? 21 : 19,
          C.green,
          [CX, topY + 0.56, 0]
        ),

        txt(
          '27',
          P ? 20 : 18,
          C.green,
          [closeX(PERCENTILE_LO), topY - 0.37, 0],
          true
        ),

        txt(
          '33',
          P ? 20 : 18,
          C.green,
          [closeX(PERCENTILE_HI), topY - 0.37, 0],
          true
        )
      );
    }

    parts.push(
      net(
        closeX,
        T_LO,
        T_HI,
        bottomY,
        C.cyan,
        0.16
      ),

      glowDot(
        closeX(30),
        bottomY,
        C.violet,
        0.085
      ),

      txt(
        'Mean: one-sample t interval',
        P ? 21 : 19,
        C.cyan,
        [CX, bottomY + 0.56, 0]
      ),

      txt(
        '27.87',
        P ? 18 : 16,
        C.cyan,
        [closeX(T_LO), bottomY - 0.37, 0],
        true
      ),

      txt(
        '32.13',
        P ? 18 : 16,
        C.cyan,
        [closeX(T_HI), bottomY - 0.37, 0],
        true
      )
    );

    if (showWidths) {
      parts.push(
        txt(
          '6 min',
          P ? 18 : 16,
          C.green,
          [CX, topY - 0.38, 0],
          true
        ),

        txt(
          '4.26 min',
          P ? 18 : 16,
          C.cyan,
          [CX, bottomY - 0.38, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Bootstrap workflow.
  //
  // Sample -> resamples -> statistics -> sorted estimates -> net.
  // ---------------------------------------------------------------

  function workflowPicture({
    statistic = 'median',
    showNet = true
  } = {}) {
    const top = P ? 0.73 : 0.88;
    const middle = P ? -1.05 : -0.42;
    const bottom = P ? -3.40 : -2.00;

    const parts = [];

    const dx = P ? 0.33 : 0.29;

    for (let i = 0; i < N; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(glowDot(
        CX + (col - 3.5) * dx,
        top - row * 0.24,
        C.cyan,
        P ? 0.065 : 0.052
      ));
    }

    parts.push(
      outline(
        CX,
        top - 0.12,
        8 * dx + 0.19,
        0.65,
        C.cyan
      ),

      txt(
        'Original sample',
        P ? 20 : 18,
        C.cyan,
        [CX, top + 0.52, 0]
      )
    );

    const branchDX = 1.65;

    for (let k = 0; k < 3; k++) {
      const x = CX + (k - 1) * branchDX;

      parts.push(
        arrow(
          CX,
          top - 0.49,
          x,
          middle + 0.39,
          C.muted,
          1.8
        ),

        outline(
          x,
          middle,
          1.14,
          0.76,
          C.violet
        )
      );

      for (let i = 0; i < N; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);

        parts.push(glowDot(
          x + (col - 1.5) * 0.20,
          middle + (1.5 - row) * 0.16,
          C.violet,
          P ? 0.043 : 0.034
        ));
      }

      parts.push(
        txt(
          statistic,
          P ? 17 : 15,
          C.violet,
          [x, middle - 0.55, 0]
        ),

        arrow(
          x,
          middle - 0.71,
          x,
          bottom + 0.54,
          C.muted,
          1.7
        )
      );
    }

    // Schematic compact pile of computed statistics.
    const heights = [1, 3, 5, 8, 12, 8, 5, 3, 1];

    const bw = W / 13;
    const scale = P ? 0.063 : 0.038;

    heights.forEach((h, i) => {
      const height = h * scale;
      const color = showNet && (i === 0 || i === 8)
        ? MISS
        : C.green;

      parts.push(rect(
        bw * 0.67,
        height,
        CX + (i - 4) * bw,
        bottom + height / 2,
        color,
        0.83,
        1
      ));
    });

    if (showNet) {
      parts.push(
        bracket(
          CX - 3.4 * bw,
          CX + 3.4 * bw,
          bottom - 0.20,
          C.green,
          0.08
        ),

        txt(
          'Read the middle 95%',
          P ? 20 : 18,
          C.green,
          [CX, bottom - 0.55, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Different statistics, one resampling method.
  // ---------------------------------------------------------------

  function applicationsPicture() {
    const items = [
      {
        name: 'Median',
        desc: 'Middle waiting time',
        color: C.green
      },

      {
        name: 'Percentile',
        desc: '90th-percentile wait',
        color: C.cyan
      },

      {
        name: 'Ratio',
        desc: 'One total ÷ another',
        color: C.violet
      }
    ];

    const top = P ? 0.72 : 0.81;
    const pitch = P ? 1.32 : 0.97;

    const parts = [];

    items.forEach(({ name, desc, color }, i) => {
      const y = top - i * pitch;

      const r = new M.RoundedRectangle({
        width: W - 0.32,
        height: pitch * 0.78,
        cornerRadius: 0.12,
        color,
        strokeWidth: 1.5
      });

      r.setFill(C.card, 0.95);
      r.moveTo([CX, y, 0]);

      parts.push(
        r,

        txt(
          name,
          P ? 22 : 20,
          color,
          [CX - W * 0.29, y, 0],
          false,
          W * 0.30
        ),

        txt(
          desc,
          P ? 19 : 17,
          C.ink,
          [CX + W * 0.14, y, 0],
          false,
          W * 0.55
        )
      );
    });

    parts.push(txt(
      'Resample · calculate · sort · read endpoints',
      P ? 20 : 18,
      C.violet,
      [CX, top - 2 * pitch - 0.85, 0]
    ));

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Schematic warning about small-sample bootstrap distributions.
  //
  // The uneven pile below is illustrative, not another simulation
  // of Sami's original observations.
  // ---------------------------------------------------------------

  function lopsidedPilePicture() {
    const heights = [
      0, 1, 0, 3, 8, 2, 12,
      4, 0, 7, 1, 0, 2
    ];

    const dx = W / 15;

    const base = P ? -3.03 : -1.87;
    const scale = P ? 0.255 : 0.190;

    const parts = [
      ln(
        LEFT,
        base,
        RIGHT,
        base,
        C.muted,
        3
      ),

      txt(
        'Small samples can give uneven piles',
        P ? 22 : 20,
        GOLD,
        [CX, P ? 1.14 : 1.14, 0]
      )
    ];

    heights.forEach((count, i) => {
      if (!count) return;

      const h = count * scale;
      const x = CX + (i - 6) * dx;

      parts.push(rect(
        dx * 0.60,
        h,
        x,
        base + h / 2,
        C.violet,
        0.82,
        1
      ));
    });

    const xLeft = CX - 4 * dx;
    const xRight = CX + 3 * dx;

    [xLeft, xRight].forEach(x => {
      parts.push(new M.DashedLine({
        start: [x, base, 0],
        end: [x, base + 12 * scale + 0.18, 0],
        color: GOLD
      }));
    });

    parts.push(
      txt(
        '?',
        P ? 25 : 22,
        GOLD,
        [xLeft, base + 12 * scale + 0.43, 0],
        true
      ),

      txt(
        '?',
        P ? 25 : 22,
        GOLD,
        [xRight, base + 12 * scale + 0.43, 0],
        true
      ),

      txt(
        'Endpoint estimates may be inaccurate',
        P ? 20 : 18,
        GOLD,
        [CX, base - 0.40, 0]
      ),

      txt(
        'Illustrative bootstrap distribution',
        P ? 16 : 14,
        C.muted,
        [CX, base - 0.79, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // More resamples versus more actual observations.
  //
  // Increasing B improves Monte Carlo precision.
  // Increasing the number of real observations improves the
  // information available to estimate population quantities.
  // ---------------------------------------------------------------

  function moreDataPicture() {
    const top = P ? 0.57 : 0.66;
    const bottom = P ? -1.88 : -1.20;

    const parts = [];

    const dx = P ? 0.40 : 0.35;
    const dy = P ? 0.34 : 0.27;

    for (let i = 0; i < 16; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(glowDot(
        CX + (col - 3.5) * dx,
        top - row * dy,
        C.cyan,
        P ? 0.085 : 0.070
      ));
    }

    parts.push(txt(
      'Current real sample: 16 deliveries',
      P ? 21 : 19,
      C.ink,
      [CX, top + 0.60, 0]
    ));

    for (let i = 0; i < 32; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(glowDot(
        CX + (col - 3.5) * dx,
        bottom - row * dy,
        i < 16 ? C.cyan : C.green,
        P ? 0.085 : 0.070
      ));
    }

    parts.push(
      arrow(
        CX,
        top - dy - 0.18,
        CX,
        bottom + (P ? 0.95 : 0.88),
        C.green,
        2.5
      ),

      txt(
        'Collect additional real deliveries',
        P ? 21 : 19,
        C.green,
        [CX, bottom + (P ? 0.66 : 0.60), 0]
      ),

      txt(
        'More information, not just more copies',
        P ? 19 : 17,
        C.ink,
        [CX, bottom - 3 * dy - 0.57, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Illustrate why a few hundred resamples give less stable
  // percentile estimates.
  //
  // The tail-count arithmetic is exact:
  // 2.5% of 200 = 5.
  // 2.5% of 10,000 = 250.
  //
  // No invented interval endpoints are displayed.
  // ---------------------------------------------------------------

  function resampleCountComparison() {
    const topY = P ? 0.25 : 0.35;
    const bottomY = P ? -1.80 : -1.16;

    const w = W - 0.40;
    const left = CX - w / 2;

    const h = P ? 0.46 : 0.36;

    const parts = [];

    function row(y, count, tailCount, color) {
      const tailW = w * 0.025;
      const middleW = w * 0.95;

      parts.push(
        rect(
          tailW,
          h,
          left + tailW / 2,
          y,
          MISS,
          0.90,
          1
        ),

        rect(
          middleW,
          h,
          CX,
          y,
          color,
          0.80,
          1
        ),

        rect(
          tailW,
          h,
          left + w - tailW / 2,
          y,
          MISS,
          0.90,
          1
        ),

        txt(
          `${count.toLocaleString('en-US')} resamples`,
          P ? 22 : 20,
          color,
          [CX, y + 0.58, 0]
        ),

        txt(
          `Only ${tailCount} in each tail`,
          P ? 19 : 17,
          C.ink,
          [CX, y - 0.48, 0]
        )
      );

      const divisions = count === 200 ? 20 : 60;

      for (let i = 1; i < divisions; i++) {
        const x = left + i / divisions * w;

        parts.push(ln(
          x,
          y - h / 2,
          x,
          y + h / 2,
          C.card,
          0.6
        ));
      }
    }

    row(topY, 200, 5, GOLD);
    row(bottomY, 10000, 250, C.green);

    parts.push(txt(
      'More resamples stabilise the percentile calculation',
      P ? 19 : 17,
      C.green,
      [CX, bottomY - 1.03, 0]
    ));

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Preview the independence issue without revealing the
  // four-day structure of the actual sample.
  //
  // That information belongs to lesson 6.2.8.
  // ---------------------------------------------------------------

  function independencePreview() {
    const top = P ? 0.38 : 0.44;
    const bottom = P ? -1.77 : -1.12;

    const dx = W / 9;

    const parts = [];

    for (let i = 0; i < 8; i++) {
      const x = CX + (i - 3.5) * dx;

      parts.push(glowDot(
        x,
        top,
        C.cyan,
        P ? 0.105 : 0.085
      ));
    }

    parts.push(txt(
      'Independent observations',
      P ? 22 : 20,
      C.cyan,
      [CX, top + 0.59, 0]
    ));

    // Schematic related observations.
    // These are not the actual day groupings of Sami's data.
    for (let i = 0; i < 8; i++) {
      const x = CX + (i - 3.5) * dx;

      parts.push(glowDot(
        x,
        bottom,
        C.violet,
        P ? 0.105 : 0.085
      ));
    }

    [0, 2, 4, 6].forEach(i => {
      const a = CX + (i - 3.5) * dx;
      const b = CX + (i + 1 - 3.5) * dx;

      parts.push(
        ln(
          a,
          bottom,
          b,
          bottom,
          GOLD,
          3
        ),

        outline(
          (a + b) / 2,
          bottom,
          b - a + 0.32,
          0.50,
          GOLD
        )
      );
    });

    parts.push(
      txt(
        'What if observations are related?',
        P ? 21 : 19,
        GOLD,
        [CX, bottom + 0.62, 0]
      ),

      txt(
        'Does drawing single cards still work?',
        P ? 19 : 17,
        C.ink,
        [CX, bottom - 0.73, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // NARRATION-SYNCHRONISED BEATS
  // ===============================================================

  // ---------------------------------------------------------------
  // 0: Sami's manager prefers the median delivery time.
  // ---------------------------------------------------------------

  const opening = deliveryPicture({
    title: 'Sami’s delivery times'
  });

  await until(S(0));
  await play(
    ...picture(opening),
    ...say('THE MANAGER PREFERS THE MEDIAN', C.violet),
    ...fbox([
      '16 delivery times',
      ['Use the median', C.violet],
      'instead of the mean.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 1: The median is the middle value when the times are sorted.
  // Half the observations occupy the lower half and half the
  // upper half. Ties at the median are possible.
  // ---------------------------------------------------------------

  const halves = sortedCardsPicture(D1, {
    showHalves: true,
    title: 'Sort from fastest to slowest'
  });

  await until(S(1));
  await play(
    ...picture(halves),
    ...say('MEDIAN = THE MIDDLE OF SORTED DATA', C.green),
    ...fbox([
      'Sort the observations.',
      '8 lower positions',
      '8 upper positions',
      ['Find the middle.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 2: The eighth and ninth values are both thirty.
  // ---------------------------------------------------------------

  const twoMiddle = sortedCardsPicture(D1, {
    highlightMiddle: true,
    title: 'Find the two middle positions'
  });

  await until(S(2));
  await play(
    ...picture(twoMiddle),
    ...say('8TH VALUE = 30 · 9TH VALUE = 30', C.green),
    ...fbox([
      '16 is an even number.',
      ['8th value = 30', C.green],
      ['9th value = 30', C.green],
      'Average these two.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 3: The median is thirty minutes.
  // ---------------------------------------------------------------

  const originalMedian = sortedCardsPicture(D1, {
    highlightMiddle: true,
    showCalculation: true,
    title: 'The sample median'
  });

  await until(S(3));
  await play(
    ...picture(originalMedian),
    ...say('MEDIAN = 30 MINUTES', C.violet),
    ...fbox([
      '(30 + 30) ÷ 2',
      '60 ÷ 2',
      ['= 30 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 4: Sami wants a net around the median.
  // ---------------------------------------------------------------

  const goalNet = deliveryPicture({
    showMedian: true,
    showNet: true,
    title: 'An interval for the median'
  });

  await until(S(4));
  await play(
    ...picture(goalNet),
    ...say('BUILD A NET AROUND THE MEDIAN'),
    ...fbox([
      ['estimate = 30', C.violet],
      'Lower endpoint = ?',
      'Upper endpoint = ?'
    ])
  );

  // ---------------------------------------------------------------
  // 5: There is no simple general standard-error formula.
  // Use the bootstrap.
  // ---------------------------------------------------------------

  const bootstrapReminder = workflowPicture({
    statistic: 'median',
    showNet: false
  });

  await until(S(5));
  await play(
    ...picture(bootstrapReminder),
    ...say('NO SIMPLE SE FORMULA? USE THE BOOTSTRAP', C.violet),
    ...fbox([
      'Instead of an SE formula:',
      ['Resample our data.', C.violet],
      'Calculate each median.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 6: Step one — draw sixteen cards with replacement.
  // ---------------------------------------------------------------

  const drawEmpty = bootstrapDrawPicture(0);

  const animatedDraws = DRAW.map((v, i) => {
    const p = slot(DRAW_X, i);

    return card(
      v,
      p[0],
      p[1],
      C.violet,
      CARD_DX * 0.84,
      CARD_DY * 0.80,
      P ? 18 : 16
    );
  });

  await until(S(6));
  await play(
    ...picture(drawEmpty),
    ...say('STEP 1: DRAW 16 WITH REPLACEMENT'),
    ...fbox([
      'Draw one card.',
      'Record it and return it.',
      ['Repeat 16 times.', C.violet]
    ])
  );

  await play(
    new M.LaggedStart(
      animatedDraws.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.10,
        runTime: 1.65
      }
    )
  );

  // ---------------------------------------------------------------
  // 7: Step two — sort the resample and find its median.
  // ---------------------------------------------------------------

  const sortedResample = sortedCardsPicture(RESAMPLE, {
    color: C.violet,
    highlightMiddle: true,
    title: 'Sort the bootstrap resample'
  });

  await until(S(7));
  await play(
    ...fadeAll(animatedDraws),
    ...picture(sortedResample),
    ...say('STEP 2: SORT AND FIND THE MEDIAN', C.green),
    ...fbox([
      'Sort the 16 drawn values.',
      ['8th = 31', C.green],
      ['9th = 31', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 8: The resample from last lesson has median thirty-one.
  // ---------------------------------------------------------------

  const resampleMedian = sortedCardsPicture(RESAMPLE, {
    color: C.violet,
    highlightMiddle: true,
    showCalculation: true,
    title: 'Median of the seed-62 resample'
  });

  await until(S(8));
  await play(
    ...picture(resampleMedian),
    ...say('RESAMPLE MEDIAN = 31 MINUTES', C.violet),
    ...fbox([
      '(31 + 31) ÷ 2',
      ['= 31 minutes', C.violet],
      'Original median = 30'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 9: Step three — repeat ten thousand times.
  // ---------------------------------------------------------------

  const repeatedSamples = repeatedResamplesPicture();

  await until(S(9));
  await play(
    ...picture(repeatedSamples),
    ...say('STEP 3: REPEAT 10,000 TIMES', C.violet),
    ...fbox([
      'Each resample: 16 values',
      'One median per resample',
      ['10,000 medians', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 10: Stack the ten thousand medians as a histogram.
  // Build the actual frequency bars progressively.
  // ---------------------------------------------------------------

  const histBuild = histogramParts();

  await until(S(10));
  await play(
    ...picture(histBuild.base),
    ...say('STACK THE 10,000 MEDIANS'),
    ...fbox([
      ['Bootstrap histogram', C.cyan],
      'One bar per median value',
      'Height = frequency'
    ])
  );

  await play(
    new M.LaggedStart(
      histBuild.bars.map(b => new M.FadeIn(b)),
      {
        lagRatio: 0.07,
        runTime: 1.9
      }
    )
  );

  // ---------------------------------------------------------------
  // 11: The pile is lumpy, with gaps between the bars.
  // ---------------------------------------------------------------

  const lumpyHistogram = histogramPicture({
    showLumps: true,
    title: 'A lumpy bootstrap distribution'
  });

  await until(S(11));
  await play(
    ...fadeAll(histBuild.bars),
    ...picture(lumpyHistogram),
    ...say('NOTICE THE GAPS BETWEEN THE BARS', GOLD),
    ...fbox([
      'Not a smooth curve.',
      ['Separate median values', GOLD],
      'Why are there gaps?'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 12: Each median averages the two middle whole-minute times.
  // Demonstrate an integer result, then a half-minute result.
  // ---------------------------------------------------------------

  const integerPair = middlePairPicture({
    a: 30,
    b: 30
  });

  await until(S(12));
  await play(
    ...picture(integerPair),
    ...say('MEDIAN = AVERAGE OF THE TWO MIDDLE TIMES'),
    ...fbox([
      'Delivery times:',
      'Whole minutes',
      ['(30 + 30) ÷ 2 = 30', C.green]
    ])
  );

  await until(S(12) + 2.6);

  const halfPair = middlePairPicture({
    a: 30,
    b: 31
  });

  await play(
    ...picture(halfPair),
    ...fbox([
      'Another possible pair:',
      ['(30 + 31) ÷ 2', C.green],
      ['= 30.5', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 13: A median can only be a whole or half minute.
  // ---------------------------------------------------------------

  const halfMinutes = halfMinutePicture();

  await until(S(13));
  await play(
    ...picture(halfMinutes),
    ...say('ONLY WHOLE OR HALF MINUTES', C.violet),
    ...fbox([
      'Possible: 30, 30.5, 31',
      ['Not possible: 30.25', MISS],
      'Explains the gaps.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 14: Thirty appears in about twenty-four of every hundred
  // resamples. Actual count = 2,376 of 10,000.
  // ---------------------------------------------------------------

  const frequency30 = histogramPicture({
    highlight30: true,
    title: 'Median = 30 occurs most often'
  });

  await until(S(14));
  await play(
    ...picture(frequency30),
    ...say('30 ALONE APPEARS ABOUT 24 IN 100', C.violet),
    ...fbox([
      'Median = 30',
      '2,376 of 10,000',
      '= 23.76%',
      ['≈ 24%', C.violet]
    ], C.violet)
  );

  await until(S(14) + 2.1);

  const frequencyGrid = thirtyFrequencyPicture();

  await play(
    ...picture(frequencyGrid)
  );

  // ---------------------------------------------------------------
  // 15: Now, the net.
  // Short narration beat: retain the picture and change the tag.
  // ---------------------------------------------------------------

  await until(S(15));
  await play(
    ...say('NOW, THE NET', C.green)
  );

  // ---------------------------------------------------------------
  // 16: We want the middle ninety-five percent of the pile.
  // ---------------------------------------------------------------

  const middle95 = rankStripPicture({
    trim: true
  });

  await until(S(16));
  await play(
    ...picture(middle95),
    ...say('KEEP THE MIDDLE 95%', C.green),
    ...fbox([
      'Sort all 10,000 medians.',
      ['Keep the middle 95%.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 17: Cut off the lowest 2.5% and the highest 2.5%.
  // Highlight the actual histogram tail counts.
  // ---------------------------------------------------------------

  const trimmedHistogram = histogramPicture({
    trimLower: true,
    trimUpper: true,
    showMiddle: true,
    showCounts: false,
    title: 'Trim the two tails'
  });

  await until(S(17));
  await play(
    ...picture(trimmedHistogram),
    ...say('REMOVE 2.5% FROM EACH END', MISS),
    ...fbox([
      ['Lowest 2.5%', MISS],
      ['Middle 95%', C.green],
      ['Highest 2.5%', MISS]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 18: Two and a half percent of ten thousand is 250.
  // ---------------------------------------------------------------

  const countStrip = rankStripPicture({
    trim: true,
    showCounts: true
  });

  await until(S(18));
  await play(
    ...picture(countStrip),
    ...say('2.5% OF 10,000 = 250', GOLD),
    ...fbox([
      '10,000 × 0.025',
      ['= 250 at each end', GOLD],
      ['9,500 in the middle', C.green]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 19: Count up from the bottom.
  // The 250th median is 27 minutes.
  // ---------------------------------------------------------------

  const lowerCount = percentileCountPicture('lower');

  await until(S(19));
  await play(
    ...picture(lowerCount),
    ...say('COUNT UP: THE 250TH MEDIAN IS 27', C.green),
    ...fbox([
      '188 below 27',
      '62 more at 27',
      '188 + 62 = 250',
      ['Lower endpoint = 27', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 20: Count down from the top.
  // The 250th median is 33 minutes.
  // ---------------------------------------------------------------

  const upperCount = percentileCountPicture('upper');

  await until(S(20));
  await play(
    ...picture(upperCount),
    ...say('COUNT DOWN: THE 250TH MEDIAN IS 33', C.green),
    ...fbox([
      '190 above 33',
      '60 more at 33',
      '190 + 60 = 250',
      ['Upper endpoint = 33', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 21: The interval runs from twenty-seven to thirty-three.
  // ---------------------------------------------------------------

  const completedInterval = intervalPicture();

  await until(S(21));
  await play(
    ...picture(completedInterval),
    ...say('THE INTERVAL IS 27 TO 33 MINUTES', C.green),
    ...fbox([
      ['Lower end = 27', C.green],
      ['Upper end = 33', C.green],
      '95% bootstrap interval'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 22: A value that cuts off a set percent of a pile
  // is called a percentile.
  // ---------------------------------------------------------------

  const percentileDefinition = rankStripPicture({
    trim: true,
    showPercentiles: true
  });

  await until(S(22));
  await play(
    ...picture(percentileDefinition),
    ...say('PERCENTILE = A CUT IN THE SORTED PILE', C.violet),
    ...fbox([
      ['Percentile', C.violet],
      'A value marking a',
      'specified position',
      'in sorted data.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 23: Twenty-seven is the 2.5th percentile.
  // Thirty-three is the 97.5th percentile.
  // ---------------------------------------------------------------

  const percentileHistogram = histogramPicture({
    trimLower: true,
    trimUpper: true,
    showMiddle: true,
    showCuts: true,
    showPercentiles: true,
    title: 'Read the two percentile boundaries'
  });

  await until(S(23));
  await play(
    ...picture(percentileHistogram),
    ...say('2.5TH PERCENTILE · 97.5TH PERCENTILE', C.green),
    ...fbox([
      ['2.5th percentile = 27', C.green],
      ['97.5th percentile = 33', C.green],
      'Read both endpoints',
      'from the sorted medians.'
    ], C.green)
  );

  await until(S(23) + 3.4);

  const percentileStrip = rankStripPicture({
    trim: true,
    showCounts: true,
    showPercentiles: true,
    showEndpoints: true
  });

  await play(
    ...picture(percentileStrip)
  );

  // ---------------------------------------------------------------
  // 24: Name the percentile bootstrap interval.
  // ---------------------------------------------------------------

  const namedInterval = intervalPicture({
    showPercentiles: true
  });

  await until(S(24));
  await play(
    ...picture(namedInterval),
    ...say('PERCENTILE BOOTSTRAP INTERVAL', C.green),
    ...fbox([
      ['Percentile bootstrap', C.green],
      'Lower percentile',
      'to upper percentile',
      ['27 to 33 minutes', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 25: Read both ends directly from the sorted resampled estimates.
  // ---------------------------------------------------------------

  const fullWorkflow = workflowPicture({
    statistic: 'median',
    showNet: true
  });

  await until(S(25));
  await play(
    ...picture(fullWorkflow),
    ...say('READ THE TWO ENDS STRAIGHT FROM THE PILE'),
    ...fbox([
      '1. Resample.',
      '2. Calculate estimates.',
      '3. Sort the estimates.',
      ['4. Read the percentiles.', C.green]
    ])
  );

  // ---------------------------------------------------------------
  // 26: No bell curve, no t cut-off, no formula for the spread.
  // ---------------------------------------------------------------

  const noFormulaHistogram = histogramPicture({
    trimLower: true,
    trimUpper: true,
    showMiddle: true,
    showCuts: true,
    title: 'Use the bootstrap distribution itself'
  });

  await until(S(26));
  await play(
    ...picture(noFormulaHistogram),
    ...say('NO BELL CURVE OR t CUT-OFF NEEDED', C.violet),
    ...fbox([
      'No normal curve.',
      'No t critical value.',
      'No spread formula.',
      ['Read the pile itself.', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 27: Compare with the mean's one-sample t interval.
  // Approximately twenty-eight to thirty-two.
  // ---------------------------------------------------------------

  const comparedIntervals = intervalComparison({
    showMedian: true,
    showWidths: false
  });

  await until(S(27));
  await play(
    ...picture(comparedIntervals),
    ...say('COMPARE WITH THE MEAN’S t INTERVAL', C.cyan),
    ...fbox([
      ['Mean: 27.87–32.13', C.cyan],
      'About 28 to 32',
      ['Median: 27–33', C.green]
    ])
  );

  // ---------------------------------------------------------------
  // 28: The median interval is wider here.
  // With these sixteen observations, the bootstrap medians
  // vary more than the bootstrap means.
  // ---------------------------------------------------------------

  const comparedWidths = intervalComparison({
    showMedian: true,
    showWidths: true
  });

  await until(S(28));
  await play(
    ...picture(comparedWidths),
    ...say('THE MEDIAN’S NET IS WIDER HERE', GOLD),
    ...fbox([
      ['Median width = 6 min', C.green],
      ['Mean width = 4.26 min', C.cyan],
      'Here, the median',
      'varies more.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 29: A percentile bootstrap interval can be constructed
  // for many statistics, even without a simple SE formula.
  // ---------------------------------------------------------------

  const flexibleWorkflow = workflowPicture({
    statistic: 'estimate',
    showNet: true
  });

  await until(S(29));
  await play(
    ...picture(flexibleWorkflow),
    ...say('BUILD INTERVALS WITHOUT A SPECIAL SE FORMULA', C.green),
    ...fbox([
      'Calculate a statistic',
      'in every resample.',
      ['Read its percentiles.', C.green],
      'Check that the method fits.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 30: Medians, waiting-time percentiles and ratios
  // use the same resampling recipe.
  // ---------------------------------------------------------------

  const applications = applicationsPicture();

  await until(S(30));
  await play(
    ...picture(applications),
    ...say('MEDIANS · PERCENTILES · RATIOS'),
    ...fbox([
      'Different statistics',
      'Same bootstrap process',
      ['Compute, sort, read.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 31: Common trap.
  // ---------------------------------------------------------------

  const trapPicture = new M.VGroup(
    txt(
      'AN EXACT ANSWER?',
      P ? 30 : 27,
      GOLD,
      [CX, P ? 0.42 : 0.40, 0],
      true
    ),

    txt(
      'The endpoints are estimated too.',
      P ? 22 : 20,
      C.ink,
      [CX, P ? -0.32 : -0.32, 0]
    ),

    net(
      closeX,
      PERCENTILE_LO,
      PERCENTILE_HI,
      P ? -1.57 : -1.34,
      C.green,
      0.16
    ),

    txt(
      '27',
      P ? 22 : 20,
      C.green,
      [closeX(27), P ? -2.02 : -1.79, 0],
      true
    ),

    txt(
      '33',
      P ? 22 : 20,
      C.green,
      [closeX(33), P ? -2.02 : -1.79, 0],
      true
    )
  );

  await until(S(31));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'Bootstrap intervals',
      'are approximations.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 32: Small samples can produce lumpy and lopsided piles.
  // The estimated endpoints can be inaccurate.
  // ---------------------------------------------------------------

  const unevenPile = lopsidedPilePicture();

  await until(S(32));
  await play(
    ...picture(unevenPile),
    ...say('SMALL SAMPLES CAN GIVE UNRELIABLE ENDS', GOLD),
    ...fbox([
      'Small original sample',
      'Lumpy or uneven pile',
      ['Percentile endpoints', GOLD],
      ['may be inaccurate.', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 33: Treat 27 to 33 as approximate.
  // Collect more real data if the decision is important.
  // ---------------------------------------------------------------

  const approximateInterval = intervalPicture({
    approximate: true
  });

  await until(S(33));
  await play(
    ...picture(approximateInterval),
    ...say('27 TO 33 IS AN APPROXIMATE INTERVAL', GOLD),
    ...fbox([
      ['Approx. 27–33 minutes', C.green],
      'Only 16 real deliveries',
      ['Important decision?', GOLD],
      'Collect more data.'
    ], GOLD)
  );

  await until(S(33) + 3.0);

  const additionalData = moreDataPicture();

  await play(
    ...picture(additionalData),
    ...fbox([
      'More real observations',
      'can improve the estimate.',
      ['Not just more resamples.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 34: Run enough resamples.
  // A few hundred yield shaky percentile estimates.
  // Thousands improve Monte Carlo precision.
  // ---------------------------------------------------------------

  const enoughResamples = resampleCountComparison();

  await until(S(34));
  await play(
    ...picture(enoughResamples),
    ...say('USE THOUSANDS OF RESAMPLES', C.green),
    ...fbox([
      '200 draws: 5 per tail',
      '10,000: 250 per tail',
      ['More stable percentiles', C.green],
      'Same original data'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 35: Preview what goes wrong when deliveries are not independent.
  // Do not reveal the actual day structure before lesson 6.2.8.
  // ---------------------------------------------------------------

  const dependentPreview = independencePreview();

  await until(S(35));
  await play(
    ...picture(dependentPreview),
    ...say('NEXT: WHAT IF OBSERVATIONS ARE RELATED?', GOLD),
    ...fbox([
      'So far, we resampled',
      'individual deliveries.',
      ['What if they are related?', GOLD],
      'Next: cluster bootstrap'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 36: Final one-sentence summary.
  // A percentile bootstrap interval reads the middle 95%
  // of the sorted resampled estimates.
  //
  // First show the actual trimmed histogram, then reveal
  // the completed interval and leave it on screen.
  // ---------------------------------------------------------------

  const finalHistogram = histogramPicture({
    trimLower: true,
    trimUpper: true,
    showMiddle: true,
    showCuts: true,
    showCounts: true,
    showPercentiles: true,
    title: 'The middle 95% of resampled estimates'
  });

  await until(S(36));
  await play(
    ...picture(finalHistogram),
    ...say('PERCENTILE BOOTSTRAP = READ THE MIDDLE 95%', C.green),
    ...fbox([
      'Resample and calculate.',
      'Sort the estimates.',
      ['Read 2.5th and 97.5th', C.green],
      ['percentiles.', C.green]
    ], C.green)
  );

  await until(S(36) + 3.6);

  const finalInterval = intervalPicture({
    showPercentiles: true,
    approximate: true
  });

  await play(
    ...picture(finalInterval),
    ...fbox([
      ['Median estimate = 30', C.violet],
      '95% percentile bootstrap',
      ['27 to 33 minutes', C.green]
    ], C.green)
  );
}
